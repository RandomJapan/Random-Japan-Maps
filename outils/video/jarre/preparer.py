"""Rassemble les fichiers de la vidéo « jarre » (2026-11-02) dans videos/carte/jarre/public (hors de git), le dossier public du
montage Remotion (outils/video/jarre/montage).
    python outils/video/jarre/preparer.py

- L'accroche : les deux plans de la jarre, générés avec Flora à partir de ses images (dans sources/ : voir « The jar video » dans
  instructions/videos.md), réencodés (1080 × 1920, 24 images/s comme à la source, une image clé toutes les 6) ; sa dernière image coupée en
  deux calques transparents le long de la fente noire (img/moitie-gauche.png, img/moitie-droite.png), que le montage écarte
  pour ouvrir la jarre.
- Les prises déjà tournées : les quatre saisons (promo30), la balade, les vrais lieux du propriétaire (balade/reels).
- Les bruitages : ceux des vidéos d'avant ; les coups, la fissure et le raclement de la jarre sont des bruits Flora (déjà dans
  public/sfx), découpés ici en coups séparés (coup-1.wav…).
- Le logo.
"""
import shutil
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

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
                    '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,format=yuv420p',
                    '-c:v', 'libx264', '-preset', 'medium', '-crf', '15', '-g', '6', '-an', '-color_range', 'tv', '-colorspace', 'bt709',
                    '-color_primaries', 'bt709', '-color_trc', 'bt709', str(PUBLIC / 'clips' / f'{nom}.mp4')], check=True)


def couper_jarre():
    """La dernière image du plan des mains, coupée en deux le long de la fente : sa ligne médiane sépare les deux moitiés, et les
    pixels sombres de la fente sont retirés des deux."""
    f = PUBLIC / 'img' / 'derniere.png'
    subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', '-sseof', '-0.2', '-i', str(PUBLIC / 'clips' / 'jarre-mains.mp4'),
                    '-update', '1', '-frames:v', '1', str(f)], check=True)
    im = np.asarray(Image.open(f).convert('RGB')).astype(np.float32)
    h, l = im.shape[:2]
    sombre = (im @ np.array([0.299, 0.587, 0.114], dtype=np.float32)) < 42

    def suite(y, a, z):
        """La plus longue suite de pixels sombres de la ligne y entre les colonnes a et z : (début, fin), ou None."""
        ligne, meilleur, debut = sombre[y, a:z], None, None
        for x in range(z - a + 1):
            if x < z - a and ligne[x]:
                debut = x if debut is None else debut
            elif debut is not None:
                if meilleur is None or x - debut > meilleur[1] - meilleur[0]:
                    meilleur = (debut + a, x + a)
                debut = None
        return meilleur

    # on part du milieu de la fente (au milieu de la jarre) et on la suit vers le haut et vers le bas, ligne par ligne, tant
    # qu'elle reste d'un seul tenant : les ombres de la terre et des manches n'en font pas partie
    y_milieu = h // 2 - 120
    gauche, droite = np.full(h, -1.0), np.full(h, -1.0)
    gauche[y_milieu], droite[y_milieu] = suite(y_milieu, int(l * 0.28), int(l * 0.72))
    for pas in (-1, 1):
        y, g0, d0 = y_milieu + pas, gauche[y_milieu], droite[y_milieu]
        while 0 <= y < h:
            r = suite(y, int(g0) - 14, int(d0) + 14)
            if r is None or r[1] - r[0] < 16:
                break
            gauche[y], droite[y] = r
            g0, d0, y = r[0], r[1], y + pas
    lignes = np.where(gauche >= 0)[0]
    y0, y1 = lignes.min(), lignes.max()
    # au-dessus et au-dessous de la fente, la coupe continue dans la terre, en dents de scie comme une terre qui se déchire (toute
    # droite, elle faisait un rectangle découpé quand les morceaux s'écartaient)
    milieu = np.interp(np.arange(h), lignes, (gauche[lignes] + droite[lignes]) / 2)
    milieu = np.convolve(np.pad(milieu, 40, mode='edge'), np.ones(81) / 81, mode='valid')
    rng = np.random.default_rng(12)
    def bruit(n, longueur):
        b = np.interp(np.arange(n), np.arange(0, n + longueur, longueur), rng.standard_normal(n // longueur + 2)[:len(np.arange(0, n + longueur, longueur))])
        return b
    dents = 34 * bruit(h, 90) + 16 * bruit(h, 26) + 7 * bruit(h, 8)
    hors = np.clip(np.maximum(y0 - np.arange(h), np.arange(h) - y1) / 70, 0, 1)  # 0 le long de la fente, 1 loin d'elle
    milieu = milieu + dents * hors
    trou = np.zeros((h, l), dtype=bool)
    for y in lignes:
        trou[y, int(gauche[y]):int(droite[y])] = True
    masque_trou = np.asarray(Image.fromarray((trou * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1.1))).astype(np.float32) / 255
    xs = np.arange(l, dtype=np.float32)[None, :]
    cote = np.clip((milieu[:, None] - xs) / 1.5 + 0.5, 0, 1)  # 1 à gauche de la ligne médiane
    for nom, a in (('gauche', cote), ('droite', 1 - cote)):
        alpha = a * (1 - masque_trou)
        Image.fromarray(np.dstack([im, alpha * 255]).clip(0, 255).astype(np.uint8)).save(PUBLIC / 'img' / f'moitie-{nom}.png')
    print('fente : lignes', y0, '→', y1, ', centre', round(float(milieu[(y0 + y1) // 2]), 1), 'sur', l)


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
        couper_jarre()
    print('bruitages et prises prêts dans', PUBLIC)


if __name__ == '__main__':
    main()
