"""Fabrique le contour des grandes villes du Japon, dessiné sur la carte quand on clique sur une ville.

Les contours viennent d'OpenStreetMap (licence ODbL, déjà citée sur la carte), par l'API Overpass, comme les
frontières des préfectures (même cache et mêmes nouveaux essais, voir fabriquer_eaux.py) :
- une ville = la relation de sa commune (admin_level 7, « 福岡市 ») ;
- Tokyo = les 23 arrondissements spéciaux réunis.
Au Japon, une commune du bord de mer s'étend loin en mer dans OSM (Fukuoka : 1 725 km² au lieu de 343). On la
découpe donc avec le trait de côte d'OSM (natural=coastline) : le contour et la côte découpent la commune en
morceaux, et on garde ceux qui sont à terre d'après le relief de la carte (Mapterhorn : la mer y est à 0 m).
Puis simplification (~25 m) et oubli des îlots minuscules.
Le pin de la ville se pose sur l'hôtel de ville (le membre admin_centre de la relation), sinon au cœur du contour.

Résultat : site/data/villes.geojson (un multipolygone par ville, propriétés id, ja, centre)
Lancer :  python outils/fabriquer_villes.py      (demande Pillow et shapely : pip install shapely)
"""
import io
import json
import math
import tempfile
import urllib.error
import urllib.request
from pathlib import Path

from PIL import Image
from shapely import make_valid, polygonize, unary_union
from shapely.geometry import LineString, MultiPolygon, Point, Polygon, mapping

from fabriquer_eaux import overpass

RACINE = Path(__file__).resolve().parent.parent
SORTIE = RACINE / "site" / "data" / "villes.geojson"
CACHE = Path(tempfile.gettempdir()) / "carte-japon-villes"
TUILE = "https://tiles.mapterhorn.com/{z}/{x}/{y}.webp"
TOLERANCE = 0.00025  # degrés (~25 m)
ILOT_MIN = 0.15      # km² : les îlots plus petits ne sont pas dessinés
TERRE = 0.6          # m : au-dessus, c'est la terre (comme la palette de la carte)

# id (comme les lieux : le nom anglais en minuscules), nom de la commune dans OSM (None : Tokyo, les 23 arrondissements)
VILLES = [
    ("sapporo", "札幌市"), ("hakodate", "函館市"), ("sendai", "仙台市"), ("tokyo", None), ("yokohama", "横浜市"),
    ("nagoya", "名古屋市"), ("kanazawa", "金沢市"), ("kyoto", "京都市"), ("osaka", "大阪市"), ("kobe", "神戸市"),
    ("nara", "奈良市"), ("okayama", "岡山市"), ("hiroshima", "広島市"), ("takamatsu", "高松市"), ("matsuyama", "松山市"),
    ("fukuoka", "福岡市"), ("nagasaki", "長崎市"), ("kumamoto", "熊本市"), ("kagoshima", "鹿児島市"), ("naha", "那覇市"),
]
JAPON = 'area["ISO3166-1"="JP"]["admin_level"="2"]->.jp;'
CENTRE_TOKYO = [139.7671, 35.6812]  # la gare de Tokyo


def km2(geom):
    """Aire approchée en km² (à l'échelle de la latitude du milieu)."""
    lat = geom.centroid.y
    return geom.area * 111.32 * math.cos(math.radians(lat)) * 110.57


_tuiles = {}


def altitude(lng, lat, z=12):
    """Altitude du relief de la carte en ce point (tuile Mapterhorn terrarium, gardée dans le dossier temporaire)."""
    n = 2 ** z
    fx = (lng + 180) / 360 * n
    fy = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n
    x, y = int(fx), int(fy)
    if (x, y) not in _tuiles:
        CACHE.mkdir(exist_ok=True)
        f = CACHE / f"{z}-{x}-{y}.webp"
        if not f.exists():
            req = urllib.request.Request(TUILE.format(z=z, x=x, y=y), headers={"User-Agent": "RandomJapanMap/1.0 (fabriquer_villes.py)"})
            try:
                with urllib.request.urlopen(req, timeout=60) as r:
                    f.write_bytes(r.read())
            except urllib.error.HTTPError as e:
                if e.code != 404:
                    raise
                f.write_bytes(b"")  # pleine mer : pas de tuile
        donnees = f.read_bytes()
        _tuiles[(x, y)] = Image.open(io.BytesIO(donnees)).convert("RGB") if donnees else None
    im = _tuiles[(x, y)]
    if im is None:
        return 0.0
    r, g, b = im.getpixel((min(im.width - 1, int((fx - x) * im.width)), min(im.height - 1, int((fy - y) * im.height))))
    return r * 256 + g + b / 256 - 32768


