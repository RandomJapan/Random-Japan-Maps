"""Télécharge les photos des lieux My Maps dans site/photos/ (Google interdit de les afficher depuis un autre site).

Une photo par lieu, nommée d'après l'id de la vidéo TikTok, en JPEG de 720 px (~150 Ko).
Lancer :  python outils/telecharger_photos.py
"""
import json
import re
import urllib.request
from pathlib import Path

ICI = Path(__file__).resolve().parent
PHOTOS = ICI.parent / "site" / "photos"


def main():
    PHOTOS.mkdir(parents=True, exist_ok=True)
    lieux = json.loads((ICI / "mymaps_lieux.json").read_text(encoding="utf-8"))
    total = 0
    for l in lieux:
        m = re.search(r"video/(\d+)", l["tiktok"])
        if not (m and l["photo"]):
            continue
        cible = PHOTOS / f"{m.group(1)}.jpg"
        if cible.exists():
            continue
        url = re.sub(r"fife=s\d+[^&]*", "fife=s720-rj", l["photo"])
        with urllib.request.urlopen(url, timeout=60) as r:
            cible.write_bytes(r.read())
        total += 1
        print(f"  {l['nom']} -> {cible.name} ({cible.stat().st_size // 1024} Ko)")
    print(f"{total} photos téléchargées dans {PHOTOS}")


if __name__ == "__main__":
    main()
