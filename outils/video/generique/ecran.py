# -*- coding: utf-8 -*-
"""Met la vraie carte dans l'écran du téléphone du plan animé (sources/<nom>.mp4 → public/clips/<nom>.mp4) : le héros de la vidéo 1
(anime-flux) ou l'héroïne de la vidéo 2 (fille-flux), tous deux le rush 2 du propriétaire redessiné par FLUX (le même geste) ; le
héros de la vidéo 3 (heros-pop : il surgit dans le cadre, rush 3) et l'héroïne de la vidéo 4 (fille-tourne : elle se retourne, rush 1).
    python outils/video/generique/ecran.py [anime-flux|fille-flux|heros-pop|fille-tourne] [--essai]

Le propriétaire (2026-11-22), après la première version : « quand le personnage il montre son téléphone avec la carte, faudrait que
ce soit vraiment la carte qu'il montre, parce que là, avec le fond bleu et tout, c'est un peu nul ». FLUX avait dessiné un Japon
turquoise sur un écran turquoise. Ici :
- l'écran est repéré à sa couleur (le turquoise de FLUX, les trous de son dessin bouchés), image par image, à 24 images/s ;
- ses quatre côtés sont des droites ajustées sur le bord de l'écran (sans les coins arrondis ni l'encoche) : leurs croisements sont
  les quatre coins, et la vraie prise de la carte (`rushes/tn-japon.mp4`, celle qui suit dans le montage, au même instant) y est
  posée en perspective, sous le cadre noir dessiné du téléphone ;
- quand le téléphone sort du cadre (la caméra plonge dedans, images 63 → 70), les coins glissent en douceur jusqu'au cadrage exact
  du plan de la carte à l'image T.carte (son zoom 1,3 → 1 à cet instant, fois le 1,06 de tous les plans) : la plongée atterrit sur
  le plan suivant, sans raccord visible ;
- dans sa main, avant qu'il le tende (images 27 → 31), le petit écran vu de biais et flou est trop petit pour y poser la carte
  (essayé : des morceaux de terre orange sur sa main) : son turquoise prend seulement la couleur de la mer de la carte (le motif
  turquoise du lit, derrière, n'est pas touché) ;
- vidéo 2 : FLUX a dessiné au mur de droite deux affiches « WANTED » (celles de la chambre du propriétaire, de One Piece, qu'on ne
  montre pas) : repérées à leur papier fauve, bouchées (leur texte), sans la main ni l'écran, et remplies du dégradé du mur autour.
--essai écrit les images avec les coins trouvés dans videos/carte/generique/brouillons/ecran/.
"""
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np

ICI = Path(__file__).resolve().parent
GENERIQUE = ICI.parents[2] / 'videos' / 'carte' / 'generique'
CARTE = GENERIQUE / 'public' / 'rushes' / 'tn-japon.mp4'
ESSAIS = GENERIQUE / 'brouillons' / 'ecran'
L, H = 1080, 1920
COULEUR = ['-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709']

FPS = 60


