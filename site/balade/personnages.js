// ================================================================
//  Les personnages de la balade 3D : le voyageur (garçon ou fille), son compagnon (choisi au début de chaque
//  visite : Kon le renard d'Inari, Pon le tanuki ou Chapu la loutre, des créatures à nous), les daims
//  d'Itsukushima et les passants (habillés chacun de sa tenue : creerPersonnage). Chacun est fait de formes
//  simples (l'atelier des modèles 3D), en morceaux articulés pour marcher : jambes, bras, tête, queue.
//  Le 2026-10-23, le propriétaire a demandé de refaire le renard et les deux voyageurs « mieux faits » : ils ont
//  maintenant de vrais visages (des yeux qui clignent), des cheveux en mèches, des habits en plusieurs pièces.
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
 * Une forme allongée et courbe (une queue touffue…) pour l'atelier : un cylindre plié le long de la courbe de
 * Bézier p0 → p1 → p2 (dans le plan y-z), de rayon R × profil(t) (t : 0 à la base, 1 au bout).
 */
function fuseau(THREE, [p0, p1, p2], R, profil, cotes = 12, anneaux = 14) {
  const g = new THREE.CylinderGeometry(1, 1, 1, cotes, anneaux).toNonIndexed();
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = p.getY(i) + 0.5, u = 1 - t, x = p.getX(i), z = p.getZ(i);
    const c = [0, 1, 2].map((k) => u * u * p0[k] + 2 * u * t * p1[k] + t * t * p2[k]);
    const dy = 2 * u * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]), dz = 2 * u * (p1[2] - p0[2]) + 2 * t * (p2[2] - p1[2]);
    const l = Math.hypot(dy, dz) || 1, r = R * profil(t);
    // (le repère qui suit la courbe : x, la tangente, et x × tangente : il reste direct, les faces vers l'extérieur)
    p.setXYZ(i, c[0] + x * r, c[1] - z * r * (dz / l), c[2] + z * r * (dy / l));
  }
  return g;
}

/** Les yeux qui clignent : toutes les 2,5 à 5,5 s, fermés 0,13 s (yeux : des groupes, écrasés en hauteur). */
function cligneur(yeux) {
  let prochain = 1 + Math.random() * 3, ferme = 0;
  return (dt) => {
    prochain -= dt;
    if (prochain <= 0) { ferme = 0.13; prochain = 2.5 + Math.random() * 3; }
    ferme = Math.max(0, ferme - dt);
    for (const o of yeux) o.scale.y = ferme > 0 ? 0.12 : 1;
  };
}

/**
 * Le voyageur (garçon ou fille), plus fin que les passants. Un visage : de grands yeux (l'iris, son reflet clair en
 * bas, la pupille, deux reflets, le trait des cils) qui clignent, des sourcils, un petit nez, un sourire, les joues
 * roses ; des cheveux en mèches. Le garçon : casquette bicolore, cheveux en pointes, veste ouverte sur un tee-shirt,
 * ceinture, short à revers, baskets ; sur son sac, un tapis de sol roulé. La fille : chapeau de paille au ruban et à
 * la fleur, frange et couettes nouées de rubans, chemisier au col marin et son nœud, jupe plissée, chaussettes
 * hautes et babies ; un porte-bonheur pend à son sac. Le même squelette que les passants (hanches à 0,42 m, épaules
 * à 0,75, cou à 0,82). Renvoie { objet, animer(dt, vitesse, temps), saluer(), asseoir(oui), porter(place, id),
 * danser(oui), geste(nom) } ; animer renvoie le pied qui vient de se poser (1, −1) ou 0.
 * Les habits sont en morceaux (le haut, le bas, le cou, le sac ; les bras et les jambes chacun le sien) : une tenue
 * achetée au marchand (2026-10-23 : happi, yukata, kimono d'or, armure) remplace ceux qu'elle couvre (HABITS).
 */
