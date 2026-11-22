"""Le kanji de l'année (今年の漢字), pour la case 14 du calendrier de l'Avent : il est annoncé chaque 12 décembre vers
14 h (heure du Japon) au Kiyomizu-dera, à Kyoto. Le propriétaire, 2026-11-22 : « tu fais en sorte que dès qu'il sort, il
se mette à jour automatiquement ».

Ce script cherche le kanji de l'année en cours et l'écrit dans site/data/kanji-annee.json :
    {"annee": 2026, "kanji": "…", "source": "kanken" | "wikipedia", "lu": "2026-12-12T…"}
La carte (noel-carte.js) le lit ; un kanji écrit à la main dans config.js (CONFIG.noel.kanji) passe avant.
- D'abord la page officielle du Kanji Kentei pour cette année (https://www.kanken.or.jp/kotoshinokanji/former/2026.html) :
  le kanji y est une image dont le texte de remplacement (alt) est le kanji seul (vérifié sur celle de 2025 : alt="熊").
- Sinon (la page officielle n'existe pas encore le jour même), l'article « 今年の漢字 » de Wikipédia en japonais, mis à
  jour dans les minutes qui suivent l'annonce : la ligne « | [[2026年]] || … |'''X''' || ».
- Un seul caractère chinois, sinon rien n'est écrit. La page officielle l'emporte sur Wikipédia s'ils diffèrent.
- Il ne fait rien avant le 12 décembre (heure du Japon) : avant l'annonce, la carte montre celui de l'année d'avant.
La GitHub Action « Mise en ligne » le lance chaque nuit, et trois fois le 12 décembre après l'annonce.
Lancer :  python outils/kanji_annee.py [année] [--forcer]   (--forcer : même avant le 12 décembre)
"""
import datetime as dt
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ICI = Path(__file__).resolve().parent
SORTIE = ICI.parent / "site" / "data" / "kanji-annee.json"
AGENT = {"User-Agent": "RandomJapanPlaceMap/1.0 (https://map.randomjapanplace.com/; kanji of the year)"}
OFFICIEL = "https://www.kanken.or.jp/kotoshinokanji/former/{annee}.html"
WIKIPEDIA = ("https://ja.wikipedia.org/w/api.php?action=parse&format=json&formatversion=2&prop=wikitext&page="
             + urllib.parse.quote("今年の漢字"))
UN_KANJI = re.compile(r"^[一-鿿㐀-䶿豈-﫿]$")
JAPON = dt.timezone(dt.timedelta(hours=9))


def lire(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=AGENT), timeout=30) as r:
        return r.read().decode("utf-8", errors="replace")


def officiel(annee):
    """Le kanji de la page officielle de l'année, ou None (page absente : pas encore publiée)."""
    try:
        page = lire(OFFICIEL.format(annee=annee))
    except Exception as e:  # 404 avant la publication
        print(f"Page officielle {annee} : {e}")
        return None
    if f"{annee}年" not in page:
        return None
    for alt in re.findall(r'alt="([^"]*)"', page):
        if UN_KANJI.match(alt.strip()):
            return alt.strip()
    return None


def wikipedia(annee):
    try:
        texte = json.loads(lire(WIKIPEDIA))["parse"]["wikitext"]
    except Exception as e:
        print(f"Wikipédia : {e}")
        return None
    m = re.search(r"\n\|\s*\[\[" + str(annee) + r"年\]\]\s*\|\|[^|\n]*\|\s*'''([^']+)'''", texte)
    k = m.group(1).strip() if m else None
    return k if k and UN_KANJI.match(k) else None


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    maintenant = dt.datetime.now(JAPON)
    annee = int(args[0]) if args else maintenant.year
    if not args and "--forcer" not in sys.argv and (maintenant.month, maintenant.day) < (12, 12):
        print(f"Kanji de l'année {annee} : annoncé le 12 décembre, rien à chercher avant.")
        return
    avant = {}
    if SORTIE.exists():
        avant = json.loads(SORTIE.read_text(encoding="utf-8"))
        if avant.get("annee") == annee and avant.get("source") == "kanken":
            print(f"Kanji de l'année {annee} déjà lu sur la page officielle : {avant.get('kanji')}")
            return
    k, source = officiel(annee), "kanken"
    if not k:
        k, source = wikipedia(annee), "wikipedia"
    if not k:
        print(f"Kanji de l'année {annee} : pas encore publié.")
        return
    if avant.get("annee") == annee and avant.get("kanji") == k and avant.get("source") == source:
        print(f"Kanji de l'année {annee} : {k} (inchangé)")
        return
    SORTIE.write_text(json.dumps({"annee": annee, "kanji": k, "source": source,
                                  "lu": maintenant.isoformat(timespec="minutes")}, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Kanji de l'année {annee} : {k} (source : {source})")


if __name__ == "__main__":
    main()