class Video:
    """Un plan animé du téléphone et sa place dans son montage (theme.ts / temps.ts de la vidéo) : V0 et T0 de sa chanson ; les temps
    où le plan commence (`anime`), où la plongée atterrit sur le plan de la carte (`carte` ; ce plan, tn-japon, commence 10 images
    avant) et où ce plan finit ; son t0 et son zoom (Generique.tsx, Fille.tsx), tous les plans étant agrandis de 1,06."""

    def __init__(self, nom, v0, t0, anime, carte, fin_plan, plan_t0=2.1, plan_zoom=(1.3, 1.0), affiches=False, bpm=165,
                 nettes=range(42, 63), depart=62, main=range(27, 32), entree=(41, 40, 39), debut=39, bouge=False):
        self.source = GENERIQUE / 'sources' / f'{nom}.mp4'
        self.sortie = GENERIQUE / 'public' / 'clips' / f'{nom}.mp4'
        self.v0, self.t0, self.temps = v0, t0, 60 / bpm
        # les images de FLUX (24/s) : l'écran entier, le départ de la plongée, le téléphone petit dans la main (seulement teinté),
        # celles où il entre par la droite (le côté droit manque), la première où on le cherche
        self.nettes, self.depart, self.main, self.entree, self.debut = nettes, depart, main, entree, debut
        # `bouge` : le téléphone filé par FLUX quand il bouge vite (la vidéo 4) ; la carte y est filée de même, et le halo turquoise
        # du flou, autour de l'écran, prend la couleur de la mer de la carte
        self.bouge = bouge
        self.anime, self.carte, self.fin_plan = self.b(anime), self.b(carte), self.b(fin_plan)
        self.plan_de, self.plan_t0, self.plan_zoom, self.affiches = self.carte - 10, plan_t0, plan_zoom, affiches
        # l'image de FLUX (24/s) où la plongée atterrit (= T.carte)
        self.arrivee = round((self.carte - self.anime) / 2.5)

    def b(self, n):
        return self.v0 + round((self.t0 + n * self.temps) * FPS)


VIDEOS = {
    # la vidéo 1 (le héros, la chanson n° 1, theme.ts) : l'animé au temps 0, la carte au temps 8, Takeda au temps 16
    'anime-flux': Video('anime-flux', v0=122, t0=0.007, anime=0, carte=8, fin_plan=16),
    # la vidéo 2 (l'héroïne, la chanson n° 2, fille/temps.ts) : la coupe au temps 10, la carte au temps 18, Daisen au temps 25
    'fille-flux': Video('fille-flux', v0=-132, t0=0.0173, anime=10, carte=18, fin_plan=25, affiches=True),
    # la vidéo 3 (le héros, la chanson n° 3, h3/temps.ts : 167,073 battements par minute, ses temps comptés depuis 0,2151 s) :
    # l'animé dès l'image 0 (son temps 247), la carte sur la reprise du refrain (temps 253), Okuoi au temps 261. Il surgit par la
    # droite, le téléphone entre en tournant (images 12 → 15), l'écran entier de 16 à 49, le cadre plein à 54
    'heros-pop': Video('heros-pop', v0=-5335, t0=0.2151, bpm=167.073, anime=247, carte=253, fin_plan=261,
                       nettes=range(16, 50), depart=49, main=range(10, 12), entree=(15, 14, 13, 12), debut=10),
    # la vidéo 4 (l'héroïne, la chanson n° 4, f4/temps.ts : 165,004 battements par minute depuis 0,2610 s) : l'animé dès l'image
    # 0 (son temps 93), la carte sur le refrain (temps 100), la route d'Yushun au temps 108. Le téléphone caché à moitié par sa
    # hanche (11, 12 : seulement teinté), puis l'écran entier dans sa main, face à nous, de 13 à 56 (le propriétaire, 2026-11-22 :
    # « au début, la carte ne suit pas bien le téléphone » : l'écran restait turquoise dans sa main, la carte arrivait d'un coup à
    # l'image 27, nette dans un téléphone filé, avec un halo turquoise autour)
    'fille-tourne': Video('fille-tourne', v0=-2045, t0=0.2610, bpm=165.004, anime=93, carte=100, fin_plan=108,
                          nettes=range(13, 57), depart=56, main=range(11, 13), entree=(), debut=13, bouge=True),
}


def ffmpeg():
    try:
        return __import__('imageio_ffmpeg').get_ffmpeg_exe()
    except ImportError:
        return 'ffmpeg'


def lire(f, filtre):
    """Les images d'une vidéo en BGR (matrice bt709, comme le montage les lit)."""
    p = subprocess.Popen([ffmpeg(), '-v', 'quiet', '-i', str(f), '-vf', f'{filtre}scale=in_color_matrix=bt709:in_range=tv,format=bgr24',
                          '-f', 'rawvideo', '-'], stdout=subprocess.PIPE)
    try:
        while True:
            brut = p.stdout.read(L * H * 3)
            if len(brut) < L * H * 3:
                break
            yield np.frombuffer(brut, np.uint8).reshape(H, L, 3)
    finally:
        p.kill()
        p.wait()


