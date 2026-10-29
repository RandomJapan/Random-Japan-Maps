// ================================================================
//  Le sanctuaire Motonosumi (元乃隅神社), à Nagato, dans la préfecture de Yamaguchi, au bord de la mer du Japon
//  (2026-10-28 : le huitième lieu de la balade, choisi par le propriétaire : « Sanctuaire Motonosumi je pense que c'est
//  bien. Oublie pas que tu peux utiliser des infos d'internet comme inspiration pour recréer le lieu […] Prend le temps de
//  bien créer le lieu et de le tester », d'après son TikTok et des photos du lieu). En 1955, un renard blanc apparut en rêve
//  à Okamura Hitoshi, un patron de pêcheurs (網元) du village : « bâtis-moi un sanctuaire ici ». De 1987 à 1997, 123 torii
//  rouges furent offerts, un à un, sur la pente du cap : un chemin qui court en travers de l'herbe, fait une épingle à
//  cheveux, puis descend tout droit jusqu'à un grand plateau de roche rose et mauve, au-dessus de la mer. En haut, le grand
//  torii porte un tronc des offrandes à cinq mètres du sol (« le plus difficile du Japon ») ; au bord du plateau, la mer
//  jaillit entre les rochers les jours de vent du nord : le souffle du palais du dragon (龍宮の潮吹, monument naturel). En
//  2015, CNN l'a mis parmi les 31 plus beaux endroits du Japon. Le sanctuaire (元乃隅稲成神社 jusqu'en 2019) appartient
//  toujours à la famille de son fondateur. Les distances sont un peu resserrées.
//  Son secret : le 124e torii. Certaines nuits, on en compte un de plus : un renard blanc déguisé, une petite flamme bleue
//  au-dessus de lui (le propriétaire l'a choisi parmi quatre). Sa récompense : les oreilles et la queue de renard (tenues.js).
//  Repère : x vers l'est, z vers le sud, y vers le haut, en mètres ; la mer au nord et à l'ouest (niveau 0) ; le parvis du
//  sanctuaire à 26 m, le plateau de roche à 8,45 m. ctx : { THREE, atelier, P (palette), peinture, perso, maillage }.
// ================================================================
import { creerMonde, interactionsBancs, lisse, hasard, bruitDoux } from './monde.js';
import { panneau, PAPIER_PANNEAU } from './decor.js';
import { MATIERES as M } from './textures.js';
import { secretTrouve } from './tresors.js';

const PI = Math.PI;

// ---------------------------------------------------------------- Le plan
// les hauteurs : le parvis du sanctuaire, le parking (un rien plus haut, une pente douce entre les deux), le haut du chemin
// des torii (le palier devant le grand torii), le plateau de roche au bout du cap
const Y_PARVIS = 26.0, Y_PARKING = 26.4, Y_HAUT = 25.95, Y_ROC = 8.45;
// le parvis (境内) et le parking (駐車場) : où l'on marche en haut (un polygone : le parvis, puis le parking au sud)
const PARVIS = { x0: -16, x1: 16, z0: 14.6, z1: 30.5 };
const PARKING = { x0: -12.4, x1: 31, z0: 30.5, z1: 46 };
// le palier devant le grand torii, en haut du chemin (on y lance la pièce) ; le balcon des photos (撮影スポット), à côté
const PALIER = { x0: -1.8, x1: 1.8, z0: 11.4, z1: 14.6 };
const BALCON = { x0: -11.6, x1: -6.4, z0: 10.6, z1: 14.6 };
// le grand torii (大鳥居), au bord nord du parvis, tourné vers le chemin (vers −z) ; son tronc des offrandes, tout en haut
const OTORII = { x: 0, z: 14.6, demi: 2.05, h: 5.8 };
const TRONC = { x: 0, y: Y_PARVIS + 4.72, z: OTORII.z - 0.34 };
// d'où l'on lance la pièce (sur le palier, face au grand torii)
const LANCEUR = { x: 0, z: 12.15 };
// le coin de Bunbuku, à l'ouest du parvis, sous les pins (il mord sur le parvis : 2026-10-27, à Kinkaku-ji, un coin qui ne
// faisait que toucher l'allée laissait un mur invisible)
const RECOIN = { x: -19.0, z: 22.6, rx: 3.4, rz: 2.5, ry: 0 };
const MARCHAND = { x: -20.1, z: 22.6, cap: PI / 2 };
const LAMPION = { x: -20.9, z: 21.2 };
// le sanctuaire (本殿) : la petite maison de pierre dans sa clôture rouge, sous son auvent, tournée vers l'est ; le petit
// sanctuaire au torii rouge, à côté du balcon ; le bureau des porte-bonheur (社務所)
const HONDEN = { x: -10.2, z: 23.0 };
const PETIT = { x: -13.0, z: 17.4 };
const BUREAU = { x: 11.0, z: 22.6, l: 4.6, p: 3.4 };
// la boutique (元乃隅売店) et le café (漁火庵), à l'ouest du parking, leur devanture vers lui (vers +x)
const BOUTIQUE = { x: -16.9, z: 35.0, l: 8.4, p: 7.0 };
const CAFE = { x: -16.9, z: 42.6, l: 8.4, p: 6.4 };
// l'arrêt de bus (le départ), au bout est du parking ; la route qui part vers l'est (on ne la suit pas : une barrière)
const ARRET = { x: 29.4, z: 44.3 };
const ROUTE = { z0: 34.2, z1: 42.2 };
const DEPART = { x: 27.6, z: 40.8 };

// le chemin des torii : une courbe lisse par ces points (vue de dessus), du palier jusqu'au plateau de roche : il part vers le
// nord, court vers l'est en travers de la pente, fait une épingle à cheveux, puis descend vers le nord-ouest (z toujours
// décroissant : la pente autour est réglée sur lui, plus bas)
const POINTS_LIGNE = [[0, 11.6], [0.2, 9.8], [1.6, 8.0], [4.6, 6.6], [9.2, 5.4], [14.4, 4.2], [19.6, 2.8], [24.6, 1.2], [28.6, -0.8], [30.8, -3.6],
  [30.6, -6.8], [28.2, -9.0], [24.2, -10.3], [18.4, -12.4], [11.8, -15.4], [5.2, -18.8], [-0.6, -22.6], [-5.4, -26.6], [-9.0, -30.6], [-10.4, -32.4]];
/** La courbe (Catmull-Rom) par les points, prise tous les 20 cm : { pts [[x, z]], cum (longueur parcourue), L }. */
const LIGNE = (() => {
  const P = POINTS_LIGNE, brut = [];
  for (let i = 0; i + 1 < P.length; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    for (let k = 0; k < 40; k++) {
      const t = k / 40, t2 = t * t, t3 = t2 * t;
      brut.push([0, 1].map((c) => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)));
    }
  }
  brut.push(P[P.length - 1].slice());
  const cumB = [0];
  for (let i = 1; i < brut.length; i++) cumB.push(cumB[i - 1] + Math.hypot(brut[i][0] - brut[i - 1][0], brut[i][1] - brut[i - 1][1]));
  const L = cumB[cumB.length - 1], pts = [], cum = [];
  let j = 0;
  for (let s = 0; s < L; s += 0.2) {
    while (cumB[j + 1] < s) j++;
    const f = (s - cumB[j]) / (cumB[j + 1] - cumB[j] || 1);
    pts.push([brut[j][0] + (brut[j + 1][0] - brut[j][0]) * f, brut[j][1] + (brut[j + 1][1] - brut[j][1]) * f]);
    cum.push(s);
  }
  pts.push(brut[brut.length - 1]);
  cum.push(L);
  return { pts, cum, L };
})();
const L_LIGNE = LIGNE.L;
// les places des torii : 124, à intervalles égaux (le premier 50 cm après le palier, le dernier 60 cm avant le bout) ; une
// marche par place ; à la place TROU, pas de torii le jour (un intervalle de 1,4 m) : la nuit, le 124e y pousse (le secret)
const N_PLACES = 124, TROU = 88, S0 = 0.5, ESP = (L_LIGNE - 0.6 - S0) / (N_PLACES - 1);
const sPlace = (j) => S0 + j * ESP;
// la demi-largeur où l'on marche entre les piliers ; les piliers ; la hauteur d'une contremarche (125 de la place au roc)
const DEMI = 0.62, D_PILIER = 0.82, CONTRE = (Y_HAUT - Y_ROC - 0.05) / (N_PLACES + 1);
// (le milieu du voyageur ne va pas à plus de 42 cm du milieu des marches : son corps, 24 cm, s'arrête juste avant la rampe
// rouge, à 68 cm, et les piliers, à 74 cm)
const DEMI_MARCHE = 0.42;
/** Le dessus de la marche j (la place j). */
const yMarche = (j) => Y_HAUT - (j + 1) * CONTRE;
/** La hauteur du chemin en continu, à la longueur s (du haut du palier au plateau). */
const yLigne = (s) => {
  const a = sPlace(0) - ESP / 2, b = sPlace(N_PLACES - 1) + ESP / 2;
  return Y_HAUT - (Y_HAUT - Y_ROC - 0.05) * Math.min(1, Math.max(0, (s - a) / (b - a)));
};
/** Le point du chemin à la longueur s : [x, z, ang] (ang : le cap du chemin, vers le bas). */
function pointLigne(s) {
  const { pts, cum } = LIGNE;
  s = Math.min(L_LIGNE, Math.max(0, s));
  let a = 0, b = cum.length - 1;
  while (b - a > 1) { const m = (a + b) >> 1; if (cum[m] <= s) a = m; else b = m; }
  const f = (s - cum[a]) / (cum[b] - cum[a] || 1), [x0, z0] = pts[a], [x1, z1] = pts[b];
  return [x0 + (x1 - x0) * f, z0 + (z1 - z0) * f, Math.atan2(x1 - x0, z1 - z0)];
}
// (pour trouver vite le point du chemin le plus proche : ses segments rangés par cases de 4 m, grossies de 3 m)
const CASES_LIGNE = new Map();
for (let i = 0; i + 1 < LIGNE.pts.length; i++) {
  const [x0, z0] = LIGNE.pts[i], [x1, z1] = LIGNE.pts[i + 1];
  for (let cx = Math.floor((Math.min(x0, x1) - 3) / 4); cx <= Math.floor((Math.max(x0, x1) + 3) / 4); cx++) {
    for (let cz = Math.floor((Math.min(z0, z1) - 3) / 4); cz <= Math.floor((Math.max(z0, z1) + 3) / 4); cz++) {
      const k = `${cx},${cz}`;
      if (!CASES_LIGNE.has(k)) CASES_LIGNE.set(k, []);
      CASES_LIGNE.get(k).push(i);
    }
  }
}
/** Le point du chemin des torii le plus proche de x, z : { d, s } (d : Infinity à plus de 3 m). */
function surLigne(x, z) {
  const liste = CASES_LIGNE.get(`${Math.floor(x / 4)},${Math.floor(z / 4)}`);
  let d = Infinity, s = 0;
  if (!liste) return { d, s };
  for (const i of liste) {
    const [x0, z0] = LIGNE.pts[i], [x1, z1] = LIGNE.pts[i + 1], dx = x1 - x0, dz = z1 - z0, l2 = dx * dx + dz * dz || 1;
    const f = Math.min(1, Math.max(0, ((x - x0) * dx + (z - z0) * dz) / l2)), e = Math.hypot(x - x0 - f * dx, z - z0 - f * dz);
    if (e < d) { d = e; s = LIGNE.cum[i] + f * (LIGNE.cum[i + 1] - LIGNE.cum[i]); }
  }
  return d > 3 ? { d: Infinity, s } : { d, s };
}
// la pente du cap, réglée sur le chemin : à chaque z, la hauteur du chemin quand il y passe (z décroît tout du long)
const PENTE_Z = LIGNE.pts.map(([, z], i) => [z, yLigne(LIGNE.cum[i])]);
/** La hauteur de la pente du cap en z (le parvis au sud, le plateau au nord). */
function penteZ(z) {
  const T = PENTE_Z;
  if (z >= T[0][0]) return Y_HAUT + (Y_PARVIS - Y_HAUT) * lisse(T[0][0], 13.4, z);
  if (z <= T[T.length - 1][0]) return Y_ROC + 0.05;
  let a = 0, b = T.length - 1;
  while (b - a > 1) { const m = (a + b) >> 1; if (T[m][0] >= z) a = m; else b = m; }
  const f = (z - T[a][0]) / (T[b][0] - T[a][0] || 1);
  return T[a][1] + (T[b][1] - T[a][1]) * f;
}

// la côte : le contour de la terre (le cap, la côte de part et d'autre, le pays derrière) ; tout le reste est la mer. Le cap
// pointe vers le nord ; sur son côté est, la petite crique du souffle du dragon ; plus loin à l'est, de l'autre côté de la
// baie, un autre cap (les éoliennes sur sa crête)
const COTE = [
  [-720, 230], [-600, 150], [-480, 96], [-380, 70], [-290, 52], [-210, 40], [-150, 30], [-104, 20], [-78, 10],
  [-62, 0], [-52, -10], [-46, -22], [-43, -32], [-42, -41], [-39, -50], [-33, -59], [-24, -66], [-14, -70], [-3, -71.5],
  [8, -68], [17, -62], [22, -55], [24.4, -50], [23.2, -45.6], [22.0, -42.0], [22.2, -38.2], [24.4, -34.8], [28, -31.5],
  [33, -25], [38, -16], [46, -8], [58, -3], [76, -2], [100, -10], [140, -28], [190, -60], [240, -104], [290, -160], [330, -230],
  [360, -300], [400, -340], [450, -330], [520, -280], [600, -250], [720, -240], [720, 720], [-720, 720],
];
/** Dans le polygone pts ([[x, z]…]) ? */
function dansPoly(pts, x, z) {
  let dedans = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, zi] = pts[i], [xj, zj] = pts[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) dedans = !dedans;
  }
  return dedans;
}
/** La distance de x, z au bord du polygone pts. */
function auBordPoly(pts, x, z) {
  let d = Infinity;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [x0, z0] = pts[j], [x1, z1] = pts[i], dx = x1 - x0, dz = z1 - z0, l2 = dx * dx + dz * dz || 1;
    const f = Math.min(1, Math.max(0, ((x - x0) * dx + (z - z0) * dz) / l2));
    d = Math.min(d, Math.hypot(x - x0 - f * dx, z - z0 - f * dz));
  }
  return d;
}
/** Où est x, z par rapport à la côte : la distance au rivage, positive sur la terre, négative en mer. */
const cote = (x, z) => (dansPoly(COTE, x, z) ? 1 : -1) * auBordPoly(COTE, x, z);

// le plateau de roche (où l'on marche, au bout du cap) ; chaque bord dit ce qui l'arrête : la corde (corde, au bord de la
// falaise), les buissons (buissons, au pied de la pente), un rocher (roc), rien (le chemin des torii qui y arrive)
// (chaque bord part de son point ; les bords « roc » passent dans les buttes : c'est leur pied qui arrête, dansLeCadre)
const ROC = [
  { p: [-5.9, -28.0], b: 'ligne' }, { p: [-8.3, -28.55], b: 'buissons' }, { p: [-12.6, -28.9], b: 'buissons' }, { p: [-17.4, -30.6], b: 'buissons' },
  { p: [-21.8, -33.6], b: 'roc' }, { p: [-23.6, -39.2], b: 'roc' }, { p: [-21.6, -44.6], b: 'roc' }, { p: [-21.0, -50.4], b: 'corde' },
  { p: [-16.0, -55.6], b: 'corde' }, { p: [-6.0, -55.2], b: 'corde' }, { p: [1.6, -54.4], b: 'corde' }, { p: [7.8, -53.0], b: 'corde' },
  { p: [12.6, -50.2], b: 'corde' }, { p: [15.4, -46.2], b: 'corde' }, { p: [17.2, -42.0], b: 'corde' }, { p: [17.4, -37.4], b: 'corde' },
  { p: [16.0, -33.0], b: 'buissons' }, { p: [11.0, -29.8], b: 'buissons' }, { p: [4.0, -28.2], b: 'buissons' }, { p: [-2.6, -27.8], b: 'buissons' },
];
const ROC_PTS = ROC.map((q) => q.p);
// les buttes de roche mauve, autour du plateau (on n'y monte pas) : [x, z, rx, rz, h (au-dessus du plateau), tour]
const BUTTES = [
  { x: -27.5, z: -43.5, rx: 8.5, rz: 12.5, h: 6.5, ry: 0.12 }, { x: -24.8, z: -32.2, rx: 5.2, rz: 4.6, h: 3.8, ry: 0.5 },
  { x: -6.5, z: -62.5, rx: 9.5, rz: 5.4, h: 4.2, ry: 0.1 }, { x: 12.5, z: -58.5, rx: 5.6, rz: 4.2, h: 3.2, ry: -0.4 },
];
// la crique du souffle du dragon : d'où jaillit la mer ; d'où on la regarde (au bord est du plateau)
const SOUFFLE = { x: 23.3, z: -40.2 };
const BELVEDERE = { x: 16.2, z: -39.6 };
// le pêcheur : 1,2 m au-delà du bord du plateau (85 cm derrière la corde : on lui parle à moins de 1,8 m, depuis le bord), au
// bord de la crique, tourné vers la mer (sa ligne entre dans l'eau 8,4 m devant lui ; 2026-10-29 : au bord nord du plateau, sa
// ligne tombait sur la butte de roche)
const PECHEUR = { x: 17.4, z: -44.57, cap: 1.97 };
// son panneau (国の天然記念物), au bord du plateau, tourné vers lui (l'ouest : son texte regarde vers −z dans son repère)
const PANNEAU_SOUFFLE = { x: 14.0, z: -45.6, ry: PI / 2 + 0.35 };
// des récifs plats au large, où la mer brise : [x, z, rx, rz, tour, hauteur au-dessus de l'eau]
const RECIFS = [
  { x: -57, z: -63, rx: 8, rz: 3.4, ry: 0.4, h: 0.45 }, { x: 40, z: -63, rx: 7, rz: 2.6, ry: -0.3, h: 0.35 }, { x: -64, z: -28, rx: 5, rz: 2.2, ry: 1.1, h: 0.5 },
  { x: 52, z: -36, rx: 4.5, rz: 2, ry: 0.2, h: 0.3 }, { x: 6, z: -90, rx: 6, rz: 2.5, ry: 0.1, h: 0.4 }, { x: -30, z: -86, rx: 4, rz: 1.8, ry: -0.6, h: 0.3 },
];

// ---------------------------------------------------------------- La géométrie du plan
const dansRect = (r, x, z, m = 0) => x >= r.x0 - m && x <= r.x1 + m && z >= r.z0 - m && z <= r.z1 + m;
/** La distance de x, z à un rectangle (0 dedans). */
const versRect = (r, x, z) => Math.hypot(Math.max(0, r.x0 - x, x - r.x1), Math.max(0, r.z0 - z, z - r.z1));
/** Dans le parvis ou le parking ? */
const dansHaut = (x, z, m = 0) => dansRect(PARVIS, x, z, m) || dansRect(PARKING, x, z, m);
/** La distance au parvis, au parking, au palier, au balcon (0 dedans). */
const versHaut = (x, z) => Math.min(versRect(PARVIS, x, z), versRect(PARKING, x, z), versRect(PALIER, x, z), versRect(BALCON, x, z));
/** La distance à la terrasse bâtie (le parvis, le parking, le palier : pas le balcon, sur ses poteaux au-dessus de la pente). */
const versTerrasse = (x, z) => Math.min(versRect(PARVIS, x, z), versRect(PARKING, x, z), versRect(PALIER, x, z));
/**
 * La montée du parvis au parking (0 → 1 : +0,4 m) : une rampe de 2 m dans l'allée de la haie (|x| < 3,4) et au-delà du parvis,
 * à l'est (x > 16, le long de la rampe blanche) ; ailleurs, une marche de 30 cm cachée sous la haie et son muret (2026-10-29 :
 * la rampe faisait 2 m sur toute la largeur, et les lignes des places flottaient jusqu'à 37 cm au-dessus du sol).
 */
function montParking(x, z) {
  const r = Math.max(1 - lisse(2.8, 3.6, Math.abs(x)), lisse(15.4, 16.4, x));
  return r * lisse(PARVIS.z1, PARVIS.z1 + 2, z) + (1 - r) * lisse(PARVIS.z1, PARVIS.z1 + 0.3, z);
}
/** La distance de x, z au bord d'une place en ellipse (négative dedans ; au premier ordre). */
function aLaPlace(p, x, z) {
  const c = Math.cos(p.ry || 0), s = Math.sin(p.ry || 0), u = (x - p.x) * c - (z - p.z) * s, v = (x - p.x) * s + (z - p.z) * c;
  const q = Math.hypot(u / p.rx, v / p.rz);
  return q < 1e-6 ? -Math.min(p.rx, p.rz) : ((q - 1) * q) / Math.hypot(u / (p.rx * p.rx), v / (p.rz * p.rz));
}
/** Où en est x, z dans la butte b : 0 au milieu, 1 au pied (un bord un peu irrégulier). */
function dansButte(b, x, z) {
  const c = Math.cos(b.ry), s = Math.sin(b.ry), u = (x - b.x) * c - (z - b.z) * s, v = (x - b.x) * s + (z - b.z) * c;
  const t = Math.atan2(v / b.rz, u / b.rx);
  return Math.hypot(u / b.rx, v / b.rz) / (1 + 0.1 * Math.sin(t * 3 + b.x) + 0.07 * Math.sin(t * 5 + b.z));
}

// ---------------------------------------------------------------- Le relief
/** Une bosse douce de hauteur h et de rayon r autour de cx, cz. */
const bosse = (x, z, cx, cz, r, h) => { const d = Math.hypot(x - cx, z - cz) / r; return d < 1 ? h * (0.5 + 0.5 * Math.cos(d * PI)) : 0; };
/** Les collines au loin (le pays derrière le cap, le cap d'en face et ses éoliennes) : nulles près du sanctuaire. */
function collines(x, z) {
  const loin = lisse(70, 160, Math.hypot(x, z - 10));
  if (loin <= 0) return 0;
  // (2026-10-29 : les deux collines du cap d'en face reculées vers l'intérieur : elles étaient coupées en deux par la côte, en
  // falaises de 45 m, et leurs éoliennes au bord du vide)
  return loin * (bosse(x, z, 0, 280, 240, 70) + bosse(x, z, -230, 230, 210, 55) + bosse(x, z, 250, 210, 230, 62) + bosse(x, z, 110, 80, 95, 24)
    + bosse(x, z, -130, 70, 90, 16) + bosse(x, z, 345, -160, 120, 46) + bosse(x, z, 420, -280, 110, 44) + bosse(x, z, 200, -40, 120, 26)
    + bosse(x, z, -330, 120, 200, 42) + bosse(x, z, -540, 200, 230, 52) + (bruitDoux(x * 0.03, z * 0.03, 3) - 0.5) * 10);
}
/** La terre avant la côte : le parvis et le parking, la pente du cap (réglée sur le chemin), le plateau de roche, ses buttes. */
function terre(x, z) {
  let h = penteZ(z);
  // au sud du parvis : le parking, puis le talus derrière son mur et la colline
  if (z > PARVIS.z1) h = Y_PARVIS + (Y_PARKING - Y_PARVIS) * montParking(x, z) + 1.9 * lisse(PARKING.z1 + 0.3, PARKING.z1 + 1.2, z) + 6 * lisse(PARKING.z1 + 1.5, PARKING.z1 + 24, z);
  // les flancs du cap : plus bas vers la falaise, à l'ouest et à l'est
  h -= lisse(-22, -44, x) * Math.min(5, Math.max(0, h - 7)) * 0.45 + lisse(36, 56, x) * Math.min(5, Math.max(0, h - 7)) * 0.4;
  // la butte verte dans l'épingle à cheveux du chemin (des buissons dessus)
  h += 1.4 * Math.max(0, 1 - Math.hypot((x - 18.5) / 8.5, (z + 3.2) / 4.6)) ** 1.4;
  // les bosses de la pente, effacées sur les places et près du chemin ; les ondulations du plateau de roche
  const l = surLigne(x, z), loinLigne = lisse(1.4, 5, l.d), haut = versHaut(x, z), roc = dansPoly(ROC_PTS, x, z);
  if (z < 13 && !roc) h += (bruitDoux(x * 0.14, z * 0.14, 3) - 0.5) * 1.6 * loinLigne * lisse(0.5, 4, haut) * lisse(-27, -20, z);
  if (z < -24) h += (bruitDoux(x * 0.2 + 3, z * 0.2, 2) - 0.5) * 0.55 * lisse(1.5, 6, l.d);
  // les buttes de roche mauve
  for (const b of BUTTES) {
    const q = dansButte(b, x, z);
    if (q < 1.15) h = Math.max(h, Y_ROC + b.h * (1 - lisse(0.1, 1.02, q)) ** 0.8 + (bruitDoux(x * 0.5, z * 0.5, 2) - 0.5) * 0.9 * (1 - lisse(0.6, 1.1, q)));
  }
  // le parvis, ses murs de soutènement : le sol 1,6 m plus bas juste au-delà (le haut est une terrasse bâtie sur le cap),
  // sauf sous le palier et le long du chemin ; ailleurs, le pays reprend
  if (z > 8 && z < 50 && x > -40 && x < 60) {
    const d = versTerrasse(x, z), recoin = lisse(1.5, 3.5, aLaPlace(RECOIN, x, z));
    if (d > 0.25 && !(z > PARVIS.z1)) h = Math.min(h, Y_PARVIS - (1.6 * (1 - lisse(9, 22, d)) * lisse(0.25, 0.9, d) * lisse(0.6, 2.2, l.d) + 0.4 * lisse(9, 22, d)) * recoin);
  }
  return h + collines(x, z);
}
/** Le fond de la mer, à d mètres du rivage (d < 0). */
const fond = (d) => -2.4 - 8.6 * lisse(0, 34, -d) - 8 * lisse(34, 220, -d);

function terrain(x, z) {
  const d = cote(x, z);
  let h;
  if (d < -3) h = fond(d);
  else {
    h = terre(x, z);
    // la falaise : de la terre au fond de la mer en quatre mètres
    if (d < 3) { const f = fond(Math.min(0, d - 0.5)); h = f + (h - f) * lisse(-1.4, 3, d); }
  }
  // au pied des falaises, des rochers qui sortent de l'eau ; les récifs plats au large
  if (d > -7 && d < 1.2) {
    const r = Math.max(0, bruitDoux(x * 0.55 + 7, z * 0.55, 2) - 0.56) * 5.5;
    if (r > 0) h = Math.max(h, -0.9 + r);
  }
  for (const r of RECIFS) {
    const c = Math.cos(r.ry), s = Math.sin(r.ry), u = (x - r.x) * c - (z - r.z) * s, v = (x - r.x) * s + (z - r.z) * c, q = Math.hypot(u / r.rx, v / r.rz);
    if (q < 1.3) h = Math.max(h, r.h - 3.2 * lisse(0.7, 1.3, q) + (bruitDoux(x * 0.8, z * 0.8, 2) - 0.5) * 0.35);
  }
  // le chemin des torii : le sol une contremarche sous le dessus des marches (elles sortent de 15 à 20 cm, comme bâties), sous
  // elles et sur leurs côtés, puis la pente ; plus près des marches à ses deux bouts (le palier, le plateau)
  const l = surLigne(x, z);
  if (l.d < DEMI + 2.2 && l.s > -0.2 && l.s < L_LIGNE + 0.8) {
    const bout = Math.min(lisse(0, 2.5, l.s), lisse(L_LIGNE, L_LIGNE - 2.5, l.s)), hl = yLigne(l.s) - 0.06 - (CONTRE + 0.04) * bout;
    h = hl + (h - hl) * lisse(DEMI + 0.5, DEMI + 2.2, l.d);
    // (sous les marches elles-mêmes, toujours sous le dessus de la plus basse des deux voisines : le sol est dessiné 3 cm
    // au-dessus du relief, il aurait couvert les premières marches)
    if (l.d < DEMI + 0.3) {
      const j = Math.floor((l.s - S0 + ESP / 2) / ESP);
      if (j >= 0 && j < N_PLACES) h = Math.min(h, Math.min(yMarche(j), yMarche(Math.min(N_PLACES - 1, j + 1))) - 0.09);
    }
  }
  // le haut : le parvis, le parking, le palier, le balcon (sous lui, le sol est plus bas : il est sur des poteaux), plats
  const dh = Math.min(versRect(PARVIS, x, z), versRect(PARKING, x, z), versRect(PALIER, x, z));
  if (dh < 1.6) {
    const yh = dansRect(PARKING, x, z, 1.6) && z > PARVIS.z1 ? Y_PARVIS + (Y_PARKING - Y_PARVIS) * montParking(x, z) : versRect(PALIER, x, z) < 0.01 ? Y_HAUT : Y_PARVIS;
    if (dh < 0.3) h = yh - 0.03;
    else if (h > yh) h = yh + (h - yh) * lisse(0.3, 1.6, dh);
  }
  // le coin de Bunbuku, à la hauteur du parvis
  { const dq = aLaPlace(RECOIN, x, z); if (dq < 1.4) h = Y_PARVIS - 0.03 + (h - Y_PARVIS + 0.03) * lisse(0, 1.4, dq); }
  // la route qui part vers l'est, plate
  if (z > ROUTE.z0 - 1.5 && z < ROUTE.z1 + 1.5 && x > PARKING.x1 - 0.5 && x < 130) {
    const yr = Y_PARKING + 0.12 * Math.max(0, x - PARKING.x1) * (1 - lisse(60, 130, x)), e = Math.max(ROUTE.z0 - z, z - ROUTE.z1, 0);
    h = yr - 0.03 + (h - yr + 0.03) * lisse(0, 1.5, e);
  }
  return h;
}

// le sol tel que le jeu le dessine (balade.js, terrain) : une grille de 4 m, de 1 m autour du jeu (3 cm plus haut), ses
// cases du bord du plateau et du chemin en 25 cm (solDetaille) ; deux triangles par case, la diagonale de (x1, z0) à (x0, z1)
const ETENDUE = { x0: -720, x1: 720, z0: -720, z1: 720, pas: 4, fin: { x0: -64, x1: 60, z0: -84, z1: 64, pas: 1 } };
const solDetaille = (x0, z0, x1, z1) => {
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  return surLigne(cx, cz).d < DEMI + 1.6 || (dansPoly(ROC_PTS, cx, cz) && auBordPoly(ROC_PTS, cx, cz) < 1.2);
};
const hGrille = new Map();
const hNoeud = (x, z) => { const k = (x + 1024) * 4096 + (z + 1024); let h = hGrille.get(k); if (h === undefined) hGrille.set(k, (h = terrain(x, z))); return h; };
/** La hauteur du sol dessiné en x, z, et la pente de sa facette là. */
function solDessine(x, z) {
  const F = ETENDUE.fin, fine = x >= F.x0 && x < F.x1 && z >= F.z0 && z < F.z1, g = fine ? F : ETENDUE, p = g.pas, leve = fine ? 0.03 : 0;
  const x0 = g.x0 + Math.floor((x - g.x0) / p) * p, z0 = g.z0 + Math.floor((z - g.z0) / p) * p;
  if (fine && solDetaille(x0, z0, x0 + p, z0 + p)) {
    const h = terrain(x, z), d = 0.25;
    return { h: h + leve, pente: Math.hypot(terrain(x + d, z) - h, terrain(x, z + d) - h) / d };
  }
  const fu = (x - x0) / p, fv = (z - z0) / p, ha = hNoeud(x0, z0), hb = hNoeud(x0 + p, z0), hd = hNoeud(x0, z0 + p), hf = hNoeud(x0 + p, z0 + p);
  return fu + fv <= 1 ? { h: ha + (hb - ha) * fu + (hd - ha) * fv + leve, pente: Math.hypot(hb - ha, hd - ha) / p }
    : { h: hf + (hd - hf) * (1 - fu) + (hb - hf) * (1 - fv) + leve, pente: Math.hypot(hf - hd, hf - hb) / p };
}

/**
 * Peut-on être en x, z ? Sur le parvis et le parking, le palier, le balcon, le coin de Bunbuku ; entre les piliers des torii ;
 * sur le plateau de roche. Leurs bords ont tous ce qui arrête (les rampes blanches, la haie, les buissons, la corde, les
 * rochers) : le voyageur, un point, s'arrête 27 cm avant.
 */
function dansLeCadre(x, z) {
  if (dansHaut(x, z) || dansRect(PALIER, x, z) || dansRect(BALCON, x, z) || aLaPlace(RECOIN, x, z) < 0) return true;
  const l = surLigne(x, z);
  if (l.d < DEMI_MARCHE && l.s > 0.05 && l.s < L_LIGNE - 0.05) return true;
  return dansPoly(ROC_PTS, x, z) && !BUTTES.some((b) => dansButte(b, x, z) < 1.02);
}

/** Ce que le carnet et le menu savent du lieu, sans le construire. */
export const infos = {
  id: 'motonosumi', carte: 'motonosumi-shrine', video: '7674375149931547907',
  nom: { en: 'Motonosumi', fr: 'Motonosumi', ja: '元乃隅' }, nomJa: '元乃隅神社',
  tampons: [
    { id: 'vue', motif: 'toriiPente', ja: '鳥居の道', encre: '#c0392b' },
    { id: 'saisen', motif: 'saisen', ja: '賽銭箱', encre: '#8a5a2a', forme: 'carre' },
    { id: 'torii', motif: 'toriiTunnel', ja: '百二十三基', encre: '#b8422b' },
    { id: 'shiofuki', motif: 'shiofuki', ja: '龍宮の潮吹', encre: '#1f6a9a' },
    { id: 'kitsune', motif: 'aburaage', ja: '白狐', encre: '#a8642a', forme: 'carre' },
  ],
  get textes() { return TEXTES; },
};

/** La nuit : les lanternes, les fenêtres de la boutique et du café, l'écran des distributeurs s'allument. */
export const sortesNuit = (P) => ({ [P.shoji]: 'lumiere', [P.shojiCadre]: 'treillis' });

/** Un triangle A, B, C ajouté à pos (et sa couleur à cols), tourné vers n (retourné s'il regarde de l'autre côté). */
function tri(pos, cols, A, B, C, c, n) {
  const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  if (nx * n[0] + ny * n[1] + nz * n[2] < 0) pos.push(...A, ...C, ...B); else pos.push(...A, ...B, ...C);
  cols.push(c);
}

