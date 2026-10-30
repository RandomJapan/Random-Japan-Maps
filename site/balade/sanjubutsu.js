// ================================================================
//  Les Trente Bouddhas (三十仏) et leurs gardiens Nio (仁王), au cœur de la péninsule de Kunisaki, dans la préfecture
//  d'Oita (2026-10-29 : le neuvième lieu de la balade, choisi par le propriétaire après mes propositions : « oui part sur
//  les trente bouddhas, il faudra que tu gardes vraiment une atmosphère mystérieuse et garde les mêmes règles que les
//  autres », d'après son TikTok). La péninsule, ronde, est faite de vallées qui rayonnent depuis le mont Futago ; depuis
//  plus de mille ans (la légende dit : depuis 718, le moine Ninmon), on y mêle le culte des montagnes et le bouddhisme
//  (六郷満山). On y compte plus de gardiens Nio de pierre que partout ailleurs au Japon (les plus vieux datés, 1478, à
//  Iwato-ji, à un kilomètre d'ici), des stupas de pierre à elle (国東塔), des bouddhas taillés dans les falaises, et une
//  fête du feu (修正鬼会, au nouvel an lunaire, à Iwato-ji et Jōbutsu-ji, une année sur deux) : des oni portant des
//  torches y tapent les gens pour leur porter chance. Car ici, les démons sont des bouddhas déguisés : « le pays où les
//  démons sont devenus des bouddhas » (鬼が仏になった里, patrimoine japonais). Les Trente Bouddhas : un bouddha pour
//  chaque jour du mois (三十日秘仏, déjà dans le Butsuzō-zui de 1690). Les gardiens, bouddhistes, gardent ici un torii
//  shintō. Le TikTok du propriétaire : un long escalier de pierre moussu tout droit entre des cèdres immenses, le torii
//  de pierre et ses deux Nio en haut de quelques marches, un long pavillon de bois sous une falaise en surplomb, la brume.
//  Son secret : l'oni à la torche, qui descend de la montagne quand on sonne la cloche la nuit ; et un lieu secret (le
//  2026-10-29, demandé par le propriétaire) : la grotte d'un ermite derrière la cascade, qui s'ouvre quand on reste sous la
//  chute (le takigyō des yamabushi). Sa récompense : la conque et l'étole à pompons du yamabushi (tenues.js). Les distances
//  sont un peu resserrées.
//  Repère : x vers l'est, z vers le sud, y vers le haut, en mètres ; la vallée monte vers le nord : la ferme et le bout de
//  la route en bas (0,4 m), les Nio à 4,9 m, l'escalier jusqu'à la terrasse du pavillon (21 m), la falaise au nord.
//  ctx : { THREE, atelier, P (palette), peinture, perso, maillage }.
// ================================================================
import { creerMonde, interactionsBancs, lisse, hasard, bruitDoux, surLaLigne } from './monde.js';
import { panneau, PAPIER_PANNEAU } from './decor.js';
import { MATIERES as M } from './textures.js';
import { secretTrouve, indiceVu } from './tresors.js';

const PI = Math.PI;

// ---------------------------------------------------------------- Le plan
// les hauteurs : la route et la ferme, le pied des marches des Nio, le palier des Nio (le bas du grand escalier), la
// terrasse du pavillon (le haut)
const Y_ROUTE = 0.4, Y_BAS = 4.0, Y_NIO = 4.9, Y_T = 21.0;
// les deux gardiens Nio (x ±ecart), tournés vers le sud, en haut des marches ; le torii de pierre derrière eux
const NIO = { x: 0, z: 16.55, ecart: 2.5 };
const TORII = { x: 0, z: 15.2, demi: 1.3, h: 3.05 };
// les marches des Nio : du chemin (z1, Y_BAS) au palier (z0, Y_NIO) ; le palier, entre elles et le grand escalier
const MARCHES_NIO = { x0: -2.75, x1: 2.75, z0: 17.2, z1: 21.0, n: 5 };
const PALIER = { x0: -3.7, x1: 3.7, z0: 12.6, z1: 17.2 };
// le grand escalier : tout droit vers le nord, du palier (z0) à la terrasse (z1) ; 92 marches
const ESC = { x: 0, z0: 12.6, z1: -21.0, n: 92, demi: 0.76 };
const CONTRE = (Y_T - Y_NIO) / ESC.n, GIRON = (ESC.z0 - ESC.z1) / ESC.n;
// (le milieu du voyageur ne va pas à plus de 50 cm du milieu des marches : son corps s'arrête juste avant les bordures)
const DEMI_MARCHE = 0.5;
/** Le dessus de la marche k (0 : la première au-dessus du palier) ; son nez (son bord avant, au sud). */
const yMarche = (k) => Y_NIO + (k + 1) * CONTRE;
const zMarche = (k) => ESC.z0 - k * GIRON;
/** La hauteur de la ligne des nez des marches en z (l'escalier vu de côté). */
const yEscalier = (z) => Y_NIO + (Y_T - Y_NIO) * Math.min(1, Math.max(0, (ESC.z0 - z) / (ESC.z0 - ESC.z1)));
// la terrasse du pavillon, au pied de la falaise
const TERRASSE = { x0: -17.5, x1: 15.0, z0: -35.2, z1: -21.0 };
// le pavillon (御堂) sous le surplomb : sa façade au sud ; le pied de la falaise derrière lui
const DO = { x: -2.6, z: -32.6, l: 16.4, p: 4.4 };
const DO_AVANT = DO.z + DO.p / 2, DO_ARRIERE = DO.z - DO.p / 2;
const Z_PAROI = -35.9;
// le clocher (鐘楼), à l'est de la terrasse ; le stupa de Kunisaki (国東塔), à l'ouest ; la cascade et son bassin, au bout
// ouest de la falaise ; où l'on appelle l'écho, face à la falaise
const SHORO = { x: 9.6, z: -25.6, c: 3.0 };
const TO = { x: -12.6, z: -24.4 };
const TAKI = { x: -14.6, z: -32.8, r: 2.3, eau: Y_T - 0.32 };
const ECHO = { x: -7.6, z: -28.6 };
// (son petit panneau « やまびこ », à sa gauche, à côté des marches ouest du pavillon, tourné vers ceux qui arrivent par
// l'escalier)
const ECHO_PANNEAU = { x: ECHO.x - 1.3, z: ECHO.z + 0.4, ry: 0.85 };
// le grand cèdre sacré (神木), au coin sud-ouest de la terrasse
const SHINBOKU = { x: -15.6, z: -22.6, r: 1.05 };
// le belvédère : un éperon de roche au bout est de la terrasse, au-dessus de la coupe de bois
const BELVEDERE = { x0: 15.0, x1: 22.4, z0: -31.0, z1: -23.2, y: Y_T };
// le sentier de montagne (峯道, le chemin des ermites qui relie les temples de la péninsule) : il part du coin nord-est de la
// terrasse, derrière un portail de rondins (fermé : on ne le prend pas), descend dans le vallon derrière le belvédère et monte
// dans la forêt [x, z, la hauteur de sa ligne]. L'oni en descend (2026-10-30 : il arrivait « de nulle part », à travers la
// montagne et la barrière ; le propriétaire : « faudrait qu'il passe par un endroit qui est accessible »)
const PORTAIL = { x: 14.95, z0: -33.75, z1: -32.45 };
const SENTIER = [[15.0, -33.1, Y_T - 0.03], [16.6, -33.2, 20.55], [18.4, -33.5, 20.25], [19.6, -36.0, 21.0], [20.0, -40.0, 22.2], [20.5, -44.0, 23.5], [21.0, -48.0, 24.95], [21.3, -51.0, 25.9]];
// le coin de Bunbuku : une clairière à l'ouest du pied de l'escalier, par une allée depuis le palier
const RECOIN = { x: -8.2, z: 9.2, rx: 2.9, rz: 2.5, ry: 0.3 };
const ALLEE = [[-3.4, 14.0], [-5.4, 11.8], [-6.6, 10.4]];
const L_ALLEE = Math.hypot(-5.4 + 3.4, 11.8 - 14.0) + Math.hypot(-6.6 + 5.4, 10.4 - 11.8), Y_RECOIN = Y_NIO + 0.7;
const MARCHAND = { x: -9.2, z: 8.7, cap: 0.95 };
const LAMPION = { x: -10.0, z: 10.0 };
// le chemin de terre, du bout de la route aux marches des Nio (il passe le ruisseau sur une dalle de pierre)
const CHEMIN = [[6.2, 63.0], [5.4, 58.6], [3.6, 52.0], [0.8, 45.0], [-1.8, 38.6], [-1.6, 31.0], [-0.4, 25.0], [0, 21.2]];
const DEMI_CHEMIN = 1.05;
// la petite route du village : on arrive en bus à son bout, devant la ferme ; vers le sud-est, une barrière de rondins
const ROUTE = [[1.6, 63.6], [9.0, 65.2], [17.0, 68.8], [26.0, 74.4]];
const DEMI_ROUTE = 1.9, FIN_ROUTE = 22.0;
const DEPART = { x: 6.4, z: 64.6 };
// où l'on commence (et où l'on choisit son compagnon) : dans la cour de la ferme, devant la maison et la grand-mère (le
// 2026-10-30, « au tout début, quand on lance, on spawn tout en bas. Là où il y a la maison et tout, avec la grand-mère » :
// le choix du compagnon se faisait sur la terrasse du pavillon, et l'on commençait là-haut)
const ACCUEIL = { x: -6.6, z: 61.4 };
// la ferme : sa cour, la maison (sa véranda vers l'est), le kaki
const COUR = { x0: -11.8, x1: 2.6, z0: 54.6, z1: 67.6 };
const MAISON = { x: -15.4, z: 61.0, lz: 9.8, lx: 6.4 };
// (ce que couvrent la maison, sa véranda et ses toits : on n'y plante rien)
const MAISON_EMPRISE = { x0: MAISON.x - MAISON.lx / 2 - 0.9, x1: MAISON.x + MAISON.lx / 2 + 0.62, z0: MAISON.z - MAISON.lz / 2 - 0.9, z1: MAISON.z + MAISON.lz / 2 + 0.9 };
const KAKI = { x: -4.2, z: 56.4 };
// le ruisseau : du bassin de la cascade jusque sous la route, en bas ; la dalle où le chemin le passe
const RUISSEAU = [[-18.9, -30.8], [-19.6, -20.0], [-18.2, -6.0], [-15.8, 6.0], [-13.4, 18.0], [-9.0, 28.0], [-5.0, 35.0], [-1.8, 38.6], [1.6, 42.4], [6.4, 47.6], [11.2, 54.6], [15.2, 62.4], [18.8, 72.0], [22.8, 86.0]];
const PONT = { x: -1.8, z: 38.6 };
// les rizières en terrasses, au sud de la ferme (on ne fait que les voir)
const RIZIERES_Z = 72;

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
/** Le point le plus proche d'une ligne brisée [[x, z], …] : sa distance d, où il est (x, z), s le chemin parcouru jusqu'à lui. */
function ligne(points, x, z) {
  let d = Infinity, px = 0, pz = 0, s = 0, cumul = 0;
  for (let k = 0; k < points.length - 1; k++) {
    const [x0, z0] = points[k], [x1, z1] = points[k + 1], dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz);
    const f = Math.min(1, Math.max(0, ((x - x0) * dx + (z - z0) * dz) / (l * l || 1))), e = Math.hypot(x - x0 - f * dx, z - z0 - f * dz);
    if (e < d) { d = e; px = x0 + f * dx; pz = z0 + f * dz; s = cumul + f * l; }
    cumul += l;
  }
  return { d, x: px, z: pz, s };
}
/** Sur la route (et jusqu'où elle se marche) ? */
const surRoute = (x, z) => ligne(ROUTE, x, z);
/** Le pied de la falaise en x (z), un peu irrégulier ; au milieu, derrière le pavillon. */
const zParoi = (x) => Z_PAROI + 0.35 * Math.sin(x * 0.37) + 0.2 * Math.sin(x * 0.91 + 1);
/** Jusqu'où va la falaise vers l'est et l'ouest : 1 entre x −24 et 13, 0 au-delà de −31 et 19. */
const largeurFalaise = (x) => lisse(-31, -24, x) * (1 - lisse(13, 19, x));

// ---------------------------------------------------------------- La grotte de l'ermite (行者の岩屋), derrière la cascade
// (2026-10-29, le propriétaire : « Tu peux rajouter un lieu secret qui se découvre via une petite action cachée » ; de mes
// propositions, il a choisi la grotte d'un ermite cachée derrière la cascade, qui s'ouvre quand on reste sous la chute, comme
// les ermites qui méditaient sous l'eau glacée : le takigyō, 滝行.) Des pierres de gué (飛び石) traversent le bassin jusqu'à
// une pierre plate sous la chute ; derrière l'eau, une dalle de roche ferme la bouche. Dedans, une salle bosselée, plus large
// que sa bouche, qui s'abaisse vers le fond : l'autel taillé dans la roche, un petit coffre laqué ouvert sur un bouddha doré
// (秘仏, un bouddha caché), des bougies qui brûlent sans personne, la natte de l'ermite, un bol de pierre sous les gouttes.
/** Son axe (x), son sol ; sa bouche (demi-largeur, hauteur au-dessus du sol) ; la salle (demi-largeur, hauteur, profondeur). */
const GROTTE = { x: TAKI.x, sol: Y_T - 0.02, demi: 1.2, haut: 2.5, large: 2.3, voute: 3.2, prof: 5.8 };
/** Le devant de la falaise (sans ses bosses) sur l'axe de la grotte ; la salle commence 1 m derrière (la lèvre : la paroi va
 * de biais, 50 cm de plus à l'ouest de la bouche qu'à l'est, et elle a ses bosses). */
const Z_GROTTE = zParoi(GROTTE.x) + 0.75, Z_SALLE = Z_GROTTE - 1.0;
/** L'autel taillé dans la roche, au fond de la salle : la profondeur de son devant. */
const AUTEL_S = 4.5;
/**
 * La pierre plate sous la chute (où l'on reste, 滝行) : son milieu, son rayon, son dessus. Son bord arrière est sur la ligne
 * z −34,75 des cases de 25 cm du sol dessiné, où commence le sol de la grotte : la case d'avant, qui descend vers le bassin, est
 * sous elle (au bord, on marchait au-dessus de cette pente : « on flotte » de 20 cm).
 */
const TAKIGYO = { x: GROTTE.x, z: -34.21, r: 0.55, y: Y_T - 0.04 };
/** Les pierres de gué, du bord sud du bassin (sur la terrasse) jusqu'à elle : [x, z, le dessus]. */
const GUE = [[GROTTE.x, TAKI.z + 3.65, Y_T - 0.03], [GROTTE.x, TAKI.z + 2.55, Y_T - 0.05], [GROTTE.x, TAKI.z + 1.78, Y_T - 0.07],
  [GROTTE.x, TAKI.z + 1.01, Y_T - 0.05], [GROTTE.x, TAKI.z + 0.24, Y_T - 0.07], [GROTTE.x, TAKI.z - 0.53, Y_T - 0.05], [TAKIGYO.x, TAKIGYO.z, TAKIGYO.y]];
/** Le contour de la bouche, de u 0 (le pied est) à 1 (le pied ouest) par le haut : [x, y] ; ses pieds 35 cm sous le sol. */
function archeGrotte(u) {
  const t = u * PI, ax = GROTTE.demi * (1 + 0.05 * Math.sin(t * 4.3 + 0.6));
  const ay = (GROTTE.haut + 0.35) * (1 + 0.05 * Math.sin(t * 3.1 + 1.1)) * (1 - 0.06 * Math.cos(t));
  return [GROTTE.x + Math.cos(t) * ax, GROTTE.sol - 0.35 + Math.sin(t) ** 0.62 * ay];
}
/** La salle à la profondeur s (0 : là où finit la lèvre) : combien le contour de la bouche s'y élargit (fx) et monte (fy). */
function salleGrotte(s) {
  if (s <= 0) return { fx: 1, fy: 1 };
  const ouvre = lisse(0, 1.8, s), fin = s > 3.6 ? Math.sqrt(Math.max(0, 1 - ((s - 3.6) / (GROTTE.prof - 3.6)) ** 2)) : 1;
  return { fx: (1 + (GROTTE.large / GROTTE.demi - 1) * ouvre) * fin, fy: (1 + ((GROTTE.voute + 0.35) / (GROTTE.haut + 0.35) - 1) * ouvre) * fin };
}
/** La demi-largeur de la grotte à la profondeur s, à hy au-dessus de son sol (0 : la voûte est plus basse). */
function demiGrotte(s, hy) {
  const { fx, fy } = salleGrotte(s), v = (hy + 0.35) / ((GROTTE.haut + 0.35) * 0.94 * fy);
  return v >= 1 || fx <= 0 ? 0 : GROTTE.demi * 0.95 * fx * Math.cos(Math.asin(v ** (1 / 0.62)));
}
/** Le sol de la grotte (creusé dans la montagne, à plat) : de derrière la pierre du takigyō au fond, un peu plus large qu'elle. */
const solGrotte = (x, z) => z < -34.74 && Z_SALLE - z < GROTTE.prof + 0.6 && Math.abs(x - GROTTE.x) < demiGrotte(Math.max(0, Z_SALLE - z - 0.5), 0) / 0.95 + 0.7;
/**
 * Dans la grotte, là où l'on marche : à 30 cm de ses parois à hauteur de tête, et de l'autel ; et sur le dos de la pierre du
 * takigyō, qui passe sous son sol, une bande de 54 cm qui la rejoint. (Jusqu'au 2026-10-30, la pierre et le sol de la grotte ne se
 * touchaient qu'en un point : à côté, entre les deux, le bassin, et l'on butait ; « quand on a envie de partir de la grotte, des
 * fois, on peut pas partir, ça bloque ».)
 */
const dansGrotte = (x, z) => {
  const s = Z_SALLE - z, dx = Math.abs(x - GROTTE.x);
  if (z > -34.95) return z < TAKIGYO.z && dx < 0.27;
  return s < AUTEL_S - 0.28 && dx < demiGrotte(s, 1.6) - 0.3;
};
/** Est-elle ouverte ? (la dalle a glissé : tresors.js garde l'indice « iwaya » ; construire le lit à la fin — le décor, construit
 * avant, ne dépend pas de lui : la forêt est plus fine près de là où l'on marche — ; la scène le change) */
let grotteOuverte = false;

// ---------------------------------------------------------------- Le relief
/** Une bosse douce de hauteur h et de rayon r autour de cx, cz. */
const bosse = (x, z, cx, cz, r, h) => { const d = Math.hypot(x - cx, z - cz) / r; return d < 1 ? h * (0.5 + 0.5 * Math.cos(d * PI)) : 0; };
/** Le fond de la vallée le long de z (au milieu) : la route, la montée douce vers les Nio, le grand escalier, la terrasse. */
function profil(z) {
  if (z > MARCHES_NIO.z1) return Y_ROUTE + (Y_BAS - Y_ROUTE) * lisse(50, MARCHES_NIO.z1, z) - 0.9 * lisse(RIZIERES_Z - 2, 110, z);
  if (z > MARCHES_NIO.z0) return Y_BAS + ((Y_NIO - Y_BAS) * (MARCHES_NIO.z1 - z)) / (MARCHES_NIO.z1 - MARCHES_NIO.z0);
  if (z > ESC.z0) return Y_NIO;
  return yEscalier(z);
}
/**
 * Les flancs : à l'ouest, la pente monte vers la crête boisée ; à l'est, dans le bas de la vallée, elle monte aussi, mais
 * en haut, à côté de la terrasse, elle tombe dans le vallon de la coupe de bois (ce qu'on voit du belvédère).
 */
function flancs(x, z) {
  const ax = -2 * lisse(18, 30, z), wO = 18 - 6 * lisse(-10, 10, z) + 6 * lisse(26, 44, z), wE = 6 + 14 * lisse(20, 40, z);
  const dO = ax - x - wO, dE = x - ax - wE;
  let h = 0;
  if (dO > 0) h += 0.3 * dO ** 1.2;
  if (dE > 0) h += 0.26 * dE ** 1.18 * lisse(4, 20, z) * (1 - devantBelvedere(x, z));
  // (le vallon de l'est, sous la terrasse et le belvédère ; devant le belvédère, il se creuse en ravin, 24 m plus bas : la
  // cime des cèdres y reste sous les yeux, dans la mer de nuages, et l'on voit loin)
  const ve = Math.min(12, Math.max(0, x - 5) ** 1.15 * 0.27) * lisse(14, 0, z) * lisse(-36, -27, z);
  const dB = Math.hypot(x - 18.6, z + 27);
  return h - ve - 24 * devantBelvedere(x, z) * lisse(14, 80, dB);
}
/** Devant le belvédère (0 à 1) : l'éventail de sa vue, vers le sud-est, sur 300 m (la vallée y descend sans remonter). */
function devantBelvedere(x, z) {
  const dx = x - 18.6, dz = z + 27, d = Math.hypot(dx, dz);
  return d < 6 ? 0 : lisse(0.8, 0.93, (dx * 0.6 + dz * 0.8) / d) * (1 - lisse(240, 320, d));
}
/** Les collines au loin : les crêtes de la péninsule, l'une derrière l'autre dans la brume ; nulles près du lieu. */
function collines(x, z) {
  const loin = lisse(90, 180, Math.hypot(x, z - 10));
  if (loin <= 0) return 0;
  return loin * (bosse(x, z, -160, -90, 170, 95) + bosse(x, z, 40, -260, 230, 120) + bosse(x, z, 250, -120, 180, 70) + bosse(x, z, 320, 120, 190, 58)
    + bosse(x, z, 180, 330, 200, 46) + bosse(x, z, -220, 220, 210, 62) + bosse(x, z, -360, 40, 200, 80) + bosse(x, z, 520, 360, 260, 54)
    + bosse(x, z, 460, -340, 240, 90) + bosse(x, z, -120, 420, 220, 50) + (bruitDoux(x * 0.025, z * 0.025, 3) - 0.5) * 16);
}
/** La terre sans les retouches des places : le fond de la vallée, ses flancs, la falaise, les bosses du sous-bois. */
function terre(x, z) {
  let h = profil(z) + flancs(x, z);
  // la falaise : derrière son pied, la montagne monte de 27 m en quatre mètres, puis doucement ; sur ses bouts, la pente
  const zp = zParoi(x), lf = largeurFalaise(x);
  if (z < zp - 0.9) h = Math.max(h, Y_T + lf * (27 * lisse(zp - 0.9, zp - 4.6, z) + 0.32 * Math.max(0, zp - 4.6 - z)));
  if (z < -36) h += 0.3 * Math.max(0, -36 - z) * (1 - lf) + (bruitDoux(x * 0.08, z * 0.08, 3) - 0.5) * 4 * lisse(-40, -48, z);
  // les bosses du sous-bois, loin des chemins
  h += (bruitDoux(x * 0.13 + 5, z * 0.13, 3) - 0.5) * 1.3 * lisse(-34, -24, z) * lisse(70, 58, z);
  // les rizières en terrasses, au sud : des marches de 70 cm tous les 7 m (leurs murets dessinés à part), au fond de la vallée
  if (z > RIZIERES_Z) {
    const k = Math.floor((z - RIZIERES_Z) / 7), y = Y_ROUTE - 0.25 - 0.7 * k;
    if (h > y) h = y + (h - y) * lisse(26, 40, Math.abs(x - 4));
  }
  return h + collines(x, z);
}

function terrain(x, z) {
  let h = terre(x, z);
  // le palier des Nio et ses marches, plats
  {
    const d = versRect(PALIER, x, z);
    if (d < 2.5) h = Y_NIO - 0.03 + (h - Y_NIO + 0.03) * lisse(0.2, 2.5, d);
    const dm = versRect(MARCHES_NIO, x, z);
    if (dm < 2.2) {
      const ym = Y_BAS + ((Y_NIO - Y_BAS) * Math.min(1, Math.max(0, (MARCHES_NIO.z1 - z) / (MARCHES_NIO.z1 - MARCHES_NIO.z0)))) - 0.2;
      h = ym + (h - ym) * lisse(0.3, 2.2, dm);
    }
  }
  // la terrasse du pavillon, plate ; le belvédère, un demi-mètre plus haut, ses bords qui tombent
  {
    const d = versRect(TERRASSE, x, z);
    if (d < 3) h = Y_T - 0.03 + (h - Y_T + 0.03) * lisse(0.1, 3, d);
    // (pas au bord de la terrasse : au coin sud-est, ce creux mettait le poteau d'angle de la barrière 65 cm plus bas que ses
    // voisins, et ses rondins dans le sol ; 2026-10-30, « Il y a un bout de la barrière qui est dans le sol »)
    const db = versRect(BELVEDERE, x, z);
    if (db < 1.2) h = BELVEDERE.y - 0.03;
    else if (db < 2.8 && !dansRect(TERRASSE, x, z)) h = Math.min(h, BELVEDERE.y - 0.03 - 0.9 * lisse(1.2, 2.8, db) * lisse(0.3, 1.5, versRect(TERRASSE, x, z)));
  }
  // le sentier de montagne : au ras de sa ligne, sans les bosses, et sur ses bords la pente qui le rejoint
  { const l = surLaLigne(SENTIER, x, z); if (l.d < 2.2) h = l.h + (h - l.h) * lisse(0.6, 2.2, l.d); }
  // le bassin de la cascade
  { const d = Math.hypot(x - TAKI.x, z - TAKI.z); if (d < TAKI.r + 0.6) h = Math.min(h, TAKI.eau - 0.7 + (Y_T - 0.03 - TAKI.eau + 0.7) * lisse(TAKI.r - 0.6, TAKI.r + 0.6, d)); }
  // la grotte de l'ermite, derrière la cascade : son sol, à plat, creusé dans la montagne (sa voûte, dessinée à part, le couvre)
  if (solGrotte(x, z)) h = GROTTE.sol;
  // le lit du ruisseau : creusé de 60 cm ; le chemin et la route passent au-dessus à niveau (la dalle de pierre ; sous la
  // route, une buse)
  { const r = surLaLigne(RUISSEAU, x, z); if (r.d < 1.8) h -= 0.62 * (1 - lisse(0.5, 1.8, r.d)) * lisse(0.3, 1.5, versRect(TERRASSE, x, z)); }
  // le chemin de terre, l'allée de Bunbuku et sa clairière : au ras de la pente, sans ses bosses
  {
    const l = ligne(CHEMIN, x, z);
    if (l.d < DEMI_CHEMIN + 2) { const yc = terre(l.x, l.z); h = yc - 0.04 + (h - yc + 0.04) * lisse(DEMI_CHEMIN, DEMI_CHEMIN + 2, l.d); }
    // (la clairière creusée un peu dans la pente, 70 cm au-dessus du palier ; l'allée monte de l'un à l'autre : la pente
    // naturelle la mettait 1,5 m plus haut, une marche qu'on ne montait pas)
    const a = ligne(ALLEE, x, z), dq = aLaPlace(RECOIN, x, z);
    if (a.d < 2.6 || dq < 1.6) {
      const ya = Y_NIO - 0.03 + (Y_RECOIN - Y_NIO) * Math.min(1, a.s / L_ALLEE), f = Math.min(lisse(0.9, 2.6, a.d), lisse(0, 1.6, dq));
      h = (dq < 1.6 ? Math.min(ya, Y_RECOIN - 0.03) : ya) * (1 - f) + h * f;
      if (dq < 0) h = Y_RECOIN - 0.03;
    }
  }
  // la cour de la ferme et la route : plates
  {
    const dc = versRect(COUR, x, z);
    if (dc < 2) h = Y_ROUTE - 0.03 + (h - Y_ROUTE + 0.03) * lisse(0, 2, dc);
    const r = surRoute(x, z);
    if (r.d < DEMI_ROUTE + 2) h = Y_ROUTE - 0.02 + (h - Y_ROUTE + 0.02) * lisse(DEMI_ROUTE, DEMI_ROUTE + 2, r.d);
  }
  // le grand escalier, en dernier : à côté des marches, le sol un quart de mètre sous la ligne de leurs nez, puis la pente ;
  // sous elles, toujours sous le dessus de la plus basse des deux voisines (le sol est dessiné 3 cm plus haut)
  if (z < ESC.z0 && z > ESC.z1) {
    const d = Math.abs(x - ESC.x), hl = yEscalier(z) - 0.25;
    h = hl + (h - hl) * lisse(ESC.demi + 0.35, ESC.demi + 2.4, d);
    if (d < ESC.demi + 0.4) {
      const k = Math.floor((ESC.z0 - z) / GIRON);
      if (k >= 0 && k < ESC.n) h = Math.min(h, Math.min(yMarche(k), k > 0 ? yMarche(k - 1) : Y_NIO) - 0.1);
    }
  }
  return h;
}

