"""Fabrique une page web par lieu, en anglais, français et japonais, pour que Google trouve les lieux.

- site/en/<lieu>/, site/fr/<lieu>/, site/ja/<lieu>/ : la page d'un lieu (photo de couverture et vidéo TikTok,
  description, petite carte du Japon, lieux proches, bouton vers la carte 3D) ;
- site/en/, site/fr/, site/ja/ : la liste de tous les lieux, par région et préfecture ;
- site/sitemap.xml et site/robots.txt : le plan du site pour les moteurs de recherche ;
- site/pages/japon.svg : le fond de la petite carte.
Tout vient de la copie de secours du tableau (site/data/secours-*.csv) : la GitHub Action relance ce script
à chaque mise en ligne, donc un nouveau lieu du tableau a sa page le lendemain. Ces fichiers ne sont pas
gardés dans git (.gitignore). Le style et le petit script des pages sont dans site/pages/ (pages.css, pages.js).
Lancer :  python outils/fabriquer_pages.py
"""
import csv
import html
import json
import math
import re
import shutil
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

from fabriquer_prefectures import trouver

RACINE = Path(__file__).resolve().parent.parent
SITE = RACINE / "site"
# L'adresse publique du site (avec la barre à la fin), son nom de domaine depuis le 2026-10-02.
ADRESSE = "https://map.randomjapanplace.com/"
LANGUES = ("en", "fr", "ja")
NB_VOISINS = 3

# ---------------------------------------------------------------- Textes des pages
T = {
    "en": {
        "japon": "Japan", "carte3d": "See it on the 3D map", "tiktok": "Watch on TikTok", "itineraire": "Directions",
        "plus": "More info", "lire": "Play the video", "ou": "Where is it?", "ouvrir": "Open the 3D map here",
        "pres": "Nearby", "km": lambda n: f"{n} km away", "mers": ("Sea of Japan", "Pacific Ocean"), "tous": "All places", "langue": "Language", "regions": "Regions",
        "sous_titre": "Every place from my TikToks, in 3D",
        "pref": lambda p: f"{p} Prefecture", "dans": lambda r, p: f"{p} Prefecture, {r}, Japan",
        "pied": "Every place from the @random_japan_place TikToks, on a 3D relief map of Japan.",
        "titre_liste": lambda n: f"{n} places to discover in Japan",
        "intro_liste": "Every place from my TikToks: shrines, temples, castles, mountains, waterfalls and more, region by region. Each one is also on the 3D map of Japan.",
        "titre_site": "Random Japan Place", "video_du": lambda d: f"TikTok video of {d}",
        "mois": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        "date": lambda j, m, a: f"{m} {j}, {a}",
    },
    "fr": {
        "japon": "Japon", "carte3d": "Voir sur la carte 3D", "tiktok": "Voir sur TikTok", "itineraire": "Itinéraire",
        "plus": "Plus d'infos", "lire": "Lire la vidéo", "ou": "Où est-ce ?", "ouvrir": "Ouvrir la carte 3D ici",
        "pres": "Près d'ici", "km": lambda n: f"à {n} km", "mers": ("Mer du Japon", "Océan Pacifique"), "tous": "Tous les lieux", "langue": "Langue", "regions": "Régions",
        "sous_titre": "Tous les lieux de mes TikToks, en 3D",
        "pref": lambda p: f"préfecture de {p}", "dans": lambda r, p: f"Préfecture de {p}, {r}, Japon",
        "pied": "Tous les lieux des TikToks de @random_japan_place, sur une carte du Japon en relief.",
        "titre_liste": lambda n: f"{n} lieux à découvrir au Japon",
        "intro_liste": "Tous les lieux de mes TikToks : sanctuaires, temples, châteaux, montagnes, cascades et bien plus, région par région. Chacun est aussi sur la carte 3D du Japon.",
        "titre_site": "Random Japan Place", "video_du": lambda d: f"Vidéo TikTok du {d}",
        "mois": ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
        "date": lambda j, m, a: f"{j} {m} {a}",
    },
    "ja": {
        "japon": "日本", "carte3d": "3Dマップで見る", "tiktok": "TikTokで見る", "itineraire": "ルート",
        "plus": "詳しい情報", "lire": "動画を再生", "ou": "場所", "ouvrir": "3Dマップでここを開く",
        "pres": "近くのスポット", "km": lambda n: f"約{n}km", "mers": ("日本海", "太平洋"), "tous": "すべてのスポット", "langue": "言語", "regions": "地方",
        "sous_titre": "TikTokで紹介した場所を3Dマップで",
        "pref": lambda p: p, "dans": lambda r, p: f"{p}（{r}地方）",
        "pied": "@random_japan_place のTikTokで紹介したすべての場所を、日本の立体地図で。",
        "titre_liste": lambda n: f"日本で訪れたい{n}のスポット",
        "intro_liste": "TikTokで紹介したすべての場所：神社、寺院、城、山、滝など、地方ごとに。どの場所も日本の3Dマップで見られます。",
        "titre_site": "Random Japan Place", "video_du": lambda d: f"TikTok動画（{d}）",
        "mois": [f"{i}月" for i in range(1, 13)],
        "date": lambda j, m, a: f"{a}年{m}{j}日",
    },
}
NOM_LANGUE = {"en": "EN", "fr": "FR", "ja": "日本語"}
PALETTE = ["#c23b27", "#3b5b92", "#5f7f3a", "#c8912a", "#7b4a8c", "#2f7d7a", "#8a5a3b", "#b3486b", "#4a5d7e", "#6f8f3e"]

