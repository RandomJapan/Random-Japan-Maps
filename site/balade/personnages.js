// ================================================================
//  Les personnages de la balade 3D : le voyageur (garçon ou fille), son compagnon le renard d'Inari (un
//  kitsune blanc au bavoir rouge, comme les statues des sanctuaires d'Inari : une créature à nous), et les
//  daims d'Itsukushima. Chacun est fait de formes simples (l'atelier des modèles 3D), en morceaux articulés
//  pour marcher : jambes, bras, tête, queue.
//  Et les passants, habillés chacun de sa tenue (creerPersonnage).
//  ctx : { THREE, atelier (un atelier vide à chaque appel), P (la palette du style), maillage(fin) → Object3D }.
// ================================================================

/** Un pivot (articulation) placé en x, y, z, avec ses morceaux. */
function pivot(ctx, x, y, z, ...morceaux) {
  const g = new ctx.THREE.Group();
  g.position.set(x, y, z);
  for (const m of morceaux) g.add(m);
  return g;
}

/**
 * La tenue d'un des deux voyageurs (palette P). Une tenue dit : taille (1 : 1,35 m), peau, cheveux, coiffure
 * ('court', 'nattes', 'queue', 'chignon', 'chauve'), chapeau { sorte : 'casquette', 'soleil', 'paille',
 * 'eboshi', 'ecolier', 'foulard', 'bob', 'bandeau' ; c, c2 }, haut, manches ('courtes', 'longues', 'kimono'),
 * col (le col croisé d'un kimono), bas { sorte : 'short', 'jupe', 'hakama', 'pantalon' ; c, c2 }, chaussures,
 * semelle, sac { sorte : 'dos', 'randoseru' ; c, c2 }, tablier, lunettes, appareil (photo, au cou), canne,
 * yeux ('plisses' : un sourire).
 */
export function tenueVoyageur(P, sorte) {
  const commun = { peau: P.peau, chaussures: P.chaussures, semelle: P.semelle, sac: { sorte: 'dos', c: P.sac, c2: P.sangle }, manches: 'courtes' };
  return sorte === 'fille'
    ? { ...commun, cheveux: P.cheveuxFille, coiffure: 'nattes', chapeau: { sorte: 'soleil', c: P.chapeau, c2: P.ruban }, haut: P.hautFille, bas: { sorte: 'jupe', c: P.short } }
    : { ...commun, cheveux: P.cheveux, coiffure: 'court', chapeau: { sorte: 'casquette', c: P.casquette, c2: P.visiere }, haut: P.haut, bas: { sorte: 'short', c: P.short } };
}

/**
 * Le voyageur (garçon ou fille) et son sac à dos. Renvoie { objet, animer(dt, vitesse, temps), saluer() } ;
 * animer renvoie le pied qui vient de toucher le sol (1 : celui de gauche, −1 : celui de droite) ou 0.
 */
export function creerVoyageur(ctx, sorte = 'garcon') {
  return creerPersonnage(ctx, tenueVoyageur(ctx.P, sorte));
}

/**
 * Un personnage, environ 1,35 m × taille (une grosse tête : 2,5 têtes de haut, comme les héros des jeux
 * japonais), habillé selon sa tenue (tenueVoyageur). Renvoie { objet, animer(dt, vitesse, temps), saluer() }.
 */
