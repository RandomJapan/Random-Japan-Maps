"""Fabrique la vidéo « générique d'animé » de la carte finie (9:16, 60 images/s), depuis le montage Remotion (montage/) : avec la
chanson et sans (les bruitages et le son du hook restent : pour y mettre un son TikTok), dans videos/carte/generique/, et sa miniature.
    python outils/video/generique/finir.py            # les deux versions
    python outils/video/generique/finir.py avec       # seulement celle avec la chanson
    python outils/video/generique/finir.py --lent     # deux onglets et 5 minutes par image (si le rendu s'arrête en route)

Il faut d'abord preparer.py, et le dossier node_modules de montage/ (un lien vers celui de la vidéo « sceau »).
Après Remotion : le son à −14 LUFS (le niveau de TikTok), le même gain pour la version sans chanson ; l'image en BT.709 plage TV,
comme l'attendent les téléphones (Remotion sort du JPEG plein écart).
"""
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ICI = Path(__file__).resolve().parent
MONTAGE = ICI / 'montage'
SORTIE = ICI.parents[2] / 'videos' / 'carte' / 'generique'
NOM = 'carte-japon-generique-anime'
LENT = '--lent' in sys.argv


def ffmpeg():
    return shutil.which('ffmpeg') or __import__('imageio_ffmpeg').get_ffmpeg_exe()


def options():
    if LENT:
        return ['--concurrency=2', '--timeout=300000', '--offthreadvideo-cache-size-in-bytes=2000000000']
    return ['--concurrency=4', '--timeout=120000', '--offthreadvideo-cache-size-in-bytes=2000000000']


def rendre(bgm, f, codec='h264'):
    # les props passent par un fichier : le shell de Windows enlève les guillemets d'un JSON en ligne
    props = MONTAGE / 'out' / f'props-{"bgm" if bgm else "sans"}.json'
    props.write_text(json.dumps({'bgm': bgm}), encoding='utf-8')
    npx = shutil.which('npx') or 'npx'
    qualite = ['--crf=12'] if codec == 'h264' else []
    subprocess.run([npx, 'remotion', 'render', 'Generique', str(f), f'--codec={codec}', *qualite, '--log=error', f'--props={props}', *options()],
                   cwd=MONTAGE, check=True, shell=sys.platform == 'win32')


def volume(f):
    sortie = subprocess.run([ffmpeg(), '-hide_banner', '-i', str(f), '-af', 'loudnorm=print_format=json', '-f', 'null', '-'],
                            capture_output=True, text=True, encoding='utf-8', errors='ignore').stderr
    return float(json.loads(re.search(r'\{[^{}]*"input_i"[^{}]*\}', sortie).group(0))['input_i'])


def finir(brut, f, gain, son=None):
    """L'image en BT.709 plage TV, le son au gain voulu (limité) ; son : un autre fichier son à mettre à la place."""
    entrees = ['-i', str(brut)] + (['-i', str(son)] if son else [])
    cartes = ['-map', '0:v', '-map', '1:a'] if son else []
    subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', *entrees, *cartes,
                    '-vf', 'scale=in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p',
                    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-profile:v', 'high', '-r', '60',
                    '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
                    '-af', f'volume={gain:.2f}dB,alimiter=limit=0.78:level=false', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
                    '-movflags', '+faststart', str(f)], check=True)


def main():
    SORTIE.mkdir(parents=True, exist_ok=True)
    (MONTAGE / 'out').mkdir(exist_ok=True)
    versions = [a for a in sys.argv[1:] if not a.startswith('--')] or ['avec', 'sans']
    avec, sans = MONTAGE / 'out' / f'{NOM}-brut.mp4', MONTAGE / 'out' / f'{NOM}-sans-brut.mp4'
    if 'avec' in versions:
        rendre(True, avec)
    if 'sans' in versions:
        rendre(False, sans)
    gain = -14 - volume(avec)  # la version avec la chanson fixe le gain ; la version sans prend le même
    if 'avec' in versions:
        finir(avec, SORTIE / f'{NOM}.mp4', gain)
    if 'sans' in versions:
        finir(sans, SORTIE / f'{NOM}-sans-musique.mp4', gain)
    npx = shutil.which('npx') or 'npx'
    subprocess.run([npx, 'remotion', 'still', 'Miniature', str(SORTIE / f'{NOM}-miniature.jpg'), '--image-format=jpeg', '--jpeg-quality=92', '--log=error'],
                   cwd=MONTAGE, check=True, shell=sys.platform == 'win32')
    print('->', SORTIE / f'{NOM}.mp4', f'(gain {gain:+.1f} dB)', flush=True)


if __name__ == '__main__':
    main()
