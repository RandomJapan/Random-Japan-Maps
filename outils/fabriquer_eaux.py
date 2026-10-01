"""Fabrique les lacs et les rivières du Japon, peints de la couleur de la mer sur la carte (style « vieille carte »).

Natural Earth n'a presque rien pour le Japon (le lac Biwa et trois rivières) : on prend donc les données
d'OpenStreetMap (licence ODbL : la carte affiche « © OpenStreetMap »), par l'API Overpass, sans compte ni clé.
- Rivières : les grandes rivières du Japon (relations « waterway=river » de plus de RIVIERE_GARDE km d'étendue).
- Lacs : les lacs, lagunes et grands barrages connus (avec une fiche Wikidata) de plus de LAC_MIN km d'étendue.
Les tracés sont simplifiés (quelques dizaines de mètres) pour garder un fichier léger.

Résultat : site/data/eaux-japon.geojson  (propriétés : t = "lac" ou "riviere", km = étendue, nom)
Lancer :  python outils/fabriquer_eaux.py      (demande Pillow ; les réponses d'Overpass sont gardées dans
          le dossier temporaire, pour relancer sans tout retélécharger)
"""
import json
import math
import tempfile
import time
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image

RACINE = Path(__file__).resolve().parent.parent
SORTIE = RACINE / "site" / "data" / "eaux-japon.geojson"
DISTANCES = RACINE / "site" / "data" / "distance-cote.png"  # fabriqué par fabriquer_houle.py : 0 = terre du Japon
BORNES = (121.5, 23.0, 157.5, 51.5)  # les mêmes que fabriquer_houle.py
CACHE = Path(tempfile.gettempdir()) / "carte-japon-eaux"
SERVEUR = "https://overpass-api.de/api/interpreter"
# Le Japon découpé en morceaux : une seule requête pour tout le pays est trop lourde pour Overpass
MORCEAUX = [(24, 122, 31, 132), (30, 129, 36, 136), (33, 135, 38, 142), (37, 138, 42, 143), (41, 139, 46, 146)]
RIVIERE_MIN = 40  # km (diagonale du rectangle qui l'entoure) : rivières téléchargées (garder 40, pour le cache)
RIVIERE_GARDE = 50  # km : rivières gardées sur la carte (plus bas, le fichier devient lourd pour les téléphones)
LAC_MIN = 3.5     # km
TOLERANCE_RIVIERE = 0.0006  # degrés (~60 m)
TOLERANCE_LAC = 0.0004
DECIMALES = 4  # ~10 m


def overpass(requete, nom):
    """Envoie une requête à Overpass (avec plusieurs essais : le serveur est souvent chargé) et garde la réponse."""
    CACHE.mkdir(exist_ok=True)
    fichier = CACHE / f"{nom}.json"
    if fichier.exists():
        return json.loads(fichier.read_text(encoding="utf-8"))
    donnees = urllib.parse.urlencode({"data": requete}).encode()
    for essai in range(8):
        try:
            req = urllib.request.Request(SERVEUR, data=donnees, headers={"User-Agent": "RandomJapanMap/1.0 (fabriquer_eaux.py)"})
            with urllib.request.urlopen(req, timeout=200) as r:
                texte = r.read().decode("utf-8")
            reponse = json.loads(texte)
            fichier.write_text(texte, encoding="utf-8")
            return reponse
        except Exception as e:  # 504, 429, coupure… on attend un peu et on recommence
            print(f"  {nom} : essai {essai + 1} raté ({e}), on attend…")
            time.sleep(5 + 5 * essai)
    raise RuntimeError(f"Overpass ne répond pas pour {nom}")


def etendue(b):
    dx = (b["maxlon"] - b["minlon"]) * 111 * math.cos(math.radians((b["minlat"] + b["maxlat"]) / 2))
    return math.hypot(dx, (b["maxlat"] - b["minlat"]) * 111)


