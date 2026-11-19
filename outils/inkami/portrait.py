# -*- coding: utf-8 -*-
"""Le portrait à l'encre des tableaux d'Inkami de la balade : un personnage du jeu (une image sur fond blanc) devient un dessin au pinceau :
des traits, des lavis par paliers, le bas du buste qui se défait en coups de pinceau, des éclaboussures."""
import math
import numpy as np
import cv2
from PIL import Image


def bruit(h, w, echelle, rng, octaves=1):
    tot, amp, s = np.zeros((h, w), np.float32), 1.0, 0.0
    for o in range(octaves):
        e = max(2, echelle / (2 ** o))
        petit = rng.random((int(h / e) + 3, int(w / e) + 3)).astype(np.float32)
        tot += amp * cv2.resize(petit, (w, h), interpolation=cv2.INTER_CUBIC)
        s += amp
        amp *= 0.5
    return np.clip(tot / s, 0, 1)


def ELL(k):
    return cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))


def coup(h, l, x0, y0, x1, y1, ep, rng, sec=0.5):
    """Un coup de pinceau de (x0, y0) à (x1, y1) : plein au départ, qui s'effiloche vers la fin. Rend un masque float."""
    m = np.zeros((h, l), np.float32)
    n = 24
    for i in range(n):
        t0, t1 = i / n, (i + 1) / n
        e = ep * (0.55 + 0.6 * math.sin(math.pi * min(1, t0 * 1.15 + 0.12)))
        cv2.line(m, (int(x0 + (x1 - x0) * t0), int(y0 + (y1 - y0) * t0)), (int(x0 + (x1 - x0) * t1), int(y0 + (y1 - y0) * t1)), 1.0, max(1, int(e)), cv2.LINE_AA)
    # les poils : des stries le long du coup, qui gagnent vers la fin
    an = math.atan2(y1 - y0, x1 - x0)
    stries = bruit(h, l * 8, 3.0, rng)[:, ::8]
    M = cv2.getRotationMatrix2D((l / 2, h / 2), -math.degrees(an), 1.0)
    stries = cv2.warpAffine(stries, M, (l, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    yy, xx = np.mgrid[0:h, 0:l].astype(np.float32)
    lg = math.hypot(x1 - x0, y1 - y0) or 1
    t = np.clip(((xx - x0) * (x1 - x0) + (yy - y0) * (y1 - y0)) / lg ** 2, 0, 1)
    m *= np.clip((stries - (0.25 + sec * 0.55 * t ** 1.5)) / 0.12 + 0.5, 0, 1)
    return m


def encre_portrait(chemin, rng, bas=0.22, o=None):
    """Rend (densité d'encre 0–1, voile clair 0–1, la boîte du sujet), à la taille de l'image."""
    o = o or {}
    a = np.asarray(Image.open(chemin).convert('RGB'), np.float32) / 255
    h, l = a.shape[:2]
    blanc = (a.min(axis=2) > 0.985).astype(np.uint8)
    masque = np.zeros((h + 2, l + 2), np.uint8)
    fond = blanc.copy()
    for (x, y) in [(0, 0), (l - 1, 0), (0, h - 1), (l - 1, h - 1), (l // 2, 0), (0, h // 2), (l - 1, h // 2)]:
        if fond[y, x] == 1:
            cv2.floodFill(fond, masque, (x, y), 2)
    sujet = (fond != 2).astype(np.float32)
    lum = 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]
    sat = a.max(axis=2) - a.min(axis=2)
    # (clair : un pelage brun, une peau mate, éclaircis — les tons moyens seulement, les noirs restent noirs)
    if o.get('clair'): lum = np.clip(lum + o['clair'] * 4 * lum * (1 - lum), 0, 1)
    g8 = (lum * 255).astype(np.uint8)
    # ---- les traits fins du dessin : ce qui est plus sombre que son voisinage (la bouche, les cils, les contours du jeu)
    bh = cv2.morphologyEx(g8, cv2.MORPH_BLACKHAT, ELL(19)).astype(np.float32) / 255
    fins = np.clip((bh - 0.07) / 0.1, 0, 1)
    fins = cv2.dilate(fins, ELL(3))
    # ---- les limites entre deux aplats (le col sur l'habit, le bandeau sur les cheveux) : un trait léger
    lisse = cv2.bilateralFilter((a * 255).astype(np.uint8), 9, 40, 9)
    limites = np.zeros((h, l), np.float32)
    for c in range(3):
        limites = np.maximum(limites, cv2.Canny(lisse[..., c], 40, 110).astype(np.float32) / 255)
    limites = cv2.GaussianBlur(cv2.dilate(limites, ELL(3)), (0, 0), 0.8) * o.get('limites', 0.75)
    # ---- le contour : la silhouette, d'un trait de pinceau d'épaisseur changeante
    s8 = (sujet * 255).astype(np.uint8)
    c_fin = (s8 - cv2.erode(s8, ELL(5))).astype(np.float32) / 255
    c_gros = (s8 - cv2.erode(s8, ELL(11))).astype(np.float32) / 255
    ou = cv2.GaussianBlur(bruit(h, l, 70, rng, 2), (0, 0), 3)
    contour = np.where(ou > 0.5, c_gros, c_fin)
    contour = cv2.GaussianBlur(contour, (0, 0), 1.0)
    trait = np.clip(np.maximum(np.maximum(fins, limites), contour), 0, 1)
    trait *= (0.86 + 0.2 * bruit(h, l, 12, rng))
    # ---- les lavis : des paliers d'encre diluée
    d = np.clip((0.8 - lum) / 0.66, 0, 1)
    d = np.maximum(d, np.clip((sat - 0.2) * 0.6, 0, 0.24))                 # une joue, un ruban clair : un lavis léger
    n1 = bruit(h, l, 30, rng, 3) - 0.5
    dn = d + n1 * 0.05
    paliers = [0.0, 0.07, 0.24, 0.5, 0.8, 0.97]
    seuils = [0.06, 0.2, 0.42, 0.66, 0.9]
    dq = np.zeros_like(d)
    for s, p0, p1 in zip(seuils, paliers[:-1], paliers[1:]):
        dq += (p1 - p0) * np.clip((dn - s) / 0.03 + 0.5, 0, 1)
    dq = cv2.GaussianBlur(dq, (0, 0), 1.2)
    eau = bruit(h, l, 150, rng, 3)
    dq *= np.where(dq > 0.7, 1.0, 0.94 + 0.1 * eau)
    # (dans les noirs, de rares manques : le pinceau sec, en longues traînées)
    sec = cv2.GaussianBlur(bruit(h, l * 10, 2.4, rng)[:, ::10], (0, 0), 0.6) * bruit(h, l, 60, rng, 2)
    dq *= (1 - 0.45 * np.clip((sec - 0.6) / 0.05, 0, 1) * (dq > 0.6))
    dens = np.clip(np.maximum(dq, trait * 0.96), 0, 1) * cv2.GaussianBlur(sujet, (0, 0), 0.7)
    # ---- le bas du buste : il ne reste que sous de grands coups de pinceau
    ys = np.where(sujet.sum(axis=1) > 0)[0]
    xs = np.where(sujet.sum(axis=0) > 0)[0]
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    cx, lg = (x0 + x1) / 2, (x1 - x0)
    debut = y1 - (y1 - y0) * bas
    t = np.clip((np.arange(h, dtype=np.float32)[:, None] - debut) / max(1, (y1 - debut)), 0, 1) * np.ones((1, l), np.float32)
    # (coupé par le bord gauche ou droit de l'image : le corps d'un animal ; il se défait aussi de ce côté)
    xx = np.arange(l, dtype=np.float32)[None, :]
    if sujet[:, -3:].sum() > 20: t = np.maximum(t, np.clip((xx - (l - 0.24 * lg)) / (0.24 * lg), 0, 1))
    if sujet[:, :3].sum() > 20: t = np.maximum(t, np.clip(((0.24 * lg) - xx) / (0.24 * lg), 0, 1))
    # (des lambeaux : un bruit large étiré dans deux biais, que le bas ronge de plus en plus)
    def biais(angle, ex, ey):
        b = bruit(int(h / ey) + 2, int(l / ex) + 2, 5, rng, 2)
        b = cv2.resize(b, (l, h), interpolation=cv2.INTER_CUBIC)
        M = cv2.getRotationMatrix2D((l / 2, h / 2), angle, 1.0)
        return cv2.warpAffine(b, M, (l, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    lambeaux = np.maximum(biais(24, 9, 1.6), biais(-24, 9, 1.6)) * 0.75 + bruit(h, l, 5, rng) * 0.25
    garde = np.clip((lambeaux - (0.18 + 0.72 * t ** 0.8)) / 0.06 + 0.5, 0, 1)
    garde = np.where(t <= 0, 1.0, garde).astype(np.float32)
    voile = sujet * garde
    dens *= garde
    # ---- les éclaboussures et quelques coups gris derrière le bas du buste
    ecl = np.zeros((h, l), np.float32)
    dehors = cv2.dilate(s8, ELL(9)) == 0
    for _ in range(int(o.get('gouttes', 150))):
        if rng.random() < 0.8:
            px = cx + rng.choice([-1, 1]) * rng.uniform(0.3, 0.7) * lg + rng.normal(0, 16)
            py = rng.uniform(y0 + (y1 - y0) * 0.45, y1 + 40)
        else:
            px, py = rng.uniform(x0 - 60, x1 + 60), rng.uniform(y0 - 30, y0 + (y1 - y0) * 0.4)
        ix, iy = int(np.clip(px, 0, l - 1)), int(np.clip(py, 0, h - 1))
        if not dehors[iy, ix] and py < debut:
            continue
        r = float(np.clip(rng.pareto(2.0) * 2.0 + 1.0, 1.0, 17))
        cv2.ellipse(ecl, (ix, iy), (max(1, int(r)), max(1, int(r * rng.uniform(0.7, 1.3)))), float(rng.uniform(0, 180)), 0, 360, float(rng.uniform(0.75, 1.0)), -1, cv2.LINE_AA)
        if r > 5:
            for _ in range(int(rng.integers(3, 9))):
                an, di = rng.uniform(0, 6.28), r * rng.uniform(1.4, 4.5)
                cv2.circle(ecl, (int(px + math.cos(an) * di), int(py + math.sin(an) * di)), max(1, int(r * rng.uniform(0.08, 0.28))), 0.92, -1, cv2.LINE_AA)
    for i in range(int(o.get('coups', 8))):
        sens = 1 if i % 2 else -1
        ya = rng.uniform(debut - (y1 - y0) * 0.12, y1 - 10)
        xa = cx + sens * lg * rng.uniform(0.18, 0.4)
        lgc = lg * rng.uniform(0.22, 0.5)
        an = rng.uniform(0.15, 0.75)
        c = coup(h, l, xa, ya, xa + sens * lgc * math.cos(an), ya + lgc * math.sin(an), rng.uniform(12, 34), rng, sec=1.1) * rng.uniform(0.6, 0.97)
        ecl = np.maximum(ecl, c)
    dens = np.clip(np.maximum(dens, ecl), 0, 1)
    return dens, voile, (x0, y0, x1, y1)
