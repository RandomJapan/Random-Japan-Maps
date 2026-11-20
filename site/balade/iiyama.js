// ================================================================
//  La fête de la neige d'Iiyama (いいやま雪まつり), à Iiyama, tout au nord de la préfecture de Nagano : une des villes les plus
//  enneigées du Japon (2026-11-20 : le quatorzième lieu de la balade ; le propriétaire : « Ok maintenant tu peux commencer à faire
//  Iiyama Snow Festival en Balade »). Chaque année, le deuxième week-end de février, plus de cent sculptures de neige sortent dans
//  toute la ville, toutes faites par les habitants (« 高さ3メートル、横幅20メートルを超える大きな雪像から路上に並ぶ小さな雪像まで、
//  およそ100体以上 […] すべて市民によって作られています », l'office du tourisme) : en février 1983, les jeunes de la chambre de commerce
//  ont voulu faire de la neige, ce fardeau, une richesse. Le lieu a deux parties, à huit kilomètres l'une de l'autre dans le vrai, et
//  une navette entre les deux :
//  — le parc des ruines du château (飯山城址公園, la grande place de la fête) : les tentes de la place du bas (弓道場下駐車場), la porte
//    rebâtie du château, les grandes sculptures et la scène, le coin des enfants (遊雪エリア), le haut du château (本丸, le sanctuaire
//    葵神社) et la descente en bouée (スノースライダー, sur la pente nord) ; le château est celui qu'Uesugi Kenshin a bâti en 1564 ;
//  — le village des kamakura (かまくらの里, à 信濃平) : une vingtaine de huttes de neige bâties par les gens du coin (かまくら応援隊), où
//    l'on mange la marmite のろし鍋 ; son petit sanctuaire dans la neige (かまくら神社) ; la forêt de cèdres et le mont Kuroiwa derrière.
//  Son secret : les feux de Kenshin (choisi par le propriétaire parmi quatre). La marmite doit son nom aux feux d'alerte (のろし) : le camp
//  de Kenshin en avait un poste sur le mont Kuroiwa. La nuit, le grand tengu de Narazawa (奈良澤大天狗) danse avec sa torche ; on lui prend
//  une flamme, on rallume le grand feu du haut du château, et les montagnes répondent, feu après feu (la chaîne de feux est inventée pour
//  le jeu ; le poste du mont Kuroiwa, le château de Kenshin et la danse du tengu sont vrais). Sa récompense : le masque du grand tengu.
//  Les distances sont resserrées ; le village des kamakura est posé au nord, derrière une crête boisée, comme dans le vrai.
//  Repère : x vers l'est, z vers le sud, y vers le haut, en mètres. Pas un escalier : des chemins de neige en pente.
//  ctx : { THREE, atelier, P (palette), peinture, perso, maillage }.
// ================================================================
import { creerMonde, interactionsBancs, lisse, hasard, bruitDoux, ASSIS } from './monde.js';
import { MATIERES as M } from './textures.js';
import { secretTrouve } from './tresors.js';
import { aLeTampon } from './carnet.js';
import { creerPersonnage } from './personnages.js';

const PI = Math.PI;
const melange = (a, b, t) => a + (b - a) * t;
/** Le plus haut des deux, en douceur sur k mètres (pas d'arête où deux buttes se rejoignent). */
const smax = (a, b, k) => { const e = Math.max(k - Math.abs(a - b), 0) / k; return Math.max(a, b) + (e * e * k) / 4; };
/** La distance au bord d'un rectangle aux coins ronds (négative dedans) : centre (cx, cz), demi-côtés hx, hz, rayon des coins r. */
const dBoite = (x, z, cx, cz, hx, hz, r = 0) => {
  const qx = Math.abs(x - cx) - (hx - r), qz = Math.abs(z - cz) - (hz - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - r;
};

// ---------------------------------------------------------------- Le plan
// Les hauteurs de la neige tassée, là où l'on marche : la rue et la place du bas, la grande terrasse, le coin des enfants, le haut du château ;
// le village des kamakura, sur son plateau.
const Y0 = 0, Y1 = 4, Y2 = 2, Y3 = 9, YB = 14;
// la crête boisée entre les deux parties : au sud d'elle, le château (A) ; au nord, le village des kamakura (B)
const Z_CRETE = -232;
const ZONE_A = { x0: -100, x1: 90, z0: -176, z1: 72 };
const ZONE_B = { x0: -76, x1: 76, z0: -452, z1: -276 };
const dansZone = (Z, x, z) => x >= Z.x0 && x <= Z.x1 && z >= Z.z0 && z <= Z.z1;

// ---- la partie A : le parc du château
const RUE = { x0: -30, x1: 30, z0: 46, z1: 53 };
// (les façades des maisons de la rue, au sud ; leur arcade : 2,4 m devant)
const Z_FACADES = 61.2;
const PLACE = { x0: -26, x1: 26, z0: 18, z1: 46.5 };
const TERRASSE = { x0: -40, x1: 40, z0: -56, z1: -11 };
const ENFANTS = { x0: -74, x1: -52, z0: -42, z1: -12 };
const HONMARU = { x: 12, z: -88, rx: 19, rz: 11 };
const DEPART = { x: 0, z: 47.2 };
// la descente en bouée : du bord nord du haut du château jusqu'au replat du bas (on n'y marche pas : on y glisse)
const PISTE = [[2.5, -98.6, Y3], [1.5, -106, 8.1], [-4.5, -116, 6.3], [2.5, -127, 4.4], [9, -138, 2.6], [2.5, -149, 1.1], [-1, -158, 0.3], [-1, -168, 0.2]];

// ---- la partie B : le village des kamakura
const PARKING_B = { x0: -16, x1: 16, z0: -297, z1: -285 };
const ARCHE = { x: 0, z: -312 };
const ALLEE_B = { z0: -297, z1: -373.5, d: 3.1 };
const TRAVERSES_B = [-326, -340, -354];
const SANCTUAIRE = { x: 0, z: -381.2, r: 2.75, R: 3.9, porte: 0.95 };
/** Les kamakura : au nord de chaque traverse, la porte au sud (à l'abri du vent qui descend de la montagne, comme les vrais). r : dedans ; R : dehors. */
const KAMAKURA = [];
for (const [k, zt] of TRAVERSES_B.entries()) {
  for (const [i, x] of [-26.5, -18, -9.5, 9.5, 18, 26.5].entries()) {
    const g = hasard(x * 0.37, zt * 0.11), R = 2.45 + 0.35 * g;
    KAMAKURA.push({ id: `k${k}${i}`, x: x + (g - 0.5) * 0.8, z: zt - 1.75 - R - 0.5, R, r: R - 0.62, h: 2.55 + 0.4 * hasard(zt, x), zt, ry: (hasard(x, zt) - 0.5) * 0.3 });
  }
}

// ---- où l'on marche : des formes, à leur hauteur ; r : le rayon des coins ; d : la demi-largeur d'un chemin (une ligne brisée [x, z, y])
const rect = (R, y, r = 2) => ({ s: 'rect', cx: (R.x0 + R.x1) / 2, cz: (R.z0 + R.z1) / 2, hx: (R.x1 - R.x0) / 2, hz: (R.z1 - R.z0) / 2, r, y });
const FORMES_A = [
  rect(RUE, Y0, 0.6),
  rect(PLACE, Y0, 3),
  // la montée vers la porte du château
  { s: 'ligne', p: [[0, 19, Y0], [0, 16, Y0], [0, -9.5, Y1], [0, -12, Y1]], d: 2.6 },
  rect(TERRASSE, Y1, 6),
  // la descente vers le coin des enfants
  { s: 'ligne', p: [[-38, -26, Y1], [-40.5, -26, Y1], [-52, -26.6, Y2], [-54, -26.6, Y2]], d: 2.2 },
  rect(ENFANTS, Y2, 4),
  // la montée vers le haut du château, et le coin de Bunbuku à son tournant
  { s: 'ligne', p: [[30, -53, Y1], [30.5, -56.5, Y1], [39.5, -68.5, 6.6], [31.5, -81.5, Y3], [28, -84, Y3]], d: 2.0 },
  { s: 'ligne', p: [[39.5, -68.5, 6.6], [45.4, -70.4, 6.7]], d: 2.5 },
  { s: 'disque', x: 45.4, z: -70.4, rx: 3.7, rz: 3.3, y: 6.7 },
  { s: 'disque', x: HONMARU.x, z: HONMARU.z, rx: HONMARU.rx, rz: HONMARU.rz, y: Y3 },
];
const FORMES_B = [
  rect(PARKING_B, YB, 1.5),
  { s: 'ligne', p: [[0, ALLEE_B.z0 + 1, YB], [0, ALLEE_B.z1, YB]], d: ALLEE_B.d },
  ...TRAVERSES_B.map((z) => ({ s: 'ligne', p: [[-31.5, z, YB], [31.5, z, YB]], d: 1.75 })),
  // (devant chaque kamakura, un bout de chemin de la traverse à sa porte)
  ...KAMAKURA.map((K) => ({ s: 'ligne', p: [[K.x, K.zt, YB], [K.x, K.z + K.R - 0.35, YB]], d: 0.95 })),
  // le parvis du sanctuaire, sa porte, son dedans
  { s: 'disque', x: 0, z: ALLEE_B.z1 - 0.6, rx: 4.6, rz: 3.2, y: YB },
  { s: 'ligne', p: [[0, ALLEE_B.z1, YB], [0, SANCTUAIRE.z + 0.4, YB]], d: SANCTUAIRE.porte },
  { s: 'disque', x: SANCTUAIRE.x, z: SANCTUAIRE.z, rx: SANCTUAIRE.r - 0.3, rz: SANCTUAIRE.r - 0.3, y: YB },
  // devant la cuisine du restaurant ; le pied de la butte des luges
  rect({ x0: -31, x1: -3, z0: -310.5, z1: -303 }, YB, 1.5),
  rect({ x0: 3, x1: 30, z0: -310.5, z1: -303 }, YB, 1.5),
];
// ce qu'on a déneigé sans qu'on y marche (la route au-delà des barrières, la piste de la bouée) : pas de congère dessus, mais on n'y va pas
const DEGAGE_A = [
  // (la chaussée, d'un bout de la rue à l'autre ; le trottoir sous les arcades, derrière le mur de neige rejetée)
  rect({ x0: -97, x1: 85, z0: 46, z1: 53 }, Y0, 0.4),
  rect({ x0: -97, x1: 85, z0: Z_FACADES - 2.2, z1: Z_FACADES + 0.3 }, Y0, 0.3),
  { s: 'ligne', p: PISTE, d: 1.9 },
  { s: 'disque', x: -1, z: -166.5, rx: 7, rz: 5.5, y: 0.2 },
];
const DEGAGE_B = [
  rect({ x0: -16, x1: 150, z0: -292, z1: -286 }, YB, 0.4),
  // (le dedans de chaque kamakura : sans cela la neige du champ, épaisse d'un mètre, le remplissait — la table, les coussins et ceux qui y
  // mangent étaient dessous, et pendant le repas on ne voyait du voyageur que le haut de sa casquette)
  ...KAMAKURA.map((K) => ({ s: 'disque', x: K.x, z: K.z, rx: K.r + 0.3, rz: K.r + 0.3, y: YB })),
];

/** La distance au bord de la forme f (négative dedans), et la hauteur de son sol au point le plus proche. */
function versForme(f, x, z) {
  if (f.s === 'rect') return [dBoite(x, z, f.cx, f.cz, f.hx, f.hz, f.r), f.y];
  if (f.s === 'disque') { const k = Math.hypot((x - f.x) / f.rx, (z - f.z) / f.rz); return [(k - 1) * Math.min(f.rx, f.rz), f.y]; }
  let d = Infinity, y = 0;
  for (let i = 0; i + 1 < f.p.length; i++) {
    const [ax, az, ay] = f.p[i], [bx, bz, by] = f.p[i + 1], ux = bx - ax, uz = bz - az;
    const t = Math.min(1, Math.max(0, ((x - ax) * ux + (z - az) * uz) / (ux * ux + uz * uz || 1)));
    const e = Math.hypot(x - ax - t * ux, z - az - t * uz);
    if (e < d) { d = e; y = ay + (by - ay) * t; }
  }
  return [d - f.d, y];
}
const formesEn = (z) => (z > Z_CRETE ? FORMES_A : FORMES_B);
/** La distance au bord de là où l'on marche (négative : on peut y être). */
function dMarche(x, z) {
  let d = Infinity;
  for (const f of formesEn(z)) { const e = versForme(f, x, z)[0]; if (e < d) d = e; }
  return d;
}
const dansLeCadre = (x, z) => dMarche(x, z) < 0;

// ---------------------------------------------------------------- Le relief sous la neige
/** Une butte au sommet plat : h au-dessus d'un rectangle aux coins ronds, qui retombe à zéro sur « chute » mètres. */
const butte = (x, z, cx, cz, hx, hz, r, h, chute) => h * (1 - lisse(0, chute, dBoite(x, z, cx, cz, hx, hz, r)));
/** Le long de la descente en bouée : son x et sa hauteur à ce z (entre ses bouts). */
function surPiste(z) {
  const P = PISTE;
  if (z >= P[0][1]) return [P[0][0], P[0][2]];
  for (let i = 0; i + 1 < P.length; i++) {
    if (z >= P[i + 1][1]) { const t = (P[i][1] - z) / (P[i][1] - P[i + 1][1]), u = t * t * (3 - 2 * t); return [melange(P[i][0], P[i + 1][0], u), melange(P[i][2], P[i + 1][2], t)]; }
  }
  return [P[P.length - 1][0], P[P.length - 1][2]];
}
/** Les montagnes, loin : la chaîne de l'ouest (関田山脈), le mont Kuroiwa au nord-ouest du village, les hauteurs de l'est, au-delà de la rivière. */
const KUROIWA = { x: -430, z: -960, h: 400 };
function montagnes(x, z) {
  const ondes = 0.72 + 0.28 * Math.sin(z * 0.0043 + 0.8) * Math.cos(x * 0.0031 - 0.4) + 0.2 * (bruitDoux(x, z, 210) - 0.5);
  const ouest = 560 * lisse(-150, -1150, x) ** 1.25 * ondes;
  const est = 430 * lisse(520, 1300, x) ** 1.3 * (0.8 + 0.3 * Math.sin(z * 0.0037 + 2.1));
  const dk = Math.hypot(x - KUROIWA.x, (z - KUROIWA.z) * 0.8);
  const kuroiwa = KUROIWA.h * Math.exp(-((dk / 330) ** 2)) + 150 * Math.exp(-(((x + 120) / 240) ** 2 + ((z + 760) / 200) ** 2));
  const nord = 300 * lisse(-900, -1500, z) * (0.7 + 0.3 * Math.sin(x * 0.005));
  const sud = 120 * lisse(500, 1100, z) * (0.6 + 0.4 * Math.sin(x * 0.006 + 1.2)) * lisse(-200, -700, x - 300);
  return Math.max(ouest, kuroiwa) + est + nord + sud + 22 * (bruitDoux(x, z, 90) - 0.5) * lisse(60, 400, ouest + est + kuroiwa + nord);
}
/** Le sol tel qu'il serait sans rien de déneigé : la plaine de la ville, la butte du château, la crête, le plateau du village, les montagnes. */
function relief(x, z) {
  let h = 0;
  if (z > Z_CRETE - 60) {
    // la butte du château : la grande terrasse, le coin des enfants, le haut du château et son éperon nord (la pente de la bouée)
    h = butte(x, z, 0, -33, 50, 28, 18, Y1, 17);
    h = smax(h, butte(x, z, -63, -27, 13, 17, 8, Y2, 9), 4);
    h = smax(h, butte(x, z, HONMARU.x, HONMARU.z, 21, 13, 12, Y3, 20), 5);
    if (z < -92) { const [xp, yp] = surPiste(z); h = smax(h, yp * (1 - lisse(7, 30, Math.abs(x - xp))), 3); }
    // vers la rivière, à l'est, la plaine descend un peu ; le lit, plus bas
    h -= 3.2 * lisse(84, 135, x);
  }
  // la crête boisée, puis le plateau du village, qui monte vers la forêt à l'ouest et au nord ; la butte des luges, à l'est
  const crete = 30 * lisse(-176, -214, z) * (1 - lisse(-246, -276, z)) * (0.85 + 0.15 * Math.sin(x * 0.021 + 1)) * (1 - 0.55 * lisse(110, 260, x));
  const plateau = YB * lisse(-236, -272, z) * (1 - 0.8 * lisse(120, 300, x));
  h += crete + plateau;
  if (z < -270) {
    h += 34 * lisse(52, 150, -x) ** 1.4 + 26 * lisse(-392, -470, z) ** 1.3;
    h = smax(h, YB + butte(x, z, 52, -338, 5, 7, 5, 3.6, 13), 3);
  }
  // (les montagnes ne commencent qu'au-delà du lieu : dedans, le pied du mont Kuroiwa relevait le village de cinq à quinze mètres, et ses
  // chemins se creusaient en tranchées)
  return h + montagnes(x, z) * lisse(0, 210, dBoite(x, z, -4, -192, 100, 264));
}
/** L'épaisseur de la neige là où personne n'a déneigé. */
const epaisseur = (x, z) => 0.95 + 0.34 * bruitDoux(x + 40, z - 15, 11);
/** La congère au bord d'un chemin : sa part de l'épaisseur, à d mètres du bord (un talus raide, arrondi en haut). */
const talus = (d) => { const t = Math.min(1, Math.max(0, (d - 0.25) / 0.72)); return 1 - (1 - t) ** 2.3; };

// les deux parties, en tables au demi-mètre : la hauteur du sol, et la distance au bord de là où l'on marche (ou de ce qui est déneigé)
const PAS_T = 0.5;
function tableDe(Z, formes, degage) {
  const nx = Math.round((Z.x1 - Z.x0) / PAS_T) + 1, nz = Math.round((Z.z1 - Z.z0) / PAS_T) + 1;
  const H = new Float32Array(nx * nz), D = new Float32Array(nx * nz), toutes = [...formes, ...degage];
  for (let j = 0, k = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++, k++) {
      const x = Z.x0 + i * PAS_T, z = Z.z0 + j * PAS_T, nat = relief(x, z);
      // le sol déneigé, tout près de chaque forme : sa hauteur ; plus loin, le relief reprend, en douceur
      let dm = Infinity, dn = Infinity, somme = 0, poids = 0;
      for (const f of toutes) {
        const [d, y] = versForme(f, x, z);
        if (d < dn) dn = d;
        if (d < 7) { const p = 1 - lisse(1.3, 7, d); somme += p * (y - nat); poids += p; }
      }
      for (const f of formes) { const d = versForme(f, x, z)[0]; if (d < dm) dm = d; }
      const base = nat + (poids > 0 ? somme / Math.max(1, poids) : 0);
      H[k] = base + epaisseur(x, z) * talus(dn);
      D[k] = Math.min(dm, 30);
    }
  }
  return { Z, nx, nz, H, D };
}
let TA = null, TB = null;
const preparer = () => { TA = tableDe(ZONE_A, FORMES_A, DEGAGE_A); TB = tableDe(ZONE_B, FORMES_B, DEGAGE_B); };
function lire(T, tab, x, z) {
  const fx = (x - T.Z.x0) / PAS_T, fz = (z - T.Z.z0) / PAS_T, i = Math.min(T.nx - 2, fx | 0), j = Math.min(T.nz - 2, fz | 0), u = fx - i, v = fz - j, k = j * T.nx + i;
  return (tab[k] * (1 - u) + tab[k + 1] * u) * (1 - v) + (tab[k + T.nx] * (1 - u) + tab[k + T.nx + 1] * u) * v;
}
/** La hauteur du sol (la neige) en x, z. */
function terrain(x, z) {
  if (!TA) preparer();
  if (dansZone(ZONE_A, x, z)) return lire(TA, TA.H, x, z);
  if (dansZone(ZONE_B, x, z)) return lire(TB, TB.H, x, z);
  return relief(x, z) + (Math.abs(x) < 400 && z > -700 && z < 300 ? epaisseur(x, z) : 0.95);
}
/** À peu près la distance au bord de là où l'on marche (les tables : pour peindre le sol ; le cadre, lui, la calcule au plus juste). */
function dTable(x, z) {
  if (!TA) preparer();
  if (dansZone(ZONE_A, x, z)) return lire(TA, TA.D, x, z);
  if (dansZone(ZONE_B, x, z)) return lire(TB, TB.D, x, z);
  return 30;
}
// le fin : 1 m, et des cases de 25 cm là où le sol plie (le talus des congères) ; le grossier : 8 m (les montagnes)
const ETENDUE = { x0: -1600, x1: 1600, z0: -1640, z1: 1000, pas: 8, fin: { x0: -104, x1: 96, z0: -456, z1: 72, pas: 1 } };
const solDetaille = (x0, z0, x1, z1) => {
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  if (!dansZone(ZONE_A, cx, cz) && !dansZone(ZONE_B, cx, cz)) return false;
  const d = dTable(cx, cz);
  if (d > -0.9 && d < 2.1) return true;
  // (le dedans des kamakura, déneigé lui aussi : son bord plie au pied du mur)
  if (cz < Z_CRETE && d < 6) for (const K of KAMAKURA) if (Math.hypot(cx - K.x, cz - K.z) < K.R + 0.4) return true;
  return false;
};

// ---------------------------------------------------------------- Le sol, sa couleur
const hex = (r, g, b) => `#${((Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b)).toString(16).padStart(6, '0')}`;
// la neige fraîche, du creux bleuté à la bosse claire (une table : pas de chaîne à fabriquer pour chaque point)
const FRAICHES = [], TASSEES = [];
for (let k = 0; k < 24; k++) {
  const t = k / 23;
  FRAICHES.push(hex(melange(0xd8, 0xfa, t), melange(0xe3, 0xfb, t), melange(0xf5, 0xff, t)));
  TASSEES.push(hex(melange(0xbf, 0xdc, t), melange(0xcb, 0xe4, t), melange(0xdf, 0xf0, t)));
}
const table = (T, t) => T[Math.max(0, Math.min(23, Math.round(t * 23)))];
/** Le sol (sa couleur et sa matière, textures.js) en x, z, à la hauteur h. */
function aspectSol(P, x, z, h) {
  const d = dTable(x, z), b = bruitDoux(x, z, 6), b2 = bruitDoux(x + 13, z + 7, 2.2);
  // la rivière Chikuma, à l'est, et sa berge ; la route déneigée (son bitume mouillé, que l'hiver reblanchit par plaques)
  if (x > 150 && z > -260) {
    const lit = Math.abs(x - 205 - 22 * Math.sin(z * 0.006 + 0.4)) - 34;
    if (lit < 0) return [b > 0.5 ? '#4a6470' : '#42606c', M.estran];
    if (lit < 5) return ['#b9c6d2', M.neige];
  }
  if (z > 46.2 && z < 52.8 && x > -97 && x < 85) return [b2 > 0.5 ? '#6f7377' : '#666a6e', M.route];
  if (z > Z_FACADES - 2.0 && z < Z_FACADES + 0.5 && x > -97 && x < 85) return [b2 > 0.5 ? '#aaa9a2' : '#a2a19a', M.dalles];
  if (z < -286.2 && z > -291.8 && x > 16 && x < 150) return [b2 > 0.5 ? '#6f7377' : '#666a6e', M.route];
  // là où l'on marche : la neige tassée, plus grise au milieu des passages, des traînées
  if (d < 0.12) {
    const use = lisse(-0.2, -2.2, d);
    return [table(TASSEES, 0.86 - 0.42 * use + 0.3 * (b - 0.5) + 0.2 * (b2 - 0.5)), M.neige];
  }
  // la neige fraîche : ses creux bleutés, ses bosses claires ; sous les arbres des pentes, plus grise ; au loin, les forêts font des taches sombres
  const loin = Math.hypot(x, z + 190) > 520;
  if (loin) {
    const bois = bruitDoux(x, z, 130) + 0.5 * bruitDoux(x + 70, z, 47) - 0.0009 * h;
    if (bois > 0.86) return [bois > 1.05 ? '#74899a' : '#97abb9', M.neige];
    return [table(FRAICHES, 0.55 + 0.4 * (b - 0.5) + lisse(200, 520, h) * 0.3), M.neige];
  }
  return [table(FRAICHES, 0.6 + 0.62 * (b - 0.5) + 0.26 * (b2 - 0.5)), M.neige];
}

/** Ce que le carnet et le menu savent du lieu, sans le construire. */
export const infos = {
  id: 'iiyama', carte: 'iiyama-snow-festival', video: '7665782160250522902',
  nom: { en: 'Iiyama Snow Festival', fr: 'Fête de la neige d’Iiyama', ja: 'いいやま雪まつり' }, nomCourt: { en: 'Iiyama', fr: 'Iiyama', ja: '雪まつり' }, nomJa: 'いいやま雪まつり',
  phrase: { fr: 'la fête de la neige d’Iiyama', en: 'the Iiyama Snow Festival' },
  tampons: [
    { id: 'yukizo', motif: 'yukizo', ja: '雪像', encre: '#3a6ea8' },
    { id: 'slider', motif: 'bouee', ja: 'スノースライダー', encre: '#c0392b', forme: 'carre' },
    { id: 'toro', motif: 'toro', ja: '雪灯ろう', encre: '#d98a1f' },
    { id: 'nabe', motif: 'nabe', ja: 'のろし鍋', encre: '#8a4a2a', forme: 'carre' },
    { id: 'jinja', motif: 'kamakura', ja: 'かまくら神社', encre: '#b8322a' },
  ],
  get textes() { return TEXTES; },
};

/** La nuit : les fenêtres et les lanternes s'allument. */
export const sortesNuit = (P) => ({ [P.shoji]: 'lumiere', [P.shojiCadre]: 'treillis' });

/** Ce que dit la bulle, là où l'on fait un tampon sans parler à quelqu'un. */
const QUOI = {
  nabe: { fr: 'Manger la marmite', en: 'Eat the hot pot', ja: 'のろし鍋を　たべる' },
  jinja: { fr: 'Prier au sanctuaire', en: 'Pray at the shrine', ja: 'おまいりする' },
};
const tournerVers = (a, b, k) => { const d = Math.atan2(Math.sin(b - a), Math.cos(b - a)); return a + d * Math.min(1, k); };
// le record de la descente en bouée (gardé avec ceux des autres lieux) ; les temps des médailles, en secondes : l'or à qui tient le milieu
// en se penchant (11,27 s au mieux), l'argent avec un ou deux bords, le bronze sans se pencher ; rien à qui ne tourne pas du tout
const CLE_RECORDS = 'baladeRecords', CLE_BOUEE = 'iiyamaBouee';
const TEMPS_BOUEE = [11.6, 12.7, 15];
const lireRecord = (cle) => { try { return JSON.parse(localStorage.getItem(CLE_RECORDS))?.[cle] ?? null; } catch { return null; } };
const ecrireRecord = (cle, v) => { try { const r = JSON.parse(localStorage.getItem(CLE_RECORDS)) || {}; r[cle] = v; localStorage.setItem(CLE_RECORDS, JSON.stringify(r)); } catch { /* navigation privée */ } };
const chiffres = (t) => t.toFixed(2);
/** La ligne du record, sous le chrono. */
const enTeteBouee = (jeu) => { const r = lireRecord(CLE_BOUEE); return r != null ? `<small>${jeu.tx('chronoRecord')} ${chiffres(r)} s</small>` : ''; };

/**
 * De petits points qui volent (la neige soulevée, des braises, des flammes) : emettre(x, y, z, n, { large, vx, vy, vz, ecart (de vitesse), vie, alpha,
 * taille }) ; ils retombent (gravite ; négative : ils montent). additif : ils brillent (le feu).
 */
function creerParticules(THREE, { n = 300, couleur = '#ffffff', additif = false, gravite = 1.4, base = 0.07 } = {}) {
  const pos = new Float32Array(n * 3), al = new Float32Array(n), ta = new Float32Array(n), parts = [];
  for (let k = 0; k < n; k++) { parts.push({ age: 9, vie: 1 }); pos[k * 3 + 1] = -500; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('alpha', new THREE.BufferAttribute(al, 1));
  g.setAttribute('taille', new THREE.BufferAttribute(ta, 1));
  const u = { echelle: { value: 1 }, couleur: { value: new THREE.Color(couleur) } };
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: additif ? THREE.AdditiveBlending : THREE.NormalBlending, uniforms: u,
    vertexShader: `attribute float alpha; attribute float taille; varying float vA; uniform float echelle; void main() { vA = alpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = max(1.4, echelle * taille / max(0.5, -mv.z)); }`,
    fragmentShader: `varying float vA; uniform vec3 couleur; void main() { float d = length(gl_PointCoord - 0.5); if (d > 0.5 || vA <= 0.0) discard; gl_FragColor = vec4(couleur, vA * (1.0 - smoothstep(0.15, 0.5, d)));
      #include <colorspace_fragment>
    }`,
  });
  const o = new THREE.Points(g, m);
  o.frustumCulled = false;
  o.renderOrder = 2;
  let libre = 0, vivants = 0;
  return {
    objet: o,
    emettre(x, y, z, k, { large = 0.2, vx = 0, vy = 1, vz = 0, ecart = 0.5, vie = 1, alpha = 0.9, taille = base } = {}) {
      for (let i = 0; i < k; i++) {
        const q = parts[libre], t = Math.random() * 6.283, r = Math.random() * large;
        Object.assign(q, { age: 0, vie: vie * (0.6 + 0.6 * Math.random()), x: x + Math.cos(t) * r, y: y + (Math.random() - 0.5) * large, z: z + Math.sin(t) * r, vx: vx + (Math.random() - 0.5) * ecart, vy: vy * (0.6 + 0.7 * Math.random()), vz: vz + (Math.random() - 0.5) * ecart, alpha, taille: taille * (0.7 + 0.6 * Math.random()) });
        libre = (libre + 1) % n;
      }
      vivants = n;
    },
    maj(dt) {
      if (!vivants) return [];
      u.echelle.value = innerHeight * Math.min(devicePixelRatio, 2);
      vivants = 0;
      for (let k = 0; k < n; k++) {
        const q = parts[k];
        if (q.age >= q.vie) { if (al[k] !== 0) { al[k] = 0; pos[k * 3 + 1] = -500; } continue; }
        vivants++;
        q.age += dt;
        q.vy -= gravite * dt;
        q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
        const f = q.age / q.vie;
        pos[k * 3] = q.x; pos[k * 3 + 1] = q.y; pos[k * 3 + 2] = q.z;
        al[k] = q.alpha * Math.min(1, f * 8) * (1 - f);
        ta[k] = q.taille;
      }
      g.attributes.position.needsUpdate = true;
      g.attributes.alpha.needsUpdate = true;
      g.attributes.taille.needsUpdate = true;
      return [];
    },
  };
}

