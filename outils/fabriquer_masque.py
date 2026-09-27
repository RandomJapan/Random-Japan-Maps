"""Fabrique le « cache » qui efface les pays voisins du Japon sur la carte.

Source : Natural Earth 1:10m (domaine public).
Résultat : site/data/masque-voisins.geojson
Lancer :  python outils/fabriquer_masque.py
"""
import json
import sys
import urllib.request
from pathlib import Path

URL = ("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/"
       "geojson/ne_10m_admin_0_countries.geojson")
SORTIE = Path(__file__).resolve().parent.parent / "site" / "data" / "masque-voisins.geojson"

# Zone autour du Japon : on ne garde que les pays qui touchent ce rectangle.
OUEST, SUD, EST, NORD = 95.0, 0.0, 180.0, 78.0


def dans_zone(anneau):
    return any(OUEST <= x <= EST and SUD <= y <= NORD for x, y in anneau)


def est_kouriles(anneau):
    # Les îles Kouriles (dont les « Territoires du Nord ») restent visibles.
    xs = [p[0] for p in anneau]
    ys = [p[1] for p in anneau]
    return min(xs) > 145.0 and max(ys) < 51.5 and min(ys) > 43.0


TOLERANCE = 0.01  # degrés (~1 km) : largement assez précis pour des pays qu'on cache


def simplifier(points, tol=TOLERANCE):
    """Douglas-Peucker : enlève les points inutiles d'une ligne."""
    if len(points) < 3:
        return points
    (x1, y1), (x2, y2) = points[0], points[-1]
    dx, dy = x2 - x1, y2 - y1
    longueur = (dx * dx + dy * dy) ** 0.5 or 1e-12
    idx, dmax = 0, 0.0
    for i in range(1, len(points) - 1):
        px, py = points[i]
        d = abs(dy * px - dx * py + x2 * y1 - y2 * x1) / longueur
        if d > dmax:
            idx, dmax = i, d
    if dmax <= tol:
        return [points[0], points[-1]]
    return simplifier(points[: idx + 1], tol)[:-1] + simplifier(points[idx:], tol)


def dedoublonner(points):
    sortie = []
    for x, y in points:
        p = [round(x, 3), round(y, 3)]
        if not sortie or sortie[-1] != p:
            sortie.append(p)
    if sortie[0] != sortie[-1]:
        sortie.append(sortie[0])
    return sortie


def arrondir(anneau):
    moitie = len(anneau) // 2
    simple = dedoublonner(simplifier(anneau[: moitie + 1])[:-1] + simplifier(anneau[moitie:]))
    # Les toutes petites îles disparaîtraient une fois simplifiées : on les garde telles quelles.
    return simple if len(simple) >= 4 else dedoublonner(anneau)


def main():
    sys.setrecursionlimit(100000)
    with urllib.request.urlopen(URL, timeout=120) as r:
        monde = json.load(r)
    polygones = []
    for f in monde["features"]:
        props = f["properties"]
        if props.get("ADM0_A3") == "JPN":
            continue
        geom = f["geometry"]
        parts = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
        for poly in parts:
            exterieur = poly[0]
            if not dans_zone(exterieur):
                continue
            if props.get("ADM0_A3") == "RUS" and est_kouriles(exterieur):
                continue
            anneaux = [arrondir(anneau) for anneau in poly]
            if len(anneaux[0]) >= 4:
                polygones.append([a for a in anneaux if len(a) >= 4])
    geojson = {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "properties": {},
            "geometry": {"type": "MultiPolygon", "coordinates": polygones},
        }],
    }
    SORTIE.parent.mkdir(parents=True, exist_ok=True)
    SORTIE.write_text(json.dumps(geojson, separators=(",", ":")), encoding="utf-8")
    print(f"{len(polygones)} morceaux de terre masqués -> {SORTIE} ({SORTIE.stat().st_size // 1024} Ko)")


if __name__ == "__main__":
    main()
