# -*- coding: utf-8 -*-
"""Les tableaux d'Inkami de la balade (2026-11-19) : un personnage du jeu, à l'encre, sur un fond de journaux japonais (des journaux
inventés, écrits ici : aucun vrai journal), son nom en katakana au pinceau, l'ornement de bambou : comme les vrais tableaux de la boutique.
    python outils/inkami/tableau.py outils/inkami/tableaux.json <dossier des images brutes> site/balade/tableaux [--seul id,id] [--taille 800] [--jpg]
(--jpg : une copie en JPEG à côté, pour la regarder ; les polices : celles de la boutique, hors du dépôt — POLICES.)
Un tableau : { id, kana, titres [..], corps [..] (des phrases), graine }."""
import sys, io, json, math
from pathlib import Path
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

sys.stdout.reconfigure(encoding='utf-8')
POLICES = Path(r'D:/Business/Claude Cowork/Ecom Tableau Japon/Boutique Shopify')
MINCHO = str(POLICES / 'outils/polices/ShipporiMinchoB1-SemiBold.ttf')
MINCHO_GRAS = str(POLICES / 'outils/polices/ShipporiMinchoB1-ExtraBold.ttf')
GOTHIQUE = r'C:/Windows/Fonts/YuGothB.ttc'
PINCEAU = str(POLICES / 'theme/polices/YujiBoku-Regular.ttf')
ENCRE = np.array([21, 16, 14], np.float32)
W0, H0 = 1000, 1414  # le format de travail (A3 : 1 × √2)

_polices = {}
def police(f, t):
    if (f, t) not in _polices: _polices[(f, t)] = ImageFont.truetype(f, t)
    return _polices[(f, t)]

def bruit(h, w, echelle, rng, octaves=1):
    """Un bruit doux entre 0 et 1 (des valeurs au hasard, agrandies et floutées)."""
    tot, amp, s = np.zeros((h, w), np.float32), 1.0, 0.0
    for o in range(octaves):
        e = max(2, echelle / (2 ** o))
        petit = rng.random((int(h / e) + 3, int(w / e) + 3)).astype(np.float32)
        tot += amp * cv2.resize(petit, (w, h), interpolation=cv2.INTER_CUBIC)
        s += amp; amp *= 0.5
    return np.clip(tot / s, 0, 1)

# ---------------------------------------------------------------- l'écriture verticale
TOURNES = set('ー〜～…‥—―「」『』（）〔〕［］｛｝〈〉《》【】－-=＝:：;；')
COIN = set('、。，．')
PETITS = set('ゃゅょっぁぃぅぇぉャュョッァィゥェォヮ')
_tuiles = {}
def tuile(ch, f, t):
    """Le caractère ch dans un carré de t pixels, comme on l'écrit de haut en bas (masque L)."""
    cle = (ch, f, t)
    if cle in _tuiles: return _tuiles[cle]
    m = int(t * 0.5)
    im = Image.new('L', (t + 2 * m, t + 2 * m), 0)
    d = ImageDraw.Draw(im)
    d.text((m + t / 2, m + t / 2), ch, font=police(f, t), fill=255, anchor='mm')
    if ch in TOURNES: im = im.rotate(-90, resample=Image.BICUBIC)
    elif ch in COIN: im = ImageChops.offset(im, int(t * 0.55), -int(t * 0.5))
    elif ch in PETITS: im = ImageChops.offset(im, int(t * 0.1), -int(t * 0.08))
    _tuiles[cle] = (im, m)
    return _tuiles[cle]

def colonne(calque, texte, x, y, f, t, pas=1.0, ymax=None):
    """Écrit texte de haut en bas à partir de (x, y) (le milieu de la colonne, le haut) ; rend ce qui n'a pas tenu."""
    for i, ch in enumerate(texte):
        if ymax is not None and y + t > ymax: return texte[i:]
        if ch not in ' 　':
            im, m = tuile(ch, f, t)
            calque.paste(255, (int(x - t / 2 - m), int(y - m)), im)
        y += t * pas
    return ''

