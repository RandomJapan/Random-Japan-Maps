// ================================================================
//  Yakushima (屋久島), au large de la pointe sud de Kyūshū, dans la préfecture de Kagoshima (2026-10-31 : le onzième lieu
//  de la balade, la seconde moitié du « lieu à deux » d'Udo ; le propriétaire, le 2026-10-30 : « on prend le bateau. Et on
//  se rend à l'île Yakushima… On peut pas débloquer Yakushima sans avoir fait ce lieu-là… à partir du moment où tu as pris
//  le bateau… la petite icône visiter en 3D… elle apparaît » ; le 2026-10-31 : « Commence Yakushima », et de mes
//  propositions : le port, la forêt et le Jōmon Sugi ; le secret des champignons qui brillent ; le chapeau-champignon).
//  On y arrive par le bateau du batelier d'Udo, au port de Miyanoura (宮之浦港), le grand port de l'île. Le village : un
//  restaurant où l'on entre (le poisson volant, le maquereau « au cou cassé »), la boutique d'objets en bois de yakusugi, la
//  location de matériel de randonnée, le sanctuaire Yaku-jinja (益救神社) : son dieu, Hikohohodemi (Yamasachihiko), est le
//  père du dieu d'Udo. La route monte à Shiratani Unsuikyō (白谷雲水峡), la forêt de mousse : la cascade Hiryū-otoshi
//  (飛流おとし) qui glisse sur le granite, le pont suspendu Satsuki (さつき吊橋), les cèdres millénaires (屋久杉 : on les
//  appelle ainsi passé mille ans) Yayoi-sugi, Nidai-ōsugi (un jeune cèdre né sur la souche d'un ancien), Kuguri-sugi (on passe
//  sous ses racines), la forêt couverte de mousse (苔むす森), le refuge de Shiratani (白谷小屋), le col de Tsuji (辻峠), le
//  rocher Taiko-iwa (太鼓岩) et sa vue sur les sommets ; de l'autre côté du col, la voie du petit train forestier d'Anbō
//  (安房森林軌道, 1922, encore utilisée pour l'entretien des sentiers), l'abri de Kosugidani (小杉谷 : le village des bûcherons,
//  1923–1970), la souche de Wilson (ウィルソン株, abattue au XVIe siècle, 13,8 m de tour, une source et un petit sanctuaire
//  dedans ; de l'intérieur, en levant les yeux, le ciel y fait un cœur) et le Jōmon Sugi (縄文杉 : 25,3 m, 16,4 m de tour,
//  de 2 000 à 7 200 ans, trouvé en 1966 par Iwakawa Teiji), vu de sa plateforme de bois. Les cerfs (ヤクシカ) et les singes
//  (ヤクシマザル) de l'île, plus petits que ceux du continent. Ce qui se marche en des heures sur l'île tient ici en quelques
//  minutes : les distances sont très resserrées (la forêt de Shiratani et le Jōmon Sugi sont à des heures l'un de l'autre).
//  Sources : le TikTok et les rushes du propriétaire (« Yaku-Shima.mov ») ; les fiches du ministère du tourisme
//  (mlit.go.jp/tagengo-db : 白谷雲水峡 H30-01419 et R5-00527, 縄文杉 R5-00530, ウィルソン株 R5-00534, 荒川登山口 R5-00526,
//  益救神社, les singes et les cerfs) ; le musée de la préfecture de Kagoshima (le cœur de la souche de Wilson).
//  Repère : x vers l'est, z vers le sud, y vers le haut, en mètres ; la mer au nord (niveau 0) ; le quai à 1,2 m, l'entrée
//  de Shiratani à 11 m, le pont suspendu à 19,5 m, la forêt de mousse à 23,6 m, le col à 27,4 m, le haut du Taiko-iwa vers
//  33 m, la voie du train vers 25 m, la souche de Wilson à 28 m, la plateforme du Jōmon Sugi à 33,4 m.
//  ctx : { THREE, atelier, P (palette), peinture, perso, maillage }.
// ================================================================
import { creerMonde, interactionsBancs, lisse, hasard, bruitDoux, surLaLigne } from './monde.js';
import { panneau, PAPIER_PANNEAU } from './decor.js';
import { MATIERES as M } from './textures.js';
import { secretTrouve, indiceVu } from './tresors.js';

const PI = Math.PI;

// ---------------------------------------------------------------- Le plan
const Y_PORT = 1.2;
// le quai du port de Miyanoura (宮之浦港), au bord de la mer (au nord) ; le bateau du batelier d'Udo y est amarré
const QUAI = { x0: -48, x1: -2, z0: -56, z1: -48 };
// la rue du village, du quai vers le sud : elle monte doucement de 1,2 à 3 m ; les deux rangs de maisons de part et d'autre
const RUE = { x0: -30, x1: -22, z0: -48, z1: -17 };
const yRue = (z) => Y_PORT + (3.0 - Y_PORT) * Math.min(1, Math.max(0, (z + 48) / 31));
/** Les maisons de la rue : [z du milieu, côté (-1 : l'ouest, sa façade vers l'est ; 1 : l'est)], 9,5 m de façade, 7 de fond. */
const MAISON_W = 9.5, MAISON_D = 7;
const MAISONS = [[-42.85, -1], [-32.55, -1], [-22.25, -1], [-42.85, 1], [-32.55, 1], [-22.25, 1]];
const xMaison = (cote) => (cote < 0 ? RUE.x0 - 0.3 - MAISON_D / 2 : RUE.x1 + 0.3 + MAISON_D / 2);
// le restaurant où l'on entre (le dernier de la rangée ouest, vers la montagne) : sa salle
const RESTO = { z: -22.25, cote: -1 };
const SALLE = { x0: xMaison(-1) - MAISON_D / 2 + 0.16, x1: RUE.x0 + 0.05, z0: RESTO.z - MAISON_W / 2 + 0.2, z1: RESTO.z + MAISON_W / 2 - 0.2 };
// la gare maritime (待合所), au fond du quai, à l'ouest de la rue
const Q_GARE = { x0: -47.6, x1: -38.0, z0: -47.6, z1: -41.0 };
// le sanctuaire Yaku-jinja (益救神社), au bout est du quai : son enceinte, un peu plus haute, le torii à l'ouest
const JINJA = { x0: -2, x1: 13, z0: -54, z1: -38, y: 1.5 };
// la route qui monte de la rue à l'entrée de Shiratani (une ligne [x, z, y] : le sol de la route)
const ROUTE = [[-26, -18, 3.0], [-27.6, -9, 4.35], [-31.6, 0.5, 5.9], [-37.4, 8.6, 7.6], [-42.8, 15.6, 9.25], [-46.6, 21.4, 10.45], [-48, 25, 11.0]];
// l'entrée de Shiratani Unsuikyō (le bâtiment d'accueil, la carte des sentiers, l'arrêt du bus)
const ENTREE = { x0: -57, x1: -41, z0: 24, z1: 34.6, y: 11.0 };

/** Une ligne de points [x, z] dont la hauteur monte régulièrement de y0 à y1 (selon la longueur parcourue) : [x, z, y]. */
function rampe(pts, y0, y1) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = cum[cum.length - 1];
  return pts.map(([x, z], i) => [x, z, y0 + ((y1 - y0) * cum[i]) / L]);
}
/** La longueur d'une ligne [x, z, …]. */
const longueur = (pts) => { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; };
/** Le point de la ligne à la longueur s : [x, z, y, tx, tz] (la direction du segment). */
function auPoint(pts, s) {
  let i = 0, cum = 0;
  for (; i < pts.length - 2; i++) { const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); if (cum + l >= s) break; cum += l; }
  const [x0, z0, y0 = 0] = pts[i], [x1, z1, y1 = 0] = pts[i + 1], l = Math.hypot(x1 - x0, z1 - z0) || 1, f = Math.min(1, Math.max(0, (s - cum) / l));
  return [x0 + (x1 - x0) * f, z0 + (z1 - z0) * f, y0 + (y1 - y0) * f, (x1 - x0) / l, (z1 - z0) / l];
}

// les escaliers (des marches posées sur le sol, une surface pour y marcher) : le sentier de pierre de l'entrée au pont
// suspendu, le long de la cascade ; les marches de pierre du Taiko-iwa ; les escaliers de bois du sentier d'Ōkabu (大株歩道), de la
// voie du train à la souche de Wilson, puis jusqu'à la plateforme du Jōmon Sugi
const ESC_PIERRE = { pts: rampe([[-44, 34.6], [-43.4, 38.6], [-42.4, 43.4], [-41.3, 48.2], [-40.2, 53.0], [-39.2, 57.6], [-38.6, 60.8], [-38.4, 62.5]], 11.0, 19.5), demi: 1.05, giron: 0.8, sol: 'pierre', bois: false };
const ESC_TAIKO = { pts: rampe([[22.8, 106.0], [23.9, 109.2], [25.0, 112.2], [26.2, 114.6]], 27.4, 32.9), demi: 0.95, giron: 0.38, sol: 'pierre', bois: false };
const ESC_OKABU = { pts: rampe([[64.6, 72.0], [67.2, 70.6], [70.2, 69.2], [73.2, 68.0], [75.4, 67.4]], 24.88, 28.0), demi: 0.95, giron: 0.74, sol: 'bois', bois: true };
const ESC_JOMON = { pts: rampe([[76.4, 70.2], [77.6, 73.8], [79.8, 77.0], [82.8, 79.6], [86.2, 81.4], [87.6, 82.2]], 28.0, 33.4), demi: 0.95, giron: 0.74, sol: 'bois', bois: true };
const ESCALIERS = [ESC_PIERRE, ESC_TAIKO, ESC_OKABU, ESC_JOMON];
for (const E of ESCALIERS) { E.L = longueur(E.pts); E.n = Math.max(2, Math.round(E.L / E.giron)); }
/** La marche k de l'escalier E : son milieu [x, z], sa hauteur (le dessus), la direction [tx, tz]. */
const marche = (E, k) => { const [x, z, y, tx, tz] = auPoint(E.pts, ((k + 0.5) * E.L) / E.n); return { x, z, y, tx, tz }; };

// le palier du Yayoi-sugi, à côté du sentier de pierre (à l'ouest), d'où on le regarde
const YAYOI = { x: -48.2, z: 47.6, r: 1.32 };
const PALIER_YAYOI = (() => { const k = Math.round(14.2 / ESC_PIERRE.giron), m = marche(ESC_PIERRE, k); return { x0: m.x - 3.3, x1: m.x - 0.85, z0: m.z - 1.15, z1: m.z + 1.15, y: m.y, k }; })();
// le pont suspendu Satsuki (さつき吊橋), au-dessus de la gorge du Shiratani : son tablier, qui s'affaisse de 30 cm au milieu
const PONT = { x0: -38.4, x1: -25.6, z: 62.5, demi: 0.62, y: 19.5, creux: 0.3 };
const yPont = (x) => PONT.y - PONT.creux * Math.sin(PI * Math.min(1, Math.max(0, (x - PONT.x0) / (PONT.x1 - PONT.x0))));
// les sentiers de terre (on y marche sur le sol, taillé à leur hauteur) : [x, z, y]
const SENTIER2 = [[-25.6, 62.5, 19.5], [-22, 64.6, 19.75], [-17.4, 68.6, 20.5], [-12.6, 72.6, 21.4], [-7.6, 76.6, 22.3], [-3.0, 80.2, 23.0], [1.0, 82.8, 23.45], [3.6, 84.4, 23.6]];
// la forêt de mousse (苔むす森) : une clairière ovale, des rochers moussus et des racines tout autour (et quelques-uns dedans)
const KOKE = { x: 8, z: 87.5, rx: 9.2, rz: 6.2, ry: 0, y: 23.6 };
// le petit sentier caché (le secret) : de la forêt de mousse vers l'ouest, par-dessus le ruisseau, jusqu'au vieux cèdre creux
const SENTIER_SECRET = [[0.4, 89.6, 23.6], [-3.5, 91.2, 23.42], [-7.5, 93.0, 23.22], [-11.0, 94.6, 23.05], [-12.8, 95.4, 22.98]];
const CREUX = { x: -15.7, z: 96.4, r: 1.25 };
// du bout est de la forêt de mousse au col de Tsuji, en passant devant le refuge
const SENTIER3 = [[15.2, 90.2, 23.6], [18.2, 94.0, 24.4], [20.0, 97.6, 25.5], [21.0, 101.0, 26.7], [21.4, 103.2, 27.2]];
const HUTTE = { x: 26.0, z: 95.3 };
const DEVANT_HUTTE = { x0: 19.8, x1: 23.8, z0: 92.8, z1: 97.8, y: 24.95 };
// le col de Tsuji (辻峠) : le carrefour des sentiers ; le haut du rocher Taiko-iwa (太鼓岩)
const TSUJI = { x0: 18.6, x1: 25.6, z0: 101.6, z1: 106.2, y: 27.4 };
const TAIKO = { x: 27.7, z: 117.2, rx: 3.9, rz: 3.1, ry: 0.4, y: 33.0 };
// du col à la voie du train ; la voie (le sol du ballast : les planches où l'on marche, 13 cm au-dessus)
const DESCENTE = [[24.8, 103.2, 27.2], [28.6, 102.2, 26.6], [32.4, 100.6, 25.95], [36.0, 98.6, 25.45]];
const VOIE = [[36.0, 98.6, 25.45], [41.0, 94.5, 25.33], [45.5, 90.5, 25.22], [50.0, 86.5, 25.1], [55.0, 81.5, 24.98], [60.0, 76.5, 24.86], [64.6, 72.0, 24.75]];
const PLANCHES = 0.13;
// le pont de la voie au-dessus du ravin (la longueur le long de la voie : de s0 à s1)
const PONT_VOIE = { s0: 9.0, s1: 15.8 };
// l'abri de Kosugidani (小杉谷), au bord de la voie : le coin de Bunbuku
// (son grand axe le long de la voie ; repere(RECOIN.x, RECOIN.z, PI / 4) : x le long de la voie, z vers l'abri)
const RECOIN = { x: 55.2, z: 86.6, rx: 3.6, rz: 3.1, ry: PI / 4, y: 25.04 };
const MARCHAND = { x: 57.18, z: 85.9, cap: -3 * PI / 4 };
const LAMPION = { x: 58.45, z: 85.89 };
// la souche de Wilson (ウィルソン株) : son palier devant elle, son milieu, ses rayons (dehors, le plancher de dedans) ; l'endroit
// d'où, en levant les yeux, le ciel fait un cœur
const PALIER_WILSON = { x0: 74.6, x1: 77.7, z0: 63.2, z1: 70.6, y: 28.0 };
const WILSON = { x: 80.6, z: 66.2, r: 2.3, rIn: 1.78, y: 28.0, porte: 0.56, haut: 3.7 };
const COEUR = { x: 80.25, z: 66.55 };
// (le passage de la porte de la souche, de son palier au dedans)
const PORTE_WILSON = { x0: 77.5, x1: 79.3, z0: 65.66, z1: 66.74 };
// la plateforme du Jōmon Sugi (縄文杉) et l'arbre, au sud
const DECK = { x0: 86.6, x1: 96.4, z0: 81.6, z1: 87.2, y: 33.4 };
const JOMON = { x: 91.5, z: 95.0, r: 2.75 };
// le départ : sur le quai, à côté du bateau, tourné vers le village et les montagnes
const BATEAU = { x: -31, z: QUAI.z0 - 2.15, cap: PI / 2, L: 8.4 };
const BATELIER = { x: -30.6, z: QUAI.z0 + 1.0, cap: PI };
const DEPART = { x: -27.6, z: -52.4, cap: 0.15 };

/** Les sentiers de terre où l'on marche sur le sol : leur ligne, leur demi-largeur, le talus (jusqu'où le sol est retouché). */
const SENTIERS = [
  { pts: ROUTE, demi: 3.0, talus: 4.5 },
  { pts: SENTIER2, demi: 1.25, talus: 3.2 },
  // (là où il passe le ruisseau, sur une planche : le sol reste celui du lit)
  { pts: SENTIER_SECRET, demi: 0.85, talus: 2.4, sauf: (x, z) => surLaLigne(RUISSEAU, x, z).d < 1.25 },
  { pts: SENTIER3, demi: 1.2, talus: 3.0 },
  { pts: DESCENTE, demi: 1.15, talus: 3.0 },
  // (sur son pont, au-dessus du ravin : le sol reste celui du ravin)
  { pts: VOIE, demi: 1.25, talus: 3.2, sauf: (x, z) => { const l = surLaLigne(VOIE, x, z); return l.s > PONT_VOIE.s0 - 0.6 && l.s < PONT_VOIE.s1 + 0.6; } },
];
// la rivière de Shiratani (白谷川) et sa suite jusqu'à la mer : [x, z, le niveau de l'eau] ; la cascade Hiryū-otoshi glisse
// sur une dalle de granite, de son haut (14,7 m) au bassin sous l'entrée (7,4 m)
const RIVIERE = [[-29, 100, 25.0], [-30.5, 86, 20.6], [-31.5, 74, 16.8], [-32, 62.5, 15.0], [-32.3, 56, 14.8], [-32.6, 53.5, 14.7], [-33.2, 46, 11.2],
  [-33.8, 38.5, 7.4], [-31.8, 31, 6.3], [-27.5, 24, 5.4], [-21, 17, 4.6], [-12, 10, 3.4], [-2, 0, 2.4], [6, -14, 1.5], [14, -30, 0.8], [18, -46, 0.2], [19, -58, 0]];
const CASCADE = { haut: 5, bas: 7 }; // (les points de RIVIERE du haut et du bas de la dalle)
/** La longueur le long de la rivière (depuis sa source) du haut et du bas de la dalle de la cascade. */
const S_CASCADE = [CASCADE.haut, CASCADE.bas].map((i) => longueur(RIVIERE.slice(0, i + 1)));
// le ruisseau de la forêt de mousse, qui descend vers la rivière (le sentier caché le passe sur une planche)
const RUISSEAU = [[19.5, 110, 27.2], [16, 103, 25.4], [12.5, 97.5, 24.25], [8, 96.0, 23.75], [2, 94.6, 23.3], [-3.2, 92.2, 22.95], [-9, 88, 22.4], [-14, 82, 21.5],
  [-20, 76, 20.1], [-25.5, 73.5, 18.6], [-30.8, 72.6, 16.9]];
// le ravin que la voie du train passe sur son pont
const RAVIN = [[56, 102, 28.6], [51, 95.5, 24.4], [45.5, 90.5, 21.3], [41.5, 87.0, 19.8], [37, 82.5, 18.3], [32, 77, 17.0]];

// ---------------------------------------------------------------- La géométrie du plan
const dansRect = (r, x, z, m = 0) => x >= r.x0 - m && x <= r.x1 + m && z >= r.z0 - m && z <= r.z1 + m;
/** La distance de x, z à un rectangle (0 dedans). */
const versRect = (r, x, z) => Math.hypot(Math.max(0, r.x0 - x, x - r.x1), Math.max(0, r.z0 - z, z - r.z1));
/** La distance de x, z au bord d'une place en ellipse (négative dedans ; au premier ordre). */
function aLaPlace(p, x, z) {
  const c = Math.cos(p.ry || 0), s = Math.sin(p.ry || 0), u = (x - p.x) * c - (z - p.z) * s, v = (x - p.x) * s + (z - p.z) * c;
  const q = Math.hypot(u / p.rx, v / p.rz);
  return q < 1e-6 ? -Math.min(p.rx, p.rz) : ((q - 1) * q) / Math.hypot(u / (p.rx * p.rx), v / (p.rz * p.rz));
}
/** Sur l'escalier E (dans sa largeur, entre ses bouts) ? m : la marge. */
const surEsc = (E, x, z, m = 0) => { const l = surLaLigne(E.pts, x, z); return l.d < E.demi + m && l.s > -m && l.s < E.L + m; };
/** Sur le pont suspendu ? */
const surPont = (x, z, m = 0) => x >= PONT.x0 - m && x <= PONT.x1 + m && Math.abs(z - PONT.z) < PONT.demi + m;

// ---------------------------------------------------------------- Le relief
/** Une bosse douce de hauteur h et de rayon r autour de cx, cz. */
const bosse = (x, z, cx, cz, r, h) => { const d = Math.hypot(x - cx, z - cz) / r; return d < 1 ? h * (0.5 + 0.5 * Math.cos(d * PI)) : 0; };
/**
 * Le bord de la terre (au nord) : un grand cercle (l'île est ronde ; loin à l'est et à l'ouest, la côte tourne vers le sud), le
 * quai droit du port, l'enceinte du sanctuaire au bord de l'eau, des rochers ailleurs.
 */
function zBord(x) {
  let z = 900 - Math.sqrt(Math.max(0, 955.6 ** 2 - x * x));
  if (x > -49 && x < -1) return -56;
  if (x >= -1 && x < 13.5) return -54.4;
  z += (bruitDoux(x * 0.07, 3.1, 2) - 0.5) * 3.2 * lisse(0, 14, Math.min(Math.abs(x + 49), Math.abs(x - 13.5)));
  return z;
}
/** Le fond de la mer, à d mètres du rivage (d < 0). */
const fond = (d) => -2.4 - 7.6 * lisse(0, 30, -d) - 9 * lisse(30, 220, -d);
/** Les montagnes au loin (le Miyanoura-dake, le Nagata-dake, le Kuromi-dake…) : nulles près du lieu. */
function montagnes(x, z) {
  const loin = Math.min(1, lisse(150, 280, z) + lisse(140, 300, Math.abs(x - 20)));
  if (loin <= 0) return 0;
  return loin * (bosse(x, z, 140, 600, 300, 175) + bosse(x, z, -160, 560, 270, 150) + bosse(x, z, 330, 480, 240, 125) + bosse(x, z, 40, 470, 190, 70)
    + bosse(x, z, -90, 300, 170, 45) + bosse(x, z, 220, 260, 180, 60) + bosse(x, z, -280, 240, 220, 70) + bosse(x, z, 420, 180, 230, 75) + bosse(x, z, -440, 150, 240, 70)
    + (bruitDoux(x * 0.012, z * 0.012, 3) - 0.5) * 44 + (bruitDoux(x * 0.05, z * 0.05, 2) - 0.5) * 10);
}
/** Le sol naturel avant les retouches : la plaine du bord de mer, puis le flanc de la montagne qui monte vers le sud. */
function relief(x, z) {
  const pente = 0.2 + 0.1 * lisse(55, 78, x), u = z + 15, montee = pente * (u + Math.sqrt(u * u + 16)) / 2;
  // (au-delà du lieu, la pente s'adoucit : les sommets sont des bosses à part)
  const sat = montee - pente * Math.max(0, z - 150) * 0.85;
  // (au sud du Taiko-iwa, la vallée de l'Anbō : le sol descend, et l'on voit au loin les sommets du cœur de l'île ; avant, la pente
  // montait plus haut que le rocher et cachait tout)
  const vallee = 30 * lisse(124, 215, z) * (1 - lisse(360, 470, z)) * (0.55 + 0.45 * lisse(-120, 0, x));
  return 1.0 + 2.0 * lisse(-50, -17, z) + sat - vallee + montagnes(x, z);
}

// les chemins coupés en segments, rangés par cases de 8 m (le terrain n'interroge que ceux de sa case)
const TOUS_CHEMINS = [
  ...SENTIERS.map((c) => ({ ...c, sorte: 'sentier' })),
  ...ESCALIERS.map((E) => ({ pts: E.pts, demi: E.demi, talus: 2.6, sorte: 'escalier' })),
];
TOUS_CHEMINS.forEach((c, k) => { c.k = k; });
const CASE = 8, GX0 = -90, GZ0 = -90, NGX = 28, NGZ = 30;
const GRILLE = Array.from({ length: NGX * NGZ }, () => []);
for (const c of TOUS_CHEMINS) {
  let cum = 0;
  for (let i = 0; i < c.pts.length - 1; i++) {
    const [ax, az, ay] = c.pts[i], [bx, bz, by] = c.pts[i + 1], l = Math.hypot(bx - ax, bz - az), m = c.demi + c.talus + 0.5;
    const seg = { ax, az, ay, bx, bz, by, l, s0: cum, c };
    cum += l;
    for (let j = Math.floor((Math.min(az, bz) - m - GZ0) / CASE); j <= Math.floor((Math.max(az, bz) + m - GZ0) / CASE); j++) {
      for (let i2 = Math.floor((Math.min(ax, bx) - m - GX0) / CASE); i2 <= Math.floor((Math.max(ax, bx) + m - GX0) / CASE); i2++) {
        if (i2 >= 0 && j >= 0 && i2 < NGX && j < NGZ) GRILLE[j * NGX + i2].push(seg);
      }
    }
  }
}
const D_ = new Float64Array(TOUS_CHEMINS.length), H_ = new Float64Array(TOUS_CHEMINS.length);
/** Les chemins près de x, z : pour chacun (son indice dans TOUS_CHEMINS), la distance et la hauteur du point le plus proche. */
function chemins(x, z, sortie) {
  sortie.length = 0;
  const i = Math.floor((x - GX0) / CASE), j = Math.floor((z - GZ0) / CASE);
  if (i < 0 || j < 0 || i >= NGX || j >= NGZ) return sortie;
  for (const g of GRILLE[j * NGX + i]) {
    const k = g.c.k, dx = g.bx - g.ax, dz = g.bz - g.az, f = Math.min(1, Math.max(0, ((x - g.ax) * dx + (z - g.az) * dz) / (g.l * g.l || 1)));
    const e = Math.hypot(x - g.ax - f * dx, z - g.az - f * dz);
    if (!sortie.includes(k)) { sortie.push(k); D_[k] = Infinity; }
    if (e < D_[k]) { D_[k] = e; H_[k] = g.ay + (g.by - g.ay) * f; }
  }
  return sortie;
}
const PROCHES = [];
/** La distance au plus proche chemin ou escalier (Infinity loin de tout). */
function versChemin(x, z) {
  let d = Infinity;
  for (const k of chemins(x, z, PROCHES)) d = Math.min(d, D_[k] - TOUS_CHEMINS[k].demi);
  return d;
}

/** Le lit d'une eau (rivière, ruisseau, ravin) : la distance à sa ligne et le niveau de l'eau là. */
const lit = (pts, x, z) => surLaLigne(pts, x, z);
// (une boîte autour de chaque eau : loin d'elles, on ne les regarde pas)
const boite = (pts, m) => { const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]); return { x0: Math.min(...xs) - m, x1: Math.max(...xs) + m, z0: Math.min(...zs) - m, z1: Math.max(...zs) + m }; };
const B_RIVIERE = boite(RIVIERE, 12), B_RUISSEAU = boite(RUISSEAU, 6), B_RAVIN = boite(RAVIN, 7);
/** La demi-largeur de la rivière (son eau) à la longueur s depuis sa source : étroite dans la gorge, plus large en bas. */
const largeRiviere = (s) => 1.6 + 1.2 * lisse(120, 200, s);

function terrain(x, z) {
  const d = z - zBord(x);
  let h;
  if (d < -3) h = fond(d);
  else {
    h = relief(x, z);
    // le rivage : de la terre au fond de la mer en quelques mètres (le quai et le mur du sanctuaire sont droits)
    if (d < 3) { const f = fond(Math.min(0, d - 0.5)); h = f + (h - f) * lisse(-1.2, 3, d); }
  }
  if (x < -100 || x > 125 || z < -70 || z > 140) return h;
  // des bosses et des creux sous la forêt, loin des chemins (la montagne n'est pas lisse)
  const dc = versChemin(x, z);
  if (z > -10) h += ((bruitDoux(x * 0.045 + 7, z * 0.045, 3) - 0.5) * 5.0 + (bruitDoux(x * 0.12, z * 0.12 + 3, 2) - 0.5) * 1.6) * lisse(3, 12, dc) * lisse(-12, 6, z);

  // ---- les eaux : la rivière dans sa gorge (des parois raides dans la forêt, une vallée douce en bas), le ruisseau, le ravin
  if (dansRect(B_RIVIERE, x, z)) {
    const l = lit(RIVIERE, x, z), w = largeRiviere(l.s), gorge = 1 - lisse(95, 125, l.s);
    // (le fond 60 cm sous l'eau ; les berges : raides dans la gorge, douces en bas)
    const dalle = l.s > S_CASCADE[0] - 3 && l.s < S_CASCADE[1] + 2.5;
    // (sur la dalle de la cascade, le granite est large et lisse : des bords doux sur 5 m, puis la pente)
    const pente = dalle ? 0.32 : 0.9 + 2.2 * gorge, bord = l.h - (dalle ? 0.12 : 0.6) + Math.max(0, l.d - w * 0.55) * pente * (1 + (dalle ? 0.06 : 0.25) * Math.max(0, l.d - w - (dalle ? 4.5 : 2)));
    if (bord < h) h = bord;
  }
  if (dansRect(B_RUISSEAU, x, z)) {
    const l = lit(RUISSEAU, x, z), bord = l.h - 0.38 + Math.max(0, l.d - 0.45) * 0.9 * (1 + 0.4 * Math.max(0, l.d - 1.2));
    if (bord < h) h = bord;
  }
  if (dansRect(B_RAVIN, x, z)) {
    const l = lit(RAVIN, x, z), bord = l.h - 0.3 + Math.max(0, l.d - 0.5) * 1.55 * (1 + 0.15 * Math.max(0, l.d - 2));
    if (bord < h) h = bord;
  }

  // ---- les retouches : ce qui est bâti, plat
  // le quai, la rue et ses maisons : plats (la rue monte, chaque maison sur son palier) ; l'enceinte du sanctuaire
  {
    const dq = versRect(QUAI, x, z);
    if (dq < 2.5 && d > -0.5) h = Y_PORT - 0.03 + (h - Y_PORT + 0.03) * lisse(0.2, 2.5, dq);
    const dr = versRect(RUE, x, z);
    if (dr < 2) { const yr = yRue(Math.min(RUE.z1, Math.max(RUE.z0, z))); h = yr - 0.03 + (h - yr + 0.03) * lisse(0.2, 2, dr); }
    for (const [zm, cote] of MAISONS) {
      const xm = xMaison(cote), r = { x0: xm - MAISON_D / 2 - 0.4, x1: xm + MAISON_D / 2 + 0.4, z0: zm - MAISON_W / 2 - 0.4, z1: zm + MAISON_W / 2 + 0.4 }, dm = versRect(r, x, z);
      if (dm < 1.6) { const ym = yRue(zm) - 0.03; h = ym + (h - ym) * lisse(0, 1.6, dm); }
    }
    const dj = versRect(JINJA, x, z);
    if (dj < 2.2 && d > -0.5) h = JINJA.y - 0.03 + (h - JINJA.y + 0.03) * lisse(0.2, 2.2, dj);
  }
  // les sentiers de terre, la route, les escaliers : le sol à leur hauteur (sous les marches, 15 cm plus bas que leur ligne)
  for (const k of chemins(x, z, PROCHES)) {
    const c = TOUS_CHEMINS[k], dd = D_[k], yc = H_[k] - (c.sorte === 'escalier' ? 0.16 : 0.03);
    if (c.sauf?.(x, z)) continue;
    if (dd < c.demi + c.talus) h = yc + (h - yc) * lisse(c.demi + (c.sorte === 'escalier' ? 0.45 : 0.25), c.demi + c.talus, dd);
  }
  // les places : l'entrée de Shiratani, le palier du Yayoi-sugi, la forêt de mousse (un peu bosselée), le devant du refuge, le col,
  // l'abri de Kosugidani, le palier de la souche de Wilson
  for (const [r, t] of [[ENTREE, 3.2], [DEVANT_HUTTE, 2.2], [TSUJI, 2.4], [PALIER_WILSON, 2.0]]) {
    const dr = versRect(r, x, z);
    if (dr < t) h = r.y - 0.03 + (h - r.y + 0.03) * lisse(0.2, t, dr);
  }
  {
    const dp = versRect(PALIER_YAYOI, x, z);
    if (dp < 1.6) h = Math.min(h, PALIER_YAYOI.y - 0.2 + Math.max(0, dp - 0.3) * 1.2);
    const dk = aLaPlace(KOKE, x, z);
    if (dk < 3.2) { const yk = KOKE.y - 0.03 + (bruitDoux(x * 0.3, z * 0.3, 2) - 0.5) * 0.22 * lisse(-1, -4, dk); h = yk + (h - yk) * lisse(0.25, 3.2, dk); }
    const dre = aLaPlace(RECOIN, x, z);
    if (dre < 2.2) h = RECOIN.y - 0.03 + (h - RECOIN.y + 0.03) * lisse(0.2, 2.2, dre);
  }
  // le rocher Taiko-iwa : un dôme de granite, son haut un peu bombé, ses flancs raides (plus bas tout autour)
  {
    const dt = aLaPlace(TAIKO, x, z);
    if (dt < 9) {
      const dessus = TAIKO.y + 0.35 * (1 - lisse(-3, 0, dt)) + (bruitDoux(x * 0.6, z * 0.6, 1) - 0.5) * 0.12;
      const flanc = dessus - 2.6 * Math.max(0, dt - 0.6) ** 1.15;
      h = Math.max(h, dt < 0.6 ? dessus : flanc);
    }
  }
  // dans la souche de Wilson : son plancher, plat ; sous la plateforme du Jōmon Sugi : 90 cm plus bas
  { const dw = Math.hypot(x - WILSON.x, z - WILSON.z); if (dw < WILSON.r + 1.5) h = WILSON.y - 0.03 + (h - WILSON.y + 0.03) * lisse(WILSON.rIn, WILSON.r + 1.5, dw); }
  { const dd = versRect(DECK, x, z); if (dd < 3) { const yd = DECK.y - 0.9; h = yd + (h - yd) * lisse(0.5, 3, dd); } }
  // le pied du Jōmon Sugi, un peu au-dessus de la plateforme ; celui du vieux cèdre creux ; celui du Yayoi-sugi
  for (const [cx, cz, r, yt, t] of [[JOMON.x, JOMON.z, JOMON.r + 1.5, DECK.y + 0.4, 7], [-14.0, 95.8, 3.4, 22.9, 5.5], [YAYOI.x, YAYOI.z, YAYOI.r + 0.6, PALIER_YAYOI.y - 0.35, 3]]) {
    const dt = Math.hypot(x - cx, z - cz);
    if (dt < r + t) h = yt + (h - yt) * lisse(r, r + t, dt);
  }
  return h;
}

// le sol tel que le jeu le dessine (balade.js, terrain) : une grille de 4 m, de 1 m autour du lieu (3 cm plus haut) ; les
// escaliers, la gorge de la rivière et la cascade en cases de 25 cm (solDetaille)
const ETENDUE = { x0: -720, x1: 720, z0: -720, z1: 720, pas: 4, fin: { x0: -64, x1: 104, z0: -64, z1: 124, pas: 1 } };
const solDetaille = (x0, z0, x1, z1) => {
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  if (ESCALIERS.some((E) => surEsc(E, cx, cz, 1.2))) return true;
  if (cz > 34 && cz < 80) { const l = surLaLigne(RIVIERE, cx, cz); if (l.d < 6.5) return true; }
  if (cx > 34 && cx < 56 && cz > 80 && cz < 102) { const l = surLaLigne(VOIE, cx, cz); if (l.d < 4.5 && l.s > PONT_VOIE.s0 - 3.5 && l.s < PONT_VOIE.s1 + 3.5) return true; }
  if (cx > -16 && cx < 3 && cz > 86 && cz < 99 && surLaLigne(SENTIER_SECRET, cx, cz).d < 3 && surLaLigne(RUISSEAU, cx, cz).d < 4) return true;
  return false;
};

/**
 * Peut-on être en x, z ? Sur le quai, dans la rue, dans le restaurant, dans l'enceinte du sanctuaire ; sur la route ; à l'entrée de
 * Shiratani ; sur les escaliers, le palier du Yayoi-sugi, le pont suspendu ; sur les sentiers de terre, dans la forêt de mousse,
 * devant le refuge, au col, en haut du Taiko-iwa ; le long de la voie du train, à l'abri de Kosugidani ; devant et dans la souche
 * de Wilson ; sur la plateforme du Jōmon Sugi. Leurs bords ont ce qui arrête (le bord du quai, les façades, les clôtures, les
 * garde-fous, les rambardes, l'ourlet de fougères et de bambous nains de la forêt) : le voyageur, un point, s'arrête 27 cm avant.
 */
function dansLeCadre(x, z) {
  if (dansRect(QUAI, x, z) || dansRect(RUE, x, z) || dansRect(SALLE, x, z) || dansRect(JINJA, x, z) || dansRect(ENTREE, x, z)) return true;
  if (dansRect(PALIER_YAYOI, x, z) || dansRect(DEVANT_HUTTE, x, z) || dansRect(TSUJI, x, z) || dansRect(PALIER_WILSON, x, z) || dansRect(DECK, x, z)) return true;
  if (aLaPlace(KOKE, x, z) < 0 || aLaPlace(TAIKO, x, z) < 0 || aLaPlace(RECOIN, x, z) < 0) return true;
  if (surPont(x, z)) return true;
  if (Math.hypot(x - WILSON.x, z - WILSON.z) < WILSON.rIn || dansRect(PORTE_WILSON, x, z)) return true;
  // (au bout du sentier de pierre et au début du sentier de terre, le pont prend la suite : à côté de son tablier, on se glissait
  // sous ses suspentes, contre ses montants)
  const aCoteDuPont = Math.abs(z - PONT.z) > PONT.demi && x > PONT.x0 - 0.05 && x < PONT.x1 + 0.05;
  for (const E of ESCALIERS) if (surEsc(E, x, z) && !(E === ESC_PIERRE && aCoteDuPont)) return true;
  for (const c of SENTIERS) if (surLaLigne(c.pts, x, z).d < c.demi && !(c.pts === SENTIER2 && aCoteDuPont)) return true;
  return false;
}

/** Ce que le carnet et le menu savent du lieu, sans le construire. */
export const infos = {
  id: 'yakushima', carte: 'yakushima', video: '7671589576997195030',
  nom: { en: 'Yakushima', fr: 'Yakushima', ja: '屋久島' }, nomJa: '屋久島',
  tampons: [
    { id: 'yakujinja', motif: 'yakujinja', ja: '益救神社', encre: '#b8422b' },
    { id: 'sarushika', motif: 'sarushika', ja: '猿と鹿', encre: '#5a6a3a', forme: 'carre' },
    { id: 'taikoiwa', motif: 'taikoiwa', ja: '太鼓岩', encre: '#3a5a7a' },
    { id: 'wilson', motif: 'wilson', ja: 'ウィルソン株', encre: '#8a3a4a', forme: 'carre' },
    { id: 'jomonsugi', motif: 'jomonsugi', ja: '縄文杉', encre: '#2f5a3a' },
  ],
  get textes() { return TEXTES; },
};

/** La nuit : les fenêtres et les lanternes s'allument. */
export const sortesNuit = (P) => ({ [P.shoji]: 'lumiere', [P.shojiCadre]: 'treillis' });

/** Un triangle A, B, C ajouté à pos, tourné vers n (retourné s'il regarde de l'autre côté). */
function tri(pos, A, B, C, n) {
  const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  if (nx * n[0] + ny * n[1] + nz * n[2] < 0) pos.push(...A, ...C, ...B); else pos.push(...A, ...B, ...C);
}

export function construire(ctx) {
  const { THREE, atelier, P } = ctx;
  const objets = [], bancs = [], lumieres = [], animes = [], etiquettes = [], vapeurs = [], courants = [], cascades = [];
  const monde = creerMonde({ terrain, cadre: dansLeCadre, profond: null, pente: null });
  const poser = (fin, x, z, o = {}) => objets.push({ fin, x, z, y: o.y ?? terrain(x, z), ry: o.ry || 0, ombre: o.ombre !== false, trait: o.trait !== false, dedans: o.dedans, avant: o.avant });
  const ecrire = (o, e) => {
    const c = Math.cos(o.ry || 0), sn = Math.sin(o.ry || 0);
    etiquettes.push({ ...e, x: o.x + e.x * c + e.z * sn, y: o.y + e.y, z: o.z - e.x * sn + e.z * c, ry: (o.ry || 0) + (e.ry || 0) });
  };
  /** Un repère tourné : la pose d'une pièce donnée dans le repère d'un objet posé en x0, z0, tourné de ry0 (rx et rz penchent la
   * pièce dans son propre repère : l'ordre YXZ). Lire les points par leur nom (q.x, q.y, q.z). */
  const repere = (x0, z0, ry0) => {
    const c = Math.cos(ry0), s = Math.sin(ry0);
    return (lx, y, lz, o = {}) => ({ ordre: 'YXZ', ...o, x: x0 + lx * c + lz * s, y, z: z0 - lx * s + lz * c, ry: ry0 + (o.ry || 0) });
  };
  // le décor en morceaux de 25 m (un objet chacun : la carte graphique dessine moins de petits objets) ; au loin, de 100 m
  const morceaux = new Map();
  const morceau = (x, z, taille = 25) => {
    const k = `${taille}:${Math.floor(x / taille)},${Math.floor(z / taille)}`;
    if (!morceaux.has(k)) morceaux.set(k, atelier());
    return morceaux.get(k);
  };
  /** Des murs tout autour d'un rectangle (dans le repère R, ses demi-côtés lx, lz), m au-delà de ce qu'on voit. */
  const murRect = (R, lx, lz, m = 0.27) => {
    const C = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => R(u * (lx + m), 0, v * (lz + m)));
    for (let k = 0; k < 4; k++) monde.mur(C[k].x, C[k].z, C[(k + 1) % 4].x, C[(k + 1) % 4].z, 0.05);
  };
  /** La hauteur du sol tel qu'il est dessiné (la grille de 1 m, 3 cm plus haut ; 4 × 4 là où il est détaillé). */
  const solDessine = (x, z) => {
    const F = ETENDUE.fin, p = 1, x0 = F.x0 + Math.floor((x - F.x0) / p) * p, z0 = F.z0 + Math.floor((z - F.z0) / p) * p;
    if (solDetaille(x0, z0, x0 + p, z0 + p)) {
      const q = 0.25, xa = x0 + Math.floor((x - x0) / q) * q, za = z0 + Math.floor((z - z0) / q) * q, fu = (x - xa) / q, fv = (z - za) / q;
      const ha = terrain(xa, za), hb = terrain(xa + q, za), hd = terrain(xa, za + q), hf = terrain(xa + q, za + q);
      return (fu + fv <= 1 ? ha + (hb - ha) * fu + (hd - ha) * fv : hf + (hd - hf) * (1 - fu) + (hb - hf) * (1 - fv)) + 0.03;
    }
    const fu = x - x0, fv = z - z0, ha = terrain(x0, z0), hb = terrain(x0 + p, z0), hd = terrain(x0, z0 + p), hf = terrain(x0 + p, z0 + p);
    return (fu + fv <= 1 ? ha + (hb - ha) * fu + (hd - ha) * fv : hf + (hd - hf) * (1 - fu) + (hb - hf) * (1 - fv)) + 0.03;
  };
  const BETON = '#bdb8ad', BETON_FONCE = '#a9a498', BLANC_METAL = '#eef0ec';
  // le granite de Yakushima : gris clair et rosé, taché de lichens ; la mousse, partout dans la forêt
  const GRANITES = ['#a8a39a', '#9d978d', '#b2ada2', '#948e84', '#aaa196'];
  const MOUSSE = '#5f8a3a', MOUSSE_C = '#78a346', MOUSSE_F = '#4a7230';
  /**
   * Un rocher de granite bosselé de rayons rx, ry (haut), rz en x, y, z (le milieu, au ras du sol), tourné de t : un icosaèdre
   * déformé de bosses douces, aplati dessous ; la mousse sur ce qui regarde vers le haut (mousse : de 0, rien, à 1, tout le dessus),
   * sombre et mouillé dans l'eau.
   */
  const rocher = (a, x, y, z, rx, ry, rz, t = 0, { finesse = 1, mousse = 0.6, mouille = -Infinity, trait = true } = {}) => {
    const g = hasard(x * 1.31, z * 0.71);
    return a.piece(new THREE.IcosahedronGeometry(1, finesse), GRANITES[0], {
      x, y, z, ry: t, sx: rx, sy: ry, sz: rz, nuance: 0.05, trait,
      deformer: (px, py, pz) => {
        const l = Math.hypot(px, py, pz) || 1, nx = px / l, ny = py / l, nz = pz / l;
        const k = 1 + 0.15 * Math.sin(nx * 3.1 + g * 9) * Math.cos(nz * 2.7 - g * 5) + 0.08 * Math.sin(ny * 6.3 + nx * 2 + g * 3);
        return [px * k, Math.max(py * k, -0.35), pz * k];
      },
      teinte: (wx, wy, wz) => {
        if (wy < mouille) return '#4f4c46';
        // (la mousse : sur le haut du rocher, au-dessus d'une ligne ondulée)
        const haut = (wy - (y - ry * 0.35)) / (ry * 1.35 || 1);
        if (mousse > 0 && haut > 1 - mousse + 0.18 * (bruitDoux(wx * 2.1, wz * 2.1, 1) - 0.5)) return bruitDoux(wx * 3, wz * 3, 1) > 0.55 ? MOUSSE_C : MOUSSE;
        return GRANITES[Math.floor(hasard(Math.floor(wx * 1.3), Math.floor(wz * 1.3 + wy)) * GRANITES.length)];
      },
    });
  };

  // ---------------------------------------------------------------- Les surfaces où l'on marche (escaliers, pont, voie, plateforme)
  // les escaliers : une ligne au milieu de chaque marche (monde.chemin, aux bouts droits)
  for (const E of ESCALIERS) {
    const pts = [[E.pts[0][0], E.pts[0][1], E.pts[0][2]]];
    for (let k = 0; k < E.n; k++) { const m = marche(E, k); pts.push([m.x, m.z, m.y]); }
    const fin = E.pts[E.pts.length - 1];
    pts.push([fin[0], fin[1], fin[2]]);
    monde.chemin(pts, E.demi, { sol: E.sol, droits: true });
  }
  // le palier du Yayoi-sugi (des planches) ; le pont suspendu ; les planches de la voie du train ; la plateforme du Jōmon Sugi
  monde.surface(PALIER_YAYOI.x0, PALIER_YAYOI.x1, PALIER_YAYOI.z0, PALIER_YAYOI.z1, PALIER_YAYOI.y, { sol: 'bois' });
  {
    const pts = [];
    for (let k = 0; k <= 24; k++) { const x = PONT.x0 + ((PONT.x1 - PONT.x0) * k) / 24; pts.push([x, PONT.z, yPont(x)]); }
    monde.chemin(pts, PONT.demi, { sol: 'bois', droits: true });
  }
  // (les planches entre les rails : on y marche ; à côté, sur le ballast — 2026-10-31, corps.mjs : sur une surface plus large que les
  // planches, on flottait 13 cm au-dessus des traverses)
  monde.chemin(VOIE.map(([x, z, y]) => [x, z, y + PLANCHES]), 0.36, { sol: 'bois', droits: true });
  monde.surface(DECK.x0, DECK.x1, DECK.z0, DECK.z1, DECK.y, { sol: 'bois' });

  // ---------------------------------------------------------------- Les barrières (une seule sorte par endroit)
  /**
   * La rambarde de rondins (丸太柵), celle des sentiers de la forêt : des poteaux ronds tous les 1,8 m au plus, une lisse ronde en
   * haut (90 cm) et une au milieu, le bois gris et un peu moussu. pts [[x, z, y?]…] (y : le sol au point, sinon le sol dessiné).
   * Le mur qui arrête le voyageur suit sa ligne, 30 cm de chaque côté ; finir : un poteau au dernier point.
   */
  const RONDIN = '#8a7a66', RONDIN_F = '#6f604f';
  const rambarde = (pts, { haut = 0.9, mur = true, finir = true, yAt = null } = {}) => {
    const Y = (p) => (p[2] ?? (yAt ? yAt(p[0], p[1]) : solDessine(p[0], p[1])));
    for (let i = 0; i + 1 < pts.length; i++) {
      const [xa, za] = pts[i], [xb, zb] = pts[i + 1], ya = Y(pts[i]), yb = Y(pts[i + 1]), l = Math.hypot(xb - xa, zb - za);
      if (l < 0.05) continue;
      const n = Math.max(1, Math.ceil(l / 1.8)), a = morceau((xa + xb) / 2, (za + zb) / 2, 40);
      for (let k = 0; k <= n; k++) {
        if (k === n && (i + 2 < pts.length || !finir)) continue;
        const f = k / n, x = xa + (xb - xa) * f, z = za + (zb - za) * f, y = ya + (yb - ya) * f, pied = Math.min(y, solDessine(x, z)) - 0.25;
        a.cylindre(0.065, 0.075, y + haut + 0.05 - pied, 7, RONDIN, { x, y: (y + haut + 0.05 + pied) / 2, z, teinte: (wx, wy) => (wy < y + 0.25 ? MOUSSE_F : RONDIN) });
      }
      a.baton([xa, ya + haut - 0.05, za], [xb, yb + haut - 0.05, zb], 0.05, RONDIN, 7).baton([xa, ya + 0.45, za], [xb, yb + 0.45, zb], 0.042, RONDIN_F, 6);
      if (mur) monde.mur(xa, za, xb, zb, 0.3);
    }
  };
  /** Le garde-fou de la route (ガードレール) : des poteaux d'acier, la lame ondulée blanche à 75 cm. */
  const glissiere = (pts) => {
    for (let i = 0; i + 1 < pts.length; i++) {
      const [xa, za, ya] = pts[i], [xb, zb, yb] = pts[i + 1], l = Math.hypot(xb - xa, zb - za), n = Math.max(1, Math.ceil(l / 2)), a = morceau((xa + xb) / 2, (za + zb) / 2, 40);
      const ang = Math.atan2(xb - xa, zb - za), pente = Math.atan2(yb - ya, l);
      for (let k = 0; k <= n; k++) {
        if (k === n && i + 2 < pts.length) continue;
        const f = k / n, x = xa + (xb - xa) * f, z = za + (zb - za) * f, y = ya + (yb - ya) * f;
        a.cylindre(0.05, 0.05, 1.1, 7, '#d8dcd8', { x, y: y + 0.35, z });
      }
      a.boite(0.06, 0.32, l + 0.1, '#f2f3ef', { x: (xa + xb) / 2 - Math.cos(ang) * 0.07, y: (ya + yb) / 2 + 0.72, z: (za + zb) / 2 + Math.sin(ang) * 0.07, ry: ang, rx: -pente, ordre: 'YXZ', nuance: 0.02 });
      monde.mur(xa, za, xb, zb, 0.3);
    }
  };

  // ---------------------------------------------------------------- Le port de Miyanoura (宮之浦港)
  // Le quai de béton au bord de l'eau : ses bittes et leur corde, les pneus pendus ; le bateau du batelier d'Udo, amarré là, et
  // deux bateaux de pêche ; au fond, la gare maritime (待合所) ; au large, la digue et ses deux phares, rouge et blanc.
  {
    const a = atelier(), Q = QUAI, y = Y_PORT;
    a.boite(Q.x1 - Q.x0, y + 2.6, 0.7, BETON, { x: (Q.x0 + Q.x1) / 2, y: (y - 2.6) / 2, z: Q.z0 - 0.3, nuance: 0.05 });
    a.boite(Q.x1 - Q.x0, 0.22, 0.42, '#c9c4b8', { x: (Q.x0 + Q.x1) / 2, y: y + 0.08, z: Q.z0 + 0.2, nuance: 0.04 });
    const bittes = [];
    for (let x = Q.x0 + 1.4; x <= Q.x1 - 1.0; x += 3.6) {
      a.cylindre(0.16, 0.2, 0.42, 10, '#2e2e32', { x, y: y + 0.4, z: Q.z0 + 0.2 }).cylindre(0.24, 0.24, 0.08, 10, '#2e2e32', { x, y: y + 0.62, z: Q.z0 + 0.2 });
      bittes.push(x);
    }
    for (let i = 0; i + 1 < bittes.length; i++) {
      const x0 = bittes[i], x1 = bittes[i + 1], m = (x0 + x1) / 2;
      a.tube([[x0, y + 0.52, Q.z0 + 0.2], [m, y + 0.3, Q.z0 + 0.2], [x1, y + 0.52, Q.z0 + 0.2]], 0.025, '#d8c48a', { cotes: 5, pas: 8 });
    }
    monde.mur(Q.x0, Q.z0 + 0.2, Q.x1 + 0.2, Q.z0 + 0.2, 0.32);
    for (let x = Q.x0 + 3; x < Q.x1 - 2; x += 2.4) if (Math.abs(x - BATEAU.x) < 5) a.anneau(0.32, 0.12, '#1e1e22', { x, y: y - 0.45, z: Q.z0 - 0.7, ry: 0 });
    // le bout ouest du quai : un muret de béton, et derrière lui les rochers du rivage
    a.boite(0.36, 1.0, Q.z1 - Q.z0 + 0.4, BETON_FONCE, { x: Q.x0 - 0.3, y: y + 0.3, z: (Q.z0 + Q.z1) / 2, nuance: 0.05 });
    monde.mur(Q.x0 - 0.3, Q.z0, Q.x0 - 0.3, Q.z1 + 0.3, 0.45);
    for (let k = 0; k < 9; k++) { const x = Q.x0 - 2.2 - hasard(k, 3) * 4, z = Q.z0 + 0.5 + k * 1.0; rocher(a, x, terrain(x, z) - 0.2, z, 0.6 + 0.5 * hasard(k, 1), 0.5 + 0.4 * hasard(k, 2), 0.7, k, { mousse: 0, mouille: 0.4 }); }
    // le fond du quai à l'est de la rue : un muret de béton bas, des jardinières, un distributeur, un banc tourné vers la mer
    {
      const zs = Q.z1 + 0.25;
      a.boite(-2 - RUE.x1 - 0.3, 0.55, 0.3, BETON_FONCE, { x: (RUE.x1 + 0.3 - 2) / 2, y: y + 0.17, z: zs, nuance: 0.05 });
      for (let x = RUE.x1 + 1.6; x < -3; x += 3.2) a.boite(1.6, 0.06, 0.4, '#5a4a3a', { x, y: y + 0.47, z: zs, trait: false }).houppe(0.36, '#5a8a3c', { x, y: y + 0.66, z: zs, sy: 0.7, sorte: 'buisson' }, 1);
      monde.mur(RUE.x1 + 0.3, zs, -2, zs, 0.45);
    }
    poser(a.fin(), 0, 0, { y: 0 });
  }
  /**
   * Un bateau de pêche (漁船) dans le repère R (la proue vers +z) : la coque blanche qui s'affine et se relève vers la proue, sa
   * bande de couleur, le fond rouge sous la ligne de flottaison, le pont et ses pavois, la timonerie et ses vitres, le mât et son
   * drapeau ; s = la taille (1 : 8,4 m). Le même que celui du batelier, à Udo.
   */
  const bateau = (a, R, s = 1, c = '#2f6ab0') => {
    const L = 8.4 * s, W = 2.5 * s;
    a.piece(new THREE.BoxGeometry(1, 1, 1, 4, 3, 12), '#f4f2ea', {
      ...R(0, 0, 0), nuance: 0.02,
      deformer: (px, py, pz) => {
        const u = pz + 0.5, proue = Math.max(0, (u - 0.62) / 0.38), w = 1 - 0.92 * proue ** 1.6, bas = -0.55 + 0.35 * proue ** 1.2;
        const yy = py > 0 ? 0.75 + 0.35 * proue ** 2 : bas + Math.abs(px) * 0.5 * (1 - proue);
        return [px * W * w, yy * s, pz * L];
      },
      teinte: (wx, wy) => (wy < 0.07 ? '#b8402c' : wy > 0.55 * s ? c : '#f4f2ea'),
    });
    const yC = (u) => (0.75 + 0.35 * Math.max(0, (u - 0.62) / 0.38) ** 2) * s, lC = (u) => (W / 2) * (1 - 0.92 * Math.max(0, (u - 0.62) / 0.38) ** 1.6);
    a.boite(W - 0.24 * s, 0.06, L * 0.62, '#9a8a72', R(0, 0.75 * s + 0.01, -L * 0.12, { trait: false }));
    for (const u of [-1, 1]) {
      a.piece(new THREE.BoxGeometry(1, 1, 1, 1, 1, 12), c, {
        ...R(0, 0, 0), nuance: 0.02,
        deformer: (px, py, pz) => { const v = Math.min(0.995, pz + 0.5); return [u * (lC(v) - 0.03 * s + px * 0.05 * s), yC(v) + (py + 0.5) * 0.3 * s, (v - 0.5) * L]; },
      });
    }
    a.boite(W - 0.16 * s, 0.29 * s, 0.05 * s, c, R(0, 0.895 * s, -L / 2 + 0.03 * s, { nuance: 0.02 }));
    a.boite(1.7 * s, 0.85 * s, 1.9 * s, '#f4f2ea', R(0, 1.175 * s, -L * 0.22)).boite(1.66 * s, 0.5 * s, 1.86 * s, '#2b3640', R(0, 1.85 * s, -L * 0.22, { trait: false }))
      .boite(1.7 * s, 0.1 * s, 1.9 * s, '#f4f2ea', R(0, 2.15 * s, -L * 0.22)).boite(1.9 * s, 0.1, 2.1 * s, c, R(0, 2.2 * s + 0.05, -L * 0.22));
    a.cylindre(0.05 * s, 0.06 * s, 3.2 * s, 6, '#d8d8d4', R(0, 3.3 * s, -L * 0.22 + 0.4 * s)).cylindre(0.03, 0.03, 1.2 * s, 5, '#d8d8d4', R(0.4 * s, 2.9 * s, -L * 0.22 - 0.5 * s));
    a.boite(0.012, 0.6 * s, 0.95 * s, '#e8583e', R(0, 4.4 * s, -L * 0.22 - 0.05 * s, { trait: false })).boite(0.012, 0.25 * s, 0.6 * s, '#f2c443', R(0.02, 4.42 * s, -L * 0.22 - 0.05 * s, { trait: false }));
    a.boule(0.07 * s, '#f4f0e6', R(0, 4.95 * s, -L * 0.22 + 0.4 * s), 0);
    a.anneau(0.22 * s, 0.06 * s, '#f08a2a', R(0.86 * s, 1.5 * s, -L * 0.22, { ry: PI / 2 }));
  };
  // le bateau du batelier, amarré le long du quai (sa proue vers l'est), qui se balance un peu ; ses amarres ; deux autres bateaux
  const objetBateau = (() => {
    const objet = new THREE.Group(), a = atelier();
    bateau(a, repere(0, 0, 0), 1, '#2f6ab0');
    objet.add(ctx.maillage(a.fin()));
    objet.position.set(BATEAU.x, 0.02, BATEAU.z);
    objet.rotation.y = BATEAU.cap;
    return objet;
  })();
  animes.push({ objet: objetBateau, maj(dt, temps) { objetBateau.position.y = 0.02 + 0.05 * Math.sin(temps * 1.1); objetBateau.rotation.z = 0.02 * Math.sin(temps * 0.8 + 1); objetBateau.rotation.x = 0.012 * Math.sin(temps * 0.7); return []; } });
  {
    const a = atelier();
    for (const dx of [-3.4, 3.2]) {
      a.tube([[BATEAU.x + dx, Y_PORT + 0.55, QUAI.z0 + 0.2], [BATEAU.x + dx * 1.03, Y_PORT + 0.13, QUAI.z0 - 0.7], [BATEAU.x + dx * 1.05, 0.98, QUAI.z0 - 0.98],
        [BATEAU.x + dx * 0.9, 0.95, BATEAU.z + 0.9]], 0.022, '#d8c48a', { cotes: 5, pas: 12 });
    }
    bateau(a, repere(-43.2, QUAI.z0 - 1.75, PI / 2), 0.66, '#3a8a5a');
    bateau(a, repere(-12.6, QUAI.z0 - 1.75, -PI / 2), 0.62, '#c8402c');
    bateau(a, repere(-6.0, -66.0, 0.5), 0.7, '#2f6ab0');
    poser(a.fin(), 0, 0, { y: 0.02 });
  }
  /** Une digue (un long môle de béton, ses blocs) de x0, z0 à x1, z1, et au bout son petit phare (rouge ou blanc). */
  const digue = (x0, z0, x1, z1, rouge) => {
    const a = atelier(), l = Math.hypot(x1 - x0, z1 - z0), ang = Math.atan2(x1 - x0, z1 - z0);
    a.boite(2.2, 3.8, l, BETON, { x: (x0 + x1) / 2, y: 0.3, z: (z0 + z1) / 2, ry: ang, nuance: 0.05 });
    for (let k = 0; k < Math.round(l / 1.6); k++) {
      const f = (k + 0.5) / Math.round(l / 1.6), x = x0 + (x1 - x0) * f, z = z0 + (z1 - z0) * f, nx = Math.cos(ang), nz = -Math.sin(ang);
      for (const sg of [-1, 1]) for (let j = 0; j < 3; j++) a.cylindre(0.18, 0.32, 1.1, 6, '#c2bdb2', { x: x + nx * sg * 1.9, y: 0.45, z: z + nz * sg * 1.9, rx: (j - 1) * 0.9 + hasard(k, sg), rz: j * 1.6, trait: false });
    }
    // le phare du bout (防波堤灯台) : le socle rond, la tour qui s'affine, sa porte, la galerie et sa rambarde, la lanterne, le dôme
    const R = repere(x1, z1, ang + PI), C = rouge ? '#e0452f' : '#f4f2ea', C2 = rouge ? '#f4f2ea' : '#2f6a3a', yb = 2.2, yt = yb + 0.5, H = 6.2;
    a.cylindre(1.25, 1.3, 0.5, 20, BETON, R(0, yb + 0.25, 0, { nuance: 0.04 })).cylindre(1.32, 1.32, 0.06, 20, BETON_FONCE, R(0, yt + 0.03, 0));
    a.cylindre(0.48, 0.62, H, 16, C, R(0, yt + H / 2, 0, { nuance: 0.02 }));
    a.boite(0.6, 1.35, 0.05, '#3e4a48', R(0, yt + 0.74, 0.625)).boite(0.86, 0.06, 0.34, C2, R(0, yt + 1.5, 0.74));
    const yg = yt + H;
    a.cylindre(0.56, 0.5, 0.2, 16, C2, R(0, yg - 0.1, 0)).cylindre(0.92, 0.88, 0.1, 24, C, R(0, yg + 0.05, 0));
    for (let k = 0; k < 14; k++) { const t = (k / 14) * 2 * PI; a.boite(0.035, 0.75, 0.035, C2, R(Math.sin(t) * 0.86, yg + 0.48, Math.cos(t) * 0.86)); }
    for (const yy of [0.47, 0.83]) a.anneau(0.86, 0.022, C2, R(0, yg + yy, 0, { rx: PI / 2 }));
    a.cylindre(0.44, 0.46, 0.14, 16, '#5a3a32', R(0, yg + 0.17, 0)).cylindre(0.4, 0.4, 0.72, 16, '#a9d2dc', R(0, yg + 0.6, 0, { trait: false, nuance: 0 }));
    for (let k = 0; k < 8; k++) { const t = (k / 8) * 2 * PI; a.boite(0.035, 0.72, 0.035, '#4a3a32', R(Math.sin(t) * 0.405, yg + 0.6, Math.cos(t) * 0.405, { trait: false })); }
    a.cylindre(0.15, 0.15, 0.3, 12, '#fff2c8', R(0, yg + 0.58, 0, { sorte: 'lumiere', trait: false }));
    a.cylindre(0.47, 0.47, 0.06, 16, '#4a3a32', R(0, yg + 0.99, 0)).dome(0.45, C, R(0, yg + 1.02, 0)).boule(0.08, C, R(0, yg + 1.52, 0), 1);
    lumieres.push({ ...R(0, yg + 0.6, 0), halo: 0.6, sol: yb, r: 3, c: rouge ? '#ff6a4a' : '#7aff9a' });
    poser(a.fin(), 0, 0, { y: 0 });
  };
  digue(-64, -63, -24, -79, true);
  digue(22, -60, 4, -76, false);
  // la gare maritime (待合所) au fond du quai, à l'ouest de la rue : un bâtiment bas et blanc, ses grandes vitres, son auvent,
  // son enseigne (宮之浦港) ; un bloc plein, des murs
  {
    const a = atelier(), x0 = Q_GARE.x0, x1 = Q_GARE.x1, z0 = Q_GARE.z0, z1 = Q_GARE.z1, y = Y_PORT, xm = (x0 + x1) / 2, H = 3.6;
    a.boite(x1 - x0 + 0.2, 0.25, z1 - z0 + 0.2, BETON_FONCE, { x: xm, y: y - 0.1, z: (z0 + z1) / 2 });
    a.boite(x1 - x0, H, z1 - z0, '#f1efe8', { x: xm, y: y + H / 2, z: (z0 + z1) / 2, nuance: 0.03 });
    // les vitres de la façade (au nord, vers le quai), leurs montants, la porte ; l'auvent ; le toit plat et son rebord
    a.boite(x1 - x0 - 1.2, 2.1, 0.02, '#8fb4c4', { x: xm, y: y + 1.25, z: z0 - 0.012, trait: false });
    for (let x = x0 + 0.6; x <= x1 - 0.59; x += 1.55) a.boite(0.07, 2.12, 0.05, '#7d8286', { x, y: y + 1.25, z: z0 - 0.03, trait: false });
    a.boite(x1 - x0 + 0.6, 0.12, 2.0, '#d8d6cf', { x: xm, y: y + 2.75, z: z0 - 0.95 });
    for (const x of [x0 + 0.4, xm, x1 - 0.4]) a.cylindre(0.07, 0.07, 2.7, 8, '#a9adb0', { x, y: y + 1.35, z: z0 - 1.75 });
    a.boite(x1 - x0 + 0.2, 0.3, z1 - z0 + 0.2, '#d8d6cf', { x: xm, y: y + H + 0.1, z: (z0 + z1) / 2 });
    a.boite(5.2, 0.62, 0.06, '#2a4a7a', { x: xm, y: y + 3.15, z: z0 - 0.04 });
    ecrire({ x: xm, y, z: z0 - 0.075, ry: PI }, { texte: '宮之浦港 旅客待合所', x: 0, y: 3.15, z: 0, l: 4.9, h: 0.46, fond: null, encre: '#f4f2ea' });
    for (let k = 0; k < 3; k++) a.boite(0.9, 0.03, 1.3, '#fff8e8', { x: xm - 3 + k * 3, y: y + 2.68, z: z0 - 0.95, sorte: 'lumiere', trait: false });
    lumieres.push({ x: xm, y: y + 2.5, z: z0 - 1.2, halo: 0, sol: y, r: 5, c: '#fff2d8' });
    monde.surface(x0 - 0.27, x1 + 0.27, z0 - 0.27, z1 + 0.27, y + H + 0.3, { plein: true });
    monde.bloc(x0, x1, z0, z1, y - 1, y + H + 0.3);
    monde.mur(x0 - 0.27, z0 - 0.27, x1 + 0.27, z0 - 0.27, 0.05);
    // (les poteaux de l'auvent)
    for (const x of [x0 + 0.4, xm, x1 - 0.4]) monde.cercle(x, z0 - 1.75, 0.34);
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Le village (宮之浦) : la rue, ses maisons et ses boutiques
  // Deux rangs de maisons basses au toit de tuiles grises, de part et d'autre de la rue qui monte du port : une boutique d'objets en
  // bois de yakusugi, la location de matériel de randonnée, le thé de l'île, une auberge, des souvenirs ; le restaurant (où l'on
  // entre : le poisson volant, le maquereau au cou cassé). Entre elles, des palissades de planches.
  {
    const TUILE = P.tuileShiro, TUILE2 = P.tuileShiroClaire, TUILE_F = '#5a5f66', PLATRE = '#f1ece0', KOSHI = '#5b4537', VITRE = '#a9bcc4', ALU = '#5d6166';
    const RH = 1.45, EV = 0.6, EP = 0.1;
    const W = MAISON_W, D = MAISON_D;
    /**
     * La maison, dans le repère R (la façade vers +z) : W de large (x), D de profondeur (z), le sol en y ; o : sol (du dedans),
     * enseigne (texte, fond, encre), cafe (une fenêtre à barreaux et un noren), ouverte (on entre), hw (la hauteur des murs) ;
     * renvoie F (le plancher) et xin. (La maison des boutiques d'Udo et de Motonosumi.)
     */
    const maison = (a, R, y, o) => {
      const HW = o.hw ?? 3.0, VG = o.vg ?? 0.3;
      const F = y + 0.04, xin = W / 2 - 0.19;
      // le socle (5 cm plus large que les murs de chaque côté), et sous lui la pierre jusque dans le sol ; le sol du dedans
      a.boite(W + 0.1, 0.3, D + 0.1, P.pierreFonce, R(0, y - 0.11, 0, { nuance: 0.05 })).boite(W + 0.06, 0.8, D + 0.06, P.pierreFonce, R(0, y - 0.65, 0, { nuance: 0.05, trait: false }));
      a.boite(W - 0.32, 0.02, D - 0.32, o.sol, R(0, F + 0.01, 0, { trait: false }));
      a.boite(W - 0.32, HW, 0.16, PLATRE, R(0, F + HW / 2, -D / 2 + 0.08, { nuance: 0.03 }));
      a.boite(W - 0.3, 0.9, 0.02, KOSHI, R(0, F + 0.45, -D / 2 - 0.01, { nuance: 0.05 }));
      for (const u of [-1, 1]) {
        a.boite(0.16, HW, D, PLATRE, R(u * (W / 2 - 0.08), F + HW / 2, 0, { nuance: 0.03 }));
        a.boite(0.02, 0.9, D - 0.3, KOSHI, R(u * (W / 2 + 0.01), F + 0.45, 0, { nuance: 0.05 }));
      }
      a.boite(W - 0.32, 0.05, D - 0.32, '#d9c4a0', R(0, F + HW - 0.025, 0, { trait: false }));
      for (const [u, v] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) a.boite(0.22, HW + 0.02, 0.22, P.boisFonce, R(u * (W / 2 - 0.08), F + HW / 2, v * (D / 2 - 0.08)));
      for (const u of [-1, 1]) a.boite(0.18, HW, 0.18, P.boisFonce, R(u * 1.25, F + HW / 2, D / 2 - 0.09));
      a.boite(W - 0.2, 0.2, 0.2, P.boisFonce, R(0, F + 2.05, D / 2 - 0.09));
      a.boite(W - 0.36, HW - 2.15, 0.14, PLATRE, R(0, F + (2.15 + HW) / 2, D / 2 - 0.1));
      a.boite(3.4, 0.42, 0.05, o.enseigne.fond, R(0, F + 2.4, D / 2 + 0.04, { nuance: 0.04 }));
      { const q = R(0, 0, D / 2 + 0.066); ecrire({ x: q.x, y: F, z: q.z, ry: R(0, 0, 0).ry }, { texte: o.enseigne.texte, x: 0, y: 2.4, z: 0, l: 3.0, h: 0.32, fond: null, encre: o.enseigne.encre }); }
      a.boite(2.3, 0.72, 0.36, P.bois, R(0, F + 0.36, D / 2 - 0.18, { nuance: 0.05 })).boite(2.4, 0.05, 0.56, P.boisFonce, R(0, F + 0.745, D / 2 - 0.1));
      {
        const x0 = -xin, x1 = -1.34, xm = (x0 + x1) / 2, l = x1 - x0, zv = D / 2 - 0.13;
        if (o.ouverte) {
          for (const [xc, dz] of [[(x0 + xm) / 2, 0], [(x0 + xm) / 2 + 0.06, -0.045]]) {
            a.boite(xm - x0, 1.92, 0.02, VITRE, R(xc, F + 0.96, zv + dz, { trait: false }));
            for (const xs of [xc - (xm - x0) / 2 + 0.03, xc + (xm - x0) / 2 - 0.03]) a.boite(0.05, 1.92, 0.05, ALU, R(xs, F + 0.975, zv + dz + 0.012, { trait: false }));
          }
          a.boite(l + 0.02, 0.06, 0.1, ALU, R(xm, F + 1.92, zv - 0.01, { trait: false })).boite(l + 0.02, 0.02, 0.1, ALU, R(xm, F + 0.01, zv - 0.01, { trait: false }));
          a.boite(0.05, 1.92, 0.05, ALU, R(x1 - 0.03, F + 0.975, zv + 0.01, { trait: false }));
        } else {
          a.boite(l + 0.02, 1.92, 0.02, VITRE, R(xm, F + 0.96, zv, { trait: false }));
          for (const yb of [0.03, 1.92]) a.boite(l + 0.02, 0.06, 0.05, ALU, R(xm, F + yb, zv + 0.01, { trait: false }));
          for (const xs of [x0 + 0.03, xm, x1 - 0.03]) a.boite(0.05, 1.92, 0.05, ALU, R(xs, F + 0.975, zv + 0.01, { trait: false }));
        }
        if (o.cafe) {
          const t0 = R(x0 + 0.05, 0, D / 2 + 0.05), t1 = R(x1 - 0.05, 0, D / 2 + 0.05), hn = o.ouverte ? 0.46 : 0.72;
          a.baton([t0.x, F + 1.93, t0.z], [t1.x, F + 1.93, t1.z], 0.015, P.boisFonce, 5);
          for (let k = 0; k < 3; k++) a.boite(l / 3 - 0.03, hn, 0.012, o.noren?.c ?? '#2e3a5a', R(x0 + (k + 0.5) * (l / 3), F + 1.92 - hn / 2, D / 2 + 0.05, { trait: false }));
          const q = R(xm, 0, D / 2 + 0.058);
          ecrire({ x: q.x, y: F, z: q.z, ry: R(0, 0, 0).ry }, { texte: o.noren?.texte ?? 'お食事', x: 0, y: o.ouverte ? 1.72 : 1.6, z: 0, l: l * 0.55, h: o.ouverte ? 0.26 : 0.3, fond: null, encre: '#f4efe2' });
        }
      }
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
      const ang = Math.atan2(RH, D / 2), co = Math.cos(ang), si = Math.sin(ang), Lp = (D / 2 + EV) / co, larg = W + 2 * VG;
      const yb = (z) => F + HW + RH * (1 - Math.abs(z) / (D / 2));
      for (const sens of [1, -1]) {
        const zc = (sens * (D / 2 + EV)) / 2, yc = yb(zc) + EP / (2 * co), q = { rx: sens * ang };
        a.boite(larg, EP, Lp, TUILE, R(0, yc, zc, { ...q, nuance: 0.04 }));
        const dy = (EP / 2 + 0.02) * co, dz = sens * (EP / 2 + 0.02) * si;
        for (let x = -larg / 2 + 0.16; x < larg / 2 - 0.1; x += 0.3) a.boite(0.1, 0.05, Lp - 0.04, TUILE2, R(x, yc + dy, zc + dz, { ...q, trait: false }));
        const ze = sens * (D / 2 + EV), ye = yb(ze);
        a.boite(larg + 0.04, 0.17, 0.04, P.boisFonce, R(0, ye + 0.04, ze + sens * (0.02 + EP * si * 0.5)));
        for (const u of [-1, 1]) a.boite(0.05, 0.2, Lp + 0.06, P.boisFonce, R(u * (larg / 2 + 0.025), yc - 0.03, zc, q));
        if (sens > 0) for (let x = -W / 2 + 0.1; x <= W / 2 - 0.1; x += 0.45) { const zr = D / 2 + EV / 2 - 0.05; a.boite(0.06, 0.08, EV + 0.2, P.bois, R(x, yb(zr) - 0.04 / co, zr, { ...q, trait: false })); }
      }
      a.boite(larg + 0.06, 0.2, 0.34, TUILE_F, R(0, F + HW + RH + EP / co + 0.04, 0)).cylindre(0.12, 0.12, larg + 0.06, 10, TUILE2, R(0, F + HW + RH + EP / co + 0.16, 0, { rz: PI / 2 }));
      for (const u of [-1, 1]) {
        a.boite(0.1, 0.36, 0.38, TUILE_F, R(u * (larg / 2 + 0.01), F + HW + RH + EP / co + 0.12, 0));
        a.pignon(0.16, RH - 0.03, D - 0.04, PLATRE, R(u * (W / 2 - 0.08), F + HW, 0));
      }
      for (const u of [-1, 1]) a.boite(0.09, 0.035, 2.6, '#fff8ea', R(u * 1.0, F + HW - 0.07, -0.3, { sorte: 'lumiere', trait: false }));
      return { F, xin, HW };
    };
    // (les boutiques : ce qu'elles vendent sur leurs étagères)
    const ETAGERES = {
      // les objets en bois de yakusugi : des bols, des plateaux, des baguettes, des sous-verres aux cernes serrés
      bois: ['#a8743e', '#8a5a2e', '#c08a4e', '#6f4a28', '#b07a40'],
      // la location : les vestes de pluie, les chaussures de marche, les sacs
      location: ['#d8402c', '#2f6ab0', '#f2c443', '#3a8a5a', '#5a4a3a', '#f08a2a', '#7a5a9a'],
      // le thé de l'île (屋久島茶) : les sachets verts, les boîtes
      the: ['#4a7a3a', '#6a9a4a', '#c8b07a', '#3a5a2a', '#e8d8a8'],
      souvenirs: ['#c8402c', '#f2c443', '#3a6aa8', '#f4efe2', '#5a8a4a', '#e88a3a', '#d86a8a', '#a8d4e8'],
    };
    const BOUTIQUES = [
      { z: -42.85, cote: -1, enseigne: { texte: 'おみやげ 屋久島', fond: '#dcbf92', encre: '#2a2420' }, etageres: 'souvenirs', distributeurs: true },
      { z: -32.55, cote: -1, enseigne: { texte: '屋久杉 工芸品', fond: '#4a3424', encre: '#f2e2c0' }, etageres: 'bois' },
      { z: -22.25, cote: -1, enseigne: { texte: '食事処 とびうお', fond: '#2f4a5a', encre: '#f4efe2' }, cafe: true, resto: true, noren: { texte: 'お食事', c: '#2e3a5a' } },
      { z: -42.85, cote: 1, enseigne: { texte: '民宿 みやのうら', fond: '#f4efe2', encre: '#2a4a7a' }, cafe: true, noren: { texte: '民宿', c: '#3a4a6a' } },
      { z: -32.55, cote: 1, enseigne: { texte: 'レンタル 登山用品', fond: '#3a6a4a', encre: '#f4efe2' }, etageres: 'location' },
      { z: -22.25, cote: 1, enseigne: { texte: '屋久島茶', fond: '#e8dcc0', encre: '#3a5a2a' }, etageres: 'the' },
    ];
    /** Un distributeur de boissons (自動販売機), dans le repère R, sa face vers +z. */
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
    for (const B of BOUTIQUES) {
      const xm = xMaison(B.cote), y = yRue(B.z), a = morceau(xm, B.z, 30), R = repere(xm, B.z, B.cote < 0 ? PI / 2 : -PI / 2);
      const { F, xin, HW } = maison(a, R, y, { sol: B.resto ? '#b9a68a' : '#cfc6b4', enseigne: B.enseigne, cafe: B.cafe, ouverte: !!B.resto, noren: B.noren, hw: 2.95 + 0.3 * hasard(B.z, B.cote) });
      if (B.resto) { dedansResto(a, R, F); mursResto(R, F, HW, y, [(-xin + -1.34) / 2 + 0.12, -1.34 - 0.08]); { const q = R(0, 0, D / 2 + 0.05); murRect(repere(q.x, q.z, R(0, 0, 0).ry), 1.2, 0.14); } }
      else {
        if (B.etageres) {
          const cols = ETAGERES[B.etageres];
          for (let r = 0; r < 4; r++) {
            const yr = F + 0.3 + r * 0.45;
            a.boite(W - 0.9, 0.03, 0.4, P.bois, R(0, yr, -D / 2 + 0.36, { trait: false }));
            for (let x = -W / 2 + 0.6, k = 0; x < W / 2 - 0.5; x += 0.3, k++) {
              const h = 0.12 + 0.14 * hasard(k + r * 7, B.z), c = cols[Math.floor(hasard(r, k + B.z) * cols.length)];
              a.boite(0.22, h, 0.26, c, R(x, yr + 0.015 + h / 2, -D / 2 + 0.36, { trait: false }));
            }
          }
        }
        // (la boutique : un bloc plein, 27 cm au-delà des murs, 66 cm devant : le plateau du comptoir, les distributeurs)
        const q0 = R(-W / 2 - 0.27, 0, -D / 2 - 0.27), q1 = R(W / 2 + 0.27, 0, D / 2 + 0.42);
        monde.surface(Math.min(q0.x, q1.x), Math.max(q0.x, q1.x), Math.min(q0.z, q1.z), Math.max(q0.z, q1.z), y + 3.4, { plein: true });
        monde.bloc(xm - D / 2, xm + D / 2, B.z - W / 2, B.z + W / 2, y - 1, y + 4.6);
      }
      if (B.distributeurs) {
        for (const [k, c] of [[0, '#c8302c'], [1, '#2f6ab0']]) distributeur(a, R, xin - 0.52 - k * 1.0, D / 2 + 0.41, F, c);
        const qd = R(xin - 1.02, 0, D / 2 + 0.41);
        murRect(repere(qd.x, qd.z, R(0, 0, 0).ry), 0.98, 0.36);
      }
      lumieres.push({ ...R(0, F + 2.2, D / 2 + 0.7), halo: 0, sol: y, r: 3.2, c: '#ffe2b0' });
    }
    // entre les maisons, et aux deux bouts de chaque rang : des palissades de planches sombres (板塀) sur la ligne des façades
    {
      const a = atelier();
      const palissade = (x, z0, z1) => {
        const l = Math.abs(z1 - z0), zm = (z0 + z1) / 2, y = yRue(zm);
        a.boite(0.08, 1.8, l, '#4a3a30', { x, y: y + 0.9, z: zm, nuance: 0.05 });
        for (let z = Math.min(z0, z1) + 0.12; z < Math.max(z0, z1); z += 0.24) a.boite(0.02, 1.72, 0.02, '#3a2c24', { x: x + (x < -26 ? 0.05 : -0.05), y: y + 0.88, z, trait: false });
        a.boite(0.14, 0.06, l + 0.04, '#3a2c24', { x, y: y + 1.83, z: zm });
        monde.mur(x, Math.min(z0, z1), x, Math.max(z0, z1), 0.3);
      };
      for (const cote of [-1, 1]) {
        const x = cote < 0 ? RUE.x0 - 0.15 : RUE.x1 + 0.15;
        palissade(x, -47.6 - 0.3, -47.6);
        palissade(x, -38.1, -37.3);
        palissade(x, -27.8, -27.0);
        palissade(x, -17.5, -17.0);
      }
      poser(a.fin(), 0, 0, { y: 0 });
    }
    // la rue : ses caniveaux couverts de grilles, deux poteaux électriques et leurs fils ; l'arrêt du bus au bout de la rue
    {
      const a = atelier();
      for (const x of [RUE.x0 + 0.25, RUE.x1 - 0.25]) {
        for (let z = RUE.z0 + 0.5; z < RUE.z1 - 0.3; z += 1.0) a.boite(0.36, 0.02, 0.96, '#8a8c8e', { x, y: yRue(z) + 0.005, z, trait: false, rx: 0.058 });
      }
      for (const [x, z] of [[RUE.x1 - 0.45, -38.6], [RUE.x0 + 0.45, -27.4]]) {
        const y = yRue(z);
        a.cylindre(0.15, 0.17, 9, 10, '#c9c4b8', { x, y: y + 4.4, z }).boite(1.6, 0.1, 0.1, '#8a8c8e', { x, y: y + 8.2, z }).boite(1.2, 0.08, 0.08, '#8a8c8e', { x, y: y + 7.6, z });
        for (const dx of [-0.7, 0.7]) a.cylindre(0.05, 0.05, 0.14, 6, '#e8e4dc', { x: x + dx, y: y + 8.32, z, trait: false });
        monde.cercle(x, z, 0.42);
      }
      a.tube([[RUE.x1 - 0.45 - 0.7, yRue(-38.6) + 8.35, -38.6], [(RUE.x0 + RUE.x1) / 2, (yRue(-38.6) + yRue(-27.4)) / 2 + 7.6, -33], [RUE.x0 + 0.45 - 0.7, yRue(-27.4) + 8.35, -27.4]], 0.015, '#2a2a2e', { cotes: 3, pas: 10, trait: false });
      a.tube([[RUE.x1 - 0.45 + 0.7, yRue(-38.6) + 8.35, -38.6], [(RUE.x0 + RUE.x1) / 2 + 0.6, (yRue(-38.6) + yRue(-27.4)) / 2 + 7.6, -33], [RUE.x0 + 0.45 + 0.7, yRue(-27.4) + 8.35, -27.4]], 0.015, '#2a2a2e', { cotes: 3, pas: 10, trait: false });
      // l'arrêt du bus (屋久島交通 : vers Shiratani), au bout de la rue, à l'est ; son banc
      const xA = RUE.x1 - 0.5, zA = -18.6, yA = yRue(zA);
      a.cylindre(0.04, 0.04, 2.5, 8, '#8a8f94', { x: xA, y: yA + 1.25, z: zA }).cylindre(0.32, 0.32, 0.04, 20, '#f4f2ea', { x: xA - 0.06, y: yA + 2.3, z: zA, rz: PI / 2 })
        .cylindre(0.3, 0.3, 0.05, 20, '#3a8a5a', { x: xA - 0.06, y: yA + 2.3, z: zA, rz: PI / 2, trait: false }).boite(0.04, 0.55, 0.4, '#f4f2ea', { x: xA - 0.05, y: yA + 1.45, z: zA });
      a.cylindre(0.22, 0.26, 0.12, 10, BETON_FONCE, { x: xA, y: yA + 0.06, z: zA });
      ecrire({ x: xA - 0.09, y: yA, z: zA, ry: -PI / 2 }, { texte: 'バス停', x: 0, y: 2.3, z: 0, l: 0.4, h: 0.12, fond: null, encre: '#ffffff' });
      ecrire({ x: xA - 0.072, y: yA, z: zA, ry: -PI / 2 }, { texte: '白谷雲水峡', x: 0, y: 1.6, z: 0, l: 0.34, h: 0.1, fond: null, encre: '#2a2420' });
      monde.cercle(xA, zA, 0.4);
      poser(a.fin(), 0, 0, { y: 0 });
    }
  }
  /**
   * Le dedans du restaurant où l'on entre (食事処 とびうお), dans le repère R de la maison (la façade vers +z), F son plancher : le
   * comptoir de la cuisine et ses tabourets rouges, deux tables, l'estrade de tatamis et sa table basse, la caisse, le menu au mur ;
   * le poisson volant frit (とびうおの唐揚げ : ses nageoires comme des ailes), le maquereau au cou cassé (首折れサバ, en sashimi).
   * Ses gens sont dans passants (GENS_RESTO).
   */
  function dedansResto(a, R, F) {
    const yS = F + 0.02, T3 = (lx, ly, lz) => { const q = R(lx, ly, lz); return [q.x, q.y, q.z]; };
    const tenir = (lx, lz, lx2, lz2) => { const q0 = R(lx, 0, lz), q1 = R(lx2, 0, lz2); murRect(repere((q0.x + q1.x) / 2, (q0.z + q1.z) / 2, R(0, 0, 0).ry), Math.abs(lx2 - lx) / 2, Math.abs(lz2 - lz) / 2); };
    const bol = (lx, yy, lz, c = '#f4efe2', dedans = '#c89a5a', r = 0.08) => a.cylindre(r, r * 0.65, r * 0.75, 12, c, R(lx, yy + r * 0.37, lz)).cylindre(r * 0.92, r * 0.92, 0.008, 12, dedans, R(lx, yy + r * 0.72, lz, { trait: false }));
    const assiette = (lx, yy, lz, plat) => { a.cylindre(0.13, 0.1, 0.02, 14, '#f4efe2', R(lx, yy + 0.01, lz)); plat(lx, yy + 0.02, lz); };
    const baguettes = (lx, yy, lz) => { a.baton(T3(lx - 0.1, yy + 0.008, lz + 0.12), T3(lx + 0.12, yy + 0.008, lz + 0.14), 0.005, '#8a5a3a', 3, { trait: false }); };
    // (le poisson volant frit : un corps doré, ses grandes nageoires écartées ; le sashimi de maquereau : des tranches roses)
    const tobiuo = (x, yp, z, ry = 0) => {
      a.ovale(0.05, '#c8883a', { ...R(x, yp + 0.025, z), sx: 2.4, sy: 0.55, sz: 0.7, ry: R(0, 0, 0).ry + ry }, 8);
      for (const s of [-1, 1]) a.piece(new THREE.CircleGeometry(0.06, 6, 0, PI * 0.7), '#d8a058', { ...R(x + 0.01, yp + 0.03, z + s * 0.035), rx: -PI / 2 + s * 0.35, ry: R(0, 0, 0).ry + ry, rz: s * 0.4, trait: false });
    };
    const sashimi = (x, yp, z) => { for (let k = 0; k < 5; k++) a.boite(0.035, 0.018, 0.09, k % 2 ? '#e88a8a' : '#d87878', R(x - 0.08 + k * 0.04, yp + 0.012, z, { rz: 0.4, trait: false })); a.boule(0.03, '#7ab04a', R(x + 0.12, yp + 0.02, z), 0); };
    const menu = (plats, lx0, ly, lz) => plats.forEach((t, k) => {
      const lx = lx0 + k * 0.5;
      a.boite(0.36, 0.62, 0.025, '#eadfc4', R(lx, yS + ly, lz, { nuance: 0.02 }));
      const q = R(lx, 0, lz + 0.016);
      ecrire({ x: q.x, y: yS, z: q.z, ry: R(0, 0, 0).ry }, { texte: t, vertical: true, x: 0, y: ly, z: 0, l: 0.26, h: 0.54, fond: null, encre: '#2a2420' });
    });
    const ESTRADE = { x0: -4.5, x1: -1.2, z0: -3.3, z1: -0.75 }, yE = yS + 0.4, xe = (ESTRADE.x0 + ESTRADE.x1) / 2, ze = (ESTRADE.z0 + ESTRADE.z1) / 2;
    a.boite(ESTRADE.x1 - ESTRADE.x0, 0.38, ESTRADE.z1 - ESTRADE.z0, '#6a5240', R(xe, yS + 0.19, ze, { nuance: 0.04 }));
    a.boite(ESTRADE.x1 - ESTRADE.x0 + 0.02, 0.1, 0.08, '#3e2f25', R(xe, yE - 0.05, ESTRADE.z1 - 0.03));
    for (const lx of [ESTRADE.x0 + 0.85, ESTRADE.x1 - 0.85]) {
      const pt = ESTRADE.z1 - ESTRADE.z0 - 0.2;
      a.boite(1.63, 0.02, pt, '#cfc79a', R(lx, yE + 0.01, ze - 0.04, { nuance: 0.02 }));
      for (const dz of [-1, 1]) a.boite(1.63, 0.02, 0.05, '#3a4a3a', R(lx, yE + 0.01, ze - 0.04 + dz * (pt / 2 + 0.025), { trait: false }));
    }
    const zt = ze + 0.15;
    a.boite(1.3, 0.05, 0.8, P.boisFonce, R(xe, yE + 0.32, zt)).boite(1.2, 0.29, 0.7, '#3e2f25', R(xe, yE + 0.165, zt, { trait: false }));
    for (const [dx, dz] of [[-0.35, 0.55], [0.35, 0.55], [-0.35, -0.72], [0.35, -0.72], [0.95, 0]]) a.boite(0.46, 0.07, 0.46, '#3f5a8a', R(xe + dx, yE + 0.055, zt + dz));
    tenir(ESTRADE.x0, ESTRADE.z0, ESTRADE.x1, ESTRADE.z1);
    { const q0 = R(ESTRADE.x0, 0, ESTRADE.z0), q1 = R(ESTRADE.x1, 0, ESTRADE.z1); monde.surface(Math.min(q0.x, q1.x), Math.max(q0.x, q1.x), Math.min(q0.z, q1.z), Math.max(q0.z, q1.z), yE + 0.02, { sol: 'bois' }); }
    // la cuisine au fond, derrière le comptoir des clients : le plan de travail en inox, la friteuse, la marmite qui fume
    a.boite(5.0, 0.85, 0.42, P.bois, R(1.85, yS + 0.425, -1.96, { nuance: 0.04 })).boite(5.1, 0.05, 0.62, P.boisFonce, R(1.85, yS + 0.875, -1.9));
    a.boite(4.4, 0.76, 0.56, '#b8bcc0', R(2.0, yS + 0.38, -2.98, { nuance: 0.03 })).boite(4.44, 0.04, 0.6, '#dfe3e6', R(2.0, yS + 0.78, -2.98));
    a.boite(0.6, 0.2, 0.42, '#a9aeb3', R(2.0, yS + 0.9, -2.98)).boite(0.54, 0.01, 0.36, '#d8a848', R(2.0, yS + 1.0, -2.98, { trait: false }));
    a.cylindre(0.22, 0.2, 0.34, 14, '#a9aeb3', R(0.8, yS + 0.98, -2.98)).cylindre(0.235, 0.235, 0.03, 14, '#8a9096', R(0.8, yS + 1.16, -2.98));
    { const q = R(0.8, yS + 1.2, -2.98); vapeurs.push({ x: q.x, z: q.z, y: q.y, n: 3, haut: 1.0, large: 0.08, taille: 0.2 }); }
    a.boite(4.0, 0.04, 0.26, P.bois, R(2.0, yS + 1.72, -3.2));
    for (let k = 0; k < 12; k++) {
      const lx = 0.25 + k * 0.32;
      if (k % 3 === 2) a.cylindre(0.045, 0.05, 0.26, 8, ['#3a5a3a', '#7a3a2a', '#2a2a30'][k % 3], R(lx, yS + 1.87, -3.2, { trait: false }));
      else a.cylindre(0.09, 0.06, 0.07, 10, k % 2 ? '#f4efe2' : '#3a4a7a', R(lx, yS + 1.775, -3.2, { trait: false }));
    }
    tenir(-0.7, -3.34, 4.4, -1.6);
    for (const lx of [0.2, 1.2, 2.2, 3.2]) {
      a.cylindre(0.17, 0.17, 0.05, 12, '#c8402c', R(lx, yS + 0.555, -1.32)).cylindre(0.03, 0.04, 0.54, 6, '#8a8f94', R(lx, yS + 0.27, -1.32, { trait: false }))
        .cylindre(0.16, 0.18, 0.02, 10, '#8a8f94', R(lx, yS + 0.01, -1.32, { trait: false }));
      { const q = R(lx, 0, -1.32); monde.cercle(q.x, q.z, 0.44); }
    }
    // (le client du comptoir : son poisson volant et son bol de riz)
    assiette(1.2, yS + 0.9, -1.78, (x, yp, z) => tobiuo(x, yp, z, 0.3));
    bol(1.45, yS + 0.9, -1.72, '#f4efe2', '#f4f2ea', 0.07);
    baguettes(1.0, yS + 0.9, -1.76);
    // deux tables de deux : une plie de poissons volants ; le sashimi de maquereau et la soupe
    const table = (lx, lz, plats) => {
      a.boite(0.8, 0.05, 0.8, P.bois, R(lx, yS + 0.72, lz, { nuance: 0.04 })).cylindre(0.05, 0.06, 0.7, 6, P.boisFonce, R(lx, yS + 0.355, lz, { trait: false }))
        .cylindre(0.24, 0.27, 0.03, 10, P.boisFonce, R(lx, yS + 0.015, lz, { trait: false }));
      for (const u of [-1, 1]) {
        const cx = lx + u * 0.62;
        a.boite(0.42, 0.05, 0.42, P.bois, R(cx, yS + 0.45, lz)).boite(0.04, 0.42, 0.42, P.bois, R(cx + u * 0.19, yS + 0.7, lz));
        for (const [dx, dz] of [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]]) a.boite(0.035, 0.43, 0.035, P.boisFonce, R(cx + dx, yS + 0.215, lz + dz, { trait: false }));
      }
      plats(lx, yS + 0.745, lz);
      tenir(lx - 0.84, lz - 0.4, lx + 0.84, lz + 0.4);
    };
    table(2.9, 0.4, (lx, yy, lz) => { assiette(lx - 0.18, yy, lz - 0.15, (x, yp, z) => { tobiuo(x - 0.02, yp, z - 0.03, 0.2); tobiuo(x + 0.03, yp + 0.02, z + 0.04, -0.3); }); bol(lx + 0.2, yy, lz + 0.15, '#f4efe2', '#b8a070'); });
    table(2.9, 2.2, (lx, yy, lz) => { assiette(lx - 0.15, yy, lz - 0.1, (x, yp, z) => sashimi(x, yp, z)); bol(lx + 0.18, yy, lz + 0.15, '#7a3a2a', '#c8b07a', 0.075); baguettes(lx - 0.2, yy, lz - 0.1); });
    // la caisse près de la porte, et le chat qui appelle la chance (招き猫)
    a.boite(0.9, 0.95, 0.45, P.boisFonce, R(-3.95, yS + 0.475, 1.5, { nuance: 0.04 })).boite(0.34, 0.16, 0.28, '#2a2a30', R(-4.05, yS + 1.03, 1.5));
    a.ovale(0.075, '#f8f4ec', { ...R(-3.68, yS + 1.03, 1.52), sy: 1.1 }, 8).boule(0.06, '#f8f4ec', R(-3.68, yS + 1.15, 1.52), 1)
      .boite(0.08, 0.012, 0.02, '#c8402c', R(-3.68, yS + 1.1, 1.58, { trait: false })).cone(0.022, 0.04, 4, '#f8f4ec', R(-3.71, yS + 1.22, 1.52)).cone(0.022, 0.04, 4, '#f8f4ec', R(-3.65, yS + 1.22, 1.52));
    tenir(-4.45, 1.25, -3.45, 1.75);
    // le menu au mur du fond (お品書き) : les plats de l'île
    menu(['とびうお唐揚げ', '首折れサバ', 'つけあげ', 'とびうおラーメン', 'たんかんジュース', '屋久島茶'], 0.6, 2.3, -3.24);
    // sur la table basse de l'estrade : les plats de la grand-mère
    bol(xe + 0.35, yE + 0.345, zt + 0.05, '#f4efe2', '#c89a5a'); bol(xe - 0.3, yE + 0.345, zt + 0.15, '#3a4a7a', '#e8d8b0');
    assiette(xe, yE + 0.345, zt - 0.15, (x, yp, z) => { for (let k = 0; k < 3; k++) a.ovale(0.045, '#d89a4a', { ...R(x - 0.06 + k * 0.06, yp + 0.015, z), sy: 0.45 }, 6); });
    // deux lampes de papier sur la salle (la nuit, elles s'allument)
    for (const [lx, lz] of [[2.9, 1.3], [-2.0, 1.2]]) a.baton(T3(lx, F + 2.9, lz), T3(lx, F + 2.35, lz), 0.006, '#3a3a3a', 3, { trait: false }).ovale(0.2, '#fff4dc', { ...R(lx, F + 2.2, lz), sy: 1.1, sorte: 'lumiere', trait: false }, 8);
    { const q = R(0.5, F + 2.1, 0.6); lumieres.push({ x: q.x, y: q.y, z: q.z, halo: 0, sol: yS, r: 4.2, c: '#ffe0a8' }); }
  }
  /** Les murs du restaurant (on ne passe que par la porte), les blocs de la caméra, son plafond, son plancher. */
  function mursResto(R, F, HW, y, porte) {
    const W = MAISON_W, D = MAISON_D;
    const mur = (lx0, lz0, lx1, lz1) => { const q0 = R(lx0, 0, lz0), q1 = R(lx1, 0, lz1); monde.mur(q0.x, q0.z, q1.x, q1.z, 0.3); };
    const bloc = (lx0, lx1, lz0, lz1, bas, haut) => { const q0 = R(lx0, 0, lz0), q1 = R(lx1, 0, lz1); monde.bloc(Math.min(q0.x, q1.x), Math.max(q0.x, q1.x), Math.min(q0.z, q1.z), Math.max(q0.z, q1.z), bas, haut); };
    const xi = W / 2 - 0.16, zf = D / 2 - 0.12, zb = -D / 2 + 0.16, [xp0, xp1] = porte;
    mur(-xi, zb, xi, zb); mur(-xi, zb, -xi, zf); mur(xi, zb, xi, zf);
    mur(-W / 2 - 0.1, zf, xp0, zf); mur(xp1, zf, W / 2 + 0.1, zf);
    { const xo = W / 2 + 0.27, zo = -D / 2 - 0.27, ze2 = D / 2 + 0.42, ligne = (a0, b0, a1, b1) => { const q0 = R(a0, 0, b0), q1 = R(a1, 0, b1); monde.mur(q0.x, q0.z, q1.x, q1.z, 0.05); };
      ligne(-xo, zo, xo, zo); ligne(-xo, zo, -xo, ze2); ligne(xo, zo, xo, ze2); ligne(-xo, zf, -xi, zf); ligne(xi, zf, xo, zf); }
    const haut = F + HW;
    bloc(-W / 2 - 0.05, W / 2 + 0.05, -D / 2 - 0.05, -D / 2 + 0.2, y - 1, haut); bloc(-W / 2 - 0.05, -W / 2 + 0.2, -D / 2, D / 2, y - 1, haut); bloc(W / 2 - 0.2, W / 2 + 0.05, -D / 2, D / 2, y - 1, haut);
    bloc(-W / 2, xp0, D / 2 - 0.25, D / 2 + 0.05, y - 1, haut); bloc(xp1, W / 2, D / 2 - 0.25, D / 2 + 0.05, y - 1, haut); bloc(xp0, xp1, D / 2 - 0.25, D / 2 + 0.05, F + 1.95, haut);
    const q0 = R(-W / 2, 0, -D / 2), q1 = R(W / 2, 0, D / 2);
    monde.toit(Math.min(q0.x, q1.x), Math.max(q0.x, q1.x), Math.min(q0.z, q1.z), Math.max(q0.z, q1.z), haut - 0.06, haut + 2.5);
    const r0 = R(-xi, 0, zb), r1 = R(xi, 0, zf + 0.12);
    monde.surface(Math.min(r0.x, r1.x), Math.max(r0.x, r1.x), Math.min(r0.z, r1.z), Math.max(r0.z, r1.z), F + 0.02, { sol: 'bois' });
  }

  // ---------------------------------------------------------------- Le sanctuaire Yaku-jinja (益救神社), au bout du quai
  // Son dieu : Hikohohodemi (彦火火出見尊), Yamasachihiko, le père du dieu d'Udo ; son vrai sanctuaire (本殿) est un petit autel
  // tout en haut du Miyanoura-dake. Ici : le torii de pierre ouvert sur le quai, l'allée de dalles, les deux chiens gardiens, les
  // lanternes, la fontaine, le pavillon de prière (拝殿) au toit de cuivre (sa cloche, sa corde, le tronc des offrandes), le petit
  // sanctuaire derrière, les grands camphriers, le mur de pierre au bord de l'eau, la haie.
  const RJ = repere(9.0, -49.5, -PI / 2);
  {
    const a = atelier(), y = JINJA.y, PIERRE = P.pierre, PIERRE_F = P.pierreFonce;
    // le torii de pierre (gris), à l'entrée ouest
    {
      const xt = 0.4, zt = -49.5, demi = 1.6, h = 4.0;
      for (const s of [-1, 1]) a.cylindre(0.2, 0.23, h, 12, PIERRE, { x: xt, y: y + h / 2, z: zt + s * demi }).cylindre(0.27, 0.27, 0.22, 12, PIERRE_F, { x: xt, y: y + 0.11, z: zt + s * demi });
      a.boite(0.32, 0.32, 2 * demi + 1.6, PIERRE, { x: xt, y: y + h + 0.16, z: zt, nuance: 0.04 }).boite(0.22, 0.22, 2 * demi + 0.5, PIERRE_F, { x: xt, y: y + h - 0.7, z: zt })
        .boite(0.16, 0.5, 0.3, PIERRE_F, { x: xt, y: y + h - 0.3, z: zt });
      for (const s of [-1, 1]) monde.cercle(xt, zt + s * demi, 0.48);
      // le nom, sur sa plaque
      ecrire({ x: xt - 0.09, y, z: zt, ry: -PI / 2 }, { texte: '益救神社', vertical: true, x: 0, y: h - 0.3, z: 0, l: 0.18, h: 0.42, fond: null, encre: '#2a2420' });
    }
    // l'allée de dalles du torii au pavillon de prière
    for (let x = 1.2, k = 0; x < 6.6; x += 0.78, k++) a.boite(0.72, 0.06, 1.6 + (k % 2) * 0.012, '#bdb6a6', { x, y: y + 0.01, z: -49.5, trait: false, nuance: 0.05 });
    // le pavillon de prière (拝殿), tourné vers l'ouest (son repère RJ : la façade vers +z = l'ouest)
    {
      const R = RJ, Wh = 4.6, Dh = 4.0, yh = y + 0.5, HW = 2.3;
      a.boite(Wh + 0.6, 0.5, Dh + 0.6, PIERRE_F, R(0, y + 0.25, 0, { nuance: 0.05 }));
      a.boite(Wh, 0.08, Dh, P.bois, R(0, yh + 0.04, 0));
      for (const [u, v] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [-0.33, 1], [0.33, 1], [-1, 0], [1, 0]]) a.boite(0.2, HW, 0.2, '#8a6a4e', R(u * (Wh / 2 - 0.1), yh + HW / 2, v * (Dh / 2 - 0.1)));
      a.boite(Wh - 0.2, HW, 0.1, '#e8dcc0', R(0, yh + HW / 2, -Dh / 2 + 0.1));
      for (const u of [-1, 1]) a.boite(0.1, HW, Dh - 0.2, '#e8dcc0', R(u * (Wh / 2 - 0.1), yh + HW / 2, 0));
      // la façade : des portes à claire-voie (格子戸), la poutre, la frise
      for (let k = 0; k < 3; k++) {
        const lx = (k - 1) * 1.47;
        a.boite(1.3, HW - 0.4, 0.04, '#3a2c24', R(lx, yh + (HW - 0.4) / 2, Dh / 2 - 0.12));
        for (let j = 0; j < 9; j++) a.boite(0.03, HW - 0.42, 0.05, '#c9a878', R(lx - 0.6 + j * 0.15, yh + (HW - 0.4) / 2, Dh / 2 - 0.09, { trait: false }));
        for (let j = 0; j < 7; j++) a.boite(1.28, 0.03, 0.05, '#c9a878', R(lx, yh + 0.1 + j * 0.28, Dh / 2 - 0.09, { trait: false }));
      }
      a.boite(Wh + 0.1, 0.24, 0.24, '#8a6a4e', R(0, yh + HW - 0.12, Dh / 2 - 0.1));
      // le toit de cuivre vert-de-gris (緑青), à deux pans, son avancée sur l'allée (向拝) portée par deux poteaux
      a.toitJapon(Wh + 1.8, Dh + 2.6, 1.9, 0.08, { ...R(0, yh + HW + 0.05, 0.5), tuile: '#5f9c8c', tuile2: '#6eab9a', bord: '#3f7366', avant: '#3f7366', rangs: 14, releve: 0.18, murs: { l: Wh / 2 + 0.1, p: Dh / 2 - 0.4, y: -0.05, c: '#8a6a4e' } });
      for (const u of [-1, 1]) a.boite(0.18, HW + 0.1, 0.18, '#8a6a4e', R(u * 1.5, yh + (HW + 0.1) / 2, Dh / 2 + 1.2));
      a.boite(3.2, 0.2, 0.2, '#8a6a4e', R(0, yh + HW, Dh / 2 + 1.2)).boite(0.2, 0.2, 1.3, '#8a6a4e', R(-1.5, yh + HW, Dh / 2 + 0.55)).boite(0.2, 0.2, 1.3, '#8a6a4e', R(1.5, yh + HW, Dh / 2 + 0.55));
      // les marches de bois, la cloche (鈴) et sa corde de tissu tressé, le tronc des offrandes (賽銭箱)
      for (let k = 0; k < 2; k++) a.boite(2.4, 0.2, 0.32, P.bois, R(0, y + 0.1 + k * 0.2, Dh / 2 + 0.55 - k * 0.3));
      a.boule(0.13, '#d8b04a', R(0, yh + HW - 0.38, Dh / 2 + 0.2), 1);
      a.tube([[R(0, 0, Dh / 2 + 0.2).x, yh + HW - 0.52, R(0, 0, Dh / 2 + 0.2).z], [R(0, 0, Dh / 2 + 0.24).x, yh + 0.7, R(0, 0, Dh / 2 + 0.24).z]], 0.04, '#e8d8b0', { cotes: 6, pas: 4 });
      a.boite(1.2, 0.62, 0.6, '#6a4a32', R(0, y + 0.31, Dh / 2 + 1.25, { nuance: 0.04 })).boite(1.24, 0.05, 0.64, '#4a3424', R(0, y + 0.64, Dh / 2 + 1.25));
      for (let k = 0; k < 6; k++) a.boite(0.04, 0.03, 0.56, '#2a2420', R(-0.5 + k * 0.2, y + 0.68, Dh / 2 + 1.25, { trait: false }));
      // le petit sanctuaire (本殿) derrière, sur son socle (le 2026-10-31 : plus petit et plus près du pavillon, il touchait le mur
      // de l'enceinte et sa haie ; et il arrête, on le traversait)
      const zh = -Dh / 2 - 1.05;
      a.boite(1.6, 0.8, 1.3, PIERRE_F, R(0, y + 0.4, zh)).boite(1.15, 1.0, 0.95, '#8a6a4e', R(0, y + 1.3, zh));
      a.toitJapon(1.8, 1.6, 0.7, 0.12, { ...R(0, y + 1.8, zh), tuile: '#5f9c8c', tuile2: '#6eab9a', bord: '#3f7366', rangs: 8, releve: 0.08, murs: { l: 0.585, p: 0.485, y: 0, c: '#8a6a4e' } });
      { const q = R(0, 0, zh); murRect(repere(q.x, q.z, R(0, 0, 0).ry), 0.8, 0.65); }
      murRect(R, Wh / 2 + 0.3, Dh / 2 + 0.3);
      monde.cercle(R(-1.5, 0, Dh / 2 + 1.2).x, R(-1.5, 0, Dh / 2 + 1.2).z, 0.36);
      monde.cercle(R(1.5, 0, Dh / 2 + 1.2).x, R(1.5, 0, Dh / 2 + 1.2).z, 0.36);
      { const q = R(0, 0, Dh / 2 + 1.25); murRect(repere(q.x, q.z, R(0, 0, 0).ry), 0.62, 0.32); }
      monde.toit(R(Wh / 2 + 0.9, 0, 0).x - 0.1, R(-Wh / 2 - 0.9, 0, 0).x + 0.1, R(0, 0, -Dh / 2 - 0.9).z - 0.1, R(0, 0, Dh / 2 + 1.9).z + 0.1, yh + HW, yh + HW + 2);
      lumieres.push({ ...R(0, yh + 1.6, Dh / 2 + 0.8), halo: 0, sol: y, r: 3, c: '#ffe2b0' });
    }
    // les chiens gardiens (狛犬) de part et d'autre de l'allée, sur leurs socles ; deux lanternes de pierre ; la fontaine
    for (const s of [-1, 1]) {
      const x = 4.6, z = -49.5 + s * 1.5;
      a.boite(0.7, 0.8, 0.7, PIERRE_F, { x, y: y + 0.4, z }).boite(0.6, 0.12, 0.6, PIERRE, { x, y: y + 0.86, z });
      a.ovale(0.22, PIERRE, { x: x + 0.02, y: y + 1.12, z, sx: 1.1, sy: 1.2 }, 8).boule(0.17, PIERRE, { x: x - 0.12, y: y + 1.42, z }, 1)
        .ovale(0.08, PIERRE_F, { x: x - 0.12, y: y + 1.62, z: z + s * 0.02, sx: 1.6, sy: 0.6 }, 6);
      monde.cercle(x, z, 0.62);
      const xl = 2.6, zl = -49.5 + s * 2.0;
      a.boite(0.5, 0.18, 0.5, PIERRE_F, { x: xl, y: y + 0.09, z: zl }).cylindre(0.12, 0.14, 0.7, 8, PIERRE, { x: xl, y: y + 0.53, z: zl }).boite(0.42, 0.12, 0.42, PIERRE_F, { x: xl, y: y + 0.94, z: zl })
        .boite(0.3, 0.32, 0.3, PIERRE, { x: xl, y: y + 1.16, z: zl }).boite(0.2, 0.2, 0.32, P.fenetre, { x: xl, y: y + 1.16, z: zl, trait: false })
        .toitJapon(0.62, 0.62, 0.2, 0.12, { x: xl, y: y + 1.32, z: zl, tuile: PIERRE, tuile2: PIERRE_F, bord: PIERRE_F, rangs: 5, releve: 0.04, epaisseur: 0.035 }).boule(0.06, PIERRE, { x: xl, y: y + 1.58, z: zl }, 1);
      lumieres.push({ x: xl, y: y + 1.16, z: zl, halo: 0.3, sol: y, r: 2.2 });
      monde.cercle(xl, zl, 0.55);
    }
    {
      // la fontaine des ablutions (手水舎), au sud de l'allée : la vasque de pierre, ses louches, le toit sur quatre poteaux et ses poutres
      const R = repere(3.4, -44.4, 0), yb = y;
      a.boite(1.3, 0.62, 0.7, PIERRE, R(0, yb + 0.31, 0, { nuance: 0.04 })).boite(1.1, 0.02, 0.5, '#4f8ab0', R(0, yb + 0.6, 0, { trait: false }));
      for (let k = 0; k < 3; k++) a.baton([R(-0.3 + k * 0.3, 0, 0.22).x, yb + 0.64, R(-0.3 + k * 0.3, 0, 0.22).z], [R(-0.3 + k * 0.3, 0, 0.42).x, yb + 0.66, R(-0.3 + k * 0.3, 0, 0.42).z], 0.008, '#c9a878', 4, { trait: false });
      for (const [u, v] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) a.boite(0.14, 2.2, 0.14, '#8a6a4e', R(u * 0.9, yb + 1.1, v * 0.62));
      for (const v of [-1, 1]) a.boite(2.0, 0.14, 0.14, '#8a6a4e', R(0, yb + 2.17, v * 0.62));
      for (const u of [-1, 1]) a.boite(0.14, 0.14, 1.38, '#8a6a4e', R(u * 0.9, yb + 2.17, 0));
      a.toitJapon(2.6, 2.0, 0.8, 0.1, { ...R(0, yb + 2.24, 0), tuile: '#5f9c8c', tuile2: '#6eab9a', bord: '#3f7366', rangs: 9, releve: 0.1, murs: { l: 0.97, p: 0.69, y: 0, c: '#8a6a4e' } });
      for (const [u, v] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) monde.cercle(R(u * 0.9, 0, v * 0.62).x, R(u * 0.9, 0, v * 0.62).z, 0.3);
      murRect(R, 0.65, 0.35);
    }
    // le mur de pierre de l'enceinte : au nord (au bord de l'eau), à l'est, au sud ; à l'ouest, de chaque côté du torii ; une haie
    // taillée dessus
    {
      // (d0, d1 : ce qui arrête, plus court à un bout libre ; sinon son bout arrondi dépasse les pierres de 74 cm)
      const mur = (x0, z0, x1, z1, d0 = 0, d1 = 0) => {
        const l = Math.hypot(x1 - x0, z1 - z0), ang = Math.atan2(x1 - x0, z1 - z0), n = Math.max(1, Math.round(l / 1.2));
        for (let k = 0; k < n; k++) {
          const f = (k + 0.5) / n, x = x0 + (x1 - x0) * f, z = z0 + (z1 - z0) * f;
          a.boite(0.5, 0.95 + (k % 2) * 0.012, l / n + 0.02, PIERRE_F, { x, y: y + 0.15, z, ry: ang, nuance: 0.06 });
          a.houppe(0.38, '#4f7d3c', { x, y: y + 0.95, z, sy: 0.7, sorte: 'buisson' }, 1);
        }
        const ux = (x1 - x0) / l, uz = (z1 - z0) / l;
        monde.mur(x0 + ux * d0, z0 + uz * d0, x1 - ux * d1, z1 - uz * d1, 0.74);
      };
      mur(-2.2, -54.2, 13.2, -54.2, 0.45); mur(13.2, -54.2, 13.2, -37.8); mur(13.2, -37.8, -2.2, -37.8); mur(-2.2, -37.8, -2.2, -48.0, 0, 0.45);
    }
    // les grands camphriers (楠) de l'enceinte
    for (const [x, z, h] of [[11.4, -40.2, 13], [0.4, -40.0, 11.5], [11.6, -53.0, 10]]) {
      a.tronc([[x, y - 0.5, z], [x + 0.3, y + h * 0.35, z - 0.2], [x + 0.1, y + h * 0.6, z + 0.3]], [0.5, 0.36, 0.22], '#6a5a48', 8);
      for (let k = 0; k < 7; k++) { const t = (k / 7) * 2 * PI + hasard(x, k); a.houppe(2.2 + hasard(k, x) * 0.8, ['#3f6a34', '#4a7a3a', '#365c2e'][k % 3], { x: x + Math.cos(t) * 2.4, y: y + h * (0.62 + 0.18 * hasard(z, k)), z: z + Math.sin(t) * 2.4, sy: 0.8, sorte: 'persistant' }); }
      a.houppe(2.6, '#3f6a34', { x, y: y + h * 0.88, z, sy: 0.8, sorte: 'persistant' });
      monde.cercle(x, z, 0.85);
    }
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- La route de Shiratani
  // Elle monte de la rue à l'entrée de la forêt : ses lignes blanches, le garde-fou côté pente, un muret de pierres moussues côté
  // talus là où on l'a taillée ; les panneaux jaunes « attention aux singes », « attention aux cerfs » (ils traversent).
  {
    const a = atelier(), L = longueur(ROUTE), C = { demi: 3.0 };
    // (les lignes du bord : des tirets de 10 cm, 25 cm à l'intérieur)
    for (let s = 0.5; s < L - 0.5; s += 1.0) {
      const [x, z, y, tx, tz] = auPoint(ROUTE, s);
      for (const sg of [-1, 1]) a.boite(0.1, 0.012, 0.98, '#f4f2ea', { x: x + tz * sg * (C.demi - 0.25), y: y + 0.006, z: z - tx * sg * (C.demi - 0.25), ry: Math.atan2(tx, tz), trait: false });
    }
    // le garde-fou du côté où le sol descend, le muret du côté où il monte (de 2 m en 2 m, d'après le sol à 4 m du bord)
    const cotes = { 1: [], [-1]: [] };
    for (let s = 1.0; s <= L - 1.0; s += 2.0) {
      const [x, z, y, tx, tz] = auPoint(ROUTE, s);
      for (const sg of [-1, 1]) {
        const nx = tz * sg, nz = -tx * sg, hx = terrain(x + nx * (C.demi + 4), z + nz * (C.demi + 4));
        cotes[sg].push({ x: x + nx * (C.demi + 0.05), z: z + nz * (C.demi + 0.05), y, nx, nz, bas: hx < y - 0.5, haut: hx > y + 0.9 });
      }
    }
    for (const sg of [-1, 1]) {
      let suite = [];
      const finir = () => { if (suite.length > 1) glissiere(suite.map((q) => [q.x, q.z, q.y])); suite = []; };
      for (const q of cotes[sg]) { if (q.bas) suite.push(q); else finir(); }
      finir();
      // le muret de pierres moussues (石積み), là où la route est taillée dans la pente
      for (let i = 0; i + 1 < cotes[sg].length; i++) {
        const q = cotes[sg][i], u = cotes[sg][i + 1];
        if (!q.haut || !u.haut) continue;
        const l = Math.hypot(u.x - q.x, u.z - q.z), ang = Math.atan2(u.x - q.x, u.z - q.z);
        // (un bloc sur deux 1,2 cm plus épais : bout à bout, ils ne sont pas dans le même plan)
        a.piece(new THREE.BoxGeometry(l + 0.04, 1, 0.5 + (i % 2) * 0.012, 3, 3, 1), '#8f8a7e', {
          x: (q.x + u.x) / 2 + q.nx * 0.32, y: (q.y + u.y) / 2 + 0.35, z: (q.z + u.z) / 2 + q.nz * 0.32, ry: ang + PI / 2, sy: 1.6, nuance: 0.08,
          teinte: (wx, wy) => (wy > (q.y + u.y) / 2 + 0.95 ? MOUSSE : GRANITES[Math.floor(hasard(Math.floor(wx * 2), Math.floor(wy * 3)) * GRANITES.length)]),
        });
        monde.mur(q.x + q.nx * 0.32, q.z + q.nz * 0.32, u.x + u.nx * 0.32, u.z + u.nz * 0.32, 0.55);
      }
    }
    // les panneaux jaunes (警戒標識) : un singe, un cerf, en silhouette sur un losange
    for (const [s, sg, bete] of [[14, -1, 'singe'], [33, 1, 'cerf']]) {
      const [x, z, y, tx, tz] = auPoint(ROUTE, s), nx = tz * sg, nz = -tx * sg, px = x + nx * (C.demi + 0.6), pz = z + nz * (C.demi + 0.6), ry = Math.atan2(-tx, -tz);
      a.cylindre(0.035, 0.035, 2.3, 6, '#9aa0a6', { x: px, y: terrain(px, pz) + 1.15, z: pz });
      a.boite(0.62, 0.62, 0.03, '#f2c443', { x: px, y: terrain(px, pz) + 2.15, z: pz, ry, rz: PI / 4, ordre: 'YXZ' });
      ecrire({ x: px - Math.sin(ry) * 0.02, y: terrain(px, pz), z: pz - Math.cos(ry) * 0.02, ry: ry + PI }, { texte: bete === 'singe' ? '🐒' : '🦌', x: 0, y: 2.15, z: 0, l: 0.36, h: 0.36, fond: null, encre: '#1e1e22' });
      monde.cercle(px, pz, 0.3);
    }
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- L'entrée de Shiratani Unsuikyō (白谷雲水峡)
  // Le bâtiment d'accueil de bois (管理棟) : le guichet où l'on donne sa participation à l'entretien de la forêt, les toilettes ;
  // le grand panneau du nom, la carte des sentiers ; l'arrêt du bus et le petit bus de la ligne ; des bancs ; au bord est, la
  // rambarde au-dessus du bassin de la cascade.
  const ACCUEIL = { x: -54.6, z: 29.4, l: 4.4, p: 7.2 };
  {
    const a = atelier(), y = ENTREE.y, R = repere(ACCUEIL.x, ACCUEIL.z, PI / 2), Wd = ACCUEIL.p, Dd = ACCUEIL.l, HW = 2.7;
    // (dans son repère, la façade vers +z = l'est ; Wd le long de la façade)
    a.boite(Wd + 0.2, 0.3, Dd + 0.2, BETON_FONCE, R(0, y - 0.1, 0));
    for (const u of [-1, 1]) a.boite(0.16, HW, Dd, '#a07850', R(u * (Wd / 2 - 0.08), y + HW / 2, 0, { nuance: 0.04 }));
    a.boite(Wd - 0.32, HW, 0.16, '#a07850', R(0, y + HW / 2, -Dd / 2 + 0.08, { nuance: 0.04 }));
    // la façade : des planches verticales, le guichet (sa vitre, son comptoir), la porte des toilettes, une fenêtre
    a.boite(Wd - 0.32, HW, 0.12, '#b08860', R(0, y + HW / 2, Dd / 2 - 0.08, { nuance: 0.04 }));
    for (let k = 0; k < 24; k++) a.boite(0.02, HW - 0.1, 0.02, '#8a6a48', R(-Wd / 2 + 0.3 + k * ((Wd - 0.6) / 23), y + HW / 2, Dd / 2 - 0.01, { trait: false }));
    a.boite(1.6, 0.9, 0.03, '#2b3640', R(-1.4, y + 1.45, Dd / 2 + 0.005, { trait: false })).boite(1.8, 0.06, 0.4, '#8a6a48', R(-1.4, y + 0.96, Dd / 2 + 0.2));
    a.boite(1.7, 0.08, 0.06, '#8a6a48', R(-1.4, y + 1.94, Dd / 2 + 0.03));
    a.boite(0.9, 2.0, 0.03, '#5a6a72', R(1.8, y + 1.0, Dd / 2 + 0.005, { trait: false })).boite(0.6, 0.5, 0.03, '#2b3640', R(3.0, y + 1.6, Dd / 2 + 0.005, { trait: false }));
    a.boite(0.9, 0.24, 0.02, '#f4f2ea', R(-1.4, y + 2.25, Dd / 2 + 0.03));
    ecrire({ ...R(-1.4, y, Dd / 2 + 0.045) }, { texte: '協力金 受付', x: 0, y: 2.25, z: 0, l: 0.82, h: 0.18, fond: null, encre: '#2a2420' });
    a.boite(0.5, 0.2, 0.02, '#f4f2ea', R(1.8, y + 2.25, Dd / 2 + 0.03));
    ecrire({ ...R(1.8, y, Dd / 2 + 0.045) }, { texte: 'トイレ', x: 0, y: 2.25, z: 0, l: 0.4, h: 0.15, fond: null, encre: '#2a2420' });
    a.toitJapon(Wd + 1.4, Dd + 1.6, 1.5, 0.05, { ...R(0, y + HW, 0), tuile: '#5d5f63', tuile2: '#6a6d72', bord: '#4a3a2e', rangs: 16, releve: 0.06, murs: { l: Wd / 2, p: Dd / 2, y: 0, c: '#a07850' } });
    a.boite(0.4, 0.06, 0.3, '#fff2d0', R(-1.4, y + 2.6, Dd / 2 + 0.25, { sorte: 'lumiere', trait: false }));
    lumieres.push({ ...R(-1.4, y + 2.5, Dd / 2 + 0.6), halo: 0.3, sol: y, r: 3.2, c: '#fff2d0' });
    monde.surface(R(Wd / 2 + 0.27, 0, 0).x, R(-Wd / 2 - 0.27, 0, 0).x, R(0, 0, -Dd / 2 - 0.27).z, R(0, 0, Dd / 2 + 0.47).z, y + HW + 1.6, { plein: true });
    murRect(R, Wd / 2, Dd / 2 + 0.2);
    monde.bloc(ACCUEIL.x - Dd / 2, ACCUEIL.x + Dd / 2, ACCUEIL.z - Wd / 2, ACCUEIL.z + Wd / 2, y - 1, y + HW + 1.5);
    // le grand panneau du nom, au départ du sentier : deux poteaux, une planche, le nom gravé
    {
      const x = -45.4, z = 33.4, yp = terrain(x, z);
      for (const dx of [-1.25, 1.25]) a.cylindre(0.11, 0.12, 2.6, 8, '#6a5240', { x: x + dx, y: yp + 1.3, z });
      a.boite(2.9, 0.62, 0.1, '#8a6a4a', { x, y: yp + 2.2, z, nuance: 0.04 }).boite(3.1, 0.12, 0.3, '#5a4434', { x, y: yp + 2.58, z });
      ecrire({ x, y: yp, z: z - 0.06, ry: PI }, { texte: '白谷雲水峡', x: 0, y: 2.2, z: 0, l: 2.5, h: 0.46, fond: null, encre: '#f4ead8' });
      for (const dx of [-1.25, 1.25]) monde.cercle(x + dx, z, 0.38);
    }
    // la carte des sentiers (案内図), sous son petit toit
    {
      const x = -49.8, z = 33.9, yp = terrain(x, z), b = panneau(atelier(), P, { ecrit: true });
      poser(b.fin(), x, z, { y: yp, ry: 0 });
      ecrire({ x, y: yp, z, ry: 0 }, { ...PAPIER_PANNEAU, texte: '白谷雲水峡 案内図', fond: '#fff8e8', encre: '#2a2420', lignes: 2 });
      monde.mur(x - 0.6, z, x + 0.6, z, 0.5);
    }
    // deux bancs face à la forêt
    for (const [x, z] of [[-50.5, 25.6], [-46.4, 25.6]]) {
      a.boite(1.5, 0.06, 0.42, P.bois, { x, y: y + 0.44, z }).boite(1.5, 0.3, 0.05, P.bois, { x, y: y + 0.72, z: z - 0.2 });
      for (const u of [-1, 1]) a.boite(0.06, 0.44, 0.4, '#5a4a3a', { x: x + u * 0.65, y: y + 0.22, z });
      bancs.push({ de: [x - 0.65, z], a: [x + 0.65, z], y: y + 0.47, cap: 0 });
      murRect(repere(x, z - 0.05, 0), 0.75, 0.24);
    }
    // l'arrêt du bus (白谷雲水峡), au bout de la route : son poteau
    {
      const x = -42.0, z = 25.4;
      a.cylindre(0.04, 0.04, 2.5, 8, '#8a8f94', { x, y: y + 1.25, z }).cylindre(0.32, 0.32, 0.04, 20, '#f4f2ea', { x, y: y + 2.3, z: z + 0.06, rx: PI / 2 })
        .cylindre(0.3, 0.3, 0.05, 20, '#3a8a5a', { x, y: y + 2.3, z: z + 0.06, rx: PI / 2, trait: false });
      ecrire({ x, y, z: z + 0.09, ry: 0 }, { texte: 'バス停', x: 0, y: 2.3, z: 0, l: 0.4, h: 0.12, fond: null, encre: '#ffffff' });
      a.cylindre(0.22, 0.26, 0.12, 10, BETON_FONCE, { x, y: y + 0.06, z });
      monde.cercle(x, z, 0.4);
    }
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- L'eau : la rivière de Shiratani, sa cascade, le ruisseau, le ravin
  /**
   * Un ruban d'eau qui coule le long de pts [[x, z, niveau]…] (balade.js : lieu.courants) : échantillonné tous les 40 cm, sa
   * demi-largeur large(s), son écume selon la pente (blanche là où elle dévale) ; s0 : d'où commence le motif.
   */
  const ruban = (pts, large, { de = 0, a = Infinity, ecumeMin = 0.08 } = {}) => {
    const L = Math.min(longueur(pts), a), pos = [], uv = [], ec = [], sens = [], idx = [];
    let n = 0, prec = null;
    for (let s = de; s <= L + 1e-6; s += 0.4) {
      const [x, z, y, tx, tz] = auPoint(pts, s), [, , y2] = auPoint(pts, Math.min(L, s + 0.8)), [, , y0] = auPoint(pts, Math.max(0, s - 0.8));
      const pente = Math.abs(y0 - y2) / 1.6, e = Math.min(0.95, ecumeMin + pente * 1.6), w = large(s);
      for (const t of [0, 1]) {
        const o = (t - 0.5) * 2 * w;
        pos.push(x + tz * o, y, z - tx * o);
        uv.push(s, t);
        ec.push(e);
        sens.push(tx, tz);
      }
      if (prec !== null) { const a0 = (n - 1) * 2; idx.push(a0, a0 + 1, a0 + 2, a0 + 1, a0 + 3, a0 + 2); }
      prec = s; n++;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('ecume', new THREE.Float32BufferAttribute(ec, 1));
    g.setAttribute('sens', new THREE.Float32BufferAttribute(sens, 2));
    g.setIndex(idx);
    courants.push(g);
  };
  ruban(RIVIERE, (s) => largeRiviere(s) * (s > S_CASCADE[0] && s < S_CASCADE[1] ? 0.7 + 0.15 * Math.sin(s * 1.3) : 1));
  ruban(RUISSEAU, () => 0.42, { ecumeMin: 0.12 });
  ruban(RAVIN, () => 0.28, { ecumeMin: 0.2 });
  {
    // les rochers de granite le long de la rivière (moussus dans la forêt), quelques-uns dans le courant ; sur la cascade, la dalle
    // de granite lisse, plus claire, sous l'eau qui glisse
    const L = longueur(RIVIERE);
    for (let s = 2; s < L - 6; s += 1.7) {
      const [x, z, y, tx, tz] = auPoint(RIVIERE, s), w = largeRiviere(s), dalle = s > S_CASCADE[0] - 2 && s < S_CASCADE[1] + 1.5, a = morceau(x, z);
      if (dalle) continue;
      for (const sg of [-1, 1]) {
        const t = hasard(s * 3.1 + sg, x), d = w + 0.2 + t * 0.9, rx = x + tz * sg * d, rz = z - tx * sg * d, r = 0.45 + t * 0.85 * (s < 100 ? 1 : 0.5);
        if (versChemin(rx, rz) < r + 0.4 || surPont(rx, rz, 1.2)) continue;
        rocher(a, rx, Math.max(y - 0.3, terrain(rx, rz) - 0.2), rz, r, r * (0.55 + 0.3 * t), r * 1.1, s, { mousse: s < 100 ? 0.45 : 0.15, mouille: y + 0.15 });
      }
      if (hasard(s, z) > 0.72 && s < 100) { const o = (hasard(z, s) - 0.5) * w; rocher(a, x + tz * o, y - 0.35, z - tx * o, 0.35, 0.4, 0.45, s, { mousse: 0.2, mouille: y + 0.12 }); }
    }
    // la dalle de la cascade : un ruban de granite plus large que l'eau, du haut au bassin
    const pos = [], cols = [];
    let prec = null;
    for (let s = S_CASCADE[0] - 1.5; s <= S_CASCADE[1] + 1.0; s += 0.5) {
      const [x, z, y, tx, tz] = auPoint(RIVIERE, s), row = [];
      for (let j = 0; j <= 10; j++) {
        const o = (j / 10 - 0.5) * 2 * 3.6, xx = x + tz * o, zz = z - tx * o;
        row.push([xx, Math.min(terrain(xx, zz) + 0.06, y - 0.03 + Math.abs(o) * 0.05), zz]);
      }
      if (prec) for (let j = 0; j < 10; j++) {
        const A = prec[j], B = prec[j + 1], C = row[j + 1], D = row[j], c = hasard(s * 7 + j, j) > 0.5 ? '#bdb7ac' : '#b2aca0';
        tri(pos, A, B, C, [0, 1, 0]); tri(pos, A, C, D, [0, 1, 0]);
        cols.push(c, c);
      }
      prec = row;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const a = morceau(-33, 46);
    a.piece(g, '#b8b2a6', { couleurs: cols, trait: false, nuance: 0.03 });
    // de gros blocs de granite aux bords de la dalle et au pied, le bassin vert entouré de rochers
    for (const [x, z, r, t] of [[-37.6, 50.5, 1.4, 1], [-29.2, 48.2, 1.6, 2], [-37.9, 43.0, 1.2, 3], [-29.0, 41.2, 1.5, 4], [-37.6, 37.6, 1.3, 5], [-29.6, 36.0, 1.7, 6], [-35.8, 34.2, 1.0, 7]]) {
      rocher(a, x, terrain(x, z) - 0.3, z, r, r * 0.75, r * 1.2, t, { finesse: 1, mousse: 0.5 });
    }
    vapeurs.push({ x: -33.8, z: 38.8, y: 7.5, n: 10, haut: 2.6, large: 2.2, taille: 1.8 });
  }
  // (le bruit de la cascade, au pied de la dalle : celui des cascades de Takachiho, balade.js lit lieu.cascades pour son bruit ;
  // pas de voile : l'eau glisse sur la dalle, c'est le ruban de la rivière)
  const BRUIT_CASCADE = { x: -33.6, z: 41, y: 9 };

  // ---------------------------------------------------------------- Le sentier de pierre (de l'entrée au pont suspendu)
  // Des dalles de granite posées en marches, bordées de pierres ; la rambarde de rondins côté rivière (à l'est) ; le palier de bois
  // du Yayoi-sugi, à l'ouest, et sa rambarde.
  const rangsDeMarches = (E) => {
    for (let k = 0; k < E.n; k++) {
      const m = marche(E, k), a = morceau(m.x, m.z), ang = Math.atan2(m.tx, m.tz), prof = E.L / E.n + 0.06;
      if (E.bois) {
        // (une marche de bois : un rondin au nez, le giron de planches)
        a.boite(2 * E.demi + 0.1, 0.18, prof, '#7a6248', { x: m.x, y: m.y - 0.09, z: m.z, ry: ang, nuance: 0.05, teinte: (wx, wy, wz) => (hasard(Math.floor(wx * 3), Math.floor(wz * 3)) > 0.8 ? MOUSSE_F : '#7a6248') })
          .cylindre(0.09, 0.09, 2 * E.demi + 0.2, 7, '#6a5440', { x: m.x - m.tx * (prof / 2 - 0.06), y: m.y - 0.05, z: m.z - m.tz * (prof / 2 - 0.06), ry: ang, rz: PI / 2, ordre: 'YXZ' });
      } else {
        a.boite(2 * E.demi - (k % 2) * 0.04, 0.5, prof + (k % 2) * 0.012, GRANITES[k % GRANITES.length], {
          x: m.x + (hasard(k, 3) - 0.5) * 0.04, y: m.y - 0.25, z: m.z, ry: ang + (hasard(k, 7) - 0.5) * 0.05, nuance: 0.07,
          teinte: (wx, wy, wz) => (wy > m.y - 0.03 && hasard(Math.floor(wx * 4), Math.floor(wz * 4)) > 0.82 ? MOUSSE_C : GRANITES[(k + Math.floor(wx * 2)) % GRANITES.length]),
        });
      }
    }
  };
  rangsDeMarches(ESC_PIERRE);
  {
    const E = ESC_PIERRE, pts = [];
    // (la rambarde côté rivière : à droite en montant, jusqu'au pied du pont ; elle continue celle du bord est de l'entrée, d'un seul
    // tenant : au-dessus du bassin de la cascade)
    for (let s = 0.0; s <= E.L - 0.6; s += 1.6) { const [x, z, y, tx, tz] = auPoint(E.pts, s); pts.push([x + tz * (E.demi + 0.32), z - tx * (E.demi + 0.32), y]); }
    rambarde([[ENTREE.x0 + 6.4, ENTREE.z0 - 0.3, ENTREE.y], [ENTREE.x0 - 0.3, ENTREE.z0 - 0.3, ENTREE.y], [ENTREE.x0 - 0.3, ENTREE.z0 + 1.7, ENTREE.y]]);
    rambarde([[ENTREE.x0 - 0.3, ENTREE.z1 - 1.5, ENTREE.y], [ENTREE.x0 - 0.3, ENTREE.z1 + 0.3, ENTREE.y], [ESC_PIERRE.pts[0][0] - ESC_PIERRE.demi - 0.32, ENTREE.z1 + 0.3, ENTREE.y]]);
    rambarde([[ENTREE.x1 - 3.6, ENTREE.z0 - 0.3, ENTREE.y], [ENTREE.x1 + 0.3, ENTREE.z0 - 0.3, ENTREE.y], [ENTREE.x1 + 0.3, ENTREE.z1 - 0.6, ENTREE.y], ...pts]);
    // le palier du Yayoi-sugi : ses planches, sa rambarde sur ses trois côtés dehors
    const Y = PALIER_YAYOI, a = morceau(Y.x0, Y.z0);
    // (le plancher 1,5 cm sous la marche d'à côté, qu'il touche : pas dans son plan ; les poteaux sous lui)
    a.boite(Y.x1 - Y.x0 + 0.02, 0.08, Y.z1 - Y.z0, '#8a7058', { x: (Y.x0 + Y.x1) / 2, y: Y.y - 0.055, z: (Y.z0 + Y.z1) / 2, nuance: 0.04 });
    for (let x = Y.x0 + 0.15; x < Y.x1; x += 0.3) a.boite(0.02, 0.012, Y.z1 - Y.z0 - 0.04, '#6a5440', { x, y: Y.y - 0.013, z: (Y.z0 + Y.z1) / 2, trait: false });
    for (const [x, z] of [[Y.x0 + 0.2, Y.z0 + 0.2], [Y.x0 + 0.2, Y.z1 - 0.2], [Y.x1 - 0.2, Y.z0 + 0.2], [Y.x1 - 0.2, Y.z1 - 0.2]]) a.cylindre(0.08, 0.08, 1.2, 6, RONDIN, { x, y: Y.y - 0.7, z });
    rambarde([[Y.x1 - 0.1, Y.z0 - 0.3, Y.y], [Y.x0 - 0.3, Y.z0 - 0.3, Y.y], [Y.x0 - 0.3, Y.z1 + 0.3, Y.y], [Y.x1 - 0.1, Y.z1 + 0.3, Y.y]]);
    // (la rambarde de l'escalier, côté ouest, de part et d'autre du palier : pas besoin, l'ourlet de la forêt borde le reste)
  }

  // ---------------------------------------------------------------- Le pont suspendu Satsuki (さつき吊橋)
  // Deux portiques d'acier gris-vert à chaque bout, les deux câbles porteurs qui s'affaissent, les suspentes, le tablier de planches
  // sur ses deux longerons, le grillage vert des côtés, la main courante ; les câbles d'ancrage dans leurs blocs de béton.
  {
    const a = atelier(), z0 = PONT.z, VERT = '#4f6f5a', W = 0.9, yT = (x) => yPont(x);
    for (const xb of [PONT.x0, PONT.x1]) {
      const sens = xb < (PONT.x0 + PONT.x1) / 2 ? -1 : 1, x = xb + sens * 0.15, ys = terrain(x, z0);
      for (const sg of [-1, 1]) a.boite(0.16, 2.6 + (PONT.y - ys), 0.16, VERT, { x, y: (ys + PONT.y + 2.6) / 2 - 0.3, z: z0 + sg * (W + 0.1) });
      a.boite(0.16, 0.16, 2 * W + 0.36, VERT, { x, y: PONT.y + 2.45, z: z0 });
      for (const sg of [-1, 1]) {
        // (à l'ouest, l'escalier de pierre arrive du nord au pied du portique : les ancrages 3,6 m derrière ses poteaux, le câble à
        // plus de 1,8 m au-dessus du bout de l'escalier ; à l'est, le sentier part vers le sud-est : l'ancrage du sud au sud)
        const [ax, az] = sens < 0 ? [x - 3.6, z0 + sg * (W + 0.1)] : sg > 0 ? [x + 0.3, z0 + 4.2] : [x + 1.2, z0 - 2.7], ya = terrain(ax, az);
        a.boite(0.7, 0.5, 0.7, BETON, { x: ax, y: ya + 0.1, z: az });
        a.baton([x, PONT.y + 2.4, z0 + sg * (W + 0.1)], [ax, ya + 0.32, az], 0.02, '#5a5f62', 4);
        monde.cercle(x, z0 + sg * (W + 0.1), 0.35);
        monde.cercle(ax, az, 0.62);
      }
    }
    // les câbles porteurs (une chaînette) et les suspentes ; la main courante ; le grillage
    for (const sg of [-1, 1]) {
      const zc = z0 + sg * (W + 0.05), pts = [];
      for (let k = 0; k <= 24; k++) { const x = PONT.x0 + ((PONT.x1 - PONT.x0) * k) / 24, f = (2 * k) / 24 - 1; pts.push([x, PONT.y + 2.4 - 0.7 * (1 - f * f), zc]); }
      a.tube(pts, 0.025, '#5a5f62', { cotes: 5, pas: 24, trait: false });
      for (let k = 1; k < 24; k++) a.baton([pts[k][0], pts[k][1], zc], [pts[k][0], yT(pts[k][0]) + 0.05, zc - sg * 0.03], 0.008, '#6a6f72', 3, { trait: false });
      a.tube(Array.from({ length: 25 }, (_, k) => { const x = PONT.x0 + ((PONT.x1 - PONT.x0) * k) / 24; return [x, yT(x) + 1.0, zc - sg * 0.02]; }), 0.022, '#7a7f82', { cotes: 5, pas: 24 });
      // (le grillage : une toile verte fine, en bandes entre la main courante et le tablier)
      a.piece(new THREE.BoxGeometry(1, 1, 1, 24, 1, 1), '#5f8a6a', {
        trait: false, nuance: 0.02,
        deformer: (px, py, pz) => { const x = PONT.x0 + (px + 0.5) * (PONT.x1 - PONT.x0); return [x, yT(x) + 0.08 + (py + 0.5) * 0.88, zc - sg * 0.035 + pz * 0.01]; },
      });
    }
    // le tablier : deux longerons, des planches en travers tous les 20 cm
    for (const sg of [-1, 1]) a.tube(Array.from({ length: 13 }, (_, k) => { const x = PONT.x0 + ((PONT.x1 - PONT.x0) * k) / 12; return [x, yT(x) - 0.12, z0 + sg * 0.55]; }), 0.07, '#5a4a3a', { cotes: 5, pas: 12 });
    for (let x = PONT.x0 + 0.1, k = 0; x < PONT.x1 - 0.05; x += 0.2, k++) a.boite(0.18, 0.05, 2 * W - 0.02, k % 2 ? '#8a7058' : '#7d644e', { x, y: yT(x) - 0.025, z: z0, rz: Math.atan2(yT(x + 0.1) - yT(x - 0.1), 0.2), trait: k % 4 === 0 });
    // (le long de ses côtés)
    for (const sg of [-1, 1]) monde.mur(PONT.x0, z0 + sg * 0.92, PONT.x1, z0 + sg * 0.92, 0.3);
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Les cèdres millénaires (屋久杉)
  const ECORCES = ['#7a5a44', '#6e5040', '#86624a', '#735644'], LICHEN = '#8f8676';
  /** La couleur de l'écorce d'un vieux cèdre en wx, wy, wz (son pied en y, son milieu en z) : brun-roux, des veines plus sombres
   *  qui montent, un peu de lichen gris, la mousse au pied (plus haut au nord). */
  const ecorce = (wx, wy, wz, y, zc, plusMousse = 0) => {
    const h = wy - y, n = bruitDoux(wx * 0.9 + wz * 0.4, wy * 0.35, 2), n2 = bruitDoux(wx * 0.6 - 3, wz * 0.6 + wy * 0.2, 2);
    if (h < 0.7 + 1.3 * n2 + Math.max(0, zc - wz) * 0.5 + plusMousse) return n > 0.5 ? MOUSSE : MOUSSE_F;
    if (n2 > 0.78) return LICHEN;
    return n > 0.62 ? ECORCES[2] : n > 0.4 ? ECORCES[0] : n > 0.22 ? ECORCES[3] : ECORCES[1];
  };
  const VERTS_SUGI = ['#36533a', '#3f5f3a', '#2f4a32', '#425f3c'];
  /**
   * Un yakusugi (屋久杉), un cèdre de plus de mille ans, dans l'atelier a, son pied en x, y, z : le pied évasé en contreforts, le
   * tronc noueux et cannelé qui s'affine, l'écorce rousse tachée de lichen gris, la mousse sur le pied (plus haut au nord) ; en haut,
   * de grosses branches tordues et leurs touffes sombres, de petites plantes qui poussent sur elles. o : r (le rayon du pied), fut
   * (la hauteur des premières branches), h (le haut des touffes), lobes, rugueux (les cannelures), graine, branches, casse (le haut
   * cassé : pas de cime), sans (pas de houppier : une souche). Renvoie le haut du tronc [x, y, z] et son rayon.
   */
  const yakusugi = (a, x, z, y, o) => {
    const g = o.graine ?? hasard(x * 0.37, z * 0.53), r0 = o.r, H = o.fut, n = o.lobes ?? 5, rug = o.rugueux ?? 1;
    const lobes = Array.from({ length: n }, (_, k) => ({ a: (k / n) * 2 * PI + g * 4 + (hasard(k, g) - 0.5) * 0.9, f: 0.2 + 0.28 * hasard(g, k + 3) }));
    const pk = [(hasard(g, 1) - 0.5) * r0 * 0.6, (hasard(g, 2) - 0.5) * r0 * 0.6];
    const axe = (t) => [x + pk[0] * t * t, z + pk[1] * t * t];
    const rayon = (th, t) => {
      let k = 0;
      for (const L of lobes) { const c = Math.cos(th - L.a); if (c > 0) k += L.f * c ** 6; }
      const contreforts = 1 + k * 2.0 * (1 - t) ** 3 + k * 0.45 * (1 - t);
      const cannelures = 1 + rug * (0.055 * Math.sin(th * 11 + t * 4 + g * 9) + 0.035 * Math.sin(th * 23 - t * 9 + g * 3) + 0.03 * Math.sin(th * 5 + t * 15));
      return r0 * (1 - (o.affine ?? 0.42) * t) * contreforts * cannelures * (t < 0.06 ? 1 + (0.06 - t) * 2.5 : 1);
    };
    const NT = o.cotes ?? 30, NH = o.anneaux ?? 16;
    a.piece(new THREE.CylinderGeometry(1, 1, 1, NT, NH, !o.sans), ECORCES[0], {
      nuance: 0.05,
      deformer: (px, py, pz) => {
        const t = py + 0.5, th = Math.atan2(pz, px), [ax, az] = axe(t), rr = Math.hypot(px, pz) < 0.01 ? 0 : rayon(th, t);
        // (une souche cassée : son bord du haut en dents)
        const haut = o.sans ? H * (1 - 0.18 * Math.max(0, Math.sin(th * 3 + g * 7)) - 0.1 * Math.max(0, Math.sin(th * 7 + g))) : H;
        return [ax + Math.cos(th) * rr, y - 0.7 + t * (haut + 0.7), az + Math.sin(th) * rr];
      },
      teinte: (wx, wy, wz) => ecorce(wx, wy, wz, y, z, o.mousse ?? 0),
    });
    const [tx, tz] = axe(1), rh = r0 * (1 - (o.affine ?? 0.42));
    if (o.sans) return { haut: [tx, y + H, tz], r: rh };
    // les grosses branches : elles partent du haut du tronc, s'écartent et montent en se tordant ; une touffe sombre au bout et une
    // au coude ; de petites plantes accrochées
    const nb = o.branches ?? 4, cime = [];
    for (let k = 0; k < nb; k++) {
      const ang = (k / nb) * 2 * PI + g * 6 + (hasard(k, g) - 0.5) * 0.7, yb = y + H * (0.82 + 0.18 * hasard(g, k + 7)), L = (o.h - H) * (0.55 + 0.3 * hasard(k, g + 1)) + r0 * 1.2;
      const d0 = [tx + Math.cos(ang) * rh * 0.5, yb, tz + Math.sin(ang) * rh * 0.5];
      const d1 = [d0[0] + Math.cos(ang + 0.3) * L * 0.45, yb + L * 0.35, d0[2] + Math.sin(ang + 0.3) * L * 0.45];
      const d2 = [d0[0] + Math.cos(ang - 0.2) * L * 0.8, yb + L * 0.62, d0[2] + Math.sin(ang - 0.2) * L * 0.8];
      const gb = o.grossesBranches ?? 1;
      a.tronc([[tx, yb - rh * 0.6, tz], d0, d1, d2], [rh * 0.42 * gb, rh * 0.36 * gb, rh * 0.25 * gb, rh * 0.12 * gb], ECORCES[1], 7, { teinte: (wx, wy, wz) => ecorce(wx, wy, wz, y, z, -50) });
      cime.push(d2, d1);
      if (hasard(k, g + 4) > 0.45) a.houppe(0.45 + rh * 0.2, '#6a9a44', { x: d1[0], y: d1[1] + 0.2, z: d1[2], sy: 0.6, sorte: 'persistant' }, 0);
    }
    cime.push([tx, y + o.h - (o.h - H) * 0.25, tz]);
    for (const [k, p] of cime.entries()) {
      const R = ((o.h - H) * (k === cime.length - 1 ? 0.32 : k % 2 ? 0.22 : 0.3) + 0.6) * (o.cime ?? 1);
      a.houppe(R, VERTS_SUGI[k % VERTS_SUGI.length], { x: p[0], y: p[1] + R * 0.25, z: p[2], sy: 0.62, sorte: 'conifere', graine: g });
      // (une grande cime : une seconde touffe à côté de chaque bout de branche)
      if (o.cime && k < cime.length - 1) a.houppe(R * 0.75, VERTS_SUGI[(k + 1) % VERTS_SUGI.length], { x: p[0] + (hasard(k, g) - 0.5) * R, y: p[1] + R * 0.6, z: p[2] + (hasard(g, k) - 0.5) * R, sy: 0.6, sorte: 'conifere', graine: g });
    }
    return { haut: [tx, y + H, tz], r: rh };
  };

  // ---------------------------------------------------------------- Le Yayoi-sugi (弥生杉), au bord du sentier de pierre
  // 3 000 ans, 26,1 m, 8,1 m de tour ; jamais abattu : sa forme ne donnait pas de planches. Un pied en contreforts, un tronc tordu.
  yakusugi(morceau(YAYOI.x, YAYOI.z), YAYOI.x, YAYOI.z, terrain(YAYOI.x, YAYOI.z), { r: YAYOI.r, fut: 15, h: 26, lobes: 6, rugueux: 1.4, branches: 5 });
  monde.cercle(YAYOI.x, YAYOI.z, YAYOI.r * 1.3 + 0.27);

  // ---------------------------------------------------------------- Le sentier de terre, du pont à la forêt de mousse
  // Des rondins en travers (contre l'eau), des racines qui le traversent, des pierres ; à côté, le Nidai-ōsugi (二代大杉 : un jeune
  // cèdre né sur la souche d'un ancien, qu'on avait abattu) ; le Kuguri-sugi (くぐり杉), dont les racines font une arche au-dessus
  // du sentier : on passe dessous ; d'autres vieux cèdres moussus.
  {
    const a = atelier(), L = longueur(SENTIER2);
    for (let s = 3; s < L - 2; s += 4.6) {
      const [x, z, y, tx, tz] = auPoint(SENTIER2, s), ang = Math.atan2(tx, tz);
      a.cylindre(0.1, 0.1, 2.7, 7, RONDIN_F, { x, y: y + 0.02, z, ry: ang + PI / 2, rz: PI / 2, ordre: 'YXZ' });
    }
    for (let s = 5.5; s < L - 2; s += 7.3) {
      const [x, z, y, tx, tz] = auPoint(SENTIER2, s), o = (hasard(s, 3) - 0.5) * 0.8;
      a.tube([[x + tz * (1.9 + o), y - 0.15, z - tx * (1.9 + o)], [x + tz * 0.6 + tx * 0.3, y + 0.04, z - tx * 0.6 + tz * 0.3], [x - tz * 0.5 + tx * 0.5, y + 0.03, z + tx * 0.5 + tz * 0.5], [x - tz * 1.8, y - 0.2, z + tx * 1.8]], 0.07, '#6a5440', { cotes: 5, pas: 10 });
    }
    poser(a.fin(), 0, 0, { y: 0 });
  }
  const NIDAI = { x: -14.6, z: 75.6 };
  {
    const a = morceau(NIDAI.x, NIDAI.z), y = terrain(NIDAI.x, NIDAI.z);
    // la souche de l'ancien (1re génération), haute de 3 m, cassée en dents ; le jeune cèdre (2e génération) qui pousse dessus, et
    // ses racines qui descendent le long d'elle jusqu'au sol
    yakusugi(a, NIDAI.x, NIDAI.z, y, { r: 1.45, fut: 3.0, h: 3.0, sans: true, lobes: 5, rugueux: 1.3, affine: 0.15, graine: 0.31 });
    yakusugi(a, NIDAI.x + 0.1, NIDAI.z - 0.05, y + 2.6, { r: 0.72, fut: 20, h: 31, lobes: 4, branches: 4, graine: 0.77, mousse: -0.4 });
    for (let k = 0; k < 7; k++) {
      const t = (k / 7) * 2 * PI + 0.4, r1 = 0.75, r2 = 1.55 + 0.2 * hasard(k, 1);
      a.tube([[NIDAI.x + Math.cos(t) * 0.4, y + 2.9, NIDAI.z + Math.sin(t) * 0.4], [NIDAI.x + Math.cos(t) * r1 * 1.4, y + 2.4, NIDAI.z + Math.sin(t) * r1 * 1.4], [NIDAI.x + Math.cos(t) * r2, y + 1.2, NIDAI.z + Math.sin(t) * r2], [NIDAI.x + Math.cos(t) * (r2 + 0.3), y - 0.2, NIDAI.z + Math.sin(t) * (r2 + 0.3)]], 0.09, '#6e5040', { cotes: 5, pas: 9, teinte: (wx, wy) => (wy < y + 0.8 ? MOUSSE_F : '#6e5040') });
    }
    monde.cercle(NIDAI.x, NIDAI.z, 1.45 * 1.4 + 0.27);
  }
  // le Kuguri-sugi : ses deux jambes de racines de part et d'autre du sentier, qui se rejoignent à 2,8 m au-dessus de lui ; le tronc
  // monte de là
  const KUGURI = (() => {
    const s = 22.0, [x, z, y, tx, tz] = auPoint(SENTIER2, s);
    return { x, z, y, tx, tz, s };
  })();
  {
    const K = KUGURI, a = morceau(K.x, K.z), nx = K.tz, nz = -K.tx, yJ = K.y + 2.75;
    for (const sg of [-1, 1]) {
      const px = K.x + nx * sg * 1.85, pz = K.z + nz * sg * 1.85, yp = terrain(px, pz);
      // (la jambe : plusieurs grosses racines serrées, qui montent en se courbant au-dessus du sentier)
      for (let k = 0; k < 3; k++) {
        const o = (k - 1) * 0.32, ox = K.tx * o, oz = K.tz * o;
        a.tube([[px + ox + nx * sg * 0.25, yp - 0.3, pz + oz + nz * sg * 0.25], [px + ox, yp + 0.9, pz + oz], [K.x + nx * sg * 1.35 + ox * 0.7, K.y + 2.2, K.z + nz * sg * 1.35 + oz * 0.7], [K.x + nx * sg * 0.55 + ox * 0.4, yJ + 0.15, K.z + nz * sg * 0.55 + oz * 0.4]],
          0.26 - Math.abs(o) * 0.12, '#6e5040', { cotes: 7, pas: 12, teinte: (wx, wy) => (wy < yp + 1.0 + 0.6 * hasard(Math.floor(wx * 3), Math.floor(wy * 2)) ? MOUSSE : '#6e5040') });
      }
      monde.cercle(px, pz, 0.62);
    }
    yakusugi(a, K.x, K.z, yJ - 0.4, { r: 0.92, fut: 13, h: 23, lobes: 3, branches: 4, graine: 0.53, affine: 0.38, mousse: -0.6 });
  }
  // d'autres vieux cèdres le long des sentiers (moussus, leurs racines)
  const VIEUX = [[-22.6, 57.6, 1.25, 12], [-5.0, 70.8, 1.15, 11], [18.6, 81.6, 1.4, 12], [-1.0, 97.0, 1.2, 12], [39.6, 101.6, 1.25, 12], [47.0, 82.2, 1.35, 14], [63.4, 80.8, 1.2, 12], [70.0, 63.4, 1.3, 12], [87.5, 59.5, 1.5, 13]];
  for (const [x, z, r, fut] of VIEUX) {
    const y = terrain(x, z);
    yakusugi(morceau(x, z), x, z, y, { r, fut, h: fut + 9, lobes: 4 + Math.floor(hasard(x, z) * 3), branches: 3 + Math.floor(hasard(z, x) * 2) });
    monde.cercle(x, z, r * 1.3 + 0.27);
  }

  // ---------------------------------------------------------------- La forêt de mousse (苔むす森)
  // Tout y est couvert de mousse : les rochers, les troncs tombés, les racines. Des rochers et des racines autour de la clairière
  // (ce qui l'arrête), et quelques-uns dedans.
  const ROCHERS_KOKE = [];
  {
    const a = atelier(), K = KOKE;
    // (autour : tous les 1,3 m du bord, un rocher moussu, sauf aux sorties des sentiers)
    const sorties = [[3.6, 84.4], [0.4, 89.6], [15.2, 90.2]];
    for (let k = 0; k < 40; k++) {
      const t = (k / 40) * 2 * PI, ex = K.x + Math.cos(t) * (K.rx + 0.9), ez = K.z + Math.sin(t) * (K.rz + 0.9);
      const r = 0.55 + 0.6 * hasard(k, 5);
      // (pas sur les sentiers qui entrent dans la clairière : avec ce qui arrête autour d'eux, ils la fermaient)
      if (sorties.some(([sx, sz]) => Math.hypot(ex - sx, ez - sz) < 2.6) || versChemin(ex, ez) < r * 1.3 + 0.35) continue;
      rocher(a, ex, terrain(ex, ez) - 0.25, ez, r * 1.2, r * 0.8, r, k, { mousse: 0.92 });
      ROCHERS_KOKE.push([ex, ez, r]);
      monde.cercle(ex, ez, r * 1.15 + 0.27);
    }
    // dedans : trois gros rochers moussus et un tronc tombé (on en fait le tour)
    for (const [x, z, r, t] of [[5.2, 89.6, 0.95, 1], [11.8, 85.0, 0.8, 2], [9.6, 91.2, 0.6, 3]]) {
      rocher(a, x, terrain(x, z) - 0.25, z, r * 1.25, r * 0.85, r, t, { mousse: 0.95 });
      monde.cercle(x, z, r * 1.2 + 0.27);
    }
    // les troncs tombés, couverts de mousse : un dans la clairière (le long de son bord nord), d'autres autour
    const tombe = (x0, z0, x1, z1, r) => {
      const y0 = terrain(x0, z0), y1 = terrain(x1, z1);
      a.tube([[x0, y0 + r * 0.6, z0], [(x0 + x1) / 2, (y0 + y1) / 2 + r * 0.75, (z0 + z1) / 2], [x1, y1 + r * 0.55, z1]], r, ECORCES[2], { cotes: 8, pas: 8, teinte: (wx, wy, wz) => (wy > (y0 + y1) / 2 + r * 0.9 - 0.1 * hasard(Math.floor(wx * 3), Math.floor(wz * 3)) ? MOUSSE_C : MOUSSE_F) });
      a.cylindre(r, r, 0.03, 10, '#a07a54', { x: x1, y: y1 + r * 0.55, z: z1, rz: PI / 2, ry: Math.atan2(x1 - x0, z1 - z0) + PI / 2, ordre: 'YXZ', trait: false });
    };
    // (ce qui les arrête : 25 cm plus court à chaque bout, son bout arrondi ne dépasse pas le bois de plus de 42 cm)
    const murTronc = (x0, z0, x1, z1, r) => { const l = Math.hypot(x1 - x0, z1 - z0), ux = ((x1 - x0) / l) * 0.25, uz = ((z1 - z0) / l) * 0.25; monde.mur(x0 + ux, z0 + uz, x1 - ux, z1 - uz, r + 0.27); };
    tombe(6.4, 81.9, 12.6, 82.4, 0.38);
    murTronc(6.4, 81.9, 12.6, 82.4, 0.38);
    tombe(-4.6, 86.0, 1.0, 87.4, 0.45);
    murTronc(-4.6, 86.0, 1.0, 87.4, 0.45);
    tombe(4.4, 92.2, 8.2, 92.4, 0.4);
    murTronc(4.4, 92.2, 8.2, 92.4, 0.4);
    tombe(-9.5, 97.2, -4.2, 95.8, 0.35);
    // les racines des vieux arbres qui courent sur les rochers
    for (const [x, z, t] of [[2.2, 82.6, 0.3], [14.6, 83.2, 2.2], [16.4, 92.0, 3.6], [4.6, 94.0, 4.8]]) {
      const y = terrain(x, z);
      for (let k = 0; k < 3; k++) {
        const ang = t + (k - 1) * 0.6;
        a.tube([[x, y + 0.12, z], [x + Math.cos(ang) * 0.9, y + 0.04, z + Math.sin(ang) * 0.9], [x + Math.cos(ang + 0.3) * 1.9, y - 0.1, z + Math.sin(ang + 0.3) * 1.9]], 0.07, MOUSSE_F, { cotes: 5, pas: 8 });
      }
    }
    poser(a.fin(), 0, 0, { y: 0 });
  }
  // le panneau de la forêt de mousse (苔むす森), au bord de la clairière
  // (chaque panneau au bord de son sentier, tourné vers lui : vers, le point du sentier en face ; on le lit 1,2 m devant)
  const PANNEAUX = Object.fromEntries(Object.entries({
    koke: { x: 2.6, z: 82.3, vers: [5.5, 85.5] }, nidai: { x: -16.58, z: 71.89, vers: [-15.3, 70.35] }, kuguri: { x: -9.02, z: 72.9, vers: [-10.27, 74.46] },
    yayoi: { x: PALIER_YAYOI.x0 + 0.6, z: PALIER_YAYOI.z0 - 0.55, vers: [(PALIER_YAYOI.x0 + PALIER_YAYOI.x1) / 2, (PALIER_YAYOI.z0 + PALIER_YAYOI.z1) / 2] },
    taiko: { x: 24.6, z: 106.6, vers: [22.1, 103.9] }, voie: { x: 37.9, z: 100.2, vers: [36.0, 98.6] }, kosugi: { x: 52.72, z: 89.64, vers: [RECOIN.x, RECOIN.z] },
    wilson: { x: 74.1, z: 62.7, vers: [76.15, 66.9] }, jomon: { x: 87.2, z: 86.8, vers: [91.5, 84.4] }, jinja: { x: 1.6, z: -52.4, vers: [3.0, -49.5] },
  }).map(([id, q]) => [id, { ...q, ry: Math.atan2(q.x - q.vers[0], q.z - q.vers[1]) }]));

  // ---------------------------------------------------------------- Le petit sentier caché et le vieux cèdre creux (le secret)
  // Un sentier étroit part de la forêt de mousse vers l'ouest, passe le ruisseau sur une planche, et finit devant un vieux cèdre
  // mort, cassé à 6 m, creux : sa bouche tournée vers le sentier. De jour, il fait noir dedans ; la nuit, les champignons qui
  // brillent (シイノトモシビタケ) y mènent, et l'éclairent.
  const PLANCHE_RUISSEAU = (() => {
    const l = surLaLigne(SENTIER_SECRET, -4.17, 91.5);
    const [x, z, y, tx, tz] = auPoint(SENTIER_SECRET, l.s);
    return { x, z, y, tx, tz };
  })();
  {
    const a = atelier(), B = PLANCHE_RUISSEAU, ang = Math.atan2(B.tx, B.tz);
    // deux rondins d'une rive à l'autre, des planches en travers ; on y marche
    for (const sg of [-1, 1]) a.cylindre(0.1, 0.1, 3.6, 7, RONDIN_F, { x: B.x + B.tz * sg * 0.45, y: B.y - 0.08, z: B.z - B.tx * sg * 0.45, ry: ang, rx: PI / 2, ordre: 'YXZ' });
    for (let k = -7; k <= 7; k++) a.boite(1.2, 0.05, 0.22, k % 2 ? '#8a7058' : '#7d644e', { x: B.x + B.tx * k * 0.24, y: B.y + 0.02, z: B.z + B.tz * k * 0.24, ry: ang, nuance: 0.05, trait: k === 0 });
    monde.chemin([[B.x - B.tx * 1.75, B.z - B.tz * 1.75, B.y + 0.04], [B.x + B.tx * 1.75, B.z + B.tz * 1.75, B.y + 0.04]], 0.9, { sol: 'bois', droits: true });
    for (const sg of [-1, 1]) rambarde([[B.x - B.tx * 1.5 + B.tz * sg * 0.95, B.z - B.tz * 1.5 - B.tx * sg * 0.95, B.y + 0.02], [B.x + B.tx * 1.5 + B.tz * sg * 0.95, B.z + B.tz * 1.5 - B.tx * sg * 0.95, B.y + 0.02]], { haut: 0.7 });
    poser(a.fin(), 0, 0, { y: 0 });
  }
  /** Le vieux cèdre creux : une coque épaisse, sa bouche (de 1 m de large, 1,7 m de haut) tournée vers le bout du sentier. */
  const BOUCHE_CREUX = Math.atan2(SENTIER_SECRET[4][1] - CREUX.z, SENTIER_SECRET[4][0] - CREUX.x);
  const ouvertureDe = (th, bouche, demi) => { const d = Math.atan2(Math.sin(th - bouche), Math.cos(th - bouche)); return Math.abs(d) < demi; };
  {
    const a = morceau(CREUX.x, CREUX.z), y = terrain(CREUX.x, CREUX.z), R0 = CREUX.r, Rin = 0.82, H = 6.2, NT = 28, NH = 12, pos = [], cols = [];
    const rugo = (th, t) => 1 + 0.06 * Math.sin(th * 9 + t * 5) + 0.04 * Math.sin(th * 17 - t * 11);
    const pt = (th, t, r) => [CREUX.x + Math.cos(th) * r, y - 0.4 + t * (H + 0.4), CREUX.z + Math.sin(th) * r];
    const haut = (th) => 1 - 0.22 * Math.max(0, Math.sin(th * 3 + 1.1)) - 0.12 * Math.max(0, Math.sin(th * 7));
    const tBouche = 2.1 / (H + 0.4), demiB = 0.62 / R0;
    for (let j = 0; j < NT; j++) {
      const th0 = (j / NT) * 2 * PI, th1 = ((j + 1) / NT) * 2 * PI, ouvert = ouvertureDe((th0 + th1) / 2, BOUCHE_CREUX, demiB);
      for (let i = 0; i < NH; i++) {
        const t0 = i / NH, t1 = (i + 1) / NH;
        if (ouvert && t1 <= tBouche + 0.01) continue;
        const h0 = (t) => Math.min(t, haut(th0)), h1 = (t) => Math.min(t, haut(th1));
        const A = pt(th0, h0(t0), R0 * rugo(th0, t0)), B = pt(th1, h1(t0), R0 * rugo(th1, t0)), C = pt(th1, h1(t1), R0 * rugo(th1, t1)), D = pt(th0, h0(t1), R0 * rugo(th0, t1));
        const n = [Math.cos((th0 + th1) / 2), 0, Math.sin((th0 + th1) / 2)];
        tri(pos, A, B, C, n); tri(pos, A, C, D, n);
        // (un vieil arbre mort : l'écorce plus grise, la mousse plus haut)
        const mx = (A[0] + C[0]) / 2, my = (A[1] + C[1]) / 2, mz = (A[2] + C[2]) / 2, nn = bruitDoux(mx * 0.8 + mz * 0.5, my * 0.4, 2);
        const c = my - y < 1.1 + 1.2 * bruitDoux(mx * 0.7, mz * 0.7, 2) ? (nn > 0.5 ? MOUSSE : MOUSSE_F) : nn > 0.66 ? LICHEN : nn > 0.35 ? '#6a5646' : '#5f4a3c';
        cols.push(c, c);
        // l'intérieur (sombre), tourné vers l'axe
        const a2 = pt(th0, h0(t0), Rin), b2 = pt(th1, h1(t0), Rin), c2 = pt(th1, h1(t1), Rin), d2 = pt(th0, h0(t1), Rin), ni = [-n[0], 0, -n[2]];
        tri(pos, a2, b2, c2, ni); tri(pos, a2, c2, d2, ni);
        cols.push('#2a2420', '#2a2420');
        // (le haut cassé : le bord entre dehors et dedans)
        if (t1 >= Math.min(haut(th0), haut(th1)) - 1e-6 && t0 < Math.min(haut(th0), haut(th1))) {
          const E = pt(th0, h0(t1), R0 * rugo(th0, t1)), F = pt(th1, h1(t1), R0 * rugo(th1, t1));
          tri(pos, E, F, c2, [0, 1, 0]); tri(pos, E, c2, d2, [0, 1, 0]);
          cols.push('#7a6450', '#7a6450');
        }
      }
      // (les bords de la bouche : les joues entre dehors et dedans)
      if (ouvert !== ouvertureDe(((j + 1.5) / NT) * 2 * PI, BOUCHE_CREUX, demiB)) {
        const th = th1, A = pt(th, 0, R0 * rugo(th, 0)), B = pt(th, tBouche, R0 * rugo(th, tBouche)), C = pt(th, tBouche, Rin), D = pt(th, 0, Rin), n = [-Math.sin(th), 0, Math.cos(th)];
        tri(pos, A, B, C, n); tri(pos, A, C, D, n); tri(pos, A, C, B, [-n[0], 0, -n[2]]); tri(pos, A, D, C, [-n[0], 0, -n[2]]);
        cols.push('#6a5240', '#6a5240', '#6a5240', '#6a5240');
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    a.piece(g, '#5f4a3c', { couleurs: cols, nuance: 0.04 });
    // le dessus de la bouche (un linteau de bois), le sol de dedans (de la terre sombre et des feuilles)
    a.cylindre(Rin, Rin, 0.04, 16, '#2e2620', { x: CREUX.x, y: y + 0.0, z: CREUX.z, trait: false });
    // des fougères et de la mousse au pied ; une jeune pousse sur le haut cassé
    a.houppe(0.5, '#6a9a44', { x: CREUX.x + Math.cos(BOUCHE_CREUX + 2.4) * 1.2, y: y + 5.8, z: CREUX.z + Math.sin(BOUCHE_CREUX + 2.4) * 1.0, sy: 0.6, sorte: 'persistant' }, 0);
    // (on n'y entre pas : sa coque arrête, sa bouche aussi, à 1,25 m du milieu)
    monde.cercle(CREUX.x, CREUX.z, R0 + 0.27);
  }

  // ---------------------------------------------------------------- Le refuge de Shiratani (白谷小屋)
  // Une petite cabane de montagne au bord du sentier : le soubassement de pierre, les murs de planches, le toit de tôle, la porte,
  // une fenêtre ; la lanterne de la porte ; un banc devant ; le randonneur qui y passe la nuit (il fait venir le soir).
  {
    const a = atelier(), R = repere(HUTTE.x, HUTTE.z, -PI / 2), y = terrain(HUTTE.x, HUTTE.z), W = 5.0, D = 3.8, HW = 2.4;
    a.boite(W + 0.2, 0.6, D + 0.2, '#8f8a7e', R(0, y + 0.0, 0, { nuance: 0.08, teinte: (wx, wy) => (wy > y + 0.22 ? MOUSSE_F : '#8f8a7e') }));
    const F = y + 0.3;
    for (const u of [-1, 1]) a.boite(0.14, HW, D, '#8a6a4e', R(u * (W / 2 - 0.07), F + HW / 2, 0, { nuance: 0.04 }));
    a.boite(W - 0.28, HW, 0.14, '#8a6a4e', R(0, F + HW / 2, -D / 2 + 0.07, { nuance: 0.04 })).boite(W - 0.28, HW, 0.14, '#8a6a4e', R(0, F + HW / 2, D / 2 - 0.07, { nuance: 0.04 }));
    for (let k = 0; k < 9; k++) a.boite(W - 0.26, 0.02, 0.02, '#6a5240', R(0, F + 0.2 + k * 0.26, D / 2 + 0.005, { trait: false }));
    a.boite(0.9, 1.85, 0.04, '#5a4434', R(-1.0, F + 0.925, D / 2 + 0.01)).boite(0.04, 0.12, 0.04, '#c9ccce', R(-0.65, F + 1.0, D / 2 + 0.04, { trait: false }));
    a.boite(0.9, 0.6, 0.03, '#2b3640', R(1.1, F + 1.45, D / 2 + 0.005, { trait: false })).boite(1.0, 0.06, 0.08, '#5a4434', R(1.1, F + 1.12, D / 2 + 0.03));
    a.pignon(W + 0.7, 1.1, D + 0.9, '#6f7a80', R(0, F + HW, 0));
    for (const u of [-1, 1]) a.pignon(0.14, 1.06, D - 0.04, '#8a6a4e', R(u * (W / 2 - 0.07), F + HW, 0));
    a.boite(0.7, 0.24, 0.04, '#f4ead8', R(-1.0, F + 2.15, D / 2 + 0.03));
    ecrire({ ...R(-1.0, F, D / 2 + 0.055) }, { texte: '白谷小屋', x: 0, y: 2.15, z: 0, l: 0.62, h: 0.18, fond: null, encre: '#2a2420' });
    a.boite(0.16, 0.24, 0.16, '#fff2c8', R(0.0, F + 2.0, D / 2 + 0.14, { sorte: 'lumiere', trait: false })).boite(0.22, 0.04, 0.22, '#3a3a3a', R(0.0, F + 2.14, D / 2 + 0.14));
    lumieres.push({ ...R(0, F + 1.95, D / 2 + 0.6), halo: 0.35, sol: y, r: 3.6, c: '#ffe2a8' });
    // le banc de rondins devant
    {
      const q = R(0.6, 0, D / 2 + 1.2);
      a.cylindre(0.14, 0.14, 1.6, 8, RONDIN, { x: q.x, y: y + 0.42, z: q.z, rz: PI / 2, ry: R(0, 0, 0).ry, ordre: 'YXZ' });
      for (const u of [-0.6, 0.6]) { const p = R(0.6 + u, 0, D / 2 + 1.2); a.cylindre(0.12, 0.12, 0.3, 7, RONDIN_F, { x: p.x, y: y + 0.15, z: p.z }); }
      const p0 = R(-0.15, 0, D / 2 + 1.2), p1 = R(1.35, 0, D / 2 + 1.2);
      bancs.push({ de: [p0.x, p0.z], a: [p1.x, p1.z], y: y + 0.5, cap: R(0, 0, 0).ry });
      murRect(repere(q.x, q.z, R(0, 0, 0).ry), 0.82, 0.16);
    }
    monde.surface(HUTTE.x - D / 2 - 0.27, HUTTE.x + D / 2 + 0.27, HUTTE.z - W / 2 - 0.27, HUTTE.z + W / 2 + 0.27, F + HW + 1.2, { plein: true });
    murRect(R, W / 2, D / 2);
    monde.bloc(HUTTE.x - D / 2, HUTTE.x + D / 2, HUTTE.z - W / 2, HUTTE.z + W / 2, y - 1, F + HW + 1.1);
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Le col de Tsuji (辻峠) et le rocher Taiko-iwa (太鼓岩)
  // Au col, le poteau des directions ; les marches de pierre qui montent au rocher ; en haut, le dôme de granite nu, la corde basse
  // tout autour (on ne va pas au bord), et la vue sur les sommets de l'île.
  rangsDeMarches(ESC_TAIKO);
  {
    const a = atelier(), T = TAIKO;
    // le rocher : de gros blocs de granite autour du dôme du sol (ses flancs), de la mousse en bas
    for (let k = 0; k < 16; k++) {
      const t = (k / 16) * 2 * PI + 0.3, c = Math.cos(T.ry), s = Math.sin(T.ry), u = Math.cos(t) * (T.rx + 1.6), v = Math.sin(t) * (T.rz + 1.6);
      const x = T.x + u * c + v * s, z = T.z - u * s + v * c;
      if (surEsc(ESC_TAIKO, x, z, 1.4)) continue;
      const r = 1.6 + 0.8 * hasard(k, 9);
      rocher(a, x, terrain(x, z) - r * 0.6, z, r * 1.3, r, r * 1.2, k, { mousse: 0.25, finesse: 1 });
    }
    // (le haut des marches : des blocs de granite de chaque côté, entre la corde et l'ourlet de la forêt ; le 2026-10-31, rien de
    // visible ne les bordait là, à 1 m)
    {
      const Lm = longueur(ESC_TAIKO.pts);
      for (const [d, r, g] of [[1.05, 0.55, 1], [1.85, 0.5, 2], [2.7, 0.6, 3]]) for (const sg of [-1, 1]) {
        const [x, z, ym, tx, tz] = auPoint(ESC_TAIKO.pts, Lm - d), off = ESC_TAIKO.demi + 0.27 + r * 1.1, px = x + tz * sg * off, pz = z - tx * sg * off;
        // (son haut 50 cm au-dessus des marches, son pied enfoncé dans le flanc du rocher, plus bas qu'elles)
        const yt = terrain(px, pz), ys = Math.max(ym, yt);
        rocher(a, px, (ys + yt) / 2, pz, r * 1.1, (ys - yt) / 2 + 0.5, r, g * 7 + sg, { mousse: 0.2, finesse: 1 });
      }
    }
    // la corde basse sur ses piquets (トラロープ), tout autour du haut, ouverte au haut des marches
    const fin = ESC_TAIKO.pts[ESC_TAIKO.pts.length - 1], piquets = [];
    for (let k = 0; k <= 30; k++) {
      const t = (k / 30) * 2 * PI, c = Math.cos(T.ry), s = Math.sin(T.ry), u = Math.cos(t) * (T.rx + 0.3), v = Math.sin(t) * (T.rz + 0.3);
      const x = T.x + u * c + v * s, z = T.z - u * s + v * c;
      piquets.push(Math.hypot(x - fin[0], z - fin[1]) < 1.05 ? null : [x, z]);
    }
    for (let k = 0; k < piquets.length - 1; k++) {
      const p = piquets[k], q = piquets[k + 1];
      if (!p) continue;
      const yp = terrain(p[0], p[1]);
      a.cylindre(0.03, 0.03, 0.75, 5, '#c9a878', { x: p[0], y: yp + 0.3, z: p[1] });
      if (q) {
        const yq = terrain(q[0], q[1]);
        a.tube([[p[0], yp + 0.62, p[1]], [(p[0] + q[0]) / 2, (yp + yq) / 2 + 0.55, (p[1] + q[1]) / 2], [q[0], yq + 0.62, q[1]]], 0.014, '#e8c43a', { cotes: 4, pas: 4, trait: false });
        monde.mur(p[0], p[1], q[0], q[1], 0.3);
      }
    }
    // (aux deux bouts de l'ouverture, la corde rejoint le bord des marches : un piquet de plus de chaque côté)
    {
      const [x, z, , tx, tz] = auPoint(ESC_TAIKO.pts, longueur(ESC_TAIKO.pts) - 0.35);
      for (const sg of [-1, 1]) {
        const px = x + tz * sg * (ESC_TAIKO.demi + 0.27), pz = z - tx * sg * (ESC_TAIKO.demi + 0.27), yp = terrain(px, pz);
        let q = null;
        for (const c of piquets) if (c && (!q || Math.hypot(c[0] - px, c[1] - pz) < Math.hypot(q[0] - px, q[1] - pz))) q = c;
        const yq = terrain(q[0], q[1]);
        a.cylindre(0.03, 0.03, 0.75, 5, '#c9a878', { x: px, y: yp + 0.3, z: pz });
        a.tube([[px, yp + 0.62, pz], [(px + q[0]) / 2, (yp + yq) / 2 + 0.58, (pz + q[1]) / 2], [q[0], yq + 0.62, q[1]]], 0.014, '#e8c43a', { cotes: 4, pas: 4, trait: false });
        monde.mur(px, pz, q[0], q[1], 0.3);
      }
    }
    poser(a.fin(), 0, 0, { y: 0 });
  }
  {
    // le poteau des directions au col (道標) : trois flèches de bois
    const a = atelier(), x = TSUJI.x0 + 1.0, z = TSUJI.z1 - 0.8, y = TSUJI.y;
    a.boite(0.14, 2.2, 0.14, '#6a5240', { x, y: y + 1.1, z });
    for (const [k, ang, t] of [[0, -0.6, '太鼓岩'], [1, PI * 0.55, '白谷雲水峡'], [2, PI * 0.95, '縄文杉']]) {
      a.boite(0.9, 0.18, 0.04, '#d8c4a0', { x: x + Math.sin(ang) * 0.42, y: y + 1.85 - k * 0.24, z: z + Math.cos(ang) * 0.42, ry: ang + PI / 2 });
      ecrire({ x: x + Math.sin(ang) * 0.42 + Math.cos(ang) * 0.025, y, z: z + Math.cos(ang) * 0.42 - Math.sin(ang) * 0.025, ry: ang + PI / 2 }, { texte: t, x: 0, y: 1.85 - k * 0.24, z: 0, l: 0.78, h: 0.14, fond: null, encre: '#2a2420' });
    }
    monde.cercle(x, z, 0.36);
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- La voie du train forestier d'Anbō (安房森林軌道)
  // Ouverte en 1922 pour descendre le bois jusqu'au port d'Anbō, elle sert encore à l'entretien des sentiers. Les traverses de bois,
  // les deux rails (762 mm), les planches posées entre eux pour marcher ; son pont d'acier au-dessus du ravin, ses garde-corps ;
  // l'abri de Kosugidani (小杉谷), où vivait le village des bûcherons : son toit, ses bancs, les photos d'autrefois.
  {
    const a = atelier(), L = longueur(VOIE), RAIL = '#5a524a', TRAVERSE = '#6a5a48';
    for (let s = 0.3; s < L - 0.2; s += 0.6) {
      const [x, z, y, tx, tz] = auPoint(VOIE, s), ang = Math.atan2(tx, tz), pont = s > PONT_VOIE.s0 - 0.2 && s < PONT_VOIE.s1 + 0.2, ap = morceau(x, z);
      ap.boite(1.3, 0.1, 0.2, TRAVERSE, { x, y: y + 0.03, z, ry: ang, nuance: 0.06, trait: false, teinte: (wx, wy, wz) => (!pont && hasard(Math.floor(wx * 5), Math.floor(wz * 5)) > 0.85 ? MOUSSE_F : TRAVERSE) });
    }
    // (les rails et les planches : des boîtes de 2 m qui suivent la voie, posées sur les traverses)
    for (let s = 0; s < L - 0.01; s += 2.0) {
      const s1 = Math.min(L, s + 2.0), [x0, z0, y0] = auPoint(VOIE, s), [x1, z1, y1, tx, tz] = auPoint(VOIE, s1), l = Math.hypot(x1 - x0, z1 - z0), ang = Math.atan2(tx, tz);
      const xm = (x0 + x1) / 2, zm = (z0 + z1) / 2, ym = (y0 + y1) / 2, pente = Math.atan2(y1 - y0, l), ap = morceau(xm, zm);
      for (const sg of [-1, 1]) ap.boite(0.06, 0.09, l + 0.01, RAIL, { x: xm + tz * sg * 0.381, y: ym + 0.125, z: zm - tx * sg * 0.381, ry: ang, rx: -pente, ordre: 'YXZ', trait: false });
      ap.boite(0.66, 0.04, l - 0.02, '#8a7058', { x: xm, y: ym + PLANCHES - 0.02, z: zm, ry: ang, rx: -pente, ordre: 'YXZ', nuance: 0.05 });
    }
    // le pont : deux poutres d'acier, les culées de béton, les garde-corps de tubes
    {
      const [xa, za, ya, tx, tz] = auPoint(VOIE, PONT_VOIE.s0), [xb, zb, yb] = auPoint(VOIE, PONT_VOIE.s1), l = PONT_VOIE.s1 - PONT_VOIE.s0, ang = Math.atan2(tx, tz);
      const xm = (xa + xb) / 2, zm = (za + zb) / 2, ym = (ya + yb) / 2;
      for (const sg of [-1, 1]) a.boite(0.22, 0.5, l + 1.2, '#4a5a5a', { x: xm + tz * sg * 0.42, y: ym - 0.27, z: zm - tx * sg * 0.42, ry: ang, nuance: 0.03 });
      a.boite(1.6, 0.06, l + 1.8, '#7d644e', { x: xm, y: ym + 0.0, z: zm, ry: ang, nuance: 0.04, trait: false });
      // (le tablier du pont, de part et d'autre des planches : on y marche jusqu'aux garde-corps)
      monde.chemin([[xa - tx * 0.9, za - tz * 0.9, ya + 0.03], [xb + tx * 0.9, zb + tz * 0.9, yb + 0.03]], 0.78, { sol: 'bois', droits: true });
      for (const [x, z, y] of [[xa, za, ya], [xb, zb, yb]]) a.boite(2.4, 4.6, 1.6, BETON, { x, y: y - 2.4, z, ry: ang, nuance: 0.06, teinte: (wx, wy) => (wy > y - 0.9 ? '#b9b3a6' : MOUSSE_F) });
      for (const sg of [-1, 1]) {
        const pts = [];
        for (let s = PONT_VOIE.s0 - 1.3; s <= PONT_VOIE.s1 + 1.31; s += (l + 2.6) / 6) { const [x, z, y] = auPoint(VOIE, s); pts.push([x + tz * sg * 0.9, z - tx * sg * 0.9, y]); }
        for (const [x, z, y] of pts) a.cylindre(0.035, 0.035, 1.1, 6, '#8a9294', { x, y: y + 0.55, z });
        a.baton([pts[0][0], pts[0][2] + 1.05, pts[0][1]], [pts[pts.length - 1][0], pts[pts.length - 1][2] + 1.05, pts[pts.length - 1][1]], 0.03, '#8a9294', 6)
          .baton([pts[0][0], pts[0][2] + 0.55, pts[0][1]], [pts[pts.length - 1][0], pts[pts.length - 1][2] + 0.55, pts[pts.length - 1][1]], 0.025, '#8a9294', 6);
        monde.mur(pts[0][0], pts[0][1], pts[pts.length - 1][0], pts[pts.length - 1][1], 0.3);
      }
    }
    // le poteau de la voie (安房森林軌道), au carrefour du sentier du col
    poser(a.fin(), 0, 0, { y: 0 });
  }
  {
    // l'abri de Kosugidani : quatre poteaux, un toit de tôle à deux pans et ses poutres, deux bancs, le panneau des photos du village
    const a = atelier(), R = repere(RECOIN.x, RECOIN.z, PI / 4), y = RECOIN.y, H = 2.4;
    const P4 = [[-2.1, 0.7], [0.5, 0.7], [-2.1, 2.5], [0.5, 2.5]];
    for (const [lx, lz] of P4) { a.boite(0.16, H, 0.16, '#7a6248', R(lx, y + H / 2, lz)); const q = R(lx, 0, lz); monde.cercle(q.x, q.z, 0.35); }
    for (const lz of [0.7, 2.5]) a.boite(2.9, 0.16, 0.16, '#7a6248', R(-0.8, y + H - 0.06, lz));
    for (const lx of [-2.1, 0.5]) a.boite(0.16, 0.16, 2.0, '#7a6248', R(lx, y + H - 0.06, 1.6));
    a.toitJapon(3.8, 3.0, 0.75, 0.04, { ...R(-0.8, y + H + 0.02, 1.6), tuile: '#6f7a80', tuile2: '#7d888e', bord: '#4a3a2e', rangs: 10, releve: 0.03, murs: { l: 1.38, p: 0.98, y: 0, c: '#7a6248' } });
    // les bancs (face à la voie), le panneau des photos au fond
    for (const lx of [-1.6, -0.1]) {
      a.boite(1.2, 0.06, 0.4, P.bois, R(lx, y + 0.44, 1.7)).boite(1.2, 0.3, 0.05, P.bois, R(lx, y + 0.72, 1.9));
      for (const u of [-0.5, 0.5]) a.boite(0.06, 0.44, 0.38, '#5a4a3a', R(lx + u, y + 0.22, 1.7));
      const p0 = R(lx - 0.5, 0, 1.7), p1 = R(lx + 0.5, 0, 1.7);
      bancs.push({ de: [p0.x, p0.z], a: [p1.x, p1.z], y: y + 0.47, cap: R(0, 0, 0).ry + PI });
      murRect(repere(R(lx, 0, 1.75).x, R(lx, 0, 1.75).z, R(0, 0, 0).ry), 0.6, 0.24);
    }
    a.boite(2.4, 1.0, 0.06, '#5a4434', R(-0.8, y + 1.5, 2.45)).boite(2.2, 0.8, 0.02, '#e8e0cc', R(-0.8, y + 1.5, 2.41, { trait: false }));
    for (let k = 0; k < 4; k++) a.boite(0.42, 0.3, 0.01, ['#8a8478', '#6f6a60', '#9a9488', '#7a756a'][k], R(-1.55 + k * 0.5, y + 1.62, 2.395, { trait: false }));
    ecrire({ ...R(-0.8, y, 2.395), ry: R(0, 0, 0).ry + PI }, { texte: '小杉谷', x: 0, y: 1.27, z: 0, l: 0.6, h: 0.14, fond: null, encre: '#2a2420' });
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Le sentier d'Ōkabu (大株歩道) : ses escaliers de bois
  // De la fin de la voie à la souche de Wilson, puis jusqu'à la plateforme du Jōmon Sugi : des marches de bois (un rondin au nez,
  // des planches), une main courante de rondins de chaque côté.
  // (les mains courantes s'arrêtent là où l'escalier entre sur un palier, la voie ou la plateforme : sur eux, elles barraient le passage)
  for (const [E, s0, s1] of [[ESC_OKABU, 0.8, ESC_OKABU.L - 0.95], [ESC_JOMON, 0.55, ESC_JOMON.L - 1.3]]) {
    rangsDeMarches(E);
    for (const sg of [-1, 1]) {
      const pts = [], n = Math.max(1, Math.ceil((s1 - s0) / 1.7));
      for (let k = 0; k <= n; k++) { const [x, z, y, tx, tz] = auPoint(E.pts, s0 + ((s1 - s0) * k) / n); pts.push([x + tz * sg * (E.demi + 0.3), z - tx * sg * (E.demi + 0.3), y]); }
      rambarde(pts);
    }
  }

  // ---------------------------------------------------------------- La souche de Wilson (ウィルソン株)
  // La souche creuse d'un cèdre abattu au XVIe siècle (13,8 m de tour) : dehors, ses contreforts moussus, son bord du haut cassé ;
  // sa porte à l'ouest, vers le palier ; dedans, le sol plat, la source qui coule entre les pierres, le petit sanctuaire Tamashiro
  // (木魂神社), les pièces des visiteurs. Ses parois se resserrent en montant : de l'endroit où l'on se tient (COEUR), en levant les
  // yeux, le ciel y fait un cœur (son bord du haut, vu d'en dessous, a la forme d'un cœur). Trois jeunes cèdres nés de ses graines
  // poussent tout autour.
  // (le cœur : une courbe de cœur, les lobes vers le sud (+z) — vue d'en dessous, la caméra un peu penchée vers le nord, le haut de
  // l'image est au sud —, centrée au-dessus de COEUR, 1,25 m de large)
  const COEUR_PTS = (() => {
    const pts = [];
    for (let k = 0; k < 360; k++) {
      const t = (k / 360) * 2 * PI, hx = 16 * Math.sin(t) ** 3, hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      pts.push([COEUR.x + hx * 0.039, COEUR.z + (hy + 2.5) * 0.039]);
    }
    return pts;
  })();
  /** Le point du bord du cœur dans la direction th vue de son milieu (le cœur est en étoile depuis lui). */
  const bordCoeur = (th) => {
    let best = null, ecart = Infinity;
    for (const [x, z] of COEUR_PTS) { const d = Math.abs(Math.atan2(Math.sin(Math.atan2(z - COEUR.z, x - COEUR.x) - th), Math.cos(Math.atan2(z - COEUR.z, x - COEUR.x) - th))); if (d < ecart) { ecart = d; best = [x, z]; } }
    return best;
  };
  {
    const a = morceau(WILSON.x, WILSON.z), W = WILSON, y = W.y, NT = 64, NH = 10, pos = [], cols = [];
    const BOUCHE = PI, demiB = W.porte / W.rIn, H_PORTE = 1.75;
    // (le haut du bord dehors : de 3 à 4,1 m, cassé en dents ; plus bas au-dessus de la porte)
    const hautDe = (th) => W.haut * (0.92 + 0.12 * Math.sin(th * 2 + 0.7) + 0.06 * Math.sin(th * 5 + 1.3)) - 0.35 * Math.max(0, Math.cos(th - BOUCHE)) ** 3;
    const rugo = (th, t) => 1 + 0.07 * Math.sin(th * 9 + t * 4) + 0.045 * Math.sin(th * 19 - t * 8) + 0.16 * Math.max(0, Math.sin(th * 3 + 0.4)) * (1 - t) ** 2;
    const dehors = (th, t) => { const r = W.r * rugo(th, t) * (1 - 0.1 * t); return [W.x + Math.cos(th) * r, y - 0.5 + t * (hautDe(th) + 0.5), W.z + Math.sin(th) * r]; };
    // dedans (2026-10-31 : des parois qui se resserraient du sol jusqu'au cœur se tordaient en éclats sombres autour de lui) : une
    // paroi droite (un cylindre) jusqu'au plafond, à 2,75 m ; le plafond, plat, du cylindre jusqu'au bord du cœur (chaque point
    // pris sur la même demi-droite partie de COEUR : rien ne se croise) ; au-dessus, le trou en cœur monte droit jusqu'au haut, à
    // 3,45 m ; puis le bord cassé, du cœur au dehors
    const PLAFOND = 2.75, HAUT_COEUR = 3.45;
    const surCylindre = (th) => [W.x + Math.cos(th) * W.rIn, W.z + Math.sin(th) * W.rIn];
    const auCoeur = (th) => { const [cx, cz] = surCylindre(th); return bordCoeur(Math.atan2(cz - COEUR.z, cx - COEUR.x)); };
    const ouvert = (th) => ouvertureDe(th, BOUCHE, demiB);
    const quad = (A, B, C, D, n, c) => { tri(pos, A, B, C, n); tri(pos, A, C, D, n); cols.push(c, c); };
    for (let j = 0; j < NT; j++) {
      const th0 = (j / NT) * 2 * PI, th1 = ((j + 1) / NT) * 2 * PI, ouv = ouvert((th0 + th1) / 2), n = [Math.cos((th0 + th1) / 2), 0, Math.sin((th0 + th1) / 2)];
      // le dehors (sauf la porte, en bas)
      for (let i = 0; i < NH; i++) {
        const t0 = i / NH, t1 = (i + 1) / NH;
        if (ouv && t1 * (W.haut + 0.5) - 0.5 <= H_PORTE + 0.05) continue;
        const A = dehors(th0, t0), B = dehors(th1, t0), C = dehors(th1, t1), D = dehors(th0, t1);
        quad(A, B, C, D, n, ecorce((A[0] + C[0]) / 2, (A[1] + C[1]) / 2, (A[2] + C[2]) / 2, y, W.z, 0.3));
      }
      // la paroi de dedans, droite, du sol au plafond (sauf la porte), tournée vers le milieu
      const [c0x, c0z] = surCylindre(th0), [c1x, c1z] = surCylindre(th1), ni = [-n[0], 0, -n[2]];
      for (let i = 0; i < 4; i++) {
        const h0 = (PLAFOND * i) / 4, h1 = (PLAFOND * (i + 1)) / 4;
        if (ouv && h1 <= H_PORTE + 0.05) continue;
        const c = h0 < 0.3 ? '#4a3e34' : bruitDoux(c0x * 1.3, h0 + c0z, 1) > 0.6 ? '#6e5644' : '#5a4636';
        quad([c0x, y + h0, c0z], [c1x, y + h0, c1z], [c1x, y + h1, c1z], [c0x, y + h1, c0z], ni, c);
      }
      // le plafond (vu d'en dessous) : du cylindre au bord du cœur ; puis la paroi du trou en cœur, droite, jusqu'en haut
      const [h0x, h0z] = auCoeur(th0), [h1x, h1z] = auCoeur(th1);
      quad([c0x, y + PLAFOND, c0z], [c1x, y + PLAFOND, c1z], [h1x, y + PLAFOND, h1z], [h0x, y + PLAFOND, h0z], [0, -1, 0], '#4f3e30');
      const nc = [COEUR.x - (h0x + h1x) / 2, 0, COEUR.z - (h0z + h1z) / 2];
      quad([h0x, y + PLAFOND, h0z], [h1x, y + PLAFOND, h1z], [h1x, y + HAUT_COEUR, h1z], [h0x, y + HAUT_COEUR, h0z], nc, '#5a4636');
      // le bord cassé, du trou en cœur au dehors (la mousse dessus)
      const O0 = dehors(th0, 1), O1 = dehors(th1, 1);
      quad([h0x, y + HAUT_COEUR, h0z], [h1x, y + HAUT_COEUR, h1z], O1, O0, [0, 1, 0], bruitDoux(j * 0.4, 9, 1) > 0.45 ? MOUSSE_C : MOUSSE);
      // la porte : ses joues (du dehors au dedans) et le linteau au-dessus
      if (ouv !== ouvert(((j + 1.5) / NT) * 2 * PI)) {
        const tP = (H_PORTE + 0.5) / (W.haut + 0.5), A = dehors(th1, 0), B = dehors(th1, tP), C = [c1x, y + H_PORTE, c1z], D = [c1x, y - 0.05, c1z], nj = [-Math.sin(th1), 0, Math.cos(th1)];
        quad(A, B, C, D, nj, '#6a5240');
        quad(A, D, C, B, [-nj[0], 0, -nj[2]], '#6a5240');
      }
      if (ouv) {
        const tP = (H_PORTE + 0.5) / (W.haut + 0.5);
        quad(dehors(th0, tP), dehors(th1, tP), [c1x, y + H_PORTE, c1z], [c0x, y + H_PORTE, c0z], [0, -1, 0], '#5a4636');
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    a.piece(g, '#5a4636', { couleurs: cols, nuance: 0.04 });
    // dedans : le sol de terre et de feuilles, des pierres plates, la source qui coule de la paroi nord-est jusqu'à la porte
    a.cylindre(W.rIn - 0.02, W.rIn - 0.02, 0.03, 24, '#4a4034', { x: W.x, y: y + 0.0, z: W.z, trait: false });
    for (const [dx, dz, r] of [[0.6, -0.9, 0.22], [-0.2, -1.1, 0.18], [0.9, 0.4, 0.2], [-1.0, 0.8, 0.16]]) rocher(a, W.x + dx, y - 0.05, W.z + dz, r * 1.3, r * 0.5, r, dx, { mousse: 0.5, finesse: 0 });
    // le petit sanctuaire (木魂神社) au fond, à l'est : son socle de pierre, la petite maison de bois au toit pointu, les offrandes
    {
      const xs = W.x + 1.15, zs = W.z + 0.05, R = repere(xs, zs, -PI / 2);
      a.boite(0.62, 0.32, 0.5, '#8f8a7e', R(0, y + 0.16, 0)).boite(0.42, 0.4, 0.34, '#8a6a4e', R(0, y + 0.52, 0)).boite(0.3, 0.3, 0.02, '#c9a878', R(0, y + 0.52, 0.175, { trait: false }));
      a.pignon(0.56, 0.22, 0.5, '#6a5240', R(0, y + 0.72, 0));
      for (let k = 0; k < 6; k++) a.cylindre(0.012, 0.012, 0.004, 8, k % 2 ? '#c8a050' : '#a8a8a0', R(-0.18 + k * 0.07, y + 0.325, 0.2 + (k % 2) * 0.03, { trait: false }));
      a.cylindre(0.035, 0.03, 0.06, 8, '#f4efe2', R(0.2, y + 0.35, 0.18));
      monde.cercle(xs, zs, 0.52);
    }
    // la source : un filet d'eau dans un petit lit de pierres, de la paroi nord-est jusqu'à la porte
    ruban([[W.x + 0.9, W.z - 1.35, y + 0.025], [W.x + 0.2, W.z - 0.9, y + 0.022], [W.x - 0.8, W.z - 0.55, y + 0.02], [W.x - 1.8, W.z - 0.35, y + 0.015], [W.x - 3.0, W.z - 0.5, y - 0.02]], () => 0.12, { ecumeMin: 0.25 });
    // les trois jeunes cèdres nés de ses graines, tout autour
    // (pas au pied de l'escalier du Jōmon Sugi, au sud-ouest : le 2026-10-31, l'un d'eux le bouchait ; 15 à 17 m, de jeunes cèdres :
    // plus grands, vus d'en bas par le cœur, leur cime en bouchait un lobe)
    for (const [t, r, h] of [[0.5, 6.2, 16], [1.4, 6.4, 15], [4.2, 6.0, 17]]) {
      const x = W.x + Math.cos(t) * r, z = W.z + Math.sin(t) * r;
      cedre(a, x, z, h, terrain(x, z), { rb: 0.42 });
      monde.cercle(x, z, 0.42 * 1.55 + 0.27);
    }
    // ses murs : un cercle de dedans (la paroi, à 27 cm), sauf la porte ; dehors, la paroi arrête aussi (la porte est le seul passage)
    for (let j = 0; j < 48; j++) {
      const th0 = (j / 48) * 2 * PI, th1 = ((j + 1) / 48) * 2 * PI;
      if (ouvert((th0 + th1) / 2)) continue;
      const r = W.rIn + 0.05;
      monde.mur(W.x + Math.cos(th0) * r, W.z + Math.sin(th0) * r, W.x + Math.cos(th1) * r, W.z + Math.sin(th1) * r, 0.27);
      const ro = W.r * 1.05 + 0.27;
      monde.mur(W.x + Math.cos(th0) * ro, W.z + Math.sin(th0) * ro, W.x + Math.cos(th1) * ro, W.z + Math.sin(th1) * ro, 0.05);
    }
    // (les joues de la porte : des murs le long du passage)
    for (const sg of [-1, 1]) monde.mur(PORTE_WILSON.x0 + 0.2, W.z + sg * (W.porte + 0.27 - 0.02), W.x - W.rIn + 0.4, W.z + sg * (W.porte + 0.27 - 0.02), 0.27);
    // (la caméra : dedans, un toit bas qui la garde sous le bord ; dehors, un bloc autour)
    monde.toit(W.x - W.rIn, W.x + W.rIn, W.z - W.rIn, W.z + W.rIn, y + 2.6, y + 3.4);
  }

  {
    const Pw = PALIER_WILSON, y = Pw.y, xo = Pw.x0 - 0.3, xe = Pw.x1 + 0.25, zn = Pw.z0 - 0.3, zs = Pw.z1 + 0.3;
    rambarde([[xo, 66.9, y], [xo, zn, y], [xe, zn, y], [xe, 64.9, y]]);
    rambarde([[xe, 67.6, y], [xe, zs, y], [77.3, zs, y]]);
    rambarde([[75.2, zs, y], [xo, zs, y], [xo, 68.5, y]]);
  }

  // ---------------------------------------------------------------- La plateforme du Jōmon Sugi et l'arbre (縄文杉)
  // La plateforme de bois sur ses poteaux (1996 : on marchait sur ses racines), sa rambarde, deux bancs ; au sud, l'arbre : 25,3 m,
  // 16,4 m de tour, un pied énorme fait de bosses et de contreforts comme des arbres soudés, l'écorce rugueuse « comme les poteries
  // Jōmon », un haut cassé et de grosses branches, des plantes qui poussent dessus.
  {
    const a = atelier(), D = DECK, y = D.y;
    a.boite(D.x1 - D.x0, 0.12, D.z1 - D.z0, '#8a7058', { x: (D.x0 + D.x1) / 2, y: y - 0.06, z: (D.z0 + D.z1) / 2, nuance: 0.04 });
    for (let x = D.x0 + 0.15; x < D.x1; x += 0.3) a.boite(0.02, 0.012, D.z1 - D.z0 - 0.04, '#6a5440', { x, y: y + 0.002, z: (D.z0 + D.z1) / 2, trait: false });
    for (let x = D.x0 + 0.3; x < D.x1; x += 2.4) for (const z of [D.z0 + 0.3, D.z1 - 0.3]) { const sol = terrain(x, z); a.boite(0.16, y - sol + 0.3, 0.16, '#6a5440', { x, y: (y + sol - 0.3) / 2, z }); }
    // la rambarde : au sud (vers l'arbre), à l'est, à l'ouest, et au nord sauf l'arrivée de l'escalier
    rambarde([[D.x0 + 2.2, D.z0 - 0.05, y], [D.x1 + 0.05, D.z0 - 0.05, y], [D.x1 + 0.05, D.z1 + 0.05, y], [D.x0 - 0.05, D.z1 + 0.05, y], [D.x0 - 0.05, D.z0 + 1.3, y]]);
    // deux bancs le long du nord, face à l'arbre
    for (const x of [91.0, 94.2]) {
      a.boite(1.6, 0.06, 0.42, P.bois, { x, y: y + 0.44, z: D.z0 + 0.55 }).boite(1.6, 0.3, 0.05, P.bois, { x, y: y + 0.72, z: D.z0 + 0.34 });
      for (const u of [-1, 1]) a.boite(0.06, 0.44, 0.4, '#5a4a3a', { x: x + u * 0.7, y: y + 0.22, z: D.z0 + 0.55 });
      bancs.push({ de: [x - 0.7, D.z0 + 0.55], a: [x + 0.7, D.z0 + 0.55], y: y + 0.47, cap: 0 });
      murRect(repere(x, D.z0 + 0.5, 0), 0.8, 0.24);
    }
    poser(a.fin(), 0, 0, { y: 0 });
  }
  {
    const a = morceau(JOMON.x, JOMON.z), J = JOMON, y = terrain(J.x, J.z);
    const t = yakusugi(a, J.x, J.z, y, { r: J.r, fut: 13.5, h: 25.3, lobes: 8, rugueux: 2.4, branches: 7, affine: 0.5, graine: 0.618, cotes: 40, anneaux: 20, grossesBranches: 1.45, cime: 1.55, mousse: -1.2 });
    // des bosses sur le tronc (des loupes), comme des troncs soudés ; des plantes accrochées dans la fourche
    for (let k = 0; k < 22; k++) {
      const th = hasard(k, 1) * 2 * PI, hh = 1.0 + hasard(k, 2) * 11, r = J.r * (1 - 0.5 * (hh / 13.5)) * 0.98, rb = 0.35 + 0.45 * hasard(k, 3) * (1 - hh / 18);
      a.ovale(rb, ECORCES[k % ECORCES.length], { x: J.x + Math.cos(th) * r, y: y + hh, z: J.z + Math.sin(th) * r, sx: 0.8, sy: 1.3, sz: 0.8, teinte: (wx, wy, wz) => ecorce(wx, wy, wz, y, J.z) }, 8);
    }
    for (let k = 0; k < 5; k++) { const th = (k / 5) * 2 * PI + 0.3; a.houppe(0.7, '#6a9a44', { x: t.haut[0] + Math.cos(th) * t.r * 0.8, y: t.haut[1] + 0.2, z: t.haut[2] + Math.sin(th) * t.r * 0.8, sy: 0.55, sorte: 'persistant' }, 0); }
    // ses racines qui sortent de terre, vers la plateforme
    for (let k = 0; k < 9; k++) {
      const th = (k / 9) * 2 * PI + 0.2, r0 = J.r * 0.9, r1 = J.r + 1.6 + hasard(k, 7) * 1.4;
      a.tube([[J.x + Math.cos(th) * r0, y + 0.8, J.z + Math.sin(th) * r0], [J.x + Math.cos(th + 0.1) * (r0 + r1) / 2, y + 0.15, J.z + Math.sin(th + 0.1) * (r0 + r1) / 2], [J.x + Math.cos(th + 0.15) * r1, terrain(J.x + Math.cos(th + 0.15) * r1, J.z + Math.sin(th + 0.15) * r1) - 0.15, J.z + Math.sin(th + 0.15) * r1]], 0.22, MOUSSE_F, { cotes: 6, pas: 8 });
    }
  }

  // ---------------------------------------------------------------- La forêt
  // (la distance de chaque case de 1 m au plus proche endroit où l'on marche : une carte faite une fois, par deux passes)
  const F0 = ETENDUE.fin, DNX = F0.x1 - F0.x0, DNZ = F0.z1 - F0.z0, DIST = new Float32Array(DNX * DNZ);
  {
    for (let j = 0; j < DNZ; j++) for (let i = 0; i < DNX; i++) DIST[j * DNX + i] = dansLeCadre(F0.x0 + i + 0.5, F0.z0 + j + 0.5) ? 0 : 1e9;
    const R2 = Math.SQRT2;
    for (let j = 0; j < DNZ; j++) for (let i = 0; i < DNX; i++) {
      const k = j * DNX + i;
      if (i > 0) DIST[k] = Math.min(DIST[k], DIST[k - 1] + 1);
      if (j > 0) { DIST[k] = Math.min(DIST[k], DIST[k - DNX] + 1); if (i > 0) DIST[k] = Math.min(DIST[k], DIST[k - DNX - 1] + R2); if (i < DNX - 1) DIST[k] = Math.min(DIST[k], DIST[k - DNX + 1] + R2); }
    }
    for (let j = DNZ - 1; j >= 0; j--) for (let i = DNX - 1; i >= 0; i--) {
      const k = j * DNX + i;
      if (i < DNX - 1) DIST[k] = Math.min(DIST[k], DIST[k + 1] + 1);
      if (j < DNZ - 1) { DIST[k] = Math.min(DIST[k], DIST[k + DNX] + 1); if (i < DNX - 1) DIST[k] = Math.min(DIST[k], DIST[k + DNX + 1] + R2); if (i > 0) DIST[k] = Math.min(DIST[k], DIST[k + DNX - 1] + R2); }
    }
  }
  /** La distance (au mètre près) au plus proche endroit où l'on marche ; loin de l'étendue fine, beaucoup. */
  const versCadre = (x, z) => {
    const i = Math.floor(x - F0.x0), j = Math.floor(z - F0.z0);
    if (i < 0 || j < 0 || i >= DNX || j >= DNZ) return 99;
    return DIST[j * DNX + i];
  };
  // ce qui est déjà là (on n'y plante pas) : les cercles du monde (troncs, rochers, poteaux), les bâtiments, les eaux
  const occupe = (x, z, m) => {
    if (monde.cercles.some(([cx, cz, r]) => Math.abs(cx - x) < r + m && Math.abs(cz - z) < r + m && Math.hypot(cx - x, cz - z) < r + m)) return true;
    if (Math.hypot(x - WILSON.x, z - WILSON.z) < WILSON.r + 6 + m || Math.hypot(x - JOMON.x, z - JOMON.z) < JOMON.r + 4 + m || Math.hypot(x - CREUX.x, z - CREUX.z) < CREUX.r + 0.8 + m) return true;
    if (versRect({ x0: HUTTE.x - 2.2, x1: HUTTE.x + 2.2, z0: HUTTE.z - 2.8, z1: HUTTE.z + 2.8 }, x, z) < m + 0.5 || versRect(DECK, x, z) < m + 1.5) return true;
    if (aLaPlace(TAIKO, x, z) < m + 2.5 || versRect({ x0: ACCUEIL.x - 2.6, x1: ACCUEIL.x + 2.6, z0: ACCUEIL.z - 4, z1: ACCUEIL.z + 4 }, x, z) < m) return true;
    if (dansRect(B_RIVIERE, x, z) && surLaLigne(RIVIERE, x, z).d < 2.4 + m + (surLaLigne(RIVIERE, x, z).s > S_CASCADE[0] - 3 && surLaLigne(RIVIERE, x, z).s < S_CASCADE[1] + 4 ? 3 : 0)) return true;
    if (dansRect(B_RUISSEAU, x, z) && surLaLigne(RUISSEAU, x, z).d < 1.1 + m) return true;
    if (dansRect(B_RAVIN, x, z) && surLaLigne(RAVIN, x, z).d < 1.0 + m) return true;
    return false;
  };
  /**
   * Un cèdre de la forêt (sugi), dans l'atelier a : un tronc droit qui monte jusqu'en haut, son pied évasé, des étages de branches
   * aux bords dentelés (ceux des Trente Bouddhas). o : loin (moins fin, sans trait), pres (deux branches mortes sur le tronc),
   * vert, rb (le rayon du tronc), mousse (le pied moussu).
   */
  function cedre(a, x, z, h, y = terrain(x, z), o = {}) {
    const rb = o.rb ?? 0.15 + h * 0.0055, rot = hasard(x, z) * 6.28;
    a.fut([x, y - 0.45, z], [x, y + h * 0.97, z], rb, rb * 0.2, '#5c4130', o.loin ? 5 : 6, o.loin ? { trait: false } : { teinte: (wx, wy) => (wy < y + 0.9 ? MOUSSE_F : '#5c4130') });
    if (!o.loin) a.fut([x, y - 0.5, z], [x, y + 0.35, z], rb * 1.55, rb * 1.02, MOUSSE_F, 6);
    if (o.pres) for (let k = 0; k < 2; k++) {
      const yb = y + h * (0.24 + 0.14 * k + 0.05 * hasard(x, k)), t = rot + k * 2.3, L = 0.35 + 0.3 * hasard(z, k);
      a.fut([x, yb, z], [x + Math.sin(t) * L, yb - 0.1, z + Math.cos(t) * L], 0.035, 0.012, '#4a3a2e', 4, { trait: false });
    }
    const n = o.loin ? 3 : 4, m = o.loin ? 5 : 7, pos = [], couleurs = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), r = h * (0.13 - 0.085 * t), hh = h * (0.2 - 0.06 * t), yb = h * (0.56 + 0.36 * t), c = i % 2 ? o.vert ?? '#3f5f3a' : '#36533a';
      const ap = [0, yb + hh, 0], fond2 = [0, yb + 0.2 * hh, 0], bord = [];
      for (let k = 0; k < 2 * m; k++) {
        const ang = rot + i * 1.7 + (k / (2 * m)) * 6.2832, pointe = k % 2 === 0, rr = r * (pointe ? 1 : 0.68) * (0.9 + 0.2 * hasard(x + k, z + i));
        bord.push([Math.sin(ang) * rr, yb + (pointe ? -0.07 * hh : 0.08 * hh), Math.cos(ang) * rr]);
      }
      for (let k = 0; k < 2 * m; k++) { const A = bord[k], B = bord[(k + 1) % (2 * m)]; pos.push(...ap, ...A, ...B, ...fond2, ...B, ...A); couleurs.push(c, c); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    a.piece(geo, '#3f5f3a', { x, y, z, couleurs, sorte: 'conifere', volume: [x, y + h * 0.78, z, h * 0.22], trait: !o.loin });
    return a;
  }
  // les feuillus de la forêt : les verts sombres des chênes et des châtaigniers toujours verts (スダジイ, タブノキ), et la
  // himeshara (ヒメシャラ) au tronc lisse et orange
  const VERTS_FEUILLUS = [['#3f6a34', '#4a7a3a', '#365c2e', '#46743a'], ['#476f38', '#3a6230', '#52803e'], ['#5a8a44', '#6a9a4c', '#4f7d3c']];
  {
    const PAS_F = 3.2;
    for (let gz = -14; gz <= 124; gz += PAS_F) {
      for (let gx = -64; gx <= 104; gx += PAS_F) {
        const x = gx + (hasard(gx * 0.37, gz * 0.53) - 0.5) * 2.4, z = gz + (hasard(gz * 0.41, gx * 0.29) - 0.5) * 2.4, dc = versCadre(x, z);
        if (dc < 3.4 || occupe(x, z, 0.6)) continue;
        const y = terrain(x, z);
        if (y < 1.6 || (z < 6 && x > -24 && x < 26)) continue;
        const loin = dc > 16, u = hasard(x * 1.7, z * 0.9), a = morceau(x, z, loin ? 100 : 25);
        if (dc > 34 && hasard(x * 3, z) < 0.3) continue;
        // (en bas, plus de feuillus ; plus haut, surtout des cèdres)
        const cedres = 0.35 + 0.4 * lisse(10, 70, z);
        if (u < cedres) cedre(a, x, z, 18 + 10 * hasard(z * 1.7, x), y, { loin, pres: dc < 7 });
        else if (u < cedres + 0.12 && z > 30) a.arbreTouffu(x, z, 9 + 4 * hasard(x, z), VERTS_FEUILLUS[2], { y, bas: y - 0.4, sorte: 'feuillu', loin, tronc: '#b8643a', rTronc: 0.16, large: 0.8, graine: hasard(z, x) });
        else a.arbreTouffu(x, z, 10 + 6 * hasard(x, z), VERTS_FEUILLUS[Math.floor(hasard(z, x * 3) * 2)], { y, bas: y - 0.4, sorte: 'persistant', loin, tronc: '#6a5a48', large: 1.1, graine: hasard(x, z * 3) });
      }
    }
    // au loin : la forêt des montagnes (des cônes de cèdres et des boules de feuillus, sans trait, par morceaux de 200 m)
    const lots = new Map();
    for (let k = 0; k < 3200; k++) {
      const ang = hasard(k, 0.31) * 2 * PI, d = 110 + 330 * Math.sqrt(hasard(0.77, k)), x = 20 + Math.cos(ang) * d, z = 40 + Math.sin(ang) * d, y = terrain(x, z);
      if (y < 2.5 || (x > -64 && x < 104 && z > -64 && z < 124)) continue;
      const h = 14 + 10 * hasard(k, 3), c = k % 3 ? '#3a5638' : '#33503a', cle = `${Math.floor(x / 200)},${Math.floor(z / 200)}`;
      if (!lots.has(cle)) lots.set(cle, { pos: [], cols: [], x, z });
      const q = lots.get(cle), tourne = k * 1.7;
      const etage = (y0, y1, r, n, cc) => {
        const haut = [x, y1, z], rr = (s) => r * (s % 2 ? 0.78 : 1);
        for (let s = 0; s < n; s++) {
          const a0 = (s / n) * 2 * PI + tourne, a1 = ((s + 1) / n) * 2 * PI + tourne;
          tri(q.pos, haut, [x + Math.cos(a0) * rr(s), y0, z + Math.sin(a0) * rr(s)], [x + Math.cos(a1) * rr(s + 1), y0, z + Math.sin(a1) * rr(s + 1)], [Math.cos(a0 + PI / n), 0.4, Math.sin(a0 + PI / n)]);
          q.cols.push(cc);
        }
      };
      if (k % 4 === 3) { etage(y - 1, y + h * 0.75, h * 0.32, 6, '#45683a'); etage(y + h * 0.3, y + h * 0.95, h * 0.24, 5, '#3f6034'); }
      else { etage(y + h * 0.2, y + h * 0.72, h * 0.19, 6, c); etage(y + h * 0.5, y + h, h * 0.13, 5, k % 3 ? '#3f5c3c' : '#36533a'); }
    }
    for (const { pos, cols, x, z } of lots.values()) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      morceau(x, z, 200).piece(g, '#3a5638', { couleurs: cols, sorte: 'conifere', trait: false });
    }
  }
  // l'ourlet de la forêt : là où l'on ne peut plus avancer (les sentiers, la route, les clairières), des fougères, du bambou nain,
  // de jeunes cèdres, des rochers moussus ; le bord se voit : ce n'est pas un mur invisible (comme aux Trente Bouddhas)
  {
    const lots = new Map();
    const VERTS = ['#41692f', '#4b7636', '#466b33', '#3d622b'];
    const feuille = (de, dir, L, W, leve, tombe, c) => {
      const [dx, dz] = dir, mid = [de[0] + dx * L * 0.45, de[1] + leve, de[2] + dz * L * 0.45], bout = [de[0] + dx * L, de[1] + tombe, de[2] + dz * L];
      const g = [mid[0] - (dz * W) / 2, mid[1], mid[2] + (dx * W) / 2], d = [mid[0] + (dz * W) / 2, mid[1], mid[2] - (dx * W) / 2];
      const a = morceau(de[0], de[2]);
      if (!lots.has(a)) lots.set(a, { feuilles: [], teintes: [] });
      const l = lots.get(a);
      l.feuilles.push(de, g, bout, de, bout, d, de, bout, g, de, d, bout);
      l.teintes.push(c, c, c, c);
    };
    const sasa = (x, z, R, H) => {
      const y = terrain(x, z), graine = hasard(x * 0.3, z * 0.9);
      morceau(x, z).boule(R * 0.7, '#3b5e2c', { x, y: y + H * 0.12, z, sy: (H * 0.5) / R, sorte: 'conifere', graine }, 1);
      const n = 9 + Math.floor(hasard(x, z) * 4);
      for (let k = 0; k < n; k++) {
        const a0 = (k / n) * 2 * PI + hasard(x + k * 1.3, z - k) * 0.6, rb = R * (0.55 + 0.35 * hasard(z + k * 1.7, x));
        const top = [x + Math.cos(a0) * rb, y + H * (0.5 + 0.42 * hasard(x + k, z)), z + Math.sin(a0) * rb], nf = 3 + (k % 2);
        for (let f = 0; f < nf; f++) {
          const af = a0 + (f - (nf - 1) / 2) * 0.85 + (hasard(k, f + x) - 0.5) * 0.5;
          feuille(top, [Math.cos(af), Math.sin(af)], 0.26 + 0.12 * hasard(f, k + z), 0.075, 0.05 + 0.04 * hasard(z, f + k), -0.08 - 0.1 * hasard(f + z, k), VERTS[Math.floor(hasard(k * 3.1, f + x) * VERTS.length)]);
        }
      }
    };
    const fougere = (x, z, R) => {
      const y = terrain(x, z), n = 6 + Math.floor(hasard(z, x) * 3);
      for (let k = 0; k < n; k++) {
        const a0 = (k / n) * 2 * PI + hasard(x, k) * 0.5, dx = Math.cos(a0), dz = Math.sin(a0);
        const de = [x + dx * 0.05, y + 0.02, z + dz * 0.05], mi = [x + dx * R * 0.5, y + R * 0.55, z + dz * R * 0.5];
        feuille(de, [dx, dz], R * 0.6, 0.16 * R, R * 0.42, R * 0.5, '#4f8a3a');
        feuille(mi, [dx, dz], R * 0.6, 0.14 * R, 0.04, -R * 0.3, '#5a9444');
      }
    };
    const X0 = F0.x0, Z0 = -18;
    for (let j = 0; j < F0.z1 - Z0; j++) {
      for (let i = 0; i < DNX; i++) {
        const gx = X0 + i, gz = Z0 + j, dl = versCadre(gx + 0.5, gz + 0.5);
        if (dl < 0.5 || dl > 3.2) continue;
        const x = gx + 0.5 + (hasard(gx * 1.37, gz * 0.73) - 0.5) * 0.8, z = gz + 0.5 + (hasard(gz * 1.19, gx * 0.91) - 0.5) * 0.8;
        if (versCadre(x, z) < 0.45) continue;
        // (ni au bord des maisons, de l'entrée, du sanctuaire et du quai ; ni dans l'eau ; ni sur les rochers, troncs et poteaux)
        if (z < -14 || dansRect(ENTREE, x, z, 0.9)) continue;
        if (occupe(x, z, 0.25) || versRect(DECK, x, z) < 1.2 || aLaPlace(TAIKO, x, z) < 1.0) continue;
        if (terrain(x, z) < 1.8) continue;
        const t = hasard(x * 0.37, z * 0.53), u = hasard(z * 0.41, x * 0.29);
        // (le premier rang toujours planté : un trou dans l'ourlet, c'était un mur invisible)
        if (dl < 1.6) {
          if (t < 0.32) sasa(x, z, 0.5 + 0.22 * u, 0.65 + 0.25 * hasard(x, z));
          else fougere(x, z, 0.62 + 0.32 * u);
        } else if (dl < 2.4) {
          if (t < 0.3) sasa(x, z, 0.42 + 0.22 * u, 0.6 + 0.25 * hasard(x, z));
          else if (t < 0.85) fougere(x, z, 0.55 + 0.3 * u);
          else if (t < 0.93) rocher(morceau(x, z), x, terrain(x, z) - 0.15, z, 0.35 + 0.3 * u, 0.3 + 0.2 * u, 0.4 + 0.2 * u, t, { mousse: 0.9, finesse: 0 });
        } else if (t < 0.25) cedre(morceau(x, z), x, z, 1.8 + 2 * u, terrain(x, z), { rb: 0.06 });
        else if (t < 0.6) fougere(x, z, 0.6 + 0.25 * u);
        else if (t < 0.72) sasa(x, z, 0.45 + 0.25 * u, 0.65 + 0.25 * hasard(x, z));
      }
    }
    for (const [a, { feuilles, teintes }] of lots) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(feuilles.flat(), 3));
      a.piece(g, '#5c9140', { couleurs: teintes, trait: false, nuance: 0.06, sorte: 'conifere' });
    }
  }
  // des rochers moussus et des troncs tombés dans le sous-bois, loin des sentiers (on les voit entre les arbres)
  {
    for (let k = 0; k < 140; k++) {
      const x = -60 + hasard(k, 1.3) * 160, z = 30 + hasard(1.7, k) * 92, dc = versCadre(x, z);
      if (dc < 3.5 || dc > 22 || occupe(x, z, 0.8)) continue;
      const r = 0.5 + 1.1 * hasard(k, 3), a = morceau(x, z, dc > 16 ? 100 : 25);
      if (k % 3) rocher(a, x, terrain(x, z) - r * 0.35, z, r * 1.2, r * 0.75, r, k, { mousse: 0.9, finesse: dc > 12 ? 0 : 1, trait: dc < 16 });
      else {
        const t = hasard(k, 7) * PI, L = 3 + 4 * hasard(k, 8), x1 = x + Math.cos(t) * L, z1 = z + Math.sin(t) * L;
        if (occupe(x1, z1, 0.5) || versCadre(x1, z1) < 2.5) continue;
        const y0 = terrain(x, z), y1 = terrain(x1, z1), rr = 0.25 + 0.2 * hasard(k, 9);
        a.tube([[x, y0 + rr * 0.5, z], [(x + x1) / 2, (y0 + y1) / 2 + rr * 0.6, (z + z1) / 2], [x1, y1 + rr * 0.45, z1]], rr, MOUSSE_F, { cotes: 6, pas: 6, trait: dc < 16, teinte: (wx, wy) => (wy > (y0 + y1) / 2 + rr * 0.8 ? MOUSSE_C : MOUSSE_F) });
      }
    }
  }
  // au village et au port : des camphriers, des palmiers (Livistona) près de la mer, des haies dans les jardins derrière les maisons
  {
    const a = atelier();
    for (const [x, z, h] of [[-50.6, -44, 11], [-52.0, -36, 13], [-44.0, -36.0, 10], [-10.6, -44.0, 10], [-10.0, -30.0, 12], [-44.0, -24.0, 11], [-8.4, -20.0, 11]]) {
      if (occupe(x, z, 0.5)) continue;
      a.arbreTouffu(x, z, h, VERTS_FEUILLUS[0], { y: terrain(x, z), bas: terrain(x, z) - 0.4, sorte: 'persistant', tronc: '#6a5a48', large: 1.2 });
    }
    for (const [x, z, h] of [[-50.0, -50.4, 8.5], [16.2, -50.0, 9.5], [-20.6, -49.4, 7.5]]) {
      const y = terrain(x, z);
      a.tronc([[x, y - 0.3, z], [x + 0.2, y + h * 0.5, z + 0.1], [x + 0.35, y + h, z + 0.15]], [0.2, 0.17, 0.14], '#8a7a62', 7);
      for (let k = 0; k < 12; k++) {
        const t = (k / 12) * 2 * PI, top = [x + 0.35, y + h, z + 0.15];
        a.piece(new THREE.CircleGeometry(1.1, 9, -0.5, 1.0), '#4f8a3a', { x: top[0] + Math.cos(t) * 0.9, y: top[1] + 0.1, z: top[2] + Math.sin(t) * 0.9, rx: -PI / 2 + 0.5, ry: -t + PI / 2, ordre: 'YXZ', sorte: 'persistant', trait: false });
      }
      monde.cercle(x, z, 0.47);
    }
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Les champignons (le secret : シイノトモシビタケ)
  // De petits champignons pâles sur le bois mort, le long du petit sentier caché et au bord de la forêt de mousse : le jour, on les
  // voit à peine (beiges, quelques centimètres) ; la nuit, ils brillent d'un vert doux et font un chemin jusqu'au vieux cèdre creux ;
  // dans le creux, un cercle de champignons autour du koban.
  const TOUFFES_CHAMPI = [];
  {
    const a = atelier(), CAP = '#e4ecc8', LAMES = '#cfd8b0', PIED = '#eef0e0';
    const touffe = (x, z, y, n, s = 1, graine = 0) => {
      for (let k = 0; k < n; k++) {
        const t = hasard(graine, k) * 2 * PI, d = 0.04 + 0.1 * hasard(k, graine + 1), xx = x + Math.cos(t) * d, zz = z + Math.sin(t) * d, h = (0.04 + 0.05 * hasard(k + 3, graine)) * s, r = (0.03 + 0.03 * hasard(graine + 5, k)) * s;
        a.cylindre(r * 0.22, r * 0.28, h, 5, PIED, { x: xx, y: y + h / 2, z: zz, trait: false })
          .piece(new THREE.SphereGeometry(r, 8, 3, 0, 2 * PI, 0, PI / 2), CAP, { x: xx, y: y + h, z: zz, sy: 0.55, sorte: 'lumiere', trait: false })
          .cylindre(r * 0.98, r * 0.98, 0.004, 8, LAMES, { x: xx, y: y + h - 0.002, z: zz, trait: false, sorte: 'lumiere' });
      }
      TOUFFES_CHAMPI.push([x, y + 0.06 * s, z, n * s]);
    };
    // le long du sentier caché (de ses bords, sur des racines et des bouts de bois), de la clairière jusqu'au cèdre creux
    const L = longueur(SENTIER_SECRET);
    for (let k = 0; k < 7; k++) {
      const s = 0.8 + (k * (L - 1.6)) / 6, [x, z, y, tx, tz] = auPoint(SENTIER_SECRET, s), sg = k % 2 ? 1 : -1, d = 1.15 + 0.2 * hasard(k, 2), px = x + tz * sg * d, pz = z - tx * sg * d;
      if (surLaLigne(RUISSEAU, px, pz).d < 0.9) continue;
      const yb = terrain(px, pz);
      // (un bout de bois mort sous eux, moussu)
      a.cylindre(0.09, 0.1, 0.7, 7, '#6a5440', { x: px, y: yb + 0.06, z: pz, ry: Math.atan2(tx, tz) + 0.4, rz: PI / 2, ordre: 'YXZ', teinte: (wx, wy) => (wy > yb + 0.12 ? MOUSSE : '#6a5440') });
      touffe(px, pz, yb + 0.14, 5, 1.25, k * 7.1);
    }
    // au bord de la clairière, sur le tronc tombé (le premier qu'on voit, la nuit, de la clairière)
    touffe(-1.6, 86.6, terrain(-1.6, 86.6) + 0.88, 6, 1.3, 3.3);
    touffe(0.2, 87.1, terrain(0.2, 87.1) + 0.86, 4, 1.2, 4.4);
    // et quelques autres dans la forêt de mousse, pour le décor (sur les racines, au pied des rochers)
    for (const [x, z, g] of [[14.4, 83.8, 1.1], [17.3, 90.6, 2.2], [3.0, 93.2, 5.5], [-12.4, 79.2, 6.6], [24.2, 98.6, 7.7]]) touffe(x, z, terrain(x, z) + 0.02, 4, 1.1, g);
    // dans le creux du vieux cèdre : un cercle de champignons sur le bois du fond
    for (let k = 0; k < 8; k++) {
      const t = BOUCHE_CREUX + PI + (k - 3.5) * 0.36, x = CREUX.x + Math.cos(t) * 0.58, z = CREUX.z + Math.sin(t) * 0.58;
      touffe(x, z, terrain(CREUX.x, CREUX.z) + 0.04, 3, 1.15, 10 + k);
    }
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- L'arbre du singe, au bord de la forêt de mousse (le tampon)
  // Un vieil arbre feuillu à l'est de la clairière : une branche basse tendue vers elle, où un singe s'assoit ; dessous, un cerf
  // mange ce qu'il fait tomber (à Yakushima, les cerfs suivent les singes pour les feuilles et les fruits qui tombent).
  const ARBRE_SINGE = { x: 21.0, z: 85.2 }, BRANCHE = { x: 19.2, z: 85.6, y: KOKE.y + 2.7 }, CERF = { x: 19.4, z: 87.6 }, OBS = { x: 15.2, z: 86.6 };
  {
    const a = morceau(ARBRE_SINGE.x, ARBRE_SINGE.z), y = terrain(ARBRE_SINGE.x, ARBRE_SINGE.z);
    a.tronc([[ARBRE_SINGE.x, y - 0.4, ARBRE_SINGE.z], [ARBRE_SINGE.x - 0.2, y + 3.0, ARBRE_SINGE.z + 0.1], [ARBRE_SINGE.x + 0.3, y + 7.5, ARBRE_SINGE.z - 0.2]], [0.42, 0.32, 0.18], '#5f5244', 8, { teinte: (wx, wy) => (wy < y + 1.6 ? MOUSSE : '#5f5244') });
    a.tronc([[ARBRE_SINGE.x - 0.25, y + 2.4, ARBRE_SINGE.z + 0.1], [BRANCHE.x + 0.8, BRANCHE.y - 0.1, BRANCHE.z + 0.1], [BRANCHE.x - 0.3, BRANCHE.y + 0.05, BRANCHE.z]], [0.17, 0.12, 0.07], '#5f5244', 7, { teinte: (wx, wy) => (hasard(Math.floor(wx * 3), Math.floor(wy * 3)) > 0.6 ? MOUSSE_F : '#5f5244') });
    for (let k = 0; k < 7; k++) { const t = (k / 7) * 2 * PI; a.houppe(1.9 + 0.5 * hasard(k, 2), VERTS_FEUILLUS[0][k % 4], { x: ARBRE_SINGE.x + 0.2 + Math.cos(t) * 2.0, y: y + 6.8 + hasard(k, 1) * 1.2, z: ARBRE_SINGE.z + Math.sin(t) * 2.0, sy: 0.75, sorte: 'persistant' }); }
    a.houppe(1.0, VERTS_FEUILLUS[0][1], { x: BRANCHE.x - 0.1, y: BRANCHE.y + 0.75, z: BRANCHE.z + 0.4, sy: 0.7, sorte: 'persistant' });
    monde.cercle(ARBRE_SINGE.x, ARBRE_SINGE.z, 0.7);
  }

  // ---------------------------------------------------------------- Les singes de Yakushima (ヤクシマザル)
  // Plus petits et plus foncés que ceux du continent, au poil épais. Une famille assise au bord de la route, près du garde-fou
  // (comme dans la vidéo), un sur un rocher de la forêt de mousse, celui de la branche, une mère et son petit sur le dos le long de
  // la voie du train. Ils s'écartent quand on vient trop près, et reviennent ; on les entend (« kuu ») ; la nuit, ils dorment.
  const singes = (() => {
    const F = formesSinge(ctx.perso || ctx);
    const liste = [];
    const route = (s, dx) => {
      const [x, z, y, tx, tz] = auPoint(ROUTE, s);
      // (du côté du garde-fou : là où le sol descend)
      const sg = terrain(x + tz * 7.4, z - tx * 7.4) < terrain(x - tz * 7.4, z + tx * 7.4) ? 1 : -1;
      return { x: x + tz * sg * 2.3 + tx * dx, z: z - tx * sg * 2.3 + tz * dx, cap: Math.atan2(-tz * sg, tx * sg) };
    };
    for (const [s, dx, petit] of [[24, 0, false], [24, 1.0, true], [26.5, 0, false]]) { const q = route(s, dx); liste.push({ ...q, zone: 2.6, petit }); }
    liste.push({ x: 5.2, z: 89.6, cap: 1.4, fixe: true, y: terrain(5.2, 89.6) + 0.62 });
    liste.push({ x: BRANCHE.x - 0.2, z: BRANCHE.z, cap: -PI / 2 - 0.3, fixe: true, y: BRANCHE.y + 0.04, branche: true });
    liste.push({ x: 44.2, z: 96.2, cap: 2.2, zone: 2.2, bebe: true });
    liste.push({ x: 59.8, z: 74.0, cap: -0.6, zone: 2.0 });
    const objet = new THREE.Group();
    const S = liste.map((q, k) => {
      const m = F.creer({ petit: q.petit, bebe: q.bebe });
      objet.add(m.objet);
      const y = q.y ?? monde.hauteur(q.x, q.z);
      m.objet.position.set(q.x, y, q.z);
      m.objet.rotation.y = q.cap;
      return { ...q, m, maison: [q.x, q.z], y, mode: 'assis', cible: null, t: hasard(k, 1) * 10, cri: 8 + hasard(k, 2) * 30, mange: 0, vu: true };
    });
    return {
      objet, liste: S,
      maj(dt, temps, c) {
        const cris = [], nuit = c.nuit > 0.5, j = c.joueur, oeil = c.oeil;
        for (const s of S) {
          const loin = Math.hypot(s.x - oeil.x, s.z - oeil.z) > 48;
          s.m.objet.visible = !nuit && !loin;
          if (nuit || loin) continue;
          const dj = Math.hypot(j.x - s.x, j.z - s.z);
          if (!s.fixe && s.mode === 'assis' && dj < 2.4) {
            // (il s'écarte : vers un point de sa zone, à l'opposé du voyageur)
            const ang = Math.atan2(s.x - j.x, s.z - j.z) + (hasard(temps, s.x) - 0.5) * 0.8;
            let cx = s.x + Math.sin(ang) * 2.8, cz = s.z + Math.cos(ang) * 2.8;
            const dm = Math.hypot(cx - s.maison[0], cz - s.maison[1]);
            if (dm > s.zone) { cx = s.maison[0] + ((cx - s.maison[0]) * s.zone) / dm; cz = s.maison[1] + ((cz - s.maison[1]) * s.zone) / dm; }
            s.cible = [cx, cz]; s.mode = 'marche';
          }
          if (s.mode === 'marche') {
            const dx = s.cible[0] - s.x, dz = s.cible[1] - s.z, d = Math.hypot(dx, dz), v = 1.7 * dt;
            if (d < 0.08) { s.mode = 'assis'; s.t = 0; }
            else {
              s.x += (dx / d) * Math.min(v, d); s.z += (dz / d) * Math.min(v, d);
              s.cap = tourne(s.cap, Math.atan2(dx, dz), dt * 8);
              s.y = monde.hauteur(s.x, s.z, s.y + 0.4);
            }
          } else if (!s.fixe && dj > 8 && Math.hypot(s.x - s.maison[0], s.z - s.maison[1]) > 0.3 && (s.t += dt) > 14) { s.cible = s.maison; s.mode = 'marche'; }
          s.m.objet.position.set(s.x, s.y, s.z);
          s.m.objet.rotation.y = s.cap;
          s.m.animer(dt, temps, s.mode, s.branche);
          if ((s.cri -= dt) < 0) { s.cri = 14 + hasard(temps, s.z) * 34; cris.push({ nom: 'singe', x: s.x, y: s.y + 0.5, z: s.z, fort: 0.7 }); }
        }
        return cris;
      },
    };
  })();
  animes.push(singes);

  // ---------------------------------------------------------------- La lueur des champignons, et le secret
  // La nuit, chaque touffe de champignons brille d'un vert doux (un point de lumière qui respire) ; dans le vieux cèdre creux, le
  // cercle des champignons s'allume un à un quand on regarde dedans, et le koban paraît. La première nuit qu'on approche de la
  // clairière, le compagnon les voit faire un chemin (une scène).
  const champignons = (() => {
    const objet = new THREE.Group(), n = TOUFFES_CHAMPI.length, lueur = nuee(THREE, n + 2, { additif: true });
    objet.add(lueur.m);
    // (le koban, dans le creux, sur un coussin de mousse ; il paraît quand le cercle s'allume)
    const a = atelier(), yc = terrain(CREUX.x, CREUX.z);
    a.cylindre(0.22, 0.26, 0.08, 10, MOUSSE, { y: 0.04 }).ovale(0.075, '#e8c060', { y: 0.2, sx: 0.78, sy: 1.0, sz: 0.16, sorte: 'lumiere' }, 12);
    const koban = ctx.maillage(a.fin());
    const kx = CREUX.x + Math.cos(BOUCHE_CREUX + PI) * 0.18, kz = CREUX.z + Math.sin(BOUCHE_CREUX + PI) * 0.18;
    koban.position.set(kx, yc, kz);
    koban.rotation.y = -BOUCHE_CREUX + PI / 2;
    koban.visible = false;
    objet.add(koban);
    const creux = TOUFFES_CHAMPI.map(([x, , z], k) => (Math.hypot(x - CREUX.x, z - CREUX.z) < 1.2 ? k : -1)).filter((k) => k >= 0);
    const allume = new Float32Array(n);
    let revele = -1, lu = -1, trouve = false, vu = false;
    return {
      objet, koban: [kx, yc + 0.2, kz],
      /** Le cercle du creux s'allume un à un (se résout quand c'est fait). */
      reveler: () => new Promise((fin) => { revele = 0; setTimeout(fin, 2600); }),
      prendre() { koban.visible = false; trouve = true; },
      maj(dt, temps, c) {
        if (temps - lu > 0.5) { lu = temps; trouve = secretTrouve('champignons'); vu = indiceVu('champignons-nuit'); }
        const nuit = c.nuit;
        if (revele >= 0) revele += dt;
        for (let k = 0; k < n; k++) {
          const [x, y, z, poids] = TOUFFES_CHAMPI[k], dansCreux = creux.includes(k);
          // (ceux du creux : éteints tant qu'on n'a pas regardé dedans la nuit, sauf une fois le secret trouvé)
          const voulu = dansCreux ? (trouve || (revele >= 0 && revele > 0.25 * creux.indexOf(k)) ? 1 : 0.12) : 1;
          allume[k] += (voulu - allume[k]) * Math.min(1, dt * 3);
          const v = nuit * allume[k] * (0.75 + 0.25 * Math.sin(temps * 1.3 + k * 1.7));
          if (v < 0.01) lueur.ranger(k);
          else lueur.poser(k, x, y + 0.04, z, (0.55 + 0.12 * poids) * (c.champ ? 50 / c.champ : 1), 0.42 * v, 1.0 * v, 0.38 * v, 0.9 * v);
        }
        lueur.fin();
        koban.visible = !trouve && nuit > 0.5 && revele > creux.length * 0.25;
        // la première nuit, près de la clairière : le compagnon voit le chemin de lumières
        if (!vu && !trouve && nuit > 0.9 && Math.hypot(c.joueur.x - 1.0, c.joueur.z - 87.6) < 9) {
          vu = true;
          c.scene(async (jeu) => {
            jeu.voirIndice('champignons-nuit');
            jeu.cadrer({ de: [5.6, KOKE.y + 2.2, 85.6], vers: [-6.0, KOKE.y + 0.3, 93.0], champ: 52 });
            await jeu.attendre(900);
            await jeu.dire(jeu.tx('champignonsNuit'));
            await jeu.dire(jeu.tx('champignonsNuitCompagnon')[jeu.compagnon], 'compagnon');
            jeu.cadrer(null);
          });
        }
        return [];
      },
    };
  })();
  animes.push(champignons);

  // ---------------------------------------------------------------- Les gens
  const PEAU = P.peau, NOIR = '#2a2226';
  const yS = yRue(RESTO.z) + 0.04 + 0.02;
  const RR = repere(xMaison(-1), RESTO.z, PI / 2), dansR = (lx, lz, cap, o) => { const q = RR(lx, 0, lz); return { x: q.x, z: q.z, cap: cap + PI / 2, ...o }; };
  const SALLE_D = [SALLE.x0, SALLE.x1, SALLE.z0, SALLE.z1];
  const passants = [
    // le batelier d'Udo, à côté de son bateau : il ramène à Udo
    { id: 'batelier', x: BATELIER.x, z: BATELIER.z, cap: BATELIER.cap, tenue: { taille: 1.0, peau: '#d8a880', cheveux: '#5a5650', coiffure: 'court', chapeau: { sorte: 'bandeau', c: '#f4f0e6' }, haut: '#3a5a7a', manches: 'longues', tablier: '#e8a42a', bas: { sorte: 'pantalon', c: '#3a3f4a' }, chaussures: '#e8e4dc', semelle: '#2a2a30', yeux: 'plisses' } },
    // un pêcheur qui range ses caisses de poissons volants
    { id: 'pecheur', x: -41.8, z: -53.0, cap: 0.4, tenue: { taille: 1.02, peau: '#d8a07a', cheveux: '#3a3a3a', coiffure: 'court', chapeau: { sorte: 'casquette', c: '#2f4a6a', c2: '#2f4a6a' }, haut: '#e8e4dc', manches: 'longues', tablier: '#3a6a5a', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: '#e8e4dc', semelle: '#2a2a30', yeux: 'plisses' }, quand: 'jour' },
    // deux randonneurs qui arrivent par le bateau, leurs gros sacs
    { id: 'touriste', x: -24.6, z: -51.4, cap: PI - 0.4, tenue: { taille: 0.95, peau: '#f2c9a8', cheveux: '#3a2a22', coiffure: 'queue', chapeau: { sorte: 'bob', c: '#e8a42a' }, haut: '#d8402c', manches: 'longues', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: '#5a4a3a', semelle: '#3a3236', sac: { sorte: 'dos', c: '#2f6ab0', c2: '#1f4a80' } }, quand: 'jour' },
    { id: 'touriste2', x: -23.3, z: -52.1, cap: -2.5, tenue: { taille: 1.06, peau: PEAU, cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'casquette', c: '#3a6a4a', c2: '#3a6a4a' }, haut: '#2f6ab0', manches: 'longues', bas: { sorte: 'pantalon', c: '#5a5a4a' }, chaussures: '#5a4a3a', semelle: '#3a3236', sac: { sorte: 'dos', c: '#c8783a', c2: '#8a4a2a' } }, quand: 'jour' },
    // le prêtre du Yaku-jinja
    { id: 'pretre', x: 6.4, z: -47.6, cap: -PI / 2 - 0.4, tenue: { taille: 1.0, peau: '#e8bf98', cheveux: '#3a3a3a', coiffure: 'court', chapeau: { sorte: 'eboshi', c: '#1e1e22' }, haut: '#f4f0e6', manches: 'kimono', col: '#f4f0e6', bas: { sorte: 'hakama', c: '#6a4a7a' }, chaussures: '#1e1e22', semelle: '#1e1e22', yeux: 'plisses' }, quand: 'jour' },
    // les boutiques : l'artisan du bois de yakusugi, la loueuse de matériel, la marchande de thé (derrière leur comptoir)
    { id: 'artisan', x: xMaison(-1) + 2.7, z: -32.55, cap: PI / 2, tenue: { taille: 1.02, peau: '#e0b48c', cheveux: '#8a8478', coiffure: 'court', chapeau: { sorte: 'bandeau', c: '#3a3a44' }, haut: '#5a4a3a', manches: 'longues', tablier: '#8a6a4a', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: '#3a3236', semelle: '#3a3236', yeux: 'plisses' }, quand: 'jour' },
    { id: 'loueuse', x: xMaison(1) - 2.7, z: -32.55, cap: -PI / 2, tenue: { taille: 0.94, peau: '#f2c9a8', cheveux: '#3a2a22', coiffure: 'queue', chapeau: { sorte: 'casquette', c: '#3a6a4a', c2: '#f4f0e6' }, haut: '#3a6a4a', manches: 'courtes', bas: { sorte: 'pantalon', c: '#5a5a4a' }, chaussures: '#5a4a3a', semelle: '#3a3236' }, quand: 'jour' },
    { id: 'theiere', x: xMaison(1) - 2.7, z: -22.25, cap: -PI / 2, tenue: { taille: 0.9, peau: '#f0c8a6', cheveux: '#d8d4cc', coiffure: 'chignon', haut: '#5a7a4a', manches: 'longues', tablier: '#f4efe2', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: '#3a3236', semelle: '#3a3236', yeux: 'plisses' }, quand: 'jour' },
    // le restaurant (食事処 とびうお) : la serveuse, le cuisinier, un client au comptoir, un couple à table, une grand-mère sur
    // l'estrade ; cachés quand la caméra est loin dehors
    { id: 'serveuse', ...dansR(1.0, 1.3, PI / 2), dedans: SALLE_D, tenue: { taille: 0.94, peau: '#f2c9a8', cheveux: '#3a2a22', coiffure: 'queue', chapeau: { sorte: 'bandeau', c: '#2e3a5a' }, haut: '#f4efe2', manches: 'courtes', tablier: '#2e3a5a', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: '#3a3236', semelle: '#3a3236' }, quand: 'jour' },
    { id: 'cuisinier', ...dansR(2.0, -2.45, 0), dedans: SALLE_D, tenue: { taille: 1.04, peau: '#e8bf98', cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'bandeau', c: '#f4f0e6' }, haut: '#f4f0e6', manches: 'longues', tablier: '#3a3a44', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: '#3a3236', semelle: '#3a3236', yeux: 'plisses' }, quand: 'jour' },
    { id: 'mangeur', ...dansR(1.2, -1.32, PI, { assis: yS + 0.58 }), dedans: SALLE_D, tenue: { taille: 1.04, peau: PEAU, cheveux: '#3a2a20', coiffure: 'court', haut: '#c8783a', manches: 'longues', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: '#5a4030', semelle: '#3a3236', sac: { sorte: 'dos', c: '#3a6a4a', c2: '#2a4a3a' } }, quand: 'jour' },
    { id: 'dineuse', ...dansR(2.28, 0.4, PI / 2, { assis: yS + 0.475 }), dedans: SALLE_D, tenue: { taille: 0.95, peau: '#f2c9a8', cheveux: '#5a3a28', coiffure: 'queue', haut: '#e8a0a8', manches: 'courtes', bas: { sorte: 'jupe', c: '#3a4a6a' }, chaussures: '#f4f0e6', semelle: '#3a3236' }, quand: 'jour' },
    { id: 'dineur', ...dansR(3.52, 0.4, -PI / 2, { assis: yS + 0.475 }), dedans: SALLE_D, tenue: { taille: 1.06, peau: PEAU, cheveux: NOIR, coiffure: 'court', haut: '#4a6a4a', manches: 'courtes', bas: { sorte: 'pantalon', c: '#c9b48a' }, chaussures: P.blanc, semelle: '#3a3236' }, quand: 'jour' },
    { id: 'mamie', ...dansR(-1.9, -1.875, -PI / 2), dedans: SALLE_D, tenue: { taille: 0.86, peau: '#f0c8a6', cheveux: '#d8d4cc', coiffure: 'chignon', haut: '#6a7a9a', manches: 'longues', bas: { sorte: 'pantalon', c: '#4a4a56' }, chaussures: '#f4f0e6', semelle: '#c9b48a', yeux: 'plisses', pose: 'seiza' }, quand: 'jour' },
    // à l'entrée de Shiratani : le chauffeur du bus, la dame du guichet, la guide (les règles de la forêt, et les champignons)
    { id: 'chauffeur', x: -48.2, z: 24.6, cap: -PI / 2 - 0.3, tenue: { taille: 1.02, peau: '#e8bf98', cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'casquette', c: '#2a3550', c2: '#2a3550' }, haut: '#f4f2ea', manches: 'longues', bas: { sorte: 'pantalon', c: '#2a3550' }, chaussures: '#1f1f24', semelle: '#1f1f24' }, quand: 'jour' },
    { id: 'guichet', x: -53.0, z: 30.8, cap: PI / 2, tenue: { taille: 0.92, peau: '#f0c8a6', cheveux: '#3a2a22', coiffure: 'chignon', haut: '#3a6a4a', manches: 'longues', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: '#3a3236', semelle: '#3a3236' }, quand: 'jour' },
    { id: 'guide', x: -46.2, z: 31.4, cap: PI / 2 + 0.5, tenue: { taille: 0.96, peau: '#e8bf98', cheveux: '#3a2a22', coiffure: 'queue', chapeau: { sorte: 'bob', c: '#5a6a4a' }, haut: '#e8a42a', manches: 'longues', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: '#5a4a3a', semelle: '#3a3236', sac: { sorte: 'dos', c: '#3a5a3a', c2: '#2a3a2a' } }, quand: 'jour' },
    // un randonneur qui monte et descend le sentier de pierre
    { id: 'randonneur', x: -43.4, z: 37.4, cap: 0, ronde: [[-43.4, 37.4], [-39.6, 55.6], [-43.4, 37.4], [-44.6, 32.6]], vitesse: 0.5, attente: [5, 11], tenue: { taille: 1.08, peau: '#e8bf98', cheveux: '#3a2a20', coiffure: 'court', chapeau: { sorte: 'casquette', c: '#c8452e', c2: '#f4f0e6' }, haut: '#3a6a8a', manches: 'longues', bas: { sorte: 'pantalon', c: '#5a5a4a' }, chaussures: '#5a4a3a', semelle: '#3a3236', sac: { sorte: 'dos', c: '#c8783a', c2: '#8a4a2a' } }, quand: 'jour' },
    // dans la forêt de mousse : une photographe des mousses, @random_japan_place qui filme (son TikTok)
    { id: 'photographe', x: 10.8, z: 89.4, cap: 0.7, tenue: { taille: 0.95, peau: '#f2c9a8', cheveux: '#3a2a22', coiffure: 'queue', chapeau: { sorte: 'bob', c: '#f4efe2' }, haut: '#8ac4a8', manches: 'longues', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: '#5a4a3a', semelle: '#3a3236', appareil: true }, quand: 'jour' },
    { id: 'videaste', x: 12.4, z: 83.4, cap: -2.3, tenue: { taille: 1.1, peau: PEAU, cheveux: '#3a2a20', coiffure: 'court', chapeau: { sorte: 'bob', c: '#2f3440' }, haut: '#2f3440', manches: 'courtes', bas: { sorte: 'pantalon', c: '#c9b48a' }, chaussures: P.blanc, semelle: '#3a3236', appareil: true } },
    // le randonneur qui passe la nuit au refuge : debout devant sa porte (assis sur le banc, on s'asseyait au lieu de lui parler) ;
    // il fait venir le soir, et rend le matin
    { id: 'refuge', x: HUTTE.x - 3.2, z: HUTTE.z - 1.3, cap: -PI / 2 - 0.3, tenue: { taille: 1.04, peau: '#e0b48c', cheveux: '#3a3a3a', coiffure: 'court', chapeau: { sorte: 'bandeau', c: '#c8402c' }, haut: '#5a6a4a', manches: 'longues', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: '#5a4a3a', semelle: '#3a3236', sac: { sorte: 'dos', c: '#3a5a8a', c2: '#2a3a6a' } } },
    // en haut du Taiko-iwa, un randonneur qui regarde les sommets
    { id: 'sommets', x: 28.8, z: 118.2, cap: 0.35, tenue: { taille: 1.04, peau: PEAU, cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'casquette', c: '#2f3440', c2: '#2f3440' }, haut: '#c8402c', manches: 'longues', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: '#5a4a3a', semelle: '#3a3236', sac: { sorte: 'dos', c: '#e8a42a', c2: '#a8742a' } }, quand: 'jour' },
    // sur la voie du train : l'agent qui entretient les sentiers ; deux marcheurs
    { id: 'agent', x: 57.6, z: 79.0, cap: -2.3, tenue: { taille: 1.02, peau: '#d8a07a', cheveux: '#3a3a3a', coiffure: 'court', chapeau: { sorte: 'casquette', c: '#f4f2ea', c2: '#f4f2ea' }, haut: '#4a5a6a', manches: 'longues', bas: { sorte: 'pantalon', c: '#4a5a6a' }, chaussures: '#3a3236', semelle: '#3a3236', yeux: 'plisses' }, quand: 'jour' },
    { id: 'marcheur', x: 39.0, z: 96.0, cap: 2.4, ronde: [[39.0, 96.0], [61.6, 75.0], [39.0, 96.0], [37.4, 97.4]], vitesse: 0.6, attente: [4, 9], tenue: { taille: 1.0, peau: '#f2c9a8', cheveux: '#3a2a22', coiffure: 'queue', chapeau: { sorte: 'bob', c: '#8a3a4a' }, haut: '#f2c443', manches: 'longues', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: '#5a4a3a', semelle: '#3a3236', sac: { sorte: 'dos', c: '#8a3a4a', c2: '#5a2a3a' } }, quand: 'jour' },
    // devant la souche de Wilson : deux amoureux qui cherchent le cœur
    { id: 'amoureuse', x: 76.2, z: 64.4, cap: PI / 2 + 0.3, tenue: { taille: 0.95, peau: '#f2c9a8', cheveux: '#3a2a22', coiffure: 'chignon', chapeau: { sorte: 'soleil', c: '#f4efe2' }, haut: '#e88aa0', manches: 'courtes', bas: { sorte: 'pantalon', c: '#3a4a6a' }, chaussures: '#f4f0e6', semelle: '#3a3236', sac: { sorte: 'dos', c: '#e88aa0', c2: '#a85a6a' } }, quand: 'jour' },
    { id: 'amoureux', x: 76.0, z: 68.6, cap: PI / 2 - 0.4, tenue: { taille: 1.06, peau: PEAU, cheveux: NOIR, coiffure: 'court', haut: '#3a5a8a', manches: 'longues', bas: { sorte: 'pantalon', c: '#5a5a4a' }, chaussures: '#5a4a3a', semelle: '#3a3236', sac: { sorte: 'dos', c: '#3a5a8a', c2: '#2a3a5a' } }, quand: 'jour' },
    // sur la plateforme du Jōmon Sugi : la guide qui raconte, un randonneur qui mange ses onigiri sur le banc, un vieux monsieur
    { id: 'guideJomon', x: 89.4, z: 85.2, cap: 0.5, tenue: { taille: 0.96, peau: '#e8bf98', cheveux: '#3a2a22', coiffure: 'queue', chapeau: { sorte: 'bob', c: '#5a6a4a' }, haut: '#3a6a4a', manches: 'longues', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: '#5a4a3a', semelle: '#3a3236', sac: { sorte: 'dos', c: '#e8a42a', c2: '#a8742a' } }, quand: 'jour' },
    { id: 'onigiri', x: 91.4, z: DECK.z0 + 0.55, cap: 0, assis: DECK.y + 0.47, tenue: { taille: 1.04, peau: PEAU, cheveux: '#3a2a20', coiffure: 'court', chapeau: { sorte: 'casquette', c: '#3a6a8a', c2: '#3a6a8a' }, haut: '#5a7a4a', manches: 'longues', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: '#5a4a3a', semelle: '#3a3236' }, quand: 'jour' },
    { id: 'ancien', x: 94.8, z: 85.8, cap: 0.15, tenue: { taille: 0.98, peau: '#e0b48c', cheveux: '#d8d4cc', coiffure: 'court', chapeau: { sorte: 'bob', c: '#8a7a5a' }, haut: '#6a5a4a', manches: 'longues', bas: { sorte: 'pantalon', c: '#4a4a56' }, chaussures: '#5a4a3a', semelle: '#3a3236', yeux: 'plisses', canne: true }, quand: 'jour' },
  ];
  // les cerfs de Yakushima (ヤクシカ), plus petits : sur la route, sous l'arbre du singe (le tampon), le long de la voie, près de la
  // souche de Wilson. On les regarde ; la nuit, ils se couchent.
  const daims = [
    { ...(() => { const [x, z, , tx, tz] = auPoint(ROUTE, 38); return { x: x - tz * 2.2, z: z + tx * 2.2 }; })(), cap: 2.6, male: false, taille: 0.8 },
    { x: CERF.x, z: CERF.z, cap: -PI / 2 - 0.4, male: true, taille: 0.8 },
    { x: 49.2, z: 81.2, cap: 0.9, male: false, taille: 0.78 },
    { x: 72.2, z: 64.6, cap: -1.2, male: false, taille: 0.8 },
  ];

  // ---------------------------------------------------------------- Ce qu'on peut faire (tout passe par `jeu`)
  const comp = (jeu, cle) => jeu.dire(jeu.tx(cle)[jeu.compagnon], 'compagnon');
  /** Un tampon gagné : le tampon, puis ce qu'en dit le compagnon. */
  const gagner = async (jeu, id, cle) => { if (jeu.aTampon(id)) return; await jeu.tampon(id, () => comp(jeu, cle)); };
  const parler = (id) => ({ id, passant: id, verbe: 'parler', action: (jeu) => jeu.dire(jeu.txn(id), id) });
  const lire = (id, x, z, ry) => ({ id: `panneau-${id}`, x: x - Math.sin(ry) * 1.2, z: z - Math.cos(ry) * 1.2, rayon: 1.8, verbe: 'lire', vers: [x, z], action: (jeu) => jeu.dire(jeu.tx(`panneau-${id}`)) });
  const HAIDEN = RJ(0, 0, 2.0 + 1.55);
  const interactions = [
    {
      // le batelier : il ramène à Udo (le même bateau)
      id: 'batelier', passant: 'batelier', verbe: 'parler',
      async action(jeu) {
        await jeu.dire(jeu.txn('batelier'), 'batelier');
        const r = await jeu.choisir(jeu.tx('batelierRetour'), [jeu.t('oui'), jeu.t('non')], 'batelier');
        if (r !== 0) { await jeu.dire(jeu.tx('batelierAttend'), 'batelier'); return; }
        await jeu.dire(jeu.tx('batelierPart'), 'batelier');
        await jeu.partir('udo');
      },
    },
    { id: 'bateau', x: BATEAU.x - 2.4, z: QUAI.z0 + 0.6, rayon: 1.6, haut: 1.6, verbe: 'regarder', vers: [BATEAU.x, BATEAU.z], action: (jeu) => jeu.dire(jeu.txn('bateau')) },
    {
      // le Yaku-jinja : la cloche, deux battements de mains (le tampon) ; son dieu est le père de celui d'Udo
      id: 'yakujinja', x: HAIDEN.x, z: HAIDEN.z, rayon: 1.8, haut: 1.4, verbe: 'prier', vers: [RJ(0, 0, 0).x, RJ(0, 0, 0).z],
      async action(jeu) {
        jeu.cadrer({ de: [HAIDEN.x - 3.0, JINJA.y + 2.0, HAIDEN.z + 2.4], vers: [RJ(0, 0, 1).x, JINJA.y + 1.6, RJ(0, 0, 1).z], champ: 56 });
        jeu.son('cloche'); jeu.geste('prier');
        await jeu.attendre(900); jeu.son('claque'); await jeu.attendre(2200); jeu.geste(null);
        await jeu.dire(jeu.txn('yakujinja'));
        jeu.cadrer(null);
        await gagner(jeu, 'yakujinja', 'yakujinjaCompagnon');
      },
    },
    {
      // la forêt de mousse : regarder le singe sur sa branche, et le cerf qui mange dessous ce qu'il fait tomber (le tampon)
      id: 'sarushika', x: OBS.x, z: OBS.z, rayon: 1.9, haut: 1.5, verbe: 'regarder', vers: [BRANCHE.x, BRANCHE.z],
      async action(jeu) {
        if (jeu.estNuit) { await jeu.dire(jeu.tx('sarushikaNuit')); return; }
        jeu.cadrer({ de: [OBS.x - 1.2, KOKE.y + 1.8, OBS.z + 1.6], vers: [(BRANCHE.x + CERF.x) / 2, KOKE.y + 1.6, (BRANCHE.z + CERF.z) / 2], champ: 50 });
        await jeu.attendre(1200);
        await jeu.dire(jeu.tx('sarushika'));
        jeu.cadrer(null);
        await gagner(jeu, 'sarushika', 'sarushikaCompagnon');
      },
    },
    {
      // le Taiko-iwa : la vue sur les sommets de l'île (le tampon)
      id: 'taikoiwa', x: TAIKO.x + 0.6, z: TAIKO.z + 0.6, rayon: 2.6, haut: 1.4, verbe: 'regarder', vers: [TAIKO.x + 4, TAIKO.z + 10],
      async action(jeu) {
        const y = TAIKO.y + 0.4;
        jeu.cadrer({ de: [TAIKO.x - 1.2, y + 1.9, TAIKO.z - 1.4], vers: [TAIKO.x + 60, y + 30, TAIKO.z + 260], champ: 62 });
        await jeu.attendre(1500);
        await jeu.dire(jeu.txn('taikoiwa'));
        jeu.cadrer(null);
        await gagner(jeu, 'taikoiwa', 'taikoiwaCompagnon');
      },
    },
    {
      // la souche de Wilson : lever les yeux, là où il faut ; le ciel fait un cœur (le tampon)
      id: 'wilson', x: COEUR.x, z: COEUR.z, y: WILSON.y, rayon: 1.2, haut: 1.3, verbe: 'regarder',
      async action(jeu) {
        jeu.placer(COEUR.x, COEUR.z, PI);
        jeu.cadrer({ de: [COEUR.x, WILSON.y + 0.9, COEUR.z], vers: [COEUR.x, WILSON.y + 12, COEUR.z - 0.75], champ: 70 });
        await jeu.attendre(1600);
        jeu.son('magie');
        await jeu.dire(jeu.txn('wilson'));
        jeu.cadrer(null);
        await gagner(jeu, 'wilson', 'wilsonCompagnon');
      },
    },
    { id: 'hokora', x: WILSON.x + 0.45, z: WILSON.z + 0.05, y: WILSON.y, rayon: 1.0, haut: 1.0, verbe: 'prier', vers: [WILSON.x + 1.15, WILSON.z + 0.05], async action(jeu) { jeu.geste('prier'); jeu.son('claque'); await jeu.attendre(2200); jeu.geste(null); await jeu.dire(jeu.tx('hokora')); } },
    {
      // le Jōmon Sugi, de sa plateforme : la caméra monte le long du tronc (le tampon)
      id: 'jomonsugi', x: JOMON.x, z: DECK.z1 - 0.5, rayon: 2.6, haut: 1.5, verbe: 'regarder', vers: [JOMON.x, JOMON.z],
      async action(jeu) {
        jeu.cadrer({ de: [JOMON.x - 2.6, DECK.y + 1.5, DECK.z1 - 0.4], vers: [JOMON.x, DECK.y + 9, JOMON.z], champ: 64 });
        await jeu.attendre(1400);
        jeu.cadrer({ de: [JOMON.x - 1.4, DECK.y + 1.2, DECK.z1 - 0.2], vers: [JOMON.x, DECK.y + 20, JOMON.z], champ: 66 });
        await jeu.attendre(1200);
        await jeu.dire(jeu.txn('jomonsugi'));
        jeu.cadrer(null);
        await gagner(jeu, 'jomonsugi', 'jomonsugiCompagnon');
      },
    },
    // la cascade Hiryū-otoshi, de la rambarde de l'entrée ; le pont suspendu ; le Kuguri-sugi (on passe dessous)
    { id: 'cascade', x: ENTREE.x1 - 0.6, z: 32.6, rayon: 1.8, haut: 1.4, verbe: 'regarder', vers: [-33.4, 44], async action(jeu) { jeu.cadrer({ de: [ENTREE.x1 - 0.2, ENTREE.y + 2.2, 32.0], vers: [-33.2, 11, 47], champ: 56 }); await jeu.attendre(700); await jeu.dire(jeu.txn('cascade')); jeu.cadrer(null); } },
    { id: 'pont', x: PONT.x0 - 0.2, z: PONT.z - 0.6, y: ESC_PIERRE.pts[ESC_PIERRE.pts.length - 1][2], rayon: 1.5, haut: 1.6, verbe: 'regarder', vers: [PONT.x1, PONT.z], action: (jeu) => jeu.dire(jeu.txn('pont')) },
    // les champignons du bord de la clairière : de jour, à peine visibles ; la nuit, ils brillent
    { id: 'champignons', x: -0.2, z: 87.9, rayon: 1.6, haut: 1.0, verbe: 'regarder', vers: [-1.0, 86.9], action: async (jeu) => { await jeu.dire(jeu.txn('champignons')); if (!jeu.estNuit && !secretTrouve('champignons')) jeu.voirIndice('champignons'); } },
    {
      // le vieux cèdre creux (le secret) : de jour, il fait noir dedans ; la nuit, le cercle des champignons s'allume, le koban paraît
      id: 'creux', x: SENTIER_SECRET[4][0], z: SENTIER_SECRET[4][1], rayon: 1.6, haut: 1.3, verbe: 'regarder', vers: [CREUX.x, CREUX.z],
      async action(jeu) {
        if (secretTrouve('champignons')) { await jeu.dire(jeu.txn('creuxApres')); return; }
        if (!jeu.estNuit) { await jeu.dire(jeu.tx('creux')); if (indiceVu('champignons') || indiceVu('champignons-nuit')) await comp(jeu, 'creuxCompagnon'); return; }
        const [kx, ky, kz] = champignons.koban, [ex, ez] = SENTIER_SECRET[4];
        jeu.placer(ex, ez, Math.atan2(CREUX.x - ex, CREUX.z - ez));
        jeu.cadrer({ de: [ex + (ex - CREUX.x) * 0.5, ky + 1.0, ez + (ez - CREUX.z) * 0.5], vers: [kx, ky + 0.15, kz], champ: 50 });
        await jeu.dire(jeu.tx('creuxNuit'));
        jeu.son('magie');
        await champignons.reveler();
        await jeu.dire(jeu.tx('creuxKoban'));
        jeu.geste('creuser');
        await jeu.attendre(700);
        champignons.prendre();
        jeu.geste(null);
        await comp(jeu, 'creuxKobanCompagnon');
        await jeu.trouverSecret('champignons');
        jeu.cadrer(null);
      },
    },
    {
      // le randonneur du refuge : il fait venir le soir (et les champignons) ; la nuit, il rend le matin
      id: 'refuge', passant: 'refuge', verbe: 'parler',
      async action(jeu) {
        if (!jeu.estNuit) {
          await jeu.dire(jeu.tx('refuge'), 'refuge');
          const r = await jeu.choisir(jeu.tx('refugeSoir'), [jeu.t('oui'), jeu.t('non')], 'refuge');
          if (r !== 0) { await jeu.dire(jeu.tx('refugeNon'), 'refuge'); return; }
          await jeu.nuit(true);
          await jeu.dire(jeu.tx('refugeNuitTombe'), 'refuge');
          return;
        }
        const r = await jeu.choisir(jeu.tx('refugeNuit'), [jeu.t('oui'), jeu.t('non')], 'refuge');
        if (r !== 0) { await jeu.dire(jeu.tx('refugeReste'), 'refuge'); return; }
        await jeu.nuit(false);
        await jeu.dire(jeu.tx('refugeMatin'), 'refuge');
      },
    },
    { id: 'guide', passant: 'guide', verbe: 'parler', async action(jeu) { await jeu.dire(jeu.txn('guide'), 'guide'); if (!jeu.estNuit && !secretTrouve('champignons')) { await jeu.dire(jeu.tx('guideChampignons'), 'guide'); jeu.voirIndice('champignons'); } } },
    { id: 'videaste', passant: 'videaste', verbe: 'parler', async action(jeu) { await jeu.dire(jeu.tx('videaste'), 'videaste'); await jeu.video(); } },
    lire('entree', -45.4, 33.4, 0), lire('carte', -49.8, 33.9, 0), lire('yayoi', PANNEAUX.yayoi.x, PANNEAUX.yayoi.z, PANNEAUX.yayoi.ry), lire('nidai', PANNEAUX.nidai.x, PANNEAUX.nidai.z, PANNEAUX.nidai.ry),
    lire('kuguri', PANNEAUX.kuguri.x, PANNEAUX.kuguri.z, PANNEAUX.kuguri.ry), lire('koke', PANNEAUX.koke.x, PANNEAUX.koke.z, PANNEAUX.koke.ry), lire('tsuji', TSUJI.x0 + 1.0, TSUJI.z1 - 0.8, -PI / 2),
    lire('taiko', PANNEAUX.taiko.x, PANNEAUX.taiko.z, PANNEAUX.taiko.ry), lire('voie', PANNEAUX.voie.x, PANNEAUX.voie.z, PANNEAUX.voie.ry), lire('kosugi', PANNEAUX.kosugi.x, PANNEAUX.kosugi.z, PANNEAUX.kosugi.ry),
    lire('wilson', PANNEAUX.wilson.x, PANNEAUX.wilson.z, PANNEAUX.wilson.ry), lire('jomon', PANNEAUX.jomon.x, PANNEAUX.jomon.z, PANNEAUX.jomon.ry), lire('jinja', PANNEAUX.jinja.x, PANNEAUX.jinja.z, PANNEAUX.jinja.ry),
    lire('menu', RR(0.6 + 1.25, 0, -3.24).x, RR(0.6 + 1.25, 0, -3.24).z, PI / 2 + PI),
    parler('pecheur'), parler('touriste'), parler('touriste2'), parler('pretre'), parler('artisan'), parler('loueuse'), parler('theiere'),
    parler('serveuse'), parler('cuisinier'), parler('mangeur'), parler('dineuse'), parler('dineur'), parler('mamie'),
    parler('chauffeur'), parler('guichet'), parler('randonneur'), parler('photographe'), parler('sommets'), parler('agent'), parler('marcheur'),
    parler('amoureuse'), parler('amoureux'), parler('guideJomon'), parler('onigiri'), parler('ancien'),
    // les singes : les regarder (là où ils sont)
    ...singes.liste.map((s, k) => ({ id: `singe-${k}`, pres: () => ({ x: s.x, z: s.z, y: s.y }), rayon: 2.2, haut: 1.0, verbe: 'regarder', si: (jeu) => !jeu.estNuit, action: (jeu) => jeu.dire(jeu.tx(s.branche ? 'singeBranche' : s.bebe ? 'singeBebe' : 'singe')) })),
    ...interactionsBancs(bancs),
  ];
  // les panneaux de lecture (bois, écrits) : le nom, et deux lignes
  const TITRES = { yayoi: '弥生杉', nidai: '二代大杉', kuguri: 'くぐり杉', koke: '苔むす森', taiko: '太鼓岩', voie: '安房森林軌道', kosugi: '小杉谷', wilson: 'ウィルソン株', jomon: '縄文杉', jinja: '益救神社' };
  for (const [id, titre] of Object.entries(TITRES)) {
    const { x, z, ry } = PANNEAUX[id], y = monde.hauteur(x, z), b = panneau(atelier(), P, { ecrit: true });
    poser(b.fin(), x, z, { y, ry });
    ecrire({ x, y, z, ry }, { ...PAPIER_PANNEAU, texte: titre, fond: '#fff8e8', encre: '#2a2420', lignes: 2 });
    const cx = Math.cos(ry) * 0.6, cz = -Math.sin(ry) * 0.6;
    monde.mur(x - cx, z - cz, x + cx, z + cz, 0.5);
  }
  const actionDaim = (jeu) => jeu.dire(jeu.txn('cerf'));
  const depart = { x: DEPART.x, z: DEPART.z, cap: DEPART.cap };
  // les morceaux du décor : près, avec leur trait et leur ombre ; au loin (la forêt des montagnes), sans
  for (const [k, a] of morceaux) poser(a.fin(), 0, 0, { y: 0, ...(Number(k.split(':')[0]) >= 100 ? { trait: false, ombre: false } : {}) });

  return {
    ...infos, textes: TEXTES,
    objets, monde, terrain, etiquettes, passants, daims, interactions, actionDaim, verbeDaim: 'regarder', vapeurs, bancs, lumieres, animes,
    actionBete: async (jeu, b) => { await jeu.dire(jeu.txn(b.sorte)); },
    // (le secret, tresors.js : les champignons qui brillent ; le marchand, à l'abri de Kosugidani ; les sons en plus ; les feux
    // d'artifice au-dessus de la mer, au nord)
    secret: 'champignons', marchand: MARCHAND, sons: ['claque', 'cloche', 'papier', 'oiseau/singe', 'oiseau/corne'],
    feux: { x: -20, y: 0, z: -170, large: 90, haut: [42, 68] },
    // (on arrive en bateau d'Udo : là, au quai ; le départ est le même)
    arrivee: depart,
    mouettes: {
      vols: [{ x: -30, z: -80, r: 16, h: 16, sens: 1 }, { x: 10, z: -90, r: 14, h: 14, sens: -1 }],
      poses: [
        { x: -24.0, z: -79.0, y: 2.25, cap: 0.4, mer: [0, -1] },
        { x: QUAI.x0 + 1.4 + 3.6 * 4, z: QUAI.z0 + 0.2, y: Y_PORT + 0.68, cap: PI, mer: [0, -1], fuite: 5 },
        { x: 8.0, z: -70.0, y: 2.25, cap: -0.6, mer: [0, -1] },
      ],
    },
    betes: {
      papillons: [[-20, -20], [-44, 30], [8, 86], [-14, 72], [56, 84]], libellules: [[-28, 10], [-33, 36], [6, 94]],
      milans: [{ x: -20, z: -40, r: 50, h: 46, sens: 1 }],
      grenouilles: [{ x: 3.0, z: 95.6, eau: [2.6, 94.8] }, { x: -8.0, z: 89.4, eau: [-8.7, 88.5] }, { x: -13.4, z: 82.6, eau: [-14.1, 81.9] }],
    },
    aspectSol: (x, z, h) => aspectSol(P, x, z, h),
    solDetaille,
    etendue: ETENDUE,
    courants,
    // (le bruit de la cascade : sans voile, l'eau glisse sur la dalle)
    cascades: [{ x: BRUIT_CASCADE.x, z: BRUIT_CASCADE.z, y0: 14.7, y1: 7.4, voile: false }],
    ruisseaux: [RUISSEAU, RIVIERE.slice(0, 11), RAVIN],
    mares: [[2, 95], [-9, 88], [WILSON.x, WILSON.z]], sonGrenouilles: 'grenouilles',
    eau: { x0: -1400, x1: 1400, z0: -1400, z1: 1400, niveau: 0, clair: '#58c6c2', profond: '#1b5b9e' },
    centreRive: [-20, -54],
    vent: { dir: [0.4, 0.9], force: 0.7 }, oiseaux: ['milan', 'uguisu'], ambiances: ['vagues', 'insectes', 'ruisseau', 'grenouilles', 'cascade'],
    brume: [60, 1300],
    flou: [150, 460],
    rais: [[6, 86], [-2, 80], [12, 92], [-30, 48], [80, 66], [48, 88]].map(([x, z], i) => ({ x, z, haut: 14, r0: 0.4, r1: 1.4 + 0.3 * (i % 3), force: 0.07 })),
    soleil: [0.55, 0.7, 0.45],
    depart,
    photos: {
      heros: { x: KOKE.x, z: KOKE.z, cap: 0.6, lacet: 0.6 + PI + 0.3, tangage: 0.16, distance: 7.0 },
      perso: { x: DEPART.x, z: DEPART.z, cap: DEPART.cap, lacet: DEPART.cap + PI + PI + 0.2, tangage: 0.1, distance: 4.4 },
    },
  };
}

// ---------------------------------------------------------------- Les points doux (les lueurs)
/** Une tache douce et ronde (un point de lumière), en 32 × 32 : blanche, la couleur de la nuée la teinte. */
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
/** Une nuée de n points doux (leur place, leur taille, leur couleur et leur force changent à chaque image). */
function nuee(THREE, n, o = {}) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3).fill(-500), 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 4), 4).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('taille', new THREE.BufferAttribute(new Float32Array(n), 1).setUsage(THREE.DynamicDrawUsage));
  const mat = new THREE.PointsMaterial({ size: 1, sizeAttenuation: true, vertexColors: true, map: o.tache || tacheDouce(THREE), transparent: true, depthWrite: false, fog: true, blending: o.additif ? THREE.AdditiveBlending : THREE.NormalBlending });
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
/** Un angle qui tourne vers un autre, par le plus court. */
const tourne = (a, b, f) => { const d = ((b - a + PI) % (2 * PI) + 2 * PI) % (2 * PI) - PI; return a + d * Math.min(1, f); };

// ---------------------------------------------------------------- Le singe de Yakushima (ヤクシマザル)
/**
 * Les formes du singe (une fois pour toutes) : assis (le corps droit, les cuisses en avant, une main sur le genou, l'autre qui
 * porte à la bouche ce qu'il mange), à quatre pattes (le corps à l'horizontale, ses quatre pattes qui se balancent) ; la tête à
 * part (elle tourne : il regarde autour de lui) : le poil épais gris-brun, le visage rouge en cœur, les yeux sous l'arcade sombre,
 * les petites oreilles ; une queue courte ; un petit sur le dos de sa mère. creer({ petit, bebe }) → { objet, animer(dt, temps,
 * mode, branche) }. Repère : ses pieds à l'origine, il regarde vers +z.
 */
function formesSinge(ctx) {
  const { THREE, atelier, maillage } = ctx;
  const POIL = '#6f6152', POIL_C = '#8f806c', POIL_F = '#54493d', FACE = '#d27a6c', FACE_F = '#b8605a', OEIL = '#24181a';
  const tete = (s = 1) => {
    const a = atelier();
    a.ovale(0.085 * s, POIL, { y: 0.06 * s, sx: 1.0, sy: 0.95, sz: 0.95 }, 12)
      .ovale(0.062 * s, FACE, { y: 0.055 * s, z: 0.05 * s, sx: 0.95, sy: 1.0, sz: 0.55, trait: false }, 10)
      .ovale(0.03 * s, FACE_F, { y: 0.03 * s, z: 0.086 * s, sx: 1.2, sy: 0.75, sz: 0.6, trait: false }, 8)
      .ovale(0.042 * s, POIL_F, { y: 0.098 * s, z: 0.066 * s, sx: 1.25, sy: 0.3, sz: 0.5, trait: false }, 8);
    for (const sg of [-1, 1]) {
      a.ovale(0.011 * s, OEIL, { x: sg * 0.022 * s, y: 0.07 * s, z: 0.096 * s, trait: false }, 6)
        .ovale(0.022 * s, FACE, { x: sg * 0.082 * s, y: 0.066 * s, z: 0.0, sx: 0.45, sy: 0.9, sz: 0.8 }, 6)
        .ovale(0.042 * s, POIL_C, { x: sg * 0.058 * s, y: 0.02 * s, z: 0.035 * s, sx: 0.6, sy: 0.9, sz: 0.8, trait: false }, 6);
    }
    return a;
  };
  const assis = () => {
    const a = atelier();
    a.ovale(0.13, POIL, { y: 0.21, z: -0.01, sx: 0.95, sy: 1.25, sz: 0.85, rx: 0.12 }, 12)
      .ovale(0.09, POIL_C, { y: 0.23, z: 0.07, sx: 0.8, sy: 1.05, sz: 0.5, trait: false }, 8);
    for (const sg of [-1, 1]) {
      a.ovale(0.065, POIL, { x: sg * 0.075, y: 0.08, z: 0.05, sx: 0.8, sy: 0.65, sz: 1.4 }, 8)
        .ovale(0.034, POIL_F, { x: sg * 0.07, y: 0.025, z: 0.15, sx: 0.8, sy: 0.5, sz: 1.5 }, 6);
    }
    a.tube([[-0.1, 0.3, 0.02], [-0.115, 0.2, 0.08], [-0.08, 0.13, 0.15]], 0.028, POIL, { cotes: 6, pas: 6 })
      .ovale(0.022, POIL_F, { x: -0.08, y: 0.12, z: 0.17 }, 6)
      .cone(0.024, 0.08, 6, POIL_F, { y: 0.07, z: -0.12, rx: -2.2 });
    return a;
  };
  const bras = () => atelier().tube([[0, 0, 0], [0.012, -0.09, 0.05], [0.0, -0.17, 0.12]], 0.028, POIL, { cotes: 6, pas: 6 }).ovale(0.022, POIL_F, { y: -0.18, z: 0.14 }, 6);
  const marche = () => atelier().ovale(0.12, POIL, { y: 0.24, sx: 0.85, sy: 0.85, sz: 1.5 }, 12).ovale(0.05, FACE, { y: 0.22, z: -0.165, sx: 0.9, sy: 0.7, sz: 0.3, trait: false }, 6).cone(0.022, 0.08, 6, POIL_F, { y: 0.3, z: -0.18, rx: -0.9 });
  const patte = () => atelier().tube([[0, 0, 0], [0, -0.1, 0.01], [0, -0.19, 0.02]], 0.025, POIL, { cotes: 5, pas: 4 }).ovale(0.022, POIL_F, { y: -0.2, z: 0.03, sz: 1.4 }, 5);
  // le petit, accroché au dos de sa mère : un corps, une tête, deux bras qui la tiennent
  const bebe = () => {
    const a = tete(0.55);
    a.ovale(0.06, POIL_C, { y: -0.05, z: -0.06, sx: 0.9, sy: 0.8, sz: 1.3 }, 8);
    for (const sg of [-1, 1]) a.tube([[sg * 0.04, -0.02, 0.0], [sg * 0.07, -0.06, 0.06], [sg * 0.06, -0.09, 0.1]], 0.014, POIL_C, { cotes: 5, pas: 4 });
    return a;
  };
  const G = { tete: tete().fin(0, false), assis: assis().fin(0, false), bras: bras().fin(0, false), marche: marche().fin(0, false), patte: patte().fin(0, false), bebe: bebe().fin(0, false) };
  return {
    creer({ petit = false, bebe: avecBebe = false } = {}) {
      const objet = new THREE.Group(), corps = new THREE.Group();
      corps.scale.setScalar((petit ? 0.62 : 1) * 1.35);
      objet.add(corps);
      const gA = new THREE.Group(), gM = new THREE.Group(), tete = new THREE.Group(), brasP = new THREE.Group();
      gA.add(maillage(G.assis));
      brasP.position.set(0.1, 0.3, 0.02);
      brasP.add(maillage(G.bras, false));
      gA.add(brasP);
      gM.add(maillage(G.marche));
      const pattes = [[-0.07, 0.2, 0.12], [0.07, 0.2, 0.12], [-0.07, 0.2, -0.12], [0.07, 0.2, -0.12]].map(([x, y, z]) => { const p = new THREE.Group(); p.position.set(x, y, z); p.add(maillage(G.patte, false, false)); gM.add(p); return p; });
      tete.add(maillage(G.tete));
      corps.add(gA, gM, tete);
      let petitDos = null;
      if (avecBebe) { petitDos = maillage(G.bebe, false); corps.add(petitDos); }
      gM.visible = false;
      let phase = Math.random() * 10, regard = 0, voulu = 0, prochain = 1 + Math.random() * 3, mange = 0, repas = 3 + Math.random() * 5;
      return {
        objet,
        animer(dt, temps, mode, branche) {
          const enMarche = mode === 'marche';
          gA.visible = !enMarche;
          gM.visible = enMarche;
          if (enMarche) {
            phase += dt * 12;
            pattes.forEach((p, k) => { p.rotation.x = Math.sin(phase + (k === 0 || k === 3 ? 0 : PI)) * 0.65; });
            gM.position.y = Math.abs(Math.sin(phase)) * 0.015;
            tete.position.set(0, 0.25, 0.19);
            tete.rotation.set(0, 0, 0);
            if (petitDos) petitDos.position.set(0, 0.37, 0.0);
            return;
          }
          // assis : il regarde autour de lui, de temps en temps porte quelque chose à sa bouche
          if ((prochain -= dt) < 0) { prochain = 1.5 + Math.random() * 4; voulu = (Math.random() - 0.5) * 1.8; }
          regard = tourne(regard, voulu, dt * 3);
          tete.position.set(0, 0.37 + (branche ? 0 : 0), 0.035);
          tete.rotation.set(0.1 * Math.sin(temps * 0.7), regard, 0);
          if ((repas -= dt) < 0) { mange = 1.6; repas = 4 + Math.random() * 7; }
          mange = Math.max(0, mange - dt);
          brasP.rotation.x = -1.7 * Math.sin(Math.min(1, mange / 1.6) * PI);
          if (petitDos) petitDos.position.set(0, 0.36, -0.1);
        },
      };
    },
  };
}

// ---------------------------------------------------------------- Le sol
function aspectSol(P, x, z, h) {
  const bruit = bruitDoux(x, z, 3.5), b2 = bruitDoux(x * 0.5 + 9, z * 0.5, 3);
  if (h < -0.4) return [h < -4 ? '#3e4a52' : bruit > 0.5 ? '#5a6460' : '#4e5a5c', M.roche];
  // le quai : le béton ; la rue et la route : le goudron ; l'entrée de Shiratani : le goudron du parking
  if (dansRect(QUAI, x, z, 0.1) && h > Y_PORT - 0.3) return [bruit > 0.5 ? '#bdb8ad' : '#b3aea2', M.dalles];
  if (dansRect(RUE, x, z, 0.05) || dansRect(ENTREE, x, z, 0.05)) return [bruit > 0.5 ? '#77746f' : '#6f6c67', M.route];
  { const l = surLaLigne(ROUTE, x, z); if (l.d < 3.05) return [bruit > 0.5 ? '#6e6c69' : '#666461', M.route]; }
  // l'enceinte du sanctuaire : le gravier clair (玉砂利)
  if (dansRect(JINJA, x, z, 0.1)) return [bruit > 0.5 ? '#d6cfbf' : '#cdc6b5', M.terre];
  // le rivage : les rochers mouillés ; la rivière : son lit de granite clair et ses galets ; le ruisseau, le ravin
  const d = z - zBord(x);
  if (d < 2.6 || h < 0.8) return [h < 0.6 ? '#4d4a43' : bruit > 0.5 ? '#9a948a' : '#8a847a', M.roche];
  if (dansRect(B_RIVIERE, x, z)) { const l = surLaLigne(RIVIERE, x, z); if (l.d < largeRiviere(l.s) + 1.4 + 0.6 * bruit) return [l.d < largeRiviere(l.s) ? '#7f7a70' : bruit > 0.5 ? '#aaa49a' : '#9d978d', M.roche]; }
  if (dansRect(B_RUISSEAU, x, z) && surLaLigne(RUISSEAU, x, z).d < 0.75) return [bruit > 0.5 ? '#5f5c52' : '#55524a', M.roche];
  if (dansRect(B_RAVIN, x, z) && surLaLigne(RAVIN, x, z).d < 0.7) return [bruit > 0.5 ? '#5f5c52' : '#55524a', M.roche];
  // le haut du Taiko-iwa : le granite nu, un peu de lichen
  if (aLaPlace(TAIKO, x, z) < 1.2) return [b2 > 0.7 ? '#8f9a7a' : bruit > 0.5 ? '#b4aea2' : '#a9a397', M.roche];
  // les escaliers de pierre : la pierre ; le palier et le dedans de la souche de Wilson : la terre sombre
  if (surEsc(ESC_PIERRE, x, z, 0.3) || surEsc(ESC_TAIKO, x, z, 0.3)) return ['#9d978d', M.roche];
  if (dansRect(PALIER_WILSON, x, z, 0.2) || Math.hypot(x - WILSON.x, z - WILSON.z) < WILSON.r + 0.2) return [bruit > 0.5 ? '#5e4a3a' : '#544234', M.terre];
  // la voie du train : le ballast brun-gris, entre les traverses
  { const l = surLaLigne(VOIE, x, z); if (l.d < 1.0) return [bruit > 0.5 ? '#6e655a' : '#655d53', M.terre]; }
  // les sentiers de terre : la terre et les racines
  for (const c of SENTIERS) { if (c.pts === ROUTE || c.pts === VOIE) continue; const l = surLaLigne(c.pts, x, z); if (l.d < c.demi + 0.15 * bruit) return [bruit > 0.55 ? '#7a5e44' : '#6e543d', M.terre]; }
  if (dansRect(DEVANT_HUTTE, x, z, 0.1) || dansRect(TSUJI, x, z, 0.1) || aLaPlace(RECOIN, x, z) < 0.1) return [bruit > 0.55 ? '#7a5e44' : '#6e543d', M.terre];
  // la forêt de mousse : la mousse partout (la clairière et tout autour)
  if (aLaPlace(KOKE, x, z) < 6 || Math.hypot(x - CREUX.x, z - CREUX.z) < 7) return [bruit > 0.6 ? '#7aa648' : bruit > 0.3 ? '#6a9a40' : '#5f8a3a', M.mousse];
  // le village : les jardins (l'herbe), entre la mer et la forêt
  if (z < -14) return [bruit > 0.6 ? '#7fae57' : bruit > 0.3 ? '#74a24e' : '#689647', M.herbe];
  // la forêt : les aiguilles rousses des cèdres, des plaques de mousse ; au loin, la forêt sombre
  if (Math.hypot(x - 20, z - 40) > 150) return [bruit > 0.6 ? '#3e5636' : '#44603a', M.sousBois];
  return [b2 > 0.45 ? (bruit > 0.5 ? '#5f8a3a' : '#557f34') : bruit > 0.6 ? '#7a5a40' : bruit > 0.3 ? '#6e543a' : '#654c34', b2 > 0.45 ? M.mousse : M.sousBois];
}

// ---------------------------------------------------------------- Les textes du lieu
// (les noms, les faits et les dates : les fiches du ministère du tourisme (mlit.go.jp/tagengo-db) ; ce que les gens disent « on
// dit », c'est ce qu'on raconte, pas un fait)
const TEXTES = {
  fr: {
    noms: { batelier: 'Le batelier', pecheur: 'Le pêcheur', touriste: 'La randonneuse', touriste2: 'Le randonneur', pretre: 'Le prêtre', artisan: 'L’artisan', loueuse: 'La loueuse', theiere: 'La marchande de thé', serveuse: 'La serveuse', cuisinier: 'Le cuisinier', mangeur: 'Le client', dineuse: 'La cliente', dineur: 'Le client', mamie: 'La grand-mère', chauffeur: 'Le chauffeur du bus', guichet: 'La dame du guichet', guide: 'La guide', randonneur: 'Le randonneur', photographe: 'La photographe', videaste: '@random_japan_place', refuge: 'Le randonneur du refuge', sommets: 'Le randonneur', agent: 'L’agent des sentiers', marcheur: 'La marcheuse', amoureuse: 'L’amoureuse', amoureux: 'L’amoureux', guideJomon: 'La guide', onigiri: 'Le randonneur', ancien: 'Le vieux monsieur' },
    tampons: {
      yakujinja: ['Le sanctuaire de l’île', 'au bout du quai, à l’est : prier au sanctuaire Yaku-jinja'],
      sarushika: ['Le singe et le cerf', 'dans la forêt de mousse, côté est : regarder le singe sur sa branche, et le cerf dessous'],
      taikoiwa: ['Le rocher Taiko-iwa', 'en haut des marches de pierre, après le col de Tsuji : regarder les sommets de l’île'],
      wilson: ['Le cœur de la souche', 'dans la souche de Wilson, sur le sentier d’Ōkabu : lever les yeux au bon endroit'],
      jomonsugi: ['Le Jōmon Sugi', 'au bout du sentier, sur la plateforme de bois : regarder le plus vieux cèdre de l’île'],
    },
    batelier: ['Nous y voilà : Yakushima ! L’île des cèdres millénaires, et de la pluie.', 'Prends ton temps : je t’attends ici, au port de Miyanoura.'],
    batelierNuit: ['La nuit, la mer est calme autour de l’île. On voit les étoiles au-dessus des montagnes.'],
    batelierRetour: ['Tu veux rentrer à Udo ?'],
    arrivee: ['Le bateau accoste au port de Miyanoura. Voilà Yakushima : ses montagnes couvertes de forêt montent jusque dans les nuages !'],
    batelierAttend: ['Comme tu veux. Le bateau ne part pas sans toi.'],
    batelierPart: ['En route ! Tiens-toi bien, la houle se lève au large.'],
    bateau: ['Le bateau du batelier d’Udo : une coque blanche, une bande bleue, le drapeau des pêcheurs en haut du mât.'],
    bateauNuit: ['La nuit, le bateau dort contre le quai. L’eau clapote contre sa coque.'],
    pecheur: ['Ce sont des poissons volants, des « tobiuo ». Ils filent au-dessus des vagues avec leurs grandes nageoires, comme des ailes.', 'Ici, on en pêche beaucoup. Goûte-les frits au restaurant, en haut de la rue !'],
    touriste: ['On vient pour le Jōmon Sugi ! Il paraît qu’il a des milliers d’années.', 'Et pour la pluie, j’ai pris trois vestes. On dit qu’ici, il pleut « trente-cinq jours par mois » !'],
    touriste2: ['« Trente-cinq jours de pluie par mois » : c’est une phrase d’un roman de Hayashi Fumiko, « Nuages flottants ».', 'C’est pour ça que la mousse est partout dans la forêt.'],
    pretre: ['Bienvenue au Yaku-jinja, le sanctuaire de l’île. On le connaît depuis plus de mille ans.', 'Son dieu est Hikohohodemi, qu’on appelle aussi Yamasachihiko… le père du dieu d’Udo ! Tu viens de chez son fils, en somme.', 'Son vrai sanctuaire est tout en haut du Miyanoura-dake, le plus haut sommet de Kyūshū : un petit autel entre les gros rochers.'],
    pretreNuit: ['La nuit, la montagne dort. Au printemps et à l’automne, les gens des villages montent aux sommets prier les dieux : le « take-mairi ».', 'Ils portent du sable de la plage jusqu’en haut, et redescendent avec de petites branches pour ceux qui attendent en bas.'],
    yakujinja: ['Tu sonnes la cloche et tu frappes deux fois dans tes mains.', 'Ici, on prie Hikohohodemi, le dieu des montagnes et de la mer de l’île — le père du dieu d’Udo.'],
    yakujinjaNuit: ['Dans la nuit, le toit de cuivre luit sous la lanterne. Tu sonnes la cloche et tu frappes deux fois dans tes mains.'],
    yakujinjaCompagnon: { kon: ['« Le père et le fils, chacun de son côté de la mer… Je suis sûr qu’ils se parlent par les vagues. »'], pon: ['« Pon ! Je lui ai demandé un beau temps pour la randonnée. Il a l’air gentil. »'], chapu: ['« Chapu ! On a salué toute la famille, maintenant ! »'], gao: ['« Gao… Un gardien de l’île. Je le salue bien bas. »'], fuwa: ['« Fuwa… Yamasachihiko est allé au palais de la mer, chez mon peuple. Il a épousé la princesse ! »'], saya: ['« Les montagnes de l’île sont ses montagnes… Les cèdres lui appartiennent un peu. »'] },
    artisan: ['Des objets en bois de yakusugi : des bols, des plateaux, des baguettes. Regarde ses cernes, serrés comme les pages d’un livre.', 'Ce bois est plein de résine : il ne pourrit presque pas. On ne coupe plus les yakusugi : ce bois-là vient d’arbres tombés, ou coupés il y a très longtemps.'],
    loueuse: ['Des chaussures de marche, des vestes de pluie, des sacs… Sur le sentier du Jōmon Sugi, on marche toute la journée.', 'Et ici, il ne faut jamais partir sans veste de pluie. Jamais !'],
    theiere: ['Le thé de l’île, le « Yakushima-cha », cultivé au pied des montagnes.', 'Il pleut beaucoup, l’air est doux : les feuilles de thé aiment ça. Tu sens ? Ça sent la forêt mouillée.'],
    serveuse: ['Bienvenue ! Le poisson volant frit, c’est notre spécialité : on le mange de la tête à la queue.', 'Et le maquereau « au cou cassé » est arrivé ce matin, tout frais.'],
    cuisinier: ['Le « kubiore saba », le maquereau au cou cassé : les pêcheurs de l’île lui cassent le cou dès qu’il est pêché, pour qu’il reste frais.', 'Comme ça, on peut le manger cru, en sashimi. Ailleurs, le maquereau, on le cuit !'],
    mangeur: ['Mmmh… Le poisson volant frit, c’est croustillant. On croque même les nageoires !', 'Demain, je pars à cinq heures pour le Jōmon Sugi. Il faut manger beaucoup.'],
    dineuse: ['Le sashimi de maquereau, je n’en avais jamais mangé. Il est doux, presque sucré.'],
    dineur: ['Après le repas : un jus de « tankan », l’orange de l’île. On la récolte en hiver.'],
    mamie: ['Quand j’étais petite, mon père travaillait à Kosugidani, le village des bûcherons dans la montagne.', 'Il y avait une école là-haut ! On descendait le bois par le petit train. Il n’y a plus personne, maintenant… seulement la forêt.'],
    chauffeur: ['Le bus monte du port jusqu’ici, à l’entrée de Shiratani Unsuikyō. Ça grimpe, hein ?', 'Attention aux singes et aux cerfs sur la route : ils se promènent comme chez eux.'],
    guichet: ['Bienvenue à Shiratani Unsuikyō ! Ici, on donne une petite participation pour l’entretien de la forêt et des sentiers.', 'Merci pour la forêt ! Bonne marche, et restez bien sur les sentiers.'],
    guide: ['Bienvenue dans la forêt de Shiratani ! Quelques règles : on reste sur les sentiers, on ne marche pas sur la mousse, on ne donne rien à manger aux singes ni aux cerfs.', 'Plus haut, la forêt de mousse, puis le col de Tsuji : à droite, le rocher Taiko-iwa ; à gauche, la voie du petit train qui mène au Jōmon Sugi.'],
    guideChampignons: ['Oh, et si tu passes la nuit au refuge… Certaines nuits, de tout petits champignons brillent en vert dans la forêt de mousse.', 'Je les ai vus, une fois. On aurait dit qu’ils montraient un chemin…'],
    guideNuit: ['La nuit, la forêt est noire comme de l’encre. Ne quitte pas le sentier !'],
    randonneur: ['Ces marches, c’est un bon échauffement ! Au bout, le pont suspendu au-dessus de la rivière.', 'Écoute : la cascade Hiryū-otoshi glisse sur le granite, juste là.'],
    cascade: ['La cascade Hiryū-otoshi (飛流おとし) : la rivière de Shiratani glisse sur une grande dalle de granite clair, en écume blanche.', 'Le granite de Yakushima est sorti de sous la terre il y a très longtemps : c’est lui qui fait les montagnes de l’île.'],
    cascadeNuit: ['Dans le noir, on ne voit plus la cascade. On l’entend glisser sur la pierre.'],
    pont: ['Le pont suspendu Satsuki (さつき吊橋), au-dessus de la gorge de la rivière. Il bouge un peu quand on marche dessus !'],
    pontNuit: ['La nuit, la rivière gronde tout en bas, sous le pont.'],
    photographe: ['Tu as vu toutes ces mousses ? Il y en a des centaines de sortes, ici.', 'Avec la pluie, elles deviennent toutes vertes et toutes douces. On ne marche pas dessus, hein : elles mettent des années à repousser.'],
    videaste: ['Hé ! Moi, je filme la forêt de mousse pour TikTok. La lumière qui passe entre les cèdres… Tu veux voir ma vidéo de Yakushima ?'],
    refuge: ['Ce soir, je dors au refuge de Shiratani. Une petite cabane de montagne, ouverte à tous les marcheurs.', 'La nuit, il paraît qu’on voit les champignons briller dans la forêt de mousse…'],
    refugeSoir: ['On attend la nuit ensemble ?'],
    refugeNon: ['Comme tu veux. La forêt ne s’en va pas !'],
    refugeNuitTombe: ['Voilà la nuit… Écoute les grenouilles près du ruisseau. Et regarde bien par terre, dans la forêt de mousse.'],
    refugeNuit: ['Tu veux revoir le matin ?'],
    refugeReste: ['Profite de la nuit. Les étoiles passent entre les branches.'],
    refugeMatin: ['Le matin… La brume monte de la forêt. Les singes vont bientôt se réveiller.'],
    sommets: ['Regarde : au fond, le Miyanoura-dake, le plus haut sommet de Kyūshū (1 936 m), et à côté le Nagata-dake.', 'En bas, la vallée de la rivière Anbō, et Kosugidani, l’ancien village des bûcherons.'],
    taikoiwa: ['Du haut du Taiko-iwa (太鼓岩), le « rocher du tambour », un dôme de granite : toutes les montagnes du cœur de l’île.', 'Au fond, le Miyanoura-dake (1 936 m), le plus haut sommet de Kyūshū, et le Nagata-dake (1 886 m). Leurs sommets sont faits de gros blocs de granite.'],
    taikoiwaNuit: ['La nuit, les montagnes ne sont plus que des ombres sous les étoiles. Le vent souffle sur le rocher.'],
    taikoiwaCompagnon: { kon: ['« On voit toute l’île d’ici… Les nuages passent sous nous ! »'], pon: ['« Pon pon ! On tape sur le rocher du tambour ? Pon ! »'], chapu: ['« Chapuuu ! Toute cette eau qui descend des montagnes… je veux toutes les rivières ! »'], gao: ['« Gao ! Un poste de garde parfait. Je surveille l’île. »'], fuwa: ['« Fuwa… Les dragons de pluie dorment sur ces sommets. »'], saya: ['« Toutes ces forêts… Mille ans, deux mille ans. Elles nous regardent passer. »'] },
    sarushika: ['Sur sa branche, un singe de Yakushima mange des feuilles… et en fait tomber. Dessous, un cerf les attrape et les mâche.', 'À Yakushima, on voit souvent les cerfs sous les singes : ils mangent ce qu’ils laissent tomber. Les deux sont plus petits que ceux du continent.'],
    sarushikaNuit: ['La nuit, le singe dort dans les branches, et le cerf s’est couché dans la mousse.'],
    sarushikaCompagnon: { kon: ['« Le singe fait tomber, le cerf ramasse… Ils travaillent ensemble ! »'], pon: ['« Pon ! Si un singe me faisait tomber des gâteaux, je resterais sous son arbre toute la journée. »'], chapu: ['« Chapu ! Ils sont copains, ces deux-là ! »'], gao: ['« Gao… Le cerf a choisi un bon garde du corps. »'], fuwa: ['« Fuwa… Dans cette forêt, chacun aide un peu l’autre. »'], saya: ['« Les arbres nourrissent le singe, le singe nourrit le cerf… Tout tourne, ici. »'] },
    singe: ['Un singe de Yakushima (ヤクシマザル) : plus petit que ceux du continent, le poil épais, le visage tout rouge.', 'On ne lui donne rien à manger : il pourrait prendre l’habitude de voler les sacs des marcheurs !'],
    singeBranche: ['Le singe sur sa branche te regarde, et continue de manger ses feuilles.'],
    singeBebe: ['Une maman singe, et son petit accroché sur son dos. Il regarde tout, les yeux ronds.'],
    cerf: ['Un cerf de Yakushima (ヤクシカ), plus petit que ceux de Nara ou de Miyajima.', 'Il n’a pas peur : il vit ici depuis toujours. On le regarde, sans le toucher.'],
    cerfNuit: ['Le cerf dort, couché dans la mousse. Chut…'],
    papillon: ['Un papillon traverse un rayon de soleil, entre les cèdres.'],
    libellule: ['Une libellule se pose sur un rocher moussu, au bord de l’eau.'],
    grenouille: ['Une rainette toute verte, sur une pierre du ruisseau.', 'La nuit, on entend ses cousines chanter partout dans la forêt.'],
    champignons: ['De tout petits champignons pâles, sur un tronc tombé couvert de mousse. On les voit à peine.'],
    champignonsNuit: ['Regarde… les petits champignons brillent ! Une lumière verte, toute douce, sur le bois mort.', 'Il y en a d’autres, plus loin, vers l’ouest… Ils font comme un chemin dans la forêt.'],
    champignonsNuitCompagnon: { kon: ['« Des petites lanternes de la forêt… Suivons-les ! »'], pon: ['« Pon ?! Des champignons qui brillent… On ne les mange pas, hein ? On les suit. »'], chapu: ['« Chapuuu ! Un chemin de lumières ! Par là, par là ! »'], gao: ['« Gao… Un passage gardé par des lueurs. Je passe devant. »'], fuwa: ['« Fuwa… Comme les lumières du fond de la mer. Elles nous appellent. »'], saya: ['« La forêt allume ses lampes… Elle veut nous montrer quelque chose. »'] },
    creux: ['Un vieux cèdre mort, cassé, tout creux. Il fait noir dedans.', 'De tout petits champignons poussent sur le bois du fond.'],
    creuxCompagnon: { kon: ['« La guide parlait de champignons qui brillent la nuit… Et si on revenait quand il fait noir ? »'], pon: ['« Pon… Il fait trop noir là-dedans. Revenons la nuit, avec les champignons qui brillent ! »'], chapu: ['« Chapu ! La nuit, ça doit être plus joli, là-dedans. »'], gao: ['« Gao. Rien à voir de jour. La nuit, peut-être… »'], fuwa: ['« Fuwa… Ce creux attend la nuit. »'], saya: ['« Ce vieux cèdre garde un secret… La nuit le dira. »'] },
    creuxNuit: ['Les champignons ont mené jusqu’ici… Au fond du vieux cèdre creux, quelque chose s’allume.'],
    creuxKoban: ['Un cercle de champignons s’allume, un par un… et au milieu, sur un coussin de mousse, brille une pièce d’or : un koban !'],
    creuxKobanCompagnon: { kon: ['« La forêt nous l’a gardé… Merci, les petits champignons. »'], pon: ['« Pon pon pon ! De l’or ! Mon oncle Bunbuku va être content ! »'], chapu: ['« Chapuuu ! Un trésor dans un arbre ! »'], gao: ['« Gao ! Bien gardé, bien trouvé. »'], fuwa: ['« Fuwa… La forêt a des trésors comme la mer. »'], saya: ['« Le vieux cèdre te l’a donné. Il t’a trouvé gentil. »'] },
    creuxApres: ['Le vieux cèdre creux. Les petits champignons veillent dans le noir.'],
    creuxApresNuit: ['Au fond du creux, le cercle des champignons brille doucement. La forêt te dit bonsoir.'],
    hokora: ['Tu frappes deux fois dans tes mains devant le petit sanctuaire de la souche, le Tamashiro-jinja (木魂神社).', 'Des pièces brillent à ses pieds : chaque marcheur en laisse une.'],
    wilson: ['Tu lèves les yeux… Là-haut, le ciel fait un cœur, entre les bords de la vieille souche !', 'La souche de Wilson : un cèdre de 2 000 à 3 000 ans, abattu au XVIe siècle (13,8 m de tour). On dit que voir le cœur porte chance en amour.'],
    wilsonNuit: ['Tu lèves les yeux… Dans le noir, le cœur est plein d’étoiles.'],
    wilsonCompagnon: { kon: ['« Un cœur dans le ciel… Il est pour toi. »'], pon: ['« Pon ! Je vois un cœur… ou un gâteau ? Non, un cœur ! »'], chapu: ['« Chapu chapu ! Le ciel est amoureux ! »'], gao: ['« Gao… Bien vu. Il fallait trouver le bon endroit. »'], fuwa: ['« Fuwaaa… Un cœur pour toutes les personnes qui ont levé les yeux ici. »'], saya: ['« Le vieil arbre est parti, mais il a laissé son cœur. »'] },
    amoureuse: ['On dit que si on voit le cœur dans la souche de Wilson, on trouve l’amour !', 'Il faut se mettre au bon endroit, à l’intérieur, et lever les yeux… On cherche depuis dix minutes !'],
    amoureux: ['Ce cèdre a été abattu il y a plus de quatre cents ans. Un botaniste anglais, Ernest Wilson, l’a fait connaître en 1914 : d’où son nom.'],
    agent: ['Cette voie, c’est le train forestier d’Anbō, ouvert en 1922 pour descendre le bois jusqu’au port.', 'Aujourd’hui, on s’en sert encore : on monte du matériel pour entretenir les sentiers, et on descend les cèdres tombés. Les planches entre les rails, c’est pour les marcheurs. Attention, elles glissent quand il pleut !'],
    marcheur: ['On suit la voie du petit train pendant des heures, jusqu’au sentier d’Ōkabu.', 'Ensuite, ça grimpe ! Des escaliers de bois jusqu’au Jōmon Sugi.'],
    guideJomon: ['Le Jōmon Sugi a été retrouvé en 1966 par Iwakawa Teiji, un habitant de l’île. Il l’avait appelé « Ōiwa-sugi ».', 'Un journal a parlé de lui comme du cèdre du temps des Jōmon, et le nom est resté. Il aurait entre 2 000 et 7 200 ans… personne ne le sait vraiment.'],
    onigiri: ['Ouf… Cinq heures de marche pour arriver ici. Mais ça valait le coup.', 'Un onigiri face au Jōmon Sugi : le meilleur repas de ma vie !'],
    ancien: ['Je suis venu ici quand j’étais jeune. À l’époque, on marchait jusqu’au pied de l’arbre.', 'Trop de monde abîmait ses racines : en 1996, on a construit cette plateforme. C’est mieux comme ça. Il a encore des milliers d’années à vivre.'],
    jomonsugi: ['Le Jōmon Sugi (縄文杉) : le plus vieux et le plus gros cèdre de Yakushima. 25,3 m de haut, 16,4 m de tour.', 'Son écorce bosselée ressemble aux poteries de l’époque Jōmon, d’où son nom. Il aurait entre 2 000 et 7 200 ans.'],
    jomonsugiNuit: ['La nuit, le Jōmon Sugi n’est plus qu’une immense ombre. Il a vu passer des milliers de nuits comme celle-là.'],
    jomonsugiCompagnon: { kon: ['« Il était déjà vieux quand le premier sanctuaire a été construit… Je me sens tout petit. »'], pon: ['« Pon… Je ne dis rien. Il faut être poli devant un ancêtre pareil. »'], chapu: ['« Chapu… Il est grand comme une montagne ! »'], gao: ['« Gao… Le plus vieux gardien de l’île. Je m’incline. »'], fuwa: ['« Fuwa… Il a écouté la pluie pendant des milliers d’années. »'], saya: ['« Grand-père… Je l’entends respirer, tout doucement. »'] },
    'panneau-entree': ['« 白谷雲水峡 Shiratani Unsuikyō »', 'Une forêt protégée de 424 hectares, entre 600 et 1 050 m d’altitude : de grands rochers, des cascades, des arbres très vieux et des centaines de sortes de mousses.'],
    'panneau-carte': ['« Les sentiers de Shiratani »', 'Le sentier de pierre longe la rivière jusqu’au pont suspendu Satsuki, puis monte à la forêt de mousse et au col de Tsuji. Du col : le rocher Taiko-iwa, ou la voie du train vers la souche de Wilson et le Jōmon Sugi.'],
    'panneau-yayoi': ['« 弥生杉 Yayoi-sugi »', 'Environ 3 000 ans, 26,1 m de haut, 8,1 m de tour. On ne l’a jamais abattu : sa forme tordue ne donnait pas de belles planches.'],
    'panneau-nidai': ['« 二代大杉 Nidai-ōsugi »', 'Le « grand cèdre de deuxième génération » : un jeune cèdre a poussé sur la souche d’un ancien qu’on avait abattu. C’est le plus grand de la vallée (32 m).'],
    'panneau-kuguri': ['« くぐり杉 Kuguri-sugi »', 'Le « cèdre sous lequel on passe » : ses racines font une arche au-dessus du sentier.'],
    'panneau-koke': ['« 苔むす森 La forêt de mousse »', 'Très humide, pleine de rochers : la mousse couvre tout. On reste sur le sentier : elle met des années à repousser.'],
    'panneau-tsuji': ['« 辻峠 Le col de Tsuji »', '↑ 太鼓岩 Taiko-iwa · ← 縄文杉 Jōmon Sugi (par la voie du train) · ↓ 白谷雲水峡 Shiratani Unsuikyō'],
    'panneau-taiko': ['« 太鼓岩 Taiko-iwa »', 'Le « rocher du tambour », un dôme de granite à 1 050 m. De là-haut : les sommets du cœur de l’île et la vallée de l’Anbō.'],
    'panneau-voie': ['« 安房森林軌道 La voie forestière d’Anbō »', 'Construite à partir de 1922 pour descendre le bois jusqu’au port d’Anbō. Encore utilisée pour l’entretien des sentiers. Attention : les planches glissent par temps de pluie.'],
    'panneau-kosugi': ['« 小杉谷 Kosugidani »', 'Ici vivait le village des bûcherons, fondé en 1923 : 540 habitants en 1960, une école. Il a fermé en 1970. Les photos montrent la vie d’autrefois.'],
    'panneau-wilson': ['« ウィルソン株 La souche de Wilson »', 'Un cèdre de 2 000 à 3 000 ans, abattu au XVIe siècle (13,8 m de tour). Dedans : une source et le petit sanctuaire Tamashiro. Le botaniste Ernest Wilson l’a fait connaître en 1914.'],
    'panneau-jomon': ['« 縄文杉 Le Jōmon Sugi »', '25,3 m de haut, 16,4 m de tour ; de 2 000 à 7 200 ans. Retrouvé en 1966 par Iwakawa Teiji. La plateforme (1996) protège ses racines : on le regarde d’ici.'],
    'panneau-jinja': ['« 益救神社 Yaku-jinja »', 'Le sanctuaire de l’île, connu depuis le Xe siècle. Son dieu : Hikohohodemi (Yamasachihiko). Son sanctuaire principal est en haut du Miyanoura-dake (1 936 m).'],
    'panneau-menu': ['« お品書き Le menu »', 'Poisson volant frit (とびうお唐揚げ) · Maquereau au cou cassé (首折れサバ), en sashimi · Galettes de poisson (つけあげ) · Nouilles au bouillon de poisson volant · Jus de tankan · Thé de Yakushima'],
  },
  en: {
    noms: { batelier: 'The boatman', pecheur: 'The fisherman', touriste: 'The hiker', touriste2: 'The hiker', pretre: 'The priest', artisan: 'The craftsman', loueuse: 'The rental clerk', theiere: 'The tea seller', serveuse: 'The waitress', cuisinier: 'The cook', mangeur: 'The customer', dineuse: 'The customer', dineur: 'The customer', mamie: 'The grandmother', chauffeur: 'The bus driver', guichet: 'The ticket lady', guide: 'The guide', randonneur: 'The hiker', photographe: 'The photographer', videaste: '@random_japan_place', refuge: 'The hut hiker', sommets: 'The hiker', agent: 'The trail warden', marcheur: 'The walker', amoureuse: 'The girlfriend', amoureux: 'The boyfriend', guideJomon: 'The guide', onigiri: 'The hiker', ancien: 'The old man' },
    tampons: {
      yakujinja: ['The island’s shrine', 'at the east end of the quay: pray at Yaku Shrine'],
      sarushika: ['The monkey and the deer', 'in the moss forest, on its east side: watch the monkey on its branch, and the deer below'],
      taikoiwa: ['Taiko-iwa Rock', 'up the stone steps, past Tsuji Pass: look at the island’s peaks'],
      wilson: ['The heart in the stump', 'inside Wilson’s Stump, on the Ōkabu trail: look up from the right spot'],
      jomonsugi: ['Jōmon Sugi', 'at the end of the trail, on the wooden deck: look at the island’s oldest cedar'],
    },
    batelier: ['Here we are: Yakushima! The island of thousand-year-old cedars, and of rain.', 'Take your time: I’ll wait for you here, at Miyanoura harbour.'],
    batelierNuit: ['At night the sea is calm around the island. You can see the stars above the mountains.'],
    batelierRetour: ['Do you want to go back to Udo?'],
    arrivee: ['The boat docks at Miyanoura harbour. Here is Yakushima: its forest-covered mountains rise into the clouds!'],
    batelierAttend: ['As you like. The boat won’t leave without you.'],
    batelierPart: ['Off we go! Hold on tight, the swell is rising out at sea.'],
    bateau: ['The Udo boatman’s boat: a white hull, a blue stripe, the fishermen’s flag at the top of the mast.'],
    bateauNuit: ['At night the boat sleeps against the quay. Water laps at its hull.'],
    pecheur: ['These are flying fish, “tobiuo”. They glide over the waves on their big fins, like wings.', 'We catch a lot of them here. Try them fried at the restaurant, up the street!'],
    touriste: ['We came for Jōmon Sugi! They say it’s thousands of years old.', 'And for the rain I brought three jackets. They say it rains “thirty-five days a month” here!'],
    touriste2: ['“Thirty-five days of rain a month”: that’s a line from a novel by Hayashi Fumiko, “Floating Clouds”.', 'That’s why there’s moss everywhere in the forest.'],
    pretre: ['Welcome to Yaku Shrine, the island’s shrine. It has been known for more than a thousand years.', 'Its god is Hikohohodemi, also called Yamasachihiko… the father of Udo’s god! You’ve come from his son’s place, so to speak.', 'Its true sanctuary is at the very top of Miyanoura-dake, the highest peak in Kyūshū: a small altar among the great rocks.'],
    pretreNuit: ['At night the mountain sleeps. In spring and autumn, people from the villages climb to the peaks to pray to the gods: the “take-mairi”.', 'They carry sand from the beach all the way up, and come down with small branches for those waiting below.'],
    yakujinja: ['You ring the bell and clap your hands twice.', 'Here people pray to Hikohohodemi, god of the island’s mountains and sea — the father of Udo’s god.'],
    yakujinjaNuit: ['In the night, the copper roof gleams under the lantern. You ring the bell and clap your hands twice.'],
    yakujinjaCompagnon: { kon: ['“Father and son, each on his own side of the sea… I’m sure they talk through the waves.”'], pon: ['“Pon! I asked him for good weather for the hike. He looks kind.”'], chapu: ['“Chapu! We’ve greeted the whole family now!”'], gao: ['“Gao… A guardian of the island. I bow deeply.”'], fuwa: ['“Fuwa… Yamasachihiko went to the palace of the sea, to my people. He married the princess!”'], saya: ['“The island’s mountains are his mountains… The cedars belong to him a little.”'] },
    artisan: ['Things made of yakusugi wood: bowls, trays, chopsticks. Look at its rings, packed tight like the pages of a book.', 'This wood is full of resin: it hardly ever rots. Nobody cuts yakusugi any more: this wood comes from trees that fell, or were cut a very long time ago.'],
    loueuse: ['Hiking boots, rain jackets, backpacks… On the Jōmon Sugi trail you walk all day long.', 'And here you never set off without a rain jacket. Never!'],
    theiere: ['The island’s tea, “Yakushima-cha”, grown at the foot of the mountains.', 'Lots of rain, mild air: tea leaves love it. Can you smell it? It smells like a wet forest.'],
    serveuse: ['Welcome! Fried flying fish is our speciality: you eat it from head to tail.', 'And the “broken-neck” mackerel came in this morning, nice and fresh.'],
    cuisinier: ['“Kubiore saba”, broken-neck mackerel: the island’s fishermen break its neck as soon as it’s caught, so it stays fresh.', 'That way it can be eaten raw, as sashimi. Anywhere else, mackerel gets cooked!'],
    mangeur: ['Mmm… Fried flying fish is so crunchy. You even eat the fins!', 'Tomorrow I leave at five for Jōmon Sugi. I need to eat a lot.'],
    dineuse: ['I’d never had mackerel sashimi before. It’s soft, almost sweet.'],
    dineur: ['After the meal: a glass of “tankan” juice, the island’s orange. It’s picked in winter.'],
    mamie: ['When I was little, my father worked at Kosugidani, the loggers’ village up in the mountains.', 'There was a school up there! The wood came down on the little train. Nobody lives there now… only the forest.'],
    chauffeur: ['The bus comes up from the harbour to here, the entrance of Shiratani Unsuikyō. Steep, isn’t it?', 'Watch out for monkeys and deer on the road: they stroll around as if they owned it.'],
    guichet: ['Welcome to Shiratani Unsuikyō! Here we ask for a small contribution to look after the forest and the trails.', 'Thank you for the forest! Have a good walk, and stay on the trails.'],
    guide: ['Welcome to the Shiratani forest! A few rules: stay on the trails, don’t step on the moss, don’t feed the monkeys or the deer.', 'Further up: the moss forest, then Tsuji Pass. To the right, Taiko-iwa Rock; to the left, the little railway that leads to Jōmon Sugi.'],
    guideChampignons: ['Oh, and if you spend the night at the hut… On some nights, tiny mushrooms glow green in the moss forest.', 'I saw them once. It looked like they were showing a path…'],
    guideNuit: ['At night the forest is as black as ink. Don’t leave the trail!'],
    randonneur: ['These steps are a good warm-up! At the end, the suspension bridge over the river.', 'Listen: Hiryū-otoshi falls slide over the granite, right there.'],
    cascade: ['Hiryū-otoshi falls (飛流おとし): the Shiratani river slides down a great slab of pale granite in white foam.', 'Yakushima’s granite came up from deep underground long, long ago: it’s what makes the island’s mountains.'],
    cascadeNuit: ['In the dark you can’t see the falls any more. You hear them sliding over the stone.'],
    pont: ['The Satsuki suspension bridge (さつき吊橋), over the river gorge. It sways a little when you walk on it!'],
    pontNuit: ['At night the river roars far below the bridge.'],
    photographe: ['Have you seen all these mosses? There are hundreds of kinds here.', 'With the rain they turn bright green and soft. Don’t walk on them: they take years to grow back.'],
    videaste: ['Hey! I’m filming the moss forest for TikTok. The light coming through the cedars… Want to see my Yakushima video?'],
    refuge: ['Tonight I’m sleeping at the Shiratani hut. A little mountain hut, open to every hiker.', 'At night, they say you can see mushrooms glowing in the moss forest…'],
    refugeSoir: ['Shall we wait for nightfall together?'],
    refugeNon: ['As you like. The forest isn’t going anywhere!'],
    refugeNuitTombe: ['Here comes the night… Listen to the frogs by the stream. And keep an eye on the ground in the moss forest.'],
    refugeNuit: ['Do you want to see the morning again?'],
    refugeReste: ['Enjoy the night. The stars peek through the branches.'],
    refugeMatin: ['Morning… Mist rises from the forest. The monkeys will soon wake up.'],
    sommets: ['Look: in the distance, Miyanoura-dake, the highest peak in Kyūshū (1,936 m), and next to it Nagata-dake.', 'Down below, the Anbō river valley, and Kosugidani, the old loggers’ village.'],
    taikoiwa: ['From the top of Taiko-iwa (太鼓岩), the “drum rock”, a dome of granite: all the mountains at the heart of the island.', 'In the distance, Miyanoura-dake (1,936 m), the highest peak in Kyūshū, and Nagata-dake (1,886 m). Their summits are made of huge granite boulders.'],
    taikoiwaNuit: ['At night the mountains are only shadows under the stars. The wind blows across the rock.'],
    taikoiwaCompagnon: { kon: ['“You can see the whole island from here… The clouds pass below us!”'], pon: ['“Pon pon! Shall we drum on the drum rock? Pon!”'], chapu: ['“Chapuuu! All that water running down the mountains… I want every river!”'], gao: ['“Gao! A perfect lookout. I’m watching over the island.”'], fuwa: ['“Fuwa… The rain dragons sleep on those peaks.”'], saya: ['“All these forests… A thousand years, two thousand. They watch us go by.”'] },
    sarushika: ['On its branch, a Yakushima monkey eats leaves… and drops some. Below, a deer catches them and chews.', 'On Yakushima you often see deer under monkeys: they eat whatever the monkeys let fall. Both are smaller than their mainland cousins.'],
    sarushikaNuit: ['At night the monkey sleeps in the branches, and the deer has lain down in the moss.'],
    sarushikaCompagnon: { kon: ['“The monkey drops, the deer picks up… They work together!”'], pon: ['“Pon! If a monkey dropped cakes for me, I’d stay under its tree all day.”'], chapu: ['“Chapu! Those two are friends!”'], gao: ['“Gao… The deer picked a good bodyguard.”'], fuwa: ['“Fuwa… In this forest, everyone helps someone a little.”'], saya: ['“The trees feed the monkey, the monkey feeds the deer… Everything goes round here.”'] },
    singe: ['A Yakushima macaque (ヤクシマザル): smaller than mainland monkeys, with thick fur and a bright red face.', 'Never feed it: it could get into the habit of stealing hikers’ bags!'],
    singeBranche: ['The monkey on its branch looks at you, and goes on eating its leaves.'],
    singeBebe: ['A mother monkey, with her baby clinging to her back. It stares at everything with round eyes.'],
    cerf: ['A Yakushima deer (ヤクシカ), smaller than the deer of Nara or Miyajima.', 'It isn’t afraid: it has always lived here. We watch it without touching it.'],
    cerfNuit: ['The deer is asleep, lying in the moss. Shh…'],
    papillon: ['A butterfly crosses a sunbeam between the cedars.'],
    libellule: ['A dragonfly lands on a mossy rock at the water’s edge.'],
    grenouille: ['A bright green tree frog on a stone in the stream.', 'At night you can hear its cousins singing all over the forest.'],
    champignons: ['Tiny pale mushrooms on a fallen, moss-covered trunk. You can barely see them.'],
    champignonsNuit: ['Look… the little mushrooms are glowing! A soft green light on the dead wood.', 'There are more further on, to the west… They make a sort of path through the forest.'],
    champignonsNuitCompagnon: { kon: ['“Little lanterns of the forest… Let’s follow them!”'], pon: ['“Pon?! Glowing mushrooms… We don’t eat them, right? We follow them.”'], chapu: ['“Chapuuu! A path of lights! This way, this way!”'], gao: ['“Gao… A passage guarded by glows. I’ll go first.”'], fuwa: ['“Fuwa… Like the lights at the bottom of the sea. They’re calling us.”'], saya: ['“The forest is lighting its lamps… It wants to show us something.”'] },
    creux: ['An old dead cedar, broken and hollow. It’s dark inside.', 'Tiny mushrooms grow on the wood at the back.'],
    creuxCompagnon: { kon: ['“The guide talked about mushrooms that glow at night… What if we came back when it’s dark?”'], pon: ['“Pon… It’s too dark in there. Let’s come back at night, with the glowing mushrooms!”'], chapu: ['“Chapu! It must be prettier in there at night.”'], gao: ['“Gao. Nothing to see by day. At night, maybe…”'], fuwa: ['“Fuwa… This hollow is waiting for the night.”'], saya: ['“This old cedar keeps a secret… The night will tell.”'] },
    creuxNuit: ['The mushrooms led all the way here… Deep inside the old hollow cedar, something lights up.'],
    creuxKoban: ['A ring of mushrooms lights up, one by one… and in the middle, on a cushion of moss, a gold coin shines: a koban!'],
    creuxKobanCompagnon: { kon: ['“The forest kept it for us… Thank you, little mushrooms.”'], pon: ['“Pon pon pon! Gold! My uncle Bunbuku will be pleased!”'], chapu: ['“Chapuuu! Treasure in a tree!”'], gao: ['“Gao! Well guarded, well found.”'], fuwa: ['“Fuwa… The forest has treasures, like the sea.”'], saya: ['“The old cedar gave it to you. It thought you were kind.”'] },
    creuxApres: ['The old hollow cedar. The little mushrooms keep watch in the dark.'],
    creuxApresNuit: ['Deep in the hollow, the ring of mushrooms glows softly. The forest wishes you good night.'],
    hokora: ['You clap twice before the stump’s little shrine, Tamashiro Shrine (木魂神社).', 'Coins shine at its feet: every hiker leaves one.'],
    wilson: ['You look up… Up there, the sky makes a heart between the edges of the old stump!', 'Wilson’s Stump: a cedar 2,000 to 3,000 years old, felled in the 16th century (13.8 m around). They say seeing the heart brings luck in love.'],
    wilsonNuit: ['You look up… In the dark, the heart is full of stars.'],
    wilsonCompagnon: { kon: ['“A heart in the sky… It’s for you.”'], pon: ['“Pon! I see a heart… or a cake? No, a heart!”'], chapu: ['“Chapu chapu! The sky is in love!”'], gao: ['“Gao… Well spotted. You had to find the right place.”'], fuwa: ['“Fuwaaa… A heart for everyone who has looked up here.”'], saya: ['“The old tree is gone, but it left its heart behind.”'] },
    amoureuse: ['They say if you see the heart in Wilson’s Stump, you find love!', 'You have to stand in the right spot inside and look up… We’ve been looking for ten minutes!'],
    amoureux: ['This cedar was felled more than four hundred years ago. An English botanist, Ernest Wilson, made it known in 1914: hence its name.'],
    agent: ['This track is the Anbō forest railway, opened in 1922 to bring timber down to the port.', 'We still use it today: we bring up materials to look after the trails, and bring down fallen cedars. The planks between the rails are for hikers. Careful, they’re slippery when it rains!'],
    marcheur: ['You follow the little railway for hours, all the way to the Ōkabu trail.', 'Then it climbs! Wooden stairs all the way up to Jōmon Sugi.'],
    guideJomon: ['Jōmon Sugi was found again in 1966 by Iwakawa Teiji, a man from the island. He called it “Ōiwa-sugi”.', 'A newspaper wrote about it as the cedar from the Jōmon era, and the name stuck. It may be between 2,000 and 7,200 years old… nobody really knows.'],
    onigiri: ['Phew… Five hours of walking to get here. But it was worth it.', 'An onigiri facing Jōmon Sugi: the best meal of my life!'],
    ancien: ['I came here when I was young. Back then, you walked right up to the foot of the tree.', 'Too many people were damaging its roots: in 1996 they built this deck. It’s better this way. It still has thousands of years to live.'],
    jomonsugi: ['Jōmon Sugi (縄文杉): the oldest and largest cedar on Yakushima. 25.3 m tall, 16.4 m around.', 'Its knobbly bark looks like Jōmon-era pottery, hence its name. It may be between 2,000 and 7,200 years old.'],
    jomonsugiNuit: ['At night Jōmon Sugi is just a huge shadow. It has seen thousands of nights like this one.'],
    jomonsugiCompagnon: { kon: ['“It was already old when the first shrine was built… I feel so small.”'], pon: ['“Pon… I won’t say a word. You must be polite before such an ancestor.”'], chapu: ['“Chapu… It’s as big as a mountain!”'], gao: ['“Gao… The island’s oldest guardian. I bow.”'], fuwa: ['“Fuwa… It has listened to the rain for thousands of years.”'], saya: ['“Grandfather… I can hear it breathing, very softly.”'] },
    'panneau-entree': ['“白谷雲水峡 Shiratani Unsuikyō”', 'A protected forest of 424 hectares, between 600 and 1,050 m up: great boulders, waterfalls, very old trees and hundreds of kinds of moss.'],
    'panneau-carte': ['“The Shiratani trails”', 'The stone trail follows the river to the Satsuki suspension bridge, then climbs to the moss forest and Tsuji Pass. From the pass: Taiko-iwa Rock, or the railway towards Wilson’s Stump and Jōmon Sugi.'],
    'panneau-yayoi': ['“弥生杉 Yayoi-sugi”', 'About 3,000 years old, 26.1 m tall, 8.1 m around. It was never felled: its twisted shape wouldn’t give good planks.'],
    'panneau-nidai': ['“二代大杉 Nidai-ōsugi”', 'The “second-generation great cedar”: a young cedar grew on the stump of an old one that had been felled. It is the tallest in the valley (32 m).'],
    'panneau-kuguri': ['“くぐり杉 Kuguri-sugi”', 'The “cedar you walk under”: its roots form an arch over the trail.'],
    'panneau-koke': ['“苔むす森 The moss forest”', 'Very damp and full of boulders: moss covers everything. Stay on the trail: it takes years to grow back.'],
    'panneau-tsuji': ['“辻峠 Tsuji Pass”', '↑ 太鼓岩 Taiko-iwa · ← 縄文杉 Jōmon Sugi (by the railway) · ↓ 白谷雲水峡 Shiratani Unsuikyō'],
    'panneau-taiko': ['“太鼓岩 Taiko-iwa”', 'The “drum rock”, a granite dome at 1,050 m. From the top: the peaks at the heart of the island and the Anbō valley.'],
    'panneau-voie': ['“安房森林軌道 The Anbō forest railway”', 'Built from 1922 to bring timber down to Anbō port. Still used to look after the trails. Careful: the planks are slippery in the rain.'],
    'panneau-kosugi': ['“小杉谷 Kosugidani”', 'The loggers’ village stood here, founded in 1923: 540 people in 1960, and a school. It closed in 1970. The photos show life back then.'],
    'panneau-wilson': ['“ウィルソン株 Wilson’s Stump”', 'A cedar 2,000 to 3,000 years old, felled in the 16th century (13.8 m around). Inside: a spring and the little Tamashiro Shrine. The botanist Ernest Wilson made it known in 1914.'],
    'panneau-jomon': ['“縄文杉 Jōmon Sugi”', '25.3 m tall, 16.4 m around; 2,000 to 7,200 years old. Found again in 1966 by Iwakawa Teiji. The deck (1996) protects its roots: we look at it from here.'],
    'panneau-jinja': ['“益救神社 Yaku Shrine”', 'The island’s shrine, known since the 10th century. Its god: Hikohohodemi (Yamasachihiko). Its main sanctuary is at the top of Miyanoura-dake (1,936 m).'],
    'panneau-menu': ['“お品書き The menu”', 'Fried flying fish (とびうお唐揚げ) · Broken-neck mackerel (首折れサバ), as sashimi · Fish cakes (つけあげ) · Flying-fish broth noodles · Tankan juice · Yakushima tea'],
  },
  ja: {
    noms: { batelier: 'せんどうさん', pecheur: 'りょうしさん', touriste: 'とざんきゃく', touriste2: 'とざんきゃく', pretre: 'かんぬしさん', artisan: 'しょくにんさん', loueuse: 'レンタルの　おねえさん', theiere: 'おちゃやさん', serveuse: 'てんいんさん', cuisinier: 'いたまえさん', mangeur: 'おきゃくさん', dineuse: 'おきゃくさん', dineur: 'おきゃくさん', mamie: 'おばあさん', chauffeur: 'バスの　うんてんしゅさん', guichet: 'うけつけの　ひと', guide: 'ガイドさん', randonneur: 'とざんきゃく', photographe: 'カメラマン', videaste: '@random_japan_place', refuge: 'こやに　とまる　ひと', sommets: 'とざんきゃく', agent: 'さぎょういんさん', marcheur: 'とざんきゃく', amoureuse: 'カップルの　かのじょ', amoureux: 'カップルの　かれ', guideJomon: 'ガイドさん', onigiri: 'とざんきゃく', ancien: 'おじいさん' },
    tampons: {
      yakujinja: ['しまの　じんじゃ', 'みなとの　ひがしの　はし：益救神社に　おまいりする'],
      sarushika: ['サルと　シカ', '苔むす森の　ひがしがわ：えだの　サルと、その下の　シカを　見る'],
      taikoiwa: ['太鼓岩', '辻峠の　先の　いしだんを　のぼって：しまの　やまやまを　見る'],
      wilson: ['かぶの　ハート', '大株歩道の　ウィルソン株の　中：ちょうど　いい　ばしょで　上を　見る'],
      jomonsugi: ['縄文杉', 'みちの　おわりの　きの　デッキ：しまで　いちばん　ふるい　スギを　見る'],
    },
    batelier: ['ついたぞ、屋久島だ！　千年の　スギと、雨の　しま。', 'ゆっくり　しておいで。宮之浦港で　まってるからな。'],
    batelierNuit: ['よるの　しまの　うみは　しずかだ。やまの　上に　ほしが　見える。'],
    batelierRetour: ['鵜戸に　かえるかい？'],
    arrivee: ['ふねが　宮之浦港に　つきました。ここが　屋久島。森に　おおわれた　山が　くもの　なかまで　そびえている！'],
    batelierAttend: ['いいとも。ふねは　おまえを　おいて　いかないよ。'],
    batelierPart: ['しゅっぱつ！　しっかり　つかまってな、おきは　なみが　たかいぞ。'],
    bateau: ['鵜戸の　せんどうさんの　ふね。しろい　ふなぞこに　あおい　せん、マストの　上に　たいりょうばた。'],
    bateauNuit: ['よるの　ふねは　きしかべで　ねむっている。なみが　ちゃぷちゃぷ。'],
    pecheur: ['これは　トビウオだ。大きな　ひれを　つばさの　ように　ひろげて、なみの　上を　とぶんだ。', 'ここでは　たくさん　とれる。上の　しょくどうで　からあげを　たべてみな！'],
    touriste: ['縄文杉を　見に　きたの！　なんぜんねんも　いきてるんだって。', '雨に　そなえて　ジャケットは　三まい。ここは「ひと月に　三十五日　雨」って　いうでしょ！'],
    touriste2: ['「ひと月に　三十五日　雨」は、林芙美子の　しょうせつ『浮雲』の　ことばなんだ。', 'だから　森じゅう　コケだらけ　なんだね。'],
    pretre: ['益救神社へ　ようこそ。しまの　じんじゃで、千ねん　いじょう　まえから　しられています。', 'かみさまは　彦火火出見尊、山幸彦とも　いいます……鵜戸の　かみさまの　おとうさんですよ！　むすこさんの　ところから　いらしたんですね。', 'ほんとうの　おやしろは　宮之浦岳の　てっぺん、九州で　いちばん　たかい　山の　大きな　いわの　あいだの　ちいさな　ほこらです。'],
    pretreNuit: ['よるの　山は　ねむっています。はると　あきには、むらの　ひとたちが　山に　のぼって　かみさまに　いのる「岳参り」が　あります。', 'はまの　すなを　山の　上まで　はこんで、かえりに　ちいさな　えだを　もちかえって、まっている　ひとに　くばるんですよ。'],
    yakujinja: ['すずを　ならして、二かい　てを　たたく。', 'ここで　いのるのは、しまの　山と　うみの　かみさま、彦火火出見尊。鵜戸の　かみさまの　おとうさん。'],
    yakujinjaNuit: ['よるの　どうの　やねが　とうろうに　ひかる。すずを　ならして、二かい　てを　たたく。'],
    yakujinjaCompagnon: { kon: ['「おとうさんと　むすこさん、うみの　あっちと　こっち……　なみで　おはなし　してるよね。」'], pon: ['「ポン！　とざんが　はれますように　って　おねがいした。やさしそう。」'], chapu: ['「チャプ！　これで　かぞく　みんなに　ごあいさつ　できた！」'], gao: ['「ガオ……　しまの　まもりがみ。ふかく　おじぎ。」'], fuwa: ['「フワ……　山幸彦は　うみの　ごてん、ぼくの　なかまの　ところに　きたんだ。おひめさまと　けっこん　したんだよ！」'], saya: ['「しまの　山は　あのかたの　山……　スギも　ちょっと　あのかたの　もの。」'] },
    artisan: ['屋久杉の　さいくだよ。おわん、おぼん、おはし。もくめを　見てごらん、ほんの　ページみたいに　ぎっしり。', 'やにが　たっぷりで、ほとんど　くさらない　木なんだ。いまは　屋久杉は　きらない。これは　たおれた　木や、むかし　きられた　木から　つくってるんだ。'],
    loueuse: ['とざんぐつ、レインウェア、リュック……　縄文杉の　みちは　一日じゅう　あるくのよ。', 'それに　ここでは　レインウェアなしで　でかけちゃ　ぜったい　だめ！'],
    theiere: ['しまの　おちゃ「屋久島茶」。山の　ふもとで　そだてているの。', '雨が　おおくて　くうきが　やさしいから、ちゃばが　よろこぶのよ。ほら、ぬれた　森の　かおりが　するでしょう。'],
    serveuse: ['いらっしゃいませ！　トビウオの　からあげが　じまんです。あたまから　しっぽまで　たべられますよ。', 'くびおれサバも　けさ　はいった　ばかりで、しんせんです。'],
    cuisinier: ['「首折れサバ」は、しまの　りょうしさんが　つった　すぐあとに　くびを　おって、しんせんに　するんだ。', 'だから　おさしみで　たべられる。ほかの　とちじゃ、サバは　やいて　たべるんだぞ！'],
    mangeur: ['うーん……　トビウオの　からあげ、サクサク。ひれまで　たべられる！', 'あしたは　五じに　でて　縄文杉へ。たくさん　たべておかないと。'],
    dineuse: ['サバの　おさしみ、はじめて　たべた。やわらかくて、ちょっと　あまいの。'],
    dineur: ['しめは「たんかん」ジュース。しまの　みかんで、ふゆに　とれるんだ。'],
    mamie: ['ちいさい　ころ、ちちは　山の　なかの　小杉谷で　はたらいていたの。きこりの　むらよ。', 'がっこうも　あったのよ！　木は　トロッコで　おろしたの。いまは　だれも　いない……　森だけ。'],
    chauffeur: ['バスは　みなとから　ここ、白谷雲水峡の　いりぐちまで　のぼって　くるんだ。きゅうな　さかだろ？', 'みちの　サルと　シカに　ちゅうい。じぶんの　いえみたいに　あるいてるからな。'],
    guichet: ['白谷雲水峡へ　ようこそ！　ここで　森と　とざんどうを　まもる　ための　きょうりょくきんを　おねがいしています。', 'ありがとうございます！　よい　とざんを。とざんどうから　はずれないでくださいね。'],
    guide: ['白谷の　森へ　ようこそ！　ルールは：とざんどうから　はずれない、コケを　ふまない、サルや　シカに　えさを　あげない。', 'この　先は　苔むす森、それから　辻峠。みぎへ　いくと　太鼓岩、ひだりへ　いくと　縄文杉へ　つづく　トロッコの　みちよ。'],
    guideChampignons: ['そうそう、こやに　とまるなら……　ある　よるに　苔むす森で、ちいさな　キノコが　みどりいろに　ひかるの。', 'いちど　見たことが　あるわ。まるで　みちを　おしえて　くれてる　みたいだった……'],
    guideNuit: ['よるの　森は　すみみたいに　まっくら。とざんどうから　はなれないでね！'],
    randonneur: ['この　いしだん、いい　じゅんびうんどう！　この　先に　かわの　上の　つりばしが　あるよ。', 'きいて。すぐ　そこで　飛流おとしが　かこうがんの　上を　すべっていくんだ。'],
    cascade: ['飛流おとし。白谷川の　みずが、しろい　あわに　なって　大きな　かこうがんの　いわの　上を　すべりおちる。', '屋久島の　かこうがんは、ずっと　むかしに　ちかから　あがってきた　いわ。しまの　山も　この　いわで　できているんだ。'],
    cascadeNuit: ['くらくて　たきは　見えない。いわを　すべる　みずの　おとだけ。'],
    pont: ['さつき吊橋。かわの　たにの　上に　かかる　つりばし。あるくと　すこし　ゆれる！'],
    pontNuit: ['よるの　つりばしの　ずっと　下で、かわが　ごうごう　ないている。'],
    photographe: ['この　コケ、見た？　ここには　なんびゃくしゅるいも　あるのよ。', '雨が　ふると　まみどりで　ふかふかに　なるの。ふまないでね、もとに　もどるのに　なんねんも　かかるから。'],
    videaste: ['やあ！　苔むす森を　TikTokの　ために　とってるんだ。スギの　あいだから　さしこむ　ひかり……　屋久島の　どうが、見る？'],
    refuge: ['こんやは　白谷小屋に　とまるんだ。だれでも　とまれる　ちいさな　山ごや。', 'よるに　なると、苔むす森で　キノコが　ひかるって　いうよ……'],
    refugeSoir: ['いっしょに　よるを　まとうか？'],
    refugeNon: ['いいよ。森は　にげないからね！'],
    refugeNuitTombe: ['よるに　なった……　さわの　カエルの　こえを　きいてごらん。それから　苔むす森の　あしもとを　よく　見てね。'],
    refugeNuit: ['あさを　むかえるかい？'],
    refugeReste: ['よるを　たのしんで。えだの　あいだから　ほしが　見えるよ。'],
    refugeMatin: ['あさだ……　森から　きりが　のぼっていく。もうすぐ　サルたちが　おきるよ。'],
    sommets: ['見て。おくに　宮之浦岳、九州で　いちばん　たかい　山（1936メートル）。となりは　永田岳。', '下は　安房川の　たに、それから　むかしの　きこりの　むら、小杉谷。'],
    taikoiwa: ['太鼓岩の　上から、かこうがんの　大きな　いわの　ドーム。しまの　まんなかの　山が　ぜんぶ　見える。', 'おくに　宮之浦岳（1936メートル）、九州で　いちばん　たかい　山。それに　永田岳（1886メートル）。てっぺんは　大きな　かこうがんの　いわで　できている。'],
    taikoiwaNuit: ['よるの　山は　ほしの　下の　かげだけ。いわの　上を　かぜが　ふいていく。'],
    taikoiwaCompagnon: { kon: ['「ここから　しまが　ぜんぶ　見える……　くもが　下を　とおっていく！」'], pon: ['「ポンポン！　たいこの　いわを　たたこうか？　ポン！」'], chapu: ['「チャプー！　山から　おりる　みず　ぜんぶ……　かわ　ぜんぶ　ほしい！」'], gao: ['「ガオ！　さいこうの　みはりば。しまを　まもる。」'], fuwa: ['「フワ……　あの　山には　雨の　りゅうが　ねむってる。」'], saya: ['「この　森　ぜんぶ……　千ねん、二千ねん。わたしたちが　とおるのを　見てる。」'] },
    sarushika: ['えだの　上で　ヤクシマザルが　はっぱを　たべて……　ぽろぽろ　おとしている。下で　シカが　それを　ひろって　もぐもぐ。', '屋久島では、サルの　下に　シカが　いる　ことが　よく　ある。サルが　おとした　ものを　たべるんだ。どちらも　ほんどの　なかまより　ちいさい。'],
    sarushikaNuit: ['よるの　サルは　えだで　ねむり、シカは　コケの　上で　まるくなっている。'],
    sarushikaCompagnon: { kon: ['「サルが　おとして、シカが　ひろう……　ちからを　あわせてるんだね！」'], pon: ['「ポン！　サルが　おかしを　おとして　くれるなら、一日じゅう　その　木の　下に　いる。」'], chapu: ['「チャプ！　あの　ふたり、なかよしだ！」'], gao: ['「ガオ……　シカは　いい　ボディーガードを　えらんだな。」'], fuwa: ['「フワ……　この　森では、みんなが　だれかを　すこし　たすけてる。」'], saya: ['「木が　サルを、サルが　シカを　そだてる……　ぜんぶ　めぐってる。」'] },
    singe: ['ヤクシマザル。ほんどの　サルより　ちいさくて、けが　ふかふか、かおが　まっか。', 'えさは　あげない。とざんきゃくの　にもつを　とる　くせが　ついちゃうから！'],
    singeBranche: ['えだの　サルが　こっちを　見て、また　はっぱを　たべはじめた。'],
    singeBebe: ['おかあさんザルと、せなかに　しがみつく　あかちゃん。まるい　めで　なんでも　見ている。'],
    cerf: ['ヤクシカ。奈良や　宮島の　シカより　ちいさい。', 'こわがらない。ずっと　ここで　くらして　いるから。さわらないで、見るだけ。'],
    cerfNuit: ['シカは　コケの　上で　ねむっている。しーっ……'],
    papillon: ['ちょうちょが　スギの　あいだの　ひかりの　なかを　とんでいく。'],
    libellule: ['トンボが　みずべの　コケの　いわに　とまった。'],
    grenouille: ['さわの　いしの　上の　まみどりの　アマガエル。', 'よるに　なると、森じゅうで　なかまが　うたうよ。'],
    champignons: ['コケに　おおわれた　たおれぎに、ちいさな　しろっぽい　キノコ。よく　見ないと　わからない。'],
    champignonsNuit: ['見て……　ちいさな　キノコが　ひかってる！　かれきの　上に、やさしい　みどりの　ひかり。', 'にしの　ほうにも、まだ　ある……　森の　なかに　みちを　つくってるみたい。'],
    champignonsNuitCompagnon: { kon: ['「森の　ちいさな　ちょうちん……　ついていこう！」'], pon: ['「ポン？！　ひかる　キノコ……　たべないよね？　ついていくんだよね。」'], chapu: ['「チャプー！　ひかりの　みち！　こっち、こっち！」'], gao: ['「ガオ……　ひかりが　まもる　みち。さきに　いく。」'], fuwa: ['「フワ……　うみの　そこの　ひかりみたい。よんでるよ。」'], saya: ['「森が　あかりを　ともしてる……　なにかを　見せたいんだ。」'] },
    creux: ['かれた　ふるい　スギ。おれて、なかが　からっぽ。なかは　まっくら。', 'おくの　木に　ちいさな　キノコが　はえている。'],
    creuxCompagnon: { kon: ['「ガイドさんが　よるに　ひかる　キノコの　はなしを　してたね……　くらく　なったら　また　こない？」'], pon: ['「ポン……　なかが　くらすぎ。よるに、ひかる　キノコと　いっしょに　こよう！」'], chapu: ['「チャプ！　よるの　ほうが　きれいそう。」'], gao: ['「ガオ。ひるは　なにも　ない。よるなら……」'], fuwa: ['「フワ……　この　あなは　よるを　まってる。」'], saya: ['「この　ふるい　スギは　ひみつを　もってる……　よるが　おしえて　くれる。」'] },
    creuxNuit: ['キノコが　ここまで　みちを　おしえてくれた……　ふるい　スギの　なかで、なにかが　ひかる。'],
    creuxKoban: ['キノコの　わが　ひとつずつ　ひかって……　まんなかの　コケの　ざぶとんに、きんいろの　コバンが　ひかっている！'],
    creuxKobanCompagnon: { kon: ['「森が　まもって　くれてたんだね……　ありがとう、キノコさん。」'], pon: ['「ポンポンポン！　きんだ！　ブンブクおじさん　よろこぶぞ！」'], chapu: ['「チャプー！　木の　なかの　たからもの！」'], gao: ['「ガオ！　よく　まもられ、よく　みつけた。」'], fuwa: ['「フワ……　森にも　うみみたいに　たからが　あるんだ。」'], saya: ['「ふるい　スギが　くれたのよ。あなたが　やさしいって。」'] },
    creuxApres: ['ふるい　からっぽの　スギ。ちいさな　キノコが　やみの　なかで　見まもっている。'],
    creuxApresNuit: ['あなの　おくで　キノコの　わが　やさしく　ひかる。森が「おやすみ」って　いってる。'],
    hokora: ['かぶの　なかの　ちいさな　おやしろ、木魂神社の　まえで　二かい　てを　たたく。', 'あしもとで　おかねが　ひかる。とざんきゃくが　ひとつずつ　おいていくんだ。'],
    wilson: ['上を　見ると……　ふるい　かぶの　ふちの　あいだで、そらが　ハートの　かたちに！', 'ウィルソン株。二千から　三千ねん　いきた　スギで、十六せいきに　きられた（みきまわり　13.8メートル）。ハートが　見えると　こいが　かなうって　いうよ。'],
    wilsonNuit: ['上を　見ると……　くらやみの　ハートが　ほしで　いっぱい。'],
    wilsonCompagnon: { kon: ['「そらの　ハート……　きみの　ための　ハートだ。」'], pon: ['「ポン！　ハートが　見える……　おかし？　ちがう、ハート！」'], chapu: ['「チャプチャプ！　そらが　こいしてる！」'], gao: ['「ガオ……　よく　みつけた。ちょうど　いい　ばしょが　ひつよう　だった。」'], fuwa: ['「フワー……　ここで　上を　見た　みんなの　ための　ハート。」'], saya: ['「ふるい　木は　もう　いないけど、こころを　のこして　いったのね。」'] },
    amoureuse: ['ウィルソン株の　ハートを　見ると、こいが　かなうんだって！', 'なかの　ちょうど　いい　ばしょで　上を　見るの……　もう　十ぷんも　さがしてる！'],
    amoureux: ['この　スギは　四百ねん　いじょう　まえに　きられたんだ。イギリスの　しょくぶつがくしゃ、ウィルソンが　1914ねんに　せかいに　しょうかいしたから、この　なまえ。'],
    agent: ['この　せんろは　安房森林軌道。1922ねんに、木を　みなとまで　おろす　ために　できたんだ。', 'いまも　つかってるよ。とざんどうを　なおす　ざいりょうを　はこんだり、たおれた　スギを　おろしたり。レールの　あいだの　いたは　とざんきゃく　よう。雨の　日は　すべるから　ちゅうい！'],
    marcheur: ['トロッコの　みちを　なんじかんも　あるいて、大株歩道まで　いくの。', 'そこから　のぼりよ！　縄文杉まで　木の　かいだん。'],
    guideJomon: ['縄文杉は　1966ねん、しまの　ひと、岩川貞次さんが　あらためて　みつけたの。さいしょは「大岩杉」と　よんでいたのよ。', 'しんぶんが「縄文じだいの　スギ」と　かいて、その　なまえが　ひろまったの。二千から　七千二百ねん　とも　いわれるけど……　ほんとうの　ことは　だれも　しらないの。'],
    onigiri: ['ふう……　ここまで　五じかん　あるいた。でも　きて　よかった。', '縄文杉を　見ながら　おにぎり。じんせいで　いちばん　おいしい　ごはん！'],
    ancien: ['わかい　ころに　ここへ　きたよ。むかしは　木の　ねもとまで　あるいて　いけたんだ。', 'ひとが　おおすぎて　ねが　いたんで、1996ねんに　この　デッキが　できた。これで　いい。まだ　なんぜんねんも　いきるさ。'],
    jomonsugi: ['縄文杉。屋久島で　いちばん　ふるくて　大きな　スギ。たかさ　25.3メートル、みきまわり　16.4メートル。', 'でこぼこの　かわが　縄文じだいの　どきに　にているから、この　なまえ。二千から　七千二百ねん　とも　いわれる。'],
    jomonsugiNuit: ['よるの　縄文杉は　大きな　かげだけ。こんな　よるを　なんぜんかいも　見てきたんだ。'],
    jomonsugiCompagnon: { kon: ['「さいしょの　じんじゃが　できた　ころ、もう　おじいさん　だったんだ……　じぶんが　ちいさく　かんじる。」'], pon: ['「ポン……　なにも　いわない。こんな　ごせんぞさまの　まえでは　おぎょうぎよく。」'], chapu: ['「チャプ……　山みたいに　大きい！」'], gao: ['「ガオ……　しまで　いちばん　ふるい　まもりびと。おじぎする。」'], fuwa: ['「フワ……　なんぜんねんも　雨の　おとを　きいてきたんだね。」'], saya: ['「おじいさま……　しずかに　いきを　してるのが　きこえる。」'] },
    'panneau-entree': ['「白谷雲水峡」', '424ヘクタールの　まもられた　森（ひょうこう　600〜1050メートル）。大きな　いわ、たき、とても　ふるい　木、なんびゃくしゅるいもの　コケ。'],
    'panneau-carte': ['「白谷の　とざんどう」', 'いしの　みちは　かわぞいに　さつき吊橋まで。そこから　苔むす森と　辻峠へ。峠から　太鼓岩へ、または　トロッコの　みちで　ウィルソン株と　縄文杉へ。'],
    'panneau-yayoi': ['「弥生杉」', 'じゅれい　やく　三千ねん、たかさ　26.1メートル、みきまわり　8.1メートル。まがった　かたちで　いい　いたが　とれないので、きられなかった。'],
    'panneau-nidai': ['「二代大杉」', 'きられた　ふるい　スギの　きりかぶの　上に、わかい　スギが　そだった（きりかぶこうしん）。たにで　いちばん　たかい（32メートル）。'],
    'panneau-kuguri': ['「くぐり杉」', 'ねが　とざんどうの　上で　アーチに　なっていて、下を　くぐれる　スギ。'],
    'panneau-koke': ['「苔むす森」', 'しっけが　おおく、いわだらけ。なにもかも　コケに　おおわれている。コケは　もとに　もどるのに　なんねんも　かかるので、とざんどうを　あるこう。'],
    'panneau-tsuji': ['「辻峠」', '↑ 太鼓岩　・　← 縄文杉（トロッコの　みち）　・　↓ 白谷雲水峡'],
    'panneau-taiko': ['「太鼓岩」', 'ひょうこう　1050メートルの　かこうがんの　ドーム。上から　しまの　まんなかの　山やまと　安房川の　たにが　見える。'],
    'panneau-voie': ['「安房森林軌道」', '1922ねんから、木を　安房港まで　おろす　ために　つくられた。いまも　とざんどうの　せいびに　つかわれる。雨の　日は　いたが　すべるので　ちゅうい。'],
    'panneau-kosugi': ['「小杉谷」', 'ここには　1923ねんに　できた　きこりの　むらが　あった。1960ねんには　540にんが　くらし、がっこうも　あった。1970ねんに　なくなった。しゃしんで　むかしの　くらしが　見られる。'],
    'panneau-wilson': ['「ウィルソン株」', '十六せいきに　きられた、じゅれい　二千〜三千ねんの　スギ（みきまわり　13.8メートル）。なかに　いずみと　木魂神社。しょくぶつがくしゃ　ウィルソンが　1914ねんに　しょうかいした。'],
    'panneau-jomon': ['「縄文杉」', 'たかさ　25.3メートル、みきまわり　16.4メートル、じゅれい　二千〜七千二百ねん。1966ねんに　岩川貞次さんが　みつけた。デッキ（1996ねん）が　ねを　まもる。ここから　見よう。'],
    'panneau-jinja': ['「益救神社」', 'しまの　じんじゃで、十せいきの　きろくにも　のっている。かみさまは　彦火火出見尊（山幸彦）。おくの　おやしろは　宮之浦岳（1936メートル）の　てっぺん。'],
    'panneau-menu': ['「お品書き」', 'とびうお唐揚げ　・　首折れサバ（さしみ）　・　つけあげ　・　とびうおラーメン　・　たんかんジュース　・　屋久島茶'],
  },
};
