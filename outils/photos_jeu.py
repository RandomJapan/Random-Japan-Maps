"""Photos libres (Wikimedia Commons) pour le jeu « Devine le lieu », pour les lieux qui n'ont pas de photo dans le tableau.

Le jeu montre une photo du lieu, sans texte. Celle du tableau (colonne Photo) passe d'abord. Pour les autres lieux,
ce script copie une photo sous licence libre de Wikimedia Commons dans site/photos/jeu/<numéro de la vidéo>.jpg,
et note son auteur, sa licence et sa page dans site/data/photos-jeu.json (le jeu les écrit sur la photo).
- CHOIX : les photos choisies à la main le 2026-10-04, parmi des planches de candidates (Wikidata, photos prises
  autour du point GPS, recherche par nom), vérifiées une à une : le bon lieu, reconnaissable, sans son nom écrit.
- Pour un lieu qui n'y est pas : la photo principale de son élément Wikidata (cherché par son nom japonais puis
  anglais), seulement s'il est à moins de 3 km du lieu (20 km pour une montagne, un lac, une île…).
- Sans photo libre, le lieu n'est pas dans le jeu. Ajouter une photo dans le tableau suffit à l'y mettre.
Seules les photos qui manquent sont cherchées (ou celles dont le CHOIX a changé) : la GitHub Action le lance chaque nuit.
Lancer :  python outils/photos_jeu.py      (il faut Pillow)
"""
import html
import io
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from fabriquer_pages import distance_km, lire_lieux  # noqa: E402  (lecture du tableau, comme les pages des lieux)

RACINE = Path(__file__).resolve().parent.parent
DOSSIER = RACINE / "site" / "photos" / "jeu"
CREDITS = RACINE / "site" / "data" / "photos-jeu.json"
COTE_MAX = 960  # px, le plus grand côté (la photo agrandie du jeu fait au plus 560 px de haut)
AGENT = {"User-Agent": "RandomJapanPlaceMap/1.0 (https://map.randomjapanplace.com/; photos for the map's game)"}
WIKIDATA = "https://www.wikidata.org/w/api.php"
COMMONS = "https://commons.wikimedia.org/w/api.php"
GRANDS = {"Mountains", "Lakes & Ponds", "Islands", "Coast & Beaches", "Nature & Caves", "Viewpoints"}
LIBRE = re.compile(r"^(CC[ -]?(BY|0|zero)|Public domain|PD|GFDL|Attribution)", re.I)