# ---------------------------------------------------------------- repérer l'écran

def turquoise(im):
    hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    return ((h >= 76) & (h <= 100) & (s >= 60) & (v >= 110)).astype(np.uint8)


def plein(m):
    """La plus grande tache, trous bouchés (le Japon et les épingles dessinés sur l'écran)."""
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    if n <= 1:
        return None
    i = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    tache = (lab == i).astype(np.uint8)
    cs, _ = cv2.findContours(tache, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    out = np.zeros_like(tache)
    cv2.drawContours(out, cs, -1, 1, -1)
    return out, max(cs, key=cv2.contourArea)


def ordonner(q):
    """Haut-gauche, haut-droite, bas-droite, bas-gauche."""
    q = np.asarray(q, float)
    s, d = q.sum(1), q[:, 1] - q[:, 0]
    return np.array([q[np.argmin(s)], q[np.argmin(d)], q[np.argmax(s)], q[np.argmax(d)]])


def droite(p):
    vx, vy, x0, y0 = cv2.fitLine(p.astype(np.float32), cv2.DIST_L2, 0, 0.01, 0.01).ravel()
    return np.array([x0, y0]), np.array([vx, vy])


def croise(a, b_):
    (p, u), (q, v) = a, b_
    m = np.array([u, -v]).T
    t = np.linalg.solve(m, q - p)
    return p + t[0] * u


def cotes(contour):
    """Les quatre côtés de l'écran : les points du bord attribués au côté le plus proche du rectangle englobant (sans les coins
    arrondis), puis une droite ajustée en gardant les points les plus à l'extérieur (l'encoche et les coins rentrent)."""
    pts = contour.reshape(-1, 2).astype(float)
    dedans = (pts[:, 0] > 2) & (pts[:, 0] < L - 3) & (pts[:, 1] > 2) & (pts[:, 1] < H - 3)
    boite = ordonner(cv2.boxPoints(cv2.minAreaRect(contour)))
    centre = boite.mean(0)
    res = []
    for i in range(4):
        a, z = boite[i], boite[(i + 1) % 4]
        u = (z - a) / np.linalg.norm(z - a)
        n = np.array([u[1], -u[0]])
        if np.dot(n, a - centre) < 0:
            n = -n
        t = (pts - a) @ u / np.linalg.norm(z - a)
        d = (pts - a) @ n
        res.append((a, u, n, t, d))
    dist = np.stack([np.abs(r[4]) for r in res], 1)
    proche = np.argmin(dist, 1)
    lignes = []
    for i, (a, u, n, t, d) in enumerate(res):
        sel = (proche == i) & dedans & (t > 0.14) & (t < 0.86)
        if sel.sum() < 40:
            lignes.append(None)
            continue
        p = pts[sel]
        ligne = droite(p)
        for _ in range(4):
            o, v = ligne
            nn = np.array([v[1], -v[0]])
            if np.dot(nn, o - centre) < 0:
                nn = -nn
            dd = (p - o) @ nn
            garde = dd > np.median(dd) - 3
            if garde.sum() < 30:
                break
            ligne = droite(p[garde])
        lignes.append(ligne)
    return lignes


def coins(lignes):
    if any(x is None for x in lignes):
        return None
    return np.array([croise(lignes[(i + 3) % 4], lignes[i]) for i in range(4)])


def tourner(q, ref):
    """Les coins de q pris dans l'ordre (haut-gauche, haut-droite, bas-droite, bas-gauche du téléphone) qui va le mieux avec ceux
    de l'image voisine `ref` : quand le téléphone est penché à 45° (vidéo 4, dans sa main), `ordonner` peut prendre son long côté
    pour le haut, et la carte serait posée de travers, écrasée."""
    return min((np.roll(q, -r, 0) for r in range(4)), key=lambda p: np.linalg.norm((p - p.mean(0)) - (ref - ref.mean(0))))


# ---------------------------------------------------------------- la carte posée dans l'écran

def zoom_plan(v, e):
    """Le zoom du plan de la carte à l'image e du montage (Commun.tsx, Image_), fois le 1,06 de LePlan."""
    duree = v.fin_plan - v.plan_de
    u = min(1, max(0, (e - v.plan_de) / duree))
    expo = 1 if u >= 1 else 1 - 2 ** (-10 * u)
    z0, z1 = v.plan_zoom
    return 1.06 * (z0 + (z1 - z0) * (u * 0.6 + expo * 0.4))


def image_carte(v, e):
    """L'image de tn-japon que le plan montre à l'image e du montage (trimBefore = round(t0 × 60))."""
    return round(v.plan_t0 * FPS) + e - v.plan_de


def effacer_affiches(im):
    """Les affiches du mur de droite (vidéo 2) : leur papier fauve (teinte 11 → 22, saturation ≥ 95 ; le mur : saturation ~70), en
    taches assez grandes (les liserés des doigts disparaissent à l'ouverture), bouchées (leur texte sombre), sans la peau claire de la
    main ni l'écran turquoise ; puis remplies du dégradé du mur autour."""
    hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
    h, s, v = (hsv[..., i].astype(np.int16) for i in range(3))
    m = ((h >= 11) & (h <= 22) & (s >= 95) & (v >= 90)).astype(np.uint8)
    zone = np.zeros_like(m)
    zone[300:1390, 820:] = 1
    m = cv2.morphologyEx(m * zone, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    garde = [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] >= 350]
    if not garde:
        return im
    papier = np.isin(lab, garde).astype(np.uint8)
    # chaque affiche : son rectangle (le papier fauve n'en couvre qu'une partie : le dessin et le blanc du papier, à gauche, n'y sont
    # pas), élargi d'un tiers en largeur et d'un huitième en hauteur, jusqu'à son bord sombre et son ombre sur le mur
    m = np.zeros_like(m)
    for i in garde:
        ys, xs = np.nonzero(lab == i)
        (cx, cy), (w, h_), a = cv2.minAreaRect(np.stack([xs, ys], 1).astype(np.float32))
        if w < h_:
            w, h_ = w * 1.35 + 24, h_ * 1.12 + 24
        else:
            w, h_ = w * 1.12 + 24, h_ * 1.35 + 24
        cv2.fillConvexPoly(m, cv2.boxPoints(((cx, cy), (w, h_), a)).astype(np.int32), 1)
    m = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))) * zone
    # la main qui passe devant : sa peau (valeur ~240, saturation 50 → 75), en une grande tache (les reflets blancs du papier des
    # affiches sont petits), et son trait, autour, restent ; l'écran aussi
    peau = ((v >= 225) & (s >= 35) & (s <= 95) & (h <= 22)).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(peau, 8)
    peau = np.isin(lab, [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] >= 3000]).astype(np.uint8)
    main = cv2.dilate(peau, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25)))
    garde_ = main | turquoise(im)
    if (m & main).any():
        # la main passe devant les affiches (la fin du geste) : seulement le papier fauve qui dépasse encore entre les doigts (le
        # rectangle prendrait les ongles et le trait des doigts)
        m = cv2.dilate(cv2.morphologyEx(papier, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (33, 33))),
                       cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (23, 23))) * zone
    m[garde_ > 0] = 0
    # le mur, lisse, autour des affiches : un dégradé (polynôme du second degré par couleur) ajusté sur ses pixels (ni peau, ni
    # trait sombre, ni écran) dans un anneau de 40 px, qui remplit les affiches
    anneau = (cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (81, 81))) > 0) & (m == 0) & (garde_ == 0) & (zone > 0)
    anneau &= (v >= 90) & (v <= 222) & (s <= 95)
    ys, xs = np.nonzero(anneau)
    if len(xs) < 200:
        return im
    X = lambda x, y: np.stack([np.ones_like(x), x, y, x * x, x * y, y * y], 1)
    cx, cy = xs.mean(), ys.mean()
    A = X((xs - cx) / 300.0, (ys - cy) / 300.0)
    coef = np.linalg.lstsq(A, im[ys, xs].astype(np.float64), rcond=None)[0]
    yy, xx = np.nonzero(m)
    fond = np.clip(X((xx - cx) / 300.0, (yy - cy) / 300.0) @ coef, 0, 255)
    remplie = im.astype(np.float32).copy()
    remplie[yy, xx] = fond
    a = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 3) * (1 - garde_.astype(np.float32))
    return (im * (1 - a[..., None]) + remplie * a[..., None]).astype(np.uint8)