export function construire(ctx) {
  const { THREE, atelier, P } = ctx;
  const objets = [], bancs = [], lumieres = [], animes = [], etiquettes = [], vapeurs = [];
  const monde = creerMonde({ terrain, cadre: dansLeCadre, profond: null, pente: null });
  const poser = (fin, x, z, o = {}) => objets.push({ fin, x, z, y: o.y ?? terrain(x, z), ry: o.ry || 0, ombre: o.ombre !== false, trait: o.trait !== false, dedans: o.dedans, avant: o.avant });
  const ecrire = (o, e) => {
    const c = Math.cos(o.ry || 0), sn = Math.sin(o.ry || 0);
    etiquettes.push({ ...e, x: o.x + e.x * c + e.z * sn, y: o.y + e.y, z: o.z - e.x * sn + e.z * c, ry: (o.ry || 0) + (e.ry || 0) });
  };
  /** Un repère tourné : la pose (x, y, z, ry) d'une pièce donnée dans le repère d'un objet posé en x0, z0, tourné de ry0. */
  // (l'ordre YXZ : rx et rz penchent la pièce dans son propre repère, puis elle tourne avec lui ; en XYZ, le défaut, rx
  // penchait autour de l'axe x du monde : les auvents des boutiques de travers, le toit du sanctuaire, le museau des
  // renards de pierre, 2026-10-29)
  const repere = (x0, z0, ry0) => {
    const c = Math.cos(ry0), s = Math.sin(ry0);
    return (lx, y, lz, o = {}) => ({ ordre: 'YXZ', ...o, x: x0 + lx * c + lz * s, y, z: z0 - lx * s + lz * c, ry: ry0 + (o.ry || 0) });
  };
  /** Une lanterne de pierre (tōrō) d'environ 1,7 m en x, z, allumée la nuit. */
  const lanterne = (a, x, z, y = terrain(x, z)) => {
    a.lanterne(x, z, 6, y);
    lumieres.push({ x, y: y + 1.2, z, halo: 0.42, sol: y, r: 2.6 });
    monde.cercle(x, z, 0.6);
  };
  // le décor en morceaux de 25 m (un objet chacun : la carte graphique dessine moins de petits objets)
  const morceaux = new Map();
  const morceau = (x, z, taille = 25) => {
    const k = `${taille}:${Math.floor(x / taille)},${Math.floor(z / taille)}`;
    if (!morceaux.has(k)) morceaux.set(k, atelier());
    return morceaux.get(k);
  };
  const BLANC_METAL = '#eef0ec', BETON = '#bdb8ad', BETON_FONCE = '#a9a498', ROUGE = P.vermillon, ROUGE_F = P.vermillonFonce;
  /**
   * Un rocher bosselé de rayons rx, ry (haut), rz en x, y, z (le milieu, au ras du sol), tourné de t : un icosaèdre déformé
   * de bosses douces, aplati dessous, peint par couches (rose, beige, mauve, gris ; sombre et mouillé dans l'eau).
   */
  const COUCHES = ['#c9ae98', '#b89c8a', '#a28a8a', '#8e7c87', '#9c8890', '#7d6b77', '#b4a092'];
  const rocher = (a, x, y, z, rx, ry, rz, t, finesse = 2, mouille = false, couches = 0) => {
    const g = hasard(x * 1.31, z * 0.71);
    return a.piece(new THREE.IcosahedronGeometry(1, finesse), COUCHES[3], {
      x, y, z, ry: t, sx: rx, sy: ry, sz: rz, nuance: 0.05,
      deformer: (px, py, pz) => {
        const l = Math.hypot(px, py, pz) || 1, nx = px / l, ny = py / l, nz = pz / l;
        const k = 1 + 0.16 * Math.sin(nx * 3.1 + g * 9) * Math.cos(nz * 2.7 - g * 5) + 0.09 * Math.sin(ny * 6.3 + nx * 2 + g * 3);
        let yy = Math.max(py * k, -0.4);
        // (en couches : la hauteur ramenée vers des gradins, chaque lit un peu plus en retrait que celui du dessous)
        if (couches) { const q = Math.floor((yy + 1) * couches) / couches - 1; yy = q + (yy - q) * 0.35; const r = 1 - 0.06 * (yy + 0.4); return [px * k * r, yy, pz * k * r]; }
        return [px * k, yy, pz * k];
      },
      teinte: (wx, wy, wz) => (mouille && wy < 0.3 ? '#4a4048' : COUCHES[Math.floor(wy * 1.7 + hasard(Math.floor(wx), Math.floor(wz)) * 0.6 + 40) % COUCHES.length]),
    });
  };
  /** Un sotetsu (蘇鉄, le cycas des jardins des sanctuaires du sud) : un tronc court et rugueux, une couronne de palmes raides. */
  const sotetsu = (a, x, y, z, s) => {
    a.fut([x, y - 0.1, z], [x, y + 0.55 * s, z], 0.16 * s, 0.13 * s, '#7a6a52', 7).ovale(0.14 * s, '#6a5a44', { x, y: y + 0.55 * s, z, sy: 0.6 }, 8);
    for (let k = 0; k < 14; k++) {
      const t = (k / 14) * 2 * PI + hasard(x, k) * 0.3, leve = 0.25 + 0.35 * hasard(k, z), L = (0.85 + 0.3 * hasard(z, k)) * s, dx = Math.sin(t), dz = Math.cos(t);
      const base = [x + dx * 0.08 * s, y + 0.6 * s, z + dz * 0.08 * s], mid = [base[0] + dx * L * 0.5, base[1] + L * leve * 0.8, base[2] + dz * L * 0.5];
      a.ovale(L * 0.52, k % 2 ? '#3f6a2e' : '#4a7634', { x: mid[0], y: mid[1], z: mid[2], sx: 0.16, sy: 0.035, sz: 1.0, rx: -(leve - 0.15), ry: t, ordre: 'YXZ', sorte: 'persistant' }, 6);
    }
  };
  /** Un pin noir (黒松) couché par le vent de la mer : un tronc penché d'un seul tenant, des plateaux d'aiguilles sombres. */
  const pinVent = (a, x, y, z, h, sens) => {
    const dx = sens * 0.35, P1 = [x, y - 0.25, z], P2 = [x + dx * 0.3 * h, y + 0.35 * h, z + 0.05 * h], P3 = [x + dx * 0.75 * h, y + 0.62 * h, z + 0.08 * h], P4 = [x + dx * 1.05 * h, y + 0.84 * h, z + 0.12 * h];
    a.tronc([P1, P2, P3, P4], [0.035 * h, 0.028 * h, 0.02 * h, 0.012 * h], '#5a4636', 7);
    for (const [p, r, ang] of [[P2, 0.3, 0.6], [P3, 0.4, -0.4], [P4, 0.36, 0.2], [P3, 0.28, 1.9]]) {
      const c = [p[0] + Math.cos(ang) * r * h * 0.3, p[1] + 0.05 * h, p[2] + Math.sin(ang) * r * h * 0.3];
      a.fut(p, c, 0.012 * h, 0.006 * h, '#5a4636', 5).houppe(r * h * 0.45, '#36592e', { x: c[0], y: c[1], z: c[2], sy: 0.38, bosses: 0.24, sorte: 'conifere' }, 1);
    }
  };
  /** Une touffe de susuki (薄, l'herbe à plumes des falaises) : des feuilles fines qui s'écartent, quelques épis pâles. */
  const susuki = (a, x, y, z, s) => {
    const g = hasard(x, z);
    for (let k = 0; k < 11; k++) {
      const t = (k / 11) * 2 * PI + g * 3, e = 0.15 + 0.35 * hasard(k, g), L = (0.7 + 0.35 * hasard(g, k)) * s, bout = [x + Math.sin(t) * e * L, y + L, z + Math.cos(t) * e * L];
      a.fut([x, y - 0.05, z], bout, 0.014 * s, 0.002, '#9aac5a', 3, { sorte: 'buisson' });
      if (k % 3 === 0) a.ovale(0.05 * s, '#e8dcbc', { x: bout[0], y: bout[1] - 0.06 * s, z: bout[2], sy: 2.6, sorte: 'buisson', trait: false }, 5);
    }
  };
  /** Des murs tout autour d'un rectangle (dans le repère R, ses demi-côtés lx, lz), m au-delà de ce qu'on voit. */
  const murRect = (R, lx, lz, m = 0.27) => {
    const C = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => R(u * (lx + m), 0, v * (lz + m)));
    for (let k = 0; k < 4; k++) monde.mur(C[k].x, C[k].z, C[(k + 1) % 4].x, C[(k + 1) % 4].z, 0.05);
  };
  /** La normale vers le dehors du polygone pts au milieu de son bord i → i + 1 : [nx, nz]. */
  const dehorsPoly = (pts, i) => {
    const [xa, za] = pts[i], [xb, zb] = pts[(i + 1) % pts.length], l = Math.hypot(xb - xa, zb - za) || 1, nx = (zb - za) / l, nz = -(xb - xa) / l;
    return dansPoly(pts, (xa + xb) / 2 + nx * 0.3, (za + zb) / 2 + nz * 0.3) ? [-nx, -nz] : [nx, nz];
  };

  // ---------------------------------------------------------------- Le chemin des torii : les marches, les 123 torii
  // Une marche de béton par place (124 : de la place du 124e aussi), de la largeur du chemin, qui descend dans le sol ; les
  // torii au-dessus, un par place sauf au TROU ; la rampe rouge sur le côté droit en descendant ; sur un pilier sur trois, la
  // plaque du donateur. Le sol de la pente est réglé sur le chemin : les marches y sont posées sans le couper.
  {
    const marches = [];
    for (let j = 0; j < N_PLACES; j++) {
      const s = sPlace(j), [x, z, ang] = pointLigne(s), haut = yMarche(j), bas = Math.min(terrain(x, z), haut) - 0.45;
      // (une marche sur deux 2 cm plus large : bout à bout, leurs côtés auraient été dans le même plan)
      const a = morceau(x, z);
      a.boite(2 * DEMI + 0.2 + (j % 2) * 0.02, haut - bas, ESP + 0.05, j % 2 ? BETON : BETON_FONCE, { x, y: (haut + bas) / 2, z, ry: ang, nuance: 0.05 });
      marches.push([x, z, haut]);
    }
    // le voyageur marche le long de la ligne qui passe au milieu de chaque marche ; au bout, le palier et le plateau
    const [xa, za] = pointLigne(0.02), [xb, zb] = pointLigne(L_LIGNE - 0.02);
    monde.chemin([[xa, za, Y_HAUT], ...marches, [xb, zb, Y_ROC + 0.02]], DEMI_MARCHE, { sol: 'pierre', droits: true });
    // les torii : deux piliers ronds vermillon sur un pied noir, le linteau du haut (kasagi), la traverse (nuki), la petite
    // cale du milieu (gakuzuka) ; 2,3 m au-dessus de leur marche
    const H = 2.3;
    const plaques = [], rampe = [];
    for (let j = 0; j < N_PLACES; j++) {
      const s = sPlace(j), [x, z, ang] = pointLigne(s), y = yMarche(j), c = Math.cos(ang), sn = Math.sin(ang);
      if (j !== TROU) {
        const a = morceau(x, z);
        for (const u of [-1, 1]) {
          const px = x + c * u * D_PILIER, pz = z - sn * u * D_PILIER, yp = Math.min(y, terrain(px, pz)) - 0.12;
          a.cylindre(0.072, 0.082, H + y - yp - 0.02, 8, ROUGE, { x: px, y: (H + y + yp) / 2 - 0.01, z: pz })
            .cylindre(0.098, 0.098, 0.2 + y - yp, 8, P.noir, { x: px, y: (yp + y + 0.2) / 2, z: pz });
          monde.cercle(px, pz, 0.36);
        }
        a.boite(2 * D_PILIER + 0.62, 0.12, 0.17, ROUGE, { x, y: y + H + 0.06, z, ry: ang })
          .boite(2 * D_PILIER + 0.3, 0.09, 0.08, ROUGE_F, { x, y: y + H - 0.4, z, ry: ang })
          .boite(0.07, 0.3, 0.07, ROUGE, { x, y: y + H - 0.2, z, ry: ang });
        if (j % 3 === 1) plaques.push([x - c * (D_PILIER + 0.075), y + 1.35, z + sn * (D_PILIER + 0.075), ang]);
      }
      // (la rampe : à 82 cm des marches, contre le dedans des piliers de droite, en descendant)
      rampe.push([x - c * (DEMI + 0.06), y + 0.82, z + sn * (DEMI + 0.06)]);
    }
    // la rampe rouge, d'un bout à l'autre, et ses pattes (un pilier sur trois)
    {
      const a = morceau(...pointLigne(L_LIGNE / 2).slice(0, 2), 200);
      a.tube(rampe, 0.024, ROUGE, { cotes: 6, pas: N_PLACES * 3 });
      rampe.forEach(([x, y, z], j) => {
        if (j % 3 || j === TROU) return;
        const [, , ang] = pointLigne(sPlace(j)), c = Math.cos(ang), sn = Math.sin(ang);
        a.baton([x, y, z], [x - c * 0.14, y, z + sn * 0.14], 0.012, ROUGE_F, 4);
      });
    }
    // les plaques des donateurs (奉納 et un nom, à l'encre, sur une planchette blanche), contre le dehors du pilier gauche
    for (const [x, y, z, ang] of plaques) {
      const a = morceau(x, z);
      a.boite(0.1, 0.34, 0.012, '#f4efe2', { x, y, z, ry: ang + PI / 2, trait: false });
      for (let k = 0; k < 3; k++) a.boite(0.016, 0.07, 0.004, '#2a2420', { x: x - Math.cos(ang) * 0.007, y: y + 0.1 - k * 0.09, z: z + Math.sin(ang) * 0.007, ry: ang + PI / 2, trait: false });
    }
  }

  // ---------------------------------------------------------------- Le palier et le grand torii (大鳥居)
  // Le grand torii (明神鳥居) : deux gros piliers vermillon sur leur pied noir et leur socle de pierre ; la traverse (nuki) qui
  // les traverse ; le linteau du haut (kasagi) aux bouts relevés, coiffé de cuivre gris ; la cale du milieu (gakuzuka) avec la
  // plaque du nom ; dessous, le tronc des offrandes (賽銭箱), tout en haut ; sur le linteau et la traverse, quatre renards
  // blancs découpés qui courent (comme sur le vrai). Il regarde le chemin (−z) : on lance la pièce depuis le palier.
  {
    const a = atelier(), R = repere(OTORII.x, OTORII.z, 0), y = Y_PARVIS, X = OTORII.demi, H = OTORII.h;
    for (const u of [-1, 1]) {
      a.cylindre(0.2, 0.235, H - 0.42, 14, ROUGE, R(u * X, y + 0.42 + (H - 0.42) / 2, 0))
        .cylindre(0.29, 0.31, 0.48, 14, P.noir, R(u * X, y + 0.24, 0))
        .cylindre(0.4, 0.43, 0.16, 14, P.pierreFonce, R(u * X, y + 0.02, 0));
      monde.cercle(OTORII.x + u * X, OTORII.z, 0.62);
    }
    // la traverse, qui dépasse des piliers ; ses cales
    a.boite(2 * X + 1.0, 0.3, 0.24, ROUGE, R(0, y + 4.25, 0));
    for (const u of [-1, 1]) a.boite(0.36, 0.1, 0.34, ROUGE_F, R(u * X, y + 4.06, 0));
    // le linteau : la poutre du dessous (shimaki), droite ; le kasagi dessus, ses bouts relevés ; son toit de cuivre gris
    a.boite(2 * X + 1.7, 0.3, 0.34, ROUGE, R(0, y + H - 0.1, 0));
    const releve = (lx, ly, lz, k) => [lx, ly + k * (lx / (X + 1.35)) ** 2, lz];
    a.piece(new THREE.BoxGeometry(2 * X + 2.7, 0.3, 0.46, 16, 1, 1), ROUGE, { ...R(0, y + H + 0.2, 0), deformer: (lx, ly, lz) => releve(lx, ly, lz, 0.32) });
    a.piece(new THREE.BoxGeometry(2 * X + 2.86, 0.1, 0.58, 16, 1, 1), '#6f7a74', { ...R(0, y + H + 0.4, 0), deformer: (lx, ly, lz) => releve(lx, ly, lz, 0.34), nuance: 0.03 });
    // la cale du milieu, la plaque (un cadre noir, le fond vert sombre, le nom en or), le tronc dessous
    a.boite(0.3, H - 4.4, 0.24, ROUGE, R(0, y + (4.4 + H - 0.25) / 2, 0));
    a.boite(0.62, 0.84, 0.08, '#1f2420', R(0, y + 5.08, -0.16)).boite(0.5, 0.72, 0.02, '#2f4a3a', R(0, y + 5.08, -0.205, { trait: false }));
    ecrire({ x: OTORII.x, y, z: OTORII.z, ry: 0 }, { texte: '元乃隅神社', vertical: true, x: 0, y: 5.08, z: -0.217, ry: PI, l: 0.36, h: 0.64, fond: null, encre: '#e8c25a' });
    // le tronc des offrandes : une caisse de bois sur une console, ouverte en haut (sa fente noire et ses barreaux), « 賽銭 »
    // en blanc devant
    {
      const zb = TRONC.z - OTORII.z, yb = TRONC.y - y;
      a.boite(0.66, 0.34, 0.36, P.boisFonce, R(0, y + yb, zb, { nuance: 0.05 }))
        .boite(0.7, 0.05, 0.4, P.boisNoir, R(0, y + yb + 0.19, zb))
        .boite(0.56, 0.02, 0.26, '#1e1612', R(0, y + yb + 0.205, zb, { trait: false }))
        .boite(0.26, 0.05, 0.3, P.boisNoir, R(0, y + yb - 0.2, zb + 0.11));
      for (let k = -2; k <= 2; k++) a.boite(0.54, 0.025, 0.025, P.bois, R(0, y + yb + 0.225, zb + k * 0.05, { trait: false }));
      a.boite(0.4, 0.17, 0.012, '#f4efe2', R(0, y + yb + 0.01, zb - 0.186, { trait: false }));
      ecrire({ x: OTORII.x, y, z: OTORII.z, ry: 0 }, { texte: '賽銭', x: 0, y: yb + 0.01, z: zb - 0.193, ry: PI, l: 0.34, h: 0.14, fond: null, encre: '#2a2420' });
    }
    // les renards blancs découpés (une silhouette de renard qui court, épaisse de 3 cm) : deux sur le linteau qui courent vers
    // les bouts, deux qui montent le long de la cale, de chaque côté du tronc
    const renard = new THREE.ExtrudeGeometry(silhouetteRenard(THREE), { depth: 0.03, bevelEnabled: false });
    renard.translate(0, 0, -0.015);
    for (const [lx, ly, s, rz, sx] of [[-1.55, H - 0.1, 0.62, 0.05, -1], [1.55, H - 0.1, 0.62, -0.05, 1], [-0.42, 4.75, 0.5, 1.2, 1], [0.42, 4.75, 0.5, -1.2, -1]]) {
      a.piece(renard.clone(), '#f6f3ea', { ...R(lx, y + ly, -0.23), rz, sx: s * sx, sy: s, sz: 1, nuance: 0.02 });
    }
    poser(a.fin(), 0, 0, { y: 0 });
  }
  // le palier : des dalles de pierre, et ses murs de soutènement (la pente est plus bas de chaque côté)
  {
    const a = atelier(), { x0, x1, z0, z1 } = PALIER;
    a.boite(x1 - x0 + 0.1, 0.08, z1 - z0, '#c4bdae', { x: (x0 + x1) / 2, y: Y_HAUT - 0.03, z: (z0 + z1) / 2, nuance: 0.06 });
    for (const xm of [x0 - 0.12, x1 + 0.12]) {
      const yb = Math.min(terrain(xm - Math.sign(xm) * 0.6, (z0 + z1) / 2), Y_HAUT - 1) - 0.4;
      a.boite(0.26, Y_HAUT - yb, z1 - z0 + 0.24, P.pierreFonce, { x: xm, y: (Y_HAUT + yb) / 2 - 0.02, z: (z0 + z1) / 2, nuance: 0.08 });
    }
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Les rampes blanches, les murs du haut
  // Le parvis, le palier, le balcon et le parking sont une terrasse bâtie sur le cap : un muret de pierre à leur bord, une
  // rampe de tubes blancs dessus (comme au vrai : des rampes blanches au-dessus de la mer) ; le mur arrête 30 cm avant elle.
  /**
   * Une rampe blanche le long de pts [[x, z, y?]…] à la hauteur y (celle du point s'il en a une) ; muret : un muret de pierre
   * dessous, haut de muret. Le mur qui arrête le voyageur suit sa ligne, 30 cm de chaque côté.
   */
  const rampeBlanche = (pts, y, { muret = 0.4 } = {}) => {
    const a = morceau(pts[0][0], pts[0][1], 60), Y = (p) => p[2] ?? y;
    for (let i = 0; i + 1 < pts.length; i++) {
      const [xa, za] = pts[i], [xb, zb] = pts[i + 1], ya = Y(pts[i]), yb = Y(pts[i + 1]), l = Math.hypot(xb - xa, zb - za), ang = Math.atan2(xb - xa, zb - za);
      if (muret) {
        // (un muret sur deux 1 cm plus large et plus haut : bout à bout, ils se recouvrent)
        a.boite(0.3 + (i % 2) * 0.01, muret + 0.4 + (i % 2) * 0.01 + Math.abs(yb - ya), l + 0.3, P.pierre, { x: (xa + xb) / 2, y: (ya + yb) / 2 + (muret - 0.4) / 2, z: (za + zb) / 2, ry: ang, nuance: 0.07 });
      }
      const n = Math.max(1, Math.ceil(l / 1.8));
      for (let k = 0; k <= n; k++) {
        if (k === n && i + 2 < pts.length) continue;
        const f = k / n, x = xa + (xb - xa) * f, z = za + (zb - za) * f, yk = ya + (yb - ya) * f;
        a.cylindre(0.026, 0.026, 1.1, 6, BLANC_METAL, { x, y: yk + muret + 0.55, z });
      }
      for (const hr of [0.55, 1.08]) a.baton([xa, ya + muret + hr, za], [xb, yb + muret + hr, zb], 0.022, BLANC_METAL, 6);
      monde.mur(xa, za, xb, zb, muret ? 0.42 : 0.3);
    }
  };
  // le bord nord du parvis : de son coin ouest au balcon, du balcon au grand torii, du grand torii au coin est ; le bord est,
  // puis le bord nord et est du parking ; le bord ouest, ouvert juste là où le coin de Bunbuku le touche ; les côtés du
  // palier ; le balcon (sur ses poteaux)
  const xT = OTORII.demi + 0.36;
  const ouv = RECOIN.rz * Math.sqrt(1 - ((PARVIS.x0 - RECOIN.x) / RECOIN.rx) ** 2);
  rampeBlanche([[PARVIS.x0, RECOIN.z - ouv], [PARVIS.x0, PARVIS.z0], [BALCON.x0, PARVIS.z0]], Y_PARVIS);
  rampeBlanche([[BALCON.x1, PARVIS.z0], [-xT, PARVIS.z0]], Y_PARVIS);
  rampeBlanche([[xT, PARVIS.z0], [PARVIS.x1, PARVIS.z0], [PARVIS.x1, PARVIS.z1], [PARKING.x1, PARVIS.z1], [PARKING.x1, PARVIS.z1 + 2, Y_PARKING], [PARKING.x1, ROUTE.z0 - 0.2, Y_PARKING]], Y_PARVIS);
  rampeBlanche([[PARVIS.x0, PARVIS.z1], [PARVIS.x0, RECOIN.z + ouv]], Y_PARVIS);
  rampeBlanche([[-xT, PARVIS.z0], [PALIER.x0, PARVIS.z0 - 0.25], [PALIER.x0, PALIER.z0], [-0.85, PALIER.z0]], Y_HAUT, { muret: 0.25 });
  rampeBlanche([[xT, PARVIS.z0], [PALIER.x1, PARVIS.z0 - 0.25], [PALIER.x1, PALIER.z0], [0.85, PALIER.z0]], Y_HAUT, { muret: 0.25 });
  rampeBlanche([[BALCON.x0, PARVIS.z0], [BALCON.x0, BALCON.z0], [BALCON.x1, BALCON.z0], [BALCON.x1, PARVIS.z0]], Y_PARVIS, { muret: 0 });
  // le balcon des photos : un plancher de bois sur des poteaux, au-dessus de la pente ; le panneau « 撮影スポット »
  {
    const a = atelier(), { x0, x1, z0, z1 } = BALCON;
    // (le plancher va jusqu'au bord du parvis, 2 cm dessus : avant, il s'arrêtait 30 cm avant, et l'on marchait en l'air)
    a.boite(x1 - x0, 0.14, z1 - z0 + 0.02, P.planche, { x: (x0 + x1) / 2, y: Y_PARVIS - 0.07, z: (z0 + z1) / 2 + 0.01, nuance: 0.06 });
    for (let k = 0; k < 9; k++) a.boite(0.02, 0.005, z1 - z0, P.plancheFonce, { x: x0 + 0.55 + k * 0.52, y: Y_PARVIS + 0.003, z: (z0 + z1) / 2, trait: false });
    for (const [px, pz] of [[x0 + 0.2, z0 + 0.2], [x1 - 0.2, z0 + 0.2], [x0 + 0.2, z1 - 1.6], [x1 - 0.2, z1 - 1.6], [(x0 + x1) / 2, z0 + 0.2]]) {
      const yb = terrain(px, pz) - 0.3;
      a.boite(0.18, Y_PARVIS - 0.14 - yb, 0.18, BETON_FONCE, { x: px, y: (Y_PARVIS - 0.14 + yb) / 2, z: pz });
    }
    monde.surface(x0, x1, z0, z1, Y_PARVIS, { sol: 'bois' });
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Le parvis : le sanctuaire, les renards, le bureau
  {
    const a = atelier();
    // la petite maison de pierre (石祠) dans sa clôture rouge (玉垣) aux planches pointues, sous son abri (覆屋) : quatre poteaux
    // rouges, un toit à deux pans de tôle gris-bleu, comme au vrai ; tournée vers l'est (le parvis). Dedans, sur le gravier
    // blanc : la maison de pierre sur son socle, son toit de pierre aux coins relevés, ses portes ; devant elle, la table des
    // offrandes (le saké, le riz, les branches de sakaki, deux petits renards de céramique), la cloche et sa corde rouge et
    // blanche, la corde sacrée et ses papiers. Devant la porte de la clôture, le tronc des offrandes et sa grille (2026-10-29,
    // refait : « le petit sanctuaire en haut » ; c'était un toit plat de travers sur une boîte)
    const ryH = PI / 2, R = repere(HONDEN.x, HONDEN.z, ryH), y = Y_PARVIS;
    const LX = 1.7, LZ = 1.5, NOIR_T = '#2e2a2c';
    // le gravier blanc du dedans
    a.boite(2 * LX - 0.1, 0.02, 2 * LZ - 0.1, P.gravier, R(0, y + 0.01, 0, { trait: false }));
    // la clôture : des planches rouges à la pointe triangulaire, deux traverses dehors ; des poteaux plus gros aux coins, leur
    // chapeau noir ; la porte (deux poteaux hauts, leur linteau)
    const cloture = (lx0, lz0, lx1, lz1, nx, nz) => {
      const l = Math.hypot(lx1 - lx0, lz1 - lz0), n = Math.max(2, Math.round(l / 0.13)), ang = Math.atan2(lx1 - lx0, lz1 - lz0);
      for (let k = 1; k < n; k++) {
        const f = k / n, px = lx0 + (lx1 - lx0) * f, pz = lz0 + (lz1 - lz0) * f;
        a.boite(0.085, 0.95, 0.028, k % 2 ? ROUGE : ROUGE_F, R(px, y + 0.475, pz, { ry: ang + PI / 2 })).pignon(0.028, 0.07, 0.085, k % 2 ? ROUGE : ROUGE_F, R(px, y + 0.95, pz, { ry: ang + PI }));
      }
      for (const hb of [0.22, 0.76]) a.boite(0.045, 0.07, l - 0.1, ROUGE_F, R((lx0 + lx1) / 2 + nx * 0.037, y + hb, (lz0 + lz1) / 2 + nz * 0.037, { ry: ang }));
    };
    cloture(-LX, -LZ, LX, -LZ, 0, -1); cloture(-LX, -LZ, -LX, LZ, -1, 0); cloture(LX, -LZ, LX, LZ, 1, 0); cloture(-LX, LZ, -0.69, LZ, 0, 1); cloture(0.69, LZ, LX, LZ, 0, 1);
    for (const [u, v] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      a.boite(0.12, 1.12, 0.12, ROUGE, R(u * LX, y + 0.56, v * LZ)).cone(0.1, 0.09, 4, NOIR_T, R(u * LX, y + 1.165, v * LZ, { ry: PI / 4 }));
    }
    for (const u of [-1, 1]) a.boite(0.14, 1.55, 0.14, ROUGE, R(u * 0.62, y + 0.775, LZ)).cone(0.11, 0.09, 4, NOIR_T, R(u * 0.62, y + 1.595, LZ, { ry: PI / 4 }));
    a.boite(1.62, 0.09, 0.13, ROUGE, R(0, y + 1.42, LZ)).boite(1.66, 0.025, 0.15, NOIR_T, R(0, y + 1.4775, LZ));
    // l'abri : quatre poteaux ronds, leurs traverses en haut, le toit à deux pans (le faîte le long de la façade), la tôle à
    // joints debout, les planches rouges des pignons, le faîtage
    const PX = LX - 0.3, PZ = LZ - 0.32, HP = 2.15, RHr = 0.5, EVr = 0.42, ang = Math.atan2(RHr, PZ), co = Math.cos(ang), si = Math.sin(ang);
    const TOLE = '#46505c', TOLE2 = '#56606c';
    for (const [u, v] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) a.cylindre(0.065, 0.07, HP, 10, ROUGE, R(u * PX, y + HP / 2, v * PZ));
    for (const v of [-1, 1]) a.boite(2 * PX + 0.2, 0.12, 0.09, ROUGE, R(0, y + HP - 0.08, v * PZ));
    for (const u of [-1, 1]) a.boite(0.09, 0.12, 2 * PZ + 0.2, ROUGE_F, R(u * PX, y + HP - 0.1, 0));
    {
      const larg = 2 * PX + 0.7, Lp = (PZ + EVr) / co, ybt = (z) => y + HP + 0.02 + RHr * (1 - Math.abs(z) / PZ);
      for (const sens of [1, -1]) {
        const zc = (sens * (PZ + EVr)) / 2, yc = ybt(zc) + 0.035 / co, q = { rx: sens * ang };
        a.boite(larg, 0.07, Lp, TOLE, R(0, yc, zc, { ...q, nuance: 0.03 }));
        const dy = 0.05 * co, dz = sens * 0.05 * si;
        for (let x = -larg / 2 + 0.1; x < larg / 2 - 0.05; x += 0.2) a.boite(0.025, 0.03, Lp - 0.02, TOLE2, R(x, yc + dy, zc + dz, { ...q, trait: false }));
        for (const u of [-1, 1]) a.boite(0.04, 0.16, Lp + 0.05, ROUGE, R(u * (larg / 2 + 0.02), yc - 0.03, zc, q));
        const ze = sens * (PZ + EVr);
        a.boite(larg + 0.02, 0.12, 0.035, ROUGE_F, R(0, ybt(ze) + 0.02, ze + sens * 0.025));
      }
      a.boite(larg + 0.04, 0.1, 0.16, NOIR_T, R(0, y + HP + 0.02 + RHr + 0.08 / co, 0));
      // les pignons, de bois rouge sous le toit
      for (const u of [-1, 1]) a.pignon(0.04, RHr - 0.02, 2 * PZ, ROUGE_F, R(u * PX, y + HP + 0.02, 0, { trait: false }));
    }
    // la maison de pierre : le socle en deux assises, le corps, le cadre et les deux portes, le toit de pierre aux coins
    // relevés, le joyau du sommet
    const PIERRE_CL = '#b8b1a2', PIERRE_TOIT = '#9a9384';
    a.boite(1.3, 0.26, 1.1, P.pierreFonce, R(0, y + 0.13, -0.35, { nuance: 0.07 })).boite(1.04, 0.2, 0.86, P.pierre, R(0, y + 0.36, -0.35, { nuance: 0.07 }))
      .boite(0.7, 0.68, 0.6, PIERRE_CL, R(0, y + 0.8, -0.35, { nuance: 0.06 }))
      .boite(0.46, 0.5, 0.02, '#8a8476', R(0, y + 0.8, -0.04, { trait: false })).boite(0.4, 0.44, 0.02, '#3a3430', R(0, y + 0.8, -0.03, { trait: false }))
      .boite(0.012, 0.44, 0.015, '#8a8476', R(0, y + 0.8, -0.02, { trait: false }));
    for (const u of [-1, 1]) a.boule(0.018, P.or, R(u * 0.05, y + 0.8, -0.015, { trait: false }), 0);
    a.toitJapon(1.12, 1.0, 0.3, 0.2, { ...R(0, y + 1.14, -0.35), tuile: PIERRE_TOIT, tuile2: '#a39d8f', bord: '#8a8476', rangs: 6, releve: 0.06, epaisseur: 0.05 })
      .boite(0.74, 0.06, 0.64, PIERRE_TOIT, R(0, y + 1.17, -0.35, { trait: false }))
      .boule(0.08, PIERRE_TOIT, R(0, y + 1.5, -0.35), 1).cone(0.035, 0.08, 8, PIERRE_TOIT, R(0, y + 1.6, -0.35));
    // la table des offrandes : le saké (deux bouteilles blanches), le riz, deux petits renards blancs ; le sakaki dans ses vases
    a.boite(0.74, 0.04, 0.36, P.bois, R(0, y + 0.6, 0.38)).boite(0.04, 0.58, 0.32, P.bois, R(-0.33, y + 0.29, 0.38)).boite(0.04, 0.58, 0.32, P.bois, R(0.33, y + 0.29, 0.38));
    for (const u of [-1, 1]) {
      a.cylindre(0.038, 0.045, 0.14, 8, '#f4f0e6', R(u * 0.18, y + 0.69, 0.3)).cylindre(0.017, 0.022, 0.06, 6, '#f4f0e6', R(u * 0.18, y + 0.79, 0.3));
      a.ovale(0.045, '#f6f3ea', R(u * 0.06, y + 0.66, 0.34, { sy: 1.4 }), 8).cone(0.012, 0.04, 4, '#f6f3ea', R(u * 0.06 + 0.015, y + 0.74, 0.34)).cone(0.012, 0.04, 4, '#f6f3ea', R(u * 0.06 - 0.015, y + 0.74, 0.34));
      a.cylindre(0.035, 0.03, 0.12, 8, '#f4f0e6', R(u * 0.31, y + 0.68, 0.3)).houppe(0.1, '#3f6a34', { ...R(u * 0.31, y + 0.83, 0.3), sy: 1.3, sorte: 'persistant' }, 0);
    }
    a.cylindre(0.065, 0.05, 0.03, 10, '#f4f0e6', R(0, y + 0.635, 0.47, { trait: false })).ovale(0.042, '#fbf8ee', R(0, y + 0.655, 0.47, { sy: 0.6, trait: false }), 6);
    // la cloche (鈴) sous la traverse de devant, sa corde rouge et blanche ; la corde sacrée (注連縄) et ses papiers (紙垂)
    {
      const zb = PZ, zc = PZ + 0.13;
      // (la cloche devant la traverse, à son crochet ; la corde rouge à bandes blanches)
      const h0 = R(0, y + HP - 0.13, PZ + 0.05), h1 = R(0, y + HP - 0.16, zc);
      a.baton([h0.x, h0.y, h0.z], [h1.x, h1.y, h1.z], 0.008, '#3a3a40', 4, { trait: false });
      a.boule(0.1, P.or, R(0, y + HP - 0.26, zc), 1).boite(0.12, 0.012, 0.012, '#5a4020', R(0, y + HP - 0.32, zc + 0.09, { trait: false }));
      const c0 = R(0, y + HP - 0.36, zc), c1 = R(0, y + 0.85, zc);
      a.baton([c0.x, c0.y, c0.z], [c1.x, c1.y, c1.z], 0.03, '#c8302c', 6);
      for (let yb = y + 0.95; yb < y + HP - 0.45; yb += 0.16) a.cylindre(0.034, 0.034, 0.04, 6, '#f4f0e6', R(0, yb, zc, { trait: false }));
      const T3 = (lx, ly) => { const p = R(lx, ly, zb + 0.06); return [p.x, p.y, p.z]; };
      a.tube([T3(-PX + 0.05, y + HP - 0.16), T3(-PX * 0.5, y + HP - 0.24), T3(0, y + HP - 0.27), T3(PX * 0.5, y + HP - 0.24), T3(PX - 0.05, y + HP - 0.16)], 0.045, '#d8c48a', { cotes: 7, pas: 18 });
      for (const lx of [-PX * 0.62, -PX * 0.2, PX * 0.2, PX * 0.62]) {
        for (let k = 0; k < 3; k++) a.boite(0.06, 0.08, 0.006, '#fbfaf4', R(lx + (k % 2 ? 0.025 : -0.025), y + HP - 0.33 - k * 0.07, zb + 0.09, { rz: k % 2 ? -0.3 : 0.3, trait: false }));
      }
    }
    // le tronc des offrandes (賽銭箱), devant la porte : la caisse sombre, le cadre, la grille de lattes en V par où tombent
    // les pièces, le mot 賽銭
    {
      const zt = LZ + 0.75;
      a.boite(0.66, 0.38, 0.4, P.boisFonce, R(0, y + 0.19, zt, { nuance: 0.05 })).boite(0.72, 0.05, 0.46, P.boisNoir, R(0, y + 0.405, zt));
      for (let k = -2; k <= 2; k++) a.pignon(0.58, 0.05, 0.06, P.bois, R(0, y + 0.44, zt + k * 0.075, { rx: PI, trait: false }));
      const q = R(0, 0, zt);
      ecrire({ x: q.x, y, z: q.z, ry: ryH }, { texte: '賽銭', x: 0, y: 0.2, z: 0.204, l: 0.34, h: 0.15, fond: null, encre: '#f3cf6a' });
    }
    // (des murs le long de la clôture, 27 cm au-delà ; le tronc)
    {
      const C = [[-LX - 0.27, -LZ - 0.27], [LX + 0.27, -LZ - 0.27], [LX + 0.27, LZ + 0.27], [-LX - 0.27, LZ + 0.27]].map(([u, v]) => R(u, 0, v));
      for (let k = 0; k < 4; k++) monde.mur(C[k].x, C[k].z, C[(k + 1) % 4].x, C[(k + 1) % 4].z, 0.05);
      const t = R(0, 0, LZ + 0.75);
      murRect(repere(t.x, t.z, ryH), 0.36, 0.23);
    }
    // les deux renards de pierre, assis sur leur piédestal de part et d'autre de l'allée, tournés l'un vers l'autre ; le
    // bavoir rouge ; l'un la clé du grenier à riz dans la gueule, l'autre le joyau
    for (const u of [-1, 1]) {
      const q = R(u * 1.55, 0, LZ + 2.1), yp = y, Rf = repere(q.x, q.z, ryH - u * 0.55);
      const PIERRE_RENARD = '#ece8de';
      a.boite(0.56, 0.78, 0.56, P.pierreFonce, Rf(0, yp + 0.39, 0, { nuance: 0.07 })).boite(0.64, 0.08, 0.64, P.pierre, Rf(0, yp + 0.82, 0));
      const yt = yp + 0.86;
      a.ovale(0.18, PIERRE_RENARD, { ...Rf(0, yt + 0.16, -0.04), sx: 1.05, sz: 1.2 }, 12)
        .ovale(0.12, PIERRE_RENARD, { ...Rf(0, yt + 0.37, 0.05, { rx: -0.15 }), sx: 0.95, sy: 1.5, sz: 0.95 }, 10)
        .ovale(0.095, PIERRE_RENARD, { ...Rf(0, yt + 0.58, 0.08), sz: 1.05 }, 10)
        .cone(0.045, 0.16, 6, PIERRE_RENARD, Rf(0, yt + 0.56, 0.22, { rx: PI / 2 }));
      for (const w of [-1, 1]) {
        a.cone(0.036, 0.14, 4, PIERRE_RENARD, Rf(w * 0.05, yt + 0.7, 0.06, { rz: -w * 0.25 }));
        const e0 = Rf(w * 0.055, yt + 0.3, 0.13), e1 = Rf(w * 0.055, yt + 0.02, 0.14);
        a.baton([e0.x, e0.y, e0.z], [e1.x, e1.y, e1.z], 0.03, PIERRE_RENARD, 6);
      }
      const T3 = (lx, ly, lz) => { const p = Rf(lx, yt + ly, lz); return [p.x, p.y, p.z]; };
      a.tube([T3(0, 0.09, -0.19), T3(0, 0.31, -0.3), T3(0, 0.53, -0.25), T3(0, 0.66, -0.11)], 0.052, PIERRE_RENARD, { cotes: 7, pas: 12 });
      a.ovale(0.11, ROUGE, { ...Rf(0, yt + 0.44, 0.13, { rx: -0.3 }), sy: 0.55, sz: 0.55 }, 10);
      if (u < 0) a.boite(0.17, 0.024, 0.024, '#d8b04a', Rf(0, yt + 0.53, 0.28));
      else a.boule(0.04, '#d8b04a', { ...Rf(0, yt + 0.53, 0.29) }, 1);
      monde.cercle(q.x, q.z, 0.62);
    }
    // deux bannières rouges (正一位稲荷大明神) derrière la clôture, de chaque côté
    for (const u of [-1, 1]) {
      const q0 = R(u * 2.3, y - 0.1, -1.0), q1 = R(u * 2.3, y + 2.6, -1.0), b0 = R(u * 2.3, y + 2.46, -1.0), b1 = R(u * 2.68, y + 2.46, -1.0);
      a.baton([q0.x, q0.y, q0.z], [q1.x, q1.y, q1.z], 0.026, P.boisFonce, 6).baton([b0.x, b0.y, b0.z], [b1.x, b1.y, b1.z], 0.015, P.boisFonce, 5);
      a.boite(0.34, 1.5, 0.012, '#c8402c', R(u * 2.49, y + 1.7, -1.0));
      const q = R(u * 2.49, 0, -1.0);
      ecrire({ x: q.x, y, z: q.z, ry: ryH }, { texte: '正一位稲荷大明神', vertical: true, x: 0, y: 1.7, z: 0.008, l: 0.25, h: 1.4, fond: null, encre: '#fff4e8' });
      monde.cercle(q.x, q.z, 0.48);
    }
    poser(a.fin(), 0, 0, { y: 0 });
  }
  {
    // le petit sanctuaire au torii rouge, à l'ouest, près du balcon (comme au vrai : une petite maison de pierre dans sa
    // clôture rouge, un torii rouge devant, des sotetsu autour)
    const a = atelier(), ry = PI / 2 + 0.25, R = repere(PETIT.x, PETIT.z, ry), y = Y_PARVIS;
    const LX = 0.85, LZ = 0.75;
    for (const [lx0, lz0, lx1, lz1] of [[-LX, -LZ, LX, -LZ], [-LX, -LZ, -LX, LZ], [LX, -LZ, LX, LZ], [-LX, LZ, LX, LZ]]) {
      const l = Math.hypot(lx1 - lx0, lz1 - lz0), n = Math.round(l / 0.15), ang = Math.atan2(lx1 - lx0, lz1 - lz0);
      for (let k = 0; k <= n; k++) { const f = k / n; a.boite(0.08, 0.9, 0.025, k % 2 ? ROUGE : ROUGE_F, R(lx0 + (lx1 - lx0) * f, y + 0.45, lz0 + (lz1 - lz0) * f, { ry: ang + PI / 2 })); }
      a.boite(0.1, 0.04, l + 0.1, ROUGE, R((lx0 + lx1) / 2, y + 0.92, (lz0 + lz1) / 2, { ry: ang }));
    }
    a.boite(1.9, 0.08, 1.7, BETON, R(0, y - 0.02, 0));
    a.boite(0.42, 0.42, 0.36, '#b8b1a2', R(0, y + 0.55, -0.1)).pignon(0.66, 0.22, 0.58, '#9a9384', R(0, y + 0.76, -0.1));
    // (2026-10-29) son petit abri, comme celui du grand : quatre poteaux rouges, un toit à deux pans de tôle gris-bleu
    {
      const PX = LX - 0.16, PZ = LZ - 0.16, HP = 1.55, RHr = 0.3, EVr = 0.28, ang = Math.atan2(RHr, PZ), co = Math.cos(ang), si = Math.sin(ang), larg = 2 * PX + 0.4, Lp = (PZ + EVr) / co;
      for (const [u, v] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) a.cylindre(0.045, 0.05, HP, 8, ROUGE, R(u * PX, y + HP / 2, v * PZ));
      for (const v of [-1, 1]) a.boite(2 * PX + 0.14, 0.09, 0.07, ROUGE, R(0, y + HP - 0.06, v * PZ));
      const ybt = (z) => y + HP + 0.015 + RHr * (1 - Math.abs(z) / PZ);
      for (const sens of [1, -1]) {
        const zc = (sens * (PZ + EVr)) / 2, yc = ybt(zc) + 0.03 / co, q = { rx: sens * ang };
        a.boite(larg, 0.06, Lp, '#46505c', R(0, yc, zc, { ...q, nuance: 0.03 }));
        for (let x = -larg / 2 + 0.09; x < larg / 2 - 0.05; x += 0.18) a.boite(0.022, 0.025, Lp - 0.02, '#56606c', R(x, yc + 0.04 * co, zc + sens * 0.04 * si, { ...q, trait: false }));
        for (const u of [-1, 1]) a.boite(0.035, 0.12, Lp + 0.04, ROUGE, R(u * (larg / 2 + 0.017), yc - 0.02, zc, q));
      }
      a.boite(larg + 0.03, 0.08, 0.12, '#2e2a2c', R(0, y + HP + 0.015 + RHr + 0.07 / co, 0));
      for (const u of [-1, 1]) a.pignon(0.035, RHr - 0.015, 2 * PZ, ROUGE_F, R(u * PX, y + HP + 0.015, 0, { trait: false }));
    }
    // le torii rouge devant
    const tz = LZ + 0.9;
    for (const u of [-1, 1]) a.cylindre(0.055, 0.06, 2.0, 8, ROUGE, R(u * 0.62, y + 1.0, tz)).cylindre(0.075, 0.075, 0.14, 8, P.noir, R(u * 0.62, y + 0.07, tz));
    a.boite(1.7, 0.1, 0.13, ROUGE, R(0, y + 2.03, tz)).boite(1.45, 0.07, 0.07, ROUGE_F, R(0, y + 1.66, tz));
    for (const u of [-1, 1]) { const q = R(u * 0.62, 0, tz); monde.cercle(q.x, q.z, 0.33); }
    { const C = [[-LX - 0.27, -LZ - 0.27], [LX + 0.27, -LZ - 0.27], [LX + 0.27, LZ + 0.27], [-LX - 0.27, LZ + 0.27]].map(([u, v]) => R(u, 0, v)); for (let k = 0; k < 4; k++) monde.mur(C[k].x, C[k].z, C[(k + 1) % 4].x, C[(k + 1) % 4].z, 0.05); }
    poser(a.fin(), 0, 0, { y: 0 });
  }
  {
    // le bureau des porte-bonheur (社務所) : une petite maison blanche au toit de tuiles, son guichet tourné vers l'ouest (le
    // parvis) ; dessous, le comptoir et ses porte-bonheur blancs, les plaquettes de vœux (絵馬) en tête de renard ; la miko
    // derrière le comptoir ; à côté, le présentoir des plaquettes accrochées
    const a = atelier(), B = BUREAU, R = repere(B.x, B.z, -PI / 2), y = Y_PARVIS;
    a.boite(B.p, 0.3, B.l, P.pierreFonce, R(0, y - 0.1, 0));
    a.boite(B.p - 0.2, 2.5, B.l - 0.2, '#f2eee4', R(0, y + 1.25, 0, { nuance: 0.03 }));
    for (const [u, v] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) a.boite(0.14, 2.6, 0.14, P.boisFonce, R(u * (B.p / 2 - 0.1), y + 1.3, v * (B.l / 2 - 0.1)));
    a.toitJapon(B.p + 1.3, B.l + 1.2, 0.95, 0.35, { ...R(0, y + 2.5, 0), tuile: P.tuileShiro, tuile2: P.tuileShiroClaire, bord: '#4a4a4e', rangs: 12 });
    // le guichet (vers +z dans son repère, l'ouest) : la vitre sombre, le cadre, l'enseigne « 授与所 »
    a.boite(2.6, 1.2, 0.04, '#3a3a40', R(0, y + 1.3, B.l / 2 - 0.08, { trait: false })).boite(2.8, 0.1, 0.08, P.boisFonce, R(0, y + 1.95, B.l / 2 - 0.04)).boite(2.8, 0.1, 0.08, P.boisFonce, R(0, y + 0.66, B.l / 2 - 0.04));
    a.boite(1.2, 0.34, 0.05, P.bois, R(0, y + 2.28, B.l / 2 - 0.02));
    { const q = R(0, 0, B.l / 2); ecrire({ x: q.x, y, z: q.z, ry: -PI / 2 }, { texte: '授与所', x: 0, y: 2.28, z: 0.012, l: 1.0, h: 0.26, fond: null, encre: '#2a2420' }); }
    // le comptoir devant, et ses porte-bonheur blancs ; la miko est derrière
    a.boite(2.4, 0.9, 0.5, P.bois, R(0, y + 0.45, B.l / 2 + 1.0, { nuance: 0.05 })).boite(2.5, 0.05, 0.6, P.boisFonce, R(0, y + 0.92, B.l / 2 + 1.0));
    for (let k = 0; k < 7; k++) a.boite(0.07, 0.11, 0.015, k % 3 === 1 ? '#c8402c' : '#f6f3ea', R(-0.9 + k * 0.3, y + 1.0, B.l / 2 + 0.92, { rx: -0.3, trait: false }));
    for (let k = 0; k < 4; k++) a.ovale(0.06, '#f4efe6', R(-0.7 + k * 0.45, y + 0.99, B.l / 2 + 1.15, { sx: 1.1, sy: 0.35 }), 8);
    // (la maison : un bloc plein, 27 cm au-delà ; le comptoir : un mur)
    { const C = [[-B.p / 2 - 0.27, -B.l / 2 - 0.27], [B.p / 2 + 0.27, -B.l / 2 - 0.27], [B.p / 2 + 0.27, B.l / 2 + 0.27], [-B.p / 2 - 0.27, B.l / 2 + 0.27]].map(([u, v]) => R(u, 0, v)); monde.surface(Math.min(...C.map((q) => q.x)), Math.max(...C.map((q) => q.x)), Math.min(...C.map((q) => q.z)), Math.max(...C.map((q) => q.z)), y + 3.2, { plein: true }); }
    { const c = R(0, 0, B.l / 2 + 1.0); murRect(repere(c.x, c.z, -PI / 2), 1.25, 0.3); }
    monde.bloc(B.x - B.l / 2, B.x + B.l / 2, B.z - B.p / 2, B.z + B.p / 2, y - 1, y + 3.4);
    poser(a.fin(), 0, 0, { y: 0 });
  }
  {
    // le présentoir des plaquettes de vœux (絵馬掛け) : des plaquettes blanches en tête de renard, pendues à des barres ;
    // la fontaine des ablutions (手水舎) : un bassin de pierre sous un petit toit, ses louches ; les lanternes de pierre
    const a = atelier(), y = Y_PARVIS;
    {
      const R = repere(6.4, 19.6, -PI / 2 + 0.15);
      for (const u of [-1, 1]) a.boite(0.1, 1.9, 0.1, P.boisFonce, R(u * 1.1, y + 0.95, 0));
      a.pignon(2.7, 0.3, 0.7, P.toit, R(0, y + 1.9, 0));
      for (const hb of [1.0, 1.45]) {
        a.boite(2.2, 0.05, 0.05, P.bois, R(0, y + hb + 0.1, 0));
        for (let k = 0; k < 9; k++) {
          const lx = -0.95 + k * 0.24 + (hasard(k, hb) - 0.5) * 0.04;
          a.boite(0.15, 0.13, 0.012, '#f6f3ea', R(lx, y + hb, 0.03 + (k % 2) * 0.006, { rz: (hasard(hb, k) - 0.5) * 0.25, trait: false }));
          a.cone(0.022, 0.05, 3, '#f6f3ea', R(lx - 0.04, y + hb + 0.08, 0.03, { trait: false })).cone(0.022, 0.05, 3, '#f6f3ea', R(lx + 0.04, y + hb + 0.08, 0.03, { trait: false }));
          a.boite(0.02, 0.012, 0.004, '#c8402c', R(lx, y + hb - 0.015, 0.04 + (k % 2) * 0.006, { trait: false }));
        }
      }
      murRect(R, 1.15, 0.08);
    }
    {
      const R = repere(3.6, 27.4, PI);
      for (const [u, v] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) a.boite(0.12, 2.2, 0.12, P.boisFonce, R(u * 0.95, y + 1.1, v * 0.7));
      a.toitJapon(2.6, 2.1, 0.7, 0.3, { ...R(0, y + 2.2, 0), tuile: P.tuileShiro, tuile2: P.tuileShiroClaire, bord: '#4a4a4e', rangs: 9 });
      a.boite(1.3, 0.62, 0.7, P.pierre, R(0, y + 0.31, 0, { nuance: 0.08 })).boite(1.1, 0.03, 0.5, '#5aa0a8', R(0, y + 0.6, 0, { trait: false }));
      a.cylindre(0.012, 0.012, 1.2, 5, P.bois, R(0, y + 0.66, -0.3, { rz: PI / 2 }));
      for (let k = 0; k < 4; k++) a.cylindre(0.03, 0.03, 0.06, 8, P.bois, R(-0.36 + k * 0.24, y + 0.7, -0.3));
      // (les poteaux et le bassin, pas un mur tout autour : on vient se tenir devant le bassin, sous le toit ; le mur d'avant
      // frôlait les poteaux, et plus large, il laissait un mur invisible entre eux)
      for (const [u, v] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const q = R(u * 0.95, 0, v * 0.7); monde.cercle(q.x, q.z, 0.36); }
      murRect(R, 0.65, 0.35);
    }
    for (const [x, z] of [[-3.4, 17.6], [3.4, 17.6], [-4.6, 28.2], [4.6, 28.2]]) lanterne(a, x, z, y);
    poser(a.fin(), 0, 0, { y: 0 });
  }
  {
    // le panneau de l'histoire du sanctuaire (由緒), au bord du parvis, tourné vers l'arrivée ; le panneau du balcon
    const PAN = [{ id: 'yuisho', x: -6.6, z: 29.4, ry: 0 }, { id: 'photo', x: -6.2, z: 15.6, ry: PI - 0.4 }];
    for (const p of PAN) {
      const y = Y_PARVIS, b = panneau(atelier(), P, { ecrit: true });
      poser(b.fin(), p.x, p.z, { y, ry: p.ry });
      ecrire({ x: p.x, y, z: p.z, ry: p.ry }, { ...PAPIER_PANNEAU, texte: TITRES_PANNEAUX[p.id], fond: '#fff8e8', encre: '#2a2420', lignes: 2 });
      const cx = Math.cos(p.ry) * 0.6, cz = -Math.sin(p.ry) * 0.6;
      monde.mur(p.x - cx, p.z - cz, p.x + cx, p.z + cz, 0.5);
    }
  }
  // les bancs du parvis, au bord nord, face à la mer
  {
    const a = atelier();
    for (const xb of [7.2, 11.8]) {
      const zb = PARVIS.z0 + 1.05, y = Y_PARVIS;
      a.boite(1.8, 0.07, 0.42, P.bois, { x: xb, y: y + 0.44, z: zb }).boite(1.8, 0.3, 0.05, P.bois, { x: xb, y: y + 0.72, z: zb + 0.22, rx: 0.15 });
      for (const u of [-1, 1]) a.boite(0.06, 0.44, 0.4, P.boisFonce, { x: xb + u * 0.78, y: y + 0.22, z: zb });
      bancs.push({ de: [xb - 0.75, zb], a: [xb + 0.75, zb], y: y + 0.475, cap: PI });
      murRect(repere(xb, zb + 0.05, 0), 0.9, 0.25);
    }
    poser(a.fin(), 0, 0, { y: 0 });
  }
  // la séparation du parvis et du parking : une haie basse taillée, une ouverture au milieu (l'allée)
  {
    const a = atelier(), y = Y_PARVIS, z = PARVIS.z1;
    for (const [xa, xb] of [[PARVIS.x0, -3.4], [3.4, PARVIS.x1]]) {
      // (un muret de 45 cm, la haie taillée dessus jusqu'à ses bouts : c'est ce qui arrête, jusqu'au bout)
      a.boite(xb - xa, 0.5, 0.5, P.pierreFonce, { x: (xa + xb) / 2, y: y + 0.2, z, nuance: 0.08 });
      for (let x = xa + 0.4; x < xb - 0.1; x += 0.8) a.houppe(0.48, '#4f7d3c', { x: Math.min(x, xb - 0.42), y: y + 0.72, z, sy: 0.7, sorte: 'buisson' }, 1);
      murRect(repere((xa + xb) / 2, z, 0), (xb - xa) / 2, 0.25);
    }
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Le parking, la boutique, le café, l'arrêt de bus
  {
    const a = atelier(), y = Y_PARKING;
    // les lignes blanches des places, peintes sur le sol plat du parking (7 mm au-dessus : elles flottaient à 3,5 cm, et jusqu'à
    // 37 cm là où le sol montait du parvis ; la rangée du nord s'arrête avant la rampe de l'est)
    for (let k = 0; k < 7; k++) a.boite(0.1, 0.01, 4.6, '#f4f2ea', { x: -9.6 + k * 2.6, y: y + 0.012, z: 43.4, trait: false });
    for (let k = 0; k < 5; k++) a.boite(0.1, 0.01, 4.6, '#f4f2ea', { x: 4.0 + k * 2.6, y: y + 0.012, z: 33.4, trait: false });
    a.boite(10.5, 0.01, 0.1, '#f4f2ea', { x: 9.2, y: y + 0.012, z: 31.0, trait: false });
    // le mur de soutènement au sud (béton, l'herbe du talus dessus)
    a.boite(PARKING.x1 - PARKING.x0 + 0.6, 2.4, 0.4, BETON, { x: (PARKING.x0 + PARKING.x1) / 2, y: y + 0.6, z: PARKING.z1 + 0.4, nuance: 0.06 });
    monde.mur(PARKING.x0 - 0.3, PARKING.z1 + 0.3, PARKING.x1 + 0.3, PARKING.z1 + 0.3, 0.3);
    // des voitures garées (2026-10-29 : refaites, c'étaient deux boîtes et quatre roues), un car de tourisme
    for (const [x, z, ry, c, sorte] of [[-8.3, 43.4, PI, '#a9d3b6', 'kei'], [-3.1, 43.4, 0.02, '#f1f1ec', 'berline'], [2.1, 43.4, PI - 0.03, '#b6babd', 'mono'],
      [7.9, 33.4, PI, '#34558a', 'berline'], [13.1, 33.4, 0.03, '#e2d3b0', 'kei']]) {
      voiture(THREE, a, repere(x, z, ry), y, c, sorte);
      murRect(repere(x, z, ry), MODELES_VOITURE[sorte].W / 2, MODELES_VOITURE[sorte].L / 2);
    }
    {
      // le car de tourisme, l'avant vers l'est (la route) : la caisse blanche et sa bande verte, le toit arrondi, la rangée de
      // vitres entre leurs montants, le grand pare-brise, le panneau de destination, les phares, la porte, les rétroviseurs ;
      // les roues dans leurs passages
      const R = repere(17.5, 43.2, PI / 2), L = 10.5, W = 2.45, VITRE = '#2e3a46';
      a.boite(W, 2.35, L, '#f4f2ea', R(0, y + 1.55, 0, { nuance: 0.03 }))
        .piece(new THREE.CylinderGeometry(W / 2, W / 2, L - 0.2, 14, 1, false, -PI / 2, PI), '#f4f2ea', { ...R(0, y + 2.72, 0), rx: -PI / 2, sx: 1, sy: 1, sz: 0.35, ordre: 'YXZ', nuance: 0.03 })
        .boite(W + 0.01, 0.34, L + 0.01, '#3a8a5a', R(0, y + 0.92, 0, { trait: false })).boite(W + 0.012, 0.08, L + 0.012, '#2a6a4a', R(0, y + 1.16, 0, { trait: false }));
      // les vitres des côtés (une bande sombre, des montants blancs devant), l'arrière
      for (const u of [-1, 1]) {
        a.boite(0.012, 0.72, L - 2.4, VITRE, R(u * (W / 2 + 0.006), y + 2.12, -0.55, { trait: false }));
        for (let k = 0; k <= 7; k++) a.boite(0.012, 0.74, 0.1, '#f4f2ea', R(u * (W / 2 + 0.012), y + 2.12, -0.55 - (L - 2.4) / 2 + (k * (L - 2.4)) / 7, { trait: false }));
      }
      a.boite(1.5, 0.6, 0.012, VITRE, R(0, y + 2.15, -L / 2 - 0.006, { trait: false })).boite(0.3, 0.16, 0.02, '#c8402c', R(-0.95, y + 1.0, -L / 2 - 0.01, { trait: false })).boite(0.3, 0.16, 0.02, '#c8402c', R(0.95, y + 1.0, -L / 2 - 0.01, { trait: false }));
      // l'avant : le pare-brise, le panneau orange de destination, les phares, le pare-chocs ; la porte sur le côté droit
      a.boite(W - 0.18, 1.25, 0.012, VITRE, R(0, y + 2.0, L / 2 + 0.006, { trait: false })).boite(1.4, 0.2, 0.014, '#2a2420', R(0, y + 2.78, L / 2 + 0.008, { trait: false }))
        .boite(0.34, 0.14, 0.02, '#f6e8b0', R(-0.85, y + 0.98, L / 2 + 0.01, { trait: false })).boite(0.34, 0.14, 0.02, '#f6e8b0', R(0.85, y + 0.98, L / 2 + 0.01, { trait: false }))
        .boite(W + 0.06, 0.28, 0.14, '#3a3a40', R(0, y + 0.55, L / 2 + 0.04)).boite(0.012, 1.85, 0.9, VITRE, R(W / 2 + 0.008, y + 1.45, L / 2 - 0.75, { trait: false }));
      ecrire({ ...R(0, y, L / 2 + 0.016), ry: PI / 2 }, { texte: '元乃隅神社', x: 0, y: 2.78, z: 0, l: 1.2, h: 0.16, fond: null, encre: '#ffb04a' });
      // (les points par leurs noms : R donne aussi ordre, ry)
      for (const u of [-1, 1]) { const q0 = R(u * (W / 2 - 0.05), y + 2.4, L / 2 - 0.1), q1 = R(u * (W / 2 + 0.3), y + 2.3, L / 2 + 0.25); a.baton([q0.x, q0.y, q0.z], [q1.x, q1.y, q1.z], 0.025, '#2a2a30', 5); }
      for (const [u, v] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        a.boite(0.04, 0.6, 1.25, '#2a2a30', R(u * (W / 2 + 0.002), y + 0.62, v * (L / 2 - 1.8), { trait: false }))
          .cylindre(0.48, 0.48, 0.3, 14, '#26262a', R(u * (W / 2 - 0.12), y + 0.48, v * (L / 2 - 1.8), { rz: PI / 2 })).cylindre(0.24, 0.24, 0.31, 10, '#9aa0a6', R(u * (W / 2 - 0.12), y + 0.48, v * (L / 2 - 1.8), { rz: PI / 2, trait: false }));
      }
      const C = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => R(u * (W / 2 + 0.3), 0, v * (L / 2 + 0.3)));
      for (let k = 0; k < 4; k++) monde.mur(C[k].x, C[k].z, C[(k + 1) % 4].x, C[(k + 1) % 4].z, 0.05);
    }
    // l'arrêt de bus : le poteau et son disque, l'horaire ; un banc
    {
      const { x, z } = ARRET;
      a.cylindre(0.04, 0.04, 2.5, 8, '#8a8f94', { x, y: y + 1.25, z }).cylindre(0.32, 0.32, 0.04, 20, '#f4f2ea', { x, y: y + 2.3, z, rx: PI / 2 })
        .cylindre(0.3, 0.3, 0.05, 20, '#2f6aa8', { x, y: y + 2.3, z, rx: PI / 2, trait: false }).boite(0.4, 0.55, 0.04, '#f4f2ea', { x, y: y + 1.45, z: z - 0.03 });
      a.cylindre(0.22, 0.26, 0.12, 10, BETON_FONCE, { x, y: y + 0.06, z });
      ecrire({ x, y, z, ry: PI }, { texte: '元乃隅神社', x: 0, y: 2.3, z: 0.03, l: 0.5, h: 0.12, fond: null, encre: '#ffffff' });
      monde.cercle(x, z, 0.4);
      a.boite(1.5, 0.06, 0.4, P.bois, { x: x - 2.2, y: y + 0.44, z: z + 1.0 }).boite(1.5, 0.3, 0.05, P.bois, { x: x - 2.2, y: y + 0.72, z: z + 1.22 });
      for (const u of [-1, 1]) a.boite(0.05, 0.44, 0.38, '#8a8f94', { x: x - 2.2 + u * 0.65, y: y + 0.22, z: z + 1.0 });
      bancs.push({ de: [x - 2.85, z + 1.0], a: [x - 1.55, z + 1.0], y: y + 0.47, cap: PI });
      murRect(repere(x - 2.2, z + 1.06, 0), 0.75, 0.22);
    }
    // la route vers l'est, et la barrière blanche des piétons en travers (« この先 車道 » : la route, au-delà)
    {
      const x = PARKING.x1 + 0.15;
      a.cylindre(0.05, 0.05, 1.0, 8, BLANC_METAL, { x, y: y + 0.5, z: ROUTE.z0 }).cylindre(0.05, 0.05, 1.0, 8, BLANC_METAL, { x, y: y + 0.5, z: ROUTE.z1 })
        .cylindre(0.05, 0.05, 1.0, 8, BLANC_METAL, { x, y: y + 0.5, z: (ROUTE.z0 + ROUTE.z1) / 2 });
      for (const hb of [0.92, 0.5]) a.baton([x, y + hb, ROUTE.z0], [x, y + hb, ROUTE.z1], 0.03, BLANC_METAL, 6);
      a.boite(0.04, 0.5, 0.8, '#f4f2ea', { x: x - 0.06, y: y + 0.7, z: (ROUTE.z0 + ROUTE.z1) / 2 + 1.6 });
      ecrire({ x: x - 0.09, y, z: (ROUTE.z0 + ROUTE.z1) / 2 + 1.6, ry: -PI / 2 }, { texte: 'この先 車道', x: 0, y: 0.7, z: 0, l: 0.7, h: 0.16, fond: null, encre: '#c8402c' });
      monde.mur(x, ROUTE.z0 - 0.3, x, ROUTE.z1 + 0.3, 0.3);
      // le reste du bord est : une barrière blanche aussi
      a.cylindre(0.05, 0.05, 1.0, 8, BLANC_METAL, { x, y: y + 0.5, z: PARKING.z1 });
      for (const hb of [0.92, 0.5]) a.baton([x, y + hb, ROUTE.z1], [x, y + hb, PARKING.z1], 0.03, BLANC_METAL, 6);
      monde.mur(x, ROUTE.z1, x, PARKING.z1, 0.3);
    }
    poser(a.fin(), 0, 0, { y: 0 });
  }
  // la boutique (元乃隅売店) et le café (漁火庵) : deux maisons basses au toit à deux pans de tuiles rouges de Sekishū (les
  // tuiles de la région, sur la côte de la mer du Japon), leur façade vers le parking (2026-10-29, refaites, « les boutiques
  // en haut » : les auvents penchaient de travers en longues barres noires, l'enseigne flottait devant le toit, le dedans
  // était une boîte noire). La façade : trois travées entre des poteaux sombres ; au nord, un mur (les distributeurs devant)
  // ou une fenêtre à barreaux de bois (le café) ; au milieu, le comptoir, la vendeuse derrière ; au sud, la porte vitrée
  // (le noren du café devant). Dedans, éclairé : des étagères de souvenirs, ou les tables et la machine à glaces du café.
  {
    const TUILE = '#a24c34', TUILE2 = '#b35a40', TUILE_F = '#7e3a28', PLATRE = '#f1ece0', KOSHI = '#5b4537', VITRE = '#a9bcc4', ALU = '#5d6166';
    const HW = 2.95, RH = 1.45, EV = 0.6, VG = 0.35, EP = 0.1;
    const SOUVENIRS = ['#c8402c', '#f2c443', '#3a6aa8', '#f4efe2', '#5a8a4a', '#e88a3a', '#d86a8a', '#7a5a9a', '#a8d4e8'];
    /**
     * La maison, dans le repère R (la façade vers +z) : W de large (x), D de profondeur (z), le sol du parking en y ; o : sol (du
     * dedans), enseigne (texte, fond, encre), cafe ; renvoie F (le plancher) et les x des travées.
     */
    const maison = (a, R, W, D, y, o) => {
      const F = y + 0.04, xin = W / 2 - 0.19;
      // le socle (5 cm plus large que les murs de chaque côté), le sol du dedans
      a.boite(W + 0.1, 0.3, D + 0.1, P.pierreFonce, R(0, y - 0.11, 0, { nuance: 0.05 }));
      a.boite(W - 0.32, 0.02, D - 0.32, o.sol, R(0, F + 0.01, 0, { trait: false }));
      // les murs : l'enduit blanc, les planches sombres du bas (腰板) dehors ; le plafond de bois clair
      a.boite(W - 0.32, HW, 0.16, PLATRE, R(0, F + HW / 2, -D / 2 + 0.08, { nuance: 0.03 }));
      a.boite(W - 0.3, 0.9, 0.02, KOSHI, R(0, F + 0.45, -D / 2 - 0.01, { nuance: 0.05 }));
      for (const u of [-1, 1]) {
        a.boite(0.16, HW, D, PLATRE, R(u * (W / 2 - 0.08), F + HW / 2, 0, { nuance: 0.03 }));
        a.boite(0.02, 0.9, D - 0.3, KOSHI, R(u * (W / 2 + 0.01), F + 0.45, 0, { nuance: 0.05 }));
      }
      a.boite(W - 0.32, 0.05, D - 0.32, '#d9c4a0', R(0, F + HW - 0.025, 0, { trait: false }));
      // les poteaux des coins (1 cm devant les planches), ceux de la façade, la poutre des ouvertures (1 cm devant eux), la frise
      for (const [u, v] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) a.boite(0.22, HW + 0.02, 0.22, P.boisFonce, R(u * (W / 2 - 0.08), F + HW / 2, v * (D / 2 - 0.08)));
      for (const u of [-1, 1]) a.boite(0.18, HW, 0.18, P.boisFonce, R(u * 1.25, F + HW / 2, D / 2 - 0.09));
      a.boite(W - 0.2, 0.2, 0.2, P.boisFonce, R(0, F + 2.05, D / 2 - 0.09));
      a.boite(W - 0.36, HW - 2.15, 0.14, PLATRE, R(0, F + (2.15 + HW) / 2, D / 2 - 0.1));
      // l'enseigne (看板), posée sur la poutre et la frise, sous l'avant-toit
      a.boite(3.4, 0.42, 0.05, o.enseigne.fond, R(0, F + 2.4, D / 2 + 0.04, { nuance: 0.04 }));
      { const q = R(0, 0, D / 2 + 0.066); ecrire({ x: q.x, y: F, z: q.z, ry: R(0, 0, 0).ry }, { texte: o.enseigne.texte, x: 0, y: 2.4, z: 0, l: 3.0, h: 0.32, fond: null, encre: o.enseigne.encre }); }
      // le milieu : le comptoir (72 cm : la vendeuse se voit derrière), son plateau qui avance de 18 cm
      a.boite(2.3, 0.72, 0.36, P.bois, R(0, F + 0.36, D / 2 - 0.18, { nuance: 0.05 })).boite(2.4, 0.05, 0.56, P.boisFonce, R(0, F + 0.745, D / 2 - 0.1));
      // le sud : la porte vitrée (deux vantaux), son cadre d'aluminium 1 cm devant les vitres
      {
        const x0 = -xin, x1 = -1.34, xm = (x0 + x1) / 2, l = x1 - x0, zv = D / 2 - 0.13;
        a.boite(l + 0.02, 1.92, 0.02, VITRE, R(xm, F + 0.96, zv, { trait: false }));
        for (const yb of [0.03, 1.92]) a.boite(l + 0.02, 0.06, 0.05, ALU, R(xm, F + yb, zv + 0.01, { trait: false }));
        for (const xs of [x0 + 0.03, xm, x1 - 0.03]) a.boite(0.05, 1.92, 0.05, ALU, R(xs, F + 0.975, zv + 0.01, { trait: false }));
        for (const xs of [xm - l / 4, xm + l / 4]) a.boite(0.02, 0.22, 0.02, '#c9ccce', R(xs + (xs < xm ? l / 4 - 0.1 : -l / 4 + 0.1), F + 0.98, zv + 0.045, { trait: false }));
        if (o.cafe) {
          // le noren du café : trois pans de toile sur leur tringle, sous la poutre
          const t0 = R(x0 + 0.05, 0, D / 2 + 0.05), t1 = R(x1 - 0.05, 0, D / 2 + 0.05);
          a.baton([t0.x, F + 1.93, t0.z], [t1.x, F + 1.93, t1.z], 0.015, P.boisFonce, 5);
          for (let k = 0; k < 3; k++) a.boite(l / 3 - 0.03, 0.72, 0.012, '#2e3a5a', R(x0 + (k + 0.5) * (l / 3), F + 1.56, D / 2 + 0.05, { trait: false }));
          const q = R(xm, 0, D / 2 + 0.058);
          ecrire({ x: q.x, y: F, z: q.z, ry: R(0, 0, 0).ry }, { texte: '漁火', x: 0, y: 1.6, z: 0, l: l * 0.55, h: 0.3, fond: null, encre: '#f4efe2' });
        }
      }
      // le nord : un mur plein (les distributeurs devant), ou la fenêtre à barreaux de bois du café
      {
        const x0 = 1.34, x1 = xin, xm = (x0 + x1) / 2, l = x1 - x0;
        if (!o.cafe) {
          a.boite(l + 0.02, 1.95, 0.14, PLATRE, R(xm, F + 0.975, D / 2 - 0.1, { nuance: 0.03 })).boite(l + 0.02, 0.9, 0.02, KOSHI, R(xm, F + 0.45, D / 2 - 0.02, { nuance: 0.05 }));
        } else {
          a.boite(l + 0.02, 0.9, 0.14, PLATRE, R(xm, F + 0.45, D / 2 - 0.1)).boite(l + 0.02, 0.9, 0.02, KOSHI, R(xm, F + 0.45, D / 2 - 0.02, { nuance: 0.05 }));
          a.boite(l + 0.02, 1.02, 0.02, VITRE, R(xm, F + 1.44, D / 2 - 0.13, { trait: false })).boite(l + 0.02, 0.06, 0.08, P.boisFonce, R(xm, F + 0.93, D / 2 - 0.08));
          for (let k = 0, n = Math.round(l / 0.075); k <= n; k++) a.boite(0.025, 1.0, 0.03, P.boisFonce, R(x0 + (k / n) * l, F + 1.44, D / 2 - 0.1, { trait: false }));
        }
      }
      // le toit à deux pans : le faîte le long de la façade, 75 cm d'avant-toit devant et derrière, 35 cm sur les pignons ; les
      // tuiles (des rangs en relief qui descendent la pente), le faîtage arrondi et ses tuiles de bout, les planches des bords,
      // les chevrons sous l'avant-toit de la façade, les pignons d'enduit
      const ang = Math.atan2(RH, D / 2), co = Math.cos(ang), si = Math.sin(ang), Lp = (D / 2 + EV) / co, larg = W + 2 * VG;
      const yb = (z) => F + HW + RH * (1 - Math.abs(z) / (D / 2));
      for (const sens of [1, -1]) {
        const zc = (sens * (D / 2 + EV)) / 2, yc = yb(zc) + EP / (2 * co), q = { rx: sens * ang };
        a.boite(larg, EP, Lp, TUILE, R(0, yc, zc, { ...q, nuance: 0.04 }));
        // (les rangs : sur le dessus du pan, 2 cm de relief)
        const dy = (EP / 2 + 0.02) * co, dz = sens * (EP / 2 + 0.02) * si;
        for (let x = -larg / 2 + 0.16; x < larg / 2 - 0.1; x += 0.3) a.boite(0.1, 0.05, Lp - 0.04, TUILE2, R(x, yc + dy, zc + dz, { ...q, trait: false }));
        // la planche du bord de l'avant-toit (鼻隠し), devant le bout du pan
        const ze = sens * (D / 2 + EV), ye = yb(ze);
        a.boite(larg + 0.04, 0.17, 0.04, P.boisFonce, R(0, ye + 0.04, ze + sens * (0.02 + EP * si * 0.5)));
        // les planches des pignons (破風), le long des deux bords du pan
        for (const u of [-1, 1]) a.boite(0.05, 0.2, Lp + 0.06, P.boisFonce, R(u * (larg / 2 + 0.025), yc - 0.03, zc, q));
        // les chevrons sous l'avant-toit de la façade
        if (sens > 0) for (let x = -W / 2 + 0.1; x <= W / 2 - 0.1; x += 0.45) {
          const zr = D / 2 + EV / 2 - 0.05;
          a.boite(0.06, 0.08, EV + 0.2, P.bois, R(x, yb(zr) - 0.04 / co, zr, { ...q, trait: false }));
        }
      }
      a.boite(larg + 0.06, 0.2, 0.34, TUILE_F, R(0, F + HW + RH + EP / co + 0.04, 0)).cylindre(0.12, 0.12, larg + 0.06, 10, TUILE2, R(0, F + HW + RH + EP / co + 0.16, 0, { rz: PI / 2 }));
      for (const u of [-1, 1]) {
        a.boite(0.1, 0.36, 0.38, TUILE_F, R(u * (larg / 2 + 0.01), F + HW + RH + EP / co + 0.12, 0));
        a.pignon(0.16, RH - 0.03, D - 0.04, PLATRE, R(u * (W / 2 - 0.08), F + HW, 0));
      }
      // dedans : la lumière des deux tubes du plafond (la nuit, ils s'allument)
      for (const u of [-1, 1]) a.boite(0.09, 0.035, 2.6, '#fff8ea', R(u * 1.0, F + HW - 0.07, -0.3, { sorte: 'lumiere', trait: false }));
      return { F, xin };
    };
    /** Un distributeur de boissons (自動販売機), dans le repère R, sa face vers +z : la vitrine éclairée et ses bouteilles, les
     *  boutons, la fente des pièces, la trappe. (2026-10-29, « les distributeurs scintillent » : la plaque des pièces
     *  chevauchait le bas de la vitrine, dans le même plan ; elle est maintenant 3 cm à côté.) La nuit, sa lumière tombe sur
     *  le sol devant, sans halo (une boule blanche flottait devant lui). */
    const distributeur = (a, R, lx, lz, F, c) => {
      a.boite(0.95, 1.83, 0.72, c, R(lx, F + 0.915, lz, { nuance: 0.03 }));
      const zf = lz + 0.36;
      a.boite(0.72, 0.82, 0.02, '#eef3f5', R(lx - 0.085, F + 1.32, zf + 0.008, { sorte: 'lumiere', trait: false }));
      const BOISSONS = ['#c8302c', '#3a8a4a', '#e88a2a', '#2f6ab0', '#8a5a2a', '#f4f0e6'];
      for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) {
        a.boite(0.075, 0.15, 0.02, BOISSONS[(k + r * 2) % 6], R(lx - 0.37 + k * 0.115, F + 1.06 + r * 0.25, zf + 0.022, { trait: false }))
          .boite(0.05, 0.022, 0.012, '#3a7ad0', R(lx - 0.37 + k * 0.115, F + 0.97 + r * 0.25, zf + 0.024, { trait: false }));
      }
      a.boite(0.14, 0.42, 0.02, '#3a3a40', R(lx + 0.375, F + 0.98, zf + 0.008, { trait: false })).boite(0.66, 0.16, 0.02, '#26262a', R(lx - 0.08, F + 0.28, zf + 0.008, { trait: false }));
      lumieres.push({ ...R(lx, F + 1.3, zf + 0.4), halo: 0, sol: F, r: 1.6, c: '#e8f4ff' });
    };
    const ab = atelier(), ac = atelier(), y = Y_PARKING;
    // la boutique : l'enseigne de bois clair ; dedans, les étagères de souvenirs le long des murs, la table du milieu, la caisse
    {
      const B = BOUTIQUE, W = B.p, D = B.l, R = repere(B.x, B.z, PI / 2);
      const { F, xin } = maison(ab, R, W, D, y, { sol: '#cfc6b4', enseigne: { texte: '元乃隅売店', fond: '#dcbf92', encre: '#2a2420' } });
      const etagere = (x0, x1, z0, sens) => {
        // (une rangée d'étagères contre un mur : les montants, quatre planches, les boîtes de souvenirs de toutes les couleurs)
        const zm = z0 + sens * 0.2;
        for (const x of [x0, x1]) ab.boite(0.04, 1.9, 0.4, P.bois, R(x, F + 0.95, zm, { trait: false }));
        for (let r = 0; r < 4; r++) {
          const yr = F + 0.3 + r * 0.45;
          ab.boite(x1 - x0, 0.03, 0.4, P.bois, R((x0 + x1) / 2, yr, zm, { trait: false }));
          for (let x = x0 + 0.17, k = 0; x < x1 - 0.12; x += 0.28, k++) {
            const h = 0.12 + 0.14 * hasard(k + r * 7, x0), c = SOUVENIRS[Math.floor(hasard(r, k + x0) * SOUVENIRS.length)];
            ab.boite(0.22, h, 0.26, c, R(x, yr + 0.015 + h / 2, zm, { trait: false }));
          }
        }
      };
      etagere(-W / 2 + 0.45, W / 2 - 0.45, -D / 2 + 0.16, 1);
      // la table du milieu et ses boîtes de manjū, la caisse sur le comptoir
      ab.boite(1.6, 0.75, 1.0, P.bois, R(0, F + 0.375, -0.6, { trait: false }));
      for (let k = 0; k < 8; k++) ab.boite(0.3, 0.1 + 0.05 * (k % 3), 0.22, SOUVENIRS[(k * 3) % SOUVENIRS.length], R(-0.6 + (k % 4) * 0.4, F + 0.8 + 0.03 * (k % 3), -0.85 + Math.floor(k / 4) * 0.5, { trait: false }));
      ab.boite(0.36, 0.22, 0.32, '#3a3a40', R(-0.75, F + 0.88, D / 2 - 0.3)).boite(0.3, 0.1, 0.02, '#8fd0a0', R(-0.75, F + 0.94, D / 2 - 0.135, { trait: false }));
      // au nord, devant le mur plein : deux distributeurs, un rouge et un bleu (leur dos 5 cm devant le mur)
      for (const [k, c] of [[0, '#c8302c'], [1, '#2f6ab0']]) distributeur(ab, R, xin - 0.52 - k * 1.0, D / 2 + 0.41, F, c);
      { const q1 = R(xin - 0.52, 0, D / 2 + 0.41), q2 = R(xin - 1.52, 0, D / 2 + 0.41); murRect(repere((q1.x + q2.x) / 2, (q1.z + q2.z) / 2, PI / 2), 0.98, 0.36); }
      // le drapeau おみやげ au coin nord de la façade
      {
        const q = R(W / 2 + 0.25, 0, D / 2 + 0.55);
        ab.baton([q.x, y, q.z], [q.x, y + 2.7, q.z], 0.022, P.boisFonce, 5).baton([q.x, y + 2.62, q.z], [q.x, y + 2.62, q.z + 0.4], 0.012, P.boisFonce, 4)
          .boite(0.012, 1.5, 0.38, '#c8402c', { x: q.x, y: y + 1.85, z: q.z + 0.2, trait: false });
        ecrire({ x: q.x + 0.007, y, z: q.z + 0.2, ry: PI / 2 }, { texte: 'おみやげ', vertical: true, x: 0, y: 1.85, z: 0, l: 0.28, h: 1.3, fond: null, encre: '#fff4e8' });
        monde.cercle(q.x, q.z + 0.1, 0.42);
      }
      // la lumière du dedans, par le comptoir ; la nuit, une flaque devant (sans halo : il flottait en boule sous l'avant-toit)
      lumieres.push({ ...R(0, F + 2.2, D / 2 + 0.7), halo: 0, sol: y, r: 3.2, c: '#ffe2b0' });
      // (la maison : un bloc plein, 27 cm au-delà des murs, 42 devant (le plateau du comptoir avance de 18 cm))
      monde.surface(B.x - D / 2 - 0.6, B.x + D / 2 + 0.42, B.z - W / 2 - 0.27, B.z + W / 2 + 0.27, y + 3.4, { plein: true });
      monde.bloc(B.x - D / 2, B.x + D / 2, B.z - W / 2, B.z + W / 2, y - 1, y + 4.6);
    }
    // le café : l'enseigne sombre aux lettres claires ; dedans, deux tables et leurs tabourets, le comptoir du fond et la machine
    // à glaces, le tableau du menu ; dehors, le banc rouge sous son ombrelle, la grande glace en plastique, le drapeau
    {
      const B = CAFE, W = B.p, D = B.l, R = repere(B.x, B.z, PI / 2);
      const { F, xin } = maison(ac, R, W, D, y, { sol: '#b9a68a', cafe: true, enseigne: { texte: '漁火庵', fond: '#4a3424', encre: '#f2e2c0' } });
      for (const [x, z] of [[-1.3, -0.4], [1.3, -0.9]]) {
        ac.cylindre(0.42, 0.42, 0.04, 14, P.bois, R(x, F + 0.74, z, { trait: false })).cylindre(0.05, 0.06, 0.72, 6, P.boisFonce, R(x, F + 0.37, z, { trait: false }));
        for (const u of [-1, 1]) ac.cylindre(0.17, 0.17, 0.04, 10, '#c8402c', R(x + u * 0.62, F + 0.45, z, { trait: false })).cylindre(0.03, 0.03, 0.43, 5, P.boisFonce, R(x + u * 0.62, F + 0.215, z, { trait: false }));
      }
      ac.boite(W - 0.6, 0.95, 0.5, P.bois, R(0, F + 0.475, -D / 2 + 0.45, { trait: false })).boite(0.42, 0.62, 0.5, '#c9ccce', R(-1.2, F + 1.26, -D / 2 + 0.45, { trait: false }))
        .cylindre(0.03, 0.02, 0.14, 6, '#9aa0a6', R(-1.32, F + 1.18, -D / 2 + 0.72, { trait: false })).cylindre(0.03, 0.02, 0.14, 6, '#9aa0a6', R(-1.08, F + 1.18, -D / 2 + 0.72, { trait: false }));
      ac.boite(1.6, 0.8, 0.03, '#2f4a3a', R(0.9, F + 1.75, -D / 2 + 0.175, { trait: false }));
      { const q = R(0.9, 0, -D / 2 + 0.192); ecrire({ x: q.x, y: F, z: q.z, ry: R(0, 0, 0).ry }, { texte: 'メニュー', x: 0, y: 1.92, z: 0, l: 1.2, h: 0.24, fond: null, encre: '#f4efe2' }); }
      // le lampion rouge à l'entrée
      { const q = R(-xin + 0.12, 0, D / 2 + 0.3); ac.chochin(q.x, F + 2.3, q.z, 4.5); lumieres.push({ x: q.x, y: F + 2.3, z: q.z, halo: 0.34, sol: y, r: 2.2, c: '#ff9a6a' }); }
      lumieres.push({ ...R(0, F + 2.2, D / 2 + 0.7), halo: 0, sol: y, r: 3.2, c: '#ffe2b0' });
      // dehors, devant la fenêtre : le banc rouge (縁台, le feutre rouge dessus), l'ombrelle rouge (野点傘) derrière
      {
        const q0 = R(xin - 0.15, 0, D / 2 + 1.05), q1 = R(1.45, 0, D / 2 + 1.05), xm = (q0.x + q1.x) / 2, zm = (q0.z + q1.z) / 2, lb = Math.hypot(q1.x - q0.x, q1.z - q0.z);
        ac.boite(0.62, 0.06, lb, P.bois, { x: xm, y: y + 0.42, z: zm }).boite(0.64, 0.025, lb + 0.02, '#c8302c', { x: xm, y: y + 0.462, z: zm, trait: false });
        for (const f of [-1, 1]) ac.boite(0.5, 0.4, 0.06, P.boisFonce, { x: xm, y: y + 0.2, z: zm + f * (lb / 2 - 0.15) });
        bancs.push({ de: [xm, zm - lb / 2 + 0.2], a: [xm, zm + lb / 2 - 0.2], y: y + 0.475, cap: PI / 2 });
        murRect(repere(xm, zm, 0), 0.31, lb / 2);
        const xp = xm - 0.62, zp = zm;
        ac.baton([xp, y, zp], [xp, y + 2.32, zp], 0.025, '#3a2a20', 6).cone(1.0, 0.3, 18, '#c8302c', { x: xp, y: y + 2.18, z: zp, nuance: 0.03 });
        monde.cercle(xp, zp, 0.3);
      }
      // la grande glace en plastique (le panneau des glaces) au coin nord, et le drapeau ソフトクリーム
      {
        const q = R(xin + 0.05, 0, D / 2 + 0.5), x = q.x, z = q.z;
        ac.cylindre(0.18, 0.04, 0.9, 12, '#d8a05a', { x, y: y + 1.0, z }).boule(0.26, '#f4efe2', { x, y: y + 1.6, z, sy: 1.1 }, 1).cone(0.2, 0.42, 12, '#f4efe2', { x, y: y + 1.96, z, ry: 0.4 })
          .cylindre(0.1, 0.12, 0.55, 8, '#8a8f94', { x, y: y + 0.27, z });
        monde.cercle(x, z, 0.45);
        const qn = R(-xin - 0.1, 0, D / 2 + 0.55);
        ac.baton([qn.x, y, qn.z], [qn.x, y + 2.7, qn.z], 0.022, P.boisFonce, 5).baton([qn.x, y + 2.62, qn.z], [qn.x, y + 2.62, qn.z - 0.4], 0.012, P.boisFonce, 4)
          .boite(0.012, 1.5, 0.38, '#e8b941', { x: qn.x, y: y + 1.85, z: qn.z - 0.2, trait: false });
        ecrire({ x: qn.x + 0.007, y, z: qn.z - 0.2, ry: PI / 2 }, { texte: 'ソフトクリーム', vertical: true, x: 0, y: 1.85, z: 0, l: 0.26, h: 1.36, fond: null, encre: '#c8402c' });
        monde.cercle(qn.x, qn.z - 0.1, 0.42);
      }
      monde.surface(B.x - D / 2 - 0.6, B.x + D / 2 + 0.42, B.z - W / 2 - 0.27, B.z + W / 2 + 0.27, y + 3.4, { plein: true });
      monde.bloc(B.x - D / 2, B.x + D / 2, B.z - W / 2, B.z + W / 2, y - 1, y + 4.6);
    }
    poser(ab.fin(), 0, 0, { y: 0 });
    // entre la boutique et le café : une palissade de planches, sous les deux toits
    {
      const z = (BOUTIQUE.z + BOUTIQUE.p / 2 + CAFE.z - CAFE.p / 2) / 2, x0 = BOUTIQUE.x - BOUTIQUE.l / 2, x1 = BOUTIQUE.x + BOUTIQUE.l / 2 - 0.2;
      ac.boite(x1 - x0, 1.8, 0.08, P.boisFonce, { x: (x0 + x1) / 2, y: Y_PARKING + 0.9, z, nuance: 0.05 });
      monde.mur(x0, z, x1 + 0.3, z, 0.3);
    }
    poser(ac.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Le coin de Bunbuku, les arbres du haut
  {
    const a = atelier();
    // sous deux pins, entre des buissons serrés ; son lampion rouge sur un bambou
    // (en cercle autour du coin, depuis les bouts de la rampe du bord ouest, qui s'ouvre juste là où il touche le parvis)
    for (let k = 0; k <= 16; k++) {
      const t0 = Math.atan2(ouv / RECOIN.rz, (PARVIS.x0 - RECOIN.x) / RECOIN.rx), t = t0 + (k / 16) * (2 * PI - 2 * t0);
      const x = RECOIN.x + Math.cos(t) * (RECOIN.rx + 0.7), z = RECOIN.z + Math.sin(t) * (RECOIN.rz + 0.7);
      const r = 0.62 + 0.25 * hasard(k, 3);
      a.buisson(x, terrain(x, z) + r * 0.45, z, r, k % 2 ? '#4a7a38' : '#56843e', { touffu: true, sorte: 'persistant' });
      monde.cercle(x, z, 0.72);
    }
    for (const [x, z, s, sens] of [[-22.4, 25.2, 15, 1], [-21.6, 19.6, 13, -1]]) a.pinNuages(x, z, s, sens, { y: Y_PARVIS });
    a.baton([LAMPION.x, Y_PARVIS, LAMPION.z], [LAMPION.x, Y_PARVIS + 2.0, LAMPION.z], 0.02, '#9fb86a', 5);
    a.chochin(LAMPION.x, Y_PARVIS + 1.75, LAMPION.z, 6.5);
    lumieres.push({ x: LAMPION.x, y: Y_PARVIS + 1.75, z: LAMPION.z, halo: 0.36, sol: Y_PARVIS, r: 2.4, c: '#ff9a6a' });
    monde.cercle(LAMPION.x, LAMPION.z, 0.3);
    // des sotetsu (cycas) au bord du parvis, et un grand pin noir couché par le vent au coin nord-est
    for (const [x, z, s] of [[-14.6, 20.0, 1.0], [-11.0, 15.6, 0.85], [-6.0, 20.8, 0.8], [14.6, 28.8, 0.95]]) {
      sotetsu(a, x, Y_PARVIS, z, s);
      monde.cercle(x, z, 0.7 * s + 0.3);
    }
    pinVent(a, 15.3, Y_PARVIS, 15.4, 7.5, 0.7);
    monde.cercle(15.3, 15.4, 0.55);
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- La pente : l'herbe, les buissons, les susuki, les pins
  // Les buissons ronds des falaises (tobira, 海桐), des touffes de susuki (l'herbe à plumes), quelques pins noirs couchés par
  // le vent. Rien à moins de 1,3 m des piliers des torii ; la butte verte dans l'épingle, serrée de buissons.
  {
    const VERTS = ['#4f7a3c', '#5a8642', '#46703a', '#628c48'];
    const libre = (x, z, r) => {
      const l = surLigne(x, z);
      if (l.d < D_PILIER + 0.6 + r) return false;
      if (versHaut(x, z) < 1.2 + r || aLaPlace(RECOIN, x, z) < 1 + r) return false;
      if (dansPoly(ROC_PTS, x, z) && auBordPoly(ROC_PTS, x, z) > -0.5) return false;
      if (dansPoly(ROC_PTS, x, z)) return false;
      if (BUTTES.some((b) => dansButte(b, x, z) < 1.05)) return false;
      return cote(x, z) > 3 + r;
    };
    for (let i = 0; i < 900; i++) {
      const x = -46 + 84 * hasard(i, 1.3), z = -34 + 48 * hasard(2.7, i);
      if (z > 13 || !libre(x, z, 0.6)) continue;
      const butte = Math.hypot((x - 18.5) / 8.5, (z + 3.2) / 4.6) < 1, dense = butte || bruitDoux(x * 0.12, z * 0.12, 3) > 0.62;
      if (!dense && hasard(i, 7) > 0.18) continue;
      const r = (butte ? 0.75 : 0.55) + 0.4 * hasard(i, 9), y = terrain(x, z), a = morceau(x, z);
      a.buisson(x, y + r * 0.45, z, r, VERTS[i % 4], { touffu: true, sorte: 'persistant' });
      if (hasard(i, 11) < 0.15) monde.cercle(x, z, r);
    }
    for (let i = 0; i < 260; i++) {
      const x = -46 + 84 * hasard(i, 5.1), z = -34 + 48 * hasard(8.3, i);
      if (z > 13 || !libre(x, z, 0.4) || bruitDoux(x * 0.1 + 9, z * 0.1, 3) < 0.45) continue;
      susuki(morceau(x, z), x, terrain(x, z), z, 0.8 + 0.5 * hasard(i, 2));
    }
    for (const [x, z, h, sens] of [[-30, 6, 8, 0.8], [-38, -12, 7, 0.6], [36, 8, 7.5, -0.7], [40, -10, 6.5, -0.5], [-26, -22, 6, 0.9], [33, -26, 5.5, -1.1]]) {
      if (cote(x, z) < 4) continue;
      pinVent(morceau(x, z), x, terrain(x, z), z, h, sens);
    }
  }
  // les buissons du pied de la pente, qui bordent le plateau de roche au sud (on ne les traverse pas : leurs ronds)
  {
    for (let i = 0; i < ROC.length; i++) {
      if (ROC[i].b !== 'buissons') continue;
      const [xa, za] = ROC[i].p, [xb, zb] = ROC[(i + 1) % ROC.length].p, l = Math.hypot(xb - xa, zb - za), n = Math.max(2, Math.round(l / 0.9)), [nx, nz] = dehorsPoly(ROC_PTS, i);
      for (let k = 0; k <= n; k++) {
        const f = k / n, x = xa + (xb - xa) * f + nx * 0.55, z = za + (zb - za) * f + nz * 0.55;
        if (surLigne(x, z).d < D_PILIER + 0.5) continue;
        const r = 0.6 + 0.2 * hasard(i, k), a = morceau(x, z);
        a.buisson(x, terrain(x, z) + r * 0.4, z, r, ['#4f7a3c', '#5a8642', '#46703a'][k % 3], { touffu: true, sorte: 'persistant' });
        monde.cercle(x, z, 0.62);
      }
    }
  }

  // ---------------------------------------------------------------- Le plateau de roche : les buttes, la corde, le souffle
  {
    // les buttes de roche mauve (des couches de cendre volcanique, roses, mauves, grises) : de gros rochers bosselés posés
    // sur leur bosse du relief, et des blocs autour
    for (const b of BUTTES) {
      // (le gros bloc au milieu, puis une couronne de plus petits, plus bas, qui descendent vers le pied de la butte)
      const a = morceau(b.x, b.z, 60), c = Math.cos(b.ry), sn = Math.sin(b.ry), n = b.h > 5 ? 7 : 5;
      rocher(a, b.x, Y_ROC + b.h * 0.42, b.z, b.rx * 0.6, b.h * 0.62, b.rz * 0.58, b.ry, 3, false, 7);
      for (let k = 0; k < n; k++) {
        // (toujours dans la butte : leur bord, bosses comprises, avant son pied)
        const t = (k / n) * 2 * PI + hasard(k, b.x) * 0.6, f = 0.4 + 0.15 * hasard(b.z, k), u = Math.cos(t) * b.rx * f, v = Math.sin(t) * b.rz * f;
        const x = b.x + u * c + v * sn, z = b.z - u * sn + v * c, s = 0.2 + 0.1 * hasard(k, b.z);
        rocher(a, x, Y_ROC + b.h * 0.22, z, b.rx * s, b.h * (0.32 + 0.12 * hasard(k, 2)), b.rz * s, t, 2, false, 5);
      }
    }
    // au pied de chaque butte, du côté du plateau, une rangée de blocs : là où le plateau s'arrête contre elle, on voit la roche
    for (const b of BUTTES) {
      // (un tous les 90 cm : à 1,1 m, il restait un pas arrêté à 63 cm du bloc le plus proche)
      const c = Math.cos(b.ry), sn = Math.sin(b.ry), tour = 2 * PI * Math.max(b.rx, b.rz), n = Math.round(tour / 0.9);
      for (let k = 0; k < n; k++) {
        const t = (k / n) * 2 * PI, k1 = 1 + 0.1 * Math.sin(t * 3 + b.x) + 0.07 * Math.sin(t * 5 + b.z), u = Math.cos(t) * b.rx * k1 * 0.97, v = Math.sin(t) * b.rz * k1 * 0.97;
        const x = b.x + u * c + v * sn, z = b.z - u * sn + v * c;
        if (!dansPoly(ROC_PTS, x, z) && auBordPoly(ROC_PTS, x, z) > 2.5) continue;
        const r = 0.55 + 0.35 * hasard(k, b.x);
        rocher(morceau(x, z, 60), x, terrain(x, z) + r * 0.25, z, r, r * 0.85, r * 0.9, t, 1, false, 3);
        // (ses bosses vont jusqu'à 1,25 fois son rayon)
        monde.cercle(x, z, r * 1.25 + 0.24);
      }
    }
    // des blocs tombés au bord du plateau (pas dans le passage)
    for (let i = 0; i < 26; i++) {
      const t = (i / 26) * 2 * PI, k = i % ROC.length, [x0, z0] = ROC[k].p, [x1, z1] = ROC[(k + 1) % ROC.length].p, f = hasard(i, 4);
      let x = x0 + (x1 - x0) * f, z = z0 + (z1 - z0) * f;
      const l = Math.hypot(x1 - x0, z1 - z0) || 1, nx = -(z1 - z0) / l, nz = (x1 - x0) / l;
      x -= nx * (1.3 + hasard(i, 5)); z -= nz * (1.3 + hasard(i, 5));
      if (ROC[k].b === 'ligne' || surLigne(x, z).d < 2 || cote(x, z) < 1.5 || dansPoly(ROC_PTS, x, z)) continue;
      const r = 0.5 + 0.7 * hasard(i, 6);
      rocher(morceau(x, z), x, terrain(x, z) + r * 0.2, z, r, r * 0.7, r * 0.85, t, 1);
    }
  }
  // la corde au bord de la falaise : des piquets de bois tous les deux mètres, une grosse corde de chanvre qui pend entre eux
  // (la même tout autour du plateau, là où il finit au bord du vide)
  {
    const lignes = [];
    let cur = null;
    for (let i = 0; i < ROC.length; i++) {
      if (ROC[i].b === 'corde') { if (!cur) { cur = [i]; lignes.push(cur); } cur.push((i + 1) % ROC.length); } else cur = null;
    }
    for (const sommets of lignes) {
      // (35 cm au-dehors du bord du plateau : chaque sommet poussé le long de la moyenne des normales de ses deux bords)
      const dehors = sommets.map((v) => {
        const [x, z] = ROC[v].p, a0 = dehorsPoly(ROC_PTS, (v + ROC.length - 1) % ROC.length), a1 = dehorsPoly(ROC_PTS, v), nx = a0[0] + a1[0], nz = a0[1] + a1[1], l = Math.hypot(nx, nz) || 1;
        return [x + (nx / l) * 0.35, z + (nz / l) * 0.35];
      });
      const a = morceau(dehors[0][0], dehors[0][1], 80), piquets = [];
      for (let i = 0; i + 1 < dehors.length; i++) {
        const [xa, za] = dehors[i], [xb, zb] = dehors[i + 1], l = Math.hypot(xb - xa, zb - za), n = Math.max(1, Math.round(l / 2));
        for (let k = (i ? 1 : 0); k <= n; k++) piquets.push([xa + ((xb - xa) * k) / n, za + ((zb - za) * k) / n]);
        monde.mur(xa, za, xb, zb, 0.3);
      }
      piquets.forEach(([x, z], k) => {
        const y = terrain(x, z);
        a.boite(0.08, 0.95, 0.08, P.boisFonce, { x, y: y + 0.35, z, ry: hasard(k, x) * 0.4, rx: (hasard(z, k) - 0.5) * 0.06 });
        if (k + 1 < piquets.length) {
          const [x1, z1] = piquets[k + 1], y1 = terrain(x1, z1), m = [(x + x1) / 2, (y + y1) / 2 + 0.6, (z + z1) / 2];
          a.tube([[x, y + 0.72, z], m, [x1, y1 + 0.72, z1]], 0.016, '#c9b48a', { cotes: 5, pas: 6 });
        }
      });
    }
  }
  {
    // le belvédère du souffle du dragon : la pierre gravée « 龍宮の潮吹 » et son panneau, tournés vers le plateau
    // (2026-10-29, refaite : « la pierre / panneau » ; un rocher bosselé traversait sa plaque, et elle flottait) : une grosse
    // pierre naturelle aux formes douces, enfoncée de 15 cm dans le sol (au plus bas du sol sous elle), sa face avant taillée
    // plate et polie ; dessus, la plaque sombre où le nom est gravé en blanc, 1 cm devant la face
    // (sa face écrite tournée vers le plateau, à l'ouest : elle regardait la mer)
    const a = atelier(), x = BELVEDERE.x - 1.2, z = BELVEDERE.z + 2.6, ry = 1.37, R = repere(x, z, ry);
    const SX = 0.62, SY = 0.82, SZ = 0.34, ZF = 0.21;
    let y = Infinity;
    for (let k = 0; k < 8; k++) y = Math.min(y, terrain(x + Math.cos(k * PI / 4) * SX * 0.8, z + Math.sin(k * PI / 4) * SX * 0.8), terrain(x, z));
    const forme = (px, py, pz) => {
      const b = 1 + 0.07 * Math.sin(3 * px + 1.7 * py) + 0.05 * Math.sin(5 * py - 2.3 * pz + 1) + 0.04 * Math.sin(4 * pz + 2.9 * px);
      // (la face avant (−z) taillée plate ; le dessous plat, dans le sol)
      return [px * SX * b, Math.max(-SY * 0.92, py * SY * b), Math.max(-ZF, pz * SZ * b)];
    };
    a.piece(new THREE.IcosahedronGeometry(1, 2), '#a39d90', { ...R(0, y + SY * 0.92 - 0.15, 0), deformer: forme, nuance: 0.05 });
    a.boite(0.38, 1.0, 0.02, '#4a4846', R(0, y + SY * 0.92 - 0.15 + 0.05, -ZF - 0.002, { trait: false }));
    ecrire({ x, y, z, ry }, { texte: '龍宮の潮吹', vertical: true, x: 0, y: SY * 0.92 - 0.15 + 0.05, z: -ZF - 0.013, ry: PI, l: 0.24, h: 0.88, fond: null, encre: '#f4efe2' });
    murRect(R, SX - 0.02, SZ - 0.04, 0.22);
    poser(a.fin(), 0, 0, { y: 0 });
    const { x: xp, z: zp, ry: ryp } = PANNEAU_SOUFFLE, yp = terrain(xp, zp), b = panneau(atelier(), P, { ecrit: true });
    poser(b.fin(), xp, zp, { y: yp, ry: ryp });
    ecrire({ x: xp, y: yp, z: zp, ry: ryp }, { ...PAPIER_PANNEAU, texte: '龍宮の潮吹（国の天然記念物）', fond: '#fff8e8', encre: '#2a2420', lignes: 2 });
    const cx = Math.cos(ryp) * 0.6, cz = -Math.sin(ryp) * 0.6;
    monde.mur(xp - cx, zp - cz, xp + cx, zp + cz, 0.5);
  }

  // ---------------------------------------------------------------- La côte : le pied des falaises, les rochers dans l'eau
  // Une frange de roche mouillée tout le long du rivage (de 1,5 m sous l'eau à 1,5 m au-dessus) : la mer fait son écume le
  // long d'elle (balade.js : là où le décor traverse l'eau) ; de gros rochers au pied des falaises et sur les récifs
  {
    const pts = [];
    for (let i = 8; i <= 33; i++) pts.push(COTE[i]);
    const a = atelier(), pos = [], cols = [];
    let prev = null;
    for (let i = 0; i + 1 < pts.length; i++) {
      const [xa, za] = pts[i], [xb, zb] = pts[i + 1], l = Math.hypot(xb - xa, zb - za), n = Math.max(1, Math.round(l / 1.2));
      // (vers la mer : le côté où la côte est négative)
      let nx = (zb - za) / l, nz = -(xb - xa) / l;
      if (cote((xa + xb) / 2 + nx * 2, (za + zb) / 2 + nz * 2) > 0) { nx = -nx; nz = -nz; }
      for (let k = 0; k < n; k++) {
        const f = k / n, x = xa + (xb - xa) * f, z = za + (zb - za) * f;
        const sorti = 0.5 + 1.2 * bruitDoux(x * 0.4, z * 0.4, 2), w = 0.6 + 0.9 * hasard(x, z);
        const bas = [x + nx * (w + 0.8), -1.6, z + nz * (w + 0.8)], haut = [x - nx * 0.4, sorti, z - nz * 0.4];
        if (prev) {
          const c = bruitDoux(x * 0.6, z * 0.6, 1.5) > 0.5 ? '#5a4e56' : '#6a5c62';
          tri(pos, cols, prev[0], bas, haut, c, [nx, 0.4, nz]);
          tri(pos, cols, prev[0], haut, prev[1], c, [nx, 0.4, nz]);
        }
        prev = [bas, haut];
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    a.piece(geo, '#5a4e56', { couleurs: cols, nuance: 0.06 });
    poser(a.fin(), 0, 0, { y: 0, trait: false });
    // la paroi des falaises (2026-10-29 : « le fond est un peu mal fait / flou » : le relief en grille peignait les falaises en
    // longues traînées verticales) : une paroi de roche à facettes, du fond de l'eau jusque sous le bord du haut, en strates
    // mauves et grises ; tous les 2 m près du lieu, 3,6 m au loin. Chaque point avance vers la mer jusqu'à se tenir devant le
    // sol dessiné, d'une marge qui grandit avec la distance (la deuxième liste : « les falaises scintillent » : posée 30 à
    // 55 cm devant la courbe du relief, elle était percée par les facettes de 4 m du sol qui la coupent, ou à quelques
    // centimètres d'elles, et les deux se battaient à l'écran)
    for (const [i0, i1, pas, ombre] of [[6, 34, 2.0, true], [34, 41, 3.6, false]]) {
      const ap = atelier(), pp = [], cp = [];
      const RANGS = [-1.3, -0.2, 0.8, 1.6, 2.3, 2.9];
      const strate = (y, x, z) => (y < 0.7 ? '#4a4048' : ['#7d6b77', '#6e5e68', '#8a7882', '#74646e'][Math.floor((y + 1.6 * bruitDoux(x * 0.07, z * 0.07, 2)) / 1.6) % 4]);
      // (l'écart d'un point au plan de la facette du sol sous lui : positif devant, négatif si le sol passe devant)
      const devant = (x, y, z) => { const q = solDessine(x, z); return (y - q.h) / Math.sqrt(1 + q.pente * q.pente); };
      // les colonnes, du fond de l'eau au haut de la falaise
      const colonnes = [];
      for (let i = i0; i < i1; i++) {
        const [xa, za] = COTE[i], [xb, zb] = COTE[i + 1], l = Math.hypot(xb - xa, zb - za), n = Math.max(1, Math.round(l / pas));
        const tx = (xb - xa) / l, tz = (zb - za) / l;
        let nx = tz, nz = -tx;
        if (cote((xa + xb) / 2 + nx * 2, (za + zb) / 2 + nz * 2) > 0) { nx = -nx; nz = -nz; }
        for (let k = 0; k < n; k++) {
          const f = k / n, px = xa + (xb - xa) * f, pz = za + (zb - za) * f, marge = 0.12 + 0.0012 * Math.hypot(px, pz + 20);
          const col = RANGS.map((d, r) => {
            const sx = px - nx * d, sz = pz - nz * d, haut = r === RANGS.length - 1;
            const y = haut ? Math.min(terrain(sx, sz), solDessine(sx, sz).h) - 0.1 : terrain(sx, sz) - (hasard(r * 7.3 + px, pz) - 0.5) * 0.14;
            // (devant le sol ici et à mi-chemin des colonnes voisines, à la même hauteur)
            let e = haut ? 0.08 : 0.32 + 0.1 * hasard(px * 3.1 + r, pz * 1.7);
            for (let essai = 0; essai < 10 && e < 4; essai++) {
              const ex = sx + nx * e, ez = sz + nz * e, pire = Math.min(devant(ex, y, ez), devant(ex - tx * pas * 0.5, y, ez - tz * pas * 0.5), devant(ex + tx * pas * 0.5, y, ez + tz * pas * 0.5));
              if (pire >= marge) break;
              e += marge - pire + 0.05;
            }
            return [sx + nx * e, y, sz + nz * e];
          });
          const prec = colonnes[colonnes.length - 1];
          // (reliée à la précédente si leurs points de la côte sont voisins : les points avancés, eux, peuvent s'écarter)
          colonnes.push({ col, nx, nz, px, pz, marge, lie: !!prec && Math.hypot(px - prec.px, pz - prec.pz) < pas * 2.5 });
        }
      }
      // puis chaque case, ses deux triangles (A, B, C) et (A, C, D) : le milieu de leurs bords et leur centre, au-dessus de
      // l'eau, devant le sol ; sinon ses coins avancent encore (au plus 1,5 m de plus)
      const POIDS = [[0.5, 0.5, 0, 0], [0, 0.5, 0.5, 0], [0, 0, 0.5, 0.5], [0.5, 0, 0, 0.5], [0.5, 0, 0.5, 0], [1 / 3, 1 / 3, 1 / 3, 0], [1 / 3, 0, 1 / 3, 1 / 3]];
      const pousse = new Map();
      for (let tour = 0; tour < 3; tour++) {
        const besoin = new Map();
        for (let c = 1; c < colonnes.length; c++) {
          const P0 = colonnes[c - 1], Q = colonnes[c];
          if (!Q.lie) continue;
          for (let r = 0; r + 1 < RANGS.length; r++) {
            const coins = [P0.col[r], Q.col[r], Q.col[r + 1], P0.col[r + 1]], m = Math.max(P0.marge, Q.marge);
            let pire = Infinity;
            for (const w of POIDS) {
              const x = w[0] * coins[0][0] + w[1] * coins[1][0] + w[2] * coins[2][0] + w[3] * coins[3][0], y = w[0] * coins[0][1] + w[1] * coins[1][1] + w[2] * coins[2][1] + w[3] * coins[3][1];
              const z = w[0] * coins[0][2] + w[1] * coins[1][2] + w[2] * coins[2][2] + w[3] * coins[3][2];
              if (y > -0.3) pire = Math.min(pire, devant(x, y, z));
            }
            if (pire >= m) continue;
            coins.forEach((V, q) => besoin.set(V, [Math.max(besoin.get(V)?.[0] || 0, m - pire + 0.05), q < 1 || q > 2 ? P0 : Q]));
          }
        }
        if (!besoin.size) break;
        for (const [V, [de, S]] of besoin) {
          const d = Math.min(de, 1.5 - (pousse.get(V) || 0));
          if (d <= 0) continue;
          V[0] += S.nx * d; V[2] += S.nz * d;
          pousse.set(V, (pousse.get(V) || 0) + d);
        }
      }
      for (let c = 1; c < colonnes.length; c++) {
        const P0 = colonnes[c - 1], Q = colonnes[c];
        if (!Q.lie) continue;
        for (let r = 0; r + 1 < RANGS.length; r++) {
          // (une couleur par case, de la strate de sa hauteur : des bandes, pas une mosaïque de triangles)
          const A = P0.col[r], B = Q.col[r], C = Q.col[r + 1], D = P0.col[r + 1], h = [Q.nx, 0.35, Q.nz], c2 = strate((A[1] + B[1] + C[1] + D[1]) / 4, Q.px, Q.pz);
          tri(pp, cp, A, B, C, c2, h);
          tri(pp, cp, A, C, D, c2, h);
        }
      }
      const gp = new THREE.BufferGeometry();
      gp.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3));
      ap.piece(gp, '#7d6b77', { couleurs: cp, nuance: 0.05 });
      poser(ap.fin(), 0, 0, { y: 0, trait: false, ombre });
    }
    for (let i = 0; i < 90; i++) {
      const k = 8 + (i % 25), [xa, za] = COTE[k], [xb, zb] = COTE[k + 1], f = hasard(i, 21), l = Math.hypot(xb - xa, zb - za) || 1;
      let nx = (zb - za) / l, nz = -(xb - xa) / l;
      if (cote((xa + xb) / 2 + nx * 2, (za + zb) / 2 + nz * 2) > 0) { nx = -nx; nz = -nz; }
      const e = 0.8 + 3 * hasard(i, 22), x = xa + (xb - xa) * f + nx * e, z = za + (zb - za) * f + nz * e;
      if (Math.hypot(x - SOUFFLE.x, z - SOUFFLE.z) < 3) continue;
      const r = 0.6 + 1.4 * hasard(i, 23);
      rocher(morceau(x, z, 60), x, -0.4 + r * 0.25, z, r, r * 0.8, r * 0.9, hasard(i, 24) * 6, 1, true);
    }
    for (const r of RECIFS) for (let k = 0; k < 4; k++) {
      const t = r.ry + k * 1.6, x = r.x + Math.cos(t) * r.rx * 0.5, z = r.z + Math.sin(t) * r.rz * 0.5, s = 0.8 + 0.6 * hasard(k, r.x);
      rocher(morceau(x, z, 60), x, r.h - 0.2, z, s * 1.4, s * 0.6, s, t, 1, true);
    }
  }

  // ---------------------------------------------------------------- Au loin : la forêt, les éoliennes, l'île, les bateaux
  {
    // la forêt des collines, sans trait, par morceaux de 120 m (2026-10-29 : « les arbres ressemblent à des blocs » : c'étaient
    // des boules à vingt faces, une à une, certaines flottant au-dessus des crêtes) : des bouquets de houppiers bosselés de
    // verts différents, posés au plus bas du sol sous eux ; près (moins de 200 m du sanctuaire), trois houppiers à 80 faces ;
    // plus loin, deux à 20 faces ; au-delà de 420 m, un sur deux, seul (la brume les couvre déjà : le chargement)
    const VERTS = ['#3f6a34', '#4a7a3c', '#36602e', '#557f3f', '#2f5a2a'];
    for (let i = 0; i < 2000; i++) {
      const x = -700 + 1400 * hasard(i, 31), z = -420 + 1140 * hasard(32, i), dc = Math.hypot(x, z - 10);
      if (dc < 62 || (z < 60 && Math.abs(x) < 70) || (dc > 420 && hasard(i, 34) < 0.5) || cote(x, z) < 8) continue;
      const pres = dc < 200, n = pres ? 3 : dc < 420 ? 2 : 1, r = (pres ? 2.3 : 3.2) + 1.6 * hasard(i, 33), a = morceau(x, z, 120), fin = pres ? 1 : 0;
      let y = terrain(x, z);
      for (let k = 0; k < (n > 1 ? 4 : 2); k++) y = Math.min(y, terrain(x + Math.cos(k * PI / 2) * r * 0.85, z + Math.sin(k * PI / 2) * r * 0.85));
      for (let k = 0; k < n; k++) {
        const t = hasard(i, 40 + k) * 2 * PI, e = k ? r * 0.8 : 0, rk = r * (k ? 0.68 + 0.2 * hasard(k, i) : 1);
        a.houppe(rk, VERTS[(i + k) % 5], { x: x + Math.cos(t) * e, y: y + rk * (k ? 0.45 : 0.62), z: z + Math.sin(t) * e, sy: 0.86, sorte: 'persistant' }, fin);
      }
    }
    // la colline derrière le parking : des feuillus sur sa pente, des pins noirs penchés par le vent au bord du cap
    for (let i = 0; i < 60; i++) {
      const x = -55 + 120 * hasard(i, 51), z = 50 + 40 * hasard(52, i), dc = Math.hypot(x, z - 10);
      if (dc < 44 || dc > 66 || cote(x, z) < 8) continue;
      const h = 5.5 + 3 * hasard(i, 53), a = morceau(x, z, 60);
      a.arbreTouffu(x, z, h, [VERTS[i % 5], VERTS[(i + 2) % 5]], { y: terrain(x, z), graine: i, loin: true, sorte: 'persistant' });
    }
    // l'île d'Ōmi, au loin, au nord-est
    {
      const a = atelier();
      for (const [x, z, r, h] of [[620, -980, 260, 70], [430, -940, 180, 48], [820, -1010, 200, 55]]) a.piece(new THREE.SphereGeometry(r, 18, 8, 0, 2 * PI, 0, PI / 2), '#6a8a7e', { x, y: -4, z, sy: h / r, sx: 1.4 });
      poser(a.fin(), 0, 0, { y: 0, ombre: false, trait: false });
    }
  }
  // les éoliennes sur les sommets du cap d'en face, en ligne sur la crête (2026-10-29 : « placées bizarrement » : leur pied était
  // au bord des falaises, au niveau de la mer ; refaites : le socle, le mât qui s'affine, la nacelle arrondie, le moyeu et son
  // nez, trois pales effilées et vrillées, le nez face au vent du nord, comme le vent du lieu)
  const eoliennes = (() => {
    const objet = new THREE.Group(), rotors = [];
    const mat = (c) => ctx.maillage(c.fin(0, false));
    const face = Math.atan2(-0.35, -0.94), fx = Math.sin(face), fz = Math.cos(face), BLANC_E = '#eef0ee';
    for (const [x, z] of [[345, -160], [386, -222], [421, -281]]) {
      const y = terrain(x, z) - 0.4, H = 62, a = atelier();
      a.cylindre(3.2, 3.4, 0.8, 16, BETON, { x, y: y + 0.3, z }).fut([x, y + 0.6, z], [x, y + H, z], 2.0, 1.1, BLANC_E, 12)
        .ovale(1.7, BLANC_E, { x: x + fx * 1.2, y: y + H + 1.3, z: z + fz * 1.2, sx: 1.0, sy: 0.95, sz: 3.1, ry: face }, 14);
      objet.add(mat(a));
      const g = new THREE.Group();
      // le moyeu et son nez (dans le rotor : ils tournent avec lui)
      g.add(mat(atelier().cylindre(1.25, 1.25, 1.4, 14, BLANC_E, { z: 0, rx: PI / 2 }).cone(1.25, 2.2, 14, BLANC_E, { z: 1.8, rx: PI / 2 })));
      for (let k = 0; k < 3; k++) {
        // (une pale : 29 m, 1,9 m de large au pied, 35 cm au bout, un peu vrillée)
        const pale = mat(atelier().piece(new THREE.BoxGeometry(1, 1, 1, 1, 8, 1).translate(0, 0.5, 0), '#f4f6f4', {
          deformer: (px, py, pz) => { const l = 1.9 - 1.55 * py ** 0.8, w = 0.42 - 0.3 * py, v = 0.3 * py; return [px * l * Math.cos(v) - pz * w * Math.sin(v), 1.0 + py * 29, px * l * Math.sin(v) + pz * w * Math.cos(v)]; },
        }));
        pale.rotation.z = (k * 2 * PI) / 3;
        g.add(pale);
      }
      g.position.set(x + fx * 7.0, y + H + 1.3, z + fz * 7.0);
      g.rotation.y = face;
      objet.add(g);
      rotors.push({ g, v: 0.9 + 0.2 * hasard(x, z) });
    }
    return { objet, maj(dt) { for (const r of rotors) r.g.children.forEach((p, i) => { if (i) p.rotation.z += dt * r.v; }); return []; } };
  })();
  animes.push(eoliennes);
  // les bateaux de pêche au large : de petits bateaux blancs qui tournent lentement ; la nuit, les lampes des pêcheurs de
  // calmar (漁火, isaribi) : des dizaines de lumières blanches sur la mer, jusqu'à l'horizon
  const mer = (() => {
    const objet = new THREE.Group(), bateaux = [];
    for (const [cx, cz, r, v, s] of [[-140, -260, 60, 0.012, 1], [90, -330, 80, -0.009, 1.1], [-320, -420, 90, 0.007, 1.2], [260, -520, 110, -0.006, 1.3], [-40, -620, 120, 0.005, 1.4]]) {
      const a = atelier();
      a.boite(2.2, 0.9, 7, '#f4f2ea', { y: 0.35 }).boite(2.25, 0.2, 7.05, '#2f5a8a', { y: 0.05, trait: false }).boite(1.6, 1.4, 2, '#f4f2ea', { y: 1.3, z: 1.2 })
        .boite(1.65, 0.4, 2.05, '#2e3a46', { y: 1.55, z: 1.2, trait: false }).cylindre(0.05, 0.05, 3, 5, '#5a5a62', { y: 2.4, z: -1 });
      const m = ctx.maillage(a.fin(0, false));
      m.scale.setScalar(s);
      objet.add(m);
      bateaux.push({ m, cx, cz, r, v, t: hasard(cx, cz) * 6.28 });
    }
    // (par petits groupes de bateaux, entre 1,2 et 2,6 km : vus d'en haut, une rangée de lumières le long de l'horizon)
    const n = 84, pos = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) {
      const g = Math.floor(k / 6), a = -1.1 + 2.3 * hasard(g, 41) + (hasard(k, 43) - 0.5) * 0.03, d = 1200 + 1400 * hasard(42, g) + (hasard(44, k) - 0.5) * 60;
      pos[k * 3] = Math.sin(a) * d; pos[k * 3 + 1] = 3; pos[k * 3 + 2] = -Math.cos(a) * d - 60;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const feux = new THREE.Points(g, new THREE.PointsMaterial({ color: '#f4fff0', size: 5, sizeAttenuation: false, map: tacheDouce(THREE, 0.45), transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
    feux.renderOrder = 3;
    feux.visible = false;
    objet.add(feux);
    return {
      objet,
      maj(dt, temps, c) {
        for (const b of bateaux) {
          b.t += dt * b.v;
          b.m.position.set(b.cx + Math.cos(b.t) * b.r, -0.3 + 0.12 * Math.sin(temps * 1.3 + b.cx), b.cz + Math.sin(b.t) * b.r);
          b.m.rotation.set(0.03 * Math.sin(temps * 0.9 + b.cz), -b.t + (b.v > 0 ? 0 : PI), 0.04 * Math.sin(temps * 1.1));
        }
        feux.visible = c.nuit > 0.3;
        feux.material.opacity = Math.min(1, (c.nuit - 0.3) * 2);
        feux.material.size = 4 + 1.5 * Math.sin(temps * 0.7);
        return [];
      },
    };
  })();
  animes.push(mer);

  // ---------------------------------------------------------------- Le souffle du dragon (龍宮の潮吹)
  const bouffees = creerBouffees(THREE);
  animes.push(bouffees);
  const souffle = creerSouffle(THREE, { x: SOUFFLE.x, z: SOUFFLE.z, y: 0.3 }, bouffees);
  animes.push(souffle);
  // la crique : sa grotte au pied de la falaise (une arche sombre), des rochers
  {
    const a = atelier(), x = SOUFFLE.x - 0.9, z = SOUFFLE.z;
    a.piece(new THREE.SphereGeometry(1.6, 12, 6, 0, PI, 0, PI / 2), '#1a1618', { x, y: -0.5, z, ry: PI / 2, sx: 1, sy: 1.4, sz: 1.3, trait: false });
    for (let k = 0; k < 6; k++) {
      const t = k * 1.1, xr = SOUFFLE.x + 1.2 + Math.cos(t) * 1.8, zr = SOUFFLE.z + Math.sin(t) * 3.2, r = 0.6 + 0.4 * hasard(k, 7);
      rocher(a, xr, -0.2, zr, r, r * 0.8, r, t, 1, true);
    }
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Le tronc des offrandes : le cercle doré, la pièce
  // Le cercle doré monte et descend devant le tronc, ralentit en haut (le tronc est juste sous son point le plus haut) : A
  // quand il est sur le tronc. La pièce vole jusqu'au cercle ; dedans, elle tombe dans le tronc ; sinon, elle retombe.
  const saisen = (() => {
    const objet = new THREE.Group();
    const anneau = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.25, 28), new THREE.MeshBasicMaterial({ color: '#ffd76a', transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide }));
    const piece = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.008, 14), new THREE.MeshBasicMaterial({ color: '#e8c25a' }));
    objet.add(anneau, piece);
    anneau.visible = piece.visible = false;
    anneau.renderOrder = 4;
    const BAS = TRONC.y - 2.0, HAUT = TRONC.y + 0.32, Z = TRONC.z - 0.32;
    let actif = false, t = 0, vol = null;
    const hauteur = () => BAS + (HAUT - BAS) * (0.5 - 0.5 * Math.cos(t * 2.0));
    return {
      objet,
      jouer(oui) { actif = oui; anneau.visible = oui; t = 0; },
      /** Lance une pièce de la main (x, y, z) : se résout à l'arrivée, avec 'dedans', 'bas' ou 'haut'. */
      lancer(main) {
        const y = hauteur(), ecart = y - (TRONC.y + 0.12);
        const issue = Math.abs(ecart) < 0.2 ? 'dedans' : ecart < 0 ? 'bas' : 'haut';
        return new Promise((fin) => { vol = { de: main, vers: [TRONC.x + (issue === 'dedans' ? 0 : (hasard(t, 3) - 0.5) * 0.3), issue === 'dedans' ? TRONC.y + 0.18 : y, Z + (issue === 'dedans' ? 0.3 : 0)], t: 0, issue, fin, chute: 0 }; piece.visible = true; });
      },
      maj(dt) {
        if (actif) { t += dt; anneau.position.set(TRONC.x, hauteur(), Z); anneau.material.opacity = 0.65 + 0.25 * Math.sin(t * 9); }
        if (vol) {
          const { de, vers } = vol;
          if (vol.t < 1) {
            vol.t = Math.min(1, vol.t + dt / 0.75);
            const u = vol.t;
            piece.position.set(de[0] + (vers[0] - de[0]) * u, de[1] + (vers[1] - de[1]) * u + 0.9 * Math.sin(u * PI), de[2] + (vers[2] - de[2]) * u);
            piece.rotation.set(u * 16, u * 5, 0);
          } else if (vol.issue !== 'dedans' && piece.position.y > Y_HAUT + 0.03) {
            // (ratée : elle retombe sur les dalles du palier, ou derrière, sur le parvis)
            vol.chute += dt * 9.8;
            piece.position.y = Math.max(Y_HAUT + 0.03, piece.position.y - vol.chute * dt);
            piece.position.z += (vol.issue === 'haut' ? 1.6 : -0.6) * dt;
          } else {
            const f = vol.fin, issue = vol.issue;
            vol = null;
            piece.visible = false;
            f(issue);
          }
        }
        return [];
      },
    };
  })();
  animes.push(saisen);

  // ---------------------------------------------------------------- Le compteur des torii, le 124e torii, le renard blanc
  // En marchant sous les torii, on les compte (en bas de l'écran : « Torii 37 ») ; tous passés, d'un bout à l'autre, le tampon.
  // La nuit, tant que le secret n'est pas trouvé, le 124e torii pousse dans le trou, une flamme bleue au-dessus de lui : le
  // compte va jusqu'à 124. On le touche : il redevient le renard blanc.
  const renard = creerRenardBlanc(ctx, atelier);
  const lampeRenard = { x: 0, y: -500, z: 0, halo: 0, sol: 0, r: 3.2, c: '#9fd4ff', mobile: true };
  lumieres.push(lampeRenard);
  const torii124 = (() => {
    const s = sPlace(TROU), [x, z, ang] = pointLigne(s), y = yMarche(TROU), c = Math.cos(ang), sn = Math.sin(ang), H = 2.3;
    const a = atelier();
    for (const u of [-1, 1]) {
      const px = c * u * D_PILIER, pz = -sn * u * D_PILIER;
      a.cylindre(0.072, 0.082, H + 0.1, 8, '#e8705a', { x: px, y: H / 2 - 0.05, z: pz }).cylindre(0.098, 0.098, 0.2, 8, P.noir, { x: px, y: 0.08, z: pz });
    }
    a.boite(2 * D_PILIER + 0.62, 0.12, 0.17, '#e8705a', { y: H + 0.06, ry: ang }).boite(2 * D_PILIER + 0.3, 0.09, 0.08, '#c85a44', { y: H - 0.4, ry: ang }).boite(0.07, 0.3, 0.07, '#e8705a', { y: H - 0.2, ry: ang });
    const m = ctx.maillage(a.fin(0, false));
    const objet = new THREE.Group();
    objet.add(m);
    objet.position.set(x, y, z);
    objet.visible = false;
    // la flamme bleue (狐火) au-dessus de lui : un halo et un cœur d'une taille fixe à l'écran, qui dansent
    const fl = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, H + 0.62, 0, 0, H + 0.62, 0]), 3)),
      new THREE.PointsMaterial({ color: '#8fd0ff', size: 30, sizeAttenuation: false, map: flammeDouce(THREE), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    fl.renderOrder = 3;
    objet.add(fl);
    return { objet, x, y, z, ang, fl, H };
  })();
  const compteur = (() => {
    const passes = new Set();
    let surLeChemin = false, n = 0, fini = false, avec124 = false, lu = -1, trouve = secretTrouve('torii124'), nuitDite = false, revele = false, sAvant = 0, tremble = 0, hors = 0;
    const total = () => (avec124 ? N_PLACES : N_PLACES - 1);
    return {
      objet: new THREE.Group(),
      get avec124() { return avec124; },
      set revele(v) { revele = v; },
      get revele() { return revele; },
      /** Le 124e torii tremble un moment (le renard va se montrer). */
      trembler() { tremble = 1.2; },
      maj(dt, temps, c) {
        // (le secret est relu dans le stockage deux fois par seconde)
        if (temps - lu > 0.5) { lu = temps; trouve = secretTrouve('torii124'); }
        const nuit = c.nuit > 0.5;
        avec124 = nuit && !trouve && !revele;
        torii124.objet.visible = avec124;
        tremble = Math.max(0, tremble - dt);
        torii124.objet.position.x = torii124.x + (tremble > 0 ? 0.04 * Math.sin(temps * 61) * tremble : 0);
        torii124.objet.rotation.z = tremble > 0 ? 0.03 * Math.sin(temps * 47) * tremble : 0;
        if (avec124) {
          const v = 0.75 + 0.25 * Math.sin(temps * 7.3) * Math.sin(temps * 3.1 + 1);
          torii124.fl.material.size = (24 + 8 * v) * Math.min(2, window.devicePixelRatio || 1);
          torii124.fl.geometry.attributes.position.setY(0, torii124.H + 0.62 + 0.06 * Math.sin(temps * 2.3));
          torii124.fl.geometry.attributes.position.setX(0, 0.05 * Math.sin(temps * 1.7));
          torii124.fl.geometry.attributes.position.needsUpdate = true;
          Object.assign(lampeRenard, { x: torii124.x, y: torii124.y + torii124.H + 0.4, z: torii124.z });
        } else if (!renard.visible) lampeRenard.y = -500;
        // la première nuit, le compagnon sent un renard (une fois par nuit, tant que le secret n'est pas trouvé)
        if (nuit && !trouve && !nuitDite && c.nuit > 0.95) { nuitDite = true; c.scene((jeu) => comp(jeu, 'nuitCompagnon')); }
        if (!nuit) nuitDite = false;
        // le compte : les places passées pendant qu'on est entre les piliers (2026-10-29 : à peu d'images par seconde, en courant,
        // la première image sur le chemin pouvait déjà être après le premier torii, qui manquait au compte : on compte depuis le
        // bout par où l'on entre ; et il faut quitter le chemin 0,6 s pour que le compte reparte de zéro, pas une seule image)
        const j = c.joueur, l = surLigne(j.x, j.z), sur = l.d < DEMI + 0.05 && Math.abs(j.y - yLigne(l.s)) < 0.8;
        if (sur) {
          hors = 0;
          if (!surLeChemin) { surLeChemin = true; passes.clear(); sAvant = l.s < 3 ? 0 : l.s > L_LIGNE - 3 ? L_LIGNE : l.s; }
          const a = Math.min(sAvant, l.s), b = Math.max(sAvant, l.s);
          for (let k = Math.max(0, Math.floor((a - S0) / ESP)); k <= Math.min(N_PLACES - 1, Math.ceil((b - S0) / ESP)); k++) {
            const sk = sPlace(k);
            if (sk >= a && sk <= b && (k !== TROU || avec124)) passes.add(k);
          }
          sAvant = l.s;
          if (passes.size !== n) { n = passes.size; c.aide?.(`${c.tx?.('compteurNom') ?? 'Torii'} ${n}`); }
          if (!fini && n >= total()) {
            fini = true;
            const cent24 = avec124;
            c.scene(async (jeu) => {
              await jeu.dire(jeu.tx(cent24 ? 'torii124' : 'torii123'));
              if (!jeu.aTampon('torii')) { await jeu.tampon('torii'); await comp(jeu, 'toriiCompagnon'); }
              if (cent24) await comp(jeu, 'torii124Compagnon');
            });
          }
        } else if (surLeChemin && (hors += dt) > 0.6) {
          surLeChemin = false;
          passes.clear();
          if (n) c.aide?.(null);
          n = 0;
          fini = false;
        }
        return [];
      },
    };
  })();
  animes.push(compteur);
  animes.push({ objet: torii124.objet, maj: () => [] });
  animes.push(renard);
  const comp = (jeu, cle) => jeu.dire(jeu.tx(cle)[jeu.compagnon], 'compagnon');
  // après le secret, la nuit : le renard blanc veille, assis au pied du dernier torii, tourné vers la mer
  const VEILLE = (() => { const [x, z] = pointLigne(L_LIGNE + 2.6).slice(0, 2); return { x: x - 1.6, z: z - 1.4 }; })();

  // ---------------------------------------------------------------- Les gens
  const PEAU = P.peau, NOIR = '#2a2226';
  const passants = [
    // la vendeuse de la boutique, devant son comptoir (des glaces, et du tofu frit pour les renards)
    { id: 'vendeuse', x: BOUTIQUE.x + BOUTIQUE.l / 2 - 0.65, z: BOUTIQUE.z, cap: PI / 2, tenue: { taille: 0.94, peau: '#f0c8a6', cheveux: '#3a2a22', coiffure: 'chignon', chapeau: { sorte: 'foulard', c: '#3f5a7a' }, haut: '#f4efe2', manches: 'longues', tablier: '#3f5a7a', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: '#3a3236', semelle: '#3a3236', yeux: 'plisses' }, quand: 'jour' },
    // le patron du café (il fait venir le soir, et rend le matin)
    { id: 'cafe', x: CAFE.x + CAFE.l / 2 - 0.65, z: CAFE.z, cap: PI / 2, tenue: { taille: 1.04, peau: '#e8bf98', cheveux: '#3a3a3a', coiffure: 'court', chapeau: { sorte: 'bandeau', c: '#7a3a2e' }, haut: '#2f2f36', manches: 'longues', tablier: '#7a3a2e', bas: { sorte: 'pantalon', c: '#2a2a30' }, chaussures: '#2a2a30', semelle: '#2a2a30', yeux: 'plisses' } },
    // la miko du bureau des porte-bonheur, derrière son comptoir
    { id: 'miko', x: BUREAU.x - BUREAU.l / 2 - 0.42, z: BUREAU.z, cap: -PI / 2, tenue: { taille: 0.95, peau: '#f4d6c0', cheveux: NOIR, coiffure: 'queue', haut: '#f8f6f0', manches: 'kimono', col: '#f8f6f0', bas: { sorte: 'hakama', c: '#c8282c' }, chaussures: '#f4f0e6', semelle: '#c8a868' }, quand: 'jour' },
    // le gardien du sanctuaire, qui balaie le parvis
    { id: 'gardien', x: 3.4, z: 24.6, cap: -2.2, ronde: [[3.4, 24.6], [6.0, 26.8], [3.4, 24.6], [-2.6, 22.4]], vitesse: 0.4, attente: [6, 12], tenue: { taille: 1.0, peau: '#e0b48c', cheveux: '#c8c4bc', coiffure: 'court', haut: '#f4f0e6', manches: 'kimono', col: '#f4f0e6', bas: { sorte: 'hakama', c: '#5a6a8a' }, chaussures: '#f4f0e6', semelle: '#c8a868', yeux: 'plisses', pose: 'balai' }, quand: 'jour' },
    // le photographe et son trépied, au balcon
    { id: 'photographe', x: -10.4, z: 12.2, cap: 0.7 + PI, tenue: { taille: 1.06, peau: PEAU, cheveux: '#3a2a20', coiffure: 'court', chapeau: { sorte: 'bob', c: '#5a6a4a' }, haut: '#5a6a4a', manches: 'longues', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: '#3a3236', semelle: '#3a3236', appareil: true }, quand: 'jour' },
    // @random_japan_place, qui filme les torii depuis le plateau de roche (son TikTok)
    { id: 'videaste', x: -5.6, z: -37.4, cap: 0.35, tenue: { taille: 1.1, peau: PEAU, cheveux: '#3a2a20', coiffure: 'court', chapeau: { sorte: 'bob', c: '#2f3440' }, haut: '#2f3440', manches: 'courtes', bas: { sorte: 'pantalon', c: '#c9b48a' }, chaussures: P.blanc, semelle: '#3a3236', appareil: true } },
    // deux touristes qui essaient de lancer leurs pièces dans le tronc, au pied du grand torii
    { id: 'touriste', x: -3.0, z: 16.6, cap: PI - 0.25, tenue: { taille: 0.95, peau: '#f2c9a8', cheveux: '#3a2a22', coiffure: 'queue', chapeau: { sorte: 'soleil', c: '#f4efe2' }, haut: '#f59aa6', manches: 'courtes', bas: { sorte: 'jupe', c: '#2f3a5a' }, chaussures: '#f4f0e6', semelle: '#3a3236', appareil: true }, quand: 'jour' },
    { id: 'touriste2', x: 3.1, z: 16.8, cap: PI + 0.25, tenue: { taille: 1.06, peau: PEAU, cheveux: NOIR, coiffure: 'court', haut: '#3a6a5a', manches: 'courtes', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: P.blanc, semelle: '#3a3236' }, quand: 'jour' },
    // le pêcheur, au-delà de la corde au bord de la crique du souffle, sa ligne dans la mer : il reste la nuit ; il ne se tourne
    // pas pour parler (fixe)
    { id: 'pecheur', x: PECHEUR.x, z: PECHEUR.z, cap: PECHEUR.cap, fixe: true, tenue: { pose: 'peche', ligne: { loin: 8.4, bas: terrain(PECHEUR.x, PECHEUR.z) + 0.15 }, taille: 1.0, peau: '#d8a880', cheveux: '#5a5650', coiffure: 'court', chapeau: { sorte: 'casquette', c: '#3a5a7a', c2: '#3a5a7a' }, haut: '#5a6a5a', manches: 'longues', bas: { sorte: 'pantalon', c: '#3a3f4a' }, chaussures: '#2a2a30', semelle: '#2a2a30', yeux: 'plisses' } },
    // une petite fille qui compte les torii, au pied du chemin
    { id: 'enfant', x: -7.6, z: -33.8, cap: 0.6, tenue: { taille: 0.7, peau: PEAU, cheveux: NOIR, coiffure: 'queue', chapeau: { sorte: 'ecolier', c: '#f2c443' }, haut: '#e8583e', manches: 'courtes', bas: { sorte: 'jupe', c: '#3d5a8f' }, chaussures: P.blanc, semelle: '#3a3236' }, quand: 'jour' },
    // une grand-mère qui prie devant le sanctuaire
    { id: 'obaa', x: HONDEN.x + 2.3, z: HONDEN.z - 1.75, cap: -PI / 2 + 0.3, tenue: { taille: 0.86, peau: '#f0c8a6', cheveux: '#d8d4cc', coiffure: 'chignon', haut: '#6a5a7a', manches: 'longues', bas: { sorte: 'pantalon', c: '#4a4a56' }, chaussures: '#3a3236', semelle: '#3a3236', yeux: 'plisses', canne: true }, quand: 'jour' },
    // un randonneur sur le plateau de roche
    { id: 'randonneur', x: 6.6, z: -44.0, cap: 1.0, ronde: [[6.6, -44.0], [-4.0, -48.6], [6.6, -44.0], [11.2, -36.4]], vitesse: 0.7, attente: [5, 10], tenue: { taille: 1.08, peau: '#e8bf98', cheveux: '#3a2a20', coiffure: 'court', chapeau: { sorte: 'casquette', c: '#c8452e', c2: '#f4f0e6' }, haut: '#3a6a8a', manches: 'longues', bas: { sorte: 'pantalon', c: '#5a5a4a' }, chaussures: '#5a4a3a', semelle: '#3a3236', sac: { sorte: 'dos', c: '#c8783a', c2: '#8a4a2a' } }, quand: 'jour' },
    // le chauffeur du car
    { id: 'chauffeur', x: 23.6, z: 41.4, cap: -PI / 2, tenue: { taille: 1.02, peau: '#e8bf98', cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'casquette', c: '#2a3550', c2: '#2a3550' }, haut: '#f4f2ea', manches: 'longues', bas: { sorte: 'pantalon', c: '#2a3550' }, chaussures: '#1f1f24', semelle: '#1f1f24' }, quand: 'jour' },
  ];

  // ---------------------------------------------------------------- Ce qu'on peut faire (tout passe par `jeu`)
  const parler = (id) => ({ id, passant: id, verbe: 'parler', action: (jeu) => jeu.dire(jeu.txn(id), id) });
  const interactions = [
    {
      // le balcon des photos (le tampon) : la vue des cartes postales, les torii qui serpentent jusqu'à la mer
      id: 'vue', x: -8.9, z: 11.6, rayon: 2.4, haut: 1.4, verbe: 'regarder', vers: [6, -20],
      async action(jeu) {
        // (le voyageur au fond du balcon, la caméra devant lui, au-dessus de la rampe : derrière lui, son chapeau cachait le bas
        // de la vue)
        jeu.placer(-8.9, 14.1, Math.atan2(6.5 + 8.9, -22 - 14.1));
        jeu.cadrer({ de: [-8.9, Y_PARVIS + 3.3, 11.9], vers: [6.5, 11, -22], champ: 52 });
        await jeu.attendre(800);
        await jeu.dire(jeu.txn('vue'));
        jeu.cadrer(null);
        if (!jeu.aTampon('vue')) { await jeu.tampon('vue'); await comp(jeu, 'vueCompagnon'); }
      },
    },
    {
      // le tronc des offrandes en haut du grand torii (le tampon) : trois pièces ; le cercle doré monte et descend
      id: 'saisen', x: LANCEUR.x, z: LANCEUR.z, rayon: 1.7, haut: 1.6, verbe: 'lancer', vers: [TRONC.x, TRONC.z],
      async action(jeu) {
        const r = await jeu.choisir(jeu.tx(jeu.aTampon('saisen') ? 'saisenEncore' : 'saisen'), [jeu.t('oui'), jeu.t('non')]);
        if (r !== 0) return;
        jeu.placer(LANCEUR.x, LANCEUR.z, 0);
        jeu.cadrer({ de: [LANCEUR.x + 1.45, Y_HAUT + 0.75, LANCEUR.z - 0.7], vers: [TRONC.x, TRONC.y - 0.3, TRONC.z], champ: 58 });
        saisen.jouer(true);
        let reste = 3, dedans = false;
        jeu.aide(jeu.tx('saisenAide')(reste));
        await new Promise((fini) => {
          let enVol = false;
          jeu.capterAppuis(async () => {
            if (enVol || reste <= 0) return;
            enVol = true;
            reste--;
            jeu.geste('offrir');
            jeu.son('piece');
            const issue = await saisen.lancer([LANCEUR.x + 0.2, Y_HAUT + 1.3, LANCEUR.z + 0.2]);
            jeu.son(issue === 'dedans' ? 'saisen' : 'tombe');
            jeu.geste(null);
            enVol = false;
            if (issue === 'dedans') { dedans = true; jeu.capterAppuis(null); fini(); return; }
            jeu.aide(reste > 0 ? jeu.tx('saisenRate')(reste, issue === 'haut') : jeu.tx('saisenAide')(0));
            if (reste <= 0) { jeu.capterAppuis(null); fini(); }
          });
        });
        saisen.jouer(false);
        jeu.aide(null);
        if (!dedans) { jeu.cadrer(null); await jeu.dire(jeu.tx('saisenPerdu')); return; }
        await jeu.dire(jeu.tx('saisenGagne'));
        jeu.cadrer(null);
        if (!jeu.aTampon('saisen')) { await jeu.tampon('saisen'); await comp(jeu, 'saisenCompagnon'); }
      },
    },
    {
      // le souffle du dragon (le tampon) : attendre la grosse vague
      id: 'shiofuki', x: BELVEDERE.x, z: BELVEDERE.z, rayon: 2.4, haut: 1.4, verbe: 'attendre', vers: [SOUFFLE.x, SOUFFLE.z],
      async action(jeu) {
        const y = Y_ROC;
        jeu.cadrer({ de: [BELVEDERE.x - 2.6, y + 3.4, BELVEDERE.z + 3.4], vers: [SOUFFLE.x, 9, SOUFFLE.z], champ: 64 });
        await jeu.dire(jeu.tx('shiofukiAttente'));
        souffle.jaillir(true);
        await jeu.attendre(2600);
        await jeu.dire(jeu.txn('shiofuki'));
        jeu.cadrer(null);
        if (!jeu.aTampon('shiofuki')) { await jeu.tampon('shiofuki'); await comp(jeu, 'shiofukiCompagnon'); }
      },
    },
    { id: 'panneau-shiofuki', x: PANNEAU_SOUFFLE.x - Math.sin(PANNEAU_SOUFFLE.ry) * 1.2, z: PANNEAU_SOUFFLE.z - Math.cos(PANNEAU_SOUFFLE.ry) * 1.2, rayon: 1.8, verbe: 'lire', vers: [PANNEAU_SOUFFLE.x, PANNEAU_SOUFFLE.z], action: (jeu) => jeu.dire(jeu.tx('panneau-shiofuki')) },
    {
      // la vendeuse : un tofu frit pour les renards (le tampon, devant leurs statues), ou une glace
      id: 'vendeuse', passant: 'vendeuse', verbe: 'parler',
      async action(jeu) {
        const r = await jeu.choisir(jeu.tx('vendeuse'), jeu.tx('vendeuseChoix'), 'vendeuse');
        if (r === 0) {
          if (jeu.aDansSac('aburaage')) { await jeu.dire(jeu.tx('aburaageDeja'), 'vendeuse'); return; }
          jeu.donner('aburaage');
          jeu.son('papier');
          await jeu.dire(jeu.tx('aburaageDonne'), 'vendeuse');
        } else if (r === 1) {
          await jeu.dire(jeu.tx('glace'), 'vendeuse');
          await comp(jeu, 'glaceCompagnon');
        } else await jeu.dire(jeu.tx('vendeuseNon'), 'vendeuse');
      },
    },
    {
      // les renards de pierre du sanctuaire : leur offrir le tofu frit (le tampon) ; sans lui, ce qu'ils aiment
      id: 'renards', x: HONDEN.x + 3.25, z: HONDEN.z, rayon: 2.2, haut: 1.4, verbe: 'regarder', vers: [HONDEN.x + 1.5, HONDEN.z],
      si: (jeu) => !jeu.aDansSac('aburaage'), action: (jeu) => jeu.dire(jeu.txn('renards')),
    },
    {
      id: 'offrande', x: HONDEN.x + 3.25, z: HONDEN.z, rayon: 2.2, haut: 1.4, verbe: 'offrir', vers: [HONDEN.x + 1.5, HONDEN.z],
      si: (jeu) => jeu.aDansSac('aburaage'),
      async action(jeu) {
        jeu.cadrer({ de: [HONDEN.x + 5.9, Y_PARVIS + 1.8, HONDEN.z - 2.6], vers: [HONDEN.x + 0.6, Y_PARVIS + 0.9, HONDEN.z + 0.2], champ: 48 });
        jeu.geste('offrir');
        await jeu.attendre(800);
        jeu.prendre('aburaage');
        jeu.geste(null);
        offrande.poser();
        await jeu.dire(jeu.tx('offrande'));
        offrande.briller();
        await jeu.attendre(900);
        jeu.cadrer(null);
        if (!jeu.aTampon('kitsune')) { await jeu.tampon('kitsune'); await comp(jeu, 'offrandeCompagnon'); }
      },
    },
    { id: 'honden', x: HONDEN.x + 2.45, z: HONDEN.z + 1.25, rayon: 1.5, haut: 1.4, verbe: 'prier', vers: [HONDEN.x, HONDEN.z], async action(jeu) { jeu.geste('prier'); jeu.son('claque'); await jeu.attendre(3200); jeu.geste(null); await jeu.dire(jeu.txn('honden')); } },
    { id: 'ema', x: 4.9, z: 19.4, rayon: 1.7, haut: 1.3, verbe: 'regarder', vers: [6.4, 19.6], action: (jeu) => jeu.dire(jeu.tx('ema')) },
    { id: 'chozuya', x: 3.6, z: 25.9, rayon: 1.6, haut: 1.0, verbe: 'regarder', vers: [3.6, 27.4], action: (jeu) => jeu.dire(jeu.tx('chozuya')) },
    { id: 'petit', x: PETIT.x + 1.9, z: PETIT.z + 0.8, rayon: 1.6, haut: 1.2, verbe: 'prier', vers: [PETIT.x, PETIT.z], async action(jeu) { jeu.geste('prier'); jeu.son('claque'); await jeu.attendre(2600); jeu.geste(null); await jeu.dire(jeu.tx('petit')); } },
    { id: 'otorii', x: 0, z: 17.0, rayon: 1.8, haut: 2.6, verbe: 'regarder', vers: [OTORII.x, OTORII.z], async action(jeu) { jeu.cadrer({ de: [0.6, Y_PARVIS + 1.4, 19.6], vers: [0, Y_PARVIS + 4.6, OTORII.z], champ: 54 }); await jeu.attendre(600); await jeu.dire(jeu.txn('otorii')); jeu.cadrer(null); } },
    { id: 'mer', x: 2.0, z: -53.0, rayon: 2.6, haut: 1.4, verbe: 'regarder', vers: [2, -80], action: (jeu) => jeu.dire(jeu.txn('mer')) },
    { id: 'rochers', x: -16.6, z: -44.0, rayon: 2.2, haut: 1.4, verbe: 'regarder', vers: [-26, -46], action: (jeu) => jeu.dire(jeu.tx('rochers')) },
    {
      // le 124e torii (le secret) : la nuit, tant qu'il est là ; le toucher
      id: 'torii124', x: torii124.x, z: torii124.z, rayon: 1.1, haut: 2.0, verbe: 'toucher', si: () => compteur.avec124,
      async action(jeu) {
        // (le voyageur une marche et demie au-dessus du torii, tourné vers lui : le renard naît à sa place, en face ; la caméra
        // de côté, hors des piliers, du côté où la pente descend)
        const t = torii124, c = Math.cos(t.ang), sn = Math.sin(t.ang), sJ = sPlace(TROU) - 1.5, [px, pz] = pointLigne(sJ);
        jeu.placer(px, pz, t.ang);
        const mx = (px + t.x) / 2, mz = (pz + t.z) / 2, my = (yLigne(sJ) + t.y) / 2;
        jeu.cadrer({ de: [mx - c * 3.6, my + 1.5, mz + sn * 3.6], vers: [mx, my + 0.85, mz], champ: 52 });
        await jeu.dire(jeu.tx('torii124Toucher'));
        compteur.trembler();
        await jeu.attendre(1100);
        compteur.revele = true;
        await renard.apparaitre(jeu, t);
        await jeu.dire(jeu.tx('kitsune'), 'kitsune');
        await comp(jeu, 'kitsuneCompagnon');
        await renard.partir(jeu);
        jeu.cadrer(null);
      },
    },
    {
      id: 'koban124', x: torii124.x, z: torii124.z, rayon: 1.4, haut: 0.6, verbe: 'prendre', si: (jeu) => compteur.revele && !jeu.secretTrouve('torii124'),
      async action(jeu) {
        jeu.geste('offrir');
        await jeu.attendre(600);
        renard.koban(false);
        jeu.geste(null);
        await jeu.trouverSecret('torii124');
      },
    },
    { id: 'veille', x: VEILLE.x + 1.2, z: VEILLE.z + 1.0, rayon: 1.8, haut: 1.0, verbe: 'regarder', vers: [VEILLE.x, VEILLE.z], si: (jeu) => jeu.estNuit && jeu.secretTrouve('torii124'), action: (jeu) => jeu.dire(jeu.tx('kitsuneApres')) },
    {
      // le patron du café : il fait venir le soir (les feux des bateaux de pêche) ; la nuit, il rend le matin
      id: 'cafe', passant: 'cafe', verbe: 'parler',
      async action(jeu) {
        if (!jeu.estNuit) {
          const r = await jeu.choisir(jeu.tx('cafeJour'), [jeu.t('oui'), jeu.t('non')], 'cafe');
          if (r !== 0) { await jeu.dire(jeu.tx('cafeNon'), 'cafe'); return; }
          await jeu.nuit(true);
          await jeu.dire(jeu.tx('cafeSoir'), 'cafe');
          return;
        }
        const r = await jeu.choisir(jeu.tx('cafeNuit'), [jeu.t('oui'), jeu.t('non')], 'cafe');
        if (r !== 0) { await jeu.dire(jeu.tx('cafeReste'), 'cafe'); return; }
        await jeu.nuit(false);
        await jeu.dire(jeu.tx('cafeMatin'), 'cafe');
      },
    },
    { id: 'videaste', passant: 'videaste', verbe: 'parler', async action(jeu) { await jeu.dire(jeu.tx('videaste'), 'videaste'); await jeu.video(); } },
    parler('miko'), parler('gardien'), parler('photographe'), parler('touriste'), parler('touriste2'), parler('pecheur'), parler('enfant'), parler('obaa'), parler('randonneur'), parler('chauffeur'),
    { id: 'panneau-yuisho', x: -6.6 - Math.sin(0) * 1.2, z: 29.4 - 1.2, rayon: 1.8, verbe: 'lire', vers: [-6.6, 29.4], action: (jeu) => jeu.dire(jeu.tx('panneau-yuisho')) },
    { id: 'panneau-photo', x: -6.2 - Math.sin(PI - 0.4) * 1.2, z: 15.6 - Math.cos(PI - 0.4) * 1.2, rayon: 1.6, verbe: 'lire', vers: [-6.2, 15.6], action: (jeu) => jeu.dire(jeu.tx('panneau-photo')) },
    ...interactionsBancs(bancs),
  ];
  // l'offrande : le tofu frit posé devant les renards, leurs yeux qui brillent un instant
  const offrande = (() => {
    const objet = new THREE.Group(), a = atelier(), q = repere(HONDEN.x, HONDEN.z, PI / 2);
    const p = q(0, Y_PARVIS + 0.68, 0.5);
    a.cylindre(0.11, 0.09, 0.02, 14, '#f4f0e6', { x: p.x, y: p.y, z: p.z }).boite(0.13, 0.025, 0.08, '#d89a4a', { x: p.x, y: p.y + 0.022, z: p.z, ry: 0.4 });
    const m = ctx.maillage(a.fin(0, false));
    m.visible = false;
    objet.add(m);
    const yeux = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array([...[-1, 1].flatMap((u) => { const r = q(u * 1.55, 0, 1.5 + 2.1), ry = PI / 2 - u * 0.55; return [r.x + Math.sin(ry) * 0.17, Y_PARVIS + 1.47, r.z + Math.cos(ry) * 0.17]; })]), 3)),
      new THREE.PointsMaterial({ color: '#ffd76a', size: 14, sizeAttenuation: false, map: etoileDouce(THREE), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    yeux.visible = false;
    objet.add(yeux);
    let t = 0;
    return { objet, poser() { m.visible = true; }, briller() { t = 1.4; }, maj(dt) { t = Math.max(0, t - dt); yeux.visible = t > 0; yeux.material.opacity = Math.min(1, t * 2); return []; } };
  })();
  animes.push(offrande);
  const actionBete = async (jeu, b) => {
    if (b.sorte !== 'chat') { await jeu.dire(jeu.txn(b.sorte)); return; }
    await jeu.dire(jeu.txn(b.id));
    await jeu.dire(jeu.tx('chatCompagnon')[jeu.compagnon], 'compagnon');
  };
  const depart = { x: DEPART.x, z: DEPART.z, cap: -PI / 2 };
  // (le renard blanc veille au bout du chemin, la nuit, une fois le secret trouvé)
  renard.veiller(VEILLE);
  // les morceaux du décor : près, avec leur trait et leur ombre ; au loin (la forêt des collines), sans
  for (const [k, a] of morceaux) poser(a.fin(), 0, 0, { y: 0, ...(Number(k.split(':')[0]) >= 100 ? { trait: false, ombre: false } : {}) });

  return {
    ...infos, textes: TEXTES,
    objets, monde, terrain, etiquettes, passants, daims: [], interactions, actionDaim: null, vapeurs, bancs, lumieres, actionBete, animes,
    // (le secret, tresors.js ; le marchand ; les sons à fabriquer en plus ; les feux d'artifice, au-dessus de la mer, au nord)
    secret: 'torii124', marchand: MARCHAND, sons: ['claque', 'papier', 'piece', 'tombe', 'saisen', 'oiseau/shiofuki'],
    feux: { x: -10, y: 0, z: -185, large: 80, haut: [40, 64] },
    // les mouettes (mouettes.js) : au-dessus de la mer et de la crique ; posées sur les buttes, au bord du plateau, et sur le
    // linteau du grand torii
    mouettes: {
      vols: [{ x: 8, z: -66, r: 16, h: 18, sens: 1 }, { x: 30, z: -40, r: 9, h: 14, sens: -1 }, { x: -48, z: -40, r: 18, h: 22, sens: 1 }],
      poses: [
        { x: -27.5, z: -47.5, y: Y_ROC + 6.2, cap: 2.2, mer: [-0.6, -1] },
        { x: -6.0, z: -62.0, y: Y_ROC + 4.0, cap: 0.4, mer: [0, -1] },
        { x: 12.4, z: -58.2, y: Y_ROC + 3.0, cap: -0.6, mer: [0.4, -1] },
        { x: 10.6, z: -51.2, cap: 1.2, mer: [0.3, -1] },
        { x: OTORII.x + 1.1, z: OTORII.z, y: Y_PARVIS + OTORII.h + 0.52, cap: PI / 2, mer: [0, -1], fuite: 7 },
      ],
    },
    // les bêtes (betes.js) : le chat de la boutique, des libellules rouges, des papillons sur la pente, les milans du cap
    betes: {
      chats: [{ id: 'chatTigre', x: BOUTIQUE.x + BOUTIQUE.l / 2 + 1.3, z: BOUTIQUE.z + 3.95, cap: 1.4, robe: 'roux', dort: true }],
      papillons: [[12, 2], [-18, -8], [26, -14], [-8, 22]], libellules: [[6, 24], [-4, -40], [14, 30]],
      milans: [{ x: 0, z: -30, r: 46, h: 48, sens: 1 }, { x: 40, z: -80, r: 30, h: 36, sens: -1 }],
    },
    aspectSol: (x, z, h) => aspectSol(P, x, z, h),
    // (le sol en cases de 25 cm le long du chemin des torii et au bord des falaises du plateau)
    solDetaille,
    etendue: ETENDUE,
    eau: { x0: -1400, x1: 1400, z0: -1400, z1: 140, niveau: 0, clair: '#5fc4c0', profond: '#1f5c9e' },
    centreRive: [0, -40],
    vent: { dir: [0.35, 0.94], force: 1.0 }, oiseaux: ['milan', 'mouette'], ambiances: ['vagues', 'insectes'],
    brume: [180, 1700],
    // (le lointain flou plus loin que le style, 90–260 m : les falaises de la côte, à 50–150 m, restent nettes ; 2026-10-29)
    flou: [170, 480],
    soleil: [-0.35, 0.74, 0.58],
    depart,
    photos: {
      heros: { x: -8.6, z: 12.6, cap: 2.6, lacet: 2.6 + PI + 0.25, tangage: 0.22, distance: 6.2 },
      perso: { x: 0.0, z: 17.2, cap: PI, lacet: PI + PI + 0.15, tangage: 0.1, distance: 4.4 },
    },
  };
}