// le sol tel que le jeu le dessine (balade.js, terrain) : une grille de 4 m, de 1 m autour du jeu (3 cm plus haut) ; deux
// triangles par case, la diagonale de (x1, z0) à (x0, z1) ; la falaise et l'escalier en cases de 25 cm (solDetaille)
// (le fin jusqu'à z 112, au-delà des rizières en terrasses, depuis le 2026-10-30 : en cases de 4 m, leurs marches de 70 cm étaient
// des pentes douces)
const ETENDUE = { x0: -720, x1: 720, z0: -720, z1: 720, pas: 4, fin: { x0: -48, x1: 56, z0: -48, z1: 112, pas: 1 } };
const solDetaille = (x0, z0, x1, z1) => {
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  return (Math.abs(cx - ESC.x) < ESC.demi + 1.4 && cz < ESC.z0 + 1 && cz > ESC.z1 - 1) || (cz < Z_PAROI + 1.2 && cz > Z_PAROI - 5.5 && largeurFalaise(cx) > 0);
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
 * Peut-on être en x, z ? Sur la route (jusqu'à sa barrière), dans la cour de la ferme, sur le chemin de terre et la dalle
 * du ruisseau, sur les marches des Nio et leur palier, sur le grand escalier (entre ses bordures), dans l'allée et la
 * clairière de Bunbuku, sur la terrasse (hors du bassin) et le belvédère ; sur les pierres de gué du bassin et la pierre
 * sous la chute ; dans la grotte de l'ermite, une fois ouverte. Leurs bords ont tous ce qui arrête (le sous-bois de la
 * lisière, les bordures, les murets, les rondins, la falaise, les rochers du bassin, les parois de la grotte) : le
 * voyageur s'arrête 27 cm avant ; au bord d'une pierre de gué, l'eau du bassin.
 */
function dansLeCadre(x, z) {
  const r = surRoute(x, z);
  if (r.d < DEMI_ROUTE && x < FIN_ROUTE) return true;
  if (dansRect(COUR, x, z)) return true;
  if (surLaLigne(CHEMIN, x, z).d < DEMI_CHEMIN) return true;
  if (dansRect(MARCHES_NIO, x, z) || dansRect(PALIER, x, z)) return true;
  if (Math.abs(x - ESC.x) < DEMI_MARCHE && z <= ESC.z0 + 0.05 && z >= ESC.z1 - 0.05) return true;
  if (surLaLigne(ALLEE, x, z).d < 0.9 || aLaPlace(RECOIN, x, z) < 0) return true;
  // (la paroi de la falaise avance de 75 cm devant son pied, ses bosses de 30 cm de plus ; les rochers du bassin, jusqu'à
  // 85 cm au-delà de son bord : le corps du voyageur, 24 cm, s'arrête juste avant)
  // (les pierres de gué jusque sous la cascade, la pierre où l'on reste sous la chute ; une fois la dalle ouverte, la grotte)
  if (surLaLigne(GUE, x, z).d < 0.17 && z > TAKIGYO.z) return true;
  if (Math.hypot(x - TAKIGYO.x, z - TAKIGYO.z) < 0.32 && z > TAKIGYO.z - 0.2) return true;
  if (grotteOuverte && dansGrotte(x, z)) return true;
  if (dansRect(TERRASSE, x, z) && z > zParoi(x) + 1.35) return Math.hypot(x - TAKI.x, z - TAKI.z) > TAKI.r + 1.1 && (x > -1.2 || z < TERRASSE.z1 - 0.32);
  return dansRect(BELVEDERE, x, z);
}

/** Ce que le carnet et le menu savent du lieu, sans le construire. */
export const infos = {
  id: 'sanjubutsu', carte: 'thirty-buddhas-nio-statues', video: '7646873869042666774',
  nom: { en: 'Thirty Buddhas', fr: 'Trente Bouddhas', ja: '三十仏' }, nomJa: '三十仏の仁王像',
  // (dans une phrase : « Bienvenue aux Trente Bouddhas », « Welcome to the Thirty Buddhas » ; textes.js, aLieu, deLieu)
  phrase: { en: 'the Thirty Buddhas', fr: 'les Trente Bouddhas' },
  tampons: [
    { id: 'vue', motif: 'unkai', ja: '雲海', encre: '#4a6a7a' },
    { id: 'waraji', motif: 'waraji', ja: '仁王の草鞋', encre: '#8a6a2a', forme: 'carre' },
    { id: 'kane', motif: 'kane', ja: '鐘', encre: '#5a6a4a' },
    { id: 'hotoke', motif: 'hotoke', ja: '三十仏', encre: '#7a5a3a', forme: 'carre' },
    { id: 'yamabiko', motif: 'yamabiko', ja: '山彦', encre: '#3a5a6a' },
  ],
  get textes() { return TEXTES; },
};

/** La nuit : les lanternes, les bougies des bouddhas, les shōji de la ferme s'allument. */
export const sortesNuit = (P) => ({ [P.shoji]: 'lumiere', [P.shojiCadre]: 'treillis' });

/** Un triangle A, B, C ajouté à pos, tourné vers n (retourné s'il regarde de l'autre côté). */
function tri(pos, A, B, C, n) {
  const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  if (nx * n[0] + ny * n[1] + nz * n[2] < 0) pos.push(...A, ...C, ...B); else pos.push(...A, ...B, ...C);
}

export function construire(ctx) {
  const { THREE, atelier, P } = ctx;
  grotteOuverte = false;
  const objets = [], bancs = [], lumieres = [], animes = [], etiquettes = [], vapeurs = [], cascades = [];
  const monde = creerMonde({ terrain, cadre: dansLeCadre, profond: null, pente: null });
  const poser = (fin, x, z, o = {}) => objets.push({ fin, x, z, y: o.y ?? terrain(x, z), ry: o.ry || 0, ombre: o.ombre !== false, trait: o.trait !== false, dedans: o.dedans, avant: o.avant });
  const ecrire = (o, e) => {
    const c = Math.cos(o.ry || 0), sn = Math.sin(o.ry || 0);
    etiquettes.push({ ...e, x: o.x + e.x * c + e.z * sn, y: o.y + e.y, z: o.z - e.x * sn + e.z * c, ry: (o.ry || 0) + (e.ry || 0) });
  };
  /** Un repère tourné : la pose (x, y, z, ry) d'une pièce donnée dans le repère d'un objet posé en x0, z0, tourné de ry0. */
  const repere = (x0, z0, ry0) => {
    const c = Math.cos(ry0), s = Math.sin(ry0);
    return (lx, y, lz, o = {}) => ({ ordre: 'YXZ', ...o, x: x0 + lx * c + lz * s, y, z: z0 - lx * s + lz * c, ry: ry0 + (o.ry || 0) });
  };
  /** Un point [x, y, z] du repère R. */
  const pt = (R, lx, y, lz) => { const q = R(lx, y, lz); return [q.x, q.y, q.z]; };
  // le décor en morceaux de 25 m (un objet chacun : la carte graphique dessine moins de petits objets)
  const morceaux = new Map();
  const morceau = (x, z, taille = 25) => {
    const k = `${taille}:${Math.floor(x / taille)},${Math.floor(z / taille)}`;
    if (!morceaux.has(k)) morceaux.set(k, atelier());
    return morceaux.get(k);
  };
  /** Une lanterne de pierre (tōrō) en x, z (s : sa taille ; 6 ≈ 1,7 m), allumée la nuit. */
  const lanterne = (a, x, z, s = 6, y = terrain(x, z)) => {
    a.lanterne(x, z, s, y);
    lumieres.push({ x, y: y + 1.2 * (s / 6), z, halo: 0.4 * (s / 6), sol: y, r: 2.4 * (s / 6) });
    monde.cercle(x, z, 0.32 + 0.045 * s);
  };
  /** Des murs tout autour d'un rectangle (dans le repère R, ses demi-côtés lx, lz), m au-delà de ce qu'on voit. */
  const murRect = (R, lx, lz, m = 0.27) => {
    const C = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => R(u * (lx + m), 0, v * (lz + m)));
    for (let k = 0; k < 4; k++) monde.mur(C[k].x, C[k].z, C[(k + 1) % 4].x, C[(k + 1) % 4].z, 0.05);
  };
  // la pierre des statues et des marches : grise et verte, tachée de lichen pâle et de mousse
  const PIERRE = '#666a64', PIERRE_F = '#545852', LICHEN = '#8b8e7b', MOUSSE = '#506c3d', MOUSSE_F = '#405a34';
  const tachee = (graine = 0, mousse = 0.2) => (wx, wy, wz) => {
    const n = bruitDoux(wx * 2.7 + graine, wy * 2.9 + wz * 2.1, 1);
    return n > 0.74 ? LICHEN : n < mousse ? MOUSSE : n < mousse + 0.22 ? PIERRE_F : PIERRE;
  };
  /** Un rocher moussu de rayons rx, ry, rz en x, y (le milieu, au ras du sol), z, tourné de t. */
  const rocher = (a, x, y, z, rx, ry, rz, t = 0, finesse = 1) => {
    const g = hasard(x * 1.31, z * 0.71);
    return a.piece(new THREE.IcosahedronGeometry(1, finesse), PIERRE, {
      x, y, z, ry: t, sx: rx, sy: ry, sz: rz, nuance: 0.05,
      deformer: (px, py, pz) => {
        const l = Math.hypot(px, py, pz) || 1, nx = px / l, ny = py / l, nz = pz / l;
        const k = 1 + 0.15 * Math.sin(nx * 3.1 + g * 9) * Math.cos(nz * 2.7 - g * 5) + 0.08 * Math.sin(ny * 6.3 + nx * 2 + g * 3);
        return [px * k, Math.max(py * k, -0.45), pz * k];
      },
      // (le dessus moussu, les flancs gris tachés de lichen)
      teinte: (wx, wy, wz) => (wy > y + ry * 0.45 ? (hasard(wx * 3, wz * 3) > 0.35 ? MOUSSE : MOUSSE_F) : tachee(g * 7)(wx, wy, wz)),
    });
  };
  /**
   * Un cèdre de plantation (杉), comme dans le TikTok : un fût brun-rouge droit et nu sur plus de la moitié de sa hauteur,
   * quelques chicots de branches mortes, puis des étages de branches dentelés, de plus en plus petits. o : loin (moins de
   * détail), vert, rb (le rayon du pied).
   */
  // (2026-10-29 : un étage par pièce, et des chicots sur tous, faisaient 22 000 pièces et 4 s de construction : les étages
  // d'un arbre ne font plus qu'une pièce, les chicots seulement près des chemins, les arbres du fond plus simples)
  const cedre = (a, x, z, h, y = terrain(x, z), o = {}) => {
    const rb = o.rb ?? 0.15 + h * 0.0055, rot = hasard(x, z, h) * 6.28;
    a.fut([x, y - 0.45, z], [x, y + h * 0.97, z], rb, rb * 0.2, '#5c4130', o.loin ? 5 : 6, o.loin ? { trait: false } : {});
    if (!o.loin) a.fut([x, y - 0.5, z], [x, y + 0.35, z], rb * 1.55, rb * 1.02, '#4f3727', 6);
    if (o.pres) {
      for (let k = 0; k < 2; k++) {
        const yb = y + h * (0.24 + 0.14 * k + 0.05 * hasard(x, k)), t = rot + k * 2.3, L = 0.35 + 0.3 * hasard(z, k);
        a.fut([x, yb, z], [x + Math.sin(t) * L, yb - 0.1, z + Math.cos(t) * L], 0.035, 0.012, '#4a3a2e', 4, { trait: false });
      }
    }
    const n = o.loin ? 3 : 4, m = o.loin ? 5 : 7, pos = [], couleurs = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), r = h * (0.13 - 0.085 * t), hh = h * (0.2 - 0.06 * t), yb = h * (0.56 + 0.36 * t), c = i % 2 ? o.vert ?? '#3f5f3a' : '#36533a';
      const ap = [0, yb + hh, 0], fond = [0, yb + 0.2 * hh, 0], bord = [];
      for (let k = 0; k < 2 * m; k++) {
        const ang = rot + i * 1.7 + (k / (2 * m)) * 6.2832, pointe = k % 2 === 0;
        const rr = r * (pointe ? 1 : 0.68) * (0.9 + 0.2 * hasard(x + k, z + i, h));
        bord.push([Math.sin(ang) * rr, yb + (pointe ? -0.07 * hh : 0.08 * hh), Math.cos(ang) * rr]);
      }
      for (let k = 0; k < 2 * m; k++) { const A = bord[k], B = bord[(k + 1) % (2 * m)]; pos.push(...ap, ...A, ...B, ...fond, ...B, ...A); couleurs.push(c, c); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    a.piece(geo, '#3f5f3a', { x, y, z, couleurs, sorte: 'conifere', volume: [x, y + h * 0.78, z, h * 0.22], trait: !o.loin });
    return a;
  };

  // ---------------------------------------------------------------- Le grand escalier : 92 marches moussues, ses bordures
  {
    const a = atelier();
    for (let k = 0; k < ESC.n; k++) {
      // (la dernière s'arrête au bord de la terrasse : son dessus est à sa hauteur, et dessus le sol de la terrasse scintillait,
      // 2026-10-30, « tout en haut de l'escalier juste une petite surface qui scintille »)
      const y = yMarche(k), zf = zMarche(k), prof = k === ESC.n - 1 ? zf + 0.02 - ESC.z1 : GIRON + 0.14, larg = 2 * ESC.demi - (k % 2 ? 0.05 : 0);
      // (un bloc plein, 70 cm sous son dessus ; le dessus moussu au bord des marches, usé au milieu, là où l'on passe)
      a.boite(larg, 0.7, prof, PIERRE, {
        x: ESC.x + (hasard(k, 3) - 0.5) * 0.012, y: y - 0.35, z: zf - prof / 2 + 0.02, ry: (hasard(k, 7) - 0.5) * 0.012, nuance: 0.07,
        teinte: (wx, wy, wz) => (wy > y - 0.02 ? (Math.abs(wx - ESC.x) > 0.42 + 0.2 * hasard(wz * 4, k) ? MOUSSE : hasard(wx * 5, wz * 5) > 0.7 ? MOUSSE_F : '#5d6159') : tachee(k)(wx, wy, wz)),
      });
    }
    // les bordures de pierre, de chaque côté, le long de la pente (leur dessus 14 cm au-dessus des nez des marches)
    const ang = Math.atan2(Y_T - Y_NIO, ESC.z0 - ESC.z1), L = Math.hypot(ESC.z0 - ESC.z1 + 0.3, Y_T - Y_NIO) + 0.1;
    const zm = (ESC.z0 + ESC.z1) / 2 + 0.05, ym = (Y_NIO + CONTRE + Y_T) / 2 + 0.14 / Math.cos(ang) - 0.24 / Math.cos(ang);
    for (const s of [-1, 1]) a.boite(0.26, 0.48, L, PIERRE_F, { x: ESC.x + s * (ESC.demi + 0.175), y: ym, z: zm, rx: ang, nuance: 0.08, teinte: tachee(s * 5, 0.42) });
    poser(a.fin(), 0, 0, { y: 0 });
    // on y marche : une pente de pierre, des bouts droits (le palier, la terrasse)
    monde.chemin([[ESC.x, ESC.z0 + 0.02, Y_NIO], [ESC.x, ESC.z1 - 0.02, Y_T]], DEMI_MARCHE + 0.02, { sol: 'pierre', droits: true });
    for (const s of [-1, 1]) monde.mur(ESC.x + s * (ESC.demi + 0.175), ESC.z0, ESC.x + s * (ESC.demi + 0.175), ESC.z1, 0.26);
  }

  // ---------------------------------------------------------------- Les marches des Nio, le palier, le torii, les gardiens
  {
    const a = atelier(), M5 = MARCHES_NIO, n = M5.n, contre = (Y_NIO - Y_BAS) / n, giron = (M5.z1 - M5.z0) / n;
    for (let j = 0; j < n; j++) {
      const y = Y_BAS + (j + 1) * contre, zf = M5.z1 - j * giron, prof = giron + 0.12, larg = M5.x1 - M5.x0 + (j % 2 ? 0 : 0.06);
      a.boite(larg, 0.6, prof, PIERRE, { x: (M5.x0 + M5.x1) / 2, y: y - 0.3, z: zf - prof / 2 + 0.02, nuance: 0.07, teinte: (wx, wy, wz) => (wy > y - 0.02 && Math.abs(wx) > 1.1 + 0.6 * hasard(wz * 3, j) ? MOUSSE : tachee(j + 20, 0.3)(wx, wy, wz)) });
    }
    monde.rampe(M5.x0, M5.x1, M5.z0, M5.z1, 'z', Y_NIO, Y_BAS, { sol: 'pierre' });
    // le torii de pierre (鳥居), patiné : ses piliers, le linteau du haut (笠木) un peu cintré, la traverse (貫), la plaque
    const T = TORII, yT = Y_NIO, R = repere(T.x, T.z, 0);
    for (const s of [-1, 1]) {
      a.cylindre(0.15, 0.17, T.h, 10, PIERRE, { ...R(s * T.demi, yT + T.h / 2 - 0.05, 0), teinte: tachee(s * 3, 0.25) })
        .cylindre(0.24, 0.27, 0.22, 10, PIERRE_F, { ...R(s * T.demi, yT + 0.06, 0), teinte: tachee(s * 4, 0.4) });
      monde.cercle(T.x + s * T.demi, T.z, 0.46);
    }
    a.piece(new THREE.BoxGeometry(2 * T.demi + 1.0, 0.24, 0.36, 12, 1, 1), PIERRE, {
      ...R(0, yT + T.h + 0.07, 0), teinte: tachee(9, 0.3),
      deformer: (px, py, pz) => [px, py + 0.05 * (px / (T.demi + 0.5)) ** 2 + (Math.abs(px) > T.demi + 0.2 ? (Math.abs(px) - T.demi - 0.2) * 0.12 : 0), pz],
    })
      .boite(2 * T.demi + 0.5, 0.16, 0.3, PIERRE_F, { ...R(0, yT + T.h - 0.15, 0), teinte: tachee(10, 0.3) })
      .boite(2 * T.demi + 0.62, 0.2, 0.2, PIERRE, { ...R(0, yT + T.h - 0.78, 0), teinte: tachee(11, 0.3) })
      .boite(0.36, 0.42, 0.13, PIERRE_F, { ...R(0, yT + T.h - 0.45, 0.02), teinte: tachee(12, 0.1) });
    ecrire({ x: T.x, y: yT, z: T.z, ry: 0 }, { texte: '三十仏', vertical: true, x: 0, y: T.h - 0.45, z: 0.088, l: 0.2, h: 0.34, fond: null, encre: '#4a4d45' });
    // la corde sacrée (注連縄) et ses papiers en zigzag (紙垂), entre les piliers
    a.shimenawa([pt(R, -T.demi, yT + 2.12, 0.18), pt(R, 0, yT + 1.98, 0.18), pt(R, T.demi, yT + 2.12, 0.18)], 0.045, [-0.65, 0, 0.65].map((u) => pt(R, u, yT + 1.95 + 0.06 * Math.abs(u), 0.2)));
    // les deux gardiens, sur leur socle de pierre, à droite (阿形, la bouche ouverte) et à gauche (吽形) en arrivant
    for (const s of [-1, 1]) {
      const x = NIO.x + s * NIO.ecart, Rn = repere(x, NIO.z, -s * 0.08);
      const sombre = (g, m) => (wx, wy, wz) => { const n = bruitDoux(wx * 2.7 + g, wy * 2.9 + wz * 2.1, 1); return n > 0.78 ? '#7d806e' : n < m ? MOUSSE_F : n < m + 0.25 ? '#4a4e48' : '#555952'; };
      nio(THREE, a, Rn, Y_NIO + 0.62, s > 0, s, { PIERRE: '#555952', PIERRE_F: '#474b45', LICHEN, MOUSSE, tachee: sombre });
      murRect(Rn, 0.5, 0.42, 0.3);
    }
    // le palier : des pierres plates au bord, des fougères ; deux lanternes de pierre en bas des marches
    lanterne(a, -3.6, 21.6, 5.5);
    lanterne(a, 3.6, 21.6, 5.5);
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- La terrasse : le pavillon sous la falaise, les 30 bouddhas
  const BOUDDHAS = [];
  {
    const a = atelier(), R = repere(DO.x, DO.z, 0), yS = Y_T + 0.62, L2 = DO.l / 2, P2 = DO.p / 2;
    const BOIS = '#5f4a39', BOIS_F = '#463629', BOIS_C = '#7a624c', CUIVRE = '#6a9086', CUIVRE_F = '#557870';
    // le socle de pierres brutes, le plancher
    a.boite(DO.l + 0.3, 0.7, DO.p + 0.3, PIERRE_F, { ...R(0, Y_T + 0.25, 0), teinte: tachee(31, 0.32) })
      .boite(DO.l, 0.08, DO.p, BOIS_C, { ...R(0, yS - 0.04, 0) });
    // le toit en appentis, en cuivre vert-de-gris, qui descend vers l'avant (yArr derrière, yAv devant) ; dessous(lz) : la
    // hauteur de son dessous à lz (dans le repère du pavillon). (Jusqu'au 2026-10-30, il était tourné à l'envers : haut devant
    // et bas derrière, où les poteaux le traversaient ; le propriétaire : « Le toit du bâtiment en haut, là où il y a les
    // statues, il est en biais »)
    const yArr = yS + 3.75, yAv = yS + 3.05, avance = 0.9, pente = Math.atan2(yArr - yAv, DO.p + avance), zToit = avance / 2 - 0.15;
    const yToit = (yArr + yAv) / 2 + 0.06, dessous = (lz) => yToit - (lz - zToit) * Math.tan(pente) - 0.04 / Math.cos(pente);
    // les poteaux (devant tous les 2,05 m), les longrines, la traverse haute ; devant, des panneaux bas, en haut une frise
    // à barreaux ; derrière, la falaise elle-même (les poteaux et les poutres jusque sous le toit)
    const NB = 8, pasP = DO.l / NB, hArr = dessous(-P2 + 0.1) + 0.02 - yS;
    for (let i = 0; i <= NB; i++) {
      const lx = -L2 + i * pasP;
      a.boite(0.2, 3.2, 0.2, BOIS_F, R(lx, yS + 1.6, P2 - 0.1)).boite(0.2, hArr, 0.2, BOIS_F, R(lx, yS + hArr / 2, -P2 + 0.1));
      if (i < NB) {
        const cx = lx + pasP / 2;
        a.boite(pasP - 0.2, 0.86, 0.06, BOIS, R(cx, yS + 0.43, P2 - 0.08)).boite(pasP - 0.2, 0.06, 0.1, BOIS_F, R(cx, yS + 0.9, P2 - 0.08));
        for (let b = 1; b < 9; b++) a.boite(0.035, 0.5, 0.035, BOIS_F, R(lx + 0.1 + ((pasP - 0.2) * b) / 9, yS + 2.75, P2 - 0.08));
      }
    }
    // (les poutres finissent dans les poteaux d'angle, 2 cm avant leur face : bout à bout dans son plan, elles scintillaient)
    a.boite(DO.l + 0.16, 0.16, 0.18, BOIS_F, R(0, yS + 3.1, P2 - 0.1)).boite(DO.l + 0.16, 0.12, 0.14, BOIS_F, R(0, yS + 2.48, P2 - 0.1))
      .boite(DO.l + 0.16, 0.16, 0.18, BOIS_F, R(0, dessous(-P2 + 0.1) - 0.07, -P2 + 0.1));
    // les côtés : des planches, du plancher jusque sous le toit
    for (const s of [-1, 1]) a.piece(new THREE.BoxGeometry(0.06, 1, DO.p - 0.2), BOIS, { ...R(s * (L2 - 0.03), 0, 0), deformer: (px, py, pz) => [px, py > 0 ? dessous(pz) - 0.005 : yS, pz] });
    // le toit, sa planche de rive (devant, sous son bord), la planche sous son bord
    const Lt = Math.hypot(DO.p + avance + 0.3, yArr - yAv);
    a.boite(DO.l + 1.2, 0.08, Lt, CUIVRE, { ...R(0, yToit, zToit), rx: pente })
      .boite(DO.l + 1.24, 0.18, 0.06, CUIVRE_F, R(0, yAv - 0.06, P2 + avance + 0.02))
      .boite(DO.l + 1.18, 0.06, 0.4, '#3f6f62', { ...R(0, dessous(P2 + avance - 0.18) - 0.031, P2 + avance - 0.18), rx: pente });
    // les marches de bois de l'entrée (deux, comme dans le TikTok), le tronc des offrandes, la corde et ses papiers ; les
    // planches des côtés des marches, plus hautes vers le pavillon (elles penchaient à l'envers, comme le toit)
    for (const e of [-L2 + pasP * 1.5, L2 - pasP * 2.5]) {
      for (let j = 0; j < 3; j++) a.boite(1.2 + (j % 2) * 0.04, 0.12, 0.34, BOIS_C, R(e, Y_T + 0.17 + j * 0.2, P2 + 0.85 - j * 0.3));
      for (const s of [-1, 1]) a.boite(0.08, 0.7, 0.9, BOIS, { ...R(e + s * 0.64, Y_T + 0.3, P2 + 0.47), rx: 0.5 });
    }
    const tronc = R(-0.6, Y_T + 0.32, P2 + 0.55);
    a.boite(0.9, 0.5, 0.5, BOIS_F, { ...tronc }).boite(0.92, 0.04, 0.52, BOIS, { ...tronc, y: Y_T + 0.58 });
    ecrire({ x: tronc.x, y: Y_T, z: tronc.z, ry: 0 }, { texte: '奉納', x: 0, y: 0.34, z: 0.256, l: 0.3, h: 0.14, fond: null, encre: '#e8dcc0' });
    a.shimenawa([pt(R, -L2 + 0.2, yS + 2.35, P2 + 0.06), pt(R, -L2 / 2, yS + 2.22, P2 + 0.06), pt(R, 0, yS + 2.35, P2 + 0.06), pt(R, L2 / 2, yS + 2.22, P2 + 0.06), pt(R, L2 - 0.2, yS + 2.35, P2 + 0.06)], 0.03,
      [-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75].map((u) => pt(R, u * L2, yS + 2.22 + 0.13 * Math.abs(Math.sin(u * PI * 2)) - 0.05, P2 + 0.08)));
    // dedans : trois gradins de pierre contre la falaise, dix bouddhas sur chacun (un pour chaque jour du mois), et devant
    // eux, l'autel aux bougies ; un masque d'oni pendu au poteau du milieu (celui de la fête du feu)
    for (let r = 0; r < 3; r++) a.boite(DO.l - 0.6 - r * 0.12, 0.42 * (r + 1), 0.5, PIERRE_F, { ...R(0, yS + 0.21 * (r + 1), -P2 + 0.35 + (2 - r) * 0.45 - 0.45), teinte: tachee(40 + r, 0.4) });
    for (let r = 0; r < 3; r++) {
      for (let i = 0; i < 10; i++) {
        const lx = -L2 + 0.9 + i * ((DO.l - 1.8) / 9), lz = -P2 + 0.35 + (2 - r) * 0.45 - 0.45, y = yS + 0.42 * (r + 1);
        const q = R(lx, y, lz + 0.05), jour = r * 10 + i + 1;
        bouddha(THREE, a, q.x, y, q.z, 0, jour, { PIERRE, PIERRE_F, LICHEN, MOUSSE, tachee });
        BOUDDHAS.push({ jour, x: q.x, y, z: q.z });
      }
    }
    a.boite(DO.l - 2, 0.06, 0.5, BOIS_F, R(0, yS + 0.78, -P2 + 1.65)).boite(0.08, 0.76, 0.08, BOIS_F, R(-L2 + 1.2, yS + 0.38, -P2 + 1.65)).boite(0.08, 0.76, 0.08, BOIS_F, R(L2 - 1.2, yS + 0.38, -P2 + 1.65));
    for (let i = 0; i < 30; i++) a.cylindre(0.012, 0.012, 0.09, 5, '#f4efe2', R(-L2 + 1.3 + i * ((DO.l - 2.6) / 29), yS + 0.86, -P2 + 1.62));
    // le masque de l'oni (rouge, deux cornes), pendu au poteau du milieu de la façade, côté dedans
    {
      const q = R(-L2 + 4 * pasP, yS + 1.95, P2 - 0.25);
      a.ovale(0.17, '#c8442e', { ...q, sx: 1, sy: 1.15, sz: 0.5 }).ovale(0.05, '#f2e2b0', { ...q, x: q.x - 0.06, y: q.y + 0.04, z: q.z - 0.07, sz: 0.5 }).ovale(0.05, '#f2e2b0', { ...q, x: q.x + 0.06, y: q.y + 0.04, z: q.z - 0.07, sz: 0.5 })
        .cone(0.035, 0.14, 6, '#e8dcc0', { ...q, x: q.x - 0.09, y: q.y + 0.22, rz: 0.3 }).cone(0.035, 0.14, 6, '#e8dcc0', { ...q, x: q.x + 0.09, y: q.y + 0.22, rz: -0.3 });
    }
    poser(a.fin(), 0, 0, { y: 0 });
    // le pavillon, plein (on le regarde de la terrasse) ; ses marches ; le toit et la falaise au-dessus, pour la caméra
    murRect(R, L2 + 0.15, P2 + 0.15, 0.27);
    for (const e of [-L2 + pasP * 1.5, L2 - pasP * 2.5]) { const q = R(e, 0, P2 + 0.62); monde.mur(q.x - 0.95, q.z + 0.6, q.x + 0.95, q.z + 0.6, 0.05); monde.mur(q.x - 0.95, q.z - 0.5, q.x - 0.95, q.z + 0.6, 0.05); monde.mur(q.x + 0.95, q.z - 0.5, q.x + 0.95, q.z + 0.6, 0.05); }
    murRect(repere(tronc.x, tronc.z, 0), 0.46, 0.26, 0.27);
    monde.toit(DO.x - L2 - 0.6, DO.x + L2 + 0.6, DO_ARRIERE - 0.3, DO_AVANT + avance, yAv - 0.1, yArr + 0.4);
    lumieres.push({ x: DO.x, y: yS + 1.0, z: DO_ARRIERE + 1.7, halo: 0, sol: yS, r: 4.2, c: '#ffc070' });
    lumieres.push({ x: DO.x - 5, y: yS + 1.0, z: DO_ARRIERE + 1.7, halo: 0, sol: yS, r: 3.6, c: '#ffc070' });
    lumieres.push({ x: DO.x + 5, y: yS + 1.0, z: DO_ARRIERE + 1.7, halo: 0, sol: yS, r: 3.6, c: '#ffc070' });
  }

  // le bord de la terrasse à l'ouest de l'escalier : des pierres moussues posées en ligne (elles arrêtent)
  {
    const a = atelier();
    for (let x = TERRASSE.x0 + 0.2; x < -1.3; x += 0.62) rocher(a, x + 0.3, Y_T - 0.08, TERRASSE.z1 + 0.02, 0.32, 0.24, 0.22, hasard(x, 3) * PI);
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- L'écho (le tampon)
  // un petit panneau de bois sous son chapeau (立札), à gauche de l'endroit d'où l'on appelle : « やまびこ » et le dessin du
  // tampon, quelqu'un qui appelle et la falaise qui répond. (2026-10-30 : il n'y avait rien là, et l'appel ne se proposait qu'à
  // 2 m d'un point du milieu de la terrasse ; le propriétaire : « je n'arrive pas à faire le dernier tampon ».)
  // (dans le morceau de décor où il est : un objet à lui seul coûtait trois appels de dessin)
  {
    const { x, z, ry } = ECHO_PANNEAU, a = morceau(x, z), y = solDessine(x, z).h - 0.03, R = repere(x, z, ry);
    a.boite(0.09, 1.43, 0.09, '#5a4636', R(0, y + 0.615, -0.045))
      .boite(0.46, 0.52, 0.03, '#a8865a', R(0, y + 1.05, 0.015))
      .pignon(0.6, 0.11, 0.17, '#4f4a44', R(0, y + 1.3, -0.03));
    // (le dessin est peint ; « やまびこ » en second texte, pour que la police charge ces lettres)
    ecrire({ x, y, z, ry }, {
      texte: '', sous: 'やまびこ', x: 0, y: 1.05, z: 0.035, l: 0.42, h: 0.48, fond: null,
      dessin: (c, W, H) => {
        c.fillStyle = '#d6c193'; c.fillRect(0, 0, W, H);
        c.fillStyle = c.strokeStyle = '#2e3c40'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.font = `800 ${Math.round(H * 0.19)}px "M PLUS Rounded 1c", sans-serif`;
        c.fillText('やまびこ', W / 2, H * 0.16, W * 0.9);
        // (le motif du tampon, carnet.js, dans sa boîte de 120 : le voyageur, ses trois ondes, l'écho qui revient, la falaise)
        const k = Math.min((W * 0.9) / 110, (H * 0.66) / 108);
        c.translate(W / 2 - 61 * k, H * 0.31 - 8 * k);
        c.scale(k, k);
        c.lineCap = 'round';
        c.fill(new Path2D('M84 8 L116 8 L116 116 L76 116 Q86 96 80 80 Q92 64 84 48 Q94 30 84 8 Z'));
        c.beginPath(); c.arc(20, 62, 7, 0, 2 * PI); c.fill();
        c.fill(new Path2D('M13 72 L27 72 L30 102 L10 102 Z'));
        c.lineWidth = 3.4; c.stroke(new Path2D('M36 52 Q44 64 36 76 M46 46 Q56 64 46 82 M56 40 Q68 64 56 88'));
        c.lineWidth = 2.4; c.setLineDash([3, 4]); c.stroke(new Path2D('M72 50 Q65 64 72 78'));
      },
    });
    const cs = Math.cos(ry), sn = Math.sin(ry);
    monde.mur(x - 0.24 * cs, z + 0.24 * sn, x + 0.24 * cs, z - 0.24 * sn, 0.3);
  }

  // ---------------------------------------------------------------- Le clocher (鐘楼)
  const CLOCHE = { x: SHORO.x, z: SHORO.z, y: Y_T + 0.3 };
  {
    const a = atelier(), S = SHORO, R = repere(S.x, S.z, 0), y0 = Y_T + 0.3, d = S.c / 2;
    a.boite(S.c + 0.9, 0.42, S.c + 0.9, PIERRE_F, { ...R(0, y0 - 0.2, 0), teinte: tachee(50, 0.35) });
    for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      a.fut(pt(R, u * (d + 0.08), y0, v * (d + 0.08)), pt(R, u * d, y0 + 3.5, v * d), 0.13, 0.11, '#5a4434', 8)
        .boite(0.34, 0.2, 0.34, PIERRE, { ...R(u * (d + 0.08), y0 + 0.08, v * (d + 0.08)) });
      monde.cercle(S.x + u * (d + 0.06), S.z + v * (d + 0.06), 0.42);
    }
    for (const v of [-1, 1]) a.boite(S.c + 0.5, 0.2, 0.18, '#4f3d2f', R(0, y0 + 3.4, v * d)).boite(0.17, 0.2, S.c + 0.5, '#4f3d2f', R(v * d, y0 + 3.43, 0)).boite(S.c + 0.3, 0.12, 0.12, '#4f3d2f', R(0, y0 + 2.6, v * d));
    a.boite(0.2, 0.24, S.c + 0.2, '#4f3d2f', R(0, y0 + 3.62, 0));
    a.toitJapon(S.c + 1.9, S.c + 1.9, 1.15, 0.22, { ...R(0, y0 + 3.75, 0), tuile: '#6f7478', tuile2: '#7d8287', bord: '#4f5458', rangs: 10 });
    // la cloche de bronze, pendue : son anneau (竜頭), son corps aux bandes et aux tétons (乳), la fleur de lotus où frappe le
    // tronc (撞座)
    const BR = '#4f5a48', BRF = '#3f4a3a';
    a.boite(0.1, 0.26, 0.1, BRF, R(0, y0 + 3.36, 0)).piece(new THREE.TorusGeometry(0.1, 0.035, 6, 12), BRF, R(0, y0 + 3.24, 0));
    a.piece(new THREE.LatheGeometry([[0.001, 0], [0.3, 0.02], [0.37, 0.12], [0.39, 0.5], [0.41, 0.95], [0.44, 1.18], [0.45, 1.25], [0.001, 1.2]].map(([r, h]) => new THREE.Vector2(r, 1.25 - h)), 18), BR, { ...R(0, y0 + 1.85, 0) });
    for (const [h, e] of [[0.98, 0.03], [0.55, 0.025], [0.2, 0.025]]) a.cylindre(0.41 + (1 - h) * 0.04 + e, 0.41 + (1 - h) * 0.04 + e, 0.04, 18, BRF, R(0, y0 + 1.85 + h, 0));
    for (let q4 = 0; q4 < 4; q4++) {
      const t = (q4 / 4) * 2 * PI + PI / 4;
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
        const tt = t + (i - 1) * 0.16, yy = y0 + 1.85 + 0.72 + j * 0.13, rr = 0.405;
        a.boule(0.022, BRF, { x: S.x + Math.sin(tt) * rr, y: yy, z: S.z + Math.cos(tt) * rr });
      }
    }
    a.cylindre(0.1, 0.1, 0.03, 12, BRF, { ...R(0.43, y0 + 2.18, 0), rz: PI / 2 });
    monde.cercle(S.x, S.z, 0.7, y0 - 1, y0 + 3.2);
    // la torche brûlée (松明), appuyée au poteau sud-est (un indice : quelqu'un est venu, la nuit) : un fagot de bambous fendus
    // lié de trois cordes de paille, noirci et cendreux en haut. Son pied sur le sol de la terrasse, 30 cm au-delà du coin du
    // socle ; en haut, le bord du bambou tourné vers le poteau touche son arête. (2026-10-30 : elle traversait le poteau, et le
    // propriétaire l'a prise pour « l'espèce de bâton pour frapper la cloche » ; puis son pied, au bord du socle, flottait à
    // 27 cm du sol et son haut s'arrêtait à 3 cm du poteau : « la torche flotte ».)
    {
      const V = (u) => { const l = Math.hypot(...u); return u.map((v) => v / l); }, X3 = (p, q) => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
      const diag = [Math.SQRT1_2, 0, Math.SQRT1_2], pied = pt(R, d + 0.75, 0, d + 0.75), B = [pied[0], solDessine(pied[0], pied[2]).h - 0.04, pied[2]];
      // (l'axe du poteau, penché vers le clocher, et son rayon, à la hauteur y ; ses huit faces ont une arête au sud-est)
      const axeP = (y) => pt(R, d + 0.08 - (0.08 * (y - y0)) / 3.5, y, d + 0.08 - (0.08 * (y - y0)) / 3.5), rP = (y) => 0.13 - (0.02 * (y - y0)) / 3.5;
      // (le bambou 1 regarde le poteau, et c'est le plus long : les autres ne l'atteignent pas)
      const ANG = (k) => (k / 5) * 2 * PI + 0.3, BOUT = (k) => (k === 1 ? 1 : 0.97 + 0.025 * hasard(k, 4.1));
      let T, A, e1, e2, L;
      const sur = (f, r = 0, ang = 0) => [0, 1, 2].map((i) => B[i] + A[i] * L * f + (e1[i] * Math.cos(ang) + e2[i] * Math.sin(ang)) * r);
      // le haut, sur la diagonale du poteau à 1,5 m au-dessus du socle, rapproché jusqu'à ce que le bord du bambou 1 entre de
      // 5 mm dans l'arête
      for (let n = 0, dl = 0.18; n < 6; n++) {
        const c = axeP(y0 + 1.5);
        T = [c[0] + diag[0] * dl, c[1], c[2] + diag[2] * dl];
        A = V([T[0] - B[0], T[1] - B[1], T[2] - B[2]]); e1 = V(X3(A, [0, 1, 0])); e2 = X3(A, e1); L = Math.hypot(T[0] - B[0], T[1] - B[1], T[2] - B[2]);
        const bord = sur(BOUT(1), 0.044 + 0.014, ANG(1)), cb = axeP(bord[1]);
        dl -= Math.hypot(bord[0] - cb[0], bord[2] - cb[2]) - (rP(bord[1]) - 0.005);
      }
      const yNoir = B[1] + A[1] * L * 0.8, yCendre = B[1] + A[1] * L * 0.97;
      const brule = (wx, wy) => (wy > yCendre ? '#6f6a64' : wy > yNoir ? (hasard(wx * 31, wy * 17) > 0.5 ? '#231e1b' : '#2f2925') : wy > yNoir - 0.06 ? '#5a4a34' : '#9a8250');
      // (cinq bambous autour de l'axe, sans se chevaucher : serrés, leurs faces scintillaient ; en anneaux, pour que le haut
      // soit noirci : la couleur se prend au milieu de chaque triangle, et un fût d'un seul tenant n'en a pas en haut)
      for (let k = 0; k < 5; k++) {
        const fs = [0, 0.5, 0.76, 0.8, 0.88, 0.97, BOUT(k)];
        a.tronc(fs.map((f) => sur(f, 0.032 + (0.012 * f) / BOUT(k), ANG(k))), fs.map((f) => 0.017 - (0.003 * f) / BOUT(k)), '#9a8250', 5, { teinte: brule });
      }
      for (const f of [0.18, 0.5, 0.74]) a.baton(sur(f - 0.018), sur(f + 0.018), 0.052, '#c8a868', 8, { teinte: (wx, wy, wz) => (Math.floor((wx + wz) * 90 + wy * 40) % 2 ? '#c8a868' : '#b0904f') });
      // (on bute contre elle du pied jusqu'au cercle du poteau)
      const mi = pt(R, d + 0.3, 0, d + 0.3);
      monde.mur(B[0], B[2], mi[0], mi[2], 0.28);
    }
    poser(a.fin(), 0, 0, { y: 0 });
    monde.surface(S.x - d - 0.45, S.x + d + 0.45, S.z - d - 0.45, S.z + d + 0.45, y0, { sol: 'pierre' });
    monde.toit(S.x - d - 0.9, S.x + d + 0.9, S.z - d - 0.9, S.z + d + 0.9, y0 + 3.35, y0 + 5);
  }

  // ---------------------------------------------------------------- Le stupa de Kunisaki (国東塔), le grand cèdre sacré
  {
    const a = atelier(), x = TO.x, z = TO.z, y = Y_T, t = tachee(60, 0.35);
    a.boite(1.5, 0.34, 1.5, PIERRE_F, { x, y: y + 0.12, z, teinte: t }).boite(1.12, 0.36, 1.12, PIERRE, { x, y: y + 0.45, z, teinte: t });
    // le socle aux pétales retournés (反花), le lotus (蓮華座), le corps rond (塔身), le toit carré aux coins relevés, la flèche
    a.cylindre(0.46, 0.6, 0.24, 16, PIERRE, { x, y: y + 0.75, z, teinte: t, deformer: (px, py, pz) => { const k = 1 + 0.06 * Math.cos(Math.atan2(pz, px) * 8); return [px * k, py, pz * k]; } })
      .cylindre(0.5, 0.36, 0.22, 16, PIERRE, { x, y: y + 0.98, z, teinte: t, deformer: (px, py, pz) => { const k = 1 + 0.08 * Math.max(0, Math.cos(Math.atan2(pz, px) * 8)); return [px * k, py, pz * k]; } })
      .ovale(0.36, PIERRE, { x, y: y + 1.42, z, sy: 1.25, teinte: t }, 14)
      .toitJapon(1.15, 1.15, 0.36, 0.25, { x, y: y + 1.88, z, tuile: PIERRE, tuile2: '#7a7f74', bord: PIERRE_F, rangs: 4, releve: 0.08, epaisseur: 0.08 });
    for (let k = 0; k < 9; k++) a.cylindre(0.085 - k * 0.004, 0.085 - k * 0.004, 0.06, 10, k % 2 ? PIERRE_F : PIERRE, { x, y: y + 2.3 + k * 0.085, z });
    a.ovale(0.11, PIERRE, { x, y: y + 3.15, z, sy: 1.3, teinte: t }, 10).cone(0.05, 0.12, 8, PIERRE_F, { x, y: y + 3.3, z });
    monde.cercle(x, z, 1.02);
    // le grand cèdre sacré : un tronc énorme, sa corde et ses papiers, un muret de pierres autour
    const S = SHINBOKU, ys = terrain(S.x, S.z);
    a.fut([S.x, ys - 0.6, S.z], [S.x, ys + 38, S.z], S.r, 0.2, '#5a3e2e', 10).fut([S.x, ys - 0.6, S.z], [S.x, ys + 1.2, S.z], S.r * 1.45, S.r * 1.02, '#4f3727', 10);
    for (let k = 0; k < 5; k++) { const ang = k * 1.26 + 0.4; a.fut([S.x, ys + 0.2, S.z], [S.x + Math.sin(ang) * (S.r + 0.9), ys - 0.35, S.z + Math.cos(ang) * (S.r + 0.9)], 0.32, 0.12, '#4f3727', 6, { trait: false }); }
    const corde = []; for (let k = 0; k <= 16; k++) { const ang = (k / 16) * 2 * PI; corde.push([S.x + Math.sin(ang) * (S.r * 1.08 + 0.05), ys + 1.9 - 0.06 * Math.sin(ang * 3), S.z + Math.cos(ang) * (S.r * 1.08 + 0.05)]); }
    a.shimenawa(corde, 0.07, [2, 6, 10, 14].map((k) => [corde[k][0] + (corde[k][0] - S.x) * 0.04, corde[k][1] - 0.12, corde[k][2] + (corde[k][2] - S.z) * 0.04]));
    for (let k = 0; k < 26; k++) { const ang = (k / 26) * 2 * PI; rocher(a, S.x + Math.sin(ang) * (S.r + 1.3), ys + 0.08, S.z + Math.cos(ang) * (S.r + 1.3), 0.34, 0.3, 0.3, ang); }
    for (let i = 0; i < 4; i++) { const t = i / 3, yb = ys + 22 + t * 15, r = 4.2 - 2.6 * t; a.houppe(r, i % 2 ? '#3f5f3a' : '#36533a', { x: S.x + (hasard(i, 9) - 0.5), y: yb, z: S.z + (hasard(9, i) - 0.5), sy: 0.55, sorte: 'conifere' }, 1); }
    monde.cercle(S.x, S.z, S.r + 1.55);
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- La falaise : sa paroi, le surplomb au-dessus du pavillon
  // Une paroi de roche (une grille déformée, posée devant la pente de la montagne) du pied de la falaise à son haut ; au-dessus
  // du pavillon, elle avance en surplomb, comme dans le TikTok ; ses bords se perdent dans la pente. Moussue sur ses
  // replats, tachée de lichen, sombre et mouillée près de la cascade.
  const hautFalaise = (x) => terre(x, zParoi(x) - 5.2);
  // (les longueurs parcourues le long d'une ligne de points [x, y], de 0 à 1 ; le point à la fraction u de sa longueur ; le
  // contour de la bouche de la grotte, NA points également espacés : la paroi, sa lèvre, la salle et la dalle le partagent)
  const fractions = (pts) => { const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return L.map((l) => l / L[L.length - 1]); };
  const surLigne = (pts, us, u) => { let i = 1; while (i < pts.length - 1 && us[i] < u) i++; const f = (u - us[i - 1]) / (us[i] - us[i - 1] || 1); return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f]; };
  const NA = 46, uA = Array.from({ length: NA }, (_, j) => j / (NA - 1));
  const arche = (() => { const dense = Array.from({ length: 401 }, (_, i) => archeGrotte(i / 400)), uD = fractions(dense); return uA.map((u) => surLigne(dense, uD, u)); })();
  const surplomb = (x, y) => {
    const fx = lisse(DO.x - DO.l / 2 - 2.4, DO.x - DO.l / 2 + 0.2, x) * (1 - lisse(DO.x + DO.l / 2 - 0.2, DO.x + DO.l / 2 + 2.4, x));
    const u = (y - (Y_T + 4.9)) / 4.4;
    return u <= 0 || u >= 1 ? 0 : fx * 6.1 * Math.sin(Math.min(1, u * 1.7) * PI * 0.5) * (1 - lisse(0.45, 1, u));
  };
  const bosseParoi = (x, y) => 0.34 * (bruitDoux(x * 0.33, y * 0.33, 2) - 0.5) + 0.16 * (bruitDoux(x * 1.1 + 7, y * 1.1, 1) - 0.5) + 0.1 * Math.sin(y * 1.7 + x * 0.12);
  // (les niches des bouddhas taillés dans la roche, à l'est du pavillon : la paroi y est plate)
  const NICHES = [8.8, 10.9].map((x) => ({ x, y: Y_T + 2.4 }));
  const zFace = (x, y) => {
    const plat = NICHES.reduce((m, n) => Math.min(m, Math.hypot((x - n.x) / 1.3, (y - n.y) / 1.6)), 9);
    return zParoi(x) + 0.75 + bosseParoi(x, y) * lisse(0.6, 1.1, plat) + surplomb(x, y);
  };
  {
    const pos = [], cols = [], X0 = -33, X1 = 21, PAS_X = 1.0;
    const colonnes = [];
    for (let x = X0; x <= X1 + 1e-6; x += PAS_X) {
      const lf = largeurFalaise(x), haut = hautFalaise(x), bas = Y_T - 0.9, sommet = bas + (haut - bas) * Math.max(0.05, lf);
      const ys = [];
      for (let y = bas; y < sommet; y += y > Y_T + 4 && y < Y_T + 10 ? 0.45 : 1.1) ys.push(y);
      ys.push(sommet);
      colonnes.push({ x, pts: ys.map((y, j) => [x, y, j === ys.length - 1 ? zParoi(x) - 5.2 : zFace(x, y)]) });
    }
    // un triangle de la paroi, tourné vers la terrasse ; sa couleur (la mousse sur ce qui regarde vers le haut, les replats ;
    // dessous le surplomb, sombre ; près de la cascade, mouillé ; ailleurs des gris proches les uns des autres : en couleurs
    // franches, la paroi faisait une mosaïque de triangles)
    const ajouter = (A, B, C) => {
      tri(pos, A, B, C, [0, 0, 1]);
      const p = pos.slice(-9), cy = (p[1] + p[4] + p[7]) / 3, cx = (p[0] + p[3] + p[6]) / 3;
      const ux = p[3] - p[0], uy = p[4] - p[1], uz = p[5] - p[2], vx = p[6] - p[0], vy = p[7] - p[1], vz = p[8] - p[2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, ny1 = ny / (Math.hypot(nx, ny, nz) || 1);
      const n = bruitDoux(cx * 0.45, cy * 0.45, 1), dessous = ny1 < -0.35;
      const mouille = Math.abs(cx - TAKI.x) < 1.6 ? 1 : 0;
      cols.push(mouille ? (n > 0.5 ? '#3f4a40' : '#454f42') : dessous ? (n > 0.5 ? '#4b4b42' : '#514f46') : ny1 > 0.42 ? (n > 0.5 ? MOUSSE : MOUSSE_F) : n > 0.66 ? '#68725a' : n < 0.3 ? '#6c695e' : '#646157');
    };
    // (deux colonnes voisines n'ont pas le même nombre de points : on les relie par leur hauteur relative)
    const relier = (A, B) => {
      let i = 0, j = 0;
      while (i < A.length - 1 || j < B.length - 1) {
        const ta = i < A.length - 1 ? (i + 1) / (A.length - 1) : 2, tb = j < B.length - 1 ? (j + 1) / (B.length - 1) : 2;
        if (ta <= tb) { ajouter(A[i], B[j], A[i + 1]); i++; } else { ajouter(A[i], B[j], B[j + 1]); j++; }
      }
    };
    // (entre les colonnes XG0 et XG1, la paroi est refaite sous la rangée I, 2 m au-dessus de la bouche de la grotte)
    const XG0 = -17, XG1 = -12, I = 5;
    for (let c = 0; c < colonnes.length - 1; c++) {
      const A = colonnes[c].pts, B = colonnes[c + 1].pts;
      if (colonnes[c].x > XG0 - 0.5 && colonnes[c + 1].x < XG1 + 0.5) relier(A.slice(I), B.slice(I));
      else relier(A, B);
    }
    // ---- la bouche de la grotte de l'ermite : la paroi en anneaux, de son contour jusqu'au bord de ce morceau (la colonne est,
    // XG1, de bas en haut ; la rangée I ; la colonne ouest, XG0, de haut en bas) ; le dernier anneau rejoint les points mêmes
    // des colonnes (des triangles en fermeture éclair, comme entre deux colonnes) : ni fente ni sommet en trop sur leurs bords
    const sec = colonnes.filter((c) => c.x > XG0 - 0.5 && c.x < XG1 + 0.5);
    const bord = [...sec[sec.length - 1].pts.slice(0, I + 1)];
    for (let c = sec.length - 2; c >= 1; c--) bord.push(sec[c].pts[I]);
    for (let i = I; i >= 0; i--) bord.push(sec[0].pts[i]);
    const uB = fractions(bord);
    const NR = 6, anneaux = [];
    for (let k = 0; k < NR; k++) {
      const f = (k / NR) ** 1.25;
      anneaux.push(uA.map((u, j) => { const [ax, ay] = arche[j], [bx, by] = surLigne(bord, uB, u), x = ax + (bx - ax) * f, y = ay + (by - ay) * f; return [x, y, zFace(x, y)]; }));
    }
    for (let k = 0; k < NR - 1; k++) for (let j = 0; j < NA - 1; j++) {
      const A = anneaux[k][j], B = anneaux[k][j + 1], C = anneaux[k + 1][j + 1], D = anneaux[k + 1][j];
      ajouter(A, B, C);
      ajouter(A, C, D);
    }
    {
      const R = anneaux[NR - 1];
      let i = 0, j = 0;
      while (i < bord.length - 1 || j < NA - 1) {
        const ub = i < bord.length - 1 ? uB[i + 1] : 2, ua = j < NA - 1 ? uA[j + 1] : 2;
        if (ub <= ua) { ajouter(bord[i], R[j], bord[i + 1]); i++; } else { ajouter(bord[i], R[j], R[j + 1]); j++; }
      }
    }
    // ---- dedans : la lèvre (du contour sur la paroi jusqu'au début de la salle, Z_SALLE), puis la salle, de section en section :
    // le contour de la bouche élargi et rehaussé (salleGrotte), bosselé vers le dedans ou le dehors, qui se referme au fond. Des
    // tons de roche de plus en plus sombres vers le fond, mouillés près de la bouche et à leur pied ; tournés vers le dedans
    const TONS_GROTTE = ['#4f5047', '#494a41', '#43443c', '#3e3e37', '#393933', '#35352f', '#31312c', '#2d2d29'];
    const ajouterDedans = (A, B, C, vers) => {
      const m = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3, (A[2] + B[2] + C[2]) / 3], s = Z_SALLE - m[2];
      tri(pos, A, B, C, [vers[0] - m[0], vers[1] - m[1], vers[2] - m[2]]);
      const b = bruitDoux(m[0] * 0.8 + 3.1, m[2] * 0.8 + m[1] * 0.6, 1);
      cols.push(m[1] < GROTTE.sol + 0.25 ? '#3d3c36' : s < 0.35 ? (b > 0.5 ? '#3f4a40' : '#454f42')
        : TONS_GROTTE[Math.max(0, Math.min(TONS_GROTTE.length - 1, Math.round((s / GROTTE.prof) * (TONS_GROTTE.length - 1) + (b - 0.5) * 3)))]);
    };
    const NS = 18, sections = [];
    for (let i = 0; i <= NS; i++) {
      const s = (GROTTE.prof * i) / NS, { fx, fy } = salleGrotte(s), z0 = Z_SALLE - s;
      sections.push(uA.map((u, j) => {
        const [ax, ay] = arche[j], x = GROTTE.x + (ax - GROTTE.x) * fx, y = GROTTE.sol - 0.35 + (ay - GROTTE.sol + 0.35) * fy;
        // (ses bosses : pas à la lèvre, et de moins en moins vers le fond, où tout se rejoint)
        const b = (0.26 * (bruitDoux(x * 0.8 + 3, z0 * 0.8 + y * 0.6, 1) - 0.5) + 0.1 * (bruitDoux(x * 2.1, z0 * 2.1 - y, 1) - 0.5)) * lisse(0, 0.7, s) * Math.min(1, fx);
        const dx = GROTTE.x - x, dy = GROTTE.sol + 0.9 - y, dl = Math.hypot(dx, dy) || 1;
        return [x + (dx / dl) * b, y + (dy / dl) * b, z0];
      }));
    }
    for (let j = 0; j < NA - 1; j++) {
      const A = anneaux[0][j], B = anneaux[0][j + 1], C = sections[0][j + 1], D = sections[0][j], vers = [GROTTE.x, GROTTE.sol + 1.0, (A[2] + C[2]) / 2];
      ajouterDedans(A, B, C, vers);
      ajouterDedans(A, C, D, vers);
    }
    for (let i = 0; i < NS; i++) for (let j = 0; j < NA - 1; j++) {
      const A = sections[i][j], B = sections[i][j + 1], C = sections[i + 1][j + 1], D = sections[i + 1][j];
      const vers = [GROTTE.x, GROTTE.sol + 1.0, Z_SALLE - Math.min((GROTTE.prof * (i + 0.5)) / NS, GROTTE.prof - 1.8)];
      ajouterDedans(A, B, C, vers);
      // (la dernière section est un point : un triangle par case)
      if (i < NS - 1) ajouterDedans(A, C, D, vers);
    }
    const a = atelier(), g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    a.piece(g, '#7a766a', { couleurs: cols, nuance: 0.05 });
    // des lianes et des fougères accrochées à la paroi, de l'eau qui suinte
    for (let k = 0; k < 46; k++) {
      const x = X0 + 4 + hasard(k, 1) * (X1 - X0 - 8), lf = largeurFalaise(x);
      if (lf < 0.6) continue;
      const y = Y_T + 1.5 + hasard(k, 2) * (hautFalaise(x) - Y_T - 4), z = zFace(x, y) + 0.12;
      if (Math.abs(x - TAKI.x) < 2 || NICHES.some((n) => Math.abs(x - n.x) < 1.1 && Math.abs(y - n.y) < 1.5)) continue;
      a.houppe(0.35 + 0.35 * hasard(k, 3), k % 3 ? '#4f7a3e' : '#5d8a44', { x, y, z, sy: 0.6, sz: 0.5, sorte: 'persistant' }, 1);
    }
    poser(a.fin(), 0, 0, { y: 0 });
    monde.toit(DO.x - DO.l / 2 - 1.5, DO.x + DO.l / 2 + 1.5, Z_PAROI - 0.5, DO_AVANT + 0.6, Y_T + 4.6, Y_T + 9.5);
  }
  // les bouddhas taillés dans la roche (磨崖仏), chacun dans sa niche en arc, tournée comme la paroi : le creux sombre, le bord de
  // pierre qui avance (moussu sur le dessus), le rebord où il est assis, l'auréole taillée derrière lui (2026-10-30, refaits : le
  // propriétaire, « refais les espèces de statues en pierre là sur le mur » : un rectangle noir et trois boules)
  {
    const a = atelier(), NICHE = '#6e6a5e';
    const arc = (s, l, bas, haut) => { s.moveTo(-l, bas); s.lineTo(l, bas); s.lineTo(l, haut); s.absarc(0, haut, l, 0, PI, false); s.lineTo(-l, bas); return s; };
    const moussu = (y0, g) => { const tt = tachee(g, 0.3); return (wx, wy, wz) => (wy > y0 && hasard(wx * 7, wz * 7) > 0.35 ? MOUSSE : tt(wx, wy, wz)); };
    NICHES.forEach((n, i) => {
      const z = zFace(n.x, n.y), ry = Math.atan2(-(zFace(n.x + 0.01, n.y) - zFace(n.x - 0.01, n.y)) / 0.02, 1), R = repere(n.x, z, ry);
      a.piece(new THREE.ShapeGeometry(arc(new THREE.Shape(), 0.5, -0.78, 0.22), 12), '#34352e', { ...R(0, n.y, 0.04), trait: false, nuance: 0.03 });
      const bord = arc(new THREE.Shape(), 0.66, -0.86, 0.22);
      bord.holes.push(arc(new THREE.Path(), 0.5, -0.78, 0.22));
      a.piece(new THREE.ExtrudeGeometry(bord, { depth: 0.19, bevelEnabled: false, curveSegments: 12 }), NICHE, { ...R(0, n.y, -0.03), teinte: moussu(n.y + 0.62, i * 5 + 1), nuance: 0.06 });
      a.boite(1.14, 0.1, 0.62, NICHE, { ...R(0, n.y - 0.79, 0.31), teinte: moussu(n.y - 0.75, i * 5 + 2), nuance: 0.06 });
      // (assis à 29 cm de la paroi : son auréole à 6 cm du creux sombre, pas dans son plan)
      const q = R(0, 0, 0.29);
      bouddha(THREE, a, q.x, n.y - 0.74, q.z, ry, i ? 9 : 4, { PIERRE: '#858171', PIERRE_F: '#6f6b5e', LICHEN, MOUSSE, tachee }, 1.7, { fin: true, mandorle: '#5a5a50' });
    });
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- La cascade et son bassin, Fudō Myōō
  {
    const a = atelier(), x = TAKI.x, zl = zParoi(x) + 0.55, y0 = hautFalaise(x) - 0.4;
    cascades.push({ x, z: zl, y0, y1: TAKI.eau, large: 0.55, evase: 2.0, sortie: [0, 1], avance: 0.45 });
    vapeurs.push({ x, z: zl + 0.9, y: TAKI.eau + 0.05, n: 18, haut: 3.2, large: 1.6, taille: 1.8, opacite: 0.6 });
    // les rochers du bord du bassin (ils l'arrêtent), plus gros vers la falaise
    for (let k = 0; k < 22; k++) {
      const t = (k / 22) * 2 * PI, r = TAKI.r + 0.25, xr = x + Math.sin(t) * r, zr = TAKI.z + Math.cos(t) * r;
      // (au sud, la première pierre de gué prend sa place)
      if (zr < zl + 0.2 || k === 0) continue;
      const s = 0.32 + 0.18 * hasard(k, 5) + (Math.cos(t) < 0 ? 0.15 : 0);
      rocher(a, xr, Y_T - 0.08, zr, s, s * 0.75, s * 0.9, t);
    }
    // Fudō Myōō (不動明王) sur son rocher, à gauche de la chute : le sabre droit, la corde, le feu derrière lui
    const fx = x + 1.5, fz = TAKI.z - 1.1, fy = TAKI.eau + 0.6;
    rocher(a, fx, TAKI.eau - 0.3, fz, 0.7, 0.95, 0.6, 0.3);
    const Rf = repere(fx, fz, -0.3), t = tachee(70, 0.3);
    a.ovale(0.2, PIERRE, { ...Rf(0, fy + 0.3, 0), sx: 1.1, sy: 1.3, sz: 0.8, teinte: t }).ovale(0.11, PIERRE, { ...Rf(0, fy + 0.62, 0.02), teinte: t })
      .boite(0.03, 0.55, 0.02, PIERRE_F, { ...Rf(0.17, fy + 0.6, 0.12) })
      .piece(new THREE.CircleGeometry(0.42, 10), '#6a665a', { ...Rf(0, fy + 0.6, -0.14), trait: false, deformer: (px, py, pz) => { const ang = Math.atan2(py, px), k = 1 + 0.18 * Math.max(0, Math.sin(ang * 7)); return [px * k, py * k * 1.2, pz]; } });
    poser(a.fin(), 0, 0, { y: 0 });
  }
  const eauxCalmes = [[TAKI.x - TAKI.r - 0.4, TAKI.x + TAKI.r + 0.4, TAKI.z - TAKI.r - 0.4, TAKI.z + TAKI.r + 0.4, TAKI.eau]];

  // ---------------------------------------------------------------- La grotte de l'ermite (行者の岩屋) : le gué, la dalle, dedans
  // (ouverte si l'on a déjà vu glisser sa dalle : tresors.js garde l'indice « iwaya »)
  const ouverteAuDepart = indiceVu('iwaya');
  /** Le z à la profondeur s de la salle ; le bol de pierre sous les gouttes ; le plateau d'offrandes (三方) et son koban. */
  const zS = (s) => Z_SALLE - s;
  const BOL = { x: GROTTE.x + 1.5, z: zS(1.7) }, SANBO = { x: GROTTE.x + 0.55, y: GROTTE.sol + 0.72 + 0.125, z: zS(AUTEL_S + 0.2) };
  const FLAMMES = [];
  {
    const a = atelier(), X = GROTTE.x, sol = GROTTE.sol;
    // les pierres de gué (飛び石) : plates, à plusieurs pans, presque jointives, posées sur le fond du bassin ; la dernière, plus
    // grande, sous la chute : on s'y tient sous l'eau (滝行)
    GUE.slice(1).forEach(([x, z, y], k) => {
      // (la dernière, en long : son dos passe sous le sol de la grotte, 25 cm au-delà du bord de la case où il commence)
      const der = k === GUE.length - 2, r = der ? TAKIGYO.r : 0.4 + 0.05 * hasard(k, 3.3), bas = TAKI.eau - 0.8;
      a.piece(new THREE.CylinderGeometry(r, r * 1.1, y - bas, 9, 1), PIERRE_F, {
        x, y: (y + bas) / 2, z: der ? z - 0.12 : z, sz: der ? 1.22 : 1, ry: der ? 0 : hasard(k, 2.9) * 3, nuance: 0.06,
        deformer: (px, py, pz) => { const t = Math.atan2(pz, px), q = 1 + 0.08 * Math.sin(t * 3 + k * 1.7) + 0.04 * Math.sin(t * 7 + k); return [px * q, py, pz * q]; },
        teinte: (wx, wy, wz) => (wy > y - 0.03 ? (der ? '#55574f' : bruitDoux(wx * 3 + k, wz * 3, 1) > 0.66 ? MOUSSE_F : '#5f6159') : '#474a43'),
      });
    });
    monde.chemin(GUE, 0.17, { sol: 'pierre', droits: true });
    monde.anneau(TAKIGYO.x, TAKIGYO.z, 0, TAKIGYO.r - 0.03, TAKIGYO.y, { sol: 'pierre' });
    monde.surface(X - 0.45, X + 0.45, -34.74, -34.3, TAKIGYO.y, { sol: 'pierre' });
    // au pied de la bouche, deux rochers à moitié dans l'eau, de part et d'autre de la pierre
    for (const sg of [-1, 1]) rocher(a, X + sg * 0.98, TAKI.eau - 0.14, Z_GROTTE + 0.22, 0.36, 0.3, 0.32, sg);
    // la corde sacrée (注連縄) tendue devant la chute d'une paroi à l'autre, ses papiers blancs : ici, on prie sous l'eau
    {
      const y = sol + 3.15, A = [X + 1.8, y, zFace(X + 1.8, y) + 0.04], B = [X - 1.8, y + 0.08, zFace(X - 1.8, y + 0.08) + 0.04];
      const pts = [A, [X, sol + 2.8, Z_GROTTE + 0.9], B], courbe = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
      a.shimenawa(pts, 0.06, [0.24, 0.41, 0.59, 0.76].map((t) => { const q = courbe.getPoint(t); return [q.x, q.y - 0.07, q.z]; }));
    }
    // ---- dedans (un objet à part, dessiné seulement la caméra près de la cascade ou dans la grotte : d'ailleurs, on n'en voit
    // rien, et il coûtait 27 000 triangles par image). L'autel : un banc de roche contre le fond, son dessus à plat
    const b = atelier();
    const yA = sol + 0.72;
    b.piece(new THREE.BoxGeometry(1.7, 1.08, 1.0, 6, 3, 3), '#4c4a42', {
      x: X, y: sol + 0.18, z: zS(AUTEL_S + 0.5), nuance: 0.06,
      deformer: (px, py, pz) => (py > 0.53 ? [px, py, pz] : [px * (1 + 0.05 * Math.sin(py * 9 + pz * 7)), py, pz + 0.04 * Math.sin(px * 6 + py * 5)]),
      teinte: (wx, wy) => (wy > yA - 0.02 ? '#57544b' : bruitDoux(wx * 2.3, wy * 2.3, 1) > 0.6 ? '#46443d' : '#4c4a42'),
    });
    // le petit coffre laqué (厨子) ouvert : ses deux portes, son petit toit noir au bord doré, le rouge du dedans ; le bouddha
    // doré (秘仏, le bouddha caché) sur son lotus
    {
      const z = zS(AUTEL_S + 0.55), L = 0.46, H = 0.62, Pp = 0.38, NOIR = '#201a17', OR = P.orKinkaku, zb = z - Pp / 2;
      b.boite(L + 0.02, 0.04, Pp + 0.02, NOIR, { x: X, y: yA + 0.02, z }).boite(L + 0.02, 0.04, Pp + 0.02, NOIR, { x: X, y: yA + H - 0.02, z })
        .boite(0.035, H - 0.08, Pp, NOIR, { x: X - L / 2 + 0.0175, y: yA + H / 2, z }).boite(0.035, H - 0.08, Pp, NOIR, { x: X + L / 2 - 0.0175, y: yA + H / 2, z })
        .boite(L - 0.07, H - 0.08, 0.03, NOIR, { x: X, y: yA + H / 2, z: zb + 0.015 }).boite(L - 0.09, H - 0.12, 0.01, '#6e1e18', { x: X, y: yA + H / 2, z: zb + 0.035 })
        .toitJapon(0.64, 0.54, 0.12, 0.3, { x: X, y: yA + H, z, tuile: NOIR, tuile2: '#2a2420', bord: OR, avant: OR, releve: 0.03, rangs: 6 });
      // (les portes, tournées sur leurs gonds de 110° vers le dehors)
      for (const sg of [-1, 1]) {
        const ang = sg < 0 ? -1.92 : -1.22, dx = Math.cos(ang) * 0.115, dz = -Math.sin(ang) * 0.115;
        b.boite(0.23, H - 0.07, 0.016, NOIR, { x: X + sg * (L / 2) + dx, y: yA + H / 2, z: z + Pp / 2 + dz, ry: ang })
          .boite(0.17, 0.012, 0.02, OR, { x: X + sg * (L / 2) + dx, y: yA + H / 2, z: z + Pp / 2 + dz, ry: ang });
      }
      // (en feuille d'or, celle du Pavillon d'or, qui brille comme un métal ; les cheveux peints en bleu, comme sur les statues
      // dorées ; refait le 2026-10-30 : « refais le Bouddha doré dans la caverne… histoire qu'il soit mieux fait »)
      bouddha(THREE, b, X, yA + 0.04, z + 0.035, 0, 12, { PIERRE: P.orKinkakuClair, PIERRE_F: P.orKinkaku, CHEVEUX: '#2e3b6c', YEUX: '#4a3418', tachee: () => () => P.orKinkakuClair }, 0.6, { fin: true, mandorle: P.orKinkaku });
    }
    // les bougies sur l'autel, le brûle-parfum (香炉) et ses bâtons d'encens, le plateau d'offrandes (三方) du koban
    for (const lx of [-0.52, -0.31, 0.31]) {
      const z = zS(AUTEL_S + 0.13);
      b.cylindre(0.035, 0.04, 0.02, 8, '#9a7a3a', { x: X + lx, y: yA + 0.01, z }).cylindre(0.02, 0.02, 0.14, 6, '#f4efe2', { x: X + lx, y: yA + 0.09, z });
      FLAMMES.push([X + lx, yA + 0.19, z]);
    }
    {
      // (plus près du bord de l'autel, l'encens plus court : il cachait le bouddha)
      const z = zS(AUTEL_S + 0.08);
      b.cylindre(0.075, 0.05, 0.06, 10, '#5a4a32', { x: X, y: yA + 0.05, z });
      for (const k of [0, 1, 2]) b.cylindre(0.012, 0.012, 0.03, 4, '#5a4a32', { x: X + Math.cos(k * 2.1) * 0.05, y: yA + 0.015, z: z + Math.sin(k * 2.1) * 0.05 });
      for (const k of [-1, 0, 1]) b.cylindre(0.004, 0.004, 0.1, 3, '#7a3a2a', { x: X + k * 0.02, y: yA + 0.13, z: z + k * 0.01, rz: k * 0.08, trait: false });
      b.boite(0.15, 0.1, 0.15, '#d8c39a', { x: SANBO.x, y: yA + 0.05, z: SANBO.z }).boite(0.21, 0.025, 0.21, '#e2cfa8', { x: SANBO.x, y: yA + 0.1125, z: SANBO.z });
    }
    // deux chandeliers de fer (燭台) au pied de l'autel, leurs grosses bougies : ils éclairent la grotte, le jour aussi
    for (const sg of [-1, 1]) {
      const x = X + sg * 0.98, z = zS(AUTEL_S - 0.35);
      for (const k of [0, 1, 2]) { const t = k * 2.1 + 0.4; b.baton([x, sol + 0.03, z], [x + Math.cos(t) * 0.14, sol + 0.0, z + Math.sin(t) * 0.14], 0.012, '#2a2622', 4); }
      b.cylindre(0.012, 0.012, 0.95, 5, '#2a2622', { x, y: sol + 0.5, z }).cylindre(0.075, 0.05, 0.03, 10, '#2a2622', { x, y: sol + 0.98, z })
        .cylindre(0.03, 0.032, 0.13, 7, '#f4efe2', { x, y: sol + 1.06, z });
      FLAMMES.push([x, sol + 1.16, z]);
      lumieres.push({ x, y: sol + 1.16, z, halo: 0.14, sol, r: 3.0, c: '#ffb35a', jour: true });
      monde.cercle(x, z, 0.3);
    }
    // le coin de l'ermite, à l'ouest : sa natte de paille (茣蓙), son petit pupitre (経机) et un sutra ouvert, sa conque (法螺貝),
    // son bâton (金剛杖) contre la paroi
    {
      const xm = X - 1.28, zm = zS(2.0);
      b.boite(0.86, 0.03, 1.7, '#b9a571', { x: xm, y: sol + 0.045, z: zm, teinte: (wx, wy, wz) => (Math.floor((wz - zm) * 22 + 40) % 2 ? '#b9a571' : '#a8955f') });
      const xp = X - 1.75, zp = zS(1.45);
      b.boite(0.28, 0.025, 0.5, '#3a2a20', { x: xp, y: sol + 0.28, z: zp });
      for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) b.boite(0.03, 0.25, 0.03, '#3a2a20', { x: xp + u * 0.11, y: sol + 0.15, z: zp + v * 0.21 });
      b.boite(0.2, 0.01, 0.3, '#efe8d6', { x: xp, y: sol + 0.298, z: zp, ry: 0.08, trait: false }).boite(0.004, 0.012, 0.28, '#a89a7a', { x: xp, y: sol + 0.3, z: zp, ry: 0.08, trait: false });
      monde.cercle(xp, zp, 0.42);
      // (la conque : un cône clair à bandes brunes, couché, son ouverture évasée)
      const xc = X - 1.0, zc = zS(2.4);
      b.cone(0.075, 0.24, 9, '#e8dcc0', { x: xc, y: sol + 0.13, z: zc, rz: PI / 2 - 0.15, ry: 0.6, teinte: (wx, wy, wz) => (Math.floor(Math.hypot(wx - xc, wz - zc) * 40) % 2 ? '#e8dcc0' : '#9a6a44') })
        .ovale(0.065, '#f0e2c8', { x: xc - Math.cos(0.6) * 0.12, y: sol + 0.13, z: zc + Math.sin(0.6) * 0.12, sx: 0.5, sy: 1.1, sz: 0.9, ry: 0.6 }, 8);
      const xb = X - 2.05, zbt = zS(2.75);
      b.baton([xb, sol, zbt], [xb - 0.25, sol + 1.48, zbt + 0.05], 0.018, '#c8b48a', 8);
    }
    // le bol de pierre sous les gouttes, à l'est, l'eau dedans
    {
      const prof = [[0, 0], [0.3, 0], [0.345, 0.2], [0.34, 0.4], [0.325, 0.43], [0.285, 0.42], [0.27, 0.2], [0.2, 0.13], [0, 0.12]].map(([r, y]) => new THREE.Vector2(r, y));
      b.piece(new THREE.LatheGeometry(prof, 14), '#5a5a52', { x: BOL.x, y: sol, z: BOL.z, teinte: tachee(31, 0.3) })
        .cylindre(0.276, 0.276, 0.01, 14, '#3a4f58', { x: BOL.x, y: sol + 0.36, z: BOL.z, trait: false });
      monde.cercle(BOL.x, BOL.z, 0.62);
    }
    // une rangée de petits bouddhas taillés, sur un rebord de la paroi est
    {
      const hy = 0.9, s0 = 2.8, s1 = 3.9, xw = (s) => X + demiGrotte(s, hy) / 0.95;
      b.piece(new THREE.BoxGeometry(0.55, 0.1, s1 - s0 + 0.5, 1, 1, 4), '#4f4d45', { x: xw((s0 + s1) / 2) + 0.025, y: sol + hy - 0.05, z: zS((s0 + s1) / 2), nuance: 0.06 });
      for (let k = 0; k < 5; k++) {
        const s = s0 + ((s1 - s0) * k) / 4;
        bouddha(THREE, b, xw(s) - 0.15, sol + hy, zS(s), -PI / 2, k + 3, { PIERRE, PIERRE_F, LICHEN, MOUSSE, tachee }, 0.36);
      }
    }
    // des petits tas de pierres, au pied des parois (des vœux)
    for (let k = 0; k < 6; k++) {
      const s = 0.9 + k * 0.62, sg = k % 2 ? 1 : -1, x = X + sg * (demiGrotte(s, 0.2) / 0.95 - 0.2);
      if ((sg < 0 && s > 1.0 && s < 2.9) || (sg > 0 && Math.abs(s - 1.7) < 0.7)) continue;
      let yy = sol + 0.03;
      for (let e = 0; e < 3; e++) {
        const r = (0.12 - e * 0.025) * (0.85 + 0.3 * hasard(k, e));
        b.piece(new THREE.IcosahedronGeometry(r, 0), ['#6a6460', '#7a7470', '#5a5450'][(k + e) % 3], { x, y: yy + r * 0.45, z: zS(s), sy: 0.5, ry: hasard(k * 3 + e, 2) * 3, trait: false, nuance: 0.08 });
        yy += r * 0.8;
      }
    }
    poser(a.fin(), 0, 0, { y: 0 });
    poser(b.fin(), 0, 0, { y: 0, dedans: [X - 8, X + 8, Z_SALLE - GROTTE.prof - 1, TAKI.z + 9] });
    // la caméra : dans la grotte, elle reste sous la voûte et hors de la roche autour
    const zFond = zS(GROTTE.prof);
    monde.toit(X - 2.45, X + 2.45, zFond - 0.3, Z_GROTTE + 0.15, sol + 2.25, sol + 8);
    monde.bloc(X - 6, X - 2.35, zFond - 1, Z_GROTTE - 0.45, sol - 2, sol + 8);
    monde.bloc(X + 2.35, X + 6, zFond - 1, Z_GROTTE - 0.45, sol - 2, sol + 8);
    monde.bloc(X - 6, X + 6, zFond - 4, zS(AUTEL_S + 0.55), sol - 2, sol + 8);
    monde.bloc(X - 2.35, X - 1.32, zS(0.8), Z_GROTTE - 0.45, sol - 2, sol + 8);
    monde.bloc(X + 1.32, X + 2.35, zS(0.8), Z_GROTTE - 0.45, sol - 2, sol + 8);
    // (devant la bouche, la chute et sa brume : quand on est dedans, la caméra s'arrête dans la bouche au lieu de reculer
    // dehors, derrière l'eau ; sur la pierre ou sur la terrasse, elle n'y prend pas garde : monde.js, visee)
    monde.bloc(X - 1.7, X + 1.7, Z_GROTTE - 0.2, Z_GROTTE + 1.0, sol - 1.5, sol + 30);
  }
  // ---- la dalle de roche qui ferme la grotte : la bosse de la paroi devant, 10 cm de plus que la bouche tout autour, son bas sous
  // le sol ; la scène l'ouvre (ouvrir) : elle tremble, recule de 42 cm, puis glisse vers l'est dans la roche, où on ne la voit plus
  const dalle = (() => {
    const X = GROTTE.x, Cy = GROTTE.sol + 1.0, pos = [], cols = [];
    const avant = (x, y) => Math.min(zFace(x, y), Z_GROTTE + 0.03) + 0.025;
    const boucle = arche.map(([x, y]) => { const dx = x - X, dy = y - Cy, l = Math.hypot(dx, dy) || 1; return [x + (dx / l) * 0.1, Math.max(GROTTE.sol - 0.05, y + (dy / l) * 0.1)]; });
    const [xo] = boucle[boucle.length - 1], [xe] = boucle[0];
    for (let k = 1; k < 6; k++) boucle.push([xo + ((xe - xo) * k) / 6, GROTTE.sol - 0.05]);
    const F = boucle.map(([x, y]) => [x, y, avant(x, y)]), Bk = F.map(([x, y, z]) => [x, y, z - 0.35]);
    const Mi = boucle.map(([x, y]) => { const mx = X + (x - X) * 0.55, my = Cy + (y - Cy) * 0.55; return [mx, my, avant(mx, my)]; });
    const O = [X, Cy, avant(X, Cy)], OB = [X, Cy, O[2] - 0.35];
    const ton = (p) => { const b = bruitDoux(p[0] * 1.7 + 4, p[1] * 1.7, 1); return b > 0.72 ? MOUSSE_F : b > 0.45 ? '#454f42' : '#3f4a40'; };
    const n = boucle.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, dehors = [boucle[i][0] - X, boucle[i][1] - Cy, 0];
      tri(pos, O, Mi[i], Mi[j], [0, 0, 1]); cols.push(ton(Mi[i]));
      tri(pos, Mi[i], F[i], F[j], [0, 0, 1]); cols.push(ton(F[i]));
      tri(pos, Mi[i], F[j], Mi[j], [0, 0, 1]); cols.push(ton(Mi[j]));
      tri(pos, OB, Bk[j], Bk[i], [0, 0, -1]); cols.push('#34372f');
      tri(pos, F[i], F[j], Bk[j], dehors); tri(pos, F[i], Bk[j], Bk[i], dehors); cols.push('#3c4139', '#3c4139');
    }
    const a = atelier(), g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    a.piece(g, '#454f42', { couleurs: cols, nuance: 0.05 });
    const objet = new THREE.Group();
    objet.add(ctx.maillage(a.fin(0, true)));
    objet.visible = !ouverteAuDepart;
    let t = -1;
    return {
      objet,
      ouvrir() { t = 0; },
      maj(dt) {
        if (t < 0) return [];
        t += dt;
        objet.position.set((t < 0.35 ? 0.012 * Math.sin(t * 95) : 0) + 2.8 * lisse(0.95, 2.35, t), 0, -0.42 * lisse(0.25, 0.95, t));
        if (t > 2.6) { t = -1; objet.visible = false; }
        return [];
      },
    };
  })();
  animes.push(dalle);
  // ---- dedans, ce qui bouge : les flammes des bougies, le koban qui tourne doucement sur son plateau (tant qu'on ne l'a pas pris),
  // une goutte qui tombe de la voûte dans le bol toutes les 2,6 s (« plic »)
  const dedansGrotte = (() => {
    const objet = new THREE.Group();
    const mat = new THREE.PointsMaterial({ color: '#ffb860', size: 0.085, map: flammeDouce(THREE), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    const flammes = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(FLAMMES.flat()), 3)), mat);
    flammes.renderOrder = 3;
    const koban = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.011, 18), new THREE.MeshBasicMaterial({ color: '#f3cf6a' }));
    koban.scale.set(1, 1, 1.5);
    koban.rotation.x = PI / 2;
    koban.position.set(SANBO.x, SANBO.y + 0.075, SANBO.z);
    const goutte = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 4), new THREE.MeshBasicMaterial({ color: '#d6e6ee' }));
    const y0 = GROTTE.sol + 2.45, y1 = GROTTE.sol + 0.37;
    objet.add(flammes, koban, goutte);
    objet.visible = ouverteAuDepart;
    let lu = -1, trouve = true, tg = 0;
    return {
      objet,
      prendreKoban() { koban.visible = false; trouve = true; },
      maj(dt, temps) {
        objet.visible = grotteOuverte;
        if (!grotteOuverte) return [];
        if (temps - lu > 0.5) { lu = temps; trouve = secretTrouve('iwaya'); }
        koban.visible = !trouve;
        if (!trouve) koban.rotation.z += dt * 1.6;
        mat.size = 0.085 * (1 + 0.1 * Math.sin(temps * 17.3) * Math.sin(temps * 6.1 + 1));
        const avant = tg;
        tg = (tg + dt) % 2.6;
        const f = tg / 0.62;
        goutte.visible = f < 1;
        if (f < 1) goutte.position.set(BOL.x, y0 - (y0 - y1) * f * f, BOL.z);
        return avant < 0.62 && tg >= 0.62 ? [{ x: BOL.x, y: y1, z: BOL.z, nom: 'goutte', fort: 0.7 }] : [];
      },
    };
  })();
  animes.push(dedansGrotte);
  // ---- sous la cascade : y rester (le takigyō) ouvre la grotte. Le compte commence sur la pierre ; à 1 s et à 2,5 s, une ligne en
  // bas de l'écran (sans arrêter le jeu) ; à 4,3 s, la scène. Reparti trop tôt, le compagnon le dit une fois (un indice).
  const ouvrirGrotte = async (jeu) => {
    const T = jeu.tx('takiFin');
    jeu.aide(null);
    await jeu.dire([T[0]]);
    // la roche tremble : le voyageur recule d'une pierre ; la caméra, de face et de côté, un peu bas (derrière lui sous la chute, on
    // ne voyait que son chapeau, l'eau et la brume) ; la dalle glisse pendant qu'on lit
    jeu.placer(TAKIGYO.x, TAKIGYO.z + 0.8, PI);
    jeu.cadrer({ de: [GROTTE.x - 1.7, GROTTE.sol + 1.0, Z_GROTTE + 3.4], vers: [GROTTE.x + 0.2, GROTTE.sol + 1.25, Z_GROTTE - 0.3], champ: 60 });
    jeu.son('roc');
    dalle.ouvrir();
    const glisse = jeu.attendre(2900);
    await jeu.dire([T[1]]);
    await glisse;
    grotteOuverte = true;
    jeu.voirIndice('iwaya');
    await jeu.dire(jeu.tx('grotte'));
    await comp(jeu, 'grotteCompagnon');
    jeu.cadrer(null);
  };
  animes.push((() => {
    const SEUIL = 4.3;
    let t = 0, ditTot = false;
    return {
      objet: new THREE.Group(),
      maj(dt, temps, c) {
        const j = c.joueur, dessous = j.mode === 'jeu' && Math.hypot(j.x - TAKIGYO.x, j.z - TAKIGYO.z) < 0.45 && j.y > TAKIGYO.y - 0.3;
        if (!dessous) {
          if (t > 1.0 && !grotteOuverte) c.aide(null);
          if (!grotteOuverte && !ditTot && t > 0.8 && t < SEUIL) { ditTot = true; c.scene((jeu) => comp(jeu, 'takiTot')); }
          t = 0;
          return [];
        }
        const avant = t;
        t += dt;
        if (grotteOuverte) return [];
        if (avant < 1.0 && t >= 1.0) c.aide(c.tx('takiFroid'));
        if (avant < 2.5 && t >= 2.5) c.aide(c.tx('takiTenir'));
        if (avant < SEUIL && t >= SEUIL) c.scene(ouvrirGrotte);
        return [];
      },
    };
  })());

  // ---------------------------------------------------------------- Les barrières de rondins (丸太柵) : une seule sorte
  // Là où le sol tombe : le bord sud de la terrasse à l'est de l'escalier, le belvédère ; et en travers de la route, en bas.
  // (les poteaux sur le sol dessiné ; entre deux poteaux, si le sol fait une bosse de plus de 10 cm au-dessus de la ligne de
  // leurs pieds, un poteau de plus à son sommet : les rondins ne passent jamais dans le sol)
  const rondins = (a, points) => {
    const sol = (x, z) => solDessine(x, z).h - 0.02;
    for (let i = 0; i < points.length - 1; i++) {
      const [xa, za] = points[i], [xb, zb] = points[i + 1], L = Math.hypot(xb - xa, zb - za), n = Math.max(1, Math.round(L / 1.8));
      let us = Array.from({ length: n + 1 }, (_, k) => k / n);
      for (let passe = 0; passe < 3; passe++) {
        const plus = [];
        for (let k = 0; k < us.length - 1; k++) {
          const ya = sol(xa + (xb - xa) * us[k], za + (zb - za) * us[k]), yb = sol(xa + (xb - xa) * us[k + 1], za + (zb - za) * us[k + 1]);
          let pire = 0.1, ou = -1;
          for (let j = 1; j < 10; j++) {
            const f = j / 10, u = us[k] + (us[k + 1] - us[k]) * f, b = sol(xa + (xb - xa) * u, za + (zb - za) * u) - (ya + (yb - ya) * f);
            if (b > pire) { pire = b; ou = u; }
          }
          if (ou >= 0) plus.push(ou);
        }
        if (!plus.length) break;
        us = [...us, ...plus].sort((p, q) => p - q);
      }
      const pts = us.map((u) => { const x = xa + (xb - xa) * u, z = za + (zb - za) * u; return [x, sol(x, z), z]; });
      pts.forEach(([x, y, z], k) => {
        if (k === 0 && i > 0) return;
        a.fut([x, y - 0.3, z], [x, y + 1.0, z], 0.075, 0.07, '#7a5f45', 7).boule(0.072, '#8a6f55', { x, y: y + 1.0, z, sy: 0.4 });
      });
      for (let k = 0; k < pts.length - 1; k++) {
        const [x0, y0, z0] = pts[k], [x1, y1, z1] = pts[k + 1];
        for (const [h, e] of [[0.92, 0.012], [0.5, -0.012]]) a.fut([x0, y0 + h + e, z0], [x1, y1 + h - e, z1], 0.055, 0.055, k % 2 ? '#8a6c50' : '#7f6448', 6);
      }
      monde.mur(xa, za, xb, zb, 0.3);
    }
  };
  {
    const a = atelier(), B = BELVEDERE;
    // (le long de tout ce qui tombe : le bord sud de la terrasse à l'est de l'escalier, le tour du belvédère, le bord est de la
    // terrasse jusqu'à la falaise ; entre la terrasse et le belvédère, de plain-pied, rien)
    // (au coin nord-est, le portail du sentier de montagne : la barrière s'arrête à ses deux poteaux)
    rondins(a, [[1.6, TERRASSE.z1 + 0.05], [B.x0 - 0.05, TERRASSE.z1 + 0.05], [B.x0 - 0.05, B.z1 + 0.05], [B.x1 + 0.05, B.z1 + 0.05], [B.x1 + 0.05, B.z0 - 0.05], [B.x0 - 0.05, B.z0 - 0.05], [PORTAIL.x, PORTAIL.z1]]);
    rondins(a, [[PORTAIL.x, PORTAIL.z0], [B.x0 - 0.05, TERRASSE.z0 + 0.4]]);
    monde.mur(PORTAIL.x, PORTAIL.z0, PORTAIL.x, PORTAIL.z1, 0.3);
    // la route : en travers, au sud-est, et un panneau
    const r0 = surRoute(FIN_ROUTE + 0.3, 72);
    const dir = [ROUTE[3][0] - ROUTE[2][0], ROUTE[3][1] - ROUTE[2][1]], ld = Math.hypot(...dir), nx = -dir[1] / ld, nz = dir[0] / ld;
    rondins(a, [[r0.x + nx * (DEMI_ROUTE + 0.6), r0.z + nz * (DEMI_ROUTE + 0.6)], [r0.x - nx * (DEMI_ROUTE + 0.6), r0.z - nz * (DEMI_ROUTE + 0.6)]]);
    // le belvédère : des rochers à son pied, ses deux marches depuis la terrasse
    for (let k = 0; k < 16; k++) {
      const t = k / 15, x = B.x0 + 0.4 + t * (B.x1 - B.x0 - 0.8);
      rocher(a, x, B.y - 1.0, B.z1 + 0.85 + hasard(k, 2) * 0.3, 0.7, 0.75, 0.6, k);
      if (k % 2 === 0) rocher(a, B.x1 + 0.9, B.y - 1.1, B.z0 + 0.6 + t * (B.z1 - B.z0 - 1.2), 0.7, 0.8, 0.6, k + 3);
    }
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- En bas : la route, la ferme, le kaki, les rizières
  {
    const a = atelier(), Mx = MAISON.x, Mz = MAISON.z, yM = Y_ROUTE, BOIS = '#5f4a38', PLATRE = '#ece4d2';
    const R = repere(Mx, Mz, PI / 2), lx = MAISON.lz / 2, lz = MAISON.lx / 2, yP = yM + 0.55;
    // (dans son repère, la maison est tournée vers +z : sa véranda regarde l'est. Le corps de la maison, de z −3,2 à 2,0, sous un
    // toit à quatre pans ; la véranda, devant, sous un auvent (下屋). Les murs montent jusque sous le toit, les poteaux jusque
    // sous l'auvent : le 2026-10-30, « le toit n'est pas collé au bâtiment », il flottait 30 à 65 cm au-dessus)
    const zM = -0.6, pM = MAISON.lx - 1.2, deb = 0.9, yToit = yP + 2.55;
    const TOIT = { L: lx + deb, P: pM / 2 + deb, h: 2.3, r: 0.3, creux: 1.7, releve: 0.05, ep: 0.022 };
    const sousToit = (u, v) => yToit + dessousToit(TOIT, u, v - zM);
    a.boite(MAISON.lz + 0.3, 0.6, MAISON.lx + 0.3, PIERRE_F, { ...R(0, yM + 0.18, 0), teinte: tachee(90, 0.4) })
      .piece(new THREE.BoxGeometry(MAISON.lz, 1, pM, 14, 1, 8), PLATRE, { ...R(0, 0, zM), deformer: (px, py, pz) => [px, py > 0 ? sousToit(px, pz + zM) - 0.01 : yP, pz] })
      .boite(MAISON.lz + 0.2, 0.08, 1.15, '#8a6f55', R(0, yP - 0.04, lz - 0.55));
    // l'auvent de la véranda : du mur, sous le bord du grand toit, jusqu'à 60 cm devant ses poteaux
    const zA0 = zM + pM / 2, zA1 = lz + 0.62, yA0 = yP + 2.42, yA1 = yP + 2.06, penteA = Math.atan2(yA0 - yA1, zA1 - zA0);
    const sousAuvent = (v) => yA0 - ((v - zA0) * (yA0 - yA1)) / (zA1 - zA0) - 0.035 / Math.cos(penteA);
    a.boite(MAISON.lz + 0.5, 0.06, Math.hypot(zA1 - zA0, yA0 - yA1), '#5f6468', { ...R(0, (yA0 + yA1) / 2, (zA0 + zA1) / 2), rx: penteA, teinte: (wx, wy, wz) => (Math.floor((wx - Mx) * 6) % 2 ? '#5f6468' : '#6b7075') })
      .boite(MAISON.lz + 0.54, 0.12, 0.05, '#43474a', R(0, yA1 - 0.04, zA1 + 0.01));
    for (let i = 0; i <= 6; i++) {
      const u = -lx + (i * MAISON.lz) / 6, hD = sousAuvent(lz - 1.15) - yP + 0.01, hV = sousAuvent(lz - 0.05) - yP + 0.01;
      a.boite(0.16, hD, 0.16, BOIS, R(u, yP + hD / 2, lz - 1.15)).boite(0.14, hV, 0.14, BOIS, R(u, yP + hV / 2, lz - 0.05));
      if (i < 6) for (let k = 0; k < 2; k++) a.boite(MAISON.lz / 12 - 0.08, 1.75, 0.04, P.shoji, R(u + (MAISON.lz / 12) * (k + 0.5), yP + 0.95, lz - 1.17));
    }
    a.boite(MAISON.lz + 0.1, 0.14, 0.13, BOIS, R(0, yP + 1.95, lz - 1.15)).boite(MAISON.lz + 0.1, 0.12, 0.11, BOIS, R(0, sousAuvent(lz - 0.05) - 0.05, lz - 0.05));
    a.toitJapon(2 * TOIT.L, 2 * TOIT.P, TOIT.h, TOIT.r, { ...R(0, yToit, zM), tuile: '#5f6468', tuile2: '#6b7075', bord: '#43474a', rangs: 14 });
    murRect(R, lx + 0.15, lz + 0.15, 0.27);
    // la véranda : la grand-mère y tresse des sandales de paille ; des bottes de paille, un panier, des sandales finies
    bancs.push({ de: [Mx + lz - 0.15, Mz - 3.4], a: [Mx + lz - 0.15, Mz - 0.4], y: yP, cap: PI / 2 });
    for (let k = 0; k < 3; k++) { a.cylindre(0.28, 0.28, 0.75, 9, '#cdb47a', { x: Mx + lz + 0.9 + k * 0.05, y: yM + 0.38, z: Mz + 2.4 + k * 0.62, rz: PI / 2, ry: 0.08 * (k - 1), ordre: 'YXZ' }); monde.cercle(Mx + lz + 0.9 + k * 0.05, Mz + 2.4 + k * 0.62, 0.68); }
    a.cylindre(0.2, 0.16, 0.22, 10, '#a8864e', { x: Mx + lz - 0.35, y: yP + 0.12, z: Mz + 0.12 });
    lumieres.push({ x: Mx + lz + 0.2, y: yP + 1.6, z: Mz, halo: 0, sol: yM, r: 4.2, c: '#ffd29a' });
    // le kaki : un tronc tordu, sa couronne ronde, des fruits orange
    const ky = terrain(KAKI.x, KAKI.z);
    a.tronc([[KAKI.x, ky - 0.2, KAKI.z], [KAKI.x + 0.2, ky + 1.4, KAKI.z + 0.1], [KAKI.x - 0.1, ky + 2.6, KAKI.z]], [0.17, 0.13, 0.08], '#5a4636', 7);
    for (const [dx, dy, dz, r] of [[0, 3.4, 0, 1.6], [1.0, 2.9, 0.6, 1.1], [-0.9, 3.0, -0.5, 1.2], [0.3, 4.2, -0.3, 1.0]]) a.houppe(r, '#4f7a38', { x: KAKI.x + dx, y: ky + dy, z: KAKI.z + dz, sy: 0.75, sorte: 'persistant' }, 1);
    for (let k = 0; k < 26; k++) {
      const t = hasard(k, 4) * 2 * PI, u = 0.4 + 0.6 * hasard(4, k), r = 1.5 * u;
      a.ovale(0.075, '#f08a2a', { x: KAKI.x + Math.cos(t) * r, y: ky + 2.6 + hasard(k, 9) * 1.4, z: KAKI.z + Math.sin(t) * r, trait: false }, 6);
    }
    monde.cercle(KAKI.x, KAKI.z, 0.5);
    // l'arrêt de bus, au bout de la route : en haut du poteau, le disque « バス停 » (bordé de bleu) ; dessous, sur une plaque, le nom
    // de l'arrêt, « 三十仏入口 », de haut en bas. (Avant le 2026-10-30 : le disque regardait le sud, son étiquette tournée de
    // −0,6 le coupait en deux, et le nom ne tenait pas dans le rond ; « Le panneau est mal fait. Le panneau de la route là ».
    // Le disque, tourné comme ses étiquettes : ordre YXZ.)
    const bx = DEPART.x + 1.6, bz = DEPART.z - 1.5, by = terrain(bx, bz), arret = { x: bx, y: by, z: bz, ry: -0.6 };
    a.cylindre(0.035, 0.035, 2.2, 8, '#d8d8d0', { x: bx, y: by + 1.1, z: bz }).cylindre(0.2, 0.24, 0.12, 12, '#5a5a5a', { x: bx, y: by + 0.06, z: bz })
      .cylindre(0.3, 0.3, 0.04, 20, '#f4f2ea', { x: bx + Math.sin(-0.6) * 0.06, y: by + 2.05, z: bz + Math.cos(-0.6) * 0.06, rx: PI / 2, ry: -0.6, ordre: 'YXZ' })
      .boite(0.2, 0.66, 0.02, '#f4f2ea', { x: bx + Math.sin(-0.6) * 0.045, y: by + 1.45, z: bz + Math.cos(-0.6) * 0.045, ry: -0.6 });
    // (le disque est peint ; « バス停 » en second texte, pour que la police charge ces lettres)
    ecrire(arret, {
      texte: '', sous: 'バス停', x: 0, y: 2.05, z: 0.092, l: 0.58, h: 0.58, fond: null,
      dessin: (c, W, H) => {
        const R = Math.min(W, H) / 2;
        c.beginPath(); c.arc(W / 2, H / 2, R * 0.97, 0, 2 * PI); c.fillStyle = '#2f5aa0'; c.fill();
        c.beginPath(); c.arc(W / 2, H / 2, R * 0.8, 0, 2 * PI); c.fillStyle = '#f4f2ea'; c.fill();
        c.fillStyle = '#2a4a8a'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.font = `800 ${Math.round(R * 0.5)}px "M PLUS Rounded 1c", sans-serif`;
        c.fillText('バス停', W / 2, H / 2 + R * 0.03);
      },
    });
    ecrire(arret, { texte: '三十仏入口', vertical: true, x: 0, y: 1.45, z: 0.057, l: 0.16, h: 0.6, fond: null, encre: '#2a4a8a' });
    monde.cercle(bx, bz, 0.4);
    // les murets des rizières en terrasses, au sud : à chaque marche (tous les 7 m), un mur de pierres moussues du bas au haut de
    // la marche, et dessus une levée d'herbe (畦) qui couvre la case du sol dessiné où il descend ; sur les bords de la vallée,
    // où les terrasses se fondent dans les collines, de plus en plus bas jusqu'à disparaître (avant le 2026-10-30 : des blocs de
    // 50 cm posés sur la pente, « il y a des blocs qui flottent, c'est un peu étrange »)
    {
      const pos = [], cols = [], HERBE = ['#5b7a3c', '#55723a', '#617f40'];
      const face = (x, b, h, z) => [x, b, z + 0.02];
      for (let k = 0; k < 6; k++) {
        const z = RIZIERES_Z + k * 7, zb = z - 1.03;
        let prec = null;
        const bout = (p, sens) => {
          // (le bout d'une rangée : son profil fermé)
          tri(pos, face(p.x, p.bas, p.haut, z), [p.x, p.haut, z + 0.02], [p.x, p.haut, zb], [sens, 0, 0]);
          tri(pos, face(p.x, p.bas, p.haut, z), [p.x, p.haut, zb], [p.x, p.haut - 0.12, zb], [sens, 0, 0]);
          cols.push(PIERRE_F, PIERRE_F);
        };
        for (let x = -38; x <= 46.01; x += 0.8) {
          const bas = solDessine(x, z + 0.06).h - 0.1, haut = solDessine(x, zb).h + 0.06;
          const p = haut - bas > 0.2 && surRoute(x, z).d > DEMI_ROUTE + 2.2 && surLaLigne(RUISSEAU, x, z).d > 1.7 ? { x, bas, haut } : null;
          if (p && !prec) bout(p, -1);
          if (!p && prec) bout(prec, 1);
          if (prec && p) {
            const A = [prec.x, prec.bas, z + 0.02], B = [x, bas, z + 0.02], C = [x, haut, z + 0.02], D = [prec.x, prec.haut, z + 0.02];
            const E = [prec.x, prec.haut, zb], F = [x, haut, zb], G = [prec.x, prec.haut - 0.12, zb], H = [x, haut - 0.12, zb];
            const pierre = (Math.round(x / 0.8) + k) % 3 ? (hasard(x, k) > 0.7 ? MOUSSE_F : PIERRE) : PIERRE_F, herbe = HERBE[Math.floor(hasard(k, x) * 3)];
            tri(pos, A, B, C, [0, 0, 1]); tri(pos, A, C, D, [0, 0, 1]);
            tri(pos, D, C, F, [0, 1, 0]); tri(pos, D, F, E, [0, 1, 0]);
            tri(pos, E, F, H, [0, 0, -1]); tri(pos, E, H, G, [0, 0, -1]);
            cols.push(pierre, pierre, herbe, herbe, herbe, herbe);
          }
          prec = p;
        }
        if (prec) bout(prec, 1);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      a.piece(g, PIERRE, { couleurs: cols, nuance: 0.06 });
    }
    // des pierres moussues le long des berges, de part et d'autre de la dalle (le bord du chemin se voit)
    for (let k = -8; k <= 8; k++) {
      if (Math.abs(k) < 2) continue;
      const l = ligne(RUISSEAU, PONT.x, PONT.z), s0 = l.s + k * 0.7;
      let cum = 0;
      for (let i = 0; i < RUISSEAU.length - 1; i++) {
        const [xa, za] = RUISSEAU[i], [xb, zb] = RUISSEAU[i + 1], L = Math.hypot(xb - xa, zb - za);
        if (s0 >= cum && s0 <= cum + L) {
          const f = (s0 - cum) / L, x = xa + (xb - xa) * f, z = za + (zb - za) * f, nx = -(zb - za) / L, nz = (xb - xa) / L;
          for (const c of [-1, 1]) { const rx = x + nx * c * 0.95, rz = z + nz * c * 0.95; rocher(a, rx, terre(rx, rz) - 0.1, rz, 0.3 + 0.1 * hasard(k, c), 0.24, 0.26, k + c); }
          break;
        }
        cum += L;
      }
    }
    // la dalle de pierre du chemin sur le ruisseau, ses bordures
    {
      const [xa, za] = CHEMIN[3], [xb, zb] = CHEMIN[4], L = Math.hypot(xb - xa, zb - za), ux = (xb - xa) / L, uz = (zb - za) / L, ang = Math.atan2(ux, uz);
      const yd = terre(PONT.x, PONT.z) - 0.02;
      a.boite(3.1, 0.24, 2.8, PIERRE, { x: PONT.x, y: yd - 0.1, z: PONT.z, ry: ang, teinte: tachee(95, 0.3) });
      for (const s of [-1, 1]) a.boite(0.18, 0.18, 2.8, PIERRE_F, { x: PONT.x + uz * s * 1.42, y: yd + 0.08, z: PONT.z - ux * s * 1.42, ry: ang, teinte: tachee(96, 0.4) });
      monde.chemin([[PONT.x - ux * 1.4, PONT.z - uz * 1.4, yd + 0.02], [PONT.x + ux * 1.4, PONT.z + uz * 1.4, yd + 0.02]], 1.12, { sol: 'pierre', droits: true });
      for (const s of [-1, 1]) monde.mur(PONT.x + uz * s * 1.42 - ux * 1.1, PONT.z - ux * s * 1.42 - uz * 1.1, PONT.x + uz * s * 1.42 + ux * 1.1, PONT.z - ux * s * 1.42 + uz * 1.1, 0.3);
    }
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Le coin de Bunbuku : un tronc tombé, un petit jizō
  {
    const a = atelier(), x = RECOIN.x - 1.4, z = RECOIN.z + 1.6, y = terrain(x, z);
    a.tronc([[x - 1.6, y + 0.25, z - 0.4], [x, y + 0.3, z], [x + 1.4, y + 0.22, z + 0.5]], [0.32, 0.3, 0.26], '#5a4636', 8);
    a.boite(1.0, 0.08, 0.7, MOUSSE, { x, y: y + 0.6, z, ry: 0.3, trait: false });
    monde.mur(x - 1.6, z - 0.4, x + 1.4, z + 0.5, 0.6);
    const jx = RECOIN.x + 1.9, jz = RECOIN.z - 1.0, jy = terrain(jx, jz);
    a.ovale(0.17, PIERRE, { x: jx, y: jy + 0.2, z: jz, sy: 1.4, teinte: tachee(100, 0.4) }).ovale(0.1, PIERRE, { x: jx, y: jy + 0.48, z: jz, teinte: tachee(101, 0.3) })
      .boite(0.24, 0.12, 0.03, '#c83a2a', { x: jx, y: jy + 0.36, z: jz + 0.14 });
    monde.cercle(jx, jz, 0.45);
    // sa lanterne de papier rouge sur un bambou, allumée la nuit
    const ly = terrain(LAMPION.x, LAMPION.z);
    a.baton([LAMPION.x, ly - 0.2, LAMPION.z], [LAMPION.x, ly + 1.9, LAMPION.z], 0.025, '#b8a46a', 6).chochin(LAMPION.x, ly + 1.62, LAMPION.z, 4);
    lumieres.push({ x: LAMPION.x, y: ly + 1.62, z: LAMPION.z, halo: 0.35, sol: ly, r: 2.6, c: '#ff9a6a' });
    monde.cercle(LAMPION.x, LAMPION.z, 0.3);
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Les lanternes de l'escalier et de la terrasse
  {
    const a = atelier();
    for (const k of [22, 46, 70]) for (const s of [-1, 1]) { const z = zMarche(k) - GIRON / 2; lanterne(a, ESC.x + s * (ESC.demi + 1.05), z, 4.8, terrain(ESC.x + s * (ESC.demi + 1.05), z)); }
    lanterne(a, -2.4, -22.6, 6);
    lanterne(a, 2.4, -22.6, 6);
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Les panneaux
  const PANNEAUX = {
    // (le papier regarde (−sin ry, −cos ry) : vers le chemin, vers ceux qui arrivent)
    nio: { x: -2.9, z: 23.4, ry: -2.5 },
    yuisho: { x: 4.2, z: -23.4, ry: 2.1 },
    sentier: { x: 2.4, z: 41.6, ry: PI / 2 + 0.3 },
  };
  {
    const a = atelier();
    for (const [cle, q] of Object.entries(PANNEAUX)) {
      const y = terrain(q.x, q.z), b = atelier();
      panneau(b, P, { ecrit: true });
      poser(b.fin(), q.x, q.z, { y, ry: q.ry });
      ecrire({ x: q.x, y, z: q.z, ry: q.ry }, { ...PAPIER_PANNEAU, texte: TITRES_PANNEAUX[cle], lignes: 4 });
      const c = Math.cos(q.ry), sn = Math.sin(q.ry);
      monde.mur(q.x - 0.62 * c, q.z + 0.62 * sn, q.x + 0.62 * c, q.z - 0.62 * sn, 0.38);
    }
    // la borne de pierre « 三十仏 », au bord du chemin, à l'orée de la forêt (le 2026-10-30, au bord même : elle était à 2,5 m
    // dans les bambous nains, et la petite-fille avec elle, qu'on ne pouvait pas atteindre pour lui parler)
    const bx = -0.15, bz = 32.2, by = terrain(bx, bz);
    a.piece(new THREE.BoxGeometry(0.42, 1.5, 0.32, 1, 3, 1), PIERRE, { x: bx, y: by + 0.6, z: bz, ry: -1.3, teinte: tachee(110, 0.3), deformer: (px, py, pz) => [px * (1 - 0.1 * (py + 0.75)), py, pz] });
    ecrire({ x: bx, y: by, z: bz, ry: -1.3 }, { texte: '三十仏', vertical: true, x: 0, y: 0.85, z: 0.162, l: 0.24, h: 0.62, fond: null, encre: '#3a3c36' });
    monde.cercle(bx, bz, 0.55);
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- La forêt : les cèdres, la coupe de bois, la lisière
  // Où l'on ne plante pas : le cadre et ses abords, la terrasse et la falaise, le ruisseau, la ferme et la route.
  const libreDArbre = (x, z, m) => {
    if (dansLeCadre(x, z) || versRect(TERRASSE, x, z) < m + 1 || versRect(BELVEDERE, x, z) < m + 1.5) return false;
    if (Math.abs(x - ESC.x) < ESC.demi + m + 0.8 && z < ESC.z0 + 1 && z > ESC.z1 - 1) return false;
    if (surLaLigne(CHEMIN, x, z).d < DEMI_CHEMIN + m + 0.6 || surLaLigne(ALLEE, x, z).d < 1 + m || aLaPlace(RECOIN, x, z) < m + 0.6) return false;
    if (surLaLigne(RUISSEAU, x, z).d < 1.6 + m || versRect(PALIER, x, z) < m + 0.8 || versRect(MARCHES_NIO, x, z) < m + 1) return false;
    if (surLaLigne(SENTIER, x, z).d < 1.5 + m) return false;
    if (versRect(COUR, x, z) < m + 3 || versRect(MAISON_EMPRISE, x, z) < m + 1.2 || surRoute(x, z).d < DEMI_ROUTE + m + 1.5) return false;
    if (z > RIZIERES_Z - 3 && Math.abs(x - 4) < 34) return false;
    if (z < zParoi(x) + 1.0 && z > zParoi(x) - 5.5 && largeurFalaise(x) > 0.3) return false;
    return Math.hypot(x - SHINBOKU.x, z - SHINBOKU.z) > SHINBOKU.r + 2.5 && Math.hypot(x - TO.x, z - TO.z) > 2;
  };
  // (la coupe de bois : à l'est de l'escalier, sous le belvédère, de jeunes cèdres et des souches)
  // (et en éventail, devant le belvédère, jusqu'en bas de la pente : la vue s'ouvre sur la vallée)
  const coupe = (x, z) => {
    if (x > 6 && z < 2 && z > -30) return true;
    const dx = x - 18.6, dz = z + 27, d = Math.hypot(dx, dz);
    return d < 46 && d > 2 && (dx * 0.52 + dz * 0.85) / d > 0.76;
  };
  {
    // (la distance au plus proche endroit où l'on marche, sur une grille de 2 m : les arbres proches ont tout leur détail)
    const versCadre = (() => {
      const X0 = -110, Z0 = -100, N = 110, pts = [];
      for (let j = 0; j < 100; j++) for (let i = 0; i < N; i++) if (dansLeCadre(X0 + i * 2, Z0 + j * 2)) pts.push([X0 + i * 2, Z0 + j * 2]);
      return (x, z) => { let d = Infinity; for (const [px, pz] of pts) { const e = Math.abs(px - x) + Math.abs(pz - z); if (e < d) d = e; } return d * 0.8; };
    })();
    const PAS_F = 3.3;
    for (let gz = -76; gz <= 92; gz += PAS_F) {
      for (let gx = -86; gx <= 86; gx += PAS_F) {
        const x = gx + (hasard(gx * 0.37, gz * 0.53) - 0.5) * 2.2, z = gz + (hasard(gz * 0.41, gx * 0.29) - 0.5) * 2.2;
        if (!libreDArbre(x, z, 0.4)) continue;
        if (coupe(x, z)) {
          const y = terrain(x, z), u = hasard(x, z);
          if (u < 0.5) cedre(morceau(x, z), x, z, 1.6 + 2.4 * hasard(z, x), y, { rb: 0.05, loin: true });
          else if (u < 0.68) morceau(x, z).fut([x, y - 0.3, z], [x, y + 0.45, z], 0.28, 0.26, '#7a5a3e', 7).cylindre(0.25, 0.25, 0.02, 9, '#c8a878', { x, y: y + 0.46, z, trait: false });
          continue;
        }
        const dc = versCadre(x, z), loin = dc > 16;
        if (dc > 34 && hasard(x * 3, z) < 0.3) continue;
        cedre(morceau(x, z, loin ? 100 : 25), x, z, 21 + 9 * hasard(z * 1.7, x), terrain(x, z), { loin, pres: dc < 7 });
      }
    }
    // au loin : des bosquets de cèdres sur les collines (sans trait), une seule pièce par morceau de 200 m : deux étages de
    // branches dentelés et, à moins de 200 m, leur tronc (le 2026-10-30, « les grands sapins au loin, on dirait juste des
    // triangles, ils ont même pas de tronc » : un seul cône, posé 3 à 5 m au-dessus du sol)
    const cones = new Map();
    for (let k = 0; k < 2600; k++) {
      const ang = hasard(k, 0.31) * 2 * PI, d = 96 + 260 * Math.sqrt(hasard(0.77, k)), x = Math.cos(ang) * d, z = 10 + Math.sin(ang) * d, y = terrain(x, z);
      if (z > RIZIERES_Z && Math.abs(x - 4) < 40 && z < 140) continue;
      const h = 14 + 10 * hasard(k, 3), c = k % 3 ? '#3a5638' : '#33503a', cle = `${Math.floor(x / 200)},${Math.floor(z / 200)}`;
      if (!cones.has(cle)) cones.set(cle, { pos: [], cols: [], x, z });
      const q = cones.get(cle), tourne = k * 1.7;
      const etage = (y0, y1, r, n, cc) => {
        const haut = [x, y1, z], rr = (s) => r * (s % 2 ? 0.78 : 1);
        for (let s = 0; s < n; s++) {
          const a0 = (s / n) * 2 * PI + tourne, a1 = ((s + 1) / n) * 2 * PI + tourne;
          tri(q.pos, haut, [x + Math.cos(a0) * rr(s), y0, z + Math.sin(a0) * rr(s)], [x + Math.cos(a1) * rr(s + 1), y0, z + Math.sin(a1) * rr(s + 1)], [Math.cos(a0 + PI / n), 0.4, Math.sin(a0 + PI / n)]);
          q.cols.push(cc);
        }
      };
      etage(y + h * 0.2, y + h * 0.72, h * 0.19, 6, c);
      etage(y + h * 0.5, y + h, h * 0.13, 5, k % 3 ? '#3f5c3c' : '#36533a');
      if (d < 200) {
        const rt = h * 0.018;
        for (let s = 0; s < 3; s++) {
          const a0 = (s / 3) * 2 * PI + tourne, a1 = ((s + 1) / 3) * 2 * PI + tourne;
          const A = [x + Math.cos(a0) * rt, y - 0.5, z + Math.sin(a0) * rt], B = [x + Math.cos(a1) * rt, y - 0.5, z + Math.sin(a1) * rt];
          const Cc = [B[0], y + h * 0.3, B[2]], D = [A[0], y + h * 0.3, A[2]], n = [Math.cos(a0 + PI / 3), 0, Math.sin(a0 + PI / 3)];
          tri(q.pos, A, B, Cc, n); tri(q.pos, A, Cc, D, n);
          q.cols.push('#4a3a2e', '#4a3a2e');
        }
      }
    }
    for (const { pos, cols, x, z } of cones.values()) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      morceau(x, z, 200).piece(g, '#3a5638', { couleurs: cols, sorte: 'conifere', trait: false });
    }
  }
  // la lisière : là où l'on ne peut plus avancer, un ourlet de sous-bois (bambou nain, fougères, jeunes cèdres, arbustes) ;
  // le bord se voit : ce n'est pas un mur invisible (comme à Gokayama)
  {
    const X0 = -40, Z0 = -40, NX = 76, NZ = 120, ok = new Uint8Array(NX * NZ);
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) ok[j * NX + i] = dansLeCadre(X0 + i, Z0 + j) ? 1 : 0;
    const versLibre = (i, j) => {
      let d = 9;
      for (let dj = -3; dj <= 3; dj++) for (let di = -3; di <= 3; di++) {
        const ii = i + di, jj = j + dj;
        if (ii >= 0 && jj >= 0 && ii < NX && jj < NZ && ok[jj * NX + ii]) d = Math.min(d, Math.hypot(di, dj));
      }
      return d;
    };
    const proche = (x, z, marge) => monde.cercles.some(([cx, cz, cr]) => Math.hypot(cx - x, cz - z) < cr + marge);
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
      const n = 9 + Math.floor(hasard(x, z, 3) * 4);
      for (let k = 0; k < n; k++) {
        const a0 = (k / n) * 2 * PI + hasard(x + k * 1.3, z - k) * 0.6, rb = R * (0.55 + 0.35 * hasard(z + k * 1.7, x));
        const top = [x + Math.cos(a0) * rb, y + H * (0.5 + 0.42 * hasard(x, k, z)), z + Math.sin(a0) * rb], nf = 3 + (k % 2);
        for (let f = 0; f < nf; f++) {
          const af = a0 + (f - (nf - 1) / 2) * 0.85 + (hasard(k, f, x) - 0.5) * 0.5;
          feuille(top, [Math.cos(af), Math.sin(af)], 0.26 + 0.12 * hasard(f, k, z), 0.075, 0.05 + 0.04 * hasard(z, f, k), -0.08 - 0.1 * hasard(f, z, k), VERTS[Math.floor(hasard(k * 3.1, f, x) * VERTS.length)]);
        }
      }
    };
    const fougere = (x, z, R) => {
      const y = terrain(x, z), n = 6 + Math.floor(hasard(z, x, 5) * 3);
      for (let k = 0; k < n; k++) {
        const a0 = (k / n) * 2 * PI + hasard(x, k) * 0.5, dx = Math.cos(a0), dz = Math.sin(a0);
        const de = [x + dx * 0.05, y + 0.02, z + dz * 0.05], mi = [x + dx * R * 0.5, y + R * 0.55, z + dz * R * 0.5];
        feuille(de, [dx, dz], R * 0.6, 0.16 * R, R * 0.42, R * 0.5, '#4f8a3a');
        feuille(mi, [dx, dz], R * 0.6, 0.14 * R, 0.04, -R * 0.3, '#5a9444');
      }
    };
    for (let j = 0; j < NZ; j++) {
      for (let i = 0; i < NX; i++) {
        if (ok[j * NX + i]) continue;
        const dl = versLibre(i, j);
        if (dl > 3.2) continue;
        const gx = X0 + i, gz = Z0 + j, x = gx + (hasard(gx * 1.37, gz * 0.73) - 0.5) * 0.8, z = gz + (hasard(gz * 1.19, gx * 0.91) - 0.5) * 0.8;
        if (versRect(TERRASSE, x, z) < 0.01 || (z < zParoi(x) + 1.2 && largeurFalaise(x) > 0.3 && z > zParoi(x) - 6)) continue;
        // (ni dans la maison et sous ses toits, ni au pied des panneaux : le 2026-10-30, un jeune cèdre poussait dans la maison,
        // des fougères sur la véranda)
        if (versRect(MAISON_EMPRISE, x, z) < 0.4 || Object.values(PANNEAUX).some((q) => Math.hypot(q.x - x, q.z - z) < 0.75)) continue;
        // (ni sur le sentier de montagne, derrière son portail)
        if (surLaLigne(SENTIER, x, z).d < 0.95) continue;
        if (surLaLigne(RUISSEAU, x, z).d < 0.45 || proche(x, z, 0.45)) continue;
        if (Math.hypot(x - TAKI.x, z - TAKI.z) < TAKI.r + 0.9) continue;
        const t = hasard(x * 0.37, z * 0.53), u = hasard(z * 0.41, x * 0.29);
        // (le premier rang toujours planté : un trou dans l'ourlet, c'était un mur invisible)
        if (dl < 1.6) {
          if (t < 0.45) sasa(x, z, 0.5 + 0.22 * u, 0.65 + 0.25 * hasard(x, z));
          else fougere(x, z, 0.62 + 0.3 * u);
        } else if (dl < 2.3) {
          if (t < 0.42) sasa(x, z, 0.42 + 0.22 * u, 0.6 + 0.25 * hasard(x, z));
          else if (t < 0.85) fougere(x, z, 0.5 + 0.3 * u);
        } else if (t < 0.3) cedre(morceau(x, z), x, z, 1.8 + 2 * u, terrain(x, z), { rb: 0.06 });
        else if (t < 0.6) fougere(x, z, 0.6 + 0.25 * u);
        else if (t < 0.75) sasa(x, z, 0.45 + 0.25 * u, 0.65 + 0.25 * hasard(x, z));
      }
    }
    for (const [a, { feuilles, teintes }] of lots) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(feuilles.flat(), 3));
      a.piece(g, '#5c9140', { couleurs: teintes, trait: false, nuance: 0.06, sorte: 'conifere' });
    }
  }

  // ---------------------------------------------------------------- Le râtelier des sandales, à côté du gardien « A »
  // On offre aux Nio des sandales de paille géantes (草鞋), pour avoir de bonnes jambes : il y en a déjà, pendues à un
  // râtelier de bois ; la paire de la grand-mère s'y ajoute (le tampon).
  const RATELIER = { x: NIO.x + NIO.ecart + 1.05, z: NIO.z - 0.9 };
  const waraji = (a, x, y, z, s = 1, t = 0) => {
    // une sandale : la semelle tressée (un ovale aplati), le bourrelet, les brides
    a.ovale(0.2 * s, '#c9ad72', { x, y, z, sx: 0.55, sy: 1.0, sz: 0.12, rz: t, trait: false, teinte: (wx, wy) => (Math.floor(wy * 40 * (1 / s)) % 2 ? '#c9ad72' : '#b89a60') }, 8)
      .ovale(0.035 * s, '#a88a52', { x, y: y + 0.17 * s, z: z + 0.03, sx: 2.2, sy: 0.6, rz: t, trait: false }, 6);
    return a;
  };
  {
    const a = atelier(), x = RATELIER.x, z = RATELIER.z, y = Y_NIO;
    for (const u of [-1, 1]) a.fut([x, y - 0.3, z + u * 0.75], [x, y + 1.55, z + u * 0.75], 0.06, 0.055, '#5f4a38', 7);
    a.fut([x, y + 1.42, z - 0.85], [x, y + 1.42, z + 0.85], 0.045, 0.045, '#6a5440', 7);
    for (let k = 0; k < 3; k++) waraji(a, x + 0.04, y + 1.12 - (k % 2) * 0.08, z - 0.62 + k * 0.32, 1.2 + 0.25 * hasard(k, 7), (hasard(7, k) - 0.5) * 0.3);
    monde.mur(x, z - 0.75, x, z + 0.75, 0.42);
    poser(a.fin(), 0, 0, { y: 0 });
  }
  const paireNeuve = (() => {
    const a = atelier();
    waraji(a, RATELIER.x + 0.05, Y_NIO + 1.1, RATELIER.z + 0.42, 1.55, 0.08);
    waraji(a, RATELIER.x + 0.05, Y_NIO + 1.06, RATELIER.z + 0.66, 1.55, -0.06);
    const m = ctx.maillage(a.fin(0, false));
    m.visible = false;
    return { objet: m, montrer() { m.visible = true; }, maj: () => [] };
  })();
  animes.push(paireNeuve);

  // ---------------------------------------------------------------- Les empreintes de l'oni, près du ruisseau
  // D'énormes pieds nus, dans la boue du chemin, qui vont du ruisseau vers la montagne (un indice du secret, de jour)
  const EMPREINTES = { x: 0.3, z: 35.4 };
  {
    const a = atelier(), dir = [-0.42, -0.91];
    for (let k = 0; k < 6; k++) {
      const u = k * 0.95 - 2.4, cote = k % 2 ? 1 : -1, x = EMPREINTES.x + dir[0] * u - dir[1] * cote * 0.22, z = EMPREINTES.z + dir[1] * u + dir[0] * cote * 0.22;
      const y = solDessine(x, z).h + 0.022, ry = Math.atan2(dir[0], dir[1]);
      a.ovale(0.24, '#3b3024', { x, y, z, ry, sx: 0.42, sy: 0.04, sz: 1.0, trait: false }, 8);
      for (let o = 0; o < 5; o++) {
        const lat = (o - 2) * 0.05 * cote * -1, av = 0.27 - Math.abs(o - 1) * 0.015;
        a.ovale(0.035 - (o > 1 ? 0.006 : 0), '#3b3024', { x: x + dir[0] * av + dir[1] * lat, y: y + 0.004, z: z + dir[1] * av - dir[0] * lat, sy: 0.3, trait: false }, 5);
      }
    }
    poser(a.fin(), 0, 0, { y: 0, ombre: false });
  }

  // ---------------------------------------------------------------- La cloche : le tronc qui la frappe (撞木)
  // Le tronc pend à deux cordes sous la poutre, à l'est de la cloche ; on tire sa corde, il recule, puis part frapper la
  // fleur de lotus. frapper() : une fois (se résout au coup).
  const cloche = (() => {
    const a = atelier(), L = 1.5, h = 1.22;
    a.cylindre(0.105, 0.105, L, 10, '#8a6c4a', { y: -h, rz: PI / 2 }).cylindre(0.11, 0.11, 0.04, 10, '#3a3028', { x: -L / 2, y: -h, rz: PI / 2 });
    for (const u of [-0.45, 0.45]) a.cylindre(0.012, 0.012, h, 5, '#d8c89a', { x: u, y: -h / 2, trait: false });
    a.tube([[L / 2 - 0.05, -h, 0], [L / 2 + 0.05, -h - 0.4, 0.02], [L / 2 + 0.08, -h - 0.85, 0.05]], 0.016, '#d8c89a', { trait: false });
    const m = ctx.maillage(a.fin(0, false)), pivot = new THREE.Group();
    pivot.position.set(CLOCHE.x + 0.5 + L / 2, CLOCHE.y + 3.4, CLOCHE.z);
    pivot.add(m);
    let t = -1, fin = null;
    // (l'angle : 0 au repos ; tiré, le tronc recule vers l'est ; au coup, il touche la cloche un peu avant la verticale)
    const angle = (u) => (u < 0.7 ? 0.5 * Math.sin((u / 0.7) * PI * 0.5) : u < 0.95 ? 0.5 - 0.56 * ((u - 0.7) / 0.25) ** 2 : -0.06 + 0.18 * Math.exp(-(u - 0.95) * 3) * Math.sin((u - 0.95) * 7));
    return {
      objet: pivot,
      frapper() { t = 0; return new Promise((r) => { fin = r; }); },
      maj(dt) {
        if (t < 0) return [];
        const avant = t;
        t += dt;
        pivot.rotation.z = angle(t);
        if (avant < 0.95 && t >= 0.95 && fin) { const f = fin; fin = null; f(); }
        if (t > 2.6) { t = -1; pivot.rotation.z = 0; }
        return [];
      },
    };
  })();
  animes.push(cloche);

  // ---------------------------------------------------------------- Le bouddha du jour : sa bougie, sa lueur
  // Chaque jour du mois a son bouddha (三十日秘仏) : le jour du vrai calendrier (le 31, le 30e, Shaka, veille encore).
  const jourDuMois = () => Math.min(30, new Date().getDate());
  const lampeBougie = { x: 0, y: -500, z: 0, halo: 0, sol: 0, r: 1.6, c: '#ffc070', mobile: true };
  lumieres.push(lampeBougie);
  const bougie = (() => {
    const objet = new THREE.Group(), a = atelier();
    a.cylindre(0.018, 0.02, 0.1, 6, '#f6f0e0', { y: 0.05 }).cylindre(0.05, 0.05, 0.015, 8, '#8a6a3a', { y: 0.005 });
    const m = ctx.maillage(a.fin(0, false));
    const fl = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0.13, 0, 0, 0.28, -0.2]), 3)),
      new THREE.PointsMaterial({ color: '#ffb860', size: 18, sizeAttenuation: false, map: tacheDouce(THREE), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    fl.renderOrder = 3;
    objet.add(m, fl);
    objet.visible = false;
    let allumee = false;
    return {
      objet,
      get allumee() { return allumee; },
      allumer() {
        const B = BOUDDHAS[jourDuMois() - 1];
        objet.position.set(B.x, B.y, B.z + 0.22);
        objet.visible = allumee = true;
        Object.assign(lampeBougie, { x: B.x, y: B.y + 0.3, z: B.z + 0.35, sol: B.y });
      },
      maj(dt, temps) {
        if (!allumee) return [];
        const v = 0.85 + 0.15 * Math.sin(temps * 9.1) * Math.sin(temps * 3.7 + 1);
        fl.material.size = 16 * v * Math.min(2, window.devicePixelRatio || 1);
        return [];
      },
    };
  })();
  animes.push(bougie);

  // ---------------------------------------------------------------- L'oni à la torche (le secret)
  // La nuit, si l'on sonne la cloche : une torche descend de la montagne, au nord-est ; un grand oni rouge, gentil, arrive
  // au pied du clocher, tape le voyageur sur la tête avec sa torche (une année sans maladie, comme à la fête du feu) et lui
  // donne un koban. Ensuite, les nuits, il se chauffe à son brasero, près du clocher.
  const lampeOni = { x: 0, y: -500, z: 0, halo: 0, sol: 0, r: 5.5, c: '#ffa64a', mobile: true };
  lumieres.push(lampeOni);
  // (il descend le sentier de montagne, passe le portail et traverse la terrasse jusqu'au clocher)
  const ONI_CHEMIN = [[20.0, -40.0], [19.6, -36.0], [18.4, -33.5], [16.6, -33.2], [14.95, -33.1], [13.6, -32.4], [12.0, -27.7]];
  const VEILLE = { x: 13.3, z: -22.3 };
  const oni = creerOni(ctx, atelier, lampeOni);
  animes.push(oni);
  // le portail du sentier de montagne : des rondins comme la barrière (deux montants, deux traverses, une écharpe), pendu au
  // poteau sud ; il s'ouvre vers le dehors quand l'oni arrive, et se referme derrière lui. À côté, dehors, un poteau indicateur
  // (道標) : « 峯道 »
  const portail = (() => {
    const a = atelier(), L = PORTAIL.z1 - PORTAIL.z0 - 0.26, y0 = solDessine(PORTAIL.x, PORTAIL.z1 - 0.65).h - 0.02;
    // (dans son repère : le gond en 0, le portail le long de −z)
    for (const u of [0, -L]) a.fut([0, 0.1, u], [0, 1.0, u], 0.055, 0.05, '#7a5f45', 6).boule(0.052, '#8a6f55', { y: 1.0, z: u, sy: 0.4 });
    for (const [h, e] of [[0.9, 0.012], [0.48, -0.012]]) a.fut([0, h + e, -0.02], [0, h - e, -L + 0.02], 0.048, 0.048, '#8a6c50', 6);
    a.fut([0, 0.5, -0.05], [0, 0.88, -L + 0.06], 0.036, 0.036, '#7f6448', 6);
    const pivot = new THREE.Group();
    pivot.add(ctx.maillage(a.fin(0, true)));
    pivot.position.set(PORTAIL.x, y0, PORTAIL.z1 - 0.13);
    let ouvert = 0;
    return {
      objet: pivot,
      maj(dt) {
        const o = oni.enMarche, voulu = o && Math.hypot(o.x - PORTAIL.x, o.z - (PORTAIL.z0 + PORTAIL.z1) / 2) < 2.4 ? 1 : 0;
        ouvert += Math.max(-dt * 1.1, Math.min(dt * 1.5, voulu - ouvert));
        pivot.rotation.y = -1.75 * lisse(0, 1, ouvert);
        return [];
      },
    };
  })();
  animes.push(portail);
  {
    const a = atelier(), x = PORTAIL.x + 0.55, z = PORTAIL.z0 - 0.5, y = terrain(x, z);
    a.boite(0.12, 1.3, 0.12, '#6a5440', { x, y: y + 0.5, z }).cone(0.1, 0.1, 4, '#5a4636', { x, y: y + 1.2, z, ry: PI / 4 });
    ecrire({ x, y, z, ry: -PI / 2 }, { texte: '峯道', vertical: true, x: 0, y: 0.82, z: 0.062, l: 0.09, h: 0.24, fond: null, encre: '#2a2420' });
    monde.cercle(x, z, 0.3);
    poser(a.fin(), 0, 0, { y: 0 });
  }
  // son brasero, près du clocher : allumé les nuits, une fois le secret trouvé
  {
    const a = atelier(), x = VEILLE.x - 0.95, z = VEILLE.z - 0.55, y = terrain(x, z);
    for (let k = 0; k < 3; k++) { const t = (k / 3) * 2 * PI; a.fut([x + Math.cos(t) * 0.35, y - 0.05, z + Math.sin(t) * 0.35], [x + Math.cos(t) * 0.18, y + 0.62, z + Math.sin(t) * 0.18], 0.025, 0.02, '#2f2a26', 5); }
    a.cylindre(0.3, 0.18, 0.22, 10, '#3a3430', { x, y: y + 0.7, z }).ovale(0.2, '#2a1f1a', { x, y: y + 0.78, z, sy: 0.3 }, 8);
    monde.cercle(x, z, 0.5);
    poser(a.fin(), 0, 0, { y: 0 });
    oni.brasero(x, y + 0.85, z);
  }
  const comp = (jeu, cle) => jeu.dire(jeu.tx(cle)[jeu.compagnon], 'compagnon');
  // la première nuit, le compagnon entend quelque chose dans la montagne (tant que le secret n'est pas trouvé)
  animes.push((() => {
    let dite = false;
    return { objet: new THREE.Group(), maj(dt, temps, c) { if (c.nuit > 0.95 && !dite && !secretTrouve('oni')) { dite = true; c.scene((jeu) => comp(jeu, 'nuitCompagnon')); } return []; } };
  })());

  // ---------------------------------------------------------------- Les gens
  const PEAU = P.peau, NOIR = '#2a2226';
  // (entre deux poteaux de la véranda : le 2026-10-30, un poteau la traversait, « la grand-mère tout en bas qui est traversée par
  // un poteau »)
  const OBAA = { x: MAISON.x + MAISON.lx / 2 - 0.2, z: MAISON.z + 0.82 };
  const passants = [
    // la grand-mère, assise au bord de sa véranda : elle tresse des sandales de paille
    { id: 'obaa', x: OBAA.x, z: OBAA.z, cap: PI / 2, assis: Y_ROUTE + 0.55, tenue: { taille: 0.84, peau: '#f0c8a6', cheveux: '#d8d4cc', coiffure: 'chignon', haut: '#5a6a7a', manches: 'longues', tablier: '#8a6a5a', bas: { sorte: 'pantalon', c: '#4a4a56' }, chaussures: '#3a3236', semelle: '#3a3236', yeux: 'plisses' } },
    // sa petite-fille, sur le chemin, près de la dalle du ruisseau : elle regarde les grandes empreintes
    { id: 'enfant', x: -1.0, z: 34.4, cap: 1.2, tenue: { taille: 0.7, peau: PEAU, cheveux: NOIR, coiffure: 'queue', chapeau: { sorte: 'ecolier', c: '#f2c443' }, haut: '#e8583e', manches: 'courtes', bas: { sorte: 'jupe', c: '#3d5a8f' }, chaussures: P.blanc, semelle: '#3a3236' }, quand: 'jour' },
    // deux randonneurs du chemin de crête de la péninsule (峯道ロングトレイル), près de son panneau
    { id: 'randonneur', x: 1.6, z: 44.2, cap: PI + 0.4, tenue: { taille: 1.06, peau: '#e8bf98', cheveux: '#3a2a20', coiffure: 'court', chapeau: { sorte: 'casquette', c: '#3a6a5a', c2: '#3a6a5a' }, haut: '#c8783a', manches: 'longues', bas: { sorte: 'pantalon', c: '#4a4a40' }, chaussures: '#5a4a3a', semelle: '#3a3236', sac: { sorte: 'dos', c: '#3a5a7a', c2: '#2a3a5a' } }, quand: 'jour' },
    // @random_japan_place, qui filme les gardiens depuis le bas des marches (son TikTok)
    { id: 'videaste', x: 1.5, z: 24.4, cap: PI + 0.1, tenue: { taille: 1.1, peau: PEAU, cheveux: '#3a2a20', coiffure: 'court', chapeau: { sorte: 'bob', c: '#2f3440' }, haut: '#2f3440', manches: 'longues', bas: { sorte: 'pantalon', c: '#c9b48a' }, chaussures: P.blanc, semelle: '#3a3236', appareil: true }, quand: 'jour' },
    // un yamabushi (山伏), l'ascète des montagnes, en blanc, son bâton : il fait le tour des sanctuaires de la péninsule
    { id: 'yamabushi', x: TO.x + 1.9, z: TO.z + 1.3, cap: -2.2, tenue: { taille: 1.04, peau: '#d8a880', cheveux: NOIR, coiffure: 'court', haut: '#f2efe6', manches: 'kimono', col: '#f2efe6', bas: { sorte: 'hakama', c: '#e8e4d8' }, chaussures: '#c8a868', semelle: '#8a6a3a', canne: true } },
    // le moine du pavillon (住職), devant sa façade : il fait venir le soir, et rend le matin
    { id: 'moine', x: DO.x + 1.4, z: DO_AVANT + 1.75, cap: PI - 0.2, tenue: { taille: 1.0, peau: '#e8bf98', cheveux: '#3a3a3a', coiffure: 'rase', haut: '#2f2d33', manches: 'kimono', col: '#f4f0e6', tablier: '#8a6a3a', bas: { sorte: 'hakama', c: '#2f2d33' }, chaussures: '#f4f0e6', semelle: '#c8a868', yeux: 'plisses' } },
    // le bûcheron, au bord de la terrasse, au-dessus de sa coupe de bois
    { id: 'bucheron', x: 12.4, z: -22.0, cap: PI / 2 + 0.6, tenue: { taille: 1.04, peau: '#d8a880', cheveux: '#3a3a3a', coiffure: 'court', chapeau: { sorte: 'bandeau', c: '#f4f0e6' }, haut: '#5a6a4a', manches: 'longues', bas: { sorte: 'pantalon', c: '#3a3f4a' }, chaussures: '#2a2a30', semelle: '#2a2a30' }, quand: 'jour' },
    // la photographe, au belvédère, qui attend que la mer de nuages se lève
    { id: 'photographe', x: 20.6, z: -29.4, cap: 2.5, tenue: { taille: 0.96, peau: '#f2c9a8', cheveux: '#3a2a22', coiffure: 'queue', chapeau: { sorte: 'bob', c: '#7a6a4a' }, haut: '#4a5a6a', manches: 'longues', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: '#3a3236', semelle: '#3a3236', appareil: true }, quand: 'jour' },
  ];

  // ---------------------------------------------------------------- Ce qu'on peut faire (tout passe par `jeu`)
  const parler = (id) => ({ id, passant: id, verbe: 'parler', action: (jeu) => jeu.dire(jeu.txn(id), id) });
  const lire = (cle) => { const q = PANNEAUX[cle]; return { id: `panneau-${cle}`, x: q.x - Math.sin(q.ry) * 1.25, z: q.z - Math.cos(q.ry) * 1.25, rayon: 1.8, verbe: 'lire', vers: [q.x, q.z], action: (jeu) => jeu.dire(jeu.tx(`panneau-${cle}`)) }; };
  const interactions = [
    {
      // le belvédère (le tampon) : la vallée sous la mer de nuages
      id: 'vue', x: (BELVEDERE.x0 + BELVEDERE.x1) / 2 + 0.8, z: BELVEDERE.z1 - 1.6, rayon: 2.8, haut: 1.4, verbe: 'regarder', vers: [40, 6],
      async action(jeu) {
        jeu.placer(20.2, -24.6, Math.atan2(40 - 20.2, 6 + 24.6));
        jeu.cadrer({ de: [17.6, BELVEDERE.y + 2.6, -28.2], vers: [52, 12, 22], champ: 60 });
        await jeu.attendre(900);
        await jeu.dire(jeu.txn('vue'));
        jeu.cadrer(null);
        if (!jeu.aTampon('vue')) { await jeu.tampon('vue'); await comp(jeu, 'vueCompagnon'); }
      },
    },
    {
      // la grand-mère : des sandales de paille pour les Nio (le tampon, au râtelier) ; la nuit, elle raconte la fête du feu
      id: 'obaa', passant: 'obaa', verbe: 'parler',
      async action(jeu) {
        if (jeu.estNuit) { await jeu.dire(jeu.tx('obaaNuit'), 'obaa'); return; }
        if (jeu.aTampon('waraji') || jeu.aDansSac('waraji')) { await jeu.dire(jeu.tx(jeu.aDansSac('waraji') ? 'warajiDeja' : 'obaaApres'), 'obaa'); return; }
        await jeu.dire(jeu.tx('obaa'), 'obaa');
        jeu.donner('waraji');
        jeu.son('papier');
        await jeu.dire(jeu.tx('warajiDonne'), 'obaa');
      },
    },
    {
      // les gardiens Nio : leur histoire ; avec les sandales, les pendre au râtelier (le tampon)
      id: 'nio', x: NIO.x, z: NIO.z + 1.6, rayon: 2.2, haut: 1.6, verbe: 'regarder', vers: [NIO.x + NIO.ecart, NIO.z], si: (jeu) => !jeu.aDansSac('waraji'),
      async action(jeu) { jeu.cadrer({ de: [0.4, Y_NIO + 1.5, NIO.z + 3.2], vers: [0, Y_NIO + 1.7, NIO.z - 0.2], champ: 58 }); await jeu.attendre(600); await jeu.dire(jeu.txn('nio')); jeu.cadrer(null); },
    },
    {
      // (devant le râtelier, au nord du socle du gardien : le 2026-10-30, le voyageur était posé dans les murs de son socle, et n'en
      // sortait plus, « je suis resté bloqué dans la statue juste à côté de là où on pose les sandales »)
      id: 'ratelier', x: RATELIER.x - 0.95, z: RATELIER.z - 0.4, rayon: 1.9, haut: 1.4, verbe: 'suspendre', vers: [RATELIER.x, RATELIER.z], si: (jeu) => jeu.aDansSac('waraji'),
      async action(jeu) {
        jeu.placer(RATELIER.x - 0.95, RATELIER.z - 0.4, PI / 2);
        jeu.cadrer({ de: [RATELIER.x + 0.6, Y_NIO + 1.9, RATELIER.z + 3.6], vers: [RATELIER.x - 0.3, Y_NIO + 1.1, RATELIER.z + 0.2], champ: 52 });
        jeu.geste('offrir');
        await jeu.attendre(800);
        jeu.prendre('waraji');
        jeu.geste(null);
        paireNeuve.montrer();
        jeu.son('papier');
        await jeu.dire(jeu.tx('waraji'));
        jeu.cadrer(null);
        if (!jeu.aTampon('waraji')) { await jeu.tampon('waraji'); await comp(jeu, 'warajiCompagnon'); }
      },
    },
    {
      // la cloche (le tampon) : trois coups, en la laissant chanter entre deux ; la nuit, un seul coup… (le secret)
      id: 'kane', x: CLOCHE.x + 2.3, z: CLOCHE.z, rayon: 1.8, haut: 1.8, verbe: 'sonner', vers: [CLOCHE.x, CLOCHE.z],
      async action(jeu) {
        const placer = () => { jeu.placer(CLOCHE.x + 2.3, CLOCHE.z, -PI / 2); jeu.cadrer({ de: [CLOCHE.x + 3.2, CLOCHE.y + 2.0, CLOCHE.z + 3.4], vers: [CLOCHE.x + 0.6, CLOCHE.y + 2.0, CLOCHE.z], champ: 56 }); };
        if (jeu.estNuit && !jeu.secretTrouve('oni')) {
          const r = await jeu.choisir(jeu.tx('kaneNuit'), [jeu.t('oui'), jeu.t('non')]);
          if (r !== 0) return;
          placer();
          jeu.geste('offrir');
          await cloche.frapper();
          jeu.son('kane');
          jeu.geste(null);
          await jeu.attendre(2600);
          await jeu.dire(jeu.tx('kaneNuitApres'));
          // la torche qui descend le sentier de montagne, le portail qui s'ouvre, l'oni qui traverse la terrasse
          jeu.cadrer({ de: [13.4, Y_T + 2.6, -22.6], vers: [16.4, Y_T + 1.3, -34.0], champ: 58 });
          await oni.arriver(ONI_CHEMIN, terrain);
          jeu.placer(CLOCHE.x + 2.3, CLOCHE.z, Math.atan2(12.0 - CLOCHE.x - 2.3, -27.7 - CLOCHE.z));
          jeu.cadrer({ de: [CLOCHE.x + 4.6, CLOCHE.y + 1.9, CLOCHE.z + 1.4], vers: [12.0, CLOCHE.y + 1.4, -26.8], champ: 56 });
          await jeu.dire(jeu.tx('oni'), 'oni');
          await oni.taper();
          jeu.son('pouf');
          await jeu.dire(jeu.tx('oniTape'), 'oni');
          await comp(jeu, 'oniCompagnon');
          oni.donnerKoban(CLOCHE.x + 2.0, CLOCHE.y + 0.9, CLOCHE.z - 0.9);
          await jeu.dire(jeu.tx('oniKoban'), 'oni');
          jeu.cadrer(null);
          return;
        }
        const r = await jeu.choisir(jeu.tx(jeu.aTampon('kane') ? 'kaneEncore' : 'kane'), [jeu.t('oui'), jeu.t('non')]);
        if (r !== 0) return;
        placer();
        jeu.aide(jeu.tx('kaneAide')(3));
        let n = 0, dernier = 0, trop = false;
        const ecarts = [];
        await new Promise((fini) => {
          let occupe = false;
          jeu.capterAppuis(async () => {
            if (occupe || n >= 3) return;
            occupe = true;
            jeu.geste('offrir');
            await cloche.frapper();
            jeu.son('kane');
            jeu.geste(null);
            const t = performance.now() / 1000;
            if (n > 0) ecarts.push(t - dernier);
            dernier = t;
            n++;
            if (n > 1 && ecarts[ecarts.length - 1] < 2.6) trop = true;
            jeu.aide(n < 3 ? jeu.tx(trop ? 'kaneTrop' : 'kaneAide')(3 - n) : null);
            occupe = false;
            if (n >= 3) { jeu.capterAppuis(null); setTimeout(fini, 1800); }
          });
        });
        jeu.aide(null);
        if (trop) { jeu.cadrer(null); await jeu.dire(jeu.tx('kaneRate')); return; }
        await jeu.dire(jeu.txn('kaneGagne'));
        jeu.cadrer(null);
        if (!jeu.aTampon('kane')) { await jeu.tampon('kane'); await comp(jeu, 'kaneCompagnon'); }
      },
    },
    {
      // le koban de l'oni, posé devant le voyageur
      id: 'koban-oni', x: CLOCHE.x + 2.0, z: CLOCHE.z - 0.9, rayon: 1.6, haut: 0.8, verbe: 'prendre', si: (jeu) => oni.kobanVisible && !jeu.secretTrouve('oni'),
      async action(jeu) { jeu.geste('offrir'); await jeu.attendre(600); oni.koban(false); jeu.geste(null); await jeu.trouverSecret('oni'); await oni.allerVeille([ONI_CHEMIN[ONI_CHEMIN.length - 1], [12.9, -25.0], [VEILLE.x, VEILLE.z]], terrain, VEILLE); },
    },
    { id: 'veille', x: VEILLE.x - 1.4, z: VEILLE.z - 1.6, rayon: 2.0, haut: 1.4, verbe: 'regarder', vers: [VEILLE.x, VEILLE.z], si: (jeu) => jeu.estNuit && jeu.secretTrouve('oni') && oni.veille, action: (jeu) => jeu.dire(jeu.tx('oniApres'), 'oni') },
    { id: 'portail', x: PORTAIL.x - 1.25, z: (PORTAIL.z0 + PORTAIL.z1) / 2, rayon: 1.6, haut: 1.4, verbe: 'regarder', vers: [PORTAIL.x + 1.5, -33.2], action: (jeu) => jeu.dire(jeu.txn('portail')) },
    { id: 'torche', x: CLOCHE.x + 2.2, z: CLOCHE.z + 2.2, rayon: 1.6, haut: 1.4, verbe: 'regarder', vers: [CLOCHE.x + 2.0, CLOCHE.z + 2.0], action: (jeu) => jeu.dire(jeu.txn('torche')) },
    { id: 'empreintes', x: EMPREINTES.x, z: EMPREINTES.z + 0.8, rayon: 1.8, haut: 0.6, verbe: 'regarder', vers: [EMPREINTES.x - 0.6, EMPREINTES.z - 1.2], action: (jeu) => jeu.dire(jeu.txn('empreintes')) },
    {
      // le moine : la bougie du bouddha du jour (le tampon) ; il fait venir le soir, et rend le matin
      id: 'moine', passant: 'moine', verbe: 'parler',
      async action(jeu) {
        const j = jourDuMois(), t = jeu.tx('hotokes')[j - 1];
        if (!jeu.estNuit) {
          if (!jeu.aTampon('hotoke') && !jeu.aDansSac('bougie') && !bougie.allumee) {
            await jeu.dire(jeu.tx('moine')(j, t), 'moine');
            jeu.donner('bougie');
            await jeu.dire(jeu.tx('bougieDonnee'), 'moine');
            return;
          }
          const r = await jeu.choisir(jeu.tx('moineSoir'), [jeu.t('oui'), jeu.t('non')], 'moine');
          if (r !== 0) { await jeu.dire(jeu.tx('moineNon'), 'moine'); return; }
          await jeu.nuit(true);
          await jeu.dire(jeu.tx(jeu.secretTrouve('oni') ? 'moineNuitApres' : 'moineNuit'), 'moine');
          return;
        }
        const r = await jeu.choisir(jeu.tx('moineMatin'), [jeu.t('oui'), jeu.t('non')], 'moine');
        if (r !== 0) { await jeu.dire(jeu.tx('moineReste'), 'moine'); return; }
        await jeu.nuit(false);
        await jeu.dire(jeu.tx('moineAube'), 'moine');
      },
    },
    {
      // l'autel des trente bouddhas : avec la bougie du moine, l'allumer devant celui du jour (le tampon)
      id: 'autel', x: DO.x - 0.6, z: DO_AVANT + 1.25, rayon: 1.9, haut: 1.6, verbe: 'regarder', vers: [DO.x - 0.6, DO.z], si: (jeu) => !jeu.aDansSac('bougie'),
      async action(jeu) {
        const j = jourDuMois(), B = BOUDDHAS[j - 1];
        jeu.cadrer({ de: [DO.x - 0.6, Y_T + 2.2, DO_AVANT + 1.6], vers: [DO.x - 0.6, Y_T + 1.3, DO_ARRIERE + 0.2], champ: 60 });
        await jeu.attendre(600);
        await jeu.dire(jeu.txn('autel'));
        if (bougie.allumee) { jeu.cadrer({ de: [B.x, B.y + 0.9, DO_AVANT - 0.2], vers: [B.x, B.y + 0.25, B.z], champ: 40 }); await jeu.attendre(500); await jeu.dire(jeu.tx('hotokeRevoir')(j, jeu.tx('hotokes')[j - 1])); }
        jeu.cadrer(null);
      },
    },
    {
      id: 'allumer', x: DO.x - 0.6, z: DO_AVANT + 1.25, rayon: 1.9, haut: 1.6, verbe: 'offrir', vers: [DO.x - 0.6, DO.z], si: (jeu) => jeu.aDansSac('bougie'),
      async action(jeu) {
        const j = jourDuMois(), B = BOUDDHAS[j - 1];
        // (devant le tronc des offrandes, pas dedans : « je suis resté bloqué dans la boîte à offrande juste devant le moine »)
        jeu.placer(DO.x - 0.6, DO_AVANT + 1.25, PI);
        jeu.cadrer({ de: [DO.x - 0.6, Y_T + 2.2, DO_AVANT + 1.9], vers: [DO.x - 0.6, Y_T + 1.3, DO_ARRIERE + 0.2], champ: 60 });
        jeu.geste('prier');
        await jeu.attendre(1200);
        jeu.prendre('bougie');
        jeu.geste(null);
        bougie.allumer();
        jeu.cadrer({ de: [B.x, B.y + 0.9, DO_AVANT - 0.2], vers: [B.x, B.y + 0.25, B.z], champ: 40 });
        await jeu.attendre(900);
        await jeu.dire(jeu.tx('hotoke')(j, jeu.tx('hotokes')[j - 1]));
        jeu.cadrer(null);
        if (!jeu.aTampon('hotoke')) { await jeu.tampon('hotoke'); await comp(jeu, 'hotokeCompagnon'); }
      },
    },
    {
      // l'écho de la falaise (le tampon) : appeler trois fois ; la troisième, l'écho répond autre chose (on le propose autour
      // du petit panneau « やまびこ », et l'on appelle à côté de lui)
      id: 'yamabiko', x: ECHO_PANNEAU.x, z: ECHO_PANNEAU.z, rayon: 2.4, haut: 1.75, verbe: 'appeler', vers: [ECHO.x - 1.5, Z_PAROI],
      async action(jeu) {
        jeu.placer(ECHO.x, ECHO.z, PI + 0.25);
        jeu.cadrer({ de: [ECHO.x + 2.2, Y_T + 1.8, ECHO.z + 3.6], vers: [ECHO.x - 1.6, Y_T + 4.5, Z_PAROI], champ: 62 });
        await jeu.attendre(500);
        const e = jeu.tx(jeu.estNuit ? 'echoNuit' : 'echo');
        for (let k = 0; k < 3; k++) {
          jeu.geste('coucou');
          await jeu.dire([e.appel[k]]);
          jeu.geste(null);
          await jeu.attendre(700 + k * 250);
          await jeu.dire([e.reponse[k]], 'yamabiko');
        }
        await jeu.dire(e.fin);
        jeu.cadrer(null);
        if (!jeu.aTampon('yamabiko')) { await jeu.tampon('yamabiko'); await comp(jeu, 'yamabikoCompagnon'); }
      },
    },
    { id: 'videaste', passant: 'videaste', verbe: 'parler', async action(jeu) { await jeu.dire(jeu.tx('videaste'), 'videaste'); await jeu.video(); } },
    parler('enfant'), parler('randonneur'), parler('bucheron'), parler('photographe'),
    // (le yamabushi parle de l'ermite qui méditait sous la cascade ; une fois la grotte ouverte, il le sait)
    { id: 'yamabushi', passant: 'yamabushi', verbe: 'parler', action: (jeu) => jeu.dire(jeu.txn(!jeu.estNuit && jeu.indiceVu('iwaya') ? 'yamabushiApres' : 'yamabushi'), 'yamabushi') },
    { id: 'torii', x: TORII.x, z: TORII.z - 1.4, rayon: 1.6, haut: 2.4, verbe: 'regarder', vers: [TORII.x, TORII.z], action: (jeu) => jeu.dire(jeu.txn('torii')) },
    { id: 'escalier', x: ESC.x, z: ESC.z0 - 0.4, rayon: 1.2, haut: 1.4, verbe: 'regarder', vers: [ESC.x, ESC.z1], action: (jeu) => jeu.dire(jeu.txn('escalier')) },
    { id: 'to', x: TO.x + 1.6, z: TO.z + 0.9, rayon: 1.8, haut: 1.6, verbe: 'regarder', vers: [TO.x, TO.z], action: (jeu) => jeu.dire(jeu.tx('to')) },
    { id: 'shinboku', x: SHINBOKU.x + 2.1, z: SHINBOKU.z - 1.3, rayon: 1.8, haut: 1.6, verbe: 'regarder', vers: [SHINBOKU.x, SHINBOKU.z], action: (jeu) => jeu.dire(jeu.txn('shinboku')) },
    { id: 'cascade', x: TAKI.x + 2.6, z: TAKI.z + 1.9, rayon: 1.8, haut: 1.6, verbe: 'regarder', vers: [TAKI.x, TAKI.z - 1.2], action: (jeu) => jeu.dire(jeu.txn('cascade')) },
    // la grotte de l'ermite, une fois sa dalle ouverte : l'autel et son bouddha caché (la première fois, le koban sur le plateau
    // d'offrandes), le coin de l'ermite, le bol sous les gouttes, les petits bouddhas taillés
    {
      id: 'iwaya-autel', x: GROTTE.x, z: zS(AUTEL_S - 0.6), rayon: 1.3, haut: 1.3, verbe: 'regarder', vers: [GROTTE.x, zS(AUTEL_S + 0.55)], si: () => grotteOuverte,
      async action(jeu) {
        await jeu.dire(jeu.txn('iwayaAutel'));
        if (jeu.secretTrouve('iwaya')) return;
        await jeu.dire(jeu.tx('kobanIwaya'));
        jeu.geste('offrir');
        await jeu.attendre(600);
        dedansGrotte.prendreKoban();
        jeu.geste(null);
        await jeu.trouverSecret('iwaya');
      },
    },
    { id: 'iwaya-ermite', x: GROTTE.x - 0.7, z: zS(2.0), rayon: 1.3, haut: 1.0, verbe: 'regarder', vers: [GROTTE.x - 1.4, zS(2.0)], si: () => grotteOuverte, action: (jeu) => jeu.dire(jeu.tx('iwayaErmite')) },
    { id: 'iwaya-bol', x: BOL.x - 0.85, z: BOL.z, rayon: 1.2, haut: 1.0, verbe: 'regarder', vers: [BOL.x, BOL.z], si: () => grotteOuverte, action: (jeu) => jeu.dire(jeu.tx('iwayaBol')) },
    { id: 'iwaya-bouddhas', x: GROTTE.x + 0.75, z: zS(3.35), rayon: 1.3, haut: 1.4, verbe: 'regarder', vers: [GROTTE.x + 2.0, zS(3.35)], si: () => grotteOuverte, action: (jeu) => jeu.dire(jeu.tx('iwayaBouddhas')) },
    { id: 'magaibutsu', x: NICHES[0].x + 1.0, z: zFace(NICHES[0].x, NICHES[0].y) + 2.0, rayon: 1.8, haut: 1.6, verbe: 'regarder', vers: [NICHES[0].x + 0.95, Z_PAROI], action: (jeu) => jeu.dire(jeu.txn('magaibutsu')) },
    { id: 'masque', x: DO.x - DO.l / 2 + 4 * (DO.l / 8) + 0.5, z: DO_AVANT + 1.1, rayon: 1.2, haut: 1.8, verbe: 'regarder', vers: [DO.x - DO.l / 2 + 4 * (DO.l / 8), DO_AVANT - 0.25], action: (jeu) => jeu.dire(jeu.txn('masque')) },
    { id: 'jizo', x: RECOIN.x + 1.1, z: RECOIN.z - 0.3, rayon: 1.4, haut: 1.0, verbe: 'prier', vers: [RECOIN.x + 1.9, RECOIN.z - 1.0], async action(jeu) { jeu.geste('prier'); await jeu.attendre(2400); jeu.geste(null); await jeu.dire(jeu.txn('jizo')); } },
    { id: 'kaki', x: KAKI.x + 1.3, z: KAKI.z + 0.9, rayon: 1.6, haut: 1.6, verbe: 'regarder', vers: [KAKI.x, KAKI.z], action: (jeu) => jeu.dire(jeu.txn('kaki')) },
    lire('nio'), lire('yuisho'), lire('sentier'),
    ...interactionsBancs(bancs),
  ];
  const actionBete = async (jeu, b) => {
    if (b.sorte !== 'chat') { await jeu.dire(jeu.txn(b.sorte)); return; }
    await jeu.dire(jeu.txn(b.id));
    await jeu.dire(jeu.tx('chatCompagnon')[jeu.compagnon], 'compagnon');
  };
  const depart = { x: ACCUEIL.x, z: ACCUEIL.z, cap: -PI / 2 - 0.12 };
  // les morceaux du décor : près, avec leur trait et leur ombre ; au loin (les forêts des collines), sans
  for (const [k, a] of morceaux) poser(a.fin(), 0, 0, { y: 0, ...(Number(k.split(':')[0]) >= 100 ? { trait: false, ombre: false } : {}) });

  grotteOuverte = ouverteAuDepart;
  return {
    ...infos, textes: TEXTES,
    objets, monde, terrain, etiquettes, passants, daims: [], interactions, actionDaim: null, vapeurs, bancs, lumieres, actionBete, animes,
    // (le secret, tresors.js ; le marchand ; les sons à fabriquer en plus ; les feux d'artifice, au-dessus de la vallée, au sud)
    secret: 'oni', marchand: MARCHAND, sons: ['claque', 'papier', 'kane', 'pouf', 'roc', 'oiseau/goutte'],
    // (sous la cascade, on est trempé : balade.js ; sur les pierres de gué et dans la bouche de la grotte, qui avance le long de
    // la ligne y est ramené vers son milieu)
    douches: [{ x: TAKIGYO.x, z: TAKIGYO.z - 0.05, r: 0.5 }],
    // (de la terrasse, 1,2 m avant la première pierre — elle est étroite, il fallait la viser juste —, jusqu'au milieu de
    // l'entonnoir de la salle, 1,2 m derrière la lèvre : poussé de biais, on restait dans son coin)
    guides: [{ points: [[GROTTE.x, GUE[0][1] + 1.2], [GROTTE.x, Z_SALLE - 1.2]], r: 1.2 }],
    // les bêtes (betes.js) : le chat de la ferme, des papillons près de la ferme, des milans au-dessus de la vallée
    betes: {
      chats: [{ id: 'chatFerme', x: MAISON.x + MAISON.lx / 2 + 1.2, z: MAISON.z - 2.4, cap: 1.2, robe: 'roux', dort: true }],
      papillons: [[-4, 60], [2, 50], [-8, 64]],
      milans: [{ x: 10, z: 30, r: 40, h: 46, sens: 1 }],
    },
    feux: { x: 72, y: 0, z: -6, large: 70, haut: [45, 70] },
    aspectSol: (x, z, h) => aspectSol(P, x, z, h),
    solDetaille,
    etendue: ETENDUE,
    cascades, eauxCalmes,
    vent: { dir: [0.3, -0.95], force: 0.55 }, oiseaux: ['uguisu'], ambiances: ['insectes'],
    // la brume : proche, d'un gris vert ; plus épaisse au fond de la vallée (la mer de nuages, vue du belvédère) ; une lumière
    // douce et fraîche, un soleil voilé (balade.js, lieu.jour)
    jour: { lumiere: { ciel: '#c4d4d4', sol: '#9ca688', ambiance: 1.6, soleil: '#fff1d6', force: 1.3 }, cielHaut: '#9db3b6', horizon: '#bfcdc8' },
    brume: [6, 520],
    brumeVallee: { bas: 0, haut: 14, force: 0.68, debut: 14 },
    flou: [120, 420],
    rais: [[0.6, 2], [-1.4, -12], [1.8, -18], [-6, -26], [4, -28], [-2.8, 22]].map(([x, z], i) => ({ x, z, haut: 12, r0: 0.35, r1: 1.3 + 0.3 * (i % 3), force: 0.085 })),
    soleil: [0.5, 0.6, 0.62],
    depart,
    photos: {
      heros: { x: 0, z: 18.6, cap: 0, lacet: PI + 0.2, tangage: 0.18, distance: 6.4 },
      // (le choix du voyageur et celui du compagnon : face à l'objectif, la maison et la grand-mère derrière eux)
      perso: { x: ACCUEIL.x, z: ACCUEIL.z, cap: PI / 2, lacet: PI / 2 + 0.15, tangage: 0.1, distance: 4.2 },
    },
  };
}