def a_terre(morceau):
    """Le morceau est-il à terre ? On vote sur quelques points dedans."""
    points = [morceau.representative_point()]
    b = morceau.bounds
    for i in range(1, 4):
        for j in range(1, 4):
            p = Point(b[0] + (b[2] - b[0]) * i / 4, b[1] + (b[3] - b[1]) * j / 4)
            if morceau.contains(p):
                points.append(p)
    terre = sum(1 for p in points if altitude(p.x, p.y) >= TERRE)
    return terre * 2 > len(points)


def commune(rel_ou_rels):
    """Le polygone (brut) d'une commune ou d'un groupe de communes, à partir de leurs chemins."""
    lignes = [LineString([(p["lon"], p["lat"]) for p in m["geometry"]])
              for r in rel_ou_rels for m in r["members"] if m["type"] == "way" and len(m.get("geometry", [])) >= 2]
    return unary_union([make_valid(p) for p in polygonize([unary_union(lignes)]).geoms]), lignes


def decouper(ville, id_):
    """Garde la partie à terre de la commune, découpée par le trait de côte d'OSM."""
    o, s, e, n = ville.bounds
    cote = overpass(f"[out:json][timeout:180];way[natural=coastline]({s - 0.02},{o - 0.02},{n + 0.02},{e + 0.02});out geom;", f"ville-cote-{id_}")["elements"]
    if not cote:
        return ville
    lignes = [ville.boundary] + [LineString([(p["lon"], p["lat"]) for p in w["geometry"]]) for w in cote if len(w["geometry"]) >= 2]
    gardes = [m for m in polygonize([unary_union(lignes)]).geoms
              if ville.contains(m.representative_point()) and km2(m) >= 0.005 and a_terre(m)]
    return unary_union(gardes)


def nettoyer(geom):
    """Simplifie et oublie les îlots minuscules ; renvoie un MultiPolygon."""
    geom = make_valid(geom.simplify(TOLERANCE, preserve_topology=True))
    morceaux = [g for g in getattr(geom, "geoms", [geom]) if isinstance(g, Polygon) and km2(g) >= ILOT_MIN]
    return MultiPolygon(morceaux)


def arrondir(coords):
    if isinstance(coords, (list, tuple)) and coords and isinstance(coords[0], float):
        return [round(coords[0], 4), round(coords[1], 4)]
    return [arrondir(c) for c in coords]


def main():
    villes = []
    for id_, nom in VILLES:
        if nom:
            rels = overpass(f'[out:json][timeout:180];{JAPON}relation["boundary"="administrative"]["admin_level"="7"]["name"="{nom}"](area.jp);out geom;', f"ville-{id_}")["elements"]
            if len(rels) != 1:
                raise RuntimeError(f"{nom} : {len(rels)} relations trouvées")
            hdv = [m for m in rels[0]["members"] if m["type"] == "node" and m.get("role") in ("admin_centre", "label")]
            centre = [round(hdv[0]["lon"], 4), round(hdv[0]["lat"], 4)] if hdv else None
            ja = rels[0]["tags"].get("name")
        else:  # Tokyo : les 23 arrondissements spéciaux
            rels = overpass(f'[out:json][timeout:180];area["name"="東京都"]["admin_level"="4"]->.t;relation["boundary"="administrative"]["admin_level"="7"]["name"~"区$"](area.t);out geom;', "ville-tokyo")["elements"]
            if len(rels) != 23:
                raise RuntimeError(f"Tokyo : {len(rels)} arrondissements au lieu de 23")
            centre, ja = CENTRE_TOKYO, "東京"
        brut, _ = commune(rels)
        terre = nettoyer(decouper(brut, id_))
        if terre.is_empty:
            raise RuntimeError(f"{id_} : rien à terre")
        if not centre:
            centre = [round(c, 4) for c in max(terre.geoms, key=km2).representative_point().coords[0]]
        points = sum(len(p.exterior.coords) + sum(len(t.coords) for t in p.interiors) for p in terre.geoms)
        print(f"{id_:10} {ja:6} {len(terre.geoms):3} morceaux {points:5} points  {km2(brut):6.0f} km² dans OSM, {km2(terre):5.0f} à terre  centre {centre}")
        villes.append({"type": "Feature", "properties": {"id": id_, "ja": ja, "centre": centre},
                       "geometry": {"type": "MultiPolygon", "coordinates": arrondir(mapping(terre)["coordinates"])}})

    SORTIE.write_text(json.dumps({"type": "FeatureCollection", "features": villes}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{len(villes)} villes -> {SORTIE} ({SORTIE.stat().st_size // 1024} Ko)")


if __name__ == "__main__":
    main()
