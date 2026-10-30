"""Filme les trois prises de la carte de la vidéo « tunnel » (plans.js), avec le moteur des vidéos d'Halloween
(halloween/rushes.py : Edge sans fenêtre sur le vrai GPU, temps ralenti, une capture chaque fois que l'horloge du
plan passe une image), à 60 images/s, sur une page de téléphone 540 × 960 à ×2 (1080 × 1920 : pas plus que ×2,
qualite.js plafonne la finesse de la carte à 2). La carte de tous les jours (de jour, sans Halloween : la vidéo doit
rester valable après le 31 octobre). Les prises sortent dans videos/carte/tunnel/public/rushes/.
    python outils/video/tunnel/rushes.py               # les trois
    python outils/video/tunnel/rushes.py tn-japon      # une seule
"""
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ICI = Path(__file__).resolve().parent
sys.path.insert(0, str(ICI.parent / 'halloween'))
from rushes import tourner  # noqa: E402

SORTIE = ICI.parents[2] / 'videos' / 'carte' / 'tunnel' / 'public' / 'rushes'
COMMUN = {'scripts': ['tunnel/plans.js'], 'sortie': SORTIE, 'halloween': False, 'heure': '10:30', 'date': '2026-10-21',
          'page': (540, 960), 'echelle': 2}
PLANS = ['tn-japon', 'tn-aogashima', 'tn-filtres']


def main():
    noms = [a for a in sys.argv[1:] if not a.startswith('--')] or PLANS
    with sync_playwright() as pw:
        nav = pw.chromium.launch(channel='msedge', headless=True,
                                 args=['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'])
        for nom in noms:
            tourner(nav, nom, COMMUN, vertical=True, ips=60)
        nav.close()


if __name__ == '__main__':
    sys.exit(main())
