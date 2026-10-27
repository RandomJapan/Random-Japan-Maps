// ================================================================
//  Le Pavillon d'or (金閣寺, Kinkaku-ji ; de son vrai nom Rokuon-ji, 鹿苑寺), au nord-ouest de Kyoto, au pied du mont
//  Kinugasa (2026-10-26 : le sixième lieu de la balade, choisi par le propriétaire, « recréer le lieu avec précision », d'après
//  son TikTok et des recherches). Le shogun Ashikaga Yoshimitsu fit bâtir sa villa du Kitayama en 1397 ; à sa mort, elle devint
//  un temple zen. Le pavillon des reliques (舎利殿) se dresse au bord de l'étang-miroir (鏡湖池) : trois étages, trois styles,
//  le rez-de-chaussée en bois brut de palais (法水院), le premier étage de maison de guerrier (潮音洞) et le dernier de temple
//  zen (究竟頂, aux fenêtres en cloche), ces deux-là couverts de feuilles d'or ; sur le toit, un phénix d'or. Brûlé en 1950,
//  rebâti en 1955. Autour, un jardin de promenade : l'étang et ses îles de pins (葦原島, 鶴島, 亀島), ses rochers offerts par
//  les seigneurs, le pin en forme de barque (陸舟の松), derrière le pavillon les sources du thé et des mains de Yoshimitsu
//  (銀河泉, 巌下水), les haies de bambou (金閣寺垣), la cascade de la Porte du Dragon et sa pierre-carpe (龍門滝, 鯉魚石), les
//  statues où l'on lance des pièces, l'étang Anmintaku et le tertre du serpent blanc (安民沢, 白蛇の塚), le pavillon de thé
//  du soir (夕佳亭), le bureau des goshuin et la salle de Fudō (不動堂). Les lieux sont un peu rapprochés.
//  Son secret : le phénix du reflet. La nuit, dans le reflet de l'étang, le toit du pavillon est vide (contexteAnime.refleter :
//  le phénix est sur le calque 2) ; il est allé boire à la source de la Voie lactée (銀河泉), où l'on ne voit que son reflet,
//  sous les étoiles. Il y laisse une plume d'or, et un koban (tresors.js).
//  Repère : x vers l'est, z vers le sud, y vers le haut, en mètres ; le milieu du pavillon en (0, 0), le jardin à y = 0,
//  l'étang à −0,55 ; la colline au nord (Anmintaku à 4,6). ctx : { THREE, atelier, P (palette), peinture, perso, maillage }.
// ================================================================
import { creerMonde, interactionsBancs, lisse, hasard, bruitDoux, surLaLigne } from './monde.js';
import { panneau, trepied, PAPIER_PANNEAU } from './decor.js';
import { MATIERES as M } from './textures.js';
import { secretTrouve, indiceVu } from './tresors.js';
import { fabriquerCarpe, nager, onduler } from './carpes.js';

const PI = Math.PI;

// ---------------------------------------------------------------- Le plan
// l'étang-miroir (鏡湖池) : le niveau de l'eau, le fond ; son bord [x, z] (le pavillon posé sur sa rive nord, l'eau au sud et
// à l'ouest de sa base de pierre ; au nord-ouest, un bras d'eau derrière lui). D'après la photo aérienne de l'institut
// géographique (地理院地図), le pavillon au milieu : environ 90 m d'est en ouest, 75 du nord au sud
const EAU = -0.55, FOND = -1.3;
const ETANG = [
  [7.6, 6.4], [-7.6, 6.4], [-7.6, -5.8], [-9.6, -9.8], [-14.2, -13.2], [-21, -15.6], [-29, -15.6], [-37, -12.6], [-44, -6.6],
  [-48.4, 2.4], [-50, 13.6], [-48, 25], [-43.4, 35], [-36.4, 43.4], [-27, 50.4], [-15.6, 55.4], [-3, 57.4], [9, 56.4], [20, 53.4],
  [29, 48.4], [35, 41.4], [38.6, 33], [39.6, 23.4], [37.8, 14], [33, 7.6], [25.6, 3.6], [16.6, 2.4], [10, 2.8],
];
// les îles : le grand Ashiharajima (葦原島, « la plaine des roseaux », le Japon des mythes ; en forme de barque), l'île de la
// grue (鶴島) et celle de la tortue (亀島), trois îlots ; [x, z] le milieu, rx, rz les demi-axes, ry le tour, h la hauteur
const ILES = [
  { id: 'ashihara', x: -2, z: 31, rx: 13.5, rz: 5.2, ry: -0.1, h: 0.45 },
  { id: 'tsuru', x: -33, z: 4.5, rx: 3.6, rz: 3.0, ry: 0.4, h: 0.4 },
  { id: 'kame', x: -13, z: 16.5, rx: 3.3, rz: 2.4, ry: -0.3, h: 0.35 },
  { id: 'i1', x: -25, z: 35, rx: 1.7, rz: 1.4, ry: 0.2, h: 0.3 },
  // (pas sur la ligne du belvédère au pavillon : il cachait le milieu du reflet)
  { id: 'i2', x: 27.4, z: 27, rx: 1.5, rz: 1.2, ry: 0.9, h: 0.3 },
  { id: 'i3', x: -41, z: 21, rx: 1.4, rz: 1.1, ry: 0.5, h: 0.25 },
];
// les rochers nommés, dans l'eau : le « rocher des neuf montagnes et des huit mers » (九山八海石, le mont Meru au milieu du
// monde, rapporté de Chine, dit-on, par Yoshimitsu), juste devant le pavillon ; ceux qu'offrirent les seigneurs Hatakeyama,
// Akamatsu et Hosokawa
const ROCHES = {
  kuzan: { x: 3.2, z: 12.5, r: 1.15, h: 1.3 }, hatakeyama: { x: -9.5, z: 9.5, r: 0.9, h: 0.62 },
  akamatsu: { x: 12.5, z: 9.2, r: 0.8, h: 0.55 }, hosokawa: { x: 8.6, z: 27.6, r: 0.95, h: 0.5 },
};
// le pavillon : ses poteaux (5 travées sur 4 ; la base de pierre 0,7 m plus loin), le plancher, les étages ; le petit pavillon
// du bord de l'eau (漱清), à l'ouest, sur ses poteaux dans l'eau
const KK = {
  L: 12.3, P: 9.8, sol: 0.8, h1: 3.9, sol2: 4.1, h2: 6.75, toit2: 7.0, sol3: 8.15, L3: 7.2, h3: 10.15, toit3: 10.25, faite: 12.05,
  travees: [2.25, 2.45, 2.9, 2.45, 2.25], travees3: [2.2, 2.8, 2.2],
};
const SOSEI = { x: -10.4, z: 0.6, l: 3.0, p: 3.4, sol: 0.62 };
// le départ : au belvédère de la rive sud-est, d'où l'on prend la photo de carte postale (le pavillon et son reflet)
const DEPART = { x: 29.7, z: 53.0 };
// les allées (de sable damé) : [x, z] le long de chacune, w la demi-largeur où l'on marche ; escalier : des marches de pierre
const CHEMINS = [
  // l'entrée : du portail (総門) au belvédère, entre le guichet, la cloche, le grand chêne, le mur du hōjō
  { pts: [[97, 60.4], [86, 60.6], [76, 60.2], [66, 59.6], [56, 59], [48, 57.6], [40, 56.2], [34.5, 54.6]], w: 2.3 },
  // le long de la rive est : du belvédère au pavillon (le hōjō à droite)
  { pts: [[36.5, 49.8], [42.8, 43.2], [45.4, 30], [44.6, 20], [41.4, 12.2], [34.4, 5.6], [25.6, 0.6], [16.4, -1.8], [10.6, -4.2]], w: 1.6 },
  // le jardin du pin en barque (une avancée vers sa cour)
  { pts: [[44.6, 16.4], [50.2, 15.2]], w: 1.05 },
  // derrière le pavillon, le long du bras d'eau du nord-ouest
  { pts: [[10.6, -4.2], [9.6, -10.6], [3, -14.8], [-6, -17.8], [-14, -19.8], [-20.6, -21.6], [-25.2, -23.2]], w: 1.5 },
  // au pied de la colline : le sanctuaire Shin'un, les deux sources, le petit pont du Ravin du Tigre, la cascade
  { pts: [[-25.2, -23.2], [-22, -27.6], [-15, -29.6], [-8, -30.8], [-1, -32.6], [5, -35], [10, -38.6], [15, -42], [21, -45], [25.6, -46.2]], w: 1.5 },
  // l'escalier de pierre vers l'étang Anmintaku
  { pts: [[25.6, -46.2], [26.6, -52.4], [27, -59.4]], w: 1.2, escalier: true },
  // le long de l'étang Anmintaku ; le belvédère d'où l'on voit le haut du pavillon par-dessus les pins
  { pts: [[27, -59.4], [22, -63.4], [13, -64.6], [5, -63.8], [-1.6, -61.6]], w: 1.5 },
  // le pavillon du thé du soir (夕佳亭), le salon de thé, le bureau des goshuin, la salle de Fudō
  { pts: [[22, -63.4], [31, -66.6], [40, -68.2], [48, -66.6], [56, -63.4], [64, -60.8], [72, -58.2], [79, -55.6]], w: 1.6 },
  // l'escalier qui descend de la salle de Fudō vers la sortie, puis l'allée de sortie, qui revient à l'entrée
  { pts: [[79.4, -54.6], [82.6, -48.6], [85, -41.6]], w: 1.3, escalier: true },
  { pts: [[85, -41.6], [88, -30], [90.4, -16], [92, 0], [93, 16], [93.4, 32], [93, 48], [92.4, 59.6]], w: 1.8 },
];
// les places (où l'on s'arrête) : [x, z, rayons en x et en z, tour]
const PLACES = [
  // le belvédère de la carte postale, le long de la rive sud-est (son grand axe le long de la rive) ; la tour de Jōzō à son bout
  { x: 29.7, z: 53.0, rx: 8.6, rz: 3.4, ry: 0.67 },
  { x: 22.4, z: 59.4, rx: 2.2, rz: 1.8, ry: 0 },
  // la cour d'entrée, devant le guichet et la cloche
  { x: 78, z: 62.4, rx: 9, rz: 4.4, ry: 0 },
  // derrière le pavillon, le coin d'où l'on voit son côté nord et le petit pavillon du bord de l'eau
  { x: -21.4, z: -22.8, rx: 3.4, rz: 2.4, ry: 0.3 },
  // devant les statues où l'on lance des pièces
  { x: 23.8, z: -44.6, rx: 2.8, rz: 2.2, ry: 0.4 },
  // le belvédère au-dessus du pavillon
  { x: -2.4, z: -61, rx: 2.4, rz: 1.8, ry: 0.2 },
  // la place du salon de thé ; devant la fenêtre du bureau des goshuin (on va jusqu'à son comptoir)
  { x: 51.6, z: -66.2, rx: 4.6, rz: 3.0, ry: -0.3 },
  { x: 63.83, z: -62.72, rx: 2.3, rz: 1.1, ry: -0.3 },
  // la cour de la salle de Fudō
  { x: 79.6, z: -57.2, rx: 6.4, rz: 3.4, ry: 0 },
  // le coin de Bunbuku, sous les érables, entre le pavillon de thé et le salon
  { x: 45.6, z: -63.4, rx: 2.2, rz: 1.6, ry: -0.2 },
];
// les bâtiments du temple (le milieu, les dimensions, le tour : 0, la façade vers le sud)
const HOJO = { x: 59, z: 32, l: 18, p: 15 };
const KURI = { x: 79, z: 38, l: 15, p: 13 };
const KARAMON = { x: 59, z: 44.6 };
const SOMON = { x: 98.4, z: 60.4 };
const SHORO = { x: 70.5, z: 66.8 };
const UKETSUKE = { x: 86.4, z: 65.2 };
const ICHIIGASHI = { x: 60.5, z: 65.6 };
const RIKUSHU = { x: 59.6, z: 12.6 };
// derrière le pavillon
const SHINUN = { x: -23.6, z: -31.6 };
const GINGASEN = { x: -9.2, z: -33.9 }, SOL_SOURCE = 0.1;
const GANKASUI = { x: -1.2, z: -35.9 };
const KOKEI = { x: 12.5, z: -40.3 };
const RYUMON = { x: 15.6, z: -47.6 };
const JIZO = { x: 24.8, z: -42.2 };
// la colline : l'étang Anmintaku et le tertre du serpent blanc, le pavillon du thé du soir, le salon de thé, les goshuin, Fudō
const ANMIN = { x: 12, z: -73.4, rx: 11.6, rz: 6.6, eau: 4.55 };
const HAKUJA = { x: 9.6, z: -74.2, r: 2.1 };
const SEKKA = { x: 41.6, z: -75.2 };
const CHASHO = { x: 52.4, z: -70.6 };
const SHUIN = { x: 64.6, z: -65.2 };
const FUDO = { x: 80, z: -63.6 };
// (la tour de Jōzō, sur la rive sud, au bout du belvédère : on y prie)
const JOZO = { x: 20.2, z: 61.2 };
// Bunbuku le marchand, sous les érables ; son lampion
const MARCHAND = { x: 45.2, z: -63.0, cap: PI - 0.3 };
const LAMPION = { x: MARCHAND.x - 1.04, z: MARCHAND.z + 0.31 };
// les deux bancs de l'allée de sortie, au bord est de l'allée (dans une trouée de la clôture) : [x, z, cap]
const BANCS_SORTIE = [[90.8, 6.0, -PI / 2], [91.0, 26.0, -PI / 2]];
// ce qui est bâti : [x0, x1, z0, z1] (ni arbre ni buisson dedans, ni clôture)
const autour = (o, rx, rz = rx) => [o.x - rx, o.x + rx, o.z - rz, o.z + rz];
const BATIS = [
  [-9.6, 9.6, -8, 8.4], [SOSEI.x - 2.8, -7, SOSEI.z - 2.8, SOSEI.z + 2.8],
  autour(HOJO, HOJO.l / 2 + 2.5, HOJO.p / 2 + 2.5), autour(KURI, KURI.l / 2 + 2.5, KURI.p / 2 + 2.5), [46, 72, 42.6, 46.6],
  // (la pelouse devant le portail du hōjō : on le voit de l'allée)
  [54.5, 63.5, 46.6, 56.6],
  autour(RIKUSHU, 8.6, 5), autour(SOMON, 3.4, 7), autour(SHORO, 3.4), autour(UKETSUKE, 2.6, 2.2), autour(ICHIIGASHI, 4.5),
  autour(SHINUN, 3), autour(GINGASEN, 2.6), autour(GANKASUI, 2.4), autour(KOKEI, 2.4), autour(RYUMON, 4.2, 3.6), autour(JIZO, 3.2, 2.6),
  autour(SEKKA, 6.5, 5), autour(CHASHO, 5, 4), autour(SHUIN, 3.8, 3.2), [FUDO.x - 7.5, FUDO.x + 7.5, FUDO.z - 5.5, FUDO.z + 3], autour(JOZO, 2),
  autour(HAKUJA, HAKUJA.r + 0.5), autour(MARCHAND, 2.2), ...BANCS_SORTIE.map(([x, z]) => autour({ x, z }, 0.6, 1.1)),
];

// ---------------------------------------------------------------- La géométrie du plan
/** La distance signée au bord d'un polygone [[x, z], …] : négative dedans. */
function distPolygone(poly, x, z) {
  let d = Infinity, dedans = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) dedans = !dedans;
    const dx = xi - xj, dz = zi - zj, l = dx * dx + dz * dz || 1;
    const t = Math.min(1, Math.max(0, ((x - xj) * dx + (z - zj) * dz) / l));
    d = Math.min(d, Math.hypot(x - xj - t * dx, z - zj - t * dz));
  }
  return dedans ? -d : d;
}
// (le bord de l'étang ondule un peu, sauf le long de la base de pierre du pavillon, droite)
const ondule = (x, z) => (bruitDoux(x + 7.3, z - 2.1, 3.2) - 0.5) * 1.2 * lisse(1.5, 4, Math.max(Math.abs(x) - 7.6, Math.abs(z) - 6.4));
/** La distance au bord de l'étang-miroir (négative dans l'eau). */
const bordEtang = (x, z) => distPolygone(ETANG, x, z) + ondule(x, z);
/** Dans une île : la distance à son bord, en mètres (négative dedans), et l'île. */
function surIle(x, z) {
  let mieux = Infinity, ile = null;
  for (const I of ILES) {
    const c = Math.cos(I.ry), s = Math.sin(I.ry), u = (x - I.x) * c - (z - I.z) * s, v = (x - I.x) * s + (z - I.z) * c;
    const t = Math.atan2(v, u), k = 1 + 0.12 * Math.sin(t * 3 + I.x) + 0.07 * Math.sin(t * 5 + I.z);
    const d = (Math.hypot(u / I.rx, v / I.rz) - k) * Math.min(I.rx, I.rz);
    if (d < mieux) { mieux = d; ile = I; }
  }
  return { d: mieux, ile };
}
/** Le point le plus proche des allées : la distance au bord de la plus proche (négative dedans), son chemin, sa hauteur. */
function surChemins(x, z) {
  let mieux = Infinity, c = null;
  for (const ch of CHEMINS) {
    if (x < ch.x0 - 4 || x > ch.x1 + 4 || z < ch.z0 - 4 || z > ch.z1 + 4) continue;
    const d = surLaLigne(ch.pts, x, z).d - ch.w;
    if (d < mieux) { mieux = d; c = ch; }
  }
  return { d: mieux, c };
}
for (const ch of CHEMINS) {
  ch.x0 = Math.min(...ch.pts.map((p) => p[0])); ch.x1 = Math.max(...ch.pts.map((p) => p[0]));
  ch.z0 = Math.min(...ch.pts.map((p) => p[1])); ch.z1 = Math.max(...ch.pts.map((p) => p[1]));
}
/** Dans une place (une ellipse) : la distance à son bord en mètres, négative dedans. */
function surPlaces(x, z) {
  let mieux = Infinity;
  for (const p of PLACES) {
    const c = Math.cos(p.ry), s = Math.sin(p.ry), u = (x - p.x) * c - (z - p.z) * s, v = (x - p.x) * s + (z - p.z) * c;
    mieux = Math.min(mieux, (Math.hypot(u / p.rx, v / p.rz) - 1) * Math.min(p.rx, p.rz));
  }
  return mieux;
}

// ---------------------------------------------------------------- Le relief
// le pied de la colline du nord (son z, selon x) : au nord-ouest près du bras d'eau, plus loin vers l'est
const PIED = [[-70, -24], [-25, -26.4], [-5, -33.6], [12, -44.2], [26, -48.6], [45, -50.4], [62, -49.6], [80, -45.6], [95, -38.6], [130, -34]];
function piedColline(x) {
  if (x <= PIED[0][0]) return PIED[0][1];
  for (let i = 1; i < PIED.length; i++) if (x <= PIED[i][0]) { const [x0, z0] = PIED[i - 1], [x1, z1] = PIED[i]; return z0 + ((z1 - z0) * (x - x0)) / (x1 - x0); }
  return PIED[PIED.length - 1][1];
}
// la hauteur des allées de la colline : le long des chemins du haut, leur hauteur voulue (le sol s'y aplanit)
const HAUT_COLLINE = 5.0;
/** La colline, sans les allées : elle monte de son pied (0) au plateau d'Anmintaku (5 m), puis vers la forêt du mont Kinugasa. */
function colline(x, z) {
  const p = piedColline(x);
  let h = HAUT_COLLINE * lisse(p, p - 13, z) + (bruitDoux(x * 0.6, z * 0.6, 9) - 0.5) * 1.1 * lisse(p, p - 6, z);
  // au-delà du plateau, la forêt monte (le mont Kinugasa, à l'ouest, plus haut)
  h += 9 * lisse(-82, -125, z) * (1 + 0.5 * lisse(20, -60, x)) + 4 * lisse(-60, -110, x) * lisse(p - 4, p - 40, z);
  // la salle de Fudō et le salon de thé sur une terrasse un peu plus basse à l'est ; le pavillon du thé un peu plus haut
  h -= 0.6 * lisse(50, 72, x) * lisse(p - 4, p - 12, z);
  h += 1.0 * Math.max(0, 1 - Math.hypot(x - SEKKA.x, z - SEKKA.z + 2) / 12);
  // le belvédère au-dessus du pavillon : une butte
  h += 1.4 * Math.max(0, 1 - Math.hypot(x + 3, z + 62) / 9) ** 1.5;
  return h;
}
/** Le relief au loin : le mont Kinugasa à l'ouest, les montagnes du nord (le mont Ōkita), la ville au sud-est (plate). */
function lointain(x, z) {
  const bosse = (cx, cz, r, h) => { const d = Math.hypot(x - cx, z - cz) / r; return d < 1 ? h * (0.5 + 0.5 * Math.cos(d * PI)) : 0; };
  return bosse(-250, -140, 230, 92) + bosse(-60, -470, 280, 135) + bosse(240, -420, 260, 110) + bosse(-420, 180, 260, 70) + bosse(80, -250, 150, 40)
    + (bruitDoux(x * 0.12, z * 0.12, 6) - 0.5) * 8 * lisse(150, 320, Math.hypot(x - 20, z));
}
// les marches de pierre : leurs lignes [x, z, y] (calculées avec le relief, plus bas)
const MARCHES = [];

function terrain(x, z) {
  // les lointains, puis le jardin (le relief se fond à 140 m du milieu)
  const loin = lointain(x, z), f = lisse(120, 180, Math.hypot(x - 20, z + 5));
  let h = colline(x, z) * (1 - f * 0.4) + loin * f - 2.5 * f * lisse(-10, 60, z) * lisse(60, -40, z - x * 0.3);
  if (f >= 1) return h;
  // l'étang-miroir : son fond, qui descend de la rive (une berge de 25 cm) vers le milieu ; les îles
  const e = bordEtang(x, z);
  if (e < 1.2) {
    const berge = 0.05 + 0.18 * lisse(-0.2, 1.2, e);
    const fond = EAU - 0.18 - (FOND - EAU + 0.18) * -lisse(0, 4.5, -e);
    h = e > 0 ? Math.min(h, berge + (h - berge) * lisse(0, 1.2, e)) : Math.min(h, fond + (berge - fond) * lisse(-0.6, 0, e));
    const i = surIle(x, z);
    if (i.d < 1.6) {
      const dessus = i.ile.h + 0.18 * lisse(0, -3, i.d) + (bruitDoux(x, z, 1.8) - 0.5) * 0.15;
      h = Math.max(h, i.d < 0 ? dessus : EAU - 0.4 + (dessus - EAU + 0.4) * lisse(1.6, 0, i.d));
    }
  }
  // l'étang Anmintaku (dans un creux de la colline) et son île
  const da = Math.hypot((x - ANMIN.x) / ANMIN.rx, (z - ANMIN.z) / ANMIN.rz) + (bruitDoux(x * 1.3, z * 1.3, 2.4) - 0.5) * 0.12;
  if (da < 1.5) {
    const bordA = ANMIN.eau + 0.32;
    h = h + (bordA - h) * lisse(1.5, 1.08, da);
    if (da < 1.05) h = Math.min(h, ANMIN.eau - 0.1 - 0.7 * lisse(1.0, 0.55, da));
    const dh = Math.hypot(x - HAKUJA.x, z - HAKUJA.z) - HAKUJA.r;
    if (dh < 1.0) h = Math.max(h, ANMIN.eau + 0.15 + 0.35 * lisse(0, -1.6, dh) - (dh > 0 ? 0.7 * dh : 0));
  }
  // la cascade de la Porte du Dragon : derrière, le replat d'où vient l'eau (à 3 m), puis le rebord de rochers d'où elle
  // tombe (2,3 m) dans son bassin ; le ruisseau jusqu'à l'étang
  {
    const db = Math.hypot((x - RYUMON.x) / 4.6, (z - RYUMON.z + 3.4) / 3.0);
    if (db < 1.5) h = Math.max(h, 3.0 - 1.4 * lisse(0.75, 1.5, db));
    const dr = Math.hypot(x - RYUMON.x, (z - RYUMON.z - 0.9) * 1.3);
    if (dr < 4.2) h = Math.min(h, 0.5 + (h - 0.5) * lisse(1.5, 3.4, dr));
  }
  // les allées : le sol s'aplanit sous elles (à leur hauteur, qui suit le relief en douceur)
  const c = surChemins(x, z);
  if (c.d < 1.6 && c.c && !c.c.escalier) {
    const ha = hauteurAllee(x, z);
    h = ha + (h - ha) * lisse(0, 1.6, c.d);
  }
  // les replats : sous les bâtiments de la colline et devant eux, le sol aplani (à la hauteur des allées, ou à h : une
  // terrasse taillée dans la pente) ; sur la colline, le sol ondule, et la terrasse de Fudō, sa boîte des oracles, ses
  // lanternes, le torii du sanctuaire Shin'un flottaient (2026-10-27)
  for (const r of REPLATS) {
    const cs = Math.cos(r.ry), sn = Math.sin(r.ry), u = (x - r.x) * cs - (z - r.z) * sn, v = (x - r.x) * sn + (z - r.z) * cs;
    const d = Math.hypot(Math.max(0, Math.abs(u) - r.lx), Math.max(0, Math.abs(v) - r.lz));
    if (d < r.bord && !(r.mur && v > r.lz)) { const hr = r.h ?? hauteurAllee(x, z); h = hr + (h - hr) * lisse(0, r.bord, d); }
  }
  // le ruisseau : son lit creusé (plat sur 1,1 m, ses berges jusqu'à 1,7 m), pas sous les allées, sauf sous ses ponts
  {
    const ru = surLaLigne(RUISSEAU, x, z);
    if (ru.d < 1.7 && (c.d > 0.2 || PONTS.some((p) => sousPont(p, x, z)))) h = Math.min(h, ru.h + (h - ru.h) * lisse(0.55, 1.7, ru.d));
  }
  // les escaliers : à leur hauteur de chaque côté (un talus, creusé ou remblayé, que suivent leurs haies de bambou), puis le
  // sol naturel ; avant le 2026-10-27, seulement creusés, et là où le sol passait sous les marches, les haies descendaient la
  // pente à côté d'elles
  for (const es of MARCHES) {
    const r = surLaLigne(es.ligne, x, z);
    if (r.d < es.demi + 2.4) h = r.h - 0.05 + (h - r.h + 0.05) * lisse(es.demi + 0.65, es.demi + 2.4, r.d);
  }
  // la source de la Voie lactée : un petit replat creusé au pied de la pente (son cadre de pierre posé dessus, pas enterré du
  // côté de la colline), puis le bassin, profond (le reflet du phénix y descend, la nuit) ; son trou s'arrête sous le cadre
  {
    const dx = Math.max(0, Math.abs(x - GINGASEN.x) - 1.25), dz = Math.max(0, GINGASEN.z - z - 1.25, z - GINGASEN.z - 1.0), d = Math.hypot(dx, dz);
    if (d < 1.2) h = Math.min(h, SOL_SOURCE + (h - SOL_SOURCE) * lisse(0, 1.2, d));
  }
  if (Math.abs(x - GINGASEN.x) < 0.76 && Math.abs(z - GINGASEN.z) < 0.6) h = Math.min(h, -0.9);
  return h;
}
// le ruisseau de la cascade [x, z, y du lit] : du bassin, sous le pont du Ravin du Tigre (l'allée du pied de la colline), à
// travers le bois entre les deux allées, sous un second pont de pierre (l'allée derrière le pavillon), jusqu'au bras d'eau de
// l'étang. Avant le 2026-10-27 (le propriétaire : « l'eau passe au milieu du chemin… comme s'il n'y avait pas de rivière »),
// il coulait à plat sur les allées et s'arrêtait 2,6 m avant l'étang
const RUISSEAU = [
  [14.4, -45.9, 0.46], [12.9, -44.6, 0.22], [11.8, -42.6, -0.12], [12.5, -40.3, -0.34], [13.6, -38.6, -0.36], [12.6, -36.0, -0.37],
  [10.4, -33.0, -0.38], [7.2, -29.6, -0.39], [3.2, -26.6, -0.4], [-1.0, -24.4, -0.41], [-4.6, -23.6, -0.42], [-7.8, -22.6, -0.43],
  [-9.0, -20.8, -0.44], [-9.5, -18.68, -0.45], [-10.0, -16.7, -0.46], [-11.0, -14.6, -0.47], [-12.0, -12.6, -0.62], [-12.6, -10.8, -0.9],
];
// ses deux ponts de pierre : le milieu (sur le ruisseau), la direction de l'allée (ux, uz), la portée le long de l'allée, la
// largeur ; kokei : le pont du Ravin du Tigre, entre ses haies de bambou
const PONTS = [
  { x: KOKEI.x, z: KOKEI.z, ux: 0.827, uz: -0.562, portee: 3.0, large: 3.4, kokei: true },
  { x: -9.5, z: -18.68, ux: -0.97, uz: -0.243, portee: 3.0, large: 3.4 },
];
/** Sous le tablier du pont p (un peu moins long : ses culées). */
function sousPont(p, x, z) {
  const du = (x - p.x) * p.ux + (z - p.z) * p.uz, dn = -(x - p.x) * p.uz + (z - p.z) * p.ux;
  return Math.abs(du) < p.portee / 2 - 0.05 && Math.abs(dn) < p.large / 2;
}
// les replats (terrain) : [x, z] le milieu, lx, lz les demi-côtés, ry le tour, bord (où le sol rejoint la pente), h (sinon la
// hauteur des allées)
const REPLATS = [
  { x: FUDO.x, z: FUDO.z + 2.1, lx: 7.6, lz: 8.0, ry: 0, bord: 1.8 },
  { x: SHUIN.x, z: SHUIN.z, lx: 3.0, lz: 2.4, ry: -0.3, bord: 1.4 },
  { x: CHASHO.x - 0.35, z: CHASHO.z + 1.15, lx: 4.0, lz: 3.6, ry: -0.3, bord: 1.4 },
  { x: SEKKA.x, z: SEKKA.z, lx: 4.6, lz: 3.4, ry: 0.55, bord: 1.6 },
  // (le sanctuaire Shin'un, sur une terrasse taillée dans la pente ; devant, mur : pas de pente, son muret de pierre)
  { x: SHINUN.x - 0.1 * Math.sin(0.35), z: SHINUN.z - 0.1 * Math.cos(0.35), lx: 1.9, lz: 1.5, ry: 0.35, bord: 1.2, h: 0.95, mur: true },
];
/** La hauteur d'une allée en x, z : le relief lissé (la colline sans ses bosses), un peu au-dessus du sol voisin. */
function hauteurAllee(x, z) {
  const p = piedColline(x);
  let h = HAUT_COLLINE * lisse(p, p - 13, z) - 0.6 * lisse(50, 72, x) * lisse(p - 4, p - 12, z);
  h += 1.0 * Math.max(0, 1 - Math.hypot(x - SEKKA.x, z - SEKKA.z + 2) / 12) + 1.4 * Math.max(0, 1 - Math.hypot(x + 3, z + 62) / 9) ** 1.5;
  return h + 0.04;
}

/** Peut-on être en x, z ? Sur les allées et les places, pas dans l'eau. */
function dansLeCadre(x, z) {
  if (surChemins(x, z).d < 0 || surPlaces(x, z) < 0) return bordEtang(x, z) > 0.35;
  return false;
}

/** Ce que le carnet et le menu savent du lieu, sans le construire. */
export const infos = {
  id: 'kinkakuji', carte: 'kinkaku-ji', video: '7660227940243737878',
  nom: { en: 'Kinkaku-ji', fr: 'Kinkaku-ji', ja: '金閣寺' }, nomJa: '金閣寺',
  tampons: [
    { id: 'kinkaku', motif: 'kinkaku', ja: '金閣', encre: '#b8862a' },
    { id: 'ryumon', motif: 'ryumon', ja: '龍門滝', encre: '#2a6a8a', forme: 'carre' },
    { id: 'zeni', motif: 'zeni', ja: '願い銭', encre: '#7a5a3a' },
    { id: 'matcha', motif: 'matcha', ja: '抹茶', encre: '#3f7a3a', forme: 'carre' },
    { id: 'goshuin', motif: 'goshuin', ja: '御朱印', encre: '#c0392b' },
  ],
  get textes() { return TEXTES; },
};

/** La nuit : les lanternes, le papier des lampes et des fenêtres s'allument ; l'or du pavillon s'illumine doucement. */
export const sortesNuit = (P) => ({ [P.shoji]: 'lumiere', [P.shojiCadre]: 'treillis', [P.orKinkaku]: 'illumine', [P.orKinkakuClair]: 'illumine' });

/** Un triangle A, B, C ajouté à pos (et sa couleur à cols), tourné vers n (retourné s'il regarde de l'autre côté). */
function tri(pos, cols, A, B, C, c, n) {
  const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  if (nx * n[0] + ny * n[1] + nz * n[2] < 0) pos.push(...A, ...C, ...B); else pos.push(...A, ...B, ...C);
  cols.push(c);
}
/** Un quadrilatère A, B, C, D (dans l'ordre du tour) en deux triangles tournés vers n. */
const quad = (pos, cols, A, B, C, D, c, n) => { tri(pos, cols, A, B, C, c, n); tri(pos, cols, A, C, D, c, n); };

export function construire(ctx) {
  const { THREE, atelier, P } = ctx;
  // les escaliers de pierre : leur ligne [x, z, y] (une pente régulière, de la hauteur d'une allée à l'autre)
  MARCHES.length = 0;
  for (const ch of CHEMINS) {
    if (!ch.escalier) continue;
    const [a0, a1] = [ch.pts[0], ch.pts[ch.pts.length - 1]], y0 = hauteurAllee(...a0), y1 = hauteurAllee(...a1);
    let L = 0;
    const cum = [0];
    for (let i = 1; i < ch.pts.length; i++) { L += Math.hypot(ch.pts[i][0] - ch.pts[i - 1][0], ch.pts[i][1] - ch.pts[i - 1][1]); cum.push(L); }
    MARCHES.push({ ligne: ch.pts.map(([x, z], i) => [x, z, y0 + ((y1 - y0) * cum[i]) / L]), demi: ch.w, y0, y1, L });
  }
  const objets = [];
  const monde = creerMonde({ terrain, cadre: dansLeCadre, profond: null, pente: null });
  const poser = (fin, x, z, o = {}) => objets.push({ fin, x, z, y: o.y ?? terrain(x, z), ry: o.ry || 0, ombre: o.ombre !== false, trait: o.trait !== false, dedans: o.dedans, avant: o.avant });
  const bancs = [], lumieres = [], animes = [], vapeurs = [], courants = [], cascades = [];
  const etiquettes = [];
  // l'eau calme de la source (Ginga-sen) ; les filets d'eau vive (le rocher de la source des mains)
  const eauxCalmesSource = [], courantsVifs = [];
  /**
   * Un ruban d'eau qui coule le long des points [x, y, z] (sa largeur l ; ecume(k) : l'écume au point k), pour l'eau qui coule
   * du moteur (comme à Takachiho) ; o : largeur (le reflet sombre des bords), vif (un filet d'eau vive).
   */
  const rubanEau = (pts, l, ecume = () => 0, couleur = null, o = {}) => {
    const pos = [], uv = [], ec = [], sens = [], idx = [];
    let s = 0;
    pts.forEach((p, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dz = b[2] - a[2], d = Math.hypot(dx, dz) || 1, tx = dx / d, tz = dz / d;
      if (i) s += Math.hypot(p[0] - pts[i - 1][0], p[2] - pts[i - 1][2]);
      for (const t of [0, 1]) {
        const w = (t - 0.5) * l;
        pos.push(p[0] - tz * w, p[1], p[2] + tx * w);
        uv.push(s, t);
        ec.push(ecume(i));
        sens.push(tx, tz);
      }
      if (i) { const k = (i - 1) * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('ecume', new THREE.Float32BufferAttribute(ec, 1));
    g.setAttribute('sens', new THREE.Float32BufferAttribute(sens, 2));
    g.setIndex(idx);
    if (couleur) g.userData.couleur = couleur;
    if (o.largeur) g.userData.largeur = o.largeur;
    if (o.vif) g.userData.vif = true;
    courants.push(g);
  };
  const ecrire = (o, e) => {
    const c = Math.cos(o.ry || 0), sn = Math.sin(o.ry || 0);
    etiquettes.push({ ...e, x: o.x + e.x * c + e.z * sn, y: o.y + e.y, z: o.z - e.x * sn + e.z * c, ry: (o.ry || 0) + (e.ry || 0) });
  };
  /** Un repère tourné : la pose (x, y, z, ry) d'une pièce donnée dans le repère d'un objet posé en x0, z0, tourné de ry0. */
  const repere = (x0, z0, ry0) => {
    const c = Math.cos(ry0), s = Math.sin(ry0);
    return (lx, y, lz, o = {}) => ({ ...o, x: x0 + lx * c + lz * s, y, z: z0 - lx * s + lz * c, ry: ry0 + (o.ry || 0) });
  };
  /** Une géométrie faite de triangles (pos : les sommets à la suite). */
  const geo = (pos) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); return g; };
  /** Une lanterne de pierre (tōrō) d'environ 1,7 m en x, z, allumée la nuit. */
  const lanterne = (a, x, z, y = terrain(x, z)) => {
    a.lanterne(x, z, 6, y);
    lumieres.push({ x, y: y + 1.2, z, halo: 0.42, sol: y, r: 2.6 });
    monde.cercle(x, z, 0.6);
  };

  // ---------------------------------------------------------------- Le Pavillon d'or (舎利殿)
  // Un toit du pavillon (le deuxième, à quatre pentes, ou le dernier, en pyramide) : des bardeaux de cyprès (柿葺) sombres en
  // rangs, la pente creusée (presque plate au bord, raide en haut), les coins relevés ; au bord, l'épaisseur des bardeaux et
  // un liseré d'or (la planche du bord) ; dessous, le plafond doré des avant-toits et ses chevrons dorés sur deux rangs, des
  // murs jusqu'au bord ; une poutre d'angle dorée sous chaque coin. o : bord [L, P] (les demi-côtés au bord), haut [L, P] (en
  // haut), y0 (le bord), y1 (le haut), mur [L, P] et yMur (où le dessous rejoint les murs), creux, releve, epais.
  function toitPavillon(a, o) {
    const { bord: [L0, P0], haut: [L1, P1], y0, y1, mur: [Lm, Pm], yMur, creux = 1.9, releve = 0.42, epais = 0.32 } = o;
    const coins = (L, P) => [[-L, P], [L, P], [L, -P], [-L, -P]];
    const B = coins(L0, P0), H = coins(L1, P1), W = coins(Lm, Pm);
    const nu = 18, nv = 9;
    const lev = (u, v) => releve * Math.abs(2 * u - 1) ** 4 * (1 - v) ** 2;
    const pt = (k, u, v, dy = 0) => {
      const [bx, bz] = B[k], [cx, cz] = B[(k + 1) % 4], [hx, hz] = H[k], [ix, iz] = H[(k + 1) % 4];
      const ex = bx + (cx - bx) * u, ez = bz + (cz - bz) * u, tx = hx + (ix - hx) * u, tz = hz + (iz - hz) * u;
      const f = 1 + 0.035 * Math.abs(2 * u - 1) ** 4 * (1 - v);
      return [(ex + (tx - ex) * v) * f, y0 + (y1 - y0) * v ** creux + lev(u, v) + dy, (ez + (tz - ez) * v) * f];
    };
    const pos = [], cols = [];
    for (let k = 0; k < 4; k++) {
      const [bx, bz] = B[k], [cx, cz] = B[(k + 1) % 4], nx = -(cz - bz), nz = cx - bx, l = Math.hypot(nx, nz), dehors = [nx / l, 0.6, nz / l];
      for (let i = 0; i < nu; i++) {
        for (let j = 0; j < nv; j++) {
          // (les rangs de bardeaux : deux teintes, en travers de la pente)
          const c = (j + (i % 3 === 0 ? 1 : 0)) % 2 ? P.kokera : P.kokeraClair;
          quad(pos, cols, pt(k, i / nu, j / nv), pt(k, (i + 1) / nu, j / nv), pt(k, (i + 1) / nu, (j + 1) / nv), pt(k, i / nu, (j + 1) / nv), c, dehors);
        }
        // l'épaisseur du bord : les bardeaux (sombres), puis le liseré d'or de la planche du bord
        const A = pt(k, i / nu, 0), Bb = pt(k, (i + 1) / nu, 0), A1 = pt(k, i / nu, 0, -epais * 0.62), B1 = pt(k, (i + 1) / nu, 0, -epais * 0.62);
        const A2 = pt(k, i / nu, 0, -epais), B2 = pt(k, (i + 1) / nu, 0, -epais);
        quad(pos, cols, A, Bb, B1, A1, P.kokeraBord, [dehors[0], 0, dehors[2]]);
        quad(pos, cols, A1, B1, B2, A2, P.orKinkaku, [dehors[0], 0, dehors[2]]);
        // dessous : le plafond doré, du bord jusqu'au mur (un rien plus bas que le bas du liseré)
        const [wx, wz] = W[k], [vx, vz] = W[(k + 1) % 4];
        const Wa = [wx + (vx - wx) * (i / nu), yMur, wz + (vz - wz) * (i / nu)], Wb = [wx + (vx - wx) * ((i + 1) / nu), yMur, wz + (vz - wz) * ((i + 1) / nu)];
        quad(pos, cols, A2, B2, Wb, Wa, P.orKinkakuOmbre, [0, -1, 0]);
      }
      // le dessus, s'il reste un rectangle en haut (le toit du milieu : le balcon du dernier étage s'y pose)
    }
    if (L1 > 0.01) {
      const T = H.map(([x, z]) => [x, y1, z]);
      quad(pos, cols, T[0], T[1], T[2], T[3], P.kokera, [0, 1, 0]);
    }
    a.piece(geo(pos), P.kokera, { couleurs: cols, nuance: 0.03 });
    // les chevrons dorés : sous le plafond, des murs vers le bord, tous les 30 cm, sur deux rangs (le second, plus court, déborde
    // du premier) ; ils s'arrêtent à la ligne d'angle ; et la poutre d'angle (隅木)
    for (let k = 0; k < 4; k++) {
      const [bx, bz] = B[k], [cx, cz] = B[(k + 1) % 4], [wx, wz] = W[k], [vx, vz] = W[(k + 1) % 4];
      const lb = Math.hypot(cx - bx, cz - bz), n = Math.floor(lb / 0.33);
      for (let i = 1; i < n; i++) {
        const u = i / n, d = Math.min(u, 1 - u) * lb;
        // (près des coins, le chevron est plus court : il bute sur la poutre d'angle)
        const avance = Math.min(1, d / Math.max(0.01, Math.hypot(bx - wx, bz - wz) * 0.72));
        if (avance < 0.12) continue;
        const E = pt(k, u, 0, -epais - 0.035), Wp = [wx + (vx - wx) * u, yMur - 0.035, wz + (vz - wz) * u];
        const fin = [Wp[0] + (E[0] - Wp[0]) * avance, Wp[1] + (E[1] - Wp[1]) * avance, Wp[2] + (E[2] - Wp[2]) * avance];
        a.baton(Wp, fin, 0.042, P.orKinkakuOmbre, 4, { trait: false });
      }
      const C0 = [W[k][0], yMur - 0.08, W[k][1]], C1 = pt(k, 0, 0, -epais - 0.06);
      a.baton(C0, C1, 0.1, P.orKinkaku, 4);
      // une clochette de bronze (風鐸) pendue au bout de la poutre d'angle
      a.cylindre(0.004, 0.004, 0.22, 3, P.noir, { x: C1[0], y: C1[1] - 0.14, z: C1[2], trait: false })
        .cylindre(0.05, 0.085, 0.2, 8, P.bronze, { x: C1[0], y: C1[1] - 0.34, z: C1[2] })
        .boite(0.12, 0.1, 0.012, P.orKinkaku, { x: C1[0], y: C1[1] - 0.52, z: C1[2], ry: hasard(k, 3) * 3, trait: false });
    }
    return a;
  }
  /** Une fenêtre en cloche (花頭窓) de largeur w, hauteur h, dans le repère R (le mur à z = 0, la face vers +z) : le cadre d'or
   * en relief, le fond sombre et les barreaux dorés. */
  function fenetreCloche(a, R, w, h, y0) {
    const contour = (k) => {
      const s = new THREE.Shape(), W2 = (w / 2) * k, H = h * (0.92 + 0.08 * k), b = (h - H) / 2;
      const h0 = b + H * 0.6;
      s.moveTo(-W2, b); s.lineTo(W2, b); s.lineTo(W2, h0);
      s.quadraticCurveTo(W2 * 1.14, h0 + H * 0.07, W2 * 0.9, h0 + H * 0.13);
      s.quadraticCurveTo(W2 * 0.3, h0 + H * 0.2, W2 * 0.44, h0 + H * 0.29);
      s.quadraticCurveTo(W2 * 0.22, b + H * 0.97, 0, b + H);
      s.quadraticCurveTo(-W2 * 0.22, b + H * 0.97, -W2 * 0.44, h0 + H * 0.29);
      s.quadraticCurveTo(-W2 * 0.3, h0 + H * 0.2, -W2 * 0.9, h0 + H * 0.13);
      s.quadraticCurveTo(-W2 * 1.14, h0 + H * 0.07, -W2, h0);
      s.lineTo(-W2, b);
      return s;
    };
    // (le mur, plein, a sa face en z = 0 : le fond sombre 4 mm devant, les barreaux, le cadre d'or de 2 à 7 cm)
    const cadre = contour(1.12), trou = contour(0.92);
    cadre.holes.push(new THREE.Path(trou.getPoints(10)));
    const gc = new THREE.ExtrudeGeometry(cadre, { depth: 0.05, bevelEnabled: false, curveSegments: 8 });
    a.piece(gc, P.orKinkakuClair, R(0, y0, 0.02, { nuance: 0.02 }));
    const gf = new THREE.ShapeGeometry(trou, 8);
    a.piece(gf, '#2a2420', R(0, y0, 0.004, { trait: false }));
    // les barreaux : verticaux, jusqu'au haut de l'ouverture à leur abscisse
    const pts = trou.getPoints(16);
    const hautEn = (x) => { let m = 0; for (const [p, q] of pts.map((v, i) => [v, pts[(i + 1) % pts.length]])) { if ((p.x - x) * (q.x - x) <= 0 && Math.abs(q.x - p.x) > 1e-6) m = Math.max(m, p.y + ((q.y - p.y) * (x - p.x)) / (q.x - p.x)); } return m; };
    const nb = 7;
    for (let i = 1; i < nb; i++) {
      const x = -w * 0.46 + (w * 0.92 * i) / nb, ht = hautEn(x) - 0.02;
      if (ht > 0.1) a.boite(0.022, ht - 0.03, 0.02, P.orKinkaku, R(x, y0 + 0.03 + (ht - 0.03) / 2, 0.018, { trait: false }));
    }
  }
  /** Une grille dorée de petits carreaux (le haut des portes, les fenêtres à treillis) : largeur w, hauteur h, n × m cases. */
  function treillis(a, R, w, h, n, m, y0, z = 0.02, c = P.orKinkaku) {
    a.boite(w, h, 0.01, '#2a2420', R(0, y0 + h / 2, z - 0.012, { trait: false }));
    for (let i = 0; i <= n; i++) a.boite(0.022, h, 0.022, c, R(-w / 2 + (w * i) / n, y0 + h / 2, z, { trait: false }));
    for (let j = 0; j <= m; j++) a.boite(w, 0.022, 0.024, c, R(0, y0 + (h * j) / m, z + 0.002, { trait: false }));
  }
  /** Un garde-corps (高欄) autour d'un rectangle ±L, ±P au niveau y : main courante ronde, lisse du milieu, poteaux (tous les
   * pas m), la plinthe ; couleur c ; ouvertures : [côté ('n', 's', 'e', 'o'), début, fin] (le long du côté). bouton : les
   * poteaux d'angle coiffés d'un bouton (le dernier étage). */
  function gardeCorps(a, L, Pp, y, h, c, pas = 1.1, ouvertures = [], bouton = false) {
    const cotes = [['s', [-L, Pp], [L, Pp]], ['e', [L, Pp], [L, -Pp]], ['n', [L, -Pp], [-L, -Pp]], ['o', [-L, -Pp], [-L, Pp]]];
    cotes.forEach(([id, [x0, z0], [x1, z1]], k) => {
      const l = Math.hypot(x1 - x0, z1 - z0), ux = (x1 - x0) / l, uz = (z1 - z0) / l;
      // (les morceaux du côté entre les ouvertures)
      const coupes = ouvertures.filter((o) => o[0] === id).map((o) => [o[1], o[2]]).sort((p, q) => p[0] - q[0]);
      let s = 0;
      const morceaux = [];
      for (const [d0, d1] of [...coupes, [l + 1, l + 1]]) { if (Math.min(d0, l) > s + 0.05) morceaux.push([s, Math.min(d0, l)]); s = d1; }
      for (const [s0, s1] of morceaux) {
        const P0 = [x0 + ux * s0, z0 + uz * s0], P1 = [x0 + ux * s1, z0 + uz * s1], dk = k % 2 ? 0.006 : 0;
        a.baton([P0[0], y + h, P0[1]], [P1[0], y + h, P1[1]], 0.035 + dk, c, 6)
          .baton([P0[0], y + h * 0.5, P0[1]], [P1[0], y + h * 0.5, P1[1]], 0.022 + dk, c, 4, { trait: false })
          .baton([P0[0], y + 0.06, P0[1]], [P1[0], y + 0.06, P1[1]], 0.045 + dk, c, 4);
        const np = Math.max(1, Math.round((s1 - s0) / pas));
        for (let i = 0; i <= np; i++) {
          const t = s0 + ((s1 - s0) * i) / np, px = x0 + ux * t, pz = z0 + uz * t;
          a.boite(0.07, h, 0.07, c, { x: px, y: y + h / 2, z: pz, ry: Math.atan2(ux, uz), nuance: 0.02 });
          if (bouton && (i === 0 || i === np)) a.boule(0.07, c, { x: px, y: y + h + 0.06, z: pz, sy: 1.3 }, 1);
        }
      }
    });
  }

  /** Le pavillon (le milieu de son rez-de-chaussée en 0, 0, sur le sol). */
  function pavillon(a) {
    const { L, P: Pp, sol, h1, sol2, h2, toit2, sol3, L3, h3, toit3, faite } = KK;
    const xs = [-L / 2]; for (const t of KK.travees) xs.push(xs[xs.length - 1] + t);
    const zs = [-Pp / 2, -Pp / 4, 0, Pp / 4, Pp / 2];
    const BOIS = P.boisKinkaku, BOIS2 = P.boisKinkakuClair, OR = P.orKinkaku, OR2 = P.orKinkakuClair;
    // -- la base : de grosses pierres au ras de l'eau, le creux sombre sous le plancher, ses poteaux courts
    a.boite(L + 0.6, sol - 0.12, Pp + 0.6, '#2c2824', { y: (sol - 0.12) / 2 - 0.05, trait: false });
    for (let k = 0; k < 46; k++) {
      const t = k / 46, per = 2 * (L + 1.4) + 2 * (Pp + 1.4), s = t * per;
      let x, z;
      if (s < L + 1.4) { x = -L / 2 - 0.7 + s; z = Pp / 2 + 0.7; } else if (s < L + 1.4 + Pp + 1.4) { x = L / 2 + 0.7; z = Pp / 2 + 0.7 - (s - L - 1.4); } else if (s < 2 * (L + 1.4) + Pp + 1.4) { x = L / 2 + 0.7 - (s - L - 1.4 - Pp - 1.4); z = -Pp / 2 - 0.7; } else { x = -L / 2 - 0.7; z = -Pp / 2 - 0.7 + (s - 2 * (L + 1.4) - Pp - 1.4); }
      a.rocher(x, -0.05, z, 0.42 + 0.22 * hasard(k, 5), hasard(k, 2) > 0.5 ? '#8b8377' : '#7b746a', { sy: 0.6 });
    }
    for (const x of xs) for (const z of [-Pp / 2 - 0.82, Pp / 2 + 0.82]) a.boite(0.16, sol, 0.16, BOIS, { x, y: sol / 2 - 0.05, z, trait: false });
    // -- le plancher et la galerie extérieure (濡縁), en planches
    a.boite(L + 1.7, 0.12, Pp + 1.7, BOIS2, { y: sol - 0.06, teinte: (x) => (Math.floor(x * 4 + 50) % 2 ? BOIS2 : BOIS) });
    gardeCorps(a, L / 2 + 0.78, Pp / 2 + 0.78, sol, 0.55, BOIS, 1.2, [['o', Pp / 2 + 0.78 - 1.5, Pp / 2 + 0.78 + 0.1]]);
    // -- les poteaux du rez-de-chaussée (bois brut assombri), un rien en avant des murs
    for (const x of xs) for (const z of zs) {
      const coin = (x === xs[0] || x === xs[5]) || (z === zs[0] || z === zs[4]);
      if (coin) a.boite(0.22, h1 - sol, 0.22, BOIS, { x, y: (sol + h1) / 2, z });
    }
    // -- les murs : au nord, du plâtre blanc entre les poteaux ; à l'est et à l'ouest, au fond deux travées de plâtre et une de
    // planches (une porte), devant la galerie ouverte ; au fond de la galerie (z = Pp/4), la façade de la salle : les volets à
    // treillis (蔀戸), le haut relevé et accroché au plafond
    const platre = (x0, x1, z0, z1) => {
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, lx = Math.abs(x1 - x0) || 0.06, lz = Math.abs(z1 - z0) || 0.06;
      a.boite(lx, 2.05, lz, P.platre, { x: cx, y: sol + 0.12 + 1.025, z: cz });
      a.boite(lx, 0.55, lz, P.platre, { x: cx, y: h1 - 0.42, z: cz });
      a.boite(lx + (lx > 0.07 ? 0 : 0.03), 0.12, lz + (lz > 0.07 ? 0 : 0.03), BOIS, { x: cx, y: sol + 2.27, z: cz }); // le linteau (長押)
      a.boite(lx + (lx > 0.07 ? 0 : 0.03), 0.1, lz + (lz > 0.07 ? 0 : 0.03), BOIS, { x: cx, y: sol + 0.06, z: cz }); // le seuil
    };
    for (let i = 0; i < 5; i++) platre(xs[i] + 0.11, xs[i + 1] - 0.11, -Pp / 2, -Pp / 2);
    for (const x of [xs[0], xs[5]]) {
      platre(x, x, zs[0] + 0.11, zs[1] - 0.11);
      platre(x, x, zs[1] + 0.11, zs[2] - 0.11);
      // la porte de planches
      a.boite(0.07, h1 - sol - 0.75, zs[3] - zs[2] - 0.22, BOIS2, { x, y: sol + (h1 - sol - 0.75) / 2 + 0.05, z: (zs[2] + zs[3]) / 2, teinte: (px, py, pz) => (Math.floor((pz + 9) * 6) % 2 ? BOIS2 : BOIS) });
      a.boite(0.06, 0.55, zs[3] - zs[2] - 0.22, P.platre, { x, y: h1 - 0.42, z: (zs[2] + zs[3]) / 2 });
    }
    for (let i = 0; i < 5; i++) {
      const x0 = xs[i] + 0.11, x1 = xs[i + 1] - 0.11, w = x1 - x0, cx = (x0 + x1) / 2, z = Pp / 4;
      // le volet du bas (fixe) : un treillis sombre sur papier ; le haut ouvert sur la salle sombre ; le volet du haut relevé
      a.boite(w, 0.95, 0.05, '#e9e2cf', { x: cx, y: sol + 0.12 + 0.475, z: z - 0.03, trait: false });
      for (let k = 0; k <= 8; k++) a.boite(0.025, 0.95, 0.03, BOIS, { x: x0 + (w * k) / 8, y: sol + 0.12 + 0.475, z: z + 0.005, trait: false });
      for (let k = 0; k <= 4; k++) a.boite(w, 0.025, 0.035, BOIS, { x: cx, y: sol + 0.12 + (0.95 * k) / 4, z: z + 0.008, trait: false });
      a.boite(w, h1 - sol - 1.2, 0.04, '#181412', { x: cx, y: sol + 1.07 + (h1 - sol - 1.2) / 2, z: z - 0.4, trait: false });
      a.boite(w - 0.02, 0.05, 0.9, BOIS, { x: cx, y: h1 - 0.18, z: z + 0.45 });
      a.boite(0.06, 0.06, 0.3, P.noir, { x: cx, y: h1 - 0.24, z: z + 0.92, trait: false });
    }
    // l'intérieur sombre de la salle (vu par la façade ouverte), son plafond
    a.boite(L - 0.3, h1 - sol - 0.15, Pp * 0.75 - 0.4, '#1d1915', { x: 0, y: sol + (h1 - sol) / 2, z: -Pp / 8 - 0.1, trait: false });
    a.boite(L + 0.1, 0.12, Pp / 4 + 0.1, BOIS, { y: h1 - 0.06, z: Pp * 3 / 8 });
    // -- la ceinture de poutres en haut du rez-de-chaussée, et les bras (腕木) qui portent le balcon du premier étage
    for (const [l, p, x, z] of [[L + 0.32, 0.26, 0, Pp / 2], [L + 0.32, 0.26, 0, -Pp / 2], [0.26, Pp + 0.32, L / 2, 0], [0.26, Pp + 0.32, -L / 2, 0]]) a.boite(l, 0.3, p, BOIS, { x, y: h1 - 0.15, z });
    for (const x of xs) for (const s of [-1, 1]) a.boite(0.14, 0.16, 1.15, '#2e2622', { x, y: h1 + 0.02, z: s * (Pp / 2 + 0.5) });
    for (const z of zs) for (const s of [-1, 1]) a.boite(1.15, 0.16, 0.14, '#2e2622', { x: s * (L / 2 + 0.5), y: h1 + 0.03, z });

    // -- le premier étage (潮音洞), à la feuille d'or : le balcon (son dessous laqué noir, son bord doré), le garde-corps doré
    const BL = L / 2 + 1.12, BP = Pp / 2 + 1.12;
    a.boite(2 * BL, 0.1, 2 * BP, P.laqueNoire, { y: sol2 - 0.06, trait: false });
    a.boite(2 * BL + 0.02, 0.07, 2 * BP + 0.02, OR, { y: sol2 + 0.025 });
    gardeCorps(a, BL - 0.08, BP - 0.08, sol2 + 0.06, 0.78, OR2, 1.05);
    // les murs d'or entre les poteaux d'or (en relief de 3 cm), la poutre du haut ; au sud, les fenêtres à treillis et les
    // panneaux à lattes coulissants (舞良戸) au milieu
    for (const x of xs) for (const z of [-Pp / 2, Pp / 2]) a.boite(0.2, h2 - sol2, 0.2, OR, { x, y: (sol2 + h2) / 2 + 0.03, z });
    for (const z of zs.slice(1, 4)) for (const x of [-L / 2, L / 2]) a.boite(0.2, h2 - sol2, 0.2, OR, { x, y: (sol2 + h2) / 2 + 0.03, z });
    const murOr = (x0, z0, x1, z1) => a.boite(Math.abs(x1 - x0) || 0.08, h2 - sol2 - 0.06, Math.abs(z1 - z0) || 0.08, OR, { x: (x0 + x1) / 2, y: sol2 + 0.06 + (h2 - sol2 - 0.06) / 2, z: (z0 + z1) / 2 });
    for (let i = 0; i < 5; i++) {
      murOr(xs[i] + 0.1, -Pp / 2 + 0.03, xs[i + 1] - 0.1, -Pp / 2 + 0.03);
      if (i === 0 || i === 4) murOr(xs[i] + 0.1, Pp / 2 - 0.03, xs[i + 1] - 0.1, Pp / 2 - 0.03);
    }
    for (let j = 0; j < 4; j++) for (const x of [-L / 2 + 0.03, L / 2 - 0.03]) murOr(x, zs[j] + 0.1, x, zs[j + 1] - 0.1);
    {
      const R = (lx, y, lz, o = {}) => ({ ...o, x: lx, y, z: Pp / 2 - 0.03 + lz });
      for (const i of [1, 3]) {
        const cx = (xs[i] + xs[i + 1]) / 2, w = xs[i + 1] - xs[i] - 0.2;
        a.boite(w, 0.75, 0.08, OR, { x: cx, y: sol2 + 0.06 + 0.375, z: Pp / 2 - 0.03 });
        a.boite(w, h2 - sol2 - 1.35, 0.08, OR, { x: cx, y: h2 - (h2 - sol2 - 1.35) / 2 - 0.02, z: Pp / 2 - 0.05 });
        treillis(a, (lx, y, lz, o) => R(cx - 0 + lx, y, lz, o), w - 0.04, 0.5, 12, 1, sol2 + 0.82, 0.045, OR2);
      }
      const cx = (xs[2] + xs[3]) / 2, w = xs[3] - xs[2] - 0.2;
      a.boite(w, h2 - sol2 - 0.06, 0.06, OR, { x: cx, y: sol2 + 0.06 + (h2 - sol2 - 0.06) / 2, z: Pp / 2 - 0.06 });
      for (let k = 0; k < 4; k++) {
        const px = cx - w / 2 + (w * (k + 0.5)) / 4;
        a.boite(w / 4 - 0.04, h2 - sol2 - 0.3, 0.025, OR2, { x: px, y: sol2 + 0.12 + (h2 - sol2 - 0.3) / 2, z: Pp / 2 - 0.01 });
        for (let j = 1; j < 14; j++) a.boite(w / 4 - 0.1, 0.018, 0.016, OR, { x: px, y: sol2 + 0.12 + ((h2 - sol2 - 0.3) * j) / 14, z: Pp / 2 + 0.006, trait: false });
      }
    }
    for (const [l, p, x, z] of [[L + 0.28, 0.24, 0, Pp / 2], [L + 0.28, 0.24, 0, -Pp / 2], [0.24, Pp + 0.28, L / 2, 0], [0.24, Pp + 0.28, -L / 2, 0]]) a.boite(l, 0.26, p, OR2, { x, y: h2 - 0.1, z });
    // -- le toit du milieu : à quatre pentes, jusqu'au balcon du dernier étage
    toitPavillon(a, { bord: [L / 2 + 2.7, Pp / 2 + 2.7], haut: [L3 / 2 + 0.62, L3 / 2 + 0.62], y0: toit2, y1: sol3 - 0.14, mur: [L / 2 + 0.12, Pp / 2 + 0.12], yMur: h2 + 0.05, releve: 0.4 });

    // -- le dernier étage (究竟頂), d'or dedans et dehors : son balcon et son garde-corps aux poteaux à boutons (逆蓮柱), ses
    // murs (trois travées : au milieu la porte à panneaux et à treillis, 桟唐戸 ; de chaque côté une fenêtre en cloche)
    const B3 = L3 / 2 + 0.72;
    a.boite(2 * B3, 0.12, 2 * B3, P.laqueNoire, { y: sol3 - 0.06 });
    a.boite(2 * B3 + 0.02, 0.06, 2 * B3 + 0.02, OR, { y: sol3 + 0.02 });
    gardeCorps(a, B3 - 0.07, B3 - 0.07, sol3 + 0.05, 0.68, OR2, 0.9, [], true);
    const x3 = [-L3 / 2]; for (const t of KK.travees3) x3.push(x3[x3.length - 1] + t);
    for (const s of [-1, 1]) for (const x of x3) {
      a.boite(0.2, h3 - sol3, 0.2, OR2, { x, y: (sol3 + h3) / 2 + 0.03, z: s * L3 / 2 });
      a.boite(0.2, h3 - sol3, 0.2, OR2, { x: s * L3 / 2, y: (sol3 + h3) / 2 + 0.03, z: x });
    }
    for (let f = 0; f < 4; f++) {
      const ry = (f * PI) / 2, c = Math.cos(ry), sn = Math.sin(ry), d = L3 / 2 - 0.04;
      const R = (lx, y, lz, o = {}) => ({ ...o, x: lx * c + (d + lz) * sn, y, z: -lx * sn + (d + lz) * c, ry: ry + (o.ry || 0) });
      for (let i = 0; i < 3; i++) {
        const cx = (x3[i] + x3[i + 1]) / 2, w = x3[i + 1] - x3[i] - 0.2, H = h3 - sol3 - 0.06;
        a.boite(w, H, 0.08, OR, R(cx, sol3 + 0.06 + H / 2, 0));
        if (i === 1) {
          // la porte : deux battants à panneaux, en haut une bande de quatre petites fenêtres à treillis
          for (const sg of [-1, 1]) {
            a.boite(w / 2 - 0.06, H - 0.62, 0.03, OR2, R(cx + sg * (w / 4), sol3 + 0.06 + (H - 0.62) / 2 + 0.04, 0.05));
            for (const yy of [0.5, 1.0]) a.boite(w / 2 - 0.14, 0.035, 0.02, OR, R(cx + sg * (w / 4), sol3 + yy, 0.072, { trait: false }));
          }
          for (let k = 0; k < 4; k++) treillis(a, (lx, y, lz, o) => R(cx - w / 2 + (w * (k + 0.5)) / 4 + lx, y, lz, o), w / 4 - 0.07, 0.36, 4, 3, h3 - 0.56, 0.07, OR2);
        } else {
          fenetreCloche(a, (lx, y, lz, o) => R(cx + lx, y, 0.04 + lz, o), w * 0.72, 1.3, sol3 + 0.42);
        }
      }
      // (la bande de laque noire au pied des murs)
      a.boite(L3 - 0.2, 0.06, 0.02, P.laqueNoire, R(0, sol3 + 0.09, 0.075, { trait: false }));
    }
    for (const [l, p, x, z] of [[L3 + 0.26, 0.22, 0, L3 / 2], [L3 + 0.26, 0.22, 0, -L3 / 2], [0.22, L3 + 0.26, L3 / 2, 0], [0.22, L3 + 0.26, -L3 / 2, 0]]) a.boite(l, 0.22, p, OR2, { x, y: h3 - 0.08, z });
    // -- le toit du haut, en pyramide (宝形造), et son socle doré (露盤) où se pose le phénix (à part : animes)
    toitPavillon(a, { bord: [L3 / 2 + 2.45, L3 / 2 + 2.45], haut: [0.42, 0.42], y0: toit3, y1: faite, mur: [L3 / 2 + 0.12, L3 / 2 + 0.12], yMur: h3 + 0.03, releve: 0.36, creux: 2.1 });
    a.boite(0.98, 0.16, 0.98, '#2c2826', { y: faite + 0.06 })
      .boite(0.86, 0.2, 0.86, OR2, { y: faite + 0.24 })
      .boite(0.7, 0.16, 0.7, OR2, { y: faite + 0.42 });
    // la chaîne du paratonnerre, qui descend la pente nord, argentée
    {
      const pts = [];
      for (let k = 0; k <= 12; k++) { const v = 1 - k / 12, d = 0.42 + (L3 / 2 + 2.45 - 0.42) * (1 - v); pts.push([0.15, toit3 + (faite - toit3) * v ** 2.1 + 0.03, -d * 0.98]); }
      a.tube(pts, 0.018, '#c8ccd0', { cotes: 4, pas: 30, trait: false });
    }
    return a;
  }
  poser(pavillon(atelier()).fin(), 0, 0, { y: 0 });
  // (on ne marche ni sur le pavillon ni dessous ; la caméra n'y entre pas)
  monde.surface(-7.0, 7.0, -5.8, 5.8, KK.faite, { plein: true });
  monde.bloc(-7.1, 7.1, -5.9, 5.9, -1, KK.h3 + 0.4);
  monde.bloc(-9.0, 9.0, -7.7, 7.7, KK.h1, KK.toit2 + 1.2);

  // ---------------------------------------------------------------- Le petit pavillon du bord de l'eau (漱清)
  // À l'ouest du pavillon, sur l'eau : une travée ouverte sous un toit à deux pentes (le faîtage du nord au sud), sur quatre
  // poteaux posés sur des pierres au fond de l'eau ; un garde-corps ; une passerelle couverte le relie à la galerie
  {
    const a = atelier(), S = SOSEI, x0 = S.x - S.l / 2, x1 = S.x + S.l / 2, z0 = S.z - S.p / 2, z1 = S.z + S.p / 2, H = 2.75;
    for (const x of [x0, x1]) for (const z of [z0, z1]) {
      a.boite(0.17, H - FOND + 0.1, 0.17, P.boisKinkaku, { x, y: (FOND + H) / 2, z });
      a.rocher(x, FOND + 0.1, z, 0.34, '#6e6a5e', { sy: 0.6 });
    }
    a.boite(S.l + 0.25, 0.1, S.p + 0.25, P.boisKinkakuClair, { x: S.x, y: S.sol - 0.05, z: S.z, teinte: (x) => (Math.floor(x * 4 + 50) % 2 ? P.boisKinkakuClair : P.boisKinkaku) });
    a.boite(S.l + 0.3, 0.16, S.p + 0.3, '#2e2622', { x: S.x, y: S.sol - 0.18, z: S.z, trait: false });
    // le garde-corps, ouvert à l'est (la passerelle)
    for (const [p0, p1] of [[[x0, z0], [x0, z1]], [[x0, z1], [x1, z1]], [[x0, z0], [x1, z0]]]) {
      a.baton([p0[0], S.sol + 0.55, p0[1]], [p1[0], S.sol + 0.55, p1[1]], 0.03, P.boisKinkaku, 6).baton([p0[0], S.sol + 0.28, p0[1]], [p1[0], S.sol + 0.28, p1[1]], 0.02, P.boisKinkaku, 4, { trait: false });
      for (let k = 1; k < 4; k++) { const f = k / 4; a.boite(0.06, 0.55, 0.06, P.boisKinkaku, { x: p0[0] + (p1[0] - p0[0]) * f, y: S.sol + 0.275, z: p0[1] + (p1[1] - p0[1]) * f }); }
    }
    // le toit : deux pans de bardeaux, le faîtage, les deux pignons de planches
    const pente = 0.42, demi = S.l / 2 + 0.7, yF = H + 0.74, ang = Math.atan(pente), long = demi / Math.cos(ang);
    for (const s of [-1, 1]) a.boite(long + 0.04, 0.12, S.p + 1.3, s < 0 ? P.kokera : P.kokeraClair, { x: S.x + (s * demi) / 2, y: yF - (pente * demi) / 2 - 0.05, z: S.z, rz: -s * ang });
    a.boite(0.18, 0.18, S.p + 1.34, P.kokeraBord, { x: S.x, y: yF + 0.02, z: S.z });
    for (const z of [z0 - 0.02, z1 + 0.02]) {
      const pos = [], cols = [], A = [S.x - S.l / 2 - 0.05, H + 0.06, z], B = [S.x + S.l / 2 + 0.05, H + 0.06, z], C = [S.x, yF - 0.06, z];
      tri(pos, cols, A, B, C, P.boisKinkakuClair, [0, 0, z < S.z ? -1 : 1]);
      a.piece(geo(pos), P.boisKinkakuClair, { couleurs: cols });
    }
    for (const x of [x0, x1]) a.boite(0.14, 0.18, S.p + 0.2, P.boisKinkaku, { x, y: H - 0.05, z: S.z });
    for (const z of [z0, z1]) a.boite(S.l + 0.2, 0.18, 0.14, P.boisKinkaku, { x: S.x, y: H + 0.02, z });
    // la passerelle couverte, de la galerie du pavillon (son bord ouest, x −7) au petit pavillon
    const xa = x1, xb = -7.0;
    a.boite(xb - xa + 0.1, 0.1, 1.0, P.boisKinkakuClair, { x: (xa + xb) / 2, y: 0.74, z: S.z + 0.2 });
    for (const z of [S.z - 0.32, S.z + 0.72]) {
      a.baton([xa, 1.26, z], [xb, 1.3, z], 0.028, P.boisKinkaku, 6);
      for (const x of [xa + 0.4, (xa + xb) / 2, xb - 0.2]) a.boite(0.07, 0.55, 0.07, P.boisKinkaku, { x, y: 1.0, z });
      a.boite(0.14, 2.6 - FOND, 0.14, P.boisKinkaku, { x: (xa + xb) / 2, y: (2.6 + FOND) / 2, z });
    }
    a.boite(xb - xa + 0.6, 0.1, 1.6, P.kokera, { x: (xa + xb) / 2, y: 2.62, z: S.z + 0.2 });
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Les rives : les pierres, les îles, les rochers nommés
  // (des morceaux de 25 m : on ne dessine pas ce qu'on ne voit pas)
  const morceaux = new Map();
  const morceau = (x, z, taille = 25) => {
    const k = `${Math.floor(x / taille)},${Math.floor(z / taille)}`;
    if (!morceaux.has(k)) morceaux.set(k, atelier());
    return morceaux.get(k);
  };
  const PIERRES = ['#9a9283', '#8b8476', '#a39b8b', '#7f796c'];
  {
    // les pierres du bord de l'étang (護岸石), à demi dans l'eau, sur le vrai bord (qui ondule) ; pas le long de la base du
    // pavillon, qui a les siennes
    for (let i = 0; i < ETANG.length; i++) {
      const [x0, z0] = ETANG[i], [x1, z1] = ETANG[(i + 1) % ETANG.length], l = Math.hypot(x1 - x0, z1 - z0);
      if (Math.max(Math.abs(x0), Math.abs(x1)) < 7.7 && Math.max(Math.abs(z0), Math.abs(z1)) < 6.5) continue;
      const nx = -(z1 - z0) / l, nz = (x1 - x0) / l;
      for (let t = 0; t < l; t += 1.0 + 0.9 * hasard(x0 + t, z0 - t)) {
        let x = x0 + ((x1 - x0) * t) / l, z = z0 + ((z1 - z0) * t) / l;
        // (le vrai bord : on marche le long de la normale vers le point où la distance au bord s'annule)
        for (let k = 0; k < 8; k++) { const e = bordEtang(x, z), g = bordEtang(x + nx * 0.1, z + nz * 0.1) - e; if (Math.abs(g) < 1e-4) break; x -= (nx * e * 0.1) / g; z -= (nz * e * 0.1) / g; }
        const r = 0.32 + 0.38 * hasard(x * 1.7, z * 2.3);
        morceau(x, z).rocher(x, EAU + 0.06, z, r, PIERRES[Math.floor(hasard(x, z) * 4)], { sy: 0.55 + 0.25 * hasard(z, x) });
      }
    }
    // les îles : leur rive de pierres
    for (const I of ILES) {
      const n = Math.round((I.rx + I.rz) * 2.4);
      for (let k = 0; k < n; k++) {
        const t = (k / n) * 2 * PI;
        let x = I.x + Math.cos(t) * I.rx, z = I.z + Math.sin(t) * I.rz;
        for (let q = 0; q < 8; q++) { const d = surIle(x, z).d, l = Math.hypot(x - I.x, z - I.z) || 1; x -= ((x - I.x) / l) * d * 0.7; z -= ((z - I.z) / l) * d * 0.7; }
        morceau(x, z).rocher(x, EAU + 0.08, z, 0.3 + 0.35 * hasard(x, z), PIERRES[Math.floor(hasard(z, x) * 4)], { sy: 0.6 });
      }
    }
  }
  // les rochers nommés : le rocher du mont Meru, rugueux et plus haut, et ceux des seigneurs
  {
    const a = atelier();
    for (const [id, R] of Object.entries(ROCHES)) {
      a.piece(new THREE.IcosahedronGeometry(1, 1), '#857d70', {
        x: R.x, y: EAU - 0.2 + R.h * 0.4, z: R.z, sx: R.r, sy: R.h * 0.62, sz: R.r * 0.8, ry: hasard(R.x, R.z) * 6, nuance: 0.1,
        deformer: (x, y, z) => { const k = 0.78 + 0.42 * hasard(x * 7 + R.x, y * 7, z * 7) + (id === 'kuzan' ? 0.25 * Math.max(0, y) * hasard(x * 3, z * 3) : 0); return [x * k, y * (id === 'kuzan' ? 1.15 : 1) * k, z * k]; },
        teinte: (x, y, z) => (y > EAU + R.h * 0.55 && hasard(x * 5, z * 5) > 0.55 ? '#6f8a4e' : hasard(x * 9, y * 9 + z) > 0.5 ? '#857d70' : '#766f63'),
      });
    }
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Le phénix (鳳凰)
  /**
   * Une plume plate, de base à pointe [x, y, z], large de w, épaisse de t, sa face tournée vers n (à peu près).
   */
  const plume = (a, base, pointe, w, t, c, n, o = {}) => {
    const Y = new THREE.Vector3(...pointe).sub(new THREE.Vector3(...base)), l = Y.length();
    Y.normalize();
    const Z = new THREE.Vector3(...n).addScaledVector(Y, -new THREE.Vector3(...n).dot(Y)).normalize(), X = new THREE.Vector3().crossVectors(Y, Z);
    const g = new THREE.BoxGeometry(w, l, t);
    // (la plume s'affine vers sa pointe)
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) p.setX(i, p.getX(i) * 0.35);
    g.applyMatrix4(new THREE.Matrix4().makeBasis(X, Y, Z));
    g.translate((base[0] + pointe[0]) / 2, (base[1] + pointe[1]) / 2, (base[2] + pointe[2]) / 2);
    return a.piece(g, c, o);
  };
  /**
   * Le phénix d'or du toit (d'après le gros plan du TikTok) : debout sur une seule patte, le corps penché, le cou recourbé, la
   * tête et sa crête, le bec ; les deux ailes dressées vers l'arrière en éventail de longues plumes ; la traîne qui retombe.
   * Environ 0,9 m, tourné vers +z (le sud). k : la couleur (l'or ; celui du reflet de la source, qui luit la nuit).
   */
  function phenix(a, O = P.orKinkakuClair, O2 = P.orKinkaku) {
    a.baton([0, 0, 0], [0, 0.24, 0.03], 0.022, O2, 5)
      .ovale(0.11, O, { y: 0.35, z: 0.0, sx: 0.85, sz: 1.4, rx: -0.55 }, 10)
      .tube([[0, 0.4, 0.09], [0, 0.5, 0.16], [0, 0.6, 0.15]], 0.045, O, { cotes: 6, pas: 8 })
      .ovale(0.062, O, { y: 0.645, z: 0.16, sz: 1.3 }, 8)
      .cone(0.022, 0.085, 5, O2, { y: 0.64, z: 0.25, rx: PI / 2 });
    for (let k = 0; k < 3; k++) plume(a, [0, 0.68, 0.13 - k * 0.035], [0, 0.82 - k * 0.02, 0.04 - k * 0.07], 0.035, 0.012, O, [1, 0, 0]);
    // les ailes : un éventail de huit plumes depuis l'épaule, des plus dressées aux plus couchées vers l'arrière
    for (const s of [-1, 1]) {
      const epaule = [s * 0.07, 0.43, -0.02];
      for (let k = 0; k < 8; k++) {
        const d = new THREE.Vector3(s * (0.42 - 0.02 * k), 0.82 - 0.085 * k, -0.22 - 0.1 * k).normalize(), l = 0.3 + 0.03 * k;
        plume(a, epaule, [epaule[0] + d.x * l, epaule[1] + d.y * l, epaule[2] + d.z * l], 0.075, 0.014, k % 2 ? O : O2, [s, 0.15, 0.35]);
      }
    }
    // la traîne : de longues plumes courbes qui retombent derrière
    for (let k = 0; k < 5; k++) {
      const e = (k - 2) * 0.05;
      a.tube([[e * 0.3, 0.3, -0.13], [e, 0.26, -0.34], [e * 1.6, 0.13 - 0.02 * Math.abs(k - 2), -0.52], [e * 2, 0.04, -0.6]], 0.018, k % 2 ? O : O2, { cotes: 4, pas: 10 });
    }
    return a;
  }
  // le phénix du toit, à part : sur le calque 2, que le reflet de l'étang montre ou non (le secret : la nuit, il manque au
  // reflet, tant qu'on ne l'a pas retrouvé à la source)
  const phenixToit = (() => {
    const objet = new THREE.Group();
    const m = ctx.maillage(phenix(atelier()).fin(0, false));
    m.scale.setScalar(1.15);
    objet.add(m);
    objet.position.set(0, KK.faite + 0.5, 0);
    m.traverse((q) => q.layers.set(2));
    let reflete = true;
    return {
      objet,
      maj(dt, temps, c) {
        const voulu = !(c.nuit > 0.5 && !secretTrouve('phenix'));
        if (voulu !== reflete) { reflete = voulu; c.refleter?.(2, voulu); }
        return [];
      },
    };
  })();
  animes.push(phenixToit);

  // ---------------------------------------------------------------- Les arbres
  // Le jardin : des pins taillés en nuages (niwaki) sur les îles et les rives, quelques grands pins, des érables (verts l'été,
  // rouges à l'automne du calendrier), des azalées taillées en boules (karikomi) ; derrière, sur la colline, la forêt (pins,
  // érables, chênes toujours verts, cèdres) ; plus loin, la forêt du mont Kinugasa, moins fine. En morceaux de 25 m.
  // (où il n'en faut pas : les allées, les places, l'eau, les bâtiments, et la vue du belvédère du haut sur le pavillon)
  const libreArbre = (x, z, r) => {
    if (surChemins(x, z).d < r + 0.7 || surPlaces(x, z) < r + 0.7) return false;
    if (bordEtang(x, z) < r * 0.5 + 0.6) return false;
    if (surLaLigne(RUISSEAU, x, z).d < r * 0.5 + 1.3) return false;
    for (const [x0, x1, z0, z1] of BATIS) if (x > x0 - r && x < x1 + r && z > z0 - r && z < z1 + r) return false;
    if (Math.hypot((x - ANMIN.x) / (ANMIN.rx + 1.2), (z - ANMIN.z) / (ANMIN.rz + 1.2)) < 1) return false;
    return true;
  };
  // (dans le couloir de la vue du belvédère du haut vers le pavillon, seulement de jeunes pins, bas)
  const dansVueHaut = (x, z) => surLaLigne([[-2.4, -61], [0, -8]], x, z).d < 7;
  const VERTS_ERABLE = ['#6aa846', '#5f9a3e', '#78b250'], VERTS_FEUILLU = ['#4f7f3a', '#5a8a40', '#466f34'], VERT_AZALEE = ['#4c7a38', '#5a8640'];
  /**
   * Un grand pin (akamatsu, kuromatsu) : un tronc qui ondule jusque dans le plateau du sommet, des bras qui partent du tronc,
   * des plateaux d'aiguilles aplatis, sombres dessous. (Avant le 2026-10-27, le tronc s'arrêtait aux trois quarts : les
   * plateaux du haut et leurs bras flottaient au-dessus, et ses coudes s'ouvraient, comme un trou dans le tronc.)
   */
  const pinHaut = (a, x, z, h, o = {}) => {
    const y0 = o.y ?? terrain(x, z), g = hasard(x * 1.3, z * 0.7), sens = g > 0.5 ? 1 : -1, ct = '#7a5a44', c = o.vert ?? '#4a7a44';
    const pts = [[x, y0 - 0.3, z]];
    for (let k = 1; k <= 5; k++) pts.push([x + sens * Math.sin(k * 1.3 + g * 5) * 0.05 * h + sens * 0.035 * h * k * (o.penche ?? 0.3), y0 + (h * 0.95 * k) / 5, z + Math.cos(k * 1.7 + g * 3) * 0.04 * h]);
    const rayon = (k) => 0.022 * h * (1 - k * 0.15);
    for (let k = 0; k < 5; k++) a.fut(pts[k], pts[k + 1], rayon(k), rayon(k + 1), ct, o.loin ? 4 : 6);
    // (des boules aux coudes, comme les pins taillés : le tronc ne s'ouvre pas)
    if (!o.loin) for (let k = 1; k < 5; k++) a.boule(rayon(k) * 1.04, ct, { x: pts[k][0], y: pts[k][1], z: pts[k][2] });
    // (le point du tronc à la hauteur yy)
    const surTronc = (yy) => { const f = Math.min(4.999, Math.max(0, ((yy - y0) / (h * 0.95)) * 5)), k = Math.floor(f), u = f - k; return pts[k + 1].map((v, i) => pts[k][i] + (v - pts[k][i]) * u); };
    const n = o.loin ? 3 : 6;
    for (let k = 0; k < n; k++) {
      const t = g * 6 + k * 2.4, haut = 0.5 + 0.4 * (k / (n - 1)), d = (0.26 - 0.12 * (k / (n - 1))) * h, cy = y0 + h * haut;
      const [px, , pz] = surTronc(cy - 0.08 * h), cx = px + Math.cos(t) * d, cz = pz + Math.sin(t) * d;
      if (!o.loin) a.fut([px, cy - 0.08 * h, pz], [cx, cy - 0.02 * h, cz], 0.008 * h, 0.005 * h, ct, 4);
      a.houppe((0.16 - 0.05 * (k / n)) * h, c, { x: cx, y: cy, z: cz, sy: 0.42, bosses: 0.24, sorte: 'conifere' }, o.loin ? 0 : 1);
    }
    a.houppe(0.12 * h, c, { x: pts[5][0], y: y0 + h * 0.97, z: pts[5][2], sy: 0.5, sorte: 'conifere' }, o.loin ? 0 : 1);
    return a;
  };
  {
    // les îles : leurs pins, leurs azalées
    const ileArbres = {
      ashihara: [['pin', -10, 30.4, 7.6], ['niwaki', -6.4, 32.6, 8.5], ['pin', -2.2, 29.8, 9.4], ['niwaki', 2.6, 32.2, 7.2], ['pin', 6.8, 30.2, 8.2], ['niwaki', 10.6, 31.4, 6.4], ['azalee', -8.2, 33.2, 0.9], ['azalee', 0.4, 33.8, 0.8], ['azalee', 4.8, 28.8, 0.8], ['azalee', -3.8, 27.8, 0.7]],
      tsuru: [['pin', -33.4, 4.2, 9.6, 0.9], ['azalee', -31.6, 5.6, 0.6]], kame: [['niwaki', -13, 16.4, 9.8], ['azalee', -11.4, 17.2, 0.55]],
      i1: [['niwaki', -25, 35, 5.4]], i2: [['niwaki', 27.4, 27, 4.8]], i3: [['niwaki', -41, 21, 4.4]],
    };
    for (const I of ILES) for (const [sorte, x, z, h, penche] of ileArbres[I.id] || []) {
      const y = terrain(x, z), a = morceau(x, z);
      if (sorte === 'pin') pinHaut(a, x, z, h, { y, penche: penche ?? 0.3 });
      else if (sorte === 'niwaki') a.pinNuages(x, z, h, hasard(x, z) > 0.5 ? 1 : -1, { y });
      else a.buisson(x, y + h * 0.5, z, h, VERT_AZALEE[Math.floor(hasard(x, z) * 2)], { touffu: true });
    }
    // le reste : une grille un peu tirée au hasard
    const PAS_G = 4.2;
    for (let gx = -64; gx < 108; gx += PAS_G) for (let gz = -96; gz < 76; gz += PAS_G) {
      const x = gx + (hasard(gx, gz) - 0.5) * PAS_G * 0.8, z = gz + (hasard(gz, gx) - 0.5) * PAS_G * 0.8;
      if (surIle(x, z).d < 0.6 || bordEtang(x, z) < 0.6) continue;
      const tirage = hasard(x * 0.7 + 3, z * 1.3), dc = Math.min(surChemins(x, z).d, surPlaces(x, z)), eau = bordEtang(x, z);
      const y = terrain(x, z), colline = z < piedColline(x) + 2, loin = dc > 14;
      // près de l'étang (à moins de 9 m de son bord) : le jardin, clairsemé
      if (eau < 9 && !colline) {
        if (tirage > 0.62) continue;
        if (tirage < 0.2 && libreArbre(x, z, 2.2)) morceau(x, z).pinNuages(x, z, 5.5 + 4 * hasard(x, z), hasard(z, x) > 0.5 ? 1 : -1, { y });
        else if (tirage < 0.38 && libreArbre(x, z, 1.4)) morceau(x, z).buisson(x, y + 0.45, z, 0.75 + 0.4 * hasard(x, z), VERT_AZALEE[Math.floor(hasard(z, x) * 2)], { touffu: true });
        else if (tirage < 0.5 && libreArbre(x, z, 2.6)) morceau(x, z).arbreTouffu(x, z, 5 + 3 * hasard(x, z), VERTS_ERABLE, { y, sorte: 'houppierErable', caduc: true, large: 1.25, loin });
        else if (libreArbre(x, z, 2.4)) pinHaut(morceau(x, z), x, z, 7 + 4 * hasard(x, z), { y, loin });
        continue;
      }
      // dans la vue du belvédère du haut : de jeunes pins, bas
      if (dansVueHaut(x, z)) { if (tirage < 0.35 && libreArbre(x, z, 1.2)) morceau(x, z).pinNuages(x, z, 3.5 + 2 * hasard(x, z), 1, { y }); continue; }
      // ailleurs : le bois (plus dense sur la colline et au bord du jardin)
      if (tirage > (colline || dc > 8 ? 0.82 : 0.6)) continue;
      const u = hasard(x * 2.1, z * 1.7);
      if (u < 0.3 && libreArbre(x, z, 2.6)) morceau(x, z).arbreTouffu(x, z, 7 + 5 * hasard(x, z), VERTS_ERABLE, { y, sorte: 'houppierErable', caduc: true, large: 1.2, loin });
      else if (u < 0.55 && libreArbre(x, z, 2.8)) morceau(x, z).arbreTouffu(x, z, 9 + 6 * hasard(x, z), VERTS_FEUILLU, { y, sorte: 'persistant', large: 1.1, loin });
      else if (u < 0.78 && libreArbre(x, z, 2.2)) pinHaut(morceau(x, z), x, z, 10 + 6 * hasard(x, z), { y, loin });
      else if (libreArbre(x, z, 1.8)) morceau(x, z).sugi(x, z, 13 + 7 * hasard(x, z), { y, loin });
      // (sous les arbres de la colline, des arbustes : aucuba, nandina)
      if (colline && hasard(x, z * 3) > 0.6 && libreArbre(x + 1.6, z + 1.2, 0.9)) morceau(x + 1.6, z + 1.2).buisson(x + 1.6, terrain(x + 1.6, z + 1.2) + 0.35, z + 1.2, 0.6, '#3f6a32', { touffu: true, sorte: 'persistant' });
    }
  }
  // la forêt au loin (le mont Kinugasa, les collines du nord) : moins fine, sans trait d'encre
  const loins = new Map();
  for (let gx = -200; gx < 240; gx += 7) for (let gz = -260; gz < 200; gz += 7) {
    const x = gx + (hasard(gx, gz) - 0.5) * 5, z = gz + (hasard(gz, gx) - 0.5) * 5, d = Math.hypot(x - 20, z + 5);
    if (d < 108 || d > 250) continue;
    // (au sud-est, la ville : pas d'arbres, des toits bas au loin, plus bas)
    if (z > 40 && x > 60) continue;
    const k = `${Math.floor(x / 60)},${Math.floor(z / 60)}`;
    if (!loins.has(k)) loins.set(k, atelier());
    const a = loins.get(k), y = terrain(x, z), u = hasard(x * 1.7, z * 2.3);
    if (u < 0.45) a.arbreTouffu(x, z, 10 + 6 * hasard(x, z), VERTS_FEUILLU, { y, sorte: 'persistant', loin: true, large: 1.3 });
    else if (u < 0.75) pinHaut(a, x, z, 12 + 6 * hasard(x, z), { y, loin: true });
    else a.sugi(x, z, 14 + 8 * hasard(x, z), { y, loin: true });
  }
  for (const a of loins.values()) poser(a.fin(), 0, 0, { y: 0, trait: false });

  // ---------------------------------------------------------------- Les bâtiments du temple
  const TUILES = { tuile: P.tuileShiro, tuile2: P.tuileShiroClaire, bord: '#5c6066', avant: '#5c6066' };
  /**
   * Une salle de temple dans le repère R (sa façade vers +z) : un socle de pierre, des poteaux sombres, des murs (shōji, plâtre
   * ou planches, par côté), une galerie de planches tout autour, un toit de tuiles à pignons (irimoya) : quatre pans, et en haut
   * un pignon à deux pentes, son triangle de bois et son poisson d'ornement. o : l, p, h (le haut des murs), socle, galerie,
   * murs : { s, n, e, o } ('shoji', 'platre', 'planches', 'ouvert'), debord, hToit, ratio.
   */
  function salle(a, R, o) {
    const { l, p, h = 3.4, socle = 0.5, galerie = 1.0, murs = {}, debord = 1.8, hToit = 3.4, ratio = 0.5, bois = '#4a3a2e', tuiles = TUILES } = o;
    a.boite(l + 2 * galerie + 0.3, socle, p + 2 * galerie + 0.3, '#a49c8c', R(0, socle / 2 - 0.05, 0, { nuance: 0.06 }));
    if (galerie > 0) a.boite(l + 2 * galerie, 0.1, p + 2 * galerie, '#8a6a4e', R(0, socle + 0.05, 0, { teinte: (x) => (Math.floor(x * 4 + 99) % 2 ? '#8a6a4e' : '#7a5c42') }));
    const n = Math.max(2, Math.round(l / 2.2)), m = Math.max(2, Math.round(p / 2.2));
    const cote = (sorte, x0, z0, x1, z1, k) => {
      const lg = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(z1 - z0, -(x1 - x0)) + PI;
      for (let i = 0; i <= k; i++) { const f = i / k; a.boite(0.2, h - socle, 0.2, bois, R(x0 + (x1 - x0) * f, socle + (h - socle) / 2, z0 + (z1 - z0) * f)); }
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      if (sorte === 'ouvert') return;
      const c = sorte === 'shoji' ? P.shoji : sorte === 'platre' ? P.platre : '#8a6a4e';
      a.boite(lg - 0.1, h - socle - 0.5, 0.06, c, R(cx, socle + 0.1 + (h - socle - 0.5) / 2, cz, { ry, teinte: sorte === 'planches' ? (x, y, z) => (Math.floor((x + z) * 5 + 99) % 2 ? '#8a6a4e' : '#7a5c42') : undefined }));
      if (sorte === 'shoji') for (let i = 1; i < k * 4; i++) { const f = i / (k * 4); a.boite(0.025, h - socle - 0.5, 0.075, P.shojiCadre, R(x0 + (x1 - x0) * f, socle + 0.1 + (h - socle - 0.5) / 2, z0 + (z1 - z0) * f, { ry, trait: false })); }
      if (sorte === 'shoji') for (let j = 1; j < 5; j++) a.boite(lg - 0.1, 0.022, 0.075, P.shojiCadre, R(cx, socle + 0.1 + ((h - socle - 0.5) * j) / 5, cz, { ry, trait: false }));
      a.boite(lg + 0.2, 0.32, 0.12, bois, R(cx, h - 0.24, cz, { ry }));
      a.boite(lg - 0.1, 0.18, 0.08, P.platre, R(cx, h - 0.06 - 0.09 + 0.02, cz, { ry }));
    };
    const L2 = l / 2, P2 = p / 2;
    cote(murs.s || 'shoji', -L2, P2, L2, P2, n);
    cote(murs.n || 'platre', -L2, -P2, L2, -P2, n);
    cote(murs.e || 'shoji', L2, -P2, L2, P2, m);
    cote(murs.o || 'shoji', -L2, -P2, -L2, P2, m);
    // le toit : à quatre pans, puis le pignon du haut
    const lt = l + 2 * debord, pt = p + 2 * debord, yT = h + 0.12;
    a.toitJapon(lt, pt, hToit * 0.55, ratio, { ...tuiles, creux: 1.6, releve: 0.32, epaisseur: 0.16, rangs: 26, ...R(0, yT, 0) });
    const lh = lt * ratio, ph = pt * ratio, yH = yT + hToit * 0.55;
    a.pignon(lh + 0.5, hToit * 0.45, ph + 0.5, tuiles.tuile, R(0, yH - 0.02, 0));
    // les triangles des pignons (bois sombre), le faîtage et ses tuiles d'ornement
    for (const s of [-1, 1]) {
      const pos = [], cols = [], X = s * (lh / 2 - 0.2), A = R(X, yH, -ph / 2), B = R(X, yH, ph / 2), C = R(X, yH + hToit * 0.42, 0);
      tri(pos, cols, [A.x, A.y, A.z], [B.x, B.y, B.z], [C.x, C.y, C.z], bois, [s * Math.cos(R(0, 0, 0).ry), 0, -s * Math.sin(R(0, 0, 0).ry)]);
      a.piece(geo(pos), bois, { couleurs: cols });
      a.boite(0.4, 0.5, 0.3, '#5c6066', R(s * (lh / 2 + 0.2), yH + hToit * 0.45 + 0.1, 0));
    }
    a.boite(lh + 0.9, 0.3, 0.36, '#5c6066', R(0, yH + hToit * 0.45 + 0.02, 0));
    return a;
  }
  // le hōjō (方丈), la grande salle du temple, et sa galerie ; derrière (au nord), la cour du pin en barque
  {
    const a = atelier(), R = repere(HOJO.x, HOJO.z, 0);
    salle(a, R, { l: HOJO.l, p: HOJO.p, h: 4.1, socle: 0.6, galerie: 1.2, murs: { s: 'shoji', n: 'shoji', e: 'platre', o: 'shoji' }, debord: 2.2, hToit: 4.6, ratio: 0.46 });
    poser(a.fin(), 0, 0, { y: terrain(HOJO.x, HOJO.z) });
    monde.surface(HOJO.x - HOJO.l / 2 - 1.5, HOJO.x + HOJO.l / 2 + 1.5, HOJO.z - HOJO.p / 2 - 1.5, HOJO.z + HOJO.p / 2 + 1.5, 9, { plein: true });
  }
  // le kuri (庫裏) : la grande maison des moines, son immense pignon blanc tourné vers l'entrée, ses poutres noires, sa cheminée
  // de fumée sur le faîte
  {
    const a = atelier(), R = repere(KURI.x, KURI.z, 0), l = KURI.l, p = KURI.p, h = 4.2;
    a.boite(l + 0.6, 0.5, p + 0.6, '#a49c8c', R(0, 0.2, 0));
    for (const [x0, z0, x1, z1] of [[-l / 2, p / 2, l / 2, p / 2], [l / 2, -p / 2, l / 2, p / 2], [-l / 2, -p / 2, -l / 2, p / 2], [-l / 2, -p / 2, l / 2, -p / 2]]) {
      const lg = Math.hypot(x1 - x0, z1 - z0), ry = Math.abs(z1 - z0) > 0.1 ? PI / 2 : 0;
      a.boite(lg, h - 0.45, 0.25, P.platre, R((x0 + x1) / 2, 0.45 + (h - 0.45) / 2, (z0 + z1) / 2, { ry }));
      for (let i = 0; i <= Math.round(lg / 1.8); i++) { const f = i / Math.round(lg / 1.8); a.boite(0.22, h - 0.45, 0.3, '#2e2622', R(x0 + (x1 - x0) * f, 0.45 + (h - 0.45) / 2, z0 + (z1 - z0) * f)); }
      a.boite(lg + 0.2, 0.25, 0.3, '#2e2622', R((x0 + x1) / 2, 2.4, (z0 + z1) / 2, { ry }));
    }
    // le grand pignon (vers l'entrée, au sud) : le triangle de plâtre blanc, la grille de poutres noires
    const hp = 5.6, yb = h;
    for (const s of [-1, 1]) {
      const pos = [], cols = [], zz = s * (p / 2 + 0.02), A = R(-l / 2 - 0.1, yb, zz), B = R(l / 2 + 0.1, yb, zz), C = R(0, yb + hp, zz);
      tri(pos, cols, [A.x, A.y, A.z], [B.x, B.y, B.z], [C.x, C.y, C.z], P.platre, [0, 0, s]);
      a.piece(geo(pos), P.platre, { couleurs: cols });
      for (const f of [-0.5, -0.25, 0, 0.25, 0.5]) { const hh = hp * (1 - Math.abs(f) * 2) - 0.1; if (hh > 0.3) a.boite(0.2, hh, 0.12, '#2e2622', R(f * l * 0.95, yb + hh / 2, zz + s * 0.04)); }
      for (const t of [0.33, 0.66]) a.boite(l * (1 - t) * 0.98, 0.18, 0.12, '#2e2622', R(0, yb + hp * t, zz + s * 0.04));
    }
    // le toit à deux pentes, ses bords de tuiles, le faîte et sa cheminée (煙出し)
    const ang = Math.atan2(hp, l / 2), long = Math.hypot(hp, l / 2) + 1.8;
    for (const s of [-1, 1]) a.boite(long, 0.24, p + 2.6, s < 0 ? P.tuileShiro : P.tuileShiroClaire, R(s * (l / 4 + 0.45), h + hp / 2 - 0.5, 0, { rz: -s * ang }));
    a.boite(0.6, 0.45, p + 2.8, '#5c6066', R(0, h + hp + 0.15, 0));
    a.boite(1.6, 0.9, 2.2, P.platre, R(0, h + hp + 0.7, 0)).pignon(2.2, 0.6, 2.8, P.tuileShiro, R(0, h + hp + 1.15, 0, { ry: PI / 2 }));
    // l'entrée : l'auvent, la grande porte de bois
    a.boite(4.2, 2.8, 0.12, '#5a4636', R(0, 1.9, p / 2 + 0.14, { teinte: (x) => (Math.floor(x * 3 + 99) % 2 ? '#5a4636' : '#4a3a2e') }));
    a.toitJapon(6.4, 2.6, 0.9, 0.2, { ...TUILES, rangs: 12, ...R(0, 3.7, p / 2 + 1.1) });
    poser(a.fin(), 0, 0, { y: terrain(KURI.x, KURI.z) });
    monde.surface(KURI.x - l / 2 - 0.6, KURI.x + l / 2 + 0.6, KURI.z - p / 2 - 0.6, KURI.z + p / 2 + 0.6, 12, { plein: true });
  }
  /** Un mur de terre (築地塀) de [x0, z0] à [x1, z1] : le soubassement de pierre, le plâtre blanc et ses cinq lignes, le chaperon de tuiles. */
  const murTerre = (a, x0, z0, x1, z1, h = 2.4) => {
    const l = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0) + PI / 2, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, y = terrain(cx, cz);
    a.boite(l, 0.45, 0.7, '#a49c8c', { x: cx, y: y + 0.12, z: cz, ry })
      .boite(l, h - 0.4, 0.56, P.platre, { x: cx, y: y + 0.35 + (h - 0.4) / 2, z: cz, ry });
    for (let k = 0; k < 5; k++) a.boite(l, 0.035, 0.58, '#e6e2d8', { x: cx, y: y + h * 0.48 + k * 0.17, z: cz, ry, trait: false });
    a.pignon(l + 0.1, 0.42, 1.1, P.tuileShiro, { x: cx, y: y + h - 0.04, z: cz, ry });
    return a;
  };
  // le portail du hōjō (唐門), au toit en arc chinois, toujours fermé, dans le mur blanc qui borde la cour
  {
    const a = atelier(), K = KARAMON, y = terrain(K.x, K.z), R = repere(K.x, K.z, 0);
    for (const s of [-1, 1]) {
      a.boite(0.3, 3.2, 0.3, '#3a2e26', R(s * 1.6, y + 1.6, 0)).boite(0.24, 2.9, 0.24, '#3a2e26', R(s * 1.6, y + 1.45, -1.2));
      a.boite(1.5, 2.6, 0.1, '#4a3a2e', R(s * 0.78, y + 1.4, 0.02, { teinte: (x, yy) => (Math.floor(yy * 3 + 99) % 4 === 0 ? '#2e2622' : '#4a3a2e') }));
      for (const yy of [0.8, 1.6, 2.4]) a.boite(1.4, 0.06, 0.02, P.noir, R(s * 0.78, y + yy, 0.08, { trait: false }));
    }
    a.boite(3.6, 0.32, 0.3, '#3a2e26', R(0, y + 3.25, 0)).boite(3.6, 0.3, 0.3, '#3a2e26', R(0, y + 3.2, -1.2));
    // le toit en arc (唐破風) : un pignon cintré, en tuiles
    const pts = [];
    for (let k = 0; k <= 12; k++) { const t = k / 12 - 0.5; pts.push([t * 4.4, 3.65 + 0.9 * Math.cos(t * PI) - 0.25 * Math.cos(t * PI * 3) * 0.3, 0]); }
    for (let k = 0; k < 12; k++) {
      const [x0, y0] = pts[k], [x1, y1] = pts[k + 1];
      a.boite(Math.hypot(x1 - x0, y1 - y0) + 0.02, 0.18, 3.0, k % 2 ? P.tuileShiro : P.tuileShiroClaire, R((x0 + x1) / 2, y + (y0 + y1) / 2, -0.6, { rz: Math.atan2(y1 - y0, x1 - x0) }));
    }
    poser(a.fin(), 0, 0, { y: 0 });
    const m = atelier();
    murTerre(m, 46.6, 44.6, K.x - 1.8, 44.6); murTerre(m, K.x + 1.8, 44.6, 71.6, 44.6);
    poser(m.fin(), 0, 0, { y: 0 });
  }
  // le portail d'entrée (総門), à l'est, et les murs qui ferment le jardin au sud et à l'est
  {
    const a = atelier(), S = SOMON, y = terrain(S.x, S.z), R = repere(S.x, S.z, PI / 2);
    for (const s of [-1, 1]) {
      a.boite(0.36, 3.6, 0.36, '#3a2e26', R(s * 2.2, y + 1.8, 0)).boite(0.26, 3.2, 0.26, '#3a2e26', R(s * 2.2, y + 1.6, -1.6));
      // les battants ouverts, contre les côtés
      a.boite(0.1, 3.0, 2.0, '#4a3a2e', R(s * 2.05, y + 1.6, -1.05, { teinte: (x, yy) => (Math.floor(yy * 3 + 99) % 4 === 0 ? '#2e2622' : '#4a3a2e') }));
    }
    a.boite(5.0, 0.4, 0.4, '#3a2e26', R(0, y + 3.55, 0)).boite(5.0, 0.36, 0.3, '#3a2e26', R(0, y + 3.4, -1.6));
    a.toitJapon(6.6, 3.8, 1.1, 0.08, { ...TUILES, rangs: 16, ...R(0, y + 3.75, -0.8) });
    a.boite(6.0, 0.3, 0.3, '#5c6066', R(0, y + 4.9, -0.8));
    poser(a.fin(), 0, 0, { y: 0 });
    // (de chaque côté du passage, les poteaux et le battant ouvert arrêtent le joueur)
    for (const s of [-1, 1]) { const q0 = R(s * 2.12, 0, 0.2), q1 = R(s * 2.12, 0, -2.15); monde.mur(q0.x, q0.z, q1.x, q1.z, 0.32); }
    // les murs : au sud, du portail jusqu'au belvédère, derrière la cloche et le guichet ; à l'est, au nord du portail
    const m = atelier();
    murTerre(m, S.x - 0.2, S.z + 2.6, S.x - 0.2, S.z + 12);
    murTerre(m, S.x - 0.2, S.z - 2.6, S.x - 0.2, S.z - 22);
    for (const [x0, z0, x1, z1] of [[S.x - 0.2, 72.4, 82, 72.4], [82, 72.4, 62, 72.4], [62, 72.4, 46, 71.2]]) murTerre(m, x0, z0, x1, z1);
    poser(m.fin(), 0, 0, { y: 0 });
  }
  // le clocher (鐘楼) : un socle de pierre, quatre poteaux, un toit de tuiles, la cloche de bronze (de l'époque de Kamakura,
  // dit-on ; elle sonne « la », la note qui sert de référence) et la poutre qui la frappe, pendue à ses cordes
  // La cloche (梵鐘, d'après les photos des cloches japonaises ; avant le 2026-10-27, un cylindre vert à dents de scie : « tu
  // peux la refaire mieux que ça ») : sa boucle en têtes de dragon (竜頭), le dôme (笠形), le corps de bronze à peine évasé,
  // ses bandes en relief, en long et en travers (袈裟襷), les quatre champs de mamelons du haut (乳), les deux fleurs de lotus
  // où frappe la poutre (撞座) ; la poutre de bois (撞木) pendue en travers de la cloche, sa corde à tirer. Devant le socle,
  // trois marches de pierre ; des traverses entre les poteaux.
  {
    const a = atelier(), S = SHORO, y = terrain(S.x, S.z), R = repere(S.x, S.z, 0);
    const BOIS = '#4a3a2e', BRONZE = '#4e584a', RELIEF = '#5f6b58', CLAIR = '#6c765f';
    a.boite(4.6, 1.2, 4.6, '#a49c8c', R(0, y + 0.55, 0, { nuance: 0.07 }));
    // (chacune un peu plus large que celle du dessus, sans se chevaucher : leurs faces ne se confondent pas)
    for (let k = 0; k < 3; k++) a.boite(1.7 + k * 0.05, 0.86 - k * 0.29 + k * 0.02, 0.35, '#9a9283', R(0, y + (0.86 - k * 0.29 - k * 0.02) / 2 + 0.01, -2.475 - k * 0.35, { nuance: 0.06 }));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.boite(0.26, 3.4, 0.26, BOIS, R(sx * 1.55, y + 1.15 + 1.7, sz * 1.55, { rz: -sx * 0.04, rx: sz * 0.04 }));
    // (les traverses dans les deux sens, à 3 cm l'une de l'autre en hauteur : leurs dessus ne se confondent pas aux coins)
    for (const s of [-1, 1]) a.boite(3.5, 0.18, 0.14, BOIS, R(0, y + 4.05, s * 1.5)).boite(0.14, 0.18, 3.5, BOIS, R(s * 1.5, y + 4.02, 0));
    a.boite(3.7, 0.3, 0.3, BOIS, R(0, y + 4.5, 0)).boite(0.3, 0.3, 3.7, BOIS, R(0, y + 4.5, 0));
    a.toitJapon(5.6, 5.6, 1.6, 0.3, { ...TUILES, rangs: 14, ...R(0, y + 4.66, 0) });
    a.pignon(1.9, 0.7, 1.9, P.tuileShiro, R(0, y + 6.22, 0));
    // la cloche : 1,45 m, son bord à 2,45 m au-dessus du socle
    const yb = y + 2.45, H = 1.2, rayonC = (f) => 0.5 - 0.06 * f ** 0.8;
    const profil = [[0.0, 0.02], [0.47, 0.0], [0.505, 0.03], [0.5, 0.1]];
    for (let k = 1; k <= 8; k++) profil.push([rayonC(k / 8), 0.1 + ((H - 0.1) * k) / 8]);
    for (const [r, h] of [[0.42, H + 0.06], [0.33, H + 0.13], [0.18, H + 0.18], [0.0, H + 0.19]]) profil.push([r, h]);
    a.piece(new THREE.LatheGeometry(profil.map(([r, h]) => new THREE.Vector2(r, h)), 24), BRONZE, R(0, yb, 0, { nuance: 0.04 }));
    // les bandes en travers (en bas, au milieu, en haut) et en long (quatre, doubles)
    for (const [f, hh] of [[0.06, 0.07], [0.42, 0.05], [0.62, 0.035], [0.97, 0.05]]) {
      const r = rayonC(f) + 0.018;
      a.cylindre(r, r, hh, 24, RELIEF, R(0, yb + 0.1 + (H - 0.1) * f, 0, { trait: false }));
    }
    for (let k = 0; k < 8; k++) {
      const t = (Math.floor(k / 2) * PI) / 2 + (k % 2 ? 0.07 : -0.07), r = rayonC(0.75) + 0.012;
      a.boite(0.035, (H - 0.1) * 0.55, 0.03, RELIEF, R(Math.sin(t) * r, yb + 0.1 + (H - 0.1) * 0.69, Math.cos(t) * r, { ry: t, trait: false }));
    }
    // les mamelons : quatre champs de trois sur quatre, entre la bande du haut et celle du tiers
    for (let q = 0; q < 4; q++) for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) {
      const t = (q * PI) / 2 + PI / 4 + (i - 1) * 0.24, f = 0.68 + j * 0.085, r = rayonC(f) + 0.012;
      a.boule(0.028, CLAIR, R(Math.sin(t) * r, yb + 0.1 + (H - 0.1) * f, Math.cos(t) * r, { trait: false }));
    }
    // les deux fleurs de lotus où l'on frappe, devant et derrière (vers la poutre)
    for (const s of [-1, 1]) {
      const r = rayonC(0.22) + 0.01, q = R(0, yb + 0.1 + (H - 0.1) * 0.22, s * r);
      a.cylindre(0.1, 0.1, 0.03, 12, RELIEF, { ...q, rx: PI / 2, trait: false }).cylindre(0.045, 0.045, 0.045, 10, CLAIR, { ...q, rx: PI / 2, trait: false });
    }
    // la boucle en têtes de dragon, le crochet de fer
    a.anneau(0.11, 0.035, RELIEF, R(0, yb + H + 0.32, 0, { ry: PI / 2 }));
    for (const s of [-1, 1]) a.boule(0.07, RELIEF, R(s * 0.1, yb + H + 0.23, 0, { sx: 1.3, sy: 0.8 }), 1);
    a.cylindre(0.035, 0.035, 0.24, 6, P.noir, R(0, y + 4.3, 0, { trait: false }));
    // la poutre de bois qui frappe : en travers, devant la cloche (vers l'allée), pendue à deux cordes ; la corde à tirer
    const yp = yb + 0.1 + (H - 0.1) * 0.22;
    a.baton([S.x, yp, S.z - 0.62], [S.x, yp, S.z - 2.2], 0.1, '#c9a77c', 10);
    for (const dz of [-0.95, -1.85]) a.baton([S.x, yp + 0.08, S.z + dz], [S.x, y + 4.36, S.z + dz], 0.014, '#d8c9a8', 4, { trait: false });
    a.tube([[S.x, yp - 0.05, S.z - 2.15], [S.x + 0.04, yp - 0.5, S.z - 2.2], [S.x + 0.02, yp - 1.1, S.z - 2.25]], 0.02, '#d8c9a8', { cotes: 5, pas: 8, trait: false });
    poser(a.fin(), 0, 0, { y: 0 });
    monde.surface(S.x - 2.5, S.x + 2.5, S.z - 2.5, S.z + 2.5, y + 2, { plein: true });
    // (les marches arrêtent le joueur)
    monde.surface(S.x - 1.15, S.x + 1.15, S.z - 3.6, S.z - 2.4, y + 2, { plein: true });
  }
  /**
   * Une maisonnette à guichet (les billets, les goshuin), creuse pour qu'on voie le moine derrière sa fenêtre : des murs de
   * plâtre de l × p × h dans le repère R (la fenêtre sur la face +z, large de fl, entre les hauteurs f0 et f1), les poteaux
   * d'angle, la sablière, le comptoir devant la fenêtre ; les murs arrêtent le joueur.
   */
  const guichet = (a, R, y, { l, p, h, fl, f0, f1 }) => {
    const e = 0.12, mur = (w, hh, d, x, yy, z) => a.boite(w, hh, d, P.platre, R(x, y + yy, z));
    mur(l, h, e, 0, h / 2, -p / 2 + e / 2);
    for (const s of [-1, 1]) mur(e, h, p - 2 * e, s * (l / 2 - e / 2), h / 2, 0);
    mur(l, f0, e, 0, f0 / 2, p / 2 - e / 2);
    mur(l, h - f1, e, 0, (f1 + h) / 2, p / 2 - e / 2);
    for (const s of [-1, 1]) mur((l - fl) / 2, f1 - f0, e, s * (fl / 2 + (l - fl) / 4), (f0 + f1) / 2, p / 2 - e / 2);
    for (const lx of [-l / 2, l / 2]) for (const lz of [-p / 2, p / 2]) a.boite(0.16, h, 0.16, '#4a3a2e', R(lx, y + h / 2, lz));
    a.boite(l + 0.2, 0.24, p + 0.2, '#4a3a2e', R(0, y + h + 0.1, 0))
      .boite(fl + 0.4, 0.08, 0.5, '#7a5c42', R(0, y + f0 - 0.02, p / 2 + 0.2));
    // (devant, le mur arrête le joueur au bord du comptoir)
    const av = p / 2 + 0.42;
    for (const [x0, z0, x1, z1, r] of [[-l / 2, -p / 2, l / 2, -p / 2, 0.12], [-l / 2, av, l / 2, av, 0.15], [-l / 2, -p / 2, -l / 2, av, 0.12], [l / 2, -p / 2, l / 2, av, 0.12]]) {
      const q0 = R(x0, 0, z0), q1 = R(x1, 0, z1);
      monde.mur(q0.x, q0.z, q1.x, q1.z, r);
    }
  };
  // le guichet (拝観受付) : une petite maison à fenêtre ; on y achète le billet, un porte-bonheur de papier
  {
    const a = atelier(), U = UKETSUKE, y = terrain(U.x, U.z), R = repere(U.x, U.z, PI);
    guichet(a, R, y, { l: 4.2, p: 3.0, h: 2.55, fl: 2.6, f0: 1.05, f1: 2.05 });
    for (const x of [-0.65, 0.65]) a.boite(0.05, 1.0, 0.05, '#4a3a2e', R(x, y + 1.55, 1.44, { trait: false }));
    a.toitJapon(5.4, 4.4, 0.9, 0.25, { ...TUILES, rangs: 12, ...R(0, y + 2.75, 0) });
    a.boite(0.5, 1.4, 0.06, '#f4efe2', R(-1.75, y + 1.6, 1.54));
    // dedans : un plancher surélevé (le moine voit par la fenêtre), la table des billets, les rouleaux de billets
    a.boite(3.9, 0.1, 2.7, '#8a6a4e', R(0, y + 0.3, 0)).boite(2.2, 0.06, 0.5, '#7a5c42', R(0, y + 0.95, 1.1)).boite(0.12, 0.95, 0.4, '#5a4636', R(-0.95, y + 0.47, 1.1)).boite(0.12, 0.95, 0.4, '#5a4636', R(0.95, y + 0.47, 1.1));
    for (const x of [-0.5, -0.3]) a.cylindre(0.06, 0.06, 0.1, 10, '#f4efe2', { ...R(x, y + 1.03, 1.15), nuance: 0.02 });
    poser(a.fin(), 0, 0, { y: 0 });
    ecrire({ x: U.x, y, z: U.z, ry: PI }, { texte: '拝観受付', x: -1.75, y: 1.6, z: 1.58, l: 0.4, h: 1.25, vertical: true, encre: '#2a2420', fond: '#f4efe2' });
  }
  // le grand chêne (櫟樫), vieux de trois siècles et demi, protégé par une corde basse
  {
    const a = atelier(), I = ICHIIGASHI, y = terrain(I.x, I.z);
    a.arbreTouffu(I.x, I.z, 15, VERTS_FEUILLU, { y, sorte: 'persistant', large: 1.7, rTronc: 0.75 });
    for (let k = 0; k < 8; k++) { const t = (k / 8) * 2 * PI; a.baton([I.x + Math.cos(t) * 2.6, y - 0.1, I.z + Math.sin(t) * 2.6], [I.x + Math.cos(t) * 2.6, y + 0.55, I.z + Math.sin(t) * 2.6], 0.04, '#6a5a48', 5); }
    poser(a.fin(), 0, 0, { y: 0 });
    monde.cercle(I.x, I.z, 2.9);
  }

  // ---------------------------------------------------------------- Les haies de bambou (金閣寺垣) et les clôtures basses
  /**
   * Une haie basse de bambou le long des points [[x, z], …] : le style du Pavillon d'or (金閣寺垣), des bambous debout serrés,
   * deux lisses de bambou de chaque côté, le dessus couvert d'un bambou fendu (玉縁), noués de cordes noires ; haute de h.
   */
  const haieKinkaku = (a, pts, h = 0.62) => {
    for (let i = 0; i + 1 < pts.length; i++) {
      const [x0, z0] = pts[i], [x1, z1] = pts[i + 1], l = Math.hypot(x1 - x0, z1 - z0), ux = (x1 - x0) / l, uz = (z1 - z0) / l, nx = -uz, nz = ux;
      const n = Math.max(2, Math.floor(l / 0.11));
      for (let k = 0; k < n; k++) {
        const f = (k + 0.5) / n, x = x0 + (x1 - x0) * f, z = z0 + (z1 - z0) * f, y = terrain(x, z);
        a.cylindre(0.026, 0.026, h + 0.1, 5, k % 3 ? '#c9b07a' : '#b89a62', { x, y: y + (h - 0.1) / 2, z, trait: false });
      }
      for (const s of [-1, 1]) for (const hh of [0.22, 0.44]) {
        const ya = terrain(x0, z0) + hh, yb = terrain(x1, z1) + hh;
        a.baton([x0 + nx * s * 0.05, ya, z0 + nz * s * 0.05], [x1 + nx * s * 0.05, yb, z1 + nz * s * 0.05], 0.022, '#c4a86c', 5, { trait: false });
      }
      a.baton([x0, terrain(x0, z0) + h + 0.02, z0], [x1, terrain(x1, z1) + h + 0.02, z1], 0.07, '#b89a62', 6);
      // les nœuds de corde noire, aux poteaux
      for (let k = 0; k <= Math.floor(l / 1.8); k++) {
        const f = Math.min(1, (k * 1.8) / l), x = x0 + (x1 - x0) * f, z = z0 + (z1 - z0) * f, y = terrain(x, z);
        a.cylindre(0.045, 0.045, h + 0.2, 6, '#8a6a42', { x, y: y + h / 2, z });
        a.boite(0.15, 0.05, 0.15, '#2a2420', { x, y: y + 0.44, z, ry: Math.atan2(ux, uz), trait: false });
      }
    }
  };
  /** Une clôture basse au bord des allées (四つ目垣) : des pieux de bambou tous les 1,8 m, deux bambous couchés, noués noir. */
  const cloture = (a, pts) => {
    for (let i = 0; i + 1 < pts.length; i++) {
      const [x0, z0] = pts[i], [x1, z1] = pts[i + 1], l = Math.hypot(x1 - x0, z1 - z0);
      const n = Math.max(1, Math.round(l / 1.8));
      for (let k = 0; k <= n; k++) {
        const f = k / n, x = x0 + (x1 - x0) * f, z = z0 + (z1 - z0) * f, y = terrain(x, z);
        if (k < n || i === pts.length - 2) a.cylindre(0.032, 0.036, 0.62, 5, '#a88a52', { x, y: y + 0.26, z });
      }
      for (const hh of [0.28, 0.5]) a.baton([x0, terrain(x0, z0) + hh, z0], [x1, terrain(x1, z1) + hh, z1], 0.022, '#b89a62', 5, { trait: false });
    }
  };
  {
    // les clôtures : le long des allées, à 35 cm du bord où l'on marche, là où il n'y a ni autre allée, ni place, ni eau, ni
    // bâtiment, ni ruisseau ; en morceaux (comme les arbres). La ligne suit le bord en onglet aux coudes : avant le 2026-10-27,
    // décalée segment par segment, elle passait à l'intérieur d'un virage dans l'allée, et la clôture s'y coupait (des trous)
    const ici = (x, z) => surChemins(x, z).d > 0.25 && surPlaces(x, z) > 0.25 && bordEtang(x, z) > 0.8 && !BATIS.some(([a0, a1, b0, b1]) => x > a0 && x < a1 && z > b0 && z < b1)
      && surLaLigne(RUISSEAU, x, z).d > 1.6 && !PONTS.some((p) => p.kokei && Math.hypot(x - p.x, z - p.z) < p.portee / 2 + 3.0)
      // (devant les marches du sanctuaire Shin'un, une ouverture)
      && !(Math.abs((x - SHINUN.x) * Math.cos(0.35) - (z - SHINUN.z) * Math.sin(0.35)) < 0.85 && Math.abs((x - SHINUN.x) * Math.sin(0.35) + (z - SHINUN.z) * Math.cos(0.35) - 1.5) < 1.5);
    /** Une clôture le long de la ligne bord [[x, z], …], un poteau tous les 90 cm, coupée là où elle n'a pas sa place. */
    const longer = (bord) => {
      let ligne = [];
      const fin = () => { if (ligne.length >= 2) cloture(morceau(ligne[0][0], ligne[0][1]), ligne); ligne = []; };
      const point = (x, z) => {
        if (ici(x, z)) ligne.push([x, z]); else fin();
        if (ligne.length > 12) { const der = ligne[ligne.length - 1]; fin(); ligne.push(der); }
      };
      for (let i = 0; i + 1 < bord.length; i++) {
        const [x0, z0] = bord[i], [x1, z1] = bord[i + 1], l = Math.hypot(x1 - x0, z1 - z0);
        for (let t = 0; t < l - 0.3; t += 0.9) point(x0 + ((x1 - x0) * t) / l, z0 + ((z1 - z0) * t) / l);
      }
      point(...bord[bord.length - 1]);
      fin();
    };
    for (const ch of CHEMINS) {
      if (ch.escalier) continue;
      const P = ch.pts, n = P.length, e = ch.w + 0.35;
      const normale = (i) => { const [x0, z0] = P[i], [x1, z1] = P[i + 1], l = Math.hypot(x1 - x0, z1 - z0); return [-(z1 - z0) / l, (x1 - x0) / l]; };
      for (const s of [-1, 1]) {
        longer(P.map(([x, z], i) => {
          const a = normale(Math.max(0, i - 1)), b = normale(Math.min(n - 2, i)), mx = a[0] + b[0], mz = a[1] + b[1], ml = Math.hypot(mx, mz) || 1;
          const k = e / Math.max(0.5, (mx * b[0] + mz * b[1]) / ml);
          return [x + (mx / ml) * s * k, z + (mz / ml) * s * k];
        }));
      }
    }
    // et autour des places, là où elles bordent la mousse (avant le 2026-10-27, rien : la clôture des allées s'arrêtait au
    // bord d'une place, comme un trou) ; pas autour du belvédère, qui a sa rambarde au bord de l'eau
    for (const pl of PLACES.slice(1)) {
      const k = 1 + 0.35 / Math.min(pl.rx, pl.rz), c = Math.cos(pl.ry), sn = Math.sin(pl.ry), n = Math.max(12, Math.round((2 * PI * Math.max(pl.rx, pl.rz) * k) / 0.9));
      const bord = [];
      for (let i = 0; i <= n; i++) {
        const t = (i / n) * 2 * PI, u = Math.cos(t) * pl.rx * k, v = Math.sin(t) * pl.rz * k;
        bord.push([pl.x + u * c + v * sn, pl.z - u * sn + v * c]);
      }
      longer(bord);
    }
  }

  // ---------------------------------------------------------------- Derrière le pavillon : le sanctuaire, les sources
  // le petit sanctuaire Shin'un (榊雲), des dieux protecteurs du temple (Kasuga), sous les arbres, sur une terrasse taillée
  // dans la pente (REPLATS), son muret de pierre devant et deux marches : le petit temple shintō au toit de cuivre vert dont la
  // pente de devant s'allonge en auvent (流造), ses poteaux vermillon, ses murs blancs, ses planches croisées au bout du faîte
  // (千木) et ses rondins couchés dessus (鰹木) ; devant, le tronc des offrandes, deux petites lanternes de pierre, le torii.
  // (Avant le 2026-10-27, une boîte sur un socle posé de travers sur la pente, et un torii qui flottait.)
  {
    const a = atelier(), S = SHINUN, y = terrain(S.x, S.z), R = repere(S.x, S.z, 0.35), V = P.vermillon, CUIVRE = '#5f9a84', BLANC = '#efe8d8';
    const Rr = (lx, yy, lz, o = {}) => ({ ...R(lx, yy, lz, o), ordre: 'YXZ' });
    // le muret de devant (quatre pierres, du sol d'en bas jusqu'au-dessus de la terrasse), une trouée et deux marches
    for (const [x0, x1] of [[-1.95, -0.45], [0.45, 1.95]]) {
      // (des pierres de tailles inégales, posées en deux rangs : le bas, plus large, et le haut)
      for (let k = 0, n = 4; k < n; k++) {
        const u0 = x0 + ((x1 - x0) * k) / n, u1 = x0 + ((x1 - x0) * (k + 1)) / n, q = R((u0 + u1) / 2, 0, 1.58), bas = terrain(q.x, q.z + 0.3) - 0.25, mi = (y + bas) / 2 - 0.05;
        a.boite(u1 - u0 - 0.03, mi - bas, 0.4, ['#8f887a', '#9a9283', '#857f72'][k % 3], { ...R((u0 + u1) / 2, (mi + bas) / 2, 1.6), nuance: 0.08 });
        const v0 = k ? u0 - 0.12 : u0, v1 = k === n - 1 ? u1 : u1 - 0.12;
        a.boite(v1 - v0 - 0.03, y + 0.1 + 0.04 * hasard(k, x0) - mi, 0.33, ['#9a9283', '#857f72', '#a39b8b'][(k + 1) % 3], { ...R((v0 + v1) / 2, (y + 0.1 + mi) / 2, 1.58), nuance: 0.08 });
      }
    }
    for (const [lz, dy] of [[1.6, 0.1], [1.95, 0.24]]) { const q = R(0, 0, lz), bas = terrain(q.x, q.z) - 0.25; a.boite(0.88, y - dy - bas, 0.36, '#9a9283', { ...R(0, (y - dy + bas) / 2, lz), nuance: 0.06 }); }
    // le socle de pierre, le petit temple (son plancher, ses poteaux, ses murs, sa porte), son escalier de bois
    a.boite(1.5, 0.46, 1.4, '#9a9283', R(0, y + 0.2, -0.6, { nuance: 0.07 }));
    a.boite(1.06, 0.06, 1.06, '#6a4a32', R(0, y + 0.46, -0.6));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.boite(0.09, 0.82, 0.09, V, R(sx * 0.44, y + 0.88, -0.6 + sz * 0.44));
    a.boite(0.82, 0.74, 0.04, BLANC, R(0, y + 0.86, -1.03)).boite(0.04, 0.74, 0.82, BLANC, R(-0.44, y + 0.86, -0.6)).boite(0.04, 0.74, 0.82, BLANC, R(0.44, y + 0.86, -0.6));
    a.boite(0.8, 0.72, 0.05, '#4a3428', R(0, y + 0.86, -0.17)).boite(0.03, 0.72, 0.06, '#c9a13b', R(0, y + 0.86, -0.15, { trait: false }));
    a.boite(0.98, 0.08, 0.98, V, R(0, y + 1.29, -0.6));
    for (let k = 0; k < 3; k++) a.boite(0.6, 0.05, 0.16, '#6a4a32', R(0, y + 0.37 - k * 0.13, -0.05 + k * 0.17));
    for (const s of [-1, 1]) a.boite(0.07, 0.95, 0.07, V, R(s * 0.4, y + 0.48, 0.42));
    // le toit : la pente de derrière, courte, et celle de devant qui s'allonge en auvent jusqu'aux deux poteaux ; le faîte, les
    // pignons, les planches croisées, les rondins
    const toit = (lz0, y0, lz1, y1) => {
      const L = Math.hypot(lz1 - lz0, y1 - y0), ang = Math.atan2(y0 - y1, lz1 - lz0);
      a.boite(1.5, 0.07, L, CUIVRE, Rr(0, y + (y0 + y1) / 2, (lz0 + lz1) / 2, { rx: ang, teinte: (xx, yy, zz) => (Math.floor((xx * 0.94 - zz * 0.34) * 9 + 99) % 2 ? CUIVRE : '#6aa890') }))
        .boite(1.46, 0.02, L - 0.04, '#6a4a32', Rr(0, y + (y0 + y1) / 2 - 0.045, (lz0 + lz1) / 2, { rx: ang, trait: false }));
    };
    toit(-0.62, 1.82, 0.62, 1.03);
    toit(-0.62, 1.82, -1.38, 1.24);
    a.pignon(1.0, 0.5, 0.96, '#6a4a32', R(0, y + 1.32, -0.6)).boite(1.6, 0.08, 0.1, '#4a7a68', R(0, y + 1.87, -0.62));
    for (const s of [-1, 1]) for (const t of [-1, 1]) a.boite(0.035, 0.5, 0.06, '#4a7a68', Rr(s * 0.74, y + 1.95, -0.62 + t * 0.12, { rx: t * 0.62 }));
    for (const lx of [-0.4, 0, 0.4]) a.cylindre(0.045, 0.045, 0.32, 8, '#c9a13b', Rr(lx, y + 1.95, -0.62, { rx: PI / 2 }));
    // le tronc des offrandes, deux petites lanternes de pierre
    a.boite(0.5, 0.3, 0.3, '#6a4a32', R(0, y + 0.15, 0.6)).boite(0.46, 0.02, 0.26, '#3a2a20', R(0, y + 0.31, 0.6, { trait: false }));
    for (const s of [-1, 1]) { const q = R(s * 1.35, 0, 0.55); a.lanterne(q.x, q.z, 3.6, y); }
    // le torii (明神鳥居) : deux poteaux un peu penchés vers l'intérieur sur leurs bagues noires, la traverse (貫), le
    // linteau du haut aux bouts relevés (笠木, son dessus noir), le petit poteau du milieu (額束)
    for (const s of [-1, 1]) {
      a.cylindre(0.05, 0.06, 1.42, 10, V, R(s * 0.52, y + 0.71, 1.05, { rz: s * 0.03 }));
      a.cylindre(0.075, 0.075, 0.12, 10, '#2a2420', R(s * 0.52, y + 0.06, 1.05));
    }
    a.boite(1.34, 0.07, 0.07, V, R(0, y + 1.12, 1.05)).boite(0.08, 0.2, 0.06, V, R(0, y + 1.28, 1.05));
    a.boite(1.48, 0.07, 0.1, V, R(0, y + 1.41, 1.05));
    for (const s of [-1, 1]) a.boite(0.42, 0.08, 0.12, '#2a2420', Rr(s * 0.6, y + 1.5, 1.05, { rz: s * 0.12 }));
    a.boite(0.8, 0.08, 0.12, '#2a2420', R(0, y + 1.48, 1.05));
    // derrière, la pente taillée retenue par quelques pierres moussues
    for (const [lx, lz, r] of [[-1.5, -1.9, 0.42], [-0.4, -2.2, 0.5], [0.8, -2.0, 0.44], [1.7, -1.6, 0.36]]) {
      const q = R(lx, 0, lz), yq = terrain(q.x, q.z);
      a.rocher(q.x, yq + r * 0.2, q.z, r, '#8a8476', { teinte: (xx, yy) => (yy > yq + r * 0.45 ? '#6f8a4e' : '#8a8476') });
    }
    poser(a.fin(), 0, 0, { y: 0 });
    monde.cercle(S.x, S.z - 0.2, 1.3);
  }
  // la source de la Voie lactée (銀河泉), où Yoshimitsu puisait l'eau de son thé : un bassin carré bordé de quatre pierres
  // taillées posées en moulinet (aucune ne chevauche l'autre), l'eau claire et profonde (le sol creusé dessous, solDetaille),
  // une louche de bambou posée en travers ; derrière, la pente retenue par des pierres moussues et des fougères ; à côté, sa
  // plaque ; devant, au bord de l'allée, une haie basse de bambou. La nuit, sans le phénix retrouvé, on y voit le reflet d'un
  // phénix d'or qui boit… et rien au-dessus (le secret ; plus bas, animes). (Avant le 2026-10-27, la haie et la plaque
  // touchaient le bassin.)
  const SOURCE = { x: GINGASEN.x, z: GINGASEN.z, lx: 0.66, lz: 0.5, eau: SOL_SOURCE - 0.02 };
  {
    const a = atelier(), S = SOURCE, y = SOL_SOURCE, e = 0.26;
    const bords = [[-S.lx - e, S.lx, -S.lz - e, -S.lz, 0.13], [S.lx, S.lx + e, -S.lz - e, S.lz, 0.11], [-S.lx, S.lx + e, S.lz, S.lz + e, 0.12], [-S.lx - e, -S.lx, -S.lz, S.lz + e, 0.1]];
    bords.forEach(([x0, x1, z0, z1, h], k) => a.boite(x1 - x0, h + 0.55, z1 - z0, ['#9a9283', '#a39b8b', '#948c7d', '#9f9789'][k], { x: S.x + (x0 + x1) / 2, y: y + (h - 0.55) / 2, z: S.z + (z0 + z1) / 2, nuance: 0.08 }));
    // les parois sombres et mouillées du bassin, jusqu'au fond
    for (const [lx, lz, x, z] of [[2 * S.lx, 0.04, 0, -S.lz + 0.02], [2 * S.lx, 0.04, 0, S.lz - 0.02], [0.04, 2 * S.lz, -S.lx + 0.02, 0], [0.04, 2 * S.lz, S.lx - 0.02, 0]]) {
      a.boite(lx, 1.3, lz, '#3c3a33', { x: S.x + x, y: S.eau - 0.62, z: S.z + z, trait: false });
    }
    // la louche de bambou, en travers du coin nord-est
    a.baton([S.x + 0.98, y + 0.15, S.z - 0.22], [S.x + 0.42, y + 0.15, S.z - 0.68], 0.012, '#c9b07a', 5)
      .cylindre(0.055, 0.05, 0.08, 10, '#c9b07a', { x: S.x + 0.4, y: y + 0.17, z: S.z - 0.7 });
    // derrière, la pente retenue par des pierres moussues, des fougères
    for (const [dx, dz, r] of [[-1.3, -1.45, 0.46], [-0.45, -1.7, 0.4], [0.4, -1.75, 0.44], [1.25, -1.5, 0.4], [1.75, -0.95, 0.3], [-1.85, -0.9, 0.3]]) {
      const yr = terrain(S.x + dx, S.z + dz);
      a.rocher(S.x + dx, yr + r * 0.15, S.z + dz, r, '#8a8476', { sy: 0.75, teinte: (xx, yy) => (yy > yr + r * 0.4 ? '#6f8a4e' : '#8a8476') });
      monde.cercle(S.x + dx, S.z + dz, r * 0.8);
    }
    for (const [dx, dz] of [[-0.9, -1.25], [0.0, -1.35], [0.95, -1.2], [-1.45, -0.35], [1.5, -0.4]]) {
      a.houppe(0.22, '#4f8a3e', { x: S.x + dx, y: terrain(S.x + dx, S.z + dz) + 0.12, z: S.z + dz, sy: 0.6, bosses: 0.35, sorte: 'persistant' }, 0);
    }
    // la haie basse au bord de l'allée (elle prend la place de la clôture), la plaque à côté du bassin
    // (en biais : l'allée descend un peu vers l'est)
    haieKinkaku(a, [[S.x - 2.5, S.z + 1.2], [S.x + 2.5, S.z + 0.92]], 0.45);
    const px = S.x - 1.25, pz = S.z + 0.85, yp = terrain(px, pz);
    a.boite(0.08, 1.0, 0.08, '#6a5a48', { x: px, y: yp + 0.4, z: pz }).boite(0.32, 0.6, 0.04, '#e8dcc0', { x: px, y: yp + 0.8, z: pz + 0.05 });
    poser(a.fin(), 0, 0, { y: 0 });
    ecrire({ x: px, y: yp, z: pz + 0.075, ry: 0 }, { texte: '銀河泉', x: 0, y: 0.8, z: 0, l: 0.26, h: 0.54, vertical: true, encre: '#2a2420', fond: '#e8dcc0' });
    monde.cercle(S.x, S.z, 1.05);
    monde.cercle(px, pz, 0.25);
    eauxCalmesSource.push([S.x - S.lx, S.x + S.lx, S.z - S.lz, S.z + S.lz, S.eau]);
  }
  // le rocher de la source des mains (巌下水) : un rocher qui suinte, son filet d'eau dans un petit bassin de pierre
  {
    const a = atelier(), G = GANKASUI, y = terrain(G.x, G.z);
    a.piece(new THREE.IcosahedronGeometry(1, 1), '#7f786c', { x: G.x, y: y + 0.6, z: G.z - 0.9, sx: 1.5, sy: 1.0, sz: 0.9, nuance: 0.1, deformer: (x, yy, z) => { const k = 0.8 + 0.35 * hasard(x * 5 + 2, yy * 5, z * 5); return [x * k, yy * k, z * k]; }, teinte: (x, yy) => (yy > y + 0.9 ? '#6f8a4e' : '#7f786c') });
    a.cylindre(0.38, 0.32, 0.35, 10, '#9a9283', { x: G.x, y: y + 0.15, z: G.z + 0.1 }).cylindre(0.3, 0.3, 0.02, 10, '#4f6a66', { x: G.x, y: y + 0.3, z: G.z + 0.1, trait: false });
    poser(a.fin(), 0, 0, { y: 0 });
    courantsVifs.push([[G.x, y + 0.75, G.z - 0.12], [G.x, y + 0.5, G.z - 0.02], [G.x, y + 0.33, G.z + 0.06]]);
    monde.cercle(G.x, G.z - 0.5, 1.2);
  }

  // ---------------------------------------------------------------- Le ruisseau, ses ponts, la cascade
  // le ruisseau (RUISSEAU) : de la cascade à l'étang, un ruban d'eau qui coule dans son lit creusé ; des pierres sur ses
  // berges, quelques-unes dans l'eau
  {
    const pts = RUISSEAU.map(([x, z, y]) => [x, y + 0.14, z]);
    // (il se jette dans le bras d'eau : ses deux derniers points au niveau de l'étang ; de l'écume où il descend du bassin)
    pts[pts.length - 2][1] = EAU + 0.02; pts[pts.length - 1][1] = EAU + 0.01;
    rubanEau(pts, 0.9, (k) => (k < 3 ? 0.55 - k * 0.15 : k >= pts.length - 3 ? 0.25 : 0.05), '#4f7a66', { largeur: 0.9 });
    const horsPont = (x, z, r) => PONTS.every((p) => Math.hypot(x - p.x, z - p.z) > r);
    for (let i = 0; i + 1 < RUISSEAU.length; i++) {
      const [x0, z0, y0] = RUISSEAU[i], [x1, z1, y1] = RUISSEAU[i + 1], l = Math.hypot(x1 - x0, z1 - z0), nx = -(z1 - z0) / l, nz = (x1 - x0) / l;
      for (let t = 0; t < l; t += 0.62) {
        const yl = y0 + ((y1 - y0) * t) / l;
        for (const s of [-1, 1]) {
          const e = 0.6 + 0.16 * hasard(t + i, s), x = x0 + ((x1 - x0) * t) / l + nx * s * e, z = z0 + ((z1 - z0) * t) / l + nz * s * e;
          // (ni sur les allées, ni au pied des ponts, ni dans l'étang)
          if (surChemins(x, z).d < 0.5 || surPlaces(x, z) < 0.5 || bordEtang(x, z) < 0.4 || !horsPont(x, z, 2.3)) continue;
          morceau(x, z).rocher(x, yl + 0.1, z, 0.18 + 0.14 * hasard(x, z), PIERRES[Math.floor(hasard(z, x) * 4)], { sy: 0.65 });
        }
        // (de loin en loin, une pierre dans le courant, qui dépasse à peine de l'eau)
        const x = x0 + ((x1 - x0) * t) / l + nx * 0.18 * (hasard(i, t) - 0.5), z = z0 + ((z1 - z0) * t) / l + nz * 0.18 * (hasard(t, i) - 0.5);
        if (hasard(t * 3, i * 7) > 0.8 && horsPont(x, z, 2.3) && bordEtang(x, z) > 0.6) morceau(x, z).rocher(x, yl + 0.05, z, 0.15 + 0.06 * hasard(z, t), PIERRES[i % 4], { sy: 0.7 });
      }
    }
  }
  // les deux ponts de pierre (PONTS) : une dalle de granit posée d'une rive à l'autre, un rien plus haute que l'allée, ses
  // deux bordures, au-dessus de l'eau qui passe dessous ; on marche dessus (monde.chemin). Le pont du Ravin du Tigre (虎渓橋,
  // d'après le conte des « trois rires du Ravin du Tigre ») entre quatre haies de bambou tressées à la façon du temple
  // (金閣寺垣), au bord de l'allée de chaque côté
  for (const p of PONTS) {
    const a = morceau(p.x, p.z), y = hauteurAllee(p.x, p.z) + 0.1, ang = Math.atan2(p.ux, p.uz), nx = -p.uz, nz = p.ux;
    const en = (du, dn) => [p.x + p.ux * du + nx * dn, p.z + p.uz * du + nz * dn];
    a.boite(p.large - 0.1, 0.3, p.portee, '#a79f8f', { x: p.x, y: y - 0.15, z: p.z, ry: ang, nuance: 0.05 });
    for (const s of [-1, 1]) {
      const [bx, bz] = en(0, s * (p.large / 2 - 0.13));
      a.boite(0.26, 0.2, p.portee + 0.2, '#958d7e', { x: bx, y: y + 0.1, z: bz, ry: ang, nuance: 0.06 });
      // (les bordures arrêtent le joueur)
      const [m0x, m0z] = en(-p.portee / 2, s * (p.large / 2 - 0.13)), [m1x, m1z] = en(p.portee / 2, s * (p.large / 2 - 0.13));
      monde.mur(m0x, m0z, m1x, m1z, 0.22);
    }
    // (les pierres d'assise, aux deux bouts, dans les berges)
    for (const s of [-1, 1]) { const [qx, qz] = en(s * (p.portee / 2 - 0.1), 0); a.boite(p.large + 0.2, 0.5, 0.45, '#8f887a', { x: qx, y: y - 0.45, z: qz, ry: ang, nuance: 0.08 }); }
    const [d0x, d0z] = en(-p.portee / 2, 0), [d1x, d1z] = en(p.portee / 2, 0);
    monde.chemin([[d0x, d0z, y], [d1x, d1z, y]], p.large / 2 - 0.15, { sol: 'pierre', droits: true });
    if (p.kokei) for (const s of [-1, 1]) for (const t of [-1, 1]) haieKinkaku(a, [en(t * (p.portee / 2 + 0.1), s * 1.8), en(t * (p.portee / 2 + 2.7), s * 1.8)]);
  }
  // la cascade de la Porte du Dragon (龍門滝, 2,3 m) : l'eau tombe d'un rebord de rochers dans un petit bassin ; la pierre-carpe
  // (鯉魚石) penchée au pied, comme une carpe qui saute pour remonter la cascade (celle qui y parvient devient dragon)
  const BASSIN_R = { x: RYUMON.x, z: RYUMON.z + 0.9, eau: 0.62 };
  {
    const a = atelier(), R = RYUMON, haut = 3.0;
    // les rochers du rebord, de part et d'autre de la chute, et derrière
    for (const [dx, dz, r, h] of [[-1.5, -0.2, 1.1, 2.9], [1.5, -0.3, 1.2, 3.1], [0, -1.3, 1.5, 3.3], [-2.6, 0.6, 0.9, 1.6], [2.7, 0.5, 1.0, 1.9], [-3.1, -1.2, 1.2, 2.6], [3.2, -1.4, 1.3, 2.8], [-0.9, -0.5, 0.6, 3.0], [0.95, -0.55, 0.6, 3.05]]) {
      a.piece(new THREE.IcosahedronGeometry(1, 1), '#6f6a5e', {
        x: R.x + dx, y: h * 0.5, z: R.z + dz, sx: r, sy: h * 0.55, sz: r * 0.85, ry: hasard(dx, dz) * 6, nuance: 0.1,
        deformer: (x, y, z) => { const k = 0.78 + 0.4 * hasard(x * 6 + dx, y * 6, z * 6 + dz); return [x * k, y * k, z * k]; },
        teinte: (x, y) => (y > h * 0.75 && hasard(x * 4, y * 4) > 0.4 ? '#5f7f44' : y < 1.0 ? '#4a4840' : '#6f6a5e'),
      });
    }
    // le bassin : sa rive de pierres ; la pierre-carpe, penchée, la tête vers la chute
    // (pas devant la sortie du ruisseau, au sud-ouest)
    for (let k = 0; k < 12; k++) { const t = (k / 12) * 2 * PI; if (Math.sin(t) < -0.5 || Math.abs(t - 2.4) < 0.4) continue; a.rocher(BASSIN_R.x + Math.cos(t) * 1.7, 0.6, BASSIN_R.z + Math.sin(t) * 1.25, 0.32 + 0.12 * hasard(k, 1), PIERRES[k % 4], { sy: 0.7 }); }
    a.piece(new THREE.IcosahedronGeometry(1, 1), '#76705f', { x: R.x + 0.35, y: 0.75, z: R.z + 0.55, sx: 0.32, sy: 0.62, sz: 0.24, rx: -0.5, rz: 0.25, nuance: 0.08, teinte: (x, y) => (y > 1.0 ? '#5f7f44' : '#76705f') });
    poser(a.fin(), 0, 0, { y: 0 });
    // l'eau : deux filets qui tombent du rebord (comme dans le TikTok), le bassin, son écume
    cascades.push({ x: R.x - 0.15, z: R.z - 0.42, y0: haut, y1: BASSIN_R.eau, large: 0.32, evase: 1.6, sortie: [0, 1], avance: 0.25, arcEnCiel: 0 });
    vapeurs.push({ x: R.x, z: R.z + 0.2, y: BASSIN_R.eau + 0.05, n: 8, haut: 1.2, large: 0.8, taille: 0.9 });
    rubanEau([[R.x - 0.15, haut + 0.02, R.z - 1.3], [R.x - 0.15, haut + 0.01, R.z - 0.6]], 0.32, () => 0.2, '#6aa79a', { largeur: 0.32, vif: true });
    monde.cercle(R.x, R.z - 0.4, 2.8);
    monde.cercle(BASSIN_R.x, BASSIN_R.z, 1.6);
  }

  // ---------------------------------------------------------------- Les statues où l'on lance une pièce
  // (d'après le TikTok : sur un sol de terre, une grande stèle où un bouddha est sculpté, de petits jizō usés, une petite
  // pagode de pierre, un bol de pierre et un petit bol de métal ; des pièces partout autour, celles qui ont raté)
  const BOL = { x: JIZO.x + 0.2, z: JIZO.z + 0.15 };
  {
    const a = atelier(), J = JIZO, y = terrain(J.x, J.z), R = repere(J.x, J.z, PI - 0.5);
    const statue = (lx, lz, h, r, bouddha) => {
      a.piece(new THREE.IcosahedronGeometry(1, 1), '#9b968a', { ...R(lx, y + h * 0.48, lz), sx: r, sy: h * 0.52, sz: r * 0.62, nuance: 0.08, deformer: (x, yy, z) => { const k = 0.9 + 0.16 * hasard(x * 5 + lx, yy * 5, z * 5); return [x * k, yy * k + (yy > 0 ? 0.08 * (1 - Math.abs(x)) : 0), z * k]; }, teinte: (x, yy) => (yy > y + h * 0.85 && hasard(x * 6, yy) > 0.6 ? '#7f8f60' : '#9b968a') });
      if (bouddha) {
        // le bouddha sculpté en relief : la tête, le corps assis, l'auréole
        a.ovale(r * 0.2, '#a8a396', { ...R(lx, y + h * 0.62, lz + r * 0.55), sz: 0.5 }, 8).ovale(r * 0.38, '#a8a396', { ...R(lx, y + h * 0.36, lz + r * 0.5), sy: 0.9, sz: 0.4 }, 8);
        a.anneau(r * 0.32, 0.03, '#8f8a7e', { ...R(lx, y + h * 0.63, lz + r * 0.5) });
      }
    };
    statue(-0.4, -0.9, 1.6, 0.6, true);
    statue(-1.5, -0.6, 0.9, 0.38, false); statue(-1.0, -0.1, 0.7, 0.3, false); statue(0.9, -0.7, 0.85, 0.34, true); statue(1.7, -0.2, 0.65, 0.3, false);
    // la petite pagode de pierre, le bol de pierre (la cible), le petit bol de métal
    for (const [h, r] of [[0.0, 0.16], [0.18, 0.1], [0.3, 0.15], [0.42, 0.1], [0.52, 0.12], [0.62, 0.05]]) a.cylindre(r, r * 1.05, 0.12, 6, '#a39e92', R(0.55, y + h + 0.06, 0.15));
    a.piece(new THREE.LatheGeometry([[0.0, 0.0], [0.32, 0.0], [0.4, 0.06], [0.4, 0.2], [0.3, 0.22], [0.26, 0.12], [0.0, 0.12]].map(([r, h]) => new THREE.Vector2(r, h)), 12), '#a9a397', { x: BOL.x, y: y, z: BOL.z });
    a.cylindre(0.12, 0.09, 0.08, 10, '#8a8a90', R(1.1, y + 0.04, 0.5));
    // les pièces tombées (argent, cuivre, laiton), plus serrées près du bol
    const PIECES = ['#c9ccd0', '#b8bcc0', '#b87a4a', '#d6b25a'];
    for (let k = 0; k < 260; k++) {
      const t = hasard(k, 1) * 2 * PI, d = 0.2 + 2.6 * hasard(k, 2) ** 1.6, px = BOL.x + Math.cos(t) * d * 1.2, pz = BOL.z + Math.sin(t) * d;
      if (Math.hypot(px - BOL.x, pz - BOL.z) < 0.42) continue;
      a.cylindre(0.012, 0.012, 0.004, 6, PIECES[k % 4], { x: px, y: terrain(px, pz) + 0.035, z: pz, rx: (hasard(k, 3) - 0.5) * 0.3, trait: false, nuance: 0.12 });
    }
    poser(a.fin(), 0, 0, { y: 0 });
    // (une corde basse : on lance depuis le chemin)
    monde.cercle(J.x, J.z - 0.2, 2.4);
  }

  // ---------------------------------------------------------------- Les escaliers de pierre
  // des marches de pierre brute pleines (leur dessus au milieu de la pente où l'on marche), une haie de bambou de chaque côté
  for (const es of MARCHES) {
    // (un escalier tracé du haut vers le bas descend : ses marches se comptent sur la hauteur, dans un sens ou dans l'autre)
    const a = morceau(es.ligne[0][0], es.ligne[0][1]), n = Math.max(3, Math.round(Math.abs(es.y1 - es.y0) / 0.17)), pas = es.L / n;
    const point = (s) => {
      let reste = s;
      for (let i = 0; i + 1 < es.ligne.length; i++) {
        const [x0, z0] = es.ligne[i], [x1, z1] = es.ligne[i + 1], l = Math.hypot(x1 - x0, z1 - z0);
        if (reste <= l || i + 2 === es.ligne.length) { const f = Math.min(1, reste / l); return [x0 + (x1 - x0) * f, z0 + (z1 - z0) * f, Math.atan2(x1 - x0, z1 - z0)]; }
        reste -= l;
      }
      return es.ligne[0];
    };
    for (let k = 0; k < n; k++) {
      const [x, z, ang] = point((k + 0.5) * pas), haut = es.y0 + ((es.y1 - es.y0) * (k + 0.5)) / n, bas = terrain(x, z) - 0.3;
      a.boite(2 * es.demi + 0.3 + (k % 2) * 0.02, haut - bas, pas + 0.06, PIERRES[k % 4], { x, y: (haut + bas) / 2, z, ry: ang, nuance: 0.07 });
    }
    monde.chemin(es.ligne, es.demi, { sol: 'pierre', droits: true });
    for (const s of [-1, 1]) {
      const pts = [];
      for (let t = 0; t <= es.L + 0.01; t += es.L / 6) { const [x, z, ang] = point(t); pts.push([x + Math.cos(ang) * s * (es.demi + 0.45), z - Math.sin(ang) * s * (es.demi + 0.45)]); }
      haieKinkaku(a, pts);
      for (let i = 0; i + 1 < pts.length; i++) monde.mur(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 0.3);
    }
  }

  // ---------------------------------------------------------------- L'étang Anmintaku (安民沢) et le tertre du serpent blanc
  // un étang dans la forêt, qui ne s'assèche jamais (on y priait pour la pluie) ; sur son île, une petite pagode de pierre à cinq
  // anneaux (le tertre du serpent blanc, 白蛇の塚, gardien de la famille Saionji) ; des pièces lancées au pied
  {
    const a = atelier(), H = HAKUJA, y = terrain(H.x, H.z);
    for (const [h, r, c] of [[0.0, 0.32, 'b'], [0.26, 0.2, 'c'], [0.5, 0.28, 't'], [0.66, 0.16, 'd'], [0.82, 0.08, 'j']]) {
      if (c === 'b') a.boite(0.64, 0.3, 0.64, '#8f8a7e', { x: H.x, y: y + 0.15, z: H.z });
      else if (c === 'c') a.boule(0.24, '#8f8a7e', { x: H.x, y: y + 0.44, z: H.z, sy: 0.85 }, 1);
      else if (c === 't') a.toitJapon(0.62, 0.62, 0.16, 0.1, { tuile: '#8f8a7e', tuile2: '#8a8579', bord: '#7a756a', rangs: 4, releve: 0.03, x: H.x, y: y + 0.62, z: H.z });
      else if (c === 'd') a.boule(0.09, '#8f8a7e', { x: H.x, y: y + 0.86, z: H.z }, 1);
      else a.cone(0.06, 0.14, 6, '#8f8a7e', { x: H.x, y: y + 1.0, z: H.z });
    }
    for (let k = 0; k < 14; k++) { const t = (k / 14) * 2 * PI; a.rocher(H.x + Math.cos(t) * (H.r + 0.2), ANMIN.eau + 0.05, H.z + Math.sin(t) * (H.r + 0.1), 0.3 + 0.12 * hasard(k, 7), PIERRES[k % 4], { sy: 0.6 }); }
    a.pinNuages(H.x - 1.0, H.z - 0.6, 4.2, 1, { y: terrain(H.x - 1.0, H.z - 0.6) });
    // la rive de l'étang : des pierres
    for (let k = 0; k < 36; k++) { const t = (k / 36) * 2 * PI, x = ANMIN.x + Math.cos(t) * ANMIN.rx * 1.02, z = ANMIN.z + Math.sin(t) * ANMIN.rz * 1.03; a.rocher(x, ANMIN.eau + 0.04, z, 0.32 + 0.2 * hasard(x, z), PIERRES[k % 4], { sy: 0.6 }); }
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Le pavillon du thé du soir (夕佳亭)
  // Bâti à l'époque d'Edo pour l'empereur Go-Mizunoo par le maître de thé Kanamori Sōwa : un petit pavillon au toit de chaume,
  // ouvert sur la vue ; son nom vient du Pavillon d'or qui y paraît si beau au soleil couchant. Son pilier de nandina (南天の床柱).
  {
    const a = atelier(), S = SEKKA, y = terrain(S.x, S.z), ry = Math.atan2(-S.x, -S.z) * 0 + 0.55, R = repere(S.x, S.z, ry);
    a.boite(7.4, 0.5, 5.4, '#9a9283', R(0, y + 0.1, 0));
    for (const lx of [-3.2, -1.1, 1.1, 3.2]) for (const lz of [-2.2, 2.2]) a.boite(0.16, 2.6, 0.16, '#7a5a3e', R(lx, y + 1.6, lz));
    a.boite(6.6, 0.1, 4.6, '#c9b48a', R(0, y + 0.42, 0, { teinte: (x) => (Math.floor(x * 1.1 + 99) % 2 ? '#c9b48a' : '#bfa87c') }));
    // les cloisons : le fond de terre et de papier, les shōji ouverts, le pilier de nandina noueux
    a.boite(6.4, 2.3, 0.08, '#d6c7a2', R(0, y + 1.6, -2.2)).boite(0.08, 2.3, 4.3, P.shoji, R(-3.2, y + 1.6, 0));
    for (let k = 1; k < 10; k++) a.boite(0.022, 2.3, 0.09, P.shojiCadre, R(-3.2, y + 1.6, -2.15 + (4.3 * k) / 10, { trait: false }));
    a.fut([S.x, y + 0.45, S.z], [S.x + 0.04, y + 2.8, S.z - 0.03], 0.07, 0.06, '#6a4a32', 7);
    // le toit de chaume, épais, à pignons
    a.toitJapon(9.2, 7.2, 1.6, 0.42, { tuile: P.chaume, tuile2: P.chaumeFonce, bord: '#6a5a40', avant: P.chaumeFonce, creux: 1.3, releve: 0.15, epaisseur: 0.32, rangs: 20, sorte: 'chaume', ...R(0, y + 2.85, 0) });
    a.pignon(4.2, 1.3, 3.4, P.chaume, R(0, y + 4.4, 0, { sorte: 'chaume' }));
    a.boite(4.6, 0.3, 0.36, '#5a4a36', R(0, y + 5.72, 0));
    // (le 2026-10-27, la petite pièce haute à côté — un bloc de plâtre blanc à moitié sous le toit de chaume, qu'on ne
    // comprenait pas — est ôtée ; à sa place, sous l'avant-toit, un banc de bois)
    a.boite(1.8, 0.08, 0.5, '#8a6a4e', R(3.2, y + 0.82, 2.4)).boite(0.08, 0.42, 0.42, '#5a4636', R(2.5, y + 0.57, 2.4)).boite(0.08, 0.42, 0.42, '#5a4636', R(3.9, y + 0.57, 2.4));
    poser(a.fin(), 0, 0, { y: 0 });
    monde.surface(S.x - 4.4, S.x + 4.4, S.z - 3.6, S.z + 3.2, y + 3, { plein: true });
    const m = atelier();
    haieKinkaku(m, [[S.x - 4.6, S.z + 3.6], [S.x + 1.0, S.z + 4.4], [S.x + 6.4, S.z + 3.2]], 0.7);
    poser(m.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Le salon de thé (茶所)
  // une échoppe au toit de tuiles ouverte devant, son comptoir, la marmite, les bols ; devant, trois bancs couverts de feutre
  // rouge et une grande ombrelle rouge : on y boit un thé matcha avec un gâteau à la feuille d'or
  const CHA = { x: CHASHO.x, z: CHASHO.z, ry: -0.3 };
  {
    const a = atelier(), y = terrain(CHA.x, CHA.z), R = repere(CHA.x, CHA.z, CHA.ry);
    a.boite(5.6, 2.5, 0.12, '#8a6a4e', R(0, y + 1.25, -1.6, { teinte: (x) => (Math.floor(x * 3 + 99) % 2 ? '#8a6a4e' : '#7a5c42') }));
    for (const lx of [-2.7, 2.7]) for (const lz of [-1.6, 1.4]) a.boite(0.14, 2.6, 0.14, '#5a4636', R(lx, y + 1.3, lz));
    for (const lx of [-2.7, 2.7]) a.boite(0.1, 2.5, 3.0, '#8a6a4e', R(lx, y + 1.25, -0.1));
    a.boite(4.8, 0.9, 0.6, '#6a5040', R(0, y + 0.45, 0.6)).boite(5.0, 0.06, 0.8, '#c9b48a', R(0, y + 0.92, 0.6));
    a.cylindre(0.28, 0.24, 0.32, 12, '#3a3632', R(-1.6, y + 1.1, 0.5)).cylindre(0.1, 0.12, 0.08, 10, '#5f9a3e', R(0.4, y + 0.98, 0.65)).cylindre(0.1, 0.12, 0.08, 10, '#c8b88a', R(0.9, y + 0.98, 0.6));
    a.toitJapon(7.2, 4.6, 1.1, 0.24, { ...TUILES, rangs: 14, ...R(0, y + 2.62, -0.1) });
    // les noren (抹茶) et l'enseigne
    for (const lx of [-1.6, 0, 1.6]) a.boite(1.4, 0.7, 0.03, '#2f4a6a', R(lx, y + 2.15, 1.45));
    poser(a.fin(), 0, 0, { y: 0 });
    for (const [lx, t] of [[-1.6, '抹'], [0, '茶'], [1.6, '処']]) ecrire({ x: CHA.x, y, z: CHA.z, ry: CHA.ry }, { texte: t, x: lx, y: 2.15, z: 1.47, l: 0.5, h: 0.5, encre: '#f4efe2' });
    monde.surface(CHA.x - 3.4, CHA.x + 3.4, CHA.z - 2.2, CHA.z + 1.2, y + 3, { plein: true });
    // les bancs rouges et l'ombrelle
    const b = atelier();
    for (const [lx, lz, r] of [[-2.4, 3.4, 0.2], [0.2, 3.9, -0.05], [2.8, 3.3, -0.3]]) {
      const q = R(lx, y, lz, { ry: r }), c = Math.cos(q.ry), s = Math.sin(q.ry);
      b.boite(1.8, 0.08, 0.6, '#c8302c', { x: q.x, y: terrain(q.x, q.z) + 0.44, z: q.z, ry: q.ry });
      for (const dx of [-0.75, 0.75]) for (const dz of [-0.22, 0.22]) b.boite(0.07, 0.42, 0.07, '#5a4636', { x: q.x + dx * c + dz * s, y: terrain(q.x, q.z) + 0.21, z: q.z - dx * s + dz * c });
      bancs.push({ de: [q.x - 0.7 * c, q.z + 0.7 * s], a: [q.x + 0.7 * c, q.z - 0.7 * s], y: terrain(q.x, q.z) + 0.48, cap: q.ry, vue: 0.4 });
      // (tout le long du banc, ses bouts compris : le corps n'y entre pas)
      monde.mur(q.x - 0.65 * c, q.z + 0.65 * s, q.x + 0.65 * c, q.z - 0.65 * s, 0.55);
    }
    const o = R(0.2, y, 2.6);
    b.baton([o.x, y, o.z], [o.x, y + 2.7, o.z], 0.035, '#8a6a42', 6).piece(new THREE.ConeGeometry(1.9, 0.62, 24, 1, true), '#d8402e', { x: o.x, y: y + 2.75, z: o.z, teinte: (x, yy, z) => (Math.floor((Math.atan2(x - o.x, z - o.z) + PI) * 3.8) % 2 ? '#d8402e' : '#c8382a') })
      // (l'envers de l'ombrelle, vu d'en dessous : le même cône retourné, un rien plus bas)
      .piece(new THREE.ConeGeometry(1.88, 0.6, 24, 1, true), '#b8301f', { x: o.x, y: y + 2.73, z: o.z, sx: -1, trait: false });
    poser(b.fin(), 0, 0, { y: 0 });
    monde.cercle(o.x, o.z, 0.25);
  }

  // ---------------------------------------------------------------- Le bureau des goshuin (朱印所)
  {
    const a = atelier(), S = SHUIN, y = terrain(S.x, S.z), R = repere(S.x, S.z, -0.3);
    guichet(a, R, y, { l: 4.4, p: 3.2, h: 2.5, fl: 3.0, f0: 1.0, f1: 2.1 });
    a.toitJapon(6.0, 4.8, 1.0, 0.24, { ...TUILES, rangs: 12, ...R(0, y + 2.74, 0) });
    a.boite(0.5, 1.5, 0.05, '#f4efe2', R(-1.95, y + 1.4, 1.64));
    // dedans : le plancher de tatamis où le moine est assis, sa table basse et sa pierre à encre ; au mur du fond, les
    // modèles des goshuin ; sur le comptoir, des carnets à sceaux
    a.boite(4.1, 0.1, 2.9, '#c9b98a', R(0, y + 0.55, 0))
      .boite(1.1, 0.05, 0.45, '#4a3428', R(0, y + 0.88, 1.2)).boite(0.9, 0.28, 0.35, '#4a3428', R(0, y + 0.74, 1.2))
      .boite(0.16, 0.03, 0.24, '#2a2a2e', R(0.32, y + 0.92, 1.2));
    for (const x of [-1.1, -0.55, 0.55, 1.1]) a.boite(0.36, 0.5, 0.03, '#f4efe2', R(x, y + 1.65, -1.47)).boite(0.08, 0.08, 0.045, '#c0392b', R(x + 0.06, y + 1.5, -1.47));
    for (const [x, c] of [[-1.2, '#b03a2e'], [-1.02, '#2e4a7a'], [1.15, '#5a7a3a']]) a.boite(0.12, 0.03, 0.17, c, R(x, y + 1.035, 1.8));
    poser(a.fin(), 0, 0, { y: 0 });
    ecrire({ x: S.x, y, z: S.z, ry: -0.3 }, { texte: '御朱印', x: -1.95, y: 1.4, z: 1.67, l: 0.42, h: 1.3, vertical: true, encre: '#2a2420', fond: '#f4efe2' });
  }

  // ---------------------------------------------------------------- La salle de Fudō (不動堂)
  // La plus vieille construction du temple (rebâtie vers 1580) : sur sa terrasse de pierre (trois marches devant), un toit de
  // tuiles et, devant, un auvent à pignon orné, sur deux poteaux posés sur leurs pierres ; les murs de planches sombres sous
  // une bande de plâtre blanc, la façade de portes à treillis ; deux grosses cordes pour frapper le gong (鰐口), le tronc des
  // offrandes, des lanternes de papier rouges ; dedans, un Fudō de pierre qu'aurait sculpté Kūkai, qu'on ne montre que deux
  // jours par an. Devant, le support des bougies, la boîte des oracles et la corde où l'on noue les mauvais oracles (結び所).
  // (Le 2026-10-27, le propriétaire : « tous les objets flottent » ; la terrasse aussi, au-dessus de la pente : le sol est
  // aplani (REPLATS), et chaque chose est posée sur le sol à sa place.)
  {
    const a = atelier(), F = FUDO, y = terrain(F.x, F.z) + 0.05, R = repere(F.x, F.z, 0), sol = (lx, lz) => terrain(F.x + lx, F.z + lz);
    const B = '#5a4636', PLANCHES = '#5e4838', PLATRE = '#ece6d8';
    a.boite(11, 1.3, 8.6, '#a49c8c', R(0, y - 0.05, -0.6, { nuance: 0.06 }));
    for (let k = 0; k < 3; k++) a.boite(3.6 + k * 0.06, 0.9 - k * 0.22, 0.3, '#9a9283', R(0, y - 0.5 + k * 0.02 + (0.9 - k * 0.22) / 2, 3.85 + k * 0.3, { nuance: 0.06 }));
    for (const lx of [-4, -1.4, 1.4, 4]) for (const lz of [-3.6, 2.4]) a.boite(0.26, 3.6, 0.26, B, R(lx, y + 2.4, lz));
    // les murs (côtés, fond) : des planches en bas, une poutre, une bande de plâtre, la sablière
    for (const [l, ep, lx, lz] of [[8.0, 0.12, 0, -3.6], [0.12, 6.0, -4, -0.6], [0.12, 6.0, 4, -0.6]]) {
      a.boite(l, 1.85, ep, PLANCHES, R(lx, y + 1.53, lz, { teinte: (xx, yy, zz) => (Math.floor((xx + zz) * 5 + 99) % 2 ? PLANCHES : '#55402f') }))
        .boite(l + 0.04, 0.18, ep + 0.04, B, R(lx, y + 2.52, lz)).boite(l, 0.95, ep * 0.8, PLATRE, R(lx, y + 3.08, lz)).boite(l + 0.04, 0.22, ep + 0.06, B, R(lx, y + 3.66, lz));
    }
    // la façade : des portes à treillis (un fond sombre, des barreaux serrés en long et en travers), ouvertes au milieu sur
    // l'autel dans l'ombre ; au-dessus, la bande de plâtre
    a.boite(8.0, 2.4, 0.1, '#2a2420', R(0, y + 1.8, 2.3, { trait: false }));
    for (const [x0, x1] of [[-4, -1.4], [1.4, 4]]) {
      for (let k = 1; k < 13; k++) a.boite(0.03, 2.3, 0.04, '#6a5240', R(x0 + ((x1 - x0) * k) / 13, y + 1.8, 2.37, { trait: false }));
      for (let k = 1; k < 12; k++) a.boite(x1 - x0, 0.03, 0.04, '#6a5240', R((x0 + x1) / 2, y + 0.6 + (2.4 * k) / 12, 2.38, { trait: false }));
    }
    a.boite(8.1, 0.18, 0.16, B, R(0, y + 3.05, 2.36)).boite(8.0, 0.55, 0.08, PLATRE, R(0, y + 3.38, 2.36));
    a.boite(1.0, 0.7, 0.4, '#b8913a', R(0, y + 1.25, 1.6)).boite(0.5, 1.0, 0.3, '#3a3632', R(0, y + 1.9, 1.5));
    // le grand toit, l'auvent devant (向拝) à pignon orné, ses poteaux sur leurs pierres
    a.toitJapon(12.6, 10.2, 2.6, 0.32, { ...TUILES, rangs: 22, ...R(0, y + 4.15, -0.6) });
    a.pignon(4.6, 1.8, 3.6, P.tuileShiro, R(0, y + 6.7, -0.6));
    for (const lx of [-2.4, 2.4]) {
      const ys = sol(lx, 4.3);
      a.boite(0.24, y + 4.1 - ys - 0.2, 0.24, B, R(lx, (y + 4.1 + ys + 0.2) / 2, 4.3)).boite(0.42, 0.32, 0.42, '#8f887a', R(lx, ys + 0.06, 4.3, { nuance: 0.06 }));
      a.boite(0.16, 0.16, 1.9, B, R(lx, y + 3.55, 3.35));
    }
    a.boite(5.4, 0.3, 0.3, B, R(0, y + 4.0, 4.3)).toitJapon(6.6, 3.6, 0.9, 0.3, { ...TUILES, rangs: 12, ...R(0, y + 4.15, 4.0) });
    {
      const pos = [], cols = [], A = R(-2.7, y + 4.4, 5.5), Bp = R(2.7, y + 4.4, 5.5), C = R(0, y + 5.9, 4.7);
      tri(pos, cols, [A.x, A.y, A.z], [Bp.x, Bp.y, Bp.z], [C.x, C.y, C.z], B, [0, 0.4, 1]);
      a.piece(geo(pos), B, { couleurs: cols });
      a.boite(0.6, 0.45, 0.1, '#c9a13b', R(0, y + 5.0, 5.42)).boite(1.0, 0.35, 0.08, '#c9a13b', R(0, y + 4.55, 5.46));
    }
    // les deux cordes (blanches et rouges, tressées) et le gong de bronze plat au-dessus ; le tronc des offrandes
    for (const lx of [-0.75, 0.75]) {
      const pts = [];
      for (let k = 0; k <= 10; k++) pts.push([F.x + lx + 0.04 * Math.sin(k), y + 3.9 - k * 0.31, F.z + 3.9 + 0.08 * (k / 10)]);
      a.tube(pts, 0.055, '#f2eee2', { cotes: 6, pas: 20, teinte: (x, yy, z) => (Math.floor((Math.atan2(x - F.x - lx, z - F.z - 3.9) + PI) * 1.3 + yy * 4) % 2 ? '#f2eee2' : '#c8302c') });
      a.cylindre(0.32, 0.32, 0.12, 14, '#8a7a4a', { x: F.x + lx, y: y + 3.95, z: F.z + 3.86, rx: PI / 2 });
    }
    a.boite(2.2, 0.75, 0.9, '#4a3a2e', R(0, y + 0.95, 3.2)).boite(2.1, 0.06, 0.8, '#2a2420', R(0, y + 1.33, 3.2, { trait: false }));
    // les lanternes de papier rouges pendues sous l'auvent
    for (const lx of [-1.7, 1.7]) {
      a.baton([F.x + lx, y + 4.0, F.z + 3.6], [F.x + lx, y + 3.55, F.z + 3.6], 0.008, P.noir, 3, { trait: false });
      a.chochin(F.x + lx, y + 3.15, F.z + 3.6, 11, P.vermillon);
      lumieres.push({ x: F.x + lx, y: y + 3.15, z: F.z + 3.6, halo: 0.45, sol: y + 0.7, r: 3.2 });
    }
    // le support des bougies (sous son petit toit), posé sur le sol de la cour
    const bg = R(3.6, 0, 6.6), yg = sol(3.6, 6.6);
    a.boite(1.6, 0.9, 0.5, '#4a3a2e', { x: bg.x, y: yg + 0.45, z: bg.z }).boite(1.5, 0.06, 0.4, '#b8913a', { x: bg.x, y: yg + 0.93, z: bg.z });
    for (let k = 0; k < 9; k++) a.cylindre(0.025, 0.025, 0.18, 6, '#f4efe2', { x: bg.x - 0.6 + k * 0.15, y: yg + 1.05, z: bg.z, trait: false }).ovale(0.022, '#ffd27a', { x: bg.x - 0.6 + k * 0.15, y: yg + 1.2, z: bg.z, sy: 1.6, sorte: 'lampe', trait: false }, 5);
    a.baton([bg.x - 0.8, yg - 0.1, bg.z - 0.3], [bg.x - 0.8, yg + 1.8, bg.z - 0.3], 0.04, B, 5).baton([bg.x + 0.8, yg - 0.1, bg.z - 0.3], [bg.x + 0.8, yg + 1.8, bg.z - 0.3], 0.04, B, 5);
    a.pignon(2.0, 0.4, 1.0, P.tuileShiro, { x: bg.x, y: yg + 1.8, z: bg.z - 0.1 });
    // la boîte des oracles : un coffre rouge à six pans sur son pied de bois, le trou d'où sort la baguette ; derrière, la
    // corde où l'on noue les oracles (deux poteaux, trois fils, des papiers blancs noués)
    const om = R(-3.6, 0, 6.4), yo = sol(-3.6, 6.4);
    a.boite(0.7, 0.55, 0.5, '#6a5040', { x: om.x, y: yo + 0.27, z: om.z }).cylindre(0.3, 0.3, 0.62, 6, P.vermillon, { x: om.x, y: yo + 0.86, z: om.z, ry: PI / 6 })
      .cylindre(0.31, 0.31, 0.04, 6, '#2a2420', { x: om.x, y: yo + 1.19, z: om.z, ry: PI / 6 }).cylindre(0.03, 0.03, 0.05, 6, '#1a1614', { x: om.x, y: yo + 1.22, z: om.z, trait: false });
    {
      const yr = sol(-3.6, 7.7);
      for (const lx of [-4.75, -2.45]) a.boite(0.1, 1.55, 0.1, B, R(lx, yr + 0.72, 7.7));
      for (const hh of [0.9, 1.15, 1.4]) {
        const p0 = R(-4.75, yr + hh, 7.7), p1 = R(-2.45, yr + hh, 7.7);
        a.baton([p0.x, p0.y, p0.z], [p1.x, p1.y, p1.z], 0.008, '#3a3236', 3, { trait: false });
        for (let k = 0; k < 15; k++) if (hasard(k, hh * 7) > 0.25) { const q = R(-4.62 + k * 0.155, yr + hh - 0.02, 7.7); a.boite(0.035, 0.07, 0.025, '#f8f4ea', { ...q, rz: (hasard(hh, k) - 0.5) * 0.4, trait: false }); }
      }
      const q0 = R(-4.85, 0, 7.7), q1 = R(-2.35, 0, 7.7);
      monde.mur(q0.x, q0.z, q1.x, q1.z, 0.28);
    }
    // les deux lanternes de pierre, chacune sur son sol
    for (const s of [-1, 1]) {
      const yl = sol(s * 5.2, 6.8);
      a.lanterne(F.x + s * 5.2, F.z + 6.8, 6, yl - 0.05);
      lumieres.push({ x: F.x + s * 5.2, y: yl + 1.2, z: F.z + 6.8, halo: 0.42, sol: yl, r: 2.6 });
    }
    poser(a.fin(), 0, 0, { y: 0 });
    ecrire({ x: om.x, y: yo, z: om.z, ry: 0 }, { texte: 'おみくじ', x: 0, y: 0.9, z: 0.27, l: 0.42, h: 0.18, encre: '#f4efe2' });
    ecrire({ x: F.x, y, z: F.z, ry: 0 }, { texte: '不動堂', x: 0, y: 4.75, z: 5.52, l: 0.9, h: 0.3, encre: '#2a2420' });
    // (la terrasse de pierre et ses marches arrêtent le joueur à leur bord ; le tronc des offrandes et le support des bougies
    // sur toute leur longueur, poteaux compris)
    monde.surface(F.x - 5.75, F.x + 5.75, F.z - 5.0, F.z + 4.6, y + 4, { plein: true });
    for (const c of [[F.x - 2.4, F.z + 4.3, 0.45], [F.x + 2.4, F.z + 4.3, 0.45], [om.x, om.z, 0.6], [F.x - 5.2, F.z + 6.8, 0.6], [F.x + 5.2, F.z + 6.8, 0.6]]) monde.cercle(...c);
    monde.mur(F.x - 0.75, F.z + 3.2, F.x + 0.75, F.z + 3.2, 0.7);
    monde.mur(bg.x - 0.8, bg.z - 0.1, bg.x + 0.8, bg.z - 0.1, 0.55);
  }

  // ---------------------------------------------------------------- Le pin en barque (陸舟の松) et la tour de Jōzō
  // Planté, dit-on, par Yoshimitsu lui-même, qui l'avait en bonsaï, et taillé depuis six siècles en forme de barque, la proue
  // vers l'ouest (le paradis de l'ouest). D'après les photos : un pin bas et très long, son feuillage taillé en une coque
  // plate et serrée, pointue et relevée à la proue, arrondie à la poupe ; près de la poupe, le tronc tordu et, au-dessus, un
  // étage plus haut, comme la cabine ; dessous, les longues branches couchées sur un treillis de bambou (des poteaux, des
  // traverses). Dans une cour de gravier blanc ratissé, derrière une clôture basse. La coque est un peu tournée (proue à
  // l'ouest-nord-ouest) : de l'allée, on la voit de côté. (Avant le 2026-10-27, un tronc couché en l'air et des touffes posées
  // sur des perches : « on ne comprend pas ce que c'est ».)
  {
    const a = atelier(), R0 = RIKUSHU, y = terrain(R0.x, R0.z), Rb = repere(R0.x, R0.z, -2.214);
    const at = (lx, yy, lz) => { const q = Rb(lx, yy, lz); return [q.x, q.y, q.z]; };
    const TRONC = '#6a4a36', VERT = '#3f6e3c', VERT2 = '#4a7a44', BAMBOU = '#b89a62';
    // la coque : sa demi-largeur et le haut du feuillage le long de l'axe (lz : -3.6 à la poupe, 5.6 à la proue)
    const demi = (lz) => 1.55 * Math.max(0, 1 - ((lz - 0.3) / 5.3) ** 2) ** 0.6, dessus = (lz) => 2.25 + 0.7 * Math.max(0, (lz - 3.0) / 2.6) ** 2;
    // les lignes ratissées du gravier blanc de la cour (le gravier : aspectSol)
    for (let k = -12; k <= 12; k++) {
      const z = R0.z + k * 0.31, lx = 6.9 * (1 - (Math.abs(k * 0.31) / 3.9) ** 4) ** 0.25;
      if (lx > 0.5) a.ruban([[R0.x - lx, y + 0.025, z], [R0.x + lx, y + 0.025, z]], 0.05, '#c2bdb0');
    }
    // le tronc : du sol près de la poupe, tordu, jusqu'à 1,5 m ; les maîtresses branches, couchées vers la proue sous le
    // feuillage, et celle qui monte porter l'étage de la poupe
    const tronc = [at(0.35, y - 0.2, -2.2), at(0.15, y + 0.6, -2.0), at(0.45, y + 1.1, -1.75), at(0.1, y + 1.55, -1.5)];
    for (let k = 0; k + 1 < tronc.length; k++) { a.fut(tronc[k], tronc[k + 1], 0.34 - k * 0.05, 0.29 - k * 0.05, TRONC, 8); if (k) a.boule(0.31 - k * 0.05, TRONC, { x: tronc[k][0], y: tronc[k][1], z: tronc[k][2] }, 1); }
    a.boule(0.2, TRONC, { x: tronc[3][0], y: tronc[3][1], z: tronc[3][2] }, 1);
    const branches = [
      [[0.1, 1.55, -1.5], [0.05, 1.72, 0.6], [-0.05, 1.8, 2.8], [0.0, 1.95, 4.6]],
      [[0.1, 1.55, -1.5], [0.75, 1.68, -0.2], [1.05, 1.74, 1.6]],
      [[0.1, 1.55, -1.5], [-0.7, 1.68, -0.4], [-1.0, 1.74, 1.4]],
      [[0.1, 1.55, -1.5], [0.3, 2.2, -1.6], [0.1, 2.6, -1.3]],
      [[0.1, 1.55, -1.5], [-0.4, 1.66, -2.6], [-0.3, 1.72, -3.2]],
    ];
    for (const b of branches) {
      const pts = b.map(([lx, yy, lz]) => at(lx, y + yy, lz));
      for (let k = 0; k + 1 < pts.length; k++) { const r = 0.17 - k * 0.04; a.fut(pts[k], pts[k + 1], r, r - 0.04, TRONC, 6); if (k) a.boule(r - 0.01, TRONC, { x: pts[k][0], y: pts[k][1], z: pts[k][2] }); }
    }
    // le feuillage de la coque, épais (de 1 m à 2,4 m) : le pont, des plateaux d'aiguilles serrés en rangs ; les flancs, au bord
    // de la coque ; la quille, plus bas et plus étroite
    for (let lz = -3.4; lz <= 5.45; lz += 0.7) {
      const w = demi(lz), n = Math.max(1, Math.round((2 * w) / 0.8)), h = dessus(lz);
      for (let i = 0; i < n; i++) {
        const lx = n === 1 ? 0 : -w + 0.35 + ((2 * w - 0.7) * i) / (n - 1), r = 0.6 + 0.1 * hasard(lx * 3, lz * 5);
        const [x, yy, z] = at(lx, y + h - 0.12 - 0.08 * Math.abs(lx) + 0.04 * hasard(lz, lx), lz);
        a.houppe(r, (i + Math.round(lz * 2)) % 3 ? VERT : VERT2, { x, y: yy, z, sy: 0.42, bosses: 0.2, sorte: 'conifere' }, 1);
      }
      for (const s of w > 0.35 ? [-1, 1] : [0]) {
        const [x, yy, z] = at(s * Math.max(0, w - 0.2), y + h - 0.62, lz + 0.35 * s);
        a.houppe(0.52, VERT, { x, y: yy, z, sy: 0.58, bosses: 0.22, sorte: 'conifere' }, 1);
      }
      if (w > 0.6 && lz < 4.6) for (const s of [-1, 1]) {
        const [x, yy, z] = at(s * w * 0.4, y + h - 1.05, lz + 0.2);
        a.houppe(0.48, VERT, { x, y: yy, z, sy: 0.45, bosses: 0.2, sorte: 'conifere' }, 0);
      }
    }
    // la pointe de la proue, relevée ; l'étage de la poupe (la cabine), une butte de plateaux, et son sommet
    { const [x, yy, z] = at(0, y + dessus(5.6) - 0.05, 5.8); a.houppe(0.42, VERT2, { x, y: yy, z, sy: 0.5, bosses: 0.2, sorte: 'conifere' }, 1); }
    for (const [lx, lz, h, r] of [[-0.6, -2.5, 2.95, 0.66], [0.6, -2.3, 2.95, 0.66], [0.0, -1.0, 2.95, 0.7], [-0.55, -0.1, 2.85, 0.55], [0.55, -0.2, 2.85, 0.55], [-0.3, -2.0, 3.35, 0.62], [0.35, -1.4, 3.35, 0.6], [0.0, -1.7, 3.75, 0.5]]) {
      const [x, yy, z] = at(lx, y + h, lz);
      a.houppe(r, h > 3.2 ? VERT2 : VERT, { x, y: yy, z, sy: 0.45, bosses: 0.22, sorte: 'conifere' }, 1);
    }
    // le treillis de bambou : des poteaux sous la coque, deux par rang, leurs traverses, deux longues perches
    for (const lz of [-2.7, -1.0, 0.7, 2.3, 3.8, 5.0]) {
      const w = demi(lz) * 0.62, hb = dessus(lz) - 1.25;
      for (const s of w > 0.3 ? [-1, 1] : [0]) a.baton(at(s * w, y - 0.1, lz), at(s * w, y + hb, lz), 0.03, BAMBOU, 5);
      if (w > 0.3) a.baton(at(-w - 0.15, y + hb, lz), at(w + 0.15, y + hb, lz), 0.026, BAMBOU, 5, { trait: false });
    }
    for (const s of [-1, 1]) {
      const pts = [-2.7, -1.0, 0.7, 2.3, 3.8].map((lz) => at(s * demi(lz) * 0.62, y + dessus(lz) - 1.25, lz));
      for (let k = 0; k + 1 < pts.length; k++) a.baton(pts[k], pts[k + 1], 0.024, BAMBOU, 5, { trait: false });
    }
    poser(a.fin(), 0, 0, { y: 0 });
    // la cour de gravier : une clôture basse de bambou du côté de l'allée, d'un seul tenant (son ouverture ne menait nulle
    // part : on regarde le pin par-dessus)
    const m = atelier();
    cloture(m, [[50.9, R0.z - 5], [50.9, R0.z], [50.9, R0.z + 5]]);
    poser(m.fin(), 0, 0, { y: 0 });
    // (la clôture arrête le joueur sur toute sa longueur, pas seulement à son entrée)
    monde.mur(51.0, R0.z - 5, 51.0, R0.z + 5, 0.3);
  }
  // la tour de Jōzō (浄蔵貴所塔) : une petite pagode de pierre pour le moine qui redressa la pagode de Yasaka ; on dit qu'elle
  // exauce les vœux. Sur la rive sud de l'étang, dans sa clôture
  // C'est une pagode à reliquaire de pierre (宝篋印塔, d'après les photos) : sur un socle, le corps carré où est gravée dans
  // un disque de lune la lettre sacrée de chaque bouddha, un toit à gradins aux quatre coins relevés en oreilles, et la flèche
  // (覆鉢, 九輪, 宝珠) ; autour, une clôture de pierre (玉垣) ouverte devant, vers la petite place ; une pierre à encens.
  // (Avant le 2026-10-27, un socle, un petit toit et quatre piquets : « tu peux la refaire mieux que ça ».)
  {
    const a = atelier(), J = JOZO, y = terrain(J.x, J.z), R = repere(J.x, J.z, 2.256);
    const PIERRE = '#a39e92', SOMBRE = '#8f8a7e', mousse = (yb) => (x, yy) => (yy < y + yb && hasard(x * 7, yy * 9) > 0.55 ? '#7f8a62' : PIERRE);
    // le dallage, le socle, deux gradins
    a.boite(2.4, 0.14, 2.4, '#9a9283', R(0, y + 0.03, 0, { nuance: 0.06 }))
      .boite(0.92, 0.26, 0.92, PIERRE, R(0, y + 0.23, 0, { teinte: mousse(0.3), nuance: 0.07 }))
      .boite(0.78, 0.1, 0.78, SOMBRE, R(0, y + 0.41, 0)).boite(0.68, 0.08, 0.68, PIERRE, R(0, y + 0.5, 0));
    // le corps (塔身), un disque de lune sur chaque face (sans sa lettre gravée : en deux traits, elle faisait une croix)
    a.boite(0.52, 0.5, 0.52, PIERRE, R(0, y + 0.79, 0, { nuance: 0.06 }));
    for (let k = 0; k < 4; k++) {
      const t = (k * PI) / 2, q = R(Math.sin(t) * 0.265, y + 0.8, Math.cos(t) * 0.265, { ry: t });
      a.cylindre(0.17, 0.17, 0.02, 14, '#b3aea2', { ...q, rx: PI / 2, ordre: 'YXZ', trait: false });
    }
    // le toit (笠) : deux gradins dessous, la dalle, six gradins dessus ; ses oreilles aux coins (隅飾り)
    a.boite(0.62, 0.05, 0.62, SOMBRE, R(0, y + 1.065, 0)).boite(0.72, 0.05, 0.72, PIERRE, R(0, y + 1.115, 0))
      .boite(0.86, 0.14, 0.86, PIERRE, R(0, y + 1.21, 0, { nuance: 0.06 }));
    for (let k = 0; k < 6; k++) { const l = 0.66 - k * 0.07; a.boite(l, 0.05, l, k % 2 ? SOMBRE : PIERRE, R(0, y + 1.305 + k * 0.05, 0)); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      a.boite(0.05, 0.24, 0.17, PIERRE, R(sx * 0.4, y + 1.38, sz * 0.31, { rz: -sx * 0.22 }))
        .boite(0.17, 0.24, 0.05, PIERRE, R(sx * 0.31, y + 1.38, sz * 0.4, { rx: sz * 0.22 }));
    }
    // la flèche : le bol renversé, la fleur, les neuf anneaux, la fleur, le joyau
    a.piece(new THREE.SphereGeometry(0.13, 10, 4, 0, 2 * PI, 0, PI / 2), PIERRE, R(0, y + 1.6, 0))
      .cylindre(0.12, 0.07, 0.07, 10, SOMBRE, R(0, y + 1.75, 0));
    a.cylindre(0.05, 0.065, 0.5, 10, PIERRE, R(0, y + 2.03, 0));
    for (let k = 0; k < 9; k++) a.cylindre(0.072 - k * 0.0018, 0.072 - k * 0.0018, 0.022, 10, SOMBRE, R(0, y + 1.82 + k * 0.05, 0, { trait: false }));
    a.cylindre(0.1, 0.05, 0.06, 10, PIERRE, R(0, y + 2.31, 0))
      .piece(new THREE.LatheGeometry([[0, 0], [0.07, 0.02], [0.085, 0.08], [0.06, 0.15], [0.02, 0.2], [0, 0.22]].map(([r, h]) => new THREE.Vector2(r, h)), 10), PIERRE, R(0, y + 2.33, 0));
    // la clôture de pierre : des poteaux à tête pointue, deux traverses ; ouverte devant (+z), une pierre à encens
    const C = 0.98, poteaux = [[-C, -C], [0, -C], [C, -C], [C, 0], [C, C], [0.42, C], [-0.42, C], [-C, C], [-C, 0]];
    for (const [px, pz] of poteaux) a.boite(0.13, 0.62, 0.13, SOMBRE, R(px, y + 0.31, pz, { nuance: 0.06 })).cone(0.095, 0.1, 4, SOMBRE, R(px, y + 0.67, pz, { ry: PI / 4 }));
    for (const [[x0, z0], [x1, z1]] of [[[-C, -C], [C, -C]], [[C, -C], [C, C]], [[C, C], [0.42, C]], [[-0.42, C], [-C, C]], [[-C, C], [-C, -C]]]) {
      for (const hh of [0.22, 0.5]) {
        const p0 = R(x0, y + hh, z0), p1 = R(x1, y + hh, z1);
        a.baton([p0.x, p0.y, p0.z], [p1.x, p1.y, p1.z], 0.04, PIERRE, 4);
      }
    }
    a.boite(0.42, 0.3, 0.3, SOMBRE, R(0, y + 0.15, 0.68)).boite(0.32, 0.03, 0.2, '#5a5048', R(0, y + 0.31, 0.68, { trait: false }));
    poser(a.fin(), 0, 0, { y: 0 });
    monde.cercle(J.x, J.z, 1.65);
  }

  // ---------------------------------------------------------------- L'eau : l'étang-miroir et son vrai reflet, Anmintaku
  // (l'étang-miroir : une eau verte et sombre, qui reflète tout ; on y devine les carpes près du bord)
  const eauxCalmes = [
    [-53, 43, -19, 61, EAU],
    [ANMIN.x - ANMIN.rx * 1.25, ANMIN.x + ANMIN.rx * 1.25, ANMIN.z - ANMIN.rz * 1.3, ANMIN.z + ANMIN.rz * 1.3, ANMIN.eau],
    ...eauxCalmesSource,
  ];
  for (const p of courantsVifs) rubanEau(p, 0.06, () => 0.8, '#cfeee8', { largeur: 0.06, vif: true });

  // ---------------------------------------------------------------- Le belvédère, les panneaux, les lanternes, les bancs
  {
    // la rambarde basse au bord de l'eau, le long du belvédère (on regarde par-dessus) ; ses bouts s'arrêtent avant les allées
    // qui arrivent aux deux bouts du belvédère (on y passait contre leurs pieux)
    const a = atelier(), pl = PLACES[0], c = Math.cos(pl.ry), s = Math.sin(pl.ry), pts = [];
    for (let k = 0; k <= 14; k++) {
      const t = -PI + 0.35 + ((PI - 0.7) * k) / 14, u = Math.cos(t) * (pl.rx + 0.4), v = Math.sin(t) * (pl.rz + 0.4);
      pts.push([pl.x + u * c + v * s, pl.z - u * s + v * c]);
    }
    cloture(a, pts);
    for (let i = 0; i + 1 < pts.length; i++) monde.mur(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 0.28);
    poser(a.fin(), 0, 0, { y: 0 });
    // le trépied de la photographe
    const t = atelier();
    trepied(t);
    poser(t.fin(), 24.0, 54.4, { y: terrain(24.0, 54.4) + 1.3, ry: Math.atan2(-24.0, -54.4) });
    monde.cercle(24.0, 54.4, 0.5);
  }
  const PANNEAUX = {
    kinkaku: { x: 27.0, z: 57.4, ry: -0.54 }, ryumon: { x: 18.6, z: -46.8, ry: 3.0 }, anmintaku: { x: 8.4, z: -66.8, ry: PI },
    sekkatei: { x: 36.0, z: -70.8, ry: 2.78 }, fudo: { x: 72.4, z: -61.8, ry: -2.4 }, rikushu: { x: 49.0, z: 17.8, ry: 0 }, jardin: { x: 80.4, z: 57.0, ry: 2.76 },
  };
  for (const [id, p] of Object.entries(PANNEAUX)) {
    const y = terrain(p.x, p.z), b = panneau(atelier(), P, { ecrit: true });
    poser(b.fin(), p.x, p.z, { y, ry: p.ry });
    ecrire({ x: p.x, y, z: p.z, ry: p.ry }, { ...PAPIER_PANNEAU, texte: TITRES_PANNEAUX[id], fond: '#fff8e8', encre: '#2a2420', lignes: 3 });
    const cx = Math.cos(p.ry) * 0.6, cz = -Math.sin(p.ry) * 0.6;
    monde.mur(p.x - cx, p.z - cz, p.x + cx, p.z + cz, 0.5);
  }
  {
    // quelques lanternes de pierre le long de la rive est et devant le hōjō ; deux bancs au bord de l'allée de sortie
    const a = atelier();
    // (celle du bout du belvédère était au bord de l'allée, devant sa clôture ; celle du bois derrière le pavillon, au bord du
    // nouveau lit du ruisseau : 2026-10-27)
    for (const [x, z] of [[47.8, 25.6], [47.6, 38.0], [43.0, 47.6], [12.6, -8.2], [-12.8, -23.2]]) lanterne(a, x, z);
    for (const [x, z, cap] of BANCS_SORTIE) {
      // (la planche le long de la ligne où l'on s'assoit, un pied sous chaque bout)
      const y = terrain(x, z), cs = Math.cos(cap), sn = Math.sin(cap);
      a.boite(1.6, 0.08, 0.42, '#8a6a4e', { x, y: y + 0.44, z, ry: cap });
      for (const d of [-0.62, 0.62]) a.boite(0.08, 0.42, 0.36, '#5a4636', { x: x + d * cs, y: y + 0.21, z: z - d * sn, ry: cap });
      bancs.push({ de: [x - 0.7 * cs, z + 0.7 * sn], a: [x + 0.7 * cs, z - 0.7 * sn], y: y + 0.48, cap, vue: 0.35 });
      monde.mur(x - 0.55 * cs, z + 0.55 * sn, x + 0.55 * cs, z - 0.55 * sn, 0.48);
    }
    poser(a.fin(), 0, 0, { y: 0 });
  }
  {
    // le lampion de Bunbuku : un bambou planté à côté de lui, un peu en arrière, une potence vers l'allée, le chōchin rouge (on
    // le trouve de loin)
    const a = atelier(), yl = terrain(LAMPION.x, LAMPION.z), fx = Math.sin(MARCHAND.cap) * 0.3, fz = Math.cos(MARCHAND.cap) * 0.3;
    a.baton([LAMPION.x, yl - 0.2, LAMPION.z], [LAMPION.x, yl + 2.15, LAMPION.z], 0.03, '#a3a35c', 6)
      .baton([LAMPION.x, yl + 2.08, LAMPION.z], [LAMPION.x + fx * 1.07, yl + 2.08, LAMPION.z + fz * 1.07], 0.015, '#a3a35c', 5)
      .baton([LAMPION.x + fx, yl + 2.08, LAMPION.z + fz], [LAMPION.x + fx, yl + 1.97, LAMPION.z + fz], 0.004, '#3a3236', 3, { trait: false })
      .chochin(LAMPION.x + fx, yl + 1.82, LAMPION.z + fz, 3);
    lumieres.push({ x: LAMPION.x + fx, y: yl + 1.82, z: LAMPION.z + fz, halo: 0.55, sol: yl, r: 4.2 });
    monde.cercle(LAMPION.x, LAMPION.z, 0.3);
    monde.cercle(LAMPION.x + fx, LAMPION.z + fz, 0.35);
    poser(a.fin(), 0, 0, { y: 0 });
  }
  // le jardinier taille un pin, perché sur son escabeau à trois pieds (三脚脚立, celui des jardiniers japonais, en aluminium) :
  // deux montants qui s'écartent vers le bas, ses marches, et derrière la troisième jambe, vers l'arbre ; il se tient sur la
  // troisième marche, tourné vers le haut de l'escabeau. (Avant le 2026-10-27, trois bâtons et deux planchettes en travers :
  // « il est un peu mal fait ».)
  const TAILLE = { x: 38.0, z: 10.9 }, CAP_TAILLE = -PI / 2 - 0.6;
  {
    const a = atelier(), y = terrain(TAILLE.x, TAILLE.z);
    a.pinNuages(TAILLE.x - 1.1, TAILLE.z + 0.7, 7.5, -1, { y: terrain(TAILLE.x - 1.1, TAILLE.z + 0.7) });
    // (repère : les pieds du jardinier, f devant lui, c sur le côté)
    const F = [TAILLE.x + 0.15, TAILLE.z - 0.1], fx = Math.sin(CAP_TAILLE), fz = Math.cos(CAP_TAILLE), cx = fz, cz = -fx;
    const en = (av, cote, h) => [F[0] + fx * av + cx * cote, y + h, F[1] + fz * av + cz * cote];
    const ALU = '#c4c8ce', MARCHE = '#a3a9b2', PATIN = '#3a3a40', HAUT = 1.95, BAS = -0.55, SOMMET = 0.28;
    // les deux montants : 34 cm de chaque côté en bas, 13 en haut
    const montant = (s, h) => { const f = h / HAUT; return en(BAS + (SOMMET - BAS) * f, s * (0.34 - 0.21 * f), h); };
    for (const s of [-1, 1]) {
      a.baton(montant(s, 0), montant(s, HAUT - 0.04), 0.022, ALU, 6).boite(0.06, 0.05, 0.08, PATIN, { x: montant(s, 0)[0], y: y + 0.025, z: montant(s, 0)[2], ry: CAP_TAILLE });
    }
    // les marches (des lattes plates, striées), tous les 32 cm ; le chapeau du haut, où s'articule la troisième jambe
    for (const h of [0.32, 0.635, 0.95, 1.27, 1.6]) {
      const [m0x, , m0z] = montant(-1, h), [m1x, , m1z] = montant(1, h), l = Math.hypot(m1x - m0x, m1z - m0z);
      a.boite(l + 0.03, 0.03, 0.09, MARCHE, { x: (m0x + m1x) / 2, y: y + h, z: (m0z + m1z) / 2, ry: CAP_TAILLE, teinte: (xx, yy, zz) => (Math.floor((xx * fx + zz * fz) * 60) % 2 ? MARCHE : '#9298a2') });
    }
    const [tx, ty, tz] = en(SOMMET, 0, HAUT);
    a.boite(0.32, 0.07, 0.16, '#8a9098', { x: tx, y: ty, z: tz, ry: CAP_TAILLE });
    // la troisième jambe, vers l'arbre, et son patin
    const pied3 = en(1.2, 0, 0);
    a.baton([tx, ty - 0.04, tz], pied3, 0.025, ALU, 6).boite(0.07, 0.05, 0.07, PATIN, { x: pied3[0], y: y + 0.025, z: pied3[2] });
    poser(a.fin(), 0, 0, { y: 0 });
    // (les trois pieds et l'écart entre eux arrêtent le joueur)
    for (const [av, r] of [[-0.4, 0.58], [0.3, 0.45], [0.75, 0.36], [1.15, 0.28]]) { const [qx, , qz] = en(av, 0, 0); monde.cercle(qx, qz, r); }
  }

  // ---------------------------------------------------------------- Les carpes de l'étang-miroir
  // (celles de Takachiho et des douves de Himeji, carpes.js) : une douzaine, plus souvent près du belvédère et du pavillon
  const carpes = (() => {
    const objet = new THREE.Group();
    const marge = (x, z) => Math.min(-bordEtang(x, z) - 0.9, surIle(x, z).d - 0.8, ...Object.values(ROCHES).map((R) => Math.hypot(x - R.x, z - R.z) - R.r - 0.5));
    const liste = [];
    const COINS = [[22, 46], [8, 12], [-14, 6], [-30, 24], [6, 44], [18, 22]];
    const but = (k, temps) => {
      for (let e = 0; e < 20; e++) {
        const [cx, cz] = COINS[Math.floor(hasard(temps * 1.7 + e, k.ph) * COINS.length)], x = cx + (hasard(temps + e, k.ph * 3) - 0.5) * 16, z = cz + (hasard(k.ph + e, temps * 2) - 0.5) * 16;
        if (marge(x, z) > 0.6 && Math.hypot(x - k.x, z - k.z) > 3) return [x, z];
      }
      return null;
    };
    for (let i = 0; i < 12; i++) {
      const f = fabriquerCarpe(ctx, 30 + i, { taille: 1.9 });
      objet.add(f.g);
      let x = 20, z = 40;
      for (let e = 0; e < 60; e++) { const [cx, cz] = COINS[i % COINS.length]; x = cx + (hasard(i, e) - 0.5) * 12; z = cz + (hasard(e, i) - 0.5) * 12; if (marge(x, z) > 0.8) break; }
      liste.push({ ...f, x, z, cap: hasard(i, 9) * 2 * PI, cible: null, prof: 0.28 + 0.1 * hasard(i, 7), ph: i * 1.3, th: i, taux: 0 });
    }
    return {
      objet,
      maj(dt, temps, c) {
        const j = c.joueur, loin = Math.hypot(j.x - 0, j.z - 25) > 90;
        objet.visible = !loin;
        if (loin) return [];
        dt = Math.min(dt, 0.1);
        for (const k of liste) {
          if (!k.cible || Math.hypot(k.x - k.cible[0], k.z - k.cible[1]) < 1.2) k.cible = but(k, temps);
          const taux = nager(k, liste, dt, (0.32 + 0.08 * Math.sin(temps * 0.37 + k.ph)) * (1 - 0.8 * c.nuit) * k.k, marge);
          const lacet = onduler(k, dt, taux, c.nuit);
          k.g.position.set(k.x, EAU - k.prof - 0.15 * c.nuit + 0.008 * Math.sin(temps * 1.3 + k.ph), k.z);
          k.g.rotation.set(0, k.cap + lacet, 0);
        }
        return [];
      },
    };
  })();
  animes.push(carpes);

  // ---------------------------------------------------------------- La carpe de la cascade de la Porte du Dragon
  // une carpe dorée tourne dans le petit bassin ; au tampon, elle saute vers la chute (celle qui la remonte devient dragon)
  const carpeDragon = (() => {
    const f = fabriquerCarpe(ctx, 3, { taille: 1.5 }), objet = new THREE.Group();
    Object.assign(f, { th: 0, taux: 0 });
    objet.add(f.g);
    const B = BASSIN_R;
    let t = 0, saut = -1;
    return {
      objet,
      sauter() { saut = 0; },
      maj(dt) {
        dt = Math.min(dt, 0.1);
        t += dt * (0.5 + 0.2 * Math.sin(t * 0.3));
        let x = B.x + Math.cos(t) * 0.75, z = B.z + 0.15 + Math.sin(t) * 0.42, y = B.eau - 0.22, cap = Math.atan2(-Math.sin(t) * 0.75, Math.cos(t) * 0.42), rx = 0;
        if (saut >= 0) {
          // l'élan vers la chute, le saut (1,4 s), la retombée
          saut += dt;
          const u = Math.min(1, saut / 1.4);
          x = B.x - 0.1; z = B.z + 0.6 - 0.9 * u;
          y = B.eau - 0.2 + 1.6 * Math.sin(u * PI);
          cap = PI; rx = -1.1 * Math.cos(u * PI);
          if (saut > 1.6) saut = -1;
        }
        f.g.position.set(x, y, z);
        f.g.rotation.set(rx, cap, 0, 'YXZ');
        onduler(f, dt, saut >= 0 ? 1 : 0.4, 0, saut >= 0 ? 1 : 0);
        return [];
      },
    };
  })();
  animes.push(carpeDragon);

  // ---------------------------------------------------------------- Le lancer de pièce (le tampon des statues)
  // un cercle doré va et vient sur le sol devant les statues, en passant sur le bol de pierre ; on lance (A) quand il est sur
  // le bol : la pièce vole jusqu'au cercle ; dans le bol, elle tinte. Trois pièces par essai
  const lancer = (() => {
    const objet = new THREE.Group(), y0 = terrain(BOL.x, BOL.z);
    const anneau = new THREE.Mesh(new THREE.RingGeometry(0.13, 0.21, 28).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ color: '#ffd76a', transparent: true, opacity: 0.85, depthWrite: false }));
    const piece = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.008, 14), new THREE.MeshBasicMaterial({ color: '#e8c25a' }));
    objet.add(anneau, piece);
    anneau.visible = piece.visible = false;
    let actif = false, t = 0, vol = null;
    // (le sens du lancer : du joueur vers le bol ; le cercle va et vient en travers, et un peu en long)
    let ux = 0, uz = 1;
    const pos = () => {
      const a = Math.sin(t * 4.2), b = Math.sin(t * 1.7 + 0.8);
      return [BOL.x - uz * a * 0.78 + ux * b * 0.32, BOL.z + ux * a * 0.78 + uz * b * 0.32];
    };
    return {
      objet,
      jouer(oui, de) { actif = oui; anneau.visible = oui; if (de) { const d = Math.hypot(BOL.x - de[0], BOL.z - de[1]) || 1; ux = (BOL.x - de[0]) / d; uz = (BOL.z - de[1]) / d; } },
      /** Lance une pièce de la main (x, y, z) vers le cercle : se résout à l'arrivée, vrai si elle est dans le bol. */
      lancer(main) {
        const [cx, cz] = pos();
        return new Promise((fin) => { vol = { de: main, vers: [cx, terrain(cx, cz) + 0.03, cz], t: 0, fin }; piece.visible = true; });
      },
      maj(dt) {
        // (sur le bol, le cercle monte sur son bord : à terre, le bol le cachait au moment de lancer)
        if (actif) { t += dt; const [x, z] = pos(); anneau.position.set(x, terrain(x, z) + (Math.hypot(x - BOL.x, z - BOL.z) < 0.44 ? 0.25 : 0.04), z); anneau.material.opacity = 0.65 + 0.25 * Math.sin(t * 9); }
        if (vol) {
          vol.t += dt / 0.7;
          const u = Math.min(1, vol.t), { de, vers } = vol;
          piece.position.set(de[0] + (vers[0] - de[0]) * u, de[1] + (vers[1] - de[1]) * u + 1.1 * Math.sin(u * PI), de[2] + (vers[2] - de[2]) * u);
          piece.rotation.set(u * 14, u * 5, 0);
          if (u >= 1) {
            const dans = Math.hypot(vers[0] - BOL.x, vers[2] - BOL.z) < 0.27, f = vol.fin;
            vol = null;
            piece.visible = false;
            f(dans);
          }
        }
        return [];
      },
    };
  })();
  animes.push(lancer);

  // ---------------------------------------------------------------- Le secret : le phénix dans la source
  // La nuit, tant qu'on ne l'a pas retrouvé, le reflet d'un phénix d'or qui boit, dans l'eau de la source de la Voie lactée :
  // un phénix retourné sous la surface (le reflet d'un phénix qui se tiendrait sur le bord nord, penché vers l'eau ; dessus,
  // il n'y a rien), des étoiles qui se reflètent autour, des ronds dans l'eau là où il boit. Quand on tend la main, il lève la
  // tête, s'envole dans le reflet ; une plume d'or remonte de l'eau
  const source = (() => {
    const objet = new THREE.Group(), S = SOURCE;
    const miroir = new THREE.Group();
    miroir.position.y = 2 * S.eau;
    miroir.scale.set(1, -1, 1);
    const fantome = new THREE.Group();
    const m = ctx.maillage(phenix(atelier(), '#ffd25a', '#f2b43a').fin(0, false));
    m.scale.setScalar(0.62);
    fantome.add(m);
    fantome.position.set(S.x, S.eau + 0.16, S.z - 0.32);
    fantome.rotation.set(0.55, 0, 0, 'YXZ');
    miroir.add(fantome);
    objet.add(miroir);
    // les étoiles reflétées : de petits points clairs sous la surface
    const n = 26, pos = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) { pos[k * 3] = S.x + (hasard(k, 1) - 0.5) * 2 * S.lx * 0.9; pos[k * 3 + 1] = S.eau - 0.05 - 0.8 * hasard(k, 2); pos[k * 3 + 2] = S.z + (hasard(k, 3) - 0.5) * 2 * S.lz * 0.9; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const etoiles = new THREE.Points(g, new THREE.PointsMaterial({ color: '#dfe8ff', size: 3, sizeAttenuation: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    objet.add(etoiles);
    // la plume d'or qui remonte de l'eau
    // (sa tige plus foncée, du tuyau sous la plume jusqu'à la pointe ; elle luit dans la nuit)
    const pa = plume(atelier(), [0, 0, 0], [0, 0.34, 0.04], 0.12, 0.012, '#ffd25a', [1, 0, 0], { sorte: 'lumiere' });
    pa.baton([0, -0.07, -0.008], [0, 0.32, 0.038], 0.009, '#e2a634', 4, { trait: false, sorte: 'lumiere' });
    const plumeOr = ctx.maillage(pa.fin(0, false));
    plumeOr.scale.setScalar(1.5);
    plumeOr.visible = false;
    objet.add(plumeOr);
    // les ronds sur l'eau, là où il boit
    const rond = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.075, 20).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ color: '#fff2c0', transparent: true, opacity: 0, depthWrite: false }));
    rond.position.set(S.x, S.eau + 0.006, S.z - 0.1);
    objet.add(rond);
    let envol = -1, plumeT = -1;
    return {
      objet,
      /** Le phénix est-il là (la nuit, pas encore retrouvé, pas envolé) ? */
      get la() { return envol < 0 && !secretTrouve('phenix'); },
      envoler() { envol = 0; },
      plume() { plumeT = 0; plumeOr.visible = true; },
      cacherPlume() { plumeT = -1; plumeOr.visible = false; },
      maj(dt, temps, c) {
        const nuit = c.nuit > 0.5, proche = Math.hypot(c.joueur.x - S.x, c.joueur.z - S.z) < 40;
        objet.visible = proche && (nuit || plumeT >= 0);
        const la = nuit && !secretTrouve('phenix') && envol < 0;
        fantome.visible = la || (envol >= 0 && envol < 2.5);
        etoiles.visible = nuit;
        if (!objet.visible) return [];
        if (la) {
          // il boit : la tête qui plonge et remonte
          const b = Math.max(0, Math.sin(temps * 1.3));
          fantome.rotation.x = 0.4 + 0.35 * b;
          const f = (temps * 0.65) % 1;
          rond.scale.setScalar(1 + f * 5);
          rond.material.opacity = 0.6 * (1 - f);
        } else rond.material.opacity = 0;
        if (envol >= 0) {
          // il lève la tête, puis s'envole (dans le reflet : il s'enfonce et s'éloigne), et s'efface
          envol += dt;
          const u = Math.max(0, envol - 0.6);
          fantome.rotation.x = Math.max(-0.5, 0.4 - envol * 1.5);
          fantome.position.set(S.x, S.eau + 0.16 + u * u * 1.6, S.z - 0.32 - u * 0.6);
          m.scale.setScalar(0.62 * Math.max(0, 1 - u / 1.9));
        }
        if (plumeT >= 0) {
          plumeT += dt;
          const u = Math.min(1, plumeT / 2.2);
          // (elle monte de 55 cm et flotte au-dessus de l'eau, au milieu du plan de la caméra)
          plumeOr.position.set(S.x + 0.1 * Math.sin(plumeT * 3), S.eau + 0.05 + 0.55 * (1 - (1 - u) ** 2), S.z - 0.1);
          plumeOr.rotation.set(0.3 * Math.sin(plumeT * 2), plumeT * 2.4, 0.4 * Math.sin(plumeT * 1.7));
        }
        return [];
      },
    };
  })();
  animes.push(source);

  // ---------------------------------------------------------------- Le plateau du thé (le tampon du salon de thé)
  // un plateau laqué : le bol de thé matcha mousseux, le petit gâteau et sa feuille d'or ; posé sur le banc, à côté du voyageur
  const plateau = (() => {
    const a = atelier();
    a.boite(0.34, 0.025, 0.26, '#2a1f1c').cylindre(0.065, 0.05, 0.07, 14, '#3a3a40', { y: 0.05, x: -0.06 }).cylindre(0.058, 0.058, 0.005, 14, '#7fae3a', { y: 0.083, x: -0.06, trait: false })
      .boite(0.08, 0.008, 0.08, '#f4efe2', { x: 0.09, y: 0.017 }).ovale(0.03, '#e8d8b0', { x: 0.09, y: 0.04, sy: 0.6 }, 8).boite(0.02, 0.003, 0.02, '#e8c25a', { x: 0.09, y: 0.058, ry: 0.5, trait: false });
    const objet = ctx.maillage(a.fin(0, false));
    objet.visible = false;
    return { objet, maj: () => [], poser(x, y, z, ry) { objet.position.set(x, y, z); objet.rotation.y = ry; objet.visible = true; }, ranger() { objet.visible = false; } };
  })();
  animes.push(plateau);

  // les morceaux des rives et des arbres
  for (const a of morceaux.values()) poser(a.fin(), 0, 0, { y: 0 });

  // ---------------------------------------------------------------- Les gens
  const PEAU = P.peau, NOIR = '#2a2226', ty = (x, z) => terrain(x, z);
  const RC = repere(CHA.x, CHA.z, CHA.ry), RS = repere(SHUIN.x, SHUIN.z, -0.3), CHAYA = RC(0.5, 0, 0.1), SHUINP = RS(0, 0, 0.72);
  const passants = [
    // le gardien du belvédère (il fait circuler la foule)
    { id: 'gardien', x: 37.0, z: 50.6, cap: -1.2, tenue: { taille: 1.04, peau: '#e8bf98', cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'casquette', c: '#2a3550', c2: '#2a3550' }, haut: '#2a3550', manches: 'longues', bas: { sorte: 'pantalon', c: '#2a3550' }, chaussures: '#1f1f24', semelle: '#1f1f24' } },
    { id: 'photographe', x: 24.6, z: 55.0, cap: Math.atan2(-24.6, -55.0), tenue: { taille: 1.0, peau: '#f2c9a8', cheveux: '#3a2a22', coiffure: 'queue', chapeau: { sorte: 'bob', c: '#d8c8a0' }, haut: '#7a8a6a', manches: 'longues', bas: { sorte: 'pantalon', c: '#4a4a52' }, chaussures: '#e8e4dc', semelle: '#3a3236', appareil: true } },
    // @random_japan_place, qui filme le pavillon (le TikTok)
    { id: 'videaste', x: 33.0, z: 50.4, cap: Math.atan2(-33, -50.4), tenue: { taille: 1.1, peau: PEAU, cheveux: '#3a2a20', coiffure: 'court', chapeau: { sorte: 'bob', c: '#2f3440' }, haut: '#2f3440', manches: 'courtes', bas: { sorte: 'pantalon', c: '#c9b48a' }, chaussures: P.blanc, semelle: '#3a3236', appareil: true } },
    // la guide, son petit drapeau, et deux élèves en voyage scolaire (Kyoto est LA ville des voyages de classe) ; tous trois
    // sur l'allée (avant le 2026-10-27, le garçon était derrière la clôture)
    { id: 'guide', x: 42.0, z: 57.0, cap: -PI / 2 - 0.2, tenue: { taille: 1.0, peau: '#f2c9a8', cheveux: '#3a2a22', coiffure: 'chignon', chapeau: { sorte: 'soleil', c: '#f4efe2' }, haut: '#3f6aa0', manches: 'longues', bas: { sorte: 'jupe', c: '#2f3a5a' }, chaussures: '#3a3236', semelle: '#3a3236', pose: 'drapeau' } },
    { id: 'eleve', x: 39.8, z: 57.9, cap: PI / 2 + 0.25, tenue: { taille: 0.86, peau: PEAU, cheveux: NOIR, coiffure: 'court', haut: '#1f2230', manches: 'longues', col: '#1f2230', bas: { sorte: 'pantalon', c: '#1f2230' }, chaussures: '#f4efe2', semelle: '#3a3236', sac: { sorte: 'dos', c: '#2f4a7a', c2: '#1f2a4a' } } },
    { id: 'eleve2', x: 39.4, z: 56.3, cap: PI / 2 + 0.05, tenue: { taille: 0.84, peau: '#f2c9a8', cheveux: NOIR, coiffure: 'nattes', haut: '#f4f2ee', manches: 'longues', bas: { sorte: 'jupe', c: '#2a3552' }, chaussures: '#3a2a26', semelle: '#3a3236', sac: { sorte: 'dos', c: '#c8452e', c2: '#99673f' } } },
    // une promeneuse en kimono de location, sur la rive est
    { id: 'kimono', x: 45.2, z: 33.4, cap: PI, ronde: [[45.2, 33.4], [44.8, 21.6], [45.2, 33.4], [43.4, 41.8]], vitesse: 0.8, attente: [4, 9], tenue: { taille: 0.96, peau: '#f4d0b0', cheveux: NOIR, coiffure: 'chignon', haut: '#e8889a', manches: 'kimono', col: '#f4efe2', bas: { sorte: 'jupe', c: '#e8889a' }, chaussures: '#c8302c', semelle: '#e8e0cc' }, quand: 'jour' },
    // le jardinier sur son escabeau, qui taille un pin
    { id: 'jardinier', x: TAILLE.x + 0.15, z: TAILLE.z - 0.1, cap: CAP_TAILLE, etage: null, tenue: { taille: 1.0, peau: '#e0b48c', cheveux: '#5a5650', coiffure: 'court', chapeau: { sorte: 'bandeau', c: '#f4f0e6' }, haut: '#2f4a6a', manches: 'longues', bas: { sorte: 'pantalon', c: '#2f3a4a' }, chaussures: '#2a2a30', semelle: '#2a2a30', yeux: 'plisses', pose: 'tailler' } },
    // un jeune moine qui balaie l'allée derrière le pavillon
    { id: 'moine', x: -4.0, z: -17.6, cap: PI / 2, ronde: [[-4.0, -17.6], [2.2, -15.2]], vitesse: 0.4, attente: [5, 10], tenue: { taille: 1.0, peau: '#ecc4a0', cheveux: NOIR, coiffure: 'rase', haut: '#3a3f4a', manches: 'longues', bas: { sorte: 'pantalon', c: '#3a3f4a' }, chaussures: '#8a7a5a', semelle: '#3a3236', pose: 'balai' } },
    // le moine du guichet (derrière son comptoir), la dame du salon de thé, le maître de thé du pavillon du soir, le moine des goshuin
    { id: 'billet', x: UKETSUKE.x, z: UKETSUKE.z - 0.6, cap: PI, tenue: { taille: 1.0, peau: '#e8bf98', cheveux: NOIR, coiffure: 'rase', haut: '#2a2a30', manches: 'kimono', col: '#f4f0e6', bas: { sorte: 'hakama', c: '#2a2a30' }, chaussures: '#f4f0e6', semelle: '#3a3236', yeux: 'plisses' }, quand: 'jour' },
    { id: 'chaya', x: CHAYA.x, z: CHAYA.z, cap: CHA.ry, tenue: { taille: 0.94, peau: '#f0c8a6', cheveux: '#3a2a22', coiffure: 'chignon', chapeau: { sorte: 'foulard', c: '#2f4a6a' }, haut: '#f4efe2', manches: 'kimono', col: '#2f4a6a', tablier: '#2f4a6a', bas: { sorte: 'jupe', c: '#3a4a6a' }, chaussures: '#3a3236', semelle: '#3a3236', yeux: 'plisses' } },
    { id: 'chajin', x: 38.8, z: -70.6, cap: 0.6, tenue: { taille: 1.0, peau: '#e8bf98', cheveux: '#c8c4bc', coiffure: 'court', haut: '#5a5a48', manches: 'kimono', col: '#f4f0e6', bas: { sorte: 'hakama', c: '#4a4438' }, chaussures: '#f4f0e6', semelle: '#3a3236', yeux: 'plisses' } },
    { id: 'shuin', x: SHUINP.x, z: SHUINP.z, cap: -0.3, tenue: { taille: 1.0, peau: '#e8bf98', cheveux: NOIR, coiffure: 'rase', haut: '#2a2a30', manches: 'kimono', col: '#f4f0e6', bas: { sorte: 'hakama', c: '#2a2a30' }, chaussures: '#f4f0e6', semelle: '#f4f0e6', pose: 'jouer', instrument: 'pinceau' } },
    // une grand-mère qui prie devant la salle de Fudō ; un touriste qui se prend en photo ; un grand-père sur un banc ; un
    // enfant qui lance des pièces
    { id: 'obaa', x: FUDO.x - 1.1, z: FUDO.z + 5.4, cap: PI, tenue: { taille: 0.88, peau: '#f0c8a6', cheveux: '#d8d4cc', coiffure: 'chignon', haut: '#6a5a7a', manches: 'longues', bas: { sorte: 'pantalon', c: '#4a4a56' }, chaussures: '#3a3236', semelle: '#3a3236', yeux: 'plisses', canne: true } },
    { id: 'touriste', x: 44.2, z: 18.4, cap: -PI / 2, tenue: { taille: 1.12, peau: '#f4d6c0', cheveux: '#c8a46a', coiffure: 'court', chapeau: { sorte: 'casquette', c: '#c8452e', c2: '#f4f0e6' }, haut: '#f4f0e6', manches: 'courtes', bas: { sorte: 'short', c: '#5a6a4a' }, chaussures: '#e8e4dc', semelle: '#3a3236', sac: { sorte: 'dos', c: '#3a5a7a', c2: '#2a3a5a' }, appareil: true }, quand: 'jour' },
    { id: 'grandpere', x: 0, z: 0, cap: 0, assis: 0, tenue: { taille: 0.95, peau: '#e8bf98', cheveux: '#e8e4dc', coiffure: 'chauve', haut: '#7a6a5a', manches: 'longues', bas: { sorte: 'pantalon', c: '#4a4a40' }, chaussures: '#7a5a3a', semelle: '#3a3236', yeux: 'plisses', canne: true } },
    { id: 'enfant', x: 22.8, z: -44.4, cap: Math.atan2(BOL.x - 22.8, BOL.z + 44.4), tenue: { taille: 0.72, peau: PEAU, cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'ecolier', c: '#f2c443' }, haut: '#5aa64a', manches: 'courtes', bas: { sorte: 'short', c: '#3d5a8f' }, chaussures: P.blanc, semelle: '#3a3236' }, quand: 'jour' },
  ];
  // (le grand-père sur le troisième banc rouge du salon de thé)
  {
    const b = bancs[2], g = passants.find((p) => p.id === 'grandpere');
    Object.assign(g, { x: (b.de[0] + b.a[0]) / 2, z: (b.de[1] + b.a[1]) / 2, cap: b.cap, assis: b.y });
    bancs.splice(2, 1);
  }
  for (const p of passants) if (p.etage === null) delete p.etage;
  // (le jardinier se tient sur la deuxième marche de son escabeau)
  monde.surface(TAILLE.x - 0.1, TAILLE.x + 0.4, TAILLE.z - 0.35, TAILLE.z + 0.15, terrain(TAILLE.x, TAILLE.z) + 0.95, { etage: true, sol: 'bois' });
  passants.find((p) => p.id === 'jardinier').etage = terrain(TAILLE.x, TAILLE.z) + 1.5;
  // (le moine du guichet sur le plancher de sa maisonnette ; le moine des goshuin, assis sur les tatamis de son bureau,
  // derrière sa table basse)
  {
    const pb = passants.find((p) => p.id === 'billet'), yb = terrain(UKETSUKE.x, UKETSUKE.z);
    monde.surface(pb.x - 0.4, pb.x + 0.4, pb.z - 0.4, pb.z + 0.4, yb + 0.35, { etage: true, sol: 'bois' });
    pb.etage = yb + 1.0;
  }
  monde.surface(SHUINP.x - 0.4, SHUINP.x + 0.4, SHUINP.z - 0.4, SHUINP.z + 0.4, terrain(SHUIN.x, SHUIN.z) + 0.6, { etage: true, sol: 'bois' });
  passants.find((p) => p.id === 'shuin').etage = terrain(SHUIN.x, SHUIN.z) + 1.2;

  // ---------------------------------------------------------------- Ce qu'on peut faire (tout passe par `jeu`)
  const parler = (id) => ({ id, passant: id, verbe: 'parler', action: (jeu) => jeu.dire(jeu.txn(id), id) });
  const comp = (jeu, cle) => jeu.dire(jeu.tx(cle)[jeu.compagnon], 'compagnon');
  const interactions = [
    {
      // le belvédère : le Pavillon d'or et son reflet (le tampon) ; la nuit, il manque quelque chose au reflet…
      id: 'kinkaku', x: 28.0, z: 51.6, rayon: 3.2, haut: 1.6, verbe: 'regarder',
      async action(jeu) {
        // (la nuit : le pavillon et tout son reflet ; puis le toit du reflet de tout près, où il manque le phénix, et le vrai
        // toit, où il est ; une fois le secret trouvé, le phénix est revenu dans le reflet)
        const de = [27.4, 2.0, 49.6], toitReflet = { de, vers: [0, -12.0, 0], champ: 13 };
        jeu.cadrer(jeu.estNuit ? { de, vers: [0, -4.0, 0], champ: 42 } : { de, vers: [0, 3.2, 0], champ: 30 });
        await jeu.attendre(800);
        if (jeu.estNuit && !secretTrouve('phenix')) {
          const [l1, l2, l3] = jeu.tx('kinkakuNuit');
          await jeu.dire([l1]);
          jeu.cadrer(toitReflet);
          await jeu.dire([l2]);
          jeu.cadrer({ de, vers: [0, 11.4, 0], champ: 13 });
          await jeu.attendre(1600);
          jeu.cadrer(toitReflet);
          await jeu.attendre(600);
          await jeu.dire([l3]);
          jeu.voirIndice('phenix-reflet');
          await comp(jeu, 'refletCompagnon');
        } else if (jeu.estNuit) {
          await jeu.attendre(600);
          jeu.cadrer(toitReflet);
          await jeu.dire(jeu.tx('kinkakuNuitApres'));
        } else await jeu.dire(jeu.tx('kinkaku'));
        jeu.cadrer(null);
        if (!jeu.aTampon('kinkaku')) { await jeu.tampon('kinkaku'); await comp(jeu, 'kinkakuCompagnon'); }
      },
    },
    {
      // le pavillon de tout près, de la rive est : les trois étages, trois styles ; le rocher du mont Meru devant
      id: 'pavillon', x: 12.2, z: -3.4, rayon: 2.0, haut: 1.6, verbe: 'regarder',
      async action(jeu) {
        jeu.cadrer({ de: [13.2, 1.6, -2.6], vers: [0, 5.4, 0], champ: 55 });
        await jeu.attendre(600);
        await jeu.dire(jeu.tx('pavillon'));
        jeu.cadrer({ de: [12.4, 1.8, -1.6], vers: [ROCHES.kuzan.x, 0, ROCHES.kuzan.z], champ: 45 });
        await jeu.attendre(500);
        await jeu.dire(jeu.tx('kuzan'));
        jeu.cadrer(null);
      },
    },
    {
      // derrière le pavillon : son côté nord, de plâtre blanc, et le petit pavillon du bord de l'eau
      id: 'sosei', x: -21.0, z: -22.4, rayon: 2.2, haut: 1.6, verbe: 'regarder',
      async action(jeu) {
        jeu.cadrer({ de: [-20.4, 1.8, -21.4], vers: [-6, 3.2, -0.5], champ: 50 });
        await jeu.attendre(600);
        await jeu.dire(jeu.tx('sosei'));
        jeu.cadrer(null);
      },
    },
    { id: 'ashihara', x: 42.6, z: 38.0, rayon: 2.2, haut: 1.4, verbe: 'regarder', action: (jeu) => jeu.dire(jeu.tx('ashihara')) },
    { id: 'rikushu', x: 49.4, z: 15.4, rayon: 1.8, haut: 1.6, verbe: 'regarder', async action(jeu) { jeu.cadrer({ de: [50.2, 2.6, 15.4], vers: [RIKUSHU.x - 1, 1.6, RIKUSHU.z], champ: 55 }); await jeu.attendre(500); await jeu.dire(jeu.tx('rikushu')); jeu.cadrer(null); } },
    { id: 'jozo', x: JOZO.x + 1.6, z: JOZO.z - 1.2, rayon: 1.8, haut: 1.8, verbe: 'prier', async action(jeu) { jeu.geste('prier'); await jeu.attendre(3800); jeu.geste(null); await jeu.dire(jeu.tx('jozo')); } },
    { id: 'shinun', x: SHINUN.x + 0.9, z: SHINUN.z + 2.4, rayon: 1.8, haut: 1.6, verbe: 'prier', async action(jeu) { jeu.geste('prier'); jeu.son('cloche'); await jeu.attendre(3800); jeu.geste(null); await jeu.dire(jeu.tx('shinun')); } },
    {
      // la source de la Voie lactée : le jour, l'eau du thé de Yoshimitsu ; la nuit… le reflet d'un phénix (le secret)
      id: 'gingasen', x: SOURCE.x, z: SOURCE.z + 2.6, rayon: 2.2, haut: 1.0, verbe: 'regarder',
      async action(jeu) {
        if (!jeu.estNuit || !source.la) { await jeu.dire(jeu.txn(secretTrouve('phenix') ? 'gingasenApres' : 'gingasen')); return; }
        jeu.cadrer({ de: [SOURCE.x + 0.3, SOURCE.eau + 2.3, SOURCE.z + 1.9], vers: [SOURCE.x, SOURCE.eau - 0.4, SOURCE.z - 0.2], champ: 55 });
        await jeu.attendre(900);
        await jeu.dire(jeu.tx('gingasenNuit'));
        await comp(jeu, 'phenixCompagnon');
        const r = await jeu.choisir(jeu.tx('phenixMain'), [jeu.t('oui'), jeu.t('non')]);
        if (r !== 0) { await jeu.dire(jeu.tx('phenixNon')); jeu.cadrer(null); return; }
        jeu.geste('offrir');
        await jeu.attendre(700);
        source.envoler();
        jeu.son('magie');
        await jeu.attendre(1500);
        source.plume();
        jeu.cadrer({ de: [SOURCE.x + 0.5, SOURCE.eau + 1.5, SOURCE.z + 2.4], vers: [SOURCE.x, SOURCE.eau + 0.8, SOURCE.z - 0.1], champ: 46 });
        jeu.geste(null);
        await jeu.attendre(2000);
        await jeu.dire(jeu.tx('phenixEnvol'));
        source.cacherPlume();
        jeu.cadrer(null);
        await jeu.trouverSecret('phenix');
      },
    },
    { id: 'gankasui', x: GANKASUI.x + 0.4, z: GANKASUI.z + 2.6, rayon: 1.9, haut: 1.0, verbe: 'regarder', action: (jeu) => jeu.dire(jeu.tx('gankasui')) },
    { id: 'kokei', x: KOKEI.x, z: KOKEI.z, rayon: 1.8, haut: 1.2, verbe: 'regarder', action: (jeu) => jeu.dire(jeu.tx('kokei')) },
    {
      // la cascade de la Porte du Dragon (le tampon) : sa légende ; la carpe du bassin saute vers la chute
      id: 'ryumon', x: 16.6, z: -43.4, rayon: 2.2, haut: 1.6, verbe: 'regarder',
      async action(jeu) {
        jeu.cadrer({ de: [17.2, 1.9, -42.2], vers: [RYUMON.x, 1.5, RYUMON.z], champ: 52 });
        await jeu.attendre(700);
        await jeu.dire(jeu.tx('ryumon'));
        if (!jeu.estNuit) {
          carpeDragon.sauter();
          jeu.son('plouf');
          await jeu.attendre(1700);
          await jeu.dire(jeu.tx('ryumonSaut'));
        }
        jeu.cadrer(null);
        if (!jeu.aTampon('ryumon')) { await jeu.tampon('ryumon'); await comp(jeu, 'ryumonCompagnon'); }
      },
    },
    {
      // les statues : lancer une pièce dans le bol de pierre (le tampon)
      id: 'zeni', x: JIZO.x - 1.2, z: JIZO.z - 2.2, rayon: 2.4, haut: 1.4, verbe: 'lancer',
      async action(jeu) {
        const r = await jeu.choisir(jeu.tx(jeu.aTampon('zeni') ? 'zeniEncore' : 'zeni'), [jeu.t('oui'), jeu.t('non')]);
        if (r !== 0) return;
        const de = [23.4, -45.2];
        jeu.placer(de[0], de[1], Math.atan2(BOL.x - de[0], BOL.z - de[1]));
        // (la caméra haut derrière l'épaule : le cercle doré va et vient de gauche à droite sur l'écran, le bol au milieu,
        // au-dessus du chapeau ; de côté, il passait derrière le bol et la petite pagode)
        const vx = BOL.x - de[0], vz = BOL.z - de[1], vl = Math.hypot(vx, vz), px = vz / vl, pz = -vx / vl;
        jeu.cadrer({ de: [de[0] - (vx / vl) * 1.6 + px * 0.8, terrain(...de) + 3.4, de[1] - (vz / vl) * 1.6 + pz * 0.8], vers: [BOL.x, terrain(BOL.x, BOL.z) + 0.1, BOL.z], champ: 46 });
        lancer.jouer(true, de);
        let reste = 3, dedans = false;
        jeu.aide(jeu.tx('zeniAide')(reste));
        await new Promise((fini) => {
          let enVol = false;
          jeu.capterAppuis(async () => {
            if (enVol || reste <= 0) return;
            enVol = true;
            reste--;
            jeu.geste('offrir');
            jeu.son('piece');
            const ok = await lancer.lancer([de[0], terrain(...de) + 1.1, de[1]]);
            jeu.son(ok ? 'bol' : 'tombe');
            jeu.geste(null);
            enVol = false;
            if (ok) { dedans = true; jeu.capterAppuis(null); fini(); return; }
            jeu.aide(reste > 0 ? jeu.tx('zeniRate')(reste) : jeu.tx('zeniAide')(0));
            if (reste <= 0) { jeu.capterAppuis(null); fini(); }
          });
        });
        lancer.jouer(false);
        jeu.aide(null);
        jeu.cadrer(null);
        if (!dedans) { await jeu.dire(jeu.tx('zeniPerdu')); return; }
        await jeu.dire(jeu.tx('zeniGagne'));
        if (!jeu.aTampon('zeni')) { await jeu.tampon('zeni'); await comp(jeu, 'zeniCompagnon'); }
      },
    },
    { id: 'anmintaku', x: 13.0, z: -65.0, rayon: 2.4, haut: 1.4, verbe: 'regarder', action: (jeu) => jeu.dire(jeu.tx('anmintaku')) },
    {
      // le belvédère au-dessus du pavillon : son toit et son phénix, par-dessus les jeunes pins
      id: 'vueHaut', x: -2.2, z: -60.6, rayon: 2.2, haut: 1.4, verbe: 'regarder',
      async action(jeu) {
        jeu.cadrer({ de: [-2.4, hauteurAllee(-2.4, -60) + 1.9, -59.4], vers: [0, 10.5, 0], champ: 26 });
        await jeu.attendre(800);
        await jeu.dire(jeu.txn('vueHaut'));
        jeu.cadrer(null);
      },
    },
    { id: 'sekkatei', x: 38.4, z: -69.2, rayon: 2.0, haut: 1.6, verbe: 'regarder', action: (jeu) => jeu.dire(jeu.tx('sekkatei')) },
    {
      // le maître de thé du pavillon du soir : il fait venir le soir (la nuit) ; la nuit, il rend le matin
      id: 'chajin', passant: 'chajin', verbe: 'parler',
      async action(jeu) {
        if (!jeu.estNuit) {
          const r = await jeu.choisir(jeu.tx('chajinJour'), [jeu.t('oui'), jeu.t('non')], 'chajin');
          if (r !== 0) { await jeu.dire(jeu.tx('chajinNon'), 'chajin'); return; }
          await jeu.nuit(true);
          await jeu.dire(jeu.tx('chajinSoir'), 'chajin');
          return;
        }
        const r = await jeu.choisir(jeu.tx('chajinNuit'), [jeu.t('oui'), jeu.t('non')], 'chajin');
        if (r !== 0) { await jeu.dire(jeu.tx('chajinReste'), 'chajin'); return; }
        await jeu.nuit(false);
        await jeu.dire(jeu.tx('chajinMatin'), 'chajin');
      },
    },
    {
      // le salon de thé : un matcha et son gâteau à la feuille d'or, assis sur un banc rouge (le tampon) ; fermé la nuit
      id: 'chaya', passant: 'chaya', verbe: 'parler',
      async action(jeu) {
        if (jeu.estNuit) { await jeu.dire(jeu.tx('chayaNuit'), 'chaya'); return; }
        const r = await jeu.choisir(jeu.tx(jeu.aTampon('matcha') ? 'chayaEncore' : 'chaya'), [jeu.t('oui'), jeu.t('non')], 'chaya');
        if (r !== 0) { await jeu.dire(jeu.tx('chayaNon'), 'chaya'); return; }
        const b = bancs[0], mx = (b.de[0] + b.a[0]) / 2, mz = (b.de[1] + b.a[1]) / 2, dx = b.a[0] - b.de[0], dz = b.a[1] - b.de[1], l = Math.hypot(dx, dz);
        jeu.asseoir({ x: mx - (dx / l) * 0.3, z: mz - (dz / l) * 0.3, y: b.y, cap: b.cap }, { lacet: b.cap + PI + 0.5, tangage: 0.25, distance: 3.6 });
        await jeu.attendre(600);
        plateau.poser(mx + (dx / l) * 0.35, b.y - 0.03, mz + (dz / l) * 0.35, b.cap);
        jeu.son('chasen');
        await jeu.dire(jeu.tx('matcha'));
        plateau.ranger();
        jeu.asseoir(null);
        if (!jeu.aTampon('matcha')) { await jeu.tampon('matcha'); await comp(jeu, 'matchaCompagnon'); }
      },
    },
    {
      // le bureau des goshuin : le moine écrit au pinceau le nom du pavillon, puis pose les sceaux rouges (le tampon)
      id: 'shuin', passant: 'shuin', verbe: 'parler',
      async action(jeu) {
        if (jeu.estNuit) { await jeu.dire(jeu.tx('shuinNuit'), 'shuin'); return; }
        const r = await jeu.choisir(jeu.tx(jeu.aTampon('goshuin') ? 'shuinEncore' : 'shuin'), [jeu.t('oui'), jeu.t('non')], 'shuin');
        if (r !== 0) { await jeu.dire(jeu.tx('shuinNon'), 'shuin'); return; }
        jeu.image(goshuin(), 'goshuin');
        jeu.son('pinceau');
        await jeu.attendre(4200);
        jeu.son('tampon');
        await jeu.attendre(900);
        await jeu.dire(jeu.tx('goshuin'), 'shuin');
        jeu.image(null);
        if (!jeu.aTampon('goshuin')) { await jeu.tampon('goshuin'); await comp(jeu, 'goshuinCompagnon'); }
      },
    },
    {
      // le guichet : le billet, un porte-bonheur de papier ; fermé la nuit
      id: 'billet', passant: 'billet', verbe: 'parler',
      async action(jeu) {
        await jeu.dire(jeu.tx('billet'), 'billet');
        jeu.image(billetSVG(), 'billet');
        await jeu.dire(jeu.tx('billetLu'));
        jeu.image(null);
      },
    },
    {
      // la salle de Fudō : frapper le gong (les deux cordes), prier
      id: 'fudo', x: FUDO.x, z: FUDO.z + 5.0, rayon: 1.8, haut: 2.0, verbe: 'prier',
      async action(jeu) { jeu.geste('prier'); jeu.son('waniguchi'); await jeu.attendre(3800); jeu.geste(null); await jeu.dire(jeu.txn('fudo')); },
    },
    { id: 'bougie', x: FUDO.x + 3.6, z: FUDO.z + 5.6, rayon: 1.6, haut: 1.4, verbe: 'poser', action: (jeu) => jeu.dire(jeu.tx('bougie')) },
    {
      id: 'omikuji', x: FUDO.x - 3.6, z: FUDO.z + 5.4, rayon: 1.6, haut: 1.5, verbe: 'tirer',
      async action(jeu) {
        const sorts = jeu.tx('omikujiSorts'), k = Math.floor(Math.random() * sorts.length);
        jeu.son('papier');
        await jeu.dire([jeu.tx('omikuji'), sorts[k]]);
      },
    },
    { id: 'cloche', x: SHORO.x, z: SHORO.z - 4.2, rayon: 2.0, haut: 2.6, verbe: 'regarder', action: (jeu) => jeu.dire(jeu.tx('cloche')) },
    {
      // (de l'allée, au bout de la pelouse : le portail du hōjō et son toit en arc)
      id: 'karamon', x: KARAMON.x, z: 57.6, rayon: 2.2, haut: 1.6, verbe: 'regarder',
      async action(jeu) {
        const y = terrain(KARAMON.x, KARAMON.z);
        jeu.cadrer({ de: [KARAMON.x + 1.2, y + 1.9, 56.4], vers: [KARAMON.x, y + 2.3, KARAMON.z], champ: 34 });
        await jeu.attendre(600);
        await jeu.dire(jeu.tx('karamon'));
        jeu.cadrer(null);
      },
    },
    { id: 'ichiigashi', x: ICHIIGASHI.x + 0.4, z: ICHIIGASHI.z - 4.4, rayon: 2.2, haut: 2.2, verbe: 'regarder', action: (jeu) => jeu.dire(jeu.tx('ichiigashi')) },
    { id: 'hakuja', x: 10.2, z: -65.4, rayon: 2.0, haut: 1.2, verbe: 'regarder', action: (jeu) => jeu.dire(jeu.tx('hakuja')) },
    { id: 'koi', x: 26.0, z: 49.6, rayon: 2.6, haut: 0.8, verbe: 'regarder', action: (jeu) => jeu.dire(jeu.txn('koi')) },
    // le vidéaste : la vidéo TikTok du lieu
    { id: 'videaste', passant: 'videaste', verbe: 'parler', async action(jeu) { await jeu.dire(jeu.tx('videaste'), 'videaste'); await jeu.video(); } },
    parler('gardien'), parler('photographe'), parler('guide'), parler('eleve'), parler('eleve2'), parler('kimono'), parler('jardinier'), parler('moine'),
    parler('obaa'), parler('touriste'), parler('grandpere'), parler('enfant'),
    ...Object.entries(PANNEAUX).map(([id, p]) => ({ id: `panneau-${id}`, x: p.x - Math.sin(p.ry) * 1.2, z: p.z - Math.cos(p.ry) * 1.2, rayon: 1.8, verbe: 'lire', action: (jeu) => jeu.dire(jeu.tx(`panneau-${id}`)) })),
    ...interactionsBancs(bancs),
  ];
  const actionBete = async (jeu, b) => { await jeu.dire(jeu.txn(b.sorte)); };
  const GOSHUIN_DATE = dateJaponaise(new Date());
  /** Le goshuin (御朱印) : la feuille, l'écriture au pinceau qui apparaît de haut en bas, puis les sceaux rouges. */
  function goshuin() { return goshuinSVG(GOSHUIN_DATE); }
  return {
    ...infos, textes: TEXTES,
    objets, monde, terrain, etiquettes, passants, daims: [], interactions, actionDaim: null, vapeurs, bancs, lumieres, actionBete, animes, courants, cascades, eauxCalmes,
    // le vrai reflet de l'étang-miroir (balade.js, creerMiroir)
    miroir: { y: EAU, x0: -53, x1: 43, z0: -19, z1: 61 },
    eauCalme: { clair: '#55673e', profond: '#2c3a25', clarte: 0.36, teinteReflet: '#eef2e0', refletMin: 0.5 },
    // (le secret, tresors.js ; le marchand, sous les érables entre le pavillon du thé et le salon ; les sons à fabriquer en plus ;
    // les feux d'artifice, au-dessus de la forêt derrière le pavillon : du belvédère, on les voit aussi dans l'étang)
    secret: 'phenix', marchand: MARCHAND, sons: ['cloche', 'claque', 'papier', 'plouf', 'piece', 'bol', 'tombe', 'chasen', 'pinceau', 'tampon', 'waniguchi'],
    feux: { x: -26, y: 0, z: -112, large: 50, haut: [42, 62] },
    // les bêtes (betes.js) : un héron cendré sur les îles, des libellules, des papillons, un milan au-dessus de l'étang ; les
    // grenouilles de l'étang, la nuit ; le ruisseau de la cascade
    betes: {
      herons: [[[-12.4, 28.2], [9.4, 33.6], [-33.0, 7.6]]],
      libellules: [[30, 47], [-4, -21], [40, 20], [14, -64]], papillons: [[44, 30], [20, -46], [50, -66], [86, 30]],
      milans: [{ x: 0, z: 22, r: 32, h: 52, sens: 1 }],
    },
    mares: [[20, 40], [-30, 20], [-20, -10], [12, -72]], ruisseaux: [RUISSEAU.map(([x, z]) => [x, z])],
    rais: [[MARCHAND.x + 0.6, MARCHAND.z + 0.4], [16, -76], [-22, -33]].map(([x, z], i) => ({ x, z, haut: 9, r0: 0.35, r1: 1.2 + 0.3 * (i % 2), force: 0.07 })),
    aspectSol: (x, z, h) => aspectSol(P, x, z, h),
    // (le sol en cases de 25 cm autour du bassin creusé de la source)
    // (le sol en cases de 25 cm : la source, et le long des escaliers, où la pente casse net en haut et en bas : en cases d'un
    // mètre, le sol dessiné passait sous les pieds)
    // (et le lit du ruisseau, la terrasse du sanctuaire Shin'un et son muret : 2026-10-27)
    solDetaille: (x0, z0, x1, z1) => {
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      return (Math.abs(cx - GINGASEN.x) < 2.2 && Math.abs(cz - GINGASEN.z) < 2) || MARCHES.some((es) => surLaLigne(es.ligne, cx, cz).d < es.demi + 3)
        || surLaLigne(RUISSEAU, cx, cz).d < 2.4 || Math.hypot(cx - SHINUN.x, cz - SHINUN.z) < 3.6;
    },
    etendue: { x0: -720, x1: 720, z0: -720, z1: 720, pas: 4, fin: { x0: -64, x1: 108, z0: -96, z1: 76, pas: 1 } },
    eau: null,
    vent: { dir: [0.4, 0.9], force: 0.5 }, oiseaux: ['milan', 'uguisu'], ambiances: ['semi', 'insectes', 'grenouilles', 'ruisseau'],
    brume: [160, 1600],
    soleil: [0.5, 0.74, 0.46],
    depart: { x: DEPART.x, z: DEPART.z, cap: Math.atan2(-DEPART.x, -DEPART.z) },
    photos: {
      heros: { x: DEPART.x, z: DEPART.z, cap: Math.atan2(-DEPART.x, -DEPART.z), lacet: Math.atan2(-DEPART.x, -DEPART.z) + PI + 0.15, tangage: 0.12, distance: 6.5 },
      perso: { x: 12, z: -4, cap: -PI / 2, lacet: -PI / 2 + 0.3, tangage: 0.1, distance: 4 },
    },
  };
}

// ---------------------------------------------------------------- Le goshuin, le billet
// les titres des panneaux (en japonais, peints sur le papier)
const TITRES_PANNEAUX = { kinkaku: '金閣（舎利殿）', ryumon: '龍門滝', anmintaku: '安民沢', sekkatei: '夕佳亭', fudo: '不動堂', rikushu: '陸舟の松', jardin: '鹿苑寺 境内' };
const CHIFFRES = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
/** Un nombre en chiffres japonais (jusqu'à 99) : 26 → 二十六. */
const kanji = (n) => (n < 10 ? CHIFFRES[n] : `${n >= 20 ? CHIFFRES[Math.floor(n / 10)] : ''}十${n % 10 ? CHIFFRES[n % 10] : ''}`);
/** La date du jour à la japonaise (l'ère Reiwa a commencé en 2019) : 令和八年 十月 二十六日. */
function dateJaponaise(d) { return [`令和${kanji(d.getFullYear() - 2018)}年`, `${kanji(d.getMonth() + 1)}月`, `${kanji(d.getDate())}日`]; }
// (la police au pinceau, chargée la première fois, seulement pour ces caractères : Google Fonts, text=)
let pinceauCharge = false;
function chargerPinceau() {
  if (pinceauCharge || typeof document === 'undefined') return;
  pinceauCharge = true;
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = `https://fonts.googleapis.com/css2?family=Yuji+Syuku&text=${encodeURIComponent('舎利殿奉拝鹿苑寺金閣令和一二三四五六七八九十年月日〇鏡湖池御守護開運招福家内安全舎利殿')}&display=swap`;
  document.head.appendChild(l);
}
const PINCEAU = "'Yuji Syuku', 'Yu Mincho', 'Hiragino Mincho ProN', 'Noto Serif JP', serif";
/**
 * Le goshuin du Pavillon d'or (d'après celui du TikTok) : en haut à droite « 奉拝 » (avec respect) et le sceau rouge vertical ;
 * au milieu, en grand, « 舎利殿 » (le pavillon des reliques), sur le grand sceau carré du temple ; à gauche « 鹿苑寺 » et son
 * petit sceau ; en bas à droite, la date. L'encre apparaît de haut en bas, comme écrite au pinceau ; les sceaux se posent ensuite.
 */
function goshuinSVG(date) {
  chargerPinceau();
  const v = (texte, x, y, taille, o = '') => `<text x="${x}" y="${y}" font-size="${taille}" writing-mode="tb" glyph-orientation-vertical="0" font-family="${PINCEAU}" fill="#1c1714" ${o}>${texte}</text>`;
  return `<svg viewBox="0 0 300 420" width="300" height="420" style="max-width:78vw;max-height:70vh;background:#fbf8f0;border-radius:4px" aria-hidden="true">
    <defs><clipPath id="encre-g"><rect x="0" y="0" width="300" height="0"><animate attributeName="height" from="0" to="420" begin="0.2s" dur="3.6s" fill="freeze"/></rect></clipPath></defs>
    <g opacity="0" style="mix-blend-mode:multiply">
      <animate attributeName="opacity" from="0" to="0.88" begin="4.1s" dur="0.15s" fill="freeze"/>
      <rect x="74" y="168" width="150" height="150" rx="6" fill="none" stroke="#c0392b" stroke-width="7"/>
      <rect x="86" y="180" width="126" height="126" fill="none" stroke="#c0392b" stroke-width="2.4"/>
      <text x="149" y="236" font-size="40" text-anchor="middle" font-family="${PINCEAU}" fill="#c0392b">金閣</text>
      <text x="149" y="284" font-size="30" text-anchor="middle" font-family="${PINCEAU}" fill="#c0392b">舎利殿</text>
      <rect x="236" y="96" width="30" height="96" rx="3" fill="none" stroke="#c0392b" stroke-width="2.6"/>
      ${v('鏡湖池', 251, 104, 22, 'fill="#c0392b"')}
      <ellipse cx="56" cy="92" rx="24" ry="17" fill="none" stroke="#c0392b" stroke-width="2.6"/>
      <text x="56" y="99" font-size="17" text-anchor="middle" font-family="${PINCEAU}" fill="#c0392b">鹿苑</text>
      <rect x="40" y="318" width="34" height="34" fill="none" stroke="#c0392b" stroke-width="2.6"/>
      <text x="57" y="342" font-size="20" text-anchor="middle" font-family="${PINCEAU}" fill="#c0392b">寺</text>
    </g>
    <g clip-path="url(#encre-g)">
      ${v('奉拝', 262, 30, 34)}
      ${v('舎利殿', 150, 62, 104, 'font-weight="700"')}
      ${v('鹿苑寺', 60, 130, 44)}
      ${v(date.join(''), 268, 204, 18)}
    </g>
  </svg>`;
}
/**
 * Le billet du Pavillon d'or : une bande de papier blanc, comme un talisman (お札) : « 金閣舎利殿御守護 » (la protection du
 * pavillon des reliques), et de chaque côté « 開運招福 » (chance et bonheur), « 家内安全 » (la paix du foyer), un sceau rouge.
 */
function billetSVG() {
  chargerPinceau();
  const v = (texte, x, y, taille, c = '#1c1714', o = '') => `<text x="${x}" y="${y}" font-size="${taille}" writing-mode="tb" font-family="${PINCEAU}" fill="${c}" ${o}>${texte}</text>`;
  return `<svg viewBox="0 0 160 420" width="160" height="420" style="max-height:70vh;background:#fdfbf4;border-radius:3px" aria-hidden="true">
    <rect x="8" y="8" width="144" height="404" fill="none" stroke="#c9a13b" stroke-width="2"/>
    ${v('金閣舎利殿御守護', 80, 40, 38, '#1c1714', 'font-weight="700"')}
    ${v('開運招福', 128, 120, 18)}${v('家内安全', 32, 120, 18)}
    <rect x="60" y="356" width="40" height="40" fill="none" stroke="#c0392b" stroke-width="3"/>
    <text x="80" y="383" font-size="22" text-anchor="middle" font-family="${PINCEAU}" fill="#c0392b">鹿苑</text>
  </svg>`;
}

// ---------------------------------------------------------------- Le sol
/** Le sol (sa couleur et sa matière, textures.js) en x, z, à la hauteur h. */
function aspectSol(P, x, z, h) {
  const bruit = bruitDoux(x, z, 3.5);
  // sous l'eau : la vase sombre au fond, des pierres claires près du bord
  if (h < EAU - 0.02 || (h < ANMIN.eau - 0.02 && Math.hypot((x - ANMIN.x) / ANMIN.rx, (z - ANMIN.z) / ANMIN.rz) < 1.1)) return h > EAU - 0.3 || (h > ANMIN.eau - 0.3 && h < ANMIN.eau) ? ['#6e6a58', M.roche] : [bruit > 0.5 ? '#3f4a36' : '#384230', M.terre];
  // les allées et les places : le sable damé, clair
  const c = surChemins(x, z);
  if (c.d < 0.05 + 0.25 * bruit || surPlaces(x, z) < 0.05 + 0.2 * bruit) return [bruit > 0.5 ? P.sableJardin : P.sableJardinFonce, M.terre];
  // la cour du pin en barque : du gravier blanc
  if ((Math.abs(x - RIKUSHU.x) / 7.4) ** 4 + (Math.abs(z - RIKUSHU.z) / 4.2) ** 4 < 1) return [bruit > 0.5 ? '#dedad0' : '#d4d0c4', M.sable];
  // la mousse du jardin, partout ailleurs (plus jaune au soleil, plus sombre sous les arbres) ; loin, la forêt
  if (Math.hypot(x - 20, z + 5) > 110) return [bruit > 0.6 ? '#4b6539' : '#557a3a', M.sousBois];
  return [bruit > 0.66 ? P.mousseJardinClair : bruit > 0.33 ? P.mousseJardin : P.mousseJardinFonce, M.mousse];
}

// ---------------------------------------------------------------- Les textes du lieu
const TEXTES = {
  fr: {
    noms: { gardien: 'Le gardien', photographe: 'La photographe', videaste: '@random_japan_place', guide: 'La guide', eleve: 'L’élève', eleve2: 'L’élève', kimono: 'La promeneuse en kimono', jardinier: 'Le jardinier', moine: 'Le jeune moine', billet: 'Le moine du guichet', chaya: 'La dame du salon de thé', chajin: 'Le maître de thé', shuin: 'Le moine des goshuin', obaa: 'La grand-mère', touriste: 'Le touriste', grandpere: 'Le grand-père', enfant: 'Le petit garçon' },
    tampons: { kinkaku: ['Le Pavillon d’or', 'au belvédère, de l’autre côté de l’étang, là où l’on voit le pavillon et son reflet'], ryumon: ['La porte du Dragon', 'derrière le pavillon, à la cascade de la porte du Dragon'], zeni: ['La pièce porte-bonheur', 'au pied de la colline, devant les statues de pierre et leur petit bol'], matcha: ['Le thé vert', 'au salon de thé, en haut de la colline, aux bancs rouges'], goshuin: ['Le goshuin', 'au bureau des goshuin, en haut de la colline, près de la salle de Fudō'] },
    kinkaku: ['Le Pavillon d’or… Son vrai nom : le pavillon des reliques (舎利殿) du temple Rokuon-ji.', 'Le shogun Ashikaga Yoshimitsu l’a fait bâtir en 1397 pour sa villa. Après sa mort, elle est devenue un temple zen.', 'Regarde l’étang : quand il n’y a pas de vent, il reflète le pavillon à l’envers. On l’appelle l’étang-miroir (鏡湖池), et ce reflet, le « Kinkaku à l’envers ».'],
    kinkakuNuit: ['La nuit, le pavillon dort au-dessus de l’étang noir… et son reflet brille dans l’eau, à l’envers.', '…Attends. Regarde bien le toit du reflet.', 'Le phénix d’or est sur le vrai toit… mais pas dans le reflet ! Il a disparu de l’eau !'],
    kinkakuNuitApres: ['La nuit, le pavillon et son reflet se font face. Sur les deux toits, le phénix veille.'],
    kinkakuCompagnon: { kon: ['« Que c’est beau… Deux pavillons d’or, un dans le ciel, un dans l’eau. »'], pon: ['« Pon ! Tout en or ! On en ferait combien de koban, à ton avis ? »'], chapu: ['« Chapu ! L’eau est toute dorée ! Je peux plonger dans le reflet ? »'], gao: ['« Gao ! Un trésor pareil, il faut le garder jour et nuit ! »'], fuwa: ['« Fuwaaa… Il brille comme ma perle, mais mille fois plus grand. »'], saya: ['« Les pins autour le regardent depuis des siècles… Ils en sont fiers. »'] },
    refletCompagnon: { kon: ['« Le phénix du reflet est parti… Un reflet ne s’en va pas sans raison. Aurait-il soif ? »'], pon: ['« Pon ?! Un reflet qui fait le mur ! Il est peut-être parti grignoter quelque chose… »'], chapu: ['« Chapu ! Un reflet qui nage tout seul ? Il est peut-être allé dans une autre eau ! »'], gao: ['« Gao ! On a volé le phénix ? Non… il est parti de lui-même. Cherchons-le ! »'], fuwa: ['« Fuwa… Je le sens : il est près d’une eau très pure, pleine d’étoiles. »'], saya: ['« Les arbres l’ont vu passer… vers les sources, derrière le pavillon. »'] },
    pavillon: ['Vu de près, le pavillon a trois étages, chacun dans un style différent.', 'En bas, le bois brut d’un palais de la cour (le style shinden). Au milieu, une maison de samouraï. En haut, une salle de temple zen, avec ses fenêtres en cloche.', 'Les deux étages du haut sont couverts de feuilles d’or : environ vingt kilos, en deux cent mille feuilles !'],
    kuzan: ['Devant le pavillon, dans l’eau : le rocher des « neuf montagnes et huit mers » (九山八海石).', 'Il représente le mont Meru, la montagne au centre du monde dans le bouddhisme. Yoshimitsu l’aurait fait venir de Chine.'],
    sosei: ['De derrière, on voit le côté nord du pavillon : ses murs de plâtre blanc entre les poteaux de bois sombre.', 'Et là, sur l’eau : le Sōsei (漱清), le petit pavillon où Yoshimitsu venait se rafraîchir au bord de l’étang.'],
    ashihara: ['La grande île, c’est Ashiharajima (葦原島), « l’île de la plaine des roseaux » : dans les mythes, c’est l’ancien nom du Japon.', 'Elle a la forme d’une barque. Les petites îles s’appellent l’île de la grue et l’île de la tortue : deux animaux qui vivent très longtemps.'],
    rikushu: ['Le pin en barque (陸舟の松) ! On dit que Yoshimitsu l’avait en bonsaï, et qu’il l’a planté ici lui-même.', 'Depuis six siècles, les jardiniers le taillent en forme de bateau, la proue vers l’ouest… vers le paradis de l’ouest.'],
    jozo: ['Tu as prié devant la tour de Jōzō, un moine qui aurait redressé la pagode penchée de Yasaka rien qu’en priant.', 'On dit qu’ici, les vœux se réalisent…'],
    shinun: ['Tu salues le petit sanctuaire Shin’un (榊雲), où l’on honore les dieux qui protègent le temple.'],
    gingasen: ['La source de la Voie lactée (銀河泉) : Yoshimitsu y faisait puiser l’eau de son thé.', 'L’eau est claire et profonde… La nuit, dit-on, les étoiles s’y reflètent comme une rivière de lumière.'],
    gingasenNuit: ['La source de la Voie lactée, sous les étoiles…', 'Dans l’eau… le reflet d’un oiseau d’or ! Un phénix, penché sur l’eau, qui boit !', 'Pourtant, au-dessus de la source… il n’y a rien. Seulement son reflet.'],
    gingasenApres: ['La source de la Voie lactée brille d’étoiles. Une petite lueur dorée flotte encore au fond de l’eau…'],
    phenixCompagnon: { kon: ['« Un phénix… On dit qu’il n’apparaît qu’aux époques de paix. Approche doucement. »'], pon: ['« Pon… Pour une fois, je n’ai même pas faim. C’est trop beau. »'], chapu: ['« Chapu… Je ne plonge pas. Promis. Je regarde juste. »'], gao: ['« Gao… Je monte la garde. Personne ne le dérangera. »'], fuwa: ['« Un oiseau du ciel qui boit l’eau des étoiles… Fuwa, comme dans les contes. »'], saya: ['« L’eau de cette source est très ancienne… Elle se souvient de Yoshimitsu. »'] },
    phenixMain: ['Le reflet du phénix lève la tête… et te regarde.', 'Tendre la main vers l’eau ?'],
    phenixNon: ['Le phénix replonge son bec dans l’eau des étoiles…'],
    phenixEnvol: ['Le phénix déploie ses ailes… et s’envole dans le reflet, vers le toit du pavillon !', 'Une plume d’or remonte de l’eau et se pose dans ta main.', 'Au fond de la source, quelque chose brille…'],
    gankasui: ['Le rocher de la source des mains (巌下水) : Yoshimitsu s’y lavait les mains avant la cérémonie du thé.', 'L’eau suinte encore du rocher, goutte à goutte.'],
    kokei: ['Le petit pont du Ravin du Tigre (虎渓橋). Son nom vient d’un vieux conte chinois : trois amis riaient si fort en se raccompagnant qu’ils passèrent le pont sans s’en apercevoir.', 'Les haies basses de bambou s’appellent « haies du Pavillon d’or » (金閣寺垣) : elles ont été inventées ici !'],
    ryumon: ['La cascade de la porte du Dragon (龍門滝) : deux mètres trente de haut.', 'La pierre penchée au pied de la chute, c’est la pierre-carpe (鯉魚石).', 'Une légende chinoise dit que la carpe qui réussit à remonter la cascade de la porte du Dragon devient un dragon. Au Japon, la carpe est le symbole du courage.'],
    ryumonSaut: ['Oh ! La carpe du bassin a sauté vers la cascade !', '…Pas encore cette fois. Mais un jour, peut-être, elle deviendra dragon.'],
    ryumonCompagnon: { kon: ['« Remonter une cascade pour devenir dragon… Il faut du courage. Comme toi, pour trouver tous ces tampons ! »'], pon: ['« Pon ! Moi, je préfère les escaliers. Ou qu’on me porte. »'], chapu: ['« Chapu ! Je pourrais la remonter, moi, cette cascade ! …Peut-être. »'], gao: ['« Gao ! La carpe n’abandonne jamais. Respect ! »'], fuwa: ['« Fuwa ! Je suis un dragon de la mer… Je n’ai jamais été une carpe, je crois ? »'], saya: ['« La mousse de la pierre-carpe a des centaines d’années… Elle en a vu, des carpes essayer. »'] },
    zeni: ['Devant les statues de pierre, un petit bol. Si ta pièce tombe dedans, ton vœu se réalisera, dit-on.', 'Tu lances une pièce ? (trois essais)'],
    zeniEncore: ['Encore une pièce pour la chance ? (trois essais)'],
    zeniAide: (n) => `A (ou un appui sur l’écran) quand le cercle doré passe sur le bol ! Encore ${n} pièce${n > 1 ? 's' : ''}`,
    zeniRate: (n) => `À côté… Attends que le cercle soit sur le bol. Encore ${n} pièce${n > 1 ? 's' : ''}`,
    zeniGagne: ['Tiiing ! La pièce est tombée pile dans le bol !', 'Ton vœu se réalisera, c’est sûr !'],
    zeniPerdu: ['Pas de chance… Les pièces ont roulé à côté du bol.', 'Tu peux réessayer quand tu veux !'],
    zeniCompagnon: { kon: ['« Dans le bol ! Les dieux ont entendu ton vœu. »'], pon: ['« Pon pon ! Tu peux faire un vœu pour moi aussi ? Des gâteaux. Beaucoup. »'], chapu: ['« Chapu ! Plouf dans le bol ! »'], gao: ['« Gao ! Un tir parfait ! »'], fuwa: ['« Fuwaaa ! Elle a brillé en tombant, comme une étoile filante ! »'], saya: ['« Les statues sourient… Elles sont contentes. »'] },
    anmintaku: ['L’étang Anmintaku (安民沢), dans la forêt. On dit qu’il ne s’assèche jamais : on venait y prier pour la pluie.', 'Sur son île, la petite pagode de pierre : le tertre du serpent blanc (白蛇の塚).'],
    hakuja: ['Le tertre du serpent blanc (白蛇の塚) : le serpent blanc est le messager de la déesse de l’eau.', 'Les gens lancent des pièces vers la petite pagode, pour la chance.'],
    vueHaut: ['D’ici, on voit le haut du pavillon par-dessus les jeunes pins : le dernier étage doré, le toit en pyramide… et le phénix d’or.', 'On dit que le phénix est l’oiseau des temps de paix. Il regarde vers le sud.'],
    vueHautNuit: ['La nuit, d’ici, le pavillon luit doucement au-dessus des pins noirs.'],
    sekkatei: ['Le Sekka-tei (夕佳亭), « le pavillon où le soir est beau » : un pavillon de thé construit pour l’empereur Go-Mizunoo.', 'Son nom vient du Pavillon d’or, qu’on voit d’ici briller au soleil couchant. Son pilier est taillé dans un tronc de nandina !'],
    chajinJour: ['Bienvenue au Sekka-tei. D’ici, au soleil couchant, le Pavillon d’or brille comme une lanterne.', 'Voulez-vous attendre le soir avec moi ?'],
    chajinNon: ['Prenez votre temps. Le soir viendra bien assez tôt.'],
    chajinSoir: ['…Voilà le soir. Le pavillon a brillé de tous ses feux, puis la nuit est tombée.', 'La nuit, le jardin est plein de mystères. Regardez bien l’eau…'],
    chajinNuit: ['Une belle nuit… Voulez-vous que le matin revienne ?'],
    chajinReste: ['Restons encore un peu sous les étoiles.'],
    chajinMatin: ['Le soleil se lève sur le Pavillon d’or. Bonne promenade !'],
    chaya: ['Bienvenue au salon de thé ! Un thé matcha, avec un petit gâteau à la feuille d’or ?'],
    chayaEncore: ['Encore un matcha ? Il y a toujours de la place sur les bancs rouges !'],
    chayaNon: ['Revenez quand vous voulez !'],
    chayaNuit: ['Le salon de thé est fermé. Revenez demain !'],
    matcha: ['La dame t’apporte un bol de thé vert mousseux et un petit gâteau. Il y a une vraie feuille d’or dessus !', 'Le thé est un peu amer… et le gâteau tout doux. Délicieux, assis sur le feutre rouge, sous l’ombrelle.'],
    matchaCompagnon: { kon: ['« Un thé délicat… Merci pour la petite part de gâteau. »'], pon: ['« Pon ! La feuille d’or, ça se mange ?! Je la veux ! »'], chapu: ['« C’est vert comme l’eau d’une rivière… mais en plus chaud ! »'], gao: ['« Gao… Amer ! Mais le gâteau est bon. »'], fuwa: ['« Fuwa… Une bulle de thé m’a chatouillé le nez. »'], saya: ['« Ces feuilles de thé ont poussé au soleil, comme moi. Merci, petites feuilles. »'] },
    shuin: ['Bonjour. Voulez-vous le goshuin du temple ? Je l’écris au pinceau, et j’y pose les sceaux.'],
    shuinEncore: ['Encore un goshuin ? Avec plaisir.'],
    shuinNon: ['Comme vous voulez. Bonne visite !'],
    shuinNuit: ['Le bureau des goshuin est fermé. Revenez demain matin.'],
    goshuin: ['« Hōhai » (奉拝), avec respect… Puis le nom du pavillon, « Shariden » (舎利殿), et celui du temple, Rokuon-ji.', 'Voilà votre goshuin. Prenez-en soin : c’est la preuve de votre visite, comme un tampon de pèlerin.'],
    goshuinCompagnon: { kon: ['« Quelle belle écriture… Le pinceau danse comme un renard dans la neige. »'], pon: ['« Pon ! Les sceaux rouges, on dirait des gâteaux à la fraise ! »'], chapu: ['« Chapu ! L’encre est encore mouillée… ne mets pas ta patte dessus ! »'], gao: ['« Gao ! Un sceau de gardien, ça me plaît. »'], fuwa: ['« Fuwa… Les caractères ressemblent à de petits dragons qui volent. »'], saya: ['« Le papier vient des arbres… Il garde bien les souvenirs. »'] },
    billet: ['Bienvenue au temple Rokuon-ji. Voici votre billet.', 'Ici, le billet n’est pas un simple ticket : c’est un porte-bonheur de papier !'],
    billetLu: ['« Kinkaku Shariden go-shugo » : la protection du Pavillon d’or. Et sur les côtés : chance et bonheur, et la paix de la maison.', 'Garde-le précieusement !'],
    fudo: ['Tu tires la grosse corde : le gong de bronze sonne, « garan, garan ».', 'Dedans, dans l’ombre, il y a un Fudō de pierre, le gardien au visage sévère. On dit que le grand moine Kūkai l’a sculpté.', 'On ne le montre que deux jours par an !'],
    fudoNuit: ['Le gong résonne dans la nuit. Les lanternes rouges veillent devant la salle de Fudō.'],
    bougie: ['Des bougies blanches brûlent devant la salle. Chacune porte un vœu.'],
    omikuji: 'Tu tires un oracle de papier…',
    omikujiSorts: ['大吉 Grande chance ! Ce que tu cherches est tout près.', '吉 Chance ! Un beau voyage t’attend.', '中吉 Bonne chance ! Sois patient, comme le pin en barque.', '小吉 Petite chance. Bois un bon thé, tout ira mieux.', '末吉 La chance viendra plus tard… comme le soir au Sekka-tei.'],
    cloche: ['La cloche du temple, de l’époque de Kamakura, dit-on. Sa note est un « la », celle qui sert de référence à l’ancienne musique japonaise.', 'On ne la sonne pas pour s’amuser : seulement pour les cérémonies.'],
    karamon: ['Le portail chinois (唐門) du hōjō, au toit en arc. Il reste fermé : on ne l’ouvre que pour les grandes occasions.'],
    ichiigashi: ['Ce grand chêne toujours vert (櫟樫) a environ trois siècles et demi. C’est un monument naturel de la ville de Kyoto.'],
    koi: ['Des carpes nagent dans l’étang-miroir : rouges, blanches, dorées…', 'Quand elles passent sous le reflet, on dirait qu’elles nagent dans le pavillon !'],
    koiNuit: ['La nuit, les carpes dorment au fond de l’étang. On devine juste leurs taches blanches.'],
    videaste: ['Salut ! Moi, c’est @random_japan_place. Je filme le Pavillon d’or pour mon TikTok.', 'Tu veux voir ma vidéo ?'],
    gardien: ['Avancez, s’il vous plaît, ne restez pas trop longtemps ! Il y a beaucoup de monde ici.', '…Bon, prenez quand même votre photo. C’est le plus bel endroit pour le pavillon et son reflet.'],
    gardienNuit: ['Ce soir, l’étang est un miroir parfait…', 'Hein ? Sur le toit du reflet… il manque quelque chose, non ? J’ai dû trop travailler.'],
    photographe: ['J’attends qu’il n’y ait plus un souffle de vent : là, le reflet sera parfait.', 'Les photographes l’appellent le « Kinkaku à l’envers » (逆さ金閣).'],
    photographeNuit: ['La nuit, avec la lune, l’or devient tout doux…'],
    guide: ['Par ici, tout le monde ! Le Pavillon d’or a été construit en 1397 par le shogun Yoshimitsu.', 'En 1950, un jeune moine y a mis le feu, et il a entièrement brûlé. On l’a reconstruit à l’identique en 1955.', 'En 1987, on l’a recouvert d’or neuf : vingt kilos de feuilles d’or !'],
    guideNuit: ['La visite est finie pour aujourd’hui… mais le jardin est si beau la nuit !'],
    eleve: ['On est en voyage scolaire à Kyoto ! Hier, on a vu les mille torii du Fushimi Inari.', 'Le Pavillon d’or, c’est encore plus brillant que la photo du manuel !'],
    eleveNuit: ['On aurait dû rentrer à l’hôtel… Chut, ne le dis pas à la prof !'],
    eleve2: ['J’ai acheté un porte-bonheur pour réussir mes examens.', 'Tu crois que si je lance une pièce dans le bol des statues, ça marche aussi ?'],
    eleve2Nuit: ['Il fait noir… mais les étoiles sont belles au-dessus de l’étang.'],
    kimono: ['J’ai loué un kimono pour la journée ! À Kyoto, tout le monde le fait.', 'Avec le pavillon derrière moi, mes photos vont être magnifiques !'],
    jardinier: ['Je taille les pins du jardin aiguille par aiguille. Il faut des années pour leur donner leur forme de nuage.', 'Mon grand-père était jardinier ici, lui aussi. Il disait que le phénix du toit a soif, les nuits claires…', '…et qu’il descend boire à la source du thé de Yoshimitsu, derrière le pavillon. Une histoire de vieux, sûrement !'],
    jardinierNuit: ['La nuit, je range mes ciseaux… Le phénix a peut-être soif, ce soir ? Hé hé.'],
    moine: ['Je balaie l’allée chaque matin. Au temple zen, balayer, c’est aussi méditer.', 'Derrière le pavillon, il y a deux sources : celle du thé de Yoshimitsu, et celle où il se lavait les mains.'],
    moineNuit: ['La nuit, j’entends parfois un battement d’ailes du côté de la source de la Voie lactée…', 'Sans doute un héron. Ou alors…'],
    obaa: ['Je viens prier Fudō-sama chaque mois. C’est le protecteur qui chasse le mal.', 'Tire la grosse corde et fais sonner le gong : il t’entendra !'],
    obaaNuit: ['Les lanternes rouges éclairent la salle… Fudō-sama veille, même la nuit.'],
    touriste: ['Wow, it’s really all gold! …Pardon : je suis venu d’Australie exprès pour voir ça !', 'Attends, je prends un selfie avec le pavillon… Encore un !'],
    grandpere: ['Assieds-toi un peu, jeune voyageur. Le matcha d’ici est le meilleur de Kyoto.', 'Quand j’étais petit, on disait que les carpes de la cascade devenaient des dragons. Je l’ai cru longtemps !'],
    grandpereNuit: ['Le salon est fermé, mais j’aime rester ici le soir, à écouter les grenouilles.'],
    enfant: ['J’ai lancé dix pièces, et pas une dans le bol ! C’est trop dur !', 'Toi, essaie : il faut lancer quand le cercle doré est dessus !'],
    heron: ['Un héron cendré, immobile sur la rive de l’île… Il guette les petits poissons.'],
    libellule: ['Une libellule rouge (akatombo) se repose. Au Japon, elle annonce la fin de l’été.'],
    'panneau-kinkaku': ['« Le Pavillon d’or 金閣（舎利殿）»', 'Bâti en 1397 par le shogun Ashikaga Yoshimitsu. Trois étages : le style des palais, celui des maisons de samouraï, celui des temples zen.', 'Brûlé en 1950, reconstruit en 1955. Patrimoine mondial de l’UNESCO.'],
    'panneau-ryumon': ['« La cascade de la porte du Dragon 龍門滝 »', 'Hauteur : 2,3 m. La pierre-carpe (鯉魚石), au pied de la chute, représente une carpe qui remonte la cascade pour devenir dragon.'],
    'panneau-anmintaku': ['« Anmintaku 安民沢 »', 'Un étang qui ne s’assèche jamais ; on y priait pour la pluie. Sur son île, le tertre du serpent blanc (白蛇の塚), protecteur de la famille Saionji.'],
    'panneau-sekkatei': ['« Sekka-tei 夕佳亭 »', 'Pavillon de thé du maître Kanamori Sōwa, pour l’empereur Go-Mizunoo. Son nom : « le soir y est beau », quand le Pavillon d’or brille au couchant.'],
    'panneau-fudo': ['« La salle de Fudō 不動堂 »', 'La plus ancienne construction du temple. On y vénère un Fudō de pierre attribué à Kūkai, montré deux jours par an (le 3 février et le 16 août).'],
    'panneau-rikushu': ['« Le pin en barque 陸舟の松 »', 'L’un des trois grands pins de Kyoto. Planté par Yoshimitsu, taillé en forme de barque, la proue vers l’ouest.'],
    'panneau-jardin': ['« Rokuon-ji 鹿苑寺 »', 'Temple zen de l’école Rinzai (branche du Shōkoku-ji). Le jardin de promenade autour de l’étang-miroir est un site historique et un paysage exceptionnels du Japon.'],
  },
  en: {
    noms: { gardien: 'The guard', photographe: 'The photographer', videaste: '@random_japan_place', guide: 'The guide', eleve: 'The student', eleve2: 'The student', kimono: 'The girl in a kimono', jardinier: 'The gardener', moine: 'The young monk', billet: 'The ticket monk', chaya: 'The tea lady', chajin: 'The tea master', shuin: 'The goshuin monk', obaa: 'The grandmother', touriste: 'The tourist', grandpere: 'The grandfather', enfant: 'The little boy' },
    tampons: { kinkaku: ['The Golden Pavilion', 'at the viewpoint across the pond, where you see the pavilion and its reflection'], ryumon: ['The Dragon Gate', 'behind the pavilion, at the Dragon Gate waterfall'], zeni: ['The lucky coin', 'at the foot of the hill, in front of the stone statues and their little bowl'], matcha: ['Green tea', 'at the tea stall up the hill, by the red benches'], goshuin: ['The goshuin', 'at the goshuin office up the hill, near the Fudō hall'] },
    kinkaku: ['The Golden Pavilion… Its real name: the relic hall (舎利殿) of Rokuon-ji temple.', 'Shogun Ashikaga Yoshimitsu built it in 1397 for his villa. After his death, it became a Zen temple.', 'Look at the pond: when there is no wind, it reflects the pavilion upside down. It’s called the Mirror Pond (鏡湖池), and the reflection, the “upside-down Kinkaku”.'],
    kinkakuNuit: ['At night, the pavilion sleeps above the dark pond… and its reflection glows in the water, upside down.', '…Wait. Look closely at the roof of the reflection.', 'The golden phoenix is on the real roof… but not in the reflection! It has vanished from the water!'],
    kinkakuNuitApres: ['At night, the pavilion and its reflection face each other. On both roofs, the phoenix keeps watch.'],
    kinkakuCompagnon: { kon: ['“How beautiful… Two golden pavilions, one in the sky, one in the water.”'], pon: ['“Pon! All gold! How many koban could you make out of it, you think?”'], chapu: ['“Chapu! The water is all golden! Can I dive into the reflection?”'], gao: ['“Gao! A treasure like that must be guarded day and night!”'], fuwa: ['“Fuwaaa… It shines like my pearl, but a thousand times bigger.”'], saya: ['“The pines around it have watched it for centuries… They’re proud of it.”'] },
    refletCompagnon: { kon: ['“The phoenix of the reflection has gone… A reflection doesn’t leave without a reason. Could it be thirsty?”'], pon: ['“Pon?! A reflection that sneaks out! Maybe it went for a snack…”'], chapu: ['“Chapu! A reflection swimming off on its own? Maybe it went to another water!”'], gao: ['“Gao! Was the phoenix stolen? No… it left by itself. Let’s find it!”'], fuwa: ['“Fuwa… I can feel it: it’s near some very pure water, full of stars.”'], saya: ['“The trees saw it pass… toward the springs, behind the pavilion.”'] },
    pavillon: ['Up close, the pavilion has three floors, each in a different style.', 'At the bottom, the plain wood of a court palace (shinden style). In the middle, a samurai house. At the top, a Zen temple hall, with its bell-shaped windows.', 'The two upper floors are covered in gold leaf: about twenty kilos, in two hundred thousand leaves!'],
    kuzan: ['In front of the pavilion, in the water: the “Nine Mountains and Eight Seas” rock (九山八海石).', 'It stands for Mount Meru, the mountain at the centre of the world in Buddhism. Yoshimitsu is said to have brought it from China.'],
    sosei: ['From behind, you see the pavilion’s north side: white plaster walls between dark wooden posts.', 'And there, on the water: the Sōsei (漱清), the little pavilion where Yoshimitsu came to cool off by the pond.'],
    ashihara: ['The big island is Ashiharajima (葦原島), “the island of the reed plain”: in the myths, that’s the old name of Japan.', 'It’s shaped like a boat. The small islands are called the crane island and the turtle island: two animals that live a very long time.'],
    rikushu: ['The boat pine (陸舟の松)! They say Yoshimitsu kept it as a bonsai, and planted it here himself.', 'For six centuries, gardeners have trimmed it into the shape of a boat, its bow toward the west… toward the western paradise.'],
    jozo: ['You prayed at the Jōzō tower, for a monk said to have straightened the leaning Yasaka pagoda just by praying.', 'They say wishes come true here…'],
    shinun: ['You greet the little Shin’un shrine (榊雲), for the gods who protect the temple.'],
    gingasen: ['The Milky Way spring (銀河泉): Yoshimitsu had the water for his tea drawn here.', 'The water is clear and deep… At night, they say, the stars reflect in it like a river of light.'],
    gingasenNuit: ['The Milky Way spring, under the stars…', 'In the water… the reflection of a golden bird! A phoenix, leaning over the water, drinking!', 'And yet, above the spring… there is nothing. Only its reflection.'],
    gingasenApres: ['The Milky Way spring sparkles with stars. A little golden glow still floats at the bottom of the water…'],
    phenixCompagnon: { kon: ['“A phoenix… They say it only appears in times of peace. Approach gently.”'], pon: ['“Pon… For once, I’m not even hungry. It’s too beautiful.”'], chapu: ['“Chapu… I won’t dive. Promise. I’m just looking.”'], gao: ['“Gao… I’ll stand guard. Nobody will disturb it.”'], fuwa: ['“A bird of the sky drinking the water of the stars… Fuwa, just like in the tales.”'], saya: ['“This spring’s water is very old… It remembers Yoshimitsu.”'] },
    phenixMain: ['The phoenix’s reflection raises its head… and looks at you.', 'Reach out toward the water?'],
    phenixNon: ['The phoenix dips its beak back into the water of the stars…'],
    phenixEnvol: ['The phoenix spreads its wings… and flies off in the reflection, toward the roof of the pavilion!', 'A golden feather rises from the water and lands in your hand.', 'At the bottom of the spring, something glitters…'],
    gankasui: ['The rock of the hand-washing spring (巌下水): Yoshimitsu washed his hands here before the tea ceremony.', 'Water still seeps from the rock, drop by drop.'],
    kokei: ['The little Tiger Ravine bridge (虎渓橋). Its name comes from an old Chinese tale: three friends laughed so hard while walking each other home that they crossed the bridge without noticing.', 'The low bamboo fences are called “Kinkaku-ji fences” (金閣寺垣): they were invented here!'],
    ryumon: ['The Dragon Gate waterfall (龍門滝): two metres thirty high.', 'The leaning stone at the foot of the falls is the carp stone (鯉魚石).', 'A Chinese legend says the carp that manages to climb the Dragon Gate waterfall becomes a dragon. In Japan, the carp is the symbol of courage.'],
    ryumonSaut: ['Oh! The carp in the pool jumped toward the waterfall!', '…Not this time. But one day, maybe, it will become a dragon.'],
    ryumonCompagnon: { kon: ['“Climbing a waterfall to become a dragon… That takes courage. Like you, finding all these stamps!”'], pon: ['“Pon! I prefer stairs. Or being carried.”'], chapu: ['“Chapu! I could climb that waterfall! …Maybe.”'], gao: ['“Gao! The carp never gives up. Respect!”'], fuwa: ['“Fuwa! I’m a sea dragon… I was never a carp, I think?”'], saya: ['“The moss on the carp stone is hundreds of years old… It has seen so many carp try.”'] },
    zeni: ['In front of the stone statues, a little bowl. If your coin lands in it, your wish will come true, they say.', 'Toss a coin? (three tries)'],
    zeniEncore: ['Another coin for luck? (three tries)'],
    zeniAide: (n) => `A (or tap the screen) when the golden circle is over the bowl! ${n} coin${n > 1 ? 's' : ''} left`,
    zeniRate: (n) => `Missed… Wait until the circle is on the bowl. ${n} coin${n > 1 ? 's' : ''} left`,
    zeniGagne: ['Tiiing! The coin fell right into the bowl!', 'Your wish will come true, for sure!'],
    zeniPerdu: ['No luck… The coins rolled beside the bowl.', 'You can try again anytime!'],
    zeniCompagnon: { kon: ['“In the bowl! The gods heard your wish.”'], pon: ['“Pon pon! Can you make a wish for me too? Cakes. Lots of them.”'], chapu: ['“Chapu! Plop into the bowl!”'], gao: ['“Gao! A perfect throw!”'], fuwa: ['“Fuwaaa! It sparkled as it fell, like a shooting star!”'], saya: ['“The statues are smiling… They’re happy.”'] },
    anmintaku: ['Anmintaku pond (安民沢), in the forest. They say it never dries up: people came here to pray for rain.', 'On its island, the little stone pagoda: the White Snake Mound (白蛇の塚).'],
    hakuja: ['The White Snake Mound (白蛇の塚): the white snake is the messenger of the water goddess.', 'People toss coins toward the little pagoda, for luck.'],
    vueHaut: ['From here, you see the top of the pavilion over the young pines: the golden top floor, the pyramid roof… and the golden phoenix.', 'They say the phoenix is the bird of peaceful times. It faces south.'],
    vueHautNuit: ['At night, from here, the pavilion glows softly above the dark pines.'],
    sekkatei: ['The Sekka-tei (夕佳亭), “the pavilion where evening is beautiful”: a tea house built for Emperor Go-Mizunoo.', 'Its name comes from the Golden Pavilion, which you see shining from here at sunset. Its pillar is carved from a nandina trunk!'],
    chajinJour: ['Welcome to the Sekka-tei. From here, at sunset, the Golden Pavilion shines like a lantern.', 'Would you like to wait for the evening with me?'],
    chajinNon: ['Take your time. Evening will come soon enough.'],
    chajinSoir: ['…Here is the evening. The pavilion blazed with light, then night fell.', 'At night, the garden is full of mysteries. Look closely at the water…'],
    chajinNuit: ['A beautiful night… Shall I bring the morning back?'],
    chajinReste: ['Let’s stay under the stars a little longer.'],
    chajinMatin: ['The sun rises over the Golden Pavilion. Enjoy your walk!'],
    chaya: ['Welcome to the tea stall! A matcha, with a little gold-leaf sweet?'],
    chayaEncore: ['Another matcha? There’s always room on the red benches!'],
    chayaNon: ['Come back anytime!'],
    chayaNuit: ['The tea stall is closed. Come back tomorrow!'],
    matcha: ['The lady brings you a bowl of frothy green tea and a little sweet. There’s a real gold leaf on it!', 'The tea is a little bitter… and the sweet so soft. Delicious, sitting on the red felt under the parasol.'],
    matchaCompagnon: { kon: ['“A delicate tea… Thank you for the little piece of cake.”'], pon: ['“Pon! You can eat gold leaf?! I want it!”'], chapu: ['“It’s green like river water… but warmer!”'], gao: ['“Gao… Bitter! But the cake is good.”'], fuwa: ['“Fuwa… A tea bubble tickled my nose.”'], saya: ['“These tea leaves grew in the sun, like me. Thank you, little leaves.”'] },
    shuin: ['Hello. Would you like the temple’s goshuin? I write it with a brush and add the seals.'],
    shuinEncore: ['Another goshuin? With pleasure.'],
    shuinNon: ['As you wish. Enjoy your visit!'],
    shuinNuit: ['The goshuin office is closed. Come back tomorrow morning.'],
    goshuin: ['“Hōhai” (奉拝), with respect… Then the name of the pavilion, “Shariden” (舎利殿), and the temple’s name, Rokuon-ji.', 'Here is your goshuin. Take good care of it: it’s the proof of your visit, like a pilgrim’s stamp.'],
    goshuinCompagnon: { kon: ['“Such beautiful writing… The brush dances like a fox in the snow.”'], pon: ['“Pon! The red seals look like strawberry cakes!”'], chapu: ['“Chapu! The ink is still wet… don’t put your paw on it!”'], gao: ['“Gao! A guardian’s seal, I like that.”'], fuwa: ['“Fuwa… The characters look like little flying dragons.”'], saya: ['“Paper comes from trees… It keeps memories well.”'] },
    billet: ['Welcome to Rokuon-ji temple. Here is your ticket.', 'Here, the ticket isn’t just a ticket: it’s a paper lucky charm!'],
    billetLu: ['“Kinkaku Shariden go-shugo”: the protection of the Golden Pavilion. And on the sides: luck and happiness, and peace at home.', 'Keep it safe!'],
    fudo: ['You pull the thick rope: the bronze gong rings, “garan, garan”.', 'Inside, in the shadows, there is a stone Fudō, the stern-faced guardian. They say the great monk Kūkai carved it.', 'It’s only shown two days a year!'],
    fudoNuit: ['The gong echoes in the night. The red lanterns keep watch in front of the Fudō hall.'],
    bougie: ['White candles burn in front of the hall. Each one carries a wish.'],
    omikuji: 'You draw a paper fortune…',
    omikujiSorts: ['大吉 Great luck! What you seek is very close.', '吉 Good luck! A beautiful journey awaits you.', '中吉 Middle luck! Be patient, like the boat pine.', '小吉 Small luck. Drink a good tea, everything will be better.', '末吉 Luck will come later… like the evening at the Sekka-tei.'],
    cloche: ['The temple bell, from the Kamakura period, they say. Its note is an “A”, the reference pitch of old Japanese music.', 'It isn’t rung for fun: only for ceremonies.'],
    karamon: ['The Chinese gate (唐門) of the hōjō, with its curved roof. It stays closed: it only opens on great occasions.'],
    ichiigashi: ['This great evergreen oak (櫟樫) is about three and a half centuries old. It’s a natural monument of the city of Kyoto.'],
    koi: ['Carp swim in the Mirror Pond: red, white, golden…', 'When they pass under the reflection, they look like they’re swimming inside the pavilion!'],
    koiNuit: ['At night, the carp sleep at the bottom of the pond. You can just make out their white patches.'],
    videaste: ['Hi! I’m @random_japan_place. I’m filming the Golden Pavilion for my TikTok.', 'Want to see my video?'],
    gardien: ['Keep moving, please, don’t stay too long! It’s very crowded here.', '…Well, take your photo anyway. This is the best spot for the pavilion and its reflection.'],
    gardienNuit: ['Tonight, the pond is a perfect mirror…', 'Huh? On the roof of the reflection… something’s missing, isn’t it? I must be working too hard.'],
    photographe: ['I’m waiting for the wind to stop completely: then the reflection will be perfect.', 'Photographers call it the “upside-down Kinkaku” (逆さ金閣).'],
    photographeNuit: ['At night, under the moon, the gold turns so soft…'],
    guide: ['This way, everyone! The Golden Pavilion was built in 1397 by Shogun Yoshimitsu.', 'In 1950, a young monk set it on fire, and it burned down completely. It was rebuilt exactly as before in 1955.', 'In 1987, it was covered with new gold: twenty kilos of gold leaf!'],
    guideNuit: ['The tour is over for today… but the garden is so beautiful at night!'],
    eleve: ['We’re on a school trip to Kyoto! Yesterday we saw the thousand torii of Fushimi Inari.', 'The Golden Pavilion is even shinier than the photo in our textbook!'],
    eleveNuit: ['We should be back at the hotel… Shh, don’t tell the teacher!'],
    eleve2: ['I bought a lucky charm to pass my exams.', 'Do you think tossing a coin into the statues’ bowl works too?'],
    eleve2Nuit: ['It’s dark… but the stars are pretty above the pond.'],
    kimono: ['I rented a kimono for the day! In Kyoto, everyone does it.', 'With the pavilion behind me, my photos will be gorgeous!'],
    jardinier: ['I trim the garden’s pines needle by needle. It takes years to give them their cloud shape.', 'My grandfather was a gardener here too. He used to say the phoenix on the roof gets thirsty on clear nights…', '…and that it comes down to drink at Yoshimitsu’s tea spring, behind the pavilion. An old man’s story, surely!'],
    jardinierNuit: ['At night, I put my shears away… Maybe the phoenix is thirsty tonight? Heh heh.'],
    moine: ['I sweep the path every morning. In a Zen temple, sweeping is also meditating.', 'Behind the pavilion there are two springs: the one for Yoshimitsu’s tea, and the one where he washed his hands.'],
    moineNuit: ['At night, I sometimes hear wings beating near the Milky Way spring…', 'A heron, probably. Or else…'],
    obaa: ['I come to pray to Fudō-sama every month. He’s the protector who drives away evil.', 'Pull the thick rope and ring the gong: he’ll hear you!'],
    obaaNuit: ['The red lanterns light the hall… Fudō-sama watches over us, even at night.'],
    touriste: ['Wow, it’s really all gold! I came all the way from Australia to see this!', 'Wait, I’ll take a selfie with the pavilion… One more!'],
    grandpere: ['Sit down for a while, young traveller. The matcha here is the best in Kyoto.', 'When I was little, they said the carp of the waterfall turned into dragons. I believed it for a long time!'],
    grandpereNuit: ['The stall is closed, but I like to stay here in the evening, listening to the frogs.'],
    enfant: ['I threw ten coins and not one in the bowl! It’s too hard!', 'You try: throw when the golden circle is on it!'],
    heron: ['A grey heron, standing still on the island’s shore… It’s watching for little fish.'],
    libellule: ['A red dragonfly (akatombo) is resting. In Japan, it means summer is ending.'],
    'panneau-kinkaku': ['“The Golden Pavilion 金閣（舎利殿）”', 'Built in 1397 by Shogun Ashikaga Yoshimitsu. Three floors: palace style, samurai house style, Zen temple style.', 'Burned in 1950, rebuilt in 1955. UNESCO World Heritage Site.'],
    'panneau-ryumon': ['“The Dragon Gate waterfall 龍門滝”', 'Height: 2.3 m. The carp stone (鯉魚石) at the foot of the falls is a carp climbing the waterfall to become a dragon.'],
    'panneau-anmintaku': ['“Anmintaku 安民沢”', 'A pond that never dries up; people prayed here for rain. On its island, the White Snake Mound (白蛇の塚), protector of the Saionji family.'],
    'panneau-sekkatei': ['“Sekka-tei 夕佳亭”', 'Tea house by tea master Kanamori Sōwa, for Emperor Go-Mizunoo. Its name: “evening is beautiful here”, when the Golden Pavilion shines at sunset.'],
    'panneau-fudo': ['“The Fudō hall 不動堂”', 'The oldest building of the temple. It enshrines a stone Fudō attributed to Kūkai, shown two days a year (3 February and 16 August).'],
    'panneau-rikushu': ['“The boat pine 陸舟の松”', 'One of the three great pines of Kyoto. Planted by Yoshimitsu, trimmed into the shape of a boat, its bow toward the west.'],
    'panneau-jardin': ['“Rokuon-ji 鹿苑寺”', 'A Rinzai Zen temple (Shōkoku-ji branch). The stroll garden around the Mirror Pond is a Special Historic Site and Special Place of Scenic Beauty of Japan.'],
  },
  ja: {
    noms: { gardien: 'けいびいん', photographe: 'カメラマン', videaste: '@random_japan_place', guide: 'ガイドさん', eleve: '男子生徒', eleve2: '女子生徒', kimono: '着物の　女の人', jardinier: '庭師', moine: '若い　お坊さん', billet: '受付の　お坊さん', chaya: 'お茶所の　おばさん', chajin: '茶人', shuin: '御朱印の　お坊さん', obaa: 'おばあさん', touriste: '観光客', grandpere: 'おじいさん', enfant: '男の子' },
    tampons: { kinkaku: ['金閣', 'いけの　むこうの　見晴らし台。金閣と　その　さかさまの　すがたが　見える　ところ'], ryumon: ['龍門滝', '金閣の　うら、龍門滝'], zeni: ['願い銭', '丘の　ふもと、石の　仏さまと　小さな　はちの　前'], matcha: ['抹茶', '丘の　上の　お茶所、赤い　こしかけ'], goshuin: ['御朱印', '丘の　上の　御朱印所、不動堂の　近く'] },
    kinkaku: ['金閣……　本当の　名前は　鹿苑寺の　「舎利殿（しゃりでん）」。', '1397年に、将軍　足利義満が　別荘として　たてたんだ。義満が　なくなった　あと、禅の　お寺に　なったよ。', 'いけを　見て！　風の　ない　日は、金閣が　さかさまに　うつるんだ。この　いけは　「鏡湖池（きょうこち）」、うつった　すがたは　「逆さ金閣」って　よばれて　いるよ。'],
    kinkakuNuit: ['夜の　金閣が　まっくらな　いけの　上で　ねむって　いる……　さかさまの　すがたが　水に　うかんで　いる。', '……まって。うつった　屋根を　よく　見て。', '本物の　屋根には　金の　鳳凰が　いる……　でも、水の　中には　いない！　鳳凰が　消えちゃった！'],
    kinkakuNuitApres: ['夜、金閣と　その　すがたが　むかいあって　いる。どちらの　屋根にも　鳳凰が　いるよ。'],
    kinkakuCompagnon: { kon: ['「きれい……　空に　ひとつ、水に　ひとつ。金の　お堂が　ふたつ　ありますね。」'], pon: ['「ポン！　ぜんぶ　金！　小判が　何まい　できるかなあ？」'], chapu: ['「チャプ！　水が　金いろ！　うつった　金閣に　とびこんで　いい？」'], gao: ['「ガオ！　こんな　たからは　昼も　夜も　まもらなくちゃ！」'], fuwa: ['「ふわぁ……　ぼくの　しんじゅみたいに　かがやいてる。千倍　大きいけど。」'], saya: ['「まわりの　松が　何百年も　見まもって　きたんです……　みんな　じまんに　思ってる。」'] },
    refletCompagnon: { kon: ['「水の　中の　鳳凰が　いなくなった……　わけが　あるはず。のどが　かわいたのかな？」'], pon: ['「ポン？！　うつった　すがたが　ぬけだした！　おやつでも　食べに　いったのかな……」'], chapu: ['「チャプ！　うつった　すがたが　ひとりで　およいで　いった？　ちがう　水に　いったのかも！」'], gao: ['「ガオ！　鳳凰が　ぬすまれた？　いや……　じぶんで　出て　いったんだ。さがそう！」'], fuwa: ['「ふわ……　わかるよ。星で　いっぱいの、とても　きれいな　水の　近くに　いる。」'], saya: ['「木たちが　見たって……　金閣の　うらの、わき水の　ほうへ　とんで　いったって。」'] },
    pavillon: ['近くで　見ると、金閣は　三つの　かいに　わかれて　いて、それぞれ　つくりかたが　ちがうんだ。', 'いちばん　下は　お公家さんの　家の　つくり（寝殿造）。まん中は　武士の　家。いちばん　上は　禅の　お寺で、つりがねの　形の　まどが　あるよ。', '上の　ふたつの　かいは　金ぱくで　おおわれて　いる。ぜんぶで　やく　20キロ、20万まいの　金ぱく！'],
    kuzan: ['金閣の　前の　水の　中に　「九山八海石（くせんはっかいせき）」。', '仏教の　世界の　まん中に　ある　山、「須弥山（しゅみせん）」を　あらわして　いるんだ。義満が　中国から　とりよせたと　いわれて　いるよ。'],
    sosei: ['うらからは、金閣の　北がわが　見える。こい　木の　はしらの　あいだに、白い　しっくいの　かべ。', 'そして　水の　上に　「漱清（そうせい）」。義満が　いけの　そばで　すずんだ　小さな　あずまやだよ。'],
    ashihara: ['大きな　しまは　「葦原島（あしはらじま）」。神話で　日本の　ことを　こう　よんだんだ。', '舟の　形を　して　いるよ。小さな　しまは　鶴島と　亀島。どちらも　ながいきの　どうぶつだね。'],
    rikushu: ['陸舟の松（りくしゅうの　まつ）！　義満が　ぼんさいに　して　いた　松を　ここに　うえたと　いわれて　いるんだ。', '600年も　の　あいだ、庭師が　舟の　形に　かりこんで　きた。へさきは　西むき……　西の　ごくらくの　ほうへ。'],
    jozo: ['浄蔵貴所塔（じょうぞうきしょとう）に　おいのりした。かたむいた　八坂の　塔を　おいのりだけで　まっすぐに　したという　お坊さんの　塔だよ。', 'ここで　おねがいすると　かなうって　いわれて　いるんだ……'],
    shinun: ['小さな　お社　「榊雲（しんうん）」に　あいさつした。お寺を　まもる　神さまが　まつられて　いるよ。'],
    gingasen: ['「銀河泉（ぎんがせん）」。義満が　お茶の　水を　くませた　わき水だよ。', '水は　すんで　いて　ふかい……　夜には　星が　うつって、光の　川みたいに　なるんだって。'],
    gingasenNuit: ['星空の　下の　銀河泉……', '水の　中に……　金の　鳥が　うつって　いる！　鳳凰が　水に　くちばしを　つけて　のんで　いる！', 'でも、わき水の　上には……　なにも　いない。うつった　すがただけ。'],
    gingasenApres: ['銀河泉に　星が　きらきら。水の　そこに　まだ　小さな　金の　光が　ゆれて　いる……'],
    phenixCompagnon: { kon: ['「鳳凰……　平和な　時代にだけ　あらわれると　いいます。そっと　近づいて。」'], pon: ['「ポン……　こんどばかりは　おなかも　すかない。きれいすぎて。」'], chapu: ['「チャプ……　とびこまないよ。やくそく。見てるだけ。」'], gao: ['「ガオ……　ぼくが　見はりを　する。だれにも　じゃまさせない。」'], fuwa: ['「空の　鳥が　星の　水を　のんでる……　ふわ、むかし話　みたい。」'], saya: ['「この　わき水は　とても　古いんです……　義満の　ことも　おぼえて　います。」'] },
    phenixMain: ['うつった　鳳凰が　顔を　あげて……　こっちを　見た。', '水に　手を　のばす？'],
    phenixNon: ['鳳凰は　また　星の　水に　くちばしを　つけた……'],
    phenixEnvol: ['鳳凰が　つばさを　ひろげて……　水の　中を　金閣の　屋根へ　とんで　いった！', '金の　羽が　一まい、水から　うかんで　きて、手の　ひらに　のった。', 'わき水の　そこで　なにかが　光って　いる……'],
    gankasui: ['「巌下水（がんかすい）」。義満が　お茶の　前に　手を　あらった　わき水だよ。', '今も　岩から　ぽたぽたと　水が　しみでて　いる。'],
    kokei: ['「虎渓橋（こけいきょう）」。中国の　むかし話が　もとなんだ。三人の　友だちが　わらいながら　見おくりあって、気づいたら　橋を　こえて　いたんだって。', 'ひくい　竹の　かきねは　「金閣寺垣」。ここで　うまれた　かきねなんだ！'],
    ryumon: ['「龍門滝（りゅうもんばく）」。高さは　2.3メートル。', '滝の　下の　かたむいた　石は　「鯉魚石（りぎょせき）」。', '中国の　言いつたえでは、龍門の　滝を　のぼりきった　コイは　龍に　なるんだって。だから　日本では、コイは　勇気の　しるしなんだ。'],
    ryumonSaut: ['あっ！　池の　コイが　滝に　むかって　ジャンプした！', '……今回は　まだ　だめ。でも　いつか　龍に　なるかもね。'],
    ryumonCompagnon: { kon: ['「滝を　のぼって　龍に　なる……　勇気が　いりますね。スタンプを　ぜんぶ　さがす　あなたみたいに！」'], pon: ['「ポン！　ぼくは　かいだんの　ほうが　いいなあ。おんぶでも　いいよ。」'], chapu: ['「チャプ！　あの　滝、ぼくなら　のぼれるよ！　……たぶん。」'], gao: ['「ガオ！　コイは　ぜったい　あきらめない。そんけいする！」'], fuwa: ['「ふわ！　ぼくは　海の　龍……　コイだった　ことは　ないと　思うけど？」'], saya: ['「鯉魚石の　こけは　何百年も　まえから……　たくさんの　コイが　ちょうせんするのを　見て　きました。」'] },
    zeni: ['石の　仏さまの　前に　小さな　はち。おかねが　中に　入れば　ねがいが　かなうって。', 'おかねを　なげて　みる？（3かい）'],
    zeniEncore: ['もう　いちど　なげて　みる？（3かい）'],
    zeniAide: (n) => `金の　わが　はちの　上に　来たら　A（または　画面を　タッチ）！　のこり　${n}まい`,
    zeniRate: (n) => `はずれ……　わが　はちの　上に　来るまで　まって。のこり　${n}まい`,
    zeniGagne: ['チリーン！　おかねが　はちの　中に　入った！', 'きっと　ねがいが　かなうよ！'],
    zeniPerdu: ['ざんねん……　おかねは　はちの　そとに　ころがった。', 'いつでも　また　ちょうせん　できるよ！'],
    zeniCompagnon: { kon: ['「はちの　中に！　神さまに　ねがいが　とどきましたよ。」'], pon: ['「ポンポン！　ぼくの　ぶんも　おねがいして！　おかしを　いっぱい。」'], chapu: ['「チャプ！　はちに　ぽちゃん！」'], gao: ['「ガオ！　かんぺきな　なげかただ！」'], fuwa: ['「ふわぁ！　ながれぼしみたいに　光って　おちたよ！」'], saya: ['「仏さまが　ほほえんで　います……　うれしそう。」'] },
    anmintaku: ['森の　中の　池　「安民沢（あんみんたく）」。ぜったいに　水が　かれないと　いわれ、雨ごいを　した　池なんだ。', 'しまの　小さな　石の　塔は　「白蛇の塚（はくじゃの　つか）」。'],
    hakuja: ['「白蛇の塚」。白い　ヘビは　水の　女神さまの　おつかいなんだ。', 'みんな　小さな　塔に　むかって　おかねを　なげて、えんぎを　かつぐんだよ。'],
    vueHaut: ['ここからは　若い　松の　むこうに　金閣の　上が　見える。金の　いちばん　上の　かい、ピラミッドの　屋根……　そして　金の　鳳凰。', '鳳凰は　平和な　時代の　鳥なんだって。南を　むいて　いるよ。'],
    vueHautNuit: ['夜、ここから　見ると、金閣が　黒い　松の　上で　やさしく　光って　いる。'],
    sekkatei: ['「夕佳亭（せっかてい）」。「夕方が　うつくしい」という　意味の、後水尾天皇の　ための　茶室だよ。', 'ここから　夕日に　かがやく　金閣が　見えるから　この　名前。とこばしらは　南天の　木なんだ！'],
    chajinJour: ['夕佳亭へ　ようこそ。ここから　見る　夕日の　金閣は、ちょうちんのように　かがやきます。', 'わたしと　いっしょに　夕方を　まちますか？'],
    chajinNon: ['ごゆっくり。夕方は　すぐに　来ますよ。'],
    chajinSoir: ['……夕方です。金閣が　まばゆく　かがやいて、やがて　夜に　なりました。', '夜の　庭は　ふしぎで　いっぱい。水を　よく　見て　ごらんなさい……'],
    chajinNuit: ['よい　夜ですね……　朝に　もどしましょうか？'],
    chajinReste: ['もう　すこし　星の　下に　いましょう。'],
    chajinMatin: ['金閣に　朝日が　のぼります。よい　散歩を！'],
    chaya: ['お茶所へ　ようこそ！　抹茶と、金ぱくの　のった　おかしは　いかが？'],
    chayaEncore: ['もう　一ぱい　いかが？　赤い　こしかけは　いつでも　あいて　いますよ！'],
    chayaNon: ['いつでも　どうぞ！'],
    chayaNuit: ['お茶所は　しまって　います。また　あした！'],
    matcha: ['あわの　たった　抹茶と、小さな　おかしが　来た。本物の　金ぱくが　のって　いる！', 'お茶は　すこし　にがくて……　おかしは　とても　あまい。赤い　毛せんの　上、かさの　下で　いただく　おいしい　ひととき。'],
    matchaCompagnon: { kon: ['「上品な　お茶……　おかしを　わけて　くれて　ありがとう。」'], pon: ['「ポン！　金ぱくって　食べられるの？！　ちょうだい！」'], chapu: ['「川の　水みたいに　みどり……　でも　あったかい！」'], gao: ['「ガオ……　にがい！　でも　おかしは　うまい。」'], fuwa: ['「ふわ……　お茶の　あわが　はなを　くすぐったよ。」'], saya: ['「この　茶の　葉は　お日さまで　そだったんです。ぼくと　同じ。ありがとう、葉っぱたち。」'] },
    shuin: ['こんにちは。お寺の　御朱印は　いかがですか？　ふででかいて、はんこを　おします。'],
    shuinEncore: ['もう　一まい？　よろこんで。'],
    shuinNon: ['どうぞ　ごゆっくり。'],
    shuinNuit: ['御朱印所は　しまって　います。あしたの　朝　また　どうぞ。'],
    goshuin: ['「奉拝」……　それから　お堂の　名前　「舎利殿」、お寺の　名前　「鹿苑寺」。', 'あなたの　御朱印です。お参りした　しるし。大切に　して　くださいね。'],
    goshuinCompagnon: { kon: ['「みごとな　字……　ふでが　雪の　中の　キツネみたいに　おどって　います。」'], pon: ['「ポン！　赤い　はんこ、いちごの　おかしみたい！」'], chapu: ['「チャプ！　まだ　すみが　ぬれてる……　さわっちゃ　だめ！」'], gao: ['「ガオ！　まもり神の　はんこ、気に　いった。」'], fuwa: ['「ふわ……　字が　小さな　龍みたいに　とんでる。」'], saya: ['「紙は　木から　できて　います……　思い出を　よく　おぼえて　いて　くれるんです。」'] },
    billet: ['鹿苑寺へ　ようこそ。こちらが　拝観券です。', 'ここの　拝観券は　ただの　きっぷじゃ　ないよ。紙の　おまもりなんだ！'],
    billetLu: ['「金閣舎利殿御守護」。金閣の　おまもり。そして　両がわには　「開運招福」と　「家内安全」。', '大切に　してね！'],
    fudo: ['ふとい　つなを　ひっぱると、鰐口（わにぐち）が　「ガラン、ガラン」と　なった。', '中の　くらがりには、石の　お不動さま。きびしい　顔の　まもり神だ。弘法大師が　ほったと　いわれて　いるよ。', '1年に　2日しか　見られないんだって！'],
    fudoNuit: ['鰐口の　音が　夜に　ひびく。赤い　ちょうちんが　不動堂を　見まもって　いる。'],
    bougie: ['お堂の　前で　白い　ろうそくが　もえて　いる。ひとつ　ひとつに　ねがいが　こめられて　いるんだ。'],
    omikuji: 'おみくじを　ひいた……',
    omikujiSorts: ['大吉　さがして　いる　ものは　すぐ　近くに。', '吉　すてきな　旅が　まって　いるよ。', '中吉　陸舟の松みたいに　気長に　まとう。', '小吉　おいしい　お茶を　のめば、うまく　いくよ。', '末吉　いい　ことは　あとから　来る……　夕佳亭の　夕方みたいに。'],
    cloche: ['鐘楼の　かね。鎌倉時代の　ものと　いわれて　いるよ。音は　「ラ」、むかしの　日本の　音楽の　もとに　なる　音なんだ。', 'あそびで　ついちゃ　いけないよ。ぎしきの　ときだけ。'],
    karamon: ['方丈の　唐門。そった　屋根が　とくちょうだよ。ふだんは　しまって　いて、とくべつな　日だけ　ひらくんだ。'],
    ichiigashi: ['この　大きな　「櫟樫（いちいがし）」は　やく　350さい。京都市の　天然記念物なんだ。'],
    koi: ['鏡湖池に　コイが　およいで　いる。赤、白、金いろ……', 'うつった　金閣の　下を　とおると、金閣の　中を　およいで　いるみたい！'],
    koiNuit: ['夜、コイは　池の　そこで　ねむって　いる。白い　もようだけが　うっすら　見える。'],
    videaste: ['やあ！　@random_japan_place だよ。TikTokの　ために　金閣を　とって　いるんだ。', 'ぼくの　どうがを　見る？'],
    gardien: ['とまらずに　すすんで　ください！　たいへん　こんで　います。', '……まあ、しゃしんは　どうぞ。金閣と　さかさ金閣が　いちばん　きれいに　見える　ところですから。'],
    gardienNuit: ['今夜の　池は　まるで　かがみ……', 'あれ？　うつった　屋根の　上……　なにか　たりなく　ない？　つかれて　いるのかな。'],
    photographe: ['風が　ぴたりと　やむのを　まって　いるの。そう　すれば　うつった　すがたが　かんぺきに　なる。', 'カメラマンは　「逆さ金閣」って　よぶのよ。'],
    photographeNuit: ['夜、月あかりの　金は　とても　やわらかい……'],
    guide: ['みなさん、こちらへ！　金閣は　1397年に　将軍　足利義満が　たてました。', '1950年、若い　お坊さんが　火を　つけて、ぜんぶ　もえて　しまいました。1955年に　もとどおりに　たてなおしたんです。', '1987年には　金ぱくを　はりかえました。金ぱく　20キロ　ですよ！'],
    guideNuit: ['今日の　見学は　おしまい……　でも　夜の　庭も　すてきですね！'],
    eleve: ['修学旅行で　京都に　来たんだ！　きのうは　伏見稲荷の　千本鳥居を　見たよ。', '金閣って、教科書の　しゃしんより　もっと　ピカピカ！'],
    eleveNuit: ['ホテルに　もどらなきゃ……　しーっ、先生には　ないしょ！'],
    eleve2: ['合格の　おまもりを　買ったの。', '仏さまの　はちに　おかねを　なげても　ききめ　あるかな？'],
    eleve2Nuit: ['まっくら……　でも　池の　上の　星が　きれい。'],
    kimono: ['きょうは　着物を　かりたの！　京都では　みんな　そうするのよ。', 'うしろに　金閣が　あれば、しゃしんが　すてきに　なるわ！'],
    jardinier: ['庭の　松を　一本　一本　手入れして　いるんだ。雲の　形に　するには　何年も　かかる。', 'わしの　じいさんも　ここの　庭師でな。晴れた　夜は　屋根の　鳳凰が　のどを　かわかすと　いって　いた……', '……そして　金閣の　うらの、義満の　お茶の　わき水へ　水を　のみに　おりて　くるんだと。年よりの　はなしだろうけどな！'],
    jardinierNuit: ['夜は　はさみを　しまうよ……　今夜あたり、鳳凰も　のどが　かわいて　いるかもな。へへ。'],
    moine: ['まいあさ　道を　はいて　います。禅寺では、そうじも　修行なんです。', '金閣の　うらには　わき水が　ふたつ。義満の　お茶の　水と、手を　あらった　水です。'],
    moineNuit: ['夜、銀河泉の　ほうで　はばたく　音が　する　ことが　あるんです……', 'たぶん　サギでしょう。それとも……'],
    obaa: ['まいつき　お不動さまに　おまいりに　来るの。わるい　ものを　おいはらう　まもり神さまよ。', 'ふとい　つなを　ひいて、鰐口を　ならして　ごらん。きっと　とどくわ！'],
    obaaNuit: ['赤い　ちょうちんが　お堂を　てらして　いる……　お不動さまは　夜も　見まもって　くださるの。'],
    touriste: ['ワオ、ほんとうに　ぜんぶ　金だ！　オーストラリアから　これを　見に　来たんだよ！', 'まって、金閣と　セルフィーを……　もう　一まい！'],
    grandpere: ['すこし　すわって　いきなさい、わかい　旅人さん。ここの　抹茶は　京都　いちだ。', '子どもの　ころ、滝の　コイは　龍に　なると　聞いてね。ずっと　しんじて　いたよ！'],
    grandpereNuit: ['お茶所は　しまったが、夜は　ここで　カエルの　声を　聞くのが　すきでね。'],
    enfant: ['おかねを　10まい　なげたのに、ひとつも　入らない！　むずかしすぎる！', 'やって　みて。金の　わが　上に　来たら　なげるんだよ！'],
    heron: ['アオサギが　しまの　岸で　じっと　して　いる……　小さな　魚を　ねらって　いるんだ。'],
    libellule: ['赤とんぼが　ひとやすみ。日本では　夏の　おわりの　しらせだよ。'],
    'panneau-kinkaku': ['「金閣（舎利殿）」', '1397年、足利義満が　建立。一層は　寝殿造、二層は　武家造、三層は　禅宗仏殿造。', '1950年に　焼失、1955年に　再建。世界遺産。'],
    'panneau-ryumon': ['「龍門滝」', '高さ　2.3メートル。滝つぼの　鯉魚石は、滝を　のぼって　龍に　なろうと　する　コイを　あらわす。'],
    'panneau-anmintaku': ['「安民沢」', 'かれる　ことの　ない　池で、雨ごいの　池でも　あった。しまの　「白蛇の塚」は　西園寺家の　鎮守。'],
    'panneau-sekkatei': ['「夕佳亭」', '茶人　金森宗和が　後水尾天皇の　ために　つくった　茶室。夕日に　はえる　金閣が　とくに　うつくしい　ことから　この　名に。'],
    'panneau-fudo': ['「不動堂」', '境内で　もっとも　古い　建物。弘法大師の　作と　つたわる　石の　不動明王を　まつる。開扉は　2月3日と　8月16日。'],
    'panneau-rikushu': ['「陸舟の松」', '京都三松の　ひとつ。義満　手植えと　つたわり、西に　むかう　舟の　形に　仕立てられて　いる。'],
    'panneau-jardin': ['「鹿苑寺」', '臨済宗相国寺派の　寺。鏡湖池を　中心と　する　池泉回遊式庭園は　特別史跡・特別名勝。'],
  },
};
