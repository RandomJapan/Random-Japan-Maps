"""Fabrique la vidéo « minuit » finie (la dernière nuit d'Halloween sur la carte ; 22,5 s, 9:16, 60 images/s),
depuis le montage Remotion (montage/) : avec la musique et sans (la voix et les bruitages restent : pour y mettre un
son TikTok), dans videos/carte/minuit/.
    python outils/video/minuit/finir.py            # les deux versions
    python outils/video/minuit/finir.py avec       # seulement celle avec la musique

Il faut d'abord preparer.py, rushes.py, captures.py, musique.py et voix.py, et `npm install` dans montage/.
Après Remotion : le son à −14 LUFS (le niveau de TikTok), le même gain pour la version sans musique ; l'image en
BT.709 plage TV, comme l'attendent les téléphones (Remotion sort du JPEG plein écart). Le flou de mouvement calcule 8
à 14 images par image pendant les mouvements rapides.
"""
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ICI = Path(__file__).resolve().parent
MONTAGE = ICI / 'montage'
SORTIE = ICI.parents[2] / 'videos' / 'carte' / 'minuit'
NOM = 'carte-japon-halloween-derniere-nuit'


def ffmpeg():
    return shutil.which('ffmpeg') or __import__('imageio_ffmpeg').get_ffmpeg_exe()


def rendre(bgm, f):
    # les props passent par un fichier : le shell de Windows enlève les guillemets d'un JSON en ligne
    props = MONTAGE / 'out' / f'props-{"bgm" if bgm else "sans"}.json'
    props.write_text(json.dumps({'bgm': bgm}), encoding='utf-8')
    npx = shutil.which('npx') or 'npx'
    # 4 onglets à la fois et un cache vidéo plafonné : avec le flou de mouvement (8 à 14 images par image), le rendu par
    # défaut (un onglet par deux cœurs) manquait de mémoire
    subprocess.run([npx, 'remotion', 'render', 'Minuit', str(f), '--codec=h264', '--crf=12', '--log=error', f'--props={props}',
                    '--concurrency=4', '--offthreadvideo-cache-size-in-bytes=2000000000'],
                   cwd=MONTAGE, check=True, shell=sys.platform == 'win32')


def volume(f):
    sortie = subprocess.run([ffmpeg(), '-hide_banner', '-i', str(f), '-af', 'loudnorm=print_format=json', '-f', 'null', '-'],
                            capture_output=True, text=True, encoding='utf-8', errors='ignore').stderr
    return float(json.loads(re.search(r'\{[^{}]*"input_i"[^{}]*\}', sortie).group(0))['input_i'])


def finir(brut, f, gain):
    subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', '-i', str(brut),
                    '-vf', 'scale=in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p',
                    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-profile:v', 'high', '-r', '60',
                    '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
                    '-af', f'volume={gain:.2f}dB,alimiter=limit=0.84:level=false', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
                    '-movflags', '+faststart', str(f)], check=True)


def main():
    SORTIE.mkdir(parents=True, exist_ok=True)
    (MONTAGE / 'out').mkdir(exist_ok=True)
    versions = sys.argv[1:] or ['avec', 'sans']
    avec, sans = MONTAGE / 'out' / f'{NOM}-brut.mp4', MONTAGE / 'out' / f'{NOM}-sans-brut.mp4'
    if 'avec' in versions:
        rendre(True, avec)
    if 'sans' in versions:
        rendre(False, sans)
    gain = -14 - volume(avec)  # la version avec musique fixe le gain ; la version sans prend le même
    if 'avec' in versions:
        finir(avec, SORTIE / f'{NOM}.mp4', gain)
    if 'sans' in versions:
        finir(sans, SORTIE / f'{NOM}-sans-musique.mp4', gain)
    print('→', SORTIE / f'{NOM}.mp4', f'(gain {gain:+.1f} dB)', flush=True)


if __name__ == '__main__':
    main()
