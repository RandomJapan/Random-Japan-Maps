# -*- coding: utf-8 -*-
"""Les scintillements : deux faces du décor dans le même plan (à moins de --tol mètre l'une de l'autre, tournées du même côté) qui se
recouvrent. Tout ce que la scène dessine (sauf les traits, les points, ce qui ne s'écrit pas dans la profondeur). Regroupés par endroit.
    python outils/balade/coplanaires.py --lieu iiyama [--tol 0.0015] [--aire 0.0004] [--tout]   (--tout : aussi les paires de même couleur)"""
import sys, json
from playwright.sync_api import sync_playwright
sys.stdout.reconfigure(encoding='utf-8')
ARGS = sys.argv[1:]
opt = lambda n, d=None: ARGS[ARGS.index(n) + 1] if n in ARGS else d
LIEU, TOL, AIRE, TOUT = (opt('--lieu') or sys.exit(__doc__)), float(opt('--tol', '0.0015')), float(opt('--aire', '0.0004')), '--tout' in ARGS

JS = r"""
({ TOL, AIRE, TOUT }) => {
  const scene = balade.scene;
  scene.updateMatrixWorld(true);
  const meshes = [];
  scene.traverse((o) => {
    if (!o.isMesh || o.isSkinnedMesh) return;
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    if (!m || m.side === 1 || m.depthWrite === false || m.colorWrite === false) return;
    if (!o.geometry?.attributes?.position) return;
    meshes.push(o);
  });
  // tous les triangles, dans le monde : ax ay az bx by bz cx cy cz, normale, d, l'objet, la couleur
  const T = [];
  const M = new Float64Array(16);
  const app = (e, x, y, z) => [e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]];
  const mul = (a, b) => { const r = new Array(16).fill(0); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) r[j * 4 + i] += a[k * 4 + i] * b[j * 4 + k]; return r; };
  let nm = 0;
  for (const o of meshes) {
    const g = o.geometry, P = g.attributes.position, I = g.index, C = g.attributes.color;
    const nb = I ? I.count : P.count;
    const mats = [];
    if (o.isInstancedMesh) { for (let k = 0; k < o.count; k++) mats.push(mul(o.matrixWorld.elements, o.instanceMatrix.array.slice(k * 16, k * 16 + 16))); }
    else mats.push(o.matrixWorld.elements);
    const nom = (o.name || '') + '|' + (o.parent?.name || '') + '#' + nm++;
    for (const e of mats) {
      for (let t = 0; t + 2 < nb; t += 3) {
        const i0 = I ? I.getX(t) : t, i1 = I ? I.getX(t + 1) : t + 1, i2 = I ? I.getX(t + 2) : t + 2;
        const a = app(e, P.getX(i0), P.getY(i0), P.getZ(i0)), b = app(e, P.getX(i1), P.getY(i1), P.getZ(i1)), c = app(e, P.getX(i2), P.getY(i2), P.getZ(i2));
        const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        const l = Math.hypot(nx, ny, nz);
        if (l < 2e-6) continue;
        nx /= l; ny /= l; nz /= l;
        const col = C ? [C.getX(i0), C.getY(i0), C.getZ(i0)] : [-1, -1, -1];
        T.push({ a, b, c, n: [nx, ny, nz], d: nx * a[0] + ny * a[1] + nz * a[2], o: nom, col, mat: (o.material.name || o.material.type) });
      }
    }
  }
  // regroupés par plan (normale arrondie, distance par tranches de TOL*4) ; chaque triangle aussi dans la tranche voisine s'il en est près
  const groupes = new Map();
  const pas = Math.max(TOL * 4, 0.004);
  for (let i = 0; i < T.length; i++) {
    const t = T[i], kn = t.n.map((v) => Math.round(v * 40)).join(','), q = t.d / pas, k0 = Math.floor(q);
    const cles = [k0]; if (q - k0 < 0.3) cles.push(k0 - 1); else if (q - k0 > 0.7) cles.push(k0 + 1);
    for (const k of cles) { const key = kn + '|' + k; let g = groupes.get(key); if (!g) groupes.set(key, (g = [])); g.push(i); }
  }
  // l'aire commune de deux triangles du même plan (projetés sur les deux axes que la normale laisse)
  const aire2 = (p) => { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - a[1] * b[0]; } return s / 2; };
  const couper = (poly, a, b) => {
    const out = [], cote = (p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length], cp = cote(p), cq = cote(q);
      if (cp >= 0) out.push(p);
      if ((cp >= 0) !== (cq >= 0)) { const f = cp / (cp - cq); out.push([p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f]); }
    }
    return out;
  };
  const commun = (t1, t2) => {
    const n = t1.n, ax = Math.abs(n[0]) > Math.abs(n[1]) ? (Math.abs(n[0]) > Math.abs(n[2]) ? 0 : 2) : (Math.abs(n[1]) > Math.abs(n[2]) ? 1 : 2);
    const u = (ax + 1) % 3, v = (ax + 2) % 3, pr = (p) => [p[u], p[v]];
    let A = [pr(t1.a), pr(t1.b), pr(t1.c)], B = [pr(t2.a), pr(t2.b), pr(t2.c)];
    if (aire2(A) < 0) A.reverse(); if (aire2(B) < 0) B.reverse();
    let poly = A;
    for (let i = 0; i < 3 && poly.length; i++) poly = couper(poly, B[i], B[(i + 1) % 3]);
    if (poly.length < 3) return null;
    const s = Math.abs(aire2(poly)) / Math.abs(n[ax]);
    let cx = 0, cy = 0; for (const p of poly) { cx += p[0]; cy += p[1]; } cx /= poly.length; cy /= poly.length;
    // le milieu, dans le monde
    const m = [0, 0, 0]; m[u] = cx; m[v] = cy; m[ax] = (t1.d - n[u] * cx - n[v] * cy) / n[ax];
    return { s, m };
  };
  const boite = (t) => [Math.min(t.a[0], t.b[0], t.c[0]), Math.max(t.a[0], t.b[0], t.c[0]), Math.min(t.a[1], t.b[1], t.c[1]), Math.max(t.a[1], t.b[1], t.c[1]), Math.min(t.a[2], t.b[2], t.c[2]), Math.max(t.a[2], t.b[2], t.c[2])];
  const vus = new Set(), res = [];
  let paires = 0;
  for (const g of groupes.values()) {
    if (g.length < 2) continue;
    // (un grand groupe : par cases de 2 m)
    const cases = new Map();
    for (const i of g) {
      const b = (T[i].bb ||= boite(T[i]));
      for (let x = Math.floor(b[0] / 2); x <= Math.floor(b[1] / 2); x++) for (let y = Math.floor(b[2] / 2); y <= Math.floor(b[3] / 2); y++) for (let z = Math.floor(b[4] / 2); z <= Math.floor(b[5] / 2); z++) {
        const k = x + ',' + y + ',' + z; let c = cases.get(k); if (!c) cases.set(k, (c = [])); c.push(i);
      }
    }
    for (const c of cases.values()) {
      for (let p = 0; p < c.length; p++) for (let q = p + 1; q < c.length; q++) {
        const i = c[p], j = c[q], t1 = T[i], t2 = T[j];
        if (Math.abs(t1.d - t2.d) > TOL) continue;
        if (t1.n[0] * t2.n[0] + t1.n[1] * t2.n[1] + t1.n[2] * t2.n[2] < 0.9995) continue;
        const b1 = t1.bb, b2 = t2.bb;
        if (b1[1] < b2[0] || b2[1] < b1[0] || b1[3] < b2[2] || b2[3] < b1[2] || b1[5] < b2[4] || b2[5] < b1[4]) continue;
        const cle = i < j ? i + ':' + j : j + ':' + i;
        if (vus.has(cle)) continue;
        vus.add(cle);
        paires++;
        const memeCouleur = Math.abs(t1.col[0] - t2.col[0]) + Math.abs(t1.col[1] - t2.col[1]) + Math.abs(t1.col[2] - t2.col[2]) < 0.012 && t1.o === t2.o;
        if (memeCouleur && !TOUT) continue;
        const r = commun(t1, t2);
        if (!r || r.s < AIRE) continue;
        res.push({ m: r.m.map((v) => +v.toFixed(2)), s: r.s, ecart: +(t1.d - t2.d).toFixed(4), n: t1.n.map((v) => +v.toFixed(2)), o1: t1.o, o2: t2.o, c1: t1.col.map((v) => +v.toFixed(2)), c2: t2.col.map((v) => +v.toFixed(2)), meme: memeCouleur });
      }
    }
  }
  // regroupés par endroit (cases de 1 m) et par paire de couleurs
  const lieux = new Map();
  for (const r of res) {
    const k = r.m.map((v) => Math.round(v)).join(',') + '|' + r.n.join(',') + '|' + r.c1.join(',') + '|' + r.c2.join(',');
    let L = lieux.get(k);
    if (!L) lieux.set(k, (L = { ...r, s: 0, nb: 0 }));
    L.s += r.s; L.nb++;
  }
  return { triangles: T.length, objets: meshes.length, paires, endroits: [...lieux.values()].sort((a, b) => b.s - a.s) };
}
"""
with sync_playwright() as pw:
    nav = pw.chromium.launch(channel='msedge', headless=True, args=['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'])
    p = nav.new_context(viewport={'width': 1280, 'height': 720}).new_page()
    p.on('pageerror', lambda e: print('ERREUR page :', e))
    url = f'http://localhost:8123/balade/?lieu={LIEU}&perso=garcon&langue=fr&compagnon=kon'
    p.goto(url); p.evaluate("localStorage.clear(); localStorage.setItem('modeDev', 'oui'); localStorage.setItem('baladeYakushima', 'oui')"); p.goto(url)
    p.wait_for_function('window.__pret === true', timeout=180000)
    r = p.evaluate(JS, {'TOL': TOL, 'AIRE': AIRE, 'TOUT': TOUT})
    print(f"{r['objets']} objets, {r['triangles']} triangles, {r['paires']} paires dans le même plan ; {len(r['endroits'])} endroits")
    DIFF = float(opt('--diff', '0'))
    liste = [e for e in r['endroits'] if not (abs(e['m'][0]) < 2 and abs(e['m'][2]) < 2) and sum(abs(a - b) for a, b in zip(e['c1'], e['c2'])) >= DIFF]
    print(len(liste), 'endroits gardés (hors des personnages à l’origine, couleurs écartées de', DIFF, 'au moins)')
    for e in liste[:int(opt('--n', '80'))]:
        print(f"  {e['m']}  {e['s'] * 1e4:7.0f} cm²  ({e['nb']} paires)  écart {e['ecart']}  normale {e['n']}  couleurs {e['c1']} / {e['c2']}{'  (même couleur)' if e['meme'] else ''}  [{e['o1']} | {e['o2']}]")
    nav.close()
