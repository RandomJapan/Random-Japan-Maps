"""Rassemble les fichiers de la vidéo « éclat » (2026-10-27) dans videos/eclat/public (hors de git), le dossier public du
montage Remotion (outils/video/eclat/montage).
    python outils/video/eclat/preparer.py

- L'accroche : la photo de la carte imprimée sous une vitre, sur une couverture de déménagement bleue, et le marteau tenu
  par une main gantée, sur fond vert (deux images Flora, « Nano Banana 2.1 », dans sources/) ; la photo est agrandie à
  1080 px de large, le marteau détouré (le vert enlevé, ses reflets sur les bords aussi).
- Les prises de la carte déjà tournées pour les vidéos d'avant (promo30 : la plongée, la mer, les quatre saisons ;
  tunnel : les épingles, Aogashima, les filtres ; la balade : le jeu) et les vrais lieux du propriétaire (balade/reels).
- Les captures de l'interface du téléphone (promo30, ×4) réduites à 1620 × 2880 : la fiche de Himeji et de Kinkaku-ji,
  les dés, l'itinéraire, la légende d'Orochi.
- Les bruitages : le verre (video-shotcraft, sources Mixkit, licence libre), les souffles et les coups des vidéos
  d'avant, deux petits « tink » du marteau sur le verre et le bruit de la pièce, calculés ici.
"""
import shutil
import wave
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ICI = Path(__file__).resolve().parent
RACINE = ICI.parents[2]
VIDEOS = RACINE / 'videos'
PUBLIC = VIDEOS / 'eclat' / 'public'
SOURCES = VIDEOS / 'eclat' / 'sources'
SHOTCRAFT = Path.home() / '.claude' / 'skills' / 'video-shotcraft' / 'assets' / 'audio' / 'sfx'

PRISES = {
    'rushes': [VIDEOS / 'promo30/public/rushes-v' / f'{n}.mp4' for n in ('p-plongee', 'p-mer', 'p-printemps', 'p-ete', 'p-automne', 'p-hiver')]
    + [VIDEOS / 'tunnel/public/rushes' / f'{n}.mp4' for n in ('tn-japon', 'tn-aogashima', 'tn-filtres')]
    + [VIDEOS / 'balade/public/rushes' / f'{n}.mp4' for n in ('it-torii', 'kk-course', 'tk-barque', 'kk-feux', 'it-feux')],
    'reels': [VIDEOS / 'balade/public/reels' / f'{n}.mp4' for n in ('himeji', 'aogashima', 'itsukushima', 'kinkakuji')],
}
CAPTURES = ['himeji-fiche', 'kinkaku-fiche', 'hasard', 'route', 'orochi-bulle']
SFX = [SHOTCRAFT / 'glass' / f'{n}.mp3' for n in ('glass-break-hammer', 'glass-debris-sweep', 'glass-plate-slide')] + [
    VIDEOS / 'promo30/public/sfx' / f'{n}.mp3' for n in ('whoosh-fast', 'bass-hit-short', 'swoosh-quick', 'click-camera', 'impact-deep-whoosh',
                                                         'transition-snap', 'air-whoosh-powerful', 'hit-fast-exciting', 'taiko')]


def copier(src, dest):
    dest.parent.mkdir(parents=True, exist_ok=True)
    if not dest.exists() or dest.stat().st_mtime < src.stat().st_mtime:
        shutil.copy2(src, dest)


def photo():
    im = Image.open(SOURCES / 'vitre.png').convert('RGB')
    h = round(im.height * 1080 / im.width)
    im = im.resize((1080, h), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.6, percent=70, threshold=2))
    im.save(PUBLIC / 'img' / 'vitre.jpg', quality=93)


def marteau():
    im = np.asarray(Image.open(SOURCES / 'marteau.png').convert('RGB')).astype(np.float32)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    cle = g - np.maximum(r, b)  # fort sur le vert pur du fond
    a = 1 - np.clip((cle - 40) / 70, 0, 1)
    g = np.minimum(g, np.maximum(r, b) * 1.02 + 6)  # le vert renvoyé sur les bords
    Image.fromarray(np.dstack([r, g, b, a * 255]).clip(0, 255).astype(np.uint8)).save(PUBLIC / 'img' / 'marteau.png')


def tink(nom, force, graine):
    """Le marteau qui tape doucement sur le verre : quelques partiels inharmoniques, très brefs, et le petit choc sourd."""
    sr = 48000
    rng = np.random.default_rng(graine)
    u = np.arange(int(0.5 * sr)) / sr
    x = np.zeros_like(u)
    for f, d, v in ((2350, 0.11, 1), (3920, 0.07, 0.7), (5480, 0.045, 0.5), (8100, 0.025, 0.3)):
        f *= 1 + rng.uniform(-0.03, 0.03)
        x += v * np.sin(2 * np.pi * f * u + rng.uniform(0, 6)) * np.exp(-u / d)
    x += 0.9 * np.sin(2 * np.pi * 190 * u) * np.exp(-u / 0.025)  # le bois du manche, le verre sur la couverture
    x += rng.standard_normal(len(u)) * np.exp(-u / 0.002) * 0.6
    x *= force / np.abs(x).max()
    with wave.open(str(PUBLIC / 'sfx' / f'{nom}.wav'), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((x * 32767).astype('<i2').tobytes())


def piece():
    """Le bruit de la pièce sous l'accroche (un souffle très bas, filtré), pour que les tapotements sonnent comme un vrai
    enregistrement au téléphone et non dans un silence numérique."""
    sr = 48000
    rng = np.random.default_rng(3)
    x = np.cumsum(rng.standard_normal(int(2.6 * sr)))  # bruit brun
    x -= np.convolve(x, np.ones(2400) / 2400, mode='same')  # sans la dérive très lente
    x = np.convolve(x, np.ones(6) / 6, mode='same')
    x *= 0.0045 / np.sqrt((x ** 2).mean())
    fondu = np.minimum(1, np.arange(len(x)) / (0.05 * sr)) * np.minimum(1, (len(x) - np.arange(len(x))) / (0.3 * sr))
    with wave.open(str(PUBLIC / 'sfx' / 'piece.wav'), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((x * fondu * 32767).astype('<i2').tobytes())


def main():
    for dossier in ('img', 'rushes', 'reels', 'ui', 'sfx', 'musique'):
        (PUBLIC / dossier).mkdir(parents=True, exist_ok=True)
    photo()
    marteau()
    for dossier, fichiers in PRISES.items():
        for f in fichiers:
            copier(f, PUBLIC / dossier / f.name)
    for n in CAPTURES:
        dest = PUBLIC / 'ui' / f'{n}.jpg'
        src = VIDEOS / 'promo30/public/ui-v' / f'{n}.png'
        if not dest.exists() or dest.stat().st_mtime < src.stat().st_mtime:
            Image.open(src).convert('RGB').resize((1620, 2880), Image.LANCZOS).save(dest, quality=92)
    for f in SFX:
        copier(f, PUBLIC / 'sfx' / f.name)
    copier(VIDEOS / 'balade/public/logo.jpg', PUBLIC / 'logo.jpg')
    tink('tink-1', 0.55, 1)
    tink('tink-2', 0.8, 2)
    piece()
    print('→', PUBLIC)


if __name__ == '__main__':
    main()
