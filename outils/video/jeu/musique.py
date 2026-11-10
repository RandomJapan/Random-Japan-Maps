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


# ---------------------------------------------------------------- « le créateur » (2026-11-10) : du lo-fi
# 90 battements par minute (un temps = 40 images), en ré majeur, sur la « progression royale » de la J-pop (IV – V – iii – vi :
# Sol7M, La7, Fa♯m7, Si m7). Un piano électrique feutré (synthèse FM), une basse ronde, une batterie douce et balancée, un koto en
# pentatonique, le craquement d'un vinyle ; un filtre qui s'ouvre, un écho, une bande qui ralentit à la fin.
# L'accroche (temps 0 → 4) : les accords étouffés, et des charlestons droits qui tombent sur chaque coupe du défilé et accélèrent avec
# elles (croches, doubles, triples croches) ; la batterie tombe au temps 4.
CR_TEMPS = 60 / 90
CR_PAS = CR_TEMPS / 4  # une double croche
CR_DUREE = 34 * CR_TEMPS
# (les coupes du défilé, en images à 60 i/s : 2 plans de 20, 4 de 10, 16 de 5)
CR_COUPES = [0, 20] + [40 + 10 * k for k in range(4)] + [80 + 5 * k for k in range(16)]


def filtre(x, fc, ordre=2, haut=False):
    """Un passe-bas (ou passe-haut) de Butterworth sans déphasage, dans le domaine des fréquences."""
    n = len(x)
    X = np.fft.rfft(x, axis=0)
    f = np.fft.rfftfreq(n, 1 / SR)
    r = (f / fc) ** (2 * ordre)
    h = np.sqrt(r / (1 + r)) if haut else 1 / np.sqrt(1 + r)
    return np.fft.irfft(X * (h[:, None] if X.ndim == 2 else h), n, axis=0)


def reverb(st, duree=1.4, mix=0.2, graine=7):
    """Une salle : la convolution par un bruit qui s'éteint, différent à gauche et à droite."""
    r = np.random.default_rng(graine)
    u = t(duree)
    sortie = np.zeros((len(st) + len(u) - 1, 2))
    for c in range(2):
        ir = r.standard_normal(len(u)) * np.exp(-u / (duree / 4.5))
        ir = filtre(ir, 4500)
        ir[:int(0.012 * SR)] = 0  # un petit pré-délai
        ir /= np.sqrt(np.sum(ir ** 2))
        m = len(st[:, c]) + len(ir) - 1
        N = 1 << (m - 1).bit_length()
        sortie[:, c] = np.fft.irfft(np.fft.rfft(st[:, c], N) * np.fft.rfft(ir, N), N)[:m]
    return st + mix * sortie[:len(st)]


def rhodes(f, duree, force=1.0):
    """Un piano électrique : une porteuse modulée en fréquence (rapport 1), l'indice qui retombe, un tintement bref à l'attaque."""
    u = t(duree + 1.2)
    indice = (1.6 * force + 0.3) * np.exp(-u / 0.3) + 0.4
    x = np.sin(2 * np.pi * f * u + indice * np.sin(2 * np.pi * f * u))
    x += 0.12 * force * np.sin(2 * np.pi * f * 7.02 * u) * np.exp(-u / 0.025)  # le tintement
    env = np.minimum(1, u / 0.004) * np.exp(-u / 1.6)
    env *= np.clip((duree + 0.25 - u) / 0.25, 0, 1)  # on lâche la touche
    return x * env * (0.55 + 0.45 * force)


def accord(notes, duree, force=0.8, ecart=0.012):
    """Les notes d'un accord, plaquées presque ensemble (de la plus grave à la plus aiguë), en stéréo : (gauche, droite)."""
    n = int((duree + 1.2 + ecart * len(notes)) * SR) + 1
    g, d = np.zeros(n), np.zeros(n)
    for k, nom in enumerate(notes):
        x = rhodes(I.note(nom), duree, force)
        i = int(k * ecart * SR)
        pan = -0.35 + 0.7 * k / max(1, len(notes) - 1)
        g[i:i + len(x)] += x * (1 - pan) ** 0.5
        d[i:i + len(x)] += x * (1 + pan) ** 0.5
    return g, d


