"""La musique et les bruitages calculés des deux vidéos du jeu (2026-11-09), composés ici (aucun droit, aucun crédit), avec les
instruments de la vidéo « sceau » (sceau/musique.py).
    python outils/video/jeu/musique.py

« Devine le lieu » (musique/devine.wav) : 120 battements par minute (un temps = 30 images), en miyako-bushi sur ré (ré, mi bémol, sol,
la, si bémol). Une tension sourde pendant qu'on devine (un cœur, un grave qui monte, le tic-tac est un bruitage), et le rythme phonk qui
éclate à chaque révélation. Le quatrième lieu s'arrête net (« Time's up »). Deux coups à la fin.
Le défi du jour (musique/defi.wav) : 144 battements par minute (un temps = 25 images), en miyako-bushi sur mi (mi, fa, la, si, do).
Elle se construit comme la partie : chaque essai ajoute un instrument et fait monter le koto, de « froid » à « brûlant » ; elle se
tait une demi-mesure quand le lieu est trouvé, et éclate quand la photo devient nette.
Bruitages (sfx/), dans la tonalité de leur vidéo : tic, toc, epingle, pts (les points qui montent), bien, moyen, loin, et les
températures du défi froid, tiede, chaud, brulant, trouve.
"""
import importlib.util
import wave
from pathlib import Path

import numpy as np

ICI = Path(__file__).resolve().parent
PUBLIC = ICI.parents[2] / 'videos' / 'carte' / 'jeu' / 'public'
sp = importlib.util.spec_from_file_location('instruments', ICI.parent / 'sceau' / 'musique.py')
I = importlib.util.module_from_spec(sp)
sp.loader.exec_module(I)
SR = I.SR
rng = np.random.default_rng(1109)


def t(n):
    return np.arange(int(n * SR)) / SR


def ecrire(chemin, st):
    chemin.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(chemin), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(st, -1, 1) * 32767).astype('<i2').tobytes())


class Piste:
    def __init__(self, duree):
        self.n = int(duree * SR)
        self.g, self.d = np.zeros(self.n), np.zeros(self.n)

    def poser(self, x, temps, vol, pan=0.0, arret=None):
        i = int(round(temps * SR))
        if i >= self.n or i < 0:
            return
        if arret is not None:
            x = x[:max(0, int(round((arret - temps) * SR)))]
            if len(x) > 96:
                x = x.copy()
                x[-96:] *= np.linspace(1, 0, 96)
        x = x[:self.n - i]
        self.g[i:i + len(x)] += x * vol * (1 - pan) ** 0.5
        self.d[i:i + len(x)] += x * vol * (1 + pan) ** 0.5

    def fin(self, queue=0.5):
        st = np.stack([self.g, self.d], 1)
        st = np.tanh(1.15 * st) / np.tanh(1.15)
        st *= 0.95 / np.abs(st).max()
        q = int(queue * SR)
        st[-q:] *= np.linspace(1, 0, q)[:, None] ** 2
        return st


def montee(duree, f0, f1, vol=1.0):
    """Un grave qui monte, avec un souffle : la tension qui précède une révélation."""
    u = t(duree)
    k = (u / duree) ** 2
    f = f0 * (f1 / f0) ** k
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.3 + 0.7 * k)
    x = np.tanh(2 * x) * 0.55
    b = rng.standard_normal(len(u))
    b = b - I.passe_bas(b, 2500)
    return (x + b * 0.1 * k ** 2) * vol


def coeur():
    """Un battement de cœur, sourd : deux coups."""
    u = t(0.42)
    def coup(d, a):
        v = np.maximum(0, u - d)
        return a * (u >= d) * np.sin(2 * np.pi * (46 + 40 * np.exp(-v / 0.02)) * v) * np.exp(-v / 0.07)
    return np.tanh(2.2 * (coup(0, 1) + coup(0.17, 0.7)))


