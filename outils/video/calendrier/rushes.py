"""Filme les prises des vidéos du calendrier de l'Avent (plans.js) dans la vraie carte : le calendrier ouvert comme le ferait un
visiteur le 15 décembre 2026. Moteur des vidéos d'Halloween (halloween/rushes.py : Edge sans fenêtre sur le vrai GPU, temps
ralenti, une capture chaque fois que l'horloge du plan passe une image), à 60 images/s, sur une page de téléphone 432 × 768 à
×2,5. Sortie : videos/carte/calendrier/public/rushes/.
    python outils/video/calendrier/rushes.py                 # toutes
    python outils/video/calendrier/rushes.py --brouillon     # vite (×0,4, 15 images/s) dans rushes-brouillon/, avec une planche
Il faut le site en local (python -m http.server 8123 --directory site).
L'horloge de la page est avancée au 15 décembre 2026, 10 h 30 (un script posé avant ralenti.js : Date et Date.now décalés),
car le calendrier lit la vraie date du visiteur (noel.js, jourReel).
"""
import json
import subprocess
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ICI = Path(__file__).resolve().parent
sys.path.insert(0, str(ICI.parent / 'halloween'))
from rushes import ffmpeg, tourner  # noqa: E402

PUBLIC = ICI.parents[2] / 'videos' / 'carte' / 'calendrier' / 'public'
JOUR = '2026-12-15T10:30:00'
OUVERTES = [1, 2, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14]
COMMUN = {'scripts': ['calendrier/plans.js'], 'halloween': False, 'heure': '10:30', 'date': '2026-12-15', 'page': (432, 768),
          'echelle': 2.5, 'stockage': {'calendrierOuvert': json.dumps(OUVERTES), 'langue': 'en'}}
PLANS = {'cv-cases': {}}

# Avant tout autre script de la page (donc avant ralenti.js, qui lit Date.now) : l'horloge au jour voulu
DATE = """(() => {
  const D = Date, decalage = new D('%s').getTime() - D.now();
  class Jour extends D {
    constructor(...a) { if (a.length) super(...a); else super(Jour.now()); }
    static now() { return D.now() + decalage; }
  }
  window.Date = Jour;
})();""" % JOUR


class Contexte:
    """Un contexte du moteur, sans sa route de config.js : pour couper Halloween, il y change *chaque* « public: true » en
    false (str.replace de Python), donc Noël aussi. Le 15 décembre, Halloween est fini de toute façon."""

    def __init__(self, ctx):
        self._ctx = ctx

    def route(self, motif, *args, **kwargs):
        if motif != '**/config.js':
            self._ctx.route(motif, *args, **kwargs)

    def __getattr__(self, nom):
        return getattr(self._ctx, nom)


class Navigateur:
    """Le navigateur, dont chaque contexte reçoit d'abord l'horloge du 15 décembre (le moteur commun reste tel quel)."""

    def __init__(self, nav):
        self.nav = nav

    def new_context(self, **options):
        ctx = self.nav.new_context(**options)
        ctx.add_init_script(DATE)
        return Contexte(ctx)


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
                                '-vf', 'fps=2,scale=216:384,tile=9x4', '-frames:v', '1', str(sortie / f'{nom}-planche.jpg')], check=True)
            else:
                tourner(n, nom, reglages, vertical=True, ips=60)
        nav.close()


if __name__ == '__main__':
    sys.exit(main())