// ---------------------------------------------------------------- Les formes de ce lieu
/** La silhouette d'un renard qui court (de profil, le museau vers +x), dans un carré d'un mètre : une THREE.Shape. */
function silhouetteRenard(THREE) {
  const P = [[-0.62, 0.42], [-0.48, 0.4], [-0.34, 0.2], [-0.2, 0.1], [0.08, 0.1], [0.24, 0.16], [0.28, 0.3], [0.33, 0.21], [0.4, 0.33], [0.41, 0.2], [0.48, 0.16],
    [0.58, 0.09], [0.44, 0.08], [0.32, 0.05], [0.24, -0.05], [0.31, -0.25], [0.23, -0.26], [0.13, -0.08], [-0.1, -0.08], [-0.2, -0.28], [-0.3, -0.28],
    [-0.22, -0.1], [-0.28, 0.04], [-0.4, 0.12], [-0.56, 0.3]];
  const s = new THREE.Shape();
  P.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  s.closePath();
  return s;
}
/**
 * Le renard blanc du secret (白狐) : le messager d'Inari venu en rêve au fondateur, assis, plus grand que Kon, blanc avec les
 * marques rouges des renards d'Inari (le dedans des oreilles, deux traits au coin des yeux), une longue queue touffue au
 * bout doré ; un halo bleuté autour de lui et deux flammes de renard (狐火) qui tournent. apparaitre(jeu, t) : il naît du
 * 124e torii (t : sa place) ; partir(jeu) : il salue et s'en va en flammes, laissant un koban sur la marche ; koban(oui) ;
 * veiller(p) : la nuit, une fois le secret trouvé, il veille assis en p, tourné vers la mer.
 */
