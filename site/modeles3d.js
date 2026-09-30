// ================================================================
//  Les petits modèles 3D des lieux : un modèle standard par icône de
//  catégorie (un torii pour tous les sanctuaires, une pagode pour
//  toutes les pagodes…), comme des pions de jeu posés sur la carte.
//  Chaque modèle mesure environ 1 de haut et tient dans un disque de
//  rayon 0,5 (le socle, dessiné à part dans la couleur de la catégorie).
//  Fabriqués ici avec des formes simples : aucun fichier à télécharger.
// ================================================================

// Couleurs de peinture des modèles (un peu passées, pour aller avec la vieille carte)
const C = {
  vermillon: '#b5452c', noir: '#2c2724', toit: '#4a4a4f', bois: '#8a5a36', boisFonce: '#5b3b25',
  platre: '#eee6d4', pierre: '#a59c8b', pierreFonce: '#7c7466', or: '#c9a13b', feuillage: '#6d8b47',
  pinVert: '#4f6d3d', herbe: '#8aa35a', eau: '#5a9ea6', ecume: '#e6f0ec', sable: '#dcc89a',
  roche: '#8a7a64', neige: '#f3f0e8', rose: '#e7a4b6', roseFonce: '#d4849a', chaume: '#a8904f',
  bronze: '#6f7563', fumee: '#dcd6cc', rouge: '#b23a2b', blanc: '#f1ece2', verre: '#f2df8a',
  brun: '#7b5a3c', gris: '#b9b3a6', grisFonce: '#6e6a63',
};

// Icônes du tableau qui partagent le modèle d'une autre
const ALIAS = { camera: 'viewpoint', star: 'stele', pin: 'stele' };

/** Nom du modèle à utiliser pour une icône du tableau (un emoji ou une icône inconnue → la stèle de pierre). */
export function modelePour(icone, modeles) {
  const nom = ALIAS[icone] || icone;
  return modeles[nom] ? nom : 'stele';
}

