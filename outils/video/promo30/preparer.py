"""Prépare le dossier « public » du montage de la vidéo promo de 30 s (videos/promo30/public, pas dans git) :
les extraits des vidéos du propriétaire (9:16, sans le son), la musique (site/musique, CC BY), les bruitages (ceux du
skill video-shotcraft dont la source Mixkit est notée, et six faits pour la vidéo avec Flora, le connecteur du
propriétaire), le logo, et les plans d'Halloween déjà tournés (videos/halloween/public/rushes).
Les plans et captures de la carte viennent de rushes.py et captures.py, la voix off de voix.py.
    python outils/video/promo30/preparer.py
"""
import os
import shutil
import subprocess
import urllib.request
from pathlib import Path

ICI = Path(__file__).resolve().parent
RACINE = ICI.parents[2]
PUBLIC = RACINE / 'videos' / 'promo30' / 'public'
HALLOWEEN = RACINE / 'videos' / 'halloween' / 'public'
VIDEOS_LIEUX = Path(os.environ.get('VIDEOS_LIEUX', r'D:\Montage\Vidéo lieux random japon'))
SFX = Path.home() / '.claude' / 'skills' / 'video-shotcraft' / 'assets' / 'audio' / 'sfx'
# nom : (fichier, début en s, durée en s) — choisis sur des planches-contact
EXTRAITS = {
    'himeji-sakura': ('Himeji Castle.mp4', 34.0, 3.8),  # le donjon derrière les cerisiers (comme la photo de sa fiche)
    'kinkaku': ('Kinkaku-ji.mp4', 27.2, 3.0),  # le pavillon d'or et son reflet
}
MUSIQUE = 'peritune-amenoshita2'
BRUITAGES = ['transition/whoosh-fast', 'transition/swoosh-quick', 'transition/transition-snap', 'transition/air-whoosh-powerful',
             'transition/whoosh-swirl', 'transition/wing-flutter', 'transition/wind-woosh-throw', 'camera/click-camera',
             'camera/zoom-air-fast', 'impact/impact-deep-whoosh', 'impact/impact-epic-trailer', 'impact/bass-hit-short',
             'impact/hit-fast-exciting', 'light/shimmer-sparkle-sweep', 'light/sparkle-touch', 'light/sparkle-poof-hit',
             'light/light-spell', 'light/stardust-swish', 'ui/switch-click-quick', 'paper/paper-slide', 'paper/paper-move-quick']
# faits avec Flora (ElevenLabs Sound Effects) le 2026-10-21
B = 'https://media.flora.ai/node-inputs/2026/10/21/px7fsq65yzz1brtqt0dbcj4s6s8gny2h/'
FLORA = {
    'tampon': (B + 'gen-m170wwf5kmrf511dd2dy0hgnj98gqvn1-0.mp3', 'a red ink hanko stamp pressed onto thick paper'),
    'de': (B + 'gen-m17evxjpfmh87m29m5htbtccwd8gqftd-0.mp3', 'a wooden die rolling across a wooden table'),
    'montee': (B + 'gen-m175k6hey3dcj04v46cb8z475n8gpdha-0.mp3', 'a cinematic riser building to a peak'),
    'taiko': (B + 'gen-m17dh3cv7maf5bm4pw0b8v7syh8gq0r3-0.mp3', 'one deep taiko drum hit with reverb'),
    'pinceau': (B + 'gen-m178kas9fmx19hjn6sd0bg9y618gpm95-0.mp3', 'a calligraphy brush stroke on paper'),
    'carte': (B + 'gen-m172gmx8rmhypsrw970csweag58gqn0r-0.mp3', 'an old paper map unrolling'),
}
RUSHES_HALLOWEEN = ['v3-jour.mp4', 'v3-nuit.mp4', 'v2-proche.mp4', 'v2-proche.json', 'v2-large.mp4', 'v2-large.json',
                    'v3-chapeaux.mp4', 'v3-coin.mp4', 'v3-chasse.mp4']


def ffmpeg():
    return shutil.which('ffmpeg') or __import__('imageio_ffmpeg').get_ffmpeg_exe()


def copier(source, cible):
    if cible.exists():
        return
    try:
        os.link(source, cible)  # même disque : pas de copie
    except OSError:
        shutil.copy2(source, cible)


def main():
    for d in ['clips', 'musique', 'sfx', 'img', 'rushes']:
        (PUBLIC / d).mkdir(parents=True, exist_ok=True)
    for nom, (source, debut, duree) in EXTRAITS.items():
        f = PUBLIC / 'clips' / f'{nom}.mp4'
        if not f.exists():
            print('Extrait :', nom, flush=True)
            subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(debut), '-i', str(VIDEOS_LIEUX / source),
                            '-t', str(duree), '-an', '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,format=yuv420p',
                            '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-g', '15', '-movflags', '+faststart', str(f)], check=True)
    shutil.copy2(RACINE / 'site' / 'musique' / f'{MUSIQUE}.m4a', PUBLIC / 'musique' / f'{MUSIQUE}.m4a')
    for b in BRUITAGES:
        shutil.copy2(SFX / f'{b}.mp3', PUBLIC / 'sfx' / f'{b.split("/")[1]}.mp3')
    for nom, (adresse, _quoi) in FLORA.items():
        f = PUBLIC / 'sfx' / f'{nom}.mp3'
        if not f.exists():
            urllib.request.urlretrieve(adresse, f)
    for nom in ['tonnerre', 'vent']:  # les deux bruitages Flora des vidéos d'Halloween
        copier(HALLOWEEN / 'voix' / f'{nom}.mp3', PUBLIC / 'sfx' / f'{nom}.mp3')
    for f in ['logo-large.jpg', 'logo-carre.jpg']:
        shutil.copy2(RACINE / 'outils' / 'logo-source' / f, PUBLIC / 'img' / f)
    (PUBLIC / 'rushes-v').mkdir(exist_ok=True)
    for f in RUSHES_HALLOWEEN:
        copier(HALLOWEEN / 'rushes' / f, PUBLIC / 'rushes' / f)
        copier(HALLOWEEN / 'rushes-v' / f, PUBLIC / 'rushes-v' / f)  # la version 9:16
    print('Prêt :', PUBLIC)


if __name__ == '__main__':
    main()