def kick_lofi():
    # (pour un téléphone : peu de grave pur, un « toc » dans le médium)
    u = t(0.4)
    f = 56 + 90 * np.exp(-u / 0.03)
    corps = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-u / 0.13)
    toc = np.sin(2 * np.pi * 180 * u) * np.exp(-u / 0.025) * 0.35
    clic = filtre(rng.standard_normal(len(u)), 2500) * np.exp(-u / 0.004) * 0.5
    return np.tanh(2.0 * (corps + toc + clic)) * 0.85


def caisse_lofi():
    """Une caisse claire feutrée : un corps à 190 Hz, du bruit filtré (sans aigus), une queue."""
    u = t(0.35)
    corps = np.sin(2 * np.pi * 190 * u) * np.exp(-u / 0.05) * 0.6
    b = rng.standard_normal(len(u))
    b = filtre(b, 5200) - filtre(b, 900)
    return (corps + b * np.exp(-u / 0.09) * 1.1) * 0.8


def charleston_lofi(ouvert=False):
    u = t(0.25)
    b = filtre(rng.standard_normal(len(u)), 7000, haut=True)
    b = filtre(b, 11000)
    return b * np.exp(-u / (0.06 if ouvert else 0.016)) * 0.9


def basse_ronde(f, duree):
    u = t(duree + 0.08)
    x = np.sin(2 * np.pi * f * u) + 0.45 * np.sin(2 * np.pi * 2 * f * u) + 0.25 * np.sin(2 * np.pi * 3 * f * u) + 0.1 * np.sin(2 * np.pi * 4 * f * u)
    return np.tanh(2.0 * x) * 0.8 * np.minimum(1, u / 0.008) * np.clip((duree + 0.08 - u) / 0.08, 0, 1) * np.exp(-u / 1.2)


def vinyle(duree):
    """Le craquement d'un disque : des petits clics au hasard et un souffle."""
    n = int(duree * SR)
    x = np.zeros(n)
    for i in rng.integers(0, n, int(duree * 9)):
        k = rng.uniform(0.2, 1)
        L = int(SR * 0.0015)
        x[i:i + L] += k * rng.standard_normal(min(L, n - i)) * np.exp(-np.arange(min(L, n - i)) / (L / 4))
    souffle = filtre(rng.standard_normal(n), 3000) * 0.05
    return filtre(x, 9000) * 0.6 + souffle


def montee_bruit(duree):
    """Un souffle qui monte (le filtre s'ouvre) jusqu'à la retombée."""
    u = t(duree)
    k = (u / duree) ** 2.2
    b = rng.standard_normal(len(u))
    lent, vif = filtre(b, 700), filtre(b, 6000)
    return (lent * (1 - k) + vif * k) * k * 0.5


def ralentir(st, duree):
    """La fin d'une bande qui s'arrête : la lecture ralentit jusqu'à zéro sur les `duree` dernières secondes."""
    n = int(duree * SR)
    debut = len(st) - n
    u = np.arange(n) / n
    position = debut + np.cumsum((1 - u) ** 1.4)  # la vitesse tombe de 1 à 0
    fin = np.stack([np.interp(position, np.arange(len(st)), st[:, c]) for c in range(2)], 1)
    fin *= (1 - u[:, None]) ** 0.5
    return np.concatenate([st[:debut], fin])


CR_ACCORDS = {  # (notes du piano, la basse)
    'G': (['G3', 'B3', 'D4', 'F#4', 'A4'], 'G2'),
    'A': (['A3', 'C#4', 'E4', 'G4', 'B4'], 'A2'),
    'F#m': (['F#3', 'A3', 'C#4', 'E4'], 'F#2'),
    'Bm': (['B3', 'D4', 'F#4', 'A4'], 'B1'),
}
# la mélodie du koto, par accord : (croche dans la mesure, note)
CR_MELODIE = {
    'G': [(0, 'B4'), (1.5, 'D5'), (3, 'E5'), (4, 'D5'), (5.5, 'B4'), (6, 'A4')],
    'A': [(0, 'E5'), (1.5, 'F#5'), (3, 'E5'), (4, 'A4'), (6, 'B4')],
    'F#m': [(0, 'F#5'), (1.5, 'E5'), (2, 'D5'), (4, 'A4'), (5, 'B4'), (6, 'D5')],
    'Bm': [(0, 'D5'), (1.5, 'B4'), (3, 'A4'), (4, 'B4')],
}


