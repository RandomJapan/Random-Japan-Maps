# -*- coding: utf-8 -*-
"""Mesure le son de la vidéo « générique d'animé » finie : la chanson (avec − sans), les bruitages (sans), le hook avant la chanson.
    python outils/video/generique/mesure_son.py [--fille]     (--fille : la vidéo 2, dont la chanson joue dès l'image 0)
Par fenêtre de 0,5 s après le début de la chanson : le niveau de la chanson et celui des bruitages, et leur écart (les bruitages
doivent rester dessous) ; puis le hook (le bruit de la chambre et le katana) contre la chanson ; le volume intégré et le pic."""
import json
import re
import subprocess
from pathlib import Path

import numpy as np

ICI = Path(__file__).resolve().parent
SORTIE = ICI.parents[2] / 'videos' / 'carte' / 'generique'
FILLE = __import__('sys').argv[1:] == ['--fille']
NOM = 'carte-japon-generique-anime-2' if FILLE else 'carte-japon-generique-anime'
FF =r'C:\Users\Lucas\AppData\Roaming\Python\Python312\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe'
SR = 48000
V0 = 0 if FILLE else 122 / 60  # la chanson démarre (theme.ts ; la vidéo 2 : dès l'image 0)


def lire(f):
    brut = subprocess.run([FF, '-v', 'error', '-i', str(f), '-vn', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(brut, np.float32)


def db(x):
    return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)


def lufs(f):
    e = subprocess.run([FF, '-hide_banner', '-i', str(f), '-af', 'loudnorm=print_format=json', '-f', 'null', '-'], capture_output=True, text=True,
                       encoding='utf-8', errors='ignore').stderr
    j = json.loads(re.search(r'\{[^{}]*"input_i"[^{}]*\}', e).group(0))
    return float(j['input_i']), float(j['input_tp'])


def main():
    avec, sans = lire(SORTIE / f'{NOM}.mp4'), lire(SORTIE / f'{NOM}-sans-musique.mp4')
    n = min(len(avec), len(sans))
    avec, sans = avec[:n], sans[:n]
    chanson = avec - sans
    print(' s      chanson  bruits  écart')
    pas = int(0.5 * SR)
    pires = []
    for a in range(int(V0 * SR), n - pas, pas):
        c, e = db(chanson[a:a + pas]), db(sans[a:a + pas])
        pires.append((c - e, a / SR))
        print(f'{a / SR:5.1f}  {c:7.1f} {e:7.1f} {c - e:6.1f}' + ('   <-' if c - e < 12 else ''))
    if V0 > 0:
        hook = db(avec[:int(V0 * SR)])
        print(f'\nle hook (0 → {V0:.2f} s) : {hook:.1f} dB ; la chanson ensuite : {db(chanson[int(V0 * SR):]):.1f} dB')
    print('les écarts les plus faibles :', ', '.join(f'{e:.1f} dB à {t:.1f} s' for e, t in sorted(pires)[:5]))
    for f in (SORTIE / f'{NOM}.mp4', SORTIE / f'{NOM}-sans-musique.mp4'):
        i, tp = lufs(f)
        print(f'{f.name} : {i:.1f} LUFS, {tp:.1f} dBTP')


if __name__ == '__main__':
    main()