export function construire(ctx) {
  const { THREE, atelier, P } = ctx;
  const objets = [], bancs = [], lumieres = [], animes = [], etiquettes = [], vapeurs = [];
  const monde = creerMonde({ terrain, cadre: dansLeCadre, profond: null, pente: null });
  // (chaque partie ne se dessine que la caméra chez elle : dedans)
  const DEDANS_A = [ZONE_A.x0 - 40, ZONE_A.x1 + 80, Z_CRETE + 8, ZONE_A.z1 + 60], DEDANS_B = [ZONE_B.x0 - 60, ZONE_B.x1 + 80, ZONE_B.z0 - 60, Z_CRETE + 8];
  const zoneDe = (z) => (z > Z_CRETE ? DEDANS_A : DEDANS_B);
  const poser = (fin, x, z, o = {}) => objets.push({ fin, x, z, y: o.y ?? terrain(x, z), ry: o.ry || 0, ombre: o.ombre !== false, trait: o.trait !== false, dedans: o.dedans, avant: o.avant, recoit: o.recoit });
  const ecrire = (o, e) => {
    const c = Math.cos(o.ry || 0), sn = Math.sin(o.ry || 0);
    etiquettes.push({ ...e, x: o.x + e.x * c + e.z * sn, y: o.y + e.y, z: o.z - e.x * sn + e.z * c, ry: (o.ry || 0) + (e.ry || 0) });
  };
  /** Un repère tourné : la pose (x, y, z, ry) d'une pièce donnée dans le repère d'un objet posé en x0, z0, tourné de ry0. */
  const repere = (x0, z0, ry0) => {
    const c = Math.cos(ry0), s = Math.sin(ry0);
    return (lx, y, lz, o = {}) => ({ ordre: 'YXZ', ...o, x: x0 + lx * c + lz * s, y, z: z0 - lx * s + lz * c, ry: ry0 + (o.ry || 0) });
  };
  /** Ce qui arrête autour d'un rectangle dessiné (cx, cz, demi-longueurs hx, hz) : quatre murs minces, 27 cm autour. */
  const murRect = (cx, cz, hx, hz, marge = 0.27, bas, haut) => {
    const X = hx + marge - 0.1, Z = hz + marge - 0.1;
    monde.mur(cx - X, cz - Z, cx + X, cz - Z, 0.1, bas, haut); monde.mur(cx - X, cz + Z, cx + X, cz + Z, 0.1, bas, haut);
    monde.mur(cx - X, cz - Z, cx - X, cz + Z, 0.1, bas, haut); monde.mur(cx + X, cz - Z, cx + X, cz + Z, 0.1, bas, haut);
  };
  // le décor en morceaux (un objet chacun : hors de l'écran, ils ne se dessinent pas)
  const morceaux = new Map();
  const morceau = (x, z, taille = 40) => {
    const k = `${taille}:${Math.floor(x / taille)},${Math.floor(z / taille)}`;
    if (!morceaux.has(k)) morceaux.set(k, { a: atelier(), z });
    return morceaux.get(k).a;
  };
  const finirDecor = () => { for (const { a, z } of morceaux.values()) poser(a.fin(), 0, 0, { y: 0, dedans: zoneDe(z) }); };

  // ---------------------------------------------------------------- Les couleurs
  const NEIGE = P.neige, TAILLEE = P.neigeTaillee, OMBRE = P.neigeOmbre;
  const BOIS = '#8f6f4f', BOIS_F = '#5f4836', BOIS_N = '#4a3a30', CREPI = '#e4dccb', CREPI_G = '#cfc8ba', ACIER = '#9aa2a8', ACIER_F = '#5c646c', ROUGE = '#c8372d', NOIR = '#2f2c30', BACHE = '#f1eee6';
  const TUILE = '#5a6067', TUILE2 = '#676d74', TUILE_B = '#44494f';
  const PIERRE = '#8e8c84', PIERRE2 = '#7c7a73', PIERRE3 = '#a09d94';
  // (une lueur d'ambre : la niche d'une lanterne de neige, le dedans d'un kamakura ; le jour, une ombre chaude ; la nuit, elle s'allume)
  const AMBRE = '#d9a860', DEDANS_K = '#e6eaf2';
  const outils = { THREE, P, NEIGE, TAILLEE, OMBRE, AMBRE, DEDANS_K, hasard };
  // les lanternes de neige (雪灯ろう) : posées au fil du décor, allumées la nuit ; x, y (le pied), z, cap (vers où s'ouvre la niche)
  const LANTERNES = [];
  const lanterne = (x, z, cap = 0, o = {}) => {
    const y = o.y ?? terrain(x, z), s = o.s ?? 1;
    lanterneNeige(outils, morceau(x, z), x, y, z, cap, s);
    LANTERNES.push({ x, y, z, cap, s });
    lumieres.push({ x: x + Math.sin(cap) * 0.2 * s, y: y + 0.26 * s, z: z + Math.cos(cap) * 0.2 * s, halo: 0.34 * s, sol: y, r: 2.4 * s, c: '#ffb45e' });
    if (o.mur !== false) monde.cercle(x, z, 0.3 * s + 0.2);
  };

  // ================================================================ LA PARTIE A : LE PARC DU CHÂTEAU
  // ---------------------------------------------------------------- La rue : les maisons à arcades (雁木) d'en face, les barrières, la navette
  {
    // Au sud de la rue, la neige rejetée fait un mur entre la chaussée et le trottoir couvert : derrière, les arcades de bois (雁木, qui
    // laissent passer à pied sec tout l'hiver) et les boutiques. Iiyama a les siennes : 雁木通り, dans la rue des autels bouddhiques.
    // (Leur auvent est à 5,8 m du bord de la rue : à 1,7 m, la caméra, derrière qui marchait dans la rue en regardant la place, était dessous,
    // et son dessous sombre barrait le haut de l'image.)
    const ENSEIGNES = [['仏壇', '#3a2c24', '#e8c860'], ['和菓子', '#7a2f2a', '#f4ead2'], ['内山紙', '#2f4a5a', '#f4ead2'], ['そば', '#4a3a2a', '#f4ead2'], ['地酒', '#2a3a2a', '#e8dcc0'], ['呉服', '#4a2f4a', '#f4ead2'], ['味噌', '#5a3a22', '#f4ead2'], ['笹寿司', '#2f5a3a', '#f4ead2'], ['金物', '#3a3a44', '#e8dcc0']];
    let x = -96, k = 0;
    while (x < 80) {
      const l = 10.5 + 5 * hasard(k, 3), h = 5.2 + 1.4 * hasard(k, 7), p = 8 + 2 * hasard(k, 11), cx = x + l / 2;
      const a = morceau(cx, 66), mur = [CREPI, '#6b5746', CREPI_G, '#5a4a3e'][k % 4];
      maisonArcade(outils, a, cx, Z_FACADES + p / 2, Y0, { l: l - 0.5, p, h, mur, bois: k % 2 ? BOIS_F : BOIS_N, toit: [TUILE, TUILE2, TUILE_B], ecrire, enseigne: ENSEIGNES[k % ENSEIGNES.length], graine: k });
      x += l; k++;
    }
    // (la caméra n'entre ni sous leur arcade ni dans leurs murs : monde.visee)
    monde.bloc(-97, 85, Z_FACADES - 2.5, Z_FACADES + 11, Y0 - 1, Y0 + 9);
    for (const cx of [-101.5, 89.5]) monde.bloc(cx - 4.5, cx + 4.5, 37, 67, Y0 - 1, Y0 + 11);
    // (aux deux bouts de la rue, une façade en travers : la rue tourne, on ne la voit pas finir dans la neige)
    for (const [cx, sens] of [[-101.5, 1], [89.5, -1]]) {
      const a = morceau(cx, 50);
      a.boite(9, 8.5, 30, CREPI_G, { x: cx, y: Y0 + 4.2, z: 52, nuance: 0.03 });
      a.pignon(30.6, 2.6, 10.4, TUILE, { x: cx, y: Y0 + 8.45, z: 52, ry: PI / 2 });
      a.pignon(31, 2.7, 10.9, NEIGE, { x: cx, y: Y0 + 8.75, z: 52, ry: PI / 2 });
      for (let j = 0; j < 6; j++) for (const yy of [2.2, 5.6]) a.boite(0.06, 1.3, 1.9, P.shoji, { x: cx + sens * 4.52, y: Y0 + yy, z: 40.5 + j * 4.75, trait: false }).boite(0.05, 1.42, 2.02, BOIS_N, { x: cx + sens * 4.5, y: Y0 + yy, z: 40.5 + j * 4.75 });
    }
    // les barrières des deux bouts (la rue est fermée aux voitures pour la fête) : dessinées 27 cm au-delà de là où l'on s'arrête
    for (const [xb, sens] of [[RUE.x0 - 0.52, -1], [RUE.x1 + 0.52, 1]]) {
      const a = morceau(xb, 50);
      for (const z of [47.3, 49.5, 51.7]) barriere(outils, a, xb, Y0 + 0.03, z, PI / 2);
      for (const z of [46.25, 48.4, 50.6, 52.75]) a.cone(0.17, 0.62, 10, '#e2572a', { x: xb, y: Y0 + 0.34, z }).cylindre(0.2, 0.22, 0.05, 10, '#e2572a', { x: xb, y: Y0 + 0.045, z }).cylindre(0.125, 0.14, 0.09, 10, '#f4f2ea', { x: xb, y: Y0 + 0.36, z, trait: false });
      ecrire({ x: xb - sens * 0.34, y: Y0, z: 49.5, ry: -sens * PI / 2 }, { texte: '車両通行止', sous: '雪まつり開催中', x: 0, y: 1.02, z: 0, l: 1.5, h: 0.46, fond: '#f4f2ea', encre: '#b8322a' });
    }
  }
  // la navette pour le village des kamakura, garée au bout est de la rue ; son arrêt
  const NAVETTE_A = { x: 23.6, z: 48.6, ry: PI / 2 };
  {
    const a = morceau(NAVETTE_A.x, NAVETTE_A.z);
    minibus(outils, a, repere(NAVETTE_A.x, NAVETTE_A.z, NAVETTE_A.ry), Y0 + 0.03, ecrire, NAVETTE_A);
    murRect(NAVETTE_A.x, NAVETTE_A.z, 3.25, 1.12);
    monde.bloc(NAVETTE_A.x - 3.15, NAVETTE_A.x + 3.15, NAVETTE_A.z - 1.05, NAVETTE_A.z + 1.05, Y0 - 1, Y0 + 2.6);
    // (le poteau de l'arrêt, côté trottoir de la place)
    const xa = 17.4, za = 46.9;
    a.baton([xa, Y0, za], [xa, Y0 + 2.3, za], 0.035, ACIER, 6).cylindre(0.2, 0.2, 0.08, 10, ACIER_F, { x: xa, y: Y0 + 0.06, z: za });
    a.boite(0.62, 0.62, 0.05, '#2f6aa0', { x: xa, y: Y0 + 2.0, z: za + 0.06 }).boite(0.56, 0.5, 0.05, '#f4f2ea', { x: xa, y: Y0 + 1.36, z: za + 0.06 });
    ecrire({ x: xa, y: Y0, z: za + 0.09, ry: 0 }, { texte: 'シャトルバス', x: 0, y: 2.0, z: 0, l: 0.54, h: 0.2, fond: null, encre: '#f4f2ea' });
    ecrire({ x: xa, y: Y0, z: za + 0.09, ry: 0 }, { texte: 'かまくらの里', sous: '信濃平 ゆき', x: 0, y: 1.36, z: 0, l: 0.5, h: 0.4, fond: null, encre: '#2a3a4a' });
    monde.cercle(xa, za, 0.25);
  }

  // ---------------------------------------------------------------- La place du bas (弓道場下駐車場) : les tentes de la fête
  // Les tentes de l'ouest tournent le dos à la congère (leur comptoir vers l'est) ; celles de l'est, l'inverse. Chacune : ce qu'on y sert.
  const TENTES = [
    { id: 'banane', x: -22.4, z: 41.6, ry: PI / 2, bande: '#e8b23a', titre: 'バナナボート', sous: '飯山 冬の名物' },
    { id: 'sasa', x: -22.4, z: 35.8, ry: PI / 2, bande: '#3f8a4a', titre: '笹寿司', sous: 'ささずし' },
    { id: 'kinoko', x: -22.4, z: 30.0, ry: PI / 2, bande: '#b8322a', titre: 'きのこ汁', sous: 'ふるまい' },
    { id: 'amazake', x: -22.4, z: 24.2, ry: PI / 2, bande: '#d86a8a', titre: '甘酒', sous: 'あまざけ' },
    { id: 'honbu', x: 22.4, z: 41.6, ry: -PI / 2, bande: '#2f5aa0', titre: '総合案内', sous: 'いいやま雪まつり 本部' },
    { id: 'soba', x: 22.4, z: 35.8, ry: -PI / 2, bande: '#4a3a2a', titre: '富倉そば', sous: 'とみくらそば' },
    { id: 'pork', x: 22.4, z: 30.0, ry: -PI / 2, bande: '#c8502a', titre: 'みゆきポーク', sous: '串焼き' },
  ];
  for (const T of TENTES) {
    const a = morceau(T.x, T.z), R = repere(T.x, T.z, T.ry);
    tente(outils, a, R, Y0, T, ecrire);
    // (ce qui arrête : le comptoir et les côtés ; derrière, la congère)
    const c = Math.cos(T.ry), s = Math.sin(T.ry);
    murRect(T.x + s * 0.15, T.z + c * 0.15, Math.abs(c) * 1.8 + Math.abs(s) * 1.5, Math.abs(s) * 1.8 + Math.abs(c) * 1.5);
    { const hx = Math.abs(c) * 1.8 + Math.abs(s) * 1.5, hz = Math.abs(s) * 1.8 + Math.abs(c) * 1.5; monde.bloc(T.x - hx, T.x + hx, T.z - hz, T.z + hz, Y0 - 1, Y0 + 3); }
    lumieres.push({ x: T.x + s * 0.9, y: Y0 + 2.05, z: T.z + c * 0.9, halo: 0.3, sol: Y0, r: 4.2 });
  }
  {
    // les boissons au frais dans un tas de neige, à côté de la tente de l'amazake (comme sur la vidéo du propriétaire) : bouteilles et canettes plantées dedans
    const x0 = -18.6, z0 = 20.6, a = morceau(x0, z0);
    a.ovale(1, NEIGE, { x: x0, y: Y0 + 0.2, z: z0, sx: 1.25, sy: 0.82, sz: 0.95 }, 12);
    const BOISSONS = ['#2f8a4a', '#c8372d', '#e8b23a', '#2f5aa0', '#f4f2ea', '#3a3a3a', '#e07a2a', '#7ac4d8'];
    for (let k = 0; k < 22; k++) {
      const t = hasard(k, 5) * 2.6 - 0.2, e = 0.18 + 0.62 * hasard(k, 9), dx = Math.sin(t) * Math.cos(e), dz = Math.cos(t) * Math.cos(e), dy = Math.sin(e);
      const px = x0 + dx * 1.23, py = Y0 + 0.2 + dy * 0.8, pz = z0 + dz * 0.93, c = BOISSONS[k % BOISSONS.length], bouteille = k % 3 === 0;
      a.baton([px - dx * 0.06, py - dy * 0.06, pz - dz * 0.06], [px + dx * (bouteille ? 0.14 : 0.08), py + dy * (bouteille ? 0.14 : 0.08), pz + dz * (bouteille ? 0.14 : 0.08)], 0.036, c, 8, { trait: false });
      if (bouteille) a.baton([px + dx * 0.14, py + dy * 0.14, pz + dz * 0.14], [px + dx * 0.21, py + dy * 0.21, pz + dz * 0.21], 0.016, '#f4f2ea', 6, { trait: false });
    }
    monde.cercle(x0, z0, 1.58);
    // le grand panneau de la fête, à l'entrée de la place : deux mâts, la bannière entre eux, au-dessus des têtes
    // (assez bas pour tenir en entier dans l'image du départ, assez haut pour ne pas cacher la porte du château, au fond)
    const b = morceau(0, 39), zb = 38.6, yb = Y0 + 4.82;
    for (const xm of [-9.6, 9.6]) { b.baton([xm, Y0 - 0.2, zb], [xm, Y0 + 5.45, zb], 0.075, BOIS, 8); b.cylindre(0.2, 0.26, 0.5, 8, NEIGE, { x: xm, y: Y0 + 0.2, z: zb }); monde.cercle(xm, zb, 0.42); }
    b.boite(19.1, 0.98, 0.05, '#f6f3ea', { x: 0, y: yb, z: zb }).boite(19.2, 0.07, 0.07, ROUGE, { x: 0, y: yb + 0.51, z: zb }).boite(19.2, 0.07, 0.07, ROUGE, { x: 0, y: yb - 0.51, z: zb });
    for (const sens of [1, -1]) ecrire({ x: 0, y: Y0, z: zb + sens * 0.04, ry: sens > 0 ? 0 : PI }, { texte: 'いいやま雪まつり', sous: 'IIYAMA SNOW FESTIVAL', x: 0, y: 4.82, z: 0, l: 9.2, h: 0.86, fond: null, encre: '#2f5aa0', pixels: 120 });
    // deux braseros (des bidons où brûle du bois) : on s'y chauffe les mains
    for (const [bx, bz] of [[-8.5, 31.5], [9.5, 37.5]]) {
      const q = morceau(bx, bz);
      q.cylindre(0.3, 0.28, 0.78, 12, '#4a4038', { x: bx, y: Y0 + 0.42, z: bz }).cylindre(0.31, 0.31, 0.04, 12, '#2f2a26', { x: bx, y: Y0 + 0.8, z: bz });
      for (let j = 0; j < 4; j++) q.baton([bx + 0.12 * Math.cos(j * 1.7), Y0 + 0.7, bz + 0.12 * Math.sin(j * 1.7)], [bx - 0.1 * Math.cos(j * 1.7 + 0.6), Y0 + 0.98, bz - 0.1 * Math.sin(j * 1.7 + 0.6)], 0.035, '#3a2c22', 5, { trait: false });
      q.cone(0.17, 0.42, 7, '#ffb347', { x: bx, y: Y0 + 1.02, z: bz, sorte: 'lampe', trait: false }).cone(0.09, 0.3, 6, '#fff0a8', { x: bx + 0.03, y: Y0 + 1.0, z: bz - 0.02, sorte: 'lampe', trait: false });
      monde.cercle(bx, bz, 0.56);
      lumieres.push({ x: bx, y: Y0 + 1.15, z: bz, halo: 0.55, sol: Y0, r: 5, c: '#ff9a4a' });
      vapeurs.push({ x: bx, z: bz, y: Y0 + 1.25, n: 5, haut: 2.0, large: 0.22, taille: 0.5, opacite: 0.35 });
    }
    // le poteau du parc, au pied de la montée
    const xp = 3.9, zp = 18.9;
    b.boite(0.2, 2.1, 0.2, BOIS, { x: xp, y: Y0 + 0.95, z: zp }).cone(0.17, 0.14, 4, BOIS_F, { x: xp, y: Y0 + 2.07, z: zp, ry: PI / 4 });
    ecrire({ x: xp, y: Y0, z: zp + 0.105, ry: 0 }, { texte: '飯山城址公園', x: 0, y: 1.2, z: 0, l: 0.17, h: 1.3, fond: null, encre: '#2a2420', vertical: true });
    monde.cercle(xp, zp, 0.32);
  }

  // ---------------------------------------------------------------- La montée et la porte du château (城門)
  {
    // des lanternes de neige des deux côtés de la montée, sur le haut de la congère, leur niche tournée vers le chemin
    for (let z = 14; z > -8; z -= 3.1) for (const sx of [-1, 1]) lanterne(sx * 3.75, z, sx > 0 ? -PI / 2 : PI / 2, { mur: false });
    // La porte : rebâtie en bois d'après les archives, là où se dressait l'ancienne. Deux gros poteaux, deux poteaux de renfort derrière, un toit de
    // tuiles ; de part et d'autre, un bout de mur de pierre, tout ce qui reste du château d'Uesugi Kenshin (les murs de pierre, classés en 1965).
    const zg = -10.6, a = morceau(0, zg), y = Y1;
    for (const sx of [-1, 1]) {
      a.boite(0.46, 3.5, 0.46, BOIS_F, { x: sx * 2.9, y: y + 1.6, z: zg }).boite(0.3, 2.9, 0.3, BOIS_F, { x: sx * 2.9, y: y + 1.3, z: zg - 1.7 });
      a.boite(0.2, 0.2, 1.6, BOIS_F, { x: sx * 2.9, y: y + 2.5, z: zg - 0.85 });
      // (les vantaux, ouverts contre les poteaux de derrière)
      a.boite(0.09, 2.7, 1.55, BOIS, { x: sx * 2.62, y: y + 1.36, z: zg - 0.93, nuance: 0.03 });
      for (const yy of [0.5, 1.4, 2.3]) a.boite(0.11, 0.1, 1.57, NOIR, { x: sx * 2.6, y: y + yy, z: zg - 0.93, trait: false });
      monde.mur(sx * 2.9, zg + 0.15, sx * 2.9, zg - 1.9, 0.56);
    }
    a.boite(6.5, 0.36, 0.42, BOIS_F, { x: 0, y: y + 3.1, z: zg }).boite(6.3, 0.24, 0.3, BOIS_F, { x: 0, y: y + 2.72, z: zg - 1.7 });
    a.toitJapon(7.6, 3.6, 0.95, 0.12, { x: 0, y: y + 3.42, z: zg - 0.85, tuile: TUILE, tuile2: TUILE2, bord: TUILE_B, rangs: 10, murs: { l: 3.25, p: 1.06, y: -0.14, c: BOIS_F } });
    manteauPente(outils, a, 0, y + 3.52, zg - 0.85, 7.9, 3.9, 0.95, 0.42);
    // les deux bouts de mur de pierre (leurs pieds dans la neige), coiffés de neige
    for (const sx of [-1, 1]) {
      const cx = sx * 9.4;
      a.ishigaki(11.6, 2.3, 3.4, 0.36, { x: cx, y: y - 1.3, z: zg - 0.4 });
      manteau(outils, a, 11.2, 1.9, 0.5, { x: cx, y: y + 2.3, z: zg - 0.4 });
      murRect(cx, zg - 0.4, 5.8, 1.15, 0.3);
    }
  }

  // ---------------------------------------------------------------- La grande terrasse : les sculptures de neige, la scène, le cercle du tengu
  /** Ce qui arrête autour d'un rectangle tourné de ry (cx, cz, demi-longueurs hx, hz dans son repère) : quatre murs minces, 25 cm autour. */
  const murBoite = (cx, cz, hx, hz, ry, marge = 0.25) => {
    const c = Math.cos(ry), s = Math.sin(ry), X = hx + marge - 0.1, Z = hz + marge - 0.1, q = (u, v) => [cx + u * c + v * s, cz - u * s + v * c];
    const P = [q(-X, -Z), q(X, -Z), q(X, Z), q(-X, Z)];
    for (let k = 0; k < 4; k++) monde.mur(P[k][0], P[k][1], P[(k + 1) % 4][0], P[(k + 1) % 4][1], 0.1);
  };
  /** Une corde sur des piquets, le long des points [x, z] (y : le sol) : on s'y arrête. */
  const cordon = (pts, y, o = {}) => {
    const a = morceau(pts[0][0], pts[0][1]), h = o.h ?? 0.78, c = o.c ?? '#c8b27a';
    for (let i = 0; i < pts.length; i++) {
      const [x, z] = pts[i];
      a.baton([x, y - 0.25, z], [x, y + h + 0.1, z], 0.028, o.piquet ?? BOIS, 6);
      if (i + 1 < pts.length) {
        const [x1, z1] = pts[i + 1];
        a.tube([[x, y + h, z], [(x + x1) / 2, y + h - 0.09, (z + z1) / 2], [x1, y + h, z1]], 0.014, c, { pas: 6, cotes: 4, trait: false });
        monde.mur(x, z, x1, z1, 0.24);
      }
    }
  };
  /** L'écriteau d'une sculpture : son titre et sa catégorie au concours, sur deux piquets, tourné vers ry. */
  const ecriteau = (x, z, ry, titre, sous, y = terrain(x, z)) => {
    const a = morceau(x, z), c = Math.cos(ry), s = Math.sin(ry);
    for (const u of [-0.36, 0.36]) a.baton([x + u * c, y - 0.2, z - u * s], [x + u * c, y + 0.86, z - u * s], 0.022, BOIS_F, 5);
    a.boite(0.92, 0.5, 0.035, '#efe6cf', { x: x + s * 0.03, y: y + 0.66, z: z + c * 0.03, ry });
    ecrire({ x, y, z, ry }, { texte: titre, sous, x: 0, y: 0.66, z: 0.052, l: 0.84, h: 0.42, fond: null, encre: '#2a2420' });
    murBoite(x, z, 0.48, 0.05, ry);
  };
  /** Un projecteur sur son trépied (la nuit, les sculptures sont éclairées : 雪像ライトアップ), tourné vers (vx, vz). */
  const projecteur = (x, z, vx, vz, y = terrain(x, z)) => {
    const a = morceau(x, z), d = Math.hypot(vx - x, vz - z), ux = (vx - x) / d, uz = (vz - z) / d;
    for (let k = 0; k < 3; k++) a.baton([x + 0.34 * Math.cos(k * 2.09), y, z + 0.34 * Math.sin(k * 2.09)], [x, y + 1.25, z], 0.016, ACIER_F, 5);
    a.baton([x, y + 1.2, z], [x, y + 1.7, z], 0.018, ACIER_F, 5);
    a.boite(0.3, 0.22, 0.12, '#3a3d42', { x: x + ux * 0.04, y: y + 1.78, z: z + uz * 0.04, ry: Math.atan2(ux, uz), rx: -0.25, ordre: 'YXZ' });
    a.boite(0.25, 0.17, 0.02, '#fff3c8', { x: x + ux * 0.1, y: y + 1.795, z: z + uz * 0.1, ry: Math.atan2(ux, uz), rx: -0.25, ordre: 'YXZ', sorte: 'lumiere', trait: false });
    monde.cercle(x, z, 0.58);
    // (sa lumière : faible, la neige taillée brille déjà d'elle-même la nuit, « illumine » ; forte, de près, tout était blanc brûlé)
    lumieres.push({ x: x + ux * 0.8, y: y + 2.0, z: z + uz * 0.8, halo: 0, sol: y, r: 7, c: '#6a583c' });
    lumieres.push({ x: x + ux * 0.12, y: y + 1.8, z: z + uz * 0.12, halo: 0.3, sol: null, r: 0, c: '#fff0c8' });
  };
  const SCULPTURES = {
    dragon: { x: 0, z: -50.6, ry: 0, l: 20.4, p: 4.6 },
    encours: { x: -33.4, z: -34, ry: PI / 2, l: 6.2, p: 4.6 },
    vieux: { x: -24.5, z: -50.4, ry: 0.22, l: 5.2, p: 4.2 },
    jizo: { x: 21.2, z: -50.6, ry: -0.14, l: 7.4, p: 3.4 },
    lapin: { x: -26.5, z: -17.6, ry: 2.3, l: 4.4, p: 3.0 },
  };
  {
    const S = SCULPTURES;
    // le grand dragon, au fond de la terrasse : vingt mètres de long (les plus grandes dépassent trois mètres de haut et vingt de large)
    sculptureDragon(outils, morceau(S.dragon.x, S.dragon.z, 60), S.dragon.x, Y1, S.dragon.z);
    murRect(S.dragon.x, S.dragon.z, S.dragon.l / 2, S.dragon.p / 2, 0.3);
    monde.bloc(S.dragon.x - S.dragon.l / 2, S.dragon.x + S.dragon.l / 2, S.dragon.z - S.dragon.p / 2, S.dragon.z + S.dragon.p / 2, Y1 - 1, Y1 + 2.6);
    // (une seule corde devant les trois sculptures du fond ; à ses deux bouts elle retourne jusqu'à la congère : on ne passe pas derrière)
    cordon([[-29.4, -55.7], [-29.4, -51.2], [-29.2, -46.9], [-24.4, -46.3], [-19.6, -46.9], [-15.2, -47.1], [-11.2, -47.2], [-5.6, -47.0], [0, -46.9], [5.6, -47.0], [11.2, -47.2], [14.4, -47.1], [17.4, -46.9], [21.4, -46.5], [25.6, -47.0], [25.8, -51.4], [25.8, -55.7]], Y1);
    ecriteau(-8.2, -46.4, 0, '昇り龍', '一般の部');
    projecteur(-6.5, -44.8, -5, -50); projecteur(6.5, -44.8, 4, -50);
    // le vieil homme au chapeau de paille (le grand-père du conte des Jizō aux chapeaux, 笠地蔵) et, de l'autre côté du dragon, les six Jizō
    sculptureVieux(outils, morceau(S.vieux.x, S.vieux.z), repere(S.vieux.x, S.vieux.z, S.vieux.ry), Y1);
    monde.cercle(S.vieux.x, S.vieux.z, 2.9);
    ecriteau(-21.6, -45.6, 0.1, '笠地蔵のおじいさん', '商店街の部');
    projecteur(-25.2, -44.4, -24.5, -50);
    sculptureJizo(outils, morceau(S.jizo.x, S.jizo.z), repere(S.jizo.x, S.jizo.z, S.jizo.ry), Y1);
    murBoite(S.jizo.x, S.jizo.z, 3.8, 1.7, S.jizo.ry, 0.3);
    ecriteau(19.0, -45.7, -0.1, '六地蔵', '小学校の部');
    projecteur(22.8, -44.5, 21.2, -50);
    // le lapin de neige géant (雪うさぎ : deux feuilles pour les oreilles, deux baies rouges pour les yeux), au coin sud-ouest
    sculptureLapin(outils, morceau(S.lapin.x, S.lapin.z), repere(S.lapin.x, S.lapin.z, S.lapin.ry), Y1);
    monde.cercle(S.lapin.x, S.lapin.z, 2.5);
    ecriteau(-23.2, -20.8, 2.3 - PI / 2 + 0.5, '雪うさぎ', 'フリーエントリーの部');
    // celle qu'une équipe finit encore, à l'ouest : un grand daruma qui sort de son bloc de neige ; l'échelle, les pelles, les seaux
    sculptureEnCours(outils, morceau(S.encours.x, S.encours.z), repere(S.encours.x, S.encours.z, S.encours.ry), Y1);
    murRect(S.encours.x + 0.65, S.encours.z - 0.05, 3.4, 3.75, 0.2);
    monde.bloc(S.encours.x + 0.65 - 3.2, S.encours.x + 0.65 + 3.2, S.encours.z - 3.6, S.encours.z + 3.5, Y1 - 1, Y1 + 4.4);
    for (const [q, r, h] of [[S.vieux, 2.0, 3.2], [S.jizo, 1.5, 2.4], [S.lapin, 1.7, 2.0]]) monde.bloc(q.x - r, q.x + r, q.z - r, q.z + r, Y1 - 1, Y1 + h);
    projecteur(-27.6, -29.4, -33, -33.5);
  }
  // l'allée des lanternes, de la porte au dragon
  for (let z = -15; z > -44.5; z -= 2.6) { lanterne(-3.4, z, PI / 2); lanterne(3.4, z, -PI / 2); }
  // la scène (特設ステージ), à l'est, tournée vers l'ouest : un plancher sur des tréteaux, un fond de toile, un petit toit ; les haut-parleurs
  const SCENE = { x: 34.4, z: -30, l: 9.2, p: 5.0, h: 0.95 };
  {
    const a = morceau(SCENE.x, SCENE.z), y = Y1, X = SCENE.x, Z = SCENE.z;
    a.boite(SCENE.p, SCENE.h, SCENE.l, '#6b5a4a', { x: X, y: y + SCENE.h / 2 - 0.05, z: Z, nuance: 0.03 }).boite(SCENE.p + 0.1, 0.07, SCENE.l + 0.1, '#8f7a5f', { x: X, y: y + SCENE.h + 0.01, z: Z });
    for (const sz of [-1, 1]) for (const sx of [-1, 1]) a.boite(0.14, 4.2, 0.14, ACIER_F, { x: X + sx * (SCENE.p / 2 - 0.12), y: y + SCENE.h + 2.1, z: Z + sz * (SCENE.l / 2 - 0.12) });
    a.boite(SCENE.p + 0.5, 0.16, SCENE.l + 0.5, '#e9e6de', { x: X, y: y + SCENE.h + 4.28, z: Z, rz: -0.06 });
    manteau(outils, a, SCENE.p + 0.6, SCENE.l + 0.6, 0.34, { x: X, y: y + SCENE.h + 4.52, z: Z, rz: -0.06 });
    a.boite(0.06, 3.5, SCENE.l - 0.2, '#f4f1ea', { x: X + SCENE.p / 2 - 0.16, y: y + SCENE.h + 2.0, z: Z, nuance: 0.02 });
    ecrire({ x: X + SCENE.p / 2 - 0.2, y, z: Z, ry: -PI / 2 }, { texte: 'いいやま雪まつり', sous: '特設ステージ', x: 0, y: SCENE.h + 2.5, z: 0, l: 6.4, h: 1.5, fond: null, encre: '#2f5aa0', pixels: 110 });
    for (const sz of [-1, 1]) a.boite(0.6, 1.3, 0.7, '#2f2c30', { x: X - SCENE.p / 2 + 0.6, y: y + SCENE.h + 0.66, z: Z + sz * (SCENE.l / 2 - 0.6) }).cylindre(0.2, 0.2, 0.03, 12, '#5a5a5e', { x: X - SCENE.p / 2 + 0.285, y: y + SCENE.h + 0.9, z: Z + sz * (SCENE.l / 2 - 0.6), rz: PI / 2, trait: false });
    a.baton([X - 1.0, y + SCENE.h, Z], [X - 1.0, y + SCENE.h + 1.25, Z], 0.014, ACIER_F, 5).boule(0.045, '#2f2c30', { x: X - 1.0, y: y + SCENE.h + 1.28, z: Z }, 1);
    // (les marches du côté, pour ceux qui montent sur scène : du décor)
    for (let k = 0; k < 4; k++) a.boite(1.1, 0.24, 0.34 + (k % 2 ? 0.01 : 0), '#7a6753', { x: X - 0.6, y: y + 0.11 + k * 0.235, z: Z + SCENE.l / 2 + 1.2 - k * 0.32 });
    murRect(X, Z + 0.55, SCENE.p / 2, SCENE.l / 2 + 0.9, 0.3);
    monde.bloc(X - SCENE.p / 2, X + SCENE.p / 2, Z - SCENE.l / 2, Z + SCENE.l / 2, y, y + 5.4);
    lumieres.push({ x: X - 0.5, y: y + SCENE.h + 3.6, z: Z, halo: 0, sol: y + SCENE.h, r: 7, c: '#ffe2b0' });
    // deux bancs devant la scène (on y a ôté la neige)
    for (const zb of [-33.4, -26.6]) {
      const xb = 26.6;
      a.boite(0.4, 0.06, 2.0, BOIS, { x: xb, y: y + 0.45, z: zb }).boite(0.07, 0.4, 0.3, BOIS_F, { x: xb, y: y + 0.21, z: zb - 0.8 }).boite(0.07, 0.4, 0.3, BOIS_F, { x: xb, y: y + 0.21, z: zb + 0.8 });
      murRect(xb, zb, 0.2, 1.0, 0.2);
      bancs.push({ de: [xb, zb - 0.8], a: [xb, zb + 0.8], y: y + 0.48, cap: PI / 2 });
    }
  }
  // le cercle où danse le grand tengu de Narazawa, le soir (奈良澤大天狗, 18 h 30 : sa torche chasse le mauvais sort) : des piquets de bambou et une corde
  // de paille, de la paille sur la neige ; son écriteau
  const CERCLE = { x: 13.6, z: -31.5, r: 5.6 };
  {
    const a = morceau(CERCLE.x, CERCLE.z), y = Y1, n = 14;
    for (let k = 0; k < n; k++) {
      const t0 = (k / n) * 2 * PI, t1 = ((k + 1) / n) * 2 * PI, x0 = CERCLE.x + Math.cos(t0) * CERCLE.r, z0 = CERCLE.z + Math.sin(t0) * CERCLE.r, x1 = CERCLE.x + Math.cos(t1) * CERCLE.r, z1 = CERCLE.z + Math.sin(t1) * CERCLE.r;
      a.baton([x0, y - 0.25, z0], [x0, y + 0.95, z0], 0.026, '#9aa860', 6);
      a.tube([[x0, y + 0.8, z0], [(x0 + x1) / 2, y + 0.7, (z0 + z1) / 2], [x1, y + 0.8, z1]], 0.02, '#c8b27a', { pas: 6, cotes: 5, trait: false });
      // (les bandes de papier blanc de la corde sacrée)
      a.boite(0.07, 0.22, 0.012, '#fbf6ea', { x: (x0 + x1) / 2, y: y + 0.58, z: (z0 + z1) / 2, ry: -(t0 + t1) / 2, trait: false });
    }
    // (la paille répandue : des brins épars, posés sur la neige)
    for (let k = 0; k < 70; k++) { const r = CERCLE.r * 0.92 * Math.sqrt(hasard(k, 31)), t = hasard(k, 37) * 6.28, t2 = hasard(k, 41) * 3.14; a.boite(0.42, 0.012, 0.03, k % 3 ? '#c8ac6a' : '#b89a58', { x: CERCLE.x + Math.cos(t) * r, y: y + 0.06 + 0.0004 * k, z: CERCLE.z + Math.sin(t) * r, ry: t2, trait: false }); }
    monde.cercle(CERCLE.x, CERCLE.z, CERCLE.r + 0.3);
    const xe = CERCLE.x - 3.4, ze = CERCLE.z + 5.6;
    a.boite(0.1, 1.5, 0.1, BOIS_F, { x: xe, y: y + 0.7, z: ze }).boite(0.95, 0.62, 0.05, '#efe6cf', { x: xe, y: y + 1.2, z: ze + 0.07 });
    ecrire({ x: xe, y, z: ze + 0.1, ry: 0 }, { texte: '奈良澤大天狗', sous: '午後6時30分', x: 0, y: 1.2, z: 0, l: 0.86, h: 0.52, fond: null, encre: '#b8322a' });
    monde.cercle(xe, ze, 0.42);
  }
  // le tableau du concours (雪像コンテスト), près de la porte (à huit mètres du bord de la terrasse : à quatre, qui le lisait avait la caméra
  // derrière lui au-delà du bord, et le talus de neige devant l'image)
  {
    const x = 9.2, z = -19.2, a = morceau(x, z), y = Y1;
    for (const u of [-0.95, 0.95]) a.boite(0.1, 2.0, 0.1, BOIS_F, { x: x + u, y: y + 0.9, z });
    a.boite(2.2, 1.25, 0.06, '#efe6cf', { x, y: y + 1.3, z: z + 0.04 }).boite(2.4, 0.14, 0.4, BOIS_F, { x, y: y + 2.0, z });
    manteau(outils, a, 2.5, 0.5, 0.18, { x, y: y + 2.16, z });
    ecrire({ x, y, z: z + 0.075, ry: 0 }, { texte: '雪像コンテスト', sous: '商店街の部・一般の部・フリーエントリーの部・小学校の部', x: 0, y: 1.3, z: 0, l: 2.0, h: 1.05, fond: null, encre: '#2a2420', lignes: 4 });
    murRect(x, z, 1.1, 0.15, 0.25);
  }

  // ---------------------------------------------------------------- Le coin des enfants (遊雪エリア) : la butte et son toboggan, l'atelier des lanternes, les bonshommes
  const BUTTE = { x: -68.4, z: -33.4, r: 4.0, h: 2.5 };
  const ATELIER = { x: -58.6, z: -15.6 };
  // (la place de la lanterne qu'on fabrique soi-même : au bout du rang de celles des enfants)
  const MA_LANTERNE = { x: -54.6, z: -13.3, cap: PI };
  {
    const a = morceau(BUTTE.x, BUTTE.z), y = Y2;
    a.piece(new THREE.SphereGeometry(1, 16, 6, 0, 2 * PI, 0, PI / 2), NEIGE, { x: BUTTE.x, y: y - 0.06, z: BUTTE.z, sx: BUTTE.r, sy: BUTTE.h, sz: BUTTE.r, nuance: 0.02 });
    // le toboggan, creusé dans son flanc est : sa glissière bleutée entre deux rebords, de la plate-forme du haut jusqu'en bas
    const x0 = BUTTE.x + 0.9, x1 = BUTTE.x + 6.3, h0 = y + BUTTE.h - 0.12, h1 = y + 0.12, L = Math.hypot(x1 - x0, h0 - h1), pente = Math.atan2(h0 - h1, x1 - x0);
    a.boite(L, 0.34, 1.15, OMBRE, { x: (x0 + x1) / 2, y: (h0 + h1) / 2 - 0.1, z: BUTTE.z, rz: -pente });
    for (const s of [-1, 1]) a.boite(L, 0.36, 0.26, NEIGE, { x: (x0 + x1) / 2, y: (h0 + h1) / 2 + 0.16, z: BUTTE.z + s * 0.7, rz: -pente, nuance: 0.02 });
    a.boite(1.9, 0.3, 2.0, TAILLEE, { x: BUTTE.x - 0.1, y: y + BUTTE.h - 0.1, z: BUTTE.z });
    // les marches taillées dans la neige, au dos (du décor : le toboggan est aux enfants)
    for (let k = 0; k < 7; k++) a.boite(0.5, 0.36 * (k + 1), 1.2 + (k % 2 ? 0.012 : 0), TAILLEE, { x: BUTTE.x - 4.2 + k * 0.5, y: y + 0.18 * (k + 1) - 0.05, z: BUTTE.z });
    monde.cercle(BUTTE.x, BUTTE.z, BUTTE.r + 0.25);
    monde.mur(BUTTE.x + 3.4, BUTTE.z, x1 + 0.1, BUTTE.z, 0.95);
    monde.mur(BUTTE.x - 4.6, BUTTE.z, BUTTE.x - 3.4, BUTTE.z, 0.85);
    // l'écriteau du coin
    const xe = -55.2, ze = -28.6;
    a.boite(0.1, 1.7, 0.1, BOIS_F, { x: xe, y: y + 0.8, z: ze }).boite(0.05, 0.56, 1.5, '#efe6cf', { x: xe + 0.07, y: y + 1.32, z: ze });
    ecrire({ x: xe + 0.1, y, z: ze, ry: PI / 2 }, { texte: '遊雪エリア', sous: 'ゆきあそび ひろば', x: 0, y: 1.32, z: 0, l: 1.4, h: 0.48, fond: null, encre: '#2f5aa0' });
    monde.cercle(xe, ze, 0.4);
    // l'igloo qu'on apprend à bâtir (イグルーづくり体験) : des blocs de neige sciés, en rangs, pas encore fermé
    const xi = -63.2, zi = -39.2;
    for (let r = 0; r < 4; r++) {
      const n = 11 - r, R0 = 1.75 - 0.2 * r - 0.03 * r * r;
      for (let k = 0; k < n; k++) {
        const t = (k + (r % 2) * 0.5) / n * 2 * PI;
        if (r < 3 && Math.abs(((t + PI * 0.5) % (2 * PI)) - PI) > PI - 0.34) continue; // (l'entrée, vers le sud)
        if (r === 3 && k % 3 === 0) continue; // (le dernier rang n'est pas fini)
        a.boite(0.78 - 0.05 * r, 0.4, 0.34, TAILLEE, { x: xi + Math.cos(t) * R0, y: y + 0.2 + r * 0.4, z: zi + Math.sin(t) * R0, ry: -t + PI / 2, rx: 0.12 * r, ordre: 'YXZ', nuance: 0.03 });
      }
    }
    for (const [u, v] of [[2.2, 0.6], [2.6, 1.3], [2.0, 1.5]]) a.boite(0.74, 0.4, 0.34, TAILLEE, { x: xi + u, y: y + 0.2, z: zi + v, ry: u, nuance: 0.03 });
    a.boite(0.74, 0.4, 0.34, TAILLEE, { x: xi + 2.3, y: y + 0.6, z: zi + 1.05, ry: 0.5, nuance: 0.03 });
    monde.cercle(xi, zi, 2.25); monde.cercle(xi + 2.3, zi + 1.1, 1.2);
    // la famille de bonshommes de neige (雪だるま : deux boules, un seau sur la tête, des yeux de charbon, des bras de bois)
    for (const [bx, bz, s, c] of [[-70.6, -16.2, 1.2, '#2f6ab0'], [-69.1, -15.0, 0.95, '#c8372d'], [-68.0, -16.4, 0.62, '#e8b23a']]) {
      a.boule(0.52 * s, NEIGE, { x: bx, y: y + 0.44 * s, z: bz }, 2).boule(0.36 * s, NEIGE, { x: bx, y: y + 1.12 * s, z: bz }, 2);
      a.cylindre(0.2 * s, 0.25 * s, 0.26 * s, 10, c, { x: bx, y: y + 1.52 * s, z: bz, rz: 0.12 });
      for (const u of [-1, 1]) { a.boule(0.04 * s, NOIR, { x: bx + u * 0.13 * s, y: y + 1.2 * s, z: bz + 0.32 * s, trait: false }, 1); a.baton([bx + u * 0.4 * s, y + 0.62 * s, bz], [bx + u * 0.85 * s, y + 0.95 * s, bz + 0.1], 0.02 * s, BOIS_F, 4, { trait: false }); }
      a.cone(0.045 * s, 0.2 * s, 6, '#e07a2a', { x: bx, y: y + 1.11 * s, z: bz + 0.42 * s, rx: PI / 2, trait: false });
      monde.cercle(bx, bz, 0.9 * s + 0.12);
    }
    // l'atelier des lanternes de neige (雪灯ろうづくり) : une table basse, des seaux, des truelles ; le rang des lanternes des enfants, au bord
    const b = morceau(ATELIER.x, ATELIER.z), X = ATELIER.x, Z = ATELIER.z;
    b.boite(2.4, 0.06, 0.85, '#b8935a', { x: X, y: y + 0.62, z: Z });
    for (const u of [-1.05, 1.05]) for (const v of [-0.32, 0.32]) b.boite(0.07, 0.6, 0.07, BOIS_F, { x: X + u, y: y + 0.3, z: Z + v });
    for (const [u, c] of [[-0.85, '#2f6ab0'], [-0.3, '#e8b23a'], [0.7, '#2f8a4a']]) b.cylindre(0.15, 0.12, 0.26, 10, c, { x: X + u, y: y + 0.79, z: Z + 0.05 });
    b.piece(new THREE.LatheGeometry([new THREE.Vector2(0.15, 0), new THREE.Vector2(0.15, 0.2), new THREE.Vector2(0.11, 0.28), new THREE.Vector2(0.001, 0.31)], 8), TAILLEE, { x: X + 0.22, y: y + 0.65, z: Z - 0.08 });
    b.boite(0.08, 0.02, 0.3, '#c8ccd0', { x: X + 1.0, y: y + 0.67, z: Z - 0.1, ry: 0.5, trait: false });
    murRect(X, Z, 1.2, 0.43, 0.22);
    for (const u of [-0.55, 0.55]) b.boite(0.08, 1.9, 0.08, BOIS_F, { x: X + u - 2.6, y: y + 0.9, z: Z + 1.6 });
    b.boite(1.35, 0.6, 0.05, '#efe6cf', { x: X - 2.6, y: y + 1.5, z: Z + 1.56 });
    ecrire({ x: X - 2.6, y, z: Z + 1.53, ry: PI }, { texte: '雪灯ろうづくり', sous: 'たいけん', x: 0, y: 1.5, z: 0, l: 1.25, h: 0.5, fond: null, encre: '#b8322a' });
    murRect(X - 2.6, Z + 1.6, 0.6, 0.06, 0.22);
    for (let k = 0; k < 6; k++) lanterne(-64.6 + k * 1.55 + 0.3 * hasard(k, 61), -13.25, PI, { s: 0.72 + 0.4 * hasard(k, 63) });
  }

  // ---------------------------------------------------------------- Le haut du château (本丸) : le sanctuaire 葵神社, le grand feu, la vue, le départ de la bouée
  const FEU = { x: 23.2, z: -93.4 };
  const VUE = { x: 29.4, z: -88.4 };
  const SLIDER = { x: PISTE[0][0], z: -97.2 };
  {
    const y = Y3, a = morceau(0, -88);
    // le petit sanctuaire, à l'ouest, tourné vers l'est : son socle de pierre, sa niche de bois sous un toit de tuiles, ses marches, son tronc à offrandes
    const xs = -2.2, zs = -88;
    a.boite(2.9, 0.62, 2.6, PIERRE, { x: xs, y: y + 0.26, z: zs, nuance: 0.04 }).boite(0.5, 0.2, 1.3, PIERRE3, { x: xs + 1.7, y: y + 0.08, z: zs }).boite(0.42, 0.2, 1.3, PIERRE3, { x: xs + 1.52, y: y + 0.27, z: zs });
    a.boite(1.5, 1.3, 1.4, BOIS, { x: xs - 0.2, y: y + 1.2, z: zs, nuance: 0.03 }).boite(0.06, 0.95, 0.5, BOIS_F, { x: xs + 0.57, y: y + 1.12, z: zs - 0.27 }).boite(0.06, 0.95, 0.5, BOIS_F, { x: xs + 0.57, y: y + 1.12, z: zs + 0.27 });
    for (const s of [-1, 1]) a.boite(0.12, 1.36, 0.12, BOIS_F, { x: xs + 0.52, y: y + 1.22, z: zs + s * 0.66 }).boite(0.12, 1.36, 0.12, BOIS_F, { x: xs - 0.92, y: y + 1.22, z: zs + s * 0.66 });
    a.toitJapon(2.5, 2.5, 0.72, 0.1, { x: xs - 0.1, y: y + 1.9, z: zs, tuile: TUILE, tuile2: TUILE2, bord: TUILE_B, rangs: 8, murs: { l: 0.82, p: 0.74, y: -0.03, c: BOIS_F } });
    manteauPente(outils, a, xs - 0.1, y + 1.98, zs, 2.7, 2.7, 0.72, 0.34, 0.1);
    monde.bloc(xs - 1.45, xs + 1.25, zs - 1.3, zs + 1.3, y - 1, y + 3.2);
    a.tube([[xs + 0.62, y + 1.72, zs - 0.6], [xs + 0.66, y + 1.6, zs], [xs + 0.62, y + 1.72, zs + 0.6]], 0.035, '#c8b27a', { pas: 8, cotes: 5 });
    for (const dz of [-0.3, 0, 0.3]) a.boite(0.012, 0.2, 0.07, '#fbf6ea', { x: xs + 0.67, y: y + 1.52, z: zs + dz, trait: false });
    murRect(xs + 0.1, zs, 1.75, 1.3, 0.22);
    // (le tronc à offrandes, devant ; deux lanternes de pierre coiffées de neige)
    a.boite(0.5, 0.42, 0.8, BOIS_F, { x: xs + 2.75, y: y + 0.26, z: zs }).boite(0.56, 0.05, 0.86, BOIS, { x: xs + 2.75, y: y + 0.49, z: zs });
    for (let k = 0; k < 5; k++) a.boite(0.42, 0.03, 0.035, BOIS_N, { x: xs + 2.75, y: y + 0.525, z: zs - 0.28 + k * 0.14, trait: false });
    murRect(xs + 2.75, zs, 0.25, 0.4, 0.22);
    for (const s of [-1, 1]) { a.lanterne(xs + 3.3, zs + s * 1.7, 5.2, y - 0.1); a.boule(0.3, NEIGE, { x: xs + 3.3, y: y + 1.42, z: zs + s * 1.7, sy: 0.55 }, 1); monde.cercle(xs + 3.3, zs + s * 1.7, 0.5); }
    // le torii de pierre, sur l'axe ; la borne au nom du sanctuaire
    const xt = 5.6;
    for (const s of [-1, 1]) { a.cylindre(0.15, 0.18, 3.3, 10, PIERRE3, { x: xt, y: y + 1.5, z: zs + s * 1.5, rz: 0 }); monde.cercle(xt, zs + s * 1.5, 0.42); }
    a.boite(0.3, 0.24, 4.3, PIERRE3, { x: xt, y: y + 3.12, z: zs }).boite(0.22, 0.2, 3.5, PIERRE3, { x: xt, y: y + 2.55, z: zs });
    manteau(outils, a, 0.44, 4.4, 0.2, { x: xt, y: y + 3.32, z: zs });
    const xb = 6.6, zb = -85.2;
    a.boite(0.3, 1.7, 0.3, PIERRE, { x: xb, y: y + 0.8, z: zb }).boule(0.2, NEIGE, { x: xb, y: y + 1.7, z: zb, sy: 0.6 }, 1);
    ecrire({ x: xb + 0.155, y, z: zb, ry: PI / 2 }, { texte: '葵神社', x: 0, y: 0.95, z: 0, l: 0.22, h: 1.1, fond: null, encre: '#2a2420', vertical: true });
    monde.cercle(xb, zb, 0.42);

    // le grand feu d'alerte (のろし), au bord nord-est : un bûcher de rondins, de paille et de branches de cèdre dans un cercle de pierres, prêt à brûler
    const f = morceau(FEU.x, FEU.z);
    for (let k = 0; k < 9; k++) { const t = (k / 9) * 2 * PI; f.rocher(FEU.x + Math.cos(t) * 1.15, y + 0.12, FEU.z + Math.sin(t) * 1.15, 0.27 + 0.08 * hasard(k, 71), k % 2 ? PIERRE : PIERRE2); }
    for (let k = 0; k < 8; k++) { const t = (k / 8) * 2 * PI + 0.2; f.baton([FEU.x + Math.cos(t) * 0.85, y + 0.05, FEU.z + Math.sin(t) * 0.85], [FEU.x - Math.cos(t) * 0.12, y + 2.05, FEU.z - Math.sin(t) * 0.12], 0.075, k % 2 ? '#7a5a40' : '#6a4a34', 6); }
    for (let k = 0; k < 6; k++) { const t = (k / 6) * 2 * PI; f.cone(0.34, 0.75, 6, k % 2 ? '#c8ac6a' : '#b89a58', { x: FEU.x + Math.cos(t) * 0.5, y: y + 0.48, z: FEU.z + Math.sin(t) * 0.5, rz: Math.cos(t) * 0.4, rx: -Math.sin(t) * 0.4 }); }
    for (let k = 0; k < 5; k++) { const t = (k / 5) * 2 * PI + 0.5; f.cone(0.3, 0.6, 5, k % 2 ? '#3d6f45' : '#2f5a3a', { x: FEU.x + Math.cos(t) * 0.42, y: y + 1.15, z: FEU.z + Math.sin(t) * 0.42, rz: Math.cos(t) * 0.7, rx: -Math.sin(t) * 0.7, sorte: 'conifere' }); }
    f.tube([[FEU.x + 0.3, y + 1.55, FEU.z + 0.14], [FEU.x, y + 1.62, FEU.z - 0.33], [FEU.x - 0.3, y + 1.55, FEU.z + 0.14], [FEU.x + 0.3, y + 1.55, FEU.z + 0.14]], 0.03, '#c8b27a', { pas: 10, cotes: 5 });
    monde.cercle(FEU.x, FEU.z, 1.7);
    // son écriteau, côté chemin
    const xp = FEU.x - 2.6, zp = FEU.z + 1.5;
    f.boite(0.1, 1.5, 0.1, BOIS_F, { x: xp, y: y + 0.7, z: zp }).boite(0.9, 0.62, 0.05, '#efe6cf', { x: xp, y: y + 1.22, z: zp + 0.07 });
    ecrire({ x: xp, y, z: zp + 0.1, ry: 0 }, { texte: 'のろし', sous: '狼煙　上杉謙信の合図の火', x: 0, y: 1.22, z: 0, l: 0.82, h: 0.5, fond: null, encre: '#2a2420' });
    monde.cercle(xp, zp, 0.42);

    // la table d'orientation, au bord est, au-dessus de la rivière ; un banc
    const v = morceau(VUE.x, VUE.z);
    v.boite(0.14, 0.9, 0.14, BOIS_F, { x: VUE.x, y: y + 0.4, z: VUE.z }).boite(0.7, 0.05, 1.3, '#efe6cf', { x: VUE.x - 0.05, y: y + 0.92, z: VUE.z, rz: 0.5 });
    ecrire({ x: VUE.x - 0.05, y, z: VUE.z, ry: -PI / 2 }, { texte: '千曲川', sous: 'ちくまがわ', x: 0, y: 0.955, z: 0.02, l: 1.2, h: 0.5, fond: null, encre: '#2f4a6a', incline: 1.07 });
    murRect(VUE.x - 0.05, VUE.z, 0.4, 0.68, 0.22);
    const xbn = 26.2, zbn = -84.2;
    v.boite(0.4, 0.06, 1.9, BOIS, { x: xbn, y: y + 0.45, z: zbn }).boite(0.3, 0.4, 0.07, BOIS_F, { x: xbn, y: y + 0.21, z: zbn - 0.75 }).boite(0.3, 0.4, 0.07, BOIS_F, { x: xbn, y: y + 0.21, z: zbn + 0.75 });
    murRect(xbn, zbn, 0.2, 0.95, 0.2);
    bancs.push({ de: [xbn, zbn - 0.75], a: [xbn, zbn + 0.75], y: y + 0.48, cap: PI / 2 });

    // le départ de la descente en bouée : son portique, les bouées en pile, des filets orange au bord
    const s = morceau(SLIDER.x, SLIDER.z), zs0 = -98.0;
    for (const sx of [-1, 1]) { s.baton([SLIDER.x + sx * 1.9, y - 0.3, zs0], [SLIDER.x + sx * 1.9, y + 3.0, zs0], 0.06, '#2f6ab0', 8); monde.cercle(SLIDER.x + sx * 1.9, zs0 + 0.2, 0.36); }
    s.boite(4.1, 0.62, 0.05, '#2f6ab0', { x: SLIDER.x, y: y + 2.72, z: zs0 });
    ecrire({ x: SLIDER.x, y, z: zs0 + 0.04, ry: 0 }, { texte: 'スノースライダー', x: 0, y: 2.72, z: 0, l: 3.6, h: 0.5, fond: null, encre: '#fbf6ea' });
    // (la pile et le moniteur à l'est de la porte : plus près du torii du sanctuaire, qui parlait au moniteur avait la caméra entre ses piliers)
    const xpile = 10.9, zpile = -97.3;
    for (let k = 0; k < 5; k++) s.piece(new THREE.TorusGeometry(0.4, 0.17, 6, 12), ['#2f6ab0', '#d8402c', '#e8b23a', '#2f8a4a', '#2f6ab0'][k], { x: xpile + 0.05 * Math.sin(k * 2), y: y + 0.17 + k * 0.3, z: zpile + 0.05 * Math.cos(k * 3), rx: PI / 2 });
    s.piece(new THREE.TorusGeometry(0.4, 0.17, 6, 12), '#d8402c', { x: xpile + 1.0, y: y + 0.42, z: zpile - 0.15, rx: 0.35, rz: 0.2 });
    monde.cercle(xpile + 0.5, zpile - 0.05, 1.3);
    for (const sx of [-1, 1]) for (let k = 0; k < 2; k++) {
      const z0 = -99.2 - k * 2.2, [xa] = surPiste(z0), [xb2] = surPiste(z0 - 2.2), ya = terrain(xa + sx * 2.5, z0), yb = terrain(xb2 + sx * 2.5, z0 - 2.2);
      s.baton([xa + sx * 2.5, ya - 0.2, z0], [xa + sx * 2.5, ya + 1.0, z0], 0.022, ACIER_F, 5).baton([xb2 + sx * 2.5, yb - 0.2, z0 - 2.2], [xb2 + sx * 2.5, yb + 1.0, z0 - 2.2], 0.022, ACIER_F, 5);
      s.boite(0.03, 0.72, Math.hypot(2.2, xb2 - xa), '#f08a2a', { x: (xa + xb2) / 2 + sx * 2.5, y: (ya + yb) / 2 + 0.6, z: z0 - 1.1, ry: Math.atan2(xb2 - xa, -2.2), rx: Math.atan2(yb - ya, 2.2), ordre: 'YXZ', trait: false });
    }
  }
  // le long de la piste : des fanions sur des bambous, tous les sept mètres ; en bas, le replat et son mur de neige, le portique d'arrivée
  {
    for (let z = -106, k = 0; z > -150; z -= 7, k++) {
      const [xp] = surPiste(z);
      for (const sx of [-1, 1]) {
        const x = xp + sx * 3.1, y = terrain(x, z), a = morceau(x, z), c = ['#d8402c', '#2f6ab0', '#e8b23a'][(k + (sx > 0 ? 1 : 0)) % 3];
        a.baton([x, y - 0.4, z], [x, y + 2.2, z], 0.022, '#9aa860', 5);
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0.62, -0.17, 0, 0, -0.36, 0, 0, 0, 0, 0, -0.36, 0, 0.62, -0.17, 0], 3));
        a.piece(g, c, { x, y: y + 2.2, z, ry: 0.4 + k, trait: false });
      }
    }
    const zb = -160.5, [xa] = surPiste(zb), a = morceau(xa, zb), y = terrain(xa, zb);
    for (const sx of [-1, 1]) a.baton([xa + sx * 3.2, y - 0.3, zb + 4], [xa + sx * 3.2, y + 3.0, zb + 4], 0.06, '#d8402c', 8);
    a.boite(6.5, 0.62, 0.05, '#d8402c', { x: xa, y: y + 2.72, z: zb + 4 });
    ecrire({ x: xa, y, z: zb + 4.04, ry: 0 }, { texte: 'ゴール', sous: 'GOAL', x: 0, y: 2.72, z: 0, l: 2.6, h: 0.52, fond: null, encre: '#fbf6ea' });
    // (une motoneige et son traîneau, pour remonter les bouées)
    a.boite(0.8, 0.5, 2.0, '#e8b23a', { x: xa + 5.2, y: y + 0.45, z: zb + 1.5, ry: 0.4 }).boite(0.7, 0.3, 0.9, '#2f2c30', { x: xa + 5.05, y: y + 0.8, z: zb + 1.15, ry: 0.4 }).boite(0.75, 0.3, 0.5, '#9fc4d8', { x: xa + 5.5, y: y + 0.92, z: zb + 2.1, ry: 0.4, rx: -0.5, ordre: 'YXZ' });
    a.boite(1.0, 0.24, 1.8, '#c8402c', { x: xa + 4.1, y: y + 0.22, z: zb - 1.1, ry: 0.4 });
  }
  // le coin de Bunbuku, au tournant de la montée : sous un grand pin chargé de neige, son lampion rouge sur un bambou
  const MARCHAND = { x: 45.6, z: -70.6, cap: -PI / 2 - 0.25 };
  {
    const xl = 47.3, zl = -68.5, y = terrain(xl, zl), a = morceau(xl, zl);
    a.baton([xl, y - 0.4, zl], [xl, y + 2.3, zl], 0.03, '#a89a5e', 6);
    a.chochin(xl, y + 2.06, zl - 0.04, 1.1);
    lumieres.push({ x: xl, y: y + 2.06, z: zl - 0.04, halo: 0.42, sol: terrain(45.6, -70.6), r: 3.4 });
  }

  // ---------------------------------------------------------------- Les arbres : les cerisiers nus du parc (c'est le coin des cerisiers d'Iiyama, au printemps), les cèdres sous la neige
  const dPiste = (x, z) => { if (z > -95 || z < -170) return 99; return Math.abs(x - surPiste(z)[0]); };
  // (ce qui cacherait les crêtes du nord-ouest, vues de là où l'on regarde les feux du secret, au bord du haut du château : pas d'arbre dont la cime y monte)
  const cacheLaVue = (x, z, cime) => {
    const dx = x - (FEU.x + 9.5), dz = z - (FEU.z + 12.5), d = Math.hypot(dx, dz), cap = Math.atan2(dx, -dz) * 57.2958;
    return d < 400 && cap > -74 && cap < -16 && Math.atan2(cime - (Y3 + 5.2), d) * 57.2958 > 3.5;
  };
  const libreArbre = (x, z, marge = 2.6) => dTable(x, z) > marge && dPiste(x, z) > 5.5;
  const cerisier = (x, z, h = 6.5) => {
    if (!libreArbre(x, z)) return;
    const y = terrain(x, z);
    if (cacheLaVue(x, z, y + h * 1.05)) return;
    morceau(x, z).arbreTouffu(x, z, h, ['#d8a8b8', '#e0b4c2'], { y, bas: y - 1.5, sorte: 'houppierCerisier', caduc: true, graine: hasard(x, z), tronc: '#4f3f38', large: 1.3 });
  };
  // (les feux d'artifice de la boutique de Bunbuku, vus de chez lui : ils montent à l'est-sud-est, au-dessus de la rivière ; pas d'arbre à
  // moins de trente mètres dans cette direction — deux cèdres à six mètres, et le bois derrière, n'en laissaient voir que des miettes)
  const cacheLesFeux = (x, z) => { const dx = x - MARCHAND.x, dz = z - MARCHAND.z, a = Math.atan2(dz, dx) * 57.2958; return Math.hypot(dx, dz) < 30 && a > -10 && a < 44; };
  const cedre = (x, z, h = 11, loin = false) => {
    if (!libreArbre(x, z, 2.2)) return;
    const y = terrain(x, z);
    if (cacheLaVue(x, z, y + h) || cacheLesFeux(x, z)) return;
    // (un étage de branches sur deux est blanc : la neige qui charge les cèdres, tout l'hiver)
    morceau(x, z, loin ? 80 : 40).sugi(x, z, h, { y, bas: y - 1.6, loin, vert: '#e4ebf3', vertFonce: hasard(z, x) > 0.5 ? '#3f6a4c' : '#365f45' });
  };
  {
    // autour de la grande terrasse, derrière les sculptures ; le long de la montée ; autour du haut du château (sauf la piste et la vue de l'est)
    for (let x = -37; x <= 37; x += 9.2) cerisier(x + 2 * (hasard(x, 1) - 0.5), -61.2 - 2.5 * hasard(x, 2), 6.2 + 1.6 * hasard(x, 3));
    for (const [x, z] of [[-45.2, -49], [-45.6, -40.5], [-45, -14], [45.2, -45.5], [45.6, -37], [45, -22.5], [44.6, -13], [-9, 7.5], [9.2, 6.5], [-10.4, -3], [10.8, -2.2], [-21, 12.5], [19.5, 12], [-33, 8], [33.5, 6]]) cerisier(x, z, 5.8 + 2 * hasard(x, z));
    for (let k = 0; k < 14; k++) {
      const t = (k / 14) * 2 * PI + 0.2, x = HONMARU.x + Math.cos(t) * (HONMARU.rx + 4.2), z = HONMARU.z + Math.sin(t) * (HONMARU.rz + 4.2);
      if (Math.abs(x - 2.5) < 9 && z < -92) continue;
      if (x > 30 && Math.abs(z + 88) < 9) continue;
      cerisier(x, z, 6 + 1.8 * hasard(k, 7));
    }
    // les cèdres : à l'ouest du coin des enfants, sur la pente nord de part et d'autre de la piste, vers la rivière, au coin de Bunbuku
    for (let x = -96; x < -77; x += 5.5) for (let z = -50; z < -4; z += 6.2) cedre(x + 3 * hasard(x, z), z + 3 * hasard(z, x), 9 + 5 * hasard(x + 1, z));
    for (let z = -103; z > -168; z -= 6.5) for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) {
      const x = surPiste(z)[0] + sx * (8.5 + k * 7 + 3 * hasard(z, k + sx));
      cedre(x, z + 3 * hasard(k, z), 9 + 6 * hasard(x, z), k > 0);
    }
    for (let x = 52; x < 84; x += 7.5) for (let z = -104; z < -18; z += 8.5) cedre(x + 4 * hasard(x, z), z + 4 * hasard(z, x), 8 + 5 * hasard(x, z + 1), x > 60);
    for (const [x, z, h] of [[50.6, -75.4, 12], [47.4, -76.2, 9], [42.8, -75.6, 10]]) cedre(x, z, h);
    for (const [x, z] of [[36, 14], [41, 22], [38, 33], [-36, 16], [-41, 27], [-37.5, 37]]) cedre(x, z, 8 + 3 * hasard(x, z));
    // la crête boisée, entre le château et le village des kamakura : des cèdres serrés (les plus loin, plus simples)
    for (let z = -172; z > -268; z -= 8.2) for (let x = -100; x < 96; x += 8.6) {
      const px = x + 5 * hasard(x, z), pz = z + 5 * hasard(z, x);
      if (Math.abs(pz + 166.5) < 9 && Math.abs(px + 1) < 11) continue;
      cedre(px, pz, 10 + 7 * hasard(px, pz), pz < -184 && pz > -262);
    }
  }

  // ================================================================ LA PARTIE B : LE VILLAGE DES KAMAKURA (かまくらの里, à 信濃平)
  // ---------------------------------------------------------------- L'arrivée : la navette, la cuisine du restaurant, l'arche
  const NAVETTE_B = { x: 7.4, z: -288.4, ry: PI / 2 };
  // (à 5,6 m de la traverse : collée à elle, la caméra de qui s'y tenait en regardant le village était dans la baraque, son toit devant l'image)
  const CUISINE = { x: -24, z: -294.6, l: 13, p: 5.6 };
  const MARMITE = { x: -19.6, z: -306.4 };
  {
    const a = morceau(NAVETTE_B.x, NAVETTE_B.z), y = YB;
    minibus(outils, a, repere(NAVETTE_B.x, NAVETTE_B.z, NAVETTE_B.ry), y + 0.03, ecrire, NAVETTE_B);
    murRect(NAVETTE_B.x, NAVETTE_B.z, 3.25, 1.12);
    monde.bloc(NAVETTE_B.x - 3.15, NAVETTE_B.x + 3.15, NAVETTE_B.z - 1.05, NAVETTE_B.z + 1.05, YB - 1, YB + 2.6);
    const xa = -1.6, za = -291.4;
    a.baton([xa, y, za], [xa, y + 2.3, za], 0.035, ACIER, 6).cylindre(0.2, 0.2, 0.08, 10, ACIER_F, { x: xa, y: y + 0.06, z: za });
    a.boite(0.62, 0.62, 0.05, '#2f6aa0', { x: xa, y: y + 2.0, z: za - 0.06 }).boite(0.56, 0.5, 0.05, '#f4f2ea', { x: xa, y: y + 1.36, z: za - 0.06 });
    ecrire({ x: xa, y, z: za - 0.09, ry: PI }, { texte: 'シャトルバス', x: 0, y: 2.0, z: 0, l: 0.54, h: 0.2, fond: null, encre: '#f4f2ea' });
    ecrire({ x: xa, y, z: za - 0.09, ry: PI }, { texte: '飯山城址公園', sous: '雪まつり会場 ゆき', x: 0, y: 1.36, z: 0, l: 0.5, h: 0.4, fond: null, encre: '#2a3a4a' });
    monde.cercle(xa, za, 0.25);
    // la cuisine du restaurant (レストランかまくら村) : une longue baraque de bois sous un gros toit de neige, sa cheminée qui fume ; son enseigne
    const C = CUISINE, b = morceau(C.x, C.z);
    b.boite(C.l, 3.0, C.p, '#7a6048', { x: C.x, y: y + 1.5, z: C.z, nuance: 0.03 });
    b.pignon(C.l + 0.9, 1.5, C.p + 1.1, TUILE, { x: C.x, y: y + 2.98, z: C.z });
    b.pignon(C.l + 1.2, 1.62, C.p + 1.5, NEIGE, { x: C.x, y: y + 3.4, z: C.z, nuance: 0.015 });
    for (const dx of [-4.2, 0, 4.2]) b.boite(1.8, 1.0, 0.07, BOIS_N, { x: C.x + dx, y: y + 1.9, z: C.z - C.p / 2 - 0.02 }).boite(1.6, 0.82, 0.06, P.shoji, { x: C.x + dx, y: y + 1.9, z: C.z - C.p / 2 - 0.05, trait: false });
    b.boite(0.5, 1.6, 0.5, ACIER_F, { x: C.x + 4.6, y: y + 4.5, z: C.z + 0.6 });
    vapeurs.push({ x: C.x + 4.6, z: C.z + 0.6, y: y + 5.4, n: 8, haut: 4.5, large: 0.5, taille: 1.1, opacite: 0.5 });
    b.boite(5.4, 0.8, 0.08, '#3a2c24', { x: C.x, y: y + 3.05, z: C.z - C.p / 2 - 0.3 });
    ecrire({ x: C.x, y, z: C.z - C.p / 2 - 0.345, ry: PI }, { texte: 'レストランかまくら村', sous: '信濃平 かまくらの里', x: 0, y: 3.05, z: 0, l: 5.0, h: 0.66, fond: null, encre: '#f4ead2' });
    monde.bloc(C.x - C.l / 2 - 0.5, C.x + C.l / 2 + 0.5, C.z - C.p / 2 - 0.7, C.z + C.p / 2 + 0.7, y - 1, y + 5.2);
    // devant, la grande marmite de démonstration sur son fourneau, sous un auvent : c'est là qu'on commande sa のろし鍋
    const M0 = MARMITE, c = morceau(M0.x, M0.z);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.boite(0.1, 2.5, 0.1, BOIS_F, { x: M0.x + sx * 1.6, y: y + 1.2, z: M0.z + sz * 1.1 });
    c.boite(3.7, 0.1, 2.9, '#8a6a4a', { x: M0.x, y: y + 2.5, z: M0.z, rx: 0.1 });
    manteau(outils, c, 3.9, 3.1, 0.36, { x: M0.x, y: y + 2.76, z: M0.z, rx: 0.1 });
    c.boite(1.5, 0.75, 0.9, '#5a5a5e', { x: M0.x, y: y + 0.37, z: M0.z }).cylindre(0.52, 0.46, 0.5, 16, '#2f2c30', { x: M0.x, y: y + 0.99, z: M0.z }).cylindre(0.49, 0.49, 0.02, 16, '#b8763a', { x: M0.x, y: y + 1.23, z: M0.z, trait: false });
    for (let k = 0; k < 7; k++) c.boule(0.07, ['#e8e0c8', '#d8452e', '#3f8a4a', '#c8a06a'][k % 4], { x: M0.x + 0.28 * Math.cos(k * 0.9), y: y + 1.25, z: M0.z + 0.28 * Math.sin(k * 0.9), sy: 0.5, trait: false }, 1);
    vapeurs.push({ x: M0.x, z: M0.z, y: y + 1.35, n: 7, haut: 2.6, large: 0.3, taille: 0.7, opacite: 0.5 });
    c.boite(0.05, 0.9, 1.3, '#b8322a', { x: M0.x - 1.7, y: y + 1.5, z: M0.z });
    ecrire({ x: M0.x - 1.73, y, z: M0.z, ry: -PI / 2 }, { texte: 'のろし鍋', x: 0, y: 1.5, z: 0, l: 0.3, h: 1.1, fond: null, encre: '#fbf6ea', vertical: true });
    murRect(M0.x, M0.z, 0.8, 0.5, 0.25);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) monde.cercle(M0.x + sx * 1.6, M0.z + sz * 1.1, 0.3);
    lumieres.push({ x: M0.x, y: y + 2.2, z: M0.z, halo: 0.35, sol: y, r: 4.5 });
    // de l'autre côté de l'allée : le panneau qui raconte comment on bâtit un kamakura ; des luges à louer, en pile
    const xi = 16.5, zi = -309.0, d = morceau(xi, zi);
    for (const u of [-1.0, 1.0]) d.boite(0.1, 2.0, 0.1, BOIS_F, { x: xi + u, y: y + 0.9, z: zi });
    d.boite(2.3, 1.2, 0.06, '#efe6cf', { x: xi, y: y + 1.3, z: zi + 0.05 });
    manteau(outils, d, 2.5, 0.4, 0.16, { x: xi, y: y + 2.02, z: zi });
    ecrire({ x: xi, y, z: zi + 0.085, ry: 0 }, { texte: 'かまくらのつくりかた', sous: 'かまくら応援隊', x: 0, y: 1.3, z: 0, l: 2.1, h: 1.0, fond: null, encre: '#2a2420', lignes: 4 });
    murRect(xi, zi, 1.15, 0.12, 0.25);
    const xl = 26.6, zl = -305;
    for (let k = 0; k < 6; k++) d.boite(0.5, 0.09, 1.0, ['#d8402c', '#2f6ab0', '#e8b23a'][k % 3], { x: xl + 0.03 * (k % 2), y: y + 0.08 + k * 0.1, z: zl, ry: 0.06 * k });
    d.boite(0.5, 0.09, 1.0, '#2f8a4a', { x: xl - 0.95, y: y + 0.3, z: zl + 0.1, rz: 1.05, ry: 0.2 });
    monde.cercle(xl, zl, 0.86); monde.mur(xl - 0.95, zl - 0.4, xl - 0.95, zl + 0.6, 0.45);
  }
  // l'arche blanche de l'entrée (« 信州飯山 かまくらの里 — KAMAKURA Snow Dome Village ») : ses deux pieds (« Welcome », le dessin d'un kamakura), son arc
  {
    const a = morceau(ARCHE.x, ARCHE.z), y = YB, X = ARCHE.x, Z = ARCHE.z, DX = 4.15, HP = 2.0, FL = 1.9, RC = (DX * DX + FL * FL) / (2 * FL), YC = HP + FL - RC, E = 0.85, EP = 0.26;
    for (const sx of [-1, 1]) { a.boite(1.0, HP + 0.5, EP, '#f4f2ec', { x: X + sx * DX, y: y + (HP + 0.5) / 2 - 0.3, z: Z }); monde.cercle(X + sx * DX, Z, 0.62); }
    // l'arc : une bande plate entre deux rayons, d'un pied à l'autre (un seul morceau : ses faces ne se recouvrent pas)
    const pos = [], n = 20, t0 = Math.asin((DX + 0.5) / (RC + E / 2));
    for (let k = 0; k < n; k++) {
      const ta = -t0 + (k / n) * 2 * t0, tb = -t0 + ((k + 1) / n) * 2 * t0, q = (t, r, dz) => [Math.sin(t) * r, YC + Math.cos(t) * r, dz];
      const A = q(ta, RC - E / 2, EP / 2), B = q(tb, RC - E / 2, EP / 2), C = q(tb, RC + E / 2, EP / 2), D = q(ta, RC + E / 2, EP / 2), A2 = q(ta, RC - E / 2, -EP / 2), B2 = q(tb, RC - E / 2, -EP / 2), C2 = q(tb, RC + E / 2, -EP / 2), D2 = q(ta, RC + E / 2, -EP / 2);
      pos.push(...A, ...C, ...B, ...A, ...D, ...C, ...B2, ...C2, ...A2, ...A2, ...C2, ...D2, ...D, ...D2, ...C2, ...D, ...C2, ...C, ...A, ...B, ...B2, ...A, ...B2, ...A2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    a.piece(g, '#f4f2ec', { x: X, y, z: Z, nuance: 0.015 });
    // ce qui est écrit : en rouge sombre, le long de l'arc ; sur les deux faces
    const LW = 2 * DX + 2.4, LH = HP + FL + E / 2 + 0.2;
    const peindre = (c, W, H) => {
      const k = W / LW, cx = W / 2, cy = H - (YC * k) - 0.0 * k, ecrireArc = (texte, tMilieu, taille, r, espace) => {
        c.font = `800 ${taille * k}px "M PLUS Rounded 1c", sans-serif`;
        c.textAlign = 'center'; c.textBaseline = 'middle';
        const pas = (taille * espace) / r;
        [...texte].forEach((ch, i) => { const t = tMilieu + (i - (texte.length - 1) / 2) * pas; c.save(); c.translate(cx + Math.sin(t) * r * k, cy - Math.cos(t) * r * k); c.rotate(t); c.fillText(ch, 0, 0); c.restore(); });
      };
      c.fillStyle = '#7a1f28';
      ecrireArc('かまくらの里', 0.06, 0.6, RC, 1.08);
      ecrireArc('飯山', -0.43, 0.46, RC, 1.1);
      ecrireArc('信州', -0.62, 0.26, RC + 0.05, 1.1);
      ecrireArc('KAMAKURA', 0.56, 0.2, RC + 0.17, 0.72);
      ecrireArc('Snow Dome Village', 0.57, 0.15, RC - 0.12, 0.6);
    };
    for (const sens of [1, -1]) ecrire({ x: X, y, z: Z + sens * (EP / 2 + 0.02), ry: sens > 0 ? 0 : PI }, { texte: '', x: 0, y: LH / 2, z: 0, l: LW, h: LH, fond: null, encre: '#7a1f28', dessin: peindre, pixels: 108 });
    // les deux pieds : « Welcome » sur fond rouge sombre ; le dessin d'un kamakura
    const logo = (c, W, H) => { c.fillStyle = '#fbf8f2'; c.fillRect(0, 0, W, H); c.strokeStyle = '#7a1f28'; c.lineWidth = W * 0.06; c.strokeRect(W * 0.03, H * 0.03, W * 0.94, H * 0.94); c.fillStyle = '#e8862a'; c.beginPath(); c.arc(W / 2, H * 0.74, W * 0.33, Math.PI, 0); c.lineTo(W * 0.83, H * 0.8); c.lineTo(W * 0.17, H * 0.8); c.fill(); c.fillStyle = '#7a1f28'; c.beginPath(); c.arc(W / 2, H * 0.72, W * 0.12, Math.PI, 0); c.lineTo(W * 0.62, H * 0.8); c.lineTo(W * 0.38, H * 0.8); c.fill(); };
    for (const sens of [1, -1]) {
      ecrire({ x: X, y, z: Z + sens * (EP / 2 + 0.02), ry: sens > 0 ? 0 : PI }, { texte: 'Welcome', x: -sens * DX, y: 1.25, z: 0, l: 0.86, h: 0.62, fond: '#7a1f28', encre: '#fbf8f2' });
      ecrire({ x: X, y, z: Z + sens * (EP / 2 + 0.02), ry: sens > 0 ? 0 : PI }, { texte: '', x: sens * DX, y: 1.25, z: 0, l: 0.86, h: 0.86, fond: null, encre: '#7a1f28', dessin: logo });
    }
    manteau(outils, a, 2.4, 0.5, 0.3, { x: X, y: y + HP + FL + E / 2 + 0.1, z: Z });
    // les lanternes de neige de l'allée, des deux côtés, jusqu'au sanctuaire
    for (let z = Z - 3; z > ALLEE_B.z1 + 4; z -= 3.6) for (const sx of [-1, 1]) if (!TRAVERSES_B.some((t) => Math.abs(z - t) < 2.4)) lanterne(sx * 3.95, z, sx > 0 ? -PI / 2 : PI / 2, { mur: false });
  }

  // ---------------------------------------------------------------- Les kamakura : dix-huit huttes de neige, leur porte au sud, à l'abri du vent de la montagne
  // Celui où l'on s'installe pour la marmite : le premier à l'est de l'allée (un lampion rouge à sa porte).
  const MIEN = KAMAKURA.find((K) => K.id === 'k03');
  for (const K of KAMAKURA) {
    const a = morceau(K.x, K.z, 30), y = YB;
    kamakura(outils, a, K, y);
    monde.cercle(K.x, K.z, K.R + 0.33);
    // (la caméra n'y entre pas : qui sortait de la porte la voyait passer dans le dôme)
    monde.bloc(K.x - K.R * 0.72, K.x + K.R * 0.72, K.z - K.R * 0.72, K.z + K.R * 0.72, y - 1, y + K.h * 0.8);
    // (sa lumière : au-dessus de la table, sans halo — celle du réchaud et de la lampe ; à la porte, avec son halo, elle couvrait tout l'écran
    // pendant le repas, l'œil était dedans ; dans la niche du fond, elle laissait dans l'ombre le visage de qui mange face à la porte)
    { const c = Math.cos(K.ry || 0), s = Math.sin(K.ry || 0), d = 0.3; lumieres.push({ x: K.x + s * d, y: y + 0.95, z: K.z + c * d, halo: 0, sol: y, r: 4.2, c: '#f0a050' }); }
  }
  {
    const y = YB, a = morceau(MIEN.x, MIEN.z, 30), xl = MIEN.x + 1.35, zl = MIEN.z + MIEN.R + 0.15;
    a.baton([xl, y - 0.3, zl], [xl, y + 1.9, zl], 0.028, '#a89a5e', 6).chochin(xl, y + 1.68, zl + 0.05, 0.95);
    a.boite(0.05, 0.5, 0.26, '#efe6cf', { x: xl - 2.55, y: y + 1.15, z: zl + 0.1 }).baton([xl - 2.55, y - 0.3, zl + 0.1], [xl - 2.55, y + 1.42, zl + 0.1], 0.02, BOIS_F, 5);
    ecrire({ x: xl - 2.52, y, z: zl + 0.1, ry: PI / 2 }, { texte: 'ご予約席', x: 0, y: 1.15, z: 0, l: 0.22, h: 0.44, fond: null, encre: '#b8322a', vertical: true });
    lumieres.push({ x: xl, y: y + 1.68, z: zl + 0.05, halo: 0.36, sol: y, r: 2.6 });
  }

  // ---------------------------------------------------------------- Le sanctuaire de neige (かまくら神社) : le torii rouge, la grande hutte où l'on entre, l'autel
  {
    const S = SANCTUAIRE, y = YB, a = morceau(S.x, S.z, 30);
    kamakura(outils, a, { x: S.x, z: S.z, R: S.R, r: S.r, h: 3.9, ry: 0 }, y, S.porte + 0.12, 2.15, true);
    // (ce qui arrête : le tour du dôme, sauf la porte ; dedans, le cadre s'en charge)
    for (let k = 0; k < 22; k++) { const t = 0.42 + (k / 21) * (2 * PI - 0.84); monde.cercle(S.x + Math.sin(t) * (S.R - 0.2), S.z + Math.cos(t) * (S.R - 0.2), 0.62); }
    monde.toit(S.x - S.r, S.x + S.r, S.z - S.r, S.z + S.r, y + 2.5, y + 4.2);
    // le torii, devant la porte (laqué de rouge ; sa traverse du haut en noir), et sa corde sacrée
    const zt = ALLEE_B.z1 - 1.4;
    for (const sx of [-1, 1]) { a.cylindre(0.12, 0.14, 3.0, 10, '#c8372d', { x: sx * 1.55, y: y + 1.4, z: zt }); a.cylindre(0.17, 0.19, 0.3, 10, NOIR, { x: sx * 1.55, y: y + 0.08, z: zt }); monde.cercle(sx * 1.55, zt, 0.4); }
    a.boite(4.2, 0.2, 0.26, '#c8372d', { x: 0, y: y + 3.02, z: zt }).boite(4.5, 0.12, 0.34, NOIR, { x: 0, y: y + 3.18, z: zt }).boite(3.4, 0.17, 0.18, '#c8372d', { x: 0, y: y + 2.42, z: zt });
    manteau(outils, a, 4.6, 0.44, 0.2, { x: 0, y: y + 3.34, z: zt });
    // dedans, au fond : l'autel taillé dans la neige, la petite niche de bois de la divinité, sa corde de paille et ses papiers, le tronc à offrandes, deux bougies
    const za = S.z - S.r + 0.55;
    a.boite(2.2, 0.85, 0.8, TAILLEE, { x: 0, y: y + 0.4, z: za, sorte: 'lumiere' });
    a.boite(0.7, 0.62, 0.5, BOIS, { x: 0, y: y + 1.14, z: za }).pignon(0.9, 0.3, 0.7, BOIS_F, { x: 0, y: y + 1.44, z: za }).boite(0.3, 0.36, 0.03, '#e8c860', { x: 0, y: y + 1.1, z: za + 0.26, trait: false });
    a.tube([[-0.95, y + 2.0, za + 0.15], [0, y + 1.86, za + 0.3], [0.95, y + 2.0, za + 0.15]], 0.04, '#c8b27a', { pas: 10, cotes: 5 });
    for (const dx of [-0.5, 0, 0.5]) a.boite(0.1, 0.24, 0.012, '#fbf6ea', { x: dx, y: y + 1.7, z: za + 0.27, trait: false });
    for (const sx of [-1, 1]) { a.cylindre(0.03, 0.03, 0.2, 6, '#f4ead2', { x: sx * 0.8, y: y + 0.93, z: za + 0.1, trait: false }).cone(0.03, 0.09, 5, '#ffb347', { x: sx * 0.8, y: y + 1.08, z: za + 0.1, sorte: 'lampe', trait: false }); lumieres.push({ x: sx * 0.8, y: y + 1.1, z: za + 0.1, halo: 0.2, sol: y, r: 3.2, c: '#ffb45e', jour: true }); }
    a.boite(0.8, 0.42, 0.5, BOIS_F, { x: 0, y: y + 0.24, z: za + 1.0 }).boite(0.86, 0.05, 0.56, BOIS, { x: 0, y: y + 0.47, z: za + 1.0 });
    for (let k = 0; k < 5; k++) a.boite(0.035, 0.03, 0.42, BOIS_N, { x: -0.28 + k * 0.14, y: y + 0.505, z: za + 1.0, trait: false });
    murRect(0, za + 0.45, 1.1, 0.85, 0.18);
    // la borne de bois à son nom, sur le parvis
    const xb = 3.3, zb = ALLEE_B.z1 + 0.6;
    a.boite(0.2, 1.7, 0.2, BOIS, { x: xb, y: y + 0.8, z: zb }).cone(0.17, 0.14, 4, BOIS_F, { x: xb, y: y + 1.72, z: zb, ry: PI / 4 });
    ecrire({ x: xb, y, z: zb + 0.105, ry: 0 }, { texte: 'かまくら神社', x: 0, y: 0.95, z: 0, l: 0.17, h: 1.2, fond: null, encre: '#2a2420', vertical: true });
    monde.cercle(xb, zb, 0.36);
  }

  // ---------------------------------------------------------------- Le kamakura qu'on bâtit (le grand ballon rond, la neige soufflée dessus), la butte des luges, les maisons, la forêt
  const CHANTIER = { x: -25.5, z: -371.5 };
  const LUGES = { x: 52, z: -338 };
  {
    // Comme le font les habitants (かまくら応援隊) : on gonfle un grand ballon en dôme, on souffle la neige dessus, épais, on la tasse en la piétinant ;
    // quand elle tient, on dégonfle le ballon et on le retire.
    const C = CHANTIER, y = terrain(C.x, C.z), a = morceau(C.x, C.z, 30);
    a.piece(new THREE.SphereGeometry(2.25, 14, 8, 0, 2 * PI, 0, PI / 2), '#3f7fc4', { x: C.x, y: y - 0.05, z: C.z, sy: 1.08, nuance: 0.02 });
    a.piece(new THREE.LatheGeometry([new THREE.Vector2(2.95, -0.1), new THREE.Vector2(2.95, 0.5), new THREE.Vector2(2.8, 1.05), new THREE.Vector2(2.42, 1.55), new THREE.Vector2(2.02, 1.72)], 14), TAILLEE, { x: C.x, y, z: C.z, nuance: 0.03 });
    for (let k = 0; k < 9; k++) { const t = hasard(k, 81) * 6.28, r = 3.3 + 1.2 * hasard(k, 83); a.rocher(C.x + Math.cos(t) * r, terrain(C.x + Math.cos(t) * r, C.z + Math.sin(t) * r) + 0.1, C.z + Math.sin(t) * r, 0.2 + 0.25 * hasard(k, 85), NEIGE, { nuance: 0.02 }); }
    // la fraise à neige (une petite machine rouge, sa goulotte tournée vers le dôme), et une échelle couchée
    const xf = C.x + 4.3, zf = C.z + 1.6, yf = terrain(xf, zf);
    a.boite(0.7, 0.6, 1.1, '#d8402c', { x: xf, y: yf + 0.45, z: zf, ry: 0.5 }).boite(0.9, 0.5, 0.4, '#c8ccd0', { x: xf - 0.3, y: yf + 0.3, z: zf - 0.55, ry: 0.5 });
    a.baton([xf, yf + 0.7, zf], [xf - 0.5, yf + 1.5, zf - 0.3], 0.07, '#d8402c', 6).baton([xf + 0.2, yf + 0.7, zf + 0.5], [xf + 0.6, yf + 1.05, zf + 1.0], 0.02, '#2f2c30', 5);
    // l'écriteau, au bord du parvis du sanctuaire
    const xe = -5.6, ze = -371.9, ye = YB;
    a.boite(0.08, 1.4, 0.08, BOIS_F, { x: xe, y: ye + 0.65, z: ze }).boite(0.05, 0.5, 1.0, '#efe6cf', { x: xe + 0.06, y: ye + 1.15, z: ze });
    ecrire({ x: xe + 0.09, y: ye, z: ze, ry: PI / 2 }, { texte: 'かまくら製作中', sous: 'かまくら応援隊', x: 0, y: 1.15, z: 0, l: 0.92, h: 0.42, fond: null, encre: '#2a2420' });
    monde.cercle(xe, ze, 0.38);
    // la butte des luges (そり遊び), à l'est : des traces de glissade, des luges
    const b = morceau(LUGES.x, LUGES.z, 30);
    for (const [dx, dz, c, r] of [[-3.5, 2.5, '#d8402c', 0.4], [-2.2, 4.0, '#2f6ab0', -0.6], [1.5, -1.0, '#e8b23a', 1.2]]) { const yy = terrain(LUGES.x + dx, LUGES.z + dz); b.boite(0.5, 0.1, 1.0, c, { x: LUGES.x + dx, y: yy + 0.08, z: LUGES.z + dz, ry: r }); }
    // les grandes maisons de 信濃平 (des auberges de skieurs), au sud et à l'est de la route : de gros toits de neige
    for (const [mx, mz, l, p, h, ry, mur] of [[-44, -276.5, 15, 9, 6.2, 0.05, CREPI], [-66, -285, 12, 9, 5.6, -0.2, '#6b5746'], [40, -277, 16, 9.5, 6.4, -0.04, CREPI_G], [66, -279, 12, 9, 5.8, 0.1, '#5a4a3e'], [88, -292, 9, 15, 6.2, PI / 2, CREPI], [-28, -276, 9, 8, 5.2, 0.02, '#7a6048']]) {
      const m = morceau(mx, mz, 60), R = repere(mx, mz, ry), ym = terrain(mx, mz) - 1.2;
      m.boite(l, h + 1, p, mur, R(0, ym + h / 2 + 0.5, 0, { nuance: 0.03 }));
      m.pignon(l + 1.2, 2.6, p + 1.6, TUILE, R(0, ym + h + 0.98, 0)).pignon(l + 1.6, 2.75, p + 2.1, NEIGE, R(0, ym + h + 1.5, 0, { nuance: 0.015 }));
      for (let k = 0; k < Math.round(l / 3.4); k++) for (const yy of [2.6, 5.0]) m.boite(1.5, 1.1, 0.07, BOIS_N, R(-l / 2 + 1.8 + k * 3.3, ym + yy, -p / 2 - 0.02)).boite(1.34, 0.94, 0.06, P.shoji, R(-l / 2 + 1.8 + k * 3.3, ym + yy, -p / 2 - 0.05, { trait: false }));
    }
    // la forêt : les cèdres de la pente, à l'ouest et au nord (ceux du fond, plus simples) ; quelques-uns à l'est
    const cedreB = (x, z, h, loin) => { if (dTable(x, z) < 2.4 || Math.hypot(x - CHANTIER.x, z - CHANTIER.z) < 6.5 || (z > -293 && z < -285 && x > 14)) return; const yy = terrain(x, z); morceau(x, z, loin ? 80 : 40).sugi(x, z, h, { y: yy, bas: yy - 1.6, loin, vert: '#e4ebf3', vertFonce: hasard(z, x) > 0.5 ? '#3f6a4c' : '#365f45' }); };
    for (let x = -112; x < -37; x += 7.4) for (let z = -456; z < -300; z += 7.8) cedreB(x + 4 * hasard(x, z), z + 4 * hasard(z, x), 10 + 8 * hasard(x + 2, z), x < -60);
    for (let x = -37; x < 100; x += 7.6) for (let z = -470; z < -390; z += 7.6) cedreB(x + 4 * hasard(x, z), z + 4 * hasard(z, x), 11 + 8 * hasard(x + 2, z), z < -410);
    for (let x = 64; x < 104; x += 8) for (let z = -390; z < -300; z += 9) cedreB(x + 4 * hasard(x, z), z + 4 * hasard(z, x), 9 + 6 * hasard(x + 2, z), true);
  }

  /*@@DECOR@@*/

  // ---------------------------------------------------------------- Ce qui vole : la neige soulevée (la bouée, les pelles), les braises et les flammes (la torche du tengu, le grand feu)
  const poudre = creerParticules(THREE, { n: 260, couleur: '#f4f8ff', base: 0.075, gravite: 2.2 });
  const braises = creerParticules(THREE, { n: 520, couleur: '#ffb04a', additif: true, base: 0.06, gravite: 2.6 });
  const flammes = creerParticules(THREE, { n: 360, couleur: '#ff9a3a', additif: true, base: 0.2, gravite: -1.6 });
  animes.push(poudre, braises, flammes);
  // (les scènes à jouer dès que le voyageur est libre : la fin d'une descente…)
  const suite = { objet: new THREE.Group(), file: [], maj(dt, temps, c) { while (this.file.length) c.scene(this.file.shift()); return []; } };
  animes.push(suite);

  // ---------------------------------------------------------------- Les gens (tous en habits d'hiver)
  const SEM = '#2a2a2c', PEAU = '#f2c9a8', PEAU2 = '#e8bf98', PEAU3 = '#e0b48c', NOIRC = '#2a2420', BRUNC = '#4a3426', GRISC = '#8a8478', BLANCC = '#d8d4cc';
  /** Des habits d'hiver : la doudoune (et ses manches), le pantalon, les bottes ; le reste dans o. */
  const hiver = (c, o = {}) => ({ taille: 1, peau: PEAU, cheveux: NOIRC, coiffure: 'court', haut: c, doudoune: c, manches: 'longues', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: '#4a3a30', semelle: SEM, ...o });
  const bonnet = (c, c2) => ({ sorte: 'bonnet', c, c2 });
  const A = DEDANS_A, B = DEDANS_B;
  const TENUE_CHAUFFEUR = hiver('#2a3550', { taille: 1.02, peau: PEAU2, chapeau: { sorte: 'casquette', c: '#2a3550', c2: '#2a3550' }, echarpe: '#8a8f98', bas: { sorte: 'pantalon', c: '#2a2f3a' } });
  const kDe = (id) => KAMAKURA.find((K) => K.id === id);
  const passants = [
    // ---- la rue et la place des tentes
    { id: 'chauffeur', x: 24.4, z: 46.75, cap: -PI / 2, dedans: A, tenue: TENUE_CHAUFFEUR },
    { id: 'banane', x: -21.85, z: 41.6, cap: PI / 2, dedans: A, tenue: hiver('#e8c66e', { taille: 0.95, cheveux: BRUNC, coiffure: 'queue', chapeau: { sorte: 'bandeau', c: '#f4f2ea' }, tablier: '#f4f2ea', echarpe: '#c8402c' }) },
    { id: 'sasa', x: -21.85, z: 35.8, cap: PI / 2, dedans: A, tenue: hiver('#4a6a4a', { taille: 0.9, peau: '#f0c8a6', cheveux: BLANCC, coiffure: 'chignon', chapeau: { sorte: 'foulard', c: '#3f8a4a' }, tablier: '#e8e0cc', yeux: 'plisses' }) },
    { id: 'kinoko', x: -21.85, z: 30.0, cap: PI / 2, dedans: A, tenue: hiver('#8a4a4a', { taille: 0.9, peau: '#f0c8a6', cheveux: GRISC, coiffure: 'chignon', chapeau: { sorte: 'oreilles', c: '#7a3a3a' }, tablier: '#e8e0cc', echarpe: '#e8e0cc', yeux: 'plisses' }) },
    { id: 'amazake', x: -21.85, z: 24.2, cap: PI / 2, dedans: A, tenue: hiver('#f0a8b8', { taille: 0.95, cheveux: NOIRC, coiffure: 'nattes', chapeau: bonnet('#d86a8a', '#f4f2ea'), echarpe: '#f4f2ea' }) },
    { id: 'honbu', x: 21.85, z: 41.6, cap: -PI / 2, dedans: A, tenue: hiver('#2f5aa0', { taille: 1.04, peau: PEAU2, chapeau: { sorte: 'casquette', c: '#2f5aa0', c2: '#f4f2ea' }, echarpe: '#e8b23a' }) },
    { id: 'soba', x: 21.85, z: 35.8, cap: -PI / 2, dedans: A, tenue: hiver('#4a4a56', { taille: 1.04, peau: PEAU3, cheveux: GRISC, chapeau: { sorte: 'bandeau', c: '#f4f0e6' }, tablier: '#3a3a44' }) },
    { id: 'pork', x: 21.85, z: 30.0, cap: -PI / 2, dedans: A, tenue: hiver('#7a3a2a', { taille: 1.06, peau: PEAU2, chapeau: bonnet('#2f2c30', '#2f2c30'), tablier: '#2f2c30' }) },
    { id: 'frileux', x: -9.6, z: 32.3, cap: 2.2, dedans: A, tenue: hiver('#5a7a5a', { taille: 1.06, peau: PEAU2, cheveux: GRISC, chapeau: bonnet('#3a4a3a', '#8a9a7a'), echarpe: '#8a6a3a' }) },
    { id: 'frileuse', x: -7.5, z: 32.6, cap: -2.4, dedans: A, tenue: hiver('#b86a8a', { taille: 0.95, cheveux: BRUNC, coiffure: 'queue', chapeau: bonnet('#f4f2ea', '#b86a8a'), echarpe: '#f4f2ea', bas: { sorte: 'pantalon', c: '#4a4a56' } }) },
    { id: 'gourmand', x: -15.6, z: 40.3, cap: 1.2, dedans: A, tenue: hiver('#e8b23a', { taille: 0.68, chapeau: bonnet('#2f6ab0', '#f4f2ea'), echarpe: '#2f6ab0', yeux: 'plisses' }) },
    { id: 'promeneur', x: -12, z: 42, cap: 1.5, ronde: [[-12, 42], [12, 42.6], [13.6, 27.2], [-13, 26.4]], vitesse: 0.85, attente: [6, 12], dedans: A, tenue: hiver('#6a7a9a', { taille: 1.05, cheveux: BRUNC, chapeau: { sorte: 'oreilles', c: '#5a4a3a' }, echarpe: '#c8402c', appareil: true }) },
    // ---- la grande terrasse : l'équipe qui finit sa sculpture, ceux qui regardent
    { id: 'chef', x: -28.3, z: -31.2, cap: -PI / 2 + 0.4, dedans: A, tenue: hiver('#c8502a', { taille: 1.06, peau: PEAU3, cheveux: GRISC, chapeau: { sorte: 'bandeau', c: '#f4f0e6' }, echarpe: '#3a3a44' }) },
    { id: 'sculptrice', x: -28.5, z: -37.8, cap: -PI / 2 - 0.3, dedans: A, tenue: hiver('#2f8a8a', { taille: 0.96, cheveux: NOIRC, coiffure: 'queue', chapeau: bonnet('#e8b23a', '#f4f2ea') }) },
    { id: 'photographe', x: 2.4, z: -44.4, cap: PI - 0.2, dedans: A, tenue: hiver('#3a3a44', { taille: 1.08, peau: PEAU2, chapeau: bonnet('#c8402c', '#c8402c'), appareil: true, sac: { sorte: 'dos', c: '#5a6a4a', c2: '#3a4a3a' } }) },
    { id: 'mere', x: 20.8, z: -44.6, cap: PI, dedans: A, tenue: hiver('#a86a8a', { taille: 0.96, cheveux: BRUNC, coiffure: 'chignon', chapeau: bonnet('#e8e0d0', '#a86a8a'), echarpe: '#e8e0d0' }) },
    { id: 'fillette', x: 24.7, z: -45.2, cap: PI + 0.2, dedans: A, tenue: hiver('#e8583e', { taille: 0.64, cheveux: NOIRC, coiffure: 'nattes', chapeau: bonnet('#f4f2ea', '#e8583e'), echarpe: '#f2c443', yeux: 'plisses' }) },
    { id: 'papi', x: -23.7, z: -44.7, cap: PI - 0.1, dedans: A, tenue: hiver('#6a5a48', { taille: 0.94, peau: PEAU3, cheveux: BLANCC, chapeau: { sorte: 'paille', c: '#d8c088', c2: '#5a4a3a' }, echarpe: '#8a8f98', canne: true, yeux: 'plisses' }) },
    { id: 'lapine', x: -23.6, z: -15.0, cap: -2.2, dedans: A, tenue: hiver('#f59aa6', { taille: 0.7, cheveux: BRUNC, coiffure: 'queue', chapeau: bonnet('#f4f2ea', '#f59aa6') }) },
    { id: 'benevole', x: 2.4, z: -14.0, cap: 0.4, dedans: A, tenue: hiver('#e8b23a', { taille: 1.0, cheveux: NOIRC, chapeau: bonnet('#2f5aa0', '#f4f2ea'), echarpe: '#2f5aa0' }) },
    // ---- le coin des enfants
    { id: 'animatrice', x: -58.6, z: -14.45, cap: PI, dedans: A, tenue: hiver('#3f8a4a', { taille: 0.96, cheveux: BRUNC, coiffure: 'queue', chapeau: bonnet('#e8452e', '#f4f2ea'), echarpe: '#f4f2ea', tablier: '#e8e0cc' }) },
    { id: 'grimpeur', x: BUTTE.x - 0.1, z: BUTTE.z, cap: PI / 2, etage: Y2 + BUTTE.h + 0.06, dedans: A, tenue: hiver('#2f6ab0', { taille: 0.62, chapeau: bonnet('#e8b23a', '#e8b23a'), yeux: 'plisses' }) },
    { id: 'glisseur', x: -60.4, z: -33.6, cap: -PI / 2, dedans: A, tenue: hiver('#e8452e', { taille: 0.64, cheveux: BRUNC, chapeau: bonnet('#2f8a4a', '#f4f2ea') }) },
    { id: 'maman', x: -59.4, z: -30.6, cap: -2.0, dedans: A, tenue: hiver('#8ac4e8', { taille: 0.96, cheveux: NOIRC, coiffure: 'chignon', chapeau: bonnet('#3a4a6a', '#f4f2ea'), echarpe: '#3a4a6a' }) },
    { id: 'igloo', x: -59.2, z: -37.2, cap: -2.2, dedans: A, tenue: hiver('#5a6a4a', { taille: 1.06, peau: PEAU2, chapeau: { sorte: 'oreilles', c: '#4a3a2a' } }) },
    // ---- le haut du château
    { id: 'liftier', x: 7.5, z: -96.7, cap: 0.6, dedans: A, tenue: hiver('#2f6ab0', { taille: 1.04, peau: PEAU2, chapeau: bonnet('#2f6ab0', '#f4f2ea'), echarpe: '#e8b23a', lunettes: true }) },
    { id: 'prieur', x: 2.5, z: -88.9, cap: -PI / 2, dedans: A, tenue: hiver('#4a4a56', { taille: 0.92, peau: PEAU3, cheveux: BLANCC, chapeau: { sorte: 'oreilles', c: '#3a3a44' }, echarpe: '#7a3a3a', yeux: 'plisses' }) },
    { id: 'amoureuse', x: 28.2, z: -90.4, cap: PI / 2, dedans: A, tenue: hiver('#f4f2ea', { taille: 0.95, cheveux: BRUNC, coiffure: 'queue', chapeau: bonnet('#e88aa0', '#f4f2ea'), echarpe: '#e88aa0' }) },
    { id: 'amoureux', x: 28.5, z: -86.7, cap: PI / 2 + 0.3, dedans: A, tenue: hiver('#3a4a6a', { taille: 1.06, chapeau: bonnet('#3a3a44', '#3a3a44'), echarpe: '#8a8f98' }) },
    // ---- le soir, autour du cercle du tengu : ceux qui regardent
    ...[0.3, 1.0, 1.7, 2.5, 3.3, 4.0, 4.8, 5.6].map((t, k) => ({
      id: `spectateur${k}`, x: CERCLE.x + Math.cos(t) * (CERCLE.r + 1.2 + 0.5 * (k % 2)), z: CERCLE.z + Math.sin(t) * (CERCLE.r + 1.2 + 0.5 * (k % 2)), cap: Math.atan2(-Math.cos(t), -Math.sin(t)), quand: 'nuit', dedans: A,
      tenue: hiver(['#5a6a8a', '#8a5a6a', '#4a6a5a', '#7a6a4a', '#3a4a6a', '#a86a4a', '#6a4a7a', '#4a5a4a'][k], { taille: [1.04, 0.95, 1.0, 0.7, 1.06, 0.94, 0.98, 1.02][k], cheveux: k % 3 ? NOIRC : BRUNC, coiffure: k % 2 ? 'queue' : 'court', chapeau: bonnet(['#c8402c', '#f4f2ea', '#2f5aa0', '#e8b23a'][k % 4], '#f4f2ea'), echarpe: k % 2 ? '#f4f2ea' : null, appareil: k === 4 }),
    })),
    // ---- le village des kamakura
    { id: 'chauffeurB', x: 3.4, z: -290.6, cap: -PI / 2, dedans: B, tenue: TENUE_CHAUFFEUR },
    { id: 'cuisiniere', x: MARMITE.x, z: MARMITE.z + 1.25, cap: PI, dedans: B, tenue: hiver('#b8322a', { taille: 0.95, peau: '#f0c8a6', cheveux: GRISC, coiffure: 'chignon', chapeau: { sorte: 'foulard', c: '#f4f0e6' }, tablier: '#f4f0e6', yeux: 'plisses' }) },
    { id: 'serveuse', x: -5.2, z: -307.6, cap: 0, ronde: [[-5.2, -307.6], [-1.3, -316], [-1.3, -338.2]], vitesse: 0.9, attente: [5, 9], dedans: B, tenue: hiver('#2f4a6a', { taille: 0.95, cheveux: NOIRC, coiffure: 'queue', chapeau: { sorte: 'bandeau', c: '#b8322a' }, tablier: '#b8322a' }) },
    { id: 'ancien', x: 14.3, z: -307.3, cap: -0.6, dedans: B, tenue: hiver('#5a6a4a', { taille: 0.98, peau: PEAU3, cheveux: BLANCC, chapeau: { sorte: 'oreilles', c: '#4a4a3a' }, echarpe: '#c8b27a', yeux: 'plisses' }) },
    { id: 'visiteuse', x: 5.6, z: -304.6, cap: PI - 0.5, dedans: B, tenue: hiver('#e8a0a8', { taille: 0.95, cheveux: BRUNC, coiffure: 'queue', chapeau: bonnet('#f4f2ea', '#e8a0a8'), echarpe: '#f4f2ea', appareil: true }) },
    ...[['k00', '#6a8a5a', '#c8783a'], ['k14', '#3a4a6a', '#e88aa0'], ['k22', '#8a5a4a', '#5a7a9a']].flatMap(([id, c1, c2], k) => {
      const K = kDe(id);
      return [
        { id: `dineur${k}a`, x: K.x - 0.82, z: K.z - 0.12, cap: PI / 2, fixe: true, dedans: B, tenue: hiver(c1, { pose: 'seiza', taille: 1.0, cheveux: k % 2 ? BRUNC : NOIRC, chapeau: k === 1 ? null : bonnet('#f4f2ea', c1) }) },
        { id: `dineur${k}b`, x: K.x + 0.82, z: K.z - 0.12, cap: -PI / 2, fixe: true, dedans: B, tenue: hiver(c2, { pose: 'seiza', taille: k === 2 ? 0.7 : 0.95, cheveux: NOIRC, coiffure: 'queue', echarpe: '#f4f2ea' }) },
      ];
    }),
    // (ceux qu'on voit de loin : les enfants sur la butte des luges, les deux qui bâtissent un kamakura)
    { id: 'luge1', x: LUGES.x - 2.6, z: LUGES.z + 4.6, cap: -1.2, dedans: B, tenue: hiver('#e8452e', { taille: 0.66, chapeau: bonnet('#2f6ab0', '#f4f2ea') }) },
    { id: 'luge2', x: LUGES.x - 4.9, z: LUGES.z + 2.4, cap: 0.8, dedans: B, tenue: hiver('#2f8a4a', { taille: 0.7, cheveux: BRUNC, coiffure: 'nattes', chapeau: bonnet('#e8b23a', '#e8b23a') }) },
    { id: 'ouvrier1', x: CHANTIER.x + 3.4, z: CHANTIER.z + 2.4, cap: -1.2, dedans: B, tenue: hiver('#e8862a', { taille: 1.04, peau: PEAU3, chapeau: { sorte: 'oreilles', c: '#3a3a44' } }) },
    { id: 'ouvrier2', x: CHANTIER.x + 3.9, z: CHANTIER.z - 1.6, cap: -1.9, dedans: B, tenue: hiver('#2f6ab0', { taille: 1.0, peau: PEAU2, cheveux: GRISC, chapeau: bonnet('#e8452e', '#e8452e') }) },
  ];

  // ---------------------------------------------------------------- La descente en bouée (スノースライダー) : on file dans la rigole, le chrono tourne
  const bouee = (() => {
    const a = atelier();
    a.piece(new THREE.TorusGeometry(0.44, 0.19, 8, 16), '#2f6ab0', { rx: PI / 2, y: 0.19 }).cylindre(0.3, 0.3, 0.03, 12, '#1f4a80', { y: 0.1 });
    for (const s of [-1, 1]) a.piece(new THREE.TorusGeometry(0.075, 0.016, 4, 8, PI), '#f4f2ea', { x: s * 0.48, y: 0.36, ry: PI / 2 });
    const o = ctx.perso.maillage(a.fin(0, false));
    o.visible = false;
    return o;
  })();
  animes.push({ objet: bouee, maj: () => [] });
  const Z_ARRIVEE = -156.6, Z_BOUT = -166.4;
  // Ses réglages (derive : ce qui pousse la bouée vers l'extérieur d'un virage ; virage : ce que font les flèches, en m/s ; frottement : ce
  // qu'on perd contre le bord), trouvés en faisant descendre des pilotes plus ou moins habiles, hors du temps (bouee.py). Avec 0,05, 3,3 et
  // 2,4, les premiers : sans toucher aux flèches on ne frôlait jamais le bord, et pousser en avant suffisait pour le meilleur temps (11,27 s) ;
  // tourner trop fort renvoyait d'un bord à l'autre. Maintenant : 11,27 s en tenant bien le milieu et en se penchant ; 12,3 s avec deux
  // touches ; 14,2 s sans se pencher ; 15,2 s en se penchant sans tourner ; 17,3 s sans rien faire (deux bords).
  const glisse = {
    actif: false, autre: null, jeu: null, fin: null, derive: 0.18, virage: 2.4, frottement: 1.5, z: 0, u: 0, v: 0, t: 0, decompte: 0, fini: null, chocs: 0, touche: false, affiche: 0, gerbe: 0, siege: { x: 0, z: 0, y: 0, cap: PI },
    demarrer(jeu, fin) {
      Object.assign(this, { actif: true, jeu, fin, z: PISTE[0][1] + 0.4, u: 0, v: 0, t: 0, decompte: 2.1, fini: null, chocs: 0, touche: false, affiche: 0, gerbe: 0 });
      jeu.son('oiseau/top');
    },
    maj(dt, pousse, vire, etat, cam, renard) {
      if (this.autre) return this.autre(dt, pousse, vire, etat, cam, renard);
      const jeu = this.jeu, z = this.z, [x0, y0] = surPiste(z), [x1, y1] = surPiste(z - 0.6), [x2] = surPiste(z - 1.2);
      const allonge = Math.hypot(0.6, x1 - x0) / 0.6, pente = (y0 - y1) / Math.hypot(0.6, x1 - x0), courbe = (x2 - 2 * x1 + x0) / 0.36;
      if (this.decompte > 0) {
        const n0 = Math.ceil(this.decompte / 0.7);
        this.decompte -= dt;
        const n1 = Math.ceil(this.decompte / 0.7);
        if (this.decompte <= 0) jeu.son('oiseau/depart');
        else if (n1 !== n0) jeu.son('oiseau/top');
        jeu.chrono(`<b>${this.decompte > 0 ? n1 : jeu.tx('chronoPartez')}</b>${enTeteBouee(jeu)}`);
      } else {
        if (!this.fini) this.t += dt;
        if (!this.fini && (this.affiche -= dt) <= 0) { this.affiche = 0.08; jeu.chrono(`<b>${chiffres(this.t)}</b>${this.chocs ? `<small>${jeu.tx('chronoChocs')} ${this.chocs}</small>` : ''}`); }
        // la pente pousse, la neige freine ; se pencher en avant (pousser vers l'avant) fait gagner un peu ; la ligne passée, on freine des talons
        const a = 8.2 * pente - 0.085 * this.v - 0.011 * this.v * this.v + 0.5 * Math.max(0, pousse) - (this.fini ? 4.2 : 0);
        this.v = Math.max(this.fini ? 0 : 1.2, this.v + a * dt);
        this.z -= (this.v * dt) / allonge;
      }
      // dans un virage, la bouée part vers l'extérieur ; on la ramène au milieu (les côtés : vers la droite de l'écran, x grandit)
      this.u += (vire * this.virage - courbe * this.v * this.v * this.derive) * dt;
      const bord = 1.22, contre = Math.abs(this.u) > bord;
      if (contre) {
        this.u = Math.sign(this.u) * bord;
        this.v *= Math.exp(-dt * this.frottement);
        if (!this.touche && this.decompte <= 0 && !this.fini) { this.chocs++; jeu.son('oiseau/rate'); }
      }
      this.touche = contre;
      const [xp] = surPiste(this.z), cap = Math.atan2(x1 - x0, -0.6), dx = Math.sin(cap), dz = Math.cos(cap);
      const x = xp + this.u, sol = terrain(x, this.z);
      Object.assign(this.siege, { x, z: this.z, y: sol + 0.3, cap });
      Object.assign(etat, { x, z: this.z, y: sol + 0.3 - ASSIS, cap, vx: dx * this.v, vz: dz * this.v, vitesse: 0 });
      cam.lacet = tournerVers(cam.lacet, cap + PI, dt * 3.2);
      Object.assign(renard, { x: x + dx * 0.34, z: this.z + dz * 0.34, y: sol + 0.34, cap, vitesse: 0 });
      bouee.position.set(x, sol + 0.02, this.z);
      bouee.rotation.set(0, cap, -vire * 0.1);
      // la gerbe de neige derrière, plus forte contre le bord
      this.gerbe += dt * this.v * (contre ? 5 : 2);
      while (this.gerbe > 1) { this.gerbe -= 1; poudre.emettre(x - dx * 0.5 + (contre ? Math.sign(this.u) * 0.4 : 0), sol + 0.1, this.z - dz * 0.5, 1, { large: 0.25, vx: -dx * 0.8, vy: 1.3 + this.v * 0.08, vz: -dz * 0.8, vie: 0.6, alpha: 0.9 }); }
      // la ligne d'arrivée ; puis le bout du replat, ou l'arrêt
      if (!this.fini && this.z < Z_ARRIVEE) { this.fini = { t: this.t, chocs: this.chocs }; jeu.son('oiseau/arrivee'); jeu.chrono(`<b>${chiffres(this.t)}</b>${this.chocs ? `<small>${jeu.tx('chronoChocs')} ${this.chocs}</small>` : ''}`); }
      if (this.fini && (this.v < 0.3 || this.z < Z_BOUT)) { this.actif = false; const fin = this.fin; this.fin = null; if (fin) fin(this.fini); }
      return this.v;
    },
  };
  const DEPART_BOUEE = { x: SLIDER.x + 3.3, z: -95.6 };
  /** La descente : le voyageur dans sa bouée au départ, le compte à rebours ; au bout, son temps, le record, et l'on peut recommencer. */
  const lancerGlisse = (jeu) => {
    jeu.rangerOmbrelle(true);
    jeu.placer(PISTE[0][0], PISTE[0][1] + 0.9, PI);
    glisse.siege = { x: PISTE[0][0], z: PISTE[0][1] + 0.4, y: Y3 + 0.3, cap: PI };
    jeu.asseoir(glisse.siege);
    jeu.cameraDerriere(0);
    bouee.visible = true;
    glisse.demarrer(jeu, (res) => {
      suite.file.push(async (j) => {
        const av = lireRecord(CLE_BOUEE), nouveau = av == null || res.t < av;
        if (nouveau) ecrireRecord(CLE_BOUEE, res.t);
        const medaille = res.t <= TEMPS_BOUEE[0] ? 'Or' : res.t <= TEMPS_BOUEE[1] ? 'Argent' : res.t <= TEMPS_BOUEE[2] ? 'Bronze' : null;
        const pages = [j.tx(res.chocs ? 'boueeTempsChocs' : 'boueeTemps').replace('{t}', chiffres(res.t)).replace('{c}', res.chocs), j.tx(nouveau ? (av == null ? 'boueeRecord1' : 'boueeRecord') : 'boueeRecordNon').replace('{r}', chiffres(av ?? res.t))];
        if (medaille) pages.push(j.tx(`boueeMedaille${medaille}`));
        // (l'arrivée, vue de devant : le voyageur dans sa bouée, l'arche rouge et la pente qu'il vient de descendre derrière lui ; vue de dos, la
        // caméra restait sous l'arche, et sa banderole couvrait le tiers de l'image)
        const S = glisse.siege;
        j.cadrer({ de: [S.x + 2.7, S.y + 1.25, S.z - 4.6], vers: [S.x - 0.25, S.y + 0.55, S.z + 0.9], champ: 46 });
        await j.dire(pages, 'liftier');
        if (!j.aTampon('slider')) { await j.tampon('slider'); await comp(j, 'sliderCompagnon'); }
        const r = await j.choisir(j.tx('boueeEncore'), [j.t('oui'), j.t('non')], 'liftier');
        j.chrono(null);
        await j.fondu(true);
        j.cadrer(null);
        bouee.visible = false;
        j.asseoir(null);
        j.rangerOmbrelle(false);
        if (r === 0) lancerGlisse(j);
        else { j.placer(DEPART_BOUEE.x, DEPART_BOUEE.z, 0.6); j.cameraDerriere(0); }
        await j.attendre(250);
        await j.fondu(false);
      });
    });
  };

  // ---------------------------------------------------------------- Le grand tengu de Narazawa (奈良澤大天狗) : le soir, il danse dans son cercle, sa torche en feu
  // Le masque rouge au long nez, la grande crinière, l'habit blanc aux cordons rouges ; sa torche de plus de deux mètres, qu'il fait tournoyer :
  // ses étincelles chassent le mauvais sort, et l'on dit qu'en recevoir porte bonheur.
  // (où est le voyageur, d'une image à l'autre : la partie du lieu décide d'où partent les feux d'artifice)
  let zJoueur = DEPART.z;
  const tengu = (() => {
    const tenue = { taille: 1.12, peau: '#e8bf98', cheveux: '#7a3220', coiffure: 'criniere', masque: 'tengu', haut: '#f4f0e6', manches: 'kimono', col: '#c8372d', obi: '#c8372d', bas: { sorte: 'pantalon', c: '#f1ece0' }, chaussures: '#c8a65a', semelle: '#8a6a3a', pose: 'torche', repos: false, moulinet: 0 };
    const perso = creerPersonnage(ctx.perso, tenue), g = perso.objet;
    g.visible = false;
    const bout = g.getObjectByName('torche-bout'), v = new THREE.Vector3();
    const lampe = { x: CERCLE.x, y: -500, z: CERCLE.z, halo: 1.0, sol: Y1, r: 10, c: '#ff9a3a', mobile: true };
    lumieres.push(lampe);
    const S = { t: 0, feu: 0, etincelles: 0, avant: 0, x: CERCLE.x, z: CERCLE.z, cap: 0 };
    return {
      objet: g, tenue, S,
      maj(dt, temps, c) {
        zJoueur = c.joueur.z;
        const la = c.nuit > 0.5 && c.joueur.z > Z_CRETE;
        if (la !== g.visible) g.visible = la;
        if (!la) { lampe.y = -500; return []; }
        // il tourne dans son cercle, à pas lents, tourné vers là où il va ; quand on l'appelle, il s'arrête et se tourne vers le voyageur
        const w = 0.34, r = 2.1;
        if (!tenue.repos) S.t += dt;
        S.x = CERCLE.x + Math.cos(S.t * w) * r; S.z = CERCLE.z + Math.sin(S.t * w) * r;
        const capVoulu = tenue.repos ? Math.atan2(c.joueur.x - S.x, c.joueur.z - S.z) : Math.atan2(-Math.sin(S.t * w), Math.cos(S.t * w)) + 0.5 * Math.sin(S.t * 0.9);
        S.cap = tournerVers(S.cap, capVoulu, dt * 3.5);
        g.position.set(S.x, Y1, S.z);
        g.rotation.y = S.cap;
        perso.animer(dt, tenue.repos ? 0 : 0.5, temps);
        // la flamme au bout de la torche, sa lumière ; les braises qui s'en détachent, et la gerbe quand elle s'abat sur la neige
        g.updateMatrixWorld(true);
        bout.getWorldPosition(v);
        Object.assign(lampe, { x: v.x, y: v.y + 0.2, z: v.z });
        S.feu += dt * 64;
        while (S.feu > 1) { S.feu -= 1; flammes.emettre(v.x, v.y, v.z, 1, { large: 0.26, vy: 1.7, ecart: 1.0, vie: 0.6, alpha: 0.8, taille: 0.62 }); }
        S.etincelles += dt * (tenue.repos ? 8 : 34);
        while (S.etincelles > 1) { S.etincelles -= 1; braises.emettre(v.x, v.y, v.z, 1, { large: 0.12, vy: 1.2, ecart: 3.2, vie: 1.3, alpha: 1 }); }
        const cris = [];
        if (!tenue.repos && tenue.moulinet > 0.93 && S.avant <= 0.93) {
          braises.emettre(v.x, Math.max(Y1 + 0.15, v.y), v.z, 46, { large: 0.3, vy: 3.2, ecart: 6, vie: 1.5, alpha: 1 });
          cris.push({ nom: 'torche', x: v.x, y: v.y, z: v.z, fort: 1.3 });
        }
        S.avant = tenue.moulinet;
        return cris;
      },
    };
  })();
  animes.push(tengu);
  // la petite torche que donne le tengu : tenue à la main, sa flamme, sa lumière ; on la porte jusqu'au grand feu
  const torche = (() => {
    // (dans le repère du bras droit : la main est à 31 cm sous l'épaule ; le bras levé devant soi, l'axe z du bras monte : la torche est droite)
    const a = atelier(), ym = -0.31;
    a.baton([0, ym, -0.07], [0, ym, 0.5], 0.016, '#6a4a30', 6).cylindre(0.03, 0.052, 0.22, 8, '#c8a65a', { y: ym, z: 0.6, rx: -PI / 2 }).cylindre(0.047, 0.047, 0.02, 8, '#8a6a3a', { y: ym, z: 0.54, rx: PI / 2, trait: false });
    const o = ctx.perso.maillage(a.fin(0, false)), bout = new THREE.Object3D(), v = new THREE.Vector3();
    bout.position.set(0, ym, 0.74);
    o.add(bout);
    const lampe = { x: 0, y: -500, z: 0, halo: 0.5, sol: null, r: 6, c: '#ff9a3a', mobile: true };
    lumieres.push(lampe);
    let tenue = false, feu = 0;
    return {
      objet: new THREE.Group(), o,
      prendre(jeu) { tenue = true; jeu.donner('torche'); jeu.rangerOmbrelle(true); jeu.tenir(o, { leve: true }); },
      rendre(jeu) { tenue = false; jeu.prendre('torche'); jeu.tenir(null); jeu.rangerOmbrelle(false); lampe.y = -500; },
      maj(dt) {
        if (!tenue) return [];
        o.updateMatrixWorld(true);
        bout.getWorldPosition(v);
        Object.assign(lampe, { x: v.x, y: v.y, z: v.z });
        feu += dt * 30;
        while (feu > 1) { feu -= 1; flammes.emettre(v.x, v.y, v.z, 1, { large: 0.05, vy: 0.9, ecart: 0.3, vie: 0.4, alpha: 0.85, taille: 0.14 }); }
        return [];
      },
    };
  })();
  animes.push(torche);

  // ---------------------------------------------------------------- Le secret : les feux de Kenshin
  // Le grand feu du haut du château, une fois allumé (la nuit) : ses flammes, sa lumière ; et, loin sur les montagnes, les feux qui répondent, du mont
  // Kuroiwa vers le nord-ouest (vers Kasugayama, le château de Kenshin, de l'autre côté des montagnes) : une chaîne inventée pour le jeu.
  // Où les poser pour qu'on les voie : sur la ligne de crête telle qu'on la voit de là où l'on regarde (le sommet rond d'une montagne se cache derrière
  // son propre flanc, vu d'en bas : le feu du mont Kuroiwa, posé à son sommet, ne se voyait d'aucun endroit du lieu). horizon : le point le plus haut
  // dans le ciel, le long d'un cap, vu de l'œil (cx, cy, cz).
  const horizon = (cx, cy, cz, cap) => {
    let mieux = -9, q = null;
    for (let d = 200; d < 2300; d += 12) {
      const x = cx + Math.sin(cap) * d, z = cz - Math.cos(cap) * d;
      if (x < -1580 || z < -1620) break;
      const y = terrain(x, z), a = Math.atan2(y - cy, d);
      if (a > mieux) { mieux = a; q = { x, z, y: y + 7 }; }
    }
    return q;
  };
  // (du haut du château : six feux, du mont Kuroiwa, au nord-nord-ouest, vers l'ouest ; du village des kamakura : celui du mont Kuroiwa, au-dessus de la forêt)
  const OEIL_FEU = [FEU.x + 9.5, Y3 + 5.2, FEU.z + 12.5];
  const CHAINE = [-28, -35, -42, -49, -56, -63].map((b) => ({ ...horizon(OEIL_FEU[0], OEIL_FEU[1], OEIL_FEU[2], b / 57.2958), partie: 'A' }));
  CHAINE.push({ ...horizon(0, YB + 1.7, -330, Math.atan2(KUROIWA.x, -(KUROIWA.z + 330))), partie: 'B' });
  const signaux = (() => {
    const n = CHAINE.length, pos = new Float32Array(n * 3), force = new Float32Array(n), phase = new Float32Array(n);
    CHAINE.forEach((q, k) => { pos.set([q.x, q.y, q.z], k * 3); phase[k] = k * 1.7; });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('force', new THREE.BufferAttribute(force, 1));
    g.setAttribute('phase', new THREE.BufferAttribute(phase, 1));
    const u = { temps: { value: 0 }, echelle: { value: 1 } };
    const o = new THREE.Points(g, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: u, fog: false,
      vertexShader: `attribute float force; attribute float phase; varying float vF; uniform float temps; uniform float echelle; void main() { vF = force * (0.78 + 0.22 * sin(temps * 9.0 + phase) * sin(temps * 5.3 + phase * 2.1)); vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = echelle * (0.062 + 0.026 * vF); }`,
      fragmentShader: `varying float vF; void main() { float d = length(gl_PointCoord - 0.5) * 2.0; if (d > 1.0 || vF <= 0.0) discard; float coeur = 1.0 - smoothstep(0.0, 0.34, d), halo = (1.0 - d) * (1.0 - d); gl_FragColor = vec4(mix(vec3(1.0, 0.5, 0.14), vec3(1.0, 0.9, 0.55), coeur) * (2.4 * coeur + 1.1 * halo) * vF, 1.0);
        #include <colorspace_fragment>
      }`,
    }));
    o.frustumCulled = false;
    o.renderOrder = 3;
    const lampe = { x: FEU.x, y: -500, z: FEU.z, halo: 1.3, sol: Y3, r: 13, c: '#ff9a3a', mobile: true };
    lumieres.push(lampe);
    const E = { allume: secretTrouve('noroshi'), cible: new Float32Array(n), brule: 0, t: 0 };
    if (E.allume) E.cible.fill(1);
    return {
      objet: o, E,
      /** Le grand feu prend (la scène du secret) ; puis les feux des montagnes, un à un : repondre(k). */
      prendre() { E.allume = true; },
      repondre(k) { E.cible[k] = 1; },
      maj(dt, temps, c) {
        u.temps.value = temps;
        u.echelle.value = innerHeight * Math.min(devicePixelRatio, 2);
        const nuit = c.nuit > 0.5, la = E.allume && nuit;
        o.visible = nuit;
        const partie = c.joueur.z > Z_CRETE ? 'A' : 'B';
        for (let k = 0; k < n; k++) force[k] += ((E.allume && nuit && CHAINE[k].partie === partie ? E.cible[k] : 0) - force[k]) * Math.min(1, dt * 1.6);
        g.attributes.force.needsUpdate = true;
        // le grand feu : ses flammes hautes, ses braises ; sa lumière (seulement de ce côté de la crête)
        if (la && c.joueur.z > Z_CRETE) {
          lampe.y = Y3 + 2.2;
          E.brule += dt * 90;
          while (E.brule > 1) { E.brule -= 1; flammes.emettre(FEU.x, Y3 + 0.7 + Math.random() * 1.5, FEU.z, 1, { large: 0.85, vy: 3.0, ecart: 1.1, vie: 0.9, alpha: 0.8, taille: 0.95 }); }
          E.t += dt * 9;
          while (E.t > 1) { E.t -= 1; braises.emettre(FEU.x, Y3 + 2.2, FEU.z, 1, { large: 0.4, vy: 3.4, ecart: 1.6, vie: 2.2, alpha: 1 }); }
        } else lampe.y = -500;
        return [];
      },
    };
  })();
  animes.push(signaux);
  /** Le secret : la flamme du tengu portée au grand feu ; il prend, et les montagnes répondent, feu après feu. */
  const allumerLeFeu = async (jeu) => {
    await jeu.dire(jeu.tx('feuAllume1'));
    jeu.geste('offrir');
    await jeu.attendre(900);
    torche.rendre(jeu);
    jeu.geste(null);
    signaux.prendre();
    jeu.son('oiseau/feu');
    braises.emettre(FEU.x, Y3 + 1.2, FEU.z, 60, { large: 0.6, vy: 3.6, ecart: 4, vie: 1.8, alpha: 1 });
    jeu.eclat('#ffcf8a', 0.5);
    await jeu.attendre(1600);
    await comp(jeu, 'feuCompagnon1');
    // on regarde vers le nord-ouest, par-dessus le feu : le mont Kuroiwa, puis les crêtes derrière lui
    jeu.cacherVoyageur(true);
    // (vers le nord-ouest, un peu levé : le grand feu en bas de l'image, les crêtes en haut ; sur un écran en hauteur, un champ plus large : les six feux y tiennent)
    jeu.cadrer({ de: OEIL_FEU, vers: [OEIL_FEU[0] - 695, OEIL_FEU[1] + 176, OEIL_FEU[2] - 719], champ: innerHeight > innerWidth ? 78 : 50 });
    await jeu.attendre(1500);
    for (let k = 0; k < CHAINE.length; k++) {
      signaux.repondre(k);
      jeu.son('oiseau/feu', { force: 0.55 - 0.05 * k });
      if (k === 0) { await jeu.attendre(1400); await jeu.dire(jeu.tx('feuAllume2')); }
      await jeu.attendre(k === 0 ? 600 : 1150);
    }
    await jeu.attendre(1200);
    await jeu.dire(jeu.tx('feuAllume3'));
    jeu.cadrer(null);
    jeu.cacherVoyageur(false);
    await comp(jeu, 'feuCompagnon2');
    await jeu.dire(jeu.tx('feuKoban'));
    await jeu.trouverSecret('noroshi');
  };

  // ---------------------------------------------------------------- Ce qu'on peut faire (tout passe par `jeu`)
  const comp = (jeu, cle) => jeu.dire(jeu.tx(cle)[jeu.compagnon], 'compagnon');
  const parler = (id) => ({ id, passant: id, verbe: 'parler', action: (jeu) => jeu.dire(jeu.txn(id), id) });
  /** Le soir, ou le matin : celui qui l'offre (qui) ; ses répliques : <qui>Soir, <qui>Matin. */
  const soirOuMatin = async (jeu, qui) => {
    if (jeu.estNuit) { const r = await jeu.choisir(jeu.tx(`${qui}Matin`), [jeu.t('oui'), jeu.t('non')], qui); if (r === 0) await jeu.nuit(false); return; }
    const r = await jeu.choisir(jeu.tx(`${qui}Soir`), [jeu.t('oui'), jeu.t('non')], qui);
    if (r === 0) await jeu.nuit(true);
  };
  /** La navette : d'une partie à l'autre (le fondu, le trajet, l'arrivée). */
  const navette = async (jeu, qui, vers) => {
    const r = await jeu.choisir(jeu.tx(qui), [jeu.t('oui'), jeu.t('non')], qui);
    if (r !== 0) return;
    await jeu.fondu(true);
    if (vers === 'B') jeu.placer(-3.4, -292.2, PI); else jeu.placer(15.6, 48.0, PI);
    jeu.cameraDerriere(0);
    await jeu.attendre(1500);
    await jeu.fondu(false);
    await jeu.dire(jeu.tx(vers === 'B' ? 'arriveeB' : 'arriveeA'));
    await comp(jeu, vers === 'B' ? 'arriveeBCompagnon' : 'arriveeACompagnon');
  };
  /** Le repas dans le kamakura au lampion rouge : assis au fond, face à la porte ; la marmite fume sur la table, on mange. */
  const repas = async (jeu) => {
    const K = MIEN, y = YB;
    await jeu.fondu(true);
    jeu.rangerOmbrelle(true);
    jeu.placer(K.x, K.z + K.R + 0.9, PI);
    jeu.asseoir({ x: K.x, z: K.z - 0.94, y: y + 0.14, cap: 0, cote: { x: K.x - 0.82, z: K.z - 0.12, y: y + 0.14, cap: PI / 2 } });
    // (entier : la table et la marmite, entre l'œil et le voyageur, ne s'effacent pas en pointillés)
    jeu.cadrer({ de: [K.x + 0.32, y + 1.02, K.z + K.r - 0.3], vers: [K.x - 0.05, y + 0.58, K.z - 0.55], champ: 64, entier: true });
    await jeu.attendre(350);
    await jeu.fondu(false);
    await jeu.dire(jeu.tx('repas1'), 'serveuse');
    for (let k = 0; k < 2; k++) { jeu.geste('baguettes'); await jeu.attendre(700); jeu.son('slurp'); await jeu.attendre(1200); }
    jeu.geste(null);
    await jeu.dire(jeu.tx('repas2'));
    await comp(jeu, 'repasCompagnon');
    if (!jeu.aTampon('nabe')) await jeu.tampon('nabe');
    jeu.prendre('nabe');
    await jeu.fondu(true);
    jeu.cadrer(null);
    jeu.asseoir(null);
    jeu.rangerOmbrelle(false);
    // (devant la porte, tourné vers elle : tourné vers l'allée, la caméra se retrouvait dans le dôme, et l'on voyait le voyageur au travers)
    jeu.placer(K.x, K.z + K.R + 0.9, PI);
    jeu.cameraDerriere(0);
    await jeu.attendre(250);
    await jeu.fondu(false);
  };
  // (la marmite de ce kamakura fume)
  vapeurs.push({ x: MIEN.x, z: MIEN.z - 0.12, y: YB + 0.68, n: 4, haut: 1.1, large: 0.14, taille: 0.34, opacite: 0.5 });
  // la lanterne de neige qu'on fabrique soi-même : au bout du rang, dès qu'on a le tampon
  const maLanterne = (() => {
    const a = atelier(), y = terrain(MA_LANTERNE.x, MA_LANTERNE.z);
    lanterneNeige(outils, a, MA_LANTERNE.x, y, MA_LANTERNE.z, MA_LANTERNE.cap, 1.1);
    const o = ctx.maillage(a.fin(0, false));
    const lampe = { x: MA_LANTERNE.x, y: -500, z: MA_LANTERNE.z - 0.22, halo: 0.38, sol: y, r: 2.6, c: '#ffb45e', mobile: true };
    lumieres.push(lampe);
    const montrer = (oui) => { o.visible = oui; lampe.y = oui ? y + 0.29 : -500; };
    montrer(aLeTampon('iiyama', 'toro'));
    animes.push({ objet: o, maj: () => [] });
    return { montrer, y };
  })();
  monde.cercle(MA_LANTERNE.x, MA_LANTERNE.z, 0.55);
  // (le mât du lampion rouge de Bunbuku : rien ne l'arrêtait)
  monde.cercle(47.3, -68.5, 0.3);

  const interactions = [
    // ---- la rue, la place
    { id: 'chauffeur', passant: 'chauffeur', verbe: 'parler', action: (jeu) => navette(jeu, 'chauffeur', 'B') },
    {
      id: 'honbu', passant: 'honbu', verbe: 'parler',
      async action(jeu) { await jeu.dire(jeu.txn('honbu'), 'honbu'); await soirOuMatin(jeu, 'honbu'); },
    },
    {
      id: 'banane', passant: 'banane', verbe: 'parler',
      async action(jeu) { await jeu.dire(jeu.txn('banane'), 'banane'); jeu.geste('offrir'); await jeu.attendre(900); jeu.geste(null); await comp(jeu, 'bananeCompagnon'); },
    },
    {
      id: 'kinoko', passant: 'kinoko', verbe: 'parler',
      async action(jeu) { await jeu.dire(jeu.txn('kinoko'), 'kinoko'); jeu.geste('boire'); await jeu.attendre(1700); jeu.geste(null); await jeu.dire(jeu.tx('kinokoBu')); },
    },
    {
      id: 'amazake', passant: 'amazake', verbe: 'parler',
      async action(jeu) { await jeu.dire(jeu.txn('amazake'), 'amazake'); jeu.geste('boire'); await jeu.attendre(1700); jeu.geste(null); await comp(jeu, 'amazakeCompagnon'); },
    },
    parler('sasa'), parler('soba'), parler('pork'), parler('frileux'), parler('frileuse'), parler('gourmand'), parler('promeneur'),
    { id: 'boissons', x: -18.6, z: 20.6, rayon: 2.6, haut: 1.1, verbe: 'regarder', action: (jeu) => jeu.dire(jeu.tx('boissons')) },
    { id: 'poteauParc', x: 3.9, z: 18.9, rayon: 2.0, haut: 1.6, verbe: 'lire', action: (jeu) => jeu.dire(jeu.tx('poteauParc')) },
    ...[[-8.5, 31.5], [9.5, 37.5]].map(([x, z], k) => ({ id: `brasero${k}`, x, z, rayon: 1.7, haut: 1.0, verbe: 'chauffer', si: (jeu) => !jeu.aDansSac('torche'), async action(jeu) { jeu.geste('offrir'); await jeu.attendre(1300); jeu.geste(null); await comp(jeu, 'braseroCompagnon'); } })),
    // ---- la grande terrasse
    {
      id: 'chef', passant: 'chef', verbe: 'parler', tampon: 'yukizo',
      async action(jeu) {
        if (jeu.aTampon('yukizo')) { await jeu.dire(jeu.txn('chefEncore'), 'chef'); return; }
        const r = await jeu.choisir(jeu.tx('chef'), [jeu.tx('chefOui'), jeu.t('non')], 'chef');
        if (r !== 0) return;
        await jeu.fondu(true);
        jeu.placer(-28.9, -33.6, -PI / 2);
        jeu.cameraDerriere(0.5);
        await jeu.attendre(200);
        await jeu.fondu(false);
        for (let k = 0; k < 3; k++) {
          jeu.geste('creuser');
          await jeu.attendre(620);
          jeu.son('pelle');
          poudre.emettre(-30.1, Y1 + 0.9 + 0.25 * k, -33.6, 14, { large: 0.3, vx: 0.9, vy: 1.8, vz: 0, ecart: 1.2, vie: 0.8 });
          await jeu.attendre(520);
        }
        jeu.geste(null);
        await jeu.dire(jeu.tx('chefMerci'), 'chef');
        await jeu.tampon('yukizo');
        await comp(jeu, 'yukizoCompagnon');
      },
    },
    parler('sculptrice'), parler('photographe'), parler('mere'), parler('fillette'), parler('papi'), parler('lapine'), parler('benevole'),
    { id: 'dragon', x: 0, z: -45.6, rayon: 3.2, haut: 2.2, verbe: 'regarder', vers: [-3, -50.6], action: (jeu) => jeu.dire(jeu.txn('dragon')) },
    { id: 'concours', x: 9.2, z: -18.4, rayon: 2.2, haut: 1.6, verbe: 'lire', vers: [9.2, -19.2], action: (jeu) => jeu.dire(jeu.tx('concours')) },
    { id: 'ecriteauTengu', x: CERCLE.x - 3.4, z: CERCLE.z + 6.5, rayon: 2.0, haut: 1.5, verbe: 'lire', vers: [CERCLE.x - 3.4, CERCLE.z + 5.6], si: (jeu) => !jeu.estNuit, action: (jeu) => jeu.dire(jeu.tx('ecriteauTengu')) },
    // ---- le coin des enfants
    {
      id: 'animatrice', passant: 'animatrice', verbe: 'parler', tampon: 'toro',
      async action(jeu) {
        if (jeu.aTampon('toro')) { await jeu.dire(jeu.txn('animatriceEncore'), 'animatrice'); return; }
        const r = await jeu.choisir(jeu.tx('animatrice'), [jeu.t('oui'), jeu.t('non')], 'animatrice');
        if (r !== 0) return;
        await jeu.fondu(true);
        jeu.placer(MA_LANTERNE.x, MA_LANTERNE.z - 1.25, 0);
        jeu.cameraDerriere(0.6);
        await jeu.attendre(200);
        await jeu.fondu(false);
        await jeu.dire(jeu.tx('lanterne1'), 'animatrice');
        for (let k = 0; k < 2; k++) { jeu.geste('creuser'); await jeu.attendre(650); jeu.son('pelle'); poudre.emettre(MA_LANTERNE.x, maLanterne.y + 0.3, MA_LANTERNE.z, 10, { large: 0.25, vy: 1.4, ecart: 1.0, vie: 0.7 }); await jeu.attendre(450); }
        jeu.geste(null);
        jeu.nuage(MA_LANTERNE.x, maLanterne.y + 0.4, MA_LANTERNE.z, 0.7);
        maLanterne.montrer(true);
        await jeu.attendre(500);
        await jeu.dire(jeu.tx('lanterne2'), 'animatrice');
        await jeu.tampon('toro');
        await comp(jeu, 'toroCompagnon');
      },
    },
    parler('glisseur'), parler('maman'), parler('igloo'),
    // ---- le haut du château
    {
      id: 'liftier', passant: 'liftier', verbe: 'parler', tampon: 'slider',
      async action(jeu) {
        const r = await jeu.choisir(jeu.tx(jeu.aTampon('slider') ? 'liftierEncore' : 'liftier'), [jeu.t('oui'), jeu.t('non')], 'liftier');
        if (r !== 0) return;
        await jeu.dire(jeu.tx(jeu.tactile ? 'liftierConsigneTel' : 'liftierConsigneOrdi'), 'liftier');
        await jeu.fondu(true);
        lancerGlisse(jeu);
        await jeu.attendre(250);
        await jeu.fondu(false);
      },
    },
    parler('prieur'), parler('amoureuse'), parler('amoureux'),
    // ---- le secret : le grand tengu, le soir (on l'appelle de tout le tour de son cercle), et le grand feu du haut du château
    {
      id: 'tengu', x: CERCLE.x, z: CERCLE.z + CERCLE.r + 0.5, y: Y1, rayon: 1.8, haut: 1.6, verbe: 'appeler', si: (jeu) => jeu.estNuit, vers: [CERCLE.x, CERCLE.z],
      pres: (x, z) => { const d = Math.hypot(x - CERCLE.x, z - CERCLE.z) || 1; return { x: CERCLE.x + ((x - CERCLE.x) / d) * (CERCLE.r + 0.5), z: CERCLE.z + ((z - CERCLE.z) / d) * (CERCLE.r + 0.5) }; },
      async action(jeu) {
        tengu.tenue.repos = true;
        await jeu.attendre(800);
        if (secretTrouve('noroshi')) await jeu.dire(jeu.tx('tenguApres'), 'tengu');
        else if (jeu.aDansSac('torche')) await jeu.dire(jeu.tx('tenguDeja'), 'tengu');
        else {
          await jeu.dire(jeu.tx('tengu'), 'tengu');
          torche.prendre(jeu);
          jeu.son('pouf');
          await jeu.dire(jeu.tx('tenguFlamme'));
          jeu.voirIndice('noroshi-flamme');
          await comp(jeu, 'tenguCompagnon');
        }
        tengu.tenue.repos = false;
      },
    },
    ...[0, 1, 2, 3, 4, 5, 6, 7].map((k) => ({ id: `spectateur${k}`, passant: `spectateur${k}`, verbe: 'parler', action: (jeu) => jeu.dire(jeu.tx('spectateurs')[k % 4], `spectateur${k}`) })),
    { id: 'feuAllumer', x: FEU.x, z: FEU.z, y: Y3, rayon: 3.2, haut: 1.8, verbe: 'allumer', si: (jeu) => jeu.estNuit && jeu.aDansSac('torche') && !secretTrouve('noroshi'), action: (jeu) => allumerLeFeu(jeu) },
    {
      id: 'feuVoir', x: FEU.x, z: FEU.z, y: Y3, rayon: 3.2, haut: 1.8, verbe: 'regarder', si: (jeu) => !(jeu.estNuit && jeu.aDansSac('torche') && !secretTrouve('noroshi')),
      async action(jeu) {
        if (secretTrouve('noroshi')) { await jeu.dire(jeu.tx(jeu.estNuit ? 'feuBrule' : 'feuCendres')); return; }
        if (jeu.aDansSac('torche')) { await jeu.dire(jeu.tx('feuTorcheJour')); return; }
        await jeu.dire(jeu.tx(jeu.estNuit ? 'feuNuit' : 'feuJour'));
        jeu.voirIndice('noroshi-bucher');
        await comp(jeu, jeu.estNuit ? 'feuNuitCompagnon' : 'feuJourCompagnon');
      },
    },
    { id: 'ecriteauFeu', x: FEU.x - 2.6, z: FEU.z + 2.5, y: Y3, rayon: 1.5, haut: 1.5, verbe: 'lire', vers: [FEU.x - 2.6, FEU.z + 1.5], action: (jeu) => jeu.dire(jeu.tx('ecriteauFeu')) },
    { id: 'aoi', x: 6.9, z: -86.2, rayon: 2.0, haut: 1.6, verbe: 'lire', vers: [6.6, -85.2], action: (jeu) => jeu.dire(jeu.tx('aoi')) },
    { id: 'vue', x: VUE.x - 1.2, z: VUE.z, rayon: 2.2, haut: 1.4, verbe: 'regarder', vers: [VUE.x + 30, VUE.z], action: (jeu) => jeu.dire(jeu.txn('vue')) },
    // ---- le village des kamakura
    { id: 'chauffeurB', passant: 'chauffeurB', verbe: 'parler', action: (jeu) => navette(jeu, 'chauffeurB', 'A') },
    {
      id: 'cuisiniere', passant: 'cuisiniere', verbe: 'parler',
      async action(jeu) {
        if (jeu.aTampon('nabe') || jeu.aDansSac('nabe')) { await jeu.dire(jeu.txn(jeu.aTampon('nabe') ? 'cuisiniereEncore' : 'cuisiniereAttend'), 'cuisiniere'); await soirOuMatin(jeu, 'cuisiniere'); return; }
        const r = await jeu.choisir(jeu.txn('cuisiniere'), [jeu.tx('cuisiniereOui'), jeu.t('non')], 'cuisiniere');
        if (r !== 0) return;
        jeu.donner('nabe');
        await jeu.dire(jeu.tx('cuisiniereCommande'), 'cuisiniere');
      },
    },
    {
      id: 'monKamakura', x: MIEN.x, z: MIEN.z + MIEN.R + 0.75, y: YB, rayon: 1.9, haut: 1.4, verbe: 'entrer', vers: [MIEN.x, MIEN.z], tampon: 'nabe', quoi: QUOI.nabe,
      async action(jeu) {
        if (!jeu.aDansSac('nabe') && !jeu.aTampon('nabe')) { await jeu.dire(jeu.tx('kamakuraPasCommande')); return; }
        await repas(jeu);
      },
    },
    parler('ancien'), parler('visiteuse'), parler('serveuse'),
    { id: 'panneauKamakura', x: 16.5, z: -308.0, rayon: 2.2, haut: 1.6, verbe: 'lire', vers: [16.5, -309.0], action: (jeu) => jeu.dire(jeu.tx('panneauKamakura')) },
    { id: 'arche', x: 0, z: -308.4, rayon: 2.6, haut: 2.6, verbe: 'regarder', vers: [0, -312], action: (jeu) => jeu.dire(jeu.txn('arche')) },
    {
      id: 'offrande', x: SANCTUAIRE.x, z: SANCTUAIRE.z - SANCTUAIRE.r + 2.55, y: YB, rayon: 1.5, haut: 1.2, verbe: 'prier', vers: [SANCTUAIRE.x, SANCTUAIRE.z - SANCTUAIRE.r + 0.55], tampon: 'jinja', quoi: QUOI.jinja,
      async action(jeu) {
        await jeu.dire(jeu.tx('offrande'));
        jeu.son('saisen');
        await jeu.attendre(600);
        jeu.geste('prier');
        await jeu.attendre(2600);
        jeu.geste(null);
        if (!jeu.aTampon('jinja')) { await jeu.tampon('jinja'); await comp(jeu, 'jinjaCompagnon'); } else await comp(jeu, 'jinjaEncoreCompagnon');
      },
    },
    { id: 'borneSanctuaire', x: 3.3, z: ALLEE_B.z1 + 1.5, rayon: 1.8, haut: 1.5, verbe: 'lire', vers: [3.3, ALLEE_B.z1 + 0.6], action: (jeu) => jeu.dire(jeu.tx('borneSanctuaire')) },
    { id: 'chantier', x: -3.7, z: -372.4, y: YB, rayon: 1.9, haut: 1.4, verbe: 'regarder', vers: [CHANTIER.x, CHANTIER.z], action: (jeu) => jeu.dire(jeu.tx('chantier')) },
    ...interactionsBancs(bancs),
  ];
  const actionBete = async (jeu, b) => jeu.dire(jeu.txn(b.id));

  finirDecor();
  const depart = { x: DEPART.x, z: DEPART.z, cap: PI };
  return {
    ...infos, textes: TEXTES,
    objets, monde, terrain, etiquettes, passants, daims: [], interactions, actionDaim: null, vapeurs, bancs, lumieres, actionBete, animes,
    // (le secret, tresors.js ; Bunbuku ; les feux d'artifice de sa boutique : au-dessus de la rivière, à l'est, vus de toute la fête ; au village
    // des kamakura, d'où la crête boisée les cacherait, au-dessus de la forêt du nord, derrière le sanctuaire de neige)
    secret: 'noroshi', marchand: MARCHAND, conduite: glisse,
    // (Sumi, le peintre d'Inkami, son étal et son tableau — inkami.js : sur la place de la fête, à droite du chemin qui va du départ à la montée du
    // château, la toile tournée vers qui arrive ; le second tableau, seul, au village des kamakura : contre le talus, à gauche de l'arche)
    peintre: { x: 4.6, z: 32.4, cap: -0.3, tableau: 'yukizo', autre: { x: -9.5, z: -309.6, cap: 0.25, tableau: 'kamakura' } },
    get feux() { return zJoueur > Z_CRETE ? { x: 150, y: 0, z: -40, large: 90, haut: [70, 105], echelle: 1.5, loin: 150 } : { x: 0, y: YB, z: -490, large: 90, haut: [70, 105], echelle: 1.5, loin: 150 }; },
    sons: ['pelle', 'saisen', 'claque', 'slurp', 'pouf', 'oiseau/top', 'oiseau/depart', 'oiseau/rate', 'oiseau/arrivee', 'oiseau/torche', 'oiseau/feu'],
    aspectSol: (x, z, h) => aspectSol(P, x, z, h),
    solDetaille,
    etendue: ETENDUE,
    // (toujours l'hiver : le calendrier magique n'y change rien)
    saison: 'hiver',
    // (un jour de neige : le ciel couvert, une lumière douce, peu d'ombre ; les ombres de la neige sont bleues)
    jour: { lumiere: { ambiance: 1.28, force: 2.35, ciel: '#b0c8ff', sol: '#dce6ff' }, cielHaut: '#5f9ddc', horizon: '#d6e6f5' },
    nuit: { ambiance: 1.0, force: 0.9, ciel: '#4a5cb8', sol: '#39407a', lune: '#9cb0ff' },
    vent: { dir: [0.8, 0.6], force: 0.7 }, oiseaux: [], ambiances: [],
    brume: [160, 2600],
    flou: [140, 520],
    // (le soleil du matin, à l'est-sud-est : les maisons de la rue ne font pas d'ombre sur la place)
    soleil: [0.74, 0.62, 0.26],
    depart,
    photos: {
      heros: { x: 0, z: 30, cap: PI, lacet: 0.3, tangage: 0.2, distance: 6.2 },
      perso: { x: DEPART.x, z: DEPART.z, cap: PI, lacet: 0, tangage: 0.12, distance: 4.4 },
    },
  };
}