def createur():
    T, P = CR_TEMPS, CR_PAS
    piano, rythme, koto_, fond = Piste(CR_DUREE + 1), Piste(CR_DUREE + 1), Piste(CR_DUREE + 1), Piste(CR_DUREE + 1)
    SWING = 0.028  # s : les doubles croches paires en retard (le balancement)

    def pas(k):
        return k * P + (SWING if k % 2 else 0)

    def jouer_accord(nom, temps, duree, force=0.8, vol=0.32):
        g, d = accord(CR_ACCORDS[nom][0], duree, force)
        i = int(temps * SR)
        L = min(len(g), piano.n - i)
        piano.g[i:i + L] += g[:L] * vol
        piano.d[i:i + L] += d[:L] * vol

    # l'accroche : Si m7 puis La7, étouffés (le filtre s'ouvre plus tard, sur tout le piano)
    jouer_accord('Bm', 0, 2 * T - 0.05, 0.6)
    jouer_accord('A', 2 * T, 2 * T - 0.05, 0.6)
    rythme.poser(kick_lofi(), 0, 0.7)
    for k, image in enumerate(CR_COUPES):  # un charleston sur chaque coupe du défilé, de plus en plus fort
        rythme.poser(charleston_lofi(), image / 60, 0.18 + 0.32 * k / len(CR_COUPES), pan=0.3)
    fond.poser(montee_bruit(2 * T), 2 * T, 0.5)

    # le groove : un accord par mesure, du temps 4 à la fin
    grille = ['G', 'A', 'F#m', 'Bm', 'G', 'A', 'F#m', 'Bm']
    for m, nom in enumerate(grille):
        T0 = (4 + 4 * m) * T
        if T0 >= CR_DUREE:
            break
        # le piano : plaqué sur le 1, repris sur le « et » du 2 (une anticipation), plus doux
        jouer_accord(nom, T0, 1.4 * T, 0.85)
        jouer_accord(nom, T0 + 2.5 * T, 1.3 * T, 0.55, 0.24)
        # la basse : la fondamentale sur le 1 (une noire pointée), rappelée sur le 3 et demi
        f = I.note(CR_ACCORDS[nom][1])
        rythme.poser(basse_ronde(f, 1.4 * T), T0, 0.42)
        rythme.poser(basse_ronde(f * (2 if m % 2 else 1.5), 0.4 * T), T0 + 3.5 * T, 0.28)
        # la batterie (16 pas)
        for s in range(16):
            k = (4 + 4 * m) * 4 + s
            temps = pas(k)
            if temps >= CR_DUREE - 0.55:
                break
            if s in (0, 7, 10):
                rythme.poser(kick_lofi(), temps, 0.75 if s == 0 else 0.6)
            if s in (4, 12):
                rythme.poser(caisse_lofi(), temps, 0.55)
            if s % 2 == 0:
                rythme.poser(charleston_lofi(s == 14 and m % 2 == 1), temps, 0.2 if s % 4 == 0 else 0.13, pan=0.3)
            elif s in (3, 11, 15):
                rythme.poser(charleston_lofi(), temps, 0.07, pan=0.3)
        # le koto, à partir de la manche (temps 8)
        if T0 >= 8 * T:
            for croche, n in CR_MELODIE[nom]:
                koto_.poser(I.koto(n), T0 + croche * T / 2, 0.42, pan=-0.25)
    # un roulement avant le défi (temps 17,5 → 18) et avant la fin (27,5 → 28)
    for debut in (17.5, 27.5):
        for k in range(4):
            rythme.poser(caisse_lofi(), (debut + k / 8) * T, 0.18 + 0.1 * k)
    # temps 28 : une cymbale douce, la fin commence
    rythme.poser(filtre(I.cymbale(), 6000), 28 * T, 0.22)
    # la dernière note (temps 32) : l'accord tenu, le koto
    koto_.poser(I.koto('D5'), 32 * T, 0.4, pan=-0.25)
    koto_.poser(I.koto('A5'), 32.5 * T, 0.32, pan=-0.25)

    # le piano étouffé pendant l'accroche, le filtre qui s'ouvre jusqu'au temps 4
    st_piano = np.stack([piano.g, piano.d], 1)
    sourd, clair = filtre(st_piano, 650), filtre(st_piano, 5200)
    u = np.arange(len(st_piano)) / SR
    k = np.clip((u - 1.5 * T) / (2.5 * T), 0, 1)[:, None] ** 2
    st_piano = sourd * (1 - k) + clair * k
    st = (st_piano * 1.0 + np.stack([rythme.g, rythme.d], 1) + np.stack([koto_.g, koto_.d], 1) * 0.9
          + np.stack([fond.g, fond.d], 1))
    st = reverb(st, 1.5, 0.18)
    craque = vinyle(len(st) / SR)
    st += np.stack([craque, np.roll(craque, 311)], 1) * 0.05
    # la bande : un léger pleurage (la hauteur qui ondule), la saturation, des aigus adoucis
    u = np.arange(len(st)) / SR
    position = np.arange(len(st)) + 0.0012 * SR * np.sin(2 * np.pi * 0.45 * u) / (2 * np.pi * 0.45)
    st = np.stack([np.interp(position, np.arange(len(st)), st[:, c]) for c in range(2)], 1)
    st = filtre(st, 9500)
    st = filtre(st, 38, haut=True)
    # un peu de présence (1 à 5 kHz) : sur un téléphone, c'est là qu'on entend tout
    X = np.fft.rfft(st, axis=0)
    fr = np.fft.rfftfreq(len(st), 1 / SR)
    X *= (1 + 0.9 / (1 + (1400 / np.maximum(fr, 1)) ** 2) * (1 / (1 + (fr / 6000) ** 2)))[:, None]
    X *= (1 - 0.45 / (1 + (fr / 90) ** 4))[:, None]  # moins de grave pur
    st = np.fft.irfft(X, len(st), axis=0)
    st = np.tanh(1.4 * st) / np.tanh(1.4)
    st = st[:int(CR_DUREE * SR)]
    st = ralentir(st, 0.55)
    st *= 0.92 / np.abs(st).max()
    ecrire(PUBLIC / 'musique' / 'createur.wav', st)