function creerRenardBlanc(ctx, atelier) {
  const { THREE } = ctx;
  const a = atelier(), B = '#f8f6f0', BO = '#e8e4da', RG = '#d8402c', OR = '#e8b941', N = '#2a2420';
  // le corps assis (un œuf penché), le poitrail, les cuisses, les pattes de devant, la tête, le museau, les oreilles
  a.ovale(0.27, B, { y: 0.36, z: -0.06, sx: 0.88, sy: 1.15, sz: 1.0, rx: -0.25 }, 14)
    .ovale(0.19, B, { y: 0.6, z: 0.07, sx: 0.92, sy: 1.1, sz: 0.85 }, 12);
  for (const u of [-1, 1]) {
    a.ovale(0.17, BO, { x: u * 0.16, y: 0.2, z: -0.1, sx: 0.7, sy: 0.9, sz: 1.15 }, 10)
      .baton([u * 0.085, 0.52, 0.12], [u * 0.09, 0.03, 0.17], 0.036, B, 7).ovale(0.045, BO, { x: u * 0.09, y: 0.025, z: 0.21, sz: 1.5, sy: 0.6 }, 8);
  }
  a.ovale(0.15, B, { y: 0.92, z: 0.1, sx: 1.0, sy: 0.92, sz: 1.05 }, 14)
    .cone(0.065, 0.21, 10, B, { y: 0.88, z: 0.3, rx: PI / 2 }).ovale(0.024, N, { y: 0.885, z: 0.41 }, 6);
  for (const u of [-1, 1]) {
    a.cone(0.07, 0.22, 4, B, { x: u * 0.085, y: 1.1, z: 0.07, rz: -u * 0.22, ry: PI / 4 })
      .cone(0.04, 0.15, 4, '#e8705a', { x: u * 0.085, y: 1.08, z: 0.095, rz: -u * 0.22, ry: PI / 4, trait: false });
    // les yeux en amande, et les deux traits rouges qui montent vers les oreilles
    a.boite(0.05, 0.014, 0.01, N, { x: u * 0.06, y: 0.95, z: 0.235, rz: u * 0.35, trait: false })
      .boite(0.06, 0.012, 0.008, RG, { x: u * 0.085, y: 0.985, z: 0.225, rz: u * 0.6, ry: -u * 0.3, trait: false });
  }
  // la queue : des touffes de plus en plus fines le long d'une courbe qui monte derrière lui et revient sur le côté, le bout doré
  const Q = [[0, 0.16, -0.3], [0.2, 0.26, -0.44], [0.38, 0.48, -0.42], [0.44, 0.72, -0.26], [0.38, 0.9, -0.08]];
  for (let k = 0; k < 9; k++) {
    const f = k / 8, i = Math.min(3, Math.floor(f * 4)), g = f * 4 - i, p = Q[i].map((v, c) => v + (Q[i + 1][c] - v) * g), r = 0.11 * (1 - 0.55 * f) + 0.02;
    a.ovale(r, k > 6 ? OR : B, { x: p[0], y: p[1], z: p[2], sx: 1, sy: 1.25, sz: 1 }, 10);
  }
  const corps = ctx.maillage(a.fin(0, false));
  const objet = new THREE.Group(), pivot = new THREE.Group();
  pivot.add(corps);
  pivot.scale.setScalar(1.35);
  objet.add(pivot);
  objet.visible = false;
  // le halo et les deux flammes
  const aura = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0.75, 0]), 3)),
    new THREE.PointsMaterial({ color: '#bfe4ff', size: 2.8, sizeAttenuation: true, map: tacheDouce(THREE, 0.2), transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
  const flammes = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3)),
    new THREE.PointsMaterial({ color: '#8fd0ff', size: 0.55, sizeAttenuation: true, map: flammeDouce(THREE), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  aura.renderOrder = flammes.renderOrder = 3;
  objet.add(aura, flammes);
  const koban = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.025, 24), new THREE.MeshLambertMaterial({ color: '#e8b941', emissive: '#7a5a14' }));
  koban.scale.set(0.72, 1, 1.15);
  koban.visible = false;
  const groupe = new THREE.Group();
  groupe.add(objet, koban);
  let scene = false, veille = null, phaseQueue = 0, fondu = 0, depart = 0, lu = -1, trouve = false, joueur = null;
  const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
  return {
    objet: groupe,
    get visible() { return objet.visible; },
    async apparaitre(jeu, t) {
      scene = true;
      objet.position.set(t.x, t.y, t.z);
      objet.rotation.y = joueur ? Math.atan2(joueur.x - t.x, joueur.z - t.z) : t.ang + PI;
      jeu.nuage?.(t.x, t.y + 1.0, t.z, 2.4);
      jeu.son('magie');
      await attendre(350);
      objet.visible = true;
      fondu = 0.01;
      jeu.son('cri/kon');
      await attendre(900);
    },
    async partir(jeu) {
      depart = 0.01;
      jeu.son('magie');
      await attendre(1500);
      jeu.nuage?.(objet.position.x, objet.position.y + 0.8, objet.position.z, 1.6);
      objet.visible = false;
      koban.position.set(objet.position.x, objet.position.y + 0.55, objet.position.z);
      koban.visible = true;
      depart = 0;
      scene = false;
      await attendre(500);
    },
    koban(oui) { koban.visible = oui; },
    veiller(p) { veille = p; },
    maj(dt, temps, c) {
      joueur = c.joueur;
      if (temps - lu > 0.5) { lu = temps; trouve = secretTrouve('torii124'); }
      // la nuit, le secret trouvé : il veille au bout du chemin
      if (!scene && veille) {
        const voir = trouve && c.nuit > 0.5;
        if (voir !== objet.visible) {
          objet.visible = voir;
          objet.position.set(veille.x, terrain(veille.x, veille.z), veille.z);
          objet.rotation.y = PI + 0.25;
          fondu = 1;
        }
      }
      if (!objet.visible && !koban.visible) return [];
      // il respire, sa queue balance doucement (la phase s'ajoute : jamais le temps multiplié par ce qui varie), il apparaît
      phaseQueue += dt * 1.4;
      fondu = Math.min(1, fondu + (fondu > 0 && fondu < 1 ? dt * 2.2 : 0));
      const salut = depart > 0 ? Math.sin(Math.min(1, (depart += dt) / 1.2) * PI) : 0;
      pivot.scale.set(1.35 * (0.6 + 0.4 * fondu), 1.35 * (0.6 + 0.4 * fondu) * (1 + 0.015 * Math.sin(temps * 2.1)), 1.35 * (0.6 + 0.4 * fondu));
      pivot.rotation.set(0.35 * salut, 0.04 * Math.sin(phaseQueue), 0);
      aura.material.opacity = (0.4 + 0.15 * Math.sin(temps * 2.7)) * fondu * (c.nuit > 0.5 ? 1 : 0.5);
      const P2 = flammes.geometry.attributes.position;
      for (let k = 0; k < 2; k++) { const t = temps * 0.9 + k * PI; P2.setXYZ(k, Math.cos(t) * 0.8, 0.9 + 0.25 * Math.sin(temps * 1.7 + k), Math.sin(t) * 0.8); }
      P2.needsUpdate = true;
      flammes.material.opacity = fondu;
      if (koban.visible) { koban.rotation.y += dt * 2.4; koban.position.y += Math.sin(temps * 3) * 0.002; }
      return [];
    },
  };
}

