"""Photographie le calendrier de l'Avent de la carte pour les vidéos de Noël : le panneau aux 24 portes fermées, puis ouvertes, et
la fiche de chaque case (le cadeau, son aperçu, « Le savais-tu ? »), comme un visiteur le 24 décembre 2026, en anglais, sur une
page de téléphone (432 px de large, ×2,5 : 1080 px), dans videos/carte/calendrier/public/cases/.
    python outils/video/calendrier/captures.py
Il faut le site en local (python -m http.server 8123 --directory site). Rien n'est téléchargé : on ouvre seulement les cases.
"""
import re
from pathlib import Path

from playwright.sync_api import sync_playwright

ICI = Path(__file__).resolve().parent
SORTIE = ICI.parents[2] / 'videos' / 'carte' / 'calendrier' / 'public' / 'cases'
# l'horloge de la page, avancée au jour voulu : le script DATE de rushes.py (lu dans le fichier : l'importer importerait le
# moteur d'Halloween, qui porte le même nom de module)
DATE = re.search(r'DATE = """(.*?)"""', (ICI / 'rushes.py').read_text(encoding='utf-8'), re.S).group(1)

JOUR = '2026-12-24T10:30:00'
CACHER = """.filigrane, .maplibregl-ctrl-bottom-right, .maplibregl-ctrl-bottom-left, .controles, .heure-japon, #btn-dev, .btn-qualite,
  .aide, .toast, .visites { display: none !important; }"""


def main():
    SORTIE.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        nav = pw.chromium.launch(channel='msedge', headless=True, args=['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'])
        # une page haute : chaque fiche y tient entière (la carte derrière ne compte pas)
        ctx = nav.new_context(viewport={'width': 432, 'height': 2600}, device_scale_factor=2.5)
        ctx.add_init_script("""try { localStorage.clear(); localStorage.setItem('aideVue', '1'); localStorage.setItem('langue', 'en');
          localStorage.setItem('calendrierPrenom', 'Alex'); } catch {}""")
        ctx.add_init_script(DATE % JOUR)
        p = ctx.new_page()
        p.on('pageerror', lambda e: print('ERREUR', e))
        p.goto('http://localhost:8123/?heure=21:30&points=non')
        p.wait_for_function("window.carte && document.getElementById('chargement').classList.contains('fini')", timeout=120000)
        p.wait_for_function("!document.getElementById('btn-noel').hidden", timeout=30000)
        p.add_style_tag(content=CACHER + ' * { scroll-behavior: auto !important; transition-duration: 0s !important; }')
        p.click('#btn-noel')
        p.wait_for_selector('#panneau-noel .porte[data-j="24"]')
        p.wait_for_timeout(800)
        p.locator('#panneau-noel .noel-portes').screenshot(path=str(SORTIE / 'portes-fermees.png'))
        p.locator('#panneau-noel').screenshot(path=str(SORTIE / 'panneau.png'))
        for j in range(1, 25):
            p.click(f'#panneau-noel .porte[data-j="{j}"]')
            p.wait_for_selector('#panneau-noel .noel-case')
            p.wait_for_function("[...document.querySelectorAll('#panneau-noel .noel-case img')].every((i) => i.complete)", timeout=20000)
            p.wait_for_timeout(700)
            p.locator('#panneau-noel .noel-case').screenshot(path=str(SORTIE / f'case-{j:02d}.png'))
            print(j, flush=True)
        p.evaluate("document.getElementById('panneau-noel').scrollTop = 0")
        p.wait_for_timeout(500)
        p.locator('#panneau-noel .noel-portes').screenshot(path=str(SORTIE / 'portes-ouvertes.png'))
        nav.close()


if __name__ == '__main__':
    main()
