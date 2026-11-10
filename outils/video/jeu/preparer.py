"""Rassemble les fichiers des deux vidéos du jeu (« Devine le lieu » et le défi du jour, 2026-11-09) dans videos/carte/jeu/public
(hors de git), le dossier public du montage Remotion (outils/video/jeu/montage).
    python outils/video/jeu/preparer.py

- Les vrais plans du propriétaire (reels/), à plein écran : ceux qu'on devine.
- Les « photos » que le jeu montre pendant les prises (photos/) : une image de ces mêmes plans, recadrée en 5:4. Les photos du
  tableau sont petites et ne sont pas forcément les siennes : pour la vidéo, rushes.py les remplace par celles-ci, pour ces lieux seulement.
- Les bruitages des vidéos d'avant, le logo.
"""
import shutil
import subprocess
from pathlib import Path

ICI = Path(__file__).resolve().parent
RACINE = ICI.parents[2]
VIDEOS = RACINE / 'videos'
PUBLIC = VIDEOS / 'carte' / 'jeu' / 'public'
VIDEOS_LIEUX = Path(r'D:\Montage\Vidéo lieux random japon')

# nom : (fichier du propriétaire, seconde de début, durée) : des plans sans le titre incrusté de ses vidéos
REELS = {
    'kinkaku-1': ('Kinkaku-ji.mp4', 28.0, 1.5),
    'kinkaku-2': ('Kinkaku-ji.mp4', 31.05, 1.45),
    'motonosumi': ('Motonosumi Shrine.mp4', 28.0, 3.2),
    'aogashima': ('Aogashima.mp4', 29.0, 1.45),
    'moai': ('Hill of the Buddha.mp4', 8.7, 4.2),
    'etang': ('Shirogane Blue Pond.mp4', 12.6, 5.6),
}
# la vidéo « le créateur » (2026-11-10) : le défilé de l'accroche (22 lieux, dans l'ordre, des plans sans titre choisis sur des
# planches de contact), le Fuji Shibazakura (la photo de la manche 1), les gorges de Takachiho (le défi), le torii de Shirahige (la fin)
DEFILE = [
    ('SAKURAJIMA.mp4', 14.7), ('Motonosumi Shrine.mp4', 12.6), ('Okama.mov', 18.6), ('The Great Wisteria of Nakayama.mov', 11.6),
    ('Shirogane Blue Pond.mp4', 25.8), ('Yellow Spring Road.mp4', 23.6), ('Inariyama Shrine.mp4', 36.8), ('Iiyama Snow Festival.mp4', 30.9),
    ('Onaruto Bridge.mov', 37.2), ('Nakatsukasa Magotaro Inari Shrine.mov', 16.9), ('Mount Omuro.mov', 24.2), ('Kinkaku-ji.mp4', 22.3),
    ('Haiya bridge.mp4', 14.0), ('Okuoi Rainbow Bridge.mp4', 21.7), ('Itsukushima Shrine.mp4', 28.7), ('Uradome Coast.mp4', 48.2),
    ('Dōgo Onsen Annex Asuka-no-Yu.mp4', 15.9), ('Hakuryu Lake.mov', 17.1), ('Tottori Sand Dunes.mp4', 13.2), ('Hill of the Buddha.mp4', 13.7),
    ('Akagi Nanmen Senbonzakura.mp4', 34.2), ('Iwaki Mount.mp4', 17.9),
]
REELS.update({f'defile/{k:02d}': (fichier, seconde, 0.45) for k, (fichier, seconde) in enumerate(DEFILE)})
# (Takachiho : les barques vues d'en haut, la photo du défi, jusqu'à 11,7 s ; Shirahige : le torii au loin, puis sous le ciel rouge
# à partir de 19,0 s, coupés sur le temps par le montage)
REELS.update({'cr-fuji': ('Fuji Shibazakura Festival.mp4', 21.9, 1.2), 'cr-takachiho': ('Takachiho gorge.mp4', 9.6, 2.0),
              'cr-shirahige-a': ('Shirahige Shrine.mp4', 17.0, 1.9), 'cr-shirahige-b': ('Shirahige Shrine.mp4', 19.1, 2.8)})
