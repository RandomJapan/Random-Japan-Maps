"""Cherche les coordonnées GPS des nouveaux lieux (OpenStreetMap / Nominatim, puis GSI japonais en secours).

Entrée : outils/nouveaux_lieux.json  (liste de {id, recherche: [requêtes...], pref})
Sortie : outils/nouveaux_gps.json     ({id: {lat, lng, source, trouve}})
Lancer :  python outils/geocoder.py
"""
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

ICI = Path(__file__).resolve().parent
UA = {"User-Agent": "RandomJapanPlaceMap/1.0 (carte des lieux TikTok)"}


def nominatim(q):
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(
        {"q": q, "format": "jsonv2", "limit": 1, "countrycodes": "jp", "accept-language": "ja"})
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        res = json.load(r)
    time.sleep(1.1)
    if res:
        return float(res[0]["lat"]), float(res[0]["lon"]), res[0].get("display_name", "")
    return None


def gsi(q):
    url = "https://msearch.gsi.go.jp/address-search/AddressSearch?q=" + urllib.parse.quote(q)
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        res = json.load(r)
    if res:
        lng, lat = res[0]["geometry"]["coordinates"]
        return float(lat), float(lng), res[0]["properties"].get("title", "")
    return None


def main():
    lieux = json.loads((ICI / "nouveaux_lieux.json").read_text(encoding="utf-8"))
    sortie_f = ICI / "nouveaux_gps.json"
    sortie = json.loads(sortie_f.read_text(encoding="utf-8")) if sortie_f.exists() else {}
    for l in lieux:
        if l["id"] in sortie and sortie[l["id"]].get("lat"):
            continue
        trouve = None
        for q in l["recherche"]:
            for fn in (nominatim, gsi):
                try:
                    trouve = fn(q)
                except Exception as e:
                    print("   erreur", fn.__name__, q, e)
                if trouve:
                    trouve = (*trouve, f"{fn.__name__}: {q}")
                    break
            if trouve:
                break
        if trouve:
            lat, lng, nom, src = trouve
            sortie[l["id"]] = {"lat": round(lat, 6), "lng": round(lng, 6), "trouve": nom, "source": src}
            print(f"{l['id']} OK  {lat:.4f}, {lng:.4f}  <- {src} | {nom[:70]}")
        else:
            sortie[l["id"]] = {}
            print(f"{l['id']} ??  rien trouvé pour {l['recherche']}")
        sortie_f.write_text(json.dumps(sortie, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
