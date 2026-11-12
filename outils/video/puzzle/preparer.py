"""Rassemble les fichiers de la vidéo « puzzle » (2026-11-12) dans videos/carte/puzzle/public (hors de git), le dossier public du
montage Remotion (outils/video/puzzle/montage).
    python outils/video/puzzle/preparer.py

- L'accroche : la main qui pose la dernière pièce du puzzle de la carte. Higgsfield (Seedance 2.0) n'a jamais su finir le puzzle
  (deux fois, le trou faisait plusieurs pièces et la main posait la sienne à côté) : il a fait le puzzle fini (Nano Banana), puis
  une main qui en soulève une pièce (VP2a1, dans videos/higgsfield/videos), qu'on passe ici à l'envers. Réencodée en 1080 × 1920,
  une image clé toutes les 6 (voir « The Higgsfield videos » dans instructions/videos.md).
- Le son de l'accroche (sfx/geste.wav) : le son d'origine du plan, à l'envers lui aussi (le « pop » de la pièce qu'on arrache
  devient le clic de la pièce qui rentre), coupé comme lui.
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


# Le son de l'accroche : les morceaux des plans, coupés comme dans le montage (montage/src/accroche.json : le fichier, sa seconde à la
# première image, les images de début et de fin dans la vidéo, la vitesse ; une vitesse 0 : l'image arrêtée, sur le souffle de la
# pièce)
ACCROCHE = json.loads((ICI / 'montage' / 'src' / 'accroche.json').read_text(encoding='utf-8'))['morceaux']
# (dB par plan)
GAINS = {'piece-envers': 0}
FIN_GESTE = 250  # image : le temps 12 de la musique, où elle éclate (la vidéo commence à son temps 2 : voir theme.ts)
# Images : à 24 images/s, l'image d'un choc arrive juste après lui dans le son d'origine (mesuré sur la jarre : 2 images à 60).
RETARD = 2
# (images, dB) : des nuances à la main, si un bruit couvre le geste qu'on doit entendre
NUANCES = ()
# Le limiteur, avant de tout remonter à −1 dB : le clic de la pièce (−6 dB) est bien plus fort que le reste (la main, la pièce qui
# frotte : −30 à −45 dB ; la fléchette : 0,12 ; le sceau : 0,08).
LIMITE = 0.12


def son_de(plan, sr):
    """Le son d'un plan (stéréo, sr), à l'envers comme son image, ou None s'il n'en a pas."""
    source, envers = PLANS[plan]
    r = subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-i', str(SOURCES / f'{source}.mp4'), '-vn', '-ac', '2', '-ar', str(sr)]
                       + (['-af', 'areverse'] if envers else []) + ['-f', 'f32le', '-'], capture_output=True)
    return np.frombuffer(r.stdout, dtype=np.float32).reshape(-1, 2) if r.returncode == 0 and r.stdout else None


def geste():
    """Le son de l'accroche. Seedance génère le son avec l'image : la main, la pièce qui frotte et qui sort (ici, qui rentre) y
    tombent déjà avec l'image. On le prend tel quel, coupé comme l'image (la leçon de la jarre : les bruitages posés à la main
    sonnaient faux), puis un limiteur fort qui fait monter tous les petits bruits. L'image arrêtée reçoit le souffle de la pièce
    (piece.wav)."""
    sr = 48000
    sortie = np.zeros((round(FIN_GESTE / 60 * sr), 2), dtype=np.float32)
    fondu = np.linspace(0, 1, int(0.004 * sr), dtype=np.float32)[:, None]
    piece = None
    for m in ACCROCHE:
        f0, f1, v = m['f0'], min(m['f1'], FIN_GESTE), m['v']
        son = son_de(m['clip'], sr) if v > 0 else None
        n = round((f1 - f0) / 60 * sr)
        if son is None:
            if piece is None:
                brut = subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-i', str(PUBLIC / 'sfx' / 'piece.wav'), '-ac', '2', '-ar', str(sr), '-f', 'f32le', '-'],
                                      capture_output=True, check=True).stdout
                piece = np.frombuffer(brut, dtype=np.float32).reshape(-1, 2)
            morceau = np.resize(piece, (n, 2)).astype(np.float32) * 0.3  # (le souffle de la pièce, au niveau de celui du plan)
        else:
            son = son[int(m['s0'] * sr):int((m['s0'] + (f1 - f0) / 60 * v) * sr)]
            x = np.linspace(0, len(son) - 1, n)
            morceau = np.column_stack([np.interp(x, np.arange(len(son)), son[:, c]) for c in (0, 1)]).astype(np.float32)
        morceau *= 10 ** (GAINS.get(m['clip'], 0) / 20)
        morceau[:len(fondu)] *= fondu
        morceau[-len(fondu):] *= fondu[::-1]
        debut = round((f0 + RETARD) / 60 * sr)
        fin = min(len(sortie), debut + n)
        sortie[debut:fin] += morceau[:fin - debut]
    sortie = np.frombuffer(subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-f', 'f32le', '-ar', str(sr), '-ac', '2', '-i', '-',
                                           '-af', f'alimiter=limit={LIMITE}:attack=1:release=40:level=false:latency=1', '-f', 'f32le', '-'],
                                          input=sortie.tobytes(), capture_output=True, check=True).stdout, dtype=np.float32).reshape(-1, 2).copy()
    enveloppe = np.ones(len(sortie), dtype=np.float32)
    for a, z, db in NUANCES:
        enveloppe[round(a / 60 * sr):round(z / 60 * sr)] = 10 ** (db / 20)
    enveloppe = np.convolve(enveloppe, np.ones(240, dtype=np.float32) / 240, mode='same')  # (5 ms de transition)
    sortie *= enveloppe[:, None]
    sortie *= 10 ** (-1 / 20) / np.abs(sortie).max()
    subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', '-f', 'f32le', '-ar', str(sr), '-ac', '2', '-i', '-', '-c:a', 'pcm_s16le', str(PUBLIC / 'sfx' / 'geste.wav')],
                   input=sortie.tobytes(), check=True)


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