/**
 * Le souffle du palais du dragon (龍宮の潮吹) : une vague entre dans la grotte de la crique, l'écume gonfle, puis la mer
 * jaillit d'un coup entre les rochers, en gerbe blanche que le vent rabat, et retombe en pluie ; un arc-en-ciel le jour.
 * Toutes les dix à vingt secondes, parfois plus haut. S : { x, z, y (la bouche) }. jaillir(gros) : tout de suite ; le bruit
 * (« oiseau/shiofuki ») quand il part, si l'on est assez près.
 */
function creerSouffle(THREE, S, bouffees) {
  // (2026-10-28 : la gerbe était un cylindre blanc transparent, comme une colonne de lumière ; c'est maintenant de l'écume :
  // des gouttes, et au milieu de grosses taches douces qui montent serrées, grossissent et s'effacent)
  const N = 520, nu = nuee(THREE, N, { tache: tacheDouce(THREE, 0.45) }), gouttes = [];
  const objet = new THREE.Group();
  objet.add(nu.m);
  const ecume = new THREE.Mesh(new THREE.CircleGeometry(1, 28).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }));
  ecume.position.set(S.x + 1.0, 0.06, S.z);
  ecume.renderOrder = 2;
  objet.add(ecume);
  // l'arc-en-ciel : trois anneaux minces (rouge, vert, violet) dans la gerbe, tournés vers le plateau (l'ouest)
  const arc = new THREE.Group();
  for (const [r, c] of [[6.0, '#ff5a3a'], [5.75, '#ffd84a'], [5.5, '#5ad66a'], [5.25, '#4a8aff'], [5.0, '#9a5aff']]) {
    const m = new THREE.Mesh(new THREE.RingGeometry(r - 0.13, r, 40, 1, 0.25, PI - 0.5), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false }));
    m.renderOrder = 3;
    arc.add(m);
  }
  arc.position.set(S.x + 0.6, 1.5, S.z);
  arc.rotation.y = -PI / 2;
  objet.add(arc);
  let t = 5, force = 0, bruit = false, grand = 1;
  const DUREE = 3.4;
  return {
    objet,
    jaillir(gros) { if (t > 1.3) t = 1.3; if (gros) grand = 1.3; },
    actif: () => t <= 0 && t > -DUREE,
    maj(dt, temps, c) {
      t -= dt;
      const sons = [], e = -t;
      // la vague qui monte dans la crique avant le jet (1,3 s), l'écume qui s'étale après
      const houle = t > 0 && t < 1.3 ? 1 - t / 1.3 : e > 0 && e < 2.5 ? 1 - e / 2.5 : 0;
      ecume.scale.setScalar(1.2 + 2.6 * houle);
      ecume.material.opacity = 0.55 * houle;
      force = e < 0 ? 0 : e < 0.22 ? e / 0.22 : e < 1.0 ? 1 : Math.max(0, (DUREE - e) / (DUREE - 1.0));
      if (e > 0 && !bruit) {
        bruit = true;
        if (Math.hypot(c.joueur.x - S.x, c.joueur.z - S.z) < 90) sons.push({ x: S.x, y: 3, z: S.z, nom: 'shiofuki', fort: 2 * grand });
        bouffees.emettre(S.x, S.y + 1.5, S.z, { duree: 2.2, n: 60, large: 3.2, haut: 8 * grand, taille: 3.4 });
      }
      if (e > DUREE + 1.5) { t = 9 + Math.random() * 12; bruit = false; grand = Math.random() < 0.3 ? 1.3 : 0.8 + 0.3 * Math.random(); }
      // l'arc-en-ciel : le jour, dans la gerbe qui retombe
      const vArc = Math.max(0, 1 - c.nuit * 2) * Math.max(0, Math.min(1, (e - 0.6) * 2)) * Math.max(0, Math.min(1, (DUREE + 1 - e) / 1.5));
      arc.visible = vArc > 0.01;
      arc.children.forEach((m) => { m.material.opacity = 0.16 * vArc; });
      // les gouttes : elles partent de la bouche, montent, le vent les rabat vers la terre, elles retombent en pluie ; l'écume
      // (coeur) : plus grosse, serrée autour de l'axe, elle monte, s'élargit et s'efface avant de retomber
      const g = 0.92 - 0.45 * c.nuit;
      for (let k = 0; k < N; k++) {
        let q = gouttes[k];
        if (!q && force > 0.05 && Math.random() < force * dt * 1.6) {
          const an = Math.random() * 2 * PI, coeur = Math.random() < 0.45, sp = Math.random() * (coeur ? 0.5 : 1.2);
          q = gouttes[k] = { x: S.x + Math.cos(an) * 0.3, y: S.y, z: S.z + Math.sin(an) * 0.3, vx: Math.cos(an) * sp, vz: Math.sin(an) * sp, vy: (9 + Math.random() * 4) * grand * (0.55 + 0.45 * force), age: 0, coeur };
        }
        if (!q) continue;
        q.age += dt;
        q.vy -= (q.coeur ? 7 : 9.8) * dt;
        q.vx += (0.9 - q.vx * 0.3) * dt; q.vz += (2.0 - q.vz * 0.3) * dt;
        q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
        if (q.y < -0.2 || (q.coeur && q.age > 2.2)) { gouttes[k] = null; nu.ranger(k); continue; }
        if (q.coeur) nu.poser(k, q.x, q.y, q.z, 1.0 + 1.6 * Math.min(1, q.age / 1.4), g, g * 1.03, g * 1.06, 0.62 * Math.min(1, q.age * 8) * (1 - q.age / 2.2) ** 1.2);
        else nu.poser(k, q.x, q.y, q.z, 0.35 + 0.5 * Math.min(1, q.age), g, g * 1.04, g * 1.08, 0.75 * Math.max(0, 1 - q.age / 3.5));
      }
      nu.fin();
      return sons;
    },
  };
}

