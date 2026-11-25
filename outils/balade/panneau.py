# -*- coding: utf-8 -*-
"""Le panneau « Se balader en 3D » de la carte (?balades), pour un simple visiteur (rien dans le navigateur) : combien de cartes de balades,
combien visibles ; celle du lieu est-elle là, visible, sans la classe dev ? Une photo du panneau, la carte du lieu amenée à l'écran.
    python outils/balade/panneau.py sortie.png --lieu iiyama [--site] [--tel] [--dev]"""
import sys, json
from playwright.sync_api import sync_playwright
sys.stdout.reconfigure(encoding='utf-8')
ARGS = sys.argv[1:]
opt = lambda n, d=None: ARGS[ARGS.index(n) + 1] if n in ARGS else d
LIEU = opt('--lieu')
libres = [a for i, a in enumerate(ARGS) if not a.startswith('--') and not (i and ARGS[i - 1] == '--lieu')]
if not (LIEU and libres): sys.exit(__doc__)
U = 'https://map.randomjapanplace.com' if '--site' in ARGS else 'http://localhost:8123'
TEL = '--tel' in ARGS
with sync_playwright() as pw:
    nav = pw.chromium.launch(channel='msedge', headless=True, args=['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'])
    ctx = nav.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True) if TEL else nav.new_context(viewport={'width': 1440, 'height': 900})
    p = ctx.new_page(); err = []
    p.on('pageerror', lambda e: err.append(str(e)[:200]))
    p.goto(U + '/'); p.evaluate('localStorage.clear()')
    if '--dev' in ARGS: p.evaluate("localStorage.setItem('modeDev', 'oui')")
    p.goto(U + '/?balades&v=' + str(id(p)))
    p.wait_for_function("window.carte && document.getElementById('chargement').classList.contains('fini')", timeout=180000)
    p.wait_for_timeout(3500)
    r = p.evaluate("""(lieu) => { const li = [...document.querySelectorAll('li.balade')]; const vis = (el) => { const s = getComputedStyle(el), b = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && b.width > 0 && b.height > 0; };
      return { cartes: li.length, visibles: li.filter(vis).length, lieu: li.filter((l) => l.innerHTML.includes('lieu=' + lieu)).map((l) => ({ classe: l.className, visible: vis(l), texte: l.innerText.trim().replace(/\\s+/g, ' ').slice(0, 120) })) }; }""", LIEU)
    el = p.query_selector(f'li.balade a[href*="lieu={LIEU}"]')
    if el: el.scroll_into_view_if_needed(); p.wait_for_timeout(600)
    p.screenshot(path=libres[0])
    print(json.dumps(r, ensure_ascii=False), '| erreurs', err)
    nav.close()
