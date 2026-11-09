"""Mesure le son des deux vidéos du jeu finies : pour chaque morceau de voix, son niveau et celui de la musique en dessous (musique = version
avec − version sans), à 48 kHz, sur le fichier fini ; puis le volume total et le pic.
    python outils/video/jeu/mesure_son.py
"""
import json
import re
import shutil
import subprocess
from pathlib import Path

import numpy as np

ICI = Path(__file__).resolve().parent
SORTIE = ICI.parents[2] / 'videos' / 'carte' / 'jeu'
DUREES = json.loads((ICI / 'montage' / 'src' / 'durees.json').read_text(encoding='utf-8'))
SR = 48000


def ffmpeg():
    return shutil.which('ffmpeg') or __import__('imageio_ffmpeg').get_ffmpeg_exe()


def lire(f):
    r = subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-i', str(f), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True)
    return np.frombuffer(r.stdout, dtype=np.float32).copy()


def db(x):
    return 20 * np.log10(max(1e-7, float(np.sqrt(np.mean(x ** 2)))))


def voix_de(tsx, prefixe):
    """Les [seconde, morceau] du montage, évalués (sec(n), sec(n) + c, rev(...))."""
    return re.findall(r'\[((?:sec\([^)]*\)[^,\]]*|[\d.]+|rev\([^)]*\)[^,\]]*)),\s*"(' + prefixe + r'-[a-z0-9]+)"', tsx)


def mesurer(nom, comp, prefixe, b):
    avec, sans = lire(SORTIE / f'{nom}.mp4'), lire(SORTIE / f'{nom}-sans-musique.mp4')
    n = min(len(avec), len(sans))
    musique = avec[:n] - sans[:n]
    print(f'— {nom}, {n / SR:.2f} s')
    tsx = (ICI / 'montage' / 'src' / f'{comp}.tsx').read_text(encoding='utf-8')
    T0, V1, V2 = 0.15, 1.5, 1.9
    rs = {'T.r1': 6.0, 'T.r2': 15.0, 'T.r3': 21.0}

    def rev(r, tau, v):
        return r * b + (tau - T0) / v

    ecarts = []
    for quand, m in voix_de(tsx, prefixe):
        expr = quand
        for k, v in rs.items():
            expr = expr.replace(k, str(v * 0 + v) + ' ')  # les temps : rev() les reçoit en temps
        d = eval(expr, {'sec': lambda x: x * b, 'rev': rev, 'V1': V1, 'V2': V2})
        i, j = int(d * SR), int((d + DUREES[m]) * SR)
        v, mu = db(sans[i:j]), db(musique[i:j])
        ecarts.append(v - mu)
        print(f'  {m:10} {d:6.2f} s  voix {v:6.1f} dB   musique {mu:6.1f} dB   écart {v - mu:5.1f} dB')
    print(f'  écart : de {min(ecarts):.1f} à {max(ecarts):.1f} dB ; musique seule {db(musique):.1f} dB, version sans {db(sans):.1f} dB')
    for f in (f'{nom}.mp4', f'{nom}-sans-musique.mp4'):
        t = subprocess.run([ffmpeg(), '-hide_banner', '-i', str(SORTIE / f), '-af', 'loudnorm=print_format=json', '-f', 'null', '-'], capture_output=True, text=True, encoding='utf-8', errors='ignore').stderr
        j = json.loads(re.search(r'\{[^{}]*"input_i"[^{}]*\}', t).group(0))
        print(f"  {f} : {j['input_i']} LUFS, pic {j['input_tp']} dBTP")


if __name__ == '__main__':
    mesurer('carte-japon-devine-le-lieu', 'Devine', 'd', 0.5)
    mesurer('carte-japon-defi-du-jour', 'Defi', 'f', 25 / 60)
