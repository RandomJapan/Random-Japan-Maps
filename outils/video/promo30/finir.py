"""Fabrique la vidéo promo de 30 s finie, depuis le montage Remotion (montage/) : avec la musique et sans (la voix
et les bruitages restent : pour y mettre un son TikTok), dans videos/promo30/. En vertical 9:16 pour TikTok
(Promo30V, la version demandée) et en 16:9 (Promo30, pour YouTube ou le site).

    python outils/video/promo30/finir.py              # les deux
    python outils/video/promo30/finir.py Promo30V     # la version TikTok seulement

Il faut d'abord rushes.py, captures.py, voix.py et preparer.py, et `npm install` dans montage/.
Après Remotion : le son à −14 LUFS (le niveau de TikTok), le même gain pour la version sans musique ; l'image en
BT.709 plage TV, comme l'attendent les téléphones (Remotion sort du JPEG plein écart).
"""
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ICI = Path(__file__).resolve().parent
MONTAGE = ICI / 'montage'
SORTIE = ICI.parents[2] / 'videos' / 'promo30'
VIDEOS = {'Promo30V': 'promo-carte-japon-tiktok', 'Promo30': 'promo-carte-japon-16x9'}


def ffmpeg():
    return shutil.which('ffmpeg') or __import__('imageio_ffmpeg').get_ffmpeg_exe()


def rendre(compo, bgm, f):
    # les props passent par un fichier : le shell de Windows enlève les guillemets d'un JSON en ligne
    props = MONTAGE / 'out' / f'props-{"bgm" if bgm else "sans"}.json'
    props.write_text(json.dumps({'bgm': bgm}), encoding='utf-8')
    npx = shutil.which('npx') or 'npx'
    subprocess.run([npx, 'remotion', 'render', compo, str(f), '--codec=h264', '--crf=12', '--log=error', f'--props={props}'],
                   cwd=MONTAGE, check=True, shell=sys.platform == 'win32')


def volume(f):
    sortie = subprocess.run([ffmpeg(), '-hide_banner', '-i', str(f), '-af', 'loudnorm=print_format=json', '-f', 'null', '-'],
                            capture_output=True, text=True, encoding='utf-8', errors='ignore').stderr
    return float(json.loads(re.search(r'\{[^{}]*"input_i"[^{}]*\}', sortie).group(0))['input_i'])


def finir(brut, f, gain):
    subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', '-i', str(brut),
                    '-vf', 'scale=in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p',
                    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-profile:v', 'high',
                    '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
                    '-af', f'volume={gain:.2f}dB,alimiter=limit=0.84:level=false', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
                    '-movflags', '+faststart', str(f)], check=True)


def main():
    SORTIE.mkdir(parents=True, exist_ok=True)
    (MONTAGE / 'out').mkdir(exist_ok=True)
    for compo in (sys.argv[1:] or list(VIDEOS)):
        nom = VIDEOS[compo]
        avec, sans = MONTAGE / 'out' / f'{nom}-brut.mp4', MONTAGE / 'out' / f'{nom}-sans-brut.mp4'
        rendre(compo, True, avec)
        rendre(compo, False, sans)
        gain = -14 - volume(avec)
        finir(avec, SORTIE / f'{nom}.mp4', gain)
        finir(sans, SORTIE / f'{nom}-sans-musique.mp4', gain)
        print('→', SORTIE / f'{nom}.mp4', f'(gain {gain:+.1f} dB)', flush=True)


if __name__ == '__main__':
    main()
