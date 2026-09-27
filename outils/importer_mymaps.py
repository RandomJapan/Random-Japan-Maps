"""Télécharge la Google My Maps publique et en extrait tous les lieux.

Résultat : outils/mymaps_lieux.json (une entrée par lieu).
Lancer :  python outils/importer_mymaps.py
"""
import html
import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

MAP_ID = "17WFlUi6TPkxPPQiipRaF0lG4bKcM3VQ"
KML_URL = f"https://www.google.com/maps/d/kml?mid={MAP_ID}&forcekml=1"
SORTIE = Path(__file__).with_name("mymaps_lieux.json")
NS = {"k": "http://www.opengis.net/kml/2.2"}

TIKTOK_RE = re.compile(r"https?://(?:www\.)?tiktok\.com/[^\s<\"']+")


def texte_propre(description_html: str) -> str:
    """Enlève les balises HTML, la photo et la ligne « Video of place on Tik Tok »."""
    t = re.sub(r"<img[^>]*>", "", description_html)
    t = re.sub(r"<br\s*/?>", "\n", t)
    t = re.sub(r"<[^>]+>", "", t)
    t = html.unescape(t)
    t = TIKTOK_RE.sub("", t)
    t = re.sub(r"Video of place on Tik ?Tok\s*:?", "", t, flags=re.I)
    lignes = [l.strip() for l in t.splitlines() if l.strip()]
    return " ".join(lignes)


def main() -> None:
    with urllib.request.urlopen(KML_URL, timeout=60) as r:
        kml = r.read()
    racine = ET.fromstring(kml)
    lieux = []
    for dossier in racine.iter("{http://www.opengis.net/kml/2.2}Folder"):
        calque = dossier.findtext("k:name", default="", namespaces=NS).strip()
        for pm in dossier.findall("k:Placemark", NS):
            nom = pm.findtext("k:name", default="", namespaces=NS).strip()
            desc = pm.findtext("k:description", default="", namespaces=NS) or ""
            coords = pm.findtext(".//k:Point/k:coordinates", default="", namespaces=NS).strip()
            if not coords:
                continue
            lng, lat = [float(x) for x in coords.split(",")[:2]]
            medias = ""
            for d in pm.findall(".//k:Data", NS):
                if d.get("name") == "gx_media_links":
                    medias = (d.findtext("k:value", default="", namespaces=NS) or "").strip()
            photo = medias.split()[0] if medias else ""
            tiktoks = TIKTOK_RE.findall(desc)
            lieux.append({
                "nom": nom,
                "categorie": calque,
                "lat": round(lat, 6),
                "lng": round(lng, 6),
                "tiktok": tiktoks[0].rstrip(".,)") if tiktoks else "",
                "photo": photo,
                "description": texte_propre(desc),
                "style": pm.findtext("k:styleUrl", default="", namespaces=NS),
            })
    SORTIE.write_text(json.dumps(lieux, ensure_ascii=False, indent=2), encoding="utf-8")
    par_cat = {}
    for l in lieux:
        par_cat[l["categorie"]] = par_cat.get(l["categorie"], 0) + 1
    print(f"{len(lieux)} lieux -> {SORTIE}")
    for c, n in par_cat.items():
        print(f"  {c}: {n}")
    sans_tiktok = [l["nom"] for l in lieux if not l["tiktok"]]
    if sans_tiktok:
        print("Sans lien TikTok :", sans_tiktok)


if __name__ == "__main__":
    main()
