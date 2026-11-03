// ================================================================
//  Les dunes de Tottori (鳥取砂丘), à Tottori, au bord de la mer du Japon (2026-11-02 : le douzième lieu de la balade, choisi par
//  le propriétaire parmi quatre : « Ok on part sur les dunes de Tottori, Respecte toujours les mêmes règles que les autres
//  balades »). Seize kilomètres d'est en ouest, 2,4 km du nord au sud : le sable du granite des montagnes, descendu par la rivière
//  Sendai (千代川) et ramené par la mer, puis poussé par le vent depuis cent mille ans. Le cœur (146 ha) est monument naturel depuis
//  1955, parc national depuis 1963. On arrive par la route, on monte l'escalier du bord de la route (砂丘入口階段), et tout
//  s'ouvre : la grande cuvette, l'oasis (une source de pluie et de neige fondue au pied de la crête : elle vient de la fin de
//  l'automne au printemps), le Dos de cheval (馬の背, 47 m), et de l'autre côté la pente qui tombe dans la mer. Les chameaux de la
//  らくだや, la planche de sable, le musée du sable et ses sculptures géantes (砂の美術館 : l'Espagne, en 2026).
//  Son secret : la caravane de la lune. Le jour, de grandes traces de chameaux le long de la crête ; le chamelier jure que ses
//  bêtes dorment la nuit. La nuit, une file de chameaux faits de sable passe sur le Dos de cheval, devant la lune : on la suit
//  jusqu'au fond de la grande cuvette, où elle s'effrite dans le vent (le propriétaire l'a choisi parmi quatre ; inventé pour le
//  jeu, un clin d'œil à une vieille chanson, Tsuki no Sabaku : ni ses paroles ni son air). Sa récompense : l'ombrelle de
//  Shan-shan, aux grelots de la grande fête de Tottori (tenues.js).
//  Le 2026-11-03, le vrai télésiège (鳥取砂丘リフト) : de l'entrée du sable au Sakyu Center, sur la colline (creerTelesiege).
//  Les distances sont resserrées de moitié environ ; les hauteurs sont les vraies (GSI, le modèle à 5 m : l'entrée 46–55 m,
//  l'oasis 19 m, la crête 44–47 m). Le rivage, qui court du sud-ouest au nord-est, est tourné de 20° : il suit l'axe des x.
//  Repère : x vers l'est, z vers le sud, y vers le haut, en mètres ; la mer au nord (niveau 0).
//  ctx : { THREE, atelier, P (palette), peinture, perso, maillage }.
// ================================================================
import { creerMonde, interactionsBancs, lisse, hasard, bruitDoux, ASSIS } from './monde.js';
import { panneau, PAPIER_PANNEAU } from './decor.js';
import { MATIERES as M } from './textures.js';
import { secretTrouve } from './tresors.js';
import { creerPersonnage } from './personnages.js';

const PI = Math.PI;
const melange = (a, b, t) => a + (b - a) * t;
/** Le plus haut des deux, en douceur sur k mètres (un pied de dune arrondi, sans arête). */
const smax = (a, b, k) => { const e = Math.max(k - Math.abs(a - b), 0) / k; return Math.max(a, b) + (e * e * k) / 4; };

// ---------------------------------------------------------------- Le plan
/** Le rivage : le z où le sol passe au niveau de la mer. Il reste droit devant le lieu ; loin à l'est, il remonte vers le nord (le cap d'Iwato). */
const zRivage = (x) => -165 + 2.5 * Math.sin(x * 0.011 + 0.7) + 1.2 * Math.sin(x * 0.029 + 2.0) - 260 * lisse(620, 1500, x) ** 1.5;
/** La plage : sa hauteur à dc mètres du rivage (la mer dessous : le fond descend doucement). */
const plage = (dc) => (dc < 0 ? Math.max(-14, dc * 0.075) : 2.5 * (1 - (1 - Math.min(1, dc / 17)) ** 1.6));
const LARGEUR_PLAGE = 17;

/**
 * Les lignes de crête : une table, de mètre en mètre le long de l'axe (axe 'x' : la crête court d'est en ouest ; 'z' : du nord au
 * sud), de la position de la crête, de sa hauteur et du cosinus de son angle (la distance à la crête, à peu de frais). Courbes de
 * Catmull-Rom entre les points [u, v, h] (u croissant). Les pentes : devant (v plus petit : vers le nord, ou vers l'ouest) et derrière.
 */
function tableCrete({ axe, points, avant, arriere, r = 1.6 }) {
  const u0 = points[0][0], u1 = points[points.length - 1][0], n = Math.ceil(u1 - u0) + 1;
  const V = new Float32Array(n), H = new Float32Array(n), C = new Float32Array(n);
  const cr = (a, b, c, d, t) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t);
  for (let k = 0, s = 0; k < n; k++) {
    const u = u0 + k;
    while (s < points.length - 2 && u > points[s + 1][0]) s++;
    const p1 = points[s], p2 = points[s + 1], p0 = points[Math.max(0, s - 1)], p3 = points[Math.min(points.length - 1, s + 2)], t = Math.min(1, (u - p1[0]) / (p2[0] - p1[0]));
    V[k] = cr(p0[1], p1[1], p2[1], p3[1], t);
    H[k] = cr(p0[2], p1[2], p2[2], p3[2], t);
  }
  for (let k = 0; k < n; k++) { const d = (V[Math.min(n - 1, k + 2)] - V[Math.max(0, k - 2)]) / 4; C[k] = 1 / Math.hypot(1, d); }
  return { axe, u0, n, V, H, C, avant, arriere, r };
}
// le Dos de cheval (馬の背) : la première ligne de dunes, en biais par rapport au rivage ; son sommet, 47 m, au-dessus de l'oasis
const CRETE1 = tableCrete({ axe: 'x', avant: 0.46, arriere: 0.42, r: 1.8, points: [[-470, 100, -12], [-420, 92, 16], [-320, 72, 24], [-235, 50, 29], [-160, 20, 35], [-90, -9, 41], [-25, -31, 45], [40, -48, 47], [105, -62, 45], [170, -78, 38], [235, -108, 24], [300, -128, 12], [380, -138, -4], [420, -140, -20]] });
// le deuxième rang (第二砂丘列), au sud de la cuvette ; le rang de l'entrée (第三砂丘列 : du nord au sud, à l'est)
const CRETE2 = tableCrete({ axe: 'x', avant: 0.38, arriere: 0.3, r: 2.2, points: [[-520, 134, -20], [-460, 132, 30], [-420, 132, 44], [-320, 128, 46], [-235, 124, 46], [-130, 118, 42], [-40, 112, 38], [60, 108, 36], [150, 104, 40], [190, 98, 44], [260, 92, 40], [320, 90, 14], [380, 90, -20]] });
const CRETE3 = tableCrete({ axe: 'z', avant: 0.22, arriere: 0.5, r: 2.4, points: [[-160, 216, -14], [-120, 210, 16], [-90, 207, 28], [-60, 204, 38], [-15, 199, 46], [38, 196, 52], [90, 186, 47], [135, 162, 44], [170, 130, 42], [230, 110, 30], [280, 104, -10]] });
const CRETES = [CRETE1, CRETE2, CRETE3];

/** La hauteur de la crête t en x, z (déjà ondulés) : -Infinity au-delà des bouts de sa table. */
function hauteurCrete(t, x, z) {
  const u = t.axe === 'x' ? x : z, k = Math.round(u - t.u0);
  if (k < 0 || k >= t.n) return -Infinity;
  const d = ((t.axe === 'x' ? z : x) - t.V[k]) * t.C[k], a = Math.abs(d);
  return t.H[k] - (d < 0 ? t.avant : t.arriere) * (Math.sqrt(a * a + t.r * t.r) - t.r);
}

// la plaine, sous les crêtes : une table tous les 60 m (une cuvette à l'oasis, 19 m, qui remonte vers l'entrée à l'est et la forêt au sud)
const XP = [-420, -360, -300, -240, -180, -120, -60, 0, 60, 120, 180, 240, 300, 360, 420];
const ZP = [-180, -120, -60, 0, 60, 120, 180, 240, 300];
const PLAINE = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 8, 24, 30, 36],
  [12, 12, 12, 12, 10, 9, 9, 10, 11, 13, 17, 30, 44, 50, 54],
  [20, 20, 22, 20, 20, 20, 19, 19, 20, 27, 38, 42, 46, 50, 54],
  [30, 30, 30, 30, 26, 24, 22, 21, 24, 33, 44, 43, 50, 60, 66],
  [44, 44, 44, 42, 38, 33, 31, 31, 33, 37, 44, 44, 52, 66, 74],
  [58, 58, 58, 56, 52, 48, 46, 46, 48, 50, 52, 54, 62, 76, 84],
  [66, 66, 66, 64, 60, 56, 56, 56, 58, 60, 62, 64, 72, 86, 92],
  [72, 72, 72, 70, 66, 62, 62, 62, 64, 66, 70, 74, 82, 92, 100],
];
function plaine(x, z) {
  const cherche = (T, v) => { let i = 0; while (i < T.length - 2 && v > T[i + 1]) i++; return [i, Math.min(1, Math.max(0, (v - T[i]) / (T[i + 1] - T[i])))]; };
  const [i, u] = cherche(XP, x), [j, v] = cherche(ZP, z);
  const cr = (a, b, c, d, t) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t);
  const ligne = (r) => { const R = PLAINE[Math.max(0, Math.min(ZP.length - 1, r))]; return cr(R[Math.max(0, i - 1)], R[i], R[i + 1], R[Math.min(XP.length - 1, i + 2)], u); };
  return cr(ligne(j - 1), ligne(j), ligne(j + 1), ligne(j + 2), v);
}

/** Les collines au loin : la forêt au sud, le cap d'Iwato à l'est ; nulles dans le lieu. */
function collines(x, z) {
  const sud = lisse(250, 800, z) * (60 + 26 * Math.sin(x * 0.0061 + 0.8) + 14 * Math.sin(x * 0.017 + z * 0.006));
  const est = lisse(320, 760, x) * lisse(-260, 40, z) * (58 + 26 * Math.sin(z * 0.009 + 1.2) + 12 * Math.sin(x * 0.014 + z * 0.01));
  return sud + est;
}

/** Le sol sans les retouches du lieu (la grille s'y raccorde sur ses bords ; au-delà, c'est lui). */
function reliefBrut(x, z, pv = null) {
  const dc = z - zRivage(x);
  if (dc < 0) return plage(dc);
  // les crêtes ondulent un peu : jamais une ligne droite
  const xo = x + 4 * Math.sin(z * 0.031 + 1.0) + 2 * Math.sin(z * 0.077 + x * 0.02), zo = z + 5 * Math.sin(x * 0.018) + 2.4 * Math.sin(x * 0.047 + 1.7);
  let h;
  if (pv) {
    const fx = (x - pv.x0) / pv.pas, fz = (z - pv.z0) / pv.pas, i = Math.min(pv.nx - 2, fx | 0), j = Math.min(pv.nz - 2, fz | 0), u = fx - i, v = fz - j, k = j * pv.nx + i, T = pv.t;
    h = (T[k] + (T[k + 1] - T[k]) * u) * (1 - v) + (T[k + pv.nx] + (T[k + pv.nx + 1] - T[k + pv.nx]) * u) * v;
  } else h = plaine(x, z);
  for (const t of CRETES) { const c = hauteurCrete(t, xo, zo); if (c > -999) h = smax(h, c, 9); }
  // la houle du sable : de longues bosses, travers au vent, et de plus petites
  h += 0.7 * Math.sin(x * 0.041 + z * 0.052 + 1.3) * Math.sin(x * 0.019 - z * 0.033) + 0.22 * Math.sin(x * 0.11 + z * 0.13 + 0.4 * Math.sin(x * 0.05));
  h += collines(x, z);
  // jusqu'à la plage
  const t = lisse(LARGEUR_PLAGE - 5, LARGEUR_PLAGE + 22, dc);
  return melange(plage(dc), Math.max(plage(dc), h), t);
}

// le rang de petites dunes en croissant (x, z : leur crête ; l : leur largeur ; p : leur hauteur) ; le vent vient du nord-ouest
const CROISSANTS = [
  [-30, 26, 26, 3.6], [-62, 44, 34, 4.6], [-4, 60, 30, 3.4], [58, 44, 22, 2.6], [112, 26, 34, 4.2], [140, 62, 30, 3.0], [84, 88, 22, 2.2],
  [-20, 88, 24, 2.6], [-198, 74, 34, 4.4], [-208, 16, 28, 3.4], [-180, -56, 34, 3.2], [-120, -80, 40, 4.0], [-60, -100, 30, 2.8], [-222, -86, 28, 2.6],
  [-150, -118, 22, 1.8], [8, -128, 16, 1.2], [150, 2, 22, 2.6], [172, -40, 22, 2.2], [40, 100, 18, 1.6], [-90, 130, 30, 3.4], [-178, 134, 30, 3.0],
];
// le vent dominant (le sable part vers le sud-est) : la pente douce au nord-ouest, la pente raide (le croissant) au sud-est
const VENT = [0.72, 0.69];
// les grandes cuvettes (スリバチ, comme un mortier) : le vrai 追後スリバチ fait 20 m de creux, ses flancs à 32° ; la nôtre, où finit la caravane.
// x, z, R (son rayon, au bord), fond (sa hauteur), bord (sa hauteur), plat (le rayon de son fond)
const CUVETTE = { x: -122, z: 62, R: 44, fond: 10, bord: 30, plat: 7 };
const CUVETTE2 = { x: 96, z: 66, R: 22, fond: 21, bord: 33, plat: 4 };
const OASIS = { x: 28, z: 16, rx: 15, rz: 9.5, ry: -0.35, y: 19.2 };
// la pierre du poème d'Arishima Takeo (1923), contre la clôture sud
const POEME = { x: -72, z: 146 };
// ce que dit la bulle, sur les trois tampons où l'on regarde
const QUOI = {
  crete: { fr: 'la vue du Dos de cheval', en: 'the view from the Horse’s Back', ja: '馬の背からのながめ' },
  musee: { fr: 'la Sagrada Família de sable', en: 'the sand Sagrada Família', ja: '砂のサグラダ・ファミリア' },
  oasis: { fr: 'l’oasis', en: 'the oasis', ja: 'オアシス' },
};
// la route (県道) et ce qui la borde, à l'est : les hauteurs
const Y_ROUTE = 43;
const ROUTE = { x0: 214, x1: 222, z0: -36, z1: 132 };
// (au-delà de sa barrière nord, elle tourne à l'est, vers le Sakyu Center : ce tronçon, à plat ; ses bords sur la grille de 2 m du sol)
const TOURNANT = { x0: ROUTE.x0, x1: 331, z0: -48, z1: -40 };
const TROTTOIR = { x0: 212.8, x1: 214 };
// le parking, devant les boutiques (de la route aux devantures)
const PARKING = { x0: 222, x1: 250, z0: -30, z1: 76 };
// l'escalier de l'entrée (砂丘入口階段) : de la route au haut de la berge, droit vers l'ouest ; son palier
const ESC = { x0: 199, x1: 214, z0: 33, z1: 43, y0: Y_ROUTE, y1: 52, n: 50 };
const PALIER = { x0: 194, x1: 199, z0: 33, z1: 43, y: 52 };
// le départ : à l'arrêt du bus, au passage piéton, tourné vers l'escalier
const DEPART = { x: 225.5, z: 38 };
// le musée du sable (砂の美術館), au sud de la route : son mur de béton, sa cour, sa grande salle
const MUSEE = { x0: 236, x1: 270, z0: 84, z1: 124, y: Y_ROUTE };
const COUR = { x0: 222, x1: 236, z0: 88, z1: 118 };
const MUSEE_D = { x0: 238.9, x1: 269.3, z0: 86.9, z1: 121.1, porte: { z0: 100, z1: 108 } };
// la galerie du musée, le long du mur sud, et son escalier (de escX1 au sol à x0 en haut, le long de la galerie côté salle)
const GALERIE = { x0: 240, x1: 269.25, z0: 117, z1: 121.1, h: 3.6, escX1: 250, escL: 1.4 };
// le Sakyu Kaikan (砂丘会館), où l'on entre : sa salle, sa porte
const SALLE = { x0: 250.85, x1: 271.2, z0: -7.2, z1: 29.2, porte: { z0: 6.2, z1: 9.4 } };
// le télésiège (鳥取砂丘リフト) : de la gare du bas, sur le sable, à celle du haut, au Sakyu Center (砂丘センター 見晴らしの丘, sur la colline) : une ligne droite, au-dessus de la clôture,
// de la route, du parking et des pins. Le vrai : 216 m et 15 m de montée (ses deux gares sur la photo aérienne, les hauteurs GSI) ; ici 161 m, 13 m (e : la moitié de l'écart entre ses deux câbles ;
// xb, xh : ses deux grandes roues ; appuis : [x, hauteur du câble, sa flèche au milieu de la portée qui finit là])
const LIFT = { z: 70, e: 1.7, xb: 187.6, xh: 348.5, appuis: [[187.6, 51.9, 0], [198, 51.9, 0], [206, 53.4, 0.12], [254, 54.8, 0.9], [282, 57.2, 0.35], [310, 60.6, 0.35], [336, 64.8, 0.3], [348.5, 64.8, 0]] };
const GARE_B = { x0: 182, x1: 198, z0: 60, z1: 80, F: 49.1 };
const GARE_H = { x0: 336, x1: 355, z0: 62, z1: 78, F: 62.02 };
// la 砂丘テラス, à côté de la gare ; la salle du Sakyu Center, sa porte sur la terrasse
const TERRASSE = { x0: 336, x1: 356, z0: 36, z1: 62 };
const CENTRE = { x0: 356.6, x1: 376, z0: 34, z1: 60, porte: { z0: 46, z1: 50 } };
// le toit du Sakyu Center (屋上の展望台, le vrai belvédère, gltjp.com/ja/article/item/20380 : « 鳥取砂丘と日本海を一望できる展望台 ») ; l'escalier qui y monte, le long du bâtiment, sur la terrasse
const TOIT = { x0: 356.6, x1: 385.4, z0: 30.6, z1: 77.4, y: GARE_H.F + 7.51, ex0: 354.2, ex1: 355.9, ez0: 45, ez1: 60, pz0: 43.3, pz1: 44.7 };
/** La hauteur du câble en x : droit d'un appui à l'autre, moins sa flèche. */
function yCable(x) {
  const A = LIFT.appuis;
  let i = 0;
  while (i < A.length - 2 && x > A[i + 1][0]) i++;
  const f = Math.min(1, Math.max(0, (x - A[i][0]) / (A[i + 1][0] - A[i][0])));
  return A[i][1] + (A[i + 1][1] - A[i][1]) * f - 4 * A[i + 1][2] * f * (1 - f);
}

// ---------------------------------------------------------------- Le sol : une grille au mètre, peinte une fois
const G = { x0: -440, z0: -280, nx: 881, nz: 561 };
let H = null;
/** Là où le sol de la grille se raccorde au relief lointain : le bord de la grille. */
function preparerSol() {
  const { x0, z0, nx, nz } = G, T = new Float32Array(nx * nz);
  // (la plaine change lentement : calculée tous les 8 m, puis lue en bilinéaire ; le relief lointain, lui, la recalcule)
  for (let j = 0, k = 0; j < nz; j++) for (let i = 0; i < nx; i++, k++) T[k] = reliefVite(x0 + i, z0 + j);
  const zone = (cx, cz, r, fn) => {
    const i0 = Math.max(0, Math.floor(cx - r - x0)), i1 = Math.min(nx - 1, Math.ceil(cx + r - x0)), j0 = Math.max(0, Math.floor(cz - r - z0)), j1 = Math.min(nz - 1, Math.ceil(cz + r - z0));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const k = j * nx + i; T[k] = fn(x0 + i, z0 + j, T[k]); }
  };
  // les petites dunes en croissant : la pente douce au vent, la pente raide dessous ; les cornes filent sous le vent
  for (const [cx, cz, l, p] of CROISSANTS) {
    zone(cx, cz, l * 1.7, (x, z, h) => {
      const dx = x - cx, dz = z - cz, a = dx * VENT[0] + dz * VENT[1], b = -dx * VENT[1] + dz * VENT[0], v = b / (l * 0.5), v2 = v * v;
      if (v2 >= 1) return h;
      const du = a - 0.32 * l * v2, Lv = 1.2 * l * (1 - 0.45 * v2), Ls = 0.36 * l;
      const f = du < 0 ? Math.max(0, 1 + du / Lv) ** 1.5 : Math.max(0, 1 - du / Ls) ** 1.5;
      return h + p * f * (1 - v2);
    });
  }
  // les deux grandes cuvettes : le bord, relevé autour (les flancs courbes, raides, du vrai) ; le fond plat, tout petit
  for (const C of [CUVETTE, CUVETTE2]) {
    const a0 = (t) => C.R * (1 + 0.07 * Math.sin(3 * t + 1.1) + 0.04 * Math.sin(5 * t + 0.4));
    zone(C.x, C.z, C.R * 1.1 + 40, (x, z, h) => {
      const dx = x - C.x, dz = z - C.z, r = Math.hypot(dx, dz), t = Math.atan2(dz, dx), Rt = a0(t);
      if (r >= Rt) return smax(h, C.bord - (r - Rt) * 0.3, 5);
      const e = Math.max(0, r - C.plat) / (Rt - C.plat);
      return C.fond + (Math.max(C.bord, h) - C.fond) * e ** 1.3;
    });
  }
  // l'oasis : un creux à peine plus bas que tout autour, l'eau au fond ; le bord tout près de l'eau
  zone(OASIS.x, OASIS.z, OASIS.rx * 4.2, (x, z, h) => {
    const r = rOasis(x, z);
    if (r < 1) return OASIS.y - 0.5 * (1 - r * r);
    return melange(OASIS.y + (r - 1) * 0.42, h, lisse(1, 3.8, r));
  });
  // la route, le parking, la cour du musée, le musée : à plat ; la berge de l'escalier
  const aplanir = (R, y, bande) => {
    const cx = (R.x0 + R.x1) / 2, cz = (R.z0 + R.z1) / 2;
    zone(cx, cz, Math.max(R.x1 - R.x0, R.z1 - R.z0) / 2 + bande + 1, (x, z, h) => {
      const d = Math.max(R.x0 - x, x - R.x1, R.z0 - z, z - R.z1);
      return d <= 0 ? y : melange(y, h, lisse(0, bande, d));
    });
  };
  aplanir({ x0: 212.5, x1: 250, z0: ROUTE.z0, z1: ROUTE.z1 }, Y_ROUTE, 10);
  aplanir({ x0: 222, x1: MUSEE.x1 + 1, z0: 80, z1: MUSEE.z1 + 1 }, Y_ROUTE, 10);
  aplanir({ x0: 250, x1: 272, z0: -10, z1: 70 }, Y_ROUTE, 8);
  // (au-delà des barrières, la route continue : vers le sud, dans la pente de la forêt ; vers le nord, elle tourne à l'est, sur la colline)
  zone(218, 240, 112, (x, z, h) => {
    if (x < ROUTE.x0 - 1.5 || x > ROUTE.x1 + 1.5 || z < ROUTE.z1) return h;
    return melange(Y_ROUTE, Y_ROUTE + (z - ROUTE.z1) * 0.06, 1);
  });
  aplanir({ x0: 212.5, x1: 330, z0: -50, z1: -36 }, Y_ROUTE, 12);
  // l'escalier : une rampe un peu sous ses marches, la berge s'y raccorde ; son palier en haut
  zone((ESC.x0 + ESC.x1) / 2, 38, 26, (x, z, h) => {
    const dz = Math.abs(z - 38) - 6.2;
    const f = Math.min(1, Math.max(0, (ESC.x1 - x) / (ESC.x1 - PALIER.x0)));
    if (x < PALIER.x0 - 7 || x > ESC.x1 - 0.1) return h;
    const y = x <= ESC.x0 ? ESC.y1 - 0.02 : ESC.y0 + (ESC.y1 - ESC.y0) * Math.min(1, (ESC.x1 - x) / (ESC.x1 - ESC.x0)) - 0.5 * Math.min(1, (ESC.x1 - x) / 1.2);
    const dBout = Math.max(0, PALIER.x0 - x);
    return melange(y, h, lisse(0, 6, Math.max(dz, dBout)));
  });
  // les deux gares, la terrasse et le Sakyu Center ; sous la ligne, le sol reste 4,4 m sous le câble (les pieds qui pendent, 2,8 m)
  aplanir(GARE_B, GARE_B.F - 0.02, 8);
  aplanir({ x0: GARE_H.x0, x1: 388, z0: 30, z1: 84 }, GARE_H.F - 0.02, 12);
  zone(267, LIFT.z, 76, (x, z, h) => {
    const d = Math.abs(z - LIFT.z);
    if (d > 6.5 || x < GARE_B.x1 || x > GARE_H.x0) return h;
    return melange(Math.min(h, yCable(x) - 4.4), h, lisse(4.2, 6.5, d));
  });
  H = T;
}
const rOasis = (x, z) => {
  const c = Math.cos(OASIS.ry), s = Math.sin(OASIS.ry), dx = x - OASIS.x, dz = z - OASIS.z, u = (dx * c + dz * s) / OASIS.rx, v = (-dx * s + dz * c) / OASIS.rz, t = Math.atan2(v, u);
  return Math.hypot(u, v) * (1 + 0.1 * Math.sin(3 * t + 0.7) + 0.05 * Math.sin(7 * t));
};
// (la plaine, lue dans une petite table : le calcul de la grille passe de 0,6 s à moins de 0,2 s)
const PV = { x0: -440, z0: -280, pas: 8, nx: 111, nz: 71, t: null };
function reliefVite(x, z) {
  if (!PV.t) {
    PV.t = new Float32Array(PV.nx * PV.nz);
    for (let j = 0, k = 0; j < PV.nz; j++) for (let i = 0; i < PV.nx; i++, k++) PV.t[k] = plaine(PV.x0 + i * PV.pas, PV.z0 + j * PV.pas);
  }
  return reliefBrut(x, z, PV);
}
/** La hauteur du sol en x, z. */
function terrain(x, z) {
  if (!H) preparerSol();
  const fx = x - G.x0, fz = z - G.z0;
  if (fx < 0 || fz < 0 || fx >= G.nx - 1 || fz >= G.nz - 1) return reliefBrut(x, z);
  const i = fx | 0, j = fz | 0, u = fx - i, v = fz - j, k = j * G.nx + i, a = H[k], b = H[k + 1], c = H[k + G.nx], d = H[k + G.nx + 1];
  return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
}
// le fin : 2 m (des dunes lisses) ; le grossier : 8 m (la forêt, le lointain) ; là où le sol plie (une crête, le bord d'une route), des cases de 50 cm
const ETENDUE = { x0: -1600, x1: 1600, z0: -360, z1: 1000, pas: 8, fin: { x0: -424, x1: 424, z0: -256, z1: 200, pas: 2 } };
const solDetaille = (x0, z0, x1, z1) => {
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  if (!dansLeCadreLarge(cx, cz)) return false;
  const a = terrain(x0, z0), b = terrain(x1, z0), d = terrain(x0, z1), f = terrain(x1, z1), bosse = (u, v) => Math.abs(terrain(x0 + (x1 - x0) * u, z0 + (z1 - z0) * v) - (u + v <= 1 ? a + (b - a) * u + (d - a) * v : f + (d - f) * (1 - u) + (b - f) * (1 - v)));
  return bosse(0.5, 0.5) > 0.06 || bosse(0.25, 0.25) > 0.06 || bosse(0.75, 0.25) > 0.06 || bosse(0.25, 0.75) > 0.06 || bosse(0.75, 0.75) > 0.06;
};
// (la mer profonde : rien à dessiner dessous)
const trouSol = (x0, z0, x1, z1) => z1 < zRivage((x0 + x1) / 2) - 90;

// ---------------------------------------------------------------- Le cadre : le sable, jusqu'aux clôtures de sable (堆砂垣) ; la route et le parking
// (x, z) le long du bord du sable : de la digue ouest, dans la mer, à la digue est, puis la clôture à l'est, au sud, à l'ouest. Le pied de chaque digue ferme la plage.
const BORD_SABLE = [[-238, -196], [226, -196], [226, -126], [212, -92], [206, -60], [203, -12], [200.4, 33], [200.4, 43], [GARE_B.x1, GARE_B.z0], [GARE_B.x1, GARE_B.z1], [195, 88], [174, 128], [122, 146], [40, 151], [-60, 150], [-160, 153], [-238, 150]];
const BORD_ROUTE = [[213, ROUTE.z0], [250, ROUTE.z0], [250, 80], [COUR.x1 - 0.25, 80], [COUR.x1 - 0.25, 130], [213, 130]];
function dansPoly(pts, x, z) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, zi] = pts[i], [xj, zj] = pts[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
  }
  return c;
}
/** Peut-on être là ? Le voyageur, un point, s'arrête aux lignes : les clôtures et les digues sont dessinées 27 cm au-delà. */
function dansLeCadre(x, z) {
  if (x < 150) return dansPoly(BORD_SABLE, x, z);
  if (dansPoly(BORD_SABLE, x, z) || dansPoly(BORD_ROUTE, x, z)) return true;
  // l'escalier et son palier ; la salle du Sakyu Kaikan et sa porte ; l'entrée et la salle du musée
  if (x > PALIER.x0 - 0.5 && x < ESC.x1 + 0.2 && z > ESC.z0 + 0.25 && z < ESC.z1 - 0.25) return true;
  if (x > SALLE.x0 && x < SALLE.x1 && z > SALLE.z0 && z < SALLE.z1) return true;
  if (x > 249.9 && x <= SALLE.x0 + 0.01 && z > SALLE.porte.z0 + 0.12 && z < SALLE.porte.z1 - 0.12) return true;
  if (x > MUSEE_D.x0 && x < MUSEE_D.x1 && z > MUSEE_D.z0 && z < MUSEE_D.z1) return true;
  // en haut : la terrasse, la gare (sa porte sur la terrasse), la salle du Sakyu Center (sa porte sur la terrasse)
  if (x > TERRASSE.x0 + 0.3 && x < TERRASSE.x1 && z > TERRASSE.z0 + 0.3 && z < TERRASSE.z1) return true;
  if (x > GARE_H.x0 && x < GARE_H.x1 && z >= TERRASSE.z1 - 0.01 && z < GARE_H.z1) return true;
  if (x > CENTRE.x0 && x < CENTRE.x1 && z > CENTRE.z0 && z < CENTRE.z1) return true;
  if (x > TERRASSE.x1 - 0.1 && x <= CENTRE.x0 + 0.01 && z > CENTRE.porte.z0 && z < CENTRE.porte.z1) return true;
  // (le toit, et le haut de l'escalier qui y arrive ; en bas, ce rectangle est plein : des murs jusqu'à hauteur d'homme ferment la salle, creerTelesiege)
  if (x > TOIT.x0 && x < TOIT.x1 && z > TOIT.z0 && z < TOIT.z1) return true;
  if (x > TERRASSE.x1 - 0.1 && x <= TOIT.x0 + 0.01 && z > TOIT.pz0 && z < TOIT.pz1) return true;
  return x > COUR.x1 - 0.3 && x <= MUSEE_D.x0 + 0.01 && z > MUSEE_D.porte.z0 && z < MUSEE_D.porte.z1;
}
const dansLeCadreLarge = (x, z) => (x > -252 && x < 262 && z > -180 && z < 164) || (x > 320 && x < 402 && z > 16 && z < 98);

// ---------------------------------------------------------------- Le sol, sa couleur
// les teintes du sable, du plus sombre au plus clair (une table : pas de chaîne de caractères à fabriquer pour chaque point)
const SABLES = [];
for (let k = 0; k < 32; k++) {
  const t = k / 31, r = Math.round(melange(0x96, 0xee, t)), g = Math.round(melange(0x70, 0xd2, t)), b = Math.round(melange(0x48, 0x9f, t));
  SABLES.push(`#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`);
}
const sableDe = (t) => SABLES[Math.max(0, Math.min(31, Math.round(t * 31)))];
// du sable clair au vert olive des コウボウムギ
const VERDIS = [];
for (let k = 0; k < 16; k++) {
  const t = (k / 15) ** 0.8, r = Math.round(melange(0xdb, 0x9f, t)), g = Math.round(melange(0xc0, 0xa8, t)), b = Math.round(melange(0x8e, 0x66, t));
  VERDIS.push(`#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`);
}
// où l'herbe des dunes (コウボウムギ, ハマゴウ) tient : les creux abrités, autour de l'oasis et en taches vers l'ouest
const VERTS = [
  { x: 52, z: 28, rx: 26, rz: 9, ry: -0.3 }, { x: 8, z: 34, rx: 18, rz: 6, ry: 0.2 }, { x: -44, z: 74, rx: 22, rz: 8, ry: 0.5 }, { x: 74, z: 72, rx: 14, rz: 6, ry: -0.4 },
  { x: -190, z: -32, rx: 30, rz: 12, ry: 0.1 }, { x: -116, z: -56, rx: 34, rz: 10, ry: -0.2 }, { x: -60, z: -80, rx: 24, rz: 8, ry: 0.3 }, { x: -210, z: -108, rx: 26, rz: 8, ry: 0.0 },
  { x: -130, z: -118, rx: 28, rz: 6, ry: 0.1 }, { x: -210, z: 106, rx: 24, rz: 12, ry: 0.4 }, { x: -60, z: 134, rx: 44, rz: 8, ry: 0.0 }, { x: 80, z: 132, rx: 34, rz: 9, ry: -0.1 },
];
function herbeDes(x, z) {
  let m = 0;
  for (const V of VERTS) {
    const dx = x - V.x, dz = z - V.z;
    if (Math.abs(dx) > V.rx * 1.3 || Math.abs(dz) > V.rx * 1.3) continue;
    const c = Math.cos(V.ry), s = Math.sin(V.ry), u = (dx * c + dz * s) / V.rx, v = (-dx * s + dz * c) / V.rz;
    m = Math.max(m, 1 - Math.hypot(u, v));
  }
  return m;
}
const distPoly = (pts, x, z) => {
  let d = Infinity;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [ax, az] = pts[j], [bx, bz] = pts[i], ux = bx - ax, uz = bz - az, f = Math.min(1, Math.max(0, ((x - ax) * ux + (z - az) * uz) / (ux * ux + uz * uz)));
    d = Math.min(d, Math.hypot(x - ax - f * ux, z - az - f * uz));
  }
  return d;
};
/** Le sol (sa couleur et sa matière, textures.js) en x, z, à la hauteur h. */
function aspectSol(P, x, z, h) {
  const dc = z - zRivage(x);
  // sous l'eau : le sable mouillé, puis le vert de la mer
  if (dc < -0.4) return [h < -5 ? '#4f7d84' : h < -1.8 ? '#7f9a86' : '#b6a47c', M.sable];
  // la route, le parking, le trottoir, les dalles : plus loin (le tournant, au-delà de la barrière nord, jusqu'aux pins de l'est)
  if (z > TOURNANT.z0 - 0.05 && z < TOURNANT.z1 + 0.05 && x > TOURNANT.x0 - 0.05 && x < TOURNANT.x1) return [bruitDoux(x, z, 3) > 0.5 ? '#5c5b59' : '#555453', M.route];
  if (x > 212.6 && x < 252 && z > ROUTE.z0 - 60 && z < ROUTE.z1 + 60) {
    if (x > ROUTE.x0 - 0.05 && x < ROUTE.x1 + 0.05 && z > TOURNANT.z0 - 0.05) return [bruitDoux(x, z, 3) > 0.5 ? '#5c5b59' : '#555453', M.route];
    if (z > ROUTE.z0 && z < ROUTE.z1) {
      if (x < ROUTE.x0) return ['#a8a59c', M.dalles];
      if (z > PARKING.z0 && z < PARKING.z1) return [bruitDoux(x, z, 4) > 0.5 ? '#6a6967' : '#636260', M.route];
      if (x < COUR.x1 + 0.05 && z > COUR.z0 && z < COUR.z1) return ['#b0aca2', M.dalles];
      return [bruitDoux(x, z, 4) > 0.5 ? '#6a6967' : '#636260', M.route];
    }
  }
  if (x > 222 && x < MUSEE.x1 + 1.5 && z > 78 && z < MUSEE.z1 + 2) return ['#a8a59c', M.dalles];
  if (x > 250 && x < 272 && z > -8 && z < 70) return ['#6a6967', M.route];
  if (x > GARE_H.x0 - 0.5 && x < 389 && z > 29 && z < 85) return ['#a8a59c', M.dalles];
  // au-delà des clôtures, la forêt de pins, le sous-bois ; le loin, la forêt vue d'en haut
  const b = bruitDoux(x, z, 7);
  if (x > 262 || x < -300 || z > 215 || (z > -90 && x > 240)) return [b > 0.55 ? '#3f5f3a' : '#4a6b3f', M.sousBois];
  // la plage : mouillée au bord de l'eau, une frange à peine plus sombre au bout des vagues
  const feston = 1.3 * Math.sin(x * 0.11 + 1.3 * Math.sin(x * 0.03)) + 0.9 * Math.sin(x * 0.27) + 1.6 * (b - 0.5);
  if (dc < 6.2 + feston) return [dc < 3.2 ? '#a08b64' : dc < 4.8 + feston * 0.5 ? '#ad9770' : '#baa47c', M.estran];
  if (dc < 8.2 + feston) return [sableDe(0.5 + 0.14 * b), M.sable];
  // l'herbe ; dehors, derrière les clôtures, un voile de verdure et le sous-bois
  const hors = !dansLeCadreLarge(x, z) || !dansPoly(BORD_SABLE, x, z);
  if (hors && z > -120 && dc > 40) {
    const d = distPoly(BORD_SABLE, x, z);
    if (d > 7) return [b > 0.55 ? '#46653c' : '#526f42', M.sousBois];
    if (d > 2.5) return [b > 0.5 ? '#8c9a5c' : '#7f9152', M.herbe];
  }
  // (les herbes : pas une pelouse ; le sable reste du sable, teinté de vert là où elles sont serrées, de plus en plus au cœur : les touffes sont du décor)
  const vert = herbeDes(x, z), b2 = bruitDoux(x + 31, z - 17, 4.5);
  if (vert > 0.04 && dc > 12) {
    const k = lisse(0.04, 0.52, vert + 0.22 * (b2 - 0.5));
    if (k > 0.02) return [VERDIS[Math.round(k * 15)], M.sable];
  }
  // le sable sec : plus clair sur les hauteurs ; plus foncé sur le bas de la grande pente au nord (humide), de longues taches
  const large = 0.5 + 0.5 * Math.sin(x * 0.021 + z * 0.017 + 0.9 * Math.sin(z * 0.013));
  const hN = lisse(2, 40, h);
  let t = 0.6 + 0.2 * hN + 0.07 * (b - 0.5) + 0.05 * (large - 0.5);
  if (dc < 26) t = melange(0.5, t, lisse(5, 26, dc));
  return [sableDe(t), M.sable];
}

/** Ce que le carnet et le menu savent du lieu, sans le construire. */
export const infos = {
  id: 'tottori', carte: 'tottori-sand-dunes', video: '7667635236829662486',
  nom: { en: 'Tottori Sand Dunes', fr: 'Dunes de Tottori', ja: '鳥取砂丘' }, nomJa: '鳥取砂丘',
  phrase: { fr: 'les dunes de Tottori', en: 'the Tottori Sand Dunes' },
  tampons: [
    { id: 'crete', motif: 'crete', ja: '馬の背', encre: '#b8862a' },
    { id: 'chameau', motif: 'chameau', ja: 'らくだ', encre: '#a8642a', forme: 'carre' },
    { id: 'planche', motif: 'planche', ja: 'サンドボード', encre: '#c0392b' },
    { id: 'musee', motif: 'sculpture', ja: '砂の美術館', encre: '#8a6a3a', forme: 'carre' },
    { id: 'oasis', motif: 'oasis', ja: 'オアシス', encre: '#1f6a9a' },
  ],
  get textes() { return TEXTES; },
};

/** La nuit : les fenêtres des boutiques s'allument. */
export const sortesNuit = (P) => ({ [P.shoji]: 'lumiere', [P.shojiCadre]: 'treillis' });

/** Monter une dune, le sable se dérobe : moins vite ; la descendre, un peu plus (dx, dz : où l'on va, unitaire). Pas sur l'escalier ni la route. */
function allure(x, z, dx, dz) {
  if (x > 192) return 1;
  const s = (terrain(x + dx * 0.8, z + dz * 0.8) - terrain(x, z)) / 0.8;
  return s > 0 ? 1 - 0.62 * Math.min(0.75, s) / 0.75 * (0.5 + 0.5 * Math.min(1, s / 0.3)) : 1 + 0.12 * Math.min(1, -s / 0.4);
}

export function construire(ctx) {
  const { THREE, atelier, P } = ctx;
  const objets = [], bancs = [], lumieres = [], animes = [], etiquettes = [], vapeurs = [];
  const monde = creerMonde({ terrain, cadre: dansLeCadre, profond: -0.55, pente: null });
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
  // le décor en morceaux (un objet chacun : la carte graphique dessine moins de petits objets ; hors de l'écran, ils ne se dessinent pas)
  const morceaux = new Map();
  const morceau = (x, z, taille = 50) => {
    const k = `${taille}:${Math.floor(x / taille)},${Math.floor(z / taille)}`;
    if (!morceaux.has(k)) morceaux.set(k, atelier());
    return morceaux.get(k);
  };
  const BETON = '#bdb8ad', BETON_F = '#a9a498', METAL = '#8e9398', TOLE = '#4d5257', VITRE = '#3d5560', ALU = '#c6cacb', PIN = '#3a5f33', PIN2 = '#2f5230', PIN3 = '#46693a', ECORCE = '#5a4636';

  // ---------------------------------------------------------------- Les clôtures de sable (堆砂垣)
  // Tout autour du sable, une seule clôture : des roseaux serrés entre deux lisses, sur des piquets, qui retiennent le sable (on en voit
  // tout le long du vrai, côté route et côté forêt). Dessinée 27 cm au-delà du cadre : le voyageur, un point, s'y arrête.
  const ROSEAUX = ['#b79a62', '#a58a54', '#c8ac74', '#94794a', '#bda56c'];
  const dehors = (x, z, nx, nz) => (dansPoly(BORD_SABLE, x + nx, z + nz) ? -1 : 1);
  const troncon = (x0, z0, x1, z1) => {
    const L = Math.hypot(x1 - x0, z1 - z0), ux = (x1 - x0) / L, uz = (z1 - z0) / L;
    let nx = -uz, nz = ux;
    const sg = dehors((x0 + x1) / 2, (z0 + z1) / 2, nx * 0.5, nz * 0.5);
    nx *= sg; nz *= sg;
    const n = Math.max(1, Math.round(L / 2));
    for (let k = 0; k < n; k++) {
      const f0 = k / n, f1 = (k + 1) / n;
      const ax = x0 + (x1 - x0) * f0 + nx * 0.27, az = z0 + (z1 - z0) * f0 + nz * 0.27, bx = x0 + (x1 - x0) * f1 + nx * 0.27, bz = z0 + (z1 - z0) * f1 + nz * 0.27;
      const a = morceau(ax, az), ya = terrain(ax, az), yb = terrain(bx, bz);
      // les roseaux : deux faces par roseau, leurs têtes inégales ; une couleur par roseau
      const pos = [], cols = [], m = 8;
      for (let j = 0; j < m; j++) {
        const t0 = (j + 0.06) / m, t1 = (j + 0.94) / m, tm = (t0 + t1) / 2;
        const sx0 = ax + (bx - ax) * t0, sz0 = az + (bz - az) * t0, sx1 = ax + (bx - ax) * t1, sz1 = az + (bz - az) * t1;
        const y0 = melange(ya, yb, t0) - 0.25, y1 = melange(ya, yb, t1) - 0.25, h = melange(ya, yb, tm) + 0.92 + 0.26 * hasard(sx0, sz0), mx = (sx0 + sx1) / 2 + nx * 0.03, mz = (sz0 + sz1) / 2 + nz * 0.03;
        pos.push(sx0, y0, sz0, sx1, y1, sz1, mx, h, mz, sx1, y1, sz1, sx0, y0, sz0, mx, h, mz);
        const c = ROSEAUX[Math.floor(hasard(sz0, sx0) * ROSEAUX.length)];
        cols.push(c, c);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      a.piece(g, ROSEAUX[0], { couleurs: cols, trait: false, nuance: 0.03, sorte: 'buisson' });
      // (une lisse devant, côté marcheur, et un piquet tous les deux tronçons)
      a.baton([ax - nx * 0.035, ya + 0.72, az - nz * 0.035], [bx - nx * 0.035, yb + 0.72, bz - nz * 0.035], 0.018, '#7f6a4a', 4, { trait: false });
      if (k % 2 === 0) a.baton([ax - nx * 0.05, ya - 0.3, az - nz * 0.05], [ax - nx * 0.05, ya + 1.12, az - nz * 0.05], 0.035, '#6f5a3e', 6);
    }
  };
  // (de la digue est à l'escalier ; de l'escalier à la gare du télésiège, qui prend sa place ; de là au sud, à l'ouest, jusqu'à la digue ouest)
  const CLOTURE = [[[226, -146], ...BORD_SABLE.slice(2, 7)], BORD_SABLE.slice(7, 9), [...BORD_SABLE.slice(9), [-238, -146]]];
  for (const L of CLOTURE) for (let i = 0; i + 1 < L.length; i++) troncon(L[i][0], L[i][1], L[i + 1][0], L[i + 1][1]);

  // ---------------------------------------------------------------- Les digues (消波ブロック) qui ferment la plage
  // Des blocs à quatre pieds, en deux rangs, de la dune jusque dans la mer : une à chaque bout (on voit la vraie au nord-est, avec ses brise-lames au large)
  const bloc = (a, x, y, z, s, g) => {
    const c = g > 0.66 ? '#b0afa6' : g > 0.33 ? '#a4a39a' : '#98978e', d = [[0, 1, 0], [0.94, -0.33, 0], [-0.47, -0.33, 0.82], [-0.47, -0.33, -0.82]];
    const ry = g * 6.28, rx = g * 3.1, cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
    let haut = null;
    for (const [u, v, w] of d) {
      const v2 = v * cx - w * sx, w2 = v * sx + w * cx, u3 = u * cy + w2 * sy, w3 = -u * sy + w2 * cy;
      a.fut([x, y, z], [x + u3 * s, y + v2 * s, z + w3 * s], 0.42 * s, 0.2 * s, c, 5, { teinte: (px, py) => (py < 0.55 ? '#5f6a60' : c) });
      if (!haut || y + v2 * s > haut.y) haut = { x: x + u3 * s, y: y + v2 * s, z: z + w3 * s };
    }
    return haut;
  };
  // (le bout du plus haut pied d'un bloc de chaque digue : une mouette s'y pose)
  const PERCHOIRS = [];
  for (const [x0, sens] of [[-238, -1], [226, 1]]) {
    for (let z = -124; z > -212; z -= 1.75) {
      const a = morceau(x0 + sens * 3, z), g = hasard(z, x0), sol = Math.max(-0.6, terrain(x0 + sens * 3, z));
      const fin = z < -196 ? 0.75 : 1;
      bloc(a, x0 + sens * (1.62 + 0.15 * g), sol + 0.55, z, 1.22 * fin, g);
      bloc(a, x0 + sens * (4.4 - 0.3 * g), sol + 0.55, z - 0.7, 1.22 * fin, hasard(g, z));
      if (z < -135 && z > -205 && Math.round(-z / 1.75) % 2 === 0) { const h = bloc(a, x0 + sens * 3.15, sol + 1.75, z - 0.35, 1.1, hasard(z, g)); if (Math.abs(z + 157.25) < 0.5) PERCHOIRS.push(h); }
    }
  }
  // les brise-lames au large, à l'est (de longs tas sombres : le vrai en a deux, devant la côte)
  { const a = morceau(400, -240, 200); for (const [x0, x1] of [[300, 420], [490, 620]]) for (let x = x0; x < x1; x += 3.4) a.ovale(2.4, hasard(x, 3) > 0.5 ? '#6e7068' : '#62645c', { x, y: 0.25, z: -232 + 2 * Math.sin(x * 0.03), sx: 1.5, sy: 0.95, sz: 1.5, trait: false }, 5); }

  // ---------------------------------------------------------------- La route, le trottoir, le mur de la berge, le passage piéton
  const decorRoute = atelier(), yR = Y_ROUTE;
  {
    const a = decorRoute, ligne = (x, z, l, p, c = '#e8e6dc') => a.boite(l, 0.012, p, c, { x, y: yR + 0.05, z, trait: false });
    // la ligne du milieu, les bords ; le passage piéton (devant l'escalier). Seulement là où il y a de la route (2026-11-03 : « tu as continué à rajouter des marquages… il y en a qui sont dans le vide ») :
    // jusqu'au tournant, au nord, puis vers l'est ; au sud, là où elle monte dans la forêt, à 6 %, ils la suivent
    for (let z = TOURNANT.z1 - 1; z < ROUTE.z1; z += 5) if (z < 30 || z > 44) ligne((ROUTE.x0 + ROUTE.x1) / 2, z + 1.25, 0.14, 2.5);
    for (let z = ROUTE.z1 + 4; z < ROUTE.z1 + 52; z += 5) a.boite(0.14, 0.012, 2.5, '#e8e6dc', { x: (ROUTE.x0 + ROUTE.x1) / 2, y: yR + (z + 1.25 - ROUTE.z1) * 0.06 + 0.05, z: z + 1.25, rx: -Math.atan(0.06), trait: false });
    for (let x = ROUTE.x1 + 3; x < TOURNANT.x1 - 2; x += 5) ligne(x + 1.25, (TOURNANT.z0 + TOURNANT.z1) / 2, 2.5, 0.14);
    for (const x of [ROUTE.x0 + 0.2, ROUTE.x1 - 0.2]) { ligne(x, -2, 0.12, 62); ligne(x, 90, 0.12, 84); }
    for (let k = 0; k < 7; k++) ligne(ROUTE.x0 + 0.6 + k * 1.14, 38, 0.52, 7.6);
    // le trottoir ouest, le mur bas de la berge (coupé à l'escalier)
    for (const [z0, z1] of [[TOURNANT.z0 - 0.7, ESC.z0], [ESC.z1, ROUTE.z1 + 8]]) {
      a.boite(1.2, 0.14, z1 - z0, '#b8b5ab', { x: 213.4, y: yR + 0.07, z: (z0 + z1) / 2, nuance: 0.02 });
      a.boite(0.3, 1.0, z1 - z0, BETON, { x: 212.45, y: yR + 0.44, z: (z0 + z1) / 2, nuance: 0.03 });
    }
    // (le tournant : le mur bas, le long du côté mer ; il cache la pente qui descend)
    a.boite(TOURNANT.x1 - 212.3, 1.0, 0.3, BETON, { x: (TOURNANT.x1 + 212.3) / 2, y: yR + 0.44, z: TOURNANT.z0 - 0.55, nuance: 0.03 });
    // le parking : ses places, côté boutiques ; une ligne le long de la route
    for (let z = PARKING.z0 + 6; z < PARKING.z1 - 3; z += 2.6) { ligne(246, z, 5.0, 0.1); ligne(232, z, 5.0, 0.1); }
    // des voitures garées (le reste du parking est libre)
    const garees = [[246, -14.5, 1, 'mono', '#e8eaec'], [246, -9.3, 1, 'kei', '#d8402c'], [246, 1.1, 1, 'berline', '#3a4a5a'], [246, 8.9, 1, 'kei', '#f4efe2'], [246, 14.1, 1, 'mono', '#a8b4bc'], [246, 24.5, 1, 'berline', '#f4f2ee'],
      [246, 40.1, 1, 'mono', '#2f3a4a'], [246, 47.9, 1, 'kei', '#8ac4a8'], [232, -16.9, -1, 'berline', '#c8c8c4'], [232, -6.5, -1, 'kei', '#e8c84a'], [232, 6.5, -1, 'mono', '#5a6a7a'], [232, 19.5, -1, 'berline', '#a83a3a'], [232, 53.1, -1, 'kei', '#f4efe2'], [232, 60.9, -1, 'berline', '#44546a']];
    for (const [x, z, sens, sorte, c] of garees) {
      const ry = sens > 0 ? PI / 2 : -PI / 2, R = repere(x, z, ry);
      voiture(THREE, a, R, yR, c, sorte);
      murRect(x, z, sorte === 'kei' ? 1.72 : sorte === 'berline' ? 2.18 : 2.35, sorte === 'kei' ? 0.78 : 0.92);
    }
    // les bouts de la route : une barrière rayée, dessinée 27 cm au-delà du cadre ; la forêt derrière
    for (const zb of [ROUTE.z0 - 0.27, 130.27]) {
      for (const x of [213.5, 221, 228]) a.boite(0.12, 0.9, 0.12, '#e8e6dc', { x, y: yR + 0.45, z: zb });
      for (const [x0, x1] of [[213.5, 221], [221, 228]]) {
        const n = Math.round((x1 - x0) / 0.8);
        for (let k = 0; k < n; k++) a.boite((x1 - x0) / n - 0.01, 0.2, 0.05, k % 2 ? '#d8402c' : '#f4f2ea', { x: x0 + ((k + 0.5) / n) * (x1 - x0), y: yR + 0.74, z: zb, trait: false });
      }
    }
    for (const [x0, x1] of [[228, 250]]) for (let x = x0 + 0.8; x < x1; x += 1.6) a.ovale(0.9, hasard(x, 2) > 0.5 ? '#4a7a3e' : '#3f6d38', { x, y: yR + 0.55, z: ROUTE.z0 - 0.95, sy: 0.85, sorte: 'buisson' }, 6);
    a.boite(0.12, 0.9, 0.12, '#e8e6dc', { x: 236, y: yR + 0.45, z: 130.27 });
    for (let k = 0; k < 10; k++) a.boite(0.79, 0.2, 0.05, k % 2 ? '#d8402c' : '#f4f2ea', { x: 228 + (k + 0.5) * 0.8, y: yR + 0.74, z: 130.27, trait: false });
  }
  poser(decorRoute.fin(), 0, 0, { y: 0 });

  // ---------------------------------------------------------------- L'escalier de l'entrée (砂丘入口階段)
  {
    const a = atelier(), n = ESC.n, giron = (ESC.x1 - ESC.x0) / n, h = (ESC.y1 - ESC.y0) / n, zm = (ESC.z0 + ESC.z1) / 2, W = ESC.z1 - ESC.z0 + 0.02;
    for (let k = 0; k < n; k++) {
      const x = ESC.x1 - (k + 0.5) * giron, y = ESC.y0 + (k + 1) * h, wk = W + (k % 2 ? 0.012 : 0);
      a.boite(giron + 0.012, 0.8, wk, k % 10 === 9 ? '#a8a59c' : BETON, { x, y: y - 0.4 + 0.012, z: zm, nuance: 0.02 });
      a.boite(0.05, 0.012, wk + 0.01, '#8c8a80', { x: x + giron / 2 - 0.03, y: y + 0.018, z: zm, trait: false });
    }
    // le palier en haut, puis la dalle qui disparaît sous le sable
    a.boite(PALIER.x1 - PALIER.x0 + 0.5, 0.5, W, BETON, { x: (PALIER.x0 + PALIER.x1) / 2 + 0.2, y: ESC.y1 - 0.22, z: zm, nuance: 0.02 });
    // les rampes, de chaque côté, et celle du milieu
    const rampe = (z) => {
      a.baton([ESC.x1 - 0.1, ESC.y0 + 0.9, z], [ESC.x0, ESC.y1 + 0.9, z], 0.028, ALU, 6).baton([ESC.x0, ESC.y1 + 0.9, z], [PALIER.x0 + 0.4, ESC.y1 + 0.9, z], 0.028, ALU, 6);
      for (let k = 0; k <= 6; k++) { const f = k / 6, x = ESC.x1 - 0.1 + (ESC.x0 - ESC.x1 + 0.1) * f, y = ESC.y0 + (ESC.y1 - ESC.y0) * f; a.baton([x, y - 0.1, z], [x, y + 0.9, z], 0.02, ALU, 5); }
      a.baton([PALIER.x0 + 0.4, ESC.y1 - 0.1, z], [PALIER.x0 + 0.4, ESC.y1 + 0.9, z], 0.02, ALU, 5);
    };
    rampe(ESC.z0 - 0.02); rampe(ESC.z1 + 0.02);
    poser(a.fin(), 0, 0, { y: 0 });
    monde.rampe(ESC.x0, ESC.x1, ESC.z0, ESC.z1, 'x', ESC.y1, ESC.y0, { sol: 'pierre' });
    monde.surface(PALIER.x0, ESC.x0, ESC.z0, ESC.z1, ESC.y1 + 0.03, { sol: 'pierre' });
    for (const z of [ESC.z0 - 0.02, ESC.z1 + 0.02]) { monde.mur(PALIER.x0 + 0.4, z, ESC.x1, z, 0.27); }
    // (la rampe du milieu : une main courante qu'on contourne)
    const am = atelier(), yy = (x) => ESC.y0 + (ESC.y1 - ESC.y0) * Math.min(1, (ESC.x1 - x) / (ESC.x1 - ESC.x0));
    am.baton([ESC.x1 - 0.4, yy(ESC.x1 - 0.4) + 0.9, zm], [ESC.x0 + 0.3, yy(ESC.x0 + 0.3) + 0.9, zm], 0.024, ALU, 6);
    for (let k = 0; k <= 6; k++) { const x = ESC.x1 - 0.4 + (ESC.x0 + 0.7 - ESC.x1) * (k / 6); am.baton([x, yy(x) - 0.05, zm], [x, yy(x) + 0.9, zm], 0.018, ALU, 5); }
    poser(am.fin(), 0, 0, { y: 0 });
    monde.mur(ESC.x1 - 0.4, zm, ESC.x0 + 0.3, zm, 0.16);
    // la plaque de l'entrée, en bas à droite (鳥取砂丘), sur son socle de béton
    const b = atelier(), xp = 213.2, zp = ESC.z1 + 1.2;
    b.boite(0.5, 1.1, 2.2, BETON_F, { x: xp - 0.3, y: yR + 0.55, z: zp, nuance: 0.03 }).boite(0.06, 0.8, 1.9, '#3a342c', { x: xp - 0.02, y: yR + 0.66, z: zp });
    poser(b.fin(), 0, 0, { y: 0 });
    ecrire({ x: xp + 0.012, y: yR, z: zp, ry: PI / 2 }, { texte: '鳥取砂丘', sous: 'Tottori Sand Dunes', x: 0, y: 0.68, z: 0, l: 1.7, h: 0.66, fond: null, encre: '#f4e6c4' });
    monde.mur(xp - 0.3, zp - 1.1, xp - 0.3, zp + 1.1, 0.5);
  }

  // ---------------------------------------------------------------- L'arrêt du bus (le départ)
  {
    const a = atelier(), xa = 224.2, za = 33.2, F = yR + 0.02;
    a.boite(4.2, 0.08, 1.6, '#5a6a72', { x: xa + 0.6, y: F + 2.42, z: za, nuance: 0.03 });
    for (const dz of [-0.6, 0.6]) for (const dx of [-1.3, 2.5]) a.boite(0.08, 2.4, 0.08, METAL, { x: xa + dx, y: F + 1.2, z: za + dz });
    a.boite(3.8, 1.5, 0.05, VITRE, { x: xa + 0.6, y: F + 1.45, z: za - 0.72, trait: false });
    a.boite(2.8, 0.06, 0.4, '#8a6a48', { x: xa + 0.6, y: F + 0.46, z: za - 0.42 }).boite(0.08, 0.46, 0.3, METAL, { x: xa - 0.5, y: F + 0.23, z: za - 0.42 }).boite(0.08, 0.46, 0.3, METAL, { x: xa + 1.7, y: F + 0.23, z: za - 0.42 });
    a.baton([xa - 1.8, F, za + 1.5], [xa - 1.8, F + 2.5, za + 1.5], 0.04, METAL, 6).ovale(0.34, '#e8e6dc', { x: xa - 1.8, y: F + 2.7, z: za + 1.5, sz: 0.1, ry: PI / 2 }, 12);
    poser(a.fin(), 0, 0, { y: 0 });
    ecrire({ x: xa - 1.84, y: F, z: za + 1.5, ry: -PI / 2 }, { texte: '砂丘入口', x: 0, y: 2.7, z: 0, l: 0.52, h: 0.2, fond: null, encre: '#2a3a5a' });
    ecrire({ x: xa - 1.76, y: F, z: za + 1.5, ry: PI / 2 }, { texte: '砂丘入口', x: 0, y: 2.7, z: 0, l: 0.52, h: 0.2, fond: null, encre: '#2a3a5a' });
    // (le dos à la vitre ; la caméra devant, puisque derrière il y a la vitre)
    bancs.push({ de: [xa - 0.5, za - 0.42], a: [xa + 1.7, za - 0.42], y: F + 0.49, cap: 0, vue: PI - 0.45 });
    monde.mur(xa - 1.0, za - 0.56, xa + 2.2, za - 0.56, 0.58);
    monde.mur(xa - 1.3, za - 0.72, xa + 2.5, za - 0.72, 0.28);
    monde.cercle(xa - 1.8, za + 1.5, 0.27);
    for (const dz of [0.6]) for (const dx of [-1.3, 2.5]) monde.cercle(xa + dx, za + dz, 0.3);
    monde.toit(xa - 1.5, xa + 2.7, za - 0.8, za + 0.8, F + 2.38, F + 2.5);
  }

  // ---------------------------------------------------------------- Les bâtiments du bord de la route, leurs devantures vers l'ouest (x = 250)
  const F = Y_ROUTE + 0.02, PLAFOND = 3.3;
  const haie = (x0, z0, x1, z1) => {
    const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(2, Math.round(L / 1.25));
    for (let k = 0; k <= n; k++) { const x = x0 + ((x1 - x0) * k) / n, z = z0 + ((z1 - z0) * k) / n; morceau(x, z).ovale(0.82 + 0.16 * hasard(x, z), hasard(z, x) > 0.5 ? '#4a7a3e' : '#3f6d38', { x, y: F + 0.6, z, sy: 0.92, sorte: 'buisson' }, 6); }
  };
  haie(251, -11.6, 251, -8.6); haie(251, 30.6, 251, 32.6); haie(251, 47.6, 251, 49.6); haie(251, 64.6, 251, 79.6); haie(236.5, 80.9, 250.5, 80.9);

  /** Un distributeur de boissons, sa face vers −x, en x, z. */
  const distributeur = (a, x, z, c) => {
    a.boite(0.72, 1.82, 1.05, c, { x: x + 0.36, y: F + 0.91, z, nuance: 0.03 }).boite(0.02, 0.86, 0.8, '#dfe9f0', { x: x - 0.012, y: F + 1.28, z, sorte: 'lumiere', trait: false });
    for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) a.boite(0.015, 0.17, 0.08, ['#d8402c', '#2f6ab0', '#f2c443', '#3a8a5a', '#f4efe2', '#e88a3a'][(k + r * 2) % 6], { x: x - 0.024, y: F + 1.0 + r * 0.26, z: z - 0.32 + k * 0.128, trait: false });
    a.boite(0.015, 0.16, 0.62, '#2a2a30', { x: x - 0.012, y: F + 0.36, z, trait: false });
    murRect(x + 0.36, z, 0.36, 0.53);
  };

  // ---- Le Sakyu Kaikan (砂丘会館) : un long bâtiment à deux niveaux, son grand auvent, sa porte au milieu ; dedans, les souvenirs au nord, le restaurant au sud
  const K = SALLE;
  {
    const a = atelier(), xf = 250.32, xb = 272, z0 = -8, z1 = 30, H1 = 3.6, H2 = 6.8, M1 = '#efe8d8', M2 = '#d8d2c2';
    // le dehors : le bas des murs, plein jusqu'au nu de l'étage ; les poteaux de la façade, les vitrines sombres, le mur du haut et sa bande de fenêtres, le toit plat, l'acrotère
    // (2026-11-03, « tout autour il y a une surface qui scintille », vue du télésiège : un socle posé à la hauteur exacte du sol dessiné, tout autour des murs, 70 cm en retrait sous l'étage qui semblait flotter)
    a.boite(xb - 0.02 - K.x1 - 0.16, H1 + 0.08, z1 - z0 - 0.04, M2, { x: (xb - 0.02 + K.x1 + 0.16) / 2, y: F + (H1 + 0.08) / 2 - 0.06, z: (z0 + z1) / 2, nuance: 0.02 });
    for (const [za, zb] of [[z0 + 0.02, K.z0 - 0.16], [K.z1 + 0.16, z1 - 0.02]]) a.boite(K.x1 + 0.16 - xf - 0.02, H1 + 0.08, zb - za, M2, { x: (xf + 0.02 + K.x1 + 0.16) / 2, y: F + (H1 + 0.08) / 2 - 0.06, z: (za + zb) / 2, nuance: 0.02 });
    for (let z = z0; z <= z1 + 0.01; z += 6.33) a.boite(0.34, H1, 0.42, M2, { x: xf + 0.17, y: F + H1 / 2, z });
    for (const [za, zb] of [[z0 + 0.2, K.porte.z0 - 0.08], [K.porte.z1 + 0.08, z1 - 0.2]]) {
      a.boite(0.05, 2.5, zb - za, VITRE, { x: xf + 0.22, y: F + 1.3, z: (za + zb) / 2, trait: false }).boite(0.1, 0.1, zb - za, ALU, { x: xf + 0.2, y: F + 2.6, z: (za + zb) / 2, trait: false }).boite(0.1, 0.1, zb - za, ALU, { x: xf + 0.2, y: F + 0.08, z: (za + zb) / 2, trait: false });
      for (let z = za; z <= zb + 0.01; z += 1.6) a.boite(0.08, 2.5, 0.06, ALU, { x: xf + 0.2, y: F + 1.3, z, trait: false });
    }
    a.boite(xb - xf, H2 - H1, z1 - z0, M1, { x: (xf + xb) / 2, y: F + (H1 + H2) / 2, z: (z0 + z1) / 2, nuance: 0.02 });
    a.boite(0.04, 1.2, z1 - z0 - 2, '#6d8a96', { x: xf - 0.018, y: F + H1 + 1.25, z: (z0 + z1) / 2, trait: false });
    for (let z = z0 + 1; z <= z1 - 0.99; z += 2.4) a.boite(0.08, 1.3, 0.1, ALU, { x: xf - 0.03, y: F + H1 + 1.25, z, trait: false });
    a.boite(xb - xf + 0.4, 0.36, z1 - z0 + 0.4, '#8a8d8e', { x: (xf + xb) / 2, y: F + H2 + 0.17, z: (z0 + z1) / 2 });
    // le grand auvent et ses poteaux
    a.boite(3.0, 0.22, z1 - z0 + 1, '#5e6468', { x: xf - 1.4, y: F + 3.05, z: (z0 + z1) / 2, nuance: 0.02 }).boite(3.02, 0.08, z1 - z0 + 1.02, '#d8402c', { x: xf - 1.4, y: F + 2.9, z: (z0 + z1) / 2, trait: false });
    for (let z = z0 + 0.5; z <= z1; z += 12.66) { a.baton([xf - 2.6, F, z], [xf - 2.6, F + 2.95, z], 0.075, '#6a6e72', 8); monde.cercle(xf - 2.6, z, 0.36); }
    // l'enseigne en haut, l'enseigne de la porte
    a.boite(0.2, 1.0, 9.4, '#b8362a', { x: xf + 1.2, y: F + H2 + 0.85, z: (z0 + z1) / 2 + 2, nuance: 0.03 });
    for (const dz of [-3.6, 3.6]) a.boite(0.16, 0.5, 0.16, METAL, { x: xf + 1.25, y: F + H2 + 0.3, z: (z0 + z1) / 2 + 2 + dz });
    ecrire({ x: xf + 1.09, y: F, z: (z0 + z1) / 2 + 2, ry: -PI / 2 }, { texte: '砂丘会館', sous: 'Sakyu Kaikan', x: 0, y: H2 + 0.85, z: 0, l: 8.8, h: 0.92, fond: null, encre: '#f8f2e2' });
    a.boite(0.05, 0.42, 3.4, '#2a4a7a', { x: xf - 0.06, y: F + 2.72, z: (K.porte.z0 + K.porte.z1) / 2, trait: false });
    ecrire({ x: xf - 0.09, y: F, z: (K.porte.z0 + K.porte.z1) / 2, ry: -PI / 2 }, { texte: 'お食事・おみやげ', x: 0, y: 2.72, z: 0, l: 3.1, h: 0.36, fond: null, encre: '#f8f2e2' });
    // le dedans : le carrelage, les murs, le plafond et ses longues lampes
    a.boite(K.x1 - K.x0 + 0.1, 0.05, K.z1 - K.z0 + 0.1, '#c8bfa8', { x: (K.x0 + K.x1) / 2, y: F + 0.01, z: (K.z0 + K.z1) / 2, nuance: 0.03, trait: false });
    monde.surface(K.x0 - 0.8, K.x1, K.z0, K.z1, F + 0.035, { sol: 'pierre' });
    a.boite(K.x1 - K.x0 + 0.1, 0.05, K.z1 - K.z0 + 0.1, '#e8e2d2', { x: (K.x0 + K.x1) / 2, y: F + PLAFOND, z: (K.z0 + K.z1) / 2, trait: false });
    a.boite(0.12, PLAFOND, K.z1 - K.z0 + 0.2, '#eae4d2', { x: K.x1 + 0.1, y: F + PLAFOND / 2, z: (K.z0 + K.z1) / 2, trait: false });
    for (const [z, s] of [[K.z0 - 0.1, 1], [K.z1 + 0.1, -1]]) a.boite(K.x1 - K.x0 + 0.2, PLAFOND, 0.12, '#eae4d2', { x: (K.x0 + K.x1) / 2, y: F + PLAFOND / 2, z, trait: false });
    for (const [za, zb] of [[K.z0, K.porte.z0 - 0.1], [K.porte.z1 + 0.1, K.z1]]) a.boite(0.1, 0.55, zb - za, '#d8d2c2', { x: K.x0 - 0.22, y: F + 0.28, z: (za + zb) / 2, trait: false });
    for (let x = K.x0 + 2.5; x < K.x1; x += 5.2) for (let z = K.z0 + 3.2; z < K.z1; z += 7) a.boite(1.5, 0.03, 0.18, '#fff8ea', { x, y: F + PLAFOND - 0.03, z, sorte: 'lumiere', trait: false });
    // la cloison entre les souvenirs et le restaurant
    a.boite(14.2, 2.6, 0.14, '#b89a74', { x: K.x1 - 7.1, y: F + 1.3, z: 12.8, nuance: 0.03 });
    monde.mur(K.x1 - 14.2, 12.8, K.x1 + 0.1, 12.8, 0.34);
    // ---- les souvenirs, au nord (creerMagasin) : six tables, les étagères tout autour, les peluches, les chapeaux, les tee-shirts, les cartes postales, le frigo, le comptoir et la caisse
    const bK = atelier(), mK = creerMagasin(THREE, bK, { ecrire, murRect, F });
    mK.etagere(253.5, K.z0 + 0.32, 0, 3.7, [['usagi', 'nashi', 'daisen'], ['kani', 'sakyu'], ['sable', 'ika', 'sable'], ['peluche']], 'お菓子', '#a83a2a');
    mK.etagere(257.4, K.z0 + 0.32, 0, 3.7, [['nashi', 'usagi', 'nashi'], ['sakyu', 'kani'], ['daisen', 'usagi', 'daisen'], ['ika', 'sable', 'ika']], '鳥取銘菓', '#2f6a4a');
    mK.etagere(261.3, K.z0 + 0.32, 0, 3.7, [['rakkyo', 'rakkyo'], ['rakkyo', 'jus'], ['chuhai', 'jus'], ['kani', 'kani']], '鳥取の味', '#2a4a7a');
    mK.etagere(265.2, K.z0 + 0.32, 0, 3.7, [['peluche'], ['peluche'], ['usagi', 'sakyu', 'daisen'], ['sable', 'ika']], '砂丘みやげ', '#a86a2a');
    mK.etagere(K.x1 - 0.32, -4, -PI / 2, 5.4, [['kani', 'sakyu', 'kani'], ['nashi', 'usagi', 'daisen', 'nashi'], ['sable', 'ika', 'sable', 'ika'], ['rakkyo', 'rakkyo', 'rakkyo']], 'おみやげ', '#a83a2a');
    mK.etagere(K.x1 - 0.32, 0.9, -PI / 2, 3.8, [['jus', 'chuhai'], ['chuhai', 'jus'], ['rakkyo', 'rakkyo'], ['peluche']], '鳥取の味', '#2a4a7a');
    for (const [xt, zt, b0, h0, b1] of [[255.2, -2.9, ['usagi', 'nashi'], ['usagi', 'daisen'], ['nashi', 'usagi']], [259.6, -2.9, ['kani', 'sakyu'], ['kani'], ['sakyu', 'kani']], [264, -2.9, ['daisen', 'nashi'], ['sable', 'ika'], ['usagi', 'daisen']], [255.2, 1.7, ['sakyu', 'usagi'], ['rakkyo'], ['usagi', 'sakyu']], [259.6, 1.7, ['nashi', 'daisen'], ['usagi', 'nashi'], ['daisen', 'nashi']], [264, 1.7, ['kani', 'ika'], ['chuhai', 'jus'], ['ika', 'kani']]]) mK.table(xt, zt, 3.1, 1.5, b0, h0, b1);
    mK.panier(252.2, -2.6); mK.panier(252.2, 3.6, 5);
    mK.chapeaux(252.2, 0.6);
    mK.cartes(252.4, 11.2);
    mK.portant(261, 12.1, 0, 3.4);
    mK.portant(255.6, 12.0, 0, 1.8);
    mK.frigo(269.9, 11.9, PI, 1.5);
    mK.caisse(266.3, 7.3, 4.6);
    for (const [x, z, t, c] of [[255.2, -5.0, 'お菓子', '#a83a2a'], [259.6, 0, 'おみやげ', '#2f6a4a'], [264, -5.0, '松葉がに', '#c8402c'], [255.2, 4.2, 'らくだ', '#a86a2a'], [264, 4.2, '二十世紀梨', '#6a8a3a']]) mK.banniere(x, z, 0, PLAFOND, t, c);
    // (derrière la caisse : un écriteau)
    bK.boite(0.04, 0.4, 2.2, '#f4efe2', { x: 270.6, y: F + 2.3, z: 7.2 });
    ecrire({ x: 270.56, y: F, z: 7.2, ry: -PI / 2 }, { texte: 'らっきょう・松葉がに', x: 0, y: 2.3, z: 0, l: 2.0, h: 0.32, fond: null, encre: '#2a2420' });
    // ---- le restaurant, au sud : les tables et leurs chaises, le comptoir de la cuisine, la carte
    const table = (xt, zt, g) => {
      a.boite(1.3, 0.05, 0.8, '#6e4a2c', { x: xt, y: F + 0.72, z: zt }).baton([xt, F, zt], [xt, F + 0.7, zt], 0.05, '#3a3a40', 6);
      for (const dz of [-0.62, 0.62]) for (const dx of [-0.34, 0.34]) { a.boite(0.36, 0.05, 0.36, '#c8402c', { x: xt + dx, y: F + 0.44, z: zt + dz }).baton([xt + dx, F, zt + dz], [xt + dx, F + 0.42, zt + dz], 0.025, '#3a3a40', 5); }
      // (la bouteille de sauce, le présentoir de la carte)
      a.cylindre(0.05, 0.05, 0.12, 8, '#3a5a7a', { x: xt - 0.42, y: F + 0.81, z: zt }).boite(0.18, 0.02, 0.12, '#f4efe2', { x: xt + 0.45, y: F + 0.755, z: zt - 0.15, trait: false });
      murRect(xt, zt, 0.65, 0.8);
    };
    for (const [xt, zt] of [[255.2, 16.2], [259.6, 16.2], [255.2, 21.6], [259.6, 21.6], [255.2, 27], [259.6, 27]]) table(xt, zt);
    // (les couverts, là où des gens mangent, et sur quelques tables encore)
    for (const [x, z, d, c] of [[254.86, 16.2, -1, '#e8c88a'], [255.54, 16.2, 1, '#d8603a'], [259.94, 21.6, 1, '#e8c88a'], [259.26, 21.6, -1, '#f4e8c8'], [255.2, 27, -1, '#d8603a']]) mK.couvert(x, F + 0.745, z, d * 0.8, '#f4efe2', c);
    a.boite(0.9, 0.92, 15.4, '#8a5f3c', { x: 264.4, y: F + 0.46, z: 21, nuance: 0.03 }).boite(1.02, 0.05, 15.5, '#5e4028', { x: 264.4, y: F + 0.945, z: 21 });
    // (le passe-plat : ses plats qui attendent, son noren, les bouteilles derrière)
    for (const z of [17.2, 19.6, 22, 24.4]) mK.couvert(264.3, F + 0.97, z, 0.3, '#f4efe2', z % 2 > 1 ? '#d8603a' : '#e8c88a');
    for (let k = 0; k < 5; k++) { const z = 15.6 + k * 2.6; bK.boite(0.012, 0.62, 1.22, k % 2 ? '#2a4a7a' : '#2f5a8a', { x: 264.1, y: F + PLAFOND - 0.33, z, nuance: 0.02 }); }
    ecrire({ x: 264.09, y: F, z: 21, ry: -PI / 2 }, { texte: '砂丘会館 食堂', x: 0, y: PLAFOND - 0.33, z: 0, l: 3.2, h: 0.4, fond: null, encre: '#f4f2e8' });
    for (let k = 0; k < 14; k++) bK.cylindre(0.035, 0.04, 0.26, 7, ['#7a3a26', '#3a5a3a', '#c8a84a'][k % 3], { x: 271.0, y: F + 1.24, z: 15.4 + k * 0.8, trait: false });
    bK.boite(0.3, 0.03, 11.6, '#6e4a2c', { x: 271.02, y: F + 1.1, z: 20.6, trait: false });
    mK.frigo(252.0, 13.8, PI / 2, 1.1);
    mK.banniere(257.4, 13.6, 0, PLAFOND, 'かにめし', '#c8402c'); mK.banniere(257.4, 24.3, 0, PLAFOND, '鳥取ラーメン', '#2a4a7a');
    murRect(264.4, 21, 0.51, 7.75);
    a.boite(2.2, 0.76, 11, '#b8bcc0', { x: 269.8, y: F + 0.38, z: 21, nuance: 0.03 }).boite(2.24, 0.04, 11.1, '#dfe3e6', { x: 269.8, y: F + 0.78, z: 21 });
    a.cylindre(0.28, 0.26, 0.4, 14, '#a9aeb3', { x: 269.4, y: F + 1.0, z: 19 }).cylindre(0.29, 0.29, 0.03, 14, '#8a9096', { x: 269.4, y: F + 1.21, z: 19 });
    vapeurs.push({ x: 269.4, z: 19, y: F + 1.26, n: 3, haut: 0.9, large: 0.1, taille: 0.22 });
    for (const [zc, t] of [[14.4, 'かにめし'], [15.4, 'いか丼'], [16.4, 'らっきょう'], [17.4, '海鮮丼'], [18.4, '牛骨ラーメン'], [19.4, '大山どり'], [20.4, 'コーヒー'], [21.4, 'ソフトクリーム']]) { a.boite(0.02, 0.74, 0.36, '#eadfc4', { x: 271.14, y: F + 2.1, z: zc, trait: false }); ecrire({ x: 271.12, y: F, z: zc, ry: -PI / 2 }, { texte: t, vertical: true, x: 0, y: 2.1, z: 0, l: 0.26, h: 0.64, fond: null, encre: '#2a2420' }); }
    // (le plafond : la caméra se rapproche)
    monde.toit(K.x0 - 0.2, K.x1 + 0.2, K.z0 - 0.2, K.z1 + 0.2, F + PLAFOND - 0.02, F + H2 + 0.3);
    monde.toit(xf - 2.9, xf + 0.1, z0 - 0.5, z1 + 0.5, F + 2.85, F + 3.2);
    // deux distributeurs, contre un poteau de la façade
    distributeur(a, xf - 0.72, 23.6, '#d8402c'); distributeur(a, xf - 0.72, 24.9, '#2f6ab0');
    // (aucune ombre du dehors dans la salle : le plancher du haut couvrait tout ; le dedans, seulement la caméra dans la salle ou sur le parking)
    poser(a.fin(), 0, 0, { y: 0, recoit: false });
    poser(bK.fin(), 0, 0, { y: 0, recoit: false, dedans: [224, 276, -22, 44] });
    // (le dos à la façade ; la caméra devant, sinon elle serait dans le mur)
    bancs.push({ de: [xf - 0.45, -6.3], a: [xf - 0.45, -2.3], y: F + 0.46, cap: -PI / 2, vue: PI - 0.4 });
    const b = atelier();
    b.boite(0.4, 0.06, 4, '#8a6a48', { x: xf - 0.45, y: F + 0.44, z: -4.3 }).boite(0.32, 0.42, 0.08, METAL, { x: xf - 0.45, y: F + 0.21, z: -6 }).boite(0.32, 0.42, 0.08, METAL, { x: xf - 0.45, y: F + 0.21, z: -2.6 });
    poser(b.fin(), 0, 0, { y: 0 });
    murRect(xf - 0.45, -4.3, 0.2, 2.0);
  }

  // ---- la らくだや : la boutique du chamelier, ouverte sur le parking, un chameau de bois peint sur son toit ; et 砂丘フレンド, son auvent rayé
  const boutique = (z0, z1, enseigne, fond, encre, raye, g) => {
    const a = atelier(), xf = 250.32, xb = 262, zc = (z0 + z1) / 2, L = z1 - z0, H = 3.3;
    a.boite(xb - xf, 1.4, L, '#ece4d0', { x: (xf + xb) / 2, y: F + H + 0.7, z: zc, nuance: 0.02 });
    a.boite(xb - xf + 0.4, 0.26, L + 0.4, '#6e6c68', { x: (xf + xb) / 2, y: F + H + 1.52, z: zc });
    a.boite(0.2, H, L - 0.05, '#d8d0bc', { x: xb - 0.1, y: F + H / 2, z: zc, trait: false });
    for (const z of [z0 + 0.14, z1 - 0.14]) a.boite(xb - xf, H, 0.28, '#d8d0bc', { x: (xf + xb) / 2, y: F + H / 2, z });
    a.boite(xb - xf - 0.2, 0.04, L - 0.5, '#e8e2d2', { x: (xf + xb) / 2, y: F + H - 0.02, z: zc, trait: false });
    a.boite(xb - xf - 0.2, 0.08, L - 0.5, '#c8bfa8', { x: (xf + xb) / 2 + 0.05, y: F + 0.0, z: zc, trait: false });
    // le comptoir, tout le long, ouvert au-dessus ; les étagères du fond ; l'enseigne ; l'auvent de toile
    a.boite(0.7, 0.86, L - 0.6, '#8a5f3c', { x: xf + 0.42, y: F + 0.43, z: zc, nuance: 0.03 }).boite(0.8, 0.05, L - 0.56, '#5e4028', { x: xf + 0.42, y: F + 0.885, z: zc });
    // (sur le comptoir : des boîtes bien rangées, le même produit ensemble ; derrière, les étagères ; au plafond, les bannières ; dans le fond, un frigo)
    const bB = atelier(), mB = creerMagasin(THREE, bB, { ecrire, murRect: () => {}, F }), LISTE = g === 3 ? ['usagi', 'nashi', 'sakyu', 'kani', 'rakkyo'] : ['sakyu', 'ika', 'daisen', 'jus', 'peluche'];
    // (dans le repère de ces rangées : le long de z, leur face vers la devanture, à l'ouest)
    const Qc = mB.repere(xf + 0.42, z0, -PI / 2), Qe = mB.repere(xb - 0.5, z0, -PI / 2);
    LISTE.forEach((id, k) => {
      const [s, c, c2] = mB.P[id], lz = (L - 1) / LISTE.length;
      mB.rangee(Qc, s, 0.5 + k * lz + 0.04, 0.5 + (k + 1) * lz - 0.04, F + 0.91, 0, 1, 1, c, c2);
    });
    for (let k = 0; k < 3; k++) {
      a.boite(0.5, 0.04, L - 1, '#7a5a3c', { x: xb - 0.5, y: F + 0.8 + k * 0.62, z: zc });
      const L2 = g === 3 ? [['usagi', 'nashi', 'kani'], ['peluche', 'peluche'], ['rakkyo', 'jus', 'sakyu']] : [['sakyu', 'daisen', 'ika'], ['chuhai', 'jus', 'jus'], ['peluche', 'peluche']];
      L2[k].forEach((id, j) => {
        const [s, c, c2] = mB.P[id], lz = (L - 1.2) / L2[k].length;
        mB.rangee(Qe, s, 0.6 + j * lz + 0.04, 0.6 + (j + 1) * lz - 0.04, F + 0.825 + k * 0.62, 0, 1, s === 'boite' ? 3 : s === 'grande' ? 2 : 1, c, c2);
      });
    }
    mB.frigo(xb - 1.5, z0 + 0.72, 0, 1.1);
    for (let k = 0; k < 2; k++) mB.banniere(xf + 2.2, z0 + (L * (k + 1)) / 3, PI / 2, H, g === 3 ? ['らくだ', 'ソフトクリーム'][k] : ['サンドボード', '砂丘みやげ'][k], k ? '#2f6a9a' : '#c8402c');
    poser(bB.fin(), 0, 0, { y: 0, recoit: false, dedans: [224, 268, 22, 74] });
    a.boite(0.1, 0.95, L - 0.3, fond, { x: xf - 0.05, y: F + H + 0.6, z: zc, nuance: 0.02 });
    ecrire({ x: xf - 0.108, y: F, z: zc, ry: -PI / 2 }, { texte: enseigne, x: 0, y: H + 0.6, z: 0, l: L - 1.2, h: 0.8, fond: null, encre });
    const n = Math.round(L / 0.7), pos = [], cols = [], y0 = F + H - 0.05, y1 = F + 2.45, x0 = xf + 0.02, x1 = xf - 1.5;
    for (let k = 0; k < n; k++) {
      const za = z0 + 0.2 + (k / n) * (L - 0.4), zb = z0 + 0.2 + ((k + 1) / n) * (L - 0.4);
      pos.push(x0, y0, za, x1, y1, za, x0, y0, zb, x0, y0, zb, x1, y1, za, x1, y1, zb, x0, y0 - 0.02, za, x0, y0 - 0.02, zb, x1, y1 - 0.02, za, x0, y0 - 0.02, zb, x1, y1 - 0.02, zb, x1, y1 - 0.02, za);
      const c = k % 2 ? raye[0] : raye[1];
      cols.push(c, c, c, c);
    }
    const toile = new THREE.BufferGeometry();
    toile.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    a.piece(toile, raye[0], { couleurs: cols, nuance: 0.01 });
    a.baton([x1, F, z0 + 0.3], [x1, y1, z0 + 0.3], 0.035, METAL, 6).baton([x1, F, z1 - 0.3], [x1, y1, z1 - 0.3], 0.035, METAL, 6);
    monde.cercle(x1, z0 + 0.3, 0.3); monde.cercle(x1, z1 - 0.3, 0.3);
    monde.toit(x1, xf + 0.05, z0 + 0.1, z1 - 0.1, y1 - 0.02, y0 + 0.1);
    poser(a.fin(), 0, 0, { y: 0, recoit: false });
  };
  boutique(33, 47, 'らくだや', '#7a3a26', '#f8e8c8', ['#c8402c', '#f4efe2'], 3);
  boutique(50, 64, '砂丘フレンド', '#2f6a8a', '#f4f4ea', ['#2f6a9a', '#f4efe2'], 11);
  // (un camelot : sur le trottoir devant la らくだや, un grand chameau de bois, à côté duquel on se fait photographier)
  {
    const a = atelier(), xc = 249.4, zc = 48.5, R = repere(xc, zc, -PI / 2);
    a.boite(1.6, 0.14, 0.7, '#8a6a48', R(0, F + 0.07, 0));
    a.ovale(0.5, '#c89a5a', R(0, F + 0.92, 0, { sx: 1.5, sy: 0.72, sz: 0.62 }), 10).ovale(0.3, '#b98a4a', R(-0.28, F + 1.26, 0, { sx: 0.9, sy: 0.85, sz: 0.8 }), 8).ovale(0.3, '#b98a4a', R(0.3, F + 1.26, 0, { sx: 0.9, sy: 0.85, sz: 0.8 }), 8);
    for (const [dx, dz] of [[-0.5, -0.18], [-0.5, 0.18], [0.5, -0.18], [0.5, 0.18]]) a.boite(0.12, 0.62, 0.12, '#a87a44', R(dx, F + 0.42, dz));
    a.boite(0.16, 0.6, 0.16, '#c89a5a', R(0.82, F + 1.25, 0, { rz: -0.3 })).ovale(0.16, '#c89a5a', R(0.98, F + 1.6, 0, { sx: 1.5, sy: 0.8 }), 8);
    poser(a.fin(), 0, 0, { y: 0 });
    murRect(xc, zc, 0.35, 1.2);
  }

  // ---- le centre des visiteurs (鳥取砂丘ビジターセンター) : long et bas, tout en lames de bois ; le garde parle devant sa porte
  {
    const a = atelier(), xf = 250.32, xb = 266, z0 = -34, z1 = -12, H = 3.8, zc = (z0 + z1) / 2, BOIS = '#9a7a54', BOIS2 = '#8a6c48';
    a.boite(xb - xf, H, z1 - z0, '#d8d0bc', { x: (xf + xb) / 2 + 0.06, y: F + H / 2, z: zc, nuance: 0.02 });
    for (let z = z0 + 0.1; z < z1; z += 0.34) a.boite(0.06, H - 0.1, 0.2, Math.round(z * 3) % 2 ? BOIS : BOIS2, { x: xf - 0.02, y: F + (H - 0.1) / 2, z, trait: false });
    a.boite(0.1, 2.3, 3.6, VITRE, { x: xf - 0.1, y: F + 1.15, z: zc + 2, trait: false }).boite(0.12, 0.1, 3.7, ALU, { x: xf - 0.1, y: F + 2.34, z: zc + 2, trait: false });
    a.boite(0.1, 2.0, 6.5, VITRE, { x: xf - 0.1, y: F + 1.25, z: zc - 5.5, trait: false }).boite(0.12, 0.1, 6.6, ALU, { x: xf - 0.1, y: F + 2.3, z: zc - 5.5, trait: false });
    a.boite(xb - xf + 2.4, 0.26, z1 - z0 + 1.2, '#5a4a3a', { x: (xf + xb) / 2 - 1.1, y: F + H + 0.13, z: zc, nuance: 0.03 });
    for (const dz of [-8, 0, 8]) { a.boite(0.14, H, 0.14, '#6a5240', { x: xf - 1.8, y: F + H / 2, z: zc + dz }); monde.cercle(xf - 1.8, zc + dz, 0.34); }
    a.boite(0.12, 0.6, 7.4, '#3a4a3e', { x: xf - 0.14, y: F + 3.2, z: zc + 2 });
    ecrire({ x: xf - 0.21, y: F, z: zc + 2, ry: -PI / 2 }, { texte: '鳥取砂丘ビジターセンター', x: 0, y: 3.2, z: 0, l: 7.0, h: 0.46, fond: null, encre: '#f4efe2' });
    poser(a.fin(), 0, 0, { y: 0 });
    monde.toit(xf - 2.3, xf, z0, z1, F + H - 0.02, F + H + 0.3);
  }

  // ---------------------------------------------------------------- Le musée du sable (砂の美術館)
  // Le grand toit gris à faible pente sur ses vitrages, devant lui les murs de béton troués de grands cadres (l'entrée) ; dedans, une seule grande salle, une
  // galerie le long du mur sud, et les sculptures : en 2026, « 砂で世界旅行・スペイン » (l'Espagne, pour les cent ans de la mort de Gaudí)
  const Mu = MUSEE_D, yM = Y_ROUTE + 0.02;
  const SABLE1 = '#dcc595', SABLE2 = '#ceb583', SABLE3 = '#efe0bd', SABLE4 = '#b39868', SABLE5 = '#86704a';
  {
    const a = atelier(), xw = Mu.x0 - 0.5, xe = Mu.x1 + 0.5, zn = Mu.z0 - 0.5, zs = Mu.z1 + 0.5, zm = (zn + zs) / 2, HV = 8.0, HC = 13.4, GRIS = '#5a5f63';
    // le sol, le bas des murs en béton, le haut en vitrages (clairs : la lumière vient d'en haut) et leurs montants
    a.boite(xe - xw, 0.05, zs - zn, '#cfc8b6', { x: (xw + xe) / 2, y: yM + 0.01, z: zm, trait: false, nuance: 0.02 });
    monde.surface(Mu.x0 - 2.6, Mu.x1, Mu.z0, Mu.z1, yM + 0.035, { sol: 'pierre' });
    const mur = (x0, z0, x1, z1) => {
      const L = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(z1 - z0, x1 - x0), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      a.boite(L, 3.2, 0.3, BETON, { x: cx, y: yM + 1.6, z: cz, ry: -ry, nuance: 0.02 });
      a.boite(L, HV - 3.2, 0.1, '#bcd4dc', { x: cx, y: yM + 3.2 + (HV - 3.2) / 2, z: cz, ry: -ry, trait: false });
      const n = Math.round(L / 3);
      for (let k = 0; k <= n; k++) a.boite(0.12, HV - 3.2, 0.24, ALU, { x: x0 + ((x1 - x0) * k) / n, y: yM + 3.2 + (HV - 3.2) / 2, z: z0 + ((z1 - z0) * k) / n, trait: false });
      a.boite(L, 0.12, 0.24, ALU, { x: cx, y: yM + 5.6, z: cz, ry: -ry, trait: false });
    };
    mur(xw, zn, xe, zn); mur(xw, zs, xe, zs); mur(xe, zn, xe, zs);
    mur(xw, zn, xw, Mu.porte.z0 - 0.1); mur(xw, Mu.porte.z1 + 0.1, xw, zs);
    a.boite(0.26, HV - 3.0, Mu.porte.z1 - Mu.porte.z0 + 0.4, BETON_F, { x: xw, y: yM + 3.0 + (HV - 3.0) / 2, z: (Mu.porte.z0 + Mu.porte.z1) / 2, nuance: 0.02 });
    // le toit : deux grands pans, le faîtage d'ouest en est, leurs débords ; les pignons, vitrés
    const pente = Math.atan2(HC - HV, zm - zn), Lp = (zm - zn + 1.6) / Math.cos(pente), W = xe - xw + 2.2;
    for (const sg of [-1, 1]) {
      const zc = zm + (sg * (zm - zn + 1.6)) / 2, yc = yM + HC - (HC - HV + 1.6 * Math.tan(pente)) / 2;
      a.boite(W, 0.26, Lp, GRIS, { x: (xw + xe) / 2, y: yc + 0.14, z: zc, rx: sg * pente, nuance: 0.02 });
      for (let x = xw - 0.9; x <= xe + 0.9; x += 1.1) a.boite(0.06, 0.05, Lp - 0.04, '#6a6f73', { x, y: yc + 0.29, z: zc, rx: sg * pente, trait: false });
    }
    a.boite(W + 0.02, 0.2, 0.6, '#4a4f53', { x: (xw + xe) / 2, y: yM + HC + 0.26, z: zm });
    for (const xg of [xw, xe]) a.pignon(0.14, HC - HV, zs - zn, '#bcd4dc', { x: xg, y: yM + HV, z: zm, ry: 0 });
    // la charpente d'acier : des fermes tous les 6 m, peintes en gris
    for (let x = xw + 3; x < xe - 1; x += 6) {
      for (const sg of [-1, 1]) {
        a.baton([x, yM + HV, sg < 0 ? zn + 0.1 : zs - 0.1], [x, yM + HC - 0.12, zm], 0.09, '#7a8086', 6);
        a.baton([x, yM + HV + 0.1, sg < 0 ? zn + 0.1 : zs - 0.1], [x, yM + HV + 0.1, zm], 0.05, '#7a8086', 5);
        for (const f of [0.33, 0.66]) { const zf = melange(sg < 0 ? zn + 0.1 : zs - 0.1, zm, f), yf = melange(yM + HV, yM + HC - 0.12, f); a.baton([x, yM + HV + 0.1, zf], [x, yf, zf], 0.03, '#7a8086', 4, { trait: false }); }
      }
    }
    // la galerie, le long du mur sud : son plancher, ses poteaux, sa rampe blanche ; l'escalier qui y monte, à l'ouest
    const G2 = GALERIE, yG = yM + G2.h;
    a.boite(G2.x1 - G2.x0, 0.22, G2.z1 - G2.z0, '#6a6e72', { x: (G2.x0 + G2.x1) / 2, y: yG - 0.11, z: (G2.z0 + G2.z1) / 2, nuance: 0.02 }).boite(G2.x1 - G2.x0 - 0.03, 0.02, G2.z1 - G2.z0 - 0.03, '#9a8a70', { x: (G2.x0 + G2.x1) / 2, y: yG + 0.0, z: (G2.z0 + G2.z1) / 2, trait: false });
    for (let x = G2.x0 + 0.3; x <= G2.x1; x += 6) { a.boite(0.2, G2.h - 0.2, 0.2, '#7a8086', { x, y: yM + (G2.h - 0.2) / 2, z: G2.z0 + 0.15 }); monde.cercle(x, G2.z0 + 0.15, 0.36, yM - 1, yM + 2.5); }
    const rampeG = (x0, x1, z, yy0 = yG, yy1 = yG) => {
      a.baton([x0, yy0 + 1.0, z], [x1, yy1 + 1.0, z], 0.026, '#f4f4f0', 6);
      const n = Math.max(1, Math.round(Math.abs(x1 - x0) / 0.55));
      for (let k = 0; k <= n; k++) { const x = melange(x0, x1, k / n), y = melange(yy0, yy1, k / n); a.boite(0.024, 1.0, 0.024, '#f4f4f0', { x, y: y + 0.5, z, trait: false }); }
    };
    rampeG(G2.x0 + 1.6, G2.x1 - 0.1, G2.z0 + 0.05);
    { const f = G2.x1 - 0.1; a.baton([f, yG + 1, G2.z0 + 0.05], [f, yG + 1, G2.z1 - 0.1], 0.026, '#f4f4f0', 6); for (let z = G2.z0 + 0.05; z < G2.z1; z += 0.55) a.boite(0.024, 1, 0.024, '#f4f4f0', { x: f, y: yG + 0.5, z, trait: false }); }
    monde.surface(G2.x0, G2.x1, G2.z0, G2.z1, yG, { sol: 'bois' });
    monde.mur(G2.x0 + 1.6, G2.z0 + 0.05, G2.x1 - 0.1, G2.z0 + 0.05, 0.28, yG - 0.4, yG + 2);
    monde.mur(G2.x1 - 0.1, G2.z0, G2.x1 - 0.1, G2.z1, 0.28, yG - 0.4, yG + 2);
    // l'escalier : il part du sol vers l'ouest et arrive au bout ouest de la galerie, posé le long d'elle, côté salle
    const n = 20, E0 = { x0: G2.x0 + 1.6, x1: G2.escX1 }, gr = (E0.x1 - E0.x0) / n, hm = G2.h / n, zb = G2.z0 - G2.escL / 2;
    for (let k = 0; k < n; k++) a.boite(gr + 0.01, 0.1, G2.escL, k % 2 ? '#7a7e82' : '#6e7276', { x: E0.x1 - (k + 0.5) * gr, y: yM + (k + 1) * hm - 0.05, z: zb });
    a.baton([E0.x1, yM, G2.z0 - G2.escL], [E0.x0, yG, G2.z0 - G2.escL], 0.09, '#6a6e72', 6);
    rampeG(E0.x1, E0.x0, G2.z0 - G2.escL - 0.02, yM, yG);
    rampeG(E0.x0, G2.x0 + 0.02, G2.z0 - G2.escL - 0.02);
    // (le palier, en haut de l'escalier : sa rampe au bout, côté ouest)
    a.boite(1.56, 0.14, G2.escL - 0.03, '#6a6e72', { x: G2.x0 + 0.8, y: yG - 0.07, z: zb, nuance: 0.02 }).boite(1.5, 0.02, G2.escL - 0.06, '#9a8a70', { x: G2.x0 + 0.8, y: yG + 0.003, z: zb, trait: false });
    a.baton([G2.x0 + 0.02, yG + 1, G2.z0 - G2.escL - 0.02], [G2.x0 + 0.02, yG + 1, G2.z1 - 0.1], 0.026, '#f4f4f0', 6);
    for (let z = G2.z0 - G2.escL; z < G2.z1; z += 0.55) a.boite(0.024, 1, 0.024, '#f4f4f0', { x: G2.x0 + 0.02, y: yG + 0.5, z, trait: false });
    monde.surface(G2.x0, E0.x0, G2.z0 - G2.escL, G2.z0, yG, { sol: 'bois' });
    monde.rampe(E0.x0, E0.x1, G2.z0 - G2.escL, G2.z0, 'x', yG, yM, { sol: 'bois' });
    // (le côté de la galerie, qui n'avait pas de rampe : le mur de la galerie ne commence qu'à 40 cm sous elle ; un peu plus bas, en poussant vers elle, on montait dessus, dans ce mur, et on restait coincé : 2026-11-03.
    // Un mur qui commence plus haut que le sol est un piège : celui-ci part d'en bas)
    rampeG(E0.x1, E0.x0, G2.z0 - 0.04, yM, yG);
    a.baton([E0.x0, yG + 1, G2.z0 - 0.04], [E0.x0, yG + 1, G2.z0 + 0.05], 0.026, '#f4f4f0', 6);
    monde.mur(E0.x0, G2.z0 + 0.05, E0.x1, G2.z0 + 0.05, 0.33, yM - 1, yG - 0.39);
    monde.mur(G2.x0, G2.z0 - G2.escL - 0.02, E0.x1, G2.z0 - G2.escL - 0.02, 0.26, yM - 1, yG + 2);
    monde.mur(G2.x0, G2.z0 - G2.escL, G2.x0, G2.z1, 0.28, yG - 0.4, yG + 2);
    // (le dessous de l'escalier est fermé : deux joues de tôle, du sol aux marches, et un pilier plein sous le palier)
    {
      const s = new THREE.Shape();
      s.moveTo(E0.x1, 0); s.lineTo(E0.x0, 0); s.lineTo(E0.x0, G2.h - 0.06); s.lineTo(E0.x1, 0);
      for (const z of [G2.z0 - G2.escL - 0.01, G2.z0 + 0.01]) a.piece(new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: false }), '#7a7e82', { y: yM, z: z - 0.03, nuance: 0.01 });
      a.boite(1.6, G2.h - 0.14, G2.escL - 0.02, '#7a7e82', { x: G2.x0 + 0.8, y: yM + (G2.h - 0.14) / 2, z: zb, nuance: 0.01 });
    }
    monde.mur(G2.x0, G2.z0 + 0.15, E0.x1, G2.z0 + 0.15, 0.14, yM - 1, yM + 2.4);
    monde.mur(G2.x0 - 0.15, G2.z0 - G2.escL, G2.x0 - 0.15, G2.z0, 0.12, yM - 1, yM + 2.4);
    monde.toit(xw, xe, zn, zs, yM + HV - 0.1, yM + HC + 0.5);
    // (le jour entre par les vitrages : aucune ombre du dehors sur ce qu'il y a dedans ; des lampes pour les sculptures)
    poser(a.fin(), 0, 0, { y: 0, recoit: false });
    for (const [x, y, z, r] of [[258.6, 7, 104, 13], [252, 6, 97, 10], [246, 5, 97, 9], [254, 6, 112, 9]]) lumieres.push({ x, y: yM + y, z, halo: 0, sol: yM, r, c: '#7a725e', jour: true });
    // l'entrée : les grands murs de béton du dehors, percés de cadres ; le nom ; la cour
    const c = atelier(), xg = COUR.x1 + 0.3;
    for (const [z0, z1] of [[80.4, Mu.porte.z0 - 1.0], [Mu.porte.z1 + 1.0, 130.32]]) {
      c.boite(0.4, 4.4, z1 - z0, '#c4c0b6', { x: xg, y: yM + 2.2, z: (z0 + z1) / 2, nuance: 0.015 });
    }
    c.boite(0.4, 0.5, Mu.porte.z1 - Mu.porte.z0 + 2.4, '#c4c0b6', { x: xg, y: yM + 4.15, z: (Mu.porte.z0 + Mu.porte.z1) / 2, nuance: 0.015 });
    c.boite(xw - xg - 0.06, 0.05, Mu.porte.z1 - Mu.porte.z0 + 1, '#a8a59c', { x: (xg + xw) / 2, y: yM + 0.01, z: (Mu.porte.z0 + Mu.porte.z1) / 2, trait: false });
    c.boite(xw - xg - 0.04, 0.24, Mu.porte.z1 - Mu.porte.z0 + 1.6, '#6e7276', { x: (xg + xw) / 2, y: yM + 3.2, z: (Mu.porte.z0 + Mu.porte.z1) / 2 });
    for (const zl of [Mu.porte.z0 - 0.4, Mu.porte.z1 + 0.4]) c.boite(xw - xg, 3.2, 0.14, '#c4c0b6', { x: (xg + xw) / 2, y: yM + 1.6, z: zl });
    poser(c.fin(), 0, 0, { y: 0 });
    ecrire({ x: xg - 0.21, y: yM, z: 91.6, ry: -PI / 2 }, { texte: '砂の美術館', sous: 'The Sand Museum', x: 0, y: 2.5, z: 0, l: 5.2, h: 1.3, fond: null, encre: '#4a463e' });
    monde.toit(xg, xw, Mu.porte.z0 - 0.3, Mu.porte.z1 + 0.3, yM + 3.1, yM + 3.4);
    // (dans la cour : une petite sculpture, un phare et une vague, comme le vrai, à côté de l'entrée ; des arbustes)
    const s = atelier();
    s.boite(3.4, 0.34, 2.4, '#8a8880', { x: 228.6, y: yM + 0.17, z: 91.6, nuance: 0.03 });
    s.boite(2.6, 0.5, 1.7, SABLE2, { x: 228.6, y: yM + 0.58, z: 91.6, nuance: 0.03 }).boite(2.0, 1.1, 1.2, SABLE1, { x: 228.6, y: yM + 1.35, z: 91.6, nuance: 0.03 });
    for (const [dx, h] of [[-1.0, 2.6], [1.0, 2.6], [0, 3.2]]) {
      s.cylindre(0.3, 0.36, h, 8, SABLE3, { x: 228.6 + dx, y: yM + 0.83 + h / 2, z: 91.6 });
      for (let k = 0; k < 6; k++) { const t = (k / 6) * 2 * Math.PI; s.boite(0.13, 0.17, 0.13, SABLE1, { x: 228.6 + dx + Math.cos(t) * 0.27, y: yM + 0.83 + h + 0.08, z: 91.6 + Math.sin(t) * 0.27, ry: -t, trait: false }); }
    }
    poser(s.fin(), 0, 0, { y: 0 });
    murRect(228.6, 91.6, 1.7, 1.2);
  }
  /** Les rangées de lampes et les bords de chaque sculpture : une lisse basse en bois, partout la même. */
  const garde = (a, pts) => {
    for (let i = 0; i + 1 < pts.length; i++) {
      const [x0, z0] = pts[i], [x1, z1] = pts[i + 1];
      a.baton([x0, yM + 0.5, z0], [x1, yM + 0.5, z1], 0.03, '#6e4a2c', 6);
      a.baton([x0, yM, z0], [x0, yM + 0.56, z0], 0.04, '#5e4028', 6);
      monde.mur(x0, z0, x1, z1, 0.28);
    }
    const [xl, zl] = pts[pts.length - 1];
    a.baton([xl, yM, zl], [xl, yM + 0.56, zl], 0.04, '#5e4028', 6);
  };
  // (dessinées seulement la caméra dans le musée ou devant sa porte, dans la cour : elles ne coûtent rien de dehors)
  const SUITE_SCULPTURES = sculptures(THREE, atelier, { yM, SABLE1, SABLE2, SABLE3, SABLE4, SABLE5, garde, poser, ecrire, Mu, hasard, PI, DEDANS: [216, 276, 78, 128] });

  monde.cercle(SUITE_SCULPTURES.chantier.x, SUITE_SCULPTURES.chantier.z, SUITE_SCULPTURES.chantier.r);
  monde.cercle(SUITE_SCULPTURES.poteau.x, SUITE_SCULPTURES.poteau.z, 0.34);

  // ---------------------------------------------------------------- Les pins : la berge, la forêt tout autour (les pins plantés contre le sable depuis Edo)
  /** Un pin noir (黒松) couché par le vent de la mer : un tronc penché, des plateaux d'aiguilles sombres. */
  const pinVent = (a, x, y, z, h, sens) => {
    const dx = sens * 0.32, P1 = [x, y - 0.3, z], P2 = [x + dx * 0.3 * h, y + 0.35 * h, z + 0.05 * h], P3 = [x + dx * 0.75 * h, y + 0.62 * h, z + 0.08 * h], P4 = [x + dx * 1.05 * h, y + 0.84 * h, z + 0.12 * h];
    a.tronc([P1, P2, P3, P4], [0.035 * h, 0.028 * h, 0.02 * h, 0.012 * h], ECORCE, 6);
    const c = [PIN, PIN2, PIN3][Math.floor(hasard(x, z) * 3)];
    for (const [p, r, ang] of [[P2, 0.3, 0.6], [P3, 0.4, -0.4], [P4, 0.36, 0.2], [P3, 0.28, 1.9]]) {
      const q = [p[0] + Math.cos(ang) * r * h * 0.3, p[1] + 0.05 * h, p[2] + Math.sin(ang) * r * h * 0.3];
      a.houppe(r * h * 0.47, c, { x: q[0], y: q[1], z: q[2], sy: 0.42, bosses: 0.24, sorte: 'conifere' }, 1);
    }
  };
  // la forêt, derrière les clôtures : serrée près du bord, au sud et à l'ouest ; sur la berge, le long de la route ; derrière les boutiques
  const horsTout = (x, z) => !dansPoly(BORD_SABLE, x, z) && !dansPoly(BORD_ROUTE, x, z) && !dansLeCadre(x, z);
  /** Un pin de plus loin : moins de plateaux, moins de facettes (on ne l'approche pas). */
  const pinLoin = (a, x, y, z, h, sens, fin) => {
    const c = [PIN, PIN2, PIN3][Math.floor(hasard(x, z) * 3)], dx = sens * 0.28 * h;
    a.fut([x, y - 0.3, z], [x + dx, y + 0.8 * h, z + 0.1 * h], 0.03 * h, 0.012 * h, ECORCE, 4, { trait: false });
    a.houppe(0.3 * h, c, { x: x + dx * 0.6, y: y + 0.56 * h, z, sy: 0.42, bosses: 0.24, sorte: 'conifere' }, fin).houppe(0.26 * h, c, { x: x + dx, y: y + 0.84 * h, z: z + 0.1 * h, sy: 0.42, bosses: 0.24, sorte: 'conifere' }, fin);
  };
  for (let z = -130; z < 214; z += 6.2) {
    for (let x = -296; x < 412; x += 6.2) {
      const gx = x + (hasard(x, z) - 0.5) * 3.8, gz = z + (hasard(z, x) - 0.5) * 3.8;
      // (au-delà de x = 300, seulement autour de la ligne du télésiège et du Sakyu Center : plus loin, la forêt en boules, plus bas)
      if (gx >= 300 && !(gx < 352 ? gz > -44 && gz < 128 : gz > 14 && gz < 102)) continue;
      // (le couloir de la ligne : les pins s'écartent, les sièges passent entre eux ; rien non plus sur la colline du Sakyu Center)
      if (gx > 196 && gx < 340 && Math.abs(gz - LIFT.z) < 7.5) continue;
      if (gx > 329 && gx < 392 && gz > 28 && gz < 86) continue;
      if (!horsTout(gx, gz)) continue;
      const d = distPoly(BORD_SABLE, gx, gz);
      const dr = gx > 205 ? Math.min(Math.abs(gx - 213), Math.abs(gx - 250)) : 99; // (près de la route)
      // (la route, son prolongement, le parking, les boutiques, le musée : pas d'arbre ; ni devant l'escalier)
      if (gx > ROUTE.x0 - 2.5 && gx < ROUTE.x1 + 2.5) continue;
      if (gx > ROUTE.x0 - 2.5 && gx < TOURNANT.x1 + 1 && gz > TOURNANT.z0 - 3.5 && gz < TOURNANT.z1 + 2.5) continue;
      if (gx > 212 && gx < MUSEE.x1 + 7 && gz > 76 && gz < MUSEE.z1 + 8) continue;
      if (gx > 212 && gx < 280 && gz > -38 && gz < 76) continue;
      if (d < 3.4 || (gx > 196 && gx < 216 && gz > 28 && gz < 48)) continue;
      // (vers le rivage, les pins s'arrêtent : l'herbe et le sable jusqu'à la plage, côté ouest)
      if (gz < -60 && gx < -200) continue;
      if (gz < -40 && gx > 228 && hasard(gx, 3) > 0.5) continue;
      // (sous la terrasse, moins hauts : ils ne bouchent pas la vue ; le long de la ligne, de près, on les voit bien)
      const y = terrain(gx, gz), h = (5.2 + 3.8 * hasard(gx * 1.3, gz) - (d < 7 ? 1.6 : 0)) * (gx > 300 ? 0.72 : 1), sens = hasard(gz, gx * 2) > 0.3 ? 1 : -1;
      const prochePlace = d < 16 || (gx > 205 && dr < 16) || (gx > 250 && gx < 345 && Math.abs(gz - LIFT.z) < 15);
      if (prochePlace) pinVent(morceau(gx, gz), gx, y, gz, h, sens);
      else if (d < 34) pinLoin(morceau(gx, gz), gx, y, gz, h, sens, 1);
      else if (hasard(gx * 3, gz) < 0.62) pinLoin(morceau(gx, gz, 100), gx, y, gz, h * 1.15, sens, 0);
    }
  }
  // au loin : la forêt des collines (de grosses boules sombres, sans trait, par morceaux de 200 m)
  const boule = (gx, gz, y, fin) => morceau(gx, gz, 200).houppe(fin ? 8 + 5 * hasard(gx, gz) : 13 + 9 * hasard(gx, gz), [PIN, PIN2, '#3f6a3a', '#4a7240'][Math.floor(hasard(gz, gx) * 4)], { x: gx, y: y + 5, z: gz, sy: 0.72, bosses: 0.2, sorte: 'conifere' }, fin ? 1 : 0);
  for (let z = 170; z < 900; z += 34) {
    for (let x = -1500; x < 1500; x += 34) {
      const gx = x + (hasard(x, z) - 0.5) * 22, gz = z + (hasard(z, x) - 0.5) * 22;
      if (gx > -300 && gx < 300 && gz < 214) continue;
      boule(gx, gz, terrain(gx, gz), false);
    }
  }
  for (let z = 196; z < 420; z += 19) {
    for (let x = -480; x < 520; x += 19) {
      const gx = x + (hasard(x, z) - 0.5) * 12, gz = z + (hasard(z, x) - 0.5) * 12;
      if (gx > -300 && gx < 300 && gz < 214) continue;
      boule(gx, gz, terrain(gx, gz), true);
    }
  }
  for (let z = -440; z < 196; z += 20) {
    for (let x = 300; x < 1600; x += 20) {
      const fin = x < 620;
      if (!fin && (Math.round(x / 20) % 2 || Math.round(z / 20) % 2)) continue;
      const gx = x + (hasard(x, z) - 0.5) * 12, gz = z + (hasard(z, x) - 0.5) * 12;
      if (gz - zRivage(gx) < 30) continue;
      // (ni sur la ligne du télésiège, ni sur la colline du Sakyu Center, ni devant la vue de sa terrasse : là, les pins)
      if (gx < 352 ? gz > -56 && gz < 140 : gx < 424 && gz > 2 && gz < 114) continue;
      // (du toit, on voit l'îlot de la baleine, comme du vrai : rien dans ce cône)
      { const d = 31 - gz; if (d > 0 && Math.abs(gx - (358 + d * 0.495)) < 26 + d * 0.16) continue; }
      const y = terrain(gx, gz);
      if (y < 8) continue;
      boule(gx, gz, y, fin);
    }
  }
  for (let z = -40; z < 170; z += 24) {
    for (let x = -1500; x < -300; x += 24) {
      const fin = x > -560, gx = x + (hasard(x, z) - 0.5) * 14, gz = z + (hasard(z, x) - 0.5) * 14;
      if (!fin && (Math.round(x / 24) % 2 || Math.round(z / 24) % 2)) continue;
      boule(gx, gz, terrain(gx, gz), fin);
    }
  }

  // ---------------------------------------------------------------- Les plantes des dunes : コウボウムギ (les touffes raides), ハマゴウ (bas, violet) dans les taches vertes et le long des clôtures
  const touffeDune = (a, x, y, z, s, c1, c2) => {
    for (let k = 0; k < 7; k++) {
      const t = (k / 7) * 2 * PI + hasard(x, k) * 0.6, e = 0.22 + 0.36 * hasard(k, z), L = (0.42 + 0.3 * hasard(z, k)) * s;
      a.fut([x + Math.sin(t) * 0.04, y - 0.04, z + Math.cos(t) * 0.04], [x + Math.sin(t) * e * L, y + L, z + Math.cos(t) * e * L], 0.016 * s + 0.008, 0.002, k % 2 ? c1 : c2, 3, { trait: false, sorte: 'buisson' });
    }
  };
  for (let z = -146; z < 150; z += 2.3) {
    for (let x = -236; x < 200; x += 2.3) {
      const gx = x + (hasard(x, z) - 0.5) * 2, gz = z + (hasard(z, x) - 0.5) * 2, v = herbeDes(gx, gz);
      if (v < 0.1 || !dansPoly(BORD_SABLE, gx, gz)) continue;
      if (hasard(gx * 2.1, gz) > 0.55) continue;
      const y = terrain(gx, gz), a = morceau(gx, gz);
      touffeDune(a, gx, y, gz, 0.8 + 0.5 * hasard(gz, gx), '#7f9c52', '#6a8a46');
      if (hasard(gx, gz * 2.3) > 0.9) for (let k = 0; k < 4; k++) a.ovale(0.05, k % 2 ? '#b08ad8' : '#9a74c8', { x: gx + (hasard(k, gx) - 0.5) * 0.7, y: y + 0.22 + 0.1 * hasard(gz, k), z: gz + (hasard(gz, k) - 0.5) * 0.7, trait: false, sorte: 'buisson' }, 4);
    }
  }

  // Bunbuku, de trois quarts : les feux d'artifice partent au nord ; face au nord, sa commode cacherait le voyageur qui vient de lui parler
  const MARCHAND = { x: 3.0, z: 146.6, cap: PI / 2 + 0.5 };

  // ---------------------------------------------------------------- Les piquets (杭) : le vrai sable a un piquet tous les 100 m, une adresse écrite dessus ; ici, tous les 50 m
  const LETTRES = 'ABCDEFGHIJK';
  {
    const a = atelier();
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 7; j++) {
        const x = -220 + i * 45 + 5 * Math.sin(j * 2.1), z = -128 + j * 45 + 4 * Math.sin(i * 1.7);
        if (!dansPoly(BORD_SABLE, x, z) || Math.hypot(x - OASIS.x, z - OASIS.z) < OASIS.rx + 6 || Math.hypot(x - CUVETTE.x, z - CUVETTE.z) < 16 || Math.hypot(x - MARCHAND.x, z - MARCHAND.z) < 7) continue;
        const y = terrain(x, z);
        a.boite(0.12, 1.3, 0.12, '#e8e4d6', { x, y: y + 0.45, z, nuance: 0.03 }).boite(0.14, 0.2, 0.14, '#c8402c', { x, y: y + 1.14, z });
        const nom = `${LETTRES[i]}-${j + 1}`;
        ecrire({ x, y, z: z + 0.078, ry: 0 }, { texte: nom, x: 0, y: 0.92, z: 0, l: 0.12, h: 0.09, fond: '#e8e4d6', encre: '#2a2420' });
        monde.cercle(x, z, 0.3);
      }
    }
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Les anémomètres (風向風速計) : les coupelles tournent, la girouette se tient au vent
  const anemos = [[150, -30], [-62, -2], [-196, 92]].map(([x, z]) => {
    const y = terrain(x, z), a = atelier();
    a.boite(0.8, 0.14, 0.8, BETON, { x, y: y + 0.03, z }).baton([x, y, z], [x, y + 4.8, z], 0.045, '#d8dcdc', 8);
    for (const t of [0, 2.09, 4.19]) a.baton([x, y + 0.04, z], [x + Math.cos(t) * 0.9, y + 2.8, z + Math.sin(t) * 0.9], 0.012, '#9a9ea2', 4, { trait: false });
    a.boite(0.4, 0.5, 0.2, '#e8e8e2', { x, y: y + 1.5, z: z + 0.1 });
    poser(a.fin(), 0, 0, { y: 0 });
    monde.cercle(x, z, 0.72);
    const c = atelier();
    for (let k = 0; k < 3; k++) { const t = (k / 3) * 2 * PI; c.baton([0, 0, 0], [Math.cos(t) * 0.22, 0, Math.sin(t) * 0.22], 0.01, '#d8dcdc', 4, { trait: false }).ovale(0.05, '#f4f4ee', { x: Math.cos(t) * 0.24, z: Math.sin(t) * 0.24, trait: true }, 6); }
    const g = ctx.maillage(c.fin(0, false));
    g.position.set(x, y + 4.86, z);
    return { g, x, z };
  });
  animes.push({
    objet: (() => { const g = new THREE.Group(); for (const q of anemos) g.add(q.g); return g; })(),
    maj(dt, temps, c) { for (const q of anemos) q.g.rotation.y += dt * (2.5 + 2.2 * Math.sin(temps * 0.4 + q.x)); return []; },
  });

  // ---------------------------------------------------------------- Les repères du Dos de cheval : son sommet ; la crête, de x en x
  /** Le z de la crête du Dos de cheval en x (le point le plus haut, de −100 à +60 au sud). */
  const zCrete = (x) => {
    let m = -Infinity, zm = 0;
    for (let z = -150; z < 90; z += 1) { const h = terrain(x, z); if (h > m) { m = h; zm = z; } }
    return zm;
  };
  const SOMMET = (() => { const z = zCrete(40); return { x: 40, z, y: terrain(40, z) }; })();
  {
    // le grand poteau du sommet, son écriteau ; il dit le nom et la hauteur
    const a = atelier(), { x, z, y } = SOMMET, xp = x + 1.2, zp = z + 1.4, yp = terrain(xp, zp);
    a.boite(0.22, 2.4, 0.22, '#6f5a3e', { x: xp, y: yp + 0.95, z: zp, nuance: 0.03 }).boite(1.5, 0.5, 0.08, '#8a6a48', { x: xp, y: yp + 1.8, z: zp + 0.13 });
    poser(a.fin(), 0, 0, { y: 0 });
    ecrire({ x: xp, y: yp, z: zp + 0.178, ry: 0 }, { texte: '馬の背', sous: 'Uma-no-se  47 m', x: 0, y: 1.8, z: 0, l: 1.36, h: 0.42, fond: null, encre: '#f4e6c4' });
    monde.cercle(xp, zp, 0.34);
    Object.assign(SOMMET, { xp, zp });
  }

  // ---------------------------------------------------------------- L'oasis (オアシス) : la source au pied de la crête, ses plantes, son écriteau
  const eauxCalmes = [[OASIS.x - OASIS.rx * 1.3, OASIS.x + OASIS.rx * 1.3, OASIS.z - OASIS.rx * 1.3, OASIS.z + OASIS.rx * 1.3, OASIS.y, (x, z) => (1.02 - rOasis(x, z)) * 3]];
  const PANNEAU_OASIS = { x: OASIS.x + 5.4, z: OASIS.z + OASIS.rz + 2.8, ry: PI + 0.32 };
  {
    const a = atelier();
    for (let k = 0; k < 90; k++) {
      const t = (k / 90) * 2 * PI + hasard(k, 3) * 0.1, u = Math.cos(t) * (1.08 + 0.3 * hasard(k, 1)) * OASIS.rx, v = Math.sin(t) * (1.08 + 0.3 * hasard(k, 2)) * OASIS.rz, c = Math.cos(OASIS.ry), s = Math.sin(OASIS.ry), x = OASIS.x + u * c - v * s, z = OASIS.z + u * s + v * c;
      if (hasard(k, 7) > 0.68) continue;
      if (Math.hypot(x - PANNEAU_OASIS.x, z - PANNEAU_OASIS.z) < 2.2) continue;
      touffeDune(a, x, terrain(x, z), z, 1.1 + 0.6 * hasard(k, 5), '#6d9a4e', '#588442');
    }
    poser(a.fin(), 0, 0, { y: 0 });
    const { x: xp, z: zp, ry } = PANNEAU_OASIS, yp = terrain(xp, zp), b = panneau(atelier(), P, { ecrit: true, pied: 0.4 });
    poser(b.fin(), xp, zp, { y: yp, ry });
    ecrire({ x: xp, y: yp, z: zp, ry }, { ...PAPIER_PANNEAU, texte: 'オアシス', lignes: 3, fond: '#f4ecd8', encre: '#2a2420' });
    monde.cercle(xp - Math.sin(ry) * 0, zp, 1.0);
  }

  // ---------------------------------------------------------------- Le coin des chameaux (らくだや) : l'abri de bois, les escaliers de métal pour monter, le chamelier
  const ABRI = { x: 176, z: 16 }, MONTEE = { x: 165.5, z: 25.2, ry: PI / 2 + 0.25 };
  {
    const a = atelier(), yb = terrain(ABRI.x, ABRI.z), L = 10, W = 3.6, h0 = 2.72, h1 = 3.3;
    // (2026-11-03 : « il est mal fait, le toit est mal mis, le panneau n'est pas accroché ». Les poteaux, leurs poutres ; sur les poutres, les chevrons, dans la pente et qui dépassent ; sur les chevrons, le toit de
    // roseaux, dans la même pente. Avant, le toit penchait à l'envers des poutres, et l'enseigne flottait devant elles)
    const POUTRE = 0.14, ang = Math.atan2(h1 - h0, W), yToit = (z) => yb + melange(h1, h0, (z - (ABRI.z - W / 2)) / W);
    for (const u of [-1, 0, 1]) for (const v of [-1, 1]) {
      const x = ABRI.x + u * (L / 2 - 0.2), z = ABRI.z + v * (W / 2), y = terrain(x, z);
      a.fut([x, y - 0.3, z], [x, yToit(z) - POUTRE / 2, z], 0.1, 0.085, '#6f5a3e', 8);
      monde.cercle(x, z, 0.32);
      // (une jambe de force, de chaque poteau à sa poutre)
      for (const s of [-1, 1]) if (u !== s) a.baton([x, yToit(z) - 0.75, z], [x + s * 0.62, yToit(z) - POUTRE, z], 0.03, '#6f5a3e', 5, { trait: false });
    }
    for (const v of [-1, 1]) a.boite(L, POUTRE, POUTRE, '#5e4a34', { x: ABRI.x, y: yToit(ABRI.z + v * (W / 2)), z: ABRI.z + v * (W / 2), nuance: 0.03 });
    // (les chevrons, posés sur les poutres, leur haut 8 cm au-dessus du dessus des poutres ; ils dépassent de 45 cm de chaque côté)
    const DEB = 0.45, yC = (z) => yToit(z) + POUTRE / 2 + 0.03;
    for (let k = 0; k < 9; k++) a.baton([ABRI.x - L / 2 - 0.1 + k * ((L + 0.2) / 8), yC(ABRI.z - W / 2 - DEB), ABRI.z - W / 2 - DEB], [ABRI.x - L / 2 - 0.1 + k * ((L + 0.2) / 8), yC(ABRI.z + W / 2 + DEB), ABRI.z + W / 2 + DEB], 0.042, '#6f5a3e', 6);
    // le toit de roseaux : une épaisse natte, rangs de roseaux par-dessus, un peu plus sombres un rang sur deux (rx > 0 : le côté sud, +z, plus bas)
    {
      const LR = L + 0.9, PR = Math.hypot(W + 2 * DEB + 0.2, (h1 - h0) * ((W + 2 * DEB + 0.2) / W)), e = 0.16, yc = yC(ABRI.z) + 0.042 + (e / 2) * Math.cos(ang);
      a.boite(LR, e, PR, '#a98f58', { x: ABRI.x, y: yc, z: ABRI.z, rx: ang, nuance: 0.04 });
      const rangs = 11;
      for (let k = 0; k < rangs; k++) {
        const f = (k + 0.5) / rangs - 0.5, zr = ABRI.z + f * PR * Math.cos(ang), yr = yc - f * PR * Math.sin(ang) + (e / 2 + 0.018) * Math.cos(ang);
        a.boite(LR + 0.04 - 0.12 * ((k * 7) % 3), 0.036, PR / rangs + 0.03, k % 2 ? '#c2a66a' : '#b5995e', { x: ABRI.x, y: yr + 0.004 * (k % 2), z: zr + (e / 2 + 0.018) * Math.sin(ang), rx: ang, nuance: 0.05, trait: false });
      }
    }
    // l'auge et la botte de foin, une enseigne
    a.boite(4.4, 0.42, 0.5, '#8a6a48', { x: ABRI.x + 1.2, y: yb + 0.2, z: ABRI.z - 1.5 }).boite(4.2, 0.03, 0.34, '#c8b060', { x: ABRI.x + 1.2, y: yb + 0.42, z: ABRI.z - 1.5, trait: false });
    murRect(ABRI.x + 1.2, ABRI.z - 1.5, 2.2, 0.25);
    // (l'enseigne, suspendue sous la poutre basse par deux tiges : dans le plan de la poutre, entre deux poteaux)
    const zE = ABRI.z + W / 2, xE = ABRI.x - 2.4, yE = yToit(zE) - POUTRE / 2 - 0.42;
    a.boite(1.8, 0.5, 0.06, '#7a3a26', { x: xE, y: yE, z: zE, nuance: 0.03 });
    for (const dx of [-0.7, 0.7]) a.baton([xE + dx, yE + 0.22, zE], [xE + dx, yToit(zE) - POUTRE / 2 + 0.02, zE], 0.012, '#3a3a40', 5, { trait: false });
    poser(a.fin(), 0, 0, { y: 0 });
    ecrire({ x: xE, y: yb, z: zE + 0.035, ry: 0 }, { texte: 'らくだ', x: 0, y: yE - yb, z: 0, l: 1.5, h: 0.4, fond: null, encre: '#f8e8c8' });
    monde.toit(ABRI.x - L / 2, ABRI.x + L / 2, ABRI.z - W / 2, ABRI.z + W / 2, yb + h0 - 0.05, yb + h1 + 0.5);
    // l'escalier de métal : trois marches, une plate-forme à la hauteur du siège, une rampe
    const c = atelier(), R = repere(MONTEE.x, MONTEE.z, MONTEE.ry), ym = terrain(MONTEE.x, MONTEE.z);
    const pm = 1.32;
    c.boite(0.8, 0.05, 0.8, '#9a9ea2', R(0, ym + pm, 0));
    for (const [u, v] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) c.baton([R(u * 0.38, 0, v * 0.38).x, ym - 0.2, R(u * 0.38, 0, v * 0.38).z], [R(u * 0.38, 0, v * 0.38).x, ym + pm, R(u * 0.38, 0, v * 0.38).z], 0.024, '#7a7e82', 5);
    for (let k = 1; k <= 4; k++) c.boite(0.8, 0.04, 0.26, '#9a9ea2', R(0, ym + (pm * k) / 5, -0.4 - (5 - k) * 0.26));
    for (const u of [-1, 1]) {
      const p0 = R(u * 0.4, 0, -1.72), p1 = R(u * 0.4, 0, -0.4), p2 = R(u * 0.4, 0, 0.4);
      c.baton([p0.x, ym + 0.8, p0.z], [p1.x, ym + pm + 0.8, p1.z], 0.016, '#7a7e82', 5).baton([p1.x, ym + pm + 0.8, p1.z], [p2.x, ym + pm + 0.8, p2.z], 0.016, '#7a7e82', 5).baton([p0.x, ym - 0.1, p0.z], [p0.x, ym + 0.8, p0.z], 0.016, '#7a7e82', 5);
      c.baton([p0.x, ym - 0.1, p0.z], [p1.x, ym + pm - 0.1, p1.z], 0.02, '#7a7e82', 5);
    }
    poser(c.fin(), 0, 0, { y: 0 });
    monde.mur(R(-0.3, 0, -1.72).x, R(-0.3, 0, -1.72).z, R(-0.3, 0, 0.4).x, R(-0.3, 0, 0.4).z, 0.32); monde.mur(R(0.3, 0, -1.72).x, R(0.3, 0, -1.72).z, R(0.3, 0, 0.4).x, R(0.3, 0, 0.4).z, 0.32);
    Object.assign(MONTEE, { pied: R(0, 0, -2.3), haut: R(0, 0, 0), ym, pm });
  }

  // ---------------------------------------------------------------- La planche : le moniteur, sur la crête, ses planches sur leur râtelier ; la piste, de la crête à la plage
  // (2026-11-03 : « il faudrait que tu les refasses mieux parce que là, c'est juste des rectangles » ; « on compte le temps que tu mets à descendre et tu peux battre ton record »)
  const ZC_PL = zCrete(82), PLANCHES = { x: 82, z: ZC_PL + 3.0 };
  // la piste : le départ, six portes en zigzag (rouges et bleues, comme un slalom), l'arrivée sur le haut de la plage
  const PISTE = (() => {
    const xd = PLANCHES.x + 6, zd = zCrete(xd) - 2.2, zf = zRivage(xd) + 15;
    // (tout droit, on les rate toutes ; en zigzag, de 2 m de chaque côté de l'axe, on les passe toutes : un virage trop fort freine plus qu'une porte ratée ne coûte)
    const portes = [[0.17, -4.6], [0.31, 4.6], [0.45, -5], [0.59, 5], [0.73, -4.6], [0.87, 4.6]].map(([f, dx]) => ({ x: xd + dx, z: melange(zd, zf, f), l: 3.4 }));
    for (const q of portes) q.piquets = [[q.x - q.l, q.z], [q.x + q.l, q.z]];
    return { xd, zd, zf, portes };
  })();
  {
    const a = atelier(), COUL = [['#d8402c', '#f4efe2', '#2a2a30'], ['#2f6ab0', '#f2c443', '#f4efe2'], ['#f2c443', '#2a2a30', '#d8402c'], ['#3a8a5a', '#f4efe2', '#f2c443'], ['#f4efe2', '#2f6ab0', '#d8402c']];
    // le râtelier : deux chevalets de bois, une barre ; les planches appuyées dessus, le bas planté dans le sable, leur dessus vers le sud (d'où l'on arrive)
    const xr0 = PLANCHES.x + 1.0, xr1 = PLANCHES.x + 4.4, zr = PLANCHES.z + 0.34, BOIS = '#8a6a48';
    for (const x of [xr0, xr1]) {
      const y = terrain(x, zr);
      for (const dz of [-0.42, 0.42]) a.baton([x, y - 0.25, zr + dz], [x, y + 1.12, zr], 0.035, BOIS, 6);
      a.baton([x, y + 0.42, zr - 0.2], [x, y + 0.42, zr + 0.2], 0.022, BOIS, 5, { trait: false });
    }
    const yr = (terrain(xr0, zr) + terrain(xr1, zr)) / 2 + 1.1;
    a.baton([xr0 - 0.08, terrain(xr0, zr) + 1.1, zr], [xr1 + 0.08, terrain(xr1, zr) + 1.1, zr], 0.04, '#7a5a3c', 6);
    COUL.forEach((c, k) => {
      const x = xr0 + 0.38 + k * 0.66, tau = 0.26 + 0.03 * (k % 2), Lp = 1.36, zb = zr + 0.34 + 0.04 * (k % 2), yb = terrain(x, zb) - 0.14, cz = zb - (Math.sin(tau) * Lp) / 2, cy = yb + (Math.cos(tau) * Lp) / 2;
      plancheSable(THREE, a, c, { x, y: cy, z: cz, rx: PI / 2 - tau, ry: 0.03 * (k - 2), ordre: 'YXZ' }, 1, k);
    });
    // la glacière : sa caisse, son couvercle blanc et ses poignées ; une bouteille posée dessus
    const xg = PLANCHES.x + 5.5, zg = PLANCHES.z + 1.2, yg = terrain(xg, zg);
    a.boite(0.6, 0.34, 0.4, '#2f7ab0', { x: xg, y: yg + 0.17, z: zg, ry: 0.3, nuance: 0.02 }).boite(0.63, 0.08, 0.43, '#f4f4ee', { x: xg, y: yg + 0.37, z: zg, ry: 0.3, nuance: 0.02 });
    a.boite(0.3, 0.025, 0.03, '#c8ccd0', { x: xg + 0.03, y: yg + 0.42, z: zg + 0.01, ry: 0.3, trait: false });
    a.cylindre(0.03, 0.035, 0.17, 8, '#7fc4e8', { x: xg - 0.14, y: yg + 0.5, z: zg + 0.06, trait: false }).cylindre(0.014, 0.018, 0.03, 8, '#2f6ab0', { x: xg - 0.14, y: yg + 0.6, z: zg + 0.06, trait: false });
    monde.mur(xr0 - 0.1, zr, xr1 + 0.1, zr, 0.6);
    monde.cercle(xg, zg, 0.5);
    // son petit drapeau
    const xf = PLANCHES.x - 1.4, zf = PLANCHES.z + 0.8, yf = terrain(xf, zf);
    a.baton([xf, yf - 0.3, zf], [xf, yf + 2.9, zf], 0.024, '#d8dcdc', 6).boite(0.9, 0.5, 0.02, '#e8452e', { x: xf + 0.46, y: yf + 2.62, z: zf, trait: false });
    ecrire({ x: xf + 0.46, y: yf, z: zf + 0.012, ry: 0 }, { texte: 'サンドボード', x: 0, y: 2.62, z: 0, l: 0.84, h: 0.2, fond: null, encre: '#f8f8f0' });
    ecrire({ x: xf + 0.46, y: yf, z: zf - 0.012, ry: PI }, { texte: 'サンドボード', x: 0, y: 2.62, z: 0, l: 0.84, h: 0.2, fond: null, encre: '#f8f8f0' });
    monde.cercle(xf, zf, 0.27);
    // ---- la piste : l'arche du départ, sur la crête ; les portes (deux piquets, leurs fanions) ; l'arche de l'arrivée
    const arche = (xc, z, demi, h, texte, sous, damier) => {
      for (const u of [-1, 1]) { const x = xc + u * demi, y = terrain(x, z); a.fut([x, y - 0.4, z], [x, y + h + 0.3, z], 0.08, 0.065, '#e8e6dc', 8); monde.cercle(x, z, 0.3); }
      const y0 = Math.max(terrain(xc - demi, z), terrain(xc + demi, z)) + h;
      a.boite(2 * demi + 0.1, 0.62, 0.05, '#d8402c', { x: xc, y: y0, z, nuance: 0.02 });
      if (damier) for (let k = 0; k < Math.round(demi * 10); k++) for (const v of [0, 1]) if ((k + v) % 2 === 0) for (const s of [-1, 1]) a.boite(0.2, 0.09, 0.006, '#f8f8f0', { x: xc - demi + 0.1 + k * 0.2 + 0.01, y: y0 + 0.215 - v * 0.09, z: z + s * 0.03, trait: false });
      for (const [s, ry] of [[-1, PI], [1, 0]]) ecrire({ x: xc, y: y0, z: z + s * 0.032, ry }, { texte, sous, x: 0, y: damier ? -0.1 : 0, z: 0, l: Math.min(2 * demi - 0.4, 5), h: damier ? 0.34 : 0.52, fond: null, encre: '#f8f8f0' });
    };
    arche(PISTE.xd, PISTE.zd - 1.2, 2.3, 2.55, 'スタート', 'START', false);
    arche(PISTE.xd, PISTE.zf, 7.5, 2.9, 'ゴール', 'FINISH', true);
    PISTE.portes.forEach((q, k) => {
      const c = k % 2 ? '#2f6ab0' : '#d8402c';
      for (const u of [-1, 1]) {
        const x = q.x + u * q.l, y = terrain(x, q.z);
        // (le fanion au-dessus de la tête d'un voyageur, 1,65 m : on passe dessous)
        a.baton([x, y - 0.3, q.z], [x, y + 2.1, q.z], 0.02, '#f4f2ea', 6);
        for (const s of [-1, 1]) a.boite(0.56, 0.4, 0.012, c, { x: x - u * 0.29, y: y + 1.86, z: q.z + s * 0.008, trait: false, nuance: 0.01 });
        monde.cercle(x, q.z, 0.26);
      }
    });
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Le coin de Bunbuku : contre la clôture sud, sous un pin, sa lanterne
  const LAMPION = { x: 0.9, z: 147.8 }; // (derrière lui, à sa gauche : à sa droite, son bambou barrait la vue des feux d'artifice)
  {
    const a = atelier(), y = terrain(LAMPION.x, LAMPION.z);
    a.baton([LAMPION.x, y - 0.2, LAMPION.z], [LAMPION.x, y + 2.2, LAMPION.z], 0.03, '#a89a5e', 6);
    a.chochin(LAMPION.x, y + 2.0, LAMPION.z - 0.04, 1.1);
    for (const [dx, dz, h, s] of [[-1.6, 6.2, 6.4, 1], [3.4, 6.0, 5.6, -1]]) pinVent(a, MARCHAND.x + dx, terrain(MARCHAND.x + dx, MARCHAND.z + dz), MARCHAND.z + dz, h, s);
    poser(a.fin(), 0, 0, { y: 0 });
    lumieres.push({ x: LAMPION.x, y: y + 2.0, z: LAMPION.z - 0.04, halo: 0.42, sol: y, r: 3.4 });
    monde.cercle(LAMPION.x, LAMPION.z, 0.27);
  }

  // ---------------------------------------------------------------- La pierre du poème d'Arishima Takeo (有島武郎), contre la clôture sud
  {
    const a = atelier(), { x, z } = POEME, y = terrain(x, z);
    a.boite(2.3, 0.3, 1.0, '#8a8880', { x, y: y + 0.05, z, nuance: 0.04 });
    a.piece(new THREE.BoxGeometry(1.5, 1.7, 0.42, 4, 5, 1), '#7f8078', { x, y: y + 1.0, z, nuance: 0.05, deformer: (px, py, pz) => { const k = 1 + 0.08 * Math.sin(py * 5 + px * 3); return [px * k + 0.04 * Math.sin(py * 9), py + 0.05 * Math.sin(px * 7), pz * k]; } });
    poser(a.fin(), 0, 0, { y: 0 });
    ecrire({ x, y, z: z - 0.262, ry: PI }, { texte: '浜坂の遠き砂丘のなかにして', sous: 'さびしき我を見出でけるかも', x: 0, y: 1.08, z: 0, l: 1.2, h: 0.72, fond: null, encre: '#2a2a28' });
    murRect(x, z, 1.15, 0.5);
  }

  // ---------------------------------------------------------------- Le grand lointain : 海士島 (l'îlot en forme de baleine), le cap d'Iwato, le Daisen, la côte qui file à l'ouest
  {
    const a = morceau(1000, 1000, 5000);
    ilotBaleine(THREE, a, 690, -640);
    // le Daisen, très loin, au sud-ouest (le vrai est à 65 km) : on ne voit que sa silhouette, pâlie par la brume
    a.piece(new THREE.ConeGeometry(1500, 270, 18, 5), '#6f7f92', { x: -3200, y: 120, z: -40, sx: 1.3, sz: 0.8, nuance: 0.02, deformer: (x, y, z) => { const t = Math.atan2(z, x), h = 0.5 - y; return [x, y + 0.03 * Math.sin(t * 5 + 1) * h + 0.02 * Math.sin(t * 11) * h, z]; } });
    a.piece(new THREE.ConeGeometry(900, 120, 14, 2), '#74859a', { x: -2400, y: 50, z: 120, sz: 0.7, nuance: 0.02 });
    // la côte, au-delà de la grille : une bande de sable, une bande de pins, jusque dans la brume
    const bande = (x0, x1, z0, z1, h, c) => {
      const pos = [x0, 0, z0, x0, h, z1, x1, 0, z0, x1, 0, z0, x0, h, z1, x1, h, z1], g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      a.piece(g, c, { nuance: 0 });
    };
    bande(-3900, -1590, -165, -142, 2.5, '#d4bb88');
    bande(-3900, -1590, -142, -60, 22, '#40603a');
    bande(-3900, -1590, -60, 500, 34, '#4a6a42');
    bande(1590, 3900, -440, -360, 40, '#40603a');
    bande(1590, 3900, -360, 500, 70, '#4a6a42');
    a.ovale(1, '#44604a', { x: 1620, y: 0, z: -470, sx: 420, sy: 62, sz: 120 }, 8);
  }

  // ---------------------------------------------------------------- Les morceaux : près, avec leur trait et leur ombre ; au loin, sans
  const finirDecor = () => { for (const [k, a] of morceaux) { const t = Number(k.split(':')[0]); poser(a.fin(), 0, 0, { y: 0, ...(t >= 100 ? { trait: false, ombre: false } : {}) }); } };

  // ---------------------------------------------------------------- La mer qui monte sur la plage (un voile d'eau qui court et se retire, son liseré d'écume)
  {
    const pos = [], hs = [], idx = [], X0 = -300, X1 = 300, PAS_X = 2.5, col = 6, D0 = -1.2, D1 = 10;
    for (let x = X0, i = 0; x <= X1; x += PAS_X, i++) {
      for (let j = 0; j < col; j++) {
        const dc = D0 + ((D1 - D0) * j) / (col - 1), z = zRivage(x) + dc, h = Math.max(-0.2, terrain(x, z));
        pos.push(x, Math.max(0.0, h) + 0.055, z); hs.push(h);
        if (i > 0 && j > 0) { const a = i * col + j, b = a - 1, c = a - col, d = c - 1; idx.push(a, c, b, b, c, d); }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('hauteur', new THREE.Float32BufferAttribute(hs, 1));
    g.setIndex(idx);
    const u = { temps: { value: 0 }, nuit: { value: 0 } };
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, uniforms: u,
      vertexShader: `attribute float hauteur; varying float vH; varying vec2 vP; void main() { vH = hauteur; vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        uniform float temps, nuit; varying float vH; varying vec2 vP;
        float b1(float x) { return 0.5 + 0.28 * sin(x * 0.043 + 1.3) + 0.22 * sin(x * 0.117 + 4.1 * sin(x * 0.013)); }
        // une vague : elle monte vite, se retire lentement ; sa phase dépend de l'endroit
        float front(float x, float dec) { float ph = fract(temps * 0.085 + b1(x + dec) * 0.55 + dec * 0.013); float f = ph < 0.26 ? sin(ph / 0.26 * 1.5708) : 1.0 - smoothstep(0.26, 1.0, ph); return f * (0.5 + 0.75 * b1(x * 1.7 + dec)); }
        void main() {
          float f1 = front(vP.x, 0.0), f2 = front(vP.x, 77.0), h = max(f1, f2) * 0.92 - 0.02;
          float e = h - vH;
          if (e < 0.0) discard;
          float lis = 1.0 - smoothstep(0.0, 0.05 + 0.02 * sin(vP.x * 1.3), e);
          float tache = 0.5 + 0.5 * sin(vP.x * 2.3 + vP.y * 3.1 + 1.7 * sin(vP.y * 1.1 + temps * 0.6));
          vec3 eau = mix(vec3(0.62, 0.92, 0.86), vec3(1.0), lis);
          float a = mix(0.42 + 0.1 * tache, 0.96, lis) * smoothstep(0.0, 0.015, e);
          vec3 c = mix(eau, eau * vec3(0.2, 0.26, 0.42), nuit);
          gl_FragColor = vec4(c, a);
          #include <colorspace_fragment>
        }`,
    });
    const o = new THREE.Mesh(g, m);
    o.renderOrder = 1;
    animes.push({ objet: o, maj(dt, temps, c) { u.temps.value = temps; u.nuit.value = c.nuit; return []; } });
  }

  // ---------------------------------------------------------------- Le sable qui file, au ras du sol, quand le vent souffle (飛砂) ; des grains, partout où l'on en a besoin
  const grains = (() => {
    const N = 760, pos = new Float32Array(N * 3), al = new Float32Array(N), parts = [];
    for (let k = 0; k < N; k++) { parts.push({ age: 9, vie: 1 }); pos[k * 3 + 1] = -100; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('alpha', new THREE.BufferAttribute(al, 1));
    const u = { echelle: { value: 1 }, couleur: { value: new THREE.Color('#ead3a0') }, nuit: { value: 0 } };
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, uniforms: u,
      vertexShader: `attribute float alpha; varying float vA; uniform float echelle; void main() { vA = alpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = max(1.4, echelle * 0.07 / max(0.5, -mv.z)); }`,
      fragmentShader: `varying float vA; uniform vec3 couleur; uniform float nuit; void main() { float d = length(gl_PointCoord - 0.5); if (d > 0.5 || vA <= 0.0) discard; vec3 c = mix(couleur, couleur * vec3(0.42, 0.5, 0.78), nuit); gl_FragColor = vec4(c, vA * (1.0 - smoothstep(0.2, 0.5, d)));
        #include <colorspace_fragment>
      }`,
    });
    const o = new THREE.Points(g, m);
    o.frustumCulled = false;
    o.renderOrder = 2;
    let libre = 0, temps0 = 0, deriver = 0;
    return {
      objet: o,
      emettre(x, y, z, n, { large = 0.4, haut = 0.5, vx = VENT[0] * 1.2, vz = VENT[1] * 1.2, vie = 1.2, alpha = 0.8 } = {}) {
        for (let k = 0; k < n; k++) {
          const q = parts[libre], t = Math.random() * 6.283, r = Math.random() * large;
          Object.assign(q, { age: 0, vie: vie * (0.6 + 0.6 * Math.random()), x: x + Math.cos(t) * r, y: y + Math.random() * haut * 0.4, z: z + Math.sin(t) * r, vx: vx + (Math.random() - 0.5) * 0.5, vy: haut * (0.4 + Math.random()), vz: vz + (Math.random() - 0.5) * 0.5, alpha });
          libre = (libre + 1) % N;
        }
      },
      maj(dt, temps, c) {
        u.echelle.value = innerHeight * (Math.min(devicePixelRatio, 2));
        u.nuit.value = c.nuit;
        // le vent : au ras du sol, autour du voyageur (par rafales ; plus fort sur les hauteurs)
        const j = c.joueur, f = 0.45 + 0.55 * Math.sin(temps * 0.23) * Math.sin(temps * 0.61 + 1.7) + (j.y > 30 ? 0.3 : 0);
        deriver += dt * Math.max(0, f) * 26;
        while (deriver > 1) {
          deriver -= 1;
          const qx = j.x + (Math.random() - 0.5) * 34 - VENT[0] * 6, qz = j.z + (Math.random() - 0.5) * 34 - VENT[1] * 6, sol = terrain(qx, qz);
          if (qx < 196 && qz - zRivage(qx) > 9) this.emettre(qx, sol + 0.03, qz, 1, { large: 0.1, haut: 0.1, vx: VENT[0] * 3.4, vz: VENT[1] * 3.4, vie: 1.7, alpha: 0.5 });
        }
        for (let k = 0; k < N; k++) {
          const q = parts[k];
          if (q.age >= q.vie) { if (al[k] !== 0) al[k] = 0; continue; }
          q.age += dt;
          q.vy -= 1.4 * dt;
          q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
          const f2 = q.age / q.vie;
          pos[k * 3] = q.x; pos[k * 3 + 1] = q.y; pos[k * 3 + 2] = q.z;
          al[k] = q.alpha * Math.min(1, f2 * 8) * (1 - f2);
        }
        g.attributes.position.needsUpdate = true;
        g.attributes.alpha.needsUpdate = true;
        return [];
      },
    };
  })();
  animes.push(grains);

  // ---------------------------------------------------------------- Le parapente violet (comme dans le film) : il tourne lentement au-dessus de la grande pente
  let PARAPENTE = null;
  {
    const a = atelier(), W = 3.8, cases = 9;
    for (let k = 0; k < cases; k++) {
      const t0 = -1 + (k / cases) * 2, t1 = -1 + ((k + 1) / cases) * 2, y0 = 1 - t0 * t0, y1 = 1 - t1 * t1;
      a.boite(Math.hypot(t1 - t0, 0) * W + 0.02, 0.14, 1.5, k % 2 ? '#7a3ab0' : '#8e4ec8', { x: ((t0 + t1) / 2) * W, y: 3.6 + 0.55 * (y0 + y1), z: 0, rz: Math.atan2((y1 - y0) * 1.1, (t1 - t0) * W), nuance: 0.02 });
    }
    for (const t of [-0.95, -0.5, 0.5, 0.95]) a.baton([t * W, 3.6 + 1.1 * (1 - t * t), 0], [0, 0.65, 0], 0.006, '#e8e8e2', 3, { trait: false });
    a.boite(0.3, 0.46, 0.22, '#2a2a30', { y: 0.4 }).ovale(0.13, '#f4c8a0', { y: 0.72 }, 7).ovale(0.145, '#e8452e', { y: 0.76 }, 7).boite(0.34, 0.1, 0.5, '#3a3a44', { y: 0.2, z: 0.12 });
    const o = ctx.perso.maillage(a.fin(0, false));
    PARAPENTE = o;
    let t = 0;
    animes.push({
      objet: o,
      maj(dt, temps) {
        t += dt * 0.026;
        const x = 38 + 128 * Math.cos(t), z = -118 + 22 * Math.sin(t), ang = Math.atan2(-128 * Math.sin(t), 22 * Math.cos(t));
        o.position.set(x, Math.max(terrain(x, z), 8) + 14 + 3 * Math.sin(t * 3.1), z);
        o.rotation.set(0, ang, Math.sin(t) * 0.14 * Math.cos(t * 3));
        return [];
      },
    });
  }

  // ---------------------------------------------------------------- Les petits crabes de la plage (スナガニ) : ils filent de côté, et disparaissent dans leur trou quand on approche
  {
    const a = atelier();
    a.ovale(0.05, '#d8c49a', { y: 0.05, sx: 1.25, sy: 0.55 }, 6);
    for (const u of [-1, 1]) {
      a.ovale(0.016, '#2a2420', { x: u * 0.022, y: 0.09, z: 0.04, trait: false }, 4).ovale(0.022, '#c8b48a', { x: u * 0.07, y: 0.04, z: 0.035, trait: false }, 4);
      for (const dz of [-0.03, 0, 0.03]) a.baton([u * 0.045, 0.05, dz], [u * 0.09, 0.005, dz * 1.4], 0.005, '#c8b48a', 3, { trait: false });
    }
    const crabes = [];
    const groupe = new THREE.Group(), f = a.fin(0, false);
    for (let k = 0; k < 14; k++) {
      const x = -210 + 30 * k + 12 * hasard(k, 3), z = zRivage(x) + 8.5 + 6 * hasard(k, 5);
      const m = ctx.perso.maillage(f);
      m.scale.setScalar(1.25);
      groupe.add(m);
      crabes.push({ m, x, z, trou: [x, z], pause: 1 + 4 * hasard(k, 7), vx: 0, vz: 0, cache: 0, cap: hasard(k, 9) * 6 });
    }
    animes.push({
      objet: groupe,
      maj(dt, temps, c) {
        const j = c.joueur;
        if (Math.abs(j.z + 150) > 40) { groupe.visible = false; return []; }
        groupe.visible = true;
        for (const q of crabes) {
          const d = Math.hypot(j.x - q.x, j.z - q.z);
          if (q.cache > 0) { q.cache -= dt; q.m.visible = false; if (q.cache <= 0) { q.m.visible = true; q.x = q.trou[0]; q.z = q.trou[1]; } continue; }
          if (d < 3.4) {
            // au trou !
            const dx = q.trou[0] - q.x, dz = q.trou[1] - q.z, l = Math.hypot(dx, dz);
            if (l < 0.2) { q.cache = 5 + 5 * Math.random(); continue; }
            q.x += (dx / l) * 3.2 * dt; q.z += (dz / l) * 3.2 * dt;
          } else if ((q.pause -= dt) <= 0) {
            q.pause = 1.4 + 3.4 * Math.random();
            const t = Math.random() * 6.28, l = 0.5 + Math.random() * 1.2;
            q.vx = Math.cos(t) * l / 0.5; q.vz = Math.sin(t) * l / 0.5; q.vt = 0.5;
            q.cap = t + PI / 2;
          }
          if (q.vt > 0) { q.vt -= dt; const nx = q.x + q.vx * dt, nz = q.z + q.vz * dt; if (Math.hypot(nx - q.trou[0], nz - q.trou[1]) < 5) { q.x = nx; q.z = nz; } }
          q.m.position.set(q.x, terrain(q.x, q.z) + 0.03, q.z);
          q.m.rotation.y = q.cap;
        }
        return [];
      },
    });
    // (les trous, de petites taches sombres)
    const t = atelier();
    for (const q of crabes) t.ovale(0.075, '#8a7650', { x: q.x, y: terrain(q.x, q.z) + 0.045, z: q.z, sy: 0.04, trait: false }, 6);
    poser(t.fin(), 0, 0, { y: 0, ombre: false });
  }

  // ---------------------------------------------------------------- La nuit : la lune, immense et basse, à l'ouest-nord-ouest, juste au-dessus de la crête ; les lumières des bateaux (いさり火) sur la mer
  const DIR_LUNE = (() => { const v = [-0.93, 0.3, -0.36], l = Math.hypot(...v); return v.map((c) => c / l); })();
  {
    const R = 230, g = new THREE.PlaneGeometry(R * 3.4, R * 3.4), u = { nuit: { value: 0 } };
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, fog: false, uniforms: u,
      vertexShader: 'varying vec2 vP; void main() { vP = uv * 2.0 - 1.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `
        uniform float nuit; varying vec2 vP;
        float h(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
        float br(vec2 p) { vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), u.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), u.x), u.y); }
        void main() {
          float r = length(vP) * 3.4 / 2.0 / 0.85;
          float disque = 1.0 - smoothstep(0.985, 1.0, r / 1.0);
          float mers = br(vP * 5.0 + 3.1) * 0.6 + br(vP * 11.0) * 0.4;
          vec3 c = mix(vec3(1.0, 0.97, 0.84), vec3(0.83, 0.79, 0.66), smoothstep(0.42, 0.66, mers));
          float halo = pow(max(0.0, 1.0 - (r - 1.0) / 0.95), 3.0) * 0.42;
          vec3 ch = vec3(0.72, 0.78, 0.96);
          gl_FragColor = vec4(mix(ch, c, disque), max(disque, halo) * nuit);
          #include <colorspace_fragment>
        }`,
    });
    const o = new THREE.Mesh(g, m), D = 2900;
    o.position.set(DIR_LUNE[0] * D, DIR_LUNE[1] * D, DIR_LUNE[2] * D);
    o.lookAt(0, 0, 0);
    o.frustumCulled = false;
    animes.push({ objet: o, maj(dt, temps, c) { u.nuit.value = lisse(0.45, 0.95, c.nuit); o.visible = c.nuit > 0.3; return []; } });
    // les lumières des bateaux, loin sur la mer : de petits points blancs qui tremblent
    const pos = [], n = 18;
    for (let k = 0; k < n; k++) pos.push(-900 + 2300 * hasard(k, 1), 2, -1300 - 900 * hasard(k, 2));
    const gb = new THREE.BufferGeometry();
    gb.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const ub = { nuit: { value: 0 }, temps: { value: 0 }, echelle: { value: 1 } };
    const mb = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, uniforms: ub,
      vertexShader: 'uniform float temps, echelle; varying float vT; void main() { vT = 0.7 + 0.3 * sin(temps * 2.1 + position.x); vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = echelle * 2.6; }',
      fragmentShader: 'uniform float nuit; varying float vT; void main() { float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(vec3(1.0, 0.98, 0.86) * (1.0 - smoothstep(0.05, 0.5, d)) * vT * nuit, 1.0); }',
    });
    const ob = new THREE.Points(gb, mb);
    ob.frustumCulled = false;
    animes.push({ objet: ob, maj(dt, temps, c) { ub.nuit.value = lisse(0.5, 0.95, c.nuit); ub.temps.value = temps; ub.echelle.value = Math.min(devicePixelRatio, 2); ob.visible = c.nuit > 0.3; return []; } });
  }

  // ---------------------------------------------------------------- Les gens
  const PEAU = P.peau, NOIR = '#2a2420', CH = '#3a2a22', BLANC = P.blanc, SEM = '#3a3236', yF = Y_ROUTE + 0.02;
  const ZC = (x) => zCrete(x);
  const passants = [
    { id: 'chauffeur', x: 227.4, z: 36.2, cap: -PI / 2, tenue: { taille: 1.02, peau: '#e8bf98', cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'casquette', c: '#2a3550', c2: '#2a3550' }, haut: '#f4f2ea', manches: 'longues', bas: { sorte: 'pantalon', c: '#2a3550' }, chaussures: '#2a2a30', semelle: SEM } },
    { id: 'garde', x: 247.6, z: -21.0, cap: -PI / 2, tenue: { taille: 1.04, peau: '#e0b48c', cheveux: '#3a3a3a', coiffure: 'court', chapeau: { sorte: 'bob', c: '#4a5a3a' }, haut: '#5a6a4a', manches: 'longues', bas: { sorte: 'pantalon', c: '#3f4a38' }, chaussures: '#3a3236', semelle: SEM } },
    { id: 'vendeuseR', x: 251.45, z: 40.0, cap: -PI / 2, tenue: { taille: 0.94, peau: '#f0c8a6', cheveux: CH, coiffure: 'chignon', chapeau: { sorte: 'foulard', c: '#c8402c' }, haut: '#f4efe2', manches: 'longues', tablier: '#c8402c', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: '#3a3236', semelle: SEM } },
    { id: 'vendeuseF', x: 251.45, z: 57.0, cap: -PI / 2, tenue: { taille: 1.0, peau: '#e8bf98', cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'bandeau', c: '#2f6a9a' }, haut: '#f4efe2', manches: 'courtes', tablier: '#2f6a9a', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: '#3a3236', semelle: SEM } },
    { id: 'kaikan', x: 267.3, z: 7.2, cap: -PI / 2, tenue: { taille: 0.92, peau: '#f0c8a6', cheveux: '#5a5650', coiffure: 'chignon', haut: '#f4efe2', manches: 'longues', tablier: '#3a6a5a', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: '#3a3236', semelle: SEM, yeux: 'plisses' } },
    { id: 'serveuse', x: 262.4, z: 17.6, cap: -PI / 2, ronde: [[262.4, 17.6], [262.4, 25.6]], vitesse: 0.55, attente: [5, 10], tenue: { taille: 0.94, peau: '#f2c9a8', cheveux: CH, coiffure: 'queue', chapeau: { sorte: 'bandeau', c: '#c8402c' }, haut: '#f4efe2', manches: 'courtes', tablier: '#c8402c', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: '#3a3236', semelle: SEM } },
    { id: 'cuisinier', x: 267.6, z: 19.0, cap: PI / 2, tenue: { taille: 1.04, peau: '#e8bf98', cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'bandeau', c: '#f4f0e6' }, haut: '#f4f0e6', manches: 'longues', tablier: '#3a3a44', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: '#3a3236', semelle: SEM } },
    { id: 'dineur', x: 254.86, z: 15.58, cap: 0, assis: yF + 0.47, tenue: { taille: 1.04, peau: PEAU, cheveux: NOIR, coiffure: 'court', haut: '#c8783a', manches: 'courtes', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: '#3a3236', semelle: SEM } },
    { id: 'dineuse', x: 259.94, z: 22.22, cap: PI, assis: yF + 0.47, tenue: { taille: 0.95, peau: '#f2c9a8', cheveux: '#5a3a28', coiffure: 'queue', haut: '#e8a0a8', manches: 'courtes', bas: { sorte: 'jupe', c: '#3a4a6a' }, chaussures: BLANC, semelle: SEM } },
    { id: 'chamelier', x: 170.6, z: 29.6, cap: -2.3, tenue: { taille: 1.06, peau: '#d8a07a', cheveux: '#5a5650', coiffure: 'court', chapeau: { sorte: 'paille', c: '#d8c088', c2: '#7a3a26' }, haut: '#7a3a26', manches: 'longues', bas: { sorte: 'pantalon', c: '#4a4a56' }, chaussures: '#3a3236', semelle: SEM } },
    { id: 'moniteur', x: PLANCHES.x, z: PLANCHES.z, cap: PI, tenue: { taille: 1.04, peau: '#d8a880', cheveux: CH, coiffure: 'court', chapeau: { sorte: 'casquette', c: '#e8452e', c2: '#2a2a30' }, haut: '#2f6ab0', manches: 'courtes', bas: { sorte: 'short', c: '#2a2a30' }, chaussures: '#e8452e', semelle: SEM } },
    { id: 'naturaliste', x: OASIS.x - 8.4, z: OASIS.z + OASIS.rz + 4.4, cap: 0.9 + PI, tenue: { taille: 0.96, peau: '#f0c8a6', cheveux: CH, coiffure: 'chignon', chapeau: { sorte: 'bob', c: '#c8b48a' }, haut: '#5a7a4a', manches: 'longues', bas: { sorte: 'pantalon', c: '#6a5a44' }, chaussures: '#3a3236', semelle: SEM, lunettes: true, sac: { sorte: 'dos', c: '#6a5a44', c2: '#4a3a2a' } }, quand: 'jour' },
    { id: 'videaste', x: SOMMET.x - 6.6, z: ZC(33.4) + 2.4, cap: 2.4, tenue: { taille: 1.1, peau: PEAU, cheveux: '#3a2a20', coiffure: 'court', chapeau: { sorte: 'bob', c: '#2f3440' }, haut: '#2f3440', manches: 'courtes', bas: { sorte: 'pantalon', c: '#c9b48a' }, chaussures: BLANC, semelle: SEM }, quand: 'jour' },
    { id: 'amoureuse', x: 14.0, z: ZC(14) + 0.8, cap: PI + 0.2, tenue: { taille: 0.95, peau: '#f2c9a8', cheveux: CH, coiffure: 'queue', chapeau: { sorte: 'soleil', c: '#f4efe2' }, haut: '#e88aa0', manches: 'courtes', bas: { sorte: 'jupe', c: '#f4efe2' }, chaussures: BLANC, semelle: SEM }, quand: 'jour' },
    { id: 'amoureux', x: 15.4, z: ZC(15.4) + 1.1, cap: PI - 0.3, tenue: { taille: 1.06, peau: PEAU, cheveux: NOIR, coiffure: 'court', haut: '#f4f2ea', manches: 'courtes', bas: { sorte: 'pantalon', c: '#3a4a6a' }, chaussures: '#3a3236', semelle: SEM }, quand: 'jour' },
    { id: 'enfant', x: 92, z: 36, cap: -1.0, tenue: { taille: 0.68, peau: PEAU, cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'ecolier', c: '#f2c443' }, haut: '#e8583e', manches: 'courtes', bas: { sorte: 'short', c: '#3d5a8f' }, chaussures: BLANC, semelle: SEM, yeux: 'plisses' }, quand: 'jour' },
    { id: 'maman', x: 94.6, z: 37.8, cap: -1.0, tenue: { taille: 0.96, peau: '#f2c9a8', cheveux: CH, coiffure: 'chignon', chapeau: { sorte: 'soleil', c: '#e8d8b8' }, haut: '#8ac4e8', manches: 'longues', bas: { sorte: 'pantalon', c: '#4a4a56' }, chaussures: BLANC, semelle: SEM }, quand: 'jour' },
    { id: 'pilote', x: -30, z: ZC(-30) - 9, cap: PI, tenue: { taille: 1.04, peau: '#d8a880', cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'casquette', c: '#7a3ab0', c2: '#2a2a30' }, haut: '#7a3ab0', manches: 'longues', bas: { sorte: 'pantalon', c: '#2a2a30' }, chaussures: '#3a3236', semelle: SEM, lunettes: true }, quand: 'jour' },
    { id: 'pecheur', x: -46, z: zRivage(-46) + 3.6, cap: PI + 0.2, fixe: true, tenue: { pose: 'peche', ligne: { loin: 12, bas: 1.4 }, taille: 1.0, peau: '#d8a880', cheveux: '#5a5650', coiffure: 'court', chapeau: { sorte: 'casquette', c: '#3a5a7a', c2: '#3a5a7a' }, haut: '#e8e4dc', manches: 'longues', tablier: '#3a5a4a', bas: { sorte: 'pantalon', c: '#3a4a5a' }, chaussures: '#2f3a44', semelle: SEM } },
    { id: 'sculpteur', x: 244.0, z: 107.8, cap: 2.1, tenue: { taille: 1.06, peau: '#e0b48c', cheveux: '#8a8478', coiffure: 'court', chapeau: { sorte: 'bandeau', c: '#3a3a44' }, haut: '#e8e0cc', manches: 'longues', tablier: '#8a7a5a', bas: { sorte: 'pantalon', c: '#5a5040' }, chaussures: '#5a5040', semelle: SEM } },
    { id: 'accueil', x: 240.4, z: 99.4, cap: 0.4, tenue: { taille: 0.95, peau: '#f2c9a8', cheveux: NOIR, coiffure: 'chignon', haut: '#2f4a6a', manches: 'longues', bas: { sorte: 'jupe', c: '#2f3a4a' }, chaussures: '#2a2a30', semelle: SEM } },
    { id: 'visiteur', x: 254.2, z: 96.6, cap: PI + 0.2, tenue: { taille: 1.05, peau: PEAU, cheveux: '#5a5650', coiffure: 'court', haut: '#6a7a9a', manches: 'longues', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: '#3a3236', semelle: SEM, appareil: true } },
    { id: 'visiteuse', x: 257.2, z: 112.4, cap: 1.5, tenue: { taille: 0.9, peau: '#f0c8a6', cheveux: '#d8d4cc', coiffure: 'chignon', haut: '#a86a8a', manches: 'longues', bas: { sorte: 'pantalon', c: '#4a4a56' }, chaussures: '#3a3236', semelle: SEM } },
    { id: 'galerie', x: 257, z: 118.0, cap: PI, y: yF + GALERIE.h, tenue: { taille: 1.0, peau: '#f2c9a8', cheveux: CH, coiffure: 'queue', chapeau: { sorte: 'bob', c: '#e8a42a' }, haut: '#d8402c', manches: 'longues', bas: { sorte: 'pantalon', c: '#2f3a5a' }, chaussures: BLANC, semelle: SEM } },
    // le télésiège : ses deux préposés ; le Sakyu Center ; sa terrasse
    { id: 'liftBas', x: 189.4, z: 65.2, cap: PI / 2, tenue: { taille: 1.04, peau: '#e8bf98', cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'casquette', c: '#2a4a7a', c2: '#2a4a7a' }, haut: '#2a4a7a', manches: 'longues', bas: { sorte: 'pantalon', c: '#2a2a34' }, chaussures: '#2a2a30', semelle: SEM } },
    { id: 'liftHaut', x: 343.8, z: 74.7, cap: -PI / 2, tenue: { taille: 0.96, peau: '#f2c9a8', cheveux: CH, coiffure: 'queue', chapeau: { sorte: 'casquette', c: '#2a4a7a', c2: '#2a4a7a' }, haut: '#2a4a7a', manches: 'longues', bas: { sorte: 'pantalon', c: '#2a2a34' }, chaussures: '#2a2a30', semelle: SEM } },
    { id: 'centreCaisse', x: 372.95, z: 41, cap: -PI / 2, tenue: { taille: 0.94, peau: '#f0c8a6', cheveux: NOIR, coiffure: 'chignon', haut: '#f4efe2', manches: 'longues', tablier: '#c8402c', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: '#3a3236', semelle: SEM } },
    { id: 'centreClient', x: 360.66, z: 51.98, cap: 0, assis: GARE_H.F + 0.47, tenue: { taille: 1.04, peau: PEAU, cheveux: '#5a5650', coiffure: 'court', haut: '#6a8a5a', manches: 'courtes', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: '#3a3236', semelle: SEM } },
    { id: 'centreServeuse', x: 368.5, z: 56.4, cap: -PI / 2, tenue: { taille: 0.94, peau: '#f2c9a8', cheveux: NOIR, coiffure: 'queue', chapeau: { sorte: 'bandeau', c: '#2a4a7a' }, haut: '#f4efe2', manches: 'courtes', tablier: '#2a4a7a', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: '#3a3236', semelle: SEM } },
    { id: 'centreCliente', x: 362.4, z: 40.72, cap: 0, tenue: { taille: 0.92, peau: '#f0c8a6', cheveux: '#d8d4cc', coiffure: 'chignon', haut: '#8a6a9a', manches: 'longues', bas: { sorte: 'pantalon', c: '#4a4a56' }, chaussures: '#3a3236', semelle: SEM, sac: { sorte: 'dos', c: '#6a7a5a', c2: '#4a5a3a' } } },
    { id: 'kaikanCliente', x: 257.5, z: -0.6, cap: PI, tenue: { taille: 0.96, peau: '#f2c9a8', cheveux: '#3a2a22', coiffure: 'queue', chapeau: { sorte: 'soleil', c: '#e8d8b8' }, haut: '#6a9ac4', manches: 'courtes', bas: { sorte: 'jupe', c: '#e8e0cc' }, chaussures: BLANC, semelle: SEM } },
    { id: 'toitPhoto', x: 372.4, z: 33.4, cap: PI + 0.5, y: TOIT.y, tenue: { taille: 1.04, peau: PEAU, cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'casquette', c: '#3a5a7a', c2: '#3a5a7a' }, haut: '#c8783a', manches: 'courtes', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: '#3a3236', semelle: SEM, appareil: true } },
    { id: 'vieuxHaut', x: 339.8, z: 43.2, cap: -2.0, tenue: { taille: 0.92, peau: '#e0b48c', cheveux: '#d8d4cc', coiffure: 'court', chapeau: { sorte: 'paille', c: '#d8c088', c2: '#3a3a44' }, haut: '#8a7a5a', manches: 'longues', bas: { sorte: 'pantalon', c: '#4a4a56' }, chaussures: '#3a3236', semelle: SEM } },
    { id: 'filleHaut', x: 342.4, z: 40.4, cap: PI - 0.3, tenue: { taille: 0.95, peau: '#f2c9a8', cheveux: '#5a3a28', coiffure: 'queue', chapeau: { sorte: 'soleil', c: '#f4efe2' }, haut: '#e8a0a8', manches: 'courtes', bas: { sorte: 'jupe', c: '#f4efe2' }, chaussures: '#c8a080', semelle: SEM } },
    // ceux qui marchent : de l'entrée à l'oasis, de l'oasis à la crête, le long de la crête, sur la plage (leurs rondes loin de ce qu'on vient voir)
    { id: 'marcheur', x: 186, z: 44, cap: -1.6, ronde: [[186, 44], [140, 52, true], [84, 54, true], [62, 44]], vitesse: 1.15, attente: [8, 16], tenue: { taille: 1.0, peau: '#f2c9a8', cheveux: CH, coiffure: 'court', chapeau: { sorte: 'bob', c: '#e8d8b8' }, haut: '#4a8ab0', manches: 'courtes', bas: { sorte: 'short', c: '#5a5040' }, chaussures: BLANC, semelle: SEM, sac: { sorte: 'dos', c: '#c8402c', c2: '#8a2a1e' } }, quand: 'jour' },
    { id: 'grimpeur', x: -2, z: 12, cap: PI, ronde: [[-2, 12], [-6, ZC(-6) + 22, true], [-8, ZC(-8) + 3]], vitesse: 0.75, attente: [10, 18], tenue: { taille: 1.04, peau: PEAU, cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'casquette', c: '#3a6a4a', c2: '#3a6a4a' }, haut: '#3a6a8a', manches: 'courtes', bas: { sorte: 'pantalon', c: '#c9b48a' }, chaussures: '#3a3236', semelle: SEM }, quand: 'jour' },
    { id: 'randonneuse', x: 66, z: ZC(66) + 1.6, cap: -1.5, ronde: [[66, ZC(66) + 1.6], [100, ZC(100) + 1.6]], vitesse: 0.85, attente: [7, 14], tenue: { taille: 0.96, peau: '#f2c9a8', cheveux: '#5a3a28', coiffure: 'queue', chapeau: { sorte: 'soleil', c: '#f4efe2' }, haut: '#f2c443', manches: 'courtes', bas: { sorte: 'pantalon', c: '#3a4a6a' }, chaussures: BLANC, semelle: SEM }, quand: 'jour' },
    { id: 'plagiste', x: 104, z: zRivage(104) + 11, cap: 1.6, ronde: [[104, zRivage(104) + 11], [168, zRivage(168) + 11]], vitesse: 0.8, attente: [8, 15], tenue: { taille: 1.0, peau: '#e8bf98', cheveux: NOIR, coiffure: 'queue', chapeau: { sorte: 'soleil', c: '#e8c8a0' }, haut: '#f4efe2', manches: 'courtes', bas: { sorte: 'short', c: '#2f6ab0' }, chaussures: '#e8a42a', semelle: SEM }, quand: 'jour' },
    { id: 'vieux', x: -188, z: 8, cap: 1.0, ronde: [[-188, 8], [-152, 24]], vitesse: 0.55, attente: [10, 18], tenue: { taille: 0.92, peau: '#e0b48c', cheveux: '#d8d4cc', coiffure: 'court', chapeau: { sorte: 'paille', c: '#d8c088', c2: '#4a4a56' }, haut: '#6a7a6a', manches: 'longues', bas: { sorte: 'pantalon', c: '#4a4a56' }, chaussures: '#3a3236', semelle: SEM, canne: true }, quand: 'jour' },
  ];

  // ---------------------------------------------------------------- Les chameaux : deux à l'abri, à l'auge ; celui qu'on monte, à côté de l'escalier de métal, son guide à sa tête
  const persoCtx = ctx.perso;
  const groupeChameaux = new THREE.Group();
  const C1 = creerChameau(persoCtx), C2 = creerChameau(persoCtx, { pelage: { base: '#a87c4a', fonce: '#7f5a34', clair: '#c49c68', laine: '#6e4c2c', nez: '#4f3826' } });
  C1.objet.position.set(ABRI.x + 3.2, terrain(ABRI.x + 3.2, ABRI.z - 0.4), ABRI.z - 0.1); C1.objet.rotation.y = PI;
  C2.objet.position.set(ABRI.x - 0.4, terrain(ABRI.x - 0.4, ABRI.z - 0.4), ABRI.z - 0.1); C2.objet.rotation.y = PI;
  murRect(ABRI.x + 3.2, ABRI.z - 0.1, 0.42, 1.15); murRect(ABRI.x - 0.4, ABRI.z - 0.1, 0.42, 1.15);
  const MONTURE = creerChameau(persoCtx, { harnais: true, pelage: { base: '#c4965e', fonce: '#9a6f40', clair: '#dcb480', laine: '#8a6036', nez: '#5a3f2a' } });
  groupeChameaux.add(C1.objet, C2.objet, MONTURE.objet);
  const POSE_M = (() => {
    // (le chameau à l'arrêt, son flanc droit contre la plate-forme de l'escalier)
    const q = MONTEE.haut, ry = MONTEE.ry, cap = ry - PI / 2 + PI, dx = Math.sin(ry) * 0.92, dz = Math.cos(ry) * 0.92;
    return { x: q.x + dx, z: q.z + dz, cap: cap };
  })();
  // le tour à dos de chameau : vers l'ouest, une grande boucle dans le sable, et retour ; le guide marche devant
  const BOUCLE = [[POSE_M.x, POSE_M.z], [POSE_M.x - 8, POSE_M.z - 7], [POSE_M.x - 24, POSE_M.z - 9], [POSE_M.x - 40, POSE_M.z - 2], [POSE_M.x - 46, POSE_M.z + 9], [POSE_M.x - 38, POSE_M.z + 18], [POSE_M.x - 20, POSE_M.z + 18], [POSE_M.x - 7, POSE_M.z + 12], [POSE_M.x, POSE_M.z]];
  const lBoucle = [0];
  for (let k = 1; k < BOUCLE.length; k++) lBoucle.push(lBoucle[k - 1] + Math.hypot(BOUCLE[k][0] - BOUCLE[k - 1][0], BOUCLE[k][1] - BOUCLE[k - 1][1]));
  const surBoucle = (s) => {
    let i = 0;
    while (i < BOUCLE.length - 2 && s > lBoucle[i + 1]) i++;
    const f = Math.min(1, (s - lBoucle[i]) / (lBoucle[i + 1] - lBoucle[i])), p0 = BOUCLE[Math.max(0, i - 1)], p1 = BOUCLE[i], p2 = BOUCLE[i + 1], p3 = BOUCLE[Math.min(BOUCLE.length - 1, i + 2)];
    const cr = (a, b, c, d) => 0.5 * (2 * b + (c - a) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (3 * b - a - 3 * c + d) * f * f * f);
    return [cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])];
  };
  const ride = { actif: false, s: 0, x: POSE_M.x, z: POSE_M.z, cap: POSE_M.cap, y: terrain(POSE_M.x, POSE_M.z), siege: { x: POSE_M.x, z: POSE_M.z, y: 0, cap: POSE_M.cap, libre: false }, fin: null, v: 0 };
  monde.mur(POSE_M.x - Math.sin(POSE_M.cap) * 1, POSE_M.z - Math.cos(POSE_M.cap) * 1, POSE_M.x + Math.sin(POSE_M.cap) * 1, POSE_M.z + Math.cos(POSE_M.cap) * 1, 0.7);
  const guide = creerPersonnage(persoCtx, { taille: 0.98, peau: '#d8a880', cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'bandeau', c: '#c8402c' }, haut: '#3a5a7a', manches: 'longues', bas: { sorte: 'pantalon', c: '#4a4a56' }, chaussures: '#3a3236', semelle: SEM });
  groupeChameaux.add(guide.objet);
  const vitesseRide = 1.5;
  animes.push({
    objet: groupeChameaux,
    maj(dt, temps, c) {
      const j = c.joueur, pres = Math.hypot(j.x - ABRI.x, j.z - ABRI.z) < 90;
      groupeChameaux.visible = pres || ride.actif;
      if (!groupeChameaux.visible) return [];
      C1.animer(dt, 0, temps); C2.animer(dt, 0, temps);
      if (ride.actif) {
        ride.s += dt * vitesseRide;
        const L = lBoucle[lBoucle.length - 1], [x, z] = surBoucle(Math.min(ride.s, L)), [xa, za] = surBoucle(Math.min(ride.s + 0.6, L));
        if (Math.hypot(xa - x, za - z) > 0.02) ride.cap = tournerVers(ride.cap, Math.atan2(xa - x, za - z), dt * 2.6);
        ride.x = x; ride.z = z; ride.y = terrain(x, z);
        const dg = surBoucle(Math.min(ride.s + 3.4, L));
        guide.objet.position.set(dg[0], yDessine(dg[0], dg[1]), dg[1]);
        guide.objet.rotation.y = ride.cap;
        guide.animer(dt, vitesseRide, temps);
        if (ride.s >= L) {
          ride.actif = false;
          const fin = ride.fin; ride.fin = null;
          if (fin) fin();
        }
      } else {
        ride.cap = tournerVers(ride.cap, POSE_M.cap, dt * 3);
        // (à la tête du chameau ; la hauteur du sable sous ses pieds à lui : lue à côté, sur la pente, il flottait)
        const gx = POSE_M.x + Math.sin(POSE_M.cap) * 2.0 + Math.cos(POSE_M.cap) * 0.75, gz = POSE_M.z + Math.cos(POSE_M.cap) * 2.0 - Math.sin(POSE_M.cap) * 0.75;
        guide.objet.position.set(gx, yDessine(gx, gz), gz);
        guide.objet.rotation.y = POSE_M.cap + PI + 0.5;
        guide.animer(dt, 0, temps);
      }
      MONTURE.animer(dt, ride.actif ? vitesseRide : 0, temps);
      MONTURE.objet.position.set(ride.x, ride.y, ride.z);
      MONTURE.objet.rotation.y = ride.cap;
      // (l'assise suit le roulis du chameau, le voyageur est collé à elle et penche avec elle. 2026-11-03, « il bouge de droite à gauche » : il glissait sur l'assise, poussé à l'opposé d'elle)
      const cc = MONTURE.corps, dx = -Math.sin(cc.rotation.z) * MONTURE.siege;
      Object.assign(ride.siege, { x: ride.x + Math.cos(ride.cap) * dx, z: ride.z - Math.sin(ride.cap) * dx, y: ride.y + Math.cos(cc.rotation.z) * MONTURE.siege + cc.position.y, cap: ride.cap, roulis: cc.rotation.z });
      return [];
    },
  });

  // ---------------------------------------------------------------- La planche de sable (サンドボード) : on descend la grande pente vers la mer, le compagnon assis devant
  const planche = (() => {
    const a = atelier();
    plancheSable(THREE, a, ['#e8452e', '#f4efe2', '#2a2a30'], { y: 0.03 }, 1, 0);
    const o = ctx.perso.maillage(a.fin(0, false));
    o.visible = false;
    return o;
  })();
  const conduite = {
    actif: false, vx: 0, vz: 0, cap: PI, spray: 0, son: 0, fin: null, vire: 0, jeu: null, decompte: 0, t: 0, fini: null, ratees: 0, passees: 0, prochaine: 0, affiche: 0, age: 0, autre: null,
    demarrer(jeu, cap, fin) {
      Object.assign(this, { actif: true, vx: 0, vz: 0, cap, fin, vire: 0, spray: 0, son: 0, jeu, decompte: 2.1, t: 0, fini: null, ratees: 0, passees: 0, prochaine: 0, affiche: 0, age: 0 });
      jeu.son('oiseau/top');
    },
    maj(dt, pousse, vire, etat, cam, renard) {
      // (les jumelles du toit, un autre petit jeu : le joystick y tourne le regard)
      if (this.autre) return this.autre(dt, pousse, vire, etat, cam, renard);
      const x = etat.x, z = etat.z, e = 0.7, jeu = this.jeu;
      const gx = (terrain(x + e, z) - terrain(x - e, z)) / (2 * e), gz = (terrain(x, z + e) - terrain(x, z - e)) / (2 * e), pente = Math.hypot(gx, gz);
      // le compte à rebours : la planche attend, on peut déjà viser
      if (this.decompte > 0) {
        const n0 = Math.ceil(this.decompte / 0.7);
        this.decompte -= dt;
        const n1 = Math.ceil(this.decompte / 0.7);
        if (this.decompte <= 0) jeu.son('oiseau/depart');
        else if (n1 !== n0) jeu.son('oiseau/top');
        jeu.chrono(`<b>${this.decompte > 0 ? n1 : jeu.tx('chronoPartez')}</b>${enTete(jeu)}`);
      } else {
        this.t += dt;
        // (le chrono s'arrête à la ligne ; il se met à jour douze fois par seconde)
        if (!this.fini && (this.affiche -= dt) <= 0) {
          this.affiche = 0.08;
          jeu.chrono(`<b>${chiffres(this.t)}</b><small>${jeu.tx('chronoPortes')} ${this.passees}/${PISTE.portes.length}${this.ratees ? ` · <span class="rate">+${this.ratees * PENALITE} s</span>` : ''}</small>`);
        }
      }
      this.vire += (vire - this.vire) * Math.min(1, dt * 5);
      // (vire > 0 : vers la droite de l'écran ; le cap, lui, grandit vers la gauche : à droite, il baisse. Le signe inverse faisait tourner la planche à l'envers des flèches)
      this.cap -= this.vire * dt * 1.5;
      const dx = Math.sin(this.cap), dz = Math.cos(this.cap);
      // la pente pousse (et un peu moins en travers) ; le sable freine ; la planche glisse surtout dans son axe
      const k = this.decompte > 0 ? 0 : 8.2 / Math.hypot(1, pente);
      let vx = this.vx - gx * k * dt, vz = this.vz - gz * k * dt;
      // (la ligne passée, le sable freine fort : il reste à s'arrêter)
      const le = vx * dx + vz * dz, tr = -vx * dz + vz * dx, le2 = le * Math.exp(-dt * (0.26 + 0.012 * Math.abs(le) + (pente < 0.14 ? 1.1 : 0) + (this.fini ? 1.6 : 0))), tr2 = tr * Math.exp(-dt * 3.6);
      vx = dx * le2 - dz * tr2; vz = dz * le2 + dx * tr2;
      const nx = x + vx * dt, nz = z + vz * dt;
      // (un piquet de porte plie au passage : on y perd un peu de vitesse, pas la descente ; contre autre chose, elle glisse le long si elle peut)
      const piquet = PISTE.portes.some((q) => q.piquets.some(([px, pz]) => (nx - px) ** 2 + (nz - pz) ** 2 < 0.16));
      if (piquet && !this.surPiquet) { vx *= 0.72; vz *= 0.72; jeu.son('oiseau/rate'); }
      this.surPiquet = piquet;
      if (piquet || monde.libre(nx, nz, etat.y)) { etat.x = nx; etat.z = nz; } else if (monde.libre(nx, z, etat.y)) { etat.x = nx; vz *= 0.4; } else if (monde.libre(x, nz, etat.y)) { etat.z = nz; vx *= 0.4; } else { vx *= 0.3; vz *= 0.3; }
      this.vx = vx; this.vz = vz;
      etat.y = terrain(etat.x, etat.z);
      etat.cap = this.cap; etat.vx = vx; etat.vz = vz; etat.vitesse = 0;
      const v = Math.hypot(vx, vz);
      // (la caméra derrière, un peu en retard ; le compagnon assis devant)
      cam.lacet = tournerVers(cam.lacet, this.cap + PI, dt * 2.2);
      renard.x = etat.x + dx * 0.42; renard.z = etat.z + dz * 0.42; renard.y = etat.y + 0.05; renard.cap = this.cap; renard.vitesse = 0;
      // la gerbe de sable, le chuintement
      this.spray += dt * v * 3.2;
      while (this.spray > 1) { this.spray -= 1; grains.emettre(etat.x - dx * 0.5, etat.y + 0.05, etat.z - dz * 0.5, 2, { large: 0.14, haut: 0.7 + v * 0.05, vx: -dx * 0.7 + this.vire * dz * 0.8, vz: -dz * 0.7 - this.vire * dx * 0.8, vie: 0.7, alpha: 0.85 }); }
      planche.position.set(etat.x, etat.y + 0.03, etat.z);
      const nl = new THREE.Vector3(-gx, 1, -gz).normalize(), f = new THREE.Vector3(dx, 0, dz);
      f.addScaledVector(nl, -f.dot(nl)).normalize();
      const dr = new THREE.Vector3().crossVectors(nl, f);
      planche.setRotationFromMatrix(new THREE.Matrix4().makeBasis(dr, nl, f));
      planche.rotateZ(-this.vire * 0.12);
      if (this.decompte > 0) return 0;
      // les portes : on passe la ligne de la suivante ; entre ses deux piquets, ou pas
      const P = PISTE.portes[this.prochaine];
      if (P && etat.z < P.z) {
        if (Math.abs(etat.x - P.x) <= P.l) { this.passees++; jeu.son('oiseau/porte'); } else { this.ratees++; jeu.son('oiseau/rate'); }
        this.prochaine++;
      }
      // la ligne d'arrivée, sur toute sa largeur : le temps ; les portes qu'on n'a pas passées comptent
      if (!this.fini && etat.z < PISTE.zf) {
        this.ratees += PISTE.portes.length - this.prochaine; this.prochaine = PISTE.portes.length;
        this.fini = { t: this.t, total: this.t + this.ratees * PENALITE, ratees: this.ratees };
        jeu.son('oiseau/arrivee');
        jeu.chrono(`<b>${chiffres(this.fini.total)}</b><small>${jeu.tx('chronoPortes')} ${this.passees}/${PISTE.portes.length}${this.ratees ? ` · <span class="rate">+${this.ratees * PENALITE} s</span>` : ''}</small>`);
      }
      // arrivé ? au bas de la pente, presque arrêté, ou la plage
      const dc = etat.z - zRivage(etat.x);
      this.age += dt;
      // (trop lent trop longtemps : la descente s'arrête ; en travers de la pente, un instant, ce n'est pas la fin)
      this.lent = v < 0.6 ? (this.lent || 0) + dt : 0;
      if ((this.fini && v < 1.2) || this.lent > 1.4 || dc < 8) { this.actif = false; this.lent = 0; const fin = this.fin; this.fin = null; if (fin) fin(this.fini); }
      return v;
    },
  };
  animes.push({ objet: planche, maj: () => [] });
  /** La descente : le voyageur et sa planche au départ, le compte à rebours ; au bout, son temps, le record, et on peut recommencer. */
  const lancerDescente = (jeu) => {
    jeu.placer(PISTE.xd, PISTE.zd, PI);
    jeu.cameraDerriere(0);
    jeu.rangerOmbrelle(true);
    jeu.geste('planche');
    planche.visible = true;
    conduite.demarrer(jeu, PI, (res) => {
      planche.visible = false;
      caravane.scene(async (j) => {
        j.geste(null);
        j.rangerOmbrelle(false);
        j.cameraDerriere(0);
        if (res) {
          const av = lireRecord(CLE_PLANCHE), nouveau = av == null || res.total < av;
          if (nouveau) ecrireRecord(CLE_PLANCHE, res.total);
          const medaille = res.total <= TEMPS_MEDAILLES[0] ? 'Or' : res.total <= TEMPS_MEDAILLES[1] ? 'Argent' : res.total <= TEMPS_MEDAILLES[2] ? 'Bronze' : null;
          const ligne = (cle) => j.tx(cle).replace('{t}', chiffres(res.total)).replace('{r}', chiffres(av ?? res.total)).replace('{p}', res.ratees).replace('{s}', res.ratees * PENALITE);
          const pages = [ligne(res.ratees ? 'plancheTempsRate' : 'plancheTemps'), j.tx(nouveau ? (av == null ? 'plancheRecord1' : 'plancheRecord') : 'plancheRecordNon').replace('{r}', chiffres(av ?? res.total))];
          if (medaille) pages.push(j.tx(`plancheMedaille${medaille}`));
          await j.dire(pages, 'moniteur');
        } else await j.dire(j.tx('plancheArretee'), 'moniteur');
        if (!j.aTampon('planche')) { await j.tampon('planche'); await comp(j, 'plancheCompagnon'); }
        const r = await j.choisir(j.tx('plancheEncore'), [j.tx('plancheRemonter'), j.tx('plancheRester')], 'moniteur');
        j.chrono(null);
        if (r === 0) {
          await j.fondu(true);
          lancerDescente(j);
          await j.attendre(250);
          await j.fondu(false);
        }
      });
    });
  };

  // ---------------------------------------------------------------- Le secret : la caravane de la lune
  const caravane = creerCaravane(ctx, { terrain, zCrete, grains, DIR_LUNE, CUVETTE, comp: (jeu, cle) => jeu.dire(jeu.tx(cle)[jeu.compagnon], 'compagnon'), monde, poser, atelier, secretTrouve, solDetaille, ETENDUE, ecrire });
  animes.push(caravane);

  // ---------------------------------------------------------------- Ce qu'on peut faire (tout passe par `jeu`)
  const comp = (jeu, cle) => jeu.dire(jeu.tx(cle)[jeu.compagnon], 'compagnon');
  const parler = (id) => ({ id, passant: id, verbe: 'parler', action: (jeu) => jeu.dire(jeu.txn(id), id) });
  // le soir, à la demande (comme le patron du café de Motonosumi) ; le jour, de nouveau
  const soir = async (jeu, qui) => {
    if (jeu.estNuit) {
      const r = await jeu.choisir(jeu.tx(`${qui}Matin`), [jeu.t('oui'), jeu.t('non')], qui);
      if (r === 0) await jeu.nuit(false);
      return;
    }
    const r = await jeu.choisir(jeu.tx(`${qui}Soir`), [jeu.t('oui'), jeu.t('non')], qui);
    if (r === 0) await jeu.nuit(true);
  };
  const lift = creerTelesiege(ctx, { monde, poser, ecrire, morceau, murRect, bancs, lumieres, animes, comp });
  // ---- le repas au restaurant du Sakyu Center : le bol de fruits de mer, le chanpon, le burger au crabe et son jus de poire (ils apparaissent sur la table)
  const PLAT_X = 365.66, PLAT_Z = 57.02, PLAT_Y = GARE_H.F + 0.745, plats = (() => {
    const g = new THREE.Group(), faire = (f) => { const a = atelier(); f(a); const m = ctx.perso.maillage(a.fin(0, false), false, true); m.visible = false; g.add(m); return m; };
    const bol = (a, r, c, ci) => a.cylindre(r, r * 0.62, r * 0.8, 14, c, { x: PLAT_X, y: PLAT_Y + r * 0.4 + 0.012, z: PLAT_Z }).cylindre(r * 0.92, r * 0.92, 0.008, 14, ci, { x: PLAT_X, y: PLAT_Y + r * 0.8 + 0.008, z: PLAT_Z, trait: false });
    const plateau = (a) => a.boite(0.42, 0.012, 0.32, '#7a3a26', { x: PLAT_X, y: PLAT_Y + 0.006, z: PLAT_Z, trait: false }).baton([PLAT_X + 0.17, PLAT_Y + 0.02, PLAT_Z - 0.12], [PLAT_X + 0.19, PLAT_Y + 0.02, PLAT_Z + 0.12], 0.004, '#3a2a22', 4, { trait: false });
    return [
      faire((a) => { plateau(a); bol(a, 0.095, '#2a3a5a', '#f4f0e4'); const y = PLAT_Y + 0.094; for (const [dx, dz, c, l] of [[-0.035, -0.03, '#d8402c', 0.05], [0.03, -0.035, '#f08a4a', 0.05], [-0.03, 0.035, '#f4f0ea', 0.05], [0.035, 0.03, '#d8402c', 0.04], [0, 0, '#f2c443', 0.03], [0.05, -0.005, '#5a9a4a', 0.025]]) a.boite(l, 0.012, 0.03, c, { x: PLAT_X + dx, y, z: PLAT_Z + dz, ry: dx * 18, trait: false }); }),
      faire((a) => { plateau(a); bol(a, 0.11, '#f4efe2', '#e8c88a'); const y = PLAT_Y + 0.106; for (const [dx, dz, c, l] of [[-0.03, -0.03, '#f2dc8a', 0.06], [0.03, 0.03, '#f2dc8a', 0.05], [0.02, -0.04, '#5a9a4a', 0.04], [-0.04, 0.03, '#e88a7a', 0.04], [0.045, -0.005, '#f4f0ea', 0.03]]) a.boite(l, 0.012, 0.03, c, { x: PLAT_X + dx, y, z: PLAT_Z + dz, ry: dx * 22, trait: false }); }),
      faire((a) => { plateau(a); const x = PLAT_X - 0.05; a.cylindre(0.08, 0.085, 0.03, 12, '#d8a860', { x, y: PLAT_Y + 0.028, z: PLAT_Z, trait: false }).cylindre(0.086, 0.086, 0.02, 12, '#d8604a', { x, y: PLAT_Y + 0.052, z: PLAT_Z, trait: false }).cylindre(0.088, 0.088, 0.008, 12, '#7ab84a', { x, y: PLAT_Y + 0.066, z: PLAT_Z, trait: false }).ovale(0.08, '#d8a860', { x, y: PLAT_Y + 0.076, z: PLAT_Z, sy: 0.5 }, 10); a.cylindre(0.03, 0.026, 0.12, 8, '#e8e88a', { x: PLAT_X + 0.1, y: PLAT_Y + 0.072, z: PLAT_Z - 0.03, trait: false }); }),
    ];
  })();
  animes.push({ objet: plats[0].parent, maj: () => [] });
  // ---- les jumelles du toit : une pièce de 100 yens, 45 secondes : trouver six choses, l'une après l'autre (le joystick ou les flèches tournent le regard ; on garde la chose au milieu un instant)
  const JUMELLES_JEU = (() => {
    const O = [lift.JUMELLES_TOIT.x, TOIT.y + 1.34, lift.JUMELLES_TOIT.z - 0.32], DUREE = 45, CHAMP = 14;
    const CIBLES = [
      { id: 'sommet', p: () => [SOMMET.xp, SOMMET.y + 1.4, SOMMET.zp] },
      { id: 'gare', p: () => [181.8, GARE_B.F + 5.2, 64] },
      { id: 'parapente', p: () => [PARAPENTE.position.x, PARAPENTE.position.y + 3, PARAPENTE.position.z] },
      { id: 'baleine', p: () => [690, 16, -640] },
      { id: 'musee', p: () => [254, Y_ROUTE + 12, 96] },
      { id: 'daisen', p: () => [-3200, 200, -40] },
    ];
    let V = null;
    const fin = (jeu, cam) => {
      const n = V.k, t = DUREE - V.temps, res = V;
      V = null;
      conduite.autre = null; conduite.actif = false;
      Object.assign(cam, res.camAvant);
      caravane.scene(async (j) => {
        j.son('oiseau/clac');
        j.jumelles(false); j.cadrer(null); j.cacherVoyageur(false); j.chrono(null); j.aide(null);
        j.cameraDerriere(0);
        const av = lireRecord(CLE_JUMELLES), mieux = !av || n > av.n || (n === av.n && t < av.t);
        if (mieux) ecrireRecord(CLE_JUMELLES, { n, t });
        const remplace = (s) => s.replace('{n}', n).replace('{t}', Math.round(t)).replace('{rn}', av?.n ?? n).replace('{rt}', Math.round(av?.t ?? t));
        const pages = [remplace(j.tx(n >= CIBLES.length ? 'jumellesToutes' : 'jumellesFin'))];
        pages.push(remplace(j.tx(mieux ? (av ? 'jumellesRecord' : 'jumellesRecord1') : 'jumellesRecordNon')));
        await j.dire(pages);
        if (n >= CIBLES.length && !JUMELLES_JEU.vu) { JUMELLES_JEU.vu = true; await comp(j, 'jumellesCompagnon'); }
      });
    };
    return {
      async lancer(jeu) {
        if (jeu.estNuit) { await jeu.dire(jeu.tx('jumellesHautNuit')); return; }
        const rec = lireRecord(CLE_JUMELLES), pages = [...jeu.tx('jumellesToit')];
        if (rec) pages.push(jeu.tx('jumellesRecordAff').replace('{rn}', rec.n).replace('{rt}', Math.round(rec.t)));
        const r = await jeu.choisir(pages, [jeu.tx('jumellesPiece'), jeu.t('non')]);
        if (r !== 0) return;
        jeu.son('oiseau/clac');
        jeu.placer(lift.JUMELLES_TOIT.x + 0.1, lift.JUMELLES_TOIT.z + 0.56, PI, TOIT.y);
        jeu.cacherVoyageur(true);
        jeu.jumelles(true);
        jeu.aide(jeu.tx(jeu.tactile ? 'jumellesAideTel' : 'jumellesAideOrdi'));
        V = { jeu, k: 0, temps: DUREE, lacet: PI + 0.7, tang: -0.02, tenu: 0, affiche: 0, camAvant: null, camL: null, camT: null };
        conduite.actif = true;
        conduite.autre = (dt, pousse, vire, etat, cam) => {
          if (!V) return 0;
          if (!V.camAvant) { V.camAvant = { lacet: cam.lacet, tangage: cam.tangage, distance: cam.distance }; V.camL = cam.lacet; V.camT = cam.tangage; }
          // le regard : le joystick ou les flèches ; et, du doigt ou de la souris, la caméra du jeu, qu'on lit
          V.lacet += -vire * dt * 0.62 + (cam.lacet - V.camL) * 0.4;
          V.tang = Math.max(-0.42, Math.min(0.36, V.tang + pousse * dt * 0.34 - (cam.tangage - V.camT) * 0.4));
          V.camL = cam.lacet; V.camT = cam.tangage;
          const ch = Math.cos(V.tang), dx = Math.sin(V.lacet) * ch, dy = Math.sin(V.tang), dz = Math.cos(V.lacet) * ch;
          jeu.cadrer({ de: O, vers: [O[0] + dx * 200, O[1] + dy * 200, O[2] + dz * 200], champ: CHAMP });
          V.temps -= dt;
          const C = CIBLES[V.k], p = C.p(), ex = p[0] - O[0], ey = p[1] - O[1], ez = p[2] - O[2], l = Math.hypot(ex, ey, ez), ang = Math.acos(Math.min(1, (ex * dx + ey * dy + ez * dz) / l));
          // la chose gardée au milieu, un instant : trouvée
          if (ang < 0.05) V.tenu += dt; else V.tenu = Math.max(0, V.tenu - dt * 2);
          let bravo = false;
          V.cherche = (V.cherche || 0) + dt;
          if (V.tenu > 0.45) { V.k++; V.tenu = 0; V.cherche = 0; jeu.son('oiseau/trouve'); V.affiche = 0; bravo = true; }
          if (V.k >= CIBLES.length || V.temps <= 0) { fin(jeu, cam); return 0; }
          if ((V.affiche -= dt) <= 0) {
            V.affiche = 0.15;
            // (où chercher : au bout de cinq secondes sans trouver, une flèche, jusqu'au milieu)
            const Cn = CIBLES[V.k], q = Cn.p(), az = Math.atan2(q[0] - O[0], q[2] - O[2]), da = Math.atan2(Math.sin(az - V.lacet), Math.cos(az - V.lacet)), el = Math.atan2(q[1] - O[1], Math.hypot(q[0] - O[0], q[2] - O[2])) - V.tang;
            const fleche = V.cherche < 5 ? '' : Math.abs(da) > 0.04 ? (da > 0 ? '◀ ' : '▶ ') : Math.abs(el) > 0.03 ? (el > 0 ? '▲ ' : '▼ ') : '';
            jeu.chrono(`<b>${Math.ceil(V.temps)} s</b><small>${V.k + 1}/${CIBLES.length} · ${fleche}${jeu.tx('jumellesCibles')[Cn.id]}</small>`);
          }
          return bravo ? 1 : 0;
        };
      },
    };
  })();
  const interactions = [
    // ---- le sommet (le tampon) : la mer, l'îlot en forme de baleine, le Daisen
    {
      id: 'crete', x: SOMMET.xp, z: SOMMET.zp, y: terrain(SOMMET.xp, SOMMET.zp), rayon: 3.0, haut: 2.6, verbe: 'regarder', vers: [SOMMET.xp, SOMMET.zp - 8], tampon: 'crete', quoi: QUOI.crete,
      async action(jeu) {
        const y = SOMMET.y;
        jeu.cacherVoyageur(true);
        jeu.cadrer({ de: [SOMMET.xp + 0.6, y + 3.2, SOMMET.zp - 4.2], vers: [640, 8, -620], champ: 46 });
        await jeu.attendre(900);
        await jeu.dire(jeu.txn('crete1'));
        jeu.cadrer({ de: [SOMMET.xp - 1, y + 3.2, SOMMET.zp - 2], vers: [-2900, 160, -60], champ: 50 });
        await jeu.attendre(700);
        await jeu.dire(jeu.txn('crete2'));
        jeu.cadrer(null);
        jeu.cacherVoyageur(false);
        if (!jeu.aTampon('crete')) { await jeu.tampon('crete'); await comp(jeu, 'creteCompagnon'); }
      },
    },
    // ---- le chamelier (le tampon : un tour à dos de chameau ; et le soir, à la demande)
    {
      id: 'chamelier', passant: 'chamelier', verbe: 'parler', tampon: 'chameau',
      async action(jeu) {
        const nuit = jeu.estNuit;
        const opts = [jeu.tx('chamelierTour'), jeu.tx(nuit ? 'chamelierMatinChoix' : 'chamelierSoirChoix'), jeu.tx('chamelierRien')];
        if (nuit) { await jeu.dire(jeu.tx('chamelierNuit'), 'chamelier'); }
        const r = await jeu.choisir(jeu.tx(jeu.aTampon('chameau') ? 'chamelierEncore' : nuit ? 'chamelierQuestionNuit' : 'chamelier'), nuit ? [opts[1], opts[2]] : opts, 'chamelier');
        if (nuit) { if (r === 0) await jeu.nuit(false); return; }
        if (r === 1) { await jeu.dire(jeu.tx('chamelierSoir'), 'chamelier'); await jeu.nuit(true); return; }
        if (r !== 0) return;
        // on grimpe à l'escalier de métal, on s'assoit entre les bosses ; le guide part devant
        const { pied, haut, ym, pm } = MONTEE, capM = Math.atan2(haut.x - pied.x, haut.z - pied.z);
        await jeu.dire(jeu.tx('chamelierMonte'), 'chamelier');
        jeu.placer(pied.x, pied.z, capM);
        await jeu.attendre(200);
        await jeu.grimper([[pied.x, ym, pied.z], [haut.x, ym + pm, haut.z]], 1.3, capM);
        const vue = { lacet: POSE_M.cap + PI + 0.9, tangage: 0.26, distance: 8.4 };
        Object.assign(ride.siege, { x: ride.x, z: ride.z, y: ride.y + MONTURE.siege, cap: POSE_M.cap });
        jeu.aCheval(true);
        jeu.asseoir(ride.siege, vue);
        jeu.son('oiseau/chameau');
        await jeu.attendre(500);
        ride.s = 0;
        await new Promise((fin) => { ride.fin = fin; ride.actif = true; jeu.dire(jeu.tx('chameauEnRoute')); });
        await jeu.attendre(400);
        jeu.asseoir(null);
        jeu.aCheval(false);
        jeu.placer(pied.x, pied.z, capM + PI);
        jeu.cameraDerriere(0);
        await jeu.dire(jeu.tx('chameauFin'), 'chamelier');
        if (!jeu.aTampon('chameau')) { await jeu.tampon('chameau'); await comp(jeu, 'chameauCompagnon'); }
      },
    },
    // ---- le moniteur (le tampon : la descente en planche)
    {
      id: 'moniteur', passant: 'moniteur', verbe: 'parler', tampon: 'planche',
      async action(jeu) {
        const rec = lireRecord(CLE_PLANCHE), pages = [...jeu.tx(jeu.aTampon('planche') ? 'moniteurEncore' : 'moniteur')];
        if (rec != null) pages.push(jeu.tx('moniteurRecord').replace('{r}', chiffres(rec)));
        const r = await jeu.choisir(pages, [jeu.t('oui'), jeu.t('non')], 'moniteur');
        if (r !== 0) return;
        await jeu.dire(jeu.tx(jeu.tactile ? 'moniteurConsigneTel' : 'moniteurConsigneOrdi'), 'moniteur');
        lancerDescente(jeu);
      },
    },
    // ---- le musée (le tampon) : le pupitre devant la Sagrada Família
    {
      id: 'musee', x: SUITE_SCULPTURES.pupitre.x + 0.8, z: SUITE_SCULPTURES.pupitre.z, y: yF, rayon: 2.6, haut: 1.8, verbe: 'regarder', vers: SUITE_SCULPTURES.vers, tampon: 'musee', quoi: QUOI.musee,
      async action(jeu) {
        // (2026-11-03 : posé là, il se retrouvait dans le tour du dragon, sans pouvoir en sortir : le tour est plus à l'ouest, et il reste devant le pupitre)
        jeu.placer(SUITE_SCULPTURES.pupitre.x - 0.5, SUITE_SCULPTURES.pupitre.z, PI / 2);
        jeu.cadrer({ de: [SUITE_SCULPTURES.pupitre.x - 3.2, yF + 1.45, SUITE_SCULPTURES.pupitre.z - 4.4], vers: [265, yF + 5.2, 104], champ: 62 });
        await jeu.attendre(800);
        await jeu.dire(jeu.txn('musee'));
        jeu.cadrer(null);
        if (!jeu.aTampon('musee')) { await jeu.tampon('musee'); await comp(jeu, 'museeCompagnon'); }
      },
    },
    // ---- l'oasis (le tampon) : l'écriteau, l'eau, la crête qui s'y reflète
    {
      id: 'oasis', x: PANNEAU_OASIS.x, z: PANNEAU_OASIS.z, y: terrain(PANNEAU_OASIS.x, PANNEAU_OASIS.z), rayon: 2.8, haut: 2.1, verbe: 'regarder', vers: [OASIS.x, OASIS.z], tampon: 'oasis', quoi: QUOI.oasis,
      async action(jeu) {
        jeu.cacherVoyageur(true);
        jeu.cadrer({ de: [OASIS.x + 2, OASIS.y + 2.2, OASIS.z + OASIS.rz + 7.5], vers: [OASIS.x - 8, OASIS.y + 9, OASIS.z - 34], champ: 60 });
        await jeu.attendre(700);
        await jeu.dire(jeu.txn('oasis'));
        jeu.cadrer(null);
        jeu.cacherVoyageur(false);
        if (!jeu.aTampon('oasis')) { await jeu.tampon('oasis'); await comp(jeu, 'oasisCompagnon'); }
      },
    },
    // ---- le télésiège : ses deux préposés, son écriteau ; en haut, les jumelles de la terrasse
    {
      id: 'liftBas', passant: 'liftBas', verbe: 'parler',
      async action(jeu) {
        const r = await jeu.choisir(jeu.tx('liftBas'), [jeu.t('oui'), jeu.t('non')], 'liftBas');
        if (r !== 0) return;
        await jeu.dire(jeu.tx('liftBasOui'), 'liftBas');
        await lift.embarquer(jeu, 'bas');
      },
    },
    {
      id: 'liftHaut', passant: 'liftHaut', verbe: 'parler',
      async action(jeu) {
        const r = await jeu.choisir(jeu.tx('liftHaut'), [jeu.t('oui'), jeu.t('non')], 'liftHaut');
        if (r !== 0) return;
        await jeu.dire(jeu.tx('liftHautOui'), 'liftHaut');
        await lift.embarquer(jeu, 'haut');
      },
    },
    { id: 'panneauLift', x: lift.PANNEAU.x, z: lift.PANNEAU.z, rayon: 2.2, haut: 1.5, verbe: 'lire', vers: [lift.PANNEAU.x + 1, lift.PANNEAU.z], action: (jeu) => jeu.dire(jeu.tx('panneauLift')) },
    {
      id: 'jumellesHaut', x: lift.JUMELLES.x, z: lift.JUMELLES.z, rayon: 1.5, haut: 1.5, verbe: 'regarder', vers: [lift.JUMELLES.x - 30, lift.JUMELLES.z - 30],
      async action(jeu) {
        if (jeu.estNuit) { await jeu.dire(jeu.tx('jumellesHautNuit')); return; }
        await jeu.dire(jeu.tx('jumellesHaut'));
        jeu.jumelles(true);
        jeu.cadrer({ de: [lift.JUMELLES.x, GARE_H.F + 1.5, lift.JUMELLES.z - 0.3], vers: [SOMMET.x, SOMMET.y + 3, SOMMET.z], champ: 11 });
        await jeu.attendre(500);
        await jeu.dire(jeu.tx('jumellesHautVue'));
        jeu.cadrer(null);
        jeu.jumelles(false);
      },
    },
    parler('centreCaisse'), parler('centreClient'), parler('vieuxHaut'), parler('filleHaut'), parler('centreCliente'), parler('kaikanCliente'), parler('toitPhoto'),
    // ---- sur le toit : les jumelles (le petit jeu), la table d'orientation
    { id: 'jumellesToit', x: lift.JUMELLES_TOIT.x, z: lift.JUMELLES_TOIT.z + 0.1, y: TOIT.y, rayon: 1.4, haut: 1.5, verbe: 'regarder', vers: [lift.JUMELLES_TOIT.x - 3, lift.JUMELLES_TOIT.z - 3], action: (jeu) => JUMELLES_JEU.lancer(jeu) },
    { id: 'tableToit', x: lift.TABLE_TOIT.x, z: lift.TABLE_TOIT.z, y: TOIT.y, rayon: 1.5, haut: 1.3, verbe: 'lire', vers: [lift.TABLE_TOIT.x, lift.TABLE_TOIT.z], action: (jeu) => jeu.dire(jeu.tx('tableToit')) },
    // ---- au restaurant du Sakyu Center : on commande, on s'assoit, on mange (les vrais plats)
    {
      id: 'centreServeuse', passant: 'centreServeuse', verbe: 'parler',
      async action(jeu) {
        const r = await jeu.choisir(jeu.tx('centreServeuse'), jeu.tx('menuChoix'), 'centreServeuse');
        if (r < 0 || r > 2) return;
        await jeu.dire(jeu.tx('menuOui'), 'centreServeuse');
        await jeu.fondu(true);
        const F = GARE_H.F;
        plats[r].visible = true;
        jeu.rangerOmbrelle(true);
        jeu.asseoir({ x: 365.66, z: 56.78, y: F + 0.47, cap: 0, libre: false, cote: { x: 366.34, z: 56.78, y: F + 0.47, cap: 0, aussitot: true } }, { lacet: 0.72, tangage: 0.36, distance: 2.5 });
        await jeu.attendre(300);
        await jeu.fondu(false);
        for (let k = 0; k < 3; k++) { jeu.geste('baguettes'); await jeu.attendre(850); jeu.geste(null); await jeu.attendre(220); }
        await jeu.dire(jeu.tx('menuDit')[r]);
        await comp(jeu, 'repasCompagnon');
        await jeu.fondu(true);
        plats[r].visible = false;
        jeu.asseoir(null);
        jeu.rangerOmbrelle(false);
        await jeu.attendre(200);
        await jeu.fondu(false);
      },
    },
    // ---- les gens
    { id: 'chauffeur', passant: 'chauffeur', verbe: 'parler', action: (jeu) => jeu.dire(jeu.tx('chauffeur'), 'chauffeur') },
    parler('garde'),
    {
      id: 'vendeuseR', passant: 'vendeuseR', verbe: 'parler',
      async action(jeu) {
        const r = await jeu.choisir(jeu.tx('vendeuseR'), jeu.tx('vendeuseRChoix'), 'vendeuseR');
        if (r === 0) { await jeu.dire(jeu.tx('glace'), 'vendeuseR'); await comp(jeu, 'glaceCompagnon'); }
      },
    },
    parler('vendeuseF'),
    {
      id: 'kaikan', passant: 'kaikan', verbe: 'parler',
      async action(jeu) { await jeu.dire(jeu.tx('kaikan'), 'kaikan'); },
    },
    { id: 'serveuse', passant: 'serveuse', verbe: 'parler', action: (jeu) => soir(jeu, 'serveuse') },
    parler('cuisinier'), parler('dineur'), parler('dineuse'),
    parler('naturaliste'), parler('amoureuse'), parler('amoureux'), parler('enfant'), parler('maman'), parler('pilote'),
    { id: 'pecheur', passant: 'pecheur', verbe: 'parler', action: (jeu) => jeu.dire(jeu.txn('pecheur'), 'pecheur') },
    parler('sculpteur'), parler('accueil'), parler('visiteur'), parler('visiteuse'), parler('galerie'), parler('marcheur'), parler('grimpeur'), parler('randonneuse'), parler('plagiste'), parler('vieux'),
    { id: 'videaste', passant: 'videaste', verbe: 'parler', action: async (jeu) => { await jeu.dire(jeu.tx('videaste'), 'videaste'); await jeu.video(); } },
    // ---- à lire, à regarder
    { id: 'entree', x: 213.4, z: ESC.z1 + 1.2, y: Y_ROUTE, rayon: 2.2, haut: 1.5, verbe: 'lire', vers: [212.8, ESC.z1 + 1.2], action: (jeu) => jeu.dire(jeu.tx('entree')) },
    { id: 'mer', x: 30, z: -158, rayon: 3, verbe: 'regarder', vers: [30, -200], si: () => false, action: (jeu) => jeu.dire(jeu.txn('mer')) },
    { id: 'pierreArishima', x: POEME.x, z: POEME.z - 1.5, rayon: 2.4, haut: 1.6, verbe: 'lire', vers: [POEME.x, POEME.z], action: (jeu) => jeu.dire(jeu.tx('arishima')) },
    { id: 'traces', x: caravane.premiereTrace.x, z: caravane.premiereTrace.z, rayon: 2.2, haut: 0.9, verbe: 'regarder', si: (jeu) => !jeu.estNuit, async action(jeu) { await jeu.dire(jeu.tx('traces')); jeu.voirIndice('caravane-traces'); await comp(jeu, 'tracesCompagnon'); } },
    { id: 'grelot', x: caravane.grelot.x, z: caravane.grelot.z, rayon: 2.2, haut: 0.9, verbe: 'regarder', si: (jeu) => !jeu.estNuit, async action(jeu) { await jeu.dire(jeu.tx('grelot')); jeu.voirIndice('caravane-grelot'); await comp(jeu, 'grelotCompagnon'); } },
    ...interactionsBancs(bancs),
  ];
  const actionBete = async (jeu, b) => jeu.dire(jeu.txn(b.id));

  finirDecor();
  const depart = { x: DEPART.x, z: DEPART.z, cap: -PI / 2 };
  return {
    ...infos, textes: TEXTES,
    objets, monde, terrain, etiquettes, passants, daims: [], interactions, actionDaim: null, vapeurs, bancs, lumieres, actionBete, animes,
    // (le secret, tresors.js ; le marchand ; les sons à fabriquer en plus ; les feux d'artifice : interdits sur le vrai sable, ils partent d'un bateau
    // juste après les vagues ; de grosses bombes, assez haut pour passer la crête vues de chez Bunbuku, à 380 m : de petites gerbes n'y faisaient que quelques
    // points ; jamais à moins de 300 m : depuis la crête ou la plage, elles sortiraient du haut de l'image)
    secret: 'caravane', marchand: MARCHAND, sons: ['oiseau/chameau', 'oiseau/grelots', 'oiseau/glisse', 'oiseau/poudre', 'oiseau/poulies', 'oiseau/top', 'oiseau/depart', 'oiseau/porte', 'oiseau/rate', 'oiseau/arrivee', 'oiseau/clac', 'oiseau/trouve'],
    feux: { x: 30, y: 0, z: -235, large: 170, haut: [85, 120], echelle: 2.2, loin: 300 },
    mouettes: {
      vols: [{ x: 60, z: -190, r: 26, h: 16, sens: 1 }, { x: -90, z: -180, r: 20, h: 12, sens: -1 }, { x: 170, z: -170, r: 16, h: 14, sens: 1 }],
      // (sur le sommet d'une digue, et sur le sable mouillé. 2026-11-03, « une mouette qui flotte dans le vide » : 12 m à côté de la digue, 2,8 m en l'air)
      poses: [...PERCHOIRS.map((q, k) => ({ x: q.x, z: q.z, y: q.y + 0.02, cap: k ? 1.2 : -1.2, mer: [0, -1] })), { x: 148, z: zRivage(148) + 7.2, y: yDessine(148, zRivage(148) + 7.2), cap: 0.6, mer: [0, -1] }, { x: 150.6, z: zRivage(150.6) + 8, y: yDessine(150.6, zRivage(150.6) + 8), cap: 2.4, mer: [0, -1] }, { x: -88, z: zRivage(-88) + 7.6, y: yDessine(-88, zRivage(-88) + 7.6), cap: -0.8, mer: [0, -1] }],
    },
    betes: { papillons: [[50, 30], [-44, 74], [-120, -58]], milans: [{ x: 40, z: -60, r: 70, h: 80, sens: 1 }, { x: -140, z: 40, r: 50, h: 70, sens: -1 }] },
    aspectSol: (x, z, h) => aspectSol(P, x, z, h),
    solDetaille, trouSol,
    etendue: ETENDUE,
    eauxCalmes, eauCalme: { clair: '#86d4cc', profond: '#3d8ea6' },
    // (on patauge dans l'oasis)
    flaques: (x, z) => (Math.abs(x - OASIS.x) < OASIS.rx * 1.4 && Math.abs(z - OASIS.z) < OASIS.rx * 1.4 && rOasis(x, z) < 1 ? OASIS.y : null),
    eau: { x0: -3800, x1: 3800, z0: -3800, z1: -60, niveau: 0, clair: '#5ad4c8', profond: '#17578f', houle: 1, fond: 5.5, son: 'vagues', fin: { x0: -424, x1: 424, z0: -250, z1: -130, pas: 3 } },
    rive: -165,
    // (le sable : ses rides ; les pas y restent trois minutes ; monter une dune, on va moins vite ; la descente en planche)
    dunes: { vent: VENT }, dureePas: 180, allure, conduite,
    // (le plein soleil sur le sable : moins de lumière d'ambiance que d'ordinaire, les formes des dunes se lisent)
    jour: { lumiere: { ambiance: 1.32, force: 2.55, ciel: '#c8dcff', sol: '#e8cfa0' }, cielHaut: '#2f86dc', horizon: '#cfe6f2' },
    // (sous la lune, le sable reste clair : le vrai se voit de loin, la nuit)
    nuit: { ambiance: 1.0, force: 1.05, ciel: '#4a60c4', sol: '#34386a', lune: '#92a8ff' },
    vent: { dir: [0.72, 0.69], force: 1.2 }, oiseaux: ['milan', 'mouette'], ambiances: ['vagues', 'insectes'],
    brume: [300, 3400],
    flou: [240, 700],
    soleil: [0.3, 0.72, 0.62],
    depart,
    photos: {
      heros: { x: 196, z: 38, cap: -PI / 2, lacet: PI / 2 + 0.25, tangage: 0.22, distance: 6.2 },
      perso: { x: 225.5, z: 38, cap: -PI / 2, lacet: PI / 2, tangage: 0.12, distance: 4.4 },
    },
  };
}
const tournerVers = (a, b, k) => { const d = Math.atan2(Math.sin(b - a), Math.cos(b - a)); return a + d * Math.min(1, k); };

// ---------------------------------------------------------------- Le dedans des boutiques (le Sakyu Kaikan, le Sakyu Center, les comptoirs de la route)
/**
 * De quoi remplir une boutique de souvenirs (2026-11-03 ; le propriétaire : « refaire l'intérieur des boutiques parce que ça fait un peu vide ») : des produits en vrais rangs, le même produit ensemble, comme dans un vrai
 * magasin (pas des boîtes de toutes les couleurs mélangées, qui faisaient un jeu de construction), des tables à deux niveaux, des étagères avec leur fronton, des écriteaux, des bannières au plafond, des peluches de
 * chameau, des chapeaux de paille, des tee-shirts, des cartes postales, un frigo ; les tables d'un restaurant, couvertes. Sans trait d'encre sur les petits objets ; le tout dessiné seulement la caméra dans la salle ou
 * devant sa porte (poser, o.dedans) : ça ne coûte rien du dehors. Une rangée de boîtes n'est qu'un seul bloc peint de ses bandeaux et de ses joints (quelques dizaines de triangles : boîte par boîte, le Sakyu Kaikan en
 * faisait 200 000). a : l'atelier de la salle ; F : la hauteur de son sol.
 */
function creerMagasin(THREE, a, { ecrire, murRect, F }) {
  const BOIS = '#8a5f3c', BOIS2 = '#6e4a2c', BOIS3 = '#b89a74', PAPIER = '#fbf6e6', ROUGE = '#c8402c';
  const repere = (x0, z0, ry0) => { const c = Math.cos(ry0), s = Math.sin(ry0); return (lx, y, lz, o = {}) => ({ ordre: 'YXZ', trait: false, nuance: 0.012, ...o, x: x0 + lx * c + lz * s, y, z: z0 - lx * s + lz * c, ry: ry0 + (o.ry || 0) }); };
  const ombre = (c, k) => { const v = parseInt(c.slice(1), 16), f = (s) => Math.round(((v >> s) & 255) * k); return `#${((f(16) << 16) | (f(8) << 8) | f(0)).toString(16).padStart(6, '0')}`; };
  // les produits : leur largeur, leur hauteur, leur profondeur ; un par un, ceux qui ne sont pas des boîtes (y : le dessous)
  const SORTES = {
    boite: { l: 0.25, h: 0.085, p: 0.18 },
    grande: { l: 0.33, h: 0.115, p: 0.23 },
    sachet: { l: 0.23, h: 0.08, p: 0.17, d: (Q, x, y, z, c, c2) => a.ovale(0.1, c, Q(x, y + 0.042, z, { sy: 0.42, sz: 0.76 }), 5).boite(0.09, 0.012, 0.09, c2, Q(x, y + 0.07, z)) },
    bocal: { l: 0.17, h: 0.17, p: 0.15, d: (Q, x, y, z, c, c2) => a.cylindre(0.06, 0.06, 0.135, 6, c, Q(x, y + 0.068, z)).cylindre(0.062, 0.062, 0.03, 6, c2, Q(x, y + 0.15, z)) },
    canette: { l: 0.12, h: 0.135, p: 0.09, d: (Q, x, y, z, c) => a.cylindre(0.036, 0.036, 0.125, 5, c, Q(x, y + 0.062, z)) },
    peluche: { l: 0.36, h: 0.3, p: 0.2, d: (Q, x, y, z, c, c2) => {
      a.ovale(0.09, c, Q(x, y + 0.13, z, { sx: 1.3, sy: 0.78, sz: 0.8 }), 6).ovale(0.05, c2, Q(x - 0.045, y + 0.205, z), 5).ovale(0.05, c2, Q(x + 0.05, y + 0.2, z), 5);
      a.baton(...[Q(x + 0.09, y + 0.15, z), Q(x + 0.15, y + 0.25, z)].map((q) => [q.x, q.y, q.z]), 0.022, c, 4, { trait: false }).ovale(0.036, c, Q(x + 0.165, y + 0.27, z, { sx: 1.3, sy: 0.8 }), 5);
      for (const dx of [-0.07, 0.07]) a.boite(0.035, 0.09, 0.11, c2, Q(x + dx, y + 0.045, z));
    } },
  };
  /**
   * Une rangée d'un produit, de x0 à x1 (dans le repère Q), à la hauteur y, en z : nz de profondeur, autant d'étages qu'on en veut. faces : les côtés qu'on voit (1 : vers +z du repère, −1 : vers −z). Des boîtes : un seul
   * bloc, peint de ses bandeaux et de ses joints ; le reste, posé un par un, sur un bloc s'il y en a plusieurs étages.
   */
  const rangee = (Q, s, x0, x1, y, z, nz, etages, c, c2, faces = [1]) => {
    const S = SORTES[s], n = Math.max(1, Math.floor((x1 - x0) / S.l)), xa = (x0 + x1 - n * S.l) / 2, xb = xa + n * S.l, p = nz * S.p, h = etages * S.h;
    if (S.d) {
      if (s === 'peluche' || etages < 2) { for (let k = 0; k < n; k++) S.d(Q, xa + (k + 0.5) * S.l, y, z, c, c2); return; }
      a.boite(xb - xa - 0.02, S.h * (etages - 1), p, ombre(c, 0.82), Q((xa + xb) / 2, y + (S.h * (etages - 1)) / 2, z));
      for (let k = 0; k < n; k++) S.d(Q, xa + (k + 0.5) * S.l, y + S.h * (etages - 1), z, c, c2);
      return;
    }
    a.boite(xb - xa - 0.012, h, p, c, Q((xa + xb) / 2, y + h / 2, z));
    const pos = [], cols = [], e = 0.004, W = (lx, yy, lz) => { const o = Q(lx, yy, lz); return [o.x, o.y, o.z]; }, sombre = ombre(c, 0.72);
    const quad = (A, B, C, D, col) => { pos.push(...A, ...B, ...C, ...A, ...C, ...D); cols.push(col, col); };
    const haut = y + h + e, z0 = z - p / 2, z1 = z + p / 2;
    const dessus = (u0, u1, v0, v1, col, de = 0) => quad(W(u0, haut + de, v0), W(u0, haut + de, v1), W(u1, haut + de, v1), W(u1, haut + de, v0), col);
    for (const f of faces) {
      const zf = z + (f * p) / 2 + f * e;
      // (les joints, 1 mm devant les bandeaux qu'ils croisent)
      const cote = (u0, u1, v0, v1, col, de = 0) => { const zd = zf + f * de; return f > 0 ? quad(W(u0, v0, zd), W(u1, v0, zd), W(u1, v1, zd), W(u0, v1, zd), col) : quad(W(u1, v0, zd), W(u0, v0, zd), W(u0, v1, zd), W(u1, v1, zd), col); };
      if (s === 'boite') for (let k = 0; k < etages; k++) cote(xa, xb - 0.012, y + (k + 0.36) * S.h, y + (k + 0.64) * S.h, c2);
      for (let k = 0; k < n; k++) {
        if (s === 'grande') cote(xa + (k + 0.32) * S.l, xa + (k + 0.68) * S.l, y, y + h, c2);
        if (k) cote(xa + k * S.l - 0.005, xa + k * S.l + 0.005, y, y + h, sombre, 0.001);
      }
      for (let k = 1; k < etages; k++) cote(xa, xb - 0.012, y + k * S.h - 0.003, y + k * S.h + 0.003, sombre, 0.001);
    }
    if (s === 'boite') dessus(xa, xb - 0.012, z - p * 0.14, z + p * 0.14, c2);
    for (let k = 0; k < n; k++) {
      if (s === 'grande') dessus(xa + (k + 0.32) * S.l, xa + (k + 0.68) * S.l, z0, z1, c2);
      if (k) dessus(xa + k * S.l - 0.005, xa + k * S.l + 0.005, z0, z1, sombre, 0.001);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    a.piece(g, c2, { couleurs: cols, trait: false, nuance: 0.008 });
  };
  /** Un petit écriteau sur sa tige (le nom du produit), en lx, y, lz de Q. */
  const pop = (Q, lx, y, lz, texte, encre = ROUGE, large = 0.4) => {
    const q = Q(lx, y + 0.16, lz);
    a.boite(large, 0.11, 0.008, PAPIER, q).boite(0.012, 0.13, 0.012, '#7a7e82', Q(lx, y + 0.06, lz + 0.012));
    ecrire({ x: q.x, y: F, z: q.z, ry: q.ry }, { texte, x: 0, y: q.y - F, z: 0.0065, l: large - 0.03, h: 0.09, fond: null, encre });
    ecrire({ x: q.x, y: F, z: q.z, ry: q.ry + Math.PI }, { texte, x: 0, y: q.y - F, z: 0.0065, l: large - 0.03, h: 0.09, fond: null, encre });
  };
  // [sorte, couleur, bandeau, nom] : ce qu'on vend à Tottori
  const P = {
    usagi: ['boite', '#f8f4ea', '#c8402c', '因幡の白うさぎ'], nashi: ['boite', '#a8c858', '#f2d24a', '二十世紀梨ゼリー'], kani: ['grande', '#d8452e', '#f4e6c4', '松葉がにせんべい'], sakyu: ['grande', '#e8c88a', '#2f6a9a', '砂丘サブレ'],
    sable: ['sachet', '#d8b878', '#8a5a2a', '砂丘の砂糖菓子'], rakkyo: ['bocal', '#f2f0d4', '#c8402c', '砂丘らっきょう'], chuhai: ['canette', '#c8dc78', '#c8ccd0', '梨チューハイ'], jus: ['canette', '#f0dc6a', '#c8ccd0', '梨ジュース'], daisen: ['boite', '#5a8ac4', '#f8f4ea', '大山おかき'], ika: ['sachet', '#f4f0e0', '#2f6ab0', 'いかのおつまみ'],
    peluche: ['peluche', '#c89a5a', '#a87a44', 'らくだ'],
  };
  const etal = (Q, liste, x0, x1, y, z, nz, etages = 2, popY = 0, faces = [1]) => {
    const l = (x1 - x0) / liste.length;
    liste.forEach((id, k) => {
      const [s, c, c2, nom] = P[id];
      rangee(Q, s, x0 + k * l + 0.02, x0 + (k + 1) * l - 0.02, y, z, nz, s === 'peluche' ? 1 : etages, c, c2, faces);
      if (popY) pop(Q, x0 + (k + 0.5) * l, y + popY, z - (nz * SORTES[s].p) / 2 - 0.02, nom, ROUGE, Math.min(l - 0.08, 0.1 + 0.082 * nom.length));
    });
  };
  return {
    P, repere, rangee,
    /** Une table de marché : son caisson de bois, un gradin au milieu ; deux rangs de produits en bas, un en haut. */
    table(x, z, l, p, bas, haut, bas2 = bas) {
      const Q = repere(x, z, 0);
      a.boite(l, 0.62, p, BOIS, { x, y: F + 0.31, z, nuance: 0.03 }).boite(l + 0.1, 0.04, p + 0.1, BOIS2, { x, y: F + 0.64, z, nuance: 0.02 });
      a.boite(l + 0.02, 0.1, p + 0.02, BOIS2, { x, y: F + 0.05, z, trait: false });
      a.boite(l - 0.16, 0.18, p * 0.32, BOIS3, { x, y: F + 0.75, z, nuance: 0.02 }).boite(l - 0.1, 0.02, p * 0.36, BOIS2, { x, y: F + 0.85, z, trait: false });
      etal(Q, bas, -l / 2 + 0.06, l / 2 - 0.06, F + 0.66, -p * 0.3, 2, 2, 0, [-1]);
      etal(Q, bas2, -l / 2 + 0.06, l / 2 - 0.06, F + 0.66, p * 0.3, 2, 2, 0, [1]);
      etal(Q, haut, -l / 2 + 0.12, l / 2 - 0.12, F + 0.86, 0, 1, 2, 0.14, [-1, 1]);
      murRect(x, z, l / 2 + 0.05, p / 2 + 0.05);
    },
    /** Une étagère contre un mur : elle regarde vers +z de son repère (ry) ; sa paroi, quatre rayons, son fronton et son nom ; rayons : [la liste des produits, de haut en bas]. */
    etagere(x, z, ry, l, rayons, titre, couleur = '#2f6a4a') {
      const Q = repere(x, z, ry), H = 2.24;
      a.boite(l, H, 0.06, BOIS3, Q(0, F + H / 2, -0.2, { trait: true, nuance: 0.02 }));
      for (const u of [-1, 1]) a.boite(0.05, H, 0.44, BOIS2, Q(u * (l / 2 + 0.02), F + H / 2, 0.02, { trait: true, nuance: 0.02 }));
      rayons.forEach((liste, k) => {
        const y = F + 1.72 - k * 0.44;
        a.boite(l, 0.03, 0.4, BOIS2, Q(0, y, 0.01, { nuance: 0.015 }));
        etal(Q, liste, -l / 2 + 0.05, l / 2 - 0.05, y + 0.016, 0.03, 2, liste[0] === 'peluche' ? 1 : 3);
        // (l'étiquette des prix, le long du rayon)
        a.boite(l - 0.04, 0.035, 0.006, PAPIER, Q(0, y - 0.004, 0.214));
      });
      // le bas fermé
      a.boite(l, 0.2, 0.4, BOIS, Q(0, F + 0.1, 0.01, { nuance: 0.02 }));
      a.boite(l + 0.08, 0.34, 0.05, couleur, Q(0, F + H + 0.17, 0.02, { trait: true, nuance: 0.02 }));
      const q = Q(0, F + H + 0.17, 0.05);
      ecrire({ x: q.x, y: F, z: q.z, ry: q.ry }, { texte: titre, x: 0, y: H + 0.17, z: 0, l: Math.min(l - 0.2, titre.length * 0.34), h: 0.27, fond: null, encre: '#f8f2e2' });
      const c = Math.abs(Math.cos(ry)) > 0.5;
      const m = Q(0, F, 0.02);
      murRect(m.x, m.z, c ? l / 2 + 0.05 : 0.24, c ? 0.24 : l / 2 + 0.05);
    },
    /** Une bannière suspendue au plafond (PLAF au-dessus du sol) : sa tringle, sa toile, son texte de haut en bas. */
    banniere(x, z, ry, PLAF, texte, c = ROUGE, encre = '#f8f2e2') {
      const Q = repere(x, z, ry), h = 0.92;
      a.boite(0.56, 0.018, 0.018, '#5e4028', Q(0, F + PLAF - 0.24, 0)).boite(0.5, h, 0.012, c, Q(0, F + PLAF - 0.25 - h / 2, 0, { nuance: 0.02 }));
      for (const u of [-1, 1]) a.boite(0.008, 0.24, 0.008, '#3a3a40', Q(u * 0.22, F + PLAF - 0.12, 0));
      for (const s of [0, Math.PI]) { const q = Q(0, F, s ? -0.0075 : 0.0075); ecrire({ x: q.x, y: F, z: q.z, ry: ry + s }, { texte, vertical: true, x: 0, y: PLAF - 0.25 - h / 2, z: 0, l: 0.36, h: h - 0.1, fond: null, encre }); }
    },
    /** Un panier de peluches de chameau. */
    panier(x, z, n = 6) {
      a.cylindre(0.52, 0.42, 0.5, 12, '#a88a5a', { x, y: F + 0.25, z, nuance: 0.03, trait: true }).cylindre(0.54, 0.54, 0.04, 12, '#8a6a48', { x, y: F + 0.5, z, trait: false });
      const Q = repere(x, z, 0.4);
      for (let k = 0; k < n; k++) { const t = (k / n) * 6.28, r = k === n - 1 ? 0 : 0.26; SORTES.peluche.d(repere(x, z, 0.4 + t * 1.3), Math.cos(t) * r * 0.2, F + 0.4 + (k === n - 1 ? 0.12 : 0), Math.sin(t) * r, ...(k % 3 ? ['#c89a5a', '#a87a44'] : ['#d8b070', '#b88a4a'])); }
      pop(Q, 0, F + 0.56, -0.52, 'らくだ', ROUGE, 0.34);
      murRect(x, z, 0.5, 0.5);
    },
    /** Un portant de tee-shirts (砂丘), le long de x. */
    portant(x, z, ry, l = 2) {
      const Q = repere(x, z, ry), C = ['#f4f0e4', '#2f6a9a', '#e8c88a', '#c8402c', '#f4f0e4', '#3a8a5a'], n = Math.round(l / 0.2);
      for (const u of [-1, 1]) { const b0 = Q(u * l / 2, F, 0), b1 = Q(u * l / 2, F + 1.55, 0); a.baton([b0.x, b0.y, b0.z], [b1.x, b1.y, b1.z], 0.018, '#8e9398', 6, { trait: true }); const p0 = Q(u * l / 2, F + 0.052, -0.26), p1 = Q(u * l / 2, F + 0.052, 0.26); a.baton([p0.x, p0.y, p0.z], [p1.x, p1.y, p1.z], 0.016, '#8e9398', 5, { trait: false }); }
      const b0 = Q(-l / 2, F + 1.55, 0), b1 = Q(l / 2, F + 1.55, 0);
      a.baton([b0.x, b0.y, b0.z], [b1.x, b1.y, b1.z], 0.016, '#8e9398', 6, { trait: false });
      for (let k = 0; k < n; k++) {
        const lx = -l / 2 + 0.12 + (k * (l - 0.24)) / (n - 1), c = C[k % C.length], w = 0.012;
        a.boite(w, 0.62, 0.38, c, Q(lx, F + 1.16, 0)).boite(w, 0.15, 0.56, c, Q(lx, F + 1.38, 0)).boite(w + 0.006, 0.07, 0.14, k % 2 ? '#e8c84a' : '#c8402c', Q(lx, F + 1.2, 0));
      }
      const m = Q(0, F, 0), c = Math.abs(Math.cos(ry)) > 0.5;
      murRect(m.x, m.z, c ? l / 2 + 0.02 : 0.3, c ? 0.3 : l / 2 + 0.02);
    },
    /** Un présentoir à chapeaux de paille : un mât, des chapeaux qui tournent autour. */
    chapeaux(x, z) {
      a.baton([x, F, z], [x, F + 1.5, z], 0.024, '#8e9398', 6).cylindre(0.26, 0.28, 0.04, 8, '#7a7e82', { x, y: F + 0.02, z });
      for (let k = 0; k < 8; k++) {
        const t = (k / 8) * 6.28, y = F + 0.72 + (k % 3) * 0.32, r = 0.24, X = x + Math.cos(t) * r, Z = z + Math.sin(t) * r;
        a.cylindre(0.15, 0.15, 0.012, 8, '#e8d49a', { x: X, y, z: Z, rx: 0.5 * Math.sin(t), rz: -0.5 * Math.cos(t), trait: false }).cylindre(0.075, 0.085, 0.06, 7, k % 2 ? '#d8c088' : '#e8d49a', { x: X, y: y + 0.03, z: Z, trait: false }).cylindre(0.086, 0.086, 0.016, 7, k % 3 ? '#c8402c' : '#2f6a9a', { x: X, y: y + 0.008, z: Z, trait: false });
      }
      murRect(x, z, 0.3, 0.3);
    },
    /** Un tourniquet de cartes postales : ses quatre faces de cartes (les dunes, la mer, les chameaux). */
    cartes(x, z) {
      a.baton([x, F, z], [x, F + 1.45, z], 0.022, '#8e9398', 6).cylindre(0.2, 0.22, 0.04, 8, '#7a7e82', { x, y: F + 0.02, z });
      const C = ['#e8cc94', '#5a9ac8', '#d8a860', '#7ab4d8', '#e8b08a', '#c8d8a8'];
      for (let f = 0; f < 4; f++) for (let r = 0; r < 4; r++) for (let k = 0; k < 2; k++) {
        const Q = repere(x, z, (f * Math.PI) / 2);
        a.boite(0.13, 0.17, 0.005, C[(f + r * 2 + k) % 6], Q(-0.08 + k * 0.16, F + 0.68 + r * 0.2, 0.11));
      }
      murRect(x, z, 0.24, 0.24);
    },
    /** Un frigo vitré : sa caisse blanche, sa porte éclairée, ses rangs de bouteilles ; il regarde vers +z de son repère. */
    frigo(x, z, ry, l = 0.9) {
      const Q = repere(x, z, ry), C = ['#f0dc6a', '#c8dc78', '#d8452e', '#5a9ac8', '#f4f0e4'];
      a.boite(l, 1.9, 0.6, '#eef0ee', Q(0, F + 0.95, 0, { trait: true, nuance: 0.015 })).boite(l - 0.1, 1.46, 0.02, '#dceef4', Q(0, F + 1.08, 0.3, { sorte: 'lumiere' }));
      for (let r = 0; r < 4; r++) { a.boite(l - 0.14, 0.012, 0.012, '#9aa4a8', Q(0, F + 0.56 + r * 0.36, 0.316)); for (let k = 0; k < 5; k++) a.cylindre(0.03, 0.033, 0.2, 5, C[(k + r) % 5], Q(-(l - 0.24) / 2 + (k * (l - 0.24)) / 4, F + 0.67 + r * 0.36, 0.33)); }
      a.boite(l + 0.02, 0.18, 0.62, '#2f6a9a', Q(0, F + 1.92, 0, { nuance: 0.02 }));
      const m = Q(0, F, 0), c = Math.abs(Math.cos(ry)) > 0.5;
      murRect(m.x, m.z, c ? l / 2 + 0.02 : 0.32, c ? 0.32 : l / 2 + 0.02);
    },
    /** Le comptoir d'une caisse : le bois, le dessus, la caisse, les sacs de papier pliés, une pile de boîtes, les bocaux de rakkyō. Long en z. */
    caisse(x, z, p) {
      const Q = repere(x, z, 0);
      a.boite(0.9, 0.9, p, BOIS, { x, y: F + 0.45, z, nuance: 0.03 }).boite(1.02, 0.05, p + 0.1, BOIS2, { x, y: F + 0.925, z });
      a.boite(0.36, 0.2, 0.4, '#3a3a40', { x, y: F + 1.05, z: z + p / 2 - 0.5, trait: true }).boite(0.04, 0.14, 0.26, '#a8d4b8', { x: x - 0.17, y: F + 1.09, z: z + p / 2 - 0.5, sorte: 'lumiere', trait: false });
      for (let k = 0; k < 4; k++) a.boite(0.3, 0.012, 0.4, '#d8c8a8', { x: x + 0.1, y: F + 0.958 + k * 0.012, z: z + p / 2 - 1.15, trait: false });
      rangee(Q, 'bocal', -0.3, 0.1, F + 0.95, -p / 2 + 0.4, 1, 1, ...P.rakkyo.slice(1, 3));
      pop(Q, -0.1, F + 1.05, -p / 2 + 0.18, P.rakkyo[3], ROUGE, 0.5);
      rangee(repere(x, z - p / 2 + 1.1, -PI / 2), 'boite', -0.26, 0.26, F + 0.95, 0.1, 2, 2, ...P.usagi.slice(1, 3));
      murRect(x, z, 0.52, p / 2 + 0.05);
    },
    /** Sur une table de restaurant : un plateau, un bol, un verre, des baguettes. dz : de quel côté (−1 ou 1). */
    couvert(x, y, z, dz, bol = '#f4efe2', dedans = '#e8c88a') {
      a.boite(0.34, 0.012, 0.26, '#7a3a26', { x, y: y + 0.006, z: z + dz * 0.2, trait: false }).cylindre(0.075, 0.05, 0.05, 8, bol, { x: x - 0.04, y: y + 0.037, z: z + dz * 0.2, trait: false }).cylindre(0.064, 0.064, 0.006, 8, dedans, { x: x - 0.04, y: y + 0.066, z: z + dz * 0.2, trait: false });
      a.baton([x + 0.09, y + 0.018, z + dz * 0.1], [x + 0.11, y + 0.018, z + dz * 0.3], 0.004, '#3a2a22', 4, { trait: false });
      a.cylindre(0.026, 0.022, 0.08, 6, '#bfe0ec', { x: x + 0.14, y: y + 0.052, z: z + dz * 0.02, trait: false });
    },
  };
}

// ---------------------------------------------------------------- Les records (les petits jeux du lieu) ; la planche de sable
const CLE_RECORDS = 'baladeRecords', CLE_PLANCHE = 'tottoriPlanche', CLE_JUMELLES = 'tottoriJumelles', PENALITE = 2;
// (les temps des médailles, en secondes, pénalités comprises ; mesurés avec un robot au clavier : tout droit, 12 s + 12 s de pénalités ; un bon zigzag, 16,7 s et une porte ratée ; un zigzag trop large, 23 s et deux ou trois portes ratées)
const TEMPS_MEDAILLES = [17.5, 20, 23];
const lireRecord = (cle) => { try { return JSON.parse(localStorage.getItem(CLE_RECORDS))?.[cle] ?? null; } catch { return null; } };
const ecrireRecord = (cle, v) => { try { const r = JSON.parse(localStorage.getItem(CLE_RECORDS)) || {}; r[cle] = v; localStorage.setItem(CLE_RECORDS, JSON.stringify(r)); } catch { /* navigation privée */ } };
const chiffres = (t) => t.toFixed(2);
/** La ligne du record, sous le chrono. */
const enTete = (jeu) => { const r = lireRecord(CLE_PLANCHE); return r != null ? `<small>${jeu.tx('chronoRecord')} ${chiffres(r)} s</small>` : ''; };
/**
 * Une planche de sable (サンドボード), l'avant vers +z, le dessus vers +y, 1,3 m × 30 cm : les deux bouts arrondis et relevés, la taille un peu creusée, une bande et un rond de couleur sur le dessus, les deux fixations et
 * leurs sangles, les carres. c : [le fond, le dessin, les fixations] ; o : sa pose (atelier.piece) ; k : son échelle ; g : une petite variante du dessin.
 */
function plancheSable(THREE, a, [c0, c1, c2], o = {}, k = 1, g = 0) {
  const L = 1.3 * k, W = 0.3 * k;
  // (le contour, dans le plan x, z du dessus ; le relevé des deux bouts se fait en pliant les points)
  const contour = (l, w) => {
    const s = new THREE.Shape(), q = l / 2 - 0.2 * k;
    s.moveTo(-w / 2, -q);
    s.bezierCurveTo(-w / 2, -l / 2 + 0.02 * k, -w * 0.28, -l / 2, 0, -l / 2);
    s.bezierCurveTo(w * 0.28, -l / 2, w / 2, -l / 2 + 0.02 * k, w / 2, -q);
    s.quadraticCurveTo(w * 0.43, 0, w / 2, q);
    s.bezierCurveTo(w / 2, l / 2 - 0.02 * k, w * 0.28, l / 2, 0, l / 2);
    s.bezierCurveTo(-w * 0.28, l / 2, -w / 2, l / 2 - 0.02 * k, -w / 2, q);
    s.quadraticCurveTo(-w * 0.43, 0, -w / 2, -q);
    return s;
  };
  const releve = (z) => { const d = Math.max(0, Math.abs(z) / L - 0.3); return 0.42 * L * d * d; };
  const plier = (y0) => (x, y, z) => [x, y + y0 + releve(z), z];
  const couche = (l, w, e, y0, c, opt = {}) => {
    const geo = new THREE.ExtrudeGeometry(contour(l, w), { depth: e, bevelEnabled: false, curveSegments: 7 }).rotateX(PI / 2);
    a.piece(geo, c, { ...o, deformer: plier(y0 + e), nuance: 0.015, ...opt });
  };
  // (le fond, sa semelle un peu plus sombre ; le dessin, 1 cm au-dessus)
  couche(L, W, 0.024 * k, 0, c0);
  couche(L * 0.98, W * 0.98, 0.006 * k, -0.027 * k, '#3a3a40', { trait: false });
  // une bande en long, ou deux, selon la planche
  const bande = (x, w, c) => {
    const n = 8, pos = [];
    for (let i = 0; i < n; i++) {
      const z0 = (-0.34 + (0.68 * i) / n) * L, z1 = (-0.34 + (0.68 * (i + 1)) / n) * L, y = (z) => 0.024 * k + 0.008 + releve(z);
      pos.push(x - w / 2, y(z0), z0, x - w / 2, y(z1), z1, x + w / 2, y(z0), z0, x + w / 2, y(z0), z0, x - w / 2, y(z1), z1, x + w / 2, y(z1), z1);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    a.piece(geo, c, { ...o, nuance: 0.01, trait: false });
  };
  if (g % 2) { bande(-W * 0.2, W * 0.13, c1); bande(W * 0.2, W * 0.13, c1); } else bande(0, W * 0.24, c1);
  // (un soleil, ou la dune de Tottori, vers l'avant : un rond et un demi-rond)
  a.piece(new THREE.CircleGeometry(W * 0.2, 12).rotateX(-PI / 2), c2, { ...o, deformer: (x, y, z) => { const zz = z + 0.4 * L; return [x, 0.024 * k + 0.013 + releve(zz), zz]; }, nuance: 0.01, trait: false });
  // les deux fixations : une plaque, deux sangles
  for (const z of [-0.18 * L, 0.17 * L]) {
    const y = 0.024 * k;
    const piece = (l, h, p, dy, dz, c) => { const q = new THREE.Vector3(0, y + dy, z + dz); a.boite(l, h, p, c, { ...o, deformer: (px, py, pz) => [px + q.x, py + q.y, pz + q.z], trait: false, nuance: 0.01 }); };
    piece(W * 0.62, 0.02 * k, 0.17 * k, 0.012 * k, 0, '#2a2a30');
    piece(W * 0.7, 0.03 * k, 0.05 * k, 0.05 * k, -0.04 * k, c2);
    piece(W * 0.7, 0.03 * k, 0.05 * k, 0.05 * k, 0.05 * k, c2);
    for (const u of [-1, 1]) { const qq = u * W * 0.34; a.boite(0.02 * k, 0.05 * k, 0.16 * k, '#2a2a30', { ...o, deformer: (px, py, pz) => [px + qq, py + y + 0.03 * k, pz + z], trait: false, nuance: 0.01 }); }
  }
}

// ---------------------------------------------------------------- Le télésiège (鳥取砂丘リフト) et le Sakyu Center
/**
 * Le vrai télésiège des dunes (2026-11-03 ; le propriétaire : « fais le vrai télésiège ») : « リフトに乗って砂丘まで空中散歩！ », dit le site de la ville, de la gare du
 * Sakyu Center (砂丘センター 見晴らしの丘, sur la colline) à l'entrée du sable. Comme sur les photos : des sièges à toit et à lattes corail, un numéro dans le dos, suspendus
 * à un grand C d'acier ; des pylônes gris en T ; le filet au-dessus de la route, ses passerelles de bois, ses poteaux et ses fils ; la gare du bas et son grand pignon
 * (l'horloge, « おりば ») ; en haut, la tour (« 砂丘センター », « リフトのりば »), le long bâtiment et sa boule blanche, la 砂丘テラス à côté de la gare.
 * Les sièges ne font qu'un seul objet (InstancedMesh : deux dessins pour les vingt-huit, et le trait d'encre suit, styles.js). On monte à gauche : le câble du nord vers
 * le haut, celui du sud vers le bas ; chaque siège tourne autour de deux grandes roues, sa suspente toujours vers l'extérieur (+x, dans son repère).
 */
function creerTelesiege(ctx, { monde, poser, ecrire, morceau, murRect, bancs, lumieres, animes, comp }) {
  const { THREE, atelier, P } = ctx;
  const { z: ZL, e: E, xb: XB, xh: XH } = LIFT, L1 = XH - XB, LT = 2 * L1 + 2 * PI * E, N = 28, ECART = LT / N, VITESSE = 3.2, JUMELLES_TOIT = { x: 358.2, z: 31.9 }, TABLE_TOIT = { x: 361.2, z: 33 };
  const mod = (s) => ((s % LT) + LT) % LT, PANNEAU = { x: 179.2, z: 69.8 };
  const ACIER = '#a7abac', ACIER_F = '#7f8487', CABLE = '#2f3336', CORAIL = '#e8685a', CORAIL_F = '#d75a4e', TOLE_L = '#aaa292', TOLE_L2 = '#9b9383', BOIS_CL = '#cdbb9c', BOIS_F = '#4a3a2c', VITRE = '#3d5560', BETON = '#bdb8ad', ALU = '#c6cacb', PIN = '#3a5f33';

  /** Un mur de pignon (ses points [z, y], depuis le plancher F ; ses trous [z0, z1, y0, y1]), de x à x + 0,2. */
  const pignon = (a, x, F, pts, trous, c) => {
    const s = new THREE.Shape();
    pts.forEach(([u, v], i) => (i ? s.lineTo(u, v) : s.moveTo(u, v)));
    s.closePath();
    for (const [u0, u1, v0, v1] of trous) {
      const t = new THREE.Path();
      t.moveTo(u0, v0); t.lineTo(u0, v1); t.lineTo(u1, v1); t.lineTo(u1, v0); t.closePath();
      s.holes.push(t);
    }
    a.piece(new THREE.ExtrudeGeometry(s, { depth: 0.2, bevelEnabled: false }), c, { x: x + 0.2, y: F, ry: -PI / 2, nuance: 0.02 });
  };
  /** Une main courante d'acier, le long d'un quai, de x0, z0 à x1, z1, ses montants. */
  const garde = (a, x0, z0, x1, z1, F) => {
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / 1.5));
    a.baton([x0, F + 1.0, z0], [x1, F + 1.0, z1], 0.028, ACIER, 6, { trait: false }).baton([x0, F + 0.55, z0], [x1, F + 0.55, z1], 0.018, ACIER, 5, { trait: false });
    for (let k = 0; k <= n; k++) { const x = melange(x0, x1, k / n), z = melange(z0, z1, k / n); a.baton([x, F, z], [x, F + 1.0, z], 0.022, ACIER, 5, { trait: false }); }
  };
  /** Les deux quais, dans une gare : une rampe de chaque côté de la voie, de x0 à x1, percée d'une porte en xp ; la voie, plus sombre ; la marque jaune. */
  const quais = (a, x0, x1, xp, F) => {
    for (const z of [ZL - 3.1, ZL + 3.1]) {
      garde(a, x0, z, xp - 0.7, z, F); garde(a, xp + 0.7, z, x1, z, F);
      monde.mur(x0, z, x1, z, 0.27);
      a.boite(1.4, 0.012, 0.1, '#f2c443', { x: xp, y: F + 0.045, z: z + (z < ZL ? -0.62 : 0.62), trait: false });
      for (const dx of [-0.13, 0.13]) a.ovale(0.075, '#f2c443', { x: xp + dx, y: F + 0.045, z: z + (z < ZL ? -0.36 : 0.36), sy: 0.06, sz: 1.5, trait: false }, 6);
    }
    a.boite(x1 - x0, 0.012, 6.2, '#7d7a72', { x: (x0 + x1) / 2, y: F + 0.04, z: ZL, trait: false });
  };
  /** La grande roue : son pied (au milieu de la voie), son moteur ; le reste tourne (roues, plus bas). */
  const pied = (a, x, F, plaf) => {
    a.cylindre(0.2, 0.26, 2.7, 10, ACIER_F, { x, y: F + 1.35, z: ZL }).boite(1.0, 0.7, 1.0, '#5a6a72', { x, y: F + 0.35, z: ZL, nuance: 0.02 }).boite(0.3, plaf - 2.7, 0.3, ACIER_F, { x, y: F + (plaf + 2.7) / 2, z: ZL });
  };

  // ---- la gare du bas, posée sur le sable : un grand pignon vers l'ouest, sa pente qui descend loin vers le sud, comme la vraie ; la vitre et l'horloge, « おりば » sur la tôle
  {
    const G = GARE_B, F = G.F, a = atelier(), xm = (G.x0 + G.x1) / 2, zm = (G.z0 + G.z1) / 2, HN = 5.6, HF = 7.6, HS = 3.9, ZF = 64.5, PLAF = 3.7, XP = 191;
    const toitY = (z) => (z < ZF ? melange(HN, HF, (z - G.z0) / (ZF - G.z0)) : melange(HF, HS, (z - ZF) / (G.z1 - ZF)));
    a.boite(G.x1 - G.x0, 2.6, G.z1 - G.z0, BETON, { x: xm, y: F - 1.3, z: zm, nuance: 0.02 });
    a.boite(G.x1 - G.x0 - 0.1, 0.03, G.z1 - G.z0 - 0.1, '#bdb8aa', { x: xm, y: F + 0.012, z: zm, nuance: 0.02, trait: false });
    monde.surface(G.x0 - 0.1, G.x1, G.z0, G.z1, F + 0.035, { sol: 'pierre' });
    const PTS = [[G.z0, 0], [G.z1, 0], [G.z1, HS], [ZF, HF], [G.z0, HN]];
    pignon(a, G.x0, F, PTS, [[61.6, 66.4, 0.012, 6.1], [74, 78, 0.012, 2.6]], TOLE_L);
    pignon(a, G.x1 - 0.2, F, PTS, [[ZL - 3.1, ZL + 3.1, 0.012, 3.6]], TOLE_L);
    a.boite(G.x1 - G.x0, HN, 0.2, TOLE_L, { x: xm, y: F + HN / 2, z: G.z0 + 0.1, nuance: 0.02 }).boite(G.x1 - G.x0, HS, 0.2, TOLE_L, { x: xm, y: F + HS / 2, z: G.z1 - 0.1, nuance: 0.02 });
    // le toit : ses deux pans, leurs rives de bois clair
    for (const [z0, y0, z1, y1] of [[G.z0 - 0.5, HN - 0.22, ZF, HF], [ZF, HF, G.z1 + 0.7, HS - 0.17]]) {
      const L = Math.hypot(z1 - z0, y1 - y0), ang = Math.atan2(y0 - y1, z1 - z0), zc = (z0 + z1) / 2, yc = F + (y0 + y1) / 2 + 0.1;
      a.boite(G.x1 - G.x0 + 1.2, 0.16, L, '#7a776e', { x: xm, y: yc, z: zc, rx: ang, nuance: 0.015 });
      for (const x of [G.x0 - 0.62, G.x1 + 0.62]) a.boite(0.1, 0.34, L + 0.04, BOIS_CL, { x, y: yc - 0.02, z: zc, rx: ang, nuance: 0.02 });
    }
    for (const [z, y] of [[G.z0 - 0.5, HN - 0.22], [G.z1 + 0.7, HS - 0.17]]) a.boite(G.x1 - G.x0 + 1.3, 0.14, 0.12, BOIS_CL, { x: xm, y: F + y + 0.04, z });
    // la tôle ondulée : des bandes verticales, là où il n'y a pas de vitre (sur le dehors : le pignon, le long côté sud, celui du nord)
    for (let z = G.z0 + 0.2; z < G.z1; z += 0.46) {
      if (z > 61.5 && z < 66.5) continue;
      const h = toitY(z) - 0.08, port = z > 73.9 && z < 78.1, y0 = port ? 2.72 : 0.02;
      a.boite(0.035, h - y0, 0.14, TOLE_L2, { x: G.x0 - 0.018, y: F + (h + y0) / 2, z, trait: false });
    }
    for (let x = G.x0 + 0.2; x < G.x1; x += 0.46) {
      a.boite(0.14, HS - 0.08, 0.035, TOLE_L2, { x, y: F + (HS - 0.08) / 2, z: G.z1 + 0.018, trait: false });
      a.boite(0.14, HN - 0.08, 0.035, TOLE_L2, { x, y: F + (HN - 0.08) / 2, z: G.z0 - 0.018, trait: false });
    }
    // la grande vitre, sa porte (のりば) ; l'horloge sur le montant du milieu
    a.boite(0.05, 3.4, 4.8, VITRE, { x: G.x0 + 0.1, y: F + 4.4, z: 64, trait: false });
    for (const [z0, z1] of [[61.6, 62.4], [65.6, 66.4]]) a.boite(0.05, 2.7, z1 - z0, VITRE, { x: G.x0 + 0.1, y: F + 1.35, z: (z0 + z1) / 2, trait: false });
    for (const z of [61.6, 62.4, 65.6, 66.4]) a.boite(0.1, z === 62.4 || z === 65.6 ? 2.7 : 6.1, 0.1, BOIS_F, { x: G.x0 + 0.08, y: F + (z === 62.4 || z === 65.6 ? 1.35 : 3.05), z });
    a.boite(0.1, 3.4, 0.1, BOIS_F, { x: G.x0 + 0.08, y: F + 4.4, z: 64 });
    for (const y of [2.7, 6.1]) a.boite(0.1, 0.1, 4.9, BOIS_F, { x: G.x0 + 0.08, y: F + y, z: 64 });
    const xh = G.x0 - 0.03, yh = F + 5.0;
    a.cylindre(0.68, 0.68, 0.05, 22, '#3a3a40', { x: xh + 0.02, y: yh, z: 64, rz: PI / 2 }).cylindre(0.62, 0.62, 0.05, 22, '#f4f2ea', { x: xh, y: yh, z: 64, rz: PI / 2, trait: false });
    for (let k = 0; k < 12; k++) { const t = (k / 12) * 2 * PI; a.boite(0.012, k % 3 ? 0.05 : 0.1, 0.024, '#2a2a30', { x: xh - 0.032, y: yh + Math.cos(t) * 0.53, z: 64 + Math.sin(t) * 0.53, rx: t, trait: false }); }
    // (les aiguilles : cinq heures et demie, comme sur la photo)
    for (const [t, l] of [[2.88, 0.3], [PI, 0.46]]) a.boite(0.014, l, 0.036, '#2a2a30', { x: xh - 0.04, y: yh + Math.cos(t) * l * 0.5, z: 64 + Math.sin(t) * l * 0.5, rx: t, trait: false });
    ecrire({ x: G.x0 - 0.012, y: F, z: 64, ry: -PI / 2 }, { texte: '展望台行　のりば', x: 0, y: 3.2, z: 0, l: 3.8, h: 0.5, fond: null, encre: '#f4f2ea' });
    // la grande porte de l'arrivée, son rideau de fer relevé ; « おりば » au-dessus
    a.boite(0.34, 0.34, 4.3, '#8e8a80', { x: G.x0 - 0.02, y: F + 2.76, z: 76, nuance: 0.02 });
    for (const z of [73.96, 78.04]) a.boite(0.26, 2.6, 0.1, '#6e6b62', { x: G.x0 + 0.08, y: F + 1.3, z });
    ecrire({ x: G.x0 - 0.04, y: F, z: 76, ry: -PI / 2 }, { texte: 'おりば', x: 0, y: 3.5, z: 0, l: 2.6, h: 0.86, fond: null, encre: '#2a2420' });
    // (sur le long côté nord : on le lit du haut de l'escalier)
    a.boite(7.2, 0.9, 0.05, '#2a3a5a', { x: xm - 0.4, y: F + 3.3, z: G.z0 - 0.05, trait: false });
    ecrire({ x: xm - 0.4, y: F, z: G.z0 - 0.08, ry: PI }, { texte: '← リフトのりば', x: 0, y: 3.3, z: 0, l: 6.6, h: 0.72, fond: null, encre: '#f8f8f0' });
    ecrire({ x: G.x1 + 0.012, y: F, z: ZL, ry: PI / 2 }, { texte: '鳥取砂丘リフト', x: 0, y: 4.75, z: 0, l: 5.4, h: 0.66, fond: null, encre: '#3a3a40' });
    // le plafond, ses lampes ; le tableau des prix (le vrai : le site de la ville, 2026) ; le distributeur de billets
    a.boite(G.x1 - G.x0 - 0.2, 0.05, G.z1 - G.z0 - 0.2, '#e8e2d2', { x: xm, y: F + PLAF, z: zm, trait: false });
    for (const z of [63.4, 76.6]) for (const x of [186, 193]) a.boite(1.5, 0.03, 0.18, '#fff8ea', { x, y: F + PLAF - 0.03, z, sorte: 'lumiere', trait: false });
    lumieres.push({ x: 189, y: F + 3.4, z: 63.4, halo: 0, sol: F, r: 8, c: '#7a725e' }, { x: 189, y: F + 3.4, z: 76.6, halo: 0, sol: F, r: 8, c: '#7a725e' });
    a.boite(3.2, 1.3, 0.05, '#2f4a6a', { x: 192, y: F + 2.0, z: G.z0 + 0.24, trait: false });
    ecrire({ x: 192, y: F, z: G.z0 + 0.272, ry: 0 }, { texte: '大人　片道300円　往復500円', sous: '小人　片道200円　往復300円', x: 0, y: 2.0, z: 0, l: 3.0, h: 1.0, fond: null, encre: '#f4f2ea' });
    a.boite(0.86, 1.72, 0.5, '#2f6ab0', { x: 186, y: F + 0.86, z: G.z0 + 0.46, nuance: 0.03 }).boite(0.6, 0.5, 0.02, '#dfe9f0', { x: 186, y: F + 1.28, z: G.z0 + 0.72, sorte: 'lumiere', trait: false });
    ecrire({ x: 186, y: F, z: G.z0 + 0.735, ry: 0 }, { texte: 'きっぷ', x: 0, y: 1.28, z: 0, l: 0.46, h: 0.2, fond: null, encre: '#2a2a30' });
    murRect(186, G.z0 + 0.46, 0.43, 0.25);
    // les deux quais, la voie, la grande roue
    quais(a, 183.6, G.x1 - 0.2, XP, F);
    garde(a, 183.6, ZL - 3.1, 183.6, ZL + 3.1, F);
    monde.mur(183.6, ZL - 3.1, 183.6, ZL + 3.1, 0.27);
    pied(a, XB, F, PLAF);
    poser(a.fin(), 0, 0, { y: 0, recoit: false });
    // ce qui arrête : les trois morceaux du pignon, les longs côtés, l'autre pignon (le trou de la voie est fermé par les rampes)
    for (const [z0, z1] of [[G.z0, 62.4], [65.6, 74], [78, G.z1]]) monde.mur(G.x0 + 0.1, z0, G.x0 + 0.1, z1, 0.39);
    monde.mur(G.x0, G.z0 + 0.1, G.x1, G.z0 + 0.1, 0.39); monde.mur(G.x0, G.z1 - 0.1, G.x1, G.z1 - 0.1, 0.39);
    monde.mur(G.x1 - 0.1, G.z0, G.x1 - 0.1, ZL - 3.1, 0.27); monde.mur(G.x1 - 0.1, ZL + 3.1, G.x1 - 0.1, G.z1, 0.27);
    monde.toit(G.x0, G.x1, G.z0, G.z1, F + PLAF - 0.02, F + HF + 0.4);
    // l'écriteau, entre les deux portes
    const s = panneau(atelier(), P, { ecrit: true, pied: 0.4 });
    // (le papier d'un panneau regarde vers −z du panneau : ici vers l'ouest, le sable, d'où l'on arrive)
    poser(s.fin(), PANNEAU.x, PANNEAU.z, { y: terrain(PANNEAU.x, PANNEAU.z), ry: PI / 2 });
    ecrire({ x: PANNEAU.x, y: terrain(PANNEAU.x, PANNEAU.z), z: PANNEAU.z, ry: PI / 2 }, { ...PAPIER_PANNEAU, texte: '鳥取砂丘リフト', lignes: 3, fond: '#f4ecd8', encre: '#2a2420' });
    murRect(PANNEAU.x, PANNEAU.z, 0.1, 0.84);
    // un banc de béton sur le sable, comme sur la photo : on y regarde l'horloge et les sièges qui passent
    const xb = 172.4, zb = 67.4, yb = terrain(xb, zb), b = atelier();
    b.boite(0.42, 0.08, 3.0, '#b8b09c', { x: xb, y: yb + 0.46, z: zb, nuance: 0.03 });
    for (const dz of [-1.2, 1.2]) b.boite(0.34, 0.6, 0.3, '#a8a08c', { x: xb, y: yb + 0.14, z: zb + dz, nuance: 0.03 });
    poser(b.fin(), 0, 0, { y: 0 });
    bancs.push({ de: [xb, zb - 1.3], a: [xb, zb + 1.3], y: yb + 0.5, cap: PI / 2 });
    murRect(xb, zb, 0.21, 1.5);
  }

  // ---- la gare du haut : sous la tour, sa grande porte vers la ligne ; le quai d'arrivée au nord (la porte de la terrasse), celui du départ au sud, le passage derrière la roue
  {
    const G = GARE_H, F = G.F, a = atelier(), xm = (G.x0 + G.x1) / 2, HE = 3.9, HF = 6.0, PLAF = 3.7, XP = 342, Xr = 351.4;
    a.boite(G.x1 - G.x0, 4.4, G.z1 - G.z0, BETON, { x: xm, y: F - 2.2, z: ZL, nuance: 0.02 });
    a.boite(G.x1 - G.x0 - 0.1, 0.03, G.z1 - G.z0 - 0.1, '#bdb8aa', { x: xm, y: F + 0.012, z: ZL, nuance: 0.02, trait: false });
    monde.surface(G.x0, G.x1, G.z0 - 0.1, G.z1, F + 0.035, { sol: 'pierre' });
    const PTS = [[G.z0, 0], [G.z1, 0], [G.z1, HE], [ZL, HF], [G.z0, HE]];
    pignon(a, G.x0, F, PTS, [[ZL - 3.1, ZL + 3.1, 0.012, 3.6]], '#d8d4c6');
    pignon(a, G.x1 - 0.2, F, PTS, [], '#d8d4c6');
    // les longs côtés : la porte de la terrasse, au nord ; sa baie, au sud
    for (const [x0, x1] of [[G.x0, 341], [346, G.x1]]) a.boite(x1 - x0, HE, 0.2, '#d8d4c6', { x: (x0 + x1) / 2, y: F + HE / 2, z: G.z0 + 0.1, nuance: 0.02 });
    a.boite(5, HE - 2.7, 0.2, '#d8d4c6', { x: 343.5, y: F + (HE + 2.7) / 2, z: G.z0 + 0.1, nuance: 0.02 });
    a.boite(G.x1 - G.x0, HE, 0.2, '#d8d4c6', { x: xm, y: F + HE / 2, z: G.z1 - 0.1, nuance: 0.02 });
    a.boite(G.x1 - G.x0 - 0.4, 0.9, 0.04, VITRE, { x: xm, y: F + 2.5, z: G.z1 + 0.012, trait: false });
    for (const sg of [-1, 1]) {
      const L = Math.hypot(8 + 0.6, (HF - HE) * 1.075), ang = sg * Math.atan2(HF - HE, 8), zc = ZL + sg * (8.6 / 2), yc = F + (HF + HE - (HF - HE) * 0.075) / 2 + 0.1;
      a.boite(G.x1 - G.x0 + 1.5, 0.16, L, '#5e6468', { x: xm + 0.25, y: yc, z: zc, rx: ang, nuance: 0.015 });
    }
    // (entre la gare et le Sakyu Center, pas de fente : elle s'adosse à lui)
    a.boite(1.02, HE + 0.2, G.z1 - G.z0, '#d8d4c6', { x: G.x1 + 0.5, y: F + (HE + 0.2) / 2, z: ZL, nuance: 0.02 });
    ecrire({ x: G.x0 - 0.012, y: F, z: ZL, ry: -PI / 2 }, { texte: '砂丘センター', sous: 'Sakyu Center', x: 0, y: 4.4, z: 0, l: 3.6, h: 0.86, fond: null, encre: '#2f4a6a' });
    a.boite(4.0, 0.42, 0.05, '#2a3a5a', { x: 343.5, y: F + 3.15, z: G.z0 - 0.02, trait: false });
    ecrire({ x: 343.5, y: F, z: G.z0 - 0.05, ry: PI }, { texte: 'リフトのりば', x: 0, y: 3.15, z: 0, l: 3.6, h: 0.34, fond: null, encre: '#f4f2ea' });
    a.boite(G.x1 - G.x0 - 0.2, 0.05, G.z1 - G.z0 - 0.2, '#e8e2d2', { x: xm, y: F + PLAF, z: ZL, trait: false });
    for (const z of [64.4, 75.6]) for (const x of [340, 348]) a.boite(1.5, 0.03, 0.18, '#fff8ea', { x, y: F + PLAF - 0.03, z, sorte: 'lumiere', trait: false });
    lumieres.push({ x: 345, y: F + 3.4, z: 64.4, halo: 0, sol: F, r: 8, c: '#7a725e' }, { x: 345, y: F + 3.4, z: 75.6, halo: 0, sol: F, r: 8, c: '#7a725e' });
    quais(a, G.x0 + 0.2, Xr, XP, F);
    garde(a, Xr, ZL - 3.1, Xr, ZL + 3.1, F);
    monde.mur(Xr, ZL - 3.1, Xr, ZL + 3.1, 0.27);
    pied(a, XH, F, PLAF);
    poser(a.fin(), 0, 0, { y: 0, recoit: false });
    for (const [z0, z1] of [[G.z0, ZL - 3.1], [ZL + 3.1, G.z1]]) monde.mur(G.x0 + 0.1, z0, G.x0 + 0.1, z1, 0.27);
    monde.mur(G.x0, G.z1 - 0.1, G.x1, G.z1 - 0.1, 0.27); monde.mur(G.x1 - 0.1, G.z0, G.x1 - 0.1, G.z1, 0.27);
    monde.mur(G.x0, G.z0 + 0.1, 341, G.z0 + 0.1, 0.27); monde.mur(346, G.z0 + 0.1, G.x1, G.z0 + 0.1, 0.27);
    monde.toit(G.x0, G.x1, G.z0, G.z1, F + PLAF - 0.02, F + HF + 0.4);
    // (son mur nord : la caméra reste devant, au pied de l'escalier du toit, plutôt que d'entrer dans le mur)
    monde.bloc(346, G.x1 + 1, G.z0 - 0.02, G.z0 + 0.22, F - 1, F + PLAF);
  }

  // ---- le Sakyu Center : long et bas, ses bandeaux de fenêtres, sa boule blanche et ses réservoirs sur le toit, sa tour ; dedans, les gâteaux et les souvenirs au nord, le restaurant au sud
  {
    const a = atelier(), K = CENTRE, F = GARE_H.F, xf = 356, xb = 386, z0 = 30, z1 = 78, H1 = 3.6, H2 = 7.2, PLAF = 3.3, M1 = '#efe8d8', M2 = '#ddd6c6';
    const xc = (xf + xb) / 2, zc = (z0 + z1) / 2;
    // le dehors : le socle, le mur du bas (plein là où il n'y a pas la salle), l'étage, le toit
    a.boite(xb - xf, 3, z1 - z0, BETON, { x: xc, y: F - 1.5, z: zc, nuance: 0.02 });
    a.boite(xb - xf, H1, K.z0 - 0.1 - z0, M2, { x: xc, y: F + H1 / 2, z: (z0 + K.z0 - 0.1) / 2, nuance: 0.02 });
    a.boite(xb - xf, H1, z1 - K.z1 - 0.1, M2, { x: xc, y: F + H1 / 2, z: (z1 + K.z1 + 0.1) / 2, nuance: 0.02 });
    a.boite(xb - K.x1 - 0.1, H1, K.z1 - K.z0 + 0.2, M2, { x: (xb + K.x1 + 0.1) / 2, y: F + H1 / 2, z: (K.z0 + K.z1) / 2, nuance: 0.02 });
    a.boite(xb - xf, H2 - H1, z1 - z0, M1, { x: xc, y: F + (H1 + H2) / 2, z: zc, nuance: 0.02 });
    a.boite(xb - xf + 0.4, 0.3, z1 - z0 + 0.4, '#8a8d8e', { x: xc, y: F + H2 + 0.13, z: zc });
    // le long bandeau de fenêtres de l'étage (vers la mer, à l'ouest et au nord)
    a.boite(0.04, 1.15, z1 - z0 - 2, '#5d7683', { x: xf - 0.018, y: F + H1 + 1.75, z: zc, trait: false }).boite(xb - xf - 2, 1.15, 0.04, '#5d7683', { x: xc, y: F + H1 + 1.75, z: z0 - 0.018, trait: false });
    for (let z = z0 + 1; z <= z1 - 0.99; z += 2.3) a.boite(0.07, 1.25, 0.09, ALU, { x: xf - 0.03, y: F + H1 + 1.75, z, trait: false });
    for (let x = xf + 1; x <= xb - 0.99; x += 2.3) a.boite(0.09, 1.25, 0.07, ALU, { x, y: F + H1 + 1.75, z: z0 - 0.03, trait: false });
    // la façade du bas, sur la terrasse : les vitrines, leurs montants, la porte (de chaque côté)
    for (const [za, zb] of [[K.z0, K.porte.z0 - 0.08], [K.porte.z1 + 0.08, K.z1]]) {
      a.boite(0.05, 2.5, zb - za - 0.02, VITRE, { x: xf + 0.22, y: F + 1.3, z: (za + zb) / 2, trait: false }).boite(0.1, 0.1, zb - za, ALU, { x: xf + 0.2, y: F + 2.6, z: (za + zb) / 2, trait: false }).boite(0.1, 0.1, zb - za, ALU, { x: xf + 0.2, y: F + 0.08, z: (za + zb) / 2, trait: false });
      for (let z = za; z <= zb + 0.01; z += 1.6) a.boite(0.08, 2.5, 0.06, ALU, { x: xf + 0.2, y: F + 1.3, z, trait: false });
    }
    a.boite(0.3, H1 - 2.7, K.z1 - K.z0, M2, { x: xf + 0.15, y: F + (H1 + 2.7) / 2, z: (K.z0 + K.z1) / 2, nuance: 0.02 });
    a.boite(0.05, 0.46, 3.8, '#2a4a7a', { x: xf - 0.03, y: F + 3.05, z: (K.porte.z0 + K.porte.z1) / 2, trait: false });
    ecrire({ x: xf - 0.06, y: F, z: (K.porte.z0 + K.porte.z1) / 2, ry: -PI / 2 }, { texte: 'おみやげ・お食事', x: 0, y: 3.05, z: 0, l: 3.4, h: 0.38, fond: null, encre: '#f8f2e2' });
    // le toit : la rambarde du belvédère (眺望テラス), trois réservoirs, la boule blanche sur son pied
    const yt = F + H2 + 0.28;
    // (on y monte : 2026-11-03, « en haut du télésiège, je trouve qu'il n'y a pas grand chose à faire ». La rambarde a sa porte, à l'ouest, en haut de l'escalier)
    for (const [x0, z0r, x1, z1r] of [[xf + 0.3, z0 + 0.3, xb - 0.3, z0 + 0.3], [xf + 0.3, z0 + 0.3, xf + 0.3, TOIT.pz0 - 0.1], [xf + 0.3, TOIT.pz1 + 0.1, xf + 0.3, z1 - 0.3], [xb - 0.3, z0 + 0.3, xb - 0.3, z1 - 0.3], [xf + 0.3, z1 - 0.3, xb - 0.3, z1 - 0.3]]) garde(a, x0, z0r, x1, z1r, yt);
    monde.surface(TOIT.x0, TOIT.x1, TOIT.z0, TOIT.z1, TOIT.y, { etage: true, sol: 'pierre' });
    // (le dessus : un dallage clair, dalle par dalle, 2,7 cm au-dessus du toit ; dans leurs joints, un lit à peine plus sombre, 1 cm au-dessus)
    a.boite(xb - xf - 0.7, 0.02, z1 - z0 - 0.7, '#9f9a8d', { x: xc, y: yt, z: zc, nuance: 0.01, trait: false });
    {
      const nx = 15, nz = 24, lx = (xb - xf - 0.7) / nx, lz = (z1 - z0 - 0.7) / nz;
      for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
        const x = xf + 0.35 + (i + 0.5) * lx, z = z0 + 0.35 + (j + 0.5) * lz;
        if (x < 362.3 - lx / 2 && z > 65 + lz / 2 && z < 75 - lz / 2) continue; // (sous la tour)
        a.boite(lx - 0.05, 0.03, lz - 0.05, hasard(i, j) < 0.62 ? '#b2ab9b' : '#c5beae', { x, y: yt + 0.012, z, nuance: 0, trait: false });
      }
    }
    // (en bas, le rectangle du toit est dans le cadre : ces murs ferment la salle, jusqu'à hauteur d'homme ; la porte de l'escalier ne laisse pas passer depuis la terrasse)
    const HM = [F - 1, F + 3];
    monde.mur(K.x0, K.z0, K.x1, K.z0, 0.27, ...HM); monde.mur(K.x1, K.z0, K.x1, K.z1, 0.27, ...HM); monde.mur(K.x0, K.z1, K.x1, K.z1, 0.27, ...HM);
    monde.mur(TERRASSE.x1, TOIT.pz0 - 0.1, TERRASSE.x1, TOIT.pz1 + 0.1, 0.02, ...HM);
    monde.mur(K.x0, TOIT.pz0 - 0.1, K.x0, TOIT.pz1 + 0.1, 0.2, ...HM);
    // l'escalier : deux limons d'acier, ses marches, ses mains courantes ; son palier en haut, posé sur quatre poteaux ; on passe dessous pour aller à la porte
    {
      const n = 30, gx = (TOIT.ez1 - TOIT.ez0) / n, gy = (yt - F) / n, xm = (TOIT.ex0 + TOIT.ex1) / 2, W = TOIT.ex1 - TOIT.ex0, yE = (z) => F + ((TOIT.ez1 - z) / (TOIT.ez1 - TOIT.ez0)) * (yt - F);
      for (let k = 0; k < n; k++) a.boite(W - 0.06, 0.05, gx + 0.04, k % 2 ? '#7a7e82' : '#6e7276', { x: xm, y: F + (k + 1) * gy - 0.03, z: TOIT.ez1 - (k + 0.5) * gx, nuance: 0.01, trait: false });
      for (const x of [TOIT.ex0 + 0.02, TOIT.ex1 - 0.02]) {
        a.baton([x, F - 0.02, TOIT.ez1 + 0.04], [x, yt - 0.08, TOIT.ez0], 0.05, '#5e6468', 6);
        a.baton([x, F + 1.0, TOIT.ez1], [x, yt + 1.0, TOIT.ez0], 0.024, ACIER, 6, { trait: false });
        for (let k = 0; k <= 10; k++) { const z = melange(TOIT.ez1, TOIT.ez0, k / 10); a.baton([x, yE(z) - 0.02, z], [x, yE(z) + 1.0, z], 0.016, ACIER, 5, { trait: false }); }
      }
      // (le palier, jusqu'au toit ; sa rambarde au nord et à l'ouest)
      a.boite(xf + 0.35 - TOIT.ex0, 0.1, TOIT.pz1 + 0.3 - TOIT.pz0 + 0.3, '#6e7276', { x: (TOIT.ex0 + xf + 0.35) / 2, y: yt - 0.03, z: (TOIT.pz0 + TOIT.pz1) / 2 + 0.05, nuance: 0.01 });
      garde(a, TOIT.ex0, TOIT.pz0 - 0.27, xf + 0.3, TOIT.pz0 - 0.27, yt); garde(a, TOIT.ex0, TOIT.pz0 - 0.27, TOIT.ex0, TOIT.ez0, yt);
      for (const [x, z] of [[TOIT.ex0 + 0.05, TOIT.pz0 - 0.2], [TOIT.ex0 + 0.05, TOIT.ez0 + 0.1], [TOIT.ex1 - 0.05, TOIT.pz0 - 0.2], [TOIT.ex1 - 0.05, TOIT.ez0 + 0.1]]) { a.baton([x, F, z], [x, yt - 0.1, z], 0.045, '#5e6468', 6); monde.cercle(x, z, 0.33, F - 1, F + 3); }
      a.boite(0.05, 0.52, 1.5, '#2a4a6a', { x: TOIT.ex0 - 0.05, y: F + 1.5, z: 57.7, nuance: 0.01 });
      ecrire({ x: TOIT.ex0 - 0.08, y: F, z: 57.7, ry: -PI / 2 }, { texte: '屋上展望台 →', sous: 'Rooftop viewpoint', x: 0, y: 1.5, z: 0, l: 1.36, h: 0.46, fond: null, encre: '#f4f2ea' });
      // (ce qu'on peut marcher : les marches, le palier ; les bords : plus bas, on ne passe pas sous les marches ; plus haut, seul qui est dessus s'y arrête)
      monde.rampe(TOIT.ex0, TOIT.ex1, TOIT.ez0, TOIT.ez1, 'z', yt, F, { sol: 'bois', etage: true });
      monde.surface(TOIT.ex0, TOIT.x0 + 0.02, TOIT.pz0 - 0.12, TOIT.ez0 + 0.02, yt + 0.02, { sol: 'bois', etage: true });
      monde.mur(TOIT.ex0 - 0.02, TOIT.ez0, TOIT.ex0 - 0.02, TOIT.ez1, 0.25, F + 1, yt + 2);
      monde.mur(TOIT.ex1 + 0.02, TOIT.ez0, TOIT.ex1 + 0.02, TOIT.ez1, 0.25, F + 1, yt + 2);
      monde.mur(TOIT.ex0 - 0.02, 53.2, TOIT.ex0 - 0.02, TOIT.ez1 - 0.02, 0.25, F - 1, F + 1.2);
      monde.mur(TOIT.ex1 + 0.02, 53.2, TOIT.ex1 + 0.02, TOIT.ez1 - 0.02, 0.25, F - 1, F + 1.2);
      monde.mur(TOIT.ex0, 53.2, TOIT.ex1, 53.2, 0.25, F - 1, F + 1.2);
      monde.mur(TOIT.ex0, TOIT.pz0 - 0.27, TOIT.x0, TOIT.pz0 - 0.27, 0.25, yt - 0.5, yt + 2);
      monde.mur(TOIT.ex0, TOIT.pz0 - 0.27, TOIT.ex0, TOIT.ez0, 0.25, yt - 0.5, yt + 2);
      monde.mur(TERRASSE.x1 + 0.5, TOIT.pz1 + 0.1, TERRASSE.x1 + 0.5, TOIT.ez0 + 0.1, 0.1, yt - 0.5, yt + 2);
    }
    // sur le toit : les jumelles (le jeu), un banc, la table d'orientation (方位盤), ce qui ne se traverse pas
    {
      const { x: xj, z: zj } = JUMELLES_TOIT;
      a.baton([xj, yt, zj], [xj, yt + 1.12, zj], 0.05, ACIER_F, 8).boite(0.15, 0.16, 0.2, '#3f5f8a', { x: xj, y: yt + 1.2, z: zj });
      for (const dx of [-0.09, 0.09]) a.cylindre(0.08, 0.095, 0.44, 10, '#3f5f8a', { x: xj + dx, y: yt + 1.3, z: zj - 0.04, rx: PI / 2 - 0.08 });
      // (la boîte où l'on glisse la pièce, sur le pied)
      a.boite(0.13, 0.18, 0.1, '#c8ccd0', { x: xj, y: yt + 0.86, z: zj + 0.05 }).boite(0.05, 0.012, 0.02, '#2a2a30', { x: xj, y: yt + 0.9, z: zj + 0.105, trait: false });
      monde.cercle(xj, zj - 0.12, 0.5, yt - 0.5, yt + 2);
      const { x: xt, z: zt } = TABLE_TOIT;
      a.cylindre(0.2, 0.26, 0.95, 10, BETON, { x: xt, y: yt + 0.48, z: zt, nuance: 0.03 }).cylindre(0.42, 0.42, 0.05, 18, '#6f7a64', { x: xt, y: yt + 0.98, z: zt, rx: 0.14, nuance: 0.01 });
      for (let k = 0; k < 8; k++) { const t = (k / 8) * 2 * PI; a.boite(0.012, 0.012, k % 2 ? 0.1 : 0.18, '#d8d4c0', { x: xt + Math.sin(t) * 0.28, y: yt + 1.012 - Math.cos(t) * 0.04, z: zt + Math.cos(t) * 0.28, ry: t, trait: false }); }
      monde.cercle(xt, zt, 0.5, yt - 0.5, yt + 2);
      ecrire({ x: xt, y: yt, z: zt + 0.42, ry: 0 }, { texte: '方位盤', x: 0, y: 0.62, z: 0.25, l: 0.3, h: 0.13, fond: null, encre: '#3a3a40' });
      a.boite(2.8, 0.08, 0.44, '#9a7a54', { x: 366, y: yt + 0.46, z: 32.3, nuance: 0.03 });
      for (const dx of [-1.1, 1.1]) a.boite(0.1, 0.44, 0.34, ACIER_F, { x: 366 + dx, y: yt + 0.22, z: 32.3 });
      bancs.push({ de: [364.9, 32.3], a: [367.1, 32.3], y: yt + 0.5, cap: PI, etage: true });
      murRect(366, 32.3, 1.4, 0.22, 0.27, yt - 0.5, yt + 2);
      // (des bacs de pins, le long de la rambarde sud du belvédère ; sur le mur de la tour, son nom)
      for (const [x, z] of [[378, 33], [381.5, 33], [381.5, 50]]) {
        a.boite(1.2, 0.5, 1.2, '#8a8880', { x, y: yt + 0.25, z, nuance: 0.03 }).fut([x, yt + 0.46, z], [x + 0.12, yt + 1.7, z], 0.07, 0.035, '#5a4636', 6);
        for (const [dx, dz, yy, r] of [[0.1, 0, 1.72, 0.62], [-0.3, 0.18, 1.32, 0.44], [0.4, -0.14, 1.2, 0.4]]) a.houppe(r, PIN, { x: x + dx, y: yt + yy, z: z + dz, sy: 0.5, bosses: 0.24, sorte: 'conifere' }, 1);
        murRect(x, z, 0.6, 0.6, 0.27, yt - 0.5, yt + 2);
      }
      // (les réservoirs, le socle de la boule, la tour)
      for (const z of [38, 41.2, 44.4]) monde.cercle(376, z, 1.37, yt - 0.5, yt + 3);
      murRect(369, 52, 2.3, 2.8, 0.27, yt - 0.5, yt + 3);
      murRect(359.3, 70, 3, 5, 0.27, yt - 0.5, yt + 6);
    }
    // (les réservoirs d'eau, sur leur dalle, cerclés ; le tuyau qui les relie, au-dessus des têtes ; « 受水槽 » sur celui du milieu)
    for (const z of [38, 41.2, 44.4]) {
      a.cylindre(1.1, 1.1, 2.2, 12, '#d8d8d0', { x: 376, y: yt + 1.2, z, nuance: 0.02 }).cylindre(0.2, 1.1, 0.3, 12, '#c8c8c0', { x: 376, y: yt + 2.45, z });
      a.cylindre(1.2, 1.2, 0.12, 12, BETON, { x: 376, y: yt + 0.06, z, nuance: 0.02 });
      for (const dy of [0.72, 1.86]) a.cylindre(1.125, 1.125, 0.07, 12, ACIER, { x: 376, y: yt + dy, z, nuance: 0.01, trait: false });
    }
    a.baton([376, yt + 1.98, 38], [376, yt + 1.98, 44.4], 0.06, ACIER_F, 8);
    a.boite(0.03, 0.3, 0.72, '#f0eee6', { x: 374.875, y: yt + 1.3, z: 41.2, nuance: 0.01 });
    ecrire({ x: 374.855, y: F, z: 41.2, ry: -PI / 2 }, { texte: '受水槽', x: 0, y: H2 + 0.28 + 1.3, z: 0, l: 0.62, h: 0.22, fond: null, encre: '#2a4a6a' });
    // (le socle de la boule : sa semelle, son bandeau ; à l'ouest sa porte de service, au nord et au sud ses grilles, à l'est une armoire électrique)
    a.boite(4.6, 2.8, 5.6, M2, { x: 369, y: yt + 1.4, z: 52, nuance: 0.02 }).baton([369, yt + 2.8, 52], [369, yt + 4.4, 52], 0.14, ACIER, 8).ovale(1.55, '#f4f4ee', { x: 369, y: yt + 5.8, z: 52, nuance: 0.01 }, 14);
    a.boite(4.72, 0.12, 5.72, BETON, { x: 369, y: yt + 0.06, z: 52, nuance: 0.02 }).boite(4.8, 0.14, 5.8, M1, { x: 369, y: yt + 2.77, z: 52, nuance: 0.01 });
    a.boite(0.03, 2.2, 1.2, '#8a8d8e', { x: 366.69, y: yt + 1.1, z: 52, nuance: 0.01 }).boite(0.05, 2.08, 1.04, '#6e7276', { x: 366.685, y: yt + 1.1, z: 52, nuance: 0.01 }).boite(0.05, 0.03, 0.14, ACIER, { x: 366.645, y: yt + 1.0, z: 52.34, trait: false });
    a.boite(0.012, 0.36, 0.72, '#f4f2ea', { x: 366.655, y: yt + 1.55, z: 52, nuance: 0, trait: false });
    ecrire({ x: 366.646, y: F, z: 52, ry: -PI / 2 }, { texte: '関係者以外', sous: '立入禁止', x: 0, y: H2 + 0.28 + 1.55, z: 0, l: 0.66, h: 0.32, fond: null, encre: '#b03020' });
    for (const [zv, s] of [[49.2, -1], [54.8, 1]]) {
      a.boite(1.3, 0.8, 0.03, '#8a8d8e', { x: 369, y: yt + 1.7, z: zv + s * 0.01, nuance: 0.01 });
      for (let k = 0; k < 5; k++) a.boite(1.2, 0.035, 0.03, '#5e6468', { x: 369, y: yt + 1.42 + k * 0.14, z: zv + s * 0.03, nuance: 0, trait: false });
    }
    a.boite(0.22, 1.3, 0.9, '#9aa0a2', { x: 371.41, y: yt + 0.75, z: 52.6, nuance: 0.01 }).boite(0.02, 0.02, 0.1, ACIER_F, { x: 371.53, y: yt + 0.85, z: 52.92, trait: false });
    // la tour : son fût, « リフトのりば », sa salle vitrée, « 砂丘センター » tout en haut
    const xT0 = 356.3, xT1 = 362.3, zT0 = 65, zT1 = 75, xTm = (xT0 + xT1) / 2, zTm = (zT0 + zT1) / 2;
    a.boite(xT1 - xT0, 5.4, zT1 - zT0, M1, { x: xTm, y: F + H2 + 2.7, z: zTm, nuance: 0.02 });
    // (côté toit : une porte de service, une bande de fenêtres à l'est et au nord)
    a.boite(0.03, 2.2, 1.2, '#8a8d8e', { x: xT1 + 0.01, y: yt + 1.1, z: 70, nuance: 0.01 }).boite(0.05, 2.08, 1.04, '#6e7276', { x: xT1 + 0.015, y: yt + 1.1, z: 70, nuance: 0.01 }).boite(0.05, 0.03, 0.14, ACIER, { x: xT1 + 0.055, y: yt + 1.0, z: 70.34, trait: false });
    a.boite(0.04, 0.72, zT1 - zT0 - 1.6, '#5d7683', { x: xT1 + 0.01, y: yt + 3.2, z: zTm, trait: false }).boite(xT1 - xT0 - 1.4, 0.72, 0.04, '#5d7683', { x: xTm, y: yt + 3.2, z: zT0 - 0.01, trait: false });
    for (let z = zT0 + 0.8; z <= zT1 - 0.79; z += 2.1) a.boite(0.07, 0.78, 0.07, ALU, { x: xT1 + 0.02, y: yt + 3.2, z, trait: false });
    for (let x = xT0 + 0.7; x <= xT1 - 0.69; x += 1.15) a.boite(0.07, 0.78, 0.07, ALU, { x, y: yt + 3.2, z: zT0 - 0.02, trait: false });
    a.boite(xT1 - xT0 + 0.5, 0.2, zT1 - zT0 + 0.5, M2, { x: xTm, y: F + H2 + 5.5, z: zTm });
    a.boite(xT1 - xT0 - 0.1, 2.3, zT1 - zT0 - 0.1, '#5d7683', { x: xTm, y: F + H2 + 6.75, z: zTm, trait: false });
    for (let z = zT0; z <= zT1 + 0.01; z += 2) a.boite(0.1, 2.3, 0.1, ALU, { x: xT0 + 0.04, y: F + H2 + 6.75, z, trait: false });
    a.boite(xT1 - xT0 + 0.8, 1.1, zT1 - zT0 + 0.8, '#f4f2ea', { x: xTm, y: F + H2 + 8.45, z: zTm });
    a.boite(0.1, 1.05, zT1 - zT0 - 0.4, '#1f3454', { x: xT0 - 0.05, y: F + H2 + 3.4, z: zTm, nuance: 0.01 });
    ecrire({ x: xT0 - 0.11, y: F, z: zTm, ry: -PI / 2 }, { texte: 'リフトのりば', x: 0, y: H2 + 3.4, z: 0, l: 8.6, h: 0.9, fond: null, encre: '#f8f8f0' });
    ecrire({ x: xT0 - 0.42, y: F, z: zTm, ry: -PI / 2 }, { texte: '砂丘センター', x: 0, y: H2 + 8.45, z: 0, l: 9.4, h: 0.95, fond: null, encre: '#1f3454' });
    // le dedans : le carrelage, le plafond, ses lampes, le mur du fond (les boîtes pleines autour font les autres)
    a.boite(K.x1 - K.x0 + 0.1, 0.05, K.z1 - K.z0 + 0.1, '#c8bfa8', { x: (K.x0 + K.x1) / 2, y: F + 0.01, z: (K.z0 + K.z1) / 2, nuance: 0.03, trait: false });
    monde.surface(K.x0 - 0.8, K.x1, K.z0, K.z1, F + 0.035, { sol: 'pierre' });
    a.boite(K.x1 - K.x0 + 0.1, 0.05, K.z1 - K.z0 + 0.1, '#e8e2d2', { x: (K.x0 + K.x1) / 2, y: F + PLAF, z: (K.z0 + K.z1) / 2, trait: false });
    for (let x = K.x0 + 2.5; x < K.x1; x += 5.2) for (let z = K.z0 + 3.2; z < K.z1; z += 7) a.boite(1.5, 0.03, 0.18, '#fff8ea', { x, y: F + PLAF - 0.03, z, sorte: 'lumiere', trait: false });
    for (const [z, x] of [[40, 361], [40, 371], [53, 361], [53, 371]]) lumieres.push({ x, y: F + 3.0, z, halo: 0, sol: F, r: 8, c: '#7a725e' });
    // la cloison entre la boutique et le restaurant
    a.boite(14, 2.6, 0.14, '#b89a74', { x: K.x1 - 7, y: F + 1.3, z: 49, nuance: 0.03 });
    monde.mur(K.x1 - 14, 49, K.x1 + 0.1, 49, 0.34);
    // ---- la boutique, au nord : surtout des gâteaux et des souvenirs de Tottori (creerMagasin)
    const bC = atelier(), mC = creerMagasin(THREE, bC, { ecrire, murRect, F });
    mC.etagere(359.0, K.z0 + 0.32, 0, 3.7, [['usagi', 'nashi', 'daisen'], ['kani', 'sakyu'], ['sable', 'ika', 'sable'], ['peluche']], 'お菓子', '#a83a2a');
    mC.etagere(362.9, K.z0 + 0.32, 0, 3.7, [['nashi', 'usagi', 'nashi'], ['sakyu', 'kani'], ['daisen', 'usagi', 'daisen'], ['ika', 'sable', 'ika']], '鳥取銘菓', '#2f6a4a');
    mC.etagere(366.8, K.z0 + 0.32, 0, 3.7, [['chuhai', 'chuhai'], ['chuhai', 'jus'], ['rakkyo', 'rakkyo'], ['kani', 'kani']], '二十世紀梨', '#6a8a3a');
    mC.etagere(370.7, K.z0 + 0.32, 0, 3.7, [['peluche'], ['peluche'], ['usagi', 'sakyu', 'daisen'], ['sable', 'ika']], '砂丘みやげ', '#a86a2a');
    for (const [xt, zt, b0, h0, b1] of [[360.3, 38.4, ['usagi', 'nashi'], ['usagi', 'daisen'], ['nashi', 'usagi']], [364.7, 38.4, ['kani', 'sakyu'], ['chuhai', 'jus'], ['sakyu', 'kani']], [360.3, 43, ['nashi', 'daisen'], ['usagi', 'nashi'], ['daisen', 'nashi']], [364.7, 43, ['kani', 'ika'], ['rakkyo'], ['ika', 'kani']]]) mC.table(xt, zt, 3.1, 1.5, b0, h0, b1);
    mC.panier(368.5, 38.2); mC.chapeaux(368.5, 40.3); mC.cartes(368.5, 42.2); mC.panier(368.5, 44.4, 5);
    mC.portant(372, 47.9, 0, 3.6); mC.frigo(375.4, 36.2, -PI / 2, 1.5);
    mC.caisse(372, 41, 5.2);
    for (const [x, z, t, c] of [[360.3, 36.2, 'お菓子', '#a83a2a'], [364.7, 36.2, '二十世紀梨', '#6a8a3a'], [360.3, 40.8, '因幡の白うさぎ', '#c8402c'], [364.7, 40.8, 'おみやげ', '#2f6a4a']]) mC.banniere(x, z, 0, PLAF, t, c);
    // ---- le restaurant, au sud : ses tables, sa carte (les vrais plats : le bol de fruits de mer, le chanpon au bouillon d'os de bœuf, le jus de poire Nijisseiki)
    const table = (xt, zt) => {
      a.boite(1.3, 0.05, 0.8, '#6e4a2c', { x: xt, y: F + 0.72, z: zt }).baton([xt, F, zt], [xt, F + 0.7, zt], 0.05, '#3a3a40', 6);
      for (const dz of [-0.62, 0.62]) for (const dx of [-0.34, 0.34]) a.boite(0.36, 0.05, 0.36, '#3a7a9a', { x: xt + dx, y: F + 0.44, z: zt + dz }).baton([xt + dx, F, zt + dz], [xt + dx, F + 0.42, zt + dz], 0.025, '#3a3a40', 5);
      a.cylindre(0.05, 0.05, 0.12, 8, '#3a5a7a', { x: xt - 0.42, y: F + 0.81, z: zt }).boite(0.18, 0.02, 0.12, '#f4efe2', { x: xt + 0.45, y: F + 0.755, z: zt - 0.15, trait: false });
      murRect(xt, zt, 0.65, 0.8);
    };
    for (const [xt, zt] of [[361, 52.6], [366, 52.6], [371, 52.6], [361, 57.4], [366, 57.4]]) table(xt, zt);
    // (les couverts du client ; quelques tables encore ; le passe-plat au fond, son noren, le frigo, des bannières)
    for (const [x, z, d, c] of [[360.66, 52.6, -0.8, '#d8603a'], [370.66, 52.6, -0.8, '#e8c88a'], [371.34, 52.6, 0.8, '#d8603a']]) mC.couvert(x, F + 0.745, z, d, '#f4efe2', c);
    bC.boite(0.9, 0.92, 3.6, '#8a5f3c', { x: 375.3, y: F + 0.46, z: 54.2, nuance: 0.03 }).boite(1.02, 0.05, 3.7, '#5e4028', { x: 375.3, y: F + 0.945, z: 54.2 });
    murRect(375.3, 54.2, 0.51, 1.85);
    for (const z of [53, 54.3, 55.6]) mC.couvert(375.2, F + 0.97, z, 0.3, '#f4efe2', z < 54 ? '#d8603a' : '#e8c88a');
    for (let k = 0; k < 3; k++) bC.boite(0.012, 0.62, 1.18, k % 2 ? '#2a4a7a' : '#2f5a8a', { x: 374.8, y: F + PLAF - 0.33, z: 53 + k * 1.2, nuance: 0.02 });
    mC.frigo(371, 49.5, 0, 1.3);
    mC.banniere(363.5, 55, 0, PLAF, '海鮮丼', '#2a4a7a'); mC.banniere(368.6, 50.6, 0, PLAF, '鳥取ラーメン', '#c8402c');
    for (const [xm, t] of [[370.6, '海鮮彩り丼'], [372.2, '牛骨ちゃんぽん'], [373.8, 'かにバーガー'], [375.2, '二十世紀梨ジュース']]) {
      a.boite(0.42, 1.5, 0.02, '#eadfc4', { x: xm, y: F + 2.0, z: K.z1 - 0.03, trait: false });
      ecrire({ x: xm, y: F, z: K.z1 - 0.05, ry: PI }, { texte: t, vertical: true, x: 0, y: 2.0, z: 0, l: 0.3, h: 1.36, fond: null, encre: '#2a2420' });
    }
    monde.toit(K.x0 - 0.2, K.x1 + 0.2, K.z0 - 0.2, K.z1 + 0.2, F + PLAF - 0.02, F + H2 + 0.3);
    // (la caméra n'entre pas dans ce qui est plein : de la gare ou de la salle, elle s'approche)
    monde.bloc(xf - 1, xb, K.z1 + 0.1, z1, F - 3, F + H2 + 0.3); monde.bloc(K.x1 + 0.1, xb, z0, K.z1 + 0.1, F - 3, F + H2 + 0.3); monde.bloc(xf, xb, z0, K.z0 - 0.1, F - 3, F + H2 + 0.3);
    poser(a.fin(), 0, 0, { y: 0, recoit: false });
    poser(bC.fin(), 0, 0, { y: 0, recoit: false, dedans: [332, 392, 28, 66, F - 2, F + 6] });
  }

  // ---- la 砂丘テラス : à côté de la gare, une grande dalle au-dessus des pins, une seule barrière (poteaux d'acier et fils, comme le long de la ligne), deux bancs, des jumelles
  const JUMELLES = { x: 339.6, z: 38.7 };
  {
    const T = TERRASSE, F = GARE_H.F, a = atelier(), Y = F - 0.02;
    const cote = (x0, z0, x1, z1) => {
      const n = Math.round(Math.hypot(x1 - x0, z1 - z0) / 2);
      for (const [h, r] of [[1.0, 0.03], [0.68, 0.012], [0.36, 0.012]]) a.baton([x0, Y + h, z0], [x1, Y + h, z1], r, h === 1 ? ALU : ACIER_F, 5, { trait: false });
      for (let k = 0; k <= n; k++) { const x = melange(x0, x1, k / n), z = melange(z0, z1, k / n); a.baton([x, Y - 0.4, z], [x, Y + 1.04, z], 0.032, ACIER, 6); }
    };
    cote(T.x0 + 0.03, T.z0 + 0.03, T.x1 + 0.3, T.z0 + 0.03);
    cote(T.x0 + 0.03, T.z0 + 0.03, T.x0 + 0.03, T.z1 - 0.08);
    // les jumelles, sur leur pied ; le nom de la terrasse
    a.baton([JUMELLES.x, Y, JUMELLES.z], [JUMELLES.x, Y + 1.12, JUMELLES.z], 0.05, ACIER_F, 8).boite(0.14, 0.14, 0.2, ACIER_F, { x: JUMELLES.x, y: Y + 1.2, z: JUMELLES.z });
    for (const dx of [-0.09, 0.09]) a.cylindre(0.08, 0.095, 0.44, 10, '#3f5f8a', { x: JUMELLES.x + dx, y: Y + 1.3, z: JUMELLES.z - 0.04, rx: PI / 2 - 0.08 });
    monde.cercle(JUMELLES.x, JUMELLES.z - 0.12, 0.5);
    a.baton([351, Y, 60.4], [351, Y + 2.3, 60.4], 0.04, ACIER_F, 6).baton([353.4, Y, 60.4], [353.4, Y + 2.3, 60.4], 0.04, ACIER_F, 6).boite(2.9, 0.62, 0.06, '#2a4a6a', { x: 352.2, y: Y + 2.0, z: 60.4 });
    ecrire({ x: 352.2, y: Y, z: 60.36, ry: PI }, { texte: '砂丘テラス', sous: 'Sakyu Terrace', x: 0, y: 2.0, z: 0, l: 2.5, h: 0.54, fond: null, encre: '#f4f2ea' });
    monde.cercle(351, 60.4, 0.3); monde.cercle(353.4, 60.4, 0.3);
    // deux bancs, leurs vues : la mer, les dunes
    const banc = (x0, z0, x1, z1, cap) => {
      const xm = (x0 + x1) / 2, zm = (z0 + z1) / 2, le = Math.abs(x1 - x0) > 0.1;
      a.boite(le ? x1 - x0 + 0.3 : 0.44, 0.08, le ? 0.44 : z1 - z0 + 0.3, '#9a7a54', { x: xm, y: Y + 0.46, z: zm, nuance: 0.03 });
      for (const f of [-0.42, 0.42]) a.boite(le ? 0.1 : 0.34, 0.44, le ? 0.34 : 0.1, ACIER_F, { x: xm + (le ? f * (x1 - x0) : 0), y: Y + 0.22, z: zm + (le ? 0 : f * (z1 - z0)) });
      bancs.push({ de: [x0, z0], a: [x1, z1], y: Y + 0.5, cap });
      murRect(xm, zm, le ? (x1 - x0) / 2 + 0.1 : 0.22, le ? 0.22 : (z1 - z0) / 2 + 0.1);
    };
    banc(344, 37.5, 347.4, 37.5, PI);
    banc(337.5, 45, 337.5, 48.4, -PI / 2);
    // des bacs de pins, deux lampadaires, un distributeur contre le mur
    for (const [x, z] of [[353.4, 39.4], [349.6, 39.4], [340.8, 60.4]]) {
      a.boite(1.3, 0.56, 1.3, '#8a8880', { x, y: Y + 0.28, z, nuance: 0.03 }).fut([x, Y + 0.5, z], [x + 0.14, Y + 2.0, z], 0.08, 0.04, '#5a4636', 6);
      for (const [dx, dz, yy, r] of [[0.1, 0, 2.0, 0.72], [-0.34, 0.2, 1.54, 0.5], [0.46, -0.16, 1.4, 0.46]]) a.houppe(r, PIN, { x: x + dx, y: Y + yy, z: z + dz, sy: 0.5, bosses: 0.24, sorte: 'conifere' }, 1);
      murRect(x, z, 0.65, 0.65);
    }
    for (const [x, z] of [[350, 47], [340, 52]]) {
      a.baton([x, Y, z], [x, Y + 3.2, z], 0.05, ACIER_F, 6).ovale(0.16, '#fff4d0', { x, y: Y + 3.34, z, sorte: 'lumiere', trait: false }, 8);
      lumieres.push({ x, y: Y + 3.34, z, halo: 0.5, sol: Y, r: 6 });
      monde.cercle(x, z, 0.27);
    }
    const xd = 355.1, zd = 41;
    a.boite(0.74, 1.82, 1.05, '#d8402c', { x: xd + 0.37, y: Y + 0.91, z: zd, nuance: 0.03 }).boite(0.02, 0.86, 0.8, '#dfe9f0', { x: xd - 0.012, y: Y + 1.28, z: zd, sorte: 'lumiere', trait: false }).boite(0.015, 0.16, 0.62, '#2a2a30', { x: xd - 0.012, y: Y + 0.36, z: zd, trait: false });
    for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) a.boite(0.015, 0.17, 0.08, ['#d8402c', '#2f6ab0', '#f2c443', '#3a8a5a', '#f4efe2', '#e88a3a'][(k + r * 2) % 6], { x: xd - 0.024, y: Y + 1.0 + r * 0.26, z: zd - 0.32 + k * 0.128, trait: false });
    murRect(xd + 0.37, zd, 0.37, 0.53);
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---- la ligne : les pylônes en T (une traverse, deux balanciers à quatre galets, un petit palier, leur numéro), les deux câbles
  const PYLONES = LIFT.appuis.slice(2, 6).map((q) => q[0]);
  PYLONES.forEach((x, k) => {
    const a = morceau(x, ZL), y0 = terrain(x, ZL), yt = yCable(x);
    a.boite(1.5, 0.7, 1.5, BETON, { x, y: y0 + 0.05, z: ZL, nuance: 0.03 });
    a.fut([x, y0 + 0.3, ZL], [x, yt - 0.42, ZL], 0.24, 0.17, ACIER, 8);
    a.boite(0.24, 0.26, 2 * E + 0.46, ACIER, { x, y: yt - 0.46, z: ZL });
    a.boite(0.9, 0.05, 1.5, '#6f7478', { x: x - 0.1, y: yt - 0.82, z: ZL, trait: false });
    for (const sg of [-1, 1]) {
      a.baton([x - 0.55, yt - 0.82, ZL + sg * 0.75], [x - 0.55, yt - 0.3, ZL + sg * 0.75], 0.016, ACIER_F, 4, { trait: false }).baton([x + 0.35, yt - 0.82, ZL + sg * 0.75], [x + 0.35, yt - 0.3, ZL + sg * 0.75], 0.016, ACIER_F, 4, { trait: false });
      a.boite(1.76, 0.08, 0.1, ACIER_F, { x, y: yt - 0.25, z: ZL + sg * E });
      for (let g = 0; g < 4; g++) a.cylindre(0.09, 0.09, 0.07, 9, '#3a3f44', { x: x + (g - 1.5) * 0.48, y: yt - 0.125, z: ZL + sg * E, rx: PI / 2, trait: false });
    }
    for (let h = y0 + 1.6; h < yt - 1; h += 0.42) a.baton([x + 0.24, h, ZL - 0.14], [x + 0.24, h, ZL + 0.14], 0.012, ACIER_F, 4, { trait: false });
    a.boite(0.03, 0.34, 0.3, '#f4f2ea', { x: x - 0.25, y: y0 + 2.5, z: ZL, trait: false });
    ecrire({ x: x - 0.268, y: y0, z: ZL, ry: -PI / 2 }, { texte: String(k + 1), x: 0, y: 2.5, z: 0, l: 0.24, h: 0.28, fond: null, encre: '#2a2420' });
  });
  {
    const c = atelier(), A = LIFT.appuis;
    for (const sg of [-1, 1]) {
      for (let i = 0; i + 1 < A.length; i++) {
        const x0 = A[i][0], x1 = A[i + 1][0], n = A[i + 1][2] > 0 ? 8 : 1;
        for (let k = 0; k < n; k++) { const xa = melange(x0, x1, k / n), xb = melange(x0, x1, (k + 1) / n); c.baton([xa, yCable(xa), ZL + sg * E], [xb, yCable(xb), ZL + sg * E], 0.034, CABLE, 5, { trait: false }); }
      }
    }
    poser(c.fin(), 0, 0, { y: 0, trait: false });
  }

  // ---- le filet de protection (au-dessus de la route et, comme sur la photo, en sortant de la gare du haut) : son grillage, ses deux passerelles de bois, ses poteaux, ses fils
  const uFilet = { nuit: { value: 0 } };
  const matFilet = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: uFilet,
    vertexShader: 'varying vec2 vP; void main() { vP = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform float nuit; varying vec2 vP;
      void main() {
        vec2 p = vP / 0.26;
        float u = p.x + p.y, v = p.x - p.y, w = fwidth(u);
        float d = min(abs(fract(u) - 0.5), abs(fract(v) - 0.5));
        float fil = 1.0 - smoothstep(0.05, 0.05 + max(w, 0.04), d);
        // (de loin, plus de mailles : un voile à peine visible, sans moiré)
        float a = mix(fil * 0.85, 0.16, smoothstep(0.3, 0.9, w));
        if (a < 0.01) discard;
        vec3 c = mix(vec3(0.33, 0.56, 0.48), vec3(0.02, 0.035, 0.08), nuit);
        gl_FragColor = vec4(c, a);
        #include <colorspace_fragment>
      }`,
  });
  const groupeFilets = new THREE.Group();
  const filet = (x0, x1, y0, y1, fleche, W, deux) => {
    const yf = (x) => { const f = (x - x0) / (x1 - x0); return melange(y0, y1, f) - 4 * fleche * f * (1 - f); };
    const a = atelier();
    for (const sg of [-1, 1]) {
      const zb = ZL + sg * W;
      for (let x = x0 + 0.2; x < x1; x += 0.55) a.boite(0.1, 0.03, 0.62, '#8a7a5e', { x, y: yf(x) + 0.05, z: zb + sg * 0.28, nuance: 0.05, trait: false });
      const n = Math.ceil((x1 - x0) / 3.6);
      for (let k = 0; k < n; k++) {
        const xa = melange(x0, x1, k / n), xc = melange(x0, x1, (k + 1) / n);
        a.baton([xa, yf(xa), zb], [xc, yf(xc), zb], 0.042, CABLE, 5, { trait: false }).baton([xa, yf(xa), zb + sg * 0.58], [xc, yf(xc), zb + sg * 0.58], 0.03, CABLE, 4, { trait: false });
        for (const h of [0.62, 1.12]) a.baton([xa, yf(xa) + h, zb + sg * 0.58], [xc, yf(xc) + h, zb + sg * 0.58], 0.01, ACIER_F, 3, { trait: false });
        a.baton([xa, yf(xa) - 0.05, zb + sg * 0.58], [xa, yf(xa) + 1.18, zb + sg * 0.58], 0.026, ACIER, 5);
      }
      a.baton([x1, yf(x1) - 0.05, zb + sg * 0.58], [x1, yf(x1) + 1.18, zb + sg * 0.58], 0.026, ACIER, 5);
    }
    // les portiques, à chaque bout (au-dessus de la route : le filet tient par ses câbles, d'un portique à l'autre)
    for (const x of deux ? [x0, x1] : [x0]) {
      const y = yf(x);
      for (const sg of [-1, 1]) a.fut([x, terrain(x, ZL + sg * (W + 0.3)) - 0.2, ZL + sg * (W + 0.3)], [x, y, ZL + sg * (W + 0.3)], 0.13, 0.1, ACIER, 7);
      a.boite(0.18, 0.2, 2 * W + 1.2, ACIER, { x, y: y - 0.02, z: ZL });
    }
    poser(a.fin(), 0, 0, { y: 0 });
    const nx = Math.ceil((x1 - x0) / 2), pos = [], uv = [], idx = [];
    for (let i = 0; i <= nx; i++) {
      const x = melange(x0, x1, i / nx), y = yf(x);
      for (const sg of [-1, 1]) { pos.push(x, y, ZL + sg * W); uv.push(x, sg * W); }
      if (i) { const b = i * 2; idx.push(b - 2, b - 1, b, b, b - 1, b + 1); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    const m = new THREE.Mesh(g, matFilet);
    m.renderOrder = 1;
    groupeFilets.add(m);
  };
  filet(206.8, 253.2, 48.9, 48.9, 0.4, 2.6, true);
  filet(320, 335.9, yCable(320) - 3.5, yCable(335.9) - 3.5, 0, 2.6, false);
  animes.push({ objet: groupeFilets, maj(dt, temps, c) { uFilet.nuit.value = c.nuit; return []; } });

  // ---------------------------------------------------------------- Les sièges : un seul objet pour tous ; quelques voyageurs dessus
  /** Le siège, dans le repère du câble : la pince en 0, 0, 0 ; il regarde vers +z ; +x : l'extérieur ; le dessus de l'assise 2,3 m plus bas (Y_SIEGE). */
  const siegeLift = (() => {
    const a = atelier(), C = [[0, 0.03, -0.1], [0.16, -0.1, -0.1], [0.42, -0.32, -0.1], [0.5, -0.6, -0.1], [0.36, -0.84, -0.1], [0, -0.97, -0.1]];
    for (let i = 0; i + 1 < C.length; i++) a.baton(C[i], C[i + 1], 0.03, ACIER, 5, { trait: false });
    a.boite(0.09, 0.1, 0.3, '#5a5f63', { y: 0.06, z: -0.1, trait: false });
    // le toit, son tube ; les deux montants ; l'accoudoir ; le dessous de l'assise
    a.boite(1.72, 0.03, 0.92, CORAIL, { y: -1.0, z: 0.03, nuance: 0.02 });
    for (const sg of [-1, 1]) {
      a.baton([sg * 0.8, -1.02, -0.4], [sg * 0.8, -1.02, 0.46], 0.022, ACIER, 5, { trait: false });
      a.baton([sg * 0.8, -1.02, -0.3], [sg * 0.8, -2.36, -0.3], 0.024, ACIER, 5, { trait: false });
      a.baton([sg * 0.8, -2.36, -0.3], [sg * 0.8, -2.36, 0.34], 0.024, ACIER, 5, { trait: false });
      a.baton([sg * 0.8, -1.98, -0.3], [sg * 0.8, -1.96, 0.24], 0.022, ACIER, 5, { trait: false }).baton([sg * 0.8, -1.96, 0.24], [sg * 0.8, -2.36, 0.34], 0.022, ACIER, 5, { trait: false });
    }
    a.baton([-0.8, -1.02, 0.46], [0.8, -1.02, 0.46], 0.022, ACIER, 5, { trait: false }).baton([-0.8, -1.02, -0.4], [0.8, -1.02, -0.4], 0.022, ACIER, 5, { trait: false });
    // les lattes : l'assise, le dossier ; le numéro, dans le dos
    for (let k = 0; k < 5; k++) a.boite(1.56, 0.03, 0.1, k % 2 ? CORAIL : CORAIL_F, { y: -2.315, z: -0.2 + k * 0.115, trait: false });
    for (let k = 0; k < 5; k++) a.boite(1.56, 0.1, 0.03, k % 2 ? CORAIL : CORAIL_F, { y: -2.24 + k * 0.115, z: -0.28, rx: -0.1, trait: false });
    a.boite(0.24, 0.2, 0.012, '#f4f2ea', { y: -2.0, z: -0.3, trait: false }).boite(0.05, 0.13, 0.014, '#2a2420', { x: -0.045, y: -2.0, z: -0.3, trait: false }).boite(0.05, 0.13, 0.014, '#2a2420', { x: 0.045, y: -2.0, z: -0.3, trait: false });
    return a.fin(0, false);
  })();
  const Y_SIEGE = -2.3;
  /** Un voyageur assis, à la place x du siège (petit : un enfant). */
  const passager = (a, x, { peau, haut, bas, cheveux, chapeau, k = 1 }) => {
    const y0 = Y_SIEGE;
    a.boite(0.28 * k, 0.32 * k, 0.2 * k, haut, { x, y: y0 + 0.17 * k, z: 0.02, nuance: 0.02 });
    a.ovale(0.18 * k, peau, { x, y: y0 + 0.49 * k, z: 0.04, nuance: 0.01 }, 8);
    a.ovale(0.19 * k, cheveux, { x, y: y0 + 0.53 * k, z: 0.0, sy: 0.84, nuance: 0.02 }, 8);
    for (const u of [-1, 1]) {
      a.ovale(0.024 * k, '#2a2420', { x: x + u * 0.07 * k, y: y0 + 0.47 * k, z: 0.04 + 0.165 * k, trait: false }, 5);
      a.baton([x + u * 0.15 * k, y0 + 0.3 * k, 0.02], [x + u * 0.17 * k, y0 + 0.07 * k, 0.17 * k], 0.04 * k, haut, 5, { trait: false });
      a.baton([x + u * 0.08 * k, y0 + 0.03, 0.08], [x + u * 0.08 * k, y0 + 0.02, 0.3 * k], 0.055 * k, bas, 5, { trait: false }).baton([x + u * 0.08 * k, y0 + 0.02, 0.3 * k], [x + u * 0.08 * k, y0 - 0.26 * k, 0.33 * k], 0.05 * k, bas, 5, { trait: false });
      a.ovale(0.06 * k, '#3a3a40', { x: x + u * 0.08 * k, y: y0 - 0.29 * k, z: 0.37 * k, sz: 1.5, trait: false }, 6);
    }
    if (chapeau) a.cylindre(0.26 * k, 0.26 * k, 0.025, 12, chapeau, { x, y: y0 + 0.66 * k, z: 0.0 }).cylindre(0.13 * k, 0.16 * k, 0.1, 10, chapeau, { x, y: y0 + 0.72 * k, z: 0.0 });
  };
  const VOYAGEURS = [
    (a) => { passager(a, -0.3, { peau: '#f2c9a8', haut: '#e88aa0', bas: '#f4efe2', cheveux: '#3a2a22', chapeau: '#f4efe2' }); passager(a, 0.34, { peau: '#e8bf98', haut: '#3a6aa8', bas: '#3a3a44', cheveux: '#2a2420' }); },
    (a) => { passager(a, 0.1, { peau: '#e0b48c', haut: '#5a8a4a', bas: '#4a4a56', cheveux: '#d8d4cc', chapeau: '#c8b48a' }); },
    (a) => { passager(a, -0.34, { peau: '#f2c9a8', haut: '#8ac4e8', bas: '#3a3a44', cheveux: '#5a3a28', chapeau: '#e8d8b8' }); passager(a, 0.32, { peau: '#f2c9a8', haut: '#f2c443', bas: '#3a4a6a', cheveux: '#2a2420', k: 0.72 }); },
  ].map((f) => { const a = atelier(); f(a); return a.fin(0, false); });
  const groupeLift = new THREE.Group();
  const SPHERE = new THREE.Sphere(new THREE.Vector3((XB + XH) / 2, 58, ZL), (XH - XB) / 2 + 14);
  // (des matières à eux : quand une même matière passe d'un objet répété à un objet simple, three.js refait le calcul de tout son programme, à chaque passage, plusieurs
  // fois par image : avec celles des personnages, 3 à 5 ms par image sur un téléphone, dès que les sièges étaient à l'écran)
  const matieres = new Map(), OMBRE = new THREE.MeshDepthMaterial();
  const aPart = (m) => {
    if (!matieres.has(m)) {
      const c = m.clone();
      c.onBeforeCompile = m.onBeforeCompile;
      c.customProgramCacheKey = m.customProgramCacheKey;
      if (m.uniforms) c.uniforms = m.uniforms;
      matieres.set(m, c);
    }
    return matieres.get(m);
  };
  /** Plusieurs fois le même objet : son corps et son trait, dessinés d'un coup. */
  const enInstances = (fin, n) => {
    const L = ctx.perso.maillage(fin, true, true).children.map((m) => {
      const im = new THREE.InstancedMesh(m.geometry, aPart(m.material), n);
      im.castShadow = m.castShadow;
      im.receiveShadow = m.receiveShadow;
      im.customDepthMaterial = OMBRE;
      im.boundingSphere = SPHERE;
      groupeLift.add(im);
      return im;
    });
    // (le corps et le trait lisent les mêmes matrices : envoyées une seule fois à la carte graphique)
    L[0]?.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (const im of L.slice(1)) im.instanceMatrix = L[0].instanceMatrix;
    return L;
  };
  // (un siège sur cinq emporte quelqu'un ; le voyageur prend un siège vide, et vide devant lui)
  const occupant = (k) => (k % 5 === 2 ? Math.floor(k / 5) % VOYAGEURS.length : -1);
  const imSieges = enInstances(siegeLift, N);
  const imVoyageurs = VOYAGEURS.map((fin, v) => {
    let n = 0;
    for (let k = 0; k < N; k++) if (occupant(k) === v) n++;
    return enInstances(fin, n);
  });
  const rangVoyageur = [];
  { const c = VOYAGEURS.map(() => 0); for (let k = 0; k < N; k++) rangVoyageur.push(occupant(k) >= 0 ? c[occupant(k)]++ : -1); }

  // ---- ce qui tourne ou s'ouvre : les deux grandes roues, les quatre portillons
  const roues = [[XB, GARE_B.F], [XH, GARE_H.F]].map(([x, F]) => {
    const a = atelier();
    a.anneau(E, 0.055, '#6a6e72', { rx: PI / 2 });
    for (let k = 0; k < 6; k++) { const t = (k / 6) * 2 * PI; a.baton([0, 0, 0], [Math.cos(t) * (E - 0.04), 0, Math.sin(t) * (E - 0.04)], 0.035, ACIER_F, 5, { trait: false }); }
    a.cylindre(0.26, 0.26, 0.26, 12, '#5a5f63', {});
    const o = ctx.perso.maillage(a.fin(0, false), true, false);
    o.position.set(x, F + 2.8, ZL);
    groupeLift.add(o);
    return o;
  });
  const portes = [[191, ZL - 3.1, GARE_B.F, 1], [191, ZL + 3.1, GARE_B.F, -1], [342, ZL - 3.1, GARE_H.F, 1], [342, ZL + 3.1, GARE_H.F, -1]].map(([x, z, F, sg]) => {
    const a = atelier();
    a.baton([0.03, 1.0, 0], [1.34, 1.0, 0], 0.024, '#d8402c', 5, { trait: false }).baton([0.03, 0.55, 0], [1.34, 0.55, 0], 0.016, ACIER, 4, { trait: false }).baton([1.34, 0.05, 0], [1.34, 1.03, 0], 0.03, ACIER, 5, { trait: false });
    const o = ctx.perso.maillage(a.fin(0, false), true, false);
    o.position.set(x - 0.7, F, z);
    groupeLift.add(o);
    return { o, sg, ouvert: 0, veut: 0 };
  });

  // ---- le câble : où est un siège
  const pose = { x: 0, y: 0, z: 0, cap: 0, roue: 0 };
  const surCable = (s) => {
    if (s < L1) { pose.x = XB + s; pose.z = ZL - E; pose.cap = PI / 2; pose.roue = 0; } else if (s < L1 + PI * E) {
      const t = (s - L1) / E;
      pose.x = XH + E * Math.sin(t); pose.z = ZL - E * Math.cos(t); pose.cap = PI / 2 - t; pose.roue = Math.sin(t);
    } else if (s < 2 * L1 + PI * E) { pose.x = XH - (s - L1 - PI * E); pose.z = ZL + E; pose.cap = -PI / 2; pose.roue = 0; } else {
      const t = (s - 2 * L1 - PI * E) / E;
      pose.x = XB - E * Math.sin(t); pose.z = ZL + E * Math.cos(t); pose.cap = -PI / 2 - t; pose.roue = Math.sin(t);
    }
    pose.y = yCable(pose.x);
    return pose;
  };
  const sSud = (x) => L1 + PI * E + (XH - x);
  // monter : le quai (x, z : la marque ; F : le sol) et où le siège arrive (s) ; descendre, de même
  const QUAIS = {
    bas: { x: 191, z: ZL - 3.45, F: GARE_B.F + 0.035, cap: PI / 2, s: 191 - XB, porte: 0, vers: 'haut' },
    haut: { x: 342, z: ZL + 3.45, F: GARE_H.F + 0.035, cap: -PI / 2, s: sSud(342), porte: 3, vers: 'bas' },
  };
  const ARRIVEES = {
    haut: { x: 342, z: ZL - 3.45, F: GARE_H.F + 0.035, cap: PI, s: 342 - XB, porte: 2, vu: false, cle: 'liftHautCompagnon', pas: [342, 65] },
    bas: { x: 191, z: ZL + 3.45, F: GARE_B.F + 0.035, cap: -PI / 2, s: sSud(191), porte: 1, vu: false, cle: 'liftBasCompagnon', pas: [189.4, 74.6] },
  };
  const SAUT = 0.36; // (le temps de s'asseoir, en s)
  const obj = new THREE.Object3D(), v3 = new THREE.Vector3(), HORS = new THREE.Matrix4().makeTranslation(0, -1000, 0);
  const siege = { x: 0, z: 0, y: 0, cap: 0, libre: false, cote: { x: 0, z: 0, y: 0, cap: 0, aussitot: true, dossier: -1 } };
  let s0 = 0, monte = -1, arrivee = null, descend = null, attente = null, deQuai = null, tSaut = 0, cris = [];
  /** La pose d'un siège (s : où il en est sur le câble ; k : son numéro) ; force : son balancement. */
  const poser1 = (s, k, temps, force = 1) => {
    const q = surCable(s);
    let bosse = 0;
    if (s < L1 || (s > L1 + PI * E && s < 2 * L1 + PI * E)) for (const xp of PYLONES) { const d = q.x - xp; if (d > -9 && d < 9) bosse += 0.05 * Math.exp(-Math.abs(d) * 0.34) * Math.sin(d * 1.3); }
    obj.position.set(q.x, q.y, q.z);
    obj.rotation.set(force * (0.014 * Math.sin(temps * 1.25 + k * 2.1) + bosse), q.cap, force * (0.012 * Math.sin(temps * 0.85 + k * 1.3)) + 0.14 * q.roue, 'YXZ');
    obj.updateMatrix();
    return q;
  };
  const scene = async (jeu) => {
    const A = descend, p = { x: siege.x, y: siege.y, z: siege.z };
    monte = -1; descend = null;
    jeu.aide(null);
    jeu.rangerOmbrelle(false);
    // (le compagnon saute sur le quai, à côté : lieu du saut, balade.js, ses 75 cm devant le siège)
    Object.assign(siege.cote, { x: A.x - 2.0, z: A.z - (A.z < ZL ? 0.3 : -0.3), y: A.F + 0.5, cap: PI / 2 });
    jeu.asseoir(null);
    const saut = jeu.grimper([[p.x, p.y - ASSIS, p.z], [A.x, A.F, A.z]], 0.34, A.cap);
    jeu.cameraDerriere(0);
    await saut;
    // (quelques pas sur le quai : collé à la rampe, le compagnon n'avait plus de place à côté de lui)
    await jeu.marcher([[A.x, A.z], A.pas], 1.5);
    portes[A.porte].veut = 0;
    if (!A.vu) { A.vu = true; await comp(jeu, A.cle); }
  };

  animes.push({
    objet: groupeLift,
    maj(dt, temps, c) {
      s0 = mod(s0 + VITESSE * dt);
      const j = c.joueur, o = c.oeil, dLigne = Math.hypot(Math.max(XB - o.x, 0, o.x - XH), o.z - ZL);
      cris = [];
      // (les portillons)
      for (const q of portes) { q.ouvert += (q.veut - q.ouvert) * Math.min(1, dt * 5); q.o.rotation.y = q.sg * q.ouvert * 1.45; }
      // le voyageur attend sur la marque : le prochain siège libre, un peu avant la marque
      if (attente) {
        for (let k = 0; k < N; k++) {
          if (occupant(k) >= 0 || occupant((k + 1) % N) >= 0) continue;
          if (mod(attente.s - (s0 + k * ECART)) < VITESSE * SAUT) { const f = attente.fin; attente = null; f(k); break; }
        }
      }
      // sur le siège : il suit le câble ; la marque, le saut
      if (monte >= 0) {
        const sk = mod(s0 + monte * ECART);
        poser1(sk, monte, temps, 0.45);
        const cap = pose.cap;
        // (assis vers l'avant de l'assise : plus en arrière, le sac et la queue du compagnon sortaient par le dossier : 2026-11-03)
        v3.set(0.36, Y_SIEGE, 0.17).applyMatrix4(obj.matrix);
        let sx = v3.x, sy = v3.y, sz = v3.z;
        v3.set(-0.36, Y_SIEGE, 0.2).applyMatrix4(obj.matrix);
        let cx = v3.x, cy = v3.y, cz = v3.z;
        if (tSaut < 1 && deQuai) {
          // (il saute sur l'assise : de la marque au siège qui arrive, un petit arc)
          tSaut = Math.min(1, tSaut + dt / SAUT);
          const f = tSaut * tSaut * (3 - 2 * tSaut), h = Math.sin(tSaut * PI) * 0.34;
          sx = melange(deQuai.x, sx, f); sz = melange(deQuai.z, sz, f); sy = melange(deQuai.F + ASSIS, sy, f) + h;
          cx = melange(deQuai.x - Math.sin(deQuai.cap) * 0.5, cx, f); cz = melange(deQuai.z - Math.cos(deQuai.cap) * 0.5, cz, f); cy = melange(deQuai.F, cy, f) + h;
        }
        Object.assign(siege, { x: sx, y: sy, z: sz, cap });
        Object.assign(siege.cote, { x: cx, y: cy, z: cz, cap });
        if (arrivee) {
          const d = mod(arrivee.s - sk);
          if (d < 12) portes[arrivee.porte].veut = 1;
          // (la marque : il descend ; occupé ailleurs, un menu, une photo, des feux d'artifice : il reste assis jusqu'à l'autre bout)
          if (d < VITESSE * dt * 1.5 || d > LT - 6) {
            if (j.mode === 'jeu') { descend = arrivee; arrivee = null; c.scene(scene); } else { portes[arrivee.porte].veut = 0; arrivee = arrivee === ARRIVEES.haut ? ARRIVEES.bas : ARRIVEES.haut; }
          }
        }
      }
      // tout le reste, seulement si l'on peut le voir
      groupeLift.visible = dLigne < 560 || monte >= 0;
      groupeFilets.visible = dLigne < 420 || monte >= 0;
      if (!groupeLift.visible) return cris;
      const dr = VITESSE * dt / E;
      for (const r of roues) r.rotation.y -= dr;
      const auBas = j.x > 178 && j.x < 200 && j.z > 56 && j.z < 84, enHaut = j.x > 332 && j.z > 56 && j.z < 82;
      const limB = GARE_B.x1 + (auBas ? 34 : -2), limH = GARE_H.x0 + (enHaut ? -34 : 2);
      for (let k = 0; k < N; k++) {
        const sk = mod(s0 + k * ECART), q = poser1(sk, k, temps, k === monte ? 0.45 : 1);
        imSieges[0]?.setMatrixAt(k, obj.matrix);
        const v = occupant(k);
        if (v >= 0) {
          // (ils descendent en gare, sans qu'on les voie ; la nuit, il n'y a plus que les sièges : le vrai ferme à 16 h)
          const m = q.x < limB || q.x > limH || c.nuit > 0.5 ? HORS : obj.matrix;
          imVoyageurs[v][0]?.setMatrixAt(rangVoyageur[k], m);
        }
        // (le roulement sur les galets, à chaque pylône : le siège du voyageur, et ceux qui passent tout près)
        if (dLigne < 30 || k === monte) {
          const x1 = q.x, y1 = q.y, sur = sk < L1 ? 1 : sk > L1 + PI * E && sk < 2 * L1 + PI * E ? -1 : 0;
          if (sur) for (const xp of PYLONES) { const xa = x1 - sur * VITESSE * dt; if ((xa - xp) * (x1 - xp) <= 0) { const dp = Math.hypot(xp - o.x, y1 - o.y, q.z - o.z); if (k === monte || dp < 26) cris.push({ x: xp, y: y1, z: q.z, nom: 'poulies', fort: k === monte ? 0.9 : 0.55 }); } }
        }
      }
      if (imSieges[0]) imSieges[0].instanceMatrix.needsUpdate = true;
      for (const L of imVoyageurs) if (L[0]) L[0].instanceMatrix.needsUpdate = true;
      return cris;
    },
  });

  return {
    JUMELLES, PANNEAU, JUMELLES_TOIT, TABLE_TOIT,
    /** Monter sur un siège : le voyageur se met sur la marque, le portillon s'ouvre, un siège libre arrive ; on repart libre de regarder autour de soi. */
    async embarquer(jeu, ou) {
      const Q = QUAIS[ou];
      jeu.placer(Q.x, Q.z, Q.cap, Q.F);
      jeu.cameraDerriere(ou === 'bas' ? 0.9 : -0.9);
      portes[Q.porte].veut = 1;
      const k = await new Promise((fin) => { attente = { s: Q.s, fin }; });
      deQuai = Q; tSaut = 0; monte = k; arrivee = ARRIVEES[Q.vers];
      jeu.rangerOmbrelle(true);
      Object.assign(siege, { x: Q.x, y: Q.F + ASSIS, z: Q.z, cap: Q.cap });
      Object.assign(siege.cote, { x: Q.x, y: Q.F, z: Q.z, cap: Q.cap });
      jeu.son('oiseau/poulies');
      // (la caméra au sud-est du siège, tournée vers le nord-ouest : en montant, le voyageur de face, le sable et la mer derrière lui ; en descendant, de dos, tout devant lui)
      jeu.asseoir(siege, { lacet: PI / 2 - 0.5, tangage: 0.24, distance: 6.4 });
      setTimeout(() => { portes[Q.porte].veut = 0; }, 900);
      jeu.aide(jeu.tx('liftAide'));
    },
  };
}

// ---------------------------------------------------------------- 海士島, l'îlot de la baleine
/**
 * 海士島, « くじら島 » : l'îlot de lave au large du sable, « comme une baleine qui nage » (le département de Tottori, pref.tottori.lg.jp/153179.htm et /327989.htm : du basalte en colonnes, surtout à l'est et au nord ;
 * à l'est, une grotte de mer et, à côté, un grand pilier de lave). Refait le 2026-11-03 (le propriétaire : « si tu peux le refaire un peu mieux que ça ») : une boule à moitié dans l'eau, vue par transparence,
 * et une queue en bâton. Maintenant : un dos long et bas, de vraies falaises en colonnes (une bande par colonne, un peu rentrée ou sortie), de la verdure seulement sur le dessus, la tête ronde à l'est avec sa
 * grotte et son pilier, à l'ouest le dos qui s'amincit vers deux gros rochers en V (la queue), et l'écume tout autour. Rien sous l'eau : la mer est transparente. L'avant de la baleine vers +x.
 */
function ilotBaleine(THREE, a, X0, Z0) {
  const L = 176, n = 56, m = 14, hp = (u, v = 0) => { const s = Math.sin(u * 127.1 + v * 311.7) * 43758.5453; return s - Math.floor(s); };
  const table = (T, u) => { let i = 0; while (i < T.length - 2 && u > T[i + 1][0]) i++; const f = Math.max(0, Math.min(1, (u - T[i][0]) / (T[i + 1][0] - T[i][0]))), s = f * f * (3 - 2 * f); return T[i][1] + (T[i + 1][1] - T[i][1]) * s; };
  // (u : de la queue, 0, à la tête, 1)
  const HAUT = [[0, 1.4], [0.08, 3.2], [0.2, 10], [0.34, 22], [0.5, 31], [0.63, 35], [0.76, 32], [0.88, 26], [0.95, 18], [1, 6]];
  const LARGE = [[0, 3.5], [0.1, 7], [0.25, 15], [0.42, 24], [0.6, 28], [0.8, 26], [0.93, 19], [1, 10]];
  /** Le point de la surface : u le long, v en travers, de −1 à 1 ; h(0) au bord : sa falaise tombe jusqu'à l'eau. */
  const point = (i, j) => {
    const u = i / n, v = -1 + (2 * j) / m, W = table(LARGE, u), H = table(HAUT, u), s = Math.abs(v);
    // (la falaise : le bord tombe d'un coup ; le dessus, bombé ; la tête s'arrondit)
    const prof = (1 - s ** 4.2) ** 0.55, col = i % 2 ? 0.55 : -0.55;
    const x = X0 - L / 2 + u * L + (i === n ? 0 : (hp(i, j) - 0.5) * 0.9), z = Z0 + v * (W + (s > 0.8 ? col : 0)) * (1 + 0.05 * Math.sin(u * 19 + j));
    return [x, Math.max(-0.4, H * prof * (1 + 0.05 * (hp(j, i) - 0.5)) + (s < 0.8 ? 1.4 * (hp(i * 2, j * 3) - 0.5) : 0)), z];
  };
  const pos = [], cols = [];
  const ROC = ['#4a4942', '#55534a', '#3f403b'], VERT = ['#4c6a48', '#3f5f3f', '#577a4e', '#46653f'];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      const A = point(i, j), B = point(i + 1, j), C = point(i + 1, j + 1), D = point(i, j + 1);
      for (const [p, q, r] of [[A, D, B], [B, D, C]]) {
        pos.push(...p, ...q, ...r);
        const y = (p[1] + q[1] + r[1]) / 3, s = Math.abs(-1 + (2 * (j + 0.5)) / m);
        // (une colonne : sa teinte ; le bas mouillé, plus sombre ; le dessus, là où la pente est douce : la verdure)
        cols.push(y < 1.6 ? '#2d3331' : s < 0.72 && y > 7 ? VERT[Math.floor(hp(i, j) * 4)] : ROC[(i + (j > m / 2 ? 1 : 0)) % 3]);
      }
    }
  }
  // la ceinture : du bord de l'îlot, sous l'eau, tout autour (la tête et la queue fermées)
  const contour = [];
  for (let i = 0; i <= n; i++) contour.push(point(i, 0));
  for (let j = 1; j <= m; j++) contour.push(point(n, j));
  for (let i = n - 1; i >= 0; i--) contour.push(point(i, m));
  for (let j = m - 1; j >= 1; j--) contour.push(point(0, j));
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  a.piece(g, ROC[0], { couleurs: cols, nuance: 0.035, trait: false, sorte: 'roche' });
  // l'écume : une frange blanche, du pied de la falaise à quelques mètres au large ; un peu irrégulière, plus large à la tête
  {
    const P = [], cx = X0, cz = Z0, k = contour.length;
    for (let i = 0; i < k; i++) {
      const p = contour[i], q = contour[(i + 1) % k], lp = Math.hypot(p[0] - cx, (p[2] - cz) * 2.4), lq = Math.hypot(q[0] - cx, (q[2] - cz) * 2.4), d0 = 2.2 + 3.2 * hp(i, 5), d1 = 2.2 + 3.2 * hp((i + 1) % k, 5);
      const o = [p[0] + ((p[0] - cx) / lp) * d0, 0.1, p[2] + ((p[2] - cz) * 2.4 / lp) * d0], r = [q[0] + ((q[0] - cx) / lq) * d1, 0.1, q[2] + ((q[2] - cz) * 2.4 / lq) * d1];
      const i0 = [p[0], 0.75, p[2]], i1 = [q[0], 0.75, q[2]];
      P.push(...i0, ...o, ...i1, ...i1, ...o, ...r);
    }
    const ge = new THREE.BufferGeometry();
    ge.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    // (les deux faces : on la voit de partout)
    a.piece(ge, '#eef6f4', { nuance: 0.02, trait: false });
  }
  // des touffes de pins, sur le dessus : le dos n'est pas lisse
  for (let k = 0; k < 26; k++) {
    const u = 0.26 + 0.66 * hp(k, 1), v = (hp(k, 2) - 0.5) * 0.9, W = table(LARGE, u), H = table(HAUT, u), s = Math.abs(v), r = 2.4 + 2.4 * hp(k, 3);
    a.ovale(r, VERT[k % 2], { x: X0 - L / 2 + u * L, y: H * (1 - s ** 4.2) ** 0.55 + r * 0.35, z: Z0 + v * W, sy: 0.7, nuance: 0.05, trait: false, sorte: 'conifere' }, 6);
  }
  // à l'est, la tête : la grotte (un trou sombre au pied de la falaise) ; à côté, le grand pilier de lave et deux plus petits
  const roc = (x, y, z, sx, sy, sz, ry = 0, c = '#4a4942', graine = 1) => a.piece(new THREE.IcosahedronGeometry(1, 1), c, { x, y, z, sx, sy, sz, ry, nuance: 0.05, trait: false, sorte: 'roche', deformer: (px, py, pz) => { const k = 1 + 0.16 * Math.sin(px * 5 + graine) * Math.sin(py * 4 + pz * 3 + graine); return [px * k, py, pz * k]; } });
  a.ovale(1, '#14181a', { x: X0 + L / 2 + 1.6, y: 4.2, z: Z0 + 3, sx: 0.8, sy: 5.2, sz: 6.4, trait: false, nuance: 0 }, 8);
  a.piece(new THREE.CylinderGeometry(3.1, 4.6, 22, 7, 2), '#4f4e46', { x: X0 + L / 2 + 8, y: 10.4, z: Z0 - 8, nuance: 0.05, trait: false, sorte: 'roche', teinte: (x, y) => (y < 1.6 ? '#2d3331' : y > 19 ? '#5c5a50' : '#4f4e46') });
  roc(X0 + L / 2 + 15, 2.6, Z0 - 13, 4.2, 4.4, 3.6, 0.4, '#3f403b', 2);
  roc(X0 + L / 2 + 6, 1.6, Z0 + 16, 4.6, 3.2, 3.8, 1.1, '#3f403b', 3);
  // à l'ouest, la queue : le dos s'enfonce, puis deux gros rochers plats, en V, qui sortent de l'eau ; quelques cailloux entre eux et l'îlot
  const xq = X0 - L / 2 - 15;
  {
    const s = new THREE.Shape();
    s.moveTo(-4.5, -1); s.lineTo(-6.5, 3); s.lineTo(-13, 6.4); s.lineTo(-19, 12.6); s.lineTo(-10.5, 11.6); s.lineTo(-4.2, 9); s.lineTo(0, 6.4); s.lineTo(4.2, 9); s.lineTo(10.5, 11.6); s.lineTo(19, 12.6); s.lineTo(13, 6.4); s.lineTo(6.5, 3); s.lineTo(4.5, -1); s.lineTo(-4.5, -1);
    const geo = new THREE.ExtrudeGeometry(s, { depth: 5.5, bevelEnabled: true, bevelThickness: 1.6, bevelSize: 1.2, bevelSegments: 1, curveSegments: 1 }).translate(0, 0, -2.75);
    a.piece(geo, '#45453e', { x: xq - 2, z: Z0, ry: PI / 2 + 0.22, nuance: 0.05, trait: false, sorte: 'roche', teinte: (x, y) => (y < 1.5 ? '#2d3331' : hp(Math.round(x), Math.round(y / 2)) > 0.5 ? '#45453e' : '#4f4e46') });
  }
  for (const [dx, dz, s] of [[10, 2, 2.6], [15, -3, 3.4], [6, -6, 2.2], [3, 7, 2.4]]) roc(xq + dx, 0.6, Z0 + dz, s * 1.4, s, s, dx, '#3f403b', dz);
  // (l'écume autour de la queue)
  const P = [];
  for (let k = 0; k < 16; k++) {
    const t0 = (k / 16) * 2 * PI, t1 = ((k + 1) / 16) * 2 * PI, r0 = 25 + 3 * hp(k, 8), r1 = 25 + 3 * hp((k + 1) % 16, 8), r2 = 18;
    const A = [xq + Math.cos(t0) * r0 * 0.6, 0.08, Z0 + Math.sin(t0) * r0], B = [xq + Math.cos(t1) * r1 * 0.6, 0.08, Z0 + Math.sin(t1) * r1], C = [xq + Math.cos(t0) * r2 * 0.6, 0.4, Z0 + Math.sin(t0) * r2], D = [xq + Math.cos(t1) * r2 * 0.6, 0.4, Z0 + Math.sin(t1) * r2];
    P.push(...C, ...A, ...D, ...D, ...A, ...B);
  }
  const gq = new THREE.BufferGeometry();
  gq.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  a.piece(gq, '#dfeeee', { nuance: 0.02, trait: false });
}

// ---------------------------------------------------------------- La caravane de la lune
/** Le sol tel qu'il est dessiné en x, z : les deux triangles de sa case (de 2 m, ou de 50 cm là où le sol plie). */
function yDessine(x, z) {
  const F = ETENDUE.fin;
  let p = F.pas, x0 = F.x0 + Math.floor((x - F.x0) / p) * p, z0 = F.z0 + Math.floor((z - F.z0) / p) * p;
  if (solDetaille(x0, z0, x0 + p, z0 + p)) { p /= 4; x0 += Math.floor((x - x0) / p) * p; z0 += Math.floor((z - z0) / p) * p; }
  const u = (x - x0) / p, v = (z - z0) / p, a = terrain(x0, z0), b = terrain(x0 + p, z0), d = terrain(x0, z0 + p), f = terrain(x0 + p, z0 + p);
  return (u + v <= 1 ? a + (b - a) * u + (d - a) * v : f + (d - f) * (1 - u) + (b - f) * (1 - v)) + 0.03;
}
/**
 * La caravane de la lune : cinq chameaux faits de sable, en file, sur le Dos de cheval, la nuit. Elle attend à l'est du sommet ; quand on approche,
 * elle part le long de la crête, attend qu'on suive, descend au fond de la grande cuvette, s'y arrête ; quand on y arrive, elle s'effrite dans le
 * vent, chameau après chameau, de la tête à la queue. Le jour, il n'en reste que les grandes traces (tout le long de sa route) et un grelot, au fond
 * de la cuvette. Une fois le secret trouvé, on la revoit de loin, certaines nuits, sur la crête : elle s'efface avant qu'on l'approche.
 */
function creerCaravane(ctx, { zCrete, grains, DIR_LUNE, comp, monde, poser, atelier, secretTrouve }) {
  const { THREE } = ctx;
  // la route
  const R = [];
  for (let x = 92; x >= -92; x -= 8) R.push([x, zCrete(x)]);
  R.push([-99, zCrete(-99) + 8], [-106, 18], [-113, 32], [-118, 46], [-121, 57], [-122, 61]);
  const cum = [0];
  for (let k = 1; k < R.length; k++) cum.push(cum[k - 1] + Math.hypot(R[k][0] - R[k - 1][0], R[k][1] - R[k - 1][1]));
  const L = cum[cum.length - 1], ECART = 3.7, N = 5, S0 = ECART * (N - 1) + 4;
  const sur = (s) => {
    s = Math.max(0, Math.min(L, s));
    let i = 0;
    while (i < R.length - 2 && s > cum[i + 1]) i++;
    const f = (s - cum[i]) / (cum[i + 1] - cum[i]);
    return [R[i][0] + (R[i + 1][0] - R[i][0]) * f, R[i][1] + (R[i + 1][1] - R[i][1]) * f];
  };
  // les traces : deux lobes, tout le long, en quinconce
  {
    const a = atelier(), COUL = '#ab8b5a', pos = [];
    const lobe = (x, z, cap, rx, rz) => {
      const c = Math.cos(cap), s = Math.sin(cap), pts = [];
      for (let k = 0; k < 7; k++) { const t = (k / 7) * 2 * PI, u = Math.cos(t) * rx, v = Math.sin(t) * rz; pts.push([x + u * c + v * s, z - u * s + v * c]); }
      const yc = yDessine(x, z) + 0.006;
      for (let k = 0; k < 7; k++) { const p = pts[k], q = pts[(k + 1) % 7]; pos.push(x, yc, z, q[0], yDessine(q[0], q[1]) + 0.006, q[1], p[0], yDessine(p[0], p[1]) + 0.006, p[1]); }
    };
    for (let s = 2, k = 0; s < L - 1; s += 0.62, k++) {
      const [x, z] = sur(s), [xa, za] = sur(s + 0.5), cap = Math.atan2(xa - x, za - z), sg = k % 2 ? 1 : -1, ox = Math.cos(cap) * sg * 0.3, oz = -Math.sin(cap) * sg * 0.3;
      if (k % 4 > 1) continue;
      const px = x + ox, pz = z + oz, fx = Math.sin(cap), fz = Math.cos(cap);
      lobe(px + Math.cos(cap) * 0.075 + fx * 0.04, pz - Math.sin(cap) * 0.075 + fz * 0.04, cap, 0.062, 0.135);
      lobe(px - Math.cos(cap) * 0.075 + fx * 0.04, pz + Math.sin(cap) * 0.075 + fz * 0.04, cap, 0.062, 0.135);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    a.piece(g, COUL, { trait: false, nuance: 0.0 });
    poser(a.fin(), 0, 0, { y: 0, ombre: false });
  }
  // le grelot, à moitié enterré, au fond de la cuvette
  const GRELOT = { x: -120.2, z: 62.2 };
  {
    const a = atelier(), y = terrain(GRELOT.x, GRELOT.z);
    a.ovale(0.17, '#b08a3a', { x: GRELOT.x, y: y + 0.08, z: GRELOT.z, rz: 0.5 }, 9).boite(0.2, 0.025, 0.04, '#6a4f22', { x: GRELOT.x, y: y + 0.09, z: GRELOT.z + 0.16, ry: 0.4, trait: false });
    a.ovale(0.3, '#caa96e', { x: GRELOT.x + 0.1, y: y + 0.0, z: GRELOT.z + 0.08, sy: 0.25 }, 7);
    poser(a.fin(), 0, 0, { y: 0, ombre: false });
  }
  // ---- la matière : du sable qui s'effrite (un bruit à trois dimensions, seuil qui monte de la tête à la queue), éclairé par la lune, un liseré clair
  const matiere = () => new THREE.ShaderMaterial({
    vertexColors: true,
    uniforms: { dissout: { value: 0 }, lune: { value: new THREE.Vector3(...DIR_LUNE) }, avant: { value: new THREE.Vector3(0, 0, 1) }, centre: { value: new THREE.Vector3() }, temps: { value: 0 } },
    vertexShader: `
      attribute vec3 contour; varying vec3 vN, vM, vC;
      void main() { vC = color; vec4 m = modelMatrix * vec4(position, 1.0); vM = m.xyz; vN = normalize(mat3(modelMatrix) * (dot(contour, contour) > 0.01 ? contour : normal)); gl_Position = projectionMatrix * viewMatrix * m; }`,
    fragmentShader: `
      uniform float dissout, temps; uniform vec3 lune, avant, centre; varying vec3 vN, vM, vC;
      float h3(vec3 p) { p = fract(p * 0.3183 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      float b3(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(mix(mix(h3(i), h3(i + vec3(1, 0, 0)), f.x), mix(h3(i + vec3(0, 1, 0)), h3(i + vec3(1, 1, 0)), f.x), f.y), mix(mix(h3(i + vec3(0, 0, 1)), h3(i + vec3(1, 0, 1)), f.x), mix(h3(i + vec3(0, 1, 1)), h3(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
      void main() {
        vec3 p = vM - centre;
        float le = dot(p, avant) * 0.28 + 0.5;
        float n = b3(vM * 9.0) * 0.6 + b3(vM * 3.1) * 0.4;
        float s = dissout * 1.7 - 0.45 + le * 0.5 * smoothstep(0.0, 0.1, dissout);
        // (au repos, quelques grains manquent déjà, tout au bord : la bête tient à peine)
        if (n < s) discard;
        float bord = 1.0 - smoothstep(0.0, 0.09, n - s);
        vec3 N = normalize(vN), V = normalize(cameraPosition - vM);
        float d = 0.3 + 0.75 * max(0.0, dot(N, lune) * 0.5 + 0.5);
        float rim = pow(1.0 - max(0.0, dot(N, V)), 2.6);
        vec3 c = vC * vec3(0.46, 0.53, 0.86) * d + vec3(0.95, 0.9, 0.72) * rim * 0.62 + vec3(1.0, 0.92, 0.7) * bord * step(0.001, dissout);
        // de minuscules scintillements
        c += vec3(0.5, 0.5, 0.4) * smoothstep(0.86, 0.9, b3(vM * 40.0 + temps * 0.1));
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const groupe = new THREE.Group(), bete = [];
  for (let k = 0; k < N; k++) {
    const m = matiere();
    const o = creerChameau(ctx.perso, { sable: true, grelot: k === 0, monte: (f) => { const q = new THREE.Mesh(f.geometrie, m); q.frustumCulled = false; return q; } });
    o.objet.scale.setScalar(k === 0 ? 1.06 : 0.97 - 0.03 * k);
    groupe.add(o.objet);
    bete.push({ o, m, d: 0, cap: 0, sableV: 0 });
  }
  groupe.visible = false;
  // ---- ce qui se passe
  let s = S0, etat = 'attend', nuitVue = false, vue = false, sonner = 0, scene = null, fonte = false, enFuite = 0;
  const poser1 = (b, sb, dt, temps, v) => {
    const [x, z] = sur(sb), [xa, za] = sur(sb + 0.7), y = terrain(x, z), ya = terrain(xa, za);
    const cible = Math.atan2(xa - x, za - z);
    b.cap = b.posee ? tournerVers(b.cap, cible, dt * 3) : cible;
    b.posee = true;
    b.o.objet.position.set(x, y, z);
    b.o.objet.rotation.set(0, b.cap, 0);
    b.o.corps.rotation.x = Math.atan2(y - ya, 0.7) * 0.5;
    b.o.animer(dt, v, temps);
    b.m.uniforms.dissout.value = b.d;
    b.m.uniforms.temps.value = temps;
    b.m.uniforms.centre.value.set(x, y + 1.2, z);
    b.m.uniforms.avant.value.set(Math.sin(b.cap), 0, Math.cos(b.cap));
    return [x, y, z];
  };
  const objet = {
    objet: groupe,
    premiereTrace: (() => { const x = 58; return { x, z: zCrete(x) }; })(),
    grelot: GRELOT,
    /** (pour les essais) où en est la tête de la file ; sa longueur */
    get s() { return s; }, set s(v) { s = v; }, longueur: L, get etat() { return etat; },
    /** Une scène à jouer dès que le joueur est libre (la descente en planche, finie). */
    scene: (fn) => scene?.(fn),
    maj(dt, temps, c) {
      scene = c.scene;
      const j = c.joueur, nuit = c.nuit > 0.72;
      if (!nuit) {
        // le jour : rien. (On peut revenir la nuit suivante : elle repart de la crête)
        if (groupe.visible) { groupe.visible = false; s = S0; etat = 'attend'; fonte = false; for (const b of bete) { b.d = 0; b.posee = false; } }
        return [];
      }
      if (!nuitVue && c.nuit > 0.9) { nuitVue = true; if (!secretTrouve('caravane')) c.scene((jeu) => comp(jeu, 'nuitCompagnon')); }
      const trouve = secretTrouve('caravane');
      groupe.visible = true;
      const cris = [];
      const queue = sur(s - ECART * (N - 1)), dq = Math.hypot(j.x - queue[0], j.z - queue[1]), tete = sur(s), dt0 = Math.hypot(j.x - tete[0], j.z - tete[1]);
      let v = 0;
      if (trouve && etat !== 'fin' && etat !== 'finie') {
        // (après le secret : elle marche sur la crête, et s'efface avant qu'on l'approche ; elle revient quand on s'éloigne)
        const pres = Math.min(dq, dt0) < 26;
        enFuite += ((pres ? 1 : 0) - enFuite) * Math.min(1, dt * 0.8);
        v = 0.9;
        s += v * dt;
        if (s > L * 0.62) { s = S0; for (const b of bete) b.posee = false; }
        for (const b of bete) b.d = enFuite * 0.98;
      } else if (etat === 'attend') {
        if (Math.min(dq, dt0) < 30 && !vue) {
          vue = true;
          etat = 'scene';
          const [cx, cz] = sur(s - ECART * 2), cy = terrain(cx, cz);
          c.scene(async (jeu) => {
            // la caméra sur la pente, sous la crête, tournée vers la lune : les bêtes passent devant
            const h = Math.hypot(DIR_LUNE[0], DIR_LUNE[2]), ux = DIR_LUNE[0] / h, uz = DIR_LUNE[2] / h, de = [cx - ux * 44, 0, cz - uz * 44];
            de[1] = Math.max(terrain(de[0], de[2]) + 1.8, cy - 10.5);
            jeu.cadrer({ de, vers: [cx, cy + 1.6, cz], champ: 42 });
            jeu.cacherVoyageur(true);
            await jeu.attendre(1500);
            await jeu.dire(jeu.tx('caravaneVue'));
            jeu.cadrer(null);
            jeu.cacherVoyageur(false);
            await comp(jeu, 'caravaneCompagnon');
            jeu.voirIndice('caravane-vue');
            etat = 'marche';
          });
        }
      } else if (etat === 'marche') {
        if (s < L - 0.1) {
          // elle marche quand on la suit ; trop loin derrière, elle attend ; ses grelots l'appellent
          const fin = sur(L), enAvance = Math.hypot(j.x - fin[0], j.z - fin[1]) < L - s;
          if (dq < 42 || enAvance) { v = dq < 14 ? 2.9 : 2.3; s = Math.min(L, s + v * dt); }
        } else if (Math.min(dq, dt0) < 24) {
          etat = 'fin';
          c.scene(async (jeu) => {
            // (la caméra sur le flanc sud-est de la cuvette, au-dessus du sable ; le vent emporte le sable vers elle)
            const [tx, tz] = sur(L - ECART * 2), ty = terrain(tx, tz), cx = tx + 11, cz = tz + 17;
            jeu.cadrer({ de: [cx, terrain(cx, cz) + 2.4, cz], vers: [tx, ty + 1.2, tz], champ: 50 });
            jeu.cacherVoyageur(true);
            await jeu.attendre(1400);
            await jeu.dire(jeu.tx('caravaneFin1'));
            fonte = true;
            jeu.son('poudre');
            await jeu.attendre(9500);
            await jeu.dire(jeu.tx('caravaneFin2'));
            jeu.cadrer(null);
            jeu.cacherVoyageur(false);
            await comp(jeu, 'caravaneFinCompagnon');
            await jeu.trouverSecret('caravane');
            etat = 'finie';
          });
        }
      }
      // l'effritement, de la bête de tête à la dernière ; des grains qui s'envolent
      if (fonte) {
        bete.forEach((b, k) => {
          const f = (temps * 0 + b.d);
          if (k === 0 || bete[k - 1].d > 0.4) b.d = Math.min(1.05, f + dt * 0.34);
        });
      }
      bete.forEach((b, k) => {
        const [x, y, z] = poser1(b, s - k * ECART, dt, temps, v);
        // (le sable file un peu de la bête qui marche ; beaucoup de celle qui s'effrite)
        b.sableV += dt * (b.d > 0.02 && b.d < 1 ? 120 : v > 0 ? 3 : 1);
        while (b.sableV > 1) {
          b.sableV -= 1;
          grains.emettre(x + (Math.random() - 0.5) * 0.7, y + 0.5 + Math.random() * 1.7, z + (Math.random() - 0.5) * 1.5, 1, { large: 0.15, haut: 0.25, vx: VENT[0] * 2.6, vz: VENT[1] * 2.6, vie: 2.2, alpha: 0.85 });
        }
      });
      // ses grelots
      if ((sonner -= dt) <= 0 && etat !== 'finie') { sonner = v > 0 ? 1.5 : 3.4; const t = bete[0].o.objet.position; if (!fonte) cris.push({ x: t.x, y: t.y + 1.4, z: t.z, nom: 'grelots', fort: 1.4 }); }
      return cris;
    },
  };
  return objet;
}

// ---------------------------------------------------------------- Les chameaux
const PELAGE_CHAMEAU = { base: '#b98a55', fonce: '#8f6538', clair: '#d3aa74', laine: '#7d5630', nez: '#5a3f2a' };
const SABLE_CHAMEAU = { base: '#d8bd8c', fonce: '#c2a678', clair: '#e6cfa2', laine: '#ceb182', nez: '#b89c70' };
/**
 * Un chameau de Bactriane (les deux bosses, comme ceux de la らくだや), environ 2,2 m au sommet des bosses, l'avant vers +z. Refait le 2026-11-03 (le propriétaire : « un peu mal fait, ses jambes elles
 * sont décollées de son corps ») : le corps est une seule coque, de la croupe au poitrail (coupes en travers) ; la cuisse et l'épaule y sont soudées, de grosses masses qui ne bougent pas, et la patte
 * sort de cette masse : son pivot est dedans, haut dans le corps, et elle y reste quand elle balance. (L'ancienne patte partait du bas du ventre, en sept pans : plus de 42° d'un pan à l'autre, donc sept
 * planches à plat ; à douze pans, elle est ronde.) Deux pattes en deux morceaux par côté (on marche l'amble, les deux d'un côté ensemble), l'arrière au jarret en arrière ; un long cou en S (le pivot à
 * sa base, la tête à son bout, la mâchoire qui rumine), de la laine sur les bosses, sous le cou et en haut des pattes de devant.
 * sable : la caravane, tout en sable, sans harnais (la matière vient du lieu : monte(mesh) reçoit chaque pièce) ; harnais : le tapis rayé de la らくだや, le siège entre les bosses, sa poignée, la bride ;
 * grelot : un grelot au cou. Renvoie { objet, corps (il roule : l'assise le suit), siege (la hauteur de l'assise), animer(dt, vitesse, temps, regard) }.
 */
function creerChameau(ctx, { sable = false, harnais = false, grelot = true, monte = null, pelage = null } = {}) {
  const { THREE, atelier, maillage } = ctx, T = sable ? SABLE_CHAMEAU : pelage || PELAGE_CHAMEAU;
  const mailler = (a) => { const f = a.fin(0, false); return monte ? monte(f) : maillage(f); };
  const pivot = (x, y, z, ...m) => { const g = new THREE.Group(); g.position.set(x, y, z); if (m.length) g.add(...m); return g; };
  const hp = (a, b = 0) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  const racine = new THREE.Group(), corps = new THREE.Group();
  racine.add(corps);
  const YC = 1.32, BOSSE1 = 0.42, BOSSE2 = -0.46, ZH = -0.62, ZE = 0.62, XP = 0.27;
  // ---- le corps : [z, demi-largeur, au-dessus du milieu, au-dessous, le milieu], de la croupe au poitrail
  const COUPES = [
    [-1.05, 0.03, 0.03, 0.03, YC + 0.08], [-1.01, 0.15, 0.16, 0.18, YC + 0.07], [-0.92, 0.28, 0.29, 0.33, YC + 0.05], [-0.76, 0.38, 0.38, 0.4, YC + 0.03], [-0.52, 0.42, 0.42, 0.42, YC + 0.01], [-0.2, 0.43, 0.44, 0.43, YC],
    [0.16, 0.44, 0.45, 0.44, YC], [0.46, 0.43, 0.46, 0.45, YC], [0.7, 0.38, 0.45, 0.46, YC + 0.01], [0.87, 0.31, 0.39, 0.43, YC + 0.02], [0.99, 0.2, 0.28, 0.31, YC + 0.04], [1.05, 0.09, 0.14, 0.15, YC + 0.05], [1.08, 0.02, 0.03, 0.03, YC + 0.06],
  ];
  /** Le point de la surface du corps à la coupe z, à l'angle t depuis le dos (t > 0 : vers +x), e mètres au-dehors. */
  const surCorps = (z, t, e = 0) => {
    let i = 0;
    while (i < COUPES.length - 2 && z > COUPES[i + 1][0]) i++;
    const A = COUPES[i], B = COUPES[i + 1], f = Math.max(0, Math.min(1, (z - A[0]) / (B[0] - A[0]))), m = (k) => A[k] + (B[k] - A[k]) * f, c = Math.cos(t), s = Math.sin(t);
    return [(m(1) + e) * s, m(4) + ((c > 0 ? m(2) : m(3)) + e) * c, z];
  };
  const c = atelier();
  {
    const zs = [];
    for (let i = 0; i + 1 < COUPES.length; i++) { zs.push(COUPES[i][0]); if (COUPES[i + 1][0] - COUPES[i][0] > 0.2) zs.push((COUPES[i][0] + COUPES[i + 1][0]) / 2); }
    zs.push(COUPES[COUPES.length - 1][0]);
    const m = 18, pos = [], cols = [];
    const ton = (t) => { const a = Math.abs(((t + PI) % (2 * PI) + 2 * PI) % (2 * PI) - PI); return a < 0.5 ? T.fonce : a > 2.25 ? T.clair : T.base; };
    for (let i = 0; i + 1 < zs.length; i++) {
      for (let j = 0; j < m; j++) {
        const t0 = (j / m) * 2 * PI, t1 = ((j + 1) / m) * 2 * PI, A = surCorps(zs[i], t0), B = surCorps(zs[i], t1), C = surCorps(zs[i + 1], t1), D = surCorps(zs[i + 1], t0), col = ton((t0 + t1) / 2);
        pos.push(...A, ...D, ...B, ...B, ...D, ...C);
        cols.push(col, col);
      }
    }
    // (les deux bouts : une toute petite coupe, fermée)
    for (const [z, sens] of [[zs[0], -1], [zs[zs.length - 1], 1]]) {
      const o = surCorps(z, 0); o[1] = surCorps(z, PI / 2)[1];
      for (let j = 0; j < m; j++) {
        const A = surCorps(z, (j / m) * 2 * PI), B = surCorps(z, ((j + 1) / m) * 2 * PI);
        if (sens > 0) pos.push(...o, ...B, ...A); else pos.push(...o, ...A, ...B);
        cols.push(T.base);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    c.piece(g, T.base, { couleurs: cols, nuance: 0.022 });
  }
  // la cuisse et l'épaule, soudées au corps : la patte sort de là
  for (const u of [-1, 1]) {
    c.ovale(1, T.base, { x: u * (XP - 0.005), y: YC - 0.16, z: ZH, sx: 0.175, sy: 0.46, sz: 0.34, nuance: 0.02 }, 14);
    c.ovale(1, T.base, { x: u * (XP - 0.005), y: YC - 0.14, z: ZE, sx: 0.165, sy: 0.46, sz: 0.3, nuance: 0.02 }, 14);
  }
  for (const [zb, h] of [[BOSSE1, 0.5], [BOSSE2, 0.46]]) {
    const y0 = YC + 0.34;
    c.piece(new THREE.SphereGeometry(1, 14, 10), T.base, {
      y: y0, z: zb, sx: 0.27, sy: h, sz: 0.3, nuance: 0.022,
      deformer: (x, y, z) => { const p = y > 0 ? 1 - 0.3 * y : 1; return [x * p + 0.05 * Math.sin(y * 2.2 + zb * 3) * Math.max(0, y), y, z * p]; },
      teinte: (x, y) => (y > y0 + h * 0.42 ? T.laine : y > y0 + h * 0.2 ? T.fonce : T.base),
    });
    // (la laine du sommet : des mèches sans trait qui dépassent de la silhouette)
    for (let k = 0; k < 7; k++) {
      const t = (k / 7) * 2 * PI, r = 0.05 + 0.05 * hp(k, zb), l = 0.07 + 0.05 * hp(zb, k);
      c.ovale(0.078 + 0.03 * hp(k, 2), T.laine, { x: Math.cos(t) * r, y: y0 + h * 0.9 + l * hp(k, 3) * 0.4, z: zb + Math.sin(t) * r, sy: 0.72, nuance: 0.04 }, 7);
    }
  }
  // la queue, sa touffe
  c.tronc([[0, YC + 0.28, -0.97], [0, YC + 0.06, -1.1], [0.02, YC - 0.36, -1.15]], [0.05, 0.034, 0.022], T.fonce, 8);
  c.ovale(0.05, T.laine, { x: 0.02, y: YC - 0.44, z: -1.15, sy: 2.0 }, 7);
  if (harnais && !sable) {
    // le siège, entre les bosses (rembourré, rouge, sa poignée devant lui) ; le tapis rayé noir et blanc, posé sur le corps (ses points sur la coque, 2 cm au-dehors) ; la sangle rouge et ses pompons jaunes
    const yd = YC + 0.46;
    c.ovale(1, '#c8402c', { y: yd + 0.04, z: -0.02, sx: 0.25, sy: 0.075, sz: 0.2, nuance: 0.015 }, 12).boite(0.34, 0.03, 0.05, '#e8b42a', { y: yd + 0.1, z: 0.13, trait: false });
    for (const u of [-1, 1]) c.baton([u * 0.2, yd + 0.02, 0.17], [u * 0.2, yd + 0.33, 0.2], 0.018, '#7a6a52', 6);
    c.baton([-0.2, yd + 0.33, 0.2], [0.2, yd + 0.33, 0.2], 0.018, '#7a6a52', 6);
    const n = 13, nt = 7, tm = 1.5, pos = [], cols = [], Z0 = -0.27, Z1 = 0.25;
    for (let k = 0; k < n; k++) {
      const z0 = Z0 + (k / n) * (Z1 - Z0), z1 = Z0 + ((k + 1) / n) * (Z1 - Z0), col = k % 2 ? '#2a2a2e' : '#f4efe2';
      for (let j = 0; j < 2 * nt; j++) {
        const t0 = -tm + (j / (2 * nt)) * 2 * tm, t1 = -tm + ((j + 1) / (2 * nt)) * 2 * tm, A = surCorps(z0, t0, 0.02), B = surCorps(z0, t1, 0.02), C = surCorps(z1, t1, 0.02), D = surCorps(z1, t0, 0.02);
        pos.push(...A, ...D, ...B, ...B, ...D, ...C);
        const bord = j === 0 || j === 2 * nt - 1;
        cols.push(bord ? '#c8402c' : col, bord ? '#c8402c' : col);
      }
    }
    const tapis = new THREE.BufferGeometry();
    tapis.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    c.piece(tapis, '#f4efe2', { couleurs: cols, trait: false, nuance: 0.01 });
    // (la sangle : tout le tour, sous le ventre)
    const sangle = [];
    for (let j = 0; j <= 14; j++) sangle.push(surCorps(-0.3, tm + 0.02 + (j / 14) * (2 * PI - 2 * tm - 0.04), 0.012));
    c.tronc(sangle, sangle.map(() => 0.02), '#c8402c', 5, { trait: false });
    for (const u of [-1, 1]) { const q = surCorps(-0.3, u * tm, 0.04); c.ovale(0.05, '#e8b42a', { x: q[0], y: q[1], z: q[2], trait: false }, 7); }
  }
  corps.add(mailler(c));
  // ---- les pattes : la partie haute sort de la masse soudée au corps, le genou et son cal, le canon, le large pied à deux doigts ; à l'arrière, cuisse en avant, jarret en arrière
  const pattes = [], yh = YC - 0.2, L2 = 0.56;
  const creerPatte = (x, z, avant) => {
    const a1 = avant ? 0 : -0.16, a2 = avant ? 0 : 0.32, L1 = yh / Math.cos(a1) - L2, u = x > 0 ? 1 : -1;
    const haut = atelier();
    haut.tronc([[0, 0.04, 0], [0, -L1 * 0.42, avant ? 0.015 : 0.03], [0, -L1 * 0.8, 0.005], [0, -L1, 0]], [0.13, 0.112, 0.074, 0.066], T.base, 12, { nuance: 0.02 });
    if (avant) for (let k = 0; k < 4; k++) haut.ovale(0.075, T.laine, { x: u * 0.055, y: -0.16 - k * 0.09, z: 0.05 - 0.012 * k, sy: 1.25, nuance: 0.04 }, 7);
    const bas = atelier(), bout = avant ? 0 : -(a1 + a2);
    bas.ovale(0.078, T.fonce, { y: 0, z: avant ? 0.02 : -0.012, sy: 0.92 }, 10)
      .tronc([[0, 0, 0], [0, -L2 * 0.55, 0], [0, -L2 + 0.11, 0], [0, -L2 + 0.05, 0.008]], [0.06, 0.05, 0.046, 0.058], T.base, 12, { nuance: 0.02 })
      .ovale(0.118, T.fonce, { y: -L2 + 0.04, z: 0.035, rx: bout, sx: 1.08, sy: 0.42, sz: 1.42 }, 12)
      .boite(0.012, 0.05, 0.1, T.nez, { y: -L2 + 0.032, z: 0.155, rx: bout, trait: false });
    const g = pivot(0, -L1, 0, mailler(bas)), h = pivot(x, yh, z, mailler(haut), g);
    corps.add(h);
    pattes.push({ h, g, sg: x > 0 ? 0 : PI, a1, a2 });
  };
  creerPatte(XP, ZE, true); creerPatte(-XP, ZE, true); creerPatte(XP, ZH, false); creerPatte(-XP, ZH, false);
  // ---- le cou : il descend d'abord, puis remonte en S ; sa barbe de laine ; la tête, petite et plate, aux grosses lèvres, aux longs cils
  const cou = atelier(), PC = [[0, 0.02, -0.04], [0, -0.1, 0.26], [0, 0.0, 0.56], [0, 0.34, 0.74], [0, 0.72, 0.8]];
  cou.tronc(PC, [0.21, 0.165, 0.12, 0.098, 0.088], T.base, 12, { nuance: 0.022 });
  for (let k = 0; k < 16; k++) {
    const t = k / 15, i = Math.min(PC.length - 2, Math.floor(t * (PC.length - 1))), f = t * (PC.length - 1) - i, y = melange(PC[i][1], PC[i + 1][1], f), z = melange(PC[i][2], PC[i + 1][2], f), sg = k % 2 ? 1 : -1;
    cou.ovale(0.066 + 0.02 * hp(k), T.laine, { x: sg * 0.022, y: y - 0.1 - 0.03 * hp(k), z: z + 0.035, sy: 1.3, sz: 0.85, nuance: 0.04 }, 7);
    if (k % 3 === 1) cou.ovale(0.052, T.laine, { y: y + 0.07, z: z - 0.085, sy: 0.8, sz: 1.1, nuance: 0.04 }, 6);
  }
  if (harnais && !sable) cou.piece(new THREE.TorusGeometry(0.1, 0.018, 5, 14), '#c8402c', { y: 0.5, z: 0.77, rx: PI / 2 + 0.2, trait: false });
  if (grelot) cou.ovale(0.048, '#d8a83a', { y: 0.22, z: 0.75, trait: !sable }, 7);
  const tete = atelier(), tetePlie = (x, y, z) => [x * (1 - 0.3 * Math.max(0, z) / 0.3), y, z];
  tete.ovale(1, T.base, { z: 0.1, sx: 0.085, sy: 0.095, sz: 0.2, deformer: tetePlie, nuance: 0.03 }, 12)
    .ovale(0.075, T.clair, { y: -0.018, z: 0.28, sx: 0.8, sy: 0.72, sz: 1.2 }, 9)
    .ovale(0.03, T.nez, { y: 0.008, z: 0.36, sx: 1.6, sy: 0.42, sz: 0.6, trait: false }, 7);
  for (const u of [-1, 1]) {
    tete.ovale(0.021, sable ? T.fonce : '#1e1a18', { x: u * 0.078, y: 0.035, z: 0.1, sz: 1.2, trait: false }, 7)
      .boite(0.012, 0.012, 0.055, T.laine, { x: u * 0.086, y: 0.056, z: 0.112, rx: -0.3, trait: false })
      .ovale(0.038, T.base, { x: u * 0.066, y: 0.105, z: -0.03, sx: 0.7, sy: 1.25, sz: 0.5, rz: -u * 0.5 }, 7)
      .ovale(0.012, T.nez, { x: u * 0.02, y: 0.012, z: 0.385, trait: false }, 5);
  }
  for (let k = 0; k < 4; k++) tete.ovale(0.035, T.laine, { x: (k - 1.5) * 0.03, y: 0.092, z: -0.02 + 0.02 * (k % 2), sy: 0.8, nuance: 0.04 }, 5);
  const levre = atelier();
  levre.ovale(0.062, T.clair, { y: -0.012, z: 0.09, sx: 0.8, sy: 0.42, sz: 1.2 }, 7);
  const machoire = pivot(0, -0.05, 0.16, mailler(levre));
  const pivotTete = pivot(0, 0.76, 0.84, mailler(tete), machoire);
  const pivotCou = pivot(0, YC + 0.08, 0.82, mailler(cou), pivotTete);
  corps.add(pivotCou);
  // l'amble : les deux pattes d'un côté ensemble ; le corps roule d'un côté à l'autre, la tête suit en retard ; à l'arrêt, il rumine
  let phase = hp(racine.id) * 6, ampl = 0, rumine = hp(racine.id, 2) * 6;
  const poser = () => { for (const p of pattes) { p.h.rotation.x = p.a1; p.g.rotation.x = p.a2; } };
  poser();
  return {
    objet: racine, corps, siege: YC + 0.58,
    animer(dt, v, temps, regard = 0) {
      ampl += (Math.min(1, v / 1.1) - ampl) * Math.min(1, dt * 4);
      phase += dt * (1.9 + v * 1.25);
      const s = Math.sin(phase);
      for (const p of pattes) {
        const q = phase + p.sg, ang = Math.sin(q) * 0.36 * ampl, plie = Math.max(0, Math.sin(q + 1.2)) * 0.72 * ampl;
        p.h.rotation.x = p.a1 + ang;
        p.g.rotation.x = p.a2 + plie;
      }
      // (le roulis, doux : le voyageur est assis là-haut, 1,9 m au-dessus du sol ; et les pattes en biais raccourcissent un peu : le corps descend d'autant, les pieds restent au sol)
      corps.rotation.z = s * 0.024 * ampl;
      corps.position.y = Math.abs(Math.cos(phase)) * 0.018 * ampl - 0.04 * ampl;
      corps.rotation.x = Math.sin(phase * 2 + 0.6) * 0.01 * ampl;
      pivotCou.rotation.x = Math.sin(phase * 2 - 0.9) * 0.07 * ampl + Math.sin(temps * 0.7 + phase * 0.1) * 0.02;
      pivotCou.rotation.y = Math.sin(phase - 0.8) * 0.1 * ampl + regard * 0.55;
      pivotTete.rotation.x = -pivotCou.rotation.x * 0.8 + Math.sin(temps * 0.53) * 0.025;
      pivotTete.rotation.y = regard * 0.35;
      rumine += dt * (ampl > 0.3 ? 0 : 5.2);
      machoire.rotation.x = 0.03 + (0.5 + 0.5 * Math.sin(rumine)) * 0.2 * (1 - ampl);
      machoire.position.x = Math.sin(rumine) * 0.012 * (1 - ampl);
    },
  };
}

// ---------------------------------------------------------------- Les sculptures du musée (nos propres dessins, d'après le thème de 2026 : l'Espagne)
/**
 * 砂で世界旅行・スペイン (le 17e thème du musée, 2026-04-24 → 2027-01-03) : Gaudí et sa Sagrada Família, le dragon du parc Güell, l'Alhambra, Don Quichotte. Refaites le 2026-11-03 (le propriétaire : « qu'elles soient un
 * peu mieux réalisées, qu'elles soient plus belles ») : du vrai relief plutôt que des boîtes. Des portails creusés (une forme percée, extrudée : le dedans plus sombre), des colonnes fines, des personnages drapés, des
 * animaux aux vraies pattes ; le sable a son grain (la matière du sable, styles.js) et ses couches, comme les vraies, tassées couche par couche. Tout est dans un seul objet, dessiné seulement la caméra à l'intérieur
 * ou devant la porte (DEDANS) : il ne coûte rien du dehors.
 */
function sculptures(THREE, atelier, { yM, SABLE1, SABLE2, SABLE3, SABLE4, SABLE5, garde, poser, ecrire, Mu, hasard, PI, DEDANS }) {
  // (le sable taillé : la surface tremble un peu, jamais tout à fait droite)
  const taille = (k = 0.03) => (x, y, z) => [x + k * Math.sin(y * 7.1 + z * 5.3), y, z + k * Math.sin(x * 6.7 + y * 4.9)];
  const a = atelier();
  /** Une forme (THREE.Shape) d'après ses points [u, v] ; trous : d'autres listes de points. */
  const forme = (pts, trous = []) => {
    const s = new THREE.Shape();
    pts.forEach(([u, v], i) => (i ? s.lineTo(u, v) : s.moveTo(u, v)));
    s.closePath();
    for (const T of trous) { const h = new THREE.Path(); T.forEach(([u, v], i) => (i ? h.lineTo(u, v) : h.moveTo(u, v))); h.closePath(); s.holes.push(h); }
    return s;
  };
  /** Un grand bloc de sable : ses couches (de fines bandes en retrait, tous les 40 cm), comme les vraies sculptures, tassées couche par couche. */
  const bloc = (l, h, p, c, o, couches = true) => {
    a.piece(new THREE.BoxGeometry(l, h, p, Math.max(2, Math.round(l)), Math.max(1, Math.round(h * 1.5)), Math.max(2, Math.round(p))), c, { nuance: 0.025, deformer: taille(0.035), ...o });
    if (couches) for (let y = 0.3; y < h - 0.12; y += 0.42) a.boite(l + 0.09, 0.022, p + 0.09, SABLE4, { x: o.x, y: o.y - h / 2 + y, z: o.z, ry: o.ry, trait: false, nuance: 0.02 });
  };
  /** Un personnage drapé, debout : sa robe aux plis, ses épaules, sa tête ; h : sa hauteur. */
  const drape = (x, y, z, h, c = SABLE3, o = {}) => {
    const plis = (px, py, pz) => { const t = Math.atan2(pz, px), k = 1 + 0.1 * Math.sin(t * 5) * (0.6 - py / h); return [px * k, py, pz * k]; };
    a.piece(new THREE.CylinderGeometry(h * 0.1, h * 0.19, h * 0.66, 10, 2), c, { x, y: y + h * 0.33, z, deformer: plis, nuance: 0.015, trait: o.trait ?? false });
    a.ovale(h * 0.145, c, { x, y: y + h * 0.63, z, sy: 0.62, nuance: 0.015, trait: o.trait ?? false }, 8);
    a.ovale(h * 0.1, c, { x, y: y + h * 0.82, z, nuance: 0.01, trait: o.trait ?? false }, 8);
    if (o.nimbe) a.anneau(h * 0.14, h * 0.012, c, { x: x + 0.02, y: y + h * 0.84, z, ry: PI / 2, trait: false });
  };
  /** Un arc en parabole (Gaudí), de largeur l, de hauteur h, autour de z = zc, son pied à la hauteur v0 : ses points [u, v] du pied gauche au pied droit. */
  const parabole = (uc, l, h, v0 = 0, n = 14) => { const P = []; for (let k = 0; k <= n; k++) { const t = -1 + (2 * k) / n; P.push([uc + (t * l) / 2, v0 + h * (1 - Math.abs(t) ** 2.4)]); } return P; };

  // ---- La Sagrada Família, au fond (à l'est), sa façade de la Nativité vers l'ouest : trois portails creusés, leurs voussures, la foule des statues, le cyprès de la vie ; quatre clochers devant, quatre derrière, la grande tour de Jésus
  const xS = 263.1, zS = 104, yB = yM + 0.84;
  bloc(8.8, 0.42, 19.4, SABLE2, { x: 265, y: yM + 0.21, z: zS }, false);
  bloc(7.4, 0.42, 17.2, SABLE1, { x: 265.7, y: yM + 0.63, z: zS }, false);
  // (le massif, derrière la façade : ses couches se voient sur les côtés)
  bloc(5.1, 4.1, 14.2, SABLE1, { x: 266.75, y: yB + 2.05, z: zS });
  {
    // la façade : une forme percée de ses trois portails, 1,3 m d'épaisseur ; sa crête monte vers le milieu, en festons
    const W = 14.6, P0 = parabole(0, 3.3, 3.75, 0.06), P1 = parabole(-4.5, 2.4, 2.85, 0.06), P2 = parabole(4.5, 2.4, 2.85, 0.06);
    const crete = [[-W / 2, 0], [W / 2, 0], [W / 2, 3.2], [W / 2 - 0.5, 3.75], [W / 2 - 1, 3.5], [W / 2 - 1.5, 4.0], [W / 2 - 2.1, 3.7], [3.2, 4.3], [2.7, 4.05], [2, 4.9], [1.5, 4.55], [0.8, 5.5], [0, 5.0], [-0.8, 5.5], [-1.5, 4.55], [-2, 4.9], [-2.7, 4.05], [-3.2, 4.3], [-W / 2 + 2.1, 3.7], [-W / 2 + 1.5, 4.0], [-W / 2 + 1, 3.5], [-W / 2 + 0.5, 3.75], [-W / 2, 3.2]];
    a.piece(new THREE.ExtrudeGeometry(forme(crete, [P0, P1, P2]), { depth: 1.3, bevelEnabled: false }), SABLE1, { x: xS, y: yB, z: zS, ry: -PI / 2, nuance: 0.02, teinte: (x) => (x > xS + 0.05 ? SABLE4 : SABLE1) });
    // le fond des portails : sombre ; ce qui s'y tient
    a.boite(0.12, 4.2, 13.2, SABLE5, { x: xS + 1.28, y: yB + 2.1, z: zS, trait: false, nuance: 0.02 });
    // les voussures : trois arcs, de plus en plus larges, et des têtes tout du long
    const arc = (zc, l, h, k, r, c, trait = false) => a.tronc(parabole(0, l * k, h * k, 0, 12).map(([u, v]) => [xS - 0.05 - r * 0.4, yB + 0.06 + v, zc + u]), new Array(13).fill(r), c, 6, { trait, nuance: 0.02 });
    for (const [zc, l, h, gros] of [[zS, 3.3, 3.75, 1], [zS - 4.5, 2.4, 2.85, 0.8], [zS + 4.5, 2.4, 2.85, 0.8]]) {
      arc(zc, l, h, 1.03, 0.1, SABLE3, true); arc(zc, l, h, 1.13, 0.06, SABLE5); arc(zc, l, h, 1.31, 0.12, SABLE3, true);
      // des personnages en rang sur le grand arc, comme les vraies statues de la Nativité
      for (let k = 1; k < 15; k++) { const t = -1 + (2 * k) / 15, u = (t * l * 1.22) / 2, v = h * 1.22 * (1 - Math.abs(t) ** 2.4); a.ovale(0.1 * gros, SABLE3, { x: xS - 0.12, y: yB + 0.06 + v + 0.02, z: zc + u, nuance: 0.01 }, 7); }
      // de part et d'autre, une statue sur sa console
      for (const u of [-1, 1]) { const dz = u * (l * 0.66 + 0.1); a.boite(0.3, 0.12, 0.36, SABLE3, { x: xS - 0.1, y: yB + 0.92, z: zc + dz }); drape(xS - 0.12, yB + 0.98, zc + dz, 1.15 * gros, SABLE3, { trait: true }); }
      // le fond : une statue sur son pilier
      a.cylindre(0.14, 0.2, 0.7 * gros, 8, SABLE3, { x: xS + 1.05, y: yB + 0.35 * gros, z: zc, nuance: 0.02 });
      drape(xS + 1.05, yB + 0.7 * gros, zc, 1.7 * gros, SABLE3, { nimbe: true, trait: true });
    }
    // la Sainte Famille, au milieu : deux silhouettes de plus, de part et d'autre
    drape(xS + 1.0, yB + 0.7, zS - 0.72, 1.35, SABLE3, { trait: true }); drape(xS + 1.0, yB + 0.7, zS + 0.72, 1.45, SABLE3, { trait: true });
    // les deux colonnes entre les portails, leur tortue au pied
    for (const u of [-2.25, 2.25]) {
      a.cylindre(0.17, 0.22, 2.9, 10, SABLE3, { x: xS - 0.3, y: yB + 1.55, z: zS + u, nuance: 0.02 });
      a.ovale(0.42, SABLE2, { x: xS - 0.36, y: yB + 0.18, z: zS + u, sx: 1, sy: 0.46, sz: 1.25, nuance: 0.03 }, 10).ovale(0.12, SABLE3, { x: xS - 0.8, y: yB + 0.14, z: zS + u, trait: false }, 7);
      a.ovale(0.27, SABLE3, { x: xS - 0.3, y: yB + 3.1, z: zS + u, sy: 0.55, nuance: 0.03 }, 9);
    }
    // (une bande en relief, sa gorge sombre, sur les deux ailes ; des touffes de feuillage de sable, le long de la crête)
    for (const u of [-1, 1]) {
      a.boite(0.22, 0.14, 4.1, SABLE3, { x: xS - 0.06, y: yB + 3.0, z: zS + u * 5.05, nuance: 0.02 }).boite(0.12, 0.08, 4.1, SABLE5, { x: xS - 0.015, y: yB + 2.87, z: zS + u * 5.05, trait: false });
      for (let k = 0; k < 9; k++) a.ovale(0.15 + 0.05 * hasard(k, u), SABLE3, { x: xS + 0.03, y: yB + 3.32 + 0.22 * hasard(u, k), z: zS + u * (3.1 + k * 0.48), sy: 0.8, nuance: 0.03 }, 6);
    }
    // au-dessus du grand portail : la foule, deux rangs ; le cyprès de la vie et ses colombes
    for (let r = 0; r < 2; r++) for (let k = -3 + r; k <= 3 - r; k++) drape(xS - 0.12, yB + 3.92 + r * 0.42 - Math.abs(k) * 0.1, zS + k * 0.44, 0.42, SABLE3);
    a.piece(new THREE.ConeGeometry(0.58, 2.1, 10, 5), SABLE3, { x: xS + 0.2, y: yB + 6.05, z: zS, nuance: 0.03, deformer: (x, y, z) => { const k = 1 + 0.2 * Math.sin(y * 7) * Math.cos(Math.atan2(z, x) * 5); return [x * k, y, z * k]; } });
    for (const [dz, dy] of [[-0.52, 0.45], [0.52, 0.45], [-0.36, 1.0], [0.38, 1.0]]) a.ovale(0.075, SABLE3, { x: xS + 0.06, y: yB + 5.9 + dy, z: zS + dz, sz: 1.5, trait: false }, 6);
    a.boite(0.05, 0.4, 0.1, SABLE3, { x: xS + 0.2, y: yB + 7.28, z: zS, trait: false }).boite(0.05, 0.1, 0.3, SABLE3, { x: xS + 0.2, y: yB + 7.32, z: zS, trait: false });
  }
  /** Un clocher : un fuseau en parabole, ses bandes, ses fentes qui montent en spirale, son pinacle (la mitre, sa croix, ses boules). */
  const clocher = (x, z, r, h, y0 = yM + 1.0) => {
    const ouvert = (px, py, pz) => { const t = Math.max(0, (py + h / 2) / h), k = (1 - t ** 2.2 * 0.84) * (1 + 0.03 * Math.sin(t * 34)); return [px * k, py, pz * k]; };
    a.piece(new THREE.CylinderGeometry(r, r, h, 14, 18), SABLE1, { x, y: y0 + h / 2, z, nuance: 0.018, deformer: ouvert });
    const n = Math.floor(h / 0.44);
    for (let k = 7; k < n; k++) {
      const f = k / n, rr = r * (1 - f ** 2.2 * 0.84), y = y0 + f * h, l = Math.min(0.3, 0.14 + 0.2 * rr);
      for (const dec of [0, (2 * PI) / 3, (4 * PI) / 3]) { const t = k * 0.5 + dec; a.boite(0.1, 0.3, l, SABLE5, { x: x + Math.cos(t) * rr * 0.97, y, z: z + Math.sin(t) * rr * 0.97, ry: -t, trait: false, nuance: 0 }); }
    }
    // le pinacle : posé sur le bout du fuseau, sa tige, sa couronne de boules, sa mitre en croix
    const yt = y0 + h, rt = r * 0.2, e = 0.8;
    a.cylindre(rt * 0.72, rt * 1.05, e * 0.62, 8, SABLE3, { x, y: yt + e * 0.27, z, nuance: 0.02 });
    for (let k = 0; k < 8; k++) { const t = (k / 8) * 2 * PI; a.ovale(rt * 0.42, SABLE3, { x: x + Math.cos(t) * rt * 1.25, y: yt + e * 0.62, z: z + Math.sin(t) * rt * 1.25, trait: false }, 6); }
    a.cylindre(rt * 0.25, rt * 1.15, e * 0.6, 6, SABLE3, { x, y: yt + e * 1.02, z, nuance: 0.02 });
    a.boite(e * 0.56, e * 0.12, e * 0.12, SABLE3, { x, y: yt + e * 1.12, z }).boite(e * 0.12, e * 0.12, e * 0.56, SABLE3, { x, y: yt + e * 1.12, z });
    a.ovale(rt * 0.42, SABLE3, { x, y: yt + e * 1.42, z, trait: false }, 6);
  };
  // (rien au droit des fermes du toit, en x = 259,4 et 265,4 : au-dessus de 8 m, les clochers passent entre elles. Les quatre de devant, gros, partent de la façade ; derrière eux, quatre autres et la grande tour)
  for (const [dz, h] of [[-1.85, 9.0], [1.85, 9.0], [-5.6, 7.9], [5.6, 7.9]]) clocher(263.95, zS + dz, 1.12, h);
  for (const [dz, h] of [[-3.7, 8.0], [3.7, 8.0], [-6.5, 6.9], [6.5, 6.9]]) clocher(267.75, zS + dz, 0.92, h);
  clocher(266.9, zS, 1.15, 10.2);
  // (la grande tour : sa croix à quatre bras, posée en 2026)
  a.boite(0.66, 0.16, 0.16, SABLE3, { x: 266.9, y: yM + 12.34, z: zS }).boite(0.16, 0.16, 0.66, SABLE3, { x: 266.9, y: yM + 12.34, z: zS }).boite(0.16, 0.66, 0.16, SABLE3, { x: 266.9, y: yM + 12.34, z: zS });

  // ---- L'Alhambra, le long du mur nord : la cour des Lions. Ses fines colonnes, ses arcs de dentelle, ses deux pavillons à toit en pyramide ; devant, la fontaine et ses douze lions
  const xA = 253, zA = 88.4, LA = 12.4, yA = yM + 0.46;
  bloc(LA + 1.1, 0.46, 5.6, SABLE2, { x: xA, y: yM + 0.23, z: zA + 2 }, false);
  // le mur du fond, sa dentelle en losanges
  bloc(LA + 1, 5.6, 0.8, SABLE4, { x: xA, y: yA + 2.8, z: zA - 0.55 });
  for (let r = 0; r < 4; r++) for (let k = 0; k < 40; k++) if ((k + r) % 2 === 0) a.boite(0.2, 0.2, 0.07, SABLE2, { x: xA - LA / 2 + 0.2 + k * 0.31, y: yA + 3.1 + r * 0.26, z: zA - 0.13, rz: PI / 4, trait: false, nuance: 0.02 });
  /** Une galerie d'arcs, le long de x, de x0 à x1, sur des colonnes fines ; en z : sa frise de dentelle, sa corniche. */
  const galerie = (x0, x1, z, n, H = 2.55, Hf = 1.45) => {
    const pas = (x1 - x0) / n, bas = H, P = [[x0 - 0.1, bas], [x1 + 0.1, bas], [x1 + 0.1, bas + Hf], [x0 - 0.1, bas + Hf]], trous = [];
    for (let k = 0; k < n; k++) {
      const c = x0 + (k + 0.5) * pas, r = pas * 0.42, T = [];
      // (un arc outrepassé, un peu plus large que ses colonnes, ses festons)
      for (let j = 0; j <= 12; j++) { const t = -0.18 * PI + (j / 12) * 1.36 * PI; T.push([c - Math.cos(t) * r, bas - 0.0 + 0.1 + r * 0.25 + Math.sin(t) * r * 1.1 + (j > 0 && j < 12 && j % 2 ? 0.03 : 0)]); }
      trous.push(T);
    }
    a.piece(new THREE.ExtrudeGeometry(forme(P, trous), { depth: 0.3, bevelEnabled: false }), SABLE1, { y: yA, z, nuance: 0.02, teinte: (x, y, zz) => (zz > z + 0.03 && zz < z + 0.28 ? SABLE4 : SABLE1) });
    for (let k = 0; k <= n; k++) {
      const x = x0 + k * pas;
      for (const dx of k > 0 && k < n ? [-0.09, 0.09] : [0]) {
        a.cylindre(0.05, 0.062, H, 8, SABLE3, { x: x + dx, y: yA + H / 2, z: z + 0.15, nuance: 0.015, trait: false });
        a.boite(0.15, 0.13, 0.15, SABLE3, { x: x + dx, y: yA + H - 0.04, z: z + 0.15, trait: false }).cylindre(0.085, 0.085, 0.05, 8, SABLE3, { x: x + dx, y: yA + 0.03, z: z + 0.15, trait: false });
      }
    }
    // (de petits losanges dans les écoinçons, une corniche et son rang de créneaux)
    for (let k = 0; k <= 2 * n; k++) a.boite(0.1, 0.1, 0.03, SABLE3, { x: x0 + (k * pas) / 2, y: yA + H + Hf - 0.18, z: z + 0.31, rz: PI / 4, trait: false });
    a.boite(x1 - x0 + 0.32, 0.1, 0.42, SABLE3, { x: (x0 + x1) / 2, y: yA + H + Hf + 0.05, z: z + 0.13, nuance: 0.02 });
  };
  const zG = zA + 0.72;
  galerie(xA - LA / 2 + 2.3, xA + LA / 2 - 2.3, zG, 7);
  // (le toit de la galerie : un pan de tuiles, du haut de la frise au mur)
  { const l = LA - 4.4, d = 1.2; a.boite(l, 0.1, Math.hypot(d, 0.55), SABLE2, { x: xA, y: yA + 4.33, z: zG - 0.42, rx: -Math.atan2(0.55, d), nuance: 0.02 }); for (let k = 0; k < 22; k++) a.boite(0.05, 0.045, 1.28, SABLE4, { x: xA - l / 2 + 0.2 + k * ((l - 0.4) / 21), y: yA + 4.38, z: zG - 0.44, rx: -Math.atan2(0.55, d), trait: false }); }
  /** Un pavillon : quatre groupes de colonnes, ses arcs, son toit en pyramide et sa boule. */
  const pavillon = (xc) => {
    const l = 3.1, z0 = zA - 0.1, z1 = zA + 2.9;
    galerie(xc - l / 2, xc + l / 2, z1 - 0.3, 2, 3.0, 1.2);
    for (const x of [xc - l / 2, xc + l / 2]) {
      a.boite(0.24, 1.23, z1 - z0, SABLE1, { x, y: yA + 3.585, z: (z0 + z1) / 2, nuance: 0.02 });
      for (const z of [z0 + 1.3]) a.cylindre(0.06, 0.07, 3.0, 8, SABLE3, { x, y: yA + 1.5, z, trait: false });
    }
    a.boite(l + 0.45, 0.12, z1 - z0 + 0.45, SABLE3, { x: xc, y: yA + 4.26, z: (z0 + z1) / 2, nuance: 0.02 });
    a.piece(new THREE.ConeGeometry((l + 0.6) * 0.72, 1.5, 4), SABLE2, { x: xc, y: yA + 5.05, z: (z0 + z1) / 2, ry: PI / 4, sz: (z1 - z0 + 0.6) / (l + 0.6), nuance: 0.02 });
    a.cylindre(0.05, 0.08, 0.3, 6, SABLE3, { x: xc, y: yA + 5.85, z: (z0 + z1) / 2, trait: false }).ovale(0.14, SABLE3, { x: xc, y: yA + 6.08, z: (z0 + z1) / 2 }, 8).ovale(0.08, SABLE3, { x: xc, y: yA + 6.28, z: (z0 + z1) / 2, trait: false }, 6);
  };
  pavillon(xA - LA / 2 + 1.1); pavillon(xA + LA / 2 - 1.1);
  // la fontaine : son bassin à douze pans, sa vasque sur son pied ; ses douze lions, le museau vers le dehors
  {
    const zc = zA + 3.15, xc = xA;
    a.cylindre(1.42, 1.5, 0.3, 12, SABLE2, { x: xc, y: yA + 0.15, z: zc, nuance: 0.02 });
    a.cylindre(0.62, 0.62, 0.05, 12, SABLE4, { x: xc, y: yA + 0.31, z: zc, trait: false });
    a.cylindre(0.13, 0.2, 0.9, 10, SABLE3, { x: xc, y: yA + 0.75, z: zc, nuance: 0.02 });
    a.cylindre(0.82, 0.3, 0.26, 12, SABLE3, { x: xc, y: yA + 1.26, z: zc, nuance: 0.02 });
    a.cylindre(0.1, 0.13, 0.4, 8, SABLE3, { x: xc, y: yA + 1.56, z: zc, trait: false }).ovale(0.15, SABLE3, { x: xc, y: yA + 1.8, z: zc }, 8);
    for (let k = 0; k < 12; k++) {
      const t = (k / 12) * 2 * PI, ux = Math.cos(t), uz = Math.sin(t), xl = xc + ux * 1.16, zl = zc + uz * 1.16, y = yA + 0.3;
      const q = (d, h, s = 0, o = {}) => ({ x: xl + ux * d - uz * s, y: y + h, z: zl + uz * d + ux * s, ry: -t + PI / 2, ...o });
      // (le corps, en bloc, tourné vers le dehors ; ses quatre pattes droites ; la crinière courte, le mufle carré, les yeux, les petites oreilles)
      a.boite(0.2, 0.17, 0.42, SABLE1, q(-0.06, 0.26, 0, { nuance: 0.02 }));
      for (const [d, s] of [[0.1, -1], [0.1, 1], [-0.22, -1], [-0.22, 1]]) a.boite(0.06, 0.2, 0.08, SABLE1, q(d, 0.1, s * 0.07, { trait: false }));
      a.ovale(0.135, SABLE3, q(0.15, 0.37, 0, { sx: 1.05, sy: 1.0, sz: 0.74, nuance: 0.03 }), 8);
      a.boite(0.13, 0.13, 0.12, SABLE1, q(0.24, 0.36, 0, { trait: false }));
      a.boite(0.09, 0.07, 0.09, SABLE3, q(0.31, 0.33, 0, { trait: false }));
      a.boite(0.05, 0.015, 0.02, SABLE5, q(0.356, 0.31, 0, { trait: false }));
      for (const s of [-1, 1]) a.ovale(0.016, SABLE5, q(0.3, 0.39, s * 0.035, { trait: false }), 5).ovale(0.03, SABLE1, q(0.2, 0.46, s * 0.075, { trait: false }), 5);
    }
  }

  // ---- Don Quichotte, dans le coin nord-ouest : le moulin et ses ailes en treillis ; le chevalier maigre sur Rossinante, sa lance, son plat à barbe ; Sancho sur son âne
  const xQ = 242.3, zQ = 90.3;
  bloc(5.2, 0.46, 6.5, SABLE2, { x: xQ, y: yM + 0.23, z: zQ }, false);
  const yQ = yM + 0.46;
  {
    // le moulin : sa tour, sa porte et ses fenêtres, son toit en bonnet, son moyeu, quatre ailes
    const xm = xQ - 1.2, zm = zQ - 1.75;
    a.piece(new THREE.CylinderGeometry(0.92, 1.28, 3.5, 12, 4), SABLE1, { x: xm, y: yQ + 1.75, z: zm, nuance: 0.02, deformer: taille(0.018) });
    for (let k = 1; k < 4; k++) a.piece(new THREE.CylinderGeometry(1.29 - k * 0.09, 1.3 - k * 0.09, 0.03, 12), SABLE4, { x: xm, y: yQ + k * 0.88, z: zm, trait: false });
    a.piece(new THREE.ConeGeometry(1.14, 1.05, 12, 2), SABLE3, { x: xm, y: yQ + 4.0, z: zm, nuance: 0.02 });
    a.boite(0.04, 0.95, 0.56, SABLE5, { x: xm + 1.2, y: yQ + 0.5, z: zm + 0.3, ry: 0.1, trait: false });
    for (const [t, y] of [[0.5, 1.75], [1.6, 2.6], [2.4, 1.6]]) a.boite(0.26, 0.42, 0.06, SABLE5, { x: xm + Math.sin(t) * 1.13, y: yQ + y, z: zm + Math.cos(t) * 1.13, ry: t, trait: false });
    const xh = xm + 0.42, yh = yQ + 3.55, zh = zm + 0.92, dir = 0.42; // (le moyeu : vers le sud-est, vers qui regarde)
    a.cylindre(0.09, 0.12, 0.7, 8, SABLE4, { x: xh - 0.2, y: yh, z: zh - 0.2, rx: PI / 2, rz: -dir, ordre: 'YXZ', ry: dir, trait: false });
    a.ovale(0.15, SABLE3, { x: xh, y: yh, z: zh }, 8);
    for (let k = 0; k < 4; k++) {
      const t = k * (PI / 2) + 0.4, cx = Math.cos(t), sy = Math.sin(t), rx = Math.cos(dir), rz = -Math.sin(dir);
      const Pt = (l, w) => [xh + rx * (cx * l - sy * w), yh + sy * l + cx * w, zh + rz * (cx * l - sy * w)];
      // (les ailes : un long bras, deux longerons, des barreaux : un treillis, pas une planche)
      a.baton(Pt(0, 0), Pt(2.5, 0), 0.04, SABLE3, 5);
      for (const w of [0.08, 0.5]) a.baton(Pt(0.7, w), Pt(2.5, w), 0.016, SABLE3, 4, { trait: false });
      for (let b = 0; b <= 6; b++) { const l = 0.7 + (b / 6) * 1.8; a.baton(Pt(l, 0), Pt(l, 0.5), 0.014, SABLE3, 4, { trait: false }); }
    }
  }
  /** Un cheval (ou un âne) dans le repère R, tourné vers +z : un corps en fuseau, un cou, une tête, quatre pattes à genou, une queue ; un antérieur levé. o : maigre (les côtes), oreilles longues. */
  const monture = (R, k, c, { maigre = false, ane = false } = {}) => {
    const Pt = (x, y, z) => { const q = R(x * k, y * k, z * k); return [q.x, q.y, q.z]; };
    const r0 = maigre ? 0.21 : 0.25;
    a.tronc([Pt(0, 1.06, -0.62), Pt(0, 1.08, -0.3), Pt(0, 1.04, 0.1), Pt(0, 1.1, 0.45), Pt(0, 1.2, 0.62)], [0.14 * k, r0 * 1.15 * k, r0 * (maigre ? 0.92 : 1.1) * k, r0 * 1.1 * k, 0.13 * k], c, 10, { nuance: 0.025 });
    a.ovale(0.27 * k, c, R(0, 1.1 * k, -0.5 * k, { sx: 0.82, sy: 0.9, sz: 1.1, nuance: 0.02 }), 9);
    if (maigre) for (let j = 0; j < 5; j++) for (const u of [-1, 1]) a.boite(0.012 * k, 0.28 * k, 0.03 * k, SABLE4, R(u * 0.19 * k * (1 - 0.1 * Math.abs(j - 2)), 0.98 * k, (-0.1 + j * 0.11) * k, { rz: u * 0.28, trait: false }));
    // le cou, la crinière, la tête, les oreilles
    a.tronc([Pt(0, 1.2, 0.5), Pt(0, 1.46, 0.76), Pt(0, 1.68, 0.92)], [0.15 * k, 0.1 * k, 0.082 * k], c, 9, { nuance: 0.02 });
    for (let j = 0; j < 7; j++) a.ovale(0.05 * k, SABLE4, R(0, (1.38 + j * 0.06) * k, (0.56 + j * 0.06) * k, { sz: 1.3, trait: false }), 5);
    a.tronc([Pt(0, 1.7, 0.9), Pt(0, 1.6, 1.12), Pt(0, 1.5, 1.28)], [0.09 * k, 0.075 * k, 0.055 * k], c, 9, { nuance: 0.02 });
    a.ovale(0.06 * k, c, R(0, 1.49 * k, 1.29 * k, { sz: 1.1, trait: false }), 6);
    for (const u of [-1, 1]) {
      a.piece(new THREE.ConeGeometry(0.035 * k, (ane ? 0.3 : 0.14) * k, 5), c, R(u * 0.055 * k, (ane ? 1.88 : 1.82) * k, 0.88 * k, { rz: -u * (ane ? 0.18 : 0.1), trait: false }));
      a.ovale(0.016 * k, SABLE5, R(u * 0.07 * k, 1.66 * k, 1.05 * k, { trait: false }), 5);
    }
    // les pattes : [x, z, levée]
    for (const [u, z, leve] of [[-1, 0.5, false], [1, 0.5, true], [-1, -0.55, false], [1, -0.55, false]]) {
      const ar = z < 0, x = u * 0.15, g = leve ? [x, 0.72, z + 0.3] : [x, 0.55, z + (ar ? -0.05 : 0.03)], s = leve ? [x, 0.42, z + 0.16] : [x, 0.035, z + (ar ? 0.03 : 0.02)];
      a.tronc([Pt(x, 1.02, z), Pt(g[0], g[1], g[2]), Pt(s[0], s[1], s[2])], [(ar ? 0.105 : 0.085) * k, 0.052 * k, 0.04 * k], c, 8, { nuance: 0.02 });
      const sabot = Pt(s[0], s[1], s[2]);
      a.cylindre(0.05 * k, 0.062 * k, 0.07 * k, 8, SABLE4, { x: sabot[0], y: sabot[1], z: sabot[2], trait: false });
    }
    // la queue
    a.tronc([Pt(0, 1.18, -0.76), Pt(0, 0.98, -0.9), Pt(0.03, 0.56, -0.92)], [0.04 * k, 0.06 * k, 0.025 * k], SABLE4, 6);
  };
  const RQ = (xc, zc, dir) => (dx, y, dz, o = {}) => ({ ordre: 'YXZ', ...o, x: xc + dx * Math.cos(dir) + dz * Math.sin(dir), y: yQ + y, z: zc - dx * Math.sin(dir) + dz * Math.cos(dir), ry: dir + (o.ry || 0) });
  {
    // le chevalier
    const dir = -PI / 2 - 0.18, R = RQ(xQ + 1.0, zQ + 1.25, dir), k = 1.22, pt = (x, y, z) => { const q = R(x * k, y * k, z * k); return [q.x, q.y, q.z]; };
    monture(R, k, SABLE1, { maigre: true });
    // la selle, les jambes maigres et leurs jambières, le buste en armure, la tête et sa barbe, le plat à barbe, la lance, le bouclier
    a.ovale(0.2 * k, SABLE4, R(0, 1.31 * k, -0.1 * k, { sx: 0.9, sy: 0.3, sz: 1.3, trait: false }), 7);
    for (const u of [-1, 1]) {
      a.tronc([pt(u * 0.12, 1.34, -0.08), pt(u * 0.25, 1.0, 0.04), pt(u * 0.25, 0.68, -0.02)], [0.075 * k, 0.05 * k, 0.04 * k], SABLE3, 8, { nuance: 0.015 });
      a.ovale(0.05 * k, SABLE3, R(u * 0.25 * k, 0.64 * k, 0.03 * k, { sz: 1.7, trait: false }), 6);
    }
    a.piece(new THREE.CylinderGeometry(0.13 * k, 0.17 * k, 0.56 * k, 10, 2), SABLE3, R(0, 1.62 * k, -0.08 * k, { rx: 0.08, nuance: 0.02 }));
    for (let j = 0; j < 3; j++) a.piece(new THREE.CylinderGeometry((0.165 - j * 0.012) * k, (0.17 - j * 0.012) * k, 0.03 * k, 10), SABLE4, R(0, (1.46 + j * 0.11) * k, -0.08 * k, { trait: false }));
    a.ovale(0.08 * k, SABLE3, R(0, 1.94 * k, -0.05 * k, { sy: 1.15 }), 8);
    a.piece(new THREE.ConeGeometry(0.05 * k, 0.17 * k, 6), SABLE3, R(0, 1.82 * k, 0.03 * k, { rx: PI + 0.25, trait: false }));
    a.cylindre(0.15 * k, 0.05 * k, 0.05 * k, 12, SABLE3, R(0, 2.03 * k, -0.05 * k, { rx: -0.14 }));
    // (le bras droit, la lance, longue, vers le moulin ; le bras gauche et le bouclier rond)
    a.tronc([pt(0.15, 1.82, -0.06), pt(0.24, 1.58, 0.1), pt(0.16, 1.6, 0.32)], [0.05 * k, 0.04 * k, 0.035 * k], SABLE3, 7);
    a.baton(pt(0.17, 1.42, -0.42), pt(0.12, 2.45, 2.15), 0.032, SABLE4, 6);
    a.piece(new THREE.ConeGeometry(0.05, 0.3, 6), SABLE3, (() => { const q = pt(0.115, 2.52, 2.32); return { x: q[0], y: q[1], z: q[2], ry: dir, rx: 1.2, ordre: 'YXZ', trait: false }; })());
    a.tronc([pt(-0.15, 1.82, -0.06), pt(-0.24, 1.6, 0.04), pt(-0.2, 1.56, 0.24)], [0.05 * k, 0.04 * k, 0.035 * k], SABLE3, 7);
    a.cylindre(0.27 * k, 0.27 * k, 0.04 * k, 14, SABLE3, R(-0.33 * k, 1.58 * k, 0.12 * k, { rz: PI / 2, nuance: 0.02 }));
    // Sancho, derrière lui, sur son âne : tout rond, son chapeau, ses jambes courtes
    const dirS = -PI / 2 + 0.12, RS = RQ(xQ + 1.45, zQ - 1.05, dirS), kS = 0.9, pS = (x, y, z) => { const q = RS(x * kS, y * kS, z * kS); return [q.x, q.y, q.z]; };
    monture(RS, kS, SABLE2, { ane: true });
    a.ovale(0.27 * kS, SABLE3, RS(0, 1.62 * kS, -0.1 * kS, { sy: 1.12, nuance: 0.02 }), 10);
    a.ovale(0.135 * kS, SABLE3, RS(0, 2.04 * kS, -0.06 * kS), 9);
    a.cylindre(0.2 * kS, 0.2 * kS, 0.03 * kS, 12, SABLE3, RS(0, 2.15 * kS, -0.06 * kS)).cylindre(0.1 * kS, 0.12 * kS, 0.12 * kS, 10, SABLE3, RS(0, 2.22 * kS, -0.06 * kS));
    for (const u of [-1, 1]) {
      a.tronc([pS(u * 0.14, 1.4, -0.08), pS(u * 0.27, 1.05, 0.05), pS(u * 0.26, 0.8, 0)], [0.09 * kS, 0.06 * kS, 0.045 * kS], SABLE3, 8, { nuance: 0.015 });
      a.tronc([pS(u * 0.2, 1.76, -0.08), pS(u * 0.3, 1.52, 0.06), pS(u * 0.14, 1.5, 0.24)], [0.06 * kS, 0.05 * kS, 0.04 * kS], SABLE3, 7, { trait: false });
    }
  }
  a.boite(0.05, 0.4, 2.6, SABLE4, { x: xQ + 2.62, y: yM + 0.24, z: zQ + 1.2, trait: false });
  ecrire({ x: xQ + 2.65, y: yM, z: zQ + 1.2, ry: PI / 2 }, { texte: 'Don Quijote', x: 0, y: 0.25, z: 0, l: 2.4, h: 0.36, fond: null, encre: '#7a5f38' });

  // ---- Le dragon de Gaudí (le parc Güell), au milieu : son escalier double, son corps tout en écailles, sa gueule ouverte, ses pattes griffues
  const xD = 252.8, zD = 107, PEN = 3;
  {
    // l'escalier : trois marches, un muret en vague de chaque côté, un bouclier en médaillon derrière lui
    for (let k = 0; k < 3; k++) bloc(4.6 - k * 0.9, 0.34, 3.7 - k * 0.56, k % 2 ? SABLE2 : SABLE1, { x: xD, y: yM + 0.17 + k * 0.34, z: zD }, false);
    const yD = yM + 1.02;
    // (derrière lui, le muret du haut de l'escalier, sa crête en vagues, le médaillon rond qu'il porte)
    {
      const pts = [[-1.5, 0], [1.5, 0]];
      for (let k = 0; k <= 12; k++) { const u = 1.5 - (k / 12) * 3; pts.push([u, 0.74 + 0.12 * Math.cos(u * 6.3) + 0.3 * (1 - Math.abs(u) / 1.5)]); }
      a.piece(new THREE.ExtrudeGeometry(forme(pts), { depth: 0.4, bevelEnabled: false }), SABLE1, { x: xD + 1.42, y: yM + 1.02, z: zD, ry: PI / 2, nuance: 0.02 });
      a.ovale(0.42, SABLE3, { x: xD + 1.36, y: yM + 1.72, z: zD, sx: 0.14, nuance: 0.02 }, 12);
      a.ovale(0.3, SABLE4, { x: xD + 1.31, y: yM + 1.72, z: zD, sx: 0.08, trait: false }, 10);
    }
    // le corps : une courbe en S, épaisse au ventre, sa queue enroulée ; la tête relevée
    const PB = [[xD + 0.86, yD + 0.13, zD + 0.86], [xD + 1.1, yD + 0.12, zD + 0.36], [xD + 0.96, yD + 0.1, zD - 0.18], [xD + 0.52, yD + 0.26, zD - 0.34], [xD - 0.15, yD + 0.46, zD - 0.12], [xD - 0.86, yD + 0.52, zD + 0.08], [xD - 1.5, yD + 0.75, zD + 0.12], [xD - 1.92, yD + 1.1, zD + 0.1]];
    const RB = [0.045, 0.09, 0.17, 0.3, 0.42, 0.4, 0.27, 0.2];
    a.tronc(PB, RB, SABLE1, 12, { nuance: 0.025 });
    // ses écailles : des plaques rondes, sur le dos et les flancs, par rangs, deux tons (le trencadís de la vraie, en sable)
    for (let i = 0; i + 1 < PB.length; i++) {
      const n = Math.max(3, Math.round(Math.hypot(PB[i + 1][0] - PB[i][0], PB[i + 1][2] - PB[i][2]) / 0.13));
      for (let j = 0; j < n; j++) {
        const f = (j + 0.5) / n, cx = melange(PB[i][0], PB[i + 1][0], f), cy = melange(PB[i][1], PB[i + 1][1], f), cz = melange(PB[i][2], PB[i + 1][2], f), r = melange(RB[i], RB[i + 1], f);
        const dx = PB[i + 1][0] - PB[i][0], dz = PB[i + 1][2] - PB[i][2], l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l;
        for (let t = -2; t <= 2; t++) {
          const ang = (t + (j % 2) * 0.5) * 0.58, sa = Math.sin(ang), ca = Math.cos(ang);
          a.ovale(Math.max(0.03, r * 0.27), (i + j + t) % 3 ? SABLE3 : SABLE4, { x: cx + nx * sa * r, y: cy + ca * r, z: cz + nz * sa * r, sy: 0.6, trait: false, nuance: 0.015 }, 5);
        }
      }
    }
    // la crête du dos
    for (let k = 1; k < PB.length - 1; k++) a.piece(new THREE.ConeGeometry(RB[k] * 0.28, RB[k] * 0.55, 5), SABLE3, { x: PB[k][0], y: PB[k][1] + RB[k] * 1.12, z: PB[k][2], trait: false });
    // la tête : le crâne, la mâchoire du haut et du bas (la gueule ouverte, sombre dedans), les yeux ronds, les naseaux
    const xT = xD - 2.12, yT = yD + 1.22, zT = zD + 0.1;
    a.ovale(0.3, SABLE1, { x: xT + 0.08, y: yT + 0.04, z: zT, sx: 1.2, sy: 0.82, sz: 0.92, nuance: 0.02 }, 10);
    a.ovale(0.24, SABLE1, { x: xT - 0.28, y: yT + 0.08, z: zT, sx: 1.2, sy: 0.42, sz: 0.76, rz: 0.2, nuance: 0.02 }, 9);
    a.ovale(0.22, SABLE1, { x: xT - 0.22, y: yT - 0.2, z: zT, sx: 1.2, sy: 0.3, sz: 0.72, rz: -0.28, nuance: 0.02 }, 9);
    a.ovale(0.17, SABLE5, { x: xT - 0.26, y: yT - 0.06, z: zT, sx: 1.05, sy: 0.32, sz: 0.68, rz: -0.03, trait: false }, 8);
    for (const u of [-1, 1]) {
      a.ovale(0.075, SABLE3, { x: xT + 0.06, y: yT + 0.26, z: zT + u * 0.17 }, 7).ovale(0.034, SABLE5, { x: xT + 0.005, y: yT + 0.28, z: zT + u * 0.2, trait: false }, 5);
      a.ovale(0.03, SABLE5, { x: xT - 0.5, y: yT + 0.14, z: zT + u * 0.065, trait: false }, 5);
      for (const d of [-0.42, -0.32, -0.22]) a.piece(new THREE.ConeGeometry(0.018, 0.06, 4), SABLE3, { x: xT + d, y: yT - 0.03, z: zT + u * 0.11, rx: PI, trait: false });
    }
    // quatre pattes, écartées, leurs griffes sur les marches
    for (const [fx, u, yp] of [[-0.86, -1, 0.0], [-0.86, 1, 0.0], [0.62, -1, 0.0], [0.62, 1, 0.0]]) {
      const hx = xD + fx, hz = zD + (fx < 0 ? 0.08 : -0.32) + u * 0.3, hy = yD + (fx < 0 ? 0.42 : 0.2), ex = hx + 0.06, ez = hz + u * 0.42, ey = yD + 0.18, py = (Math.abs(ex - xD) < 1.4 && Math.abs(ez - zD) < 1.0 ? yM + 1.03 : yM + 0.7) + yp, px = ex + 0.08, pz = ez + u * 0.16;
      a.tronc([[hx, hy, hz], [ex, ey + 0.1, ez], [px, py + 0.05, pz]], [0.17, 0.125, 0.09], SABLE1, 10, { nuance: 0.02 });
      for (const d of [-1, 0, 1]) a.piece(new THREE.ConeGeometry(0.035, 0.14, 5), SABLE3, { x: px - 0.05 + d * 0.015, y: py + 0.02, z: pz + d * 0.07, rz: PI / 2 - 0.25, trait: false });
    }
  }

  // ---- La sculpture en cours, près de l'escalier : un petit chameau de sable, à moitié sorti du tas, la truelle, le seau, la planche de coffrage
  const xC = 246.6, zC = 109.4;
  {
    a.piece(new THREE.IcosahedronGeometry(1.45, 2), SABLE2, { x: xC, y: yM + 0.22, z: zC, sx: 1.3, sy: 0.7, sz: 1.02, nuance: 0.05, deformer: (x, y, z) => { const k = 1 + 0.07 * Math.sin(x * 9 + z * 6) + 0.05 * Math.sin(y * 13); return [x * k, y * k, z * k]; } });
    const yc = yM + 0.62;
    // (le chameau, regardant vers l'ouest, vers l'entrée : la tête et les bosses sont finies, le reste sort à peine du sable)
    a.tronc([[xC + 0.75, yc + 0.5, zC], [xC + 0.2, yc + 0.62, zC], [xC - 0.45, yc + 0.6, zC], [xC - 0.72, yc + 0.46, zC]], [0.28, 0.42, 0.42, 0.28], SABLE3, 10, { nuance: 0.03 });
    for (const dx of [-0.26, 0.34]) a.piece(new THREE.SphereGeometry(1, 10, 7), SABLE3, { x: xC + dx, y: yc + 1.08, z: zC, sx: 0.25, sy: 0.32, sz: 0.27, nuance: 0.02, deformer: (x, y, z) => { const p = y > 0 ? 1 - 0.34 * y : 1; return [x * p, y, z * p]; } });
    a.tronc([[xC - 0.62, yc + 0.5, zC], [xC - 0.98, yc + 0.34, zC], [xC - 1.2, yc + 0.68, zC], [xC - 1.26, yc + 1.12, zC]], [0.2, 0.15, 0.11, 0.09], SABLE3, 9, { nuance: 0.02 });
    a.ovale(0.11, SABLE3, { x: xC - 1.38, y: yc + 1.17, z: zC, sx: 1.7, sy: 0.82, sz: 0.82, nuance: 0.02 }, 8);
    for (const u of [-1, 1]) a.ovale(0.024, SABLE5, { x: xC - 1.42, y: yc + 1.21, z: zC + u * 0.075, trait: false }, 5).ovale(0.034, SABLE3, { x: xC - 1.28, y: yc + 1.29, z: zC + u * 0.06, sy: 1.4, trait: false }, 5);
    // (les outils)
    a.cylindre(0.17, 0.13, 0.3, 10, '#2f6ab0', { x: xC - 1.9, y: yM + 0.15, z: zC + 1.05 }).boite(0.28, 0.02, 0.12, '#9a9ea2', { x: xC - 1.62, y: yM + 0.02, z: zC + 1.16, ry: 0.5, trait: false }).baton([xC - 1.62, yM + 0.03, zC + 1.16], [xC - 1.34, yM + 0.08, zC + 1.3], 0.012, '#6e4a2c', 5, { trait: false });
    for (let k = 0; k < 3; k++) a.boite(1.6, 0.03, 0.2, '#b8a07a', { x: xC + 1.05, y: yM + 0.03 + k * 0.03, z: zC + 1.55 + k * 0.04, ry: 0.2 + k * 0.06 });
  }

  // les lisses basses tout autour (une seule, de la galerie au mur nord), le tour du dragon
  garde(a, [[Mu.x0 - 0.4, 94.6], [246, 94.6], [246, 93.4], [260, 93.4], [260, 114], [Mu.x1 + 0.4, 114]]);
  garde(a, [[xD - PEN, zD - PEN], [xD + PEN, zD - PEN], [xD + PEN, zD + PEN], [xD - PEN, zD + PEN], [xD - PEN, zD - PEN]]);
  poser(a.fin(), 0, 0, { y: 0, recoit: false, dedans: DEDANS });
  // les plaques : le thème, au mur de l'entrée ; devant la Sagrada Família, le pupitre où l'on s'arrête (le tampon) ; un écriteau pour chaque sculpture
  const b = atelier(), xP = 258.7, zP = 104;
  const pupitre = (x, z, ry, texte) => {
    const c = Math.cos(ry), s = Math.sin(ry);
    b.baton([x, yM, z], [x, yM + 0.98, z], 0.04, '#5e4028', 6).boite(0.5, 0.05, 0.8, '#7a5a3c', { x, y: yM + 1.0, z, ry: ry + PI / 2, rz: 0.35, ordre: 'YXZ' });
    ecrire({ x: x + s * -0.025, y: yM, z: z + c * -0.025, ry }, { texte, x: 0, y: 1.04, z: 0, l: 0.62, h: 0.14, fond: '#f4efe2', encre: '#2a2420' });
  };
  pupitre(xP, zP, -PI / 2, 'サグラダ・ファミリア');
  poser(b.fin(), 0, 0, { y: 0 });
  return { pupitre: { x: xP - 0.8, z: zP }, vers: [263, zS], chantier: { x: xC, z: zC, r: 2.15 }, poteau: { x: xP, z: zP } };
}

const MODELES_VOITURE = {
  kei: { L: 3.39, W: 1.47, rw: 0.27, ab: 1.12, cap: 0.5, ar: 0.12, yb: 0.92, yt: 1.7, pare: 0.5, lun: 0.14, montants: [0.42], plaque: '#f2d23a' },
  berline: { L: 4.3, W: 1.72, rw: 0.3, ab: 1.36, cap: 1.05, ar: 0.6, yb: 0.84, yt: 1.42, pare: 0.66, lun: 0.52, montants: [0.47], plaque: '#f4f4ee' },
  mono: { L: 4.65, W: 1.78, rw: 0.31, ab: 1.45, cap: 0.78, ar: 0.12, yb: 0.98, yt: 1.82, pare: 0.62, lun: 0.12, montants: [0.33, 0.68], plaque: '#f4f4ee' },
};
/**
 * Une voiture garée, dans le repère R (l'avant vers +z), ses roues sur le sol en y : la caisse, un profil de côté aux coins
 * arrondis extrudé sur la largeur (les passages de roues découpés dedans, les bords biseautés) ; la verrière (vitres,
 * pare-brise, lunette), plus étroite, posée sur la ceinture ; le toit, les montants ; les phares, la calandre, les feux, les
 * plaques, les rétroviseurs, les poignées ; les roues et leurs jantes.
 */
function voiture(THREE, a, R, y, c, sorte) {
  const V = MODELES_VOITURE[sorte], { L, W, rw, ab, cap, ar, yb, yt, pare, lun } = V, zf = L / 2 - 0.04, zr = -L / 2 + 0.04, g = 0.22;
  const VITRE = '#2b3640', SOMBRE = '#2a2c30';
  // la caisse : du milieu du bas vers l'avant (la roue avant), le nez, le capot, la ceinture, le coffre, l'arrière, la roue
  // arrière (le contour se referme seul : un point du début répété à la fin donnait des sommets NaN au biseau)
  // (rc : l'arrondi des coins du bas, plus petit que le porte-à-faux : sur le kei, le contour revenait en arrière et ses faces se
  // recouvraient)
  // (le passage de roue : un demi-cercle posé sur le bas de caisse, sans bout droit : de courts côtés droits pliaient le biseau)
  const k = new THREE.Shape(), ra = rw + 0.12, rc = Math.min(0.16, (zf - ab - ra) * 0.5);
  const roue = (zc) => { k.lineTo(zc - ra, g); k.absarc(zc, g, ra, PI, 0, true); };
  k.moveTo(0, g);
  roue(ab);
  k.lineTo(zf - rc, g);
  k.quadraticCurveTo(zf, g, zf, g + rc);
  k.lineTo(zf, yb - 0.2);
  k.quadraticCurveTo(zf, yb - 0.06, zf - 0.2, yb - 0.04);
  k.lineTo(zf - cap, yb);
  k.lineTo(zr + ar, yb);
  k.quadraticCurveTo(zr, yb, zr, yb - 0.18);
  k.lineTo(zr, g + rc);
  k.quadraticCurveTo(zr, g, zr + rc, g);
  roue(-ab);
  const extruder = (forme, large, biseau) => new THREE.ExtrudeGeometry(forme, { depth: large - 2 * biseau, bevelEnabled: true, bevelThickness: biseau, bevelSize: biseau * 0.8, bevelSegments: 2, curveSegments: 6 })
    .translate(0, 0, -(large - 2 * biseau) / 2).rotateY(-PI / 2);
  a.piece(extruder(k, W, 0.05), c, R(0, y, 0, { nuance: 0.02 }));
  // la verrière : du pied du pare-brise au pied de la lunette, 12 cm en retrait de chaque côté (l'épaule de la caisse)
  const zA = zf - cap, zT = zA - pare, zC = zr + ar, zL = zC + lun, v = new THREE.Shape();
  v.moveTo(zA, yb - 0.03);
  v.lineTo(zT + 0.05, yt - 0.05);
  v.quadraticCurveTo(zT, yt, zT - 0.12, yt);
  v.lineTo(zL + 0.12, yt);
  v.quadraticCurveTo(zL, yt, zL - 0.04, yt - 0.05);
  v.lineTo(zC, yb - 0.03);
  a.piece(extruder(v, W - 0.24, 0.03), VITRE, R(0, y, 0, { trait: false }));
  // le toit, peint, sur le haut de la verrière ; les montants entre les vitres de côté (1 cm devant les vitres)
  a.boite(W - 0.2, 0.06, zT - zL - 0.12, c, R(0, y + yt + 0.012, (zT + zL) / 2));
  for (const f of V.montants) {
    const zm = zT - 0.12 - (zT - zL - 0.24) * f;
    for (const u of [-1, 1]) a.boite(0.04, yt - yb + 0.02, 0.1, c, R(u * ((W - 0.24) / 2 + 0.01), y + (yt + yb) / 2, zm, { trait: false }));
  }
  // l'avant : les phares, la calandre, la plaque ; l'arrière : les feux, la plaque
  for (const u of [-1, 1]) {
    a.boite(0.3, 0.1, 0.03, '#eef2f2', R(u * (W / 2 - 0.25), y + yb - 0.27, zf + 0.04 + 0.004, { trait: false }))
      .boite(0.26, 0.11, 0.03, '#c8302a', R(u * (W / 2 - 0.2), y + yb - 0.27, zr - 0.04 - 0.004, { trait: false }));
  }
  a.boite(Math.min(0.62, W - 0.95), 0.12, 0.02, SOMBRE, R(0, y + yb - 0.29, zf + 0.04 + 0.002, { trait: false }));
  for (const [zp, sens] of [[zf, 1], [zr, -1]]) {
    a.boite(0.33, 0.165, 0.014, V.plaque, R(0, y + g + 0.26, zp + sens * (0.04 + 0.01), { trait: false }))
      .boite(0.2, 0.03, 0.006, sorte === 'kei' ? '#2a2a2a' : '#2f6a4a', R(0, y + g + 0.28, zp + sens * (0.04 + 0.019), { trait: false }));
  }
  // les rétroviseurs, les poignées des portes
  for (const u of [-1, 1]) {
    a.boite(0.07, 0.1, 0.15, c, R(u * (W / 2 + 0.03), y + yb + 0.06, zA - 0.12));
    for (const zp of [zA - 0.5, zA - 0.5 - (zA - zC) * 0.42]) if (zp > zC + 0.2) a.boite(0.012, 0.03, 0.12, SOMBRE, R(u * (W / 2 + 0.006), y + yb - 0.11, zp, { trait: false }));
  }
  // les roues : le pneu, la jante, le moyeu (1 cm plus larges l'un que l'autre : pas de faces dans le même plan)
  for (const [u, w] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const q = R(u * (W / 2 - 0.13), y + rw, w * ab, { rz: PI / 2 });
    a.cylindre(rw, rw, 0.21, 14, '#232326', q).cylindre(rw * 0.62, rw * 0.62, 0.23, 10, '#b9bdc1', { ...q, trait: false }).cylindre(rw * 0.2, rw * 0.2, 0.25, 8, '#7e8388', { ...q, trait: false });
  }
}


// ---------------------------------------------------------------- Les textes du lieu
const TEXTES = {
  fr: {
    noms: { centreServeuse: 'La serveuse', centreCliente: 'La grand-mère', kaikanCliente: 'La cliente', toitPhoto: 'Le photographe', liftBas: 'Le préposé du télésiège', liftHaut: 'La préposée du télésiège', centreCaisse: 'La vendeuse', centreClient: 'Le client', vieuxHaut: 'Le vieux monsieur', filleHaut: 'La jeune fille', chauffeur: 'Le chauffeur', garde: 'Le garde du parc', vendeuseR: 'La vendeuse', vendeuseF: 'Le vendeur', kaikan: 'La dame de la caisse', serveuse: 'La serveuse', cuisinier: 'Le cuisinier', dineur: 'Le client', dineuse: 'La cliente', chamelier: 'Le chamelier', moniteur: 'Le moniteur', naturaliste: 'La naturaliste', videaste: '@random_japan_place', amoureuse: 'La touriste', amoureux: 'Le touriste', enfant: 'Le petit garçon', maman: 'La maman', pilote: 'Le pilote', pecheur: 'Le pêcheur', sculpteur: 'Le sculpteur', accueil: 'L’hôtesse', visiteur: 'Le visiteur', visiteuse: 'La grand-mère', galerie: 'La visiteuse', marcheur: 'Le randonneur', grimpeur: 'Le grimpeur', randonneuse: 'La promeneuse', plagiste: 'La promeneuse', vieux: 'Le vieil homme' },
    tampons: {
      crete: ['Le Dos de cheval', 'tout en haut de la grande crête, au poteau 馬の背 : la vue sur la mer'],
      chameau: ['Le tour à dos de chameau', 'au coin des chameaux, juste après l’escalier : demander un tour au chamelier'],
      planche: ['La planche de sable', 'sur la crête, à l’est du sommet : descendre la grande pente avec le moniteur'],
      musee: ['Le musée du sable', 'au bout de la route, dans le grand hall : le pupitre devant la Sagrada Família de sable'],
      oasis: ['L’oasis', 'au fond de la cuvette, au pied de la crête : l’écriteau au bord de l’eau'],
    },
    arrivee: null,
    crete1: ['Te voilà sur le Dos de cheval (馬の背) : 47 mètres de sable, et la mer du Japon juste en dessous.', 'Là-bas, à droite, cet îlot : c’est 海士島. La préfecture de Tottori le dit elle-même : on dirait une baleine qui nage.'],
    crete1Nuit: ['La nuit, le Dos de cheval est tout bleu. Sur la mer, de petites lumières : les bateaux qui pêchent le calmar (いさり火).'],
    crete2: ['Et de l’autre côté, tout au bout de la côte : le mont Daisen, à 65 kilomètres. Il faut un temps bien clair.', 'Ces dunes font seize kilomètres de long. Le sable vient du granite des montagnes : la rivière l’a descendu, la mer l’a rendu, et le vent l’a poussé jusqu’ici.'],
    crete2Nuit: ['Vers l’ouest, la lune se couche sur la crête. Le sable garde encore un peu de la chaleur du jour.'],
    creteCompagnon: { kon: ['« Le vent m’emporte les oreilles… Quelle vue, quand même. »'], pon: ['« Pon… Tout ce sable, et pas un seul gâteau. »'], chapu: ['« Chapu ! La mer ! Je peux y aller en roulant ? »'], gao: ['« Gao ! D’ici, je garderais toute la côte. »'], fuwa: ['« Fuwaaa… Il y a une baleine, là-bas ? Je lui dirai bonjour de chez moi. »'], saya: ['« Pas un arbre, ici. Le vent dit que c’est normal. »'] },
    chamelier: ['Bonjour ! Ce sont des chameaux de Bactriane : deux bosses, une longue laine, et une patience d’ange.', 'Il y en a sur ces dunes depuis les années 1960. Tu veux faire un tour ? Ou attendre le soir, ici, c’est très beau aussi.'],
    chamelierEncore: ['Encore un tour ? Ils ne demandent que ça. Ou alors, le soir…'],
    chamelierQuestionNuit: ['Tu veux que le jour revienne ?'],
    chamelierNuit: ['Mes bêtes dorment, la nuit, je te le jure. Pourtant, chaque matin, il y a de grandes traces là-haut, sur la crête.', 'Mon père disait que c’était la caravane de la chanson : Tsuki no Sabaku (月の沙漠), celle des deux voyageurs qui traversent un désert sous la lune. Il la chantait en brossant les chameaux.'],
    chamelierTour: 'Faire un tour', chamelierRien: 'Rien, merci', chamelierSoirChoix: 'Attendre le soir', chamelierMatinChoix: 'Attendre le matin',
    chamelierSoir: ['Assieds-toi, le soir vient vite ici. Et regarde bien la crête…'],
    chamelierMonte: ['Monte par le petit escalier, là. Tiens-toi bien entre les bosses : il va se balancer comme un bateau !'],
    chameauEnRoute: ['En route ! Le chameau marche l’amble : les deux pattes du même côté ensemble. C’est pour ça qu’on se balance.'],
    chameauFin: ['Et voilà ! Cinq minutes, chez nous, c’est le tour d’un vrai voyageur. Il t’a à la bonne, on dirait.'],
    chameauCompagnon: { kon: ['« Tu avais l’air d’une reine. Une reine un peu verte, à cause du roulis. »'], pon: ['« Pon ! Il m’a regardé de haut, ce chameau. Tout en mâchant. »'], chapu: ['« Chapu ! Moi je marchais à côté ! Plus vite que lui ! Presque ! »'], gao: ['« Gao. Deux bosses : c’est solide. J’aime. »'], fuwa: ['« Fuwa… Il fait les vagues avec son dos. »'], saya: ['« Il a mangé un brin d’herbe en passant. Je n’ai rien dit. »'] },
    moniteur: ['Yo ! La planche de sable, ça te dit ? D’ici jusqu’à la plage, contre la montre !', 'Passe entre les six portes, rouges et bleues : chaque porte ratée, c’est 2 secondes de plus. Ton compagnon s’assoit devant. On y va ?'],
    moniteurEncore: ['Encore une descente ? Le chrono t’attend !'],
    moniteurRecord: 'Ton record : {r} s. Tu peux faire mieux ?',
    moniteurConsigneOrdi: ['Pour tourner, les flèches gauche et droite (ou A et D). La pente fait le reste !'],
    moniteurConsigneTel: ['Pour tourner, pousse le joystick à gauche et à droite. La pente fait le reste !'],
    chronoPartez: 'Partez !', chronoPortes: 'Portes', chronoRecord: 'Record',
    plancheTemps: 'Au talkie-walkie : « {t} secondes, et toutes les portes ! »',
    plancheTempsRate: 'Au talkie-walkie : « {t} secondes, avec {s} s de pénalité pour {p} porte(s) ratée(s) ! »',
    plancheRecord1: '« Voilà ton premier record. Il ne demande qu’à tomber. »',
    plancheRecord: '« Nouveau record ! Ça, c’est de la glisse ! »',
    plancheRecordNon: '« Ton record, c’est {r} s. Presque ! »',
    plancheMedailleOr: '« Médaille d’or ! Même les chameaux se sont retournés. »',
    plancheMedailleArgent: '« Médaille d’argent. Encore un peu moins de virages… »',
    plancheMedailleBronze: '« Médaille de bronze. Pas mal du tout ! »',
    plancheArretee: ['Au talkie-walkie : « Tu t’es arrêté avant la ligne ! Pour aller vite, reste dans la pente. »'],
    plancheEncore: ['« Je te remonte en haut pour un autre essai ? »'],
    plancheRemonter: 'Encore une !', plancheRester: 'Je reste sur la plage',
    plancheCompagnon: { kon: ['« J’ai eu les oreilles plaquées tout du long. On recommence ? »'], pon: ['« Pooon ! J’ai perdu mon estomac quelque part en haut. »'], chapu: ['« Chapuuu ! Plus vite ! Encore ! »'], gao: ['« Gao ! Je n’ai pas eu peur. Pas du tout. »'], fuwa: ['« Fuwa ! C’est comme nager, mais en sec ! »'], saya: ['« J’ai du sable jusque dans la mousse. »'] },
    musee: ['Le musée du sable (砂の美術館) : des sculptures géantes, faites de sable et d’eau, rien d’autre. Chaque exposition dure quelques mois, puis tout redevient du sable.', 'Cette année, en 2026 : l’Espagne, pour les cent ans de la mort de Gaudí. Dix-neuf œuvres, vingt sculpteurs venus de quatorze pays. Et voici la Sagrada Família : celle-ci aussi, elle restera inachevée !'],
    museeCompagnon: { kon: ['« Tout ce travail pour que ça retourne au sable… Ça me plaît, comme idée. »'], pon: ['« Pon ! J’ai éternué tout à l’heure. Personne n’a rien vu, hein ? »'], chapu: ['« Chapu… Je ne secoue pas ma queue. Je ne secoue pas ma queue. »'], gao: ['« Gao ! Ces lions-là ne gardent rien. Je vais leur apprendre. »'], fuwa: ['« Fuwa… C’est le palais du dragon, version sèche ? »'], saya: ['« Du sable et de l’eau. Il manque juste une graine. »'] },
    oasis: ['L’oasis (オアシス) : de la pluie et de la neige fondue qui ont traversé le sable, et qui ressortent ici, au pied du Dos de cheval.', 'Elle vient à la fin de l’automne et reste jusqu’au printemps ; aux grandes sécheresses de l’été, elle disparaît. Aujourd’hui, tu as de la chance.'],
    oasisNuit: ['La nuit, l’oasis garde toutes les étoiles. Pas un souffle, ici, au pied de la crête.'],
    oasisCompagnon: { kon: ['« De l’eau au milieu du sable… On se croirait dans un conte. »'], pon: ['« Pon ! Tu crois qu’il y a des gâteaux au fond ? »'], chapu: ['« Chapu ! Chapu ! Je ne dis rien. Je regarde juste l’eau. Très fort. »'], gao: ['« Gao. Une source qui va et qui vient. Difficile à garder. »'], fuwa: ['« Fuwa… Elle est toute petite, mais elle est gentille. »'], saya: ['« Enfin un peu de vert. Bonjour, les petites herbes. »'] },
    chauffeur: ['Terminus : l’entrée des dunes ! L’escalier, là, en face. Il n’a l’air de rien, mais attends d’être en haut.'],
    garde: ['Bonjour ! Je suis garde du parc national : je fais ma ronde tous les jours.', 'Sur les dunes, c’est interdit : les feux d’artifice, le golf, la baignade, écrire sur le sable, emporter du sable, et bien sûr jeter ses déchets.', 'Écrire sur le sable, oui, oui. C’est le vent qui écrit, ici. Regarde ses rides : on les appelle 風紋, les « motifs du vent ».'],
    gardeNuit: ['Le soir, plus personne… à part les traces. J’ai renoncé à comprendre.'],
    vendeuseR: ['Bienvenue à la らくだや ! Des peluches de chameau, des biscuits de sable (pas en vrai sable, promis) et des glaces.'],
    vendeuseRChoix: ['Une glace à la poire', 'Rien, merci'],
    glace: ['Une glace à la poire : les vergers de Fukube sont juste derrière la colline. Elle fond plus vite que tu ne la manges.'],
    glaceCompagnon: { kon: ['« Du frais, enfin. Merci. »'], pon: ['« Pon ! Une pour toi, trois pour moi. »'], chapu: ['« Chapu ! C’est froid, c’est bon ! »'], gao: ['« Gao ! Une glace de gardien. »'], fuwa: ['« Fuwa… Elle fond comme l’écume. »'], saya: ['« Ça sent le verger. Je reconnais des cousins. »'] },
    vendeuseF: ['Tu as vu le sable, en plein été ? Il dépasse les 60 degrés ! Prends un chapeau et de l’eau, et n’y va pas pieds nus à midi.'],
    kaikan: ['Bienvenue au Sakyu Kaikan ! Ici : les rakkyō de Fukube, ces petits oignons au vinaigre qui poussent dans le sable, et le crabe de la mer du Japon en hiver.', 'Goûte, goûte. Ça réveille !'],
    serveuseSoir: ['Une table près de la fenêtre ? D’ici, on voit le coucher de soleil… Tu veux rester jusqu’au soir ?'],
    serveuseMatin: ['Déjà le matin ? Tu veux que je te laisse partir ?'],
    cuisinier: ['Du calmar blanc de ce matin, du crabe, du riz. La mer n’est pas loin, c’est pour ça que c’est bon.'],
    dineur: ['Je suis monté là-haut en tongs. Je ne recommencerai pas.'],
    dineuse: ['Il y a du sable dans mon sac, dans mes cheveux et, je crois, dans mon riz.'],
    naturaliste: ['Regarde autour de l’oasis : une toute petite cicindèle, エリザハンミョウ. Sur ces dunes, elle ne vit presque plus que là.', 'Les plantes aussi sont fortes : ces touffes raides, c’est la コウボウムギ. Plus le sable les enterre, plus elles poussent.'],
    liftBas: ['Bienvenue au télésiège ! Il monte au Sakyu Center, là-haut sur la colline : une promenade dans les airs, au-dessus de la route et des pins.', 'Tu montes ?'],
    liftBasOui: ['Mets-toi sur la marque jaune, je t’ouvre. Le siège arrive par derrière : il ne s’arrête pas, tu t’assois en passant !'],
    liftHaut: ['Tu redescends vers le sable ? Dans ce sens-là, on a tout devant soi : les dunes, et la mer derrière.', 'On y va ?'],
    liftHautOui: ['Sur la marque jaune, s’il te plaît. Bon voyage !'],
    liftAide: 'Tourne la caméra : tout le paysage est à toi.',
    liftHautCompagnon: { kon: ['« Les pieds dans le vide, et la mer au bout. Je recommence quand tu veux. »'], pon: ['« Pon ! J’ai vu le toit des boutiques ! Et une voiture toute petite ! »'], chapu: ['« Chapu ! On a volé ! Sans ailes ! Encore ! »'], gao: ['« Gao. Ça grince, mais ça tient. J’approuve. »'], fuwa: ['« Fuwa… Pour une fois, c’est toi qui flottais. »'], saya: ['« Il y a un numéro dans le dos de chaque siège. Le nôtre portait bonheur, j’en suis sûre. »'] },
    liftBasCompagnon: { kon: ['« Tout ce sable qui grandissait sous nos pieds… On dirait un autre pays. »'], pon: ['« Pon ! Ça sentait la mer, tout le long ! Et un peu le gâteau. Non, ça, c’était moi. »'], chapu: ['« Chapu ! Je voulais sauter dans le sable ! De tout là-haut ! »'], gao: ['« Gao. Le monde est grand, vu d’un banc. »'], fuwa: ['« Fuwa… Les gens, sur la crête, ressemblaient à des graines. »'], saya: ['« Je n’ai rien dit de tout le trajet. Il n’y avait rien à ajouter. »'] },
    panneauLift: ['鳥取砂丘リフト : le télésiège des dunes. Du sable au Sakyu Center, sur la colline : cinq minutes dans les airs.', 'De 9 h 30 à 16 h. 300 yens l’aller, 500 l’aller-retour.'],
    centreServeuse: ['Bienvenue ! Une table pour deux, avec la vue ? Qu’est-ce que je t’apporte ?'],
    menuChoix: ['Le bol de fruits de mer', 'Le chanpon au bouillon d’os de bœuf', 'Le burger au crabe et son jus de poire', 'Rien, merci'],
    menuOui: ['C’est parti ! Assieds-toi là, près de la fenêtre.'],
    menuDit: [['Du thon, du saumon, des calmars tout juste pêchés dans la mer du Japon, sur un bol de riz. La mer qu’on voit de la fenêtre, on l’a aussi dans son assiette.'], ['Un bouillon d’os de bœuf, comme on en fait à Tottori depuis longtemps, doux et profond, plein de légumes. Ça réchauffe, après le vent des dunes.'], ['Un burger au crabe, et un jus de poire Nijisseiki, la poire de Tottori, toute claire et toute fraîche. Il y en a partout sur les doigts.']],
    repasCompagnon: { kon: ['« Tu vas finir ça ? Non, je demande pour un ami. »'], pon: ['« Pooon ! Mon ventre fait déjà de la musique. »'], chapu: ['« Chapuuu ! Il reste un petit bout de poisson, là, non ? »'], gao: ['« Gao ! Je garde ton assiette. Personne n’y touche. »'], fuwa: ['« Fuwa ! Je ne mange que la vapeur. Elle est délicieuse. »'], saya: ['« Il y a des algues, dans ce bouillon ? Non ? Dommage. »'] },
    centreCliente: ['Je ramène des boîtes de 因幡の白うさぎ à tout le quartier. Sinon, on me le reproche jusqu’à l’année prochaine.'],
    kaikanCliente: ['Des rakkyō au vinaigre, des biscuits au crabe, une peluche de chameau… Je suis venue pour une seule chose, et regarde-moi.'],
    toitPhoto: ['C’est d’ici qu’on voit le mieux l’îlot de 海士島. Sa forme de baleine, ce sont des colonnes de lave : on les devine à l’est et au nord.', 'Quand le soleil baisse, les rides du sable sortent toutes d’un coup. Je reviens tous les soirs pour ça.'],
    tableToit: ['Une table d’orientation (方位盤). Au nord, la mer du Japon, et 海士島, l’îlot en forme de baleine.', 'À l’ouest, le sable et le Dos de cheval, 47 m ; très loin derrière, le Daisen, le mont le plus haut de la région, à 65 km.'],
    jumellesToit: ['Des jumelles à pièce. Pour 100 yens, 45 secondes pour trouver six choses, l’une après l’autre !'],
    jumellesPiece: 'Mettre une pièce', jumellesAideOrdi: 'Viser : les flèches. Garde la chose au milieu un instant !', jumellesAideTel: 'Viser : le joystick. Garde la chose au milieu un instant !',
    jumellesCibles: { sommet: 'le poteau du Dos de cheval', gare: 'l’horloge de la gare du bas', parapente: 'le parapente violet', baleine: 'l’îlot de la baleine', musee: 'le grand toit du musée', daisen: 'le mont Daisen, tout au loin' },
    jumellesToutes: 'Clac ! Les six, en {t} secondes !', jumellesFin: 'Clac ! Le temps est écoulé : {n} sur 6.',
    jumellesRecord1: 'C’est ton premier record. Il reste de la place pour faire mieux.', jumellesRecord: 'Ton meilleur score !', jumellesRecordNon: 'Ton record reste {rn} sur 6, en {rt} s.', jumellesRecordAff: 'Ton record : {rn} sur 6, en {rt} s.',
    jumellesCompagnon: { kon: ['« Tu as de bons yeux. Presque autant qu’un renard. »'], pon: ['« Pooon ! Moi, je n’ai vu que le burger, en bas. »'], chapu: ['« Chapu ! Et la baleine, elle nous a vus ? »'], gao: ['« Gao ! Rien ne m’échappe non plus, sur mon toit. »'], fuwa: ['« Fuwa ! De là-haut, je vois tout ça sans jumelles. »'], saya: ['« Le bout de la mer, c’est où ça s’arrête ? »'] },
    jumellesHaut: ['Des jumelles, tournées vers la mer.'],
    jumellesHautVue: ['Le Dos de cheval, tout au bout : des gens minuscules, en file sur la crête. Et derrière eux, toute la mer du Japon.'],
    jumellesHautNuit: ['Trop noir pour y voir quoi que ce soit. Rien que la lune, au-dessus du sable.'],
    centreCaisse: ['Bienvenue au Sakyu Center ! Ici, c’est surtout des gâteaux et des souvenirs de Tottori.', 'Et à côté, le restaurant : le bol de fruits de mer, le chanpon au bouillon d’os de bœuf, le burger au crabe avec un jus de poire Nijisseiki !'],
    centreClient: ['Un chanpon au bouillon d’os de bœuf, avec cette vue… Je ne repars pas tout de suite. Va voir la serveuse, là-bas, elle te trouvera une table.'],
    vieuxHaut: ['Je viens ici chaque année. D’en bas, ce sont des montagnes de sable ; d’ici, on voit enfin leur dessin.', 'Et ce n’est qu’un morceau : le sable court sur seize kilomètres, le long de la côte.'],
    filleHaut: ['Tu vois ces petits points, sur la crête ? Ce sont des gens ! Je les ai comptés jusqu’à ce que mes yeux piquent.', 'Monte sur le toit, par l’escalier : il y a des jumelles à pièce, et un petit jeu. Moi, je n’ai trouvé que quatre choses sur six !'],
    videaste: ['Salut ! Je filme le lieu pour ma chaîne. Tu veux voir ce que ça donne, vu du ciel ?'],
    amoureuse: ['Il m’a dit : « Ce n’est pas loin, je te jure. » Il y a une heure.'],
    amoureux: ['Regarde-moi cette vue ! …Oui, oui, c’était un peu plus loin que prévu.'],
    enfant: ['J’ai construit un château ! Le vent me l’a déjà pris. Il va vite, le vent.'],
    maman: ['Il a du sable partout. Moi aussi. Mais qu’est-ce qu’il est content !'],
    pilote: ['Le parapente violet, là-haut ? C’est mon élève. Ici, le vent de la mer monte tout seul le long de la pente : on décolle à pied, sans moteur.'],
    pecheur: ['Du sable fin, une mer qui tire fort : il faut lancer loin. On ne se baigne pas ici, tu sais : c’est interdit, et c’est dangereux.'],
    pecheurNuit: ['La nuit, je regarde les lumières des bateaux. Et parfois la crête, là-haut, contre la lune… Non, rien. Je dois être fatigué.'],
    sculpteur: ['Je fais un petit chameau pour m’amuser, en attendant l’exposition suivante. Le sable tient avec un peu d’eau, serré, très serré.', 'On commence par le haut et on descend : pas de retour en arrière, avec le sable.'],
    accueil: ['Bienvenue au musée du sable ! Le tour commence ici. L’escalier, à droite, mène à la galerie : d’en haut, on voit tout.'],
    visiteur: ['L’Alhambra, en sable ! Regarde ces arcs. Et personne n’a le droit d’éternuer.'],
    visiteuse: ['Ils les détruisent à la fin, vous savez. C’est ce qui me plaît. On y va, et puis on se souvient.'],
    galerie: ['D’ici, on voit bien les tours. Les petites fentes sont toutes creusées à la main, à la truelle.'],
    marcheur: ['Je descends vers l’oasis. Le plus dur, ce n’est pas de descendre, c’est de savoir qu’il faudra remonter.'],
    grimpeur: ['Un pas en avant, un demi-pas en arrière : c’est ça, le sable. Mais quelle vue, là-haut !'],
    randonneuse: ['Tu as vu mes traces ? Dans dix minutes, le vent les aura effacées. C’est mieux qu’une ardoise.'],
    plagiste: ['Regarde ces petits crabes : ils filent de côté et hop, dans leur trou. Essaie d’en attraper un… Tu verras.'],
    vieux: ['Quand j’étais petit, ces dunes bougeaient plus qu’aujourd’hui : on les a beaucoup plantées, après la guerre. Depuis 1991, on arrache l’herbe, à la main, pour leur rendre leur sable.'],
    entree: ['« 鳥取砂丘 — Les dunes de Tottori. Monument naturel, parc national de la côte de San’in. »', 'En haut de l’escalier, tu verras : tout s’ouvre d’un coup.'],
    mer: ['La mer du Japon.'], merNuit: ['La mer du Japon, la nuit.'],
    arishima: ['Une grande pierre, un poème d’Arishima Takeo, venu ici en 1923 : « 浜坂の遠き砂丘のなかにしてさびしき我を見出でけるかも ».', '« Loin, dans les dunes de Hamasaka, je me suis trouvé, tout seul. »'],
    traces: ['De grandes traces, à deux lobes, qui suivent la crête. Des traces de chameau !', 'Pourtant, le chamelier ne monte jamais ici : ses bêtes restent en bas. Elles vont vers l’ouest, et elles sont toutes fraîches.'],
    tracesCompagnon: { kon: ['« Ça ne sent pas le chameau. Ça sent… le sable. Bizarre. »'], pon: ['« Pon ? Un chameau qui se promène tout seul ? On va le suivre, non ? »'], chapu: ['« Chapu ! De grosses pattes ! Je mets mes pattes dedans ! »'], gao: ['« Gao. Cinq bêtes, en file. Elles ne passent pas le jour. »'], fuwa: ['« Fuwa… Ça sent la nuit, ces traces-là. »'], saya: ['« Le vent les efface, et elles reviennent. Il faudrait voir ça de nuit. »'] },
    grelot: ['Au fond de la grande cuvette, à moitié enterré : un vieux grelot de bronze, plein de sable.', 'Les traces s’arrêtent ici. Pas une seule ne repart.'],
    grelotCompagnon: { kon: ['« Elles descendent, et elles ne remontent pas. Reviens la nuit, on verra bien. »'], pon: ['« Pon… Ça ne me plaît pas, un grelot tout seul. On revient avec la lune ? »'], chapu: ['« Chapu ? Où sont-ils passés ? On revient ce soir ! »'], gao: ['« Gao. Ce qui passe la nuit, on le guette la nuit. »'], fuwa: ['« Fuwa… Il sonne encore un peu, tu entends ? Le soir, peut-être… »'], saya: ['« Il a l’air très vieux. Il attend la nuit, je crois. »'] },
    nuitCompagnon: { kon: ['« Écoute… Des grelots. Là-haut, sur la crête, vers la lune. »'], pon: ['« Pon ! Tu entends ? Ça tinte, là-haut, sur le Dos de cheval ! »'], chapu: ['« Chapu ! Des grelots ! Là-haut ! On y va ? »'], gao: ['« Gao… Quelque chose marche sur la crête. »'], fuwa: ['« Fuwa… Il y a une chanson, là-haut. Une chanson de grelots. »'], saya: ['« Le sable bouge, sur la crête. Tout seul. Et ça tinte. »'] },
    caravaneVue: ['Sur la crête, devant l’immense lune : une file de chameaux. Cinq bêtes, sans cavalier, sans guide. Leurs grelots tintent dans le vent.', 'Leurs flancs fument doucement. Ce ne sont pas des chameaux. Ils sont faits de sable.'],
    caravaneCompagnon: { kon: ['« Ils s’en vont vers l’ouest. Suivons-les, sans courir. »'], pon: ['« Pooon… Ils sont en sable ?! Je reste derrière toi. Mais on les suit, hein. »'], chapu: ['« Chapu ! Attendez-nous ! Je veux voir où ils vont ! »'], gao: ['« Gao. Pas de mal en eux. Suivons la file. »'], fuwa: ['« Fuwaaa… Ils marchent comme s’ils rêvaient. On les suit ? »'], saya: ['« Ils attendent qu’on vienne. Suis-les le long de la crête. »'] },
    caravaneFin1: ['Au fond de la grande cuvette, à l’abri du vent, les bêtes s’arrêtent enfin. La première lève la tête vers la lune.', 'Puis le vent se lève, et le sable commence à filer.'],
    caravaneFin2: ['Il ne reste que la lune, le vent, et le vieux grelot. Dedans, quelque chose brille.', 'Demain, de grandes traces suivront de nouveau la crête. Personne ne saura jamais d’où elles viennent. Sauf toi.'],
    caravaneFinCompagnon: { kon: ['« Elles marchent depuis combien de temps, à ton avis ? …Merci de les avoir accompagnées. »'], pon: ['« Pon… Je ne dirai rien à mon oncle. Il voudrait les vendre. »'], chapu: ['« Chapu… Elles sont parties ? Elles reviendront ? »'], gao: ['« Gao. Tu as bien fait de les suivre jusqu’au bout. »'], fuwa: ['« Fuwa… C’était une belle chanson. »'], saya: ['« Le sable se souvient. Comme les arbres, mais plus vite. »'] },
    papillon: ['Un papillon, ici, en plein sable : il va d’une touffe à l’autre. Ça doit être un long voyage, pour lui.'],
    milan: ['Un milan noir tourne au-dessus de la crête, sans battre des ailes. Il profite du même vent que le parapente.'],
  },
  en: {
    noms: { centreServeuse: 'The waitress', centreCliente: 'The grandmother', kaikanCliente: 'The customer', toitPhoto: 'The photographer', liftBas: 'The chairlift attendant', liftHaut: 'The chairlift attendant', centreCaisse: 'The shopkeeper', centreClient: 'The customer', vieuxHaut: 'The old man', filleHaut: 'The young woman', chauffeur: 'The driver', garde: 'The park ranger', vendeuseR: 'The shopkeeper', vendeuseF: 'The shopkeeper', kaikan: 'The cashier', serveuse: 'The waitress', cuisinier: 'The cook', dineur: 'The customer', dineuse: 'The customer', chamelier: 'The camel driver', moniteur: 'The instructor', naturaliste: 'The naturalist', videaste: '@random_japan_place', amoureuse: 'The tourist', amoureux: 'The tourist', enfant: 'The little boy', maman: 'The mother', pilote: 'The pilot', pecheur: 'The fisherman', sculpteur: 'The sculptor', accueil: 'The host', visiteur: 'The visitor', visiteuse: 'The grandmother', galerie: 'The visitor', marcheur: 'The hiker', grimpeur: 'The climber', randonneuse: 'The walker', plagiste: 'The walker', vieux: 'The old man' },
    tampons: {
      crete: ['The Horse’s Back', 'at the very top of the great ridge, by the 馬の背 post: the view of the sea'],
      chameau: ['The camel ride', 'at the camels’ corner, just past the stairs: ask the camel driver for a ride'],
      planche: ['The sandboard', 'on the ridge, east of the top: ride down the great slope with the instructor'],
      musee: ['The Sand Museum', 'at the end of the road, in the great hall: the lectern in front of the sand Sagrada Família'],
      oasis: ['The oasis', 'at the bottom of the bowl, at the foot of the ridge: the sign by the water'],
    },
    arrivee: null,
    crete1: ['Here you are on the Horse’s Back (馬の背): 47 meters of sand, with the Sea of Japan right below.', 'Over there on the right, that islet is 海士島. Tottori Prefecture says it itself: it looks like a swimming whale.'],
    crete1Nuit: ['At night the Horse’s Back is all blue. Out at sea, tiny lights: the boats fishing for squid (いさり火).'],
    crete2: ['And the other way, at the far end of the coast: Mount Daisen, 65 kilometers off. You need very clear weather.', 'These dunes run for sixteen kilometers. The sand comes from the granite of the mountains: the river carried it down, the sea gave it back, and the wind pushed it here.'],
    crete2Nuit: ['To the west, the moon is setting over the ridge. The sand still holds a little of the day’s warmth.'],
    creteCompagnon: { kon: ['“The wind is stealing my ears… What a view, though.”'], pon: ['“Pon… All this sand and not one cake.”'], chapu: ['“Chapu! The sea! Can I roll down there?”'], gao: ['“Gao! From here I could guard the whole coast.”'], fuwa: ['“Fuwaaa… A whale, over there? I’ll say hello from home.”'], saya: ['“Not one tree here. The wind says that’s normal.”'] },
    chamelier: ['Hello! These are Bactrian camels: two humps, long wool and endless patience.', 'They’ve been on these dunes since the 1960s. Want a ride? Or wait for the evening: it’s very beautiful here too.'],
    chamelierEncore: ['Another ride? They’re happy to. Or else, the evening…'],
    chamelierQuestionNuit: ['Do you want the day to come back?'],
    chamelierNuit: ['My animals sleep at night, I swear. And yet every morning there are big tracks up there on the ridge.', 'My father said it was the caravan from the song: Tsuki no Sabaku (月の沙漠), the two travelers crossing a desert under the moon. He used to sing it while brushing the camels.'],
    chamelierTour: 'Take a ride', chamelierRien: 'No thanks', chamelierSoirChoix: 'Wait for the evening', chamelierMatinChoix: 'Wait for the morning',
    chamelierSoir: ['Sit down, evening comes fast here. And keep your eyes on the ridge…'],
    chamelierMonte: ['Climb the little stairs there. Hold on tight between the humps: he’ll rock like a boat!'],
    chameauEnRoute: ['Off we go! A camel paces: both legs on the same side together. That’s why you sway.'],
    chameauFin: ['There you are! Five minutes, around here, makes you a real traveler. He seems to like you.'],
    chameauCompagnon: { kon: ['“You looked like a queen. A slightly green queen, from the rocking.”'], pon: ['“Pon! That camel looked down on me. While chewing.”'], chapu: ['“Chapu! I walked beside you! Faster than him! Almost!”'], gao: ['“Gao. Two humps: solid. I approve.”'], fuwa: ['“Fuwa… He makes waves with his back.”'], saya: ['“He ate a blade of grass as he passed. I said nothing.”'] },
    moniteur: ['Yo! Fancy some sandboarding? From here down to the beach, against the clock!', 'Go through the six gates, red and blue: each gate you miss adds 2 seconds. Your companion sits in front. Shall we?'],
    moniteurEncore: ['Another run? The clock is waiting!'],
    moniteurRecord: 'Your record: {r} s. Can you beat it?',
    moniteurConsigneOrdi: ['To turn, use the left and right arrows (or A and D). The slope does the rest!'],
    moniteurConsigneTel: ['To turn, push the joystick left and right. The slope does the rest!'],
    chronoPartez: 'Go!', chronoPortes: 'Gates', chronoRecord: 'Record',
    plancheTemps: 'Over the walkie-talkie: “{t} seconds, and every gate!”',
    plancheTempsRate: 'Over the walkie-talkie: “{t} seconds, with a {s} s penalty for {p} missed gate(s)!”',
    plancheRecord1: '“That’s your first record. It’s just begging to fall.”',
    plancheRecord: '“New record! Now that’s riding!”',
    plancheRecordNon: '“Your record is {r} s. So close!”',
    plancheMedailleOr: '“Gold medal! Even the camels turned to look.”',
    plancheMedailleArgent: '“Silver medal. A few less turns next time…”',
    plancheMedailleBronze: '“Bronze medal. Not bad at all!”',
    plancheArretee: ['Over the walkie-talkie: “You stopped before the line! To go fast, stay on the slope.”'],
    plancheEncore: ['“Shall I take you back up for another try?”'],
    plancheRemonter: 'One more!', plancheRester: 'I’ll stay on the beach',
    plancheCompagnon: { kon: ['“My ears were flat the whole way. Again?”'], pon: ['“Pooon! I left my stomach somewhere up there.”'], chapu: ['“Chapuuu! Faster! Again!”'], gao: ['“Gao! I wasn’t scared. Not at all.”'], fuwa: ['“Fuwa! It’s like swimming, only dry!”'], saya: ['“There’s sand in my moss.”'] },
    musee: ['The Sand Museum (砂の美術館): giant sculptures made of sand and water, nothing else. Each exhibition lasts a few months, then it all goes back to sand.', 'This year, 2026: Spain, for the hundred years since Gaudí’s death. Nineteen works, twenty sculptors from fourteen countries. And here is the Sagrada Família: this one will stay unfinished too!'],
    museeCompagnon: { kon: ['“All that work, just to return to sand… I like the idea.”'], pon: ['“Pon! I sneezed earlier. Nobody saw, right?”'], chapu: ['“Chapu… I won’t shake my tail. I won’t shake my tail.”'], gao: ['“Gao! Those lions guard nothing. I’ll teach them.”'], fuwa: ['“Fuwa… Is it the dragon’s palace, the dry version?”'], saya: ['“Sand and water. All it needs is a seed.”'] },
    oasis: ['The oasis (オアシス): rain and melted snow that seeped through the sand and come out here, at the foot of the Horse’s Back.', 'It comes in late autumn and stays until spring; in the dry heat of summer it disappears. You’re in luck today.'],
    oasisNuit: ['At night the oasis keeps all the stars. Not a breath of wind here, at the foot of the ridge.'],
    oasisCompagnon: { kon: ['“Water in the middle of the sand… Like a fairy tale.”'], pon: ['“Pon! Do you think there are cakes at the bottom?”'], chapu: ['“Chapu! Chapu! I’m not saying anything. Just looking at the water. Hard.”'], gao: ['“Gao. A spring that comes and goes. Hard to guard.”'], fuwa: ['“Fuwa… It’s very small, but it’s kind.”'], saya: ['“Some green at last. Hello, little grasses.”'] },
    chauffeur: ['Last stop: the entrance to the dunes! The stairs, right across. They don’t look like much, but wait till you’re at the top.'],
    garde: ['Hello! I’m a national park ranger: I do my rounds every day.', 'On the dunes, these are forbidden: fireworks, golf, swimming, writing on the sand, taking sand away, and of course litter.', 'Writing on the sand, yes. Here, only the wind writes. See its ripples? We call them 風紋, “wind patterns”.'],
    gardeNuit: ['In the evening, nobody left… except the tracks. I’ve given up trying to understand.'],
    vendeuseR: ['Welcome to Rakudaya! Camel plushies, sand biscuits (not real sand, promise) and ice cream.'],
    vendeuseRChoix: ['A pear ice cream', 'No thanks'],
    glace: ['A pear ice cream: the Fukube orchards are just behind the hill. It melts faster than you can eat it.'],
    glaceCompagnon: { kon: ['“Something cool, at last. Thank you.”'], pon: ['“Pon! One for you, three for me.”'], chapu: ['“Chapu! It’s cold, it’s good!”'], gao: ['“Gao! A guardian’s ice cream.”'], fuwa: ['“Fuwa… It melts like foam.”'], saya: ['“It smells of orchard. I recognize some cousins.”'] },
    vendeuseF: ['Have you seen this sand in high summer? It goes over 60 degrees! Bring a hat and water, and don’t go barefoot at noon.'],
    kaikan: ['Welcome to the Sakyu Kaikan! Here we have Fukube rakkyō, little pickled onions that grow in the sand, and Sea of Japan crab in winter.', 'Try one, try one. It wakes you up!'],
    serveuseSoir: ['A table by the window? You can see the sunset from here… Would you like to stay until evening?'],
    serveuseMatin: ['Morning already? Shall I let you go?'],
    cuisinier: ['White squid from this morning, crab, rice. The sea is close: that’s why it’s good.'],
    dineur: ['I went up there in flip-flops. Never again.'],
    dineuse: ['There’s sand in my bag, in my hair and, I think, in my rice.'],
    naturaliste: ['Look around the oasis: a tiny tiger beetle, エリザハンミョウ. On these dunes it hardly lives anywhere else now.', 'The plants are tough too: those stiff tufts are コウボウムギ. The more the sand buries them, the more they grow.'],
    liftBas: ['Welcome to the chairlift! It goes up to the Sakyu Center, on top of the hill: a walk through the air, over the road and the pines.', 'Going up?'],
    liftBasOui: ['Stand on the yellow mark, I’ll open up. The chair comes from behind: it doesn’t stop, just sit down as it passes!'],
    liftHaut: ['Heading back down to the sand? This way, you have it all in front of you: the dunes, and the sea behind them.', 'Shall we?'],
    liftHautOui: ['On the yellow mark, please. Have a good ride!'],
    liftAide: 'Turn the camera: the whole view is yours.',
    liftHautCompagnon: { kon: ['“Feet in the air, and the sea at the end. Say the word and I’ll go again.”'], pon: ['“Pon! I saw the roofs of the shops! And a tiny, tiny car!”'], chapu: ['“Chapu! We flew! With no wings! Again!”'], gao: ['“Gao. It creaks, but it holds. I approve.”'], fuwa: ['“Fuwa… For once, you were the one floating.”'], saya: ['“Every chair has a number on its back. Ours was a lucky one, I’m sure of it.”'] },
    liftBasCompagnon: { kon: ['“All that sand growing under our feet… It’s like another country.”'], pon: ['“Pon! It smelled of the sea all the way! And a bit of cake. No, that was me.”'], chapu: ['“Chapu! I wanted to jump into the sand! From way up there!”'], gao: ['“Gao. The world is big, seen from a bench.”'], fuwa: ['“Fuwa… The people on the crest looked like seeds.”'], saya: ['“I said nothing the whole way. There was nothing to add.”'] },
    panneauLift: ['鳥取砂丘リフト: the dunes chairlift. From the sand to the Sakyu Center, on the hill: five minutes in the air.', '9:30 to 16:00. 300 yen one way, 500 yen return.'],
    centreServeuse: ['Welcome! A table for two, with the view? What can I bring you?'],
    menuChoix: ['The seafood bowl', 'The beef-bone chanpon', 'The crab burger and pear juice', 'Nothing, thanks'],
    menuOui: ['Coming right up! Sit over there, by the window.'],
    menuDit: [['Tuna, salmon, squid fresh from the Sea of Japan, on a bowl of rice. The sea you see from the window is on your plate too.'], ['A beef-bone broth, the way Tottori has long made it, mild and deep, full of vegetables. It warms you up after the wind on the dunes.'], ['A crab burger and a juice of Nijisseiki pear, Tottori’s own pear, clear and cool. It gets all over your fingers.']],
    repasCompagnon: { kon: ['“Are you going to finish that? I’m asking for a friend.”'], pon: ['“Pooon! My belly’s already making music.”'], chapu: ['“Chapuuu! There’s a little bit of fish left there, isn’t there?”'], gao: ['“Gao! I’ll guard your plate. Nobody touches it.”'], fuwa: ['“Fuwa! I only eat the steam. It’s delicious.”'], saya: ['“Is there seaweed in this broth? No? Too bad.”'] },
    centreCliente: ['I’m taking boxes of Inaba no Shiro-usagi back to the whole neighborhood. Otherwise I’ll hear about it until next year.'],
    kaikanCliente: ['Pickled rakkyō, crab crackers, a camel plush… I came for one thing, and look at me.'],
    toitPhoto: ['This is the best place to see Amashima islet. Its whale shape is made of lava columns: you can just make them out on the east and north.', 'When the sun drops, all the ripples in the sand come out at once. I come back every evening for that.'],
    tableToit: ['A viewpoint table (方位盤). To the north, the Sea of Japan and Amashima, the whale-shaped islet.', 'To the west, the sand and the Horse’s Back, 47 m; far behind them, Mount Daisen, the highest peak around, 65 km away.'],
    jumellesToit: ['Coin-operated binoculars. For 100 yen, 45 seconds to find six things, one after another!'],
    jumellesPiece: 'Insert a coin', jumellesAideOrdi: 'Aim: the arrows. Keep the thing in the middle for a moment!', jumellesAideTel: 'Aim: the joystick. Keep the thing in the middle for a moment!',
    jumellesCibles: { sommet: 'the Horse’s Back post', gare: 'the clock of the lower station', parapente: 'the purple paraglider', baleine: 'the whale islet', musee: 'the museum’s big roof', daisen: 'Mount Daisen, far away' },
    jumellesToutes: 'Clack! All six, in {t} seconds!', jumellesFin: 'Clack! Time’s up: {n} out of 6.',
    jumellesRecord1: 'That’s your first record. There’s room to do better.', jumellesRecord: 'Your best score!', jumellesRecordNon: 'Your record is still {rn} out of 6, in {rt} s.', jumellesRecordAff: 'Your record: {rn} out of 6, in {rt} s.',
    jumellesCompagnon: { kon: ['“You’ve got good eyes. Almost as good as a fox’s.”'], pon: ['“Pooon! All I saw was the burger, downstairs.”'], chapu: ['“Chapu! And the whale, did it see us?”'], gao: ['“Gao! Nothing gets past me either, on my roof.”'], fuwa: ['“Fuwa! From up there I see all that without binoculars.”'], saya: ['“Where the sea ends, is that where it stops?”'] },
    jumellesHaut: ['A pair of binoculars, aimed at the sea.'],
    jumellesHautVue: ['The Horse’s Back, far away: tiny people in a line along the crest. And behind them, the whole Sea of Japan.'],
    jumellesHautNuit: ['Too dark to see anything. Only the moon, above the sand.'],
    centreCaisse: ['Welcome to the Sakyu Center! Here it’s mostly sweets and souvenirs from Tottori.', 'And next door, the restaurant: the seafood bowl, the beef-bone chanpon, the crab burger with a Nijisseiki pear juice!'],
    centreClient: ['A beef-bone chanpon, with this view… I’m not leaving just yet. Go see the waitress over there, she’ll find you a table.'],
    vieuxHaut: ['I come here every year. From below, they’re mountains of sand; from here, you finally see the pattern.', 'And that’s only a piece of it: the sand runs for sixteen kilometers along the coast.'],
    filleHaut: ['See those little dots on the crest? They’re people! I counted them until my eyes stung.', 'Go up to the roof by the stairs: there are coin-operated binoculars, and a little game. I only found four things out of six!'],
    videaste: ['Hi! I’m filming this place for my channel. Want to see how it looks from the sky?'],
    amoureuse: ['He told me: “It’s not far, I swear.” That was an hour ago.'],
    amoureux: ['Just look at this view! …Yes, yes, it was a bit further than planned.'],
    enfant: ['I built a castle! The wind already took it. It’s fast, the wind.'],
    maman: ['He’s got sand everywhere. So have I. But he’s so happy!'],
    pilote: ['The purple paraglider up there? That’s my student. The sea wind climbs this slope on its own: you take off on foot, no engine.'],
    pecheur: ['Fine sand, a strong pull: you have to cast far. Nobody swims here, you know: it’s forbidden, and it’s dangerous.'],
    pecheurNuit: ['At night I watch the boats’ lights. And sometimes the ridge up there, against the moon… No, nothing. I must be tired.'],
    sculpteur: ['I’m making a little camel for fun, until the next exhibition. Sand holds with a little water, packed tight, very tight.', 'You start at the top and work down: no going back, with sand.'],
    accueil: ['Welcome to the Sand Museum! The tour starts here. The stairs on the right go up to the gallery: you can see everything from there.'],
    visiteur: ['The Alhambra, in sand! Look at those arches. And nobody’s allowed to sneeze.'],
    visiteuse: ['They destroy them at the end, you know. That’s what I like. You come, and then you remember.'],
    galerie: ['You can see the towers well from here. Every little slit is cut by hand, with a trowel.'],
    marcheur: ['I’m heading down to the oasis. The hard part isn’t going down, it’s knowing you’ll have to come back up.'],
    grimpeur: ['One step forward, half a step back: that’s sand. But what a view up there!'],
    randonneuse: ['See my tracks? In ten minutes the wind will have wiped them. Better than a slate.'],
    plagiste: ['Look at those little crabs: they scuttle sideways and hop, into their hole. Try catching one… You’ll see.'],
    vieux: ['When I was little, these dunes moved more than today: a lot was planted after the war. Since 1991 people pull the grass up by hand, to give them back their sand.'],
    entree: ['“鳥取砂丘 — The Tottori Sand Dunes. Natural monument, San’in Kaigan National Park.”', 'At the top of the stairs, you’ll see: everything opens up at once.'],
    mer: ['The Sea of Japan.'], merNuit: ['The Sea of Japan, at night.'],
    arishima: ['A big stone, a poem by Arishima Takeo, who came here in 1923: “浜坂の遠き砂丘のなかにしてさびしき我を見出でけるかも”.', '“Far off, in the dunes of Hamasaka, I found myself, all alone.”'],
    traces: ['Big two-lobed tracks following the ridge. Camel tracks!', 'But the camel driver never comes up here: his animals stay below. They head west, and they’re quite fresh.'],
    tracesCompagnon: { kon: ['“It doesn’t smell of camel. It smells of… sand. Strange.”'], pon: ['“Pon? A camel out walking alone? We should follow it, no?”'], chapu: ['“Chapu! Big feet! I’ll put my paws in them!”'], gao: ['“Gao. Five animals, in single file. They don’t walk by day.”'], fuwa: ['“Fuwa… These tracks smell of the night.”'], saya: ['“The wind wipes them, and they come back. We should see this at night.”'] },
    grelot: ['At the bottom of the great bowl, half buried: an old bronze bell, full of sand.', 'The tracks stop here. Not one leads back out.'],
    grelotCompagnon: { kon: ['“They come down and never go back up. Return at night, and we’ll see.”'], pon: ['“Pon… I don’t like a bell all by itself. Shall we come back with the moon?”'], chapu: ['“Chapu? Where did they go? Let’s come back tonight!”'], gao: ['“Gao. What passes at night, you watch for at night.”'], fuwa: ['“Fuwa… It still rings a little, can you hear? In the evening, maybe…”'], saya: ['“It looks very old. I think it’s waiting for the night.”'] },
    nuitCompagnon: { kon: ['“Listen… Bells. Up there on the ridge, toward the moon.”'], pon: ['“Pon! Do you hear? Something’s jingling up on the Horse’s Back!”'], chapu: ['“Chapu! Bells! Up there! Shall we go?”'], gao: ['“Gao… Something is walking on the ridge.”'], fuwa: ['“Fuwa… There’s a song up there. A song of bells.”'], saya: ['“The sand is moving on the ridge. By itself. And it jingles.”'] },
    caravaneVue: ['On the ridge, before the huge moon: a line of camels. Five animals, no rider, no guide. Their bells ring in the wind.', 'Their flanks smoke gently. These aren’t camels. They’re made of sand.'],
    caravaneCompagnon: { kon: ['“They’re heading west. Let’s follow them, without running.”'], pon: ['“Pooon… They’re made of sand?! I’ll stay behind you. But we’re following, right?”'], chapu: ['“Chapu! Wait for us! I want to see where they go!”'], gao: ['“Gao. No harm in them. Follow the line.”'], fuwa: ['“Fuwaaa… They walk as if dreaming. Shall we follow?”'], saya: ['“They’re waiting for us. Follow them along the ridge.”'] },
    caravaneFin1: ['At the bottom of the great bowl, out of the wind, the animals finally stop. The first one lifts its head to the moon.', 'Then the wind rises, and the sand begins to stream away.'],
    caravaneFin2: ['Only the moon, the wind and the old bell remain. Something is shining inside it.', 'Tomorrow, big tracks will follow the ridge again. Nobody will ever know where they come from. Except you.'],
    caravaneFinCompagnon: { kon: ['“How long have they been walking, do you think? …Thank you for going with them.”'], pon: ['“Pon… I won’t tell my uncle. He’d want to sell them.”'], chapu: ['“Chapu… Are they gone? Will they come back?”'], gao: ['“Gao. You did well to follow them to the end.”'], fuwa: ['“Fuwa… That was a lovely song.”'], saya: ['“Sand remembers. Like trees, only faster.”'] },
    papillon: ['A butterfly, here in the sand: going from tuft to tuft. That must be a long journey for it.'],
    milan: ['A black kite circles over the ridge without a wingbeat. It’s using the same wind as the paraglider.'],
  },
  ja: {
    noms: { centreServeuse: 'おみせの　人', centreCliente: 'おばあさん', kaikanCliente: 'おきゃくさん', toitPhoto: 'カメラの　人', liftBas: 'リフトの　かかりいん', liftHaut: 'リフトの　かかりいん', centreCaisse: 'おみせの　人', centreClient: 'おきゃくさん', vieuxHaut: 'おじいさん', filleHaut: 'おねえさん', chauffeur: 'うんてんしゅ', garde: 'こうえんの　レンジャー', vendeuseR: 'お店の人', vendeuseF: 'お店の人', kaikan: 'レジの　おばさん', serveuse: 'ウェイトレス', cuisinier: '料理人', dineur: 'お客さん', dineuse: 'お客さん', chamelier: 'らくだつかい', moniteur: 'インストラクター', naturaliste: 'しぜんの　けんきゅう者', videaste: '@random_japan_place', amoureuse: 'かんこうきゃく', amoureux: 'かんこうきゃく', enfant: '男の子', maman: 'お母さん', pilote: 'パイロット', pecheur: 'つり人', sculpteur: 'ちょうこく家', accueil: 'うけつけの人', visiteur: 'お客さん', visiteuse: 'おばあさん', galerie: 'お客さん', marcheur: 'ハイカー', grimpeur: 'のぼる人', randonneuse: 'さんぽの人', plagiste: 'さんぽの人', vieux: 'おじいさん' },
    tampons: {
      crete: ['馬の背', '大きな　すなの　尾根の　てっぺん、「馬の背」の　くいで：海の　ながめ'],
      chameau: ['らくだに　のる', '階段の　すぐ先の　らくだの　ところ：らくだつかいに　たのもう'],
      planche: ['サンドボード', '尾根の上、てっぺんの　東：インストラクターと　大きな　坂を　すべろう'],
      musee: ['砂の美術館', '道の　おくの　大きな　ホール：砂の　サグラダ・ファミリアの　前の　台'],
      oasis: ['オアシス', 'くぼ地の　そこ、尾根の　ふもと：水べの　立てふだ'],
    },
    arrivee: null,
    crete1: ['ここが　馬の背。47メートルの　すなの　山で、すぐ下は　日本海！', '右の　あの島は　海士島。鳥取県も　こう言っているよ。「まるで　クジラが　泳いでいるよう」。'],
    crete1Nuit: ['夜の　馬の背は　まっさお。海の上に　小さな光。イカつり船の　いさり火だ。'],
    crete2: ['反対の　ずっと　むこうには、65キロ先の　大山。とても　はれた日だけ　見えるんだ。', 'この砂丘は　長さ16キロ。すなは　山の　花こう岩から　できて、川が　はこび、海が　かえし、風が　ここまで　おしてきたんだ。'],
    crete2Nuit: ['西の　尾根に　月が　しずんでいく。すなには　まだ　昼の　あたたかさが　のこっている。'],
    creteCompagnon: { kon: ['「風で　耳が　とばされそう……でも　すごい　ながめだね」'], pon: ['「ポン……こんなに　すなが　あるのに　おかしは　ひとつも　ない」'], chapu: ['「チャプ！　海だ！　ころがって　いっていい？」'], gao: ['「ガオ！　ここなら　海ぜんぶを　まもれるぞ」'], fuwa: ['「フワァ……あそこに　クジラ？　うちから　あいさつ　しておくね」'], saya: ['「木が　一本も　ない。風は　それで　いいって」'] },
    chamelier: ['こんにちは！　これは　フタコブラクダ。コブが　二つ、長い毛、そして　すごく　しんぼうづよいんだ。', '1960年代から　この砂丘に　いるんだよ。のってみるかい？　それとも　夕方まで　まつかい？　それも　きれいだよ。'],
    chamelierEncore: ['もう一回　のるかい？　それとも　夕方を　まつかい……'],
    chamelierQuestionNuit: ['朝を　まつかい？'],
    chamelierNuit: ['うちの　らくだは　夜は　ねている。ほんとうだよ。でも　毎朝、尾根に　大きな　足あとが　あるんだ。', 'おやじは　言っていた。あれは　「月の沙漠」の　キャラバンだって。月の下、さばくを　わたる　二人の　旅人の　歌さ。らくだを　ブラシしながら　よく　うたっていたよ。'],
    chamelierTour: 'のってみる', chamelierRien: 'けっこうです', chamelierSoirChoix: '夕方を　まつ', chamelierMatinChoix: '朝を　まつ',
    chamelierSoir: ['すわって。ここの　夕方は　すぐ　くるよ。尾根を　よく　見ていてごらん……'],
    chamelierMonte: ['そこの　小さな　階段から　のって。コブの　あいだに　しっかり　つかまって。船みたいに　ゆれるよ！'],
    chameauEnRoute: ['しゅっぱつ！　らくだは　同じがわの　足を　いっしょに　出して　歩くんだ。だから　ゆれるんだよ。'],
    chameauFin: ['はい、おつかれさま！　5分で　りっぱな　旅人だ。きみが　気に入ったみたいだよ。'],
    chameauCompagnon: { kon: ['「女王さまみたいだったよ。ちょっと　よってたけど」'], pon: ['「ポン！　あの　らくだ、もぐもぐしながら　ぼくを　見下ろした！」'], chapu: ['「チャプ！　ぼく、となりを　歩いたよ！　はやかった！　たぶん！」'], gao: ['「ガオ。コブ二つ。がっしりしていて　よい」'], fuwa: ['「フワ……せなかで　波を　作ってる」'], saya: ['「草を　ひとくち　たべていった。だまっておいたよ」'] },
    moniteur: ['よっ！　サンドボード、やってみる？　ここから　はままで、タイムアタックだ！', '赤と青の　六つの　ゲートを　通ってね。のがすと　1つにつき　2びょう　プラス。友だちは　前に　すわるよ。行く？'],
    moniteurEncore: ['もう一回？　ストップウォッチが　まってるよ！'],
    moniteurRecord: 'きみの　きろくは　{r}びょう。ぬけるかな？',
    moniteurConsigneOrdi: ['曲がるには　左右の　矢印キー（A・D）。あとは　坂が　やってくれる！'],
    moniteurConsigneTel: ['曲がるには　ジョイスティックを　左右に。あとは　坂が　やってくれる！'],
    chronoPartez: 'スタート！', chronoPortes: 'ゲート', chronoRecord: 'きろく',
    plancheTemps: 'トランシーバーから：「{t}びょう！　ゲートも　ぜんぶ　クリア！」',
    plancheTempsRate: 'トランシーバーから：「{t}びょう！　{p}つ　のがして　{s}びょう　プラスだ」',
    plancheRecord1: '「これが　最初の　きろく。すぐ　ぬけるよ」',
    plancheRecord: '「新きろく！　いい　すべりだ！」',
    plancheRecordNon: '「きろくは　{r}びょう。おしい！」',
    plancheMedailleOr: '「金メダル！　らくだも　ふりかえったぞ」',
    plancheMedailleArgent: '「銀メダル。もう少し　まっすぐ……」',
    plancheMedailleBronze: '「銅メダル。なかなか　やるね！」',
    plancheArretee: ['トランシーバーから：「ゴールの　前で　止まっちゃった！　はやく　すべるには、坂の　まん中を　ねらって」'],
    plancheEncore: ['「上まで　つれていこうか？　もう一回！」'],
    plancheRemonter: 'もう一回！', plancheRester: 'はまに　のこる',
    plancheCompagnon: { kon: ['「耳が　ずっと　ぺたんこだった。もう一回？」'], pon: ['「ポーン！　おなかを　上に　おいてきた」'], chapu: ['「チャプー！　もっと　はやく！　もう一回！」'], gao: ['「ガオ！　こわくなかったぞ。ぜんぜん」'], fuwa: ['「フワ！　かわいた　およぎみたい！」'], saya: ['「こけの中まで　すなが　はいった」'] },
    musee: ['砂の美術館。砂と　水だけで　作った　大きな　像が　ならんでいるよ。てんじが　おわると、ぜんぶ　砂に　もどるんだ。', '2026年は　スペイン。ガウディの　ぼつご100年。14か国、20人の　彫刻家の　19の　作品。そして　これが　サグラダ・ファミリア。これも　やっぱり　みかんせい！'],
    museeCompagnon: { kon: ['「あんなに　がんばって、砂に　もどるなんて……いいね」'], pon: ['「ポン！　さっき　くしゃみ　しちゃった。だれも　見てないよね？」'], chapu: ['「チャプ……しっぽ、ふらない。しっぽ、ふらない」'], gao: ['「ガオ！　あのライオンは　なにも　まもっていない。おしえてやる」'], fuwa: ['「フワ……かわいた　竜宮城？」'], saya: ['「砂と　水。あとは　たねが　あればね」'] },
    oasis: ['オアシス。雨や　とけた雪が　砂を　通って、馬の背の　ふもとに　わき出した水だよ。', '秋の　おわりから　春まで。夏の　かんそうで　きえてしまう。今日は　ラッキーだね。'],
    oasisNuit: ['夜の　オアシスは　星を　ぜんぶ　うつしている。尾根の　ふもとは　風も　ない。'],
    oasisCompagnon: { kon: ['「砂の中に　水……おとぎばなしみたい」'], pon: ['「ポン！　そこに　おかし　あるかな？」'], chapu: ['「チャプ！　チャプ！　なにも　言わない。水を　見てるだけ。じーっと」'], gao: ['「ガオ。来たり　きえたりする　泉か。まもりにくい」'], fuwa: ['「フワ……小さいけど　やさしい水」'], saya: ['「やっと　みどり。こんにちは、小さな　草たち」'] },
    chauffeur: ['しゅうてん、砂丘入口！　むかいの　階段だよ。上まで　行けば　わかるさ。'],
    garde: ['こんにちは！　国立公園の　レンジャーです。毎日　見回りを　しています。', '砂丘では　花火、ゴルフ、およぎ、砂に　落書き、砂を　もちかえること、ゴミすてが　きんしです。', '落書きは　ダメ。ここで　書くのは　風だけ。この　もようを　風紋と　いうんだよ。'],
    gardeNuit: ['夜は　だれも　いない……足あとの　ほかはね。もう　考えないことにしたよ。'],
    vendeuseR: ['らくだやへ　ようこそ！　らくだの　ぬいぐるみ、砂の　クッキー（本物の砂じゃないよ）、アイスも　あるよ。'],
    vendeuseRChoix: ['なしの　アイス', 'けっこうです'],
    glace: ['なしの　アイス。福部の　なし畑は　丘の　すぐ　うしろ。食べるより　はやく　とけていく！'],
    glaceCompagnon: { kon: ['「やっと　すずしい。ありがとう」'], pon: ['「ポン！　きみに　一つ、ぼくに　三つ」'], chapu: ['「チャプ！　つめたくて　おいしい！」'], gao: ['「ガオ！　まもり神の　アイスだ」'], fuwa: ['「フワ……あわみたいに　とける」'], saya: ['「くだもの畑の　におい。しんせきが　いるみたい」'] },
    vendeuseF: ['真夏の　砂、知ってる？　60度を　こえるんだよ！　ぼうしと　水を　もって、昼に　はだしは　ダメだよ。'],
    kaikan: ['砂丘会館へ　ようこそ！　砂で　そだつ　福部の　らっきょうに、冬は　日本海の　カニ。', '食べてごらん。目が　さめるよ！'],
    serveuseSoir: ['まどの　そばの　席に　する？　夕日が　見えるよ。夕方まで　いる？'],
    serveuseMatin: ['もう　朝？　お見おくり　しようか？'],
    cuisinier: ['けさの　白イカ、カニ、ごはん。海が　近いから　おいしいんだ。'],
    dineur: ['ビーチサンダルで　のぼったよ。もう　やらない。'],
    dineuse: ['カバンにも　かみにも、たぶん　ごはんにも　砂が　はいってる。'],
    naturaliste: ['オアシスの　まわりを　見て。小さな　エリザハンミョウが　いるよ。この砂丘では　ほとんど　ここにしか　いないんだ。', 'かたい　草は　コウボウムギ。砂に　うまるほど　のびるの。つよいでしょ。'],
    liftBas: ['リフトへ　ようこそ！　おかの上の　砂丘センターまで　行くよ。道路と　松の　上を　通る、空中さんぽだ。', '乗っていく？'],
    liftBasOui: ['黄色い　しるしの上に　立ってね。いま　あけるよ。いすは　うしろから　来て　止まらないから、そのまま　すわって！'],
    liftHaut: ['砂の方へ　下りる？　下りは　ぜんぶ　前に　見えるよ。砂丘も、その先の　海も。', '乗っていく？'],
    liftHautOui: ['黄色い　しるしの上に　どうぞ。いってらっしゃい！'],
    liftAide: 'カメラを　回してみよう。けしきは　ぜんぶ　きみのもの。',
    liftHautCompagnon: { kon: ['「足の下は　からっぽ、その先に　海。また　乗りたいな」'], pon: ['「ポン！　お店の　屋根が　見えた！　ちっちゃい　車も！」'], chapu: ['「チャプ！　とんだ！　はねも　ないのに！　もう一回！」'], gao: ['「ガオ。ギシギシいうが、じょうぶだ。よし」'], fuwa: ['「フワ……　今日は　きみが　うかんでたね」'], saya: ['「いすの　せなかに　番号が　あるの。わたしたちのは　きっと　えんぎがいいわ」'] },
    liftBasCompagnon: { kon: ['「足の下で　砂が　どんどん　広がって……　べつの国みたいだったね」'], pon: ['「ポン！　ずっと　海の　においが　した！　あと　おかしも。あ、それは　ぼくか」'], chapu: ['「チャプ！　あの上から　砂に　とびこみたかった！」'], gao: ['「ガオ。ベンチから　見ても、世界は　広いな」'], fuwa: ['「フワ……　尾根の　人たちが　たねみたいだった」'], saya: ['「ずっと　だまってたの。なにも　言うことが　なかったから」'] },
    panneauLift: ['鳥取砂丘リフト。砂丘から　おかの上の　砂丘センターまで、空中さんぽ　5分。', '9時30分から　16時まで。片道300円、往復500円。'],
    centreServeuse: ['いらっしゃいませ！　ながめの　いい　お席へ　どうぞ。なにに　しますか？'],
    menuChoix: ['海鮮丼', '牛骨ちゃんぽん', 'かにバーガーと　梨ジュース', 'けっこうです'],
    menuOui: ['はーい！　まどぎわの　お席で　まっててね。'],
    menuDit: [['まぐろ、サーモン、いか。日本海の　めぐみが　ごはんの上に。まどから　見える　海が、おさらの中にも。'], ['むかしから　鳥取で　親しまれる　牛骨スープ。やさしくて　ふかい　味。砂丘の　風のあとに　あたたまる。'], ['かにの　バーガーと、鳥取の　二十世紀梨の　ジュース。すっきり　つめたい。ゆびまで　べたべた。']],
    repasCompagnon: { kon: ['「それ、のこす？　いや、友だちに　聞いてるだけ」'], pon: ['「ポーン！　おなかが　もう　音楽を　かなでてる」'], chapu: ['「チャプー！　そこに　おさかな、のこってない？」'], gao: ['「ガオ！　おさらは　ぼくが　まもる。だれにも　さわらせない」'], fuwa: ['「フワ！　ぼくは　ゆげだけ　たべる。おいしいよ」'], saya: ['「この　スープ、こんぶ　入ってる？　ない？　ざんねん」'] },
    centreCliente: ['町じゅうに　因幡の白うさぎを　買って　帰るの。でないと　来年まで　言われるからね。'],
    kaikanCliente: ['らっきょう、かにせんべい、らくだの　ぬいぐるみ……一つだけの　つもりで　来たのに。'],
    toitPhoto: ['海士島が　いちばん　よく　見えるのは　ここ。くじらの　形は　溶岩の　柱なんだ。東と　北に　少し　見えるよ。', '日が　かたむくと、砂の　もようが　いっせいに　うかびあがる。それを　見に、毎晩　来るんだ。'],
    tableToit: ['方位盤。北は　日本海と　海士島。くじらの　形の　島。', '西は　砂丘と　馬の背、47メートル。ずっと　向こうに　大山。65キロ　先。'],
    jumellesToit: ['コインで　見る　そうがんきょう。100円で　45びょう。六つの　ものを　つぎつぎ　さがそう！'],
    jumellesPiece: 'コインを　入れる', jumellesAideOrdi: 'ねらう：矢印キー。まん中に　少し　とめて！', jumellesAideTel: 'ねらう：ジョイスティック。まん中に　少し　とめて！',
    jumellesCibles: { sommet: '馬の背の　くい', gare: '下の　駅の　とけい', parapente: 'むらさきの　パラグライダー', baleine: 'くじらの　島', musee: '美術館の　大きな　やね', daisen: 'とおくの　大山' },
    jumellesToutes: 'カシャン！　六つ　ぜんぶ、{t}びょう！', jumellesFin: 'カシャン！　時間切れ。{n}こ　見つけた。',
    jumellesRecord1: 'はじめての　きろく。まだまだ　のびるよ。', jumellesRecord: 'さいこう　きろく！', jumellesRecordNon: 'きろくは　{rn}こ、{rt}びょう。', jumellesRecordAff: 'きみの　きろく：{rn}こ、{rt}びょう。',
    jumellesCompagnon: { kon: ['「いい目だね。きつねの　次くらいに」'], pon: ['「ポーン！　ぼくは　下の　バーガーしか　見えなかった」'], chapu: ['「チャプ！　くじらは　こっち　見てた？」'], gao: ['「ガオ！　ぼくも　やねの上から　見のがさないぞ」'], fuwa: ['「フワ！　ぼくなら　そうがんきょう　いらない」'], saya: ['「海の　はしっこって、どこで　おわるの？」'] },
    jumellesHaut: ['海の方を　向いた　そうがんきょう。'],
    jumellesHautVue: ['ずっと　向こうに　馬の背。小さな　人たちが　尾根に　ならんでいる。その　向こうは、日本海。'],
    jumellesHautNuit: ['暗くて　なにも　見えない。砂の上に、月だけ。'],
    centreCaisse: ['砂丘センターへ　ようこそ！　おかしと　鳥取の　おみやげが　たくさん　あるよ。', 'となりは　レストラン。海鮮彩り丼、牛骨ちゃんぽん、かにバーガーに　二十世紀梨の　ジュース！'],
    centreClient: ['牛骨ちゃんぽんを　食べながら、この　ながめ。まだ　帰れないなあ。あそこの　店員さんに　言えば、お席を　用意してくれるよ。'],
    vieuxHaut: ['毎年　ここに　来るんだ。下から　見れば　砂の山、ここから　見れば　もようが　わかる。', 'それも　ほんの　一部。砂丘は　海岸に　そって　16キロも　つづくんだよ。'],
    filleHaut: ['尾根の　小さな　点、見える？　あれ、ぜんぶ　人なんだよ！　数えてたら　目が　いたくなっちゃった。', 'かいだんで　やねに　上がると、コインの　そうがんきょうが　あるよ。ゲームも　できる。わたしは　六つのうち　四つだけ！'],
    videaste: ['やあ！　チャンネル用に　この場所を　とっているんだ。空から　どう見えるか　見てみる？'],
    amoureuse: ['「すぐそこだよ」って　言ったの。一時間まえに。'],
    amoureux: ['この　ながめ　見て！　……うん、ちょっと　遠かったね。'],
    enfant: ['お城　作ったんだ！　もう　風が　もっていった。はやいんだ、風。'],
    maman: ['砂だらけ。私もよ。でも　すごく　うれしそう！'],
    pilote: ['あの　むらさきの　パラグライダー？　ぼくの　生徒だよ。海の風が　この坂を　のぼるから、エンジンなしで　とべるんだ。'],
    pecheur: ['細かい砂に　強い波。遠くへ　なげないとね。ここは　およげないよ。きんしだし、あぶないんだ。'],
    pecheurNuit: ['夜は　船の　あかりを　見ているんだ。ときどき　月の前の　尾根も……いや、なんでもない。つかれたかな。'],
    sculpteur: ['つぎの　てんじまで、あそびで　小さな　らくだを　作っているんだ。砂は　水を　少し　まぜて、ぎゅっと　かためる。', '上から　下へ　けずるんだ。砂は　やりなおしが　きかないからね。'],
    accueil: ['砂の美術館へ　ようこそ！　ここから　見学です。右の　階段を　のぼると　ギャラリー。上から　ぜんぶ　見えますよ。'],
    visiteur: ['砂の　アルハンブラ！　この　アーチを　見て。くしゃみは　きんしだね。'],
    visiteuse: ['さいごは　こわすのよ。そこが　いいの。見て、おぼえておくの。'],
    galerie: ['ここから　塔が　よく見えるよ。細い　みぞは　ぜんぶ　手で　けずったんだって。'],
    marcheur: ['オアシスまで　おりるんだ。大変なのは　おりることじゃなくて、また　のぼること。'],
    grimpeur: ['一歩　のぼって　半歩　さがる。それが　砂さ。でも　上の　ながめは　さいこう！'],
    randonneuse: ['私の　足あと、見た？　10分で　風が　けしちゃうの。黒板より　いいでしょ。'],
    plagiste: ['小さな　カニを　見て。よこに　走って、ぴゅっと　あなへ。つかまえてごらん……'],
    vieux: ['子どものころ、砂丘は　今より　うごいていた。戦後に　たくさん　木を　うえてね。1991年からは　みんなで　草を　ぬいて、砂に　もどしているんだ。'],
    entree: ['「鳥取砂丘。天然記念物、山陰海岸国立公園」', '階段の　上に　行けば、いっきに　ひらけるよ。'],
    mer: ['日本海。'], merNuit: ['夜の　日本海。'],
    arishima: ['大きな石に　有島武郎の　うた。1923年に　ここへ　来た人だよ。「浜坂の遠き砂丘のなかにしてさびしき我を見出でけるかも」'],
    traces: ['尾根に　そって　二つに　わかれた　大きな　足あと。らくだの　足あとだ！', 'でも　らくだつかいは　ここまで　来ない。足あとは　西へ。しかも　まだ　新しい。'],
    tracesCompagnon: { kon: ['「らくだの　においじゃない。砂の　におい……ふしぎだ」'], pon: ['「ポン？　らくだが　ひとりで　さんぽ？　ついていこうよ」'], chapu: ['「チャプ！　大きな足！　ぼくの足を　入れちゃう！」'], gao: ['「ガオ。五ひき、一列。昼は　歩かない」'], fuwa: ['「フワ……夜の　においが　するよ」'], saya: ['「風が　けして、また　あらわれる。夜に　見に来なくちゃ」'] },
    grelot: ['大きな　くぼ地の　そこに、半分　うまった　古い　青銅の　すず。中は　砂だらけ。', '足あとは　ここで　おわり。もどる　足あとは　ひとつも　ない。'],
    grelotCompagnon: { kon: ['「おりてきて、のぼっていない。夜に　また　来よう」'], pon: ['「ポン……ひとりぼっちの　すずは　いやだな。月と　いっしょに　来ようよ」'], chapu: ['「チャプ？　どこへ　行ったの？　今夜　また　来よう！」'], gao: ['「ガオ。夜に　通るものは　夜に　まつのだ」'], fuwa: ['「フワ……まだ　少し　なってる。夕方に　なったら……」'], saya: ['「とても　古いね。夜を　まっているみたい」'] },
    nuitCompagnon: { kon: ['「聞いて……すずの音。尾根の上、月の　ほうだ」'], pon: ['「ポン！　聞こえる？　馬の背で　チリンチリンって！」'], chapu: ['「チャプ！　すず！　上の方！　行こう！」'], gao: ['「ガオ……尾根を　なにかが　歩いている」'], fuwa: ['「フワ……上で　うたってる。すずの　うた」'], saya: ['「尾根の　砂が　うごいてる。ひとりでに。すずの音も」'] },
    caravaneVue: ['尾根の上、大きな　月の前を　らくだの　列が　行く。五ひき、のる人も　ひく人も　いない。すずが　風に　なっている。', 'わき腹から　けむりのように　砂が　まう。らくだじゃない。砂で　できているんだ。'],
    caravaneCompagnon: { kon: ['「西へ　行くよ。走らずに、ついていこう」'], pon: ['「ポーン……砂で　できてる!?　きみの　うしろに　いるよ。でも　ついていくんだよね」'], chapu: ['「チャプ！　まって！　どこへ　行くのか　見たい！」'], gao: ['「ガオ。わるいものでは　ない。列に　ついていこう」'], fuwa: ['「フワァ……ゆめの中を　歩いてるみたい。行く？」'], saya: ['「まっていてくれるよ。尾根に　そって　ついていって」'] },
    caravaneFin1: ['大きな　くぼ地の　そこ、風の　こない　ところで、らくだたちは　とまった。先頭の　らくだが　月を　見上げる。', 'そして　風が　おこり、砂が　ながれはじめた。'],
    caravaneFin2: ['のこったのは　月と　風と　古い　すずだけ。中で　なにかが　光っている。', 'あしたも　大きな　足あとが　尾根を　行くだろう。どこから　来るのか　だれも　知らない。きみの　ほかは。'],
    caravaneFinCompagnon: { kon: ['「どれくらい　歩いてきたんだろう。……いっしょに　行ってくれて　ありがとう」'], pon: ['「ポン……おじさんには　言わない。売ろうとするから」'], chapu: ['「チャプ……行っちゃった？　また　来る？」'], gao: ['「ガオ。さいごまで　よく　ついていった」'], fuwa: ['「フワ……きれいな　うただった」'], saya: ['「砂も　おぼえているよ。木と　同じ。でも　もっと　はやく」'] },
    papillon: ['砂の中に　チョウ。草から　草へ。長い　旅だね。'],
    milan: ['トビが　はばたかずに　尾根の上を　まわっている。パラグライダーと　同じ　風だね。'],
  },
};
for (const L of Object.values(TEXTES)) delete L.arrivee;