# ---------------------------------------------------------------- Devine le lieu
class Groove:
    """Le rythme phonk, posé sur la grille de la vidéo : mesure de 16 pas, deux mesures qui alternent."""

    def __init__(self, piste, pas, riffs, basses, koto_octave=1):
        self.p, self.pas, self.riffs, self.basses, self.ko = piste, pas, riffs, basses, koto_octave

    def jouer(self, de, a, koto=True, melodie=True, basse=True, clap=True):
        """de, a : en pas (doubles croches depuis le début de la vidéo). Tout s'arrête à a."""
        p, PAS = self.p, self.pas
        fin = a * PAS
        for k in range(int(de), int(a)):
            m, s = k // 16, k % 16
            riff, ligne = self.riffs[m % 2], self.basses[m % 2]
            if s in (0, 6, 10):
                p.poser(I.grosse_caisse(), k * PAS, 0.8, arret=fin)
            if basse:
                for s0, nom, longueur in ligne:
                    if s == s0:
                        p.poser(I.basse(nom, longueur * PAS), k * PAS, 0.36, arret=fin)
            if clap and s in (4, 12):
                p.poser(I.clap(), k * PAS, 0.55, arret=fin)
            if s % 2 == 0 or (m % 2 and s in (9, 11, 13)):
                p.poser(I.charleston(s == 10), k * PAS, 0.24 if s % 2 == 0 else 0.15, pan=0.35, arret=fin)
            if melodie:
                for s0, nom in riff:
                    if s == s0:
                        p.poser(I.cloche(nom), k * PAS, 0.45, pan=-0.2, arret=fin)
                        if koto:
                            p.poser(I.koto(nom[:-1] + str(int(nom[-1]) - self.ko)), k * PAS, 0.5, pan=0.45, arret=fin)

    def coup(self, pas_, fort=1.0):
        T = pas_ * self.pas
        self.p.poser(I.cymbale(), T, 0.36 * fort)
        self.p.poser(I.taiko(), T, 0.6 * fort)
        self.p.poser(I.grosse_caisse(), T, 0.95 * fort)


def devine():
    TEMPS = 0.5
    PAS = TEMPS / 4
    DUREE = 50 * TEMPS
    p = Piste(DUREE)
    g = Groove(p, PAS,
               [[(0, 'A5'), (1, 'G5'), (3, 'Eb5'), (4, 'D5'), (6, 'Eb5'), (8, 'G5'), (10, 'A5'), (11, 'Bb5'), (12, 'A5'), (14, 'G5')],
                [(0, 'D6'), (2, 'Bb5'), (3, 'A5'), (6, 'G5'), (8, 'A5'), (9, 'G5'), (10, 'Eb5'), (12, 'D5'), (14, 'A4'), (15, 'Bb4')]],
               [[(0, 'D2', 6), (6, 'D2', 4), (10, 'G1', 6)], [(0, 'D2', 6), (6, 'Bb1', 4), (10, 'A1', 6)]])
    # (les temps, en doubles croches : ×4) on devine : un cœur, le grave qui monte ; on révèle : tout le rythme
    for de, a in ((0, 6), (11, 15), (19, 21)):
        for k in range(de, a):
            p.poser(coeur(), k * TEMPS, 0.8 if k % 2 == 0 else 0.45)
        p.poser(montee((a - de) * TEMPS, 38, 96), de * TEMPS, 0.42, arret=(a - 0.25) * TEMPS)
    for de, a, koto in ((6, 11, False), (15, 19, True), (21, 26, True)):
        g.coup(de * 4)
        g.jouer(de * 4, a * 4, koto=koto)
    # le quatrième lieu : le grave seul, le cœur qui s'emballe, jusqu'à l'arrêt net (temps 30) ; puis plus rien
    p.poser(montee(4 * TEMPS, 34, 150), 26 * TEMPS, 0.55, arret=30 * TEMPS)
    for k in np.arange(26, 30, 0.5):
        p.poser(coeur(), k * TEMPS, 0.6)
    # le score, les amis
    g.coup(33 * 4)
    g.jouer(33 * 4, 41 * 4)
    # la fin : deux coups, la basse qui sonne, le koto une dernière fois
    for k, de in enumerate((41, 45)):
        g.coup(de * 4, 1.05)
        p.poser(I.basse('D2', 1.8 if k else 8 * PAS), de * TEMPS, 0.42)
        p.poser(I.clap(), de * TEMPS, 0.3)
    for s, nom in g.riffs[0][:5]:
        p.poser(I.cloche(nom), 41 * TEMPS + s * PAS, 0.42, pan=-0.2)
        p.poser(I.koto(nom[:-1] + str(int(nom[-1]) - 1)), 41 * TEMPS + s * PAS, 0.45, pan=0.45)
    p.poser(I.koto('D4'), 45 * TEMPS, 0.6, pan=0.45)
    p.poser(I.cloche('D6'), 45 * TEMPS, 0.45, pan=-0.2)
    ecrire(PUBLIC / 'musique' / 'devine.wav', p.fin(0.6))