def bruitages_createur():
    """Les bruitages de la vidéo « le créateur », en ré majeur : l'appui (doux), l'épingle, la réponse, les températures, trouvé."""
    s = PUBLIC / 'sfx'
    u = t(0.06)
    appui = np.sin(2 * np.pi * 1450 * u) * np.exp(-u / 0.006) * 0.6 + filtre(rng.standard_normal(len(u)), 4000) * np.exp(-u / 0.004) * 0.5
    ecrire(s / 'cr-appui.wav', mono(np.concatenate([norme(appui, 0.7), np.zeros(int(0.3 * SR))])))
    u = t(0.3)
    epingle = np.sin(2 * np.pi * (300 + 600 * np.exp(-u / 0.02)) * u) * np.exp(-u / 0.06)
    ecrire(s / 'cr-epingle.wav', mono(norme(epingle)))

    def doux(notes, ecart, duree=1.6, force=0.6):
        n = int((ecart * len(notes) + duree + 1.2) * SR)
        x = np.zeros(n)
        for k, nom in enumerate(notes):
            r = rhodes(I.note(nom), duree, force)
            i = int(k * ecart * SR)
            x[i:i + len(r)] += r
        return norme(x)
    ecrire(s / 'cr-reponse.wav', mono(doux(['D5', 'F#5', 'A5', 'D6'], 0.07)))
    ecrire(s / 'cr-froid.wav', mono(doux(['A4'], 0.1, 1.0)))
    ecrire(s / 'cr-tiede.wav', mono(doux(['A4', 'D5'], 0.08, 1.0)))
    ecrire(s / 'cr-brulant.wav', mono(doux(['A4', 'D5', 'F#5', 'A5'], 0.06, 1.0)))
    ecrire(s / 'cr-trouve.wav', mono(doux(['D5', 'F#5', 'A5', 'D6', 'E6', 'F#6'], 0.06, 1.4)))


