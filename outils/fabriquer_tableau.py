"""Prépare le tableau des lieux (fichier Excel pour Google Sheets) et la copie de secours du site.

Entrées :
  outils/mymaps_lieux.json      (créé par importer_mymaps.py)
  outils/traductions.json       (noms / descriptions FR et JA, clé = id de la vidéo TikTok)
  outils/lieux_ajoutes.json     (TikToks absents de My Maps, déjà complets)
  outils/a_trier.json           (vidéos « compilation » à trier par l'utilisateur)
Sorties :
  site/data/secours-lieux.csv, site/data/secours-categories.csv
  outils/Random Japan Place - Lieux.xlsx  (avec --excel)

Lancer :  python outils/fabriquer_tableau.py [--excel]
"""
import csv
import json
import re
import sys
from pathlib import Path

ICI = Path(__file__).resolve().parent
DATA = ICI.parent / "site" / "data"

COLONNES_LIEUX = [
    "Nom (EN)", "Nom (FR)", "Nom (日本語)", "Catégorie", "Coordonnées GPS", "Lien TikTok",
    "Description (EN)", "Description (FR)", "Description (日本語)", "Photo", "Autre lien",
    "Afficher ?", "À vérifier",
]
COLONNES_CATEGORIES = ["Catégorie", "Icône", "Couleur", "Nom EN", "Nom FR", "Nom 日本語", "Ordre"]

# Catégorie, icône, couleur, EN, FR, JA
CATEGORIES = [
    ("Shrines", "torii", "#D63A2F", "Shrines", "Sanctuaires", "神社"),
    ("Temples", "temple", "#8E2A5B", "Temples", "Temples", "寺院"),
    ("Castles", "castle", "#1E6FB8", "Castles", "Châteaux", "城"),
    ("Mountains", "mountain", "#4E7D2B", "Mountains & Volcanoes", "Montagnes & volcans", "山・火山"),
    ("Waterfalls", "waterfall", "#1596A8", "Waterfalls & Gorges", "Cascades & gorges", "滝・渓谷"),
    ("Lakes & Ponds", "lake", "#2B6FD6", "Lakes & Ponds", "Lacs & étangs", "湖・池"),
    ("Bridges", "bridge", "#7B3FB0", "Bridges", "Ponts", "橋"),
    ("Statues", "statue", "#C98A12", "Statues & Monuments", "Statues & monuments", "像・モニュメント"),
    ("Villages", "village", "#8A5A3C", "Villages", "Villages", "集落"),
    ("Theme Parks", "themepark", "#D6457E", "Theme Parks", "Parcs à thème", "テーマパーク"),
    ("Nature & Caves", "cave", "#5E6B3A", "Nature & Caves", "Nature & grottes", "自然・洞窟"),
    ("Islands", "island", "#12897A", "Islands", "Îles", "島"),
    ("Capes & Lighthouses", "lighthouse", "#C24A2C", "Capes & Lighthouses", "Caps & phares", "岬・灯台"),
    ("Flowers", "flower", "#D96BA0", "Flowers", "Fleurs", "花"),
    ("Coast & Beaches", "coast", "#1B8FC2", "Coast & Beaches", "Côtes & plages", "海岸・ビーチ"),
    ("Onsen", "onsen", "#D9622B", "Hot Springs", "Sources chaudes", "温泉"),
    ("Gardens", "garden", "#3F8F4A", "Parks & Gardens", "Parcs & jardins", "公園・庭園"),
    ("Trains & Railways", "train", "#4A55B5", "Trains & Railways", "Trains & chemins de fer", "鉄道"),
    ("Viewpoints", "viewpoint", "#2E86AB", "Viewpoints", "Points de vue", "展望スポット"),
    ("Historic Sites", "museum", "#7A6450", "Historic Sites", "Sites historiques", "史跡"),
    ("Churches", "church", "#6A5AA8", "Churches", "Églises", "教会"),
    ("Festivals", "festival", "#E0712B", "Festivals", "Festivals", "祭り・イベント"),
    ("Cities", "city", "#5B6C7D", "Cities", "Villes", "街"),
]