// ---------------------------------------------------------------- Les voitures du parking
// (2026-10-29, la liste du propriétaire : « refaire les voitures » : c'étaient deux boîtes et quatre roues) L longueur, W
// largeur, rw rayon des roues, ab demi-empattement, cap capot (de l'avant au pied du pare-brise), ar coffre (de l'arrière au
// pied de la lunette), yb hauteur de la ceinture de caisse (le bas des vitres), yt du toit, pare et lun l'avancée du
// pare-brise et de la lunette arrière, montants : où sont les montants des vitres de côté (0 : à l'avant de la verrière, 1 à
// l'arrière), plaque : jaune pour les kei (軽自動車), blanche pour les autres
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
    a.boite(0.33, 0.165, 0.014, V.plaque, R(0, y + g + 0.26, zp + sens * (0.04 + 0.006), { trait: false }))
      .boite(0.2, 0.03, 0.006, sorte === 'kei' ? '#2a2a2a' : '#2f6a4a', R(0, y + g + 0.28, zp + sens * (0.04 + 0.015), { trait: false }));
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

// ---------------------------------------------------------------- Les points doux (le jet, les halos, la flamme)
/** Une tache ronde et douce, blanche (un DataTexture de 32 × 32) ; dur : la part du cœur plein. */
function tacheDouce(THREE, dur = 0.22) {
  const TX = 32, px = new Uint8Array(TX * TX * 4);
  for (let j = 0; j < TX; j++) for (let i = 0; i < TX; i++) {
    const r = Math.hypot(i - TX / 2 + 0.5, j - TX / 2 + 0.5) / (TX / 2), v = Math.min(1, Math.exp(-r * r * 3.2) * 0.9 + Math.max(0, 1 - r / dur) * 0.4) * (r < 1 ? 1 : 0);
    px.set([255, 255, 255, Math.round(v * 255)], (j * TX + i) * 4);
  }
  const t = new THREE.DataTexture(px, TX, TX);
  t.magFilter = t.minFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}
