# -*- coding: utf-8 -*-
"""Les pieds dedans : partout où l'on peut marcher (tout ce qu'on atteint à pied, cases de 25 cm), ce qui est DESSINÉ monte-t-il dans les jambes ?
(des marches sans rampe, un socle sans mur, une bordure : on y entre, on s'y enfonce.) La carte des hauteurs de ce qui est dessiné vient de la carte
graphique : vue de dessus, orthographique, tout ce qui est plus haut que les pieds + 65 à 115 cm est coupé ; on garde le plus haut en dessous.
python -u outils/balade/pieds_dedans.py --lieu tsubosaka [--seuil 0.2] [--json fichier.json]"""
import sys, json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))  # (commun.py, à côté)
from commun import Balade, ARGS, opt
from playwright.sync_api import sync_playwright
sys.stdout.reconfigure(encoding='utf-8')
SEUIL = float(opt('--seuil', 0.2))
LIEU = (opt('--lieu') or sys.exit(__doc__))
JS_PARCOURS = r"""(() => {
  const M = balade.monde(), L = M.lieu, m = L.monde, PAS = 0.25, SOUS = 2, niv = (y) => Math.floor((y + 50) / 2.2), vus = new Map();
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const parcourir = (x0, z0, y0) => {
    const i0 = Math.round(x0 / PAS), j0 = Math.round(z0 / PAS), X = i0 * PAS, Z = j0 * PAS;
    let y = y0; if (y === undefined || y === null || !Number.isFinite(y)) y = m.hauteur(X, Z);
    y = m.hauteur(X, Z, y + 0.3);
    if (!m.libre(X, Z, y) || vus.has(i0 + ',' + j0 + ',' + niv(y))) return;
    const file = [[i0, j0, y]]; vus.set(i0 + ',' + j0 + ',' + niv(y), [i0, j0, y]);
    while (file.length) {
      const [i, j, yc] = file.pop(), x = i * PAS, z = j * PAS;
      for (const [di, dj] of DIRS) {
        let ok = true, yy = yc;
        for (let f = 1; f <= SOUS; f++) {
          const px = x + (di * PAS * f) / SOUS, pz = z + (dj * PAS * f) / SOUS;
          if (!m.libre(px, pz, yy)) { ok = false; break; }
          yy = m.hauteur(px, pz, yy);
        }
        if (!ok) continue;
        const k = (i + di) + ',' + (j + dj) + ',' + niv(yy);
        if (vus.has(k)) continue;
        vus.set(k, [i + di, j + dj, yy]); file.push([i + di, j + dj, yy]);
      }
    }
  };
  const d = L.depart; parcourir(d.x, d.z);
  for (const q of L.interactions || []) if (!q.passant && q.x !== undefined) for (const [ox, oz] of [[0, 0], [0.5, 0], [-0.5, 0], [0, 0.5], [0, -0.5], [1, 0], [-1, 0], [0, 1], [0, -1]]) parcourir(q.x + ox, q.z + oz, q.y);
  window.__cases = [...vus.values()];
  return window.__cases.length;
})()"""
JS_CARTES = r"""(async (SEUIL) => {
  const T = await import('https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.min.js');
  const { scene, rendu } = balade, M = balade.monde(), PAS = 0.25;
  // (on cache ce qui bouge : le voyageur, son compagnon, les passants, les bêtes ; et ce qui n'est pas un maillage)
  const caches = [];
  const cacher = (o) => { if (o && o.isObject3D && o.visible) { o.visible = false; caches.push(o); } };
  cacher(M.joueur && M.joueur.objet); cacher(M.kon && (M.kon.objet || M.kon));
  for (const c of Object.values(M.compagnons || {})) cacher(c && (c.objet || c));  // (un objet { kon, pon… } depuis les six compagnons)
  for (const q of M.passants || []) cacher(q.perso && (q.perso.objet || q.perso));
  for (const b of [].concat(M.betes || [], M.daims || [], M.mouettes || [])) cacher(b && (b.objet || b));
  scene.traverse((o) => { if ((o.isSprite || o.isPoints || o.isLine) && o.visible) { o.visible = false; caches.push(o); } });
  const mat = new T.ShaderMaterial({
    uniforms: { uClip: { value: 0 } }, side: T.DoubleSide, toneMapped: false,
    vertexShader: 'varying float vY; void main() { vec4 p = vec4(position, 1.0);\n#ifdef USE_INSTANCING\n p = instanceMatrix * p;\n#endif\n vec4 w = modelMatrix * p; vY = w.y; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: 'uniform float uClip; varying float vY; void main() { if (vY > uClip) discard; gl_FragColor = vec4(vY + 1000.0, 0.0, 0.0, 1.0); }',
  });
  const N = 512, W = 51.2, px = W / N;
  const rt = new T.WebGLRenderTarget(N, N, { type: T.FloatType, format: T.RGBAFormat, depthBuffer: true, minFilter: T.NearestFilter, magFilter: T.NearestFilter });
  const buf = new Float32Array(N * N * 4);
  const cam = new T.OrthographicCamera(-W / 2, W / 2, W / 2, -W / 2, 0.05, 400); cam.up.set(0, 0, -1);
  const fond = new T.Color(); rendu.getClearColor(fond); const alpha = rendu.getClearAlpha(), ancien = scene.overrideMaterial, rtAvant = rendu.getRenderTarget();
  scene.overrideMaterial = mat; rendu.setClearColor(0x000000, 0);
  const cases = window.__cases, tuiles = new Map();
  let xmin = Infinity, zmin = Infinity;
  for (const [i, j] of cases) { xmin = Math.min(xmin, i * PAS); zmin = Math.min(zmin, j * PAS); }
  xmin -= 1; zmin -= 1;
  for (const c of cases) {
    const x = c[0] * PAS, z = c[1] * PAS, ti = Math.floor((x - xmin) / W), tj = Math.floor((z - zmin) / W), Lc = Math.ceil((c[2] + 0.65) / 0.5) * 0.5;
    const k = ti + ',' + tj; if (!tuiles.has(k)) tuiles.set(k, new Map());
    const t = tuiles.get(k); if (!t.has(Lc)) t.set(Lc, []); t.get(Lc).push(c);
  }
  const marques = []; let rendus = 0;
  for (const [k, niveaux] of tuiles) {
    const [ti, tj] = k.split(',').map(Number), cx = xmin + (ti + 0.5) * W, cz = zmin + (tj + 0.5) * W;
    for (const [Lc, liste] of niveaux) {
      mat.uniforms.uClip.value = Lc;
      cam.position.set(cx, Lc + 5, cz); cam.lookAt(cx, Lc - 10, cz); cam.far = 200; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
      rendu.setRenderTarget(rt); rendu.clear(); rendu.render(scene, cam); rendus++;
      rendu.readRenderTargetPixels(rt, 0, 0, N, N, buf);
      const lire = (x, z) => { const i = Math.floor((x - (cx - W / 2)) / px), j = Math.floor(((cz + W / 2) - z) / px); if (i < 0 || j < 0 || i >= N || j >= N) return -Infinity; const v = buf[(j * N + i) * 4]; return v > 500 ? v - 1000 : -Infinity; };
      for (const c of liste) {
        const x = c[0] * PAS, z = c[1] * PAS, h = c[2];
        const y0 = lire(x, z);
        let y1 = y0; for (const [dx, dz] of [[0.1, 0], [-0.1, 0], [0, 0.1], [0, -0.1], [0.07, 0.07], [-0.07, 0.07], [0.07, -0.07], [-0.07, -0.07]]) y1 = Math.max(y1, lire(x + dx, z + dz));
        if (y0 - h > SEUIL || y1 - h > SEUIL + 0.1) marques.push([+x.toFixed(2), +z.toFixed(2), +h.toFixed(2), +(y0 - h).toFixed(2), +(y1 - h).toFixed(2)]);
      }
    }
  }
  scene.overrideMaterial = ancien; rendu.setRenderTarget(rtAvant); rendu.setClearColor(fond, alpha); for (const o of caches) o.visible = true; rt.dispose(); mat.dispose();
  const gens = (M.passants || []).map((q) => [q.etat ? q.etat.x : q.x, q.etat ? q.etat.z : q.z]);
  return { rendus, tuiles: tuiles.size, marques, gens };
})"""
with sync_playwright() as pw:
    b = Balade(pw, lieu=LIEU, perso='fille', compagnon='kon')
    p = b.p
    n = p.evaluate(JS_PARCOURS)
    print(f'{LIEU} : {n} cases atteintes à pied', flush=True)
    r = p.evaluate(JS_CARTES, SEUIL)
    print(f"{r['rendus']} vues de dessus, {r['tuiles']} tuiles ; {len(r['marques'])} cases marquées (au centre > {SEUIL} m, ou à 10 cm autour > {SEUIL + 0.1:.2f} m)", flush=True)
    gens = r['gens']
    # (les marques groupées : des cases voisines, à moins de 40 cm, à la même hauteur à 1 m près)
    M = r['marques']; vus = [False] * len(M); groupes = []
    idx = {}
    for k, (x, z, h, e0, e1) in enumerate(M): idx.setdefault((round(x / 0.25), round(z / 0.25)), []).append(k)
    for k in range(len(M)):
        if vus[k]: continue
        pile = [k]; vus[k] = True; g = []
        while pile:
            q = pile.pop(); g.append(q); x, z = M[q][0], M[q][1]
            for di in (-1, 0, 1):
                for dj in (-1, 0, 1):
                    for q2 in idx.get((round(x / 0.25) + di, round(z / 0.25) + dj), []):
                        if not vus[q2] and abs(M[q2][2] - M[q][2]) < 1.0: vus[q2] = True; pile.append(q2)
        groupes.append(g)
    sortie = []
    for g in groupes:
        xs = [M[q][0] for q in g]; zs = [M[q][1] for q in g]; hs = [M[q][2] for q in g]; e0 = max(M[q][3] for q in g); e1 = max(M[q][4] for q in g)
        cx, cz = sum(xs) / len(xs), sum(zs) / len(zs)
        pres = min((((gx - cx) ** 2 + (gz - cz) ** 2) ** 0.5 for gx, gz in gens), default=99)
        sortie.append((len(g), cx, cz, min(hs), max(hs), e0, e1, min(xs), max(xs), min(zs), max(zs), pres))
    sortie.sort(key=lambda s: -s[0])
    print(f'{len(sortie)} groupes :')
    for s in sortie:
        n, cx, cz, h0, h1, e0, e1, x0, x1, z0, z1, pres = s
        print(f'  {n:4d} cases autour de ({cx:7.2f}, {cz:7.2f}) y {h0:.2f}–{h1:.2f} : dessiné jusqu’à {e0:.2f} m au-dessus des pieds (autour {e1:.2f}) ; x {x0:.2f}…{x1:.2f}, z {z0:.2f}…{z1:.2f}' + (f' ; une personne à {pres:.1f} m' if pres < 1.5 else ''))
    if opt('--json'): json.dump(sortie, open(opt('--json'), 'w'))
    print('erreurs', b.erreurs[:3])
    b.fermer()