// ---------------------------------------------------------------- Les formes du décor (o : { THREE, P, NEIGE, TAILLEE, OMBRE, AMBRE, DEDANS_K, hasard })
/**
 * Un manteau de neige sur un dessus plat (un mur, un auvent, une table) : l × p, épais de e, son milieu en pose.y ; le dessus bombé, les bords
 * qui s'arrondissent et retombent un peu.
 */
function manteau(o, a, l, p, e, pose) {
  const g = new o.THREE.BoxGeometry(l, e, p, Math.max(2, Math.round(l / 0.8)), 2, Math.max(2, Math.round(p / 0.8)));
  return a.piece(g, o.NEIGE, { ...pose, nuance: 0.02, deformer: (x, y, z) => {
    const bord = Math.max(Math.abs(x) / (l / 2), Math.abs(z) / (p / 2)) ** 3, onde = 0.07 * e * Math.sin(x * 1.9 + 1.3) * Math.cos(z * 1.6 + 0.4);
    if (y > 0.01) return [x * (1 - 0.05 * bord), y * (1 - 0.6 * bord) + onde, z * (1 - 0.05 * bord)];
    if (y < -0.01) return [x * (1 + 0.02 * bord), y - 0.1 * e * bord, z * (1 + 0.02 * bord)];
    return [x * (1 + 0.03 * bord), y - 0.05 * e * bord, z * (1 + 0.03 * bord)];
  } });
}
/**
 * La neige d'un toit japonais (toitJapon l × p, haut de h, son bord en y) : elle suit ses pans creusés, épaisse de e, et déborde un peu ;
 * plat : la part du haut qui est plate (ratioHaut du toit).
 */