# ---------------------------------------------------------------- une page de journal (inventée)
def page(L, H, titres, corps, rng, calme=False):
    """Une grande page : des étages de colonnes verticales, de droite à gauche, des titres, des filets. Rend le masque de l'encre (L)."""
    calque = Image.new('L', (L, H), 0)
    d = ImageDraw.Draw(calque)
    t = 13                      # le corps du texte
    etage = t * 15 + 10         # un étage : quinze caractères
    texte = ''
    def suite(n):
        nonlocal texte
        while len(texte) < n: texte += corps[int(rng.integers(len(corps)))] + ('　' if rng.random() < 0.3 else '')
        r, texte = texte[:n], texte[n:]
        return r
    y, k = 14, 0
    libres = list(titres)
    while y + etage < H + etage:
        x = L - 12
        # un titre en bandeau (blanc sur noir, ou noir entre deux filets), parfois
        if not calme and rng.random() < 0.22 and libres:
            ti = libres.pop(int(rng.integers(len(libres)))) if rng.random() < 0.7 else titres[int(rng.integers(len(titres)))]
            tt = int(rng.choice([24, 28, 34]))
            l = min(L - 60, int(len(ti) * tt * 1.06) + 30)
            x0 = int(rng.integers(20, max(21, L - l - 20)))
            if rng.random() < 0.5:
                d.rectangle([x0, y, x0 + l, y + tt + 12], fill=235)
                d.text((x0 + l / 2, y + tt / 2 + 5), ti, font=police(GOTHIQUE, tt), fill=0, anchor='mm')
            else:
                d.line([x0, y, x0 + l, y], fill=220, width=2); d.line([x0, y + tt + 12, x0 + l, y + tt + 12], fill=220, width=1)
                d.text((x0 + l / 2, y + tt / 2 + 5), ti, font=police(MINCHO_GRAS, tt), fill=245, anchor='mm')
            y += tt + 24
        while x > 14:
            r = rng.random() if not calme else 0.2 + 0.8 * rng.random()
            if r < 0.07:
                # un grand titre vertical, sur un ou deux étages
                ti = titres[int(rng.integers(len(titres)))]
                tt = int(rng.choice([26, 32, 40, 48]))
                haut = etage * (2 if rng.random() < 0.35 and len(ti) * tt > etage else 1) - 12
                tt = min(tt, int(haut / max(4, len(ti))))
                if tt >= 18:
                    colonne(calque, ti, x - tt * 0.7, y + (haut - len(ti) * tt) * 0.3, MINCHO_GRAS if rng.random() < 0.6 else GOTHIQUE, tt)
                    x -= tt * 1.5
                    continue
            if r < 0.11:
                # un filet entre deux articles
                d.line([x - 4, y, x - 4, y + etage - 12], fill=170, width=1)
                x -= 9
                continue
            if r < 0.125:
                # un petit encadré : un titre court entre deux filets
                ti = titres[int(rng.integers(len(titres)))][:8]
                d.rectangle([x - 26, y, x - 2, y + min(etage - 14, len(ti) * 18 + 10)], outline=210, width=1)
                colonne(calque, ti, x - 14, y + 5, GOTHIQUE, 17, ymax=y + etage - 14)
                x -= 34
                continue
            colonne(calque, suite(15), x - t * 0.5, y, MINCHO, t)
            x -= t * 1.62
        d.line([10, y + etage - 5, L - 10, y + etage - 5], fill=120, width=1)
        y += etage
        k += 1
    return calque