e = lambda s: html.escape(str(s or ""), quote=True)

# Petites icônes des boutons (les icônes des catégories viennent de site/icons.js, posées par pages.js)
ICO = {
    "tiktok": '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.6 3c.4 2.1 1.8 3.6 4 3.9v3.2c-1.5 0-2.9-.4-4-1.2v6.3a6 6 0 1 1-6-6h.6v3.3a2.8 2.8 0 1 0 2.2 2.7V3Z"/></svg>',
    "route": '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"/></svg>',
    "sortie": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
    "lire": '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5Z"/></svg>',
}


# ---------------------------------------------------------------- Lecture du tableau (comme app.js)
def normaliser(s):
    s = unicodedata.normalize("NFD", str(s or ""))
    s = "".join(c for c in s if not unicodedata.combining(c)).lower()
    return re.sub(r"[^a-z0-9぀-ヿ一-鿿]", "", s)


def nettoyer(v):
    s = str(v or "").strip()
    return "" if re.match(r"^(#(ERROR|VALUE|N/A|REF|NAME)|Loading|Chargement)", s, re.I) else s


def lire_csv(chemin):
    with chemin.open(encoding="utf-8") as f:
        lignes = list(csv.reader(f))
    entetes = [normaliser(h) for h in lignes[0]]
    return [{h: nettoyer(v) for h, v in zip(entetes, ligne)} for ligne in lignes[1:]]


def champ(ligne, noms):
    for n in noms:
        if ligne.get(n):
            return ligne[n]
    return ""


def lire_gps(brut):
    s = str(brut or "")
    if "." not in s and re.search(r"\d,\d", s):
        s = re.sub(r"(\d),(\d)", r"\1.\2", s)
    n = re.findall(r"-?\d+(?:\.\d+)?", s)
    if len(n) < 2:
        return None
    lat, lng = float(n[0]), float(n[1])
    if abs(lat) > 90:
        lat, lng = lng, lat
    return None if abs(lat) > 90 or abs(lng) > 180 else (lat, lng)


def slug(texte):
    s = unicodedata.normalize("NFD", str(texte))
    s = "".join(c for c in s if not unicodedata.combining(c)).lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def couleur_valide(c):
    c = (c or "").strip()
    return c if re.fullmatch(r"#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?", c) else ""