# Identifiant du lieu (slug du nom anglais) → fichier Commons choisi à la main.
# Restés sans photo libre convenable : inariyama-shrine, takasumi-shrine, ryusho-falls, hakuryu-lake,
# ishiharadake-fort, nagoro-scarecrow-village, iiyama-snow-festival, human-beach-nagase-walkway-etajima,
# monkey-d-luffy-statue, ibuki-tree-art-sculpture.
CHOIX = {
    "ghibli-park": "File:Satsuki and Mei’s House from observation platform - 1.jpg",
    "keya-no-oto": "File:Keya no ooto.jpg",
    "shimonada-station": "File:Shimonada station 01.jpg",
    "uradome-coast": "File:Uradome Coast Sengan-Matsushima.JPG",
    "the-great-wisteria-of-nakayama": "File:Nakayama-Ofuji 1.jpg",
    "hirosaki-park": "File:Hirosaki park ,Hirosaki, Aomori, Japan April 2016 - panoramio.jpg",
    "ine-fishing-village": "File:Funaya in Ine Town, Yosa District, Kyoto Prefecture 003.jpg",
    "dangyokei-gorge": "File:Dangyokei.jpg",
    "cape-notoro-misaki": "File:Notoro misaki light house.jpg",
    "lake-kinrin": "File:Lake Kinrin 20221022-2.jpg",
    "bungo-mori-roundhouse": "File:Bungo-Mori Roundhouse and turntable 3.jpg",
    "oasahiko-shrine": "File:140712 Oasahiko-jinja Naruto Tokushima pref Japan01s3.jpg",
    "lake-notoro": "File:Salicornia in lake.jpg",
    "harajiri-falls": "File:Bungo ohno harajirinotaki 02.jpg",
    "kuon-ji": "File:身延山久遠寺 - panoramio (14).jpg",
    "tokoji-temple": "File:Gate of tokoji.JPG",
    "fukuurajima": "File:Fukuura Bridge With Fukuura Island.JPG",
    "nomizo-falls": "File:濃溝の滝（SFD）.jpg",
    "amanohashidate-view-land": "File:天橋立ビューランド - panoramio (13).jpg",
    "goryokaku-park": "File:Hakodate Goryokaku Panorama 1.JPG",
    "iya-valley-vine-bridge": "File:紅葉とかずら橋 (Kazurabashi (Iya) in autumn) 22 Nov, 2011 - panoramio.jpg",
    "onaruto-bridge": "File:Big Naruto Bridge05n3872edit.jpg",  # l'autre vue avait le panneau « Magosaki Cape »
    "mount-nantai": "File:Mount nantai and lake chuzenji.jpg",
    "kegon-falls": "File:紅葉の華厳の滝.jpg",
    "irabu-bridge": "File:Miyako irabu ohashi 2014 1.jpg",
    "kuroshima-church": "File:Kuroshima Church 20241030.jpg",
    "saiko-iyashi-no-sato-nenba": "File:Iyashinosato village 04.jpg",
    "yakushima": "File:Jhomonsugi in Yaku Island Japan 001.JPG",
    "sendai-daikannon": "File:Sendai Daikannon (1870523730).jpg",
    "iwami-ginzan-silver-mine": "File:180504 Shimizudani Refinery Ruins of Iwami Ginzan Silver Mine Oda Shimane pref Japan03s.jpg",
    "yuushien-garden": "File:140426 Yuushien Matsue Shimane pref Japan00b5s3.jpg",
    "hotel-iya-onsen": "File:ほぼ、秘境の温泉行き - panoramio.jpg",
    "pl-peace-tower": "File:Dai Heiwa Kinen Tō (Osaka Tondabayashi) Peace tower hdsr S5 03.jpg",
    "akanuma-pond": "File:Autumn colours at Goshikinuma (37807805976).jpg",
    "tottori-sand-dunes": "File:Tottori-Sakyu Tottori Japan.JPG",
    "ashino-park": "File:Rail tracks and cherry trees in Ashino Park.jpg",
    "meiji-utsunoya-tunnel": "File:Meiji Utsunoya Tunnel -01.jpg",
    "akagi-nanmen-senbonzakura": "File:赤城南面千本桜.jpg",
    "okuoi-rainbow-bridge": "File:Hikyo wo Hashiru 20210923.jpg",
    "shiraito-falls": "File:N2 Shiraito Falls 2.jpg",
    "fugaku-wind-cave": "File:Fugaku fuketsu - Walking in the cave.jpg",
    "lake-yamanaka": "File:Yamanakako - Yamanaka6757.jpg",
    "fukuroda-falls": "File:Fukuroda Falls - 袋田の滝(ふくろだのたき).jpg",
    "noboribetsu-hell-valley": "File:Jigokudani (Hell Valley), Noboribetsu Onsen, Hokkaido, April 2023 10.jpg",
    "fuji-shibazakura-festival": "File:Fuji Shibazakura Festival 2.jpg",
    "hill-of-the-buddha": "File:頭大仏（2024）.jpg",
    "todai-ji-daibutsu-den": "File:Daibutsu-den in Todaiji Nara01bs3200.jpg",
    "onion-island-uzu-no-oka": "File:For Shikoku Island - panoramio.jpg",
    "heian-jingu": "File:Heian-jingu, keidai-1.jpg",
    "the-hells-of-beppu": "File:Beppu Umi-jigoku04n4272.jpg",
    "matsue-castle": "File:Matsue castle01bs4592.jpg",
    "shipporyu-ji": "File:犬鳴山七宝瀧寺 泉佐野市 Shippōryū-ji 2013.11.23 - panoramio.jpg",
    "okama-crater": "File:Zao L.Okama.JPG",
    "mount-omuro": "File:Mount Ōmuro (Izu Peninsula) & Mt.Fuji.jpg",
    "muro-ji": "File:Muro-ji, Goju-no-to (Five-storied Pagoda) -1 (July 2013) - panoramio.jpg",
    "tozan-shrine": "File:Ceramic torii of Sueyama Shrine.jpg",
    "takaya-shrine": "File:Takayazinzya 02.jpg",
    "dogo-onsen-annex-asuka-no-yu": "File:【改】外観（昼②）asukanoyu go 12.jpg",
}


def api(base, **params):
    params.setdefault("format", "json")
    url = base + "?" + urllib.parse.urlencode(params)
    for essai in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=AGENT), timeout=30) as r:
                return json.load(r)
        except Exception as e:  # Wikimedia répond parfois 429 ou 503 : on attend un peu
            if essai == 3:
                raise
            print(f"    (on réessaie : {e})", file=sys.stderr)
            time.sleep(3 + essai * 5)


