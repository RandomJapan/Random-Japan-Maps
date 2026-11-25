# -*- coding: utf-8 -*-
"""Où l'on peut aller à pied dans le lieu (avec les vraies règles du jeu, monde.libre), depuis des départs ; ce qu'on atteint, ce qu'on traverse.
    python outils/balade/atteindre.py dossier --lieu iiyama [--pas 0.2] [--departs "0,47.2;-3.4,-292.2"] [--nuit] [--corps]
(sans --departs : depuis le départ du lieu ; un lieu en deux parties, comme Iiyama, en demande un par partie)
- chaque action (interaction) : atteinte si une case où l'on peut être est à moins de son rayon ;
- chaque passant à qui l'on parle : atteint si une case est à moins de 2,2 m ;
- le décor dans les jambes : les cases où l'on peut être et où du décor est dessiné entre 15 cm et 1,05 m au-dessus du sol (les triangles des
  objets du lieu, étalés sur la grille) : là, on marche dans quelque chose.
Écrit plan_<zone>.png (gris : où l'on va ; rouge : dans le décor ; bleu : les actions ; vert : les passants ; noir : le décor bas)."""
import sys, json
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw

sys.stdout.reconfigure(encoding='utf-8')
ARGS = sys.argv[1:]
def opt(n, d=None):
    if n in ARGS:
        i = ARGS.index(n); v = ARGS[i + 1]; del ARGS[i:i + 2]; return v
    return d
LIEU, PORT, PAS = (opt('--lieu') or sys.exit(__doc__)), opt('--port', '8123'), float(opt('--pas', '0.2'))
DEPARTS = [[float(v) for v in d.split(',')] for d in opt('--departs', '').split(';') if d]
NUIT = '--nuit' in ARGS
CORPS = '--corps' in ARGS
if CORPS: ARGS.remove('--corps')
if NUIT: ARGS.remove('--nuit')
D = Path(ARGS[0]); D.mkdir(parents=True, exist_ok=True)