// ---------------------------------------------------------------- Les formes de ce lieu
/**
 * Un gardien Nio de pierre (仁王), dans le repère R (face vers +z), debout sur son socle dont le dessus est à y : trapu,
 * la tête grosse, les sourcils froncés, les yeux exorbités, l'anneau de son écharpe derrière la tête, le torse nu et
 * musclé, la jupe plissée nouée à la taille, les pieds nus écartés. ah : la bouche ouverte (阿形 « A ») ou fermée (吽形
 * « Un ») ; s (−1, 1) : le côté, pour que les deux se répondent (le poing levé du côté du torii).
 */
function nio(THREE, a, R, y, ah, s, C) {
  const { PIERRE, PIERRE_F, tachee } = C, t = tachee(s * 17 + (ah ? 3 : 0), 0.22);
  const o = (lx, ly, lz, e = {}) => ({ ...R(lx * s, y + ly, lz, e), teinte: 'teinte' in e ? e.teinte : t, nuance: 0.06 });
  const p = (lx, ly, lz) => { const q = R(lx * s, y + ly, lz); return [q.x, q.y, q.z]; };
  // le socle : un bloc, un dessus de roche
  a.boite(0.98, 0.64, 0.8, PIERRE_F, o(0, -0.32, 0, { teinte: tachee(s * 5, 0.42) }));
  a.piece(new THREE.IcosahedronGeometry(1, 1), PIERRE, { ...o(0, -0.02, 0.02), sx: 0.56, sy: 0.1, sz: 0.46 });
  // les pieds, les mollets, les genoux
  for (const u of [-1, 1]) {
    a.ovale(0.085, PIERRE, { ...o(u * 0.18, 0.06, 0.1), sx: 0.9, sy: 0.55, sz: 1.6 })
      .fut(p(u * 0.18, 0.05, 0.03), p(u * 0.2, 0.5, 0), 0.075, 0.1, PIERRE, 8, { teinte: t })
      .boule(0.098, PIERRE, o(u * 0.2, 0.5, 0.01), 1);
  }
  // la jupe (裳) : évasée, ses plis, nouée à la taille ; le pan du nœud
  a.piece(new THREE.CylinderGeometry(0.26, 0.37, 0.56, 18, 2, true), PIERRE, {
    ...o(0, 0.76, 0),
    deformer: (px, py, pz) => { const ang = Math.atan2(pz, px), k = 1 + (0.03 + 0.05 * (0.5 - py)) * Math.sin(ang * 9); return [px * k, py, pz * k]; },
  })
    .cylindre(0.275, 0.275, 0.09, 16, PIERRE_F, o(0, 1.02, 0))
    .boite(0.13, 0.26, 0.04, PIERRE_F, o(0.04, 0.86, 0.27, { rz: 0.1 * s }));
  // le torse : la poitrine, les pectoraux, le ventre, les abdominaux ; les épaules
  a.ovale(0.28, PIERRE, { ...o(0, 1.28, -0.01), sx: 1.0, sy: 0.98, sz: 0.68 })
    .ovale(0.2, PIERRE, { ...o(0, 1.1, 0.08), sx: 1.05, sy: 0.85, sz: 0.8 });
  for (const u of [-1, 1]) {
    a.ovale(0.13, PIERRE, { ...o(u * 0.115, 1.37, 0.13), sx: 1.1, sy: 0.75, sz: 0.5 }).boule(0.125, PIERRE, o(u * 0.31, 1.43, 0), 1);
    for (const h of [1.2, 1.1]) a.ovale(0.048, PIERRE, { ...o(u * 0.055, h, 0.235), sz: 0.5 }, 8);
  }
  // les bras : du côté du torii (u = −1 dans son repère), le poing levé devant l'épaule (le « A » le lève plus haut) ; de
  // l'autre, le bras tendu vers le bas, la main ouverte, les doigts écartés
  const bras = (u, epaule, coude, main, poing) => {
    a.fut(p(...epaule), p(...coude), 0.088, 0.078, PIERRE, 8, { teinte: t }).boule(0.08, PIERRE, o(...coude), 1).fut(p(...coude), p(...main), 0.074, 0.062, PIERRE, 8, { teinte: t });
    if (poing) a.boule(0.088, PIERRE, { ...o(...main), sy: 0.9 }, 1).ovale(0.04, PIERRE, o(main[0] - u * 0.02, main[1] + 0.06, main[2] + 0.04), 6);
    else {
      a.ovale(0.075, PIERRE, { ...o(main[0], main[1] - 0.05, main[2]), sx: 0.9, sy: 1.1, sz: 0.4 });
      for (let f = 0; f < 4; f++) a.fut(p(main[0] - 0.045 + f * 0.03, main[1] - 0.1, main[2]), p(main[0] - 0.06 + f * 0.04, main[1] - 0.19, main[2] + 0.02), 0.016, 0.013, PIERRE, 5, { teinte: t });
    }
  };
  bras(-1, [-0.31, 1.43, 0], [-0.48, 1.18, 0.1], ah ? [-0.3, 1.52, 0.26] : [-0.27, 1.38, 0.28], true);
  bras(1, [0.31, 1.43, 0], [0.45, 1.13, 0.02], [0.47, 0.88, 0.16], false);
  // le cou, la tête : grosse, les sourcils froncés, les yeux exorbités et leurs pupilles, le nez large, les joues, la
  // bouche (ouverte : « A » ; fermée : « Un »), les oreilles, le chignon
  a.cylindre(0.1, 0.11, 0.14, 10, PIERRE, o(0, 1.56, 0));
  a.ovale(0.2, PIERRE, { ...o(0, 1.71, 0.02), sx: 1.06, sy: 1.0, sz: 0.94 });
  for (const u of [-1, 1]) {
    a.boite(0.12, 0.04, 0.06, PIERRE_F, o(u * 0.075, 1.785, 0.17, { rz: u * s * 0.38 }))
      .ovale(0.046, PIERRE, { ...o(u * 0.072, 1.735, 0.168), sz: 0.75 }, 8)
      .ovale(0.019, '#4a4d46', { ...o(u * 0.072, 1.735, 0.204), teinte: null }, 6)
      .ovale(0.068, PIERRE, { ...o(u * 0.105, 1.65, 0.12), sz: 0.7 }, 8)
      .ovale(0.05, PIERRE, { ...o(u * 0.205, 1.7, 0.0), sx: 0.45, sy: 1.25, sz: 0.6 }, 8);
  }
  a.ovale(0.05, PIERRE, { ...o(0, 1.685, 0.205), sx: 1.35, sy: 0.85, sz: 0.8 }, 8);
  if (ah) a.ovale(0.06, '#3f413b', { ...o(0, 1.6, 0.175), sx: 1.35, sy: 0.8, sz: 0.5, teinte: null }, 8).boite(0.09, 0.016, 0.02, '#a8a890', { ...o(0, 1.628, 0.2), teinte: null });
  else a.boite(0.13, 0.03, 0.05, PIERRE_F, o(0, 1.605, 0.185)).ovale(0.05, PIERRE, { ...o(0, 1.57, 0.16), sx: 1.2, sy: 0.7, sz: 0.7 }, 8);
  a.ovale(0.075, PIERRE, { ...o(0, 1.9, -0.02), sy: 1.15 }, 8).cylindre(0.06, 0.07, 0.03, 10, PIERRE_F, o(0, 1.86, -0.02));
  // l'anneau de son écharpe (天衣) derrière la tête, et ses pans qui tombent le long des bras
  a.piece(new THREE.TorusGeometry(0.37, 0.05, 6, 22), PIERRE, { ...o(0, 1.6, -0.2), sx: 1.04, sy: 1.12 });
  for (const u of [-1, 1]) a.tube([p(u * 0.36, 1.4, -0.18), p(u * 0.46, 1.15, -0.08), p(u * 0.44, 0.88, -0.02), p(u * 0.4, 0.62, 0.02)], 0.03, PIERRE_F, { teinte: t });
}

