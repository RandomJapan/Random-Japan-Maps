"""Les captures de l'interface de la carte pour la vidéo « minuit », chacune sur fond transparent pour l'animer en calques
3D au montage, comme celles de la vidéo « tunnel » (tunnel/captures.py) : le site de téléphone sur une page 432 × 768 à
×5 (2160 × 3840 : deux fois la vidéo), la nuit (23 h 55 au Japon : l'horloge du site dit 11:55 PM, à quelques minutes
de minuit), Halloween allumé, en anglais, six yōkai déjà trouvés (6/7, comme dans la prise de la chasse). La carte
elle-même est cachée : ses prises sont filmées à part (rushes.py).
- ui/<élément>.png : les boutons de l'écran (logo, horloge, raccourcis 3D, Halloween et favoris, barre du bas), découpés
  dans une capture de toute l'interface avec une marge pour leur ombre (le bouton d'Halloween, que le montage montre
  en grand, capturé ses voisins cachés) ;
- ui/panneau.png : le panneau « Halloween in Japan » ouvert, défilé jusqu'au bouton « Summon the parade » ;
- ui/layout.json : la place de chacun (px CSS de la page 432 × 768) et celle du bouton du défilé dans le panneau.
    python outils/video/minuit/captures.py
"""
import json
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ICI = Path(__file__).resolve().parent
SORTIE = ICI.parents[2] / 'videos' / 'carte' / 'minuit' / 'public' / 'ui'
L, H, K = 432, 768, 5
MARGE = 16  # px CSS autour de chaque bouton : son ombre
ATTENDRE = "window.carte && document.getElementById('chargement').classList.contains('fini')"
SANS_CARTE = """#carte { visibility: hidden !important; }
  html, body { background: transparent !important; }
  .aide, .toast, .visites, #btn-dev, .btn-qualite, .maplibregl-ctrl-bottom-left { display: none !important; }"""
BOUTONS = {
    'logo': '.entete', 'horloge': '.heure-japon', 'balades': '#btn-balades', 'halloween': '#btn-halloween', 'favoris': '#btn-favoris',
    'menu': '#btn-menu-mobile', 'hasard': '#btn-hasard-mobile', 'chercher': '#btn-chercher-mobile',
    'rose': '#btn-rose', 'pres': '#btn-pres', 'recentrer': '#btn-recentrer',
}
TROUVES = '["yurei", "oiwa", "okiku", "hitotsume", "konaki", "ittan"]'


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
        ctx.add_init_script(f"""try {{ localStorage.clear(); localStorage.setItem('aideVue', '1'); localStorage.setItem('langue', 'en');
            localStorage.setItem('modeDev', 'non'); localStorage.setItem('qualite', JSON.stringify({{ niveau: 'fine', impose: 'fine' }}));
            localStorage.setItem('yokaiTrouves', '{TROUVES}'); }} catch {{}}""")
        p = ctx.new_page()
        p.goto('http://localhost:8123/?heure=23:55&date=2026-10-31')
        p.wait_for_function(ATTENDRE, timeout=120000)
        p.wait_for_function("document.body.classList.contains('halloween')", timeout=30000)
        p.mouse.move(216, 400)
        p.mouse.wheel(0, -1)  # une entrée : la rotation de départ s'arrête
        p.wait_for_timeout(1500)
        p.add_style_tag(content=SANS_CARTE)
        p.wait_for_timeout(5800)  # les sources de la carte se replient (5 s)
        p.screenshot(path=str(SORTIE / 'ui-complet.png'), omit_background=True)
        tout = Image.open(SORTIE / 'ui-complet.png')
        plan['boutons'] = {}
        for nom, s in BOUTONS.items():
            x, y, w, h = boite(p, s)
            b = [max(0, x - MARGE), max(0, y - MARGE), min(L, x + w + MARGE), min(H, y + h + MARGE)]
            tout.crop(tuple(round(v * K) for v in b)).save(SORTIE / f'{nom}.png')
            plan['boutons'][nom] = {'boite': [x, y, w, h], 'image': [b[0], b[1], b[2] - b[0], b[3] - b[1]]}
        # le bouton d'Halloween seul, ses voisins (3D, favoris) cachés : sa marge d'ombre prenait leurs bords
        p.add_style_tag(content='#btn-balades, #btn-favoris { visibility: hidden !important; }')
        p.wait_for_timeout(300)
        p.screenshot(path=str(SORTIE / 'ui-halloween-seul.png'), omit_background=True)
        b = plan['boutons']['halloween']['image']
        Image.open(SORTIE / 'ui-halloween-seul.png').crop(tuple(round(v * K) for v in (b[0], b[1], b[0] + b[2], b[1] + b[3]))).save(SORTIE / 'halloween.png')
        p.add_style_tag(content='#btn-balades, #btn-favoris { visibility: visible !important; }')
        # le panneau d'Halloween, défilé jusqu'au bouton du défilé (sous le texte d'introduction)
        p.evaluate("document.getElementById('btn-halloween').click()")
        p.mouse.move(2, 2)
        p.wait_for_timeout(900)
        panneau = '#panneau-halloween'
        p.evaluate("""() => { const b = document.querySelector('#panneau-halloween .halloween-section .btn-lancer');
            const pan = document.getElementById('panneau-halloween'); const r = b.getBoundingClientRect(), o = pan.getBoundingClientRect();
            pan.scrollTop += Math.max(0, r.bottom - o.bottom + 40); }""")
        p.wait_for_timeout(400)
        plan['panneau'] = {'boite': boite(p, panneau), 'bouton': boite(p, '#panneau-halloween .halloween-section .btn-lancer', panneau)}
        p.locator(panneau).screenshot(path=str(SORTIE / 'panneau.png'), omit_background=True)
        nav.close()
    (SORTIE / 'layout.json').write_text(json.dumps(plan, indent=1), encoding='utf-8')
    print('captures prêtes dans', SORTIE)


if __name__ == '__main__':
    main()