# ---------------------------------------------------------------- « noob vs pro » (2026-11-10) : du chiptune
# 150 battements par minute (un temps = 24 images), en do, mélodie en gamme yo (do, ré, fa, sol, la) : un « jeu vidéo » japonais. Les
# voix d'une vieille console : deux ondes carrées (la mélodie à 25 %, l'arpège rapide à 12,5 %), un triangle à la basse, du bruit pour la
# batterie, un écho court sur la mélodie. Manches (temps 0 → 34) : tout le groove ; le score (34 → 42) : à moitié ; la fin (42 → 51) :
# tout, et l'accord final au temps 50.
VS_TEMPS = 60 / 150
VS_PAS = VS_TEMPS / 4
VS_DUREE = 51 * VS_TEMPS


def carre(f, duree, rapport=0.25, vibrato=0.0, attaque=0.003, chute=0.25, tenue=0.65):
    """Une onde carrée (rapport cyclique), son enveloppe (attaque, chute vers la tenue, relâche), un vibrato qui vient après 0,12 s."""
    u = t(duree + 0.04)
    v = vibrato * np.clip((u - 0.12) / 0.1, 0, 1) * np.sin(2 * np.pi * 6 * u)
    phase = np.cumsum(f * (1 + v)) / SR
    x = np.where((phase % 1) < rapport, 1.0, -1.0)
    env = np.minimum(1, u / attaque) * (tenue + (1 - tenue) * np.exp(-u / chute))
    env *= np.clip((duree + 0.04 - u) / 0.04, 0, 1)
    return x * env


def triangle(f, duree):
    u = t(duree + 0.02)
    x = 2 * np.abs(2 * ((f * u) % 1) - 1) - 1
    return x * np.clip((duree + 0.02 - u) / 0.02, 0, 1) * np.minimum(1, u / 0.002)


