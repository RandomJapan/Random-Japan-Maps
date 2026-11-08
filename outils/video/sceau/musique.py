"""La musique de la vidéo « sceau » (2026-11-08) : un rythme « phonk » à la japonaise, composé ici (aucun droit, aucun crédit),
qui éclate quand on plonge dans la carte de la lettre (temps 12 de la vidéo). Avant, rien : seulement les bruits du geste. La forme
et les instruments de la vidéo « jarre » (jarre/musique.py), sur une autre mélodie, dans une autre gamme.
    python outils/video/sceau/musique.py

144 battements par minute (un temps = 25 images à 60 images/s) dans la gamme miyako-bushi sur la (la, si bémol, ré, mi, fa). La
mesure 0 commence au temps 10 de la vidéo, mais on n'en joue que la seconde moitié, à partir du coup d'ouverture (temps 12 ; le geste
de l'accroche a besoin de ses cinq secondes) : les temps de la vidéo sont donc 10 + 4 × mesure + pas / 4. Une grosse caisse et une
basse « 808 » saturée (pour qu'on l'entende sur un téléphone), un clap sur les temps 2 et 4, des charlestons, la mélodie à la
cloche (« cowbell ») doublée d'un koto à partir de la mesure 2, un taiko aux changements de partie. La mesure 6 s'arrête net au
temps 36,5 (la vidéo se fige) et repart au temps 37 (le portail vers la balade). Les mesures 8 et 9 : deux coups (le logo,
puis « FREE · LINK IN BIO »), puis tout s'éteint à la fin de la vidéo.
Sortie : videos/carte/sceau/public/musique/sceau.wav (48 kHz, stéréo), qui commence au temps 12.
"""
import wave
from functools import lru_cache
from pathlib import Path

import numpy as np

RACINE = Path(__file__).resolve().parents[3]
SORTIE = RACINE / 'videos' / 'carte' / 'sceau' / 'public' / 'musique' / 'sceau.wav'
SR = 48000
BPM = 144
PAS = 60 / BPM / 4  # une double croche (s)
TEMPS_TOTAL = 36  # du temps 12 au temps 48 de la vidéo
DEBUT = 8  # le pas de la mesure 0 où la musique commence (le temps 12)

rng = np.random.default_rng(1108)


def note(nom):
    """« E5 » → sa fréquence (Hz)."""
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
def taiko():
    """Un grand tambour : le fût qui descend d'une tierce, la peau frappée (un peu de bruit grave)."""
    u = t(0.9)
    f = 72 + 34 * np.exp(-u / 0.05)
    corps = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-u / 0.26)
    corps += 0.35 * np.sin(2 * np.pi * np.cumsum(f * 1.59) / SR) * np.exp(-u / 0.12)
    peau = passe_bas(rng.standard_normal(len(u)), 700) * np.exp(-u / 0.018) * 2.2
    return np.tanh(1.6 * (corps + peau))


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
RIFF_A = [(0, 'A5'), (2, 'A5'), (3, 'Bb5'), (6, 'A5'), (8, 'E5'), (10, 'F5'), (11, 'E5'), (12, 'D5'), (14, 'E5')]
RIFF_B = [(0, 'A5'), (3, 'D6'), (6, 'Bb5'), (8, 'A5'), (10, 'F5'), (12, 'E5'), (13, 'D5'), (14, 'Bb4'), (15, 'A4')]
GROSSE = [0, 6, 10]
BASSE = [(0, 'A1', 6), (6, 'A1', 4), (10, 'F1', 6)]
BASSE_B = [(0, 'A1', 6), (6, 'A1', 4), (10, 'D2', 6)]
# (mesure : [riff, basse, le pas où tout s'arrête (16 = pas d'arrêt), un coup de cymbale et de taiko au début, koto])
MESURES_PLAN = [
    (RIFF_A, BASSE, 16, True, False),   # temps 10 : on plonge dans la carte de la lettre
    (RIFF_B, BASSE_B, 16, False, False),
    (RIFF_A, BASSE, 16, True, True),    # temps 18
    (RIFF_B, BASSE_B, 16, False, True),
    (RIFF_A, BASSE, 16, True, True),    # temps 26
    (RIFF_B, BASSE_B, 16, False, True),
    (RIFF_A, BASSE, 10, True, True),    # temps 34, s'arrête au temps 36,5
    (RIFF_B, BASSE_B, 14, True, True),  # temps 38, s'arrête au temps 41,5
]


