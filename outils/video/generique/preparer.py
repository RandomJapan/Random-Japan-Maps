"""Rassemble les fichiers de la vidéo « générique d'animé » de la carte (2026-11-22) dans videos/carte/generique/public (hors de
git), le dossier public du montage Remotion (outils/video/generique/montage).
    python outils/video/generique/preparer.py

- Le hook : deux passages du rush 4 du propriétaire (videos/tournage/Oppening animé carte : il dégaine un katana, puis tranche vers
  l'objectif), passés dans sa LUT DJI (D-Log M vers Rec.709).
- Les plans animés : son rush 2 (il se retourne et montre la carte sur son téléphone, 3,5 → 6,6 s) et deux passages du rush 4
  (il tranche vers l'objectif, 4,8 → 7,1 s ; il dégaine, 0,6 → 3,5 s) redessinés en animé par FLUX 3 Video Edit sur Flora
  (sources/anime-flux.mp4, anime-coupe.mp4, anime-tire.mp4 ; 0,10 à 0,11 $ chacun), agrandis en 1080 × 1920. Kling O1 Edit a
  aussi fait le rush 2 (anime-kling.mp4, 0,46 $) : un autre visage, le ruban rouge du chapeau, une carte qui n'est pas le Japon ;
  pas utilisé.
- Ses vrais plans des lieux (REELS : le fichier dans D:\\Montage\\Vidéo lieux random japon, la seconde, la durée, et parfois un
  recadrage qui écarte le titre incrusté de sa vidéo).
- Les prises de la carte déjà tournées pour les vidéos d'avant (tunnel, sceau, jarre) et deux de la balade.
- La chanson (la n° 1 des quatre faites sur Flora, choisie par le propriétaire), les bruitages, le logo ; le bruit d'un katana qu'on
  dégaine est calculé ici (katana.wav).
"""
import shutil
import subprocess
from pathlib import Path

import numpy as np

ICI = Path(__file__).resolve().parent
RACINE = ICI.parents[2]
VIDEOS = RACINE / 'videos'
PUBLIC = VIDEOS / 'carte' / 'generique' / 'public'
SOURCES = VIDEOS / 'carte' / 'generique' / 'sources'
RUSHES_DJI = VIDEOS / 'tournage' / 'Oppening animé carte'
LUT = VIDEOS / 'Tik Tok' / 'DJI OSMO Pocket 4 D-Log to Rec.709 vivid V1.0.cube'
VIDEOS_LIEUX = Path(r'D:\Montage\Vidéo lieux random japon')
SHOTCRAFT = Path.home() / '.claude' / 'skills' / 'video-shotcraft' / 'assets' / 'audio' / 'sfx'

# Le hook : (nom, rush, début, fin) en secondes du rush (lus image par image sur une planche à 30 images/s)
VRAIS = [
    ('vrai-tire', 'DJI_20261122114301_0004_D.MP4', 0.70, 1.70),   # il dégaine et pose la lame le long du bras
    ('vrai-coupe', 'DJI_20261122114301_0004_D.MP4', 5.50, 6.70),  # il fixe l'objectif, arme, tranche : la lame passe devant à 6,53 s
]
# Ses vrais plans : nom → (fichier, seconde, durée, recadrage) ; recadrage = (zoom, centre x, centre y) de 0 à 1
REELS = {
    'takeda': ('Takeda Castle.mp4', 57.0, 2.2, (1.6, 0.5, 0.54)),  # le château au-dessus de la mer de nuages (son titre, en haut à gauche, hors du cadre)
    'fuji': ('Fuji Shibazakura Festival.mp4', 21.9, 2.2, None),     # le Fuji au-dessus des champs de mousse rose
    'takayama': ('Takayama Inari shrine.mp4', 10.0, 1.4, None),     # le tunnel de torii rouges
    'motonosumi': ('Motonosumi Shrine.mp4', 12.6, 1.4, None),
    'itsukushima': ('Itsukushima Shrine.mp4', 42.6, 1.4, None),     # le grand torii à contre-jour
    'shirahige': ('Shirahige Shrine.mp4', 19.1, 1.4, None),         # le torii dans le lac, sous le ciel rouge
    'aogashima': ('Aogashima.mp4', 31.0, 1.4, None),                # le volcan dans le volcan
    'nagoro': ('Nagoro Scarecrow Village.mp4', 13.0, 1.4, None),    # les épouvantails dans le champ
    'shirogane': ('Shirogane Blue Pond.mp4', 25.8, 1.4, None),      # l'étang bleu
    'tottori': ('Tottori Sand Dunes.mp4', 7.2, 2.2, None),          # le mur de sable au-dessus des vagues
}
# Les prises de la carte et de la balade, tournées pour les vidéos d'avant
PRISES = [VIDEOS / 'carte/tunnel/public/rushes' / f'{n}.mp4' for n in ('tn-japon', 'tn-filtres', 'tn-aogashima')] + [
    VIDEOS / 'carte/sceau/public/rushes' / f'{n}.mp4' for n in ('sc-plongee', 'sc-jour', 'sc-nuit')] + [
    VIDEOS / 'carte/jarre/public/rushes' / f'{n}.mp4' for n in ('ja-mer', 'ja-route', 'p-hiver')] + [
    VIDEOS / 'balade/public/rushes' / f'{n}.mp4' for n in ('kk-feux', 'tt-escalier')]
