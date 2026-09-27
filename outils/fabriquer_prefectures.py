"""Fabrique les contours simplifiés des 47 préfectures (pour le « lieu au hasard » par région).

Source : Natural Earth 1:10m, divisions administratives (domaine public).
Résultat : site/data/prefectures.geojson (propriété "code" = numéro officiel JIS, 1 = Hokkaidō … 47 = Okinawa)
Vérification : affiche la préfecture trouvée pour chaque lieu de la copie de secours.
Lancer :  python outils/fabriquer_prefectures.py
"""
import csv
import json
import math
import re
import sys
import urllib.request
from pathlib import Path

from fabriquer_masque import dedoublonner, simplifier

URL = ("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/"
       "geojson/ne_10m_admin_1_states_provinces.geojson")
RACINE = Path(__file__).resolve().parent.parent
SORTIE = RACINE / "site" / "data" / "prefectures.geojson"
LIEUX = RACINE / "site" / "data" / "secours-lieux.csv"
TOLERANCE = 0.004  # degrés (~400 m) : assez fin pour les lieux proches d'une frontière


def prop(props, cle):
    return props.get(cle) or props.get(cle.upper()) or ""


def arrondir(anneau):
    moitie = len(anneau) // 2
    simple = dedoublonner(simplifier(anneau[: moitie + 1], TOLERANCE)[:-1] + simplifier(anneau[moitie:], TOLERANCE))
    return simple if len(simple) >= 4 else dedoublonner(anneau)


# --- même calcul que site/regions.js, pour vérifier ---------------------------------------
def dans_anneau(x, y, anneau):
    dedans = False
    j = len(anneau) - 1
    for i in range(len(anneau)):
        xi, yi = anneau[i]
        xj, yj = anneau[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            dedans = not dedans
        j = i
    return dedans


def distance_segment(x, y, a, b, k):
    """Distance (en degrés de latitude) du point au segment ab ; k = cos(latitude) pour les longitudes."""
    ax, ay, bx, by = a[0] * k, a[1], b[0] * k, b[1]
    px, dx, dy = x * k, bx - ax, by - ay
    t = 0.0 if dx == dy == 0 else max(0.0, min(1.0, ((px - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)))
    return ((ax + t * dx - px) ** 2 + (ay + t * dy - y) ** 2) ** 0.5


def trouver(x, y, features):
    for f in features:
        for poly in f["geometry"]["coordinates"]:
            if dans_anneau(x, y, poly[0]) and not any(dans_anneau(x, y, trou) for trou in poly[1:]):
                return f["properties"]["code"], 0.0
    # Hors de tout contour (bord de mer, petite île) : préfecture dont le bord est le plus proche
    k = math.cos(math.radians(y))
    proche, dmin = None, float("inf")
    for f in features:
        for poly in f["geometry"]["coordinates"]:
            anneau = poly[0]
            for i in range(len(anneau) - 1):
                d = distance_segment(x, y, anneau[i], anneau[i + 1], k)
                if d < dmin:
                    proche, dmin = f["properties"]["code"], d
    return proche, dmin


def verifier(features):
    if not LIEUX.exists():
        return
    lignes = list(csv.DictReader(LIEUX.open(encoding="utf-8")))
    hors, compte = [], {}
    for l in lignes:
        nom, gps = l.get("Nom (EN)", "").strip(), l.get("Coordonnées GPS", "")
        n = re.findall(r"-?\d+(?:\.\d+)?", gps)
        if not nom or len(n) < 2:
            continue
        lat, lng = float(n[0]), float(n[1])
        code, dist = trouver(lng, lat, features)
        compte[code] = compte.get(code, 0) + 1
        if "--liste" in sys.argv:
            print(f"  {code:2} {nom}")
        if dist:
            hors.append(f"  {nom}: préfecture {code} la plus proche, à {dist * 111:.1f} km")
    print(f"{sum(compte.values())} lieux répartis dans {len(compte)} préfectures : {dict(sorted(compte.items()))}")
    print(f"{len(hors)} lieux juste hors des contours (côte, petite île) → préfecture la plus proche :")
    print("\n".join(hors))


def main():
    sys.setrecursionlimit(100000)
    with urllib.request.urlopen(URL, timeout=300) as r:
        monde = json.load(r)
    features = []
    for f in monde["features"]:
        p = f["properties"]
        if prop(p, "adm0_a3") != "JPN":
            continue
        m = re.match(r"JP-(\d\d)$", prop(p, "iso_3166_2"))
        if not m:
            print("ignoré :", prop(p, "name"), prop(p, "iso_3166_2"))
            continue
        geom = f["geometry"]
        parts = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
        polygones = []
        for poly in parts:
            anneaux = [arrondir(a) for a in poly]
            if len(anneaux[0]) >= 4:
                polygones.append([a for a in anneaux if len(a) >= 4])
        features.append({"type": "Feature", "properties": {"code": int(m.group(1))},
                         "geometry": {"type": "MultiPolygon", "coordinates": polygones}})
    features.sort(key=lambda f: f["properties"]["code"])
    codes = [f["properties"]["code"] for f in features]
    if codes != list(range(1, 48)):
        print("ATTENTION, préfectures manquantes ou en double :", codes)
    SORTIE.write_text(json.dumps({"type": "FeatureCollection", "features": features}, separators=(",", ":")),
                      encoding="utf-8")
    print(f"{len(features)} préfectures -> {SORTIE} ({SORTIE.stat().st_size // 1024} Ko)")
    verifier(features)


if __name__ == "__main__":
    main()
