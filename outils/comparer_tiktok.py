"""Compare la liste des vidéos TikTok du profil avec les lieux déjà importés de My Maps.

Entrée : outils/tiktok_ids.txt (ids séparés par des espaces, les points sont ignorés)
Sortie : outils/tiktok_manquants.json (id, lien, légende TikTok de chaque vidéo absente de My Maps)
Lancer :  python outils/comparer_tiktok.py
"""
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

ICI = Path(__file__).resolve().parent
PROFIL = "https://www.tiktok.com/@random_japan_place/video/"


def main():
    ids = [x.replace(".", "") for x in (ICI / "tiktok_ids.txt").read_text(encoding="utf-8").split()]
    ids = list(dict.fromkeys(ids))
    mymaps = json.loads((ICI / "mymaps_lieux.json").read_text(encoding="utf-8"))
    deja = {m.group(1) for l in mymaps if (m := re.search(r"video/(\d+)", l["tiktok"]))}
    manquants = []
    for vid in ids:
        if vid in deja:
            continue
        url = PROFIL + vid
        titre = ""
        try:
            with urllib.request.urlopen("https://www.tiktok.com/oembed?url=" + urllib.parse.quote(url, safe=""), timeout=30) as r:
                titre = json.load(r).get("title", "")
        except Exception as e:  # vidéo privée, supprimée, ou carrousel photo
            titre = f"(légende introuvable : {e})"
        manquants.append({"id": vid, "lien": url, "legende": titre})
    (ICI / "tiktok_manquants.json").write_text(json.dumps(manquants, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{len(ids)} vidéos sur le profil, {len(deja & set(ids))} déjà dans My Maps, {len(manquants)} manquantes")
    absents_profil = deja - set(ids)
    if absents_profil:
        print("Dans My Maps mais plus sur le profil :", absents_profil)
    for m in manquants:
        print(f"{m['id']} | {m['legende'][:110]}")


if __name__ == "__main__":
    main()
