"""Les captures de l'interface de la carte pour la vidéo « tunnel », chacune sur fond transparent pour l'animer en
calques 3D au montage : le site de téléphone sur une page 432 × 768 à ×5 (2160 × 3840 : deux fois la vidéo, net quand
la caméra avance ; 432 px de large, la taille d'un grand téléphone, comme le film promo de tourner.py), de jour, sans
Halloween, en anglais. La carte elle-même est cachée : ses prises sont filmées à part (rushes.py).
- ui/<élément>.png : les boutons de l'écran (logo, horloge, favoris, barre du bas, colonne de droite), découpés
  dans une capture de toute l'interface avec une marge pour leur ombre ;
- ui/fiche-aogashima.png : la fiche du lieu (le tiroir du bas) ;
- ui/menu-tout.png, menu-rien.png, menu-sanctuaires.png : le menu des catégories, toutes cochées, aucune (« Hide
  all »), puis les sanctuaires seuls ;
- ui/layout.json : la place de chacun (px CSS de la page 432 × 768) et, pour le menu, ses lignes.
    python outils/video/tunnel/captures.py
"""
import json
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ICI = Path(__file__).resolve().parent
SORTIE = ICI.parents[2] / 'videos' / 'carte' / 'tunnel' / 'public' / 'ui'
L, H, K = 432, 768, 5
MARGE = 16  # px CSS autour de chaque bouton : son ombre
ATTENDRE = "window.carte && document.getElementById('chargement').classList.contains('fini')"
SANS_CARTE = """#carte { visibility: hidden !important; }
  html, body { background: transparent !important; }
  .aide, .toast, .visites, #btn-dev, .btn-qualite, .maplibregl-ctrl-bottom-left { display: none !important; }"""
BOUTONS = {
    'logo': '.entete', 'horloge': '.heure-japon', 'favoris': '#btn-favoris',
    'menu': '#btn-menu-mobile', 'hasard': '#btn-hasard-mobile', 'chercher': '#btn-chercher-mobile',
    'rose': '#btn-rose', 'pres': '#btn-pres', 'recentrer': '#btn-recentrer',
}


def boite(p, selecteur, dans=None):
    return p.evaluate("""([s, d]) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect();
        const o = d ? document.querySelector(d).getBoundingClientRect() : { x: 0, y: 0 };
        return [r.x - o.x, r.y - o.y, r.width, r.height].map((v) => Math.round(v * 10) / 10); }""", [selecteur, dans])


def main():
    SORTIE.mkdir(parents=True, exist_ok=True)
    plan = {'page': [L, H], 'echelle': K}
    with sync_playwright() as pw:
        nav = pw.chromium.launch(channel='msedge', headless=True, args=['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'])
        ctx = nav.new_context(viewport={'width': L, 'height': H}, device_scale_factor=K)
        ctx.add_init_script("""try { localStorage.clear(); localStorage.setItem('aideVue', '1'); localStorage.setItem('langue', 'en');
            localStorage.setItem('modeDev', 'non'); localStorage.setItem('qualite', JSON.stringify({ niveau: 'fine', impose: 'fine' })); } catch {}""")

        def config(route):
            r = route.fetch()
            route.fulfill(response=r, body=r.text().replace('public: true', 'public: false'))
        ctx.route('**/config.js', config)
        p = ctx.new_page()
        p.goto('http://localhost:8123/?heure=10:30&date=2026-10-21')
        p.wait_for_function(ATTENDRE, timeout=120000)
        p.mouse.move(216, 400)
        p.mouse.wheel(0, -1)  # une entrée : la rotation de départ s'arrête
        p.wait_for_timeout(1500)
        p.add_style_tag(content=SANS_CARTE)
        p.wait_for_timeout(5800)  # les sources de la carte se replient (5 s)
        # les boutons : une capture de toute l'interface, puis chacun découpé avec sa marge
        p.screenshot(path=str(SORTIE / 'ui-complet.png'), omit_background=True)
        tout = Image.open(SORTIE / 'ui-complet.png')
        plan['boutons'] = {}
        for nom, s in BOUTONS.items():
            x, y, w, h = boite(p, s)
            b = [max(0, x - MARGE), max(0, y - MARGE), min(L, x + w + MARGE), min(H, y + h + MARGE)]
            tout.crop(tuple(round(v * K) for v in b)).save(SORTIE / f'{nom}.png')
            plan['boutons'][nom] = {'boite': [x, y, w, h], 'image': [b[0], b[1], b[2] - b[0], b[3] - b[1]]}
        # la fiche d'Aogashima
        p.evaluate("location.hash = '#aogashima'")
        p.wait_for_selector('#fiche[aria-hidden="false"]', timeout=20000)
        p.wait_for_function("[...document.querySelectorAll('#fiche img')].every((i) => i.complete)", timeout=20000)
        p.wait_for_timeout(1800)
        plan['fiche'] = boite(p, '#fiche')
        p.locator('#fiche').screenshot(path=str(SORTIE / 'fiche-aogashima.png'), omit_background=True)
        p.keyboard.press('Escape')
        p.wait_for_timeout(800)
        # le menu des catégories, dans ses trois états
        p.evaluate("document.getElementById('btn-categories').click()")
        p.mouse.move(2, 2)  # la souris hors du menu : aucune ligne survolée
        p.wait_for_timeout(800)
        p.evaluate("document.getElementById('recherche').blur()")
        menu = '#menu-categories'
        plan['menu'] = {'boite': boite(p, menu), 'recherche': boite(p, '.recherche', menu),
                        'tout': boite(p, '#btn-tout', menu), 'rien': boite(p, '#btn-rien', menu)}
        plan['menu']['lignes'] = p.evaluate("""() => { const o = document.querySelector('#menu-categories').getBoundingClientRect();
            return [...document.querySelectorAll('#liste-categories > li')].map((li) => { const r = li.querySelector('.ligne-tete')?.getBoundingClientRect() || li.getBoundingClientRect();
              return { nom: li.querySelector('.nom-cat')?.textContent.trim() || 'new', boite: [r.x - o.x, r.y - o.y, r.width, r.height].map((v) => Math.round(v * 10) / 10) }; })
              .filter((l) => l.boite[1] < o.height); }""")
        plan['menu']['case-sanctuaires'] = p.evaluate("""() => { const o = document.querySelector('#menu-categories').getBoundingClientRect();
            const li = [...document.querySelectorAll('#liste-categories .ligne-categorie')].find((x) => x.querySelector('.nom-cat').textContent.trim() === 'Shrines');
            const r = li.querySelector('.case').getBoundingClientRect(); return [r.x - o.x, r.y - o.y, r.width, r.height]; }""")
        p.locator(menu).screenshot(path=str(SORTIE / 'menu-tout.png'), omit_background=True)
        p.evaluate("document.getElementById('btn-rien').click()")
        p.wait_for_timeout(500)
        p.locator(menu).screenshot(path=str(SORTIE / 'menu-rien.png'), omit_background=True)
        p.evaluate("""[...document.querySelectorAll('#liste-categories .ligne-categorie')].find((x) => x.querySelector('.nom-cat').textContent.trim() === 'Shrines').querySelector('input').click()""")
        p.wait_for_timeout(500)
        p.locator(menu).screenshot(path=str(SORTIE / 'menu-sanctuaires.png'), omit_background=True)
        nav.close()
    (SORTIE / 'layout.json').write_text(json.dumps(plan, indent=1), encoding='utf-8')
    print('captures prêtes dans', SORTIE)


if __name__ == '__main__':
    main()
