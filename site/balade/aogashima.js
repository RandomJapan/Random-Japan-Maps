// ================================================================
//  Aogashima (青ヶ島) : l'île volcanique au bout des îles d'Izu. Dans son grand cratère se dresse un second
//  petit volcan, Maruyama : une « double caldeira ». On arrive par le tunnel, au fond du cratère ; les
//  fumerolles (les « hingya »), le sauna et la marmite chauffés par le volcan, le camping et son ciel
//  étoilé, le petit volcan et son cratère ; un escalier en lacets monte sur la crête, au belvédère et au
//  point le plus haut de l'île, Ōtonbu, face à toute la caldeira et à l'océan. D'après la vidéo du
//  propriétaire (la caldeira vue du ciel, le petit volcan rayé de vert, le belvédère rond en gradins).
//  Repère : x vers l'est, z vers le sud, y vers le haut, en mètres ; le fond du cratère vers y = 0, la mer
//  à y = −40. Les distances sont resserrées (le vrai cratère fait plus d'un kilomètre).
//  ctx : { THREE, atelier, P (palette), peinture }.
// ================================================================
import { creerMonde, lisse, hasard, bruitDoux, surLaLigne } from './monde.js';
import { panneau, trepied } from './decor.js';
import { MATIERES as M } from './textures.js';

const MER = -40;
const MARUYAMA = { x: 5, z: 7, r: 26, h: 16, cratere: 4.6 };
const BELVEDERE = { x: 1, z: -82.1, r: 6.3, creux: 1.12 }; // le belvédère rond, en gradins, sur la crête
const OTONBU = { x: 20, z: -81.6, haut: 3.4, r: 11.5 }; // le point le plus haut de l'île
const HINGYA = { x: -16, z: 23, r: 6.8 }; // les fumerolles, derrière leur corde
const EVENTS = [[-17, 21], [-14.5, 24.5], [-18.5, 25.2], [-13.4, 21.4], [-16, 26.6]];
const SAUNA = { x: -38, z: 10 };
const MARMITE = { x: -30.6, z: 17 };
const CAMPING = { x0: -9, x1: 15, z0: 37, z1: 51 };
const TUNNEL = { a: -0.92 };
// la route (du tunnel au camping) et les chemins de terre (vers l'escalier, au petit volcan, sur la crête)
const ROUTE = [[-41.5, -31.7], [-36, -24], [-31.5, -12], [-30.5, 0], [-31, 10], [-27, 22], [-19, 33], [-8, 39], [4, 41]];

// ---------------------------------------------------------------- Le relief
const angle = (x, z) => Math.atan2(x, -z); // 0 au nord, positif vers l'est
/** Le pied de la paroi du grand cratère (le bord du fond), selon l'angle. */
const rayonPied = (a) => 58 + 3 * Math.sin(2 * a + 0.5) + 2 * Math.sin(5 * a);
const PAROI = 15; // la paroi, du pied à la crête (en largeur)
/**
 * La forme de la paroi (0 au pied, 1 en haut) : un pied arrondi, puis une pente droite et raide jusqu'au bord
 * net de la crête (de là-haut, on voit le fond du cratère) ; et son inverse.
 */
const PIED = 0.12;
const profilParoi = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : (t < PIED ? (t * t) / (2 * PIED) : t - PIED / 2) / (1 - PIED / 2));
const profilInverse = (f) => { const v = Math.min(1, Math.max(0, f)) * (1 - PIED / 2); return v < PIED / 2 ? Math.sqrt(2 * PIED * v) : v + PIED / 2; };
/** La hauteur de la crête : 28 m au nord (Ōtonbu), 16 m au sud. */
const hauteurCrete = (a) => 22 + 5 * Math.cos(a) + 1.2 * Math.sin(3 * a + 1.2) + 0.8 * Math.sin(7 * a);
/** La largeur du dessus de la crête : un plateau au nord (le belvédère, Ōtonbu), une arête ailleurs. */
const largeurCrete = (a) => 4 + 13 * Math.exp(-((a / 0.42) ** 2));
const PLATEAU = [-0.6, 0.7]; // les angles du plateau (seule partie de la crête où l'on va)
const BARRIERE = 0.9; // la barrière de la crête, à 0,9 m du bord, sur le plateau
/** Le pied de la barrière de la crête à l'angle t. */
const surLaBarriere = (t) => { const r = rayonPied(t) + PAROI + BARRIERE; return [r * Math.sin(t), -r * Math.cos(t)]; };
const Y_BELVEDERE = hauteurCrete(angle(BELVEDERE.x, BELVEDERE.z));

/**
 * L'escalier de la paroi nord : une longue volée en diagonale, de l'est (au pied) vers l'ouest (sur la crête),
 * qui suit la pente ; un palier au milieu. [x, z, hauteur] le long du chemin.
 */
const ESCALIER = { a0: 0.5, a1: -0.08 };
const MARCHES = (() => {
  const { a0, a1 } = ESCALIER, haut = hauteurCrete(a1), pts = [];
  for (const s of [0, 0.1, 0.2, 0.3, 0.38, 0.46, 0.54, 0.62, 0.7, 0.8, 0.9, 1]) {
    const a = a0 + (a1 - a0) * s, part = s < 0.46 ? s / 0.92 : s > 0.54 ? (s - 0.08) / 0.92 : 0.5;
    const h = 0.4 + (haut - 0.4) * part, r = rayonPied(a) + PAROI * profilInverse(h / hauteurCrete(a));
    pts.push([r * Math.sin(a), -r * Math.cos(a), h]);
  }
  const r = rayonPied(a1) + PAROI + 3.5;
  pts.push([r * Math.sin(a1), -r * Math.cos(a1), haut]); // un pas sur la crête
  return pts;
})();
const [BAS, HAUT] = [MARCHES[0], MARCHES[MARCHES.length - 1]];
// la partie en marches (sans le pas sur la crête), et sa longueur
const VOLEE = MARCHES.slice(0, -1);
const LONG_VOLEE = VOLEE.slice(1).reduce((l, p, k) => l + Math.hypot(p[0] - VOLEE[k][0], p[1] - VOLEE[k][1]), 0);
// le passage dans la barrière de la crête, au haut de l'escalier : 1,3 m de chaque côté du chemin (comme la main courante)
const OUVERTURE = ((d) => [ESCALIER.a1 - d, ESCALIER.a1 + d])(1.3 / (rayonPied(ESCALIER.a1) + PAROI + BARRIERE));
const BOITE_ESCALIER = [Math.min(...MARCHES.map((p) => p[0])) - 5, Math.max(...MARCHES.map((p) => p[0])) + 5, Math.min(...MARCHES.map((p) => p[1])) - 5, Math.max(...MARCHES.map((p) => p[1])) + 5];
const CHEMINS = [
  [[-31, -11], [-18, -30], [0, -42], [18, -50], [BAS[0], BAS[1]]],
  [[-30.6, 2], [-21, 4]],
  [[HAUT[0], HAUT[1]], [-4, -79.5], [BELVEDERE.x - BELVEDERE.r, BELVEDERE.z]],
  [[HAUT[0], HAUT[1]], [6, -80.6], [13, -82.2], [OTONBU.x, OTONBU.z]],
];

/**
 * Le sol : le fond du cratère (presque plat), la paroi très raide tout autour, la crête (un plateau au nord),
 * puis les flancs de l'île jusqu'à la mer et ses falaises ; Maruyama et son cratère ; l'escalier taillé
 * dans la paroi ; le belvédère creusé en gradins, la butte d'Ōtonbu.
 */
function terrain(x, z) {
  const r = Math.hypot(x, z), a = angle(x, z);
  const r1 = rayonPied(a), r2 = r1 + PAROI, crete = hauteurCrete(a), r3 = r2 + largeurCrete(a);
  let h;
  if (r < r2) {
    h = crete * profilParoi((r - r1) / (r2 - r1));
    // les ravines de la paroi : des plis le long de la pente, comme sur la vidéo
    h += (Math.sin(a * 23) * 1.1 + Math.sin(a * 41 + 1) * 0.55) * lisse(r1 + 1, r1 + 5, r) * (1 - lisse(r2 - 4, r2, r));
    // le fond : de douces bosses
    h += (0.35 * Math.sin(x * 0.11 + 1) * Math.sin(z * 0.09) + 0.2 * Math.sin(x * 0.23 + z * 0.17)) * (1 - lisse(r1, r1 + 4, r));
  } else if (r < r3) {
    h = crete + 0.3 * Math.sin(x * 0.21) * Math.sin(z * 0.17) * lisse(r2, r2 + 3, r) * (1 - lisse(r3 - 3, r3, r));
  } else {
    const d = r - r3;
    h = crete - d * 0.95 - d * d * 0.004;
    if (h < MER + 8) h -= (MER + 8 - h) * 1.2; // la falaise du bord de mer
  }
  // Maruyama : un cône aux flancs creusés, et son cratère
  const m = MARUYAMA, dm = Math.hypot(x - m.x, z - m.z);
  if (dm < m.r) {
    const cone = (e) => m.h * (1 - e / m.r) ** 1.35;
    h += dm >= m.cratere ? cone(dm) : cone(m.cratere) - 4 * (1 - (dm / m.cratere) ** 2);
  }
  // l'escalier : une bande aplanie à la hauteur des marches. Sous elles, le sol s'enfonce (elles sont pleines
  // jusque-là), et à leurs bouts, un accotement plus bas qu'elles : entre deux points du maillage (tous les
  // mètres), le sol aplani ne passe plus par-dessus les marches (la paroi semblait couvrir l'escalier, 2026-10-22)
  const [bx0, bx1, bz0, bz1] = BOITE_ESCALIER;
  if (x > bx0 && x < bx1 && z > bz0 && z < bz1) {
    const c = surLaLigne(MARCHES, x, z);
    if (c.d < 4.6) {
      h += (c.h - h) * (1 - lisse(2.8, 4.6, c.d));
      const v = surLaLigne(VOLEE, x, z), dans = lisse(0, 0.5, v.s) * lisse(0, 0.5, LONG_VOLEE - v.s);
      // (enfoncé seulement sous les marches et le chemin où l'on y marche : à côté, on passerait dessous)
      if (dans > 0) h -= dans * (v.d < 1.1 ? 0.65 : 0.35 * (1 - lisse(2.0, 2.8, v.d)));
    }
  }
  // le belvédère, creusé en gradins (la cuvette ; les gradins de pierre sont posés dessus)
  const db = Math.hypot(x - BELVEDERE.x, z - BELVEDERE.z);
  if (db < BELVEDERE.r + 4) h += (Y_BELVEDERE - BELVEDERE.creux * (1 - lisse(1.5, BELVEDERE.r, db)) - h) * (1 - lisse(BELVEDERE.r + 1, BELVEDERE.r + 4, db));
  // la butte d'Ōtonbu
  const dt = Math.hypot(x - OTONBU.x, z - OTONBU.z);
  if (dt < OTONBU.r) h += OTONBU.haut * (1 - lisse(3, OTONBU.r, dt)); // (le haut, plat : la plate-forme)
  return h;
}