export function creerPersonnage(ctx, T) {
  const { THREE, atelier, P, maillage } = ctx;
  const PI = Math.PI;
  const racine = new THREE.Group();
  const corps = new THREE.Group();
  const echelle = new THREE.Group(); // la taille, sans toucher à la position ni au cap de la racine
  echelle.scale.setScalar(T.taille || 1);
  racine.add(echelle);
  echelle.add(corps);
  const bas = T.bas || { sorte: 'short', c: P.short };
  const jambeCouleur = bas.sorte === 'pantalon' ? bas.c : T.peau;
  const long = bas.sorte === 'hakama';

  // les jambes (pivot à la hanche) et leurs chaussures
  const jambes = [-1, 1].map((s) => {
    const a = atelier()
      .cylindre(0.064, 0.058, 0.3, 10, jambeCouleur, { y: -0.16 })
      .ovale(0.085, T.chaussures, { y: -0.35, z: 0.035, sx: 0.95, sy: 0.62, sz: 1.35 }, 12)
      .ovale(0.088, T.semelle, { y: -0.39, z: 0.035, sx: 0.97, sy: 0.22, sz: 1.38 }, 12);
    const j = pivot(ctx, s * 0.085, 0.42, 0, maillage(a.fin(0, false)));
    echelle.add(j);
    return j;
  });

  // le buste : le haut, le bas (short, jupe, hakama, pantalon), le col, le tablier, le sac, l'appareil photo
  const b = atelier()
    .cylindre(0.155, 0.19, 0.34, 14, T.haut, { y: 0.6 })
    .ovale(0.158, T.haut, { y: 0.77, sy: 0.45 }, 14)
    .ovale(0.075, T.peau, { y: 0.83, sy: 0.6 }, 10);
  if (bas.sorte === 'jupe') b.cylindre(0.17, 0.27, 0.2, 14, bas.c, { y: 0.44 });
  else if (long) {
    // le hakama : une large jupe-culotte plissée jusqu'aux chevilles
    b.piece(new THREE.CylinderGeometry(0.2, 0.31, 0.5, 16), bas.c, { y: 0.29, teinte: (x, y, z) => (Math.floor((Math.atan2(x, z) + PI) * 2.6) % 2 ? bas.c : bas.c2 || bas.c) })
      .cylindre(0.2, 0.2, 0.05, 16, bas.c, { y: 0.53 });
  } else b.cylindre(0.19, 0.2, 0.15, 14, bas.c, { y: 0.47 });
  if (T.col) {
    // le col croisé (gauche sur droite) du kimono
    for (const s of [-1, 1]) b.boite(0.05, 0.24, 0.02, T.col, { x: s * 0.04, y: 0.7, z: 0.165, rz: s * 0.42, trait: false });
  }
  if (T.tablier) b.boite(0.27, 0.42, 0.03, T.tablier, { y: 0.5, z: 0.19, rx: 0.08 }).boite(0.3, 0.035, 0.36, T.tablier, { y: 0.66, trait: false });
  if (T.sac?.sorte === 'dos') {
    b.ovale(0.17, T.sac.c, { y: 0.62, z: -0.2, sx: 1.0, sy: 1.08, sz: 0.55 }, 12)
      .ovale(0.12, T.sac.c, { y: 0.72, z: -0.24, sx: 1.12, sy: 0.4, sz: 0.5 }, 10)
      .boite(0.16, 0.05, 0.02, T.sac.c2, { y: 0.6, z: -0.29 })
      .boite(0.05, 0.03, 0.012, P.or, { y: 0.6, z: -0.3, trait: false });
    for (const s of [-1, 1]) b.boite(0.045, 0.3, 0.02, T.sac.c2, { x: s * 0.1, y: 0.66, z: 0.16, rx: -0.12 });
  } else if (T.sac?.sorte === 'randoseru') {
    // le cartable des écoliers japonais : une boîte rigide, son rabat arrondi
    b.boite(0.3, 0.32, 0.16, T.sac.c, { y: 0.64, z: -0.24 })
      .piece(new THREE.CylinderGeometry(0.16, 0.16, 0.3, 12, 1, false, 0, PI), T.sac.c, { y: 0.78, z: -0.24, rz: PI / 2, sx: 0.5 })
      .boite(0.06, 0.06, 0.01, P.or, { y: 0.6, z: -0.325, trait: false });
    for (const s of [-1, 1]) b.boite(0.045, 0.3, 0.02, T.sac.c, { x: s * 0.1, y: 0.66, z: 0.16, rx: -0.12 });
  }
  if (T.appareil) {
    b.boite(0.14, 0.09, 0.06, '#2a2a30', { y: 0.62, z: 0.2 })
      .cylindre(0.032, 0.032, 0.05, 10, '#3a3a44', { y: 0.62, z: 0.25, rx: PI / 2 })
      .ovale(0.016, '#9fd0e8', { y: 0.62, z: 0.276, trait: false }, 6);
    for (const s of [-1, 1]) b.boite(0.015, 0.2, 0.012, '#2a2a30', { x: s * 0.07, y: 0.73, z: 0.17, rz: -s * 0.3, trait: false });
  }
  corps.add(maillage(b.fin(0, false)));

  // les bras (pivot à l'épaule) : manche, avant-bras, main ; les larges manches d'un kimono
  const bras = [-1, 1].map((s) => {
    const a = atelier();
    if (T.manches === 'kimono') {
      a.cylindre(0.07, 0.075, 0.22, 10, T.haut, { y: -0.1 })
        .boite(0.15, 0.26, 0.2, T.haut, { x: s * 0.02, y: -0.17, z: -0.02 })
        .ovale(0.05, T.peau, { y: -0.27, z: 0.04 }, 10);
    } else {
      const longues = T.manches === 'longues';
      a.cylindre(0.06, 0.065, longues ? 0.26 : 0.13, 10, T.haut, { y: longues ? -0.11 : -0.05 })
        .cylindre(0.045, 0.05, 0.17, 8, longues ? T.haut : T.peau, { y: -0.18 })
        .ovale(0.058, T.peau, { y: -0.29 }, 10);
    }
    if (T.canne && s === 1) a.baton([0, -0.3, 0.02], [0.02, -0.72, 0.12], 0.022, '#7a5232', 6);
    const br = pivot(ctx, s * 0.205, 0.75, 0, maillage(a.fin(0, false)));
    br.rotation.z = s * 0.12;
    corps.add(br);
    return br;
  });

  // la tête (pivot au cou) : visage, yeux brillants, joues, cheveux, chapeau, lunettes
  const t = atelier()
    .ovale(0.3, T.peau, { y: 0.25, sx: 1.04 }, 18)
    .ovale(0.05, T.peau, { x: -0.3, y: 0.22, sz: 0.6 }, 8)
    .ovale(0.05, T.peau, { x: 0.3, y: 0.22, sz: 0.6 }, 8);
  for (const s of [-1, 1]) {
    t.ovale(0.046, P.oeil, { x: s * 0.105, y: 0.22, z: 0.272, sy: T.yeux === 'plisses' ? 0.45 : 1.55, sz: 0.55 }, 10)
      .ovale(0.042, P.joue, { x: s * 0.175, y: 0.13, z: 0.214, sz: 0.3, trait: false }, 8);
    if (T.yeux !== 'plisses') t.ovale(0.016, P.reflet, { x: s * 0.105 + 0.016, y: 0.255, z: 0.293, trait: false }, 6);
  }
  t.boite(0.05, 0.014, 0.01, P.oeil, { y: 0.105, z: 0.264, trait: false });
  if (T.lunettes) {
    for (const s of [-1, 1]) t.piece(new THREE.TorusGeometry(0.06, 0.009, 4, 14), '#3a3236', { x: s * 0.105, y: 0.22, z: 0.29, trait: false });
    t.boite(0.07, 0.012, 0.01, '#3a3236', { y: 0.235, z: 0.3, trait: false });
  }
  const C1 = T.cheveux;
  if (T.coiffure === 'chauve') {
    // le crâne dégarni : une couronne de cheveux sur les côtés et derrière
    t.piece(new THREE.TorusGeometry(0.27, 0.065, 6, 18, PI * 1.25), C1, { y: 0.22, z: -0.02, rx: PI / 2, rz: PI * 0.125 });
  } else {
    // une calotte inclinée vers l'arrière (le front dégagé) et des mèches sur le front
    t.piece(new THREE.SphereGeometry(0.318, 18, 10, 0, 2 * PI, 0, PI * 0.56), C1, { y: 0.25, rx: -0.42 });
    for (const [x, rz] of [[-0.12, 0.4], [0, 0], [0.12, -0.4]]) t.cone(0.07, 0.16, 5, C1, { x, y: 0.43, z: 0.21, rx: PI - 0.5, rz });
  }
  if (T.coiffure === 'nattes') {
    t.ovale(0.27, C1, { y: 0.14, z: -0.1, sx: 1.05, sy: 1.0, sz: 0.85 }, 14);
    for (const s of [-1, 1]) t.ovale(0.075, C1, { x: s * 0.29, y: 0.02, z: -0.04, sy: 1.6 }, 10).ovale(0.03, P.ruban, { x: s * 0.29, y: 0.14, z: -0.03 }, 8);
  } else if (T.coiffure === 'queue') {
    // les longs cheveux noués bas dans le dos par un papier blanc (les miko)
    t.ovale(0.27, C1, { y: 0.16, z: -0.1, sx: 1.05, sy: 1.0, sz: 0.85 }, 14)
      .baton([0, -0.02, -0.24], [0, -0.42, -0.26], 0.065, C1, 8)
      .boite(0.1, 0.07, 0.04, P.blanc, { y: -0.08, z: -0.29 });
  } else if (T.coiffure === 'chignon') {
    t.ovale(0.26, C1, { y: 0.17, z: -0.1, sx: 1.05, sz: 0.85 }, 14).boule(0.11, C1, { y: 0.5, z: -0.2 }, 1);
  }
  const H = T.chapeau;
  if (H?.sorte === 'casquette') {
    t.piece(new THREE.SphereGeometry(0.33, 18, 8, 0, 2 * PI, 0, PI / 2), H.c, { y: 0.32, rx: -0.14 })
      .piece(new THREE.CylinderGeometry(0.23, 0.23, 0.024, 18, 1, false, -PI / 2, PI), H.c2, { y: 0.35, z: 0.2, rx: -0.12 })
      .boule(0.035, H.c2, { y: 0.655, z: -0.045 }, 1);
  } else if (H?.sorte === 'soleil' || H?.sorte === 'paille') {
    t.cylindre(0.46, 0.46, 0.022, 24, H.c, { y: 0.47, rx: -0.12 })
      .cylindre(0.235, 0.27, 0.17, 20, H.c, { y: 0.56, z: -0.012, rx: -0.12 })
      .cylindre(0.276, 0.276, 0.05, 20, H.c2, { y: 0.51, z: -0.008, rx: -0.12 });
  } else if (H?.sorte === 'eboshi') {
    // le haut chapeau noir laqué des prêtres shintō, et son cordon blanc
    t.piece(new THREE.CylinderGeometry(0.15, 0.2, 0.42, 14), H.c, { y: 0.66, z: -0.05, rx: -0.2, sz: 0.75 })
      .boule(0.12, H.c, { y: 0.86, z: -0.1, sz: 0.6 }, 1)
      .baton([-0.27, 0.25, 0.04], [0, 0.0, 0.2], 0.012, P.blanc, 4).baton([0.27, 0.25, 0.04], [0, 0.0, 0.2], 0.012, P.blanc, 4);
  } else if (H?.sorte === 'ecolier') {
    // le chapeau jaune des écoliers japonais, pour qu'on les voie de loin
    t.piece(new THREE.SphereGeometry(0.335, 18, 8, 0, 2 * PI, 0, PI / 2), H.c, { y: 0.3, rx: -0.1, sy: 0.85 })
      .cylindre(0.4, 0.4, 0.02, 20, H.c, { y: 0.32, rx: -0.1 });
  } else if (H?.sorte === 'foulard') {
    t.piece(new THREE.SphereGeometry(0.33, 18, 8, 0, 2 * PI, 0, PI * 0.55), H.c, { y: 0.3, rx: -0.3 })
      .cone(0.09, 0.14, 4, H.c, { y: 0.28, z: -0.3, rx: -PI / 2 - 0.4 });
  } else if (H?.sorte === 'bob') {
    t.cylindre(0.26, 0.31, 0.2, 18, H.c, { y: 0.55, rx: -0.1 }).cylindre(0.42, 0.42, 0.02, 20, H.c, { y: 0.46, rx: -0.1 });
  } else if (H?.sorte === 'bandeau') {
    t.piece(new THREE.TorusGeometry(0.31, 0.035, 5, 20), H.c, { y: 0.38, rx: PI / 2 - 0.25 })
      .boite(0.08, 0.06, 0.06, H.c, { y: 0.44, z: -0.3 });
  }
  const tete = pivot(ctx, 0, 0.82, 0, maillage(t.fin(0, false)));
  corps.add(tete);

  let phase = 0, salut = 0, foulee = 0;
  return {
    objet: racine,
    /** Une petite courbette (on lui parle, il remercie…). */
    saluer() { salut = 1; },
    /**
     * vitesse : m/s au sol (0 : à l'arrêt) ; temps : secondes. Renvoie le pied qui vient de se poser (1 : la
     * jambe de x > 0, la gauche ; −1 : la droite), ou 0 : un pied touche le sol au bout de chaque balancement.
     */
    animer(dt, vitesse, temps) {
      const marche = Math.min(1, vitesse / 3.2);
      phase += dt * (5 + vitesse * 1.9);
      const f = Math.floor((phase - PI / 2) / PI);
      let pose = 0;
      if (f !== foulee) { foulee = f; if (marche > 0.3) pose = f & 1 ? -1 : 1; }
      const sw = Math.sin(phase) * (long ? 0.4 : 0.62) * marche;
      jambes[0].rotation.x = sw;
      jambes[1].rotation.x = -sw;
      bras[0].rotation.x = -sw * 0.85;
      bras[1].rotation.x = sw * 0.85;
      const respire = Math.sin(temps * 2.2) * 0.008 * (1 - marche);
      salut = Math.max(0, salut - dt * 0.9);
      const courbe = Math.sin(Math.min(1, salut) * PI) * 0.5;
      corps.position.y = Math.abs(Math.cos(phase)) * 0.045 * marche + respire;
      corps.rotation.x = 0.08 * marche + courbe;
      tete.rotation.x = -0.05 * marche + Math.sin(temps * 1.1) * 0.02 * (1 - marche) + courbe * 0.3;
      tete.rotation.z = Math.sin(phase) * 0.04 * marche;
      return pose;
    },
  };
}

