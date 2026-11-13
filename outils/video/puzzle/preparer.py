"""Rassemble les fichiers de la vidéo « puzzle » (2026-11-12) dans videos/carte/puzzle/public (hors de git), le dossier public du
montage Remotion (outils/video/puzzle/montage).
    python outils/video/puzzle/preparer.py

- L'accroche : la main qui pose la dernière pièce du puzzle de la carte. Higgsfield (Seedance 2.0) n'a jamais su finir le puzzle
  (deux fois, le trou faisait plusieurs pièces et la main posait la sienne à côté) : il a fait le puzzle fini (Nano Banana), puis
  une main qui en soulève une pièce (VP2a1, dans videos/higgsfield/videos), qu'on passe ici à l'envers. Réencodée en 1080 × 1920,
  une image clé toutes les 6 (voir « The Higgsfield videos » dans instructions/videos.md).
- Le son de l'accroche (sfx/geste.wav) : les sons des essais de Seedance, à l'endroit (à l'envers, chaque bruit enflait puis
  s'arrêtait net) : le souffle de la pièce, un clic de carton sur l'image où la pièce rentre, le pouce qui l'appuie.
    python -c "import preparer; preparer.geste()"   (dans outils/video/puzzle : refait seulement ce son)
- Tout le reste vient de la vidéo « sceau » (videos/carte/sceau/public) : les prises de la carte et de la balade, le vrai plan des
  dunes, l'interface, les bruitages, le logo.
"""
import json
import shutil
import subprocess
from pathlib import Path

import numpy as np

ICI = Path(__file__).resolve().parent
RACINE = ICI.parents[2]
VIDEOS = RACINE / 'videos'
PUBLIC = VIDEOS / 'carte' / 'puzzle' / 'public'
SCEAU = VIDEOS / 'carte' / 'sceau' / 'public'
SOURCES = VIDEOS / 'higgsfield' / 'videos'

# les plans de l'accroche : leur nom dans le montage → (le fichier de Higgsfield, à l'envers ?)
PLANS = {'piece-envers': ('VP2a1', True)}
# ce qu'on reprend du sceau (dossier → fichiers ; tout le dossier si None)
DU_SCEAU = {
    'rushes': ('ja-mer', 'ja-legende', 'ja-route', 'p-printemps', 'p-ete', 'p-automne', 'p-hiver', 'sc-plongee', 'sc-tottori', 'sc-ville',
               'sc-jour', 'sc-nuit', 'tt-escalier', 'tt-planche-2', 'kk-feux'),
    'reels': ('tottori',),
    'ui': None,
    'sfx': None,
}


def ffmpeg():
    return shutil.which('ffmpeg') or __import__('imageio_ffmpeg').get_ffmpeg_exe()


def copier(src, dest):
    dest.parent.mkdir(parents=True, exist_ok=True)
    if not dest.exists() or dest.stat().st_mtime < src.stat().st_mtime:
        shutil.copy2(src, dest)


def clip(nom):
    """Un plan de Higgsfield : recadré en 1080 × 1920, sans son, une image clé toutes les 6 images (le montage le joue image par
    image), à l'envers s'il le faut."""
    source, envers = PLANS[nom]
    subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', '-i', str(SOURCES / f'{source}.mp4'),
                    # (du 720p agrandi : un peu de piqué, comme la fléchette)
                    '-vf', ('reverse,' if envers else '') + 'scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1920,unsharp=5:5:0.35,format=yuv420p',
                    '-c:v', 'libx264', '-preset', 'medium', '-crf', '15', '-g', '6', '-an', '-color_range', 'tv', '-colorspace', 'bt709',
                    '-color_primaries', 'bt709', '-color_trc', 'bt709', str(PUBLIC / 'clips' / f'{nom}.mp4')], check=True)


