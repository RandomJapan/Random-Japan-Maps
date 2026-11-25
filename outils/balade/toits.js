// Les toits qui flottent (2026-10-31, Udo, le propriétaire : « les toits des bâtiments ne sont jamais reliés à leur
// structure ») : pour chaque toit fait par a.toitJapon dans un lieu, on descend du dessous du toit, le long de lignes qui
// vont du bord vers le milieu (perpendiculaires à chaque bord), et on cherche la chose la plus proche sous lui (mur, poutre,
// bandeau, poteau). Sur une ligne, le vide = le plus petit écart entre le dessous du toit et ce qu'il y a dessous ; pour un
// côté, la médiane des lignes. Un côté dont le vide dépasse 12 cm : le toit flotte de ce côté.
// Une fonction lancée dans une page du site par toits.py (elle prend three.js et les modules au site, comme la balade) ;
// avant le 2026-11-25, c'était toits.mjs, lancé par Node avec une copie de three.js dans un dossier temporaire, effacée depuis.
async ({ LIEU, TOUT }) => {
  const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.min.js');
  const { ateliers } = await import('/modeles3d.js');
  const { creerStyle } = await import('/balade/styles.js');
  const module = await import(`/balade/${LIEU}.js`);
  const lignes = [];
  const style = creerStyle(), P = style.palette;
  const base = ateliers(THREE, style.repeindre, style.matieres, module.sortesNuit?.(P));
  const FICHIER = `${LIEU}.js`, re = new RegExp(`${LIEU}\\.js:(\\d+)`);
  const parFin = new Map(), toits = [];
  let enToit = null;
  const atelier = () => {
    const a = base(), liste = [], piece0 = a.piece, fin0 = a.fin, toit0 = a.toitJapon;
    a.piece = (geo, c, o = {}) => {
      const m = new THREE.Matrix4().compose(
        new THREE.Vector3(o.x || 0, o.y || 0, o.z || 0),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx || 0, o.ry || 0, o.rz || 0, o.ordre || 'XYZ')),
        new THREE.Vector3(o.sx ?? o.s ?? 1, o.sy ?? o.s ?? 1, o.sz ?? o.s ?? 1),
      );
      const g = geo.index ? geo.toNonIndexed() : geo.clone();
      if (o.deformer) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setXYZ(i, ...o.deformer(p.getX(i), p.getY(i), p.getZ(i))); }
      g.applyMatrix4(m);
      const pile = new Error().stack.split('\n').filter((l) => l.includes(FICHIER));
      const ligne = +(pile[0]?.match(re)?.[1] || 0);
      const pc = { pos: Float32Array.from(g.attributes.position.array), c, ligne, sorte: o.sorte };
      if (enToit && !enToit.piece) { enToit.piece = pc; enToit.m = m; }
      liste.push(pc);
      return piece0(geo, c, o);
    };
    a.toitJapon = (largeur, profondeur, h, ratioHaut, o = {}) => {
      const t = { largeur, profondeur, h, ratioHaut, o, piece: null, liste };
      enToit = t;
      try { return toit0(largeur, profondeur, h, ratioHaut, o); } finally { enToit = null; if (Math.min(largeur, profondeur) >= 1.6) toits.push(t); }
    };
    a.fin = (...args) => { const f = fin0(...args); parFin.set(f, liste); return f; };
    return a;
  };
  const ctx = { THREE, atelier, P, peinture: true, maillage: () => new THREE.Group() };
  ctx.perso = ctx;
  const L = module.construire(ctx);
  // les pièces dans le monde (posées comme leur objet) ; le repère de chaque toit
  const tris = [];
  for (const o of L.objets) {
    const liste = parFin.get(o.fin) || [];
    const c = Math.cos(o.ry || 0), s = Math.sin(o.ry || 0);
    const versMonde = (x, y, z) => [o.x + x * c + z * s, o.y + y, o.z - x * s + z * c];
    for (const pc of liste) {
      pc.monde = versMonde;
      const p = pc.pos;
      for (let k = 0; k < p.length; k += 9) {
        const A = versMonde(p[k], p[k + 1], p[k + 2]), B = versMonde(p[k + 3], p[k + 4], p[k + 5]), C = versMonde(p[k + 6], p[k + 7], p[k + 8]);
        tris.push({ A, B, C, pc });
      }
    }
  }
  // une grille de 0,5 m sur x, z : les triangles par case
  const CASE = 0.5, grille = new Map();
  const cle = (i, j) => i * 100003 + j;
  for (const t of tris) {
    const x0 = Math.min(t.A[0], t.B[0], t.C[0]), x1 = Math.max(t.A[0], t.B[0], t.C[0]), z0 = Math.min(t.A[2], t.B[2], t.C[2]), z1 = Math.max(t.A[2], t.B[2], t.C[2]);
    if (x1 - x0 > 60 || z1 - z0 > 60) continue;
    for (let i = Math.floor(x0 / CASE); i <= Math.floor(x1 / CASE); i++) for (let j = Math.floor(z0 / CASE); j <= Math.floor(z1 / CASE); j++) {
      const k = cle(i, j);
      if (!grille.has(k)) grille.set(k, []);
      grille.get(k).push(t);
    }
  }
  /** Le triangle coupé à une colonne carrée de demi-côté r autour de (x, z) : ses sommets (Sutherland–Hodgman). */
  function dansColonne(A, B, C, x, z, r) {
    let poly = [A, B, C];
    for (const [ax, sg, v] of [[0, 1, x - r], [0, -1, x + r], [2, 1, z - r], [2, -1, z + r]]) {
      const sortie = [];
      for (let i = 0; i < poly.length; i++) {
        const P1 = poly[i], P2 = poly[(i + 1) % poly.length], d1 = (P1[ax] - v) * sg, d2 = (P2[ax] - v) * sg;
        if (d1 >= 0) sortie.push(P1);
        if ((d1 >= 0) !== (d2 >= 0)) { const f = d1 / (d1 - d2); sortie.push([P1[0] + (P2[0] - P1[0]) * f, P1[1] + (P2[1] - P1[1]) * f, P1[2] + (P2[2] - P1[2]) * f]); }
      }
      poly = sortie;
      if (!poly.length) return poly;
    }
    return poly;
  }
  /** La première chose sous (x, y, z), hors de la pièce exclue, dans une colonne de 6 cm (les faces verticales d'un bandeau
   *  comptent : un rayon seul passait à côté) : son écart (0 si elle monte jusque-là ; Infinity si rien à 6 m). */
  function dessousDe(x, y, z, exclue) {
    const liste = grille.get(cle(Math.floor(x / CASE), Math.floor(z / CASE))) || [];
    let mieux = Infinity;
    for (const { A, B, C, pc } of liste) {
      if (pc === exclue) continue;
      if (Math.min(A[1], B[1], C[1]) > y + 1e-3) continue;
      const poly = dansColonne(A, B, C, x, z, 0.03);
      if (!poly.length) continue;
      let haut = -Infinity, bas = Infinity;
      for (const q of poly) { haut = Math.max(haut, q[1]); bas = Math.min(bas, q[1]); }
      if (bas > y + 1e-3) continue;
      const ecart = haut >= y ? 0 : y - haut;
      if (ecart < mieux) mieux = ecart;
    }
    return mieux > 6 ? Infinity : mieux;
  }
  /** Le dessous d'un toit de toitJapon en (x, z) depuis son milieu, au-dessus de son bord (comme a.toitJapon). */
  function dessousToit(t, x, z) {
    const Lh = t.largeur / 2, Ph = t.profondeur / 2, r = t.ratioHaut, { creux = 1.7, releve = 0.05, epaisseur = 0.022 } = t.o;
    for (const [travers, long, A, B] of [[z, x, Ph, Lh], [x, z, Lh, Ph], [-z, x, Ph, Lh], [-x, z, Lh, Ph]]) {
      if (travers <= 1e-6) continue;
      const w = (long * A) / (travers * B);
      if (Math.abs(w) > 1) continue;
      const e = w ** 4, s = travers / A;
      let v0 = 0, v1 = 1;
      for (let k = 0; k < 22; k++) { const v = (v0 + v1) / 2; if ((1 - v * (1 - r)) * (1 + 0.06 * e * (1 - v)) > s) v0 = v; else v1 = v; }
      const v = (v0 + v1) / 2;
      return t.h * v ** creux + releve * e * (1 - v) ** 2 - epaisseur;
    }
    return t.h - epaisseur;
  }
  const mediane = (l) => { const s = [...l].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
  const rapport = [];
  for (const t of toits) {
    if (!t.piece?.monde) continue;
    const Lh = t.largeur / 2, Ph = t.profondeur / 2, cotes = [];
    // (les quatre bords : +z, +x, −z, −x ; des lignes du bord vers le milieu, à 20 %…80 % de la longueur du bord)
    for (const [nom, bord, long, ax] of [['avant', Ph, Lh, 'z'], ['droite', Lh, Ph, 'x'], ['arriere', -Ph, Lh, 'z'], ['gauche', -Lh, Ph, 'x']]) {
      const vides = [];
      for (let i = 2; i <= 8; i++) {
        const u = -long + (2 * long * i) / 10;
        let vide = Infinity;
        for (let s = 0.12; s < Math.abs(bord); s += 0.05) {
          const lx = ax === 'z' ? u : Math.sign(bord) * (Math.abs(bord) - s), lz = ax === 'z' ? Math.sign(bord) * (Math.abs(bord) - s) : u;
          const ly = dessousToit(t, lx, lz) - 0.002, q = new THREE.Vector3(lx, ly, lz).applyMatrix4(t.m), w = t.piece.monde(q.x, q.y, q.z);
          vide = Math.min(vide, dessousDe(w[0], w[1], w[2], t.piece));
        }
        vides.push(vide);
      }
      cotes.push([nom, mediane(vides)]);
    }
    const pire = Math.max(...cotes.map(([, v]) => v));
    const centre = t.piece.monde(...new THREE.Vector3(0, 0, 0).applyMatrix4(t.m).toArray());
    rapport.push({ ligne: t.piece.ligne, taille: `${t.largeur.toFixed(1)}×${t.profondeur.toFixed(1)}`, ou: centre.map((v) => +v.toFixed(1)), cotes, pire });
  }
  let flotte = 0;
  for (const r of rapport.sort((a, b) => b.pire - a.pire)) {
    const mauvais = r.pire > 0.12;
    flotte += mauvais;
    if (!mauvais && !TOUT) continue;
    lignes.push(`${mauvais ? 'FLOTTE' : 'ok    '} ${FICHIER}:${r.ligne} ${r.taille} en ${r.ou.join(', ')} : ${r.cotes.map(([n, v]) => `${n} ${Number.isFinite(v) ? (v * 100).toFixed(0) + ' cm' : 'rien'}`).join(', ')}`);
  }
  lignes.push(`${LIEU} : ${rapport.length} toits, ${flotte} qui flottent`);
  return { lignes, flotte };
}
