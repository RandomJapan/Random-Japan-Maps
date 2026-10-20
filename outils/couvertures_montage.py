"""Fabrique la couverture des lieux qui n'en ont pas à partir de leur vidéo du montage, sur ce PC.

Depuis le 2026-10-20, TikTok ne donne plus l'image de couverture d'une vidéo (son oEmbed n'a plus de thumbnail_url,
et sa page intégrée répond souvent 429) : les nouveaux lieux restaient sans image. Or la couverture TikTok n'est
qu'une image de la vidéo, recadrée au centre en 3:4 (vérifié : Ena Gorge, l'image de 14 s ; Naegi, celle de 15 s).
On la refait donc depuis le fichier du montage (VIDEOS_LIEUX, un « <Nom (EN)>.mp4 » par lieu, comme tourner.py) :
la plus belle image (nette, colorée, pas en plein mouvement), passé le plongeon Google Earth du début, ou l'instant
donné à la main. Le fichier est trouvé par son nom (sans accents ni majuscules) ; s'il s'appelle autrement, on le donne.

Ces couvertures sont notées dans site/data/couvertures-montage.json : si TikTok redonne un jour la vraie
couverture (celle choisie dans l'appli), telecharger_couvertures.py la met à leur place chaque nuit.

Lancer :  python outils/couvertures_montage.py                   (tous les lieux sans couverture)
          python outils/couvertures_montage.py "Lake Kagami=31.5"  (cette image-là pour ce lieu)
          python outils/couvertures_montage.py "Udo Inari Shrine=Inari shrine.mp4@12"  (ce fichier, à 12 s ; sans @, la plus belle)
Il faut Pillow, numpy et ffmpeg (celui du système, sinon pip install imageio-ffmpeg). Puis commit et push.
Une planche des images candidates est écrite dans le dossier temporaire du système, pour vérifier le choix.
"""
import csv
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unicodedata
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
import sauvegarder_tableau  # noqa: E402

RACINE = Path(__file__).resolve().parent.parent
LIEUX = RACINE / "site" / "data" / "secours-lieux.csv"
DOSSIER = RACINE / "site" / "photos" / "tiktok"
NOTES = RACINE / "site" / "data" / "couvertures-montage.json"
VIDEOS_LIEUX = Path(os.environ.get("VIDEOS_LIEUX", r"D:\Montage\Vidéo lieux random japon"))
LARGEUR = 540  # comme telecharger_couvertures.py
PAS = 0.5  # s entre deux images candidates
PLONGEON = 4.5  # s : le plongeon Google Earth qui ouvre presque chaque vidéo
L, H = 216, 288  # taille des candidates (3:4)


def ffmpeg():
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    import imageio_ffmpeg  # pip install imageio-ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


def cle(texte):
    """Un nom sans accents, majuscules ni ponctuation, pour retrouver le fichier du lieu."""
    t = unicodedata.normalize("NFKD", texte).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]", "", t)


