"""Fabrique la « carte des distances à la côte » qui fait vivre la mer (style « vieille carte »),
et le grand cache du large.

Chaque pixel de l'image dit à quelle distance de la côte du Japon il se trouve. La carte s'en sert :
- pour la houle, ces lignes d'eau qui avancent doucement vers les plages (site/mer.js, dessinées
  par la carte graphique : un seul dessin pour toutes les côtes, donc pas de ralentissement) ;
- pour garder les bateaux au large, loin des côtes.

Le grand cache (site/data/masque-large.geojson) recouvre de la couleur de la mer tout ce qui est loin
du Japon. Le cache des voisins (fabriquer_masque.py) cache leurs grandes terres, mais pas les milliers
d'îlots trop petits pour Natural Earth : vus de loin, ils faisaient des points de sable qui scintillaient
quand la carte bougeait (au large de la Corée surtout). Seuls restent visibles les abords du Japon :
à moins de DISTANCE_CACHE de ses côtes, et plus près du Japon que d'un pays voisin.

Sources : site/data/cote-japon.geojson (fabriqué par fabriquer_cote.py) et site/data/masque-voisins.geojson
(fabriqué par fabriquer_masque.py), sans rien télécharger.
Résultats : site/data/distance-cote.png (niveaux de gris, en projection de la carte)
            site/data/masque-large.geojson
Lancer :  python outils/fabriquer_houle.py      (demande numpy, Pillow et opencv-python)

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
VOISINS = RACINE / "site" / "data" / "masque-voisins.geojson"
SORTIE = RACINE / "site" / "data" / "distance-cote.png"
SORTIE_CACHE = RACINE / "site" / "data" / "masque-large.geojson"

BORNES = (121.5, 23.0, 157.5, 51.5)  # ouest, sud, est, nord : tout le Japon et les Kouriles
LARGEUR = 1024  # pixels de l'image (la hauteur suit, pour garder les proportions de la carte)
DISTANCE_MAX = 160  # pixels au zoom 5 : au-delà, c'est le large
SURECHANTILLON = 2  # calcul en ×2 puis moyenne : des distances plus justes près des côtes
DISTANCE_CACHE = 34  # pixels au zoom 5 (≈ 70 km) : au-delà, le grand cache recouvre tout
CADRE_CACHE = (100.0, 0.0, 180.0, 66.0)  # le grand cache déborde des limites de la carte


def mercator(lon, lat):
    """Coordonnées de la carte, de 0 à 1 sur le monde entier (y vers le sud)."""
    y = math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))
    return (lon + 180) / 360, (1 - y / math.pi) / 2


def terres(anneaux, largeur, hauteur, x0, y0, x1, y1):
    """Masque des terres. Chaque contour inverse ce qu'il entoure (pair-impair) : les trous restent de l'eau."""
    masque = np.zeros((hauteur, largeur), dtype=bool)
    for anneau in anneaux:
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


def lonlat(px, py, largeur, hauteur, x0, y0, x1, y1):
    x = x0 + px / largeur * (x1 - x0)
    y = y0 + py / hauteur * (y1 - y0)
    lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y))))
    return [round(x * 360 - 180, 4), round(lat, 4)]


def aire(anneau):
    return sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(anneau, anneau[1:])) / 2


def grand_cache(proche, largeur, hauteur, x0, y0, x1, y1):
    """Un rectangle couleur de mer, troué autour du Japon (trous = les zones « proches »)."""
    import cv2  # opencv-python : il suit le contour des zones proches

    contours, _ = cv2.findContours(proche.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    o, s_, e, n = CADRE_CACHE
    anneaux = [[[o, s_], [e, s_], [e, n], [o, n], [o, s_]]]  # extérieur dans le sens inverse des aiguilles
    for c in contours:
        c = cv2.approxPolyDP(c, 1.0, True)[:, 0, :]
        if len(c) < 3:
            continue
        trou = [lonlat(px + 0.5, py + 0.5, largeur, hauteur, x0, y0, x1, y1) for px, py in c]
        trou.append(trou[0])
        if aire(trou) > 0:  # les trous tournent dans le sens des aiguilles d'une montre
            trou.reverse()
        anneaux.append(trou)
    geojson = {"type": "FeatureCollection", "features": [
        {"type": "Feature", "properties": {}, "geometry": {"type": "Polygon", "coordinates": anneaux}}]}
    SORTIE_CACHE.write_text(json.dumps(geojson, separators=(",", ":")), encoding="utf-8")
    print(f"{len(anneaux) - 1} zones visibles autour du Japon -> {SORTIE_CACHE} ({SORTIE_CACHE.stat().st_size // 1024} Ko)")


def main():
    ouest, sud, est, nord = BORNES
    x0, y0 = mercator(ouest, nord)
    x1, y1 = mercator(est, sud)
    hauteur = round(LARGEUR * (y1 - y0) / (x1 - x0))
    s = SURECHANTILLON
    cadre = (LARGEUR * s, hauteur * s, x0, y0, x1, y1)
    japon = json.loads(COTE.read_text(encoding="utf-8"))["features"][0]["geometry"]["coordinates"]
    # pixels de calcul → pixels d'écran au zoom 5 (le monde fait 512 × 2⁵ pixels de large)
    echelle = (x1 - x0) / (LARGEUR * s) * 512 * 2 ** 5
    d = distances(terres(japon, *cadre)) * echelle
    voisins = [a for poly in json.loads(VOISINS.read_text(encoding="utf-8"))["features"][0]["geometry"]["coordinates"] for a in poly]
    d_voisins = distances(terres(voisins, *cadre)) * echelle
    grand_cache((d < DISTANCE_CACHE) & (d <= d_voisins), *cadre)
    d = d.reshape(hauteur, s, LARGEUR, s).mean(axis=(1, 3))
    v = np.round(255 * np.sqrt(np.clip(d, 0, DISTANCE_MAX) / DISTANCE_MAX)).astype(np.uint8)
    Image.fromarray(v, "L").save(SORTIE, optimize=True)
    print(f"{LARGEUR}×{hauteur} -> {SORTIE} ({SORTIE.stat().st_size // 1024} Ko)")


if __name__ == "__main__":
    main()