export function creerHeros(ctx, sorte = 'garcon') {
  const { THREE, atelier, P, maillage } = ctx;
  const PI = Math.PI, fille = sorte === 'fille', PEAU = P.peau, H = fille ? P.cheveuxFille : P.cheveux;
  // (danseur : tout le corps, jambes comprises, pour danser : il tourne sur lui-même, il saute)
  const racine = new THREE.Group(), danseur = new THREE.Group(), corps = new THREE.Group();
  racine.add(danseur);
  danseur.add(corps);

  // les jambes (pivot à la hanche)
  const jambesBase = [];
  const jambes = [-1, 1].map((s) => {
    const a = atelier();
    if (fille) {
      a.cylindre(0.05, 0.045, 0.22, 10, PEAU, { y: -0.13 })
        .cylindre(0.049, 0.046, 0.15, 10, P.chaussette, { y: -0.295 })
        .cylindre(0.051, 0.051, 0.022, 10, P.chaussetteBord, { y: -0.225 })
        .ovale(0.068, P.chaussuresFille, { y: -0.368, z: 0.03, sx: 0.92, sy: 0.56, sz: 1.42 }, 12)
        .boite(0.104, 0.016, 0.026, P.chaussuresFille, { y: -0.338, z: 0.0 })
        .ovale(0.072, P.semelleFille, { y: -0.396, z: 0.03, sx: 0.95, sy: 0.2, sz: 1.45 }, 12);
    } else {
      a.cylindre(0.08, 0.074, 0.15, 12, P.short, { y: -0.06 })
        .cylindre(0.083, 0.083, 0.03, 12, P.shortFonce, { y: -0.13 })
        .cylindre(0.05, 0.044, 0.19, 10, PEAU, { y: -0.22 })
        .cylindre(0.047, 0.047, 0.06, 10, P.chaussette, { y: -0.32 })
        .ovale(0.072, P.chaussures, { y: -0.364, z: 0.035, sx: 0.95, sy: 0.6, sz: 1.45 }, 12)
        .ovale(0.06, P.basket, { y: -0.372, z: 0.09, sx: 0.98, sy: 0.52, sz: 0.85 }, 10)
        .ovale(0.077, P.semelle, { y: -0.397, z: 0.035, sx: 0.98, sy: 0.22, sz: 1.45 }, 12);
    }
    const m = maillage(a.fin(0, false));
    jambesBase.push(m);
    const j = pivot(ctx, s * 0.085, 0.42, 0, m);
    danseur.add(j);
    return j;
  });

  // le buste : le bas (jupe, short), le haut (chemisier, tee-shirt et veste), le cou, le sac (chacun à part : une
  // tenue en cache certains)
  const bas = atelier(), haut = atelier(), cou = atelier(), b = atelier();
  if (fille) {
    // la jupe plissée (des plis qui s'ouvrent vers le bas, d'un bleu et d'un bleu plus sombre), sa ceinture
    const plis = (x, y, z) => { const t = Math.atan2(x, z), f = (0.11 - y) / 0.22, k = 1 + 0.06 * f * (0.5 + 0.5 * Math.cos(12 * t)); return [x * k, y, z * k]; };
    bas.piece(new THREE.CylinderGeometry(0.168, 0.285, 0.22, 48, 2), P.jupe, { y: 0.445, deformer: plis, teinte: (x, y, z) => (Math.floor(((Math.atan2(x, z) + PI) * 24) / (2 * PI)) % 2 ? P.jupe : P.jupeFonce) })
      .cylindre(0.171, 0.171, 0.032, 18, P.jupeFonce, { y: 0.556 });
    haut.cylindre(0.145, 0.166, 0.25, 16, P.chemisier, { y: 0.68, sz: 0.9 })
      .ovale(0.155, P.chemisier, { y: 0.795, sy: 0.42, sz: 0.9 }, 16)
      // le col marin : le rabat carré dans le dos, sa rayure ; devant, en V
      .boite(0.27, 0.16, 0.018, P.col, { y: 0.755, z: -0.142, rx: 0.18 })
      .boite(0.25, 0.02, 0.022, P.colRayure, { y: 0.692, z: -0.131, rx: 0.18 });
    cou.cylindre(0.05, 0.056, 0.08, 10, PEAU, { y: 0.815 });
    for (const s of [-1, 1]) {
      haut.boite(0.046, 0.17, 0.016, P.col, { x: s * 0.058, y: 0.748, z: 0.137 + s * 0.002, rz: s * 0.5, rx: -0.22 })
        // le nœud rouge : ses deux boucles, ses deux pans
        .ovale(0.034, P.noeud, { x: s * 0.036, y: 0.688, z: 0.158, sx: 1.3, sy: 0.78, sz: 0.45, rz: -s * 0.25 }, 10)
        .boite(0.026, 0.07, 0.01, P.noeud, { x: s * 0.018, y: 0.645, z: 0.156 + s * 0.0015, rz: s * 0.25, rx: -0.15 });
    }
    haut.ovale(0.017, P.noeud, { y: 0.688, z: 0.168, sz: 0.6 }, 8);
  } else {
    // le short et sa ceinture, le tee-shirt ; la veste ouverte devant (un cylindre ouvert : le tee-shirt se voit
    // entre ses revers), ses épaules, son col relevé derrière la nuque
    bas.cylindre(0.178, 0.19, 0.13, 16, P.short, { y: 0.475 })
      .cylindre(0.181, 0.181, 0.035, 16, P.ceinture, { y: 0.54 })
      .boite(0.05, 0.034, 0.012, P.boucle, { y: 0.54, z: 0.183, trait: false });
    haut.cylindre(0.15, 0.172, 0.25, 16, P.tshirt, { y: 0.675, sz: 0.9 })
      .piece(new THREE.CylinderGeometry(0.163, 0.185, 0.27, 20, 1, true, 0.6, 2 * PI - 1.2), P.veste, { y: 0.66, sz: 0.9 })
      .ovale(0.162, P.veste, { y: 0.795, sy: 0.42, sz: 0.9 }, 16)
      .piece(new THREE.TorusGeometry(0.06, 0.013, 4, 12, PI), P.tshirt, { y: 0.83, z: 0.03, rx: -1.25, rz: PI })
      .boite(0.22, 0.07, 0.035, P.vesteFonce, { y: 0.845, z: -0.072, rx: -0.35 });
    cou.cylindre(0.052, 0.058, 0.08, 10, PEAU, { y: 0.815 });
    for (const s of [-1, 1]) haut.boite(0.044, 0.23, 0.016, P.vesteFonce, { x: s * 0.088, y: 0.672, z: 0.13, ry: s * 0.62, rz: -s * 0.06 });
  }
  // le sac à dos : le corps arrondi en haut, le rabat, la poche de devant et ses boucles, les bretelles
  const SAC = fille ? P.sacFille : P.sac, SACF = fille ? P.sacFilleFonce : P.sacFonce;
  b.boite(0.27, 0.27, 0.12, SAC, { y: 0.655, z: -0.225 })
    .ovale(0.135, SAC, { y: 0.79, z: -0.225, sy: 0.42, sz: 0.46 }, 12)
    .boite(0.278, 0.14, 0.128, SACF, { y: 0.755, z: -0.226 })
    .boite(0.2, 0.12, 0.05, SAC, { y: 0.6, z: -0.305 })
    .boite(0.206, 0.04, 0.056, SACF, { y: 0.655, z: -0.305 });
  for (const s of [-1, 1]) {
    b.boite(0.032, 0.05, 0.012, P.boucle, { x: s * 0.07, y: 0.716, z: -0.292, trait: false })
      .baton([s * 0.1, 0.8, -0.17], [s * 0.105, 0.868, 0.0], 0.022, P.sangle, 5)
      .baton([s * 0.105, 0.866, -0.005], [s * 0.098, 0.62, 0.155], 0.022, P.sangle, 5);
  }
  if (fille) {
    // un porte-bonheur (omamori) rouge qui pend sur le côté du sac
    b.baton([0.13, 0.72, -0.2], [0.15, 0.62, -0.21], 0.004, P.boucle, 3, { trait: false })
      .boite(0.035, 0.05, 0.012, P.noeud, { x: 0.152, y: 0.6, z: -0.21 });
  } else {
    // le tapis de sol roulé, sanglé sur le sac
    b.cylindre(0.05, 0.05, 0.33, 12, P.tapis, { y: 0.865, z: -0.235, rz: PI / 2 });
    for (const s of [-1, 1]) b.cylindre(0.053, 0.053, 0.02, 12, P.sangle, { x: s * 0.09, y: 0.865, z: -0.235, rz: PI / 2 });
  }
  const mBas = maillage(bas.fin(0, false)), mHaut = maillage(haut.fin(0, false)), mSac = maillage(b.fin(0, false));
  corps.add(mBas, mHaut, maillage(cou.fin(0, false)), mSac);

  // les bras (pivot à l'épaule) : la manche, l'avant-bras, la main et son pouce
  const main = (a, s, c = PEAU) => a.ovale(0.048, c, { y: -0.31, sx: 0.78, sy: 1.08 }, 10).ovale(0.02, c, { x: -s * 0.022, y: -0.288, z: 0.03, sy: 1.4, rx: 0.3 }, 6);
  const brasBase = [];
  const bras = [-1, 1].map((s) => {
    const a = atelier();
    if (fille) {
      a.ovale(0.072, P.chemisier, { y: -0.045, sy: 0.95 }, 12)
        .cylindre(0.06, 0.06, 0.025, 12, P.col, { y: -0.1 })
        .cylindre(0.043, 0.039, 0.17, 8, PEAU, { y: -0.19 });
      if (s === 1) a.piece(new THREE.TorusGeometry(0.041, 0.009, 4, 12), P.noeud, { y: -0.255, rx: PI / 2, trait: false });
    } else {
      a.cylindre(0.065, 0.061, 0.15, 12, P.veste, { y: -0.06 })
        .cylindre(0.068, 0.068, 0.032, 12, P.vesteFonce, { y: -0.13 })
        .cylindre(0.043, 0.039, 0.15, 8, PEAU, { y: -0.215 });
    }
    main(a, s);
    const m = maillage(a.fin(0, false));
    brasBase.push(m);
    const br = pivot(ctx, s * 0.205, 0.75, 0, m);
    br.rotation.z = s * 0.12;
    corps.add(br);
    return br;
  });

  // la tête (pivot au cou) : le visage est une boule de rayon R, centrée CY au-dessus du cou ; ce qu'on y pose
  // (yeux, sourcils, bouche…) est tourné vers le dehors de la boule (surVisage)
  const R = 0.3, CY = 0.25;
  const surVisage = (lx, ly, ecart = 0) => {
    const ry = Math.asin(lx / R), rx = -Math.asin(ly / (R * Math.cos(ry))), z = Math.sqrt(R * R - lx * lx - ly * ly) + ecart;
    return { x: lx, y: CY + ly, z, rx, ry };
  };
  const t = atelier()
    .ovale(R, PEAU, { y: CY, sx: 1.04, deformer: (x, y, z) => (y < 0 ? [x * (1 + 0.16 * (y / R)), y * 1.04, z * (1 + 0.05 * (y / R))] : [x, y, z]) }, 22);
  for (const s of [-1, 1]) {
    t.ovale(0.052, PEAU, { x: s * 0.302, y: CY - 0.03, sx: 0.5, sz: 0.8 }, 8)
      // les sourcils, les joues
      .piece(new THREE.TorusGeometry(0.043, fille ? 0.0058 : 0.0072, 3, 9, PI * 0.62), P.sourcils, { ...surVisage(s * 0.108, 0.072, 0.002), rz: PI * 0.19 - s * 0.08, trait: false })
      .ovale(0.036, P.joue, { ...surVisage(s * 0.168, -0.088, -0.004), sx: 1.3, sy: 0.62, sz: 0.25, trait: false }, 8);
  }
  t.ovale(0.012, P.nez, { ...surVisage(0, -0.07, -0.002), sz: 0.6, trait: false }, 6)
    .piece(new THREE.TorusGeometry(0.022, 0.0055, 4, 9, PI * 0.72), P.bouche, { ...surVisage(0, -0.112, 0.001), rz: PI * 1.14, trait: false });
  if (fille) {
    // la calotte de cheveux, ceux qui tombent dans le dos ; la frange en mèches ; deux longues mèches devant les
    // oreilles ; les couettes nouées de rubans rouges, qui frisent au bout
    t.piece(new THREE.SphereGeometry(0.318, 22, 12, 0, 2 * PI, 0, PI * 0.62), H, { y: CY, rx: -0.4 })
      .ovale(0.27, H, { y: CY - 0.11, z: -0.1, sx: 1.08, sy: 1.12, sz: 0.62 }, 16);
    for (const [x, rz, l] of [[-0.2, 0.55, 0.15], [-0.132, 0.32, 0.18], [-0.066, 0.12, 0.19], [0.0, -0.03, 0.17], [0.066, -0.14, 0.19], [0.132, -0.32, 0.18], [0.2, -0.55, 0.15]]) {
      t.cone(0.056, l, 4, H, { x, y: CY + 0.16, z: 0.262 - Math.abs(x) * 0.4, rx: PI - 0.34, rz, sz: 0.42 });
    }
    for (const s of [-1, 1]) {
      t.cone(0.05, 0.27, 5, H, { x: s * 0.258, y: CY - 0.03, z: 0.1, rx: PI - 0.06, rz: s * 0.07, sz: 0.55 })
        .ovale(0.064, H, { x: s * 0.31, y: CY - 0.25, z: -0.1, sx: 0.85, sy: 2.0, rz: s * 0.18 }, 10)
        .ovale(0.046, H, { x: s * 0.355, y: CY - 0.39, z: -0.09, sy: 1.35, rz: s * 0.55 }, 8)
        .ovale(0.042, P.ruban, { x: s * 0.305, y: CY - 0.06, z: -0.14, sx: 0.45, sy: 0.75, sz: 1.2, rx: -0.6 }, 8)
        .ovale(0.042, P.ruban, { x: s * 0.305, y: CY - 0.13, z: -0.05, sx: 0.45, sy: 0.75, sz: 1.2, rx: 0.6 }, 8)
        .boule(0.024, P.ruban, { x: s * 0.31, y: CY - 0.1, z: -0.09 }, 1);
    }
  } else {
    // la calotte, des pointes sous la casquette sur le front, devant les oreilles et sur la nuque
    t.piece(new THREE.SphereGeometry(0.318, 22, 12, 0, 2 * PI, 0, PI * 0.6), H, { y: CY, rx: -0.48 });
    for (const [x, rz, l] of [[-0.18, 0.55, 0.13], [-0.09, 0.24, 0.16], [0.0, -0.04, 0.15], [0.09, -0.3, 0.16], [0.18, -0.6, 0.12]]) {
      t.cone(0.062, l, 4, H, { x, y: CY + 0.15, z: 0.262 - Math.abs(x) * 0.35, rx: PI - 0.6, rz, sz: 0.5 });
    }
    for (const s of [-1, 1]) t.cone(0.05, 0.13, 4, H, { x: s * 0.27, y: CY + 0.04, z: 0.07, rx: PI - 0.15, rz: s * 0.22, sz: 0.5 });
    for (const x of [-0.11, 0, 0.11]) t.cone(0.06, 0.13, 4, H, { x, y: CY - 0.09, z: -0.255, rx: PI + 0.55, sz: 0.6 });
  }
  const tete = pivot(ctx, 0, 0.82, 0, maillage(t.fin(0, false)));
  corps.add(tete);

  // les yeux (à part : ils clignent) : des disques plats posés sur le visage
  const yeux = [-1, 1].map((s) => {
    const a = atelier(), q = surVisage(s * 0.104, -0.022, 0.001), cercle = (r, c, o) => a.piece(new THREE.CircleGeometry(r, 18), c, { trait: false, ...o });
    cercle(0.05, fille ? P.irisFille : P.iris, { sx: 0.84, sy: 1.22 });
    cercle(0.034, fille ? P.irisFilleClair : P.irisClair, { y: -0.03, z: 0.001, sx: 0.95, sy: 0.5 });
    cercle(0.027, P.pupille, { y: 0.006, z: 0.002, sx: 0.8, sy: 1.12 });
    cercle(0.015, P.reflet, { x: s * 0.014, y: 0.026, z: 0.003 });
    cercle(0.0075, P.reflet, { x: -s * 0.012, y: -0.024, z: 0.003 });
    a.piece(new THREE.TorusGeometry(0.047, fille ? 0.0095 : 0.0078, 4, 14, PI), P.cils, { y: 0.004, z: 0.003, sx: 0.9, sy: 1.24, sz: 0.5, trait: false });
    if (fille) a.cone(0.011, 0.036, 4, P.cils, { x: s * 0.046, y: 0.05, z: 0.003, rz: -s * 0.95, sz: 0.5, trait: false });
    const g = pivot(ctx, q.x, q.y, q.z, maillage(a.fin(0, false), false));
    g.rotation.set(q.rx, q.ry, 0);
    tete.add(g);
    return g;
  });
  const cligner = cligneur(yeux);

  // le couvre-chef, à part (incliné d'un bloc, en arrière) : la casquette (son devant blanc, le Fuji rouge, la
  // visière qui s'arrondit, le bouton) ; le chapeau de paille (bord et calotte tournés, en rangs de paille ; le
  // ruban, son nœud et ses pans, une fleur)
  const c = atelier();
  if (fille) {
    const profil = [[0.001, 0.182], [0.15, 0.178], [0.205, 0.162], [0.232, 0.125], [0.243, 0.07], [0.25, 0.015], [0.3, 0.008], [0.35, -0.004], [0.4, -0.02], [0.44, -0.038], [0.468, -0.052], [0.47, -0.064], [0.44, -0.052], [0.4, -0.034], [0.35, -0.018], [0.3, -0.006], [0.25, 0.0], [0.24, -0.02]].map(([r, y]) => new THREE.Vector2(r, y)).reverse(); // (de bas en haut : les faces vers le dehors)
    c.piece(new THREE.LatheGeometry(profil, 36), P.chapeau, { teinte: (x, y, z) => (Math.floor(Math.hypot(x, z) / 0.05 + (y > 0.02 ? y / 0.04 : 0)) % 2 ? P.chapeau : P.chapeauFonce) })
      .cylindre(0.253, 0.257, 0.05, 28, P.ruban, { y: 0.04 });
    // le nœud derrière, ses pans ; la fleur sur le côté
    c.ovale(0.05, P.ruban, { x: -0.06, y: 0.045, z: -0.25, sx: 1.2, sy: 0.6, sz: 0.4 }, 8)
      .ovale(0.05, P.ruban, { x: 0.06, y: 0.045, z: -0.25, sx: 1.2, sy: 0.6, sz: 0.4 }, 8)
      .boite(0.03, 0.12, 0.01, P.ruban, { x: -0.03, y: -0.02, z: -0.262, rz: 0.2 })
      .boite(0.03, 0.12, 0.01, P.ruban, { x: 0.03, y: -0.02, z: -0.262, rz: -0.2 });
    const fa = 0.75, fx = Math.sin(fa) * 0.262, fz = Math.cos(fa) * 0.262;
    for (let k = 0; k < 5; k++) {
      const ak = (k / 5) * 2 * PI;
      c.ovale(0.026, P.fleur, { x: fx + Math.sin(fa) * 0.004 + Math.cos(fa) * Math.cos(ak) * 0.028, y: 0.045 + Math.sin(ak) * 0.028, z: fz + Math.cos(fa) * 0.004 - Math.sin(fa) * Math.cos(ak) * 0.028, sz: 0.35, ry: fa, trait: false }, 8);
    }
    c.ovale(0.016, P.fleurCoeur, { x: fx + Math.sin(fa) * 0.012, y: 0.045, z: fz + Math.cos(fa) * 0.012, sz: 0.6, ry: fa, trait: false }, 6);
  } else {
    c.piece(new THREE.SphereGeometry(0.333, 24, 9, 0, 2 * PI, 0, PI / 2), P.casquette, { sy: 0.86 })
      .piece(new THREE.CylinderGeometry(0.235, 0.235, 0.024, 22, 1, false, -PI / 2, PI), P.visiere, { y: 0.018, z: 0.2, rx: 0.06, deformer: (x, y, z) => [x, y - 0.045 * (x / 0.235) ** 2, z] })
      .boule(0.03, P.casquette, { y: 0.288 }, 1)
      .piece(new THREE.CircleGeometry(0.056, 20), P.casquetteFace, { y: 0.166, z: 0.276, rx: -0.68, trait: false })
      .piece(new THREE.CircleGeometry(0.034, 3), P.basket, { y: 0.1642, z: 0.2801, rz: PI / 2, rx: -0.68, sy: 0.8, trait: false })
      .boite(0.09, 0.03, 0.02, P.visiere, { y: 0.06, z: -0.33, rx: 0.15 });
  }
  const coiffe = pivot(ctx, 0, fille ? CY + 0.215 : CY + 0.075, fille ? -0.01 : -0.004, maillage(c.fin(0, false)));
  coiffe.rotation.x = fille ? -0.14 : -0.16;
  tete.add(coiffe);

  // Les pièces de tenue (tenues.js), faites la première fois qu'on les porte, dans le repère de la tête.
  // vers(dx, dy, dz) : la rotation qui couche l'axe d'un cône (y) dans cette direction
  const vers = (dx, dy, dz) => { const l = Math.hypot(dx, dy, dz); return { rx: Math.atan2(dz / l, dy / l), rz: -Math.asin(dx / l) }; };
  // tête nue : le garçon a des épis sur le dessus (la casquette les cachait)
  let dessus = null;
  if (!fille) {
    const a = atelier();
    for (const [x, y, z, d, l] of [[0, 0.3, 0.07, [0, 0.8, -0.6], 0.15], [0.12, 0.27, 0.05, [0.5, 0.75, -0.45], 0.13], [-0.12, 0.27, 0.05, [-0.5, 0.75, -0.45], 0.13],
      [0, 0.25, -0.13, [0, 0.55, -0.85], 0.14], [0.13, 0.2, -0.16, [0.45, 0.35, -0.85], 0.12], [-0.13, 0.2, -0.16, [-0.45, 0.35, -0.85], 0.12]]) {
      const n = Math.hypot(...d);
      a.cone(0.06, l, 4, H, { x: x + (d[0] / n) * l * 0.4, y: CY + y + (d[1] / n) * l * 0.4, z: z + (d[2] / n) * l * 0.4, ...vers(...d), sz: 0.55 });
    }
    dessus = maillage(a.fin(0, false));
    dessus.visible = false;
    tete.add(dessus);
  }
  const FORMES = {
    // les bois de daim : un serre-tête brun, deux oreilles de daim, deux bois à trois andouillers (comme les daims de Miyajima)
    bois() {
      const a = atelier(), r = 0.335, inc = -0.3, o = [0, CY - 0.02, -0.03];
      // un point du serre-tête (angle th depuis le côté droit, dans son plan incliné vers l'arrière), un peu au-dessus (ecart)
      const sur = (th, ecart = 0) => {
        const x = Math.cos(th) * (r + ecart), y = Math.sin(th) * (r + ecart);
        return [o[0] + x, o[1] + y * Math.cos(inc), o[2] + y * Math.sin(inc)];
      };
      a.piece(new THREE.TorusGeometry(r, 0.018, 6, 26, PI), '#8a5a3a', { x: o[0], y: o[1], z: o[2], rx: inc });
      for (const s of [-1, 1]) {
        // l'oreille : une feuille couchée vers le dehors, rose dedans
        const [ox, oy, oz] = sur(s > 0 ? 0.62 : PI - 0.62, 0.03);
        a.ovale(0.065, '#b98250', { x: ox, y: oy, z: oz, sx: 0.5, sy: 1.25, sz: 0.28, ...vers(s * 0.85, 0.5, 0.05) }, 10)
          .ovale(0.045, '#f2b3a3', { x: ox + s * 0.004, y: oy + 0.004, z: oz + 0.016, sx: 0.4, sy: 1.15, sz: 0.2, ...vers(s * 0.85, 0.5, 0.05), trait: false }, 8);
        // le bois : la perche qui monte en s'écartant, un andouiller vers l'avant, une fourche au bout
        const [bx, by, bz] = sur(s > 0 ? 1.18 : PI - 1.18, 0.005);
        const B = [bx, by, bz], M1 = [bx + s * 0.06, by + 0.13, bz - 0.03], T = [bx + s * 0.125, by + 0.26, bz - 0.06];
        const BOIS = '#e2c596';
        a.boule(0.03, '#c7a06a', { x: bx, y: by, z: bz }, 1)
          .baton(B, M1, 0.024, BOIS, 6).baton(M1, T, 0.02, BOIS, 6)
          .baton(M1, [M1[0] + s * 0.005, M1[1] + 0.09, M1[2] + 0.075], 0.016, BOIS, 6)
          .baton(T, [T[0] + s * 0.06, T[1] + 0.075, T[2] + 0.025], 0.015, BOIS, 6)
          .baton(T, [T[0] - s * 0.025, T[1] + 0.085, T[2] - 0.045], 0.015, BOIS, 6);
        for (const p of [M1, T]) a.boule(0.022, BOIS, { x: p[0], y: p[1], z: p[2] }, 1);
        for (const p of [[M1[0] + s * 0.005, M1[1] + 0.09, M1[2] + 0.075], [T[0] + s * 0.06, T[1] + 0.075, T[2] + 0.025], [T[0] - s * 0.025, T[1] + 0.085, T[2] - 0.045]]) {
          a.boule(0.016, BOIS, { x: p[0], y: p[1], z: p[2] }, 1);
        }
      }
      return a;
    },
    // les lunettes étoiles : deux étoiles dorées, des verres violets avec un reflet, le pont, les branches jusqu'aux oreilles
    etoiles() {
      const a = atelier();
      const forme = (R, r) => {
        const f = new THREE.Shape();
        for (let k = 0; k < 10; k++) {
          const t = (k * PI) / 5, l = k % 2 ? r : R;
          f[k ? 'lineTo' : 'moveTo'](Math.sin(t) * l, Math.cos(t) * l);
        }
        return f;
      };
      for (const s of [-1, 1]) {
        const q = surVisage(s * 0.106, -0.018, 0.02), place = { x: q.x, y: q.y, z: q.z, rx: q.rx, ry: q.ry };
        const cadre = forme(0.074, 0.038);
        cadre.holes.push(forme(0.052, 0.026));
        a.piece(new THREE.ExtrudeGeometry(cadre, { depth: 0.014, bevelEnabled: false }), '#f4c12e', place)
          .piece(new THREE.ShapeGeometry(forme(0.054, 0.027)), '#4b3f8f', { ...place, z: q.z + 0.006, trait: false })
          .boite(0.008, 0.032, 0.002, '#ffffff', { ...place, x: q.x - s * 0.004 - 0.016, y: q.y + 0.012, z: q.z + 0.0075, rz: -0.6, trait: false })
          // la branche : du bord de l'étoile à l'oreille, en contournant la tête
          .baton([s * 0.168, CY - 0.008, q.z - 0.045], [s * 0.292, CY + 0.004, 0.17], 0.009, '#f4c12e', 5)
          .baton([s * 0.292, CY + 0.004, 0.17], [s * 0.322, CY + 0.012, 0.02], 0.009, '#f4c12e', 5);
      }
      const g = surVisage(0, -0.005, 0.02);
      return a.baton([-0.045, g.y, g.z - 0.004], [0.045, g.y, g.z - 0.004], 0.009, '#f4c12e', 5);
    },
    // le casque de samouraï (kabuto) : le bol de fer à côtes et son bouton, la visière, le couvre-nuque en trois lames
    // laquées de rouge, ses deux ailerons retournés, les cornes dorées (kuwagata) et le soleil du cimier
    kabuto() {
      const a = atelier(), FER = '#3f3d4a', ROUGE = '#b8322a', OR = '#e8b941', y0 = CY + 0.035;
      a.piece(new THREE.SphereGeometry(0.348, 28, 10, 0, 2 * PI, 0, PI * 0.52), FER, {
        y: y0, sy: 0.92, teinte: (x, y, z) => (Math.floor(((Math.atan2(x, z) + PI) / (2 * PI)) * 28) % 2 ? FER : '#55526a'),
      })
        .cylindre(0.045, 0.06, 0.04, 12, OR, { y: y0 + 0.32 })
        .piece(new THREE.CylinderGeometry(0.33, 0.33, 0.024, 24, 1, false, -PI * 0.42, PI * 0.84), FER, { y: y0 + 0.01, z: 0.07, rx: 0.12, deformer: (x, y, z) => [x, y - 0.05 * (x / 0.33) ** 2, z] });
      // le couvre-nuque : trois lames de plus en plus larges, autour des côtés et du dos (ouvert devant) ; des lacets bleus
      for (const [k, dy, r0, r1] of [[0, -0.02, 0.35, 0.39], [1, -0.085, 0.385, 0.43], [2, -0.15, 0.42, 0.47]]) {
        const t0 = 0.85 + k * 0.04, tl = 2 * PI - 1.7 - k * 0.08;
        a.piece(new THREE.CylinderGeometry(r0, r1, 0.072, 26, 1, true, t0, tl), ROUGE, { y: y0 + dy })
          .piece(new THREE.CylinderGeometry((r0 + r1) / 2 + 0.006, (r0 + r1) / 2 + 0.008, 0.014, 26, 1, true, t0, tl), '#3a5ab0', { y: y0 + dy - 0.012, trait: false });
      }
      // les ailerons, retournés vers l'avant de chaque côté du visage, bordés d'or
      for (const s of [-1, 1]) {
        a.boite(0.13, 0.15, 0.022, ROUGE, { x: s * 0.33, y: y0 - 0.06, z: 0.16, ry: s * 0.95, rz: -s * 0.12 })
          .boite(0.142, 0.016, 0.026, OR, { x: s * 0.33, y: y0 + 0.018, z: 0.16, ry: s * 0.95, rz: -s * 0.12 });
        // une corne : de la base, au-dessus de la visière, elle monte en s'écartant et se recourbe au bout
        a.baton([s * 0.05, y0 + 0.13, 0.3], [s * 0.15, y0 + 0.36, 0.33], 0.022, OR, 6)
          .baton([s * 0.15, y0 + 0.36, 0.33], [s * 0.2, y0 + 0.52, 0.29], 0.018, OR, 6)
          .boule(0.022, OR, { x: s * 0.2, y: y0 + 0.52, z: 0.29 }, 1);
      }
      return a.cylindre(0.065, 0.065, 0.02, 20, OR, { y: y0 + 0.16, z: 0.31, rx: PI / 2 - 0.25 })
        .cylindre(0.04, 0.04, 0.022, 20, '#d8302c', { y: y0 + 0.162, z: 0.316, rx: PI / 2 - 0.25, trait: false });
    },
    // le masque de renard des fêtes (kitsune) : blanc, le museau, les oreilles rouges dedans, les marques rouges et les
    // yeux fendus ; porté de côté sur la tête, comme les enfants aux fêtes d'été
    masque() {
      const a = atelier(), B = '#fbf8f2', RG = '#d8302c', N = '#2a2420';
      a.ovale(0.1, B, { sx: 0.95, sy: 1.12, sz: 0.48 }, 14)
        .cone(0.045, 0.085, 10, B, { y: -0.03, z: 0.055, rx: PI / 2 })
        .ovale(0.014, N, { y: -0.03, z: 0.1, sx: 1.2 }, 6)
        .boite(0.03, 0.007, 0.01, RG, { y: -0.066, z: 0.068, trait: false })
        .ovale(0.012, RG, { y: 0.075, z: 0.042, sy: 1.8, sz: 0.5, trait: false }, 6);
      for (const s of [-1, 1]) {
        a.cone(0.036, 0.09, 6, B, { x: s * 0.058, y: 0.115, z: -0.008, rz: -s * 0.32 })
          .cone(0.022, 0.06, 6, RG, { x: s * 0.058, y: 0.11, z: 0.006, rz: -s * 0.32, sz: 0.5, trait: false })
          .boite(0.042, 0.009, 0.01, N, { x: s * 0.042, y: 0.02, z: 0.047, rz: s * 0.38, trait: false })
          .boite(0.04, 0.007, 0.01, RG, { x: s * 0.047, y: 0.046, z: 0.043, rz: s * 0.55, trait: false });
      }
      // (sur le côté droit de la tête, un peu en haut, tourné vers le dehors)
      const p = new THREE.Vector3(-0.2, 0.15, 0), l = Math.sqrt(R * R - p.x * p.x - p.y * p.y);
      p.z = l;
      const n = p.clone().normalize(), haut = new THREE.Vector3(0, 1, 0).addScaledVector(n, -n.y).normalize();
      const m = new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(haut, n), haut, n);
      const q = new THREE.Quaternion().setFromRotationMatrix(m);
      p.addScaledVector(n, 0.035);
      return { a, p: [p.x, CY + p.y, p.z], q: [q.x, q.y, q.z, q.w] };
    },
  };
  const pieces = {}, portees = {};

  // ---- Les tenues entières (achetées au marchand, tresors.js) : chacune dit ce qu'elle remplace. haut : le buste (le
  // haut, et le bas aussi pour une robe) ; bras(s), jambes(s) : leurs morceaux (sinon ceux de tous les jours) ; garde :
  // ce qu'on garde de tous les jours ('bas', 'sac') ; long : une robe jusqu'aux chevilles (on marche à petits pas)
  /** La main gantée, l'avant-bras nu d'une manche courte… : une manche de couleur c sur le haut du bras (longueur l). */
  const manche = (a, r0, r1, l, c, o = {}) => a.cylindre(r0, r1, l, 12, c, { y: -l / 2 + 0.01, ...o });
  // (les motifs, triangle par triangle : un tirage pour chaque case)
  const tirer = (i, j) => { const v = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return v - Math.floor(v); };
  /**
   * Des motifs semés sur un tissu (vu déplié : u, autour du corps, en mètres ; v, la hauteur) : des pastilles rondes
   * d'un rayon r, une par case de côté pas, un peu décalées au hasard ; couleurs : tirées au sort (null : rien).
   */
  const seme = (pas, r, couleurs, part = 0.55) => (x, y, z) => {
    const u = (Math.atan2(x, z) + PI) * 0.21, i = Math.floor(u / pas), j = Math.floor(y / pas);
    for (let di = -1; di <= 1; di++) {
      for (let dj = -1; dj <= 1; dj++) {
        const a = i + di, b = j + dj;
        if (tirer(a, b + 7) > part) continue;
        const cu = (a + 0.25 + 0.5 * tirer(a, b)) * pas, cv = (b + 0.25 + 0.5 * tirer(b, a)) * pas;
        if (Math.hypot(u - cu, y - cv) < r) return couleurs[Math.floor(tirer(a * 3, b * 5) * couleurs.length)];
      }
    }
    return null;
  };
  /** Une robe (yukata, kimono) : le buste, la jupe jusqu'à mi-mollet, les épaules, le col croisé, la ceinture. */
  const robe = (a, { tissu, motif, col, eri = null, obi, obiCordon, noeud }) => {
    const t = (x, y, z) => motif(x, y, z) ?? tissu;
    a.piece(new THREE.CylinderGeometry(0.168, 0.205, 0.31, 72, 18), tissu, { y: 0.655, sz: 0.92, teinte: t })
      .piece(new THREE.CylinderGeometry(0.205, 0.27, 0.39, 72, 22), tissu, { y: 0.305, sz: 0.94, teinte: t })
      .ovale(0.168, tissu, { y: 0.795, sy: 0.42, sz: 0.92, teinte: t }, 24);
    // le col : le bord croisé, gauche sur droite (et le col blanc dessous, sur un kimono) ; la ligne du croisé jusqu'en bas
    if (eri) for (const s of [-1, 1]) a.boite(0.034, 0.2, 0.014, eri, { x: s * 0.05, y: 0.735, z: 0.146 + (s > 0 ? 0.003 : 0), rz: s * 0.55, rx: -0.2 });
    for (const s of [-1, 1]) a.boite(0.04, 0.24, 0.016, col, { x: s * 0.064 - 0.006, y: 0.71, z: 0.152 + (s > 0 ? 0.004 : 0), rz: s * 0.5, rx: -0.18 });
    a.baton([-0.09, 0.62, 0.17], [-0.1, 0.13, 0.25], 0.008, col, 4, { trait: false })
      .cylindre(0.207, 0.207, 0.105, 24, obi, { y: 0.575, sz: 0.94 })
      .piece(new THREE.TorusGeometry(0.205, 0.008, 4, 28), obiCordon, { y: 0.575, rx: PI / 2, sy: 0.94, trait: false });
    noeud(a);
    return a;
  };
  /** Les manches d'un kimono : le haut du bras, la grande poche de la manche qui pend, l'avant-bras, la main. */
  const manchesKimono = (s, tissu, doublure) => {
    const a = atelier();
    a.cylindre(0.07, 0.076, 0.2, 12, tissu, { y: -0.09 })
      .boite(0.064, 0.29, 0.2, tissu, { x: s * 0.008, y: -0.185, z: -0.045 })
      .boite(0.07, 0.03, 0.205, doublure, { x: s * 0.008, y: -0.32, z: -0.045, trait: false })
      .cylindre(0.04, 0.038, 0.12, 8, PEAU, { y: -0.24 });
    return main(a, s);
  };
  /** Des pieds nus (sous une robe) dans des sandales : geta (de bois, deux dents) ou zōri (plates). */
  const piedsSandales = (s, { chaussette, sandale, laniere, geta = false }) => {
    const a = atelier();
    a.cylindre(0.046, 0.042, 0.2, 10, PEAU, { y: -0.2 })
      .ovale(0.05, chaussette, { y: -0.355, z: 0.03, sx: 0.9, sy: 0.55, sz: 1.4 }, 10);
    if (chaussette !== PEAU) a.cylindre(0.044, 0.044, 0.06, 10, chaussette, { y: -0.32 });
    if (geta) {
      a.boite(0.1, 0.028, 0.21, sandale, { y: -0.384, z: 0.03 })
        .boite(0.09, 0.03, 0.026, sandale, { y: -0.41, z: -0.03 })
        .boite(0.09, 0.03, 0.026, sandale, { y: -0.41, z: 0.09 });
    } else a.boite(0.1, 0.03, 0.22, sandale, { y: -0.405, z: 0.03 });
    return a.boite(0.012, 0.012, 0.07, laniere, { y: -0.362, z: 0.075, trait: false })
      .boite(0.075, 0.012, 0.014, laniere, { y: -0.36, z: 0.045, trait: false });
  };
  const HABITS = {
    // la veste des fêtes (happi) : indigo, le col blanc qui descend devant, la ceinture rouge et blanche ; les manches
    // larges jusqu'au coude ; par-dessus le short (ou la jupe) de tous les jours, et le sac reste
    happi() {
      const a = atelier(), IND = '#2f4a8a', BL = '#f3efe4', y0 = fille ? 0.5 : 0.405, r1 = fille ? 0.218 : 0.206;
      a.piece(new THREE.CylinderGeometry(0.172, r1, 0.81 - y0, 22, 2), IND, {
        y: (0.81 + y0) / 2, sz: 0.92, teinte: (x, y) => (y < y0 + 0.045 ? BL : IND),
      })
        .ovale(0.172, IND, { y: 0.8, sy: 0.42, sz: 0.92 }, 16)
        .cylindre(r1 - 0.012, r1 - 0.006, 0.05, 22, '#c8302c', { y: y0 + 0.13, sz: 0.93, teinte: (x, y, z) => (Math.floor(((Math.atan2(x, z) + PI) * 22) / (2 * PI) + y * 60) % 2 ? '#c8302c' : BL) });
      for (const s of [-1, 1]) a.boite(0.042, 0.42, 0.014, BL, { x: s * 0.05, y: 0.62, z: 0.168 + (s > 0 ? 0.004 : 0), rz: s * 0.16, rx: -0.07 });
      return {
        haut: a, garde: ['bas', 'sac'],
        bras: (s) => { const b = atelier(); manche(b, 0.074, 0.086, 0.16, IND).cylindre(0.088, 0.088, 0.03, 12, BL, { y: -0.155 }).cylindre(0.043, 0.039, 0.15, 8, PEAU, { y: -0.222 }); return main(b, s); },
      };
    },
    // le yukata d'été : bleu nuit à fleurs roses et blanches (la fille), indigo à fines rayures (le garçon) ; la ceinture
    // jaune nouée en grand nœud dans le dos (la fille) ou petite et nouée de côté (le garçon) ; les geta
    yukata() {
      const fond = fille ? '#2f3f75' : '#33456e';
      // (la fille : des fleurs rondes roses, blanches et bleu pâle ; le garçon : de fines rayures blanches, droites)
      const motif = fille ? seme(0.085, 0.026, ['#f7b4c6', '#f7b4c6', '#fbf6ea', '#9fc4e8'], 0.6)
        : (x, y, z) => (Math.floor(((Math.atan2(x, z) + PI) / (2 * PI)) * 72) % 4 === 0 ? '#dfe5ee' : null);
      const OBI = fille ? '#f2c443' : '#c9b48a';
      const a = robe(atelier(), {
        tissu: fond, motif, col: fille ? '#26335f' : '#28385a', obi: OBI, obiCordon: fille ? '#e0453a' : '#3a3236',
        noeud: (n) => {
          if (fille) {
            n.ovale(0.075, OBI, { x: -0.1, y: 0.6, z: -0.235, sx: 1.3, sy: 0.75, sz: 0.45, rz: 0.2 }, 10)
              .ovale(0.075, OBI, { x: 0.1, y: 0.6, z: -0.235, sx: 1.3, sy: 0.75, sz: 0.45, rz: -0.2 }, 10)
              .ovale(0.04, OBI, { y: 0.59, z: -0.24, sz: 0.6 }, 8)
              .boite(0.06, 0.16, 0.02, OBI, { x: -0.03, y: 0.49, z: -0.236, rz: 0.12 })
              .boite(0.06, 0.13, 0.02, OBI, { x: 0.04, y: 0.5, z: -0.233, rz: -0.15 });
          } else n.boite(0.07, 0.05, 0.03, OBI, { x: 0.12, y: 0.575, z: 0.17, ry: 0.6 }).boite(0.025, 0.09, 0.012, OBI, { x: 0.13, y: 0.52, z: 0.172, ry: 0.6 });
        },
      });
      return {
        haut: a, long: true,
        bras: (s) => manchesKimono(s, fond, fille ? '#f7b4c6' : '#28385a'),
        jambes: (s) => piedsSandales(s, { chaussette: PEAU, sandale: '#c9a06a', laniere: '#c8302c', geta: true }),
      };
    },
    // le kimono d'or : un brocart doré aux nuages blancs et aux fleurs rouges, le col blanc dessous, la ceinture rouge
    // rayée d'or ; des chaussettes blanches (tabi) et des sandales rouges (zōri)
    kimonoOr() {
      const OR = '#f0c447', ROUGE = '#c8302c';
      // (des nuages blancs qui ondulent en bandes, des fleurs rouges et blanches semées dessus)
      const fleurs = seme(0.07, 0.022, [ROUGE, ROUGE, '#fbf6ea'], 0.45);
      const motif = (x, y, z) => {
        const t = Math.atan2(x, z), n = Math.sin(t * 4 + y * 22) * 0.6 + Math.sin(t * 2 - y * 9) * 0.4;
        if (Math.abs(n - 0.55) < 0.12) return '#fbf6ea';
        return fleurs(x, y, z);
      };
      const a = robe(atelier(), {
        tissu: OR, motif, col: ROUGE, eri: '#fbf6ea', obi: '#b8322a', obiCordon: '#f4d26a',
        noeud: (n) => n.boite(0.2, 0.09, 0.06, '#b8322a', { y: 0.585, z: -0.225 })
          .boite(0.202, 0.012, 0.062, '#f4d26a', { y: 0.585, z: -0.225, trait: false })
          .boite(0.13, 0.13, 0.04, '#b8322a', { y: 0.5, z: -0.225 }),
      });
      return {
        haut: a, long: true,
        bras: (s) => manchesKimono(s, OR, ROUGE),
        jambes: (s) => piedsSandales(s, { chaussette: '#fbf8f2', sandale: '#b8322a', laniere: '#f4d26a' }),
      };
    },
    // l'armure de samouraï (ōyoroi) : la cuirasse laquée de rouge en rangs lacés d'or, le col de fer, la jupe de lames
    // lacées de bleu, les grandes épaulières, les manches de fer sur le tissu sombre ; dessous, le pantalon large, les
    // jambières laquées et les sandales de paille (le casque, kabuto, se porte sur la tête)
    armure() {
      const a = atelier(), ROUGE = '#b8322a', RF = '#8f2620', OR = '#e8b941', FER = '#3f3d4a', BLEU = '#3a5ab0', NUIT = '#2a2f4a';
      // (douze rangs : un rang de lamelles rouges, un rang lacé, sombre, piqué d'or)
      const rangs = (x, y, z) => { const k = Math.floor((y - 0.5) / (0.31 / 12)); return k % 2 ? (Math.floor(((Math.atan2(x, z) + PI) / (2 * PI)) * 26) % 2 ? OR : RF) : ROUGE; };
      a.piece(new THREE.CylinderGeometry(0.185, 0.192, 0.31, 26, 12), ROUGE, { y: 0.655, sz: 0.9, teinte: rangs })
        .ovale(0.19, FER, { y: 0.8, sy: 0.4, sz: 0.9 }, 16)
        .piece(new THREE.TorusGeometry(0.075, 0.025, 6, 16), FER, { y: 0.83, rx: PI / 2 })
        .cylindre(0.196, 0.196, 0.03, 26, OR, { y: 0.505, sz: 0.91 });
      // la jupe de lames (kusazuri), tout autour, un peu écartée
      for (let k = 0; k < 7; k++) {
        const t = (k / 7) * 2 * PI + 0.2, x = Math.sin(t) * 0.2, z = Math.cos(t) * 0.19;
        a.piece(new THREE.BoxGeometry(0.15, 0.2, 0.024, 1, 5, 1), ROUGE, {
          x, y: 0.41, z, ry: t, rx: -0.18, ordre: 'YXZ',
          teinte: (px, py) => (Math.floor((py - 0.31) / 0.04) % 2 ? BLEU : ROUGE),
        });
      }
      return {
        haut: a,
        bras: (s) => {
          const b = atelier();
          b.cylindre(0.064, 0.06, 0.15, 12, NUIT, { y: -0.06 })
            // l'épaulière (sode) : une grande plaque lacée, un peu écartée du bras
            .piece(new THREE.BoxGeometry(0.026, 0.28, 0.23, 1, 7, 1), ROUGE, { x: s * 0.09, y: -0.12, rz: s * 0.34, teinte: (px, py) => (Math.floor((py + 0.26) / 0.04) % 2 ? BLEU : ROUGE) })
            .cylindre(0.047, 0.044, 0.15, 10, NUIT, { y: -0.215 })
            .cylindre(0.05, 0.047, 0.09, 10, FER, { y: -0.23, teinte: (px, py) => (Math.floor(py * 70) % 2 ? FER : OR) });
          return main(b, s, '#3a3236');
        },
        jambes: (s) => {
          const j = atelier();
          j.cylindre(0.086, 0.078, 0.24, 12, NUIT, { y: -0.12 })
            .cylindre(0.06, 0.056, 0.13, 10, '#2a2a30', { y: -0.285, teinte: (px, py, pz) => (Math.abs(Math.atan2(px, pz)) < 0.18 ? OR : '#2a2a30') })
            .ovale(0.052, '#2a2a30', { y: -0.36, z: 0.03, sx: 0.92, sy: 0.55, sz: 1.42 }, 10)
            .boite(0.1, 0.022, 0.22, '#d9c08a', { y: -0.405, z: 0.03 })
            .boite(0.075, 0.012, 0.014, '#a8874a', { y: -0.37, z: 0.04, trait: false });
          return j;
        },
      };
    },
  };
  const habits = {};
  let habitPorte = null, long = false;
  /** Mettre la tenue id (HABITS ; 'habit-defaut' ou inconnue : les habits de tous les jours). */
  function habiller(id) {
    if (habitPorte) for (const m of habitPorte.meshes) m.visible = false;
    const f = HABITS[id];
    if (!f) {
      mHaut.visible = mBas.visible = mSac.visible = true;
      for (const m of [...brasBase, ...jambesBase]) m.visible = true;
      habitPorte = null;
      long = false;
      return;
    }
    if (!habits[id]) {
      const d = f(), meshes = [maillage(d.haut.fin(0, false))];
      corps.add(meshes[0]);
      if (d.bras) bras.forEach((br, i) => { const m = maillage(d.bras(i ? 1 : -1).fin(0, false)); br.add(m); meshes.push(m); });
      if (d.jambes) jambes.forEach((j, i) => { const m = maillage(d.jambes(i ? 1 : -1).fin(0, false)); j.add(m); meshes.push(m); });
      habits[id] = { meshes, garde: d.garde || [], bras: !!d.bras, jambes: !!d.jambes, long: !!d.long };
    }
    const h = habits[id];
    for (const m of h.meshes) m.visible = true;
    mHaut.visible = false;
    mBas.visible = h.garde.includes('bas');
    mSac.visible = h.garde.includes('sac');
    for (const m of brasBase) m.visible = !h.bras;
    for (const m of jambesBase) m.visible = !h.jambes;
    long = h.long;
    habitPorte = h;
  }

  // ---- La danse des fêtes (bon-odori), réglée sur l'air de la fête (musique.js : 112 battements par minute). Des
  // poses clés [temps, bras droit [rx, rz], bras gauche [rx, rz], tour du corps, penché, jambe droite, jambe gauche] ;
  // entre deux, le mouvement est adouci. Quatre mesures : creuser et lancer (comme les mineurs du Tankō-bushi), deux
  // claps et un tour sur soi, le balancement les bras en l'air, les mains qui ondulent et un saut.
  // (les bras levés s'écartent en V : avec cette grosse tête, un bras levé tout droit y entrait, 2026-10-23)
  const DANSE = [
    [0, [-2.25, -1.2], [0.15, 0.25], 0.28, 0, -0.28, 0.05], [1, [-2.4, -1.3], [0.05, 0.2], 0.3, 0, -0.1, 0],
    [2, [0.15, -0.25], [-2.25, 1.2], -0.28, 0, 0.05, -0.28], [3, [0.05, -0.2], [-2.4, 1.3], -0.3, 0, 0, -0.1],
    [4, [-1.35, 0.42], [-1.35, -0.42], 0, 0, 0, 0], [4.5, [-1.2, -0.35], [-1.2, 0.35], 0, 0, 0.1, 0.1],
    [5, [-1.35, 0.42], [-1.35, -0.42], 0, 0, 0, 0], [5.5, [-0.4, -1.3], [-0.4, 1.3], 0, 0, 0, 0],
    [7.5, [-0.4, -1.3], [-0.4, 1.3], 0, 0, 0, 0],
    [8, [-2.35, -1.3], [0.35, 0.65], 0, -0.13, 0.15, -0.05], [9, [0.35, -0.65], [-2.35, 1.3], 0, 0.13, -0.05, 0.15],
    [10, [-2.35, -1.3], [0.35, 0.65], 0, -0.13, 0.15, -0.05], [11, [0.35, -0.65], [-2.35, 1.3], 0, 0.13, -0.05, 0.15],
    [12, [-1.55, -0.15], [-1.55, 0.15], 0.2, 0, -0.15, 0.1], [13, [-1.55, -0.15], [-1.55, 0.15], -0.2, 0, 0.1, -0.15],
    [14, [0.3, -2.08], [0.3, 2.08], 0, 0, -0.25, -0.25], [15, [-0.6, -0.2], [-0.6, 0.2], 0, 0, 0, 0], [16, [-2.25, -1.2], [0.15, 0.25], 0.28, 0, -0.28, 0.05],
  ];
  const lisseDanse = (t) => t * t * (3 - 2 * t);
  function poseDanse(b) {
    const u = ((b % 16) + 16) % 16;
    let k = 0;
    while (k < DANSE.length - 2 && DANSE[k + 1][0] <= u) k++;
    const A = DANSE[k], B = DANSE[k + 1], f = lisseDanse(Math.min(1, (u - A[0]) / (B[0] - A[0])));
    const m = (i, j) => (j === undefined ? A[i] + (B[i] - A[i]) * f : A[i][j] + (B[i][j] - A[i][j]) * f);
    bras[0].rotation.x = m(1, 0); bras[0].rotation.z = m(1, 1);
    bras[1].rotation.x = m(2, 0); bras[1].rotation.z = m(2, 1);
    // (les mains qui ondulent : les poignets n'existent pas, les bras se balancent vite)
    if (u >= 12 && u < 14) { const o = Math.sin(b * PI * 2) * 0.35; bras[0].rotation.z += o; bras[1].rotation.z += o; }
    corps.rotation.y = m(3);
    danseur.rotation.z = m(4);
    jambes[0].rotation.x = m(5);
    jambes[1].rotation.x = m(6);
    // un tour sur soi (temps 5,5 à 7,5) ; un petit rebond à chaque temps ; le saut du temps 14
    danseur.rotation.y = u >= 5.5 && u < 7.5 ? lisseDanse((u - 5.5) / 2) * 2 * PI : 0;
    danseur.position.y = 0.035 * Math.abs(Math.sin(PI * b)) + (u >= 13.6 && u < 14.6 ? 0.16 * Math.sin(PI * (u - 13.6)) : 0);
    tete.rotation.z = -m(4) * 1.5 + Math.sin(PI * b) * 0.05;
    tete.rotation.x = -0.08;
  }

  // ---- Les gestes : les poses de l'appareil photo, creuser (le trésor d'Aogashima), poser une offrande
  /** Le geste g au temps t (secondes depuis qu'il a commencé). */
  function poseGeste(g, t) {
    const B = bras[0], G = bras[1];
    // (les bras levés s'écartent en V, à côté de la tête : levés tout droit, ils entraient dedans, 2026-10-23 ;
    // le cœur se fait des deux mains devant la poitrine)
    if (g === 'victoire') {
      // le bras droit levé (« Ouais ! »), le poing qui bat, la tête penchée, l'autre main sur la hanche
      B.rotation.x = 0.3; B.rotation.z = -2.04 - 0.07 * Math.sin(t * 6);
      G.rotation.x = 0.1; G.rotation.z = 0.75;
      tete.rotation.z = -0.12; danseur.rotation.z = 0.04;
    } else if (g === 'saut') {
      const s = Math.max(0, Math.sin(t * PI * 1.6));
      danseur.position.y = 0.3 * s;
      B.rotation.x = G.rotation.x = -0.3 + 0.6 * s; B.rotation.z = -0.12 - 1.98 * s; G.rotation.z = 0.12 + 1.98 * s;
      jambes[0].rotation.x = jambes[1].rotation.x = 0.35 * s;
    } else if (g === 'salut') {
      // une grande révérence
      corps.rotation.x = 0.62; tete.rotation.x = 0.25;
      B.rotation.x = G.rotation.x = 0.15; B.rotation.z = -0.05; G.rotation.z = 0.05;
    } else if (g === 'coeur') {
      // les deux mains qui se rejoignent devant la poitrine : un cœur ; la tête penchée de côté
      B.rotation.x = G.rotation.x = -1.05; B.rotation.z = 0.74; G.rotation.z = -0.74;
      tete.rotation.z = 0.16 + 0.04 * Math.sin(t * 2);
    } else if (g === 'coucou') {
      // la main levée de côté, qui fait au revoir
      B.rotation.x = -0.45; B.rotation.z = -2.0 + 0.2 * Math.sin(t * 9);
      G.rotation.x = 0; tete.rotation.z = -0.1;
    } else if (g === 'creuser') {
      // penché en avant, les mains qui grattent la terre l'une après l'autre
      corps.rotation.x = 0.62; corps.position.y = -0.06; tete.rotation.x = 0.35;
      B.rotation.x = -0.75 - 0.55 * Math.sin(t * 7); G.rotation.x = -0.75 - 0.55 * Math.sin(t * 7 + PI);
      B.rotation.z = -0.05; G.rotation.z = 0.05;
      jambes[0].rotation.x = -0.25; jambes[1].rotation.x = 0.25;
    } else if (g === 'offrir') {
      // se pencher et poser quelque chose devant soi, des deux mains
      const s = Math.sin(Math.min(1, t / 1.2) * PI);
      corps.rotation.x = 0.55 * s; tete.rotation.x = 0.3 * s;
      B.rotation.x = G.rotation.x = -1.05 * s; B.rotation.z = 0.1; G.rotation.z = -0.1;
    }
  }

  let phase = 0, salut = 0, foulee = 0, assis = false, danse = false, tDanse = 0, geste = null, tGeste = 0;
  return {
    objet: racine,
    /** Une petite courbette (on lui parle, il remercie…). */
    saluer() { salut = 1; },
    /** Assis sur un banc (oui) ou debout : les jambes tendues devant (la racine posée à la hauteur du siège moins ASSIS). */
    asseoir(oui) { assis = oui; },
    /** La danse des fêtes (oui), ou plus ; t0 : où en est la musique (en battements), pour danser en mesure. */
    danser(oui, t0 = 0) { danse = oui; tDanse = t0; },
    /** Un geste ('victoire', 'saut', 'salut', 'coeur', 'coucou', 'creuser', 'offrir'), ou null : plus de geste. */
    geste(g) { if (g !== geste) tGeste = 0; geste = g; },
    /**
     * Porter la pièce id (tenues.js) à sa place ('tete', 'yeux', 'habit') : sur la tête, elle remplace la casquette ou
     * le chapeau ('defaut' : les remettre ; 'nue' : rien) ; 'aucune' : rien sur les yeux ; 'habit-defaut' : les habits de
     * tous les jours. (Ce qu'on laisse sous ses pas et ce que porte le compagnon ne sont pas sur le voyageur.)
     */
    porter(place, id) {
      if (place === 'habit') { habiller(id); return; }
      if (place !== 'tete' && place !== 'yeux') return;
      if (place === 'tete') {
        coiffe.visible = id === 'defaut';
        if (dessus) dessus.visible = id !== 'defaut' && id !== 'kabuto';
      }
      if (portees[place]) portees[place].visible = false;
      portees[place] = null;
      if (!FORMES[id]) return;
      if (!pieces[id]) {
        const f = FORMES[id]();
        if (f.a) {
          // (une pièce placée et tournée : le masque, sur le côté de la tête)
          pieces[id] = maillage(f.a.fin(0, false));
          pieces[id].position.set(...f.p);
          pieces[id].quaternion.set(...f.q);
        } else pieces[id] = maillage(f.fin(0, false));
        tete.add(pieces[id]);
      }
      pieces[id].visible = true;
      portees[place] = pieces[id];
    },
    animer(dt, vitesse, temps) {
      cligner(dt);
      const marche = Math.min(1, vitesse / 3.2);
      phase += dt * (5 + vitesse * 1.9);
      const f = Math.floor((phase - PI / 2) / PI);
      let pose = 0;
      if (f !== foulee) { foulee = f; if (marche > 0.3) pose = f & 1 ? -1 : 1; }
      // (dans une robe, à petits pas)
      const sw = Math.sin(phase) * (long ? 0.36 : 0.62) * marche;
      jambes[0].rotation.x = sw;
      jambes[1].rotation.x = -sw;
      bras[0].rotation.x = -sw * 0.85;
      bras[1].rotation.x = sw * 0.85;
      bras[0].rotation.z = -0.12;
      bras[1].rotation.z = 0.12;
      danseur.position.y = 0;
      danseur.rotation.set(0, 0, 0);
      corps.rotation.y = 0;
      const respire = Math.sin(temps * 2.2) * 0.008 * (1 - marche);
      salut = Math.max(0, salut - dt * 0.9);
      const courbe = Math.sin(Math.min(1, salut) * PI) * 0.5;
      corps.position.y = Math.abs(Math.cos(phase)) * 0.045 * marche + respire;
      corps.rotation.x = 0.08 * marche + courbe;
      tete.rotation.x = -0.05 * marche + Math.sin(temps * 1.1) * 0.02 * (1 - marche) + courbe * 0.3;
      tete.rotation.z = Math.sin(phase) * 0.04 * marche;
      // (les couettes et le chapeau suivent la tête ; au repos, elle regarde un peu autour d'elle)
      tete.rotation.y = Math.sin(temps * 0.37) * 0.12 * (1 - marche);
      if (assis) {
        jambes[0].rotation.x = jambes[1].rotation.x = -1.3;
        bras[0].rotation.x = bras[1].rotation.x = -0.55;
        corps.rotation.x = -0.05 + courbe;
      } else if (danse) {
        tDanse += dt * (112 / 60);
        poseDanse(tDanse);
        tete.rotation.y = 0;
        return 0;
      } else if (geste) {
        tGeste += dt;
        poseGeste(geste, tGeste);
        tete.rotation.y = 0;
        return 0;
      }
      return assis ? 0 : pose;
    },
  };
}