function manteauPente(o, a, x, y, z, l, p, h, e, plat = 0.12, ry = 0) {
  const g = new o.THREE.BoxGeometry(l, 1, p, Math.max(4, Math.round(l / 0.55)), 1, Math.max(4, Math.round(p / 0.45)));
  return a.piece(g, o.NEIGE, { x, y, z, ry, nuance: 0.02, deformer: (px, py, pz) => {
    const u = Math.abs(px) / (l / 2), v = Math.abs(pz) / (p / 2), t = Math.min(1, Math.max(0, Math.min(1 - v, (1 - u) * (l / p))) / (1 - plat));
    const monte = h * t ** 1.7, bord = Math.max(u, v) ** 4;
    return py > 0 ? [px, monte + e * (1 - 0.55 * bord) + 0.04 * e * Math.sin(px * 2.3) * Math.cos(pz * 2.9), pz] : [px * 0.985, monte - 0.06 - 0.1 * bord, pz * 0.985];
  } });
}
/** Une lanterne de neige (雪灯ろう) : un petit dôme tassé dans un seau puis démoulé, une niche creusée où brûle une bougie ; s : sa taille (1 : 52 cm). */
function lanterneNeige(o, a, x, y, z, cap, s = 1) {
  const { THREE } = o, V = (r, h) => new THREE.Vector2(r * s, h * s);
  a.piece(new THREE.LatheGeometry([V(0.245, -0.06), V(0.25, 0.1), V(0.235, 0.28), V(0.19, 0.4), V(0.1, 0.49), V(0.001, 0.52)], 10), o.TAILLEE, { x, y, z, ry: cap, nuance: 0.02 });
  // (la niche : une petite arche d'ambre, à fleur de la neige, qui s'allume la nuit)
  const sx = Math.sin(cap), cz = Math.cos(cap);
  a.boite(0.19 * s, 0.17 * s, 0.05, o.AMBRE, { x: x + sx * 0.222 * s, y: y + 0.16 * s, z: z + cz * 0.222 * s, ry: cap, sorte: 'lumiere', trait: false })
    .ovale(0.095 * s, o.AMBRE, { x: x + sx * 0.222 * s, y: y + 0.245 * s, z: z + cz * 0.222 * s, ry: cap, sz: 0.27, sorte: 'lumiere', trait: false }, 8);
  return a;
}
/** Une barrière de chantier (un tréteau en A, sa planche rayée jaune et noire), large de 1,5 m, en travers de ry. */
function barriere(o, a, x, y, z, ry) {
  const c = Math.cos(ry), s = Math.sin(ry), P = (u, h, v) => [x + u * c + v * s, y + h, z - u * s + v * c];
  for (const u of [-0.68, 0.68]) for (const v of [-0.26, 0.26]) a.baton(P(u, 0, v), P(u, 0.95, 0), 0.022, '#d8b02a', 5);
  for (let k = 0; k < 8; k++) { const q = P(-0.656 + k * 0.1875, 0.78, 0); a.boite(0.1875, 0.22, 0.04, k % 2 ? '#2f2c30' : '#e8c22a', { x: q[0], y: q[1], z: q[2], ry, trait: k === 0 }); }
  a.boite(1.5, 0.1, 0.035, '#e8c22a', { x, y: y + 0.42, z, ry });
  return a;
}
/**
 * Une maison de la rue, sa façade au nord (vers la rue) : deux niveaux, un toit à deux pans chargé de neige, et devant, l'arcade de bois
 * (雁木) sous son auvent ; l'enseigne [texte, fond, encre] au-dessus de l'auvent. cx, cz : son milieu ; y : le sol de la rue.
 */
