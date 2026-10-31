"""La musique de la vidéo « minuit » (2026-10-31, la dernière nuit d'Halloween sur la carte) : composée ici (aucun droit,
aucun crédit), un « phonk » qui fait peur, sur la mécanique de celle de la vidéo « éclat » (eclat/musique.py).
    python outils/video/minuit/musique.py

120 battements par minute (un temps = 30 images de la vidéo, à 60 images/s), 22,5 s, calée sur l'histoire :
- l'accroche (temps 0 → 6) : une boîte à musique qui égrène la gamme japonaise miyako-bushi (ré, mi bémol, sol, la,
  si bémol) sur un bourdon grave et du vent ; le tic-tac de l'horloge est un bruitage à part (il reste dans la version
  sans musique) ; une montée de souffle jusqu'au plongeon ;
- le grand départ (temps 6 → 30, six mesures) : grosse caisse et basse « 808 » saturées, clap sur 2 et 4,
  charlestons, la cloche du phonk (« cowbell ») doublée de la boîte à musique deux octaves au-dessus, et un koto pincé
  (Karplus-Strong) à partir de la troisième mesure ; la sixième s'arrête net un demi-temps avant minuit ;
- minuit (temps 30 → 36) : plus que le bourdon, un battement de cœur et une montée ; au temps 33 (16,5 s) la cloche
  de minuit (un bruitage, celle de la balade) et un coup sourd, puis presque le silence ;
- la fin (temps 36 → 45) : le phonk revient d'un coup (le logo), deuxième coup au temps 40 (l'adresse), la dernière
  phrase, un dernier coup au temps 44 et la queue.
Sorties : videos/carte/minuit/public/musique/minuit.wav (48 kHz, stéréo) et sfx/tic.wav, sfx/tac.wav (l'horloge),
sfx/boum.wav (le coup sourd de minuit).
"""
import wave
from functools import lru_cache
from pathlib import Path

import numpy as np

RACINE = Path(__file__).resolve().parents[3]
PUBLIC = RACINE / 'videos' / 'carte' / 'minuit' / 'public'
SR = 48000
BPM = 120
TEMPS = 60 / BPM
PAS = TEMPS / 4  # une double croche (s)
DUREE = 22.5

rng = np.random.default_rng(1031)


def note(nom):
    """« D5 » → sa fréquence (Hz). Les bémols s'écrivent « Eb4 », « Bb4 »."""
    i = {'C': -9, 'D': -7, 'E': -5, 'F': -4, 'G': -2, 'A': 0, 'B': 2}[nom[0]]
    if len(nom) == 3:
        i += -1 if nom[1] == 'b' else 1
    return 440 * 2 ** ((i + 12 * (int(nom[-1]) - 4)) / 12)


def octave(nom, k):
    return nom[:-1] + str(int(nom[-1]) + k)


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
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-u / 0.5)
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
def boite(nom):
    """Une lame de boîte à musique : un sinus pur, un partiel inharmonique (×5,4) qui s'éteint vite, une longue traîne."""
    u = t(1.6)
    f = note(nom)
    x = np.sin(2 * np.pi * f * u) * np.exp(-u / 0.55) + 0.35 * np.sin(2 * np.pi * f * 5.4 * u) * np.exp(-u / 0.05)
    x += 0.12 * np.sin(2 * np.pi * f * 2 * u) * np.exp(-u / 0.25)
    return x * np.minimum(1, u / 0.0015)


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


def bourdon(duree):
    """Le bourdon de l'accroche et de minuit : ré grave et sa quinte, qui tremblent un peu, et un vent filtré."""
    u = t(duree)
    trem = 1 + 0.25 * np.sin(2 * np.pi * 0.7 * u)
    x = (np.sin(2 * np.pi * note('D2') * u) + 0.5 * np.sin(2 * np.pi * note('A2') * u + 0.3)
         + 0.25 * np.sin(2 * np.pi * note('D3') * 1.003 * u)) * trem
    vent = passe_bande(rng.standard_normal(len(u)), 500, 0.7) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.23 * u + 1.0))
    fondu = np.minimum(1, u / 0.3) * np.minimum(1, (duree - u) / 0.3)
    return (0.5 * x + 0.35 * vent) * fondu