# Le son de l'accroche (refait le 2026-11-13, le propriétaire : « Juste le son du début quand il pose la pièce est mal fait »). Le
# premier était le son du plan à l'envers, comme son image : chaque bruit y enflait puis s'arrêtait net (le clic montait pendant
# 6 images avant que la pièce rentre), et le limiteur fort remontait les grattements des doigts, à l'envers eux aussi, presque au
# niveau du clic (−12 dB, une demi-seconde après lui). Tout est maintenant à l'endroit, pris dans les sons des quatre essais de
# Seedance (la même pièce, la même table) :
# - le souffle de la pièce : les passages calmes de VP2a1 mis bout à bout, du début jusqu'à l'éclat de la musique, sans saut ;
# - le clic : celui de VP2a2 (du carton : 1,2 kHz ; le pop de VP2a1 était sourd, presque tout sous 200 Hz, perdu sur un téléphone),
#   avec l'attaque sèche de VP2b2 dessous, son sommet sur l'image où la pièce est rentrée ;
# - le pouce qui appuie la pièce, juste après : le frottement de VP2a1, bien en dessous.
ACCROCHE = json.loads((ICI / 'montage' / 'src' / 'accroche.json').read_text(encoding='utf-8'))['morceaux']
FIN_GESTE = 250  # image : le temps 12 de la musique, où elle éclate (la vidéo commence à son temps 2 : voir theme.ts)
SOUFFLE = ('VP2a1', ((2.66, 3.84), (0.20, 1.10), (1.50, 1.84)))  # (secondes du fichier, sans aucun choc)
NIVEAU_SOUFFLE = -44  # dBFS efficaces (le clic culmine à −1 dB)
CLIC = (('VP2a2', 2.159, 0), ('VP2b2', 1.897, -8))  # (fichier, seconde de son sommet, dB)
# Le clic : sur la première image du plan à l'envers où la pièce est dans son trou (sa 37e, 1,542 s : sur la 36e, le bois de la
# table se voit encore dessous ; l'image 43 de la vidéo). Son sommet une image plus tard : sa montée (25 ms) commence ainsi sur
# cette image (mesuré dans le MP4 fini : le clic part à l'image 42,8 et culmine à 44,3).
POSE = 37 / 24
APRES = 1
COMPRESSION = 0.6  # le limiteur du clic seul (−4,4 dB sur son sommet : il prend du corps)
FROTTEMENT = ('VP2a1', 1.86, 2.24, -16, 8)  # (fichier, de, à (s), dB sous le sommet du clic, images après lui)


def son_brut(source, sr):
    """Le son d'un fichier de Higgsfield, à l'endroit (stéréo, sr)."""
    r = subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-i', str(SOURCES / f'{source}.mp4'), '-vn', '-ac', '2', '-ar', str(sr),
                        '-f', 'f32le', '-'], capture_output=True, check=True)
    return np.frombuffer(r.stdout, dtype=np.float32).reshape(-1, 2)


def fondre(x, entree, sortie, sr):
    """Fondus en cosinus (secondes) au début et à la fin."""
    x = x.copy()
    for n, sens in ((int(entree * sr), 1), (int(sortie * sr), -1)):
        if n:
            c = (0.5 - 0.5 * np.cos(np.linspace(0, np.pi, n, dtype=np.float32)))[:, None]
            if sens > 0:
                x[:n] *= c
            else:
                x[-n:] *= c[::-1]
    return x


def limiter(x, limite, sr):
    return np.frombuffer(subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-f', 'f32le', '-ar', str(sr), '-ac', '2', '-i', '-',
                                         '-af', f'alimiter=limit={limite}:attack=0.5:release=30:level=false:latency=1', '-f', 'f32le', '-'],
                                        input=np.ascontiguousarray(x, dtype=np.float32).tobytes(), capture_output=True, check=True).stdout,
                         dtype=np.float32).reshape(-1, 2).copy()


