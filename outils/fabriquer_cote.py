"""Fabrique le trait de côte du Japon, pour le style « vieille carte ».

La carte s'en sert pour trois choses, visibles quand on voit tout le Japon :
l'ombre que les îles projettent sur la mer, les fines lignes d'eau le long des
côtes (comme sur les cartes gravées anciennes) et le trait d'encre de la côte.

Source : Natural Earth 1:10m (domaine public), le même fichier que le masque des voisins.
Résultat : site/data/cote-japon.geojson
Lancer :  python outils/fabriquer_cote.py
"""
import json
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))  # pour trouver fabriquer_masque.py d'où qu'on lance
from fabriquer_masque import URL, dedoublonner, est_kouriles, simplifier  # noqa: E402

SORTIE = Path(__file__).resolve().parent.parent / "site" / "data" / "cote-japon.geojson"
TOLERANCE = 0.004  # degrés (~400 m) : le trait ne se voit que de loin, il disparaît quand on zoome


def trait(anneau):
    moitie = len(anneau) // 2
    simple = dedoublonner(simplifier(anneau[: moitie + 1], TOLERANCE)[:-1] + simplifier(anneau[moitie:], TOLERANCE))
    return simple if len(simple) >= 4 else dedoublonner(anneau)


def main():
    sys.setrecursionlimit(100000)
    with urllib.request.urlopen(URL, timeout=180) as r:
        monde = json.load(r)
    lignes = []
    for f in monde["features"]:
        pays = f["properties"].get("ADM0_A3")
        if pays not in ("JPN", "RUS"):
            continue
        geom = f["geometry"]
        parts = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
        for poly in parts:
            # Les Kouriles restent visibles sur la carte (le masque ne les cache pas) : on trace aussi leur côte.
            if pays == "RUS" and not est_kouriles(poly[0]):
                continue
            for anneau in poly:
                ligne = trait(anneau)
                if len(ligne) >= 4:
                    lignes.append(ligne)
    geojson = {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "properties": {},
            "geometry": {"type": "MultiLineString", "coordinates": lignes},
        }],
    }
    SORTIE.write_text(json.dumps(geojson, separators=(",", ":")), encoding="utf-8")
    print(f"{len(lignes)} côtes -> {SORTIE} ({SORTIE.stat().st_size // 1024} Ko)")


if __name__ == "__main__":
    main()
