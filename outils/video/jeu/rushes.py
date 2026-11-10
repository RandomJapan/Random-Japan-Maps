"""Filme les prises des deux vidéos du jeu (plans.js) dans la vraie carte : le vrai jeu, joué par le film. Moteur des vidéos d'Halloween
(halloween/rushes.py : Edge sans fenêtre sur le vrai GPU, temps ralenti, une capture chaque fois que l'horloge du plan passe une
image), à 60 images/s, sur une page de téléphone 432 × 768 à ×2,5 (l'interface à sa vraie taille). Sortie : videos/carte/jeu/public/rushes/.
    python outils/video/jeu/rushes.py                 # toutes
    python outils/video/jeu/rushes.py jd-1            # une seule
    python outils/video/jeu/rushes.py --brouillon     # vite (×0,4, 15 images/s) dans rushes-brouillon/, avec une planche
Il faut le site en local (python -m http.server 8123 --directory site) et preparer.py.
Pour ces prises seulement, des réponses du site sont changées (Playwright) : les lieux tirés au sort, et la photo de ces lieux.
"""
import subprocess
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ICI = Path(__file__).resolve().parent
sys.path.insert(0, str(ICI.parent / 'halloween'))
from rushes import ffmpeg, tourner  # noqa: E402

PUBLIC = ICI.parents[2] / 'videos' / 'carte' / 'jeu' / 'public'
COMMUN = {'scripts': ['jeu/plans.js'], 'halloween': False, 'heure': '10:30', 'date': '2026-11-08', 'page': (432, 768), 'echelle': 2.5}
PLANS = {n: {} for n in ('jd-1', 'jd-2', 'jd-3', 'jd-score', 'df-essais', 'cr-debut', 'cr-score', 'cr-defi')}
# Les fichiers du site changés pendant les prises : [(texte d'origine, texte du film)]
CHANGES = {
    '**/jeu.js': [
        ('const melange = lieux().filter((l) => imageDe(l, credits)).sort(() => Math.random() - 0.5);',
         'const melange = window.__LIEUX_JEU.map((id) => lieux().find((l) => l.id === id));'),
        ('let etat = null;', 'let etat = null; window.__etatJeu = () => etat;'),
    ],
    '**/defi.js': [
        ('function lieuDuJour(jour, credits) {', 'function lieuDuJour(jour, credits) { return lieux().find((l) => l.id === window.__LIEU_DEFI);'),
    ],
}


def changer(motif, changes):
    # (une fonction à un seul argument : Playwright lui passerait la requête en second)
    def agir(route):
        r = route.fetch()
        texte = r.text()
        for avant, apres in changes:
            assert avant in texte, f'{motif} : introuvable : {avant}'
            texte = texte.replace(avant, apres, 1)
        route.fulfill(response=r, body=texte)
    return agir


def remplacer(fichier):
    def agir(route):
        route.fulfill(path=str(fichier), content_type='image/jpeg')
    return agir


class Navigateur:
    """Le navigateur, dont chaque contexte reçoit les changements ci-dessus (le moteur commun reste tel quel)."""

    def __init__(self, nav):
        self.nav = nav

    def new_context(self, **options):
        ctx = self.nav.new_context(**options)
        for motif, changes in CHANGES.items():
            ctx.route(motif, changer(motif, changes))
        for f in (PUBLIC / 'photos').glob('*.jpg'):
            ctx.route(f'**/photos/{f.name}', remplacer(f))
        return ctx


def main():
    brouillon = '--brouillon' in sys.argv
    sortie = PUBLIC / ('rushes-brouillon' if brouillon else 'rushes')
    noms = [a for a in sys.argv[1:] if not a.startswith('--')] or list(PLANS)
    with sync_playwright() as pw:
        nav = pw.chromium.launch(channel='msedge', headless=True,
                                 args=['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'])
        n = Navigateur(nav)
        for nom in noms:
            reglages = {**COMMUN, **PLANS[nom], 'sortie': sortie}
            if brouillon:
                tourner(n, nom, reglages, vertical=True, facteur=0.4, ips=15)
                subprocess.run([ffmpeg(), '-hide_banner', '-loglevel', 'error', '-y', '-i', str(sortie / f'{nom}.mp4'),
                                '-vf', 'fps=4,scale=216:384,tile=8x2', '-frames:v', '1', str(sortie / f'{nom}-planche.jpg')], check=True)
            else:
                tourner(n, nom, reglages, vertical=True, ips=60)
        nav.close()


if __name__ == '__main__':
    sys.exit(main())
