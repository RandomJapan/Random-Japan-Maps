"""Les images et les sons des vidéos de la balade 3D qui ne sont pas filmés dans la balade, dans videos/balade/public
(le dossier « public » du montage, pas dans git) :
- reels/<lieu>.mp4 : un passage de la vidéo du propriétaire de chaque lieu (le vrai lieu, que le montage fait glisser
  sur sa version du jeu), pris dans D:\\Montage\\Vidéo lieux random japon, sans titre incrusté, en H.264 60 images/s,
  couleurs notées (BT.709, plage TV) et une image clé toutes les 15 : le décodeur de Remotion le veut ainsi ;
- sfx/ : les bruitages repris des vidéos d'avant (ceux de video-shotcraft dont la source Mixkit est notée, et ceux faits
  avec Flora pour la promo de 30 s et la vidéo « tunnel ») ; les bruitages du jeu lui-même sont faits par sons.py ;
- logo.jpg : la photo du profil (le logo), en 800 px.
La musique (les airs du jeu) vient de musique.py, la voix de voix.py, les prises de rushes.py et carte.py.
    python outils/video/balade/preparer.py
"""
import shutil
import subprocess
from pathlib import Path

from PIL import Image

ICI = Path(__file__).resolve().parent
RACINE = ICI.parents[2]
PUBLIC = RACINE / 'videos' / 'balade' / 'public'
VIDEOS_LIEUX = Path(r'D:\Montage\Vidéo lieux random japon')
# le lieu : (fichier du propriétaire, début (s), durée (s)) : choisis sur des planches à une image par seconde
REELS = {
    'itsukushima': ('Itsukushima Shrine.mp4', 44.9, 3.2),  # le grand torii depuis la plage, à marée basse
    'aogashima': ('Aogashima.mp4', 38.25, 2.6),  # le belvédère rond de la crête, Maruyama dans le cratère
    'gokayama': ('Gokayama.mp4', 13.6, 2.6),  # le village et ses toits de chaume, les montagnes enneigées
    'himeji': ('Himeji Castle.mp4', 44.5, 2.4),  # le grand donjon, de face
    'takachiho': ('Takachiho gorge.mp4', 12.0, 2.2),  # la cascade de Manai vue de l'eau, les barques
}
SFX = {
    'promo30': ['whoosh-fast', 'swoosh-quick', 'air-whoosh-powerful', 'zoom-air-fast', 'transition-snap', 'impact-deep-whoosh',
                'impact-epic-trailer', 'bass-hit-short', 'shimmer-sparkle-sweep', 'sparkle-touch', 'paper-slide', 'paper-move-quick',
                'switch-click-quick', 'montee', 'taiko', 'tampon', 'whoosh-swirl', 'stardust-swish', 'sparkle-poof-hit', 'light-spell'],
    'tunnel': ['tap', 'plongee', 'pop', 'pops'],
}


def ffmpeg():
    return shutil.which('ffmpeg') or __import__('imageio_ffmpeg').get_ffmpeg_exe()


def main():
    (PUBLIC / 'reels').mkdir(parents=True, exist_ok=True)
    couleurs = ['-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709']
    for lieu, (fichier, debut, duree) in REELS.items():
        f = PUBLIC / 'reels' / f'{lieu}.mp4'
        if not f.exists():
            subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(debut), '-t', str(duree), '-i', str(VIDEOS_LIEUX / fichier),
                            '-an', '-vf', 'scale=1080:1920,fps=60,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-g', '15',
                            *couleurs, '-movflags', '+faststart', str(f)], check=True)
    (PUBLIC / 'sfx').mkdir(exist_ok=True)
    for dossier, noms in SFX.items():
        for nom in noms:
            shutil.copyfile(RACINE / 'videos' / dossier / 'public' / 'sfx' / f'{nom}.mp3', PUBLIC / 'sfx' / f'{nom}.mp3')
    Image.open(RACINE / 'outils' / 'logo-source' / 'logo-carre.jpg').convert('RGB').resize((800, 800), Image.LANCZOS) \
        .save(PUBLIC / 'logo.jpg', quality=93)
    print('extraits, bruitages et logo prêts dans', PUBLIC)


if __name__ == '__main__':
    main()
