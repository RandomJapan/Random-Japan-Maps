"""Les sons des intros « captcha » (2026-11-26), calculés ici (aucun droit, aucun crédit) aux instants que fabriquer.py a choisis pour
les gestes : un petit appui quand le doigt touche, un « clic » net à chaque morceau posé (un peu plus aigu à chaque fois : ça monte
vers la fin), deux notes claires pour « Verified » et un souffle qui accompagne l'image jusqu'au plein écran (il s'éteint juste à
la jointure, sur le plan du propriétaire). Les notes sont en la (la, mi) ; doux, sous la musique que le propriétaire mettra.
"""
import wave
from pathlib import Path

import numpy as np

SR = 48000


def _t(duree):
    return np.arange(int(duree * SR)) / SR


def _bruit(n, graine):
    return np.random.default_rng(graine).standard_normal(n)


def _passe_bas(x, fc):
    """Un filtre passe-bas du premier ordre (fc en Hz, constante ou un tableau de la longueur de x)."""
    fc = np.broadcast_to(np.asarray(fc, dtype=float), x.shape)
    a = 1 - np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    v = 0.0
    for i in range(len(x)):
        v += a[i] * (x[i] - v)
        y[i] = v
    return y


def clic(k):
    """Le clic d'un morceau posé : une attaque sèche, un petit corps ; k monte d'un ton à chaque fois."""
    u = _t(0.06)
    f = 1750 * 1.09 ** k
    x = (np.sin(2 * np.pi * f * u) * np.exp(-u / 0.005) + 0.45 * np.sin(2 * np.pi * f * 1.62 * u) * np.exp(-u / 0.0025)
         + 0.5 * np.sin(2 * np.pi * 170 * u) * np.exp(-u / 0.016))
    b = _bruit(len(u), 11 + k)
    x += 0.6 * (b - _passe_bas(b, 2500)) * np.exp(-u / 0.0012)
    return x / np.abs(x).max()


def appui():
    u = _t(0.03)
    x = np.sin(2 * np.pi * 900 * u) * np.exp(-u / 0.003) + 0.4 * _passe_bas(_bruit(len(u), 3), 3000) * np.exp(-u / 0.0015)
    return x / np.abs(x).max()


def verifie():
    """Deux notes de cloche claire, la puis mi, et un léger scintillement."""
    x = np.zeros(int(0.9 * SR))
    for k, f in enumerate((880.0, 1318.5)):
        u = _t(0.8)
        s = (np.sin(2 * np.pi * f * u) + 0.3 * np.sin(2 * np.pi * 2 * f * u) + 0.12 * np.sin(2 * np.pi * 3.01 * f * u)) * np.exp(-u / 0.22)
        s *= np.minimum(1, u / 0.002)
        i = int(k * 0.075 * SR)
        x[i:i + len(s)] += s[:len(x) - i]
    u = _t(0.9)
    b = _bruit(len(u), 5)
    x += 0.12 * (b - _passe_bas(b, 6000)) * np.exp(-u / 0.12) * np.minimum(1, u / 0.03)
    return x / np.abs(x).max()


def souffle(duree, graine):
    """Un souffle qui monte (le filtre s'ouvre) et s'arrête net à la fin, deux bruits différents à gauche et à droite."""
    u = _t(duree) / duree
    env = u ** 1.6 * np.minimum(1, (1 - u) / 0.06)
    canaux = []
    for g in (graine, graine + 1):
        b = _bruit(len(u), g)
        fc = 400 + 5200 * u ** 1.4
        y = _passe_bas(b, fc) - _passe_bas(b, fc * 0.25)
        canaux.append(y * env)
    st = np.stack(canaux, 1)
    return st / np.abs(st).max()


def mixer(evenements, duree, sortie: Path):
    """evenements : [(type, instant, détail)], type appui | clic | verifie | souffle (détail = fin du souffle)."""
    n = int(round(duree * SR))
    st = np.zeros((n, 2))

    def poser(x, temps, vol, pan=0.0):
        if x.ndim == 1:
            x = np.stack([x * (1 - pan) ** 0.5, x * (1 + pan) ** 0.5], 1)
        i = int(round(temps * SR))
        if i >= n:
            return
        x = x[:n - i]
        st[i:i + len(x)] += x * vol

    k = 0
    for genre, temps, detail in evenements:
        if genre == 'appui':
            poser(appui(), temps, 0.07)
        elif genre == 'clic':
            poser(clic(k), temps, 0.34, pan=0.12 * (k % 2 * 2 - 1))
            k += 1
        elif genre == 'verifie':
            poser(verifie(), temps, 0.3)
        elif genre == 'souffle':
            poser(souffle(detail - temps, 21), temps, 0.16)
    # rien ne doit dépasser la fin de l'intro : les 10 dernières ms s'éteignent (pas de clic à la jointure)
    q = int(0.01 * SR)
    st[-q:] *= np.linspace(1, 0, q)[:, None]
    sortie.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(sortie), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(st, -1, 1) * 32767).astype('<i2').tobytes())