def candidates(video):
    """Une image toutes les PAS s, recadrée au centre en 3:4 (toute la largeur), comme la couverture TikTok."""
    cmd = [ffmpeg(), "-v", "error", "-i", str(video), "-vf", f"fps={1 / PAS},crop=iw:iw*4/3,scale={L}:{H}",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    brut = subprocess.run(cmd, capture_output=True, check=True).stdout
    n = len(brut) // (L * H * 3)
    return np.frombuffer(brut[: n * L * H * 3], dtype=np.uint8).reshape(n, H, L, 3)


def note(im, avant, apres):
    """Nette, colorée, bien exposée et immobile (une image prise en plein mouvement est floue)."""
    f = im.astype(np.float32)
    g = f.mean(axis=2)
    lap = g[1:-1, 1:-1] * 4 - g[:-2, 1:-1] - g[2:, 1:-1] - g[1:-1, :-2] - g[1:-1, 2:]
    rg = f[..., 0] - f[..., 1]
    jb = (f[..., 0] + f[..., 1]) / 2 - f[..., 2]
    couleur = np.hypot(rg.std(), jb.std()) + 0.3 * np.hypot(rg.mean(), jb.mean())
    expo = 1 - min(1, abs(g.mean() - 120) / 120)
    mouvement = (np.abs(f - avant).mean() + np.abs(f - apres).mean()) / 2
    return np.sqrt(lap.var()) * 0.6 + couleur * 0.8 + expo * 20 - mouvement * 0.8


def choisir(nom, video):
    """Les 6 plus belles images (au moins 3 s d'écart), la meilleure d'abord ; et la planche pour vérifier."""
    ims = candidates(video)
    n = len(ims)
    f = ims.astype(np.float32)
    notes = sorted(((note(f[k], f[k - 1], f[min(k + 1, n - 1)]), k)
                    for k in range(int(PLONGEON / PAS), max(int(PLONGEON / PAS) + 1, n - int(2 / PAS)))), reverse=True)
    gardes = []
    for _, k in notes:
        if all(abs(k - j) * PAS >= 3 for j in gardes):
            gardes.append(k)
        if len(gardes) == 6:
            break
    planche = Image.new("RGB", (L * len(gardes), H + 18), "white")
    d = ImageDraw.Draw(planche)
    for i, k in enumerate(gardes):
        planche.paste(Image.fromarray(ims[k]), (i * L, 18))
        d.text((i * L + 4, 3), f"{k * PAS:.1f} s", fill="black")
    chemin = Path(tempfile.gettempdir()) / f"couverture-{cle(nom)}.jpg"
    planche.save(chemin, quality=85)
    return [k * PAS for k in gardes], chemin


def extraire(video, instant, cible):
    """L'image de la vidéo à cet instant, en pleine définition, recadrée en 3:4 et réduite à LARGEUR."""
    cmd = [ffmpeg(), "-v", "error", "-ss", f"{instant:.3f}", "-i", str(video), "-frames:v", "1",
           "-vf", "crop=iw:iw*4/3", "-f", "image2pipe", "-vcodec", "png", "-"]
    im = Image.open(__import__("io").BytesIO(subprocess.run(cmd, capture_output=True, check=True).stdout)).convert("RGB")
    im = im.resize((LARGEUR, round(im.height * LARGEUR / im.width)), Image.LANCZOS)
    im.save(cible, "JPEG", quality=82, optimize=True, progressive=True)


def main():
    choix = {}  # nom du lieu -> (fichier ou None, instant ou None)
    for arg in sys.argv[1:]:
        nom, _, v = arg.rpartition("=")
        fichier, _, instant = v.rpartition("@") if "@" in v else (("", "", v) if re.fullmatch(r"[\d.,]+", v) else (v, "", ""))
        choix[cle(nom)] = (fichier or None, float(instant.replace(",", ".")) if instant else None)
    sauvegarder_tableau.main()  # les lieux ajoutés depuis la dernière nuit
    notes = json.loads(NOTES.read_text(encoding="utf-8")) if NOTES.exists() else {}
    fichiers = {cle(f.stem): f for f in VIDEOS_LIEUX.glob("*.mp4")} if VIDEOS_LIEUX.is_dir() else {}
    if not fichiers:
        print(f"Pas de vidéos dans {VIDEOS_LIEUX}")
    faites = 0
    with LIEUX.open(encoding="utf-8") as f:
        for ligne in csv.DictReader(f):
            m = re.search(r"video/(\d+)", ligne.get("Lien TikTok") or "")
            nom = (ligne.get("Nom (EN)") or "").strip()
            if not m or not nom:
                continue
            numero, cible = m.group(1), DOSSIER / f"{m.group(1)}.jpg"
            if cible.exists() and cle(nom) not in choix:
                continue
            fichier, demande = choix.get(cle(nom), (None, None))
            video = VIDEOS_LIEUX / fichier if fichier else fichiers.get(cle(nom))
            if not video or not video.exists():
                print(f"  {nom} : pas de « {fichier or nom + '.mp4'} » dans le dossier du montage")
                continue
            instants, planche = choisir(nom, video)
            instant = demande if demande is not None else instants[0]
            extraire(video, instant, cible)
            notes[numero] = {"video": video.name, "instant": instant}
            faites += 1
            print(f"  {nom} : image de {instant:.1f} s -> {cible.name} (autres choix : "
                  f"{', '.join(f'{t:.1f}' for t in instants if t != instant)} s ; planche : {planche})")
    NOTES.write_text(json.dumps(notes, ensure_ascii=False, indent=1, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{faites} couverture(s) faite(s) depuis le montage")


if __name__ == "__main__":
    main()