def lire_lieux():
    lieux, ids = [], set()
    for i, r in enumerate(lire_csv(SITE / "data" / "secours-lieux.csv")):
        nom_en = champ(r, ["nomen", "nom", "name", "nameen"])
        gps = lire_gps(champ(r, ["coordonneesgps", "coordonnees", "gps", "coordinates"]))
        if not nom_en or not gps:
            continue
        if re.fullmatch(r"(non|no|false|faux|0|いいえ)", champ(r, ["afficher", "visible", "show"]), re.I):
            continue
        id_ = slug(nom_en) or f"lieu-{i + 1}"
        while id_ in ids:
            id_ += "-2"
        ids.add(id_)
        tiktok = champ(r, ["lientiktok", "tiktok"])
        m = re.search(r"video/(\d+)", tiktok)
        lieux.append({
            "id": id_, "lat": gps[0], "lng": gps[1],
            "nom": {"en": nom_en, "fr": champ(r, ["nomfr"]), "ja": champ(r, ["nom日本語", "nomja", "nomjp", "nomjaponais"])},
            "categorie": champ(r, ["categorie", "category"]) or "Other",
            "tiktok": tiktok, "video": m.group(1) if m else "",
            "description": {
                "en": champ(r, ["descriptionen", "description"]),
                "fr": champ(r, ["descriptionfr"]),
                "ja": champ(r, ["description日本語", "descriptionja", "descriptionjp"]),
            },
            "photo": champ(r, ["photo", "image"]),
            "autre": champ(r, ["autrelien", "lien", "link"]),
        })
    return lieux


def lire_categories(lieux):
    cats = {}
    for i, r in enumerate(lire_csv(SITE / "data" / "secours-categories.csv")):
        cle = champ(r, ["categorie", "category"])
        if cle:
            cats[cle.lower()] = {
                "icone": champ(r, ["icone", "icon"]) or "pin",
                "couleur": couleur_valide(champ(r, ["couleur", "color"])) or PALETTE[i % len(PALETTE)],
                "nom": {"en": champ(r, ["nomen", "nameen"]) or cle, "fr": champ(r, ["nomfr"]), "ja": champ(r, ["nom日本語", "nomja", "nomjp"])},
            }
    for l in lieux:
        k = l["categorie"].lower()
        if k not in cats:
            cats[k] = {"icone": "pin", "couleur": PALETTE[len(cats) % len(PALETTE)], "nom": {"en": l["categorie"]}}
        l["cat"] = cats[k]


def lire_regions():
    """Noms des préfectures et des régions, lus dans site/regions.js (la même source que la carte)."""
    js = (SITE / "regions.js").read_text(encoding="utf-8")
    prefs = {int(n): {"en": en, "ja": ja} for n, en, ja in re.findall(r"(\d+): \{ en: '([^']+)', ja: '([^']+)' \}", js)}
    regions = []
    for cle, en, fr, ja, nums in re.findall(
            r"\{ cle: '(\w+)', nom: \{ en: '([^']+)', fr: '([^']+)', ja: '([^']+)' \}, prefectures: \[([\d, ]+)\] \}", js):
        regions.append({"cle": cle, "nom": {"en": en, "fr": fr, "ja": ja}, "prefectures": [int(x) for x in nums.split(",")]})
    assert len(prefs) == 47 and len(regions) == 8, "regions.js a changé de forme"
    return prefs, regions


def en_langue(textes, langue):
    return textes.get(langue) or textes.get("en") or ""


def distance_km(a, b):
    p1, p2 = math.radians(a["lat"]), math.radians(b["lat"])
    dp, dl = p2 - p1, math.radians(b["lng"] - a["lng"])
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 6371 * 2 * math.asin(math.sqrt(h))


