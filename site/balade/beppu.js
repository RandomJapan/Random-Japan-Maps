// ================================================================
//  Les Enfers de Beppu (別府地獄めぐり, Beppu Jigoku Meguri), dans la préfecture d'Ōita, au nord-est de Kyūshū (2026-10-27 :
//  le septième lieu de la balade, choisi par le propriétaire parmi quatre, « t'inspirer de ce que tu peux trouver sur internet
//  pour recréer le lieu », d'après son TikTok et des recherches). Beppu est la ville des sources chaudes : la vapeur sort des
//  rues, des toits, des caniveaux (湯けむり, « les fumées des bains »). Dans le quartier de Kannawa (鉄輪), des sources trop
//  chaudes pour s'y baigner, qu'on vient regarder : les « enfers » (地獄). Le bleu de cobalt de l'enfer de la mer (海地獄, 98 °C ;
//  on y cuit des œufs dans un panier), la boue grise qui fait des bulles comme des crânes de moines (鬼石坊主地獄), l'eau
//  blanche comme du lait de l'étang blanc (白池地獄), le chaudron et son grand démon rouge (かまど地獄 : six bassins, de
//  « 一丁目 » à « 六丁目 »), et, plus haut, à Shibaseki (柴石), l'enfer du lac de sang (血の池地獄, le plus ancien : un « bain
//  rouge » dans une chronique du VIIIe siècle) et l'enfer de la tornade (龍巻地獄), un geyser sous un toit de pierre. Dans la
//  rue, les fours à vapeur (地獄蒸し) où l'on cuit œufs et patates, les bains de pieds, le bain de vapeur (鉄輪むし湯) fondé,
//  dit-on, par le moine Ippen (一遍上人) en 1276 : il calma les sources bouillantes en y jetant des pierres où il avait écrit
//  des prières. Les lieux sont rapprochés : les deux enfers de Shibaseki, à trois kilomètres, sont au bout d'un sentier.
//  Son secret : les pierres d'Ippen. Trois pierres écrites (南無阿弥陀仏), cachées un peu partout ; chacune jetée dans un enfer
//  différent (le propriétaire : « il faut que les 3 pierres soit caché un peu partout dans la balade et que chacune de ces
//  pierres doit être lancé dans un enfer différent »). Une lueur et une étoile au-dessus de chacune, de jour comme de nuit ;
//  à la deuxième ramassée, on dit où est la dernière ; la légende (le panneau de la statue) se lit si l'on veut (2026-10-27 :
//  « le troisième, je sais pas où c'est… c'est pas très grave si la personne elle le lit pas »).
//  Sa récompense : les cornes d'oni (tenues.js).
//  Repère : x vers l'est, z vers le sud, y vers le haut, en mètres ; la ville descend vers l'est, vers la baie de Beppu ;
//  Shibaseki, au nord-ouest, 5 m plus haut. ctx : { THREE, atelier, P (palette), peinture, perso, maillage }.
// ================================================================
import { creerMonde, interactionsBancs, lisse, hasard, bruitDoux, surLaLigne } from './monde.js';
import { panneau, PAPIER_PANNEAU } from './decor.js';
import { MATIERES as M } from './textures.js';
import { secretTrouve, indiceVu } from './tresors.js';

const PI = Math.PI;

// ---------------------------------------------------------------- Le plan
/** Le sol de la rue de Kannawa : il descend doucement vers l'est (la baie). */
const solRue = (x) => 1.0 - 0.03 * x;
// la rue de Kannawa (いでゆ坂, la « pente des sources ») : de l'arrêt de bus, en bas à l'est, vers l'ouest et les enfers
const RUE = [[78, 3.2], [66, 2.6], [54, 1.9], [42, 1.2], [30, 0.6], [18, 0.2], [6, -0.3], [-6, -0.7], [-18, -1.1], [-30, -1.5], [-42, -1.9], [-54, -2.4], [-60, -2.8]];
// les terrasses des enfers (le sol plat de chaque enclos, à sa hauteur h) : [x, z] le milieu, lx, lz les demi-côtés, bord
// (où le sol rejoint la pente autour)
const TERRASSES = {
  umi: { x: -31, z: -29.5, lx: 23, lz: 21.5, h: 2.2, bord: 4 },
  bozu: { x: 15, z: -30, lx: 13, lz: 16, h: 0.75, bord: 3.5 },
  kamado: { x: 7, z: 22.5, lx: 13, lz: 13.5, h: 0.6, bord: 3.5 },
  shiraike: { x: -32, z: 22, lx: 14, lz: 13, h: 2.0, bord: 3.5 },
  // Shibaseki : l'enfer du lac de sang et celui de la tornade, sur le plateau
  shibaseki: { x: -55, z: -80, lx: 29, lz: 15, h: 7.0, bord: 6 },
};
const T = TERRASSES;
// les bassins des enfers : [x, z] le milieu, rx, rz les demi-axes, ry le tour, eau (sous la terrasse), creux (la profondeur
// au milieu), sorte (eau, boue, nenuphars), couleurs (bord, milieu), vapeur (la force de ses fumées), enfer (celui où l'on
// peut jeter une pierre d'Ippen)
const BASSINS = [
  // l'enfer de la mer (海地獄) : le grand bassin bleu de cobalt
  { id: 'umi', enfer: 'umi', x: -34, z: -29.5, rx: 10.5, rz: 7.2, ry: 0.15, eau: T.umi.h - 0.55, creux: 2.2, sorte: 'eau', bord: '#7fd8e0', milieu: '#1f8fb4', vapeur: 1 },
  // l'étang rouge de l'enfer de la mer (赤池), près de l'entrée
  { id: 'akaike', x: -11.0, z: -14.4, rx: 3.2, rz: 2.5, ry: -0.3, eau: T.umi.h - 0.4, creux: 1, sorte: 'eau', bord: '#d8875a', milieu: '#a8452e', vapeur: 0.5 },
  // l'étang des nénuphars géants (オオオニバス), tiède
  { id: 'hasu', x: -18.6, z: -42.4, rx: 5.6, rz: 3.0, ry: 0.1, eau: T.umi.h - 0.35, creux: 0.9, sorte: 'nenuphars', bord: '#7c9a6a', milieu: '#3f5f45', vapeur: 0 },
  // l'enfer des crânes de moines (鬼石坊主地獄) : la boue grise qui bout
  { id: 'bozu1', enfer: 'bozu', x: 8.2, z: -26.0, rx: 3.8, rz: 3.0, ry: 0.2, eau: T.bozu.h - 0.4, creux: 1, sorte: 'boue', bord: '#a39d93', milieu: '#7e7a72', vapeur: 0.5 },
  { id: 'bozu2', enfer: 'bozu', x: 21.5, z: -27.5, rx: 4.0, rz: 3.4, ry: -0.4, eau: T.bozu.h - 0.4, creux: 1, sorte: 'boue', bord: '#9d988e', milieu: '#77736b', vapeur: 0.5 },
  { id: 'bozu3', enfer: 'bozu', x: 10.6, z: -38.2, rx: 4.2, rz: 3.0, ry: 0.4, eau: T.bozu.h - 0.4, creux: 1, sorte: 'boue', bord: '#a7a196', milieu: '#827d74', vapeur: 0.4 },
  // l'enfer du chaudron (かまど地獄) : ses bassins, de « 一丁目 » à « 六丁目 », dans le rond de l'allée (le deuxième, c'est le
  // démon sur son chaudron)
  { id: 'k1', enfer: 'kamado', x: 1.6, z: 18.6, rx: 2.0, rz: 1.8, ry: 0.3, eau: T.kamado.h - 0.35, creux: 0.8, sorte: 'boue', bord: '#b78a68', milieu: '#8d5e44', vapeur: 0.8, choume: 1 },
  { id: 'k3', enfer: 'kamado', x: 12.4, z: 19.0, rx: 2.6, rz: 2.0, ry: -0.2, eau: T.kamado.h - 0.35, creux: 1.2, sorte: 'eau', bord: '#7fd8e6', milieu: '#2a86c0', vapeur: 1, choume: 3 },
  { id: 'k4', enfer: 'kamado', x: 12.6, z: 27.4, rx: 2.4, rz: 2.0, ry: 0.4, eau: T.kamado.h - 0.35, creux: 1, sorte: 'eau', bord: '#bfe6ea', milieu: '#7cc4d4', vapeur: 0.7, choume: 4 },
  { id: 'k5', enfer: 'kamado', x: 6.6, z: 23.2, rx: 2.2, rz: 1.8, ry: 0.1, eau: T.kamado.h - 0.35, creux: 1, sorte: 'eau', bord: '#8fe0d0', milieu: '#3aa8a0', vapeur: 0.7, choume: 5 },
  { id: 'k6', enfer: 'kamado', x: 1.4, z: 27.6, rx: 2.2, rz: 1.9, ry: -0.3, eau: T.kamado.h - 0.35, creux: 0.8, sorte: 'boue', bord: '#c4785a', milieu: '#9c4a34', vapeur: 0.6, choume: 6 },
  // l'enfer de l'étang blanc (白池地獄)
  { id: 'shiraike', enfer: 'shiraike', x: -33, z: 23.5, rx: 7.0, rz: 5.0, ry: -0.1, eau: T.shiraike.h - 0.45, creux: 1.6, sorte: 'eau', bord: '#e8f2ee', milieu: '#bcd8d6', vapeur: 0.7 },
  // l'enfer du lac de sang (血の池地獄), à Shibaseki
  { id: 'chinoike', enfer: 'chinoike', x: -70, z: -82.5, rx: 9.5, rz: 6.2, ry: 0.08, eau: T.shibaseki.h - 0.5, creux: 1.8, sorte: 'eau', bord: '#c84a32', milieu: '#8c2418', vapeur: 1 },
];
const BASSIN = Object.fromEntries(BASSINS.map((b) => [b.id, b]));
// le geyser de l'enfer de la tornade (龍巻地獄) : sa bouche, au pied de la falaise ; le toit de pierre au-dessus
const GEYSER = { x: -36, z: -91.5, y: T.shibaseki.h, toit: T.shibaseki.h + 4.2 };
// le tableau de l'heure du prochain jaillissement : derrière la clôture est des gradins, tourné vers les bancs (son texte vers
// −z dans son repère, comme les panneaux ; 2026-10-28 : « il est à l'envers », tourné vers la falaise)
const TABLEAU = { x: GEYSER.x + 7.5, z: GEYSER.z + 6.9, ry: Math.atan2(0.945, -0.328) };
// l'arrêt de bus (le départ), en bas de la rue
const DEPART = { x: 67, z: 6.6 };
// les allées : [x, z] le long de chacune, w la demi-largeur où l'on marche ; bois : un caillebotis (l'enfer de boue) ;
// rue : la rue (l'asphalte)
const CHEMINS = [
  { pts: RUE, w: 4.2, rue: true },
  // l'enfer de la mer : de son portail, le long du grand bassin bleu, jusqu'à la colline du sanctuaire Inari, l'étang des
  // nénuphars, la boutique, et le chemin vers l'enfer de boue
  { pts: [[-18, -3], [-18, -9], [-20, -15], [-23.5, -18.5], [-30, -19.4], [-37, -18.8], [-43, -20.6], [-47.6, -26], [-47.4, -32.6], [-43, -38.6], [-36, -40.6], [-29, -41.8]], w: 1.7 },
  { pts: [[-29, -41.8], [-24, -48], [-16, -49.4], [-10, -46], [-8.6, -38], [-10, -30], [-13, -24], [-18, -15]], w: 1.6 },
  { pts: [[-8.6, -34], [-2, -32.6], [3.4, -31.6]], w: 1.4 },
  // l'escalier de pierre sous les torii rouges, vers le petit sanctuaire Inari en haut de sa butte
  { pts: [[-44.6, -36.8], [-48.2, -41.4], [-51.2, -44.6]], w: 1.05, escalier: true },
  // l'enfer des crânes de moines : de la rue, son caillebotis entre les bassins de boue
  { pts: [[14, -2.5], [14.6, -10], [15, -16.6]], w: 1.6 },
  { pts: [[15, -16.6], [14.8, -22], [14.8, -30], [15.6, -34.4], [18.4, -38.6], [22, -41.6], [24.6, -43.2]], w: 1.25, bois: true },
  // (2026-10-28, la troisième liste, avec un dessin : « ce serait bien que tu puisses relier pour donner l'accès, ça évite de
  // faire tout le tour » — celui-ci partait du bout de l'allée de l'enfer de la mer, à 60 cm du coin du suivant, sans le
  // toucher : il part maintenant de ce coin)
  { pts: [[6.4, -33.0], [3.4, -31.6], [2.2, -28], [2.4, -22.8], [5.6, -20.2], [10.8, -19.8], [14.9, -20.2]], w: 1.2, bois: true },
  { pts: [[15.2, -32.6], [6.4, -33.0], [3.6, -36.4], [4.8, -41.4], [10, -43.4], [16.4, -42.6], [22, -41.6]], w: 1.2, bois: true },
  // l'enfer du chaudron : de la rue au démon ; puis le rond de l'allée, autour de ses bassins
  { pts: [[6.6, 2.8], [6.6, 9.6]], w: 1.8 },
  { pts: [[6.6, 9.6], [1.0, 11.2], [-3.4, 15.2], [-4.2, 21.4], [-3.6, 27.6], [0.0, 32.8], [6.6, 34.6], [13.4, 33.6], [17.8, 29.4], [18.6, 22.6], [17.4, 15.6], [12.6, 11.2], [6.6, 9.6]], w: 1.4 },
  // l'enfer de l'étang blanc : de la rue, le tour de son jardin
  { pts: [[-28, 1.6], [-27.6, 9], [-26.4, 14.6]], w: 1.6 },
  { pts: [[-26.4, 14.6], [-30, 15.0], [-36.6, 15.0], [-42.6, 18.6], [-44.8, 24.6], [-41.6, 31.0], [-33, 32.4], [-25.0, 30.8], [-22.4, 24], [-26.4, 14.6]], w: 1.4 },
  // le sentier de Shibaseki : de l'ouest de la rue, par le bois, jusqu'au plateau des deux enfers
  { pts: [[-58.4, -3.4], [-61.4, -12], [-63.2, -24], [-64.6, -36], [-65.2, -48], [-63.8, -58], [-62.4, -66.4]], w: 1.6, foret: true },
  // le lac de sang : son belvédère au sud, la boutique ; puis l'enfer de la tornade
  { pts: [[-62.4, -66.4], [-66, -71.6], [-73, -72.4], [-79.6, -74.6]], w: 1.8 },
  { pts: [[-62.4, -66.4], [-57, -70.6], [-52, -73.4], [-45, -75.6], [-38, -77.4], [-31.6, -78.6]], w: 1.8 },
];
// les places (où l'on s'arrête) : [x, z, rayons en x et en z, tour]
const PLACES = [
  // l'arrêt de bus, la placette des bains de pieds, le devant du four à vapeur, le parvis du bain de vapeur (la statue d'Ippen)
  // (rue : une place de la rue, entre elle et les maisons, sans clôture autour)
  { x: 66.6, z: 5.6, rx: 4.2, rz: 2.6, ry: 0, rue: true },
  { x: 28.6, z: 7.6, rx: 4.4, rz: 3.4, ry: 0, rue: true },
  { x: 44, z: 7.4, rx: 5.6, rz: 2.6, ry: 0, rue: true },
  { x: 34.4, z: -5.8, rx: 4.6, rz: 3.0, ry: 0, rue: true },
  // devant le ryokan
  { x: 52, z: -4.8, rx: 3.4, rz: 2.8, ry: 0, rue: true },
  // l'enfer de la mer : le belvédère sur le bassin bleu (on y cuit les œufs) ; devant le sanctuaire Inari, en haut ; le devant
  // de la boutique
  { x: -27.6, z: -20.4, rx: 6.2, rz: 2.4, ry: 0.12 },
  { x: -51.6, z: -45.2, rx: 3.0, rz: 2.4, ry: 0.5 },
  { x: -11.6, z: -33.6, rx: 1.6, rz: 2.4, ry: 0 },
  // le démon du chaudron, devant ; le coin du guide (le bassin bleu du troisième), le bain de pieds du chaudron
  { x: 6.6, z: 10.4, rx: 3.8, rz: 2.0, ry: 0 },
  { x: 17.0, z: 18.0, rx: 1.8, rz: 2.2, ry: 0 },
  { x: 15.8, z: 34.4, rx: 2.6, rz: 1.6, ry: 0 },
  // l'étang blanc : le banc au bord, côté nord ; le coin du grand érable, au bout du jardin (la pierre d'Ippen à son pied)
  { x: -31.6, z: 15.6, rx: 3.6, rz: 1.5, ry: 0 },
  { x: -38.6, z: 33.6, rx: 1.6, rz: 1.2, ry: 0.16 },
  // le bout du caillebotis de l'enfer de boue (le ronflement du démon)
  { x: 24.8, z: -42.4, rx: 2.4, rz: 2.0, ry: 0 },
  // le coin de Bunbuku, dans le bambou, à l'ouest du sentier ; il mord sur le sentier
  { x: -68.0, z: -40.0, rx: 2.6, rz: 2.4, ry: 0 },
  // le belvédère du lac de sang ; le devant de sa boutique ; les gradins de la tornade, jusqu'à la corde devant le geyser
  // (2026-10-27, la deuxième liste : une ellipse, qui s'arrêtait à un mètre et demi de la corde)
  { x: -70, z: -72.4, rx: 7.6, rz: 2.4, ry: 0.05 },
  { x: -54, z: -69.2, rx: 3.0, rz: 2.0, ry: 0 },
  { x: -36, z: -82.45, lx: 6.4, lz: 4.35, ry: 0, rect: true },
];
// les bâtiments de la rue (le milieu, les dimensions, le tour : 0, la façade vers la rue) ; et des enfers
const MUSHIYU = { x: 37.4, z: -12.6, l: 9, p: 7 };
const IPPEN = { x: 32.0, z: -7.6 };
const RYOKAN = { x: 53.0, z: -13.0, l: 12, p: 9 };
const KOBO = { x: 44.0, z: 13.4, l: 11, p: 7 };
const ASHIYU = { x: 28.0, z: 11.4 }, FONTAINE = { x: 31.4, z: 9.2 };
const ARRET = { x: 68.4, z: 8.2 };
const ONI = { x: 6.6, z: 14.0 };
const INARI = { x: -52.6, z: -47.6 };
const TAMAGO = { x: -26.0, z: -23.2 };
const BOUTIQUE_UMI = { x: -15.6, z: -33.4, l: 7, p: 5 };
const TAKAIBIKI = { x: 26.8, z: -45.4 };
const BOUTIQUE_CHI = { x: -53.6, z: -64.8, l: 8, p: 5 };
// Bunbuku le marchand, dans le bambou ; son lampion
const MARCHAND = { x: -68.8, z: -40.6, cap: PI / 2 + 0.2 };
const LAMPION = { x: MARCHAND.x - 0.4, z: MARCHAND.z - 1.1 };
// les trois pierres d'Ippen (le secret) : [x, z, tour] — sous l'arbre du jardin de l'étang blanc, sur la place du petit
// sanctuaire Inari (devant son renard à la clé, entre lui et la clôture : 2026-10-28, le propriétaire, un cadre rouge sur une
// capture ; elle était au pied du dernier torii, au bord de la place), entre les rochers du ronflement du démon
const PIERRES = [
  { id: 'p1', x: -38.6, z: 34.5, ry: 0.2 },
  { id: 'p2', x: -54.0, z: -44.85, ry: 0.5 },
  { id: 'p3', x: 25.4, z: -44.2, ry: 2.6 },
];
// les enfers où l'on jette une pierre : d'où on la jette, et où elle tombe (au milieu de l'eau, ou de la boue). Les pierres
// ramassées sont des indices (« ippen-p1 »…), les enfers où l'on en a jeté une aussi (« ippen-umi »…) : celles qu'on a en
// main, c'est la différence (on ne perd rien en rechargeant la page)
const ENFERS = ['umi', 'bozu', 'kamado', 'shiraike', 'chinoike'];
const LANCERS = {
  umi: { x: -37.6, z: -20.2, vers: [-36.4, -26.6], b: 'umi' }, bozu: { x: 14.8, z: -27.6, vers: [9.4, -26.2], b: 'bozu1' },
  kamado: { x: -3.4, z: 18.4, vers: [1.4, 18.6], b: 'k1' }, shiraike: { x: -43.2, z: 22.6, vers: [-36.4, 23.4], b: 'shiraike' },
  chinoike: { x: -75.6, z: -73.4, vers: [-72.4, -80.4], b: 'chinoike' },
};
const ramassees = () => PIERRES.filter((p) => indiceVu(`ippen-${p.id}`)).length;
const jetees = () => ENFERS.filter((e) => indiceVu(`ippen-${e}`)).length;
const enMain = () => ramassees() - jetees();

// ce qui est bâti : [x0, x1, z0, z1] (ni arbre ni buisson dedans)
const autour = (o, rx, rz = rx) => [o.x - rx, o.x + rx, o.z - rz, o.z + rz];
const BATIS = [
  autour(MUSHIYU, MUSHIYU.l / 2 + 1.5, MUSHIYU.p / 2 + 1.5), autour(RYOKAN, RYOKAN.l / 2 + 1.5, RYOKAN.p / 2 + 1.5), autour(KOBO, KOBO.l / 2 + 1.5, KOBO.p / 2 + 1.5),
  autour(BOUTIQUE_UMI, BOUTIQUE_UMI.l / 2 + 1.5, BOUTIQUE_UMI.p / 2 + 1.5), autour(BOUTIQUE_CHI, BOUTIQUE_CHI.l / 2 + 1.5, BOUTIQUE_CHI.p / 2 + 1.5),
  autour(ONI, 3.2), autour(ARRET, 3.4, 2), autour(TAKAIBIKI, 2.6), autour(MARCHAND, 2.2), [GEYSER.x - 7, GEYSER.x + 7, GEYSER.z - 6, GEYSER.z + 4],
];
// les maisons de la rue (le milieu, les dimensions, le tour : 0 au nord de la rue, la façade vers elle ; π au sud) : leur
// façade au bord du caniveau, sauf le bain de vapeur, le ryokan et le four, derrière leur placette (avant le 2026-10-27, trois à
// huit mètres de terre battue entre la rue et les façades : une rue vide, deux fois trop large)
const MAISONS_RUE = [
  { x: 23.0, z: -7.84, ry: 0, l: 7.6, p: 6, noren: '#3f6a4a', enseigne: { texte: 'おみやげ', l: 2.2 }, lanternes: true, cheminee: [2.2, -1] },
  { x: 44.7, z: -6.66, ry: 0, l: 4.2, p: 5.6, etages: 1, noren: '#7a4a2a', enseigne: { texte: '甘味処', l: 1.6 } },
  { x: 64.6, z: -6.19, ry: 0, l: 8.4, p: 7, noren: '#7a3a2e', cheminee: [2.4, 0] },
  { x: 75.0, z: -5.36, ry: 0, l: 7.0, p: 6.4, etages: 1, noren: '#4a4a5a' },
  { x: 35.5, z: 9.08, ry: PI, l: 5.4, p: 6, noren: '#5a3a6a', enseigne: { texte: 'たまご', l: 1.8 } },
  { x: 56.0, z: 10.73, ry: PI, l: 8.6, p: 7, noren: '#2f4a6a', cheminee: [-2.5, 1] },
  { x: 66.0, z: 12.5, ry: PI, l: 7.2, p: 6.4, etages: 1, noren: '#6a4a2a' },
  { x: 77.0, z: 11.51, ry: PI, l: 7.4, p: 6.4, enseigne: { texte: '地獄饅頭', l: 2.0 }, lanternes: true, cheminee: [1.6, 0.5] },
];
// au bout de la rue, la route qui la croise (on ne la traverse pas : la barrière des piétons) ; ses maisons, de l'autre côté
const ROUTE = { x0: 83.6, x1: 90.6 };
// la ville de Kannawa, tout autour des enfers : ses maisons serrées le long des ruelles (pas sur la route : 2026-10-27, des
// maisons y étaient posées, au nord de la rue)
const enVille = (x, z) => ((x > 29 && z < -11 && x < 114) || (x > 21 && z > 15 && x < 114) || (x > -8 && x < 30 && z < -50) || (x > -16 && x < -9 && z > 8) || (x > 91 && x < 114 && z > -56 && z < 50) || (z > 41.5 && x > -50 && x < 114))
  && !(x > ROUTE.x0 - 0.3 && x < ROUTE.x1 + 0.3);
// la rue et ses abords, où l'on marche partout (2026-10-27, la deuxième liste du propriétaire : « il y a plein de petits
// endroits où on a l'impression qu'on peut y aller, mais en fait non […] repousse les murs invisibles jusqu'au mur
// physique ») : à travers les enfers, d'un muret à haie à l'autre (HAIE : leur ligne, depuis le milieu de la rue) ; du côté
// des maisons (à l'est de FIN_HAIE), de la rue à leurs façades (des blocs pleins), à leurs palissades, au muret du coin
// d'Ippen (NORD_RUE), à la palissade du fond du bain de pieds (SUD_RUE) ; au bout, jusqu'à la barrière des piétons (EST_RUE)
const HAIE = 4.2 + 0.95, FIN_HAIE = { nord: 18.9, sud: 21.6 }, NORD_RUE = -10.25, SUD_RUE = 14.6, EST_RUE = 82.9;
/** Le z du milieu de la rue en x (au-delà des bouts, celui du bout). */
function zRue(x) {
  for (let i = 0; i + 1 < RUE.length; i++) {
    const [x0, z0] = RUE[i], [x1, z1] = RUE[i + 1];
    if (x <= x0 && x >= x1) return z0 + ((z1 - z0) * (x - x0)) / (x1 - x0);
  }
  return x > RUE[0][0] ? RUE[0][1] : RUE[RUE.length - 1][1];
}
/**
 * Où est x, z par rapport à la rue et ses abords : la distance à leur bord, négative dedans (le voyageur, un point, s'arrête au
 * bord : 27 cm avant ce qui l'arrête, le muret de la haie, les palissades, la barrière).
 */
function ecartRue(x, z) {
  const nord = z < zRue(x);
  if (x < FIN_HAIE[nord ? 'nord' : 'sud']) return surLaLigne(RUE, x, z).d - (HAIE - 0.26 - 0.27);
  return Math.max(x - (EST_RUE - 0.27), NORD_RUE + 0.27 - z, z - (SUD_RUE - 0.27));
}
// les palissades de planches (板塀) : entre les maisons de la rue (d'un coin de façade à l'autre), autour du bain de pieds, aux
// deux coins du bout de la rue ; entre l'enfer du chaudron, l'étang blanc et la ville, derrière ([x0, z0, x1, z1])
const PALISSADES = [
  [59.0, -8.5, 60.4, -8.5], [68.8, -2.65, 71.5, -2.2], [49.5, 9.9, 51.7, 7.25], [60.3, 7.25, 62.4, 9.3], [69.6, 9.3, 73.3, 8.35],
  [78.65, -8.5, EST_RUE, -8.5], [80.85, SUD_RUE, EST_RUE, SUD_RUE], [41.9, -9.1, 42.6, -9.46],
  [FIN_HAIE.sud, zRue(FIN_HAIE.sud) + HAIE, FIN_HAIE.sud, SUD_RUE], [FIN_HAIE.sud, SUD_RUE, 32.8, SUD_RUE], [32.8, SUD_RUE, 32.8, 12.25],
  [FIN_HAIE.sud, SUD_RUE, FIN_HAIE.sud, 40.6], ...Array.from({ length: 10 }, (_, k) => [-48 + k * 7.2, 40.6, Math.min(FIN_HAIE.sud, -48 + (k + 1) * 7.2), 40.6]),
];
/** La distance de x, z à la plus proche palissade (sa ligne). */
const versPalissade = (x, z) => Math.min(...PALISSADES.map(([x0, z0, x1, z1]) => surLaLigne([[x0, z0], [x1, z1]], x, z).d));

// ---------------------------------------------------------------- La géométrie du plan
/** Le point le plus proche des allées : la distance au bord de la plus proche (négative dedans), son chemin. */
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
/** Le point le plus proche de x, z sur la ligne brisée pts : { x, z, d }. */
function plusProche(pts, x, z) {
  let m = { x: pts[0][0], z: pts[0][1], d: Infinity };
  for (let k = 0; k + 1 < pts.length; k++) {
    const [x0, z0] = pts[k], [x1, z1] = pts[k + 1], dx = x1 - x0, dz = z1 - z0;
    const f = Math.min(1, Math.max(0, ((x - x0) * dx + (z - z0) * dz) / (dx * dx + dz * dz || 1))), px = x0 + f * dx, pz = z0 + f * dz, d = Math.hypot(x - px, z - pz);
    if (d < m.d) m = { x: px, z: pz, d };
  }
  return m;
}
/** La distance de x, z au bord de la place p (une ellipse, ou un rectangle : rect, ses demi-côtés lx, lz), négative dedans. */
function aLaPlace(p, x, z) {
  const c = Math.cos(p.ry), s = Math.sin(p.ry), u = (x - p.x) * c - (z - p.z) * s, v = (x - p.x) * s + (z - p.z) * c;
  // (d'une ellipse, la distance à son bord au premier ordre : (q − 1) / |∇q| ; avant, (q − 1) × le petit rayon, trop loin
  // au bout du grand axe — la clôture d'un long belvédère, à 35 cm de son bord sur les côtés, en était à 1,1 m aux bouts)
  const q = Math.hypot(u / (p.rx || 1), v / (p.rz || 1));
  return p.rect ? Math.max(Math.abs(u) - p.lx, Math.abs(v) - p.lz) : q < 1e-6 ? -Math.min(p.rx, p.rz) : ((q - 1) * q) / Math.hypot(u / (p.rx * p.rx), v / (p.rz * p.rz));
}
/** Dans les places : la distance au bord de la plus proche, en mètres, négative dedans. */
function surPlaces(x, z) {
  let mieux = Infinity;
  for (const p of PLACES) mieux = Math.min(mieux, aLaPlace(p, x, z));
  return mieux;
}
/** Où est x, z dans le bassin b : 1 à son bord (qui ondule un peu), 0 au milieu. */
function dansBassin(b, x, z) {
  const c = Math.cos(b.ry), s = Math.sin(b.ry), u = (x - b.x) * c - (z - b.z) * s, v = (x - b.x) * s + (z - b.z) * c;
  const t = Math.atan2(v / b.rz, u / b.rx);
  return Math.hypot(u / b.rx, v / b.rz) / (1 + 0.06 * Math.sin(t * 3 + b.x) + 0.04 * Math.sin(t * 5 + b.z));
}
/** Le bassin le plus proche de x, z (où l'on en est : dansBassin), et lui. */
function surBassins(x, z) {
  let mieux = Infinity, bassin = null;
  for (const b of BASSINS) {
    if (Math.abs(x - b.x) > b.rx * 1.6 + 2 || Math.abs(z - b.z) > b.rx * 1.6 + 2) continue;
    const d = dansBassin(b, x, z);
    if (d < mieux) { mieux = d; bassin = b; }
  }
  return { d: mieux, b: bassin };
}
/** La distance (en mètres, le long du rayon depuis son milieu) au bord du bassin b : négative dedans. */
function auBord(b, x, z) {
  const c = Math.cos(b.ry), s = Math.sin(b.ry), u = (x - b.x) * c - (z - b.z) * s, v = (x - b.x) * s + (z - b.z) * c;
  const t = Math.atan2(v / b.rz, u / b.rx), k = 1 + 0.06 * Math.sin(t * 3 + b.x) + 0.04 * Math.sin(t * 5 + b.z);
  return Math.hypot(u, v) - Math.hypot(b.rx * Math.cos(t), b.rz * Math.sin(t)) * k;
}
/** Le point du tour du bassin b à l'angle t, e mètres au-delà de son bord : [x, z]. */
function surLeTour(b, t, e = 0) {
  const k = 1 + 0.06 * Math.sin(t * 3 + b.x) + 0.04 * Math.sin(t * 5 + b.z), u = b.rx * Math.cos(t) * k, v = b.rz * Math.sin(t) * k, l = Math.hypot(u, v);
  const uu = u + (u / l) * e, vv = v + (v / l) * e, c = Math.cos(b.ry), s = Math.sin(b.ry);
  return [b.x + uu * c + vv * s, b.z - uu * s + vv * c];
}
/** Près d'un bassin, à moins de e mètres de son bord (ou dedans) ? */
const presDunBassin = (x, z, e) => BASSINS.some((b) => Math.abs(x - b.x) < b.rx + b.rz + e && Math.abs(z - b.z) < b.rx + b.rz + e && auBord(b, x, z) < e);

// ---------------------------------------------------------------- Le relief
/** Le relief lisse (sans ses bosses) : la ville qui descend vers l'est, le plateau de Shibaseki au nord-ouest. */
function relief(x, z) {
  return solRue(x) + 5.4 * lisse(-50, -72, z) * lisse(-6, -22, x) + 10 * lisse(-100, -140, z) + 9 * lisse(-90, -130, x);
}
/** Les terrasses des enfers (leur sol plat), fondues dans la pente autour. */
function terrasses(x, z, h) {
  for (const r of Object.values(TERRASSES)) {
    const d = Math.hypot(Math.max(0, Math.abs(x - r.x) - r.lx), Math.max(0, Math.abs(z - r.z) - r.lz));
    if (d < r.bord) h = r.h + (h - r.h) * lisse(0, r.bord, d);
  }
  // la butte du sanctuaire Inari, dans l'enfer de la mer (on y monte par un escalier sous les torii)
  const di = Math.hypot((x - INARI.x) / 4.6, (z - INARI.z) / 4.0);
  if (di < 2.2) h = Math.max(h, T.umi.h + 2.2 * (1 - lisse(0.75, 2.2, di)));
  return h;
}
/** Le relief au loin : le mont Tsurumi à l'ouest, les monts du nord ; à l'est, la ville descend vers la baie de Beppu. */
function lointain(x, z) {
  const bosse = (cx, cz, r, h) => { const d = Math.hypot(x - cx, z - cz) / r; return d < 1 ? h * (0.5 + 0.5 * Math.cos(d * PI)) : 0; };
  const baie = -34 * lisse(120, 330, x) * (1 - lisse(-420, -620, z));
  return bosse(-560, -160, 470, 230) + bosse(-260, -520, 360, 150) + bosse(-700, 260, 380, 120) + bosse(120, -560, 300, 90)
    + solRue(Math.min(x, 120)) * (1 - lisse(120, 200, x)) + baie + (bruitDoux(x * 0.1, z * 0.1, 6) - 0.5) * 6 * lisse(140, 300, Math.hypot(x + 6, z + 28));
}
/** La hauteur d'une allée en x, z : le relief lissé, les terrasses ; un peu au-dessus du sol voisin. */
function hauteurAllee(x, z) { return terrasses(x, z, relief(x, z)) + 0.04; }
// les marches de pierre : leurs lignes [x, z, y] (calculées avec le relief, plus bas)
const MARCHES = [];

function terrain(x, z) {
  // les lointains, puis le quartier (le relief se fond à 120 m du milieu) ; ses bosses, presque effacées autour de la rue, où
  // la ville est bâtie (2026-10-27 : à côté d'une maison, le sol creusé d'une bosse faisait un trou de 30 cm)
  const loin = lointain(x, z), f = lisse(118, 175, Math.hypot(x + 6, z + 28)), ville = lisse(12, 18, x) * (1 - lisse(18, 24, Math.abs(z - 2)));
  let h = (relief(x, z) + (bruitDoux(x * 0.5, z * 0.5, 7) - 0.5) * 1.1 * (1 - 0.75 * ville)) * (1 - f) + loin * f;
  if (f >= 1) return h;
  h = terrasses(x, z, h);
  // la route au bout de la rue : plate (le relief sans ses bosses)
  { const dr = Math.max(ROUTE.x0 - x, x - ROUTE.x1); if (dr < 1.6) { const ha = relief(x, z); h = ha + (h - ha) * lisse(0, 1.6, dr); } }
  // les allées, les places, la rue et ses abords : le sol s'aplanit sous eux (à leur hauteur, qui suit le relief en douceur)
  const c = surChemins(x, z), dp = surPlaces(x, z), dc = Math.min(c.d, dp, ecartRue(x, z) - 0.6);
  if (dc < 1.6 && !(c.c?.escalier && c.d < dp)) { const ha = hauteurAllee(x, z) - 0.04; h = ha + (h - ha) * lisse(0, 1.6, dc); }
  // les escaliers : à leur hauteur de chaque côté, puis le sol naturel
  for (const es of MARCHES) {
    const r = surLaLigne(es.ligne, x, z);
    if (r.d < es.demi + 2.0) h = r.h - 0.05 + (h - r.h + 0.05) * lisse(es.demi + 0.6, es.demi + 2.0, r.d);
  }
  // les bassins : leur rive au ras de la terrasse, un rebord qui plonge sous l'eau, puis le fond (plus creux au milieu)
  const s = surBassins(x, z);
  if (s.b && s.d < 1.25) {
    const b = s.b, rive = Math.min(h, b.eau + 0.42);
    if (s.d > 1.0) h = rive + (h - rive) * lisse(1.0, 1.25, s.d);
    else h = b.eau - 0.12 - (b.creux - 0.12) * (1 - lisse(0.3, 1.0, s.d)) + (b.eau + 0.42 - (b.eau - 0.12)) * lisse(0.9, 1.0, s.d);
  }
  // le geyser : la falaise derrière lui (au nord), et le creux de sa bouche
  {
    const dx = x - GEYSER.x, dz = z - GEYSER.z;
    if (dz < 2 && Math.abs(dx) < 16) h = Math.max(h, GEYSER.y + 9 * lisse(0.5, -4.5, dz + Math.max(0, Math.abs(dx) - 4) * 0.35) * lisse(16, 9, Math.abs(dx)));
    const dg = Math.hypot(dx, dz - 0.8);
    if (dg < 1.6) h = Math.min(h, GEYSER.y - 0.25 - 0.5 * (1 - lisse(0.4, 1.6, dg)));
  }
  return h;
}

/**
 * Peut-on être en x, z ? Sur les allées et les places jusqu'à leur clôture (le voyageur, un point, s'arrête à 25 cm de ses
 * piquets, qui sont à 35 cm du bord), dans la rue et ses abords (ecartRue), pas dans les bassins (leur clôture : 30 cm avant) ;
 * sur un caillebotis, toujours (sa rambarde arrête).
 */
function dansLeCadre(x, z) {
  const c = surChemins(x, z);
  if (c.c?.bois && c.d < 0) return true;
  if (presDunBassin(x, z, 0.8)) return false;
  return c.d < 0.1 || surPlaces(x, z) < 0.1 || ecartRue(x, z) < 0;
}

/** Ce que le carnet et le menu savent du lieu, sans le construire. */
export const infos = {
  id: 'beppu', carte: 'the-hells-of-beppu', video: '7655690260323585302',
  nom: { en: 'Beppu', fr: 'Beppu', ja: '別府' }, nomJa: '別府地獄',
  tampons: [
    { id: 'umi', motif: 'umi', ja: '海地獄', encre: '#1f7fae' },
    { id: 'bozu', motif: 'bozu', ja: '鬼石坊主', encre: '#5f5a52', forme: 'carre' },
    { id: 'kamado', motif: 'kamado', ja: 'かまど', encre: '#c0392b' },
    { id: 'shiraike', motif: 'shiraike', ja: '白池', encre: '#5a8a8a', forme: 'carre' },
    { id: 'chinoike', motif: 'chinoike', ja: '血の池', encre: '#a8281c' },
  ],
  get textes() { return TEXTES; },
};

/** La nuit : les lanternes, le papier des lampes et les fenêtres des ryokan s'allument. */
export const sortesNuit = (P) => ({ [P.shoji]: 'lumiere', [P.shojiCadre]: 'treillis', [P.vitreVille]: 'lumiere' });

/** Un triangle A, B, C ajouté à pos (et sa couleur à cols), tourné vers n (retourné s'il regarde de l'autre côté). */
function tri(pos, cols, A, B, C, c, n) {
  const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  if (nx * n[0] + ny * n[1] + nz * n[2] < 0) pos.push(...A, ...C, ...B); else pos.push(...A, ...B, ...C);
  cols.push(c);
}

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
  // (emprises : les socles des maisons, le piédestal du démon… { x, z, ry, l, p }, ou un rond { x, z, r } : les clôtures des
  // allées s'arrêtent contre eux, sans les traverser ni s'arrêter avant)
  const objets = [], batis = BATIS.map((b) => b.slice()), emprises = [];
  const dansEmprise = (e, x, z, m = 0) => {
    if (e.r) return Math.hypot(x - e.x, z - e.z) < e.r + m;
    const c = Math.cos(e.ry || 0), s = Math.sin(e.ry || 0), u = (x - e.x) * c - (z - e.z) * s, v = (x - e.x) * s + (z - e.z) * c;
    return Math.abs(u) < e.l / 2 + m && Math.abs(v) < e.p / 2 + m;
  };
  const monde = creerMonde({ terrain, cadre: dansLeCadre, profond: null, pente: null });
  const poser = (fin, x, z, o = {}) => objets.push({ fin, x, z, y: o.y ?? terrain(x, z), ry: o.ry || 0, ombre: o.ombre !== false, trait: o.trait !== false, dedans: o.dedans, avant: o.avant });
  const bancs = [], lumieres = [], animes = [], vapeurs = [], etiquettes = [];
  const ecrire = (o, e) => {
    const c = Math.cos(o.ry || 0), sn = Math.sin(o.ry || 0);
    etiquettes.push({ ...e, x: o.x + e.x * c + e.z * sn, y: o.y + e.y, z: o.z - e.x * sn + e.z * c, ry: (o.ry || 0) + (e.ry || 0) });
  };
  /** Un repère tourné : la pose (x, y, z, ry) d'une pièce donnée dans le repère d'un objet posé en x0, z0, tourné de ry0. */
  const repere = (x0, z0, ry0) => {
    const c = Math.cos(ry0), s = Math.sin(ry0);
    return (lx, y, lz, o = {}) => ({ ...o, x: x0 + lx * c + lz * s, y, z: z0 - lx * s + lz * c, ry: ry0 + (o.ry || 0) });
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
    const k = `${Math.floor(x / taille)},${Math.floor(z / taille)}`;
    if (!morceaux.has(k)) morceaux.set(k, atelier());
    return morceaux.get(k);
  };

  // ---------------------------------------------------------------- Les bassins des enfers : l'eau, la boue, la vapeur
  // l'eau (le moteur, eaux calmes : chaque bassin sa couleur, claire au bord, profonde au milieu ; elle s'arrête net à sa rive)
  const eauxCalmes = BASSINS.filter((b) => b.sorte !== 'boue').map((b) => {
    const r = Math.max(b.rx, b.rz) * 1.12 + 0.3;
    return [b.x - r, b.x + r, b.z - r, b.z + r, b.eau, (x, z) => -auBord(b, x, z), { clair: b.bord, profond: b.milieu }];
  });
  // la boue (son propre dessin : grise, épaisse, ses bulles qui gonflent et crèvent en laissant des ronds)
  const boue = creerBoue(THREE, BASSINS.filter((b) => b.sorte === 'boue'));
  animes.push(boue);
  // les rives : des pierres volcaniques, blanchies par les dépôts des sources, tout autour (posées avec les clôtures, plus bas :
  // une pierre ne prend pas la place d'un pieu) ; là où l'on vient jusqu'à l'eau, la clôture de bambou des allées
  const rochersRive = [];
  for (const b of BASSINS) {
    const tour = 2 * PI * Math.max(b.rx, b.rz), n = Math.max(10, Math.round(tour / 0.9));
    for (let k = 0; k < n; k++) {
      const t = (k / n) * 2 * PI + hasard(k, b.x) * 0.3, [x, z] = surLeTour(b, t, 0.05 + 0.25 * hasard(b.z, k)), r = 0.22 + 0.28 * hasard(k, b.z);
      const blanc = b.sorte === 'nenuphars' ? 0.2 : 0.55;
      rochersRive.push({ b, x, z, r, c: hasard(x, z) < blanc ? '#cfc7b4' : '#8f8578' });
    }
  }
  // la vapeur : des bouffées sur chaque bassin, à proportion de sa taille et de sa force
  for (const b of BASSINS) {
    if (!b.vapeur) continue;
    const n = Math.max(1, Math.round((b.rx * b.rz) / 14));
    for (let k = 0; k < n; k++) {
      const t = (k / n) * 2 * PI + 0.7, f = n > 1 ? 0.45 : 0, c = Math.cos(b.ry), s = Math.sin(b.ry);
      const u = Math.cos(t) * b.rx * f, v = Math.sin(t) * b.rz * f;
      vapeurs.push({ x: b.x + u * c + v * s, z: b.z - u * s + v * c, y: b.eau + 0.05, n: Math.round(16 + 16 * b.vapeur), haut: 5 + 7 * b.vapeur, large: 1.4 + 1.8 * b.vapeur, taille: 2.6 + 3.2 * b.vapeur, opacite: 0.55 });
    }
  }

  // ---------------------------------------------------------------- La rue de Kannawa : ses maisons, ses fumées
  /** Le sol le plus haut sous un rectangle (l × p, tourné de ry, en x, z) : un bâtiment y pose son socle sans flotter. */
  const solSous = (x, z, ry, l, p) => {
    const R = repere(x, z, ry);
    let h = -Infinity;
    for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, 0], [0, 1], [0, -1]]) { const q = R((u * l) / 2, 0, (v * p) / 2); h = Math.max(h, terrain(q.x, q.z)); }
    return h;
  };
  /**
   * Une vieille maison de Kannawa (le repère : la façade vers +z, sur la rue) : un socle de pierre, le rez-de-chaussée au
   * crépi et au bois sombre, sa façade en treillis de bois (koshi) et sa porte (le noren), un petit auvent de tuiles, l'étage
   * aux fenêtres de papier et sa rambarde, le grand toit de tuiles ; une cheminée de vapeur (un tuyau, la vapeur au bout).
   * o : l, p, etages (1 ou 2), noren (sa couleur), enseigne { texte, fond, encre }, cheminee ([lx, lz] sur le toit), plein
   * (on n'y entre pas : un bloc), y. Renvoie la hauteur du sol de la maison.
   */
  const maison = (a, x, z, ry, o) => {
    const { l, p, etages = 2, noren = '#2f4a6a', h1 = 2.9, h2 = 2.4 } = o;
    const y = o.y ?? solSous(x, z, ry, l, p), R = repere(x, z, ry), B = P.boisNoir;
    a.boite(l + 0.3, 1.3, p + 0.3, P.pierreFonce, R(0, y - 0.45, 0, { nuance: 0.08 }));
    a.boite(l, h1, p, P.crepi, R(0, y + 0.2 + h1 / 2, 0));
    // les poteaux, la poutre au-dessus du rez-de-chaussée
    for (const u of [-1, 1]) for (const v of [-1, 1]) a.boite(0.22, h1 + 0.02, 0.22, B, R((u * (l - 0.2)) / 2, y + 0.2 + h1 / 2, (v * (p - 0.2)) / 2));
    a.boite(l + 0.04, 0.25, p + 0.04, B, R(0, y + 0.2 + h1 - 0.135, 0));
    // la façade : le treillis de bois sur un fond sombre, la porte et son noren au milieu
    const pl = l - 0.6, porte = Math.min(1.8, l * 0.25);
    a.boite(pl, h1 - 0.6, 0.04, '#3a2c22', R(0, y + 0.2 + (h1 - 0.6) / 2 + 0.1, p / 2 + 0.01));
    for (let lx = -pl / 2 + 0.06; lx <= pl / 2 - 0.05; lx += 0.13) {
      if (Math.abs(lx) < porte / 2 + 0.05) continue;
      a.boite(0.045, h1 - 0.62, 0.05, P.bois2, R(lx, y + 0.2 + (h1 - 0.6) / 2 + 0.1, p / 2 + 0.045, { trait: false }));
    }
    a.boite(porte, h1 - 0.7, 0.05, '#2a201a', R(0, y + 0.2 + (h1 - 0.7) / 2, p / 2 + 0.03, { trait: false }));
    // le noren : trois pans de tissu, fendus
    for (let k = 0; k < 3; k++) a.boite(porte / 3 - 0.03, 0.7, 0.02, noren, R(-porte / 3 + (k * porte) / 3, y + 0.2 + h1 - 0.95, p / 2 + 0.1, { nuance: 0.03 }));
    {
      const q1 = R(-porte / 2 - 0.1, 0, p / 2 + 0.1), q2 = R(porte / 2 + 0.1, 0, p / 2 + 0.1), yb = y + 0.2 + h1 - 0.58;
      a.baton([q1.x, yb, q1.z], [q2.x, yb, q2.z], 0.025, B, 5);
    }
    // l'auvent de tuiles au-dessus du rez-de-chaussée : un pan qui penche vers la rue, son bord de tuiles rondes
    // (pas sur une maison basse : son grand toit avance déjà au-dessus de la porte)
    if (etages > 1) {
      a.boite(l + 0.4, 0.08, 1.5, P.tuileShiro, R(0, y + 0.2 + h1 + 0.2, p / 2 + 0.2, { rx: 0.36, ordre: 'YXZ' }))
        .boite(l + 0.44, 0.1, 0.1, '#4a4a4e', R(0, y + 0.2 + h1 - 0.05, p / 2 + 0.93));
    }
    let yt = y + 0.2 + h1;
    if (etages > 1) {
      a.boite(l - 0.4, h2, p - 0.4, P.crepi, R(0, yt + h2 / 2, -0.1));
      for (const u of [-1, 1]) for (const v of [-1, 1]) a.boite(0.22, h2 + 0.02, 0.22, B, R(u * ((l - 0.4) / 2 - 0.06), yt + h2 / 2, -0.1 + v * ((p - 0.4) / 2 - 0.06)));
      // les fenêtres de papier de l'étage, leur cadre, la rambarde
      const nf = Math.max(1, Math.floor((l - 1) / 1.9));
      for (let k = 0; k < nf; k++) {
        const lx = -((nf - 1) * 1.9) / 2 + k * 1.9;
        a.boite(1.4, 1.1, 0.05, P.shojiCadre, R(lx, yt + 1.25, p / 2 - 0.27))
          .boite(1.28, 0.98, 0.04, P.shoji, R(lx, yt + 1.25, p / 2 - 0.235, { trait: false }));
        for (const dx of [-0.32, 0, 0.32]) a.boite(0.025, 0.98, 0.02, P.shojiCadre, R(lx + dx, yt + 1.25, p / 2 - 0.205, { trait: false }));
      }
      a.boite(l - 0.5, 0.06, 0.06, B, R(0, yt + 0.62, p / 2 - 0.12)).boite(l - 0.5, 0.05, 0.05, B, R(0, yt + 0.3, p / 2 - 0.12));
      for (let lx = -(l - 0.6) / 2; lx <= (l - 0.6) / 2 + 0.01; lx += 0.5) a.boite(0.035, 0.6, 0.035, B, R(lx, yt + 0.33, p / 2 - 0.12, { trait: false }));
      yt += h2;
    }
    // les côtés et l'arrière (ce qu'on voit des ruelles, des enfers, entre deux maisons : avant le 2026-10-27, du crépi tout nu,
    // des boîtes) : des poteaux de bois sombre, une fenêtre à barreaux au rez-de-chaussée (au milieu d'une travée), une fenêtre
    // de papier à l'étage
    for (const [lf, pf, rf] of [[l, p, PI], [p, l, PI / 2], [p, l, -PI / 2]]) {
      const Rf = (u, yy, out, o2 = {}) => R(u * Math.cos(rf) + (pf / 2 + out) * Math.sin(rf), yy, -u * Math.sin(rf) + (pf / 2 + out) * Math.cos(rf), { ...o2, ry: rf + (o2.ry || 0) });
      const np = Math.max(1, Math.round(lf / 1.9)), travee = (k) => -lf / 2 + ((k + 0.5) * lf) / np;
      for (let k = 1; k < np; k++) a.boite(0.14, h1, 0.06, B, Rf(-lf / 2 + (k * lf) / np, y + 0.2 + h1 / 2, 0.02));
      for (const k of lf > 5.5 && np > 1 ? [0, np - 1] : [Math.floor((np - 1) / 2)]) {
        const u = travee(k);
        a.boite(1.0, 0.8, 0.06, '#3a2c22', Rf(u, y + 0.2 + 1.55, 0.02));
        for (let b = -0.36; b < 0.37; b += 0.12) a.boite(0.035, 0.74, 0.035, P.bois2, Rf(u + b, y + 0.2 + 1.55, 0.065, { trait: false }));
      }
      if (etages > 1) {
        const out2 = rf === PI ? -0.1 : -0.2, u2 = rf === PI ? 0 : 0.1 * Math.sin(rf);
        a.boite(1.0, 0.9, 0.05, P.shojiCadre, Rf(u2, yt + 1.25, out2 + 0.02))
          .boite(0.88, 0.78, 0.04, P.shoji, Rf(u2, yt + 1.25, out2 + 0.045, { trait: false }));
      }
    }
    // le grand toit : ses tuiles grises ; dessous, le haut des murs monte jusque sous lui (avant le 2026-10-27, un vide de 6 à
    // 20 cm entre le haut des murs et le dessous du toit, qui monte vers le faîte), en trois morceaux par côté, chacun sous le
    // pan le plus bas au-dessus de lui (aux coins, le pan d'à côté est plus bas) ; le milieu monte dans son épaisseur
    {
      const LT = (l + 1.3) / 2, PT = (p + 1.1) / 2, ml = etages > 1 ? (l - 0.4) / 2 : l / 2, mp = etages > 1 ? (p - 0.4) / 2 : p / 2, z0 = etages > 1 ? -0.1 : 0;
      const pan = (d, demi) => 1.7 * Math.min(1, Math.max(0, d / (demi * 0.58))) ** 1.7;
      const sous = (x, z) => Math.min(pan(PT - 0.1 - z, PT), pan(z + 0.1 + PT, PT), pan(LT - Math.abs(x), LT)) - 0.022 - 0.02 - 0.01;
      // (un côté : de (xa, za) à (xb, zb), le long de x ou de z ; e : vers le dehors)
      const bande = (xa, za, xb, zb, ex, ez) => {
        const L = Math.hypot(xb - xa, zb - za), coupes = [0, Math.min(0.5, L / 3), L - Math.min(0.5, L / 3), L];
        for (let k = 0; k < 3; k++) {
          const f0 = coupes[k] / L, f1 = coupes[k + 1] / L, x0 = xa + (xb - xa) * f0, z0b = za + (zb - za) * f0, x1 = xa + (xb - xa) * f1, z1 = za + (zb - za) * f1;
          const h = Math.max(0.02, Math.min(sous(x0, z0b), sous(x1, z1), sous((x0 + x1) / 2, (z0b + z1) / 2)));
          const cx = (x0 + x1) / 2 - ex * 0.05, cz = (z0b + z1) / 2 - ez * 0.05, lg = coupes[k + 1] - coupes[k];
          a.boite(ex ? 0.12 : lg, h + 0.1, ex ? lg : 0.12, P.crepi, R(cx, yt + (h - 0.1) / 2, cz, { trait: false }));
        }
      };
      bande(-ml - 0.01, z0 + mp, ml + 0.01, z0 + mp, 0, 1);
      bande(-ml - 0.01, z0 - mp, ml + 0.01, z0 - mp, 0, -1);
      for (const u of [-1, 1]) bande(u * ml, z0 - mp + 0.12, u * ml, z0 + mp - 0.12, u, 0);
    }
    a.boite(l * 0.72, 0.9, p * 0.62, P.crepi, R(0, yt + 0.4, -0.1));
    a.toitJapon(l + 1.3, p + 1.1, 1.7, 0.42, { ...R(0, yt - 0.02, -0.1), tuile: P.tuileShiro, tuile2: P.tuileShiroClaire, bord: '#4a4a4e', rangs: Math.round(l * 2) });
    if (o.cheminee) {
      // la cheminée de vapeur : un tuyau qui sort du toit, coudé au bout (la vapeur des sources de la maison)
      const [cx, cz] = o.cheminee, q = R(cx, 0, cz), y0 = yt + 0.6;
      a.cylindre(0.12, 0.12, 2.6, 8, '#8a8784', { x: q.x, y: y0 + 1.3, z: q.z }).cylindre(0.15, 0.15, 0.12, 8, '#6a6764', { x: q.x, y: y0 + 2.6, z: q.z });
      vapeurs.push({ x: q.x, z: q.z, y: y0 + 2.6, n: 16, haut: 7, large: 1.2, taille: 2.6, opacite: 0.55 });
    }
    if (o.lanternes) {
      // deux lanternes rouges de part et d'autre de la porte (allumées la nuit), pendues chacune à un crochet au bout d'un bras de
      // bois qui sort de la poutre (2026-10-27, la deuxième liste : à un fil de 8 mm, elles semblaient flotter devant la façade)
      const yb = y + 0.2 + h1 - 0.1, yl = yb - 0.5;
      for (const u of [-1, 1]) {
        const lx = u * (Math.min(1.8, l * 0.25) / 2 + 0.55), q = R(lx, 0, p / 2 + 0.4);
        a.boite(0.06, 0.06, 0.46, B, R(lx, yb, p / 2 + 0.22)).baton([q.x, yb - 0.02, q.z], [q.x, yl + 0.23, q.z], 0.016, '#2a2420', 4);
        a.chochin(q.x, yl, q.z, 6);
        lumieres.push({ x: q.x, y: yl, z: q.z, halo: 0.45, sol: y, r: 3.2 });
      }
    }
    if (o.enseigne) {
      // l'enseigne de bois (un texte peint) : sur une maison basse, au-dessus de la porte, sous l'avancée du toit ; sur une
      // maison à étage, au haut de l'étage, sous le grand toit (2026-10-27 : posée devant l'auvent, elle le traversait ; sur une
      // maison basse, elle flottait au-dessus du bord du toit)
      const e = o.enseigne, le = e.l ?? 2.4, etage = etages > 1, he = etage ? 0.5 : 0.4;
      const ye = etage ? yt - 0.32 : y + 0.2 + h1 - 0.18, ze = etage ? p / 2 - 0.3 + 0.055 : p / 2 + 0.07;
      a.boite(le, he, 0.08, '#4a3628', R(0, ye, ze));
      ecrire({ x, y, z, ry }, { texte: e.texte, x: 0, y: ye - y, z: ze + 0.045, l: le - 0.16, h: he - 0.12, fond: e.fond ?? '#efe6d2', encre: e.encre ?? '#2a2018' });
    }
    {
      // (son emprise : ni arbre, ni maison de la ville dedans ; la clôture d'une allée s'arrête à son socle)
      const c0 = R(-l / 2 - 1, 0, -p / 2 - 1), c1 = R(l / 2 + 1, 0, p / 2 + 1);
      batis.push([Math.min(c0.x, c1.x), Math.max(c0.x, c1.x), Math.min(c0.z, c1.z), Math.max(c0.z, c1.z)]);
      emprises.push({ x, z, ry, l: l + 0.3, p: p + 0.3 });
    }
    if (o.plein !== false) {
      // (le socle de pierre dépasse de 15 cm : le bloc 42 cm au-delà des murs, le corps ne touche pas le socle)
      const c0 = R(-l / 2 - 0.42, 0, -p / 2 - 0.42), c1 = R(l / 2 + 0.42, 0, p / 2 + 0.42);
      monde.surface(Math.min(c0.x, c1.x), Math.max(c0.x, c1.x), Math.min(c0.z, c1.z), Math.max(c0.z, c1.z), y + 0.2 + h1 + (etages > 1 ? h2 : 0), { plein: true });
      monde.bloc(Math.min(c0.x, c1.x), Math.max(c0.x, c1.x), Math.min(c0.z, c1.z), Math.max(c0.z, c1.z), y - 1, yt + 1.6);
    }
    return y;
  };
  {
    // au nord de la rue (la façade vers le sud) ; au sud (vers le nord)
    const a = atelier();
    maison(a, RYOKAN.x, RYOKAN.z, 0, { l: RYOKAN.l, p: RYOKAN.p, noren: '#2f4a6a', h1: 3.1, h2: 2.6, enseigne: { texte: '湯の宿 かんなわ', l: 3.6, fond: '#2a2018', encre: '#f2e6c8' }, lanternes: true, cheminee: [-3.6, -1.5] });
    for (const m of MAISONS_RUE) maison(a, m.x, m.z, m.ry, m);
    poser(a.fin(), 0, 0, { y: 0 });
  }

  /**
   * Une haute enseigne de bois d'un enfer (son nom de haut en bas, sous un petit toit), tournée vers ry : deux poteaux, la
   * planche entre eux, une poutre posée sur les poteaux, le toit posé sur la poutre et, dessous, un bloc qui remplit son creux
   * (2026-10-27, la deuxième liste : les poteaux s'arrêtaient 7 cm sous la poutre, le toit semblait flotter).
   */
  const enseigneEnfer = (a, x, z, ry, texte, o = {}) => {
    const y = terrain(x, z), R = repere(x, z, ry), h = o.h ?? 3.2, l = o.l ?? 0.9, yp = y + h + 0.32;
    for (const u of [-1, 1]) a.boite(0.14, yp - y + 0.31, 0.14, P.boisNoir, R((u * (l + 0.1)) / 2, (y - 0.25 + yp + 0.06) / 2, 0));
    a.boite(l, h - 0.5, 0.1, '#4a3628', R(0, y + h / 2 + 0.15, 0));
    a.boite(l + 0.3, 0.12, 0.3, P.boisNoir, R(0, yp + 0.06, 0)).boite(l - 0.3, 0.1, 0.16, P.boisNoir, R(0, yp + 0.15, 0));
    a.toitJapon(l + 0.7, 0.6, 0.28, 0, { ...R(0, yp + 0.1, 0), tuile: P.tuileShiro, tuile2: P.tuileShiroClaire, bord: '#4a4a4e', rangs: 6 });
    ecrire({ x, y, z, ry }, { texte, x: 0, y: h / 2 + 0.15, z: 0.056, l: l - 0.16, h: h - 0.66, fond: o.fond ?? '#f2e8d2', encre: o.encre ?? '#2a1e18', vertical: true });
    monde.mur(R(-l / 2 - 0.2, 0, 0).x, R(-l / 2 - 0.2, 0, 0).z, R(l / 2 + 0.2, 0, 0).x, R(l / 2 + 0.2, 0, 0).z, 0.35);
    emprises.push({ x, z, ry, l: l + 0.3, p: 0.3 });
  };
  {
    const a = atelier();
    // le bain de vapeur (鉄輪むし湯) : une maison basse au grand toit, son noren « むし湯 », son enseigne sur un poteau ; devant,
    // la statue du moine Ippen sur son socle, et le panneau de sa légende
    maison(a, MUSHIYU.x, MUSHIYU.z, 0, { l: MUSHIYU.l, p: MUSHIYU.p, etages: 1, h1: 3.2, noren: '#3a5a8a', cheminee: [2.8, -1.4] });
    // (80 cm plus à l'ouest qu'avant le 2026-10-27 : son petit toit entrait dans celui du 甘味処 d'à côté)
    enseigneEnfer(a, MUSHIYU.x + 3.6, -7.2, 0.2, '鉄輪むし湯', { h: 2.6, l: 0.7 });
    // la statue d'Ippen : un moine maigre qui marche pieds nus, les mains jointes devant la poitrine (gasshō), le crâne rasé un
    // peu penché, dans sa robe aux grandes manches, l'étole (kesa) en travers, de bronze patiné ; sur un socle de pierre
    // (2026-10-27, la deuxième liste : « faudrait refaire la statue, elle est mal faite » — une cloche de bronze d'où sortaient
    // deux gros œufs pour manches et une tête de chouette. Refaite avec les proportions d'un homme, 1,7 m, sept têtes : la robe
    // en deux pièces tournées, le torse, les épaules, des manches plates qui pendent des coudes, les avant-bras, les mains.)
    {
      const y = terrain(IPPEN.x, IPPEN.z), R = repere(IPPEN.x, IPPEN.z, 0.25), BR = P.bronzeStatue, BO = P.bronzeOmbre;
      a.boite(1.5, 0.5, 1.5, P.pierreFonce, R(0, y + 0.1, 0)).boite(1.2, 0.9, 1.2, P.pierre, R(0, y + 0.75, 0));
      ecrire({ x: IPPEN.x, y, z: IPPEN.z, ry: 0.25 }, { texte: '一遍上人', x: 0, y: 0.78, z: 0.61, l: 0.32, h: 0.74, fond: null, encre: '#3a3430', vertical: true });
      const y0 = y + 1.2;
      // (teinte reçoit le milieu de chaque triangle dans le monde : les plis, en tournant autour de la statue)
      const plis = (px, py, pz) => (Math.floor(Math.atan2(pz - IPPEN.z, px - IPPEN.x) * 3.2 + 20) % 2 ? BR : BO);
      // le bas de la robe : un peu évasé, l'ourlet, ses plis ; un peu penché vers l'avant (il marche)
      const robe = [[0.01, 0], [0.24, 0], [0.25, 0.05], [0.235, 0.25], [0.205, 0.55], [0.18, 0.82], [0.17, 0.97], [0.01, 0.98]].map(([r, h]) => new THREE.Vector2(r, h));
      a.piece(new THREE.LatheGeometry(robe, 12), BR, { ...R(0, y0 + 0.03, 0.03, { rx: 0.05 }), sz: 0.82, teinte: plis });
      // les pieds nus sous l'ourlet, le droit en avant
      for (const [u, f] of [[0.075, 0.2], [-0.075, 0.08]]) a.ovale(0.055, BR, { ...R(u, y0 + 0.035, f), sx: 0.85, sy: 0.55, sz: 1.75 }, 8);
      // le torse, les épaules ; l'étole (kesa) de l'épaule gauche à la hanche droite
      a.ovale(0.2, BR, { ...R(0, y0 + 1.17, 0.05), sx: 1.08, sy: 1.32, sz: 0.76 }, 12);
      for (const u of [-1, 1]) a.ovale(0.085, BR, R(u * 0.185, y0 + 1.37, 0.04), 8);
      a.boite(0.085, 0.62, 0.03, BO, R(-0.02, y0 + 1.16, 0.19, { rz: -0.5, rx: -0.12 }));
      // les bras : du haut de l'épaule au coude, du coude aux mains jointes devant la poitrine ; les grandes manches plates qui
      // pendent sous les avant-bras ; les mains (gasshō), les doigts vers le haut
      for (const u of [-1, 1]) {
        const ep = R(u * 0.2, 0, 0.05), co = R(u * 0.235, 0, 0.13), po = R(u * 0.035, 0, 0.27);
        a.baton([ep.x, y0 + 1.36, ep.z], [co.x, y0 + 1.12, co.z], 0.055, BR, 7).baton([co.x, y0 + 1.12, co.z], [po.x, y0 + 1.25, po.z], 0.045, BR, 7);
        a.cylindre(0.075, 0.14, 0.4, 9, BR, { ...R(u * 0.245, y0 + 0.95, 0.14, { rz: u * 0.07 }), sx: 0.5, teinte: (px, py) => (py < y0 + 0.82 ? BO : BR) });
      }
      a.ovale(0.05, BR, { ...R(0, y0 + 1.32, 0.29, { rx: -0.2 }), sx: 0.7, sy: 1.75, sz: 0.62 }, 8);
      // le cou, la tête rasée, un peu penchée vers l'avant, son nez, ses oreilles
      a.cylindre(0.045, 0.052, 0.12, 8, BR, R(0, y0 + 1.47, 0.05, { rx: 0.18 }));
      a.ovale(0.105, BR, { ...R(0, y0 + 1.6, 0.075, { rx: 0.22 }), sx: 0.86, sy: 1.12, sz: 1.0 }, 12);
      a.cone(0.022, 0.05, 4, BO, R(0, y0 + 1.585, 0.185, { rx: PI / 2 + 0.2 }));
      for (const u of [-1, 1]) a.ovale(0.03, BR, { ...R(u * 0.092, y0 + 1.595, 0.06), sx: 0.4, sy: 0.85, sz: 0.6 }, 6);
      // (des murs le long de son socle, 27 cm au-delà : avant, un rond de 1,3 m, qui arrêtait 55 cm avant les côtés du socle —
      // le panneau de la légende, tout près, le cachait ; 2026-10-28, il s'est rangé contre le muret)
      { const C = [[-0.75, -0.75], [0.75, -0.75], [0.75, 0.75], [-0.75, 0.75]].map(([u, v]) => R(u, 0, v)); for (let k = 0; k < 4; k++) monde.mur(C[k].x, C[k].z, C[(k + 1) % 4].x, C[(k + 1) % 4].z, 0.27); }
      emprises.push({ x: IPPEN.x, z: IPPEN.z, ry: 0.25, l: 1.5, p: 1.5 });
      poser(a.fin(), 0, 0, { y: 0 });
    }
  }
  // le panneau de la légende d'Ippen, à côté de la statue ; ceux des enfers, à côté de leur allée, derrière sa clôture, tournés
  // vers elle (le texte regarde vers −z dans le repère du panneau : decor.js). (2026-10-28, la troisième liste du propriétaire :
  // « il y a plusieurs panneaux même en plein milieu du chemin » — celui de l'enfer de la mer au carrefour de ses deux allées,
  // celui du chaudron dans le rond, celui d'Ippen au milieu du coin dallé ; celui de la tornade, au coin de ses gradins, tourné
  // vers le jardin.)
  const PANNEAUX = {
    ippen: { x: 29.6, z: -9.7, ry: PI }, umi: { x: -21.2, z: -9.6, ry: -PI / 2 }, bozu: { x: 17.6, z: -14.0, ry: PI / 2 }, kamado: { x: 3.5, z: 6.8, ry: -PI / 2 },
    shiraike: { x: -24.4, z: 10.2, ry: PI / 2 }, chinoike: { x: -62.6, z: -74.6, ry: PI }, tatsumaki: { x: -34.6, z: -75.0, ry: 0 },
  };
  for (const [id, p] of Object.entries(PANNEAUX)) {
    const y = terrain(p.x, p.z), b = panneau(atelier(), P, { ecrit: true });
    poser(b.fin(), p.x, p.z, { y, ry: p.ry });
    ecrire({ x: p.x, y, z: p.z, ry: p.ry }, { ...PAPIER_PANNEAU, texte: TITRES_PANNEAUX[id], fond: '#fff8e8', encre: '#2a2420', lignes: 3 });
    const cx = Math.cos(p.ry) * 0.6, cz = -Math.sin(p.ry) * 0.6;
    monde.mur(p.x - cx, p.z - cz, p.x + cx, p.z + cz, 0.5);
  }
  {
    // le four à vapeur de l'enfer (地獄蒸し工房) : sa maison basse, et devant, sous un auvent, quatre fours de pierre (kama) et
    // leurs couvercles de bois, d'où la vapeur s'échappe ; les paniers d'œufs, de patates douces et de maïs
    const a = atelier(), y0 = maison(a, KOBO.x, KOBO.z, PI, { l: KOBO.l, p: KOBO.p, etages: 1, h1: 3.0, noren: '#8a2e22' });
    const R = repere(KOBO.x, KOBO.z, PI), zf = KOBO.p / 2;
    // (devant le poteau est de l'auvent, au bord de la rue : avant, plantée dans le comptoir, sous la tôle de l'auvent)
    enseigneEnfer(a, KOBO.x + 5.75, 6.5, PI + 0.15, '地獄蒸し工房', { h: 2.8, l: 0.8 });
    // (2026-10-27, la deuxième liste : « tous les blocs sont en lévitation, et le comptoir aussi » — posés à la hauteur du sol de
    // la maison, le plus haut sous elle, au-dessus de la rue qui descend : chacun est maintenant posé sur le sol devant lui, et
    // descend dedans ; le comptoir, de niveau, descend jusqu'au plus bas du sol sous lui)
    const solMin = (lx0, lx1, lz0, lz1) => Math.min(...[[lx0, lz0], [lx1, lz0], [lx0, lz1], [lx1, lz1], [(lx0 + lx1) / 2, (lz0 + lz1) / 2]].map(([u, v]) => { const q = R(u, 0, v); return terrain(q.x, q.z); }));
    const solMax = (lx0, lx1, lz0, lz1) => Math.max(...[[lx0, lz0], [lx1, lz0], [lx0, lz1], [lx1, lz1]].map(([u, v]) => { const q = R(u, 0, v); return terrain(q.x, q.z); }));
    // l'auvent sur ses poteaux
    for (const u of [-1, 1]) { const yb = solMin(u * 4.6 - 0.1, u * 4.6 + 0.1, zf + 2.1, zf + 2.3) - 0.1; a.boite(0.16, y0 + 2.7 - yb, 0.16, P.boisNoir, R(u * 4.6, (y0 + 2.7 + yb) / 2, zf + 2.2)); }
    a.boite(9.8, 0.14, 0.18, P.boisNoir, R(0, y0 + 2.7, zf + 2.2)).boite(10.2, 0.07, 2.8, P.tole, R(0, y0 + 2.95, zf + 1.1, { rx: -0.12, ordre: 'YXZ' }));
    // le comptoir, contre la façade
    const yc = solMax(-5.2, 5.2, zf + 0.06, zf + 0.56) + 0.9, ycb = solMin(-5.2, 5.2, zf + 0.06, zf + 0.56) - 0.12;
    a.boite(10.4, yc - ycb, 0.5, P.bois, R(0, (yc + ycb) / 2, zf + 0.33));
    for (let k = 0; k < 4; k++) {
      const lx = -3.3 + k * 2.2, q = R(lx, 0, zf + 1.22), yk = solMax(lx - 0.85, lx + 0.85, zf + 0.57, zf + 1.87), ykb = solMin(lx - 0.85, lx + 0.85, zf + 0.57, zf + 1.87) - 0.15;
      a.boite(1.7, yk + 0.9 - ykb, 1.3, P.pierre, { ...q, y: (yk + 0.9 + ykb) / 2, nuance: 0.08 })
        .cylindre(0.5, 0.5, 0.05, 14, '#8a8580', { x: q.x, y: yk + 0.92, z: q.z })
        .cylindre(0.46, 0.48, 0.14, 14, P.bois, { x: q.x, y: yk + 1.02, z: q.z })
        .boite(0.5, 0.06, 0.08, P.boisFonce, { x: q.x, y: yk + 1.12, z: q.z, ry: PI });
      vapeurs.push({ x: q.x, z: q.z, y: yk + 1.1, n: 12, haut: 3.6, large: 0.7, taille: 1.6, opacite: 0.5 });
    }
    // (des murs tout autour des fours et du comptoir, le corps à 27 cm : avant, un seul, rond à ses bouts, qui arrêtait un
    // mètre avant le bout de la rangée, et laissait entrer dans le bout du comptoir)
    {
      const C = [[-5.2, zf + 0.08], [-5.2, zf + 0.58], [-4.15, zf + 0.58], [-4.15, zf + 1.87], [4.15, zf + 1.87], [4.15, zf + 0.58], [5.2, zf + 0.58], [5.2, zf + 0.08]].map(([u, v]) => R(u, 0, v));
      for (let k = 0; k + 1 < C.length; k++) monde.mur(C[k].x, C[k].z, C[k + 1].x, C[k + 1].z, 0.27);
    }
    for (const u of [-1, 1]) { const q = R(u * 4.6, 0, zf + 2.2); monde.cercle(q.x, q.z, 0.38); }
    // les paniers de bambou sur le comptoir (des œufs, des patates douces)
    for (let k = 0; k < 6; k++) {
      const q = R(-4 + k * 1.6, 0, zf + 0.33);
      a.cylindre(0.22, 0.18, 0.14, 10, '#c8a868', { x: q.x, y: yc + 0.07, z: q.z });
      for (let e = 0; e < 4; e++) a.ovale(0.045, k % 2 ? '#c87a4a' : '#f4ead6', { x: q.x + Math.cos(e * 1.7) * 0.1, y: yc + 0.17, z: q.z + Math.sin(e * 1.7) * 0.1, sy: 1.25 }, 6);
    }
    poser(a.fin(), 0, 0, { y: 0 });
  }
  {
    // la placette du bain de pieds (足湯) : un bassin de pierre où l'eau chaude fume, des bancs de bois tout autour, un petit toit
    // sur quatre poteaux ; la fontaine où l'on boit l'eau de la source (飲泉)
    // (2026-10-27, la deuxième liste : « je trouve ça dommage qu'on ne puisse pas y accéder […] faudrait faire vraiment une vraie
    // zone » — on n'atteignait que le devant de son banc nord. La placette fait maintenant partie de la rue, dallée jusqu'à la
    // palissade du fond : on en fait le tour, on s'assoit sur l'un ou l'autre banc, en face de la grand-mère et du petit-fils.
    // Le bassin : une margelle de pierre autour de l'eau, plus bas qu'elle ; avant, un bloc plein, l'eau dedans.)
    const a = atelier(), A = ASHIYU, y = hauteurAllee(A.x, A.z) - 0.04, R = repere(A.x, A.z, 0);
    for (const v of [-1, 1]) a.boite(4.4, 0.47, 0.2, P.pierre, R(0, y + 0.115, v * 0.7, { nuance: 0.07 }));
    for (const u of [-1, 1]) a.boite(0.2, 0.47 + 0.004, 1.2, P.pierreFonce, R(u * 2.1, y + 0.115, 0, { nuance: 0.07 }));
    a.boite(4.0, 0.05, 1.2, '#7ab8b0', R(0, y + 0.2, 0, { trait: false }));
    // (la planche sous les bancs un peu plus courte qu'eux : leurs bouts dans le même plan scintillaient, 2026-10-28)
    for (const v of [-1, 1]) a.boite(4.6, 0.08, 0.42, P.bois, R(0, y + 0.44, v * 1.05)).boite(4.5, 0.4, 0.1, P.boisFonce, R(0, y + 0.22, v * 1.22));
    for (const u of [-1, 1]) for (const v of [-1, 1]) a.boite(0.14, 2.6, 0.14, P.boisNoir, R(u * 2.3, y + 1.3, v * 1.45));
    // (les poutres sur les poteaux, le toit posé dessus ; avant le 2026-10-27, une grosse planche noire qui traversait le toit
    // sur ses bords)
    for (const v of [-1, 1]) a.boite(4.8, 0.18, 0.16, P.boisNoir, R(0, y + 2.55, v * 1.45));
    for (const u of [-1, 1]) a.boite(0.16, 0.2, 2.74, P.boisNoir, R(u * 2.3, y + 2.54, 0));
    a.toitJapon(5.6, 3.9, 0.9, 0.35, { ...R(0, y + 2.62, 0), tuile: P.tuileShiro, tuile2: P.tuileShiroClaire, bord: '#4a4a4e', rangs: 12 });
    a.boite(3.0, 0.3, 1.6, P.boisNoir, R(0, y + 2.75, 0));
    vapeurs.push({ x: A.x, z: A.z, y: y + 0.2, n: 10, haut: 1.8, large: 1.0, taille: 1.4, opacite: 0.4 });
    // (le banc sud, tourné vers la rue : la grand-mère et son petit-fils, qu'on voit en arrivant ; le banc nord, pour le voyageur)
    for (const v of [-1, 1]) {
      bancs.push({ de: [A.x - 2.0, A.z + v * 1.05], a: [A.x + 2.0, A.z + v * 1.05], y: y + 0.48, cap: v > 0 ? PI : 0, vue: 0.4, ashiyu: true, rue: v > 0 });
      monde.mur(A.x - 2.3, A.z + v * 1.1, A.x + 2.3, A.z + v * 1.1, 0.48);
    }
    // (aux deux bouts du bassin, un mur, le corps à 27 cm de sa margelle : un bloc plein si bas se franchit comme une marche)
    for (const u of [-1, 1]) monde.mur(A.x + u * 2.2, A.z - 0.8, A.x + u * 2.2, A.z + 0.8, 0.27);
    for (const u of [-1, 1]) for (const v of [-1, 1]) monde.cercle(A.x + u * 2.3, A.z + v * 1.45, 0.3);
    emprises.push({ x: A.x, z: A.z, l: 4.8, p: 3.1 });
    // la fontaine de l'eau qui se boit (飲泉) : une vasque de pierre tournée, creusée, l'eau juste sous son bord ; derrière, un
    // bambou debout, et de son haut, un bambou couché (le kakei) d'où l'eau coule dans la vasque ; deux louches de bambou
    // posées en travers ; des pierres à son pied ; son petit écriteau (2026-10-27 : « la fontaine de bambou est un peu mal
    // faite » — un cylindre de pierre, un bâton vert posé de travers, un piquet)
    {
      const { x: fx, z: fz } = FONTAINE, fy = terrain(fx, fz), Rf = repere(fx, fz, -PI / 2 - 0.3), V = '#8fb04a', VF = '#6e8a3a';
      const vasque = [[0.01, -0.1], [0.36, -0.1], [0.37, 0.0], [0.35, 0.5], [0.33, 0.56], [0.27, 0.56], [0.26, 0.51], [0.01, 0.51]].map(([r, h]) => new THREE.Vector2(r, h));
      a.piece(new THREE.LatheGeometry(vasque, 12), P.pierre, { x: fx, y: fy, z: fz, nuance: 0.08 })
        .cylindre(0.265, 0.265, 0.02, 12, '#9ad0c8', { x: fx, y: fy + 0.525, z: fz, trait: false });
      // le bambou debout et ses nœuds ; le bambou couché, du haut du premier jusqu'au-dessus du milieu de la vasque ; le filet d'eau
      const pied = Rf(0, 0, -0.5), bout = Rf(0, 0, -0.04), yk = fy + 0.98;
      a.cylindre(0.05, 0.055, yk + 0.06 - fy + 0.1, 7, V, { x: pied.x, y: (yk + 0.06 + fy - 0.1) / 2, z: pied.z });
      for (const h of [0.3, 0.62]) a.cylindre(0.058, 0.058, 0.03, 7, VF, { x: pied.x, y: fy + h, z: pied.z, trait: false });
      a.baton([pied.x, yk, pied.z], [bout.x, yk - 0.05, bout.z], 0.035, V, 7).baton([bout.x, yk - 0.07, bout.z], [bout.x, fy + 0.53, bout.z], 0.011, '#d6eef0', 5, { trait: false });
      // les deux louches (hishaku) en travers du bord
      for (const [u, du] of [[0.13, 0.06], [-0.11, -0.1]]) {
        const c0 = Rf(u, 0, 0.17), c1 = Rf(u + du, 0, 0.5);
        a.cylindre(0.042, 0.038, 0.07, 8, '#c8b46a', { x: c0.x, y: fy + 0.6, z: c0.z }).baton([c0.x, fy + 0.6, c0.z], [c1.x, fy + 0.585, c1.z], 0.009, '#c8b46a', 4);
      }
      for (let k = 0; k < 5; k++) { const t = k * 1.3 + 0.4, r = 0.13 + 0.07 * hasard(k, fx); a.rocher(fx + Math.cos(t) * 0.48, fy + 0.02, fz + Math.sin(t) * 0.48, r, k % 2 ? P.pierreFonce : '#8f8578', { sy: 0.5 }); }
      // l'écriteau 飲泉 (« l'eau de la source, qui se boit »)
      const e = Rf(0.5, 0, -0.42);
      a.boite(0.05, 0.85, 0.05, P.bois, { x: e.x, y: fy + 0.4, z: e.z }).boite(0.32, 0.2, 0.03, '#4a3628', { ...Rf(0.5, fy + 0.75, -0.39) });
      ecrire({ x: fx, y: fy, z: fz, ry: -PI / 2 - 0.3 }, { texte: '飲泉', x: 0.5, y: 0.75, z: -0.37, l: 0.26, h: 0.14, fond: '#efe6d2', encre: '#2a1e18' });
      monde.cercle(fx, fz, 0.84);
      { const q = Rf(0.5, 0, -0.4); monde.cercle(q.x, q.z, 0.42); }
      emprises.push({ x: fx, z: fz, r: 0.6 });
    }
    poser(a.fin(), 0, 0, { y: 0 });
  }
  {
    // l'arrêt de bus « 鉄輪 » (le départ) : l'abri, son banc, le poteau et son disque, l'horaire
    const a = atelier(), y = terrain(ARRET.x, ARRET.z), R = repere(ARRET.x, ARRET.z, PI);
    for (const u of [-1, 1]) a.boite(0.1, 2.4, 0.1, '#8a8784', R(u * 1.6, y + 1.2, -0.5));
    a.boite(3.6, 2.2, 0.06, '#c9d4d2', R(0, y + 1.25, -0.52, { trait: false })).boite(3.6, 0.1, 1.5, '#5d8a86', R(0, y + 2.42, 0.1));
    a.boite(2.8, 0.08, 0.45, P.bois, R(0, y + 0.45, -0.2)).boite(0.08, 0.45, 0.08, '#6a6764', R(-1.1, y + 0.22, -0.2)).boite(0.08, 0.45, 0.08, '#6a6764', R(1.1, y + 0.22, -0.2));
    bancs.push({ de: [R(-1.2, 0, -0.2).x, R(-1.2, 0, -0.2).z], a: [R(1.2, 0, -0.2).x, R(1.2, 0, -0.2).z], y: y + 0.49, cap: 0, vue: 0.35 });
    monde.mur(R(-1.45, 0, -0.25).x, R(-1.45, 0, -0.25).z, R(1.45, 0, -0.25).x, R(1.45, 0, -0.25).z, 0.5);
    const q = R(2.3, 0, 0.8);
    a.cylindre(0.04, 0.05, 2.5, 8, '#c8c4bc', { x: q.x, y: y + 1.25, z: q.z }).cylindre(0.32, 0.32, 0.04, 20, '#e8452e', { x: q.x, y: y + 2.45, z: q.z, rx: PI / 2, ry: PI / 2 + 0.2 });
    ecrire({ x: q.x, y, z: q.z, ry: -PI / 2 + 0.2 }, { texte: '鉄輪', x: 0, y: 2.45, z: 0.03, l: 0.42, h: 0.3, fond: '#f4f0e6', encre: '#2a2a30', forme: 'rond' });
    ecrire({ x: ARRET.x, y, z: ARRET.z, ry: 0 }, { texte: '鉄輪 かんなわ', sous: '別府駅 ⇄ 鉄輪', x: 0, y: 1.6, z: 0.47, l: 1.4, h: 0.5, fond: '#f4f0e6', encre: '#2a2a30' });
    monde.mur(R(-1.7, 0, -0.55).x, R(-1.7, 0, -0.55).z, R(1.7, 0, -0.55).x, R(1.7, 0, -0.55).z, 0.3);
    monde.cercle(q.x, q.z, 0.3);
    poser(a.fin(), 0, 0, { y: 0 });
  }
  {
    // la rue : ses caniveaux de pierre des deux côtés, leurs grilles d'où monte la vapeur ; les lampadaires de bois et leur lanterne
    const a = atelier(), faits = new Set();
    let s = 0;
    for (let i = 0; i + 1 < RUE.length; i++) {
      const [x0, z0] = RUE[i], [x1, z1] = RUE[i + 1], l = Math.hypot(x1 - x0, z1 - z0), ux = (x1 - x0) / l, uz = (z1 - z0) / l;
      for (const cote of [-1, 1]) {
        const nx = -uz * cote * (CHEMINS[0].w + 0.25), nz = ux * cote * (CHEMINS[0].w + 0.25);
        for (let d = 0; d < l; d += 2) {
          const x = x0 + ux * (d + 1) + nx, z = z0 + uz * (d + 1) + nz, y = terrain(x, z);
          // (bout à bout, une pierre sur deux un rien plus haute et plus étroite : leurs bouts se recouvrent sans scintiller ;
          // là où une allée entre dans un enfer, le caniveau passe sous une grille de fonte, au ras du sol)
          const k = Math.round((s + d) / 2), entree = CHEMINS.some((ch) => !ch.rue && surLaLigne(ch.pts, x, z).d < ch.w + 0.6);
          if (entree) {
            a.boite(2.02, 0.1, 0.44 - (k % 2) * 0.02, '#4a4542', { x, y: y - 0.03 + (k % 2) * 0.006, z, ry: -Math.atan2(uz, ux), trait: false });
            for (let b = -0.85; b < 0.9; b += 0.17) a.boite(0.05, 0.02, 0.4, '#2e2a28', { x: x + ux * b, y: y + 0.03, z: z + uz * b, ry: -Math.atan2(uz, ux), trait: false });
            continue;
          }
          a.boite(2.02, 0.12, 0.42 - (k % 2) * 0.02, '#8f887c', { x, y: y - 0.02 + (k % 2) * 0.006, z, ry: -Math.atan2(uz, ux), nuance: 0.07 });
          // une grille toutes les dix-huit mètres environ, la vapeur qui en sort ; (au coude de deux segments, le même numéro
          // revenait : deux lampadaires au même endroit)
          if (faits.has(`${cote},${k}`)) continue;
          faits.add(`${cote},${k}`);
          if (k % 9 === (cote > 0 ? 2 : 6)) {
            a.boite(0.6, 0.02, 0.36, '#3a3634', { x, y: y + 0.05, z, ry: -Math.atan2(uz, ux), trait: false });
            vapeurs.push({ x, z, y: y + 0.05, n: 14, haut: 3.4, large: 0.8, taille: 1.8, opacite: 0.4 });
          }
          // un lampadaire tous les seize mètres, d'un côté puis de l'autre, au bord de la rue, avant le caniveau ; jamais devant
          // l'entrée d'un enfer (2026-10-27 : il y en avait un au milieu du passage, devant le portail de l'enfer de la mer…) ni
          // devant l'abri du bus (2026-10-27, la deuxième liste : au caniveau, à un pas des façades, leur lanterne entrait dans
          // les toits des maisons basses, dans l'enseigne 甘味処, dans l'abri du bus ; à travers les enfers, ils étaient plantés
          // dans la haie)
          const lx = x - nx + (-uz * cote) * (CHEMINS[0].w - 0.55), lz = z - nz + ux * cote * (CHEMINS[0].w - 0.55);
          if (k % 8 === (cote > 0 ? 0 : 4) && Math.hypot(lx - ARRET.x, lz - ARRET.z) > 3.6 && !presDunBassin(lx, lz, 2) && !CHEMINS.some((ch) => !ch.rue && surLaLigne(ch.pts, lx, lz).d < ch.w + 1.2)) {
            const ly = terrain(lx, lz);
            a.cylindre(0.07, 0.09, 3.3, 7, P.boisNoir, { x: lx, y: ly + 1.65, z: lz }).boite(0.32, 0.4, 0.32, P.shoji, { x: lx, y: ly + 3.45, z: lz })
              .boite(0.44, 0.06, 0.44, P.boisNoir, { x: lx, y: ly + 3.69, z: lz }).boite(0.4, 0.05, 0.4, P.boisNoir, { x: lx, y: ly + 3.2, z: lz });
            lumieres.push({ x: lx, y: ly + 3.45, z: lz, halo: 0.5, sol: ly, r: 4.2 });
            monde.cercle(lx, lz, 0.4);
          }
        }
      }
      s += l;
    }
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Les enfers : leurs enseignes, leurs portails
  {
    const a = atelier();
    // (dans la ligne de la haie, au bord de l'entrée, la haie arrêtée contre leurs poteaux ; 2026-10-27, la deuxième liste :
    // celle du chaudron, plantée au milieu de la trouée de la haie, était au milieu de l'entrée)
    const surLaHaie = (x, sg) => zRue(x) + sg * HAIE;
    enseigneEnfer(a, -13.9, surLaHaie(-13.9, -1), 0, '海地獄');
    enseigneEnfer(a, 16.75, surLaHaie(16.75, -1), 0, '鬼石坊主地獄', { h: 3.6 });
    enseigneEnfer(a, 2.7, surLaHaie(2.7, 1), PI, 'かまど地獄');
    enseigneEnfer(a, -25.4, surLaHaie(-25.4, 1), PI, '白池地獄');
    // (entre le sentier et l'allée du geyser, tournée vers le carrefour : avant le 2026-10-27, au milieu de l'allée)
    enseigneEnfer(a, -59.2, -64.2, -2.17, '血の池地獄');
    enseigneEnfer(a, -30.0, -75.4, -1.9, '龍巻地獄');
    // le portail vermillon de l'enfer de la mer : deux piliers, la poutre, un petit toit de tuiles
    {
      // (15 cm derrière la haie de la rue : ses piliers y entraient)
      const x = -18.0, z = -6.95, y = hauteurAllee(x, z) - 0.04;
      for (const u of [-1, 1]) {
        a.cylindre(0.17, 0.19, 3.4, 10, P.vermillon, { x: x + u * 2.25, y: y + 1.7, z }).cylindre(0.26, 0.28, 0.3, 10, P.pierreFonce, { x: x + u * 2.25, y: y + 0.12, z });
        monde.cercle(x + u * 2.25, z, 0.42);
        // (la clôture de l'allée s'arrête contre lui : 2026-10-28, ses bambous traversaient le pied des deux piliers)
        emprises.push({ x: x + u * 2.25, z, r: 0.3 });
      }
      a.boite(5.2, 0.32, 0.36, P.vermillon, { x, y: y + 3.1, z }).boite(4.6, 0.2, 0.26, P.vermillonFonce, { x, y: y + 2.55, z });
      a.toitJapon(6.2, 1.8, 0.75, 0.25, { x, y: y + 3.26, z, tuile: P.tuileShiro, tuile2: P.tuileShiroClaire, bord: '#4a4a4e', rangs: 14, murs: { l: 2.58, p: 0.17, y: 0, c: P.vermillon } });
      // (sous le toit, sans le traverser à ses bouts)
      a.boite(3.6, 0.3, 0.6, P.vermillonFonce, { x, y: y + 3.36, z });
      ecrire({ x, y, z, ry: 0 }, { texte: '海地獄', x: 0, y: 2.55, z: 0.135, l: 1.2, h: 0.18, fond: null, encre: '#f8f0dc' });
    }
    poser(a.fin(), 0, 0, { y: 0 });
  }
  // ---------------------------------------------------------------- Les escaliers de pierre (la butte du sanctuaire Inari)
  for (const es of MARCHES) {
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
      a.boite(2 * es.demi + 0.3 + (k % 2) * 0.02, haut - bas, pas + 0.06, k % 2 ? P.pierre : P.pierreFonce, { x, y: (haut + bas) / 2, z, ry: ang, nuance: 0.07 });
    }
    monde.chemin(es.ligne, es.demi, { sol: 'pierre', droits: true });
    // les torii rouges serrés au-dessus des marches (comme au sanctuaire Inari de l'enfer de la mer), le dernier en haut ; le
    // premier là où l'escalier a quitté l'allée d'en bas (2026-10-27 : il était planté dedans, le compagnon dans son pilier)
    let s0 = 0.7;
    while (s0 < es.L * 0.5 && CHEMINS.some((ch) => !ch.escalier && surLaLigne(ch.pts, point(s0)[0], point(s0)[1]).d < ch.w + 1.45)) s0 += 0.1;
    for (let s = s0; s < es.L - 0.2; s += 1.35) {
      // (les piliers 12 cm au-delà du bout des marches, sans y entrer)
      const [x, z, ang] = point(s), y = es.y0 + ((es.y1 - es.y0) * s) / es.L, c = Math.cos(ang), sn = Math.sin(ang), d = es.demi + 0.27;
      for (const u of [-1, 1]) {
        a.cylindre(0.085, 0.095, 2.55, 8, P.vermillon, { x: x + c * u * d, y: y + 1.2, z: z - sn * u * d })
          .cylindre(0.11, 0.11, 0.22, 8, P.noir, { x: x + c * u * d, y: y + 0.0, z: z - sn * u * d });
        monde.cercle(x + c * u * d, z - sn * u * d, 0.38);
      }
      a.boite(2 * d + 0.7, 0.13, 0.18, P.noir, { x, y: y + 2.55, z, ry: ang }).boite(2 * d + 0.5, 0.12, 0.15, P.vermillon, { x, y: y + 2.44, z, ry: ang })
        .boite(2 * d + 0.2, 0.1, 0.1, P.vermillon, { x, y: y + 2.05, z, ry: ang });
    }
    // (sur les côtés, ni mur ni rien : l'allée de l'escalier s'arrête à 10 cm de ses marches, entre les piliers des torii ;
    // 2026-10-27, la deuxième liste — deux murs à 1,55 m de son milieu, invisibles en bas, dans l'allée, et en haut, sur la place)
  }
  {
    // le petit sanctuaire Inari en haut de la butte (2026-10-28, la troisième liste du propriétaire : « le petit sanctuaire,
    // faudrait que tu le refasses, parce qu'il est un peu mal fait » — une boîte vermillon sous un toit à deux pans, une poutre
    // noire posée en travers de son faîte, une boîte devant, deux renards en boules). Un hokora au toit « nagare » (流造) : le
    // socle de pierre en deux assises ; sur sa sole, quatre poteaux vermillon, des murs blancs, devant les portes à claire-voie
    // (狐格子) sur le noir de l'intérieur, la petite véranda et sa marche ; le toit de cuivre vert-de-gris, son long pan avant
    // qui couvre la véranda, creusé, son faîtage ; la corde sacrée et ses papiers, la cloche et sa corde ; devant, le tronc des
    // offrandes (賽銭) ; deux renards de pierre blanche assis sur leur piédestal, tournés l'un vers l'autre, la queue dressée, le
    // bavoir rouge, l'un la clé du grenier à riz dans la gueule, l'autre le joyau ; derrière, deux bannières rouges
    // (正一位稲荷大明神). Le devant regarde vers +z dans son repère (la place, en haut de l'escalier).
    const a = atelier(), ry = Math.atan2(-51.6 - INARI.x, -45.2 - INARI.z), R = repere(INARI.x, INARI.z, ry), y = terrasses(INARI.x, INARI.z, 0);
    const BLANC = '#f2ece0', VERM = P.vermillon, VERMF = '#a8301e', CUIVRE = '#5f8f7c', CUIVREF = '#3f6458', PIERRE_RENARD = '#eeeae0';
    const sol = (lx, lz) => { const q = R(lx, 0, lz); return terrain(q.x, q.z); };
    // le socle, ses deux assises
    a.boite(2.4, 0.65, 2.3, P.pierreFonce, R(0, y - 0.075, 0, { nuance: 0.08 })).boite(2.0, 0.12, 2.0, P.pierre, R(0, y + 0.31, 0, { nuance: 0.06 }));
    // la sole ; les poteaux ; les murs blancs entre eux (leurs bouts dans les poteaux) ; le noir derrière les portes, leur cadre,
    // leurs barreaux (les barreaux dans l'épaisseur du cadre, les traverses un rien devant eux)
    const Z = -0.15;
    a.boite(1.46, 0.08, 1.16, P.boisFonce, R(0, y + 0.41, Z));
    for (const u of [-1, 1]) for (const v of [-1, 1]) a.boite(0.09, 0.9, 0.09, VERM, R(u * 0.66, y + 0.9, Z + v * 0.52));
    a.boite(1.24, 0.82, 0.04, BLANC, R(0, y + 0.88, Z - 0.52));
    for (const u of [-1, 1]) a.boite(0.04, 0.82, 0.96, BLANC, R(u * 0.66, y + 0.88, Z));
    a.boite(1.2, 0.74, 0.03, '#2a1e18', R(0, y + 0.86, Z + 0.48, { trait: false }));
    for (const h of [0.48, 1.26]) a.boite(1.32, 0.07, 0.06, VERM, R(0, y + h, Z + 0.52));
    a.boite(0.05, 0.74, 0.05, VERM, R(0, y + 0.87, Z + 0.52));
    for (let k = 1; k < 16; k++) if (k !== 8) a.boite(0.018, 0.71, 0.018, VERMF, R(-0.6 + k * 0.075, y + 0.87, Z + 0.53, { trait: false }));
    for (const h of [0.66, 0.87, 1.08]) a.boite(1.2, 0.018, 0.018, VERMF, R(0, y + h, Z + 0.546, { trait: false }));
    // les poutres sur les poteaux
    for (const u of [-1, 1]) a.boite(0.08, 0.08, 1.2, VERM, R(u * 0.66, y + 1.39, Z));
    for (const v of [-1, 1]) a.boite(1.42, 0.08, 0.08, VERM, R(0, y + 1.4, Z + v * 0.52));
    // la véranda, sa marche
    a.boite(1.43, 0.05, 0.37, P.bois, R(0, y + 0.47, Z + 0.745)).boite(0.9, 0.06, 0.2, P.bois, R(0, y + 0.4, Z + 1.03));
    // le toit : le pan arrière court, le pan avant long, creusés (plus raides en haut), d'un faîte en zr ; dessus de cuivre,
    // dessous de bois, leurs bords ; le pignon blanc sous lui, au-dessus des poutres
    const yr = 1.95, zr = Z - 0.05, ep = 0.06, LT = 0.98, zAr = Z - 0.86, yAr = 1.4, zAv = Z + 1.27, yAv = 1.2;
    const hautToit = (zz) => (zz <= zr ? yr - (yr - yAr) * (1 - (1 - (zr - zz) / (zr - zAr)) ** 1.7) : yr - (yr - yAv) * (1 - (1 - (zz - zr) / (zAv - zr)) ** 1.7));
    {
      const pos = [], cols = [];
      const quad = (A, B, C, D, c, n) => { tri(pos, cols, A, B, C, c, n); tri(pos, cols, A, C, D, c, n); };
      for (const z1 of [zAr, zAv]) {
        const prof = Array.from({ length: 7 }, (_, i) => { const zz = zr + ((z1 - zr) * i) / 6; return [zz, hautToit(zz)]; });
        for (let i = 0; i + 1 < prof.length; i++) {
          const [za, ya] = prof[i], [zb, yb] = prof[i + 1], ny = Math.abs(zb - za), nz = Math.sign(zb - za) * (ya - yb);
          quad([-LT, ya, za], [LT, ya, za], [LT, yb, zb], [-LT, yb, zb], CUIVRE, [0, ny, nz]);
          quad([-LT, ya - ep, za], [LT, ya - ep, za], [LT, yb - ep, zb], [-LT, yb - ep, zb], '#6a4a36', [0, -ny, -nz]);
          for (const u of [-1, 1]) quad([u * LT, ya, za], [u * LT, yb, zb], [u * LT, yb - ep, zb], [u * LT, ya - ep, za], CUIVREF, [u, 0, 0]);
        }
        const [zb, yb] = prof[prof.length - 1], sg = Math.sign(z1 - zr);
        quad([-LT, yb, zb], [LT, yb, zb], [LT, yb - ep, zb], [-LT, yb - ep, zb], CUIVREF, [0, 0, sg]);
      }
      // (le pignon : de la poutre au dessous du toit, 1 cm sous lui, dans le plan des murs de côté, tourné vers dehors)
      for (const u of [-1, 1]) for (let i = 0; i < 12; i++) {
        const za = Z - 0.56 + (1.12 * i) / 12, zb = Z - 0.56 + (1.12 * (i + 1)) / 12, ha = hautToit(za) - ep - 0.01, hb = hautToit(zb) - ep - 0.01;
        if (ha > 1.44 && hb > 1.44) quad([u * 0.66, 1.43, za], [u * 0.66, 1.43, zb], [u * 0.66, hb, zb], [u * 0.66, ha, za], BLANC, [u, 0, 0]);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      a.piece(geo, CUIVRE, { ...R(0, y, 0), couleurs: cols, nuance: 0.05 });
    }
    a.boite(2.02, 0.08, 0.13, CUIVREF, R(0, y + yr + 0.01, zr));
    // la corde sacrée entre les poteaux de devant, ses papiers ; la cloche sous l'avant du toit, sa corde rouge et blanche
    {
      const P3 = (lx, ly, lz) => { const q = R(lx, y + ly, lz); return [q.x, q.y, q.z]; };
      a.shimenawa([P3(-0.62, 1.3, Z + 0.6), P3(0, 1.22, Z + 0.62), P3(0.62, 1.3, Z + 0.6)], 0.024, [P3(-0.32, 1.22, Z + 0.63), P3(0.32, 1.22, Z + 0.63)]);
      const zc = Z + 0.95, hc = hautToit(zc) - ep;
      a.baton(P3(0, hc + 0.01, zc), P3(0, 1.17, zc), 0.01, P.noir, 4).boule(0.07, '#d8b04a', { ...R(0, y + 1.1, zc) }, 1);
      a.tube([P3(0, 1.04, zc), P3(0, 0.82, zc + 0.02), P3(0, 0.62, zc + 0.05)], 0.022, '#c8402c', { cotes: 6, pas: 10, teinte: (px, py) => (Math.floor(py * 18) % 2 ? '#c8402c' : '#f4efe6') });
    }
    // le tronc des offrandes (賽銭箱), posé devant le socle (2026-10-28, la quatrième liste du propriétaire : « devant le petit
    // sanctuaire refais l'autel qui est mal fait » — six lattes en biais sortaient de son dessus en éventail) : sur deux
    // traverses, une caisse de bois, ses quatre montants, son cadre sombre, des coins de fer noir ; dans le cadre, sur le noir de
    // la fente, cinq barreaux en dos d'âne (des prismes, l'arête en haut : les pièces glissent entre eux) ; « 賽銭 » doré devant
    {
      const yb = sol(0, 1.5), Zb = 1.5, L = 0.74, Pr = 0.4, FER = '#2e2a2c';
      const B = (lx, h, lz, c, x, y, z, o) => a.boite(lx, h, lz, c, R(x, yb + y, Zb + z, o));
      for (const v of [-1, 1]) B(L + 0.04, 0.06, 0.06, P.boisNoir, 0, 0.02, v * 0.14);
      B(L, 0.32, Pr, P.boisFonce, 0, 0.21, 0, { nuance: 0.05 });
      for (const u of [-1, 1]) for (const v of [-1, 1]) {
        B(0.05, 0.325, 0.05, P.boisNoir, (u * L) / 2, 0.2125, (v * Pr) / 2);
        B(0.065, 0.065, 0.065, FER, (u * L) / 2, 0.08, (v * Pr) / 2, { trait: false });
        B(0.07, 0.08, 0.07, FER, (u * L) / 2, 0.405, v * (Pr / 2 - 0.02), { trait: false });
      }
      // le cadre du dessus : devant et derrière d'un bout à l'autre, les côtés entre eux, 5 mm plus bas
      for (const v of [-1, 1]) B(L + 0.06, 0.07, 0.05, P.boisNoir, 0, 0.405, v * (Pr / 2 - 0.015));
      for (const u of [-1, 1]) B(0.05, 0.065, Pr - 0.08, P.boisNoir, u * (L / 2 - 0.015), 0.4025, 0);
      // la fente, noire, et ses barreaux (un prisme couché le long de la caisse, une arête en haut)
      B(L - 0.08, 0.02, Pr - 0.08, '#1e1612', 0, 0.38, 0, { trait: false });
      for (let k = -2; k <= 2; k++) a.cylindre(0.026, 0.026, L - 0.09, 3, P.bois, R(0, yb + 0.404, Zb + k * 0.064, { rz: PI / 2, rx: -PI / 2, ordre: 'YXZ', trait: false }));
      const q = R(0, 0, Zb);
      ecrire({ x: q.x, y: yb, z: q.z, ry }, { texte: '賽銭', x: 0, y: 0.215, z: Pr / 2 + 0.004, l: 0.4, h: 0.19, fond: null, encre: '#f3cf6a' });
      // (des murs à 27 cm de ses bords : le voyageur n'est qu'un point)
      const C = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => R(u * (L / 2 + 0.03), 0, Zb + v * (Pr / 2 + 0.01)));
      for (let k = 0; k < 4; k++) monde.mur(C[k].x, C[k].z, C[(k + 1) % 4].x, C[(k + 1) % 4].z, 0.27);
    }
    // les deux renards (狐), assis sur leur piédestal, tournés l'un vers l'autre
    for (const u of [-1, 1]) {
      const qp = R(u * 1.45, 0, 1.05), yp = sol(u * 1.45, 1.05), yt = yp + 0.6, Rf = repere(qp.x, qp.z, ry - u * 0.4);
      a.boite(0.52, 0.72, 0.52, P.pierreFonce, Rf(0, yp + 0.16, 0, { nuance: 0.07 })).boite(0.58, 0.08, 0.58, P.pierre, Rf(0, yp + 0.56, 0));
      a.ovale(0.16, PIERRE_RENARD, { ...Rf(0, yt + 0.14, -0.04), sx: 1.05, sz: 1.2 }, 12)
        .ovale(0.11, PIERRE_RENARD, { ...Rf(0, yt + 0.33, 0.05, { rx: -0.15 }), sx: 0.95, sy: 1.5, sz: 0.95 }, 10)
        .ovale(0.085, PIERRE_RENARD, { ...Rf(0, yt + 0.52, 0.08), sz: 1.05 }, 10)
        .cone(0.04, 0.14, 6, PIERRE_RENARD, Rf(0, yt + 0.5, 0.2, { rx: PI / 2 }));
      for (const w of [-1, 1]) {
        a.cone(0.032, 0.12, 4, PIERRE_RENARD, Rf(w * 0.045, yt + 0.63, 0.06, { rz: -w * 0.25 }));
        const e0 = Rf(w * 0.05, yt + 0.27, 0.12), e1 = Rf(w * 0.05, yt + 0.02, 0.13);
        a.baton([e0.x, e0.y, e0.z], [e1.x, e1.y, e1.z], 0.026, PIERRE_RENARD, 6);
      }
      const T3 = (lx, ly, lz) => { const q = Rf(lx, yt + ly, lz); return [q.x, q.y, q.z]; };
      a.tube([T3(0, 0.08, -0.17), T3(0, 0.28, -0.27), T3(0, 0.48, -0.22), T3(0, 0.6, -0.1)], 0.046, PIERRE_RENARD, { cotes: 7, pas: 12 });
      a.ovale(0.1, VERM, { ...Rf(0, yt + 0.4, 0.12, { rx: -0.3 }), sy: 0.55, sz: 0.55 }, 10);
      if (u < 0) a.boite(0.15, 0.022, 0.022, '#d8b04a', Rf(0, yt + 0.48, 0.25));
      else a.boule(0.035, '#d8b04a', { ...Rf(0, yt + 0.48, 0.26) }, 1);
      monde.cercle(qp.x, qp.z, 0.56);
    }
    // derrière, deux bannières rouges sur leurs perches (幟), écrites en blanc
    for (const u of [-1, 1]) {
      const yb = sol(u * 1.5, -0.8), q0 = R(u * 1.5, yb - 0.1, -0.8), q1 = R(u * 1.5, yb + 2.3, -0.8), b0 = R(u * 1.5, yb + 2.16, -0.8), b1 = R(u * 1.88, yb + 2.16, -0.8);
      a.baton([q0.x, q0.y, q0.z], [q1.x, q1.y, q1.z], 0.024, P.boisFonce, 6).baton([b0.x, b0.y, b0.z], [b1.x, b1.y, b1.z], 0.014, P.boisFonce, 5);
      a.boite(0.32, 1.38, 0.012, '#c8402c', R(u * 1.69, yb + 1.46, -0.8));
      const q = R(u * 1.69, 0, -0.8);
      ecrire({ x: q.x, y: yb, z: q.z, ry }, { texte: '正一位稲荷大明神', vertical: true, x: 0, y: 1.46, z: 0.008, l: 0.24, h: 1.28, fond: null, encre: '#fff4e8' });
      monde.cercle(q0.x, q0.z, 0.3);
    }
    // (des murs le long de son socle, 27 cm au-delà ; la clôture de la place s'arrête contre lui, ses renards, ses bannières)
    { const C = [[-1.2, -1.15], [1.2, -1.15], [1.2, 1.15], [-1.2, 1.15]].map(([u, v]) => R(u, 0, v)); for (let k = 0; k < 4; k++) monde.mur(C[k].x, C[k].z, C[(k + 1) % 4].x, C[(k + 1) % 4].z, 0.27); }
    { const q = R(0, 0, 0.3); emprises.push({ x: q.x, z: q.z, ry, l: 3.9, p: 3.2 }); }
    poser(a.fin(), 0, 0, { y: 0 });
  }
  // le panier d'œufs de l'enfer de la mer : deux bambous croisés sur la rive, une perche au-dessus de l'eau, et au bout de sa
  // corde, le panier qui trempe dans l'eau bleue (on le remonte pour le tampon)
  const panier = (() => {
    const b = BASSIN.umi, c = Math.cos(b.ry), s = Math.sin(b.ry), u = (TAMAGO.x - b.x) * c - (TAMAGO.z - b.z) * s, v = (TAMAGO.x - b.x) * s + (TAMAGO.z - b.z) * c;
    // (ses deux pieds sur la rive, entre les pierres et la clôture, de part et d'autre : 2026-10-27, la deuxième liste — plantés
    // derrière la rambarde, les bambous la traversaient)
    const t = Math.atan2(v / b.rz, u / b.rx), [bx, bz] = surLeTour(b, t, -1.4);
    const a = atelier();
    for (const dt of [-0.045, 0.045]) { const [px, pz] = surLeTour(b, t + dt, 0.26); a.baton([px, terrain(px, pz) - 0.1, pz], [bx, b.eau + 2.6, bz], 0.05, '#c8b46a', 7); }
    a.boule(0.08, '#8a6a3a', { x: bx, y: b.eau + 2.6, z: bz }, 0);
    poser(a.fin(), 0, 0, { y: 0 });
    // (le panier et sa corde : un objet qui bouge)
    const objet = new THREE.Group(), m = new THREE.MeshLambertMaterial({ color: '#c8a868' });
    const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.26, 0.32, 14, 1, true), m);
    const fond = new THREE.Mesh(new THREE.CircleGeometry(0.26, 14).rotateX(PI / 2), m);
    fond.position.y = -0.16;
    const oeufs = new THREE.Group();
    for (let k = 0; k < 9; k++) {
      const o = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshLambertMaterial({ color: '#f4ead6' }));
      o.scale.y = 1.25; o.position.set(Math.cos(k * 2.4) * 0.16 * (k % 3 ? 1 : 0.4), -0.06 + (k % 2) * 0.05, Math.sin(k * 2.4) * 0.16 * (k % 3 ? 1 : 0.4));
      oeufs.add(o);
    }
    const panierG = new THREE.Group();
    panierG.add(pan, fond, oeufs);
    const corde = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 5), new THREE.MeshLambertMaterial({ color: '#7a6040' }));
    objet.add(panierG, corde);
    let haut = 0, voulu = 0;
    return {
      objet, x: bx, z: bz,
      lever(oui) { voulu = oui ? 1 : 0; },
      maj(dt) {
        haut += (voulu - haut) * Math.min(1, dt * 1.8);
        const y = b.eau - 0.05 + haut * 1.5;
        panierG.position.set(bx, y, bz);
        corde.position.set(bx, (y + 0.16 + b.eau + 2.6) / 2, bz);
        corde.scale.y = Math.max(0.05, b.eau + 2.6 - y - 0.16);
        return [];
      },
    };
  })();
  animes.push(panier);
  vapeurs.push({ x: panier.x, z: panier.z, y: BASSIN.umi.eau + 0.05, n: 12, haut: 2.8, large: 0.8, taille: 1.6, opacite: 0.5 });
  {
    // l'étang des nénuphars géants : leurs grandes feuilles rondes à bord relevé (rouge dessous), quelques fleurs blanches
    const a = atelier(), b = BASSIN.hasu;
    for (const [u, v, r] of [[-3.4, -0.6, 0.95], [-1.4, 1.1, 0.8], [0.6, -1.0, 1.1], [2.8, 0.6, 0.85], [-0.4, 0.4, 0.55], [3.9, -1.1, 0.6], [-4.2, 1.2, 0.5]]) {
      const c = Math.cos(b.ry), s = Math.sin(b.ry), x = b.x + u * c + v * s, z = b.z - u * s + v * c, y = b.eau + 0.025;
      a.cylindre(r, r, 0.03, 22, '#5f8f3a', { x, y, z, trait: false }).piece(new THREE.TorusGeometry(r, 0.035, 4, 26), '#8a3a2a', { x, y: y + 0.03, z, rx: PI / 2 });
      if (r > 0.8) a.ovale(0.12, '#f6f0e4', { x: x + r * 0.4, y: y + 0.12, z: z - r * 0.3, sy: 0.8 }, 8);
    }
    poser(a.fin(), 0, 0, { y: 0, ombre: false });
  }
  {
    // la boutique de l'enfer de la mer (ses gâteaux cuits à la vapeur, ses œufs), et son enseigne
    const a = atelier();
    maison(a, BOUTIQUE_UMI.x, BOUTIQUE_UMI.z, PI / 2, { l: BOUTIQUE_UMI.l, p: BOUTIQUE_UMI.p, etages: 1, noren: '#1f6a9a' });
    enseigneEnfer(a, -12.6, -37.6, PI / 2, '売店', { h: 2.2, l: 0.6 });
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- L'enfer des crânes de moines : ses caillebotis
  // (2026-10-27, la revue : avant, une planche par pas, posée seulement où elle n'en chevauchait pas une autre, et de grands
  // paliers carrés aux coudes et aux croisements, tournés au hasard du segment suivant : des plaques de travers partout. Le
  // plancher est maintenant une bande continue dont les bords se coupent en onglet aux coudes ; les planches sont des bandes de
  // couleur, séparées par un joint sombre, qui tournent doucement d'un onglet à l'autre. Un embranchement passe 6 mm sous
  // le caillebotis qu'il rejoint.)
  const H_BOIS = 0.14, EP_BOIS = 0.05, PLANCHES = [P.caillebotis, P.caillebotisClair, P.caillebotis, P.caillebotisFonce];
  /** Les deux bords d'une ligne brisée à w mètres, coupés en onglet à chaque coude : { G, D } (gauche, droite). */
  const bordsOnglet = (pts, w) => {
    const G = [], D = [], n = pts.length;
    const dir = (i) => { const [x0, z0] = pts[i], [x1, z1] = pts[i + 1], l = Math.hypot(x1 - x0, z1 - z0); return [(x1 - x0) / l, (z1 - z0) / l]; };
    for (let i = 0; i < n; i++) {
      const a0 = dir(Math.max(0, i - 1)), a1 = dir(Math.min(n - 2, i));
      let tx = a0[0] + a1[0], tz = a0[1] + a1[1];
      const tl = Math.hypot(tx, tz) || 1;
      tx /= tl; tz /= tl;
      const k = w / Math.max(0.55, tx * a1[0] + tz * a1[1]);
      G.push([pts[i][0] - tz * k, pts[i][1] + tx * k]); D.push([pts[i][0] + tz * k, pts[i][1] - tx * k]);
    }
    return { G, D };
  };
  // (un embranchement : un bout posé sur un autre caillebotis ; il passe 6 mm dessous, et sous celui-là s'il est lui-même un
  // embranchement : 2026-10-28, deux embranchements qui se rejoignaient étaient au même niveau, leurs planches scintillaient)
  const niveaux = new Map();
  const niveau = (ch) => {
    if (niveaux.has(ch)) return niveaux.get(ch);
    niveaux.set(ch, 0);
    const n = Math.max(0, ...CHEMINS.filter((o) => o !== ch && o.bois && [ch.pts[0], ch.pts[ch.pts.length - 1]].some(([x, z]) => surLaLigne(o.pts, x, z).d < 0.3)).map((o) => niveau(o) + 1));
    niveaux.set(ch, n);
    return n;
  };
  CHEMINS.forEach((ch) => {
    if (!ch.bois) return;
    const a = morceau(ch.pts[0][0], ch.pts[0][1]), w = ch.w + 0.1;
    const dy = -0.006 * niveau(ch), { G, D } = bordsOnglet(ch.pts, w), pos = [], cols = [];
    const yA = (x, z) => hauteurAllee(x, z) + H_BOIS + dy;
    const quad = (A, B, C, Dd, c, n) => { tri(pos, cols, A, B, C, c, n); tri(pos, cols, A, C, Dd, c, n); };
    let numero = 0;
    for (let i = 0; i + 1 < ch.pts.length; i++) {
      const [x0, z0] = ch.pts[i], [x1, z1] = ch.pts[i + 1], l = Math.hypot(x1 - x0, z1 - z0);
      // les planches (27 cm) et leurs joints (3 cm), d'un onglet à l'autre
      const coupes = [0];
      for (let t = 0.27; t < l - 0.12; t += 0.3) coupes.push(t, t + 0.03);
      coupes.push(l);
      const bord = (f, cote) => { const E = cote ? G : D; return [E[i][0] + (E[i + 1][0] - E[i][0]) * f, E[i][1] + (E[i + 1][1] - E[i][1]) * f]; };
      for (let k = 0; k + 1 < coupes.length; k++) {
        const fa = coupes[k] / l, fb = coupes[k + 1] / l, joint = k % 2 === 1;
        const ga = bord(fa, 1), gb = bord(fb, 1), da = bord(fa, 0), db = bord(fb, 0);
        const ya = yA(x0 + (x1 - x0) * fa, z0 + (z1 - z0) * fa), yb = yA(x0 + (x1 - x0) * fb, z0 + (z1 - z0) * fb);
        const c = joint ? '#3e3226' : PLANCHES[numero++ % 4];
        quad([da[0], ya, da[1]], [db[0], yb, db[1]], [gb[0], yb, gb[1]], [ga[0], ya, ga[1]], c, [0, 1, 0]);
        // les chants, des deux côtés
        for (const [p0, p1, sg] of [[ga, gb, 1], [da, db, -1]]) {
          const nx = -(z1 - z0) / l * sg, nz = (x1 - x0) / l * sg;
          quad([p0[0], ya - EP_BOIS, p0[1]], [p1[0], yb - EP_BOIS, p1[1]], [p1[0], yb, p1[1]], [p0[0], ya, p0[1]], P.caillebotisFonce, [nx, 0, nz]);
        }
      }
    }
    // les deux bouts
    for (const [i, sg] of [[0, -1], [ch.pts.length - 1, 1]]) {
      const [x, z] = ch.pts[i], y = yA(x, z), j = i ? i - 1 : 1, nx = (ch.pts[i][0] - ch.pts[j][0]) * sg * (i ? 1 : -1), nz = (ch.pts[i][1] - ch.pts[j][1]) * sg * (i ? 1 : -1);
      quad([G[i][0], y - EP_BOIS, G[i][1]], [D[i][0], y - EP_BOIS, D[i][1]], [D[i][0], y, D[i][1]], [G[i][0], y, G[i][1]], P.caillebotisFonce, [nx, 0, nz]);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    a.piece(geo, PLANCHES[0], { couleurs: cols, nuance: 0.06 });
    // les longerons sous les bords, et les piquets enfoncés dans la boue tous les deux mètres
    for (const E of [G, D]) {
      const L2 = E.map(([x, z], i) => { const [cx, cz] = ch.pts[i], f = (w - 0.18) / w; return [cx + (x - cx) * f, cz + (z - cz) * f]; });
      for (let i = 0; i + 1 < L2.length; i++) {
        const [x0, z0] = L2[i], [x1, z1] = L2[i + 1], l = Math.hypot(x1 - x0, z1 - z0);
        a.baton([x0, yA(x0, z0) - EP_BOIS - 0.05, z0], [x1, yA(x1, z1) - EP_BOIS - 0.05, z1], 0.05, P.plancheFonce, 4);
        for (let d = 0.3; d < l - 0.2; d += 2.0) { const f = d / l, px = x0 + (x1 - x0) * f, pz = z0 + (z1 - z0) * f; a.boite(0.1, 0.5, 0.1, P.plancheFonce, { x: px, y: yA(px, pz) - EP_BOIS - 0.27, z: pz }); }
      }
    }
    monde.chemin(ch.pts.map(([x, z]) => [x, z, hauteurAllee(x, z) + H_BOIS]), ch.w, { sol: 'bois', droits: true });
  });

  // ---------------------------------------------------------------- L'enfer des crânes de moines : le ronflement du démon
  {
    // (鬼の高いびき : un tas de rochers d'où la vapeur sort par saccades, avec un bruit de ronflement)
    const a = atelier(), y = terrain(TAKAIBIKI.x, TAKAIBIKI.z);
    for (let k = 0; k < 9; k++) {
      const t = k * 0.7, r = 0.5 + 0.4 * hasard(k, 3);
      a.rocher(TAKAIBIKI.x + Math.cos(t) * 1.1, y + 0.2 + 0.3 * (k % 3), TAKAIBIKI.z + Math.sin(t) * 0.9 - 0.4, r, k % 3 ? '#8f8578' : '#cfc7b4', { sy: 0.7 });
    }
    a.rocher(TAKAIBIKI.x, y + 0.9, TAKAIBIKI.z - 0.6, 0.8, '#7f766a', { sy: 0.9 });
    a.cylindre(0.22, 0.3, 0.2, 8, '#3a3430', { x: TAKAIBIKI.x, y: y + 0.45, z: TAKAIBIKI.z + 0.4, trait: false });
    // (son petit panneau, à côté des rochers, tourné vers le bout du caillebotis ; avant le 2026-10-27, au milieu du passage)
    const PX = TAKAIBIKI.x + 1.5, PZ = TAKAIBIKI.z + 2.2, PR = -1.3;
    ecrire({ x: PX, y, z: PZ, ry: PR }, { texte: '鬼の高いびき', x: 0, y: 0.75, z: 0.03, l: 0.9, h: 0.22, fond: '#efe6d2', encre: '#2a1e18', cadre: true });
    a.boite(1.0, 0.3, 0.05, '#4a3628', { x: PX, y: y + 0.75, z: PZ, ry: PR }).boite(0.08, 0.8, 0.08, '#4a3628', { x: PX - Math.sin(PR) * 0.03, y: y + 0.4, z: PZ - Math.cos(PR) * 0.03, ry: PR });
    monde.cercle(TAKAIBIKI.x, TAKAIBIKI.z - 0.3, 1.7);
    emprises.push({ x: TAKAIBIKI.x, z: TAKAIBIKI.z - 0.4, r: 1.8 }, { x: PX, z: PZ, ry: PR, l: 1.1, p: 0.2 });
    // (un mur le long de sa planche, le corps à 30 cm)
    { const cx = Math.cos(PR) * 0.5, cz = -Math.sin(PR) * 0.5; monde.mur(PX - cx, PZ - cz, PX + cx, PZ + cz, 0.32); }
    vapeurs.push({ x: TAKAIBIKI.x, z: TAKAIBIKI.z + 0.4, y: y + 0.5, n: 10, haut: 2.8, large: 0.6, taille: 1.6, opacite: 0.5 });
    poser(a.fin(), 0, 0, { y: 0 });
  }
  // (son ronflement : toutes les sept secondes environ, une bouffée et le bruit ; geyser.bouffees, plus bas)
  const ronflement = {
    objet: new THREE.Group(), t: 3, force: 0,
    ronfler() { this.t = 0; },
    maj(dt, temps, c) {
      this.t -= dt;
      if (this.t > 0) return [];
      this.t = 6 + 3 * Math.random();
      const y = terrain(TAKAIBIKI.x, TAKAIBIKI.z);
      geyser.bouffees?.emettre(TAKAIBIKI.x, y + 0.5, TAKAIBIKI.z + 0.4, { duree: 1.2, n: 14, large: 0.4, haut: 3, taille: 1.1 });
      return Math.hypot(c.joueur.x - TAKAIBIKI.x, c.joueur.z - TAKAIBIKI.z) < 30 ? [{ x: TAKAIBIKI.x, y: y + 0.5, z: TAKAIBIKI.z, nom: 'ronfle', fort: 1.4 }] : [];
    },
  };

  // ---------------------------------------------------------------- L'enfer du chaudron : le grand démon rouge sur son chaudron
  {
    // (le chaudron de fonte sur son fourneau de pierre, le couvercle de bois ; le démon assis dessus, sa massue de fer cloutée
    // levée, sa peau de tigre ; la vapeur sort du fourneau et du bord du couvercle) ; tourné vers la rue (vers −z)
    // (le fourneau tourné d'un huitième de tour : une face devant, la bouche du feu posée à plat dessus ; avant, sur une arête,
    // elle en sortait de biais)
    const a = atelier(), y = terrain(ONI.x, ONI.z), R = repere(ONI.x, ONI.z, PI), RO = P.oniRouge, RF = P.oniFonce;
    a.cylindre(1.5, 1.65, 1.0, 8, P.pierreFonce, R(0, y + 0.3, 0, { nuance: 0.09, ry: PI / 8 }))
      .boite(0.9, 0.5, 0.04, '#2a2422', R(0, y + 0.33, 1.465, { trait: false, rx: -0.138, ordre: 'YXZ' }))
      .boite(0.6, 0.18, 0.03, '#c8582a', R(0, y + 0.16, 1.53, { trait: false, rx: -0.138, ordre: 'YXZ' }));
    // le chaudron (un profil tourné : le fond rond, la panse, la lèvre) et ses deux anses
    {
      const prof = [[0.01, 0], [0.7, 0.05], [1.12, 0.35], [1.28, 0.75], [1.24, 1.0], [1.08, 1.12], [1.12, 1.2], [1.0, 1.24]].map(([r, h]) => new THREE.Vector2(r, h));
      a.piece(new THREE.LatheGeometry(prof, 20), P.fonte, R(0, y + 0.8, 0));
      for (const u of [-1, 1]) a.piece(new THREE.TorusGeometry(0.22, 0.05, 6, 12, PI), P.fonteClair, R(u * 1.32, y + 1.85, 0, { ry: PI / 2 }));
      a.cylindre(1.06, 1.06, 0.14, 20, P.bois, R(0, y + 2.1, 0)).boite(1.6, 0.12, 0.16, P.boisFonce, R(0, y + 2.22, 0));
    }
    const yo = y + 2.17;
    // le démon : assis sur le couvercle, les jambes qui pendent devant, son ventre, son torse musclé
    a.ovale(0.62, RO, R(0, yo + 0.75, 0.05, { sx: 1.05, sy: 1.0, sz: 0.85 }), 14)
      .ovale(0.5, RO, R(0, yo + 1.35, 0.0, { sx: 1.15, sy: 0.8, sz: 0.8 }), 14);
    // la peau de tigre (un pagne jaune rayé de noir) autour des hanches
    a.cylindre(0.66, 0.72, 0.42, 16, P.tigre, { ...R(0, yo + 0.38, 0.06), teinte: (px, py) => (Math.floor(py * 18 + px * 9 + 50) % 3 === 0 ? '#2a2420' : P.tigre) });
    // les jambes : les cuisses vers l'avant, les mollets qui pendent le long du chaudron, les pieds aux ongles
    for (const u of [-1, 1]) {
      const g0 = R(u * 0.36, 0, 0.3), g1 = R(u * 0.44, 0, 0.95), g2 = R(u * 0.46, 0, 1.08);
      a.baton([g0.x, yo + 0.3, g0.z], [g1.x, yo + 0.22, g1.z], 0.21, RO, 10).boule(0.2, RO, { x: g1.x, y: yo + 0.22, z: g1.z }, 1)
        .baton([g1.x, yo + 0.22, g1.z], [g2.x, yo - 0.62, g2.z], 0.17, RO, 10)
        .ovale(0.18, RF, { ...R(u * 0.47, yo - 0.74, 1.18), sx: 0.9, sy: 0.55, sz: 1.3 }, 10);
      a.piece(new THREE.CylinderGeometry(0.19, 0.19, 0.12, 12), P.tigre, { x: g2.x, y: yo - 0.35, z: g2.z });
    }
    // les bras : le droit lève la massue, le gauche posé sur le genou ; les bracelets d'or
    {
      const e = R(-0.62, 0, 0.0), c1 = R(-0.95, 0, 0.25), m = R(-1.0, 0, 0.45);
      a.baton([e.x, yo + 1.42, e.z], [c1.x, yo + 1.85, c1.z], 0.17, RO, 10).boule(0.16, RO, { x: c1.x, y: yo + 1.85, z: c1.z }, 1)
        .baton([c1.x, yo + 1.85, c1.z], [m.x, yo + 2.3, m.z], 0.14, RO, 10).boule(0.18, RO, { x: m.x, y: yo + 2.36, z: m.z }, 1)
        .piece(new THREE.TorusGeometry(0.15, 0.04, 6, 12), P.or, { x: c1.x, y: yo + 2.1, z: c1.z, rx: PI / 2 });
      // la massue (kanabō) : du poing, elle monte en s'élargissant, cloutée
      const k0 = [m.x, yo + 1.95, m.z], k1 = R(-1.08, 0, 0.62), k1y = yo + 3.6;
      a.fut(k0, [k1.x, k1y, k1.z], 0.07, 0.17, '#4a4440', 8);
      for (let i = 0; i < 14; i++) {
        const f = 0.35 + 0.6 * (i / 14), t = i * 2.1;
        a.cone(0.035, 0.08, 4, P.fonteClair, { x: k0[0] + (k1.x - k0[0]) * f + Math.cos(t) * 0.15 * f, y: k0[1] + (k1y - k0[1]) * f, z: k0[2] + (k1.z - k0[2]) * f + Math.sin(t) * 0.15 * f, rz: -Math.cos(t) * PI / 2, rx: Math.sin(t) * PI / 2 });
      }
      const e2 = R(0.62, 0, 0.0), c2 = R(0.8, 0, 0.5), m2 = R(0.5, 0, 0.92);
      a.baton([e2.x, yo + 1.42, e2.z], [c2.x, yo + 1.0, c2.z], 0.17, RO, 10).boule(0.16, RO, { x: c2.x, y: yo + 1.0, z: c2.z }, 1)
        .baton([c2.x, yo + 1.0, c2.z], [m2.x, yo + 0.42, m2.z], 0.14, RO, 10).boule(0.17, RO, { x: m2.x, y: yo + 0.4, z: m2.z }, 1)
        .piece(new THREE.TorusGeometry(0.15, 0.04, 6, 12), P.or, { x: c2.x, y: yo + 0.72, z: c2.z, rx: 0.6 });
    }
    // la tête : grosse et ronde, les cheveux noirs bouclés, deux cornes, les gros yeux, les sourcils, la bouche grande ouverte
    // qui rit, ses crocs
    const T = R(0, yo + 2.05, 0.18);
    a.ovale(0.46, RO, { ...T, sx: 1.0, sy: 0.95, sz: 0.9 }, 16);
    for (let k = 0; k < 13; k++) {
      const t = -PI * 0.15 + (k / 12) * PI * 1.3, q = R(Math.cos(t) * 0.36, 0, 0.18 - Math.abs(Math.sin(t)) * 0.0 - 0.18 + Math.sin(t) * -0.3);
      a.boule(0.13, '#231c1c', { x: q.x, y: yo + 2.32 + 0.12 * Math.sin(k * 1.7), z: q.z }, 1);
    }
    for (const u of [-1, 1]) {
      const c0 = R(u * 0.2, 0, 0.18), c1 = R(u * 0.32, 0, 0.12);
      a.baton([c0.x, yo + 2.4, c0.z], [c1.x, yo + 2.82, c1.z], 0.07, '#f2e6c8', 6).cone(0.065, 0.2, 6, '#f2e6c8', { x: c1.x, y: yo + 2.9, z: c1.z, rz: -u * 0.3 });
      const oe = R(u * 0.17, 0, 0.56);
      a.ovale(0.11, '#ffffff', { x: oe.x, y: yo + 2.12, z: oe.z, sz: 0.5 }, 10).ovale(0.055, '#1e1418', { ...R(u * 0.17, yo + 2.11, 0.62), sz: 0.4 }, 8)
        .boite(0.22, 0.06, 0.06, '#231c1c', R(u * 0.18, yo + 2.27, 0.56, { rz: u * 0.35 }));
    }
    a.ovale(0.09, RF, R(0, yo + 1.98, 0.64), 8);
    // la bouche ouverte, à fleur du visage ; la langue au fond ; la rangée de dents du haut ; les deux crocs qui montent de la
    // lèvre du bas, aux coins (2026-10-27, la deuxième liste : « ses dents sont mal mises » — deux cônes pointés vers le bas,
    // 7 cm devant la bouche, sur les joues)
    a.ovale(0.2, '#5a1a14', { ...R(0, yo + 1.78, 0.47), sx: 1.25, sy: 0.62, sz: 0.42 }, 12);
    a.ovale(0.1, '#c8504a', { ...R(0, yo + 1.705, 0.505), sx: 1.3, sy: 0.35, sz: 0.35, trait: false }, 8);
    for (const u of [-0.09, -0.03, 0.03, 0.09]) a.cone(0.022, 0.05, 5, '#fbf6ea', { ...R(u, yo + 1.875, 0.522 - Math.abs(u) * 0.12), rx: PI, trait: false });
    for (const u of [-1, 1]) a.cone(0.036, 0.14, 6, '#fbf6ea', R(u * 0.17, yo + 1.74, 0.52, { rz: -u * 0.1 }));
    // les oreilles pointues
    for (const u of [-1, 1]) a.ovale(0.1, RO, { ...R(u * 0.46, yo + 2.08, 0.15), sx: 0.4, sy: 1.0, sz: 0.7, rz: u * 0.4 }, 8);
    monde.cercle(ONI.x, ONI.z, 1.9);
    monde.bloc(ONI.x - 1.6, ONI.x + 1.6, ONI.z - 1.6, ONI.z + 1.6, y - 1, y + 2.3);
    emprises.push({ x: ONI.x, z: ONI.z, r: 1.66 });
    // (la vapeur du fourneau sort sur les côtés et derrière : devant, elle cachait le démon)
    vapeurs.push({ x: ONI.x - 1.9, z: ONI.z + 0.4, y: y + 0.4, n: 11, haut: 3.4, large: 0.8, taille: 1.9, opacite: 0.55 });
    vapeurs.push({ x: ONI.x + 1.2, z: ONI.z + 1.4, y: y + 2.1, n: 9, haut: 2.8, large: 0.7, taille: 1.5, opacite: 0.5 });
    poser(a.fin(), 0, 0, { y: 0 });
  }
  {
    // les petits panneaux des bassins (一丁目, 二丁目…) : une planche entre deux piquets, derrière la clôture de l'allée, tournée
    // vers elle (2026-10-27, la deuxième liste : « le poteau passe au milieu du texte » — la planche était enfilée sur son
    // piquet, en haut, et le panneau du démon flottait à côté de son fourneau)
    const a = atelier(), CH = ['', '一丁目', '二丁目', '三丁目', '四丁目', '五丁目', '六丁目'], anneau = CHEMINS[10];
    const choume = (x, z, ry, texte) => {
      const y = terrain(x, z), R = repere(x, z, ry);
      for (const u of [-1, 1]) a.boite(0.06, 1.32, 0.06, P.boisNoir, R(u * 0.35, y + 0.46, 0));
      a.boite(0.66, 0.26, 0.04, '#4a3628', R(0, y + 0.95, 0));
      ecrire({ x, y, z, ry }, { texte, x: 0, y: 0.95, z: 0.022, l: 0.56, h: 0.2, fond: '#efe6d2', encre: '#2a1e18' });
      monde.mur(R(-0.38, 0, 0).x, R(-0.38, 0, 0).z, R(0.38, 0, 0).x, R(0.38, 0, 0).z, 0.27);
    };
    // (le long du rond de l'allée, le point le plus proche du bassin d'où un panneau, 2,05 m vers lui, reste à 85 cm au moins de
    // son bord — sa clôture est à 50 cm ; le bassin du milieu, loin de l'allée : au bord du bassin, du côté de l'allée)
    const longAnneau = [];
    for (let i = 0; i + 1 < anneau.pts.length; i++) {
      const [x0, z0] = anneau.pts[i], [x1, z1] = anneau.pts[i + 1], l = Math.hypot(x1 - x0, z1 - z0);
      for (let t = 0; t < l; t += 0.2) longAnneau.push([x0 + ((x1 - x0) * t) / l, z0 + ((z1 - z0) * t) / l]);
    }
    for (const b of BASSINS) {
      if (!b.choume) continue;
      let mieux = null;
      for (const [px, pz] of longAnneau) {
        const ang = Math.atan2(b.x - px, b.z - pz), x = px + Math.sin(ang) * 2.05, z = pz + Math.cos(ang) * 2.05, e = auBord(b, x, z);
        // (ses deux piquets aussi derrière la clôture : un panneau de biais par rapport à l'allée en approchait l'un)
        const piquets = [-1, 1].map((u) => [x + Math.cos(ang + PI) * u * 0.35, z - Math.sin(ang + PI) * u * 0.35]);
        if (e < 0.85 || e > 2.2 || [[x, z], ...piquets].some(([u, v]) => surLaLigne(anneau.pts, u, v).d < 1.95) || BASSINS.some((o) => o !== b && auBord(o, x, z) < 0.85)) continue;
        const d = Math.hypot(b.x - px, b.z - pz);
        if (!mieux || d < mieux.d) mieux = { x, z, ry: ang + PI, d };
      }
      if (!mieux) {
        const r = plusProche(anneau.pts, b.x, b.z), ang = Math.atan2(r.x - b.x, r.z - b.z);
        let s = 0;
        while (auBord(b, b.x + Math.sin(ang) * s, b.z + Math.cos(ang) * s) < 0.9) s += 0.05;
        mieux = { x: b.x + Math.sin(ang) * s, z: b.z + Math.cos(ang) * s, ry: ang };
      }
      choume(mieux.x, mieux.z, mieux.ry, CH[b.choume]);
    }
    // 二丁目 : le démon sur son chaudron, sur la pelouse à gauche de son fourneau, tourné vers la place d'où on le regarde
    choume(4.2, 13.6, Math.atan2(6.6 - 4.2, 10.4 - 13.6), CH[2]);
    // le bain de pieds du chaudron (2026-10-28, la troisième liste : « il y a un scintillement au niveau du bain de pied » — le
    // devant de son banc et la planche dessous dans le même plan, et leurs bouts ; l'eau était dans un bloc de pierre plein,
    // sous son dessus : on ne la voyait pas). Une margelle de pierre autour de l'eau, plus bas qu'elle ; un banc posé sur
    // trois pieds.
    const x = 15.8, z = 36.2, y = hauteurAllee(x, z) - 0.04;
    for (const v of [-1, 1]) a.boite(3.2, 0.5, 0.16, P.pierre, { x, y: y + 0.02, z: z + v * 0.42, nuance: 0.07 });
    for (const u of [-1, 1]) a.boite(0.16, 0.504, 0.68, P.pierreFonce, { x: x + u * 1.52, y: y + 0.022, z, nuance: 0.07 });
    a.boite(2.86, 0.06, 0.66, P.pierreFonce, { x, y: y - 0.08, z }).boite(2.86, 0.04, 0.66, '#6ab8d0', { x, y: y + 0.17, z, trait: false });
    a.boite(3.3, 0.07, 0.38, P.bois, { x, y: y + 0.445, z: z - 0.72 });
    for (const u of [-1, 0, 1]) a.boite(0.12, 0.41, 0.3, P.boisFonce, { x: x + u * 1.4, y: y + 0.205, z: z - 0.72 });
    bancs.push({ de: [x - 1.4, z - 0.72], a: [x + 1.4, z - 0.72], y: y + 0.48, cap: 0, vue: 0.4, ashiyu: true });
    // (la clôture de sa place s'arrête contre lui : avant, elle traversait son banc et son bassin)
    emprises.push({ x, z: z - 0.15, l: 3.75, p: 2.15 });
    // (son petit toit sur quatre poteaux, comme au bain de pieds de la rue)
    for (const u of [-1, 1]) for (const v of [-1, 1]) { a.boite(0.12, 2.4, 0.12, P.boisNoir, { x: x + u * 1.75, y: y + 1.2, z: z - 0.25 + v * 0.95 }); monde.cercle(x + u * 1.75, z - 0.25 + v * 0.95, 0.3); }
    for (const v of [-1, 1]) a.boite(3.66, 0.16, 0.14, P.boisNoir, { x, y: y + 2.36, z: z - 0.25 + v * 0.95 });
    for (const u of [-1, 1]) a.boite(0.14, 0.18, 1.76, P.boisNoir, { x: x + u * 1.75, y: y + 2.35, z: z - 0.25 });
    a.boite(2.4, 0.25, 1.2, P.boisNoir, { x, y: y + 2.55, z: z - 0.25 }).toitJapon(4.6, 3.0, 0.8, 0.35, { x, y: y + 2.42, z: z - 0.25, tuile: P.tuileShiro, tuile2: P.tuileShiroClaire, bord: '#4a4a4e', rangs: 10, murs: { l: 1.75, p: 0.95, y: 0.02, c: P.boisNoir } });
    monde.mur(x - 1.7, z - 0.78, x + 1.7, z - 0.78, 0.48);
    monde.surface(x - 1.6, x + 1.6, z - 0.5, z + 0.5, y + 0.27, { plein: true });
    vapeurs.push({ x, z, y: y + 0.2, n: 9, haut: 1.6, large: 0.9, taille: 1.3, opacite: 0.4 });
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- L'étang blanc, le lac de sang, la tornade
  {
    const a = atelier();
    // l'étang blanc : un banc de bois face à l'eau, deux lanternes de pierre
    {
      const x = -31.6, z = 15.2, y = hauteurAllee(x, z) - 0.04;
      a.boite(2.4, 0.08, 0.42, P.bois, { x, y: y + 0.44, z }).boite(0.1, 0.44, 0.36, P.boisFonce, { x: x - 1.0, y: y + 0.2, z }).boite(0.1, 0.44, 0.36, P.boisFonce, { x: x + 1.0, y: y + 0.2, z });
      bancs.push({ de: [x - 1.0, z], a: [x + 1.0, z], y: y + 0.48, cap: 0, vue: 0.3 });
      monde.mur(x - 1.15, z, x + 1.15, z, 0.36);
      // (hors de l'allée : avant le 2026-10-27, toutes deux étaient dedans, le compagnon passait au travers)
      for (const [lx, lz] of [[-22.3, 17.95], [-45.1, 29.55]]) lanterne(a, lx, lz);
      // le grand érable du bout du jardin, et à son pied, la pierre d'Ippen (PIERRES)
      a.arbreTouffu(-38.3, 36.3, 7.5, ['#6aa846', '#5f9a3e', '#78b250'], { y: terrain(-38.3, 36.3), sorte: 'houppierErable', caduc: true, large: 1.3 });
      monde.cercle(-38.3, 36.3, 0.45);
    }
    // la boutique du lac de sang (sa pommade rouge), son auvent
    maison(a, BOUTIQUE_CHI.x, BOUTIQUE_CHI.z, PI, { l: BOUTIQUE_CHI.l, p: BOUTIQUE_CHI.p, etages: 1, noren: '#a8281c' });
    // le bout ouest de l'allée du lac de sang (2026-10-28, la troisième liste du propriétaire : « à côté de l'enfer rouge, au
    // bout là, il n'y a rien. Et il n'y a pas de barrière, donc il faudrait mettre quelque chose pour bloquer » — l'allée
    // finissait dans l'herbe, deux mètres après le belvédère) : un banc tourné vers le lac, une lanterne de pierre à côté, et
    // derrière la clôture du bout, des buissons
    {
      const ex = -79.6, ez = -74.6, ang = Math.atan2(BASSIN.chinoike.x - ex, BASSIN.chinoike.z - ez), bx = ex - Math.sin(ang) * 1.2, bz = ez - Math.cos(ang) * 1.2;
      const by = hauteurAllee(bx, bz) - 0.04, Rb = repere(bx, bz, ang);
      a.boite(1.9, 0.08, 0.42, P.bois, Rb(0, by + 0.44, 0));
      for (const u of [-1, 1]) a.boite(0.1, 0.44, 0.36, P.boisFonce, Rb(u * 0.75, by + 0.2, 0));
      { const d0 = Rb(-0.8, 0, 0), d1 = Rb(0.8, 0, 0); bancs.push({ de: [d0.x, d0.z], a: [d1.x, d1.z], y: by + 0.48, cap: ang, vue: 0.3 }); }
      { const m0 = Rb(-0.95, 0, 0), m1 = Rb(0.95, 0, 0); monde.mur(m0.x, m0.z, m1.x, m1.z, 0.36); }
      { const q = Rb(1.3, 0, 0.1); lanterne(a, q.x, q.z); }
      for (const [u, v, r] of [[-1.9, -1.5, 0.7], [-0.6, -2.0, 0.8], [0.8, -1.9, 0.75], [2.0, -1.2, 0.65]]) { const q = Rb(u, 0, v); a.buisson(q.x, terrain(q.x, q.z) + 0.4, q.z, r, '#4c7a38', { touffu: true }); }
      batis.push([ex - 3.6, ex + 3.6, ez - 3.6, ez + 3.6]);
    }
    // l'enfer de la tornade : la falaise de rochers derrière le geyser, le grand toit de pierre au-dessus de sa bouche, posé
    // sur des rochers ; les deux rangs de bancs de pierre où l'on attend qu'il jaillisse ; le tableau de l'heure du prochain
    {
      const G = GEYSER, yt = G.toit;
      for (let rang = 0; rang < 3; rang++) for (let k = 0; k < 16; k++) {
        const t = k / 15, x = G.x - 9 + 18 * t + rang * 0.6, z = G.z - 1.6 - rang * 2.2 - 1.4 * Math.sin(t * PI) + (hasard(k, 7 + rang) - 0.5) * 0.8, r = 1.3 + 0.9 * hasard(k, 2 + rang);
        a.rocher(x, terrain(x, z) + r * (0.3 - rang * 0.1), z, r, (k + rang) % 3 ? '#7f766a' : '#9a9082', { sy: 0.85 });
      }
      // les deux piliers de rochers devant, la grande dalle du toit, un peu penchée
      for (const u of [-1, 1]) {
        for (let k = 0; k < 4; k++) a.rocher(G.x + u * 3.4 + (hasard(k, u) - 0.5) * 0.4, G.y + 0.5 + k * 1.0, G.z + 1.2 + (hasard(u, k) - 0.5) * 0.4, 0.75 - k * 0.05, '#8a8174', { sy: 0.8 });
        monde.cercle(G.x + u * 3.4, G.z + 1.2, 1.0);
      }
      a.piece(new THREE.BoxGeometry(9.6, 1.4, 5.6, 6, 2, 3), '#6f685e', { x: G.x, y: yt + 0.7, z: G.z - 0.8, rx: 0.05, nuance: 0.12, deformer: (px, py, pz) => [px * (1 + 0.05 * Math.sin(pz * 3)), py + 0.22 * Math.sin(px * 1.7 + pz) + (py > 0 ? 0.15 * Math.cos(pz * 2.3 + px) : 0), pz] });
      for (let k = 0; k < 6; k++) a.rocher(G.x - 4 + k * 1.6, yt + 1.5 + 0.2 * hasard(k, 4), G.z - 1.6 + (hasard(k, 5) - 0.5) * 2, 0.8 + 0.4 * hasard(k, 6), '#7f766a', { sy: 0.7 });
      // le bassin de pierre autour de sa bouche, la corde basse qu'on ne passe pas
      for (let k = 0; k < 14; k++) { const t = (k / 14) * 2 * PI; a.rocher(G.x + Math.cos(t) * 1.9, G.y + 0.1, G.z + 0.8 + Math.sin(t) * 1.6, 0.35 + 0.15 * hasard(k, 9), '#9a9082', { sy: 0.6 }); }
      for (let k = 0; k <= 6; k++) {
        const x = G.x - 5 + k * (10 / 6), z = G.z + 4.4, y = terrain(x, z);
        a.boite(0.1, 0.8, 0.1, P.bois, { x, y: y + 0.4, z });
        if (k < 6) a.tube([[x, y + 0.72, z], [x + 10 / 12, y + 0.6, z], [x + 10 / 6, terrain(x + 10 / 6, z) + 0.72, z]], 0.018, '#c8b48a', { cotes: 4, pas: 6 });
      }
      monde.mur(G.x - 5.2, G.z + 4.4, G.x + 5.2, G.z + 4.4, 0.3);
      // les bancs de pierre, deux rangs face au geyser (le second un peu plus haut)
      for (const [dz, dh] of [[8.4, 0], [10.6, 0.3]]) {
        const z = G.z + dz, y = hauteurAllee(G.x, z) - 0.04 + dh;
        a.boite(8.4, 0.12, 0.5, P.pierre, { x: G.x, y: y + 0.42, z }).boite(8.0, 0.36 + dh, 0.4, P.pierreFonce, { x: G.x, y: y + 0.18 - dh / 2, z });
        bancs.push({ de: [G.x - 3.8, z], a: [G.x + 3.8, z], y: y + 0.48, cap: PI, vue: 0.25, geyser: true });
        monde.mur(G.x - 4.3, z, G.x + 4.3, z, 0.5, y - 1, y + 0.4);
      }
      // le tableau : « 次の噴出 » (le prochain jaillissement), l'heure à la craie. (2026-10-28, la troisième liste : « il est à
      // l'envers et il est mal fait » — tourné vers la falaise, une planche verte entre deux piquets. Maintenant derrière la
      // clôture des gradins, tourné vers les bancs : deux poteaux plantés, le tableau dans son cadre de bois, l'auget de la
      // craie, un petit toit à deux pans.)
      const { x: tx, z: tz, ry: tr } = TABLEAU, ty = terrain(tx, tz), Rt = repere(tx, tz, tr);
      for (const u of [-1, 1]) a.boite(0.09, 1.95, 0.09, P.boisNoir, Rt(u * 0.66, ty + 0.875, 0));
      a.boite(1.26, 0.8, 0.04, '#2f4a3a', Rt(0, ty + 1.25, 0));
      for (const h of [0.82, 1.68]) a.boite(1.34, 0.06, 0.07, P.bois, Rt(0, ty + h, 0));
      a.boite(1.0, 0.03, 0.09, P.bois, Rt(0, ty + 0.8, -0.05)).boite(0.07, 0.02, 0.02, '#f4f0e6', Rt(0.2, ty + 0.825, -0.07, { trait: false }));
      a.pignon(1.62, 0.24, 0.36, P.tuileShiro, { ...Rt(0, ty + 1.85, 0), ry: tr });
      ecrire({ x: tx, y: ty, z: tz, ry: tr }, { texte: '次の噴出', sous: 'もうすぐ！', x: 0, y: 1.25, z: -0.026, ry: PI, l: 1.1, h: 0.7, fond: '#2f4a3a', encre: '#f4f0e6' });
      { const q0 = Rt(-0.72, 0, 0), q1 = Rt(0.72, 0, 0); monde.mur(q0.x, q0.z, q1.x, q1.z, 0.3); }
    }
    poser(a.fin(), 0, 0, { y: 0 });
  }
  // le geyser : un jet d'eau bouillante qui jaillit jusqu'au toit de pierre, s'y écrase, retombe en pluie ; toutes les minutes
  // environ (le vrai : toutes les trente à quarante minutes) ; la vapeur qui monte autour
  const geyser = creerGeyser(THREE, GEYSER);
  animes.push(geyser, ronflement);
  vapeurs.push({ x: GEYSER.x, z: GEYSER.z + 0.8, y: GEYSER.y - 0.2, n: 14, haut: 3.8, large: 1.0, taille: 2.2, opacite: 0.6 });
  // des bouffées qu'on fait naître (le guide de l'enfer du chaudron et son encens, qui fait doubler la vapeur ; le geyser)
  const bouffees = creerBouffees(THREE);
  animes.push(bouffees);
  geyser.bouffees = bouffees;

  // ---------------------------------------------------------------- Les pierres d'Ippen (le secret)
  const lampeIppen = { x: BASSIN.umi.x, y: BASSIN.umi.eau + 0.6, z: BASSIN.umi.z, halo: 0, sol: BASSIN.umi.eau, r: 3.2, c: '#ffd27a', mobile: true };
  lumieres.push(lampeIppen);
  // (et, quand on a une pierre en main, au-dessus de la clôture de chaque enfer où l'on peut la jeter, 1,4 m plus loin que
  // l'endroit d'où on la jette, vers l'eau : une lueur qui dit où aller)
  const appels = ENFERS.map((e) => {
    const L = LANCERS[e], dx = L.vers[0] - L.x, dz = L.vers[1] - L.z, l = Math.hypot(dx, dz);
    return { e, x: L.x + (dx / l) * 1.4, z: L.z + (dz / l) * 1.4, y: monde.hauteur(L.x, L.z) + 1.1 };
  });
  const pierres = creerPierres(THREE, PIERRES.map((p) => ({ ...p, y: terrain(p.x, p.z) })), lampeIppen, appels);
  // où est la dernière pierre : on le dit à la deuxième pierre ramassée ; ou, si on arrive avec deux pierres ramassées une
  // autre fois, une fois, dès qu'on est libre (creerPierres). (Jusqu'au 2026-10-28, une colonne de lumière dorée montait
  // d'elle, et la caméra la montrait de haut : le propriétaire, « enlève la colonne de lumière ».)
  pierres.montrer = async (jeu) => {
    const d = PIERRES.find((q) => !indiceVu(`ippen-${q.id}`));
    if (!d || secretTrouve('ippen')) return;
    await jeu.dire(jeu.tx('derniere')(jeu.tx('lieuxPierres')[d.id]));
  };
  animes.push(pierres);
  for (const p of PIERRES) monde.cercle(p.x, p.z, 0.3);

  // ---------------------------------------------------------------- Les arbres, le bambou, la ville au loin
  // (où il n'en faut pas : les allées, les places, les bassins, les bâtiments, les terrasses des enfers au milieu)
  // (2026-10-27, la deuxième liste : ni dans la rue et ses abords, où l'on marche, ni dans la haie, ni dans une palissade, ni
  // contre un socle ; ni dans une maison de la ville — leur place est choisie avant les arbres)
  const libreArbre = (x, z, r) => {
    if (surChemins(x, z).d < r + 0.6 || surPlaces(x, z) < r + 0.6) return false;
    if (presDunBassin(x, z, r * 0.6 + 1.0)) return false;
    if (ecartRue(x, z) < r * 0.5 + 0.4 || (x < FIN_HAIE.sud + 1 && Math.abs(surLaLigne(RUE, x, z).d - HAIE) < r * 0.3 + 0.5)) return false;
    if (versPalissade(x, z) < r * 0.3 + 0.45 || emprises.some((e) => dansEmprise(e, x, z, r * 0.3 + 0.3))) return false;
    for (const [x0, x1, z0, z1] of batis) if (x > x0 - r && x < x1 + r && z > z0 - r && z < z1 + r) return false;
    return true;
  };
  // les maisons de la ville : leur place, d'abord (dans la ville, hors de la route — 2026-10-27, des maisons y étaient posées —,
  // des palissades et de la rue et ses abords) ; leur emprise dans batis : les arbres l'évitent
  const maisonsVille = [], jardinsVille = [];
  {
    const PAS_V = 9;
    for (let gx = -16; gx < 114; gx += PAS_V) for (let gz = -100; gz < 46; gz += PAS_V) {
      const x0 = gx + (hasard(gx * 1.3, gz) - 0.5) * 1.2, z = gz + (hasard(gz, gx * 0.7) - 0.5) * 1.2;
      if (!enVille(x0, z) || !libreArbre(x0, z, 4.2)) continue;
      // (un jardin, de temps en temps : un pin)
      if (hasard(x0, z * 1.7) > 0.9) { jardinsVille.push([x0, z]); continue; }
      // (de l'autre côté de la route, au bout de la rue, les maisons lui font face, leur socle au bord du trottoir)
      const enFace = x0 > 88 && x0 < 100.5, l = 6.0 + 1.4 * hasard(x0, z), p = 5.2 + 1.3 * hasard(z, x0), etages = hasard(x0 * 3, z) > 0.5 ? 2 : 1;
      const ry = enFace ? -PI / 2 : (Math.floor(hasard(z * 2, x0) * 4) * PI) / 2, x = enFace ? Math.max(x0, ROUTE.x1 + 0.5 + p / 2 + 0.1) : x0;
      const dx = Math.abs(Math.cos(ry)) * l / 2 + Math.abs(Math.sin(ry)) * p / 2 + 0.15, dz = Math.abs(Math.sin(ry)) * l / 2 + Math.abs(Math.cos(ry)) * p / 2 + 0.15;
      if (x + dx > ROUTE.x0 - 0.3 && x - dx < ROUTE.x1 + 0.3) continue;
      const coins = [[x - dx, z - dz], [x + dx, z - dz], [x - dx, z + dz], [x + dx, z + dz], [x, z - dz], [x, z + dz], [x - dx, z], [x + dx, z]];
      if (coins.some(([u, v]) => ecartRue(u, v) < 0.3)) continue;
      if (PALISSADES.some(([a0, b0, a1, b1]) => { const n = Math.ceil(Math.hypot(a1 - a0, b1 - b0) / 0.3); for (let k = 0; k <= n; k++) { const u = a0 + ((a1 - a0) * k) / n, v = b0 + ((b1 - b0) * k) / n; if (Math.abs(u - x) < dx + 0.1 && Math.abs(v - z) < dz + 0.1) return true; } return false; })) continue;
      maisonsVille.push({ x, z, ry, l, p, etages, loin: Math.min(surChemins(x, z).d, surPlaces(x, z)) > 26 });
      batis.push([x - dx, x + dx, z - dz, z + dz]);
    }
  }
  const VERTS = ['#4f7f3a', '#5a8a40', '#466f34'], VERTS_ERABLE = ['#6aa846', '#5f9a3e', '#78b250'], VERT_AZALEE = ['#4c7a38', '#5a8640'];
  /** Un bambou : une tige verte en nœuds, un peu penchée, ses touffes de feuilles en haut. */
  const bambou = (a, x, z, h) => {
    const y = terrain(x, z), g = hasard(x * 3.1, z * 1.7), dx = (g - 0.5) * 0.12 * h, dz = (hasard(z, x) - 0.5) * 0.12 * h, r = 0.045 + 0.02 * g;
    a.fut([x, y - 0.2, z], [x + dx, y + h, z + dz], r, r * 0.7, '#7aa04a', 5);
    for (let k = 1; k < 6; k++) a.cylindre(r * 1.15, r * 1.15, 0.04, 5, '#5f8a3a', { x: x + (dx * k) / 6, y: y + (h * k) / 6, z: z + (dz * k) / 6, trait: false });
    for (let k = 0; k < 3; k++) a.houppe(0.55 + 0.25 * hasard(k, x), '#6e9a48', { x: x + dx * (0.75 + k * 0.1) + Math.cos(k * 2.1 + g * 6) * 0.4, y: y + h * (0.72 + k * 0.1), z: z + dz * (0.75 + k * 0.1) + Math.sin(k * 2.1 + g * 6) * 0.4, sy: 0.6, sorte: 'persistant' }, 0);
  };
  {
    const PAS_G = 4.0;
    for (let gx = -92; gx < 80; gx += PAS_G) for (let gz = -100; gz < 44; gz += PAS_G) {
      const x = gx + (hasard(gx, gz) - 0.5) * PAS_G * 0.8, z = gz + (hasard(gz, gx) - 0.5) * PAS_G * 0.8;
      const tirage = hasard(x * 0.7 + 3, z * 1.3), dc = Math.min(surChemins(x, z).d, surPlaces(x, z)), y = terrain(x, z), loin = dc > 14;
      // le bois de Shibaseki, le long du sentier : du bambou, des cèdres, des chênes ; autour du coin de Bunbuku, le bambou
      const bois = x < -52 && z < -6 && z > -66;
      // la rue et ses maisons : quelques arbres seulement, dans les jardins ; la ville autour (ses maisons, plus bas)
      const rue = z > -18 && z < 20 && x > 18;
      if (rue || enVille(x, z)) { if (tirage < 0.08 && libreArbre(x, z, 2)) morceau(x, z).pinNuages(x, z, 6 + 3 * hasard(x, z), 1, { y }); continue; }
      if (bois) {
        if (tirage > 0.85) continue;
        const u = hasard(x * 2.1, z * 1.7);
        if (u < 0.5 && libreArbre(x, z, 0.8)) { const a = morceau(x, z); bambou(a, x, z, 7 + 4 * hasard(x, z)); if (libreArbre(x + 1.1, z + 0.7, 0.7)) bambou(a, x + 1.1, z + 0.7, 6 + 4 * hasard(z, x)); }
        else if (u < 0.75 && libreArbre(x, z, 1.8)) morceau(x, z).sugi(x, z, 14 + 6 * hasard(x, z), { y, loin });
        else if (libreArbre(x, z, 2.6)) morceau(x, z).arbreTouffu(x, z, 9 + 5 * hasard(x, z), VERTS, { y, sorte: 'persistant', large: 1.1, loin });
        continue;
      }
      // dans les enfers et autour : des pins, des érables, des azalées taillées (les jardins), plus serrés loin des allées
      if (tirage > (dc > 6 ? 0.62 : 0.4)) continue;
      const u = hasard(x * 2.1, z * 1.7);
      if (u < 0.3 && libreArbre(x, z, 1.4)) morceau(x, z).buisson(x, y + 0.45, z, 0.75 + 0.4 * hasard(x, z), VERT_AZALEE[Math.floor(hasard(z, x) * 2)], { touffu: true });
      else if (u < 0.5 && libreArbre(x, z, 2.2)) morceau(x, z).pinNuages(x, z, 6 + 4 * hasard(x, z), hasard(z, x) > 0.5 ? 1 : -1, { y });
      else if (u < 0.72 && libreArbre(x, z, 2.6)) morceau(x, z).arbreTouffu(x, z, 6 + 3 * hasard(x, z), VERTS_ERABLE, { y, sorte: 'houppierErable', caduc: true, large: 1.2, loin });
      else if (libreArbre(x, z, 2.8)) morceau(x, z).arbreTouffu(x, z, 9 + 5 * hasard(x, z), VERTS, { y, sorte: 'persistant', large: 1.1, loin });
    }
  }
  // le coin de Bunbuku : une clairière dans le bambou, son lampion rouge sur une perche
  {
    const a = atelier(), yl = terrain(LAMPION.x, LAMPION.z);
    a.baton([LAMPION.x, yl - 0.1, LAMPION.z], [LAMPION.x, yl + 2.1, LAMPION.z], 0.03, '#8fb04a', 6).baton([LAMPION.x, yl + 2.0, LAMPION.z], [LAMPION.x + 0.5, yl + 2.05, LAMPION.z + 0.1], 0.02, '#8fb04a', 5)
      .chochin(LAMPION.x + 0.48, yl + 1.82, LAMPION.z + 0.1, 6);
    for (let k = 0; k < 14; k++) { const t = (k / 14) * 2 * PI, r = 4.0 + 0.8 * hasard(k, 2), x = MARCHAND.x - 0.6 + Math.cos(t) * r, z = MARCHAND.z + Math.sin(t) * r; if (libreArbre(x, z, 0.5)) bambou(a, x, z, 6 + 3 * hasard(k, 5)); }
    lumieres.push({ x: LAMPION.x + 0.48, y: yl + 1.82, z: LAMPION.z + 0.1, halo: 0.55, sol: yl, r: 4.2 });
    monde.cercle(LAMPION.x, LAMPION.z, 0.25);
    poser(a.fin(), 0, 0, { y: 0 });
  }
  {
    // les maisons de la ville, serrées le long des ruelles (2026-10-27, la revue : avant, des boîtes de crépi sans porte ni
    // fenêtre, tournées au hasard, sur de la pelouse) : un socle de pierre, les murs de crépi (blanc ou gris) aux poteaux de
    // bois sombre, ou de planches ; une porte coulissante sous son petit auvent, des fenêtres de verre ou de papier (celles-là
    // s'allument la nuit), un bandeau entre les deux étages ; le toit de tuiles grises ; un climatiseur, une cheminée de vapeur
    // sur une maison sur trois. Loin des allées (on n'en voit que le dessus et une face), la façade seule.
    const MURS = [P.crepi, P.crepiGris, P.crepi, P.planche, P.crepiGris, P.plancheFonce];
    const maisonVille = (a, x, z, ry, l, p, etages, loin) => {
      const y = solSous(x, z, ry, l, p), R = repere(x, z, ry), mur = MURS[Math.floor(hasard(x * 7, z) * MURS.length)], bois = mur === P.planche || mur === P.plancheFonce;
      const h = etages * 2.7, g = hasard(x * 1.3 + 4, z * 0.7);
      a.boite(l + 0.12, 1.0, p + 0.12, P.pierreFonce, R(0, y - 0.4, 0, { nuance: 0.08 }));
      a.boite(l, h, p, mur, R(0, y + 0.1 + h / 2, 0));
      if (!bois) for (const u of [-1, 1]) for (const v of [-1, 1]) a.boite(0.16, h, 0.16, P.boisNoir, R(u * (l / 2 - 0.05), y + 0.1 + h / 2, v * (p / 2 - 0.05)));
      if (etages > 1) a.boite(l + 0.08, 0.16, p + 0.08, bois ? P.boisNoir : P.planche, R(0, y + 0.1 + 2.7, 0));
      // une fenêtre sur une face (rf : son tour ; u le long, yb son bas) : le cadre, la vitre ou le papier, un montant
      const fenetre = (lf, pf, rf, u, yb, w, hh) => {
        const Rf = (uu, yy, out) => R(uu * Math.cos(rf) + (pf / 2 + out) * Math.sin(rf), yy, -uu * Math.sin(rf) + (pf / 2 + out) * Math.cos(rf), { ry: rf });
        const papier = hasard(x + u * 3.1 + rf, z + yb) < 0.45;
        a.boite(w, hh, 0.06, papier ? P.shojiCadre : '#4a4642', Rf(u, y + yb + hh / 2, 0.02))
          .boite(w - 0.12, hh - 0.12, 0.02, papier ? P.shoji : '#9fb0b6', Rf(u, y + yb + hh / 2, 0.05, { trait: false }))
          .boite(0.04, hh - 0.12, 0.02, papier ? P.shojiCadre : '#4a4642', Rf(u, y + yb + hh / 2, 0.07, { trait: false }));
      };
      const faces = loin ? [[l, p, 0]] : [[l, p, 0], [l, p, PI], [p, l, PI / 2], [p, l, -PI / 2]];
      for (const [lf, pf, rf] of faces) {
        const n = Math.max(1, Math.floor((lf - 0.8) / 2.4));
        for (let e = 0; e < etages; e++) for (let k = 0; k < n; k++) {
          const u = -((n - 1) * 2.4) / 2 + k * 2.4;
          // (la porte, au rez-de-chaussée de la façade)
          if (rf === 0 && e === 0 && k === Math.floor(n / 2)) continue;
          fenetre(lf, pf, rf, u, 0.1 + e * 2.7 + 1.0, 1.1, 0.95);
        }
      }
      {
        // la porte coulissante, son auvent
        const n = Math.max(1, Math.floor((l - 0.8) / 2.4)), u = -((n - 1) * 2.4) / 2 + Math.floor(n / 2) * 2.4;
        a.boite(1.4, 2.0, 0.06, '#5a4636', R(u, y + 1.1, p / 2 + 0.02)).boite(0.04, 1.9, 0.03, '#3a2c22', R(u, y + 1.1, p / 2 + 0.06, { trait: false }))
          .boite(1.9, 0.06, 0.7, P.tuileShiro, R(u, y + 2.32, p / 2 + 0.33, { rx: 0.2, ordre: 'YXZ' }));
      }
      if (g < 0.35) a.boite(0.75, 0.55, 0.28, '#e6e4dc', R(l / 2 - 1.0, y + 0.45, -p / 2 - 0.16));
      a.boite(l * 0.7, 0.8, p * 0.6, mur, R(0, y + 0.1 + h + 0.35, 0));
      // (loin des allées, un toit moins fin : 4 rangs de tuiles par pan au lieu de 9)
      a.toitJapon(l + 1.0, p + 1.0, 1.35, 0.42, { ...R(0, y + 0.1 + h - 0.02, 0), tuile: P.tuileShiro, tuile2: P.tuileShiroClaire, bord: '#4a4a4e', rangs: loin ? 4 : Math.round(l * 1.4) });
      if (g > 0.66) {
        const q = R(l * 0.25, 0, -p * 0.1);
        a.cylindre(0.13, 0.13, 3, 8, '#8a8784', { x: q.x, y: y + h + 1.2, z: q.z });
        vapeurs.push({ x: q.x, z: q.z, y: y + h + 2.7, n: 10, haut: 7, large: 1.0, taille: 2.2, opacite: 0.75 });
      }
    };
    for (const m of maisonsVille) maisonVille(morceau(m.x, m.z), m.x, m.z, m.ry, m.l, m.p, m.etages, m.loin);
    for (const [x, z] of jardinsVille) if (libreArbre(x, z, 2)) morceau(x, z).pinNuages(x, z, 5 + 3 * hasard(z, x), 1, { y: terrain(x, z) });
  }
  // ---------------------------------------------------------------- Les clôtures : où l'on peut marcher, on le voit
  // (2026-10-27, la revue : rien ne bordait les allées, ni la rue à travers les jardins des enfers ; on butait partout contre
  // des murs invisibles, au milieu de la mousse.) Comme au Pavillon d'or : le long des allées, à 35 cm du bord, une clôture
  // basse de bambou (四つ目垣) dans les jardins, des piquets et une corde le long du sentier du bois, une rambarde basse au bord
  // des caillebotis ; la ligne suit le bord en onglet aux coudes. Le long de la rue, à travers les enfers : un muret de pierre et
  // sa haie taillée, ouverts aux entrées des enfers ; entre les maisons de la rue, des palissades de planches.
  // (2026-10-27, la deuxième liste : « repousse les murs invisibles jusqu'au mur physique ». Chaque clôture va jusqu'au bout :
  // ses morceaux s'arrêtent, au décimètre près, contre ce qui prend le relais — la clôture d'une autre allée ou d'une place, la
  // clôture d'un bassin, la haie de la rue, le socle d'une maison, d'une statue, d'une enseigne (emprises) — et non plus jusqu'à
  // un pas avant ; on marche jusqu'à elles, et dans la rue jusqu'aux haies, aux façades, aux palissades : dansLeCadre.)
  {
    // (un poteau par endroit : deux morceaux de clôture qui se suivent partagent leur bout, et y plantaient deux fois le même)
    // (2026-10-28 : à 5 cm près ne suffisait pas — deux piquets à 8 cm l'un de l'autre, au bain de pieds du chaudron, leurs
    // dessus dans le même plan scintillaient ; maintenant, à moins de 15 cm d'un autre, on ne plante pas)
    const plantes = new Map();
    const planter = (x, z) => {
      const i = Math.round(x * 5), j = Math.round(z * 5);
      for (let a = i - 1; a <= i + 1; a++) for (let b = j - 1; b <= j + 1; b++) if ((plantes.get(`${a},${b}`) || []).some(([u, v]) => Math.hypot(u - x, v - z) < 0.15)) return false;
      const k = `${i},${j}`;
      if (!plantes.has(k)) plantes.set(k, []);
      plantes.get(k).push([x, z]);
      return true;
    };
    /** Les points d'une ligne brisée décalée de e mètres, en onglet aux coudes (sg : le côté, ±1). */
    const decalee = (pts, e, sg) => {
      const n = pts.length, dir = (i) => { const [x0, z0] = pts[i], [x1, z1] = pts[i + 1], l = Math.hypot(x1 - x0, z1 - z0); return [(x1 - x0) / l, (z1 - z0) / l]; };
      return pts.map(([x, z], i) => {
        const a0 = dir(Math.max(0, i - 1)), a1 = dir(Math.min(n - 2, i));
        let tx = a0[0] + a1[0], tz = a0[1] + a1[1];
        const tl = Math.hypot(tx, tz) || 1;
        tx /= tl; tz /= tl;
        const k = e / Math.max(0.5, tx * a1[0] + tz * a1[1]);
        return [x - tz * k * sg, z + tx * k * sg];
      });
    };
    /**
     * Le long de la ligne bord, les morceaux où ici(x, z, ux, uz) est vrai (ux, uz : le sens de la ligne), trouvés à 10 cm
     * près : chaque morceau a ses deux bouts, les coins du bord et un point tous les pas mètres (jamais à moins de 35 cm du
     * suivant). Avant, un point tous les pas mètres : un morceau finissait jusqu'à un pas avant ce qui le coupait, et l'on
     * butait sur rien.
     */
    const lignes = (bord, ici, pas = 0.9) => {
      const pts = [], res = [];
      for (let i = 0; i + 1 < bord.length; i++) {
        const [x0, z0] = bord[i], [x1, z1] = bord[i + 1], l = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.ceil(l / 0.1));
        for (let k = 0; k < n; k++) pts.push([x0 + ((x1 - x0) * k) / n, z0 + ((z1 - z0) * k) / n, k === 0, (x1 - x0) / (l || 1), (z1 - z0) / (l || 1)]);
      }
      pts.push([...bord[bord.length - 1], true, ...pts[pts.length - 1].slice(3)]);
      let run = [];
      const fin = () => {
        if (run.length >= 2) {
          const ligne = [run[0]];
          let acc = 0;
          for (let j = 1; j < run.length; j++) {
            acc += Math.hypot(run[j][0] - run[j - 1][0], run[j][1] - run[j - 1][1]);
            if (j < run.length - 1 && !run[j][2] && acc < pas - 0.05) continue;
            const der = ligne[ligne.length - 1];
            if (ligne.length > 1 && !der[2] && Math.hypot(run[j][0] - der[0], run[j][1] - der[1]) < 0.35) ligne.pop();
            ligne.push(run[j]);
            acc = 0;
          }
          res.push(ligne.map(([x, z]) => [x, z]));
        }
        run = [];
      };
      for (const p of pts) { if (ici(p[0], p[1], p[3], p[4])) run.push(p); else fin(); }
      fin();
      return res;
    };
    /** Une ligne faite par faire(a, points), par morceaux de 15 points au plus (chacun dans le décor de son premier point). */
    const tracer = (ligne, faire) => { for (let s = 0; s + 1 < ligne.length; s += 14) { const l = ligne.slice(s, s + 15); faire(morceau(l[0][0], l[0][1]), l); } };
    const longer = (bord, ici, faire, pas = 0.9) => { for (const l of lignes(bord, ici, pas)) tracer(l, faire); };
    const longueur = (l) => l.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - l[i - 1][0], p[1] - l[i - 1][1]) : 0), 0);
    /**
     * Des lignes rangées dans une grille de 2 m : longe(x, z, ux, uz, e) dit si le point x, z, allant dans le sens ux, uz, longe
     * l'un de leurs segments (dans son sens, à côté de lui, à moins de e mètres).
     */
    const grille = () => {
      const g = new Map();
      return {
        mettre(ligne) {
          for (let i = 0; i + 1 < ligne.length; i++) {
            const [x0, z0] = ligne[i], [x1, z1] = ligne[i + 1], l = Math.hypot(x1 - x0, z1 - z0);
            if (l < 0.01) continue;
            const s = [x0, z0, (x1 - x0) / l, (z1 - z0) / l, l];
            for (let a = Math.floor((Math.min(x0, x1) - 0.5) / 2); a <= Math.floor((Math.max(x0, x1) + 0.5) / 2); a++) {
              for (let b = Math.floor((Math.min(z0, z1) - 0.5) / 2); b <= Math.floor((Math.max(z0, z1) + 0.5) / 2); b++) {
                const k = `${a},${b}`;
                if (!g.has(k)) g.set(k, []);
                g.get(k).push(s);
              }
            }
          }
        },
        longe(x, z, ux, uz, e) {
          return (g.get(`${Math.floor(x / 2)},${Math.floor(z / 2)}`) || []).some(([x0, z0, vx, vz, l]) => {
            if (Math.abs(vx * ux + vz * uz) < 0.7) return false;
            const t = (x - x0) * vx + (z - z0) * vz;
            return t > -0.05 && t < l + 0.05 && Math.abs((x - x0) * vz - (z - z0) * vx) < e;
          });
        },
      };
    };
    /** La clôture basse de bambou (四つ目垣) : des pieux tous les 1,8 m, deux bambous couchés. */
    const bambouBas = (a, pts) => {
      for (let i = 0; i + 1 < pts.length; i++) {
        const [x0, z0] = pts[i], [x1, z1] = pts[i + 1], l = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(l / 1.8));
        for (let k = 0; k <= n; k++) {
          if (k === n && i + 2 < pts.length) continue;
          const x = x0 + ((x1 - x0) * k) / n, z = z0 + ((z1 - z0) * k) / n;
          if (planter(x, z)) a.cylindre(0.032, 0.036, 0.72, 5, '#a88a52', { x, y: terrain(x, z) + 0.26, z });
        }
        for (const hh of [0.28, 0.5]) a.baton([x0, terrain(x0, z0) + hh + i * 0.002, z0], [x1, terrain(x1, z1) + hh + i * 0.002, z1], 0.022, '#b89a62', 5, { trait: false });
      }
    };
    /** Le long du sentier du bois : des piquets de bois et une corde qui pend entre eux. */
    const corde = (a, pts) => {
      for (let i = 0; i + 1 < pts.length; i++) {
        const [x0, z0] = pts[i], [x1, z1] = pts[i + 1], y0 = terrain(x0, z0), y1 = terrain(x1, z1);
        if (i === 0 && planter(x0, z0)) a.boite(0.09, 0.85, 0.09, P.plancheFonce, { x: x0, y: y0 + 0.3, z: z0 });
        if (planter(x1, z1)) a.boite(0.09, 0.85, 0.09, P.plancheFonce, { x: x1, y: y1 + 0.3, z: z1 });
        const xm = (x0 + x1) / 2, zm = (z0 + z1) / 2;
        a.tube([[x0, y0 + 0.66, z0], [xm, (y0 + y1) / 2 + 0.55, zm], [x1, y1 + 0.66, z1]], 0.016, '#c8b48a', { cotes: 4, pas: 5 });
      }
    };
    const pres = (x, z, e) => presDunBassin(x, z, e);
    // les rambardes des caillebotis : leurs lignes d'abord (elles sont dessinées plus bas), pour que les clôtures de bambou ne
    // les doublent pas. Elles vont partout où, 40 cm au-delà, on ne marche pas (2026-10-28, la troisième liste : « quand on
    // arrive sur le ponton […] il y a un endroit sans barrière. On a l'impression qu'on peut y accéder, mais non » — elle
    // s'arrêtait à 2,1 m de l'allée qui y mène, et l'on butait sur rien) ; pas sur un autre caillebotis : elle tourne au coin,
    // contre la rambarde de celui d'à côté.
    const lignesRambardes = [];
    for (const ch of CHEMINS) {
      if (!ch.bois) continue;
      const autres = CHEMINS.filter((o) => o !== ch && o.bois);
      const ici = (x, z) => {
        if (autres.some((o) => surLaLigne(o.pts, x, z).d < o.w + 0.16)) return false;
        const q = plusProche(ch.pts, x, z), l = q.d || 1;
        return !dansLeCadre(x + ((x - q.x) / l) * 0.4, z + ((z - q.z) / l) * 0.4);
      };
      for (const sg of [-1, 1]) lignesRambardes.push(...lignes(decalee(ch.pts, ch.w + 0.16, sg), ici, 1.8));
    }
    // les bassins : là où l'on vient jusqu'à leur bord, la même clôture de bambou que les allées, sur leur tour, à 50 cm de
    // l'eau (2026-10-28, la quatrième liste du propriétaire : « modifie autour de l'enfer bleu pour que toutes les barrières
    // soient les mêmes » — au belvédère du bassin bleu et à son bout ouest, au coin du guide et au sixième bassin du chaudron,
    // une rambarde de bois sombre entre deux clôtures de bambou, qui la doublaient à ses bouts). Un point du tour, tous les
    // 25 cm, est gardé si 37 cm plus loin on marche, sur le sol (la troisième liste : « je comprends pas pourquoi tu as mis
    // double barrière » — la rambarde des bassins était aussi derrière celles des caillebotis et les clôtures des allées) ;
    // pas autour des nénuphars (des pierres basses suffisent, l'eau n'y bout pas).
    const surCaillebotis = (x, z) => CHEMINS.some((ch) => ch.bois && surLaLigne(ch.pts, x, z).d < ch.w + 0.3);
    const auBordOnVient = (x, z) => { const c = surChemins(x, z); return dansLeCadre(x, z) && !(c.c?.bois && c.d < 0.2); };
    const arcs = [];
    for (const b of BASSINS) {
      if (b.sorte === 'nenuphars') continue;
      const nf = Math.max(40, Math.round((2 * PI * Math.max(b.rx, b.rz)) / 0.25)), tour = [], vient = [];
      for (let k = 0; k < nf; k++) {
        const t = (k / nf) * 2 * PI;
        tour.push(surLeTour(b, t, 0.5));
        vient.push(!surCaillebotis(...tour[k]) && auBordOnVient(...surLeTour(b, t, 0.87)));
      }
      if (vient.every(Boolean)) { arcs.push({ ks: [...tour.keys(), 0], tour, ferme: true }); continue; }
      // (en partant d'un point coupé : aucun arc ne fait le tour par le point de départ)
      const k0 = vient.indexOf(false);
      let ks = [];
      for (let j = 1; j <= nf; j++) {
        const k = (k0 + j) % nf;
        if (vient[k]) ks.push(k);
        else { if (ks.length > 1) arcs.push({ ks, tour }); ks = []; }
      }
      if (ks.length > 1) arcs.push({ ks, tour });
    }
    // les barrières déjà là, rambardes des caillebotis et clôtures des bassins : une clôture de bambou qui les longe, dans leur
    // sens, à moins de 60 et 45 cm, ne les double pas (2026-10-28, la quatrième liste : « il y a encore certains endroits où tu
    // as laissé des bouts de barrières qui n'ont pas besoin d'être là » — 1,8 m de bambou le long de la rambarde du bout du
    // caillebotis de l'enfer de boue, 40 cm dans le coin de deux caillebotis, 80 cm à côté du début du caillebotis qui part de
    // la rue, sur la rive des bassins aux bouts de leur rambarde…)
    const rambardesLa = grille(), bassinsLa = grille();
    for (const l of lignesRambardes) rambardesLa.mettre(l);
    for (const { ks, tour } of arcs) bassinsLa.mettre(ks.map((k) => tour[k]));
    // (le ronflement du démon, le geyser : leurs rochers arrêtent)
    const BATIS_CLOTURE = [[GEYSER.x - 7, GEYSER.x + 7, GEYSER.z - 6, GEYSER.z + 4]];
    // (à 33 cm au moins du bord des allées ; d'un caillebotis, le long de sa ligne, pas autour de ses bouts — au bout de celui
    // de l'enfer de boue, dans sa place, la clôture de la place s'arrêtait en rond autour de lui, et il en restait 30 cm entre
    // ce rond et les rochers du démon)
    const horsDesAllees = (x, z) => CHEMINS.every((ch) => {
      if (x < ch.x0 - 4 || x > ch.x1 + 4 || z < ch.z0 - 4 || z > ch.z1 + 4) return true;
      if (!ch.bois) return surLaLigne(ch.pts, x, z).d - ch.w > 0.33;
      const e = ch.w + 0.33;
      for (let i = 0; i + 1 < ch.pts.length; i++) {
        const [x0, z0] = ch.pts[i], [x1, z1] = ch.pts[i + 1], dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz), t = ((x - x0) * dx + (z - z0) * dz) / l;
        if ((t >= 0 && t <= l && Math.abs((x - x0) * dz - (z - z0) * dx) / l < e) || (i > 0 && Math.hypot(x - x0, z - z0) < e)) return false;
      }
      return true;
    });
    // (la clôture d'une place ne s'arrête pas contre sa propre place : entre deux de ses points, à 90 cm l'un de l'autre, elle
    // passe en corde, jusqu'à 8 cm plus près d'elle au bout d'une petite place, et s'y coupait — au coin du grand érable de
    // l'étang blanc, en trois morceaux : 2026-10-28, la quatrième liste)
    const auBordDuJardin = (x, z, sauf = null) => horsDesAllees(x, z) && PLACES.every((p) => p === sauf || aLaPlace(p, x, z) > 0.33) && !pres(x, z, 0.62) && surLaLigne(RUE, x, z).d > HAIE + 0.27
      && !emprises.some((e) => dansEmprise(e, x, z, 0.1))
      && !BATIS_CLOTURE.some(([a0, a1, b0, b1]) => x > a0 + 0.4 && x < a1 - 0.4 && z > b0 + 0.4 && z < b1 - 0.4)
      && !MARCHES.some((es) => surLaLigne(es.ligne, x, z).d < es.demi + 0.6)
      && !(Math.abs(z - (GEYSER.z + 4.4)) < 0.45 && Math.abs(x - GEYSER.x) < 5.3);
    // les clôtures du jardin : celles des allées, puis des places, puis des bouts des allées, chacune pas le long des
    // précédentes, à moins de 30 cm (le rond du bout d'une allée, 5 cm au-delà de sa clôture, la suivait sur 50 cm, et leurs
    // bambous l'un dans l'autre scintillaient : onze bouts d'allées, 2026-10-28, la quatrième liste) ; dessinées après le tri
    // ci-dessous
    const jardin = [], dansLeJardin = grille();
    const iciJardin = (sauf = null) => (x, z, ux, uz) => auBordDuJardin(x, z, sauf) && !rambardesLa.longe(x, z, ux, uz, 0.6) && !bassinsLa.longe(x, z, ux, uz, 0.45)
      && !dansLeJardin.longe(x, z, ux, uz, 0.3);
    // (un morceau de moins de 30 cm n'est pas une clôture : deux pieux côte à côte — 11 cm entre le muret de la rue et un pilier
    // du portail de l'enfer de la mer ; ses voisins se rejoignent plus bas)
    const ajouter = (ls, faire) => { ls = ls.filter((l) => longueur(l) >= 0.3); for (const l of ls) jardin.push({ l, faire }); for (const l of ls) dansLeJardin.mettre(l); };
    for (const ch of CHEMINS) {
      if (ch.rue || ch.escalier || ch.bois) continue;
      ajouter([-1, 1].flatMap((sg) => lignes(decalee(ch.pts, ch.w + 0.35, sg), iciJardin(), ch.foret ? 2.0 : 0.9)), ch.foret ? corde : bambouBas);
    }
    for (const pl of PLACES) {
      if (pl.rue) continue;
      const c = Math.cos(pl.ry), sn = Math.sin(pl.ry), bord = [];
      if (pl.rect) for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, -1]]) { const a = u * (pl.lx + 0.35), b = v * (pl.lz + 0.35); bord.push([pl.x + a * c + b * sn, pl.z - a * sn + b * c]); }
      else {
        // (à 40 cm du bord, partout, le long de la normale de l'ellipse : sa distance n'est juste qu'au premier ordre, elle y
        // paraît d'au moins 35 cm)
        const n = Math.max(12, Math.round((2 * PI * Math.max(pl.rx, pl.rz)) / 0.9));
        for (let i = 0; i <= n; i++) {
          const t = (i / n) * 2 * PI, nx = Math.cos(t) / pl.rx, nz = Math.sin(t) / pl.rz, nl = Math.hypot(nx, nz);
          const u = Math.cos(t) * pl.rx + (nx / nl) * 0.4, v = Math.sin(t) * pl.rz + (nz / nl) * 0.4;
          bord.push([pl.x + u * c + v * sn, pl.z - u * sn + v * c]);
        }
      }
      ajouter(lignes(bord, iciJardin(pl)), bambouBas);
    }
    // les bouts des allées : un rond de clôture autour de chaque bout, là où rien d'autre ne le borde — au bout d'une allée qui
    // finit dans le jardin, il la ferme ; là où deux allées se suivent, il borde le dehors du coude (2026-10-27, la deuxième
    // liste : les clôtures, droites, s'arrêtaient au bout, et l'on butait sur rien dans le rond du bout, ou dans le coin)
    for (const ch of CHEMINS) {
      if (ch.rue || ch.escalier || ch.bois) continue;
      for (const [x0, z0] of [ch.pts[0], ch.pts[ch.pts.length - 1]]) {
        const r = ch.w + 0.4, n = Math.max(12, Math.round((2 * PI * r) / 0.4)), rond = [];
        for (let i = 0; i <= n; i++) { const t = (i / n) * 2 * PI; rond.push([x0 + Math.cos(t) * r, z0 + Math.sin(t) * r]); }
        ajouter(lignes(rond, iciJardin(), ch.foret ? 2.0 : 0.9), ch.foret ? corde : bambouBas);
      }
    }
    const touche = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.15;
    // (deux bouts de clôtures, ou de rambardes, à moins de 35 cm l'un de l'autre se rejoignent, sur le même pieu : il y en
    // avait deux côte à côte, à 16 cm, au coin de la place du démon, et dans les coins de deux caillebotis)
    const rejoindreBouts = (ls) => {
      const fins = ls.flatMap((l, i) => [[l[0], i], [l[l.length - 1], i]]);
      for (let i = 0; i < fins.length; i++) for (let j = i + 1; j < fins.length; j++) {
        const [a, ia] = fins[i], [b, ib] = fins[j], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (ia !== ib && d > 1e-6 && d < 0.35) { b[0] = a[0]; b[1] = a[1]; }
      }
    };
    rejoindreBouts(jardin.map((g) => g.l));
    rejoindreBouts(lignesRambardes);
    // la rambarde basse au bord des caillebotis, 6 cm au-delà du plancher (2026-10-27, la deuxième liste : ses piquets
    // traversaient son bord) ; tracée avant les clôtures du jardin : là où l'une rejoint l'autre, c'est son poteau qui est planté
    const rambarde = (a, pts) => {
      for (let i = 0; i + 1 < pts.length; i++) {
        const [x0, z0] = pts[i], [x1, z1] = pts[i + 1], y0 = hauteurAllee(x0, z0) + H_BOIS, y1 = hauteurAllee(x1, z1) + H_BOIS;
        if (i === 0 && planter(x0, z0)) a.boite(0.08, 0.72, 0.08, P.plancheFonce, { x: x0, y: y0 + 0.26, z: z0 });
        if (planter(x1, z1)) a.boite(0.08, 0.72, 0.08, P.plancheFonce, { x: x1, y: y1 + 0.26, z: z1 });
        a.baton([x0, y0 + 0.58 + i * 0.002, z0], [x1, y1 + 0.58 + i * 0.002, z1], 0.03, P.planche, 4);
        // (le corps s'arrête 30 cm avant la rambarde : le voyageur n'est qu'un point)
        monde.mur(x0, z0, x1, z1, 0.3);
      }
    };
    for (const l of lignesRambardes) tracer(l, rambarde);
    // (un bout libre de clôture à moins de 35 cm du bout d'une rambarde, ou à moins de 75 cm au-delà de lui, va jusqu'à son
    // poteau : à l'entrée des caillebotis, la clôture de l'allée tourne jusqu'au premier poteau de la rambarde ; plus loin à
    // côté d'elle, il y reste)
    const finsRambardes = lignesRambardes.flatMap((l) => [[l[0], l[1]], [l[l.length - 1], l[l.length - 2]]]), finsJardin = jardin.flatMap((g) => [g.l[0], g.l[g.l.length - 1]]);
    const rejoindre = (p) => {
      if (finsJardin.filter((q) => touche(p, q)).length > 1) return null;
      let m = null, dm = 0.75;
      for (const [q, v] of finsRambardes) {
        const d = Math.hypot(q[0] - p[0], q[1] - p[1]), l = Math.hypot(q[0] - v[0], q[1] - v[1]) || 1;
        if (d < dm && (d < 0.35 || ((p[0] - q[0]) * (q[0] - v[0]) + (p[1] - q[1]) * (q[1] - v[1])) / l > -0.05)) { dm = d; m = q; }
      }
      return m;
    };
    for (const g of jardin) {
      const [a, b] = [rejoindre(g.l[0]), rejoindre(g.l[g.l.length - 1])];
      if (a) g.l.unshift(a);
      if (b) g.l.push(b);
    }
    for (const { l, faire } of jardin) tracer(l, faire);
    // les clôtures des bassins : chaque bout rejoint le bout de clôture le plus proche, à 1,1 m au plus (elle s'arrêtait 50 cm
    // au-delà, le long de lui) ; sinon, elle va 50 cm plus loin sur le tour
    const bouts = jardin.filter((g) => g.faire === bambouBas).flatMap((g) => [g.l[0], g.l[g.l.length - 1]]);
    for (const { ks, tour, ferme } of arcs) {
      const pts = ks.filter((_, j) => j % 6 === 0 || j === ks.length - 1).map((k) => tour[k]);
      if (!ferme) {
        for (const sens of [-1, 1]) {
          const k = sens < 0 ? ks[0] : ks[ks.length - 1], [x, z] = tour[k];
          let m = null, dm = 1.1;
          for (const q of bouts) { const d = Math.hypot(q[0] - x, q[1] - z); if (d < dm) { dm = d; m = q; } }
          if (!m) { const k2 = (k + 2 * sens + tour.length) % tour.length; if (!surCaillebotis(...tour[k2])) m = tour[k2]; }
          if (!m) continue;
          // (le point du bout, s'il en est à moins de 35 cm, cède sa place)
          if (Math.hypot(m[0] - x, m[1] - z) < 0.35 && pts.length > 2) { if (sens < 0) pts[0] = m; else pts[pts.length - 1] = m; }
          else if (sens < 0) pts.unshift(m);
          else pts.push(m);
        }
      }
      tracer(pts, bambouBas);
    }
    // les pierres des rives, pas sur un pieu (2026-10-28, la quatrième liste : un pieu de la clôture du belvédère du bassin bleu
    // traversait une pierre ; avant, neuf pieux de la rambarde des bassins ; une pierre s'étend jusqu'à 1,22 fois son rayon) :
    // plus petites, ou pas là
    for (const { b, x, z, r, c } of rochersRive) {
      let rr = r;
      const i = Math.round(x * 5), j = Math.round(z * 5);
      for (let u = i - 4; u <= i + 4; u++) for (let v = j - 4; v <= j + 4; v++) for (const [px, pz] of plantes.get(`${u},${v}`) || []) rr = Math.min(rr, (Math.hypot(px - x, pz - z) - 0.05) / 1.22);
      if (rr >= 0.15) morceau(b.x, b.z).rocher(x, b.eau + 0.18 + rr * 0.25, z, rr, c, { sy: 0.55 });
    }
    // le long de la rue, à travers les enfers (et jusqu'au bain de pieds) : le muret et sa haie, à HAIE du milieu de la rue ;
    // ouverts aux entrées (jusqu'à la clôture de l'allée qui entre) ; les enseignes
    // des enfers dans sa ligne, la haie contre leurs poteaux ; au nord, jusqu'à la boutique おみやげ (2026-10-27, la deuxième
    // liste : elle passait devant sa façade) ; au sud, jusqu'à la palissade du bain de pieds
    // (bout à bout, un morceau sur deux un rien plus épais et plus haut — compté sur tous les morceaux, pas dans chaque ligne :
    // deux lignes qui se suivent repartaient du même côté, et leurs bouts se recouvraient dans le même plan)
    let nMur = 0;
    const murHaie = (a, pts) => {
      for (let i = 0; i + 1 < pts.length; i++) {
        const [x0, z0] = pts[i], [x1, z1] = pts[i + 1], l = Math.hypot(x1 - x0, z1 - z0), xm = (x0 + x1) / 2, zm = (z0 + z1) / 2, ry = Math.atan2(x1 - x0, z1 - z0) + PI / 2;
        const y = Math.min(terrain(x0, z0), terrain(x1, z1), terrain(xm, zm)), j = nMur++ % 2;
        a.boite(l + 0.02, 0.8 + j * 0.004, 0.46 + j * 0.012, j ? P.pierre : P.pierreFonce, { x: xm, y: y + 0.15, z: zm, ry, nuance: 0.07 })
          .boite(l + 0.04, 0.12, 0.52 + j * 0.01, P.pierreFonce, { x: xm, y: y + 0.6 + j * 0.005, z: zm, ry });
        a.boite(l + 0.02, 0.62 + j * 0.006, 0.44 + j * 0.01, '#4f7c3a', { x: xm, y: y + 0.97, z: zm, ry, nuance: 0.1 });
      }
    };
    const iciHaie = (x, z) => !CHEMINS.some((ch) => !ch.rue && surLaLigne(ch.pts, x, z).d < ch.w + 0.35) && surPlaces(x, z) > 0.35
      && !emprises.some((e) => dansEmprise(e, x, z, 0.05)) && !pres(x, z, 1.0);
    for (const sg of [-1, 1]) {
      const fin = sg > 0 ? FIN_HAIE.nord : FIN_HAIE.sud;
      longer(decalee(RUE, HAIE, sg), (x, z) => x < fin - 0.05 && iciHaie(x, z), murHaie, 1.6);
    }
    // le bout ouest de la rue : le muret et sa haie font le tour (avant, la rue finissait en rond dans le sous-bois), ouverts au
    // départ du sentier du bois
    {
      const [xe, ze] = RUE[RUE.length - 1], arc = [];
      for (let t = 0; t <= 16; t++) { const an = -PI / 2 - (t / 16) * PI; arc.push([xe + Math.cos(an) * HAIE, ze + Math.sin(an) * HAIE]); }
      longer(arc, iciHaie, murHaie, 1.6);
    }
    // les palissades de planches (板塀) et leur chaperon de tuiles (PALISSADES) ; derrière le coin de la statue d'Ippen, un muret
    // de pierre ; tous arrêtent le corps à 27 cm (2026-10-27, la deuxième liste : la rue et ses abords, où l'on marche partout)
    let nPal = 0;
    const palissade = (a, x0, z0, x1, z1) => {
      const l = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0) + PI / 2, n = Math.max(1, Math.round(l / 1.8));
      for (let k = 0; k < n; k++) {
        const f0 = k / n, f1 = (k + 1) / n, xa = x0 + (x1 - x0) * f0, za = z0 + (z1 - z0) * f0, xb = x0 + (x1 - x0) * f1, zb = z0 + (z1 - z0) * f1, xm = (xa + xb) / 2, zm = (za + zb) / 2;
        const y = Math.min(terrain(xa, za), terrain(xb, zb)), lk = l / n, j = nPal++ % 2;
        a.boite(lk, 1.8 + j * 0.004, 0.05, P.planche, { x: xm, y: y + 0.85, z: zm, ry })
          .boite(lk + 0.02, 0.07, 0.24 + j * 0.01, P.tuileShiro, { x: xm, y: y + 1.79 + j * 0.004, z: zm, ry })
          .boite(lk + 0.01, 0.3, 0.12 + j * 0.01, P.pierreFonce, { x: xm, y: y - 0.02, z: zm, ry });
        // (le poteau finit dans le chaperon, sous son dessus)
        if (planter(xa, za)) a.boite(0.1, 1.83, 0.1, P.boisNoir, { x: xa, y: y + 0.865, z: za });
        if (k === n - 1 && planter(x1, z1)) a.boite(0.1, 1.83, 0.1, P.boisNoir, { x: x1, y: y + 0.865, z: z1 });
      }
      monde.mur(x0, z0, x1, z1, 0.4);
    };
    {
      // au bout de la rue (2026-10-27 : elle finissait sur un terrain vide, puis de hautes boîtes beiges) : la route qui la
      // croise, ses lignes blanches, la bordure du trottoir d'en face ; la barrière blanche des piétons (on ne traverse pas), de
      // la palissade du coin nord à celle du coin sud
      const a = atelier(), xm = (ROUTE.x0 + ROUTE.x1) / 2;
      for (let zl = -56; zl < 64; zl += 4) for (const xl of [ROUTE.x0 + 0.35, ROUTE.x1 - 0.35]) a.boite(0.15, 0.02, 4.0, '#eeeae0', { x: xl, y: relief(xl, zl) + 0.045, z: zl, trait: false });
      for (let zl = -54; zl < 60; zl += 6) a.boite(0.14, 0.02, 3, '#eeeae0', { x: xm, y: relief(xm, zl) + 0.045, z: zl, trait: false });
      for (let zl = -54; zl < 60; zl += 2) a.boite(0.3, 0.16 + (Math.round(zl / 2) % 2) * 0.004, 2.0, P.pierreFonce, { x: ROUTE.x1 + 0.15, y: terrain(ROUTE.x1 + 0.15, zl) + 0.02, z: zl });
      const xg = EST_RUE, zg0 = -8.4, zg1 = SUD_RUE - 0.1, ng = Math.round((zg1 - zg0) / 1.7);
      for (let k = 0; k <= ng; k++) { const zg = zg0 + ((zg1 - zg0) * k) / ng; a.cylindre(0.035, 0.035, 0.95, 6, '#f2f0ea', { x: xg, y: terrain(xg, zg) + 0.47, z: zg }); }
      for (const hh of [0.5, 0.85]) a.baton([xg, terrain(xg, zg0) + hh, zg0], [xg, terrain(xg, zg1) + hh, zg1], 0.03, '#f2f0ea', 6);
      monde.mur(xg, zg0, xg, zg1, 0.27);
      for (const [x0, z0, x1, z1] of PALISSADES) palissade(a, x0, z0, x1, z1);
      // (le coin d'Ippen : le muret derrière la statue, du mur de la maison d'à côté au bain de vapeur)
      for (let k = 0; k < 4; k++) a.boite(1.52, 1.1 + (k % 2) * 0.004, 0.5, k % 2 ? P.pierre : P.pierreFonce, { x: 27.6 + k * 1.52, y: terrain(27.6 + k * 1.52, NORD_RUE - 0.25) + 0.35, z: NORD_RUE - 0.25, nuance: 0.07 });
      monde.mur(26.84, NORD_RUE - 0.25, 33.32, NORD_RUE - 0.25, 0.52);
      poser(a.fin(), 0, 0, { y: 0 });
    }
  }
  for (const a of morceaux.values()) poser(a.fin(), 0, 0, { y: 0 });
  // la ville au loin : les toits de Beppu qui descendent vers la baie, et partout les fumées des sources (sans trait d'encre,
  // sans ombre). (2026-10-27, la revue : avant, de hautes boîtes beiges coiffées d'un petit toit, des cartons.) Des maisons
  // basses d'un ou deux étages sous un grand toit en croupe (gris, parfois bleu ou brun), leurs fenêtres en bandeau ; des
  // immeubles et des hôtels de béton, leurs rangées de fenêtres (qui s'allument la nuit), plus nombreux et plus hauts vers la
  // mer ; des bosquets (les parcs, les bois des temples). Une seule géométrie par carré de 80 m, faite de quads.
  {
    const secteurs = new Map(), arbres = new Map();
    const secteur = (x, z) => { const k = `${Math.floor(x / 80)},${Math.floor(z / 80)}`; if (!secteurs.has(k)) secteurs.set(k, { pos: [], cols: [] }); return secteurs.get(k); };
    const MURS_L = ['#ece4d4', '#e2d9c6', '#d8d0c0', '#cfc8ba', '#c2baab', '#e9e0cc', '#7a6a58', '#8f8272', '#efe8da'];
    const BETONS = ['#d8d2c6', '#cfc9bc', '#e4e0d6', '#c4beb2', '#b9b4aa', '#d6cbb8', '#e8e4dc', '#c9c2b4'];
    const TUILES_L = ['#5f6670', '#6a7079', '#575d66', '#727780', '#4f555e', '#5f6670', '#4e6878', '#7a5a48'];
    const VITRES_L = ['#8e9aa1', P.vitreVille, '#9aa6ac', '#8e9aa1'];
    for (let gx = -40; gx < 330; gx += 9) for (let gz = -300; gz < 260; gz += 9) {
      const x = gx + (hasard(gx, gz) - 0.5) * 5, z = gz + (hasard(gz, gx) - 0.5) * 5, d = Math.hypot(x + 6, z + 28);
      if (d < 112 || (x < 70 && d < 150) || terrain(x, z) < -28.5) continue;
      if (hasard(x * 0.3, z * 0.7) > 0.88 || (x < 116 && enVille(x, z))) continue;
      const g = hasard(x * 0.13 + 1, z * 0.17 - 2), y = terrain(x, z), ry = Math.round((hasard(x, z * 2) - 0.5) * 2) * 0.12 + (hasard(z, x * 3) - 0.5) * 0.1;
      if (g < 0.07) {
        // un bosquet
        const k = `${Math.floor(x / 80)},${Math.floor(z / 80)}`;
        if (!arbres.has(k)) arbres.set(k, atelier());
        arbres.get(k).arbreTouffu(x, z, 8 + 5 * hasard(x, z), VERTS, { y, sorte: 'persistant', loin: true, large: 1.4 });
        continue;
      }
      const S = secteur(x, z), c = Math.cos(ry), sn = Math.sin(ry);
      const Q = (lx, yy, lz) => [x + lx * c + lz * sn, yy, z - lx * sn + lz * c];
      const quad = (A, B, C, D, col, n) => { tri(S.pos, S.cols, A, B, C, col, n); tri(S.pos, S.cols, A, C, D, col, n); };
      // une boîte posée (sans dessous), haute de h : ses quatre murs, son dessus ; des rangées de fenêtres (rangs : [[bas,
      // haut], …]) tous les pasF mètres, larges de largF, 3 cm devant le mur, de la couleur coul(face, rang, k) (2026-10-27 : en
      // bandeau continu, la nuit, chaque étage s'allumait d'un bloc, comme un néon)
      const boite = (l, p, y0, h, mur, dessus, rangs, pasF, largF, coul) => {
        const L2 = l / 2, P2 = p / 2;
        const faces = [[[-L2, P2], [L2, P2], [0, 1]], [[L2, -P2], [-L2, -P2], [0, -1]], [[L2, P2], [L2, -P2], [1, 0]], [[-L2, -P2], [-L2, P2], [-1, 0]]];
        faces.forEach(([[ax, az], [bx, bz], [nx, nz]], fi) => {
          const n = [nx * c + nz * sn, 0, -nx * sn + nz * c];
          quad(Q(ax, y0, az), Q(bx, y0, bz), Q(bx, y0 + h, bz), Q(ax, y0 + h, az), mur, n);
          if (!rangs) return;
          const len = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / len, uz = (bz - az) / len, nf = Math.max(1, Math.floor((len - 0.8) / pasF)), ox = nx * 0.03, oz = nz * 0.03;
          rangs.forEach(([yb, yh], ri) => {
            for (let k = 0; k < nf; k++) {
              const u = (len - nf * pasF) / 2 + (k + 0.5) * pasF, u0 = u - largF / 2, u1 = u + largF / 2, col = coul(fi, ri, k);
              quad(Q(ax + ux * u0 + ox, y0 + yb, az + uz * u0 + oz), Q(ax + ux * u1 + ox, y0 + yb, az + uz * u1 + oz), Q(ax + ux * u1 + ox, y0 + yh, az + uz * u1 + oz), Q(ax + ux * u0 + ox, y0 + yh, az + uz * u0 + oz), col, n);
            }
          });
        });
        if (dessus) quad(Q(-L2, y0 + h, P2), Q(L2, y0 + h, P2), Q(L2, y0 + h, -P2), Q(-L2, y0 + h, -P2), dessus, [0, 1, 0]);
      };
      const y0 = y - 0.6;
      const tour = x > 175 ? 0.3 : x > 150 ? 0.1 : 0;
      if (g > 1 - tour) {
        // un immeuble, un hôtel : des étages de 3 m, chacun sa rangée de fenêtres (un tiers allumées le soir)
        const etages = 3 + Math.floor(hasard(x * 2, z) * (x > 175 ? 6 : 3)), l = 10 + 8 * hasard(z, x), p = 8 + 6 * hasard(x, z * 3), H = 1.5 + etages * 3;
        const beton = BETONS[Math.floor(hasard(x, z * 5) * BETONS.length)], rangs = [];
        for (let e = 0; e < etages; e++) rangs.push([1.5 + e * 3, 2.5 + e * 3]);
        boite(l, p, y0, H, beton, '#a9a49a', rangs, 2.2, 1.5, (fi, ri, k) => (hasard(x + fi * 3.1 + k, z + ri * 1.7) < 0.35 ? P.vitreVille : '#8e9aa1'));
        if (hasard(x + 4, z) < 0.5) boite(2.6, 2.4, y0 + H, 2.2, beton, '#a9a49a');
        if (hasard(x * 5, z * 3) > 0.8) vapeurs.push({ x, z, y: y0 + H + 0.5, n: 10, haut: 14, large: 2.5, taille: 6, opacite: 0.7 });
        continue;
      }
      // une maison basse, un ou deux étages : son mur et ses fenêtres (de papier, qui s'allument le soir, ou de verre sombre),
      // son grand toit en croupe
      const etages = hasard(x * 3, z) > 0.45 ? 2 : 1, l = 6 + 3 * hasard(x, z), p = 5.5 + 2.5 * hasard(z, x), H = 1.6 + etages * 2.7;
      const mur = MURS_L[Math.floor(hasard(x * 7, z) * MURS_L.length)], allumee = hasard(x, z + 9) < 0.55, rangs = [];
      for (let e = 0; e < etages; e++) rangs.push([1.4 + e * 2.7, 2.3 + e * 2.7]);
      boite(l, p, y0, H, mur, null, rangs, 2.4, 1.2, (fi, ri, k) => (allumee && hasard(x + fi * 2.3 + k, z - ri) < 0.6 ? P.shoji : '#5f5a55'));
      // le toit en croupe : le faîte le long du grand côté, débordant de 45 cm
      const yt = y0 + H, ht = 1.5 + 0.5 * hasard(z * 3, x), tuile = TUILES_L[Math.floor(hasard(z, x * 5) * TUILES_L.length)];
      const L2 = l / 2 + 0.45, P2 = p / 2 + 0.45, f = Math.max(0, L2 - P2);
      const A = Q(-L2, yt, P2), B = Q(L2, yt, P2), C = Q(L2, yt, -P2), D = Q(-L2, yt, -P2), E = Q(-f, yt + ht, 0), F = Q(f, yt + ht, 0);
      quad(A, B, F, E, tuile, [0, 1, 0]); quad(C, D, E, F, tuile, [0, 1, 0]);
      tri(S.pos, S.cols, B, C, F, tuile, [0, 1, 0]); tri(S.pos, S.cols, D, A, E, tuile, [0, 1, 0]);
      if (d < 260 && hasard(x * 5, z * 3) > 0.86) vapeurs.push({ x, z, y: yt + ht, n: 10, haut: 12, large: 2.2, taille: 5, opacite: 0.75 });
    }
    for (const S of secteurs.values()) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(S.pos, 3));
      const a = atelier();
      a.piece(geo, '#e2d9c6', { couleurs: S.cols, nuance: 0.04, trait: false });
      poser(a.fin(), 0, 0, { y: 0, trait: false, ombre: false });
    }
    for (const a of arbres.values()) poser(a.fin(), 0, 0, { y: 0, trait: false, ombre: false });
  }

  // la forêt au loin (le mont Tsurumi à l'ouest, les collines du nord) : moins fine, sans trait d'encre
  {
    const loins = new Map();
    for (let gx = -280; gx < 120; gx += 7) for (let gz = -320; gz < 120; gz += 7) {
      const x = gx + (hasard(gx, gz) - 0.5) * 5, z = gz + (hasard(gz, gx) - 0.5) * 5, d = Math.hypot(x + 6, z + 28);
      if (d < 112 || d > 270 || (x > -30 && z > -110)) continue;
      const k = `${Math.floor(x / 60)},${Math.floor(z / 60)}`;
      if (!loins.has(k)) loins.set(k, atelier());
      const a = loins.get(k), y = terrain(x, z), u = hasard(x * 1.7, z * 2.3);
      if (u < 0.5) a.arbreTouffu(x, z, 10 + 6 * hasard(x, z), VERTS, { y, sorte: 'persistant', loin: true, large: 1.3 });
      else if (u < 0.8) a.sugi(x, z, 14 + 8 * hasard(x, z), { y, loin: true });
      else a.arbreTouffu(x, z, 8 + 5 * hasard(x, z), VERTS_ERABLE, { y, sorte: 'houppierErable', caduc: true, loin: true });
    }
    for (const a of loins.values()) poser(a.fin(), 0, 0, { y: 0, trait: false });
  }
  // ---------------------------------------------------------------- Les gens
  const PEAU = P.peau, NOIR = '#2a2226';
  const yukata = (c, ceinture) => ({ haut: c, manches: 'kimono', col: '#f4efe2', tablier: undefined, bas: { sorte: 'jupe', c }, ceinture });
  const passants = [
    // l'okami du ryokan, sur le pas de sa porte (elle fait venir le soir, et rend le matin)
    { id: 'okami', x: 52.6, z: -6.0, cap: 0.3, tenue: { taille: 0.95, peau: '#f0c8a6', cheveux: NOIR, coiffure: 'chignon', haut: '#4a3a5a', manches: 'kimono', col: '#f4efe2', bas: { sorte: 'jupe', c: '#4a3a5a' }, chaussures: '#f4efe2', semelle: '#c8a868', yeux: 'plisses' } },
    // un vieux monsieur du club des fumées de Kannawa (湯けむり), en happi, devant la statue d'Ippen
    { id: 'kurabu', x: 35.4, z: -5.6, cap: -0.4, tenue: { taille: 0.96, peau: '#e8bf98', cheveux: '#d8d4cc', coiffure: 'court', chapeau: { sorte: 'bandeau', c: '#f4f0e6' }, haut: '#2f4a7a', manches: 'longues', col: '#f4f0e6', bas: { sorte: 'pantalon', c: '#2a2a34' }, chaussures: '#3a3236', semelle: '#3a3236', yeux: 'plisses' } },
    // un moine pèlerin au chapeau de paille, qui marche comme Ippen
    { id: 'moine', x: 30.4, z: -5.0, cap: 1.4, ronde: [[30.4, -5.0], [38.0, -4.6], [30.4, -5.0], [24.6, -3.6]], vitesse: 0.5, attente: [5, 10], tenue: { taille: 1.0, peau: '#ecc4a0', cheveux: NOIR, coiffure: 'rase', chapeau: { sorte: 'sugegasa', c: '#d8c48a' }, haut: '#2a2a30', manches: 'kimono', col: '#f4f0e6', bas: { sorte: 'hakama', c: '#2a2a30' }, chaussures: '#c8a868', semelle: '#8a6a3a' } },
    // la dame du four à vapeur
    { id: 'mushi', x: 49.4, z: 8.4, cap: -1.9, tenue: { taille: 0.92, peau: '#f0c8a6', cheveux: '#3a2a22', coiffure: 'chignon', chapeau: { sorte: 'foulard', c: '#c8452e' }, haut: '#f4efe2', manches: 'longues', tablier: '#8a2e22', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: '#3a3236', semelle: '#3a3236', yeux: 'plisses' }, quand: 'jour' },
    // au bain de pieds : une grand-mère et son petit-fils, assis, les pieds dans l'eau
    { id: 'obaa', x: 0, z: 0, cap: 0, assis: 0, tenue: { taille: 0.86, peau: '#f0c8a6', cheveux: '#d8d4cc', coiffure: 'chignon', ...yukata('#5a6a8a'), chaussures: '#3a3236', semelle: '#c8a868', yeux: 'plisses' } },
    { id: 'enfant', x: 0, z: 0, cap: 0, assis: 0, tenue: { taille: 0.7, peau: PEAU, cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'ecolier', c: '#f2c443' }, haut: '#e8583e', manches: 'courtes', bas: { sorte: 'short', c: '#3d5a8f' }, chaussures: P.blanc, semelle: '#3a3236' }, quand: 'jour' },
    // deux promeneurs en yukata du ryokan (à Beppu, on se promène en yukata entre deux bains)
    { id: 'yukata', x: 40.0, z: 0.6, cap: -PI / 2, ronde: [[40.0, 0.6], [20.0, 0.0], [40.0, 0.6], [58.0, 2.0]], vitesse: 0.7, attente: [4, 9], tenue: { taille: 1.0, peau: '#f4d0b0', cheveux: NOIR, coiffure: 'chignon', ...yukata('#e8eef4'), chaussures: '#c8a868', semelle: '#8a6a3a' } },
    { id: 'yukata2', x: 41.0, z: 1.6, cap: -PI / 2, ronde: [[41.0, 1.6], [21.0, 1.0], [41.0, 1.6], [59.0, 3.0]], vitesse: 0.7, attente: [4, 9], tenue: { taille: 1.08, peau: '#ecc4a0', cheveux: NOIR, coiffure: 'court', ...yukata('#3a4a6a'), chaussures: '#c8a868', semelle: '#8a6a3a' } },
    // l'enfer de la mer : la dame des œufs, au bord du bassin bleu ; @random_japan_place, qui filme ; un touriste
    { id: 'tamago', x: -25.0, z: -20.0, cap: Math.atan2(-34 + 25, -29.5 + 20), tenue: { taille: 0.94, peau: '#f0c8a6', cheveux: '#3a2a22', coiffure: 'chignon', chapeau: { sorte: 'foulard', c: '#1f6a9a' }, haut: '#1f6a9a', manches: 'longues', col: '#f4efe2', tablier: '#f4efe2', bas: { sorte: 'pantalon', c: '#2a3a52' }, chaussures: '#e8e4dc', semelle: '#3a3236', yeux: 'plisses' }, quand: 'jour' },
    { id: 'videaste', x: -32.6, z: -19.6, cap: PI + 0.1, tenue: { taille: 1.1, peau: PEAU, cheveux: '#3a2a20', coiffure: 'court', chapeau: { sorte: 'bob', c: '#2f3440' }, haut: '#2f3440', manches: 'courtes', bas: { sorte: 'pantalon', c: '#c9b48a' }, chaussures: P.blanc, semelle: '#3a3236', appareil: true } },
    { id: 'touriste', x: -46.4, z: -29.0, cap: PI / 2, ronde: [[-46.4, -29.0], [-44.4, -37.0], [-46.4, -29.0], [-41.0, -20.4]], vitesse: 0.8, attente: [4, 9], tenue: { taille: 1.12, peau: '#f4d6c0', cheveux: '#c8a46a', coiffure: 'court', chapeau: { sorte: 'casquette', c: '#c8452e', c2: '#f4f0e6' }, haut: '#f4f0e6', manches: 'courtes', bas: { sorte: 'short', c: '#5a6a4a' }, chaussures: '#e8e4dc', semelle: '#3a3236', sac: { sorte: 'dos', c: '#3a5a7a', c2: '#2a3a5a' }, appareil: true }, quand: 'jour' },
    // une grand-mère qui prie au petit sanctuaire Inari
    { id: 'inari', x: -50.6, z: -45.0, cap: Math.atan2(INARI.x + 50.6, INARI.z + 45.0), tenue: { taille: 0.86, peau: '#f0c8a6', cheveux: '#d8d4cc', coiffure: 'chignon', haut: '#6a5a7a', manches: 'longues', bas: { sorte: 'pantalon', c: '#4a4a56' }, chaussures: '#3a3236', semelle: '#3a3236', yeux: 'plisses', canne: true }, quand: 'jour' },
    // l'enfer de boue : l'homme qui entretient les caillebotis (il ratisse la boue sèche)
    { id: 'ouvrier', x: 4.6, z: -36.6, cap: 1.2, tenue: { taille: 1.0, peau: '#e0b48c', cheveux: '#5a5650', coiffure: 'court', chapeau: { sorte: 'bandeau', c: '#f4f0e6' }, haut: '#5a6a5a', manches: 'longues', bas: { sorte: 'pantalon', c: '#3a3f4a' }, chaussures: '#2a2a30', semelle: '#2a2a30', yeux: 'plisses', pose: 'balai' }, quand: 'jour' },
    // l'enfer du chaudron : le guide (et son encens), deux amis qui photographient le démon
    { id: 'guide', x: 17.4, z: 17.6, cap: Math.atan2(12.4 - 17.4, 19.0 - 17.6), tenue: { taille: 1.02, peau: '#e8bf98', cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'casquette', c: '#c8452e', c2: '#c8452e' }, haut: '#c8452e', manches: 'longues', col: '#f4f0e6', bas: { sorte: 'pantalon', c: '#2a2a34' }, chaussures: '#2a2a30', semelle: '#2a2a30' }, quand: 'jour' },
    { id: 'amie', x: 5.0, z: 9.8, cap: 0.15, tenue: { taille: 0.95, peau: '#f2c9a8', cheveux: '#3a2a22', coiffure: 'queue', chapeau: { sorte: 'soleil', c: '#f4efe2' }, haut: '#f59aa6', manches: 'courtes', bas: { sorte: 'jupe', c: '#2f3a5a' }, chaussures: '#f4f0e6', semelle: '#3a3236', appareil: true }, quand: 'jour' },
    { id: 'ami', x: 8.4, z: 9.6, cap: -0.2, tenue: { taille: 1.05, peau: PEAU, cheveux: NOIR, coiffure: 'court', haut: '#3a6a5a', manches: 'courtes', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: P.blanc, semelle: '#3a3236' }, quand: 'jour' },
    // l'étang blanc : le jardinier
    { id: 'jardinier', x: -40.8, z: 30.8, cap: 2.4, tenue: { taille: 1.0, peau: '#e0b48c', cheveux: '#5a5650', coiffure: 'court', chapeau: { sorte: 'bandeau', c: '#f4f0e6' }, haut: '#2f4a6a', manches: 'longues', bas: { sorte: 'pantalon', c: '#2f3a4a' }, chaussures: '#2a2a30', semelle: '#2a2a30', yeux: 'plisses', pose: 'balai' }, quand: 'jour' },
    // le lac de sang : la vendeuse de sa pommade ; l'enfer de la tornade : le gardien du geyser
    { id: 'chiike', x: -54.0, z: -68.6, cap: PI, tenue: { taille: 0.94, peau: '#f0c8a6', cheveux: '#3a2a22', coiffure: 'chignon', chapeau: { sorte: 'foulard', c: '#a8281c' }, haut: '#f4efe2', manches: 'longues', tablier: '#a8281c', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: '#3a3236', semelle: '#3a3236', yeux: 'plisses' }, quand: 'jour' },
    { id: 'gardien', x: -29.8, z: -80.8, cap: -PI / 2 - 0.3, tenue: { taille: 1.04, peau: '#e8bf98', cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'casquette', c: '#2a3550', c2: '#2a3550' }, haut: '#2a3550', manches: 'longues', bas: { sorte: 'pantalon', c: '#2a3550' }, chaussures: '#1f1f24', semelle: '#1f1f24' } },
  ];
  // (la grand-mère et l'enfant assis sur le banc sud du bain de pieds de la rue, tournés vers elle)
  {
    const b = bancs.find((q) => q.ashiyu && q.rue);
    for (const [id, f] of [['obaa', 0.25], ['enfant', 0.55]]) {
      const g = passants.find((p) => p.id === id);
      Object.assign(g, { x: b.de[0] + (b.a[0] - b.de[0]) * f, z: b.de[1] + (b.a[1] - b.de[1]) * f, cap: b.cap, assis: b.y });
    }
  }

  // ---------------------------------------------------------------- Ce qu'on peut faire (tout passe par `jeu`)
  const parler = (id) => ({ id, passant: id, verbe: 'parler', action: (jeu) => jeu.dire(jeu.txn(id), id) });
  const comp = (jeu, cle) => jeu.dire(jeu.tx(cle)[jeu.compagnon], 'compagnon');
  const interactions = [
    {
      // l'enfer de la mer (le tampon) : le grand bassin bleu ; le jour, la dame remonte le panier d'œufs cuits dans l'eau
      id: 'umi', x: -26.4, z: -21.0, rayon: 2.6, haut: 1.4, verbe: 'regarder', vers: [BASSIN.umi.x, BASSIN.umi.z],
      async action(jeu) {
        const y = T.umi.h;
        jeu.cadrer({ de: [-25.6, y + 2.6, -18.8], vers: [-35, y - 0.6, -29], champ: 50 });
        await jeu.attendre(700);
        await jeu.dire(jeu.txn('umi'));
        if (!jeu.estNuit) {
          jeu.cadrer({ de: [-24.2, y + 1.8, -19.6], vers: [panier.x, y - 0.2, panier.z], champ: 44 });
          panier.lever(true);
          jeu.son('plouf');
          await jeu.attendre(1600);
          const r = await jeu.choisir(jeu.tx('oeufs'), [jeu.t('oui'), jeu.t('non')], 'tamago');
          if (r === 0) await jeu.dire(jeu.tx('oeufGoute'));
          panier.lever(false);
        }
        jeu.cadrer(null);
        if (!jeu.aTampon('umi')) { await jeu.tampon('umi'); await comp(jeu, 'umiCompagnon'); }
      },
    },
    { id: 'akaike', x: -15.4, z: -14.2, rayon: 2.2, haut: 1.2, verbe: 'regarder', vers: [BASSIN.akaike.x, BASSIN.akaike.z], action: (jeu) => jeu.dire(jeu.tx('akaike')) },
    { id: 'hasu', x: -18.6, z: -47.6, rayon: 2.4, haut: 1.0, verbe: 'regarder', vers: [BASSIN.hasu.x, BASSIN.hasu.z], action: (jeu) => jeu.dire(jeu.tx('hasu')) },
    { id: 'inari', x: -51.6, z: -45.6, rayon: 1.9, haut: 1.6, verbe: 'prier', vers: [INARI.x, INARI.z], async action(jeu) { jeu.geste('prier'); jeu.son('claque'); await jeu.attendre(3600); jeu.geste(null); await jeu.dire(jeu.txn('inariPriere')); } },
    {
      // l'enfer des crânes de moines (le tampon) : une grosse bulle de boue grise gonfle comme un crâne rasé, et crève
      id: 'bozu', x: 14.8, z: -24.0, rayon: 2.2, haut: 1.2, verbe: 'regarder', vers: [BASSIN.bozu1.x + 1.2, BASSIN.bozu1.z + 0.4],
      async action(jeu) {
        const b = BASSIN.bozu1, x = b.x + 1.2, z = b.z + 0.4, y = b.eau;
        jeu.cadrer({ de: [13.4, y + 1.9, -23.4], vers: [x, y + 0.2, z], champ: 40 });
        await jeu.attendre(500);
        await jeu.dire([jeu.tx('bozu')[0]]);
        const fini = boue.grosse(b, x, z);
        await jeu.attendre(2700);
        jeu.son('bulle');
        await fini;
        await jeu.dire(jeu.tx('bozu').slice(1));
        jeu.cadrer(null);
        if (!jeu.aTampon('bozu')) { await jeu.tampon('bozu'); await comp(jeu, 'bozuCompagnon'); }
      },
    },
    { id: 'takaibiki', x: 24.8, z: -43.0, rayon: 2.4, haut: 1.4, verbe: 'ecouter', vers: [TAKAIBIKI.x, TAKAIBIKI.z], async action(jeu) { ronflement.ronfler(); await jeu.attendre(1400); await jeu.dire(jeu.tx('takaibiki')); } },
    {
      // le grand démon rouge sur son chaudron
      id: 'oni', x: ONI.x, z: 10.6, rayon: 2.4, haut: 2.2, verbe: 'regarder', vers: [ONI.x, ONI.z],
      async action(jeu) {
        const y = terrain(ONI.x, ONI.z);
        jeu.cadrer({ de: [ONI.x + 1.4, y + 1.6, 8.6], vers: [ONI.x, y + 3.4, ONI.z], champ: 52 });
        await jeu.attendre(600);
        await jeu.dire(jeu.txn('oni'));
        jeu.cadrer(null);
      },
    },
    {
      // le guide de l'enfer du chaudron (le tampon) : son tour de magie, l'encens qui fait doubler la vapeur du bassin bleu
      id: 'guide', passant: 'guide', verbe: 'parler',
      async action(jeu) {
        const b = BASSIN.k3;
        await jeu.dire(jeu.tx('guide'), 'guide');
        jeu.cadrer({ de: [17.6, b.eau + 2.6, 21.4], vers: [b.x, b.eau + 0.8, b.z], champ: 52 });
        await jeu.attendre(600);
        await jeu.dire(jeu.tx('guideTour'), 'guide');
        bouffees.emettre(b.x, b.eau + 0.1, b.z, { duree: 4.5, n: 70, large: 1.8, haut: 6, taille: 2.4 });
        jeu.son('magie');
        await jeu.attendre(2600);
        await jeu.dire(jeu.tx('guideFin'), 'guide');
        jeu.cadrer(null);
        if (!jeu.aTampon('kamado')) { await jeu.tampon('kamado'); await comp(jeu, 'kamadoCompagnon'); }
      },
    },
    { id: 'k4', x: 16.8, z: 28.4, rayon: 2.2, haut: 1.2, verbe: 'regarder', vers: [BASSIN.k4.x, BASSIN.k4.z], action: (jeu) => jeu.dire(jeu.tx('k4')) },
    { id: 'k6', x: -3.0, z: 27.4, rayon: 2.2, haut: 1.2, verbe: 'regarder', vers: [BASSIN.k6.x, BASSIN.k6.z], action: (jeu) => jeu.dire(jeu.tx('k6')) },
    { id: 'nodo', x: 15.8, z: 33.8, rayon: 1.8, haut: 1.0, verbe: 'regarder', vers: [15.8, 36.2], action: (jeu) => jeu.dire(jeu.tx('ashiyuKamado')) },
    {
      // l'étang blanc (le tampon)
      id: 'shiraike', x: -27.6, z: 16.4, rayon: 2.4, haut: 1.2, verbe: 'regarder', vers: [BASSIN.shiraike.x, BASSIN.shiraike.z],
      async action(jeu) {
        const y = T.shiraike.h;
        jeu.cadrer({ de: [-26.6, y + 2.2, 15.0], vers: [-34, y - 0.4, 24], champ: 52 });
        await jeu.attendre(700);
        await jeu.dire(jeu.txn('shiraike'));
        jeu.cadrer(null);
        if (!jeu.aTampon('shiraike')) { await jeu.tampon('shiraike'); await comp(jeu, 'shiraikeCompagnon'); }
      },
    },
    {
      // le lac de sang, du belvédère
      id: 'chinoikeVue', x: -68.0, z: -73.6, rayon: 2.6, haut: 1.4, verbe: 'regarder', vers: [BASSIN.chinoike.x, BASSIN.chinoike.z],
      async action(jeu) {
        const y = T.shibaseki.h;
        jeu.cadrer({ de: [-66.6, y + 2.4, -71.6], vers: [-70, y - 0.6, -83], champ: 55 });
        await jeu.attendre(700);
        await jeu.dire(jeu.txn('chinoikeVue'));
        jeu.cadrer(null);
      },
    },
    {
      // la vendeuse du lac de sang (le tampon) : la pommade faite de son argile rouge
      id: 'chiike', passant: 'chiike', verbe: 'parler',
      async action(jeu) {
        // (la caméra du côté de l'allée, la vendeuse devant sa boutique : derrière le voyageur, elle butait contre la façade)
        const y = terrain(-54, -68.6);
        jeu.cadrer({ de: [-56.4, y + 2.0, -73.4], vers: [-54, y + 1.1, -68.4], champ: 42 });
        const r = await jeu.choisir(jeu.tx(jeu.aTampon('chinoike') ? 'chiikeEncore' : 'chiike'), [jeu.t('oui'), jeu.t('non')], 'chiike');
        if (r !== 0) { await jeu.dire(jeu.tx('chiikeNon'), 'chiike'); jeu.cadrer(null); return; }
        jeu.image(pommadeSVG(), 'pommade');
        jeu.son('papier');
        await jeu.dire(jeu.tx('pommade'), 'chiike');
        jeu.image(null);
        jeu.cadrer(null);
        if (!jeu.aTampon('chinoike')) { await jeu.tampon('chinoike'); await comp(jeu, 'chinoikeCompagnon'); }
      },
    },
    {
      // l'enfer de la tornade : s'asseoir sur les bancs de pierre et attendre que le geyser jaillisse
      id: 'tatsumaki', x: -36, z: -81.4, rayon: 3.2, haut: 1.4, verbe: 'attendre', vers: [GEYSER.x, GEYSER.z],
      async action(jeu) {
        const G = GEYSER;
        jeu.cadrer({ de: [G.x + 3.2, G.y + 2.6, G.z + 12.6], vers: [G.x, G.y + 3.0, G.z], champ: 56 });
        // (il part pendant la seconde phrase, « Ça va partir ! »)
        if (!geyser.actif()) {
          const [l1, l2] = jeu.tx('tatsumakiAttente');
          await jeu.dire([l1]);
          geyser.jaillir();
          await jeu.dire([l2]);
        }
        await jeu.attendre(1800);
        await jeu.dire(jeu.txn('tatsumaki'));
        await comp(jeu, 'tatsumakiCompagnon');
        jeu.cadrer(null);
      },
    },
    { id: 'tableau', x: TABLEAU.x - Math.sin(TABLEAU.ry) * 1.1, z: TABLEAU.z - Math.cos(TABLEAU.ry) * 1.1, rayon: 1.8, haut: 1.4, verbe: 'lire', vers: [TABLEAU.x, TABLEAU.z], action: (jeu) => jeu.dire(jeu.tx('tableau')) },
    {
      // le four à vapeur : faire cuire des œufs et des patates douces dans la vapeur de l'enfer
      id: 'mushi', passant: 'mushi', verbe: 'parler',
      async action(jeu) {
        const r = await jeu.choisir(jeu.tx('mushi'), [jeu.t('oui'), jeu.t('non')], 'mushi');
        if (r !== 0) { await jeu.dire(jeu.tx('mushiNon'), 'mushi'); return; }
        const R = repere(KOBO.x, KOBO.z, PI), q = R(1.1, 0, KOBO.p / 2 + 1.1), y = terrain(q.x, q.z);
        jeu.cadrer({ de: [q.x - 1.4, y + 2.5, q.z - 3.0], vers: [q.x, y + 1.0, q.z], champ: 52 });
        await jeu.attendre(500);
        bouffees.emettre(q.x, y + 1.1, q.z, { duree: 2.2, n: 40, large: 0.7, haut: 3.5, taille: 1.4 });
        jeu.son('pschitt');
        await jeu.dire(jeu.tx('mushiCuisson'), 'mushi');
        bouffees.emettre(q.x, y + 1.1, q.z, { duree: 1.6, n: 30, large: 0.7, haut: 3.5, taille: 1.4 });
        jeu.son('pschitt');
        await jeu.attendre(1200);
        await jeu.dire(jeu.tx('mushiFini'), 'mushi');
        jeu.cadrer(null);
        await comp(jeu, 'mushiCompagnon');
      },
    },
    { id: 'nomiyu', x: FONTAINE.x - 0.4, z: FONTAINE.z - 0.9, rayon: 1.6, haut: 1.2, verbe: 'gouter', vers: [FONTAINE.x, FONTAINE.z], action: (jeu) => jeu.dire(jeu.tx('nomiyu')) },
    { id: 'statue', x: IPPEN.x + 0.4, z: IPPEN.z + 1.8, rayon: 2.0, haut: 2.2, verbe: 'regarder', vers: [IPPEN.x, IPPEN.z], action: (jeu) => jeu.dire(jeu.tx('statue')) },
    { id: 'mushiyu', x: MUSHIYU.x - 0.4, z: -7.8, rayon: 2.2, haut: 1.6, verbe: 'regarder', vers: [MUSHIYU.x, MUSHIYU.z], action: (jeu) => jeu.dire(jeu.txn('mushiyu')) },
    {
      // l'okami du ryokan : elle fait venir le soir (la nuit) ; la nuit, elle rend le matin
      id: 'okami', passant: 'okami', verbe: 'parler',
      async action(jeu) {
        if (!jeu.estNuit) {
          const r = await jeu.choisir(jeu.tx('okamiJour'), [jeu.t('oui'), jeu.t('non')], 'okami');
          if (r !== 0) { await jeu.dire(jeu.tx('okamiNon'), 'okami'); return; }
          await jeu.nuit(true);
          await jeu.dire(jeu.tx('okamiSoir'), 'okami');
          return;
        }
        const r = await jeu.choisir(jeu.tx('okamiNuit'), [jeu.t('oui'), jeu.t('non')], 'okami');
        if (r !== 0) { await jeu.dire(jeu.tx('okamiReste'), 'okami'); return; }
        await jeu.nuit(false);
        await jeu.dire(jeu.tx('okamiMatin'), 'okami');
      },
    },
    // la légende d'Ippen (le panneau, à côté de sa statue) : elle raconte le secret, mais il se fait sans elle (2026-10-27,
    // le propriétaire : « faudra faire en sorte que tu puisses faire le secret sans forcément commencer par lire le tableau ») ;
    // le compagnon n'en reparle pas s'il a déjà tout dit devant une pierre (l'indice « ippen »)
    {
      id: 'panneau-ippen', x: PANNEAUX.ippen.x - Math.sin(PANNEAUX.ippen.ry) * 1.2, z: PANNEAUX.ippen.z - Math.cos(PANNEAUX.ippen.ry) * 1.2, rayon: 1.8, verbe: 'lire', vers: [PANNEAUX.ippen.x, PANNEAUX.ippen.z],
      async action(jeu) {
        await jeu.dire(jeu.tx('panneau-ippen'));
        if (secretTrouve('ippen')) return;
        const premiere = !indiceVu('ippen');
        jeu.voirIndice('ippen');
        if (premiere) await comp(jeu, 'ippenCompagnon');
      },
    },
    // les trois pierres d'Ippen : les ramasser. Devant la première, sans la légende, le compagnon dit ce que c'est et ce qu'on
    // en fait. À la deuxième, on dit où est la dernière (2026-10-27, le propriétaire, deux pierres jetées : « le troisième,
    // je sais pas où c'est… peut-être réduire la difficulté pour le troisième »)
    ...PIERRES.map((p) => ({
      id: `pierre-${p.id}`, x: p.x, z: p.z, rayon: 1.7, haut: 0.7, verbe: 'ramasser', si: () => !indiceVu(`ippen-${p.id}`) && !secretTrouve('ippen'),
      async action(jeu) {
        jeu.cadrerDeCote(p.x, terrain(p.x, p.z), p.z, { distance: 3.2, haut: 1.2 });
        await jeu.dire(jeu.tx('pierre'));
        jeu.geste('creuser');
        await jeu.attendre(700);
        pierres.ramasser(p.id);
        jeu.geste(null);
        pierres.vue = true;
        jeu.voirIndice(`ippen-${p.id}`);
        jeu.cadrer(null);
        const n = ramassees();
        await jeu.dire(jeu.tx('pierreRamassee')(n));
        await comp(jeu, indiceVu('ippen') ? 'pierreCompagnon' : 'pierreInconnueCompagnon');
        jeu.voirIndice('ippen');
        if (n === 2) await pierres.montrer(jeu);
      },
    })),
    // les jeter, chacune dans un enfer différent (sans la légende aussi : il suffit d'avoir une pierre en main)
    ...ENFERS.map((e) => {
      const L = LANCERS[e];
      return {
        id: `lancer-${e}`, x: L.x, z: L.z, rayon: 2.0, haut: 1.2, verbe: 'lancer',
        si: () => enMain() > 0 && !indiceVu(`ippen-${e}`) && !secretTrouve('ippen'),
        async action(jeu) {
          const b = BASSIN[L.b], [vx, vz] = L.vers;
          const r = await jeu.choisir(jeu.tx('lancer')(jeu.tx('nomsEnfers')[e]), [jeu.t('oui'), jeu.t('non')]);
          if (r !== 0) return;
          // (la caméra derrière le voyageur, un peu de côté et plus haut : on voit la pierre partir, et l'eau où elle tombe)
          const cap = Math.atan2(vx - L.x, vz - L.z), yj = terrain(L.x, L.z);
          jeu.placer(L.x, L.z, cap);
          jeu.cadrer({ de: [L.x - Math.sin(cap) * 3.4 + Math.cos(cap) * 1.4, yj + 3.0, L.z - Math.cos(cap) * 3.4 - Math.sin(cap) * 1.4], vers: [vx, b.eau + 0.3, vz], champ: 50 });
          jeu.geste('offrir');
          await jeu.attendre(400);
          await pierres.lancer([L.x, terrain(L.x, L.z) + 1.3, L.z], [vx, b.eau, vz]);
          jeu.son('plouf');
          jeu.geste(null);
          jeu.voirIndice(`ippen-${e}`);
          await pierres.calmer([vx, b.eau, vz], b.sorte === 'boue');
          const n = jetees();
          if (n < 3) {
            await jeu.dire(jeu.tx('pierreJetee')(n));
            jeu.cadrer(null);
            await comp(jeu, n === 1 ? 'jeteeCompagnon1' : 'jeteeCompagnon2');
            return;
          }
          // la troisième : l'enfer se calme tout à fait, et un koban monte de l'eau, jusqu'au bord
          await jeu.dire(jeu.tx('ippenFin'));
          jeu.son('magie');
          await pierres.koban([vx, b.eau, vz], [L.x, terrain(L.x, L.z) + 1.0, L.z]);
          jeu.cadrer(null);
          await jeu.trouverSecret('ippen');
        },
      };
    }),
    // le vidéaste : la vidéo TikTok du lieu
    { id: 'videaste', passant: 'videaste', verbe: 'parler', async action(jeu) { await jeu.dire(jeu.tx('videaste'), 'videaste'); await jeu.video(); } },
    parler('kurabu'), parler('moine'), parler('obaa'), parler('enfant'), parler('yukata'), parler('yukata2'), parler('tamago'), parler('touriste'), parler('inari'),
    parler('ouvrier'), parler('amie'), parler('ami'), parler('jardinier'), parler('gardien'),
    ...Object.entries(PANNEAUX).filter(([id]) => id !== 'ippen').map(([id, p]) => ({ id: `panneau-${id}`, x: p.x - Math.sin(p.ry) * 1.2, z: p.z - Math.cos(p.ry) * 1.2, rayon: 1.8, verbe: 'lire', vers: [p.x, p.z], action: (jeu) => jeu.dire(jeu.tx(`panneau-${id}`)) })),
    ...interactionsBancs(bancs),
  ];
  const actionBete = async (jeu, b) => {
    if (b.sorte !== 'chat') { await jeu.dire(jeu.txn(b.sorte)); return; }
    await jeu.dire(jeu.txn(b.id));
    await jeu.dire(jeu.tx('chatCompagnon')[jeu.compagnon], 'compagnon');
  };
  const depart = { x: DEPART.x, z: DEPART.z, cap: -PI / 2 - 0.05 };
  return {
    ...infos, textes: TEXTES,
    objets, monde, terrain, etiquettes, passants, daims: [], interactions, actionDaim: null, vapeurs, bancs, lumieres, actionBete, animes, eauxCalmes,
    // (chaque bassin sa couleur : celles du lieu ne servent qu'à dire que l'eau en a une)
    eauCalme: { clair: '#7fd8e0', profond: '#1f8fb4', clarte: 0.08 },
    // (le secret, tresors.js ; le marchand, dans le bambou du sentier de Shibaseki ; les sons à fabriquer en plus ; les feux
    // d'artifice, au-dessus de la baie de Beppu, à l'est : de la rue, on les voit au bout)
    secret: 'ippen', marchand: MARCHAND, sons: ['claque', 'papier', 'plouf', 'bulle', 'pschitt', 'oiseau/geyser', 'oiseau/ronfle'],
    feux: { x: 175, y: 0, z: -10, large: 70, haut: [45, 70] },
    // les bêtes (betes.js) : deux chats qui se chauffent sur le sol tiède, des papillons (les asagimadara de l'enfer de la
    // tornade, en octobre), des libellules, des milans au-dessus de la ville
    betes: {
      chats: [{ id: 'chatRoux', x: 48.9, z: 7.4, cap: -2.0, robe: 'roux', dort: true }, { id: 'chatPie', x: 25.0, z: 7.6, cap: 0.8, robe: 'pie' }],
      papillons: [[-38, -80], [-30, -84], [-20, -46], [-36, 30]], libellules: [[-20, -40], [8, 24], [-30, 26]],
      milans: [{ x: 10, z: -20, r: 40, h: 46, sens: 1 }, { x: -50, z: -60, r: 26, h: 34, sens: -1 }],
    },
    aspectSol: (x, z, h) => aspectSol(P, x, z, h),
    // (le sol en cases de 25 cm le long de l'escalier du sanctuaire Inari, et sous le geyser)
    solDetaille: (x0, z0, x1, z1) => {
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      return MARCHES.some((es) => surLaLigne(es.ligne, cx, cz).d < es.demi + 3) || Math.hypot(cx - GEYSER.x, cz - GEYSER.z - 1) < 4;
    },
    etendue: { x0: -720, x1: 720, z0: -720, z1: 720, pas: 4, fin: { x0: -92, x1: 100, z0: -100, z1: 44, pas: 1 } },
    eau: { x0: 200, x1: 1400, z0: -1400, z1: 1400, niveau: -30 },
    vent: { dir: [0.9, 0.3], force: 0.45 }, oiseaux: ['milan'], ambiances: ['insectes'],
    brume: [150, 1500],
    soleil: [0.5, 0.74, 0.46],
    depart,
    photos: {
      heros: { x: -28.4, z: -20.0, cap: PI + 0.2, lacet: 0.2 + 0.15, tangage: 0.18, distance: 6.5 },
      perso: { x: 6.6, z: 9.8, cap: PI, lacet: 0.3, tangage: 0.12, distance: 4 },
    },
  };
}

// ---------------------------------------------------------------- La boue qui bout (l'enfer des crânes de moines, le chaudron)
/**
 * Les bassins de boue : un disque par bassin, au ras de la boue (jusqu'à sa rive, sous les pierres). La boue est grise et
 * épaisse ; des bulles y gonflent en dômes ronds et lisses (comme des crânes de moines rasés, d'où son nom), puis crèvent en
 * laissant des ronds qui s'élargissent ; autour, des cernes concentriques, comme dans la vraie. Les dômes ne sont que de la
 * lumière (leur pente calculée dans le dessin de chaque point) : la boue reste plate, et ne coûte presque rien. Renvoie un
 * anime { objet, maj } ; grosse(b, x, z) : une grosse bulle qui gonfle et crève là (le tampon), en vrai relief.
 */
function creerBoue(THREE, bassins) {
  const pos = [], loc = [], cBord = [], cMilieu = [], rr = [], idx = [];
  const couleur = new THREE.Color();
  for (const b of bassins) {
    const NR = 9, NS = 56, k0 = pos.length / 3, c = Math.cos(b.ry), s = Math.sin(b.ry);
    const cb = couleur.set(b.bord).toArray(), cm = couleur.set(b.milieu).toArray();
    for (let i = 0; i <= NR; i++) {
      for (let j = 0; j < (i ? NS : 1); j++) {
        const t = (j / NS) * 2 * PI, f = i / NR, k = 1 + 0.06 * Math.sin(t * 3 + b.x) + 0.04 * Math.sin(t * 5 + b.z);
        const u = b.rx * Math.cos(t) * k * f, v = b.rz * Math.sin(t) * k * f;
        pos.push(b.x + u * c + v * s, b.eau, b.z - u * s + v * c);
        loc.push(u + b.x * 0.37, v + b.z * 0.53);
        cBord.push(...cb); cMilieu.push(...cm); rr.push(f);
      }
    }
    // le centre, puis les anneaux
    for (let j = 0; j < NS; j++) idx.push(k0, k0 + 1 + ((j + 1) % NS), k0 + 1 + j);
    for (let i = 1; i < NR; i++) {
      const a0 = k0 + 1 + (i - 1) * NS, a1 = k0 + 1 + i * NS;
      for (let j = 0; j < NS; j++) { const j1 = (j + 1) % NS; idx.push(a0 + j, a0 + j1, a1 + j, a0 + j1, a1 + j1, a1 + j); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('loc', new THREE.Float32BufferAttribute(loc, 2));
  g.setAttribute('cBord', new THREE.Float32BufferAttribute(cBord, 3));
  g.setAttribute('cMilieu', new THREE.Float32BufferAttribute(cMilieu, 3));
  g.setAttribute('rayon', new THREE.Float32BufferAttribute(rr, 1));
  g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { temps: { value: 0 }, nuit: { value: 0 } }]),
    vertexShader: `
      attribute vec2 loc;
      attribute vec3 cBord, cMilieu;
      attribute float rayon;
      varying vec2 vLoc;
      varying vec3 vBord, vMilieu, vMonde;
      varying float vR;
      #include <fog_pars_vertex>
      void main() {
        vLoc = loc; vBord = cBord; vMilieu = cMilieu; vR = rayon;
        vec4 monde = modelMatrix * vec4(position, 1.0);
        vMonde = monde.xyz;
        vec4 mvPosition = viewMatrix * monde;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      uniform float temps, nuit;
      varying vec2 vLoc;
      varying vec3 vBord, vMilieu, vMonde;
      varying float vR;
      #include <fog_pars_fragment>
      float h1(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      // une bulle par case de 0,9 m : elle gonfle (un dôme), puis crève (un rond qui s'élargit) ; x : la hauteur, y : le rond
      vec2 bulle(vec2 p) {
        vec2 cs = floor(p / 0.9), f = p - cs * 0.9;
        float r1 = h1(cs), r2 = h1(cs + 17.3), r3 = h1(cs + 5.1);
        vec2 c = vec2(0.25 + 0.4 * r1, 0.25 + 0.4 * r2) * 0.9;
        float t = fract(temps / (2.4 + 3.2 * r3) + r1 * 7.0), R = (0.1 + 0.15 * r2) * sqrt(smoothstep(0.0, 0.78, t)), d = length(f - c);
        float h = t < 0.78 ? 0.75 * R * max(0.0, 1.0 - d * d / (R * R + 1e-4)) : 0.0;
        float rond = t >= 0.78 ? (1.0 - smoothstep(0.0, 0.035, abs(d - (0.05 + (t - 0.78) * 1.3)))) * (1.0 - (t - 0.78) / 0.22) : 0.0;
        return vec2(h, rond);
      }
      void main() {
        vec2 b = bulle(vLoc);
        float e = 0.025, hx = bulle(vLoc + vec2(e, 0.0)).x - b.x, hz = bulle(vLoc + vec2(0.0, e)).x - b.x;
        vec3 n = normalize(vec3(-hx / e, 1.0, -hz / e));
        // la boue : plus claire au bord (sèche), des cernes concentriques qui bougent à peine
        vec3 c = mix(vMilieu, vBord, smoothstep(0.55, 1.0, vR));
        c *= 0.93 + 0.07 * sin(length(vLoc - floor(vLoc / 3.0) * 3.0 - 1.5) * 9.0 - temps * 0.4);
        vec3 L = normalize(vec3(0.5, 0.74, 0.46)), V = normalize(cameraPosition - vMonde);
        float lum = 0.62 + 0.45 * max(dot(n, L), 0.0);
        float brille = pow(max(dot(reflect(-L, n), V), 0.0), 26.0) * 0.45;
        c = c * lum + vec3(brille) + vec3(0.12) * b.y;
        c *= mix(vec3(1.0), vec3(0.22, 0.27, 0.45), nuit);
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
  const disques = new THREE.Mesh(g, mat);
  disques.receiveShadow = false;
  const objet = new THREE.Group();
  objet.add(disques);
  // la grosse bulle du tampon : un dôme de boue, en vrai relief, qui gonfle puis crève ; son rond qui s'élargit
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 10, 0, 2 * PI, 0, PI / 2), new THREE.MeshPhongMaterial({ color: '#a29c92', shininess: 60, specular: '#8a8478' }));
  const rond = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.0, 40).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ color: '#b9b3a8', transparent: true, opacity: 0, depthWrite: false }));
  dome.visible = rond.visible = false;
  objet.add(dome, rond);
  let grosse = null;
  return {
    objet,
    /** Une grosse bulle en x, z de la boue du bassin b : elle gonfle 2,6 s, crève ; se résout une fois le rond effacé. */
    grosse(b, x, z) {
      return new Promise((fin) => { grosse = { b, x, z, t: 0, fin }; });
    },
    maj(dt, temps, c) {
      mat.uniforms.temps.value = temps;
      mat.uniforms.nuit.value = c.nuit;
      if (grosse) {
        const q = grosse;
        q.t += dt;
        const g0 = Math.min(1, q.t / 2.6), R = 0.3 + 0.9 * Math.sqrt(g0);
        dome.visible = q.t < 2.6;
        dome.position.set(q.x, q.b.eau - 0.02, q.z);
        dome.scale.set(R, 0.55 * R * (0.92 + 0.08 * Math.sin(q.t * 9)), R);
        const tr = q.t - 2.6;
        rond.visible = tr > 0;
        if (tr > 0) {
          rond.position.set(q.x, q.b.eau + 0.012, q.z);
          rond.scale.setScalar(1 + tr * 1.6);
          rond.material.opacity = 0.8 * Math.max(0, 1 - tr / 1.6);
        }
        if (tr > 1.6) { rond.visible = false; grosse = null; q.fin(); }
      }
      return [];
    },
  };
}

// ---------------------------------------------------------------- Les bouffées, le geyser, les pierres d'Ippen
/** Une tache ronde et douce (une texture de 32 pixels), pour les bouffées de vapeur et les lueurs. */
function tacheDouce(THREE, dur = 0.22) {
  const TX = 32, px = new Uint8Array(TX * TX * 4);
  for (let j = 0; j < TX; j++) for (let i = 0; i < TX; i++) {
    const r = Math.hypot(i - TX / 2 + 0.5, j - TX / 2 + 0.5) / (TX / 2), v = Math.min(1, Math.exp(-r * r * 3.2) * 0.9 + Math.max(0, 1 - r / dur) * 0.4) * (r < 1 ? 1 : 0);
    px.set([255, 255, 255, Math.round(v * 255)], (j * TX + i) * 4);
  }
  const t = new THREE.DataTexture(px, TX, TX);
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
  const mat = new THREE.PointsMaterial({ size: 1, sizeAttenuation: true, vertexColors: true, map: o.tache || tacheDouce(THREE), transparent: true, depthWrite: false, fog: true, blending: o.additif ? THREE.AdditiveBlending : THREE.NormalBlending });
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('uniform float size;', 'uniform float size;\nattribute float taille;').replace('gl_PointSize = size;', 'gl_PointSize = size * taille;');
  };
  const m = new THREE.Points(g, mat);
  m.frustumCulled = false;
  // (après l'eau calme, transparente elle aussi et dessinée en second : renderOrder 1)
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
 * Des bouffées de vapeur qu'on fait naître (le tour de l'encens du guide, le four à vapeur, le ronflement du démon, le
 * geyser) : emettre(x, y, z, { duree, n, large, haut, taille }) en fait monter n pendant duree secondes ; elles grossissent,
 * montent en ralentissant, s'effacent. La nuit, plus grises.
 */
function creerBouffees(THREE) {
  const N = 260, nu = nuee(THREE, N), parts = [], attente = [];
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
        const vie = 2.2 + Math.random() * 1.4, a = Math.random() * 2 * PI, r = Math.random() * q.large * 0.5;
        parts[libre] = { x: q.x + Math.cos(a) * r, y: q.y, z: q.z + Math.sin(a) * r, vx: Math.cos(a) * q.large * 0.25, vz: Math.sin(a) * q.large * 0.25, vy: (q.haut / vie) * 1.6, age: 0, vie, taille: q.taille };
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
        nu.poser(k, p.x, p.y, p.z, p.taille * (0.35 + 0.9 * Math.sqrt(f)), gris, gris * 1.03, gris * 1.1, 0.55 * Math.min(1, f * 6) * (1 - f) ** 1.3);
      }
      nu.fin();
      return [];
    },
  };
}
/**
 * Le geyser de l'enfer de la tornade (龍巻地獄) : il jaillit d'un coup jusqu'au toit de pierre (4 m plus haut), s'y écrase, et
 * retombe en pluie autour ; puis il faiblit et s'arrête. Une fois par minute environ (le vrai : toutes les trente à quarante
 * minutes, six à dix minutes durant ; sans le toit, il monterait à trente mètres). G : { x, z, y (le sol), toit }.
 * jaillir() : tout de suite ; actif() : jaillit-il ? Le bruit (« oiseau/geyser ») quand il part, si l'on est assez près.
 */
function creerGeyser(THREE, G) {
  const N = 340, nu = nuee(THREE, N, { tache: tacheDouce(THREE, 0.4) }), gouttes = [];
  const objet = new THREE.Group();
  objet.add(nu.m);
  // (la colonne d'eau : un fuseau blanc translucide, de la bouche au toit)
  const colonne = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.2, 1, 14, 1, true), new THREE.MeshBasicMaterial({ color: '#eef6f8', transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide, fog: true }));
  colonne.renderOrder = 2;
  objet.add(colonne);
  const X = G.x, Z = G.z + 0.8, Y = G.y - 0.15, H = G.toit - 0.3;
  let t = 25, force = 0, bruit = false;
  const DUREE = 11;
  const g = {
    objet, bouffees: null,
    jaillir() { if (t > 0.8) t = 0.8; },
    actif: () => t <= 0 && t > -DUREE,
    maj(dt, temps, c) {
      t -= dt;
      const sons = [];
      // la force : elle monte d'un coup, tient, puis faiblit
      const e = -t;
      force = e < 0 ? 0 : e < 0.8 ? e / 0.8 : e < DUREE - 3 ? 1 : Math.max(0, (DUREE - e) / 3);
      if (e > 0 && !bruit) {
        bruit = true;
        if (Math.hypot(c.joueur.x - X, c.joueur.z - Z) < 70) sons.push({ x: X, y: Y + 2, z: Z, nom: 'geyser', fort: 2 });
        g.bouffees?.emettre(X, Y + 1, Z, { duree: DUREE - 2, n: 90, large: 2.8, haut: 6, taille: 2.6 });
      }
      if (e > DUREE + 2) { t = 50 + Math.random() * 30; bruit = false; }
      colonne.visible = force > 0.05;
      if (colonne.visible) {
        const h = (H - Y) * Math.min(1, force * 1.3);
        colonne.scale.set(0.7 + 0.7 * force, h, 0.7 + 0.7 * force);
        colonne.position.set(X, Y + h / 2, Z);
        colonne.material.opacity = 0.55 * force;
      }
      // les gouttes : elles partent de la bouche, montent, s'écrasent sous le toit et s'écartent, retombent
      for (let k = 0; k < N; k++) {
        let q = gouttes[k];
        if (!q && force > 0.05 && Math.random() < force * dt * 40) {
          const a = Math.random() * 2 * PI, s = Math.random() * 0.6;
          q = gouttes[k] = { x: X + Math.cos(a) * 0.1, y: Y, z: Z + Math.sin(a) * 0.1, vx: Math.cos(a) * s, vz: Math.sin(a) * s, vy: (7.5 + Math.random() * 3) * (0.6 + 0.4 * force), haut: false };
        }
        if (!q) continue;
        q.vy -= 9.8 * dt;
        q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
        if (!q.haut && q.y > H) {
          q.haut = true; q.y = H; q.vy = -Math.abs(q.vy) * 0.12;
          const a = Math.random() * 2 * PI, s = 1.8 + Math.random() * 2.2;
          q.vx += Math.cos(a) * s; q.vz += Math.sin(a) * s * 0.7;
        }
        if (q.y < Y - 0.3) { gouttes[k] = null; nu.ranger(k); continue; }
        nu.poser(k, q.x, q.y, q.z, q.haut ? 0.3 : 0.38, 0.92, 0.97, 1, 0.8);
      }
      nu.fin();
      return sons;
    },
  };
  return g;
}
/** Une feuille où sont écrits, de haut en bas, les six caractères de la prière d'Ippen (南無阿弥陀仏) : une texture. */
function ecritureIppen(THREE, rond = false) {
  if (typeof document === 'undefined') return null;
  const t = document.createElement('canvas'), W = rond ? 256 : 64, H = 256;
  t.width = W; t.height = H;
  const c = t.getContext('2d');
  c.fillStyle = rond ? '#e8b030' : '#1c1612';
  c.strokeStyle = '#5a3c0c';
  c.lineWidth = 3;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  const CAR = '南無阿弥陀仏';
  if (rond) {
    // (en rond, pour l'eau qui se calme : les caractères tout autour, tournés vers le milieu)
    c.font = '30px "Yuji Syuku", "Yu Mincho", "Noto Serif JP", serif';
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * 2 * PI;
      c.save(); c.translate(128 + Math.sin(a) * 96, 128 - Math.cos(a) * 96); c.rotate(a); c.strokeText(CAR[k % 6], 0, 0); c.fillText(CAR[k % 6], 0, 0); c.restore();
    }
  } else {
    c.font = 'bold 36px "Yuji Syuku", "Yu Mincho", "Noto Serif JP", serif';
    [...CAR].forEach((ch, k) => c.fillText(ch, W / 2, 22 + k * 42));
  }
  const tex = new THREE.CanvasTexture(t);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
/** Une étoile douce à quatre branches (l'éclat qui scintille au-dessus des pierres d'Ippen). */
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
 * Les trois pierres d'Ippen (le secret) : de petites pierres plates dressées, la prière écrite à l'encre de haut en bas.
 * Au-dessus de celles qu'on n'a pas ramassées, de jour comme de nuit, la légende lue ou non : un halo doré qui respire et
 * une étoile qui scintille, d'une taille fixe à l'écran (vus jusqu'à 70 m). Une pierre en main, une lueur au-dessus de chaque
 * enfer où l'on peut la jeter (appels : [{ e, x, y, z }]).
 * ramasser(id) ; lancer(de, vers) : la pierre vole jusqu'à l'eau (se résout quand elle y tombe) ; calmer(p, boue) : des ronds,
 * et la prière en rond qui s'allume sur l'eau, puis s'efface ; koban(de, vers) : un koban qui monte de l'eau et vient au bord.
 */
function creerPierres(THREE, liste, lampe, appels) {
  const objet = new THREE.Group();
  const matP = new THREE.MeshLambertMaterial({ color: '#8f877a' }), geoP = new THREE.DodecahedronGeometry(0.2, 0);
  const ecrit = ecritureIppen(THREE), matE = ecrit ? new THREE.MeshBasicMaterial({ map: ecrit, transparent: true, depthWrite: false }) : null;
  const pierres = liste.map((p) => {
    const g = new THREE.Group(), m = new THREE.Mesh(geoP, matP);
    m.scale.set(0.85, 1.35, 0.42);
    m.position.y = 0.22;
    g.add(m);
    if (matE) { const e = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.3), matE); e.position.set(0, 0.25, 0.087); g.add(e); }
    g.position.set(p.x, p.y - 0.02, p.z);
    g.rotation.set(-0.12, p.ry, 0.06);
    objet.add(g);
    return { ...p, g };
  });
  // les lueurs, des points d'une taille fixe à l'écran (vus de loin ; deux fois plus de pixels sur les écrans denses) : un
  // halo et une étoile par pierre, une lueur par enfer où jeter. (Jusqu'au 2026-10-27, une seule lueur, une fois la légende
  // lue, de 36 pixels, à 0,6 de jour : à 8 m on la voyait à peine, à 15 m plus du tout.)
  const NP = liste.length, NA = appels.length, px = Math.min(globalThis.devicePixelRatio || 1, 2);
  const tache = tacheDouce(THREE, 0.35);
  tache.magFilter = tache.minFilter = THREE.LinearFilter;
  const lueur = nuee(THREE, NP + NA, { tache, additif: true }), etoile = nuee(THREE, NP, { tache: etoileDouce(THREE), additif: true });
  for (const n of [lueur, etoile]) { n.m.material.sizeAttenuation = false; objet.add(n.m); }
  // l'état du secret (dans le stockage du navigateur), relu toutes les 0,4 s : les pierres ramassées, les enfers où l'on en a
  // jeté une, celles qu'on a en main, la dernière qui reste
  let relu = -1, s = null;
  const relire = (temps) => {
    if (s && temps - relu < 0.4 && temps >= relu) return s;
    relu = temps;
    const fini = secretTrouve('ippen'), pris = liste.map((p) => indiceVu(`ippen-${p.id}`)), jete = appels.map((q) => indiceVu(`ippen-${q.e}`));
    const n = pris.filter(Boolean).length;
    return (s = { fini, pris, jete, main: n - jete.filter(Boolean).length, derniere: !fini && n === NP - 1 ? liste[pris.indexOf(false)] : null });
  };
  // la pierre qui vole ; les ronds ; la prière sur l'eau ; le koban
  const vol = new THREE.Mesh(geoP, matP);
  vol.scale.set(0.85, 1.35, 0.42);
  vol.visible = false;
  objet.add(vol);
  const ronds = Array.from({ length: 6 }, () => {
    const r = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.36, 32).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ color: '#fff3d0', transparent: true, opacity: 0, depthWrite: false }));
    r.visible = false;
    r.renderOrder = 2;
    objet.add(r);
    return { m: r, t: -1 };
  });
  const rond = ecritureIppen(THREE, true);
  const priere = new THREE.Mesh(new THREE.PlaneGeometry(4, 4).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ map: rond, transparent: true, opacity: 0, depthWrite: false }));
  priere.visible = false;
  priere.renderOrder = 2;
  objet.add(priere);
  const koban = new THREE.Group();
  {
    const or = new THREE.MeshLambertMaterial({ color: '#e8b941', emissive: '#6a4a10' });
    const d = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.025, 24), or);
    d.scale.set(0.72, 1, 1.15);
    d.rotation.x = PI / 2;
    koban.add(d);
    koban.visible = false;
    objet.add(koban);
  }
  // (la lumière dorée, la nuit : une lampe de lueurs.js qui suit ; rangée sous le sol le reste du temps)
  const allumer = (x, y, z, v) => { lampe.x = x; lampe.y = v > 0.05 ? y : -500; lampe.z = z; };
  let jet = null, calme = null, monte = null;
  const api = {
    objet,
    // montrer(jeu) : la scène qui dit où est la dernière pierre (donnée par le lieu) ; vue : déjà dite (ou une pierre ramassée,
    // qui la dit elle-même) : sinon, en arrivant avec deux pierres ramassées, on la dit une fois, dès qu'on est libre
    montrer: null, vue: false,
    // (après une pierre ramassée ou jetée, l'état est relu à l'image suivante)
    ramasser(id) { const p = pierres.find((q) => q.id === id); if (p) p.g.visible = false; s = null; },
    lancer(de, vers) {
      return new Promise((fin) => { jet = { de, vers, t: 0, fin }; vol.visible = true; });
    },
    calmer(p, boue) {
      s = null;
      return new Promise((fin) => { calme = { p, t: 0, fin, boue }; });
    },
    koban(de, vers) {
      return new Promise((fin) => { monte = { de, vers, t: 0, fin }; koban.visible = true; });
    },
    maj(dt, temps, c) {
      const S = relire(temps), j = c.joueur, D = S.derniere;
      if (D && !api.vue && api.montrer && c.scene) { api.vue = true; c.scene((jeu) => api.montrer(jeu)); }
      // (la lampe, quand rien d'autre ne l'occupe : sur la dernière pierre, sinon rangée)
      if (!jet && !calme && !monte) { if (D) allumer(D.x, D.y + 1.3, D.z, 1); else if (lampe.y > -400) allumer(0, 0, 0, 0); }
      pierres.forEach((p, k) => {
        if (S.pris[k]) p.g.visible = false;
        const d = Math.hypot(j.x - p.x, j.z - p.z);
        if (S.fini || !p.g.visible || d > 70) { lueur.ranger(k); etoile.ranger(k); return; }
        const pres = lisse(1.2, 3.5, d), b = (0.6 + 0.4 * Math.sin(temps * 2.2 + k * 2)) * pres, y = p.y + 1.15 + 0.06 * Math.sin(temps * 1.3 + k);
        lueur.poser(k, p.x, y, p.z, 54 * px, b, b * 0.82, b * 0.4, 1);
        // (l'étoile : deux scintillements qui se croisent, comme le soleil sur de l'or)
        const e = Math.max(0, Math.sin(temps * 3.1 + k) * Math.sin(temps * 1.9 + k * 1.7)), f = (0.45 + 0.55 * e) * pres;
        etoile.poser(k, p.x, y, p.z, (22 + 26 * e) * px, f, f * 0.92, f * 0.7, 1);
      });
      // une pierre en main : une lueur au-dessus de chaque enfer où l'on peut la jeter
      appels.forEach((q, k) => {
        const i = NP + k, d = Math.hypot(j.x - q.x, j.z - q.z);
        if (S.fini || S.main < 1 || S.jete[k] || d > 60) { lueur.ranger(i); return; }
        const b = (0.75 + 0.25 * Math.sin(temps * 2.6 + k)) * lisse(1.5, 4, d);
        lueur.poser(i, q.x, q.y + 0.08 * Math.sin(temps * 1.7 + k), q.z, 44 * px, b, b * 0.85, b * 0.5, 1);
      });
      lueur.fin();
      etoile.fin();
      // la pierre qui vole : un arc, en tournant
      if (jet) {
        jet.t += dt;
        const f = Math.min(1, jet.t / 0.95), [x0, y0, z0] = jet.de, [x1, y1, z1] = jet.vers;
        vol.position.set(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f + 2.4 * f * (1 - f) * 2, z0 + (z1 - z0) * f);
        vol.rotation.set(jet.t * 9, jet.t * 5, 0);
        if (f >= 1) { vol.visible = false; const q = jet; jet = null; q.fin(); }
      }
      // l'eau qui se calme : des ronds, la prière qui s'allume en rond, une lueur dorée ; 4,5 s
      if (calme) {
        const q = calme, [x, y, z] = q.p;
        if (q.t === 0) ronds.forEach((r, i) => { r.t = -i * 0.35; r.m.position.set(x, y + 0.015, z); });
        q.t += dt;
        priere.visible = true;
        priere.position.set(x, y + 0.03, z);
        priere.rotation.y = q.t * 0.25;
        priere.scale.setScalar(0.85 + 0.06 * q.t);
        priere.material.opacity = Math.min(1, q.t / 0.8) * (1 - lisse(3.4, 4.5, q.t)) * (q.boue ? 0.8 : 1);
        allumer(x, y + 0.6, z, Math.min(1, q.t / 0.6) * (1 - lisse(3.2, 4.5, q.t)));
        if (q.t > 4.5) { priere.visible = false; allumer(0, 0, 0, 0); calme = null; q.fin(); }
      }
      for (const r of ronds) {
        if (r.t === -1 && !r.m.visible) continue;
        r.t += dt;
        r.m.visible = r.t > 0;
        if (r.t <= 0) continue;
        r.m.scale.setScalar(1 + r.t * 2.4);
        r.m.material.opacity = 0.7 * Math.max(0, 1 - r.t / 1.6);
        if (r.t > 1.6) { r.t = -1; r.m.visible = false; }
      }
      // le koban : il monte de l'eau en tournant, brille, et vient flotter devant le voyageur
      if (monte) {
        const q = monte, [x0, y0, z0] = q.de, [x1, y1, z1] = q.vers;
        q.t += dt;
        const a = Math.min(1, q.t / 1.6), b = lisse(1.8, 3.4, q.t);
        koban.position.set(x0 + (x1 - x0) * b, y0 + 1.4 * a * (1 - b) + (y1 - y0) * b + 0.05 * Math.sin(q.t * 3), z0 + (z1 - z0) * b);
        koban.rotation.y = q.t * 4;
        allumer(koban.position.x, koban.position.y, koban.position.z, 1);
        if (q.t > 4.2) { koban.visible = false; allumer(0, 0, 0, 0); monte = null; q.fin(); }
      }
      return [];
    },
  };
  return api;
}

// ---------------------------------------------------------------- La pommade du lac de sang
/**
 * La pommade du lac de sang (血の池軟膏) : un petit pot rond au couvercle rouge, son étiquette ; on la fait, dit-on, avec
 * l'argile rouge que l'enfer rejette au fond de son eau.
 */
function pommadeSVG() {
  // (2026-10-28, la troisième liste : « si tu peux refaire aussi l'image de la pommade » — un pot posé de face, son étiquette qui
  // débordait de son bas. Maintenant un vrai petit pot rond vu un peu de haut : le couvercle rouge et son ♨, le corps de
  // faïence blanche qui s'arrondit, l'étiquette qui épouse sa courbe ; devant, un second pot ouvert, la pâte d'argile rouge
  // et sa spatule de bois.)
  const f = "font-family=\"'M PLUS Rounded 1c', sans-serif\"";
  return `<svg viewBox="8 52 288 192" width="330" height="220" style="max-width:76vw;max-height:58vh" aria-hidden="true">
    <defs>
      <linearGradient id="pmCorps" x1="0" x2="1"><stop offset="0" stop-color="#e6dcc8"/><stop offset="0.35" stop-color="#fbf7ee"/><stop offset="0.8" stop-color="#efe7d6"/><stop offset="1" stop-color="#d6cab4"/></linearGradient>
      <linearGradient id="pmBord" x1="0" x2="1"><stop offset="0" stop-color="#9c2a1c"/><stop offset="0.4" stop-color="#c8402c"/><stop offset="1" stop-color="#8e2418"/></linearGradient>
      <radialGradient id="pmDessus" cx="0.4" cy="0.35" r="0.75"><stop offset="0" stop-color="#ea6a4a"/><stop offset="1" stop-color="#c0392b"/></radialGradient>
      <radialGradient id="pmPate" cx="0.45" cy="0.4" r="0.7"><stop offset="0" stop-color="#b8563c"/><stop offset="1" stop-color="#7e2a1c"/></radialGradient>
      <clipPath id="pmEtiq"><path d="M58 126 A78 20 0 0 0 214 126 L214 176 A78 20 0 0 1 58 176 Z"/></clipPath>
    </defs>
    <ellipse cx="150" cy="221" rx="130" ry="16" fill="#3a2a22" opacity="0.13"/>
    <path d="M58 104 L58 186 A78 20 0 0 0 214 186 L214 104 Z" fill="url(#pmCorps)" stroke="#3a2a22" stroke-width="3" stroke-linejoin="round"/>
    <g clip-path="url(#pmEtiq)">
      <rect x="50" y="110" width="172" height="100" fill="#fff9ec"/>
      <path d="M86 168 q22 -12 50 -4 q26 8 48 -2 q-4 14 -48 14 q-40 0 -50 -8 Z" fill="#c84a32" opacity="0.16"/>
    </g>
    <path d="M58 126 A78 20 0 0 0 214 126" fill="none" stroke="#a8281c" stroke-width="2.2"/>
    <path d="M58 176 A78 20 0 0 0 214 176" fill="none" stroke="#a8281c" stroke-width="2.2"/>
    <text x="136" y="160" font-size="22" text-anchor="middle" ${f} fill="#a8281c" font-weight="800">血の池軟膏</text>
    <text x="136" y="180" font-size="11" text-anchor="middle" ${f} fill="#3a2a22">別府 血の池地獄</text>
    <path d="M56 104 L56 88 A80 21 0 0 0 216 88 L216 104 A80 21 0 0 1 56 104 Z" fill="url(#pmBord)" stroke="#3a2a22" stroke-width="3" stroke-linejoin="round"/>
    <path d="M56 99 A80 21 0 0 0 216 99" fill="none" stroke="#e8c26a" stroke-width="2"/>
    <ellipse cx="136" cy="88" rx="80" ry="21" fill="url(#pmDessus)" stroke="#3a2a22" stroke-width="3"/>
    <ellipse cx="110" cy="80" rx="34" ry="6" fill="#fff" opacity="0.28"/>
    <g transform="translate(136 92) scale(1 0.42)" fill="none" stroke="#fff6e6" stroke-width="5" stroke-linecap="round">
      <path d="M-26 4 A26 26 0 0 0 26 4"/>
      <path d="M-11 -6 q-7 -12 0 -22 q7 -10 0 -22 M0 -8 q-7 -12 0 -22 q7 -10 0 -22 M11 -6 q-7 -12 0 -22 q7 -10 0 -22"/>
    </g>
    <ellipse cx="238" cy="205" rx="42" ry="11" fill="#3a2a22" opacity="0.12"/>
    <path d="M202 180 L202 198 A36 10 0 0 0 274 198 L274 180" fill="url(#pmCorps)" stroke="#3a2a22" stroke-width="2.5" stroke-linejoin="round"/>
    <ellipse cx="238" cy="180" rx="36" ry="10" fill="#f6efe0" stroke="#3a2a22" stroke-width="2.5"/>
    <ellipse cx="238" cy="181" rx="29" ry="7" fill="url(#pmPate)"/>
    <path d="M222 180 q8 -4 16 1 q7 4 14 -1" fill="none" stroke="#d27a5c" stroke-width="2" stroke-linecap="round"/>
    <path d="M240 181 L285 156 L289 161 L245 185 Z" fill="#d9b37a" stroke="#3a2a22" stroke-width="2" stroke-linejoin="round"/>
  </svg>`;
}
// les titres des panneaux (en japonais, peints sur le papier)
const TITRES_PANNEAUX = { ippen: '一遍上人と鉄輪', umi: '海地獄', bozu: '鬼石坊主地獄', kamado: 'かまど地獄', shiraike: '白池地獄', chinoike: '血の池地獄', tatsumaki: '龍巻地獄' };

// ---------------------------------------------------------------- Le sol
/** Le sol (sa couleur et sa matière, textures.js) en x, z, à la hauteur h. */
function aspectSol(P, x, z, h) {
  const bruit = bruitDoux(x, z, 3.5);
  // le fond des bassins : sous l'eau colorée, des pierres claires près du bord, l'argile au fond ; la boue
  const sb = surBassins(x, z);
  if (sb.b && sb.d < 1.02) {
    const b = sb.b;
    if (b.sorte === 'boue') return [bruit > 0.5 ? '#8a847a' : '#7a756c', M.terre];
    return h > b.eau - 0.3 ? ['#d8d0bc', M.roche] : [b.id === 'chinoike' || b.id === 'akaike' ? '#8a3424' : b.sorte === 'nenuphars' ? '#3f4a36' : '#6a8a8a', M.terre];
  }
  // autour des bassins des enfers : les dépôts des sources sur la roche, blancs et jaunes (une bande étroite : avant le
  // 2026-10-27, une grande plage crème autour de chaque bassin)
  if (sb.b && sb.d < 1.2 && sb.b.sorte !== 'nenuphars') return [bruit > 0.6 ? '#ddd4bd' : bruit > 0.3 ? P.depot : '#c4b892', M.roche];
  const c = surChemins(x, z), dp = surPlaces(x, z), dc = Math.min(c.d, dp);
  // la rue : des dalles de pierre grises, mouillées de vapeur ; les caillebotis de bois sur la boue
  if (c.c?.rue && c.d < 0.08 + 0.1 * bruit) return [bruit > 0.5 ? '#b2ab9b' : '#a39c8c', M.dalles];
  if (c.c?.bois && c.d < 0.3) return [bruit > 0.5 ? '#7a7266' : '#6e665a', M.terre];
  // ses abords, où l'on marche partout (2026-10-27, la deuxième liste) : d'autres dalles, jusqu'aux haies, aux façades, aux
  // palissades (avant, de la terre et de la mousse au-delà du caniveau)
  if (ecartRue(x, z) < 0.3 + 0.15 * bruit) return [bruit > 0.5 ? '#a8a191' : '#9f9888', M.dalles];
  // les places : des dalles ; les allées des enfers : du gravier gris (avant le 2026-10-27, le sable ratissé des jardins zen,
  // ses vagues, d'un blanc crème, au bord tout déchiqueté) ; le sentier du bois : la terre battue
  if (dp < 0.06 + 0.1 * bruit && !c.c?.rue) return [bruit > 0.5 ? '#c4bba8' : '#b8af9c', M.dalles];
  if (dc < 0.06 + 0.1 * bruit) return c.c?.foret ? [bruit > 0.5 ? '#9c8a6c' : '#8f7d60', M.terre] : [bruit > 0.5 ? '#bdb6a6' : '#b1a999', M.terre];
  // la falaise derrière le geyser : de la roche grise
  if (z < GEYSER.z + 1.2 && Math.abs(x - GEYSER.x) < 15 && z > GEYSER.z - 12) return [bruit > 0.5 ? '#8a8174' : '#7a7266', M.roche];
  // la ville au loin, vers la baie : le gris des rues et des toits
  if (x > 60 && Math.hypot(x + 6, z + 28) > 100) return [bruit > 0.5 ? '#9a958c' : '#8f8a82', M.route];
  // le bois de Shibaseki, la forêt au loin : le sous-bois
  if ((x < -52 && z < -6 && z > -66) || Math.hypot(x + 6, z + 28) > 110) return [bruit > 0.6 ? '#4b6539' : '#557a3a', M.sousBois];
  // la route au bout de la rue, la ville de Kannawa : le goudron
  if (x > ROUTE.x0 && x < ROUTE.x1 && z > -100 && z < 100) return [bruit > 0.5 ? '#6f6c68' : '#6a6763', M.route];
  if (enVille(x, z)) return [bruit > 0.5 ? '#8f8a82' : '#87827b', M.route];
  // le long de la rue : un trottoir de pierre devant les maisons, la terre derrière
  if (z > -18 && z < 20 && x > 18) return surLaLigne(RUE, x, z).d < 6.4 ? [bruit > 0.5 ? '#a8a191' : '#9f9888', M.dalles] : [bruit > 0.5 ? '#9a8a70' : '#8a7c64', M.terre];
  // les jardins des enfers : de la mousse et de l'herbe
  return [bruit > 0.66 ? P.mousseJardinClair : bruit > 0.33 ? P.mousseJardin : P.mousseJardinFonce, M.mousse];
}

// ---------------------------------------------------------------- Les textes du lieu
const TEXTES = {
  fr: {
    noms: { okami: 'L’okami du ryokan', kurabu: 'Le monsieur du club des fumées', moine: 'Le moine pèlerin', mushi: 'La dame du four à vapeur', obaa: 'La grand-mère', enfant: 'Le petit garçon', yukata: 'La promeneuse en yukata', yukata2: 'Le promeneur en yukata', tamago: 'La dame des œufs', videaste: '@random_japan_place', touriste: 'Le touriste', inari: 'La grand-mère', ouvrier: 'Le jardinier de la boue', guide: 'Le guide', amie: 'La touriste', ami: 'Le touriste', jardinier: 'Le jardinier', chiike: 'La vendeuse', gardien: 'Le gardien du geyser' },
    tampons: {
      umi: ['L’enfer de la mer', 'à l’enfer de la mer, au bord du grand bassin bleu, là où la dame cuit les œufs'],
      bozu: ['Les crânes de moines', 'à l’enfer des crânes de moines, sur le caillebotis entre les bassins de boue grise'],
      kamado: ['Le chaudron', 'à l’enfer du chaudron, en face de la rue : le guide, au bord du bassin bleu'],
      shiraike: ['L’étang blanc', 'à l’enfer de l’étang blanc, dans le jardin au sud-ouest de la rue'],
      chinoike: ['Le lac de sang', 'tout en haut du sentier, à l’enfer du lac de sang : la vendeuse de sa boutique'],
    },
    umi: ['L’enfer de la mer (海地獄) ! L’eau est bleue comme la mer… mais elle bout : 98 degrés.', 'Elle est sortie de terre il y a 1 200 ans, quand le mont Tsurumi est entré en éruption. Son bleu vient des minéraux dissous dans l’eau.'],
    umiNuit: ['La nuit, le bassin bleu fume dans le noir. On entend l’eau qui gronde, tout au fond.'],
    oeufs: ['Hop ! La dame remonte le panier : des œufs cuits dans l’eau de l’enfer !', 'Tu veux goûter un œuf de l’enfer ?'],
    oeufGoute: ['Tu écales l’œuf… Le blanc est tout doux, le jaune encore crémeux. Un peu salé, comme l’eau de la source.', 'À Beppu, on dit qu’un œuf de l’enfer rallonge la vie de sept ans !'],
    umiCompagnon: { kon: ['« Un bleu pareil… On dirait que la mer a décidé de bouillir ici. »'], pon: ['« Pon ! Un œuf de plus pour moi ? Sept ans de plus à manger, c’est bon à prendre ! »'], chapu: ['« Chapu… Pour une fois, je ne plonge pas. Même moi, je sais que c’est trop chaud. »'], gao: ['« Gao ! Je monte la garde : personne ne s’approche trop du bord. »'], fuwa: ['« Fuwa… C’est le bleu de la mer d’où je viens. Mais en très, très chaud. »'], saya: ['« La terre respire ici… Elle souffle sa chaleur par l’eau bleue. »'] },
    akaike: ['Un petit étang rouge-orange, juste à côté du grand bassin bleu. Ici aussi, l’eau bout.', 'Deux sources côte à côte, deux couleurs : la terre de Beppu est pleine de surprises.'],
    hasu: ['Des feuilles de nénuphar géantes ! Les plus grandes font plus d’un mètre, avec un bord relevé comme un plateau.', 'On dit qu’un petit enfant pourrait s’asseoir dessus sans couler. L’eau tiède des sources les fait pousser ici, si loin de l’Amazonie.'],
    inariPriere: ['Tu frappes deux fois dans tes mains et tu salues le petit sanctuaire d’Inari, le dieu des récoltes. Ses renards de pierre te regardent.'],
    bozu: ['L’enfer des crânes de moines (鬼石坊主地獄) : de la boue grise qui bout… Regarde bien.', 'Plop ! Une grosse bulle a gonflé, toute ronde et toute lisse… comme le crâne rasé d’un moine (坊主), puis elle a crevé.', 'Autour, la boue garde des cercles, comme les rides de l’eau. Ça fait 1 300 ans qu’elle bout comme ça.'],
    bozuCompagnon: { kon: ['« Plop, plop… On dirait que la terre fait des bulles en réfléchissant. »'], pon: ['« Pon ! On dirait de la soupe miso. …Non ? Bon. »'], chapu: ['« Chapu ! Ça fait plop comme moi quand je plonge ! »'], gao: ['« Gao ! Des crânes de moines… Je ne leur fais pas peur, eux ? »'], fuwa: ['« Fuwa… Chaque bulle est un petit rêve de la terre qui éclate. »'], saya: ['« La boue est chaude comme un ventre… Les racines n’aiment pas trop ça. »'] },
    takaibiki: ['Grrrooonf… La vapeur sort des rochers par saccades, avec un bruit de ronflement.', 'On l’appelle « le ronflement du démon » (鬼の高いびき) : un démon dormirait sous les rochers.'],
    oni: ['Le grand démon rouge de l’enfer du chaudron (かまど地獄), assis sur son chaudron, sa massue de fer levée. Il rit à pleine gueule !', 'Autrefois, on faisait cuire ici, dans la vapeur, le riz des offrandes de la fête du sanctuaire Kamado Hachiman : d’où le nom de « chaudron ».'],
    oniNuit: ['La nuit, le démon rouge rit dans la vapeur… Sous les lanternes, il a l’air encore plus grand.'],
    guide: ['Bienvenue à l’enfer du chaudron ! Six bassins, du « premier quartier » au « sixième » : 一丁目, 二丁目…', 'Et maintenant, mon petit tour de magie !'],
    guideTour: ['Regardez bien la vapeur du troisième bassin, le bleu… J’allume un bâton d’encens, et je souffle sa fumée par-dessus…'],
    guideFin: ['Et voilà : la vapeur a doublé ! La fumée donne aux gouttes d’eau de quoi s’accrocher. Ce n’est pas de la magie… mais presque !'],
    kamadoCompagnon: { kon: ['« Toute cette vapeur… Le guide connaît bien les secrets de son enfer. »'], pon: ['« Pon ! Je veux apprendre ce tour ! Pour cuire mes patates plus vite ! »'], chapu: ['« Chapu ! Un nuage tout neuf ! On dirait qu’il sort d’un bain ! »'], gao: ['« Gao ! Je n’ai même pas eu peur. Enfin… presque pas. »'], fuwa: ['« Fuwaaa… J’adore les nuages. Celui-ci est né devant nous ! »'], saya: ['« La fumée de l’encens vient du bois… Les arbres aident aussi les nuages. »'] },
    k4: ['Le quatrième bassin (四丁目) : son eau bleu pâle change de couleur avec la saison et la chaleur. Un jour plus verte, un jour plus blanche.'],
    k6: ['Le sixième bassin (六丁目) : une boue rouge qui bouillonne, couleur de brique.'],
    ashiyuKamado: ['Un bain de pieds à l’eau bleue de l’enfer, tiède cette fois. Les gens y trempent leurs pieds en sortant de la visite.'],
    shiraike: ['L’enfer de l’étang blanc (白池地獄) : une eau blanche comme du lait, au milieu d’un jardin japonais.', 'Elle sort de terre toute transparente. C’est en refroidissant dans l’étang que ses minéraux la rendent blanche, un peu bleutée.'],
    shiraikeNuit: ['La nuit, l’étang blanc luit doucement sous la lune, comme du lait.'],
    shiraikeCompagnon: { kon: ['« Un étang de lait, avec des pins tout autour… C’est l’enfer le plus calme. »'], pon: ['« Pon ! Du lait chaud ! Il manque juste des biscuits. »'], chapu: ['« Chapu… Si je plonge, je ressors tout blanc ? Comme Kon ? »'], gao: ['« Gao. Un enfer tout blanc, tout tranquille. Rien à garder ici. »'], fuwa: ['« Fuwa… On dirait une perle fondue. »'], saya: ['« Les pins de ce jardin ont les pieds au chaud… Ils ont l’air heureux. »'] },
    chinoikeVue: ['L’enfer du lac de sang (血の池地獄) : une eau rouge comme du sang, qui fume.', 'C’est le plus ancien des enfers : une chronique du VIIIe siècle parle déjà d’un « bain rouge » ici. Son rouge vient d’une argile pleine de fer, qui remonte du fond.'],
    chinoikeVueNuit: ['La nuit, le lac de sang est presque noir. Seule sa vapeur se voit, blanche dans l’obscurité.'],
    chiike: ['Bonjour ! Vous voulez notre pommade ? On la fait avec l’argile rouge du lac, depuis très longtemps.', 'Elle soigne les petits bobos de la peau, dit-on. Je vous en donne un pot ?'],
    chiikeEncore: ['Encore un pot de pommade du lac de sang ? Il en reste !'],
    chiikeNon: ['Revenez quand vous voulez !'],
    pommade: ['Voilà : la pommade du lac de sang (血の池軟膏), dans son petit pot rond au couvercle rouge.', 'Un souvenir de Beppu que l’on rapporte depuis des générations.'],
    chinoikeCompagnon: { kon: ['« Rouge comme les torii… mais en eau bouillante. Quel spectacle. »'], pon: ['« Pon… On dirait de la sauce tomate géante. J’ai faim, d’un coup. »'], chapu: ['« Chapu ! Je préfère quand même l’eau bleue… »'], gao: ['« Gao ! Rouge, c’est la couleur des gardiens courageux ! »'], fuwa: ['« Fuwa… Un coucher de soleil tombé dans un lac. »'], saya: ['« Le fer de la terre… Les arbres en ont un peu dans leurs feuilles, eux aussi. »'] },
    tatsumakiAttente: ['On s’assoit sur les bancs de pierre et on attend… Le gardien regarde sa montre.', '« Ça va partir ! » …'],
    tatsumaki: ['Fshhhhh ! Le geyser de l’enfer de la tornade (龍巻地獄) jaillit d’un coup ! L’eau bouillante tape contre le toit de pierre et retombe en pluie.', 'Sans ce toit, il monterait à 30 mètres ! Le vrai jaillit toutes les trente à quarante minutes.'],
    tatsumakiNuit: ['Fshhhhh ! Dans la nuit, le geyser jaillit, tout blanc, contre le toit de pierre.'],
    tatsumakiCompagnon: { kon: ['« Quelle force ! La terre a vraiment beaucoup de choses à dire, ici. »'], pon: ['« Pon ! J’ai sursauté. Mais j’ai pas lâché mon gâteau ! »'], chapu: ['« Chapuuu ! Une douche géante ! On y retourne ? »'], gao: ['« Gao ! Il rugit encore plus fort que moi ! »'], fuwa: ['« Fuwaaa ! Un dragon d’eau qui monte au ciel ! Un cousin, peut-être ? »'], saya: ['« Les fougères autour adorent cette pluie chaude. »'] },
    tableau: ['« 次の噴出 » : le prochain jaillissement. Dessous, écrit à la craie : « もうすぐ！ » — « Bientôt ! »'],
    mushi: ['Bienvenue au four de l’enfer (地獄蒸し) ! Ici, on cuit tout à la vapeur des sources : œufs, patates douces, maïs…', 'Vous voulez faire cuire quelque chose ?'],
    mushiNon: ['Une autre fois ! La vapeur, elle, ne s’arrête jamais.'],
    mushiCuisson: ['On pose le panier dans le four de pierre, et on referme le couvercle… La vapeur à 98 degrés fait tout le travail.'],
    mushiFini: ['Et voilà ! Des œufs et des patates douces cuits à la vapeur de l’enfer. Un peu salés par la source : c’est ce qui les rend si bons !'],
    mushiCompagnon: { kon: ['« Merci… La patate douce est sucrée comme du miel. »'], pon: ['« Pon pon pon ! La meilleure patate de toute ma vie ! Encore ! »'], chapu: ['« Chapu ! Chaud, chaud, chaud ! …Mais bon ! »'], gao: ['« Gao ! Un vrai repas de gardien ! »'], fuwa: ['« Fuwa… Elle fume comme un petit volcan. »'], saya: ['« Les patates poussent sous la terre… Elles ont eu chaud toute leur vie, ici ! »'] },
    nomiyu: ['La fontaine de l’eau qui se boit (飲泉). Tu en goûtes une gorgée… Elle est chaude, un peu salée, un peu amère.', 'On dit qu’elle fait du bien au ventre. Mais elle ne vaut pas le thé !'],
    statue: ['La statue d’Ippen Shōnin (一遍上人), un moine voyageur, mains jointes, toujours en marche.', 'Il est venu à Kannawa il y a plus de 700 ans. Son histoire est écrite sur le panneau juste à côté.'],
    mushiyu: ['Le bain de vapeur de Kannawa (鉄輪むし湯), le plus ancien de la ville : fondé, dit-on, par le moine Ippen en 1276.', 'Dedans, on s’allonge sur un lit d’herbes (石菖), dans une petite pièce de pierre pleine de vapeur. Huit minutes, et on ressort tout neuf !'],
    mushiyuNuit: ['Le bain de vapeur est fermé pour la nuit. La vapeur, elle, continue de sortir de la cheminée.'],
    okamiJour: ['Bienvenue à Kannawa ! Le soir, quand les lanternes s’allument, les fumées des sources deviennent toutes dorées.', 'Voulez-vous attendre le soir ici ?'],
    okamiNon: ['Prenez votre temps. Les fumées seront toujours là.'],
    okamiSoir: ['…Voilà le soir. Regardez les fumées dans la lumière des lanternes : c’est mon moment préféré.'],
    okamiNuit: ['Une belle nuit à Kannawa… Voulez-vous que le matin revienne ?'],
    okamiReste: ['Restons encore un peu : la nuit, on entend mieux les sources gronder.'],
    okamiMatin: ['Bonjour ! Le petit-déjeuner, c’est des œufs cuits dans la source. Bonne promenade !'],
    'panneau-ippen': ['« Ippen Shōnin et Kannawa »', 'Autrefois, à Kannawa, la terre crachait de l’eau bouillante et de la vapeur partout : les gens n’osaient plus cultiver leurs champs. On appelait ces sources « les enfers ».', 'En 1276, le moine Ippen vint ici. Sur des pierres, il écrivit la prière « Namu Amida Butsu » (南無阿弥陀仏), puis il les jeta dans les sources. Les enfers se calmèrent, et il fit construire un bain de vapeur pour soigner les gens.', 'On dit qu’il reste encore trois de ses pierres, cachées dans Kannawa… et que chaque enfer n’en peut recevoir qu’une.'],
    ippenCompagnon: { kon: ['« Trois pierres cachées… Si on les retrouvait ? Il faudrait jeter chacune dans un enfer différent, comme Ippen. »'], pon: ['« Pon ! Une chasse au trésor ! Trois pierres, trois enfers différents. Ouvre l’œil, moi je surveille les gâteaux. »'], chapu: ['« Chapu ! Des pierres qui calment l’eau bouillante ? Cherchons-les ! Une par enfer ! »'], gao: ['« Gao ! Trois pierres sacrées, cachées… Je vais flairer partout. Une dans chaque enfer, pas deux dans le même ! »'], fuwa: ['« Fuwa… J’entends les pierres qui murmurent la prière. Elles brillent un peu, il me semble… »'], saya: ['« Les arbres de Kannawa ont vu Ippen passer. Ils savent où dorment ses pierres… Cherchons-les, une pour chaque enfer. »'] },
    pierre: ['Une petite pierre plate, dressée… Dessus, à l’encre, six caractères de haut en bas : 南無阿弥陀仏.'],
    pierreRamassee: (n) => [`Tu ramasses la pierre. (${n} sur 3)`],
    pierreCompagnon: { kon: ['« Une pierre d’Ippen ! Il faut la jeter dans un enfer où il n’y en a pas encore. »'], pon: ['« Pon ! Elle est lourde comme un gâteau de riz. Vite, un enfer ! »'], chapu: ['« Chapu ! Dans quel enfer on la lance ? Un nouveau à chaque fois ! »'], gao: ['« Gao ! Je la garde bien. Choisis un enfer où on n’en a pas encore jeté. »'], fuwa: ['« Fuwa… Elle est tiède, comme si elle avait hâte de retrouver l’eau. »'], saya: ['« Cette pierre est vieille… Elle a attendu longtemps qu’on la trouve. »'] },
    pierreInconnueCompagnon: { kon: ['« Une pierre du moine Ippen, celui de la statue, dans la rue ! Il calmait les enfers en y jetant ses pierres. Il en reste trois : jetons chacune dans un enfer différent ! »'], pon: ['« Pon ! C’est une pierre du moine Ippen ! Il les jetait dans les enfers pour les calmer. Il en reste trois : une par enfer, jamais deux dans le même ! »'], chapu: ['« Chapu ! Une prière écrite… une pierre du moine Ippen ! Jetons-la dans un enfer, plouf ! Chaque pierre dans un enfer différent ! »'], gao: ['« Gao ! Une pierre sacrée du moine Ippen : elle calme les enfers. Il y en a trois. Une dans chaque enfer, pas deux dans le même ! »'], fuwa: ['« Fuwa… Elle murmure la prière du moine Ippen. Il calmait les enfers avec ses pierres… Jetons-la dans un enfer, et les deux autres ailleurs. »'], saya: ['« Elle vient du moine Ippen… Il jetait ses pierres dans les enfers pour les apaiser. Trois pierres, trois enfers différents. Le panneau près de sa statue raconte son histoire. »'] },
    derniere: (lieu) => [`La dernière pierre d’Ippen est ${lieu}.`],
    lieuxPierres: { p1: 'au bout du jardin de l’étang blanc, sous le grand érable', p2: 'en haut des torii rouges, devant le petit sanctuaire Inari de l’enfer de la mer', p3: 'au fond de l’enfer des crânes de moines, entre les rochers où ronfle le démon' },
    lancer: (nom) => [`Jeter une pierre d’Ippen dans ${nom} ?`],
    nomsEnfers: { umi: 'l’enfer de la mer', bozu: 'l’enfer des crânes de moines', kamado: 'l’enfer du chaudron', shiraike: 'l’enfer de l’étang blanc', chinoike: 'l’enfer du lac de sang' },
    pierreJetee: (n) => ['Plouf ! La pierre s’enfonce… La prière s’allume sur l’eau, en rond, et l’enfer se calme un instant.', n === 1 ? 'Une pierre jetée. Plus que deux, dans deux autres enfers.' : 'Deux pierres jetées. Plus qu’une, dans un enfer où il n’y en a pas encore.'],
    jeteeCompagnon1: { kon: ['« Tu as vu ? L’eau s’est apaisée… Ippen avait raison. »'], pon: ['« Pon ! Ça a marché ! Encore deux ! »'], chapu: ['« Chapu ! Même les bulles se sont tues ! »'], gao: ['« Gao ! L’enfer obéit. Au suivant ! »'], fuwa: ['« Fuwaaa… La prière brillait comme mes écailles. »'], saya: ['« Le calme… Les arbres autour ont soupiré. »'] },
    jeteeCompagnon2: { kon: ['« Plus qu’une pierre… et un enfer où on n’en a pas encore jeté. »'], pon: ['« Pon ! Plus qu’une ! Après, on fête ça avec des œufs de l’enfer ! »'], chapu: ['« Chapu ! La dernière, la dernière ! »'], gao: ['« Gao ! Plus qu’une. Je sens qu’il va se passer quelque chose. »'], fuwa: ['« Fuwa… Les enfers chantent tout bas. Il manque une voix. »'], saya: ['« Encore une… Kannawa nous regarde. »'] },
    ippenFin: ['Plouf… La troisième pierre s’enfonce. Les trois enfers se calment, ensemble, comme au temps d’Ippen.', 'Au milieu de l’eau apaisée, quelque chose brille et remonte doucement…'],
    videaste: ['Salut ! Moi, c’est @random_japan_place. Je filme les enfers de Beppu pour mon TikTok : le bleu de la mer, le rouge du lac de sang…', 'Tu veux voir ma vidéo ?'],
    kurabu: ['Bonjour ! Je suis du club des fumées de Kannawa (湯けむり). On fait visiter les ruelles où la vapeur sort de partout.', 'Le moine dont tu vois la statue, Ippen, a calmé nos sources il y a plus de 700 ans. Lis son panneau, c’est une belle histoire.'],
    kurabuNuit: ['La nuit, les fumées de Kannawa sont encore plus belles, dans la lumière des lanternes.'],
    moine: ['Je marche de temple en temple, comme le faisait Ippen, avec sa prière pour seul bagage.', 'Il paraît que ses pierres aiment les endroits calmes : un jardin, un sanctuaire… ou le sommeil d’un démon.'],
    moineNuit: ['La nuit, je dors dans un petit temple de la ville. Les sources me bercent.'],
    obaa: ['Ah, le bain de pieds… Je viens tous les jours. À mon âge, c’est le meilleur des médecins.'],
    obaaNuit: ['Le bain de pieds est encore chaud, la nuit. Les étoiles et les pieds au chaud : le bonheur.'],
    enfant: ['Mamie dit que l’eau sort de la terre toute seule, toute chaude ! Moi, je crois qu’il y a un dragon dessous.'],
    yukata: ['On loge au ryokan, juste là. À Beppu, on se promène en yukata d’un bain à l’autre !'],
    yukata2: ['J’ai déjà pris quatre bains aujourd’hui. Encore un avant le dîner, peut-être.'],
    yukataNuit: ['La nuit, avec les lanternes et la vapeur, la rue a l’air d’un rêve.'],
    yukata2Nuit: ['Un dernier bain, et au lit !'],
    tamago: ['Je cuis les œufs dans le panier, là, dans l’eau bleue. Cinq minutes, et ils sont parfaits.'],
    touriste: ['Wow, il y a de la vapeur partout ! Même les caniveaux fument, dans cette ville !', 'Au fait, j’ai vu une drôle de pierre écrite tout en haut des torii rouges : devant le petit sanctuaire, à côté d’un renard de pierre.'],
    inari: ['Je viens remercier Inari chaque semaine. Il garde l’enfer de la mer depuis toujours.'],
    ouvrier: ['Je ratisse la boue sèche des caillebotis. Elle éclabousse quand les bulles crèvent !', 'Au bout, le démon ronfle dans ses rochers. Entre les pierres, il y en a une qui n’est pas comme les autres : elle est écrite.'],
    amie: ['On fait la photo avec le démon rouge ! Il a vraiment une tête rigolote.'],
    ami: ['Il paraît qu’il y a un démon dans chaque enfer. Celui-là, au moins, il sourit.'],
    jardinier: ['Je soigne le jardin de l’étang blanc. Les pins et les érables aiment la terre chaude.', 'Sous le grand érable, au bout du jardin, il y a une vieille pierre écrite. Je n’ose pas y toucher.'],
    gardien: ['Le geyser va bientôt jaillir ! Asseyez-vous sur les bancs : je ne peux pas vous dire quand, mais ce ne sera pas long.'],
    gardienNuit: ['Même la nuit, il jaillit. Il ne dort jamais, ce geyser.'],
    'panneau-umi': ['« L’enfer de la mer »', 'Né d’une éruption du mont Tsurumi il y a environ 1 200 ans. Son eau à 98 °C est d’un bleu de cobalt, à cause du sulfate de fer.', 'Monument national pour la beauté de son paysage.'],
    'panneau-bozu': ['« L’enfer des crânes de moines »', 'De la boue grise qui bout : ses bulles rondes rappellent le crâne rasé des moines (坊主). Au bout, le « ronflement du démon ».'],
    'panneau-kamado': ['« L’enfer du chaudron »', 'Autrefois, on cuisait dans sa vapeur le riz des offrandes du sanctuaire Kamado Hachiman. Six bassins, du premier au sixième quartier.'],
    'panneau-shiraike': ['« L’enfer de l’étang blanc »', 'L’eau sort transparente ; en refroidissant dans l’étang, ses minéraux la rendent blanche, un peu bleutée. Monument national pour la beauté de son paysage.'],
    'panneau-chinoike': ['« L’enfer du lac de sang »', 'Le plus ancien des enfers : la chronique du pays de Bungo (VIIIe siècle) parle déjà d’un « bain rouge ». Son argile rouge sert à faire une pommade.'],
    'panneau-tatsumaki': ['« L’enfer de la tornade »', 'Un geyser qui jaillit toutes les trente à quarante minutes. Un toit de pierre l’arrête ; sans lui, il monterait à 30 mètres.'],
    chatRoux: ['Un chat roux dort en boule près des fours à vapeur : le sol y est toujours tiède.', 'Tu le caresses… Rrrrrr… Il ronronne sans ouvrir les yeux.'],
    chatRouxNuit: ['La nuit, le chat roux est réveillé, assis près des fours encore chauds.', 'Ses yeux brillent dans le noir… Rrrrrr…'],
    chatPie: ['Un chat noir et blanc, près du bain de pieds : à Beppu, les chats savent où il fait chaud.', 'Tu le caresses… Rrrrrr…'],
    chatPieNuit: ['Le chat noir et blanc veille près du bain de pieds. Ses yeux brillent dans le noir.'],
    chatCompagnon: { kon: ['« Un chat de Beppu… Il a trouvé le coin le plus chaud de la ville. »'], pon: ['« Pon ! Il dort au chaud, le veinard. Je peux me mettre à côté ? »'], chapu: ['« Chapu ! Il n’aime pas l’eau… mais il aime la vapeur ! »'], gao: ['« Gao… Un gardien endormi. Je prends son tour de garde. »'], fuwa: ['« Fuwa… Il ronronne comme une source qui bout. »'], saya: ['« Un chat tout chaud… Il sent le soleil et la vapeur. »'] },
    papillon: ['Un asagimadara : un grand papillon aux ailes bleu pâle. En automne, il vole des centaines de kilomètres vers le sud.'],
    libellule: ['Une libellule rouge (akatombo) se pose sur une pierre tiède.'],
  },
  en: {
    noms: { okami: 'The ryokan’s okami', kurabu: 'The steam club gentleman', moine: 'The pilgrim monk', mushi: 'The steam-oven lady', obaa: 'The grandma', enfant: 'The little boy', yukata: 'The stroller in yukata', yukata2: 'The stroller in yukata', tamago: 'The egg lady', videaste: '@random_japan_place', touriste: 'The tourist', inari: 'The grandma', ouvrier: 'The mud gardener', guide: 'The guide', amie: 'The tourist', ami: 'The tourist', jardinier: 'The gardener', chiike: 'The shopkeeper', gardien: 'The geyser keeper' },
    tampons: {
      umi: ['Sea Hell', 'at Sea Hell, by the big blue pool, where the lady cooks the eggs'],
      bozu: ['Monks’ heads', 'at the Monk’s Head Hell, on the boardwalk between the grey mud pools'],
      kamado: ['The cooking pot', 'at the Cooking Pot Hell, across the street: the guide, by the blue pool'],
      shiraike: ['White Pond', 'at White Pond Hell, in the garden south-west of the street'],
      chinoike: ['Blood Pond', 'at the very top of the path, at Blood Pond Hell: the shopkeeper of its shop'],
    },
    umi: ['Sea Hell (海地獄)! The water is as blue as the sea… but it’s boiling: 98 degrees.', 'It burst out of the ground 1,200 years ago, when Mount Tsurumi erupted. Its blue comes from minerals dissolved in the water.'],
    umiNuit: ['At night, the blue pool steams in the dark. You can hear the water rumbling deep down.'],
    oeufs: ['Up it comes! The lady lifts the basket: eggs cooked in the hell water!', 'Want to taste a hell egg?'],
    oeufGoute: ['You peel the egg… The white is soft, the yolk still creamy. A little salty, like the spring water.', 'In Beppu they say a hell egg adds seven years to your life!'],
    umiCompagnon: { kon: ['“Such a blue… As if the sea had decided to boil right here.”'], pon: ['“Pon! One more egg for me? Seven more years of eating, I’ll take it!”'], chapu: ['“Chapu… For once, I won’t dive. Even I know it’s too hot.”'], gao: ['“Gao! I’m standing guard: nobody gets too close to the edge.”'], fuwa: ['“Fuwa… It’s the blue of the sea I come from. Just very, very hot.”'], saya: ['“The earth breathes here… It blows its warmth out through the blue water.”'] },
    akaike: ['A small red-orange pond, right next to the big blue pool. This one boils too.', 'Two springs side by side, two colours: Beppu’s ground is full of surprises.'],
    hasu: ['Giant water-lily leaves! The biggest are over a metre wide, with a raised rim like a tray.', 'They say a small child could sit on one without sinking. The warm spring water lets them grow here, so far from the Amazon.'],
    inariPriere: ['You clap twice and bow to the little shrine of Inari, god of the harvest. His stone foxes watch you.'],
    bozu: ['The Monk’s Head Hell (鬼石坊主地獄): boiling grey mud… Watch closely.', 'Plop! A big bubble swelled up, all round and smooth… like a monk’s shaved head (坊主), then it burst.', 'Around it, the mud keeps rings, like ripples on water. It has been boiling like this for 1,300 years.'],
    bozuCompagnon: { kon: ['“Plop, plop… It’s as if the earth were blowing bubbles while it thinks.”'], pon: ['“Pon! Looks like miso soup. …No? Fine.”'], chapu: ['“Chapu! It goes plop like me when I dive!”'], gao: ['“Gao! Monks’ heads… They’re not scared of me?”'], fuwa: ['“Fuwa… Every bubble is a little dream of the earth, bursting.”'], saya: ['“The mud is warm like a belly… Roots don’t like it much.”'] },
    takaibiki: ['Grrrooonk… Steam bursts out of the rocks in puffs, with a snoring sound.', 'They call it “the demon’s snoring” (鬼の高いびき): a demon is said to sleep under the rocks.'],
    oni: ['The big red demon of the Cooking Pot Hell (かまど地獄), sitting on his pot, his iron club raised. He’s laughing his head off!', 'Long ago, the rice offered at the festival of Kamado Hachiman shrine was steamed here: hence the name “cooking pot”.'],
    oniNuit: ['At night, the red demon laughs in the steam… Under the lanterns, he looks even bigger.'],
    guide: ['Welcome to the Cooking Pot Hell! Six pools, from the “first block” to the “sixth”: 一丁目, 二丁目…', 'And now, my little magic trick!'],
    guideTour: ['Watch the steam of the third pool, the blue one… I light a stick of incense, and blow its smoke over it…'],
    guideFin: ['There you go: the steam has doubled! The smoke gives the water droplets something to cling to. It’s not magic… but almost!'],
    kamadoCompagnon: { kon: ['“All that steam… The guide knows his hell’s secrets well.”'], pon: ['“Pon! I want to learn that trick! To cook my sweet potatoes faster!”'], chapu: ['“Chapu! A brand-new cloud! It looks like it just had a bath!”'], gao: ['“Gao! I wasn’t even scared. Well… hardly.”'], fuwa: ['“Fuwaaa… I love clouds. This one was born right in front of us!”'], saya: ['“Incense smoke comes from wood… Trees help clouds too.”'] },
    k4: ['The fourth pool (四丁目): its pale blue water changes colour with the season and the heat. Greener one day, whiter the next.'],
    k6: ['The sixth pool (六丁目): a bubbling red mud, the colour of brick.'],
    ashiyuKamado: ['A foot bath with the hell’s blue water, warm this time. People soak their feet after the visit.'],
    shiraike: ['White Pond Hell (白池地獄): water as white as milk, in the middle of a Japanese garden.', 'It comes out of the ground perfectly clear. As it cools in the pond, its minerals turn it white, slightly bluish.'],
    shiraikeNuit: ['At night, the white pond glows softly under the moon, like milk.'],
    shiraikeCompagnon: { kon: ['“A pond of milk, with pines all around… It’s the calmest hell.”'], pon: ['“Pon! Hot milk! All it needs is biscuits.”'], chapu: ['“Chapu… If I dive in, will I come out all white? Like Kon?”'], gao: ['“Gao. An all-white, all-quiet hell. Nothing to guard here.”'], fuwa: ['“Fuwa… It looks like a melted pearl.”'], saya: ['“The pines of this garden keep their feet warm… They look happy.”'] },
    chinoikeVue: ['Blood Pond Hell (血の池地獄): water as red as blood, steaming.', 'It’s the oldest of the hells: an 8th-century chronicle already mentions a “red hot spring” here. Its red comes from an iron-rich clay rising from the bottom.'],
    chinoikeVueNuit: ['At night, the blood pond is almost black. Only its steam shows, white in the dark.'],
    chiike: ['Hello! Would you like our ointment? We’ve made it from the pond’s red clay for a very long time.', 'They say it soothes little skin troubles. Shall I give you a jar?'],
    chiikeEncore: ['Another jar of Blood Pond ointment? We still have some!'],
    chiikeNon: ['Come back any time!'],
    pommade: ['Here you are: Blood Pond ointment (血の池軟膏), in its little round jar with a red lid.', 'A Beppu souvenir people have taken home for generations.'],
    chinoikeCompagnon: { kon: ['“Red like the torii… but boiling. What a sight.”'], pon: ['“Pon… It looks like giant tomato sauce. I’m suddenly hungry.”'], chapu: ['“Chapu! I still prefer the blue water…”'], gao: ['“Gao! Red is the colour of brave guardians!”'], fuwa: ['“Fuwa… A sunset that fell into a lake.”'], saya: ['“The earth’s iron… Trees have a little in their leaves too.”'] },
    tatsumakiAttente: ['We sit on the stone benches and wait… The keeper checks his watch.', '“Here it comes!” …'],
    tatsumaki: ['Fshhhhh! The geyser of Tornado Hell (龍巻地獄) bursts out all at once! The boiling water slams into the stone roof and falls back like rain.', 'Without that roof, it would shoot 30 metres high! The real one erupts every thirty to forty minutes.'],
    tatsumakiNuit: ['Fshhhhh! In the night, the geyser bursts out, all white, against the stone roof.'],
    tatsumakiCompagnon: { kon: ['“Such power! The earth really has a lot to say here.”'], pon: ['“Pon! I jumped. But I didn’t drop my cake!”'], chapu: ['“Chapuuu! A giant shower! Can we go again?”'], gao: ['“Gao! It roars even louder than me!”'], fuwa: ['“Fuwaaa! A water dragon rising to the sky! A cousin, maybe?”'], saya: ['“The ferns around love this warm rain.”'] },
    tableau: ['“次の噴出”: the next eruption. Below, in chalk: “もうすぐ！” — “Soon!”'],
    mushi: ['Welcome to the hell oven (地獄蒸し)! Here we cook everything in the springs’ steam: eggs, sweet potatoes, corn…', 'Would you like to cook something?'],
    mushiNon: ['Another time! The steam never stops anyway.'],
    mushiCuisson: ['The basket goes into the stone oven, and the lid closes… The 98-degree steam does all the work.'],
    mushiFini: ['There we go! Eggs and sweet potatoes steamed by the hell. A little salty from the spring: that’s what makes them so good!'],
    mushiCompagnon: { kon: ['“Thank you… The sweet potato is as sweet as honey.”'], pon: ['“Pon pon pon! The best sweet potato of my whole life! More!”'], chapu: ['“Chapu! Hot, hot, hot! …But good!”'], gao: ['“Gao! A real guardian’s meal!”'], fuwa: ['“Fuwa… It steams like a little volcano.”'], saya: ['“Sweet potatoes grow underground… They’ve been warm all their lives here!”'] },
    nomiyu: ['The drinking fountain (飲泉). You take a sip… It’s warm, a little salty, a little bitter.', 'They say it’s good for the stomach. But it’s no match for tea!'],
    statue: ['The statue of Ippen Shōnin (一遍上人), a wandering monk, hands joined, always walking.', 'He came to Kannawa more than 700 years ago. His story is written on the sign right next to it.'],
    mushiyu: ['The Kannawa steam bath (鉄輪むし湯), the oldest in town: founded, they say, by the monk Ippen in 1276.', 'Inside, you lie on a bed of herbs (石菖) in a small stone room full of steam. Eight minutes, and you come out brand new!'],
    mushiyuNuit: ['The steam bath is closed for the night. The steam still pours out of the chimney.'],
    okamiJour: ['Welcome to Kannawa! In the evening, when the lanterns light up, the steam turns all golden.', 'Would you like to wait for the evening here?'],
    okamiNon: ['Take your time. The steam will always be here.'],
    okamiSoir: ['…Here’s the evening. Look at the steam in the lantern light: it’s my favourite moment.'],
    okamiNuit: ['A lovely night in Kannawa… Shall I bring the morning back?'],
    okamiReste: ['Let’s stay a little longer: at night you hear the springs rumble better.'],
    okamiMatin: ['Good morning! Breakfast is eggs cooked in the spring. Enjoy your walk!'],
    'panneau-ippen': ['“Ippen Shōnin and Kannawa”', 'Long ago in Kannawa, the ground spat boiling water and steam everywhere: people no longer dared farm their fields. These springs were called “the hells”.', 'In 1276, the monk Ippen came here. On stones he wrote the prayer “Namu Amida Butsu” (南無阿弥陀仏), then threw them into the springs. The hells calmed down, and he had a steam bath built to heal people.', 'They say three of his stones are still hidden in Kannawa… and that each hell can take only one.'],
    ippenCompagnon: { kon: ['“Three hidden stones… What if we found them? Each one must go into a different hell, like Ippen did.”'], pon: ['“Pon! A treasure hunt! Three stones, three different hells. You look, I’ll watch the cakes.”'], chapu: ['“Chapu! Stones that calm boiling water? Let’s find them! One per hell!”'], gao: ['“Gao! Three sacred stones, hidden… I’ll sniff everywhere. One in each hell, never two in the same!”'], fuwa: ['“Fuwa… I can hear the stones whispering the prayer. They glow a little, I think…”'], saya: ['“Kannawa’s trees saw Ippen pass. They know where his stones sleep… Let’s find them, one for each hell.”'] },
    pierre: ['A small flat stone, standing upright… On it, in ink, six characters from top to bottom: 南無阿弥陀仏.'],
    pierreRamassee: (n) => [`You pick up the stone. (${n} of 3)`],
    pierreCompagnon: { kon: ['“One of Ippen’s stones! It must go into a hell that has none yet.”'], pon: ['“Pon! It’s as heavy as a rice cake. Quick, a hell!”'], chapu: ['“Chapu! Which hell do we throw it in? A new one each time!”'], gao: ['“Gao! I’ll keep it safe. Pick a hell where we haven’t thrown one yet.”'], fuwa: ['“Fuwa… It’s warm, as if it couldn’t wait to find the water again.”'], saya: ['“This stone is old… It waited a long time to be found.”'] },
    pierreInconnueCompagnon: { kon: ['“One of the monk Ippen’s stones, the monk of the statue in the street! He calmed the hells by throwing his stones into them. Three are left: let’s throw each one into a different hell!”'], pon: ['“Pon! It’s one of the monk Ippen’s stones! He threw them into the hells to calm them down. Three are left: one per hell, never two in the same one!”'], chapu: ['“Chapu! A written prayer… one of the monk Ippen’s stones! Let’s throw it into a hell, plop! Each stone into a different hell!”'], gao: ['“Gao! A sacred stone of the monk Ippen: it calms the hells. There are three. One in each hell, never two in the same one!”'], fuwa: ['“Fuwa… It whispers the monk Ippen’s prayer. He calmed the hells with his stones… Let’s throw it into a hell, and the other two somewhere else.”'], saya: ['“It comes from the monk Ippen… He threw his stones into the hells to soothe them. Three stones, three different hells. The sign by his statue tells his story.”'] },
    derniere: (lieu) => [`The last of Ippen’s stones is ${lieu}.`],
    lieuxPierres: { p1: 'at the end of the White Pond garden, under the big maple', p2: 'at the top of the red torii, in front of the little Inari shrine of Sea Hell', p3: 'at the far end of the Monk’s Head Hell, among the rocks where the demon snores' },
    lancer: (nom) => [`Throw one of Ippen’s stones into ${nom}?`],
    nomsEnfers: { umi: 'Sea Hell', bozu: 'the Monk’s Head Hell', kamado: 'the Cooking Pot Hell', shiraike: 'White Pond Hell', chinoike: 'Blood Pond Hell' },
    pierreJetee: (n) => ['Plop! The stone sinks… The prayer lights up on the water in a ring, and the hell calms down for a moment.', n === 1 ? 'One stone thrown. Two to go, in two other hells.' : 'Two stones thrown. One to go, in a hell that has none yet.'],
    jeteeCompagnon1: { kon: ['“Did you see? The water calmed down… Ippen was right.”'], pon: ['“Pon! It worked! Two more!”'], chapu: ['“Chapu! Even the bubbles went quiet!”'], gao: ['“Gao! The hell obeys. Next!”'], fuwa: ['“Fuwaaa… The prayer shone like my scales.”'], saya: ['“Calm… The trees around sighed.”'] },
    jeteeCompagnon2: { kon: ['“One stone left… and a hell where we haven’t thrown one yet.”'], pon: ['“Pon! One left! Then we celebrate with hell eggs!”'], chapu: ['“Chapu! The last one, the last one!”'], gao: ['“Gao! One left. I feel something’s about to happen.”'], fuwa: ['“Fuwa… The hells are singing softly. One voice is missing.”'], saya: ['“One more… Kannawa is watching us.”'] },
    ippenFin: ['Plop… The third stone sinks. The three hells calm down together, as in Ippen’s day.', 'In the middle of the still water, something gleams and slowly rises…'],
    videaste: ['Hi! I’m @random_japan_place. I’m filming the hells of Beppu for my TikTok: the sea blue, the blood-pond red…', 'Want to see my video?'],
    kurabu: ['Hello! I’m from the Kannawa steam club (湯けむり). We show people the lanes where steam comes out everywhere.', 'The monk whose statue you see, Ippen, calmed our springs more than 700 years ago. Read his sign, it’s a lovely story.'],
    kurabuNuit: ['At night, Kannawa’s steam is even more beautiful in the lantern light.'],
    moine: ['I walk from temple to temple, as Ippen did, with his prayer as my only luggage.', 'They say his stones like calm places: a garden, a shrine… or a demon’s sleep.'],
    moineNuit: ['At night I sleep in a small temple in town. The springs rock me to sleep.'],
    obaa: ['Ah, the foot bath… I come every day. At my age, it’s the best of doctors.'],
    obaaNuit: ['The foot bath is still warm at night. Stars above and warm feet: bliss.'],
    enfant: ['Grandma says the water comes out of the ground all by itself, all hot! I think there’s a dragon underneath.'],
    yukata: ['We’re staying at the ryokan right there. In Beppu, you stroll in yukata from one bath to the next!'],
    yukata2: ['I’ve already had four baths today. Maybe one more before dinner.'],
    yukataNuit: ['At night, with the lanterns and the steam, the street looks like a dream.'],
    yukata2Nuit: ['One last bath, then bed!'],
    tamago: ['I cook the eggs in the basket, there, in the blue water. Five minutes, and they’re perfect.'],
    touriste: ['Wow, there’s steam everywhere! Even the gutters are steaming in this town!', 'By the way, I saw a strange stone with writing on it at the very top of the red torii: in front of the little shrine, next to a stone fox.'],
    inari: ['I come to thank Inari every week. He has always watched over Sea Hell.'],
    ouvrier: ['I rake the dried mud off the boardwalks. It splatters when the bubbles burst!', 'At the end, the demon snores in his rocks. Among the stones, there’s one unlike the others: it has writing on it.'],
    amie: ['We’re taking a photo with the red demon! He really has a funny face.'],
    ami: ['They say there’s a demon in every hell. At least this one is smiling.'],
    jardinier: ['I look after the White Pond garden. Pines and maples love the warm ground.', 'Under the big maple at the end of the garden, there’s an old stone with writing on it. I don’t dare touch it.'],
    gardien: ['The geyser will burst soon! Sit on the benches: I can’t tell you when, but it won’t be long.'],
    gardienNuit: ['It erupts even at night. This geyser never sleeps.'],
    'panneau-umi': ['“Sea Hell”', 'Born from an eruption of Mount Tsurumi about 1,200 years ago. Its 98 °C water is cobalt blue, because of iron sulphate.', 'A national Place of Scenic Beauty.'],
    'panneau-bozu': ['“Monk’s Head Hell”', 'Boiling grey mud: its round bubbles recall the shaved heads of monks (坊主). At the end, “the demon’s snoring”.'],
    'panneau-kamado': ['“Cooking Pot Hell”', 'Long ago, the rice offered at Kamado Hachiman shrine was steamed here. Six pools, from the first block to the sixth.'],
    'panneau-shiraike': ['“White Pond Hell”', 'The water comes out clear; as it cools in the pond, its minerals turn it white, slightly bluish. A national Place of Scenic Beauty.'],
    'panneau-chinoike': ['“Blood Pond Hell”', 'The oldest of the hells: the chronicle of Bungo province (8th century) already mentions a “red hot spring”. Its red clay is made into an ointment.'],
    'panneau-tatsumaki': ['“Tornado Hell”', 'A geyser that erupts every thirty to forty minutes. A stone roof stops it; without it, it would shoot 30 metres high.'],
    chatRoux: ['A ginger cat sleeps curled up by the steam ovens: the ground there is always warm.', 'You pet it… Prrrrr… It purrs without opening its eyes.'],
    chatRouxNuit: ['At night, the ginger cat is awake, sitting by the still-warm ovens.', 'Its eyes glow in the dark… Prrrrr…'],
    chatPie: ['A black-and-white cat by the foot bath: in Beppu, cats know where it’s warm.', 'You pet it… Prrrrr…'],
    chatPieNuit: ['The black-and-white cat keeps watch by the foot bath. Its eyes glow in the dark.'],
    chatCompagnon: { kon: ['“A Beppu cat… It found the warmest spot in town.”'], pon: ['“Pon! Sleeping in the warm, lucky thing. Can I lie next to it?”'], chapu: ['“Chapu! It doesn’t like water… but it likes steam!”'], gao: ['“Gao… A sleeping guardian. I’ll take its watch.”'], fuwa: ['“Fuwa… It purrs like a boiling spring.”'], saya: ['“A warm cat… It smells of sun and steam.”'] },
    papillon: ['An asagimadara: a big butterfly with pale blue wings. In autumn it flies hundreds of kilometres south.'],
    libellule: ['A red dragonfly (akatombo) lands on a warm stone.'],
  },
  ja: {
    noms: { okami: '旅館の　おかみさん', kurabu: '湯けむりクラブの　おじさん', moine: 'たびの　おぼうさん', mushi: '地獄蒸しの　おばさん', obaa: 'おばあさん', enfant: 'おとこのこ', yukata: 'ゆかたの　おねえさん', yukata2: 'ゆかたの　おにいさん', tamago: 'たまごの　おばさん', videaste: '@random_japan_place', touriste: 'かんこうきゃく', inari: 'おばあさん', ouvrier: 'どろの　そうじの　おじさん', guide: 'ガイドさん', amie: 'かんこうきゃく', ami: 'かんこうきゃく', jardinier: 'にわしさん', chiike: 'おみせの　ひと', gardien: 'ふんせんの　ばんにん' },
    tampons: {
      umi: ['海地獄', '海地獄の　大きな　青い　いけの　そば。おばさんが　たまごを　ゆでて　いる　ところ'],
      bozu: ['鬼石坊主', '鬼石坊主地獄の、はいいろの　どろの　いけの　あいだの　木の　みち'],
      kamado: ['かまど', 'みちの　むかいの　かまど地獄。青い　いけの　そばの　ガイドさん'],
      shiraike: ['白池', 'みちの　南西、白池地獄の　にわ'],
      chinoike: ['血の池', 'こみちの　いちばん　上、血の池地獄の　おみせの　ひと'],
    },
    umi: ['海地獄だ！　水が　海みたいに　青い……　でも　にえたって　いる。98ど！', '1200年まえ、鶴見岳が　ふんかした　とき、地めんから　わきだしたんだって。青いのは　水に　とけた　ミネラルの　いろ。'],
    umiNuit: ['夜の　青い　いけが、くらやみで　ゆげを　あげて　いる。ずっと　そこで　お湯が　ゴーゴー　いって　いる。'],
    oeufs: ['よいしょ！　おばさんが　かごを　ひきあげた。地獄の　お湯で　ゆでた　たまごだ！', '地獄たまご、たべて　みる？'],
    oeufGoute: ['からを　むくと……　しろみは　ふわふわ、きみは　まだ　とろり。お湯みたいに　すこし　しおあじ。', '別府では、地獄たまごを　たべると　7年　ながいき　するって！'],
    umiCompagnon: { kon: ['「こんなに　青いなんて……　海が　ここで　わきたつことに　したみたい。」'], pon: ['「ポン！　たまご、もう　ひとつ　いい？　7年　ぶん　たべられるなら　うれしい！」'], chapu: ['「チャプ……　きょうは　とびこまない。あつすぎるって　ぼくでも　わかる。」'], gao: ['「ガオ！　ぼくが　見はる。ふちに　ちかづきすぎちゃ　だめ！」'], fuwa: ['「ふわ……　ぼくの　ふるさとの　海の　青。でも　すごく　すごく　あつい。」'], saya: ['「ここでは　大地が　いきを　して　いる……　青い　お湯から　ぬくもりを　ふきだして。」'] },
    akaike: ['大きな　青い　いけの　すぐ　よこに、小さな　赤い　いけ。こっちも　にえたって　いる。', 'となりあう　ふたつの　いずみ、ふたつの　いろ。別府の　大地は　びっくり　ばかり。'],
    hasu: ['大きな　スイレンの　はっぱ！　いちばん　大きいのは　1メートル　いじょう。ふちが　おぼんみたいに　たって　いる。', '小さい　子が　のっても　しずまないんだって。あたたかい　お湯の　おかげで、アマゾンから　とおい　ここでも　そだつ。'],
    inariPriere: ['手を　2かい　たたいて、おいなりさんの　小さな　やしろに　おまいり。石の　キツネが　こっちを　見て　いる。'],
    bozu: ['鬼石坊主地獄。はいいろの　どろが　にえたって　いる……　よく　見て。', 'ポコッ！　大きな　あわが、まるくて　つるつるに　ふくらんで……　おぼうさんの　あたま（坊主）みたい。そして　パチン！', 'まわりの　どろに、水の　もんみたいな　わが　のこる。1300年も　こうして　にえて　いるんだ。'],
    bozuCompagnon: { kon: ['「ポコ、ポコ……　大地が　かんがえごとを　しながら　あわを　ふいて　いるみたい。」'], pon: ['「ポン！　おみそしるみたい。……ちがう？　そっか。」'], chapu: ['「チャプ！　ぼくが　とびこむ　ときの　ポチャンと　おなじ　おと！」'], gao: ['「ガオ！　おぼうさんの　あたま……　ぼくのこと、こわくないのかな？」'], fuwa: ['「ふわ……　あわ　ひとつ　ひとつが、大地の　小さな　ゆめ。」'], saya: ['「どろが　おなかみたいに　あったかい……　ねっこは　ちょっと　にがて。」'] },
    takaibiki: ['グオォォ……　岩の　あいだから、いびきみたいな　おとで　ゆげが　ふきだす。', '「鬼の高いびき」って　いうんだ。岩の　下で　鬼が　ねて　いるんだって。'],
    oni: ['かまど地獄の　大きな　赤鬼！　かまどの　上に　すわって、てつの　かなぼうを　ふりあげて　大わらい！', 'むかし、竈門八幡宮の　おまつりで、そなえる　ごはんを　ここの　ゆげで　たいたんだって。だから「かまど」。'],
    oniNuit: ['夜の　赤鬼が　ゆげの　なかで　わらって　いる……　ちょうちんの　あかりで、もっと　大きく　見える。'],
    guide: ['かまど地獄へ　ようこそ！　いけは　6つ。「一丁目」から「六丁目」まで　あります。', 'では、わたしの　ちょっとした　てじなを！'],
    guideTour: ['三丁目の　青い　いけの　ゆげを　よーく　見て……　おせんこうに　火を　つけて、けむりを　ふうっと……'],
    guideFin: ['ほら、ゆげが　ばいに　なった！　けむりの　つぶに、水の　つぶが　くっつくんです。てじなじゃ　ないけど……　まるで　まほう！'],
    kamadoCompagnon: { kon: ['「すごい　ゆげ……　ガイドさんは　地獄の　ひみつを　よく　しって　いるね。」'], pon: ['「ポン！　その　てじな　おしえて！　おいもを　はやく　ふかしたい！」'], chapu: ['「チャプ！　できたての　くも！　おふろ　あがりみたい！」'], gao: ['「ガオ！　ぜんぜん　こわくなかった。……ほとんど。」'], fuwa: ['「ふわぁ……　くも　だいすき。この　くもは　目の　まえで　うまれたね！」'], saya: ['「おせんこうの　けむりは　木から　できて　いる……　木も　くもを　てつだって　いるんだ。」'] },
    k4: ['四丁目の　いけ。うすい　青の　お湯は、きせつや　あつさで　いろが　かわる。みどりっぽい　日も、白っぽい　日も。'],
    k6: ['六丁目の　いけ。レンガいろの　赤い　どろが　ブクブク。'],
    ashiyuKamado: ['地獄の　青い　お湯の　あしゆ。こんどは　ちょうど　いい　あたたかさ。けんがくの　あと、みんな　足を　つける。'],
    shiraike: ['白池地獄。にわの　まんなかに、ミルクみたいに　白い　お湯。', 'わきだす　ときは　すきとおって　いるのに、いけで　さめると　ミネラルで　白く、すこし　青く　なるんだ。'],
    shiraikeNuit: ['夜の　白い　いけが、月の　したで　ミルクみたいに　ぼんやり　ひかって　いる。'],
    shiraikeCompagnon: { kon: ['「まわりに　まつの　ある、ミルクの　いけ……　いちばん　しずかな　地獄だね。」'], pon: ['「ポン！　ホットミルク！　あとは　ビスケットが　あれば。」'], chapu: ['「チャプ……　とびこんだら　まっしろに　なる？　コンみたいに？」'], gao: ['「ガオ。まっしろで　しずかな　地獄。ここは　見はる　ものが　ないね。」'], fuwa: ['「ふわ……　とけた　しんじゅみたい。」'], saya: ['「この　にわの　まつは、足が　ぽかぽか……　しあわせそう。」'] },
    chinoikeVue: ['血の池地獄。ちみたいに　赤い　お湯が、ゆげを　あげて　いる。', 'いちばん　ふるい　地獄なんだ。8せいきの　ほんに　もう「赤い　お湯」と　かいて　ある。赤いのは、そこから　わきあがる　てつの　おおい　ねんど。'],
    chinoikeVueNuit: ['夜の　血の池は　ほとんど　まっくろ。ゆげだけが　白く　見える。'],
    chiike: ['こんにちは！　うちの　なんこうは　いかが？　いけの　赤い　ねんどで、ずっと　むかしから　つくって　いるの。', 'ひふの　ちょっとした　トラブルに　きくって。ひとつ　どうぞ？'],
    chiikeEncore: ['血の池なんこう、もう　ひとつ？　まだ　ありますよ！'],
    chiikeNon: ['また　いつでも　どうぞ！'],
    pommade: ['はい、血の池なんこう。赤い　ふたの、まるい　小さな　いれもの。', 'むかしから　みんなが　もちかえる、別府の　おみやげ。'],
    chinoikeCompagnon: { kon: ['「とりいみたいに　赤い……　でも　にえたって　いる。すごい　ながめ。」'], pon: ['「ポン……　大きな　トマトソースみたい。きゅうに　おなかが　すいた。」'], chapu: ['「チャプ！　やっぱり　青い　お湯が　すき……」'], gao: ['「ガオ！　赤は　ゆうかんな　まもりがみの　いろ！」'], fuwa: ['「ふわ……　みずうみに　おちた　ゆうひ。」'], saya: ['「大地の　てつ……　木の　はっぱにも　すこし　はいって　いるんだよ。」'] },
    tatsumakiAttente: ['石の　ベンチに　すわって　まつ……　ばんにんさんが　とけいを　見て　いる。', '「くるぞ！」……'],
    tatsumaki: ['シュワーッ！　龍巻地獄の　ふんせんが　いっきに　ふきだした！　にえた　お湯が　石の　やねに　ぶつかって、あめみたいに　ふって　くる。', 'やねが　なかったら　30メートルも　あがるんだって！　ほんものは　30ぷんから　40ぷんごとに　ふきだす。'],
    tatsumakiNuit: ['シュワーッ！　夜の　なかで、まっしろな　ふんせんが　石の　やねまで　ふきあがる。'],
    tatsumakiCompagnon: { kon: ['「なんて　ちから！　ここの　大地は　いいたい　ことが　たくさん　あるんだね。」'], pon: ['「ポン！　びっくりした。でも　おかしは　はなさなかった！」'], chapu: ['「チャプー！　大きな　シャワー！　もう　いっかい！」'], gao: ['「ガオ！　ぼくより　大きな　こえで　ほえる！」'], fuwa: ['「ふわぁ！　そらへ　のぼる　水の　りゅう！　しんせき　かも？」'], saya: ['「まわりの　シダは　この　あたたかい　あめが　だいすき。」'] },
    tableau: ['「次の噴出」。その　下に　チョークで「もうすぐ！」。'],
    mushi: ['地獄蒸しへ　ようこそ！　ここでは　なんでも　温泉の　ゆげで　ふかすの。たまご、さつまいも、とうもろこし……', 'なにか　ふかして　みる？'],
    mushiNon: ['また　こんどね！　ゆげは　ずっと　とまらないから。'],
    mushiCuisson: ['かごを　石の　かまに　いれて、ふたを　しめて……　98どの　ゆげが　ぜんぶ　やって　くれる。'],
    mushiFini: ['はい、できあがり！　地獄の　ゆげで　ふかした　たまごと　さつまいも。お湯の　しおけが　おいしさの　ひみつ！'],
    mushiCompagnon: { kon: ['「ありがとう……　さつまいもが　はちみつみたいに　あまい。」'], pon: ['「ポンポンポン！　いっしょうで　いちばん　おいしい　おいも！　おかわり！」'], chapu: ['「チャプ！　あつ、あつ、あつ！　……でも　おいしい！」'], gao: ['「ガオ！　まもりがみの　ごちそうだ！」'], fuwa: ['「ふわ……　小さな　かざんみたいに　ゆげが　でて　いる。」'], saya: ['「おいもは　つちの　なかで　そだつ……　ここでは　ずっと　ぽかぽかだね！」'] },
    nomiyu: ['のめる　お湯の　いずみ（飲泉）。ひとくち　のむと……　あたたかくて、すこし　しょっぱくて、すこし　にがい。', 'おなかに　いいんだって。でも　おちゃの　ほうが　おいしい！'],
    statue: ['一遍上人の　ぞう。手を　あわせて、いつも　あるいて　いる　たびの　おぼうさん。', '700年　いじょう　まえに　鉄輪へ　きたんだ。その　おはなしが　となりの　かんばんに　かいて　ある。'],
    mushiyu: ['鉄輪むし湯。まちで　いちばん　ふるい　むし湯で、1276年に　一遍上人が　ひらいたと　いわれて　いる。', 'なかでは、石の　小さな　へやで、石菖（せきしょう）という　くさの　上に　よこに　なる。8ぷんで、からだが　すっきり！'],
    mushiyuNuit: ['むし湯は　夜は　おやすみ。でも　えんとつからは　ゆげが　でつづけて　いる。'],
    okamiJour: ['鉄輪へ　ようこそ！　夕がた、ちょうちんが　ともると、湯けむりが　金いろに　なるんですよ。', 'ここで　夕がたを　まちますか？'],
    okamiNon: ['ごゆっくり。湯けむりは　いつでも　ありますから。'],
    okamiSoir: ['……夕がたに　なりました。ちょうちんの　ひかりの　湯けむりを　見て。わたしの　いちばん　すきな　じかん。'],
    okamiNuit: ['鉄輪の　すてきな　夜……　あさを　よびもどしましょうか？'],
    okamiReste: ['もう　すこし　いましょう。夜は　温泉の　ゴーゴーいう　おとが　よく　きこえるから。'],
    okamiMatin: ['おはようございます！　あさごはんは　温泉たまごよ。いい　さんぽを！'],
    'panneau-ippen': ['「一遍上人と鉄輪」', 'むかし、鉄輪では　あちこちから　にえた　お湯と　ゆげが　ふきだし、ひとびとは　はたけも　たがやせなかった。その　いずみは「地獄」と　よばれた。', '1276年、一遍上人が　ここへ　きた。石に「南無阿弥陀仏」と　かいて、いずみに　なげいれると、地獄は　しずまった。そして　ひとびとを　いやす　むし湯を　つくった。', '上人の　石は　いまも　三つ、鉄輪の　どこかに　かくれて　いて……　ひとつの　地獄には　ひとつしか　はいらないと　いう。'],
    ippenCompagnon: { kon: ['「かくれた　石が　三つ……　さがして　みない？　上人みたいに、ひとつずつ　ちがう　地獄に　なげるんだ。」'], pon: ['「ポン！　たからさがし！　石　三つ、ちがう　地獄　三つ。きみは　さがして、ぼくは　おかしを　見はる。」'], chapu: ['「チャプ！　にえた　お湯を　しずめる　石？　さがそう！　地獄　ひとつに　ひとつ！」'], gao: ['「ガオ！　かくれた　せいなる　石　三つ……　ぜんぶ　かぎだす。おなじ　地獄に　ふたつは　だめ！」'], fuwa: ['「ふわ……　石が　おいのりを　ささやいて　いる。すこし　ひかって　いる　きが　する……」'], saya: ['「鉄輪の　木は　上人を　見たんだ。石が　どこで　ねむって　いるか　しって　いる……　地獄　ひとつに　ひとつずつ、さがそう。」'] },
    pierre: ['小さな　ひらたい　石が　たって　いる……　すみで、上から　下へ　六つの　じ：南無阿弥陀仏。'],
    pierreRamassee: (n) => [`石を　ひろった。（3つの　うち　${n}つめ）`],
    pierreCompagnon: { kon: ['「上人の　石だ！　まだ　石の　はいって　いない　地獄に　なげよう。」'], pon: ['「ポン！　おもちみたいに　おもい。はやく、地獄へ！」'], chapu: ['「チャプ！　どの　地獄に　なげる？　まいかい　ちがう　ところ！」'], gao: ['「ガオ！　ちゃんと　まもる。まだ　なげて　いない　地獄を　えらんで。」'], fuwa: ['「ふわ……　あったかい。はやく　お湯に　もどりたいみたい。」'], saya: ['「この　石は　ふるい……　ながい　あいだ、見つけて　もらうのを　まって　いたんだ。」'] },
    pierreInconnueCompagnon: { kon: ['「一遍上人の　石だ！　みちに　ぞうが　ある　おぼうさん。石を　地獄に　なげて、地獄を　しずめたんだ。のこりは　三つ。ひとつずつ　ちがう　地獄に　なげよう！」'], pon: ['「ポン！　一遍上人の　石だ！　地獄に　なげて　しずめたんだって。のこりは　三つ。地獄　ひとつに　ひとつ、おなじ　ところに　ふたつは　だめ！」'], chapu: ['「チャプ！　かいて　ある　おいのり……　一遍上人の　石だ！　地獄に　なげよう、ポチャン！　石　ひとつずつ、ちがう　地獄へ！」'], gao: ['「ガオ！　一遍上人の　せいなる　石。地獄を　しずめる。ぜんぶで　三つ。地獄　ひとつに　ひとつ、おなじ　ところに　ふたつは　だめ！」'], fuwa: ['「ふわ……　一遍上人の　おいのりを　ささやいて　いる。上人は　石で　地獄を　しずめたの……　これを　地獄に　なげて、のこりの　ふたつは　べつの　地獄へ。」'], saya: ['「一遍上人の　石……　地獄に　なげて、しずめたんだ。石　三つ、ちがう　地獄　三つ。上人の　ぞうの　そばの　かんばんに　おはなしが　かいて　あるよ。」'] },
    derniere: (lieu) => [`さいごの　石は　${lieu}に　ある。`],
    lieuxPierres: { p1: '白池地獄の　にわの　おく、大きな　もみじの　下', p2: '海地獄の　赤い　鳥居を　のぼった　ところ、お稲荷さんの　ほこらの　まえ', p3: '鬼石坊主地獄の　おく、鬼が　いびきを　かく　岩の　あいだ' },
    lancer: (nom) => [`${nom}に　上人の　石を　なげる？`],
    nomsEnfers: { umi: '海地獄', bozu: '鬼石坊主地獄', kamado: 'かまど地獄', shiraike: '白池地獄', chinoike: '血の池地獄' },
    pierreJetee: (n) => ['ポチャン！　石が　しずむと……　水の　上に　おいのりが　わに　なって　ひかり、地獄が　しばらく　しずまった。', n === 1 ? '石を　ひとつ　なげた。あと　ふたつ、べつの　地獄へ。' : '石を　ふたつ　なげた。あと　ひとつ、まだ　石の　ない　地獄へ。'],
    jeteeCompagnon1: { kon: ['「見た？　お湯が　しずまった……　上人の　いった　とおりだ。」'], pon: ['「ポン！　うまく　いった！　あと　ふたつ！」'], chapu: ['「チャプ！　あわまで　しずかに　なった！」'], gao: ['「ガオ！　地獄が　いうことを　きいた。つぎ！」'], fuwa: ['「ふわぁ……　おいのりが　ぼくの　うろこみたいに　ひかった。」'], saya: ['「しずか……　まわりの　木が　ほっと　した。」'] },
    jeteeCompagnon2: { kon: ['「あと　石　ひとつ……　まだ　なげて　いない　地獄に。」'], pon: ['「ポン！　あと　ひとつ！　そしたら　地獄たまごで　おいわい！」'], chapu: ['「チャプ！　さいご、さいご！」'], gao: ['「ガオ！　あと　ひとつ。なにか　おこる　きが　する。」'], fuwa: ['「ふわ……　地獄が　小さな　こえで　うたって　いる。こえが　ひとつ　たりない。」'], saya: ['「あと　ひとつ……　鉄輪が　こっちを　見て　いる。」'] },
    ippenFin: ['ポチャン……　三つめの　石が　しずむ。三つの　地獄が　いっしょに　しずまった。上人の　ころのように。', 'しずかな　水の　まんなかで、なにかが　きらりと　ひかって、ゆっくり　あがって　くる……'],
    videaste: ['やあ！　ぼくは　@random_japan_place。TikTokの　ために　別府の　地獄を　とって　いるんだ。海の　青、血の池の　赤……', 'ぼくの　どうが、見る？'],
    kurabu: ['こんにちは！　鉄輪の　湯けむりクラブの　ものです。ゆげが　あちこちから　でる　こみちを　あんない　して　います。', 'ぞうの　おぼうさん、一遍上人は　700年　いじょう　まえに　ここの　温泉を　しずめたんです。かんばんを　よんで。いい　おはなしですよ。'],
    kurabuNuit: ['夜の　鉄輪の　湯けむりは、ちょうちんの　ひかりで　もっと　きれい。'],
    moine: ['一遍上人のように、おいのりだけを　もって、おてらから　おてらへ　あるいて　います。', '上人の　石は、しずかな　ところが　すきだとか。にわ、おやしろ……　それとも　鬼の　ねむる　ところ。'],
    moineNuit: ['夜は　まちの　小さな　おてらで　ねます。温泉の　おとが　こもりうたです。'],
    obaa: ['ああ、あしゆ……　まいにち　くるのよ。この　としに　なると、いちばんの　おいしゃさん。'],
    obaaNuit: ['夜でも　あしゆは　あったかい。ほしと、ぽかぽかの　足。しあわせ。'],
    enfant: ['おばあちゃんが　いうには、お湯は　ひとりでに、あつあつで　地めんから　でて　くるんだって！　ぼくは　下に　りゅうが　いると　おもう。'],
    yukata: ['すぐ　そこの　旅館に　とまって　いるの。別府では、ゆかたで　おふろから　おふろへ　さんぽ　するのよ！'],
    yukata2: ['きょうは　もう　4かい　おふろに　はいった。ばんごはんの　まえに　もう　いっかい　かな。'],
    yukataNuit: ['夜は、ちょうちんと　ゆげで、みちが　ゆめみたい。'],
    yukata2Nuit: ['さいごの　おふろに　はいって、ねよう！'],
    tamago: ['あの　青い　お湯の　かごで　たまごを　ゆでて　いるの。5ふんで　ちょうど　いい　ぐあい。'],
    touriste: ['わあ、どこも　ゆげだらけ！　この　まちは　みぞまで　ゆげが　でて　いる！', 'そうそう、赤い　とりいを　のぼった　上の　おやしろの　まえ、石の　きつねの　そばで、じの　かいて　ある　ふしぎな　石を　見たよ。'],
    inari: ['まいしゅう　おいなりさんに　おれいを　いいに　くるの。ずっと　海地獄を　まもって　くださって　いるのよ。'],
    ouvrier: ['木の　みちの　かわいた　どろを　はいて　いるんだ。あわが　はじけると　とびちるからね！', 'おくの　岩で、鬼が　いびきを　かいて　いる。その　石の　なかに、ひとつだけ　ちがうのが　ある。じが　かいて　あるんだ。'],
    amie: ['赤鬼と　しゃしんを　とるの！　ほんとうに　おもしろい　かお。'],
    ami: ['地獄には　ひとつずつ　鬼が　いるんだって。こいつは　すくなくとも　わらって　いる。'],
    jardinier: ['白池の　にわの　ていれを　して　いるんだ。まつも　もみじも　あたたかい　つちが　すき。', 'にわの　おくの　大きな　もみじの　下に、じの　かいて　ある　ふるい　石が　ある。さわる　のが　こわくてね。'],
    gardien: ['もうすぐ　ふきだしますよ！　ベンチに　すわって。いつとは　いえないけど、すぐです。'],
    gardienNuit: ['夜でも　ふきだします。この　ふんせんは　ねむらないんです。'],
    'panneau-umi': ['「海地獄」', 'やく1200年まえ、鶴見岳の　ふんかで　うまれた。98どの　お湯は、りゅうさん　てつの　ため　コバルトブルー。', '国の　名勝。'],
    'panneau-bozu': ['「鬼石坊主地獄」', 'にえたつ　はいいろの　どろ。まるい　あわが　おぼうさんの　あたま（坊主）に　にて　いる。おくには「鬼の高いびき」。'],
    'panneau-kamado': ['「かまど地獄」', 'むかし、竈門八幡宮の　おそなえの　ごはんを　ここの　ゆげで　たいた。いけは　一丁目から　六丁目まで。'],
    'panneau-shiraike': ['「白池地獄」', 'わきでる　ときは　とうめい。いけで　さめると　ミネラルで　白く、すこし　青く　なる。国の　名勝。'],
    'panneau-chinoike': ['「血の池地獄」', 'いちばん　ふるい　地獄。8せいきの「豊後国風土記」に「赤い　湯」と　かかれて　いる。赤い　ねんどで　なんこうを　つくる。'],
    'panneau-tatsumaki': ['「龍巻地獄」', '30ぷんから　40ぷんごとに　ふきだす　ふんせん。石の　やねで　とめて　いる。やねが　なければ　30メートルも　あがる。'],
    chatRoux: ['ちゃいろの　ねこが、ふかしがまの　そばで　まるく　なって　ねて　いる。ここの　地めんは　いつも　ぽかぽか。', 'なでると……　ゴロゴロ……　目を　あけずに　のどを　ならす。'],
    chatRouxNuit: ['夜の　ちゃいろの　ねこは　おきて、まだ　あたたかい　かまの　そばに　すわって　いる。', 'くらやみで　目が　ひかる……　ゴロゴロ……'],
    chatPie: ['あしゆの　そばの　しろくろの　ねこ。別府の　ねこは、どこが　あったかいか　しって　いる。', 'なでると……　ゴロゴロ……'],
    chatPieNuit: ['しろくろの　ねこが　あしゆの　そばで　見はって　いる。くらやみで　目が　ひかる。'],
    chatCompagnon: { kon: ['「別府の　ねこ……　まちで　いちばん　あったかい　ばしょを　見つけたんだね。」'], pon: ['「ポン！　ぽかぽかで　ねて、いいなあ。となりで　ねても　いい？」'], chapu: ['「チャプ！　水は　きらいでも……　ゆげは　すきなんだ！」'], gao: ['「ガオ……　ねむって　いる　見はりばん。ぼくが　かわりに　見はる。」'], fuwa: ['「ふわ……　にえる　温泉みたいに　ゴロゴロ　いって　いる。」'], saya: ['「あったかい　ねこ……　おひさまと　ゆげの　におい。」'] },
    papillon: ['アサギマダラ。うすい　青の　はねの　大きな　ちょう。あきには、なんびゃく　キロも　南へ　とんで　いく。'],
    libellule: ['赤とんぼが、あたたかい　石に　とまった。'],
  },
};
