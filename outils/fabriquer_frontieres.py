"""Fabrique les frontières des régions et des préfectures du Japon, tracées sur la carte quand on zoome.

Les contours viennent d'OpenStreetMap (licence ODbL, déjà citée sur la carte), par l'API Overpass, comme les
lacs et les rivières : ils tombent juste sur le relief et sur les rivières, même tout près.
- On prend les 47 préfectures (relations admin_level=4, ISO3166-2 = JP-xx).
- Une frontière terrestre = un chemin commun à deux préfectures et qui n'est pas en mer (maritime=yes).
- Les bouts sont recollés par paire de préfectures, puis simplifiés (~60 m).
- Une frontière entre deux grandes régions (voir site/regions.js) est marquée n = "r", les autres n = "p".
  Pour les frontières de région, g et d disent quelle région est à gauche et à droite du trait (sens du tracé) :
  la carte peint un liseré d'aquarelle de la couleur de chaque région, de son côté.

Résultat : site/data/frontieres-japon.geojson
Affiche aussi, pour chaque préfecture, le point le plus « au cœur » de son contour : c'est là qu'on écrit
son nom (à recopier dans site/noms-regions.js si on refait les contours).
Lancer :  python outils/fabriquer_frontieres.py      (demande Pillow, comme fabriquer_eaux.py)
"""
import collections
import json
import math
from pathlib import Path

from fabriquer_eaux import arrondir, overpass, simplifier
from fabriquer_prefectures import dans_anneau, trouver

RACINE = Path(__file__).resolve().parent.parent
SORTIE = RACINE / "site" / "data" / "frontieres-japon.geojson"
PREFECTURES = RACINE / "site" / "data" / "prefectures.geojson"  # contours Natural Earth (pour savoir de quel côté est qui)
TOLERANCE = 0.0006  # degrés (~60 m)
DECALAGE = 0.012    # degrés (~1 km) : on regarde de chaque côté du trait pour savoir quelle préfecture s'y trouve

# Les mêmes grandes régions que site/regions.js
REGIONS = {
    "hokkaido": [1], "tohoku": [2, 3, 4, 5, 6, 7], "kanto": [8, 9, 10, 11, 12, 13, 14],
    "chubu": [15, 16, 17, 18, 19, 20, 21, 22, 23], "kansai": [24, 25, 26, 27, 28, 29, 30],
    "chugoku": [31, 32, 33, 34, 35], "shikoku": [36, 37, 38, 39], "kyushu": [40, 41, 42, 43, 44, 45, 46, 47],
}
REGION = {code: cle for cle, codes in REGIONS.items() for code in codes}


def chainer(morceaux):
    """Recolle des bouts de ligne qui se touchent par leurs extrémités en lignes plus longues."""
    restants = [list(m) for m in morceaux if len(m) >= 2]
    lignes = []
    while restants:
        ligne = restants.pop(0)
        change = True
        while change:
            change = False
            for i, m in enumerate(restants):
                if m[0] == ligne[-1]:
                    ligne += m[1:]
                elif m[-1] == ligne[-1]:
                    ligne += m[::-1][1:]
                elif m[-1] == ligne[0]:
                    ligne = m + ligne[1:]
                elif m[0] == ligne[0]:
                    ligne = m[::-1] + ligne[1:]
                else:
                    continue
                restants.pop(i)
                change = True
                break
        lignes.append(ligne)
    return lignes