/** Une flamme douce (une goutte pointue vers le haut, le cœur plus clair) : la flamme du renard (狐火). */
function flammeDouce(THREE) {
  const TX = 64, px = new Uint8Array(TX * TX * 4);
  for (let j = 0; j < TX; j++) for (let i = 0; i < TX; i++) {
    const x = (i - TX / 2 + 0.5) / (TX / 2), y = (TX / 2 - j - 0.5) / (TX / 2);
    // (plus étroite en haut : la largeur se resserre quand y monte)
    const larg = 0.55 * (1 - Math.max(0, y) * 0.85) + 0.05, r = Math.hypot(x / larg, (y + 0.25) / 0.75);
    const v = Math.max(0, 1 - r) ** 1.4 + Math.exp(-(x * x + (y + 0.3) ** 2) * 30) * 0.6;
    px.set([255, 255, 255, Math.round(Math.min(1, v) * 255)], (j * TX + i) * 4);
  }
  const t = new THREE.DataTexture(px, TX, TX);
  t.magFilter = t.minFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}
/** Une étoile douce à quatre branches (l'éclat dans les yeux des renards de pierre). */
function etoileDouce(THREE) {
  const TX = 64, px = new Uint8Array(TX * TX * 4);
  for (let j = 0; j < TX; j++) for (let i = 0; i < TX; i++) {
    const x = (i - TX / 2 + 0.5) / (TX / 2), y = (j - TX / 2 + 0.5) / (TX / 2);
    const branches = Math.exp(-Math.abs(y) * 20) * Math.max(0, 1 - Math.abs(x)) ** 1.5 + Math.exp(-Math.abs(x) * 20) * Math.max(0, 1 - Math.abs(y)) ** 1.5;
    const v = Math.min(1, branches * 0.9 + Math.exp(-(x * x + y * y) * 28));
    px.set([255, 255, 255, Math.round(v * 255)], (j * TX + i) * 4);
  }
  const t = new THREE.DataTexture(px, TX, TX);
  t.magFilter = t.minFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}
/**
 * Des points qui bougent (une gerbe, des bouffées) : un seul objet de n points, leur taille en mètres un par un (l'attribut
 * taille), leur couleur et leur transparence un par un ; ceux qui ne servent pas, rangés sous le sol.
 */
function nuee(THREE, n, o = {}) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3).fill(-500), 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 4), 4).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('taille', new THREE.BufferAttribute(new Float32Array(n), 1).setUsage(THREE.DynamicDrawUsage));
  const mat = new THREE.PointsMaterial({ size: 1, sizeAttenuation: true, vertexColors: true, map: o.tache || tacheDouce(THREE), transparent: true, depthWrite: false, fog: true });
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('uniform float size;', 'uniform float size;\nattribute float taille;').replace('gl_PointSize = size;', 'gl_PointSize = size * taille;');
  };
  const m = new THREE.Points(g, mat);
  m.frustumCulled = false;
  m.renderOrder = 2;
  const A = g.attributes;
  return {
    m,
    poser(k, x, y, z, taille, r, v, b, a) { A.position.setXYZ(k, x, y, z); A.taille.setX(k, taille); A.color.setXYZW(k, r, v, b, a); },
    ranger(k) { A.position.setXYZ(k, 0, -500, 0); A.taille.setX(k, 0); },
    fin() { A.position.needsUpdate = A.taille.needsUpdate = A.color.needsUpdate = true; },
  };
}
/**
 * Des bouffées d'embruns (le souffle du dragon) : emettre(x, y, z, { duree, n, large, haut, taille }) en fait monter n pendant
 * duree secondes ; elles grossissent, montent en ralentissant, s'effacent. La nuit, plus grises.
 */
function creerBouffees(THREE) {
  const N = 200, nu = nuee(THREE, N), parts = [], attente = [];
  let libre = 0;
  return {
    objet: nu.m,
    emettre(x, y, z, { duree = 2, n = 30, large = 0.8, haut = 4, taille = 1.5 } = {}) {
      for (let k = 0; k < n; k++) attente.push({ t: (k / n) * duree, x, y, z, large, haut, taille });
    },
    maj(dt, temps, c) {
      for (let i = attente.length - 1; i >= 0; i--) {
        const q = attente[i];
        q.t -= dt;
        if (q.t > 0) continue;
        attente.splice(i, 1);
        const vie = 2.2 + Math.random() * 1.4, an = Math.random() * 2 * PI, r = Math.random() * q.large * 0.5;
        parts[libre] = { x: q.x + Math.cos(an) * r, y: q.y, z: q.z + Math.sin(an) * r, vx: Math.cos(an) * q.large * 0.25 + 0.6, vz: Math.sin(an) * q.large * 0.25 + 1.6, vy: (q.haut / vie) * 1.6, age: 0, vie, taille: q.taille };
        libre = (libre + 1) % N;
      }
      const gris = 1 - 0.5 * c.nuit;
      for (let k = 0; k < N; k++) {
        const p = parts[k];
        if (!p) continue;
        p.age += dt;
        if (p.age > p.vie) { parts[k] = null; nu.ranger(k); continue; }
        const f = p.age / p.vie;
        p.vy *= Math.exp(-dt * 0.9);
        p.x += (p.vx + Math.sin(temps * 0.7 + k) * 0.15) * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        nu.poser(k, p.x, p.y, p.z, p.taille * (0.35 + 0.9 * Math.sqrt(f)), gris, gris * 1.03, gris * 1.06, 0.5 * Math.min(1, f * 6) * (1 - f) ** 1.3);
      }
      nu.fin();
      return [];
    },
  };
}

// ---------------------------------------------------------------- Le sol
const TITRES_PANNEAUX = { yuisho: '元乃隅神社 由緒', photo: '撮影スポット' };
/** Le sol (sa couleur et sa matière, textures.js) en x, z, à la hauteur h. */
function aspectSol(P, x, z, h) {
  const bruit = bruitDoux(x, z, 3.5);
  // sous la mer : la roche sombre, un peu de sable
  if (h < -0.4) return [h < -4 ? '#3e4a52' : bruit > 0.5 ? '#5a6460' : '#4e5a5c', M.roche];
  const d = cote(x, z);
  // le rivage et les falaises : la roche mouillée, puis la roche mauve et grise
  if (d < 3.2 || h < 1.2) return [h < 0.7 ? '#4a4048' : bruit > 0.5 ? '#7d6b77' : '#6e5e68', M.roche];
  // le chemin des torii : le béton et le gravier au bord des marches (pas d'herbe sous les torii)
  const l = surLigne(x, z);
  if (l.d < DEMI + 0.45 + 0.15 * bruit) return [bruit > 0.5 ? '#a9a596' : '#9e9a8b', M.terre];
  // le parvis et le palier : des dalles de pierre ; le coin de Bunbuku : la terre sous les pins
  if (dansRect(PALIER, x, z) || dansRect(PARVIS, x, z, 0.05)) return [bruit > 0.5 ? '#c9c3b5' : '#bdb7a8', M.dalles];
  if (aLaPlace(RECOIN, x, z) < 0.15) return [bruit > 0.5 ? '#9c8a6c' : '#8f7d60', M.terre];
  // le parking et la route : le goudron
  if (dansRect(PARKING, x, z, 0.05) || (z > ROUTE.z0 - 0.3 && z < ROUTE.z1 + 0.3 && x > PARKING.x1 && x < 140)) return [bruit > 0.5 ? '#6e6c69' : '#666461', M.route];
  // le plateau de roche et ses buttes : des couches roses, beiges et mauves
  if (z < -24) {
    if (BUTTES.some((b) => dansButte(b, x, z) < 1.05)) return [bruit > 0.5 ? '#8e7c87' : '#7d6b77', M.roche];
    if (dansPoly(ROC_PTS, x, z)) return [bruit > 0.66 ? '#d2baa2' : bruit > 0.33 ? '#c6ab94' : '#b99d88', auBordPoly(ROC_PTS, x, z) < 0.6 + 0.6 * bruit ? M.roche : M.terre];
    if (h < Y_ROC + 1.2) return [bruit > 0.66 ? '#d6bfa8' : bruit > 0.33 ? '#c9ae98' : '#bca08c', M.roche];
  }
  // au loin, la forêt ; sur la pente, l'herbe, des taches sèches (les susuki)
  if (Math.hypot(x, z - 10) > 110) return [bruit > 0.6 ? '#4b6539' : '#557a3a', M.sousBois];
  const sec = bruitDoux(x * 0.6 + 4, z * 0.6, 3);
  return [sec > 0.72 ? '#b5b07a' : bruit > 0.6 ? '#7fb257' : bruit > 0.3 ? '#74a84e' : '#689c47', M.herbe];
}

