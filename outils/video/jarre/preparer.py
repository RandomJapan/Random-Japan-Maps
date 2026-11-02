"""Rassemble les fichiers de la vidéo « jarre » (2026-11-02) dans videos/carte/jarre/public (hors de git), le dossier public du
montage Remotion (outils/video/jarre/montage).
    python outils/video/jarre/preparer.py

- L'accroche : les deux plans de la jarre, générés avec Flora à partir de ses images (dans sources/ : voir « The jar video » dans
  instructions/videos.md), réencodés (1080 × 1920, 24 images/s comme à la source, une image clé toutes les 6) ; l'image où la jarre est
  grande ouverte, avec son trou transparent (img/jarre-ouverte.png) : le montage plonge dedans.
- Les prises déjà tournées : les quatre saisons (promo30), la balade, les vrais lieux du propriétaire (balade/reels).
- Les bruitages : ceux des vidéos d'avant ; les coups, la fissure, le raclement, le dehors et l'effort sont des bruits Flora (déjà dans
  public/sfx), les coups découpés ici en fichiers séparés (coup-1.wav…).
- Le logo.
"""
import shutil
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ICI = Path(__file__).resolve().parent
RACINE = ICI.parents[2]
VIDEOS = RACINE / 'videos'
PUBLIC = VIDEOS / 'carte' / 'jarre' / 'public'
SOURCES = VIDEOS / 'carte' / 'jarre' / 'sources'

PRISES = {
    'rushes': [VIDEOS / 'carte/promo30/public/rushes-v' / f'{n}.mp4' for n in ('p-printemps', 'p-ete', 'p-automne', 'p-hiver')]
    + [VIDEOS / 'balade/public/rushes' / f'{n}.mp4' for n in ('mt-tunnel', 'tk-barque', 'kk-feux')],
    'reels': [VIDEOS / 'balade/public/reels' / f'{n}.mp4' for n in ('itsukushima', 'aogashima')],
}
SFX = [VIDEOS / 'carte/tunnel/public/sfx' / n for n in ('tap.mp3', 'pop.mp3', 'pops.mp3', 'whoosh-fast.mp3', 'swoosh-quick.mp3', 'bass-hit-short.mp3',
                                                        'air-whoosh-powerful.mp3', 'paper-slide.mp3', 'sparkle-touch.mp3', 'ui-message-pop.mp3',
                                                        'ui-success-soft.mp3', 'transition-snap.mp3', 'shimmer-sparkle-sweep.mp3', 'zoom-air-fast.mp3')] + [
    VIDEOS / 'carte/promo30/public/sfx' / n for n in ('click-camera.mp3', 'impact-deep-whoosh.mp3', 'hit-fast-exciting.mp3', 'de.mp3', 'pinceau.mp3', 'tonnerre.mp3')] + [
    VIDEOS / 'carte/eclat/public/sfx' / 'piece.wav']


def ffmpeg():
    return shutil.which('ffmpeg') or __import__('imageio_ffmpeg').get_ffmpeg_exe()


def copier(src, dest):
    dest.parent.mkdir(parents=True, exist_ok=True)
    if not dest.exists() or dest.stat().st_mtime < src.stat().st_mtime:
        shutil.copy2(src, dest)


def clip(nom):
    """Un plan de Flora : recadré en 1080 × 1920, sans son, une image clé toutes les 6 images (le montage le joue image par image)."""
    subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', '-i', str(SOURCES / f'{nom}.mp4'),
                    # (un peu plus chaud et moins net : un plan filmé au téléphone dehors, pas une image de synthèse)
                    '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,eq=saturation=1.12:contrast=0.97,colorbalance=rm=0.05:gm=0.01:bm=-0.05:rh=0.03:bh=-0.03,unsharp=5:5:-0.35,format=yuv420p',
                    '-c:v', 'libx264', '-preset', 'medium', '-crf', '15', '-g', '6', '-an', '-color_range', 'tv', '-colorspace', 'bt709',
                    '-color_primaries', 'bt709', '-color_trc', 'bt709', str(PUBLIC / 'clips' / f'{nom}.mp4')], check=True)


# l'image du plan des mains où la jarre est grande ouverte (s), et un point au milieu du trou (px de la vidéo)
SECONDE_OUVERTE = 3.5
GERME = (497, 864)
SOMBRE = 62  # (luminosité, sur 255) : le fond de la jarre est plus sombre que la terre et les gants


def trouer_jarre():
    """Le trou de la jarre ouverte, rendu transparent : la carte apparaîtra dedans. On part d'un point au milieu du trou et on remplit
    ce qui est sombre et d'un seul tenant, puis on referme les petits cailloux plus clairs du fond."""
    f = PUBLIC / 'img' / 'ouverte.png'
    subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(SECONDE_OUVERTE), '-i', str(PUBLIC / 'clips' / 'jarre-mains.mp4'),
                    '-frames:v', '1', '-update', '1', str(f)], check=True)
    im = Image.open(f).convert('RGB')
    gris = np.asarray(im.filter(ImageFilter.GaussianBlur(1.5))).astype(np.float32) @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
    sombre = Image.fromarray(((gris < SOMBRE) * 255).astype(np.uint8)).copy()  # (une copie : floodfill ne remplit pas une image en lecture seule)
    ImageDraw.floodfill(sombre, GERME, 128)
    trou = Image.fromarray(((np.asarray(sombre) == 128) * 255).astype(np.uint8))
    trou = trou.filter(ImageFilter.MaxFilter(15)).filter(ImageFilter.MinFilter(15)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
    alpha = 255 - np.asarray(trou)
    Image.fromarray(np.dstack([np.asarray(im), alpha]).astype(np.uint8)).save(PUBLIC / 'img' / 'jarre-ouverte.png')
    ys, xs = np.where(np.asarray(trou) > 128)
    print('trou : x', xs.min(), '→', xs.max(), ', y', ys.min(), '→', ys.max(), ', centre', int(xs.mean()), int(ys.mean()), ',', round(len(xs) / (1080 * 1920) * 100, 1), "% de l'image")


def coups():
    """Les coups de marteau (coups.mp3, attaques à 0,15, 0,46, 0,82 et 1,49 s) en fichiers séparés, chacun avec ses 15 ms d'avant."""
    for i, (a, d) in enumerate(((0.135, 0.3), (0.445, 0.34), (0.805, 0.6), (1.475, 0.7)), 1):
        subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(a), '-t', str(d), '-i', str(PUBLIC / 'sfx' / 'coups.mp3'),
                        '-af', f'afade=t=out:st={d - 0.06}:d=0.06', '-ar', '48000', str(PUBLIC / 'sfx' / f'coup-{i}.wav')], check=True)


def main():
    for dossier in ('img', 'rushes', 'reels', 'clips', 'ui', 'sfx', 'musique'):
        (PUBLIC / dossier).mkdir(parents=True, exist_ok=True)
    for dossier, fichiers in PRISES.items():
        for f in fichiers:
            copier(f, PUBLIC / dossier / f.name)
    for f in SFX:
        copier(f, PUBLIC / 'sfx' / f.name)
    copier(VIDEOS / 'carte/tunnel/public/tiktok/avatar.jpg', PUBLIC / 'ui' / 'logo.jpg')
    coups()
    for nom in ('jarre-marteau', 'jarre-mains'):
        if (SOURCES / f'{nom}.mp4').exists():
            clip(nom)
    if (PUBLIC / 'clips' / 'jarre-mains.mp4').exists():
        trouer_jarre()
    print('bruitages et prises prêts dans', PUBLIC)


if __name__ == '__main__':
    main()
