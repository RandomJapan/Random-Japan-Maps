// ================================================================
//  Aogashima (青ヶ島) : l'île volcanique au bout des îles d'Izu. Dans son grand cratère se dresse un second
//  petit volcan, Maruyama : une « double caldeira ». On arrive par le tunnel, au fond du cratère ; les
//  fumerolles (les « hingya »), le sauna et la marmite chauffés par le volcan, le camping et son ciel
//  étoilé, le petit volcan et son cratère ; un escalier en lacets monte sur la crête, au belvédère et au
//  point le plus haut de l'île, Ōtonbu, face à toute la caldeira et à l'océan. D'après la vidéo du
//  propriétaire (la caldeira vue du ciel, le petit volcan rayé de vert, le belvédère rond en gradins).
//  Son secret (2026-10-23) : la carte au trésor. La dernière page du cahier des voyageurs, dans l'abri de la crête, est
//  une carte dessinée par des enfants de l'île, avec une croix ; à l'est du petit volcan, près d'un camélia, dans un petit
//  creux, on creuse : une vieille boîte en fer, une photo de classe, une lettre (l'éruption de 1785, le retour des
//  habitants cinquante ans plus tard) et un koban (tresors.js). Bunbuku, le marchand, attend au milieu de la forêt, à l'est du cratère.
//  Repère : x vers l'est, z vers le sud, y vers le haut, en mètres ; le fond du cratère vers y = 0, la mer
//  à y = −40. Les distances sont resserrées (le vrai cratère fait plus d'un kilomètre).
//  ctx : { THREE, atelier, P (palette), peinture }.
// ================================================================
import { creerMonde, interactionsBancs, lisse, hasard, bruitDoux, surLaLigne } from './monde.js';
import { panneau, trepied, PAPIER_PANNEAU } from './decor.js';
import { MATIERES as M } from './textures.js';
import { secretTrouve } from './tresors.js';

const MER = -40;
const MARUYAMA = { x: 5, z: 7, r: 26, h: 16, cratere: 4.6 };
const BELVEDERE = { x: 1, z: -82.1, r: 6.3, creux: 1.12 }; // le belvédère rond, en gradins, sur la crête
const ANNEAU = 6.15; // la barrière sur le bord de son anneau de pierre, côté cratère (au-dessus de l'entaille de l'escalier)
const OTONBU = { x: 20, z: -81.6, haut: 3.4, r: 11.5 }; // le point le plus haut de l'île
const HINGYA = { x: -16, z: 23, r: 6.8 }; // les fumerolles, derrière leur corde
const EVENTS = [[-17, 21], [-14.5, 24.5], [-18.5, 25.2], [-13.4, 21.4], [-16, 26.6]];
const SAUNA = { x: -38, z: 10 };
const MARMITE = { x: -30.6, z: 17 };
const CAMPING = { x0: -9, x1: 15, z0: 37, z1: 51 };
const TUNNEL = { a: -0.92 };
const PALMERAIE = { x0: -46, x1: -38.5, z0: -22, z1: -11 }; // le champ de palmiers (les « roebelenii » de l'île)
const CAMION = { x: -38.5, z: 16.6 }; // le petit camion (kei) garé à côté du sauna
const MIROIR = { x: -28.4, z: -12.6 }; // le miroir de virage, au carrefour du chemin de l'escalier
// sur la crête, à l'ouest du haut de l'escalier (un coin d'herbe vide, 2026-10-23) : un abri de bois (azumaya) face à
// la caldeira, un pin couché par le vent, les jumelles tournées vers Hachijō, la pierre du « 外輪山 »
const AZUMAYA = { x: -21.1, z: -73.4, cote: 3.2 };
const PIN_VENT = { x: -25.6, z: -77.6 };
const JUMELLES = { x: -15.1, z: -83.1 };
const STELE = { x: -10.9, z: -78.6 };
const HACHIJO = { x: -220, y: MER + 30, z: -1240 }; // l'île de Hachijō, sur l'horizon (le décor lointain)
// le secret : le petit creux où la boîte est enterrée, à l'est du petit volcan ; le camélia à côté ; le marchand, au
// milieu de la forêt de l'est du cratère (2026-10-23 : il était derrière le champ de palmiers), dans une clairière
// ouverte vers l'ouest (ouverture : l'angle de la trouée, comme cap), son lampion à côté
const TRESOR = { x: 27, z: 14, r: 2.4, creux: 0.45 };
const TSUBAKI = { x: 28.9, z: 12.4 };
const MARCHAND = { x: 45, z: -3, clairiere: 4.5, ouverture: -Math.PI / 2 - 0.15 };
const LAMPION = { x: MARCHAND.x + 0.35, z: MARCHAND.z + 1.25 };
const CAP_ABRI = Math.atan2(-AZUMAYA.x, -AZUMAYA.z); // l'abri ouvre son devant sur la caldeira (vers le centre)
/** Du repère de l'abri (x à sa droite, z vers la caldeira) au lieu : [x, z]. */
const versAbri = (lx, lz) => [AZUMAYA.x + lx * Math.cos(CAP_ABRI) + lz * Math.sin(CAP_ABRI), AZUMAYA.z - lx * Math.sin(CAP_ABRI) + lz * Math.cos(CAP_ABRI)];
/** Du lieu au repère de l'abri : [lx, lz]. */
const dansAbri = (x, z) => { const dx = x - AZUMAYA.x, dz = z - AZUMAYA.z, c = Math.cos(CAP_ABRI), sn = Math.sin(CAP_ABRI); return [dx * c - dz * sn, dx * sn + dz * c]; };

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
/** Le pied de la barrière de la crête à l'angle t (rayonBarriere). */
const surLaBarriere = (t) => { const r = rayonBarriere(t); return [r * Math.sin(t), -r * Math.cos(t)]; };
const Y_BELVEDERE = hauteurCrete(angle(BELVEDERE.x, BELVEDERE.z));

/**
 * L'escalier de la paroi nord : une longue volée en diagonale, de l'est (au pied) vers l'ouest (sur la crête),
 * qui suit la pente ; un palier au milieu, un autre en haut (dans le prolongement de la volée : posé au bout, de
 * biais, il faisait un muret au bout des dernières marches), puis un pas sur la crête. [x, z, hauteur].
 */
const ESCALIER = { a0: 0.5, a1: -0.08 };
const MARCHES = (() => {
  const { a0, a1 } = ESCALIER, haut = hauteurCrete(a1), pts = [];
  for (const s of [0, 0.1, 0.2, 0.3, 0.38, 0.46, 0.54, 0.62, 0.7, 0.8, 0.9, 1]) {
    const a = a0 + (a1 - a0) * s, part = s < 0.46 ? s / 0.92 : s > 0.54 ? (s - 0.08) / 0.92 : 0.5;
    const h = 0.4 + (haut - 0.4) * part, r = rayonPied(a) + PAROI * profilInverse(h / hauteurCrete(a));
    pts.push([r * Math.sin(a), -r * Math.cos(a), h]);
  }
  const [xa, za] = pts[pts.length - 1], [xb, zb] = pts[pts.length - 2], l = Math.hypot(xa - xb, za - zb);
  const xp = xa + ((xa - xb) / l) * 1.3, zp = za + ((za - zb) / l) * 1.3, rp = Math.hypot(xp, zp);
  pts.push([xp, zp, haut], [xp + (xp / rp) * 3.5, zp + (zp / rp) * 3.5, haut]); // le palier du haut, un pas sur la crête
  return pts;
})();
const [BAS, HAUT] = [MARCHES[0], MARCHES[MARCHES.length - 1]];
// la partie en marches (sans le pas sur la crête), et sa longueur
const VOLEE = MARCHES.slice(0, -1);
const LONG_VOLEE = VOLEE.slice(1).reduce((l, p, k) => l + Math.hypot(p[0] - VOLEE[k][0], p[1] - VOLEE[k][1]), 0);
const RAMPE = 1.25; // la main courante (côté vide) et le mur invisible (côté pente), à cette distance du milieu des marches
// le passage dans la barrière de la crête, au haut de l'escalier : 1,3 m de chaque côté du chemin (comme la main courante)
const A_HAUT = angle(HAUT[0], HAUT[1]);
const OUVERTURE = ((d) => [A_HAUT - d, A_HAUT + d])(1.3 / (rayonPied(A_HAUT) + PAROI + BARRIERE));
const BOITE_ESCALIER = [Math.min(...MARCHES.map((p) => p[0])) - 5, Math.max(...MARCHES.map((p) => p[0])) + 5, Math.min(...MARCHES.map((p) => p[1])) - 5, Math.max(...MARCHES.map((p) => p[1])) + 5];
const CHEMINS = [
  [[-31, -11], [-18, -30], [0, -42], [18, -50], [BAS[0], BAS[1]]],
  [[-30.6, 2], [-21, 4]],
  [[HAUT[0], HAUT[1]], [-4, -79.5], [BELVEDERE.x - BELVEDERE.r, BELVEDERE.z]],
  [[HAUT[0], HAUT[1]], [6, -80.6], [13, -82.2], [OTONBU.x, OTONBU.z]],
  // vers l'abri (il s'arrête à son dallage, du côté de la crête) et, de là, vers les jumelles
  [[HAUT[0], HAUT[1]], [-12.6, -76.4], [-17.2, -74.9], [AZUMAYA.x + 2.2, AZUMAYA.z + 1.0]],
  [[-12.6, -76.4], [-14.2, -80.2], [JUMELLES.x + 0.4, JUMELLES.z + 1.1]],
];

// ---------------------------------------------------------------- Le tunnel (青宝トンネル)
// Sa façade au pied de la paroi, au nord-ouest, tournée vers le centre du cratère. Son repère : lx le long de la
// façade, d vers l'intérieur de la paroi (0 : le devant de la façade), y au-dessus de la route (T_Y).
const T_R = rayonPied(TUNNEL.a) + 0.8, T_X = T_R * Math.sin(TUNNEL.a), T_Z = -T_R * Math.cos(TUNNEL.a);
const T_FX = -Math.sin(TUNNEL.a), T_FZ = Math.cos(TUNNEL.a); // le devant (vers le centre du cratère)
const T_LX = Math.cos(TUNNEL.a), T_LZ = Math.sin(TUNNEL.a); // le long de la façade
/** Le tube : sa demi-largeur, la hauteur de ses murs (la voûte en demi-cercle au-dessus), sa longueur dessinée. */
const TUBE = { l: 2.7, mur: 3.0, fond: 18 };
/** La façade : sa profondeur (le sol de la paroi la recouvre par derrière), et ses gradins [demi-largeur, hauteur]. */
const FACADE = { prof: 5.5, gradins: [[5.6, 8.6], [7.4, 6.4], [9.0, 4.2]] };
/** Un point du lieu dans le repère du tunnel : [lx, d]. */
const versTunnel = (x, z) => { const dx = x - T_X, dz = z - T_Z; return [dx * T_LX + dz * T_LZ, -(dx * T_FX + dz * T_FZ)]; };
/** Un point du repère du tunnel dans le lieu : [x, z]. */
const duTunnel = (lx, d) => [T_X + lx * T_LX - d * T_FX, T_Z + lx * T_LZ - d * T_FZ];
const hautFacade = (lx) => { const a = Math.abs(lx); for (const [l, h] of FACADE.gradins) if (a <= l) return h; return 0; };
const T_Y = relief(...duTunnel(0, -0.4)); // la route, devant la façade

// la route (du tunnel au camping) et les chemins de terre (vers l'escalier, au petit volcan, sur la crête)
const ROUTE = [duTunnel(0, -0.6), [-41.5, -31.7], [-36, -24], [-31.5, -12], [-30.5, 0], [-31, 10], [-27, 22], [-19, 33], [-8, 39], [4, 41]];

/**
 * Le sol : le relief, et au tunnel : sous l'entrée, le sol passe sous la chaussée ; derrière la façade, il monte
 * jusqu'à son dessus (la paroi la recouvre) ; entre les deux, dans le tube, la grille fine a un trou (trouSol) :
 * sinon, ce talus d'un mètre se verrait dans l'entrée, devant le fond du tunnel.
 */
function terrain(x, z) {
  const h = relief(x, z);
  if (Math.abs(x - T_X) > 13 || Math.abs(z - T_Z) > 13) return h;
  const [lx, d] = versTunnel(x, z), a = Math.abs(lx);
  if (d < 0.25 || d > 9 || a > 8.6) return h;
  const dessus = Math.max(h, hautFacade(Math.min(a, 8.99)) - 0.25), route = T_Y - 0.45;
  const v = route + (dessus - route) * lisse(1.6, 3.2, d);
  return h + (v - h) * (1 - lisse(5.5, 9, d)) * (1 - lisse(7.8, 8.6, a));
}

/** Les cases (x0, z0, x1, z1) de la grille fine à ne pas dessiner : le talus du sol dans le tube du tunnel. */
function trouSol(x0, z0, x1, z1) {
  if (x1 < T_X - 12 || x0 > T_X + 12 || z1 < T_Z - 12 || z0 > T_Z + 12) return false;
  let dmin = Infinity, dmax = -Infinity, amin = Infinity;
  for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) {
    const [lx, d] = versTunnel(x, z);
    dmin = Math.min(dmin, d); dmax = Math.max(dmax, d); amin = Math.min(amin, Math.abs(lx));
  }
  return amin < TUBE.l + 0.9 && dmax > 1.6 && dmin < 3.2;
}

/**
 * Le relief : le fond du cratère (presque plat), la paroi très raide tout autour, la crête (un plateau au nord),
 * puis les flancs de l'île jusqu'à la mer et ses falaises ; Maruyama et son cratère ; l'escalier taillé
 * dans la paroi ; le belvédère creusé en gradins, la butte d'Ōtonbu.
 */
function relief(x, z) {
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
  // le belvédère, creusé en gradins (la cuvette ; les gradins de pierre sont posés dessus)
  const db = Math.hypot(x - BELVEDERE.x, z - BELVEDERE.z);
  if (db < BELVEDERE.r + 4) h += (Y_BELVEDERE - BELVEDERE.creux * (1 - lisse(1.5, BELVEDERE.r, db)) - h) * (1 - lisse(BELVEDERE.r + 1, BELVEDERE.r + 4, db));
  // le petit creux du trésor
  const dc = Math.hypot(x - TRESOR.x, z - TRESOR.z);
  if (dc < TRESOR.r) h -= TRESOR.creux * (1 - (dc / TRESOR.r) ** 2) ** 2;
  // la butte d'Ōtonbu
  const dt = Math.hypot(x - OTONBU.x, z - OTONBU.z);
  if (dt < OTONBU.r) h += OTONBU.haut * (1 - lisse(3, OTONBU.r, dt)); // (le haut, plat : la plate-forme)
  // l'escalier, en dernier : une bande aplanie à la hauteur des marches. Sous elles, le sol s'enfonce (elles sont
  // pleines jusque-là), et à leurs bouts, un accotement plus bas qu'elles : entre deux points du maillage (tous
  // les mètres), le sol aplani ne passe plus par-dessus les marches. (Fait avant le belvédère, son pourtour, qui
  // remonte vers lui, relevait encore le sol de 1 à 2 m sur le haut de la volée : 2026-10-23.)
  const [bx0, bx1, bz0, bz1] = BOITE_ESCALIER;
  if (x > bx0 && x < bx1 && z > bz0 && z < bz1) {
    const c = surLaLigne(MARCHES, x, z);
    if (c.d < 4.8) {
      // (dans le coude du haut, à côté des dernières marches : leur hauteur, pas celle du pas sur la crête)
      const cv = surLaLigne(VOLEE, x, z), hc = cv.d < c.d + 1.5 ? Math.min(c.h, cv.h) : c.h;
      h += (hc - h) * (1 - lisse(3.2, 4.8, c.d));
      // (jusqu'au bout du palier de pierre posé sur la crête, au haut de la volée)
      const v = surLaLigne(MARCHES, x, z), dans = lisse(0, 0.5, v.s) * (1 - lisse(LONG_VOLEE - 0.1, LONG_VOLEE + 0.4, v.s));
      // (enfoncé seulement sous les marches et le chemin où l'on y marche : à côté, on passerait dessous)
      if (dans > 0) h -= dans * (v.d < 1.1 ? 0.65 : 0.35 * (1 - lisse(2.3, 3.2, v.d)));
    }
  }
  return h;
}

/**
 * Le rayon de la barrière de la crête à l'angle t : à BARRIERE du bord. Mais au-dessus de la volée du haut de
 * l'escalier, qui longe le bord, l'entaille des marches creuse le sol : la barrière y plongeait, puis remontait
 * tout droit vers la crête (2026-10-23). Elle passe là sur le plateau, au bord de l'entaille (le premier point, en
 * s'éloignant du vide, où le sol n'est plus creusé), lissée d'un poteau à l'autre ; et sur le belvédère, que
 * l'entaille longe aussi, le bord de son anneau de pierre (ANNEAU). Calculé une fois, tous les 0,005 rad.
 */
