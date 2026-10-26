"""La carte dans la vidéo 1 de la balade 3D : où l'on trouve la balade (la fiche d'un lieu, « Visit in 3D »).
- rushes/ca-itsukushima.mp4 : la caméra plonge sur Itsukushima (carte.js, avec le moteur des vidéos d'Halloween :
  halloween/rushes.py), sur une page de téléphone 540 × 960 à ×2, 60 images/s, de jour, sans Halloween ;
- ui/fiche-itsukushima.png : toute la page du téléphone, la carte cachée (fond transparent), la fiche du lieu ouverte
  et défilée jusqu'à ses boutons, à ×4 ; avec son bouton « Visit in 3D » (aujourd'hui réservé au mode développeur :
  montré ici, comme il le sera une fois la balade publique) ; ui/bouton-3d.png, le bouton seul ; ui/layout.json : la
  place de la fiche et du bouton (px CSS de la page 540 × 960).
Dans videos/balade/public (pas dans git).
    python outils/video/balade/carte.py [prise|fiche]

Il faut le site en local sur le port 8123 (python -m http.server 8123 --directory site).
"""
import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ICI = Path(__file__).resolve().parent
sys.path.insert(0, str(ICI.parent / 'halloween'))
from rushes import tourner  # noqa: E402

PUBLIC = ICI.parents[2] / 'videos' / 'balade' / 'public'
COMMUN = {'scripts': ['balade/carte.js'], 'sortie': PUBLIC / 'rushes', 'halloween': False, 'heure': '10:30', 'date': '2026-10-26',
          'page': (540, 960), 'echelle': 2}
ATTENDRE = "window.carte && document.getElementById('chargement').classList.contains('fini')"
K = 4
SANS_CARTE = """#carte { visibility: hidden !important; }
  html, body { background: transparent !important; }
  .aide, .toast, .visites, #btn-dev, .btn-qualite, .maplibregl-ctrl-bottom-left { display: none !important; }
  #fiche a.dev { display: inline-flex !important; }"""


def boite(p, s, dans=None):
    return p.evaluate("""([s, d]) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect();
        const o = d ? document.querySelector(d).getBoundingClientRect() : { x: 0, y: 0 };
        return [r.x - o.x, r.y - o.y, r.width, r.height].map((v) => Math.round(v * 10) / 10); }""", [s, dans])


def fiche(nav):
    (PUBLIC / 'ui').mkdir(parents=True, exist_ok=True)
    ctx = nav.new_context(viewport={'width': 540, 'height': 960}, device_scale_factor=K)
    ctx.add_init_script("""try { localStorage.clear(); localStorage.setItem('aideVue', '1'); localStorage.setItem('langue', 'en');
        localStorage.setItem('modeDev', 'non'); localStorage.setItem('qualite', JSON.stringify({ niveau: 'fine', impose: 'fine' })); } catch {}""")

    def config(route):
        r = route.fetch()
        route.fulfill(response=r, body=r.text().replace('public: true', 'public: false'))
    ctx.route('**/config.js', config)
    p = ctx.new_page()
    p.goto('http://localhost:8123/?heure=10:30&date=2026-10-26')
    p.wait_for_function(ATTENDRE, timeout=120000)
    p.mouse.move(270, 500)
    p.mouse.wheel(0, -1)
    p.wait_for_timeout(1500)
    p.add_style_tag(content=SANS_CARTE)
    p.evaluate("location.hash = '#itsukushima-jinja'")
    p.wait_for_selector('#fiche.ouverte', timeout=20000)
    p.wait_for_function("[...document.querySelectorAll('#fiche img')].every((i) => i.complete)", timeout=20000)
    p.wait_for_timeout(2000)
    # la fiche défile jusqu'à ses boutons (« Visit in 3D » après « Directions ») ; toute la page, la carte cachée
    p.evaluate("""(() => { const d = document.getElementById('fiche-defil'), b = document.querySelector('#fiche a.dev');
      d.scrollTop += b.getBoundingClientRect().top - 640; })()""")
    p.wait_for_timeout(800)
    plan = {'page': [540, 960], 'echelle': K, 'fiche': boite(p, '#fiche'), 'bouton': boite(p, '#fiche a.dev')}
    p.screenshot(path=str(PUBLIC / 'ui' / 'fiche-itsukushima.png'), omit_background=True)
    p.locator('#fiche a.dev').screenshot(path=str(PUBLIC / 'ui' / 'bouton-3d.png'), omit_background=True)
    ctx.close()
    (PUBLIC / 'ui' / 'layout.json').write_text(json.dumps(plan, indent=1), encoding='utf-8')
    print('fiche :', plan, flush=True)


def main():
    quoi = sys.argv[1:] or ['prise', 'fiche']
    with sync_playwright() as pw:
        nav = pw.chromium.launch(channel='msedge', headless=True,
                                 args=['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'])
        if 'prise' in quoi:
            tourner(nav, 'ca-itsukushima', COMMUN, vertical=True, ips=60)
        if 'fiche' in quoi:
            fiche(nav)
        nav.close()


if __name__ == '__main__':
    main()
