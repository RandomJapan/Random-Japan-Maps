"""Fabrique la couverture des lieux qui n'en ont pas à partir de leur vidéo du montage, sur ce PC.

Depuis le 2026-10-20, TikTok ne donne plus l'image de couverture d'une vidéo (son oEmbed n'a plus de thumbnail_url,
et sa page intégrée répond souvent 429) : les nouveaux lieux restaient sans image. Or la couverture TikTok n'est
qu'une image de la vidéo, recadrée au centre en 3:4 (vérifié : Ena Gorge, l'image de 14 s ; Naegi, celle de 15 s).
On la refait donc depuis le fichier du montage (VIDEOS_LIEUX, un « <Nom (EN)>.mp4 » ou .mov par lieu, comme
tourner.py) : la plus belle image (nette, colorée, pas en plein mouvement, et pas un plan à part dont les couleurs
ne ressemblent pas au reste de la vidéo), passé le plongeon Google Earth du début, ou l'instant demandé.
Le fichier est trouvé par son nom (sans accents ni majuscules), sinon par un nom contenu dans l'autre (« Daisen » pour
« Mount Daisen ») s'il n'y en a qu'un ; s'il s'appelle autrement, on le donne.

Ces couvertures sont notées dans site/data/couvertures-montage.json : si TikTok redonne un jour la vraie
couverture (celle choisie dans l'appli), telecharger_couvertures.py la met à leur place chaque nuit, sauf pour
celles que le propriétaire a demandées dans Vignettes.txt.

À la main :  python outils/couvertures_montage.py                   (tous les lieux sans couverture)
             python outils/couvertures_montage.py "Lake Kagami=31.5"  (cette image-là pour ce lieu)
             python outils/couvertures_montage.py "Udo Inari Shrine=Inari shrine.mp4@12"  (ce fichier ; sans @, la plus belle)
             puis commit et push. Une planche des images candidates va dans le dossier temporaire, pour vérifier.
Tout seul :  pythonw outils/couvertures_montage.py --publier, toutes les 30 min par la tâche Windows « Vignettes
             carte Japon », dans un clone à part du dépôt (marqué par .git/vignettes-auto) : il se remet sur
             origin/main, fait les couvertures qui manquent et celles demandées dans Vignettes.txt (dans le dossier
             du montage, une ligne « Nom = secondes » ou « Nom = fichier @ secondes »), pousse, et prévient par une
             notification Windows. Journal : journal-vignettes.txt à côté du clone.
Il faut Pillow, numpy et ffmpeg (celui du système, sinon pip install imageio-ffmpeg).
"""
import csv
import io
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
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
DEMANDES = VIDEOS_LIEUX / "Vignettes.txt"
EXTENSIONS = {".mp4", ".mov"}
LARGEUR = 540  # comme telecharger_couvertures.py
PAS = 0.5  # s entre deux images candidates
PLONGEON = 4.5  # s : le plongeon Google Earth qui ouvre presque chaque vidéo
A_PART = 1.12  # un plan dont les couleurs sont plus loin du reste que 1,12 × l'écart habituel est écarté
REPOS_FICHIER = 600  # s : une vidéo modifiée depuis moins longtemps est peut-être encore en train d'être exportée
L, H = 216, 288  # taille des candidates (3:4)
RECADRAGE = "crop=w='min(iw,ih*3/4)':h='min(ih,iw*4/3)'"  # le centre en 3:4, toute la largeur d'une vidéo en hauteur
SANS_FENETRE = getattr(subprocess, "CREATE_NO_WINDOW", 0)  # lancé par pythonw : pas de fenêtre noire qui clignote
DOUCEMENT = SANS_FENETRE | getattr(subprocess, "BELOW_NORMAL_PRIORITY_CLASS", 0)  # ne pas gêner le montage en cours


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


def lire_demande(ligne):
    """« Nom = 31.5 », « Nom = fichier.mp4 @ 12 » ou « Nom = fichier.mp4 » -> (clé du nom, fichier, instant)."""
    nom, _, v = ligne.rpartition("=")
    v = v.strip()
    if "@" in v:
        fichier, _, instant = (x.strip() for x in v.rpartition("@"))
    elif re.fullmatch(r"[\d.,]+", v):
        fichier, instant = "", v
    else:
        fichier, instant = v, ""
    return cle(nom), (fichier or None, float(instant.replace(",", ".")) if instant else None)


def demandes(arguments):
    """Les choix faits à la main : sur la ligne de commande, puis dans Vignettes.txt (ceux-là marqués « main »)."""
    choix = {k: (f, t, False) for k, (f, t) in map(lire_demande, arguments)}
    if DEMANDES.exists():
        for ligne in DEMANDES.read_text(encoding="utf-8-sig", errors="replace").splitlines():
            ligne = ligne.strip()
            if ligne and not ligne.startswith("#") and "=" in ligne:
                try:
                    k, (f, t) = lire_demande(ligne)
                    choix.setdefault(k, (f, t, True))
                except ValueError:
                    print(f"  Vignettes.txt : ligne pas comprise : {ligne}")
    return choix


