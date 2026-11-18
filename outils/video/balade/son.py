"""Refait seulement le son d'une vidéo de la balade : Remotion en WAV (avec et sans musique), posé sur les images brutes que finir.py a
laissées dans montage/out, puis sa finition (−14 LUFS sur la version avec musique, même gain pour l'autre). Quelques minutes, au lieu de
refaire les images (2026-11-18 : les six morceaux de voix remontés de la vidéo de Tsubosaka-dera ; comme outils/video/puzzle/son.py).
    python outils/video/balade/son.py BaladeTsubosaka
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

ICI = Path(__file__).resolve().parent
sys.path.insert(0, str(ICI))
import finir  # noqa: E402

compo = sys.argv[1]
nom = finir.NOMS[compo]
M = finir.MONTAGE
npx = shutil.which('npx') or 'npx'
bruts = {}
for bgm, brut in ((True, f'{nom}-brut'), (False, f'{nom}-sans-brut')):
    props = M / 'out' / f'props-{"bgm" if bgm else "sans"}.json'
    props.write_text(json.dumps({'bgm': bgm}), encoding='utf-8')
    wav = M / 'out' / f'{brut}.wav'
    # (les mêmes réglages que finir.py : sans eux, le rendu du son s'arrêtait sur « Timeout while extracting frame »)
    subprocess.run([npx, 'remotion', 'render', compo, str(wav), '--codec=wav', '--log=error', f'--props={props}', '--concurrency=4',
                    '--offthreadvideo-cache-size-in-bytes=2000000000', '--timeout=120000'], cwd=M, check=True, shell=sys.platform == 'win32')
    mov = M / 'out' / f'{brut}-son.mov'
    subprocess.run([finir.ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', '-i', str(M / 'out' / f'{brut}.mp4'), '-i', str(wav),
                    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'pcm_s16le', str(mov)], check=True)
    bruts[bgm] = mov
gain = -14 - finir.volume(bruts[True])
limite = finir.LIMITES.get(compo, 0.84)
finir.finir(bruts[True], finir.SORTIE / f'{nom}.mp4', gain, limite)
finir.finir(bruts[False], finir.SORTIE / f'{nom}-sans-musique.mp4', gain, limite)
print('→', finir.SORTIE / f'{nom}.mp4', f'(gain {gain:+.1f} dB)')