SFX = [VIDEOS / 'carte/tunnel/public/sfx' / n for n in ('whoosh-fast.mp3', 'swoosh-quick.mp3', 'bass-hit-short.mp3', 'air-whoosh-powerful.mp3',
                                                        'transition-snap.mp3', 'shimmer-sparkle-sweep.mp3', 'zoom-air-fast.mp3', 'pops.mp3')] + [
    VIDEOS / 'carte/promo30/public/sfx' / n for n in ('impact-deep-whoosh.mp3', 'hit-fast-exciting.mp3')] + [
    VIDEOS / 'carte/eclat/public/sfx' / 'piece.wav', SHOTCRAFT / 'transition' / 'sweep-metal-quick.mp3']
COULEUR = ['-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709']


def ffmpeg():
    return shutil.which('ffmpeg') or __import__('imageio_ffmpeg').get_ffmpeg_exe()


def copier(src, dest):
    dest.parent.mkdir(parents=True, exist_ok=True)
    if not dest.exists() or dest.stat().st_mtime < src.stat().st_mtime:
        shutil.copy2(src, dest)


def encoder(entree, dest, filtre, debut=None, duree=None):
    """Une vidéo pour le montage : 1080 × 1920, 60 images/s, sans son, une image clé toutes les 6 (le montage la lit image par image)."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    avant = (['-ss', str(debut)] if debut is not None else []) + (['-t', str(duree)] if duree is not None else [])
    subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', *avant, '-i', str(entree), '-an', '-vf', filtre,
                    '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-g', '6', *COULEUR, str(dest)], check=True)


def vrais():
    """Les passages du rush 4, dans la LUT DJI (copiée à côté : un chemin avec des espaces casse le filtre)."""
    lut = SOURCES / 'lut.cube'
    copier(LUT, lut)
    (PUBLIC / 'clips').mkdir(parents=True, exist_ok=True)
    for nom, rush, de, a in VRAIS:
        dest = PUBLIC / 'clips' / f'{nom}.mp4'
        if dest.exists():
            continue
        subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(de), '-t', f'{a - de:.3f}', '-i', str(RUSHES_DJI / rush), '-an',
                        '-vf', 'lut3d=file=lut.cube:interp=tetrahedral,scale=1080:1920:flags=lanczos,fps=60,format=yuv420p',
                        '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-g', '6', *COULEUR, str(dest)], cwd=SOURCES, check=True)


def animes():
    """Les plans animés de Flora (704 × 1248, 24 images/s) : agrandis (lanczos et un peu de netteté sur les traits), chaque image
    répétée pour 60 images/s (l'animé garde son pas)."""
    for nom in ('anime-flux', 'anime-coupe', 'anime-tire'):
        src, dest = SOURCES / f'{nom}.mp4', PUBLIC / 'clips' / f'{nom}.mp4'
        if src.exists() and (not dest.exists() or dest.stat().st_mtime < src.stat().st_mtime):
            encoder(src, dest, 'scale=1080:1920:flags=lanczos,unsharp=5:5:0.6,fps=60,format=yuv420p')


def reels():
    for nom, (fichier, seconde, duree, cadre) in REELS.items():
        dest = PUBLIC / 'reels' / f'{nom}.mp4'
        if dest.exists():
            continue
        if cadre:
            z, cx, cy = cadre
            # (on garde une fenêtre 1/z de l'image, centrée sur (cx, cy), bornée aux bords)
            recadre = (f'crop=iw/{z}:ih/{z}:min(max(0\\,iw*{cx}-iw/{z}/2)\\,iw-iw/{z}):min(max(0\\,ih*{cy}-ih/{z}/2)\\,ih-ih/{z}),')
        else:
            recadre = ''
        encoder(VIDEOS_LIEUX / fichier, dest, f'{recadre}scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1920,fps=60,format=yuv420p',
                debut=seconde, duree=duree)


def katana(sr=48000):
    """Le bruit d'un katana qu'on dégaine : un frottement de métal qui monte (un bruit filtré qui glisse de 1,8 à 6 kHz), puis la
    lame qui sonne (des partiels inharmoniques qui s'éteignent), en stéréo un peu large."""
    rng = np.random.default_rng(7)
    n = int(1.4 * sr)
    t = np.arange(n) / sr
    # le frottement : 0 → 0,32 s
    bruit = rng.standard_normal(n)
    frott = np.zeros(n)
    taille = 1024
    for i in range(0, int(0.34 * sr), taille // 2):
        u = i / (0.32 * sr)
        fc = 1800 + 4200 * min(1, u) ** 1.5
        seg = bruit[i:i + taille] * np.hanning(min(taille, n - i))
        X = np.fft.rfft(seg)
        f = np.fft.rfftfreq(len(seg), 1 / sr)
        X *= np.exp(-((f - fc) / (0.25 * fc)) ** 2)
        frott[i:i + len(seg)] += np.fft.irfft(X, len(seg))
    env = np.clip(t / 0.03, 0, 1) * np.clip((0.34 - t) / 0.06, 0, 1)
    frott *= env / (np.abs(frott).max() + 1e-9)
    # la lame qui sonne, à partir de 0,3 s
    sonne = np.zeros(n)
    for fr, a, d in ((2140, 1.0, 0.55), (3390, 0.7, 0.42), (5230, 0.5, 0.3), (7880, 0.35, 0.2), (9610, 0.2, 0.14)):
        tt = np.maximum(0, t - 0.3)
        vib = 1 + 0.002 * np.sin(2 * np.pi * 5.5 * tt)
        sonne += a * np.sin(2 * np.pi * fr * tt * vib) * np.exp(-tt / d) * (t >= 0.3)
    sonne *= np.clip((t - 0.3) / 0.004, 0, 1)
    mono = 0.55 * frott + 0.32 * sonne / np.abs(sonne).max()
    g = np.roll(mono, 12)  # 0,25 ms de décalage : un peu de largeur
    stereo = np.stack([mono, g], axis=1)
    stereo *= 0.89 / np.abs(stereo).max()
    ecrire_wav(PUBLIC / 'sfx' / 'katana.wav', stereo, sr)


def ecrire_wav(f, x, sr):
    import wave
    f.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(f), 'wb') as w:
        w.setnchannels(x.shape[1])
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())


def chanson():
    dest = PUBLIC / 'musique' / 'chanson.wav'
    dest.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', '-i', str(VIDEOS / 'carte/generique/musique/el-homme.mp3'),
                    '-ar', '48000', '-ac', '2', str(dest)], check=True)


def main():
    vrais()
    animes()
    reels()
    for p in PRISES:
        copier(p, PUBLIC / 'rushes' / p.name)
    for s in SFX:
        copier(s, PUBLIC / 'sfx' / s.name)
    katana()
    chanson()
    copier(VIDEOS / 'carte/sceau/public/ui/logo.jpg', PUBLIC / 'ui' / 'logo.jpg')
    print('ok →', PUBLIC)


if __name__ == '__main__':
    main()