// ---------------------------------------------------------------- Les textes du lieu
const TEXTES = {
  fr: {
    noms: { vendeuse: 'La vendeuse', cafe: 'Le patron du café', miko: 'La miko', gardien: 'Le gardien du sanctuaire', photographe: 'Le photographe', videaste: '@random_japan_place', touriste: 'La touriste', touriste2: 'Le touriste', pecheur: 'Le pêcheur', enfant: 'La petite fille', obaa: 'La grand-mère', randonneur: 'Le randonneur', chauffeur: 'Le chauffeur du car', kitsune: 'Le renard blanc' },
    tampons: {
      vue: ['La vue des torii', 'au balcon des photos, à côté du grand torii : les torii qui descendent jusqu’à la mer'],
      saisen: ['Le tronc le plus haut', 'au pied du grand torii, en haut du chemin : une pièce dans le tronc des offrandes, tout là-haut'],
      torii: ['Les 123 torii', 'en passant sous tous les torii du chemin, d’un bout à l’autre, sans en sauter un'],
      shiofuki: ['Le souffle du dragon', 'au bord est du plateau de roche : attendre que la mer jaillisse entre les rochers'],
      kitsune: ['L’offrande aux renards', 'devant les renards de pierre du sanctuaire : leur offrir le tofu frit de la vendeuse du parking'],
    },
    compteurNom: 'Torii',
    vue: ['La voilà, la vue des cartes postales : 123 torii rouges qui serpentent dans l’herbe jusqu’aux rochers, et la mer du Japon, d’un bleu profond.', 'En 2015, la chaîne américaine CNN l’a classée parmi les 31 plus beaux endroits du Japon. Depuis, on vient la voir du monde entier.'],
    vueNuit: ['La nuit, les torii se perdent dans le noir. Au loin, sur la mer, brillent les lampes des bateaux de pêche.'],
    vueCompagnon: { kon: ['« Tous ces torii pour un renard… On l’a bien aimé, celui du rêve. »'], pon: ['« Pon ! On dirait un grand dragon rouge qui va boire la mer ! »'], chapu: ['« Chapu ! La mer est si bleue… On descend ? On descend ! »'], gao: ['« Gao ! Une allée de gardiens rouges jusqu’à la mer. Bien rangés ! »'], fuwa: ['« Fuwaaa… Le bleu de chez moi. Les torii vont jusqu’au palais du dragon ? »'], saya: ['« L’herbe, les torii, la mer… Le vent passe partout, ici. »'] },
    saisen: ['Tout en haut du grand torii, à cinq mètres du sol, il y a un tronc des offrandes (賽銭箱).', 'On dit que si ta pièce tombe dedans, ton vœu se réalisera. C’est « le tronc le plus difficile du Japon » !', 'Tu essaies ? (trois pièces)'],
    saisenEncore: ['Encore trois pièces pour tenter ta chance ?'],
    saisenAide: (n) => `A (ou un appui sur l’écran) quand le cercle doré est sur le tronc ! Encore ${n} pièce${n > 1 ? 's' : ''}`,
    saisenRate: (n, haut) => `${haut ? 'Trop haut' : 'Trop bas'}… Attends que le cercle soit pile sur le tronc. Encore ${n} pièce${n > 1 ? 's' : ''}`,
    saisenGagne: ['Tac… tching ! La pièce est tombée pile dans le tronc, tout là-haut !', 'Ton vœu se réalisera, c’est sûr. Les renards blancs du torii ont tout vu.'],
    saisenPerdu: ['Raté… Les pièces sont retombées sur les dalles.', 'Pas grave : on peut réessayer autant qu’on veut. Ici, tout le monde rate les premières !'],
    saisenCompagnon: { kon: ['« Dedans ! Les renards du torii t’ont fait un clin d’œil. »'], pon: ['« Pon pon ! Tu peux faire un vœu pour moi aussi ? Des gâteaux. Plein. »'], chapu: ['« Chapu ! Tout là-haut ! Même moi je ne saute pas si haut ! »'], gao: ['« Gao ! Un tir de champion ! »'], fuwa: ['« Fuwaaa ! Elle a brillé en montant, comme une étoile à l’envers ! »'], saya: ['« Le vent a aidé ta pièce… Il t’aime bien. »'] },
    torii123: ['… 121, 122, 123 ! Tu les as tous passés, les 123 torii.', 'Ils ont été offerts un à un, de 1987 à 1997, par des gens de tout le Japon. Chacun porte le nom de celui qui l’a donné.'],
    torii124: ['… 122, 123… 124 ?!', 'Il n’y a que 123 torii à Motonosumi… Pourtant, cette nuit, tu en as compté 124.'],
    toriiCompagnon: { kon: ['« Cent vingt-trois portes rouges… On est passés dans chacune. »'], pon: ['« Pon… J’ai le tournis. Mais j’ai compté avec toi ! »'], chapu: ['« Chapu ! On recommence dans l’autre sens ? »'], gao: ['« Gao ! Pas un seul oublié. »'], fuwa: ['« Fuwa… Chaque torii était un petit souhait. »'], saya: ['« Ils sentent le bois et le vent de la mer… »'] },
    torii124Compagnon: { kon: ['« Un torii de trop… Ça sent le renard, ça. Un vrai. Regarde : il y en a un avec une petite flamme bleue au-dessus. »'], pon: ['« Pon ?! Un de plus ! Il y en a un qui brille en bleu… Il fait le malin, celui-là. »'], chapu: ['« Chapu ! Il y a un intrus ! Celui avec la flamme bleue, je parie ! »'], gao: ['« Gao… Un torii en trop. Je surveille celui qui a une flamme bleue au-dessus. »'], fuwa: ['« Fuwa… Il y a un torii qui rêve. Celui avec la petite flamme bleue. »'], saya: ['« Un torii qui n’est pas en bois… Celui sous la flamme bleue. »'] },
    nuitCompagnon: { kon: ['« Tu sens ? …Un renard. Un vrai, pas en pierre. Quelque part sur le chemin des torii. »'], pon: ['« Pon… Il y a un renard dans le coin. Je sens ces choses-là, moi, entre transformistes. »'], chapu: ['« Chapu ! Une petite flamme bleue danse là-bas, sur les torii ! »'], gao: ['« Gao ! Quelque chose bouge sur le chemin des torii. Je garde l’œil ouvert. »'], fuwa: ['« Fuwa… Une flamme de renard brille au-dessus des torii. Comme dans les vieilles histoires. »'], saya: ['« Les torii chuchotent, cette nuit… Il y en a un qui n’est pas comme les autres. »'] },
    torii124Toucher: ['Ce torii-là a une petite flamme bleue qui danse au-dessus de lui… Il est un peu plus pâle que les autres. Tu poses la main sur son pilier.', 'Il est tout chaud… et il tremble !'],
    kitsune: ['« Hé hé… Tu m’as trouvé. Le cent vingt-quatrième torii, c’était moi. »', '« Il y a bien longtemps, je suis venu en rêve demander à un pêcheur de me bâtir un sanctuaire, ici, sur ce cap. Depuis, je veille sur la mer… et certaines nuits, je me glisse parmi les torii. »', '« Tu as l’œil. Tiens, garde ceci : un cadeau du renard blanc. »'],
    kitsuneCompagnon: { kon: ['« Grand-père renard… ? Je savais bien que ça sentait le renard ! »'], pon: ['« Pon ! Un renard qui se change en torii… Même mon oncle Bunbuku n’y avait pas pensé ! »'], chapu: ['« Chapuuu ! Un renard tout blanc ! Il brille ! »'], gao: ['« Gao… Il m’a eu. Je n’avais rien vu. »'], fuwa: ['« Fuwa… Un messager des dieux. Il sent la mer et le riz. »'], saya: ['« Il est très vieux… Plus vieux que les arbres d’ici. »'] },
    kitsuneApres: ['Le renard blanc regarde la mer, assis au pied du dernier torii. Il te fait un petit signe de la tête.'],
    shiofukiAttente: ['On attend la grosse vague… Elle arrive du large, elle s’engouffre dans la grotte, sous les rochers…'],
    shiofuki: ['BOUM ! La mer jaillit entre les rochers, en gerbe blanche, plus haut que la falaise !', 'C’est le souffle du palais du dragon (龍宮の潮吹) : la vague entre dans une grotte, l’air serré repousse l’eau vers le ciel. On dirait un dragon qui sort de la mer.'],
    shiofukiNuit: ['BOUM ! Dans la nuit, la gerbe blanche jaillit entre les rochers. On l’entend plus qu’on ne la voit.'],
    shiofukiCompagnon: { kon: ['« Quel souffle ! Le dragon de la mer a dû éternuer. »'], pon: ['« Pon ! J’ai sursauté si fort que mes oreilles ont fait le tour de ma tête ! »'], chapu: ['« Chapuuu ! Une douche géante ! J’y vais ? Non ? Bon. »'], gao: ['« Gao ! Il rugit plus fort que moi, ce rocher ! »'], fuwa: ['« Fuwaaa ! C’est mon cousin qui respire là-dessous ! »'], saya: ['« Le sel de la mer monte jusqu’aux herbes du cap… Elles sont toutes fortes, ici. »'] },
    'panneau-shiofuki': ['« Le souffle du palais du dragon (龍宮の潮吹) — monument naturel »', 'Les vagues du nord entrent dans une grotte au pied de la falaise ; l’eau et l’air jaillissent par une fente de la roche, jusqu’à trente mètres les jours de tempête. On dirait un dragon qui monte au ciel : d’où son nom.'],
    vendeuse: ['Bonjour ! Ici, on a des souvenirs, des glaces… et du tofu frit (油揚げ) pour les renards du sanctuaire. Les renards d’Inari adorent ça !', 'Qu’est-ce qui vous ferait plaisir ?'],
    vendeuseChoix: ['Un tofu frit', 'Une glace', 'Rien, merci'],
    vendeuseNon: ['À tout à l’heure ! Il fait toujours bon manger une glace face à la mer.'],
    aburaageDonne: ['Voilà : un aburaage tout doré, dans son petit papier.', 'Posez-le devant les renards de pierre, au petit sanctuaire, en haut.'],
    aburaageDeja: ['Vous avez déjà votre tofu frit ! Les renards vous attendent.'],
    glace: ['Une glace au natsumikan, le gros agrume de Yamaguchi : sucrée, un peu acidulée.', 'Mmm… Tu la manges en regardant la mer.'],
    glaceCompagnon: { kon: ['« Un goût de soleil… Merci. »'], pon: ['« Pon ! La meilleure glace du monde ! Encore une ? »'], chapu: ['« Chapu ! C’est froid, c’est bon ! »'], gao: ['« Gao ! Une glace de gardien. »'], fuwa: ['« Fuwa… Elle fond comme l’écume. »'], saya: ['« L’agrume a poussé au soleil d’ici… Il est content. »'] },
    renards: ['Deux renards de pierre gardent le sanctuaire. Ce sont les messagers d’Inari, le dieu du riz et des bonnes affaires.', 'On dit qu’ils adorent le tofu frit. La vendeuse, au parking, en vend.'],
    renardsNuit: ['La nuit, les renards de pierre ont l’air de veiller. On croirait qu’ils vont bouger.'],
    offrande: ['Tu poses le tofu frit sur la petite table des offrandes, devant les renards…', '… Tu as vu ? Leurs yeux ont brillé, une seconde.'],
    offrandeCompagnon: { kon: ['« Merci pour eux. Le tofu frit, c’est sacré, chez les renards. »'], pon: ['« Pon… Il n’y en avait pas un deuxième, par hasard ? »'], chapu: ['« Chapu ! Ils ont souri, je l’ai vu ! »'], gao: ['« Gao. Entre gardiens, on se fait des cadeaux. »'], fuwa: ['« Fuwa… Les dieux ont entendu. »'], saya: ['« Une offrande donnée de bon cœur… Ça se sent. »'] },
    honden: ['Tu frappes deux fois dans tes mains et tu salues le petit sanctuaire de pierre, dans sa clôture rouge.', 'On y prie Inari pour de bonnes pêches, pour la sécurité en mer… et pour les rencontres.'],
    hondenNuit: ['Dans la nuit, tu salues le petit sanctuaire. Une lanterne éclaire sa clôture rouge.'],
    petit: ['Tu salues le petit sanctuaire au torii rouge. Les sotetsu, autour, le gardent du vent de la mer.'],
    ema: ['Des ema blancs en forme de tête de renard : on y dessine le visage du renard et on écrit son vœu au dos.', '« Que mes parents soient en bonne santé. » « Réussir mon examen ! » « Revenir ici l’an prochain. »'],
    chozuya: ['La fontaine pour se purifier avant de prier : on rince la main gauche, la main droite, puis la bouche, avec la louche.'],
    otorii: ['Le grand torii, haut de six mètres. Tout en haut, sous la plaque, le tronc des offrandes ; et sur ses poutres, quatre renards blancs qui courent.', 'Les gens lancent leurs pièces depuis le haut du chemin, de l’autre côté.'],
    otoriiNuit: ['Dans la nuit, le grand torii se découpe sur les étoiles. Ses renards blancs luisent un peu.'],
    mer: ['La mer du Japon, d’un bleu profond. Au loin, des bateaux de pêche, et l’île d’Ōmi à l’horizon.'],
    merNuit: ['Au large, des dizaines de lumières blanches : les bateaux qui pêchent le calmar, la nuit (漁火, isaribi). On dirait des étoiles tombées sur la mer.'],
    rochers: ['Les roches du cap : des couches de cendres volcaniques, roses, mauves et grises, pressées pendant des millions d’années, puis polies par le vent et les vagues.'],
    'panneau-yuisho': ['« Le sanctuaire Motonosumi (元乃隅神社) »', 'En 1955, un renard blanc apparut en rêve à Okamura Hitoshi, un patron de pêcheurs du village : « Il y a longtemps que je suis ici. Bâtis-moi un sanctuaire. » Il le bâtit sur ce cap.', 'De 1987 à 1997, 123 torii rouges ont été offerts, un à un, jusqu’à la mer. En 2015, CNN l’a classé parmi les 31 plus beaux endroits du Japon.'],
    'panneau-photo': ['« Point photo (撮影スポット) »', 'D’ici, on voit tous les torii jusqu’à la mer. Le plus beau moment : le matin, quand le soleil éclaire l’eau.'],
    miko: ['Bienvenue au sanctuaire Motonosumi ! Nos porte-bonheur sont blancs, comme le renard du rêve de notre fondateur.', 'Vous savez ? On compte 123 torii jusqu’à la mer. Mon grand-père disait que certaines nuits, il y en a un de plus…'],
    gardien: ['Je balaie le parvis tous les matins. Le sanctuaire appartient toujours à la famille de son fondateur, vous savez.', 'Le renard blanc du rêve… Personne ne l’a jamais revu. Enfin, c’est ce qu’on raconte.'],
    photographe: ['Le meilleur endroit pour la photo, c’est ce petit balcon, à côté du grand torii. Les torii, l’herbe, la mer : tout tient dans le cadre.'],
    videaste: ['Salut ! Moi, c’est @random_japan_place. Je filme les torii qui descendent vers la mer pour mon TikTok.', 'Tu veux voir ma vidéo ?'],
    touriste: ['J’ai déjà lancé dix pièces… Aucune n’est entrée ! Ce tronc est vraiment trop haut.'],
    touriste2: ['Ma femme va y arriver, j’en suis sûr. Au pire, on rachète des pièces !'],
    pecheur: ['Quand le vent du nord souffle, la mer jaillit entre les rochers, juste là, dans la crique : le souffle du dragon.', 'Et le soir, les bateaux qui pêchent le calmar allument de grosses lampes. Toute la mer brille.'],
    pecheurNuit: ['Regarde les lumières, au large : ce sont les lampes des pêcheurs de calmar, les « isaribi ».', 'Tout à l’heure, j’ai vu une petite flamme bleue danser au-dessus des torii… Un renard, sûrement.'],
    enfant: ['Je compte les torii ! Un, deux, trois… Hier soir, j’en ai compté 124. Maman dit que je me suis trompée.'],
    obaa: ['Je viens remercier Inari chaque mois. Mon mari était pêcheur ; Inari le gardait en mer.'],
    randonneur: ['Ces roches sont très anciennes : des couches de cendres volcaniques. Regarde les couleurs : rose, mauve, gris.', 'Ne va pas trop près du bord : la falaise tombe droit dans la mer.'],
    chauffeur: ['Le car repart dans une heure. Prenez votre temps : le chemin des torii descend jusqu’à la mer.'],
    cafeJour: ['Bienvenue au café Isaribi-an (漁火庵) ! « Isaribi », ce sont les feux des bateaux de pêche.', 'Le soir, les bateaux qui pêchent le calmar allument leurs lampes sur la mer. Voulez-vous attendre le soir ici ?'],
    cafeNon: ['Prenez votre temps. La mer, elle, ne bouge pas.'],
    cafeSoir: ['…Voilà le soir. Regardez au large : les isaribi s’allument, un à un. C’est pour eux que j’ai ouvert ce café.'],
    cafeNuit: ['Une belle nuit sur le cap… Voulez-vous que le matin revienne ?'],
    cafeReste: ['Restons encore un peu. La nuit, on entend mieux la mer.'],
    cafeMatin: ['Bonjour ! Le premier café de la journée, face à la mer. Bonne promenade !'],
    chatTigre: ['Un chat roux dort au soleil, contre les distributeurs.', 'Tu le caresses… Rrrrrr… Il ronronne sans ouvrir les yeux.'],
    chatTigreNuit: ['La nuit, le chat roux est réveillé, assis sous la lumière des distributeurs.', 'Ses yeux brillent dans le noir… Rrrrrr…'],
    chatCompagnon: { kon: ['« Un chat du cap… Il connaît tous les coins au soleil. »'], pon: ['« Pon ! Il dort comme moi après un bon repas. »'], chapu: ['« Chapu ! Il sent le poisson… Il est copain avec le pêcheur ! »'], gao: ['« Gao… Un gardien qui dort. Je prends son tour. »'], fuwa: ['« Fuwa… Il ronronne comme les vagues. »'], saya: ['« Un chat tout chaud de soleil… »'] },
    papillon: ['Un papillon se laisse porter par le vent de la mer, au-dessus de l’herbe.'],
    libellule: ['Une libellule rouge (akatombo) se pose sur un torii.'],
  },
  en: {
    noms: { vendeuse: 'The shopkeeper', cafe: 'The café owner', miko: 'The miko', gardien: 'The shrine keeper', photographe: 'The photographer', videaste: '@random_japan_place', touriste: 'The tourist', touriste2: 'The tourist', pecheur: 'The fisherman', enfant: 'The little girl', obaa: 'The grandma', randonneur: 'The hiker', chauffeur: 'The bus driver', kitsune: 'The white fox' },
    tampons: {
      vue: ['The torii view', 'on the photo balcony, beside the great torii: the torii running down to the sea'],
      saisen: ['The highest box', 'at the foot of the great torii, at the top of the path: a coin in the offering box, way up there'],
      torii: ['The 123 torii', 'walking under every torii of the path, from one end to the other, without skipping one'],
      shiofuki: ['The dragon’s breath', 'on the east edge of the rock plateau: waiting for the sea to burst out between the rocks'],
      kitsune: ['An offering for the foxes', 'in front of the shrine’s stone foxes: giving them the fried tofu from the shopkeeper by the car park'],
    },
    compteurNom: 'Torii',
    vue: ['There it is, the postcard view: 123 red torii winding through the grass down to the rocks, and the deep blue Sea of Japan.', 'In 2015, CNN named it one of the 31 most beautiful places in Japan. Since then, people come from all over the world to see it.'],
    vueNuit: ['At night, the torii fade into the dark. Far out at sea, the lamps of the fishing boats shine.'],
    vueCompagnon: { kon: ['“All these torii for one fox… They must have loved the one from the dream.”'], pon: ['“Pon! It looks like a big red dragon about to drink the sea!”'], chapu: ['“Chapu! The sea is so blue… Shall we go down? Let’s go down!”'], gao: ['“Gao! A row of red guardians all the way to the sea. Very tidy!”'], fuwa: ['“Fuwaaa… The blue of home. Do the torii lead to the dragon’s palace?”'], saya: ['“Grass, torii, sea… The wind goes everywhere here.”'] },
    saisen: ['At the very top of the great torii, five metres up, there’s an offering box (賽銭箱).', 'They say that if your coin lands in it, your wish will come true. It’s “the hardest offering box in Japan”!', 'Want to try? (three coins)'],
    saisenEncore: ['Three more coins to try your luck?'],
    saisenAide: (n) => `A (or tap the screen) when the golden circle is on the box! ${n} coin${n > 1 ? 's' : ''} left`,
    saisenRate: (n, haut) => `${haut ? 'Too high' : 'Too low'}… Wait until the circle is right on the box. ${n} coin${n > 1 ? 's' : ''} left`,
    saisenGagne: ['Clack… ching! The coin dropped right into the box, way up there!', 'Your wish will come true, for sure. The white foxes on the torii saw it all.'],
    saisenPerdu: ['Missed… The coins fell back onto the paving stones.', 'No worries: you can try as many times as you like. Everyone misses the first ones here!'],
    saisenCompagnon: { kon: ['“In! The torii’s foxes winked at you.”'], pon: ['“Pon pon! Can you make a wish for me too? Cakes. Lots.”'], chapu: ['“Chapu! All the way up there! Even I can’t jump that high!”'], gao: ['“Gao! A champion’s throw!”'], fuwa: ['“Fuwaaa! It sparkled going up, like an upside-down shooting star!”'], saya: ['“The wind helped your coin… It likes you.”'] },
    torii123: ['… 121, 122, 123! You passed them all, the 123 torii.', 'They were given one by one, from 1987 to 1997, by people from all over Japan. Each one bears the name of its donor.'],
    torii124: ['… 122, 123… 124?!', 'There are only 123 torii at Motonosumi… And yet, tonight, you counted 124.'],
    toriiCompagnon: { kon: ['“A hundred and twenty-three red gates… We went through every one.”'], pon: ['“Pon… I’m dizzy. But I counted with you!”'], chapu: ['“Chapu! Shall we do it again the other way?”'], gao: ['“Gao! Not a single one missed.”'], fuwa: ['“Fuwa… Each torii was a little wish.”'], saya: ['“They smell of wood and sea wind…”'] },
    torii124Compagnon: { kon: ['“One torii too many… That smells of fox. A real one. Look: one of them has a little blue flame above it.”'], pon: ['“Pon?! One extra! There’s one glowing blue… That one’s showing off.”'], chapu: ['“Chapu! There’s an intruder! The one with the blue flame, I bet!”'], gao: ['“Gao… One torii too many. I’m keeping an eye on the one with a blue flame over it.”'], fuwa: ['“Fuwa… One of the torii is dreaming. The one with the little blue flame.”'], saya: ['“A torii that isn’t made of wood… The one under the blue flame.”'] },
    nuitCompagnon: { kon: ['“Can you smell it? …A fox. A real one, not stone. Somewhere along the torii path.”'], pon: ['“Pon… There’s a fox around. I sense these things, between shape-shifters.”'], chapu: ['“Chapu! A little blue flame is dancing over there, on the torii!”'], gao: ['“Gao! Something is moving on the torii path. I’m keeping watch.”'], fuwa: ['“Fuwa… A foxfire is glowing above the torii. Just like in the old stories.”'], saya: ['“The torii are whispering tonight… One of them isn’t like the others.”'] },
    torii124Toucher: ['This torii has a little blue flame dancing above it… It’s a bit paler than the others. You put your hand on its pillar.', 'It’s warm… and it’s trembling!'],
    kitsune: ['“Heh heh… You found me. The hundred and twenty-fourth torii was me.”', '“Long ago, I came in a dream to ask a fisherman to build me a shrine, here, on this cape. Since then I watch over the sea… and some nights, I slip in among the torii.”', '“You have a good eye. Here, keep this: a gift from the white fox.”'],
    kitsuneCompagnon: { kon: ['“Grandfather fox…? I knew it smelled of fox!”'], pon: ['“Pon! A fox that turns into a torii… Even my uncle Bunbuku never thought of that!”'], chapu: ['“Chapuuu! An all-white fox! It’s glowing!”'], gao: ['“Gao… He got me. I didn’t see a thing.”'], fuwa: ['“Fuwa… A messenger of the gods. He smells of sea and rice.”'], saya: ['“He’s very old… Older than the trees here.”'] },
    kitsuneApres: ['The white fox gazes at the sea, sitting at the foot of the last torii. He gives you a little nod.'],
    shiofukiAttente: ['You wait for the big wave… It comes in from the open sea and rushes into the cave under the rocks…'],
    shiofuki: ['BOOM! The sea bursts out between the rocks in a white plume, higher than the cliff!', 'It’s the Dragon Palace’s breath (龍宮の潮吹): the wave enters a cave and the squeezed air pushes the water up to the sky. Like a dragon rising from the sea.'],
    shiofukiNuit: ['BOOM! In the dark, the white plume bursts out between the rocks. You hear it more than you see it.'],
    shiofukiCompagnon: { kon: ['“What a breath! The sea dragon must have sneezed.”'], pon: ['“Pon! I jumped so hard my ears went all the way round my head!”'], chapu: ['“Chapuuu! A giant shower! Shall I go? No? Fine.”'], gao: ['“Gao! That rock roars louder than me!”'], fuwa: ['“Fuwaaa! That’s my cousin breathing down there!”'], saya: ['“The sea salt reaches all the way to the cape’s grass… It’s tough grass, here.”'] },
    'panneau-shiofuki': ['“The Dragon Palace’s Breath (龍宮の潮吹) — natural monument”', 'North waves enter a cave at the foot of the cliff; water and air burst out through a crack in the rock, up to thirty metres on stormy days. It looks like a dragon rising to the sky: hence its name.'],
    vendeuse: ['Hello! We have souvenirs, ice cream… and fried tofu (油揚げ) for the shrine’s foxes. Inari’s foxes love it!', 'What would you like?'],
    vendeuseChoix: ['Fried tofu', 'An ice cream', 'Nothing, thanks'],
    vendeuseNon: ['See you later! An ice cream facing the sea is always nice.'],
    aburaageDonne: ['Here you go: a golden aburaage, in its little paper.', 'Place it in front of the stone foxes, at the little shrine up there.'],
    aburaageDeja: ['You already have your fried tofu! The foxes are waiting for you.'],
    glace: ['A natsumikan ice cream, Yamaguchi’s big citrus: sweet and a little tangy.', 'Mmm… You eat it looking at the sea.'],
    glaceCompagnon: { kon: ['“It tastes of sunshine… Thank you.”'], pon: ['“Pon! The best ice cream in the world! Another one?”'], chapu: ['“Chapu! It’s cold, it’s good!”'], gao: ['“Gao! A guardian’s ice cream.”'], fuwa: ['“Fuwa… It melts like sea foam.”'], saya: ['“The citrus grew in the sun here… It’s happy.”'] },
    renards: ['Two stone foxes guard the shrine. They are messengers of Inari, the god of rice and good business.', 'They say they love fried tofu. The shopkeeper by the car park sells some.'],
    renardsNuit: ['At night, the stone foxes seem to keep watch. You’d think they were about to move.'],
    offrande: ['You place the fried tofu on the little offering table, in front of the foxes…', '… Did you see? Their eyes glowed, just for a second.'],
    offrandeCompagnon: { kon: ['“Thank you for them. Fried tofu is sacred to foxes.”'], pon: ['“Pon… Was there a second one, by any chance?”'], chapu: ['“Chapu! They smiled, I saw it!”'], gao: ['“Gao. Between guardians, we give each other gifts.”'], fuwa: ['“Fuwa… The gods heard.”'], saya: ['“An offering given with a good heart… You can feel it.”'] },
    honden: ['You clap twice and bow to the little stone shrine in its red fence.', 'People pray to Inari here for good fishing, for safety at sea… and for finding love.'],
    hondenNuit: ['In the dark, you bow to the little shrine. A lantern lights its red fence.'],
    petit: ['You bow to the little shrine with the red torii. The sago palms around it shelter it from the sea wind.'],
    ema: ['White ema shaped like a fox’s head: people draw the fox’s face and write their wish on the back.', '“May my parents stay healthy.” “Pass my exam!” “Come back here next year.”'],
    chozuya: ['The fountain to purify yourself before praying: rinse your left hand, your right hand, then your mouth, with the ladle.'],
    otorii: ['The great torii, six metres tall. At the very top, under the plaque, the offering box; and on its beams, four white foxes running.', 'People throw their coins from the top of the path, on the other side.'],
    otoriiNuit: ['In the dark, the great torii stands out against the stars. Its white foxes glow faintly.'],
    mer: ['The Sea of Japan, deep blue. Far off, fishing boats, and Ōmi Island on the horizon.'],
    merNuit: ['Out at sea, dozens of white lights: the boats that fish for squid at night (漁火, isaribi). Like stars fallen onto the sea.'],
    rochers: ['The cape’s rocks: layers of volcanic ash, pink, mauve and grey, pressed for millions of years, then polished by wind and waves.'],
    'panneau-yuisho': ['“Motonosumi Shrine (元乃隅神社)”', 'In 1955, a white fox appeared in a dream to Okamura Hitoshi, a fishing boss of the village: “I have been here for a long time. Build me a shrine.” He built it on this cape.', 'From 1987 to 1997, 123 red torii were given, one by one, down to the sea. In 2015, CNN named it one of the 31 most beautiful places in Japan.'],
    'panneau-photo': ['“Photo spot (撮影スポット)”', 'From here you can see all the torii down to the sea. The best time: the morning, when the sun lights up the water.'],
    miko: ['Welcome to Motonosumi Shrine! Our charms are white, like the fox from our founder’s dream.', 'Did you know? There are 123 torii down to the sea. My grandfather used to say that on some nights there’s one more…'],
    gardien: ['I sweep the shrine grounds every morning. The shrine still belongs to its founder’s family, you know.', 'The white fox from the dream… Nobody has ever seen it again. Or so they say.'],
    photographe: ['The best place for a photo is this little balcony, beside the great torii. The torii, the grass, the sea: it all fits in the frame.'],
    videaste: ['Hi! I’m @random_japan_place. I’m filming the torii running down to the sea for my TikTok.', 'Want to see my video?'],
    touriste: ['I’ve already thrown ten coins… Not one went in! That box is way too high.'],
    touriste2: ['My wife will make it, I’m sure. Worst case, we get more coins!'],
    pecheur: ['When the north wind blows, the sea bursts out between the rocks, right there in the cove: the dragon’s breath.', 'And in the evening, the squid boats light big lamps. The whole sea shines.'],
    pecheurNuit: ['Look at the lights out at sea: those are the squid fishers’ lamps, the “isaribi”.', 'A while ago, I saw a little blue flame dancing above the torii… A fox, surely.'],
    enfant: ['I’m counting the torii! One, two, three… Last night I counted 124. Mum says I made a mistake.'],
    obaa: ['I come to thank Inari every month. My husband was a fisherman; Inari kept him safe at sea.'],
    randonneur: ['These rocks are very old: layers of volcanic ash. Look at the colours: pink, mauve, grey.', 'Don’t go too close to the edge: the cliff drops straight into the sea.'],
    chauffeur: ['The bus leaves in an hour. Take your time: the torii path goes all the way down to the sea.'],
    cafeJour: ['Welcome to Isaribi-an café (漁火庵)! “Isaribi” are the lights of the fishing boats.', 'In the evening, the squid boats light their lamps on the sea. Would you like to wait for the evening here?'],
    cafeNon: ['Take your time. The sea isn’t going anywhere.'],
    cafeSoir: ['…Here’s the evening. Look out to sea: the isaribi light up, one by one. I opened this café for them.'],
    cafeNuit: ['A lovely night on the cape… Would you like the morning to come back?'],
    cafeReste: ['Let’s stay a little longer. At night, you hear the sea better.'],
    cafeMatin: ['Good morning! The first coffee of the day, facing the sea. Enjoy your walk!'],
    chatTigre: ['A ginger cat is asleep in the sun, against the vending machines.', 'You pet it… Rrrrrr… It purrs without opening its eyes.'],
    chatTigreNuit: ['At night, the ginger cat is awake, sitting in the light of the vending machines.', 'Its eyes glow in the dark… Rrrrrr…'],
    chatCompagnon: { kon: ['“A cape cat… It knows every sunny spot.”'], pon: ['“Pon! He sleeps like me after a good meal.”'], chapu: ['“Chapu! He smells of fish… He’s friends with the fisherman!”'], gao: ['“Gao… A sleeping guardian. I’ll take his shift.”'], fuwa: ['“Fuwa… He purrs like the waves.”'], saya: ['“A cat all warm with sunshine…”'] },
    papillon: ['A butterfly drifts on the sea wind, above the grass.'],
    libellule: ['A red dragonfly (akatombo) lands on a torii.'],
  },
  ja: {
    noms: { vendeuse: 'おみせの　人', cafe: 'カフェの　マスター', miko: 'みこさん', gardien: 'じんじゃの　人', photographe: 'カメラマン', videaste: '@random_japan_place', touriste: 'かんこうきゃく', touriste2: 'かんこうきゃく', pecheur: 'りょうしさん', enfant: 'おんなのこ', obaa: 'おばあさん', randonneur: 'ハイカー', chauffeur: 'バスの　うんてんしゅ', kitsune: '白い　キツネ' },
    tampons: {
      vue: ['鳥居の道', '大鳥居の　となりの　さつえいスポット。うみまで　つづく　鳥居が　見える'],
      saisen: ['賽銭箱', 'みちの　上の　大鳥居の　下。たかい　ところの　さいせんばこに　おかねを　なげる'],
      torii: ['百二十三基', 'みちの　鳥居を　ぜんぶ、はしから　はしまで　くぐる'],
      shiofuki: ['龍宮の潮吹', 'いわの　ひろばの　ひがしの　はし。うみが　ふきあがるのを　まつ'],
      kitsune: ['白狐', 'じんじゃの　石の　キツネの　まえ。ちゅうしゃじょうの　おみせの　あぶらあげを　そなえる'],
    },
    compteurNom: '鳥居',
    vue: ['これが　ポストカードの　けしき！　赤い　鳥居が　123こ、くさの　中を　いわまで　くねくね　つづいて、その　むこうは　まっさおな　日本海。', '2015年に　アメリカの　CNNが　「日本の　うつくしい　ばしょ　31」に　えらんだんだ。'],
    vueNuit: ['よるは　鳥居が　くらやみに　きえる。とおくの　うみに、りょうせんの　あかりが　ひかって　いる。'],
    vueCompagnon: { kon: ['「キツネ　ひとりの　ために、こんなに　たくさんの　鳥居……。」'], pon: ['「ポン！　赤い　大きな　りゅうが　うみの　水を　のみに　いくみたい！」'], chapu: ['「チャプ！　うみが　まっさお！　おりて　みようよ！」'], gao: ['「ガオ！　うみまで　赤い　まもりが　ならんでる！」'], fuwa: ['「ふわぁ……ふるさとの　あお。鳥居は　りゅうぐうまで　つづくの？」'], saya: ['「くさと　鳥居と　うみ……ここは　かぜが　どこにでも　ふくね。」'] },
    saisen: ['大鳥居の　いちばん　上、5メートルの　たかさに　さいせんばこが　ある。', 'おかねが　はいったら　ねがいが　かなうって。「日本一　いれにくい　さいせんばこ」だよ！', 'やってみる？（3かい）'],
    saisenEncore: ['もう　3かい　やってみる？'],
    saisenAide: (n) => `金の　わが　はこの　ところに　きたら　A（がめんを　タップ）！　のこり　${n}まい`,
    saisenRate: (n, haut) => `${haut ? 'たかすぎた' : 'ひくすぎた'}……わが　はこに　ぴったり　くるまで　まって。のこり　${n}まい`,
    saisenGagne: ['カタン……チャリン！　おかねが　たかい　はこに　はいった！', 'ねがいは　きっと　かなうよ。鳥居の　白い　キツネが　見て　いたよ。'],
    saisenPerdu: ['ざんねん……おかねは　いしだたみに　おちちゃった。', 'なんかいでも　やって　いいよ。ここでは　みんな　さいしょは　はずすんだ！'],
    saisenCompagnon: { kon: ['「はいった！　鳥居の　キツネが　ウインクしたよ。」'], pon: ['「ポンポン！　ぼくの　ぶんも　おねがいして。おかし　たくさん！」'], chapu: ['「チャプ！　あんな　たかく！　ぼくでも　とどかない！」'], gao: ['「ガオ！　めいしゅの　なげっぷり！」'], fuwa: ['「ふわぁ！　さかさまの　ながれぼしみたいに　ひかった！」'], saya: ['「かぜが　おかねを　たすけたね。」'] },
    torii123: ['……121、122、123！　123この　鳥居を　ぜんぶ　くぐったよ。', '1987年から　1997年まで、日本じゅうの　人が　ひとつずつ　ほうのうしたんだ。どの　鳥居にも　なまえが　かいて　ある。'],
    torii124: ['……122、123……124!?', '元乃隅の　鳥居は　123こしか　ない　はず……なのに、こんやは　124こ　あった。'],
    toriiCompagnon: { kon: ['「123この　赤い　もん……ぜんぶ　くぐったね。」'], pon: ['「ポン……めが　まわる。でも　いっしょに　かぞえたよ！」'], chapu: ['「チャプ！　こんどは　はんたいから　いく？」'], gao: ['「ガオ！　ひとつも　わすれて　ない。」'], fuwa: ['「ふわ……鳥居　ひとつ　ひとつが　ちいさな　ねがいごと。」'], saya: ['「木と　うみかぜの　におい……。」'] },
    torii124Compagnon: { kon: ['「鳥居が　ひとつ　おおい……キツネの　におい。ほんものの。見て、ひとつだけ　上に　青い　ひが　ある。」'], pon: ['「ポン!?　ひとつ　おおい！　青く　ひかってる　のが　いる……あいつ　あやしい。」'], chapu: ['「チャプ！　まぎれこんでる！　青い　ひの　やつだ！」'], gao: ['「ガオ……ひとつ　おおい。青い　ひの　鳥居を　見はるぞ。」'], fuwa: ['「ふわ……ゆめを　見てる　鳥居が　ある。青い　ちいさな　ひの。」'], saya: ['「木で　できて　ない　鳥居……青い　ひの　下の。」'] },
    nuitCompagnon: { kon: ['「におう？……キツネだ。石じゃない、ほんものの。鳥居の　みちの　どこかに　いる。」'], pon: ['「ポン……この　あたりに　キツネが　いる。ばけるもの　どうし、わかるんだ。」'], chapu: ['「チャプ！　鳥居の　上で　青い　ひが　おどってる！」'], gao: ['「ガオ！　鳥居の　みちで　なにかが　うごいた。見はるぞ。」'], fuwa: ['「ふわ……鳥居の　上に　きつねびが　ひかってる。むかしばなしみたい。」'], saya: ['「こんやは　鳥居が　ささやいてる……ひとつだけ　ちがうのが　いる。」'] },
    torii124Toucher: ['この　鳥居の　上で、ちいさな　青い　ひが　おどって　いる……ほかより　すこし　白っぽい。はしらに　てを　あてて　みる。', 'あたたかい……それに　ふるえてる！'],
    kitsune: ['「へへ……見つかっちゃった。124ばんめの　鳥居は　わたしだよ。」', '「むかし、ゆめの　中で　りょうしに　「ここに　やしろを　たてて」と　たのんだんだ。それから　ずっと　うみを　見まもって……ときどき　よるに　鳥居に　まぎれるのさ。」', '「よく　見つけたね。はい、これを　どうぞ。白い　キツネからの　おくりもの。」'],
    kitsuneCompagnon: { kon: ['「キツネの　おじいさん……？　やっぱり　キツネの　においだった！」'], pon: ['「ポン！　鳥居に　ばける　キツネ……ぶんぶくおじさんも　おもいつかなかった！」'], chapu: ['「チャプー！　まっしろな　キツネ！　ひかってる！」'], gao: ['「ガオ……やられた。ぜんぜん　気づかなかった。」'], fuwa: ['「ふわ……かみさまの　つかい。うみと　おこめの　におい。」'], saya: ['「とても　ながく　いきてる……ここの　木より　ずっと。」'] },
    kitsuneApres: ['白い　キツネが　さいごの　鳥居の　下に　すわって、うみを　見て　いる。きみに　ちいさく　うなずいた。'],
    shiofukiAttente: ['大きな　なみを　まつ……おきから　きて、いわの　下の　どうくつに　はいって……'],
    shiofuki: ['ドーン！　いわの　あいだから　うみが　まっしろに　ふきあがった！　がけより　たかく！', 'これが　「龍宮の潮吹」。なみが　どうくつに　はいって、おしこまれた　くうきが　水を　空へ　おしあげるんだ。りゅうが　うみから　のぼる　みたい。'],
    shiofukiNuit: ['ドーン！　よるの　くらやみに　白い　しぶきが　ふきあがる。見えるより　きこえる。'],
    shiofukiCompagnon: { kon: ['「すごい　いき！　うみの　りゅうが　くしゃみ　したのかな。」'], pon: ['「ポン！　びっくりして　みみが　ぐるっと　まわった！」'], chapu: ['「チャプー！　おおきな　シャワー！　いっていい？　だめ？　そっか。」'], gao: ['「ガオ！　この　いわ、ぼくより　ほえる！」'], fuwa: ['「ふわぁ！　この　下で　いとこが　いきを　してる！」'], saya: ['「しおが　みさきの　くさまで　とどく……ここの　くさは　つよいね。」'] },
    'panneau-shiofuki': ['「龍宮の潮吹（国の天然記念物）」', '北からの　なみが　がけの　下の　どうくつに　はいり、いわの　すきまから　水と　くうきが　ふきだす。あらしの　日は　30メートルも。りゅうが　空に　のぼる　ようだから　この　なまえ。'],
    vendeuse: ['いらっしゃい！　おみやげ、ソフトクリーム……それに　じんじゃの　キツネに　あげる　あぶらあげも　あるよ。おいなりさんの　キツネの　だいこうぶつ！', 'なにに　する？'],
    vendeuseChoix: ['あぶらあげ', 'ソフトクリーム', 'いいです'],
    vendeuseNon: ['また　どうぞ！　うみを　見ながらの　ソフトクリームは　さいこうだよ。'],
    aburaageDonne: ['はい、きつね色の　あぶらあげ。かみに　つつんで　あるよ。', '上の　じんじゃの　石の　キツネの　まえに　そなえてね。'],
    aburaageDeja: ['もう　あぶらあげを　もってるよ！　キツネが　まってる。'],
    glace: ['山口の　大きな　みかん、なつみかんの　ソフトクリーム。あまくて　ちょっと　すっぱい。', 'うーん……うみを　見ながら　たべる。'],
    glaceCompagnon: { kon: ['「おひさまの　あじ……ありがとう。」'], pon: ['「ポン！　せかい一の　ソフトクリーム！　もう　ひとつ？」'], chapu: ['「チャプ！　つめたくて　おいしい！」'], gao: ['「ガオ！　まもりがみの　ソフトクリーム。」'], fuwa: ['「ふわ……なみの　あわみたいに　とける。」'], saya: ['「ここの　おひさまで　そだった　みかん……うれしそう。」'] },
    renards: ['石の　キツネが　ふたり、じんじゃを　まもって　いる。おこめと　しょうばいの　かみさま、おいなりさんの　つかい。', 'あぶらあげが　だいすきなんだって。ちゅうしゃじょうの　おみせに　あるよ。'],
    renardsNuit: ['よるの　石の　キツネは　見はって　いる　みたい。いまにも　うごきそう。'],
    offrande: ['あぶらあげを　キツネの　まえの　ちいさな　だいに　そなえる……', '……見た？　キツネの　目が　いっしゅん　ひかった。'],
    offrandeCompagnon: { kon: ['「かれらの　かわりに　ありがとう。あぶらあげは　キツネの　たからもの。」'], pon: ['「ポン……ふたつめは　なかった？」'], chapu: ['「チャプ！　わらったよ、見たもん！」'], gao: ['「ガオ。まもりがみ　どうし、おくりものを　するんだ。」'], fuwa: ['「ふわ……かみさまに　とどいたよ。」'], saya: ['「こころを　こめた　おそなえ……つたわるね。」'] },
    honden: ['にかい　てを　たたいて、赤い　かきの　中の　石の　ほこらに　おじぎ　する。', 'ここでは　ほうりょうや　うみの　あんぜん……それに　えんむすびを　おいのり　するんだ。'],
    hondenNuit: ['よるの　ほこらに　おじぎ。とうろうが　赤い　かきを　てらして　いる。'],
    petit: ['赤い　鳥居の　ちいさな　ほこらに　おじぎ。まわりの　ソテツが　うみかぜから　まもって　いる。'],
    ema: ['キツネの　かおの　かたちの　白い　えま。キツネの　かおを　かいて、うらに　ねがいごとを　かくんだ。', '「りょうしんが　げんきで　ありますように」「しけんに　ごうかく！」「らいねんも　また　こられますように」'],
    chozuya: ['おまいりの　まえに　きよめる　ちょうずや。ひだりて、みぎて、それから　くちを　ひしゃくで　すすぐ。'],
    otorii: ['たかさ　6メートルの　大鳥居。いちばん　上の　がくの　下に　さいせんばこ。はしらと　はりには　はしる　白い　キツネが　4ひき。', 'みんな　みちの　上から、はんたいがわから　おかねを　なげるよ。'],
    otoriiNuit: ['よるの　大鳥居が　ほしぞらに　うかぶ。白い　キツネが　うっすら　ひかる。'],
    mer: ['まっさおな　日本海。とおくに　りょうせん、すいへいせんに　青海島。'],
    merNuit: ['おきに　白い　あかりが　なんじゅうも。よるに　イカを　とる　ふねの　いさりび（漁火）。うみに　おちた　ほしみたい。'],
    rochers: ['みさきの　いわは　かざんばいの　そう。ピンク、むらさき、はいいろ。なんまんねんも　かけて　かたまって、かぜと　なみに　みがかれたんだ。'],
    'panneau-yuisho': ['「元乃隅神社　由緒」', '1955年、むらの　あみもと、岡村斉さんの　ゆめに　白い　キツネが　あらわれた。「わたしは　むかしから　ここに　いる。やしろを　たてて　おくれ。」それで　この　みさきに　たてたんだ。', '1987年から　1997年まで、123この　赤い　鳥居が　ひとつずつ　うみまで　ほうのう　された。2015年、CNNが　「日本の　うつくしい　ばしょ　31」に　えらんだ。'],
    'panneau-photo': ['「撮影スポット」', 'ここから　うみまで　ぜんぶの　鳥居が　見える。いちばん　きれいなのは　あさ、おひさまが　うみを　てらす　とき。'],
    miko: ['元乃隅神社へ　ようこそ！　おまもりは　白。そうりつしゃの　ゆめに　でた　キツネと　おなじ　色なんです。', 'しってる？　うみまで　鳥居は　123こ。でも　おじいちゃんが　いってた。「ときどき　よるに　ひとつ　ふえる」って……'],
    gardien: ['まいあさ　けいだいを　はいて　いるよ。この　じんじゃは　いまも　そうりつしゃの　いえの　ものなんだ。', 'ゆめの　白い　キツネ……あれから　だれも　見て　いない。まあ、そういう　はなしさ。'],
    photographe: ['しゃしんなら　大鳥居の　となりの　この　ちいさな　テラスが　いちばん。鳥居も　くさも　うみも、ぜんぶ　はいるよ。'],
    videaste: ['やあ！　ぼくは　@random_japan_place。うみへ　くだる　鳥居を　TikTokで　とって　いるんだ。', 'ぼくの　どうが、見る？'],
    touriste: ['もう　10かい　なげたのに……ひとつも　はいらない！　この　はこ、たかすぎる。'],
    touriste2: ['つまは　きっと　いれるよ。だめなら　また　おかねを　くずせば　いい！'],
    pecheur: ['きたかぜが　ふくと、すぐ　そこの　入り江の　いわの　あいだから　うみが　ふきあがる。龍宮の潮吹だ。', 'それに　ゆうがた、イカつりの　ふねが　大きな　ランプを　つける。うみ　ぜんぶが　ひかるよ。'],
    pecheurNuit: ['おきの　あかりを　見て。イカを　とる　ふねの　「いさりび」だ。', 'さっき、鳥居の　上で　ちいさな　青い　ひが　おどって　いた……きっと　キツネだな。'],
    enfant: ['鳥居を　かぞえてるの！　いち、に、さん……きのうの　よる、124こ　あったよ。ママは　まちがいだって　いうけど。'],
    obaa: ['まいつき　おいなりさんに　おれいに　くるの。だんなさんは　りょうしでね、うみで　まもって　もらったのよ。'],
    randonneur: ['この　いわは　とても　ふるい。かざんばいの　そうだよ。色を　見て。ピンク、むらさき、はいいろ。', 'はしに　ちかづきすぎないで。がけが　うみへ　まっすぐ　おちてる。'],
    chauffeur: ['バスは　1じかん　あとに　でるよ。ゆっくり　どうぞ。鳥居の　みちは　うみまで　つづいてる。'],
    cafeJour: ['カフェ「漁火庵」へ　ようこそ！　「いさりび」は　りょうせんの　あかりの　こと。', 'ゆうがたに　なると　イカつりの　ふねが　うみに　ランプを　ともすんだ。ここで　ゆうがたを　まつかい？'],
    cafeNon: ['ゆっくり　どうぞ。うみは　にげないよ。'],
    cafeSoir: ['……ゆうがただ。おきを　見て。いさりびが　ひとつ、またひとつ　ともる。これの　ために　この　みせを　ひらいたんだ。'],
    cafeNuit: ['みさきの　いい　よる……あさに　もどす？'],
    cafeReste: ['もうすこし　いよう。よるは　うみの　おとが　よく　きこえる。'],
    cafeMatin: ['おはよう！　うみを　見ながら　きょう　さいしょの　コーヒー。いって　らっしゃい！'],
    chatTigre: ['ちゃとらの　ねこが　じどうはんばいきに　よりかかって　ひなたぼっこ　して　いる。', 'なでると……ゴロゴロ……目を　とじたまま　のどを　ならす。'],
    chatTigreNuit: ['よるは　ちゃとらの　ねこが　おきて、じはんきの　あかりの　下に　すわって　いる。', '目が　くらやみで　ひかる……ゴロゴロ……'],
    chatCompagnon: { kon: ['「みさきの　ねこ……ひなたの　ばしょを　ぜんぶ　しってる。」'], pon: ['「ポン！　ごはんの　あとの　ぼくみたいに　ねてる。」'], chapu: ['「チャプ！　さかなの　におい……りょうしさんと　なかよしだ！」'], gao: ['「ガオ……ねむる　まもりがみ。かわりに　見はるよ。」'], fuwa: ['「ふわ……なみみたいに　ゴロゴロ　いう。」'], saya: ['「おひさまで　ぽかぽかの　ねこ……」'] },
    papillon: ['チョウが　うみかぜに　のって、くさの　上を　とんで　いる。'],
    libellule: ['赤とんぼが　鳥居に　とまった。'],
  },
};