def cadrage(z):
    """Le cadre entier, vu par le plan au zoom z (autour du centre) : la plongée atterrit là."""
    c = np.array([L / 2, H / 2])
    return np.array([c + z * (np.array(p) - c) for p in [(0, 0), (L, 0), (L, H), (0, H)]])


def poser(fond, carte, rect, quad, masque, reflet=0.0, file=None, forme=None):
    """La carte (son rectangle `rect` de l'image source) posée sur le quadrilatère `quad`, à travers le masque de l'écran ; `file` :
    le déplacement de ses coins pendant la pose (le flou de bougé de FLUX), la carte est alors la moyenne de ses positions ;
    `forme` : la forme de l'écran dans l'image source (posée comme la carte, elle borde le masque d'un trait net qui suit les
    coins)."""
    hm = cv2.getPerspectiveTransform(rect.astype(np.float32), quad.astype(np.float32))
    # réduite d'abord si l'écran est petit (sinon les épingles crénelent)
    ech = np.sqrt(abs(np.linalg.det(hm[:2, :2] / hm[2, 2])))
    f = min(1.0, 1.4 * ech)
    src, fsrc = carte, forme
    if f < 0.95:
        src = cv2.resize(carte, None, fx=f, fy=f, interpolation=cv2.INTER_AREA)
        if forme is not None:
            fsrc = cv2.resize(forme, None, fx=f, fy=f, interpolation=cv2.INTER_AREA)

    def plaque(q, im, bord):
        h_ = cv2.getPerspectiveTransform(rect.astype(np.float32), q.astype(np.float32))
        if f < 0.95:
            h_ = h_ @ np.diag([1 / f, 1 / f, 1])
        return cv2.warpPerspective(im, h_, (L, H), flags=cv2.INTER_CUBIC if bord == cv2.BORDER_REFLECT else cv2.INTER_LINEAR,
                                   borderMode=bord)

    positions = [quad]
    if file is not None and np.abs(file).max() > 5:
        positions = [quad + t * file for t in np.linspace(-0.5, 0.5, int(np.clip(np.abs(file).max() / 3, 3, 21)))]
    if len(positions) > 1:
        somme = np.zeros((H, L, 3), np.float32)
        for q in positions:
            somme += plaque(q, src, cv2.BORDER_REFLECT)
        pose = np.clip(somme / len(positions) + 0.5, 0, 255).astype(np.uint8)
    else:
        pose = plaque(quad, src, cv2.BORDER_REFLECT)
    if fsrc is not None:
        masque = masque * sum(plaque(q, fsrc, cv2.BORDER_CONSTANT) for q in positions) / len(positions)
    if reflet > 0:
        # un reflet en biais sur la vitre, très léger
        yy, xx = np.mgrid[0:H, 0:L].astype(np.float32)
        q = quad.mean(0)
        bande = np.exp(-(((xx - q[0]) * 0.55 + (yy - q[1]) * 0.83 + 0.18 * np.linalg.norm(quad[2] - quad[0])) / 60) ** 2)
        pose = np.clip(pose + (reflet * 255 * bande)[..., None], 0, 255).astype(np.uint8)
    a = masque[..., None].astype(np.float32)
    return (fond * (1 - a) + pose * a).astype(np.uint8)