/**
 * Un passant, environ 1,35 m × taille (une grosse tête : 2,5 têtes de haut, comme les héros des jeux japonais),
 * habillé selon sa tenue. Une tenue dit : taille (1 : 1,35 m), peau, cheveux, coiffure
 * ('court', 'nattes', 'queue', 'chignon', 'chauve'), chapeau { sorte : 'casquette', 'soleil', 'paille',
 * 'eboshi', 'ecolier', 'foulard', 'bob', 'bandeau' ; c, c2 }, haut, manches ('courtes', 'longues', 'kimono'),
 * col (le col croisé d'un kimono), bas { sorte : 'short', 'jupe', 'hakama', 'pantalon' ; c, c2 }, chaussures,
 * semelle, sac { sorte : 'dos', 'randoseru' ; c, c2 }, tablier, lunettes, appareil (photo, au cou), canne,
 * yeux ('plisses' : un sourire).
 * Pour le nō (Itsukushima) : coiffure 'kazura' (la longue perruque noire et son bandeau), chapeau 'tengan' (la
 * petite couronne d'or), masque (le masque blanc d'une jeune femme, ko-omote), pose ('seiza' : assis sur les
 * talons ; 'danse' : l'acteur, son éventail ; 'jouer' : un musicien, assis aussi) et instrument ('fue', la flûte ;
 * 'kotsuzumi', le tambour d'épaule ; 'otsuzumi', celui de la hanche ; 'taiko', sur son support ; 'eventail', fermé
 * devant soi).
 * Renvoie { objet, animer(dt, vitesse, temps), saluer(), asseoir(oui) }.
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
  // assis sur les talons (seiza) : tout le corps descend, les jambes repliées dessous, cachées par le hakama
  const seiza = T.pose === 'seiza' || T.pose === 'jouer';
  if (seiza) echelle.position.y = -0.3 * (T.taille || 1);

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
  // les instruments du nō, tenus devant soi ou posés (les mains suivent : voir animer)
  const I = T.instrument;
  const sablier = (h) => (x, y, z) => { const k = 0.55 + 0.45 * ((2 * y) / h) ** 2; return [x * k, y, z * k]; };
  if (I === 'fue') b.cylindre(0.016, 0.016, 0.42, 6, '#3a2420', { x: 0.14, y: 0.93, z: 0.28, rz: PI / 2, ry: -0.35 });
  else if (I === 'kotsuzumi') {
    // le petit tambour en sablier, sur l'épaule droite : deux peaux, le corps laqué, les cordes orange
    const o = { y: 0.89, z: 0.1, rz: PI / 2 + 0.3 };
    b.cylindre(0.1, 0.1, 0.03, 12, '#f3ead8', { ...o, x: -0.17, y: 0.86 }).cylindre(0.1, 0.1, 0.03, 12, '#f3ead8', { ...o, x: -0.37, y: 0.92 })
      .piece(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 10), '#2a1a14', { ...o, x: -0.27, deformer: sablier(0.2) })
      .baton([-0.17, 0.83, 0.18], [-0.37, 0.89, 0.18], 0.012, '#e8732e', 4, { trait: false });
  } else if (I === 'otsuzumi') {
    const o = { y: 0.5, z: 0.06, rz: PI / 2 };
    b.cylindre(0.11, 0.11, 0.03, 12, '#f3ead8', { ...o, x: 0.2 }).cylindre(0.11, 0.11, 0.03, 12, '#f3ead8', { ...o, x: 0.42 })
      .piece(new THREE.CylinderGeometry(0.065, 0.065, 0.22, 10), '#2a1a14', { ...o, x: 0.31, deformer: sablier(0.22) });
  } else if (I === 'taiko') {
    // le tambour plat sur son petit support, devant les genoux
    b.cylindre(0.16, 0.16, 0.12, 14, '#3a2420', { y: 0.46, z: 0.36, rx: -0.25 })
      .cylindre(0.165, 0.165, 0.02, 14, '#f3ead8', { y: 0.53, z: 0.34, rx: -0.25, trait: false });
    for (const s of [-1, 1]) b.baton([s * 0.12, 0.3, 0.42], [s * 0.1, 0.44, 0.3], 0.015, '#3a2420', 4);
  } else if (I === 'eventail') {
    // l'éventail fermé, posé à plat devant les genoux (le chœur)
    b.boite(0.3, 0.025, 0.04, '#3a2420', { y: 0.32, z: 0.3, ry: 0.1 });
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
    if (T.pose === 'danse' && s === -1) {
      // l'éventail ouvert du nō (chūkei) : un demi-disque doré au cœur rouge, tenu par la main
      a.piece(new THREE.CircleGeometry(0.3, 14, -PI * 0.35, PI * 0.7), P.or, { y: -0.3, z: 0.05, rx: -PI / 2, ry: PI / 2, teinte: (x, y, z) => (Math.hypot(x, z) < 0.12 ? '#c8372d' : P.or) })
        .baton([0, -0.3, 0.02], [0, -0.3, 0.32], 0.012, '#3a2420', 4, { trait: false });
    }
    if (T.instrument === 'taiko') a.baton([0, -0.3, 0.02], [0, -0.32, 0.26], 0.012, '#3a2420', 4, { trait: false });
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
  if (T.masque) {
    // le masque blanc (ko-omote) : un ovale un peu plus petit que le visage, les sourcils peints haut sur le
    // front, les yeux fendus, la petite bouche rouge
    const MQ = '#f7f1e6';
    t.ovale(0.2, MQ, { y: 0.21, z: 0.12, sy: 1.28, sz: 0.95 }, 14);
    for (const s of [-1, 1]) {
      t.ovale(0.028, '#2a2420', { x: s * 0.075, y: 0.37, z: 0.27, sy: 0.55, sz: 0.4, trait: false }, 6)
        .boite(0.06, 0.012, 0.01, '#2a2420', { x: s * 0.08, y: 0.24, z: 0.305, rz: s * 0.12, trait: false });
    }
    t.ovale(0.022, '#c8372d', { y: 0.075, z: 0.29, sx: 1.4, sy: 0.6, sz: 0.5, trait: false }, 6);
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
  } else if (T.coiffure === 'kazura') {
    // la perruque du nō : de longs cheveux noirs qui tombent dans le dos, et le bandeau rouge et or
    t.ovale(0.28, C1, { y: 0.14, z: -0.09, sx: 1.06, sy: 1.02, sz: 0.88 }, 14)
      .boite(0.4, 0.62, 0.08, C1, { y: -0.2, z: -0.24, rx: 0.08 })
      .piece(new THREE.TorusGeometry(0.315, 0.022, 5, 22), '#c8372d', { y: 0.37, rx: PI / 2 - 0.22, teinte: (x) => (Math.floor(x * 30 + 50) % 3 ? '#c8372d' : P.or) });
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
  } else if (H?.sorte === 'tengan') {
    // la petite couronne d'or des êtres célestes (la danse de « Hagoromo »)
    t.cylindre(0.13, 0.15, 0.05, 12, P.or, { y: 0.55, z: 0.03, rx: -0.2 })
      .cone(0.05, 0.13, 6, P.or, { y: 0.64, z: 0.05 })
      .boule(0.035, '#e8452e', { y: 0.72, z: 0.06 }, 1);
  } else if (H?.sorte === 'bandeau') {
    t.piece(new THREE.TorusGeometry(0.31, 0.035, 5, 20), H.c, { y: 0.38, rx: PI / 2 - 0.25 })
      .boite(0.08, 0.06, 0.06, H.c, { y: 0.44, z: -0.3 });
  }
  const tete = pivot(ctx, 0, 0.82, 0, maillage(t.fin(0, false)));
  corps.add(tete);

  let phase = 0, salut = 0, foulee = 0, assis = false;
  const decalage = (T.taille || 1) * 7.3 + (T.haut?.length || 0);
  return {
    objet: racine,
    /** Une petite courbette (on lui parle, il remercie…). */
    saluer() { salut = 1; },
    /** Assis sur un banc (oui) ou debout : les jambes tendues devant (la racine posée à la hauteur du siège moins ASSIS). */
    asseoir(oui) { assis = oui; },
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
      if (assis) {
        // sur un banc : les jambes devant, un peu tombantes, les mains sur les cuisses
        jambes[0].rotation.x = jambes[1].rotation.x = -1.3;
        bras[0].rotation.x = bras[1].rotation.x = -0.55;
        corps.rotation.x = -0.05 + courbe;
        return 0;
      }
      if (seiza) {
        // sur les talons : les jambes repliées dessous, les mains sur les genoux (ou sur l'instrument)
        jambes[0].rotation.x = jambes[1].rotation.x = PI / 2 - 0.05;
        bras[0].rotation.x = bras[1].rotation.x = -0.5;
        bras[0].rotation.z = -0.12; bras[1].rotation.z = 0.12;
        corps.rotation.x = 0.04 + courbe;
        corps.position.y = respire;
        // les coups du musicien : vifs, de temps en temps (chacun à son rythme)
        const coup = (u) => { const f = (u % 1 + 1) % 1; return f < 0.12 ? Math.sin((f / 0.12) * PI) : 0; };
        const c = coup(temps * 0.55 + decalage);
        if (I === 'fue') {
          // la flûte à la bouche, tenue des deux mains vers la gauche du musicien
          bras[1].rotation.x = -1.45; bras[1].rotation.z = 0.35;
          bras[0].rotation.x = -1.35; bras[0].rotation.z = -0.55;
        } else if (I === 'kotsuzumi') {
          // la main gauche tient le tambour sur l'épaule droite, la droite le frappe de côté
          bras[1].rotation.x = -2.0; bras[1].rotation.z = -0.9;
          bras[0].rotation.x = -0.9 - 0.5 * c; bras[0].rotation.z = -0.5;
        } else if (I === 'otsuzumi') {
          bras[1].rotation.x = -0.6; bras[1].rotation.z = 0.25;
          bras[0].rotation.x = -1.2 - 0.4 * c; bras[0].rotation.z = 0.6 - 0.5 * c;
        } else if (I === 'taiko') {
          const c2 = coup(temps * 0.55 + decalage + 0.5);
          bras[0].rotation.x = -0.75 - 0.5 * c; bras[1].rotation.x = -0.75 - 0.5 * c2;
        }
        return 0;
      }
      if (T.pose === 'danse') {
        // le nō : des gestes lents ; l'éventail (main droite) se lève, montre au loin, redescend ; le corps reste droit
        const u = temps * 0.42 + decalage;
        bras[0].rotation.x = -0.35 - 0.95 * (0.5 + 0.5 * Math.sin(u)) - 0.4 * marche;
        bras[0].rotation.z = -0.25 - 0.3 * (0.5 + 0.5 * Math.sin(u * 0.7 + 1));
        bras[1].rotation.x = -0.35 - 0.2 * (0.5 + 0.5 * Math.sin(u + 2));
        corps.rotation.x = 0.06 + courbe;
        tete.rotation.x = 0.05 + Math.sin(u * 0.5) * 0.08;
      }
      return pose;
    },
  };
}