def date_video(numero):
    """La date de publication est cachée dans le numéro de la vidéo (les 32 premiers bits)."""
    if not numero:
        return None
    d = datetime.fromtimestamp(int(numero) >> 32, tz=timezone.utc)
    return d if d.year > 2015 else None


# ---------------------------------------------------------------- La petite carte du Japon
OUEST, EST, SUD, NORD = 124.3, 146.3, 24.0, 45.9
LARGEUR = 560


def merc(lat):
    return math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))


ECHELLE = LARGEUR / math.radians(EST - OUEST)
HAUTEUR = round((merc(NORD) - merc(SUD)) * ECHELLE)


def projeter(lng, lat):
    return (lng - OUEST) / (EST - OUEST) * LARGEUR, (merc(NORD) - merc(lat)) * ECHELLE


def simplifier(pts, tol):
    if len(pts) < 3:
        return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dx, dy = x2 - x1, y2 - y1
    long_ = math.hypot(dx, dy) or 1e-9
    i_max, d_max = 0, -1.0
    for i in range(1, len(pts) - 1):
        d = abs(dy * pts[i][0] - dx * pts[i][1] + x2 * y1 - y2 * x1) / long_
        if d > d_max:
            i_max, d_max = i, d
    if d_max <= tol:
        return [pts[0], pts[-1]]
    return simplifier(pts[: i_max + 1], tol)[:-1] + simplifier(pts[i_max:], tol)