def bruit_chip(duree, clair=True):
    """Le bruit d'une console : des valeurs tenues par paquets (plus courts = plus clair)."""
    n = int(duree * SR)
    pas = 2 if clair else 9
    b = np.repeat(rng.choice([-1.0, 1.0], n // pas + 1), pas)[:n]
    return b


def kick_chip():
    u = t(0.12)
    f = 75 + 180 * np.exp(-u / 0.018)
    return triangle_libre(f, u) * np.exp(-u / 0.06)


def triangle_libre(f, u):
    ph = np.cumsum(f) / SR
    return 2 * np.abs(2 * (ph % 1) - 1) - 1


def caisse_chip():
    u = t(0.16)
    return bruit_chip(0.16, False) * np.exp(-u / 0.05) * 0.8 + np.sin(2 * np.pi * 190 * u) * np.exp(-u / 0.03) * 0.5


def charley_chip():
    u = t(0.04)
    return bruit_chip(0.04, True) * np.exp(-u / 0.012)


VS_ACCORDS = {'C': ['C', 'E', 'G'], 'Am': ['A', 'C', 'E'], 'F': ['F', 'A', 'C'], 'G': ['G', 'B', 'D']}
VS_BASSE = {'C': 'C3', 'Am': 'A2', 'F': 'F2', 'G': 'G2'}  # (une octave plus haut qu'à la console : un téléphone n'a pas de grave)
# la mélodie, en croches (0 à 7) dans la mesure : (croche, note, durée en croches)
VS_A = [[(0, 'G4', 1), (1, 'A4', 1), (2, 'C5', 2), (4, 'D5', 1), (5, 'C5', 1), (6, 'A4', 1), (7, 'G4', 1)],
        [(0, 'A4', 2), (2, 'C5', 1), (3, 'D5', 1), (4, 'F5', 2), (6, 'D5', 1), (7, 'C5', 1)],
        [(0, 'F4', 1), (1, 'A4', 1), (2, 'C5', 1), (3, 'F5', 2), (5, 'D5', 1), (6, 'C5', 1), (7, 'A4', 1)],
        [(0, 'G4', 2), (2, 'A4', 1), (3, 'C5', 1), (4, 'D5', 4)]]
VS_B = [[(0, 'C5', 1), (1, 'D5', 1), (2, 'F5', 2), (4, 'G5', 1), (5, 'F5', 1), (6, 'D5', 1), (7, 'C5', 1)],
        [(0, 'A4', 2), (2, 'C5', 2), (4, 'D5', 1), (5, 'C5', 1), (6, 'A4', 2)],
        [(0, 'F5', 2), (2, 'D5', 1), (3, 'C5', 1), (4, 'A4', 2), (6, 'C5', 1), (7, 'D5', 1)],
        [(0, 'G5', 4), (4, 'F5', 1), (5, 'D5', 1), (6, 'C5', 1), (7, 'A4', 1)]]


def versus():
    T, P = VS_TEMPS, VS_PAS
    lead, arp, bas, batt = Piste(VS_DUREE + 1), Piste(VS_DUREE + 1), Piste(VS_DUREE + 1), Piste(VS_DUREE + 1)

    def mesure(temps0, accord, melodie=None, niveau=3):
        """Une mesure (4 temps) à partir du temps temps0 ; niveau 3 : tout, 2 : sans caisse claire ni mélodie, 1 : basse et arpège."""
        T0 = temps0 * T
        # l'arpège rapide (triples croches) sur les notes de l'accord, une octave au-dessus du do 5
        notes = [I.note(n + '5') for n in VS_ACCORDS[accord]]
        for k in range(32):
            arp.poser(carre(notes[k % 3] * (2 if k % 6 >= 3 else 1), P / 2 - 0.004, 0.125, chute=0.03, tenue=0.4), T0 + k * P / 2, 0.11)
        # la basse : croches, fondamentale et octave
        fb = I.note(VS_BASSE[accord])
        for k in range(8):
            bas.poser(triangle(fb * (2 if k % 2 else 1), T / 2 - 0.02), T0 + k * T / 2, 0.5)
        # la batterie
        for s in range(16):
            temps = T0 + s * P
            if s in (0, 8) or (niveau >= 3 and s in (6, 10)):
                if niveau >= 2 or s == 0:
                    batt.poser(kick_chip(), temps, 0.75)
            if niveau >= 3 and s in (4, 12):
                batt.poser(caisse_chip(), temps, 0.42)
            if niveau >= 2 and s % 2 == 0:
                batt.poser(charley_chip(), temps, 0.16 if s % 4 else 0.22, pan=0.25)
        if melodie and niveau >= 3:
            for croche, nom, d in melodie:
                lead.poser(carre(I.note(nom), d * T / 2 - 0.02, 0.25, vibrato=0.006), T0 + croche * T / 2, 0.3, pan=-0.1)

    grille = ['C', 'Am', 'F', 'G']
    for m in range(8):  # les manches : A puis B, deux fois chacune… (temps 0 → 32)
        mesure(4 * m, grille[m % 4], (VS_A if m < 4 else VS_B)[m % 4])
    mesure(32, 'C', VS_A[0])  # la fin de la manche 4 (temps 32 → 34 : une demi-mesure)
    for m, nom in enumerate(['Am', 'F']):  # le score : à moitié (temps 34 → 42)
        mesure(34 + 4 * m, nom, niveau=2 if m else 1)
    for m, nom in enumerate(['F', 'G']):  # la fin (temps 42 → 50)
        mesure(42 + 4 * m, nom, VS_A[2 + m])
    # l'accord final (temps 50) : do, tenu
    for n in ('C4', 'E4', 'G4', 'C5'):
        lead.poser(carre(I.note(n), 0.9 * T, 0.25, vibrato=0.008, chute=0.3, tenue=0.5), 50 * T, 0.16)
    bas.poser(triangle(I.note('C3'), 0.9 * T), 50 * T, 0.55)
    batt.poser(kick_chip(), 50 * T, 0.8)
    batt.poser(caisse_chip(), 50 * T, 0.4)

    # l'écho de la mélodie (trois doubles croches plus tard), puis le mélange
    pl = np.stack([lead.g, lead.d], 1)
    echo = np.zeros_like(pl)
    k = int(3 * P * SR)
    echo[k:] = pl[:-k] * 0.32
    echo[:, 0], echo[:, 1] = np.roll(echo[:, 0], 0), np.roll(echo[:, 1], int(0.012 * SR))
    st = pl + echo + np.stack([arp.g, arp.d], 1) + np.stack([bas.g, bas.d], 1) + np.stack([batt.g, batt.d], 1)
    st = filtre(st, 12000)
    st = filtre(st, 30, haut=True)
    st = st[:int(VS_DUREE * SR)]
    q = int(0.05 * SR)
    st[-q:] *= np.linspace(1, 0, q)[:, None]
    st *= 0.9 / np.abs(st).max()
    ecrire(PUBLIC / 'musique' / 'versus.wav', st)


def bruitages_versus():
    """Les bruitages du duel, en do, avec les mêmes voix que la musique."""
    s = PUBLIC / 'sfx'

    def suite(notes, duree, rapport=0.5, ecart=None, vibrato=0.0, queue=0.3):
        ecart = ecart or duree
        x = np.zeros(int((ecart * len(notes) + duree + queue) * SR))
        for k, nom in enumerate(notes):
            c = carre(I.note(nom), duree, rapport, vibrato=vibrato, chute=0.08, tenue=0.5)
            i = int(k * ecart * SR)
            x[i:i + len(c)] += c
        return np.concatenate([norme(x, 0.8), np.zeros(int(0.1 * SR))])

    ecrire(s / 'vs-appui.wav', mono(suite(['C6'], 0.035, 0.5, queue=0.2)))
    ecrire(s / 'vs-valide.wav', mono(suite(['G5', 'C6'], 0.04, 0.5)))
    # le débutant rate : la plainte qui descend, la dernière note tremble
    x = np.concatenate([suite(['G4'], 0.18, 0.5, queue=0)[:int(0.2 * SR)], suite(['F#4'], 0.18, 0.5, queue=0)[:int(0.2 * SR)],
                        suite(['F4'], 0.18, 0.5, queue=0)[:int(0.2 * SR)], suite(['E4'], 0.7, 0.5, vibrato=0.02, queue=0.1)])
    ecrire(s / 'vs-rate.wav', mono(norme(x, 0.8)))
    # le pro réussit : un arpège qui monte et un do qui sonne
    ecrire(s / 'vs-reussi.wav', mono(suite(['C6', 'E6', 'G6', 'C7'], 0.05, 0.25, vibrato=0.004, queue=0.4)))
    # le débutant a de la chance : ça monte, et ça hésite
    ecrire(s / 'vs-chance.wav', mono(suite(['C5', 'D5', 'F5', 'G5', 'A5', 'C6'], 0.05, 0.25, queue=0.3)))
    # le pro se trompe : un « bonk » qui tombe
    u = t(0.4)
    f = 320 * np.exp(-u / 0.12) + 70
    x = np.where((np.cumsum(f) / SR % 1) < 0.5, 1.0, -1.0) * np.exp(-u / 0.15)
    ecrire(s / 'vs-bonk.wav', mono(norme(x, 0.8)))
    # la manche commence ; les points qui défilent ; la pièce de la fin
    ecrire(s / 'vs-manche.wav', mono(suite(['C5', 'G5'], 0.06, 0.5, queue=0.2)))
    ecrire(s / 'vs-compte.wav', mono(suite(['C6'] * 10, 0.02, 0.5, ecart=0.045, queue=0.1)))
    ecrire(s / 'vs-piece.wav', mono(suite(['G5', 'C6', 'G6'], 0.06, 0.25, queue=0.5)))
    # ceux d'un joueur existent aussi à gauche (le débutant, -g) et à droite (le pro, -d)
    import wave as _w
    for nom in ('appui', 'valide', 'rate', 'reussi', 'chance', 'bonk', 'compte'):
        with _w.open(str(s / f'vs-{nom}.wav')) as w:
            x = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').reshape(-1, 2)[:, 0] / 32767
        ecrire(s / f'vs-{nom}-g.wav', np.stack([x * 0.95, x * 0.4], 1))
        ecrire(s / f'vs-{nom}-d.wav', np.stack([x * 0.4, x * 0.95], 1))


if __name__ == '__main__':
    import sys
    if 'versus' in sys.argv:
        versus()
        bruitages_versus()
    elif 'createur' in sys.argv:
        createur()
        bruitages_createur()
    else:
        devine()
        defi()
        bruitages()
    print('musique et bruitages prêts dans', PUBLIC)