def fond_journal(titres, corps, rng):
    """Le fond du tableau : des coupures de journaux vieillis au thé, collées de travers les unes sur les autres. Rend une image RVB (float)."""
    pages = [np.asarray(page(1500, 1500, titres, corps, rng), np.float32) / 255 for _ in range(2)]
    calme = np.asarray(page(1500, 1500, titres, corps, rng, calme=True), np.float32) / 255
    toile = np.zeros((H0, W0, 3), np.float32)
    toile[:] = (214, 196, 160)
    tons = [(236, 224, 202), (232, 218, 192), (226, 210, 180), (240, 230, 210), (222, 204, 170), (230, 214, 184), (236, 222, 196)]
    # dessous : une grande page entière (aucun coin de la toile ne reste nu)
    m0 = pages[0][20:20 + H0, 30:30 + W0]
    e0 = 0.8 * m0 * (0.82 + 0.3 * bruit(H0, W0, 5, rng))
    toile = (np.array(tons[2], np.float32)[None, None, :] * (0.95 + 0.08 * bruit(H0, W0, 140, rng, 3)[..., None])) * (1 - e0[..., None]) + np.array([38, 34, 32], np.float32) * e0[..., None]
    # une grille de coupures, un peu au hasard, puis quelques-unes par-dessus : toute la toile est couverte
    places = [(x, y) for y in np.linspace(-40, H0 - 200, 6) for x in np.linspace(-60, W0 - 220, 4)]
    places = [(x + rng.uniform(-70, 70), y + rng.uniform(-70, 70)) for x, y in places]
    rng.shuffle(places)
    places += [(rng.uniform(0, W0 - 300), rng.uniform(0, H0 - 300)) for _ in range(7)]
    for i, (px, py) in enumerate(places):
        l, h = int(rng.uniform(300, 620)), int(rng.uniform(260, 620))
        # (au milieu de la toile, là où sera le visage : du texte seul)
        au_milieu = abs(px + l / 2 - W0 * 0.44) < W0 * 0.3 and abs(py + h / 2 - H0 * 0.55) < H0 * 0.25
        pg = calme if au_milieu else pages[int(rng.integers(2))]
        x0, y0 = int(rng.integers(0, 1500 - l)), int(rng.integers(0, 1500 - h))
        m = pg[y0:y0 + h, x0:x0 + l]
        ton = np.array(tons[int(rng.integers(len(tons)))], np.float32) * rng.uniform(0.95, 1.03)
        # le papier : sa teinte, des taches de thé, un bord un peu plus sombre
        tache = bruit(h, l, 120, rng, 3)
        papier = ton[None, None, :] * (0.93 + 0.1 * tache[..., None])
        papier[..., 2] *= (0.96 + 0.05 * tache)          # le thé jaunit
        bx = np.minimum(np.arange(l), np.arange(l)[::-1])[None, :].astype(np.float32)
        by = np.minimum(np.arange(h), np.arange(h)[::-1])[:, None].astype(np.float32)
        bord = np.clip(np.minimum(bx, by) / 14, 0, 1)
        papier *= (0.94 + 0.06 * bord[..., None])
        encre = (0.78 + 0.14 * rng.random()) * m * (0.82 + 0.3 * bruit(h, l, 5, rng))
        coupure = papier * (1 - encre[..., None]) + np.array([38, 34, 32], np.float32) * encre[..., None]
        # tournée (souvent un peu, parfois couchée), collée avec son ombre légère
        angle = rng.choice([rng.uniform(-9, 9), rng.uniform(-28, 28), 90 + rng.uniform(-6, 6), -90 + rng.uniform(-6, 6)], p=[0.55, 0.25, 0.1, 0.1])
        im = Image.fromarray(np.clip(coupure, 0, 255).astype(np.uint8)).convert('RGBA').rotate(angle, resample=Image.BICUBIC, expand=True)
        a = np.asarray(im, np.float32)
        alpha = a[..., 3:4] / 255
        hh, ll = a.shape[:2]
        X, Y = int(px), int(py)
        x1, y1, x2, y2 = max(0, X), max(0, Y), min(W0, X + ll), min(H0, Y + hh)
        if x2 <= x1 or y2 <= y1: continue
        sa = alpha[y1 - Y:y2 - Y, x1 - X:x2 - X]
        # l'ombre de la coupure sur celles de dessous (2 pixels en bas à droite)
        ombre = cv2.GaussianBlur(np.pad(alpha[..., 0], 6), (0, 0), 2.2)[6 - 2:6 - 2 + hh, 6 - 2:6 - 2 + ll][y1 - Y:y2 - Y, x1 - X:x2 - X, None]
        zone = toile[y1:y2, x1:x2]
        zone *= (1 - 0.22 * ombre * (1 - sa))
        zone[:] = zone * (1 - sa) + a[y1 - Y:y2 - Y, x1 - X:x2 - X, :3] * sa
    # le vernis mat, le grain du papier, les bords de la toile un peu plus sombres
    grain = bruit(H0, W0, 2.2, rng)[..., None]
    toile *= (0.965 + 0.07 * grain)
    grand = bruit(H0, W0, 320, rng, 2)[..., None]
    toile *= (0.94 + 0.1 * grand)
    return toile