// ---------------------------------------------------------------- Les compagnons
/** Les compagnons qu'on choisit au début de chaque visite (2026-10-23), comme les trois créatures du début des jeux. */
export const COMPAGNONS = ['kon', 'pon', 'chapu'];
/** Les compagnons secrets (2026-10-23) : on les achète au marchand (tresors.js) ; ensuite, on les choisit comme les autres. */
export const COMPAGNONS_SECRETS = ['gao', 'fuwa', 'saya'];

/**
 * La forme de chaque compagnon : le corps, la tête, les yeux (à part : ils clignent), les quatre pattes (avant
 * gauche, avant droite, arrière gauche, arrière droite), la queue ; chaque pièce avec son pivot [x, y, z]. bascule :
 * le point [y, z] autour duquel le corps se dresse (assis, debout).
 */
const FORMES = {
  // Kon, le renard messager d'Inari : blanc, le poitrail en jabot, le bavoir rouge et son grelot, les grandes oreilles
  // au dedans rouge, les marques rouges des statues des sanctuaires, la queue en panache au bout rouge
  kon({ THREE, atelier, P }) {
    const PI = Math.PI, W = P.renard, CR = P.renardOmbre, R = P.renardRouge;
    const corps = atelier()
      .ovale(0.15, W, { y: 0.3, z: -0.03, sx: 0.74, sy: 0.78, sz: 1.5 }, 16)
      .ovale(0.12, CR, { y: 0.252, z: -0.02, sx: 0.6, sy: 0.48, sz: 1.3 }, 12)
      .ovale(0.105, W, { y: 0.34, z: 0.15, sx: 0.95, sy: 1.15, sz: 0.85 }, 12)
      .ovale(0.075, W, { y: 0.42, z: 0.18, sy: 1.35, rx: -0.5 }, 10);
    for (const [x, dz] of [[-0.045, 0], [0, 0.012], [0.045, 0.004]]) corps.cone(0.032, 0.1, 5, W, { x, y: 0.25 + dz, z: 0.2 + dz, rx: PI - 0.45 });
    corps.ovale(0.1, R, { y: 0.36, z: 0.24, sx: 1.05, sy: 0.85, sz: 0.3, rx: 0.35 }, 12)
      .boule(0.024, P.grelot, { y: 0.305, z: 0.278 }, 1)
      .boite(0.026, 0.004, 0.006, '#7a5a20', { y: 0.298, z: 0.3, trait: false })
      .piece(new THREE.TorusGeometry(0.08, 0.01, 4, 16), R, { y: 0.42, z: 0.19, rx: PI / 2 - 0.5 });
    const tete = atelier()
      .ovale(0.118, W, { y: 0.05, sx: 1.06, sy: 0.92 }, 16)
      .ovale(0.062, W, { y: -0.015, z: 0.12, sx: 0.82, sy: 0.66, sz: 1.55, rx: -0.12 }, 12)
      .ovale(0.042, CR, { y: -0.045, z: 0.1, sx: 0.85, sy: 0.5, sz: 1.3 }, 10)
      .ovale(0.021, P.noir, { y: 0.0, z: 0.215, sx: 1.25, sy: 0.85 }, 8)
      .ovale(0.012, R, { y: 0.118, z: 0.1, sx: 0.8, sy: 1.4, sz: 0.4, trait: false }, 6);
    for (const s of [-1, 1]) {
      tete.cone(0.04, 0.11, 5, W, { x: s * 0.1, y: -0.01, z: 0.0, rz: -s * (PI / 2 + 0.45) })
        .cone(0.03, 0.08, 5, W, { x: s * 0.093, y: -0.05, z: 0.03, rz: -s * (PI / 2 + 0.85) })
        .cone(0.058, 0.2, 8, W, { x: s * 0.07, y: 0.2, z: -0.02, sz: 0.5, rz: -s * 0.24, ry: s * 0.3 })
        .cone(0.038, 0.14, 8, R, { x: s * 0.074, y: 0.19, z: -0.003, sz: 0.3, rz: -s * 0.24, ry: s * 0.3, trait: false })
        .boite(0.05, 0.011, 0.01, R, { x: s * 0.093, y: 0.07, z: 0.08, rz: s * 0.6, ry: s * 0.62, trait: false });
    }
    const yeux = [-1, 1].map((s) => ({
      p: [s * 0.052, 0.052, 0.107], r: [0, s * 0.43, s * 0.32],
      a: atelier().piece(new THREE.CircleGeometry(0.024, 14), P.oeilBete, { sx: 1.5, sy: 0.85, trait: false })
        .piece(new THREE.CircleGeometry(0.008, 8), P.reflet, { x: s * 0.008, y: 0.006, z: 0.002, trait: false }),
    }));
    const patte = (avant) => {
      const a = atelier();
      if (avant) a.ovale(0.045, W, { y: -0.025, sy: 1.3, sz: 1.05 }, 10).cylindre(0.032, 0.027, 0.19, 8, W, { y: -0.11 }).ovale(0.037, CR, { y: -0.212, z: 0.014, sy: 0.6, sz: 1.3 }, 8);
      else a.ovale(0.062, W, { y: -0.03, sy: 1.3, sz: 1.1 }, 10).cylindre(0.027, 0.024, 0.2, 8, W, { y: -0.14, z: -0.02 }).ovale(0.033, CR, { y: -0.245, sy: 0.6, sz: 1.25 }, 8);
      return a;
    };
    // la queue en panache : grosse au milieu, pointue au bout (rouge), relevée derrière
    const queue = atelier().piece(fuseau(THREE, [[0, 0, 0], [0, 0.02, -0.27], [0, 0.37, -0.3]], 0.11, (t) => (t < 0.58 ? 0.35 + 0.65 * Math.sin((t / 0.58) * (PI / 2)) : Math.max(0, Math.cos(((Math.min(1, t) - 0.58) / 0.42) * (PI / 2))) ** 0.7)), W, { teinte: (x, y) => (y > 0.27 ? R : W) });
    return {
      corps, tete: { p: [0, 0.48, 0.22], a: tete }, yeux, queue: { p: [0, 0.33, -0.22], a: queue },
      pattes: [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => ({ p: sz > 0 ? [sx * 0.065, 0.24, 0.15] : [sx * 0.075, 0.27, -0.14], a: patte(sz > 0) })),
      bascule: [0, 0],
      // (où vont ses accessoires : le tour du cou [centre, inclinaison, rayon], le devant du cou, le haut de la tête)
      // (Kon a déjà son collier rouge, son bavoir et son grelot : le foulard couvre le collier et pend devant le bavoir ;
      // le grand grelot remplace le sien)
      accessoires: {
        cou: { c: [0, 0.42, 0.19], rx: PI / 2 - 0.5, r: 0.082 }, devant: [0, 0.395, 0.272], crane: { p: [0, 0.16, -0.01], r: 0.112 }, foulard: '#2f6fb0',
        bandana: { r: 0.083, tube: 0.019 }, triangle: [0, 0.365, 0.302], triangleR: 0.07, collier: false, grelot: [0, 0.303, 0.288], grelotR: 0.04,
      },
    };
  },
  // Pon, le tanuki : rond, brun gris, la bande sombre des épaules, le masque noir autour des yeux et le museau
  // clair, le gros ventre (qu'il tambourine, comme dans les contes), la feuille sur la tête (celle qui lui sert à
  // se transformer), les pattes noires, la queue touffue au bout sombre
  pon({ THREE, atelier, P }) {
    const PI = Math.PI, B = P.tanuki, BC = P.tanukiClair, D = P.tanukiFonce, CR = P.tanukiCreme;
    const corps = atelier()
      .ovale(0.19, B, { y: 0.28, z: -0.02, sx: 0.95, sy: 0.9, sz: 1.1 }, 16)
      .ovale(0.15, P.tanukiVentre, { y: 0.255, z: 0.085, sx: 0.85, sy: 0.92, sz: 0.62 }, 14)
      .ovale(0.12, D, { y: 0.405, z: 0.04, sx: 1.25, sy: 0.38, sz: 0.75 }, 12)
      .ovale(0.085, B, { y: 0.41, z: 0.12, sy: 1.1 }, 10);
    const tete = atelier()
      .ovale(0.13, B, { y: 0.03, sx: 1.12, sy: 0.95 }, 16)
      .ovale(0.066, CR, { y: -0.02, z: 0.1, sx: 1.15, sy: 0.78, sz: 0.95 }, 12)
      .ovale(0.022, P.noir, { y: 0.005, z: 0.162, sx: 1.3, sy: 0.85 }, 8)
      .piece(new THREE.TorusGeometry(0.016, 0.0035, 3, 8, PI * 0.8), '#5a3a30', { y: -0.04, z: 0.158, rz: PI * 1.1, trait: false });
    for (const s of [-1, 1]) {
      tete.ovale(0.046, D, { x: s * 0.058, y: 0.022, z: 0.1, sx: 1.35, sz: 0.45, rz: -s * 0.45, ry: s * 0.45 }, 10)
        .ovale(0.022, CR, { x: s * 0.05, y: 0.08, z: 0.106, sy: 0.6, sz: 0.4 }, 8)
        .cone(0.04, 0.1, 5, BC, { x: s * 0.125, y: -0.03, z: 0.02, rz: -s * (PI / 2 + 0.5) })
        .ovale(0.045, D, { x: s * 0.088, y: 0.125, z: -0.02, sz: 0.45, rz: -s * 0.35 }, 10)
        .ovale(0.026, CR, { x: s * 0.088, y: 0.12, z: -0.004, sz: 0.3, rz: -s * 0.35, trait: false }, 8);
    }
    // la feuille, posée de travers sur la tête : sa nervure, sa queue
    tete.ovale(0.075, P.feuilleTanuki, { x: 0.02, y: 0.17, z: 0.01, sx: 0.6, sy: 0.12, sz: 1.4, rx: -0.3, ry: 0.45, rz: 0.2 }, 10)
      .boite(0.007, 0.008, 0.19, '#3f7a35', { x: 0.02, y: 0.181, z: 0.01, rx: -0.3, ry: 0.45, rz: 0.2, trait: false })
      .baton([0.067, 0.205, -0.08], [0.08, 0.235, -0.115], 0.006, '#3f7a35', 4, { trait: false });
    const yeux = [-1, 1].map((s) => ({
      p: [s * 0.058, 0.025, 0.122], r: [0, s * 0.42, 0],
      a: atelier().piece(new THREE.CircleGeometry(0.017, 12), P.oeilBete, { trait: false })
        .piece(new THREE.CircleGeometry(0.007, 8), P.reflet, { x: s * 0.006, y: 0.006, z: 0.002, trait: false }),
    }));
    const patte = (avant) => {
      const a = atelier();
      if (avant) a.cylindre(0.042, 0.038, 0.12, 8, D, { y: -0.06 }).ovale(0.042, D, { y: -0.14, z: 0.012, sy: 0.6, sz: 1.2 }, 8);
      else a.ovale(0.075, B, { y: -0.03, sy: 1.1 }, 10).cylindre(0.04, 0.036, 0.1, 8, D, { y: -0.12 }).ovale(0.044, D, { y: -0.17, z: 0.015, sy: 0.6, sz: 1.25 }, 8);
      return a;
    };
    const queue = atelier().piece(fuseau(THREE, [[0, 0, 0], [0, -0.07, -0.17], [0, -0.01, -0.3]], 0.078, (t) => (t < 0.7 ? 0.6 + 0.4 * Math.sin((t / 0.7) * (PI / 2)) : Math.max(0, Math.cos(((Math.min(1, t) - 0.7) / 0.3) * (PI / 2))) ** 0.6)), B, { teinte: (x, y, z) => (z < -0.24 ? D : B) });
    return {
      corps, tete: { p: [0, 0.47, 0.14], a: tete }, yeux, queue: { p: [0, 0.27, -0.2], a: queue },
      pattes: [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => ({ p: sz > 0 ? [sx * 0.09, 0.17, 0.12] : [sx * 0.1, 0.2, -0.11], a: patte(sz > 0) })),
      bascule: [0.11, -0.12],
      accessoires: { cou: { c: [0, 0.415, 0.105], rx: PI / 2 - 0.2, r: 0.1 }, devant: [0, 0.385, 0.2], crane: { p: [0, 0.155, -0.005], r: 0.125 }, foulard: '#c8302c' },
    };
  },
  // Chapu, la loutre de rivière (kawauso, qui se change elle aussi en humain dans les contes) : un long corps
  // souple brun, la gorge claire, la tête ronde et ses moustaches, de petites oreilles, des pattes palmées, la
  // grosse queue qui s'effile ; un foulard bleu à pois blancs noué au cou
  chapu({ THREE, atelier, P }) {
    const PI = Math.PI, B = P.loutre, D = P.loutreFonce, CR = P.loutreCreme, BL = P.foulard;
    const pois = (x, y, z) => (Math.floor(x * 70 + 50) % 3 === 0 && Math.floor(y * 70 + 50) % 2 === 0 ? P.foulardPois : BL);
    const corps = atelier()
      .ovale(0.11, B, { y: 0.16, z: -0.04, sx: 0.9, sy: 0.84, sz: 2.5 }, 16)
      .ovale(0.085, CR, { y: 0.15, z: 0.14, sx: 0.85, sy: 0.85, sz: 1.2 }, 12)
      .ovale(0.075, B, { y: 0.205, z: 0.245, sz: 1.15, rx: -0.45 }, 12)
      .piece(new THREE.TorusGeometry(0.072, 0.02, 6, 16), BL, { y: 0.215, z: 0.25, rx: PI / 2 - 0.45 })
      .piece(new THREE.ConeGeometry(0.07, 0.11, 3), BL, { y: 0.15, z: 0.31, rx: PI + 0.35, sz: 0.3, teinte: pois })
      .ovale(0.024, BL, { y: 0.255, z: 0.18, sx: 1.4 }, 8);
    const tete = atelier()
      .ovale(0.088, B, { y: 0.0, sx: 1.12, sy: 0.88, sz: 1.05 }, 14)
      .ovale(0.058, CR, { y: -0.028, z: 0.07, sx: 1.35, sy: 0.7, sz: 0.9 }, 12)
      .ovale(0.02, P.noir, { y: -0.004, z: 0.12, sx: 1.4, sy: 0.85, sz: 0.7 }, 8)
      .piece(new THREE.TorusGeometry(0.014, 0.003, 3, 8, PI * 0.8), '#5a3a30', { y: -0.042, z: 0.118, rz: PI * 1.1, trait: false });
    for (const s of [-1, 1]) {
      tete.ovale(0.022, D, { x: s * 0.08, y: 0.045, z: -0.025, sz: 0.55 }, 8);
      // les moustaches, de chaque côté du museau
      for (const k of [-1, 0, 1]) tete.baton([s * 0.045, -0.02 + k * 0.008, 0.1], [s * 0.14, -0.012 + k * 0.022, 0.085], 0.0022, P.moustache, 3, { trait: false });
    }
    const yeux = [-1, 1].map((s) => ({
      p: [s * 0.044, 0.028, 0.077], r: [-0.3, s * 0.48, 0],
      a: atelier().piece(new THREE.CircleGeometry(0.016, 12), P.oeilBete, { trait: false })
        .piece(new THREE.CircleGeometry(0.006, 8), P.reflet, { x: s * 0.005, y: 0.005, z: 0.002, trait: false }),
    }));
    const patte = (avant) => {
      const a = atelier();
      if (avant) a.ovale(0.031, B, { y: -0.03, sy: 1.5 }, 8).ovale(0.033, D, { y: -0.088, z: 0.012, sx: 1.1, sy: 0.6, sz: 1.25 }, 8);
      else a.ovale(0.055, B, { y: -0.01 }, 10).ovale(0.04, D, { y: -0.1, z: 0.03, sx: 1.2, sy: 0.45, sz: 1.55 }, 8);
      return a;
    };
    const queue = atelier().piece(fuseau(THREE, [[0, 0, 0], [0, -0.05, -0.2], [0, -0.09, -0.4]], 0.075, (t) => 1 - 0.85 * t), B, { teinte: (x, y, z) => (z < -0.3 ? D : B) });
    return {
      corps, tete: { p: [0, 0.25, 0.32], a: tete }, yeux, queue: { p: [0, 0.15, -0.3], a: queue },
      pattes: [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => ({ p: sz > 0 ? [sx * 0.07, 0.11, 0.16] : [sx * 0.08, 0.12, -0.2], a: patte(sz > 0) })),
      bascule: [0.06, -0.2],
      // (Chapu a déjà son foulard bleu : le foulard jaune le recouvre, le grelot y est pendu)
      accessoires: {
        cou: { c: [0, 0.215, 0.25], rx: PI / 2 - 0.45, r: 0.072 }, devant: [0, 0.2, 0.322], crane: { p: [0, 0.075, -0.01], r: 0.085 }, foulard: '#e8b941',
        bandana: { r: 0.072, tube: 0.023 }, triangle: [0, 0.15, 0.314], triangleR: 0.075, collier: false, grelot: [0, 0.125, 0.337], grelotR: 0.028,
      },
    };
  },
  // ---- Les trois compagnons secrets (2026-10-23 : on les achète au marchand avec les koban des secrets)
  // Gao, le shisa : le lion-chien gardien des toits d'Okinawa, en terre cuite vernissée orange ; la crinière en boucles
  // autour de la face et sur la poitrine, la gueule ouverte et ses crocs (le gardien qui crie « a »), de gros yeux ronds
  // sous des sourcils bouclés, la queue en flamme bouclée
  gao({ THREE, atelier, P }) {
    const PI = Math.PI, O = P.shisa, OF = P.shisaFonce, CR = P.shisaCreme;
    const boucle = (a, x, y, z, r, o = {}) => a.piece(new THREE.TorusGeometry(r, r * 0.42, 6, 14), OF, { x, y, z, ...o });
    const corps = atelier()
      .ovale(0.16, O, { y: 0.29, z: -0.02, sx: 0.86, sy: 0.8, sz: 1.35 }, 16)
      .ovale(0.12, CR, { y: 0.25, z: 0.06, sx: 0.72, sy: 0.66, sz: 0.95 }, 12)
      .ovale(0.115, O, { y: 0.37, z: 0.14, sx: 1.0, sy: 1.1, sz: 0.9 }, 12);
    for (let k = 0; k < 9; k++) {
      const t = (k / 8 - 0.5) * 2.6;
      boucle(corps, Math.sin(t) * 0.118, 0.43 + Math.cos(t) * 0.03, 0.15 + Math.cos(t) * 0.07, 0.032, { ry: t, rx: 0.3 });
    }
    for (const z of [0.0, -0.1, -0.2]) boucle(corps, 0, 0.405, z, 0.03, { rx: PI / 2 });
    const tete = atelier()
      .ovale(0.13, O, { y: 0.04, sx: 1.12, sy: 0.96 }, 16)
      .ovale(0.075, CR, { y: -0.025, z: 0.1, sx: 1.3, sy: 0.75, sz: 0.95 }, 12)
      .ovale(0.03, '#3a2a28', { y: 0.015, z: 0.178, sx: 1.45, sy: 0.8 }, 8)
      .ovale(0.052, '#7a1c1c', { y: -0.058, z: 0.135, sx: 1.25, sy: 0.55, sz: 0.55 }, 10)
      .ovale(0.028, '#d8605a', { y: -0.07, z: 0.152, sx: 1.3, sy: 0.5, sz: 0.5, trait: false }, 8);
    for (const s of [-1, 1]) {
      tete.cone(0.012, 0.032, 5, '#fbf6ea', { x: s * 0.036, y: -0.04, z: 0.168, rx: PI, trait: false })
        .cone(0.011, 0.026, 5, '#fbf6ea', { x: s * 0.03, y: -0.09, z: 0.158, trait: false })
        .piece(new THREE.TorusGeometry(0.03, 0.012, 5, 12, PI * 1.4), OF, { x: s * 0.06, y: 0.118, z: 0.088, rz: s > 0 ? -0.3 : PI + 0.3 })
        .ovale(0.04, OF, { x: s * 0.118, y: 0.1, z: -0.02, sx: 0.5, sy: 0.9, rz: -s * 0.6 }, 8);
    }
    // la crinière autour de la face : des touffes, et sur chacune une boucle
    for (let k = 0; k < 12; k++) {
      const t = (k / 12) * 2 * PI;
      tete.boule(0.044, OF, { x: Math.sin(t) * 0.135, y: 0.035 + Math.cos(t) * 0.122, z: -0.04, sz: 0.7 }, 1);
      boucle(tete, Math.sin(t) * 0.142, 0.035 + Math.cos(t) * 0.128, -0.004, 0.02);
    }
    const yeux = [-1, 1].map((s) => ({
      p: [s * 0.058, 0.06, 0.12], r: [0, s * 0.4, 0],
      a: atelier().piece(new THREE.CircleGeometry(0.029, 14), '#fbf6ea', { trait: false })
        .piece(new THREE.CircleGeometry(0.018, 12), P.oeilBete, { y: -0.004, z: 0.001, trait: false })
        .piece(new THREE.CircleGeometry(0.006, 8), P.reflet, { x: s * 0.006, y: 0.002, z: 0.002, trait: false }),
    }));
    const patte = (avant) => {
      const a = atelier();
      if (avant) a.ovale(0.052, O, { y: -0.03, sy: 1.3 }, 10).cylindre(0.04, 0.036, 0.18, 8, O, { y: -0.12 }).ovale(0.046, CR, { y: -0.215, z: 0.018, sy: 0.6, sz: 1.25 }, 8);
      else a.ovale(0.075, O, { y: -0.03, sy: 1.25, sz: 1.1 }, 10).cylindre(0.036, 0.034, 0.17, 8, O, { y: -0.14 }).ovale(0.043, CR, { y: -0.236, z: 0.015, sy: 0.6, sz: 1.25 }, 8);
      return a;
    };
    const queue = atelier().piece(fuseau(THREE, [[0, 0, 0], [0, 0.22, -0.08], [0, 0.3, 0.05]], 0.058, (t) => 0.55 + 0.45 * Math.sin(Math.min(1, t) * PI)), O, { teinte: (x, y) => (y > 0.2 ? OF : O) })
      .boule(0.05, OF, { y: 0.3, z: 0.05 }, 1);
    for (const [y, z] of [[0.31, 0.07], [0.24, -0.07], [0.34, -0.01]]) boucle(queue, 0, y, z, 0.033, { ry: PI / 2 });
    return {
      corps, tete: { p: [0, 0.5, 0.21], a: tete }, yeux, queue: { p: [0, 0.33, -0.21], a: queue },
      pattes: [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => ({ p: sz > 0 ? [sx * 0.072, 0.24, 0.15] : [sx * 0.082, 0.27, -0.14], a: patte(sz > 0) })),
      bascule: [0, 0],
      accessoires: { cou: { c: [0, 0.432, 0.17], rx: PI / 2 - 0.45, r: 0.112 }, devant: [0, 0.405, 0.28], crane: { p: [0, 0.125, -0.035], r: 0.14 }, foulard: '#2f8a5a' },
    };
  },
  // Fuwa, le bébé dragon des mers (un petit Ryūjin) : un long corps blanc nacré qui ondule (des anneaux, animés par
  // creerCompagnon), le ventre crème, la crinière turquoise le long du dos, de petites cornes dorées, de longues
  // moustaches, quatre petites pattes griffues ; il flotte au-dessus du sol, une perle dans la patte avant droite
  fuwa({ THREE, atelier, P }) {
    const PI = Math.PI, W = P.dragon, CR = P.dragonCreme, T = P.dragonCrin, OR = P.dragonCorne;
    const Y = 0.42; // (la hauteur où il flotte)
    const corps = atelier()
      .ovale(0.085, W, { y: Y, z: 0.05, sx: 0.95, sy: 0.95, sz: 1.35 }, 14)
      .ovale(0.066, CR, { y: Y - 0.032, z: 0.07, sx: 0.8, sy: 0.6, sz: 1.2 }, 10)
      .cone(0.028, 0.085, 5, T, { y: Y + 0.088, z: 0.03, rx: -0.55 });
    // les anneaux du corps, de plus en plus fins jusqu'au bout de la queue (une flamme turquoise)
    const N = 7, anneaux = [];
    for (let i = 0; i < N; i++) {
      const r = 0.076 * (1 - i * 0.1), a = atelier().ovale(r, W, { sz: 1.35 }, 12).ovale(r * 0.75, CR, { y: -r * 0.38, sx: 0.8, sy: 0.6, sz: 1.25 }, 8);
      a.cone(r * 0.4, r * 1.05, 5, T, { y: r * 1.0, z: -0.01, rx: -0.6 });
      if (i === N - 1) for (const [rx, ry] of [[-1.35, 0], [-1.6, 0.5], [-1.6, -0.5], [-1.9, 0]]) a.cone(0.03, 0.13, 5, T, { z: -0.07, y: 0.01, rx, ry, ordre: 'YXZ' });
      anneaux.push({ p: [0, Y, -0.045 - i * 0.072], a });
    }
    const tete = atelier()
      .ovale(0.086, W, { y: 0.02, sx: 1.0, sy: 0.88, sz: 1.15 }, 14)
      .ovale(0.058, W, { y: -0.01, z: 0.085, sx: 1.05, sy: 0.72, sz: 1.15 }, 12)
      .ovale(0.04, CR, { y: -0.036, z: 0.092, sx: 1.1, sy: 0.45, sz: 1.1 }, 10)
      .piece(new THREE.TorusGeometry(0.018, 0.004, 3, 8, PI * 0.8), '#5a3a40', { y: -0.042, z: 0.146, rz: PI * 1.1, trait: false });
    for (const s of [-1, 1]) {
      tete.ovale(0.008, '#3a3040', { x: s * 0.022, y: 0.006, z: 0.152, trait: false }, 5)
        .baton([s * 0.035, 0.08, -0.02], [s * 0.06, 0.155, -0.075], 0.012, OR, 5)
        .baton([s * 0.05, 0.125, -0.05], [s * 0.088, 0.142, -0.03], 0.008, OR, 4)
        .baton([s * 0.036, -0.012, 0.13], [s * 0.12, -0.03, 0.16], 0.005, T, 4, { trait: false })
        .baton([s * 0.12, -0.03, 0.16], [s * 0.19, -0.085, 0.12], 0.004, T, 4, { trait: false })
        .cone(0.026, 0.06, 4, T, { x: s * 0.082, y: 0.045, z: -0.03, rz: -s * 1.2, sz: 0.4 });
    }
    for (const [y, z, rx] of [[0.075, -0.06, -0.9], [0.04, -0.09, -1.2], [0.0, -0.1, -1.5]]) tete.cone(0.03, 0.09, 5, T, { y, z, rx });
    const yeux = [-1, 1].map((s) => ({
      p: [s * 0.042, 0.04, 0.087], r: [-0.1, s * 0.48, 0],
      a: atelier().piece(new THREE.CircleGeometry(0.024, 14), P.oeilBete, { sy: 1.1, trait: false })
        .piece(new THREE.CircleGeometry(0.008, 8), P.reflet, { x: s * 0.007, y: 0.007, z: 0.002, trait: false })
        .piece(new THREE.CircleGeometry(0.004, 6), P.reflet, { x: -s * 0.008, y: -0.008, z: 0.002, trait: false }),
    }));
    // une petite patte à trois griffes ; perle : la perle des dragons, dans la patte
    const patte = (perle) => {
      const a = atelier().ovale(0.03, W, { y: -0.018, sy: 1.3 }, 8).cylindre(0.018, 0.016, 0.06, 6, W, { y: -0.06 }).ovale(0.022, CR, { y: -0.094, z: 0.01, sy: 0.7, sz: 1.1 }, 8);
      for (const k of [-1, 0, 1]) a.cone(0.006, 0.022, 4, OR, { x: k * 0.012, y: -0.1, z: 0.03, rx: PI / 2 + 0.4, trait: false });
      if (perle) a.boule(0.028, '#d8f0ff', { y: -0.105, z: 0.045, sorte: 'lumiere' }, 1);
      return a;
    };
    return {
      corps, tete: { p: [0, Y + 0.075, 0.15], a: tete }, yeux, queue: null, anneaux,
      // (les pattes de derrière tiennent au troisième anneau : elles suivent ses ondulations)
      pattes: [{ p: [-0.058, Y - 0.04, 0.08], a: patte(false) }, { p: [0.058, Y - 0.04, 0.08], a: patte(true) }, { p: [-0.05, -0.035, 0], a: patte(false), anneau: 3 }, { p: [0.05, -0.035, 0], a: patte(false), anneau: 3 }],
      bascule: [Y, 0], vol: true,
      accessoires: { cou: { c: [0, Y + 0.005, 0.075], rx: PI / 2 - 0.55, r: 0.07 }, devant: [0, Y - 0.04, 0.13], crane: { p: [0, 0.1, -0.025], r: 0.08 }, foulard: '#e889a8', triangleR: 0.05 },
    };
  },
  // Saya, l'esprit d'un vieil arbre (un kodama : dans les contes, c'est lui qui répond, en écho, dans la forêt) : un
  // petit bonhomme de bois clair veiné, une calotte de mousse et une pousse à deux feuilles sur la tête, une collerette de
  // feuilles, des bras de brindilles ; ses yeux brillent comme des lucioles. Il marche sur deux petites jambes de racines
  saya({ THREE, atelier, P }) {
    const PI = Math.PI, B = P.kodamaBois, BF = P.kodamaFonce, M = P.kodamaMousse, F = P.kodamaFeuille;
    // (les veines du bois : une bande sombre sur trois, le long des facettes)
    const veines = (x, y, z) => (Math.floor(((Math.atan2(x, z) + PI) / (2 * PI)) * 16) % 3 === 0 ? BF : B);
    const corps = atelier()
      .ovale(0.11, B, { y: 0.2, sx: 0.92, sy: 1.0, sz: 0.85, teinte: veines }, 16)
      .ovale(0.026, BF, { y: 0.19, z: 0.092, sz: 0.5, trait: false }, 8);
    for (let k = 0; k < 7; k++) {
      const t = (k / 7) * 2 * PI;
      corps.ovale(0.05, k % 2 ? F : M, { x: Math.sin(t) * 0.078, y: 0.298, z: Math.cos(t) * 0.07, sx: 0.55, sy: 0.18, sz: 1.2, ry: t, rx: 0.5, ordre: 'YXZ' }, 8);
    }
    const tete = atelier()
      .ovale(0.12, B, { y: 0.1, sx: 1.06, sy: 0.96, teinte: veines }, 16)
      .piece(new THREE.SphereGeometry(0.136, 16, 6, 0, 2 * PI, 0, PI * 0.4), M, { y: 0.105, rx: -0.15, deformer: (x, y, z) => { const b = 1 + 0.03 * (1 + Math.sin(x * 60) * Math.sin(z * 55)); return [x * b, y * b, z * b]; } })
      .ovale(0.016, '#5a3a2a', { y: 0.04, z: 0.116, sx: 1.4, sy: 0.7, sz: 0.5, trait: false }, 6)
      .baton([0, 0.22, -0.01], [0.012, 0.31, 0.0], 0.008, F, 5);
    for (const s of [-1, 1]) tete.ovale(0.04, F, { x: 0.012 + s * 0.036, y: 0.312, z: 0, sx: 1.4, sy: 0.15, sz: 0.65, rz: s * 0.45 }, 8);
    const yeux = [-1, 1].map((s) => ({
      p: [s * 0.044, 0.108, 0.112], r: [0, s * 0.36, 0],
      a: atelier().piece(new THREE.CircleGeometry(0.03, 14), '#3a4a2a', { trait: false })
        .piece(new THREE.CircleGeometry(0.022, 14), P.kodamaOeil, { z: 0.001, trait: false, sorte: 'lumiere' })
        .piece(new THREE.CircleGeometry(0.007, 8), P.reflet, { x: s * 0.006, y: 0.007, z: 0.002, trait: false }),
    }));
    const bras = () => atelier().cylindre(0.016, 0.013, 0.13, 6, BF, { y: -0.065 })
      .baton([0, -0.125, 0], [0.025, -0.16, 0.01], 0.007, BF, 4).baton([0, -0.125, 0], [-0.022, -0.158, 0.012], 0.007, BF, 4).baton([0, -0.125, 0], [0, -0.165, 0.026], 0.007, BF, 4)
      .ovale(0.022, F, { x: 0.012, y: -0.03, z: 0.014, sx: 0.5, sy: 1.2, sz: 0.15 }, 6);
    const jambe = () => atelier().cylindre(0.034, 0.04, 0.08, 8, B, { y: -0.04, teinte: veines }).ovale(0.042, BF, { y: -0.088, z: 0.015, sy: 0.55, sz: 1.3 }, 8);
    return {
      corps, tete: { p: [0, 0.31, 0.0], a: tete }, yeux, queue: null,
      pattes: [{ p: [-0.112, 0.27, 0.0], a: bras() }, { p: [0.112, 0.27, 0.0], a: bras() }, { p: [-0.05, 0.11, 0], a: jambe() }, { p: [0.05, 0.11, 0], a: jambe() }],
      bascule: [0.1, 0], bipede: true,
      accessoires: { cou: { c: [0, 0.312, 0.0], rx: PI / 2, r: 0.09 }, devant: [0, 0.29, 0.09], crane: { p: [0, 0.235, 0], r: 0.11 }, foulard: '#e8732e' },
    };
  },
};

