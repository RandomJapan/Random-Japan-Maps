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
/**
 * Le mino (蓑) : la cape de paille des paysans de la montagne contre la pluie et la neige (Gokayama, 2026-10-23), sur
 * les épaules et le dos, en trois rangs de paille qui se recouvrent comme des tuiles, le bas effiloché ; ouverte
 * devant (les bras en sortent) ; un col de corde tressée, noué devant. Dans l'atelier a, autour d'un buste dont les
 * épaules sont à la hauteur y (0,78 pour le voyageur), plus large de k.
 */
export function capeMino(THREE, a, { y = 0.78, k = 1 } = {}) {
  const PI = Math.PI, PA = '#c9a65a', PB = '#a8874a', PC = '#d9bd78';
  const paille = (c1, c2, n) => (x, py, z) => (Math.floor(((Math.atan2(x, z) + PI) / (2 * PI)) * n + Math.sin(py * 40) * 0.3) % 2 ? c1 : c2);
  // (de bas en haut : chaque rang par-dessus le haut du précédent, plus large que lui là où ils se recouvrent)
  for (const [y0, y1, r0, r1, n] of [[-0.48, -0.18, 0.37, 0.27, 46], [-0.32, -0.08, 0.335, 0.25, 42], [-0.18, 0.01, 0.3, 0.21, 36]]) {
    const h = y1 - y0;
    const effiloche = (x, py, z) => [x, py + (py < -h / 2 + 0.001 ? -0.035 * (0.5 + 0.5 * Math.sin(Math.atan2(x, z) * 23)) : 0), z];
    a.piece(new THREE.CylinderGeometry(r1 * k, r0 * k, h, n, 3, true, PI - 1.95, 3.9), PA, { y: y + (y0 + y1) / 2, deformer: effiloche, teinte: paille(PA, PB, n) })
      // l'envers (vu par devant, sous les bras) : le même rang, retourné, un rien plus petit
      .piece(new THREE.CylinderGeometry(r1 * k - 0.012, r0 * k - 0.012, h, n, 1, true, PI - 1.95, 3.9), PB, { y: y + (y0 + y1) / 2, sx: -1, trait: false });
  }
  a.piece(new THREE.TorusGeometry(0.2 * k, 0.022, 5, 22), PC, { y: y - 0.005, rx: PI / 2, teinte: (x, py, z) => (Math.floor(Math.atan2(x, z) * 9) % 2 ? PC : PB) });
  for (const s of [-1, 1]) a.baton([s * 0.03, y - 0.015, 0.2 * k], [s * 0.05, y - 0.12, 0.215 * k], 0.009, PB, 4);
  return a;
}

/**
 * Une plume de cormoran (鵜, Udo, 2026-10-31) dans l'atelier a : une lame qui s'amincit en pointe, de base (la hampe) à
 * pointe, sa face vers normale ; bombée de bombe (en m, au milieu), roulée de roulis autour de sa longueur (deux voisines
 * qui se recouvrent ne sont pas dans le même plan) ; c, sa couleur ; bout, celle de son bout, après finBout (de 0 à 1 : les
 * plumes du dos du cormoran sont bronze, bordées de noir) ; rachis : la tige claire sur le dessus ; profil : sa largeur à chaque
 * rang de sommets, de la hampe à la pointe. Le toit de la hutte d'Udo, ses plumes à ramasser, la cape.
 */
export function plumeCormoran(THREE, a, { base, pointe, normale, large, epais = 0.012, c, bout = null, finBout = 0.64, roulis = 0, bombe = 0, rachis = false, trait = true, profil = [0.34, 1, 0.78, 0.1] }) {
  const B = new THREE.Vector3(...base), Y = new THREE.Vector3(...pointe).sub(B), l = Y.length();
  Y.normalize();
  const N = new THREE.Vector3(...normale), Z = N.clone().addScaledVector(Y, -N.dot(Y)).normalize();
  if (roulis) Z.applyAxisAngle(Y, roulis);
  const X = new THREE.Vector3().crossVectors(Y, Z), base4 = new THREE.Matrix4().makeBasis(X, Y, Z);
  // (u : 0 à la hampe, 1 à la pointe ; la largeur à chaque rang de sommets, profil : par défaut, la hampe étroite, le plus large
  // au premier tiers, la pointe ; bombée au milieu, vers le dehors)
  const n = profil.length - 1;
  const forme = (g, largeur) => {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = p.getY(i) / l + 0.5;
      p.setXYZ(i, p.getX(i) * (largeur ? profil[Math.round(u * n)] : 1), p.getY(i), p.getZ(i) + bombe * Math.sin(Math.PI * Math.min(1, Math.max(0, u))));
    }
    return g.applyMatrix4(base4).translate(B.x + (Y.x * l) / 2, B.y + (Y.y * l) / 2, B.z + (Y.z * l) / 2);
  };
  const le = (x, y, z) => ((x - B.x) * Y.x + (y - B.y) * Y.y + (z - B.z) * Y.z) / l;
  a.piece(forme(new THREE.BoxGeometry(large, l, epais, 1, n, 1), true), c, { nuance: 0.04, trait, teinte: bout ? (x, y, z) => (le(x, y, z) > finBout ? bout : c) : undefined });
  // (la tige : posée sur le dessus, de la hampe aux 86 %)
  if (rachis) a.piece(forme(new THREE.BoxGeometry(0.009, l * 0.86, 0.008, 1, 3, 1).translate(0, -0.07 * l, epais / 2 + 0.004), false), '#d8d2c0', { nuance: 0, trait: false });
  return a;
}

/**
 * La cape en plumes de cormoran (Udo, 2026-10-31 : la récompense de ses tampons, choisie par le propriétaire : « La cape en
 * plumes de cormoran ») : sur les épaules et le dos, quatre rangs de plumes qui se recouvrent comme des écailles, bronze
 * bordées de noir (le dos du cormoran, le 鵜 qui a donné son nom à Udo), le plus haut par-dessus le suivant ; un col de petites
 * plumes blanches (les joues blanches du cormoran) ; dessous, une doublure sombre. Ouverte devant (les bras en sortent), comme
 * le mino, autour d'un buste aux épaules à la hauteur y, plus large de k. Les deux rangs du bas en six morceaux qui s'écartent
 * quand on court (animerCape) : ourlet, [{ a (dans le repère de son pivot), pivot: [x, y, z], axe: [x, y, z], t }] ; le reste,
 * haut (un atelier). Les angles : t depuis l'avant (x = r sin t, z = r cos t), la cape de t0 à t1, le dos en π. (Sans tige
 * blanche sur chaque plume : soixante tiges faisaient des rayures, comme une pomme de pin, 2026-10-31.)
 */
export function capeCormoran(THREE, atelier, { y = 0.8, k = 1 } = {}) {
  const PI = Math.PI, t0 = PI - 1.95, t1 = PI + 1.95;
  const BRONZE = ['#6b5a3a', '#5e5034', '#73603e', '#52492f'], NOIR = '#29271f', BLANC = '#f3f0e6', BLANC2 = '#dcd6c6';
  // le rayon de la cape à la hauteur yy (évasée vers le bas, comme le mino) ; chaque rang 1,5 cm au-dessus du précédent
  const r = (yy) => (0.212 + (y - yy) * 0.36) * k;
  const hasardP = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const haut = atelier(), ourlet = [];
  // les rangs, du bas vers le haut : [pointe, base, largeur, nombre]
  const RANGS = [[y - 0.46, y - 0.25, 0.104, 16], [y - 0.36, y - 0.16, 0.1, 15], [y - 0.25, y - 0.07, 0.094, 14], [y - 0.15, y + 0.005, 0.086, 13]];
  // (le pivot de l'ourlet, les deux rangs du bas : à la hauteur des pointes du troisième rang, sur la ligne des plumes du
  // deuxième ; ce qui est au-dessus, sous le troisième rang, rentre un peu quand le bas s'écarte : la doublure du bas est plus
  // en dedans)
  const [yt1, yb1] = RANGS[1], yp = RANGS[2][0] + 0.012, rp = r(yb1) + 0.015 + (r(yt1) + 0.012 - r(yb1)) * ((yb1 - yp) / (yb1 - yt1));
  RANGS.forEach(([yt, yb, large, n], i) => {
    const dr = 0.015 * i, morceaux = i <= 1 ? 6 : 1;
    for (let j = 0; j < n; j++) {
      const t = t0 + ((j + 0.5) / n) * (t1 - t0), s = Math.sin(t), c = Math.cos(t);
      const rb = r(yb) + dr, rt = r(yt) + dr + 0.012;
      const plume = {
        base: [rb * s, yb, rb * c], pointe: [rt * s, yt, rt * c], normale: [s, 0.36, c], large: large * k, epais: 0.011, c: BRONZE[Math.floor(hasardP(i * 31 + j) * 4)],
        bout: NOIR, finBout: 0.7, roulis: (j % 2 ? 0.09 : -0.09), bombe: 0.007,
      };
      if (morceaux === 1) { plumeCormoran(THREE, haut, plume); continue; }
      // (les deux rangs du bas : en six morceaux, chacun son pivot au milieu du morceau ; il tourne autour de la tangente : les
      // pointes s'écartent vers le dehors)
      const m = Math.floor((j / n) * morceaux);
      if (!ourlet[m]) {
        const tm = t0 + ((m + 0.5) / morceaux) * (t1 - t0);
        ourlet[m] = { a: atelier(), pivot: [rp * Math.sin(tm), yp, rp * Math.cos(tm)], axe: [-Math.cos(tm), 0, Math.sin(tm)], t: tm };
      }
      const o = ourlet[m], [px, py, pz] = o.pivot;
      plumeCormoran(THREE, o.a, { ...plume, base: [plume.base[0] - px, plume.base[1] - py, plume.base[2] - pz], pointe: [plume.pointe[0] - px, plume.pointe[1] - py, plume.pointe[2] - pz] });
    }
  });
  // le col : de petites plumes blanches tout autour du cou (sauf devant), par-dessus le haut du dernier rang
  for (let j = 0; j < 16; j++) {
    const t = PI - 2.3 + ((j + 0.5) / 16) * 4.6, s = Math.sin(t), c = Math.cos(t), rb = 0.168 * k, rt = 0.206 * k;
    plumeCormoran(THREE, haut, { base: [rb * s, y + 0.045, rb * c], pointe: [rt * s, y - 0.05, rt * c], normale: [s, 0.9, c], large: 0.062 * k, epais: 0.01, c: BLANC, bout: BLANC2, roulis: j % 2 ? 0.1 : -0.1, bombe: 0.005 });
  }
  // la doublure sombre (vue par devant, sous les bras) : deux bandes de cône tournées vers l'intérieur, un rien en dedans des
  // plumes ; la basse avec l'ourlet (dans le morceau du milieu, elle ne bouge pas : l'ourlet s'écarte d'elle)
  const DOUBLURE = '#23282a';
  for (const [ya, yb, dedans] of [[y - 0.2, y + 0.01, 0.012], [y - 0.44, y - 0.18, 0.05]]) {
    const h = yb - ya;
    haut.piece(new THREE.CylinderGeometry(r(yb) - dedans, r(ya) - dedans, h, 26, 1, true, t0, t1 - t0), DOUBLURE, { y: (ya + yb) / 2, sx: -1, trait: false });
  }
  return { haut, ourlet };
}

/**
 * Le collier de magatama (勾玉, Takachiho, 2026-10-25) : les joyaux en forme de virgule des dieux du Japon (le collier
 * suspendu à l'arbre sacré devant la grotte d'Amaterasu, avec le miroir). Un cordon autour du cou qui retombe sur la
 * poitrine, des perles de cornaline et de cristal, trois magatama de jade, le plus grand au milieu. bas : la hauteur du bas
 * du cordon ; avant : son écart devant le buste ; rayon(y) : le rayon du buste à la hauteur y (le tee-shirt, le chemisier,
 * une tenue : un cylindre aplati devant, d'aplati).
 */