def cote_gauche(ligne, a, b, features):
    """Quelle préfecture (a ou b) est à gauche du trait ? On vote en regardant ~1 km de chaque côté."""
    voix = collections.Counter()
    pas = max(1, len(ligne) // 25)
    for i in range(0, len(ligne) - 1, pas):
        (x0, y0), (x1, y1) = ligne[i], ligne[i + 1]
        k = math.cos(math.radians(y0))
        dx, dy = (x1 - x0) * k, y1 - y0
        n = math.hypot(dx, dy)
        if n == 0:
            continue
        mx, my = (x0 + x1) / 2, (y0 + y1) / 2
        gauche, _ = trouver(mx - dy / n * DECALAGE / k, my + dx / n * DECALAGE, features)
        droite, _ = trouver(mx + dy / n * DECALAGE / k, my - dx / n * DECALAGE, features)
        if gauche == a or droite == b:
            voix[a] += 1
        if gauche == b or droite == a:
            voix[b] += 1
    return a if voix[a] >= voix[b] else b


def distance_bord(x, y, anneaux, k):
    d = float("inf")
    for anneau in anneaux:
        for (ax, ay), (bx, by) in zip(anneau, anneau[1:]):
            ax, bx, px = ax * k, bx * k, x * k
            ex, ey = bx - ax, by - ay
            t = 0.0 if ex == ey == 0 else max(0.0, min(1.0, ((px - ax) * ex + (y - ay) * ey) / (ex * ex + ey * ey)))
            d = min(d, math.hypot(ax + t * ex - px, ay + t * ey - y))
    return d


def coeur(feature):
    """Le point le plus éloigné des bords dans la plus grande île de la préfecture (où écrire son nom)."""
    polys = feature["geometry"]["coordinates"]
    poly = max(polys, key=lambda p: (max(x for x, _ in p[0]) - min(x for x, _ in p[0])) * (max(y for _, y in p[0]) - min(y for _, y in p[0])))
    xs, ys = [x for x, _ in poly[0]], [y for _, y in poly[0]]
    k = math.cos(math.radians((min(ys) + max(ys)) / 2))
    meilleur, dmax = (sum(xs) / len(xs), sum(ys) / len(ys)), -1
    x0, x1, y0, y1, pas = min(xs), max(xs), min(ys), max(ys), max(max(xs) - min(xs), max(ys) - min(ys)) / 40
    for _ in range(3):  # grille grossière, puis de plus en plus fine autour du meilleur point
        y = y0
        while y <= y1:
            x = x0
            while x <= x1:
                if dans_anneau(x, y, poly[0]) and not any(dans_anneau(x, y, t) for t in poly[1:]):
                    d = distance_bord(x, y, poly, k)
                    if d > dmax:
                        meilleur, dmax = (x, y), d
                x += pas
            y += pas
        x0, x1, y0, y1 = meilleur[0] - pas, meilleur[0] + pas, meilleur[1] - pas, meilleur[1] + pas
        pas /= 5
    return [round(meilleur[0], 2), round(meilleur[1], 2)]


def main():
    features = json.loads(PREFECTURES.read_text(encoding="utf-8"))["features"]
    requete = '[out:json][timeout:180];relation["boundary"="administrative"]["admin_level"="4"]["ISO3166-2"~"^JP-"];'
    relations = overpass(requete + "out body;", "frontieres-relations")["elements"]
    tags = {e["id"]: e.get("tags", {}) for e in overpass(requete + "way(r);out tags;", "frontieres-chemins")["elements"]}

    # Chemins communs à deux préfectures, hors mer
    qui = collections.defaultdict(set)
    for rel in relations:
        code = int(rel["tags"]["ISO3166-2"][3:])
        for m in rel["members"]:
            if m["type"] == "way":
                qui[m["ref"]].add(code)
    communs = sorted(i for i, codes in qui.items() if len(codes) == 2 and tags.get(i, {}).get("maritime") != "yes")
    print(f"{len(communs)} chemins de frontière terrestre")

    paires = collections.defaultdict(list)
    for i in range(0, len(communs), 200):
        paquet = communs[i:i + 200]
        rep = overpass(f"[out:json][timeout:180];way(id:{','.join(map(str, paquet))});out geom;", f"frontieres-geom-{paquet[0]}")
        for w in rep["elements"]:
            paires[tuple(sorted(qui[w["id"]]))].append([(p["lon"], p["lat"]) for p in w["geometry"]])

    traits = []
    for (a, b), morceaux in sorted(paires.items()):
        region = REGION[a] != REGION[b]
        for ligne in chainer(morceaux):
            ligne = simplifier(ligne, TOLERANCE)
            if len(ligne) < 2:
                continue
            props = {"n": "r" if region else "p", "a": a, "b": b}
            if region:
                if cote_gauche(ligne, a, b, features) != a:
                    ligne = ligne[::-1]
                props.update(g=REGION[a], d=REGION[b])
            traits.append({"type": "Feature", "properties": props, "geometry": {"type": "LineString", "coordinates": arrondir(ligne)}})

    SORTIE.write_text(json.dumps({"type": "FeatureCollection", "features": traits}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    points = sum(len(f["geometry"]["coordinates"]) for f in traits)
    print(f"{len(traits)} traits ({sum(f['properties']['n'] == 'r' for f in traits)} entre régions), {points} points -> {SORTIE} ({SORTIE.stat().st_size // 1024} Ko)")

    print("\nOù écrire le nom de chaque préfecture :")
    for f in sorted(features, key=lambda f: f["properties"]["code"]):
        print(f"  {f['properties']['code']}: {coeur(f)},")


if __name__ == "__main__":
    main()