/**
 * Un compagnon (FORMES), environ 0,5 m. Il trotte (la loutre bondit, le dos qui ondule ; Saya marche sur ses deux
 * jambes ; Fuwa flotte et ondule), s'assoit quand il attend (le tanuki sur son derrière, et de temps en temps il se
 * tambourine le ventre ; la loutre se dresse sur ses pattes arrière et regarde autour d'elle ; le shisa se tient droit
 * comme les gardiens des toits), cligne des yeux, s'ébroue en sortant de l'eau ; la loutre nage. Il danse avec le
 * voyageur (danser), et porte un accessoire acheté au marchand (porter : un foulard, un petit chapeau de paille, un
 * grelot). Renvoie { objet, espece, animer(dt, vitesse, temps, nage), secouer(), sauter(), danser(oui), porter(id) } ;
 * animer renvoie 1 ou −1 quand une paire de pattes se pose, sinon 0 (toujours 0 en nageant, et pour Fuwa qui vole).
 * o.tambour() : Pon se tape sur le ventre (pour le son).
 */
export function creerCompagnon(ctx, espece, o = {}) {
  const { THREE, atelier, maillage } = ctx;
  const PI = Math.PI, F = FORMES[espece](ctx);
  const racine = new THREE.Group(), bascule = new THREE.Group(), corps = new THREE.Group();
  const [by, bz] = F.bascule;
  bascule.position.set(0, by, bz);
  corps.position.set(0, -by, -bz);
  racine.add(bascule);
  bascule.add(corps);
  corps.add(maillage(F.corps.fin(0, false)));
  const tete = pivot(ctx, ...F.tete.p, maillage(F.tete.a.fin(0, false)));
  corps.add(tete);
  const yeux = F.yeux.map((y) => {
    const g = pivot(ctx, ...y.p, maillage(y.a.fin(0, false), false));
    g.rotation.set(...y.r);
    tete.add(g);
    return g;
  });
  // (Fuwa : les anneaux de son corps, qui ondulent)
  const anneaux = (F.anneaux || []).map((q) => { const g = pivot(ctx, ...q.p, maillage(q.a.fin(0, false))); corps.add(g); return { g, p: q.p }; });
  const pattes = F.pattes.map((q) => { const g = pivot(ctx, ...q.p, maillage(q.a.fin(0, false))); (q.anneau !== undefined ? anneaux[q.anneau].g : corps).add(g); return g; });
  const queue = F.queue ? pivot(ctx, ...F.queue.p, maillage(F.queue.a.fin(0, false))) : new THREE.Group();
  corps.add(queue);
  const cligner = cligneur(yeux);

  // ---- Les accessoires (tenues.js, place « compagnon ») : faits la première fois qu'on les porte
  const A = F.accessoires, accessoires = {};
  let accessoire = null;
  const FORMES_ACC = {
    // un foulard noué au cou, à pois blancs, sa pointe qui tombe devant
    // (A.bandana : son anneau { r, tube } ; A.triangle, A.triangleR : sa pointe, si le compagnon en a besoin d'autres)
    'cp-bandana'() {
      const a = atelier(), c = A.foulard, pois = (x, y, z) => (Math.floor(x * 90 + 50) % 3 === 0 && Math.floor(y * 90 + 50) % 3 === 0 && Math.floor(z * 90 + 50) % 2 === 0 ? '#fbf6ea' : c);
      const b = A.bandana || {}, t = A.triangle || [A.devant[0], A.devant[1] - 0.035, A.devant[2] + 0.01], tr = A.triangleR ?? 0.06;
      a.piece(new THREE.TorusGeometry(b.r ?? A.cou.r + 0.012, b.tube ?? 0.022, 6, 18), c, { x: A.cou.c[0], y: A.cou.c[1], z: A.cou.c[2], rx: A.cou.rx, teinte: pois })
        .piece(new THREE.ConeGeometry(tr, tr * 1.83, 3), c, { x: t[0], y: t[1], z: t[2], rx: PI + 0.35, sz: 0.3, teinte: pois });
      return { a, sur: corps };
    },
    // un petit chapeau de paille conique (comme ceux des statues de tanuki), ses rangs de paille
    'cp-chapeau'() {
      const a = atelier(), r = A.crane.r * 1.4;
      a.piece(new THREE.ConeGeometry(r, r * 0.42, 20, 2), '#e6c87a', { x: A.crane.p[0], y: A.crane.p[1] + r * 0.16, z: A.crane.p[2], rx: -0.12, teinte: (x, y, z) => (Math.floor(Math.hypot(x - A.crane.p[0], z - A.crane.p[2]) / (r * 0.18)) % 2 ? '#e6c87a' : '#c9a65a') })
        .boule(r * 0.08, '#c9a65a', { x: A.crane.p[0], y: A.crane.p[1] + r * 0.38, z: A.crane.p[2] - 0.004 }, 1);
      return { a, sur: tete };
    },
    // un collier rouge et un gros grelot doré (comme ceux des sanctuaires) ; A.collier false : il a déjà de quoi le
    // pendre (le collier de Kon, le foulard de Chapu) ; A.grelot, A.grelotR : où et de quelle taille
    'cp-grelot'() {
      const a = atelier(), g = A.grelot || [A.devant[0], A.devant[1] - 0.03, A.devant[2] + 0.012], gr = A.grelotR ?? 0.033, k = gr / 0.033;
      if (A.collier !== false) a.piece(new THREE.TorusGeometry(A.cou.r + 0.006, 0.011, 5, 18), '#d8302c', { x: A.cou.c[0], y: A.cou.c[1], z: A.cou.c[2], rx: A.cou.rx });
      a.boule(gr, '#e8b941', { x: g[0], y: g[1], z: g[2] }, 1)
        .boite(0.05 * k, 0.005 * k, 0.012 * k, '#7a5a20', { x: g[0], y: g[1] - 0.008 * k, z: g[2] + 0.028 * k, trait: false })
        .boule(0.008 * k, '#7a5a20', { x: g[0], y: g[1] - 0.018 * k, z: g[2] + 0.03 * k, trait: false }, 0);
      return { a, sur: corps };
    },
  };

  let phase = 0, assis = 1, foulee = 0, secousse = 0, saut = 0, tambour = 0, prochainTambour = 6 + Math.random() * 6, danse = false, tDanse = 0;
  const loutre = espece === 'chapu', tanuki = espece === 'pon', vol = !!F.vol, bipede = !!F.bipede;
  return {
    objet: racine,
    espece,
    /** Il s'ébroue (en sortant de l'eau). */
    secouer() { secousse = 1; },
    /** Un petit bond de joie (on vient de le choisir). */
    sauter() { saut = 1; },
    /** Il danse avec le voyageur (oui), en mesure (t0 : en battements). */
    danser(oui, t0 = 0) { danse = oui; tDanse = t0; },
    /** Porter l'accessoire id ('cp-bandana', 'cp-chapeau', 'cp-grelot' ; sinon rien de plus). */
    porter(id) {
      if (accessoire) accessoire.visible = false;
      accessoire = null;
      if (!FORMES_ACC[id] || !A) return;
      if (!accessoires[id]) {
        const { a, sur } = FORMES_ACC[id]();
        accessoires[id] = maillage(a.fin(0, false));
        sur.add(accessoires[id]);
      }
      accessoire = accessoires[id];
      accessoire.visible = true;
    },
    animer(dt, vitesse, temps, nage = false) {
      cligner(dt);
      const allure = nage ? 0 : Math.min(1, vitesse / 3);
      phase += dt * (nage ? 7 + vitesse * 1.5 : loutre ? 6 + vitesse * 2.6 : bipede ? 7 + vitesse * 3.4 : 6 + vitesse * 3);
      const f = Math.floor((phase - PI / 2) / PI);
      let pose = 0;
      if (f !== foulee) { foulee = f; if (allure > 0.3) pose = f & 1 ? -1 : 1; }
      // assis quand il attend (pas dans l'eau)
      assis += ((allure < 0.05 && !nage ? 1 : 0) - assis) * Math.min(1, dt * 4);
      const sw = Math.sin(phase) * (loutre ? 0.55 : tanuki ? 0.6 : bipede ? 0.75 : 0.7) * allure;
      const [ag, ad, rg, rd] = pattes;
      if (loutre) { ag.rotation.x = ad.rotation.x = sw; rg.rotation.x = rd.rotation.x = -sw; } // elle bondit : les pattes par paires
      else if (bipede) { rg.rotation.x = sw; rd.rotation.x = -sw; ag.rotation.x = -sw * 0.8; ad.rotation.x = sw * 0.8; } // il marche : bras et jambes opposés
      else { ag.rotation.x = rd.rotation.x = sw; ad.rotation.x = rg.rotation.x = -sw; } // ils trottent : en diagonale
      for (const p of pattes) p.rotation.z = 0;
      bascule.position.y = by;
      bascule.rotation.z = 0;
      bascule.rotation.y = 0;
      tete.rotation.set(0, 0, 0);
      queue.rotation.set(0, 0, 0);
      if (nage) {
        // la loutre nage : le corps à plat, la tête levée, les pattes qui pagaient, la queue qui ondule
        const p = Math.sin(phase * 1.4) * 0.6;
        bascule.rotation.x = -0.1;
        ag.rotation.x = rd.rotation.x = 0.6 + p;
        ad.rotation.x = rg.rotation.x = 0.6 - p;
        tete.rotation.x = -0.25;
        queue.rotation.y = Math.sin(temps * 5) * 0.35;
        corps.position.y = -by + Math.sin(temps * 3) * 0.01;
      } else if (vol) {
        // Fuwa flotte : il monte et descend doucement, son corps ondule (plus vite quand il avance), ses petites
        // pattes pagaient dans l'air ; au repos, il se penche un peu en arrière et regarde autour de lui
        bascule.rotation.x = -0.12 * assis + 0.1 * allure;
        corps.position.y = -by + 0.035 * Math.sin(temps * 2.1) + 0.04 * assis;
        const v = 2.6 + 4 * allure;
        anneaux.forEach(({ g, p }, i) => {
          const k = (i + 1) / anneaux.length;
          g.position.x = p[0] + (0.035 + 0.03 * allure) * Math.sin(temps * v - i * 0.85) * k;
          g.position.y = p[1] + 0.03 * Math.sin(temps * v * 0.8 - i * 0.9) * k;
          g.rotation.y = 0.5 * Math.cos(temps * v - i * 0.85) * k;
        });
        for (const [i, q] of pattes.entries()) q.rotation.x = 0.5 + 0.45 * Math.sin(temps * 6 + i * 1.7);
        tete.rotation.x = 0.15 * assis + Math.sin(temps * 1.3) * 0.06;
        tete.rotation.y = Math.sin(temps * 0.6) * 0.4 * assis;
        tete.rotation.z = Math.sin(temps * 1.1) * 0.08;
      } else if (bipede) {
        // Saya : il se dandine en marchant ; au repos, il s'assoit par terre, les jambes devant lui, et balance la tête
        bascule.rotation.z = Math.sin(phase) * 0.12 * allure;
        corps.position.y = -by + Math.abs(Math.cos(phase)) * 0.025 * allure - 0.085 * assis;
        rg.rotation.x += -1.35 * assis; rd.rotation.x += -1.35 * assis;
        ag.rotation.x += -0.35 * assis; ad.rotation.x += -0.35 * assis;
        ag.rotation.z = -0.25 * assis; ad.rotation.z = 0.25 * assis;
        tete.rotation.z = Math.sin(temps * 0.9) * 0.12 * assis;
        tete.rotation.x = Math.sin(temps * 1.3) * 0.04;
      } else if (loutre) {
        // debout sur ses pattes arrière quand elle attend, les pattes avant devant la poitrine ; en courant, le dos ondule
        bascule.rotation.x = -1.15 * assis + Math.sin(phase) * 0.14 * allure;
        rg.rotation.x += 1.15 * assis; rd.rotation.x += 1.15 * assis;
        ag.rotation.x += 0.75 * assis; ad.rotation.x += 0.75 * assis;
        tete.rotation.x = 1.0 * assis + Math.sin(temps * 1.3) * 0.05;
        tete.rotation.y = Math.sin(temps * 0.8) * 0.55 * assis;
        queue.rotation.x = 1.1 * assis;
        queue.rotation.y = Math.sin(temps * (2 + 5 * allure)) * (0.15 + 0.2 * allure);
        corps.position.y = -by + Math.abs(Math.cos(phase)) * 0.04 * allure;
      } else if (tanuki) {
        // le tanuki assis sur son derrière, droit comme les statues, les pattes arrière devant lui, celles de devant
        // sur le ventre ; il se dandine en marchant
        bascule.rotation.x = -0.62 * assis;
        bascule.rotation.z = Math.sin(phase) * 0.09 * allure;
        bascule.position.y = by - 0.1 * assis;
        corps.position.y = -by + Math.abs(Math.cos(phase)) * 0.03 * allure;
        rg.rotation.x -= 0.95 * assis; rd.rotation.x -= 0.95 * assis;
        rg.rotation.z = -0.45 * assis; rd.rotation.z = 0.45 * assis;
        ag.rotation.x -= 0.15 * assis; ad.rotation.x -= 0.15 * assis;
        ag.rotation.z = 0.2 * assis; ad.rotation.z = -0.2 * assis;
        tete.rotation.x = 0.5 * assis + Math.sin(temps * 1.3) * 0.04;
        tete.rotation.z = Math.sin(temps * 0.7) * 0.1 * assis;
        queue.rotation.y = Math.sin(temps * (2 + 4 * allure)) * (0.3 + 0.25 * allure);
        queue.rotation.x = 0.55 * assis;
        // Pon se tambourine le ventre de temps en temps (pon, poko, pon) ; pas en dansant
        if (assis > 0.9 && !danse) prochainTambour -= dt; else prochainTambour = Math.max(prochainTambour, 3);
        if (prochainTambour <= 0) { tambour = 1.2; prochainTambour = 9 + Math.random() * 8; }
        if (tambour > 0) {
          const avant = tambour;
          tambour = Math.max(0, tambour - dt);
          const coup = (u) => Math.max(0, Math.sin(u * PI * 2 * 2.5));
          ag.rotation.x = -0.75 - 0.4 * coup(tambour); ad.rotation.x = -0.75 - 0.4 * coup(tambour + 0.2);
          ag.rotation.z = 0.45; ad.rotation.z = -0.45;
          for (const t of [1.0, 0.8, 0.6, 0.4, 0.2]) if (avant > t && tambour <= t) o.tambour?.();
        }
      } else {
        // assis : l'arrière-train descend, les pattes avant tendues (le shisa, plus droit : un gardien)
        const droit = espece === 'gao' ? 1.25 : 1;
        bascule.rotation.x = -0.32 * assis * droit;
        corps.position.y = -by - 0.04 * assis + Math.abs(Math.cos(phase)) * 0.03 * allure;
        rg.rotation.x += 1.1 * assis; rd.rotation.x += 1.1 * assis;
        ag.rotation.x += 0.3 * assis * droit; ad.rotation.x += 0.3 * assis * droit;
        tete.rotation.x = 0.3 * assis * droit + Math.sin(temps * 1.3) * 0.04;
        tete.rotation.z = Math.sin(temps * 0.7) * 0.12 * assis;
        queue.rotation.y = Math.sin(temps * (2 + 4 * allure)) * (0.35 + 0.25 * allure);
        queue.rotation.x = 0.2 * assis;
      }
      // la danse : il saute en mesure, se balance, et tourne sur lui-même à la fin de chaque phrase
      if (danse) {
        tDanse += dt * (112 / 60);
        const b = tDanse, u = ((b % 16) + 16) % 16, rebond = Math.abs(Math.sin(PI * b));
        bascule.position.y += (vol ? 0.05 : 0.08) * rebond;
        bascule.rotation.z = 0.2 * Math.sin(PI * b * 0.5);
        tete.rotation.z = -0.25 * Math.sin(PI * b * 0.5);
        if (u >= 5.5 && u < 7.5) bascule.rotation.y = ((u - 5.5) / 2) * 2 * PI;
        if (tanuki) { ag.rotation.x = -0.75 - 0.4 * rebond; ad.rotation.x = -0.75 - 0.4 * (1 - rebond); }
        else if (loutre || bipede) { ag.rotation.x = -1.6 - 0.6 * rebond; ad.rotation.x = -1.6 - 0.6 * (1 - rebond); }
        queue.rotation.y = Math.sin(PI * b * 2) * 0.6;
      }
      // un bond de joie
      if (saut > 0) {
        saut = Math.max(0, saut - dt / 0.5);
        bascule.position.y = by + Math.sin((1 - saut) * PI) * 0.22;
      }
      // il s'ébroue : le corps tourne vite autour de son échine, d'un côté puis de l'autre, la tête plus fort
      corps.rotation.z = 0;
      if (secousse > 0) {
        secousse = Math.max(0, secousse - dt / 0.9);
        const s = Math.sin((1 - secousse) * 0.9 * 2 * PI * 8.6) * Math.sin(secousse * PI) * 0.45;
        corps.rotation.z = s;
        tete.rotation.z += s * 0.8;
        queue.rotation.y += s * 1.5;
      }
      return nage || vol ? 0 : pose;
    },
  };
}