export function collierMagatama(THREE, a, { bas = 0.735, avant = 0.014, rayon = (y) => 0.15 + 0.022 * Math.min(1, Math.max(0, (0.8 - y) / 0.25)), aplati = 0.9 } = {}) {
  const PI = Math.PI, CORDE = '#7a2a24', JADE = '#3f9a64', JADE2 = '#6cc28a';
  // le devant du buste à la hauteur y, à l'écart x du milieu
  const buste = (x, y) => {
    const r = rayon(y);
    return aplati * r * Math.sqrt(Math.max(0, 1 - (x / r) ** 2));
  };
  // le point du cordon à l'angle t (0 : derrière la nuque, π : en bas, devant) : autour du cou (caché sous la grosse tête),
  // puis sur la poitrine en U, à avant du buste
  const point = (t) => {
    const c = Math.cos(t), devant = Math.max(0, -c), d2 = devant * devant;
    const x = Math.sin(t) * (0.1 - 0.045 * d2), y = 0.84 + (bas - 0.84) * d2;
    const derriere = -0.07 * Math.max(0, c), w = Math.min(1, Math.max(0, -c / 0.3));
    return [x, y, derriere * (1 - w) + (buste(x, y) + avant) * w];
  };
  const tour = [];
  for (let k = 0; k <= 32; k++) tour.push(point((k / 32) * 2 * PI));
  a.tube(tour, 0.0065, CORDE, { cotes: 5, pas: 64, trait: false });
  // les perles : cornaline (orangée) et cristal, de chaque côté, entre les petits magatama et le cou (devant les magatama,
  // elles les cachaient) ; le cordon nu de l'un à l'autre
  [0.86, 1.06, 1.26].forEach((e, k) => {
    for (const s of [-1, 1]) {
      const [x, y, z] = point(PI + s * e);
      a.boule(0.0095, k % 2 ? '#e8f2ee' : '#d8642a', { x, y, z: z + 0.003, trait: false }, 1);
    }
  });
  // les magatama : la forme des « virgules » du yin et du yang (une tête ronde, percée, et une queue qui s'effile en
  // s'enroulant), en jade poli (les bords arrondis), suspendus au cordon par leur trou ; le grand au milieu, un petit de
  // chaque côté, la queue tournée vers le milieu. (La première version, une virgule en tube vue de face avec un point
  // sombre, ressemblait à une petite grenouille verte.) En unités de u : haute de 3,9, large de 3, le trou en (0,1 ; 1).
  const contour = [];
  const arc = (cx, cy, r, a0, a1, n, depuis = 0) => { for (let k = depuis; k <= n; k++) { const t = a0 + ((a1 - a0) * k) / n; contour.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); } };
  // (le dos : le grand demi-cercle, du bout de la queue jusqu'en haut ; la tête, autour de son côté ; le creux : le
  // petit demi-cercle jusqu'au bout de la queue, émoussé, sinon l'arrondi des bords s'y croiserait)
  arc(0, 0, 2, -PI / 2 + 0.35, PI / 2, 16);
  arc(0, 1, 1, PI / 2, (3 * PI) / 2, 12, 1);
  arc(0, -1, 1, PI / 2, -PI / 2 + 0.5, 10, 1);
  const magatama = (x, y, z, u, sens, rz) => {
    const forme = new THREE.Shape(contour.map(([px, py]) => new THREE.Vector2(px * sens, py)));
    const trou = new THREE.Path();
    trou.absarc(0.1 * sens, 1, 0.48, 0, 2 * PI, true);
    forme.holes.push(trou);
    const g = new THREE.ExtrudeGeometry(forme, { depth: 0.6, bevelEnabled: true, bevelThickness: 0.32, bevelSize: 0.18, bevelSegments: 2, curveSegments: 10 });
    // (le trou sur le cordon : la forme se place sous lui, un peu devant, et le cordon passe derrière elle)
    g.translate(-0.1 * sens, -1, -0.3 + 0.62);
    a.piece(g, JADE, { x, y, z, rz, s: u, teinte: (px, py) => (py > y - 0.4 * u ? JADE2 : JADE) });
  };
  const [, yb, zb] = point(PI);
  magatama(0, yb, zb, 0.0125, 1, 0);
  for (const s of [-1, 1]) {
    const [x, y, z] = point(PI + s * 0.6);
    magatama(x, y, z, 0.0082, s, s * 0.22);
  }
  return a;
}

/**
 * Le relief de ce qu'on porte sur le buste (2026-10-30) : pour un point (x, y), le z du tissu le plus en avant (sens 1) ou
 * le plus en arrière (sens −1), d'après les triangles de ses géométries (geos, posées comme le buste) ; null à côté. Une
 * grille de 5 mm, lue au plus haut des quatre points voisins : ce qu'on y pose ne s'y enfonce pas. L'étole du yamabushi s'y
 * couche : elle suit chaque tenue (les revers de la veste, le col du happi, le croisé d'un kimono, la cuirasse).
 */
export function reliefBuste(geos, sens = 1) {
  const X0 = -0.26, Y0 = 0.36, PAS = 0.005, NX = 105, NY = 117, z = new Float32Array(NX * NY).fill(-Infinity);
  for (const geo of geos) {
    const p = geo.attributes.position.array;
    for (let k = 0; k < p.length; k += 9) {
      const ax = p[k], ay = p[k + 1], az = p[k + 2] * sens, bx = p[k + 3], by = p[k + 4], bz = p[k + 5] * sens, cx = p[k + 6], cy = p[k + 7], cz = p[k + 8] * sens;
      const d = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
      if (Math.abs(d) < 1e-12) continue;
      const i0 = Math.max(0, Math.ceil((Math.min(ax, bx, cx) - X0) / PAS)), i1 = Math.min(NX - 1, Math.floor((Math.max(ax, bx, cx) - X0) / PAS));
      const j0 = Math.max(0, Math.ceil((Math.min(ay, by, cy) - Y0) / PAS)), j1 = Math.min(NY - 1, Math.floor((Math.max(ay, by, cy) - Y0) / PAS));
      for (let j = j0; j <= j1; j++) {
        for (let i = i0; i <= i1; i++) {
          const x = X0 + i * PAS, y = Y0 + j * PAS, l1 = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / d, l2 = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / d;
          if (l1 < -1e-6 || l2 < -1e-6 || l1 + l2 > 1 + 1e-6) continue;
          const v = l1 * az + l2 * bz + (1 - l1 - l2) * cz;
          if (v > z[j * NX + i]) z[j * NX + i] = v;
        }
      }
    }
  }
  return (x, y) => {
    const i = Math.floor((x - X0) / PAS), j = Math.floor((y - Y0) / PAS);
    let m = -Infinity;
    for (let b = j; b <= j + 1; b++) for (let a = i; a <= i + 1; a++) if (a >= 0 && b >= 0 && a < NX && b < NY && z[b * NX + a] > m) m = z[b * NX + a];
    return m === -Infinity ? null : m * sens;
  };
}

/**
 * L'étole du yamabushi (結袈裟) et sa conque (法螺貝) : la récompense des Trente Bouddhas (2026-10-29). Refaite le 2026-10-30
 * (le propriétaire : « Tu peux faire le collier mieux que ça » : six boules grises à facettes en deux chaînes, une bande
 * qu'on ne voyait pas, une conque en damier) comme le vrai yuigesa : une bande de brocart (金襴 : violet, liserée et semée
 * de losanges d'or) passée derrière la nuque, qui descend en deux bandes sur la poitrine ; six pompons de coton (梵天, les
 * six perfections), quatre devant et deux dans le dos ; la conque (une trompette des mers) pendue à la hanche droite par un
 * cordon tressé. devant(x, y), dos(x, y) : le relief de ce qu'on porte (reliefBuste), où la bande se couche et où la conque
 * s'appuie ; arriere : l'atelier de ce qui est dans le dos (à part : le sac le cache), ou null (les longs cheveux de la fille
 * le couvrent). x < 0 : la droite du voyageur.
 */