/**
 * Où l'on peut aller : le fond du cratère (la paroi arrête d'elle-même, trop raide), et le plateau de la crête,
 * derrière sa barrière. Le bord de la crête, entre la barrière et le vide, seulement au haut de l'escalier : de
 * là, on glisserait sur la paroi jusqu'en bas.
 */
function dansLeCadre(x, z) {
  const r = Math.hypot(x, z), a = angle(x, z), r2 = rayonPied(a) + PAROI;
  if (r < r2 - 1) return true;
  if (a <= PLATEAU[0] || a >= PLATEAU[1] || r >= r2 + largeurCrete(a) - 0.6) return false;
  return r > r2 + BARRIERE || surLaLigne(MARCHES, x, z).d < 1.5;
}

/** Ce que le carnet et le menu savent du lieu, sans le construire. */
export const infos = {
  id: 'aogashima', carte: 'aogashima', video: '7656153535381294358',
  nom: { en: 'Aogashima', fr: 'Aogashima', ja: '青ヶ島' }, nomJa: '青ヶ島',
  tampons: [
    { id: 'maruyama', motif: 'caldeira', ja: '丸山', encre: '#2f7a4a' },
    { id: 'hingya', motif: 'vapeur', ja: 'ひんぎゃ', encre: '#6a3a8a', forme: 'carre' },
    { id: 'oeufs', motif: 'marmite', ja: '地熱釜', encre: '#c4561e' },
    { id: 'otonbu', motif: 'belvedere', ja: '大凸部', encre: '#2f4a8a', forme: 'carre' },
    { id: 'etoiles', motif: 'etoiles', ja: '星空', encre: '#1f3a6a' },
  ],
  get textes() { return TEXTES; },
};

