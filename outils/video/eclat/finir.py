"""Fabrique la vidéo « éclat » finie (14,6 s, 9:16, 60 images/s), depuis le montage Remotion (montage/) : avec la musique
et sans (les bruitages restent : pour y mettre un son TikTok), dans videos/carte/eclat/.
    python outils/video/eclat/finir.py          # les deux
    python outils/video/eclat/finir.py avec     # seulement avec la musique

Il faut d'abord preparer.py et musique.py, et `npm install` dans montage/. Après Remotion : le son à −14 LUFS (le niveau
de TikTok), le même gain pour la version sans musique ; l'image en BT.709 plage TV, comme l'attendent les téléphones.
"""
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ICI = Path(__file__).resolve().parent
MONTAGE = ICI / 'montage'
SORTIE = ICI.parents[2] / 'videos' / 'carte' / 'eclat'
NOM = 'carte-japon-eclat'


def ffmpeg():
    return shutil.which('ffmpeg') or __import__('imageio_ffmpeg').get_ffmpeg_exe()


def rendre(bgm, f):
    # les props passent par un fichier : le shell de Windows enlève les guillemets d'un JSON en ligne
    props = MONTAGE / 'out' / f'props-{"bgm" if bgm else "sans"}.json'
    props.write_text(json.dumps({'bgm': bgm}), encoding='utf-8')
    npx = shutil.which('npx') or 'npx'
    # 4 onglets à la fois et un cache vidéo plafonné (le flou de mouvement calcule 6 images par image), une image peut
    # attendre 2 min (comme pour les vidéos de la balade)
    subprocess.run([npx, 'remotion', 'render', 'Eclat', str(f), '--codec=h264', '--crf=12', '--log=error', f'--props={props}',
                    '--concurrency=4', '--offthreadvideo-cache-size-in-bytes=2000000000', '--timeout=120000'],
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
                    '-bsf:v', 'h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1',
                    # (0,75 et non 0,84 comme les autres vidéos : le verre qui casse est si vif qu'à 0,84 l'AAC le faisait dépasser 0 dB)
                    '-af', f'volume={gain:.2f}dB,alimiter=limit=0.75:level=false', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
                    '-movflags', '+faststart', str(f)], check=True)


def main():
    SORTIE.mkdir(parents=True, exist_ok=True)
    (MONTAGE / 'out').mkdir(exist_ok=True)
    versions = [a for a in sys.argv[1:] if a in ('avec', 'sans')] or ['avec', 'sans']
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
    print('->', SORTIE / f'{NOM}.mp4', f'(gain {gain:+.1f} dB)', flush=True)


if __name__ == '__main__':
    main()
