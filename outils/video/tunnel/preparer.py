"""Les images de la vidéo « tunnel » (un TikTok → le profil → le lien de la bio → la carte), dans
videos/carte/tunnel/public (le dossier « public » du montage, pas dans git) :
- tiktok/aogashima.mp4 : le passage du post Aogashima (3,3 → 12,7 s : la vue aérienne et son titre, puis le village,
  flou au fond jusqu'au plongeon), en H.264 60 i/s
  (le fichier du propriétaire est en HEVC, que Chrome ne lit pas toujours), couleurs notées (BT.709, plage TV) et une
  image clé tous les 15 : le décodeur de Remotion s'est arrêté (« Output changed ») sur la première version ;
- tiktok/aogashima-flou.mp4 : le même en 360 × 640, déjà flou : le fond de la scène du téléphone (moins de calcul
  qu'un flou CSS sur la vidéo pleine taille) ;
- tiktok/grille-*.jpg : les vignettes de la grille du profil, découpées dans la capture du profil vu par un autre
  compte (videos/carte/tunnel/sources/profil-visiteur.jpg, 923 × 2000, envoyée par le propriétaire le 2026-10-21) ;
- tiktok/avatar.jpg : la photo du profil (le logo, outils/logo-source/logo-carre.jpg, 1600 px), en 800 px ;
- sfx/ : les bruitages repris des vidéos d'avant (ceux de video-shotcraft dont la source Mixkit est notée, et ceux
  faits avec Flora pour la promo de 30 s) ; les quatre faits pour cette vidéo viennent de voix.py ;
- musique/ : « Amenoshita3 » (PeriTune, CC BY 4.0, de site/musique), la musique de la version « avec musique ».
Les rushes de la carte (rushes.py), ses captures (captures.py) et la voix (voix.py) se font à part.
    python outils/video/tunnel/preparer.py
"""
import shutil
import subprocess
from pathlib import Path

from PIL import Image

ICI = Path(__file__).resolve().parent
RACINE = ICI.parents[2]
PUBLIC = RACINE / 'videos' / 'carte' / 'tunnel' / 'public'
SOURCES = RACINE / 'videos' / 'carte' / 'tunnel' / 'sources'
VIDEOS_LIEUX = Path(r'D:\Montage\Vidéo lieux random japon')
# la grille de la capture : trois colonnes, des rangées de 408 px (la troisième coupée par le bas de l'écran)
COLONNES = [(0, 305), (309, 614), (618, 923)]
RANGEES = [(968, 1376), (1379, 1786), (1789, 1960)]
SFX_PROMO = ['swoosh-quick', 'whoosh-fast', 'air-whoosh-powerful', 'zoom-air-fast', 'paper-slide', 'paper-move-quick',
             'switch-click-quick', 'sparkle-touch', 'shimmer-sparkle-sweep', 'bass-hit-short', 'impact-deep-whoosh', 'transition-snap']
SFX_HALLOWEEN = ['ui-message-pop', 'ui-success-soft']


def ffmpeg():
    return shutil.which('ffmpeg') or __import__('imageio_ffmpeg').get_ffmpeg_exe()


def main():
    (PUBLIC / 'tiktok').mkdir(parents=True, exist_ok=True)
    couleurs = ['-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709']
    for nom, filtre, crf in (('aogashima', 'fps=60,format=yuv420p', '14'), ('aogashima-flou', 'fps=60,scale=360:640,gblur=sigma=9,format=yuv420p', '20')):
        clip = PUBLIC / 'tiktok' / f'{nom}.mp4'
        if not clip.exists():
            subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', '-ss', '3.3', '-t', '9.4', '-i', str(VIDEOS_LIEUX / 'Aogashima.mp4'),
                            '-an', '-vf', filtre, '-c:v', 'libx264', '-preset', 'slow', '-crf', crf, '-g', '15', *couleurs,
                            '-movflags', '+faststart', str(clip)], check=True)
    profil = Image.open(SOURCES / 'profil-visiteur.jpg').convert('RGB')
    for r, (y0, y1) in enumerate(RANGEES):
        for c, (x0, x1) in enumerate(COLONNES):
            profil.crop((x0, y0, x1, y1)).save(PUBLIC / 'tiktok' / f'grille-{r}-{c}.jpg', quality=95)
    Image.open(RACINE / 'outils' / 'logo-source' / 'logo-carre.jpg').convert('RGB').resize((800, 800), Image.LANCZOS) \
        .save(PUBLIC / 'tiktok' / 'avatar.jpg', quality=93)
    (PUBLIC / 'sfx').mkdir(exist_ok=True)
    for dossier, noms in (('promo30', SFX_PROMO), ('halloween', SFX_HALLOWEEN)):
        for nom in noms:
            shutil.copyfile(RACINE / 'videos' / 'carte' / dossier / 'public' / 'sfx' / f'{nom}.mp3', PUBLIC / 'sfx' / f'{nom}.mp3')
    (PUBLIC / 'musique').mkdir(exist_ok=True)
    shutil.copyfile(RACINE / 'site' / 'musique' / 'peritune-amenoshita3.m4a', PUBLIC / 'musique' / 'peritune-amenoshita3.m4a')
    print('images, bruitages et musique prêts dans', PUBLIC)


if __name__ == '__main__':
    main()