def main():
    n = int(TEMPS_TOTAL * 4 * PAS * SR)
    g, d = np.zeros(n), np.zeros(n)

    def poser(x, temps, vol, pan=0.0, arret=None):
        i = int(round(temps * SR))
        if i >= n:
            return
        if arret is not None:
            x = x[:max(0, int(round((arret - temps) * SR)))]
            if len(x) > 96:
                x = x.copy()
                x[-96:] *= np.linspace(1, 0, 96)
        x = x[:n - i]
        g[i:i + len(x)] += x * vol * (1 - pan) ** 0.5
        d[i:i + len(x)] += x * vol * (1 + pan) ** 0.5

    for m, (riff, ligne, arret, coup, avec_koto) in enumerate(MESURES_PLAN):
        t0 = (m * 16 - DEBUT) * PAS
        fin = t0 + arret * PAS
        if m == 0:  # le coup d'ouverture : tout frappe ensemble, la basse tient jusqu'au pas 10
            poser(cymbale(), 0, 0.36)
            poser(taiko(), 0, 0.6)
            poser(grosse_caisse(), 0, 0.9)
            poser(basse('A1', 2 * PAS), 0, 0.36)
        elif coup:
            poser(cymbale(), t0, 0.32, arret=t0 + 16 * PAS)
            poser(taiko(), t0, 0.5, arret=t0 + 16 * PAS)
        depart = DEBUT if m == 0 else 0
        for p in GROSSE:
            if depart <= p < arret:
                poser(grosse_caisse(), t0 + p * PAS, 0.8, arret=fin)
        for p, nom, longueur in ligne:
            if depart <= p < arret:
                poser(basse(nom, longueur * PAS), t0 + p * PAS, 0.36, arret=fin)
        for p in (4, 12):
            if depart <= p < arret:
                poser(clap(), t0 + p * PAS, 0.6, arret=fin)
        pas_ch = [p for p in range(0, 16, 2)] + ([9, 11, 12.5, 13, 13.5] if m in (1, 3, 5) else [])
        for p in sorted(pas_ch):
            if depart <= p < arret:
                poser(charleston(p == 10), t0 + p * PAS, 0.24 if p % 2 == 0 else 0.16, pan=0.35, arret=fin)
        for p, nom in riff:
            if depart <= p < arret:
                poser(cloche(nom), t0 + p * PAS, 0.5, pan=-0.2, arret=fin)
                if avec_koto:
                    poser(koto(nom[:-1] + str(int(nom[-1]) - 1)), t0 + p * PAS, 0.5, pan=0.45, arret=fin)
    # le temps 37 (mesure 6, pas 12) : le coup qui ouvre le portail, puis un roulement jusqu'au temps 38
    t37 = (6 * 16 - DEBUT + 12) * PAS
    poser(grosse_caisse(), t37, 1.0)
    poser(taiko(), t37, 0.55)
    poser(basse('A1', 4 * PAS), t37, 0.42)
    poser(clap(), t37, 0.5)
    for k in range(8):
        poser(charleston(), t37 + k * PAS / 2, 0.14 + 0.02 * k, pan=0.35)
    for p in (2, 3):
        poser(taiko(), t37 + p * PAS, 0.35)
    # la fin (temps 42 et 44) : deux coups, la basse qui sonne longtemps, la cloche et le koto une dernière fois
    t42 = (8 * 16 - DEBUT) * PAS
    for k, dt in enumerate((0, 8 * PAS)):
        poser(cymbale(), t42 + dt, 0.36)
        poser(grosse_caisse(), t42 + dt, 1.0)
        poser(taiko(), t42 + dt, 0.6)
        poser(basse('A1', 1.6 if k else 8 * PAS), t42 + dt, 0.42)
        poser(clap(), t42 + dt, 0.3)
    for p, nom in RIFF_A[:4]:
        poser(cloche(nom), t42 + p * PAS, 0.45, pan=-0.2)
        poser(koto(nom[:-1] + str(int(nom[-1]) - 1)), t42 + p * PAS, 0.45, pan=0.45)
    poser(koto('A3'), t42 + 8 * PAS, 0.6, pan=0.45)
    poser(cloche('A5'), t42 + 8 * PAS, 0.5, pan=-0.2)

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
    print('→', SORTIE, f'{len(st) / SR:.3f} s, mesure = {16 * PAS:.4f} s')


if __name__ == '__main__':
    main()