/** Un daim sika (une biche ; le mâle a de petits bois). Il broute. Renvoie { objet, animer(dt, temps) }. */
export function creerDaim(ctx, male = false, decalage = 0) {
  const { THREE, atelier, P, maillage } = ctx;
  const racine = new THREE.Group();
  // (couché, la nuit : tout le corps descend, les pattes repliées dessous, dans le sol)
  const corps = new THREE.Group();
  racine.add(corps);
  const c = atelier()
    .ovale(0.3, P.daim, { y: 0.78, sx: 0.72, sy: 0.7, sz: 1.35 }, 14)
    .ovale(0.12, P.daimClair, { y: 0.82, z: -0.37, sx: 1.1, sz: 0.5 }, 10);
  for (const [x, z] of [[0.1, 0.15], [-0.11, 0.05], [0.12, -0.08], [-0.08, -0.2], [0.02, 0.25], [-0.14, 0.22], [0.15, -0.22]]) {
    c.ovale(0.028, P.daimClair, { x, y: 0.97, z, sy: 0.4, trait: false }, 6);
  }
  for (const [x, z] of [[-0.12, 0.25], [0.12, 0.25], [-0.12, -0.26], [0.12, -0.26]]) {
    c.cylindre(0.036, 0.028, 0.62, 6, P.daim, { x, y: 0.32, z }).ovale(0.035, P.noir, { x, y: 0.02, z: z + 0.01, sy: 0.6 }, 6);
  }
  corps.add(maillage(c.fin(0, false)));
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
  corps.add(cou);
  return {
    objet: racine,
    /** couche : 0 debout, 1 couché (la nuit ; il somnole, la tête tournée sur le côté). */
    animer(dt, temps, couche = 0) {
      // il broute : le cou descend, reste, remonte ; une oreille qui bouge
      const cycle = (temps * 0.25 + decalage) % 1;
      const bas = cycle < 0.45 ? Math.min(1, cycle / 0.08) : Math.max(0, 1 - (cycle - 0.45) / 0.1);
      corps.position.y = -0.57 * couche;
      cou.rotation.x = (1.85 * bas + Math.sin(temps * 3 + decalage * 7) * 0.03 * bas) * (1 - couche) + (0.75 + Math.sin(temps * 0.6 + decalage * 4) * 0.04) * couche;
      cou.rotation.y = 0.25 * Math.sin(temps * 0.4 + decalage * 5) * (1 - bas) * (1 - couche) + (decalage > 0.45 ? 0.6 : -0.6) * couche;
    },
  };
}