# la vraie photo de la manche 1 (Fuji Shibazakura), posée sur la prise quand le montage zoome dessus
PHOTOS_JEU = {'jeu-fuji.jpg': RACINE / 'site' / 'photos' / 'jeu' / '7659091697707633942.jpg'}
# le numéro de la vidéo du lieu (le nom de sa photo dans le jeu) : (fichier, seconde de l'image, centre vertical de 0 à 1)
PHOTOS = {
    '7660227940243737878': ('Kinkaku-ji.mp4', 31.7, 0.52),  # Kinkaku-ji
    '7674375149931547907': ('Motonosumi Shrine.mp4', 29.5, 0.5),  # Motonosumi
    '7656153535381294358': ('Aogashima.mp4', 29.7, 0.42),  # Aogashima
    '7651317213797944598': ('Shirogane Blue Pond.mp4', 15.0, 0.4),  # l'étang bleu de Shirogane
}
SFX = [VIDEOS / 'carte/tunnel/public/sfx' / n for n in ('tap.mp3', 'pop.mp3', 'pops.mp3', 'whoosh-fast.mp3', 'swoosh-quick.mp3', 'bass-hit-short.mp3',
                                                        'air-whoosh-powerful.mp3', 'paper-slide.mp3', 'sparkle-touch.mp3', 'ui-message-pop.mp3',
                                                        'ui-success-soft.mp3', 'transition-snap.mp3', 'shimmer-sparkle-sweep.mp3', 'zoom-air-fast.mp3')] + [
    VIDEOS / 'carte/promo30/public/sfx' / n for n in ('click-camera.mp3', 'impact-deep-whoosh.mp3', 'hit-fast-exciting.mp3')]


def ffmpeg():
    return shutil.which('ffmpeg') or __import__('imageio_ffmpeg').get_ffmpeg_exe()


def reel(nom, fichier, debut, duree):
    dest = PUBLIC / 'reels' / f'{nom}.mp4'
    if dest.exists():
        return
    subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(debut), '-t', str(duree), '-i', str(VIDEOS_LIEUX / fichier), '-an',
                    '-vf', 'scale=1080:1920:flags=lanczos,fps=60,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-g', '6',
                    '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', str(dest)], check=True)


def photo(numero, fichier, seconde, centre):
    dest = PUBLIC / 'photos' / f'{numero}.jpg'
    if dest.exists():
        return
    h = 864
    y = f'max(0\\,min(ih-{h}\\,ih*{centre}-{h / 2}))'
    subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(seconde), '-i', str(VIDEOS_LIEUX / fichier), '-frames:v', '1',
                    '-vf', f'scale=1080:1920:flags=lanczos,crop=1080:{h}:0:{y}', '-q:v', '3', str(dest)], check=True)


def main():
    for dossier in ('reels', 'reels/defile', 'photos', 'rushes', 'ui', 'sfx', 'musique', 'voix'):
        (PUBLIC / dossier).mkdir(parents=True, exist_ok=True)
    for nom, (fichier, debut, duree) in REELS.items():
        reel(nom, fichier, debut, duree)
    for numero, (fichier, seconde, centre) in PHOTOS.items():
        photo(numero, fichier, seconde, centre)
    for nom, f in PHOTOS_JEU.items():
        shutil.copy2(f, PUBLIC / 'photos' / nom)
    for f in SFX:
        d = PUBLIC / 'sfx' / f.name
        if not d.exists():
            shutil.copy2(f, d)
    logo = PUBLIC / 'ui' / 'logo.jpg'
    if not logo.exists():
        shutil.copy2(VIDEOS / 'carte/tunnel/public/tiktok/avatar.jpg', logo)
    print('prêt dans', PUBLIC)


if __name__ == '__main__':
    main()
