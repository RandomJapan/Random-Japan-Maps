"""La musique de la vidéo « éclat » (2026-10-27) : un rythme « phonk » à la japonaise, composé ici (aucun droit, aucun
crédit), qui démarre d'un coup quand la vitre éclate, comme les vidéos du PSG que le propriétaire a montrées.
    python outils/video/eclat/musique.py

140 battements par minute, 7 mesures (12 s) : une grosse caisse et une basse « 808 » saturée (pour qu'on l'entende
sur un téléphone), un clap sur les temps 2 et 4, des charlestons, et la mélodie à la cloche (« cowbell », la marque du
phonk) dans la gamme japonaise miyako-bushi (ré, mi bémol, sol, la, si bémol), doublée d'un koto pincé (Karplus-Strong)
à l'octave du dessous. Les mesures 2, 4 et 6 s'arrêtent net avant la fin (une demi-mesure de silence ou moins) : les
coupures du montage tombent dans ces trous. La dernière mesure frappe deux coups (le logo) et s'éteint.
Sortie : videos/eclat/public/musique/eclat.wav (48 kHz, stéréo).
"""
import wave
from functools import lru_cache
from pathlib import Path

import numpy as np

RACINE = Path(__file__).resolve().parents[3]
SORTIE = RACINE / 'videos' / 'eclat' / 'public' / 'musique' / 'eclat.wav'
SR = 48000
BPM = 140
PAS = 60 / BPM / 4  # une double croche (s)
MESURES = 7  # la 7e : deux coups (le logo), puis la fin
FIN = 0.4  # (s) après la dernière mesure : le dernier coup s'éteint, la vidéo finit là

rng = np.random.default_rng(140)


def note(nom):
    """« D5 » → sa fréquence (Hz). Les bémols s'écrivent « Eb4 », « Bb4 »."""
    i = {'C': -9, 'D': -7, 'E': -5, 'F': -4, 'G': -2, 'A': 0, 'B': 2}[nom[0]]
    if len(nom) == 3:
        i += -1 if nom[1] == 'b' else 1
    return 440 * 2 ** ((i + 12 * (int(nom[-1]) - 4)) / 12)


def t(n):
    return np.arange(int(n * SR)) / SR


def passe_bas(x, fc):
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    v = 0.0
    for i, s in enumerate(x):
        v = (1 - a) * s + a * v
        y[i] = v
    return y


def passe_bande(x, f0, q):
    w = 2 * np.pi * f0 / SR
    al = np.sin(w) / (2 * q)
    b0, b2, a0, a1, a2 = al, -al, 1 + al, -2 * np.cos(w), 1 - al
    y = np.zeros_like(x)
    x1 = x2 = y1 = y2 = 0.0
    for i, s in enumerate(x):
        v = (b0 * s + b2 * x2 - a1 * y1 - a2 * y2) / a0
        x2, x1, y2, y1 = x1, s, y1, v
        y[i] = v
    return y


# ---------------------------------------------------------------- les instruments (un échantillon chacun, mis en cache)
@lru_cache(None)
def grosse_caisse():
    u = t(0.32)
    f = 48 + 110 * np.exp(-u / 0.035)
    corps = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-u / 0.16)
    clic = rng.standard_normal(len(u)) * np.exp(-u / 0.003) * 0.5
    return np.tanh(2.2 * (corps + clic)) * 0.95


@lru_cache(None)
def basse(nom, duree):
    """La « 808 » : un sinus qui tombe d'une octave en 40 ms, long, saturé (des harmoniques pour les petits haut-parleurs)."""
    u = t(duree)
    f0 = note(nom)
    f = f0 * (1 + 1.0 * np.exp(-u / 0.04))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-u / 0.42)
    x = np.tanh(3.2 * x) / np.tanh(3.2)
    x = passe_bas(x, 900)
    fondu = np.minimum(1, (duree - u) / 0.012)
    return x * np.minimum(1, u / 0.002) * fondu


@lru_cache(None)
def clap():
    u = t(0.3)
    bruit = rng.standard_normal(len(u))
    env = np.zeros_like(u)
    for d in (0, 0.011, 0.022):
        env += (u >= d) * np.exp(-np.maximum(0, u - d) / 0.006)
    env += (u >= 0.03) * np.exp(-np.maximum(0, u - 0.03) / 0.09) * 0.8
    return passe_bande(bruit * env, 1500, 0.9) * 2.2


@lru_cache(None)
def charleston(ouvert=False):
    u = t(0.25 if ouvert else 0.06)
    b = rng.standard_normal(len(u))
    b = b - passe_bas(b, 7000)
    return b * np.exp(-u / (0.08 if ouvert else 0.014))


@lru_cache(None)
def cymbale():
    u = t(1.8)
    b = rng.standard_normal(len(u))
    b = b - passe_bas(b, 5000)
    return b * np.exp(-u / 0.5) * 0.9


@lru_cache(None)
def cloche(nom):
    """La cloche de la 808 : deux carrés (rapport 1,48), filtrés en bande, une attaque sèche et une courte traîne."""
    u = t(0.32)
    f = note(nom)
    x = np.sign(np.sin(2 * np.pi * f * u)) + np.sign(np.sin(2 * np.pi * f * 1.4815 * u))
    x = passe_bande(x, f * 1.25, 2.2)
    env = np.exp(-u / 0.018) * 0.6 + np.exp(-u / 0.13) * 0.4
    return x * env * 1.6