def trouver_video(nom, fichiers, noms_du_tableau):
    """Le fichier du lieu : même nom, sinon un seul nom contenu dans l'autre, parmi ceux d'aucun autre lieu."""
    k = cle(nom)
    if k in fichiers:
        return fichiers[k]
    libres = [f for c, f in fichiers.items() if c not in noms_du_tableau and len(c) >= 6 and (c in k or k in c)]
    return libres[0] if len(libres) == 1 else None


def candidates(video):
    """Une image toutes les PAS s, recadrée au centre en 3:4, comme la couverture TikTok."""
    cmd = [ffmpeg(), "-v", "error", "-i", str(video), "-vf", f"fps={1 / PAS},{RECADRAGE},scale={L}:{H}",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    brut = subprocess.run(cmd, capture_output=True, check=True, creationflags=DOUCEMENT).stdout
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


def signature(im):
    """Les couleurs d'une image, grossièrement (4 × 4 × 4 cases)."""
    h = np.histogramdd(im.reshape(-1, 3).astype(np.float32) / 256, bins=4, range=[(0, 1)] * 3)[0].ravel()
    return h / h.sum()


def choisir(nom, video):
    """Les 6 plus belles images (au moins 3 s d'écart), la meilleure d'abord ; et la planche pour vérifier.
    Un plan à part (le mont Fuji au milieu de la vidéo de l'étang Kagami) est écarté : ses couleurs sont loin de
    celles du reste de la vidéo."""
    ims = candidates(video)
    n = len(ims)
    f = ims.astype(np.float32)
    ks = list(range(int(PLONGEON / PAS), max(int(PLONGEON / PAS) + 1, n - int(2 / PAS))))
    s = np.array([signature(ims[k]) for k in ks])
    ecart = np.median(np.abs(s[:, None] - s[None]).sum(-1), axis=1)
    garder = ecart <= np.median(ecart) * A_PART
    notes = sorted(((note(f[k], f[k - 1], f[min(k + 1, n - 1)]), k) for i, k in enumerate(ks) if garder[i]),
                   reverse=True)
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
           "-vf", RECADRAGE, "-f", "image2pipe", "-vcodec", "png", "-"]
    png = subprocess.run(cmd, capture_output=True, check=True, creationflags=DOUCEMENT).stdout
    im = Image.open(io.BytesIO(png)).convert("RGB")
    im = im.resize((LARGEUR, round(im.height * LARGEUR / im.width)), Image.LANCZOS)
    im.save(cible, "JPEG", quality=82, optimize=True, progressive=True)