/**
 * La hauteur du dessous d'un toit de a.toitJapon au-dessus de son bord, en (x, z) depuis son milieu (comme à Kinkaku-ji, où
 * les murs montent jusque-là). t : { L, P (les demi-côtés au bord), h, r (le ratio du haut), creux, releve, ep (l'épaisseur) }.
 * On cherche le pan où tombe le point, puis v (0 au bord, 1 en haut) là où ce pan passe au-dessus de lui.
 */
function dessousToit(t, x, z) {
  for (const [travers, long, A, B] of [[z, x, t.P, t.L], [x, z, t.L, t.P], [-z, x, t.P, t.L], [-x, z, t.L, t.P]]) {
    if (travers <= 1e-6) continue;
    const w = (long * A) / (travers * B);
    if (Math.abs(w) > 1) continue;
    const e = w ** 4, s = travers / A;
    let v0 = 0, v1 = 1;
    for (let k = 0; k < 22; k++) { const v = (v0 + v1) / 2; if ((1 - v * (1 - t.r)) * (1 + 0.06 * e * (1 - v)) > s) v0 = v; else v1 = v; }
    const v = (v0 + v1) / 2;
    return t.h * v ** t.creux + t.releve * e * (1 - v) ** 2 - t.ep;
  }
  return 0;
}