def mercator(lon, lat):
    y = math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))
    return (lon + 180) / 360, (1 - y / math.pi) / 2


def sur_le_japon():
    """Renvoie un test : ce point est-il sur la terre du Japon ? (sinon c'est la Corée, la Chine, la Russie…)"""
    image = Image.open(DISTANCES)
    w, h = image.size
    x0, y0 = mercator(BORNES[0], BORNES[3])
    x1, y1 = mercator(BORNES[2], BORNES[1])

    def test(lon, lat):
        x, y = mercator(lon, lat)
        px, py = int((x - x0) / (x1 - x0) * w), int((y - y0) / (y1 - y0) * h)
        if not (0 <= px < w and 0 <= py < h):
            return False
        # un peu de marge : un lac côtier ou une embouchure touche la mer
        return min(image.getpixel((min(w - 1, max(0, px + dx)), min(h - 1, max(0, py + dy))))
                   for dx in (-2, 0, 2) for dy in (-2, 0, 2)) == 0
    return test


def simplifier(points, tol):
    """Douglas-Peucker (sans récursion)."""
    if len(points) < 3:
        return points
    garder = [False] * len(points)
    garder[0] = garder[-1] = True
    pile = [(0, len(points) - 1)]
    while pile:
        a, b = pile.pop()
        (ax, ay), (bx, by) = points[a], points[b]
        dx, dy = bx - ax, by - ay
        n = math.hypot(dx, dy) or 1e-12
        loin, ind = 0, None
        for i in range(a + 1, b):
            px, py = points[i]
            d = abs(dy * (px - ax) - dx * (py - ay)) / n if (dx or dy) else math.hypot(px - ax, py - ay)
            if d > loin:
                loin, ind = d, i
        if ind is not None and loin > tol:
            garder[ind] = True
            pile += [(a, ind), (ind, b)]
    return [p for p, g in zip(points, garder) if g]


def arrondir(points):
    return [[round(x, DECIMALES), round(y, DECIMALES)] for x, y in points]


def assembler(morceaux):
    """Recolle des bouts de contour (les « ways » d'un multipolygone) en anneaux fermés."""
    restants = [list(m) for m in morceaux if len(m) >= 2]
    anneaux = []
    while restants:
        anneau = restants.pop(0)
        change = True
        while anneau[0] != anneau[-1] and change:
            change = False
            for i, m in enumerate(restants):
                if m[0] == anneau[-1]:
                    anneau += m[1:]
                elif m[-1] == anneau[-1]:
                    anneau += m[::-1][1:]
                elif m[-1] == anneau[0]:
                    anneau = m + anneau[1:]
                elif m[0] == anneau[0]:
                    anneau = m[::-1] + anneau[1:]
                else:
                    continue
                restants.pop(i)
                change = True
                break
        if anneau[0] == anneau[-1] and len(anneau) >= 4:
            anneaux.append(anneau)
    return anneaux


def geometries(type_osm, ids, nom):
    """Géométrie complète (out geom) d'une liste d'objets, par petits paquets (les gros paquets échouent)."""
    elements = []
    for i in range(0, len(ids), 8):
        paquet = ids[i:i + 8]
        requete = f"[out:json][timeout:120];{type_osm}(id:{','.join(map(str, paquet))});out geom;"
        elements += overpass(requete, f"{nom}-{paquet[0]}")["elements"]
    return elements


