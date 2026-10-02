"""Télécharge l'image de couverture TikTok de chaque lieu dans site/photos/tiktok/<numéro de la vidéo>.jpg.

Les pages des lieux (fabriquer_pages.py) s'en servent. On les garde dans le site, parce que les adresses
d'images données par TikTok expirent au bout de quelques jours.
Seules les couvertures qui manquent sont téléchargées : la GitHub Action le lance chaque nuit.
Lancer :  python outils/telecharger_couvertures.py      (il faut Pillow)
"""
import csv
import io
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image

RACINE = Path(__file__).resolve().parent.parent
LIEUX = RACINE / "site" / "data" / "secours-lieux.csv"
DOSSIER = RACINE / "site" / "photos" / "tiktok"
LARGEUR_MAX = 540
AGENT = {"User-Agent": "Mozilla/5.0 (compatible; RandomJapanPlace/1.0; +https://map.randomjapanplace.com/)"}


def videos():
    """Les numéros des vidéos TikTok des lieux du tableau."""
    with LIEUX.open(encoding="utf-8") as f:
        for ligne in csv.DictReader(f):
            m = re.search(r"video/(\d+)", ligne.get("Lien TikTok") or "")
            if m:
                yield m.group(1), ligne["Lien TikTok"].strip()


def telecharger(lien, cible):
    url = "https://www.tiktok.com/oembed?url=" + urllib.parse.quote(lien, safe="")
    with urllib.request.urlopen(urllib.request.Request(url, headers=AGENT), timeout=30) as r:
        image_url = json.load(r).get("thumbnail_url")
    if not image_url:
        raise ValueError("pas de couverture")
    with urllib.request.urlopen(urllib.request.Request(image_url, headers=AGENT), timeout=30) as r:
        im = Image.open(io.BytesIO(r.read())).convert("RGB")
    if im.width > LARGEUR_MAX:
        im = im.resize((LARGEUR_MAX, round(im.height * LARGEUR_MAX / im.width)), Image.LANCZOS)
    im.save(cible, "JPEG", quality=82, optimize=True, progressive=True)


def main():
    DOSSIER.mkdir(parents=True, exist_ok=True)
    nouvelles = erreurs = 0
    for numero, lien in videos():
        cible = DOSSIER / f"{numero}.jpg"
        if cible.exists():
            continue
        try:
            telecharger(lien, cible)
            nouvelles += 1
            print(f"  {numero}.jpg ({cible.stat().st_size // 1024} Ko)")
        except Exception as e:  # une vidéo supprimée ou un souci réseau ne doit pas tout arrêter
            erreurs += 1
            print(f"  {numero} : {e}", file=sys.stderr)
        time.sleep(0.4)
    print(f"{nouvelles} couverture(s) téléchargée(s), {erreurs} erreur(s)")


if __name__ == "__main__":
    main()
