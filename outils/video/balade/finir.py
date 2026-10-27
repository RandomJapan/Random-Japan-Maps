"""Fabrique les vidéos de la balade 3D finies (30 à 32 s, 9:16, 60 images/s), depuis le montage Remotion (montage/) :
chacune avec la musique (un air du jeu) et sans (la voix et les bruitages restent : pour y mettre un son TikTok), dans
videos/balade/.
    python outils/video/balade/finir.py                    # toutes
    python outils/video/balade/finir.py BaladeTakachiho    # une seule
    python outils/video/balade/finir.py BaladeTour avec    # une seule, seulement avec la musique

Il faut d'abord preparer.py, musique.py, sons.py, voix.py, rushes.py et carte.py, et `npm install` dans montage/.
Après Remotion : le son à −14 LUFS (le niveau de TikTok), le même gain pour la version sans musique ; l'image en BT.709
plage TV, comme l'attendent les téléphones (Remotion sort du JPEG plein écart).
"""
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ICI = Path(__file__).resolve().parent
MONTAGE = ICI / 'montage'
SORTIE = ICI.parents[2] / 'videos' / 'balade'
NOMS = {'BaladeTour': 'balade-3d-les-5-lieux', 'BaladeTakachiho': 'balade-3d-takachiho', 'BaladeSecrets': 'balade-3d-secrets',
        'BaladeKinkakuji': 'balade-3d-kinkakuji'}


def ffmpeg():
    return shutil.which('ffmpeg') or __import__('imageio_ffmpeg').get_ffmpeg_exe()


def rendre(compo, bgm, f):
    # les props passent par un fichier : le shell de Windows enlève les guillemets d'un JSON en ligne
    props = MONTAGE / 'out' / f'props-{"bgm" if bgm else "sans"}.json'
    props.write_text(json.dumps({'bgm': bgm}), encoding='utf-8')
    npx = shutil.which('npx') or 'npx'
    # 4 onglets à la fois et un cache vidéo plafonné (le flou de mouvement calcule 8 images par image dans les
    # panoramiques éclair ; avec les réglages par défaut, le rendu de la vidéo « tunnel » manquait de mémoire) ; une image
    # peut attendre 2 min (28 s par défaut : le rendu du Pavillon d'or s'est arrêté en attendant une image d'une prise)
    subprocess.run([npx, 'remotion', 'render', compo, str(f), '--codec=h264', '--crf=12', '--log=error', f'--props={props}',
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
                    # (les options ci-dessus ne notaient que la matrice : primaires et transfert restaient « inconnus »)
                    '-bsf:v', 'h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1',
                    '-af', f'volume={gain:.2f}dB,alimiter=limit=0.84:level=false', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
                    '-movflags', '+faststart', str(f)], check=True)


def main():
    SORTIE.mkdir(parents=True, exist_ok=True)
    (MONTAGE / 'out').mkdir(exist_ok=True)
    compos = [a for a in sys.argv[1:] if a in NOMS] or list(NOMS)
    versions = [a for a in sys.argv[1:] if a in ('avec', 'sans')] or ['avec', 'sans']
    for compo in compos:
        nom = NOMS[compo]
        avec, sans = MONTAGE / 'out' / f'{nom}-brut.mp4', MONTAGE / 'out' / f'{nom}-sans-brut.mp4'
        if 'avec' in versions:
            rendre(compo, True, avec)
        if 'sans' in versions:
            rendre(compo, False, sans)
        gain = -14 - volume(avec)  # la version avec musique fixe le gain ; la version sans prend le même
        if 'avec' in versions:
            finir(avec, SORTIE / f'{nom}.mp4', gain)
        if 'sans' in versions:
            finir(sans, SORTIE / f'{nom}-sans-musique.mp4', gain)
        print('→', SORTIE / f'{nom}.mp4', f'(gain {gain:+.1f} dB)', flush=True)


if __name__ == '__main__':
    main()
