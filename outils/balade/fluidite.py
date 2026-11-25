# -*- coding: utf-8 -*-
"""La fluidité de lieux à leur départ, et en d'autres endroits, dans les mêmes conditions.
Téléphone (390 × 844, ×2, processeur ÷ 4, la caméra qui tourne) : médiane, p95, processeur par image.
Carte graphique (3200 × 1800, image figée) : ms, triangles, appels de dessin.
    python -u outils/balade/fluidite.py --lieux iiyama,tottori [--vues "place=iiyama:0,30,3.14;village=iiyama:0,-322,3.14"] [--nuit] [--sans-tel] [--sans-gpu]
(--vues : nom=lieu:x,z,cap, le cap en radians ; mesurer aussi l'ancienne version d'un lieu du même coup pour comparer, comme le veut la règle)"""
import sys, statistics, math
from playwright.sync_api import sync_playwright
sys.stdout.reconfigure(encoding='utf-8')
ARGS = sys.argv[1:]
opt = lambda n, d=None: ARGS[ARGS.index(n) + 1] if n in ARGS else d
NUIT = '--nuit' in ARGS
# nom : lieu, x, z, cap (None : le départ du lieu, tel quel)
VUES = {f'{l} départ': (l, None) for l in (opt('--lieux') or '').split(',') if l}
for v in (opt('--vues') or '').split(';'):
    if v:
        nom, reste = v.split('=', 1); lieu, xzc = reste.split(':')
        VUES[nom] = (lieu, tuple(float(a) for a in xzc.split(',')))
if not VUES: sys.exit(__doc__)
ALLER = """([x, z, cap]) => { const M = balade.monde(), e = balade.etat; e.x = x; e.z = z; e.y = M.lieu.monde.hauteur(e.x, e.z); e.vx = e.vz = 0; e.cap = cap; balade.cam.lacet = e.cap + Math.PI; balade.camera.userData.place = false; const r = balade.renard; r.x = e.x - Math.sin(e.cap); r.z = e.z - Math.cos(e.cap); r.y = e.y; }"""
GPU = """async () => {
  const M = balade.monde(), r = balade.rendu, scene = balade.scene, cam = balade.camera;
  r.setAnimationLoop(null); r.setPixelRatio(2); dispatchEvent(new Event('resize'));
  await new Promise((ok) => setTimeout(ok, 300));
  const gl = r.getContext(), px = new Uint8Array(4), une = () => M.finale.rendre(r, scene, cam);
  for (let i = 0; i < 10; i++) une();
  gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
  const res = [];
  for (let k = 0; k < 5; k++) { const t0 = performance.now(); for (let i = 0; i < 30; i++) une(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); res.push((performance.now() - t0) / 30); }
  res.sort((a, b) => a - b);
  r.info.autoReset = false; r.info.reset(); une(); const tri = r.info.render.triangles, appels = r.info.render.calls; r.info.autoReset = true;
  return [+res[2].toFixed(2), tri, appels];
}"""

def ouvrir(nav, lieu, tel):
    ctx = nav.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True) if tel else nav.new_context(viewport={'width': 1600, 'height': 900})
    p = ctx.new_page()
    U = f"http://localhost:8123/balade/?lieu={lieu}&perso=fille&langue=fr&compagnon=kon"
    p.goto(U); p.evaluate("localStorage.clear(); localStorage.setItem('modeDev', 'oui'); localStorage.setItem('baladeYakushima', 'oui')")
    p.goto(U); p.wait_for_function('window.__pret === true', timeout=150000)
    charge = p.evaluate('performance.now()')
    for _ in range(60):
        p.wait_for_timeout(200)
        if p.evaluate("balade.etat.mode === 'jeu' && document.querySelector('.dialogue').hidden"): break
        if not p.evaluate("document.querySelector('.dialogue').hidden"):
            if tel: p.locator('.bouton-a').dispatch_event('pointerdown')
            else: p.keyboard.press('KeyE')
    if NUIT:
        p.evaluate("balade.jeu.nuit(true)"); p.wait_for_timeout(3200)
    return ctx, p, charge

with sync_playwright() as pw:
    nav = pw.chromium.launch(channel='msedge', headless=True, args=['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'])
    for nom, (lieu, vue) in VUES.items():
        ligne = f'{nom:34s}'
        if '--sans-tel' not in ARGS:
            ctx, p, charge = ouvrir(nav, lieu, True)
            cdp = ctx.new_cdp_session(p)
            cdp.send('Emulation.setCPUThrottlingRate', {'rate': 4}); cdp.send('Performance.enable')
            if vue: p.evaluate(ALLER, list(vue))
            p.wait_for_timeout(3500)
            m0 = {m['name']: m['value'] for m in cdp.send('Performance.getMetrics')['metrics']}
            t = p.evaluate("""() => new Promise((fin) => { const t = []; let d = performance.now(), l0 = balade.cam.lacet; const f = (n) => { t.push(n - d); d = n; balade.cam.lacet = l0 + Math.sin(n / 2000) * 0.6; if (t.length < 360) requestAnimationFrame(f); else fin(t.slice(5)); }; requestAnimationFrame(f); })""")
            m1 = {m['name']: m['value'] for m in cdp.send('Performance.getMetrics')['metrics']}
            n = len(t) + 5; t.sort()
            ligne += f' | téléphone : médiane {statistics.median(t):5.1f} ms, p95 {t[int(len(t) * 0.95)]:5.1f}, processeur {1000 * (m1["TaskDuration"] - m0["TaskDuration"]) / n:5.2f} ms/image, chargé en {charge / 1000:4.1f} s'
            ctx.close()
        if '--sans-gpu' not in ARGS:
            ctx, p, _ = ouvrir(nav, lieu, False)
            if vue: p.evaluate(ALLER, list(vue))
            p.wait_for_timeout(1800)
            v = p.evaluate(GPU)
            ligne += f' | carte : {v[0]:5.2f} ms, {v[1] / 1e6:.3f} M triangles, {v[2]} appels'
            ctx.close()
        print(ligne, flush=True)
    nav.close()