from portrait import encre_portrait

# ---------------------------------------------------------------- le nom au pinceau, l'ornement de bambou
def nom_pinceau(kana, haut, rng):
    """Le nom en katakana, de haut en bas, au pinceau : un masque (float 0–1) de hauteur haut."""
    n = len(kana)
    t = int(min(haut / (n * 0.94), 330))
    im = Image.new('L', (int(t * 1.7), int(t * (n * 0.94 + 0.5))), 0)
    for i, ch in enumerate(kana):
        tu, m = tuile(ch, PINCEAU, t)
        tu = tu.rotate(float(rng.uniform(-5, 5)), resample=Image.BICUBIC)
        im.paste(255, (int(t * 0.85 - t / 2 - m + rng.uniform(-0.05, 0.05) * t), int(t * 0.1 + i * t * 0.94 - m + t * 0.0)), tu)
    a = np.asarray(im, np.float32) / 255
    h, l = a.shape
    # le pinceau : des bords qui bavent un peu, des manques dans les pleins
    a = cv2.GaussianBlur(a, (0, 0), 1.2)
    a = np.clip((a - 0.42 + (bruit(h, l, 7, rng) - 0.5) * 0.25) / 0.12, 0, 1)
    sec = bruit(h * 3, l, 3.2, rng)[::3, :] * bruit(h, l, 44, rng, 2)
    a *= (1 - 0.5 * np.clip((sec - 0.4) / 0.1, 0, 1))
    return a