/**
 * Le renard d'Inari, environ 0,5 m. Renvoie { objet, animer(dt, vitesse, temps), secouer() } (assis à l'arrêt) ;
 * animer renvoie 1 ou −1 quand une paire de pattes se pose, sinon 0 ; secouer : il s'ébroue (en sortant de l'eau).
 */
export function creerRenard(ctx) {
  const { THREE, atelier, P, maillage } = ctx;
  const PI = Math.PI;
  const racine = new THREE.Group();
  const corps = new THREE.Group();
  racine.add(corps);
  const c = atelier()
    .ovale(0.155, P.renard, { y: 0.28, sx: 0.76, sy: 0.76, sz: 1.45 }, 14)
    .ovale(0.11, P.renard, { y: 0.31, z: 0.16, sy: 1.1 }, 10)
    // le bavoir rouge des renards d'Inari, et son grelot doré
    .piece(new THREE.ConeGeometry(0.1, 0.13, 3), P.renardRouge, { y: 0.33, z: 0.215, rx: PI - 0.25, ry: PI / 6, sz: 0.25 })
    .boule(0.026, P.grelot, { y: 0.275, z: 0.25 }, 1);
  corps.add(maillage(c.fin(0, false)));

  // la tête : un crâne rond, des joues en touffes, un long museau pointu, de grandes oreilles
  const h = atelier()
    .ovale(0.125, P.renard, { y: 0.06, z: 0.0, sx: 1.08, sy: 0.92 }, 14)
    .ovale(0.07, P.renard, { x: -0.085, y: 0.0, z: 0.02, sx: 1.1, sz: 0.9 }, 10)
    .ovale(0.07, P.renard, { x: 0.085, y: 0.0, z: 0.02, sx: 1.1, sz: 0.9 }, 10)
    .cone(0.062, 0.21, 10, P.renard, { y: 0.0, z: 0.17, rx: PI / 2 + 0.18 })
    .boule(0.026, P.noir, { y: -0.02, z: 0.275 }, 1);
  for (const s of [-1, 1]) {
    h.cone(0.062, 0.21, 4, P.renard, { x: s * 0.075, y: 0.23, z: -0.015, rz: -s * 0.24, ry: PI / 4 })
      .cone(0.038, 0.15, 4, P.renardRouge, { x: s * 0.075, y: 0.215, z: 0.005, rz: -s * 0.24, ry: PI / 4, trait: false })
      // des yeux en arc (un renard qui sourit) et les traits rouges au-dessus, comme sur les statues
      .piece(new THREE.TorusGeometry(0.021, 0.007, 4, 10, PI), P.noir, { x: s * 0.052, y: 0.075, z: 0.112, trait: false })
      .boite(0.034, 0.009, 0.01, P.renardRouge, { x: s * 0.058, y: 0.118, z: 0.1, rz: s * 0.45, trait: false });
  }
  const tete = pivot(ctx, 0, 0.42, 0.21, maillage(h.fin(0, false)));
  corps.add(tete);

  const pattes = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => {
    const a = atelier()
      .cylindre(0.03, 0.026, 0.2, 7, P.renard, { y: -0.1 })
      .ovale(0.034, P.renardOmbre, { y: -0.2, z: 0.012, sy: 0.6 }, 8);
    const p = pivot(ctx, sx * 0.075, 0.21, sz * 0.13, maillage(a.fin(0, false)));
    corps.add(p);
    return p;
  });

  // la grande queue en panache, relevée derrière, au bout rouge
  const q = atelier()
    .ovale(0.12, P.renard, { y: 0.1, z: -0.1, sx: 0.8, sy: 0.8, sz: 1.7, rx: -0.85 }, 12)
    .ovale(0.11, P.renard, { y: 0.27, z: -0.2, sx: 0.85, sy: 0.85, sz: 1.3, rx: -1.25 }, 12)
    .ovale(0.075, P.renardRouge, { y: 0.39, z: -0.22, sx: 0.9, sz: 1.1, rx: -1.4 }, 10);
  const queue = pivot(ctx, 0, 0.3, -0.2, maillage(q.fin(0, false)));
  corps.add(queue);

  let phase = 0, assis = 1, foulee = 0, secousse = 0;
  return {
    objet: racine,
    secouer() { secousse = 1; },
    animer(dt, vitesse, temps) {
      const trot = Math.min(1, vitesse / 3);
      phase += dt * (6 + vitesse * 3);
      const f = Math.floor((phase - PI / 2) / PI);
      let pose = 0;
      if (f !== foulee) { foulee = f; if (trot > 0.3) pose = f & 1 ? -1 : 1; }
      // assis quand il attend : l'arrière-train descend, les pattes avant tendues
      assis += ((trot < 0.05 ? 1 : 0) - assis) * Math.min(1, dt * 4);
      const sw = Math.sin(phase) * 0.7 * trot;
      pattes[0].rotation.x = sw; pattes[3].rotation.x = sw;
      pattes[1].rotation.x = -sw; pattes[2].rotation.x = -sw;
      corps.rotation.x = -0.32 * assis;
      corps.position.y = -0.04 * assis + Math.abs(Math.cos(phase)) * 0.03 * trot;
      pattes[2].rotation.x += 1.1 * assis; pattes[3].rotation.x += 1.1 * assis;
      pattes[0].rotation.x += 0.3 * assis; pattes[1].rotation.x += 0.3 * assis;
      tete.rotation.x = 0.3 * assis + Math.sin(temps * 1.3) * 0.04;
      tete.rotation.z = Math.sin(temps * 0.7) * 0.12 * assis;
      queue.rotation.y = Math.sin(temps * (2 + 4 * trot)) * (0.35 + 0.25 * trot);
      queue.rotation.x = 0.2 * assis;
      // il s'ébroue : le corps tourne vite autour de son échine, d'un côté puis de l'autre, la tête plus fort
      corps.rotation.z = 0;
      if (secousse > 0) {
        secousse = Math.max(0, secousse - dt / 0.9);
        const s = Math.sin((1 - secousse) * 0.9 * 2 * PI * 8.6) * Math.sin(secousse * PI) * 0.45;
        corps.rotation.z = s;
        tete.rotation.z += s * 0.8;
        queue.rotation.y += s * 1.5;
      }
      return pose;
    },
  };
}

