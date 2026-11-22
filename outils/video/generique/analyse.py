# -*- coding: utf-8 -*-
"""Analyse d'une chanson générée (vidéo « générique d'animé ») : son tempo, la phase de ses temps, et par mesure son volume,
sa brillance et ce qui ressemble à une voix (le centre de la stéréo, dans les fréquences de la voix, contre les côtés).
Seulement numpy (pas de librosa sur ce PC).
    python analyse.py <fichier> [<fichier>...]"""
import subprocess
import sys

import numpy as np

FF = r'C:\Users\Lucas\AppData\Roaming\Python\Python312\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe'
SR = 48000


def lire(f, canaux=2):
    brut = subprocess.run([FF, '-v', 'error', '-i', f, '-f', 'f32le', '-ac', str(canaux), '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(brut, np.float32).reshape(-1, canaux)


def flux_spectral(m, hop=480, n=2048):
    """L'enveloppe des attaques (100 par seconde) : la hausse du spectre (log) d'une trame à l'autre."""
    fen = np.hanning(n)
    trames = np.lib.stride_tricks.sliding_window_view(np.pad(m, (n // 2, n // 2)), n)[::hop] * fen
    S = np.log1p(np.abs(np.fft.rfft(trames, axis=1)) * 10)
    d = np.maximum(0, np.diff(S, axis=0)).sum(axis=1)
    d = np.concatenate([[0], d])
    d -= np.convolve(d, np.ones(50) / 50, mode='same')
    return np.maximum(d, 0)


def tempo(env, fps=100, bas=70, haut=200):
    """Le tempo par autocorrélation de l'enveloppe, puis la phase qui met le plus d'attaques sur la grille."""
    e = env - env.mean()
    ac = np.correlate(e, e, mode='full')[len(e) - 1:]
    meilleurs = []
    for bpm in np.arange(bas, haut, 0.05):
        lag = 60 * fps / bpm
        score = sum(np.interp(lag * k, np.arange(len(ac)), ac) / k ** 0.3 for k in (1, 2, 4))
        meilleurs.append((score, bpm))
    bpm = max(meilleurs)[1]
    periode = 60 / bpm
    phases = np.arange(0, periode, 0.002)
    t = np.arange(len(env)) / fps
    scores = [np.sum(env * np.exp(-((((t - p) / periode) % 1 + 0.5) % 1 - 0.5) ** 2 / (2 * 0.03 ** 2))) for p in phases]
    return bpm, phases[int(np.argmax(scores))]


def bandes(x, sr, de, a):
    X = np.abs(np.fft.rfft(x * np.hanning(len(x))))
    fr = np.fft.rfftfreq(len(x), 1 / sr)
    return np.sum(X[(fr >= de) & (fr < a)] ** 2)


def analyser(f):
    st = lire(f)
    m = st.mean(axis=1)
    env = flux_spectral(m)
    bpm, phase = tempo(env)
    periode = 60 / bpm
    print(f'\n=== {f} : {len(m) / SR:.2f} s, {bpm:.2f} BPM, premier temps à {phase:.3f} s (temps = {periode:.4f} s, mesure = {4 * periode:.3f} s)')
    # par demi-mesure : volume, brillance, voix (centre - côtés dans 300-3500 Hz)
    pas = 2 * periode
    print(' temps   début   vol dB  brill Hz  centre/côtés dB')
    k = 0
    while phase + (k + 1) * pas <= len(m) / SR + 0.01:
        a, z = int((phase + k * pas) * SR), int((phase + (k + 1) * pas) * SR)
        seg = st[a:z]
        mm = seg.mean(axis=1)
        ss = (seg[:, 0] - seg[:, 1]) / 2
        rms = 20 * np.log10(np.sqrt(np.mean(mm ** 2)) + 1e-9)
        X = np.abs(np.fft.rfft(mm * np.hanning(len(mm))))
        fr = np.fft.rfftfreq(len(mm), 1 / SR)
        brill = np.sum(fr * X) / np.sum(X)
        voix = 10 * np.log10(bandes(mm, SR, 300, 3500) / (bandes(ss, SR, 300, 3500) + 1e-12))
        print(f' {2 * k:5.0f}  {phase + k * pas:6.2f}  {rms:7.1f}  {brill:8.0f}  {voix:8.1f}')
        k += 1


if __name__ == '__main__':
    for f in sys.argv[1:]:
        analyser(f)