function maisonArcade(o, a, cx, cz, y, { l, p, h, mur, bois, toit, ecrire, enseigne, graine }) {
  const { P, NEIGE, hasard } = o, zf = cz - p / 2, hf = 2.3, pente = Math.atan2(hf, p / 2 + 0.7), lp = Math.hypot(hf, p / 2 + 0.7);
  a.boite(l, h, p, mur, { x: cx, y: y + h / 2, z: cz, nuance: 0.03 });
  a.pignon(l, hf * (p / 2) / (p / 2 + 0.7), p, mur, { x: cx, y: y + h - 0.01, z: cz });
  // les deux pans de tuiles, et leur neige (épaisse : on la descend à la pelle deux ou trois fois par hiver)
  for (const s of [-1, 1]) {
    const zm = cz + s * (p / 2 + 0.7) / 2, ym = y + h + hf / 2 + 0.05;
    a.boite(l + 0.9, 0.12, lp + 0.25, toit[graine % 3], { x: cx, y: ym, z: zm, rx: s * pente, nuance: 0.03 });
    a.boite(l + 1.0, 0.46, lp + 0.3, NEIGE, { x: cx, y: ym + 0.29, z: zm, rx: s * pente, nuance: 0.015 });
    a.cylindre(0.27, 0.27, l + 1.0, 8, NEIGE, { x: cx, y: y + h + 0.3, z: cz + s * (p / 2 + 0.84), rz: Math.PI / 2, nuance: 0.015 });
  }
  a.cylindre(0.3, 0.3, l + 1.0, 8, NEIGE, { x: cx, y: y + h + hf + 0.38, z: cz, rz: Math.PI / 2, nuance: 0.015 });
  // l'étage : ses fenêtres (du papier, allumé la nuit) ; le rez-de-chaussée : la devanture de bois, sa porte à claire-voie, son noren
  const nf = Math.max(2, Math.round(l / 4.2));
  for (let k = 0; k < nf; k++) {
    const x = cx + ((k + 0.5) / nf - 0.5) * (l - 1.2);
    a.boite(1.5, 1.15, 0.06, bois, { x, y: y + h - 1.25, z: zf - 0.03 }).boite(1.34, 0.99, 0.05, P.shoji, { x, y: y + h - 1.25, z: zf - 0.05, trait: false });
    a.boite(0.04, 0.99, 0.06, bois, { x, y: y + h - 1.25, z: zf - 0.06, trait: false });
  }
  a.boite(l - 0.4, 2.3, 0.08, bois, { x: cx, y: y + 1.2, z: zf - 0.04, nuance: 0.03 });
  const xd = cx + (hasard(graine, 21) - 0.5) * (l - 5);
  a.boite(1.9, 1.95, 0.05, P.shoji, { x: xd, y: y + 1.02, z: zf - 0.09, trait: false });
  for (let j = 0; j < 9; j++) a.boite(0.035, 1.95, 0.04, bois, { x: xd - 0.9 + j * 0.225, y: y + 1.02, z: zf - 0.105, trait: false });
  a.boite(2.0, 0.5, 0.03, enseigne[1], { x: xd, y: y + 1.98, z: zf - 0.16, trait: false });
  // l'arcade : l'auvent en pente douce, ses poteaux au bord du trottoir, sa sablière, sa neige
  const za = zf - 1.15, zb = zf - 2.25;
  a.boite(l + 0.2, 0.09, 2.5, toit[(graine + 1) % 3], { x: cx, y: y + 2.86, z: za, rx: -0.16 });
  manteau(o, a, l + 0.3, 2.6, 0.42, { x: cx, y: y + 3.14, z: za - 0.05, rx: -0.16 });
  a.boite(l + 0.1, 0.16, 0.16, bois, { x: cx, y: y + 2.58, z: zb });
  const np = Math.max(2, Math.round(l / 3.1));
  for (let k = 0; k <= np; k++) a.boite(0.15, 2.56, 0.15, bois, { x: cx - l / 2 + 0.1 + (k / np) * (l - 0.2), y: y + 1.26, z: zb });
  // l'enseigne, au-dessus de l'auvent, contre la façade
  a.boite(2.5, 0.78, 0.07, enseigne[1], { x: cx, y: y + 3.78, z: zf - 0.07 });
  ecrire({ x: cx, y, z: zf - 0.115, ry: Math.PI }, { texte: enseigne[0], x: 0, y: 3.78, z: 0, l: 2.2, h: 0.62, fond: null, encre: enseigne[2] });
  return a;
}
/** La navette (un petit autocar blanc à bande bleue), longue de 6,3 m : son avant vers +z du repère R ; y : la chaussée. */
function minibus(o, a, R, y, ecrire, pose) {
  const BLANC = '#f2f1ec', BLEU = '#2f6aa0', VITRE = '#35454f', PNEU = '#2a2a2c';
  a.boite(2.05, 1.9, 6.2, BLANC, R(0, y + 1.45, 0, { nuance: 0.02 })).boite(2.07, 0.34, 6.22, BLEU, R(0, y + 0.95, 0)).boite(2.0, 0.3, 6.0, '#3a3d42', R(0, y + 0.42, 0));
  a.boite(1.9, 0.14, 5.6, BLANC, R(0, y + 2.46, -0.1));
  // les vitres des côtés, le pare-brise, la vitre arrière ; la porte, à gauche du sens de la marche (on roule à gauche au Japon)
  for (const s of [-1, 1]) {
    for (let k = 0; k < 4; k++) a.boite(0.04, 0.72, 1.12, VITRE, R(s * 1.03, y + 1.85, -2.25 + k * 1.28, { trait: false }));
    for (const z of [-1.95, 2.05]) a.cylindre(0.4, 0.4, 0.26, 12, PNEU, R(s * 0.93, y + 0.4, z, { rz: Math.PI / 2 })).cylindre(0.2, 0.2, 0.28, 10, '#b8bcc0', R(s * 0.93, y + 0.4, z, { rz: Math.PI / 2, trait: false }));
  }
  a.boite(1.8, 0.86, 0.05, VITRE, R(0, y + 1.82, 3.1, { trait: false })).boite(1.7, 0.7, 0.05, VITRE, R(0, y + 1.85, -3.1, { trait: false }));
  a.boite(0.05, 1.75, 0.95, '#dfe1e2', R(1.035, y + 1.28, 1.95)).boite(0.06, 0.8, 0.75, VITRE, R(1.04, y + 1.72, 1.95, { trait: false }));
  for (const s of [-1, 1]) a.boite(0.36, 0.16, 0.06, '#f8e9a8', R(s * 0.7, y + 0.82, 3.11, { sorte: 'lumiere', trait: false })).boite(0.3, 0.14, 0.06, '#c8372d', R(s * 0.72, y + 0.9, -3.11, { trait: false }));
  // sa destination, au-dessus du pare-brise et sur son flanc gauche
  a.boite(1.5, 0.26, 0.05, '#2a2a2c', R(0, y + 2.3, 3.11, { trait: false }));
  ecrire({ x: pose.x, y, z: pose.z, ry: pose.ry }, { texte: 'かまくらの里', x: 0, y: 2.3, z: 3.14, l: 1.4, h: 0.22, fond: null, encre: '#ffcf5a' });
  ecrire({ x: pose.x, y, z: pose.z, ry: pose.ry }, { texte: 'いいやま雪まつり　シャトルバス', x: 1.048, y: 0.95, z: -0.6, ry: Math.PI / 2, l: 3.4, h: 0.26, fond: null, encre: '#f4f2ea' });
  // (la neige sur son toit)
  manteau(o, a, 1.95, 5.7, 0.2, R(0, y + 2.6, -0.1));
  return a;
}
/**
 * Une tente de la fête (les grandes tentes blanches des fêtes japonaises) : quatre montants, un toit à deux pans, un lambrequin, trois côtés de
 * toile ; devant (+z du repère), le comptoir et sa nappe à la couleur du stand, l'enseigne au-dessus. T : { id, bande, titre, sous }.
 */
