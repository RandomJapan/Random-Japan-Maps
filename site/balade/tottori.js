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
const BORD_ROUTE = [[213, ROUTE.z0], [250, ROUTE.z0], [250, 80], [236, 80], [236, 130], [213, 130]];
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
  if (x > 249.9 && x <= SALLE.x0 + 0.01 && z > SALLE.porte.z0 && z < SALLE.porte.z1) return true;
  if (x > MUSEE_D.x0 && x < MUSEE_D.x1 && z > MUSEE_D.z0 && z < MUSEE_D.z1) return true;
  // en haut : la terrasse, la gare (sa porte sur la terrasse), la salle du Sakyu Center (sa porte sur la terrasse)
  if (x > TERRASSE.x0 + 0.3 && x < TERRASSE.x1 && z > TERRASSE.z0 + 0.3 && z < TERRASSE.z1) return true;
  if (x > GARE_H.x0 && x < GARE_H.x1 && z >= TERRASSE.z1 - 0.01 && z < GARE_H.z1) return true;
  if (x > CENTRE.x0 && x < CENTRE.x1 && z > CENTRE.z0 && z < CENTRE.z1) return true;
  if (x > TERRASSE.x1 - 0.1 && x <= CENTRE.x0 + 0.01 && z > CENTRE.porte.z0 && z < CENTRE.porte.z1) return true;
  return x > 235.9 && x <= MUSEE_D.x0 + 0.01 && z > MUSEE_D.porte.z0 && z < MUSEE_D.porte.z1;
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
  // la route, le parking, le trottoir, les dalles : plus loin
  if (x > 212.6 && x < 252 && z > ROUTE.z0 - 60 && z < ROUTE.z1 + 60) {
    if (x > ROUTE.x0 - 0.05 && x < ROUTE.x1 + 0.05) return [bruitDoux(x, z, 3) > 0.5 ? '#5c5b59' : '#555453', M.route];
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
    for (const [u, v, w] of d) {
      const v2 = v * cx - w * sx, w2 = v * sx + w * cx, u3 = u * cy + w2 * sy, w3 = -u * sy + w2 * cy;
      a.fut([x, y, z], [x + u3 * s, y + v2 * s, z + w3 * s], 0.42 * s, 0.2 * s, c, 5, { teinte: (px, py) => (py < 0.55 ? '#5f6a60' : c) });
    }
  };
  for (const [x0, sens] of [[-238, -1], [226, 1]]) {
    for (let z = -124; z > -212; z -= 1.75) {
      const a = morceau(x0 + sens * 3, z), g = hasard(z, x0), sol = Math.max(-0.6, terrain(x0 + sens * 3, z));
      const fin = z < -196 ? 0.75 : 1;
      bloc(a, x0 + sens * (1.62 + 0.15 * g), sol + 0.55, z, 1.22 * fin, g);
      bloc(a, x0 + sens * (4.4 - 0.3 * g), sol + 0.55, z - 0.7, 1.22 * fin, hasard(g, z));
      if (z < -135 && z > -205 && Math.round(-z / 1.75) % 2 === 0) bloc(a, x0 + sens * 3.15, sol + 1.75, z - 0.35, 1.1, hasard(z, g));
    }
  }
  // les brise-lames au large, à l'est (de longs tas sombres : le vrai en a deux, devant la côte)
  { const a = morceau(400, -240, 200); for (const [x0, x1] of [[300, 420], [490, 620]]) for (let x = x0; x < x1; x += 3.4) a.ovale(2.4, hasard(x, 3) > 0.5 ? '#6e7068' : '#62645c', { x, y: 0.25, z: -232 + 2 * Math.sin(x * 0.03), sx: 1.5, sy: 0.95, sz: 1.5, trait: false }, 5); }

  // ---------------------------------------------------------------- La route, le trottoir, le mur de la berge, le passage piéton
  const decorRoute = atelier(), yR = Y_ROUTE;
  {
    const a = decorRoute, ligne = (x, z, l, p, c = '#e8e6dc') => a.boite(l, 0.012, p, c, { x, y: yR + 0.05, z, trait: false });
    // la ligne du milieu, les bords ; le passage piéton (devant l'escalier)
    for (let z = ROUTE.z0 - 60; z < ROUTE.z1 + 60; z += 5) if (z < 30 || z > 44) ligne((ROUTE.x0 + ROUTE.x1) / 2, z + 1.25, 0.14, 2.5);
    for (const x of [ROUTE.x0 + 0.2, ROUTE.x1 - 0.2]) { ligne(x, -2, 0.12, 62); ligne(x, 90, 0.12, 84); }
    for (let k = 0; k < 7; k++) ligne(ROUTE.x0 + 0.6 + k * 1.14, 38, 0.52, 7.6);
    // le trottoir ouest, le mur bas de la berge (coupé à l'escalier)
    for (const [z0, z1] of [[ROUTE.z0 - 8, ESC.z0], [ESC.z1, ROUTE.z1 + 8]]) {
      a.boite(1.2, 0.14, z1 - z0, '#b8b5ab', { x: 213.4, y: yR + 0.07, z: (z0 + z1) / 2, nuance: 0.02 });
      a.boite(0.3, 1.0, z1 - z0, BETON, { x: 212.45, y: yR + 0.44, z: (z0 + z1) / 2, nuance: 0.03 });
    }
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
    monde.mur(xa - 0.8, za - 0.56, xa + 2.0, za - 0.56, 0.3);
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
    // le dehors : le socle, les poteaux de la façade, les vitrines sombres, le mur du haut et sa bande de fenêtres, le toit plat, l'acrotère
    a.boite(xb - xf - 0.06, 0.1, z1 - z0 - 0.04, '#8a8880', { x: (xf + xb) / 2, y: F - 0.04, z: (z0 + z1) / 2, trait: false });
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
    // ---- les souvenirs, au nord : les tables, les étagères du fond, le comptoir et la caisse
    const COUL = ['#c8402c', '#f2c443', '#3a6aa8', '#f4efe2', '#5a8a4a', '#e88a3a', '#d86a8a', '#a8d4e8', '#8a5a3a', '#e8c8a0'];
    const paquets = (x, y, z, l, p, g) => { for (let i = 0; i < Math.floor(l / 0.25); i++) for (let j = 0; j < Math.floor(p / 0.22); j++) a.boite(0.2, 0.09 + 0.06 * hasard(i + g, j), 0.17, COUL[(i * 3 + j * 7 + g) % COUL.length], { x: x - l / 2 + 0.13 + i * 0.25, y: y + 0.055, z: z - p / 2 + 0.12 + j * 0.22, trait: false }); };
    for (const [xt, zt] of [[255.6, -3.6], [260, -3.6], [255.6, 3.0], [260, 3.0]]) {
      a.boite(2.6, 0.72, 1.3, '#8a5f3c', { x: xt, y: F + 0.36, z: zt, nuance: 0.03 }).boite(2.7, 0.04, 1.4, '#6e4a2c', { x: xt, y: F + 0.74, z: zt });
      paquets(xt, F + 0.76, zt, 2.4, 1.1, Math.floor(xt + zt));
      murRect(xt, zt, 1.35, 0.7);
    }
    for (const xe of [264.4, 268.4]) {
      for (let k = 0; k < 4; k++) { a.boite(3.3, 0.04, 0.42, '#7a5a3c', { x: xe, y: F + 0.5 + k * 0.52, z: K.z0 + 0.3 }); paquets(xe, F + 0.52 + k * 0.52, K.z0 + 0.3, 3.1, 0.3, k * 5); }
      a.boite(3.26, 2.4, 0.04, '#b89a74', { x: xe, y: F + 1.2, z: K.z0 + 0.08, trait: false });
    }
    murRect(266.4, K.z0 + 0.3, 3.8, 0.25);
    // le comptoir, sa caisse, ses bocaux de rakkyō (らっきょう) ; un écriteau
    a.boite(1.0, 0.9, 4.6, '#8a5f3c', { x: 266.3, y: F + 0.45, z: 7.3, nuance: 0.03 }).boite(1.12, 0.05, 4.7, '#5e4028', { x: 266.3, y: F + 0.925, z: 7.3 });
    a.boite(0.42, 0.22, 0.5, '#3a3a40', { x: 266.3, y: F + 1.06, z: 8.6 });
    for (let k = 0; k < 6; k++) a.cylindre(0.1, 0.1, 0.22, 10, '#f4efd8', { x: 266.15, y: F + 1.06, z: 5.3 + k * 0.28 }).cylindre(0.104, 0.104, 0.05, 10, '#c8402c', { x: 266.15, y: F + 1.2, z: 5.3 + k * 0.28, trait: false });
    a.boite(0.04, 0.4, 2.2, '#f4efe2', { x: 269.6, y: F + 2.3, z: 7.2 });
    ecrire({ x: 269.56, y: F, z: 7.2, ry: -PI / 2 }, { texte: 'らっきょう・松葉がに', x: 0, y: 2.3, z: 0, l: 2.0, h: 0.32, fond: null, encre: '#2a2420' });
    murRect(266.3, 7.3, 0.56, 2.35);
    // ---- le restaurant, au sud : les tables et leurs chaises, le comptoir de la cuisine, la carte
    const table = (xt, zt, g) => {
      a.boite(1.3, 0.05, 0.8, '#6e4a2c', { x: xt, y: F + 0.72, z: zt }).baton([xt, F, zt], [xt, F + 0.7, zt], 0.05, '#3a3a40', 6);
      for (const dz of [-0.62, 0.62]) for (const dx of [-0.34, 0.34]) { a.boite(0.36, 0.05, 0.36, '#c8402c', { x: xt + dx, y: F + 0.44, z: zt + dz }).baton([xt + dx, F, zt + dz], [xt + dx, F + 0.42, zt + dz], 0.025, '#3a3a40', 5); }
      a.cylindre(0.05, 0.05, 0.12, 8, '#3a5a7a', { x: xt - 0.42, y: F + 0.81, z: zt }).boite(0.18, 0.02, 0.12, '#f4efe2', { x: xt + 0.45, y: F + 0.755, z: zt - 0.15, trait: false });
      murRect(xt, zt, 0.65, 0.8);
    };
    for (const [xt, zt] of [[255.2, 16.2], [259.6, 16.2], [255.2, 21.6], [259.6, 21.6], [255.2, 27], [259.6, 27]]) table(xt, zt);
    a.boite(0.9, 0.92, 15.4, '#8a5f3c', { x: 264.4, y: F + 0.46, z: 21, nuance: 0.03 }).boite(1.02, 0.05, 15.5, '#5e4028', { x: 264.4, y: F + 0.945, z: 21 });
    for (let k = 0; k < 5; k++) a.boite(0.34, 0.6, 0.02, '#eadfc4', { x: 262.4 + k * 0, y: F + 2.1, z: 13.0, trait: false });
    murRect(264.4, 21, 0.51, 7.75);
    a.boite(2.2, 0.76, 11, '#b8bcc0', { x: 269.8, y: F + 0.38, z: 21, nuance: 0.03 }).boite(2.24, 0.04, 11.1, '#dfe3e6', { x: 269.8, y: F + 0.78, z: 21 });
    a.cylindre(0.28, 0.26, 0.4, 14, '#a9aeb3', { x: 269.4, y: F + 1.0, z: 19 }).cylindre(0.29, 0.29, 0.03, 14, '#8a9096', { x: 269.4, y: F + 1.21, z: 19 });
    vapeurs.push({ x: 269.4, z: 19, y: F + 1.26, n: 3, haut: 0.9, large: 0.1, taille: 0.22 });
    for (const [zc, t] of [[14.4, 'かにめし'], [15.4, 'いか丼'], [16.4, 'らっきょう']]) { a.boite(0.02, 0.62, 0.36, '#eadfc4', { x: 271.2, y: F + 2.1, z: zc, trait: false }); ecrire({ x: 271.18, y: F, z: zc, ry: -PI / 2 }, { texte: t, vertical: true, x: 0, y: 2.1, z: 0, l: 0.26, h: 0.54, fond: null, encre: '#2a2420' }); }
    // (le plafond : la caméra se rapproche)
    monde.toit(K.x0 - 0.2, K.x1 + 0.2, K.z0 - 0.2, K.z1 + 0.2, F + PLAFOND - 0.02, F + H2 + 0.3);
    monde.toit(xf - 2.9, xf + 0.1, z0 - 0.5, z1 + 0.5, F + 2.85, F + 3.2);
    // deux distributeurs, contre un poteau de la façade
    distributeur(a, xf - 0.72, 23.6, '#d8402c'); distributeur(a, xf - 0.72, 24.9, '#2f6ab0');
    // (aucune ombre du dehors dans la salle : le plancher du haut couvrait tout)
    poser(a.fin(), 0, 0, { y: 0, recoit: false });
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
    a.boite(xb - xf - 0.06, 0.1, L - 0.04, '#8a8880', { x: (xf + xb) / 2, y: F - 0.04, z: zc, trait: false });
    a.boite(xb - xf, 1.4, L, '#ece4d0', { x: (xf + xb) / 2, y: F + H + 0.7, z: zc, nuance: 0.02 });
    a.boite(xb - xf + 0.4, 0.26, L + 0.4, '#6e6c68', { x: (xf + xb) / 2, y: F + H + 1.52, z: zc });
    a.boite(0.2, H, L - 0.05, '#d8d0bc', { x: xb - 0.1, y: F + H / 2, z: zc, trait: false });
    for (const z of [z0 + 0.14, z1 - 0.14]) a.boite(xb - xf, H, 0.28, '#d8d0bc', { x: (xf + xb) / 2, y: F + H / 2, z });
    a.boite(xb - xf - 0.2, 0.04, L - 0.5, '#e8e2d2', { x: (xf + xb) / 2, y: F + H - 0.02, z: zc, trait: false });
    a.boite(xb - xf - 0.2, 0.05, L - 0.5, '#c8bfa8', { x: (xf + xb) / 2, y: F + 0.01, z: zc, trait: false });
    // le comptoir, tout le long, ouvert au-dessus ; les étagères du fond ; l'enseigne ; l'auvent de toile
    a.boite(0.7, 0.86, L - 0.6, '#8a5f3c', { x: xf + 0.42, y: F + 0.43, z: zc, nuance: 0.03 }).boite(0.8, 0.05, L - 0.56, '#5e4028', { x: xf + 0.42, y: F + 0.885, z: zc });
    const COUL = ['#c8402c', '#f2c443', '#3a6aa8', '#f4efe2', '#5a8a4a', '#e88a3a', '#d86a8a', '#a8d4e8'];
    for (let i = 0; i < Math.floor((L - 1) / 0.32); i++) a.boite(0.24, 0.12 + 0.1 * hasard(i, g), 0.26, COUL[(i * 3 + g) % COUL.length], { x: xf + 0.42, y: F + 0.98, z: z0 + 0.7 + i * 0.32, trait: false });
    for (let k = 0; k < 3; k++) {
      a.boite(0.5, 0.04, L - 1, '#7a5a3c', { x: xb - 0.5, y: F + 0.8 + k * 0.62, z: zc });
      for (let i = 0; i < Math.floor((L - 1.4) / 0.3); i++) a.boite(0.26, 0.16 + 0.14 * hasard(i, k + g), 0.22, COUL[(i * 5 + k * 3 + g) % COUL.length], { x: xb - 0.5, y: F + 0.92 + k * 0.62, z: z0 + 0.9 + i * 0.3, trait: false });
    }
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
  const SABLE1 = '#dcc595', SABLE2 = '#ceb583', SABLE3 = '#e6d3a8', SABLE4 = '#bfa473';
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
    for (const [z0, z1] of [[84, Mu.porte.z0 - 1.0], [Mu.porte.z1 + 1.0, 118]]) {
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
  const SUITE_SCULPTURES = sculptures(THREE, atelier, { yM, SABLE1, SABLE2, SABLE3, SABLE4, garde, poser, ecrire, Mu, hasard, PI });

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
    const a = atelier(), yb = terrain(ABRI.x, ABRI.z), L = 10, W = 3.6, h0 = 2.7, h1 = 3.2;
    for (const u of [-1, 0, 1]) for (const v of [-1, 1]) { const x = ABRI.x + u * (L / 2 - 0.2), z = ABRI.z + v * (W / 2), y = terrain(x, z); a.fut([x, y - 0.3, z], [x, yb + (v > 0 ? h0 : h1), z], 0.09, 0.08, '#6f5a3e', 7); monde.cercle(x, z, 0.32); }
    for (const v of [-1, 1]) a.boite(L, 0.14, 0.14, '#5e4a34', { x: ABRI.x, y: yb + (v > 0 ? h0 : h1), z: ABRI.z + v * (W / 2) });
    // (le toit de roseaux, en pente, les poutres dessous)
    const ang = Math.atan2(h1 - h0, W);
    a.boite(L + 0.8, 0.2, W + 1.1, '#b89c62', { x: ABRI.x, y: yb + (h0 + h1) / 2 + 0.2, z: ABRI.z, rx: -ang, nuance: 0.05 });
    for (let k = 0; k < 7; k++) a.baton([ABRI.x - L / 2 + k * (L / 6), yb + h1 + 0.03, ABRI.z - W / 2], [ABRI.x - L / 2 + k * (L / 6), yb + h0 + 0.03, ABRI.z + W / 2], 0.05, '#6f5a3e', 5);
    // l'auge et la botte de foin, une enseigne
    a.boite(4.4, 0.42, 0.5, '#8a6a48', { x: ABRI.x + 1.2, y: yb + 0.2, z: ABRI.z - 1.5 }).boite(4.2, 0.03, 0.34, '#c8b060', { x: ABRI.x + 1.2, y: yb + 0.42, z: ABRI.z - 1.5, trait: false });
    murRect(ABRI.x + 1.2, ABRI.z - 1.5, 2.2, 0.25);
    a.boite(1.8, 0.5, 0.06, '#7a3a26', { x: ABRI.x - 3.4, y: yb + 2.15, z: ABRI.z + W / 2 + 0.1 });
    poser(a.fin(), 0, 0, { y: 0 });
    ecrire({ x: ABRI.x - 3.4, y: yb, z: ABRI.z + W / 2 + 0.135, ry: 0 }, { texte: 'らくだ', x: 0, y: 2.15, z: 0, l: 1.5, h: 0.4, fond: null, encre: '#f8e8c8' });
    monde.toit(ABRI.x - L / 2, ABRI.x + L / 2, ABRI.z - W / 2, ABRI.z + W / 2, yb + h0 - 0.1, yb + h1 + 0.5);
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

  // ---------------------------------------------------------------- La planche : le moniteur, sur la crête, ses planches plantées dans le sable
  const ZC_PL = zCrete(82), PLANCHES = { x: 82, z: ZC_PL + 3.0 };
  {
    const a = atelier(), COUL = ['#e8452e', '#2f6ab0', '#f2c443', '#3a8a5a', '#f4efe2'];
    for (let k = 0; k < 5; k++) {
      const x = PLANCHES.x + 1.3 + k * 0.62, z = PLANCHES.z + 0.5 + 0.12 * (k % 2), y = terrain(x, z);
      a.boite(0.3, 1.2, 0.04, COUL[k], { x, y: y + 0.42, z, rz: 0.1 * (k % 2 ? 1 : -1), rx: -0.14, nuance: 0.03 });
    }
    // son petit drapeau, sa glacière
    const xf = PLANCHES.x - 1.4, zf = PLANCHES.z + 0.8, yf = terrain(xf, zf);
    a.baton([xf, yf - 0.3, zf], [xf, yf + 2.9, zf], 0.024, '#d8dcdc', 6).boite(0.9, 0.5, 0.02, '#e8452e', { x: xf + 0.46, y: yf + 2.62, z: zf, trait: false });
    a.boite(0.5, 0.34, 0.36, '#3a7aa8', { x: PLANCHES.x + 5.4, y: terrain(PLANCHES.x + 5.4, PLANCHES.z + 1.2) + 0.16, z: PLANCHES.z + 1.2 });
    poser(a.fin(), 0, 0, { y: 0 });
    ecrire({ x: xf + 0.46, y: yf, z: zf + 0.012, ry: 0 }, { texte: 'サンドボード', x: 0, y: 2.62, z: 0, l: 0.84, h: 0.2, fond: null, encre: '#f8f8f0' });
    ecrire({ x: xf + 0.46, y: yf, z: zf - 0.012, ry: PI }, { texte: 'サンドボード', x: 0, y: 2.62, z: 0, l: 0.84, h: 0.2, fond: null, encre: '#f8f8f0' });
    monde.mur(PLANCHES.x + 1.1, PLANCHES.z + 0.55, PLANCHES.x + 3.9, PLANCHES.z + 0.55, 0.3);
    monde.cercle(xf, zf, 0.27);
    monde.cercle(PLANCHES.x + 5.4, PLANCHES.z + 1.2, 0.5);
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
    // l'îlot : une baleine qui nage ; le dos sombre, la tête vers l'est, l'eau blanche autour
    a.ovale(1, '#3f4a44', { x: 690, y: 3, z: -640, sx: 64, sy: 21, sz: 21, nuance: 0.03, deformer: (x, y, z) => [x, y * (1 - 0.35 * Math.max(0, x)) + (x > 0.3 ? 0.08 : 0), z], teinte: (x, y) => (y > 13 ? '#4c6a48' : '#3f4a44') }, 14);
    a.ovale(1, '#4a544c', { x: 752, y: 1.5, z: -640, sx: 14, sy: 9, sz: 10 }, 8);
    a.fut([620, 0, -640], [606, 11, -640], 3.5, 1.2, '#3f4a44', 5).fut([606, 11, -640], [598, 14, -633], 1.2, 0.3, '#3f4a44', 4).fut([606, 11, -640], [598, 14, -647], 1.2, 0.3, '#3f4a44', 4);
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
  {
    const a = atelier(), W = 3.8, cases = 9;
    for (let k = 0; k < cases; k++) {
      const t0 = -1 + (k / cases) * 2, t1 = -1 + ((k + 1) / cases) * 2, y0 = 1 - t0 * t0, y1 = 1 - t1 * t1;
      a.boite(Math.hypot(t1 - t0, 0) * W + 0.02, 0.14, 1.5, k % 2 ? '#7a3ab0' : '#8e4ec8', { x: ((t0 + t1) / 2) * W, y: 3.6 + 0.55 * (y0 + y1), z: 0, rz: Math.atan2((y1 - y0) * 1.1, (t1 - t0) * W), nuance: 0.02 });
    }
    for (const t of [-0.95, -0.5, 0.5, 0.95]) a.baton([t * W, 3.6 + 1.1 * (1 - t * t), 0], [0, 0.65, 0], 0.006, '#e8e8e2', 3, { trait: false });
    a.boite(0.3, 0.46, 0.22, '#2a2a30', { y: 0.4 }).ovale(0.13, '#f4c8a0', { y: 0.72 }, 7).ovale(0.145, '#e8452e', { y: 0.76 }, 7).boite(0.34, 0.1, 0.5, '#3a3a44', { y: 0.2, z: 0.12 });
    const o = ctx.perso.maillage(a.fin(0, false));
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
        guide.objet.position.set(dg[0], terrain(dg[0], dg[1]), dg[1]);
        guide.objet.rotation.y = ride.cap;
        guide.animer(dt, vitesseRide, temps);
        if (ride.s >= L) {
          ride.actif = false;
          const fin = ride.fin; ride.fin = null;
          if (fin) fin();
        }
      } else {
        ride.cap = tournerVers(ride.cap, POSE_M.cap, dt * 3);
        guide.objet.position.set(POSE_M.x + Math.sin(POSE_M.cap) * 2.0 + Math.cos(POSE_M.cap) * 0.75, terrain(POSE_M.x + 1, POSE_M.z), POSE_M.z + Math.cos(POSE_M.cap) * 2.0 - Math.sin(POSE_M.cap) * 0.75);
        guide.objet.rotation.y = POSE_M.cap + PI + 0.5;
        guide.animer(dt, 0, temps);
      }
      MONTURE.animer(dt, ride.actif ? vitesseRide : 0, temps);
      MONTURE.objet.position.set(ride.x, ride.y, ride.z);
      MONTURE.objet.rotation.y = ride.cap;
      // (l'assise suit le roulis du chameau ; le voyageur en suit le haut)
      const cc = MONTURE.corps;
      Object.assign(ride.siege, { x: ride.x + Math.cos(ride.cap) * Math.sin(cc.rotation.z) * MONTURE.siege * 0.5, z: ride.z - Math.sin(ride.cap) * Math.sin(cc.rotation.z) * MONTURE.siege * 0.5, y: ride.y + MONTURE.siege + cc.position.y, cap: ride.cap });
      return [];
    },
  });

  // ---------------------------------------------------------------- La planche de sable (サンドボード) : on descend la grande pente vers la mer, le compagnon assis devant
  const planche = (() => {
    const a = atelier();
    a.boite(0.3, 0.035, 1.25, '#e8452e', { nuance: 0.02 }).ovale(0.15, '#e8452e', { z: 0.62, sy: 0.12, sz: 1.2 }, 8).ovale(0.15, '#e8452e', { z: -0.62, sy: 0.12, sz: 1.2 }, 8).boite(0.1, 0.02, 0.9, '#f4efe2', { y: 0.025, trait: false });
    for (const dz of [-0.25, 0.2]) a.boite(0.26, 0.05, 0.1, '#2a2a30', { y: 0.04, z: dz, trait: false });
    const o = ctx.perso.maillage(a.fin(0, false));
    o.visible = false;
    return o;
  })();
  const conduite = {
    actif: false, vx: 0, vz: 0, cap: PI, debut: 0, spray: 0, son: 0, fin: null, vire: 0,
    demarrer(x, z, cap, fin) {
      Object.assign(this, { actif: true, vx: 0, vz: 0, cap, fin, vire: 0, spray: 0, son: 0 });
    },
    maj(dt, pousse, vire, etat, cam, renard) {
      const x = etat.x, z = etat.z, e = 0.7;
      const gx = (terrain(x + e, z) - terrain(x - e, z)) / (2 * e), gz = (terrain(x, z + e) - terrain(x, z - e)) / (2 * e), pente = Math.hypot(gx, gz);
      this.vire += (vire - this.vire) * Math.min(1, dt * 5);
      this.cap += this.vire * dt * 1.25;
      const dx = Math.sin(this.cap), dz = Math.cos(this.cap);
      // la pente pousse (et un peu moins en travers) ; le sable freine ; la planche glisse surtout dans son axe
      const k = 8.2 / Math.hypot(1, pente);
      let vx = this.vx - gx * k * dt, vz = this.vz - gz * k * dt;
      const le = vx * dx + vz * dz, tr = -vx * dz + vz * dx, le2 = le * Math.exp(-dt * (0.26 + 0.012 * Math.abs(le) + (pente < 0.14 ? 1.1 : 0))), tr2 = tr * Math.exp(-dt * 3.6);
      vx = dx * le2 - dz * tr2; vz = dz * le2 + dx * tr2;
      const nx = x + vx * dt, nz = z + vz * dt;
      if (monde.libre(nx, nz, etat.y)) { etat.x = nx; etat.z = nz; } else { vx *= 0.3; vz *= 0.3; }
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
      // arrivé ? au bas de la pente, presque arrêté, ou la plage
      const dc = etat.z - zRivage(etat.x);
      this.age = (this.age || 0) + dt;
      if ((v < 0.5 && this.age > 2.5) || dc < 8) { this.actif = false; this.age = 0; const fin = this.fin; this.fin = null; if (fin) fin(); }
      return v;
    },
  };
  animes.push({ objet: planche, maj: () => [] });

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
        jeu.asseoir(ride.siege, vue);
        jeu.son('oiseau/chameau');
        await jeu.attendre(500);
        ride.s = 0;
        await new Promise((fin) => { ride.fin = fin; ride.actif = true; jeu.dire(jeu.tx('chameauEnRoute')); });
        await jeu.attendre(400);
        jeu.asseoir(null);
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
        const r = await jeu.choisir(jeu.tx(jeu.aTampon('planche') ? 'moniteurEncore' : 'moniteur'), [jeu.t('oui'), jeu.t('non')], 'moniteur');
        if (r !== 0) return;
        await jeu.dire(jeu.tx(jeu.tactile ? 'moniteurConsigneTel' : 'moniteurConsigneOrdi'), 'moniteur');
        const zd = zCrete(PLANCHES.x + 6) - 2.2, xd = PLANCHES.x + 6;
        jeu.placer(xd, zd, PI);
        jeu.cameraDerriere(0);
        jeu.geste('planche');
        planche.visible = true;
        conduite.age = 0;
        conduite.demarrer(xd, zd, PI, () => {
          planche.visible = false;
          caravane.scene(async (j) => {
            j.geste(null);
            j.cameraDerriere(0);
            await j.dire(j.tx('plancheFin'));
            if (!j.aTampon('planche')) { await j.tampon('planche'); await comp(j, 'plancheCompagnon'); }
          });
        });
      },
    },
    // ---- le musée (le tampon) : le pupitre devant la Sagrada Família
    {
      id: 'musee', x: SUITE_SCULPTURES.pupitre.x + 0.8, z: SUITE_SCULPTURES.pupitre.z, y: yF, rayon: 2.6, haut: 1.8, verbe: 'regarder', vers: SUITE_SCULPTURES.vers, tampon: 'musee', quoi: QUOI.musee,
      async action(jeu) {
        jeu.placer(SUITE_SCULPTURES.pupitre.x - 1.2, SUITE_SCULPTURES.pupitre.z, PI / 2);
        jeu.cadrer({ de: [SUITE_SCULPTURES.pupitre.x - 4.6, yF + 1.5, SUITE_SCULPTURES.pupitre.z - 3.4], vers: [265, yF + 5.6, 104], champ: 62 });
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
    parler('centreCaisse'), parler('centreClient'), parler('vieuxHaut'), parler('filleHaut'),
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
    secret: 'caravane', marchand: MARCHAND, sons: ['oiseau/chameau', 'oiseau/grelots', 'oiseau/glisse', 'oiseau/poudre', 'oiseau/poulies'],
    feux: { x: 30, y: 0, z: -235, large: 170, haut: [85, 120], echelle: 2.2, loin: 300 },
    mouettes: {
      vols: [{ x: 60, z: -190, r: 26, h: 16, sens: 1 }, { x: -90, z: -180, r: 20, h: 12, sens: -1 }, { x: 170, z: -170, r: 16, h: 14, sens: 1 }],
      poses: [{ x: 214, z: -160, y: 2.8, cap: -1.2, mer: [0, -1] }, { x: -222, z: -158, y: 2.7, cap: 1.2, mer: [0, -1] }],
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
  const { z: ZL, e: E, xb: XB, xh: XH } = LIFT, L1 = XH - XB, LT = 2 * L1 + 2 * PI * E, N = 28, ECART = LT / N, VITESSE = 3.2;
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
    for (const [z0, z1] of [[G.z0, 62.4], [65.6, 74], [78, G.z1]]) monde.mur(G.x0 + 0.1, z0, G.x0 + 0.1, z1, 0.27);
    monde.mur(G.x0, G.z0 + 0.1, G.x1, G.z0 + 0.1, 0.27); monde.mur(G.x0, G.z1 - 0.1, G.x1, G.z1 - 0.1, 0.27);
    monde.mur(G.x1 - 0.1, G.z0, G.x1 - 0.1, ZL - 3.1, 0.27); monde.mur(G.x1 - 0.1, ZL + 3.1, G.x1 - 0.1, G.z1, 0.27);
    monde.toit(G.x0, G.x1, G.z0, G.z1, F + PLAF - 0.02, F + HF + 0.4);
    // l'écriteau, entre les deux portes
    const s = panneau(atelier(), P, { ecrit: true, pied: 0.4 });
    poser(s.fin(), PANNEAU.x, PANNEAU.z, { y: terrain(PANNEAU.x, PANNEAU.z), ry: -PI / 2 });
    ecrire({ x: PANNEAU.x, y: terrain(PANNEAU.x, PANNEAU.z), z: PANNEAU.z, ry: -PI / 2 }, { ...PAPIER_PANNEAU, texte: '鳥取砂丘リフト', lignes: 3, fond: '#f4ecd8', encre: '#2a2420' });
    monde.cercle(PANNEAU.x, PANNEAU.z, 0.6);
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
    for (const [x0, z0r, x1, z1r] of [[xf + 0.3, z0 + 0.3, xb - 0.3, z0 + 0.3], [xf + 0.3, z0 + 0.3, xf + 0.3, z1 - 0.3], [xb - 0.3, z0 + 0.3, xb - 0.3, z1 - 0.3], [xf + 0.3, z1 - 0.3, xb - 0.3, z1 - 0.3]]) garde(a, x0, z0r, x1, z1r, yt);
    for (const z of [38, 41.2, 44.4]) a.cylindre(1.1, 1.1, 2.2, 12, '#d8d8d0', { x: 376, y: yt + 1.2, z, nuance: 0.02 }).cylindre(0.2, 1.1, 0.3, 12, '#c8c8c0', { x: 376, y: yt + 2.45, z });
    a.boite(4.6, 2.8, 5.6, M2, { x: 369, y: yt + 1.4, z: 52, nuance: 0.02 }).baton([369, yt + 2.8, 52], [369, yt + 4.4, 52], 0.14, ACIER, 8).ovale(1.55, '#f4f4ee', { x: 369, y: yt + 5.8, z: 52, nuance: 0.01 }, 14);
    // la tour : son fût, « リフトのりば », sa salle vitrée, « 砂丘センター » tout en haut
    const xT0 = 356.3, xT1 = 362.3, zT0 = 65, zT1 = 75, xTm = (xT0 + xT1) / 2, zTm = (zT0 + zT1) / 2;
    a.boite(xT1 - xT0, 5.4, zT1 - zT0, M1, { x: xTm, y: F + H2 + 2.7, z: zTm, nuance: 0.02 });
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
    // ---- la boutique, au nord : surtout des gâteaux et des souvenirs de Tottori (les tables, les étagères du fond, la caisse)
    const COUL = ['#c8402c', '#f2c443', '#3a6aa8', '#f4efe2', '#5a8a4a', '#e88a3a', '#d86a8a', '#a8d4e8', '#8a5a3a', '#e8c8a0'];
    const paquets = (x, y, z, l, p, g) => { for (let i = 0; i < Math.floor(l / 0.25); i++) for (let j = 0; j < Math.floor(p / 0.22); j++) a.boite(0.2, 0.09 + 0.06 * hasard(i + g, j), 0.17, COUL[(i * 3 + j * 7 + g) % COUL.length], { x: x - l / 2 + 0.13 + i * 0.25, y: y + 0.055, z: z - p / 2 + 0.12 + j * 0.22, trait: false }); };
    for (const [xt, zt] of [[360.8, 38.4], [365.2, 38.4], [360.8, 44.2], [365.2, 44.2]]) {
      a.boite(2.6, 0.72, 1.3, '#8a5f3c', { x: xt, y: F + 0.36, z: zt, nuance: 0.03 }).boite(2.7, 0.04, 1.4, '#6e4a2c', { x: xt, y: F + 0.74, z: zt });
      paquets(xt, F + 0.76, zt, 2.4, 1.1, Math.floor(xt + zt));
      murRect(xt, zt, 1.35, 0.7);
    }
    for (const xe of [359.4, 363.4, 367.4]) {
      for (let k = 0; k < 4; k++) { a.boite(3.3, 0.04, 0.42, '#7a5a3c', { x: xe, y: F + 0.5 + k * 0.52, z: K.z0 + 0.3 }); paquets(xe, F + 0.52 + k * 0.52, K.z0 + 0.3, 3.1, 0.3, k * 5 + Math.floor(xe)); }
      a.boite(3.26, 2.4, 0.04, '#b89a74', { x: xe, y: F + 1.2, z: K.z0 + 0.08, trait: false });
    }
    murRect(363.4, K.z0 + 0.3, 5.8, 0.25);
    a.boite(1.0, 0.9, 5.2, '#8a5f3c', { x: 372, y: F + 0.45, z: 41, nuance: 0.03 }).boite(1.12, 0.05, 5.3, '#5e4028', { x: 372, y: F + 0.925, z: 41 }).boite(0.42, 0.22, 0.5, '#3a3a40', { x: 372, y: F + 1.06, z: 42.4 });
    murRect(372, 41, 0.56, 2.65);
    // ---- le restaurant, au sud : ses tables, sa carte (les vrais plats : le bol de fruits de mer, le chanpon au bouillon d'os de bœuf, le jus de poire Nijisseiki)
    const table = (xt, zt) => {
      a.boite(1.3, 0.05, 0.8, '#6e4a2c', { x: xt, y: F + 0.72, z: zt }).baton([xt, F, zt], [xt, F + 0.7, zt], 0.05, '#3a3a40', 6);
      for (const dz of [-0.62, 0.62]) for (const dx of [-0.34, 0.34]) a.boite(0.36, 0.05, 0.36, '#3a7a9a', { x: xt + dx, y: F + 0.44, z: zt + dz }).baton([xt + dx, F, zt + dz], [xt + dx, F + 0.42, zt + dz], 0.025, '#3a3a40', 5);
      a.cylindre(0.05, 0.05, 0.12, 8, '#3a5a7a', { x: xt - 0.42, y: F + 0.81, z: zt }).boite(0.18, 0.02, 0.12, '#f4efe2', { x: xt + 0.45, y: F + 0.755, z: zt - 0.15, trait: false });
      murRect(xt, zt, 0.65, 0.8);
    };
    for (const [xt, zt] of [[361, 52.6], [366, 52.6], [371, 52.6], [361, 57.4], [366, 57.4]]) table(xt, zt);
    for (const [xm, t] of [[370.6, '海鮮彩り丼'], [372.2, '牛骨ちゃんぽん'], [373.8, 'かにバーガー'], [375.2, '二十世紀梨ジュース']]) {
      a.boite(0.42, 1.5, 0.02, '#eadfc4', { x: xm, y: F + 2.0, z: K.z1 - 0.03, trait: false });
      ecrire({ x: xm, y: F, z: K.z1 - 0.05, ry: PI }, { texte: t, vertical: true, x: 0, y: 2.0, z: 0, l: 0.3, h: 1.36, fond: null, encre: '#2a2420' });
    }
    monde.toit(K.x0 - 0.2, K.x1 + 0.2, K.z0 - 0.2, K.z1 + 0.2, F + PLAF - 0.02, F + H2 + 0.3);
    // (la caméra n'entre pas dans ce qui est plein : de la gare ou de la salle, elle s'approche)
    monde.bloc(xf - 1, xb, K.z1 + 0.1, z1, F - 3, F + H2 + 0.3); monde.bloc(K.x1 + 0.1, xb, z0, K.z1 + 0.1, F - 3, F + H2 + 0.3); monde.bloc(xf, xb, z0, K.z0 - 0.1, F - 3, F + H2 + 0.3);
    poser(a.fin(), 0, 0, { y: 0, recoit: false });
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
    monde.cercle(JUMELLES.x, JUMELLES.z, 0.32);
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
    const xd = 355.1, zd = 56.4;
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
  const siege = { x: 0, z: 0, y: 0, cap: 0, libre: false, cote: { x: 0, z: 0, y: 0, cap: 0, aussitot: true } };
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
        v3.set(0.36, Y_SIEGE, 0.05).applyMatrix4(obj.matrix);
        let sx = v3.x, sy = v3.y, sz = v3.z;
        v3.set(-0.36, Y_SIEGE, 0.05).applyMatrix4(obj.matrix);
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
    JUMELLES, PANNEAU,
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
 * Un chameau de Bactriane (les deux bosses, comme ceux de la らくだや), environ 2,2 m au sommet des bosses, l'avant vers +z : un corps, deux pattes
 * d'une pièce par côté (hanche et genou, chacune un pivot : on marche l'amble, les deux pattes d'un côté ensemble), un long cou en S (le
 * pivot à sa base, la tête à son bout, la mâchoire qui rumine), de la laine sur les bosses, sous le cou et en haut des pattes.
 * sable : la caravane, tout en sable, sans harnais (la matière vient du lieu : monte(mesh) reçoit chaque pièce) ; harnais : le tapis
 * rayé de la らくだや, le siège entre les bosses, la bride ; grelot : un grelot au cou.
 * Renvoie { objet, siege (la hauteur de l'assise), animer(dt, vitesse, temps, regard) }.
 */
function creerChameau(ctx, { sable = false, harnais = false, grelot = true, monte = null, pelage = null } = {}) {
  const { THREE, atelier, maillage } = ctx, T = sable ? SABLE_CHAMEAU : pelage || PELAGE_CHAMEAU;
  const mailler = (a) => { const f = a.fin(0, false); return monte ? monte(f) : maillage(f); };
  const pivot = (x, y, z, ...m) => { const g = new THREE.Group(); g.position.set(x, y, z); if (m.length) g.add(...m); return g; };
  const hp = (a, b = 0) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  const racine = new THREE.Group(), corps = new THREE.Group();
  racine.add(corps);
  const YC = 1.32, BOSSE1 = 0.42, BOSSE2 = -0.46;
  // ---- le corps : profond à l'avant, un peu rentré au ventre ; deux bosses, la laine sombre à leur sommet
  const c = atelier();
  const sculpte = (x, y, z) => {
    const fz = z, k = 1 - (y < 0 ? 0.12 * (1 - Math.min(1, Math.abs(fz) / 0.9)) * Math.min(1, -y / 0.3) : 0);
    return [x * k, y * k, z];
  };
  c.ovale(1, T.base, { y: YC, sx: 0.4, sy: 0.46, sz: 0.98, deformer: sculpte, nuance: 0.03, teinte: (x, y) => (y < YC - 0.26 ? T.clair : T.base) }, 16);
  for (const [zb, h] of [[BOSSE1, 0.5], [BOSSE2, 0.46]]) {
    const y0 = YC + 0.34;
    c.piece(new THREE.SphereGeometry(1, 12, 8), T.base, {
      y: y0, z: zb, sx: 0.25, sy: h, sz: 0.27, nuance: 0.03,
      deformer: (x, y, z) => { const p = y > 0 ? 1 - 0.28 * y : 1; return [x * p + 0.05 * Math.sin(y * 2.2 + zb * 3) * Math.max(0, y), y, z * p]; },
      teinte: (x, y) => (y > y0 + h * 0.42 ? T.laine : y > y0 + h * 0.2 ? T.fonce : T.base),
    });
    // (la laine du sommet : des mèches sans trait qui dépassent de la silhouette)
    for (let k = 0; k < 7; k++) {
      const t = (k / 7) * 2 * PI, r = 0.05 + 0.05 * hp(k, zb), l = 0.07 + 0.05 * hp(zb, k);
      c.ovale(0.075 + 0.03 * hp(k, 2), T.laine, { x: Math.cos(t) * r, y: y0 + h * 0.9 + l * hp(k, 3) * 0.4, z: zb + Math.sin(t) * r, sy: 0.72, nuance: 0.04 }, 6);
    }
  }
  // la queue, sa touffe
  c.tronc([[0, YC + 0.2, -0.93], [0, YC - 0.05, -1.04], [0.02, YC - 0.42, -1.08]], [0.045, 0.03, 0.022], T.fonce, 5);
  c.ovale(0.05, T.laine, { x: 0.02, y: YC - 0.5, z: -1.08, sy: 2.0 }, 6);
  if (harnais && !sable) {
    // le siège, entre les bosses (rembourré, rouge, deux poignées) ; le tapis rayé noir et blanc, sur tout le dos ; la sangle rouge et jaune
    const yd = YC + 0.42;
    c.boite(0.4, 0.08, 0.34, '#c8402c', { y: yd + 0.09, z: -0.02 }).boite(0.42, 0.03, 0.08, '#e8b42a', { y: yd + 0.14, z: 0.14, trait: false });
    for (const u of [-1, 1]) c.baton([u * 0.18, yd + 0.1, 0.17], [u * 0.2, yd + 0.42, 0.2], 0.018, '#7a6a52', 5);
    c.baton([-0.2, yd + 0.42, 0.2], [0.2, yd + 0.42, 0.2], 0.018, '#7a6a52', 5);
    const n = 13, pos = [], cols = [];
    for (let k = 0; k < n; k++) {
      const z0 = -0.26 + (k / n) * 0.52, z1 = -0.26 + ((k + 1) / n) * 0.52;
      for (const u of [-1, 1]) {
        const qx = (t, z) => u * (0.1 + 0.33 * Math.sin(t * PI * 0.5)), qy = (t) => yd + 0.04 - 0.62 * t ** 1.5;
        for (let j = 0; j < 4; j++) {
          const t0 = j / 4, t1 = (j + 1) / 4, a = [qx(t0), qy(t0), z0], b = [qx(t1), qy(t1), z0], d = [qx(t0), qy(t0), z1], f = [qx(t1), qy(t1), z1];
          if (u > 0) pos.push(...a, ...d, ...b, ...b, ...d, ...f); else pos.push(...a, ...b, ...d, ...b, ...f, ...d);
          const col = k % 2 ? '#2a2a2e' : '#f4efe2';
          cols.push(col, col);
        }
      }
      // le dessus, au milieu
      pos.push(-0.1, yd + 0.04, z0, -0.1, yd + 0.04, z1, 0.1, yd + 0.04, z0, 0.1, yd + 0.04, z0, -0.1, yd + 0.04, z1, 0.1, yd + 0.04, z1);
      const col = k % 2 ? '#2a2a2e' : '#f4efe2';
      cols.push(col, col);
    }
    const tapis = new THREE.BufferGeometry();
    tapis.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    c.piece(tapis, '#f4efe2', { couleurs: cols, trait: false, nuance: 0.01 });
    // la sangle sous le ventre, un collier de pompons rouges
    c.piece(new THREE.TorusGeometry(0.47, 0.022, 5, 22), '#c8402c', { y: YC + 0.02, z: -0.3, ry: PI / 2, sx: 0.88, trait: false });
    for (const u of [-1, 1]) c.ovale(0.05, '#e8b42a', { x: u * 0.4, y: YC - 0.2, z: -0.28, trait: false }, 6);
  }
  corps.add(mailler(c));
  // ---- les pattes : la cuisse charnue (dans le corps, laine en haut à l'avant), le genou et son cal, le canon, le large pied à deux doigts
  const pattes = [];
  const creerPatte = (x, z, avant) => {
    const haut = atelier(), L1 = 0.56, L2 = 0.62;
    haut.tronc([[0, 0.05, 0], [0, -0.26, avant ? 0.02 : -0.03], [0, -L1, 0]], [0.15, 0.1, 0.062], T.base, 7, { nuance: 0.03 });
    if (avant) for (let k = 0; k < 3; k++) haut.ovale(0.075, T.laine, { x: x > 0 ? 0.07 : -0.07, y: -0.14 - k * 0.1, z: 0.04, sy: 1.25, nuance: 0.04 }, 6);
    const bas = atelier();
    bas.ovale(0.075, T.fonce, { y: 0, z: 0.015, sy: 0.9 }, 6)
      .tronc([[0, 0, 0], [0, -L2 * 0.6, 0], [0, -L2 + 0.05, 0.01]], [0.058, 0.046, 0.06], T.base, 6, { nuance: 0.03 })
      .ovale(0.11, T.fonce, { y: -L2 + 0.015, z: 0.04, sx: 1.05, sy: 0.42, sz: 1.42 }, 8)
      .boite(0.012, 0.05, 0.1, T.nez, { y: -L2 + 0.02, z: 0.15, trait: false });
    const g = pivot(0, -L1, 0, mailler(bas)), h = pivot(x, YC - 0.3, z, mailler(haut), g);
    corps.add(h);
    pattes.push({ h, g, sg: x > 0 ? 0 : PI, avant });
  };
  creerPatte(0.27, 0.68, true); creerPatte(-0.27, 0.68, true); creerPatte(0.25, -0.68, false); creerPatte(-0.25, -0.68, false);
  // ---- le cou : il descend d'abord, puis remonte en S ; sa barbe de laine ; la tête, petite et plate, aux grosses lèvres, aux longs cils
  const cou = atelier(), PC = [[0, 0.02, 0], [0, -0.1, 0.26], [0, 0.0, 0.56], [0, 0.34, 0.74], [0, 0.72, 0.8]];
  cou.tronc(PC, [0.19, 0.15, 0.115, 0.095, 0.085], T.base, 8, { nuance: 0.03 });
  for (let k = 0; k < 16; k++) {
    const t = k / 15, i = Math.min(PC.length - 2, Math.floor(t * (PC.length - 1))), f = t * (PC.length - 1) - i, y = melange(PC[i][1], PC[i + 1][1], f), z = melange(PC[i][2], PC[i + 1][2], f), sg = k % 2 ? 1 : -1;
    cou.ovale(0.062 + 0.02 * hp(k), T.laine, { x: sg * 0.02, y: y - 0.1 - 0.03 * hp(k), z: z + 0.03, sy: 1.3, sz: 0.85, nuance: 0.04 }, 6);
    if (k % 3 === 1) cou.ovale(0.05, T.laine, { y: y + 0.07, z: z - 0.085, sy: 0.8, sz: 1.1, nuance: 0.04 }, 5);
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
  let phase = hp(racine.id) * 6, ampl = 0, rumine = hp(racine.id, 2) * 6, oreille = 0;
  return {
    objet: racine, corps, siege: YC + 0.57,
    animer(dt, v, temps, regard = 0) {
      ampl += (Math.min(1, v / 1.1) - ampl) * Math.min(1, dt * 4);
      phase += dt * (1.9 + v * 1.25);
      const s = Math.sin(phase);
      for (const p of pattes) {
        const q = phase + p.sg, ang = Math.sin(q) * 0.42 * ampl, plie = Math.max(0, Math.sin(q + 1.2)) * 0.8 * ampl;
        p.h.rotation.x = ang + (p.avant ? 0 : 0.02);
        p.g.rotation.x = plie * (p.avant ? 1 : 1) + (p.avant ? 0 : 0);
      }
      corps.rotation.z = s * 0.055 * ampl;
      corps.position.y = Math.abs(Math.cos(phase)) * 0.045 * ampl - 0.02 * ampl;
      corps.rotation.x = Math.sin(phase * 2 + 0.6) * 0.012 * ampl;
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
function sculptures(THREE, atelier, { yM, SABLE1, SABLE2, SABLE3, SABLE4, garde, poser, ecrire, Mu, hasard, PI }) {
  // (le sable taillé : la surface tremble un peu, jamais tout à fait droite)
  const taille = (k = 0.03) => (x, y, z) => [x + k * Math.sin(y * 7.1 + z * 5.3), y, z + k * Math.sin(x * 6.7 + y * 4.9)];
  const a = atelier();
  // ---- La Sagrada Família, au fond (à l'est) : le socle, la façade et son grand portail, le rose, les niches ; huit tours percées
  const xS = 265.2, zS = 104;
  a.ovale(1, SABLE2, { x: xS - 0.2, y: yM + 0.2, z: zS, sx: 4.0, sy: 1.0, sz: 10.2, nuance: 0.03 }, 12);
  a.boite(3.4, 6.4, 13, SABLE1, { x: xS + 1.2, y: yM + 3.6, z: zS, nuance: 0.02, deformer: taille(0.05) });
  const portail = (zc, l, h, c = SABLE4) => {
    const s = new THREE.Shape();
    s.moveTo(-l / 2, 0); s.lineTo(-l / 2, h * 0.5); s.quadraticCurveTo(-l * 0.36, h * 0.84, 0, h); s.quadraticCurveTo(l * 0.36, h * 0.84, l / 2, h * 0.5); s.lineTo(l / 2, 0); s.lineTo(-l / 2, 0);
    a.piece(new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: false }), c, { x: xS - 0.56, y: yM + 0.7, z: zc, ry: PI / 2, trait: false });
    // la voussure : deux arcs de sable autour
    for (const k of [1.0, 1.16]) { const pts = []; for (let t = 0; t <= 1.001; t += 0.1) { const u = t * 2 - 1; pts.push([xS - 0.62, yM + 0.7 + h * k * (0.5 + 0.5 * (1 - u * u) ** 0.8), zc + u * (l / 2) * k]); } a.tube(pts, 0.1, SABLE3, { trait: false }); }
  };
  portail(zS, 3.2, 5.2); portail(zS - 3.9, 2.2, 3.6); portail(zS + 3.9, 2.2, 3.6);
  // les personnages de la Nativité : de petites silhouettes, en rangs au-dessus du portail ; les colonnes qui le séparent
  for (let r = 0; r < 3; r++) for (let k = -5 + r; k <= 5 - r; k++) { const zf = zS + k * 0.56, yf = yM + 4.3 + r * 0.72 - Math.abs(k) * 0.03; a.cylindre(0.1, 0.15, 0.42, 6, SABLE3, { x: xS - 0.62, y: yf, z: zf }).ovale(0.1, SABLE3, { x: xS - 0.62, y: yf + 0.3, z: zf }, 5); }
  for (const u of [-1.95, 1.95]) a.cylindre(0.22, 0.28, 5.2, 8, SABLE3, { x: xS - 0.6, y: yM + 3.2, z: zS + u });
  a.piece(new THREE.TorusGeometry(0.9, 0.14, 6, 18), SABLE3, { x: xS - 0.58, y: yM + 6.0, z: zS, ry: PI / 2, trait: false }).ovale(0.82, SABLE4, { x: xS - 0.5, y: yM + 6.0, z: zS, sx: 0.08 }, 12);
  const tour = (x, z, r, h) => {
    a.piece(new THREE.CylinderGeometry(r * 0.16, r, h, 8, 8), SABLE1, { x, y: yM + 1 + h / 2, z, nuance: 0.03, deformer: (px, py, pz) => { const k = 1 + 0.05 * Math.sin(py * 6.5); return [px * k, py, pz * k]; } });
    // les fentes de la tour (des bandes sombres qui montent en biais) ; son bouquet de boules, au sommet
    const n = Math.floor(h / 0.75);
    for (let k = 1; k < n; k++) { const y = yM + 1 + (k / n) * h, rr = r * (1 - (k / n) * 0.68), t = k * 0.7; a.boite(0.16, 0.34, 0.1, SABLE4, { x: x + Math.cos(t + PI) * (rr + 0.01), y, z: z + Math.sin(t + PI) * (rr + 0.01), ry: -t, trait: false }); }
    a.boite(r * 0.18, r * 0.86, r * 0.18, SABLE3, { x, y: yM + 1 + h + r * 0.4, z }).boite(r * 0.66, r * 0.16, r * 0.16, SABLE3, { x, y: yM + 1 + h + r * 0.5, z }).boite(r * 0.16, r * 0.16, r * 0.66, SABLE3, { x, y: yM + 1 + h + r * 0.5, z });
    for (let k = 0; k < 8; k++) { const t = (k / 8) * 2 * PI; a.ovale(r * 0.1, SABLE3, { x: x + Math.cos(t) * r * 0.3, y: yM + 1 + h - r * 0.16, z: z + Math.sin(t) * r * 0.3, trait: false }, 5); }
  };
  for (const [dz, h] of [[-1.5, 10.4], [1.5, 10.4], [-4.6, 9.2], [4.6, 9.2]]) tour(xS + 1.0, zS + dz, 1.0, h);
  for (const [dz, h] of [[-3, 8.3], [3, 8.3], [-6.4, 6.6], [6.4, 6.6]]) tour(xS + 2.6, zS + dz, 0.8, h);
  // (la grue du chantier, un clin d'œil : la basilique n'est pas finie ; son mât sort du socle, sa flèche passe sous le toit)
  a.boite(0.24, 9.0, 0.24, SABLE2, { x: xS + 2.6, y: yM + 5.5, z: zS + 7.2, trait: false }).boite(3.2, 0.2, 0.2, SABLE2, { x: xS + 2.0, y: yM + 9.9, z: zS + 7.2, trait: false });

  // ---- L'Alhambra, le long du mur nord : la longue arcade en fer à cheval, sa frise de dentelle, ses deux tours crénelées ; la fontaine aux lions, devant
  const xA = 253, zA = 88.8, L = 12;
  a.boite(L + 1.2, 0.5, 3.8, SABLE2, { x: xA, y: yM + 0.25, z: zA, nuance: 0.02 });
  {
    const s = new THREE.Shape(), H = 4.0;
    s.moveTo(-L / 2, 0); s.lineTo(L / 2, 0); s.lineTo(L / 2, H); s.lineTo(-L / 2, H); s.lineTo(-L / 2, 0);
    const n = 7, pas = L / n;
    for (let k = 0; k < n; k++) {
      const c = -L / 2 + (k + 0.5) * pas, r = pas * 0.34, h = new THREE.Path(), yb = 2.1;
      h.moveTo(c - r * 0.8, 0.12); h.lineTo(c - r * 0.8, yb - r * 0.1); h.absarc(c, yb, r, PI * 1.15, -PI * 0.15, true); h.lineTo(c + r * 0.8, 0.12); h.lineTo(c - r * 0.8, 0.12);
      s.holes.push(h);
    }
    a.piece(new THREE.ExtrudeGeometry(s, { depth: 0.5, bevelEnabled: false }), SABLE1, { x: xA, y: yM + 0.5, z: zA + 0.5, ry: 0, nuance: 0.02 });
    a.boite(L, 4.0, 0.3, SABLE4, { x: xA, y: yM + 2.5, z: zA - 0.5, trait: false });
    for (let k = 0; k < 44; k++) { a.boite(0.14, 0.14, 0.05, k % 2 ? SABLE3 : SABLE4, { x: xA - L / 2 + 0.14 + k * 0.268, y: yM + 3.72 + (k % 2 ? 0.1 : 0), z: zA + 1.03, rz: PI / 4, trait: false }); }
    for (const u of [-1, 1]) {
      a.boite(2.2, 6.4, 3.2, SABLE1, { x: xA + u * (L / 2 + 0.6), y: yM + 3.2 + 0.4, z: zA, nuance: 0.02, deformer: taille(0.03) });
      for (let k = -1; k <= 1; k++) a.boite(0.42, 0.56, 0.42, SABLE3, { x: xA + u * (L / 2 + 0.6) + k * 0.74, y: yM + 7.1, z: zA + 1.4 });
      for (let k = -1; k <= 1; k++) a.boite(0.42, 0.56, 0.42, SABLE3, { x: xA + u * (L / 2 + 0.6) + k * 0.74, y: yM + 7.1, z: zA - 1.4 });
      for (const v of [2.2, 3.5, 4.8]) a.boite(0.8, 0.5, 0.05, SABLE4, { x: xA + u * (L / 2 + 0.6), y: yM + v, z: zA + 1.62, trait: false });
    }
    // la fontaine et ses lions
    a.cylindre(1.1, 1.2, 0.5, 14, SABLE3, { x: xA, y: yM + 0.5 + 0.25, z: zA + 2.2 }).cylindre(0.7, 0.2, 0.3, 12, SABLE1, { x: xA, y: yM + 1.5, z: zA + 2.2 }).cylindre(0.12, 0.16, 0.62, 8, SABLE1, { x: xA, y: yM + 1.1, z: zA + 2.2 });
    for (let k = 0; k < 8; k++) {
      const t = (k / 8) * 2 * PI, rl = 1.24, xl = xA + Math.cos(t) * rl, zl = zA + 2.2 + Math.sin(t) * rl * 0.7;
      a.ovale(0.2, SABLE1, { x: xl, y: yM + 0.72, z: zl, sx: 1.4, sy: 0.9, ry: -t, trait: false }, 6).ovale(0.13, SABLE3, { x: xl + Math.cos(t) * 0.24, y: yM + 0.9, z: zl + Math.sin(t) * 0.24, trait: false }, 6);
    }
  }
  // ---- Don Quichotte, dans le coin nord-ouest : le moulin, le cheval maigre, le chevalier et sa lance, le nom dans le socle
  const xQ = 242.2, zQ = 90.2;
  a.boite(5.2, 0.5, 6.6, SABLE2, { x: xQ, y: yM + 0.25, z: zQ, nuance: 0.03 });
  a.cylindre(0.9, 1.3, 3.6, 10, SABLE1, { x: xQ - 1.1, y: yM + 2.3, z: zQ - 1.8 }).piece(new THREE.ConeGeometry(1.05, 1.0, 10), SABLE3, { x: xQ - 1.1, y: yM + 4.6, z: zQ - 1.8 });
  for (let k = 0; k < 4; k++) { const t = k * (PI / 2) + 0.4; a.boite(0.42, 2.4, 0.05, SABLE3, { x: xQ - 1.1 + Math.sin(t) * 1.3, y: yM + 4.2 + Math.cos(t) * 1.3, z: zQ - 0.8, rz: -t, trait: false }); }
  {
    const yc = yM + 0.5, xc = xQ + 0.5, zc = zQ + 0.7, dir = 0.5, k = 1.5;
    const R = (dx, y, dz, o = {}) => ({ ordre: 'YXZ', ...o, x: xc + k * (dx * Math.cos(dir) + dz * Math.sin(dir)), y: yc + k * y, z: zc + k * (-dx * Math.sin(dir) + dz * Math.cos(dir)), ry: dir + (o.ry || 0) });
    a.ovale(0.5 * k, SABLE1, R(0, 1.05, 0, { sx: 0.6, sy: 0.72, sz: 1.5 }), 10);
    for (const [dx, dz] of [[-0.2, -0.56], [0.2, -0.56], [-0.2, 0.56], [0.2, 0.56]]) a.boite(0.13 * k, 0.9 * k, 0.14 * k, SABLE3, R(dx, 0.45, dz));
    a.boite(0.24 * k, 0.8 * k, 0.3 * k, SABLE1, R(0, 1.5, 0.78, { rx: 0.5 })).ovale(0.2 * k, SABLE3, R(0, 1.84, 1.08, { sy: 0.8, sz: 1.5 }), 8);
    a.cylindre(0.2 * k, 0.28 * k, 0.7 * k, 10, SABLE3, R(0, 1.82, -0.05)).ovale(0.2 * k, SABLE3, R(0, 2.32, -0.02), 8).cylindre(0.05 * k, 0.26 * k, 0.14 * k, 10, SABLE1, R(0, 2.46, -0.02));
    { const q0 = R(-0.3, 1.7, -0.5), q1 = R(0.1, 2.2, 1.9); a.baton([q0.x, q0.y, q0.z], [q1.x, q1.y, q1.z], 0.045, SABLE4, 5); const q2 = R(-0.42, 1.4, 0.3); a.boite(0.05 * k, 0.5 * k, 0.4 * k, SABLE3, q2); }
  }
  a.boite(0.05, 0.42, 2.6, SABLE4, { x: xQ + 2.62, y: yM + 0.25, z: zQ + 1.2, trait: false });
  ecrire({ x: xQ + 2.65, y: yM, z: zQ + 1.2, ry: PI / 2 }, { texte: 'Don Quijote', x: 0, y: 0.25, z: 0, l: 2.4, h: 0.36, fond: null, encre: '#7a5f38' });
  // ---- La salamandre de Gaudí (le parc Güell), au milieu : ses marches, son corps tout en écailles, sa gueule ouverte
  const xD = 254, zD = 107;
  for (let k = 0; k < 3; k++) a.boite(4.4 - k * 0.9, 0.34, 3.6 - k * 0.5, k % 2 ? SABLE2 : SABLE1, { x: xD, y: yM + 0.17 + k * 0.34, z: zD, nuance: 0.02 });
  {
    const pts = [[xD + 1.9, yM + 1.1, zD + 0.5], [xD + 0.9, yM + 1.3, zD + 0.15], [xD - 0.1, yM + 1.2, zD - 0.3], [xD - 1.0, yM + 1.45, zD - 0.1], [xD - 1.6, yM + 1.75, zD + 0.25]];
    a.tronc(pts, [0.06, 0.26, 0.42, 0.34, 0.26], SABLE1, 8, { nuance: 0.03 });
    for (let k = 0; k < 30; k++) { const f = k / 29, i = Math.min(3, Math.floor(f * 4)), u = f * 4 - i, p0 = pts[i], p1 = pts[i + 1], t = k * 1.9, r = [0.06, 0.26, 0.42, 0.34, 0.26][i] * 0.98; a.ovale(0.07, k % 2 ? SABLE3 : SABLE4, { x: melange(p0[0], p1[0], u), y: melange(p0[1], p1[1], u) + Math.abs(Math.sin(t)) * r, z: melange(p0[2], p1[2], u) + Math.cos(t) * r, sy: 0.5, trait: false }, 5); }
    a.ovale(0.3, SABLE1, { x: xD - 1.82, y: yM + 1.9, z: zD + 0.35, sx: 1.3, sy: 0.7, sz: 0.9 }, 8).ovale(0.24, SABLE4, { x: xD - 2.0, y: yM + 1.8, z: zD + 0.38, sx: 1.2, sy: 0.35, sz: 0.8, trait: false }, 6);
    for (const dz of [-0.2, 0.2]) a.ovale(0.06, SABLE3, { x: xD - 1.88, y: yM + 2.06, z: zD + 0.35 + dz }, 5);
    for (const [dx, dz] of [[0.6, 0.55], [0.6, -0.5], [-0.8, 0.45], [-0.8, -0.55]]) a.tronc([[xD + dx, yM + 1.25, zD + dz * 0.6], [xD + dx - 0.1, yM + 1.1, zD + dz * 1.4], [xD + dx - 0.15, yM + 0.72, zD + dz * 1.7]], [0.11, 0.08, 0.1], SABLE1, 6);
  }
  // ---- La sculpture en cours, près de l'escalier : un petit chameau de sable, à moitié sorti du tas, la truelle et le seau à côté
  const xC = 246.6, zC = 109.4;
  a.ovale(1.3, SABLE2, { x: xC, y: yM + 0.3, z: zC, sx: 1.25, sy: 0.75, sz: 1.0, nuance: 0.04 }, 10);
  a.ovale(0.5, SABLE3, { x: xC + 0.1, y: yM + 1.25, z: zC, sx: 1.3, sy: 0.7, sz: 0.62 }, 8).ovale(0.27, SABLE1, { x: xC - 0.2, y: yM + 1.6, z: zC, sy: 0.9 }, 7).ovale(0.27, SABLE1, { x: xC + 0.4, y: yM + 1.6, z: zC, sy: 0.9 }, 7).boite(0.16, 0.56, 0.18, SABLE3, { x: xC + 0.88, y: yM + 1.6, z: zC, rz: -0.3 }).ovale(0.15, SABLE3, { x: xC + 1.04, y: yM + 1.92, z: zC, sx: 1.4, sy: 0.8 }, 6);
  a.cylindre(0.16, 0.13, 0.3, 10, '#2f6ab0', { x: xC - 1.7, y: yM + 0.15, z: zC + 0.9 }).boite(0.28, 0.02, 0.12, '#9a9ea2', { x: xC - 1.42, y: yM + 0.02, z: zC + 1.0, ry: 0.5, trait: false });
  // les lisses basses tout autour (une seule, de la galerie au mur nord)
  garde(a, [[Mu.x0 - 0.4, 94.6], [246, 94.6], [246, 93.4], [260, 93.4], [260, 114], [Mu.x1 + 0.4, 114]]);
  garde(a, [[251, 104], [257, 104], [257, 110], [251, 110], [251, 104]]);
  poser(a.fin(), 0, 0, { y: 0, recoit: false });
  // les plaques : le thème, au mur de l'entrée ; devant la Sagrada Família, le pupitre où l'on s'arrête (le tampon)
  const b = atelier(), xP = 258.7, zP = 104;
  b.baton([xP, yM, zP], [xP, yM + 0.98, zP], 0.04, '#5e4028', 6).boite(0.5, 0.05, 0.8, '#7a5a3c', { x: xP, y: yM + 1.0, z: zP, rz: 0.35 });
  poser(b.fin(), 0, 0, { y: 0 });
  ecrire({ x: xP + 0.025, y: yM, z: zP, ry: -PI / 2, }, { texte: 'サグラダ・ファミリア', x: 0, y: 1.04, z: -0.0, l: 0.62, h: 0.14, fond: '#f4efe2', encre: '#2a2420' });
  return { pupitre: { x: xP - 0.8, z: zP }, vers: [xS, zS], chantier: { x: xC, z: zC, r: 1.8 }, poteau: { x: xP, z: zP } };
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
    noms: { liftBas: 'Le préposé du télésiège', liftHaut: 'La préposée du télésiège', centreCaisse: 'La vendeuse', centreClient: 'Le client', vieuxHaut: 'Le vieux monsieur', filleHaut: 'La jeune fille', chauffeur: 'Le chauffeur', garde: 'Le garde du parc', vendeuseR: 'La vendeuse', vendeuseF: 'Le vendeur', kaikan: 'La dame de la caisse', serveuse: 'La serveuse', cuisinier: 'Le cuisinier', dineur: 'Le client', dineuse: 'La cliente', chamelier: 'Le chamelier', moniteur: 'Le moniteur', naturaliste: 'La naturaliste', videaste: '@random_japan_place', amoureuse: 'La touriste', amoureux: 'Le touriste', enfant: 'Le petit garçon', maman: 'La maman', pilote: 'Le pilote', pecheur: 'Le pêcheur', sculpteur: 'Le sculpteur', accueil: 'L’hôtesse', visiteur: 'Le visiteur', visiteuse: 'La grand-mère', galerie: 'La visiteuse', marcheur: 'Le randonneur', grimpeur: 'Le grimpeur', randonneuse: 'La promeneuse', plagiste: 'La promeneuse', vieux: 'Le vieil homme' },
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
    moniteur: ['Yo ! La planche de sable, ça te dit ? D’ici jusqu’à la plage, tout droit ou en zigzag.', 'Ton compagnon peut s’asseoir devant. On y va ?'],
    moniteurEncore: ['Encore une descente ? Il faut remonter à pied, je te préviens : c’est ça, le vrai sport !'],
    moniteurConsigneOrdi: ['Pour tourner, les flèches gauche et droite (ou A et D). La pente fait le reste !'],
    moniteurConsigneTel: ['Pour tourner, pousse le joystick à gauche et à droite. La pente fait le reste !'],
    plancheFin: ['Tu arrives sur la plage, du sable plein les chaussures. Derrière toi, ta trace descend tout droit de la crête.', 'Maintenant, il n’y a plus qu’à remonter…'],
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
    jumellesHaut: ['Des jumelles, tournées vers la mer.'],
    jumellesHautVue: ['Le Dos de cheval, tout au bout : des gens minuscules, en file sur la crête. Et derrière eux, toute la mer du Japon.'],
    jumellesHautNuit: ['Trop noir pour y voir quoi que ce soit. Rien que la lune, au-dessus du sable.'],
    centreCaisse: ['Bienvenue au Sakyu Center ! Ici, c’est surtout des gâteaux et des souvenirs de Tottori.', 'Et à côté, le restaurant : le bol de fruits de mer, le chanpon au bouillon d’os de bœuf, le burger au crabe avec un jus de poire Nijisseiki !'],
    centreClient: ['Un chanpon au bouillon d’os de bœuf, avec cette vue… Je ne repars pas tout de suite.'],
    vieuxHaut: ['Je viens ici chaque année. D’en bas, ce sont des montagnes de sable ; d’ici, on voit enfin leur dessin.', 'Et ce n’est qu’un morceau : le sable court sur seize kilomètres, le long de la côte.'],
    filleHaut: ['Tu vois ces petits points, sur la crête ? Ce sont des gens ! Je les ai comptés jusqu’à ce que mes yeux piquent.'],
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
    noms: { liftBas: 'The chairlift attendant', liftHaut: 'The chairlift attendant', centreCaisse: 'The shopkeeper', centreClient: 'The customer', vieuxHaut: 'The old man', filleHaut: 'The young woman', chauffeur: 'The driver', garde: 'The park ranger', vendeuseR: 'The shopkeeper', vendeuseF: 'The shopkeeper', kaikan: 'The cashier', serveuse: 'The waitress', cuisinier: 'The cook', dineur: 'The customer', dineuse: 'The customer', chamelier: 'The camel driver', moniteur: 'The instructor', naturaliste: 'The naturalist', videaste: '@random_japan_place', amoureuse: 'The tourist', amoureux: 'The tourist', enfant: 'The little boy', maman: 'The mother', pilote: 'The pilot', pecheur: 'The fisherman', sculpteur: 'The sculptor', accueil: 'The host', visiteur: 'The visitor', visiteuse: 'The grandmother', galerie: 'The visitor', marcheur: 'The hiker', grimpeur: 'The climber', randonneuse: 'The walker', plagiste: 'The walker', vieux: 'The old man' },
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
    moniteur: ['Yo! Fancy some sandboarding? From here down to the beach, straight or zigzag.', 'Your companion can sit in front. Shall we?'],
    moniteurEncore: ['Another run? You have to walk back up, I warn you: that’s the real sport!'],
    moniteurConsigneOrdi: ['To turn, use the left and right arrows (or A and D). The slope does the rest!'],
    moniteurConsigneTel: ['To turn, push the joystick left and right. The slope does the rest!'],
    plancheFin: ['You reach the beach with sand in your shoes. Behind you, your track runs all the way down from the ridge.', 'Now all that’s left is to climb back up…'],
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
    jumellesHaut: ['A pair of binoculars, aimed at the sea.'],
    jumellesHautVue: ['The Horse’s Back, far away: tiny people in a line along the crest. And behind them, the whole Sea of Japan.'],
    jumellesHautNuit: ['Too dark to see anything. Only the moon, above the sand.'],
    centreCaisse: ['Welcome to the Sakyu Center! Here it’s mostly sweets and souvenirs from Tottori.', 'And next door, the restaurant: the seafood bowl, the beef-bone chanpon, the crab burger with a Nijisseiki pear juice!'],
    centreClient: ['A beef-bone chanpon, with this view… I’m not leaving just yet.'],
    vieuxHaut: ['I come here every year. From below, they’re mountains of sand; from here, you finally see the pattern.', 'And that’s only a piece of it: the sand runs for sixteen kilometers along the coast.'],
    filleHaut: ['See those little dots on the crest? They’re people! I counted them until my eyes stung.'],
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
    noms: { liftBas: 'リフトの　かかりいん', liftHaut: 'リフトの　かかりいん', centreCaisse: 'おみせの　人', centreClient: 'おきゃくさん', vieuxHaut: 'おじいさん', filleHaut: 'おねえさん', chauffeur: 'うんてんしゅ', garde: 'こうえんの　レンジャー', vendeuseR: 'お店の人', vendeuseF: 'お店の人', kaikan: 'レジの　おばさん', serveuse: 'ウェイトレス', cuisinier: '料理人', dineur: 'お客さん', dineuse: 'お客さん', chamelier: 'らくだつかい', moniteur: 'インストラクター', naturaliste: 'しぜんの　けんきゅう者', videaste: '@random_japan_place', amoureuse: 'かんこうきゃく', amoureux: 'かんこうきゃく', enfant: '男の子', maman: 'お母さん', pilote: 'パイロット', pecheur: 'つり人', sculpteur: 'ちょうこく家', accueil: 'うけつけの人', visiteur: 'お客さん', visiteuse: 'おばあさん', galerie: 'お客さん', marcheur: 'ハイカー', grimpeur: 'のぼる人', randonneuse: 'さんぽの人', plagiste: 'さんぽの人', vieux: 'おじいさん' },
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
    moniteur: ['よっ！　サンドボード、やってみる？　ここから　はままで、まっすぐでも　ジグザグでも。', '友だちは　前に　すわれるよ。行く？'],
    moniteurEncore: ['もう一回？　帰りは　歩いて　のぼるんだよ。それが　本当の　スポーツさ！'],
    moniteurConsigneOrdi: ['曲がるには　左右の　矢印キー（A・D）。あとは　坂が　やってくれる！'],
    moniteurConsigneTel: ['曲がるには　ジョイスティックを　左右に。あとは　坂が　やってくれる！'],
    plancheFin: ['はまに　とうちゃく。くつの中まで　すなだらけ。ふりかえると　尾根から　きみの　あとが　のびている。', 'さあ、あとは　のぼるだけ……'],
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
    jumellesHaut: ['海の方を　向いた　そうがんきょう。'],
    jumellesHautVue: ['ずっと　向こうに　馬の背。小さな　人たちが　尾根に　ならんでいる。その　向こうは、日本海。'],
    jumellesHautNuit: ['暗くて　なにも　見えない。砂の上に、月だけ。'],
    centreCaisse: ['砂丘センターへ　ようこそ！　おかしと　鳥取の　おみやげが　たくさん　あるよ。', 'となりは　レストラン。海鮮彩り丼、牛骨ちゃんぽん、かにバーガーに　二十世紀梨の　ジュース！'],
    centreClient: ['牛骨ちゃんぽんを　食べながら、この　ながめ。まだ　帰れないなあ。'],
    vieuxHaut: ['毎年　ここに　来るんだ。下から　見れば　砂の山、ここから　見れば　もようが　わかる。', 'それも　ほんの　一部。砂丘は　海岸に　そって　16キロも　つづくんだよ。'],
    filleHaut: ['尾根の　小さな　点、見える？　あれ、ぜんぶ　人なんだよ！　数えてたら　目が　いたくなっちゃった。'],
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