def montee(duree):
    """Un souffle qui monte (bruit filtré de plus en plus aigu et fort) et un sinus qui glisse vers le haut."""
    u = t(duree)
    r = u / duree
    b = rng.standard_normal(len(u))
    b = b - passe_bas(b, 900)
    sweep = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (2.5 * r)) / SR)
    return (b * 0.5 + 0.25 * sweep) * r ** 2.2


@lru_cache(None)
def coeur():
    """Un battement de cœur : deux coups sourds (lub-dub)."""
    u = t(0.6)
    def coup(d, a):
        v = np.maximum(0, u - d)
        return (u >= d) * a * np.sin(2 * np.pi * (40 + 30 * np.exp(-v / 0.03)) * v) * np.exp(-v / 0.09)
    return np.tanh(2 * (coup(0, 1.0) + coup(0.22, 0.75)))


def tic(aigu):
    """Le tic (aigu) et le tac de l'horloge : un clic sec et une petite résonance de bois."""
    u = t(0.18)
    f = 3400 if aigu else 2300
    b = rng.standard_normal(len(u)) * np.exp(-u / 0.0025)
    res = passe_bande(b, f, 6) * 6 + np.sin(2 * np.pi * (f / 3.1) * u) * np.exp(-u / 0.02) * 0.5
    return res / np.abs(res).max() * 0.9


def boum():
    """Le coup sourd de minuit : un sinus très grave qui tombe, long, et un souffle."""
    u = t(2.6)
    f = 34 + 50 * np.exp(-u / 0.08)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-u / 0.7)
    souffle = passe_bas(rng.standard_normal(len(u)), 300) * np.exp(-u / 0.4) * 2
    y = np.tanh(2.5 * (x + souffle))
    return y / np.abs(y).max() * 0.95


# ---------------------------------------------------------------- la partition (en doubles croches, 16 par mesure)
# la cloche du phonk : le motif 3-3-2 (pas 0, 3, 6, puis 8, 11, 14), qui descend et revient
RIFF_A = [(0, 'D5'), (3, 'D5'), (6, 'Eb5'), (8, 'D5'), (10, 'Bb4'), (11, 'A4'), (12, 'Bb4'), (14, 'G4')]
RIFF_B = [(0, 'D5'), (3, 'D5'), (6, 'Eb5'), (8, 'A5'), (10, 'G5'), (11, 'Eb5'), (12, 'D5'), (14, 'A4')]
GROSSE = [0, 6, 10]
BASSE_A = [(0, 'D2', 6), (6, 'D2', 4), (10, 'Bb1', 6)]
BASSE_B = [(0, 'D2', 6), (6, 'D2', 4), (10, 'G1', 6)]
# l'accroche, à la boîte à musique (en croches : 8 par mesure de 4 temps), sur 6 temps
ACCROCHE = [(0, 'A5'), (1, 'Bb5'), (2, 'A5'), (4, 'Eb5'), (5, 'D5'), (8, 'G5'), (9, 'A5'), (10, 'Bb5'), (11, 'A5')]