function tente(o, a, R, y, T, ecrire) {
  const { THREE, NEIGE } = o, BACHE = '#f3f0e8', ACIER = '#9aa2a8', L = 3.6, D = 3.0, H = 2.12;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const q = R(sx * (L / 2 - 0.06), 0, sz * (D / 2 - 0.06)); a.baton([q.x, y - 0.1, q.z], [q.x, y + H, q.z], 0.028, ACIER, 6); }
  a.pignon(L + 0.24, 0.78, D + 0.24, BACHE, R(0, y + H, 0, { nuance: 0.02 }));
  a.boite(L + 0.26, 0.3, 0.025, BACHE, R(0, y + H - 0.14, D / 2 + 0.12)).boite(L + 0.26, 0.3, 0.025, BACHE, R(0, y + H - 0.14, -D / 2 - 0.12));
  a.boite(0.025, 0.3, D + 0.26, BACHE, R(L / 2 + 0.12, y + H - 0.14, 0)).boite(0.025, 0.3, D + 0.26, BACHE, R(-L / 2 - 0.12, y + H - 0.14, 0));
  a.boite(L + 0.28, 0.07, 0.03, T.bande, R(0, y + H - 0.27, D / 2 + 0.125, { trait: false }));
  // la toile du fond et des deux côtés (jusqu'au comptoir)
  a.boite(L - 0.1, H - 0.06, 0.025, BACHE, R(0, y + H / 2, -D / 2 + 0.05, { nuance: 0.02 }));
  for (const sx of [-1, 1]) a.boite(0.025, H - 0.06, D * 0.62, BACHE, R(sx * (L / 2 - 0.05), y + H / 2, -D * 0.19, { nuance: 0.02 }));
  // le comptoir : deux tables bout à bout sous une nappe
  a.boite(L - 0.3, 0.05, 0.74, '#d8d2c4', R(0, y + 0.76, D / 2 - 0.4)).boite(L - 0.28, 0.7, 0.03, T.bande, R(0, y + 0.4, D / 2 - 0.035, { nuance: 0.02 })).boite(L - 0.28, 0.12, 0.035, BACHE, R(0, y + 0.68, D / 2 - 0.03, { trait: false }));
  for (const sx of [-1, 1]) a.boite(0.03, 0.7, 0.72, T.bande, R(sx * (L / 2 - 0.15), y + 0.4, D / 2 - 0.4, { nuance: 0.02 }));
  // l'enseigne, dressée sur le bord du toit
  a.boite(2.7, 0.56, 0.05, T.bande, R(0, y + H + 0.36, D / 2 + 0.1));
  const q0 = R(0, 0, 0);
  ecrire({ x: q0.x, y, z: q0.z, ry: q0.ry }, { texte: T.titre, sous: T.sous, x: 0, y: H + 0.36, z: D / 2 + 0.13, l: 2.5, h: 0.48, fond: null, encre: '#fbf6ea' });
  // ce qu'on y sert, sur le comptoir
  const yc = y + 0.79, zc = D / 2 - 0.4, plat = (x, z, l, p, c) => a.boite(l, 0.03, p, c, R(x, yc + 0.015, z, { trait: false }));
  if (T.id === 'banane') {
    // les バナナボート : une génoise pliée sur de la crème et une banane, dans leur papier ; rangés sur des plateaux
    for (const x of [-1.05, 0, 1.05]) { plat(x, zc, 0.8, 0.5, '#e8e2d2'); for (let k = 0; k < 6; k++) a.ovale(0.085, k % 2 ? '#f0d68a' : '#e8c66e', R(x - 0.26 + (k % 3) * 0.26, yc + 0.075, zc - 0.11 + Math.floor(k / 3) * 0.22, { sx: 1.25, sy: 0.6, sz: 0.8, trait: false }), 8); }
  } else if (T.id === 'sasa') {
    // les 笹寿司 : du riz vinaigré sur une feuille de bambou nain, garni de légumes de montagne, d'omelette, de gingembre rouge
    for (const x of [-1.05, 0, 1.05]) { plat(x, zc, 0.84, 0.52, '#3a2c24'); for (let k = 0; k < 8; k++) { const px = x - 0.3 + (k % 4) * 0.2, pz = zc - 0.12 + Math.floor(k / 4) * 0.24; a.boite(0.17, 0.012, 0.2, '#3f8a4a', R(px, yc + 0.04, pz, { ry: 0.3, trait: false })).boite(0.1, 0.03, 0.12, '#f6f2e6', R(px, yc + 0.06, pz, { trait: false })).boite(0.04, 0.012, 0.05, k % 3 ? '#e8c84a' : '#d8452e', R(px, yc + 0.082, pz, { trait: false })); } }
  } else if (T.id === 'kinoko' || T.id === 'amazake') {
    // une grande marmite sur son réchaud, sa louche, des bols (ou des gobelets) empilés
    const c = T.id === 'kinoko' ? '#8a6a48' : '#f3ead6';
    a.cylindre(0.3, 0.3, 0.2, 10, '#5a5a5e', R(-0.9, yc + 0.1, zc)).cylindre(0.4, 0.36, 0.42, 14, '#3a3a3e', R(-0.9, yc + 0.41, zc)).cylindre(0.37, 0.37, 0.02, 14, c, R(-0.9, yc + 0.6, zc, { trait: false }));
    a.baton([R(-0.9, 0, zc).x, yc + 0.58, R(-0.9, 0, zc).z], [R(-0.55, 0, zc - 0.25).x, yc + 0.92, R(-0.55, 0, zc - 0.25).z], 0.014, '#c8ccd0', 5, { trait: false });
    for (let k = 0; k < 3; k++) for (let j = 0; j < 4; j++) a.cylindre(0.07, 0.05, 0.05, 8, T.id === 'kinoko' ? '#2f2a28' : '#f8f6f0', R(0.35 + k * 0.3, yc + 0.03 + j * 0.022, zc + 0.05, { trait: false }));
  } else if (T.id === 'soba') {
    for (const x of [-1.0, -0.2, 0.6]) { plat(x, zc, 0.62, 0.5, '#3a2c24'); for (let k = 0; k < 2; k++) a.cylindre(0.11, 0.07, 0.07, 10, '#2f2a28', R(x - 0.14 + k * 0.28, yc + 0.065, zc, { trait: false })).cylindre(0.095, 0.095, 0.01, 10, '#b8a888', R(x - 0.14 + k * 0.28, yc + 0.1, zc, { trait: false })); }
  } else if (T.id === 'pork') {
    // le gril et ses brochettes
    a.boite(1.5, 0.16, 0.44, '#3a3a3e', R(-0.6, yc + 0.08, zc)).boite(1.4, 0.02, 0.36, '#c8502a', R(-0.6, yc + 0.165, zc, { sorte: 'lampe', trait: false }));
    for (let k = 0; k < 7; k++) a.baton([R(-1.2 + k * 0.2, 0, zc - 0.26).x, yc + 0.2, R(-1.2 + k * 0.2, 0, zc - 0.26).z], [R(-1.2 + k * 0.2, 0, zc + 0.26).x, yc + 0.2, R(-1.2 + k * 0.2, 0, zc + 0.26).z], 0.008, '#c8b088', 4, { trait: false }).boite(0.05, 0.035, 0.3, k % 2 ? '#a8603a' : '#b86a40', R(-1.2 + k * 0.2, yc + 0.2, zc, { trait: false }));
  } else {
    // le bureau de la fête : des dépliants, le tampon du rallye des sculptures, un mégaphone
    for (const x of [-1.1, -0.6]) a.boite(0.3, 0.05, 0.22, x < -1 ? '#f4f2ea' : '#cfe0f0', R(x, yc + 0.03, zc, { trait: false }));
    a.boite(0.22, 0.04, 0.16, '#3a2c24', R(0.1, yc + 0.02, zc, { trait: false })).cylindre(0.035, 0.035, 0.09, 8, '#b8322a', R(0.1, yc + 0.085, zc, { trait: false }));
    a.cone(0.11, 0.28, 10, '#e8452e', R(0.95, yc + 0.11, zc, { rx: Math.PI / 2 })).cylindre(0.04, 0.04, 0.12, 8, '#f4f2ea', R(0.95, yc + 0.11, zc - 0.18, { rx: Math.PI / 2, trait: false }));
  }
  // (la neige du toit : deux pans épais)
  for (const s of [-1, 1]) a.boite(L + 0.3, 0.2, Math.hypot(D / 2 + 0.12, 0.78) + 0.1, NEIGE, R(0, y + H + 0.39 + 0.13, s * (D / 4 + 0.06), { rx: s * Math.atan2(0.78, D / 2 + 0.12), nuance: 0.015 }));
  void THREE;
  return a;
}

/**
 * Un kamakura : un dôme de neige épais et creux, sa porte au sud (+z, tourné de K.ry). K : { x, z, R (dehors), r (dedans), h } ; porte : sa
 * demi-largeur ; hp : sa hauteur ; vide : rien dedans (le sanctuaire a son autel). Sinon : une natte, la table basse, le réchaud et la marmite,
 * des coussins. Son dedans s'allume la nuit (« lumiere »).
 */
function kamakura(o, a, K, y, porte = 0.56, hp = 1.5, vide = false) {
  const { THREE, TAILLEE, DEDANS_K } = o, PI = Math.PI, { x, z, R, r, h } = K, ry = K.ry || 0, hi = h - (R - r) * 0.95;
  const FORME = [[1.0, 0], [1.0, 0.2], [0.96, 0.45], [0.84, 0.7], [0.6, 0.9], [0.3, 0.985], [0.001, 1]];
  const rayonA = (Rr, H, yy) => { const t = yy / H; for (let i = 0; i + 1 < FORME.length; i++) if (t <= FORME[i + 1][1]) { const f = (t - FORME[i][1]) / (FORME[i + 1][1] - FORME[i][1]); return Rr * (FORME[i][0] + (FORME[i + 1][0] - FORME[i][0]) * f); } return 0.001; };
  const profil = (Rr, H, y0) => [new THREE.Vector2(Rr, y0), ...FORME.slice(1).map(([k, t]) => new THREE.Vector2(Rr * k, H * t))];
  const haut = (Rr, H, y0) => { const pts = [new THREE.Vector2(rayonA(Rr, H, y0), y0)]; for (const [k, t] of FORME) if (H * t > y0 + 0.02) pts.push(new THREE.Vector2(Rr * k, H * t)); return pts; };
  const gD = 2 * Math.asin(Math.min(0.95, porte / R)), gI = 2 * Math.asin(Math.min(0.95, porte / r));
  const pose = { x, y, z, ry, nuance: 0.02 }, c = Math.cos(ry), s = Math.sin(ry), L = (lx, ly, lz, q = {}) => ({ ...q, x: x + lx * c + lz * s, y: y + ly, z: z - lx * s + lz * c, ry: ry + (q.ry || 0) });
  // dehors : le tour, moins la porte ; au-dessus d'elle, le haut du dôme
  a.piece(new THREE.LatheGeometry(profil(R, h, -0.1), 14, gD / 2, 2 * PI - gD), TAILLEE, pose);
  a.piece(new THREE.LatheGeometry(haut(R, h, hp), 3, -gD / 2, gD), TAILLEE, pose);
  // dedans (ce qu'on voit par la porte) : le même tour, retourné vers l'intérieur
  // (de la neige, à l'ombre le jour, chaude la nuit comme les sculptures éclairées, « illumine » ; en « lumiere », elle brûlait en blanc)
  a.piece(new THREE.LatheGeometry(profil(r, hi, 0).reverse(), 12, gI / 2, 2 * PI - gI), DEDANS_K, { ...pose, sorte: 'illumine', trait: false });
  a.piece(new THREE.LatheGeometry(haut(r, hi, hp).reverse(), 3, -gI / 2, gI), DEDANS_K, { ...pose, sorte: 'illumine', trait: false });
  // l'épaisseur du mur, à la porte : ses deux côtés et son dessus
  const zi = Math.sqrt(r * r - porte * porte), zo = Math.sqrt(R * R - porte * porte), zm = (zi + zo) / 2, ep = zo - zi + 0.16;
  for (const sx of [-1, 1]) {
    a.boite(0.06, hp + 0.06, ep, TAILLEE, L(sx * (porte + 0.02), hp / 2, zm, { trait: false, nuance: 0.02 }));
    // (les deux coins du haut, en biais : la porte s'arrondit ; un coin plein, de toute l'épaisseur du mur)
    const k = porte * 0.6, zf = zo + 0.03, zb = zi - 0.03, Q = (lx, ly, lz) => { const q = L(lx, ly, lz); return [q.x, q.y, q.z]; };
    const A1 = Q(sx * porte, hp, zf), B1 = Q(sx * porte, hp - k, zf), C1 = Q(sx * (porte - k), hp, zf), A2 = Q(sx * porte, hp, zb), B2 = Q(sx * porte, hp - k, zb), C2 = Q(sx * (porte - k), hp, zb);
    const tri = [A1, B1, C1, A1, C1, B1, A2, B2, C2, A2, C2, B2, B1, B2, C2, B1, C2, C1, B1, C2, B2, B1, C1, C2];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(tri.flat(), 3));
    a.piece(g, TAILLEE, { trait: false, nuance: 0.02 });
  }
  a.boite(2 * porte + 0.1, 0.08, ep, TAILLEE, L(0, hp + 0.03, zm, { trait: false, nuance: 0.02 }));
  if (vide) return a;
  // la natte de paille, la table basse, le réchaud à gaz et la marmite de fonte, les coussins autour
  a.cylindre(r * 0.82, r * 0.82, 0.03, 14, '#c8b27a', L(0, 0.03, 0, { trait: false }));
  a.boite(0.95, 0.07, 0.95, '#8a6a48', L(0, 0.37, -0.12)).boite(0.7, 0.32, 0.7, '#6a4e36', L(0, 0.19, -0.12, { trait: false }));
  a.boite(0.36, 0.09, 0.3, '#3a3d42', L(0, 0.45, -0.12, { trait: false })).cylindre(0.21, 0.17, 0.13, 12, '#2a2a2c', L(0, 0.56, -0.12)).cylindre(0.19, 0.19, 0.012, 12, '#b8763a', L(0, 0.625, -0.12, { trait: false }));
  for (const [lx, lz] of [[-0.82, -0.12], [0.82, -0.12], [0, -0.94], [-0.6, 0.62], [0.6, 0.62]]) a.boite(0.46, 0.09, 0.46, '#b8322a', L(lx, 0.085, lz, { ry: lx * 0.3, trait: false }));
  // (une petite lampe posée dans une niche du fond)
  a.boite(0.16, 0.2, 0.1, '#ffd98a', L(0, 0.95, -r + 0.16, { sorte: 'lampe', trait: false }));
  return a;
}

// ---------------------------------------------------------------- Les sculptures de neige (éclairées la nuit : « illumine »)
/** Le grand dragon qui monte des vagues (昇り龍), vu de profil, la tête à l'ouest : vingt mètres de long ; X, Z : son milieu, Y : le sol ; sa face au sud. */
function sculptureDragon(o, a, X, Y, Z) {
  const { THREE, TAILLEE, OMBRE } = o, S = { sorte: 'illumine', nuance: 0.025 }, PI = Math.PI, B = Y + 0.95;
  // le socle : un long banc de neige au dessus inégal
  a.piece(new THREE.BoxGeometry(20.4, 1.1, 4.6, 20, 1, 5), TAILLEE, { ...S, x: X, y: Y + 0.45, z: Z, deformer: (x, y, z) => (y > 0 ? [x, y + 0.14 * Math.sin(x * 0.9) * Math.cos(z * 1.3) + 0.22 * (1 - (z / 2.3) ** 2), z] : [x, y, z]) });
  // les vagues, sur sa face : deux rangs d'arcs qui se chevauchent (le motif des vagues, 青海波)
  for (let k = 0; k < 13; k++) {
    const x = X - 9.2 + k * 1.53;
    a.piece(new THREE.TorusGeometry(0.74, 0.1, 4, 9, PI), TAILLEE, { ...S, x, y: Y + 0.02, z: Z + 2.3 });
    a.piece(new THREE.TorusGeometry(0.42, 0.085, 4, 7, PI), TAILLEE, { ...S, x, y: Y + 0.02, z: Z + 2.32 });
    if (k < 12) a.piece(new THREE.TorusGeometry(0.6, 0.09, 4, 8, PI), TAILLEE, { ...S, x: x + 0.765, y: Y + 0.5, z: Z + 2.26 });
  }
  // le corps : trois boucles qui sortent du socle, de la queue (à l'est) à la tête ; une crête d'épines sur le dos
  const pts = [[9.7, -0.6, -0.2], [7.7, 1.9, 0.1], [5.6, 0.4, 0.5], [3.4, 2.3, 0.2], [1.2, 0.5, -0.5], [-1.2, 2.5, -0.1], [-3.6, 1.2, 0.5], [-5.4, 2.4, 0.9], [-6.6, 3.0, 1.3]].map(([x, y, z]) => [X + x, B + y, Z + z]);
  a.tube(pts, 0.72, TAILLEE, { ...S, pas: 44, cotes: 8 });
  const courbe = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
  for (let t = 0.14; t < 0.93; t += 0.058) {
    const q = courbe.getPoint(t), d = courbe.getTangent(t);
    if (q.y < B + 0.55) continue;
    a.cone(0.2, 0.62, 5, TAILLEE, { ...S, x: q.x, y: q.y + 0.92, z: q.z, rz: Math.atan2(d.y, -d.x) * 0.5 - 0.35 });
  }
  // la tête, de profil : le crâne, le museau, la mâchoire ouverte et ses crocs, les naseaux, l'œil sous son arcade, les cornes, les moustaches, la crinière
  const hx = X - 7.4, hy = B + 3.15, hz = Z + 1.45;
  a.ovale(1.0, TAILLEE, { ...S, x: hx, y: hy, z: hz, sx: 1.3, sy: 0.95, sz: 0.92 }, 12);
  a.boite(1.6, 0.62, 1.05, TAILLEE, { ...S, x: hx - 1.5, y: hy - 0.08, z: hz }).ovale(0.52, TAILLEE, { ...S, x: hx - 2.25, y: hy - 0.05, z: hz, sx: 0.9, sy: 0.62, sz: 1.02 }, 10);
  a.boite(1.5, 0.3, 0.9, TAILLEE, { ...S, x: hx - 1.35, y: hy - 0.78, z: hz, rz: 0.24 });
  for (const s of [-1, 1]) {
    for (let k = 0; k < 4; k++) a.cone(0.075, 0.24, 4, TAILLEE, { ...S, x: hx - 1.0 - k * 0.36, y: hy - 0.48, z: hz + s * 0.44, rx: PI });
    a.boule(0.15, TAILLEE, { ...S, x: hx - 2.42, y: hy + 0.2, z: hz + s * 0.3 }, 1);
    a.boule(0.2, OMBRE, { ...S, x: hx - 0.62, y: hy + 0.42, z: hz + s * 0.74 }, 1).boite(0.85, 0.17, 0.3, TAILLEE, { ...S, x: hx - 0.6, y: hy + 0.72, z: hz + s * 0.72, rz: -0.32 });
    a.cone(0.2, 1.7, 6, TAILLEE, { ...S, x: hx + 0.95, y: hy + 1.2, z: hz + s * 0.5, rz: -1.02 });
    a.tube([[hx - 2.1, hy - 0.2, hz + s * 0.52], [hx - 2.6, hy + 0.5, hz + s * 1.15], [hx - 1.7, hy + 1.15, hz + s * 1.5]], 0.065, TAILLEE, { ...S, pas: 8, cotes: 5 });
    for (let k = 0; k < 3; k++) a.cone(0.24, 0.9, 4, TAILLEE, { ...S, x: hx + 1.1 + k * 0.42, y: hy + 0.35 - k * 0.42, z: hz + s * 0.42, rz: -1.35 - k * 0.2 });
  }
  // la patte qui serre la perle (宝珠), posée sur le socle
  a.boule(0.52, TAILLEE, { ...S, x: X - 4.3, y: B + 0.62, z: Z + 1.75 }, 2).cone(0.2, 0.5, 6, TAILLEE, { ...S, x: X - 4.3, y: B + 1.3, z: Z + 1.75 });
  a.ovale(0.42, TAILLEE, { ...S, x: X - 3.7, y: B + 1.0, z: Z + 1.55, sx: 1.5, sy: 0.8 }, 8);
  for (const dz of [-0.3, 0, 0.3]) a.cone(0.08, 0.42, 4, TAILLEE, { ...S, x: X - 4.22, y: B + 1.02, z: Z + 1.72 + dz, rz: 1.1 });
  return a;
}
/** Le vieil homme au chapeau de paille (celui qui coiffe les Jizō sous la neige, dans le conte) : sa tête, sa barbiche, son grand chapeau, sa botte de paille. */
function sculptureVieux(o, a, R, Y) {
  const { THREE, TAILLEE, OMBRE } = o, S = { sorte: 'illumine', nuance: 0.025 }, PI = Math.PI;
  a.ovale(1, TAILLEE, R(0, Y + 0.3, 0, { ...S, sx: 2.6, sy: 0.6, sz: 2.05 }), 12);
  a.ovale(1.12, TAILLEE, R(0.45, Y + 1.72, 0, { ...S, sy: 1.08, sz: 0.96 }), 14);
  // le nez, les sourcils broussailleux, les yeux plissés (deux creux d'ombre), la moustache et la barbiche
  a.cone(0.2, 0.62, 6, TAILLEE, R(0.45, Y + 1.72, 1.2, { ...S, rx: PI / 2 }));
  for (const s of [-1, 1]) {
    a.boite(0.52, 0.14, 0.22, TAILLEE, R(0.45 + s * 0.45, Y + 2.1, 0.98, { ...S, rz: s * 0.28 }));
    a.ovale(0.15, OMBRE, R(0.45 + s * 0.43, Y + 1.9, 1.0, { ...S, sy: 0.5, sz: 0.5 }), 8);
    a.cone(0.13, 0.55, 5, TAILLEE, R(0.45 + s * 0.3, Y + 1.36, 1.05, { ...S, rz: s * 1.9, rx: 0.3 }));
  }
  a.cone(0.27, 0.95, 6, TAILLEE, R(0.45, Y + 0.78, 0.92, { ...S, rx: PI + 0.25 }));
  // le chapeau : un large dôme bosselé par la neige, plus grand que la tête
  a.piece(new THREE.SphereGeometry(2.05, 16, 6, 0, 2 * PI, 0, PI / 2), TAILLEE, R(0.45, Y + 2.42, -0.1, { ...S, sy: 0.6, rx: -0.12, deformer: (x, y, z) => { const k = 1 + 0.07 * Math.sin(x * 2.3 + 1) * Math.cos(z * 2.6) + 0.05 * Math.sin(y * 5); return [x * k, y * k, z * k]; } }));
  a.cylindre(2.05, 2.1, 0.16, 16, TAILLEE, R(0.45, Y + 2.4, -0.1, { ...S, rx: -0.12 }));
  // la botte de paille, debout à côté de lui, liée de trois cordes
  a.cylindre(0.5, 0.58, 2.2, 10, TAILLEE, R(-1.75, Y + 1.25, 0.35, S)).cone(0.52, 0.5, 10, TAILLEE, R(-1.75, Y + 2.58, 0.35, S));
  for (const h of [0.75, 1.3, 1.9]) a.cylindre(0.6, 0.6, 0.11, 10, TAILLEE, R(-1.75, Y + h, 0.35, S));
  return a;
}
/** Les six Jizō (六地蔵) en rang sur leur socle : cinq ont leur chapeau de paille ; le sixième, le linge du grand-père, noué sous le menton. */
function sculptureJizo(o, a, R, Y) {
  const { THREE, TAILLEE, OMBRE } = o, S = { sorte: 'illumine', nuance: 0.025 }, PI = Math.PI, V = (r, h) => new THREE.Vector2(r, h);
  a.boite(7.6, 0.55, 3.4, TAILLEE, R(0, Y + 0.22, 0, S));
  for (let k = 0; k < 6; k++) {
    const x = -3.05 + k * 1.22, z = 0.25 * Math.sin(k * 1.3), e = 0.92 + 0.14 * ((k * 0.618) % 1), y = Y + 0.48;
    a.piece(new THREE.LatheGeometry([V(0.5 * e, 0), V(0.53 * e, 0.45 * e), V(0.44 * e, 1.05 * e), V(0.33 * e, 1.42 * e), V(0.2 * e, 1.56 * e)], 10), TAILLEE, R(x, y, z, S));
    a.ovale(0.37 * e, TAILLEE, R(x, y + 1.84 * e, z, S), 10);
    // les mains jointes, le bavoir (un bourrelet au cou), le sourire (deux yeux clos)
    a.ovale(0.15 * e, TAILLEE, R(x, y + 1.12 * e, z + 0.4 * e, { ...S, sy: 1.3 }), 8).cylindre(0.3 * e, 0.34 * e, 0.12 * e, 10, TAILLEE, R(x, y + 1.5 * e, z + 0.04, S));
    for (const s of [-1, 1]) a.boite(0.13 * e, 0.03, 0.04, OMBRE, R(x + s * 0.14 * e, y + 1.88 * e, z + 0.35 * e, { ...S, trait: false }));
    if (k < 5) a.cone(0.66 * e, 0.36 * e, 12, TAILLEE, R(x, y + 2.26 * e, z, S));
    else a.ovale(0.42 * e, TAILLEE, R(x, y + 2.02 * e, z - 0.03, { ...S, sy: 0.62 }), 10).boule(0.09 * e, TAILLEE, R(x, y + 1.5 * e, z + 0.33 * e, S), 1);
  }
  void PI;
  return a;
}
/** Le lapin de neige (雪うさぎ) géant : un demi-œuf de neige, deux feuilles pour les oreilles, deux baies rouges pour les yeux. */
function sculptureLapin(o, a, R, Y) {
  const { TAILLEE } = o, S = { sorte: 'illumine', nuance: 0.025 };
  a.ovale(1, TAILLEE, R(0, Y + 0.55, 0, { ...S, sx: 1.3, sy: 1.25, sz: 2.05 }), 16);
  for (const s of [-1, 1]) {
    a.ovale(0.5, '#3f8a4a', R(s * 0.42, Y + 1.72, 0.35, { sx: 0.5, sy: 0.12, sz: 1.7, rx: -0.42, ry: s * 0.16 }), 10);
    a.boule(0.14, '#c8372d', R(s * 0.6, Y + 1.15, 1.6), 1);
  }
  return a;
}
/** Celle qu'on finit encore : un grand daruma qui sort de son bloc de neige ; l'échelle, les pelles, la pelle-traîneau rouge, les seaux, les éclats de neige au pied. */
function sculptureEnCours(o, a, R, Y) {
  const { THREE, TAILLEE, OMBRE, NEIGE, hasard } = o, S = { sorte: 'illumine', nuance: 0.03 }, PI = Math.PI;
  // le bloc, encore brut en bas et à gauche ; le daruma, déjà rond en haut
  a.piece(new THREE.BoxGeometry(5.6, 2.3, 4.2, 5, 2, 4), TAILLEE, R(0, Y + 1.1, 0, { ...S, deformer: (x, y, z) => [x + 0.12 * Math.sin(y * 3 + z * 2), y, z + 0.1 * Math.sin(x * 2.2 + y * 2.7)] }));
  a.ovale(2.15, TAILLEE, R(0.35, Y + 2.7, -0.15, { ...S, sy: 0.98, sz: 0.96 }), 14);
  a.boite(2.3, 2.5, 2.6, TAILLEE, R(-1.75, Y + 3.0, -0.5, { ...S, ry: 0.3 }));
  // son visage, à peine dégrossi : le rond clair, les deux gros sourcils, les yeux encore vides
  a.ovale(1.3, OMBRE, R(0.5, Y + 2.85, 1.72, { ...S, sz: 0.22, sy: 0.88 }), 12);
  for (const s of [-1, 1]) a.boite(0.72, 0.2, 0.2, TAILLEE, R(0.5 + s * 0.55, Y + 3.42, 1.98, { ...S, rz: s * 0.3 })).ovale(0.26, TAILLEE, R(0.5 + s * 0.5, Y + 3.0, 1.98, { ...S, sz: 0.4 }), 8);
  // l'échelle, appuyée à droite ; un tréteau et sa planche, à gauche
  const E0 = R(2.15, 0, 2.95), E1 = R(1.75, 0, 1.75), dx = Math.cos(R(0, 0, 0).ry) * 0.22, dz = -Math.sin(R(0, 0, 0).ry) * 0.22;
  for (const s of [-1, 1]) a.baton([E0.x + s * dx, Y, E0.z + s * dz], [E1.x + s * dx, Y + 3.5, E1.z + s * dz], 0.03, '#b8935a', 5);
  for (let k = 1; k < 9; k++) { const f = k / 9.5, x = E0.x + (E1.x - E0.x) * f, z = E0.z + (E1.z - E0.z) * f; a.baton([x - dx, Y + 3.5 * f, z - dz], [x + dx, Y + 3.5 * f, z + dz], 0.02, '#b8935a', 4, { trait: false }); }
  for (const u of [-2.6, -1.3]) for (const v of [2.5, 3.1]) a.baton([R(u, 0, v).x, Y, R(u, 0, v).z], [R(u, 0, 2.8).x, Y + 0.95, R(u, 0, 2.8).z], 0.028, '#b8935a', 5);
  a.boite(1.9, 0.05, 0.42, '#c8a56a', R(-1.95, Y + 0.98, 2.8));
  // les outils : deux pelles plantées, la grande pelle-traîneau rouge (スノーダンプ), deux seaux ; les éclats de neige tombés
  for (const [u, v, t] of [[2.9, 2.4, 0.2], [-0.4, 2.75, -0.15]]) { const q = R(u, 0, v); a.baton([q.x, Y + 0.25, q.z], [q.x + t, Y + 1.35, q.z], 0.02, '#b8935a', 5).boite(0.26, 0.34, 0.03, '#c8ccd0', { x: q.x - t * 0.1, y: Y + 0.2, z: q.z, ry: q.ry }); }
  a.boite(0.74, 0.3, 0.86, '#d8402c', R(3.15, Y + 0.17, 3.35, { ry: 0.5 })).baton([R(3.0, 0, 3.75).x, Y + 0.3, R(3.0, 0, 3.75).z], [R(2.85, 0, 4.2).x, Y + 1.0, R(2.85, 0, 4.2).z], 0.02, '#d8402c', 5);
  for (const [u, v, c] of [[0.6, 2.9, '#2f6ab0'], [0.95, 3.15, '#e8b23a']]) a.cylindre(0.17, 0.14, 0.3, 10, c, R(u, Y + 0.16, v));
  for (let k = 0; k < 14; k++) { const u = -2.6 + 5.4 * hasard(k, 51), v = 2.25 + 0.9 * hasard(k, 53), r = 0.12 + 0.2 * hasard(k, 57), q = R(u, 0, v); a.rocher(q.x, Y + r * 0.5, q.z, r, NEIGE, { nuance: 0.02 }); }
  void PI;
  return a;
}