@lru_cache(None)
def koto(nom):
    """Une corde pincée (Karplus-Strong), un peu métallique."""
    f = note(nom)
    n = int(SR * 0.9)
    p = int(round(SR / f))
    y = np.zeros(n)
    y[:p] = rng.uniform(-1, 1, p) * np.hanning(p)
    for i in range(p, n):
        y[i] = 0.4985 * (y[i - p] + y[i - p - 1]) if i > p else y[i - p]
    u = t(0.9)
    return passe_bas(y, 3800) * np.exp(-u / 0.45) * 1.4


# ---------------------------------------------------------------- la partition (en doubles croches, 16 par mesure)
RIFF_A = [(0, 'D5'), (2, 'D5'), (3, 'A4'), (4, 'Bb4'), (6, 'A4'), (7, 'G4'), (8, 'A4'), (10, 'Eb5'), (11, 'D5'), (12, 'A4'),
          (14, 'Bb4'), (15, 'A4')]
RIFF_B = [(0, 'D5'), (2, 'D5'), (3, 'A4'), (4, 'Bb4'), (6, 'A4'), (7, 'G4'), (8, 'Eb4'), (10, 'G4'), (11, 'A4'), (12, 'Bb4'),
          (13, 'A4'), (14, 'G4'), (15, 'A4')]
GROSSE = [0, 6, 10]
BASSE = [(0, 'D2', 6), (6, 'D2', 4), (10, 'Bb1', 6)]
BASSE_B = [(0, 'D2', 6), (6, 'D2', 4), (10, 'G1', 6)]
# (mesure : [riff, basse, le pas où tout s'arrête (16 = pas d'arrêt), cymbale au début, koto])
MESURES_PLAN = [
    (RIFF_A, BASSE, 16, True, False),
    (RIFF_B, BASSE_B, 14, False, False),
    (RIFF_A, BASSE, 16, False, True),
    (RIFF_B, BASSE_B, 14, False, True),
    (RIFF_A, BASSE, 16, True, True),
    (RIFF_B, BASSE_B, 12, False, True),
]


def main():
    n = int((MESURES * 16 * PAS + FIN) * SR)
    g, d = np.zeros(n), np.zeros(n)

    def poser(x, temps, vol, pan=0.0, arret=None):
        i = int(round(temps * SR))
        if arret is not None:
            x = x[:max(0, int(round((arret - temps) * SR)))]
            if len(x) > 96:
                x = x.copy()
                x[-96:] *= np.linspace(1, 0, 96)
        x = x[:n - i]
        g[i:i + len(x)] += x * vol * (1 - pan) ** 0.5
        d[i:i + len(x)] += x * vol * (1 + pan) ** 0.5

    for m, (riff, ligne, arret, crash, avec_koto) in enumerate(MESURES_PLAN):
        t0 = m * 16 * PAS
        fin = t0 + arret * PAS
        if crash:
            poser(cymbale(), t0, 0.32, arret=t0 + 16 * PAS)
        for p in GROSSE:
            if p < arret:
                poser(grosse_caisse(), t0 + p * PAS, 0.8, arret=fin)
        for p, nom, longueur in ligne:
            if p < arret:
                poser(basse(nom, longueur * PAS), t0 + p * PAS, 0.36, arret=fin)
        for p in (4, 12):
            if p < arret:
                poser(clap(), t0 + p * PAS, 0.6, arret=fin)
        # les charlestons : des croches, puis des triples croches à la fin des mesures 2 et 4 (avant l'arrêt)
        pas_ch = [p for p in range(0, 16, 2)] + ([9, 11, 12.5, 13, 13.5] if arret == 14 else [])
        for p in sorted(pas_ch):
            if p < arret:
                poser(charleston(p == 10), t0 + p * PAS, 0.24 if p % 2 == 0 else 0.16, pan=0.35, arret=fin)
        for p, nom in riff:
            if p < arret:
                poser(cloche(nom), t0 + p * PAS, 0.5, pan=-0.2, arret=fin)
                if avec_koto:
                    poser(koto(nom[:-1] + str(int(nom[-1]) - 1)), t0 + p * PAS, 0.5, pan=0.45, arret=fin)
    # la dernière mesure : deux coups (le logo), la basse qui sonne longtemps, la cloche une fois
    t7 = 6 * 16 * PAS
    for k, dt in enumerate((0, 8 * PAS)):
        poser(cymbale(), t7 + dt, 0.36)
        poser(grosse_caisse(), t7 + dt, 1.0)
        poser(basse('D2', 1.4 if k else 8 * PAS), t7 + dt, 0.42)
        poser(clap(), t7 + dt, 0.3)
    for p, nom in RIFF_A[:5]:
        poser(cloche(nom), t7 + p * PAS, 0.45, pan=-0.2)
        poser(koto(nom[:-1] + str(int(nom[-1]) - 1)), t7 + p * PAS, 0.45, pan=0.45)
    poser(koto('D3'), t7 + 8 * PAS, 0.6, pan=0.45)
    poser(cloche('D5'), t7 + 8 * PAS, 0.5, pan=-0.2)

    st = np.stack([g, d], 1)
    st = np.tanh(1.15 * st) / np.tanh(1.15)
    st *= 0.95 / np.abs(st).max()
    queue = int(0.5 * SR)
    st[-queue:] *= np.linspace(1, 0, queue)[:, None] ** 2
    SORTIE.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(SORTIE), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((st * 32767).astype('<i2').tobytes())
    print('→', SORTIE, f'{len(st) / SR:.2f} s, mesure = {16 * PAS:.4f} s')


if __name__ == '__main__':
    main()
