"""Filme les sept prises de la carte de la vidéo « minuit » (plans.js), avec le moteur des vidéos d'Halloween
(halloween/rushes.py : Edge sans fenêtre sur le vrai GPU, temps ralenti, une capture chaque fois que l'horloge du plan
passe une image), à 60 images/s, sur une page de téléphone 540 × 960 à ×2 (1080 × 1920). La nuit du 31 octobre (23 h 55
au Japon : l'horloge du site, à l'écran dans la chasse, dit 11:55 PM ; la carte est aussi sombre qu'à 21 h 30), tout
Halloween allumé. La chasse est filmée sur une page de 432 × 768 à ×2,5 (la taille d'un vrai téléphone : son interface
se lit). Les prises sortent dans videos/carte/minuit/public/rushes/.
    python outils/video/minuit/rushes.py                    # les sept
    python outils/video/minuit/rushes.py mn-chapeaux        # une seule
    python outils/video/minuit/rushes.py --brouillon        # vite (×0,4, 15 images/s) dans rushes-brouillon/, avec une planche
Il faut le site en local (python -m http.server 8123 --directory site).
"""
import subprocess
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ICI = Path(__file__).resolve().parent
sys.path.insert(0, str(ICI.parent / 'halloween'))
from rushes import ffmpeg, tourner  # noqa: E402

PUBLIC = ICI.parents[2] / 'videos' / 'carte' / 'minuit' / 'public'
COMMUN = {'scripts': ['minuit/plans.js'], 'heure': '23:55', 'date': '2026-10-31', 'page': (540, 960), 'echelle': 2}
PLANS = {
    'mn-accroche': {},
    'mn-chapeaux': {},
    'mn-defile': {},
    'mn-proche': {'positions': True},
    'mn-chasse': {'page': (432, 768), 'echelle': 2.5, 'trouves': ['yurei', 'oiwa', 'okiku', 'hitotsume', 'konaki', 'ittan']},
    'mn-minuit': {'positions': True},
    'mn-fin': {},
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
                                '-vf', 'fps=2.5,scale=216:384,tile=8x2', '-frames:v', '1', str(sortie / f'{nom}-planche.jpg')], check=True)
            else:
                tourner(nav, nom, reglages, vertical=True, ips=60)
        nav.close()


if __name__ == '__main__':
    sys.exit(main())