# la mer de la carte (tn-japon, en HSV d'OpenCV) : teinte 81, saturation 55, valeur 180 ; le turquoise de FLUX : 87, ~190, ~220
MER_TEINTE, MER_SAT, MER_VAL = 81, 0.3, 0.82


def teinter(im, a):
    """Le turquoise de FLUX passé à la couleur de la mer de la carte, à travers le masque doux `a`."""
    hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[..., 0] = MER_TEINTE
    hsv[..., 1] *= MER_SAT
    hsv[..., 2] *= MER_VAL
    mer = cv2.cvtColor(np.clip(hsv, 0, 255).astype(np.uint8), cv2.COLOR_HSV2BGR)
    a = a[..., None]
    return (im * (1 - a) + mer * a).astype(np.uint8)


def masque_doux(m, elargir=3):
    m = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * elargir + 1, 2 * elargir + 1)))
    return cv2.GaussianBlur(m.astype(np.float32), (0, 0), 1.2)


def forme_ecran(rect):
    """L'écran dans l'image de la carte : le rectangle `rect` aux coins arrondis (un dixième de sa largeur), rentré d'un centième."""
    f = np.zeros((H, L), np.float32)
    (x0, y0), (x1, y1) = rect[0], rect[2]
    w = x1 - x0
    m, r = 0.01 * w, 0.1 * w
    x0, y0, x1, y1 = x0 + m, y0 + m, x1 - m, y1 - m
    cv2.rectangle(f, (int(x0 + r), int(y0)), (int(x1 - r), int(y1)), 1, -1)
    cv2.rectangle(f, (int(x0), int(y0 + r)), (int(x1), int(y1 - r)), 1, -1)
    for cx, cy in ((x0 + r, y0 + r), (x1 - r, y0 + r), (x1 - r, y1 - r), (x0 + r, y1 - r)):
        cv2.circle(f, (int(cx), int(cy)), int(r), 1, -1, cv2.LINE_AA)
    return cv2.GaussianBlur(f, (0, 0), 1.5)


