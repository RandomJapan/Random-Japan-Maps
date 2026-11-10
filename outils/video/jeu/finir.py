"""Fabrique les vidéos du jeu finies (« Devine le lieu », le défi du jour, « le créateur ») (9:16, 60 images/s) depuis le montage Remotion (montage/), avec la musique et sans (la voix et les
bruitages restent : pour y mettre un son TikTok), dans videos/carte/jeu/, et leurs miniatures.
    python outils/video/jeu/finir.py                  # les trois vidéos, les deux versions
    python outils/video/jeu/finir.py Devine           # une seule
    python outils/video/jeu/finir.py son Devine       # seulement le son (sur les images déjà rendues)

Il faut d'abord preparer.py, rushes.py, captures.py, voix.py et musique.py, et `npm install` dans montage/.
Après Remotion : le son à −14 LUFS (le niveau de TikTok), le même gain pour la version sans musique ; l'image en BT.709 plage TV.
"""
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ICI = Path(__file__).resolve().parent
MONTAGE = ICI / 'montage'
SORTIE = ICI.parents[2] / 'videos' / 'carte' / 'jeu'
VIDEOS = {'Devine': ('carte-japon-devine-le-lieu', 'MiniatureDevine'), 'Defi': ('carte-japon-defi-du-jour', 'MiniatureDefi'),
          'Createur': ('carte-japon-jeu-createur', 'MiniatureCreateur')}
OPTIONS = ['--concurrency=4', '--timeout=120000', '--offthreadvideo-cache-size-in-bytes=2000000000', '--log=error']


def ffmpeg():
    return shutil.which('ffmpeg') or __import__('imageio_ffmpeg').get_ffmpeg_exe()


def npx(*args):
    subprocess.run([shutil.which('npx') or 'npx', 'remotion', *args], cwd=MONTAGE, check=True, shell=sys.platform == 'win32')


def props(bgm):
    f = MONTAGE / 'out' / f'props-{"bgm" if bgm else "sans"}.json'
    f.write_text(json.dumps({'bgm': bgm}), encoding='utf-8')
    return f


def volume(f):
    sortie = subprocess.run([ffmpeg(), '-hide_banner', '-i', str(f), '-af', 'loudnorm=print_format=json', '-f', 'null', '-'],
                            capture_output=True, text=True, encoding='utf-8', errors='ignore').stderr
    return float(json.loads(re.search(r'\{[^{}]*"input_i"[^{}]*\}', sortie).group(0))['input_i'])


def finir(brut, f, gain, son=None):
    entree = ['-i', str(brut)] + (['-i', str(son), '-map', '0:v', '-map', '1:a'] if son else [])
    subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', *entree,
                    '-vf', 'scale=in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p',
                    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-profile:v', 'high', '-r', '60',
                    '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
                    '-af', f'volume={gain:.2f}dB,alimiter=limit=0.82:level=false', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
                    '-movflags', '+faststart', str(f)], check=True)


def main():
    args = sys.argv[1:]
    son_seul = 'son' in args
    choix = [a for a in args if a in VIDEOS] or list(VIDEOS)
    SORTIE.mkdir(parents=True, exist_ok=True)
    (MONTAGE / 'out').mkdir(exist_ok=True)
    for comp in choix:
        nom, mini = VIDEOS[comp]
        avec, sans = MONTAGE / 'out' / f'{nom}-brut.mp4', MONTAGE / 'out' / f'{nom}-sans-brut.mp4'
        if son_seul:
            son_avec, son_sans = MONTAGE / 'out' / f'{nom}.wav', MONTAGE / 'out' / f'{nom}-sans.wav'
            npx('render', comp, str(son_avec), '--codec=wav', f'--props={props(True)}', *OPTIONS)
            npx('render', comp, str(son_sans), '--codec=wav', f'--props={props(False)}', *OPTIONS)
            gain = -14 - volume(son_avec)
            finir(avec, SORTIE / f'{nom}.mp4', gain, son_avec)
            finir(sans, SORTIE / f'{nom}-sans-musique.mp4', gain, son_sans)
        else:
            npx('render', comp, str(avec), '--codec=h264', '--crf=12', f'--props={props(True)}', *OPTIONS)
            npx('render', comp, str(sans), '--codec=h264', '--crf=12', f'--props={props(False)}', *OPTIONS)
            gain = -14 - volume(avec)  # la version avec musique fixe le gain ; la version sans prend le même
            finir(avec, SORTIE / f'{nom}.mp4', gain)
            finir(sans, SORTIE / f'{nom}-sans-musique.mp4', gain)
            npx('still', mini, str(SORTIE / f'{nom}-miniature.jpg'), '--image-format=jpeg', '--jpeg-quality=92', '--log=error')
        print('→', SORTIE / f'{nom}.mp4', f'(gain {gain:+.1f} dB)', flush=True)


if __name__ == '__main__':
    main()