def bambou(rng, taille=330):
    """L'ornement du coin : deux bambous croisés sur deux feuilles sèches, noués d'un fil. Rend (RVB, alpha, ombre), des carrés de taille pixels."""
    S = 3
    T = taille * S
    def baton(lg, ep, ton):
        im = np.zeros((int(ep * 1.3), int(lg), 4), np.float32)
        hh, ll = im.shape[:2]
        v = (np.arange(hh, dtype=np.float32)[:, None] - hh / 2) / (ep / 2)
        # un cylindre : la lumière vient d'en haut à gauche, le dessous dans l'ombre
        lumiere = 0.5 + 0.62 * np.clip(1 - ((v + 0.38) / 0.95) ** 2, 0, 1)
        fibres = 0.96 + 0.08 * bruit(hh * 8, ll, 5, rng)[::8, :]
        for c in range(3): im[..., c] = ton[c] * lumiere * fibres
        im[..., 3] = (np.abs(v) <= 1).astype(np.float32)
        xs = np.arange(ll, dtype=np.float32)[None, :]
        # les nœuds : un sillon sombre, un bourrelet clair de chaque côté
        for f in (0.27 + rng.uniform(-0.03, 0.03), 0.7 + rng.uniform(-0.03, 0.03)):
            dx = xs - ll * f
            im[..., :3] *= (1 - 0.5 * np.exp(-(dx / (S * 1.4)) ** 2) + 0.16 * np.exp(-((np.abs(dx) - S * 5) / (S * 3)) ** 2))[..., None]
        # les bouts : la coupe, plus claire, et son creux sombre
        for x0, sens in ((0, 1), (ll, -1)):
            d = (xs - x0) * sens
            im[..., :3] *= (1 - 0.3 * np.clip(1 - d / (S * 3), 0, 1))[..., None]
        return im
    def feuille(lg, la, ton):
        im = np.zeros((int(la), int(lg), 4), np.float32)
        hh, ll = im.shape[:2]
        u = np.arange(ll, dtype=np.float32)[None, :] / ll
        v = (np.arange(hh, dtype=np.float32)[:, None] - hh / 2) / (hh / 2)
        demi = np.sin(np.clip(u, 0, 1) * math.pi) ** 0.62 * (1 - 0.3 * u) + 1e-3
        dedans = np.clip((demi - np.abs(v)) * hh / 4, 0, 1)
        w = v / demi
        nervures = 0.95 + 0.05 * np.cos(w * 7 * math.pi) - 0.1 * np.exp(-(w / 0.05) ** 2)
        taches = 0.9 + 0.2 * bruit(hh, ll, 40, rng, 2)
        for c in range(3): im[..., c] = ton[c] * nervures * taches * (1 - 0.12 * np.clip(np.abs(w), 0, 1))
        im[..., 3] = dedans
        return im
    toile = np.zeros((T, T, 4), np.float32)
    ombre = np.zeros((T, T), np.float32)
    def poser(piece, cx, cy, angle, haut=7):
        im = Image.fromarray(np.clip(np.dstack([piece[..., :3], piece[..., 3:] * 255]), 0, 255).astype(np.uint8), 'RGBA').rotate(angle, resample=Image.BICUBIC, expand=True)
        a = np.asarray(im, np.float32)
        hh, ll = a.shape[:2]
        x, y = int(cx - ll / 2), int(cy - hh / 2)
        x1, y1, x2, y2 = max(0, x), max(0, y), min(T, x + ll), min(T, y + hh)
        sa = a[y1 - y:y2 - y, x1 - x:x2 - x, 3:4] / 255
        # son ombre portée (en bas à droite), sur ce qui est dessous ; puis lui
        d = haut * S // 3 + 2
        om = cv2.GaussianBlur(np.pad(a[..., 3] / 255, 40), (0, 0), haut)[40 - d:40 - d + hh, 40 - d:40 - d + ll][y1 - y:y2 - y, x1 - x:x2 - x]
        z = toile[y1:y2, x1:x2]
        z[..., :3] *= (1 - 0.45 * om[..., None] * (1 - sa))
        ombre[y1:y2, x1:x2] = np.maximum(ombre[y1:y2, x1:x2] * (1 - sa[..., 0]), om * (1 - sa[..., 0]))
        z[..., :3] = z[..., :3] * (1 - sa) + a[y1 - y:y2 - y, x1 - x:x2 - x, :3] * sa
        z[..., 3:4] = np.maximum(z[..., 3:4], sa)
    poser(feuille(T * 0.98, T * 0.24, (216, 190, 138)), T * 0.4, T * 0.5, 46, haut=4)
    poser(feuille(T * 0.7, T * 0.17, (196, 166, 112)), T * 0.33, T * 0.33, 72, haut=4)
    poser(baton(T * 0.84, T * 0.1, (214, 166, 100)), T * 0.44, T * 0.3, 16, haut=8)
    poser(baton(T * 0.78, T * 0.105, (198, 148, 84)), T * 0.36, T * 0.42, 52, haut=8)
    # le lien : quelques tours de fil sombre au croisement
    lien = np.zeros((T, T), np.float32)
    for i in range(6):
        o = (i - 2.5) * T * 0.012
        cv2.line(lien, (int(T * 0.2 + o), int(T * 0.3 - o * 0.4)), (int(T * 0.33 + o), int(T * 0.47 - o * 0.4)), 1.0, max(2, int(T * 0.006)), cv2.LINE_AA)
    lien *= (toile[..., 3] > 0.5)
    toile[..., :3] = toile[..., :3] * (1 - lien[..., None] * 0.88) + np.array([74, 52, 36], np.float32) * lien[..., None] * 0.88
    petit = lambda m: cv2.resize(m, (taille, taille), interpolation=cv2.INTER_AREA)
    return petit(toile[..., :3]), petit(toile[..., 3]), petit(ombre * (1 - toile[..., 3]))