export function etoleYamabushi(THREE, a, { devant, dos = null, arriere = null }) {
  const PI = Math.PI, V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const VIOLET = '#5e3d86', VIOLET2 = '#432a62', OR = '#d9ab45', OR2 = '#a87d2c', OR3 = '#efc95e', COTON = '#faf7f0', BLANC = '#f4f0e6';
  // la bande : large de W, épaisse de E, un liseré d'or de B de chaque côté ; JEU : son écart au tissu
  const W = 0.036, E = 0.006, B = 0.0065, JEU = 0.003;
  /**
   * Une ligne [[x, y]…] couchée sur le relief f (sens 1 devant, −1 dans le dos) : des points { p, n } (n vers le dehors).
   * Sous toute sa largeur, le tissu (cinq points) donne sa pente en travers et la hauteur où rien ne dépasse dessous ;
   * le long de la ligne, cette hauteur est lissée sans jamais descendre sous elle.
   */
  const coucher = (ligne, f, sens) => {
    const appuis = ligne.map(([x, y]) => {
      const us = [-2, -1, 0, 1, 2].map((k) => k * (W / 4 + 0.001)), zs = us.map((u) => f(x + u, y));
      const pris = us.map((u, k) => [u, zs[k] === null ? null : zs[k] * sens]).filter(([, v]) => v !== null);
      if (!pris.length) return [0.15, 0];
      const moy = pris.reduce((s, [, v]) => s + v, 0) / pris.length;
      const pente = Math.max(-0.6, Math.min(0.6, pris.reduce((s, [u, v]) => s + u * (v - moy), 0) / (pris.reduce((s, [u]) => s + u * u, 0) || 1)));
      return [Math.max(...pris.map(([u, v]) => v - pente * u)) + JEU, pente];
    });
    const n = ligne.length, voisin = (t, i) => t[Math.min(n - 1, Math.max(0, i))];
    const appui = appuis.map(([h]) => h), pentes = appuis.map(([, s]) => s);
    const haut = appui.map((v, i) => Math.max(v, voisin(appui, i - 1), voisin(appui, i + 1)));
    const z = haut.map((v, i) => Math.max(appui[i], 0.25 * voisin(haut, i - 1) + 0.5 * v + 0.25 * voisin(haut, i + 1)));
    return ligne.map(([x, y], i) => {
      const gy = (voisin(z, i + 1) - voisin(z, i - 1)) / (voisin(ligne, i + 1)[1] - voisin(ligne, i - 1)[1] || 1);
      const gx = 0.25 * voisin(pentes, i - 1) + 0.5 * pentes[i] + 0.25 * voisin(pentes, i + 1);
      return { p: V(x, y, z[i] * sens), n: V(-gx, -gy, sens).normalize() };
    });
  };
  /**
   * Une bande le long de points { p, n } : le dessus en trois (un liseré d'or, le violet, un liseré), les côtés, le dessous,
   * fermée aux deux bouts ; des losanges d'or semés sur le violet, un tous les trois points, là où on la voit (sous le menton).
   */
  const bande = (at, pts) => {
    const pos = [], couleurs = [], tri = (A, Bv, C, c) => { pos.push(A.x, A.y, A.z, Bv.x, Bv.y, Bv.z, C.x, C.y, C.z); couleurs.push(c); };
    const sections = pts.map(({ p, n }, i) => {
      const t = pts[Math.min(i + 1, pts.length - 1)].p.clone().sub(pts[Math.max(i - 1, 0)].p).normalize();
      const nn = n.clone().addScaledVector(t, -n.dot(t)).normalize(), b = V().crossVectors(t, nn);
      const dessous = [-W / 2, W / 2].map((u) => p.clone().addScaledVector(b, u));
      const dessus = [-W / 2, -W / 2 + B, W / 2 - B, W / 2].map((u) => p.clone().addScaledVector(nn, E).addScaledVector(b, u));
      return { p, t, n: nn, b, dessous, dessus };
    });
    for (let i = 0; i + 1 < sections.length; i++) {
      const s0 = sections[i], s1 = sections[i + 1];
      for (let k = 0; k < 3; k++) {
        const c = k === 1 ? VIOLET : OR;
        tri(s0.dessus[k], s0.dessus[k + 1], s1.dessus[k + 1], c);
        tri(s0.dessus[k], s1.dessus[k + 1], s1.dessus[k], c);
      }
      tri(s0.dessous[0], s1.dessous[1], s0.dessous[1], VIOLET2);
      tri(s0.dessous[0], s1.dessous[0], s1.dessous[1], VIOLET2);
      tri(s0.dessous[1], s1.dessous[1], s1.dessus[3], OR2);
      tri(s0.dessous[1], s1.dessus[3], s0.dessus[3], OR2);
      tri(s0.dessous[0], s0.dessus[0], s1.dessus[0], OR2);
      tri(s0.dessous[0], s1.dessus[0], s1.dessous[0], OR2);
    }
    const d = sections[0], f = sections[sections.length - 1];
    tri(d.dessous[0], d.dessus[3], d.dessus[0], OR2);
    tri(d.dessous[0], d.dessous[1], d.dessus[3], OR2);
    tri(f.dessous[0], f.dessus[0], f.dessus[3], OR2);
    tri(f.dessous[0], f.dessus[3], f.dessous[1], OR2);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    at.piece(g, VIOLET, { couleurs });
    // (les losanges : 1,5 mm devant le violet, pas dans son plan)
    const l = [];
    sections.forEach(({ p, t, n, b }, i) => {
      if (i % 3 !== 1 || p.y > 0.8) return;
      const c = p.clone().addScaledVector(n, E + 0.0015), h = t.clone().multiplyScalar(0.0075), w = b.clone().multiplyScalar(0.0058);
      const [A, Bv, C, D] = [c.clone().sub(h), c.clone().add(w), c.clone().add(h), c.clone().sub(w)];
      for (const q of [A, Bv, C, A, C, D]) l.push(q.x, q.y, q.z);
    });
    if (l.length) {
      const gl = new THREE.BufferGeometry();
      gl.setAttribute('position', new THREE.Float32BufferAttribute(l, 3));
      at.piece(gl, OR3, { trait: false });
    }
  };
  /**
   * Un pompon de coton (梵天) en c, de rayon R hors tout : douze grosses touffes rondes autour d'un cœur, tournées au hasard
   * (graine), le contour festonné comme un petit nuage.
   */
  const pompon = (at, c, R, graine, finesse) => {
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(graine * 1.7, graine * 2.3, graine * 0.9));
    const touffes = [], ico = new THREE.IcosahedronGeometry(1, 0).attributes.position, d = V();
    for (let i = 0; i < ico.count; i++) { d.fromBufferAttribute(ico, i).normalize(); if (!touffes.some((t) => t.distanceTo(d) < 1e-3)) touffes.push(d.clone()); }
    for (const t of touffes) t.applyQuaternion(q);
    // (dans la direction d : la plus loin des touffes, des boules de rayon 0,56 à 0,5 du centre, ou le cœur, 0,82)
    const loin = (dd) => {
      let r = 0.82;
      for (const t of touffes) { const ct = dd.dot(t), h = 0.25 * (1 - ct * ct); if (ct > 0 && h < 0.3136) r = Math.max(r, 0.5 * ct + Math.sqrt(0.3136 - h)); }
      return (r * R) / 1.06;
    };
    const g = new THREE.IcosahedronGeometry(1, finesse), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { d.fromBufferAttribute(p, i).normalize(); const r = loin(d); p.setXYZ(i, d.x * r, d.y * r, d.z * r); }
    at.piece(g, COTON, { x: c.x, y: c.y, z: c.z });
  };

  // les deux bandes de devant, du bas de la poitrine jusque sous le menton (un peu plus écartées en haut : elles passent en
  // dedans des bretelles du sac), puis derrière la nuque, sous la grosse tête : on ne le voit pas
  const ys = Array.from({ length: 19 }, (_, k) => 0.645 + k * 0.01);
  const [aDroite, aGauche] = [-1, 1].map((s) => coucher(ys.map((y) => [s * (0.0545 + (0.0135 * (y - 0.6)) / 0.22), y]), devant, 1));
  const epaule = (s, zh) => [
    { p: V(s * 0.071, 0.842, zh * 0.6), n: V(0, 0.6, 0.8) }, { p: V(s * 0.076, 0.868, 0), n: V(s * 0.2, 1, 0) }, { p: V(s * 0.062, 0.874, -0.06), n: V(s * 0.3, 0.8, -0.5) },
  ];
  bande(a, [...aDroite, ...epaule(-1, aDroite.at(-1).p.z), { p: V(0, 0.872, -0.082), n: V(0, 0.6, -0.8) }, ...epaule(1, aGauche.at(-1).p.z).reverse(), ...[...aGauche].reverse()]);
  // les quatre pompons de devant : au bas des bandes (cachant leur bout ; plus bas, ceux de la fille entraient dans le bout
  // des bretelles de son sac, qui avancent) et sur la poitrine ; posés sur la bande à la hauteur y
  const surBande = (cote, y) => {
    const i = Math.min(cote.length - 2, Math.max(0, Math.floor((y - ys[0]) / 0.01))), t = (y - ys[i]) / 0.01;
    return [cote[i].p.clone().lerp(cote[i + 1].p, t), cote[i].n.clone().lerp(cote[i + 1].n, t).normalize()];
  };
  [aDroite, aGauche].forEach((cote, s) => {
    for (const [y, R, graine] of [[0.672, 0.034, 1], [0.765, 0.033, 2]]) {
      const [p, n] = surBande(cote, y);
      pompon(a, p.addScaledVector(n, E + 0.92 * R), R, graine + 3 * s, 6);
    }
  });
  // dans le dos : deux bandes qui descendent de la nuque sur les omoplates, un pompon au bout de chacune
  if (arriere && dos) {
    const yd = Array.from({ length: 13 }, (_, k) => 0.835 - k * 0.01);
    for (const s of [-1, 1]) {
      const ligne = coucher(yd.map((y) => [s * (0.082 + (0.01 * (0.835 - y)) / 0.12), y]), dos, -1);
      bande(arriere, [{ p: V(s * 0.068, 0.874, -0.05), n: V(s * 0.2, 0.8, -0.5) }, ...ligne]);
      const { p, n } = ligne[11];
      pompon(arriere, p.clone().addScaledVector(n, E + 0.92 * 0.032), 0.032, 7 + s, 4);
    }
  }

  // la conque : une trompette des mers (Charonia), sa spire en tours bosselés, crème marquée de brun, son ouverture orangée
  // (un creux) bordée d'une lèvre blanche, l'embouchure laquée au bout de la pointe ; faite le long de +y (la pointe en haut,
  // l'ouverture vers +z : v = 0), longue de L ; 44 × 22 cases (à 36 × 18, les bords des couleurs faisaient des pixels)
  const L = 0.165, RM = 0.042, NU = 44, NV = 22, XC = -0.13, YC = 0.47;
  const lisse = (b0, b1, v) => { const t = Math.min(1, Math.max(0, (v - b0) / (b1 - b0))); return t * t * (3 - 2 * t); };
  const tours = (u) => (u < 0.62 ? 7 * (u / 0.62) ** 0.85 : 7 + 2.2 * (u - 0.62));
  // (u : de la pointe, 0, au bout du canal, 1 ; v : le tour ; → [rayon, couleur])
  const coquille = (u, v) => {
    const phi = tours(u) - v / (2 * PI), s = phi - Math.floor(phi), spire = 1 - lisse(0.5, 0.72, u);
    let r = u < 0.6 ? 0.005 + (RM - 0.005) * (u / 0.6) ** 1.15 : RM * (1 - 0.72 * ((u - 0.6) / 0.4) ** 1.5);
    r *= (1 - spire * 0.17 * (1 - Math.sin(PI * s) ** 0.6)) * (1 + 0.07 * spire * Math.max(0, Math.cos(v * 9)) ** 6 * Math.sin(PI * s) ** 2);
    const dv = Math.atan2(Math.sin(v), Math.cos(v)), e = ((u - 0.79) / 0.17) ** 2 + (dv / 0.95) ** 2;
    if (e < 1) return [r * (0.6 + 0.4 * e), '#e8925a'];
    if (e < 1.5) return [r * (1 + 0.13 * (1 - Math.abs(e - 1.25) / 0.25)), '#f7f0e3'];
    // (des bandes brunes : sur la spire, au bas de chaque tour ; sur le dernier tour, trois bandes ; rompues en croissants)
    const brun = (u < 0.62 ? s > 0.55 && s < 0.85 : (u * 9) % 1 > 0.5 && (u * 9) % 1 < 0.78) && Math.sin(v * 3 + u * 20) > -0.4;
    return [r, brun ? (Math.sin(v * 5 - u * 9) > 0.5 ? '#7a4426' : '#a8673e') : '#eee0c5'];
  };
  const rmax = (u) => { let m = 0; for (let j = 0; j < 36; j++) m = Math.max(m, coquille(u, (j / 36) * 2 * PI)[0]); return m; };
  const grille = Array.from({ length: NU + 1 }, (_, i) => Array.from({ length: NV }, (_, j) => {
    const u = i / NU, v = (j / NV) * 2 * PI, [r] = coquille(u, v);
    return [r * Math.sin(v), L * (0.5 - u), r * Math.cos(v)];
  }));
  const pts = [], couleurs = [], tri = (A, Bv, C, c) => { pts.push(...A, ...Bv, ...C); couleurs.push(c); };
  for (let i = 0; i < NU; i++) {
    for (let j = 0; j < NV; j++) {
      const j1 = (j + 1) % NV, c = coquille((i + 0.5) / NU, ((j + 0.5) / NV) * 2 * PI)[1];
      tri(grille[i][j], grille[i + 1][j], grille[i + 1][j1], c);
      tri(grille[i][j], grille[i + 1][j1], grille[i][j1], c);
    }
  }
  for (let j = 0; j < NV; j++) {
    const j1 = (j + 1) % NV;
    tri([0, L / 2 + 0.003, 0], grille[0][j], grille[0][j1], '#d9c8a8');
    tri([0, -L / 2 - 0.004, 0], grille[NU][j1], grille[NU][j], '#e8d8bc');
  }
  // penchée comme le tissu derrière elle (la jupe qui s'évase : sa pente, du haut au bas de la conque), la pointe un peu
  // vers le milieu, l'ouverture devant et un peu en dehors ; assez en avant pour ne rien toucher, le long de son axe
  const zh = devant(XC, YC + 0.07), zb = devant(XC, YC - 0.07), k = zh !== null && zb !== null ? (zh - zb) / 0.14 : -0.2;
  const Y = V(0.2, 1, k).normalize(), Z = V(-0.4, 0, 1), X = V();
  Z.addScaledVector(Y, -Z.dot(Y)).normalize();
  X.crossVectors(Y, Z);
  let zc = 0.15;
  for (let i = 0; i <= 10; i++) {
    const u = i / 10, r = rmax(u) + 0.005, q = Y.clone().multiplyScalar(L * (0.5 - u));
    for (const dx of [-r, 0, r]) { const zt = devant(XC + q.x + dx, YC + q.y); if (zt !== null) zc = Math.max(zc, zt + r - q.z); }
  }
  const repere = new THREE.Matrix4().makeBasis(X, Y, Z).setPosition(XC, YC, zc);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  a.piece(g.applyMatrix4(repere), '#eee0c5', { couleurs })
    // l'embouchure (吹口) laquée de noir, sa bague de laiton
    .piece(new THREE.CylinderGeometry(0.0072, 0.0082, 0.024, 10).translate(0, L / 2 + 0.012, 0).applyMatrix4(repere), '#2b2522')
    .piece(new THREE.CylinderGeometry(0.0095, 0.0095, 0.006, 10).translate(0, L / 2 + 0.004, 0).applyMatrix4(repere), '#c99c48');
  // le cordon tressé, violet et blanc : deux tours autour de la coquille, noué de côté, puis jusqu'au bas de la bande de
  // droite (il en sort sous son pompon)
  const tresse = (x, y, z) => (Math.floor((x + y * 1.3 + z) * 150 + 1000) % 2 ? VIOLET : BLANC);
  for (const u of [0.28, 0.5]) a.piece(new THREE.TorusGeometry(rmax(u) + 0.0035, 0.0035, 5, 22).rotateX(PI / 2).translate(0, L * (0.5 - u), 0).applyMatrix4(repere), VIOLET, { teinte: tresse });
  const S = aDroite[0].p.clone().addScaledVector(aDroite[0].n, E / 2), c28 = V(0, L * 0.22, 0).applyMatrix4(repere), vers = S.clone().sub(c28);
  const vK = Math.atan2(vers.dot(X), vers.dot(Z)), K = c28.clone().addScaledVector(X, Math.sin(vK) * (rmax(0.28) + 0.006)).addScaledVector(Z, Math.cos(vK) * (rmax(0.28) + 0.006));
  // (le cordon pend un peu entre les deux, et passe devant ce qu'il croise : la ceinture d'une robe, le bas du haut)
  const cordon = [0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => {
    const q = S.clone().lerp(K, t);
    q.y -= 0.012 * Math.sin(PI * t);
    const zt = t > 0 && t < 1 ? devant(q.x, q.y) : null;
    if (zt !== null) q.z = Math.max(q.z, zt + 0.009);
    return q.toArray();
  });
  a.tube(cordon, 0.0042, VIOLET, { cotes: 5, pas: 18, teinte: tresse })
    .boule(0.0085, VIOLET, { x: K.x, y: K.y, z: K.z }, 1);
  return a;
}

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
  const bas = atelier(), haut = atelier(), cou = atelier(), b = atelier(), foulard = atelier();
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
    // le « foulard » : le devant du col marin et le nœud rouge, ses deux boucles, ses deux pans (à part : le collier de
    // magatama le remplace)
    for (const s of [-1, 1]) {
      foulard.boite(0.046, 0.17, 0.016, P.col, { x: s * 0.058, y: 0.748, z: 0.137 + s * 0.002, rz: s * 0.5, rx: -0.22 })
        .ovale(0.034, P.noeud, { x: s * 0.036, y: 0.688, z: 0.158, sx: 1.3, sy: 0.78, sz: 0.45, rz: -s * 0.25 }, 10)
        .boite(0.026, 0.07, 0.01, P.noeud, { x: s * 0.018, y: 0.645, z: 0.156 + s * 0.0015, rz: s * 0.25, rx: -0.15 });
    }
    foulard.ovale(0.017, P.noeud, { y: 0.688, z: 0.168, sz: 0.6 }, 8);
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
  // (le foulard de la fille : on ne le voit qu'avec son chemisier, et sans rien au cou : le collier le remplace, sinon
  // il se perdait entre le nœud rouge et le col blanc, 2026-10-25)
  const mFoulard = fille ? maillage(foulard.fin(0, false)) : null;
  if (mFoulard) corps.add(mFoulard);
  let auCou = false;
  const majFoulard = () => { if (mFoulard) mFoulard.visible = mHaut.visible && !auCou; };

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
    // le chapeau-champignon (Yakushima, 2026-10-31, la récompense choisie par le propriétaire : « Un chapeau-champignon ») : le
    // chapeau d'un champignon de la forêt de mousse posé sur la tête, crème à peine vert, son milieu brun, son bord un peu ondulé,
    // ses lamelles dessous ; deux tout petits champignons qui poussent dessus. La nuit, il brille d'un vert doux (sorte lumiere),
    // comme les champignons du secret (シイノトモシビタケ)
    champignon() {
      const a = atelier(), y = CY + 0.15, R = 0.4, CREME = '#e6edc6', BRUN = '#c4a274', LAMES = '#d6d4b0';
      a.piece(new THREE.SphereGeometry(R, 24, 9, 0, 2 * PI, 0, PI / 2), CREME, {
        y, sy: 0.62, sorte: 'lumiere', nuance: 0.03,
        deformer: (px, py, pz) => { const th = Math.atan2(pz, px), b = 1 + 0.035 * Math.sin(th * 7) * (1 - py / R); return [px * b, py, pz * b]; },
        teinte: (wx, wy) => (wy > y + R * 0.62 * 0.78 ? BRUN : wy > y + R * 0.62 * 0.6 ? '#d8c8a0' : CREME),
      });
      // le dessous : les lamelles (des rayons fins), le bord
      a.piece(new THREE.RingGeometry(0.1, R * 0.99, 24), LAMES, { y: y + 0.004, rx: PI / 2, trait: false, sorte: 'lumiere' });
      for (let k = 0; k < 24; k++) { const t = (k / 24) * 2 * PI; a.boite(R * 0.82, 0.012, 0.006, '#bdb894', { x: Math.cos(t) * R * 0.52, y: y + 0.01, z: Math.sin(t) * R * 0.52, ry: -t, trait: false }); }
      // les deux petits champignons, sur le dessus, un peu penchés
      for (const [x, z, h, r, inc] of [[0.12, -0.05, 0.1, 0.055, 0.25], [-0.1, 0.07, 0.07, 0.04, -0.3]]) {
        const yb = y + R * 0.62 * Math.sqrt(Math.max(0, 1 - (x * x + z * z) / (R * R))) - 0.01;
        a.cylindre(0.012, 0.016, h, 6, '#f2f0e0', { x, y: yb + h / 2, z, rz: inc })
          .piece(new THREE.SphereGeometry(r, 10, 4, 0, 2 * PI, 0, PI / 2), CREME, { x: x - Math.sin(inc) * h, y: yb + h * Math.cos(inc), z, sy: 0.6, rz: inc, sorte: 'lumiere' });
      }
      return a;
    },
    // la coiffe du héron blanc (Himeji, le « Héron blanc ») : un héron perché sur la tête comme un chapeau, le corps blanc
    // et ses ailes repliées, le cou en S qui se dresse devant, la tête au bec jaune, l'œil noir, la petite huppe ; derrière,
    // les longues plumes de la parade (les aigrettes) qui retombent
    heron() {
      const a = atelier(), B = '#fbfaf6', AILE = '#ecebe4', J = '#f2c443', N = '#2a2420', y = CY + 0.31;
      a.ovale(0.13, B, { y, z: -0.02, sx: 0.85, sy: 0.62, sz: 1.35 }, 14);
      for (const s of [-1, 1]) a.ovale(0.12, AILE, { x: s * 0.1, y: y + 0.02, z: -0.05, sx: 0.36, sy: 0.55, sz: 1.3, ry: s * 0.12, rz: -s * 0.25 }, 12);
      // le cou, la tête, le bec, les yeux, la huppe
      a.tube([[0, y + 0.02, 0.12], [0, y + 0.1, 0.16], [0, y + 0.19, 0.12], [0, y + 0.27, 0.14], [0, y + 0.31, 0.19]], 0.028, B, { cotes: 8, pas: 18 });
      const T = [0, y + 0.32, 0.22];
      a.ovale(0.046, B, { x: T[0], y: T[1], z: T[2], sx: 0.82, sy: 0.8, sz: 1.25 }, 10)
        .cone(0.015, 0.12, 6, J, { x: 0, y: T[1] - 0.006, z: T[2] + 0.1, rx: PI / 2 + 0.12 });
      for (const s of [-1, 1]) a.ovale(0.009, N, { x: s * 0.034, y: T[1] + 0.01, z: T[2] + 0.022, trait: false }, 6);
      for (const s of [-1, 1]) a.tube([[s * 0.01, T[1] + 0.02, T[2] - 0.03], [s * 0.02, T[1] + 0.05, T[2] - 0.11], [s * 0.03, T[1] + 0.01, T[2] - 0.19]], 0.006, B, { cotes: 4, pas: 8 });
      // les aigrettes : trois longues plumes fines qui montent du dos, puis retombent en arrière
      for (const [dx, k] of [[-0.05, 0.9], [0, 1.05], [0.05, 0.9]]) {
        a.tube([[dx * 0.5, y + 0.03, -0.14], [dx, y + 0.13 * k, -0.27], [dx * 1.6, y + 0.12 * k, -0.4], [dx * 2.2, y + 0.01, -0.47]], 0.009, B, { cotes: 5, pas: 14 });
      }
      return a;
    },
    // les cornes d'oni (Beppu) : un serre-tête en peau de tigre (jaune rayé de noir), et, dessus, deux cornes rouges qui
    // montent en s'écartant et se recourbent un peu vers l'avant, leur pointe ivoire
    cornes() {
      const a = atelier(), r = 0.335, inc = -0.3, o = [0, CY - 0.02, -0.03];
      const sur = (th, ecart = 0) => {
        const x = Math.cos(th) * (r + ecart), y = Math.sin(th) * (r + ecart);
        return [o[0] + x, o[1] + y * Math.cos(inc), o[2] + y * Math.sin(inc)];
      };
      a.piece(new THREE.TorusGeometry(r, 0.024, 6, 26, PI), '#e8a42a', { x: o[0], y: o[1], z: o[2], rx: inc, teinte: (px, py) => (Math.floor(Math.atan2(py - o[1], px) * 7 + 50) % 2 ? '#e8a42a' : '#2a2420') });
      for (const s of [-1, 1]) {
        const B = sur(s > 0 ? 1.12 : PI - 1.12, 0.01);
        // la corne : un tube qui s'affine, de la base (sur le serre-tête) à la pointe
        const pts = [B, [B[0] + s * 0.03, B[1] + 0.07, B[2] + 0.005], [B[0] + s * 0.06, B[1] + 0.14, B[2] + 0.025], [B[0] + s * 0.07, B[1] + 0.2, B[2] + 0.06]];
        a.tronc(pts, [0.05, 0.04, 0.027, 0.012], '#d9482f', 8);
        a.cone(0.014, 0.05, 6, '#f2e6c8', { x: pts[3][0] + s * 0.004, y: pts[3][1] + 0.018, z: pts[3][2] + 0.012, ...vers(s * 0.2, 1, 0.5) });
        a.boule(0.05, '#e8a42a', { x: B[0], y: B[1] - 0.005, z: B[2], sy: 0.6 }, 1);
      }
      return a;
    },
    // les oreilles de renard blanc (Motonosumi : le renard du rêve qui fit naître le sanctuaire) : un serre-tête blanc, deux
    // grandes oreilles pointues qui se dressent en s'écartant, rouges dedans (comme les renards d'Inari) ; la queue, elle, est
    // sur le corps (queueRenard)
    renard() {
      const a = atelier(), r = 0.335, inc = -0.3, o = [0, CY - 0.02, -0.03], B = '#fbf8f0';
      const sur = (th, ecart = 0) => {
        const x = Math.cos(th) * (r + ecart), y = Math.sin(th) * (r + ecart);
        return [o[0] + x, o[1] + y * Math.cos(inc), o[2] + y * Math.sin(inc)];
      };
      a.piece(new THREE.TorusGeometry(r, 0.022, 6, 26, PI), B, { x: o[0], y: o[1], z: o[2], rx: inc });
      // (une oreille : une feuille pointue épaisse de 3 cm ; devant, 2 mm en avant de sa face, son creux rouge)
      const feuille = (l, h, y0 = 0) => { const f = new THREE.Shape(); f.moveTo(-l, y0); f.quadraticCurveTo(-l * 0.8, h * 0.5, 0, h); f.quadraticCurveTo(l * 0.8, h * 0.5, l, y0); f.lineTo(-l, y0); return f; };
      const gO = new THREE.ExtrudeGeometry(feuille(0.078, 0.25), { depth: 0.03, bevelEnabled: false }).translate(0, 0, -0.015);
      const gD = new THREE.ExtrudeGeometry(feuille(0.046, 0.2, 0.03), { depth: 0.004, bevelEnabled: false }).translate(0, 0, 0.016);
      for (const s of [-1, 1]) {
        const [ex, ey, ez] = sur(s > 0 ? 0.95 : PI - 0.95, 0.01), dir = vers(s * 0.4, 1, -0.1);
        a.piece(gO.clone(), B, { x: ex, y: ey - 0.02, z: ez, ...dir }).piece(gD.clone(), '#e0533e', { x: ex, y: ey - 0.02, z: ez, ...dir, trait: false })
          .boule(0.042, B, { x: ex, y: ey, z: ez, sy: 0.6 }, 1);
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

  // ---- Les ailes du phénix (le Pavillon d'or, 2026-10-26 : la récompense de ses tampons, choisie par le propriétaire) : deux
  // ailes d'or, comme celles du phénix du toit, attachées entre les omoplates (sur le dos, à la place du sac). Chacune : l'os,
  // des couvertures arrondies, six plumes du bras qui retombent, sept longues rémiges en éventail au bout ; chaque plume d'or
  // finit en orange puis en rouge, comme une flamme (sans ce bout de feu, des plumes toutes dorées ressemblaient à une cape de
  // paille). Repliées au repos (le poignet haut derrière l'épaule, les plumes qui retombent le long du dos, comme des ailes
  // d'ange), entrouvertes en marchant, grandes ouvertes et battantes en courant, déployées quand on saute, qu'on danse ou qu'on
  // fait « Ouais ! ». Chaque aile pivote à sa racine (ordre 'YZX' : déployée dans son plan, puis rabattue vers l'arrière).
  /** Une plume de base à pointe (une lame qui s'amincit), d'or, son bout orange (bout) puis rouge (pointe) si on les donne. */
  const plumeAile = (a, base, pointe, w, t, c, bout = null, rouge = null) => {
    const Y = new THREE.Vector3(...pointe).sub(new THREE.Vector3(...base)), l = Y.length();
    Y.normalize();
    const Z = new THREE.Vector3(0, 0, 1).addScaledVector(Y, -Y.z).normalize(), X = new THREE.Vector3().crossVectors(Y, Z);
    const g = new THREE.BoxGeometry(w, l, t, 1, 3, 1), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const u = p.getY(i) / l + 0.5; p.setX(i, p.getX(i) * (1 - 0.6 * u * u)); }
    g.applyMatrix4(new THREE.Matrix4().makeBasis(X, Y, Z));
    g.translate((base[0] + pointe[0]) / 2, (base[1] + pointe[1]) / 2, (base[2] + pointe[2]) / 2);
    const le = (x, y, z) => ((x - base[0]) * Y.x + (y - base[1]) * Y.y + (z - base[2]) * Y.z) / l;
    a.piece(g, c, { nuance: 0.03, teinte: bout ? (x, y, z) => { const u = le(x, y, z); return u > 0.72 ? rouge : u > 0.45 ? bout : c; } : undefined });
  };
  const ailePhenix = (s) => {
    const a = atelier(), O = '#e7b940', O2 = '#d9a52e', O3 = '#f4cf5c', F1 = '#f08a2c', F2 = '#e0482a';
    a.baton([0, 0, 0], [s * 0.2, 0.06, 0], 0.024, O2, 6).baton([s * 0.2, 0.06, 0], [s * 0.36, 0.1, -0.012], 0.017, O2, 5);
    // les rémiges : du dehors (un peu relevées) vers le bas, plus courtes vers l'intérieur ; une sur deux un rien en arrière
    for (let k = 0; k < 7; k++) {
      const base = [s * (0.36 - 0.022 * k), 0.1 - 0.008 * k, -0.012 - (k % 2) * 0.008], ang = 0.3 - k * 0.24, l = 0.46 - 0.026 * k;
      plumeAile(a, base, [base[0] + s * Math.cos(ang) * l, base[1] + Math.sin(ang) * l, base[2] - 0.02], 0.085, 0.013, k % 2 ? O : O3, F1, F2);
    }
    // les plumes du bras, qui retombent (leur bout orange)
    for (let k = 0; k < 6; k++) {
      const base = [s * (0.05 + 0.04 * k), 0.012 + 0.008 * k, 0.004 + (k % 2) * 0.006], l = 0.24 + 0.012 * k;
      plumeAile(a, base, [base[0] + s * 0.05, base[1] - l, base[2] - 0.01], 0.07, 0.012, k % 2 ? O2 : O, F1, F1);
    }
    // les couvertures : de petites plumes rondes sur l'os
    for (let k = 0; k < 5; k++) a.ovale(0.045, O3, { x: s * (0.05 + 0.065 * k), y: 0.03 + 0.012 * k, z: 0.012, sy: 0.6, sz: 0.35, rz: s * 0.4 }, 8);
    return a;
  };
  let ailes = null, ouverture = 0, phaseAile = 0;
  const animerAiles = (dt, vitesse, fete) => {
    if (!ailes || !ailes.objet.visible) return;
    const court = vitesse > 4.4, voulu = fete || court ? 1 : vitesse > 0.4 ? 0.28 : 0, bat = fete ? 0.55 : court ? 1 : vitesse > 0.4 ? 0.25 : 0.06;
    ouverture += (voulu - ouverture) * Math.min(1, dt * 5);
    phaseAile += dt * 2 * PI * (0.35 + 2.2 * bat);
    const f = Math.sin(phaseAile) * (0.04 + 0.42 * bat);
    // (repliées : l'os relevé de 25° et rabattu presque contre le dos, les bouts sous le haut de la tête, sinon on dirait des
    // cornes de face ; ouvertes : l'os un peu relevé, en travers)
    ailes.cotes.forEach((g, i) => {
      const s = i ? 1 : -1;
      g.rotation.set(0, s * (1.25 - 1.11 * ouverture), s * (0.45 - 0.12 * ouverture + f), 'YZX');
    });
  };
  // la cape en plumes de cormoran (Udo, 2026-10-31) : le haut, sur les épaules ; l'ourlet, six morceaux qui s'écartent (un peu
  // en marchant, plus en courant, grand ouvert quand on saute, qu'on danse ou qu'on fait « Ouais ! »), plus au dos que sur les
  // côtés, et qui battent chacun à son tour (la phase avance à chaque image)
  let cape = null, ecartCape = 0, phaseCape = 0;
  const animerCape = (dt, vitesse, fete) => {
    if (!cape || !cape.objet.visible) return;
    const vif = fete || vitesse > 4.4, voulu = fete ? 0.5 : vif ? 0.36 : vitesse > 0.4 ? 0.12 : 0;
    ecartCape += (voulu - ecartCape) * Math.min(1, dt * 4);
    phaseCape += dt * 2 * PI * (vif ? 2.6 : 1.2);
    const bat = (vif ? 0.06 : 0.02) * Math.min(1, ecartCape / 0.1);
    for (const m of cape.ourlet) {
      const dos = 0.55 - 0.45 * Math.cos(m.t);
      m.g.quaternion.setFromAxisAngle(m.axe, Math.max(0, ecartCape * dos + bat * Math.sin(phaseCape + m.t * 2.3)));
    }
  };
  // la queue de renard (Motonosumi : elle vient avec les oreilles, la pièce de tête « renard ») : des touffes blanches le long
  // d'une courbe qui part du bas du dos, s'écarte en arrière et remonte, le bout doré ; son pivot, à la base, balance en
  // marchant (la phase s'ajoute à chaque image : jamais le temps multiplié par ce qui varie)
  let queue = null, phaseQueue = 0;
  const queueRenard = () => {
    const a = atelier(), Q = [[0, 0, 0], [0.02, -0.06, -0.15], [0.06, 0.03, -0.31], [0.07, 0.21, -0.39], [0.04, 0.38, -0.36]];
    for (let k = 0; k < 11; k++) {
      const f = k / 10, i = Math.min(3, Math.floor(f * 4)), g = f * 4 - i, q = Q[i].map((v, c) => v + (Q[i + 1][c] - v) * g), r = 0.085 + 0.045 * Math.sin(f * PI) - 0.035 * f;
      a.ovale(r, k > 8 ? '#e8b941' : '#fbf8f0', { x: q[0], y: q[1], z: q[2], sy: 1.2 }, 10);
    }
    const g = new THREE.Group();
    g.position.set(0, 0.45, -0.14);
    g.add(maillage(a.fin(0, false)));
    return g;
  };
  const animerQueue = (dt, vitesse) => {
    if (!queue || !queue.visible) return;
    const allure = Math.min(1, vitesse / 4);
    phaseQueue += dt * (1.5 + 2.5 * allure);
    queue.rotation.set(-0.15 * allure, Math.sin(phaseQueue) * (0.12 + 0.22 * allure), Math.sin(phaseQueue * 0.5) * 0.05, 'YXZ');
  };

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
  // le collier de magatama : posé sur le buste de ce qu'on porte (avec le buste des habits de tous les jours, il
  // s'enfonçait à moitié dans le happi, les robes et l'armure) ; un par buste, fait la première fois
  const entre = (y, y0, y1) => Math.min(1, Math.max(0, (y0 - y) / (y0 - y1)));
  const robeBuste = { rayon: (y) => 0.168 + 0.037 * entre(y, 0.81, 0.5), aplati: 0.92, bas: 0.74, avant: 0.024 };
  const BUSTES = {
    'habit-defaut': fille ? { rayon: (y) => 0.145 + 0.021 * entre(y, 0.805, 0.555), aplati: 0.9, bas: 0.752, avant: 0.024 }
      : { rayon: (y) => 0.15 + 0.022 * entre(y, 0.8, 0.55), aplati: 0.9, bas: 0.722, avant: 0.014 },
    happi: { rayon: (y) => 0.172 + ((fille ? 0.218 : 0.206) - 0.172) * entre(y, 0.81, fille ? 0.5 : 0.405), aplati: 0.92, bas: 0.74, avant: 0.024 },
    yukata: robeBuste, kimonoOr: robeBuste,
    armure: { rayon: (y) => 0.185 + 0.007 * entre(y, 0.81, 0.5), aplati: 0.9, bas: 0.74, avant: 0.026 },
  };
  const colliers = {}, dosEtoles = {};
  let habitCourant = 'habit-defaut';
  const majCollier = () => {
    for (const m of [...Object.values(colliers), ...Object.values(dosEtoles)]) m.visible = false;
    if (!auCou) return;
    // (au cou : le collier de magatama, à la mesure du buste de la tenue ; ou l'étole et la conque du yamabushi, couchées
    // sur le relief de ce qu'on porte : le haut de la tenue, et le bas qu'elle garde, devant lequel pend la conque ; et le
    // mino, dont le col de corde et ses cordons passent devant la poitrine, ou le haut de la cape de plumes de cormoran et son
    // col : l'étole se pose dessus)
    const surDos = auCou !== 'yamabushi' || !dosPorte ? null : dosPorte === pieces.mino ? ['mino', pieces.mino] : cape && dosPorte === cape.objet ? ['cormoran', cape.haut] : null;
    const k = auCou === 'yamabushi' || BUSTES[habitCourant] ? habitCourant : 'habit-defaut', cle = `${auCou}:${k}${surDos ? ':' + surDos[0] : ''}`;
    if (!colliers[cle]) {
      if (auCou === 'yamabushi') {
        const h = habits[k], geos = [...(h ? [h.meshes[0], ...(h.garde.includes('bas') ? [mBas] : [])] : [mHaut, mBas]), ...(surDos ? [surDos[1]] : [])].map((m) => m.children[0].geometry);
        const a = atelier(), arriere = fille ? null : atelier();
        etoleYamabushi(THREE, a, { devant: reliefBuste(geos, 1), dos: arriere ? reliefBuste(geos, -1) : null, arriere });
        colliers[cle] = maillage(a.fin(0, false));
        if (arriere) { dosEtoles[cle] = maillage(arriere.fin(0, false)); corps.add(dosEtoles[cle]); }
      } else colliers[cle] = maillage(collierMagatama(THREE, atelier(), BUSTES[k]).fin(0, false));
      corps.add(colliers[cle]);
    }
    colliers[cle].visible = true;
    // (les pompons du dos de l'étole, quand rien ne les couvre : le sac, le mino, les ailes)
    if (dosEtoles[cle]) dosEtoles[cle].visible = !sacGarde && !dosPorte;
  };
  // le sac à dos : la tenue le garde ou non (garde : 'sac'), et le mino le cache (sur le dos, à sa place) ; et le dos de
  // l'étole avec lui (majCollier)
  let sacGarde = true, dosPorte = null;
  const majSac = () => { mSac.visible = sacGarde && !dosPorte; majCollier(); };
  /** Mettre la tenue id (HABITS ; 'habit-defaut' ou inconnue : les habits de tous les jours). */
  function habiller(id) {
    if (habitPorte) for (const m of habitPorte.meshes) m.visible = false;
    const f = HABITS[id];
    // (le collier suit, dans majSac : une fois les morceaux de la tenue faits, l'étole se couche sur eux)
    habitCourant = f ? id : 'habit-defaut';
    if (!f) {
      mHaut.visible = mBas.visible = true;
      majFoulard();
      sacGarde = true;
      majSac();
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
    majFoulard();
    mBas.visible = h.garde.includes('bas');
    sacGarde = h.garde.includes('sac');
    majSac();
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
    } else if (g === 'prier') {
      // au sanctuaire : deux saluts profonds, deux battements de mains, un dernier salut (comme on prie au Japon) ;
      // ensuite, les mains jointes
      const s1 = [[0, 0.9], [1.0, 0.9], [3.3, 1.0]].reduce((v, [d, l]) => v + Math.sin(Math.min(1, Math.max(0, (t - d) / l)) * PI), 0);
      corps.rotation.x = 0.55 * s1; tete.rotation.x = 0.2 * s1;
      const mains = lisseDanse(Math.min(1, Math.max(0, (t - 1.85) / 0.2))), clap = (t > 2.15 && t < 2.32) || (t > 2.62 && t < 2.79) ? 1 : 0;
      B.rotation.x = G.rotation.x = -1.1 * mains;
      B.rotation.z = (0.42 + 0.32 * (t > 3.2 ? 1 : clap)) * mains - 0.05 * (1 - mains);
      G.rotation.z = -B.rotation.z;
    } else if (g === 'washi') {
      // faire une feuille de papier : le cadre (sukigeta) tenu des deux mains au-dessus de la cuve, qu'on balance
      // d'avant en arrière pour étaler les fibres
      const o = Math.sin(t * 5.2);
      corps.rotation.x = 0.34 + 0.05 * o; tete.rotation.x = 0.3;
      B.rotation.x = G.rotation.x = -1.0 - 0.2 * o; B.rotation.z = 0.3; G.rotation.z = -0.3;
    } else if (g === 'kokiriko') {
      // la danse de la kokiriko : les bras qui montent et descendent devant soi (comme la sasara qu'on fait claquer),
      // un pas de côté, le corps qui tourne un peu (environ 100 battements par minute)
      const b = t * (100 / 60) * PI, s = 0.5 + 0.5 * Math.sin(b), d = Math.sin(b / 2);
      B.rotation.x = G.rotation.x = -0.7 - 1.05 * s; B.rotation.z = 0.28; G.rotation.z = -0.28;
      danseur.rotation.y = 0.32 * d;
      jambes[0].rotation.x = 0.28 * Math.max(0, d); jambes[1].rotation.x = 0.28 * Math.max(0, -d);
      danseur.position.y = 0.03 * Math.abs(Math.sin(b));
      tete.rotation.z = 0.07 * d;
    } else if (g === 'grimper') {
      // monter à une échelle : les mains l'une au-dessus de l'autre, devant le visage (pas dedans : la tête est
      // grosse), les genoux qui montent tour à tour
      const o = Math.sin(t * 7.5);
      B.rotation.x = -1.75 - 0.22 * o; G.rotation.x = -1.75 + 0.22 * o; B.rotation.z = 0.32; G.rotation.z = -0.32;
      jambes[0].rotation.x = -0.55 * Math.max(0, o); jambes[1].rotation.x = -0.55 * Math.max(0, -o);
      corps.rotation.x = -0.06; tete.rotation.x = -0.12;
    } else if (g === 'offrir') {
      // se pencher et poser quelque chose devant soi, des deux mains
      const s = Math.sin(Math.min(1, t / 1.2) * PI);
      corps.rotation.x = 0.55 * s; tete.rotation.x = 0.3 * s;
      B.rotation.x = G.rotation.x = -1.05 * s; B.rotation.z = 0.1; G.rotation.z = -0.1;
    } else if (g === 'baguettes') {
      // attraper des nouilles au vol (Takachiho) : le bol dans la main gauche, la droite plonge ses baguettes dans le
      // bambou, puis remonte
      const u = Math.min(1, t / 0.35), plonge = Math.sin(u * PI);
      B.rotation.x = -1.0 - 0.5 * plonge; B.rotation.z = 0.3 + 0.12 * plonge;
      G.rotation.x = -0.85; G.rotation.z = -0.32;
      corps.rotation.x = 0.06 + 0.2 * plonge; tete.rotation.x = 0.18 + 0.1 * plonge;
    }
  }

  let phase = 0, salut = 0, foulee = 0, assis = false, danse = false, tDanse = 0, geste = null, tGeste = 0, rame = null;
  return {
    objet: racine,
    /** Une petite courbette (on lui parle, il remercie…). */
    saluer() { salut = 1; },
    /**
     * Ramer (Takachiho, 2026-10-25) : assis dans la barque, tourné vers l'arrière comme les rameurs, les mains sur les deux
     * rames ; phase (radians) : où en est le coup de rame (les bras tendus vers l'avant à l'attaque, puis tirés vers la
     * poitrine, le corps qui se penche et se redresse) ; null : plus de rames.
     */
    ramer(p) { rame = p; },
    /** Assis sur un banc (oui) ou debout : les jambes tendues devant (la racine posée à la hauteur du siège moins ASSIS). */
    asseoir(oui) { assis = oui; },
    /** La danse des fêtes (oui), ou plus ; t0 : où en est la musique (en battements), pour danser en mesure. */
    danser(oui, t0 = 0) { danse = oui; tDanse = t0; },
    /** Un geste ('victoire', 'saut', 'salut', 'coeur', 'coucou', 'creuser', 'offrir', 'prier', 'washi', 'kokiriko', 'grimper', 'baguettes'), ou null. */
    geste(g) { if (g !== geste) tGeste = 0; geste = g; },
    /**
     * Porter la pièce id (tenues.js) à sa place ('tete', 'yeux', 'habit', 'dos', 'cou') : sur la tête, elle remplace la casquette ou
     * le chapeau ('defaut' : les remettre ; 'nue' : rien) ; 'aucune' : rien sur les yeux ; 'habit-defaut' : les habits de
     * tous les jours ; sur le dos, le sac ('sac') ou le mino. (Ce qu'on laisse sous ses pas et ce que porte le compagnon
     * ne sont pas sur le voyageur.)
     */
    porter(place, id) {
      if (place === 'habit') { habiller(id); return; }
      // sur le dos : le sac de tous les jours ('sac'), ou le mino (la cape de paille de Gokayama), qui le cache
      if (place === 'dos') {
        if (dosPorte) dosPorte.visible = false;
        dosPorte = null;
        if (id === 'mino') {
          if (!pieces.mino) { pieces.mino = maillage(capeMino(THREE, atelier()).fin(0, false)); corps.add(pieces.mino); }
          pieces.mino.visible = true;
          dosPorte = pieces.mino;
        }
        // les ailes du phénix (le Pavillon d'or) : deux pivots entre les omoplates
        if (id === 'ailes') {
          if (!ailes) {
            const objet = new THREE.Group();
            const cotes = [-1, 1].map((s) => { const g = new THREE.Group(); g.position.set(s * 0.07, 0.76, -0.15); g.add(maillage(ailePhenix(s).fin(0, false))); objet.add(g); return g; });
            ailes = { objet, cotes };
            corps.add(objet);
            animerAiles(1, 0, false);
          }
          ailes.objet.visible = true;
          dosPorte = ailes.objet;
        }
        // la cape en plumes de cormoran (Udo) : le haut sur les épaules, l'ourlet en six morceaux, chacun sur son pivot
        if (id === 'cormoran') {
          if (!cape) {
            const objet = new THREE.Group(), c = capeCormoran(THREE, atelier), haut = maillage(c.haut.fin(0, false));
            objet.add(haut);
            const ourlet = c.ourlet.map((o) => { const g = pivot(ctx, ...o.pivot, maillage(o.a.fin(0, false))); objet.add(g); return { g, axe: new THREE.Vector3(...o.axe), t: o.t }; });
            cape = { objet, haut, ourlet };
            corps.add(objet);
          }
          cape.objet.visible = true;
          dosPorte = cape.objet;
        }
        majSac();
        return;
      }
      // au cou : rien ('cou-rien'), le collier de magatama (Takachiho), l'étole et la conque du yamabushi (les Trente Bouddhas)
      if (place === 'cou') {
        auCou = id === 'magatama' || id === 'yamabushi' ? id : false;
        majCollier();
        majFoulard();
        return;
      }
      if (place !== 'tete' && place !== 'yeux') return;
      if (place === 'tete') {
        coiffe.visible = id === 'defaut';
        if (dessus) dessus.visible = id !== 'defaut' && id !== 'kabuto' && id !== 'heron' && id !== 'champignon';
        if (id === 'renard' && !queue) { queue = queueRenard(); corps.add(queue); }
        if (queue) queue.visible = id === 'renard';
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
      animerAiles(dt, vitesse, danse || geste === 'saut' || geste === 'victoire');
      animerCape(dt, vitesse, danse || geste === 'saut' || geste === 'victoire');
      animerQueue(dt, vitesse);
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
        if (rame !== null) {
          // (o = −1 : l'attaque, les pelles du côté de la proue ; o = 1 : la fin du coup, du côté de la poupe — balade.js, piloter)
          // à l'attaque, penché vers la poupe, les bras tendus, les genoux pliés ; puis il tire : les poignées vers la
          // poitrine, le buste qui se redresse en arrière, les jambes qui poussent ; la tête suit un peu en retard
          const o = Math.sin(rame), tire = 0.5 + 0.5 * o;
          bras[0].rotation.x = bras[1].rotation.x = -1.35 + 0.65 * tire;
          bras[0].rotation.z = 0.42; bras[1].rotation.z = -0.42;
          corps.rotation.x = 0.04 - 0.24 * o;
          tete.rotation.x = 0.1 * Math.sin(rame - 0.5);
          jambes[0].rotation.x = jambes[1].rotation.x = -1.15 + 0.2 * o;
          return 0;
        }
        // (un geste, même assis : prendre le miroir depuis la barque)
        if (geste) { tGeste += dt; poseGeste(geste, tGeste); jambes[0].rotation.x = jambes[1].rotation.x = -1.3; tete.rotation.y = 0; return 0; }
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
 * Pour Gokayama (2026-10-23) : chapeau 'sugegasa' (le chapeau de paille conique), mino (la cape de paille, sur le dos),
 * instrument 'sasara' (la binzasara : des lamelles de bois enfilées en arc, qu'on fait claquer) ou 'kokiriko' (les deux
 * baguettes de bambou), pose 'kokiriko' (le danseur, debout) ou 'balai' (balayer la cour du sanctuaire).
 * Pour le kagura de Takachiho (2026-10-25) : masque 'okame' (le visage rond et rieur d'Uzume, la déesse qui dansa devant la
 * grotte) ou 'tajikarao' (le dieu de la force, rouge, les yeux d'or), coiffure 'criniere' (sa grande crinière), instrument
 * 'suzu' (les grelots en grappe, dans la main droite, et le gohei de papier dans la gauche), pose 'kagura' (danser) ;
 * pose 'ramer' (assis dans une barque).
 * Pour Kinkaku-ji (2026-10-26) : coiffure 'rase' (le crâne rasé d'un moine : pas un cheveu), pose 'drapeau' (la guide lève
 * son petit drapeau) ou 'tailler' (le jardinier et ses cisailles), instrument 'pinceau' (écrire, assis).
 * Pour Motonosumi (2026-10-29) : pose 'peche' (la canne tenue à deux mains, immobile) ; ligne { loin, bas } : où sa ligne
 * entre dans l'eau, en mètres depuis ses pieds (loin devant lui, bas plus bas) ; le passant ne se tourne pas en parlant
 * (fixe, monde.js) : sa ligne reste dans l'eau.
 * Renvoie { objet, animer(dt, vitesse, temps), saluer(), asseoir(oui) }.
 */
// (la pose 'peche' : le bras droit levé de PECHE_BRAS, sans bouger ; la canne monte de PECHE_ANGLE au-dessus de l'horizontale ;
// sa longueur depuis la main ; la ligne est calculée pour cette pose)
const PECHE_BRAS = -0.95, PECHE_ANGLE = 0.55, PECHE_CANNE = 3.3;
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
  // (2026-10-24 : le buste plus plat devant-derrière, la taille un peu marquée, comme le voyageur)
  const taille = (x, y, z) => { const k = 1 - 0.07 * Math.exp(-(((y + 0.06) / 0.1) ** 2)); return [x * k, y, z * k]; };
  const b = atelier()
    .piece(new THREE.CylinderGeometry(0.155, 0.19, 0.34, 16, 4), T.haut, { y: 0.6, sz: 0.9, deformer: taille })
    .ovale(0.158, T.haut, { y: 0.77, sy: 0.45, sz: 0.9 }, 14)
    .cylindre(0.05, 0.056, 0.08, 10, T.peau, { y: 0.815 });
  // l'obi, la large ceinture d'un kimono (sauf sous un hakama, qui la cache), et son nœud dans le dos
  if (T.manches === 'kimono' && !long) {
    const OB = T.obi || T.col || '#3a2c24';
    b.cylindre(0.172, 0.178, 0.1, 16, OB, { y: 0.55, sz: 0.92 })
      .boite(0.2, 0.09, 0.07, OB, { y: 0.56, z: -0.18 })
      .cylindre(0.174, 0.174, 0.012, 16, T.haut, { y: 0.552, sz: 0.93, trait: false });
  }
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
  if (T.tablier) {
    // le tablier (2026-10-24 : une plaque plate qui flottait devant le buste, comme une feuille tenue à la main) : un pan
    // courbe qui suit le devant du corps, de la taille aux genoux (plus ample sur une jupe), et sa ceinture nouée
    const bas0 = bas.sorte === 'jupe' || long ? 0.32 : 0.25, haut0 = bas.sorte === 'jupe' || long ? 0.2 : 0.215;
    b.piece(new THREE.CylinderGeometry(haut0, bas0, 0.42, 14, 2, true, -0.95, 1.9), T.tablier, { y: 0.41 })
      .cylindre(0.2, 0.2, 0.035, 16, T.tablier, { y: 0.61, sz: 0.93 });
  }
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
  if (T.mino) capeMino(THREE, b, { y: 0.79, k: 1.04 });
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
  // la sasara (binzasara) de la kokiriko : une centaine de lamelles de bois enfilées en arc (ici, une vingtaine), tenue
  // par ses deux poignées ; elle monte, descend et claque pendant la danse (voir animer)
  let sasara = null;
  if (I === 'sasara') {
    const sa = atelier();
    for (let k = 0; k <= 22; k++) {
      const a = PI * (k / 22);
      sa.boite(0.011, 0.11, 0.045, k % 2 ? '#e8d29a' : '#d9bf80', { x: Math.cos(a) * 0.15, y: Math.sin(a) * 0.15, rz: a - PI / 2, trait: k % 4 === 0 });
    }
    for (const sx of [-1, 1]) {
      sa.cylindre(0.017, 0.017, 0.09, 6, '#5a3a24', { x: sx * 0.15, y: -0.04 })
        .baton([sx * 0.15, -0.085, 0], [sx * 0.17, -0.2, 0.02], 0.006, sx > 0 ? '#d8302c' : '#f3efe4', 3, { trait: false });
    }
    sasara = pivot(ctx, 0, 0.6, 0.25, maillage(sa.fin(0, false)));
    corps.add(sasara);
  }

  // les bras (pivot à l'épaule) : manche, avant-bras, main ; les larges manches d'un kimono
  const bras = [-1, 1].map((s) => {
    const a = atelier();
    // (2026-10-24 : la manche de kimono qui pend, arrondie ; la main a son pouce, comme celle du voyageur)
    const main = (y) => a.ovale(0.05, T.peau, { y, z: 0.01, sx: 0.8, sy: 1.08 }, 10).ovale(0.021, T.peau, { x: -s * 0.024, y: y + 0.024, z: 0.035, sy: 1.4, rx: 0.3, trait: false }, 6);
    if (T.manches === 'kimono') {
      a.cylindre(0.07, 0.075, 0.22, 10, T.haut, { y: -0.1 })
        .ovale(0.15, T.haut, { x: s * 0.015, y: -0.17, z: -0.03, sx: 0.5, sy: 0.95, sz: 0.78 }, 12)
        .cylindre(0.05, 0.05, 0.06, 10, T.col || T.haut, { y: -0.245, trait: false });
      main(-0.29);
    } else {
      const longues = T.manches === 'longues';
      a.cylindre(0.06, 0.065, longues ? 0.26 : 0.13, 10, T.haut, { y: longues ? -0.11 : -0.05 })
        .cylindre(0.045, 0.05, 0.17, 8, longues ? T.haut : T.peau, { y: -0.18 });
      if (!longues) a.cylindre(0.066, 0.066, 0.025, 10, T.haut, { y: -0.115, trait: false });
      main(-0.3);
    }
    if (T.canne && s === 1) a.baton([0, -0.3, 0.02], [0.02, -0.72, 0.12], 0.022, '#7a5232', 6);
    if (T.pose === 'danse' && s === -1) {
      // l'éventail ouvert du nō (chūkei) : un demi-disque doré au cœur rouge, tenu par la main
      a.piece(new THREE.CircleGeometry(0.3, 14, -PI * 0.35, PI * 0.7), P.or, { y: -0.3, z: 0.05, rx: -PI / 2, ry: PI / 2, teinte: (x, y, z) => (Math.hypot(x, z) < 0.12 ? '#c8372d' : P.or) })
        .baton([0, -0.3, 0.02], [0, -0.3, 0.32], 0.012, '#3a2420', 4, { trait: false });
    }
    if (T.instrument === 'taiko') a.baton([0, -0.3, 0.02], [0, -0.32, 0.26], 0.012, '#3a2420', 4, { trait: false });
    if (T.instrument === 'suzu' && s === -1) {
      // les grelots du kagura (kagura-suzu) : un manche, trois étages de petites cloches d'or autour d'une tige, et les
      // rubans des cinq couleurs qui pendent du manche
      a.baton([0, -0.28, 0.02], [0, -0.5, 0.02], 0.011, '#c8302c', 5, { trait: false });
      for (const [y, n, r] of [[-0.44, 7, 0.036], [-0.475, 5, 0.026], [-0.505, 3, 0.014]]) {
        for (let k = 0; k < n; k++) a.boule(0.014, P.or, { x: Math.cos((k / n) * 2 * PI) * r, y, z: 0.02 + Math.sin((k / n) * 2 * PI) * r, trait: false }, 1);
      }
      ['#2f6fb0', '#f2c443', '#e8452e', '#f4f0e6', '#5aa64a'].forEach((c, k) => a.boite(0.012, 0.2, 0.004, c, { x: (k - 2) * 0.012, y: -0.18, z: 0.035 + (k % 2) * 0.004, rz: (k - 2) * 0.06, trait: false }));
    }
    if (T.instrument === 'suzu' && s === 1) {
      // le gohei : un bâton blanc d'où pendent des bandes de papier pliées en zigzag
      a.baton([0, -0.28, 0.02], [0, -0.66, 0.02], 0.01, '#f4f0e6', 5, { trait: false });
      for (const dx of [-1, 1]) for (let k = 0; k < 4; k++) a.boite(0.05, 0.05, 0.006, '#fbfaf4', { x: dx * (0.03 + (k % 2) * 0.02), y: -0.6 + k * 0.045, z: 0.02, rz: dx * (k % 2 ? 0.4 : -0.4), trait: false });
    }
    // les baguettes de la kokiriko : deux bâtons de bambou peints, un dans chaque main
    if (T.instrument === 'kokiriko') a.baton([0, -0.3, 0.02], [-s * 0.02, -0.34, 0.25], 0.011, '#d8c27a', 5, { trait: false }).boite(0.026, 0.026, 0.03, '#d8302c', { x: -s * 0.018, y: -0.337, z: 0.21, trait: false });
    // (le Pavillon d'or, 2026-10-26) le petit drapeau de la guide, levé ; les longues cisailles du jardinier qui taille un pin ;
    // le pinceau du moine des goshuin
    // (le bâton et les lames prolongent le bras au-delà de la main : le bras levé, ils montent)
    if (T.pose === 'drapeau' && s === -1) a.baton([0, -0.3, 0.02], [0, -1.22, 0.04], 0.009, '#3a3a40', 4).boite(0.006, 0.14, 0.22, '#e8702a', { y: -1.12, z: 0.15, trait: false }).boule(0.016, '#e8b941', { y: -1.24, z: 0.04, trait: false }, 0);
    if (T.pose === 'tailler' && s === -1) {
      for (const d of [-1, 1]) a.baton([d * 0.01, -0.3, 0.03], [d * 0.035, -0.78, 0.05], 0.01, '#a8b0b8', 4, { trait: false });
      a.baton([0, -0.27, 0.03], [0, -0.36, 0.03], 0.018, '#7a5232', 5);
    }
    if (T.instrument === 'pinceau' && s === -1) a.baton([0, -0.3, 0.03], [0.01, -0.25, 0.2], 0.008, '#4a3020', 4, { trait: false }).cone(0.012, 0.04, 5, '#1c1714', { x: 0.01, y: -0.255, z: 0.215, rx: PI / 2, trait: false });
    // la canne à pêche (la main droite, la gauche dessous) : la poignée de liège, le scion, le moulinet sous la canne ; la
    // ligne, de la pointe jusqu'à l'eau visée (T.ligne), droite (2026-10-29, Motonosumi : sa canne lui sortait de la tête, et
    // la ligne tombait sur les rochers)
    if (T.pose === 'peche' && s === -1) {
      const ca = Math.cos(PECHE_BRAS), sa = Math.sin(PECHE_BRAS), k = T.taille || 1;
      // (du corps au bras, tourné de PECHE_BRAS autour de x, et retour)
      const versBras = ([x, y, z]) => [x, y * ca + z * sa, -y * sa + z * ca], versCorps = ([x, y, z]) => [x, y * ca - z * sa, y * sa + z * ca];
      const d = versBras([0, Math.sin(PECHE_ANGLE), Math.cos(PECHE_ANGLE)]), h = [0, -0.3, 0.03], pt = (f) => h.map((v, i) => v + d[i] * f);
      a.baton(pt(-0.3), pt(0.22), 0.022, '#c8a070', 5).baton(pt(0.22), pt(PECHE_CANNE), 0.011, '#2a2a30', 5, { trait: false });
      const sous = versBras([0, -Math.cos(PECHE_ANGLE), Math.sin(PECHE_ANGLE)]), m = pt(0.12).map((v, i) => v + sous[i] * 0.07);
      a.cylindre(0.045, 0.045, 0.05, 10, '#9aa0a6', { x: m[0], y: m[1], z: m[2], rz: PI / 2, trait: false });
      if (T.ligne) {
        // (la pointe dans le corps : l'épaule, plus la pointe tournée ; le point d'eau, à la même distance de côté que l'épaule)
        const p = versCorps(pt(PECHE_CANNE)), pointe = [s * 0.205 + p[0], 0.75 + p[1], p[2]], eau = [s * 0.205, -T.ligne.bas / k, T.ligne.loin / k];
        const v = versBras(eau.map((c, i) => c - pointe[i])), b = pt(PECHE_CANNE);
        a.baton(b, b.map((c, i) => c + v[i]), 0.004, '#eef0ee', 3, { trait: false });
      }
    }
    // le balai de bambou (la main droite) : le long manche, la touffe de brindilles au bout
    if (T.pose === 'balai' && s === -1) {
      a.baton([0, -0.28, 0.02], [0.06, -0.92, 0.36], 0.014, '#b8955a', 5)
        .cone(0.13, 0.36, 9, '#c9a65a', { x: 0.075, y: -1.06, z: 0.43, rx: PI - 0.5, sz: 0.4 });
    }
    const br = pivot(ctx, s * 0.205, 0.75, 0, maillage(a.fin(0, false)));
    br.rotation.z = s * 0.12;
    corps.add(br);
    return br;
  });

  // la tête (pivot au cou) : le visage (2026-10-24, comme celui du voyageur : la mâchoire qui s'affine, de grands yeux
  // — l'iris, son reflet clair en bas, la pupille, deux reflets, le trait des cils —, ou plissés en arc pour les
  // anciens ; des sourcils de la couleur des cheveux, un petit nez, un sourire, les joues roses), cheveux, chapeau,
  // lunettes. Les yeux ne clignent pas (ils seraient des morceaux à part : plus d'appels de dessin par passant).
  const R = 0.3, CY = 0.25;
  const surVisage = (lx, ly, ecart = 0) => {
    const ry = Math.asin(lx / R), rx = -Math.asin(ly / (R * Math.cos(ry))), z = Math.sqrt(R * R - lx * lx - ly * ly) + ecart;
    return { x: lx, y: CY + ly, z, rx, ry };
  };
  const machoire = (x, y, z) => (y < 0 ? [x * (1 + 0.14 * (y / R)), y * 1.03, z * (1 + 0.05 * (y / R))] : [x, y, z]);
  const t = atelier()
    .ovale(R, T.peau, { y: CY, sx: 1.04, deformer: machoire }, 18)
    .ovale(0.05, T.peau, { x: -0.3, y: 0.22, sz: 0.6 }, 8)
    .ovale(0.05, T.peau, { x: 0.3, y: 0.22, sz: 0.6 }, 8);
  const SOURCILS = T.coiffure === 'chauve' || /^#[cdef]/i.test(T.cheveux || '') ? '#8a7f74' : T.cheveux;
  const cercle = (r, c, o, n = 14) => t.piece(new THREE.CircleGeometry(r, n), c, { trait: false, ...o });
  for (const s of [-1, 1]) {
    t.ovale(0.034, P.joue, { ...surVisage(s * 0.168, -0.088, -0.004), sx: 1.3, sy: 0.62, sz: 0.25, trait: false }, 8)
      .piece(new THREE.TorusGeometry(0.042, 0.0068, 3, 8, PI * 0.6), SOURCILS, { ...surVisage(s * 0.108, 0.075, 0.002), rz: PI * 0.2 - s * 0.08, trait: false });
    if (T.masque) continue;
    const q = surVisage(s * 0.104, -0.022, 0.001), sur = (dx, dy, dz) => {
      // (un point du plan de l'œil, tourné comme lui : la rotation y, puis x, comme les angles d'Euler « XYZ »)
      const cy = Math.cos(q.ry), sy = Math.sin(q.ry), cx = Math.cos(q.rx), sx = Math.sin(q.rx);
      const x1 = dx * cy + dz * sy, z1 = -dx * sy + dz * cy;
      return { x: q.x + x1, y: q.y + dy * cx - z1 * sx, z: q.z + dy * sx + z1 * cx, rx: q.rx, ry: q.ry };
    };
    if (T.yeux === 'plisses') {
      // les yeux plissés d'un sourire : un arc
      t.piece(new THREE.TorusGeometry(0.034, 0.008, 3, 9, PI * 0.8), P.oeil, { ...sur(0, -0.01, 0.002), rz: PI * 0.1, trait: false });
    } else {
      cercle(0.042, P.oeil, { ...sur(0, 0, 0), sx: 0.84, sy: 1.2 });
      cercle(0.028, T.iris || '#8a5a3a', { ...sur(0, -0.024, 0.001), sx: 0.95, sy: 0.5 });
      cercle(0.022, '#1a1214', { ...sur(0, 0.005, 0.002), sx: 0.8, sy: 1.1 });
      cercle(0.012, P.reflet, { ...sur(s * 0.012, 0.022, 0.003) }, 10);
      cercle(0.006, P.reflet, { ...sur(-s * 0.01, -0.02, 0.003) }, 8);
      t.piece(new THREE.TorusGeometry(0.04, 0.0068, 3, 12, PI), P.oeil, { ...sur(0, 0.003, 0.003), sx: 0.9, sy: 1.22, sz: 0.5, trait: false });
    }
  }
  if (!T.masque) {
    t.ovale(0.011, '#f0b796', { ...surVisage(0, -0.07, -0.002), sz: 0.6, trait: false }, 6)
      .piece(new THREE.TorusGeometry(0.021, 0.0055, 3, 8, PI * 0.72), '#a8443c', { ...surVisage(0, -0.112, 0.001), rz: PI * 1.14, trait: false });
  }
  if (T.lunettes) {
    for (const s of [-1, 1]) t.piece(new THREE.TorusGeometry(0.06, 0.009, 4, 14), '#3a3236', { x: s * 0.105, y: 0.22, z: 0.29, trait: false });
    t.boite(0.07, 0.012, 0.01, '#3a3236', { y: 0.235, z: 0.3, trait: false });
  }
  if (T.masque === 'okame') {
    // le masque d'Okame (Uzume, la déesse qui dansa devant la grotte d'Amaterasu) : un visage tout rond, les joues
    // pleines et roses, les yeux plissés de rire, les deux sourcils peints en haut du front, la toute petite bouche rouge
    const MQ = '#fbf6ee';
    t.ovale(0.212, MQ, { y: 0.2, z: 0.115, sx: 1.12, sy: 1.08, sz: 0.95 }, 16);
    for (const s of [-1, 1]) {
      t.ovale(0.07, '#f2b4ab', { x: s * 0.115, y: 0.13, z: 0.25, sx: 1.15, sy: 0.85, sz: 0.4, trait: false }, 10)
        .piece(new THREE.TorusGeometry(0.03, 0.007, 3, 9, PI * 0.8), '#2a2420', { x: s * 0.07, y: 0.235, z: 0.312, rz: PI * 0.1, trait: false })
        .ovale(0.022, '#2a2420', { x: s * 0.065, y: 0.36, z: 0.285, sx: 1.3, sy: 0.7, sz: 0.4, trait: false }, 6);
    }
    t.ovale(0.016, '#c8372d', { y: 0.085, z: 0.31, sx: 1.2, sy: 0.75, sz: 0.5, trait: false }, 6);
  } else if (T.masque === 'tajikarao') {
    // le masque de Tajikarao (le dieu de la force, qui arracha la porte de la grotte) : rouge, les sourcils épais froncés,
    // les grands yeux d'or, le gros nez, la bouche ouverte qui crie, ses dents
    const MQ = '#c8402c';
    t.ovale(0.212, MQ, { y: 0.2, z: 0.12, sx: 1.06, sy: 1.14, sz: 0.95 }, 16);
    for (const s of [-1, 1]) {
      t.boite(0.12, 0.034, 0.03, '#2a2420', { x: s * 0.075, y: 0.315, z: 0.29, rz: s * 0.38 })
        .ovale(0.036, '#f2c443', { x: s * 0.075, y: 0.245, z: 0.3, sx: 1.25, sy: 0.9, sz: 0.4, trait: false }, 8)
        .ovale(0.016, '#2a2420', { x: s * 0.075, y: 0.245, z: 0.316, sz: 0.4, trait: false }, 6);
    }
    t.ovale(0.045, '#b8362a', { y: 0.17, z: 0.315, sx: 1.25, sy: 0.85, sz: 0.65 }, 8)
      .ovale(0.05, '#3a1414', { y: 0.075, z: 0.29, sx: 1.6, sy: 0.75, sz: 0.5, trait: false }, 8)
      .boite(0.1, 0.018, 0.012, '#f4f0e6', { y: 0.098, z: 0.312, trait: false });
  } else if (T.masque) {
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
    // le crâne dégarni : une couronne de cheveux derrière et sur les côtés, d'une tempe à l'autre, au-dessus des oreilles
    // (un peu plus bas derrière, vers la nuque), ses deux bouts arrondis ; le front et le visage dégagés. (Avant le
    // 2026-10-29, l'arc tournait du mauvais côté : la couronne passait devant le visage, à la hauteur des yeux — « la
    // calvitie au milieu des yeux » — et s'ouvrait derrière.)
    const ARC = PI * 1.2, PENTE = 0.2, RC = 0.27, Y0 = CY + 0.05, zb = -RC * Math.cos(ARC / 2);
    t.piece(new THREE.TorusGeometry(RC, 0.065, 8, 18, ARC), C1, { y: Y0, rx: PI / 2 - PENTE, rz: -PI / 2 - ARC / 2 });
    for (const s of [-1, 1]) t.ovale(0.065, C1, { x: s * RC * Math.sin(ARC / 2), y: Y0 + zb * Math.sin(PENTE), z: zb * Math.cos(PENTE) }, 10);
    // sous elle, derrière les oreilles, les cheveux descendent jusqu'à la nuque (seule, de dos, on aurait dit un bandeau)
    t.piece(new THREE.SphereGeometry(R * 1.027, 10, 5, PI * 1.11, PI * 0.78, PI * 0.5, PI * 0.28), C1, { y: CY, sx: 1.04, deformer: machoire });
  } else if (T.coiffure !== 'rase') {
    // une calotte inclinée vers l'arrière (le front dégagé) et des mèches sur le front
    t.piece(new THREE.SphereGeometry(0.318, 18, 10, 0, 2 * PI, 0, PI * 0.56), C1, { y: 0.25, rx: -0.42 });
    for (const [x, rz, l] of [[-0.17, 0.5, 0.13], [-0.085, 0.24, 0.16], [0, 0, 0.15], [0.085, -0.26, 0.16], [0.17, -0.52, 0.13]]) {
      t.cone(0.06, l, 4, C1, { x, y: CY + 0.16, z: 0.258 - Math.abs(x) * 0.35, rx: PI - 0.55, rz, sz: 0.5 });
    }
    for (const s of [-1, 1]) t.cone(0.045, 0.12, 4, C1, { x: s * 0.27, y: CY + 0.03, z: 0.07, rx: PI - 0.15, rz: s * 0.2, sz: 0.5 });
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
  } else if (T.coiffure === 'criniere') {
    // la crinière du kagura : une grande masse de cheveux qui se dresse autour du masque et retombe dans le dos
    t.ovale(0.3, C1, { y: 0.2, z: -0.08, sx: 1.12, sy: 1.06, sz: 0.95 }, 14)
      .boite(0.52, 0.72, 0.1, C1, { y: -0.24, z: -0.26, rx: 0.1 });
    for (let k = 0; k < 15; k++) {
      // des mèches en pointe, tout autour du haut et de l'arrière de la tête
      const a = -PI * 0.92 + (k / 14) * PI * 1.84, e = 0.25 + 0.55 * ((k * 0.618) % 1);
      const dx = Math.sin(a) * Math.cos(e), dy = Math.sin(e), dz = -Math.cos(a) * Math.cos(e) * 0.9 - 0.1;
      const l = 0.22 + 0.1 * ((k * 0.37) % 1), n = Math.hypot(dx, dy, dz);
      t.cone(0.075, l, 4, C1, { x: (dx / n) * (0.3 + l * 0.35), y: CY + (dy / n) * (0.3 + l * 0.35), z: (dz / n) * (0.3 + l * 0.35), rx: Math.acos(dy / n) * (dz > 0 ? 1 : -1), rz: -Math.atan2(dx, dy) * 0.6, sz: 0.55 });
    }
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
  } else if (H?.sorte === 'sugegasa') {
    // le chapeau de paille conique des paysans (sugegasa), et son cordon sous le menton
    t.cone(0.52, 0.26, 20, H.c, { y: 0.63, rx: -0.08, teinte: (x, y, z) => (Math.floor(Math.hypot(x, z) / 0.06) % 2 ? H.c : H.c2 || H.c) })
      .baton([-0.27, 0.42, 0.04], [0, 0.02, 0.17], 0.008, '#5a3a24', 4, { trait: false }).baton([0.27, 0.42, 0.04], [0, 0.02, 0.17], 0.008, '#5a3a24', 4, { trait: false });
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
        if (T.pose === 'ramer') {
          // un promeneur qui rame (Takachiho) : le même mouvement que le voyageur, à son rythme (la même phase que ses rames :
          // takachiho.js, promeneurs ; la poussée plus vive que le retour)
          const ph = temps * 2.6 + decalage, o = Math.sin(ph + 0.35 * Math.sin(ph)), tire = 0.5 + 0.5 * o;
          bras[0].rotation.x = bras[1].rotation.x = -1.35 + 0.65 * tire;
          bras[0].rotation.z = 0.42; bras[1].rotation.z = -0.42;
          corps.rotation.x = 0.04 - 0.24 * o;
        }
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
        } else if (I === 'kokiriko') {
          // les deux baguettes qu'on frappe l'une contre l'autre, en mesure (« kon, kon »)
          const k = coup(temps * (100 / 60) + decalage);
          bras[0].rotation.x = bras[1].rotation.x = -1.05;
          bras[0].rotation.z = -0.16 - 0.32 * (1 - k); bras[1].rotation.z = 0.16 + 0.32 * (1 - k);
        } else if (I === 'pinceau') {
          // écrire au pinceau, penché sur la feuille : la main droite trace, la gauche tient le cahier
          bras[0].rotation.x = -0.95 + 0.07 * Math.sin(temps * 3.1 + decalage); bras[0].rotation.z = 0.12 + 0.1 * Math.sin(temps * 1.7 + decalage);
          bras[1].rotation.x = -0.75; bras[1].rotation.z = -0.25;
          corps.rotation.x = 0.16 + courbe;
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
      } else if (T.pose === 'kokiriko') {
        // la danse de la kokiriko : des pas glissés de côté, le corps qui tourne, la sasara qu'on lève et qu'on abaisse
        // en la faisant claquer (« jararan »), au rythme de la chanson (environ 100 battements par minute)
        const b = temps * (100 / 60) * PI + decalage, s = 0.5 + 0.5 * Math.sin(b), d = Math.sin(b / 2);
        bras[0].rotation.x = bras[1].rotation.x = -0.75 - 1.05 * s;
        bras[0].rotation.z = -0.3; bras[1].rotation.z = 0.3;
        if (sasara) {
          sasara.rotation.x = 0.25 - 0.95 * s;
          sasara.position.set(0, 0.6 + 0.22 * s, 0.25 + 0.06 * s);
          sasara.scale.x = 0.86 + 0.14 * Math.abs(Math.sin(b * 2));
        }
        corps.rotation.y = 0.35 * d;
        jambes[0].rotation.x = 0.25 * Math.max(0, d); jambes[1].rotation.x = 0.25 * Math.max(0, -d);
        corps.position.y = 0.03 * Math.abs(Math.sin(b)) + respire;
        tete.rotation.z = 0.08 * d;
      } else if (T.pose === 'drapeau') {
        // la guide lève son petit drapeau pour que son groupe la suive (le bras en V, à côté de la grosse tête), et l'agite un peu
        bras[0].rotation.x = -2.2 - 0.1 * Math.sin(temps * 2.3 + decalage); bras[0].rotation.z = -0.75;
      } else if (T.pose === 'tailler') {
        // tailler un pin perché sur l'escabeau : les bras levés devant, les cisailles qui coupent par petits coups
        const c = Math.max(0, Math.sin(temps * 5.5 + decalage));
        bras[0].rotation.x = -1.95 - 0.12 * c; bras[1].rotation.x = -1.8; bras[0].rotation.z = 0.2; bras[1].rotation.z = -0.35;
        corps.rotation.x = -0.05 + courbe; tete.rotation.x = -0.2;
      } else if (T.pose === 'peche') {
        // pêcher : la canne tenue à deux mains, immobile (sa ligne est dans l'eau) ; il regarde au bout de sa ligne, la tête qui
        // bouge un peu ; un salut ne fait que hocher la tête
        bras[0].rotation.x = PECHE_BRAS; bras[0].rotation.z = 0;
        bras[1].rotation.x = -0.62; bras[1].rotation.z = -0.34;
        corps.rotation.x = 0; corps.rotation.y = 0;
        tete.rotation.x = 0.14 + Math.sin(temps * 0.6 + decalage) * 0.03 + courbe * 0.4;
        tete.rotation.y = Math.sin(temps * 0.23 + decalage) * 0.15;
      } else if (T.pose === 'balai') {
        // balayer : le balai va et vient de côté, le corps penché qui suit
        const u = temps * 1.6 + decalage, o = Math.sin(u);
        bras[0].rotation.x = -0.55 + 0.25 * o; bras[1].rotation.x = -0.8 + 0.2 * o;
        bras[0].rotation.z = -0.2 + 0.3 * o; bras[1].rotation.z = 0.4 + 0.25 * o;
        corps.rotation.y = 0.3 * o; corps.rotation.x = 0.2 + courbe;
      } else if (T.pose === 'kagura') {
        if (T.masque === 'tajikarao') {
          // Tajikarao : la force ; il cherche la porte de la grotte, la saisit à pleins bras et l'arrache, en frappant le
          // plancher du pied
          // les poses clés [moment du cycle de 4,2 s, bras (rx), écart des bras (rz), buste penché, hauteur (accroupi)]
          const CLES = [[0, -1.0, 0.35, 0.05, 0], [0.4, -1.55, 0.25, 0.32, -0.07], [0.5, -2.3, 1.05, -0.22, 0.03], [0.8, -2.25, 1.0, -0.2, 0.03], [1, -1.0, 0.35, 0.05, 0]];
          const f = (((temps + decalage) / 4.2) % 1 + 1) % 1;
          let k = 0;
          while (k < CLES.length - 2 && f > CLES[k + 1][0]) k++;
          const A = CLES[k], Bc = CLES[k + 1], v = (f - A[0]) / (Bc[0] - A[0]), w = v * v * (3 - 2 * v), m = (i) => A[i] + (Bc[i] - A[i]) * w;
          const tient = f > 0.5 && f < 0.8 ? 0.03 * Math.sin(temps * 38) : 0;
          bras[0].rotation.x = bras[1].rotation.x = m(1) + tient;
          bras[0].rotation.z = -m(2); bras[1].rotation.z = m(2);
          corps.rotation.x = m(3) + courbe; corps.rotation.y = 0.25 * Math.sin((temps + decalage) * 0.6);
          // (le pied qui frappe le plancher en arrachant la porte)
          const frappe = f > 0.44 && f < 0.56 ? Math.sin(((f - 0.44) / 0.12) * PI) : 0;
          jambes[0].rotation.x = -0.45 * frappe; jambes[1].rotation.x = 0.1 * frappe;
          corps.position.y = m(4) + respire;
        } else {
          // Uzume : la danse lente ; le bras droit levé fait frémir les grelots, le gauche balance le gohei ; elle tourne
          const u = temps * 0.7 + decalage, s2 = 0.5 + 0.5 * Math.sin(u), b = (temps + decalage) * (92 / 60) * PI;
          bras[0].rotation.x = -1.9 - 0.4 * s2 + 0.05 * Math.sin(temps * 26); bras[0].rotation.z = -0.35;
          bras[1].rotation.x = -0.6 - 0.8 * (1 - s2); bras[1].rotation.z = 0.5;
          corps.rotation.y = 0.5 * Math.sin(u * 0.5); corps.rotation.x = 0.04 + courbe;
          tete.rotation.z = 0.12 * Math.sin(u);
          // (les genoux qui plient sur les temps de la musique, un pied puis l'autre qui s'élève : elle danse en mesure)
          corps.position.y = -0.03 * Math.abs(Math.sin(b)) + respire;
          jambes[0].rotation.x = -0.3 * Math.max(0, Math.sin(b / 2)); jambes[1].rotation.x = -0.3 * Math.max(0, -Math.sin(b / 2));
        }
      } else if (T.pose === 'washi') {
        // faire le papier (nagashi-zuki, 2026-10-24) : les deux mains tiennent le bord du cadre pendu au-dessus de la cuve
        // et le balancent d'avant en arrière, le corps penché qui suit (le même sinus que le cadre : gokayama.js)
        const o = Math.sin(temps * 1.8);
        bras[0].rotation.x = bras[1].rotation.x = -1.2 - 0.12 * o;
        bras[0].rotation.z = -0.1; bras[1].rotation.z = 0.1;
        corps.rotation.x = 0.16 + 0.04 * o + courbe;
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
  // (la queue qui bat, les anneaux de Fuwa qui ondulent : leur phase avance de dt × leur rythme. 2026-10-26, « quand il se
  // déplace, sa queue tremble » : c'était sin(temps × rythme), le rythme suivant l'allure ; en marchant, l'allure bouge un peu
  // à chaque image, et la phase sautait de temps × l'écart, de plus en plus fort au fil de la partie)
  let phaseQueue = 0, phaseVol = 0;
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
      phaseQueue += dt * (2 + (loutre ? 5 : 4) * allure);
      phaseVol += dt * (2.6 + 4 * allure);
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
        anneaux.forEach(({ g, p }, i) => {
          const k = (i + 1) / anneaux.length;
          g.position.x = p[0] + (0.035 + 0.03 * allure) * Math.sin(phaseVol - i * 0.85) * k;
          g.position.y = p[1] + 0.03 * Math.sin(phaseVol * 0.8 - i * 0.9) * k;
          g.rotation.y = 0.5 * Math.cos(phaseVol - i * 0.85) * k;
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
        queue.rotation.y = Math.sin(phaseQueue) * (0.15 + 0.2 * allure);
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
        queue.rotation.y = Math.sin(phaseQueue) * (0.3 + 0.25 * allure);
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
        queue.rotation.y = Math.sin(phaseQueue) * (0.35 + 0.25 * allure);
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
  // (2026-10-24, « améliore les animaux ») le corps : un ovoïde sculpté (le poitrail profond devant, le ventre rentré,
  // la croupe ronde), la raie sombre du dos, les rangées de taches blanches du pelage d'été du cerf sika, le miroir
  // blanc de la croupe cerclé de noir et la petite queue ; les pattes en deux morceaux (le haut charnu, le bas fin et
  // plus sombre, le jarret des pattes de derrière qui part en arrière) et leurs sabots noirs
  const PATTE = '#a06d42', DOS = '#9c6538';
  const corpsDaim = (x, y, z) => {
    const l = Math.hypot(x, y, z) || 1, fz = z / l, fy = y / l;
    const k = 1 + 0.08 * Math.max(0, fz) * (1 - Math.abs(fy)) - (fy < 0 ? 0.17 * (1 - Math.abs(fz)) * -fy : 0);
    return [x * k, y * (k + 0.05 * Math.max(0, fz)), z];
  };
  const c = atelier()
    .ovale(0.3, P.daim, { y: 0.78, sx: 0.72, sy: 0.72, sz: 1.35, deformer: corpsDaim }, 16)
    .ovale(0.05, DOS, { y: 0.985, z: 0.02, sx: 0.8, sy: 0.25, sz: 6.5, trait: false }, 8)
    .ovale(0.13, P.noir, { y: 0.82, z: -0.385, sx: 1.12, sy: 1.02, sz: 0.4 }, 10)
    .ovale(0.115, P.daimClair, { y: 0.82, z: -0.395, sx: 1.1, sz: 0.4, trait: false }, 10)
    .ovale(0.05, P.daimClair, { y: 0.9, z: -0.42, sx: 0.7, sy: 1.3, sz: 0.45, rx: -0.4 }, 8)
    .boite(0.015, 0.07, 0.012, P.noir, { y: 0.9, z: -0.445, rx: -0.4, trait: false });
  for (const sx of [-1, 1]) {
    for (let k = 0; k < 7; k++) {
      const z = 0.28 - k * 0.09;
      c.ovale(0.024, P.daimClair, { x: sx * (0.1 + 0.02 * Math.sin(k)), y: 0.965, z, sy: 0.35, trait: false }, 6)
        .ovale(0.02, P.daimClair, { x: sx * 0.17, y: 0.9, z: z - 0.04, sy: 0.4, sx: 0.6, trait: false }, 6);
    }
  }
  for (const [x, z, arriere] of [[-0.12, 0.25, false], [0.12, 0.25, false], [-0.12, -0.26, true], [0.12, -0.26, true]]) {
    const genou = [x, 0.38, z + (arriere ? -0.06 : 0.01)];
    c.ovale(0.075, P.daim, { x, y: 0.62, z: z + (arriere ? -0.02 : 0.02), sx: 0.75, sy: 1.5, sz: 0.95 }, 8)
      .fut([x, 0.66, z], genou, 0.042, 0.03, P.daim, 6)
      .boule(0.03, PATTE, { x: genou[0], y: genou[1], z: genou[2] }, 1)
      .fut(genou, [x, 0.04, z + 0.01], 0.026, 0.02, PATTE, 6)
      .ovale(0.03, P.noir, { x, y: 0.025, z: z + 0.02, sy: 0.75, sz: 1.2 }, 6);
  }
  corps.add(maillage(c.fin(0, false)));
  // le cou part de l'épaule, vers l'avant et le haut ; pour brouter, il pivote jusqu'au sol. La tête : le crâne, le
  // museau qui s'affine, la truffe noire et la bouche, la gorge claire ; les yeux sombres et leur reflet ; les grandes
  // oreilles bordées de sombre, claires dedans ; le mâle a des bois à trois pointes (comme les cerfs sika)
  const t = atelier()
    .fut([0, -0.06, -0.06], [0, 0.31, 0.3], 0.11, 0.075, P.daim, 9)
    .ovale(0.12, P.daim, { y: 0.37, z: 0.37, sx: 0.95, sy: 0.95, sz: 1.1 }, 12)
    .ovale(0.085, P.daim, { y: 0.33, z: 0.49, sx: 0.85, sy: 0.82, sz: 1.35 }, 10)
    .ovale(0.042, P.noir, { y: 0.335, z: 0.6, sx: 1.05, sy: 0.85 }, 8)
    .boite(0.07, 0.008, 0.06, '#5a3a28', { y: 0.27, z: 0.56, trait: false })
    .ovale(0.075, P.daimClair, { y: 0.25, z: 0.36, sx: 0.85, sy: 0.6, sz: 0.85 }, 8)
    .ovale(0.06, P.daimClair, { y: 0.18, z: 0.26, sx: 0.9, sy: 0.9, sz: 0.5 }, 8);
  for (const s of [-1, 1]) {
    t.ovale(0.095, DOS, { x: s * 0.125, y: 0.47, z: 0.31, sx: 0.55, sz: 0.26, rz: s * 0.8 }, 8)
      .ovale(0.072, '#f6e7cc', { x: s * 0.13, y: 0.47, z: 0.325, sx: 0.42, sz: 0.12, rz: s * 0.8, trait: false }, 8)
      .ovale(0.026, '#1e1416', { x: s * 0.088, y: 0.405, z: 0.455, sx: 0.8, sy: 1.0, sz: 0.6 }, 8)
      .ovale(0.008, P.reflet, { x: s * 0.098, y: 0.418, z: 0.47, trait: false }, 5)
      .ovale(0.016, P.daimClair, { x: s * 0.085, y: 0.44, z: 0.43, sx: 1.6, sy: 0.6, sz: 0.5, trait: false }, 6);
    if (male) {
      const B = '#e8d9b8', b0 = [s * 0.05, 0.46, 0.36], b1 = [s * 0.11, 0.62, 0.32], b2 = [s * 0.15, 0.78, 0.25];
      t.fut(b0, b1, 0.02, 0.016, B, 6).fut(b1, b2, 0.016, 0.009, B, 5)
        .boule(0.016, B, { x: b1[0], y: b1[1], z: b1[2] }, 1)
        .fut(b1, [s * 0.15, 0.68, 0.44], 0.012, 0.006, B, 5)
        .fut([s * 0.07, 0.52, 0.35], [s * 0.1, 0.56, 0.45], 0.011, 0.005, B, 5);
    }
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