# ---------------------------------------------------------------- le défi du jour
def defi():
    TEMPS = 60 / 144
    PAS = TEMPS / 4
    DUREE = 55 * TEMPS
    p = Piste(DUREE)
    riffs = [[(0, 'E5'), (2, 'F5'), (3, 'E5'), (6, 'B4'), (8, 'C5'), (10, 'B4'), (11, 'A4'), (12, 'F4'), (14, 'A4')],
             [(0, 'B5'), (2, 'C6'), (3, 'B5'), (6, 'A5'), (8, 'F5'), (10, 'E5'), (12, 'C5'), (13, 'B4'), (14, 'A4'), (15, 'F4')]]
    g = Groove(p, PAS, riffs, [[(0, 'E2', 6), (6, 'E2', 4), (10, 'C2', 6)], [(0, 'E2', 6), (6, 'A1', 4), (10, 'B1', 6)]])
    ARP = ['E4', 'A4', 'B4', 'E5', 'F5', 'E5', 'B4', 'A4']

    def transpose(nom, demi):
        return I.note(nom) * 2 ** (demi / 12)

    def koto_hz(f):
        """Le koto d'une note quelconque : on rééchantillonne celui de la 4 (440 Hz)."""
        x = I.koto('A4')
        r = f / 440
        return np.interp(np.arange(0, len(x), r), np.arange(len(x)), x)

    # le début : le cœur et le koto, seul ; un grave qui monte jusqu'au premier essai
    for k in range(0, 7):
        p.poser(coeur(), k * TEMPS, 0.75 if k % 2 == 0 else 0.4)
    p.poser(montee(7 * TEMPS, 40, 82), 0, 0.3, arret=6.9 * TEMPS)
    for s in range(0, 7 * 4, 2):
        p.poser(koto_hz(transpose(ARP[(s // 2) % 8], 0)), s * PAS, 0.32, pan=0.3)
    # les essais : (temps de début, de fin, demi-tons du koto, ce qui joue)
    SECTIONS = [(7, 13, 0, 1), (13, 17, 2, 2), (17, 21, 4, 3), (21, 25, 5, 4), (25, 28, 7, 5)]
    for de, a, demi, niveau in SECTIONS:
        fin = a * TEMPS
        for k in range(de * 4, a * 4):
            s = k % 16
            if s in (0, 6, 10) or (niveau >= 4 and s == 14):
                p.poser(I.grosse_caisse(), k * PAS, 0.72, arret=fin)
            if niveau >= 2 and s in (4, 12):
                p.poser(I.clap(), k * PAS, 0.5, arret=fin)
            if s % 2 == 0 or niveau >= 4:
                p.poser(I.charleston(), k * PAS, 0.2 if s % 2 == 0 else 0.13, pan=0.35, arret=fin)
            if niveau >= 3:
                for s0, nom, longueur in ((0, 'E2', 6), (6, 'E2', 4), (10, 'C2', 6)):
                    if s == s0:
                        p.poser(I.basse(nom, longueur * PAS), k * PAS, 0.3, arret=fin)
            if niveau >= 4:
                for s0, nom in riffs[k // 16 % 2]:
                    if s == s0:
                        p.poser(I.cloche(nom), k * PAS, 0.36, pan=-0.2, arret=fin)
            if k % 2 == 0:
                p.poser(koto_hz(transpose(ARP[(k // 2) % 8], demi)), k * PAS, 0.32 + 0.03 * niveau, pan=0.3, arret=fin + 0.2)
    p.poser(montee(3 * TEMPS, 70, 280), 25 * TEMPS, 0.42, arret=28 * TEMPS)
    for k in range(25 * 8, 28 * 8):  # le roulement
        p.poser(I.clap(), k * PAS / 2, 0.12 + 0.3 * (k - 200) / 24, arret=28 * TEMPS)
    # (temps 28 → 29 : le silence ; temps 29 : la photo devient nette)
    g.coup(29 * 4, 1.1)
    g.jouer(29 * 4, 45 * 4)
    for k, de in enumerate((45, 49)):
        g.coup(de * 4, 1.05)
        p.poser(I.basse('E2', 2.2 if k else 8 * PAS), de * TEMPS, 0.42)
        p.poser(I.clap(), de * TEMPS, 0.3)
    for s, nom in riffs[0][:6]:
        p.poser(I.cloche(nom), 45 * TEMPS + s * PAS, 0.42, pan=-0.2)
        p.poser(I.koto(nom[:-1] + str(int(nom[-1]) - 1)), 45 * TEMPS + s * PAS, 0.45, pan=0.45)
    p.poser(I.koto('E4'), 49 * TEMPS, 0.6, pan=0.45)
    p.poser(I.cloche('E6'), 49 * TEMPS, 0.45, pan=-0.2)
    ecrire(PUBLIC / 'musique' / 'defi.wav', p.fin(0.7))


# ---------------------------------------------------------------- les bruitages
def mono(x):
    return np.stack([x, x], 1)


def norme(x, pic=0.9):
    return x * pic / max(1e-6, np.abs(x).max())


def tic(f, duree=0.05):
    u = t(duree)
    x = np.sin(2 * np.pi * f * u) * np.exp(-u / 0.008) + 0.5 * np.sin(2 * np.pi * f * 2.76 * u) * np.exp(-u / 0.004)
    b = rng.standard_normal(len(u)) * np.exp(-u / 0.002) * 0.4
    return norme(x + b)


def carillon(notes, ecart=0.07, duree=0.8):
    """Un petit carillon (cloche et koto mêlés) : la réponse du jeu."""
    n = int((ecart * len(notes) + duree) * SR)
    x = np.zeros(n)
    for k, nom in enumerate(notes):
        u = t(duree)
        f = I.note(nom)
        s = (np.sin(2 * np.pi * f * u) + 0.4 * np.sin(2 * np.pi * 2 * f * u) + 0.25 * np.sin(2 * np.pi * 3.01 * f * u)) * np.exp(-u / 0.2)
        i = int(k * ecart * SR)
        x[i:i + len(s)] += s
    return norme(x)


def glisse(f0, f1, duree=0.55):
    """Ça descend : c'est raté."""
    u = t(duree)
    f = f0 * (f1 / f0) ** (u / duree)
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.5 + np.sin(2 * np.pi * np.cumsum(f) / SR)
    x = I.passe_bas(x, 1800) * np.minimum(1, u / 0.01) * np.minimum(1, (duree - u) / 0.1)
    return norme(x)


def bruitages():
    s = PUBLIC / 'sfx'
    ecrire(s / 'tic.wav', mono(tic(2100)))
    ecrire(s / 'toc.wav', mono(tic(1500)))
    # l'épingle plantée : un coup mat et un petit ressort
    u = t(0.22)
    x = np.sin(2 * np.pi * (180 + 300 * np.exp(-u / 0.012)) * u) * np.exp(-u / 0.05) + 0.3 * np.sin(2 * np.pi * 880 * u) * np.exp(-u / 0.03)
    ecrire(s / 'epingle.wav', mono(norme(x)))
    # les points qui montent : des tics de plus en plus aigus
    d = 0.6
    x = np.zeros(int(d * SR))
    for k in range(14):
        c = tic(1200 + 90 * k, 0.03)
        i = int(k * 0.04 * SR)
        x[i:i + len(c)] += c * (0.5 + 0.03 * k)
    ecrire(s / 'pts.wav', mono(norme(x)))
    ecrire(s / 'bien.wav', mono(carillon(['D5', 'G5', 'A5', 'D6'])))
    ecrire(s / 'moyen.wav', mono(carillon(['D5', 'A5'], 0.09)))
    ecrire(s / 'loin.wav', mono(glisse(330, 150)))
    ecrire(s / 'froid.wav', mono(carillon(['E5'], 0.09, 0.6)))
    ecrire(s / 'tiede.wav', mono(carillon(['E5', 'A5'], 0.08, 0.6)))
    ecrire(s / 'chaud.wav', mono(carillon(['E5', 'A5', 'B5'], 0.07, 0.6)))
    ecrire(s / 'brulant.wav', mono(carillon(['E5', 'A5', 'B5', 'E6'], 0.06, 0.7)))
    ecrire(s / 'trouve.wav', mono(carillon(['E5', 'A5', 'B5', 'E6', 'F6', 'E6'], 0.06, 1.0)))


if __name__ == '__main__':
    devine()
    defi()
    bruitages()
    print('musique et bruitages prêts dans', PUBLIC)