/**
 * Bunbuku, le marchand ambulant (2026-10-23) : un vieux tanuki debout, gros ventre et grand chapeau de paille comme les
 * statues de Shigaraki, la bouteille de saké dans une main, son livre de comptes dans l'autre ; sur le dos, la boîte
 * à tiroirs des colporteurs et son fanion « 小判 » (il n'accepte que les koban). Son nom vient du conte de la bouilloire
 * enchantée (Bunbuku chagama). Environ 1,35 m. Il se dandine, respire, lève sa bouteille de temps en temps, cligne des
 * yeux et regarde qui s'approche. Renvoie { objet, animer(dt, temps, vers) (vers : l'angle du joueur, ou null), saluer() }.
 */
export function creerMarchand(ctx) {
  const { THREE, atelier, maillage } = ctx;
  const PI = Math.PI, BR = '#8f6f50', FO = '#4a3a30', CR = '#efe3cc', VE = '#e6d2ae', IND = '#33456e', BOIS = '#b8875a';
  const racine = new THREE.Group(), corps = new THREE.Group();
  racine.add(corps);
  const c = atelier()
    .ovale(0.075, FO, { x: -0.12, y: 0.05, z: 0.05, sy: 0.6, sz: 1.3 }, 10).ovale(0.075, FO, { x: 0.12, y: 0.05, z: 0.05, sy: 0.6, sz: 1.3 }, 10)
    .cylindre(0.075, 0.08, 0.2, 10, FO, { x: -0.12, y: 0.15 }).cylindre(0.075, 0.08, 0.2, 10, FO, { x: 0.12, y: 0.15 })
    .ovale(0.3, BR, { y: 0.52, sx: 1.05, sy: 1.08, sz: 0.92 }, 18)
    .ovale(0.22, FO, { y: 0.8, z: -0.02, sx: 1.2, sy: 0.4, sz: 0.85 }, 14)
    // le gilet indigo sans manches, ouvert sur le ventre
    .piece(new THREE.CylinderGeometry(0.27, 0.315, 0.32, 22, 1, true, 0.85, 2 * PI - 1.7), IND, { y: 0.7, sz: 0.95, teinte: (x, y) => (y > 0.84 ? '#f3efe4' : IND) })
    // la queue touffue, au bout sombre
    .ovale(0.11, BR, { y: 0.24, z: -0.3, sx: 0.8, sy: 0.7, sz: 1.5, rx: 0.6 }, 10).ovale(0.07, FO, { y: 0.16, z: -0.44, sx: 0.85, sz: 1.2, rx: 0.6 }, 8);
  // la boîte à tiroirs sur le dos, son petit toit, ses bretelles ; le fanion « 小判 »
  c.boite(0.5, 0.62, 0.3, BOIS, { y: 0.75, z: -0.42 })
    .pignon(0.6, 0.12, 0.38, '#6a4a30', { y: 1.06, z: -0.42 });
  // ses tiroirs, au dos : trois rangs de deux, chacun sa poignée de laiton
  for (const y of [0.55, 0.74, 0.93]) {
    for (const x of [-0.115, 0.115]) c.boite(0.2, 0.15, 0.02, '#9a6a42', { x, y, z: -0.575 }).boule(0.014, '#e8b941', { x, y, z: -0.59, trait: false }, 0);
  }
  for (const s of [-1, 1]) {
    c.baton([s * 0.14, 1.0, -0.3], [s * 0.18, 0.86, -0.12], 0.025, '#6a4a30', 5);
    for (const y of [0.53, 0.68, 0.83, 0.98]) c.boule(0.016, '#e8b941', { x: s * 0.12, y, z: -0.265, trait: false }, 0);
  }
  c.baton([0.2, 1.05, -0.5], [0.2, 1.62, -0.52], 0.012, '#6a4a30', 5)
    .boite(0.004, 0.16, 0.26, '#c8302c', { x: 0.2, y: 1.5, z: -0.39 })
    .boite(0.006, 0.09, 0.09, '#fbf6ea', { x: 0.2, y: 1.5, z: -0.35, trait: false });
  corps.add(maillage(c.fin(0, false)));
  // le gros ventre (à part : il respire)
  const ventre = maillage(atelier().ovale(0.25, VE, { z: 0.1, sx: 0.92, sy: 0.95, sz: 0.75 }, 16).fin(0, false));
  ventre.position.y = 0.47;
  corps.add(ventre);
  // les bras : la bouteille de saké (tokkuri) dans la main gauche, le livre de comptes dans la droite
  const bras = [-1, 1].map((s) => {
    const a = atelier().cylindre(0.065, 0.058, 0.3, 10, FO, { y: -0.13 }).ovale(0.07, FO, { y: -0.3, sy: 0.9 }, 10);
    if (s > 0) {
      a.baton([0, -0.33, 0.04], [0, -0.42, 0.05], 0.008, '#c8302c', 4, { trait: false })
        .ovale(0.075, '#efe6cf', { y: -0.5, z: 0.06, sy: 1.15 }, 12).cylindre(0.022, 0.03, 0.08, 10, '#efe6cf', { y: -0.4, z: 0.06 })
        .boite(0.07, 0.06, 0.005, '#3a3236', { y: -0.5, z: 0.137, trait: false });
    } else a.boite(0.03, 0.22, 0.16, '#f3ead8', { y: -0.32, z: 0.08, rx: -0.2 }).boite(0.032, 0.05, 0.162, '#3f6aa0', { y: -0.22, z: 0.06, rx: -0.2, trait: false });
    const b = pivot(ctx, s * 0.3, 0.72, 0.02, maillage(a.fin(0, false)));
    b.rotation.z = s * 0.35;
    b.rotation.x = -0.25;
    corps.add(b);
    return b;
  });
  // la tête : la face claire, le masque sombre autour des yeux, les gros sourcils blancs d'un vieux tanuki, le grand
  // chapeau de paille (kasa) et sa jugulaire
  const t = atelier()
    .ovale(0.22, BR, { y: 0.1, sx: 1.12, sy: 0.95 }, 18)
    .ovale(0.11, CR, { y: 0.04, z: 0.17, sx: 1.25, sy: 0.75, sz: 0.85 }, 12)
    .ovale(0.036, '#2a2224', { y: 0.085, z: 0.268, sx: 1.3, sy: 0.85 }, 8)
    .piece(new THREE.TorusGeometry(0.034, 0.007, 3, 10, PI * 0.8), '#5a3a30', { y: 0.0, z: 0.262, rz: PI * 1.1, trait: false })
    .cone(0.03, 0.08, 5, '#f4efe6', { y: -0.04, z: 0.22, rx: PI - 0.4 });
  for (const s of [-1, 1]) {
    t.ovale(0.075, FO, { x: s * 0.085, y: 0.12, z: 0.15, sx: 1.25, sz: 0.5, rz: -s * 0.4, ry: s * 0.45 }, 10)
      .ovale(0.042, '#f4efe6', { x: s * 0.09, y: 0.215, z: 0.17, sx: 1.4, sy: 0.55, sz: 0.5, rz: s * 0.2 }, 8)
      .ovale(0.065, FO, { x: s * 0.17, y: 0.27, z: -0.03, sz: 0.45, rz: -s * 0.4 }, 8)
      .baton([s * 0.2, 0.05, 0.02], [s * 0.05, -0.1, 0.15], 0.006, '#e9dcb8', 4, { trait: false });
  }
  t.piece(new THREE.ConeGeometry(0.44, 0.16, 26, 2), '#e6c87a', { y: 0.37, z: -0.01, rx: -0.12, teinte: (x, y, z) => (Math.floor(Math.hypot(x, z + 0.01) / 0.055) % 2 ? '#e6c87a' : '#c9a65a') })
    .boule(0.03, '#c9a65a', { y: 0.46, z: -0.02 }, 1);
  const tete = pivot(ctx, 0, 0.92, 0.06, maillage(t.fin(0, false)));
  corps.add(tete);
  const yeux = [-1, 1].map((s) => {
    const a = atelier().piece(new THREE.CircleGeometry(0.022, 12), '#1e1418', { trait: false }).piece(new THREE.CircleGeometry(0.007, 8), '#ffffff', { x: s * 0.006, y: 0.007, z: 0.001, trait: false });
    const g = pivot(ctx, s * 0.085, 0.13, 0.205, maillage(a.fin(0, false), false));
    g.rotation.set(-0.15, s * 0.4, 0);
    tete.add(g);
    return g;
  });
  const cligner = cligneur(yeux);
  let salut = 0, bouteille = 7, regard = 0;
  return {
    objet: racine,
    saluer() { salut = 1; },
    animer(dt, temps, vers = null) {
      cligner(dt);
      corps.rotation.z = Math.sin(temps * 1.1) * 0.035;
      ventre.scale.set(1 + Math.sin(temps * 1.6) * 0.015, 1 + Math.sin(temps * 1.6) * 0.02, 1);
      // de temps en temps, il lève sa bouteille de saké (et la redescend)
      bouteille -= dt;
      if (bouteille < -1.6) bouteille = 8 + Math.random() * 6;
      const leve = bouteille < 0 ? Math.sin((-bouteille / 1.6) * PI) : 0;
      bras[1].rotation.x = -0.25 - 1.2 * leve;
      salut = Math.max(0, salut - dt * 0.9);
      corps.rotation.x = Math.sin(Math.min(1, salut) * PI) * 0.35;
      // il tourne la tête vers le voyageur qui s'approche
      regard += ((vers === null ? 0 : Math.max(-0.9, Math.min(0.9, vers))) - regard) * Math.min(1, dt * 3);
      tete.rotation.y = regard + Math.sin(temps * 0.4) * 0.06;
      tete.rotation.x = -0.05 + leve * -0.12;
    },
  };
}
