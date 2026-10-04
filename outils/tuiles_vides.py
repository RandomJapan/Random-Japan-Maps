"""Liste les tuiles de relief vides (pleine mer) de Mapterhorn autour du Japon, dans site/data/tuiles-vides.json.

Mapterhorn n'a pas de tuile pour certaines zones de grand large : il répond 404, et chaque 404 s'écrit en rouge
dans la console du navigateur. La carte (site/tuiles-relief.js) ne lui demande plus les tuiles de cette liste, ni
leurs sous-tuiles (une tuile vide n'a que des sous-tuiles vides).
- Jusqu'au niveau ZPLEIN, on descend dans toutes les tuiles qui existent, en partant de celle du monde entier
  (une requête HEAD par tuile : rien n'est téléchargé). Au niveau 10, ça fait environ 20 000 requêtes.
- Plus fin, jusqu'à ZMAX (le zoom maximal de la source), seulement au bord des zones vides déjà trouvées : les
  trous de Mapterhorn suivent à peu près des carrés de 1° sans terre, donc un trou plus fin touche toujours un
  trou plus grossier. S'il en manque, chaque navigateur apprend une tuile vide à son premier 404.
On garde les tuiles vides dont la tuile parente existe.
Les réponses sont gardées dans le dossier temporaire du système (carte-japon-tuiles) : relancer reprend où on en était.
Les données de Mapterhorn changent rarement : à relancer seulement si des 404 réapparaissent souvent.
Lancer :  python outils/tuiles_vides.py
"""
import json
import sys
import tempfile
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from math import cos, floor, log, pi, radians, tan
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
SORTIE = RACINE / "site" / "data" / "tuiles-vides.json"
CACHE = Path(tempfile.gettempdir()) / "carte-japon-tuiles" / "reponses.json"
ADRESSE = "https://tiles.mapterhorn.com/{z}/{x}/{y}.webp"
BORNES = (108, 12, 170, 58)  # maxBounds de la carte (app.js) : ouest, sud, est, nord
ZPLEIN = 10
ZMAX = 12  # maxzoom de la source de relief (app.js)
EN_PARALLELE = 8
AGENT = {"User-Agent": "RandomJapanPlaceMap/1.0 (https://map.randomjapanplace.com/; list of empty sea tiles, once)"}


def tuile_x(lng, z):
    return floor((lng + 180) / 360 * 2 ** z)


def tuile_y(lat, z):
    return floor((1 - log(tan(radians(lat)) + 1 / cos(radians(lat))) / pi) / 2 * 2 ** z)


def dans_bornes(z, x, y):
    """La tuile touche-t-elle la zone de la carte ?"""
    o, s, e, n = BORNES
    return tuile_x(o, z) <= x <= tuile_x(e, z) and tuile_y(n, z) <= y <= tuile_y(s, z)


def existe(cle):
    """True si Mapterhorn a la tuile, False s'il répond 404."""
    z, x, y = cle.split("/")
    requete = urllib.request.Request(ADRESSE.format(z=z, x=x, y=y), method="HEAD", headers=AGENT)
    for essai in range(5):
        try:
            with urllib.request.urlopen(requete, timeout=30):
                return True
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return False
            erreur = e
        except Exception as e:  # réseau : on réessaie
            erreur = e
        time.sleep(2 + 3 * essai)
    raise RuntimeError(f"{cle} : {erreur}")


def main():
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    reponses = json.loads(CACHE.read_text()) if CACHE.exists() else {}
    vides = set()

    def vide(z, x, y):
        """La tuile, ou l'une de ses tuiles parentes, est-elle vide ?"""
        return any(f"{k}/{x >> (z - k)}/{y >> (z - k)}" in vides for k in range(z + 1))

    def au_bord(z, x, y):
        """Une tuile voisine (même niveau) est-elle vide ?"""
        return any(vide(z, x + dx, y + dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1) if dx or dy)

    niveau = ["0/0/0"]
    with ThreadPoolExecutor(EN_PARALLELE) as pool:
        for z in range(1, ZMAX + 1):
            parents = [tuple(map(int, c.split("/"))) for c in niveau]
            if z > ZPLEIN:  # plus fin : seulement au bord du vide
                parents = [p for p in parents if au_bord(*p)]
            enfants = [f"{z}/{2 * x + dx}/{2 * y + dy}" for _, x, y in parents for dx in (0, 1) for dy in (0, 1)
                       if dans_bornes(z, 2 * x + dx, 2 * y + dy)]
            a_demander = [c for c in enfants if c not in reponses]
            for cle, ok in zip(a_demander, pool.map(existe, a_demander)):
                reponses[cle] = ok
            CACHE.write_text(json.dumps(reponses))
            niveau = [c for c in enfants if reponses[c]]
            nouveaux = [c for c in enfants if not reponses[c]]
            vides.update(nouveaux)
            print(f"  niveau {z} : {len(enfants)} tuiles regardées ({len(a_demander)} demandées), {len(nouveaux)} vides")
    liste = sorted(vides, key=lambda c: tuple(map(int, c.split("/"))))
    SORTIE.write_text(json.dumps({"zmax": ZMAX, "vides": liste}, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"{len(liste)} tuiles vides → {SORTIE.relative_to(RACINE)} ({SORTIE.stat().st_size} octets)")


if __name__ == "__main__":
    sys.exit(main())
