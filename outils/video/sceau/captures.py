"""Les captures de l'interface de la carte pour la vidéo « sceau » (2026-11-08), chacune sur fond transparent pour l'animer en
calques 3D au montage, comme celles de la vidéo « jarre » (jarre/captures.py) : le site de téléphone sur une page 432 × 768 à ×5
(2160 × 3840 : deux fois la vidéo), de jour, en anglais. La carte elle-même est cachée : ses prises sont filmées à part (rushes.py).
- ui/fiche-tottori.png : la fiche des dunes de Tottori, défilée en haut (sa photo, que la vraie vidéo du lieu recouvre au montage) ;
- ui/bouton-3d.png : son bouton « Visit in 3D » ;
- ui/jour-nuit.png : l'interrupteur jour/nuit, à côté de l'heure ;
- ui/layout.json : la place de chacun (px CSS de la page) et, dans la fiche, celle de la photo et du bouton.
    python outils/video/sceau/captures.py
"""
import json
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ICI = Path(__file__).resolve().parent
SORTIE = ICI.parents[2] / 'videos' / 'carte' / 'sceau' / 'public' / 'ui'
L, H, K = 432, 768, 5
MARGE = 16  # px CSS autour d'un bouton : son ombre
ATTENDRE = "window.carte && document.getElementById('chargement').classList.contains('fini')"
SANS_CARTE = """#carte { visibility: hidden !important; }
  html, body { background: transparent !important; }
  .aide, .toast, .visites, #btn-dev, .btn-qualite, .maplibregl-ctrl-bottom-left { display: none !important; }"""
FICHES = {'tottori': 'tottori-sand-dunes'}


def boite(p, selecteur, dans=None):
    return p.evaluate("""([s, d]) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect();
        const o = d ? document.querySelector(d).getBoundingClientRect() : { x: 0, y: 0 };
        return [r.x - o.x, r.y - o.y, r.width, r.height].map((v) => Math.round(v * 10) / 10); }""", [selecteur, dans])


def main():
    SORTIE.mkdir(parents=True, exist_ok=True)
    plan = {'page': [L, H], 'echelle': K, 'fiches': {}}
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
        p.goto('http://localhost:8123/?heure=10:30&date=2026-11-08')
        p.wait_for_function(ATTENDRE, timeout=120000)
        plan['compteur'] = p.evaluate("document.getElementById('compteur')?.textContent.trim()")
        p.mouse.move(216, 400)
        p.mouse.wheel(0, -1)  # une entrée : la rotation de départ s'arrête
        p.wait_for_timeout(1500)
        p.add_style_tag(content=SANS_CARTE)
        p.wait_for_timeout(5800)  # les sources de la carte se replient (5 s)
        p.screenshot(path=str(SORTIE / 'ui-complet.png'), omit_background=True)
        tout = Image.open(SORTIE / 'ui-complet.png')
        x, y, w, h = boite(p, '.jour-nuit')
        b = [max(0, x - MARGE), max(0, y - MARGE), min(L, x + w + MARGE), min(H, y + h + MARGE)]
        tout.crop(tuple(round(v * K) for v in b)).save(SORTIE / 'jour-nuit.png')
        plan['jourNuit'] = {'boite': [x, y, w, h], 'image': [b[0], b[1], b[2] - b[0], b[3] - b[1]]}
        for nom, lieu in FICHES.items():
            p.evaluate(f"location.hash = '#{lieu}'")
            p.wait_for_selector('#fiche.ouverte', timeout=20000)
            p.wait_for_function("[...document.querySelectorAll('#fiche img')].every((i) => i.complete)", timeout=20000)
            p.wait_for_timeout(2200)
            p.evaluate("document.getElementById('fiche-defil').scrollTop = 0")
            p.wait_for_timeout(300)
            plan['fiches'][nom] = {'fiche': boite(p, '#fiche'), 'media': boite(p, '#fiche-media', '#fiche')}
            p.locator('#fiche').screenshot(path=str(SORTIE / f'fiche-{nom}.png'), omit_background=True)
            if nom == 'tottori':
                bouton = '#fiche a[href*="balade"]'
                p.evaluate("""(s) => { const d = document.getElementById('fiche-defil'), b = document.querySelector(s);
                    d.scrollTop += b.getBoundingClientRect().top - 420; }""", bouton)
                p.wait_for_timeout(500)
                plan['fiches'][nom]['bouton'] = boite(p, bouton, '#fiche')
                p.locator('#fiche').screenshot(path=str(SORTIE / 'fiche-tottori-boutons.png'), omit_background=True)
                p.locator(bouton).screenshot(path=str(SORTIE / 'bouton-3d.png'), omit_background=True)
            p.keyboard.press('Escape')
            p.wait_for_timeout(800)
        nav.close()
    (SORTIE / 'layout.json').write_text(json.dumps(plan, indent=1, ensure_ascii=False), encoding='utf-8')
    print('captures prêtes dans', SORTIE, plan, flush=True)


if __name__ == '__main__':
    main()