// ---------------------------------------------------------------- Les textes
const TEXTES = {
  fr: {
    noms: {
      chauffeur: 'Le chauffeur de la navette', chauffeurB: 'Le chauffeur de la navette', banane: 'La pâtissière', sasa: 'La grand-mère aux sushis', kinoko: 'La voisine', amazake: 'La vendeuse d’amazake',
      honbu: 'Le monsieur de l’accueil', soba: 'Le cuisinier de soba', pork: 'Le rôtisseur', frileux: 'Le monsieur', frileuse: 'La dame', gourmand: 'Le petit garçon', promeneur: 'Le promeneur',
      chef: 'Le chef d’équipe', sculptrice: 'La sculptrice', photographe: 'Le photographe', mere: 'La maman', fillette: 'La petite fille', papi: 'Le grand-père', lapine: 'La petite fille', benevole: 'Le bénévole',
      animatrice: 'L’animatrice', glisseur: 'Le petit garçon', maman: 'La maman', igloo: 'Le papa', liftier: 'Le moniteur', prieur: 'Le vieux monsieur', amoureuse: 'La jeune femme', amoureux: 'Le jeune homme',
      cuisiniere: 'La cuisinière', serveuse: 'La serveuse', ancien: 'L’ancien du village', visiteuse: 'La visiteuse', tengu: 'Le grand tengu',
    },
    tampons: {
      yukizo: ['La grande sculpture de neige', 'sur la grande terrasse du château : donner un coup de pelle à l’équipe qui finit la sienne'],
      slider: ['La descente en bouée', 'tout en haut du château : demander une descente au moniteur du スノースライダー'],
      toro: ['La lanterne de neige', 'au coin des enfants (遊雪エリア), à gauche de la grande terrasse : en fabriquer une avec l’animatrice'],
      nabe: ['La marmite noroshi nabe', 'au village des kamakura, par la navette : la commander à la cuisinière, puis entrer dans la hutte au lampion rouge'],
      jinja: ['Le sanctuaire de neige', 'au bout de l’allée du village des kamakura, derrière le torii rouge : prier devant le tronc à offrandes'],
    },
    arrivee: null,
    // ---- la navette
    chauffeur: ['La navette pour le village des kamakura, à Shinanodaira (信濃平) ? Un quart d’heure de route entre deux murs de neige.', 'On y va ?'],
    chauffeurB: ['On rentre à la fête, au parc du château ?'],
    arriveeB: ['Shinanodaira. Derrière l’arche blanche : le village des kamakura (かまくらの里).'],
    arriveeA: ['Te revoilà au pied du château d’Iiyama. La fête bat son plein !'],
    arriveeBCompagnon: { kon: ['« Des maisons toutes rondes, en neige ! On peut entrer dedans ? »'], pon: ['« Pon ! Ça sent la marmite… Suis mon nez ! »'], chapu: ['« Chapu ! Des igloos ! J’en veux un au bord de ma rivière. »'], gao: ['« Gao. Des dômes bien ronds. Du beau travail. »'], fuwa: ['« Fuwaaa… Des bulles de neige posées sur le blanc… »'], saya: ['« Les cèdres dorment sous la neige. Écoute : même le vent chuchote. »'] },
    arriveeACompagnon: { kon: ['« Brr ! On retourne voir les sculptures ? »'], pon: ['« Pon… Il restait des gâteaux à la banane, non ? »'], chapu: ['« Chapu ! Encore un tour de bouée ! »'], gao: ['« Gao ! Le château n’a pas bougé. Bien. »'], fuwa: ['« Fuwaaa… Le dragon de neige m’attend. »'], saya: ['« Les cerisiers du château rêvent déjà du printemps. »'] },
    // ---- la place des tentes
    honbu: ['Bienvenue à la fête de la neige d’Iiyama (いいやま雪まつり) ! Chaque année, le deuxième week-end de février.', 'Plus de cent sculptures dans toute la ville, et toutes faites par les habitants. En février 1983, des jeunes de chez nous ont voulu faire de la neige, ce fardeau, une fête.', 'Les grandes sont là-haut, sur la terrasse du château. Pour le village des kamakura, prends la navette, au bout de la rue.'],
    honbuNuit: ['À 18 heures, on allume les sculptures (雪像ライトアップ). Et à 18 h 30, le grand tengu de Narazawa danse avec sa torche, là-haut, sur la terrasse !'],
    honbuSoir: ['Le soir, les lanternes de neige s’allument et le grand tengu danse. Tu veux attendre le soir ?'],
    honbuMatin: ['Tu veux que le jour revienne ?'],
    banane: ['Un banana boat (バナナボート) ? C’est LA douceur d’hiver d’Iiyama : une génoise repliée sur de la crème fouettée et une banane entière.', 'Tiens, goûte !'],
    bananeCompagnon: { kon: ['« Mmh… Ça fond comme de la neige. De la neige à la banane ! »'], pon: ['« Pon !! Encore un. Non, deux. C’est pour la route. »'], chapu: ['« Chapu ! J’ai de la crème plein les moustaches ! »'], gao: ['« Gao… Un gardien ne mange pas pendant son service. … Bon, une bouchée. »'], fuwa: ['« Fuwaaa… Un petit bateau tout doux… »'], saya: ['« La banane vient de loin. Elle doit trouver qu’il fait frais, ici. »'] },
    kinoko: ['Approche, approche ! C’est offert par le quartier (ふるまい) : une soupe aux champignons bien chaude (きのこ汁).', 'Ceux qui sculptent ont froid, ceux qui regardent aussi. Alors on fait chauffer la marmite pour tout le monde.'],
    kinokoBu: ['Tu bois un bol de soupe aux champignons. La chaleur descend jusqu’au bout des orteils.'],
    amazake: ['De l’amazake (甘酒) bien chaud ? C’est du riz fermenté, tout doux, sans alcool : la boisson des fêtes d’hiver.', 'Et si tu préfères du froid… les bouteilles sont au frais, juste là, dans le tas de neige !'],
    amazakeCompagnon: { kon: ['« C’est chaud, c’est sucré… Mes oreilles se réchauffent. »'], pon: ['« Pon… Ça sent le riz. J’aime tout ce qui sent le riz. »'], chapu: ['« Chapu ! Ça fume ! Une source chaude dans un gobelet. »'], gao: ['« Gao. Bon pour monter la garde par ce froid. »'], fuwa: ['« Fuwaaa… Un nuage dans un verre… »'], saya: ['« Le riz, l’eau, le temps. Les meilleures choses se font lentement. »'] },
    sasa: ['Du sasa-zushi (笹寿司) : du riz vinaigré sur une feuille de bambou, avec des légumes de montagne, de l’omelette et du gingembre rouge.', 'On raconte que les gens de Tomikura en ont offert à l’armée d’Uesugi Kenshin. On l’appelle aussi le « sushi de Kenshin » !'],
    soba: ['Les soba de Tomikura (富倉そば) ! Ici, on ne lie pas la pâte avec du blé, mais avec les fibres d’une plante de la montagne, l’oyamabokuchi.', 'Elles sont fines, fermes, et elles glissent toutes seules.'],
    pork: ['Des brochettes de porc Miyuki (みゆきポーク), le porc d’Iiyama ! Grillées devant toi.', 'C’est le même qui va dans la marmite du village des kamakura. Tu verras, là-bas !'],
    frileux: ['Ah… Rien de tel qu’un bon feu. Iiyama est une des villes les plus enneigées du Japon, tu sais.', 'Alors on a appris à aimer l’hiver. On n’avait pas trop le choix !'],
    frileuse: ['Tu as vu, en face ? Ces arcades de bois, le long des maisons : des gangi (雁木). Grâce à elles, on marche au sec tout l’hiver.', 'Iiyama a encore sa rue à arcades : celle des fabricants d’autels bouddhiques (仏壇通り).'],
    gourmand: ['J’ai compté les sculptures dans ma rue : onze ! Et dans toute la ville, il y en a plus de cent.', 'La nôtre, c’est un chat. Enfin… c’était censé être un chat.'],
    promeneur: ['Je fais le rallye des sculptures (雪像ウォークラリー) : six grandes sculptures dans les rues, un tampon à chacune.', 'Toi aussi, tu as un carnet de tampons ? Alors on est collègues !'],
    boissons: ['Des bouteilles et des canettes plantées dans un tas de neige. Le frigo d’Iiyama : gratuit, et jamais en panne.'],
    poteauParc: ['« Parc des ruines du château d’Iiyama » (飯山城址公園).', 'Uesugi Kenshin a fait bâtir ce château en 1564, pour ses campagnes de Kawanakajima. Il n’en reste que les murs de pierre ; la porte, là-haut, a été rebâtie.'],
    braseroCompagnon: { kon: ['« Aaah… Mes pattes revivent. »'], pon: ['« Pon… On pourrait y griller un mochi. Juste un. »'], chapu: ['« Chapu ! Pas trop près, ma queue ! »'], gao: ['« Gao. Un bon feu de garde. »'], fuwa: ['« Fuwaaa… Le feu danse comme une algue. »'], saya: ['« Ce bois a poussé cent ans pour nous chauffer un soir. Merci, vieux frère. »'] },
    // ---- la grande terrasse
    chef: ['On finit notre daruma pour ce soir ! Une semaine qu’on tasse, qu’on taille, qu’on lisse. Toute la rue s’y est mise.', 'Il reste un coin à dégrossir, en bas. Tu nous donnes un coup de pelle ?'],
    chefOui: 'Je prends la pelle !',
    chefMerci: ['Bien joué ! Tu vois : la neige se taille comme du beurre, quand elle est bien tassée.', 'Les plus grandes sculptures dépassent trois mètres de haut et vingt de large. Et tout est fait par les gens d’ici, à la pelle et à la main.'],
    chefEncore: ['Grâce à toi, on sera prêts pour l’allumage ! Reviens voir notre daruma ce soir, sous les projecteurs.'],
    chefEncoreNuit: ['Regarde-le, notre daruma, sous les lumières ! Tu y as mis ta pelletée, toi aussi.'],
    yukizoCompagnon: { kon: ['« Tu as de la neige jusqu’aux coudes. Bravo, sculpteur ! »'], pon: ['« Pon ! Et si on lui faisait un gros ventre ? Comme le mien. »'], chapu: ['« Chapu ! Moi je fais les finitions : je roule dessus ! »'], gao: ['« Gao. Un daruma, ça garde une maison. Je l’approuve. »'], fuwa: ['« Fuwaaa… Il a l’air tout doux. On peut dormir contre lui ? »'], saya: ['« Au printemps, il redeviendra de l’eau. Rien ne se perd. »'] },
    sculptrice: ['Le secret ? De la neige mouillée, bien tassée. On la laisse durcir une nuit, puis on taille.', 'Et la grande pelle rouge, là, c’est un « snow dump ». Ici, chaque maison a la sienne, pour descendre la neige du toit.'],
    photographe: ['Ce dragon fait vingt mètres de long. J’ai dû reculer jusqu’à la porte pour l’avoir en entier !', 'Reviens à la nuit : éclairé, on dirait qu’il respire.'],
    mere: ['Ce sont les élèves de l’école qui ont fait ces six Jizō. Tu connais le conte ? Un grand-père pauvre coiffe de ses chapeaux de paille six statues sous la neige…', '… et il donne son propre fichu à la sixième. La nuit, les Jizō viennent déposer des cadeaux devant sa porte.'],
    fillette: ['Le dernier, c’est moi qui lui ai fait son fichu ! Il a moins froid que les autres.'],
    papi: ['Hé hé… On dirait moi, avec ce chapeau ! Sauf que lui, il ne craint pas les courants d’air.'],
    lapine: ['C’est un lapin de neige (雪うさぎ) ! Deux feuilles pour les oreilles, deux baies rouges pour les yeux.', 'À la maison, j’en fais des tout petits, sur un plateau. Celui-là, il lui faudrait un plateau grand comme la cour !'],
    benevole: ['Ces petits dômes, ce sont des lanternes de neige (雪灯ろう). Il y en a jusqu’à la gare !', 'Ce soir, on met une bougie dans chacune. Si tu veux fabriquer la tienne, va au coin des enfants, à gauche.'],
    benevoleNuit: ['Toutes allumées ! Il a fallu une heure et beaucoup d’allumettes. Mais regarde-moi ça…'],
    dragon: ['« Le dragon qui s’élève » (昇り龍), catégorie générale. Vingt mètres de neige taillée : les vagues, les épines du dos, les moustaches.'],
    dragonNuit: ['Sous les projecteurs, le dragon paraît encore plus grand. Ses yeux te suivent, on dirait.'],
    concours: ['« Concours de sculptures de neige » (雪像コンテスト).', 'Quatre catégories : les rues commerçantes, la catégorie générale, l’inscription libre, et les écoles primaires.'],
    ecriteauTengu: ['« Le grand tengu de Narazawa (奈良澤大天狗) — ce soir, 18 h 30. »', 'À la fête du sanctuaire de Narazawa, en septembre, le grand tengu fait tournoyer une torche de plus de deux mètres. Ses étincelles chassent le mauvais sort.'],
    // ---- le coin des enfants
    animatrice: ['Bienvenue au coin des enfants ! Ici, on fabrique des lanternes de neige (雪灯ろう).', 'On tasse la neige dans un seau, on démoule, on creuse une petite niche… Tu veux faire la tienne ?'],
    lanterne1: ['Remplis le seau, et tasse bien fort !'],
    lanterne2: ['Parfaite ! Ce soir, on y mettra une bougie, comme dans toutes les autres. Tu la reconnaîtras : c’est la plus belle.'],
    animatriceEncore: ['Ta lanterne est là, au bout du rang. Reviens la voir ce soir, quand elle sera allumée !'],
    animatriceEncoreNuit: ['Tu as vu ? Ta lanterne brille avec les autres.'],
    toroCompagnon: { kon: ['« Une lanterne en neige… Elle ne fond pas, avec la bougie ? »'], pon: ['« Pon ! On dirait un mochi géant. Ne me tente pas. »'], chapu: ['« Chapu ! J’ai tassé avec mes pattes, t’as vu ? »'], gao: ['« Gao. Une petite lumière de garde. Bien. »'], fuwa: ['« Fuwaaa… Ce soir, elle brillera comme ma perle. »'], saya: ['« Une lumière dans la neige. Les voyageurs perdus aiment ça. »'] },
    glisseur: ['J’ai fait douze descentes. Douze ! Mon pantalon est tout mouillé, mais je m’en fiche.'],
    maman: ['Ils ne veulent plus rentrer… Pour les grands, il y a la descente en bouée (スノースライダー), tout en haut du château.'],
    igloo: ['On apprend à bâtir un igloo (イグルーづくり体験) : on scie des blocs dans la neige tassée, et on monte en rond.', 'Le dernier bloc, celui du haut, c’est le plus dur. On en est… loin.'],
    // ---- le haut du château
    liftier: ['Bienvenue au Snow Slider (スノースライダー) ! Une bouée, la pente nord du château, et c’est parti jusqu’en bas.', 'Je chronomètre. Tu tentes une descente ?'],
    liftierEncore: ['Encore une descente ? Le chrono t’attend !'],
    liftierConsigneOrdi: ['Dans les virages, la bouée part vers l’extérieur : ramène-la au milieu avec les flèches gauche et droite (ou A et D). Si tu touches le bord, tu ralentis !', 'Et pour filer plus vite, penche-toi en avant : la flèche du haut (ou W).'],
    liftierConsigneTel: ['Dans les virages, la bouée part vers l’extérieur : ramène-la au milieu avec le joystick. Si tu touches le bord, tu ralentis !', 'Et pour filer plus vite, penche-toi en avant : pousse le joystick vers le haut.'],
    chronoPartez: 'Partez !', chronoChocs: 'Bords touchés :', chronoRecord: 'Record',
    boueeTemps: 'Au talkie-walkie : « {t} secondes, sans toucher un seul bord ! »',
    boueeTempsChocs: 'Au talkie-walkie : « {t} secondes, en touchant {c} fois le bord. »',
    boueeRecord1: '« Voilà ton premier record. Il ne demande qu’à tomber ! »',
    boueeRecord: '« Nouveau record ! La neige en fume encore. »',
    boueeRecordNon: '« Ton record, c’est {r} s. Presque ! »',
    boueeMedailleOr: '« Médaille d’or ! Même le grand tengu n’irait pas plus vite. »',
    boueeMedailleArgent: '« Médaille d’argent ! Un bord de moins, et c’est l’or. »',
    boueeMedailleBronze: '« Médaille de bronze ! Pas mal du tout. »',
    boueeEncore: ['On remonte pour une autre descente ?'],
    sliderCompagnon: { kon: ['« Mes oreilles sont restées en haut ! On recommence ? »'], pon: ['« Pon… pon… Mon ventre a fait la moitié du travail. »'], chapu: ['« Chapu !! C’est comme une cascade, mais en neige ! Encore ! »'], gao: ['« Gao… Un gardien ne crie pas. … C’était un rugissement. »'], fuwa: ['« Fuwaaa… J’ai volé ! Presque ! »'], saya: ['« Les cèdres défilaient si vite que je n’ai pas pu les saluer. »'] },
    prieur: ['Le petit sanctuaire Aoi (葵神社) veille sur le haut du château. Je monte le saluer chaque matin, même sous la neige.', 'Au printemps, tout le parc est rose : ce sont les cerisiers d’Iiyama. Là, ils dorment.'],
    amoureuse: ['Cette rivière, c’est la Chikuma (千曲川). Plus bas, elle change de nom : elle devient la Shinano, le plus long fleuve du Japon.'],
    amoureux: ['Au printemps, ses rives sont jaunes de fleurs de colza. Mais moi, je la préfère comme ça, toute sombre dans le blanc.'],
    aoi: ['« Sanctuaire Aoi » (葵神社), sur l’ancienne cour d’honneur du château (本丸).'],
    vue: ['« Chikuma-gawa » (千曲川). La rivière coule vers le nord, entre les montagnes blanches.', 'En bas, les toits de la ville disparaissent sous la neige.'],
    vueNuit: ['La rivière est un ruban noir. Sur ses rives, les fenêtres de la ville font de petits points jaunes.'],
    // ---- le secret : les feux de Kenshin
    ecriteauFeu: ['« Noroshi » (のろし, 狼煙) : le feu d’alerte.', 'Au temps des guerres, on allumait un feu sur une hauteur pour prévenir d’un danger. De sommet en sommet, la nouvelle allait plus vite qu’un cheval. Le camp d’Uesugi Kenshin, qui a bâti ce château, avait un poste de feu sur le mont Kuroiwa (黒岩山).'],
    feuJour: ['Un grand bûcher tout prêt : des rondins, de la paille, des branches de cèdre. Il n’attend qu’une flamme.'],
    feuJourCompagnon: { kon: ['« Un feu d’alerte… La nuit, on le verrait de très loin. Il faudrait du feu, et la nuit. »'], pon: ['« Pon… Un si beau tas de bois, et pas une braise. Ce soir, peut-être ? »'], chapu: ['« Chapu ! Ça ferait un feu énorme ! Mais il fait jour, on ne le verrait pas… »'], gao: ['« Gao. Un feu de garde, sans flamme. Il lui faut la nuit, et une étincelle. »'], fuwa: ['« Fuwaaa… Il dort. Le soir, quelqu’un saura peut-être le réveiller ? »'], saya: ['« Ce bois attend. Il lui faut une flamme, et la nuit pour qu’on la voie. »'] },
    feuNuit: ['Le bûcher est toujours éteint. De nuit, on le verrait depuis toutes les montagnes…'],
    feuNuitCompagnon: { kon: ['« Tu as vu la torche du grand tengu, en bas, sur la terrasse ? Voilà du feu ! Si on lui en demandait ? »'], pon: ['« Pon ! Le grand tengu a une torche énorme, en bas. Il nous en prêterait bien un bout ? »'], chapu: ['« Chapu ! Du feu, il y en a plein la torche du tengu, sur la terrasse ! »'], gao: ['« Gao. Le grand tengu garde le feu, en bas. Allons le lui demander. »'], fuwa: ['« Fuwaaa… En bas, le tengu fait danser une grande flamme… »'], saya: ['« La flamme du tengu chasse le mauvais sort. Elle ferait un bon premier feu. Il danse sur la terrasse. »'] },
    feuTorcheJour: ['Tu tiens la flamme du tengu, mais il fait grand jour : personne ne verrait le feu de loin. Il faut attendre la nuit.'],
    feuAllume1: ['Tu approches la flamme du tengu de la paille…'],
    feuCompagnon1: { kon: ['« Il a pris ! Regarde comme il monte ! »'], pon: ['« Pon !! Ça chauffe ! Recule, recule ! »'], chapu: ['« Chapu ! Mes moustaches ! »'], gao: ['« Gao ! Un feu de garde, enfin ! »'], fuwa: ['« Fuwaaa… Il monte jusqu’aux étoiles… »'], saya: ['« Le vieux bois chante. Écoute. »'] },
    feuAllume2: ['Là-bas, sur le mont Kuroiwa… une lueur. On nous a répondu !'],
    feuAllume3: ['Et plus loin, une autre. Puis une autre encore, de crête en crête, vers le nord-ouest : vers Kasugayama, le château de Kenshin, de l’autre côté des montagnes.', 'Comme autrefois, la nouvelle court plus vite qu’un cheval. Ce soir, elle dit seulement : « C’est la fête à Iiyama ! »'],
    feuCompagnon2: { kon: ['« Toute la montagne nous a entendus… J’en ai les poils tout droits. »'], pon: ['« Pon… Ils répondent ! Tu crois qu’ils ont aussi une marmite, là-haut ? »'], chapu: ['« Chapu… On dirait des étoiles posées par terre. »'], gao: ['« Gao. Les gardiens d’autrefois veillent encore. Je les salue. »'], fuwa: ['« Fuwaaa… Un collier de feux sur les montagnes… »'], saya: ['« Les vieux arbres des crêtes s’en souviennent. Ils attendaient ce soir depuis longtemps. »'] },
    feuKoban: ['Au pied du feu, la neige a fondu. Quelque chose brille dans la terre mouillée : une vieille pièce d’or !'],
    feuBrule: ['Le grand feu brûle. Sur les crêtes, les autres lui répondent.'],
    feuCendres: ['Les cendres sont encore tièdes. Ce soir, le feu reprendra, et les montagnes répondront.'],
    tengu: ['… … …', '(Le grand tengu s’arrête. Derrière le masque rouge, deux yeux te regardent. Puis il abaisse sa torche vers toi.)', '« Mes étincelles chassent le mauvais sort : qui en reçoit une a de la chance toute l’année. Toi, tu viens de loin. Prends plutôt une flamme. »'],
    tenguFlamme: ['Tu reçois une petite torche, allumée à celle du grand tengu.'],
    tenguCompagnon: { kon: ['« Une flamme du grand tengu ! Elle porte bonheur… Dis, ce grand tas de bois éteint, tout en haut du château ? »'], pon: ['« Pon ! Du feu ! Il y a un bûcher qui n’attend que ça, tout en haut du château. »'], chapu: ['« Chapu ! Ne l’éteins pas ! Vite, au grand bûcher, tout en haut du château ! »'], gao: ['« Gao. Un feu, ça se garde. Portons-le au bûcher, en haut du château. »'], fuwa: ['« Fuwaaa… Elle danse. Le bûcher d’en haut du château aimerait danser aussi… »'], saya: ['« Le bois du haut du château attend cette flamme. Montons. »'] },
    tenguDeja: ['(Le grand tengu montre le haut du château du bout de sa torche, puis reprend sa danse.)'],
    tenguApres: ['(Le grand tengu lève sa torche vers les montagnes, où brillent les feux. Derrière le masque, on devine un sourire.)'],
    spectateurs: [['Chaque étincelle chasse un malheur. Alors on se met tout près… mais pas trop !'], ['Le grand tengu vient du sanctuaire de Narazawa. Là-bas, il danse en septembre, pour les récoltes.'], ['Sa torche fait plus de deux mètres. Il faut des bras solides !'], ['Si une étincelle te touche, tu auras de la chance toute l’année. C’est ce qu’on dit chez nous.']],
    // ---- le village des kamakura
    cuisiniere: ['Bienvenue au village des kamakura ! Une vingtaine de huttes de neige, de fin janvier à fin février.', 'Dedans, on mange la marmite du coin : la noroshi nabe (のろし鍋). Des champignons, des légumes d’ici, du porc Miyuki, et du miso de Shinshū.', 'Je t’en prépare une ?'],
    cuisiniereOui: 'Oh oui !',
    cuisiniereCommande: ['C’est parti ! Installe-toi dans le kamakura au lampion rouge, le premier à droite de l’allée. On te l’apporte.', 'Tu sais pourquoi « noroshi » ? Sa vapeur monte tout droit, comme les feux d’alerte d’autrefois (のろし). Au temps des guerres, le camp d’Uesugi Kenshin avait un poste de feu sur le mont Kuroiwa (黒岩山), juste là, derrière nous.'],
    cuisiniereAttend: ['Ta marmite t’attend dans le kamakura au lampion rouge, le premier à droite de l’allée !'],
    cuisiniereEncore: ['Alors, cette marmite ? Reviens quand tu veux : il y a toujours une place au chaud.'],
    cuisiniereSoir: ['Le soir, chaque kamakura a sa lumière. Tu veux attendre la nuit ?'],
    cuisiniereMatin: ['Tu veux que le jour revienne ?'],
    kamakuraPasCommande: ['Un kamakura réservé, avec son lampion rouge. Il faut d’abord commander sa marmite à la cuisinière, près de l’arche.'],
    repas1: ['Et voilà ta noroshi nabe ! Attention, c’est brûlant. Les boulettes de riz, c’est du Koshihikari d’Iiyama.'],
    repas2: ['Dehors, il neige. Dedans, la marmite fume, et les murs de neige gardent la chaleur. On est bien.'],
    repasCompagnon: { kon: ['« Je croyais qu’une maison en neige serait froide. C’est tout le contraire ! »'], pon: ['« Pon… pon… Encore un champignon. Et le bouillon. Et… tu ne finis pas ton riz ? »'], chapu: ['« Chapu ! La vapeur me chatouille le nez ! »'], gao: ['« Gao. Un abri solide, un repas chaud. Tout ce qu’un gardien demande. »'], fuwa: ['« Fuwaaa… On dirait l’intérieur d’une perle… »'], saya: ['« La neige protège ce qu’elle couvre. Les graines le savent depuis toujours. »'] },
    ancien: ['C’est nous, les gens du coin, qui bâtissons les kamakura : la « brigade des kamakura » (かまくら応援隊).', 'On gonfle un grand ballon rond, on souffle la neige dessus, bien épais, et on la tasse en la piétinant. Quand ça tient, on dégonfle le ballon… et il reste la hutte !'],
    visiteuse: ['Cette arche, je l’ai vue sur toutes les photos. « Shinshū Iiyama, Kamakura no Sato » !', 'Derrière, au bout de l’allée, il y a un torii rouge : un sanctuaire dans la neige.'],
    serveuse: ['Pardon, pardon ! Marmite chaude ! … Le soir, c’est le coup de feu : tout le monde veut dîner aux lanternes.'],
    panneauKamakura: ['« Comment on bâtit un kamakura » — par la brigade des kamakura (かまくら応援隊).', 'Un ballon en dôme, de la neige soufflée par-dessus, des dizaines de pieds pour la tasser. La porte regarde toujours à l’opposé de la montagne : le vent n’entre pas.'],
    arche: ['« Shinshū Iiyama — Kamakura no Sato » (信州飯山 かまくらの里), le village des dômes de neige.'],
    archeNuit: ['Sous l’arche, l’allée de lanternes mène tout droit au torii rouge.'],
    offrande: ['Au fond de la hutte de neige : l’autel, la petite niche de la divinité, sa corde de paille et son tronc à offrandes.', 'Tu glisses une pièce, tu t’inclines deux fois, tu frappes deux fois dans tes mains…'],
    jinjaCompagnon: { kon: ['« Un sanctuaire dans la neige… J’ai demandé qu’on repasse par ici l’hiver prochain. »'], pon: ['« Pon. J’ai prié pour que la marmite ne soit jamais vide. »'], chapu: ['« Chapu… Chut ! Ça résonne tout doux, là-dedans. »'], gao: ['« Gao. Même sans gardien de pierre, ce lieu est bien gardé. »'], fuwa: ['« Fuwaaa… La divinité doit avoir bien chaud, dans sa bulle. »'], saya: ['« Au printemps, ce sanctuaire fondra. L’an prochain, on le rebâtira. C’est une belle façon de durer. »'] },
    jinjaEncoreCompagnon: { kon: ['« Encore une petite prière ? D’accord. »'], pon: ['« Pon. Pour la marmite, toujours. »'], chapu: ['« Chapu ! »'], gao: ['« Gao. »'], fuwa: ['« Fuwaaa… »'], saya: ['« Deux fois vaut mieux qu’une. »'] },
    borneSanctuaire: ['« Sanctuaire du kamakura » (かまくら神社).', 'Derrière le torii rouge, la plus grande hutte de neige du village abrite un autel.'],
    chantier: ['Un kamakura en train de naître : le grand ballon bleu dépasse encore de la neige. Quand elle aura durci, on le dégonflera.'],
  },
  en: {
    noms: {
      chauffeur: 'The shuttle driver', chauffeurB: 'The shuttle driver', banane: 'The pastry cook', sasa: 'The sushi granny', kinoko: 'The neighbour', amazake: 'The amazake seller',
      honbu: 'The man at the welcome tent', soba: 'The soba cook', pork: 'The grill man', frileux: 'The gentleman', frileuse: 'The lady', gourmand: 'The little boy', promeneur: 'The stroller',
      chef: 'The team leader', sculptrice: 'The sculptor', photographe: 'The photographer', mere: 'The mum', fillette: 'The little girl', papi: 'The grandfather', lapine: 'The little girl', benevole: 'The volunteer',
      animatrice: 'The workshop lady', glisseur: 'The little boy', maman: 'The mum', igloo: 'The dad', liftier: 'The instructor', prieur: 'The old gentleman', amoureuse: 'The young woman', amoureux: 'The young man',
      cuisiniere: 'The cook', serveuse: 'The waitress', ancien: 'The village elder', visiteuse: 'The visitor', tengu: 'The great tengu',
    },
    tampons: {
      yukizo: ['The great snow sculpture', 'on the castle’s main terrace: lend a shovel to the team finishing theirs'],
      slider: ['The tube run', 'at the very top of the castle: ask the スノースライダー instructor for a run'],
      toro: ['The snow lantern', 'in the kids’ corner (遊雪エリア), left of the main terrace: make one with the workshop lady'],
      nabe: ['The noroshi nabe hot pot', 'at the kamakura village, by shuttle: order it from the cook, then go into the hut with the red lantern'],
      jinja: ['The snow shrine', 'at the end of the kamakura village’s alley, behind the red torii: pray at the offering box'],
    },
    arrivee: null,
    chauffeur: ['The shuttle to the kamakura village, at Shinanodaira (信濃平)? A quarter of an hour between two walls of snow.', 'Shall we go?'],
    chauffeurB: ['Back to the festival, at the castle park?'],
    arriveeB: ['Shinanodaira. Behind the white arch: the kamakura village (かまくらの里).'],
    arriveeA: ['Back at the foot of Iiyama Castle. The festival is in full swing!'],
    arriveeBCompagnon: { kon: ['“Round little houses, made of snow! Can we go inside?”'], pon: ['“Pon! I smell a hot pot… Follow my nose!”'], chapu: ['“Chapu! Igloos! I want one by my river.”'], gao: ['“Gao. Nice round domes. Fine work.”'], fuwa: ['“Fuwaaa… Snow bubbles resting on the white…”'], saya: ['“The cedars are asleep under the snow. Listen: even the wind is whispering.”'] },
    arriveeACompagnon: { kon: ['“Brr! Shall we go back to the sculptures?”'], pon: ['“Pon… There were some banana cakes left, weren’t there?”'], chapu: ['“Chapu! One more tube ride!”'], gao: ['“Gao! The castle has not moved. Good.”'], fuwa: ['“Fuwaaa… The snow dragon is waiting for me.”'], saya: ['“The castle’s cherry trees are already dreaming of spring.”'] },
    honbu: ['Welcome to the Iiyama Snow Festival (いいやま雪まつり)! Every year, on the second weekend of February.', 'More than a hundred sculptures all over town, every one of them made by the townspeople. In February 1983, some young people here decided to turn the snow, that burden, into a celebration.', 'The big ones are up there, on the castle terrace. For the kamakura village, take the shuttle at the end of the street.'],
    honbuNuit: ['At 6 p.m. the sculptures are lit up (雪像ライトアップ). And at 6:30, the great tengu of Narazawa dances with his torch, up on the terrace!'],
    honbuSoir: ['In the evening the snow lanterns are lit and the great tengu dances. Do you want to wait for the evening?'],
    honbuMatin: ['Do you want the day to come back?'],
    banane: ['A banana boat (バナナボート)? It is THE winter treat of Iiyama: a sponge cake folded over whipped cream and a whole banana.', 'Here, have a taste!'],
    bananeCompagnon: { kon: ['“Mmm… It melts like snow. Banana snow!”'], pon: ['“Pon!! One more. No, two. For the road.”'], chapu: ['“Chapu! I have cream all over my whiskers!”'], gao: ['“Gao… A guardian does not eat on duty. … All right, one bite.”'], fuwa: ['“Fuwaaa… A soft little boat…”'], saya: ['“The banana comes from far away. It must find it chilly here.”'] },
    kinoko: ['Come closer, come closer! It is a treat from the neighbourhood (ふるまい): a nice hot mushroom soup (きのこ汁).', 'The sculptors are cold, and so are those who watch. So we keep the pot hot for everyone.'],
    kinokoBu: ['You drink a bowl of mushroom soup. The warmth goes all the way down to your toes.'],
    amazake: ['Some hot amazake (甘酒)? It is fermented rice, very mild, with no alcohol: the drink of winter festivals.', 'And if you would rather have something cold… the bottles are chilling right there, in the snow pile!'],
    amazakeCompagnon: { kon: ['“It is hot, it is sweet… My ears are warming up.”'], pon: ['“Pon… It smells of rice. I love anything that smells of rice.”'], chapu: ['“Chapu! It steams! A hot spring in a cup.”'], gao: ['“Gao. Good for keeping watch in this cold.”'], fuwa: ['“Fuwaaa… A cloud in a glass…”'], saya: ['“Rice, water, time. The best things are made slowly.”'] },
    sasa: ['Sasa-zushi (笹寿司): vinegared rice on a bamboo leaf, with mountain vegetables, omelette and red ginger.', 'They say the people of Tomikura offered some to Uesugi Kenshin’s army. It is also called “Kenshin’s sushi”!'],
    soba: ['Tomikura soba (富倉そば)! Here the dough is not bound with wheat, but with the fibres of a mountain plant, oyamabokuchi.', 'The noodles are thin, firm, and they slide down all by themselves.'],
    pork: ['Miyuki pork skewers (みゆきポーク), the pork of Iiyama! Grilled right in front of you.', 'It is the same pork that goes into the hot pot at the kamakura village. You will see, over there!'],
    frileux: ['Ah… Nothing like a good fire. Iiyama is one of the snowiest towns in Japan, you know.', 'So we learned to love winter. We did not have much choice!'],
    frileuse: ['See, across the street? Those wooden arcades along the houses: gangi (雁木). Thanks to them, we walk in the dry all winter.', 'Iiyama still has its arcade street: the street of the Buddhist altar makers (仏壇通り).'],
    gourmand: ['I counted the sculptures in my street: eleven! And in the whole town there are more than a hundred.', 'Ours is a cat. Well… it was supposed to be a cat.'],
    promeneur: ['I am doing the sculpture rally (雪像ウォークラリー): six big sculptures in the streets, one stamp at each.', 'You have a stamp book too? Then we are colleagues!'],
    boissons: ['Bottles and cans stuck in a pile of snow. Iiyama’s fridge: free, and it never breaks down.'],
    poteauParc: ['“Iiyama Castle Ruins Park” (飯山城址公園).', 'Uesugi Kenshin had this castle built in 1564, for his Kawanakajima campaigns. Only the stone walls remain; the gate, up there, has been rebuilt.'],
    braseroCompagnon: { kon: ['“Aaah… My paws are alive again.”'], pon: ['“Pon… We could toast a mochi on it. Just one.”'], chapu: ['“Chapu! Not too close, my tail!”'], gao: ['“Gao. A good watch fire.”'], fuwa: ['“Fuwaaa… The fire sways like seaweed.”'], saya: ['“This wood grew for a hundred years to warm us for one evening. Thank you, old brother.”'] },
    chef: ['We are finishing our daruma for tonight! A week of packing, carving and smoothing. The whole street joined in.', 'There is one corner left to rough out, down here. Will you lend us a shovel?'],
    chefOui: 'Hand me the shovel!',
    chefMerci: ['Well done! See: snow carves like butter, once it is packed hard.', 'The biggest sculptures are over three metres high and twenty wide. And everything is made by local people, with shovels and hands.'],
    chefEncore: ['Thanks to you, we will be ready for the lighting! Come back and see our daruma tonight, under the floodlights.'],
    chefEncoreNuit: ['Look at it, our daruma, under the lights! There is a shovelful of yours in there too.'],
    yukizoCompagnon: { kon: ['“You have snow up to your elbows. Well done, sculptor!”'], pon: ['“Pon! What if we gave it a big belly? Like mine.”'], chapu: ['“Chapu! I do the finishing: I roll on it!”'], gao: ['“Gao. A daruma guards a house. I approve.”'], fuwa: ['“Fuwaaa… It looks so soft. Can we sleep against it?”'], saya: ['“In spring it will be water again. Nothing is lost.”'] },
    sculptrice: ['The secret? Wet snow, packed hard. You let it harden overnight, then you carve.', 'And that big red shovel is a “snow dump”. Here every house has one, to bring the snow down from the roof.'],
    photographe: ['This dragon is twenty metres long. I had to step back to the gate to fit it all in!', 'Come back at night: lit up, it looks as if it were breathing.'],
    mere: ['The school’s pupils made these six Jizō. Do you know the tale? A poor old man puts his straw hats on six statues standing in the snow…', '… and gives his own headcloth to the sixth. At night, the Jizō come and leave gifts at his door.'],
    fillette: ['I made the headcloth for the last one! He is less cold than the others.'],
    papi: ['Heh heh… That could be me, with that hat! Except he does not mind the draughts.'],
    lapine: ['It is a snow rabbit (雪うさぎ)! Two leaves for the ears, two red berries for the eyes.', 'At home I make tiny ones, on a tray. This one would need a tray as big as the yard!'],
    benevole: ['These little domes are snow lanterns (雪灯ろう). There are some all the way to the station!', 'Tonight we will put a candle in each. If you want to make your own, go to the kids’ corner, on the left.'],
    benevoleNuit: ['All lit! It took an hour and a lot of matches. But just look at that…'],
    dragon: ['“The rising dragon” (昇り龍), general category. Twenty metres of carved snow: the waves, the spines along its back, the whiskers.'],
    dragonNuit: ['Under the floodlights the dragon looks even bigger. Its eyes seem to follow you.'],
    concours: ['“Snow sculpture contest” (雪像コンテスト).', 'Four categories: shopping streets, general, free entry, and primary schools.'],
    ecriteauTengu: ['“The great tengu of Narazawa (奈良澤大天狗) — tonight, 6:30 p.m.”', 'At the festival of Narazawa Shrine, in September, the great tengu whirls a torch more than two metres long. Its sparks drive bad luck away.'],
    animatrice: ['Welcome to the kids’ corner! Here we make snow lanterns (雪灯ろう).', 'You pack snow into a bucket, turn it out, hollow a little niche… Do you want to make yours?'],
    lanterne1: ['Fill the bucket, and pack it down hard!'],
    lanterne2: ['Perfect! Tonight we will put a candle in it, like in all the others. You will recognise it: it is the prettiest.'],
    animatriceEncore: ['Your lantern is there, at the end of the row. Come back and see it tonight, when it is lit!'],
    animatriceEncoreNuit: ['Did you see? Your lantern is glowing with the others.'],
    toroCompagnon: { kon: ['“A lantern made of snow… Doesn’t it melt, with the candle?”'], pon: ['“Pon! It looks like a giant mochi. Don’t tempt me.”'], chapu: ['“Chapu! I packed it with my paws, did you see?”'], gao: ['“Gao. A little watch light. Good.”'], fuwa: ['“Fuwaaa… Tonight it will shine like my pearl.”'], saya: ['“A light in the snow. Lost travellers like that.”'] },
    glisseur: ['I went down twelve times. Twelve! My trousers are soaked, and I don’t care.'],
    maman: ['They don’t want to go home… For the big ones there is the tube run (スノースライダー), at the very top of the castle.'],
    igloo: ['We are learning to build an igloo (イグルーづくり体験): you saw blocks out of packed snow and stack them in a circle.', 'The last block, the one on top, is the hardest. We are… a long way from it.'],
    liftier: ['Welcome to the Snow Slider (スノースライダー)! A tube, the castle’s north slope, and off you go, all the way down.', 'I keep the time. Will you try a run?'],
    liftierEncore: ['Another run? The stopwatch is waiting!'],
    liftierConsigneOrdi: ['In the bends the tube swings to the outside: bring it back to the middle with the left and right arrows (or A and D). If you touch the edge, you slow down!', 'And to go faster, lean forward: the up arrow (or W).'],
    liftierConsigneTel: ['In the bends the tube swings to the outside: bring it back to the middle with the joystick. If you touch the edge, you slow down!', 'And to go faster, lean forward: push the joystick up.'],
    chronoPartez: 'Go!', chronoChocs: 'Edges touched:', chronoRecord: 'Record',
    boueeTemps: 'On the walkie-talkie: “{t} seconds, without touching a single edge!”',
    boueeTempsChocs: 'On the walkie-talkie: “{t} seconds, touching the edge {c} time(s).”',
    boueeRecord1: '“That is your first record. It is begging to be beaten!”',
    boueeRecord: '“New record! The snow is still smoking.”',
    boueeRecordNon: '“Your record is {r} s. So close!”',
    boueeMedailleOr: '“Gold medal! Even the great tengu would not go faster.”',
    boueeMedailleArgent: '“Silver medal! One edge less, and it is gold.”',
    boueeMedailleBronze: '“Bronze medal! Not bad at all.”',
    boueeEncore: ['Shall we go back up for another run?'],
    sliderCompagnon: { kon: ['“My ears stayed at the top! Again?”'], pon: ['“Pon… pon… My belly did half the work.”'], chapu: ['“Chapu!! It is like a waterfall, but made of snow! Again!”'], gao: ['“Gao… A guardian does not scream. … That was a roar.”'], fuwa: ['“Fuwaaa… I flew! Almost!”'], saya: ['“The cedars went by so fast I could not greet them.”'] },
    prieur: ['The little Aoi Shrine (葵神社) watches over the top of the castle. I climb up to greet it every morning, even in the snow.', 'In spring the whole park turns pink: those are Iiyama’s cherry trees. Right now, they are asleep.'],
    amoureuse: ['That river is the Chikuma (千曲川). Further down it changes its name: it becomes the Shinano, the longest river in Japan.'],
    amoureux: ['In spring its banks are yellow with rapeseed flowers. But I like it best like this, all dark in the white.'],
    aoi: ['“Aoi Shrine” (葵神社), on the castle’s old main enclosure (本丸).'],
    vue: ['“Chikuma-gawa” (千曲川). The river flows north, between the white mountains.', 'Down below, the roofs of the town disappear under the snow.'],
    vueNuit: ['The river is a black ribbon. On its banks the windows of the town make little yellow dots.'],
    ecriteauFeu: ['“Noroshi” (のろし, 狼煙): the beacon fire.', 'In the age of wars, a fire was lit on a height to warn of danger. From summit to summit, the news travelled faster than a horse. The camp of Uesugi Kenshin, who built this castle, had a beacon post on Mount Kuroiwa (黒岩山).'],
    feuJour: ['A great pyre, all ready: logs, straw, cedar boughs. It is only waiting for a flame.'],
    feuJourCompagnon: { kon: ['“A beacon fire… At night it would be seen from very far. We would need fire, and the night.”'], pon: ['“Pon… Such a fine pile of wood, and not one ember. Tonight, maybe?”'], chapu: ['“Chapu! That would make a huge fire! But it is daytime, nobody would see it…”'], gao: ['“Gao. A watch fire with no flame. It needs the night, and a spark.”'], fuwa: ['“Fuwaaa… It is asleep. Tonight, maybe someone will know how to wake it?”'], saya: ['“This wood is waiting. It needs a flame, and the night to be seen.”'] },
    feuNuit: ['The pyre is still unlit. By night, it would be seen from every mountain…'],
    feuNuitCompagnon: { kon: ['“Did you see the great tengu’s torch, down on the terrace? There is our fire! What if we asked him for some?”'], pon: ['“Pon! The great tengu has a huge torch, down there. Surely he could lend us a bit?”'], chapu: ['“Chapu! There is plenty of fire on the tengu’s torch, on the terrace!”'], gao: ['“Gao. The great tengu keeps the fire, down there. Let us ask him.”'], fuwa: ['“Fuwaaa… Down there the tengu is making a great flame dance…”'], saya: ['“The tengu’s flame drives bad luck away. It would make a good first fire. He is dancing on the terrace.”'] },
    feuTorcheJour: ['You are holding the tengu’s flame, but it is broad daylight: nobody would see the fire from afar. You must wait for the night.'],
    feuAllume1: ['You bring the tengu’s flame close to the straw…'],
    feuCompagnon1: { kon: ['“It caught! Look how it rises!”'], pon: ['“Pon!! It is hot! Back, back!”'], chapu: ['“Chapu! My whiskers!”'], gao: ['“Gao! A watch fire, at last!”'], fuwa: ['“Fuwaaa… It rises up to the stars…”'], saya: ['“The old wood is singing. Listen.”'] },
    feuAllume2: ['Over there, on Mount Kuroiwa… a glow. Someone has answered!'],
    feuAllume3: ['And further on, another. Then another, from ridge to ridge, toward the north-west: toward Kasugayama, Kenshin’s castle, on the other side of the mountains.', 'As in the old days, the news runs faster than a horse. Tonight it only says: “It is festival time in Iiyama!”'],
    feuCompagnon2: { kon: ['“The whole mountain heard us… My fur is standing on end.”'], pon: ['“Pon… They are answering! Do you think they have a hot pot up there too?”'], chapu: ['“Chapu… They look like stars set down on the ground.”'], gao: ['“Gao. The guardians of old still keep watch. I salute them.”'], fuwa: ['“Fuwaaa… A necklace of fires on the mountains…”'], saya: ['“The old trees on the ridges remember. They had been waiting for tonight for a long time.”'] },
    feuKoban: ['At the foot of the fire the snow has melted. Something shines in the wet earth: an old gold coin!'],
    feuBrule: ['The great fire is burning. On the ridges, the others answer it.'],
    feuCendres: ['The ashes are still warm. Tonight the fire will catch again, and the mountains will answer.'],
    tengu: ['… … …', '(The great tengu stops. Behind the red mask, two eyes look at you. Then he lowers his torch toward you.)', '“My sparks drive bad luck away: whoever catches one is lucky all year. You have come a long way. Take a flame instead.”'],
    tenguFlamme: ['You receive a small torch, lit from the great tengu’s.'],
    tenguCompagnon: { kon: ['“A flame from the great tengu! It brings luck… Say, that big unlit pile of wood, at the very top of the castle?”'], pon: ['“Pon! Fire! There is a pyre waiting for just that, at the very top of the castle.”'], chapu: ['“Chapu! Don’t let it go out! Quick, to the big pyre, at the very top of the castle!”'], gao: ['“Gao. A fire must be kept. Let us carry it to the pyre, at the top of the castle.”'], fuwa: ['“Fuwaaa… It dances. The pyre at the top of the castle would like to dance too…”'], saya: ['“The wood at the top of the castle is waiting for this flame. Let us go up.”'] },
    tenguDeja: ['(The great tengu points at the top of the castle with the tip of his torch, then goes back to his dance.)'],
    tenguApres: ['(The great tengu raises his torch toward the mountains, where the fires are shining. Behind the mask, you can guess a smile.)'],
    spectateurs: [['Every spark drives away one misfortune. So we stand close… but not too close!'], ['The great tengu comes from Narazawa Shrine. There, he dances in September, for the harvest.'], ['His torch is more than two metres long. You need strong arms!'], ['If a spark touches you, you will be lucky all year. That is what we say around here.']],
    cuisiniere: ['Welcome to the kamakura village! About twenty snow huts, from late January to late February.', 'Inside, you eat the local hot pot: noroshi nabe (のろし鍋). Mushrooms, local vegetables, Miyuki pork, and Shinshū miso.', 'Shall I make you one?'],
    cuisiniereOui: 'Oh yes!',
    cuisiniereCommande: ['Coming up! Settle into the kamakura with the red lantern, the first one on the right of the alley. We will bring it to you.', 'Do you know why “noroshi”? Its steam rises straight up, like the beacon fires of old (のろし). In the age of wars, Uesugi Kenshin’s camp had a beacon post on Mount Kuroiwa (黒岩山), right there, behind us.'],
    cuisiniereAttend: ['Your hot pot is waiting in the kamakura with the red lantern, the first one on the right of the alley!'],
    cuisiniereEncore: ['So, how was that hot pot? Come back whenever you like: there is always a warm seat.'],
    cuisiniereSoir: ['In the evening every kamakura has its light. Do you want to wait for the night?'],
    cuisiniereMatin: ['Do you want the day to come back?'],
    kamakuraPasCommande: ['A reserved kamakura, with its red lantern. First you must order your hot pot from the cook, near the arch.'],
    repas1: ['Here is your noroshi nabe! Careful, it is boiling hot. The rice balls are Koshihikari from Iiyama.'],
    repas2: ['Outside, it is snowing. Inside, the pot is steaming and the snow walls keep the warmth in. It feels good.'],
    repasCompagnon: { kon: ['“I thought a house of snow would be cold. It is the very opposite!”'], pon: ['“Pon… pon… One more mushroom. And the broth. And… are you not finishing your rice?”'], chapu: ['“Chapu! The steam tickles my nose!”'], gao: ['“Gao. A solid shelter, a hot meal. All a guardian asks for.”'], fuwa: ['“Fuwaaa… It is like the inside of a pearl…”'], saya: ['“Snow protects what it covers. Seeds have always known that.”'] },
    ancien: ['We, the local people, build the kamakura: the “kamakura support brigade” (かまくら応援隊).', 'We blow up a big round balloon, blow snow thick all over it, and pack it down by treading on it. When it holds, we let the air out of the balloon… and the hut remains!'],
    visiteuse: ['I have seen this arch in every photo. “Shinshū Iiyama, Kamakura no Sato”!', 'Behind it, at the end of the alley, there is a red torii: a shrine in the snow.'],
    serveuse: ['Excuse me, excuse me! Hot pot coming through! … In the evening it is the rush: everyone wants to dine by lantern light.'],
    panneauKamakura: ['“How a kamakura is built” — by the kamakura support brigade (かまくら応援隊).', 'A dome-shaped balloon, snow blown over it, dozens of feet to pack it down. The door always faces away from the mountain: the wind does not come in.'],
    arche: ['“Shinshū Iiyama — Kamakura no Sato” (信州飯山 かまくらの里), the snow dome village.'],
    archeNuit: ['Under the arch, the alley of lanterns leads straight to the red torii.'],
    offrande: ['At the back of the snow hut: the altar, the little wooden shrine of the deity, its straw rope and its offering box.', 'You slip in a coin, bow twice, clap your hands twice…'],
    jinjaCompagnon: { kon: ['“A shrine in the snow… I asked that we come back this way next winter.”'], pon: ['“Pon. I prayed that the hot pot would never be empty.”'], chapu: ['“Chapu… Shh! It echoes so softly in here.”'], gao: ['“Gao. Even without a stone guardian, this place is well guarded.”'], fuwa: ['“Fuwaaa… The deity must be nice and warm in its bubble.”'], saya: ['“In spring this shrine will melt. Next year it will be built again. A fine way of lasting.”'] },
    jinjaEncoreCompagnon: { kon: ['“One more little prayer? All right.”'], pon: ['“Pon. For the hot pot, always.”'], chapu: ['“Chapu!”'], gao: ['“Gao.”'], fuwa: ['“Fuwaaa…”'], saya: ['“Twice is better than once.”'] },
    borneSanctuaire: ['“Kamakura Shrine” (かまくら神社).', 'Behind the red torii, the biggest snow hut of the village shelters an altar.'],
    chantier: ['A kamakura being born: the big blue balloon still shows above the snow. Once the snow has hardened, they will let the air out.'],
  },
  ja: {
    noms: {
      chauffeur: 'バスの　うんてんしゅ', chauffeurB: 'バスの　うんてんしゅ', banane: 'おかしやさん', sasa: '笹寿司の　おばあさん', kinoko: 'きんじょの　おばあさん', amazake: '甘酒の　おねえさん',
      honbu: '本部の　おじさん', soba: 'そばやさん', pork: 'くしやきの　おじさん', frileux: 'おじさん', frileuse: 'おばさん', gourmand: '男の子', promeneur: 'さんぽの　人',
      chef: 'チームの　リーダー', sculptrice: '雪像を　つくる　人', photographe: 'カメラの　人', mere: 'おかあさん', fillette: '女の子', papi: 'おじいさん', lapine: '女の子', benevole: 'ボランティアの　人',
      animatrice: 'こうぼうの　おねえさん', glisseur: '男の子', maman: 'おかあさん', igloo: 'おとうさん', liftier: 'かかりの　人', prieur: 'おじいさん', amoureuse: 'わかい　女の人', amoureux: 'わかい　男の人',
      cuisiniere: 'りょうりの　おばさん', serveuse: 'おみせの　人', ancien: '村の　おじいさん', visiteuse: 'かんこうの　人', tengu: '大天狗',
    },
    tampons: {
      yukizo: ['大きな　雪像', '城の　広い　だんで：しあげを　している　チームを　スコップで　てつだおう'],
      slider: ['スノースライダー', '城の　いちばん　上：スノースライダーの　かかりの　人に　たのもう'],
      toro: ['雪灯ろう', '広い　だんの　左、遊雪エリア：こうぼうの　おねえさんと　ひとつ　つくろう'],
      nabe: ['のろし鍋', 'シャトルバスで　かまくらの里へ：りょうりの　おばさんに　たのんで、赤い　ちょうちんの　かまくらに　入ろう'],
      jinja: ['かまくら神社', 'かまくらの里の　道の　おく、赤い　とりいの　むこう：さいせんばこの　前で　おまいり'],
    },
    arrivee: null,
    chauffeur: ['信濃平の　かまくらの里まで　シャトルバスだよ。雪の　かべの　あいだを　15分。', 'のっていくかい？'],
    chauffeurB: ['城あと公園の　雪まつりへ　もどるかい？'],
    arriveeB: ['信濃平。白い　アーチの　むこうが　かまくらの里。'],
    arriveeA: ['飯山城の　ふもとに　もどってきた。雪まつりは　まだまだ　にぎやか！'],
    arriveeBCompagnon: { kon: ['「まるい　雪の　おうちだ！　中に　入れるのかな？」'], pon: ['「ポン！　なべの　においが　する……ぼくの　はなに　ついてきて！」'], chapu: ['「チャプ！　かまくらだ！　川の　そばに　ひとつ　ほしいな」'], gao: ['「ガオ。まんまるで　いい　ドームだ。いい　しごとだな」'], fuwa: ['「フワァ……白の　上に　雪の　あわが　ならんでる……」'], saya: ['「杉は　雪の　下で　ねむっている。ほら、風まで　ひそひそ声だ」'] },
    arriveeACompagnon: { kon: ['「ブルル！　雪像を　見に　もどろうか？」'], pon: ['「ポン……バナナの　おかし、まだ　あったよね？」'], chapu: ['「チャプ！　もう一回　スライダー！」'], gao: ['「ガオ！　城は　うごいていない。よし」'], fuwa: ['「フワァ……雪の　りゅうが　まってる」'], saya: ['「城の　さくらは　もう　春の　ゆめを　見ている」'] },
    honbu: ['いいやま雪まつりへ　ようこそ！　まい年、2月の　二回目の　土日だよ。', '町じゅうに　100より　多い　雪像が　ならぶ。ぜんぶ　町の　人が　つくったんだ。1983年の　2月、わかものたちが　「やっかいな　雪を　おまつりに　しよう」と　はじめたんだよ。', '大きいのは　上の、城の　だんに　ある。かまくらの里へは　通りの　はしの　シャトルバスで　行けるよ。'],
    honbuNuit: ['6時から　雪像ライトアップ。6時半には　上の　だんで、奈良沢の　大天狗が　たいまつを　もって　まうよ！'],
    honbuSoir: ['夕方には　雪灯ろうに　火が　ともって、大天狗が　まうよ。夕方まで　まつかい？'],
    honbuMatin: ['朝を　まつかい？'],
    banane: ['バナナボートは　どう？　飯山の　冬の　めいぶつだよ。ふわふわの　スポンジで、生クリームと　バナナを　まるごと　つつんであるの。', 'はい、あじみ　どうぞ！'],
    bananeCompagnon: { kon: ['「んん……雪みたいに　とける。バナナの　雪だ！」'], pon: ['「ポン！！　もう　ひとつ。いや、ふたつ。おみやげ用に」'], chapu: ['「チャプ！　ひげが　クリームだらけ！」'], gao: ['「ガオ……まもり神は　しごと中に　食べない。……ひとくちだけ」'], fuwa: ['「フワァ……やわらかい　小さな　ふね……」'], saya: ['「バナナは　とおくから　来た。ここは　さむいと　思っているだろう」'] },
    kinoko: ['おいで、おいで！　きんじょからの　ふるまいだよ。あつあつの　きのこ汁。', 'つくる　人も　見る　人も　さむいからね。みんなの　ために　なべを　あたためているのさ。'],
    kinokoBu: ['きのこ汁を　いっぱい　のんだ。足の　先まで　ぽかぽか。'],
    amazake: ['あたたかい　甘酒は　どう？　お米から　つくる、あまくて　やさしい　のみもの。お酒じゃないよ。冬の　おまつりには　これ！', 'つめたいのが　よければ……ほら、そこの　雪の　山で　ひやしてあるよ！'],
    amazakeCompagnon: { kon: ['「あったかくて　あまい……耳が　ぽかぽかしてきた」'], pon: ['「ポン……お米の　におい。お米の　においは　ぜんぶ　すき」'], chapu: ['「チャプ！　ゆげだ！　コップの　中の　おんせんだ」'], gao: ['「ガオ。この　さむさの　見はりに　ちょうどいい」'], fuwa: ['「フワァ……コップの　中の　くも……」'], saya: ['「米と　水と　時間。いい　ものは　ゆっくり　できる」'] },
    sasa: ['笹寿司だよ。ささの　はに　すしめしを　のせて、山菜、たまご、べにしょうがを　のせるの。', '富倉の　人が　上杉謙信の　ぐんぜいに　さしあげたと　いわれていてね。「謙信ずし」とも　よぶんだよ！'],
    soba: ['富倉そば！　ここでは　こむぎを　つなぎに　つかわない。山の　草、オヤマボクチの　せんいで　つなぐんだ。', 'ほそくて　こしが　あって、するすると　のどを　とおるよ。'],
    pork: ['飯山の　ぶた、みゆきポークの　くしやきだよ！　目の前で　やくからね。', 'かまくらの里の　なべに　入るのも　この　おにくさ。行けば　わかるよ！'],
    frileux: ['ああ……やっぱり　火は　いいね。飯山は　日本でも　とくに　雪の　多い　町なんだ。', 'だから　冬を　すきに　なることに　したのさ。ほかに　しかたないからね！'],
    frileuse: ['むかいを　見た？　家に　そって　つづく　木の　やね。雁木と　いうの。おかげで　冬じゅう　ぬれずに　歩けるのよ。', '飯山には　いまも　雁木通りが　あるの。おぶつだんの　お店が　ならぶ　仏壇通りよ。'],
    gourmand: ['ぼくの　通りの　雪像を　かぞえたよ。11こ！　町ぜんぶだと　100より　多いんだって。', 'うちのは　ねこ。……ねこの　はず、だったんだけど。'],
    promeneur: ['雪像ウォークラリーを　しているんだ。町の　大きな　雪像を　6つ　まわって、スタンプを　あつめるんだよ。', 'きみも　スタンプちょうを　もっているの？　じゃあ　なかまだね！'],
    boissons: ['びんや　かんが　雪の　山に　さしてある。飯山の　れいぞうこ。ただで、ぜったいに　こわれない。'],
    poteauParc: ['「飯山城址公園」。', '上杉謙信が　1564年に、川中島の　たたかいの　ために　きずいた　城。いま　のこるのは　石がきだけ。上の　門は　たてなおされた　ものだよ。'],
    braseroCompagnon: { kon: ['「ああ……足が　生きかえる」'], pon: ['「ポン……おもちを　やけるね。ひとつだけ」'], chapu: ['「チャプ！　しっぽが　あつい、近すぎ！」'], gao: ['「ガオ。いい　見はりの　火だ」'], fuwa: ['「フワァ……火が　海そうみたいに　ゆれてる」'], saya: ['「この　木は　百年　そだって、ひとばん　わたしたちを　あたためる。ありがとう、兄弟」'] },
    chef: ['こんやに　まにあうよう、だるまを　しあげているんだ！　一週間、かためて、けずって、ならして。通りの　みんなで　やったんだよ。', '下の　すみが　まだ　のこっていてね。スコップで　てつだってくれるかい？'],
    chefOui: 'スコップを　かして！',
    chefMerci: ['うまい！　ほらね、しっかり　かためた　雪は　バターみたいに　けずれるんだ。', '大きい　雪像は　高さ3メートル、はば20メートルを　こえる。ぜんぶ　町の　人が　スコップと　手で　つくるんだよ。'],
    chefEncore: ['おかげで　ライトアップに　まにあうよ！　こんや、ライトの　下の　だるまを　見に　おいで。'],
    chefEncoreNuit: ['見てごらん、ライトの　下の　だるまを！　きみの　ひとすくいも　入っているんだよ。'],
    yukizoCompagnon: { kon: ['「ひじまで　雪だらけ。やったね、雪像しょくにん！」'], pon: ['「ポン！　おなかを　大きく　しようよ。ぼくみたいに」'], chapu: ['「チャプ！　しあげは　まかせて。上で　ころがるから！」'], gao: ['「ガオ。だるまは　家を　まもる。みとめよう」'], fuwa: ['「フワァ……やわらかそう。もたれて　ねても　いい？」'], saya: ['「春には　また　水に　なる。なにも　なくならない」'] },
    sculptrice: ['コツ？　しめった　雪を　しっかり　かためること。ひとばん　おいて　かたくしてから　けずるの。', 'あの　赤い　大きな　スコップは　スノーダンプ。ここでは　どの家にも　あるのよ。やねの　雪を　おろすのに　つかうの。'],
    photographe: ['この　りゅうは　長さ20メートル。ぜんぶ　入れるのに　門まで　さがったよ！', '夜に　また　おいで。ライトが　あたると、いきを　しているみたいなんだ。'],
    mere: ['この　六地蔵は　小学校の　子どもたちが　つくったの。むかし話を　しってる？　まずしい　おじいさんが、雪の　中の　おじぞうさまに　かさを　かぶせてあげるの……', '……六人目には　じぶんの　てぬぐいを。その夜、おじぞうさまたちが　おくりものを　とどけに　来るのよ。'],
    fillette: ['さいごの　おじぞうさまの　てぬぐいは　わたしが　つくったの！　ほかのより　さむくないよ。'],
    papi: ['ほっほっ……その　かさ、わしに　そっくりじゃ！　ただし　あっちは　すきま風が　へいきらしい。'],
    lapine: ['雪うさぎだよ！　はっぱ　二まいが　耳、赤い　み　二つが　目。', 'おうちでは　おぼんの　上に　小さいのを　つくるの。これは　おにわくらいの　おぼんが　いるね！'],
    benevole: ['この　小さな　ドームは　雪灯ろう。えきまで　ずっと　ならんでいるんだ！', 'こんや、ひとつずつ　ろうそくを　入れるよ。じぶんのを　つくりたいなら、左の　遊雪エリアへ　どうぞ。'],
    benevoleNuit: ['ぜんぶ　ついた！　一時間と　マッチを　たくさん　つかったよ。でも　見てよ、これ……'],
    dragon: ['「昇り龍」一般の部。雪を　けずった　20メートル。波、せなかの　とげ、ひげ。'],
    dragonNuit: ['ライトの　下の　りゅうは　もっと　大きく　見える。目が　こっちを　おってくるみたい。'],
    concours: ['「雪像コンテスト」。', '四つの　部：商店街の部、一般の部、フリーエントリーの部、小学校の部。'],
    ecriteauTengu: ['「奈良澤大天狗　こんや　午後6時30分」。', '9月の　奈良沢神社の　おまつりで、大天狗は　2メートルを　こえる　たいまつを　ふりまわす。その　火の粉が　わるいものを　はらうんだ。'],
    animatrice: ['遊雪エリアへ　ようこそ！　ここでは　雪灯ろうを　つくるよ。', 'バケツに　雪を　つめて、ひっくりかえして、小さな　あなを　ほるの……つくってみる？'],
    lanterne1: ['バケツに　雪を　入れて、ぎゅっと　かためてね！'],
    lanterne2: ['じょうず！　こんや、みんなのと　いっしょに　ろうそくを　入れるね。すぐ　わかるよ。いちばん　きれいだから。'],
    animatriceEncore: ['きみの　雪灯ろうは　れつの　はしに　あるよ。こんや、火が　ついたら　見に　来てね！'],
    animatriceEncoreNuit: ['見た？　きみの　雪灯ろうも　みんなと　いっしょに　ひかっているよ。'],
    toroCompagnon: { kon: ['「雪の　とうろう……ろうそくで　とけないのかな？」'], pon: ['「ポン！　大きな　おもちみたい。だめだよ、食べたく　なる」'], chapu: ['「チャプ！　足で　かためたの、見た？」'], gao: ['「ガオ。小さな　見はりの　あかり。よい」'], fuwa: ['「フワァ……こんやは　ぼくの　たまみたいに　ひかるね」'], saya: ['「雪の　中の　あかり。まよった　旅人は　よろこぶ」'] },
    glisseur: ['12回　すべったよ。12回！　ズボンは　びしょびしょだけど　へいき。'],
    maman: ['もう　かえりたがらなくて……大きい子には、城の　いちばん　上に　スノースライダーが　あるわよ。'],
    igloo: ['イグルーづくり体験だよ。かためた　雪を　ブロックに　切って、まるく　つんでいくんだ。', 'いちばん　上の　さいごの　ブロックが　むずかしい。そこまでは……まだ　とおいな。'],
    liftier: ['スノースライダーへ　ようこそ！　チューブに　のって、城の　北の　坂を　下まで　いっきに　すべるよ。', 'タイムを　はかるよ。やってみるかい？'],
    liftierEncore: ['もう一回？　ストップウォッチが　まっているよ！'],
    liftierConsigneOrdi: ['カーブでは　チューブが　外へ　ふられる。左右の　矢印キー（A・D）で　まんなかへ　もどそう。ふちに　ふれると　おそくなるよ！', 'もっと　はやく　すべるには、体を　前に　たおそう：上の　矢印キー（W）だよ。'],
    liftierConsigneTel: ['カーブでは　チューブが　外へ　ふられる。ジョイスティックで　まんなかへ　もどそう。ふちに　ふれると　おそくなるよ！', 'もっと　はやく　すべるには、体を　前に　たおそう：ジョイスティックを　上に　たおすんだ。'],
    chronoPartez: 'スタート！', chronoChocs: 'ふちに　ふれた：', chronoRecord: 'きろく',
    boueeTemps: 'トランシーバーから：「{t}びょう！　一回も　ふちに　ふれなかった！」',
    boueeTempsChocs: 'トランシーバーから：「{t}びょう。ふちに　{c}回　ふれたよ」',
    boueeRecord1: '「これが　最初の　きろく。すぐ　ぬけるよ！」',
    boueeRecord: '「新きろく！　雪から　まだ　けむりが　出ているぞ」',
    boueeRecordNon: '「きろくは　{r}びょう。おしい！」',
    boueeMedailleOr: '「金メダル！　大天狗だって　こんなに　はやくない」',
    boueeMedailleArgent: '「銀メダル！　ふちを　あと一回　へらせば　金だ」',
    boueeMedailleBronze: '「銅メダル！　なかなか　やるね」',
    boueeEncore: ['上に　もどって　もう一回　すべるかい？'],
    sliderCompagnon: { kon: ['「耳を　上に　おいてきちゃった！　もう一回？」'], pon: ['「ポン……ポン……おなかが　しごとの　半分を　した」'], chapu: ['「チャプ！！　雪の　たきだ！　もう一回！」'], gao: ['「ガオ……まもり神は　さけばない。……いまのは　ほえたのだ」'], fuwa: ['「フワァ……とんだ！　ほとんど！」'], saya: ['「杉が　はやすぎて　あいさつも　できなかった」'] },
    prieur: ['小さな　葵神社が　城の　上を　まもっている。雪の　日も、まい朝　あいさつに　のぼるんじゃ。', '春には　公園じゅうが　ピンクに　なる。飯山の　さくらじゃよ。いまは　ねむっておる。'],
    amoureuse: ['あの　川は　千曲川。下ると　名前が　かわって　信濃川に　なるの。日本で　いちばん　長い　川よ。'],
    amoureux: ['春には　きしが　菜の花で　きいろに　なる。でも　ぼくは　こういう、白の　中の　くろい　川が　すきだな。'],
    aoi: ['「葵神社」。城の　本丸あとに　ある。'],
    vue: ['「千曲川」。川は　白い　山の　あいだを　北へ　ながれていく。', '下では　町の　やねが　雪に　かくれている。'],
    vueNuit: ['川は　くろい　リボン。きしには　町の　まどが　小さな　きいろい　点に　なっている。'],
    ecriteauFeu: ['「のろし（狼煙）」：しらせの　火。', 'いくさの　時代、あぶないことを　しらせるのに　高い　ところで　火を　たいた。山から　山へ、しらせは　馬より　はやく　つたわった。この　城を　きずいた　上杉謙信の　がわは、黒岩山に　のろし台を　もっていた。'],
    feuJour: ['大きな　たきぎの　山。丸太、わら、杉の　えだ。あとは　火を　まつだけ。'],
    feuJourCompagnon: { kon: ['「のろしか……夜なら　ずっと　とおくから　見えるね。火と、夜が　いるんだ」'], pon: ['「ポン……こんなに　いい　たきぎなのに、火だねが　ひとつも　ない。こんや、かな？」'], chapu: ['「チャプ！　すごい　火に　なるよ！　でも　昼だと　見えないね……」'], gao: ['「ガオ。火の　ない　見はりの　火。夜と　火だねが　いる」'], fuwa: ['「フワァ……ねむってる。こんや、だれかが　おこして　くれるかな？」'], saya: ['「この　木は　まっている。火と、それを　見せる　夜を」'] },
    feuNuit: ['たきぎは　まだ　きえたまま。夜なら　どの　山からも　見えるのに……'],
    feuNuitCompagnon: { kon: ['「下の　だんの　大天狗の　たいまつ、見た？　火が　ある！　わけて　もらえないかな？」'], pon: ['「ポン！　下で　大天狗が　大きな　たいまつを　もってる。すこし　かして　くれるよね？」'], chapu: ['「チャプ！　火なら　下の　だんの　天狗の　たいまつに　いっぱい！」'], gao: ['「ガオ。下で　大天狗が　火を　まもっている。たのみに　行こう」'], fuwa: ['「フワァ……下で　天狗が　大きな　ほのおを　まわせてる……」'], saya: ['「天狗の　火は　わるいものを　はらう。さいしょの　火に　ちょうどいい。下の　だんで　まっている」'] },
    feuTorcheJour: ['天狗の　火を　もっているけれど、まだ　昼。とおくからは　見えない。夜を　まとう。'],
    feuAllume1: ['天狗の　火を　わらに　近づける……'],
    feuCompagnon1: { kon: ['「ついた！　見て、どんどん　のぼっていく！」'], pon: ['「ポン！！　あつい！　さがって、さがって！」'], chapu: ['「チャプ！　ひげが！」'], gao: ['「ガオ！　ついに　見はりの　火だ！」'], fuwa: ['「フワァ……星まで　のぼっていく……」'], saya: ['「ふるい　木が　うたっている。きいて」'] },
    feuAllume2: ['あそこ、黒岩山に……あかりが。だれかが　こたえた！'],
    feuAllume3: ['そして　そのむこうにも　もうひとつ。また　ひとつ。山から　山へ、北西へ。山の　むこうの、謙信の　城、春日山の　ほうへ。', 'むかしと　おなじように、しらせは　馬より　はやく　走る。こんやの　しらせは　ひとつだけ。「飯山は　おまつりだよ！」'],
    feuCompagnon2: { kon: ['「山じゅうに　きこえたんだ……毛が　ぜんぶ　立っちゃった」'], pon: ['「ポン……こたえてる！　あっちにも　なべが　あるのかな？」'], chapu: ['「チャプ……地面に　おいた　星みたい」'], gao: ['「ガオ。むかしの　見はりは　いまも　おきている。あいさつを」'], fuwa: ['「フワァ……山に　火の　くびかざり……」'], saya: ['「おねの　ふるい　木たちは　おぼえている。ずっと　こんやを　まっていた」'] },
    feuKoban: ['火の　ねもとの　雪が　とけた。ぬれた　土の　中で　なにかが　ひかっている。ふるい　金の　小判だ！'],
    feuBrule: ['大きな　火が　もえている。おねの　上で、ほかの　火が　こたえている。'],
    feuCendres: ['はいは　まだ　あたたかい。こんや　また　火が　ついて、山が　こたえるだろう。'],
    tengu: ['……　……　……', '（大天狗が　足を　とめた。赤い　めんの　おくから　二つの　目が　こちらを　見る。そして　たいまつを　こちらへ　さげた。）', '「わしの　火の粉は　わるいものを　はらう。あびた　者は　一年　しあわせじゃ。おぬしは　とおくから　来たな。火を　ひとつ　もって　ゆけ」'],
    tenguFlamme: ['大天狗の　たいまつから　火を　うつした、小さな　たいまつを　もらった。'],
    tenguCompagnon: { kon: ['「大天狗の　火だ！　えんぎが　いいよ……ねえ、城の　いちばん　上の、きえたままの　たきぎの　山は？」'], pon: ['「ポン！　火だ！　城の　いちばん　上で、たきぎが　まってるよ」'], chapu: ['「チャプ！　けさないで！　はやく、城の　いちばん　上の　たきぎへ！」'], gao: ['「ガオ。火は　まもるもの。城の　上の　たきぎへ　はこぼう」'], fuwa: ['「フワァ……おどってる。城の　上の　たきぎも　おどりたがってるよ……」'], saya: ['「城の　上の　木が　この　火を　まっている。のぼろう」'] },
    tenguDeja: ['（大天狗は　たいまつの　先で　城の　上を　さして、また　まいはじめた。）'],
    tenguApres: ['（大天狗は　火の　ともる　山へ　たいまつを　かかげた。めんの　おくで　わらっているようだ。）'],
    spectateurs: [['火の粉　ひとつで　わるいことが　ひとつ　きえる。だから　近くで　見るの……でも　近すぎは　だめ！'], ['大天狗は　奈良沢神社から　来るんだ。あっちでは　9月に、ほうさくを　いのって　まうんだよ。'], ['たいまつは　2メートルより　長い。うでの　力が　いるね！'], ['火の粉が　あたると　一年　しあわせ。この　あたりでは　そう　言うんだ。']],
    cuisiniere: ['かまくらの里へ　ようこそ！　1月の　おわりから　2月の　おわりまで、20ほどの　かまくらが　ならぶよ。', '中で　食べるのは　ここの　めいぶつ、のろし鍋。きのこ、じもとの　やさい、みゆきポークを　信州みそで　にこむの。', 'ひとつ　つくろうか？'],
    cuisiniereOui: 'おねがい！',
    cuisiniereCommande: ['はいよ！　赤い　ちょうちんの　かまくらで　まっていて。道の　右がわ、いちばん　手前だよ。もっていくからね。', 'どうして　「のろし」か　しってる？　ゆげが　まっすぐ　のぼって、むかしの　のろしみたいだから。いくさの　時代、上杉謙信の　がわは、すぐ　うしろの　黒岩山に　のろし台を　もっていたんだよ。'],
    cuisiniereAttend: ['なべは　赤い　ちょうちんの　かまくらで　まっているよ。道の　右がわ、いちばん　手前！'],
    cuisiniereEncore: ['なべは　どうだった？　いつでも　おいで。あたたかい　せきは　いつも　あるからね。'],
    cuisiniereSoir: ['夜は　かまくら　ひとつずつに　あかりが　ともるよ。夜まで　まつかい？'],
    cuisiniereMatin: ['朝を　まつかい？'],
    kamakuraPasCommande: ['赤い　ちょうちんの、よやくの　かまくら。まず　アーチの　そばの　りょうりの　おばさんに　なべを　たのもう。'],
    repas1: ['はい、のろし鍋！　あついから　気を　つけてね。おにぎりは　飯山の　コシヒカリだよ。'],
    repas2: ['外は　雪。中では　なべが　ゆげを　立てて、雪の　かべが　あたたかさを　にがさない。いい　きもち。'],
    repasCompagnon: { kon: ['「雪の　おうちは　さむいと　思ってた。ぜんぜん　ちがうね！」'], pon: ['「ポン……ポン……きのこ　もうひとつ。おつゆも。ねえ……その　ごはん、のこすの？」'], chapu: ['「チャプ！　ゆげが　はなを　くすぐる！」'], gao: ['「ガオ。しっかりした　やねと　あたたかい　ごはん。まもり神の　ねがいは　それだけだ」'], fuwa: ['「フワァ……しんじゅの　中みたい……」'], saya: ['「雪は　おおったものを　まもる。たねは　むかしから　しっている」'] },
    ancien: ['かまくらを　つくるのは　わしら、じもとの　者じゃ。「かまくら応援隊」と　いうんじゃよ。', '大きな　まるい　ふうせんを　ふくらませて、雪を　あつく　ふきつけて、みんなで　ふんで　かためる。かたまったら　ふうせんの　空気を　ぬく……すると　かまくらが　のこるんじゃ！'],
    visiteuse: ['この　アーチ、どの　しゃしんでも　見たわ。「信州飯山　かまくらの里」！', 'むこうの、道の　おくに　赤い　とりいが　あるの。雪の　中の　神社よ。'],
    serveuse: ['すみません、とおります！　あつい　なべです！　……夕方は　いちばん　いそがしいの。みんな　あかりの　中で　食べたいから。'],
    panneauKamakura: ['「かまくらの　つくりかた」　かまくら応援隊。', 'ドームの　ふうせんに　雪を　ふきつけて、大ぜいで　ふみかためる。入り口は　いつも　山の　はんたいがわ。風が　入らないように。'],
    arche: ['「信州飯山　かまくらの里」。雪の　ドームの　村。'],
    archeNuit: ['アーチを　くぐると、雪灯ろうの　道が　赤い　とりいまで　まっすぐ　つづいている。'],
    offrande: ['かまくらの　おく。雪の　さいだん、小さな　木の　おやしろ、しめなわ、そして　さいせんばこ。', 'おさいせんを　入れて、二回　おじぎ、二回　手を　たたいて……'],
    jinjaCompagnon: { kon: ['「雪の　中の　神社……来年の　冬も　ここに　来られますようにって　おねがいしたよ」'], pon: ['「ポン。なべが　からっぽに　なりませんように、と　おねがいした」'], chapu: ['「チャプ……しーっ！　中は　やさしく　ひびくね」'], gao: ['「ガオ。石の　まもり神が　いなくても、ここは　よく　まもられている」'], fuwa: ['「フワァ……かみさまは　あわの　中で　ぽかぽかだね」'], saya: ['「春には　この　神社は　とける。来年　また　つくられる。それも　いい　つづきかただ」'] },
    jinjaEncoreCompagnon: { kon: ['「もう一回　おまいり？　いいよ」'], pon: ['「ポン。なべの　ために、いつでも」'], chapu: ['「チャプ！」'], gao: ['「ガオ」'], fuwa: ['「フワァ……」'], saya: ['「一回より　二回」'] },
    borneSanctuaire: ['「かまくら神社」。', '赤い　とりいの　むこう、村で　いちばん　大きな　かまくらの　中に　さいだんが　ある。'],
    chantier: ['つくりかけの　かまくら。大きな　青い　ふうせんが　まだ　雪から　のぞいている。雪が　かたまったら　空気を　ぬくんだ。'],
  },
};
