// ================================================================
//  Les petits modèles 3D des lieux : un modèle standard par icône de
//  catégorie (un torii pour tous les sanctuaires, une pagode pour
//  toutes les pagodes…), posés sur le relief comme de petites maquettes
//  peintes, cernées d'un trait d'encre sépia comme les vignettes des
//  légendes (matiereContour).
//  Chaque modèle mesure environ 1 de haut et tient dans un disque de
//  rayon 0,5. Le sol est à y = 0 : les fondations descendent dessous,
//  pour que le modèle ne flotte pas sur une pente (le relief les cache).
//  Fabriqués ici avec des formes simples : aucun fichier à télécharger.
// ================================================================

// Couleurs de peinture des modèles : des lavis un peu passés, ceux des vignettes des légendes
const C = {
  vermillon: '#b5452c', noir: '#2c2724', toit: '#4a4a4f', bois: '#8a5a36', boisFonce: '#5b3b25',
  platre: '#eee6d4', pierre: '#a59c8b', pierreFonce: '#7c7466', or: '#c9a13b', feuillage: '#6d8b47',
  pinVert: '#4f6d3d', herbe: '#93a865', eau: '#6aa6a0', ecume: '#e8efe6', sable: '#e0cc9e',
  roche: '#8a7a64', neige: '#f3f0e8', rose: '#e7a4b6', roseFonce: '#d4849a', chaume: '#a8904f',
  bronze: '#6f7563', fumee: '#dcd6cc', rouge: '#b23a2b', blanc: '#f1ece2', verre: '#f2df8a',
  brun: '#7b5a3c', gris: '#b9b3a6', grisFonce: '#6e6a63',
  // la nouvelle palette (vignettes des légendes : encre sépia, mousse, paille, ardoise, ocre, brique)
  encre: '#35251a', tuile: '#535c63', tuileClaire: '#626b70', faitage: '#3b3f44', paille: '#cdb06a',
  pailleFonce: '#a88a45', papier: '#f4ecd8', mousse: '#7aa05a', mousseFonce: '#5b7f45', ardoise: '#a39f92',
  ocre: '#c9a36a', laque: '#b8432a', laqueFonce: '#9a3522', bois2: '#7a5232', pierre2: '#9d978a', pierre3: '#8b8578',
  eauClaire: '#9ec7bf', terre: '#a98f66', bronzeOr: '#9c7c3c', erable: '#c0522f', erableClair: '#d9873a',
  brique: '#9b4a34', briqueClaire: '#a9583f',
};

// Icônes du tableau qui partagent le modèle d'une autre
const ALIAS = { camera: 'viewpoint', star: 'stele', pin: 'stele' };

/** Nom du modèle à utiliser pour une icône du tableau (un emoji ou une icône inconnue → la stèle de pierre). */
export function modelePour(icone, modeles) {
  const nom = ALIAS[icone] || icone;
  return modeles[nom] ? nom : 'stele';
}

/**
 * Le trait d'encre des modèles, comme le cerne des vignettes des légendes : une « coque inversée ». Chaque
 * modèle est redessiné en encre sépia, gonflé le long de ses normales lissées (attribut `contour`), et
 * seules les faces arrière de cette coque se voient : un liseré autour de la silhouette et aux jointures des
 * pièces. epaisseur.value est en unités du modèle (couche3d.js la règle à chaque image pour ~1,4 px à l'écran).
 */
export function matiereContour(THREE, couleur = C.encre) {
  const epaisseur = { value: 0.008 };
  const matiere = new THREE.MeshBasicMaterial({ color: couleur, side: THREE.BackSide });
  matiere.onBeforeCompile = (shader) => {
    shader.uniforms.epaisseur = epaisseur;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 contour;\nuniform float epaisseur;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += contour * epaisseur;');
  };
  return { matiere, epaisseur };
}

const lisse = (b0, b1, v) => { const t = Math.min(1, Math.max(0, (v - b0) / (b1 - b0))); return t * t * (3 - 2 * t); };
/** Un nombre de 0 à 1 qui dépend du point (toujours le même : les modèles ne changent pas d'une visite à l'autre). */
const hasard = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
/** Un contour irrégulier pour parcelle() : rayon moyen r, bosses de ± ecart, toujours le même pour une graine. */
const bosses = (r, ecart = 0.12, graine = 1) => (ang) => r * (1 + ecart * (Math.sin(ang * 3 + graine) * 0.6 + Math.sin(ang * 5 + graine * 2.3) * 0.4));

