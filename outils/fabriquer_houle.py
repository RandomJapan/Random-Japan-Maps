"""Fabrique la « carte des distances à la côte » qui fait vivre la mer (style « vieille carte »).

Chaque pixel de l'image dit à quelle distance de la côte du Japon il se trouve. La carte s'en sert :
- pour la houle, ces lignes d'eau qui avancent doucement vers les plages (site/mer.js, dessinées
  par la carte graphique : un seul dessin pour toutes les côtes, donc pas de ralentissement) ;
- pour placer les petites vagues au large, loin des côtes.

Source : site/data/cote-japon.geojson (fabriqué par fabriquer_cote.py), sans rien télécharger.
Résultat : site/data/distance-cote.png (niveaux de gris, en projection de la carte)
Lancer :  python outils/fabriquer_houle.py      (demande numpy et Pillow)

Codage (à garder identique dans site/mer.js) :
- l'image couvre BORNES (longitudes et latitudes), en projection Mercator, comme la carte ;
- la valeur v (0 à 255) donne la distance d = (v / 255)² × DISTANCE_MAX, en pixels d'écran au zoom 5 ;
  la racine carrée garde plus de précision près des côtes, là où la houle se voit ;
- 0 = la terre.
"""
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

RACINE = Path(__file__).resolve().parent.parent
COTE = RACINE / "site" / "data" / "cote-japon.geojson"
SORTIE = RACINE / "site" / "data" / "distance-cote.png"

BORNES = (121.5, 23.0, 157.5, 51.5)  # ouest, sud, est, nord : tout le Japon et les Kouriles
LARGEUR = 1024  # pixels de l'image (la hauteur suit, pour garder les proportions de la carte)
DISTANCE_MAX = 160  # pixels au zoom 5 : au-delà, c'est le large
SURECHANTILLON = 2  # calcul en ×2 puis moyenne : des distances plus justes près des côtes


def mercator(lon, lat):
    """Coordonnées de la carte, de 0 à 1 sur le monde entier (y vers le sud)."""
    y = math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))
    return (lon + 180) / 360, (1 - y / math.pi) / 2


def terres(largeur, hauteur, x0, y0, x1, y1):
    """Masque des terres. Chaque contour inverse ce qu'il entoure (pair-impair) : les trous restent de l'eau."""
    masque = np.zeros((hauteur, largeur), dtype=bool)
    lignes = json.loads(COTE.read_text(encoding="utf-8"))["features"][0]["geometry"]["coordinates"]
    for anneau in lignes:
        points = []
        for lon, lat in anneau:
            x, y = mercator(lon, lat)
            points.append(((x - x0) / (x1 - x0) * largeur, (y - y0) / (y1 - y0) * hauteur))
        image = Image.new("1", (largeur, hauteur), 0)
        ImageDraw.Draw(image).polygon(points, fill=1, outline=1)
        masque ^= np.array(image, dtype=bool)
    return masque


def distances(masque):
    """Distance (en pixels) de chaque pixel à la terre la plus proche : « jump flooding », exact à peu de chose près."""
    h, w = masque.shape
    ys, xs = np.mgrid[0:h, 0:w].astype(np.int32)
    gy = np.where(masque, ys, -1)  # la terre la plus proche connue de chaque pixel (-1 : pas encore)
    gx = np.where(masque, xs, -1)

    def ecart(cy, cx):
        d = (ys - cy).astype(np.int64) ** 2 + (xs - cx).astype(np.int64) ** 2
        return np.where(cy >= 0, d, np.iinfo(np.int64).max)

    pas = 1 << (max(h, w) - 1).bit_length() - 1
    pas_liste = []
    while pas >= 1:
        pas_liste.append(pas)
        pas //= 2
    for pas in pas_liste + [1]:
        meilleur = ecart(gy, gx)
        for dy in (-pas, 0, pas):
            for dx in (-pas, 0, pas):
                if not dy and not dx:
                    continue
                cy = np.full_like(gy, -1)
                cx = np.full_like(gx, -1)
                # voisin (y + dy, x + dx), décalé en bloc
                src = (slice(max(dy, 0), h + min(dy, 0)), slice(max(dx, 0), w + min(dx, 0)))
                dst = (slice(max(-dy, 0), h + min(-dy, 0)), slice(max(-dx, 0), w + min(-dx, 0)))
                cy[dst] = gy[src]
                cx[dst] = gx[src]
                d = ecart(cy, cx)
                mieux = d < meilleur
                gy = np.where(mieux, cy, gy)
                gx = np.where(mieux, cx, gx)
                meilleur = np.where(mieux, d, meilleur)
    return np.sqrt(meilleur.astype(np.float64))


def main():
    ouest, sud, est, nord = BORNES
    x0, y0 = mercator(ouest, nord)
    x1, y1 = mercator(est, sud)
    hauteur = round(LARGEUR * (y1 - y0) / (x1 - x0))
    s = SURECHANTILLON
    masque = terres(LARGEUR * s, hauteur * s, x0, y0, x1, y1)
    d = distances(masque)
    # pixels de calcul → pixels d'écran au zoom 5 (le monde fait 512 × 2⁵ pixels de large)
    d *= (x1 - x0) / (LARGEUR * s) * 512 * 2 ** 5
    d = d.reshape(hauteur, s, LARGEUR, s).mean(axis=(1, 3))
    v = np.round(255 * np.sqrt(np.clip(d, 0, DISTANCE_MAX) / DISTANCE_MAX)).astype(np.uint8)
    Image.fromarray(v, "L").save(SORTIE, optimize=True)
    print(f"{LARGEUR}×{hauteur} -> {SORTIE} ({SORTIE.stat().st_size // 1024} Ko)")


if __name__ == "__main__":
    main()
