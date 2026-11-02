"""Filme les prises de la carte de la vidéo « jarre » (plans.js), avec le moteur des vidéos d'Halloween (halloween/rushes.py :
Edge sans fenêtre sur le vrai GPU, temps ralenti, une capture chaque fois que l'horloge du plan passe une image), à
60 images/s, sur une page de téléphone 540 × 960 à ×2 (1080 × 1920), de jour, sans Halloween (la vidéo doit durer). Les
prises sortent dans videos/carte/jarre/public/rushes/.
    python outils/video/jarre/rushes.py                 # toutes
    python outils/video/jarre/rushes.py ja-plongee      # une seule
    python outils/video/jarre/rushes.py --brouillon     # vite (×0,4, 15 images/s) dans rushes-brouillon/, avec une planche
Il faut le site en local (python -m http.server 8123 --directory site) ; la route demande une fois le serveur d'itinéraires
gratuit d'OpenStreetMap, comme sur le site.
"""
import subprocess
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ICI = Path(__file__).resolve().parent
sys.path.insert(0, str(ICI.parent / 'halloween'))
from rushes import ffmpeg, tourner  # noqa: E402

PUBLIC = ICI.parents[2] / 'videos' / 'carte' / 'jarre' / 'public'
COMMUN = {'scripts': ['jarre/plans.js'], 'halloween': False, 'heure': '10:30', 'date': '2026-11-02', 'page': (540, 960), 'echelle': 2}
FAVORIS = '["himeji-castle", "kinkaku-ji", "shirahige-shrine", "fujisan-hongu-sengen-taisha"]'
PLANS = {
    'ja-plongee': {},
    'ja-itsuku': {},
    'ja-vol': {},
    'ja-mer': {},
    'ja-legende': {},
    'ja-route': {'stockage': {'favoris': FAVORIS}},
}


def main():
    brouillon = '--brouillon' in sys.argv
    sortie = PUBLIC / ('rushes-brouillon' if brouillon else 'rushes')
    noms = [a for a in sys.argv[1:] if not a.startswith('--')] or list(PLANS)
    with sync_playwright() as pw:
        nav = pw.chromium.launch(channel='msedge', headless=True,
                                 args=['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'])
        for nom in noms:
            reglages = {**COMMUN, **PLANS[nom], 'sortie': sortie}
            if brouillon:
                tourner(nav, nom, reglages, vertical=True, facteur=0.4, ips=15)
                subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', '-i', str(sortie / f'{nom}.mp4'),
                                '-vf', 'fps=5,scale=216:384,tile=8x2', '-frames:v', '1', str(sortie / f'{nom}-planche.jpg')], check=True)
            else:
                tourner(nav, nom, reglages, vertical=True, ips=60)
        nav.close()


if __name__ == '__main__':
    sys.exit(main())