/** Renvoie la fabrique d'« ateliers » : un atelier assemble des formes colorées en un seul objet (une seule forme à dessiner par modèle). */
function ateliers(THREE) {
  const couleur = new THREE.Color();
  const PI = Math.PI;
  const teintes = new Map(); // « #rrggbb » → [r, g, b], lu une seule fois
  const rvb = (c) => {
    let v = teintes.get(c);
    if (!v) { couleur.set(c); v = [couleur.r, couleur.g, couleur.b]; teintes.set(c, v); }
    return v;
  };
  return function atelier() {
    const morceaux = [];
    const a = {
      /**
       * Ajoute une forme. o : position (x, y, z), rotation (rx, ry, rz, ordre), taille (s, sx, sy, sz), et :
       * - deformer(x, y, z) → [x, y, z] : plie la forme avant de la placer (poutre courbe…) ;
       * - teinte(x, y, z) → couleur : une couleur par triangle, selon son centre (rangs de pierres…) ;
       * - couleurs : une couleur par triangle (dans l'ordre) ;
       * - trait: false : pas de trait d'encre (fumée, petits détails) ; nuance : écart de peinture d'un triangle à l'autre.
       */
      piece(geo, c, o = {}) {
        const m = new THREE.Matrix4().compose(
          new THREE.Vector3(o.x || 0, o.y || 0, o.z || 0),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx || 0, o.ry || 0, o.rz || 0, o.ordre || 'XYZ')),
          new THREE.Vector3(o.sx ?? o.s ?? 1, o.sy ?? o.s ?? 1, o.sz ?? o.s ?? 1),
        );
        const g = geo.index ? geo.toNonIndexed() : geo;
        if (o.deformer) {
          const p = g.attributes.position;
          for (let i = 0; i < p.count; i++) p.setXYZ(i, ...o.deformer(p.getX(i), p.getY(i), p.getZ(i)));
        }
        g.applyMatrix4(m);
        morceaux.push({ pos: g.attributes.position.array, c, teinte: o.teinte, couleurs: o.couleurs, trait: o.trait !== false, nuance: o.nuance ?? 0.05 });
        return a;
      },
      boite: (l, h, p, c, o) => a.piece(new THREE.BoxGeometry(l, h, p), c, o),
      cylindre: (rHaut, rBas, h, cotes, c, o) => a.piece(new THREE.CylinderGeometry(rHaut, rBas, h, cotes), c, o),
      cone: (r, h, cotes, c, o) => a.piece(new THREE.ConeGeometry(r, h, cotes), c, o),
      boule: (r, c, o, finesse = 0) => a.piece(new THREE.IcosahedronGeometry(r, finesse), c, o),
      caillou: (r, c, o) => a.piece(new THREE.DodecahedronGeometry(r, 0), c, o),
      /** Dôme (demi-sphère posée à plat). */
      dome: (r, c, o) => a.piece(new THREE.SphereGeometry(r, 12, 5, 0, 2 * PI, 0, PI / 2), c, o),
      anneau: (r, epaisseur, c, o) => a.piece(new THREE.TorusGeometry(r, epaisseur, 4, 28), c, o),
      /** Toit en croupe : une pyramide tronquée rectangulaire (largeur en x, profondeur en z). */
      toit(largeur, profondeur, h, ratioHaut, c, o) {
        const r = largeur / Math.SQRT2;
        const g = new THREE.CylinderGeometry(r * ratioHaut, r, h, 4, 1).toNonIndexed();
        g.rotateY(PI / 4);
        g.scale(1, 1, profondeur / largeur);
        return a.piece(g, c, o);
      },
      /** Toit à deux pentes : un prisme couché, faîtage le long de x. */
      pignon(largeur, h, profondeur, c, o) {
        const [l, p] = [largeur / 2, profondeur / 2];
        const A = [-l, 0, -p], B = [l, 0, -p], Cc = [l, 0, p], D = [-l, 0, p], E = [-l, h, 0], F = [l, h, 0];
        const tri = [D, Cc, F, D, F, E, B, A, E, B, E, F, A, D, E, Cc, B, F, A, B, Cc, A, Cc, D];
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(tri.flat(), 3));
        return a.piece(g, c, o);
      },
      /**
       * Toit japonais : quatre pans creusés (plus pentus en haut, presque plats au bord) dont les coins se
       * relèvent, avec une épaisseur et un bandeau au bord. Largeur en x, profondeur en z, base (bord du toit)
       * à y = 0 ; en haut, un rectangle ratioHaut fois plus petit (0 : une pointe). Les tuiles font des
       * rangs de deux teintes. o : creux (exposant du profil), releve (hauteur des coins relevés), position…
       */
      toitJapon(largeur, profondeur, h, ratioHaut, o = {}) {
        const { creux = 1.7, releve = 0.05, epaisseur = 0.022, rangs = 14, tuile = C.tuile, tuile2 = C.tuileClaire, bord = C.faitage } = o;
        const L = largeur / 2, P = profondeur / 2;
        const coins = [[-L, P], [L, P], [L, -P], [-L, -P]];
        const tri = [], couleurs = [];
        const nv = 6;
        const point = (k, u, v, dessous) => {
          const [x0, z0] = coins[k], [x1, z1] = coins[(k + 1) % 4];
          const ex = x0 + (x1 - x0) * u, ez = z0 + (z1 - z0) * u;
          const e = Math.abs(2 * u - 1) ** 4;
          const y = h * v ** creux + releve * e * (1 - v) ** 2 - (dessous ? epaisseur : 0);
          // les coins relevés avancent aussi un peu vers l'extérieur
          const f = 1 + 0.06 * e * (1 - v);
          return [ex * (1 - v + v * ratioHaut) * f, y, ez * (1 - v + v * ratioHaut) * f];
        };
        for (let k = 0; k < 4; k++) {
          const nu = Math.max(4, Math.round(rangs * (k % 2 ? profondeur / largeur : 1)));
          for (let i = 0; i < nu; i++) {
            const teinte = i % 2 ? tuile2 : tuile;
            for (let j = 0; j < nv; j++) {
              const [u0, u1, v0, v1] = [i / nu, (i + 1) / nu, j / nv, (j + 1) / nv];
              const A = point(k, u0, v0), B = point(k, u1, v0), Cc = point(k, u1, v1), D = point(k, u0, v1);
              tri.push(A, B, Cc, A, Cc, D);
              couleurs.push(teinte, teinte);
              const a2 = point(k, u0, v0, true), b2 = point(k, u1, v0, true), c2 = point(k, u1, v1, true), d2 = point(k, u0, v1, true);
              tri.push(a2, c2, b2, a2, d2, c2);
              couleurs.push(bord, bord);
            }
            // le bandeau du bord, entre le dessus et le dessous
            const A = point(k, i / nu, 0), B = point(k, (i + 1) / nu, 0);
            const a2 = point(k, i / nu, 0, true), b2 = point(k, (i + 1) / nu, 0, true);
            tri.push(a2, b2, B, a2, B, A);
            couleurs.push(bord, bord);
          }
        }
        if (ratioHaut > 0) {
          const T = coins.map(([x, z]) => [x * ratioHaut, h, z * ratioHaut]);
          tri.push(T[0], T[1], T[2], T[0], T[2], T[3]);
          couleurs.push(tuile, tuile);
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(tri.flat(), 3));
        return a.piece(g, tuile, { ...o, couleurs });
      },
      /**
       * Un socle de pierre (ishigaki) : tronc de pyramide de largeur × profondeur en bas, rapetissé de `retrait`
       * en haut, aux flancs creusés (évasés en bas), en rangs de pierres. Bas à y = 0.
       */
      ishigaki(largeur, profondeur, h, retrait, o = {}) {
        const L = largeur / 2, P = profondeur / 2;
        const coins = [[-L, P], [L, P], [L, -P], [-L, -P]];
        const tri = [], couleurs = [];
        const nv = 8, nu = 6;
        const point = (k, u, v) => {
          const [x0, z0] = coins[k], [x1, z1] = coins[(k + 1) % 4];
          const r = retrait * (1 - (1 - v) ** 2.2); // l'évasement : presque vertical en haut, en éventail en bas
          const ex = x0 + (x1 - x0) * u, ez = z0 + (z1 - z0) * u;
          return [ex - Math.sign(ex) * r, h * v, ez - Math.sign(ez) * r];
        };
        const teintes = [C.pierre2, C.pierre3, C.ardoise];
        for (let k = 0; k < 4; k++) {
          for (let j = 0; j < nv; j++) {
            for (let i = 0; i < nu; i++) {
              const A = point(k, i / nu, j / nv), B = point(k, (i + 1) / nu, j / nv), Cc = point(k, (i + 1) / nu, (j + 1) / nv), D = point(k, i / nu, (j + 1) / nv);
              tri.push(A, B, Cc, A, Cc, D);
              const t = teintes[(j + i * 2 + k) % 3];
              couleurs.push(t, t);
            }
          }
        }
        const T = coins.map(([x, z]) => [x - Math.sign(x) * retrait, h, z - Math.sign(z) * retrait]);
        tri.push(T[0], T[1], T[2], T[0], T[2], T[3]);
        couleurs.push(C.pierre2, C.pierre2);
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(tri.flat(), 3));
        return a.piece(g, C.pierre2, { ...o, couleurs });
      },
      pin(x, z, s = 1, y = 0) {
        a.cylindre(0.018 * s, 0.026 * s, 0.24 * s, 5, C.brun, { x, y: y + 0.12 * s, z });
        a.boule(0.13 * s, C.pinVert, { x, y: y + 0.27 * s, z, sy: 0.55 });
        return a.boule(0.09 * s, C.pinVert, { x: x + 0.04 * s, y: y + 0.36 * s, z: z - 0.02 * s, sy: 0.55 });
      },
      /** Un pin japonais taillé : tronc penché et nuages d'aiguilles en plateaux. */
      pinJapon(x, z, s = 1, sens = 1) {
        a.baton([x, -0.05, z], [x + 0.05 * s * sens, 0.2 * s, z], 0.022 * s, C.brun, 5)
          .baton([x + 0.05 * s * sens, 0.2 * s, z], [x - 0.03 * s * sens, 0.36 * s, z + 0.02 * s], 0.017 * s, C.brun, 5);
        for (const [dx, dy, dz, r] of [[0.08, 0.22, 0, 0.1], [-0.07, 0.3, 0.02, 0.09], [0.01, 0.39, -0.01, 0.075], [-0.02, 0.15, -0.05, 0.07]]) {
          a.boule(r * s, C.pinVert, { x: x + dx * s * sens, y: dy * s, z: z + dz * s, sy: 0.42 }, 1);
        }
        return a;
      },
      /** Une lanterne de pierre (tōrō) posée en x, z. */
      lanterne(x, z, s = 1) {
        const p = { x, z };
        return a.cylindre(0.05 * s, 0.055 * s, 0.06 * s, 6, C.pierre2, { ...p, y: -0.01 * s })
          .cylindre(0.019 * s, 0.022 * s, 0.13 * s, 6, C.pierre2, { ...p, y: 0.085 * s })
          .cylindre(0.046 * s, 0.04 * s, 0.025 * s, 6, C.pierre3, { ...p, y: 0.16 * s })
          .cylindre(0.032 * s, 0.032 * s, 0.055 * s, 6, C.pierre2, { ...p, y: 0.2 * s })
          .boite(0.034 * s, 0.026 * s, 0.07 * s, '#4a3c2c', { ...p, y: 0.2 * s, trait: false })
          .cylindre(0.012 * s, 0.065 * s, 0.04 * s, 6, C.pierre3, { ...p, y: 0.247 * s })
          .boule(0.014 * s, C.pierre3, { ...p, y: 0.275 * s }, 1);
      },
      /**
       * Une parcelle au contour irrégulier (étang, plage, îlot, sol d'un jardin…) : le dessus à y = haut, et un
       * bord qui descend jusqu'à y = bas, dans le relief (sur une pente, elle ne flotte pas). rayon(angle) → rayon
       * (angle 0 vers +z). o : x, z (centre), bas, bord (couleur du bord), teinte(x, y, z) pour le dessus.
       */
      parcelle(rayon, haut, couleur, o = {}) {
        const { bas = -0.14, cotes = 30, anneaux = 5, bord = C.terre, x: ox = 0, z: oz = 0 } = o;
        const tri = [], couleurs = [];
        const pt = (i, k, y = haut) => {
          const ang = (i / cotes) * 2 * PI, r = (rayon(ang) * k) / anneaux;
          return [ox + r * Math.sin(ang), y, oz + r * Math.cos(ang)];
        };
        const teinte = (A, B, Cc) => (o.teinte ? o.teinte((A[0] + B[0] + Cc[0]) / 3, haut, (A[2] + B[2] + Cc[2]) / 3) : couleur);
        for (let i = 0; i < cotes; i++) {
          for (let k = 0; k < anneaux; k++) {
            const A = pt(i, k), B = pt(i + 1, k), Cc = pt(i + 1, k + 1), D = pt(i, k + 1);
            // vu d'en haut, les angles croissants tournent dans le sens qui fait face au ciel
            if (k === 0) { tri.push(A, D, Cc); couleurs.push(teinte(A, D, Cc)); } else {
              tri.push(A, D, Cc, A, Cc, B);
              couleurs.push(teinte(A, D, Cc), teinte(A, Cc, B));
            }
          }
          const H0 = pt(i, anneaux), H1 = pt(i + 1, anneaux), B0 = pt(i, anneaux, bas), B1 = pt(i + 1, anneaux, bas);
          tri.push(H0, B0, B1, H0, B1, H1);
          couleurs.push(bord, bord);
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(tri.flat(), 3));
        return a.piece(g, couleur, { couleurs, nuance: o.nuance ?? 0.04, trait: o.trait });
      },
      /**
       * Un ruban plat de largeur l le long de points [x, y, z], tourné vers le ciel (lignes d'eau, écume…).
       * Sans trait d'encre : il est posé à plat sur une autre surface.
       */
      ruban(points, l, c) {
        const tri = [];
        const n = points.length;
        const cote = (i) => {
          const av = points[Math.max(0, i - 1)], ap = points[Math.min(n - 1, i + 1)];
          const dx = ap[0] - av[0], dz = ap[2] - av[2], d = Math.hypot(dx, dz) || 1;
          return [(-dz / d) * (l / 2), (dx / d) * (l / 2)];
        };
        const versLeCiel = (A, B, Cc) => {
          const ux = B[0] - A[0], uz = B[2] - A[2], vx = Cc[0] - A[0], vz = Cc[2] - A[2];
          return uz * vx - ux * vz > 0 ? [A, B, Cc] : [A, Cc, B];
        };
        for (let i = 0; i < n - 1; i++) {
          const [ax, az] = cote(i), [bx, bz] = cote(i + 1), p = points[i], q = points[i + 1];
          const A = [p[0] + ax, p[1], p[2] + az], B = [p[0] - ax, p[1], p[2] - az];
          const Cc = [q[0] - bx, q[1], q[2] - bz], D = [q[0] + bx, q[1], q[2] + bz];
          tri.push(...versLeCiel(A, B, Cc), ...versLeCiel(A, Cc, D));
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(tri.flat(), 3));
        return a.piece(g, c, { trait: false, nuance: 0.02 });
      },
      /**
       * Les lignes d'eau claires d'un étang, qui suivent sa rive comme les lignes d'eau gravées de la carte :
       * le contour rayon(angle) réduit de chaque facteur de fs, un peu au-dessus de l'eau (y).
       */
      lignesEau(rayon, y, o = {}) {
        const { x = 0, z = 0, fs = [0.82, 0.6], l = 0.012 } = o;
        for (const f of fs) {
          const pts = [];
          for (let i = 0; i <= 48; i++) {
            const ang = (i / 48) * 2 * PI, r = rayon(ang) * f;
            pts.push([x + r * Math.sin(ang), y + 0.005, z + r * Math.cos(ang)]);
          }
          a.ruban(pts, l, C.eauClaire);
        }
        return a;
      },
      /** Un rocher anguleux. */
      rocher(x, y, z, r, c = C.roche, o = {}) {
        return a.piece(new THREE.IcosahedronGeometry(r, 0), c, {
          x, y, z, sy: 0.72, ry: hasard(x, z, r) * 6, nuance: 0.09, ...o,
          deformer: (px, py, pz) => { const k = 0.78 + 0.44 * hasard(px * 9 + x, py * 9 + y, pz * 9 + z); return [px * k, py * k, pz * k]; },
        });
      },
      /** Un arbre feuillu (érable, cerisier…) : tronc, deux branches et des touffes de feuillage. */
      arbre(x, z, h, feuilles = [C.feuillage, C.mousse], o = {}) {
        const y0 = o.y ?? 0;
        a.baton([x, y0 - 0.06, z], [x + 0.02 * h, y0 + h * 0.5, z], 0.035 * h, C.brun, 6)
          .baton([x + 0.02 * h, y0 + h * 0.45, z], [x - 0.18 * h, y0 + h * 0.68, z + 0.05 * h], 0.022 * h, C.brun, 5)
          .baton([x + 0.02 * h, y0 + h * 0.45, z], [x + 0.2 * h, y0 + h * 0.7, z - 0.04 * h], 0.022 * h, C.brun, 5);
        for (const [dx, dy, dz, r] of [[0, 0.78, 0, 0.3], [-0.2, 0.68, 0.06, 0.22], [0.21, 0.7, -0.05, 0.22], [0.04, 0.66, 0.2, 0.2], [-0.03, 0.7, -0.2, 0.2], [0.08, 0.92, 0.04, 0.18]]) {
          const c = feuilles[Math.floor(hasard(x + dx, z + dz, dy) * feuilles.length)];
          a.boule(r * h, c, { x: x + dx * h, y: y0 + dy * h, z: z + dz * h, sy: 0.8 }, 1);
        }
        return a;
      },
      erable: (x, z, h, o) => a.arbre(x, z, h, [C.erable, C.erableClair, '#b8452a'], o),
      /**
       * La corde sacrée (shimenawa) le long de points [x, y, z], tressée de deux teintes de paille, et ses
       * papiers blancs en zigzag (shide) pendus aux points `shide` [x, y, z].
       */
      shimenawa(points, r, shide = []) {
        a.tube(points, r, C.paille, { cotes: 7, pas: 30, teinte: (x, y, z) => (Math.floor(x * 70 + y * 40 + z * 70 + 100) % 2 ? C.paille : C.pailleFonce) });
        const s = r / 0.018;
        for (const [x, y, z] of shide) {
          for (const [dx, dy] of [[0, 0], [0.012, -0.03], [0, -0.06], [0.012, -0.09]]) a.boite(0.026 * s, 0.032 * s, 0.006, C.papier, { x: x + dx * s, y: y + dy * s, z, nuance: 0.02 });
        }
        return a;
      },
      /** Une lanterne de papier rouge (chōchin), pendue en x, y, z. */
      chochin(x, y, z, s = 1, c = C.rouge) {
        return a.cylindre(0.022 * s, 0.022 * s, 0.012 * s, 8, C.noir, { x, y: y + 0.03 * s, z })
          .ovale(0.03 * s, c, { x, y, z, sy: 1.25 }, 8)
          .cylindre(0.02 * s, 0.02 * s, 0.01 * s, 8, C.noir, { x, y: y - 0.036 * s, z });
      },
      /** Un bâton (bras, jambe…) tendu entre deux points [x, y, z]. */
      baton(de, vers, r, c, cotes = 8, o = {}) {
        const A = new THREE.Vector3(...de), B = new THREE.Vector3(...vers);
        const dir = B.clone().sub(A);
        const g = new THREE.CylinderGeometry(r, r, dir.length(), cotes).toNonIndexed();
        g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()));
        const milieu = A.add(B).multiplyScalar(0.5);
        return a.piece(g, c, { ...o, x: milieu.x, y: milieu.y, z: milieu.z });
      },
      /** Un tube le long de points [x, y, z] (corde…). */
      tube(points, r, c, o = {}) {
        const courbe = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
        return a.piece(new THREE.TubeGeometry(courbe, o.pas || 24, r, o.cotes || 6), c, o);
      },
      /** Un ovoïde (sphère étirée) : corps, jambes, mains… */
      ovale: (r, c, o, finesse = 12) => a.piece(new THREE.SphereGeometry(r, finesse, Math.max(4, Math.round(finesse * 0.7))), c, o),
      /** Un cèdre du Japon : tronc et trois étages de branches en cônes (enneigés si neige). */
      cedre(x, z, h, vert = C.pinVert, neige = null, y0 = 0) {
        a.cylindre(0.016 + h * 0.02, 0.022 + h * 0.025, h * 0.3, 5, C.brun, { x, y: y0 + h * 0.09, z });
        for (const [r, hh, y] of [[0.3, 0.42, 0.42], [0.23, 0.36, 0.64], [0.15, 0.3, 0.85]]) {
          a.cone(h * r, h * hh, 7, vert, { x, y: y0 + h * y - h * hh * 0.25, z, ry: hasard(x, z, y) * 3 });
          if (neige) a.cone(h * r * 0.72, h * hh * 0.42, 7, neige, { x, y: y0 + h * y - h * hh * 0.25 + h * hh * 0.33, z, ry: hasard(x, z, y) * 3 });
        }
        return a;
      },
      /**
       * Termine le modèle. decalage : hauteur dont on le monte. peinture : chaque triangle un peu plus ou moins
       * chargé de couleur (comme un lavis) et le bas assombri (posé au sol). Ajoute l'attribut `contour` (les
       * normales lissées de chaque pièce, pour le trait d'encre).
       */
      fin(decalage = 0, peinture = true) {
        let n = 0;
        for (const m of morceaux) n += m.pos.length;
        const pos = new Float32Array(n);
        const col = new Float32Array(n);
        const contour = new Float32Array(n);
        let i = 0;
        for (const m of morceaux) {
          const p = m.pos;
          pos.set(p, i);
          // normales lissées de la pièce (sommets au même endroit réunis) : la coque du trait gonfle sans se déchirer
          if (m.trait) {
            const somme = new Map();
            // la position arrondie au 1/10 000, en un seul nombre (exact : moins de 2^53)
            const cle = (k) => ((Math.round(p[k] * 1e4) + 32768) * 65536 + Math.round(p[k + 1] * 1e4) + 32768) * 65536 + Math.round(p[k + 2] * 1e4) + 32768;
            for (let k = 0; k < p.length; k += 9) {
              const ux = p[k + 3] - p[k], uy = p[k + 4] - p[k + 1], uz = p[k + 5] - p[k + 2];
              const vx = p[k + 6] - p[k], vy = p[k + 7] - p[k + 1], vz = p[k + 8] - p[k + 2];
              let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
              const l = Math.hypot(nx, ny, nz) || 1;
              nx /= l; ny /= l; nz /= l;
              for (let s = 0; s < 9; s += 3) {
                const c = cle(k + s);
                const v = somme.get(c) || [0, 0, 0];
                v[0] += nx; v[1] += ny; v[2] += nz;
                somme.set(c, v);
              }
            }
            for (let k = 0; k < p.length; k += 3) {
              const v = somme.get(cle(k));
              const l = Math.hypot(...v) || 1;
              contour[i + k] = v[0] / l; contour[i + k + 1] = v[1] / l; contour[i + k + 2] = v[2] / l;
            }
          }
          for (let k = 0, t = 0; k < p.length; k += 9, t++) {
            const cx = (p[k] + p[k + 3] + p[k + 6]) / 3, cy = (p[k + 1] + p[k + 4] + p[k + 7]) / 3, cz = (p[k + 2] + p[k + 5] + p[k + 8]) / 3;
            const [r, g, b] = rvb(m.couleurs ? m.couleurs[t] : m.teinte ? m.teinte(cx, cy, cz) : m.c);
            const lavis = peinture ? 1 + m.nuance * (2 * hasard(cx, cy, cz) - 1) : 1;
            for (let s = 0; s < 9; s += 3) {
              const y = p[k + s + 1] + decalage;
              const sol = peinture ? 0.74 + 0.26 * lisse(-0.06, 0.32, y) : 1;
              col[i + k + s] = r * lavis * sol;
              col[i + k + s + 1] = g * lavis * sol;
              col[i + k + s + 2] = b * lavis * sol;
            }
          }
          i += p.length;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        geo.setAttribute('contour', new THREE.BufferAttribute(contour, 3));
        geo.translate(0, decalage, 0);
        geo.computeVertexNormals(); // chaque triangle a ses propres sommets : facettes nettes, style maquette
        geo.computeBoundingBox();
        return { geometrie: geo, hauteur: geo.boundingBox.max.y };
      },
    };
    return a;
  };
}

/**
 * Fabrique les modèles un par un : un générateur qui rend la main après chaque modèle. couche3d.js en fait
 * quelques-uns entre deux images, pour que la carte ne se fige pas (environ 80 ms en tout sur un ordinateur,
 * quatre fois plus sur un téléphone moyen). Sa valeur finale : { nom: { geometrie, hauteur } }.
 */