def chemin_svg(polygones):
    morceaux = []
    for poly in polygones:
        for anneau in poly:
            pts = [projeter(x, y) for x, y in anneau]
            xs, ys = [p[0] for p in pts], [p[1] for p in pts]
            if max(xs) - min(xs) < 1.2 and max(ys) - min(ys) < 1.2:
                continue  # îlot plus petit qu'un pixel
            moitie = len(pts) // 2
            pts = simplifier(pts[: moitie + 1], 0.3)[:-1] + simplifier(pts[moitie:], 0.3)
            morceaux.append("M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in pts) + "Z")
    return "".join(morceaux)


def fabriquer_fond(prefectures_geo):
    chemins = "".join(f'<path d="{chemin_svg(f["geometry"]["coordinates"])}"/>' for f in prefectures_geo["features"])
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {LARGEUR} {HAUTEUR}" width="{LARGEUR}" height="{HAUTEUR}">
<rect width="100%" height="100%" fill="#9ec5bc"/>
<g fill="#ece0c2" stroke="#8a6b45" stroke-width="0.6" stroke-linejoin="round">{chemins}</g>
</svg>
"""
    (SITE / "pages" / "japon.svg").write_text(svg, encoding="utf-8")


# ---------------------------------------------------------------- Morceaux de page
def tete(langue, titre, description, chemin, image, prefixe, alternatives, json_ld, goatcounter):
    """<head> commun. chemin : l'adresse de la page sans l'ADRESSE (ex : « fr/udo-inari-shrine/ »)."""
    liens_langues = "".join(
        f'\n  <link rel="alternate" hreflang="{l}" href="{ADRESSE}{c}">' for l, c in alternatives.items())
    compteur = (f'\n  <script data-goatcounter="https://{goatcounter}.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>'
                if goatcounter else "")
    return f"""<!doctype html>
<html lang="{langue}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{e(titre)}</title>
  <meta name="description" content="{e(description)}">
  <link rel="canonical" href="{ADRESSE}{chemin}">{liens_langues}
  <link rel="alternate" hreflang="x-default" href="{ADRESSE}{alternatives['en']}">
  <meta name="theme-color" content="#efe4c8">
  <meta property="og:title" content="{e(titre)}">
  <meta property="og:description" content="{e(description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="{ADRESSE}{chemin}">
  <meta property="og:image" content="{e(image)}">
  <meta property="og:site_name" content="Random Japan Place">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" type="image/png" href="{prefixe}img/favicon.png">
  <link rel="apple-touch-icon" href="{prefixe}img/icone-180.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;700&family=Zen+Antique&family=IM+Fell+English:ital@0;1&display=swap">
  <link rel="stylesheet" href="{prefixe}pages/pages.css">
  <script type="application/ld+json">{json.dumps(json_ld, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")}</script>{compteur}
</head>
<body>"""


def entete(langue, prefixe, liens_langues):
    t = T[langue]
    courant = ' aria-current="page"'
    langues = "".join(
        f'<a href="{lien}" hreflang="{l}" lang="{l}"{courant if l == langue else ""}>{NOM_LANGUE[l]}</a>'
        for l, lien in liens_langues.items())
    return f"""
  <header class="haut">
    <a class="marque plaque" href="{prefixe}">
      <img src="{prefixe}img/logo.jpg" alt="" width="40" height="40">
      <span><b>Random Japan Place</b><span>{e(t["sous_titre"])}</span></span>
    </a>
    <nav class="langues plaque" aria-label="{e(t["langue"])}">{langues}</nav>
  </header>"""


def pied(langue, prefixe):
    t = T[langue]
    return f"""
  <footer class="pied">
    <p><b>Random Japan Place</b> · {e(t["pied"])}</p>
    <p><a href="{prefixe}{langue}/">{e(t["tous"])}</a> · <a href="{prefixe}">{e(t["carte3d"])}</a> · <a href="https://www.tiktok.com/@random_japan_place" rel="noopener">TikTok @random_japan_place</a></p>
  </footer>
  <script type="module" src="{prefixe}pages/pages.js"></script>
</body>
</html>
"""


def couverture(l):
    return f"photos/tiktok/{l['video']}.jpg" if l["video"] and (SITE / "photos" / "tiktok" / f"{l['video']}.jpg").exists() else ""


def image_partage(l):
    """Pour l'aperçu dans les messageries : la photo du lieu, sinon la couverture TikTok."""
    p = l["photo"]
    if p.startswith("photos/") and (SITE / p).exists():
        return ADRESSE + p
    if p.startswith("http"):
        return p
    c = couverture(l)
    return ADRESSE + c if c else ADRESSE + "img/partage.jpg"


def resume(texte, n=155):
    texte = " ".join(texte.split())
    if len(texte) <= n:
        return texte
    coupe = texte[:n].rsplit(" ", 1)[0] if " " in texte[:n] else texte[:n]
    return coupe.rstrip(",.;:") + "…"


def date_texte(langue, d):
    t = T[langue]
    return t["date"](d.day, t["mois"][d.month - 1], d.year)


def page_lieu(l, langue, lieux, prefs, regions, goatcounter):
    t = T[langue]
    prefixe = "../../"
    nom = en_langue(l["nom"], langue)
    ja = l["nom"]["ja"]
    pref = prefs.get(l["pref"], {"en": "", "ja": ""})
    nom_pref = pref["ja"] if langue == "ja" else pref["en"]
    region = next((r for r in regions if l["pref"] in r["prefectures"]), None)
    nom_region = en_langue(region["nom"], langue) if region else ""
    cat = l["cat"]
    nom_cat = en_langue(cat["nom"], langue)
    desc = en_langue(l["description"], langue)
    chemin = f"{langue}/{l['id']}/"
    alternatives = {lg: f"{lg}/{l['id']}/" for lg in LANGUES}
    liens_langues = {lg: f"{prefixe}{lg}/{l['id']}/" for lg in LANGUES}

    if langue == "ja":
        titre = f"{nom}（{nom_pref}）· Random Japan Place"
    else:
        en_plus = f" ({ja})" if ja and ja != nom else ""
        titre = f"{nom}{en_plus} · {nom_pref}, {t['japon']} · Random Japan Place"
    description = resume(desc) or f"{nom} · {nom_cat} · {t['dans'](nom_region, nom_pref)}"
    image = image_partage(l)
    cover = couverture(l)
    date = date_video(l["video"])
    url = ADRESSE + chemin

    ld = [{
        "@context": "https://schema.org", "@type": "TouristAttraction", "name": nom, "description": desc or description,
        "url": url, "image": image, "inLanguage": langue,
        "geo": {"@type": "GeoCoordinates", "latitude": round(l["lat"], 6), "longitude": round(l["lng"], 6)},
        "address": {"@type": "PostalAddress", "addressRegion": nom_pref, "addressCountry": "JP"},
        "touristType": nom_cat,
    }]
    if ja and ja != nom:
        ld[0]["alternateName"] = ja
    if l["video"] and date:
        ld.append({
            "@context": "https://schema.org", "@type": "VideoObject", "name": f"{nom} · {nom_pref}, {t['japon']}",
            "description": desc or description, "thumbnailUrl": ADRESSE + cover if cover else image,
            "uploadDate": date.isoformat(), "embedUrl": f"https://www.tiktok.com/player/v1/{l['video']}",
            "url": l["tiktok"], "inLanguage": langue,
        })
    fil = [(t["japon"], f"{prefixe}{langue}/"), (nom_region, f"{prefixe}{langue}/#{region['cle']}" if region else ""),
           (nom_pref, f"{prefixe}{langue}/#p{l['pref']}")]
    ld.append({
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, "item": ADRESSE + h[len(prefixe):]}
                            for i, (n, h) in enumerate(fil) if h] + [{"@type": "ListItem", "position": 4, "name": nom}],
    })

    # Les boutons
    boutons = [f'<a class="bouton principal" href="{prefixe}#{e(l["id"])}"><span data-icone="mountain"></span>{e(t["carte3d"])}</a>']
    if l["tiktok"]:
        boutons.append(f'<a class="bouton" href="{e(l["tiktok"])}" rel="noopener">{ICO["tiktok"]}{e(t["tiktok"])}</a>')
    boutons.append(f'<a class="bouton" href="https://www.google.com/maps/dir/?api=1&amp;destination={l["lat"]},{l["lng"]}" rel="noopener">{ICO["route"]}{e(t["itineraire"])}</a>')
    if re.match(r"^https?://", l["autre"]):
        boutons.append(f'<a class="bouton" href="{e(l["autre"])}" rel="noopener">{ICO["sortie"]}{e(t["plus"])}</a>')

    # La vidéo : la couverture, et le lecteur TikTok seulement si on clique (la page reste légère)
    if l["video"]:
        fond = f'<img src="{prefixe}{cover}" alt="{e(nom)}" width="540" height="720" fetchpriority="high">' if cover else ""
        video = f"""<button class="video" type="button" data-video="{l['video']}" aria-label="{e(t['lire'])} · {e(nom)}">
          {fond}<span class="lire">{ICO["lire"]}{e(t["lire"])}</span>
        </button>"""
    else:
        video = ""
    date_html = f'<p class="date">{e(t["video_du"](date_texte(langue, date)))}</p>' if date else ""

    # La petite carte : le Japon, la préfecture du lieu en rouge pâle, et le lieu
    x, y = projeter(l["lng"], l["lat"])
    pref_geo = l["pref_geo"]
    carte = f"""<a class="carte" href="{prefixe}#{e(l['id'])}">
          <svg viewBox="0 0 {LARGEUR} {HAUTEUR}" role="img" aria-label="{e(t['dans'](nom_region, nom_pref))}">
            <image href="{prefixe}pages/japon.svg" width="{LARGEUR}" height="{HAUTEUR}"/>
            <text class="carte-mer" x="{LARGEUR * 0.27:.0f}" y="{HAUTEUR * 0.32:.0f}">{e(t["mers"][0])}</text>
            <text class="carte-mer" x="{LARGEUR * 0.76:.0f}" y="{HAUTEUR * 0.83:.0f}">{e(t["mers"][1])}</text>
            <path class="carte-pref" d="{pref_geo}"/>
            <circle class="carte-onde" cx="{x:.1f}" cy="{y:.1f}" r="15"/>
            <circle class="carte-lieu" cx="{x:.1f}" cy="{y:.1f}" r="6.5"/>
          </svg>
          <span class="bouton principal">{e(t["ouvrir"])}</span>
        </a>
        <p class="carte-note">{e(t["dans"](nom_region, nom_pref))} · {l['lat']:.4f}, {l['lng']:.4f}</p>"""

    # Les lieux proches
    voisins = sorted((v for v in lieux if v is not l), key=lambda v: distance_km(l, v))[:NB_VOISINS]
    cartes_voisins = []
    for v in voisins:
        c = couverture(v)
        img = f'<img src="{prefixe}{c}" alt="" loading="lazy" width="540" height="720">' if c else '<span class="sans-image"></span>'
        cartes_voisins.append(
            f'<a class="voisin" href="../{e(v["id"])}/">{img}<div><b>{e(en_langue(v["nom"], langue))}</b>'
            f'<span>{e(en_langue(v["cat"]["nom"], langue))} · {e(t["km"](round(distance_km(l, v))))}</span></div></a>')

    fil_html = " › ".join(f'<a href="{h}">{e(n)}</a>' for n, h in fil if h)
    corps = f"""
  <main class="feuille">
    <nav class="fil" aria-label="breadcrumb">{fil_html}</nav>
    <div class="tete-lieu">
      <div class="colonne-video">
        {video}
      </div>
      <div class="corps">
        <h1>{e(nom)}</h1>
        {f'<p class="nom-ja" lang="ja">{e(ja)}</p>' if ja and ja != nom and langue != "ja" else ""}
        <p class="categorie"><span class="pastille" style="--c:{cat['couleur']}" data-icone="{e(cat['icone'])}"></span>{e(nom_cat)} · {e(nom_pref)}</p>
        <div class="boutons">{"".join(boutons)}</div>
        <p class="description">{e(desc)}</p>
        {date_html}
      </div>
    </div>
    <div class="bas">
      <section class="section">
        <h2>{e(t["ou"])}</h2>
        {carte}
      </section>
      <section class="section">
        <h2>{e(t["pres"])}</h2>
        <div class="voisins">{"".join(cartes_voisins)}</div>
      </section>
    </div>
  </main>"""
    return (tete(langue, titre, description, chemin, image, prefixe, alternatives, ld, goatcounter)
            + entete(langue, prefixe, liens_langues) + corps + pied(langue, prefixe))


def page_liste(langue, lieux, prefs, regions, goatcounter):
    t = T[langue]
    prefixe = "../"
    titre = f"{t['titre_liste'](len(lieux))} · Random Japan Place"
    alternatives = {lg: f"{lg}/" for lg in LANGUES}
    liens_langues = {lg: f"{prefixe}{lg}/" for lg in LANGUES}
    ld = [{
        "@context": "https://schema.org", "@type": "CollectionPage", "name": titre, "url": f"{ADRESSE}{langue}/",
        "inLanguage": langue, "description": t["intro_liste"],
    }]
    blocs, raccourcis = [], []
    for r in regions:
        dans_region = [l for l in lieux if l["pref"] in r["prefectures"]]
        if not dans_region:
            continue
        sous = []
        for p in r["prefectures"]:
            dans_pref = sorted((l for l in dans_region if l["pref"] == p), key=lambda l: en_langue(l["nom"], langue))
            if not dans_pref:
                continue
            nom_pref = prefs[p]["ja"] if langue == "ja" else prefs[p]["en"]
            items = []
            for l in dans_pref:
                c = couverture(l)
                img = f'<img src="{prefixe}{c}" alt="" loading="lazy" width="540" height="720">' if c else '<span class="sans-image"></span>'
                items.append(f'<li><a href="{e(l["id"])}/">{img}<span><b>{e(en_langue(l["nom"], langue))}</b>'
                             f'<small>{e(en_langue(l["cat"]["nom"], langue))}</small></span></a></li>')
            sous.append(f'<h3 id="p{p}">{e(nom_pref)} <small>{len(dans_pref)}</small></h3><ul class="liste">{"".join(items)}</ul>')
        raccourcis.append(f'<a href="#{r["cle"]}">{e(en_langue(r["nom"], langue))}</a>')
        blocs.append(f'<section class="section" id="{r["cle"]}"><h2>{e(en_langue(r["nom"], langue))}</h2>{"".join(sous)}</section>')
    corps = f"""
  <main class="feuille">
    <div class="corps">
      <h1>{e(t["titre_liste"](len(lieux)))}</h1>
      <p class="description">{e(t["intro_liste"])}</p>
      <div class="boutons"><a class="bouton principal" href="{prefixe}"><span data-icone="mountain"></span>{e(t["carte3d"])}</a></div>
      <nav class="regions" aria-label="{e(t["regions"])}">{" · ".join(raccourcis)}</nav>
      {"".join(blocs)}
    </div>
  </main>"""
    return (tete(langue, titre, t["intro_liste"], f"{langue}/", ADRESSE + "img/partage.jpg", prefixe, alternatives, ld, goatcounter)
            + entete(langue, prefixe, liens_langues) + corps + pied(langue, prefixe))


def plan_du_site(lieux):
    def url(chemins, courant):
        alt = "".join(f'<xhtml:link rel="alternate" hreflang="{l}" href="{ADRESSE}{c}"/>' for l, c in chemins.items())
        return f"<url><loc>{ADRESSE}{courant}</loc>{alt}</url>"
    lignes = [f"<url><loc>{ADRESSE}</loc></url>"]
    listes = {l: f"{l}/" for l in LANGUES}
    lignes += [url(listes, listes[l]) for l in LANGUES]
    for lieu in lieux:
        chemins = {l: f"{l}/{lieu['id']}/" for l in LANGUES}
        lignes += [url(chemins, chemins[l]) for l in LANGUES]
    return ('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
            'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + "\n".join(lignes) + "\n</urlset>\n")


def main():
    lieux = lire_lieux()
    lire_categories(lieux)
    prefs, regions = lire_regions()
    geo = json.loads((SITE / "data" / "prefectures.geojson").read_text(encoding="utf-8"))
    formes = {f["properties"]["code"]: chemin_svg(f["geometry"]["coordinates"]) for f in geo["features"]}
    for l in lieux:
        l["pref"], _ = trouver(l["lng"], l["lat"], geo["features"])
        l["pref_geo"] = formes.get(l["pref"], "")
    m = re.search(r"goatcounter:\s*'([^']*)'", (SITE / "config.js").read_text(encoding="utf-8"))
    goatcounter = m.group(1) if m else ""

    fabriquer_fond(geo)
    for langue in LANGUES:
        dossier = SITE / langue
        if dossier.exists():
            shutil.rmtree(dossier)  # un lieu retiré du tableau perd aussi sa page
        dossier.mkdir()
        (dossier / "index.html").write_text(page_liste(langue, lieux, prefs, regions, goatcounter), encoding="utf-8")
        for l in lieux:
            (dossier / l["id"]).mkdir()
            (dossier / l["id"] / "index.html").write_text(page_lieu(l, langue, lieux, prefs, regions, goatcounter), encoding="utf-8")
    (SITE / "sitemap.xml").write_text(plan_du_site(lieux), encoding="utf-8")
    (SITE / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {ADRESSE}sitemap.xml\n", encoding="utf-8")
    print(f"{len(lieux)} lieux × {len(LANGUES)} langues = {len(lieux) * len(LANGUES)} pages, plus les listes et sitemap.xml")


if __name__ == "__main__":
    main()