ICONES = [
    ("torii", "Portail de sanctuaire"), ("temple", "Temple"), ("pagoda", "Pagode"), ("castle", "Château"),
    ("mountain", "Montagne"), ("volcano", "Volcan"), ("bridge", "Pont"), ("waterfall", "Cascade"),
    ("lake", "Lac"), ("coast", "Côte / plage"), ("island", "Île"), ("lighthouse", "Phare / cap"),
    ("onsen", "Source chaude"), ("garden", "Jardin"), ("flower", "Fleurs"), ("forest", "Forêt"),
    ("village", "Village"), ("city", "Ville"), ("statue", "Statue"), ("cave", "Grotte"),
    ("viewpoint", "Point de vue"), ("festival", "Festival / lanterne"), ("train", "Train"),
    ("snow", "Neige"), ("themepark", "Parc à thème"), ("food", "Nourriture"), ("museum", "Musée"),
    ("hotel", "Hôtel"), ("church", "Église"), ("camera", "Photo"), ("star", "Étoile"), ("pin", "Épingle simple"),
]

# Anciens calques My Maps -> nouvelles catégories
CALQUES = {
    "Mountains": "Mountains", "Bridges": "Bridges", "Castles": "Castles", "Statues": "Statues",
    "Waterfalls": "Waterfalls", "Villages": "Villages", "Theme Parks": "Theme Parks",
    "Ponds & Lakes": "Lakes & Ponds", "Nature & Caves": "Nature & Caves",
}
# Noms écrits en français dans My Maps -> nom anglais
NOMS_EN = {
    "Temple Nanzoïn": "Nanzoin Temple",
    "Mont Iwaki": "Mount Iwaki",
    "Mont Daisen": "Mount Daisen",
    "Château de Nagoya": "Nagoya Castle",
}


def categorie(lieu):
    if lieu["categorie"] == "Shrine and Temple":
        if lieu["nom"] == "Nachi Waterfall":
            return "Waterfalls"
        if re.search(r"temple|ji$|dō$", lieu["nom"], re.I):
            return "Temples"
        return "Shrines"
    return CALQUES.get(lieu["categorie"], lieu["categorie"])


def id_video(url):
    m = re.search(r"video/(\d+)", url or "")
    return m.group(1) if m else ""


def charger(nom, defaut):
    f = ICI / nom
    return json.loads(f.read_text(encoding="utf-8")) if f.exists() else defaut


def lignes_lieux():
    mymaps = charger("mymaps_lieux.json", [])
    trad = charger("traductions.json", {})
    lignes = []
    for l in mymaps:
        vid = id_video(l["tiktok"])
        t = trad.get(vid, {})
        photo = f"photos/{vid}.jpg" if (ICI.parent / "site" / "photos" / f"{vid}.jpg").exists() else ""
        lignes.append({
            "Nom (EN)": NOMS_EN.get(l["nom"], l["nom"]),
            "Nom (FR)": t.get("nom_fr", ""),
            "Nom (日本語)": t.get("nom_ja", ""),
            "Catégorie": categorie(l),
            "Coordonnées GPS": f'{l["lat"]}, {l["lng"]}',
            "Lien TikTok": l["tiktok"],
            "Description (EN)": l["description"],
            "Description (FR)": t.get("desc_fr", ""),
            "Description (日本語)": t.get("desc_ja", ""),
            "Photo": photo,
            "Autre lien": "",
            "Afficher ?": "Oui",
            "À vérifier": "",
        })
    for a in charger("lieux_ajoutes.json", []):
        lignes.append({c: a.get(c, "") for c in COLONNES_LIEUX} | {"Afficher ?": "Oui", "À vérifier": "Oui"})
    return lignes


def lignes_categories():
    return [dict(zip(COLONNES_CATEGORIES, (*c, i + 1))) for i, c in enumerate(CATEGORIES)]


def ecrire_csv(chemin, colonnes, lignes):
    chemin.parent.mkdir(parents=True, exist_ok=True)
    with chemin.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=colonnes)
        w.writeheader()
        w.writerows(lignes)


def main():
    lieux = lignes_lieux()
    cats = lignes_categories()
    ecrire_csv(DATA / "secours-lieux.csv", COLONNES_LIEUX, lieux)
    ecrire_csv(DATA / "secours-categories.csv", COLONNES_CATEGORIES, cats)
    print(f"Copie de secours : {len(lieux)} lieux, {len(cats)} catégories")
    compte = {}
    for l in lieux:
        compte[l["Catégorie"]] = compte.get(l["Catégorie"], 0) + 1
    print("  " + ", ".join(f"{k}: {v}" for k, v in compte.items()))
    if "--excel" in sys.argv:
        from excel import fabriquer_excel
        chemin = fabriquer_excel(ICI / "Random Japan Place - Lieux.xlsx", lieux, cats, ICONES,
                                 charger("a_trier.json", []), COLONNES_LIEUX, COLONNES_CATEGORIES)
        print(f"Fichier Excel : {chemin}")


if __name__ == "__main__":
    main()
