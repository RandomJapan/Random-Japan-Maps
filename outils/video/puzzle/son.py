"""Refait seulement le son de la vidéo « puzzle » : Remotion en WAV (avec et sans musique), posé sur les images brutes que
finir.py a laissées dans montage/out, puis sa finition (−14 LUFS sur la version avec musique, même gain pour l'autre). Quelques
minutes, au lieu de refaire les images.
    python outils/video/puzzle/son.py
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

ICI = Path(__file__).resolve().parent
sys.path.insert(0, str(ICI))
import finir  # noqa: E402

M = finir.MONTAGE
npx = shutil.which('npx') or 'npx'
bruts = {}
for bgm, nom in ((True, f'{finir.NOM}-brut'), (False, f'{finir.NOM}-sans-brut')):
    props = M / 'out' / f'props-{"bgm" if bgm else "sans"}.json'
    props.write_text(json.dumps({'bgm': bgm}), encoding='utf-8')
    wav = M / 'out' / f'{nom}.wav'
    # (4 onglets, 2 min par image : le 2026-11-13, le disque C: presque plein, le rendu par défaut se bloquait sur une image)
    subprocess.run([npx, 'remotion', 'render', 'Puzzle', str(wav), '--codec=wav', '--log=error', '--timeout=120000', '--concurrency=4', f'--props={props}'], cwd=M, check=True, shell=True)
    nouveau = M / 'out' / f'{nom}-son.mp4'
    subprocess.run([finir.ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', '-i', str(M / 'out' / f'{nom}.mp4'), '-i', str(wav),
                    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'pcm_s16le', str(nouveau.with_suffix('.mov'))], check=True)
    bruts[bgm] = nouveau.with_suffix('.mov')
gain = -14 - finir.volume(bruts[True])
finir.finir(bruts[True], finir.SORTIE / f'{finir.NOM}.mp4', gain)
finir.finir(bruts[False], finir.SORTIE / f'{finir.NOM}-sans-musique.mp4', gain)
print('gain', round(gain, 2))