JS = """
async ({ PAS, DEPARTS, CORPS }) => {
  const L = balade.monde().lieu, M = L.monde, T = L.terrain;
  const cle = (i, j) => i * 100003 + j, vus = new Map();
  const zones = [];
  for (const [x0, z0] of (DEPARTS.length ? DEPARTS : [[L.depart.x, L.depart.z]])) {
    const file = [[Math.round(x0 / PAS), Math.round(z0 / PAS), M.hauteur(x0, z0)]], cases = [];
    if (vus.has(cle(file[0][0], file[0][1]))) continue;
    vus.set(cle(file[0][0], file[0][1]), file[0][2]);
    while (file.length) {
      const [i, j, y] = file.pop();
      cases.push([i, j, y]);
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const a = i + di, b = j + dj, k = cle(a, b);
        if (vus.has(k)) continue;
        const x = a * PAS, z = b * PAS;
        if (!M.libre(x, z, y, [], [i * PAS, j * PAS])) continue;
        const h = M.hauteur(x, z, y);
        vus.set(k, h); file.push([a, b, h]);
      }
    }
    zones.push(cases);
  }
  const toutes = zones.flat();
  const pres = (x, z, r) => { const n = Math.ceil(r / PAS), i0 = Math.round(x / PAS), j0 = Math.round(z / PAS); for (let di = -n; di <= n; di++) for (let dj = -n; dj <= n; dj++) if (vus.has(cle(i0 + di, j0 + dj)) && Math.hypot((i0 + di) * PAS - x, (j0 + dj) * PAS - z) <= r) return true; return false; };
  // les actions, les passants
  const jeuFaux = { estNuit: false, aDansSac: () => false, aTampon: () => false };
  const actions = L.interactions.map((q) => {
    let x = q.x, z = q.z, r = q.rayon || 2.2;
    const p = q.passant && L.passants.find((s) => s.id === q.passant);
    if (p) { x = p.x; z = p.z; r = 2.2; }
    if (x == null && q.pres) { return { id: q.id, x: null, z: null, ok: true, banc: true }; }
    return { id: q.id, x, z, r, passant: !!p, ok: pres(x, z, r), tampon: q.tampon || null };
  });
  const passants = L.passants.map((p) => ({ id: p.id, x: p.x, z: p.z, parle: L.interactions.some((q) => q.passant === p.id), dans: vus.has(cle(Math.round(p.x / PAS), Math.round(p.z / PAS))), ronde: p.ronde || null, quand: p.quand || null, etage: p.etage ?? null }));
  // le décor bas : les triangles des objets, étalés sur la grille (entre 15 cm et 1,05 m au-dessus du sol)
  const bas = new Map();
  let nTri = 0;
  for (const o of L.objets) {
    const g = o.fin.geometrie || o.fin.geometry || o.fin;
    const pos = g.attributes?.position?.array;
    if (!pos) continue;
    const c = Math.cos(o.ry || 0), s = Math.sin(o.ry || 0);
    for (let t = 0; t + 8 < pos.length; t += 9) {
      nTri++;
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, y0 = 1e9, y1 = -1e9;
      const P = [];
      for (let k = 0; k < 3; k++) {
        const lx = pos[t + k * 3], ly = pos[t + k * 3 + 1], lz = pos[t + k * 3 + 2];
        const x = o.x + lx * c + lz * s, y = o.y + ly, z = o.z - lx * s + lz * c;
        P.push([x, y, z]);
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }
      if (x1 - x0 > 30 || z1 - z0 > 30) continue;
      const i0 = Math.floor(x0 / PAS), i1 = Math.ceil(x1 / PAS), j0 = Math.floor(z0 / PAS), j1 = Math.ceil(z1 / PAS);
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
        const k = cle(i, j);
        let h = vus.get(k);
        // (--corps : aussi les cases voisines de là où l'on va, à la hauteur de leur voisine : le corps a une épaisseur)
        if (h === undefined && CORPS) { for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) { const hv = vus.get(cle(i + di, j + dj)); if (hv !== undefined) { h = hv; break; } } }
        if (h === undefined) continue;
        if (y1 < h + 0.15 || y0 > h + 1.05) continue;
        // le point de la case dans le triangle (vu de dessus) ?
        const x = i * PAS, z = j * PAS, [A, B, C] = P;
        const d = (B[2] - C[2]) * (A[0] - C[0]) + (C[0] - B[0]) * (A[2] - C[2]);
        let dedans = false, yy = 0;
        if (Math.abs(d) > 1e-9) {
          const a = ((B[2] - C[2]) * (x - C[0]) + (C[0] - B[0]) * (z - C[2])) / d, b = ((C[2] - A[2]) * (x - C[0]) + (A[0] - C[0]) * (z - C[2])) / d, cc = 1 - a - b;
          if (a >= -0.02 && b >= -0.02 && cc >= -0.02) { dedans = true; yy = a * A[1] + b * B[1] + cc * C[1]; }
        } else {
          // (un triangle debout : la case est-elle sur son trait, à 6 cm près ?)
          for (let e = 0; e < 3 && !dedans; e++) { const U = P[e], W = P[(e + 1) % 3], ux = W[0] - U[0], uz = W[2] - U[2], l2 = ux * ux + uz * uz; if (l2 < 1e-9) continue; const f = Math.min(1, Math.max(0, ((x - U[0]) * ux + (z - U[2]) * uz) / l2)); if (Math.hypot(x - U[0] - f * ux, z - U[2] - f * uz) < 0.06) { dedans = true; yy = (y0 + y1) / 2; } }
        }
        if (dedans && yy > h + 0.15 && yy < h + 1.05) bas.set(k, (bas.get(k) || 0) + 1);
      }
    }
  }
  const dans = [];
  for (const [k] of bas) { const i = Math.round(k / 100003), j = k - i * 100003; if (vus.has(k) || CORPS) dans.push([+(i * PAS).toFixed(2), +(j * PAS).toFixed(2)]); }
  return { zones: zones.map((z) => z.length), cases: toutes.map(([i, j]) => [i, j]), actions, passants, dans, nTri };
}
"""

with sync_playwright() as pw:
    nav = pw.chromium.launch(channel='msedge', headless=True, args=['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'])
    p = nav.new_context(viewport={'width': 1280, 'height': 720}).new_page()
    p.on('pageerror', lambda e: print('ERREUR page :', e))
    url = f'http://localhost:{PORT}/balade/?lieu={LIEU}&perso=garcon&langue=fr&compagnon=kon'
    p.goto(url)
    p.evaluate("localStorage.clear(); localStorage.setItem('modeDev', 'oui'); localStorage.setItem('baladeYakushima', 'oui')")
    p.goto(url)
    p.wait_for_function('window.__pret === true', timeout=180000)
    for _ in range(60):
        p.wait_for_timeout(150)
        if p.evaluate("balade.etat.mode !== 'dialogue' && document.querySelector('.dialogue').hidden"): break
        if p.evaluate("!document.querySelector('.dialogue-choix').hidden"): p.keyboard.press('Enter')
        else: p.keyboard.press('KeyE')
    if NUIT:
        p.evaluate("balade.jeu.nuit(true)"); p.wait_for_timeout(2800)
    r = p.evaluate(JS, {'PAS': PAS, 'DEPARTS': DEPARTS, 'CORPS': CORPS})
    nav.close()