def souffle(n, sr):
    """n échantillons du souffle de la pièce : ses passages calmes enchaînés en fondus de puissance constante (80 ms)."""
    source, passages = SOUFFLE
    son = son_brut(source, sr)
    morceaux = [son[int(a * sr):int(b * sr)] for a, b in passages]
    x = int(0.08 * sr)
    monte = np.sin(np.linspace(0, np.pi / 2, x, dtype=np.float32))[:, None]
    sortie, i = morceaux[0], 1
    while len(sortie) < n:
        m = morceaux[i % len(morceaux)]
        i += 1
        sortie = np.concatenate([sortie[:-x], sortie[-x:] * monte[::-1] + m[:x] * monte, m[x:]])
    return sortie[:n]


def clic(sr):
    """Le clic, son sommet à 30 ms du début, déjà à −1 dB."""
    avant, apres = int(0.03 * sr), int(0.22 * sr)
    total = np.zeros((avant + apres, 2), dtype=np.float32)
    for source, sommet, db in CLIC:
        son = son_brut(source, sr)
        i = int(sommet * sr)
        i += int(np.abs(son[i - avant:i + avant]).sum(1).argmax()) - avant  # (le sommet exact, à l'échantillon près)
        m = son[i - avant:i + apres]
        total += m / np.abs(m).max() * 10 ** (db / 20)
    total = fondre(total, 0.006, 0.08, sr)
    total = limiter(total / np.abs(total).max(), COMPRESSION, sr)
    return total * 10 ** (-1 / 20) / np.abs(total).max()


def geste():
    """Le son de l'accroche (sfx/geste.wav, de l'image 0 à l'éclat de la musique) : le souffle de la pièce, le clic, le pouce."""
    sr = 48000
    n = round(FIN_GESTE / 60 * sr)
    bruit = souffle(n, sr)
    sortie = bruit * (10 ** (NIVEAU_SOUFFLE / 20) / np.sqrt((bruit ** 2).mean()))
    sortie = fondre(sortie, 0.01, 0, sr)
    # le clic : l'image où la pièce est rentrée, dans la vidéo (le premier morceau de accroche.json joue le plan dès sa seconde s0)
    s0 = ACCROCHE[0]['s0']
    image_pose = int(np.ceil((POSE - s0) * 60)) + ACCROCHE[0]['f0']
    c = clic(sr)
    debut = round((image_pose + APRES) / 60 * sr) - int(0.03 * sr)
    sortie[debut:debut + len(c)] += c
    # le pouce qui appuie la pièce
    source, a, z, db, apres = FROTTEMENT
    f = fondre(son_brut(source, sr)[int(a * sr):int(z * sr)], 0.015, 0.06, sr)
    f *= 10 ** ((-1 + db) / 20) / np.abs(f).max()
    debut = round((image_pose + APRES + apres) / 60 * sr)
    sortie[debut:debut + len(f)] += f[:len(sortie) - debut]
    sortie *= 10 ** (-1 / 20) / max(np.abs(sortie).max(), 10 ** (-1 / 20))
    subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', '-f', 'f32le', '-ar', str(sr), '-ac', '2', '-i', '-', '-c:a', 'pcm_s16le',
                    str(PUBLIC / 'sfx' / 'geste.wav')], input=np.ascontiguousarray(sortie, dtype=np.float32).tobytes(), check=True)
    print('la pièce rentre sur l\'image', image_pose, ': le clic culmine à', image_pose + APRES)


def main():
    for dossier in ('rushes', 'reels', 'clips', 'ui', 'sfx', 'musique'):
        (PUBLIC / dossier).mkdir(parents=True, exist_ok=True)
    for dossier, noms in DU_SCEAU.items():
        fichiers = [SCEAU / dossier / f'{n}.mp4' for n in noms] if noms else [f for f in (SCEAU / dossier).iterdir() if f.is_file()]
        for f in fichiers:
            if f.name != 'geste.wav':  # (le son de l'accroche du sceau)
                copier(f, PUBLIC / dossier / f.name)
    for nom in PLANS:
        clip(nom)
    geste()
    print('bruitages et prises prêts dans', PUBLIC)


if __name__ == '__main__':
    main()