/**
 * Un bouddha assis en méditation (environ 55 cm × k de haut), en x, y (le dessus de ce qui le porte), z, tourné de ry (il
 * regarde vers +z) : le socle de lotus et ses pétales, les jambes croisées (les genoux larges, les plantes des pieds sur les
 * cuisses), le corps dans sa robe, les épaules rondes, les bras et les mains (leur geste change d'un jour à l'autre : les mains
 * jointes dans le giron, la main qui rassure levée, la main qui donne sur le genou, la main qui touche la terre), le cou, la
 * tête aux cheveux bouclés (plus sombres), sa bosse (肉髻), ses longues oreilles, et derrière elle le halo, rond ou en flamme.
 * o.fin : plus de détail (de près : le visage aux yeux mi-clos, le point entre les sourcils, les pieds) ; o.mandorle : une
 * auréole en navette derrière tout le corps (舟形光背) ; C.CHEVEUX : la couleur des cheveux (le bleu des statues dorées).
 * (2026-10-30, le propriétaire : « refais les espèces de statues en pierre là sur le mur », « refais le Bouddha doré dans la
 * caverne » : trois boules empilées, comme un bonhomme de neige.)
 */
function bouddha(THREE, a, x, y, z, ry, jour, C, k = 1, o = {}) {
  // (les taches de lichen et de mousse, plus fines que sur les rochers : à leur taille, la statue faisait des carrés clairs)
  const { PIERRE, PIERRE_F } = C, t0 = C.tachee(jour * 3.7, 0.1), t = (wx, wy, wz) => t0(wx * 3.5, wy * 3.5, wz * 3.5);
  const c = Math.cos(ry), sn = Math.sin(ry), fin = !!o.fin;
  const CHEVEUX = C.CHEVEUX || PIERRE_F, f = fin ? 12 : 9;
  // (le repère de la statue : de (lx, ly, lz) au monde ; un point [x, y, z] du monde)
  const q = (lx, ly, lz, e = {}) => ({ ordre: 'YXZ', ...e, x: x + (lx * c + lz * sn) * k, y: y + ly * k, z: z + (-lx * sn + lz * c) * k, ry: ry + (e.ry || 0), sx: (e.sx ?? 1) * k, sy: (e.sy ?? 1) * k, sz: (e.sz ?? 1) * k, teinte: e.teinte || t, nuance: 0.06 });
  const p = (lx, ly, lz) => [x + (lx * c + lz * sn) * k, y + ly * k, z + (-lx * sn + lz * c) * k];
  // (les cheveux : au-dessus du front, plus bas derrière la tête ; dans le repère de la statue)
  const tete = [0, 0.447, 0.006];
  const local = (wx, wy, wz) => { const dx = (wx - x) / k, dz = (wz - z) / k; return [dx * c - dz * sn, (wy - y) / k, dx * sn + dz * c]; };
  const cheveux = (wx, wy, wz) => { const [lx, ly, lz] = local(wx, wy, wz); return ly - tete[1] > 0.016 - 0.55 * Math.max(0, tete[2] - lz) || ly > 0.5 ? CHEVEUX : t(wx, wy, wz); };
  // le socle : son pied, puis le lotus, ses pétales qui s'ouvrent vers le haut
  a.cylindre(0.145, 0.16, 0.04, 12, PIERRE_F, q(0, 0.02, 0))
    .piece(new THREE.CylinderGeometry(0.178, 0.13, 0.085, 16, 1), PIERRE, {
      ...q(0, 0.0825, 0),
      deformer: (px, py, pz) => { const u = 1 + 0.09 * Math.max(0, Math.cos(Math.atan2(pz, px) * 8)) * (py > 0 ? 1 : 0.2); return [px * u, py, pz * u]; },
    });
  // les jambes croisées, et sur elles les plantes des pieds
  a.ovale(0.14, PIERRE, q(0, 0.155, 0.02, { sx: 1.32, sy: 0.36, sz: 0.82 }), f);
  if (fin) for (const u of [-1, 1]) a.ovale(0.03, PIERRE, q(u * 0.066, 0.196, 0.074, { ry: -u * 0.5, sx: 0.75, sy: 0.4, sz: 1.35 }), 6);
  // le corps dans sa robe : large aux hanches, les épaules rondes ; le cou
  const profil = [[0.001, 0.15], [0.095, 0.16], [0.104, 0.21], [0.106, 0.28], [0.102, 0.332], [0.082, 0.362], [0.045, 0.378], [0.001, 0.383]];
  a.piece(new THREE.LatheGeometry(profil.map(([r, h]) => new THREE.Vector2(r, h)), f + 1), PIERRE, q(0, 0, 0, { sz: 0.72 }));
  a.cylindre(0.03, 0.033, 0.04, 8, PIERRE, q(0, 0.39, 0.003));
  // les bras (les manches de la robe) et les mains : u = −1, la main droite de la statue
  const bras = (u, coude, main) => a.tube([p(u * 0.088, 0.345, 0), p(...coude), p(...main)], 0.027 * k, PIERRE, { cotes: 5, pas: 6, teinte: t, nuance: 0.06 });
  const geste = jour % 4;
  if (geste === 0) {
    // (dans le giron, l'une sur l'autre, les pouces qui se touchent : la méditation)
    for (const u of [-1, 1]) bras(u, [u * 0.118, 0.255, 0.035], [u * 0.03, 0.205, 0.086]);
    a.ovale(0.042, PIERRE, q(0, 0.205, 0.088, { sx: 1.45, sy: 0.42, sz: 0.85 }), 8);
  } else {
    // (la main droite levée, la paume tournée vers nous : « n'aie pas peur » ; ou posée sur le genou, qui touche la terre)
    const leve = geste !== 3, mainD = leve ? [-0.085, 0.3, 0.1] : [-0.148, 0.165, 0.112];
    bras(-1, [-0.122, 0.25, 0.04], mainD);
    a.ovale(0.03, PIERRE, q(...mainD, { sx: leve ? 0.9 : 0.8, sy: leve ? 1.45 : 1.3, sz: 0.5 }), 7);
    // (la main gauche : dans le giron, ou ouverte sur le genou, qui donne)
    const mainG = geste === 2 ? [0.15, 0.19, 0.095] : [0.035, 0.205, 0.088];
    bras(1, [0.122, 0.25, 0.032], mainG);
    a.ovale(0.032, PIERRE, q(...mainG, { sx: 1.25, sy: 0.5, sz: 0.95 }), 7);
  }
  // la tête, ses cheveux bouclés et sa bosse, ses oreilles aux longs lobes
  a.ovale(0.062, PIERRE, q(...tete, { sy: 1.13, sz: 0.98, teinte: cheveux }), f + 1)
    .ovale(0.031, CHEVEUX, q(0, 0.515, 0, { sy: 0.85, teinte: () => CHEVEUX }), 7);
  for (const u of [-1, 1]) a.ovale(0.028, PIERRE, q(u * 0.061, 0.437, -0.004, { sx: 0.32, sy: 1.75, sz: 0.62 }), 6);
  // de près : les yeux mi-clos, le nez, le point entre les sourcils (白毫)
  if (fin) {
    const SOMBRE = C.YEUX || '#3a3a34';
    for (const u of [-1, 1]) a.boite(0.024, 0.0045, 0.006, SOMBRE, { ...q(u * 0.024, 0.452, 0.066, { teinte: () => SOMBRE }), rz: -u * 0.12, trait: false });
    a.ovale(0.011, PIERRE, q(0, 0.437, 0.068, { sx: 0.8, sz: 0.7 }), 6).ovale(0.0075, PIERRE_F, { ...q(0, 0.47, 0.068), teinte: () => PIERRE_F, trait: false }, 5);
  }
  // le halo derrière la tête : rond, ou en flamme (sa pointe vers le haut)
  const flamme = jour % 3 === 0;
  a.piece(new THREE.CircleGeometry(0.105, 14), PIERRE_F, {
    ...q(tete[0], tete[1], -0.062, { teinte: () => PIERRE_F }), trait: false,
    deformer: flamme ? (px, py, pz) => (py > 0 ? [px * (1 - 0.35 * (py / 0.105) ** 2), py * (1 + 0.5 * (py / 0.105) ** 3), pz] : [px, py, pz]) : undefined,
  });
  // l'auréole en navette, derrière tout le corps
  if (o.mandorle) {
    const s = new THREE.Shape();
    s.moveTo(0, 0.13);
    s.bezierCurveTo(0.2, 0.13, 0.25, 0.3, 0.2, 0.46);
    s.bezierCurveTo(0.16, 0.57, 0.06, 0.6, 0, 0.66);
    s.bezierCurveTo(-0.06, 0.6, -0.16, 0.57, -0.2, 0.46);
    s.bezierCurveTo(-0.25, 0.3, -0.2, 0.13, 0, 0.13);
    a.piece(new THREE.ShapeGeometry(s, 8), o.mandorle, { ...q(0, 0, -0.11, { teinte: () => o.mandorle }), trait: false });
  }
}