def main():
    japon = sur_le_japon()

    # ---- Rivières
    rivieres = {}
    for b in MORCEAUX:
        bbox = ",".join(map(str, b))
        rep = overpass(f'[out:json][timeout:180][bbox:{bbox}];relation["type"="waterway"]["waterway"="river"];out tags bb;',
                       f"rivieres-{bbox}")
        for e in rep["elements"]:
            if "bounds" not in e:
                continue
            km, nom = etendue(e["bounds"]), e["tags"].get("name", "")
            centre = ((e["bounds"]["minlon"] + e["bounds"]["maxlon"]) / 2, (e["bounds"]["minlat"] + e["bounds"]["maxlat"]) / 2)
            if km >= RIVIERE_MIN and "用水" not in nom and japon(*centre):
                rivieres[e["id"]] = (km, nom)
    print(f"{len(rivieres)} rivières")
    traits = []
    for rel in geometries("relation", sorted(rivieres), "rivieres-geom"):
        km, nom = rivieres[rel["id"]]
        if km < RIVIERE_GARDE:
            continue
        lignes = []
        for m in rel.get("members", []):
            if m["type"] != "way" or "geometry" not in m or m.get("role") not in ("", "main_stream"):
                continue
            ligne = simplifier([(p["lon"], p["lat"]) for p in m["geometry"]], TOLERANCE_RIVIERE)
            if len(ligne) >= 2:
                lignes.append(arrondir(ligne))
        if lignes:
            traits.append({"type": "Feature", "properties": {"t": "riviere", "km": round(km), "nom": nom},
                           "geometry": {"type": "MultiLineString", "coordinates": lignes}})

    # ---- Lacs
    lacs = {}
    for b in MORCEAUX:
        bbox = ",".join(map(str, b))
        rep = overpass(f'[out:json][timeout:180][bbox:{bbox}];wr["natural"="water"]["water"~"^(lake|reservoir|lagoon)$"]["wikidata"];out tags bb;',
                       f"lacs-{bbox}")
        for e in rep["elements"]:
            if "bounds" not in e:
                continue
            km = etendue(e["bounds"])
            centre = ((e["bounds"]["minlon"] + e["bounds"]["maxlon"]) / 2, (e["bounds"]["minlat"] + e["bounds"]["maxlat"]) / 2)
            if km >= LAC_MIN and japon(*centre):
                lacs[(e["type"], e["id"])] = (km, e["tags"].get("name", ""))
    print(f"{len(lacs)} lacs")
    surfaces = []
    for type_osm in ("way", "relation"):
        ids = sorted(i for t, i in lacs if t == type_osm)
        for el in geometries(type_osm, ids, f"lacs-geom-{type_osm}"):
            km, nom = lacs[(type_osm, el["id"])]
            if type_osm == "way":
                exterieurs, interieurs = [[(p["lon"], p["lat"]) for p in el["geometry"]]], []
            else:
                bouts = lambda roles: [[(p["lon"], p["lat"]) for p in m["geometry"]] for m in el.get("members", [])
                                       if m["type"] == "way" and "geometry" in m and m.get("role", "") in roles]
                exterieurs, interieurs = assembler(bouts(("outer", ""))), assembler(bouts(("inner",)))
            polygones = []
            for ext in exterieurs:
                if len(ext) < 4 or ext[0] != ext[-1]:
                    continue
                anneau = simplifier(ext, TOLERANCE_LAC)
                if len(anneau) < 4:
                    continue
                trous = [arrondir(simplifier(t, TOLERANCE_LAC)) for t in interieurs
                         if len(t) >= 4 and min(x for x, _ in ext) <= t[0][0] <= max(x for x, _ in ext)
                         and min(y for _, y in ext) <= t[0][1] <= max(y for _, y in ext)]
                polygones.append([arrondir(anneau)] + [t for t in trous if len(t) >= 4])
            if polygones:
                surfaces.append({"type": "Feature", "properties": {"t": "lac", "km": round(km, 1), "nom": nom},
                                 "geometry": {"type": "MultiPolygon", "coordinates": polygones}})

    geojson = {"type": "FeatureCollection", "features": surfaces + traits}
    SORTIE.write_text(json.dumps(geojson, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    points = sum(len(l) for f in traits for l in f["geometry"]["coordinates"])
    print(f"{len(surfaces)} lacs et {len(traits)} rivières ({points} points de rivière) -> {SORTIE} ({SORTIE.stat().st_size // 1024} Ko)")


if __name__ == "__main__":
    main()