# ---------------------------------------------------------------- le tableau
def tableau(T, brut, sortie, taille=800):
    rng = np.random.default_rng(T.get('graine', 1))
    toile = fond_journal(T['titres'], T['corps'], rng)
    dens, voile, (x0, y0, x1, y1) = encre_portrait(brut / f"{T['id']}.png", rng, bas=T.get('bas', 0.22), o=T)
    # le portrait, à sa place : au milieu, un peu bas, large de k fois la toile
    k = T.get('large', 0.6) * W0 / (x1 - x0)
    lp, hp = int(dens.shape[1] * k), int(dens.shape[0] * k)
    dens = cv2.resize(dens, (lp, hp), interpolation=cv2.INTER_AREA)
    voile = cv2.resize(voile, (lp, hp), interpolation=cv2.INTER_AREA)
    cx, cy = (x0 + x1) / 2 * k, (y0 + y1) / 2 * k
    X, Y = int(W0 * T.get('cx', 0.44) - cx), int(H0 * T.get('cy', 0.6) - cy)
    A, V = np.zeros((H0, W0), np.float32), np.zeros((H0, W0), np.float32)
    ax1, ay1, ax2, ay2 = max(0, X), max(0, Y), min(W0, X + lp), min(H0, Y + hp)
    A[ay1:ay2, ax1:ax2] = dens[ay1 - Y:ay2 - Y, ax1 - X:ax2 - X]
    V[ay1:ay2, ax1:ax2] = voile[ay1 - Y:ay2 - Y, ax1 - X:ax2 - X]
    # (un voile clair très léger sous le dessin : le visage reste lisible sur les colonnes du journal)
    v = (cv2.GaussianBlur(V, (0, 0), 3) * T.get('voile', 0.7))[..., None]
    toile = toile * (1 - v) + np.array([244, 236, 220], np.float32) * v
    # le nom, en haut à droite
    nom = nom_pinceau(T['kana'], H0 * T.get('hautNom', 0.5), rng)
    hn, ln = nom.shape
    nx, ny = int(W0 * T.get('xNom', 0.985) - ln), int(H0 * T.get('yNom', 0.035))
    N = np.zeros((H0, W0), np.float32)
    nx1, ny1, nx2, ny2 = max(0, nx), max(0, ny), min(W0, nx + ln), min(H0, ny + hn)
    N[ny1:ny2, nx1:nx2] = nom[ny1 - ny:ny2 - ny, nx1 - nx:nx2 - nx]
    encre = np.clip(np.maximum(A, N * 0.97), 0, 1)[..., None]
    toile = toile * (1 - encre * 0.96) + ENCRE * encre * 0.96
    # l'ornement de bambou, en haut à gauche
    b, ba, bo = bambou(rng, 330)
    z = toile[0:330, 0:330]
    z *= (1 - 0.5 * bo[..., None])
    z[:] = z * (1 - ba[..., None]) + b * ba[..., None]
    im = Image.fromarray(np.clip(toile, 0, 255).astype(np.uint8))
    im = im.resize((taille, round(taille * H0 / W0)), Image.LANCZOS)
    sortie.mkdir(parents=True, exist_ok=True)
    f = sortie / f"{T['id']}.webp"
    im.save(f, 'WEBP', quality=T.get('qualite', 80), method=6)
    if '--jpg' in sys.argv: im.save(sortie / f"{T['id']}.jpg", quality=90)
    print(T['id'], f.stat().st_size // 1024, 'Ko')

if __name__ == '__main__':
    ARGS = sys.argv[1:]
    opt = lambda n, d=None: ARGS[ARGS.index(n) + 1] if n in ARGS else d
    liste = json.load(io.open(ARGS[0], encoding='utf-8'))
    seul = opt('--seul')
    for T in liste:
        if seul and T['id'] not in seul.split(','): continue
        tableau(T, Path(ARGS[1]), Path(ARGS[2]), int(opt('--taille', '800')))
