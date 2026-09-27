"""Recopie le tableau Google Sheets publié dans la copie de secours du site (site/data/secours-*.csv).

Lancé chaque nuit par GitHub (voir .github/workflows/mise-en-ligne.yml), ou à la main :
    python outils/sauvegarder_tableau.py
Si Google ne répond pas ou renvoie quelque chose de bizarre, l'ancienne copie est gardée.
"""
import re
import sys
import urllib.request
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
CONFIG = RACINE / "site" / "config.js"
ONGLETS = {"lieux": ("secours-lieux.csv", "Nom (EN)"), "categories": ("secours-categories.csv", "Catégorie")}


def lien(onglet, config):
    m = re.search(rf"tableau:\s*{{[^}}]*?\b{onglet}:\s*'([^']*)'", config, re.S)
    return m.group(1).strip() if m else ""


def main():
    config = CONFIG.read_text(encoding="utf-8")
    for onglet, (fichier, colonne) in ONGLETS.items():
        url = lien(onglet, config)
        if not url:
            print(f"{onglet} : pas de lien dans config.js, rien à faire")
            continue
        try:
            with urllib.request.urlopen(url, timeout=60) as r:
                texte = r.read().decode("utf-8-sig")
        except Exception as e:
            print(f"{onglet} : Google ne répond pas ({e}), on garde l'ancienne copie")
            continue
        premiere_ligne = texte.splitlines()[0] if texte else ""
        if colonne not in premiere_ligne or texte.lstrip().startswith("<"):
            print(f"{onglet} : contenu inattendu, on garde l'ancienne copie")
            continue
        cible = RACINE / "site" / "data" / fichier
        ancien = cible.read_text(encoding="utf-8") if cible.exists() else ""
        if texte != ancien:
            cible.write_text(texte, encoding="utf-8", newline="")
            print(f"{onglet} : copie de secours mise à jour ({len(texte.splitlines()) - 1} lignes)")
        else:
            print(f"{onglet} : déjà à jour")
    return 0


if __name__ == "__main__":
    sys.exit(main())
