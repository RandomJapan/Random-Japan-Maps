"""Le jeu à plusieurs, pour la vidéo « Devine le lieu » : trois joueurs (noms inventés) dans un vrai salon, sur le serveur du jeu lancé en
local, jamais sur celui qui est en ligne (dans serveur/ : npm run essai ; sur localhost, le site s'y connecte tout seul). Sortie dans
videos/carte/jeu/public/ui/ : salon-1.jpg, salon-2.jpg, salon-3.jpg (les joueurs arrivent).
    python outils/video/jeu/captures.py
"""
import importlib.util
import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ICI = Path(__file__).resolve().parent
sys.path.insert(0, str(ICI.parent / 'halloween'))
sp = importlib.util.spec_from_file_location('rushes_jeu', ICI / 'rushes.py')
R = importlib.util.module_from_spec(sp)
sp.loader.exec_module(R)
UI = R.PUBLIC / 'ui'
ATTENDRE = "window.carte && document.getElementById('chargement').classList.contains('fini')"
CSS = """.filigrane, .maplibregl-ctrl-bottom-right, .maplibregl-ctrl-bottom-left, .controles, .heure-japon, #btn-dev, .btn-qualite, .aide, .toast, .visites { display: none !important; }
:root { --bas: 58px; }"""
LIEUX = ['shirogane-blue-pond', 'kinkaku-ji', 'motonosumi-shrine', 'aogashima', 'himeji-castle']
R.CHANGES['**/jeu.js'].append(('const nouveauCode = () => MOTS[Math.floor(Math.random() * MOTS.length)] + String(10 + Math.floor(Math.random() * 90));', "const nouveauCode = () => 'NINJA88';"))
JEU = 'section.jeu:not(.defi)'


def joueur(n, nom, k=2.5):
    # (seul l'hôte est filmé : les invités en petit, sinon trois cartes en relief à la fois saturent la page)
    ctx = n.new_context(viewport={'width': 432, 'height': 768}, device_scale_factor=k)
    ctx.add_init_script(f"""try {{ localStorage.clear(); localStorage.setItem('aideVue', '1'); localStorage.setItem('langue', 'en'); localStorage.setItem('modeDev', 'non');
        localStorage.setItem('qualite', JSON.stringify({{ niveau: 'fine', impose: 'fine' }})); }} catch {{}}
        window.__LIEUX_JEU = {json.dumps(LIEUX)};""")
    ctx.route('**/config.js', lambda route: route.fulfill(response=(r := route.fetch()), body=r.text().replace('public: true', 'public: false')))
    p = ctx.new_page()
    p.on('pageerror', lambda e: print(nom, 'ERREUR', e, flush=True))
    p.goto('http://localhost:8123/?heure=10:30&date=2026-11-08&points=non')
    p.wait_for_function(ATTENDRE, timeout=120000)
    p.add_style_tag(content=CSS)
    p.wait_for_timeout(800)
    p.evaluate(f"window.carte.setPixelRatio({k}); document.getElementById('btn-jeu').click()")
    p.wait_for_selector(f'{JEU} input[name=pseudo]', state='visible', timeout=20000)
    p.fill(f'{JEU} input[name=pseudo]', nom)
    return p


def photo(p, nom):
    p.screenshot(path=str(UI / f'{nom}.jpg'), type='jpeg', quality=93)


def main():
    UI.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        nav = pw.chromium.launch(channel='msedge', headless=True, args=['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'])
        n = R.Navigateur(nav)
        hote = joueur(n, 'Aiko')
        hote.click(f'{JEU} .jeu-creer')
        hote.wait_for_function(f"document.querySelector('{JEU} .jeu-code').textContent.includes('NINJA')", timeout=15000)
        hote.wait_for_timeout(2600)
        print('salon créé', flush=True)
        photo(hote, 'salon-1')
        invites = []
        for k, nom in enumerate(('Kenji', 'Mia')):
            p = joueur(n, nom, 0.6)
            p.fill(f'{JEU} input[name=code]', 'NINJA-88')
            p.click(f'{JEU} .jeu-rejoindre button[type=submit]')
            invites.append(p)
            hote.wait_for_function(f"document.querySelectorAll('{JEU} .jeu-joueurs li').length >= {k + 2}", timeout=30000, polling=200)
            hote.wait_for_timeout(700)
            photo(hote, f'salon-{k + 2}')
        nav.close()
    print('→', UI)


if __name__ == '__main__':
    main()