export function fabriquerModeles(THREE) {
  const couleur = new THREE.Color();
  const PI = Math.PI;

  /** Un « atelier » assemble des formes colorées en un seul objet (une seule forme à dessiner par modèle). */
  function atelier() {
    const morceaux = [];
    const a = {
      piece(geo, c, o = {}) {
        const m = new THREE.Matrix4().compose(
          new THREE.Vector3(o.x || 0, o.y || 0, o.z || 0),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx || 0, o.ry || 0, o.rz || 0, o.ordre || 'XYZ')),
          new THREE.Vector3(o.sx ?? o.s ?? 1, o.sy ?? o.s ?? 1, o.sz ?? o.s ?? 1),
        );
        const g = geo.index ? geo.toNonIndexed() : geo;
        g.applyMatrix4(m);
        couleur.set(c);
        morceaux.push({ pos: g.attributes.position.array, r: couleur.r, g: couleur.g, b: couleur.b });
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
      pin(x, z, s = 1, y = 0) {
        a.cylindre(0.018 * s, 0.026 * s, 0.24 * s, 5, C.brun, { x, y: y + 0.12 * s, z });
        a.boule(0.13 * s, C.pinVert, { x, y: y + 0.27 * s, z, sy: 0.55 });
        return a.boule(0.09 * s, C.pinVert, { x: x + 0.04 * s, y: y + 0.36 * s, z: z - 0.02 * s, sy: 0.55 });
      },
      /** Un bâton (bras, jambe…) tendu entre deux points [x, y, z]. */
      baton(de, vers, r, c, cotes = 8) {
        const A = new THREE.Vector3(...de), B = new THREE.Vector3(...vers);
        const dir = B.clone().sub(A);
        const g = new THREE.CylinderGeometry(r, r, dir.length(), cotes).toNonIndexed();
        g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()));
        const milieu = A.add(B).multiplyScalar(0.5);
        return a.piece(g, c, { x: milieu.x, y: milieu.y, z: milieu.z });
      },
      /** Un ovoïde (sphère étirée) : corps, jambes, mains… */
      ovale: (r, c, o, finesse = 12) => a.piece(new THREE.SphereGeometry(r, finesse, Math.max(4, Math.round(finesse * 0.7))), c, o),
      cedre(x, z, h, vert = C.pinVert, neige = null) {
        a.cylindre(0.02, 0.026, h * 0.2, 5, C.brun, { x, y: h * 0.1, z });
        a.cone(h * 0.27, h * 0.55, 7, vert, { x, y: h * 0.2 + h * 0.275, z });
        a.cone(h * 0.19, h * 0.42, 7, neige || vert, { x, y: h * 0.58 + h * 0.21, z });
        return a;
      },
      fin() {
        let n = 0;
        for (const m of morceaux) n += m.pos.length;
        const pos = new Float32Array(n);
        const col = new Float32Array(n);
        let i = 0;
        for (const m of morceaux) {
          pos.set(m.pos, i);
          for (let j = 0; j < m.pos.length; j += 3) {
            col[i + j] = m.r; col[i + j + 1] = m.g; col[i + j + 2] = m.b;
          }
          i += m.pos.length;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        geo.translate(0, 0.06, 0); // posé sur le dessus du socle
        geo.computeVertexNormals(); // chaque triangle a ses propres sommets : facettes nettes, style maquette
        geo.computeBoundingBox();
        return { geometrie: geo, hauteur: geo.boundingBox.max.y };
      },
    };
    return a;
  }

  const M = {};

  // Sanctuaire : un torii vermillon
  M.torii = atelier()
    .cylindre(0.045, 0.052, 0.8, 10, C.vermillon, { x: -0.26, y: 0.4 })
    .cylindre(0.045, 0.052, 0.8, 10, C.vermillon, { x: 0.26, y: 0.4 })
    .cylindre(0.062, 0.066, 0.06, 10, C.noir, { x: -0.26, y: 0.03 })
    .cylindre(0.062, 0.066, 0.06, 10, C.noir, { x: 0.26, y: 0.03 })
    .boite(0.68, 0.055, 0.06, C.vermillon, { y: 0.64 })
    .boite(0.07, 0.12, 0.05, C.noir, { y: 0.73 })
    .boite(0.8, 0.06, 0.09, C.vermillon, { y: 0.82 })
    .boite(0.72, 0.045, 0.12, C.noir, { y: 0.87 })
    .boite(0.15, 0.045, 0.12, C.noir, { x: -0.42, y: 0.89, rz: -0.28 })
    .boite(0.15, 0.045, 0.12, C.noir, { x: 0.42, y: 0.89, rz: 0.28 })
    .fin();

  // Temple : un pavillon de bois sur son socle de pierre, grand toit de tuiles
  {
    const t = atelier()
      .boite(0.86, 0.08, 0.66, C.pierre, { y: 0.04 })
      .boite(0.24, 0.04, 0.1, C.pierre, { y: 0.02, z: 0.37 })
      .boite(0.72, 0.03, 0.54, C.bois, { y: 0.095 })
      .boite(0.56, 0.26, 0.4, C.boisFonce, { y: 0.24 })
      .boite(0.44, 0.1, 0.01, C.platre, { y: 0.3, z: 0.2 });
    for (const x of [-0.27, -0.09, 0.09, 0.27]) t.cylindre(0.018, 0.018, 0.26, 6, C.bois, { x, y: 0.24, z: 0.25 });
    M.temple = t
      .toit(0.9, 0.7, 0.16, 0.55, C.toit, { y: 0.45 })
      .pignon(0.5, 0.15, 0.38, C.toit, { y: 0.53 })
      .boite(0.56, 0.03, 0.04, C.noir, { y: 0.69 })
      .boite(0.03, 0.05, 0.03, C.or, { x: -0.28, y: 0.71 })
      .boite(0.03, 0.05, 0.03, C.or, { x: 0.28, y: 0.71 })
      .fin();
  }

  // Pagode à cinq étages
  {
    const t = atelier().boite(0.46, 0.06, 0.46, C.pierre, { y: 0.03 });
    let y = 0.06;
    for (let i = 0; i < 5; i++) {
      const l = 0.3 - i * 0.035;
      t.boite(l, 0.09, l, C.vermillon, { y: y + 0.045 });
      t.toit(l + 0.2, l + 0.2, 0.05, 0.55, C.toit, { y: y + 0.09 + 0.025 });
      y += 0.14;
    }
    t.cylindre(0.012, 0.016, 0.22, 6, C.or, { y: y + 0.11 });
    for (const dy of [0.05, 0.09, 0.13]) t.cylindre(0.03, 0.03, 0.012, 8, C.or, { y: y + dy });
    M.pagoda = t.boule(0.025, C.or, { y: y + 0.23 }).fin();
  }

  // Château : muraille de pierre, donjon blanc à trois toits, poissons dorés au sommet
  M.castle = atelier()
    .toit(0.78, 0.66, 0.24, 0.78, C.pierre, { y: 0.12 })
    .boite(0.56, 0.16, 0.46, C.platre, { y: 0.32 })
    .toit(0.72, 0.6, 0.07, 0.68, C.toit, { y: 0.435 })
    .boite(0.42, 0.13, 0.34, C.platre, { y: 0.535 })
    .toit(0.56, 0.46, 0.06, 0.68, C.toit, { y: 0.63 })
    .boite(0.3, 0.11, 0.24, C.platre, { y: 0.715 })
    .toit(0.42, 0.36, 0.08, 0.55, C.toit, { y: 0.81 })
    .pignon(0.26, 0.09, 0.2, C.toit, { y: 0.85 })
    .boite(0.03, 0.05, 0.03, C.or, { x: -0.13, y: 0.95 })
    .boite(0.03, 0.05, 0.03, C.or, { x: 0.13, y: 0.95 })
    .boite(0.3, 0.04, 0.01, C.noir, { y: 0.33, z: 0.231 })
    .boite(0.22, 0.03, 0.01, C.noir, { y: 0.54, z: 0.171 })
    .fin();

  // Montagne : sommet enneigé et une petite voisine
  M.mountain = atelier()
    .cone(0.46, 0.86, 7, '#8d7b5c', { y: 0.43 })
    .cone(0.2, 0.355, 7, C.neige, { y: 0.6825 })
    .cone(0.28, 0.5, 7, '#7c8a55', { x: 0.26, y: 0.25, z: 0.12 })
    .cedre(-0.3, 0.2, 0.22)
    .cedre(-0.18, 0.32, 0.18)
    .fin();

  // Volcan : cratère et panache de fumée
  M.volcano = atelier()
    .cylindre(0.14, 0.46, 0.66, 9, '#6d5d52', { y: 0.33 })
    .cylindre(0.145, 0.145, 0.02, 9, '#b8532f', { y: 0.655 })
    .cylindre(0.11, 0.11, 0.022, 9, '#3a2f2a', { y: 0.66 })
    .boule(0.09, C.fumee, { x: 0.02, y: 0.77 })
    .boule(0.11, C.fumee, { x: 0.07, y: 0.9, z: -0.02 })
    .boule(0.13, C.fumee, { x: 0.15, y: 1.04, z: -0.03 })
    .fin();

  // Pont : arc de bois vermillon au-dessus de l'eau
  {
    const t = atelier().cylindre(0.46, 0.46, 0.02, 20, C.eau, { y: 0.01 });
    const hauteurArc = (x) => 0.07 + 0.26 * (1 - (x / 0.46) ** 2);
    const N = 10;
    for (let i = 0; i < N; i++) {
      const x0 = -0.46 + (0.92 * i) / N, x1 = -0.46 + (0.92 * (i + 1)) / N;
      const [y0, y1] = [hauteurArc(x0), hauteurArc(x1)];
      const angle = Math.atan2(y1 - y0, x1 - x0);
      const longueur = Math.hypot(x1 - x0, y1 - y0) + 0.01;
      const [xm, ym] = [(x0 + x1) / 2, (y0 + y1) / 2];
      t.boite(longueur, 0.035, 0.2, C.vermillon, { x: xm, y: ym, rz: angle });
      for (const z of [-0.1, 0.1]) t.boite(longueur, 0.02, 0.02, C.vermillon, { x: xm, y: ym + 0.08, z, rz: angle });
      if (i % 2 === 0) {
        for (const z of [-0.1, 0.1]) {
          t.boite(0.022, 0.09, 0.022, C.vermillon, { x: x0, y: y0 + 0.045, z });
          t.boule(0.018, C.or, { x: x0, y: y0 + 0.1, z });
        }
      }
    }
    for (const x of [-0.22, 0.22]) {
      for (const z of [-0.07, 0.07]) {
        const h = hauteurArc(x);
        t.cylindre(0.02, 0.02, h, 6, C.boisFonce, { x, y: h / 2, z });
      }
    }
    M.bridge = t.fin();
  }

  // Cascade : falaise, chute d'eau et bassin
  M.waterfall = atelier()
    .boite(0.78, 0.8, 0.26, C.roche, { y: 0.4, z: -0.16 })
    .boite(0.3, 0.6, 0.2, C.pierreFonce, { x: -0.28, y: 0.3, z: -0.02, ry: 0.3 })
    .boite(0.26, 0.5, 0.2, C.pierreFonce, { x: 0.3, y: 0.25, z: -0.03, ry: -0.25 })
    .boite(0.16, 0.78, 0.04, C.ecume, { y: 0.41, z: -0.01 })
    .cylindre(0.3, 0.3, 0.03, 16, C.eau, { y: 0.015, z: 0.2 })
    .boule(0.07, C.ecume, { y: 0.04, z: 0.07 })
    .boule(0.05, C.ecume, { x: 0.07, y: 0.03, z: 0.11 })
    .boule(0.13, C.feuillage, { x: -0.22, y: 0.84, z: -0.18 })
    .boule(0.12, C.feuillage, { x: 0.2, y: 0.83, z: -0.15 })
    .boule(0.1, C.pinVert, { x: 0, y: 0.86, z: -0.24 })
    .fin();

  // Lac : eau, rives d'herbe, barque et pin
  {
    const t = atelier()
      .cylindre(0.47, 0.47, 0.03, 20, C.herbe, { y: 0.015 })
      .cylindre(0.39, 0.39, 0.035, 20, C.eau, { y: 0.02 })
      .boite(0.16, 0.035, 0.06, C.bois, { x: 0.08, y: 0.05, z: 0.05, ry: 0.4 })
      .pin(-0.3, -0.24, 1.1)
      .pin(0.32, -0.2, 0.8);
    for (const [x, z] of [[0.3, 0.25], [0.34, 0.2], [0.26, 0.29]]) t.cylindre(0.006, 0.006, 0.12, 4, C.feuillage, { x, y: 0.08, z });
    M.lake = t.fin();
  }

  // Côte : plage, pins et les deux rochers reliés par une corde (Meoto Iwa)
  M.coast = atelier()
    .cylindre(0.47, 0.47, 0.02, 20, C.eau, { y: 0.01 })
    .piece(new THREE.CylinderGeometry(0.47, 0.47, 0.03, 20, 1, false, 0, PI), C.sable, { y: 0.02, ry: PI / 2 })
    .caillou(0.13, C.roche, { x: -0.1, y: 0.1, z: 0.14, sy: 1.3 })
    .caillou(0.085, C.roche, { x: 0.15, y: 0.07, z: 0.18, sy: 1.2 })
    .boite(0.27, 0.022, 0.022, '#d8c38a', { x: 0.03, y: 0.19, z: 0.16, rz: -0.28 })
    .pin(-0.24, -0.22, 0.9, 0.03)
    .pin(0.2, -0.26, 0.7, 0.03)
    .fin();

  // Île : un îlot boisé au milieu de l'eau
  M.island = atelier()
    .cylindre(0.47, 0.47, 0.02, 20, C.eau, { y: 0.01 })
    .cylindre(0.3, 0.34, 0.04, 16, C.sable, { y: 0.02 })
    .dome(0.27, C.herbe, { y: 0.04, sy: 0.7 })
    .pin(0.02, 0, 1.05, 0.17)
    .pin(-0.13, 0.08, 0.7, 0.1)
    .fin();

  // Phare : tour blanche à bande rouge sur son rocher
  M.lighthouse = atelier()
    .caillou(0.22, C.roche, { y: 0.06, sy: 0.55 })
    .caillou(0.12, C.pierreFonce, { x: 0.2, y: 0.04, z: 0.12, sy: 0.7 })
    .cylindre(0.085, 0.13, 0.66, 12, C.blanc, { y: 0.45 })
    .cylindre(0.106, 0.112, 0.08, 12, C.rouge, { y: 0.4 })
    .cylindre(0.13, 0.13, 0.025, 12, '#3b3634', { y: 0.79 })
    .cylindre(0.065, 0.065, 0.1, 8, C.verre, { y: 0.855 })
    .cone(0.09, 0.09, 8, C.rouge, { y: 0.95 })
    .fin();

  // Source chaude : bassin de pierre fumant
  {
    const t = atelier()
      .cylindre(0.32, 0.34, 0.08, 14, C.pierreFonce, { y: 0.04 })
      .cylindre(0.29, 0.29, 0.02, 14, '#8cc5c8', { y: 0.075 })
      .boule(0.07, C.fumee, { x: -0.04, y: 0.2 })
      .boule(0.085, C.fumee, { x: 0.02, y: 0.33, z: 0.02 })
      .boule(0.09, C.fumee, { x: -0.03, y: 0.47 })
      .boule(0.07, C.fumee, { x: 0.03, y: 0.6, z: -0.02 })
      .boule(0.06, C.fumee, { x: 0.15, y: 0.22, z: 0.05 })
      .boule(0.07, C.fumee, { x: 0.18, y: 0.34, z: 0.04 })
      .boite(0.03, 0.3, 0.03, C.bois, { x: -0.38, y: 0.15, z: 0.12 })
      .boite(0.16, 0.1, 0.02, C.bois, { x: -0.38, y: 0.3, z: 0.13 });
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * 2 * PI;
      t.caillou(0.06 + (i % 3) * 0.012, C.pierre, { x: 0.36 * Math.cos(a), y: 0.05, z: 0.36 * Math.sin(a) });
    }
    M.onsen = t.fin();
  }

  // Jardin : lanterne de pierre, pin taillé, étang et pas japonais
  M.garden = atelier()
    .cylindre(0.2, 0.2, 0.02, 14, C.eau, { x: 0.16, y: 0.01, z: 0.14 })
    .boite(0.12, 0.04, 0.12, C.pierre, { x: -0.16, y: 0.02, z: 0.08 })
    .cylindre(0.03, 0.036, 0.2, 6, C.pierre, { x: -0.16, y: 0.14, z: 0.08 })
    .boite(0.13, 0.03, 0.13, C.pierre, { x: -0.16, y: 0.255, z: 0.08 })
    .boite(0.09, 0.08, 0.09, C.pierreFonce, { x: -0.16, y: 0.31, z: 0.08 })
    .toit(0.19, 0.19, 0.06, 0.2, C.pierre, { x: -0.16, y: 0.38, z: 0.08 })
    .boule(0.025, C.pierre, { x: -0.16, y: 0.43, z: 0.08 })
    .cylindre(0.025, 0.035, 0.3, 5, C.brun, { x: 0.12, y: 0.15, z: -0.2, rz: 0.25 })
    .boule(0.14, C.pinVert, { x: 0.06, y: 0.34, z: -0.2, sy: 0.45 })
    .boule(0.11, C.pinVert, { x: 0.2, y: 0.26, z: -0.16, sy: 0.45 })
    .boule(0.09, C.pinVert, { x: 0.02, y: 0.46, z: -0.22, sy: 0.45 })
    .cylindre(0.045, 0.045, 0.015, 8, C.gris, { x: -0.02, y: 0.008, z: 0.3 })
    .cylindre(0.04, 0.04, 0.015, 8, C.gris, { x: -0.14, y: 0.008, z: 0.3 })
    .cylindre(0.045, 0.045, 0.015, 8, C.gris, { x: -0.3, y: 0.008, z: 0.24 })
    .fin();

  // Fleurs : un cerisier en fleur sur son tapis de pétales
  M.flower = atelier()
    .cylindre(0.42, 0.42, 0.012, 16, '#efc9d3', { y: 0.006 })
    .cylindre(0.035, 0.055, 0.4, 7, C.brun, { y: 0.2 })
    .cylindre(0.02, 0.026, 0.22, 5, C.brun, { x: 0.08, y: 0.43, rz: -0.6 })
    .cylindre(0.02, 0.026, 0.22, 5, C.brun, { x: -0.08, y: 0.43, rz: 0.6 })
    .boule(0.24, C.rose, { y: 0.62 })
    .boule(0.17, C.roseFonce, { x: 0.2, y: 0.53, z: 0.05 })
    .boule(0.18, C.rose, { x: -0.19, y: 0.54, z: -0.03 })
    .boule(0.15, '#f0b8c6', { x: 0.02, y: 0.52, z: 0.18 })
    .boule(0.15, C.roseFonce, { y: 0.54, z: -0.18 })
    .fin();

  // Forêt : un bosquet de cèdres
  M.forest = atelier()
    .cedre(0, 0, 0.95)
    .cedre(-0.25, 0.1, 0.7, '#5b7a45')
    .cedre(0.24, 0.08, 0.78)
    .cedre(0.05, -0.26, 0.65, '#5b7a45')
    .cedre(-0.12, 0.28, 0.55)
    .fin();

  // Village : maisons au grand toit de chaume (gasshō-zukuri) et rizière
  {
    const t = atelier().boite(0.3, 0.012, 0.18, '#9db35a', { x: 0.17, y: 0.006, z: 0.27 });
    for (const [x, z, ry, s] of [[-0.12, 0.02, 0.3, 1.25], [0.22, -0.16, -0.2, 0.9]]) {
      const cos = Math.cos(ry), sin = Math.sin(ry);
      const local = (dx, dz) => ({ x: x + dx * cos + dz * sin, z: z - dx * sin + dz * cos });
      t.boite(0.3 * s, 0.12 * s, 0.24 * s, C.boisFonce, { ...local(0, 0), y: 0.06 * s, ry });
      // faîtage dans le sens de la longueur, pignons (avec leur fenêtre blanche) aux deux bouts
      t.pignon(0.36 * s, 0.3 * s, 0.34 * s, C.chaume, { ...local(0, 0), y: 0.12 * s, ry });
      t.boite(0.08 * s, 0.07 * s, 0.01, C.platre, { ...local(0.182 * s, 0), y: 0.19 * s, ry: ry + PI / 2 });
    }
    M.village = t.cedre(-0.34, -0.22, 0.4).fin();
  }

  // Ville : quelques immeubles et une tour rouge et blanche
  M.city = atelier()
    .boite(0.16, 0.42, 0.16, '#cfc6b4', { x: -0.2, y: 0.21, z: 0.05 })
    .boite(0.14, 0.3, 0.14, '#b9ae98', { x: -0.02, y: 0.15, z: 0.22 })
    .boite(0.18, 0.26, 0.14, '#d8cfbd', { x: 0.24, y: 0.13, z: 0.16 })
    .boite(0.12, 0.55, 0.12, '#a79e8e', { x: -0.14, y: 0.275, z: -0.22 })
    .piece(new THREE.CylinderGeometry(0.015, 0.13, 0.62, 4), C.rouge, { x: 0.17, y: 0.31, z: -0.12, ry: PI / 4 })
    .piece(new THREE.CylinderGeometry(0.066, 0.07, 0.05, 4), C.blanc, { x: 0.17, y: 0.33, z: -0.12, ry: PI / 4 })
    .boite(0.1, 0.035, 0.1, C.blanc, { x: 0.17, y: 0.4, z: -0.12 })
    .cylindre(0.006, 0.01, 0.25, 4, C.rouge, { x: 0.17, y: 0.745, z: -0.12 })
    .fin();

  // Statue : un grand Bouddha de bronze assis en méditation (comme à Kamakura ou à Nara),
  // sur un trône de lotus, devant un halo doré en forme de flamme
  {
    const bronze = '#6f7a66', robe = '#5f6857', peau = '#7d8672', cheveux = '#4f5748', lotus = '#8c8f73';
    const t = atelier()
      // piédestal de pierre à huit côtés, puis trône de lotus
      .cylindre(0.36, 0.4, 0.08, 8, C.pierre, { y: 0.04 })
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
      .fin();
  }

  // Nature et grottes : un rocher moussu percé d'une grotte
  M.cave = atelier()
    .boule(0.4, C.roche, { y: 0.1, sy: 0.8, sz: 0.8 }, 1)
    .boule(0.14, '#2a2420', { y: 0.1, z: 0.27, sz: 0.35, sy: 0.95 }, 1)
    .boule(0.11, C.feuillage, { x: -0.1, y: 0.38 })
    .boule(0.09, C.pinVert, { x: 0.14, y: 0.36, z: -0.05 })
    .boule(0.07, C.feuillage, { x: 0.2, y: 0.25, z: 0.15 })
    .fin();

  // Point de vue : colline, pavillon d'observation et longue-vue
  M.viewpoint = atelier()
    .dome(0.44, C.herbe, { sy: 0.45 })
    .boite(0.24, 0.02, 0.24, C.bois, { y: 0.2 })
    .cylindre(0.015, 0.015, 0.2, 5, C.bois, { x: -0.09, y: 0.3, z: -0.09 })
    .cylindre(0.015, 0.015, 0.2, 5, C.bois, { x: 0.09, y: 0.3, z: -0.09 })
    .cylindre(0.015, 0.015, 0.2, 5, C.bois, { x: -0.09, y: 0.3, z: 0.09 })
    .cylindre(0.015, 0.015, 0.2, 5, C.bois, { x: 0.09, y: 0.3, z: 0.09 })
    .toit(0.34, 0.34, 0.12, 0.05, C.toit, { y: 0.46 })
    .cylindre(0.012, 0.012, 0.1, 5, C.noir, { x: 0.25, y: 0.13, z: 0.2 })
    .cylindre(0.016, 0.022, 0.1, 6, C.noir, { x: 0.25, y: 0.2, z: 0.2, rz: 1.1 })
    .fin();

  // Fête : tour de tambour (yagura) et lanternes rouges
  {
    const t = atelier();
    for (const [x, z] of [[-0.13, -0.13], [0.13, -0.13], [-0.13, 0.13], [0.13, 0.13]]) {
      t.cylindre(0.02, 0.025, 0.4, 5, C.bois, { x, y: 0.2, z });
      t.cylindre(0.012, 0.012, 0.18, 5, C.bois, { x, y: 0.51, z });
    }
    t.boite(0.36, 0.08, 0.36, C.rouge, { y: 0.36 })
      .boite(0.34, 0.03, 0.34, C.bois, { y: 0.415 })
      .toit(0.44, 0.44, 0.1, 0.1, C.toit, { y: 0.65 });
    for (const x of [-0.4, 0.4]) {
      t.cylindre(0.012, 0.012, 0.5, 5, C.bois, { x, y: 0.25 });
      t.boite(Math.hypot(0.27, 0.12), 0.006, 0.006, C.noir, { x: x / 2 + (x > 0 ? 0.065 : -0.065), y: 0.46, rz: x > 0 ? 0.42 : -0.42 });
      for (const f of [0.35, 0.65]) {
        const lx = x * (1 - f) + (x > 0 ? 0.13 : -0.13) * f;
        const ly = 0.5 - 0.12 * f - 0.07;
        t.cylindre(0.032, 0.032, 0.065, 8, C.rouge, { x: lx, y: ly });
        t.cylindre(0.02, 0.02, 0.012, 8, C.noir, { x: lx, y: ly + 0.036 });
      }
    }
    M.festival = t.fin();
  }

  // Train : une locomotive à vapeur sur ses rails
  {
    const t = atelier();
    for (const z of [-0.07, 0.07]) t.boite(0.9, 0.02, 0.02, C.grisFonce, { y: 0.03, z });
    for (let x = -0.4; x <= 0.41; x += 0.1) t.boite(0.04, 0.015, 0.22, C.boisFonce, { x, y: 0.012 });
    for (const x of [-0.2, 0, 0.2]) for (const z of [-0.085, 0.085]) t.cylindre(0.06, 0.06, 0.03, 10, C.rouge, { x, y: 0.09, z, rx: PI / 2 });
    M.train = t
      .boite(0.62, 0.05, 0.16, C.noir, { y: 0.13 })
      .boite(0.62, 0.015, 0.165, C.rouge, { y: 0.16 })
      .cylindre(0.085, 0.085, 0.42, 12, '#2f2d2e', { x: 0.06, y: 0.24, rz: PI / 2 })
      .cylindre(0.09, 0.09, 0.03, 12, '#3a3838', { x: 0.28, y: 0.24, rz: PI / 2 })
      .cylindre(0.035, 0.03, 0.12, 8, C.noir, { x: 0.2, y: 0.37 })
      .boule(0.04, C.or, { x: 0.02, y: 0.33 })
      .boite(0.16, 0.2, 0.18, C.noir, { x: -0.22, y: 0.26 })
      .boite(0.2, 0.02, 0.22, '#3a3838', { x: -0.22, y: 0.37 })
      .boule(0.07, C.fumee, { x: 0.2, y: 0.5 })
      .boule(0.085, C.fumee, { x: 0.28, y: 0.6 })
      .fin();
  }

  // Neige : hutte de neige (kamakura), bonhomme et sapin enneigé
  M.snow = atelier()
    .cylindre(0.46, 0.46, 0.02, 18, C.neige, { y: 0.01 })
    .dome(0.25, C.neige, { x: -0.06, y: 0.02, z: -0.02 })
    .boite(0.11, 0.12, 0.05, '#2f3238', { x: -0.06, y: 0.07, z: 0.2 })
    .cedre(0.26, -0.2, 0.6, C.pinVert, C.neige)
    .boule(0.07, C.neige, { x: 0.25, y: 0.07, z: 0.2 }, 1)
    .boule(0.05, C.neige, { x: 0.25, y: 0.18, z: 0.2 }, 1)
    .fin();

  // Parc à thème : une grande roue
  {
    const t = atelier();
    for (const z of [-0.06, 0.06]) {
      t.boite(0.03, 0.54, 0.03, C.blanc, { x: -0.1, y: 0.25, z, rz: -0.38 });
      t.boite(0.03, 0.54, 0.03, C.blanc, { x: 0.1, y: 0.25, z, rz: 0.38 });
    }
    t.anneau(0.36, 0.015, C.blanc, { y: 0.5 }).anneau(0.3, 0.008, C.blanc, { y: 0.5 });
    for (let i = 0; i < 8; i++) t.boite(0.008, 0.72, 0.008, C.blanc, { y: 0.5, rz: (i * PI) / 8 });
    t.cylindre(0.03, 0.03, 0.14, 8, C.grisFonce, { y: 0.5, rx: PI / 2 });
    const teintes = [C.rouge, '#d9a13b', '#3f7fae', C.feuillage, '#d96b9a'];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * 2 * PI;
      t.boite(0.07, 0.07, 0.07, teintes[i % 5], { x: 0.36 * Math.cos(a), y: 0.5 + 0.36 * Math.sin(a) - 0.05 });
    }
    M.themepark = t.fin();
  }

  // Nourriture : une échoppe de rue (yatai) avec son rideau et sa lanterne
  M.food = atelier()
    .boite(0.44, 0.2, 0.26, C.bois, { y: 0.14 })
    .boite(0.48, 0.02, 0.3, C.boisFonce, { y: 0.25 })
    .cylindre(0.08, 0.08, 0.03, 10, C.boisFonce, { x: -0.12, y: 0.08, z: 0.15, rx: PI / 2 })
    .cylindre(0.08, 0.08, 0.03, 10, C.boisFonce, { x: 0.12, y: 0.08, z: 0.15, rx: PI / 2 })
    .cylindre(0.012, 0.012, 0.22, 5, C.boisFonce, { x: -0.22, y: 0.37, z: -0.13 })
    .cylindre(0.012, 0.012, 0.22, 5, C.boisFonce, { x: 0.22, y: 0.37, z: -0.13 })
    .cylindre(0.012, 0.012, 0.22, 5, C.boisFonce, { x: -0.22, y: 0.37, z: 0.13 })
    .cylindre(0.012, 0.012, 0.22, 5, C.boisFonce, { x: 0.22, y: 0.37, z: 0.13 })
    .pignon(0.54, 0.1, 0.36, C.toit, { y: 0.48 })
    .boite(0.44, 0.07, 0.01, C.vermillon, { y: 0.44, z: 0.16 })
    .cylindre(0.04, 0.04, 0.09, 8, C.rouge, { x: 0.27, y: 0.4, z: 0.16 })
    .cylindre(0.04, 0.03, 0.03, 8, C.platre, { x: -0.1, y: 0.275 })
    .fin();

  // Site historique : un portail de bois couvert de tuiles, entre deux murets
  M.museum = atelier()
    .boite(0.5, 0.03, 0.16, C.pierre, { y: 0.015, z: 0.1 })
    .boite(0.06, 0.5, 0.06, C.boisFonce, { x: -0.22, y: 0.25 })
    .boite(0.06, 0.5, 0.06, C.boisFonce, { x: 0.22, y: 0.25 })
    .boite(0.36, 0.4, 0.03, '#4a3322', { y: 0.2 })
    .boite(0.56, 0.05, 0.07, C.boisFonce, { y: 0.48 })
    .pignon(0.72, 0.15, 0.28, C.toit, { y: 0.505 })
    .boite(0.74, 0.03, 0.04, C.noir, { y: 0.66 })
    .boite(0.18, 0.26, 0.05, C.platre, { x: -0.38, y: 0.13 })
    .boite(0.18, 0.26, 0.05, C.platre, { x: 0.38, y: 0.13 })
    .pignon(0.2, 0.05, 0.1, C.toit, { x: -0.38, y: 0.26 })
    .pignon(0.2, 0.05, 0.1, C.toit, { x: 0.38, y: 0.26 })
    .fin();

  // Hôtel : une auberge traditionnelle (ryokan) à étage
  M.hotel = atelier()
    .boite(0.66, 0.2, 0.4, C.platre, { y: 0.1 })
    .boite(0.14, 0.08, 0.01, '#6b3b5a', { y: 0.13, z: 0.205 })
    .toit(0.76, 0.5, 0.05, 0.8, C.toit, { y: 0.225 })
    .boite(0.58, 0.16, 0.34, C.bois, { y: 0.31 })
    .boite(0.58, 0.04, 0.02, C.boisFonce, { y: 0.28, z: 0.19 })
    .toit(0.72, 0.48, 0.1, 0.4, C.toit, { y: 0.44 })
    .pignon(0.38, 0.08, 0.18, C.toit, { y: 0.49 })
    .fin();

  // Église : nef blanche, clocher, flèche et croix
  M.church = atelier()
    .boite(0.34, 0.28, 0.54, C.blanc, { y: 0.14, z: -0.06 })
    .pignon(0.58, 0.16, 0.4, '#7a3b2e', { y: 0.28, z: -0.06, ry: PI / 2 })
    .boite(0.16, 0.46, 0.16, C.blanc, { y: 0.23, z: 0.28 })
    .piece(new THREE.CylinderGeometry(0.002, 0.12, 0.26, 4), '#3f4a4f', { y: 0.59, z: 0.28, ry: PI / 4 })
    .boite(0.015, 0.12, 0.015, C.or, { y: 0.78, z: 0.28 })
    .boite(0.07, 0.015, 0.015, C.or, { y: 0.8, z: 0.28 })
    .boite(0.07, 0.11, 0.01, C.boisFonce, { y: 0.055, z: 0.365 })
    .boite(0.05, 0.08, 0.01, '#3f4a4f', { y: 0.33, z: 0.365 })
    .fin();

  // Par défaut (icône inconnue, emoji…) : une stèle de pierre gravée
  M.stele = atelier()
    .boite(0.34, 0.07, 0.22, C.pierre, { y: 0.035 })
    .boite(0.18, 0.42, 0.07, '#8d887d', { y: 0.28 })
    .cylindre(0.09, 0.09, 0.07, 12, '#8d887d', { y: 0.49, rx: PI / 2 })
    .boite(0.1, 0.24, 0.01, '#6e6a63', { y: 0.3, z: 0.036 })
    .fin();

  return M;
}