export function* fabriquerPeuAPeu(THREE) {
  const atelier = ateliers(THREE);
  const PI = Math.PI;
  const M = {};

  // Sanctuaire : un torii vermillon (myōjin) sur son allée de dalles, avec sa corde sacrée (shimenawa) et ses
  // papiers en zigzag, sa plaque, et deux lanternes de pierre
  {
    const t = atelier();
    for (const [z, l] of [[0.44, 0.16], [0.29, 0.19], [0.14, 0.17], [-0.01, 0.19], [-0.16, 0.17], [-0.31, 0.18]]) {
      t.boite(l, 0.05, 0.12, C.pierre2, { x: (hasard(z, 1, 2) - 0.5) * 0.03, y: -0.012, z, ry: (hasard(z, 3, 4) - 0.5) * 0.14, nuance: 0.09 });
    }
    // les deux piliers, un peu penchés vers l'intérieur, sur leur pierre et dans leur bague noire
    for (const s of [-1, 1]) {
      t.cylindre(0.037, 0.045, 0.98, 12, C.laque, { x: s * 0.236, y: 0.33, rz: s * 0.035 })
        .cylindre(0.07, 0.08, 0.07, 10, C.pierre2, { x: s * 0.241, y: 0 })
        .cylindre(0.052, 0.054, 0.07, 12, C.noir, { x: s * 0.24, y: 0.07 });
    }
    t.boite(0.68, 0.05, 0.045, C.laque, { y: 0.6 })
      .boite(0.045, 0.1, 0.04, C.laque, { y: 0.675 })
      .boite(0.125, 0.165, 0.024, C.or, { y: 0.69, z: 0.012 })
      .boite(0.094, 0.13, 0.03, C.noir, { y: 0.69, z: 0.013 })
      // shimaki puis kasagi, le grand linteau noir aux bouts relevés
      .piece(new THREE.BoxGeometry(0.82, 0.05, 0.075, 12, 1, 1), C.laque, { y: 0.78, deformer: (x, y, z) => [x, y + 0.03 * (x / 0.41) ** 2, z] })
      .piece(new THREE.BoxGeometry(0.98, 0.055, 0.11, 16, 1, 1), C.noir, { y: 0.835, deformer: (x, y, z) => [x, y + 0.05 * (x / 0.49) ** 2 + 0.03 * (x / 0.49) ** 8 + (y > 0 ? 0.008 : 0), z] })
      // la corde sacrée, tressée (deux teintes de paille), et ses papiers blancs en zigzag
      .tube([[-0.215, 0.565, 0.035], [-0.1, 0.53, 0.04], [0, 0.52, 0.042], [0.1, 0.53, 0.04], [0.215, 0.565, 0.035]], 0.018, C.paille,
        { cotes: 7, pas: 30, teinte: (x, y, z) => (Math.floor(x * 70 + y * 40 + z * 40 + 100) % 2 ? C.paille : C.pailleFonce) });
    for (const x of [-0.11, 0, 0.11]) {
      const y0 = x ? 0.505 : 0.495;
      for (const [dx, dy] of [[0, 0], [0.012, -0.03], [0, -0.06], [0.012, -0.09]]) t.boite(0.026, 0.032, 0.006, C.papier, { x: x + dx, y: y0 + dy, z: 0.05, nuance: 0.02 });
    }
    M.torii = t.lanterne(-0.37, 0.24, 1.05).lanterne(0.37, 0.24, 1.05).fin();
  }

  yield;
  // Temple : le pavillon principal sur son podium de pierre, piliers et portes à claire-voie, consoles sous le
  // grand toit aux coins relevés (irimoya), ornements dorés au faîte ; deux lanternes et un pin
  {
    const t = atelier()
      .ishigaki(0.86, 0.68, 0.32, 0.015, { y: -0.2 })
      .boite(0.26, 0.04, 0.06, C.pierre2, { y: 0.1, z: 0.36 })
      .boite(0.26, 0.04, 0.06, C.pierre2, { y: 0.06, z: 0.41 })
      .boite(0.26, 0.04, 0.07, C.pierre2, { y: 0.02, z: 0.46 })
      .boite(0.74, 0.025, 0.58, C.bois, { y: 0.132 })
      .boite(0.54, 0.24, 0.4, C.platre, { y: 0.265 })
      .boite(0.56, 0.022, 0.42, C.boisFonce, { y: 0.165 })
      .boite(0.56, 0.022, 0.42, C.boisFonce, { y: 0.36 });
    for (const x of [-0.27, -0.09, 0.09, 0.27]) for (const z of [-0.2, 0.2]) t.cylindre(0.018, 0.02, 0.25, 8, C.boisFonce, { x, y: 0.265, z });
    for (const x of [-0.27, 0.27]) t.cylindre(0.018, 0.02, 0.25, 8, C.boisFonce, { x, y: 0.265, z: 0 });
    // trois portes à claire-voie (shitomido)
    for (const x of [-0.18, 0, 0.18]) {
      t.piece(new THREE.BoxGeometry(0.15, 0.17, 0.008, 6, 7, 1), C.bois, {
        x, y: 0.262, z: 0.203, trait: false,
        teinte: (px, py) => ((Math.floor(px * 40 + 100) + Math.floor(py * 41 + 100)) % 2 ? '#6a4a30' : '#8f6a45'),
      });
    }
    // les consoles (kumimono) en rang sous l'avant-toit
    t.boite(0.6, 0.035, 0.46, C.boisFonce, { y: 0.39 });
    for (let x = -0.27; x <= 0.271; x += 0.06) for (const z of [-0.235, 0.235]) t.boite(0.03, 0.03, 0.03, C.ocre, { x, y: 0.41, z });
    for (let z = -0.18; z <= 0.181; z += 0.06) for (const x of [-0.305, 0.305]) t.boite(0.03, 0.03, 0.03, C.ocre, { x, y: 0.41, z });
    M.temple = t
      .toitJapon(0.92, 0.76, 0.19, 0.55, { y: 0.415, releve: 0.055, rangs: 16 })
      .pignon(0.5, 0.14, 0.42, C.tuile, { y: 0.605 })
      // les pignons blancs du haut du toit (irimoya), le faîtage et ses ornements dorés
      .pignon(0.012, 0.125, 0.37, C.platre, { x: -0.246, y: 0.607, trait: false })
      .pignon(0.012, 0.125, 0.37, C.platre, { x: 0.246, y: 0.607, trait: false })
      .boite(0.56, 0.032, 0.04, C.faitage, { y: 0.752 })
      .boite(0.035, 0.08, 0.045, C.or, { x: -0.285, y: 0.782, rz: 0.25 })
      .boite(0.035, 0.08, 0.045, C.or, { x: 0.285, y: 0.782, rz: -0.25 })
      .lanterne(-0.38, 0.4, 0.9)
      .lanterne(0.38, 0.4, 0.9)
      .pinJapon(-0.4, -0.3, 0.95, 1)
      .fin();
  }

  yield;
  // Pagode à cinq étages (gojū-no-tō) : socle de pierre, cinq étages vermillon aux toits relevés, de plus en
  // plus petits, et la flèche de bronze aux neuf anneaux ; une lanterne et un pin
  {
    const t = atelier().ishigaki(0.48, 0.48, 0.2, 0.01, { y: -0.14 })
      .boite(0.16, 0.03, 0.07, C.pierre2, { y: 0.045, z: 0.27 })
      .boite(0.16, 0.03, 0.07, C.pierre2, { y: 0.015, z: 0.32 });
    let y = 0.06;
    for (let i = 0; i < 5; i++) {
      const l = 0.3 - i * 0.032, h = i === 0 ? 0.1 : 0.075;
      t.boite(l, h, l, C.laque, { y: y + h / 2 });
      for (const [rx, rz, ry] of [[0, 1, 0], [0, -1, 0], [1, 0, PI / 2], [-1, 0, PI / 2]]) {
        t.boite(l * 0.56, h * 0.62, 0.006, i ? C.platre : '#5b3b25', { x: (rx * l) / 2 + rx * 0.002, y: y + h / 2, z: (rz * l) / 2 + rz * 0.002, ry, trait: false });
      }
      t.boite(l + 0.035, 0.022, l + 0.035, C.boisFonce, { y: y + h + 0.011 });
      const lt = l + 0.21;
      t.toitJapon(lt, lt, 0.055, 0.55, { y: y + h + 0.02, releve: 0.035, rangs: 8, epaisseur: 0.018 });
      y += h + 0.065;
    }
    // la flèche (sōrin) : socle, bol, neuf anneaux, flammes d'eau et joyau
    t.boite(0.07, 0.04, 0.07, C.faitage, { y: y + 0.0 })
      .cylindre(0.035, 0.02, 0.03, 10, C.bronzeOr, { y: y + 0.035 })
      .cylindre(0.009, 0.011, 0.26, 6, C.bronzeOr, { y: y + 0.17 });
    for (let k = 0; k < 9; k++) t.cylindre(0.026 - k * 0.0012, 0.026 - k * 0.0012, 0.007, 10, C.bronzeOr, { y: y + 0.07 + k * 0.019 });
    M.pagoda = t
      .boite(0.05, 0.035, 0.004, C.bronzeOr, { y: y + 0.27, trait: false })
      .boite(0.004, 0.035, 0.05, C.bronzeOr, { y: y + 0.27, trait: false })
      .boule(0.014, C.or, { y: y + 0.305 }, 1)
      .lanterne(0.36, 0.3, 0.95)
      .pinJapon(-0.37, -0.28, 0.9, 1)
      .fin();
  }

  yield;
  // Château : donjon blanc à trois étages sur sa muraille de pierres évasée, toits aux coins relevés, pignons
  // en triangle et en arc, fenêtres sombres, poissons dorés (shachihoko) au faîte ; deux pins au pied
  {
    const t = atelier().ishigaki(0.84, 0.72, 0.44, 0.12, { y: -0.24 });
    const fenetres = (y, l, p, nx, nz) => {
      for (let i = 0; i < nx; i++) for (const s of [-1, 1]) t.boite(0.034, 0.042, 0.01, C.noir, { x: (i - (nx - 1) / 2) * (l / nx), y, z: s * (p / 2 + 0.004), trait: false });
      for (let i = 0; i < nz; i++) for (const s of [-1, 1]) t.boite(0.01, 0.042, 0.034, C.noir, { x: s * (l / 2 + 0.004), y, z: (i - (nz - 1) / 2) * (p / nz), trait: false });
    };
    // des tuiles plus claires que celles des temples : le château blanc (Himeji, « le héron blanc »)
    const tuiles = { tuile: '#626a70', tuile2: '#737a7f' };
    t.boite(0.58, 0.05, 0.47, C.boisFonce, { y: 0.225 })
      .boite(0.56, 0.17, 0.45, C.platre, { y: 0.335 });
    fenetres(0.345, 0.56, 0.45, 4, 3);
    t.toitJapon(0.74, 0.63, 0.075, 0.72, { y: 0.42, releve: 0.035, rangs: 16, ...tuiles })
      .pignon(0.17, 0.075, 0.22, tuiles.tuile, { y: 0.455, z: 0.2, ry: Math.PI / 2 })
      .pignon(0.012, 0.062, 0.18, C.platre, { y: 0.459, z: 0.283, ry: Math.PI / 2, trait: false })
      .boite(0.42, 0.15, 0.34, C.platre, { y: 0.57 });
    fenetres(0.575, 0.42, 0.34, 3, 2);
    t.toitJapon(0.57, 0.48, 0.068, 0.68, { y: 0.645, releve: 0.03, rangs: 12, ...tuiles })
      .piece(new THREE.CylinderGeometry(0.07, 0.07, 0.15, 10, 1, false, Math.PI / 2, Math.PI), tuiles.tuile, { y: 0.66, z: 0.19, rx: Math.PI / 2, sy: 0.7 })
      .boite(0.3, 0.13, 0.24, C.platre, { y: 0.778 });
    fenetres(0.785, 0.3, 0.24, 2, 2);
    M.castle = t
      .toitJapon(0.44, 0.36, 0.072, 0.5, { y: 0.843, releve: 0.03, rangs: 10, ...tuiles })
      .pignon(0.24, 0.08, 0.19, tuiles.tuile, { y: 0.915 })
      .boite(0.26, 0.02, 0.025, C.faitage, { y: 1.0 })
      .ovale(0.022, C.or, { x: -0.118, y: 1.022, sx: 0.7, sy: 1.5, sz: 0.6, rz: -0.35 }, 6)
      .ovale(0.022, C.or, { x: 0.118, y: 1.022, sx: 0.7, sy: 1.5, sz: 0.6, rz: 0.35 }, 6)
      .cone(0.018, 0.04, 4, C.or, { x: -0.104, y: 1.062, rz: 0.6 })
      .cone(0.018, 0.04, 4, C.or, { x: 0.104, y: 1.062, rz: -0.6 })
      .pinJapon(-0.44, 0.3, 0.85, 1)
      .pinJapon(0.45, -0.28, 0.75, -1)
      .fin();
  }

  yield;
  // Montagne : un grand sommet aux arêtes rocheuses et à la neige déchiquetée, deux voisins et des cèdres au pied
  {
    const t = atelier();
    const sommet = (x, z, r, h, cotes, graine, neige) => t.piece(new THREE.CylinderGeometry(0.03, r, h, cotes, 7), C.roche, {
      x, z, y: h / 2 - 0.2,
      deformer: (px, py, pz) => {
        const v = (py + h / 2) / h; // 0 en bas, 1 en haut
        if (v <= 0.001 || v >= 0.999) return [px, py, pz];
        const k = 1 + 0.22 * (hasard(px * 7 + graine, py * 7, pz * 7) - 0.5) + 0.12 * Math.cos(Math.atan2(px, pz) * 3 + graine);
        return [px * k, py + 0.04 * h * (hasard(pz * 5, px * 5 + graine, py) - 0.5), pz * k];
      },
      teinte: (cx, cy, cz) => {
        const bruit = 0.08 * (hasard(cx * 9, cz * 9, graine) - 0.5);
        if (neige && cy > neige + bruit) return C.neige;
        if (cy < 0.2 + bruit) return hasard(cx * 13, cy, cz * 13) > 0.5 ? C.mousse : C.mousseFonce;
        return hasard(cx * 11, cy * 11, cz * 11) > 0.5 ? '#8d7b5c' : '#9c8a68';
      },
      nuance: 0.07,
    });
    sommet(0, -0.04, 0.52, 1.08, 12, 0.7, 0.55);
    sommet(0.28, 0.16, 0.3, 0.56, 9, 2.1, 0);
    sommet(-0.27, 0.18, 0.25, 0.44, 8, 4.3, 0);
    for (const [x, z, h] of [[-0.4, 0.27, 0.2], [-0.31, 0.38, 0.17], [-0.1, 0.44, 0.15], [0.08, 0.43, 0.19], [0.33, 0.36, 0.16], [0.44, 0.2, 0.18], [-0.45, 0.1, 0.15]]) {
      t.cedre(x, z, h, hasard(x, z, 1) > 0.5 ? C.pinVert : C.mousseFonce);
    }
    M.mountain = t.fin();
  }

  yield;
  // Volcan : un cône de cendre raviné, des coulées de lave refroidie, le cratère rougeoyant et un panache de
  // fumée ; des blocs de lave noire et un peu de verdure au pied
  {
    const t = atelier().piece(new THREE.CylinderGeometry(0.16, 0.54, 0.88, 14, 7), '#6d5d52', {
      y: 0.24,
      deformer: (px, py, pz) => {
        const v = (py + 0.44) / 0.88;
        if (v <= 0.001 || v >= 0.999) return [px, py, pz];
        const k = 1 + 0.16 * (hasard(px * 7, py * 7, pz * 7) - 0.5) + 0.08 * Math.cos(Math.atan2(px, pz) * 5);
        return [px * k, py + 0.025 * (hasard(pz * 5, px * 5, py) - 0.5), pz * k];
      },
      teinte: (cx, cy, cz) => {
        if (cy > 0.675) return '#d8622c'; // le cratère
        const coulee = Math.cos(Math.atan2(cx, cz) * 4 + 0.6) > 0.88 && cy > 0.05;
        if (coulee) return cy > 0.5 ? '#9c3d22' : '#5a3a2e';
        if (cy < 0.02 + 0.06 * hasard(cx * 9, 1, cz * 9)) return hasard(cx * 13, 2, cz * 13) > 0.5 ? C.mousse : C.mousseFonce;
        return hasard(cx * 11, cy * 11, cz * 11) > 0.5 ? '#6a5b50' : '#7a6a5c';
      },
      nuance: 0.07,
    });
    t.anneau(0.155, 0.022, '#3a2f2a', { y: 0.68, rx: PI / 2 });
    for (const [x, y, z, r, c] of [[0.02, 0.8, 0, 0.09, C.fumee], [0.08, 0.92, -0.03, 0.11, '#cfc8bc'], [0.17, 1.03, -0.06, 0.12, C.fumee], [0.06, 0.98, 0.06, 0.08, '#bdb5a8']]) {
      t.boule(r, c, { x, y, z, sy: 0.85 }, 1);
    }
    for (const [x, z, r] of [[0.4, 0.3, 0.06], [-0.42, 0.24, 0.07], [0.12, 0.47, 0.05], [-0.2, 0.44, 0.045]]) t.rocher(x, 0.01, z, r, '#3d3532');
    M.volcano = t.cedre(-0.46, 0.06, 0.18, C.mousseFonce).cedre(0.47, 0.1, 0.16).fin();
  }

  yield;
  // Pont : un pont en arc vermillon au-dessus d'un ruisseau aux rives de pierre, garde-corps à pommeaux dorés
  // (giboshi), culées de pierre ; un pin et une lanterne
  {
    const t = atelier()
      .parcelle((ang) => 1 / Math.hypot(Math.sin(ang) / 0.15, Math.cos(ang) / 0.52), 0.005, C.eau)
      .ruban([[-0.05, 0.01, -0.4], [-0.06, 0.01, -0.1], [-0.045, 0.01, 0.2], [-0.05, 0.01, 0.4]], 0.01, C.eauClaire)
      .ruban([[0.055, 0.01, -0.38], [0.045, 0.01, -0.05], [0.06, 0.01, 0.22], [0.05, 0.01, 0.38]], 0.01, C.eauClaire);
    for (let z = -0.42; z <= 0.43; z += 0.11) {
      for (const s of [-1, 1]) t.rocher(s * (0.15 + 0.03 * hasard(z, s, 1)), 0.01, z, 0.04 + 0.02 * hasard(s, z, 2), C.pierre3);
    }
    const arc = (x) => 0.21 * (1 - (x / 0.42) ** 2);
    t.piece(new THREE.BoxGeometry(0.84, 0.035, 0.2, 16, 1, 1), C.bois2, { y: 0.085, deformer: (x, y, z) => [x, y + arc(x), z] })
      .piece(new THREE.BoxGeometry(0.8, 0.04, 0.17, 16, 1, 1), C.laque, { y: 0.05, deformer: (x, y, z) => [x, y + arc(x), z] });
    for (const z of [-0.1, 0.1]) {
      t.piece(new THREE.BoxGeometry(0.84, 0.022, 0.024, 16, 1, 1), C.laque, { y: 0.18, z, deformer: (x, y, zz) => [x, y + arc(x), zz] });
      for (const x of [-0.39, -0.26, -0.13, 0, 0.13, 0.26, 0.39]) {
        const yb = 0.1 + arc(x);
        t.boite(0.024, 0.09, 0.024, C.laque, { x, y: yb + 0.045, z });
        if (Math.abs(x) > 0.3 || x === 0) t.boule(0.02, C.or, { x, y: yb + 0.1, z }, 1).cone(0.008, 0.025, 6, C.or, { x, y: yb + 0.125, z });
      }
    }
    // les piles dans l'eau et les culées de pierre
    for (const x of [-0.15, 0.15]) for (const z of [-0.07, 0.07]) t.cylindre(0.017, 0.02, arc(x) + 0.1, 6, C.boisFonce, { x, y: (arc(x) + 0.1) / 2 - 0.02, z });
    for (const s of [-1, 1]) t.boite(0.12, 0.24, 0.26, C.pierre2, { x: s * 0.42, y: -0.06, nuance: 0.08 });
    M.bridge = t.pinJapon(-0.36, -0.33, 0.9, 1).lanterne(0.34, 0.3, 0.9).fin();
  }

  yield;
  // Cascade : une falaise rocheuse moussue, la chute en filets blancs, le bassin et ses rochers, la corde
  // sacrée tendue au sommet (comme à Nachi) et des cèdres
  {
    const t = atelier().piece(new THREE.BoxGeometry(0.82, 0.98, 0.34, 7, 9, 2), C.roche, {
      y: 0.33, z: -0.16,
      deformer: (x, y, z) => {
        const k = hasard(x * 6, y * 6, z * 6) - 0.5;
        return [x * (1 + 0.1 * k), y + (y > 0.48 ? 0.04 * k : 0), z + 0.05 * k + (y > 0 ? -0.04 * (y / 0.49) : 0)];
      },
      teinte: (cx, cy, cz) => (cy > 0.74 + 0.05 * hasard(cx * 9, 1, cz * 9) ? (hasard(cx * 7, 2, cz * 7) > 0.5 ? C.mousse : C.mousseFonce)
        : hasard(cx * 11, cy * 11, cz * 11) > 0.5 ? '#8a7a64' : '#7a6c58'),
      nuance: 0.08,
    });
    t.piece(new THREE.BoxGeometry(0.15, 0.82, 0.03, 6, 10, 1), C.ecume, {
      y: 0.42, z: 0.02,
      deformer: (x, y, z) => [x * (1 + 0.35 * (0.41 - y)), y, z + 0.02 * (0.41 - y)],
      teinte: (x) => (Math.floor(x * 70 + 100) % 2 ? C.ecume : '#bcd6d0'),
      nuance: 0.02,
    });
    t.parcelle(bosses(0.24, 0.15, 2), 0.01, C.eau, { z: 0.18 })
      .lignesEau(bosses(0.24, 0.15, 2), 0.01, { z: 0.18, fs: [0.8, 0.55] })
      .boule(0.06, C.ecume, { y: 0.04, z: 0.07, sy: 0.6 }, 1)
      .boule(0.045, C.ecume, { x: 0.07, y: 0.03, z: 0.1, sy: 0.6 }, 1)
      .boule(0.04, C.ecume, { x: -0.06, y: 0.03, z: 0.09, sy: 0.6 }, 1);
    for (const [x, z, r] of [[-0.28, 0.16, 0.08], [0.27, 0.12, 0.09], [-0.18, 0.36, 0.06], [0.2, 0.37, 0.065], [0.36, 0.28, 0.05]]) t.rocher(x, 0.02, z, r, C.pierre3);
    t.shimenawa([[-0.15, 0.84, 0.0], [0, 0.81, 0.03], [0.15, 0.84, 0.0]], 0.014, [[-0.05, 0.795, 0.035], [0.05, 0.795, 0.035]]);
    M.waterfall = t.cedre(-0.26, -0.2, 0.3, C.pinVert, null, 0.8).cedre(0.27, -0.24, 0.26, C.mousseFonce, null, 0.8)
      .cedre(-0.4, 0.0, 0.34, C.pinVert).erable(0.42, -0.02, 0.36).fin();
  }

  yield;
  // Lac : une eau aux lignes claires sur ses rives d'herbe et de sable, un ponton, une barque, des roseaux,
  // des rochers et deux pins
  {
    const rive = (ang) => 0.38 * (1 + 0.1 * Math.sin(ang * 3 + 1) + 0.05 * Math.sin(ang * 7));
    const t = atelier()
      .parcelle(t0 => 0.48 * (1 + 0.06 * Math.sin(t0 * 3 + 1)), 0, C.herbe, { teinte: (x, y, z) => (hasard(x * 8, 1, z * 8) > 0.5 ? C.herbe : C.mousse) })
      .parcelle(t0 => 0.45 * (1 + 0.08 * Math.sin(t0 * 3 + 1) + 0.04 * Math.sin(t0 * 7)), 0.006, C.sable, { bas: -0.02 })
      .parcelle(rive, 0.012, C.eau, { bas: -0.02 })
      .lignesEau(rive, 0.012, { fs: [0.84, 0.64, 0.42] });
    // le ponton et ses piquets, la barque
    t.boite(0.07, 0.014, 0.24, C.bois, { x: 0.3, y: 0.04, z: 0.18, ry: 0.5 });
    for (const [dx, dz] of [[0.035, 0.08], [-0.035, 0.08], [0.035, -0.06], [-0.035, -0.06]]) t.cylindre(0.008, 0.008, 0.06, 5, C.boisFonce, { x: 0.3 + dx * 0.87 + dz * 0.48, y: 0.02, z: 0.18 - dx * 0.48 + dz * 0.87 });
    t.piece(new THREE.BoxGeometry(0.2, 0.04, 0.07, 6, 1, 1), C.bois2, {
      x: 0.02, y: 0.03, z: 0.08, ry: -0.6,
      deformer: (x, y, z) => [x, y + (y < 0 ? 0 : 0.03 * (x / 0.1) ** 2), z * (1 - (x / 0.1) ** 2 * 0.7)],
    });
    for (const [x, z] of [[-0.34, 0.12], [-0.3, 0.2], [-0.37, 0.18], [-0.32, 0.27]]) {
      for (let k = 0; k < 3; k++) t.cylindre(0.004, 0.006, 0.11 + 0.03 * k, 4, C.pailleFonce, { x: x + 0.012 * k, y: 0.06 + 0.015 * k, z: z - 0.01 * k, rz: 0.1 * (k - 1), trait: false });
    }
    for (const [x, z, r] of [[0.36, -0.2, 0.05], [-0.15, 0.42, 0.04], [0.42, 0.04, 0.035]]) t.rocher(x, 0.02, z, r, C.pierre3);
    M.lake = t.pinJapon(-0.3, -0.33, 0.95, 1).pinJapon(0.2, -0.4, 0.75, -1).fin();
  }

  yield;
  // Côte : une plage, la mer et ses franges d'écume, et les « rochers mariés » (Meoto Iwa) reliés par la corde
  // sacrée, un petit torii sur le grand ; des pins sur la dune
  {
    const plage = (ang) => (1 / Math.hypot(Math.sin(ang) / 0.5, Math.cos(ang) / 0.3)) * (1 + 0.05 * Math.sin(ang * 5));
    const t = atelier().parcelle(bosses(0.48, 0.06, 3), 0, C.eau)
      .parcelle(plage, 0.01, C.sable, { z: -0.2, bas: -0.02, teinte: (x, y, z) => (hasard(x * 30, 1, z * 30) > 0.5 ? C.sable : '#d6c294') });
    // l'écume, puis deux lignes d'eau, en arcs le long de la rive (coupés au bord de la mer)
    for (const [f, l, c] of [[1.04, 0.022, C.ecume], [1.2, 0.012, C.eauClaire], [1.38, 0.012, C.eauClaire]]) {
      let arc = [];
      for (let i = -24; i <= 24; i++) {
        const ang = (i / 24) * 1.45, r = plage(ang) * f, p = [r * Math.sin(ang), 0.016, -0.2 + r * Math.cos(ang)];
        if (Math.hypot(p[0], p[2]) < 0.43) arc.push(p);
        else { if (arc.length > 1) t.ruban(arc, l, c); arc = []; }
      }
      if (arc.length > 1) t.ruban(arc, l, c);
    }
    t.dome(0.26, C.herbe, { x: -0.06, y: -0.04, z: -0.3, sy: 0.38 })
      .pinJapon(-0.18, -0.3, 0.8, 1).pinJapon(0.12, -0.36, 0.7, -1).pinJapon(0.34, -0.2, 0.6, -1)
      .rocher(-0.1, 0.06, 0.24, 0.12, '#7c6f5e', { sy: 1.45 })
      .rocher(0.14, 0.04, 0.3, 0.08, '#7c6f5e', { sy: 1.3 })
      .shimenawa([[-0.07, 0.19, 0.25], [0.03, 0.15, 0.28], [0.13, 0.12, 0.3]], 0.012, [[-0.01, 0.15, 0.275], [0.07, 0.12, 0.29]]);
    // un tout petit torii au sommet du grand rocher
    for (const s of [-1, 1]) t.cylindre(0.006, 0.007, 0.07, 6, C.laque, { x: -0.1 + s * 0.028, y: 0.24, z: 0.24 });
    t.boite(0.08, 0.009, 0.012, C.noir, { x: -0.1, y: 0.278, z: 0.24 }).boite(0.064, 0.007, 0.01, C.laque, { x: -0.1, y: 0.262, z: 0.24 });
    for (const [x, z, r] of [[-0.02, 0.36, 0.03], [0.22, 0.36, 0.025], [-0.2, 0.32, 0.03]]) t.boule(r, C.ecume, { x, y: 0.01, z, sy: 0.5 }, 1);
    M.coast = t.fin();
  }

  yield;
  // Île : un îlot boisé de pins au milieu d'une eau aux lignes claires, ses rochers, sa plage et une barque
  {
    const t = atelier().parcelle(bosses(0.48, 0.05, 5), 0, C.eau)
      .lignesEau(bosses(0.3, 0.16, 1), 0, { fs: [1.14, 1.27] });
    t.parcelle(bosses(0.3, 0.16, 1), 0.012, C.sable, { bas: -0.02 })
      .piece(new THREE.SphereGeometry(0.26, 14, 6, 0, 2 * PI, 0, PI / 2), C.herbe, {
        y: 0.0, sy: 0.55,
        deformer: (x, y, z) => { const k = 1 + 0.15 * Math.sin(Math.atan2(x, z) * 3 + 1); return [x * k, y * (1 + 0.2 * hasard(x * 5, 1, z * 5)), z * k]; },
        teinte: (x, y, z) => (hasard(x * 9, y * 9, z * 9) > 0.5 ? C.herbe : C.mousse),
      });
    for (const [x, z, s, d] of [[0.02, -0.02, 1.05, 1], [-0.13, 0.08, 0.75, -1], [0.14, 0.1, 0.7, 1], [-0.05, -0.15, 0.8, -1]]) t.pinJapon(x, z, s, d);
    for (const [x, z, r] of [[0.28, 0.06, 0.05], [-0.27, -0.08, 0.06], [0.1, 0.3, 0.04], [-0.22, 0.22, 0.04]]) t.rocher(x, 0.02, z, r, C.pierre3);
    M.island = t.piece(new THREE.BoxGeometry(0.15, 0.035, 0.06, 6, 1, 1), C.bois2, {
      x: 0.3, y: 0.025, z: 0.3, ry: 0.7,
      deformer: (x, y, z) => [x, y + (y < 0 ? 0 : 0.025 * (x / 0.075) ** 2), z * (1 - (x / 0.075) ** 2 * 0.7)],
    }).fin();
  }

  yield;
  // Phare : la tour blanche sur son cap rocheux, sa galerie, sa lanterne allumée et son chapeau rouge ; la
  // maison du gardien et une clôture
  {
    const t = atelier().piece(new THREE.IcosahedronGeometry(0.42, 1), C.roche, {
      y: -0.1, sy: 0.5,
      deformer: (x, y, z) => { const k = 0.85 + 0.3 * hasard(x * 6, y * 6, z * 6); return [x * k, y * k, z * k]; },
      teinte: (x, y, z) => (y > 0.07 + 0.04 * hasard(x * 9, 1, z * 9) ? (hasard(x * 7, 2, z * 7) > 0.5 ? C.herbe : C.mousse) : hasard(x * 11, y * 11, z * 11) > 0.5 ? '#8a7a64' : '#776a57'),
    });
    t.cylindre(0.1, 0.12, 0.06, 8, C.pierre2, { y: 0.14 })
      .cylindre(0.072, 0.1, 0.56, 8, C.blanc, { y: 0.44 })
      .cylindre(0.083, 0.087, 0.05, 8, C.rouge, { y: 0.4 })
      .boite(0.03, 0.05, 0.01, C.noir, { y: 0.3, z: 0.094, trait: false })
      .boite(0.03, 0.05, 0.01, C.noir, { y: 0.55, z: 0.08, trait: false })
      .cylindre(0.115, 0.115, 0.02, 12, C.faitage, { y: 0.73 })
      .anneau(0.11, 0.005, C.faitage, { y: 0.775, rx: PI / 2 })
      .cylindre(0.062, 0.062, 0.1, 10, C.verre, { y: 0.79, trait: false });
    for (let k = 0; k < 6; k++) { const ang = (k / 6) * 2 * PI; t.boite(0.008, 0.1, 0.008, C.faitage, { x: 0.063 * Math.sin(ang), y: 0.79, z: 0.063 * Math.cos(ang) }); }
    for (let k = 0; k < 8; k++) { const ang = (k / 8) * 2 * PI; t.boite(0.006, 0.045, 0.006, C.faitage, { x: 0.11 * Math.sin(ang), y: 0.76, z: 0.11 * Math.cos(ang) }); }
    t.cone(0.08, 0.08, 10, C.rouge, { y: 0.88 }).boule(0.015, C.faitage, { y: 0.93 }, 1)
      // la maison du gardien
      .boite(0.2, 0.11, 0.14, C.blanc, { x: -0.24, y: 0.12, z: 0.1 })
      .pignon(0.23, 0.07, 0.17, C.rouge, { x: -0.24, y: 0.175, z: 0.1 })
      .boite(0.03, 0.06, 0.01, C.boisFonce, { x: -0.24, y: 0.1, z: 0.172, trait: false });
    for (let x = 0.12; x <= 0.36; x += 0.06) t.boite(0.01, 0.05, 0.01, C.blanc, { x, y: 0.1, z: 0.2 });
    t.boite(0.26, 0.008, 0.008, C.blanc, { x: 0.24, y: 0.12, z: 0.2 });
    M.lighthouse = t.fin();
  }

  yield;
  // Source chaude : un bain de pierre en plein air (rotenburo), son eau laiteuse fumante, le bec de bambou qui
  // l'alimente, l'abri de bois au toit de tuiles, des seaux, une lanterne et un érable rouge
  {
    const t = atelier().parcelle(bosses(0.47, 0.06, 2), 0.01, C.pierre3, { teinte: (x, y, z) => (hasard(x * 14, 1, z * 14) > 0.5 ? C.pierre3 : C.pierre2) });
    t.parcelle(bosses(0.25, 0.14, 4), 0.025, '#9cc9c6', { x: 0.05, z: 0.1, bas: -0.02 })
      .lignesEau(bosses(0.25, 0.14, 4), 0.025, { x: 0.05, z: 0.1, fs: [0.72, 0.42] });
    for (let k = 0; k < 14; k++) {
      const ang = (k / 14) * 2 * PI, r = 0.25 * (1 + 0.14 * (Math.sin(ang * 3 + 4) * 0.6 + Math.sin(ang * 5 + 9.2) * 0.4)) + 0.02;
      t.rocher(0.05 + r * Math.sin(ang), 0.035, 0.1 + r * Math.cos(ang), 0.045 + 0.02 * hasard(k, 1, 2), k % 2 ? C.pierre3 : '#7f7668');
    }
    // la vapeur : trois filets ondulés qui montent, comme le signe des sources chaudes ♨
    for (const [x, z, k, h] of [[-0.05, 0.12, 0, 0.3], [0.05, 0.1, 1.7, 0.36], [0.15, 0.13, 3.1, 0.28]]) {
      const pts = [];
      for (let j = 0; j <= 8; j++) pts.push([x + 0.025 * Math.sin(j * 1.2 + k), 0.06 + (h * j) / 8, z]);
      t.tube(pts, 0.009, '#f3efe8', { pas: 24, cotes: 6 });
    }
    // l'abri de bois, au fond
    for (const [x, z] of [[-0.36, -0.36], [-0.04, -0.36], [-0.36, -0.14], [-0.04, -0.14]]) t.cylindre(0.012, 0.014, 0.28, 6, C.boisFonce, { x, y: 0.15, z });
    t.boite(0.32, 0.22, 0.012, C.bois, { x: -0.2, y: 0.13, z: -0.37 })
      .toitJapon(0.44, 0.34, 0.09, 0.3, { x: -0.2, y: 0.29, z: -0.25, releve: 0.03, rangs: 8, epaisseur: 0.016 })
      .pignon(0.14, 0.04, 0.1, C.tuile, { x: -0.2, y: 0.38, z: -0.25 })
      // le bec de bambou et son filet d'eau
      .baton([0.33, 0.2, -0.06], [0.2, 0.15, 0.0], 0.012, '#8aa35a', 6)
      .cylindre(0.012, 0.012, 0.22, 6, '#8aa35a', { x: 0.34, y: 0.1, z: -0.07 })
      .boite(0.008, 0.11, 0.008, C.ecume, { x: 0.195, y: 0.09, z: 0.0, trait: false })
      // les seaux de bois (oke)
      .cylindre(0.035, 0.03, 0.04, 10, C.bois, { x: 0.3, y: 0.035, z: 0.36 })
      .cylindre(0.03, 0.026, 0.035, 10, C.bois, { x: 0.37, y: 0.03, z: 0.3 })
      .lanterne(-0.34, 0.24, 0.9);
    M.onsen = t.erable(0.38, -0.22, 0.45).fin();
  }

  yield;
  // Jardin : un jardin japonais, son étang et son petit pont rouge en arc, le gravier ratissé, les pas japonais,
  // une lanterne de pierre, un pin taillé, un érable rouge et un groupe de rochers
  {
    const t = atelier().parcelle(bosses(0.48, 0.05, 6), 0.005, C.mousse, {
      teinte: (x, y, z) => (x < -0.02 && z > -0.1 ? (Math.floor((z - 0.3 * x) * 34) % 2 ? '#ddd3bb' : '#cfc4a9') : hasard(x * 9, 1, z * 9) > 0.5 ? C.mousse : C.herbe),
    });
    t.parcelle(bosses(0.17, 0.2, 7), 0.015, C.eau, { x: 0.18, z: 0.06, bas: -0.02 })
      .lignesEau(bosses(0.17, 0.2, 7), 0.015, { x: 0.18, z: 0.06, fs: [0.7] });
    const arc = (x) => 0.06 * (1 - (x / 0.12) ** 2);
    t.piece(new THREE.BoxGeometry(0.24, 0.015, 0.06, 10, 1, 1), C.laque, { x: 0.2, y: 0.03, z: 0.06, ry: 0.4, deformer: (x, y, z) => [x, y + arc(x), z] });
    for (const z of [-0.03, 0.03]) t.piece(new THREE.BoxGeometry(0.24, 0.008, 0.008, 10, 1, 1), C.laque, { x: 0.2 + z * Math.sin(0.4), y: 0.07, z: 0.06 + z * Math.cos(0.4), ry: 0.4, deformer: (x, y, zz) => [x, y + arc(x), zz] });
    for (const [x, z, r] of [[-0.12, 0.42, 0.045], [-0.04, 0.32, 0.04], [0.04, 0.24, 0.045], [-0.2, 0.3, 0.035]]) t.cylindre(r, r, 0.03, 9, C.pierre2, { x, y: 0.005, z });
    for (const [x, z, r] of [[-0.24, 0.12, 0.08], [-0.13, 0.05, 0.05], [-0.3, 0.02, 0.045]]) t.rocher(x, 0.03, z, r, C.pierre3, { sy: 0.9 });
    // lanterne « à neige » (yukimi-dōrō) au bord de l'étang : grand chapeau sur trois pieds
    for (let k = 0; k < 3; k++) { const ang = (k / 3) * 2 * PI; t.baton([0.36 + 0.05 * Math.sin(ang), 0, 0.2 + 0.05 * Math.cos(ang)], [0.36 + 0.02 * Math.sin(ang), 0.1, 0.2 + 0.02 * Math.cos(ang)], 0.008, C.pierre2, 5); }
    t.cylindre(0.03, 0.03, 0.05, 6, C.pierre2, { x: 0.36, y: 0.125, z: 0.2 })
      .cylindre(0.012, 0.09, 0.04, 6, C.pierre3, { x: 0.36, y: 0.17, z: 0.2 })
      .boule(0.015, C.pierre3, { x: 0.36, y: 0.2, z: 0.2 }, 1);
    M.garden = t.pinJapon(-0.18, -0.26, 1.05, 1).erable(0.22, -0.3, 0.5).fin();
  }

  yield;
  // Fleurs : un grand cerisier en fleurs au tronc noueux sur son tapis de pétales, un plus jeune, et le banc
  // rouge à ombrelle des pique-niques sous les cerisiers (hanami)
  {
    const roses = ['#f2c4d0', '#e7a4b6', '#f7dbe2', '#eab0c0'];
    const t = atelier().parcelle(bosses(0.47, 0.06, 8), 0.004, C.herbe, {
      teinte: (x, y, z) => (Math.hypot(x + 0.05, z + 0.05) < 0.3 + 0.08 * hasard(x * 7, 1, z * 7) ? (hasard(x * 21, 2, z * 21) > 0.5 ? '#efc9d3' : '#f5dce2') : hasard(x * 9, 1, z * 9) > 0.5 ? C.herbe : C.mousse),
    });
    t.baton([-0.05, -0.05, -0.05], [-0.02, 0.22, -0.04], 0.045, C.brun, 7)
      .baton([-0.02, 0.22, -0.04], [-0.07, 0.42, -0.02], 0.034, C.brun, 6)
      .baton([-0.02, 0.22, -0.04], [0.18, 0.4, -0.08], 0.03, C.brun, 6)
      .baton([-0.07, 0.42, -0.02], [-0.26, 0.5, 0.04], 0.022, C.brun, 5)
      .baton([-0.07, 0.42, -0.02], [-0.02, 0.58, 0.02], 0.022, C.brun, 5)
      .baton([0.18, 0.4, -0.08], [0.3, 0.46, 0.02], 0.02, C.brun, 5);
    for (const [x, y, z, r] of [[-0.05, 0.62, 0.0, 0.17], [-0.25, 0.53, 0.06, 0.14], [0.27, 0.5, 0.0, 0.13], [0.12, 0.6, -0.1, 0.14], [-0.14, 0.52, -0.14, 0.12],
      [0.06, 0.5, 0.14, 0.12], [-0.18, 0.66, 0.0, 0.1], [0.16, 0.7, 0.02, 0.1], [-0.02, 0.76, -0.04, 0.11], [0.32, 0.4, -0.12, 0.08]]) {
      t.boule(r, roses[Math.floor(hasard(x, y, z) * roses.length)], { x, y, z, sy: 0.82 }, 1);
    }
    t.arbre(0.33, 0.3, 0.32, roses)
      // le banc rouge et son ombrelle (nodate)
      .boite(0.18, 0.025, 0.07, C.rouge, { x: -0.25, y: 0.07, z: 0.3, ry: 0.3 })
      .boite(0.012, 0.06, 0.06, C.bois, { x: -0.33, y: 0.03, z: 0.28, ry: 0.3 })
      .boite(0.012, 0.06, 0.06, C.bois, { x: -0.17, y: 0.03, z: 0.33, ry: 0.3 })
      .cylindre(0.005, 0.005, 0.28, 5, C.bois, { x: -0.2, y: 0.14, z: 0.37 })
      .piece(new THREE.ConeGeometry(0.13, 0.05, 14), C.rouge, { x: -0.2, y: 0.29, z: 0.37, teinte: (x, y, z) => (Math.floor(Math.atan2(x + 0.2, z - 0.37) * 4.45 + 10) % 2 ? C.rouge : '#c9503e') });
    M.flower = t.lanterne(0.34, -0.3, 0.9).fin();
  }

  yield;
  // Forêt : un bois de grands cèdres sur un sol de mousse, des fougères, des rochers moussus et un sentier de pierres
  {
    const t = atelier().parcelle(bosses(0.48, 0.07, 9), 0.004, C.mousse, { teinte: (x, y, z) => (hasard(x * 9, 1, z * 9) > 0.5 ? C.mousse : C.mousseFonce) });
    for (const [x, z, h, c] of [[0, -0.04, 1.0, C.pinVert], [-0.25, 0.1, 0.75, C.mousseFonce], [0.24, 0.06, 0.82, C.pinVert], [0.06, -0.3, 0.7, '#4a6a3e'],
      [-0.16, -0.26, 0.62, C.pinVert], [0.3, -0.24, 0.55, C.mousseFonce], [-0.36, -0.08, 0.5, '#4a6a3e']]) t.cedre(x, z, h, c);
    for (const [x, z] of [[-0.1, 0.3], [0.16, 0.3], [-0.32, 0.26], [0.38, 0.18], [0.04, 0.18]]) {
      for (let k = 0; k < 4; k++) t.cone(0.03, 0.09, 4, C.herbe, { x: x + 0.02 * Math.sin(k * 1.7), y: 0.04, z: z + 0.02 * Math.cos(k * 1.7), rx: 0.5 * Math.cos(k * 1.7), rz: 0.5 * Math.sin(k * 1.7), trait: false });
    }
    for (const [x, z, r] of [[0.14, 0.4, 0.06], [-0.24, 0.38, 0.05]]) t.rocher(x, 0.02, z, r, C.pierre3, { teinte: (cx, cy) => (cy > 0.04 ? C.mousse : C.pierre3) });
    for (const [x, z] of [[-0.02, 0.44], [-0.05, 0.36], [-0.03, 0.28]]) t.cylindre(0.035, 0.035, 0.02, 8, C.pierre2, { x, y: 0.006, z });
    M.forest = t.fin();
  }

  yield;
  // Village : deux maisons au grand toit de chaume pentu (gasshō-zukuri) aux pignons percés de fenêtres, des
  // rizières en terrasses inondées, un chemin et des cèdres
  {
    const t = atelier().parcelle(bosses(0.48, 0.05, 10), 0.003, C.herbe, { teinte: (x, y, z) => (hasard(x * 9, 1, z * 9) > 0.5 ? C.herbe : C.mousse) });
    // les rizières : de l'eau rayée de jeunes pousses
    for (const [x, z, y] of [[0.18, 0.3, 0.012], [0.2, 0.17, 0.03]]) {
      t.piece(new THREE.BoxGeometry(0.3, 0.03, 0.12, 10, 1, 4), '#9db35a', { x, y: y - 0.01, z, teinte: (cx) => (Math.floor(cx * 60 + 100) % 2 ? '#9db35a' : '#7fb3ad') });
    }
    const maison = (x, z, ry, s) => {
      const cos = Math.cos(ry), sin = Math.sin(ry);
      const local = (dx, dz) => ({ x: x + dx * cos + dz * sin, z: z - dx * sin + dz * cos });
      t.boite(0.34 * s, 0.05 * s, 0.26 * s, C.pierre2, { ...local(0, 0), y: 0.0, ry })
        .boite(0.3 * s, 0.13 * s, 0.22 * s, C.boisFonce, { ...local(0, 0), y: 0.09 * s, ry })
        .boite(0.3 * s + 0.004, 0.06 * s, 0.22 * s + 0.004, C.platre, { ...local(0, 0), y: 0.09 * s, ry, trait: false })
        // le toit de chaume, très pentu, faîtage dans la longueur, en couches
        .pignon(0.38 * s, 0.34 * s, 0.36 * s, C.chaume, { ...local(0, 0), y: 0.155 * s, ry, teinte: (cx, cy) => (Math.floor(cy * 50) % 2 ? C.chaume : '#b49c5c') })
        .boite(0.4 * s, 0.03 * s, 0.05 * s, '#6a5a3a', { ...local(0, 0), y: 0.5 * s, ry });
      // le pignon de bois et ses fenêtres blanches, aux deux bouts
      for (const sens of [-1, 1]) {
        t.pignon(0.01, 0.3 * s, 0.3 * s, C.boisFonce, { ...local(sens * 0.176 * s, 0), y: 0.16 * s, ry, trait: false });
        for (const [dz, dy] of [[-0.05, 0.22], [0.05, 0.22], [0, 0.32]]) t.boite(0.012, 0.045 * s, 0.05 * s, C.platre, { ...local(sens * 0.183 * s, dz * s), y: dy * s, ry, trait: false });
      }
    };
    maison(-0.14, -0.06, 0.3, 1.2);
    maison(0.24, -0.26, -0.25, 0.85);
    for (const [x, z] of [[-0.1, 0.42], [-0.06, 0.3], [-0.02, 0.2]]) t.cylindre(0.03, 0.03, 0.015, 7, C.pierre2, { x, y: 0.006, z });
    M.village = t.cedre(-0.4, -0.25, 0.42).cedre(-0.38, 0.16, 0.3, C.mousseFonce).cedre(0.42, 0.0, 0.34).fin();
  }
  yield;
  // Ville : des immeubles aux rangées de fenêtres, une tour en treillis rouge et blanche, quelques vieilles
  // maisons de ville (machiya) au premier plan et des arbres de rue
  {
    const t = atelier().parcelle(bosses(0.48, 0.05, 11), 0.003, '#b7ae9c', { teinte: (x, y, z) => (hasard(x * 12, 1, z * 12) > 0.5 ? '#b7ae9c' : '#ada491') });
    const immeuble = (x, z, l, h, p, mur) => {
      const pas = 0.035;
      t.piece(new THREE.BoxGeometry(l, h, p, Math.round(l / pas), Math.round(h / pas), Math.round(p / pas)), mur, {
        x, y: h / 2 - 0.02, z,
        teinte: (cx, cy, cz) => {
          if (cy > h - 0.03) return mur;
          const fy = Math.floor((cy + 0.02) / pas), fh = Math.floor((cx + 10) / pas) + Math.floor((cz + 10) / pas);
          return fy % 2 && fh % 2 ? '#56606a' : mur;
        },
      }).boite(l + 0.01, 0.015, p + 0.01, C.grisFonce, { x, y: h - 0.015, z });
    };
    immeuble(-0.2, -0.16, 0.18, 0.62, 0.16, '#d8cfbd');
    immeuble(0.02, -0.28, 0.16, 0.48, 0.14, '#c9bfa9');
    immeuble(-0.3, 0.12, 0.14, 0.36, 0.16, '#cfc6b4');
    immeuble(0.06, -0.02, 0.14, 0.3, 0.14, '#bfb5a0');
    // la tour : quatre pieds qui se rejoignent, deux plateformes, bandes rouges et blanches, antenne
    const tx = 0.27, tz = -0.12;
    const bande = (cx, cy) => (Math.floor(cy * 14) % 2 ? C.rouge : C.blanc);
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      t.baton([tx + sx * 0.11, -0.02, tz + sz * 0.11], [tx + sx * 0.035, 0.45, tz + sz * 0.035], 0.012, C.rouge, 5, { teinte: bande });
      t.baton([tx + sx * 0.035, 0.45, tz + sz * 0.035], [tx + sx * 0.012, 0.72, tz + sz * 0.012], 0.008, C.rouge, 5, { teinte: bande });
    }
    t.boite(0.12, 0.04, 0.12, C.blanc, { x: tx, y: 0.32, z: tz })
      .boite(0.07, 0.03, 0.07, C.blanc, { x: tx, y: 0.56, z: tz })
      .cylindre(0.005, 0.008, 0.24, 5, C.rouge, { x: tx, y: 0.83, z: tz, teinte: bande });
    // les vieilles maisons de ville, au premier plan
    for (const [x, l] of [[-0.12, 0.16], [0.07, 0.18], [0.27, 0.15]]) {
      t.boite(l, 0.1, 0.12, C.bois2, { x, y: 0.03, z: 0.3 })
        .piece(new THREE.BoxGeometry(l - 0.02, 0.05, 0.004, 8, 2, 1), C.boisFonce, { x, y: 0.035, z: 0.362, trait: false, teinte: (cx) => (Math.floor(cx * 150 + 100) % 2 ? C.boisFonce : C.bois) })
        .pignon(l + 0.02, 0.06, 0.15, C.tuile, { x, y: 0.08, z: 0.3 });
    }
    M.city = t.arbre(-0.38, 0.32, 0.22).arbre(0.42, 0.22, 0.2).fin();
  }

  yield;
  // Statue : un grand Bouddha de bronze assis en méditation (comme à Kamakura ou à Nara),
  // sur un trône de lotus, devant un halo doré en forme de flamme, entre deux lanternes
  {
    const bronze = '#6f7a66', robe = '#5f6857', peau = '#7d8672', cheveux = '#4f5748', lotus = '#8c8f73';
    const t = atelier()
      // dalle de pierre (elle s'enfonce dans le sol), piédestal à huit côtés, puis trône de lotus
      .cylindre(0.44, 0.47, 0.16, 8, C.pierre3, { y: -0.08 })
      .cylindre(0.36, 0.4, 0.08, 8, C.pierre2, { y: 0.04 })
      .cylindre(0.3, 0.32, 0.05, 8, C.pierreFonce, { y: 0.105 })
      .cylindre(0.27, 0.23, 0.05, 16, lotus, { y: 0.155 });
    for (let i = 0; i < 14; i++) {
      const ang = (i / 14) * 2 * PI;
      t.ovale(0.075, i % 2 ? lotus : '#9a9c7e', { x: 0.25 * Math.sin(ang), y: 0.175, z: 0.25 * Math.cos(ang), ry: ang, rx: 0.4, ordre: 'YXZ', sx: 0.75, sy: 0.55, sz: 0.3 }, 6);
    }
    // grand halo en forme de flamme (ovale pointu) et auréole de la tête
    t.piece(new THREE.CylinderGeometry(0.3, 0.3, 0.012, 28), '#b8963a', { y: 0.55, z: -0.14, rx: PI / 2, sz: 1.55 })
      .piece(new THREE.ConeGeometry(0.2, 0.26, 3, 1), '#b8963a', { y: 0.97, z: -0.145, sz: 0.04 })
      .piece(new THREE.CylinderGeometry(0.25, 0.25, 0.012, 28), '#caa54a', { y: 0.55, z: -0.132, rx: PI / 2, sz: 1.55 })
      .piece(new THREE.CylinderGeometry(0.15, 0.15, 0.014, 24), C.or, { y: 0.74, z: -0.13, rx: PI / 2 })
      .anneau(0.15, 0.012, '#9c7c2c', { y: 0.74, z: -0.125 })
      // jambes croisées et pieds posés dessus, plante vers le haut
      .ovale(0.2, robe, { y: 0.245, z: 0.04, sx: 1.25, sy: 0.4, sz: 0.85 })
      .ovale(0.045, peau, { x: -0.09, y: 0.29, z: 0.12, sx: 1.4, sy: 0.5 }, 8)
      .ovale(0.045, peau, { x: 0.09, y: 0.29, z: 0.12, sx: 1.4, sy: 0.5 }, 8)
      // buste, épaules et robe qui tombe
      .piece(new THREE.CylinderGeometry(0.14, 0.18, 0.3, 14), bronze, { y: 0.43, sz: 0.7 })
      .ovale(0.16, robe, { y: 0.555, sx: 1.12, sy: 0.5, sz: 0.72 })
      // bras qui descendent vers les mains jointes sur les genoux
      .baton([-0.17, 0.54, 0], [-0.21, 0.37, 0.05], 0.05, robe)
      .baton([0.17, 0.54, 0], [0.21, 0.37, 0.05], 0.05, robe)
      .ovale(0.05, robe, { x: -0.21, y: 0.37, z: 0.05 }, 8)
      .ovale(0.05, robe, { x: 0.21, y: 0.37, z: 0.05 }, 8)
      .baton([-0.21, 0.37, 0.05], [-0.07, 0.31, 0.13], 0.042, robe)
      .baton([0.21, 0.37, 0.05], [0.07, 0.31, 0.13], 0.042, robe)
      .ovale(0.07, peau, { y: 0.315, z: 0.14, sx: 1.35, sy: 0.4, sz: 0.75 }, 10)
      // cou, tête, longs lobes d'oreilles, visage
      .cylindre(0.05, 0.06, 0.07, 10, peau, { y: 0.625 })
      .ovale(0.1, peau, { y: 0.72, sx: 0.95, sy: 1.1, sz: 0.95 }, 14)
      .ovale(0.028, peau, { x: -0.097, y: 0.69, z: -0.005, sx: 0.5, sy: 2.3, sz: 0.8 }, 6)
      .ovale(0.028, peau, { x: 0.097, y: 0.69, z: -0.005, sx: 0.5, sy: 2.3, sz: 0.8 }, 6)
      .cone(0.012, 0.035, 4, peau, { y: 0.71, z: 0.097, rx: PI / 2 })
      .boite(0.03, 0.005, 0.005, cheveux, { x: -0.036, y: 0.735, z: 0.09 })
      .boite(0.03, 0.005, 0.005, cheveux, { x: 0.036, y: 0.735, z: 0.09 })
      .boule(0.009, C.or, { y: 0.758, z: 0.092 })
      .boule(0.055, cheveux, { y: 0.815 }, 1);
    // cheveux en petites boucles sur le haut de la tête et la bosse du crâne
    for (let lat = 25; lat <= 85; lat += 15) {
      const nb = Math.max(1, Math.round(16 * Math.cos((lat * PI) / 180)));
      for (let j = 0; j < nb; j++) {
        const phi = (lat * PI) / 180, lon = (j / nb) * 2 * PI + lat;
        t.boule(0.019, cheveux, { x: 0.095 * Math.cos(phi) * Math.sin(lon), y: 0.73 + 0.105 * Math.sin(phi), z: 0.095 * Math.cos(phi) * Math.cos(lon) });
      }
    }
    // brûle-encens de bronze devant le trône
    M.statue = t
      .cylindre(0.045, 0.032, 0.045, 10, bronze, { y: 0.1025, z: 0.32 })
      .anneau(0.045, 0.008, robe, { y: 0.125, z: 0.32, rx: PI / 2 })
      .lanterne(-0.4, 0.22, 0.85)
      .lanterne(0.4, 0.22, 0.85)
      .fin();
  }

  yield;
  // Nature et grottes : un gros rocher moussu percé d'une grotte, la corde sacrée tendue devant l'entrée, un
  // filet d'eau qui en sort, des arbres et des fougères sur le dessus
  {
    const t = atelier().piece(new THREE.IcosahedronGeometry(0.44, 1), C.roche, {
      y: 0.02, sy: 0.72, sz: 0.85,
      deformer: (x, y, z) => { const k = 0.84 + 0.32 * hasard(x * 6, y * 6, z * 6); return [x * k, y * k, z * k]; },
      teinte: (x, y, z) => (y > 0.2 + 0.06 * hasard(x * 9, 1, z * 9) ? (hasard(x * 7, 2, z * 7) > 0.5 ? C.mousse : C.mousseFonce) : hasard(x * 11, y * 11, z * 11) > 0.5 ? '#8a7a64' : '#776a57'),
      nuance: 0.07,
    });
    t.ovale(0.15, '#241d18', { y: 0.1, z: 0.32, sx: 0.95, sy: 1.05, sz: 0.35 }, 12)
      .ovale(0.11, '#120e0b', { y: 0.09, z: 0.345, sx: 0.9, sy: 0.95, sz: 0.25, trait: false }, 10)
      .shimenawa([[-0.16, 0.24, 0.33], [0, 0.21, 0.4], [0.16, 0.24, 0.33]], 0.014, [[-0.07, 0.205, 0.39], [0.07, 0.205, 0.39]])
      .parcelle(bosses(0.11, 0.2, 3), 0.008, C.eau, { x: 0.02, z: 0.44, bas: -0.03 })
      .lignesEau(bosses(0.11, 0.2, 3), 0.008, { x: 0.02, z: 0.44, fs: [0.6] });
    for (const [x, z, r] of [[0.22, 0.36, 0.05], [-0.24, 0.34, 0.06], [0.33, 0.2, 0.04]]) t.rocher(x, 0.02, z, r, C.pierre3);
    M.cave = t.cedre(-0.1, -0.1, 0.28, C.pinVert, null, 0.26).arbre(0.16, -0.05, 0.24, [C.mousse, C.feuillage], { y: 0.24 }).fin();
  }

  yield;
  // Point de vue : une colline, le pavillon d'observation (azumaya) au toit en pyramide, son banc, la longue-vue
  // et la barrière au bord, des marches de pierre et un pin
  {
    const t = atelier().piece(new THREE.SphereGeometry(0.47, 18, 7, 0, 2 * PI, 0, PI / 2), C.herbe, {
      y: -0.12, sy: 0.7,
      deformer: (x, y, z) => { const k = 1 + 0.08 * Math.sin(Math.atan2(x, z) * 3 + 2); return [x * k, y, z * k]; },
      teinte: (x, y, z) => (hasard(x * 9, y * 9, z * 9) > 0.5 ? C.herbe : C.mousse),
    });
    const sol = 0.2;
    t.cylindre(0.17, 0.18, 0.04, 8, C.pierre2, { x: -0.04, y: sol - 0.005, z: -0.06 });
    for (const [x, z] of [[-0.15, -0.17], [0.07, -0.17], [-0.15, 0.05], [0.07, 0.05]]) t.cylindre(0.012, 0.014, 0.2, 6, C.boisFonce, { x, y: sol + 0.11, z });
    t.boite(0.16, 0.015, 0.05, C.bois, { x: -0.04, y: sol + 0.06, z: -0.12 })
      .toitJapon(0.36, 0.36, 0.13, 0, { x: -0.04, y: sol + 0.2, z: -0.06, releve: 0.035, rangs: 6, epaisseur: 0.016 })
      .boule(0.018, C.or, { x: -0.04, y: sol + 0.345, z: -0.06 }, 1)
      // la longue-vue sur son pied, au bord
      .cylindre(0.008, 0.01, 0.1, 6, C.faitage, { x: 0.22, y: sol - 0.03 + 0.05, z: 0.16 })
      .cylindre(0.014, 0.018, 0.09, 8, C.faitage, { x: 0.22, y: sol + 0.04, z: 0.18, rx: 1.2 });
    for (let k = -2; k <= 2; k++) t.boite(0.01, 0.06, 0.01, C.bois, { x: 0.06 + k * 0.07, y: 0.17, z: 0.28 - Math.abs(k) * 0.02 });
    t.piece(new THREE.BoxGeometry(0.3, 0.01, 0.01, 6, 1, 1), C.bois, { x: 0.06, y: 0.195, z: 0.26, deformer: (x, y, z) => [x, y, z + 0.02 - 0.02 * (Math.abs(x) / 0.14) * 2 + 0.02] });
    for (const [z, y] of [[0.42, 0.0], [0.36, 0.05], [0.3, 0.1]]) t.boite(0.1, 0.03, 0.06, C.pierre2, { x: -0.22, y, z });
    M.viewpoint = t.pinJapon(-0.3, -0.12, 0.7, 1).fin();
  }

  yield;
  // Fête : la tour de tambour (yagura) drapée de rouge et blanc, son grand tambour, et les guirlandes de
  // lanternes de papier tendues jusqu'aux mâts
  {
    const t = atelier().parcelle(bosses(0.48, 0.05, 12), 0.003, '#c9b48a', { teinte: (x, y, z) => (hasard(x * 12, 1, z * 12) > 0.5 ? '#c9b48a' : '#bfa97c') });
    for (const [x, z] of [[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]]) t.cylindre(0.016, 0.02, 0.5, 6, C.bois, { x, y: 0.22, z });
    // le rideau rouge et blanc (kōhaku) autour du bas
    const rayures = (cx, cy, cz) => (Math.floor((cx + cz) * 30 + 100) % 2 ? C.rouge : C.blanc);
    for (const [x, z, ry] of [[0, 0.142, 0], [0, -0.142, 0], [0.142, 0, PI / 2], [-0.142, 0, PI / 2]]) {
      t.piece(new THREE.BoxGeometry(0.28, 0.2, 0.008, 10, 1, 1), C.rouge, { x, y: 0.2, z, ry, teinte: rayures, nuance: 0.02 });
    }
    t.boite(0.36, 0.03, 0.36, C.bois, { y: 0.32 });
    for (const [x, z, l, ry] of [[0, 0.17, 0.34, 0], [0, -0.17, 0.34, 0], [0.17, 0, 0.34, PI / 2], [-0.17, 0, 0.34, PI / 2]]) t.boite(l, 0.012, 0.012, C.laque, { x, y: 0.39, z, ry });
    t.cylindre(0.07, 0.07, 0.1, 14, C.bois2, { y: 0.41, rx: PI / 2 })
      .cylindre(0.064, 0.064, 0.104, 14, '#e8dcc0', { y: 0.41, rx: PI / 2, sy: 1 })
      .cylindre(0.07, 0.07, 0.07, 14, C.bois2, { y: 0.41, rx: PI / 2 })
      .toitJapon(0.38, 0.38, 0.08, 0.15, { y: 0.5, releve: 0.03, rangs: 6, epaisseur: 0.016 });
    // les guirlandes de lanternes, du haut de la tour jusqu'aux quatre mâts
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const mx = sx * 0.4, mz = sz * 0.34;
      t.cylindre(0.01, 0.012, 0.5, 5, C.bois, { x: mx, y: 0.23, z: mz });
      const pts = [];
      for (let k = 0; k <= 6; k++) {
        const f = k / 6;
        pts.push([sx * 0.14 + (mx - sx * 0.14) * f, 0.46 - 0.1 * f - 0.08 * Math.sin(PI * f), sz * 0.14 + (mz - sz * 0.14) * f]);
      }
      t.tube(pts, 0.004, C.noir, { pas: 12, cotes: 4, trait: false });
      for (const f of [0.25, 0.5, 0.75]) {
        const [x, y, z] = [sx * 0.14 + (mx - sx * 0.14) * f, 0.46 - 0.1 * f - 0.08 * Math.sin(PI * f), sz * 0.14 + (mz - sz * 0.14) * f];
        t.chochin(x, y - 0.045, z, 1, f === 0.5 ? C.blanc : C.rouge);
      }
    }
    M.festival = t.fin();
  }

  yield;
  // Train : une locomotive à vapeur noire et son tender sur la voie (ballast, traverses, rails), roues aux
  // jantes blanches, bielles, fanal, et son panache de fumée
  {
    const t = atelier().boite(0.94, 0.05, 0.24, '#8e8676', { y: -0.01, teinte: (x, y, z) => (hasard(x * 30, y, z * 30) > 0.5 ? '#8e8676' : '#7d7566'), nuance: 0.06 });
    for (let x = -0.43; x <= 0.44; x += 0.072) t.boite(0.035, 0.016, 0.2, C.boisFonce, { x, y: 0.022 });
    for (const z of [-0.065, 0.065]) t.boite(0.94, 0.018, 0.016, C.grisFonce, { y: 0.039, z });
    const noir = '#2f2d2e';
    // les roues : trois grandes motrices, une petite à l'avant, de chaque côté
    for (const z of [-0.08, 0.08]) {
      for (const x of [-0.12, 0.02, 0.16]) {
        t.cylindre(0.062, 0.062, 0.02, 14, noir, { x, y: 0.1, z, rx: PI / 2 })
          .anneau(0.056, 0.006, C.blanc, { x, y: 0.1, z: z + Math.sign(z) * 0.011, trait: false });
      }
      t.cylindre(0.035, 0.035, 0.02, 10, noir, { x: 0.3, y: 0.075, z, rx: PI / 2 })
        .boite(0.3, 0.012, 0.008, '#9a9890', { x: 0.02, y: 0.1, z: z + Math.sign(z) * 0.016 });
    }
    t.boite(0.66, 0.035, 0.17, noir, { x: 0.04, y: 0.17 })
      .boite(0.66, 0.012, 0.18, C.rouge, { x: 0.04, y: 0.15 })
      .cylindre(0.08, 0.08, 0.4, 14, noir, { x: 0.1, y: 0.26, rz: PI / 2 })
      .cylindre(0.084, 0.084, 0.06, 14, '#262425', { x: 0.31, y: 0.26, rz: PI / 2 })
      .cylindre(0.05, 0.05, 0.01, 12, '#3a3838', { x: 0.342, y: 0.26, rz: PI / 2 })
      .boule(0.016, C.verre, { x: 0.345, y: 0.33 }, 1)
      .boite(0.03, 0.04, 0.2, C.rouge, { x: 0.37, y: 0.12 });
    for (const x of [-0.02, 0.12, 0.24]) t.anneau(0.081, 0.004, C.or, { x, y: 0.26, ry: PI / 2, trait: false });
    t.cylindre(0.025, 0.03, 0.09, 10, noir, { x: 0.27, y: 0.37 })
      .cylindre(0.034, 0.028, 0.02, 10, noir, { x: 0.27, y: 0.42 })
      .dome(0.04, noir, { x: 0.14, y: 0.33 })
      .dome(0.032, noir, { x: 0.04, y: 0.33 })
      // la cabine et ses fenêtres
      .boite(0.15, 0.2, 0.19, noir, { x: -0.2, y: 0.28 })
      .boite(0.17, 0.018, 0.21, '#3a3838', { x: -0.2, y: 0.39 })
      .boite(0.05, 0.05, 0.004, C.verre, { x: -0.2, y: 0.32, z: 0.097, trait: false })
      .boite(0.05, 0.05, 0.004, C.verre, { x: -0.2, y: 0.32, z: -0.097, trait: false })
      // le tender et son charbon
      .boite(0.22, 0.14, 0.18, noir, { x: -0.39, y: 0.21 })
      .boite(0.18, 0.03, 0.15, '#1e1c1d', { x: -0.39, y: 0.29, teinte: (x, y, z) => (hasard(x * 40, y, z * 40) > 0.5 ? '#1e1c1d' : '#2c2a2b') });
    for (const x of [-0.45, -0.33]) for (const z of [-0.08, 0.08]) t.cylindre(0.035, 0.035, 0.02, 10, noir, { x, y: 0.075, z, rx: PI / 2 });
    for (const [x, y, z, r] of [[0.27, 0.5, 0, 0.05], [0.2, 0.58, 0.01, 0.065], [0.1, 0.65, -0.01, 0.075]]) t.boule(r, C.fumee, { x, y, z }, 1);
    M.train = t.fin();
  }

  yield;
  // Neige : une hutte de neige (kamakura) éclairée de l'intérieur, un bonhomme de neige à seau rouge, des cèdres
  // chargés de neige et une lanterne de pierre coiffée de neige
  {
    const t = atelier().parcelle(bosses(0.48, 0.06, 13), 0.01, C.neige, { bord: '#e6e1d6', teinte: (x, y, z) => (hasard(x * 10, 1, z * 10) > 0.5 ? C.neige : '#e9e6e0') });
    t.dome(0.25, C.neige, { x: -0.06, y: 0.0, z: -0.04, sy: 0.85 })
      .ovale(0.075, '#3a2a20', { x: -0.06, y: 0.07, z: 0.17, sx: 1, sy: 1.15, sz: 0.4 }, 10)
      .ovale(0.055, '#e9a24a', { x: -0.06, y: 0.065, z: 0.185, sx: 1, sy: 1.1, sz: 0.25, trait: false }, 10)
      // le bonhomme de neige
      .boule(0.07, C.neige, { x: 0.26, y: 0.07, z: 0.2 }, 1)
      .boule(0.05, C.neige, { x: 0.26, y: 0.17, z: 0.2 }, 1)
      .cylindre(0.03, 0.036, 0.04, 8, C.rouge, { x: 0.26, y: 0.23, z: 0.2, rz: 0.15 })
      .boule(0.008, C.noir, { x: 0.245, y: 0.18, z: 0.247 }, 0)
      .boule(0.008, C.noir, { x: 0.275, y: 0.18, z: 0.247 }, 0)
      .cedre(0.3, -0.22, 0.62, C.pinVert, C.neige)
      .cedre(-0.36, 0.18, 0.4, C.mousseFonce, C.neige)
      .lanterne(0.06, 0.36, 0.8)
      .cylindre(0.03, 0.07, 0.025, 8, C.neige, { x: 0.06, y: 0.235, z: 0.36 });
    M.snow = t.fin();
  }

  yield;
  // Parc à thème : une grande roue aux nacelles de couleurs, sur ses pieds en A, et un manège à toit rayé
  {
    const t = atelier().parcelle(bosses(0.48, 0.05, 14), 0.003, '#bdb39f', { teinte: (x, y, z) => (hasard(x * 12, 1, z * 12) > 0.5 ? '#bdb39f' : '#b2a893') });
    const cx = 0.08, cz = -0.12, cy = 0.5, R = 0.34;
    for (const z of [-0.06, 0.06]) {
      t.baton([cx - 0.18, -0.02, cz + z * 1.6], [cx, cy, cz + z], 0.014, C.blanc, 6)
        .baton([cx + 0.18, -0.02, cz + z * 1.6], [cx, cy, cz + z], 0.014, C.blanc, 6)
        .anneau(R, 0.01, C.blanc, { x: cx, y: cy, z: cz + z })
        .anneau(R * 0.55, 0.006, C.blanc, { x: cx, y: cy, z: cz + z });
      for (let i = 0; i < 12; i++) t.boite(0.006, R, 0.006, C.blanc, { x: cx + (R / 2) * Math.sin((i * PI) / 6), y: cy + (R / 2) * Math.cos((i * PI) / 6), z: cz + z, rz: -(i * PI) / 6, trait: false });
    }
    t.cylindre(0.03, 0.03, 0.15, 10, C.grisFonce, { x: cx, y: cy, z: cz, rx: PI / 2 });
    const teintes = [C.rouge, C.ocre, '#3e5a74', C.mousse, '#c96b8f', '#e3b86c'];
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * 2 * PI, x = cx + R * Math.sin(ang), y = cy + R * Math.cos(ang) - 0.045;
      t.boite(0.05, 0.045, 0.06, teintes[i % 6], { x, y, z: cz })
        .boite(0.058, 0.01, 0.068, C.blanc, { x, y: y + 0.027, z: cz });
    }
    // le manège
    const mx = -0.26, mz = 0.22;
    t.cylindre(0.15, 0.16, 0.04, 16, C.blanc, { x: mx, y: 0.0, z: mz });
    for (let i = 0; i < 8; i++) t.cylindre(0.006, 0.006, 0.14, 5, C.or, { x: mx + 0.12 * Math.sin((i * PI) / 4), y: 0.09, z: mz + 0.12 * Math.cos((i * PI) / 4) });
    for (let i = 0; i < 6; i++) t.boite(0.02, 0.035, 0.05, teintes[i], { x: mx + 0.1 * Math.sin((i * PI) / 3), y: 0.08, z: mz + 0.1 * Math.cos((i * PI) / 3), ry: (i * PI) / 3 });
    M.themepark = t.cylindre(0.035, 0.035, 0.14, 8, C.laque, { x: mx, y: 0.09, z: mz })
      .piece(new THREE.ConeGeometry(0.17, 0.1, 16), C.rouge, { x: mx, y: 0.21, z: mz, teinte: (x, y, z) => (Math.floor(Math.atan2(x - mx, z - mz) * 2.55 + 10) % 2 ? C.rouge : C.blanc) })
      .cylindre(0.003, 0.003, 0.07, 4, C.noir, { x: mx, y: 0.29, z: mz })
      .boite(0.04, 0.025, 0.003, C.ocre, { x: mx + 0.02, y: 0.31, z: mz, trait: false })
      .fin();
  }

  yield;
  // Nourriture : une échoppe de rue (yatai) en bois sur ses roues, son rideau indigo (noren), sa lanterne rouge,
  // sa marmite fumante, ses bols et deux tabourets
  {
    const t = atelier().parcelle(bosses(0.44, 0.06, 15), 0.003, '#c9b48a', { teinte: (x, y, z) => (hasard(x * 12, 1, z * 12) > 0.5 ? '#c9b48a' : '#bfa97c') });
    t.boite(0.46, 0.22, 0.26, C.bois, { y: 0.14 })
      .piece(new THREE.BoxGeometry(0.44, 0.18, 0.004, 11, 1, 1), C.bois2, { y: 0.14, z: 0.132, trait: false, teinte: (x) => (Math.floor(x * 50 + 100) % 2 ? C.bois2 : C.bois) })
      .boite(0.52, 0.025, 0.36, C.boisFonce, { y: 0.26, z: 0.03 });
    for (const x of [-0.13, 0.13]) {
      t.cylindre(0.085, 0.085, 0.025, 14, C.boisFonce, { x, y: 0.085, z: 0.145, rx: PI / 2 })
        .cylindre(0.02, 0.02, 0.03, 8, C.bois, { x, y: 0.085, z: 0.15, rx: PI / 2 });
    }
    for (const [x, z] of [[-0.24, -0.12], [0.24, -0.12], [-0.24, 0.18], [0.24, 0.18]]) t.cylindre(0.011, 0.011, 0.26, 5, C.boisFonce, { x, y: 0.4, z });
    t.pignon(0.58, 0.1, 0.42, C.tuile, { y: 0.53, z: 0.03 })
      // le noren indigo, fendu en bandes, avec son motif blanc
      .piece(new THREE.BoxGeometry(0.46, 0.09, 0.006, 5, 1, 1), '#3e5a74', { y: 0.47, z: 0.19, teinte: (x) => (Math.floor(x * 10.9 + 100) % 2 ? '#3e5a74' : '#35506a') })
      .boite(0.05, 0.05, 0.008, C.papier, { y: 0.47, z: 0.19, trait: false })
      .chochin(0.29, 0.42, 0.19, 1.3, C.rouge)
      // marmite fumante et bols sur le comptoir
      .cylindre(0.05, 0.045, 0.06, 12, C.grisFonce, { x: -0.1, y: 0.3, z: 0.05 })
      .boule(0.04, C.fumee, { x: -0.1, y: 0.37, z: 0.05, trait: false }, 1)
      .boule(0.05, '#e9e4da', { x: -0.08, y: 0.44, z: 0.06, trait: false }, 1)
      .cylindre(0.028, 0.018, 0.022, 10, C.rouge, { x: 0.08, y: 0.282, z: 0.12 })
      .cylindre(0.028, 0.018, 0.022, 10, C.platre, { x: 0.15, y: 0.282, z: 0.1 });
    for (const x of [-0.08, 0.1]) t.cylindre(0.04, 0.04, 0.1, 10, C.bois, { x, y: 0.05, z: 0.32 });
    M.food = t.fin();
  }

  yield;
  // Site historique : une grande porte de bois sous son toit de tuiles, ses vantaux cloutés, entre deux murs
  // blancs aux carreaux de « peau de mer » (namako) ; un pin derrière et une lanterne
  {
    const t = atelier().parcelle(bosses(0.47, 0.05, 16), 0.003, '#d2c6a8', { teinte: (x, y, z) => (hasard(x * 12, 1, z * 12) > 0.5 ? '#d2c6a8' : '#c8bb9b') });
    for (const x of [-0.17, 0.17]) {
      t.boite(0.06, 0.56, 0.06, C.boisFonce, { x, y: 0.26 })
        .cylindre(0.045, 0.05, 0.04, 8, C.pierre2, { x, y: 0.0 });
    }
    for (const x of [-0.17, 0.17]) t.boite(0.04, 0.5, 0.04, C.boisFonce, { x, y: 0.23, z: -0.14 });
    for (const x of [-0.075, 0.075]) {
      t.boite(0.145, 0.42, 0.025, '#4a3322', { x, y: 0.21 });
      for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) t.boule(0.007, C.or, { x: x - 0.04 + i * 0.04, y: 0.08 + j * 0.09, z: 0.015, trait: false }, 0);
    }
    t.boite(0.42, 0.045, 0.07, C.boisFonce, { y: 0.47 })
      .boite(0.42, 0.04, 0.24, C.boisFonce, { y: 0.53, z: -0.07 })
      .toitJapon(0.66, 0.42, 0.11, 0.3, { y: 0.55, z: -0.07, releve: 0.04, rangs: 10 })
      .pignon(0.26, 0.08, 0.13, C.tuile, { y: 0.66, z: -0.07 })
      .boite(0.3, 0.025, 0.035, C.faitage, { y: 0.745, z: -0.07 })
      .boite(0.035, 0.05, 0.04, C.faitage, { x: -0.155, y: 0.765, z: -0.07 })
      .boite(0.035, 0.05, 0.04, C.faitage, { x: 0.155, y: 0.765, z: -0.07 });
    // les murs blancs à carreaux de « peau de mer », sur leur soubassement de pierre, et leur chaperon de tuiles
    for (const s of [-1, 1]) {
      const x = s * 0.33;
      t.boite(0.26, 0.06, 0.08, C.pierre2, { x, y: 0.01 })
        .piece(new THREE.BoxGeometry(0.24, 0.12, 0.07, 8, 4, 1), C.platre, {
          x, y: 0.1,
          teinte: (cx, cy, cz) => (cy < 0.12 && (Math.floor((cx + cy) * 40 + 100) % 3 === 0 || Math.floor((cx - cy) * 40 + 100) % 3 === 0) ? '#6e6a63' : C.platre),
        })
        .boite(0.24, 0.07, 0.07, C.platre, { x, y: 0.195 })
        .pignon(0.27, 0.05, 0.12, C.tuile, { x, y: 0.23 });
    }
    M.museum = t.pinJapon(-0.3, -0.32, 0.9, 1).lanterne(0.36, 0.28, 0.85).fin();
  }

  yield;
  // Hôtel : une auberge traditionnelle (ryokan) à étage, murs blancs et colombages, balcon de bois, toits de
  // tuiles aux coins relevés, rideau d'entrée et lanternes ; un petit jardin
  {
    const t = atelier().parcelle(bosses(0.48, 0.05, 17), 0.003, '#d2c6a8', { teinte: (x, y, z) => (hasard(x * 12, 1, z * 12) > 0.5 ? '#d2c6a8' : '#c8bb9b') });
    t.boite(0.62, 0.06, 0.4, C.pierre2, { y: 0.0, z: -0.08 })
      .boite(0.58, 0.18, 0.36, C.platre, { y: 0.12, z: -0.08 });
    for (const x of [-0.28, -0.14, 0, 0.14, 0.28]) t.boite(0.018, 0.18, 0.37, C.boisFonce, { x, y: 0.12, z: -0.08 });
    t.boite(0.6, 0.02, 0.38, C.boisFonce, { y: 0.21, z: -0.08 })
      .piece(new THREE.BoxGeometry(0.2, 0.08, 0.004, 8, 3, 1), C.bois, { x: -0.18, y: 0.12, z: 0.102, trait: false, teinte: (cx, cy) => ((Math.floor(cx * 40 + 100) + Math.floor(cy * 37 + 100)) % 2 ? '#6a4a30' : '#a07a52') })
      .piece(new THREE.BoxGeometry(0.1, 0.07, 0.006, 3, 1, 1), '#3e5a74', { x: 0.1, y: 0.15, z: 0.104, teinte: (x) => (Math.floor(x * 30 + 100) % 2 ? '#3e5a74' : '#35506a') })
      .chochin(0.025, 0.14, 0.12, 1, C.rouge)
      .chochin(0.175, 0.14, 0.12, 1, C.rouge)
      .toitJapon(0.74, 0.5, 0.06, 0.78, { y: 0.215, z: -0.08, releve: 0.03, rangs: 14 })
      .boite(0.52, 0.15, 0.3, C.bois, { y: 0.34, z: -0.1 })
      .piece(new THREE.BoxGeometry(0.44, 0.08, 0.004, 14, 3, 1), C.bois, { y: 0.35, z: 0.052, trait: false, teinte: (cx, cy) => ((Math.floor(cx * 32 + 100) + Math.floor(cy * 37 + 100)) % 2 ? '#6a4a30' : '#e8dcc0') })
      // le balcon et sa balustrade
      .boite(0.54, 0.012, 0.06, C.boisFonce, { y: 0.28, z: 0.08 })
      .boite(0.54, 0.01, 0.01, C.boisFonce, { y: 0.33, z: 0.105 });
    for (let x = -0.25; x <= 0.251; x += 0.05) t.boite(0.008, 0.05, 0.008, C.boisFonce, { x, y: 0.305, z: 0.105 });
    M.hotel = t.toitJapon(0.66, 0.46, 0.13, 0.45, { y: 0.415, z: -0.1, releve: 0.04, rangs: 14 })
      .pignon(0.3, 0.08, 0.2, C.tuile, { y: 0.545, z: -0.1 })
      .boite(0.32, 0.022, 0.03, C.faitage, { y: 0.63, z: -0.1 })
      .pinJapon(0.36, 0.3, 0.7, -1)
      .rocher(-0.32, 0.02, 0.32, 0.05, C.pierre3)
      .lanterne(-0.22, 0.34, 0.75)
      .fin();
  }

  yield;
  // Église : une église de briques comme celles de Nagasaki (Kuroshima, Ōura), sa nef, son clocher à flèche
  // octogonale et sa croix, ses fenêtres en ogive et sa rosace
  {
    const t = atelier().parcelle(bosses(0.47, 0.05, 18), 0.003, C.herbe, { teinte: (x, y, z) => (hasard(x * 9, 1, z * 9) > 0.5 ? C.herbe : C.mousse) });
    const briques = (cx, cy, cz) => (Math.floor(cy * 45) % 2 ? C.brique : C.briqueClaire);
    t.piece(new THREE.BoxGeometry(0.32, 0.3, 0.52, 4, 12, 6), C.brique, { y: 0.13, z: -0.08, teinte: briques })
      .pignon(0.6, 0.15, 0.38, C.faitage, { y: 0.28, z: -0.08, ry: PI / 2 })
      .pignon(0.012, 0.13, 0.3, C.brique, { y: 0.28, z: 0.17, ry: PI / 2, teinte: briques });
    for (const z of [-0.26, -0.12, 0.02]) {
      for (const s of [-1, 1]) {
        t.boite(0.008, 0.11, 0.045, '#3f4a4f', { x: s * 0.162, y: 0.15, z, trait: false })
          .cylindre(0.0225, 0.0225, 0.008, 8, '#3f4a4f', { x: s * 0.162, y: 0.205, z, rz: PI / 2, trait: false });
      }
    }
    // le clocher à l'avant
    t.piece(new THREE.BoxGeometry(0.17, 0.5, 0.17, 3, 18, 3), C.brique, { y: 0.23, z: 0.25, teinte: briques })
      .boite(0.06, 0.12, 0.01, C.boisFonce, { y: 0.06, z: 0.337, trait: false })
      .cylindre(0.035, 0.035, 0.008, 12, '#3f4a4f', { y: 0.3, z: 0.337, rx: PI / 2, trait: false })
      .boite(0.04, 0.06, 0.01, '#3f4a4f', { y: 0.41, z: 0.337, trait: false })
      .boite(0.19, 0.025, 0.19, C.pierre2, { y: 0.49, z: 0.25 })
      .cylindre(0.002, 0.11, 0.24, 8, '#5f7a6a', { y: 0.62, z: 0.25 })
      .boite(0.012, 0.11, 0.012, C.or, { y: 0.78, z: 0.25 })
      .boite(0.06, 0.012, 0.012, C.or, { y: 0.8, z: 0.25 });
    M.church = t.cedre(-0.34, -0.2, 0.45).cedre(0.34, -0.28, 0.38, C.mousseFonce).fin();
  }

  yield;
  // Par défaut (icône inconnue, emoji…) : une stèle de pierre gravée sur son socle, des offrandes de fleurs,
  // deux petites lanternes et un pin
  {
    const t = atelier().parcelle(bosses(0.42, 0.05, 19), 0.003, '#d2c6a8', { teinte: (x, y, z) => (hasard(x * 12, 1, z * 12) > 0.5 ? '#d2c6a8' : '#c8bb9b') });
    t.boite(0.36, 0.08, 0.24, C.pierre3, { y: 0.0 })
      .boite(0.28, 0.06, 0.18, C.pierre2, { y: 0.07 })
      .boite(0.18, 0.42, 0.075, '#8d887d', { y: 0.31 })
      .cylindre(0.09, 0.09, 0.075, 14, '#8d887d', { y: 0.52, rx: PI / 2 });
    for (const [x, h] of [[-0.035, 0.26], [0, 0.3], [0.035, 0.22]]) t.boite(0.012, h, 0.006, '#4f4a43', { x, y: 0.39 - h / 2 + 0.06, z: 0.04, trait: false });
    for (const s of [-1, 1]) {
      t.cylindre(0.018, 0.015, 0.05, 8, C.pierre2, { x: s * 0.1, y: 0.125, z: 0.07 });
      for (let k = 0; k < 3; k++) t.boule(0.012, k % 2 ? '#e7a4b6' : C.ocre, { x: s * 0.1 + 0.01 * (k - 1), y: 0.16 + 0.006 * k, z: 0.07 }, 0);
    }
    M.stele = t.lanterne(-0.3, 0.12, 0.7).lanterne(0.3, 0.12, 0.7).pinJapon(0.2, -0.3, 0.75, -1).fin();
  }

  return M;
}