let ecartsBarriere = null;
const PAS_BARRIERE = 0.005;
function rayonBarriere(t) {
  if (!ecartsBarriere) {
    const n = Math.round((PLATEAU[1] - PLATEAU[0]) / PAS_BARRIERE), brut = [];
    for (let i = 0; i <= n; i++) {
      const a = PLATEAU[0] + i * PAS_BARRIERE, r0 = rayonPied(a) + PAROI + BARRIERE, h0 = hauteurCrete(a);
      let r = r0;
      while (r < r0 + 8 && relief(r * Math.sin(a), -r * Math.cos(a)) < h0 - 0.45) r += 0.2;
      brut.push(r - r0);
    }
    // le plus grand écart à 1,5 m autour (elle passe au large de l'entaille), puis une moyenne glissante
    const large = brut.map((_, i) => Math.max(...brut.slice(Math.max(0, i - 4), i + 5)));
    ecartsBarriere = large.map((_, i) => { const v = large.slice(Math.max(0, i - 6), i + 7); return v.reduce((s, x) => s + x, 0) / v.length; });
  }
  const e = ecartsBarriere, u = Math.min(Math.max((t - PLATEAU[0]) / PAS_BARRIERE, 0), e.length - 1), i = Math.floor(u);
  const r = rayonPied(t) + PAROI + BARRIERE + e[i] + ((e[Math.min(i + 1, e.length - 1)]) - e[i]) * (u - i);
  // (dans le belvédère : là où le rayon de l'angle t entre dans l'anneau)
  const b = BELVEDERE.x * Math.sin(t) - BELVEDERE.z * Math.cos(t), q = b * b - BELVEDERE.x ** 2 - BELVEDERE.z ** 2 + ANNEAU ** 2;
  return q > 0 && r > b - Math.sqrt(q) ? b - Math.sqrt(q) : r;
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
  return r > rayonBarriere(a) || surLaLigne(MARCHES, x, z).d < 1.5;
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
  const bancs = []; // où l'on s'assoit (monde.js : pointDuBanc)
  const lumieres = []; // ce qui éclaire la nuit : un halo, une lumière au sol (lueurs.js)
  // les textes peints (etiquettes.js) : ecrire(pose de l'objet { x, y, z, ry }, étiquette dans son repère)
  const etiquettes = [];
  const ecrire = (o, e) => {
    const c = Math.cos(o.ry || 0), sn = Math.sin(o.ry || 0);
    etiquettes.push({ ...e, x: o.x + e.x * c + e.z * sn, y: o.y + e.y, z: o.z - e.x * sn + e.z * c, ry: (o.ry || 0) + (e.ry || 0) });
  };

  // ---------------------------------------------------------------- Le tunnel (青宝トンネル), dans la paroi
  // la seule route vers le fond du cratère. La façade de béton en gradins (la paroi la recouvre par derrière),
  // l'arche et son bandeau, la plaque du nom ; dedans, le tube qui s'enfonce en s'assombrissant, ses trottoirs, ses
  // lampes orange, les lignes blanches de la chaussée. Construit face à +z (le cratère), y = 0 : la route.
  const xT = T_X, zT = T_Z, ryT = vers(T_X, T_Z, 0, 0);
  {
    const a = atelier(), { l: W, mur: HM, fond } = TUBE, PROF = FACADE.prof;
    const BETON = '#d6d1c4', NUIT = '#1e1c1a';
    /** La couleur c à d mètres dans le tunnel : de plus en plus sombre. */
    const sombre = (c, d) => melanger(c, NUIT, Math.min(1, Math.max(0, d) / fond) ** 0.55);
    // le contour de l'ouverture (élargi de e) : les murs, la voûte en demi-cercle, la chaussée
    const arche = (f, e = 0) => {
      f.moveTo(-W - e, 0); f.lineTo(-W - e, HM); f.absarc(0, HM, W + e, PI, 0, true); f.lineTo(W + e, 0); f.lineTo(-W - e, 0);
      return f;
    };
    // le gradin du milieu, percé de l'ouverture sur toute sa profondeur : ses faces dedans font l'entrée du tube
    const [l0, h0] = FACADE.gradins[0];
    const forme = new THREE.Shape();
    forme.moveTo(-l0, -0.6); forme.lineTo(l0, -0.6); forme.lineTo(l0, h0); forme.lineTo(-l0, h0); forme.lineTo(-l0, -0.6);
    forme.holes.push(arche(new THREE.Path()));
    const dedans = (x, y, z) => Math.abs(x) < W + 0.01 && y > -0.01 && y < HM + W + 0.01 && z < -0.01 && z > -PROF + 0.01;
    a.piece(new THREE.ExtrudeGeometry(forme, { depth: PROF, bevelEnabled: false, steps: 5, curveSegments: 16 }), BETON, {
      z: -PROF, nuance: 0.03,
      teinte: (x, y, z) => (!dedans(x, y, z) ? BETON : sombre(y < 0.02 ? '#7c7872' : y < 0.9 ? '#b9b3a6' : '#cdc7ba', -z)),
    });
    // les gradins des côtés (des murs de soutènement) et leurs chaperons ; celui du milieu
    for (const sg of [-1, 1]) {
      for (let k = 1; k < FACADE.gradins.length; k++) {
        const [l, h] = FACADE.gradins[k], lp = FACADE.gradins[k - 1][0];
        a.boite(l - lp, h + 0.6, PROF, BETON, { x: (sg * (l + lp)) / 2, y: (h - 0.6) / 2, z: -PROF / 2, nuance: 0.03 })
          .boite(l - lp + 0.02, 0.2, 0.42, '#c9c3b6', { x: (sg * (l + lp)) / 2, y: h + 0.1, z: 0.08 });
      }
    }
    a.boite(2 * l0 + 0.04, 0.24, 0.5, '#c9c3b6', { y: h0 + 0.12, z: 0.06 });
    // le bandeau en relief autour de l'arche
    const bandeau = new THREE.Shape(), E = 0.55;
    bandeau.moveTo(-W - E, 0); bandeau.lineTo(-W - E, HM); bandeau.absarc(0, HM, W + E, PI, 0, true); bandeau.lineTo(W + E, 0);
    bandeau.lineTo(W, 0); bandeau.lineTo(W, HM); bandeau.absarc(0, HM, W, 0, PI, false); bandeau.lineTo(-W, 0); bandeau.lineTo(-W - E, 0);
    a.piece(new THREE.ExtrudeGeometry(bandeau, { depth: 0.26, bevelEnabled: false, curveSegments: 16 }), '#e4dfd3', {});
    // la plaque du nom, au-dessus de l'arche
    a.boite(3.9, 0.98, 0.14, '#8d887e', { y: 7.15, z: 0.07 });
    ecrire({ x: T_X, z: T_Z, y: T_Y, ry: ryT }, { texte: '青宝トンネル', sous: 'SEIHŌ TUNNEL', x: 0, y: 7.15, z: 0.146, l: 3.66, h: 0.78, fond: '#f2eee3', encre: '#2a2622', cadre: '#9a948a' });
    // le tube : ses murs, sa voûte et sa chaussée, tournés vers dedans, par tranches de plus en plus sombres
    const profil = [[-W, 0], [-W, 0.9], [-W, HM]];
    for (let i = 1; i < 16; i++) { const t = PI - (i / 16) * PI; profil.push([W * Math.cos(t), HM + W * Math.sin(t)]); }
    profil.push([W, HM], [W, 0.9], [W, 0], [-W, 0]);
    const tri = [], couleurs = [], tranches = 9;
    for (let j = 0; j < tranches; j++) {
      const za = -PROF - (j * (fond - PROF)) / tranches, zb = -PROF - ((j + 1) * (fond - PROF)) / tranches, dm = -(za + zb) / 2;
      for (let i = 0; i < profil.length - 1; i++) {
        const [x0, y0] = profil[i], [x1, y1] = profil[i + 1];
        const A = [x0, y0, za], B = [x1, y1, za], Cc = [x1, y1, zb], D = [x0, y0, zb];
        // la normale de (A, B, Cc), tournée vers l'axe du tube ; sinon, l'autre sens
        const nx = (y1 - y0) * (zb - za), ny = -(x1 - x0) * (zb - za);
        const versAxe = nx * -((x0 + x1) / 2) + ny * (HM * 0.8 - (y0 + y1) / 2) > 0;
        tri.push(...(versAxe ? [A, B, Cc, A, Cc, D] : [A, Cc, B, A, D, Cc]));
        const c = sombre(y0 + y1 < 0.05 ? '#7c7872' : (y0 + y1) / 2 < 0.9 ? '#b9b3a6' : '#cdc7ba', dm);
        couleurs.push(c, c);
      }
    }
    const tube = new THREE.BufferGeometry();
    tube.setAttribute('position', new THREE.Float32BufferAttribute(tri.flat(), 3));
    a.piece(tube, '#cdc7ba', { couleurs, trait: false, nuance: 0.02 });
    a.piece(new THREE.ShapeGeometry(arche(new THREE.Shape()), 16), NUIT, { z: -fond, trait: false });
    // les trottoirs le long des murs, les lignes blanches de la chaussée, de l'entrée au fond
    const nT = 12;
    for (let j = 0; j < nT; j++) {
      const za = -(j * fond) / nT, zb = -((j + 1) * fond) / nT, dm = -(za + zb) / 2, lz = za - zb;
      for (const sg of [-1, 1]) {
        a.boite(0.72, 0.22, lz, sombre('#bdb7aa', dm), { x: sg * (W - 0.36), y: 0.11, z: (za + zb) / 2, trait: false, nuance: 0.01 })
          .boite(0.12, 0.012, lz, sombre('#f2efe6', dm), { x: sg * (W - 0.95), y: 0.006, z: (za + zb) / 2, trait: false, nuance: 0.01 });
      }
    }
    // les lampes orange, en haut des murs (des lampes : elles brillent toujours)
    for (let d = 1.6; d < fond - 0.5; d += 2.6) {
      for (const sg of [-1, 1]) a.boite(0.1, 0.16, 0.62, '#ffc061', { x: sg * (W - 0.05), y: HM - 0.25, z: -d, trait: false, sorte: 'lampe' });
    }
    poser(a.fin(0, peinture), T_X, T_Z, { ry: ryT, y: T_Y });
    // on n'entre pas dans le tunnel (une barrière qu'on ne voit pas, devant la façade)
    const [m0, m1] = [duTunnel(-9.3, -0.35), duTunnel(9.3, -0.35)];
    monde.mur(m0[0], m0[1], m1[0], m1[1], 0.35);
    // pour la caméra : la façade, en blocs (son repère est tourné)
    for (const lx of [-7.2, -3.6, 0, 3.6, 7.2]) { const [x, z] = duTunnel(lx, 2.9); monde.bloc(x - 2.2, x + 2.2, z - 2.2, z + 2.2, T_Y - 2, T_Y + 9); }
  }

  // ---- Au bord de la route : des balises blanches à catadioptre orange en sortant du tunnel, la vitesse limite,
  // et le miroir de virage orange au carrefour du chemin de l'escalier (on en voit à tous les coins de rue au Japon)
  {
    const a = atelier();
    /** Le point de la route à s mètres du tunnel, décalé de dec (> 0 : à droite en sortant), et la direction. */
    const surRoute = (s0, dec) => {
      let sr = s0;
      for (let k = 0; k < ROUTE.length - 1; k++) {
        const [x0, z0] = ROUTE[k], [x1, z1] = ROUTE[k + 1], l = Math.hypot(x1 - x0, z1 - z0), ux = (x1 - x0) / l, uz = (z1 - z0) / l;
        if (sr <= l) return [x0 + ux * sr - uz * dec, z0 + uz * sr + ux * dec, Math.atan2(ux, uz)];
        sr -= l;
      }
      return null;
    };
    for (let sr = 4; sr <= 26; sr += 4.4) {
      for (const dec of [-2.6, 2.6]) {
        const [x, z, cap] = surRoute(sr, dec), y = terrain(x, z);
        a.boite(0.07, 0.85, 0.07, P.blanc, { x, y: y + 0.4, z, ry: cap })
          .cylindre(0.05, 0.05, 0.14, 10, '#f08a2a', { x, y: y + 0.72, z, rx: PI / 2, ry: cap, ordre: 'YXZ', trait: false });
        monde.cercle(x, z, 0.15);
      }
    }
    // la vitesse limite (30 km/h), tournée vers qui sort du tunnel, à gauche de la route (on roule à gauche au Japon)
    {
      const [x, z, cap] = surRoute(8, -3.0), y = terrain(x, z);
      a.cylindre(0.04, 0.04, 2.3, 8, '#a9adb0', { x, y: y + 1.12, z })
        .cylindre(0.31, 0.31, 0.02, 20, '#a9adb0', { x, y: y + 2.05, z, rx: PI / 2, ry: cap, ordre: 'YXZ' });
      etiquettes.push({ texte: '30', forme: 'rond', fond: '#ffffff', cadre: '#d8302c', encre: '#2a4a9a', x: x - Math.sin(cap) * 0.017, y: y + 2.05, z: z - Math.cos(cap) * 0.017, ry: cap + PI, l: 0.6, h: 0.6 });
      monde.cercle(x, z, 0.2);
    }
    {
      const { x, z } = MIROIR, y = terrain(x, z), cap = Math.atan2(-31 - x, -11 - z); // il regarde le carrefour
      const o = (d, h) => ({ x: x + Math.sin(cap) * d, y: y + h, z: z + Math.cos(cap) * d });
      a.cylindre(0.045, 0.05, 2.75, 8, '#e8732e', { x, y: y + 1.37, z })
        .boite(0.12, 0.3, 0.12, '#e8732e', { ...o(0.06, 2.75), ry: cap })
        .piece(new THREE.CylinderGeometry(0.36, 0.36, 0.07, 22), '#e8732e', { ...o(0.12, 2.75), rx: PI / 2 - 0.12, ry: cap, ordre: 'YXZ' })
        .piece(new THREE.CylinderGeometry(0.31, 0.31, 0.02, 22), '#c9dde6', { ...o(0.165, 2.75), rx: PI / 2 - 0.12, ry: cap, ordre: 'YXZ', trait: false })
        .piece(new THREE.CylinderGeometry(0.4, 0.4, 0.04, 22, 1, false, -PI / 2, PI), '#e8732e', { ...o(0.15, 3.12), rx: 0.3, ry: cap, ordre: 'YXZ' });
      monde.cercle(x, z, 0.3);
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Le sauna (ふれあいサウナ), où l'on entre
  // un bâtiment de béton au toit de tôle, le rideau bleu « ゆ » à la porte, un distributeur de boissons devant.
  // Dedans : l'entrée (les casiers à chaussures, un banc, la boîte du prix), puis la salle de vapeur (les gradins de
  // bois, les caillebotis, les grilles d'où monte la vapeur du volcan, le sablier de douze minutes, le
  // thermomètre) : on s'y assoit. Construit face à +z, puis tourné d'un quart de tour : son devant regarde la route.
  const S = { haut: 3.2, sol: 0.3, porte: [-2.9, -1.5], cloison: -0.4, passage: [0.9, 2.3] };
  const yS = terrain(SAUNA.x, SAUNA.z) - 0.05, solS = yS + S.sol;
  /** Du repère du sauna au lieu (un quart de tour). */
  const versSauna = (lx, lz) => [SAUNA.x + lz, SAUNA.z - lx];
  const poseS = { x: SAUNA.x, z: SAUNA.z, y: yS, ry: PI / 2 };
  const SIEGE = { x: versSauna(2.15, -2.42)[0], z: versSauna(2.15, -2.42)[1], y: solS + 0.45, cap: PI / 2 };
  {
    const a = atelier(), B = '#dcd7cb', CLAIR = '#e2c79a', H = S.haut, y0 = S.sol, yh = y0 + H, [p0, p1] = S.porte, [q0, q1] = S.passage, X = S.cloison;
    // la dalle, les murs (la porte devant ; une cloison entre l'entrée et la salle de vapeur), le plafond de bois, le toit
    a.boite(9.2, 0.8, 7.2, P.beton, { y: y0 - 0.4 })
      .boite(9, H, 0.2, B, { y: y0 + H / 2, z: -3.4 })
      .boite(0.2, H, 6.6, B, { x: -4.4, y: y0 + H / 2 }).boite(0.2, H, 6.6, B, { x: 4.4, y: y0 + H / 2 })
      .boite(p0 + 4.5, H, 0.2, B, { x: (p0 - 4.5) / 2, y: y0 + H / 2, z: 3.4 })
      .boite(4.5 - p1, H, 0.2, B, { x: (p1 + 4.5) / 2, y: y0 + H / 2, z: 3.4 })
      .boite(p1 - p0, H - 2.2, 0.2, B, { x: (p0 + p1) / 2, y: y0 + 2.2 + (H - 2.2) / 2, z: 3.4 })
      .boite(0.14, H - 0.06, q0 + 3.3, B, { x: X, y: y0 + (H - 0.06) / 2, z: (q0 - 3.3) / 2 })
      .boite(0.14, H - 0.06, 3.3 - q1, B, { x: X, y: y0 + (H - 0.06) / 2, z: (q1 + 3.3) / 2 })
      .boite(0.14, H - 2.26, q1 - q0, B, { x: X, y: y0 + 2.2 + (H - 2.26) / 2, z: (q0 + q1) / 2 })
      .boite(8.6, 0.06, 6.6, CLAIR, { y: yh - 0.03 })
      .boite(9.6, 0.16, 7.6, P.tole, { y: yh + 0.08 })
      .pignon(9.9, 0.85, 7.9, P.tole, { y: yh + 0.16 })
      .cylindre(0.2, 0.2, 1.6, 10, '#8f8c88', { x: 2.6, y: yh + 1.4, z: -1.2 });
    // la porte : son cadre de bois, la marche devant, le rideau (noren) bleu, l'enseigne. (Les montants avancent de
    // 2 cm dans l'ouverture et le linteau les déborde : leurs faces étaient dans le plan du bout des murs et des
    // montants, elles scintillaient ; et la marche était enterrée sous le sol, 2026-10-23.)
    for (const x of [p0 - 0.04, p1 + 0.04]) a.boite(0.12, 2.2, 0.28, P.bois, { x, y: y0 + 1.1, z: 3.4 });
    a.boite(p1 - p0 + 0.28, 0.12, 0.3, P.bois, { x: (p0 + p1) / 2, y: y0 + 2.24, z: 3.4 })
      .boite(1.8, 0.42, 0.7, P.beton, { x: (p0 + p1) / 2, y: -0.06, z: 3.85 })
      .cylindre(0.02, 0.02, 1.5, 6, P.boisFonce, { x: (p0 + p1) / 2, y: y0 + 2.12, z: 3.6, rz: PI / 2 });
    for (const x of [p0 + 0.35, p1 - 0.35]) a.boite(0.66, 0.68, 0.02, '#2f5f8a', { x, y: y0 + 1.76, z: 3.6, trait: false });
    ecrire(poseS, { texte: 'ゆ', fond: '#2f5f8a', encre: '#ffffff', x: p0 + 0.35, y: y0 + 1.78, z: 3.615, l: 0.42, h: 0.42 });
    a.boite(2.9, 0.72, 0.1, P.bois, { x: (p0 + p1) / 2, y: y0 + 2.76, z: 3.56 });
    ecrire(poseS, { texte: 'ふれあいサウナ', fond: '#f3e7cf', encre: '#6a2a1a', x: (p0 + p1) / 2, y: y0 + 2.76, z: 3.615, l: 2.72, h: 0.56 });
    // les fenêtres en verre dépoli (elles traversent le mur : jamais dans son plan)
    a.boite(1.4, 0.7, 0.24, '#a9c3cb', { x: 2.4, y: y0 + 2.2, z: 3.4, trait: false })
      .boite(0.24, 0.7, 1.2, '#a9c3cb', { x: 4.4, y: y0 + 2.2, z: 0.6, trait: false })
      .boite(1.2, 0.5, 0.24, '#a9c3cb', { x: -2.4, y: y0 + 2.5, z: -3.4, trait: false });
    // l'entrée : les casiers à chaussures (getabako), un banc, la boîte du prix et son écriteau, la lampe
    a.boite(0.42, 1.2, 2.0, P.bois, { x: -4.09, y: y0 + 0.6, z: -1.9 });
    for (let rg = 0; rg < 4; rg++) for (let cl = 0; cl < 5; cl++) a.boite(0.012, 0.2, 0.32, '#5a3e28', { x: -3.873, y: y0 + 0.18 + rg * 0.28, z: -2.7 + cl * 0.4, trait: false });
    a.boite(2.4, 0.06, 0.42, P.bois, { x: -2.4, y: y0 + 0.44, z: -3.05 });
    bancs.push({ de: versSauna(-3.25, -3.0), a: versSauna(-1.55, -3.0), y: solS + 0.47, cap: PI / 2 });
    for (const x of [-3.4, -1.4]) a.boite(0.06, 0.42, 0.36, P.boisFonce, { x, y: y0 + 0.21, z: -3.05 });
    a.boite(0.3, 0.04, 0.5, P.bois, { x: X - 0.22, y: y0 + 1.0, z: -1.2 })
      .boite(0.22, 0.2, 0.3, '#7a5232', { x: X - 0.22, y: y0 + 1.12, z: -1.2 })
      .boite(0.12, 0.012, 0.03, '#2a2420', { x: X - 0.22, y: y0 + 1.226, z: -1.2, trait: false });
    ecrire(poseS, { texte: '入浴料 300円', fond: '#fbf3df', encre: '#3a2420', x: X - 0.075, y: y0 + 1.6, z: -1.2, ry: -PI / 2, l: 0.9, h: 0.38 });
    a.cylindre(0.2, 0.16, 0.08, 12, '#fff1c8', { x: -2.4, y: yh - 0.1, z: 0, sorte: 'lampe' });
    // la salle de vapeur : le carrelage, les caillebotis de bois, les deux gradins, les grilles de vapeur, le seau
    a.boite(4.6, 0.02, 6.6, P.pierreFonce, { x: 2.0, y: y0 + 0.01, z: 0 });
    for (let x = -0.15; x < 3.3; x += 0.15) a.boite(0.1, 0.03, 5.2, CLAIR, { x, y: y0 + 0.035, z: 0.6, trait: false });
    a.boite(4.6, 0.43, 0.04, P.bois, { x: 2.0, y: y0 + 0.235, z: -2.12 })
      .boite(4.6, 0.88, 0.04, P.bois, { x: 2.0, y: y0 + 0.46, z: -2.72 });
    for (let i = 0; i < 4; i++) {
      a.boite(4.56, 0.035, 0.13, CLAIR, { x: 2.02, y: y0 + 0.437, z: -2.2 - i * 0.15 })
        .boite(4.56, 0.035, 0.13, CLAIR, { x: 2.02, y: y0 + 0.887, z: -2.8 - i * 0.15 });
    }
    for (const z of [0.4, 2.0]) {
      a.boite(0.7, 0.03, 0.7, '#3a3a3a', { x: 3.8, y: y0 + 0.035, z });
      for (let i = 0; i < 5; i++) a.boite(0.66, 0.012, 0.05, '#77787a', { x: 3.8, y: y0 + 0.056, z: z - 0.26 + i * 0.13, trait: false });
      const [vx, vz] = versSauna(3.8, z);
      vapeurs.push({ x: vx, z: vz, y: solS + 0.06, n: 5, haut: 2.4, large: 0.3, taille: 0.75 });
    }
    a.cylindre(0.17, 0.14, 0.26, 12, P.bois, { x: 3.6, y: y0 + 0.15, z: -1.4 })
      .cylindre(0.175, 0.175, 0.03, 12, '#5a5a60', { x: 3.6, y: y0 + 0.21, z: -1.4, trait: false })
      .cylindre(0.155, 0.155, 0.03, 12, '#5a5a60', { x: 3.6, y: y0 + 0.08, z: -1.4, trait: false })
      .cylindre(0.06, 0.05, 0.07, 8, P.bois, { x: 3.62, y: y0 + 0.32, z: -1.28 })
      .baton([3.62, y0 + 0.32, -1.28], [3.5, y0 + 0.3, -1.68], 0.012, P.boisFonce, 4);
    // le sablier de douze minutes et le thermomètre, au mur ; « 高温注意 » à la porte ; la lampe dans sa cage
    a.cylindre(0.24, 0.24, 0.06, 18, '#3a2420', { x: 4.27, y: y0 + 2.0, z: -1.0, rz: PI / 2 })
      .boite(0.04, 0.62, 0.24, '#7a5232', { x: 4.28, y: y0 + 1.95, z: -0.35 });
    ecrire(poseS, { fond: null, dessin: douzeMinutes, x: 4.235, y: y0 + 2.0, z: -1.0, ry: -PI / 2, l: 0.44, h: 0.44 });
    ecrire(poseS, { fond: null, dessin: thermometre, x: 4.255, y: y0 + 1.95, z: -0.35, ry: -PI / 2, l: 0.2, h: 0.58 });
    ecrire(poseS, { texte: '高温注意', fond: '#f6d33a', encre: '#2a2420', x: X + 0.075, y: y0 + 1.85, z: q0 - 0.45, ry: PI / 2, l: 0.62, h: 0.28 });
    a.cylindre(0.11, 0.11, 0.16, 10, '#fff1c8', { x: 2.0, y: y0 + 2.55, z: -3.22, rx: PI / 2, sorte: 'lampe' });
    for (const dx of [-0.1, 0, 0.1]) a.boite(0.015, 0.24, 0.2, '#3a3236', { x: 2.0 + dx, y: y0 + 2.55, z: -3.2, trait: false });
    // le distributeur de boissons, contre le mur de devant, et sa poubelle à canettes
    a.boite(1.0, 1.83, 0.72, '#2f6fb8', { x: -3.6, y: 0.915, z: 3.88 })
      .boite(1.02, 0.1, 0.74, '#f2f2f2', { x: -3.6, y: 1.88, z: 3.88 })
      .boite(0.86, 0.38, 0.02, '#f4f4f4', { x: -3.6, y: 0.6, z: 4.25 })
      .boite(0.06, 0.12, 0.02, '#2a2a2e', { x: -3.3, y: 0.66, z: 4.265, trait: false })
      .boite(0.7, 0.2, 0.03, '#2a2a2e', { x: -3.6, y: 0.22, z: 4.255, trait: false })
      .boite(0.38, 0.72, 0.38, '#e8e4dc', { x: -4.3, y: 0.36, z: 3.75 })
      .cylindre(0.09, 0.09, 0.02, 12, '#2a2a2e', { x: -4.3, y: 0.725, z: 3.75, trait: false });
    ecrire(poseS, { fond: '#ffffff', dessin: canettes, lumineux: true, x: -3.6, y: 1.3, z: 4.245, l: 0.84, h: 0.8 });
    // la lampe de la porte (allumée la nuit) ; la nuit, le distributeur éclaire devant lui, d'une lumière blanche
    // (à droite de la porte, sous l'enseigne)
    a.boite(0.16, 0.22, 0.12, '#fff1c8', { x: p1 + 1.0, y: y0 + 2.2, z: 3.56, sorte: 'lumiere' })
      .boite(0.22, 0.04, 0.17, '#3a3a3a', { x: p1 + 1.0, y: y0 + 2.33, z: 3.575 });
    {
      const [lx, lz] = versSauna(p1 + 1.0, 3.8), [dx, dz] = versSauna(-3.6, 4.55);
      lumieres.push({ x: lx, y: yS + y0 + 2.18, z: lz, halo: 0.4, sol: terrain(lx, lz), r: 2.3 },
        { x: dx, y: yS + 1.25, z: dz, halo: 0.5, sol: terrain(dx, dz), r: 1.8, c: '#dcefff' });
    }
    ecrire(poseS, { texte: 'あきかん', fond: '#e8e4dc', encre: '#3a6a3a', x: -4.3, y: 0.52, z: 3.945, l: 0.32, h: 0.13 });
    poser(a.fin(0, peinture), SAUNA.x, SAUNA.z, { ry: PI / 2, y: yS });
    vapeurs.push({ x: versSauna(2.6, -1.2)[0], z: versSauna(2.6, -1.2)[1], y: solS + H + 2.3, n: 10, haut: 4, large: 0.6, taille: 1.1 });

    // ce qui arrête (dans le lieu) : les murs (la porte, le passage), les gradins, les casiers, le banc, le seau,
    // le distributeur ; les sols : l'entrée, les caillebotis, la marche
    const m = (lx0, lz0, lx1, lz1, rr) => monde.mur(...versSauna(lx0, lz0), ...versSauna(lx1, lz1), rr);
    m(-4.5, -3.4, 4.5, -3.4, 0.3); m(-4.4, -3.5, -4.4, 3.5, 0.3); m(4.4, -3.5, 4.4, 3.5, 0.3);
    m(-4.5, 3.4, p0, 3.4, 0.3); m(p1, 3.4, 4.5, 3.4, 0.3);
    m(X, -3.5, X, q0, 0.28); m(X, q1, X, 3.5, 0.28);
    m(-0.3, -2.12, 4.3, -2.12, 0.25);
    m(-3.88, -2.9, -3.88, -0.9, 0.28);
    m(-3.6, -2.84, -1.2, -2.84, 0.24);
    m(3.45, -1.4, 3.75, -1.4, 0.24);
    m(-4.5, 3.88, -3.1, 3.88, 0.42);
    const zone = (lx0, lx1, lz0, lz1) => { const [xa, za] = versSauna(lx0, lz0), [xb, zb] = versSauna(lx1, lz1); return [Math.min(xa, xb), Math.max(xa, xb), Math.min(za, zb), Math.max(za, zb)]; };
    monde.surface(...zone(-4.3, X, -3.3, 3.3), solS, { sol: 'pierre' });
    monde.surface(...zone(X, 4.3, -3.3, 3.3), solS + 0.05, { sol: 'bois' });
    monde.surface(...zone(p0 - 0.2, p1 + 0.2, 3.5, 4.2), solS - 0.15, { sol: 'pierre' });
    // pour la caméra : chaque mur, la cloison, et le toit (dessous, elle se rapproche et passe sous le plafond)
    const bas = yS - 1, haut = solS + H;
    for (const z4 of [[-4.5, 4.5, -3.5, -3.3], [-4.5, -4.3, -3.5, 3.5], [4.3, 4.5, -3.5, 3.5], [-4.5, p0, 3.3, 3.5], [p1, 4.5, 3.3, 3.5], [X - 0.07, X + 0.07, -3.3, q0], [X - 0.07, X + 0.07, q1, 3.3]]) monde.bloc(...zone(...z4), bas, haut);
    for (const z4 of [[p0, p1, 3.3, 3.5], [X - 0.07, X + 0.07, q0, q1]]) monde.bloc(...zone(...z4), solS + 2.2, haut);
    monde.toit(...zone(-4.8, 4.8, -3.8, 3.8), haut - 0.06, haut + 1.1);
  }

  // la marmite géothermique (地熱釜) : un comptoir de pierre sous un auvent, trois marmites ; dans celle du milieu,
  // ouverte, un panier d'œufs au-dessus de la vapeur ; des patates douces à côté ; l'écriteau
  {
    const a = atelier();
    a.boite(3.4, 0.9, 1.3, P.pierre, { y: 0.45 })
      .boite(3.5, 0.06, 1.4, P.pierreFonce, { y: 0.92, trait: false });
    for (const k of [0, 2]) {
      a.boite(0.82, 0.12, 0.82, '#6a4a32', { x: -1.08 + k * 1.08, y: 1.0 })
        .boite(0.4, 0.07, 0.07, '#4a3222', { x: -1.08 + k * 1.08, y: 1.1 });
    }
    // le panier (zaru) d'œufs, posé sur la marmite ouverte
    a.boite(0.8, 0.03, 0.8, '#2a2420', { y: 0.96, trait: false })
      .cylindre(0.33, 0.27, 0.12, 14, '#c9a65a', { y: 1.02 });
    for (let i = 0; i < 7; i++) a.ovale(0.055, i % 3 ? '#f4ead8' : '#e9d3b2', { x: Math.sin(i * 2.4) * 0.15 * (i ? 1 : 0), y: 1.11, z: Math.cos(i * 2.4) * 0.15 * (i ? 1 : 0), sy: 1.25, trait: false }, 8);
    for (let i = 0; i < 4; i++) a.ovale(0.06, '#8a3a6a', { x: 1.0 + (i % 2) * 0.16, y: 1.09 + Math.floor(i / 2) * 0.05, z: -0.5 + i * 0.07, sx: 1.8, ry: i, trait: false }, 6);
    for (const [x, z] of [[-1.9, -0.8], [1.9, -0.8], [-1.9, 0.8], [1.9, 0.8]]) a.boite(0.12, 2.4, 0.12, P.boisFonce, { x, y: 1.2, z });
    a.pignon(4.6, 0.6, 2.9, P.tole, { y: 2.38 })
      .boite(1.1, 0.42, 0.04, P.papier, { y: 2.0, z: 0.9, trait: false });
    const y = terrain(MARMITE.x, MARMITE.z) - 0.05;
    poser(a.fin(0, peinture), MARMITE.x, MARMITE.z, { ry: PI / 2, y });
    ecrire({ x: MARMITE.x, z: MARMITE.z, y, ry: PI / 2 }, { texte: '地熱釜', sous: 'じねつがま', fond: P.papier, encre: '#3a2420', x: 0, y: 2.0, z: 0.924, l: 1.06, h: 0.4 });
    monde.surface(MARMITE.x - 0.7, MARMITE.x + 0.7, MARMITE.z - 1.8, MARMITE.z + 1.8, y + 1.1, { plein: true });
    monde.bloc(MARMITE.x - 1.45, MARMITE.x + 1.45, MARMITE.z - 2.3, MARMITE.z + 2.3, y - 1, y + 3.1);
    for (let k = 0; k < 3; k++) vapeurs.push({ x: MARMITE.x, z: MARMITE.z + 1.08 - k * 1.08, y: y + 1.1, n: k === 1 ? 9 : 6, haut: 1.3, large: 0.25, taille: 0.5 });
  }

  // ---- Le petit camion (kei-tora) blanc d'un habitant, garé à côté du sauna, ses caisses de patates douces ;
  // sa plaque jaune (celle des petites voitures au Japon) : les îles d'Izu sont à Tokyo, plaque de Shinagawa
  {
    const a = atelier(), BL = '#f1f0ec', VITRE = '#41607a', N = '#2a2a2e';
    // (chaque pièce à quelques centimètres des autres sur les côtés : dans le même plan, elles scintillaient)
    for (const [x, z] of [[-0.66, 1.05], [0.66, 1.05], [-0.66, -1.05], [0.66, -1.05]]) {
      a.cylindre(0.27, 0.27, 0.18, 14, N, { x, y: 0.27, z, rz: PI / 2 })
        .cylindre(0.13, 0.13, 0.2, 10, '#b9bcbf', { x, y: 0.27, z, rz: PI / 2, trait: false });
    }
    a.boite(1.3, 0.3, 3.3, '#5a5a60', { y: 0.45 })
      .boite(1.46, 1.05, 1.15, BL, { y: 1.0, z: 1.05 })
      .boite(1.38, 0.5, 0.06, VITRE, { y: 1.27, z: 1.64, rx: -0.12, trait: false })
      .boite(0.06, 0.42, 0.8, VITRE, { x: -0.735, y: 1.27, z: 1.0, trait: false })
      .boite(0.06, 0.42, 0.8, VITRE, { x: 0.735, y: 1.27, z: 1.0, trait: false })
      .boite(1.48, 0.16, 0.1, '#c8c8c8', { y: 0.5, z: 1.66 })
      .boite(1.36, 0.07, 2.05, '#e2e1dc', { y: 0.66, z: -0.6 })
      .boite(0.05, 0.32, 2.05, BL, { x: -0.68, y: 0.85, z: -0.6 }).boite(0.05, 0.32, 2.05, BL, { x: 0.68, y: 0.85, z: -0.6 })
      .boite(1.31, 0.32, 0.05, BL, { y: 0.85, z: -1.6 })
      .boite(1.31, 0.55, 0.05, BL, { y: 0.97, z: 0.44 });
    for (const sg of [-1, 1]) a.boite(0.2, 0.12, 0.03, '#fff6c8', { x: sg * 0.5, y: 0.78, z: 1.64, trait: false, sorte: 'lumiere' });
    for (const [x, z] of [[-0.32, -0.3], [0.3, -0.95]]) {
      a.boite(0.5, 0.3, 0.38, '#f2c443', { x, y: 0.85, z });
      for (let i = 0; i < 4; i++) a.ovale(0.07, '#8a3a6a', { x: x - 0.15 + i * 0.1, y: 1.0, z: z + (i % 2 ? 0.06 : -0.06), sx: 1.5, trait: false }, 6);
    }
    a.ovale(0.22, '#d9c08a', { x: 0.28, y: 0.86, z: -0.2, sy: 0.6, sz: 1.3 }, 8);
    const pose = { x: CAMION.x, z: CAMION.z, y: terrain(CAMION.x, CAMION.z) - 0.02, ry: PI / 2 };
    poser(a.fin(0, peinture), pose.x, pose.z, pose);
    ecrire(pose, { texte: '品川 480', fond: '#f6d33a', encre: '#2a4a2a', cadre: '#2a4a2a', x: 0, y: 0.5, z: 1.716, l: 0.33, h: 0.17 });
    monde.mur(CAMION.x - 1.7, CAMION.z, CAMION.x + 1.75, CAMION.z, 0.85);
  }

  // ---- Le champ de palmiers : sur l'île, on cultive de petits palmiers (Phoenix roebelenii) qu'on vend comme
  // plantes vertes dans tout le Japon. En rangs, sur la terre sombre en sillons
  {
    const a = atelier(), { x0, x1, z0, z1 } = PALMERAIE;
    for (let x = x0 + 1.3; x < x1 - 0.6; x += 2.5) {
      for (let z = z0 + 1.3; z < z1 - 0.6; z += 2.6) {
        // un tronc court et rugueux, une touffe dense de palmes qui montent puis retombent en arc
        const h = 0.7 + hasard(x, z) * 0.8, pente = (hasard(z, x) - 0.5) * 0.5, y = terrain(x, z);
        const tx = x + Math.sin(pente * 6) * h * 0.12, tz = z + Math.cos(pente * 6) * h * 0.12;
        a.baton([x, y - 0.1, z], [tx, y + h, tz], 0.1, '#8a6a4a', 7, { teinte: (px, py) => (Math.floor(py * 10) % 2 ? '#8a6a4a' : '#6f5238') })
          .boule(0.16, '#6f5238', { x: tx, y: y + h, z: tz, sy: 0.8 }, 1);
        for (let k = 0; k < 18; k++) {
          const b = (k / 18) * 2 * PI + hasard(x + k, z) * 0.22, L = 1.05 + hasard(k, x) * 0.3, leve = k % 2 ? 1.25 : 0.65;
          a.piece(new THREE.BoxGeometry(0.3, 0.02, L, 2, 1, 7), k % 3 ? P.jungle : P.fougere, {
            x: tx, y: y + h + 0.06, z: tz, ry: b, sorte: 'persistant',
            // le long de la palme (z, de la touffe vers sa pointe) : elle s'effile, monte puis retombe
            deformer: (px, py, pz) => { const t = pz / L + 0.5; return [px * (1 - 0.8 * t), py + L * (leve * t - 1.15 * t * t), (t * L)]; },
          });
        }
        monde.cercle(x, z, 0.3);
      }
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
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
    // l'abri de la cuisine (炊事場) : un toit de tôle sur quatre poteaux, l'évier de béton et ses deux bacs d'inox,
    // ses robinets, le foyer (kamado) et ses braises, la marmite et la bouilloire, l'ampoule, l'enseigne pendue ;
    // dehors, le bois coupé et les poubelles du tri (« もえる » : ce qui brûle, « もえない » : le reste)
    const xs = 12, zs = 39.5, ys = terrain(xs, zs), zc = zs + 0.45, yc = ys + 0.85;
    for (const [dx, dz] of [[-2.3, -1.3], [2.3, -1.3], [-2.3, 1.3], [2.3, 1.3]]) {
      a.boite(0.14, 2.45, 0.14, P.boisFonce, { x: xs + dx, y: ys + 1.2, z: zs + dz });
      monde.cercle(xs + dx, zs + dz, 0.25);
    }
    for (const dz of [-1.3, 1.3]) a.boite(4.9, 0.14, 0.12, P.boisFonce, { x: xs, y: ys + 2.38, z: zs + dz });
    a.pignon(5.6, 0.75, 3.6, P.tole, { x: xs, y: ys + 2.45, z: zs })
      .boite(2.6, 0.85, 0.75, P.beton, { x: xs - 0.7, y: ys + 0.42, z: zc })
      .boite(2.6, 0.45, 0.12, P.beton, { x: xs - 0.7, y: yc + 0.22, z: zc + 0.32 })
      .cylindre(0.025, 0.025, 2.6, 8, '#d4d9dc', { x: xs - 0.7, y: yc + 0.47, z: zc + 0.26, rz: PI / 2 });
    for (const dx of [-1.35, -0.05]) {
      a.boite(1.05, 0.03, 0.55, '#a9b3b8', { x: xs + dx, y: yc + 0.012, z: zc - 0.05 })
        .boite(0.9, 0.03, 0.42, '#6f7a80', { x: xs + dx, y: yc + 0.016, z: zc - 0.05, trait: false });
      for (const t of [-0.25, 0.25]) {
        const x = xs + dx + t, z = zc + 0.24;
        a.cylindre(0.022, 0.022, 0.28, 8, '#d4d9dc', { x, y: yc + 0.17, z })
          .cylindre(0.018, 0.018, 0.16, 8, '#d4d9dc', { x, y: yc + 0.3, z: z - 0.08, rx: PI / 2 })
          .boite(0.1, 0.025, 0.025, '#d4d9dc', { x, y: yc + 0.34, z });
      }
    }
    a.boite(1.3, 0.75, 0.75, P.pierreFonce, { x: xs + 1.45, y: ys + 0.37, z: zc });
    for (const dx of [-0.3, 0.3]) {
      a.boite(0.3, 0.26, 0.02, '#2a2420', { x: xs + 1.45 + dx, y: ys + 0.27, z: zc - 0.384, trait: false })
        .boite(0.2, 0.08, 0.02, '#e0602a', { x: xs + 1.45 + dx, y: ys + 0.19, z: zc - 0.39, trait: false, sorte: 'lumiere' });
    }
    a.cylindre(0.25, 0.2, 0.24, 14, '#3a3a40', { x: xs + 1.15, y: ys + 0.87, z: zc - 0.02 })
      .cylindre(0.26, 0.26, 0.03, 14, '#4a4a52', { x: xs + 1.15, y: ys + 1.0, z: zc - 0.02 })
      .boule(0.035, '#2a2a30', { x: xs + 1.15, y: ys + 1.03, z: zc - 0.02 }, 1)
      .ovale(0.15, '#c9cdd0', { x: xs + 1.78, y: ys + 0.86, z: zc, sy: 0.75 }, 12)
      .baton([xs + 1.9, ys + 0.86, zc], [xs + 2.02, ys + 0.95, zc], 0.02, '#c9cdd0', 6)
      .piece(new THREE.TorusGeometry(0.1, 0.012, 5, 12, PI), '#3a3236', { x: xs + 1.78, y: ys + 0.95, z: zc });
    // l'ampoule sous son abat-jour, l'enseigne pendue à la poutre de devant
    a.baton([xs - 0.5, ys + 2.45, zs], [xs - 0.5, ys + 2.15, zs], 0.008, '#2a2420', 4)
      .cone(0.16, 0.1, 10, '#3f6a5a', { x: xs - 0.5, y: ys + 2.12, z: zs })
      .ovale(0.05, '#fff4c8', { x: xs - 0.5, y: ys + 2.04, z: zs, trait: false, sorte: 'lumiere' }, 8)
      .boite(1.3, 0.48, 0.05, P.bois, { x: xs, y: ys + 1.98, z: zs - 1.3 });
    for (const dx of [-0.5, 0.5]) a.baton([xs + dx, ys + 2.3, zs - 1.3], [xs + dx, ys + 2.2, zs - 1.3], 0.01, '#2a2420', 4);
    etiquettes.push({ texte: '炊事場', fond: '#f6efe0', encre: '#2a2420', x: xs, y: ys + 1.98, z: zs - 1.3 - 0.031, ry: PI, l: 1.2, h: 0.4 });
    lumieres.push({ x: xs - 0.5, y: ys + 2.0, z: zs, halo: 0.45, sol: ys, r: 2.8 });
    // le bois coupé
    for (let rg = 0; rg < 3; rg++) for (let i = 0; i < 4 - rg; i++) a.cylindre(0.08, 0.08, 0.7, 8, i % 2 ? '#a87a4a' : '#9a6d40', { x: xs + 3.0 - 0.24 + i * 0.16 + rg * 0.08, y: ys + 0.08 + rg * 0.15, z: zs + 0.1, rx: PI / 2 });
    // les poubelles du tri
    for (const [dz, c, texte] of [[-0.35, '#3f8a5a', 'もえる'], [0.35, '#3f6aa0', 'もえない']]) {
      a.boite(0.45, 0.7, 0.45, c, { x: xs - 3.0, y: ys + 0.35, z: zs + dz })
        .boite(0.5, 0.06, 0.5, c, { x: xs - 3.0, y: ys + 0.73, z: zs + dz });
      etiquettes.push({ texte, fond: '#ffffff', encre: c, x: xs - 3.0 - 0.229, y: ys + 0.48, z: zs + dz, ry: -PI / 2, l: 0.38, h: 0.16 });
    }
    monde.mur(xs - 2.0, zc, xs + 2.1, zc, 0.6);
    monde.mur(xs + 2.75, zs + 0.1, xs + 3.35, zs + 0.1, 0.45);
    monde.mur(xs - 3.0, zs - 0.6, xs - 3.0, zs + 0.6, 0.45);
    monde.toit(xs - 2.8, xs + 2.8, zs - 1.8, zs + 1.8, ys + 2.3, ys + 3.3);
    // la table de pique-nique
    const xt = 3, zt = 40.5, yt = terrain(xt, zt);
    a.boite(1.8, 0.08, 0.8, P.bois, { x: xt, y: yt + 0.74, z: zt });
    for (const s of [-1, 1]) {
      a.boite(1.8, 0.06, 0.3, P.bois, { x: xt, y: yt + 0.44, z: zt + s * 0.62 })
        .boite(0.08, 0.74, 0.08, P.boisFonce, { x: xt + s * 0.75, y: yt + 0.37, z: zt });
      bancs.push({ de: [xt - 0.6, zt + s * 0.62], a: [xt + 0.6, zt + s * 0.62], y: yt + 0.47, cap: s > 0 ? PI : 0 });
    }
    monde.cercle(xt, zt, 1.0);
    // la lanterne du campeur, sur la table (allumée la nuit)
    a.cylindre(0.075, 0.075, 0.05, 8, '#3a3a44', { x: xt + 0.45, y: yt + 0.805, z: zt - 0.12 })
      .cylindre(0.055, 0.055, 0.15, 12, '#fff1c8', { x: xt + 0.45, y: yt + 0.905, z: zt - 0.12, trait: false, sorte: 'lumiere' })
      .cylindre(0.025, 0.07, 0.05, 8, '#3a3a44', { x: xt + 0.45, y: yt + 1.005, z: zt - 0.12, ry: PI / 8 });
    lumieres.push({ x: xt + 0.45, y: yt + 0.92, z: zt - 0.12, halo: 0.5, sol: yt, r: 3.2 });
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
    const n = MARCHES.length - 1; // MARCHES[n] : le pas sur la crête ; MARCHES[n − 1] : le bout du palier du haut
    // (jusqu'au pas sur la crête : au bout de la volée, le sol aplani remonte déjà, trop raide pour y monter)
    monde.chemin(MARCHES, 1.15, { sol: 'pierre' });
    // les côtés du chemin : le côté du vide (vers le centre du cratère) de chaque tronçon, et à chaque coude la
    // bissectrice, pour rester à la même distance du milieu des marches
    const cote = [];
    for (let k = 0; k < n; k++) {
      const [x0, z0] = MARCHES[k], [x1, z1] = MARCHES[k + 1], l = Math.hypot(x1 - x0, z1 - z0);
      let nx = -(z1 - z0) / l, nz = (x1 - x0) / l;
      const avant = cote[k - 1];
      if (avant ? nx * avant[0] + nz * avant[1] < 0 : nx * x0 + nz * z0 > 0) { nx = -nx; nz = -nz; }
      cote.push([nx, nz]);
    }
    /** Le point à d mètres du milieu du chemin (d > 0 : côté vide ; d < 0 : côté pente), au point k de MARCHES : [x, z, h]. */
    const decale = (k, d) => {
      const u = cote[Math.max(0, k - 1)], v = cote[Math.min(n - 1, k)];
      let mx = u[0] + v[0], mz = u[1] + v[1];
      const lm = Math.hypot(mx, mz), e = d / ((mx * v[0] + mz * v[1]) / lm);
      return [MARCHES[k][0] + (mx / lm) * e, MARCHES[k][1] + (mz / lm) * e, MARCHES[k][2]];
    };
    // la main courante, côté vide, juste au bout des marches (plantée dans l'accotement), et ce qui y arrête : le
    // corps du marcheur (sa grosse tête) n'y entre plus. Avant, tirée de 1,3 m droit vers le centre du cratère, de
    // biais par rapport aux marches, elle plantait en bas ses poteaux sur les marches, et l'on s'y coinçait (2026-10-23)
    const poteaux = [];
    for (let k = 0; k < n - 1; k++) {
      const p0 = decale(k, RAMPE), p1 = decale(k + 1, RAMPE);
      for (const f of k === 0 ? [0.35, 0.7] : [0, 0.35, 0.7]) poteaux.push(p0.map((v, i) => v + (p1[i] - v) * f));
    }
    poteaux.push(decale(n - 1, RAMPE));
    let prec = null;
    for (const [x, z, y] of poteaux) {
      a.boite(0.1, 1.55, 0.1, P.boisFonce, { x, y: y + 0.1, z }); // (planté dans l'accotement, plus bas que les marches)
      if (prec) {
        a.baton([prec[0], prec[2] + 0.88, prec[1]], [x, y + 0.88, z], 0.04, P.bois, 5);
        monde.mur(prec[0], prec[1], x, z, 0.38, Math.min(prec[2], y) - 0.6, Math.max(prec[2], y) + 2.2);
      }
      prec = [x, z, y];
    }
    // au haut de l'escalier, elle tourne avec le chemin et rejoint la barrière de la crête (qui y plante son poteau)
    {
      const [x, z] = surLaBarriere(OUVERTURE[0]), y = terrain(x, z);
      a.baton([prec[0], prec[2] + 0.88, prec[1]], [x, y + 0.88, z], 0.04, P.bois, 5);
      monde.mur(prec[0], prec[1], x, z, 0.38, Math.min(prec[2], y) - 0.6, Math.max(prec[2], y) + 2.2);
    }
    // côté pente, un mur qu'on ne voit pas : on reste sur les marches (pas sur l'accotement, entre elles et la pente)
    let m0 = decale(0, -RAMPE).map((v, i) => v + (decale(1, -RAMPE)[i] - v) * 0.25);
    for (let k = 1; k <= n - 1; k++) {
      const m1 = decale(k, -RAMPE);
      monde.mur(m0[0], m0[1], m1[0], m1[1], 0.38, Math.min(m0[2], m1[2]) - 0.6, Math.max(m0[2], m1[2]) + 2.2);
      m0 = m1;
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- La crête : le belvédère, Ōtonbu
  // le belvédère rond : des gradins de pierre qui descendent vers une petite place, face au grand cratère
  {
    const a = atelier();
    const V = THREE.Vector2;
    // (son mur extérieur descend à 5 m : côté cratère, l'entaille de l'escalier passe dessous ; il flottait au-dessus,
    // 2026-10-23 ; ailleurs, le sol le cache) : la pierre sombre ; les gradins comme avant
    const GRADINS = [[1.6, -1.02], [3.0, -0.65], [4.4, -0.28], [6.4, 0.1]]; // [rayon du bord, hauteur] de chacun
    const profil = [[0.01, GRADINS[0][1]]];
    GRADINS.forEach(([r, y], i) => { if (i) profil.push([GRADINS[i - 1][0], y]); profil.push([r, y]); });
    for (const y of [-0.5, -1.4, -2.3, -3.2, -4.1, -5]) profil.push([6.4, y]);
    a.piece(new THREE.LatheGeometry(profil.map(([r, y]) => new V(r, y)).reverse(), 36), P.pierre, {
      x: BELVEDERE.x, y: Y_BELVEDERE, z: BELVEDERE.z,
      teinte: (x, y, z) => (Math.hypot(x - BELVEDERE.x, z - BELVEDERE.z) > 6.3 && y < Y_BELVEDERE - 0.2 ? P.pierreFonce : y > Y_BELVEDERE - 0.15 ? P.pierre : y > Y_BELVEDERE - 0.5 ? P.pierreFonce : y > Y_BELVEDERE - 0.9 ? P.pierre : P.cheminFonce),
    });
    // on marche sur les gradins (le sol naturel, une cuvette lisse, passe dessous : on s'y enfonçait jusqu'aux genoux,
    // 2026-10-23)
    GRADINS.forEach(([r, y], i) => monde.anneau(BELVEDERE.x, BELVEDERE.z, i ? GRADINS[i - 1][0] : 0, r, Y_BELVEDERE + y, { sol: 'pierre' }));
    // deux bancs, tournés vers le cratère
    for (const s of [-1, 1]) {
      const x = BELVEDERE.x + s * 9, z = BELVEDERE.z + 2.5, y = terrain(x, z);
      a.boite(1.8, 0.08, 0.45, P.bois, { x, y: y + 0.45, z })
        .boite(0.1, 0.45, 0.4, P.boisFonce, { x: x - 0.75, y: y + 0.22, z })
        .boite(0.1, 0.45, 0.4, P.boisFonce, { x: x + 0.75, y: y + 0.22, z });
      monde.cercle(x, z, 0.8);
      bancs.push({ de: [x - 0.6, z], a: [x + 0.6, z], y: y + 0.49, cap: 0 });
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
      // (sur l'anneau du belvédère : posée sur la pierre)
      const [x, z] = surLaBarriere(t), y = Math.hypot(x - BELVEDERE.x, z - BELVEDERE.z) < ANNEAU + 0.1 ? Y_BELVEDERE + 0.1 : terrain(x, z);
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
    belvedere: { x: -11.6, z: -80.6, vx: HAUT[0], vz: HAUT[1] },
  };
  // leur titre en japonais, sur le papier (et des lignes d'écriture dessous)
  const TITRES = { bienvenue: '青ヶ島へようこそ', sauna: 'ふれあいサウナ', hingya: 'ひんぎゃ', maruyama: '丸山', otonbu: '大凸部へ', camping: 'キャンプ場', belvedere: '展望台' };
  for (const [id, p] of Object.entries(PANNEAUX)) {
    // le papier du panneau est sur sa face −z : on le tourne vers (vx, vz)
    const pose = { x: p.x, z: p.z, y: terrain(p.x, p.z), ry: vers(p.x, p.z, p.vx, p.vz) + PI };
    poser(panneau(atelier(), P, { ecrit: true }).fin(0, peinture), p.x, p.z, pose);
    ecrire(pose, { ...PAPIER_PANNEAU, texte: TITRES[id], lignes: 3, fond: P.papier, encre: id === 'hingya' ? '#b8322a' : '#2a2420' });
    monde.cercle(p.x, p.z, 0.75);
  }

  // ---- Le trépied du vidéaste, sur la crête : il filme la double caldeira
  const VIDEASTE = { x: 10, z: -79, cap: vers(10, -79, MARUYAMA.x, MARUYAMA.z) };
  {
    const tx = VIDEASTE.x + Math.sin(VIDEASTE.cap) * 0.8 + Math.cos(VIDEASTE.cap) * 0.5, tz = VIDEASTE.z + Math.cos(VIDEASTE.cap) * 0.8 - Math.sin(VIDEASTE.cap) * 0.5;
    poser(trepied(atelier()).fin(0, peinture), tx, tz, { y: terrain(tx, tz) + 1.3, ry: VIDEASTE.cap });
    monde.cercle(tx, tz, 0.45);
  }

  // ---------------------------------------------------------------- Le coin de la crête, à l'ouest de l'escalier
  // (« l'endroit fait un peu vide », 2026-10-23) : un abri de bois (azumaya) ouvert sur la caldeira, ses bancs, sa table
  // et le cahier des voyageurs (思い出ノート) ; un pin couché par le vent ; les jumelles à pièces tournées vers Hachijō ;
  // la pierre gravée « 外輪山 » (la crête du grand cratère) ; des lis sauvages (les sakuyuri des îles d'Izu), des
  // touffes d'ashitaba et de susuki (l'herbe de la pampa du Japon)
  let yA = -Infinity; // le dessous du dallage de l'abri : le plus haut point du sol sous lui
  for (const [lx, lz] of [[-2, -2], [2, -2], [-2, 2], [2, 2], [0, 0], [0, 2], [0, -2], [2, 0], [-2, 0]]) yA = Math.max(yA, terrain(...versAbri(lx, lz)));
  const SOL_ABRI = yA + 0.1;
  const SIEGE_ABRI = { x: versAbri(0, -1.3)[0], z: versAbri(0, -1.3)[1], y: SOL_ABRI + 0.44, cap: CAP_ABRI };
  {
    const a = atelier(), c = AZUMAYA.cote / 2, H = 2.3, B = SOL_ABRI - yA, HP = B + 0.12 + H;
    // le dallage, les pierres des poteaux, les poteaux, les poutres (celles d'un sens 2,5 cm plus bas : leurs faces
    // ne se superposent pas aux croisements)
    a.boite(4.0, 0.5, 4.0, P.pierre, { y: B - 0.25 });
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      a.cylindre(0.13, 0.15, 0.12, 8, P.pierreFonce, { x: sx * c, y: B + 0.06, z: sz * c })
        .boite(0.15, H, 0.15, P.boisFonce, { x: sx * c, y: B + 0.12 + H / 2, z: sz * c });
    }
    for (const sg of [-1, 1]) {
      a.boite(AZUMAYA.cote + 0.36, 0.16, 0.13, P.bois, { y: HP - 0.04, z: sg * c })
        .boite(0.13, 0.16, AZUMAYA.cote + 0.36, P.bois, { x: sg * c, y: HP - 0.065 });
    }
    // le toit à quatre pans, son faîte et son joyau (hōju)
    a.toitJapon(4.6, 4.6, 1.25, 0.12, { y: HP + 0.06, creux: 1.4, releve: 0.08, rangs: 16 })
      .boite(0.62, 0.1, 0.62, P.toitBord, { y: HP + 0.06 + 1.25 + 0.03 })
      .cylindre(0.07, 0.09, 0.16, 8, P.bronze, { y: HP + 0.06 + 1.25 + 0.16 })
      .boule(0.09, P.bronze, { y: HP + 0.06 + 1.25 + 0.3, sy: 1.15 }, 1);
    // la plaque « 休憩所 » (le coin repos) sous la poutre de devant
    a.boite(0.86, 0.3, 0.05, P.bois, { y: HP - 0.3, z: c + 0.03 });
    ecrire({ x: AZUMAYA.x, z: AZUMAYA.z, y: yA, ry: CAP_ABRI }, { texte: '休憩所', fond: P.papier, encre: '#3a2420', x: 0, y: HP - 0.3, z: c + 0.058, l: 0.76, h: 0.24 });
    // les garde-corps du fond et des côtés (le devant reste ouvert sur la caldeira)
    for (const h of [B + 0.48, B + 0.92]) {
      a.boite(AZUMAYA.cote - 0.1, 0.07, 0.06, P.bois, { y: h, z: -c })
        .boite(0.06, 0.07, AZUMAYA.cote - 0.1, P.bois, { x: -c, y: h - 0.01 }).boite(0.06, 0.07, AZUMAYA.cote - 0.1, P.bois, { x: c, y: h - 0.01 });
    }
    // les bancs : au fond (face à la caldeira) et sur les côtés
    a.boite(2.7, 0.06, 0.36, P.bois3, { y: B + 0.41, z: -c + 0.3 });
    for (const x of [-1.1, 0, 1.1]) a.boite(0.06, 0.38, 0.3, P.boisFonce, { x, y: B + 0.19, z: -c + 0.3 });
    for (const sg of [-1, 1]) {
      a.boite(0.36, 0.06, 2.1, P.bois3, { x: sg * (c - 0.3), y: B + 0.405, z: 0.25 });
      for (const z of [-0.6, 1.1]) a.boite(0.3, 0.38, 0.06, P.boisFonce, { x: sg * (c - 0.3), y: B + 0.19, z });
      bancs.push({ de: versAbri(sg * (c - 0.3), -0.5), a: versAbri(sg * (c - 0.3), 1.0), y: SOL_ABRI + 0.435, cap: CAP_ABRI - sg * PI / 2 });
    }
    // la table, le cahier des voyageurs ouvert et un crayon
    a.boite(1.2, 0.06, 0.7, P.bois3, { y: B + 0.7, z: -0.1 });
    for (const x of [-0.48, 0.48]) a.boite(0.06, 0.67, 0.56, P.boisFonce, { x, y: B + 0.335, z: -0.1 });
    a.boite(0.42, 0.02, 0.3, '#3f6aa0', { x: 0.22, y: B + 0.74, z: -0.08, ry: 0.25 })
      .boite(0.39, 0.016, 0.27, '#fbf6ea', { x: 0.22, y: B + 0.756, z: -0.08, ry: 0.25, trait: false })
      .boite(0.005, 0.004, 0.25, '#cfc8b8', { x: 0.22, y: B + 0.765, z: -0.08, ry: 0.25, trait: false })
      .baton([0.0, B + 0.738, 0.12], [0.14, B + 0.738, 0.2], 0.007, '#e8b941', 5, { trait: false });
    poser(a.fin(0, peinture), AZUMAYA.x, AZUMAYA.z, { y: yA, ry: CAP_ABRI });
    // ce qui arrête : les poteaux, les garde-corps (le devant ouvert), les bancs, la table ; le plancher ; le toit
    const m = (lx0, lz0, lx1, lz1, rr) => monde.mur(...versAbri(lx0, lz0), ...versAbri(lx1, lz1), rr);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) monde.cercle(...versAbri(sx * c, sz * c), 0.16);
    m(-c, -c, c, -c, 0.12); m(-c, -c, -c, c, 0.12); m(c, -c, c, c, 0.12);
    m(-1.3, -c + 0.3, 1.3, -c + 0.3, 0.26);
    m(-(c - 0.3), -0.75, -(c - 0.3), 1.25, 0.25); m(c - 0.3, -0.75, c - 0.3, 1.25, 0.25);
    m(-0.55, -0.1, 0.55, -0.1, 0.42);
    // (le plancher : deux bandes croisées qui couvrent le dallage, tourné, à part ses coins sous les poteaux)
    monde.chemin([[...versAbri(0, -0.7), SOL_ABRI], [...versAbri(0, 0.7), SOL_ABRI]], 1.98, { sol: 'pierre' });
    monde.chemin([[...versAbri(-0.7, 0), SOL_ABRI], [...versAbri(0.7, 0), SOL_ABRI]], 1.98, { sol: 'pierre' });
    const coins = [[-2.4, -2.4], [2.4, -2.4], [-2.4, 2.4], [2.4, 2.4]].map(([lx, lz]) => versAbri(lx, lz));
    const xs = coins.map((q) => q[0]), zs = coins.map((q) => q[1]);
    monde.toit(Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs), yA + HP, yA + HP + 1.4);
  }
  /** Un pétale (ou une feuille) : un ovale aplati, de longueur l et de largeur w, de la base b [x, y, z] vers d. */
  let petales = 0;
  const petale = (a, b, d, l, w, c, o = {}) => {
    const g = new THREE.SphereGeometry(1, 6, 4).toNonIndexed();
    g.scale(w, w * 0.2, l / 2).translate(0, 0, l / 2);
    const n = Math.hypot(...d), u = [d[0] / n, d[1] / n, d[2] / n];
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...u)));
    // (chacun commence un peu plus loin sur sa direction : les feuilles d'une même tige, à plat dans presque le même
    // plan, se superposaient à leur base et scintillaient)
    petales++;
    g.translate(b[0] + u[0] * 0.012, b[1] + u[1] * 0.012 + (petales % 5) * 0.0015, b[2] + u[2] * 0.012);
    return a.piece(g, c, { trait: false, ...o });
  };
  // le pin couché par le vent (il penche du côté où le vent pousse), ses plateaux d'aiguilles, des pierres à son pied
  {
    const a = atelier(), { x, z } = PIN_VENT, y = terrain(x, z), [vx, vz] = [0.92, 0.38];
    const pt = (h, d, e = 0) => [x + vx * d - vz * e, y + h, z + vz * d + vx * e];
    a.baton(pt(-0.3, -0.05), pt(1.0, 0.25), 0.17, P.tronc, 7)
      .baton(pt(0.95, 0.22), pt(1.9, 0.95, 0.1), 0.13, P.tronc, 7)
      .baton(pt(1.85, 0.9, 0.1), pt(2.6, 2.0, 0.05), 0.095, P.tronc, 6)
      .baton(pt(1.5, 0.6, 0.05), pt(2.15, 0.2, -0.9), 0.06, P.tronc, 5)
      .baton(pt(2.3, 1.5, 0.08), pt(2.75, 1.3, 0.85), 0.055, P.tronc, 5);
    for (const [h, d, e, rr] of [[2.75, 2.25, 0.05, 0.95], [2.45, 1.55, 0.25, 0.7], [2.3, 2.85, -0.2, 0.7], [2.3, 0.15, -0.95, 0.62], [2.8, 1.25, 0.9, 0.6], [3.05, 1.85, -0.1, 0.55]]) {
      a.ovale(rr, P.pin, { x: pt(h, d, e)[0], y: pt(h, d, e)[1], z: pt(h, d, e)[2], sy: 0.3, sorte: 'conifere' }, 12);
    }
    a.rocher(x - 0.4, y + 0.05, z + 0.35, 0.3, P.rocheSombre).rocher(x + 0.3, y + 0.02, z - 0.4, 0.22, P.roche);
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
    monde.cercle(x, z, 0.32);
  }
  // les jumelles à pièces (100 円), tournées vers Hachijō-jima
  const CAP_JUMELLES = vers(JUMELLES.x, JUMELLES.z, HACHIJO.x, HACHIJO.z);
  const yJ = terrain(JUMELLES.x, JUMELLES.z);
  /** Un point du repère des jumelles (z vers Hachijō) dans le lieu : [x, y, z]. */
  const versJumelles = (lx, ly, lz) => [JUMELLES.x + lx * Math.cos(CAP_JUMELLES) + lz * Math.sin(CAP_JUMELLES), yJ + ly, JUMELLES.z - lx * Math.sin(CAP_JUMELLES) + lz * Math.cos(CAP_JUMELLES)];
  {
    const a = atelier(), V = '#3f8a7a', VF = '#2f6a5e';
    a.cylindre(0.2, 0.25, 0.12, 10, P.beton, { y: 0.03 })
      .cylindre(0.055, 0.065, 1.05, 10, V, { y: 0.6 })
      .boite(0.16, 0.2, 0.12, '#f2c443', { y: 0.95, z: -0.075 })
      .boite(0.03, 0.06, 0.004, '#2a2420', { x: 0.035, y: 1.0, z: 0.1, trait: false })
      .boite(0.14, 0.07, 0.1, V, { y: 1.16 })
      .boite(0.36, 0.2, 0.3, V, { y: 1.3 })
      .boite(0.42, 0.035, 0.36, VF, { y: 1.418 });
    for (const sg of [-1, 1]) {
      a.cylindre(0.066, 0.066, 0.08, 12, VF, { x: sg * 0.09, y: 1.3, z: 0.18, rx: PI / 2 })
        .cylindre(0.052, 0.052, 0.012, 12, '#8fc4d4', { x: sg * 0.09, y: 1.3, z: 0.222, rx: PI / 2, trait: false })
        .cylindre(0.034, 0.03, 0.08, 10, '#2a2a2e', { x: sg * 0.062, y: 1.33, z: -0.19, rx: PI / 2 })
        .baton([sg * 0.18, 1.26, 0.0], [sg * 0.29, 1.2, -0.08], 0.016, VF, 5);
    }
    poser(a.fin(0, peinture), JUMELLES.x, JUMELLES.z, { y: yJ, ry: CAP_JUMELLES });
    ecrire({ x: JUMELLES.x, z: JUMELLES.z, y: yJ, ry: CAP_JUMELLES }, { texte: '100円', fond: '#f2c443', encre: '#2a2420', x: 0, y: 0.93, z: -0.1405, ry: PI, l: 0.13, h: 0.08 });
    monde.cercle(JUMELLES.x, JUMELLES.z, 0.28);
  }
  // la pierre « 外輪山 » : une dalle brute dressée sur des cailloux, tournée vers le haut de l'escalier
  {
    const a = atelier(), { x, z } = STELE, y = terrain(x, z), cap = vers(x, z, HAUT[0], HAUT[1]);
    a.piece(new THREE.BoxGeometry(0.72, 1.4, 0.26, 4, 6, 1), P.pierreFonce, {
      y: 0.68, nuance: 0.07,
      // (le dos et les côtés bosselés, le haut arrondi ; la face gravée reste plane)
      deformer: (px, py, pz) => {
        const k = 1 - 0.42 * Math.max(0, (py - 0.15) / 0.55) ** 2, b = 1 + 0.08 * Math.sin(py * 7 + px * 5);
        return [px * k * b, py + 0.05 * Math.sin(px * 6), pz > 0 ? pz : pz * (1.2 + 0.25 * Math.sin(py * 5 + px * 9))];
      },
    })
      .rocher(-0.35, 0.05, -0.1, 0.24, P.rocheSombre).rocher(0.38, 0.03, 0.05, 0.2, P.roche).rocher(0.05, 0.02, -0.3, 0.22, P.rocheSombre);
    poser(a.fin(0, peinture), x, z, { y, ry: cap });
    ecrire({ x, z, y, ry: cap }, { texte: '外輪山', vertical: true, fond: null, encre: '#2f2a2c', x: -0.02, y: 0.78, z: 0.137, l: 0.26, h: 0.86 });
    monde.cercle(x, z, 0.48);
  }
  // les fleurs de la crête : lis, ashitaba, susuki (sans trait : des plantes fines), loin des chemins et des objets
  {
    const a = atelier(), tirer = ((g) => () => { g = (g * 16807) % 2147483647; return (g - 1) / 2147483646; })(1785);
    const unitaire = (v) => { const n = Math.hypot(...v); return v.map((q) => q / n); };
    const TIGE = '#5f8f3a';
    /** Un lis sakuyuri : sa tige, ses feuilles étroites, n grandes fleurs blanches en trompette, penchées. */
    const lis = (x, z, h, n) => {
      const y = terrain(x, z), haut = [x + (tirer() - 0.5) * 0.3, y + h, z + (tirer() - 0.5) * 0.3];
      a.baton([x, y - 0.05, z], haut, 0.012, TIGE, 5, { trait: false });
      for (let k = 0; k < 6; k++) {
        const f = 0.18 + k * 0.12, b = tirer() * 2 * PI;
        petale(a, [x + (haut[0] - x) * f, y + h * f, z + (haut[2] - z) * f], [Math.sin(b), 0.55, Math.cos(b)], 0.17, 0.028, TIGE);
      }
      for (let i = 0; i < n; i++) {
        const b = tirer() * 2 * PI, axe = unitaire([Math.sin(b), -0.15 + tirer() * 0.35, Math.cos(b)]);
        const c0 = [haut[0] + axe[0] * 0.05, haut[1] - i * 0.07 + axe[1] * 0.05, haut[2] + axe[2] * 0.05];
        a.baton(haut, c0, 0.008, TIGE, 4, { trait: false });
        const u = unitaire([axe[2], 0, -axe[0]]), v = [axe[1] * u[2] - axe[2] * u[1], axe[2] * u[0] - axe[0] * u[2], axe[0] * u[1] - axe[1] * u[0]];
        for (let k = 0; k < 6; k++) {
          const ca = Math.cos((k * PI) / 3), sa = Math.sin((k * PI) / 3);
          const d = [0, 1, 2].map((j) => axe[j] * 0.62 + (u[j] * ca + v[j] * sa) * 0.78);
          petale(a, c0, d, 0.14, 0.036, k % 2 ? '#fbf8ef' : '#fffdf6');
        }
        a.ovale(0.022, '#e9d870', { x: c0[0], y: c0[1], z: c0[2], trait: false }, 6);
        for (let k = 0; k < 3; k++) {
          const e = [0, 1, 2].map((j) => c0[j] + axe[j] * 0.08 + (k - 1) * 0.012 * u[j]);
          a.baton(c0, e, 0.003, '#d8cf7a', 3, { trait: false }).ovale(0.008, '#b8562a', { x: e[0], y: e[1], z: e[2], trait: false }, 4);
        }
      }
    };
    /** Une touffe d'ashitaba : de grandes feuilles vernies sur leurs tiges, parfois une ombelle jaune pâle. */
    const ashitaba = (x, z) => {
      const y = terrain(x, z);
      for (let k = 0; k < 5; k++) {
        const b = (k / 5) * 2 * PI + tirer(), l = 0.3 + tirer() * 0.18, t = [x + Math.sin(b) * l * 0.6, y + 0.22 + tirer() * 0.12, z + Math.cos(b) * l * 0.6];
        a.baton([x, y, z], t, 0.01, '#6f9a45', 4, { trait: false });
        for (const e of [-0.55, 0, 0.55]) petale(a, t, [Math.sin(b + e), 0.12, Math.cos(b + e)], 0.17, 0.065, k % 2 ? '#3f8a34' : '#4a9a3c');
      }
      if (tirer() < 0.6) {
        const t = [x + (tirer() - 0.5) * 0.2, y + 0.55 + tirer() * 0.15, z + (tirer() - 0.5) * 0.2];
        a.baton([x, y, z], t, 0.009, '#6f9a45', 4, { trait: false }).ovale(0.075, '#e2dc84', { x: t[0], y: t[1] + 0.01, z: t[2], sy: 0.35, trait: false }, 7);
      }
    };
    /** Une touffe de susuki : de longues feuilles qui s'arquent, et des épis argentés plus hauts. */
    const susuki = (x, z) => {
      const y = terrain(x, z);
      // (chaque brin part d'un point un peu différent : partis du même, leurs faces se superposaient à la base)
      for (let k = 0; k < 11; k++) {
        const b = tirer() * 2 * PI, l = 0.6 + tirer() * 0.5, ex = (tirer() - 0.5) * 0.12, ez = (tirer() - 0.5) * 0.12;
        a.cone(0.022, l, 3, k % 2 ? '#86a24e' : '#7a9a46', { x: x + ex + Math.sin(b) * l * 0.25, y: y + l * 0.45, z: z + ez + Math.cos(b) * l * 0.25, rx: Math.cos(b) * 0.5, rz: -Math.sin(b) * 0.5, trait: false });
      }
      for (let k = 0; k < 4; k++) {
        const b = tirer() * 2 * PI, t = [x + Math.sin(b) * 0.3, y + 1.1 + tirer() * 0.35, z + Math.cos(b) * 0.3];
        a.baton([x + Math.sin(b) * 0.05, y, z + Math.cos(b) * 0.05], t, 0.008, '#9a9a5a', 4, { trait: false });
        petale(a, t, [Math.sin(b) * 0.7, 0.25, Math.cos(b) * 0.7], 0.3, 0.05, '#efe3c6');
      }
    };
    const loinDe = (x, z, marge) => {
      if (CHEMINS.slice(2).some((c) => surLaLigne(c, x, z).d < 1.5 + marge) || surLaLigne(MARCHES, x, z).d < 4) return false;
      const [lx, lz] = dansAbri(x, z);
      if (Math.abs(lx) < 2.7 + marge && Math.abs(lz) < 2.7 + marge) return false;
      return [[PIN_VENT, 1.4], [JUMELLES, 1.4], [STELE, 1.3], [VIDEASTE, 2], [OTONBU, OTONBU.r]].every(([o, d]) => Math.hypot(x - o.x, z - o.z) > d + marge);
    };
    let nl = 0, na = 0, ns = 0;
    for (let i = 0; i < 400 && (nl < 22 || na < 14 || ns < 11); i++) {
      // une touffe de chaque sorte, en petits groupes sur le plateau, à l'ouest de l'escalier (les susuki au bord, côté mer)
      const t = -0.46 + tirer() * 0.36, r2 = rayonPied(t) + PAROI, r3 = r2 + largeurCrete(t), sorte = i % 3;
      const rr = sorte === 2 ? r3 - 2.5 + tirer() * 1.8 : r2 + 2.6 + tirer() * (r3 - r2 - 4.2);
      const x = rr * Math.sin(t), z = -rr * Math.cos(t);
      if (!loinDe(x, z, sorte === 2 ? 0.5 : 0)) continue;
      if (sorte === 0 && nl < 22) {
        const k = 1 + Math.floor(tirer() * 3);
        for (let j = 0; j < k && nl < 22; j++, nl++) lis(x + (tirer() - 0.5) * 0.9, z + (tirer() - 0.5) * 0.9, 0.7 + tirer() * 0.35, 1 + Math.floor(tirer() * 2.6));
      } else if (sorte === 1 && na < 14) { ashitaba(x, z); na++; } else if (sorte === 2 && ns < 11) { susuki(x, z); ns++; }
    }
    // et un groupe de lis tout près de la pierre, qu'on regarde
    for (const [dx, dz, h, n] of [[0.9, 0.5, 0.85, 2], [1.25, 0.05, 0.75, 1], [0.7, 0.95, 0.95, 3]]) lis(STELE.x - dx, STELE.z - dz, h, n);
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
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
    if (x > PALMERAIE.x0 - 2 && x < PALMERAIE.x1 + 2 && z > PALMERAIE.z0 - 2 && z < PALMERAIE.z1 + 2) return true;
    if (surLaLigne(MARCHES, x, z).d < 6) return true;
    if (Math.hypot(x - TRESOR.x, z - TRESOR.z) < 5 || Math.hypot(x - MARCHAND.x, z - MARCHAND.z) < MARCHAND.clairiere + 0.5) return true;
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
      // (des arbres à feuilles caduques : l'hiver, leurs houppiers tombent, et l'on voit leurs branches ; depuis le
      // 2026-10-24, le feuillu touffu de l'atelier, avant un bâton à cinq côtés et trois boules à facettes)
      const graine = hasard(x * 0.71 + 3.1, z * 0.53 - 1.7); // (pas tire() : la suite des tirages, donc le reste du décor, ne bouge pas)
      // (trois tirages de couleur, comme avant)
      const verts = [0, 1, 2].map(() => VERTS[Math.floor(tire() * VERTS.length)]);
      a.arbreTouffu(x, z, h, verts, { y, bas: y - 0.12, sorte: 'houppier', graine, caduc: true, tronc: P.tronc, rTronc: 0.0315 * h, large: 1.1 });
      monde.cercle(x, z, 0.45);
      n++;
    }
    for (const a of quarts) poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }
  // le bois de Bunbuku : deux couronnes d'arbres serrés autour de sa clairière (les petits devant, les grands derrière,
  // pour que la caméra y tienne), une trouée vers l'ouest, d'où l'on vient ; des fougères et des pierres moussues ;
  // son lampion, pendu à un bambou (allumé la nuit : on le trouve de loin). Un hasard à lui (pas tire() : le reste du
  // décor ne bouge pas)
  {
    const a = atelier(), Q = MARCHAND;
    const ecartOuverture = (t) => Math.abs(Math.atan2(Math.sin(t - Q.ouverture), Math.cos(t - Q.ouverture)));
    const couronnes = [[11, 6.2, 1.3, 4, 1.2], [15, 9.4, 2.6, 5.2, 2.4]]; // [nombre, rayon, écart, hauteur, en plus]
    couronnes.forEach(([nb, R, dR, h0, dh], c) => {
      for (let k = 0; k < nb; k++) {
        const t = ((k + 0.5) / nb) * 2 * PI + (hasard(k * 1.7 + c, 9.1) - 0.5) * 0.35;
        if (ecartOuverture(t) < (c ? 0.32 : 0.42)) continue;
        const rr = R + hasard(k * 0.9 + c * 5, 4.3) * dR, x = Q.x + Math.sin(t) * rr, z = Q.z + Math.cos(t) * rr;
        // (pas contre un arbre du cratère : leurs houppiers se mêleraient, face contre face)
        if (Math.hypot(x, z) > rayonPied(angle(x, z)) - 1.5 || monde.cercles.some(([cx, cz, r]) => Math.hypot(cx - x, cz - z) < r + 1.8)) continue;
        const y = terrain(x, z), h = h0 + hasard(k + c * 11, 2.2) * dh;
        const graine = hasard(x * 0.71 + 3.1, z * 0.53 - 1.7), verts = [0, 1, 2].map((i) => VERTS[Math.floor(hasard(k + i * 3, c + 7.7) * VERTS.length)]);
        a.arbreTouffu(x, z, h, verts, { y, bas: y - 0.12, sorte: 'houppier', graine, caduc: true, tronc: P.tronc, rTronc: 0.0315 * h, large: 1.05 });
        monde.cercle(x, z, 0.45);
      }
    });
    // le sous-bois : des fougères en rosette au pied des arbres, des pierres couvertes de mousse
    for (let k = 0; k < 16; k++) {
      const t = (k / 16) * 2 * PI + hasard(k, 3.3) * 0.4, rr = 3.4 + hasard(k, 5.5) * 4.5;
      if (ecartOuverture(t) < 0.45 && rr < 7) continue;
      const x = Q.x + Math.sin(t) * rr, z = Q.z + Math.cos(t) * rr, y = terrain(x, z);
      if (Math.hypot(x - LAMPION.x, z - LAMPION.z) < 1) continue;
      if (k % 4 === 3) {
        a.rocher(x, y + 0.05, z, 0.22 + hasard(k, 8.8) * 0.16, P.paroi).boule(0.16, P.jungleFonce, { x, y: y + 0.22, z, sy: 0.4, trait: false, sorte: 'herbe' }, 0);
        continue;
      }
      for (let f = 0; f < 7; f++) {
        const b = (f / 7) * 2 * PI + hasard(k, f);
        a.cone(0.16, 1.0, 4, f % 2 ? P.fougere : P.jungle, { x: x + Math.sin(b) * 0.38, y: y + 0.42, z: z + Math.cos(b) * 0.38, rx: Math.cos(b) * 1.05, rz: -Math.sin(b) * 1.05, sz: 0.35, trait: false, sorte: 'persistant' });
      }
    }
    // le lampion : un bambou planté, une potence, le chōchin rouge
    const yl = terrain(LAMPION.x, LAMPION.z);
    a.baton([LAMPION.x, yl - 0.2, LAMPION.z], [LAMPION.x, yl + 2.15, LAMPION.z], 0.03, '#a3a35c', 6)
      .baton([LAMPION.x, yl + 2.08, LAMPION.z], [LAMPION.x - 0.32, yl + 2.08, LAMPION.z], 0.015, '#a3a35c', 5)
      .baton([LAMPION.x - 0.3, yl + 2.08, LAMPION.z], [LAMPION.x - 0.3, yl + 1.97, LAMPION.z], 0.004, '#3a3236', 3, { trait: false })
      .chochin(LAMPION.x - 0.3, yl + 1.82, LAMPION.z, 3);
    lumieres.push({ x: LAMPION.x - 0.3, y: yl + 1.82, z: LAMPION.z, halo: 0.55, sol: yl, r: 4.2 });
    monde.cercle(LAMPION.x, LAMPION.z, 0.12);
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }
  // les fougères et les buissons au pied des arbres et le long des chemins
  {
    const a = atelier();
    let n = 0;
    for (let essai = 0; essai < 700 && n < 90; essai++) {
      const t = tire() * 2 * PI, rr = Math.sqrt(tire()) * 60, x = rr * Math.sin(t), z = -rr * Math.cos(t);
      if (Math.hypot(x, z) > rayonPied(angle(x, z)) - 1 || surLaLigne(ROUTE, x, z).d < 3 || Math.hypot(x - HINGYA.x, z - HINGYA.z) < HINGYA.r + 1.5) continue;
      if (x > CAMPING.x0 && x < CAMPING.x1 && z > CAMPING.z0 && z < CAMPING.z1) continue;
      // ni dans le sauna, à côté du camion, dans le champ de palmiers, devant le tunnel ni à côté du miroir
      if ((x > SAUNA.x - 6 && x < SAUNA.x + 5.5 && z > SAUNA.z - 6 && z < SAUNA.z + 9) || (x > PALMERAIE.x0 - 1 && x < PALMERAIE.x1 + 1 && z > PALMERAIE.z0 - 1 && z < PALMERAIE.z1 + 1)) continue;
      if (Math.hypot(x - T_X, z - T_Z) < 13 || Math.hypot(x - MIROIR.x, z - MIROIR.z) < 1.5) continue;
      if (Math.hypot(x - TRESOR.x, z - TRESOR.z) < 4 || Math.hypot(x - MARCHAND.x, z - MARCHAND.z) < MARCHAND.clairiere) continue;
      const y = terrain(x, z);
      if (tire() < 0.6) {
        // une fougère : des frondes en rosette, penchées vers l'extérieur
        for (let k = 0; k < 7; k++) {
          const b = (k / 7) * 2 * PI + tire();
          a.cone(0.16, 1.0, 4, k % 2 ? P.fougere : P.jungle, { x: x + Math.sin(b) * 0.38, y: y + 0.42, z: z + Math.cos(b) * 0.38, rx: Math.cos(b) * 1.05, rz: -Math.sin(b) * 1.05, sz: 0.35, trait: false, sorte: 'persistant' });
        }
      } else {
        const r = 0.5 + tire() * 0.4;
        a.buisson(x, y + 0.3, z, r, P.jungleFonce, { touffu: true });
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
      (surLaParoi ? paroi : flancs).houppe(r, VERTS[Math.floor(tire() * VERTS.length)], { x, y: y + r * 0.25, z, sy: 0.8, sorte: 'persistant' }, 1);
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
        if (Math.hypot(x - AZUMAYA.x, z - AZUMAYA.z) < 4.6 || [PIN_VENT, JUMELLES, STELE].some((o) => Math.hypot(x - o.x, z - o.z) < 2.6)) continue;
      } else {
        const t = tire() * 2 * PI, dm = 10 + tire() * 14;
        x = MARUYAMA.x + Math.sin(t) * dm; z = MARUYAMA.z + Math.cos(t) * dm;
        if (Math.hypot(x - SOMMET.x, z - SOMMET.z) < 4 || Math.hypot(x - TRESOR.x, z - TRESOR.z) < 4) continue;
      }
      const r = 0.55 + tire() * 0.45;
      a.buisson(x, terrain(x, z) + 0.25, z, r, tire() < 0.5 ? P.jungleFonce : P.jungle, { touffu: true });
      buissons.push([x, z, r]);
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Le secret : la boîte enterrée (2026-10-23)
  // le camélia (tsubaki, l'arbre des îles d'Izu : ses fleurs rouges tombent entières) qui marque l'endroit, trois pierres
  // autour du petit creux ; dans le creux, la boîte en fer enterrée (elle sort de terre quand on creuse, son couvercle
  // s'ouvre : la lettre roulée, la photo, le koban)
  const animes = [];
  {
    const a = atelier(), { x, z } = TSUBAKI, y = terrain(x, z), VERT = '#2f6a3a', VERT2 = '#3a7a42';
    a.baton([x, y - 0.1, z], [x + 0.08, y + 1.1, z - 0.05], 0.08, P.tronc, 6)
      .baton([x + 0.06, y + 0.9, z], [x - 0.35, y + 1.6, z + 0.2], 0.05, P.tronc, 5)
      .baton([x + 0.06, y + 0.95, z], [x + 0.45, y + 1.7, z - 0.2], 0.05, P.tronc, 5);
    for (const [dx, dy, dz, rr] of [[0, 2.0, 0, 0.95], [-0.55, 1.65, 0.25, 0.7], [0.55, 1.75, -0.25, 0.72], [0.1, 2.55, 0.05, 0.6], [-0.2, 1.4, -0.45, 0.55]]) {
      a.boule(rr, rr > 0.7 ? VERT : VERT2, { x: x + dx, y: y + dy, z: z + dz, sy: 0.85, sorte: 'conifere' }, 1);
    }
    // les fleurs rouges (et leur cœur jaune), sur le feuillage et tombées par terre, tout autour
    for (let k = 0; k < 34; k++) {
      const t = hasard(k, 1.3) * 2 * PI, u = hasard(k, 2.9), yy = 1.25 + u * 1.5, rr = 0.75 + 0.25 * Math.sin(u * 3);
      const fx = x + Math.sin(t) * rr * (1 - (u - 0.5) ** 2), fz = z + Math.cos(t) * rr * (1 - (u - 0.5) ** 2);
      a.ovale(0.075, '#c8302c', { x: fx, y: y + yy, z: fz, sy: 0.65, trait: false }, 8).ovale(0.03, '#f2c443', { x: fx, y: y + yy + 0.045, z: fz, trait: false }, 5);
    }
    for (let k = 0; k < 14; k++) {
      const t = hasard(k, 7.7) * 2 * PI, rr = 0.6 + hasard(k, 3.1) * 1.5, fx = x + Math.sin(t) * rr, fz = z + Math.cos(t) * rr;
      a.ovale(0.07, '#b8282a', { x: fx, y: terrain(fx, fz) + 0.03, z: fz, sy: 0.5, trait: false }, 8);
    }
    for (const [dx, dz, rr] of [[-1.5, 1.3, 0.3], [-1.0, -1.7, 0.24], [1.6, 1.5, 0.27]]) {
      const px = TRESOR.x + dx, pz = TRESOR.z + dz;
      a.rocher(px, terrain(px, pz) + 0.05, pz, rr, P.rocheSombre);
      monde.cercle(px, pz, rr + 0.1);
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
    monde.cercle(x, z, 0.35);
  }
  const boite = (() => {
    const yT = terrain(TRESOR.x, TRESOR.z), BLEU = '#5a7fa8', ROUILLE = '#9a5a3a';
    const rouille = (x, y, z) => (Math.sin(x * 61 + z * 37) * Math.sin(y * 53 + x * 29) > 0.55 ? ROUILLE : BLEU);
    const objet = new THREE.Group(), corps = ctx.maillage(atelier()
      .boite(0.36, 0.12, 0.26, BLEU, { y: 0.06, teinte: rouille })
      .boite(0.34, 0.012, 0.24, '#e9e4d6', { y: 0.118, trait: false }) // le fond intérieur, clair
      .cylindre(0.025, 0.025, 0.2, 8, '#fbf6ea', { x: -0.06, y: 0.135, rz: Math.PI / 2 }) // la lettre roulée
      .boite(0.1, 0.006, 0.08, '#f3ead8', { x: 0.09, y: 0.128, z: 0.04, ry: 0.3, trait: false }) // la photo
      .fin(0, false));
    const couvercle = new THREE.Group();
    couvercle.position.set(0, 0.12, -0.13);
    couvercle.add(ctx.maillage(atelier().boite(0.37, 0.03, 0.27, BLEU, { y: 0.015, z: 0.135, teinte: rouille })
      .piece(new THREE.CircleGeometry(0.07, 18), '#e8b941', { y: 0.031, z: 0.135, rx: -Math.PI / 2, trait: false }).fin(0, false)));
    const piece = ctx.maillage(atelier().ovale(0.03, '#f2c84f', { sy: 0.15, sz: 1.4 }, 10).fin(0, false));
    piece.position.set(0.1, 0.135, -0.06);
    objet.add(corps, couvercle, piece);
    objet.position.set(TRESOR.x, yT - 0.3, TRESOR.z);
    objet.rotation.y = 0.4;
    objet.visible = false;
    let sortie = 0, ouverture = 0, enMouvement = false;
    if (secretTrouve('tresor')) { objet.visible = true; sortie = ouverture = 1; piece.visible = false; }
    return {
      objet,
      sortir() { objet.visible = true; enMouvement = true; },
      vider() { piece.visible = false; },
      maj(dt) {
        if (enMouvement) {
          sortie = Math.min(1, sortie + dt / 1.1);
          if (sortie >= 1) ouverture = Math.min(1, ouverture + dt / 0.9);
          if (ouverture >= 1) enMouvement = false;
        }
        const s1 = sortie * sortie * (3 - 2 * sortie), s2 = ouverture * ouverture * (3 - 2 * ouverture);
        objet.position.y = yT - 0.3 + 0.28 * s1;
        couvercle.rotation.x = -1.9 * s2;
      },
    };
  })();
  animes.push({ objet: boite.objet, maj: (dt) => { boite.maj(dt); return []; } });

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
  // (la nuit, ce qu'ils disent change : jeu.txn)
  const parler = (id) => ({ id, passant: id, verbe: 'parler', action: (jeu) => jeu.dire(jeu.txn(id), id) });
  const interactions = [
    {
      id: 'gardienne', passant: 'gardienne', verbe: 'parler',
      async action(jeu) {
        if (jeu.estNuit) { await jeu.dire(jeu.tx('gardienneNuit'), 'gardienne'); return; } // (fermé la nuit : pas d'œufs)
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
      // le campeur fait tomber la nuit sur le cratère (la Voie lactée ; elle reste), et, la nuit, revenir le jour
      async action(jeu) {
        if (jeu.estNuit) {
          const r = await jeu.choisir(jeu.tx('campeurMatin'), [jeu.t('oui'), jeu.t('non')], 'campeur');
          if (r !== 0) { await jeu.dire(jeu.tx('campeurReste'), 'campeur'); return; }
          await jeu.nuit(false);
          await jeu.dire(jeu.tx('campeurJour'), 'campeur');
          return;
        }
        const r = await jeu.choisir(jeu.tx(jeu.aTampon('etoiles') ? 'campeurEncore' : 'campeur'), [jeu.t('oui'), jeu.t('non')], 'campeur');
        if (r !== 0) { await jeu.dire(jeu.tx('campeurNon'), 'campeur'); return; }
        jeu.leverLesYeux(true);
        await jeu.nuit(true);
        await jeu.dire(jeu.tx('campeurNuit'), 'campeur');
        if (!jeu.aTampon('etoiles')) await jeu.tampon('etoiles');
        jeu.leverLesYeux(false);
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
    { id: 'tunnel', x: duTunnel(0, -2.4)[0], z: duTunnel(0, -2.4)[1], rayon: 2.6, verbe: 'regarder', action: (jeu) => jeu.dire(jeu.tx('tunnel')) },
    {
      // le sauna : on s'assoit sur le gradin du bas, la vapeur envahit tout, on ressort en sueur (le compagnon aussi)
      id: 'sauna', x: versSauna(2.15, -1.55)[0], z: versSauna(2.15, -1.55)[1], y: solS + 0.05, rayon: 1.9, verbe: 'asseoir',
      async action(jeu) {
        if (jeu.estNuit) { await jeu.dire(jeu.tx('saunaNuit')); return; } // (fermé la nuit)
        const r = await jeu.choisir(jeu.tx('saunaQuestion'), [jeu.t('oui'), jeu.t('non')]);
        if (r !== 0) return;
        jeu.asseoir(SIEGE, { lacet: SIEGE.cap - 0.45, tangage: 0.16, distance: 2.6 });
        jeu.vapeur(true);
        await jeu.attendre(1400);
        await jeu.dire(jeu.tx('saunaDedans'));
        jeu.transpirer();
        await jeu.dire(jeu.tx('saunaCompagnon')[jeu.compagnon], 'compagnon');
        jeu.vapeur(false);
        await jeu.attendre(900);
        jeu.asseoir(null);
        await jeu.dire(jeu.tx('saunaFin'));
      },
    },
    { id: 'distributeur', x: versSauna(-3.6, 4.75)[0], z: versSauna(-3.6, 4.75)[1], rayon: 1.5, verbe: 'acheter', action: (jeu) => jeu.dire(jeu.txn('distributeur')) },
    {
      // l'abri de la crête : on s'assoit sur le banc du fond, face à la caldeira, et l'on regarde (le compagnon aussi)
      id: 'abri', x: versAbri(0, -0.75)[0], z: versAbri(0, -0.75)[1], y: SOL_ABRI, rayon: 1.5, verbe: 'asseoir',
      async action(jeu) {
        // (la caméra par-dessus l'épaule, sous le toit : la vue sur la caldeira, le voyageur assis en bas à gauche ;
        // ensuite, il y reste assis jusqu'à ce qu'il marche)
        jeu.asseoir({ ...SIEGE_ABRI, libre: true });
        const [cx, cz] = versAbri(1.15, -2.4), [vx, vz] = versAbri(-2.2, 16);
        jeu.cadrer({ de: [cx, SOL_ABRI + 2.15, cz], vers: [vx, SOL_ABRI - 6.5, vz] });
        await jeu.attendre(800);
        await jeu.dire(jeu.txn('abri'));
        await jeu.dire(jeu.txn('abriCompagnon')[jeu.compagnon], 'compagnon');
        jeu.cadrer(null);
      },
    },
    {
      // le cahier des voyageurs, et sa dernière page : la carte au trésor (on s'en souvient : tresors.js, indice)
      id: 'cahier', x: versAbri(0.22, -0.08)[0], z: versAbri(0.22, -0.08)[1], y: SOL_ABRI, rayon: 1.25, haut: 1.3, verbe: 'lire',
      async action(jeu) {
        await jeu.dire(jeu.tx('cahier'));
        jeu.image(carteTresor(), 'carte-tresor');
        await jeu.dire(jeu.tx('cahierCarte'));
        jeu.image(null);
        jeu.voirIndice('carte-tresor');
        if (!jeu.secretTrouve('tresor')) await jeu.dire(jeu.tx('carteCompagnon')[jeu.compagnon], 'compagnon');
      },
    },
    {
      // creuser au pied du camélia (seulement si l'on a vu la carte : sans elle, rien ne dit de creuser là)
      id: 'creuser', x: TRESOR.x, z: TRESOR.z, rayon: 1.9, haut: 0.9, verbe: 'creuser', si: (jeu) => jeu.indiceVu('carte-tresor') && !jeu.secretTrouve('tresor'),
      async action(jeu) {
        const y = terrain(TRESOR.x, TRESOR.z);
        // la caméra de côté : on voit les mains dans la terre, puis la boîte
        jeu.cadrerDeCote(TRESOR.x, y, TRESOR.z, { distance: 3.6, haut: 1.4 });
        await jeu.dire(jeu.tx('creuserDebut'));
        jeu.geste('creuser');
        for (let k = 0; k < 3; k++) {
          jeu.son('pelle');
          jeu.terre(TRESOR.x, y + 0.08, TRESOR.z, y - 0.05, 12);
          await jeu.attendre(850);
        }
        jeu.geste(null);
        jeu.son('boite');
        boite.sortir();
        await jeu.attendre(1100);
        await jeu.dire(jeu.tx('boiteTrouvee'));
        jeu.image(photoClasse(), 'photo-classe');
        await jeu.dire(jeu.tx('photoClasse'));
        jeu.image(lettre(), 'lettre');
        await jeu.dire(jeu.tx('lettre'));
        jeu.image(null);
        boite.vider();
        await jeu.trouverSecret('tresor');
        jeu.cadrer(null);
      },
    },
    { id: 'boite', x: TRESOR.x, z: TRESOR.z, rayon: 1.7, haut: 0.7, verbe: 'regarder', si: (jeu) => jeu.secretTrouve('tresor'), action: (jeu) => jeu.dire(jeu.tx('boiteApres')) },
    {
      // les jumelles : une pièce, et l'on voit Hachijō-jima sur l'horizon, dans les deux ronds des jumelles
      id: 'jumelles', ...((q) => ({ x: q[0], z: q[2] }))(versJumelles(0, 0, -0.55)), rayon: 1.4, haut: 1.75, verbe: 'regarder',
      async action(jeu) {
        if (jeu.estNuit) { await jeu.dire(jeu.tx('jumellesNuit')); return; } // (trop noir pour voir Hachijō)
        await jeu.dire(jeu.tx('jumelles'));
        jeu.jumelles(true);
        jeu.cadrer({ de: versJumelles(0, 1.36, 0.4), vers: [HACHIJO.x, HACHIJO.y + 12, HACHIJO.z], champ: 13 });
        await jeu.attendre(500);
        await jeu.dire(jeu.tx('jumellesVue'));
        jeu.cadrer(null);
        jeu.jumelles(false);
      },
    },
    { id: 'stele', x: STELE.x, z: STELE.z, rayon: 1.8, verbe: 'lire', action: (jeu) => jeu.dire(jeu.tx('stele')) },
    { id: 'lis', x: STELE.x - 1.5, z: STELE.z - 0.9, rayon: 1.3, haut: 1.4, verbe: 'regarder', action: (jeu) => jeu.dire(jeu.tx('lis')) },
    ...interactionsBancs(bancs),
  ];

  // les bêtes (betes.js) : les regarder, caresser un chat (la nuit, ce qu'on en dit change)
  const actionBete = async (jeu, b) => {
    if (b.sorte !== 'chat') { await jeu.dire(jeu.tx(b.sorte)); return; }
    await jeu.dire(jeu.txn(b.id));
    await jeu.dire(jeu.tx('chatCompagnon')[jeu.compagnon], 'compagnon');
  };

  // ---------------------------------------------------------------- Pour la caméra et les captures
  const dM = [MARUYAMA.x, MARUYAMA.z];
  const depart = { x: -37.5, z: -28.5, cap: vers(-37.5, -28.5, ...dM) };
  const heros = { x: 14.5, z: -77.6 };
  const capHeros = vers(heros.x, heros.z, ...dM);
  return {
    ...infos, textes: TEXTES,
    objets, monde, terrain, trouSol, etiquettes, passants, daims: [], interactions, actionDaim: null, vapeurs, bancs, lumieres, actionBete, animes,
    // (le secret, tresors.js ; le marchand, dans sa clairière, tourné vers la trouée ; les sons à fabriquer en plus ; les feux d'artifice,
    // tirés du cratère du petit volcan)
    secret: 'tresor', marchand: { x: MARCHAND.x, z: MARCHAND.z, cap: MARCHAND.ouverture }, sons: ['pelle', 'boite'],
    feux: { x: MARUYAMA.x, y: 9, z: MARUYAMA.z, large: 46, haut: [40, 62] },
    // les bêtes (betes.js) : trois grives des îles d'Izu (chacune entre ses coins : le bois près du sauna, l'herbe
    // du sentier, le camping), quatre lézards au chaud (autour des fumerolles, au pied du sauna), un chat roux qui
    // dort près de la marmite et un chat noir et blanc près du distributeur, des papillons (la crête, le camping,
    // le fond du cratère), deux milans qui tournent au-dessus
    betes: {
      grives: [[[-27, 12], [-25.5, 9.5], [-23.5, 13]], [[-12, 2.5], [-14.5, -2.5], [-16, 4.5]], [[1, 30.5], [-3, 33], [4, 34]]],
      lezards: [[-8.5, 21], [-10, 28.5], [-20.5, 30.5], [-33, 6.5]],
      chats: [{ id: 'chatRoux', x: -31, z: 19.6, cap: 2.6, robe: 'roux', dort: true }, { id: 'chatPie', ...((q) => ({ x: q[0], z: q[1] }))(versSauna(-4.95, 4.35)), cap: PI / 2, robe: 'pie' }],
      papillons: [[-12.6, -79.2], [6, 35], [-24, 5], [-14, -76]],
      milans: [{ x: 0, z: 5, r: 38, h: 36, sens: 1 }, { x: -14, z: 16, r: 24, h: 28, sens: -1 }],
    },
    aspectSol: (x, z, h) => aspectSol(P, x, z, h),
    centreRive: [0, 0], // les lignes d'eau font le tour de l'île
    etendue: { x0: -420, x1: 420, z0: -420, z1: 420, pas: 4, fin: { x0: -100, x1: 100, z0: -104, z1: 100, pas: 1 } },
    eau: { x0: -2000, x1: 2000, z0: -2000, z1: 2000, niveau: MER },
    // l'île en plein océan est ventée ; la bouscarle dans la jungle du cratère, un milan de temps en temps ;
    // le souffle des fumerolles, les insectes de la nuit au camping (la mer est loin en bas des falaises)
    vent: { dir: [0.85, 0.35], force: 1.15 }, oiseaux: ['uguisu', 'milan', 'akakokko'], ambiances: ['vapeur', 'insectes'],
    brume: [100, 1900],
    // (2026-10-24) les rais de soleil dans la clairière du marchand, au milieu de la forêt (balade.js, creerRais)
    rais: [[MARCHAND.x - 2, MARCHAND.z + 1], [MARCHAND.x + 2.2, MARCHAND.z - 1.5], [MARCHAND.x + 0.5, MARCHAND.z + 2.4]].map(([x, z], i) => ({ x, z, haut: 9, r0: 0.3, r1: 1.0 + 0.25 * i, force: 0.085 })),
    soleil: [-0.42, 0.72, 0.55],
    depart,
    photos: {
      heros: { ...heros, cap: capHeros, lacet: capHeros + PI + 0.2, tangage: 0.42, distance: 6.2 },
      perso: { x: depart.x, z: depart.z, cap: depart.cap + PI, lacet: depart.cap + PI + 0.05, tangage: 0.1, distance: 3.9 },
    },
  };
}

// ---------------------------------------------------------------- Le trésor : la carte, la photo, la lettre (SVG)
/** Un trait de crayon d'enfant (le filtre le fait trembler). */
const CRAYON = `<filter id="crayon" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="4"/></filter>`;
/** Du lieu (x, z, en mètres) à la carte dessinée (400 × 400, le nord en haut). */
const surCarte = (x, z) => [200 + x * 2.35, 205 + z * 2.35];
/**
 * La carte au trésor : une page de cahier à lignes ; au crayon de couleur, le grand cratère, le petit volcan et son
 * chemin en spirale, les fumerolles, les tentes du camping, l'escalier, le tunnel, le sauna ; la croix rouge à l'est du
 * petit volcan, près d'un arbre aux fleurs rouges et de trois cailloux ; « たからもの ここ！ » (le trésor, ici !).
 */
function carteTresor() {
  const [mx, mz] = surCarte(MARUYAMA.x, MARUYAMA.z), [tx, tz] = surCarte(TRESOR.x, TRESOR.z), [cx, cz] = surCarte(TSUBAKI.x, TSUBAKI.z);
  const [hx, hz] = surCarte(HINGYA.x, HINGYA.z), [sx, sz] = surCarte(SAUNA.x, SAUNA.z), [kx, kz] = surCarte(4, 44);
  const [ux, uz] = surCarte(T_X, T_Z), [bx, bz] = surCarte(BAS[0], BAS[1]), [ax, az] = surCarte(HAUT[0], HAUT[1]);
  let lignes = '';
  for (let y = 30; y < 400; y += 22) lignes += `<path d="M0 ${y} H400" stroke="#b9d3e8" stroke-width="1.2"/>`;
  let escalier = `M${bx} ${bz}`;
  for (let k = 1; k <= 8; k++) { const f = k / 8; escalier += ` L${(bx + (ax - bx) * f + (k % 2 ? 7 : -7)).toFixed(1)} ${(bz + (az - bz) * f).toFixed(1)}`; }
  return `<svg viewBox="0 0 400 400" class="dessin-enfant" aria-hidden="true"><defs>${CRAYON}</defs>
    <rect width="400" height="400" fill="#fbf8ee"/>${lignes}<path d="M38 0 V400" stroke="#f0b0b0" stroke-width="1.5"/>
    <g filter="url(#crayon)" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <ellipse cx="200" cy="205" rx="152" ry="147" stroke="#7a5a3a" stroke-width="5"/>
      <ellipse cx="200" cy="205" rx="176" ry="171" stroke="#5f9a45" stroke-width="3" stroke-dasharray="10 7"/>
      <path d="M${mx - 48} ${mz + 26} Q${mx} ${mz - 62} ${mx + 48} ${mz + 26}" stroke="#3f8a3a" stroke-width="5" fill="#bfe0a0"/>
      <path d="M${mx - 28} ${mz + 12} Q${mx} ${mz - 30} ${mx + 26} ${mz + 4} Q${mx + 6} ${mz - 14} ${mx - 10} ${mz - 8}" stroke="#9a7a4a" stroke-width="2.5"/>
      <path d="M${hx - 12} ${hz + 8} q4 -10 0 -18 q-4 -8 0 -16 M${hx + 4} ${hz + 8} q4 -10 0 -18 q-4 -8 0 -16" stroke="#d8402e" stroke-width="3"/>
      <path d="M${kx - 26} ${kz + 10} l12 -18 l12 18 z M${kx + 4} ${kz + 12} l12 -18 l12 18 z" stroke="#e8732e" stroke-width="3" fill="#ffd2a8"/>
      <path d="${escalier}" stroke="#4a4a4a" stroke-width="3"/>
      <path d="M${ux - 14} ${uz + 10} v-10 a14 14 0 0 1 28 0 v10" stroke="#4a4a4a" stroke-width="4"/>
      <rect x="${sx - 14}" y="${sz - 10}" width="28" height="20" stroke="#3f6aa0" stroke-width="3"/>
      <path d="M${sx - 6} ${sz - 14} q3 -6 0 -12 M${sx + 6} ${sz - 14} q3 -6 0 -12" stroke="#9ab" stroke-width="2"/>
      <circle cx="${cx + 8}" cy="${cz - 10}" r="17" stroke="#2f6a3a" stroke-width="3" fill="#7ab36a"/>
      <circle cx="${cx + 2}" cy="${cz - 16}" r="4.5" fill="#d8302c" stroke="#d8302c"/><circle cx="${cx + 15}" cy="${cz - 6}" r="4.5" fill="#d8302c" stroke="#d8302c"/><circle cx="${cx + 4}" cy="${cz - 2}" r="4" fill="#d8302c" stroke="#d8302c"/>
      <circle cx="${tx - 16}" cy="${tz + 12}" r="3.5" fill="#888" stroke="#666"/><circle cx="${tx - 10}" cy="${tz - 14}" r="3" fill="#888" stroke="#666"/><circle cx="${tx + 15}" cy="${tz + 14}" r="3.2" fill="#888" stroke="#666"/>
      <path d="M${tx - 11} ${tz - 11} L${tx + 11} ${tz + 11} M${tx + 11} ${tz - 11} L${tx - 11} ${tz + 11}" stroke="#d8302c" stroke-width="7"/>
      <path d="M${tx + 30} ${tz + 52} Q${tx + 24} ${tz + 30} ${tx + 10} ${tz + 18}" stroke="#d8302c" stroke-width="3"/>
      <path d="M352 52 l-4 -14 l-4 14 m4 -14 v34" stroke="#3a3236" stroke-width="3"/>
      <circle cx="330" cy="352" r="15" stroke="#f2b33a" stroke-width="4" fill="#ffe08a"/>
    </g>
    <text x="60" y="40" font-size="24" font-weight="800" fill="#3a5ab0" font-family="'M PLUS Rounded 1c', sans-serif">あおがしま たからのちず</text>
    <text x="348" y="30" font-size="15" font-weight="800" fill="#3a3236" font-family="'M PLUS Rounded 1c', sans-serif" text-anchor="middle">きた</text>
    <text x="${tx + 2}" y="${tz + 76}" font-size="21" font-weight="800" fill="#d8302c" font-family="'M PLUS Rounded 1c', sans-serif" text-anchor="middle">たからもの ここ！</text>
    <text x="${mx}" y="${mz + 50}" font-size="15" font-weight="700" fill="#3f8a3a" font-family="'M PLUS Rounded 1c', sans-serif" text-anchor="middle">まるやま</text>
    <text x="${cx + 44}" y="${cz - 26}" font-size="14" font-weight="700" fill="#b8282a" font-family="'M PLUS Rounded 1c', sans-serif" text-anchor="middle">つばき</text>
  </svg>`;
}
/**
 * La photo de classe (sépia, bord blanc) : les neuf élèves de l'école de l'île et leur maîtresse devant l'école, la
 * crête du cratère derrière ; dans la marge, « 1985年 夏 青ヶ島小学校 ».
 */
function photoClasse() {
  const eleve = (x, y, k) => {
    const h = 34 + (k % 3) * 4, c = ['#6a5038', '#5a4430', '#7a5e42'][k % 3];
    return `<g transform="translate(${x} ${y})"><rect x="-11" y="${-h}" width="22" height="${h - 12}" rx="7" fill="${c}"/><circle cy="${-h - 9}" r="11" fill="#d9bf98"/>`
      + `<path d="M-11 ${-h - 12} q11 -12 22 0" fill="#3a2a20"/><circle cx="-4" cy="${-h - 9}" r="1.4" fill="#2a2020"/><circle cx="4" cy="${-h - 9}" r="1.4" fill="#2a2020"/>`
      + `<path d="M-3 ${-h - 4} q3 2.5 6 0" stroke="#2a2020" stroke-width="1.2" fill="none"/><rect x="-9" y="-12" width="7" height="12" fill="#4a3a2a"/><rect x="2" y="-12" width="7" height="12" fill="#4a3a2a"/></g>`;
  };
  let classe = '';
  [[120, 228], [158, 230], [196, 228], [234, 230], [272, 228]].forEach(([x, y], k) => { classe += eleve(x, y, k); });
  [[139, 262], [177, 264], [215, 262], [253, 264]].forEach(([x, y], k) => { classe += eleve(x, y, k + 5); });
  return `<svg viewBox="0 0 400 330" class="photo-ancienne" aria-hidden="true">
    <rect width="400" height="330" fill="#fbf8f0"/>
    <g transform="translate(22 20)"><rect width="356" height="250" fill="#c8b08a"/>
      <path d="M0 110 Q60 60 120 84 Q190 40 250 80 Q310 56 356 92 V250 H0 Z" fill="#a8916c"/>
      <rect x="40" y="96" width="270" height="74" fill="#d8c4a0"/><path d="M30 98 L175 64 L320 98 Z" fill="#8f7856"/>
      ${[70, 115, 160, 205, 250].map((x) => `<rect x="${x}" y="114" width="28" height="26" fill="#9f8a68"/>`).join('')}
      <g transform="translate(-22 -20)">${classe}</g>
      <g transform="translate(296 170)"><rect x="-13" y="-58" width="26" height="58" rx="8" fill="#5a6a7a"/><circle cy="-68" r="12" fill="#d9bf98"/><path d="M-12 -72 q12 -14 24 0 q-2 -8 -12 -9 q-10 1 -12 9" fill="#2a2020"/></g>
      <rect width="356" height="250" fill="none" stroke="#8a7458" stroke-width="2"/></g>
    <text x="200" y="306" font-size="20" font-weight="700" fill="#5a4a3a" text-anchor="middle" font-family="'M PLUS Rounded 1c', sans-serif">1985年 夏　青ヶ島小学校　みんなで</text>
  </svg>`;
}
/** La lettre : une feuille à lignes, une écriture d'enfant (des lignes de « mots » au crayon), un dessin de koban. */
function lettre() {
  let mots = '';
  for (let l = 0; l < 9; l++) {
    let x = 34;
    while (x < 340) { const w = 14 + ((l * 7 + x) % 23); mots += `<path d="M${x} ${66 + l * 30} q${w / 3} -4 ${w / 2} 0 t${w / 2} 0" stroke="#3a4a7a" stroke-width="2.4" fill="none"/>`; x += w + 9; }
  }
  return `<svg viewBox="0 0 400 360" class="dessin-enfant" aria-hidden="true"><defs>${CRAYON}</defs>
    <rect width="400" height="360" fill="#fbf8ee"/>${Array.from({ length: 11 }, (_, k) => `<path d="M0 ${50 + k * 30} H400" stroke="#b9d3e8" stroke-width="1.2"/>`).join('')}
    <text x="34" y="36" font-size="20" font-weight="800" fill="#3a4a7a" font-family="'M PLUS Rounded 1c', sans-serif">このはこを みつけた ひとへ</text>
    <g filter="url(#crayon)">${mots}<ellipse cx="350" cy="320" rx="16" ry="23" fill="#f2c84f" stroke="#a87a22" stroke-width="3"/></g>
  </svg>`;
}

/** Le mélange de deux couleurs « #rrggbb » (t : 0 à 1). */
function melanger(c1, c2, t) {
  const v = (c, i) => parseInt(c.slice(i, i + 2), 16);
  return '#' + [1, 3, 5].map((i) => Math.round(v(c1, i) * (1 - t) + v(c2, i) * t).toString(16).padStart(2, '0')).join('');
}
const POLICE = '"M PLUS Rounded 1c", sans-serif';
/** Le sablier de douze minutes des saunas japonais (une horloge à aiguille rouge) : le cadran, transparent autour. */
function douzeMinutes(c, W, H) {
  const R = Math.min(W, H) / 2;
  c.translate(W / 2, H / 2);
  c.fillStyle = '#fbf8f0'; c.beginPath(); c.arc(0, 0, R * 0.96, 0, 2 * Math.PI); c.fill();
  c.strokeStyle = '#2a2420'; c.lineWidth = R * 0.07; c.stroke();
  for (let i = 0; i < 12; i++) {
    const t = (i / 12) * 2 * Math.PI;
    c.lineWidth = R * (i % 3 ? 0.03 : 0.06);
    c.beginPath(); c.moveTo(Math.sin(t) * R * 0.7, -Math.cos(t) * R * 0.7); c.lineTo(Math.sin(t) * R * 0.85, -Math.cos(t) * R * 0.85); c.stroke();
  }
  c.fillStyle = '#2a2420'; c.font = `800 ${Math.round(R * 0.3)}px ${POLICE}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('12', 0, -R * 0.45);
  c.strokeStyle = '#d8302c'; c.lineWidth = R * 0.06;
  c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(2.2) * R * 0.78, -Math.cos(2.2) * R * 0.78); c.stroke();
  c.fillStyle = '#d8302c'; c.beginPath(); c.arc(0, 0, R * 0.08, 0, 2 * Math.PI); c.fill();
}
/** Le thermomètre du sauna, sur sa planchette : la colonne rouge monte haut. */
function thermometre(c, W, H) {
  c.fillStyle = '#c99a64'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#f7f2e6'; c.fillRect(W * 0.3, H * 0.12, W * 0.4, H * 0.76);
  c.fillStyle = '#2a2420';
  for (let i = 0; i <= 10; i++) c.fillRect(W * 0.33, H * (0.82 - i * 0.065), W * (i % 5 ? 0.1 : 0.2), Math.max(1, H * 0.008));
  c.fillStyle = '#d8302c'; c.fillRect(W * 0.47, H * 0.3, W * 0.07, H * 0.55);
  c.beginPath(); c.arc(W * 0.505, H * 0.86, W * 0.1, 0, 2 * Math.PI); c.fill();
  c.fillStyle = '#2a2420'; c.font = `800 ${Math.round(W * 0.22)}px ${POLICE}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('℃', W * 0.5, H * 0.065);
}
/** La vitrine éclairée d'un distributeur : trois rangs de canettes et de bouteilles, leurs prix, leurs boutons. */
function canettes(c, W, H) {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#dfe8ee');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const COUL = [['#2f8a4a', '#e8e4d0'], ['#7a4a2a', '#f0e0c0'], ['#d8302c', '#ffffff'], ['#f0a020', '#ffffff'], ['#2a5ab0', '#ffffff'], ['#e8e4d0', '#3a8a5a']];
  c.textAlign = 'center'; c.textBaseline = 'middle';
  for (let rg = 0; rg < 3; rg++) {
    for (let k = 0; k < 6; k++) {
      const x = W * (0.07 + k * 0.152), y = H * (0.04 + rg * 0.32), w = W * 0.1, h = H * 0.19;
      const [fond, bande] = COUL[(rg * 2 + k) % COUL.length];
      c.fillStyle = fond; c.fillRect(x, y, w, h);
      c.fillStyle = bande; c.fillRect(x, y + h * 0.38, w, h * 0.22);
      c.fillStyle = '#cfd6da'; c.fillRect(x, y, w, h * 0.08);
      c.fillStyle = '#2a2a2e'; c.font = `700 ${Math.round(h * 0.3)}px ${POLICE}`;
      c.fillText(['120', '130', '150', '100', '160', '140'][(k + rg) % 6], x + w / 2, y + h * 1.25);
      c.fillStyle = '#36c46a'; c.fillRect(x + w * 0.2, y + h * 1.45, w * 0.6, h * 0.12);
    }
  }
}

/** La couleur et le motif (styles.js) du sol : la mer et ses falaises, la forêt, la paroi, la route, les chemins, les lieux. */
function aspectSol(P, x, z, h) {
  if (h < MER + 1) return [P.rocheSombre, M.roche];
  const r = Math.hypot(x, z), a = angle(x, z), r1 = rayonPied(a), r2 = r1 + PAROI, r3 = r2 + largeurCrete(a);
  const pente = Math.hypot(terrain(x + 0.5, z) - h, terrain(x, z + 0.5) - h) / 0.5;
  const bruit = bruitDoux(x, z, 4);
  if (h < MER + 9) return [pente > 1.6 || bruit > 0.6 ? P.rocheSombre : P.paroi, M.roche]; // la falaise du bord de mer
  // au tunnel : sous et derrière la façade, de la roche taillée (pas d'herbe qui percerait le dessus de la façade)
  {
    const [lx, d] = versTunnel(x, z);
    if (d > 0.1 && d < 9 && Math.abs(lx) < 9.4) return [P.rocheSombre, M.roche];
  }
  {
    const [lx, lz] = dansAbri(x, z);
    if (Math.abs(lx) < 2.1 && Math.abs(lz) < 2.1) return [P.pierre, M.dalles];
  }
  const marches = surLaLigne(MARCHES, x, z).d;
  if (marches < 1.15) return [P.pierre, M.pierre];
  if (marches < 2.1 + 0.3 * bruit) return [P.chemin, M.terre]; // l'accotement, au bout des marches
  if (marches < 5) return bruit > 0.5 ? [P.jungle, M.sousBois] : [P.herbeFonce, M.herbe];
  if (surLaLigne(ROUTE, x, z).d < 2.1) return [P.route, M.route];
  for (const c of CHEMINS) if (surLaLigne(c, x, z).d < 1.1) return [P.chemin, M.terre];
  // le champ de palmiers : la terre sombre, en sillons
  if (x > PALMERAIE.x0 && x < PALMERAIE.x1 && z > PALMERAIE.z0 && z < PALMERAIE.z1) return [Math.floor((x - PALMERAIE.x0) / 1.25) % 2 ? '#8a6a4f' : '#7d5f47', M.terre];
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
    // (2026-10-24) des ravines de largeurs inégales, qui serpentent un peu, entre des croupes d'herbe plus ou moins
    // sombre (avant : des bandes toutes égales, comme un melon)
    const u = ((am + PI_) / (2 * PI_)) * 40 + bruitDoux(x, z, 3) * 1.3 + bruitDoux(x + 50, z, 9) * 0.9;
    const b = Math.floor(u), hb = (((Math.sin(b * 12.9898) * 43758.5453) % 1) + 1) % 1;
    if (u - b < 0.22 + 0.36 * hb) return [P.jungle, M.sousBois];
    return [hb > 0.62 ? P.herbeFonce : P.herbe, M.herbe];
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
    'panneau-sauna': ['« Sauna géothermique ふれあいサウナ »', 'Pas besoin de feu : c’est la vapeur du volcan qui chauffe le sauna.', 'Entre donc : la salle de vapeur est juste à droite de l’entrée.', 'À côté, la marmite géothermique : on y cuit des œufs et des patates douces.'],
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
    campeurApres: ['Profite de la nuit ! Pas un lampadaire : juste les étoiles.', 'Quand tu voudras revoir le jour, reviens me parler.'],
    campeurNon: ['D’accord ! Le ciel sera encore là ce soir.'],
    campeurEncore: ['Re-salut ! Tu veux revoir la nuit tomber sur le cratère ?'],
    campeurMatin: ['Ce soir, j’essaie de voir une étoile filante !', 'Tu veux qu’on attende le lever du soleil ?'],
    campeurJour: ['Et voilà le soleil qui se lève sur la crête ! Bonne balade !'],
    campeurReste: ['D’accord ! Regarde bien : une étoile filante, ça passe vite.'],
    randonneuse: ['Je fais le tour du petit volcan.', 'Tout en haut, on est dans un volcan… lui-même dans un volcan !'],
    enfant: ['Tu es venu en bateau ? Il est souvent annulé à cause des vagues !', 'Sinon, il y a l’hélicoptère, mais il n’a que quelques places.', 'Ici, tout le monde se connaît !', 'À l’école, on raconte qu’une ancienne classe a caché un trésor dans le cratère… Mais personne ne l’a jamais trouvé !'],
    grandpere: ['En 1785, le volcan a explosé. Tout le monde a fui vers Hachijō.', 'Il a fallu près de cinquante ans pour que les habitants reviennent.', 'On appelle ça le « kanjū » : le retour au pays.'],
    videaste: ['Salut ! Je filme les plus beaux lieux du Japon pour TikTok.', 'Mon compte, c’est @random_japan_place.', 'J’ai fait une vidéo d’Aogashima. Tu veux la voir ?'],
    videasteNon: ['D’accord ! Elle est aussi sur la carte, avec tous les autres lieux.'],
    videasteApres: ['Ça t’a plu ? Abonne-toi pour voir les prochains lieux !'],
    sommet: ['Tu es au sommet de Maruyama, le petit volcan.', 'Tout autour, les parois du grand cratère : tu es dans un volcan, dans un volcan !'],
    sommet2: ['Le vent souffle sur le cratère du petit volcan.'],
    otonbu: ['Tu es tout en haut d’Aogashima : 423 m.', 'D’un côté, la double caldeira. De l’autre, l’océan à perte de vue.', 'Au loin, au nord, l’île de Hachijō.'],
    otonbu2: ['Le vent de la mer fait onduler l’herbe de la crête.'],
    tunnel: ['Le tunnel 青宝 (Seihō) : la seule route qui entre dans le cratère.', 'De l’autre côté, le port et le village. C’est par là que tu es arrivé !'],
    saunaQuestion: ['Les gradins de bois baignent dans la vapeur chaude du volcan.', 'Tu t’assois un moment ?'],
    saunaDedans: ['Ouf… il fait près de 60 °C !', 'La vapeur monte des grilles du sol : elle vient tout droit du volcan.', 'L’aiguille rouge du sablier de douze minutes tourne… Tu respires lentement.'],
    saunaCompagnon: {
      kon: ['Chaud… chaud… chaud ! Mon pelage est tout trempé !'],
      pon: ['Pon… je fonds comme un mochi grillé… Après, on mange des œufs du volcan ?'],
      chapu: ['Chapu ! C’est comme une rivière… mais dans l’air ! Encore, encore !'],
      gao: ['Gao… Sur mon île aussi il fait chaud, mais là, c’est un four à patates douces !'],
      fuwa: ['Fuwa… Un dragon des mers ne craint pas la vapeur ! (Mais mes moustaches frisent.)'],
      saya: ['Mes feuilles… se recroquevillent… Un arbre n’est pas fait pour le sauna !'],
    },
    abri: ['Le vent souffle sur la crête…', 'D’ici, tout le cratère : la jungle du fond, les vapeurs des fumerolles, le petit volcan Maruyama… et l’océan, tout autour.'],
    abriCompagnon: {
      kon: ['« On se croirait au bord du bol d’un géant… Les dieux doivent aimer cet endroit. »'],
      pon: ['« Une pause bien méritée ! Tu as un onigiri dans ton sac ? Non ? Tant pis… »'],
      chapu: ['« Regarde la mer, toute bleue ! J’irais bien y plonger… mais c’est un peu loin, en bas. »'],
      gao: ['« D’ici, je garderais toute l’île. C’est le meilleur poste de gardien ! »'],
      fuwa: ['« Toute cette mer… Mon grand-père le dragon doit dormir quelque part là-dessous. »'],
      saya: ['« Le vent chante dans les herbes… Les vieux arbres de la paroi te disent bonjour. »'],
    },
    cahier: ['Un cahier sur la table : « 思い出ノート », le cahier des souvenirs. Les voyageurs y laissent un mot.', '« Le bateau n’a pas pu accoster trois jours de suite. Je suis venue en hélicoptère : neuf places, vingt minutes ! »', '« Vu la Voie lactée depuis le camping. Je reviendrai. »', '« Les œufs de la marmite du volcan sont les meilleurs du monde. — un garçon de Tokyo, 8 ans »'],
    jumelles: ['Des jumelles à pièces : 100 yens. Tu glisses une pièce… clic !'],
    jumellesVue: ['Au nord, sur l’horizon : Hachijō-jima et ses deux volcans, à près de 70 km de mer.', 'Le bateau qui relie les deux îles ne part que si la mer est calme : bien souvent, il reste au port.'],
    stele: ['« 外輪山 » (gairinzan) : la crête du grand cratère.', 'En 1785, une éruption a chassé les habitants de l’île : ils se sont réfugiés à Hachijō.', 'Il leur a fallu cinquante ans pour revenir y vivre, en 1835 : on l’appelle le « kanjū », le retour.'],
    lis: ['Des sakuyuri, les grands lis blancs des îles d’Izu : ils ne poussent nulle part ailleurs.', 'Leur parfum est si fort qu’on le sent de loin, porté par le vent.'],
    saunaFin: ['Tu ressors tout léger, la peau toute douce.', 'Ici, ni bois ni gaz : c’est le volcan qui chauffe le sauna.'],
    distributeur: ['Un distributeur de boissons, même au fond d’un cratère !', 'Tu choisis un thé vert bien frais… Clonk ! La bouteille tombe.', 'Au Japon, il y en a presque partout : plus de quatre millions !'],
    // la nuit (le campeur l'a fait tomber) : ce qui change
    gardienneNuit: ['Il est tard ! Le sauna est fermé, il rouvre demain.', 'Les œufs de la marmite, ce sera demain matin. Dors bien !'],
    saunaNuit: ['La salle de vapeur est fermée pour la nuit.', 'Mais la vapeur du volcan, elle, monte toujours des grilles…'],
    gardeNuit: ['La nuit, les fumerolles brillent sous la lune.', 'Reste bien derrière la corde : dans le noir, on voit mal où est la vapeur !'],
    randonneuseNuit: ['Je rentre au camping avec ma lampe frontale.', 'Au-dessus du petit volcan, le ciel est plein d’étoiles !'],
    enfantNuit: ['Il fait nuit ! Je dois rentrer au village.', 'Tu entends les insectes ? Ils chantent partout dans la jungle.'],
    grandpereNuit: ['La nuit, sur Aogashima, il n’y a que les étoiles et le vent.', 'Pas de lampadaire, pas de bruit… Je ne changerais pour rien au monde.'],
    distributeurNuit: ['Même la nuit, le distributeur est allumé : au Japon, ils marchent jour et nuit !', 'Tu choisis un thé chaud, cette fois… Clonk !'],
    jumellesNuit: ['Tu glisses une pièce… Il fait trop noir : on ne voit plus Hachijō-jima.', 'Reviens de jour pour la voir !'],
    abriNuit: ['La nuit est tombée sur la crête…', 'Au-dessus de la caldeira, des milliers d’étoiles. Dans le noir, les fumerolles soufflent doucement.'],
    abriCompagnonNuit: {
      kon: ['« Les étoiles… On dirait les lanternes des dieux. »'],
      pon: ['« Une pause sous les étoiles ! Tu as un onigiri dans ton sac ? Non ? Tant pis… »'],
      chapu: ['« Tant d’étoiles ! On dirait des bulles qui brillent dans une rivière toute noire ! »'],
      gao: ['« La nuit, je veille. Dors tranquille, je garde le cratère. »'],
      fuwa: ['« Les étoiles brillent comme ma perle ! »'],
      saya: ['« Regarde mes yeux : ils brillent comme les lucioles ! »'],
    },
    // les bêtes
    grive: ['Une grive des îles d’Izu : l’akakokko ! Tête noire, ventre roux, bec jaune.', 'Elle ne vit que dans les îles d’Izu et quelques îles du sud du Japon. C’est un « monument naturel » protégé.'],
    lezard: ['Un lézard d’Okada (okada-tokage) se chauffe sur le sol tiède du volcan.', 'Les jeunes ont la queue d’un bleu vif. On ne le trouve presque que dans les îles d’Izu.', 'Doucement… Si tu cours, il file !'],
    chatRoux: ['Un chat roux dort en boule sur le sol tiède, près de la marmite du volcan.', 'Tu le caresses… Rrrrrr… Il ronronne sans même ouvrir les yeux.'],
    chatRouxNuit: ['La nuit, le chat roux est réveillé : c’est l’heure de la chasse !', 'Ses yeux brillent dans le noir. Il se laisse caresser… Rrrrrr…'],
    chatPie: ['Un chat noir et blanc, assis près du distributeur : il y fait toujours un peu chaud.', 'Tu le caresses… Rrrrrr… Il ferme les yeux de plaisir.'],
    chatPieNuit: ['Le chat noir et blanc veille près de la lumière du distributeur.', 'Ses yeux brillent dans le noir… Rrrrrr…'],
    chatCompagnon: {
      kon: ['« Un chat ! Aux sanctuaires d’Inari, il y en a souvent qui dorment au soleil. »'],
      pon: ['« Pon ! Tu crois qu’il voudra bien partager ses croquettes ? »'],
      chapu: ['« Un chat ! Il paraît qu’ils n’aiment pas l’eau… Bizarre ! »'],
      gao: ['« Un chat ! On est un peu cousins, lui et moi… mais moi, je suis un lion ! »'],
      fuwa: ['« Il a l’air tout doux… Je peux flotter au-dessus de lui ? »'],
      saya: ['« Il dort au chaud, sur la terre du volcan. Les racines aiment ça aussi. »'],
    },
    // le secret : la carte au trésor du cahier, la boîte enterrée
    cahierCarte: ['La dernière page… une carte dessinée au crayon de couleur, par des enfants !', '« あおがしま たからのちず » : la carte au trésor d’Aogashima. Une croix rouge, près d’un arbre aux fleurs rouges…'],
    carteCompagnon: {
      kon: ['« La croix est à l’est du petit volcan, près d’un arbre aux fleurs rouges et de trois cailloux… Allons voir ! »'],
      pon: ['« Un trésor ?! Pon pon ! À l’est du petit volcan… près d’un arbre rouge ! Vite ! »'],
      chapu: ['« Une chasse au trésor ! La croix… à côté du petit volcan, vers le soleil levant ! »'],
      gao: ['« Gao ! À l’est de Maruyama, un arbre à fleurs rouges, trois pierres… Je monte la garde pendant que tu creuses ! »'],
      fuwa: ['« Fuwa ! Vu du ciel, ce serait facile… À l’est du petit volcan, près des fleurs rouges ! »'],
      saya: ['« Un camélia… Je l’entends d’ici. À l’est du petit volcan. Les racines savent où est la boîte. »'],
    },
    creuserDebut: ['C’est ici : le camélia, les trois cailloux, le petit creux… comme sur la carte !', 'Tu creuses avec les mains…'],
    boiteTrouvee: ['Tes doigts touchent quelque chose de dur… Une vieille boîte en fer, toute rouillée !', 'Le couvercle grince et s’ouvre.'],
    photoClasse: ['Dedans, une photo : neuf enfants et leur maîtresse, devant l’école de l’île.', '« 1985年 夏 » : l’été 1985.'],
    lettre: ['Et une lettre, roulée dans un ruban :', '« À toi qui trouves cette boîte ! Nous sommes les élèves de l’école d’Aogashima.', 'Il y a deux cents ans, en 1785, le volcan s’est réveillé. Nos ancêtres ont dû fuir jusqu’à Hachijō.', 'Presque cinquante ans plus tard, en 1835, menés par Sasaki Jirōdayū, ils sont revenus et ont reconstruit le village. C’est le « kanjū », le retour.', 'Alors, n’oublie pas : on revient toujours chez soi.', 'Garde le koban porte-bonheur, et laisse la lettre pour le prochain voyageur ! »'],
    boiteApres: ['La vieille boîte en fer, dans son petit creux.', 'Tu y as laissé la lettre et la photo, pour le prochain voyageur.'],
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
    'panneau-sauna': ['“Geothermal sauna ふれあいサウナ”', 'No fire needed: the volcano’s steam heats the sauna.', 'Go on in: the steam room is just to the right of the entrance.', 'Next to it, the geothermal pot: people steam eggs and sweet potatoes in it.'],
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
    campeurApres: ['Enjoy the night! Not a single street lamp: just the stars.', 'When you want to see the day again, come and talk to me.'],
    campeurNon: ['Okay! The sky will still be here tonight.'],
    campeurEncore: ['Hi again! Want to watch night fall over the crater again?'],
    campeurMatin: ['Tonight I’m hoping to catch a shooting star!', 'Shall we wait for sunrise?'],
    campeurJour: ['And here comes the sun over the rim! Enjoy your walk!'],
    campeurReste: ['Okay! Keep your eyes open: shooting stars are quick.'],
    randonneuse: ['I’m walking around the little volcano.', 'At the top, you’re in a volcano… inside a volcano!'],
    enfant: ['Did you come by boat? It’s often cancelled because of the waves!', 'Otherwise there’s the helicopter, but it only has a few seats.', 'Here, everybody knows everybody!', 'At school, they say an old class hid a treasure somewhere in the crater… But nobody has ever found it!'],
    grandpere: ['In 1785, the volcano exploded. Everyone fled to Hachijō.', 'It took almost fifty years for the islanders to come back.', 'We call it “kanjū”: the return home.'],
    videaste: ['Hi! I film the most beautiful places in Japan for TikTok.', 'My account is @random_japan_place.', 'I made a video of Aogashima. Want to watch it?'],
    videasteNon: ['Okay! It’s also on the map, with all the other places.'],
    videasteApres: ['Did you like it? Follow me to see the next places!'],
    sommet: ['You’re at the top of Maruyama, the little volcano.', 'All around, the walls of the big crater: you’re in a volcano, inside a volcano!'],
    sommet2: ['The wind blows over the little volcano’s crater.'],
    otonbu: ['You’re at the very top of Aogashima: 423 m.', 'On one side, the double caldera. On the other, the ocean as far as the eye can see.', 'Far to the north, the island of Hachijō.'],
    otonbu2: ['The sea wind ripples the grass on the ridge.'],
    tunnel: ['The Seihō (青宝) tunnel: the only road into the crater.', 'On the other side: the port and the village. That’s how you came in!'],
    saunaQuestion: ['The wooden benches are bathed in the volcano’s hot steam.', 'Sit down for a while?'],
    saunaDedans: ['Phew… it’s almost 60 °C!', 'The steam rises from the grates in the floor: straight from the volcano.', 'The red hand of the twelve-minute timer goes round… You breathe slowly.'],
    saunaCompagnon: {
      kon: ['Hot… hot… hot! My fur is soaked!'],
      pon: ['Pon… I’m melting like a grilled mochi… Volcano eggs after this?'],
      chapu: ['Chapu! It’s like a river… but in the air! Again, again!'],
      gao: ['Gao… It’s warm on my island too, but this is a sweet-potato oven!'],
      fuwa: ['Fuwa… A sea dragon isn’t afraid of steam! (But my whiskers are curling.)'],
      saya: ['My leaves… are curling up… Trees aren’t made for saunas!'],
    },
    abri: ['The wind blows over the rim…', 'From here, the whole crater: the jungle below, the steam of the vents, little Maruyama… and the ocean all around.'],
    abriCompagnon: {
      kon: ['“It feels like sitting on the rim of a giant’s bowl… The gods must love this place.”'],
      pon: ['“A well-earned break! Got an onigiri in your bag? No? Oh well…”'],
      chapu: ['“Look at the sea, so blue! I’d love a dive… but it’s a long way down.”'],
      gao: ['“From here, I could guard the whole island. The best guard post ever!”'],
      fuwa: ['“All that sea… My grandfather the dragon must be sleeping somewhere down there.”'],
      saya: ['“The wind is singing in the grass… The old trees of the cliff say hello.”'],
    },
    cahier: ['A notebook on the table: “思い出ノート”, the memory book. Travellers leave a few words in it.', '“The boat couldn’t dock three days in a row. I came by helicopter: nine seats, twenty minutes!”', '“Saw the Milky Way from the campsite. I’ll be back.”', '“The eggs from the volcano pot are the best in the world. — a boy from Tokyo, age 8”'],
    jumelles: ['Coin-operated binoculars: 100 yen. You slip in a coin… click!'],
    jumellesVue: ['To the north, on the horizon: Hachijō-jima and its two volcanoes, almost 70 km of sea away.', 'The boat between the two islands only sails when the sea is calm: it often stays in port.'],
    stele: ['“外輪山” (gairinzan): the rim of the great crater.', 'In 1785 an eruption drove the islanders away: they took refuge on Hachijō.', 'It took them fifty years to come back and live here, in 1835: they call it the “kanjū”, the return home.'],
    lis: ['Sakuyuri: the big white lilies of the Izu islands. They grow nowhere else.', 'Their scent is so strong you can smell it from afar, carried by the wind.'],
    saunaFin: ['You come out feeling light, your skin all soft.', 'No wood, no gas here: the volcano heats the sauna.'],
    distributeur: ['A vending machine, even at the bottom of a crater!', 'You pick an ice-cold green tea… Clunk! The bottle drops.', 'In Japan they are almost everywhere: more than four million of them!'],
    gardienneNuit: ['It’s late! The sauna is closed, it opens again tomorrow.', 'Eggs from the pot will have to wait until tomorrow morning. Sleep well!'],
    saunaNuit: ['The steam room is closed for the night.', 'But the volcano’s steam keeps rising through the grates…'],
    gardeNuit: ['At night, the steam vents glow under the moon.', 'Stay well behind the rope: in the dark, it’s hard to see where the steam is!'],
    randonneuseNuit: ['I’m heading back to the campsite with my headlamp.', 'Above the little volcano, the sky is full of stars!'],
    enfantNuit: ['It’s dark! I have to go back to the village.', 'Can you hear the insects? They’re singing all over the jungle.'],
    grandpereNuit: ['At night on Aogashima, there are only the stars and the wind.', 'No street lamps, no noise… I wouldn’t trade it for anything.'],
    distributeurNuit: ['Even at night, the vending machine is lit: in Japan they work day and night!', 'This time you pick a hot tea… Clunk!'],
    jumellesNuit: ['You slip in a coin… It’s too dark: you can’t see Hachijō-jima any more.', 'Come back by day to see it!'],
    abriNuit: ['Night has fallen on the crater rim…', 'Above the caldera, thousands of stars. In the dark, the steam vents breathe softly.'],
    abriCompagnonNuit: {
      kon: ['“The stars… They look like the gods’ lanterns.”'],
      pon: ['“A break under the stars! Got an onigiri in your bag? No? Oh well…”'],
      chapu: ['“So many stars! Like shiny bubbles in a pitch-black river!”'],
      gao: ['“At night, I keep watch. Sleep well, I’m guarding the crater.”'],
      fuwa: ['“The stars shine like my pearl!”'],
      saya: ['“Look at my eyes: they glow like fireflies!”'],
    },
    grive: ['An Izu thrush: the akakokko! Black head, rusty belly, yellow bill.', 'It only lives on the Izu Islands and a few islands in southern Japan. It is a protected “natural monument”.'],
    lezard: ['An Okada’s skink (okada-tokage) is warming itself on the volcano’s warm ground.', 'The young ones have bright blue tails. It lives almost only on the Izu Islands.', 'Gently… If you run, it dashes off!'],
    chatRoux: ['A ginger cat is curled up asleep on the warm ground, next to the volcano’s pot.', 'You stroke it… Purrrr… It purrs without even opening its eyes.'],
    chatRouxNuit: ['At night, the ginger cat is wide awake: it’s hunting time!', 'Its eyes shine in the dark. It lets you stroke it… Purrrr…'],
    chatPie: ['A black-and-white cat sits by the vending machine: it’s always a little warm there.', 'You stroke it… Purrrr… It closes its eyes with delight.'],
    chatPieNuit: ['The black-and-white cat keeps watch by the vending machine’s light.', 'Its eyes shine in the dark… Purrrr…'],
    chatCompagnon: {
      kon: ['“A cat! At Inari shrines, there are often some napping in the sun.”'],
      pon: ['“Pon! Do you think it would share its cat food?”'],
      chapu: ['“A cat! They say cats don’t like water… Weird!”'],
      gao: ['“A cat! We’re sort of cousins, him and me… but I’m a lion!”'],
      fuwa: ['“He looks so soft… Can I float above him?”'],
      saya: ['“He sleeps in the warmth of the volcano. Roots like that too.”'],
    },
    cahierCarte: ['The last page… a map drawn with coloured pencils, by children!', '“あおがしま たからのちず”: the treasure map of Aogashima. A red cross, near a tree with red flowers…'],
    carteCompagnon: {
      kon: ['“The cross is east of the little volcano, near a tree with red flowers and three pebbles… Let’s go and see!”'],
      pon: ['“A treasure?! Pon pon! East of the little volcano… near a red tree! Hurry!”'],
      chapu: ['“A treasure hunt! The cross… next to the little volcano, towards the sunrise!”'],
      gao: ['“Gao! East of Maruyama, a tree with red flowers, three stones… I’ll stand guard while you dig!”'],
      fuwa: ['“Fuwa! From the sky it would be easy… East of the little volcano, near the red flowers!”'],
      saya: ['“A camellia… I can hear it from here. East of the little volcano. The roots know where the box is.”'],
    },
    creuserDebut: ['This is it: the camellia, the three pebbles, the little hollow… just like on the map!', 'You dig with your hands…'],
    boiteTrouvee: ['Your fingers touch something hard… An old tin box, all rusty!', 'The lid creaks open.'],
    photoClasse: ['Inside, a photo: nine children and their teacher, in front of the island school.', '“1985年 夏”: summer 1985.'],
    lettre: ['And a letter, rolled up in a ribbon:', '“To you who found this box! We are the pupils of Aogashima school.', 'Two hundred years ago, in 1785, the volcano woke up. Our ancestors had to flee all the way to Hachijō.', 'Almost fifty years later, in 1835, led by Sasaki Jirōdayū, they came back and rebuilt the village. It is called the “kanjū”, the return.', 'So don’t forget: you always come back home.', 'Keep the lucky koban, and leave the letter for the next traveller!”'],
    boiteApres: ['The old tin box, in its little hollow.', 'You left the letter and the photo in it, for the next traveller.'],
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
    'panneau-sauna': ['「ふれあいサウナ」', '火は つかわない。火山の 蒸気で あたためる サウナ。', '中に 入れるよ。蒸気の へやは 入口の すぐ 右。', 'となりの 地熱釜で、たまごや さつまいもを ふかせるよ。'],
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
    campeurApres: ['夜を たのしんで！ 街灯 ひとつ ない。星だけ だよ。', '朝に もどりたく なったら、また はなしかけてね。'],
    campeurNon: ['オッケー！ 星空は 今夜も ここに あるよ。'],
    campeurEncore: ['また きたね！ カルデラに 夜が おりるのを もう一度 見る？'],
    campeurMatin: ['今夜は 流れ星を 見つけたいな！', '日の出まで まとうか？'],
    campeurJour: ['ほら、外輪山から お日さまが のぼってきた！ いい さんぽを！'],
    campeurReste: ['オッケー！ よく 見ててね。流れ星は 一瞬だよ。'],
    randonneuse: ['丸山の まわりを 歩いているの。', 'てっぺんに 立つと、火山の 中の 火山に いるって わかるよ！'],
    enfant: ['船で 来たの？ 波が 高いと すぐ 欠航するんだよ！', 'ヘリコプターも あるけど、席が すこししか ないんだ。', 'この 島では みんな 知り合いだよ！', '学校の うわさ なんだけど、むかしの クラスが 火口の どこかに たからものを うめたんだって……まだ だれも 見つけて ないよ！'],
    grandpere: ['1785年、火山が 大噴火して、島の 人は 八丈島へ にげたんじゃ。', 'みんなが もどって こられたのは、50年 ちかく あとの こと。', 'それを 「還住」と いうんじゃよ。'],
    videaste: ['やあ！ 日本の すてきな 場所を TikTokで しょうかい しているんだ。', 'アカウントは @random_japan_place。', '青ヶ島の 動画も あるよ。見てみる？'],
    videasteNon: ['オッケー！ 地図にも ほかの 場所と いっしょに のっているよ。'],
    videasteApres: ['気に入った？ フォローして 次の 場所も 見てね！'],
    sommet: ['丸山の てっぺんに ついた。', 'まわりは 大きな カルデラの かべ。火山の 中の 火山に いるんだ！'],
    sommet2: ['丸山の 火口に 風が ふいている。'],
    otonbu: ['青ヶ島で いちばん 高い ところ、423メートル！', 'かたほうには 二重の カルデラ、もう かたほうには はてしない 海。', '北の ほうに 八丈島が 見える。'],
    otonbu2: ['海からの 風が 尾根の 草を ゆらしている。'],
    tunnel: ['青宝トンネル。カルデラの 中に 入る ただ 一本の 道。', 'むこうには 港と 村。きみも ここを 通って きたんだね！'],
    saunaQuestion: ['木の だんだんの いすが、火山の 熱い 湯気に つつまれている。', 'すこし すわって みる？'],
    saunaDedans: ['ふう……60度 ちかく ある！', '床の あみから 湯気が のぼる。火山から そのまま きているんだ。', '12分計の 赤い 針が まわる……ゆっくり いきを する。'],
    saunaCompagnon: {
      kon: ['あつい……あつい……あつーい！ 毛が びしょびしょ だよ！'],
      pon: ['ポン……やいた おもちみたいに とけちゃう……あとで 地熱釜の たまご たべよ？'],
      chapu: ['チャプ！ 空の 中の 川みたい！ もっと もっと！'],
      gao: ['ガオ……ぼくの 島も あついけど、ここは さつまいもを やく かまどだ！'],
      fuwa: ['フワ……海の りゅうは 湯気なんて こわくない！（でも ひげが くるくるに なっちゃう。）'],
      saya: ['葉っぱが……ちぢんで いく……木は サウナに むいてないよ！'],
    },
    abri: ['外輪山を 風が ふきぬける……', 'ここから カルデラが ぜんぶ 見える。底の ジャングル、ひんぎゃの 湯気、小さな 丸山……そして まわりは 一面の 海。'],
    abriCompagnon: {
      kon: ['「巨人の おわんの ふちに すわってる みたい……神さまも きっと この けしきが すきだね。」'],
      pon: ['「ひとやすみ ひとやすみ！ リュックに おにぎり ない？ ない？ ざんねん……」'],
      chapu: ['「海が まっさお！ とびこみたいな……でも 下まで ちょっと 遠すぎる かも。」'],
      gao: ['「ここからなら 島ぜんぶを 守れる。さいこうの 見はり台だ！」'],
      fuwa: ['「この 海の どこかで、りゅうの おじいちゃんが ねむって いるんだ。」'],
      saya: ['「風が 草の 中で うたってる……がけの 古い 木たちが こんにちは って。」'],
    },
    cahier: ['テーブルの 上に ノート。「思い出ノート」……旅人が ひとこと 書いていく。', '「船が 3日も つけなかった。ヘリで 来ました。9人のり、20分！」', '「キャンプ場から 天の川が 見えた。また 来ます。」', '「地熱釜の たまごは 世界一 おいしい。—— 東京の 8さいの 男の子」'],
    jumelles: ['100円の 望遠鏡。コインを 入れて……カチッ！'],
    jumellesVue: ['北の 水平線に 八丈島。ふたつの 火山が 見える。海を こえて 70キロ くらい。', 'ふたつの 島を むすぶ 船は、海が おだやかな 日しか 出ない。港に とまった ままの 日も 多いんだ。'],
    stele: ['「外輪山」……大きな カルデラの ふち。', '1785年、噴火で 島の 人たちは 八丈島へ にげた。', 'みんなが 島に もどれたのは 50年後の 1835年。これを「還住（かんじゅう）」と いうんだ。'],
    lis: ['サクユリ。伊豆諸島に しか さかない 大きな 白い ユリ。', 'かおりが つよくて、風に のって 遠くまで とどくんだ。'],
    saunaFin: ['外に でると、からだが かるい。はだも すべすべ。', 'ここでは 木も ガスも つかわない。火山が サウナを あたためて いるんだ。'],
    distributeur: ['カルデラの 底にも 自動販売機！', 'つめたい 緑茶を えらぶ……ガコン！ ボトルが おちてきた。', '日本には 400万台 いじょうも あるんだって！'],
    gardienneNuit: ['もう おそいよ！ サウナは しまっているから、また あしたね。', '地熱釜の たまごも あしたの 朝。おやすみ！'],
    saunaNuit: ['夜は スチームルームは おしまい。', 'でも 火山の 湯気は いまも 床から のぼっている……'],
    gardeNuit: ['夜の ひんぎゃは 月の 光で ひかって 見える。', 'ロープの うしろに いてね。くらいと 湯気が 見えにくいから！'],
    randonneuseNuit: ['ヘッドライトを つけて キャンプ場に もどるところ。', '丸山の 上は 星で いっぱい！'],
    enfantNuit: ['もう 夜だ！ 村に かえらなきゃ。', '虫の こえ きこえる？ ジャングルじゅうで ないてるよ。'],
    grandpereNuit: ['青ヶ島の 夜は、星と 風だけじゃ。', '街灯も 音も ない……これが いちばんじゃよ。'],
    distributeurNuit: ['夜でも 自動販売機は ついている。日本の 自販機は 一日じゅう うごいているんだ！', '今度は あたたかい お茶に した……ガコン！'],
    jumellesNuit: ['コインを 入れた……くらくて 八丈島は もう 見えない。', '昼に また 見に きてね！'],
    abriNuit: ['外輪山に 夜が おりてきた……', 'カルデラの 上には 何千もの 星。くらやみの 中で、ひんぎゃが しずかに 息を している。'],
    abriCompagnonNuit: {
      kon: ['「星が……神さまの ちょうちんみたいだね。」'],
      pon: ['「星空の 下で ひとやすみ！ おにぎり もってない？ ない？ ざんねん……」'],
      chapu: ['「星が いっぱい！ まっくらな 川で ひかる あわ みたい！」'],
      gao: ['「夜は ぼくが 見はるよ。安心して ねてね、火口は 守るから。」'],
      fuwa: ['「星が ぼくの しんじゅ みたいに ひかってる！」'],
      saya: ['「ぼくの 目を 見て。ホタルみたいに ひかってるでしょ！」'],
    },
    grive: ['アカコッコだ！ 頭は 黒、おなかは 赤茶色、くちばしは 黄色。', '伊豆諸島と 南の 島に しか いない 鳥。国の 天然記念物 なんだ。'],
    lezard: ['オカダトカゲが 火山の あたたかい 地面で ひなたぼっこ。', '子どもの しっぽは あざやかな 青。ほとんど 伊豆諸島 だけに すんでいる。', 'そーっと……走ったら にげちゃうよ！'],
    chatRoux: ['茶トラの ねこが 地熱釜の そばの あたたかい 地面で まるくなって ねている。', 'なでると……ゴロゴロ……目も あけずに のどを ならした。'],
    chatRouxNuit: ['夜の 茶トラは ぱっちり おきている。かりの 時間だ！', '目が くらやみで ひかっている。なでると……ゴロゴロ……'],
    chatPie: ['白黒の ねこが 自動販売機の そばに すわっている。そこは いつも ちょっと あたたかいんだ。', 'なでると……ゴロゴロ……気持ちよさそうに 目を とじた。'],
    chatPieNuit: ['白黒の ねこは 自販機の あかりの そばで 見はりを している。', '目が くらやみで ひかっている……ゴロゴロ……'],
    chatCompagnon: {
      kon: ['「ねこだ！ お稲荷さんでも よく 日なたで ねているよ。」'],
      pon: ['「ポン！ ねこの ごはん、わけて くれるかな？」'],
      chapu: ['「ねこだ！ ねこは 水が きらいなんだって……ふしぎ！」'],
      gao: ['「ねこだ！ ぼくたち ちょっと いとこ なんだ……でも ぼくは ライオン！」'],
      fuwa: ['「ふわふわ だね……上に ういても いい？」'],
      saya: ['「火山の あたたかい 土の 上で ねてる。根っこも それが すきなんだ。」'],
    },
    cahierCarte: ['さいごの ページ……子どもが 色えんぴつで かいた 地図だ！', '「あおがしま たからのちず」。赤い 花の 木の そばに、赤い バツじるし……'],
    carteCompagnon: {
      kon: ['「バツは 丸山の 東がわ。赤い 花の 木と 三つの 小石の そば……行って みよう！」'],
      pon: ['「おたから!? ポンポン！ 丸山の 東……赤い 木の そば！ いそげ！」'],
      chapu: ['「たからさがし！ バツは……丸山の となり、お日さまが のぼる ほう！」'],
      gao: ['「ガオ！ 丸山の 東、赤い 花の 木、三つの 石……ほる あいだ ぼくが 見はるよ！」'],
      fuwa: ['「フワ！ 空から なら かんたんなのに……丸山の 東、赤い 花の そば！」'],
      saya: ['「ツバキだ……ここまで 声が きこえる。丸山の 東。根っこが はこの ありかを しってる。」'],
    },
    creuserDebut: ['ここだ。ツバキ、三つの 小石、小さな くぼみ……地図と おなじ！', '手で ほって みた……'],
    boiteTrouvee: ['ゆびに なにか かたい ものが……さびた 古い ブリキの はこだ！', 'ふたが ギィッと ひらいた。'],
    photoClasse: ['中には 写真。島の 学校の まえで、9人の 子どもと 先生。', '「1985年 夏」。'],
    lettre: ['それと、リボンで まいた 手紙：', '「この はこを みつけた ひとへ！ ぼくたちは 青ヶ島小学校の 生徒です。', '二百年まえの 1785年、火山が 目を さましました。ご先祖さまは 八丈島まで にげました。', 'それから 五十年 ちかく たった 1835年、佐々木次郎太夫に みちびかれて 島に もどり、村を つくりなおしました。これを「還住（かんじゅう）」と いいます。', 'だから わすれないで。人は いつか ふるさとに かえるんだ。', 'しあわせの 小判は あなたに。手紙は つぎの 旅人の ために のこしてね！」'],
    boiteApres: ['小さな くぼみの 中の、古い ブリキの はこ。', '手紙と 写真は つぎの 旅人の ために のこした。'],
  },
};