def photo_wikidata(lieu):
    """Le fichier de la photo principale (P18) de l'élément Wikidata du lieu, s'il est assez près du lieu."""
    ids = []
    for nom, langue in ((lieu["nom"]["ja"], "ja"), (lieu["nom"]["en"], "en")):
        if not nom:
            continue
        r = api(WIKIDATA, action="wbsearchentities", search=nom, language=langue, uselang=langue, limit=8, type="item")
        ids += [x["id"] for x in r.get("search", []) if x["id"] not in ids]
        time.sleep(0.2)
    if not ids:
        return None
    rayon = 20 if lieu["categorie"] in GRANDS else 3
    proches = []
    for q, e in (api(WIKIDATA, action="wbgetentities", ids="|".join(ids[:40]), props="claims").get("entities") or {}).items():
        c = e.get("claims", {})
        try:
            point = c["P625"][0]["mainsnak"]["datavalue"]["value"]
            image = c["P18"][0]["mainsnak"]["datavalue"]["value"]
        except (KeyError, IndexError):
            continue
        d = distance_km(lieu, {"lat": point["latitude"], "lng": point["longitude"]})
        if d <= rayon:
            proches.append((d, "File:" + image))
    return min(proches)[1] if proches else None


def texte(valeur, n=70):
    """Le texte d'un champ des métadonnées de Commons (souvent du HTML), en une ligne courte."""
    s = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", valeur or ""))).strip()
    return s if len(s) <= n else s[: n - 1].rstrip() + "…"


def auteur(valeur):
    """Le nom de l'auteur, sans la date d'une signature ni la ville d'un compte Flickr."""
    s = texte(valeur, 300)
    s = re.sub(r"\s*\d{1,2}:\d{2}, \d{1,2} \w+ \d{4} \(UTC\)", "", s)
    s = re.sub(r"\s+from\s+.*$", "", s)
    s = re.sub(r"^User:\s*", "", s)
    return texte(s, 50)


def copier(titre, cible):
    """Copie la photo (réduite) et renvoie son crédit, ou None si sa licence n'est pas libre."""
    pages = api(COMMONS, action="query", titles=titre, prop="imageinfo", iiprop="url|extmetadata", iiurlwidth=COTE_MAX)
    info = next(iter((pages.get("query", {}).get("pages") or {}).values()), {}).get("imageinfo", [{}])[0]
    meta = info.get("extmetadata", {})
    licence = texte(meta.get("LicenseShortName", {}).get("value"), 40)
    if not info.get("url") or not LIBRE.match(licence):
        print(f"    licence refusée ou fichier introuvable : {titre} ({licence or '?'})", file=sys.stderr)
        return None
    with urllib.request.urlopen(urllib.request.Request(info.get("thumburl") or info["url"], headers=AGENT), timeout=60) as r:
        im = Image.open(io.BytesIO(r.read())).convert("RGB")
    im.thumbnail((COTE_MAX, COTE_MAX), Image.LANCZOS)
    im.save(cible, "JPEG", quality=80, optimize=True, progressive=True)
    return {
        "fichier": titre,
        "auteur": auteur(meta.get("Artist", {}).get("value")) or "Wikimedia Commons",
        "licence": licence,
        "lien": info.get("descriptionurl", ""),
    }


def main():
    DOSSIER.mkdir(parents=True, exist_ok=True)
    credits = json.loads(CREDITS.read_text(encoding="utf-8")) if CREDITS.exists() else {}
    nouvelles = sans = 0
    for lieu in lire_lieux():
        video = lieu["video"]
        if lieu["photo"] or not video:
            continue
        cible = DOSSIER / f"{video}.jpg"
        voulu = CHOIX.get(lieu["id"])
        deja = credits.get(video)
        if deja and cible.exists() and (not voulu or deja["fichier"] == voulu):
            continue
        try:
            titre = voulu or photo_wikidata(lieu)
            credit = titre and copier(titre, cible)
        except Exception as e:  # un souci réseau ne doit pas tout arrêter : on réessaiera la nuit prochaine
            print(f"  {lieu['id']} : {e}", file=sys.stderr)
            continue
        if not credit:
            sans += 1
            print(f"  {lieu['id']} : pas de photo libre")
            continue
        credits[video] = credit
        nouvelles += 1
        print(f"  {lieu['id']} → {cible.name} ({cible.stat().st_size // 1024} Ko, {credit['licence']}, {credit['auteur']})")
        time.sleep(0.3)
    CREDITS.write_text(json.dumps(dict(sorted(credits.items())), ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{nouvelles} photo(s) copiée(s), {sans} lieu(x) sans photo libre")


if __name__ == "__main__":
    main()