/** Tous les modèles d'un coup (la galerie modeles.html). */
export function fabriquerModeles(THREE) {
  const fabrique = fabriquerPeuAPeu(THREE);
  let etape;
  do etape = fabrique.next(); while (!etape.done);
  return etape.value;
}

/**
 * Le bateau de la mer vivante : un bezaisen (« kitamae-bune ») de l'époque Edo, avec sa grande voile carrée
 * à bandes, sa proue en lame et ses bordages hauts. Proue vers +z, ligne de flottaison à y = 0 (la coque
 * descend un peu dessous : la mer la cache). Environ 1,15 de haut et 1,15 de long.
 */
export function fabriquerBateau(THREE) {
  const a = ateliers(THREE)();
  const PI = Math.PI;

  // Coque : le profil de côté (longueur, hauteur), épaissi sur la largeur, puis affiné vers la proue et la quille
  const profil = new THREE.Shape([
    [-0.48, -0.06], [0.3, -0.06], [0.5, 0.1], [0.62, 0.34], [0.55, 0.36], [0.44, 0.19],
    [-0.28, 0.16], [-0.4, 0.24], [-0.54, 0.27], [-0.52, 0.12],
  ].map(([u, v]) => new THREE.Vector2(u, v)));
  const largeur = 0.3;
  const coque = new THREE.ExtrudeGeometry(profil, { depth: largeur, bevelEnabled: false });
  coque.translate(0, 0, -largeur / 2);
  coque.rotateY(-PI / 2); // longueur → z, largeur → x
  const pos = coque.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i), z = pos.getZ(i);
    pos.setX(i, pos.getX(i) * (1 - 0.88 * lisse(0.22, 0.6, z)) * (1 - 0.22 * lisse(-0.3, -0.52, z)) * (0.55 + 0.45 * lisse(-0.06, 0.1, y)));
  }
  a.piece(coque, '#7a5232');

  // Bordages hauts (kakitatsu) le long du pont, avec leur lisse sombre ; la cabine à l'arrière ; le gouvernail
  for (const cote of [-1, 1]) {
    a.boite(0.018, 0.08, 0.62, '#a07450', { x: cote * 0.136, y: 0.2, z: -0.06 });
    a.boite(0.026, 0.018, 0.64, '#3a2a1c', { x: cote * 0.136, y: 0.245, z: -0.06 });
  }
  a.boite(0.24, 0.09, 0.19, '#8a6240', { y: 0.29, z: -0.38 })
    .pignon(0.27, 0.05, 0.22, '#4a4a4f', { y: 0.335, z: -0.38, ry: PI / 2 })
    .boite(0.03, 0.26, 0.12, C.boisFonce, { y: 0.05, z: -0.56, rx: 0.15 });

  // Mât, vergues et la grande voile carrée en bandes de toile, gonflée vers l'avant
  a.cylindre(0.018, 0.024, 0.98, 6, C.boisFonce, { y: 0.65, z: 0.02 })
    .baton([-0.38, 1.06, 0.06], [0.38, 1.06, 0.06], 0.016, C.boisFonce, 6)
    .baton([-0.36, 0.42, 0.08], [0.36, 0.42, 0.08], 0.012, C.boisFonce, 6);
  const voileZ = (x, y) => 0.07 + 0.06 * Math.cos((x / 0.36) * (PI / 2)) + 0.03 * Math.sin((PI * (y - 0.43)) / 0.62);
  /** Une bande de voile entre x0 et x1, vue des deux côtés (une face de chaque sens). */
  function bande(x0, x1, y0, y1, c, zDe = voileZ) {
    const tri = [];
    const n = 3;
    for (let k = 0; k < n; k++) {
      const ya = y0 + ((y1 - y0) * k) / n, yb = y0 + ((y1 - y0) * (k + 1)) / n;
      const A = [x0, ya, zDe(x0, ya)], B = [x1, ya, zDe(x1, ya)], Cc = [x1, yb, zDe(x1, yb)], D = [x0, yb, zDe(x0, yb)];
      tri.push(A, B, Cc, A, Cc, D, A, Cc, B, A, D, Cc);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(tri.flat(), 3));
    a.piece(g, c);
  }
  for (let i = 0; i < 6; i++) bande(-0.36 + i * 0.12, -0.24 + i * 0.12, 0.43, 1.05, i % 2 ? '#e3d3ae' : '#f4ecd8');
  // le blason de l'armateur (un cercle et un trait), devant et derrière la voile
  for (const sens of [1, -1]) {
    const z = voileZ(0, 0.76) + sens * 0.008;
    a.piece(new THREE.CylinderGeometry(0.068, 0.068, 0.004, 14), '#35251a', { y: 0.76, z, rx: PI / 2 })
      .boite(0.1, 0.022, 0.004, '#f4ecd8', { y: 0.76, z: z + sens * 0.004 });
  }

  // Petite voile de proue (yaho) sur son mât penché, et la flamme rouge en haut du mât
  a.baton([0, 0.18, 0.4], [0, 0.62, 0.6], 0.01, C.boisFonce, 5);
  bande(-0.1, 0.1, 0.36, 0.56, '#f4ecd8', (x, y) => 0.48 + (y - 0.36) * 0.45);
  const flamme = new THREE.BufferGeometry();
  const F = [[0, 1.13, 0.02], [0, 1.05, 0.02], [0, 1.09, 0.24]];
  flamme.setAttribute('position', new THREE.Float32BufferAttribute([...F[0], ...F[1], ...F[2], ...F[0], ...F[2], ...F[1]], 3));
  a.piece(flamme, C.rouge);

  return a.fin(0, false);
}