def main():
    n = int(DUREE * SR)
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

    # ---- l'accroche (temps 0 → 6)
    poser(bourdon(3.1), 0, 0.32)
    for k, nom in ACCROCHE:
        poser(boite(octave(nom, 0)), k * TEMPS / 2, 0.22, pan=-0.25)
    poser(montee(1.0), 2.0, 0.45, arret=2.96)

    # ---- le grand départ (temps 6 → 30) : six mesures de 4 temps
    def mesure(t0, riff, ligne, arret=16, crash=False, avec_koto=False, avec_boite=True):
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
        pas_ch = list(range(0, 16, 2)) + ([9, 11, 13, 13.5, 14.5, 15] if arret < 16 else [])
        for p in sorted(pas_ch):
            if p < arret:
                poser(charleston(p == 10), t0 + p * PAS, 0.24 if p % 2 == 0 else 0.16, pan=0.35, arret=fin)
        for p, nom in riff:
            if p < arret:
                poser(cloche(nom), t0 + p * PAS, 0.45, pan=-0.2, arret=fin)
                if avec_boite:
                    poser(boite(octave(nom, 1)), t0 + p * PAS, 0.13, pan=0.3)
                if avec_koto:
                    poser(koto(octave(nom, -1)), t0 + p * PAS, 0.5, pan=0.45, arret=fin)

    debut = 6 * TEMPS
    plan = [(RIFF_A, BASSE_A, 16, True, False), (RIFF_B, BASSE_B, 16, False, False),
            (RIFF_A, BASSE_A, 16, True, True), (RIFF_B, BASSE_B, 16, False, True),
            (RIFF_A, BASSE_A, 16, True, True), (RIFF_B, BASSE_B, 14, False, True)]
    for m, (riff, ligne, arret, crash, avec_koto) in enumerate(plan):
        mesure(debut + m * 16 * PAS, riff, ligne, arret, crash, avec_koto)

    # ---- minuit (temps 30 → 36) : le bourdon, le cœur, la montée ; la cloche (bruitage) au temps 33
    t30 = 30 * TEMPS
    poser(bourdon(1.65), t30, 0.3)
    for k in range(3):
        poser(coeur(), t30 + k * TEMPS, 0.55)
    poser(montee(1.4), t30 + 0.1, 0.3, arret=33 * TEMPS - 0.02)
    poser(bourdon(1.5), 33 * TEMPS + 0.05, 0.18)

    # ---- la fin (temps 36 → 45)
    t36 = 36 * TEMPS
    mesure(t36, RIFF_A, BASSE_A, 16, True, True)
    t40 = 40 * TEMPS
    poser(cymbale(), t40, 0.32)
    poser(grosse_caisse(), t40, 0.95)
    poser(basse('D2', 8 * PAS), t40, 0.4)
    poser(clap(), t40, 0.35)
    for p, nom in RIFF_B[:6]:
        poser(cloche(nom), t40 + p * PAS, 0.35, pan=-0.2)
        poser(koto(octave(nom, -1)), t40 + p * PAS, 0.45, pan=0.45)
        poser(boite(octave(nom, 1)), t40 + p * PAS, 0.12, pan=0.3)
    t44 = 44 * TEMPS
    poser(cymbale(), t44, 0.3)
    poser(grosse_caisse(), t44, 0.9)
    poser(basse('D2', 0.5), t44, 0.4)
    poser(koto('D3'), t44, 0.6, pan=0.45)
    poser(boite('D6'), t44, 0.2, pan=0.3)

    st = np.stack([g, d], 1)
    st = np.tanh(1.15 * st) / np.tanh(1.15)
    st *= 0.95 / np.abs(st).max()
    queue = int(0.45 * SR)
    st[-queue:] *= np.linspace(1, 0, queue)[:, None] ** 2

    def ecrire(chemin, x):
        chemin.parent.mkdir(parents=True, exist_ok=True)
        x = np.atleast_2d(x.T).T if x.ndim == 1 else x
        if x.ndim == 1 or x.shape[1] == 1:
            x = np.repeat(x.reshape(-1, 1), 2, axis=1)
        with wave.open(str(chemin), 'wb') as w:
            w.setnchannels(2)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())

    ecrire(PUBLIC / 'musique' / 'minuit.wav', st)
    ecrire(PUBLIC / 'sfx' / 'tic.wav', tic(True))
    ecrire(PUBLIC / 'sfx' / 'tac.wav', tic(False))
    ecrire(PUBLIC / 'sfx' / 'boum.wav', boum())
    print('→', PUBLIC / 'musique' / 'minuit.wav', f'{len(st) / SR:.2f} s, un temps = {TEMPS} s')


if __name__ == '__main__':
    main()
