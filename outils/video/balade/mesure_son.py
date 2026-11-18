"""Mesure le mélange d'une vidéo de la balade finie (avant de la livrer) : où tombe chaque morceau de voix, et à quel niveau sont la
musique et les bruitages sous elle. La méthode de la vidéo de Beppu (2026-10-28), réécrite le 2026-11-18 pour Tsubosaka-dera (l'ancien
script était resté dans un dossier de travail effacé depuis).
    python outils/video/balade/mesure_son.py balade-3d-tsubosaka --voix k1a:0.02 k1b:1.50 … [--t0 3.22 --temps 0.75]

- Chaque morceau (videos/balade/public/voix/court/<nom>.wav) est cherché dans la version sans musique par corrélation, autour de l'instant
  attendu (± 0,5 s) : l'écart entre l'attendu et le trouvé (il doit rester sous 0,04 s ; le son part déjà 2 images en avance, Son.tsx) ;
- son gain (moindres carrés) donne la voix telle qu'elle sonne dans la vidéo ; la musique = avec − sans ; les bruitages = sans − la voix ;
- pour chaque morceau : la voix, la musique et les bruitages pendant qu'elle parle (dB efficaces), et de combien la musique est sous elle ;
- puis les fenêtres de 0,4 s où les bruitages sont les plus forts, comparés au niveau moyen de la voix.
Tout à 48 kHz : à 16 kHz, la voix soustraite laisse un reste qui ressemble à un bruitage fort.
"""
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

RACINE = Path(__file__).resolve().parents[3]
VIDEOS = RACINE / 'videos' / 'balade'
VOIX = VIDEOS / 'public' / 'voix' / 'court'
SR = 48000


def ffmpeg():
    import shutil
    return shutil.which('ffmpeg') or __import__('imageio_ffmpeg').get_ffmpeg_exe()


def lire(f):
    r = subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-i', str(f), '-vn', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                       capture_output=True, check=True)
    return np.frombuffer(r.stdout, dtype=np.float32).astype(np.float64)


def lire_wav(f):
    with wave.open(str(f)) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).reshape(-1, w.getnchannels()).mean(axis=1) / 32768
        assert w.getframerate() == SR
    return x


def db(x):
    return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12) if len(x) else -120


def main():
    nom = sys.argv[1]
    arg = sys.argv[2:]
    t0 = float(arg[arg.index('--t0') + 1]) if '--t0' in arg else 0.0
    temps = float(arg[arg.index('--temps') + 1]) if '--temps' in arg else 1.0
    lignes = [a.split(':') for a in arg[arg.index('--voix') + 1:] if ':' in a]
    avec, sans = lire(VIDEOS / f'{nom}.mp4'), lire(VIDEOS / f'{nom}-sans-musique.mp4')
    n = min(len(avec), len(sans))
    avec, sans = avec[:n], sans[:n]
    musique = avec - sans
    voix = np.zeros(n)
    print(f'{"morceau":8} {"attendu":>8} {"trouvé":>8} {"écart":>7} {"temps":>6} | {"voix":>6} {"musique":>8} {"sous":>5} {"bruit.":>7}')
    resultats = []
    for nom_v, attendu in lignes:
        attendu = float(attendu)
        v = lire_wav(VOIX / f'{nom_v}.wav')
        a0 = max(0, int((attendu - 0.5) * SR))
        a1 = min(n - len(v), int((attendu + 0.5) * SR))
        seg = sans[a0:a1 + len(v)]
        # corrélation par FFT
        m = len(seg) + len(v)
        c = np.fft.irfft(np.fft.rfft(seg, m) * np.conj(np.fft.rfft(v, m)), m)[:a1 - a0 + 1]
        k = int(np.argmax(c))
        debut = a0 + k
        morceau = sans[debut:debut + len(v)]
        g = float(np.dot(morceau, v) / np.dot(v, v))
        voix[debut:debut + len(v)] += g * v
        resultats.append((nom_v, attendu, debut / SR, g, v))
    bruitages = sans - voix
    niveaux_voix = []
    for nom_v, attendu, trouve, g, v in resultats:
        i0, i1 = int(trouve * SR), int(trouve * SR) + len(v)
        actif = np.abs(v) > 0.02
        lv = db(g * v[actif])
        lm = db(musique[i0:i1][actif])
        lb = db(bruitages[i0:i1][actif])
        niveaux_voix.append(lv)
        print(f'{nom_v:8} {attendu:8.2f} {trouve:8.2f} {trouve - attendu:+7.3f} {(trouve - t0) / temps:6.2f} | {lv:6.1f} {lm:8.1f} {lv - lm:5.1f} {lb:7.1f}')
    moy = float(np.mean(niveaux_voix))
    print(f'\nvoix : {moy:.1f} dB en moyenne pendant qu’elle parle')
    pas = int(0.4 * SR)
    fen = [(db(bruitages[i:i + pas]), i / SR) for i in range(0, n - pas, pas // 2)]
    fen.sort(reverse=True)
    print('bruitages les plus forts (fenêtres de 0,4 s) :', ', '.join(f'{t:.1f} s : {l - moy:+.1f} dB' for l, t in fen[:8]))
    fen = [(db(musique[i:i + pas]), i / SR) for i in range(0, n - pas, pas // 2)]
    fen.sort(reverse=True)
    print('musique la plus forte :', ', '.join(f'{t:.1f} s : {l - moy:+.1f} dB' for l, t in fen[:5]))


if __name__ == '__main__':
    main()