print('cases où l\'on va, par départ :', r['zones'], '| surface :', round(sum(r['zones']) * PAS * PAS), 'm² | triangles du décor :', r['nTri'])
ko = [a for a in r['actions'] if not a['ok']]
print(f"actions : {len(r['actions'])}, hors d'atteinte : {len(ko)}")
for a in ko: print('   HORS D\'ATTEINTE :', a)
for q in r['passants']:
    if q['parle'] and not any(a['id'] == q['id'] and a['ok'] for a in r['actions']): pass
    if q['dans']: print('   passant debout là où l\'on marche (obstacle au milieu ?) :', q['id'], q['x'], q['z'])
print('cases dans le décor (jusqu\'à 40) :', len(r['dans']))
# regroupées par paquets voisins
groupes = []
for x, z in sorted(r['dans']):
    for g in groupes:
        if any(abs(x - a) <= PAS * 2.1 and abs(z - b) <= PAS * 2.1 for a, b in g[-60:]): g.append((x, z)); break
    else: groupes.append([(x, z)])
for g in sorted(groupes, key=len, reverse=True)[:40]:
    xs = [q[0] for q in g]; zs = [q[1] for q in g]
    print(f"   {len(g):4d} case(s) autour de ({sum(xs)/len(xs):.1f}, {sum(zs)/len(zs):.1f})  x {min(xs):.1f}..{max(xs):.1f}  z {min(zs):.1f}..{max(zs):.1f}")
json.dump(r, open(D / 'atteindre.json', 'w'), ensure_ascii=False)

# les plans
E = 5  # pixels par mètre
cases = r['cases']
for nom, (zmin, zmax) in {'A': (-200, 80), 'B': (-470, -270)}.items():
    cs = [(i * PAS, j * PAS) for i, j in cases if zmin < j * PAS < zmax]
    if not cs: continue
    x0 = min(c[0] for c in cs) - 8; x1 = max(c[0] for c in cs) + 8; z0 = min(c[1] for c in cs) - 8; z1 = max(c[1] for c in cs) + 8
    im = Image.new('RGB', (round((x1 - x0) * E), round((z1 - z0) * E)), '#f4f4f0')
    d = ImageDraw.Draw(im)
    px = lambda x, z: ((x - x0) * E, (z - z0) * E)
    for x, z in cs: a = px(x, z); d.rectangle([a[0] - PAS * E / 2, a[1] - PAS * E / 2, a[0] + PAS * E / 2, a[1] + PAS * E / 2], fill='#c9ccd2')
    for x, z in r['dans']:
        if zmin < z < zmax: a = px(x, z); d.rectangle([a[0] - 1.5, a[1] - 1.5, a[0] + 1.5, a[1] + 1.5], fill='#e0261c')
    for a in r['actions']:
        if a.get('x') is None or not (zmin < a['z'] < zmax): continue
        q = px(a['x'], a['z']); d.ellipse([q[0] - 3, q[1] - 3, q[0] + 3, q[1] + 3], outline='#1c5fe0' if a['ok'] else '#e0261c', width=2)
    for q in r['passants']:
        if zmin < q['z'] < zmax: a = px(q['x'], q['z']); d.ellipse([a[0] - 2.5, a[1] - 2.5, a[0] + 2.5, a[1] + 2.5], fill='#1c9a3c')
    for gx in range(int(x0 // 10) * 10, int(x1) + 1, 10):
        a = px(gx, z0); d.line([a[0], 0, a[0], im.height], fill='#dedcd4'); d.text((a[0] + 2, 2), str(gx), fill='#777')
    for gz in range(int(z0 // 10) * 10, int(z1) + 1, 10):
        a = px(x0, gz); d.line([0, a[1], im.width, a[1]], fill='#dedcd4'); d.text((2, a[1] + 2), str(gz), fill='#777')
    im.save(D / f'plan_{nom}.png'); print(D / f'plan_{nom}.png', im.size)