/**
 * L'oni à la torche (le secret) : un grand démon rouge, gentil, de Kunisaki (ici, les oni sont des bouddhas déguisés) : trapu,
 * le ventre rond, les épaules larges ; ses cornes, ses boucles noires, ses gros yeux ronds sous des sourcils broussailleux, son
 * grand nez, son sourire et ses deux crocs ; le pagne en peau de tigre et sa ceinture de paille, et, comme les oni de la fête du
 * feu, des cordes de paille en travers du torse ; les bracelets d'or ; une grande torche de bambous liés, allumée. arriver(chemin) :
 * il descend de la montagne ; taper() : il tape le voyageur sur la tête avec sa torche (la fête du feu : une année sans
 * maladie) ; donnerKoban(x, y, z), koban(oui) ; allerVeille(chemin, …, veille) : il va se chauffer à son brasero, et y revient
 * les nuits (veille). lampe : sa lumière (lueurs.js, mobile). position : où il est (le portail du sentier s'ouvre devant lui).
 * (Refait le 2026-10-30, le propriétaire : « refaire le sprite de l'oni parce que je trouve qu'il est un peu mal fait » : deux
 * boules rouges, une cape de paille en abat-jour.)
 */
function creerOni(ctx, atelier, lampe) {
  const { THREE } = ctx;
  // (pas les rouges laqués de Beppu : une peau, pas un masque)
  const RO = '#cf4a32', RF = '#a43a27', ROC = '#dc5c42', TIGRE = '#e6a83e', PAILLE = '#c8a868', PAILLE_F = '#a8884e', NOIR = '#231c1c', IVOIRE = '#efe4c4', OR = '#d9a52e';
  const groupe = new THREE.Group(), corps = new THREE.Group(), brasD = new THREE.Group(), jambes = [new THREE.Group(), new THREE.Group()];
  groupe.add(corps);
  corps.add(brasD, ...jambes);
  groupe.scale.setScalar(0.84);
  const corde = (wx, wy, wz) => (Math.floor((wx + wz) * 34 + wy * 22) % 2 ? PAILLE : PAILLE_F);
  // le corps : le ventre rond, la poitrine, les pectoraux, le nombril ; les épaules ; le pagne en peau de tigre (rayé, son bas
  // en dents) et la ceinture de paille ; les cordes de paille en travers du torse
  const a = atelier(), yT = 2.3;
  a.ovale(0.52, RO, { y: 1.27, sx: 1.06, sy: 0.92, sz: 0.94 }, 16).ovale(0.5, RO, { y: 1.7, sx: 1.16, sy: 0.74, sz: 0.82 }, 16)
    .ovale(0.2, RF, { x: -0.2, y: 1.77, z: 0.3, sx: 1.05, sy: 0.75, sz: 0.42 }, 10).ovale(0.2, RF, { x: 0.2, y: 1.77, z: 0.3, sx: 1.05, sy: 0.75, sz: 0.42 }, 10)
    .ovale(0.035, '#7a2418', { y: 1.2, z: 0.475, sz: 0.4 }, 6)
    .ovale(0.22, RO, { x: -0.56, y: 1.86, sx: 1.0, sy: 0.9 }, 10).ovale(0.22, RO, { x: 0.56, y: 1.86, sx: 1.0, sy: 0.9 }, 10)
    .piece(new THREE.CylinderGeometry(0.5, 0.64, 0.42, 22, 2, true), TIGRE, {
      y: 0.88,
      deformer: (px, py, pz) => [px, py < -0.15 ? py - 0.05 * Math.abs(Math.sin(Math.atan2(pz, px) * 11)) : py, pz],
      teinte: (wx, wy, wz) => { const t = Math.atan2(wz, wx); return Math.abs(Math.sin(t * 7 + wy * 9)) > 0.82 ? '#2a2420' : TIGRE; },
    })
    .tube([[0.5, 1.08, 0], [0.36, 1.1, 0.4], [0, 1.08, 0.53], [-0.36, 1.06, 0.4], [-0.5, 1.07, 0], [-0.36, 1.08, -0.38], [0, 1.1, -0.48], [0.36, 1.08, -0.38], [0.5, 1.08, 0]], 0.05, PAILLE, { cotes: 6, pas: 40, teinte: corde })
    .tube([[0.44, 1.98, 0.12], [0.2, 1.75, 0.42], [-0.12, 1.42, 0.5], [-0.42, 1.13, 0.32], [-0.52, 1.08, 0]], 0.04, PAILLE, { cotes: 6, pas: 30, teinte: corde })
    .tube([[-0.44, 1.98, 0.12], [-0.25, 1.82, 0.38], [0, 1.66, 0.46]], 0.035, PAILLE, { cotes: 6, pas: 14, teinte: corde });
  // la tête : ronde, la mâchoire large ; le cou épais
  a.cylindre(0.2, 0.22, 0.16, 12, RO, { y: 2.0 })
    .ovale(0.4, RO, { y: yT, sx: 1.0, sy: 0.95, sz: 0.92 }, 18).ovale(0.35, RO, { y: yT - 0.13, z: 0.03, sx: 1.12, sy: 0.6, sz: 0.88 }, 14);
  // les cheveux : des boucles noires sur le haut et l'arrière de la tête, le visage dégagé
  for (let k = 0; k < 16; k++) {
    const t = -PI * 0.08 + (k / 15) * PI * 1.16, haut = k % 2;
    a.boule(0.12 - 0.015 * haut, NOIR, { x: Math.cos(t) * (haut ? 0.27 : 0.36), y: yT + (haut ? 0.3 : 0.12) + 0.05 * Math.sin(k * 1.9), z: -Math.sin(t) * (haut ? 0.22 : 0.3) - 0.04 }, 1);
  }
  for (const u of [-1, 0, 1]) a.boule(0.1, NOIR, { x: u * 0.16, y: yT + 0.36, z: 0.12 - Math.abs(u) * 0.05 }, 1);
  for (const u of [-1, 1]) {
    // les cornes (leur pied plus sombre), les oreilles pointues, les yeux (le blanc, la pupille, un éclat), les sourcils
    // broussailleux, les joues roses
    a.cone(0.08, 0.36, 10, IVOIRE, { x: u * 0.19, y: yT + 0.6, z: 0.04, rz: -u * 0.38 }).cylindre(0.085, 0.09, 0.05, 10, '#bfb08a', { x: u * 0.155, y: yT + 0.43, z: 0.04, rz: -u * 0.38 })
      .ovale(0.08, RO, { x: u * 0.4, y: yT + 0.02, z: -0.02, sx: 0.45, sy: 1.25, sz: 0.75, rz: u * 0.35 }, 8)
      .ovale(0.09, '#fbf6ea', { x: u * 0.145, y: yT + 0.07, z: 0.31, sy: 1.1, sz: 0.55 }, 12)
      .ovale(0.045, NOIR, { x: u * 0.135, y: yT + 0.065, z: 0.36, sz: 0.5 }, 10)
      .ovale(0.014, '#ffffff', { x: u * 0.12, y: yT + 0.085, z: 0.383, sz: 0.5, trait: false }, 6)
      .boite(0.19, 0.06, 0.07, NOIR, { x: u * 0.15, y: yT + 0.2, z: 0.31, rz: -u * 0.18, ry: u * 0.25, ordre: 'YXZ' })
      .ovale(0.07, '#e8705a', { x: u * 0.23, y: yT - 0.08, z: 0.28, sz: 0.45, trait: false }, 8);
  }
  // le grand nez, la bouche qui sourit (la langue), les deux crocs du bas, pointés vers le haut
  a.ovale(0.085, ROC, { y: yT - 0.02, z: 0.36, sx: 1.2, sy: 0.85, sz: 0.85 }, 10)
    .ovale(0.13, '#5a1a14', { y: yT - 0.19, z: 0.29, sx: 1.55, sy: 0.42, sz: 0.5 }, 12)
    .ovale(0.07, '#d86a6a', { y: yT - 0.215, z: 0.33, sx: 1.3, sy: 0.35, sz: 0.45, trait: false }, 8)
    .cone(0.028, 0.08, 6, IVOIRE, { x: -0.1, y: yT - 0.17, z: 0.355 }).cone(0.028, 0.08, 6, IVOIRE, { x: 0.1, y: yT - 0.17, z: 0.355 });
  // le bras gauche, le poing sur la hanche, son bracelet d'or
  a.baton([0.58, 1.84, 0], [0.8, 1.44, -0.04], 0.15, RO, 10).boule(0.14, RO, { x: 0.8, y: 1.44, z: -0.04 }, 1)
    .baton([0.8, 1.44, -0.04], [0.58, 1.12, 0.2], 0.13, RO, 10).boule(0.15, RO, { x: 0.56, y: 1.1, z: 0.22 }, 1)
    .piece(new THREE.TorusGeometry(0.13, 0.035, 6, 14), OR, { x: 0.65, y: 1.22, z: 0.13, rx: PI / 2 - 0.6, ry: 0.5, ordre: 'YXZ' });
  corps.add(ctx.maillage(a.fin(0, true)));
  // le bras droit et sa torche (il pivote à l'épaule) : un fagot de bambous lié de cordes de paille, noirci en haut
  brasD.position.set(-0.56, 1.86, 0);
  const b = atelier();
  b.baton([0, 0, 0], [-0.13, -0.44, 0.1], 0.15, RO, 10).boule(0.14, RO, { x: -0.13, y: -0.44, z: 0.1 }, 1)
    .baton([-0.13, -0.44, 0.1], [-0.08, -0.5, 0.46], 0.13, RO, 10).boule(0.15, RO, { x: -0.08, y: -0.5, z: 0.5 }, 1)
    .piece(new THREE.TorusGeometry(0.13, 0.035, 6, 14), OR, { x: -0.1, y: -0.48, z: 0.34, ry: 0.15 });
  const brule = (wx, wy) => (wy > 0.3 ? (hasard(wx * 31, wy * 17) > 0.5 ? '#231e1b' : '#2f2925') : wy > 0.24 ? '#5a4a34' : '#9a8250');
  for (let k = 0; k < 7; k++) {
    const t = (k / 7) * 2 * PI;
    b.fut([-0.08 + Math.cos(t) * 0.062, -1.0, 0.5 + Math.sin(t) * 0.062], [-0.08 + Math.cos(t) * 0.082, 0.46 + 0.04 * hasard(k, 2), 0.5 + Math.sin(t) * 0.082], 0.026, 0.023, '#9a8250', 5, { teinte: brule });
  }
  for (const y of [-0.82, -0.2, 0.12]) b.cylindre(0.1, 0.1, 0.05, 10, PAILLE, { x: -0.08, y, z: 0.5, teinte: corde });
  brasD.add(ctx.maillage(b.fin(0, true)));
  const HAUT_TORCHE = new THREE.Vector3(-0.08, 0.55, 0.5);
  const feu = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.08, 0.62, 0.5, -0.05, 0.8, 0.5, -0.11, 0.72, 0.51]), 3)),
    new THREE.PointsMaterial({ color: '#ffa040', size: 40, sizeAttenuation: true, map: flammeDouce(THREE), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  feu.material.size = 0.7;
  feu.renderOrder = 3;
  brasD.add(feu);
  // les jambes (elles pivotent aux hanches) : la cuisse, le genou, le mollet qui s'affine, le pied nu et ses orteils
  jambes.forEach((j, i) => {
    const u = i ? 1 : -1, c = atelier();
    j.position.set(u * 0.25, 0.86, 0);
    c.baton([0, 0, 0], [u * 0.02, -0.4, 0.05], 0.18, RO, 10).boule(0.15, RO, { x: u * 0.02, y: -0.4, z: 0.05 }, 1)
      .fut([u * 0.02, -0.4, 0.05], [u * 0.02, -0.78, 0.0], 0.15, 0.115, RO, 10)
      .ovale(0.16, RF, { x: u * 0.02, y: -0.8, z: 0.1, sx: 0.85, sy: 0.42, sz: 1.35 }, 10);
    for (let o = 0; o < 3; o++) c.boule(0.045, RF, { x: u * 0.02 + (o - 1) * 0.07, y: -0.82, z: 0.3 - Math.abs(o - 1) * 0.02 }, 1);
    j.add(ctx.maillage(c.fin(0, true)));
  });
  groupe.visible = false;
  // le koban qu'il donne, et le feu de son brasero
  const koban = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.015, 18), new THREE.MeshBasicMaterial({ color: '#f3cf6a' }));
  koban.scale.set(1, 1, 1.5);
  koban.rotation.x = PI / 2;
  koban.visible = false;
  const brasero = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0.15, 0, 0.1, 0.25, 0.05, -0.1, 0.22, -0.04]), 3)),
    new THREE.PointsMaterial({ color: '#ff9a3a', size: 0.55, sizeAttenuation: true, map: flammeDouce(THREE), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  brasero.visible = false;
  brasero.renderOrder = 3;
  const tout = new THREE.Group();
  tout.add(groupe, koban, brasero);
  const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
  let marche = null, frappe = -1, finFrappe = null, joueur = null, scene = false, veille = null, enVeille = false, lu = -1, trouve = false, phase = 0, feuBrasero = null;
  const v = new THREE.Vector3();
  /** Marcher le long de la ligne pts (de son premier point au dernier) ; se résout à l'arrivée. */
  const suivre = (pts, terrain) => new Promise((fin) => {
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    marche = { pts, cum, s: 0, terrain, fin };
  });
  return {
    objet: tout,
    get kobanVisible() { return koban.visible; },
    get veille() { return enVeille; },
    /** Où il marche (null s'il ne marche pas) : le portail du sentier s'ouvre devant lui. */
    get enMarche() { return marche ? groupe.position : null; },
    brasero(x, y, z) { feuBrasero = [x, y, z]; brasero.position.set(x, y, z); },
    async arriver(pts, terrain) {
      scene = true;
      enVeille = false;
      groupe.position.set(pts[0][0], terrain(pts[0][0], pts[0][1]), pts[0][1]);
      groupe.visible = true;
      await suivre(pts, terrain);
      if (joueur) groupe.rotation.y = Math.atan2(joueur.x - groupe.position.x, joueur.z - groupe.position.z);
      await attendre(400);
    },
    taper() { frappe = 0; return new Promise((r) => { finFrappe = r; }); },
    donnerKoban(x, y, z) { koban.position.set(x, y, z); koban.visible = true; },
    koban(oui) { koban.visible = oui; },
    /** Après le koban : il va à pied se chauffer à son brasero (pts : de là où il est jusqu'à sa place, ou), et y reste les nuits. */
    async allerVeille(pts, terrain, ou) {
      await suivre(pts, terrain);
      scene = false;
      veille = ou;
      enVeille = true;
      if (feuBrasero) groupe.rotation.y = Math.atan2(feuBrasero[0] - ou.x, feuBrasero[2] - ou.z);
    },
    maj(dt, temps, c) {
      joueur = c.joueur;
      if (temps - lu > 0.5) { lu = temps; trouve = secretTrouve('oni'); }
      // les nuits, le secret trouvé : il se chauffe à son brasero, près du clocher
      const voir = !scene && trouve && c.nuit > 0.5 && (veille || feuBrasero);
      if (!scene && voir !== enVeille) {
        enVeille = voir;
        groupe.visible = voir;
        if (voir) {
          const q = veille || { x: feuBrasero[0] + 0.95, z: feuBrasero[2] + 0.55 };
          groupe.position.set(q.x, feuBrasero[1] - 0.85, q.z);
          groupe.rotation.y = Math.atan2(feuBrasero[0] - q.x, feuBrasero[2] - q.z);
        }
      }
      brasero.visible = enVeille;
      if (marche) {
        const m = marche, L = m.cum[m.cum.length - 1];
        m.s = Math.min(L, m.s + dt * 1.4);
        let i = 0;
        while (i < m.pts.length - 2 && m.cum[i + 1] < m.s) i++;
        const f = (m.s - m.cum[i]) / (m.cum[i + 1] - m.cum[i] || 1), [x0, z0] = m.pts[i], [x1, z1] = m.pts[i + 1];
        const x = x0 + (x1 - x0) * f, z = z0 + (z1 - z0) * f;
        groupe.position.set(x, m.terrain(x, z), z);
        groupe.rotation.y = Math.atan2(x1 - x0, z1 - z0);
        phase += dt * 5.5;
        if (m.s >= L) { marche = null; const f2 = m.fin; f2(); }
      }
      const pas = marche ? Math.sin(phase) : 0;
      jambes[0].rotation.x = 0.45 * pas;
      jambes[1].rotation.x = -0.45 * pas;
      corps.position.y = marche ? Math.abs(Math.cos(phase)) * 0.06 : 0.02 * Math.sin(temps * 1.6);
      // la torche : levée au-dessus de la tête, puis le petit coup sur la tête du voyageur
      if (frappe >= 0) {
        frappe += dt;
        const u = frappe;
        brasD.rotation.x = u < 0.6 ? -1.5 * Math.sin((u / 0.6) * PI * 0.5) : u < 0.85 ? -1.5 + 2.1 * ((u - 0.6) / 0.25) : u < 1.5 ? 0.6 - 0.6 * ((u - 0.85) / 0.65) : 0;
        if (u >= 0.85 && finFrappe) { const f = finFrappe; finFrappe = null; setTimeout(f, 700); }
        if (u > 1.6) { frappe = -1; brasD.rotation.x = 0; }
      }
      // la flamme danse ; sa lumière suit le haut de la torche (ou le brasero)
      const P2 = feu.geometry.attributes.position;
      for (let k = 0; k < 3; k++) P2.setXYZ(k, -0.08 + 0.04 * Math.sin(temps * (7 + k) + k), 0.62 + 0.1 * k + 0.05 * Math.sin(temps * (9 + 2 * k)), 0.5 + 0.03 * Math.cos(temps * 6 + k));
      P2.needsUpdate = true;
      feu.material.size = 0.62 + 0.12 * Math.sin(temps * 13) * Math.sin(temps * 5.1);
      if (groupe.visible) {
        groupe.updateMatrixWorld(true);
        v.copy(HAUT_TORCHE).applyMatrix4(brasD.matrixWorld);
        Object.assign(lampe, { x: v.x, y: v.y + 0.15, z: v.z, sol: v.y - 2.4 });
      } else if (enVeille === false) lampe.y = -500;
      if (koban.visible) { koban.rotation.z += dt * 2.4; koban.position.y += Math.sin(temps * 3) * 0.002; }
      return [];
    },
  };
}

// ---------------------------------------------------------------- Les points doux (la flamme, la lueur)
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
/** Une flamme douce (une goutte pointue vers le haut, le cœur plus clair) : la torche de l'oni, son brasero. */
function flammeDouce(THREE) {
  const TX = 64, px = new Uint8Array(TX * TX * 4);
  for (let j = 0; j < TX; j++) for (let i = 0; i < TX; i++) {
    const x = (i - TX / 2 + 0.5) / (TX / 2), y = (TX / 2 - j - 0.5) / (TX / 2);
    const larg = 0.55 * (1 - Math.max(0, y) * 0.85) + 0.05, r = Math.hypot(x / larg, (y + 0.25) / 0.75);
    const v = Math.max(0, 1 - r) ** 1.4 + Math.exp(-(x * x + (y + 0.3) ** 2) * 30) * 0.6;
    px.set([255, 255, 255, Math.round(Math.min(1, v) * 255)], (j * TX + i) * 4);
  }
  const t = new THREE.DataTexture(px, TX, TX);
  t.magFilter = t.minFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}

// ---------------------------------------------------------------- Le sol
const TITRES_PANNEAUX = { nio: '仁王像', yuisho: '三十仏 由緒', sentier: '峯道ロングトレイル' };
/** Le sol (sa couleur et sa matière, textures.js) en x, z, à la hauteur h. */
function aspectSol(P, x, z, h) {
  const bruit = bruitDoux(x, z, 3.5), b2 = bruitDoux(x * 0.5 + 9, z * 0.5, 3);
  // le lit du ruisseau : des galets mouillés
  if (surLaLigne(RUISSEAU, x, z).d < 0.7 && versRect(TERRASSE, x, z) > 0.4) return [bruit > 0.5 ? '#5a5c52' : '#4e5048', M.roche];
  // la route : le goudron
  if (surRoute(x, z).d < DEMI_ROUTE + 0.1) return [bruit > 0.5 ? '#6e6c69' : '#666461', M.route];
  // la cour de la ferme : la terre battue ; les rizières : le vert du riz
  if (dansRect(COUR, x, z, 0.1)) return [bruit > 0.5 ? '#a08a68' : '#94805e', M.terre];
  if (z > RIZIERES_Z && Math.abs(x - 4) < 30) return [(Math.floor((z - RIZIERES_Z) / 7) % 2) ? '#7aac48' : '#86b850', M.herbe];
  // le chemin de terre, l'allée de Bunbuku, sa clairière : la terre et les aiguilles rousses
  if (surLaLigne(CHEMIN, x, z).d < DEMI_CHEMIN + 0.2 * bruit || surLaLigne(ALLEE, x, z).d < 0.8 + 0.2 * bruit || aLaPlace(RECOIN, x, z) < 0.1) return [bruit > 0.55 ? '#7a5e44' : '#6e543d', M.terre];
  // le sentier de montagne, derrière son portail : la terre, plus étroit à mesure qu'il monte
  { const l = surLaLigne(SENTIER, x, z); if (l.d < 0.62 + 0.15 * bruit - 0.006 * l.s && versRect(TERRASSE, x, z) > 0.05) return [bruit > 0.55 ? '#6e543d' : '#644b36', M.terre]; }
  // le palier et les marches des Nio : la terre tassée et les pierres
  if (dansRect(PALIER, x, z, 0.2) || dansRect(MARCHES_NIO, x, z, 0.2)) return [bruit > 0.6 ? '#6f6a5a' : '#655f50', M.dalles];
  // la terrasse : le gravier ; le belvédère : la roche
  if (dansRect(BELVEDERE, x, z, 0.1)) return [bruit > 0.5 ? '#7a7666' : '#6e6a5c', M.roche];
  if (dansRect(TERRASSE, x, z, 0.05)) return [b2 > 0.66 ? '#5f6e48' : bruit > 0.6 ? '#7e7b70' : bruit > 0.3 ? '#757267' : '#6e6b60', b2 > 0.66 ? M.mousse : M.terre];
  // la grotte de l'ermite : la roche, sombre et mouillée
  if (solGrotte(x, z)) return [bruit > 0.55 ? '#47443c' : '#3f3c35', M.terre];
  // au pied de la falaise et sous l'escalier : la mousse
  if (z < zParoi(x) + 2 || (Math.abs(x - ESC.x) < ESC.demi + 1.2 && z < ESC.z0 && z > ESC.z1)) return [bruit > 0.5 ? '#557a3c' : '#4a6e34', M.mousse];
  // au loin, la forêt sombre ; le sous-bois : les aiguilles rousses des cèdres, des plaques de mousse et de plantes basses
  if (Math.hypot(x, z - 10) > 110) return [bruit > 0.6 ? '#3e5636' : '#44603a', M.sousBois];
  if (z > 50 && Math.abs(x) < 40) return [bruit > 0.6 ? '#7fae58' : '#74a24e', M.herbe];
  return [b2 > 0.62 ? '#4f7038' : bruit > 0.6 ? '#7a5640' : bruit > 0.3 ? '#6e4e3a' : '#654634', b2 > 0.62 ? M.mousse : M.sousBois];
}

// ---------------------------------------------------------------- Les textes du lieu
// (les trente bouddhas des jours du mois, 三十日秘仏 : [nom, ce qu'il est] ; les mêmes noms dans les trois langues)
const NOMS_HOTOKE = ['Jōkō', 'Tōmyō', 'Tahō', 'Ashuku', 'Miroku', 'Niman-tōmyō', 'Sanman-tōmyō', 'Yakushi', 'Daitsū-chishō', 'Nichigetsu-tōmyō', 'Kangi', 'Nanshō', 'Kokūzō', 'Fugen', 'Amida', 'Darani', 'Ryūju', 'Kannon', 'Nikkō', 'Gakkō', 'Mujin’i', 'Semui', 'Seishi', 'Jizō', 'Monju', 'Yakujō', 'Roshana', 'Dainichi', 'Yakuō', 'Shaka'];
const KANJI_HOTOKE = ['定光仏', '燈明仏', '多宝仏', '阿閦仏', '弥勒仏', '二万燈明仏', '三万燈明仏', '薬師如来', '大通智勝仏', '日月燈明仏', '歓喜仏', '難勝仏', '虚空蔵菩薩', '普賢菩薩', '阿弥陀仏', '陀羅尼菩薩', '龍樹菩薩', '観世音菩薩', '日光菩薩', '月光菩薩', '無尽意菩薩', '施無畏菩薩', '大勢至菩薩', '地蔵菩薩', '文殊菩薩', '薬上菩薩', '盧遮那仏', '大日如来', '薬王菩薩', '釈迦如来'];
const DIT_FR = ['le bouddha qui allume les lampes', 'le bouddha de la lampe', 'le bouddha des trésors', 'l’inébranlable, que rien ne met en colère', 'le bouddha qui viendra, dans très longtemps', 'le bouddha des vingt mille lampes', 'le bouddha des trente mille lampes', 'le bouddha qui guérit', 'le bouddha de la grande sagesse', 'le bouddha de la lumière du soleil et de la lune', 'le bouddha de la joie', 'celui qui vient à bout des épreuves', 'la sagesse grande comme le ciel', 'la bonté qui agit, sur son éléphant blanc', 'la lumière qui ne s’éteint jamais', 'les paroles qui protègent', 'le sage des dragons', 'la compassion, qui entend tous les appels', 'la lumière du soleil', 'la lumière de la lune', 'l’esprit qui ne s’épuise jamais', 'celui qui chasse la peur', 'la force de la sagesse', 'le protecteur des enfants et des voyageurs', 'la sagesse, qu’on prie avant les examens', 'les remèdes', 'le grand Bouddha de Nara', 'le grand soleil', 'le roi des remèdes', 'le Bouddha lui-même, qui vécut en Inde il y a 2 500 ans'];
const DIT_EN = ['the Buddha who lights the lamps', 'the Buddha of the lamp', 'the Buddha of treasures', 'the immovable one, whom nothing can anger', 'the Buddha to come, a very long time from now', 'the Buddha of twenty thousand lamps', 'the Buddha of thirty thousand lamps', 'the healing Buddha', 'the Buddha of great wisdom', 'the Buddha of the light of sun and moon', 'the Buddha of joy', 'the one who overcomes all trials', 'wisdom as vast as the sky', 'kindness in action, on his white elephant', 'the light that never goes out', 'the words that protect', 'the sage of the dragons', 'compassion, who hears every call', 'the light of the sun', 'the light of the moon', 'the mind that never runs out', 'the one who drives fear away', 'the strength of wisdom', 'the protector of children and travellers', 'wisdom, whom students pray to before exams', 'the remedies', 'the Great Buddha of Nara', 'the great sun', 'the king of remedies', 'the Buddha himself, who lived in India 2,500 years ago'];
const DIT_JA = ['あかりを　ともす　仏さま', 'あかりの　仏さま', 'たからものの　仏さま', 'けっして　おこらない　仏さま', 'ずっと　さきの　みらいに　くる　仏さま', '二万の　あかりの　仏さま', '三万の　あかりの　仏さま', 'びょうきを　なおす　仏さま', 'おおきな　ちえの　仏さま', 'お日さまと　お月さまの　ひかりの　仏さま', 'よろこびの　仏さま', 'どんな　こんなんにも　かつ　仏さま', 'そらのように　ひろい　ちえ', 'しろい　ぞうに　のった　やさしさ', 'きえない　ひかり', 'まもってくれる　ことば', 'りゅうの　ちえの　ある　人', 'すべての　こえを　きく　やさしさ', 'お日さまの　ひかり', 'お月さまの　ひかり', 'つきない　こころ', 'こわい　きもちを　とりさる　仏さま', 'ちえの　ちから', 'こどもと　たびびとを　まもる　仏さま', 'ちえの　仏さま。しけんの　まえに　おまいりする', 'くすりの　仏さま', '奈良の　大仏さま', 'おおきな　お日さま', 'くすりの　王さま', 'インドで　くらした　お釈迦さま'];
const HOTOKES = (dit) => NOMS_HOTOKE.map((nom, i) => ({ nom, kanji: KANJI_HOTOKE[i], dit: dit[i] }));
const TEXTES = {
  fr: {
    noms: { obaa: 'La grand-mère', enfant: 'La petite-fille', randonneur: 'Le randonneur', videaste: '@random_japan_place', yamabushi: 'Le yamabushi', moine: 'Le moine', bucheron: 'Le bûcheron', photographe: 'La photographe', oni: 'L’oni', yamabiko: 'L’écho' },
    tampons: {
      vue: ['La mer de nuages', 'au belvédère, au bout est de la terrasse : la vallée sous la brume'],
      waraji: ['Les sandales des Nio', 'en bas : les sandales de paille de la grand-mère, pendues au râtelier des gardiens Nio'],
      kane: ['La cloche', 'au clocher de la terrasse : trois coups, en laissant chanter la cloche entre deux'],
      hotoke: ['Le bouddha du jour', 'au pavillon sous la falaise : la bougie du moine, pour le bouddha d’aujourd’hui'],
      yamabiko: ['L’écho de la falaise', 'sur la terrasse, au petit panneau « やまびこ » : appeler trois fois la falaise, et écouter qui répond'],
    },
    vue: ['Sous tes pieds, la vallée a disparu : une mer de nuages blancs (雲海) remplit tout, jusqu’aux montagnes. Seules les pointes des cèdres dépassent, comme des îles.', 'La péninsule de Kunisaki est ronde, faite de vallées qui partent toutes de la même montagne, comme les rayons d’une roue. Les matins de brume, elles se remplissent de nuages.'],
    vueNuit: ['La nuit, la vallée n’est plus qu’un lac d’ombre. Tout au fond, une seule lumière : la fenêtre de la grand-mère.'],
    vueCompagnon: { kon: ['« On marche au-dessus des nuages… On dirait qu’on pourrait nager dedans. »'], pon: ['« Pon ! Une mer de coton ! J’ai envie de sauter dedans… mais je ne vais pas le faire. »'], chapu: ['« Chapu ! Si c’était de l’eau, j’y plongerais tout de suite ! »'], gao: ['« Gao… Je garde la vallée. Même ce qu’on ne voit plus. »'], fuwa: ['« Fuwaaa… Les nuages, c’est de l’eau qui rêve. Je les connais bien. »'], saya: ['« Les cèdres respirent, et la brume, c’est leur souffle du matin. »'] },
    obaa: ['Oh, un voyageur ! Bonjour, bonjour. Tu montes voir les Trente Bouddhas ?', 'Je tresse des sandales de paille (草鞋). Les grandes, c’est pour les gardiens Nio, là-haut, en haut des marches.', 'On les leur offre pour avoir de bonnes jambes. Avec toutes ces marches, il en faut ! Tiens, prends cette paire, et va la pendre à leur râtelier.'],
    warajiDonne: ['Tu reçois une paire de grandes sandales de paille.', 'Les gardiens sont au pied du grand escalier. Celui qui a la bouche ouverte, à droite, c’est « A » ; l’autre, la bouche fermée, c’est « Un ». Le début et la fin de toute chose.'],
    warajiDeja: ['Tu as déjà ta paire de sandales ! Les Nio t’attendent, en haut du chemin.'],
    obaaApres: ['Tu as pendu mes sandales aux Nio ? Alors tes jambes ne te lâcheront pas de sitôt !', 'Tu sais, quand j’étais petite, un oni m’a tapé sur la tête avec sa torche, à la fête du feu. Pas un seul rhume de toute l’année !'],
    obaaNuit: ['Il se fait tard… Ici, la nuit, on n’a pas peur des oni, tu sais. Les oni de Kunisaki sont des bouddhas déguisés.', 'À la fête du feu, l’hiver, ils descendent de la montagne avec leurs torches et tapent les gens sur la tête pour leur porter chance. Les petits pleurent, les grands rient !'],
    nio: ['Les deux gardiens Nio (仁王), taillés dans la pierre il y a des siècles, couverts de mousse et de lichen.', 'Celui de droite a la bouche ouverte : il dit « A », le premier son. Celui de gauche l’a fermée : il dit « Un », le dernier. Ensemble, « A-Un » : le début et la fin de toute chose.', 'Ce sont des gardiens bouddhistes… et pourtant ils gardent un torii shintō. Ici, à Kunisaki, on a toujours mêlé les deux.'],
    nioNuit: ['La nuit, les gardiens ont l’air encore plus terribles. On croirait qu’ils respirent.'],
    waraji: ['Tu pends la paire de sandales au râtelier, à côté des autres.', 'Les gardiens Nio ont de quoi marcher. Et toi, de bonnes jambes pour toutes ces marches !'],
    warajiCompagnon: { kon: ['« Des sandales pour des géants… Elles leur iront à merveille. »'], pon: ['« Pon ! Avec des pieds pareils, ils doivent courir vite ! »'], chapu: ['« Chapu ! Moi, je marche pieds nus. Toujours ! »'], gao: ['« Gao ! Un gardien bien chaussé est un gardien heureux. »'], fuwa: ['« Fuwa… Ils ne bougent pas, mais ils iront loin, maintenant. »'], saya: ['« La paille sent le champ… Ils seront contents. »'] },
    kane: ['Une grande cloche de bronze (梵鐘). On la frappe avec le tronc de bois suspendu, en tirant sa corde.', 'Les moines disent qu’il faut la laisser chanter : frapper, puis attendre que le son s’efface presque avant le coup suivant.', 'Tu sonnes trois coups ?'],
    kaneEncore: ['Encore trois coups de cloche ?'],
    kaneAide: (n) => `A (ou un appui sur l’écran) pour frapper. Laisse chanter la cloche entre deux coups. Encore ${n} coup${n > 1 ? 's' : ''}`,
    kaneTrop: (n) => `Trop vite ! La cloche n’avait pas fini de chanter… Encore ${n} coup${n > 1 ? 's' : ''}`,
    kaneRate: ['Les coups se sont bousculés… La cloche a sonné comme une casserole.', 'Pas grave : réessaie, et laisse-la chanter entre deux coups.'],
    kaneGagne: ['Goooon… Goooon… Goooon…', 'Le son roule dans la vallée, passe sous les cèdres et revient de la falaise. Même la brume semble l’écouter.'],
    kaneCompagnon: { kon: ['« Je l’ai sentie jusqu’au bout de ma queue… »'], pon: ['« Pon ! Mon ventre a vibré comme mon tambour ! »'], chapu: ['« Chapu ! Les cèdres ont tremblé ! »'], gao: ['« Gao… Un son de gardien. Grave et fort. »'], fuwa: ['« Fuwaaa… Le son est descendu jusqu’au fond des nuages. »'], saya: ['« Les arbres ont répondu… Tu as entendu ? »'] },
    kaneNuit: ['La nuit est tombée sur la terrasse. Le moine a dit de ne pas sonner la cloche la nuit : ça ferait descendre les oni de la montagne…', 'Tu sonnes quand même ?'],
    kaneNuitApres: ['Le dernier écho s’éteint. Silence…', 'Puis, là-haut, dans la montagne, une lumière orange s’allume entre les cèdres. Elle descend.'],
    oni: ['« Ho ho ho ! Qui sonne la cloche à cette heure ? »', '« N’aie pas peur, petit voyageur. Ici, à Kunisaki, nous, les oni, nous sommes des bouddhas déguisés. On dit même : le pays où les démons sont devenus des bouddhas. »', '« Chaque hiver, à la fête du feu, nous descendons avec nos torches. Et ceux qu’on tape sur la tête n’attrapent rien de toute l’année. Approche… »'],
    oniTape: ['Pof ! L’oni t’a tapé tout doucement sur la tête avec sa torche. Des étincelles !', '« Voilà ! Une année entière sans un rhume. Ho ho ! »'],
    oniCompagnon: { kon: ['« Un oni… gentil ? Je n’y croyais pas. Il sent le feu de bois et le riz. »'], pon: ['« Pon ! Il m’a fait peur… et puis il a ri. J’aime bien les gens qui rient. »'], chapu: ['« Chapu ! Tape-moi aussi ! Tape-moi aussi ! »'], gao: ['« Gao… Un gardien de nuit, comme moi. Je le salue. »'], fuwa: ['« Fuwa… Il a la chaleur d’un soleil caché. »'], saya: ['« Il est vieux comme la montagne… Les cèdres le connaissent. »'] },
    oniKoban: ['« Et tiens, garde ceci. Un koban d’or, pour le voyageur qui n’a pas eu peur de sonner. »', '« Les nuits où tu reviendras, je me chaufferai à mon brasero, près du clocher. Viens dire bonsoir ! »'],
    oniApres: ['L’oni se chauffe les mains à son brasero. « Ho ho… Bonsoir, petit voyageur. La montagne est calme, cette nuit. »'],
    torche: ['Une torche de bambou, à moitié brûlée, appuyée au poteau du clocher. Elle sent encore le feu.', 'Qui a bien pu la laisser là ? Elle est bien trop grosse pour une main humaine…'],
    portail: ['Un portail de rondins ferme un sentier qui monte dans la forêt : le 峯道, le chemin des ermites, qui relie les temples de la péninsule.', 'Une petite plaque : « Refermez bien derrière vous (sangliers). »'],
    torcheNuit: ['La vieille torche brûlée, contre le poteau. Dans le noir, on dirait qu’elle attend quelqu’un.'],
    empreintes: ['D’énormes empreintes de pieds nus, dans la boue du chemin. Plus longues que deux mains, avec cinq gros orteils.', 'Elles viennent du ruisseau et montent vers la montagne…'],
    empreintesNuit: ['Les grandes empreintes, dans la boue. La nuit, elles ont l’air encore plus grandes.'],
    moine: (j, t) => [`Bienvenue aux Trente Bouddhas. Il y a ici un bouddha pour chaque jour du mois.`, `Aujourd’hui, nous sommes le ${j === 1 ? '1er' : j}. Celui qui veille sur ce jour, c’est ${t.nom} (${t.kanji}) : ${t.dit}.`, 'Voici une bougie. Allume-la devant lui, à l’autel du pavillon.'],
    bougieDonnee: ['Tu reçois une bougie blanche.', '« Et surtout… ne sonne jamais la cloche la nuit. On dit que ça fait descendre les oni de la montagne. »'],
    moineSoir: ['Le soir, je récite les sutras pour les trente bouddhas. Tu veux rester jusqu’à la nuit ?'],
    moineNon: ['Comme tu veux. Les bouddhas ont tout leur temps.'],
    moineNuit: ['Le soleil est tombé derrière la montagne. La brume monte de la vallée…', 'Je vais réciter les sutras. Rappelle-toi : pas de cloche, la nuit. La montagne s’éveille.'],
    moineNuitApres: ['Le soleil est tombé derrière la montagne. La brume monte de la vallée…', 'Ton ami l’oni doit déjà se chauffer à son brasero. Il t’aime bien, tu sais.'],
    moineMatin: ['Tu veux attendre le lever du jour ici, avec moi ?'],
    moineReste: ['La nuit est longue, ici. Les bouddhas veillent.'],
    moineAube: ['Le jour se lève. La brume s’en va doucement entre les cèdres.'],
    hotokes: HOTOKES(DIT_FR),
    autel: ['Trente petits bouddhas de pierre, sur trois gradins contre la falaise : un pour chaque jour du mois. Devant eux, une rangée de bougies.', 'Le moine, devant le pavillon, donne des bougies aux visiteurs.'],
    autelNuit: ['Dans le noir, les trente bouddhas semblent sourire. La falaise goutte au-dessus d’eux.'],
    hotoke: (j, t) => [`Tu allumes la bougie devant le ${j === 1 ? '1er' : `${j}e`} bouddha : ${t.nom} (${t.kanji}), ${t.dit}.`, 'La petite flamme danse sur son visage de pierre. On dirait qu’il te regarde.', 'Reviens un autre jour : ce sera un autre bouddha qui veillera.'],
    hotokeRevoir: (j, t) => [`Ta bougie brûle toujours devant ${t.nom}, le bouddha du ${j === 1 ? '1er' : j}.`],
    hotokeCompagnon: { kon: ['« Une flamme pour aujourd’hui… C’est joli, un bouddha pour chaque jour. »'], pon: ['« Pon ! Il y en a un pour mon anniversaire ? Je reviendrai ce jour-là ! »'], chapu: ['« Chapu ! Trente amis de pierre ! Je les compte ? »'], gao: ['« Gao… Ils veillent chacun leur tour. Comme des gardiens. »'], fuwa: ['« Fuwa… Sa flamme brille comme une perle. »'], saya: ['« La mousse pousse sur eux depuis si longtemps… Ils sont chez eux. »'] },
    echo: { appel: ['« Ohéééé ! »', '« Il y a quelqu’un ? »', '« Bonjouuur ! »'], reponse: ['… ohéé… ohé…', '… quelqu’un… qu’un…', '… bienvenue… voyageur…'], fin: ['Ce n’était pas ton écho, cette fois…', 'Les gens d’ici disent qu’un esprit de la montagne, le yamabiko (山彦), répète tout ce qu’on lui crie. Et parfois, il répond.'] },
    echoNuit: { appel: ['« Ohé ? »', '« Il y a quelqu’un ? »', '« Bonne nuit… »'], reponse: ['… ohé… ohé…', '… quelqu’un… qu’un…', '… dors bien… voyageur…'], fin: ['La falaise t’a souhaité bonne nuit…', 'Les gens d’ici disent qu’un esprit de la montagne, le yamabiko (山彦), répète tout ce qu’on lui crie. Et parfois, il répond.'] },
    yamabikoCompagnon: { kon: ['« Il t’a répondu ! Les esprits d’ici sont polis. »'], pon: ['« Pon ?! Une montagne qui parle ! Je lui demande des gâteaux ? »'], chapu: ['« Chapuuu ! À moi ! Ohéééé ! »'], gao: ['« Gao… Je n’ai vu personne. Ça ne me plaît pas. Mais il était gentil. »'], fuwa: ['« Fuwa… La falaise a une voix douce. »'], saya: ['« C’est un cousin à moi… Un esprit du bois et de la pierre. »'] },
    videaste: ['Salut ! Je filme les gardiens Nio dans la brume pour mon TikTok, @random_japan_place. Regarde !'],
    enfant: ['Tu as vu les traces de pieds géants, là, dans la boue ? Elles vont du ruisseau jusqu’à la montagne !', 'Mamie dit que c’est un oni gentil. Moi, je crois qu’il vient la nuit, quand quelqu’un l’appelle…'],
    randonneur: ['On fait le chemin des crêtes de Kunisaki, le 峯道ロングトレイル : plus de cent kilomètres de sentiers entre les temples de la péninsule.', 'Les moines d’autrefois le parcouraient en entier, de temple en temple. Nous, on prend notre temps !'],
    yamabushi: ['Je suis un yamabushi : je prie en marchant dans les montagnes. Ici, depuis plus de mille ans, on mêle les dieux des montagnes et les bouddhas.', 'Tu vois la conque à ma ceinture ? On la souffle pour s’appeler d’une montagne à l’autre. Peut-être qu’un jour, tu en auras une…', 'Autrefois, un ermite méditait sous la cascade du bassin, des heures entières, l’eau glacée sur la tête. On raconte qu’un jour, la montagne lui a ouvert sa porte… Il faut tenir bon, sous l’eau.'],
    yamabushiNuit: ['La nuit, la montagne parle plus fort. Écoute… on entend les cèdres craquer.'],
    bucheron: ['Ces cèdres, c’est mon grand-père qui les a plantés, il y a soixante ans. Celle-là, en dessous, je l’ai coupée l’an dernier : on replante de jeunes cèdres.', 'Grâce à la coupe, on voit la vallée depuis le belvédère. Les matins de brume, c’est une mer de nuages !'],
    photographe: ['Chut… J’attends que la mer de nuages soit parfaite. Ça fait trois heures que je suis là.', 'Le meilleur moment, c’est quand seules les pointes des cèdres dépassent. Va voir au bord du belvédère !'],
    torii: ['Un torii de pierre, gris et usé, avec sa corde sacrée et ses papiers blancs. Sur sa plaque : 三十仏, « les Trente Bouddhas ».', 'Un torii (shintō) gardé par des Nio (bouddhistes) : à Kunisaki, les dieux et les bouddhas ont toujours vécu ensemble.'],
    toriiNuit: ['Dans la nuit, les papiers blancs du torii bougent tout seuls, comme s’ils respiraient.'],
    escalier: ['Le grand escalier : quatre-vingt-douze marches de pierre couvertes de mousse, tout droit entre les cèdres.', 'Tout en haut, sous la falaise, le pavillon des Trente Bouddhas. Courage !'],
    escalierNuit: ['Les marches disparaissent dans la brume, entre les lanternes. On ne voit pas le haut.'],
    to: ['Un stupa de pierre de Kunisaki (国東塔) : un socle, un lotus, un corps tout rond, un petit toit et une flèche d’anneaux.', 'On n’en trouve presque que dans la péninsule. On y gardait des sutras, ou le souvenir de quelqu’un.'],
    shinboku: ['Le grand cèdre sacré (神木) : plus de cinq cents ans, peut-être. Une corde de paille entoure son tronc : un dieu y habite.'],
    shinbokuNuit: ['Le vieux cèdre se perd dans le noir. On n’en voit que le pied, et sa corde blanche.'],
    cascade: ['Un mince filet d’eau tombe du haut de la falaise dans un petit bassin. Fudō Myōō (不動明王), le gardien au sabre, le regarde tomber.', 'Des pierres plates traversent le bassin jusque sous la chute. Les yamabushi viennent s’y tenir sous l’eau glacée, même en hiver : le takigyō (滝行).'],
    cascadeNuit: ['On ne voit plus la cascade, on l’entend seulement. Elle ne s’arrête jamais.'],
    yamabushiApres: ['Tu as trouvé la grotte de l’ermite ?! Alors la montagne t’a accepté. Garde-le pour toi, hein… c’est un secret de la montagne.'],
    takiFroid: 'Brrr… L’eau glacée tombe sur ta tête et tes épaules !',
    takiTenir: 'Tiens bon, les yeux fermés… comme les ermites de la montagne.',
    takiTot: { kon: ['« Brrr ! Les ermites de la montagne, eux, restaient bien plus longtemps sous l’eau… »'], pon: ['« Pon ! C’est glacé ! Les yamabushi restent longtemps dessous, eux… Moi, je préfère le bain chaud. »'], chapu: ['« Chapu ! Déjà fini ? Les ermites, eux, restaient longtemps sous la cascade ! »'], gao: ['« Gao… Un gardien ne bouge pas. Les ermites non plus : ils restaient sous l’eau sans bouger. »'], fuwa: ['« Fuwa… L’eau aime ceux qui restent. Les ermites le savaient. »'], saya: ['« La montagne n’a pas eu le temps de te voir… Les ermites restaient plus longtemps. »'] },
    takiFin: ['Tu restes sous l’eau glacée, sans bouger, les yeux fermés. Le grondement de la cascade remplit tout…', 'Et soudain, derrière l’eau, la roche se met à trembler !'],
    grotte: ['La dalle de roche a glissé toute seule. Derrière la cascade, il y avait une grotte !', 'Tout au fond, des bougies brillent… Pourtant, il n’y a personne.'],
    grotteCompagnon: { kon: ['« La montagne t’a ouvert sa porte… Le yamabushi disait vrai. »'], pon: ['« Pon ?! Une porte secrète ! Il y a peut-être des gâteaux, dedans ? »'], chapu: ['« Chapuuu ! Une grotte derrière l’eau ! On y va, on y va ! »'], gao: ['« Gao… Des bougies allumées, et personne. Je passe devant. »'], fuwa: ['« Fuwa… La cascade gardait ce secret depuis si longtemps. »'], saya: ['« Ça sent la pierre mouillée et la cire… Quelqu’un veille sur cet endroit. »'] },
    iwayaAutel: ['Dans un petit coffre de bois laqué aux portes ouvertes, un bouddha doré brille à la lueur des bougies.', 'C’est un hibutsu (秘仏), un « bouddha caché » : on ne le montre presque jamais. Certains ne sont ouverts qu’une fois tous les trente-trois ans.', 'Les bougies sont neuves… Qui les a allumées ?'],
    iwayaAutelNuit: ['La nuit, la grotte n’a que ses bougies. Le bouddha doré semble flotter dans le noir.', 'C’est un hibutsu (秘仏), un « bouddha caché » : on ne le montre presque jamais. Certains ne sont ouverts qu’une fois tous les trente-trois ans.'],
    kobanIwaya: ['Sur le petit plateau d’offrandes (三方), à côté du coffre, une vieille pièce d’or…', 'On dirait qu’elle t’attendait.'],
    iwayaErmite: ['Une natte de paille usée, un petit pupitre avec un sutra ouvert, une conque, un bâton de pèlerin contre la paroi.', 'Un ermite a vécu ici. Chaque jour, il allait méditer sous la cascade, l’hiver comme l’été.'],
    iwayaBol: ['Plic… plic… L’eau goutte de la voûte dans un bol de pierre.', 'Goutte après goutte, depuis des siècles, elle a creusé la pierre. L’ermite y buvait l’eau de la montagne.'],
    iwayaBouddhas: ['Sur un rebord de la paroi, une rangée de petits bouddhas taillés dans la roche, polis par les mains et par le temps.', 'L’ermite les a sculptés un à un, à la lueur des bougies.'],
    magaibutsu: ['Des bouddhas taillés à même la falaise (磨崖仏), dans des niches. Le temps et l’eau les ont presque effacés.', 'La péninsule de Kunisaki en compte des centaines, cachés dans les forêts et les rochers.'],
    magaibutsuNuit: ['Dans le noir, les bouddhas de la falaise ne sont plus que deux ombres douces.'],
    masque: ['Un vieux masque d’oni, rouge, avec deux cornes, pendu au poteau du pavillon.', 'C’est un masque de la fête du feu (修正鬼会) : les oni de Kunisaki sont gentils, ce sont des bouddhas déguisés.'],
    masqueNuit: ['Le masque d’oni brille un peu à la lueur des bougies. On dirait qu’il sourit…'],
    jizo: ['Tu joins les mains devant le petit jizō, avec son bavoir rouge. Il protège les enfants et les voyageurs.'],
    jizoNuit: ['Tu joins les mains devant le petit jizō. Dans le noir, son bavoir rouge est la seule couleur.'],
    kaki: ['Un vieux kaki, plein de fruits orange. La grand-mère les fera sécher sous le toit, pour l’hiver.'],
    kakiNuit: ['Le kaki dort. Ses fruits ressemblent à de petites lanternes éteintes.'],
    'panneau-nio': ['« 仁王像 — les gardiens Nio »', 'La péninsule de Kunisaki compte plus de gardiens Nio de pierre que tout le reste du Japon : plus de cent quarante dans la seule ville de Bungo-Takada. Les plus anciens portant une date (1478) gardent le temple Iwato-ji, à un kilomètre d’ici. On leur offre de grandes sandales de paille pour avoir de bonnes jambes.'],
    'panneau-yuisho': ['« 三十仏 由緒 — les Trente Bouddhas »', 'Chaque jour du mois a son bouddha protecteur : le premier, Jōkō ; le quinzième, Amida ; le trentième, Shaka. Une très vieille liste, déjà dans un livre de 1690. Les trente veillent ici, sous la falaise, depuis des siècles. Les gens de la vallée viennent allumer une bougie à celui de leur jour.'],
    'panneau-sentier': ['« 峯道ロングトレイル — le chemin des crêtes de Kunisaki »', 'Plus de cent kilomètres de sentiers de montagne, de temple en temple, sur les pas des moines qui priaient en marchant (六郷満山). Le prochain temple : Iwato-ji, à un kilomètre au nord-est.'],
    chatFerme: ['Le chat de la ferme dort roulé en boule, au soleil, contre la véranda.'],
    chatFermeNuit: ['Le chat de la ferme s’est réveillé. Ses yeux brillent dans le noir.'],
    chatCompagnon: { kon: ['« Un chat de ferme… Il connaît tous les secrets de la vallée. »'], pon: ['« Pon ! Il dort comme moi après un bon repas. »'], chapu: ['« Chapu ! Réveille-toi, on joue ? Non ? Bon. »'], gao: ['« Gao. Un petit gardien de ferme. »'], fuwa: ['« Fuwa… Il ronronne comme un nuage. »'], saya: ['« Il sent la paille et le soleil… »'] },
    papillon: ['Un papillon se pose sur une fleur, près de la ferme, puis repart vers la forêt.'],
    milan: ['Un milan tourne au-dessus de la vallée, en criant « piiiyoro ».'],
    nuitCompagnon: { kon: ['« Tu entends ? Quelque chose marche, là-haut, dans la montagne… Et ça sent le bois brûlé. »'], pon: ['« Pon… Il y a quelqu’un de très gros dans la montagne. Je l’entends respirer. »'], chapu: ['« Chapu… Ça sent le feu de bois, là-haut ! On fait griller des patates ? »'], gao: ['« Gao ! Quelque chose bouge dans la montagne. Je monte la garde. »'], fuwa: ['« Fuwa… La montagne attend qu’on l’appelle. La cloche, peut-être ? »'], saya: ['« Les cèdres chuchotent… Un ami à eux va descendre, si on l’appelle. »'] },
  },
  en: {
    noms: { obaa: 'The grandmother', enfant: 'The granddaughter', randonneur: 'The hiker', videaste: '@random_japan_place', yamabushi: 'The yamabushi', moine: 'The monk', bucheron: 'The woodcutter', photographe: 'The photographer', oni: 'The oni', yamabiko: 'The echo' },
    tampons: {
      vue: ['The sea of clouds', 'at the lookout, at the east end of the terrace: the valley under the mist'],
      waraji: ['The Nio’s sandals', 'down below: the grandmother’s straw sandals, hung on the Nio guardians’ rack'],
      kane: ['The bell', 'at the bell tower on the terrace: three strokes, letting the bell sing in between'],
      hotoke: ['Today’s Buddha', 'at the hall under the cliff: the monk’s candle, for today’s Buddha'],
      yamabiko: ['The cliff’s echo', 'on the terrace, at the little “やまびこ” sign: call out to the cliff three times, and listen to who answers'],
    },
    vue: ['Below your feet, the valley has vanished: a sea of white clouds (雲海) fills everything, all the way to the mountains. Only the tips of the cedars poke out, like islands.', 'The Kunisaki Peninsula is round, made of valleys that all start from the same mountain, like the spokes of a wheel. On misty mornings they fill with clouds.'],
    vueNuit: ['At night, the valley is just a lake of shadow. Far below, a single light: the grandmother’s window.'],
    vueCompagnon: { kon: ['“We’re walking above the clouds… It looks like we could swim in them.”'], pon: ['“Pon! A sea of cotton! I want to jump in… but I won’t.”'], chapu: ['“Chapu! If it were water, I’d dive right in!”'], gao: ['“Gao… I guard the valley. Even what I can’t see anymore.”'], fuwa: ['“Fuwaaa… Clouds are water that dreams. I know them well.”'], saya: ['“The cedars are breathing, and the mist is their morning breath.”'] },
    obaa: ['Oh, a traveller! Hello, hello. Are you going up to see the Thirty Buddhas?', 'I’m weaving straw sandals (草鞋). The big ones are for the Nio guardians, up there at the top of the steps.', 'We give them sandals so our legs stay strong. With all those steps, you need it! Here, take this pair and hang it on their rack.'],
    warajiDonne: ['You receive a pair of big straw sandals.', 'The guardians stand at the foot of the great staircase. The one on the right with his mouth open says “A”; the other, mouth closed, says “Un”. The beginning and the end of all things.'],
    warajiDeja: ['You already have your pair of sandals! The Nio are waiting for you, up the path.'],
    obaaApres: ['You hung my sandals for the Nio? Then your legs won’t let you down anytime soon!', 'You know, when I was little, an oni tapped me on the head with his torch at the fire festival. Not a single cold all year!'],
    obaaNuit: ['It’s getting late… Here, we’re not afraid of oni at night, you know. The oni of Kunisaki are Buddhas in disguise.', 'At the fire festival in winter, they come down from the mountain with torches and tap people on the head for good luck. The little ones cry, the grown-ups laugh!'],
    nio: ['The two Nio guardians (仁王), carved in stone centuries ago, covered in moss and lichen.', 'The one on the right has his mouth open: he says “A”, the first sound. The one on the left has it closed: he says “Un”, the last. Together, “A-Un”: the beginning and the end of all things.', 'They are Buddhist guardians… and yet they guard a Shinto torii. Here in Kunisaki, the two have always been mixed.'],
    nioNuit: ['At night, the guardians look even fiercer. You’d think they were breathing.'],
    waraji: ['You hang the pair of sandals on the rack, next to the others.', 'Now the Nio guardians have something to walk in. And you’ve got strong legs for all those steps!'],
    warajiCompagnon: { kon: ['“Sandals for giants… They’ll fit them perfectly.”'], pon: ['“Pon! With feet like that, they must run fast!”'], chapu: ['“Chapu! I walk barefoot. Always!”'], gao: ['“Gao! A well-shod guardian is a happy guardian.”'], fuwa: ['“Fuwa… They don’t move, but now they’ll go far.”'], saya: ['“The straw smells of the fields… They’ll be pleased.”'] },
    kane: ['A great bronze bell (梵鐘). You strike it with the hanging wooden log, by pulling its rope.', 'The monks say you must let it sing: strike, then wait until the sound has almost faded before the next stroke.', 'Ring three strokes?'],
    kaneEncore: ['Three more strokes of the bell?'],
    kaneAide: (n) => `A (or a tap on the screen) to strike. Let the bell sing between strokes. ${n} stroke${n > 1 ? 's' : ''} left`,
    kaneTrop: (n) => `Too fast! The bell hadn’t finished singing… ${n} stroke${n > 1 ? 's' : ''} left`,
    kaneRate: ['The strokes tumbled over each other… The bell clanged like a saucepan.', 'Never mind: try again, and let it sing between strokes.'],
    kaneGagne: ['Gooon… Gooon… Gooon…', 'The sound rolls down the valley, passes under the cedars and comes back from the cliff. Even the mist seems to listen.'],
    kaneCompagnon: { kon: ['“I felt it to the tip of my tail…”'], pon: ['“Pon! My belly shook like my drum!”'], chapu: ['“Chapu! The cedars trembled!”'], gao: ['“Gao… A guardian’s sound. Deep and strong.”'], fuwa: ['“Fuwaaa… The sound went all the way down into the clouds.”'], saya: ['“The trees answered… Did you hear?”'] },
    kaneNuit: ['Night has fallen on the terrace. The monk said not to ring the bell at night: it brings the oni down from the mountain…', 'Ring it anyway?'],
    kaneNuitApres: ['The last echo fades. Silence…', 'Then, up in the mountain, an orange light appears between the cedars. It’s coming down.'],
    oni: ['“Ho ho ho! Who’s ringing the bell at this hour?”', '“Don’t be afraid, little traveller. Here in Kunisaki, we oni are Buddhas in disguise. They even call it the land where demons became Buddhas.”', '“Every winter, at the fire festival, we come down with our torches. And the people we tap on the head don’t catch a thing all year. Come closer…”'],
    oniTape: ['Pof! The oni tapped you very gently on the head with his torch. Sparks!', '“There! A whole year without a cold. Ho ho!”'],
    oniCompagnon: { kon: ['“A… kind oni? I didn’t believe it. He smells of wood fire and rice.”'], pon: ['“Pon! He scared me… and then he laughed. I like people who laugh.”'], chapu: ['“Chapu! Tap me too! Tap me too!”'], gao: ['“Gao… A night guardian, like me. I salute him.”'], fuwa: ['“Fuwa… He has the warmth of a hidden sun.”'], saya: ['“He’s as old as the mountain… The cedars know him.”'] },
    oniKoban: ['“And here, keep this. A gold koban, for the traveller who wasn’t afraid to ring.”', '“On the nights you come back, I’ll be warming myself at my brazier, by the bell tower. Come and say good evening!”'],
    oniApres: ['The oni warms his hands at his brazier. “Ho ho… Good evening, little traveller. The mountain is quiet tonight.”'],
    torche: ['A bamboo torch, half burnt, leaning against the bell tower’s post. It still smells of fire.', 'Who could have left it there? It’s far too big for a human hand…'],
    portail: ['A log gate closes a path that climbs into the forest: the Mine-michi (峯道), the hermits’ trail linking the peninsula’s temples.', 'A small sign: “Please close the gate behind you (wild boars).”'],
    torcheNuit: ['The old burnt torch against the post. In the dark, it looks like it’s waiting for someone.'],
    empreintes: ['Huge bare footprints in the mud of the path. Longer than two hands, with five big toes.', 'They come from the stream and head up toward the mountain…'],
    empreintesNuit: ['The big footprints in the mud. At night, they look even bigger.'],
    moine: (j, t) => ['Welcome to the Thirty Buddhas. There’s a Buddha here for every day of the month.', `Today is the ${j}${j % 10 === 1 && j !== 11 ? 'st' : j % 10 === 2 && j !== 12 ? 'nd' : j % 10 === 3 && j !== 13 ? 'rd' : 'th'}. The one watching over this day is ${t.nom} (${t.kanji}): ${t.dit}.`, 'Here is a candle. Light it before him, at the hall’s altar.'],
    bougieDonnee: ['You receive a white candle.', '“And above all… never ring the bell at night. They say it brings the oni down from the mountain.”'],
    moineSoir: ['In the evening I recite the sutras for the thirty Buddhas. Would you like to stay until nightfall?'],
    moineNon: ['As you wish. The Buddhas have all the time in the world.'],
    moineNuit: ['The sun has set behind the mountain. The mist is rising from the valley…', 'I’ll recite the sutras now. Remember: no bell at night. The mountain is waking.'],
    moineNuitApres: ['The sun has set behind the mountain. The mist is rising from the valley…', 'Your friend the oni must already be warming himself at his brazier. He likes you, you know.'],
    moineMatin: ['Would you like to wait for the dawn here, with me?'],
    moineReste: ['The night is long here. The Buddhas keep watch.'],
    moineAube: ['Day is breaking. The mist drifts slowly away between the cedars.'],
    hotokes: HOTOKES(DIT_EN),
    autel: ['Thirty little stone Buddhas on three tiers against the cliff: one for each day of the month. Before them, a row of candles.', 'The monk, in front of the hall, gives candles to visitors.'],
    autelNuit: ['In the dark, the thirty Buddhas seem to smile. The cliff drips above them.'],
    hotoke: (j, t) => [`You light the candle before Buddha number ${j}: ${t.nom} (${t.kanji}), ${t.dit}.`, 'The little flame dances on his stone face. It’s as if he were looking at you.', 'Come back another day: a different Buddha will be keeping watch.'],
    hotokeRevoir: (j, t) => [`Your candle is still burning before ${t.nom}, the Buddha of the ${j}${j % 10 === 1 && j !== 11 ? 'st' : j % 10 === 2 && j !== 12 ? 'nd' : j % 10 === 3 && j !== 13 ? 'rd' : 'th'}.`],
    hotokeCompagnon: { kon: ['“A flame for today… A Buddha for every day, how lovely.”'], pon: ['“Pon! Is there one for my birthday? I’ll come back that day!”'], chapu: ['“Chapu! Thirty stone friends! Shall I count them?”'], gao: ['“Gao… They each take their turn keeping watch. Like guardians.”'], fuwa: ['“Fuwa… His flame shines like a pearl.”'], saya: ['“The moss has grown on them for so long… They’re at home.”'] },
    echo: { appel: ['“Hellooo!”', '“Is anybody there?”', '“Good morning!”'], reponse: ['… hello… lo…', '… anybody… body…', '… welcome… traveller…'], fin: ['That wasn’t your echo this time…', 'People here say a mountain spirit, the yamabiko (山彦), repeats everything you shout at it. And sometimes, it answers.'] },
    echoNuit: { appel: ['“Hello?”', '“Is anybody there?”', '“Good night…”'], reponse: ['… hello… lo…', '… anybody… body…', '… sleep well… traveller…'], fin: ['The cliff wished you good night…', 'People here say a mountain spirit, the yamabiko (山彦), repeats everything you shout at it. And sometimes, it answers.'] },
    yamabikoCompagnon: { kon: ['“It answered you! The spirits here are polite.”'], pon: ['“Pon?! A talking mountain! Shall I ask it for cakes?”'], chapu: ['“Chapuuu! My turn! Hellooo!”'], gao: ['“Gao… I saw no one. I don’t like it. But it was kind.”'], fuwa: ['“Fuwa… The cliff has a gentle voice.”'], saya: ['“It’s a cousin of mine… A spirit of wood and stone.”'] },
    videaste: ['Hi! I’m filming the Nio guardians in the mist for my TikTok, @random_japan_place. Look!'],
    enfant: ['Did you see the giant footprints there, in the mud? They go from the stream all the way up the mountain!', 'Grandma says it’s a kind oni. I think he comes at night, when someone calls him…'],
    randonneur: ['We’re walking Kunisaki’s ridge trail, the 峯道ロングトレイル: over a hundred kilometres of paths between the peninsula’s temples.', 'The monks of old walked the whole thing, temple to temple. We’re taking our time!'],
    yamabushi: ['I am a yamabushi: I pray by walking in the mountains. Here, for over a thousand years, the mountain gods and the Buddhas have been worshipped together.', 'See the conch at my belt? We blow it to call to each other from one mountain to another. Maybe one day you’ll have one too…', 'Long ago, a hermit meditated under the waterfall by the pool for hours on end, the icy water on his head. They say that one day, the mountain opened its door to him… You have to hold on, under the water.'],
    yamabushiNuit: ['At night, the mountain speaks louder. Listen… you can hear the cedars creak.'],
    bucheron: ['My grandfather planted these cedars sixty years ago. That patch below, I cut it last year: we’re replanting young cedars.', 'Thanks to the clearing, you can see the valley from the lookout. On misty mornings, it’s a sea of clouds!'],
    photographe: ['Shh… I’m waiting for the sea of clouds to be perfect. I’ve been here three hours.', 'The best moment is when only the tips of the cedars stick out. Go and look from the edge of the lookout!'],
    torii: ['A grey, worn stone torii, with its sacred rope and white paper streamers. On its plaque: 三十仏, “the Thirty Buddhas”.', 'A (Shinto) torii guarded by (Buddhist) Nio: in Kunisaki, gods and Buddhas have always lived together.'],
    toriiNuit: ['In the night, the torii’s white papers move on their own, as if breathing.'],
    escalier: ['The great staircase: ninety-two mossy stone steps, straight up between the cedars.', 'At the very top, under the cliff, the hall of the Thirty Buddhas. Keep going!'],
    escalierNuit: ['The steps vanish into the mist between the lanterns. You can’t see the top.'],
    to: ['A Kunisaki stone stupa (国東塔): a base, a lotus, a round body, a little roof and a spire of rings.', 'You find them almost only on this peninsula. They kept sutras in them, or the memory of someone.'],
    shinboku: ['The great sacred cedar (神木): over five hundred years old, perhaps. A straw rope circles its trunk: a god lives in it.'],
    shinbokuNuit: ['The old cedar fades into the dark. Only its foot shows, with its white rope.'],
    cascade: ['A thin thread of water falls from the top of the cliff into a small pool. Fudō Myōō (不動明王), the guardian with the sword, watches it fall.', 'Flat stones cross the pool right under the fall. The yamabushi come to stand there under the icy water, even in winter: takigyō (滝行).'],
    cascadeNuit: ['You can’t see the waterfall anymore, only hear it. It never stops.'],
    yamabushiApres: ['You found the hermit’s cave?! Then the mountain has accepted you. Keep it to yourself, all right… it’s the mountain’s secret.'],
    takiFroid: 'Brrr… The icy water pounds on your head and shoulders!',
    takiTenir: 'Hold on, eyes closed… like the mountain hermits.',
    takiTot: { kon: ['“Brrr! The mountain hermits stayed under the water much longer…”'], pon: ['“Pon! It’s freezing! The yamabushi stay under there for ages… I prefer a hot bath.”'], chapu: ['“Chapu! Done already? The hermits stayed under the waterfall for ages!”'], gao: ['“Gao… A guardian doesn’t move. Neither did the hermits: they stayed under the water without moving.”'], fuwa: ['“Fuwa… Water likes those who stay. The hermits knew it.”'], saya: ['“The mountain didn’t have time to see you… The hermits stayed longer.”'] },
    takiFin: ['You stay under the icy water, motionless, eyes closed. The roar of the waterfall fills everything…', 'And suddenly, behind the water, the rock begins to shake!'],
    grotte: ['The slab of rock slid aside on its own. Behind the waterfall, there was a cave!', 'Deep inside, candles are burning… Yet there’s nobody there.'],
    grotteCompagnon: { kon: ['“The mountain opened its door to you… The yamabushi was right.”'], pon: ['“Pon?! A secret door! Maybe there are cakes inside?”'], chapu: ['“Chapuuu! A cave behind the water! Let’s go, let’s go!”'], gao: ['“Gao… Lit candles, and no one. I’ll go first.”'], fuwa: ['“Fuwa… The waterfall has kept this secret for so long.”'], saya: ['“It smells of wet stone and wax… Someone watches over this place.”'] },
    iwayaAutel: ['In a small lacquered wooden shrine with its doors open, a golden Buddha shines in the candlelight.', 'It’s a hibutsu (秘仏), a “hidden Buddha”: it’s almost never shown. Some are opened only once every thirty-three years.', 'The candles are new… Who lit them?'],
    iwayaAutelNuit: ['At night, the cave has only its candles. The golden Buddha seems to float in the dark.', 'It’s a hibutsu (秘仏), a “hidden Buddha”: it’s almost never shown. Some are opened only once every thirty-three years.'],
    kobanIwaya: ['On the small offering stand (三方), beside the shrine, an old gold coin…', 'It looks as if it was waiting for you.'],
    iwayaErmite: ['A worn straw mat, a little lectern with an open sutra, a conch, a pilgrim’s staff against the wall.', 'A hermit lived here. Every day he went to meditate under the waterfall, winter and summer alike.'],
    iwayaBol: ['Plink… plink… Water drips from the vault into a stone bowl.', 'Drop by drop, over centuries, it has hollowed out the stone. The hermit drank the mountain’s water from it.'],
    iwayaBouddhas: ['On a ledge of the wall, a row of small Buddhas carved in the rock, polished by hands and by time.', 'The hermit carved them one by one, by candlelight.'],
    magaibutsu: ['Buddhas carved right into the cliff (磨崖仏), in niches. Time and water have almost worn them away.', 'The Kunisaki Peninsula has hundreds of them, hidden in the forests and rocks.'],
    magaibutsuNuit: ['In the dark, the cliff Buddhas are just two soft shadows.'],
    masque: ['An old red oni mask with two horns, hanging on a post of the hall.', 'It’s a mask from the fire festival (修正鬼会): the oni of Kunisaki are kind, they’re Buddhas in disguise.'],
    masqueNuit: ['The oni mask gleams a little in the candlelight. It looks like it’s smiling…'],
    jizo: ['You put your hands together before the little jizō with his red bib. He protects children and travellers.'],
    jizoNuit: ['You put your hands together before the little jizō. In the dark, his red bib is the only colour.'],
    kaki: ['An old persimmon tree full of orange fruit. The grandmother will dry them under the eaves for winter.'],
    kakiNuit: ['The persimmon tree sleeps. Its fruit look like little unlit lanterns.'],
    'panneau-nio': ['“仁王像 — the Nio guardians”', 'The Kunisaki Peninsula has more stone Nio guardians than the rest of Japan: over 140 in the town of Bungo-Takada alone. The oldest dated ones (1478) guard Iwato-ji temple, a kilometre from here. People offer them big straw sandals for strong legs.'],
    'panneau-yuisho': ['“三十仏 由緒 — the Thirty Buddhas”', 'Each day of the month has its protecting Buddha: the first, Jōkō; the fifteenth, Amida; the thirtieth, Shaka. A very old list, already in a book from 1690. The thirty have kept watch here, under the cliff, for centuries. People from the valley come to light a candle for the one of their day.'],
    'panneau-sentier': ['“峯道ロングトレイル — the Kunisaki ridge trail”', 'Over a hundred kilometres of mountain paths, temple to temple, in the footsteps of the monks who prayed as they walked (六郷満山). Next temple: Iwato-ji, a kilometre to the north-east.'],
    chatFerme: ['The farm cat sleeps curled up in the sun, against the veranda.'],
    chatFermeNuit: ['The farm cat is awake. Its eyes shine in the dark.'],
    chatCompagnon: { kon: ['“A farm cat… It knows all the valley’s secrets.”'], pon: ['“Pon! He sleeps like me after a good meal.”'], chapu: ['“Chapu! Wake up, shall we play? No? Fine.”'], gao: ['“Gao. A little farm guardian.”'], fuwa: ['“Fuwa… He purrs like a cloud.”'], saya: ['“He smells of straw and sunshine…”'] },
    papillon: ['A butterfly lands on a flower by the farm, then flutters off toward the forest.'],
    milan: ['A kite circles above the valley, crying “piiiyoro”.'],
    nuitCompagnon: { kon: ['“Do you hear that? Something is walking up there, in the mountain… And it smells of burnt wood.”'], pon: ['“Pon… There’s somebody very big in the mountain. I can hear it breathing.”'], chapu: ['“Chapu… It smells of wood fire up there! Are we roasting potatoes?”'], gao: ['“Gao! Something is moving in the mountain. I’m standing guard.”'], fuwa: ['“Fuwa… The mountain is waiting to be called. The bell, maybe?”'], saya: ['“The cedars are whispering… A friend of theirs will come down, if someone calls him.”'] },
  },
  ja: {
    noms: { obaa: 'おばあさん', enfant: 'まごむすめ', randonneur: 'ハイカー', videaste: '@random_japan_place', yamabushi: '山伏', moine: 'おぼうさん', bucheron: 'きこり', photographe: 'カメラマン', oni: 'おに', yamabiko: 'やまびこ' },
    tampons: {
      vue: ['雲海', 'テラスの　東の　はしの　展望台。きりの　下の　谷'],
      waraji: ['仁王の　わらじ', '下で　おばあさんの　わらじを　もらい、仁王さまの　わらじかけに　かける'],
      kane: ['鐘', 'テラスの　鐘楼。鐘が　なりおわるのを　まって、三回　つく'],
      hotoke: ['今日の　仏さま', 'がけの　下の　お堂。おぼうさんの　ろうそくを　今日の　仏さまに'],
      yamabiko: ['山びこ', 'テラスの　「やまびこ」の　ふだの　そばで、がけに　むかって　三回　よぶ。だれが　こたえるか　きく'],
    },
    vue: ['足の　下の　谷が　きえた！　白い　くもの　うみ（雲海）が　山まで　ひろがって、杉の　さきだけが　しまのように　出ている。', '国東半島は　まるくて、谷が　ぜんぶ　おなじ　山から　車の　スポークのように　のびている。きりの　朝は　くもで　いっぱいに　なる。'],
    vueNuit: ['よるの　谷は　かげの　みずうみ。ずっと　下に　あかりが　一つ：おばあさんの　まどだ。'],
    vueCompagnon: { kon: ['「くもの　上を　あるいてる……　およげそう。」'], pon: ['「ポン！　わたの　うみ！　とびこみたい……　けど、しない。」'], chapu: ['「チャプ！　みずだったら　すぐ　とびこむのに！」'], gao: ['「ガオ……　谷を　まもる。見えなくても。」'], fuwa: ['「ふわぁ……　くもは　ゆめを　みてる　みず。よく　しってるよ。」'], saya: ['「杉が　いきを　してる。きりは　朝の　いきだよ。」'] },
    obaa: ['おや、たびの　人！　こんにちは。三十仏を　見に　のぼるのかい？', 'わたしは　わらじを　あんでるのさ。大きいのは　かいだんの　上の　仁王さまの　ぶん。', 'じょうぶな　足に　なるように、仁王さまに　おそなえするんだよ。かいだんが　たくさん　あるからね！　ほら、これを　わらじかけに　かけておいで。'],
    warajiDonne: ['大きな　わらじを　もらった。', '仁王さまは　大きな　かいだんの　下に　いるよ。右の　口を　あけてる　ほうが「阿」、左の　口を　とじてる　ほうが「吽」。はじまりと　おわりだよ。'],
    warajiDeja: ['もう　わらじを　もってるね！　仁王さまが　まってるよ。'],
    obaaApres: ['仁王さまに　わらじを　かけたかい？　それなら　足は　だいじょうぶ！', 'わたしが　小さい　ころ、火の　まつりで　おにに　たいまつで　あたまを　たたかれたの。その　年は　かぜ　ひとつ　ひかなかったよ！'],
    obaaNuit: ['もう　おそいね……　ここでは　よるの　おにを　こわがらないんだよ。国東の　おには　仏さまの　へんしんなんだ。', 'ふゆの　火の　まつりに　たいまつを　もって　山から　おりてきて、みんなの　あたまを　たたいて　しあわせを　くれるのさ。小さい　子は　なくけど、大人は　わらうよ！'],
    nio: ['二人の　仁王さま。むかし　石から　ほられて、こけと　ちいに　おおわれている。', '右の　仁王さまは　口を　あけて「阿」、さいしょの　おと。左は　口を　とじて「吽」、さいごの　おと。あわせて「阿吽」：すべての　はじまりと　おわり。', '仏さまの　まもりがみなのに、じんじゃの　鳥居を　まもっている。国東では　かみさまと　仏さまが　いつも　いっしょなんだ。'],
    nioNuit: ['よるの　仁王さまは　もっと　こわい　かお。いきを　しているみたい。'],
    waraji: ['わらじを　わらじかけに　かけた。ほかの　わらじの　となりに。', '仁王さまも　これで　あるける。きみの　足も　じょうぶに　なった！'],
    warajiCompagnon: { kon: ['「大男の　わらじ……　ぴったりですね。」'], pon: ['「ポン！　あんな　足なら　はしるの　はやそう！」'], chapu: ['「チャプ！　ぼくは　いつも　はだしだよ！」'], gao: ['「ガオ！　くつの　いい　まもりがみは　しあわせ。」'], fuwa: ['「ふわ……　うごかないけど、とおくまで　いけるね。」'], saya: ['「わらの　はたけの　におい……　よろこぶよ。」'] },
    kane: ['大きな　青銅の　鐘（梵鐘）。つるした　木の　しゅもくを　つなで　ひいて　つく。', 'おぼうさんは　いう：鐘を　うたわせなさい。ついたら、おとが　きえかけるまで　まってから　つぎを　つく。', '三回　つく？'],
    kaneEncore: ['もう　三回　つく？'],
    kaneAide: (n) => `Aボタン（または　画面を　タップ）で　つく。つぎを　つく　まえに　鐘を　うたわせて。のこり　${n}回`,
    kaneTrop: (n) => `はやすぎ！　鐘が　まだ　うたっていたよ……　のこり　${n}回`,
    kaneRate: ['おとが　ぶつかりあって……　おなべみたいな　おとに　なった。', 'だいじょうぶ、もう　いちど。ついたら　鐘を　うたわせて　あげて。'],
    kaneGagne: ['ゴォーン……　ゴォーン……　ゴォーン……', 'おとが　谷を　ころがって、杉の　下を　とおり、がけから　かえってくる。きりも　きいているみたい。'],
    kaneCompagnon: { kon: ['「しっぽの　さきまで　ひびきました……」'], pon: ['「ポン！　おなかが　たいこみたいに　ふるえた！」'], chapu: ['「チャプ！　杉が　ふるえた！」'], gao: ['「ガオ……　まもりがみの　おと。ひくくて　つよい。」'], fuwa: ['「ふわぁ……　おとが　くもの　そこまで　いったよ。」'], saya: ['「木が　こたえたよ……　きこえた？」'] },
    kaneNuit: ['テラスに　よるが　きた。おぼうさんは　よるに　鐘を　ついては　いけないと　言っていた。山から　おにが　おりてくるって……', 'それでも　つく？'],
    kaneNuitApres: ['さいごの　ひびきが　きえた。しーん……', 'すると、山の　上の　杉の　あいだに　オレンジの　ひかりが　ついた。おりてくる。'],
    oni: ['「ホッホッホ！　こんな　じかんに　鐘を　つくのは　だれだ？」', '「こわがらなくて　いいぞ、小さな　たびびと。国東の　おには　仏さまの　へんしんなのさ。『鬼が　仏に　なった　里』と　いわれている。」', '「まいとし　ふゆ、火の　まつりに　たいまつを　もって　おりてくる。あたまを　たたかれた　人は　一年じゅう　びょうきを　しない。ちかくに　おいで……」'],
    oniTape: ['ポン！　おにが　たいまつで　そっと　あたまを　たたいた。ひのこが　とんだ！', '「これで　一年　かぜ　しらず。ホッホッ！」'],
    oniCompagnon: { kon: ['「やさしい……　おに？　たき火と　おこめの　においが　します。」'], pon: ['「ポン！　こわかった……　でも　わらった。わらう　人は　すきだよ。」'], chapu: ['「チャプ！　ぼくも　たたいて！　たたいて！」'], gao: ['「ガオ……　よるの　まもりがみ。あいさつする。」'], fuwa: ['「ふわ……　かくれた　お日さまみたいに　あったかい。」'], saya: ['「山と　おなじくらい　としよりだね……　杉が　しってるよ。」'] },
    oniKoban: ['「そして　これを。鐘を　こわがらずに　ついた　たびびとに、金の　小判だ。」', '「また　よるに　きたら、鐘楼の　そばで　火ばちに　あたっているよ。こんばんはを　いいに　おいで！」'],
    oniApres: ['おにが　火ばちで　手を　あたためている。「ホッホッ……　こんばんは、小さな　たびびと。こんやの　山は　しずかだよ。」'],
    torche: ['はんぶん　もえた　竹の　たいまつが、鐘楼の　はしらに　たてかけてある。まだ　火の　におい。', 'だれが　おいていったんだろう？　人の　手には　大きすぎる……'],
    portail: ['まるたの　とびらの　むこうに、森へ　のぼる　山道。峯道（みねみち）だ。半島の　お寺を　むすぶ、行者の　道。', 'ちいさな　ふだ：「いのししが　でます。かならず　しめてください」'],
    torcheNuit: ['もえた　たいまつ。くらやみで　だれかを　まっているみたい。'],
    empreintes: ['みちの　どろに　大きな　はだしの　あしあと。手　二つより　ながくて、ゆびが　五本。', '小川から　山の　ほうへ　のぼっていく……'],
    empreintesNuit: ['どろの　中の　大きな　あしあと。よるは　もっと　大きく　見える。'],
    moine: (j, t) => ['三十仏へ　ようこそ。ここには　月の　まいにちに　仏さまが　いるのです。', `今日は　${j}日。この　日を　まもるのは　${t.kanji}（${t.nom}）：${t.dit}。`, 'この　ろうそくを　どうぞ。お堂の　さいだんで　その　仏さまの　まえに　ともしてください。'],
    bougieDonnee: ['白い　ろうそくを　もらった。', '「それから……　よるには　ぜったい　鐘を　つかないように。山から　おにが　おりてくると　いいますから。」'],
    moineSoir: ['夕がたは　三十の　仏さまに　おきょうを　よみます。よるまで　いますか？'],
    moineNon: ['どうぞ　ごゆっくり。仏さまには　時間が　たっぷり　あります。'],
    moineNuit: ['日が　山の　うしろに　しずみました。谷から　きりが　のぼってくる……', 'おきょうを　よみましょう。おぼえておいて：よるは　鐘を　つかない。山が　めを　さますから。'],
    moineNuitApres: ['日が　山の　うしろに　しずみました。谷から　きりが　のぼってくる……', 'あなたの　ともだちの　おには、もう　火ばちに　あたっているでしょう。あなたが　すきなんですよ。'],
    moineMatin: ['ここで　いっしょに　朝を　まちますか？'],
    moineReste: ['ここの　よるは　ながい。仏さまが　みまもっています。'],
    moineAube: ['夜が　あけます。きりが　杉の　あいだを　ゆっくり　はれていく。'],
    hotokes: HOTOKES(DIT_JA),
    autel: ['がけに　そって　三だんに　ならぶ　三十の　小さな　石の　仏さま。月の　まいにちに　一人ずつ。まえに　ろうそくが　ならんでいる。', 'お堂の　まえの　おぼうさんが　ろうそくを　くれる。'],
    autelNuit: ['くらやみの　中で　三十の　仏さまが　ほほえんでいるみたい。上の　がけから　しずくが　おちる。'],
    hotoke: (j, t) => [`${j}ばんめの　仏さま、${t.kanji}（${t.nom}）の　まえに　ろうそくを　ともした。${t.dit}。`, '小さな　ほのおが　石の　かおで　おどる。こっちを　見ているみたい。', 'べつの　日に　きてごらん。ちがう　仏さまが　まもっているよ。'],
    hotokeRevoir: (j, t) => [`ろうそくは　まだ　${t.kanji}（${j}日の　仏さま）の　まえで　もえている。`],
    hotokeCompagnon: { kon: ['「今日の　ための　ひ……　まいにちに　仏さま、すてきですね。」'], pon: ['「ポン！　ぼくの　たんじょうびの　仏さまも　いる？　その　日に　また　くる！」'], chapu: ['「チャプ！　石の　ともだちが　三十人！　かぞえようか？」'], gao: ['「ガオ……　じゅんばんに　みまもる。まもりがみみたい。」'], fuwa: ['「ふわ……　ほのおが　しんじゅみたいに　ひかる。」'], saya: ['「ずっと　まえから　こけが　はえてる……　ここが　おうちなんだね。」'] },
    echo: { appel: ['「おーーい！」', '「だれか　いますかー？」', '「こんにちはー！」'], reponse: ['……おーい……おーい……', '……だれか……れか……', '……ようこそ……たびびと……'], fin: ['こんどは　じぶんの　こえじゃ　なかった……', 'ここの　人は　いう：山の　せい「やまびこ（山彦）」が、さけんだ　ことを　くりかえす。そして　ときどき、へんじを　する。'] },
    echoNuit: { appel: ['「おーい？」', '「だれか　いますかー？」', '「おやすみー……」'], reponse: ['……おーい……おーい……', '……だれか……れか……', '……おやすみ……たびびと……'], fin: ['がけが　おやすみを　いってくれた……', 'ここの　人は　いう：山の　せい「やまびこ（山彦）」が、さけんだ　ことを　くりかえす。そして　ときどき、へんじを　する。'] },
    yamabikoCompagnon: { kon: ['「こたえてくれた！　ここの　せいは　れいぎただしい。」'], pon: ['「ポン！？　しゃべる　山！　おかしを　たのもうか？」'], chapu: ['「チャプー！　ぼくも！　おーーい！」'], gao: ['「ガオ……　だれも　見えなかった。でも　やさしかった。」'], fuwa: ['「ふわ……　がけは　やさしい　こえだね。」'], saya: ['「ぼくの　いとこだよ……　木と　石の　せい。」'] },
    videaste: ['やあ！　TikTokの　@random_japan_placeで、きりの　中の　仁王さまを　とってるんだ。見て！'],
    enfant: ['どろの　中の　大きな　あしあと、見た？　小川から　山まで　つづいてるの！', 'おばあちゃんは　やさしい　おにだって。だれかが　よぶと、よるに　くると　おもうんだ……'],
    randonneur: ['国東の　峯道ロングトレイルを　あるいてるんだ。半島の　お寺を　つなぐ　百キロいじょうの　山みち。', 'むかしの　おぼうさんは　ぜんぶ　あるいたんだって。ぼくらは　のんびりね！'],
    yamabushi: ['わたしは　山伏。山を　あるきながら　いのる。ここでは　千年いじょう　まえから、山の　かみさまと　仏さまを　いっしょに　まつってきた。', 'こしの　ほらがいが　見えるかな？　山から　山へ　よびあうのに　ふくんだ。いつか　きみにも……', 'むかし、ひとりの　行者が　いけの　たきに　なん時間も　うたれて、目を　とじていた。ある日、山が　とびらを　ひらいたと　いう……　水の　下で、がまんが　だいじだ。'],
    yamabushiNuit: ['よるの　山は　こえが　大きい。ほら……　杉が　きしむ　おと。'],
    bucheron: ['この　杉は　六十年　まえに　じいさんが　うえたんだ。下の　ところは　きょねん　きって、わかい　杉を　うえなおしている。', 'きったから　展望台から　谷が　見えるんだ。きりの　朝は　雲海だよ！'],
    photographe: ['しーっ……　雲海が　かんぺきに　なるのを　まってるの。もう　三時間。', 'いちばん　いいのは　杉の　さきだけが　出る　ときよ。展望台の　はしで　見てごらん！'],
    torii: ['ふるい　石の　鳥居。しめなわと　白い　しでが　さがっている。がくには「三十仏」。', 'じんじゃの　鳥居を　仏さまの　仁王さまが　まもる。国東では　かみさまと　仏さまが　いつも　いっしょ。'],
    toriiNuit: ['よるの　鳥居の　白い　しでが、いきを　するように　ゆれている。'],
    escalier: ['大きな　かいだん。こけむした　九十二だんの　石だんが、杉の　あいだを　まっすぐ　のぼる。', 'いちばん　上の　がけの　下に、三十仏の　お堂。がんばって！'],
    escalierNuit: ['石だんが　とうろうの　あいだの　きりに　きえていく。上が　見えない。'],
    to: ['国東塔：だい、はすの　花、まるい　からだ、小さな　やね、わの　とがった　さき。', 'この　半島で　しか　ほとんど　見られない。おきょうや、人の　おもいでを　しまっていた。'],
    shinboku: ['大きな　しんぼく（神木）。五百年いじょう　かもしれない。しめなわが　まいてある：かみさまが　すんでいる。'],
    shinbokuNuit: ['ふるい　杉は　やみに　きえて、根もとと　白い　しめなわだけ　見える。'],
    cascade: ['がけの　上から　ほそい　水が　小さな　いけに　おちる。けんを　もった　不動明王が　見まもっている。', 'たきの　下まで　ひらたい　いしが　つづいている。山伏は　ふゆでも　ここで　つめたい　水に　うたれる。滝行と　いうんだ。'],
    cascadeNuit: ['たきは　もう　見えない。おとだけ。ずっと　とまらない。'],
    yamabushiApres: ['行者の　岩屋を　見つけたのか？！　山に　みとめられたな。だれにも　言うなよ……　山の　ひみつだ。'],
    takiFroid: 'ぶるる……　つめたい　水が　あたまと　かたに　おちてくる！',
    takiTenir: 'がまん、がまん……　目を　とじて。山の　行者のように……',
    takiTot: { kon: ['「ぶるる！　山の　行者は、もっと　ずっと　長く　水に　うたれていたんですよ……」'], pon: ['「ポン！　つめたい！　山伏は　ずっと　うたれるんだって……　ぼくは　おふろが　いいな。」'], chapu: ['「チャプ！　もう　おしまい？　行者は　ずっと　たきの　下に　いたんだよ！」'], gao: ['「ガオ……　まもりびとは　うごかない。行者も　うごかずに　水に　うたれていた。」'], fuwa: ['「フワ……　水は　とどまる　ものが　すき。行者は　それを　しっていたの。」'], saya: ['「山は　まだ　あなたを　見ていない……　行者は　もっと　長く　いたのよ。」'] },
    takiFin: ['つめたい　水に　うたれながら、目を　とじて　じっと　する。たきの　おとが　ぜんぶを　つつむ……', 'とつぜん、水の　うしろで　いわが　ゆれはじめた！'],
    grotte: ['いわの　いたが　ひとりでに　うごいた。たきの　うしろに、ほらあなが　あった！', 'おくで　ろうそくが　ともっている……　でも、だれも　いない。'],
    grotteCompagnon: { kon: ['「山が　あなたに　とびらを　ひらいた……　山伏の　はなしは　ほんとうだった。」'], pon: ['「ポン？！　ひみつの　とびら！　中に　おかし　あるかな？」'], chapu: ['「チャプー！　水の　うしろに　ほらあな！　いこう、いこう！」'], gao: ['「ガオ……　ろうそくが　ついていて、だれも　いない。ぼくが　さきに　いく。」'], fuwa: ['「フワ……　たきは　ずっと　この　ひみつを　まもっていたのね。」'], saya: ['「ぬれた　いわと　ろうの　におい……　だれかが　ここを　まもっている。」'] },
    iwayaAutel: ['とびらの　ひらいた　ぬりの　小さな　ずしの　中で、金の　仏さまが　ろうそくの　あかりに　かがやく。', 'これは　秘仏　――「かくされた　仏さま」。ほとんど　見せない。三十三年に　いちどしか　ひらかない　ものも　ある。', 'ろうそくは　あたらしい……　だれが　つけたのだろう？'],
    iwayaAutelNuit: ['よるの　ほらあなには　ろうそくの　あかりだけ。金の　仏さまが　やみに　うかんで　見える。', 'これは　秘仏　――「かくされた　仏さま」。ほとんど　見せない。三十三年に　いちどしか　ひらかない　ものも　ある。'],
    kobanIwaya: ['ずしの　よこ、小さな　三方の　上に、ふるい　金の　おかね……', 'まるで　あなたを　まっていたみたい。'],
    iwayaErmite: ['すりきれた　わらの　ござ、おきょうを　ひらいた　小さな　つくえ、ほらがい、かべに　たてかけた　つえ。', '行者が　ここで　くらしていた。まいにち、なつも　ふゆも、たきに　うたれに　いったのだ。'],
    iwayaBol: ['ぽちゃん……　ぽちゃん……　天井から　しずくが　いしの　うつわに　おちる。', 'なん百年も、ひとしずくずつ、いしを　ほってきた。行者は　ここで　山の　水を　のんだ。'],
    iwayaBouddhas: ['かべの　でっぱりに、いわを　ほった　小さな　仏さまが　ならぶ。手と　ときに　みがかれて　つるつる。', '行者が　ろうそくの　あかりで　ひとつずつ　ほったのだ。'],
    magaibutsu: ['がけに　じかに　ほられた　仏さま（磨崖仏）。時間と　水で　ほとんど　きえかけている。', '国東半島には　森や　岩に　かくれた　磨崖仏が　なんびゃくも　ある。'],
    magaibutsuNuit: ['くらやみの　がけの　仏さまは、二つの　やさしい　かげ。'],
    masque: ['お堂の　はしらに　かかった　ふるい　赤い　おにの　めん。つのが　二本。', '火の　まつり（修正鬼会）の　めん。国東の　おには　やさしい　仏さまの　へんしん。'],
    masqueNuit: ['おにの　めんが　ろうそくの　あかりで　すこし　ひかる。わらってるみたい……'],
    jizo: ['赤い　よだれかけの　小さな　おじぞうさまに　手を　あわせた。こどもと　たびびとを　まもってくれる。'],
    jizoNuit: ['小さな　おじぞうさまに　手を　あわせた。くらやみで　赤い　よだれかけだけが　いろ。'],
    kaki: ['オレンジの　みが　いっぱいの　ふるい　かきの　木。おばあさんが　ふゆの　ために　のきしたで　ほすんだ。'],
    kakiNuit: ['かきの　木が　ねむっている。みは　きえた　小さな　ちょうちんみたい。'],
    'panneau-nio': ['「仁王像」', '国東半島には　日本の　ほかの　どこよりも　石の　仁王さまが　多い。豊後高田市だけで　百四十いじょう。年が　かかれた　いちばん　ふるい　仁王さま（1478年）は、ここから　一キロの　岩戸寺に　いる。じょうぶな　足の　ために　大きな　わらじを　おそなえする。'],
    'panneau-yuisho': ['「三十仏　由緒」', '月の　まいにちに　まもりの　仏さまが　いる。一日は　定光仏、十五日は　阿弥陀仏、三十日は　釈迦如来。1690年の　本にも　ある　ふるい　ならび。三十の　仏さまは　なんびゃく年も　がけの　下で　みまもってきた。谷の　人は　じぶんの　日の　仏さまに　ろうそくを　ともしに　くる。'],
    'panneau-sentier': ['「峯道ロングトレイル」', 'お寺から　お寺へ、あるきながら　いのった　おぼうさんの　あしあとを　たどる　百キロいじょうの　山みち（六郷満山）。つぎの　お寺：北東に　一キロの　岩戸寺。'],
    chatFerme: ['のうかの　ねこが、えんがわの　そばで　まるく　なって　ひなたぼっこ。'],
    chatFermeNuit: ['のうかの　ねこが　おきた。くらやみで　めが　ひかる。'],
    chatCompagnon: { kon: ['「のうかの　ねこ……　谷の　ひみつを　ぜんぶ　しっていますね。」'], pon: ['「ポン！　ごはんの　あとの　ぼくみたいに　ねてる。」'], chapu: ['「チャプ！　おきて、あそぼう？　だめ？　そっか。」'], gao: ['「ガオ。小さな　のうかの　まもりがみ。」'], fuwa: ['「ふわ……　くもみたいに　ゴロゴロ　いう。」'], saya: ['「わらと　お日さまの　におい……」'] },
    papillon: ['ちょうちょが　のうかの　花に　とまって、また　森へ　とんでいった。'],
    milan: ['トビが「ピーヒョロ」と　ないて、谷の　上を　まわっている。'],
    nuitCompagnon: { kon: ['「きこえますか？　山の　上で　なにかが　あるいている……　それに　こげた　木の　におい。」'], pon: ['「ポン……　山に　すごく　大きい　だれかが　いる。いきが　きこえる。」'], chapu: ['「チャプ……　上で　たき火の　におい！　おいもを　やいてる？」'], gao: ['「ガオ！　山で　なにかが　うごいてる。みはりを　する。」'], fuwa: ['「ふわ……　山が　よばれるのを　まってる。鐘かな？」'], saya: ['「杉が　ささやいてる……　よべば、ともだちが　おりてくるって。」'] },
  },
};
