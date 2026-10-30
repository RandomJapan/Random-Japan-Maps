"""Filme les plans de la carte de la vidéo promo de 30 s (plans.js), avec le moteur des vidéos d'Halloween
(halloween/rushes.py : Edge sans fenêtre sur le vrai GPU, temps ralenti, une capture par 1/30 s de film), en 16:9
(1280 × 720 × 1,5 = 1920 × 1080). La carte de toujours (sans Halloween, de jour), sauf l'été : une nuit de feux
d'artifice. Les plans sortent dans videos/carte/promo30/public/rushes/.
    python outils/video/promo30/rushes.py                 # tous
    python outils/video/promo30/rushes.py p-plongee      # un seul
    python outils/video/promo30/rushes.py --vertical     # en 9:16 (720 × 1280 × 1,5), dans rushes-v/ ; plans.js
                                                         # prend les réglages « v » de chaque plan
"""
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ICI = Path(__file__).resolve().parent
sys.path.insert(0, str(ICI.parent / 'halloween'))
from rushes import tourner  # noqa: E402

SORTIE = ICI.parents[2] / 'videos' / 'carte' / 'promo30' / 'public' / 'rushes'
SORTIE_V = SORTIE.parent / 'rushes-v'
JOUR = '10:30'
COMMUN = {'scripts': ['promo30/plans.js'], 'sortie': SORTIE, 'halloween': False, 'heure': JOUR}
PLANS = {
    'p-plongee': {'date': '2026-10-21'},
    'p-mer': {'date': '2026-10-21'},
    'p-printemps': {'date': '2026-04-04'},
    'p-ete': {'date': '2026-08-01', 'heure': '20:40'},
    'p-automne': {'date': '2026-11-22'},
    'p-hiver': {'date': '2026-02-06'},
}


def main():
    noms = [a for a in sys.argv[1:] if not a.startswith('--')] or list(PLANS)
    with sync_playwright() as pw:
        nav = pw.chromium.launch(channel='msedge', headless=True,
                                 args=['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'])
        for nom in noms:
            if '--vertical' in sys.argv:
                tourner(nav, nom, {**COMMUN, **PLANS[nom], 'sortie': SORTIE_V}, vertical=True)
            else:
                tourner(nav, nom, {**COMMUN, **PLANS[nom]})
        nav.close()


if __name__ == '__main__':
    sys.exit(main())