export function construire(ctx) {
  const { THREE, atelier, P, peinture } = ctx;
  const PI = Math.PI;
  const objets = [];
  const monde = creerMonde({ terrain, cadre: dansLeCadre, profond: null, pente: 0.85 });
  const poser = (fin, x, z, o = {}) => objets.push({ fin, x, z, y: o.y ?? terrain(x, z), ry: o.ry || 0, ombre: o.ombre !== false });
  /** L'angle qui tourne vers (vx, vz) le devant (+z) d'un objet posé en (x, z). */
  const vers = (x, z, vx, vz) => Math.atan2(vx - x, vz - z);
  const vapeurs = [];

  // ---------------------------------------------------------------- Le tunnel (青宝トンネル), dans la paroi
  // la seule route vers le fond du cratère : une façade de béton, l'ouverture sombre en arc, ses lampes
  const rT = rayonPied(TUNNEL.a) + 0.8, xT = rT * Math.sin(TUNNEL.a), zT = -rT * Math.cos(TUNNEL.a);
  const ryT = vers(xT, zT, 0, 0);
  {
    const a = atelier();
    a.boite(8.4, 6.6, 1.6, P.beton, { y: 2.9 })
      .boite(9, 0.5, 2, P.beton, { y: 6.35 })
      .boite(4.4, 3.4, 0.6, '#1d1a1b', { y: 1.7, z: 0.55, trait: false })
      .piece(new THREE.CylinderGeometry(2.2, 2.2, 0.6, 16, 1, false, PI / 2, PI), '#1d1a1b', { y: 3.4, z: 0.55, rx: PI / 2, trait: false })
      .boite(3.4, 0.7, 0.08, P.blanc, { y: 5.4, z: 0.84 });
    for (let i = 0; i < 4; i++) a.boite(0.36, 0.12, 0.02, P.noir, { x: -1.1 + i * 0.73, y: 5.4, z: 0.89, trait: false });
    for (const [x, y, s] of [[-1.3, 3.5, 0.2], [0.9, 3.0, 0.13], [-0.4, 2.7, 0.08]]) a.boite(s, s * 0.6, 0.02, '#f0b04a', { x, y, z: 0.87, trait: false });
    // la route qui en sort : deux bordures de béton
    for (const s of [-1, 1]) a.boite(0.3, 0.3, 4, P.beton, { x: s * 2.6, y: 0.1, z: 2.6 });
    poser(a.fin(0, peinture), xT, zT, { ry: ryT, y: terrain(xT, zT) - 0.3 });
    const fx = Math.sin(ryT), fz = Math.cos(ryT), cx = Math.cos(ryT), cz = -Math.sin(ryT);
    monde.mur(xT + fx * 1.2 - cx * 3, zT + fz * 1.2 - cz * 3, xT + fx * 1.2 + cx * 3, zT + fz * 1.2 + cz * 3, 0.5);
    monde.bloc(xT - 3.4, xT + 3.4, zT - 3.4, zT + 3.4, -2, 7);
  }

  // ---------------------------------------------------------------- Le sauna et la marmite du volcan
  // le sauna (ふれあいサウナ) : un bâtiment de béton, toit de tôle, la porte au rideau bleu, sa cheminée qui fume
  {
    const a = atelier();
    a.boite(8, 3.2, 6, P.beton, { y: 1.5 })
      .pignon(8.9, 0.75, 6.9, P.tole, { y: 3.1 })
      .boite(9, 0.18, 7, P.tole, { y: 3.06 })
      .boite(1.5, 2.2, 0.12, '#7a5a3a', { x: -2, y: 1.0, z: 3.02 })
      .boite(1.55, 0.95, 0.06, '#2f5f8a', { x: -2, y: 1.75, z: 3.1, trait: false })
      .boite(0.5, 0.42, 0.02, P.blanc, { x: -2, y: 1.72, z: 3.14, trait: false })
      .boite(2.6, 0.7, 0.1, P.bois, { x: 1.4, y: 2.6, z: 3.05 })
      .cylindre(0.2, 0.2, 2.2, 8, '#8f8c88', { x: 2.6, y: 4.0, z: -1 });
    for (let i = 0; i < 3; i++) a.boite(0.5, 0.1, 0.02, P.noir, { x: 0.8 + i * 0.6, y: 2.6, z: 3.11, trait: false });
    for (const x of [0.6, 2.6]) a.boite(1.3, 0.9, 0.06, '#5b7a8c', { x, y: 1.4, z: 3.03, trait: false });
    for (const z of [-1.5, 1.2]) a.boite(0.06, 0.8, 1.2, '#5b7a8c', { x: 4.02, y: 1.6, z, trait: false });
    const y = terrain(SAUNA.x, SAUNA.z) - 0.1;
    poser(a.fin(0, peinture), SAUNA.x, SAUNA.z, { ry: PI / 2, y });
    monde.surface(SAUNA.x - 3.2, SAUNA.x + 3.2, SAUNA.z - 4.2, SAUNA.z + 4.2, y + 3.5, { plein: true });
    monde.bloc(SAUNA.x - 3.6, SAUNA.x + 3.6, SAUNA.z - 4.6, SAUNA.z + 4.6, y - 2, y + 4.6);
    vapeurs.push({ x: SAUNA.x - 1, z: SAUNA.z - 2.6, y: y + 5.1, n: 10, haut: 4, large: 0.6, taille: 1.1 });
  }
  // la marmite géothermique (地熱釜) : un comptoir de pierre sous un auvent, trois marmites fermées de bois
  {
    const a = atelier();
    a.boite(3.4, 0.9, 1.3, P.pierre, { y: 0.45 })
      .boite(3.5, 0.06, 1.4, P.pierreFonce, { y: 0.92, trait: false });
    for (let k = 0; k < 3; k++) {
      a.boite(0.82, 0.12, 0.82, '#6a4a32', { x: -1.08 + k * 1.08, y: 1.0 })
        .boite(0.4, 0.07, 0.07, '#4a3222', { x: -1.08 + k * 1.08, y: 1.1 });
    }
    for (const [x, z] of [[-1.9, -0.8], [1.9, -0.8], [-1.9, 0.8], [1.9, 0.8]]) a.boite(0.12, 2.4, 0.12, P.boisFonce, { x, y: 1.2, z });
    a.pignon(4.6, 0.6, 2.9, P.tole, { y: 2.38 })
      .boite(1.1, 0.42, 0.04, P.papier, { y: 2.0, z: 0.9, trait: false });
    for (let i = 0; i < 2; i++) a.boite(0.7 - i * 0.2, 0.06, 0.01, P.noir, { y: 2.05 - i * 0.12, z: 0.93, trait: false });
    const y = terrain(MARMITE.x, MARMITE.z) - 0.05;
    poser(a.fin(0, peinture), MARMITE.x, MARMITE.z, { ry: PI / 2, y });
    monde.surface(MARMITE.x - 0.7, MARMITE.x + 0.7, MARMITE.z - 1.8, MARMITE.z + 1.8, y + 1.1, { plein: true });
    monde.bloc(MARMITE.x - 1.45, MARMITE.x + 1.45, MARMITE.z - 2.3, MARMITE.z + 2.3, y - 1, y + 3.1);
    for (let k = 0; k < 3; k++) vapeurs.push({ x: MARMITE.x, z: MARMITE.z + 1.08 - k * 1.08, y: y + 1.1, n: 6, haut: 1.3, large: 0.25, taille: 0.5 });
  }

  // ---------------------------------------------------------------- Les fumerolles (ひんぎゃ)
  // la terre rouge qui fume, derrière une corde tendue sur des piquets ; un panneau « danger »
  {
    const a = atelier();
    const n = 22, hc = 0.75;
    let prec = null;
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * 2 * PI, x = HINGYA.x + Math.sin(t) * HINGYA.r, z = HINGYA.z + Math.cos(t) * HINGYA.r, y = terrain(x, z);
      if (i < n) a.cylindre(0.05, 0.06, hc + 0.2, 5, P.boisFonce, { x, y: y + (hc + 0.2) / 2 - 0.1, z });
      if (prec) a.baton(prec, [x, y + hc, z], 0.022, '#e9dcb8', 4);
      prec = [x, y + hc, z];
    }
    for (const [x, z] of EVENTS) {
      for (let k = 0; k < 5; k++) a.rocher(x + Math.sin(k * 2.4) * 0.7, terrain(x, z) + 0.05, z + Math.cos(k * 2.4) * 0.7, 0.18 + hasard(x + k, z) * 0.12, k % 2 ? P.terreClaire : P.paroi);
      vapeurs.push({ x, z, n: 14, haut: 3.8, large: 0.8, taille: 1.3 });
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
    monde.cercle(HINGYA.x, HINGYA.z, HINGYA.r + 0.35);
  }

  // ---------------------------------------------------------------- Le camping
  // des tentes, l'abri de la cuisine, une table, et la lunette du campeur
  {
    const a = atelier();
    const tente = (x, z, c, sorte, ry) => {
      const y = terrain(x, z);
      if (sorte === 'dome') {
        a.piece(new THREE.SphereGeometry(1.35, 14, 6, 0, 2 * PI, 0, PI / 2), c, { x, y: y - 0.02, z, sy: 0.78 })
          .piece(new THREE.CircleGeometry(0.45, 10, 0, PI), '#3a3236', { x: x + Math.sin(ry) * 1.3, y: y + 0.02, z: z + Math.cos(ry) * 1.3, ry, trait: false });
      } else {
        a.pignon(2.6, 1.4, 2.3, c, { x, y: y - 0.02, z, ry })
          .piece(new THREE.CircleGeometry(0.5, 3), '#3a3236', { x: x + Math.cos(ry) * 1.31, y: y + 0.45, z: z - Math.sin(ry) * 1.31, ry: ry + PI / 2, rz: PI / 2, trait: false });
      }
      monde.cercle(x, z, 1.4);
    };
    tente(-4, 41.5, '#e8732e', 'dome', 0.4);
    tente(-1.5, 47.5, '#3f86c4', 'toit', 0.2);
    tente(10, 48, '#f2c443', 'dome', -0.6);
    // l'abri de la cuisine (炊事場) : un toit sur quatre poteaux, un évier de béton
    const xs = 12, zs = 39.5, ys = terrain(xs, zs);
    for (const [dx, dz] of [[-1.8, -1.2], [1.8, -1.2], [-1.8, 1.2], [1.8, 1.2]]) {
      a.boite(0.14, 2.4, 0.14, P.boisFonce, { x: xs + dx, y: ys + 1.2, z: zs + dz });
      monde.cercle(xs + dx, zs + dz, 0.25);
    }
    a.pignon(4.6, 0.7, 3.2, P.tole, { x: xs, y: ys + 2.38, z: zs })
      .boite(3, 0.85, 0.8, P.beton, { x: xs, y: ys + 0.42, z: zs + 0.4 });
    monde.surface(xs - 1.6, xs + 1.6, zs - 0.05, zs + 0.85, ys + 0.9, { plein: true });
    monde.bloc(xs - 2.3, xs + 2.3, zs - 1.6, zs + 1.6, ys - 1, ys + 3.2);
    // la table de pique-nique
    const xt = 3, zt = 40.5, yt = terrain(xt, zt);
    a.boite(1.8, 0.08, 0.8, P.bois, { x: xt, y: yt + 0.74, z: zt });
    for (const s of [-1, 1]) {
      a.boite(1.8, 0.06, 0.3, P.bois, { x: xt, y: yt + 0.44, z: zt + s * 0.62 })
        .boite(0.08, 0.74, 0.08, P.boisFonce, { x: xt + s * 0.75, y: yt + 0.37, z: zt });
    }
    monde.cercle(xt, zt, 1.0);
    // la lunette du campeur, tournée vers le ciel
    const xl = 7.1, zl = 42.4, yl = terrain(xl, zl);
    for (const r of [0, 2.1, 4.2]) a.baton([xl, yl + 1.05, zl], [xl + Math.sin(r) * 0.4, yl, zl + Math.cos(r) * 0.4], 0.02, '#3a3a44', 5);
    a.cylindre(0.09, 0.07, 1.1, 10, P.blanc, { x: xl - 0.12, y: yl + 1.3, z: zl - 0.2, rx: -0.9 })
      .cylindre(0.1, 0.1, 0.06, 10, '#3a3a44', { x: xl - 0.12, y: yl + 1.62, z: zl - 0.62, rx: -0.9 });
    monde.cercle(xl, zl, 0.45);
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Maruyama : le poteau du sommet, la corde du cratère
  const SOMMET = { x: MARUYAMA.x - 1.2, z: MARUYAMA.z - MARUYAMA.cratere - 0.9 };
  {
    const a = atelier();
    const ys = terrain(SOMMET.x, SOMMET.z);
    a.boite(0.2, 1.7, 0.2, P.bois, { x: SOMMET.x, y: ys + 0.75, z: SOMMET.z })
      .boite(0.5, 1.1, 0.08, P.papier, { x: SOMMET.x, y: ys + 1.05, z: SOMMET.z + 0.13 })
      .pignon(0.6, 0.15, 0.3, P.toit, { x: SOMMET.x, y: ys + 1.6, z: SOMMET.z });
    for (let i = 0; i < 2; i++) a.boite(0.22, 0.22, 0.01, P.noir, { x: SOMMET.x, y: ys + 1.32 - i * 0.32, z: SOMMET.z + 0.175, trait: false });
    // la corde autour du cratère, sur des piquets bas
    const n = 16, rc = MARUYAMA.cratere + 0.25;
    let prec = null;
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * 2 * PI, x = MARUYAMA.x + Math.sin(t) * rc, z = MARUYAMA.z + Math.cos(t) * rc, y = terrain(x, z);
      if (i < n) a.cylindre(0.05, 0.06, 0.8, 5, P.boisFonce, { x, y: y + 0.3, z });
      if (prec) a.baton(prec, [x, y + 0.6, z], 0.02, '#e9dcb8', 4);
      prec = [x, y + 0.6, z];
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
    monde.cercle(MARUYAMA.x, MARUYAMA.z, MARUYAMA.cratere + 0.45);
    monde.cercle(SOMMET.x, SOMMET.z, 0.3);
  }

  // ---------------------------------------------------------------- L'escalier de la paroi nord
  // des marches de pierre tous les 45 cm, une dalle au palier, une main courante du côté du vide. Les marches
  // sont des blocs pleins jusque sous le sol (enfoncé sous elles : voir le terrain) ; on y marche sur le chemin
  // qui suit leur ligne
  {
    const a = atelier();
    for (let k = 0; k < VOLEE.length - 1; k++) {
      const [x0, z0, h0] = VOLEE[k], [x1, z1, h1] = VOLEE[k + 1];
      const L = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0);
      if (Math.abs(h1 - h0) < 0.05) {
        a.boite(2.4, 0.9, L + 0.3, P.pierre, { x: (x0 + x1) / 2, y: h0 - 0.43, z: (z0 + z1) / 2, ry });
        continue;
      }
      const n = Math.max(1, Math.round(L / 0.45));
      for (let i = 0; i < n; i++) {
        const f = (i + 0.5) / n, haut = h0 + (h1 - h0) * f + 0.01, bas = h0 + (h1 - h0) * (i / n) - 0.75, e = haut - bas;
        // (une marche sur deux 2 cm plus étroite : les flancs de deux marches qui se chevauchent ne sont pas dans le même plan)
        a.boite(i % 2 ? 2.18 : 2.22, e, L / n + 0.05, i % 2 ? P.pierre : P.pierreFonce, { x: x0 + (x1 - x0) * f, y: haut - e / 2, z: z0 + (z1 - z0) * f, ry });
      }
    }
    // (jusqu'au pas sur la crête : au bout de la volée, le sol aplani remonte déjà, trop raide pour y monter)
    monde.chemin(MARCHES, 1.15, { sol: 'pierre' });
    // la main courante : des poteaux à 1,3 m du chemin, vers le centre du cratère (le vide)
    const bord = (x, z, h) => { const r = Math.hypot(x, z); return [x - (x / r) * 1.3, h, z - (z / r) * 1.3]; };
    let prec = null;
    for (let k = 0; k < MARCHES.length - 2; k++) {
      const [x0, z0, h0] = MARCHES[k], [x1, z1, h1] = MARCHES[k + 1];
      for (const f of k === 0 ? [0.35, 0.7] : [0, 0.35, 0.7]) {
        const [x, y, z] = bord(x0 + (x1 - x0) * f, z0 + (z1 - z0) * f, h0 + (h1 - h0) * f);
        a.boite(0.1, 1.55, 0.1, P.boisFonce, { x, y: y + 0.1, z }); // (planté dans l'accotement, plus bas que les marches)
        if (prec) {
          a.baton([prec[0], prec[1] + 0.88, prec[2]], [x, y + 0.88, z], 0.04, P.bois, 5);
          monde.mur(prec[0], prec[2], x, z, 0.12, Math.min(prec[1], y) - 0.6, Math.max(prec[1], y) + 2.2);
        }
        prec = [x, y, z];
      }
    }
    // au haut de l'escalier, elle tourne avec le chemin et rejoint la barrière de la crête (qui y plante son poteau)
    const [ux, uz] = [Math.sin(ESCALIER.a1), -Math.cos(ESCALIER.a1)], [wx, wz] = [-Math.cos(ESCALIER.a1), -Math.sin(ESCALIER.a1)];
    const rc = rayonPied(ESCALIER.a1) + PAROI - 1.3;
    const tour = [[ux * rc, uz * rc], [ux * rc + wx * 1.3, uz * rc + wz * 1.3], surLaBarriere(OUVERTURE[0])];
    tour.forEach(([x, z], i) => {
      const y = terrain(x, z);
      if (i < tour.length - 1) a.boite(0.1, 0.95, 0.1, P.boisFonce, { x, y: y + 0.4, z });
      a.baton([prec[0], prec[1] + 0.88, prec[2]], [x, y + 0.88, z], 0.04, P.bois, 5);
      monde.mur(prec[0], prec[2], x, z, 0.12, Math.min(prec[1], y) - 0.6, Math.max(prec[1], y) + 2.2);
      prec = [x, y, z];
    });
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- La crête : le belvédère, Ōtonbu
  // le belvédère rond : des gradins de pierre qui descendent vers une petite place, face au grand cratère
  {
    const a = atelier();
    const V = THREE.Vector2;
    const profil = [[0.01, -1.02], [1.6, -1.02], [1.6, -0.65], [3.0, -0.65], [3.0, -0.28], [4.4, -0.28], [4.4, 0.1], [6.4, 0.1], [6.4, -0.5]].map(([r, y]) => new V(r, y));
    a.piece(new THREE.LatheGeometry(profil.reverse(), 36), P.pierre, { x: BELVEDERE.x, y: Y_BELVEDERE, z: BELVEDERE.z, teinte: (x, y) => (y > -0.15 ? P.pierre : y > -0.5 ? P.pierreFonce : y > -0.9 ? P.pierre : P.cheminFonce) });
    // deux bancs, tournés vers le cratère
    for (const s of [-1, 1]) {
      const x = BELVEDERE.x + s * 9, z = BELVEDERE.z + 2.5, y = terrain(x, z);
      a.boite(1.8, 0.08, 0.45, P.bois, { x, y: y + 0.45, z })
        .boite(0.1, 0.45, 0.4, P.boisFonce, { x: x - 0.75, y: y + 0.22, z })
        .boite(0.1, 0.45, 0.4, P.boisFonce, { x: x + 0.75, y: y + 0.22, z });
      monde.cercle(x, z, 0.8);
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }
  // Ōtonbu : la plate-forme hexagonale en bois au sommet de la butte, sa borne de pierre, sa rambarde
  const yO = terrain(OTONBU.x, OTONBU.z);
  {
    const a = atelier();
    a.cylindre(2.7, 2.7, 0.5, 6, P.bois, { x: OTONBU.x, y: yO - 0.05, z: OTONBU.z })
      .boite(0.34, 1.3, 0.34, P.pierre, { x: OTONBU.x, y: yO + 0.9, z: OTONBU.z })
      .boite(0.42, 0.1, 0.42, P.pierreFonce, { x: OTONBU.x, y: yO + 1.58, z: OTONBU.z })
      .boite(0.02, 0.6, 0.18, P.noir, { x: OTONBU.x - 0.18, y: yO + 1.0, z: OTONBU.z, trait: false });
    const coin = (i) => [OTONBU.x + Math.sin(i * PI / 3) * 2.55, OTONBU.z + Math.cos(i * PI / 3) * 2.55];
    for (let i = 0; i < 6; i++) {
      const [x, z] = coin(i), [x2, z2] = coin(i + 1);
      a.boite(0.12, 1.0, 0.12, P.boisFonce, { x, y: yO + 0.7, z });
      // l'entrée, du côté du chemin qui vient de l'escalier (à l'ouest)
      if (i === 4) continue;
      a.baton([x, yO + 1.12, z], [x2, yO + 1.12, z2], 0.045, P.bois, 5).baton([x, yO + 0.7, z], [x2, yO + 0.7, z2], 0.035, P.bois, 5);
      monde.mur(x, z, x2, z2, 0.12, yO - 0.5, yO + 3);
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
    monde.surface(OTONBU.x - 1.9, OTONBU.x + 1.9, OTONBU.z - 1.9, OTONBU.z + 1.9, yO + 0.2);
    monde.cercle(OTONBU.x, OTONBU.z, 0.35, yO - 1, yO + 3);
  }
  // une barrière de bois au bord de la crête, côté cratère, avec un passage au haut de l'escalier (OUVERTURE)
  {
    const a = atelier();
    const [o0, o1] = OUVERTURE, angles = [o0, o1];
    // un poteau tous les 2,6 m environ, sauf dans le passage et tout contre ses poteaux
    for (let t = PLATEAU[0] + 0.05; t <= PLATEAU[1] - 0.05; t += 0.035) if (t < o0 - 0.012 || t > o1 + 0.012) angles.push(t);
    angles.sort((p, q) => p - q);
    let prec = null;
    for (const t of angles) {
      const [x, z] = surLaBarriere(t), y = terrain(x, z);
      a.boite(0.12, 1.0, 0.12, P.boisFonce, { x, y: y + 0.42, z });
      if (prec && t !== o1) {
        a.baton([prec[0], prec[1] + 0.85, prec[2]], [x, y + 0.85, z], 0.04, P.bois, 5);
        monde.mur(prec[0], prec[2], x, z, 0.14, Math.min(prec[1], y) - 0.6, Math.max(prec[1], y) + 2.5);
      }
      prec = [x, y, z];
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Les panneaux de bois (à lire)
  const PANNEAUX = {
    bienvenue: { x: -34.6, z: -33.4, vx: -38, vz: -28 },
    sauna: { x: -33.8, z: 5.6, vx: -29, vz: 5 },
    hingya: { x: -22.9, z: 17.4, vx: -26, vz: 15.5 },
    maruyama: { x: -21.2, z: 1.6, vx: -26, vz: 1 },
    otonbu: { x: BAS[0] - 4.2, z: BAS[1] + 2.2, vx: BAS[0] - 6, vz: BAS[1] + 6 },
    camping: { x: -6.5, z: 36.2, vx: -10, vz: 33 },
    belvedere: { x: -3.2, z: -76.2, vx: -6, vz: -74 },
  };
  for (const p of Object.values(PANNEAUX)) {
    // le papier du panneau est sur sa face −z : on le tourne vers (vx, vz)
    poser(panneau(atelier(), P).fin(0, peinture), p.x, p.z, { ry: vers(p.x, p.z, p.vx, p.vz) + PI });
    monde.cercle(p.x, p.z, 0.75);
  }

  // ---- Le trépied du vidéaste, sur la crête : il filme la double caldeira
  const VIDEASTE = { x: 10, z: -79, cap: vers(10, -79, MARUYAMA.x, MARUYAMA.z) };
  {
    const tx = VIDEASTE.x + Math.sin(VIDEASTE.cap) * 0.8 + Math.cos(VIDEASTE.cap) * 0.5, tz = VIDEASTE.z + Math.cos(VIDEASTE.cap) * 0.8 - Math.sin(VIDEASTE.cap) * 0.5;
    poser(trepied(atelier()).fin(0, peinture), tx, tz, { y: terrain(tx, tz) + 1.3, ry: VIDEASTE.cap });
    monde.cercle(tx, tz, 0.45);
  }

  // ---------------------------------------------------------------- La végétation
  // les endroits sans arbres : la route, les chemins, les lieux du jeu, les rondes des passants
  const proche = (x, z) => {
    if (surLaLigne(ROUTE, x, z).d < 4.5) return true;
    for (const c of CHEMINS) if (surLaLigne(c, x, z).d < 3.5) return true;
    if (Math.hypot(x - MARUYAMA.x, z - MARUYAMA.z) < MARUYAMA.r + 2) return true;
    if (Math.hypot(x - HINGYA.x, z - HINGYA.z) < HINGYA.r + 4) return true;
    if (Math.hypot(x - xT, z - zT) < 15 || (x > -45 && x < -26 && z > -24 && z < 22)) return true;
    if (x > CAMPING.x0 - 3 && x < CAMPING.x1 + 3 && z > CAMPING.z0 - 3 && z < CAMPING.z1 + 3) return true;
    if (surLaLigne(MARCHES, x, z).d < 6) return true;
    return false;
  };
  // le pré entre le tunnel et Maruyama, et le pied de l'escalier : la vue sur le petit volcan reste dégagée
  const degage = (x, z) => surLaLigne([[xT, zT], [MARUYAMA.x, MARUYAMA.z]], x, z).d < 13 || surLaLigne([BAS, [MARUYAMA.x, MARUYAMA.z]], x, z).d < 9;
  const hasardDe = (graine) => { let s = graine; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };
  const tire = hasardDe(2026);
  const VERTS = [P.jungle, P.jungleFonce, P.feuillage, P.pin];
  // les buissons [x, z, rayon] : ils arrêtent (on entrait dedans, 2026-10-22), sauf sur un chemin ou la ronde d'un
  // passant ; leurs cercles sont posés avec les gens (voir plus bas)
  const buissons = [];
  // les bosquets du fond du cratère, en quatre morceaux (la caméra ne dessine que ceux qu'elle voit)
  {
    const quarts = [atelier(), atelier(), atelier(), atelier()];
    let n = 0;
    for (let essai = 0; essai < 1200 && n < 120; essai++) {
      // une couronne de forêt au pied de la paroi, des prés dégagés autour du petit volcan (on le voit de loin)
      const t = tire() * 2 * PI, rr = 36 + tire() * 26, x = rr * Math.sin(t), z = -rr * Math.cos(t);
      if (Math.hypot(x, z) > rayonPied(angle(x, z)) - 1.5 || proche(x, z) || degage(x, z)) continue;
      const y = terrain(x, z), h = 4 + tire() * 3.5, a = quarts[(x > 0 ? 1 : 0) + (z > 0 ? 2 : 0)];
      a.baton([x, y - 0.1, z], [x + 0.1, y + h * 0.5, z], 0.09 * h * 0.35, P.tronc, 5);
      for (const [dx, dy, dz, r] of [[0, 0.72, 0, 0.36], [-0.22, 0.6, 0.1, 0.27], [0.22, 0.62, -0.08, 0.27]]) {
        a.boule(r * h, VERTS[Math.floor(tire() * VERTS.length)], { x: x + dx * h, y: y + dy * h, z: z + dz * h, sy: 0.85, sorte: 'feuillu' }, 1);
      }
      monde.cercle(x, z, 0.45);
      n++;
    }
    for (const a of quarts) poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }
  // les fougères et les buissons au pied des arbres et le long des chemins
  {
    const a = atelier();
    let n = 0;
    for (let essai = 0; essai < 700 && n < 90; essai++) {
      const t = tire() * 2 * PI, rr = Math.sqrt(tire()) * 60, x = rr * Math.sin(t), z = -rr * Math.cos(t);
      if (Math.hypot(x, z) > rayonPied(angle(x, z)) - 1 || surLaLigne(ROUTE, x, z).d < 3 || Math.hypot(x - HINGYA.x, z - HINGYA.z) < HINGYA.r + 1.5) continue;
      if (x > CAMPING.x0 && x < CAMPING.x1 && z > CAMPING.z0 && z < CAMPING.z1) continue;
      const y = terrain(x, z);
      if (tire() < 0.6) {
        // une fougère : des frondes en rosette, penchées vers l'extérieur
        for (let k = 0; k < 7; k++) {
          const b = (k / 7) * 2 * PI + tire();
          a.cone(0.16, 1.0, 4, k % 2 ? P.fougere : P.jungle, { x: x + Math.sin(b) * 0.38, y: y + 0.42, z: z + Math.cos(b) * 0.38, rx: Math.cos(b) * 1.05, rz: -Math.sin(b) * 1.05, sz: 0.35, trait: false, sorte: 'feuillu' });
        }
      } else {
        const r = 0.5 + tire() * 0.4;
        a.boule(r, P.jungleFonce, { x, y: y + 0.3, z, sy: 0.7, sorte: 'feuillu' }, 1);
        buissons.push([x, z, r]);
      }
      n++;
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0, ombre: false });
  }
  // la forêt des parois et des flancs de l'île : des houppiers serrés, enfoncés dans la pente
  {
    const paroi = atelier(), flancs = atelier();
    for (let i = 0; i < 520; i++) {
      // (l'angle ramené entre −π et π, comme celui de la crête et du plateau : tiré de 0 à 2π, la moitié ouest du
      // plateau, juste sous 0, passait pour une arête de 4 m, et de grosses boules y poussaient : on y entrait, 2026-10-22)
      const t = tire() * 2 * PI, ta = t > PI ? t - 2 * PI : t, r1 = rayonPied(t);
      const surLaParoi = i < 300;
      const rr = surLaParoi ? r1 + 1.5 + tire() * (PAROI * 0.55) : r1 + PAROI + largeurCrete(ta) + 2 + tire() * 55;
      const x = rr * Math.sin(t), z = -rr * Math.cos(t), y = terrain(x, z);
      if (y < MER + 10 || surLaLigne(MARCHES, x, z).d < 5 || Math.hypot(x - xT, z - zT) < 7) continue;
      if (surLaParoi && y > hauteurCrete(t) - 9) continue;
      // pas d'arbres sur le plateau du nord (de l'herbe, et la vue)
      if (!surLaParoi && ta > PLATEAU[0] - 0.1 && ta < PLATEAU[1] + 0.1 && rr < r1 + PAROI + largeurCrete(ta) + 6) continue;
      const r = 1.8 + tire() * 1.8;
      (surLaParoi ? paroi : flancs).boule(r, VERTS[Math.floor(tire() * VERTS.length)], { x, y: y + r * 0.25, z, sy: 0.8, sorte: 'feuillu' }, 1);
      // au pied de la paroi, on marche jusqu'à eux : ils arrêtent aussi (leur largeur au ras du sol)
      if (surLaParoi) buissons.push([x, z, r * 0.95]);
    }
    poser(paroi.fin(0, peinture), 0, 0, { y: 0, ombre: false });
    poser(flancs.fin(0, peinture), 0, 0, { y: 0, ombre: false });
  }
  // des buissons sur le plateau, et quelques-uns sur les flancs de Maruyama
  {
    const a = atelier();
    for (let i = 0; i < 40; i++) {
      const sommet = i < 18;
      let x, z;
      if (sommet) {
        const t = PLATEAU[0] + tire() * (PLATEAU[1] - PLATEAU[0]), r2 = rayonPied(t) + PAROI;
        const rr = r2 + 2 + tire() * (largeurCrete(t) - 3);
        x = rr * Math.sin(t); z = -rr * Math.cos(t);
        if (Math.hypot(x - BELVEDERE.x, z - BELVEDERE.z) < BELVEDERE.r + 2 || Math.hypot(x - OTONBU.x, z - OTONBU.z) < 5 || CHEMINS.slice(2).some((c) => surLaLigne(c, x, z).d < 2.5) || Math.abs(x - VIDEASTE.x) + Math.abs(z - VIDEASTE.z) < 4) continue;
      } else {
        const t = tire() * 2 * PI, dm = 10 + tire() * 14;
        x = MARUYAMA.x + Math.sin(t) * dm; z = MARUYAMA.z + Math.cos(t) * dm;
        if (Math.hypot(x - SOMMET.x, z - SOMMET.z) < 4) continue;
      }
      const r = 0.55 + tire() * 0.45;
      a.boule(r, tire() < 0.5 ? P.jungleFonce : P.jungle, { x, y: terrain(x, z) + 0.25, z, sy: 0.75, sorte: 'feuillu' }, 1);
      buissons.push([x, z, r]);
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Le village, sur le flanc nord (vu de la crête)
  {
    const a = atelier();
    const TOITS = ['#d9763b', '#3f6fa0', '#b8462e', '#7d7a76', '#4f8a7a'];
    let i = 0;
    for (const [x, z] of [[-24, -106], [-11, -110], [3, -112], [17, -109], [31, -104], [-18, -118], [-3, -122], [12, -121], [26, -116], [-9, -131], [7, -132], [20, -127]]) {
      const y = terrain(x, z), ry = vers(x, z, x * 1.05, z * 1.3) + (hasard(x, z) - 0.5) * 0.5;
      const l = 4 + hasard(z, x) * 2.5;
      a.boite(l, 2.8, 3.6, i % 3 ? '#efe6d3' : P.beton, { x, y: y + 1.1, z, ry })
        .pignon(l + 0.6, 0.9, 4.2, TOITS[i % TOITS.length], { x, y: y + 2.5, z, ry });
      i++;
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0, ombre: false });
  }

  // ---------------------------------------------------------------- Le décor lointain
  // l'île de Hachijō au nord, sur l'horizon ; des nuages
  {
    const a = atelier();
    a.piece(new THREE.ConeGeometry(190, 92, 28, 3), P.montagneLoin, { x: -330, y: MER + 46, z: -1250, nuance: 0.05, trait: false })
      .piece(new THREE.ConeGeometry(150, 70, 28, 3), P.montagneLoin, { x: -120, y: MER + 35, z: -1230, nuance: 0.05, trait: false })
      .piece(new THREE.CylinderGeometry(150, 260, 14, 28), P.montagneLoin, { x: -220, y: MER + 4, z: -1240, trait: false });
    poser(a.fin(0, false), 0, 0, { y: 0, ombre: false });
  }
  {
    const a = atelier();
    for (const [x, y, z, s] of [[-500, 180, -820, 46], [-120, 210, -900, 60], [260, 170, -760, 40], [620, 220, -880, 55], [-820, 160, -700, 42], [80, 240, 700, 50], [-420, 200, 760, 46], [760, 190, 300, 50], [-780, 210, 240, 44]]) {
      for (const [dx, dy, dz, r] of [[0, 0, 0, 1], [1.2, -0.25, 0.1, 0.75], [-1.1, -0.3, 0, 0.7], [0.5, 0.45, 0, 0.6], [-0.4, 0.3, 0.2, 0.55]]) {
        a.boule(r * s, P.nuage, { x: x + dx * s, y: y + dy * s, z: z + dz * s, sy: 0.7 }, 1);
      }
    }
    poser(a.fin(0, false), 0, 0, { y: 0, ombre: false });
  }

  // ---------------------------------------------------------------- Les gens
  const PEAU = P.peau, NOIR = '#2a2420';
  const passants = [
    { id: 'gardienne', x: MARMITE.x + 1.25, z: MARMITE.z + 0.2, cap: PI / 2, tenue: { taille: 0.98, peau: '#f2c9a8', cheveux: '#d8d4cc', coiffure: 'chignon', chapeau: { sorte: 'foulard', c: '#e9e2d2' }, haut: '#6a8fb8', manches: 'longues', tablier: '#f6efe0', bas: { sorte: 'pantalon', c: '#4a4f5c' }, chaussures: '#3a3236', semelle: '#3a3236', yeux: 'plisses' } },
    { id: 'garde', x: -23.4, z: 20.6, cap: vers(-23.4, 20.6, HINGYA.x, HINGYA.z) + 0.6, tenue: { taille: 1.1, peau: PEAU, cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'casquette', c: '#4b6b45', c2: '#3a5636' }, haut: '#c9b48a', manches: 'longues', bas: { sorte: 'pantalon', c: '#5a5442' }, chaussures: '#3a3236', semelle: '#3a3236' } },
    { id: 'campeur', x: 5.9, z: 43.4, cap: -0.6, tenue: { taille: 1.08, peau: PEAU, cheveux: '#3a2a20', coiffure: 'court', chapeau: { sorte: 'bandeau', c: '#e8452e' }, haut: '#3f8a8f', manches: 'courtes', bas: { sorte: 'pantalon', c: '#4a4a56' }, chaussures: '#7a5a3a', semelle: '#3a3236' } },
    { id: 'randonneuse', x: -16, z: 0, cap: 0, ronde: [[-16, 0], [-6, -14], [14, -14], [22, 4], [10, 26], [-6, 24]], vitesse: 1.2, attente: [2, 5], tenue: { taille: 1.04, peau: PEAU, cheveux: '#6a4030', coiffure: 'queue', chapeau: { sorte: 'soleil', c: '#f3ead8', c2: '#3f8a5a' }, haut: '#e86a5a', manches: 'courtes', bas: { sorte: 'short', c: '#4a5a7a' }, chaussures: '#7a5a3a', semelle: '#3a3236', sac: { sorte: 'dos', c: '#3f6aa0', c2: '#2a3a5a' }, canne: true } },
    { id: 'enfant', x: -33, z: -17, cap: 0, ronde: [[-33, -17], [-29.5, -9], [-28.5, -1], [-31.5, -8]], vitesse: 1.5, attente: [0.5, 2.5], tenue: { taille: 0.8, peau: PEAU, cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'casquette', c: '#e8452e', c2: '#ffffff' }, haut: '#f2c443', manches: 'courtes', bas: { sorte: 'short', c: '#3d5a8f' }, chaussures: P.blanc, semelle: '#3a3236' } },
    { id: 'grandpere', x: -35.5, z: 19, cap: PI / 2 + 0.4, tenue: { taille: 1.02, peau: '#e8bf98', cheveux: '#e8e4dc', coiffure: 'chauve', chapeau: { sorte: 'paille', c: '#e6c87a', c2: '#3a3236' }, haut: '#5f7a5a', manches: 'longues', bas: { sorte: 'pantalon', c: '#5a5650' }, chaussures: '#3a3236', semelle: '#3a3236', canne: true, yeux: 'plisses' } },
    { id: 'videaste', x: VIDEASTE.x, z: VIDEASTE.z, cap: VIDEASTE.cap, tenue: { taille: 1.1, peau: PEAU, cheveux: '#3a2a20', coiffure: 'court', chapeau: { sorte: 'bob', c: '#2f3440' }, haut: '#2f3440', manches: 'courtes', bas: { sorte: 'pantalon', c: '#c9b48a' }, chaussures: P.blanc, semelle: '#3a3236', appareil: true } },
  ];
  // le cercle de chaque buisson : son rayon et un peu du corps (le joueur s'arrête contre son feuillage) ; pas sur un
  // chemin ou une ronde (il y bloquerait le passage : on y passe au travers, comme avant)
  const lignes = [ROUTE, ...CHEMINS, MARCHES, ...passants.filter((p) => p.ronde).map((p) => [...p.ronde, p.ronde[0]])];
  for (const [x, z, r] of buissons) {
    if (lignes.every((l) => surLaLigne(l, x, z).d > r + 1.4)) monde.cercle(x, z, r + 0.15);
  }

  // ---------------------------------------------------------------- Ce qu'on peut faire (tout passe par `jeu`)
  const parler = (id) => ({ id, passant: id, verbe: 'parler', action: (jeu) => jeu.dire(jeu.tx(id), id) });
  const interactions = [
    {
      id: 'gardienne', passant: 'gardienne', verbe: 'parler',
      async action(jeu) {
        if (jeu.aTampon('oeufs')) { await jeu.dire(jeu.tx('gardienne2'), 'gardienne'); return; }
        const r = await jeu.choisir(jeu.tx('gardienne'), [jeu.t('oui'), jeu.t('non')], 'gardienne');
        if (r !== 0) { await jeu.dire(jeu.tx('gardienneNon'), 'gardienne'); return; }
        await jeu.dire(jeu.tx('gardienneOui'));
        await jeu.tampon('oeufs');
      },
    },
    parler('garde'),
    {
      id: 'campeur', passant: 'campeur', verbe: 'parler',
      async action(jeu) {
        if (jeu.aTampon('etoiles')) { await jeu.dire(jeu.tx('campeur2'), 'campeur'); return; }
        const r = await jeu.choisir(jeu.tx('campeur'), [jeu.t('oui'), jeu.t('non')], 'campeur');
        if (r !== 0) { await jeu.dire(jeu.tx('campeurNon'), 'campeur'); return; }
        // la nuit tombe sur le cratère : la Voie lactée
        await jeu.nuit(true);
        await jeu.dire(jeu.tx('campeurNuit'), 'campeur');
        await jeu.tampon('etoiles');
        await jeu.nuit(false);
        await jeu.dire(jeu.tx('campeurApres'), 'campeur');
      },
    },
    parler('randonneuse'), parler('enfant'), parler('grandpere'),
    {
      id: 'videaste', passant: 'videaste', verbe: 'parler',
      async action(jeu) {
        const r = await jeu.choisir(jeu.tx('videaste'), [jeu.t('oui'), jeu.t('non')], 'videaste');
        if (r !== 0) { await jeu.dire(jeu.tx('videasteNon'), 'videaste'); return; }
        await jeu.video();
        await jeu.dire(jeu.tx('videasteApres'), 'videaste');
      },
    },
    {
      // on les regarde de n'importe où le long de la corde (le point de la corde le plus proche du joueur)
      id: 'hingya', x: -21.9, z: 19.6, rayon: 2.4, verbe: 'regarder',
      pres: (x, z) => { const a = Math.atan2(x - HINGYA.x, z - HINGYA.z); return { x: HINGYA.x + Math.sin(a) * HINGYA.r, z: HINGYA.z + Math.cos(a) * HINGYA.r }; },
      async action(jeu) {
        if (jeu.aTampon('hingya')) { await jeu.dire(jeu.tx('hingya2')); return; }
        await jeu.dire(jeu.tx('hingya'));
        await jeu.tampon('hingya');
      },
    },
    {
      id: 'sommet', x: SOMMET.x, z: SOMMET.z, rayon: 2.2, verbe: 'toucher',
      async action(jeu) {
        if (jeu.aTampon('maruyama')) { await jeu.dire(jeu.tx('sommet2')); return; }
        await jeu.dire(jeu.tx('sommet'));
        await jeu.tampon('maruyama');
      },
    },
    {
      id: 'otonbu', x: OTONBU.x, z: OTONBU.z, y: yO + 0.2, rayon: 2.3, verbe: 'regarder',
      async action(jeu) {
        if (jeu.aTampon('otonbu')) { await jeu.dire(jeu.tx('otonbu2')); return; }
        await jeu.dire(jeu.tx('otonbu'));
        await jeu.tampon('otonbu');
      },
    },
    ...Object.entries(PANNEAUX).map(([id, p]) => ({ id: `panneau-${id}`, x: p.x, z: p.z, rayon: 1.8, verbe: 'lire', action: (jeu) => jeu.dire(jeu.tx(`panneau-${id}`)) })),
  ];

  // ---------------------------------------------------------------- Pour la caméra et les captures
  const dM = [MARUYAMA.x, MARUYAMA.z];
  const depart = { x: -37.5, z: -28.5, cap: vers(-37.5, -28.5, ...dM) };
  const heros = { x: 14.5, z: -77.6 };
  const capHeros = vers(heros.x, heros.z, ...dM);
  return {
    ...infos, textes: TEXTES,
    objets, monde, terrain, passants, daims: [], interactions, actionDaim: null, vapeurs,
    aspectSol: (x, z, h) => aspectSol(P, x, z, h),
    centreRive: [0, 0], // les lignes d'eau font le tour de l'île
    etendue: { x0: -420, x1: 420, z0: -420, z1: 420, pas: 4, fin: { x0: -100, x1: 100, z0: -104, z1: 100, pas: 1 } },
    eau: { x0: -2000, x1: 2000, z0: -2000, z1: 2000, niveau: MER },
    // l'île en plein océan est ventée ; la bouscarle dans la jungle du cratère, un milan de temps en temps ;
    // le souffle des fumerolles, les insectes de la nuit au camping (la mer est loin en bas des falaises)
    vent: { dir: [0.85, 0.35], force: 1.15 }, oiseaux: ['uguisu', 'milan'], ambiances: ['vapeur', 'insectes'],
    brume: [100, 1900],
    soleil: [-0.42, 0.72, 0.55],
    depart,
    photos: {
      heros: { ...heros, cap: capHeros, lacet: capHeros + PI + 0.2, tangage: 0.42, distance: 6.2 },
      perso: { x: depart.x, z: depart.z, cap: depart.cap + PI, lacet: depart.cap + PI + 0.05, tangage: 0.1, distance: 3.9 },
    },
  };
}

/** La couleur et le motif (styles.js) du sol : la mer et ses falaises, la forêt, la paroi, la route, les chemins, les lieux. */
function aspectSol(P, x, z, h) {
  if (h < MER + 1) return [P.rocheSombre, M.roche];
  const r = Math.hypot(x, z), a = angle(x, z), r1 = rayonPied(a), r2 = r1 + PAROI, r3 = r2 + largeurCrete(a);
  const pente = Math.hypot(terrain(x + 0.5, z) - h, terrain(x, z + 0.5) - h) / 0.5;
  const bruit = bruitDoux(x, z, 4);
  if (h < MER + 9) return [pente > 1.6 || bruit > 0.6 ? P.rocheSombre : P.paroi, M.roche]; // la falaise du bord de mer
  const marches = surLaLigne(MARCHES, x, z).d;
  if (marches < 1.15) return [P.pierre, M.pierre];
  if (marches < 2.1 + 0.3 * bruit) return [P.chemin, M.terre]; // l'accotement, au bout des marches
  if (marches < 5) return bruit > 0.5 ? [P.jungle, M.sousBois] : [P.herbeFonce, M.herbe];
  if (surLaLigne(ROUTE, x, z).d < 2.1) return [P.route, M.route];
  for (const c of CHEMINS) if (surLaLigne(c, x, z).d < 1.1) return [P.chemin, M.terre];
  // les fumerolles : la terre rouge, pâlie autour des bouches de vapeur
  const dh = Math.hypot(x - HINGYA.x, z - HINGYA.z);
  if (dh < HINGYA.r + 0.8) return [EVENTS.some(([ex, ez]) => Math.hypot(x - ex, z - ez) < 1.3) ? P.terreClaire : P.terreRouge, M.terre];
  // le belvédère : un dallage ; le camping : une pelouse
  if (Math.hypot(x - BELVEDERE.x, z - BELVEDERE.z) < BELVEDERE.r + 0.6) return [P.pierre, M.dalles];
  if (x > CAMPING.x0 && x < CAMPING.x1 && z > CAMPING.z0 && z < CAMPING.z1) return [P.herbe, M.herbe];
  // Maruyama : rayé de vert (les ravines de ses flancs), un sentier qui monte en spirale, son cratère
  const m = MARUYAMA, dm = Math.hypot(x - m.x, z - m.z);
  if (dm < m.cratere + 0.2) return [P.herbeFonce, M.herbe];
  if (dm < m.r - 1.5) {
    const am = Math.atan2(x - m.x, z - m.z);
    for (let k = 0; k < 2; k++) {
      const u = ((am + PI_ - 0.6) / (2 * PI_) + k) / 1.6;
      if (u <= 1 && Math.abs(dm - (m.r - 2.5 - u * (m.r - m.cratere - 3.3))) < 0.9) return [P.chemin, M.terre];
    }
    return Math.floor((am + PI_) / (2 * PI_) * 46) % 2 ? [P.herbe, M.herbe] : [P.jungle, M.sousBois];
  }
  // la paroi : la forêt en bandes verticales, et la roche nue là où c'est le plus raide
  if (r > r1 + 0.8 && r < r2 - 0.5) {
    if (pente > 1.7 && bruit > 0.55) return [P.paroi, M.roche];
    return [Math.floor(a * 70 + bruitDoux(x, z, 3) * 1.6) % 2 ? P.jungle : P.jungleFonce, M.sousBois];
  }
  // la crête : l'herbe rase du plateau
  if (r >= r2 - 0.5 && r < r3) return [bruit > 0.8 ? P.herbeFonce : P.herbe, M.herbe];
  // les flancs de l'île : la forêt
  if (r >= r3) return [bruit > 0.5 ? P.jungleFonce : P.jungle, M.sousBois];
  // le fond du cratère : des prés et des sous-bois
  return bruit > 0.62 ? [P.jungle, M.sousBois] : [bruit > 0.3 ? P.herbeFonce : P.herbe, M.herbe];
}
const PI_ = Math.PI;

// ---------------------------------------------------------------- Les textes du lieu
const TEXTES = {
  fr: {
    noms: { gardienne: 'La gardienne du sauna', garde: 'Le garde', campeur: 'Le campeur', randonneuse: 'La randonneuse', enfant: 'L’écolier', grandpere: 'Le grand-père', videaste: '@random_japan_place' },
    tampons: {
      maruyama: ['Maruyama', 'Au sommet du petit volcan'],
      hingya: ['Les fumerolles', 'Là où la terre fume'],
      oeufs: ['Les œufs à la vapeur', 'La marmite du volcan'],
      otonbu: ['Ōtonbu', 'Le plus haut point de l’île'],
      etoiles: ['Le ciel étoilé', 'Au camping'],
    },
    'panneau-bienvenue': ['« Bienvenue à Aogashima 青ヶ島 »', 'L’île habitée la plus au sud des îles d’Izu, à 360 km de Tokyo… et pourtant, c’est encore Tokyo !', 'Environ 170 habitants : le plus petit village du Japon.'],
    'panneau-sauna': ['« Sauna géothermique ふれあいサウナ »', 'Pas besoin de feu : c’est la vapeur du volcan qui chauffe le sauna.', 'À côté, la marmite géothermique : on y cuit des œufs et des patates douces.'],
    'panneau-hingya': ['« ひんぎゃ Hingya »', 'C’est ainsi qu’on appelle ici les fumerolles : la vapeur brûlante qui sort du sol.', 'Les habitants s’en servent même pour faire leur sel, le « sel de hingya ».', 'DANGER : ne passe pas la corde !'],
    'panneau-maruyama': ['« Maruyama 丸山 »', 'Le petit volcan au milieu du grand : une double caldeira, c’est très rare dans le monde.', 'En 1785, une grande éruption a obligé tous les habitants à fuir l’île.'],
    'panneau-otonbu': ['« Vers Ōtonbu 大凸部 »', 'Par l’escalier : le point le plus haut de l’île, 423 m.', 'De là-haut, on voit toute la double caldeira… et l’océan tout autour.'],
    'panneau-camping': ['« Camping »', 'Loin de toute ville, la nuit est ici l’une des plus noires du Japon.', 'Par beau temps, on voit la Voie lactée à l’œil nu !'],
    'panneau-belvedere': ['« Belvédère »', 'D’ici, on voit les deux volcans : le grand cratère, et Maruyama au milieu.'],
    gardienne: ['Bonjour ! Ici, c’est le volcan qui fait la cuisine.', 'Tu veux faire cuire des œufs dans la marmite ?'],
    gardienneOui: ['Elle pose des œufs dans un panier, au-dessus de la vapeur…', '… quelques minutes plus tard…', 'Ils sont cuits ! Avec une pincée de sel de l’île… Délicieux !'],
    gardienneNon: ['Une autre fois ! La marmite est toujours chaude.'],
    gardienne2: ['Le volcan nous chauffe, cuit nos œufs et nous fait notre sel. Pratique, non ?'],
    garde: ['Attention ! Ne passe pas la corde : la vapeur est brûlante.', 'Tu peux regarder d’ici. Sous nos pieds, le volcan est toujours vivant !'],
    hingya: ['Pschhhh… La vapeur sort du sol en sifflant.', 'Tu sens la chaleur du volcan jusque sur ton visage.'],
    hingya2: ['La terre fume toujours, tranquillement.'],
    campeur: ['Salut ! Je campe ici pour les étoiles.', 'La nuit, au fond du cratère, il fait tout noir. Tu veux voir ?'],
    campeurNuit: ['Regarde… La Voie lactée traverse tout le ciel !', 'Ici, il n’y a presque aucune lumière : on voit des milliers d’étoiles.'],
    campeurApres: ['Magnifique, hein ? Reviens quand tu veux.'],
    campeurNon: ['D’accord ! Le ciel sera encore là ce soir.'],
    campeur2: ['Ce soir, j’essaie de voir une étoile filante !'],
    randonneuse: ['Je fais le tour du petit volcan.', 'Tout en haut, on est dans un volcan… lui-même dans un volcan !'],
    enfant: ['Tu es venu en bateau ? Il est souvent annulé à cause des vagues !', 'Sinon, il y a l’hélicoptère, mais il n’a que quelques places.', 'Ici, tout le monde se connaît !'],
    grandpere: ['En 1785, le volcan a explosé. Tout le monde a fui vers Hachijō.', 'Il a fallu près de cinquante ans pour que les habitants reviennent.', 'On appelle ça le « kanjū » : le retour au pays.'],
    videaste: ['Salut ! Je filme les plus beaux lieux du Japon pour TikTok.', 'Mon compte, c’est @random_japan_place.', 'J’ai fait une vidéo d’Aogashima. Tu veux la voir ?'],
    videasteNon: ['D’accord ! Elle est aussi sur la carte, avec tous les autres lieux.'],
    videasteApres: ['Ça t’a plu ? Abonne-toi pour voir les prochains lieux !'],
    sommet: ['Tu es au sommet de Maruyama, le petit volcan.', 'Tout autour, les parois du grand cratère : tu es dans un volcan, dans un volcan !'],
    sommet2: ['Le vent souffle sur le cratère du petit volcan.'],
    otonbu: ['Tu es tout en haut d’Aogashima : 423 m.', 'D’un côté, la double caldeira. De l’autre, l’océan à perte de vue.', 'Au loin, au nord, l’île de Hachijō.'],
    otonbu2: ['Le vent de la mer fait onduler l’herbe de la crête.'],
  },
  en: {
    noms: { gardienne: 'Sauna keeper', garde: 'Ranger', campeur: 'Camper', randonneuse: 'Hiker', enfant: 'Island boy', grandpere: 'Old man', videaste: '@random_japan_place' },
    tampons: {
      maruyama: ['Maruyama', 'At the top of the little volcano'],
      hingya: ['The steam vents', 'Where the ground smokes'],
      oeufs: ['Steamed eggs', 'The volcano’s pot'],
      otonbu: ['Ōtonbu', 'The highest point of the island'],
      etoiles: ['The starry sky', 'At the campsite'],
    },
    'panneau-bienvenue': ['“Welcome to Aogashima 青ヶ島”', 'The southernmost inhabited island of the Izu Islands, 360 km from Tokyo… and yet it is still Tokyo!', 'About 170 people live here: the smallest village in Japan.'],
    'panneau-sauna': ['“Geothermal sauna ふれあいサウナ”', 'No fire needed: the volcano’s steam heats the sauna.', 'Next to it, the geothermal pot: people steam eggs and sweet potatoes in it.'],
    'panneau-hingya': ['“ひんぎゃ Hingya”', 'That is the local word for the steam vents: scalding steam rising from the ground.', 'Islanders even use it to make their salt, “hingya salt”.', 'DANGER: do not cross the rope!'],
    'panneau-maruyama': ['“Maruyama 丸山”', 'The little volcano inside the big one: a double caldera, very rare in the world.', 'In 1785, a huge eruption forced every islander to flee.'],
    'panneau-otonbu': ['“To Ōtonbu 大凸部”', 'Up the stairs: the highest point of the island, 423 m.', 'From the top, you see the whole double caldera… and the ocean all around.'],
    'panneau-camping': ['“Campsite”', 'Far from any town, the nights here are among the darkest in Japan.', 'On a clear night, you can see the Milky Way with the naked eye!'],
    'panneau-belvedere': ['“Viewpoint”', 'From here you can see both volcanoes: the big crater, and Maruyama in the middle.'],
    gardienne: ['Hello! Here, the volcano does the cooking.', 'Would you like to steam some eggs in the pot?'],
    gardienneOui: ['She puts some eggs in a basket, over the steam…', '… a few minutes later…', 'They’re done! With a pinch of island salt… Delicious!'],
    gardienneNon: ['Another time! The pot is always hot.'],
    gardienne2: ['The volcano warms us, cooks our eggs and makes our salt. Handy, isn’t it?'],
    garde: ['Careful! Don’t cross the rope: the steam is scalding.', 'You can watch from here. Under our feet, the volcano is still alive!'],
    hingya: ['Pssshhh… Steam hisses out of the ground.', 'You can feel the volcano’s heat on your face.'],
    hingya2: ['The ground keeps on steaming, quietly.'],
    campeur: ['Hi! I’m camping here for the stars.', 'At night, the bottom of the crater is pitch dark. Want to see?'],
    campeurNuit: ['Look… The Milky Way stretches across the whole sky!', 'There’s almost no light here: you can see thousands of stars.'],
    campeurApres: ['Amazing, right? Come back anytime.'],
    campeurNon: ['Okay! The sky will still be here tonight.'],
    campeur2: ['Tonight I’m hoping to catch a shooting star!'],
    randonneuse: ['I’m walking around the little volcano.', 'At the top, you’re in a volcano… inside a volcano!'],
    enfant: ['Did you come by boat? It’s often cancelled because of the waves!', 'Otherwise there’s the helicopter, but it only has a few seats.', 'Here, everybody knows everybody!'],
    grandpere: ['In 1785, the volcano exploded. Everyone fled to Hachijō.', 'It took almost fifty years for the islanders to come back.', 'We call it “kanjū”: the return home.'],
    videaste: ['Hi! I film the most beautiful places in Japan for TikTok.', 'My account is @random_japan_place.', 'I made a video of Aogashima. Want to watch it?'],
    videasteNon: ['Okay! It’s also on the map, with all the other places.'],
    videasteApres: ['Did you like it? Follow me to see the next places!'],
    sommet: ['You’re at the top of Maruyama, the little volcano.', 'All around, the walls of the big crater: you’re in a volcano, inside a volcano!'],
    sommet2: ['The wind blows over the little volcano’s crater.'],
    otonbu: ['You’re at the very top of Aogashima: 423 m.', 'On one side, the double caldera. On the other, the ocean as far as the eye can see.', 'Far to the north, the island of Hachijō.'],
    otonbu2: ['The sea wind ripples the grass on the ridge.'],
  },
  ja: {
    noms: { gardienne: 'サウナの おばあさん', garde: 'レンジャーさん', campeur: 'キャンパーさん', randonneuse: 'ハイカーさん', enfant: '島の 子ども', grandpere: 'おじいさん', videaste: '@random_japan_place' },
    tampons: {
      maruyama: ['丸山', '小さな 火山の てっぺん'],
      hingya: ['ひんぎゃ', '地面から 湯気が でる ところ'],
      oeufs: ['地熱釜の たまご', '火山の かまど'],
      otonbu: ['大凸部', '島で いちばん 高い ところ'],
      etoiles: ['星空', 'キャンプ場で'],
    },
    'panneau-bienvenue': ['「青ヶ島へ ようこそ」', '伊豆諸島で いちばん 南の 有人島。東京から 360キロ……でも ここも 東京都！', '人口は 約170人。日本で いちばん 小さな 村です。'],
    'panneau-sauna': ['「ふれあいサウナ」', '火は つかわない。火山の 蒸気で あたためる サウナ。', 'となりの 地熱釜で、たまごや さつまいもを ふかせるよ。'],
    'panneau-hingya': ['「ひんぎゃ」', '島の ことばで、地面から ふきでる 熱い 蒸気の こと。', '島の 人は この 蒸気で 塩も つくる。「ひんぎゃの塩」だよ。', 'きけん！ ロープの 中に 入らないで。'],
    'panneau-maruyama': ['「丸山」', '大きな 火山の 中の 小さな 火山。二重式火山は 世界でも めずらしい。', '1785年の 大噴火で、島の 人は みんな 島を はなれた。'],
    'panneau-otonbu': ['「大凸部へ」', '階段を のぼると 島で いちばん 高い ところ、423メートル。', 'てっぺんからは 二重の カルデラと まわりの 海が 見えるよ。'],
    'panneau-camping': ['「キャンプ場」', '町の 明かりが ないから、夜は 日本でも 有数の まっくらな 空。', '晴れた 夜は 天の川が はっきり 見える！'],
    'panneau-belvedere': ['「展望台」', 'ここから 二つの 火山が 見える。大きな カルデラと、まんなかの 丸山。'],
    gardienne: ['いらっしゃい！ ここでは 火山が 料理を して くれるの。', '地熱釜で たまごを ふかして みる？'],
    gardienneOui: ['おばあさんは たまごを かごに 入れて、蒸気の 上に おいた……', '……数分後……', 'できあがり！ 島の 塩を ぱらり。おいしい！'],
    gardienneNon: ['また こんどね。かまは いつでも あついよ。'],
    gardienne2: ['火山は あたためて くれて、たまごも ふかして くれて、塩まで つくって くれる。べんりでしょ？'],
    garde: ['あぶない！ ロープの 中は 熱い 蒸気が でているよ。', 'ここから 見てね。足の 下で 火山は 今も 生きているんだ。'],
    hingya: ['シューッ……地面から 蒸気が ふきだしている。', '顔まで 火山の 熱が つたわって くる。'],
    hingya2: ['大地は 今日も しずかに 湯気を あげている。'],
    campeur: ['やあ！ 星を 見に キャンプ しているんだ。', '夜の カルデラの 底は まっくら。見てみる？'],
    campeurNuit: ['見て……天の川が 空を よこぎっている！', 'ここは 明かりが ほとんど ないから、何千もの 星が 見えるんだ。'],
    campeurApres: ['すごかった でしょ？ また おいで。'],
    campeurNon: ['オッケー！ 星空は 今夜も ここに あるよ。'],
    campeur2: ['今夜は 流れ星を 見つけたいな！'],
    randonneuse: ['丸山の まわりを 歩いているの。', 'てっぺんに 立つと、火山の 中の 火山に いるって わかるよ！'],
    enfant: ['船で 来たの？ 波が 高いと すぐ 欠航するんだよ！', 'ヘリコプターも あるけど、席が すこししか ないんだ。', 'この 島では みんな 知り合いだよ！'],
    grandpere: ['1785年、火山が 大噴火して、島の 人は 八丈島へ にげたんじゃ。', 'みんなが もどって こられたのは、50年 ちかく あとの こと。', 'それを 「還住」と いうんじゃよ。'],
    videaste: ['やあ！ 日本の すてきな 場所を TikTokで しょうかい しているんだ。', 'アカウントは @random_japan_place。', '青ヶ島の 動画も あるよ。見てみる？'],
    videasteNon: ['オッケー！ 地図にも ほかの 場所と いっしょに のっているよ。'],
    videasteApres: ['気に入った？ フォローして 次の 場所も 見てね！'],
    sommet: ['丸山の てっぺんに ついた。', 'まわりは 大きな カルデラの かべ。火山の 中の 火山に いるんだ！'],
    sommet2: ['丸山の 火口に 風が ふいている。'],
    otonbu: ['青ヶ島で いちばん 高い ところ、423メートル！', 'かたほうには 二重の カルデラ、もう かたほうには はてしない 海。', '北の ほうに 八丈島が 見える。'],
    otonbu2: ['海からの 風が 尾根の 草を ゆらしている。'],
  },
};
