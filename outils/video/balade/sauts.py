"""Vérifie les prises finies (rushes.py) avant le montage : les images répétées (la page n'a pas suivi son horloge ralentie : un autre
navigateur ou un rendu tournait en même temps) et les sauts (une image très différente de ses voisines : une coupe imprévue, la caméra du
jeu qui reprend la main). Un saut attendu (une carte qui s'ouvre, un fondu, le masque de Sawaichi) n'est pas une erreur : regarder l'image.
    python outils/video/balade/sauts.py ts-nio ts-encens …
(2026-11-18, la vidéo de Tsubosaka-dera)
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np

FF = shutil.which('ffmpeg') or __import__('imageio_ffmpeg').get_ffmpeg_exe()
R = Path(__file__).resolve().parents[3] / 'videos' / 'balade' / 'public' / 'rushes'
index = json.loads((R / 'index.json').read_text(encoding='utf-8'))
for p in sys.argv[1:]:
    fichiers = [k for k in index if k == p or (k.startswith(p + '-') and k[len(p) + 1:].isdigit())]
    for k in fichiers:
        r = subprocess.run([FF, '-hide_banner', '-loglevel', 'error', '-i', str(R / f'{k}.mp4'), '-vf', 'scale=108:192,format=gray', '-f', 'rawvideo', '-'],
                           capture_output=True)
        a = np.frombuffer(r.stdout, dtype=np.uint8).reshape(-1, 192, 108).astype(float)
        d = np.abs(np.diff(a, axis=0)).mean(axis=(1, 2))
        med = np.median(d) + 0.05
        sauts = [(i + 1, d[i]) for i in range(len(d)) if d[i] > 6 * med and d[i] > 3]
        rep = int((d < 0.01).sum())
        print(f'{k} : {len(a)} images, écart médian {np.median(d):.2f}, répétées {rep}, sauts :',
              ', '.join(f'{i / 60 + index[k]:.2f} s ({v:.1f})' for i, v in sauts[:8]) or 'aucun')