def ecran_seul(im):
    """Ce qui est l'écran dans le dessin de FLUX (son turquoise, même filé ou un peu sombre ; pas les doigts devant), en masque doux :
    avec `forme_ecran`, les doigts qui passent devant restent devant."""
    hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    m = ((h >= 70) & (h <= 105) & (s >= 60) & (v >= 70)).astype(np.uint8)
    return masque_doux(m, 4)


def halo(im, m):
    """Le turquoise autour de l'écran (le flou de bougé de FLUX, le liseré de son cadre), à 40 px au plus : un masque doux, plus fort
    où il est plus saturé, pour `teinter`."""
    hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
    h, s = hsv[..., 0], hsv[..., 1].astype(np.float32)
    pres = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (81, 81))) > 0
    a = ((h >= 70) & (h <= 105) & pres) * np.clip((s - 30) / 50, 0, 1)
    return cv2.GaussianBlur(a.astype(np.float32), (0, 0), 1.5)


def fabriquer(nom='anime-flux', essai=False):
    v = VIDEOS[nom]
    filtre = 'scale=1080:1920:flags=lanczos,unsharp=5:5:0.6,'
    images = list(lire(v.source, filtre))
    K = len(images)
    if v.affiches:
        images = [effacer_affiches(im) if k <= v.arrivee else im for k, im in enumerate(images)]
    masques, quads, teintes = {}, {}, {}
    for k, im in enumerate(images):
        m = turquoise(im)
        if k in v.main:
            # le téléphone dans sa main : le turquoise vif (le motif du lit, derrière, est plus sombre et moins saturé : valeur
            # 115 → 150, saturation 60 → 120), et le turquoise un peu moins vif tout autour (le flou du geste)
            hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
            vif = (m * (hsv[..., 1] >= 120) * (hsv[..., 2] >= 158)).astype(np.uint8)
            r = plein(vif)
            if r is not None and r[0].sum() > 300:
                autour = cv2.dilate(r[0], np.ones((21, 21), np.uint8)) * m * (hsv[..., 1] >= 90) * (hsv[..., 2] >= 140)
                teintes[k] = cv2.GaussianBlur(np.maximum(autour, r[0]).astype(np.float32), (0, 0), 2.0)
            continue
        if k < v.debut:
            continue
        r = plein(m)
        if r is None:
            continue
        masques[k], contour = r
        if k <= v.depart:
            quads[k] = coins(cotes(contour)) if k in v.nettes else None
            quads[k] = quads[k] if quads[k] is not None else cotes(contour)

    # les coins dans le même ordre d'une image à l'autre, en remontant depuis le départ de la plongée (le téléphone y est droit)
    for k in range(v.depart - 1, v.debut - 1, -1):
        if isinstance(quads.get(k), np.ndarray) and isinstance(quads.get(k + 1), np.ndarray):
            quads[k] = tourner(quads[k], quads[k + 1])

    # l'écran entier : ses proportions (la largeur sur la hauteur), pour le rectangle de la carte à y poser
    prop = np.median([np.linalg.norm(quads[k][1] - quads[k][0]) / np.linalg.norm(quads[k][3] - quads[k][0]) for k in v.nettes])
    print(f'proportions de l\'écran : {prop:.3f}')

    # quand il entre par la droite (39 → 41), le côté droit manque : celui de l'image 42 déplacé par la similitude qui amène
    # ses deux coins de gauche sur les nouveaux
    for k in v.entree:
        lignes = quads.get(k)
        if not isinstance(lignes, list):
            continue
        g, h_, bas = lignes[3], lignes[0], lignes[2]
        ref = quads[k + 1]
        if g is not None and h_ is not None and bas is not None:
            hg, bg = croise(g, h_), croise(bas, g)
        else:
            # trop peu de bord visible : le mouvement des deux images suivantes, prolongé
            hg, bg = 2 * quads[k + 1][0] - quads[k + 2][0], 2 * quads[k + 1][3] - quads[k + 2][3]
        a0, a1 = ref[0], ref[3]
        za, zb = complex(*(a1 - a0)), complex(*(bg - hg))
        s = zb / za
        quads[k] = np.array([[(complex(*(p - a0)) * s).real, (complex(*(p - a0)) * s).imag] for p in ref]) + hg

    # le rectangle de tn-japon montré dans l'écran : toute sa hauteur, sa bande du milieu aux proportions de l'écran
    lh = H * prop
    rect_ecran =np.array([[(L - lh) / 2, 0], [(L + lh) / 2, 0], [(L + lh) / 2, H], [(L - lh) / 2, H]])

    if essai:
        ESSAIS.mkdir(parents=True, exist_ok=True)
        for k in sorted(quads):
            im = images[k].copy()
            if k in masques:
                im[masques[k] > 0] = (im[masques[k] > 0] * 0.5 + np.array([0, 0, 255]) * 0.5).astype(np.uint8)
            cv2.polylines(im, [quads[k].astype(np.int32)], True, (0, 255, 0), 3)
            cv2.circle(im, tuple(int(x) for x in quads[k][0]), 9, (255, 0, 255), -1)  # le coin haut-gauche du téléphone
            cv2.imwrite(str(ESSAIS / f'coins-{k:02d}.jpg'), cv2.resize(im, (540, 960)))
        print('essais →', ESSAIS)
        return

    # la plongée : de l'image DEPART à ARRIVEE, chaque coin glisse en ligne droite vers le cadrage du plan à T.carte, d'abord à
    # la vitesse où FLUX approchait le téléphone (la hauteur de l'écran entre 61 et 62), puis de plus en plus lentement
    fin = cadrage(zoom_plan(v, v.carte))
    # le rectangle de la carte pour le cadrage du plan : le cadre entier (le plan montre tn-japon en plein écran)
    rect_plein = np.array([[0, 0], [L, 0], [L, H], [0, H]], float)
    # pendant la plongée on passe du rectangle de l'écran (au milieu de tn-japon) au cadre entier ; on garde rect_ecran et on
    # prolonge le quadrilatère d'arrivée en conséquence : le cadrage `fin` vu à travers rect_ecran
    hm_fin = cv2.getPerspectiveTransform(rect_plein.astype(np.float32), fin.astype(np.float32))
    fin_ecran = cv2.perspectiveTransform(rect_ecran.reshape(-1, 1, 2).astype(np.float32), hm_fin).reshape(-1, 2)
    DEPART = v.depart
    h0 = np.linalg.norm(quads[DEPART][3] - quads[DEPART][0])
    v0 = h0 - np.linalg.norm(quads[DEPART - 1][3] - quads[DEPART - 1][0])
    h1 = np.linalg.norm(fin_ecran[3] - fin_ecran[0])
    p = max(1.2, min(4.0, v0 * (v.arrivee - DEPART) / max(1.0, h1 - h0)))
    print(f'plongée : écran {h0:.0f} → {h1:.0f} px de haut en {v.arrivee - DEPART} images, départ {v0:.0f} px/image (p = {p:.2f})')
    for k in range(DEPART + 1, v.arrivee + 1):
        tau = (k - DEPART) / (v.arrivee - DEPART)
        s = 1 - (1 - tau) ** p
        quads[k] = quads[DEPART] + s * (fin_ecran - quads[DEPART])
    for k in range(DEPART + 1, K):
        if k not in quads:
            quads[k] = fin_ecran
        m = turquoise(images[k])
        r = plein(m)
        masques[k] = r[0] if r is not None else np.ones((H, L), np.uint8)

    # les images de la carte, lues au fil de l'eau (le montage montre l'image e du plan à l'image e)
    sortie = subprocess.Popen([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{L}x{H}',
                               '-r', str(FPS), '-i', '-', '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
                               '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-g', '6', *COULEUR, str(v.sortie)], stdin=subprocess.PIPE)
    cartes = lire(CARTE, '')
    i_carte, carte = -1, None
    N = int(K * 2.5)
    doux = {k: masque_doux(m) for k, m in masques.items()}
    # le téléphone filé (vidéo 4) : FLUX le file peu (un dixième de son déplacement d'une image à la suivante, mesuré sur son bord
    # quand elle le tend, images 28 → 31) ; la carte est filée de même, et le halo turquoise du flou passe à la couleur de la mer
    files, halos, forme = {}, {}, None
    if v.bouge:
        # le bord de l'écran : la forme de l'écran posée sur ses coins (un trait net qui les suit), plutôt que le bord du turquoise
        # de FLUX, déchiqueté quand il est filé ; les doigts devant restent devant (ecran_seul)
        forme = forme_ecran(rect_ecran)
        for k in range(v.nettes[0], DEPART + 1):
            if k in quads and k in masques:
                a, z = quads.get(k - 1, quads[k]), quads.get(k + 1, quads[k])
                files[k] = 0.12 * (z - a) / (2 if k - 1 in quads and k + 1 in quads else 1)
                halos[k] = halo(images[k], masques[k])
                doux[k] = ecran_seul(images[k])
    for n in range(N):
        k = min(K - 1, int(n / 2.5 + 1e-6))
        e = v.anime + n
        voulue = max(0, image_carte(v, e))
        while i_carte < voulue:
            carte = next(cartes)
            i_carte += 1
        im = images[k]
        if k in quads and k in doux:
            reflet = 0.05 * (1 - min(1, max(0, (k - DEPART) / 3))) if k >= v.nettes[0] else 0
            if k in halos:
                im = teinter(im, halos[k])
            im = poser(im, carte, rect_ecran, quads[k], doux[k], reflet, files.get(k), forme if k in halos else None)
        if k in teintes:
            im = teinter(im, teintes[k])
        sortie.stdin.write(im.tobytes())
    cartes.close()
    sortie.stdin.close()
    sortie.wait()
    print('ok →', v.sortie)


if __name__ == '__main__':
    noms = [a for a in sys.argv[1:] if not a.startswith('--')]
    fabriquer(noms[0] if noms else 'anime-flux', '--essai' in sys.argv)