def faire(arguments, tout_seul=False):
    """Fait les couvertures qui manquent et celles demandées. Renvoie les lieux faits et ceux sans vidéo trouvée."""
    choix = demandes(arguments)
    sauvegarder_tableau.main()  # les lieux ajoutés depuis la dernière nuit
    notes = json.loads(NOTES.read_text(encoding="utf-8")) if NOTES.exists() else {}
    fichiers = ({cle(f.stem): f for f in VIDEOS_LIEUX.iterdir() if f.suffix.lower() in EXTENSIONS}
                if VIDEOS_LIEUX.is_dir() else {})
    if not fichiers:
        print(f"Pas de vidéos dans {VIDEOS_LIEUX}")
    with LIEUX.open(encoding="utf-8") as f:
        lignes = [(re.search(r"video/(\d+)", l.get("Lien TikTok") or ""), (l.get("Nom (EN)") or "").strip())
                  for l in csv.DictReader(f)]
    lignes = [(m.group(1), nom) for m, nom in lignes if m and nom]
    noms_du_tableau = {cle(nom) for _, nom in lignes}
    faites, sans_video = [], []
    for numero, nom in lignes:
        cible = DOSSIER / f"{numero}.jpg"
        fichier, demande, main = choix.get(cle(nom), (None, None, False))
        deja = notes.get(numero, {})
        if cible.exists():
            if cle(nom) not in choix:
                continue
            # une demande de Vignettes.txt déjà appliquée : rien à refaire
            if main and deja.get("main") and (demande is None or deja.get("instant") == demande) \
                    and (fichier is None or deja.get("video") == fichier):
                continue
        video = VIDEOS_LIEUX / fichier if fichier else trouver_video(nom, fichiers, noms_du_tableau - {cle(nom)})
        if not video or not video.exists():
            print(f"  {nom} : pas de « {fichier or nom + '.mp4'} » dans le dossier du montage")
            sans_video.append((numero, nom))
            continue
        if tout_seul and time.time() - video.stat().st_mtime < REPOS_FICHIER:
            print(f"  {nom} : {video.name} vient d'être modifié, on attend la fin de l'export")
            continue
        try:
            instants, planche = choisir(nom, video)
            instant = demande if demande is not None else instants[0]
            extraire(video, instant, cible)
        except Exception as e:  # une vidéo illisible ne doit pas arrêter les autres
            print(f"  {nom} : {video.name} illisible ({e})")
            continue
        notes[numero] = {"video": video.name, "instant": instant, **({"main": True} if main else {})}
        faites.append(nom)
        print(f"  {nom} : image de {instant:.1f} s de {video.name} -> {cible.name} (autres choix : "
              f"{', '.join(f'{t:.1f}' for t in instants if t != instant)} s ; planche : {planche})")
    NOTES.write_text(json.dumps(notes, ensure_ascii=False, indent=1, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{len(faites)} couverture(s) faite(s) depuis le montage")
    return faites, sans_video


def git(*args):
    r = subprocess.run(["git", "-C", str(RACINE), *args], capture_output=True, text=True, encoding="utf-8",
                       creationflags=SANS_FENETRE, env={**os.environ, "GIT_TERMINAL_PROMPT": "0", "GCM_INTERACTIVE": "never"})
    if r.returncode:
        raise RuntimeError(f"git {' '.join(args)} : {(r.stderr or r.stdout).strip()}")
    return r.stdout


def prevenir(titre, texte):
    """Une notification Windows (en bas à droite de l'écran)."""
    ps = ("[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null;"
          "$x = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02);"
          "$t = $x.GetElementsByTagName('text');"
          "$t.Item(0).AppendChild($x.CreateTextNode($env:TITRE_VIGNETTES)) > $null;"
          "$t.Item(1).AppendChild($x.CreateTextNode($env:TEXTE_VIGNETTES)) > $null;"
          "[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("
          "'{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\\WindowsPowerShell\\v1.0\\powershell.exe')"
          ".Show([Windows.UI.Notifications.ToastNotification]::new($x))")
    subprocess.run(["powershell", "-NoProfile", "-NonInteractive", "-Command", ps], capture_output=True,
                   creationflags=SANS_FENETRE, env={**os.environ, "TITRE_VIGNETTES": titre, "TEXTE_VIGNETTES": texte})


def publier():
    """Le passage automatique : dans le clone à part, à jour d'origin/main ; pousse les nouvelles couvertures."""
    if not (RACINE / ".git" / "vignettes-auto").exists():
        sys.exit("--publier ne tourne que dans le clone des vignettes automatiques (il remet le dépôt à zéro)")
    journal = RACINE.parent / "journal-vignettes.txt"
    if journal.exists() and journal.stat().st_size > 500_000:
        journal.write_text(journal.read_text(encoding="utf-8", errors="replace")[-200_000:], encoding="utf-8")
    sys.stdout = sys.stderr = journal.open("a", encoding="utf-8")
    print(f"\n--- {time.strftime('%Y-%m-%d %H:%M')}")
    etat_fichier = RACINE.parent / "etat-vignettes.json"
    etat = json.loads(etat_fichier.read_text(encoding="utf-8")) if etat_fichier.exists() else {"signales": []}
    try:
        try:
            git("rebase", "--abort")  # un passage d'avant arrêté en plein rebase
        except RuntimeError:
            pass
        git("fetch", "-q", "origin", "main")
        git("reset", "-q", "--hard", "origin/main")
        faites, sans_video = faire([], tout_seul=True)
        if faites:
            git("add", "site/photos/tiktok", "site/data")
            git("commit", "-q", "-m", "Vignettes : " + ", ".join(faites))
            try:
                git("push", "-q", "origin", "HEAD:main")
            except RuntimeError:  # le robot de nuit ou une autre mise en ligne est passé entre-temps
                git("fetch", "-q", "origin", "main")
                git("rebase", "-q", "origin/main")
                git("push", "-q", "origin", "HEAD:main")
            print("poussé")
            prevenir("Carte du Japon : vignette ajoutée" if len(faites) == 1 else "Carte du Japon : vignettes ajoutées",
                     f"{', '.join(faites)} : en ligne dans 2 minutes.")
        # un lieu récent (vidéo de moins de 14 jours) dont la vidéo n'est pas dans le dossier : on le dit, une fois
        recents = [(n, nom) for n, nom in sans_video
                   if time.time() - (int(n) >> 32) < 14 * 86400 and n not in etat["signales"]]
        if recents:
            prevenir("Carte du Japon : vignette en attente",
                     "Pas de vidéo à ce nom dans le dossier du montage : "
                     + ", ".join(f"« {nom} »" for _, nom in recents)
                     + ". Renomme le fichier comme dans Nom (EN), ou écris-le dans Vignettes.txt.")
            etat["signales"] += [n for n, _ in recents]
            etat_fichier.write_text(json.dumps(etat), encoding="utf-8")
    except Exception as e:
        print(f"erreur : {e}")


def main():
    if "--publier" in sys.argv:
        publier()
    else:
        faire([a for a in sys.argv[1:] if "=" in a])


if __name__ == "__main__":
    main()