/** Un daim sika (une biche ; le mâle a de petits bois). Il broute. Renvoie { objet, animer(dt, temps) }. */
export function creerDaim(ctx, male = false, decalage = 0) {
  const { THREE, atelier, P, maillage } = ctx;
  const racine = new THREE.Group();
  const c = atelier()
    .ovale(0.3, P.daim, { y: 0.78, sx: 0.72, sy: 0.7, sz: 1.35 }, 14)
    .ovale(0.12, P.daimClair, { y: 0.82, z: -0.37, sx: 1.1, sz: 0.5 }, 10);
  for (const [x, z] of [[0.1, 0.15], [-0.11, 0.05], [0.12, -0.08], [-0.08, -0.2], [0.02, 0.25], [-0.14, 0.22], [0.15, -0.22]]) {
    c.ovale(0.028, P.daimClair, { x, y: 0.97, z, sy: 0.4, trait: false }, 6);
  }
  for (const [x, z] of [[-0.12, 0.25], [0.12, 0.25], [-0.12, -0.26], [0.12, -0.26]]) {
    c.cylindre(0.036, 0.028, 0.62, 6, P.daim, { x, y: 0.32, z }).ovale(0.035, P.noir, { x, y: 0.02, z: z + 0.01, sy: 0.6 }, 6);
  }
  racine.add(maillage(c.fin(0, false)));
  // le cou part de l'épaule, vers l'avant et le haut ; pour brouter, il pivote jusqu'au sol
  const t = atelier()
    .baton([0, -0.04, -0.04], [0, 0.3, 0.3], 0.095, P.daim, 8)
    .ovale(0.13, P.daim, { y: 0.36, z: 0.4, sx: 0.95, sz: 1.45 }, 12)
    .ovale(0.045, P.noir, { y: 0.32, z: 0.58 }, 6)
    .ovale(0.07, P.daimClair, { y: 0.24, z: 0.33, sx: 0.9, sz: 0.5 }, 8);
  for (const s of [-1, 1]) {
    t.ovale(0.085, P.daim, { x: s * 0.12, y: 0.47, z: 0.33, sx: 0.55, sz: 0.28, rz: s * 0.75 }, 8)
      .ovale(0.05, P.daimClair, { x: s * 0.125, y: 0.47, z: 0.345, sx: 0.4, sz: 0.15, rz: s * 0.75, trait: false }, 6)
      .ovale(0.024, P.noir, { x: s * 0.085, y: 0.4, z: 0.49 }, 6);
    if (male) t.baton([s * 0.05, 0.47, 0.37], [s * 0.12, 0.74, 0.32], 0.016, P.daimClair, 5).baton([s * 0.09, 0.62, 0.34], [s * 0.17, 0.68, 0.45], 0.012, P.daimClair, 5);
  }
  const cou = pivot(ctx, 0, 0.86, 0.3, maillage(t.fin(0, false)));
  racine.add(cou);
  return {
    objet: racine,
    animer(dt, temps) {
      // il broute : le cou descend, reste, remonte ; une oreille qui bouge
      const cycle = (temps * 0.25 + decalage) % 1;
      const bas = cycle < 0.45 ? Math.min(1, cycle / 0.08) : Math.max(0, 1 - (cycle - 0.45) / 0.1);
      cou.rotation.x = 1.85 * bas + Math.sin(temps * 3 + decalage * 7) * 0.03 * bas;
      cou.rotation.y = 0.25 * Math.sin(temps * 0.4 + decalage * 5) * (1 - bas);
    },
  };
}
