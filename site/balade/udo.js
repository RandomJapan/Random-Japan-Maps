// ================================================================
//  Udo (鵜戸神宮 et 鵜戸稲荷神社), à Nichinan, sur la côte de Miyazaki, face au Pacifique (2026-10-30 : le dixième lieu
//  de la balade, demandé par le propriétaire : « D'abord, tu fais le lieu sanctuaire Udo Inari. Celui qui est à Miyazaki…
//  il est au bord de la falaise […] Ensuite, il faut qu'il y ait une sorte de petit bateau […] ou un PNJ. On lui parle, et
//  ensuite, on prend le bateau. Et on se rend à l'île Yakushima », Yakushima ne s'ouvrant qu'avec les cinq tampons d'ici).
//  Son TikTok (« Udo Inari Shrine » sur sa carte) montre Udo-jingū : le sanctuaire bâti dans une grotte marine, au flanc
//  d'une falaise du cap d'Udo ; on y descend (下り宮, un sanctuaire où l'on descend pour prier). La légende : Toyotama-hime,
//  fille du dieu de la mer, vint du palais du dragon sur le dos d'une tortue pour mettre au monde son enfant dans cette
//  grotte ; la hutte n'était pas finie, son toit de plumes de cormoran (鵜) pas encore couvert, quand il naquit : on
//  l'appela Ugayafukiaezu (« le toit de cormoran pas fini »), le père du premier empereur. Elle laissa ses seins sur la
//  roche pour le nourrir : les rochers d'où suinte encore l'eau (お乳岩), dont on fait les bonbons « おちちあめ ». La tortue
//  devint le rocher Kameishi (亀石), dans la mer, devant le sanctuaire : on lance dans le creux carré de son dos les boules
//  de terre « 運玉 » (les hommes de la main gauche, les femmes de la droite), modelées par les écoliers d'Udo depuis 1954.
//  Le lapin est le messager du dieu (撫でうさぎ : on caresse la statue là où l'on veut guérir). Sur le chemin : le grand
//  torii, le Shinmon (神門), le Rōmon rouge à étage (楼門), les lanternes des seigneurs Itō d'Obi (leurs feux en phases de
//  lune), le pont Tamabashi (玉橋), et sur la colline, le petit sanctuaire Udo Inari et ses torii rouges. Le plus vieux
//  chemin des pèlerins, l'escalier du Hatchōzaka (八丁坂), descend au port de Fukei (吹毛井) : c'est là qu'attend
//  le batelier de Yakushima. Les distances sont resserrées ; la grotte (38 × 29 m, 8,5 m de haut) un peu plus petite.
//  Sources : le TikTok et les rushes du propriétaire (« 0518.mp4 »), ja.wikipedia (鵜戸神宮), les photos de Wikimedia
//  Commons (Romon, Shimmon, Tamabashi, Honden, Udo Inari, Kame-ishi, le lapin), les panneaux du ministère du tourisme (撫で
//  うさぎ, 神橋, 鵜戸山八丁坂 : « the port of Fukei », 815 marches ; le jeu disait « Fukigei », pris d'un article de voyage :
//  corrigé le 2026-10-31), un carnet de voyage (igoiseeishoot, 2025).
//  Repère : x vers l'est, z vers le sud, y vers le haut, en mètres ; la mer au nord, à l'est et au sud (niveau 0) ; le cap
//  à 10 m, la crête au-dessus de la grotte à 20 m, la terrasse de la grotte à 4,5 m, le quai du port à 1,2 m.
//  ctx : { THREE, atelier, P (palette), peinture, perso, maillage }.
// ================================================================
import { creerMonde, interactionsBancs, lisse, hasard, bruitDoux, surLaLigne } from './monde.js';
import { panneau, PAPIER_PANNEAU } from './decor.js';
import { MATIERES as M } from './textures.js';
import { aLeTampon } from './carnet.js';
import { plumeCormoran } from './personnages.js';
import { secretTrouve, indiceVu } from './tresors.js';

const PI = Math.PI;

// ---------------------------------------------------------------- Le plan
// les hauteurs : le parking, la rue des boutiques, la place du Shinmon et l'allée (Y_ROUTE) ; le haut des marches du Rōmon
// (Y_ROMON) ; le pont Tamabashi et la pointe (Y_POINTE) ; la terrasse de la grotte (Y_T) ; le sanctuaire d'Inari (Y_INARI) ;
// le quai du port de Fukei (Y_PORT)
const Y_ROUTE = 10.0, Y_ROMON = 11.0, Y_POINTE = 10.6, Y_T = 4.5, Y_INARI = 14.4, Y_PORT = 1.2;
// le parking et l'arrêt de bus (le départ), à l'ouest ; la rue des boutiques (門前町) ; la place du Shinmon (神門), à son bout
// est ; l'allée jusqu'au Rōmon
const PARKING = { x0: -104, x1: -84, z0: -7, z1: 9 };
const RUE = { x0: -84, x1: -46, z0: -5, z1: 5 };
const PLACE = { x0: -46, x1: -26.92, z0: -9, z1: 9 };
const ALLEE = { x0: -26.92, x1: -6, z0: -2.5, z1: 2.5 };
// le grand torii (大鳥居), au bout de la rue ; le Shinmon, au bout est de la place (son passage : |z| < 1.7)
const OTORII = { x: -46.6, demi: 3.3, h: 7.2 };
const SHINMON = { x: -26.4, l: 7.6, p: 3.2 };
// le Rōmon (楼門) en haut de ses cinq marches ; son passage entre les deux piliers du milieu
const MARCHES_ROMON = { x0: -6, x1: -2, z0: -2.5, z1: 2.5, n: 5 };
const ROMON = { x: 0, l: 9.2, p: 4.0, passage: 1.45 };
// le chemin des lanternes (les lanternes des seigneurs Itō au nord, la barrière rouge au sud, la falaise au-delà)
const LANTERNES = { x0: 2, x1: 18.4, z0: -2.1, z1: 2.3 };
// le pont Tamabashi (玉橋), en arc au-dessus de la crique ; la pointe, de l'autre côté ; l'escalier qui descend vers la grotte
const PONT = { x0: 18.4, x1: 24.6, z: 0.1, demi: 0.78, haut: 0.95 };
const POINTE = { x0: 24.6, x1: 33.6, z0: -9.2, z1: 3.6 };
const ESC = { x: 25.8, demi: 1.25, z0: -9.2, z1: -23.2, n: 35, y0: Y_POINTE, y1: Y_T };
// la terrasse devant la grotte (le parvis de pierre au bord de la mer)
const TERRASSE = { x0: 22.4, x1: 45, z0: -45.4, z1: -23.2 };
// l'escalier du sanctuaire d'Inari, son palier (on y monte sous les torii rouges) ; le Hatchōzaka, de la place au port
const INARI_ESC = { x: -13, demi: 1.15, z0: -2.5, z1: -10.2, n: 25, y0: Y_ROUTE, y1: Y_INARI };
const INARI = { x0: -18.6, x1: -7.4, z0: -17.4, z1: -10.2 };
const HATCHO = { x: -36, demi: 1.2, z0: -9, z1: -27, n: 50, y0: Y_ROUTE, y1: Y_PORT };
// son panneau (八丁坂 ↓ 吹毛井港), au bord de la place, à l'ouest du haut des marches, tourné vers la place (au sud)
const PANNEAU_HATCHO = { x: HATCHO.x - HATCHO.demi - 1.3, z: PLACE.z0 + 0.2 };
// le quai du port de Fukei (吹毛井港), au fond de la crique au nord ; l'eau de la crique au-delà de son bord (z < z0)
const QUAI = { x0: -60, x1: -27.4, z0: -33.4, z1: -27 };
// le coin de Bunbuku, sous les camphriers, au sud de l'allée (il mord sur l'allée : un coin qui ne fait que la toucher laisse
// un mur invisible, Kinkaku-ji, 2026-10-27)
const RECOIN = { x: -17.4, z: 4.6, rx: 3.2, rz: 2.7, ry: 0 };
const MARCHAND = { x: -17.4, z: 5.9, cap: PI };
const LAMPION = { x: -19.6, z: 6.4 };
// l'arrêt de bus, le départ (le choix du compagnon : on arrive en bus)
const ARRET = { x: -88.6, z: 7.6 };
const CHOZUYA = { x: -33.8, z: -5.4 };
const DEPART = { x: -90.4, z: 2.6, cap: PI / 2 };

/** Un escalier droit, le long de z : la hauteur du dessus de la marche k (k = 0 : la première depuis z0), et de sa ligne en z. */
const marcheDe = (E, k) => E.y0 + ((E.y1 - E.y0) * (k + 1)) / (E.n + 1);
const zMarche = (E, k) => E.z0 + ((E.z1 - E.z0) * (k + 0.5)) / E.n;
const yLigneEsc = (E, z) => E.y0 + (E.y1 - E.y0) * Math.min(1, Math.max(0, (z - E.z0) / (E.z1 - E.z0)));
/** La marche sous z (−1 avant la première, n après la dernière). */
const kMarche = (E, z) => Math.floor(((z - E.z0) / (E.z1 - E.z0)) * E.n);
const ESCALIERS = [ESC, INARI_ESC, HATCHO];

// ---------------------------------------------------------------- La grotte (鵜戸の岩屋) et la falaise
// La paroi de la falaise, au-dessus de la terrasse : une ligne nord-sud (son pied, x en fonction de z), de la mer au nord jusqu'à
// la pointe au sud (le long de l'escalier). La grotte s'y ouvre vers l'est : une bouche large et basse, comme une grotte marine,
// puis une salle plus large et plus haute, qui se referme au fond.
const xParoi = (z) => 22.0 + 0.28 * Math.sin(z * 0.41 + 0.6) + 0.16 * Math.sin(z * 1.07 + 2) + 0.55 * lisse(-21, -12, z);
/** La bouche (sa demi-largeur, sa hauteur au-dessus du sol), la salle (demi-largeur, hauteur), sa profondeur (de la lèvre au fond). */
const GROTTE = { z: -32.6, demi: 9.4, haut: 8.2, large: 10.6, voute: 9.6, prof: 18 };
/** Le plan de la bouche (la paroi sans ses bosses, sur l'axe de la grotte) ; la salle commence 1,2 m derrière (la lèvre). */
const X_GROTTE = xParoi(GROTTE.z) + 0.75, X_SALLE = X_GROTTE - 1.2;
/** Le contour de la bouche, de u 0 (le pied nord) à 1 (le pied sud) par le haut : [z, y] ; ses pieds 35 cm sous le sol. */
function archeGrotte(u) {
  const t = u * PI, az = GROTTE.demi * (1 + 0.04 * Math.sin(t * 4.3 + 0.6));
  const ay = (GROTTE.haut + 0.35) * (1 + 0.05 * Math.sin(t * 3.1 + 1.1)) * (1 - 0.05 * Math.cos(t));
  return [GROTTE.z - Math.cos(t) * az, Y_T - 0.35 + Math.sin(t) ** 0.42 * ay];
}
/** La salle à la profondeur s (0 : là où finit la lèvre) : combien le contour de la bouche s'y élargit (fz) et monte (fy). */
function salleGrotte(s) {
  if (s <= 0) return { fz: 1, fy: 1 };
  const ouvre = lisse(0, 3.5, s), FIN = GROTTE.prof - 5.5, fin = s > FIN ? Math.sqrt(Math.max(0, 1 - ((s - FIN) / (GROTTE.prof - FIN)) ** 2)) : 1;
  return { fz: (1 + (GROTTE.large / GROTTE.demi - 1) * ouvre) * fin, fy: (1 + ((GROTTE.voute + 0.35) / (GROTTE.haut + 0.35) - 1) * ouvre) * (0.35 + 0.65 * fin) };
}
/** La demi-largeur de la grotte à la profondeur s, à hy au-dessus de son sol (0 : la voûte est plus basse). */
function demiGrotte(s, hy) {
  const { fz, fy } = salleGrotte(s), v = (hy + 0.35) / ((GROTTE.haut + 0.35) * 0.95 * fy);
  return v >= 1 || fz <= 0 ? 0 : GROTTE.demi * 0.96 * fz * Math.cos(Math.asin(v ** (1 / 0.42)));
}
/** Le sol de la grotte, creusé à plat dans la montagne, un peu plus large et plus profond que sa voûte. */
const solGrotte = (x, z) => x < X_GROTTE + 1.5 && X_SALLE - x < GROTTE.prof + 0.8 && Math.abs(z - GROTTE.z) < demiGrotte(Math.max(0, X_SALLE - x - 0.6), 0) / 0.96 + 0.9;
/**
 * Les parois de la grotte à hauteur de tête (1,7 m au-dessus du sol), à la profondeur s : [z de la paroi nord, z de la paroi sud],
 * d'après le contour même de la bouche (ses bosses de 4 % comprises), tous les 10 cm de profondeur. (2026-10-30 : demiGrotte, qui
 * rogne 4 % pour ne jamais dépasser, arrêtait le voyageur 70 cm à 1 m avant les parois : des murs invisibles.)
 */
const PAROIS_GROTTE = (() => {
  const fin = Array.from({ length: 1441 }, (_, i) => archeGrotte(i / 1440)), t = [];
  for (let k = 0; k <= Math.ceil(GROTTE.prof * 10); k++) {
    const { fz, fy } = salleGrotte(k / 10), cible = Y_T - 0.35 + (1.7 + 0.35) / Math.max(1e-3, fy);
    let n = GROTTE.z, su = GROTTE.z;
    for (let i = 0; i <= 720; i++) if (fin[i][1] >= cible) { n = GROTTE.z + (fin[i][0] - GROTTE.z) * fz; break; }
    for (let i = 1440; i >= 720; i--) if (fin[i][1] >= cible) { su = GROTTE.z + (fin[i][0] - GROTTE.z) * fz; break; }
    t.push([n, su]);
  }
  return t;
})();
const paroisGrotte = (s) => {
  const f = Math.min(PAROIS_GROTTE.length - 1.001, Math.max(0, s * 10)), i = Math.floor(f), u = f - i, a = PAROIS_GROTTE[i], b = PAROIS_GROTTE[i + 1];
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
};
/** Dans la grotte, là où l'on marche : à 30 cm de ses parois à hauteur de tête (et la lèvre, de la bouche à la salle). */
const dansGrotte = (x, z) => {
  const s = X_SALLE - x;
  // (la lèvre, de la bouche à la salle ; jusqu'à 1,6 m devant la bouche, où la terrasse prend le relais)
  if (x > X_GROTTE + 1.6 || s > GROTTE.prof - 0.75) return false;
  // (le corps, 24 cm, touche la paroi un peu plus au fond que là où sont les pieds, là où la grotte se resserre)
  const [n0, s0] = paroisGrotte(Math.max(0, s)), [n1, s1] = paroisGrotte(Math.max(0, s + 0.35));
  return z > Math.max(n0, n1) + 0.3 && z < Math.min(s0, s1) - 0.3;
};
// le sanctuaire (本殿) dans la grotte, tourné vers la mer (l'est) : son emprise ; le torii à la bouche ; on en fait le tour par
// derrière (dans le sens des aiguilles d'une montre), où suintent les rochers de Toyotama-hime (お乳岩), au fond de la grotte
const HONDEN = { x: 12.6, z: GROTTE.z, lx: 7.4, lz: 10.2 };
const TORII_GROTTE = { x: X_GROTTE + 0.2, demi: 1.9, h: 4.6 };
const OCHICHI = { x: X_SALLE - GROTTE.prof + 1.1, z: GROTTE.z - 0.6 };
// le lapin qu'on caresse (撫でうさぎ), sur son rebord de roche dans sa petite clôture rouge, au sud du sanctuaire
const USAGI = { x: 17.6, z: GROTTE.z + 8.3 };
// le petit sanctuaire du prince (皇子神社), au sud du grand, vers le fond ; le bureau des porte-bonheur de la grotte, au nord
const OJI = { x: 8.6, z: GROTTE.z + 8.1 };
const CABANE = { x: 18.6, z: GROTTE.z - 8.4, l: 3.2, p: 2.2 };
// le rocher de la tortue (亀石), dans la mer devant le sanctuaire : son creux carré (枡形) entouré de sa corde ; d'où on lance
const KAMEISHI = { x: 50.8, z: -34.0, y: 1.9 };
const LANCEUR = { x: 43.9, z: -33.8 };
// la petite échoppe des boules de chance (運玉), sur la terrasse
const ECHOPPE = { x: 38.6, z: -28.4 };
// la hutte de la naissance (産屋, le secret) : contre la paroi nord de la grotte, au nord du sanctuaire, au bord du chemin qui en
// fait le tour ; son toit de plumes de cormoran n'a jamais été fini. Les trois plumes du secret, par terre, en vue, à côté de là où
// l'on passe : sur le palier d'Udo Inari, sur la pointe après le pont, sur le quai du port
const HUTTE = { x: 11.0, z: GROTTE.z - 9.0 };
const PLUMES = [
  { id: 'p1', x: -9.7, z: -12.6, ry: 0.7 },
  { id: 'p2', x: 30.8, z: -2.2, ry: 2.2 },
  { id: 'p3', x: -45.2, z: -30.6, ry: -0.9 },
];
/**
 * L'état du secret des plumes : trouvé (fini), les plumes ramassées (pris : des indices, « plume-p1 »…, n). Relu dans le stockage
 * au plus toutes les 0,4 s : les conditions des actions sont demandées à chaque image, et quatorze lectures du stockage par
 * image coûtaient à un téléphone près d'une demi-milliseconde (2026-10-31). etatPlumes.oublier() après un changement.
 */
const etatPlumes = (() => {
  let s = null, lu = -1;
  const lire = () => {
    const t = performance.now();
    if (!s || t - lu > 400) {
      lu = t;
      const pris = PLUMES.map((p) => indiceVu(`plume-${p.id}`));
      s = { fini: secretTrouve('plumes'), pris, n: pris.filter(Boolean).length };
    }
    return s;
  };
  lire.oublier = () => { s = null; };
  return lire;
})();
const ramassees = () => etatPlumes().n;

// ---------------------------------------------------------------- La côte
// le contour de la terre : le pays à l'ouest, le cap qui avance vers l'est (la crique du port au nord-ouest, la falaise de la
// grotte et sa terrasse au nord-est, la crique sous le pont Tamabashi au sud) ; tout le reste est la mer
const COTE = [
  [-720, -720], [-150, -720], [-140, -380], [-128, -200], [-118, -110], [-110, -76], [-100, -62],
  [-86, -53], [-74, -48.5], [-67, -46.5], [-64, -41], [-62, -35.6], [-60.4, -33.4],
  [-27.4, -33.4], [-25.8, -36.4], [-24.8, -42], [-22.2, -48], [-16, -52.4],
  [-4, -54.2], [8, -53.4], [18, -51], [25.4, -48.6], [33, -46.8], [40, -46.3], [44.4, -45.7],
  [45.9, -43], [46.5, -36], [46.3, -28], [46.5, -23.4],
  [47.6, -16], [49.2, -8], [50, 0], [49, 6.6], [46, 10.8], [40, 12.6], [32, 13.2], [26.6, 12.4],
  [25.0, 8], [24.0, 2.4], [23.4, -1.6], [22.0, -3.2], [20.6, -3.0], [19.6, -1.0], [19.2, 2.0], [18.9, 5.4], [18.0, 6.6],
  [10, 6.6], [2, 6.9], [-6, 7.6], [-14, 9.8], [-24, 12.2], [-36, 16], [-46, 19.6], [-60, 23.6], [-76, 25.8], [-92, 27.6], [-104, 33], [-114, 52],
  [-124, 110], [-136, 260], [-148, 720], [-720, 720],
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
// le platier (千畳敷), au pied de la falaise sud : une table de roche à fleur d'eau, rayée de crêtes parallèles (le « planche à
// laver des oni », 鬼の洗濯板 : des couches de grès dur et de schiste tendre que la mer a usées)
const PLATIER = [[-46, 21.4], [-34, 16.6], [-22, 12.6], [-12, 10.2], [-2, 8.4], [10, 7.8], [17.8, 7.8], [18.6, 13], [15.6, 22], [8, 28.6], [-6, 31.6],
  [-22, 31], [-36, 28.6], [-48, 25]];
// des rochers plats au large, où la mer brise ; ceux autour du rocher de la tortue
const RECIFS = [
  { x: 60, z: -40, rx: 6, rz: 2.4, ry: 0.5, h: 0.4 }, { x: 64, z: -14, rx: 5, rz: 2, ry: -0.3, h: 0.35 }, { x: 58, z: 20, rx: 6.5, rz: 2.6, ry: 0.2, h: 0.45 },
  { x: 32, z: -58, rx: 5.5, rz: 2.2, ry: 0.1, h: 0.4 }, { x: -6, z: -66, rx: 7, rz: 2.4, ry: -0.2, h: 0.35 }, { x: 30, z: 26, rx: 4.5, rz: 1.8, ry: 0.7, h: 0.3 },
];

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
const surEsc = (E, x, z, m = 0) => Math.abs(x - E.x) < E.demi + m && (z - E.z0) * Math.sign(E.z1 - E.z0) > -m && (z - E.z1) * Math.sign(E.z1 - E.z0) < m;
/** La hauteur du chemin des lanternes en x (du haut des marches du Rōmon au pont) ; du pont (en arc) ; des marches du Rōmon. */
const yLanternes = (x) => Y_ROMON + (Y_POINTE - Y_ROMON) * lisse(LANTERNES.x0 + 2, LANTERNES.x1, x);
const yPont = (x) => Y_POINTE + PONT.haut * Math.sin(PI * Math.min(1, Math.max(0, (x - PONT.x0) / (PONT.x1 - PONT.x0))));
const yMarchesRomon = (x) => Y_ROUTE + (Y_ROMON - Y_ROUTE) * Math.min(1, Math.max(0, Math.ceil(((x - MARCHES_ROMON.x0) / (MARCHES_ROMON.x1 - MARCHES_ROMON.x0)) * MARCHES_ROMON.n) / MARCHES_ROMON.n));

// ---------------------------------------------------------------- Le relief
/** Une bosse douce de hauteur h et de rayon r autour de cx, cz. */
const bosse = (x, z, cx, cz, r, h) => { const d = Math.hypot(x - cx, z - cz) / r; return d < 1 ? h * (0.5 + 0.5 * Math.cos(d * PI)) : 0; };
/** La ligne de la crête (l'échine du cap), d'ouest en est. */
const zCrete = (x) => -24 - 0.12 * (x + 20);
/**
 * La crête au-dessus de la grotte (jusqu'à 12 m au-dessus du cap) : elle naît à l'ouest de la place du Shinmon, et finit à l'est
 * sur la falaise de la grotte ; son flanc sud descend doucement jusqu'à l'allée, son flanc nord, plus raide, jusqu'à la mer.
 */
function crete(x, z) {
  const H = 12 * lisse(-34, -15, x);
  if (H <= 0) return 0;
  const dz = z - zCrete(x), w = dz > 0 ? 20.5 : 25, t = Math.abs(dz) / w;
  if (t >= 1) return 0;
  return H * (1 - t * t) ** 1.3 + (bruitDoux(x * 0.09, z * 0.09, 3) - 0.5) * 2.6 * (1 - t) * lisse(-30, -18, x);
}
/** Les collines au loin (le pays derrière le cap, la côte au nord et au sud) : nulles près du lieu. */
function collines(x, z) {
  const loin = lisse(30, 120, -x - 100) + lisse(140, 260, Math.hypot(x + 40, z));
  if (loin <= 0) return 0;
  return Math.min(1, loin) * (bosse(x, z, -260, -120, 200, 90) + bosse(x, z, -230, 160, 210, 80) + bosse(x, z, -420, 0, 260, 140) + bosse(x, z, -180, -380, 230, 70)
    + bosse(x, z, -190, 420, 240, 66) + bosse(x, z, -560, -320, 260, 120) + bosse(x, z, -560, 360, 260, 110) + (bruitDoux(x * 0.025, z * 0.025, 3) - 0.5) * 18);
}
/** La terre avant la côte et les retouches des chemins : le haut du cap, la crête, la pointe, la descente vers le port. */
function terre(x, z) {
  let h = Y_ROUTE + crete(x, z);
  // la pointe, de l'autre côté de la crique du pont : un peu plus haute ; au nord de son escalier, la pente qui descend vers la
  // terrasse et les rochers ; la terrasse elle-même (au pied de la falaise de la grotte), à plat
  if (x > xParoi(z) - 0.4) {
    const yp = Y_POINTE + (bruitDoux(x * 0.2, z * 0.2, 2) - 0.5) * 0.5 * lisse(1, 4, versRect(POINTE, x, z));
    h = z > ESC.z0 ? yp : z > ESC.z1 ? Y_T + (yp - Y_T) * lisse(ESC.z1, ESC.z0, z) : Y_T + (bruitDoux(x * 0.3, z * 0.3, 2) - 0.5) * 0.4 * lisse(1, 3, versRect(TERRASSE, x, z));
  }
  // vers le port : le cap descend dans la crique, au nord de la rue et de la place (le long du Hatchōzaka)
  if (z < -10 && x < -20) {
    const f = lisse(-12, -30, z) * lisse(-74, -60, x) * (1 - lisse(-28, -20, x));
    h = h * (1 - f) + (Y_PORT + 0.4 + 0.12 * Math.max(0, -30 - z)) * f;
  }
  // des bosses douces sur le haut du cap, loin des chemins
  h += (bruitDoux(x * 0.11 + 3, z * 0.11, 3) - 0.5) * 1.2 * lisse(2, 8, Math.min(versRect(PARKING, x, z), versRect(RUE, x, z), versRect(PLACE, x, z), versRect(ALLEE, x, z), versRect(LANTERNES, x, z)));
  return h + collines(x, z);
}
/** Le fond de la mer, à d mètres du rivage (d < 0). */
const fond = (d) => -2.2 - 7.8 * lisse(0, 30, -d) - 9 * lisse(30, 220, -d);

function terrain(x, z) {
  const d = cote(x, z);
  let h;
  if (d < -3) h = fond(d);
  else {
    h = terre(x, z);
    // la falaise : de la terre au fond de la mer en quatre mètres (moins raide au fond de la crique du port)
    if (d < 3) { const f = fond(Math.min(0, d - 0.5)); h = f + (h - f) * lisse(-1.4, 3, d); }
  }
  // au pied des falaises, des rochers qui sortent de l'eau ; les récifs plats au large
  if (d > -7 && d < 1.2 && !dansRect(QUAI, x, z, 4)) {
    const r = Math.max(0, bruitDoux(x * 0.55 + 7, z * 0.55, 2) - 0.56) * 5.5;
    if (r > 0) h = Math.max(h, -0.9 + r);
  }
  for (const r of RECIFS) {
    const c = Math.cos(r.ry), s = Math.sin(r.ry), u = (x - r.x) * c - (z - r.z) * s, v = (x - r.x) * s + (z - r.z) * c, q = Math.hypot(u / r.rx, v / r.rz);
    if (q < 1.3) h = Math.max(h, r.h - 3.2 * lisse(0.7, 1.3, q) + (bruitDoux(x * 0.8, z * 0.8, 2) - 0.5) * 0.35);
  }
  // le platier au pied de la falaise sud : une table à fleur d'eau (ses crêtes sont dessinées à part), qui plonge à son bord
  if (z > 6 && z < 34 && x > -50 && x < 20) {
    const dp = (dansPoly(PLATIER, x, z) ? 1 : -1) * auBordPoly(PLATIER, x, z);
    if (dp > -2.5) h = Math.max(h, 0.18 + (bruitDoux(x * 0.35, z * 0.35, 2) - 0.5) * 0.16 - 2.6 * lisse(0, -2.5, dp));
  }
  // les rochers autour du rocher de la tortue (le rocher lui-même est dessiné à part)
  { const dk = Math.hypot(x - KAMEISHI.x, z - KAMEISHI.z); if (dk < 7) h = Math.max(h, -0.5 + 1.3 * (1 - lisse(1.5, 7, dk)) * (0.6 + 0.8 * bruitDoux(x * 0.7, z * 0.7, 1))); }

  // ---- les retouches : ce qui est bâti, plat
  // le parking, la rue, la place, l'allée : plats, à la hauteur de la route ; le sol revient à la pente en 2 m
  {
    const dh = Math.min(versRect(PARKING, x, z), versRect(RUE, x, z), versRect(PLACE, x, z), versRect(ALLEE, x, z), aLaPlace(RECOIN, x, z) < 0 ? 0 : Math.max(0, aLaPlace(RECOIN, x, z)));
    if (dh < 2.2) h = Y_ROUTE - 0.03 + (h - Y_ROUTE + 0.03) * lisse(0.25, 2.2, dh);
  }
  // les marches du Rōmon et le dessous du Rōmon : à la hauteur de chaque marche ; le chemin des lanternes
  {
    if (x > MARCHES_ROMON.x0 && x < MARCHES_ROMON.x1 && Math.abs(z) < MARCHES_ROMON.z1 + 1.2) h = Math.min(h, yMarchesRomon(x) - 0.22);
    const dr = versRect({ x0: -2, x1: 2.2, z0: -4.8, z1: 4.8 }, x, z);
    if (dr < 1.6) h = Y_ROMON - 0.03 + (h - Y_ROMON + 0.03) * lisse(0.2, 1.6, dr);
    const dl = versRect(LANTERNES, x, z);
    if (dl < 2) { const yl = yLanternes(Math.min(LANTERNES.x1, Math.max(LANTERNES.x0, x))); h = yl - 0.03 + (h - yl + 0.03) * lisse(0.25, 2, dl); }
  }
  // la pointe (la place au bout du pont), plate ; la terrasse de la grotte, plate
  {
    const dp = versRect(POINTE, x, z);
    if (dp < 2) h = Y_POINTE - 0.03 + (h - Y_POINTE + 0.03) * lisse(0.2, 2, dp);
    const dt = versRect(TERRASSE, x, z);
    if (dt < 1.2 && x > 21.6) h = Y_T - 0.03 + (h - Y_T + 0.03) * lisse(0.15, 1.2, dt);
  }
  // le palier du sanctuaire d'Inari, taillé dans le flanc de la crête ; le quai du port
  {
    const di = versRect(INARI, x, z);
    if (di < 2) h = Y_INARI - 0.03 + (h - Y_INARI + 0.03) * lisse(0.2, 2, di);
    const dq = versRect(QUAI, x, z);
    if (dq < 2.5 && z > QUAI.z0 - 0.05) h = Y_PORT - 0.03 + (h - Y_PORT + 0.03) * lisse(0.2, 2.5, dq);
  }
  // le sol de la grotte, à plat, creusé dans la montagne (sa voûte, dessinée à part, le couvre)
  if (solGrotte(x, z)) h = Y_T - 0.03;
  // les escaliers, en dernier : à côté des marches, le sol un quart de mètre sous la ligne de leurs nez, puis la pente ; sous
  // elles, toujours sous le dessus de la plus basse des deux voisines (le sol est dessiné 3 cm plus haut)
  for (const E of ESCALIERS) {
    if (Math.abs(x - E.x) > E.demi + 2.6 || !surEsc(E, E.x, z, 0)) continue;
    const dx = Math.abs(x - E.x), hl = yLigneEsc(E, z) - 0.25;
    h = hl + (h - hl) * lisse(E.demi + 0.35, E.demi + 2.4, dx);
    if (dx < E.demi + 0.4) {
      const k = kMarche(E, z);
      if (k >= 0 && k < E.n) h = Math.min(h, Math.min(marcheDe(E, k), k > 0 ? marcheDe(E, k - 1) : E.y0, k + 1 < E.n ? marcheDe(E, k + 1) : E.y1) - 0.1);
    }
  }
  return h;
}

// le sol tel que le jeu le dessine (balade.js, terrain) : une grille de 4 m, de 1 m autour du jeu (3 cm plus haut) ; deux
// triangles par case, la diagonale de (x1, z0) à (x0, z1) ; les escaliers, la grotte et la falaise en cases de 25 cm
// (solDetaille)
const ETENDUE = { x0: -720, x1: 720, z0: -720, z1: 720, pas: 4, fin: { x0: -112, x1: 60, z0: -64, z1: 40, pas: 1 } };
const solDetaille = (x0, z0, x1, z1) => {
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  return ESCALIERS.some((E) => surEsc(E, cx, cz, 1.4)) || (cx > X_SALLE - GROTTE.prof - 2 && cx < X_GROTTE + 2.6 && cz > -46 && cz < -8);
};
const hGrille = new Map();
const hNoeud = (x, z) => { const k = (x + 1024) * 4096 + (z + 1024); let h = hGrille.get(k); if (h === undefined) hGrille.set(k, (h = terrain(x, z))); return h; };
/** La hauteur du sol dessiné en x, z, et la pente de sa facette là. */
function solDessine(x, z) {
  const F = ETENDUE.fin, fine = x >= F.x0 && x < F.x1 && z >= F.z0 && z < F.z1, g = fine ? F : ETENDUE, p = g.pas, leve = fine ? 0.03 : 0;
  const x0 = g.x0 + Math.floor((x - g.x0) / p) * p, z0 = g.z0 + Math.floor((z - g.z0) / p) * p;
  if (fine && solDetaille(x0, z0, x0 + p, z0 + p)) {
    const q = 0.25, xa = x0 + Math.floor((x - x0) / q) * q, za = z0 + Math.floor((z - z0) / q) * q, fu = (x - xa) / q, fv = (z - za) / q;
    const ha = terrain(xa, za), hb = terrain(xa + q, za), hd = terrain(xa, za + q), hf = terrain(xa + q, za + q);
    return fu + fv <= 1 ? { h: ha + (hb - ha) * fu + (hd - ha) * fv + leve, pente: Math.hypot(hb - ha, hd - ha) / q }
      : { h: hf + (hd - hf) * (1 - fu) + (hb - hf) * (1 - fv) + leve, pente: Math.hypot(hf - hd, hf - hb) / q };
  }
  const fu = (x - x0) / p, fv = (z - z0) / p, ha = hNoeud(x0, z0), hb = hNoeud(x0 + p, z0), hd = hNoeud(x0, z0 + p), hf = hNoeud(x0 + p, z0 + p);
  return fu + fv <= 1 ? { h: ha + (hb - ha) * fu + (hd - ha) * fv + leve, pente: Math.hypot(hb - ha, hd - ha) / p }
    : { h: hf + (hd - hf) * (1 - fu) + (hb - hf) * (1 - fv) + leve, pente: Math.hypot(hf - hd, hf - hb) / p };
}

/**
 * Peut-on être en x, z ? Sur le parking, dans la rue, sur la place du Shinmon et l'allée, dans le coin de Bunbuku ; sur les marches
 * et sous le Rōmon ; sur le chemin des lanternes, le pont, la pointe ; dans les escaliers (Inari, la grotte, le Hatchōzaka) ; sur
 * le palier d'Inari, la terrasse, dans la grotte (hors du sanctuaire) ; sur le quai du port. Leurs bords ont tous ce qui arrête
 * (les barrières rouges, les murets de pierre, les façades, la falaise, les parois de la grotte, les bittes du quai) : le
 * voyageur, un point, s'arrête 27 cm avant.
 */
function dansLeCadre(x, z) {
  if (dansRect(PARKING, x, z) || dansRect(RUE, x, z) || dansRect(PLACE, x, z) || dansRect(ALLEE, x, z) || aLaPlace(RECOIN, x, z) < 0) return true;
  if (dansRect(MARCHES_ROMON, x, z)) return true;
  // (sous le Rōmon : par son passage du milieu)
  if (x > MARCHES_ROMON.x1 - 0.05 && x < LANTERNES.x0 + 0.05 && Math.abs(z) < ROMON.passage) return true;
  if (dansRect(LANTERNES, x, z) || dansRect(POINTE, x, z)) return true;
  if (x >= PONT.x0 - 0.05 && x <= PONT.x1 + 0.05 && Math.abs(z - PONT.z) < PONT.demi) return true;
  for (const E of ESCALIERS) if (surEsc(E, x, z, 0.05) && Math.abs(x - E.x) < E.demi) return true;
  if (dansRect(INARI, x, z) || dansRect(QUAI, x, z)) return true;
  if (dansRect(TERRASSE, x, z) && x > xParoi(z) + 1.35) return true;
  return dansGrotte(x, z);
}

/** Ce que le carnet et le menu savent du lieu, sans le construire. */
export const infos = {
  id: 'udo', carte: 'udo-inari-shrine', video: '7641332794487999766',
  nom: { en: 'Udo', fr: 'Udo', ja: '鵜戸' }, nomJa: '鵜戸神宮',
  tampons: [
    { id: 'ema', motif: 'emaLapin', ja: '兎の絵馬', encre: '#c0392b', forme: 'carre' },
    { id: 'inari', motif: 'toriiEscalier', ja: '鵜戸稲荷', encre: '#b8422b' },
    { id: 'usagi', motif: 'usagi', ja: '撫でうさぎ', encre: '#6a5a8a' },
    { id: 'ochichi', motif: 'ochichi', ja: 'お乳岩', encre: '#3a6a7a', forme: 'carre' },
    { id: 'undama', motif: 'kameishi', ja: '運玉', encre: '#8a5a2a' },
  ],
  get textes() { return TEXTES; },
};

/** La nuit : les lanternes, les fenêtres des boutiques s'allument. */
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
  /** Un repère tourné : la pose d'une pièce donnée dans le repère d'un objet posé en x0, z0, tourné de ry0 (rx et rz penchent la
   * pièce dans son propre repère : l'ordre YXZ ; Motonosumi, 2026-10-29). Lire les points par leur nom (q.x, q.y, q.z). */
  const repere = (x0, z0, ry0) => {
    const c = Math.cos(ry0), s = Math.sin(ry0);
    return (lx, y, lz, o = {}) => ({ ordre: 'YXZ', ...o, x: x0 + lx * c + lz * s, y, z: z0 - lx * s + lz * c, ry: ry0 + (o.ry || 0) });
  };
  // le décor en morceaux de 25 m (un objet chacun : la carte graphique dessine moins de petits objets)
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
  /** La normale vers le dehors du polygone pts au milieu de son bord i → i + 1 : [nx, nz]. */
  const dehorsPoly = (pts, i) => {
    const [xa, za] = pts[i], [xb, zb] = pts[(i + 1) % pts.length], l = Math.hypot(xb - xa, zb - za) || 1, nx = (zb - za) / l, nz = -(xb - xa) / l;
    return dansPoly(pts, (xa + xb) / 2 + nx * 0.3, (za + zb) / 2 + nz * 0.3) ? [-nx, -nz] : [nx, nz];
  };
  const ROUGE = P.vermillon, ROUGE_F = P.vermillonFonce, BETON = '#bdb8ad', BETON_FONCE = '#a9a498', BLANC_METAL = '#eef0ec';
  // la roche du cap : des grès et des schistes en couches, gris et beiges, creusés d'alvéoles (タフォニ) ; sombre et mouillée à l'eau
  const ROCHES = ['#9a917f', '#8c8474', '#a39a86', '#857d6d', '#938a78', '#7c7466'];
  const MOUILLE = '#4d4a43';
  /**
   * Un rocher bosselé de rayons rx, ry (haut), rz en x, y, z (le milieu, au ras du sol), tourné de t : un icosaèdre déformé de
   * bosses douces, aplati dessous, peint par couches ; sombre et mouillé dans l'eau.
   */
  const rocher = (a, x, y, z, rx, ry, rz, t, finesse = 2, mouille = false, couches = 0) => {
    const g = hasard(x * 1.31, z * 0.71);
    return a.piece(new THREE.IcosahedronGeometry(1, finesse), ROCHES[1], {
      x, y, z, ry: t, sx: rx, sy: ry, sz: rz, nuance: 0.05,
      deformer: (px, py, pz) => {
        const l = Math.hypot(px, py, pz) || 1, nx = px / l, ny = py / l, nz = pz / l;
        const k = 1 + 0.16 * Math.sin(nx * 3.1 + g * 9) * Math.cos(nz * 2.7 - g * 5) + 0.09 * Math.sin(ny * 6.3 + nx * 2 + g * 3);
        let yy = Math.max(py * k, -0.4);
        if (couches) { const q = Math.floor((yy + 1) * couches) / couches - 1; yy = q + (yy - q) * 0.35; const r = 1 - 0.06 * (yy + 0.4); return [px * k * r, yy, pz * k * r]; }
        return [px * k, yy, pz * k];
      },
      teinte: (wx, wy, wz) => (mouille && wy < 0.35 ? MOUILLE : ROCHES[Math.floor(wy * 1.7 + hasard(Math.floor(wx), Math.floor(wz)) * 0.6 + 40) % ROCHES.length]),
    });
  };

  // ---------------------------------------------------------------- Les surfaces où l'on marche (escaliers, marches, pont)
  // les trois escaliers : une ligne au milieu de chaque marche (monde.chemin, aux bouts droits) ; les cinq marches du Rōmon ;
  // le pont Tamabashi, en arc
  for (const E of ESCALIERS) {
    const pts = [[E.x, E.z0, E.y0]];
    for (let k = 0; k < E.n; k++) pts.push([E.x, zMarche(E, k), marcheDe(E, k)]);
    pts.push([E.x, E.z1, E.y1]);
    monde.chemin(pts, E.demi, { sol: 'pierre', droits: true });
  }
  {
    const R = MARCHES_ROMON, pts = [[R.x0, 0, Y_ROUTE]];
    for (let k = 0; k < R.n; k++) pts.push([R.x0 + ((k + 0.5) * (R.x1 - R.x0)) / R.n, 0, Y_ROUTE + ((Y_ROMON - Y_ROUTE) * (k + 1)) / R.n]);
    pts.push([R.x1, 0, Y_ROMON]);
    monde.chemin(pts, (R.z1 - R.z0) / 2, { sol: 'pierre', droits: true });
    // (sous le Rōmon : son dallage de pierre, à la hauteur du haut des marches)
    monde.surface(R.x1, LANTERNES.x0, -ROMON.passage - 0.3, ROMON.passage + 0.3, Y_ROMON, { sol: 'pierre' });
  }
  {
    const pts = [];
    for (let k = 0; k <= 24; k++) { const x = PONT.x0 + ((PONT.x1 - PONT.x0) * k) / 24; pts.push([x, PONT.z, yPont(x)]); }
    monde.chemin(pts, PONT.demi, { sol: 'bois', droits: true });
  }

  // ---------------------------------------------------------------- La falaise de la grotte : sa paroi, la bouche, la voûte
  // Une paroi de roche (une grille déformée, posée devant la pente de la crête) du pied de la falaise jusqu'à son haut, de la
  // mer au nord jusqu'au haut de l'escalier au sud ; au-dessus de la bouche, elle avance en surplomb (comme sur les photos : la
  // grotte est sous un grand toit de roche). Des couches grises et beiges, plus sombres sous le surplomb, mouillées à la mer.
  const hautFalaise = (z) => terre(xParoi(z) - 5.2, z);
  const basFalaise = (z) => (z < TERRASSE.z0 - 0.6 ? -1.6 : z < ESC.z1 + 1.2 ? Y_T - 0.9 : yLigneEsc(ESC, z) - 1.1);
  const fractions = (pts) => { const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return L.map((l) => l / L[L.length - 1]); };
  const surPoly = (pts, us, u) => { let i = 1; while (i < pts.length - 1 && us[i] < u) i++; const f = (u - us[i - 1]) / (us[i] - us[i - 1] || 1); return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f]; };
  const NA = 58, uA = Array.from({ length: NA }, (_, j) => j / (NA - 1));
  const arche = (() => { const dense = Array.from({ length: 601 }, (_, i) => archeGrotte(i / 600)), uD = fractions(dense); return uA.map((u) => surPoly(dense, uD, u)); })();
  // (le surplomb : au-dessus de la bouche, de 0,6 à 6 m au-dessus de son haut, la paroi avance jusqu'à 1,8 m)
  const surplomb = (z, y) => {
    const fz = lisse(GROTTE.z - GROTTE.demi - 3, GROTTE.z - GROTTE.demi + 1, z) * (1 - lisse(GROTTE.z + GROTTE.demi - 1, GROTTE.z + GROTTE.demi + 3, z));
    const u = (y - (Y_T + GROTTE.haut + 0.6)) / 5.5;
    return u <= 0 || u >= 1 ? 0 : fz * 1.8 * Math.sin(Math.min(1, u * 1.6) * PI * 0.5) * (1 - lisse(0.5, 1, u));
  };
  const bosseParoi = (z, y) => 0.32 * (bruitDoux(z * 0.33, y * 0.33, 2) - 0.5) + 0.15 * (bruitDoux(z * 1.1 + 7, y * 1.1, 1) - 0.5) + 0.1 * Math.sin(y * 1.9 + z * 0.12);
  const xFace = (z, y) => xParoi(z) + 0.75 + bosseParoi(z, y) + surplomb(z, y);
  {
    const pos = [], cols = [], Z0 = -48, Z1 = -10, PAS_Z = 1.0;
    // (dans le morceau de la bouche, toutes les colonnes ont les mêmes rangées jusqu'à la rangée I, 1,4 m au-dessus de son haut)
    const ZG0 = Math.floor(GROTTE.z - GROTTE.demi - 1.2), ZG1 = Math.ceil(GROTTE.z + GROTTE.demi + 1.2), I = 7;
    const dansSec = (z) => z >= ZG0 - 0.5 && z <= ZG1 + 0.5;
    const colonnes = [];
    for (let z = Z0; z <= Z1 + 1e-6; z += PAS_Z) {
      const bas = dansSec(z) ? Y_T - 0.9 : basFalaise(z), sommet = Math.max(bas + 0.5, hautFalaise(z) - 0.1);
      const ys = [];
      if (dansSec(z)) { for (let k = 0; k <= I; k++) ys.push(bas + (k * (Y_T + GROTTE.haut + 1.4 - bas)) / I); for (let y = ys[I] + 1.5; y < sommet - 0.4; y += 1.5) ys.push(y); }
      else for (let y = bas; y < sommet - 0.4; y += y > Y_T + 1 && y < Y_T + 12 ? 0.9 : 1.4) ys.push(y);
      ys.push(sommet);
      colonnes.push({ z, pts: ys.map((y, j) => [j === ys.length - 1 ? xParoi(z) - 5.2 : xFace(z, y), y, z]) });
    }
    const MOUSSE = '#6f7d4f', MOUSSE_F = '#5f6d44';
    // un triangle de la paroi, tourné vers la terrasse ; sa couleur : l'herbe et les fougères sur ce qui regarde vers le haut,
    // sombre sous le surplomb, mouillé près de l'eau ; ailleurs des couches grises et beiges proches (en couleurs franches, une
    // mosaïque de triangles)
    const ajouter = (A, B, C) => {
      tri(pos, cols, A, B, C, '#000', [1, 0, 0]);
      cols.pop();
      const p = pos.slice(-9), cy = (p[1] + p[4] + p[7]) / 3, cz = (p[2] + p[5] + p[8]) / 3;
      const ux = p[3] - p[0], uy = p[4] - p[1], uz = p[5] - p[2], vx = p[6] - p[0], vy = p[7] - p[1], vz = p[8] - p[2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, ny1 = ny / (Math.hypot(nx, ny, nz) || 1);
      const n = bruitDoux(cz * 0.45, cy * 0.45, 1), dessous = ny1 < -0.3, couche = Math.floor((cy + 1.3 * bruitDoux(cz * 0.08, cy * 0.05, 2)) / 1.3);
      cols.push(cy < 0.6 ? MOUILLE : dessous ? (n > 0.5 ? '#5d584e' : '#625d52') : ny1 > 0.45 ? (n > 0.5 ? MOUSSE : MOUSSE_F) : ROCHES[((couche % ROCHES.length) + ROCHES.length) % ROCHES.length]);
    };
    // (deux colonnes voisines n'ont pas le même nombre de points : on les relie par leur hauteur relative)
    const relier = (A, B) => {
      let i = 0, j = 0;
      while (i < A.length - 1 || j < B.length - 1) {
        const ta = i < A.length - 1 ? (i + 1) / (A.length - 1) : 2, tb = j < B.length - 1 ? (j + 1) / (B.length - 1) : 2;
        if (ta <= tb) { ajouter(A[i], B[j], A[i + 1]); i++; } else { ajouter(A[i], B[j], B[j + 1]); j++; }
      }
    };
    for (let c = 0; c < colonnes.length - 1; c++) {
      const A = colonnes[c].pts, B = colonnes[c + 1].pts;
      if (dansSec(colonnes[c].z) && dansSec(colonnes[c + 1].z)) relier(A.slice(I), B.slice(I));
      else relier(A, B);
    }
    // ---- la bouche : la paroi en anneaux, de son contour jusqu'au bord de ce morceau (la colonne sud, ZG1, de bas en haut ; la
    // rangée I ; la colonne nord, ZG0, de haut en bas) ; le dernier anneau rejoint les points mêmes des colonnes
    const sec = colonnes.filter((c) => dansSec(c.z));
    const bord = [...sec[sec.length - 1].pts.slice(0, I + 1)];
    for (let c = sec.length - 2; c >= 1; c--) bord.push(sec[c].pts[I]);
    for (let i = I; i >= 0; i--) bord.push(sec[0].pts[i]);
    // (le bord va du pied sud au pied nord ; le contour de la bouche est pris dans le même sens : arche[NA − 1 − j])
    const bordZY = bord.map((p) => [p[2], p[1]]), uB = fractions(bordZY);
    const NR = 7, anneaux = [];
    for (let k = 0; k < NR; k++) {
      const f = (k / NR) ** 1.2;
      anneaux.push(uA.map((u, j) => { const [az, ay] = arche[NA - 1 - j], [bz, by] = surPoly(bordZY, uB, u), z = az + (bz - az) * f, y = ay + (by - ay) * f; return [xFace(z, y), y, z]; }));
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
    // ---- dedans : la lèvre (du contour sur la paroi jusqu'au début de la salle, X_SALLE), puis la salle, de section en section :
    // le contour de la bouche élargi et rehaussé (salleGrotte), bosselé, qui se referme au fond. Des tons de roche de plus en
    // plus sombres vers le fond, tournés vers le dedans
    const TONS_GROTTE = ['#6a655a', '#625d53', '#5a564d', '#534f47', '#4c4842', '#46433d', '#403d38', '#3a3833'];
    // (une couleur par case, ses deux triangles : par triangle, les cases du fond, étroites, faisaient des rayons)
    const tonDedans = (A, C) => {
      const m = [(A[0] + C[0]) / 2, (A[1] + C[1]) / 2, (A[2] + C[2]) / 2], s = X_SALLE - m[0];
      const b = bruitDoux(m[2] * 0.35 + 3.1, m[0] * 0.35 + m[1] * 0.3, 1);
      return m[1] < Y_T + 0.25 ? '#4a463f' : TONS_GROTTE[Math.max(0, Math.min(TONS_GROTTE.length - 1, Math.round(Math.min(1, s / (GROTTE.prof * 0.7)) * (TONS_GROTTE.length - 1) * 0.85 + (b - 0.5) * 2.4 + (m[1] > Y_T + 5 ? 1 : 0))))];
    };
    const ajouterDedans = (A, B, C, vers, c) => {
      const m = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3, (A[2] + B[2] + C[2]) / 3];
      tri(pos, cols, A, B, C, c, [vers[0] - m[0], vers[1] - m[1], vers[2] - m[2]]);
    };
    const NS = 22, sections = [];
    for (let i = 0; i <= NS; i++) {
      const s = (GROTTE.prof * i) / NS, { fz, fy } = salleGrotte(s), x0 = X_SALLE - s;
      sections.push(uA.map((u, j) => {
        const [az, ay] = arche[NA - 1 - j], z = GROTTE.z + (az - GROTTE.z) * fz, y = Y_T - 0.35 + (ay - Y_T + 0.35) * fy;
        // (ses bosses : pas à la lèvre, et de moins en moins vers le fond, où tout se rejoint)
        // (pas sous 2,2 m : à hauteur de corps, la paroi est où le voyageur s'arrête, à 30 cm près)
        const b = (0.5 * (bruitDoux(z * 0.45 + 3, x0 * 0.45 + y * 0.35, 1) - 0.5) + 0.18 * (bruitDoux(z * 1.4, x0 * 1.4 - y, 1) - 0.5)) * lisse(0, 1.2, s) * Math.min(1, fz) * lisse(Y_T + 2.2, Y_T + 4, y);
        const dz = GROTTE.z - z, dy = Y_T + 2.5 - y, dl = Math.hypot(dz, dy) || 1;
        return [x0, y + (dy / dl) * b, z + (dz / dl) * b];
      }));
    }
    for (let j = 0; j < NA - 1; j++) {
      const A = anneaux[0][j], B = anneaux[0][j + 1], C = sections[0][j + 1], D = sections[0][j], vers = [(A[0] + C[0]) / 2, Y_T + 2.5, GROTTE.z], c = tonDedans(A, C);
      ajouterDedans(A, B, C, vers, c);
      ajouterDedans(A, C, D, vers, c);
    }
    for (let i = 0; i < NS; i++) for (let j = 0; j < NA - 1; j++) {
      const A = sections[i][j], B = sections[i][j + 1], C = sections[i + 1][j + 1], D = sections[i + 1][j];
      const vers = [X_SALLE - Math.min((GROTTE.prof * (i + 0.5)) / NS, GROTTE.prof - 2.5), Y_T + 2.5, GROTTE.z], c = tonDedans(A, C);
      // (la dernière section est un trait debout, le fond de la grotte : ses deux triangles par case aussi ; sans le second, des
      // trous en rayons laissaient voir la pente de la crête derrière)
      ajouterDedans(A, B, C, vers, c);
      ajouterDedans(A, C, D, vers, c);
    }
    const a = atelier(), g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    a.piece(g, ROCHES[0], { couleurs: cols, nuance: 0.04 });
    // des touffes d'herbe et de fougères accrochées à la paroi (pas autour de la bouche)
    for (let k = 0; k < 60; k++) {
      const z = Z0 + 2 + hasard(k, 1) * (Z1 - Z0 - 4), y = Math.max(basFalaise(z) + 1.6, Y_T + 1.5) + hasard(k, 2) * (hautFalaise(z) - Y_T - 3);
      if (y > hautFalaise(z) - 0.6) continue;
      if (Math.abs(z - GROTTE.z) < GROTTE.demi + 1.2 && y < Y_T + GROTTE.haut + 1.5) continue;
      a.houppe(0.3 + 0.35 * hasard(k, 3), k % 3 ? '#5a7f3e' : '#6a8f46', { x: xFace(z, y) + 0.1, y, z, sx: 0.5, sy: 0.7, sorte: 'persistant' }, 1);
    }
    poser(a.fin(), 0, 0, { y: 0 });
    // (la caméra : sous la voûte, elle se rapproche ; des blocs tout autour de la salle, mètre par mètre, juste derrière les parois,
    // la gardent hors de la roche : derrière le sanctuaire, elle passait dans la paroi et ne voyait plus que le vert de la crête)
    monde.toit(X_SALLE - GROTTE.prof, X_GROTTE + 0.4, GROTTE.z - GROTTE.large, GROTTE.z + GROTTE.large, Y_T + GROTTE.haut - 0.6, Y_T + 30);
    for (let s = -1.2; s < GROTTE.prof; s += 1) {
      const [n, su] = paroisGrotte(Math.max(0, s + 0.5)), xa = X_SALLE - s - 1, xb = X_SALLE - s;
      monde.bloc(xa, xb, n - 6, n + 0.25, Y_T - 1, Y_T + 14);
      monde.bloc(xa, xb, su - 0.25, su + 6, Y_T - 1, Y_T + 14);
    }
    monde.bloc(X_SALLE - GROTTE.prof - 6, X_SALLE - GROTTE.prof + 0.35, GROTTE.z - GROTTE.large - 2, GROTTE.z + GROTTE.large + 2, Y_T - 1, Y_T + 14);
  }

  // ---------------------------------------------------------------- La côte : les falaises, le pied mouillé, les rochers
  // Une frange de roche mouillée tout le long du rivage (de 1,6 m sous l'eau à 1,5 m au-dessus) : la mer fait son écume le
  // long d'elle (balade.js : là où le décor traverse l'eau) ; une paroi de roche à facettes devant chaque falaise (le relief en
  // grille les peindrait en longues traînées), avancée jusqu'à se tenir devant le sol dessiné (Motonosumi, 2026-10-29 : posée
  // juste devant la courbe du relief, elle était percée par les facettes du sol, et les deux scintillaient)
  {
    const pts = [];
    for (let i = 7; i <= 56; i++) if (i !== 13) pts.push(COTE[i]); else pts.push(null, COTE[i]);
    const a = atelier(), pos = [], cols = [];
    let prev = null;
    for (let i = 0; i + 1 < pts.length; i++) {
      if (!pts[i] || !pts[i + 1]) { prev = null; continue; }
      const [xa, za] = pts[i], [xb, zb] = pts[i + 1], l = Math.hypot(xb - xa, zb - za), n = Math.max(1, Math.round(l / 1.2));
      let nx = (zb - za) / l, nz = -(xb - xa) / l;
      if (cote((xa + xb) / 2 + nx * 2, (za + zb) / 2 + nz * 2) > 0) { nx = -nx; nz = -nz; }
      for (let k = 0; k < n; k++) {
        const f = k / n, x = xa + (xb - xa) * f, z = za + (zb - za) * f;
        const sorti = 0.5 + 1.1 * bruitDoux(x * 0.4, z * 0.4, 2), w = 0.6 + 0.9 * hasard(x, z);
        const bas = [x + nx * (w + 0.8), -1.6, z + nz * (w + 0.8)], haut = [x - nx * 0.4, sorti, z - nz * 0.4];
        if (prev) {
          const c = bruitDoux(x * 0.6, z * 0.6, 1.5) > 0.5 ? '#4a4741' : '#55514a';
          tri(pos, cols, prev[0], bas, haut, c, [nx, 0.4, nz]);
          tri(pos, cols, prev[0], haut, prev[1], c, [nx, 0.4, nz]);
        }
        prev = [bas, haut];
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    a.piece(geo, '#4a4741', { couleurs: cols, nuance: 0.06 });
    poser(a.fin(), 0, 0, { y: 0, trait: false });
  }
  for (const [i0, i1, pas, ombre] of [[13, 47, 1.6, true], [7, 12, 3.2, false], [47, 56, 3.2, false]]) {
    const ap = atelier(), pp = [], cp = [];
    const RANGS = [-1.3, -0.2, 0.8, 1.6, 2.3, 2.9];
    const strate = (y, x, z) => (y < 0.7 ? MOUILLE : ROCHES[((Math.floor((y + 1.6 * bruitDoux(x * 0.07, z * 0.07, 2)) / 1.2) % ROCHES.length) + ROCHES.length) % ROCHES.length]);
    // (l'écart d'un point au plan de la facette du sol sous lui : positif devant, négatif si le sol passe devant)
    const devant = (x, y, z) => { const q = solDessine(x, z); return (y - q.h) / Math.sqrt(1 + q.pente * q.pente); };
    const colonnes = [];
    for (let i = i0; i < i1; i++) {
      const [xa, za] = COTE[i], [xb, zb] = COTE[i + 1], l = Math.hypot(xb - xa, zb - za), n = Math.max(1, Math.round(l / pas));
      const tx = (xb - xa) / l, tz = (zb - za) / l;
      let nx = tz, nz = -tx;
      if (cote((xa + xb) / 2 + nx * 2, (za + zb) / 2 + nz * 2) > 0) { nx = -nx; nz = -nz; }
      for (let k = 0; k < n; k++) {
        const f = k / n, px = xa + (xb - xa) * f, pz = za + (zb - za) * f, marge = 0.12 + 0.0012 * Math.hypot(px, pz);
        const col = RANGS.map((d, r) => {
          const sx = px - nx * d, sz = pz - nz * d, haut = r === RANGS.length - 1;
          const y = haut ? Math.min(terrain(sx, sz), solDessine(sx, sz).h) - 0.1 : terrain(sx, sz) - (hasard(r * 7.3 + px, pz) - 0.5) * 0.14;
          let e = haut ? 0.08 : 0.32 + 0.1 * hasard(px * 3.1 + r, pz * 1.7);
          for (let essai = 0; essai < 10 && e < 4; essai++) {
            const ex = sx + nx * e, ez = sz + nz * e, pire = Math.min(devant(ex, y, ez), devant(ex - tx * pas * 0.5, y, ez - tz * pas * 0.5), devant(ex + tx * pas * 0.5, y, ez + tz * pas * 0.5));
            if (pire >= marge) break;
            e += marge - pire + 0.05;
          }
          return [sx + nx * e, y, sz + nz * e];
        });
        const prec = colonnes[colonnes.length - 1];
        colonnes.push({ col, nx, nz, px, pz, marge, lie: !!prec && Math.hypot(px - prec.px, pz - prec.pz) < pas * 2.5 });
      }
    }
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
        // (une couleur par case, de la couche de sa hauteur : des bandes, pas une mosaïque de triangles)
        const A = P0.col[r], B = Q.col[r], C = Q.col[r + 1], D = P0.col[r + 1], h = [Q.nx, 0.35, Q.nz], c2 = strate((A[1] + B[1] + C[1] + D[1]) / 4, Q.px, Q.pz);
        tri(pp, cp, A, B, C, c2, h);
        tri(pp, cp, A, C, D, c2, h);
      }
    }
    const gp = new THREE.BufferGeometry();
    gp.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3));
    ap.piece(gp, ROCHES[0], { couleurs: cp, nuance: 0.05 });
    poser(ap.fin(), 0, 0, { y: 0, trait: false, ombre });
  }
  // de gros rochers au pied des falaises, à moitié dans l'eau (pas dans la crique du port, ni sous le pont)
  for (let i = 0; i < 110; i++) {
    const k = 14 + (i % 40), [xa, za] = COTE[k], [xb, zb] = COTE[k + 1], f = hasard(i, 21), l = Math.hypot(xb - xa, zb - za) || 1;
    let nx = (zb - za) / l, nz = -(xb - xa) / l;
    if (cote((xa + xb) / 2 + nx * 2, (za + zb) / 2 + nz * 2) > 0) { nx = -nx; nz = -nz; }
    const e = 0.8 + 3 * hasard(i, 22), x = xa + (xb - xa) * f + nx * e, z = za + (zb - za) * f + nz * e;
    if (dansPoly(PLATIER, x, z) || (k >= 38 && k <= 43) || Math.hypot(x - KAMEISHI.x, z - KAMEISHI.z) < 3.5) continue;
    const r = 0.6 + 1.3 * hasard(i, 23);
    rocher(morceau(x, z, 60), x, -0.4 + r * 0.25, z, r, r * 0.8, r * 0.9, hasard(i, 24) * 6, 1, true);
  }
  for (const r of RECIFS) for (let k = 0; k < 4; k++) {
    const t = r.ry + k * 1.6, x = r.x + Math.cos(t) * r.rx * 0.5, z = r.z + Math.sin(t) * r.rz * 0.5, s = 0.8 + 0.6 * hasard(k, r.x);
    rocher(morceau(x, z, 60), x, r.h - 0.2, z, s * 1.4, s * 0.6, s, t, 1, true);
  }
  // le platier (千畳敷) : ses crêtes parallèles de grès dur (« la planche à laver des oni »), à fleur d'eau, et des flaques ;
  // des crêtes de 30 à 50 cm de large, tous les 1,1 m, en travers de la côte (comme au vrai : elles plongent vers le large)
  {
    const a = atelier(), dir = 0.62, cx = Math.cos(dir), cz = Math.sin(dir);
    for (let j = -40; j <= 40; j++) {
      // (chaque crête : une ligne droite à j × 1,1 m de l'origine, coupée par le platier ; des tronçons de 1 à 4 m)
      const o = j * 1.1 + 0.25 * Math.sin(j * 2.3);
      let tr = null;
      const fini = () => {
        if (tr && tr.length > 1) {
          const [x0, z0] = tr[0], [x1, z1] = tr[tr.length - 1], l = Math.hypot(x1 - x0, z1 - z0);
          if (l > 0.6) {
            const xm = (x0 + x1) / 2, zm = (z0 + z1) / 2, larg = 0.3 + 0.2 * hasard(j, xm), h = 0.1 + 0.08 * hasard(xm, j);
            // (le pied sous le plus bas du sol le long d'elle, le dessus au-dessus du plus haut : ni flottante, ni noyée)
            const yb = Math.min(terrain(x0, z0), terrain(xm, zm), terrain(x1, z1)) - 0.12, yt = Math.max(terrain(x0, z0), terrain(xm, zm), terrain(x1, z1)) + h;
            a.piece(new THREE.BoxGeometry(l, 1, larg), hasard(j, zm) > 0.5 ? '#968e80' : '#8a8376', {
              x: xm, y: (yb + yt) / 2, z: zm, ry: -Math.atan2(z1 - z0, x1 - x0), sy: yt - yb, nuance: 0.06, deformer: (px, py, pz) => [px, py, py > 0 ? pz * 0.45 : pz],
            });
          }
        }
        tr = null;
      };
      for (let s = -60; s <= 60; s += 0.5) {
        const x = -14 + cx * s - cz * o, z = 20 + cz * s + cx * o;
        const dans = dansPoly(PLATIER, x, z) && auBordPoly(PLATIER, x, z) > 0.6 && cote(x, z) < -1.2 && hasard(Math.floor(s / 2.5) + j * 7, j) > 0.18;
        if (dans) (tr ||= []).push([x, z]);
        else fini();
      }
      fini();
    }
    poser(a.fin(), 0, 0, { y: 0, ombre: false });
  }

  // ---------------------------------------------------------------- Les barrières, les murets, les lanternes (une seule sorte de chaque)
  /**
   * La barrière rouge (朱の柵), la même partout où l'on s'arrête au bord du vide ou de la mer : des poteaux carrés vermillon au
   * petit chapeau noir, tous les 1,8 m au plus, la lisse du haut (95 cm) et celle du bas, des planchettes debout entre elles,
   * comme le long des chemins d'Udo. pts [[x, z, y?]…] : sa ligne (y : la hauteur du sol au point, sinon le sol du relief, ou
   * yAt) ; le mur qui arrête le voyageur suit sa ligne, 30 cm de chaque côté ; finir : un poteau au dernier point.
   */
  const barriere = (pts, { yAt = null, haut = 0.95, mur = true, finir = true } = {}) => {
    const Y = (p) => (p[2] ?? (yAt ? yAt(p[0], p[1]) : terrain(p[0], p[1])));
    for (let i = 0; i + 1 < pts.length; i++) {
      const [xa, za] = pts[i], [xb, zb] = pts[i + 1], ya = Y(pts[i]), yb = Y(pts[i + 1]), l = Math.hypot(xb - xa, zb - za);
      if (l < 0.05) continue;
      const n = Math.max(1, Math.ceil(l / 1.8)), ang = Math.atan2(xb - xa, zb - za), a = morceau((xa + xb) / 2, (za + zb) / 2, 40);
      const yAu = (f) => ya + (yb - ya) * f;
      for (let k = 0; k <= n; k++) {
        if (k === n && (i + 2 < pts.length || !finir)) continue;
        // (chaque poteau descend 15 cm sous le sol dessiné sous lui : à côté d'un escalier, le sol est plus bas que sa ligne)
        const f = k / n, x = xa + (xb - xa) * f, z = za + (zb - za) * f, y = yAu(f), pied = Math.min(y, solDessine(x, z).h) - 0.15;
        a.boite(0.1, y + haut + 0.04 - pied, 0.1, ROUGE, { x, y: (y + haut + 0.04 + pied) / 2, z, ry: ang }).boite(0.13, 0.05, 0.13, P.noir, { x, y: y + haut + 0.065, z, ry: ang });
      }
      // (les lisses, carrées, d'un poteau à l'autre ; un peu plus bas que le chapeau)
      a.baton([xa, ya + haut - 0.04, za], [xb, yb + haut - 0.04, zb], 0.032, ROUGE, 4).baton([xa, ya + 0.2, za], [xb, yb + 0.2, zb], 0.026, ROUGE_F, 4);
      // les planchettes, tous les 20 cm, entre les poteaux
      const np = Math.round(l / 0.2);
      for (let k = 1; k < np; k++) {
        const f = k / np, x = xa + (xb - xa) * f, z = za + (zb - za) * f, y = yAu(f);
        if (Math.abs(((f * n) % 1)) < 0.06 || Math.abs(((f * n) % 1) - 1) < 0.06) continue;
        a.boite(0.055, haut - 0.3, 0.016, ROUGE, { x, y: y + 0.18 + (haut - 0.3) / 2, z, ry: ang, trait: false });
      }
      if (mur) monde.mur(xa, za, xb, zb, 0.3);
    }
  };
  /**
   * Un muret de pierres taillées (石垣), haut de h, le long de pts [[x, z]…] : de gros moellons gris par rangs, son dessus un
   * peu arrondi ; posé dans le sol (son pied 25 cm sous le plus bas du sol le long de lui). Le mur qui arrête suit sa ligne.
   */
  const PIERRES = ['#a9a294', '#9c9586', '#b3ac9d', '#948d7f'];
  const muret = (pts, h = 0.75, { ep = 0.45, mur = true, yAt = null, mousse = true } = {}) => {
    for (let i = 0; i + 1 < pts.length; i++) {
      const [xa, za] = pts[i], [xb, zb] = pts[i + 1], l = Math.hypot(xb - xa, zb - za), ang = Math.atan2(xb - xa, zb - za), a = morceau((xa + xb) / 2, (za + zb) / 2, 40);
      const n = Math.max(1, Math.round(l / 0.9));
      for (let k = 0; k < n; k++) {
        // (chaque tronçon de 90 cm : posé au plus bas du sol sous lui ; un sur deux 1 cm plus épais : bout à bout, pas dans le même plan)
        const f0 = k / n, f1 = (k + 1) / n, xm = xa + (xb - xa) * (f0 + f1) / 2, zm = za + (zb - za) * (f0 + f1) / 2;
        const sol = (f) => (yAt ? yAt(xa + (xb - xa) * f, za + (zb - za) * f) : terrain(xa + (xb - xa) * f, za + (zb - za) * f));
        const bas = Math.min(sol(f0), sol(f1), sol((f0 + f1) / 2)) - 0.25, haut = Math.max(sol(f0), sol(f1), sol((f0 + f1) / 2)) + h + (k % 2) * 0.012;
        a.piece(new THREE.BoxGeometry(l / n + 0.02, 1, ep + (k % 2) * 0.012, 2, 3, 1), PIERRES[0], {
          x: xm, y: (bas + haut) / 2, z: zm, ry: ang + PI / 2, sy: haut - bas, nuance: 0.07,
          teinte: (wx, wy, wz) => (mousse && wy > haut - 0.08 ? '#7d8a5a' : PIERRES[Math.floor(hasard(Math.floor(wx * 1.4 + wz * 1.4), Math.floor((wy - bas) * 3.2)) * PIERRES.length)]),
        });
      }
      if (mur) monde.mur(xa, za, xb, zb, ep / 2 + 0.27);
    }
  };
  /**
   * Une lanterne de pierre (石灯籠) d'environ 2,1 m (s = 1) en x, z, sur le sol y, tournée de ry : le socle, la colonne, le
   * plateau, la cage du feu (ses fenêtres de papier, allumées la nuit ; lune : une fenêtre ronde comme une phase de lune, celles
   * des seigneurs Itō), le toit aux coins relevés, le bouton. blanche : peinte en blanc (les lanternes de la grotte).
   */
  const lanternePierre = (a, x, z, y, s = 1, { ry = 0, blanche = false, lune = null, allumee = true } = {}) => {
    const C1 = blanche ? '#eeebe4' : P.pierre, C2 = blanche ? '#dedad0' : P.pierreFonce, R = repere(x, z, ry);
    a.boite(0.62 * s, 0.22 * s, 0.62 * s, C2, R(0, y + 0.11 * s, 0)).boite(0.5 * s, 0.12 * s, 0.5 * s, C1, R(0, y + 0.28 * s, 0))
      .cylindre(0.14 * s, 0.16 * s, 0.75 * s, 8, C1, R(0, y + 0.715 * s, 0)).boite(0.5 * s, 0.13 * s, 0.5 * s, C2, R(0, y + 1.15 * s, 0))
      .boite(0.36 * s, 0.38 * s, 0.36 * s, C1, R(0, y + 1.405 * s, 0));
    // les fenêtres du feu, devant et derrière (une ronde ou une lune, ou carrée), 1 cm devant la cage
    for (const sens of [1, -1]) {
      const q = R(0, y + 1.405 * s, sens * (0.18 * s + 0.012));
      if (lune === null) a.boite(0.2 * s, 0.22 * s, 0.01, P.fenetre, { ...q, trait: false });
      else {
        // (la lune : un disque de papier, mangé par un disque de la couleur de la pierre, décalé selon la phase ; 1,2 cm l'un devant
        // l'autre : à 3 mm, ils scintillaient)
        a.piece(new THREE.CircleGeometry(0.1 * s, 16), P.fenetre, { ...q, ry: q.ry + (sens < 0 ? PI : 0), trait: false });
        if (lune > 0) a.piece(new THREE.CircleGeometry(0.1 * s, 16), C1, { ...R(lune * 0.11 * s * sens, y + 1.405 * s, sens * (0.18 * s + 0.024)), ry: q.ry + (sens < 0 ? PI : 0), trait: false });
      }
    }
    a.toitJapon(0.78 * s, 0.78 * s, 0.24 * s, 0.12, { ...R(0, y + 1.6 * s, 0), tuile: C1, tuile2: C2, bord: C2, rangs: 6, releve: 0.05 * s, epaisseur: 0.04 * s })
      .boite(0.33 * s, 0.05 * s, 0.33 * s, C2, R(0, y + 1.61 * s, 0, { trait: false }))
      .boule(0.07 * s, C1, R(0, y + 1.92 * s, 0), 1).cone(0.035 * s, 0.09 * s, 8, C1, R(0, y + 2.02 * s, 0));
    if (allumee) lumieres.push({ x, y: y + 1.4 * s, z, halo: 0.36, sol: y, r: 2.4 });
    monde.cercle(x, z, 0.32 * s + 0.27);
  };
  // la couleur du cuivre vert-de-gris (緑青) des toits du sanctuaire, ses bords ; l'or des ornements ; le blanc des pignons
  const CUIVRE = '#5f9c8c', CUIVRE2 = '#6eab9a', CUIVRE_F = '#3f7366', OR = '#e2b546', BLANC_PIGNON = '#f3eee2', LAQUE_BOIS = '#7a2c22';

  // ---------------------------------------------------------------- Le sanctuaire (本殿) dans la grotte
  // Le grand sanctuaire vermillon d'Udo (八棟造, « aux huit faîtes ») : un socle de pierre, un plancher sur pilotis et sa galerie
  // tout autour, une balustrade rouge aux boutons dorés ; le corps aux portes à treillis, le bandeau blanc des sculptures peintes ;
  // le grand toit de cuivre vert (入母屋), son pignon triangulaire (千鳥破風) sur le devant, le porche au toit ondulé (唐破風) sur
  // l'escalier ; dessous, la cloche et sa corde, le tronc des offrandes au blason d'or, deux lanternes rouges ; le tambour dans la
  // galerie. Tourné vers la mer (l'est), au milieu de la grotte ; on en fait le tour par derrière.
  {
    const a = atelier(), ry = PI / 2, R = repere(HONDEN.x, HONDEN.z, ry), y = Y_T;
    const W = HONDEN.lz, D = HONDEN.lx, F = y + 0.95, HB = 3.0, wb = W - 2.0, db = D - 2.0;
    // le socle de pierre ; les pilotis sous le plancher (au bord de la galerie et sous le corps) ; le plancher et sa bordure rouge
    a.boite(W + 0.7, 0.4, D + 0.7, P.pierreFonce, R(0, y + 0.12, 0, { nuance: 0.05 }));
    for (const [u, v] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) a.boite(0.2, F - y - 0.3, 0.2, ROUGE, R(u * (W / 2 - 0.15), (F + y) / 2 + 0.05, v * (D / 2 - 0.15)));
    for (let k = 1; k < 7; k++) for (const v of [-1, 1]) a.boite(0.16, F - y - 0.3, 0.16, ROUGE_F, R(-W / 2 + 0.15 + (k * (W - 0.3)) / 7, (F + y) / 2 + 0.05, v * (D / 2 - 0.15)));
    a.boite(W - 0.3, F - y - 0.32, D - 0.3, '#3a2a24', R(0, (F + y) / 2 + 0.06, 0, { trait: false }));
    a.boite(W, 0.1, D, '#8a6248', R(0, F - 0.05, 0, { nuance: 0.04 })).boite(W + 0.04, 0.16, D + 0.04, ROUGE, R(0, F - 0.15, 0));
    for (let k = 0; k < 13; k++) a.boite(0.012, 0.004, D - 0.1, '#6f4e3a', R(-W / 2 + 0.4 + k * ((W - 0.8) / 12), F + 0.002, 0, { trait: false }));
    // le corps : des poteaux ronds vermillon à chaque travée ; en bas les portes à treillis (sombres, leur grille), au milieu de
    // la façade la porte ouverte sur le dedans (le miroir d'or, deux lampes) ; en haut le bandeau blanc et ses sculptures peintes
    const travees = (de, a2, fixe, axe, nb, devant) => {
      for (let k = 0; k <= nb; k++) {
        const t = de + ((a2 - de) * k) / nb, q = axe === 'x' ? R(t, F + HB / 2, fixe) : R(fixe, F + HB / 2, t);
        a.cylindre(0.12, 0.13, HB, 10, ROUGE, q);
      }
      for (let k = 0; k < nb; k++) {
        const t0 = de + ((a2 - de) * k) / nb, t1 = de + ((a2 - de) * (k + 1)) / nb, tm = (t0 + t1) / 2, l = Math.abs(t1 - t0) - 0.26;
        const ouverte = devant && k === Math.floor(nb / 2);
        const pose = (lt, yy, h2, avance, c, o = {}) => a.boite(axe === 'x' ? lt : 0.04, h2, axe === 'x' ? 0.04 : lt, c, axe === 'x' ? R(tm, yy, fixe + avance, o) : R(fixe + avance, yy, tm, o));
        const sg = Math.sign(fixe) || 1;
        if (ouverte) {
          pose(l, F + 1.1, 2.2, -sg * 0.25, '#2a1e18', { trait: false });
        } else {
          pose(l, F + 1.1, 2.2, 0, LAQUE_BOIS, { nuance: 0.03 });
          for (let r = 1; r < 6; r++) pose(l, F + 0.1 + r * 0.38, 0.03, sg * 0.024, '#3a1a14', { trait: false });
          for (let c2 = 1; c2 < 4; c2++) a.boite(axe === 'x' ? 0.03 : 0.012, 2.1, axe === 'x' ? 0.012 : 0.03, '#3a1a14', axe === 'x' ? R(t0 + 0.13 + (c2 * l) / 4, F + 1.12, fixe + sg * 0.024, { trait: false }) : R(fixe + sg * 0.024, F + 1.12, t0 + 0.13 + (c2 * l) / 4, { trait: false }));
          // (les ferrures d'or des portes)
          pose(0.14, F + 1.1, 0.06, sg * 0.03, OR, { trait: false });
        }
        // le bandeau du haut : blanc, une sculpture peinte au milieu de chaque travée (vert, bleu, or)
        pose(l, F + 2.62, 0.7, 0, BLANC_PIGNON, { nuance: 0.02 });
        const deco = ['#3f8a6a', '#3a6aa8', OR, '#c8402c'][k % 4];
        pose(Math.min(0.9, l * 0.6), F + 2.62, 0.36, sg * 0.03, deco, { trait: false });
        pose(Math.min(0.5, l * 0.35), F + 2.62, 0.18, sg * 0.05, ['#e8c060', '#f4efe2', '#3f8a6a', OR][k % 4], { trait: false });
      }
    };
    travees(-wb / 2, wb / 2, db / 2, 'x', 5, true);
    travees(-wb / 2, wb / 2, -db / 2, 'x', 4, false);
    travees(-db / 2, db / 2, wb / 2, 'z', 3, false);
    travees(-db / 2, db / 2, -wb / 2, 'z', 3, false);
    // dedans, par la porte ouverte : le miroir d'or (神鏡) sur son pied, deux lampes, les rideaux blancs
    a.cylindre(0.24, 0.24, 0.04, 20, OR, R(0, F + 1.2, db / 2 - 0.9, { rx: PI / 2 })).boite(0.06, 0.9, 0.06, '#2a1e18', R(0, F + 0.5, db / 2 - 0.92, { trait: false }));
    for (const u of [-0.7, 0.7]) { a.cylindre(0.06, 0.08, 0.5, 8, OR, R(u, F + 0.25, db / 2 - 0.8, { trait: false })); lumieres.push({ ...R(u, F + 0.6, db / 2 - 0.8), halo: 0, sol: F, r: 1.6, c: '#ffd890', jour: true }); }
    // la poutre du haut, vermillon ; le bandeau des consoles (組物) : des blocs verts, bleus et or sous l'avant-toit
    a.boite(wb + 0.4, 0.22, 0.3, ROUGE, R(0, F + HB + 0.02, db / 2)).boite(wb + 0.4, 0.22, 0.3, ROUGE, R(0, F + HB + 0.02, -db / 2))
      .boite(0.3, 0.22, db + 0.4, ROUGE, R(wb / 2, F + HB + 0.02, 0)).boite(0.3, 0.22, db + 0.4, ROUGE, R(-wb / 2, F + HB + 0.02, 0));
    for (let k = 0; k <= 14; k++) for (const v of [-1, 1]) {
      const lx = -wb / 2 + (k * wb) / 14;
      a.boite(0.2, 0.18, 0.34, k % 2 ? '#3f8a6a' : '#3a6aa8', R(lx, F + HB + 0.22, v * (db / 2 + 0.1))).boite(0.24, 0.06, 0.4, OR, R(lx, F + HB + 0.34, v * (db / 2 + 0.12), { trait: false }));
    }
    for (let k = 0; k <= 9; k++) for (const u of [-1, 1]) a.boite(0.34, 0.18, 0.2, k % 2 ? '#3f8a6a' : '#3a6aa8', R(u * (wb / 2 + 0.1), F + HB + 0.22, -db / 2 + (k * db) / 9));
    // la balustrade (高欄) au bord de la galerie : des poteaux rouges, deux lisses, des boutons dorés (擬宝珠) aux coins ; ouverte
    // devant, au milieu, pour l'escalier
    {
      const yb = F, Hb = 0.78, bord = (lx0, lz0, lx1, lz1) => {
        const l = Math.hypot(lx1 - lx0, lz1 - lz0), n = Math.max(1, Math.round(l / 1.2));
        const q0 = R(lx0, yb, lz0), q1 = R(lx1, yb, lz1);
        a.baton([q0.x, yb + Hb, q0.z], [q1.x, yb + Hb, q1.z], 0.035, ROUGE, 6).baton([q0.x, yb + 0.36, q0.z], [q1.x, yb + 0.36, q1.z], 0.025, ROUGE, 5);
        for (let k = 0; k <= n; k++) { const t = k / n, q = R(lx0 + (lx1 - lx0) * t, yb + Hb / 2, lz0 + (lz1 - lz0) * t); a.boite(0.08, Hb, 0.08, ROUGE, q); }
      };
      const ex = W / 2 - 0.08, ez = D / 2 - 0.08, ouv = 1.2;
      bord(-ex, ez, -ouv, ez); bord(ouv, ez, ex, ez); bord(-ex, -ez, ex, -ez); bord(-ex, -ez, -ex, ez); bord(ex, -ez, ex, ez);
      for (const [u, v] of [[-ex, ez], [ex, ez], [-ex, -ez], [ex, -ez], [-ouv, ez], [ouv, ez]]) a.boule(0.07, OR, R(u, yb + Hb + 0.08, v), 1).cone(0.03, 0.08, 8, OR, R(u, yb + Hb + 0.18, v));
    }
    // l'escalier de bois (階) devant, au milieu : six marches, leurs limons rouges
    {
      const n = 6, lz0 = D / 2, prof = 1.7, larg = 2.3;
      for (let k = 0; k < n; k++) {
        const yy = y + ((F - y) * (k + 1)) / (n + 1), lz = lz0 + prof - ((k + 0.5) * prof) / n;
        a.boite(larg, 0.06, prof / n + 0.04, '#8a6248', R(0, yy - 0.03, lz)).boite(larg, yy - y - 0.06, 0.03, '#5a3a2c', R(0, (yy + y) / 2 - 0.03, lz + prof / n / 2, { trait: false }));
      }
      for (const u of [-1, 1]) {
        const q0 = R(u * (larg / 2 + 0.06), y + 0.05, lz0 + prof + 0.05), q1 = R(u * (larg / 2 + 0.06), F, lz0);
        a.baton([q0.x, q0.y, q0.z], [q1.x, q1.y + 0.05, q1.z], 0.08, ROUGE, 4);
      }
      // (on n'y monte pas : on prie devant le tronc, au pied de l'escalier ; l'escalier et le porche, un bloc plein)
      const qa = R(-larg / 2 - 0.62, 0, lz0), qb = R(larg / 2 + 0.62, 0, lz0 + prof + 0.27);
      monde.surface(Math.min(qa.x, qb.x), Math.max(qa.x, qb.x), Math.min(qa.z, qb.z), Math.max(qa.z, qb.z), F + 2, { plein: true });
    }
    // le porche (向拝) : deux poteaux devant l'escalier, une poutre ; son toit ondulé (唐破風) de cuivre, son bord blanc et or
    {
      const pz = D / 2 + 1.55, PX = 1.35, HP = F - y + HB - 0.2;
      for (const u of [-1, 1]) a.cylindre(0.12, 0.13, HP, 10, ROUGE, R(u * PX, y + HP / 2, pz)).boite(0.3, 0.12, 0.3, P.pierreFonce, R(u * PX, y + 0.06, pz));
      a.boite(2 * PX + 0.5, 0.26, 0.3, ROUGE, R(0, y + HP - 0.05, pz)).boite(0.24, 0.26, pz - db / 2, ROUGE, R(-PX, y + HP - 0.05, (pz + db / 2) / 2)).boite(0.24, 0.26, pz - db / 2, ROUGE, R(PX, y + HP - 0.05, (pz + db / 2) / 2));
      // (le toit : un pan bombé de l'avant vers le grand toit ; sa face avant ondule, haute au milieu, creuse vers les bouts)
      const L2 = 2 * PX + 1.1, prof = pz - db / 2 + 1.0, onde = (u) => 0.5 * Math.max(0, 1 - u * u) ** 1.6 - 0.06 * u * u;
      a.piece(new THREE.BoxGeometry(1, 1, 1, 16, 1, 6), CUIVRE, {
        ...R(0, y + HP + 0.25, (pz + db / 2) / 2 + 0.35),
        deformer: (px, py, pz2) => { const u = px * 2, v = pz2 + 0.5; return [px * L2, py * 0.12 + onde(u) * (0.55 + 0.45 * v) + (1 - v) * 0.55, pz2 * prof]; },
        teinte: (wx, wy, wz) => (wy > y + HP + 0.25 + 0.04 ? CUIVRE : CUIVRE_F), nuance: 0.03,
      });
      // le bord blanc et or de l'onde (破風板), devant
      for (let k = 0; k < 16; k++) {
        const u0 = -1 + k / 8, u1 = u0 + 1 / 8, q0 = R((u0 * L2) / 2, y + HP + 0.25 + onde(u0) + 0.02, pz + 0.95), q1 = R((u1 * L2) / 2, y + HP + 0.25 + onde(u1) + 0.02, pz + 0.95);
        a.baton([q0.x, q0.y, q0.z], [q1.x, q1.y, q1.z], 0.07, BLANC_PIGNON, 4, { trait: false });
      }
      a.boule(0.12, OR, R(0, y + HP + 0.25 + onde(0) + 0.06, pz + 1.0), 1);
      // la cloche (鈴) et sa corde rouge et blanche ; deux lanternes rouges aux poteaux
      const c0 = R(0, y + HP - 0.25, pz - 0.05), c1 = R(0, y + 0.95, pz - 0.05);
      a.boule(0.13, OR, R(0, y + HP - 0.35, pz - 0.05), 1).baton([c0.x, y + HP - 0.45, c0.z], [c1.x, c1.y, c1.z], 0.035, '#c8302c', 6);
      for (let yb = y + 1.05; yb < y + HP - 0.55; yb += 0.18) a.cylindre(0.04, 0.04, 0.045, 6, '#f4f0e6', R(0, yb, pz - 0.05, { trait: false }));
      for (const u of [-1, 1]) {
        const q = R(u * (PX + 0.45), y + HP - 0.6, pz);
        a.chochin(q.x, q.y, q.z, 5.5);
        lumieres.push({ x: q.x, y: q.y, z: q.z, halo: 0.34, sol: y, r: 2.4, c: '#ff9a6a' });
      }
      // le tronc des offrandes (賽銭箱) au pied de l'escalier : la caisse vermillon, le blason d'or, la grille du dessus
      const zt = D / 2 + 2.15;
      a.boite(1.6, 0.62, 0.62, ROUGE, R(0, y + 0.31, zt, { nuance: 0.03 })).boite(1.68, 0.06, 0.7, P.boisNoir, R(0, y + 0.65, zt));
      for (let k = -3; k <= 3; k++) a.pignon(1.5, 0.06, 0.07, '#5a3a2c', R(0, y + 0.68, zt + k * 0.085, { rx: PI, trait: false }));
      a.cylindre(0.16, 0.16, 0.02, 20, OR, R(0, y + 0.34, zt + 0.32, { rx: PI / 2, trait: false }));
      murRect(repere(R(0, 0, zt).x, R(0, 0, zt).z, ry), 0.8, 0.31);
    }
    // le grand toit (入母屋) : quatre pans de cuivre vert, et en haut, les deux pignons blancs aux ornements d'or ; le faîtage, ses
    // bouts d'or ; le pignon triangulaire (千鳥破風) sur le pan de devant
    {
      const yt = F + HB + 0.42;
      a.toitJapon(W + 1.9, D + 1.7, 2.3, 0.42, { ...R(0, yt, 0), tuile: CUIVRE, tuile2: CUIVRE2, bord: CUIVRE_F, avant: BLANC_PIGNON, rangs: 26, releve: 0.32, epaisseur: 0.08 });
      // (les deux pans du haut : deux plaques qui dépassent les pignons de 25 cm, les pignons blancs en retrait dessous)
      const lt = (W + 1.9) * 0.42, pt = (D + 1.7) * 0.42, hg = 1.25, ang = Math.atan2(hg, pt / 2), Lp = Math.hypot(hg, pt / 2) + 0.25, yh = yt + 2.26;
      for (const sens of [1, -1]) a.boite(lt + 0.5, 0.1, Lp, CUIVRE, R(0, yh + hg / 2 + 0.02, sens * (pt / 4 + 0.05), { rx: sens * ang, nuance: 0.03 }));
      for (const u of [-1, 1]) {
        a.pignon(0.05, hg - 0.06, pt - 0.12, BLANC_PIGNON, R(u * (lt / 2 - 0.05), yh, 0));
        a.cylindre(0.18, 0.18, 0.03, 16, OR, R(u * (lt / 2 - 0.02), yh + 0.48, 0, { rz: PI / 2, trait: false }));
      }
      a.boite(lt + 0.7, 0.2, 0.3, '#2f4a42', R(0, yh + hg + 0.1, 0));
      for (const u of [-1, 1]) a.boite(0.16, 0.42, 0.42, OR, R(u * (lt / 2 + 0.36), yh + hg + 0.14, 0));
      // le pignon triangulaire sur le devant (son triangle blanc, son ornement d'or, ses deux petits pans)
      // (son bord de devant posé sur le pan, à 75 cm au-dessus du bord du toit ; il rentre dans le pan derrière)
      const zc = 2.5, yc = yt + 0.75;
      a.pignon(1.8, 1.1, 2.9, CUIVRE, R(0, yc, zc - 0.2, { ry: PI / 2 }));
      a.pignon(0.05, 0.98, 2.7, BLANC_PIGNON, R(0, yc + 0.03, zc + 0.72, { ry: PI / 2 }));
      a.cylindre(0.2, 0.2, 0.03, 18, OR, R(0, yc + 0.42, zc + 0.76, { rx: PI / 2, trait: false }));
    }
    // le grand tambour (太鼓) sur son support, dans la galerie, au coin sud de la façade
    {
      const q = R(-W / 2 + 0.75, F + 0.95, D / 2 - 0.55);
      a.cylindre(0.5, 0.5, 0.55, 18, '#8a3a2a', { ...q, rz: PI / 2 }).cylindre(0.46, 0.46, 0.56, 18, '#efe2c4', { ...q, rz: PI / 2, trait: false });
      a.boite(0.08, 0.95, 0.5, P.boisNoir, R(-W / 2 + 0.45, F + 0.47, D / 2 - 0.55)).boite(0.08, 0.95, 0.5, P.boisNoir, R(-W / 2 + 1.05, F + 0.47, D / 2 - 0.55));
    }
    poser(a.fin(), 0, 0, { y: 0 });
    // (le sanctuaire : un bloc plein, 27 cm au-delà de son socle, sauf l'escalier et le tronc devant ; un bloc pour la caméra)
    {
      const C = [R(-W / 2 - 0.62, 0, -D / 2 - 0.62), R(W / 2 + 0.62, 0, D / 2 + 0.62)];
      monde.surface(Math.min(C[0].x, C[1].x), Math.max(C[0].x, C[1].x), Math.min(C[0].z, C[1].z), Math.max(C[0].z, C[1].z), F + HB + 4, { plein: true });
      monde.bloc(Math.min(C[0].x, C[1].x) + 0.3, Math.max(C[0].x, C[1].x) - 0.3, Math.min(C[0].z, C[1].z) + 0.3, Math.max(C[0].z, C[1].z) - 0.3, y - 1, F + HB + 3.6);
    }
  }

  // ---------------------------------------------------------------- Dans la grotte : le torii, les rochers de la mère, le lapin
  // le torii vermillon à la bouche de la grotte (明神鳥居 : le linteau du haut noir, ses bouts relevés ; la corde sacrée et ses
  // papiers sous la traverse), les deux lanternes blanches dedans, le petit sanctuaire du prince, le bureau des porte-bonheur
  {
    const a = atelier(), T = TORII_GROTTE, R = repere(T.x, GROTTE.z, PI / 2), y = Y_T, X = T.demi, H = T.h;
    for (const u of [-1, 1]) {
      a.cylindre(0.15, 0.17, H - 0.3, 12, ROUGE, R(u * X, y + 0.3 + (H - 0.3) / 2, 0)).cylindre(0.21, 0.22, 0.36, 12, P.noir, R(u * X, y + 0.18, 0));
      monde.cercle(R(u * X, 0, 0).x, R(u * X, 0, 0).z, 0.45);
    }
    a.boite(2 * X + 0.7, 0.2, 0.18, ROUGE, R(0, y + H - 0.78, 0)).boite(2 * X + 1.1, 0.22, 0.26, ROUGE, R(0, y + H - 0.08, 0));
    const releve = (lx, ly, lz, k) => [lx, ly + k * (lx / (X + 0.95)) ** 2, lz];
    a.piece(new THREE.BoxGeometry(2 * X + 1.9, 0.18, 0.34, 14, 1, 1), P.noir, { ...R(0, y + H + 0.12, 0), deformer: (lx, ly, lz) => releve(lx, ly, lz, 0.22) });
    a.boite(0.2, 0.62, 0.16, ROUGE, R(0, y + H - 0.44, 0)).boite(0.44, 0.56, 0.05, '#2a2420', R(0, y + H - 0.44, 0.1));
    ecrire({ x: T.x, y, z: GROTTE.z, ry: PI / 2 }, { texte: '鵜戸神宮', vertical: true, x: 0, y: H - 0.44, z: 0.128, l: 0.32, h: 0.5, fond: null, encre: '#e8c25a' });
    const T3 = (lx, ly) => { const p = R(lx, ly, 0.16); return [p.x, p.y, p.z]; };
    a.tube([T3(-X + 0.1, y + H - 1.0), T3(-X * 0.5, y + H - 1.16), T3(0, y + H - 1.2), T3(X * 0.5, y + H - 1.16), T3(X - 0.1, y + H - 1.0)], 0.055, '#d8c48a', { cotes: 7, pas: 18 });
    for (const lx of [-X * 0.6, -X * 0.2, X * 0.2, X * 0.6]) for (let k = 0; k < 3; k++) a.boite(0.07, 0.09, 0.006, '#fbfaf4', R(lx + (k % 2 ? 0.03 : -0.03), y + H - 1.28 - k * 0.08, 0.2, { rz: k % 2 ? -0.3 : 0.3, trait: false }));
    poser(a.fin(), 0, 0, { y: 0 });
  }
  {
    const a = atelier();
    // les deux lanternes blanches du parvis de la grotte
    for (const dz of [-3.6, 3.6]) lanternePierre(a, X_SALLE - 1.6, GROTTE.z + dz, Y_T, 0.95, { blanche: true });
    // le petit sanctuaire du prince (皇子神社) : une maison vermillon sur son socle de pierre, son toit de cuivre, tournée vers le
    // nord (vers le grand sanctuaire), ses deux lanternes rouges
    {
      const R = repere(OJI.x, OJI.z, PI), y = Y_T;
      a.boite(2.2, 0.32, 1.9, P.pierreFonce, R(0, y + 0.16, 0)).boite(1.6, 1.5, 1.3, ROUGE, R(0, y + 1.07, 0)).boite(1.4, 1.2, 0.04, LAQUE_BOIS, R(0, y + 1.0, 0.66));
      for (let k = 0; k < 4; k++) a.boite(0.03, 1.1, 0.012, '#3a1a14', R(-0.5 + k * 0.33, y + 1.0, 0.685, { trait: false }));
      a.boite(1.8, 0.3, 1.5, BLANC_PIGNON, R(0, y + 1.95, 0, { nuance: 0.02 }));
      a.toitJapon(2.6, 2.3, 0.9, 0.3, { ...R(0, y + 2.08, 0), tuile: CUIVRE, tuile2: CUIVRE2, bord: CUIVRE_F, avant: BLANC_PIGNON, rangs: 10, releve: 0.14 });
      a.boule(0.09, OR, R(0, y + 3.02, 0), 1);
      a.boite(0.7, 0.4, 0.4, ROUGE, R(0, y + 0.2, 1.35)).boite(0.74, 0.04, 0.44, P.boisNoir, R(0, y + 0.42, 1.35));
      murRect(R, 1.1, 0.95);
      { const q = R(0, 0, 1.35); murRect(repere(q.x, q.z, PI), 0.37, 0.22); }
      for (const u of [-1, 1]) { const q = R(u * 0.75, y + 1.95, 0.85); a.chochin(q.x, q.y, q.z, 4); lumieres.push({ x: q.x, y: q.y, z: q.z, halo: 0.28, sol: y, r: 1.8, c: '#ff9a6a' }); }
    }
    // le bureau des porte-bonheur de la grotte : une cabane de planches au toit de cuivre, son guichet tourné vers le sud, les
    // porte-bonheur et les plaquettes en lapin sur le comptoir
    {
      const C = CABANE, R = repere(C.x, C.z, 0), y = Y_T;
      a.boite(C.l, 2.3, C.p, '#8a6a4e', R(0, y + 1.15, 0, { nuance: 0.05 }));
      for (let k = 0; k <= 8; k++) a.boite(0.02, 2.3, 0.012, '#6a503a', R(-C.l / 2 + 0.2 + k * ((C.l - 0.4) / 8), y + 1.15, C.p / 2 + 0.006, { trait: false }));
      a.boite(2.2, 0.9, 0.04, '#2a2420', R(0, y + 1.45, C.p / 2 + 0.02, { trait: false })).boite(2.5, 0.08, 0.5, P.bois, R(0, y + 0.98, C.p / 2 + 0.22));
      for (let k = 0; k < 6; k++) a.boite(0.08, 0.12, 0.015, k % 2 ? '#c8402c' : '#f6f3ea', R(-0.8 + k * 0.32, y + 1.08, C.p / 2 + 0.2, { rx: -0.3, trait: false }));
      a.toitJapon(C.l + 0.8, C.p + 0.9, 0.7, 0.25, { ...R(0, y + 2.3, 0), tuile: CUIVRE, tuile2: CUIVRE2, bord: CUIVRE_F, rangs: 9, releve: 0.08 });
      a.boite(1.4, 0.3, 0.04, P.bois, R(0, y + 2.1, C.p / 2 + 0.03));
      ecrire({ ...R(0, y, C.p / 2 + 0.052), ry: 0 }, { texte: '授与所', x: 0, y: 2.1, z: 0, l: 1.1, h: 0.24, fond: null, encre: '#2a2420' });
      monde.surface(C.x - C.l / 2 - 0.27, C.x + C.l / 2 + 0.27, C.z - C.p / 2 - 0.27, C.z + C.p / 2 + 0.52, y + 3, { plein: true });
      monde.bloc(C.x - C.l / 2, C.x + C.l / 2, C.z - C.p / 2, C.z + C.p / 2, y - 1, y + 3.1);
      lumieres.push({ ...R(0, y + 1.9, C.p / 2 + 0.6), halo: 0, sol: y, r: 2.2, c: '#ffe2b0', jour: true });
    }
    poser(a.fin(), 0, 0, { y: 0 });
  }
  // les rochers de la mère (お乳岩), au fond de la grotte, derrière le sanctuaire : deux rondeurs de roche qui sortent de la paroi,
  // d'où suinte l'eau, le petit bassin de pierre où tombent les gouttes, la corde sacrée au-dessus
  const goutte = (() => {
    const a = atelier(), x = OCHICHI.x - 1.15, z = OCHICHI.z, y = Y_T;
    // la paroi du fond, là (x de la paroi − x, selon dz) : mesurée par des rayons vers −x (elle penche un peu, et se creuse au sud).
    // Les rondeurs ont leur centre sur elle : la moitié dans la roche. (Le 2026-10-30, elles étaient posées devant, ne la touchant
    // qu'en un point, aplaties, d'une seule couleur, avec deux « traînées » debout 20 cm devant la roche : deux disques sur des
    // bâtons.)
    const FOND = [[-1.1, 0.29], [-0.7, 0.235], [-0.42, 0.195], [0, 0.135], [0.42, 0.075], [0.7, 0.065], [1.1, 0.115]];
    const xFond = (dz) => {
      let k = 0;
      while (k < FOND.length - 2 && dz > FOND[k + 1][0]) k++;
      const [d0, x0] = FOND[k], [d1, x1] = FOND[k + 1], f = Math.min(1, Math.max(0, (dz - d0) / (d1 - d0)));
      return x + x0 + (x1 - x0) * f;
    };
    // (plus claires en haut, mouillées et sombres en bas : la lumière de la grotte, plate, n'en donnait pas le volume)
    const roche = (cx, cy, cz) => (cy > y + 1.66 ? '#7f796c' : cy > y + 1.42 ? '#6e685c' : cy > y + 1.24 ? '#5f5a50' : '#524e46');
    const tetons = [];
    for (const dz of [-0.34, 0.34]) {
      const xf = xFond(dz);
      a.piece(new THREE.SphereGeometry(0.42, 22, 14), '#6e685c', {
        x: xf, y: y + 1.5, z: z + dz, sx: 0.9, sy: 0.95, sz: 0.95, nuance: 0.03, teinte: roche,
        // (un peu tombantes : plus pleines en bas)
        deformer: (px, py, pz) => [px * (1 + 0.16 * Math.max(0, -py / 0.42)), py, pz],
      });
      const q = [xf + 0.36, y + 1.29, z + dz];
      a.ovale(0.055, '#4a463f', { x: q[0], y: q[1], z: q[2], sx: 0.8 }, 8);
      tetons.push(q);
    }
    // le bassin, sous les deux tétons (son bord à 2 cm de la paroi)
    const xb = x + 0.6;
    // (l'eau 1,2 cm au-dessus de la pierre : à sa hauteur, elle scintillait en étoile)
    a.cylindre(0.44, 0.38, 0.42, 16, P.pierre, { x: xb, y: y + 0.21, z }).cylindre(0.36, 0.36, 0.02, 16, '#5aa0a8', { x: xb, y: y + 0.422, z, trait: false, nuance: 0 });
    // la corde sacrée, tendue contre la paroi, ses papiers pliés
    const T3 = (dz, yy) => [xFond(dz) + 0.09, yy, z + dz];
    a.tube([T3(-1.1, y + 2.45), T3(-0.5, y + 2.25), T3(0, y + 2.2), T3(0.5, y + 2.25), T3(1.1, y + 2.45)], 0.045, '#d8c48a', { cotes: 7, pas: 14 });
    for (const dz of [-0.6, 0, 0.6]) for (let k = 0; k < 3; k++) a.boite(0.006, 0.08, 0.06, '#fbfaf4', { x: xFond(dz) + 0.13, y: y + 2.12 - k * 0.07, z: z + dz + (k % 2 ? 0.025 : -0.025), rx: k % 2 ? -0.3 : 0.3, trait: false });
    // (un rond autour du bassin rond : les coins d'un carré arrêtaient à 60 cm de son bord)
    monde.cercle(xb, z, 0.71);
    poser(a.fin(), 0, 0, { y: 0 });
    // une goutte qui tombe de temps en temps de chaque téton dans le bassin, l'un après l'autre
    const objet = new THREE.Group();
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), new THREE.MeshBasicMaterial({ color: '#cfe8ef' }));
    objet.add(m);
    let t = 0;
    return { objet, maj(dt) {
      t = (t + dt) % 2.8;
      const k = t < 1.4 ? 0 : 1, u = t - 1.4 * k, f = Math.min(1, u / 0.45), [qx, qy, qz] = tetons[k];
      m.visible = u < 0.45;
      m.position.set(qx, qy - 0.06 - (qy - 0.06 - (y + 0.42)) * f * f, qz);
      return [];
    } };
  })();
  animes.push(goutte);
  // le lapin qu'on caresse (撫でうさぎ) : un lapin blanc assis sur son socle, dans une petite clôture rouge, sur un rebord de roche
  // contre la paroi ; son tronc des offrandes, son panneau
  {
    const a = atelier(), R = repere(USAGI.x, USAGI.z, PI), y = Y_T;
    a.boite(2.0, 0.55, 1.5, PIERRES[1], R(0, y + 0.27, 0, { nuance: 0.07 })).boite(0.6, 0.3, 0.5, '#d9d4c8', R(0, y + 0.7, 0));
    const B = '#f4f2ec', yb = y + 0.85;
    a.ovale(0.24, B, R(0, yb + 0.2, -0.04, { sx: 0.95, sy: 0.85, sz: 1.2 }), 12).ovale(0.16, B, R(0, yb + 0.48, 0.12, { sz: 1.05 }), 12);
    for (const u of [-1, 1]) {
      a.ovale(0.06, B, R(u * 0.06, yb + 0.72, 0.06, { sx: 0.6, sy: 2.6, rx: -0.25, rz: u * 0.12 }), 8).ovale(0.035, '#f0b4b4', R(u * 0.06, yb + 0.72, 0.1, { sx: 0.4, sy: 2.2, rx: -0.25, rz: u * 0.12, trait: false }), 6);
      a.boule(0.024, '#c8302c', R(u * 0.075, yb + 0.5, 0.26, { trait: false }), 0);
      a.ovale(0.07, B, R(u * 0.12, yb + 0.06, 0.18, { sz: 1.4, sy: 0.6 }), 8);
    }
    a.boule(0.07, B, R(0, yb + 0.18, -0.32), 1);
    // la petite clôture rouge, ouverte devant ; le tronc des offrandes « 賽銭 » devant elle ; le panneau sur son poteau
    for (const [x0, z0, x1, z1] of [[-0.9, -0.65, 0.9, -0.65], [-0.9, -0.65, -0.9, 0.55], [0.9, -0.65, 0.9, 0.55], [-0.9, 0.55, -0.35, 0.55], [0.35, 0.55, 0.9, 0.55]]) {
      const l = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(l / 0.3)), ang = Math.atan2(x1 - x0, z1 - z0);
      for (let k = 0; k <= n; k++) a.boite(0.05, 0.42, 0.05, ROUGE, R(x0 + ((x1 - x0) * k) / n, y + 0.76, z0 + ((z1 - z0) * k) / n));
      a.boite(0.05, 0.05, l, ROUGE, R((x0 + x1) / 2, y + 0.96, (z0 + z1) / 2, { ry: ang }));
    }
    a.boite(0.5, 0.3, 0.3, ROUGE, R(0, y + 0.15, 1.15)).boite(0.54, 0.04, 0.34, P.boisNoir, R(0, y + 0.32, 1.15));
    ecrire({ ...R(0, y, 1.301), ry: PI }, { texte: '賽銭', x: 0, y: 0.15, z: 0, l: 0.3, h: 0.12, fond: null, encre: '#f3cf6a' });
    a.boite(0.04, 1.3, 0.04, P.boisFonce, R(1.25, y + 0.65, 0.6)).boite(0.36, 0.52, 0.03, '#f4efe2', R(1.25, y + 1.2, 0.62));
    ecrire({ ...R(1.25, y, 0.637), ry: PI }, { texte: '撫でうさぎ', vertical: true, x: 0, y: 1.2, z: 0, l: 0.26, h: 0.46, fond: null, encre: '#2a2420' });
    murRect(R, 1.0, 0.75);
    murRect(repere(R(0, 0, 1.15).x, R(0, 0, 1.15).z, PI), 0.25, 0.15);
    monde.cercle(R(1.25, 0, 0.6).x, R(1.25, 0, 0.6).z, 0.48);
    poser(a.fin(), 0, 0, { y: 0 });
  }
  // la lueur du lapin caressé (il brille un instant)
  const lueurLapin = (() => {
    const objet = new THREE.Group(), R = repere(USAGI.x, USAGI.z, PI);
    const q = R(0, Y_T + 1.25, 0.1);
    const pts = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array([q.x, q.y, q.z]), 3)),
      new THREE.PointsMaterial({ color: '#fff4c8', size: 46, sizeAttenuation: false, map: tacheDouce(THREE, 0.3), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    pts.visible = false;
    objet.add(pts);
    let t = 0;
    return { objet, briller() { t = 1.6; }, maj(dt) { t = Math.max(0, t - dt); pts.visible = t > 0; pts.material.opacity = Math.min(1, t) * (0.7 + 0.3 * Math.sin(t * 12)); return []; } };
  })();
  animes.push(lueurLapin);

  // ---------------------------------------------------------------- La hutte de la naissance (産屋) : le secret des plumes
  // Contre la paroi nord de la grotte, au nord du sanctuaire, au bord du chemin qui en fait le tour : une petite hutte à
  // l'ancienne, ouverte devant : des poteaux de bois brut, un plancher bas, des murs de roseau, un toit à deux pentes dont les
  // chevrons des bouts se croisent au-dessus du faîte, une corde sacrée devant ; dedans, une natte, le berceau de paille et sa
  // petite lampe de papier. Son toit de plumes de cormoran n'est pas fini : les trois rangs du haut manquent, de chaque côté (on
  // voit les perches) : Ugayafukiaezu, « le toit de cormoran pas fini ». Le secret : y rapporter les trois plumes (PLUMES) ;
  // chacune finit un rang, des deux côtés. Le plumage qui manque est un seul maillage, dessiné peu à peu (setDrawRange).
  const hutte = (() => {
    const a = atelier(), R = repere(HUTTE.x, HUTTE.z, 0), y = Y_T;
    const ECORCE = '#6e563e', BOIS = '#a8875e', ROSEAU = '#cdb88a', ROSEAU2 = '#bda677', NATTE = '#d9c48a';
    const BRONZE = ['#62583a', '#544c34', '#5c5a3c', '#47432f'], NOIR = '#1f2422';
    // le plancher (YP), le haut des poteaux (YE), le faîte (YF) ; la pente du toit, de son axe de chevron au faîte jusqu'au bord
    const YP = y + 0.3, YE = y + 1.5, YF = y + 2.36, PENTE = (YF - YE - 0.07) / 0.68, ZB = 0.95, YB = YF + 0.012 - PENTE * ZB;
    const pt = (lx, ly, lz) => { const q = R(lx, ly, lz); return [q.x, q.y, q.z]; };
    // le plancher bas : posé sur les poteaux d'angle (ils le traversent) et deux pieux au milieu ; la natte
    a.boite(2.06, 0.06, 1.36, BOIS, R(0, YP - 0.03, 0, { nuance: 0.06 }));
    for (const v of [-0.6, 0.6]) a.cylindre(0.055, 0.055, YP - 0.06 - y, 8, ECORCE, R(0, y + (YP - 0.06 - y) / 2, v));
    a.boite(1.62, 0.03, 1.02, NATTE, R(-0.05, YP + 0.015, -0.04, { nuance: 0.03 }));
    // les poteaux d'angle, de bois brut ; ceux du faîte, dehors, aux deux bouts ; les poutres du bord, celles des côtés, le faîte
    for (const [u, v] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) a.cylindre(0.062, 0.07, YE + 0.02 - y, 8, ECORCE, R(u * 1.0, y + (YE + 0.02 - y) / 2, v * 0.68, { nuance: 0.07 }));
    for (const u of [-1, 1]) a.cylindre(0.064, 0.072, YF - 0.03 - y, 8, ECORCE, R(u * 1.12, y + (YF - 0.03 - y) / 2, 0, { nuance: 0.07 }));
    for (const v of [-1, 1]) a.baton(pt(-1.24, YE + 0.03, v * 0.68), pt(1.24, YE + 0.03, v * 0.68), 0.05, ECORCE, 7);
    for (const u of [-1, 1]) a.baton(pt(u * 1.0, YE + 0.03, -0.8), pt(u * 1.0, YE + 0.03, 0.8), 0.045, ECORCE, 7);
    a.baton(pt(-1.5, YF + 0.03, 0), pt(1.5, YF + 0.03, 0), 0.062, ECORCE, 8);
    // les chevrons, de chaque côté ; ceux des deux bouts se croisent au-dessus du faîte (comme les huttes d'autrefois)
    for (const u of [-1.27, -0.64, 0, 0.64, 1.27]) {
      for (const s of [-1, 1]) {
        const bout = Math.abs(u) > 1 ? 0.3 : 0;
        a.baton(pt(u, YB, s * ZB), pt(u, YF + 0.012 + PENTE * bout, -s * bout), 0.028, ECORCE, 6);
      }
    }
    // la pente : le point à e (m) au-dessus du bord, en x = lx, h au-dessus de l'axe des chevrons (sur la normale du toit)
    const L = Math.hypot(ZB, PENTE * ZB), cs = 1 / Math.hypot(1, PENTE), sn = PENTE * cs;
    const surPente = (s, e, lx, h) => pt(lx, YB + e * sn + h * cs, s * (ZB - e * cs + h * sn));
    const normale = (s) => [0, cs, s * sn];
    // les rangs de plumes : [pointe, base] le long de la pente, depuis le bord ; une perche sous chaque base
    const RANGS = [0, 0.23, 0.46, 0.69, 0.92, 1.12].map((e) => [e, Math.min(e + 0.36, L + 0.02)]);
    for (const s of [-1, 1]) for (const [, eb] of RANGS.slice(0, 5)) a.baton(surPente(s, eb, -1.42, 0.048), surPente(s, eb, 1.42, 0.048), 0.02, ECORCE, 5);
    const plumes = (b, k, s, sens) => {
      const [et, eb] = RANGS[k], n = 25, pas = 2.76 / n;
      for (let j0 = 0; j0 < n; j0++) {
        const j = sens > 0 ? j0 : n - 1 - j0, lx = -1.38 + (j + 0.5) * pas + (k % 2 ? pas / 2 : 0) - pas / 4, g = hasard(lx * 7.1 + k, s * 3.3);
        plumeCormoran(THREE, b, {
          base: surPente(s, eb, lx, 0.07), pointe: surPente(s, et, lx + (g - 0.5) * 0.02, k ? 0.105 : 0.06), normale: normale(s),
          large: 0.15, epais: 0.012, c: BRONZE[Math.floor(g * 4)], bout: NOIR, roulis: j % 2 ? 0.08 : -0.08, bombe: 0.01,
        });
      }
    };
    // les trois rangs du bas, de chaque côté : déjà là
    for (const s of [-1, 1]) for (const k of [0, 1, 2]) plumes(a, k, s, 1);
    // les murs de roseau (derrière et sur les côtés, jusqu'aux poutres) ; les pignons de roseau au-dessus des côtés
    const roseau = (wx, wy, wz) => (Math.floor((wx + wz) * 26) % 2 ? ROSEAU : ROSEAU2);
    a.piece(new THREE.BoxGeometry(1.94, YE - YP, 0.03, 24, 1, 1), ROSEAU, { ...R(0, (YE + YP) / 2, -0.66), teinte: roseau, nuance: 0.04 });
    for (const u of [-1, 1]) {
      a.piece(new THREE.BoxGeometry(0.03, YE - YP, 1.28, 1, 1, 16), ROSEAU, { ...R(u * 0.985, (YE + YP) / 2, 0), teinte: roseau, nuance: 0.04 });
      a.pignon(0.03, YF - YE - 0.12, 1.3, ROSEAU2, R(u * 0.985, YE + 0.075, 0, { nuance: 0.04 }));
    }
    // la corde sacrée devant, d'un poteau à l'autre, ses papiers pliés
    a.tube([pt(-0.97, YE - 0.1, 0.68), pt(-0.4, YE - 0.2, 0.69), pt(0, YE - 0.22, 0.69), pt(0.4, YE - 0.2, 0.69), pt(0.97, YE - 0.1, 0.68)], 0.032, '#d8c48a', { cotes: 6, pas: 14 });
    for (const lx of [-0.45, 0, 0.45]) for (let k = 0; k < 3; k++) a.boite(0.07, 0.08, 0.006, '#fbfaf4', R(lx + (k % 2 ? 0.025 : -0.025), YE - 0.3 - k * 0.07 + (lx ? 0.02 : 0), 0.7, { rz: k % 2 ? -0.3 : 0.3, trait: false }));
    // le berceau de paille (son drap blanc) ; la petite lampe de papier (andon) dans le coin, toujours allumée : elle éclaire la hutte
    const berceau = R(0.25, YP + 0.03, -0.18);
    a.cylindre(0.2, 0.16, 0.14, 14, '#c9a66a', { ...berceau, y: YP + 0.1, sx: 1.45, nuance: 0.06 }).ovale(0.19, '#f4f2ec', { ...berceau, y: YP + 0.17, sx: 1.45, sy: 0.22 }, 12);
    const andon = R(-0.72, YP + 0.03, -0.42);
    a.boite(0.2, 0.03, 0.2, '#5a4030', { ...andon, y: YP + 0.045 }).boite(0.16, 0.28, 0.16, '#fff1d0', { ...andon, y: YP + 0.2, sorte: 'lampe' })
      .boite(0.2, 0.03, 0.2, '#5a4030', { ...andon, y: YP + 0.355 });
    for (const [u, v] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) a.boite(0.022, 0.31, 0.022, '#5a4030', { ...R(-0.72 + u * 0.085, YP + 0.2, -0.42 + v * 0.085) });
    lumieres.push({ ...R(-0.72, YP + 0.25, -0.42), halo: 0, sol: YP, r: 1.9, c: '#ffd9a0', jour: true });
    // le petit panneau sur son poteau, à côté, tourné vers le chemin : « 産屋 » (la hutte de la naissance)
    a.boite(0.05, 1.3, 0.05, P.boisFonce, R(2.05, y + 0.65, 1.0)).boite(0.34, 0.56, 0.03, '#f4efe2', R(2.05, y + 1.18, 1.03));
    ecrire({ ...R(2.05, y, 1.0465), ry: 0 }, { texte: '産屋', vertical: true, x: 0, y: 1.18, z: 0, l: 0.24, h: 0.44, fond: null, encre: '#2a2420' });
    // on n'y entre pas, ni sous ses bords de toit (le bas du toit, à 1,26 m, est sous la tête du voyageur) : un mur autour, à
    // 30 cm de la tête sous le bord ; le poteau du panneau ; le faîte arrête la caméra
    murRect(R, 1.48, 1.03);
    // (le panneau, 34 cm de large : la tête du voyageur, grosse, y entrait avec un rond de 30 cm)
    monde.cercle(R(2.05, 0, 1.0).x, R(2.05, 0, 1.0).z, 0.48);
    monde.bloc(HUTTE.x - 1.45, HUTTE.x + 1.45, HUTTE.z - 0.95, HUTTE.z + 0.95, y - 1, YF + 0.2);
    poser(a.fin(), 0, 0, { y: 0 });
    // le plumage qui manque : les rangs 3, 4 et 5, chacun de chaque côté (le devant d'ouest en est, puis le derrière d'est en
    // ouest) ; tous les morceaux ont le même nombre de sommets : une plume = PAR sommets
    const b = atelier();
    for (const k of [3, 4, 5]) { plumes(b, k, 1, 1); plumes(b, k, -1, -1); }
    const fb = b.fin(0, false), mb = ctx.maillage(fb), geo = fb.geometrie, PAR = geo.attributes.position.count / 150;
    const objet = new THREE.Group();
    objet.add(mb);
    // l'éclat de la hutte au moment où le toit se finit (une lampe de lueurs.js, rangée sous le sol le reste du temps)
    const eclat = { x: HUTTE.x, y: -500, z: HUTTE.z + 0.2, halo: 0, sol: YP, r: 3.6, c: '#ffe3a8', mobile: true, jour: true };
    lumieres.push(eclat);
    let montre = secretTrouve('plumes') ? 3 : 0, cible = montre, brille = 0;
    // (rien à dessiner : caché, ombre comprise)
    const dessiner = (n) => { geo.setDrawRange(0, Math.round(n * 50) * PAR); mb.visible = n > 0; };
    dessiner(montre);
    return {
      objet,
      // le haut du toit, pour y faire voler les plumes : le milieu du rang k (3 à 5), devant ; le faîte
      rang: (k) => surPente(1, (RANGS[k][0] + RANGS[k][1]) / 2, 0, 0.12),
      faite: pt(0, YF + 0.1, 0),
      devant: R(0, y, 1.75),
      /** Les rangs finis jusqu'à n (1 à 3) : ils se dessinent plume à plume ; se résout une fois fait. */
      finir(n) { cible = n; return new Promise((fin) => { this.fini = fin; }); },
      briller() { brille = 3.2; },
      fini: null,
      maj(dt) {
        if (montre < cible) {
          montre = Math.min(cible, montre + dt / 1.3);
          dessiner(montre);
          if (montre >= cible && this.fini) { const f = this.fini; this.fini = null; f(); }
        }
        // (l'éclat monte de sous le plancher et y redescend : la lumière vient et s'en va en douceur)
        brille = Math.max(0, brille - dt);
        eclat.y = brille > 0 ? YP + 0.9 - 2.6 * (1 - Math.min(1, brille / 0.8, (3.2 - brille) / 0.5)) : -500;
        return [];
      },
    };
  })();
  animes.push(hutte);
  // ---------------------------------------------------------------- Les trois plumes de cormoran (le secret)
  // Par terre, en vue, à côté de là où l'on passe (PLUMES) : de grandes plumes (50 cm : des plumes de 35 cm se perdaient sur les
  // dalles), bronze bordées de noir, leur tige blanche ; au-dessus de chacune, de jour comme de nuit, un halo doré qui respire et
  // une étoile qui scintille, d'une taille fixe à l'écran (vus de loin : comme les pierres d'Ippen de Beppu ; le jour, peints
  // par-dessus et non ajoutés à la lumière : sur les dalles claires, un éclat ajouté ne se voyait plus). Ramassées, ce sont des
  // indices (« plume-p1 »…) : on ne perd rien en rechargeant la page. À la hutte, elles volent de la main jusqu'au haut du toit,
  // l'une après l'autre (voler) ; puis le koban sort de la hutte.
  const plumesSecret = (() => {
    const objet = new THREE.Group();
    // (sans ombre : à plat sur le sol, elle ne se voyait pas, et coûtait un dessin de plus à chaque image)
    const plume = () => {
      const b = atelier();
      plumeCormoran(THREE, b, { base: [0, 0, -0.25], pointe: [0, 0, 0.25], normale: [0, 1, 0], large: 0.17, epais: 0.014, c: '#5c5438', bout: '#1f2422', bombe: 0.006, rachis: true, profil: [0.1, 0.62, 0.92, 1, 0.94, 0.7, 0.2] });
      return ctx.maillage(b.fin(0, false), false);
    };
    // (couchées sur le sol tel qu'il est dessiné, 3 cm au-dessus du terrain ; un peu tournées, un peu penchées : un bord 5 mm
    // plus haut que l'autre, sans entrer dans le sol)
    const sol = PLUMES.map((p) => {
      const m = plume(), y = terrain(p.x, p.z) + 0.03 + 0.013;
      m.position.set(p.x, y, p.z);
      m.rotation.set(0, p.ry, 0.06);
      objet.add(m);
      return { ...p, m, y };
    });
    // (les plumes qui volent et le koban : dans un groupe qui n'entre dans la scène qu'à la fin du secret ; avant, ses matrices
    // seraient recalculées à chaque image pour rien)
    const fin = new THREE.Group(), finIci = () => { if (!fin.parent) objet.add(fin); };
    const vols = [0, 1, 2].map(() => { const m = plume(); m.visible = false; fin.add(m); return { m, t: -1 }; });
    // le koban, qui sort de la hutte et vient au voyageur
    const koban = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.025, 24), new THREE.MeshLambertMaterial({ color: '#e8b941', emissive: '#6a4a10' }));
    koban.scale.set(0.72, 1, 1.15);
    koban.visible = false;
    fin.add(koban);
    let monte = null;
    // les lueurs, des points d'une taille fixe à l'écran (deux fois plus de pixels sur les écrans denses)
    const px = Math.min(globalThis.devicePixelRatio || 1, 2);
    const lueur = nuee(THREE, PLUMES.length, { tache: tacheDouce(THREE, 0.35), additif: true }), etoile = nuee(THREE, PLUMES.length, { tache: etoileDouce(THREE), additif: true });
    // (le jour, l'étincelle : une étoile à quatre branches cernée d'un trait d'encre, peinte ; elle se voit sur tous les sols)
    const etincelle = nuee(THREE, PLUMES.length, { tache: etincelleEncre(THREE) });
    for (const n of [lueur, etoile, etincelle]) { n.m.material.sizeAttenuation = false; objet.add(n.m); }
    // l'état du secret (dans le stockage du navigateur), relu toutes les 0,4 s : les plumes ramassées, la dernière qui reste
    let relu = -1, S = null;
    const relire = (temps) => {
      if (S && temps - relu < 0.4 && temps >= relu) return S;
      relu = temps;
      const fini = secretTrouve('plumes'), pris = PLUMES.map((p) => indiceVu(`plume-${p.id}`)), n = pris.filter(Boolean).length;
      return (S = { fini, pris, n });
    };
    const api = {
      objet,
      // montrer(jeu) : la scène qui dit où est la dernière plume, ou, les trois en main, d'aller à la hutte (donnée par le lieu) ;
      // vue : déjà dite (ou dite en ramassant) : sinon, en arrivant avec deux ou trois plumes, on la dit une fois, dès qu'on est libre
      montrer: null, vue: false,
      ramasser(id) { const p = sol.find((q) => q.id === id); if (p) p.m.visible = false; S = null; },
      /** La plume k vole de (x, y, z) jusqu'au toit ; se résout à l'arrivée. */
      voler(k, de, vers) {
        finIci();
        return new Promise((fin) => { Object.assign(vols[k], { de, vers, t: 0, fin }); vols[k].m.visible = true; });
      },
      /** Le koban sort de la hutte (de) et vient au voyageur (vers) ; se résout à l'arrivée. */
      koban(de, vers) {
        finIci();
        return new Promise((fin) => { monte = { de, vers, t: 0, fin }; koban.visible = true; });
      },
      maj(dt, temps, c) {
        const s = relire(temps), j = c.joueur;
        if (!s.fini && s.n >= 2 && !api.vue && api.montrer && c.scene) { api.vue = true; c.scene((jeu) => api.montrer(jeu)); }
        let montrees = 0;
        sol.forEach((p, k) => {
          if (s.pris[k] || s.fini) p.m.visible = false;
          const d = Math.hypot(j.x - p.x, j.z - p.z);
          if (!p.m.visible || d > 70) { lueur.ranger(k); etoile.ranger(k); etincelle.ranger(k); return; }
          montrees++;
          // (le halo s'efface tout près, pour qu'on voie la plume)
          const pres = lisse(1.2, 3.5, d), b = (0.6 + 0.4 * Math.sin(temps * 2.2 + k * 2)) * pres, yy = p.y + 0.62 + 0.05 * Math.sin(temps * 1.3 + k);
          // (l'étoile : deux scintillements qui se croisent, comme le soleil sur l'eau)
          const e = Math.max(0, Math.sin(temps * 3.1 + k) * Math.sin(temps * 1.9 + k * 1.7)), f = (0.45 + 0.55 * e) * pres;
          if (c.nuit > 0.5) {
            lueur.poser(k, p.x, yy, p.z, 54 * px, b, b * 0.82, b * 0.4, 1);
            etoile.poser(k, p.x, yy, p.z, (22 + 26 * e) * px, f, f * 0.92, f * 0.7, 1);
            etincelle.ranger(k);
          } else {
            // (le jour : un halo orangé, doux ; l'étincelle d'or cernée d'encre, qui grandit et rapetisse en scintillant)
            lueur.poser(k, p.x, yy, p.z, 64 * px, 1, 0.62, 0.12, 0.45 * b);
            etoile.ranger(k);
            etincelle.poser(k, p.x, yy, p.z, (34 + 18 * e) * px, 1, 0.8, 0.22, pres);
          }
        });
        // (le halo : le jour, peint par-dessus ; la nuit, ajouté à la lumière. Une nuée sans rien à montrer n'est pas dessinée :
        // l'étoile, le jour ; l'étincelle, la nuit ; tout, loin des plumes)
        const mode = c.nuit > 0.5 ? THREE.AdditiveBlending : THREE.NormalBlending;
        if (lueur.m.material.blending !== mode) lueur.m.material.blending = mode;
        lueur.m.visible = montrees > 0;
        etoile.m.visible = montrees > 0 && c.nuit > 0.5;
        etincelle.m.visible = montrees > 0 && c.nuit <= 0.5;
        for (const n of [lueur, etoile, etincelle]) if (n.m.visible) n.fin();
        // les plumes qui volent jusqu'au toit : un arc, en tournoyant
        for (const v of vols) {
          if (v.t < 0) continue;
          v.t = Math.min(1, v.t + dt / 0.95);
          const u = v.t, e = u * u * (3 - 2 * u), [a0, a1] = [v.de, v.vers];
          v.m.position.set(a0[0] + (a1[0] - a0[0]) * e, a0[1] + (a1[1] - a0[1]) * e + 0.7 * Math.sin(u * PI), a0[2] + (a1[2] - a0[2]) * e);
          v.m.rotation.set(0.5 * Math.sin(u * 9), Math.atan2(a1[0] - a0[0], a1[2] - a0[2]) + u * 4, 0.4 * Math.sin(u * 7));
          if (u >= 1) { v.t = -1; v.m.visible = false; const f = v.fin; v.fin = null; f?.(); }
        }
        // le koban : il monte de la natte, tourne, puis vient jusqu'au voyageur
        if (monte) {
          monte.t = Math.min(1, monte.t + dt / 2.2);
          const u = monte.t, k = lisse(0.35, 1, u), { de, vers } = monte;
          koban.position.set(de[0] + (vers[0] - de[0]) * k, de[1] + 0.5 * lisse(0, 0.35, u) + (vers[1] - de[1] - 0.5) * k, de[2] + (vers[2] - de[2]) * k);
          koban.rotation.set(PI / 2 - 0.2, temps * 4, 0);
          if (u >= 1) { koban.visible = false; if (vols.every((v) => v.t < 0)) objet.remove(fin); const f = monte.fin; monte = null; f(); }
        }
        return [];
      },
    };
    return api;
  })();
  // où est la dernière plume (à la deuxième ramassée, ou en arrivant avec deux) ; les trois : la hutte, dans la grotte
  plumesSecret.montrer = async (jeu) => {
    if (secretTrouve('plumes')) return;
    const d = PLUMES.find((q) => !indiceVu(`plume-${q.id}`));
    await comp(jeu, d ? 'plumeDerniereCompagnon' : 'plumesHutteCompagnon');
    if (d) await jeu.dire([jeu.tx('plumeDerniere')(jeu.tx('lieuxPlumes')[d.id])]);
  };
  animes.push(plumesSecret);
  // le cormoran du secret : il paraît sur le faîte de la hutte, sèche ses ailes, et s'envole vers la mer
  const cormoran = creerCormoran(ctx.perso || ctx);
  animes.push(cormoran);

  // ---------------------------------------------------------------- La terrasse : la barrière, l'échoppe, le rocher de la tortue
  // une seule barrière rouge, d'un bout à l'autre : du haut de l'escalier, le long de son côté mer, au bord sud de la terrasse,
  // au bord est (au-dessus des rochers), au bord nord, jusqu'à la falaise ; de l'autre côté de l'escalier, contre la falaise
  // (le long de l'escalier, à la hauteur de sa ligne ; elle part du coin de la barrière de la pointe)
  barriere([[ESC.x + ESC.demi + 0.3, POINTE.z0 - 0.3, yLigneEsc(ESC, POINTE.z0 - 0.3)], [ESC.x + ESC.demi + 0.3, ESC.z1 + 0.3, yLigneEsc(ESC, ESC.z1 + 0.3)], [TERRASSE.x1 + 0.3, ESC.z1 + 0.3, Y_T],
    [TERRASSE.x1 + 0.3, TERRASSE.z0 - 0.3, Y_T], [xParoi(TERRASSE.z0 - 0.3) + 1.05, TERRASSE.z0 - 0.3, Y_T]]);
  barriere([[ESC.x - ESC.demi - 0.3, POINTE.z0 - 0.3, yLigneEsc(ESC, POINTE.z0 - 0.3)], [ESC.x - ESC.demi - 0.3, ESC.z1 + 0.2, yLigneEsc(ESC, ESC.z1 + 0.2)], [xParoi(ESC.z1 + 0.2) + 0.95, ESC.z1 + 0.2, Y_T]]);
  // les lanternes blanches des seigneurs Itō, en rang le long de la barrière sud de la terrasse (leurs feux en phases de lune)
  {
    const a = atelier();
    for (let k = 0; k < 6; k++) lanternePierre(a, 30.4 + k * 2.6, ESC.z1 - 0.9, Y_T, 0.92, { blanche: true, lune: [-1, -0.6, -0.2, 0.2, 0.6, 1][k], ry: PI });
    poser(a.fin(), 0, 0, { y: 0 });
  }
  // l'échoppe des boules de chance (運玉) : un petit pavillon au toit de cuivre, son comptoir, les plateaux de boules, l'écriteau
  {
    const a = atelier(), E = ECHOPPE, R = repere(E.x, E.z, PI), y = Y_T;
    for (const [u, v] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) a.boite(0.14, 2.4, 0.14, P.boisFonce, R(u * 1.5, y + 1.2, v * 1.0));
    a.boite(3.2, 0.9, 0.6, P.bois, R(0, y + 0.45, 0.8, { nuance: 0.05 })).boite(3.3, 0.06, 0.7, P.boisFonce, R(0, y + 0.93, 0.8));
    a.boite(3.0, 2.2, 0.08, '#8a6a4e', R(0, y + 1.1, -0.95));
    for (const u of [-1, 1]) a.boite(0.06, 0.95, 1.86, P.bois, R(u * 1.5, y + 0.475, -0.05, { nuance: 0.05 }));
    a.toitJapon(4.0, 3.0, 0.75, 0.25, { ...R(0, y + 2.4, 0), tuile: CUIVRE, tuile2: CUIVRE2, bord: CUIVRE_F, rangs: 10, releve: 0.1 });
    // les boules de terre, rangées par cinq dans des plateaux de bois ; une à part, avec le caractère 運
    for (let k = 0; k < 4; k++) {
      a.boite(0.42, 0.05, 0.22, P.boisFonce, R(-1.1 + k * 0.6, y + 0.985, 0.85));
      for (let j = 0; j < 5; j++) a.boule(0.033, '#b8956a', R(-1.26 + k * 0.6 + j * 0.08, y + 1.04, 0.85), 1);
    }
    a.boite(0.9, 0.6, 0.04, '#f4efe2', R(0.9, y + 1.85, 1.12));
    ecrire({ ...R(0.9, y, 1.145), ry: 0 }, { texte: '運玉 5個 300円', x: 0, y: 1.85, z: 0, l: 0.8, h: 0.42, fond: null, encre: '#2a2420', lignes: 2 });
    murRect(R, 1.6, 1.15);
    monde.bloc(E.x - 1.6, E.x + 1.6, E.z - 1.1, E.z + 1.1, y + 2.0, y + 3.3);
    poser(a.fin(), 0, 0, { y: 0 });
  }
  // le rocher de la tortue (亀石), dans la mer devant le sanctuaire : un gros rocher rond aux couches de grès, son dos aplati, le
  // creux carré (枡形) au milieu et la corde sacrée tout autour ; des rochers autour
  {
    const a = atelier(), K = KAMEISHI;
    rocher(a, K.x, K.y - 1.55, K.z, 2.8, 1.65, 2.3, 0.4, 3, true, 0);
    // (le dessus aplati, où l'on vise : un disque de roche claire, le creux carré sombre, la grosse corde tressée autour)
    a.cylindre(1.25, 1.5, 0.36, 20, '#a8a08e', { x: K.x, y: K.y - 0.12, z: K.z, nuance: 0.04 });
    a.boite(0.72, 0.06, 0.72, '#24221f', { x: K.x, y: K.y + 0.04, z: K.z, ry: 0.4, trait: false });
    a.anneau(0.78, 0.075, '#e0cc8e', { x: K.x, y: K.y + 0.11, z: K.z, rx: PI / 2 });
    for (let k = 0; k < 8; k++) { const t = (k / 8) * 2 * PI; a.boite(0.05, 0.16, 0.012, '#fbfaf4', { x: K.x + Math.cos(t) * 0.86, y: K.y + 0.0, z: K.z + Math.sin(t) * 0.86, ry: -t, trait: false }); }
    for (let k = 0; k < 9; k++) {
      const t = k * 0.7 + 0.3, r = 3.2 + 1.6 * hasard(k, 3), s = 0.7 + 0.6 * hasard(k, 5);
      rocher(a, K.x + Math.cos(t) * r, -0.3, K.z + Math.sin(t) * r * 0.8, s * 1.2, s, s, t, 1, true);
    }
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Les escaliers de pierre, les marches du Rōmon
  // chaque marche, un bloc de pierre plein jusque sous le sol (la marche d'après la recouvre d'un rien) ; une sur deux 1 cm plus
  // large (bout à bout, leurs côtés ne sont pas dans le même plan)
  for (const E of ESCALIERS) {
    const giron = Math.abs(E.z1 - E.z0) / E.n;
    for (let k = 0; k < E.n; k++) {
      const z = zMarche(E, k), haut = marcheDe(E, k), bas = Math.min(terrain(E.x, z), haut) - 0.5, a = morceau(E.x, z);
      a.boite(2 * E.demi + 0.32 + (k % 2) * 0.01, haut - bas, giron + 0.03, k % 2 ? PIERRES[0] : PIERRES[1], { x: E.x, y: (haut + bas) / 2, z, nuance: 0.06 });
    }
  }
  {
    const R = MARCHES_ROMON, a = atelier(), larg = R.z1 - R.z0 + 0.34, g = (R.x1 - R.x0) / R.n;
    for (let k = 0; k < R.n; k++) {
      const haut = Y_ROUTE + ((Y_ROMON - Y_ROUTE) * (k + 1)) / R.n, x = R.x0 + (k + 0.5) * g, bas = Y_ROUTE - 0.5;
      a.boite(g + 0.03, haut - bas, larg + (k % 2) * 0.01, k % 2 ? PIERRES[0] : PIERRES[1], { x, y: (haut + bas) / 2, z: 0, nuance: 0.05 });
    }
    // (de chaque côté des marches, un muret de pierre qui monte avec elles, jusqu'au Rōmon)
    for (const sg of [-1, 1]) {
      const zc = sg * (R.z1 + 0.42);
      a.boite(R.x1 - R.x0 + 0.1, 1.3, 0.5, PIERRES[2], { x: (R.x0 + R.x1) / 2 + 0.05, y: Y_ROMON + 0.05 - 0.65 + 0.35, z: zc, nuance: 0.07 });
      monde.mur(R.x0, zc, R.x1 + 0.1, zc, 0.52);
    }
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Le Rōmon (楼門), la porte rouge à étage
  // Deux étages vermillon : en bas, trois travées (le passage au milieu ; de chaque côté, derrière un treillis, un gardien assis
  // (随身) en habit de cour) ; une galerie à balustrade autour de l'étage, ses murs blancs et ses fenêtres à barreaux ; au milieu
  // de la façade, le tableau peint ; le toit de tuiles grises (入母屋) aux coins relevés, ses consoles vertes et or.
  {
    const a = atelier(), R = repere(ROMON.x, 0, PI / 2), y = Y_ROMON, W = ROMON.l, D = ROMON.p, H1 = 4.1, H2 = 2.9, PAS1 = ROMON.passage;
    // (dans son repère : lx le long de la façade (vers le nord), lz vers l'est, la sortie)
    const xs = [-W / 2 + 0.25, -PAS1 - 0.15, PAS1 + 0.15, W / 2 - 0.25], zs = [-D / 2 + 0.25, 0, D / 2 - 0.25];
    a.boite(W + 0.4, 0.22, D + 0.4, P.pierreFonce, R(0, y - 0.08, 0));
    for (const lx of xs) for (const lz of zs) {
      a.cylindre(0.2, 0.22, H1, 12, ROUGE, R(lx, y + H1 / 2, lz)).cylindre(0.3, 0.32, 0.18, 12, P.pierre, R(lx, y + 0.06, lz));
      monde.cercle(R(lx, 0, lz).x, R(lx, 0, lz).z, 0.48);
    }
    // les travées de côté : un treillis rouge devant et derrière, le gardien assis dedans, les murs blancs du bas
    for (const sg of [-1, 1]) {
      const xm = sg * (PAS1 + W / 2) / 2 + sg * 0.05, lb = W / 2 - PAS1 - 0.6;
      for (const lz of [-D / 2 + 0.25, D / 2 - 0.25]) {
        a.boite(lb, 0.9, 0.08, BLANC_PIGNON, R(xm, y + 0.45, lz));
        a.boite(lb, 2.4, 0.04, LAQUE_BOIS, R(xm, y + 2.1, lz, { trait: false }));
        for (let k = 1; k < 10; k++) a.boite(0.03, 2.4, 0.06, ROUGE, R(xm - lb / 2 + (k * lb) / 10, y + 2.1, lz));
        for (let k = 1; k < 7; k++) a.boite(lb, 0.03, 0.06, ROUGE, R(xm, y + 0.9 + k * 0.34, lz));
      }
      // le gardien (随身) : assis sur son banc, un habit rouge ou noir, le chapeau noir, l'arc
      const q = R(xm, y, 0), c = sg > 0 ? '#2a2830' : '#b8402c';
      a.boite(1.0, 0.5, 0.6, P.boisNoir, R(xm, y + 0.25, -0.1)).ovale(0.34, c, R(xm, y + 1.0, 0.0, { sx: 1.1, sy: 1.3 }), 10)
        .boule(0.17, '#e8c8a0', R(xm, y + 1.62, 0.04), 1).cylindre(0.1, 0.12, 0.3, 8, '#1e1e22', R(xm, y + 1.86, 0.0));
      a.baton([q.x, y + 0.5, q.z], [q.x, y + 2.2, q.z], 0.03, '#3a2a20', 5);
      murRect(repere(R(xm, 0, 0).x, R(xm, 0, 0).z, PI / 2), lb / 2 + 0.15, D / 2 - 0.1);
    }
    // les poutres du bas, le bandeau des consoles, le petit toit (腰屋根) qui fait le tour sous la galerie
    a.boite(W + 0.2, 0.3, 0.32, ROUGE, R(0, y + H1 - 0.15, -D / 2 + 0.25)).boite(W + 0.2, 0.3, 0.32, ROUGE, R(0, y + H1 - 0.15, D / 2 - 0.25));
    for (const lx of [-W / 2 + 0.25, W / 2 - 0.25]) a.boite(0.32, 0.3, D, ROUGE, R(lx, y + H1 - 0.15, 0));
    for (let k = 0; k <= 12; k++) for (const v of [-1, 1]) a.boite(0.22, 0.26, 0.4, k % 2 ? '#3f8a6a' : '#3a6aa8', R(-W / 2 + 0.3 + k * ((W - 0.6) / 12), y + H1 + 0.13, v * (D / 2 - 0.1)));
    const yG = y + H1 + 0.4;
    a.toitJapon(W + 1.6, D + 1.6, 0.55, 0.78, { ...R(0, yG - 0.2, 0), tuile: P.tuileShiro, tuile2: P.tuileShiroClaire, bord: '#4a4a4e', rangs: 22, releve: 0.18, epaisseur: 0.06 });
    // l'étage : le plancher de la galerie, sa balustrade ; le corps blanc aux poteaux rouges et ses fenêtres à barreaux
    const W2 = W - 1.4, D2 = D - 1.0, yE = yG + 0.42;
    a.boite(W + 0.2, 0.12, D + 0.2, '#8a6248', R(0, yE - 0.06, 0));
    {
      const ex = W / 2 + 0.05, ez = D / 2 + 0.05;
      for (const [lx0, lz0, lx1, lz1] of [[-ex, ez, ex, ez], [-ex, -ez, ex, -ez], [-ex, -ez, -ex, ez], [ex, -ez, ex, ez]]) {
        const q0 = R(lx0, yE, lz0), q1 = R(lx1, yE, lz1), l = Math.hypot(lx1 - lx0, lz1 - lz0), n = Math.round(l / 0.9);
        a.baton([q0.x, yE + 0.75, q0.z], [q1.x, yE + 0.75, q1.z], 0.035, ROUGE, 6).baton([q0.x, yE + 0.3, q0.z], [q1.x, yE + 0.3, q1.z], 0.025, ROUGE, 5);
        for (let k = 0; k <= n; k++) a.boite(0.07, 0.75, 0.07, ROUGE, R(lx0 + ((lx1 - lx0) * k) / n, yE + 0.375, lz0 + ((lz1 - lz0) * k) / n));
      }
      for (const [u, v] of [[-ex, ez], [ex, ez], [-ex, -ez], [ex, -ez]]) a.boule(0.07, OR, R(u, yE + 0.84, v), 1);
    }
    a.boite(W2, H2, D2, BLANC_PIGNON, R(0, yE + H2 / 2, 0, { nuance: 0.02 }));
    for (const lx of [-W2 / 2, -W2 / 6, W2 / 6, W2 / 2]) for (const v of [-1, 1]) a.cylindre(0.14, 0.15, H2, 10, ROUGE, R(lx, yE + H2 / 2, v * D2 / 2));
    for (const sg of [-1, 1]) for (const v of [-1, 1]) {
      // (les fenêtres à barreaux de bois vert, de chaque côté du tableau, devant et derrière)
      const lx = sg * W2 / 3;
      a.boite(1.1, 1.0, 0.04, '#2f4a42', R(lx, yE + 1.4, v * (D2 / 2 + 0.02), { trait: false }));
      for (let k = 0; k < 7; k++) a.boite(0.04, 1.0, 0.05, '#4f8a6a', R(lx - 0.45 + k * 0.15, yE + 1.4, v * (D2 / 2 + 0.04), { trait: false }));
    }
    // le tableau peint au milieu de la façade (vers l'allée, l'ouest) : son cadre doré, une vague et un soleil
    {
      const v = -1, q = (lx, yy, avance) => R(lx, yE + yy, v * (D2 / 2 + avance));
      a.boite(1.5, 1.0, 0.06, OR, q(0, 1.55, 0.04)).boite(1.32, 0.82, 0.02, '#3a6aa8', { ...q(0, 1.55, 0.075), trait: false });
      a.cylindre(0.2, 0.2, 0.02, 16, '#e8583e', { ...q(0.3, 1.72, 0.09), rx: PI / 2, trait: false });
      for (let k = 0; k < 4; k++) a.boite(0.3, 0.06, 0.012, '#f4efe6', { ...q(-0.45 + k * 0.28, 1.32 + 0.05 * Math.sin(k * 2), 0.092), rz: 0.3 * Math.sin(k * 1.7), trait: false });
    }
    // le grand toit : quatre pans de tuiles grises, ses pignons blancs (入母屋), le faîtage et ses bouts ; les consoles vertes dessous
    for (let k = 0; k <= 10; k++) for (const v of [-1, 1]) a.boite(0.2, 0.24, 0.38, k % 2 ? '#3f8a6a' : OR, R(-W2 / 2 + k * (W2 / 10), yE + H2 + 0.12, v * (D2 / 2 + 0.12)));
    {
      const yt = yE + H2 + 0.3;
      a.toitJapon(W + 2.2, D + 2.4, 2.0, 0.42, { ...R(0, yt, 0), tuile: P.tuileShiro, tuile2: P.tuileShiroClaire, bord: '#4a4a4e', avant: '#f4efe6', rangs: 26, releve: 0.36, epaisseur: 0.08 });
      const lt = (W + 2.2) * 0.42, pt = (D + 2.4) * 0.42, hg = 1.0, ang = Math.atan2(hg, pt / 2), Lp = Math.hypot(hg, pt / 2) + 0.22, yh = yt + 1.96;
      for (const sens of [1, -1]) a.boite(lt + 0.44, 0.1, Lp, P.tuileShiro, R(0, yh + hg / 2 + 0.02, sens * (pt / 4 + 0.05), { rx: sens * ang, nuance: 0.03 }));
      for (const u of [-1, 1]) a.pignon(0.05, hg - 0.06, pt - 0.1, BLANC_PIGNON, R(u * (lt / 2 - 0.04), yh, 0));
      a.boite(lt + 0.6, 0.22, 0.3, '#3e3e44', R(0, yh + hg + 0.1, 0));
      for (const u of [-1, 1]) a.boite(0.2, 0.5, 0.36, '#3e3e44', R(u * (lt / 2 + 0.32), yh + hg + 0.2, 0));
    }
    poser(a.fin(), 0, 0, { y: 0 });
    // (sous le Rōmon, la caméra passe sous l'étage ; des blocs pour ses travées de côté et son étage)
    monde.toit(ROMON.x - D / 2 - 0.6, ROMON.x + D / 2 + 0.6, -W / 2 - 0.6, W / 2 + 0.6, y + H1 - 0.3, y + 13);
  }

  // ---------------------------------------------------------------- Le chemin des lanternes (伊東家の灯籠), le pont Tamabashi, la pointe
  // au nord du chemin, sur une bordure de pierre, les lanternes blanches données par les seigneurs Itō d'Obi (leurs feux en phases
  // de lune, de la nouvelle à la pleine) ; au sud, la barrière rouge au bord de la falaise ; des pierres plates dans le gravier
  {
    const a = atelier(), L0 = LANTERNES;
    // la bordure de pierre où elles sont posées, de 40 cm, tout le long ; un mur derrière (le voyageur s'arrête devant elle)
    const zb = L0.z0 - 0.75;
    for (let x = L0.x0 + 0.2; x < L0.x1 - 0.2; x += 2.0) {
      const x1 = Math.min(L0.x1 - 0.1, x + 2.0), xm = (x + x1) / 2, yl = yLanternes(xm), sol = Math.min(terrain(x, zb), terrain(x1, zb), yl);
      a.boite(x1 - x + 0.02, yl + 0.4 - sol + 0.25, 1.1 + (Math.round(x) % 2) * 0.01, PIERRES[2], { x: xm, y: (yl + 0.4 + sol - 0.25) / 2, z: zb, nuance: 0.06 });
    }
    monde.mur(L0.x0 + 0.1, L0.z0 - 0.2 - 0.27, L0.x1 - 0.1, L0.z0 - 0.2 - 0.27, 0.27);
    for (let k = 0; k < 8; k++) {
      const x = L0.x0 + 1.4 + k * 2.0;
      lanternePierre(a, x, zb, yLanternes(x) + 0.4, 0.95, { blanche: true, lune: -1 + (k * 2) / 7, ry: 0 });
    }
    // les pierres plates du milieu du chemin (飛び石), une tous les 70 cm, 1 cm au-dessus du gravier
    for (let x = L0.x0 + 0.8; x < L0.x1 - 0.5; x += 0.7) {
      const z = 0.1 + 0.18 * Math.sin(x * 0.9), r = 0.26 + 0.05 * hasard(x, 3);
      a.cylindre(r, r + 0.02, 0.08, 9, '#a39c8c', { x, y: yLanternes(x) - 0.01, z, ry: hasard(x, 1) * 3, sx: 1.15, nuance: 0.05 });
    }
    poser(a.fin(), 0, 0, { y: 0 });
    // la barrière rouge du bord sud, jusqu'au pont (la rambarde du pont la prolonge) ; de l'autre côté du Rōmon, l'allée
    barriere([[ROMON.x + ROMON.p / 2 + 0.05, L0.z1 + 0.3], [PONT.x0, L0.z1 + 0.3]], { yAt: (x) => yLanternes(x) });
  }
  // le pont Tamabashi (玉橋) : un pont de bois en arc au-dessus de la crique, ses poutres vermillon, son tablier clair, sa
  // rambarde rouge aux boutons dorés ; ses deux culées de pierre
  {
    const a = atelier(), DEMI = 1.15, n = 12;
    for (let k = 0; k < n; k++) {
      const x0 = PONT.x0 + ((PONT.x1 - PONT.x0) * k) / n, x1 = PONT.x0 + ((PONT.x1 - PONT.x0) * (k + 1)) / n, y0 = yPont(x0), y1 = yPont(x1), xm = (x0 + x1) / 2, ym = (y0 + y1) / 2, l = Math.hypot(x1 - x0, y1 - y0), rz = Math.atan2(y1 - y0, x1 - x0);
      a.boite(l + 0.02, 0.07, 2 * DEMI, k % 2 ? '#c9b08c' : '#c2a884', { x: xm, y: ym - 0.035, z: PONT.z, rz, nuance: 0.03 });
      for (const sg of [-1, 1]) a.boite(l + 0.03, 0.42, 0.16 + (k % 2) * 0.012, ROUGE, { x: xm, y: ym - 0.28, z: PONT.z + sg * (DEMI - 0.02), rz });
    }
    // la rambarde : des poteaux tous les 52 cm, la main courante, la lisse du bas ; les boutons dorés (擬宝珠) aux quatre bouts
    for (const sg of [-1, 1]) {
      const z = PONT.z + sg * (DEMI - 0.06), pts = [];
      for (let k = 0; k <= 12; k++) {
        const x = PONT.x0 + ((PONT.x1 - PONT.x0) * k) / 12, y = yPont(x);
        a.boite(0.09, 0.95, 0.09, ROUGE, { x, y: y + 0.45, z });
        pts.push([x, y + 0.88, z]);
      }
      a.tube(pts, 0.045, ROUGE, { cotes: 6, pas: 24 }).tube(pts.map(([x, yy, zz]) => [x, yy - 0.5, zz]), 0.03, ROUGE_F, { cotes: 5, pas: 24 });
      for (const x of [PONT.x0, PONT.x1]) a.boule(0.08, OR, { x, y: yPont(x) + 1.02, z }, 1).cone(0.035, 0.1, 8, OR, { x, y: yPont(x) + 1.13, z });
      monde.mur(PONT.x0, z, PONT.x1, z, 0.25);
    }
    // les culées : deux massifs de pierre de part et d'autre de la crique, sous les bouts du tablier
    // (la culée ouest, de toute la largeur du chemin des lanternes : son bout, au bord de la crique, est sur elle)
    for (const [x0, x1, z0, z1] of [[PONT.x0 - 0.4, 19.3, LANTERNES.z0 - 0.3, LANTERNES.z1 + 0.3], [23.8, PONT.x1 + 0.4, PONT.z - DEMI - 0.25, PONT.z + DEMI + 0.25]]) {
      const xm = (x0 + x1) / 2, zm = (z0 + z1) / 2, sol = Math.min(terrain(x0, zm), terrain(x1, zm), terrain(xm, zm), terrain(xm, z0), terrain(xm, z1)) - 0.5;
      a.boite(x1 - x0, Y_POINTE - 0.04 - sol, z1 - z0, PIERRES[1], { x: xm, y: (Y_POINTE - 0.04 + sol) / 2, z: zm, nuance: 0.07 });
    }
    poser(a.fin(), 0, 0, { y: 0 });
  }
  // la pointe : la barrière rouge tout autour (ouverte sur le pont et sur l'escalier), deux bancs face à la mer, des sotetsu
  barriere([[POINTE.x0 - 0.3, PONT.z + 1.15], [POINTE.x0 - 0.3, POINTE.z1 + 0.3], [POINTE.x1 + 0.3, POINTE.z1 + 0.3], [POINTE.x1 + 0.3, POINTE.z0 - 0.3], [ESC.x + ESC.demi + 0.3, POINTE.z0 - 0.3]], { yAt: () => Y_POINTE, finir: false });
  barriere([[POINTE.x0 - 0.3, PONT.z - 1.15], [POINTE.x0 - 0.3, POINTE.z0 - 0.3], [ESC.x - ESC.demi - 0.3, POINTE.z0 - 0.3]], { yAt: () => Y_POINTE, finir: false });

  // ---------------------------------------------------------------- Les arbres du sud : palmiers, cycas, camphriers
  /** Un sotetsu (蘇鉄, le cycas des sanctuaires du sud) : un tronc court et rugueux, une couronne de palmes raides. */
  const sotetsu = (a, x, y, z, s) => {
    a.fut([x, y - 0.1, z], [x, y + 0.55 * s, z], 0.16 * s, 0.13 * s, '#7a6a52', 7).ovale(0.14 * s, '#6a5a44', { x, y: y + 0.55 * s, z, sy: 0.6 }, 8);
    for (let k = 0; k < 14; k++) {
      const t = (k / 14) * 2 * PI + hasard(x, k) * 0.3, leve = 0.25 + 0.35 * hasard(k, z), L = (0.85 + 0.3 * hasard(z, k)) * s, dx = Math.sin(t), dz = Math.cos(t);
      const base = [x + dx * 0.08 * s, y + 0.6 * s, z + dz * 0.08 * s], mid = [base[0] + dx * L * 0.5, base[1] + L * leve * 0.8, base[2] + dz * L * 0.5];
      a.ovale(L * 0.52, k % 2 ? '#3f6a2e' : '#4a7634', { x: mid[0], y: mid[1], z: mid[2], sx: 0.16, sy: 0.035, sz: 1.0, rx: -(leve - 0.15), ry: t, ordre: 'YXZ', sorte: 'persistant' }, 6);
    }
  };
  /**
   * Un palmier des Canaries (フェニックス, l'arbre de la côte de Nichinan) : un gros tronc écailleux, une couronne de longues palmes
   * arquées ; ou (eventail) un palmier éventail (ワシントンヤシ) : un tronc mince et haut, une jupe de palmes sèches, des éventails.
   */
  const palmier = (a, x, y, z, h, eventail = false) => {
    const r0 = eventail ? 0.2 : 0.42, r1 = eventail ? 0.14 : 0.38, sens = hasard(x, z) - 0.5;
    const P1 = [x, y - 0.3, z], P2 = [x + sens * 0.3, y + h * 0.5, z + sens * 0.2], P3 = [x + sens * 0.5, y + h, z + sens * 0.35];
    a.tronc([P1, P2, P3], [r0, (r0 + r1) / 2, r1], eventail ? '#8a7a64' : '#7d6a52', 8);
    for (let k = 0; k < Math.floor(h * 1.2); k++) if (!eventail) a.cylindre(r1 + 0.05, r1 + 0.05, 0.08, 8, '#6a5844', { x: P2[0] + (P3[0] - P2[0]) * (k / (h * 1.2)), y: y + h * 0.5 + (h * 0.5 * k) / (h * 1.2), z: P2[2] + (P3[2] - P2[2]) * (k / (h * 1.2)), trait: false });
    const [cx, cy, cz] = P3;
    if (eventail) {
      // la jupe de palmes sèches sous la couronne, puis une douzaine d'éventails verts
      a.cone(0.55, 1.4, 10, '#a08a62', { x: cx, y: cy - 0.55, z: cz, rx: PI, sorte: 'persistant' });
      for (let k = 0; k < 12; k++) {
        const t = (k / 12) * 2 * PI + hasard(k, x), leve = 0.15 + 0.5 * hasard(z, k), L = 1.25;
        a.ovale(L * 0.5, k % 2 ? '#4f8a3e' : '#5d9a48', { x: cx + Math.sin(t) * L * 0.5, y: cy + 0.2 + leve * 0.6, z: cz + Math.cos(t) * L * 0.5, sx: 0.9, sy: 0.08, sz: 1.0, rx: -leve, ry: t, ordre: 'YXZ', sorte: 'persistant' }, 8);
      }
      return;
    }
    for (let k = 0; k < 18; k++) {
      // (une palme : une bande fine qui part de la couronne, monte puis retombe en arc ; ses folioles, sa largeur)
      const t = (k / 18) * 2 * PI + hasard(k, x) * 0.3, L = 2.4 + 0.6 * hasard(z, k), leve = 0.5 - 0.7 * hasard(k, z);
      a.piece(new THREE.BoxGeometry(1, 1, 1, 6, 1, 1), k % 3 ? '#4d8a3a' : '#5d9646', {
        x: cx, y: cy + 0.1, z: cz, ry: t, ordre: 'YXZ', sorte: 'persistant',
        deformer: (px, py, pz) => { const u = px + 0.5; return [u * L, py * 0.04 + u * L * leve - u * u * L * 0.55, pz * 0.42 * (1 - 0.6 * u)]; },
      });
    }
    a.boule(0.32, '#5a6a32', { x: cx, y: cy, z: cz, sy: 0.7 }, 1);
  };
  /** Un grand arbre persistant du sud (camphrier, クスノキ) : un tronc qui se divise, une couronne de touffes vert sombre. */
  const camphrier = (a, x, z, h, y = terrain(x, z)) => a.arbreTouffu(x, z, h, ['#3f6a34', '#4a7a3c', '#36602e'], { y, graine: Math.round(x * 7 + z), sorte: 'persistant' });

  // ---------------------------------------------------------------- L'allée : la barrière rouge au sud, le muret au nord
  // de la sortie du Shinmon aux marches du Rōmon ; la barrière s'ouvre sur le coin de Bunbuku, le muret sur l'escalier d'Inari
  {
    const zf = ALLEE.z1 + 0.3, xS = SHINMON.x + SHINMON.p / 2 + 0.05;
    const ouv = RECOIN.rx * Math.sqrt(Math.max(0, 1 - ((zf - RECOIN.z) / RECOIN.rz) ** 2)) - 0.05;
    barriere([[xS, zf], [RECOIN.x - ouv, zf]]);
    barriere([[RECOIN.x + ouv, zf], [MARCHES_ROMON.x0, zf]]);
    const zm = ALLEE.z0 - 0.3 - 0.22, eI = INARI_ESC.demi + 0.95;
    muret([[xS, zm], [INARI_ESC.x - eI, zm]], 0.75);
    muret([[INARI_ESC.x + eI, zm], [MARCHES_ROMON.x0, zm]], 0.75);
  }
  // le coin de Bunbuku : une clairière sous deux camphriers, fermée de buissons serrés ; son lampion rouge sur un bambou
  {
    const a = atelier(), zf = ALLEE.z1 + 0.3;
    for (let k = 0; k < 22; k++) {
      // (en cercle autour du coin, sauf du côté de l'allée, où la barrière s'ouvre)
      const t = (k / 22) * 2 * PI, x = RECOIN.x + Math.cos(t) * (RECOIN.rx + 0.7), z = RECOIN.z + Math.sin(t) * (RECOIN.rz + 0.7);
      if (z < zf + 0.35) continue;
      const r = 0.62 + 0.25 * hasard(k, 3);
      a.buisson(x, terrain(x, z) + r * 0.45, z, r, k % 2 ? '#4a7a38' : '#56843e', { touffu: true, sorte: 'persistant' });
      monde.cercle(x, z, 0.72);
    }
    camphrier(a, RECOIN.x - 2.4, RECOIN.z + 3.6, 9.5);
    camphrier(a, RECOIN.x + 2.8, RECOIN.z + 3.9, 8.5);
    a.baton([LAMPION.x, Y_ROUTE, LAMPION.z], [LAMPION.x, Y_ROUTE + 2.0, LAMPION.z], 0.02, '#9fb86a', 5);
    a.chochin(LAMPION.x, Y_ROUTE + 1.75, LAMPION.z, 6.5);
    lumieres.push({ x: LAMPION.x, y: Y_ROUTE + 1.75, z: LAMPION.z, halo: 0.36, sol: Y_ROUTE, r: 2.4, c: '#ff9a6a' });
    monde.cercle(LAMPION.x, LAMPION.z, 0.3);
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Le sanctuaire Udo Inari (鵜戸稲荷神社), sur la colline
  // L'escalier sous un tunnel de torii rouges (on les a offerts un à un), deux renards de pierre au pied ; en haut, le palier de
  // gravier, la petite salle de prière au toit de tuiles grises, sa clôture rouge et blanche (玉垣), la cloche, les bannières
  // rouges, la stèle du nom.
  {
    const a = atelier(), E = INARI_ESC, NT = 12, D_P = E.demi + 0.16;
    for (let k = 0; k < NT; k++) {
      const z = E.z0 + ((E.z1 - E.z0) * (k + 0.4)) / NT, kk = Math.max(0, Math.min(E.n - 1, kMarche(E, z))), y = marcheDe(E, kk), H = 2.5;
      for (const u of [-1, 1]) {
        const px = E.x + u * D_P, yp = Math.min(y, terrain(px, z)) - 0.15;
        a.cylindre(0.07, 0.08, H + y - yp, 8, ROUGE, { x: px, y: (H + y + yp) / 2, z }).cylindre(0.095, 0.095, 0.22 + y - yp, 8, P.noir, { x: px, y: (yp + y + 0.22) / 2, z });
      }
      a.boite(2 * D_P + 0.6, 0.12, 0.17, ROUGE, { x: E.x, y: y + H + 0.06, z }).boite(2 * D_P + 0.62, 0.05, 0.19, P.noir, { x: E.x, y: y + H + 0.145, z })
        .boite(2 * D_P + 0.3, 0.08, 0.08, ROUGE_F, { x: E.x, y: y + H - 0.38, z }).boite(0.07, 0.3, 0.07, ROUGE, { x: E.x, y: y + H - 0.2, z });
      // (sur un pilier sur deux, le nom du donateur, à l'encre, sur une planchette)
      if (k % 2) a.boite(0.012, 0.32, 0.09, '#f4efe2', { x: E.x - D_P - 0.085, y: y + 1.3, z, trait: false });
    }
    // (de chaque côté, la ligne des piliers : un mur ; on monte entre eux)
    for (const u of [-1, 1]) monde.mur(E.x + u * D_P, E.z0, E.x + u * D_P, E.z1, 0.3);
    // les deux renards de pierre au pied de l'escalier, sur leur socle, tournés vers l'allée ; l'un tient la clé, l'autre le joyau
    for (const u of [-1, 1]) {
      const x = E.x + u * (E.demi + 0.95), z = ALLEE.z0 - 0.62, R = repere(x, z, PI - u * 0.35), yp = Y_ROUTE;
      const PIERRE_R = '#7d7a72';
      a.boite(0.62, 0.9, 0.62, P.pierreFonce, R(0, yp + 0.45, 0, { nuance: 0.07 })).boite(0.7, 0.08, 0.7, P.pierre, R(0, yp + 0.94, 0));
      const yt = yp + 0.98;
      a.ovale(0.18, PIERRE_R, { ...R(0, yt + 0.16, -0.04), sx: 1.05, sz: 1.2 }, 12).ovale(0.12, PIERRE_R, { ...R(0, yt + 0.37, 0.05, { rx: -0.15 }), sx: 0.95, sy: 1.5, sz: 0.95 }, 10)
        .ovale(0.095, PIERRE_R, { ...R(0, yt + 0.58, 0.08), sz: 1.05 }, 10).cone(0.045, 0.16, 6, PIERRE_R, R(0, yt + 0.56, 0.22, { rx: PI / 2 }));
      for (const w of [-1, 1]) a.cone(0.036, 0.14, 4, PIERRE_R, R(w * 0.05, yt + 0.7, 0.06, { rz: -w * 0.25 }));
      const T3 = (lx, ly, lz) => { const p = R(lx, yt + ly, lz); return [p.x, p.y, p.z]; };
      a.tube([T3(0, 0.09, -0.19), T3(0, 0.31, -0.3), T3(0, 0.53, -0.25), T3(0, 0.66, -0.11)], 0.052, PIERRE_R, { cotes: 7, pas: 12 });
      a.ovale(0.11, ROUGE, { ...R(0, yt + 0.44, 0.13, { rx: -0.3 }), sy: 0.55, sz: 0.55 }, 10);
      if (u < 0) a.boite(0.17, 0.024, 0.024, '#d8b04a', R(0, yt + 0.53, 0.28)); else a.boule(0.04, '#d8b04a', R(0, yt + 0.53, 0.29), 1);
      monde.cercle(x, z, 0.62);
    }
    // le palier : la salle de prière (拝殿) au fond, tournée vers le sud ; sa clôture rouge et blanche de chaque côté ; la stèle
    {
      const I = INARI, xc = (I.x0 + I.x1) / 2, zh = I.z0 + 1.9, R = repere(xc, zh, 0), y = Y_INARI;
      const W = 4.2, D = 3.2, HP = 2.6;
      a.boite(W + 0.5, 0.3, D + 0.5, P.pierreFonce, R(0, y + 0.1, 0));
      a.boite(W - 0.3, HP - 0.1, D - 0.3, BLANC_PIGNON, R(0, y + 0.25 + (HP - 0.1) / 2, 0, { nuance: 0.02 }));
      for (const [u, v] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [-0.33, 1], [0.33, 1]]) a.cylindre(0.1, 0.11, HP, 10, ROUGE, R(u * (W / 2 - 0.15), y + 0.25 + HP / 2, v * (D / 2 - 0.15)));
      // la façade : la porte ouverte au milieu (le miroir), les grilles sur les côtés ; la poutre, le bandeau
      a.boite(1.2, 1.9, 0.04, '#2a1e18', R(0, y + 1.25, D / 2 - 0.13, { trait: false })).cylindre(0.15, 0.15, 0.03, 16, OR, R(0, y + 1.4, D / 2 - 0.4, { rx: PI / 2, trait: false }));
      for (const u of [-1, 1]) {
        a.boite(1.0, 1.9, 0.04, LAQUE_BOIS, R(u * 1.15, y + 1.25, D / 2 - 0.12));
        for (let k = 1; k < 5; k++) a.boite(0.03, 1.9, 0.05, '#3a1a14', R(u * 1.15 - 0.5 + k * 0.2, y + 1.25, D / 2 - 0.1, { trait: false }));
      }
      a.boite(W + 0.2, 0.22, 0.25, ROUGE, R(0, y + HP + 0.15, D / 2 - 0.12)).boite(W + 0.2, 0.22, 0.25, ROUGE, R(0, y + HP + 0.15, -D / 2 + 0.12));
      a.toitJapon(W + 1.6, D + 1.7, 1.5, 0.35, { ...R(0, y + HP + 0.25, 0), tuile: P.tuileShiro, tuile2: P.tuileShiroClaire, bord: '#4a4a4e', avant: '#f4efe6', rangs: 14, releve: 0.2 });
      {
        const lt = (W + 1.6) * 0.35, pt = (D + 1.7) * 0.35, hg = 0.7, ang = Math.atan2(hg, pt / 2), Lp = Math.hypot(hg, pt / 2) + 0.18, yh = y + HP + 0.25 + 1.47;
        for (const sens of [1, -1]) a.boite(lt + 0.36, 0.08, Lp, P.tuileShiro, R(0, yh + hg / 2 + 0.02, sens * (pt / 4 + 0.04), { rx: sens * ang }));
        for (const u of [-1, 1]) a.pignon(0.05, hg - 0.05, pt - 0.08, BLANC_PIGNON, R(u * (lt / 2 - 0.04), yh, 0));
        a.boite(lt + 0.5, 0.16, 0.24, '#3e3e44', R(0, yh + hg + 0.08, 0));
      }
      // la cloche et sa corde, le tronc des offrandes, la corde sacrée
      const zc = D / 2 + 0.25;
      a.boule(0.11, OR, R(0, y + HP - 0.15, zc), 1);
      { const c0 = R(0, y + HP - 0.25, zc), c1 = R(0, y + 0.9, zc); a.baton([c0.x, c0.y, c0.z], [c1.x, c1.y, c1.z], 0.03, '#c8302c', 6); }
      a.boite(0.9, 0.42, 0.42, P.boisFonce, R(0, y + 0.21, D / 2 + 0.7)).boite(0.95, 0.05, 0.47, P.boisNoir, R(0, y + 0.44, D / 2 + 0.7));
      for (let k = -2; k <= 2; k++) a.pignon(0.85, 0.05, 0.06, P.bois, R(0, y + 0.47, D / 2 + 0.7 + k * 0.08, { rx: PI, trait: false }));
      {
        const T3 = (lx, ly) => { const p = R(lx, ly, D / 2 + 0.05); return [p.x, p.y, p.z]; };
        a.tube([T3(-W / 2 + 0.2, y + HP - 0.05), T3(0, y + HP - 0.22), T3(W / 2 - 0.2, y + HP - 0.05)], 0.05, '#d8c48a', { cotes: 7, pas: 12 });
        for (const lx of [-1.2, -0.4, 0.4, 1.2]) for (let k = 0; k < 3; k++) a.boite(0.06, 0.08, 0.006, '#fbfaf4', R(lx + (k % 2 ? 0.025 : -0.025), y + HP - 0.3 - k * 0.07, D / 2 + 0.09, { rz: k % 2 ? -0.3 : 0.3, trait: false }));
      }
      murRect(R, W / 2 + 0.25, D / 2 + 0.25);
      murRect(repere(R(0, 0, D / 2 + 0.7).x, R(0, 0, D / 2 + 0.7).z, 0), 0.45, 0.21);
      monde.bloc(xc - W / 2 - 0.4, xc + W / 2 + 0.4, zh - D / 2 - 0.4, zh + D / 2 + 0.4, y - 1, y + HP + 2.4);
      // la clôture rouge et blanche (玉垣) de chaque côté de la salle, jusqu'aux bords du palier : des poteaux rouges, des panneaux
      // blancs, une grille verte en haut ; derrière elle, la colline
      const zg = zh + D / 2 - 0.4;
      for (const [x0, x1] of [[I.x0 - 0.3, xc - W / 2 - 0.3], [xc + W / 2 + 0.3, I.x1 + 0.3]]) {
        const n = Math.max(1, Math.round((x1 - x0) / 1.1));
        for (let k = 0; k <= n; k++) a.boite(0.12, 1.3, 0.12, ROUGE, { x: x0 + ((x1 - x0) * k) / n, y: y + 0.6, z: zg });
        a.boite(x1 - x0, 0.6, 0.05, BLANC_PIGNON, { x: (x0 + x1) / 2, y: y + 0.4, z: zg }).boite(x1 - x0, 0.32, 0.03, '#3f7a5a', { x: (x0 + x1) / 2, y: y + 0.95, z: zg, trait: false })
          .boite(x1 - x0 + 0.1, 0.08, 0.14, ROUGE, { x: (x0 + x1) / 2, y: y + 1.24, z: zg });
        monde.mur(x0, zg, x1, zg, 0.3);
      }
      // la stèle du nom (鵜戸稲荷神社), à gauche de l'escalier, en haut ; les bannières rouges (正一位稲荷大明神) le long des bords
      {
        const x = E.x - E.demi - 1.4, z = E.z1 - 0.9;
        a.boite(0.42, 1.9, 0.42, '#9a9488', { x, y: y + 0.95, z, nuance: 0.05 }).boite(0.62, 0.3, 0.62, P.pierreFonce, { x, y: y + 0.15, z });
        ecrire({ x, y, z: z + 0.212, ry: 0 }, { texte: '鵜戸稲荷神社', vertical: true, x: 0, y: 1.05, z: 0, l: 0.28, h: 1.4, fond: null, encre: '#2a2420' });
        monde.cercle(x, z, 0.74);
      }
      for (const [x, z] of [[I.x0 + 0.5, I.z1 - 1.8], [I.x0 + 0.5, I.z1 - 4.2], [I.x1 - 0.5, I.z1 - 1.8], [I.x1 - 0.5, I.z1 - 4.2]]) {
        a.baton([x, y - 0.1, z], [x, y + 3.0, z], 0.028, P.boisFonce, 6).baton([x, y + 2.86, z], [x, y + 2.86, z - 0.42], 0.016, P.boisFonce, 5);
        a.boite(0.012, 1.7, 0.38, '#c8402c', { x, y: y + 1.95, z: z - 0.21 });
        ecrire({ x: x + (x < xc ? 0.008 : -0.008), y, z: z - 0.21, ry: x < xc ? PI / 2 : -PI / 2 }, { texte: '正一位稲荷大明神', vertical: true, x: 0, y: 1.95, z: 0, l: 0.28, h: 1.55, fond: null, encre: '#fff4e8' });
        monde.cercle(x, z - 0.15, 0.42);
      }
      // ses bords : la barrière rouge devant (ouverte sur l'escalier), des murets de pierre sur les côtés, contre la pente
      // (sans poteau contre le dernier torii : ses lisses entrent dans son pilier ; deux poteaux se mangeaient)
      barriere([[I.x0 - 0.3, I.z1 + 0.3], [E.x - D_P - 0.04, I.z1 + 0.3]], { yAt: () => y, finir: false });
      barriere([[I.x1 + 0.3, I.z1 + 0.3], [E.x + D_P + 0.04, I.z1 + 0.3]], { yAt: () => y, finir: false });
      muret([[I.x0 - 0.52, I.z1 + 0.3], [I.x0 - 0.52, zg]], 0.85, { yAt: (x, z) => Math.max(y, terrain(x, z)) });
      muret([[I.x1 + 0.52, I.z1 + 0.3], [I.x1 + 0.52, zg]], 0.85, { yAt: (x, z) => Math.max(y, terrain(x, z)) });
    }
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Le Shinmon (神門), ses murs, la place
  // La porte du sanctuaire, à un étage : trois travées, le passage au milieu ; de chaque côté, le bas blanc et les fenêtres à
  // barreaux verts ; le toit de tuiles grises (入母屋) ; de part et d'autre, les murs blancs au chaperon de tuiles (築地塀)
  // jusqu'aux bords de la place ; devant, deux grandes lanternes de pierre.
  {
    const a = atelier(), S = SHINMON, R = repere(S.x, 0, PI / 2), y = Y_ROUTE, W = S.l, D = S.p, H = 3.6, PAS2 = 1.7;
    a.boite(W + 0.4, 0.2, D + 0.4, P.pierreFonce, R(0, y + 0.02, 0));
    for (const lx of [-W / 2 + 0.2, -PAS2 - 0.12, PAS2 + 0.12, W / 2 - 0.2]) for (const lz of [-D / 2 + 0.2, D / 2 - 0.2]) {
      a.cylindre(0.17, 0.19, H, 12, ROUGE, R(lx, y + H / 2, lz)).cylindre(0.26, 0.28, 0.16, 12, P.pierre, R(lx, y + 0.08, lz));
      monde.cercle(R(lx, 0, lz).x, R(lx, 0, lz).z, 0.45);
    }
    for (const sg of [-1, 1]) {
      const xm = sg * (PAS2 + W / 2) / 2, lb = W / 2 - PAS2 - 0.35;
      for (const lz of [-D / 2 + 0.2, D / 2 - 0.2]) {
        a.boite(lb, 1.1, 0.1, BLANC_PIGNON, R(xm, y + 0.55, lz)).boite(lb, 0.12, 0.14, ROUGE, R(xm, y + 1.15, lz));
        a.boite(lb - 0.2, 1.4, 0.04, '#2f4a42', R(xm, y + 1.95, lz, { trait: false }));
        for (let k = 1; k < 9; k++) a.boite(0.04, 1.4, 0.06, '#4f8a6a', R(xm - lb / 2 + (k * lb) / 9, y + 1.95, lz, { trait: false }));
      }
      murRect(repere(R(xm, 0, 0).x, R(xm, 0, 0).z, PI / 2), lb / 2 + 0.1, D / 2 - 0.1);
    }
    a.boite(W + 0.2, 0.28, 0.3, ROUGE, R(0, y + H - 0.14, -D / 2 + 0.2)).boite(W + 0.2, 0.28, 0.3, ROUGE, R(0, y + H - 0.14, D / 2 - 0.2));
    for (let k = 0; k <= 10; k++) for (const v of [-1, 1]) a.boite(0.2, 0.22, 0.36, k % 2 ? '#3f8a6a' : OR, R(-W / 2 + 0.2 + k * ((W - 0.4) / 10), y + H + 0.1, v * (D / 2 - 0.05)));
    {
      const yt = y + H + 0.25;
      a.toitJapon(W + 2.0, D + 2.2, 1.7, 0.4, { ...R(0, yt, 0), tuile: P.tuileShiro, tuile2: P.tuileShiroClaire, bord: '#4a4a4e', avant: '#f4efe6', rangs: 20, releve: 0.3, epaisseur: 0.07 });
      const lt = (W + 2.0) * 0.4, pt = (D + 2.2) * 0.4, hg = 0.85, ang = Math.atan2(hg, pt / 2), Lp = Math.hypot(hg, pt / 2) + 0.2, yh = yt + 1.66;
      for (const sens of [1, -1]) a.boite(lt + 0.4, 0.09, Lp, P.tuileShiro, R(0, yh + hg / 2 + 0.02, sens * (pt / 4 + 0.04), { rx: sens * ang }));
      for (const u of [-1, 1]) a.pignon(0.05, hg - 0.05, pt - 0.1, BLANC_PIGNON, R(u * (lt / 2 - 0.04), yh, 0));
      a.boite(lt + 0.56, 0.2, 0.28, '#3e3e44', R(0, yh + hg + 0.09, 0));
    }
    // les murs blancs (築地塀), de la porte aux bords de la place : le bas de pierre, le mur blanc, le chaperon de tuiles
    for (const sg of [-1, 1]) {
      const z0 = sg * (W / 2 + 0.05), z1 = sg * (PLACE.z1 + 0.6), l = Math.abs(z1 - z0), zm = (z0 + z1) / 2;
      a.boite(0.7, 0.4, l, PIERRES[1], { x: S.x, y: y + 0.1, z: zm }).boite(0.5, 1.9, l, BLANC_PIGNON, { x: S.x, y: y + 1.15, z: zm, nuance: 0.02 })
        .pignon(l + 0.1, 0.36, 0.9, P.tuileShiro, { x: S.x, y: y + 2.1, z: zm, ry: PI / 2 });
      monde.mur(S.x, z0, S.x, z1, 0.52);
    }
    // les deux grandes lanternes de pierre devant la porte, sur leur haut socle
    for (const sg of [-1, 1]) {
      const x = S.x - D / 2 - 2.4, z = sg * 4.6;
      a.boite(1.2, 0.8, 1.2, PIERRES[1], { x, y: y + 0.4, z, nuance: 0.06 });
      lanternePierre(a, x, z, y + 0.8, 1.45);
      murRect(repere(x, z, 0), 0.6, 0.6);
    }
    poser(a.fin(), 0, 0, { y: 0 });
    monde.toit(S.x - D / 2 - 0.8, S.x + D / 2 + 0.8, -W / 2 - 0.8, W / 2 + 0.8, y + H - 0.2, y + 8);
  }
  {
    // la place : la barrière rouge au nord (ouverte sur le Hatchōzaka), au-dessus de la pente qui descend vers le port ; au sud,
    // le bureau des porte-bonheur entre deux murs blancs ; la stèle du nom, la fontaine des ablutions, deux bancs, des palmiers
    const zN = PLACE.z0 - 0.3, oH = HATCHO.demi + 0.3;
    barriere([[PLACE.x0 + 0.05, zN], [HATCHO.x - oH, zN]], { yAt: () => Y_ROUTE });
    barriere([[HATCHO.x + oH, zN], [SHINMON.x - 0.35, zN]], { yAt: () => Y_ROUTE });
    const a = atelier(), y = Y_ROUTE;
    // le bureau des porte-bonheur (授与所) : une longue maison de bois au toit de tuiles grises, son comptoir vers la place ; les
    // porte-bonheur, les plaquettes en forme de lapin (兎の絵馬) ; à côté, le présentoir où on les accroche
    {
      const J = { x: -37.5, z: PLACE.z1 + 0.55 + 2.5, l: 8.0, p: 5.0 }, R = repere(J.x, J.z, PI);
      // (le socle à fleur du sol : la miko s'y tient ; le corps en retrait, la miko dessous l'avant-toit, entre lui et le comptoir)
      a.boite(J.l, 0.3, J.p, P.pierreFonce, R(0, y - 0.11, 0));
      a.boite(J.l - 0.2, 2.6, 3.2, '#8a6a4e', R(0, y + 1.3, -0.85, { nuance: 0.04 }));
      for (let k = 0; k <= 6; k++) a.cylindre(0.1, 0.1, 2.9, 8, P.boisFonce, R(-J.l / 2 + 0.1 + k * ((J.l - 0.2) / 6), y + 1.45, J.p / 2 - 0.1));
      // (le fond : des étagères de porte-bonheur de toutes les couleurs, contre le corps)
      a.boite(J.l - 0.6, 1.5, 0.04, '#5a4636', R(0, y + 1.45, 0.77, { trait: false }));
      for (let k = 0; k < 24; k++) a.boite(0.16, 0.2, 0.05, ['#c8402c', '#f6f3ea', '#3a6aa8', '#e8b941', '#d86a8a', '#5a8a4a'][k % 6], R(-3.3 + (k % 12) * 0.6, y + 1.2 + Math.floor(k / 12) * 0.45, 0.8, { trait: false }));
      a.boite(J.l - 0.4, 0.95, 0.55, P.bois, R(0, y + 0.47, 2.65, { nuance: 0.04 })).boite(J.l - 0.3, 0.06, 0.7, P.boisFonce, R(0, y + 0.97, 2.68));
      const COULEURS = ['#c8402c', '#f6f3ea', '#3a6aa8', '#e8b941', '#d86a8a', '#5a8a4a'];
      for (let k = 0; k < 16; k++) a.boite(0.09, 0.14, 0.015, COULEURS[k % 6], R(-3.3 + k * 0.42, y + 1.09, 2.6, { rx: -0.35, trait: false }));
      // (les plaquettes en lapin : un ovale blanc, deux oreilles, sur le comptoir)
      for (let k = 0; k < 5; k++) {
        const q = R(-1.4 + k * 0.7, y + 1.12, 2.8);
        a.ovale(0.07, '#f2e6cc', { ...q, sx: 1.0, sy: 0.8, sz: 0.2 }, 8).ovale(0.022, '#f2e6cc', { ...R(-1.43 + k * 0.7, y + 1.22, 2.8), sy: 3, sz: 0.5 }, 6).ovale(0.022, '#f2e6cc', { ...R(-1.37 + k * 0.7, y + 1.22, 2.8), sy: 3, sz: 0.5 }, 6);
      }
      a.toitJapon(J.l + 1.4, J.p + 1.6, 1.4, 0.28, { ...R(0, y + 2.9, 0), tuile: P.tuileShiro, tuile2: P.tuileShiroClaire, bord: '#4a4a4e', rangs: 16, releve: 0.12 });
      a.boite(1.6, 0.36, 0.05, P.bois, R(0, y + 2.65, J.p / 2 + 0.02));
      ecrire({ ...R(0, y, J.p / 2 + 0.05), ry: PI }, { texte: '授与所', x: 0, y: 2.65, z: 0, l: 1.3, h: 0.28, fond: null, encre: '#2a2420' });
      monde.surface(J.x - J.l / 2 - 0.27, J.x + J.l / 2 + 0.27, J.z - J.p / 2 - 0.66, J.z + J.p / 2 + 0.27, y + 3.5, { plein: true });
      monde.bloc(J.x - J.l / 2, J.x + J.l / 2, J.z - J.p / 2, J.z + J.p / 2, y - 1, y + 4.4);
      lumieres.push({ ...R(0, y + 2.3, J.p / 2 + 0.8), halo: 0, sol: y, r: 3.0, c: '#ffe2b0' });
      // les murs blancs de chaque côté, jusqu'aux coins de la place
      for (const [x0, x1] of [[PLACE.x0 - 0.2, J.x - J.l / 2], [J.x + J.l / 2, SHINMON.x - 0.3]]) {
        const l = x1 - x0, xm = (x0 + x1) / 2, zw = PLACE.z1 + 0.55;
        a.boite(l, 0.4, 0.7, PIERRES[1], { x: xm, y: y + 0.1, z: zw }).boite(l, 1.9, 0.5, BLANC_PIGNON, { x: xm, y: y + 1.15, z: zw, nuance: 0.02 })
          .pignon(l + 0.1, 0.36, 0.9, P.tuileShiro, { x: xm, y: y + 2.1, z: zw });
        monde.mur(x0, zw, x1, zw, 0.52);
      }
      // le présentoir des plaquettes (絵馬掛け), contre le mur, à l'est du bureau : des lapins blancs pendus à deux barres
      {
        const Rr = repere(-31.2, PLACE.z1 - 0.15, PI);
        for (const u of [-1, 1]) a.boite(0.1, 1.9, 0.1, P.boisFonce, Rr(u * 1.1, y + 0.95, 0));
        a.pignon(2.7, 0.3, 0.7, P.tuileShiro, Rr(0, y + 1.9, 0));
        for (const hb of [1.0, 1.45]) {
          a.boite(2.2, 0.05, 0.05, P.bois, Rr(0, y + hb + 0.1, 0));
          for (let k = 0; k < 9; k++) {
            const lx = -0.95 + k * 0.24 + (hasard(k, hb) - 0.5) * 0.04;
            a.ovale(0.075, '#f2e6cc', { ...Rr(lx, y + hb, 0.04 + (k % 2) * 0.006), sx: 1.0, sy: 0.85, sz: 0.15, trait: false }, 8);
            a.ovale(0.022, '#f2e6cc', { ...Rr(lx - 0.035, y + hb + 0.1, 0.04), sy: 3, sz: 0.4, trait: false }, 6).ovale(0.022, '#f2e6cc', { ...Rr(lx + 0.035, y + hb + 0.1, 0.04), sy: 3, sz: 0.4, trait: false }, 6);
            a.boite(0.03, 0.012, 0.004, '#c8402c', Rr(lx, y + hb - 0.02, 0.055 + (k % 2) * 0.006, { trait: false }));
          }
        }
        murRect(Rr, 1.15, 0.12);
      }
    }
    // la stèle du nom (社号標 : 鵜戸神宮), au coin ouest de la place
    {
      const x = PLACE.x0 + 1.4, z = PLACE.z0 + 1.4;
      a.boite(0.55, 2.6, 0.55, '#9a9488', { x, y: y + 1.3, z, nuance: 0.05 }).boite(0.9, 0.35, 0.9, P.pierreFonce, { x, y: y + 0.17, z });
      ecrire({ x: x + 0.28, y, z, ry: PI / 2 }, { texte: '鵜戸神宮', vertical: true, x: 0, y: 1.5, z: 0, l: 0.36, h: 1.8, fond: null, encre: '#2a2420' });
      monde.cercle(x, z, 0.75);
    }
    // la fontaine des ablutions (手水舎) : quatre poteaux, un toit de cuivre, le bassin de pierre, l'eau, les louches (à x −31,4,
    // elle était dans la grande lanterne nord de la porte : un poteau dans son socle, la lanterne à travers le toit)
    {
      const R = repere(CHOZUYA.x, CHOZUYA.z, PI / 2);
      for (const [u, v] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) a.boite(0.14, 2.3, 0.14, ROUGE, R(u * 1.0, y + 1.15, v * 0.75));
      a.toitJapon(2.8, 2.3, 0.75, 0.3, { ...R(0, y + 2.3, 0), tuile: CUIVRE, tuile2: CUIVRE2, bord: CUIVRE_F, rangs: 10, releve: 0.1 });
      // (l'eau 1,2 cm au-dessus du bassin : 1 cm dessous, on ne la voyait pas)
      a.boite(1.4, 0.65, 0.75, P.pierre, R(0, y + 0.33, 0, { nuance: 0.07 })).boite(1.2, 0.03, 0.55, '#5aa0a8', R(0, y + 0.652, 0, { trait: false, nuance: 0 }));
      a.cylindre(0.012, 0.012, 1.3, 5, P.bois, R(0, y + 0.7, -0.32, { rz: PI / 2 }));
      for (let k = 0; k < 4; k++) a.cylindre(0.03, 0.03, 0.06, 8, P.bois, R(-0.38 + k * 0.25, y + 0.74, -0.32));
      for (const [u, v] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const q = R(u * 1.0, 0, v * 0.75); monde.cercle(q.x, q.z, 0.36); }
      murRect(R, 0.7, 0.38);
    }
    // deux bancs le long de la barrière nord, face à la mer et au port
    for (const xb of [PLACE.x0 + 4.5, -31.6]) {
      const zb = PLACE.z0 + 0.95;
      a.boite(1.8, 0.07, 0.42, P.bois, { x: xb, y: y + 0.44, z: zb }).boite(1.8, 0.3, 0.05, P.bois, { x: xb, y: y + 0.72, z: zb + 0.22, rx: 0.15 });
      for (const u of [-1, 1]) a.boite(0.06, 0.44, 0.4, P.boisFonce, { x: xb + u * 0.78, y: y + 0.22, z: zb });
      bancs.push({ de: [xb - 0.75, zb], a: [xb + 0.75, zb], y: y + 0.475, cap: PI });
      murRect(repere(xb, zb + 0.05, 0), 0.9, 0.25);
    }
    for (const [x, z] of [[PLACE.x0 + 1.4, PLACE.z1 - 1.4]]) { palmier(a, x, y, z, 6.5); monde.cercle(x, z, 0.75); }
    // le panneau du Hatchōzaka (八丁坂), au bord de la descente (on le lit : lire('hatcho'))
    {
      const p = { ...PANNEAU_HATCHO, ry: PI };
      const b = panneau(atelier(), P, { ecrit: true });
      poser(b.fin(), p.x, p.z, { y, ry: p.ry });
      ecrire({ x: p.x, y, z: p.z, ry: p.ry }, { ...PAPIER_PANNEAU, texte: '八丁坂 ↓ 吹毛井港', fond: '#fff8e8', encre: '#2a2420', lignes: 2 });
      monde.mur(p.x - 0.6, p.z, p.x + 0.6, p.z, 0.5);
    }
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Le grand torii (大鳥居), au bout de la rue
  // vermillon, le linteau du haut noir aux bouts relevés, comme sur la photo de la rue (les palmiers derrière)
  {
    const a = atelier(), R = repere(OTORII.x, 0, PI / 2), y = Y_ROUTE, X = OTORII.demi, H = OTORII.h;
    for (const u of [-1, 1]) {
      a.cylindre(0.26, 0.3, H - 0.6, 14, ROUGE, R(u * X, y + 0.6 + (H - 0.6) / 2, 0)).cylindre(0.36, 0.38, 0.62, 14, P.noir, R(u * X, y + 0.31, 0))
        .cylindre(0.5, 0.52, 0.14, 14, P.pierreFonce, R(u * X, y + 0.02, 0));
      monde.cercle(R(u * X, 0, 0).x, R(u * X, 0, 0).z, 0.66);
    }
    a.boite(2 * X + 1.2, 0.34, 0.3, ROUGE, R(0, y + H - 1.35, 0));
    for (const u of [-1, 1]) a.boite(0.42, 0.12, 0.42, ROUGE_F, R(u * X, y + H - 1.58, 0));
    a.boite(2 * X + 1.9, 0.34, 0.4, ROUGE, R(0, y + H - 0.12, 0));
    const releve = (lx, ly, lz, k) => [lx, ly + k * (lx / (X + 1.6)) ** 2, lz];
    a.piece(new THREE.BoxGeometry(2 * X + 3.1, 0.34, 0.52, 18, 1, 1), P.noir, { ...R(0, y + H + 0.22, 0), deformer: (lx, ly, lz) => releve(lx, ly, lz, 0.42) });
    a.boite(0.32, 1.0, 0.26, ROUGE, R(0, y + H - 0.75, 0)).boite(0.74, 0.9, 0.08, '#1f2420', R(0, y + H - 0.75, -0.18)).boite(0.6, 0.76, 0.02, '#2a2420', R(0, y + H - 0.75, -0.225, { trait: false }));
    ecrire({ x: OTORII.x, y, z: 0, ry: PI / 2 }, { texte: '鵜戸神宮', vertical: true, x: 0, y: H - 0.75, z: -0.237, ry: PI, l: 0.42, h: 0.68, fond: null, encre: '#e8c25a' });
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- La rue des boutiques (門前町), le parking, l'arrêt de bus
  // Deux rangs de boutiques basses, face à face, au toit de tuiles grises : souvenirs, les bonbons « おちちあめ », un restaurant, un
  // salon de thé ; leurs enseignes, leurs comptoirs, leurs distributeurs ; au bout ouest, le parking, l'arrêt du bus de la côte.
  {
    // (la maison des boutiques de Motonosumi, ses tuiles grises : celles de Kyūshū)
    const TUILE = P.tuileShiro, TUILE2 = P.tuileShiroClaire, TUILE_F = '#5a5f66', PLATRE = '#f1ece0', KOSHI = '#5b4537', VITRE = '#a9bcc4', ALU = '#5d6166';
    const HW0 = 2.95, RH = 1.45, EV = 0.6, VG0 = 0.35, EP = 0.1;
    const SOUVENIRS = ['#c8402c', '#f2c443', '#3a6aa8', '#f4efe2', '#5a8a4a', '#e88a3a', '#d86a8a', '#7a5a9a', '#a8d4e8'];
    /**
     * La maison, dans le repère R (la façade vers +z) : W de large (x), D de profondeur (z), le sol du parking en y ; o : sol (du
     * dedans), enseigne (texte, fond, encre), cafe ; renvoie F (le plancher) et les x des travées.
     */
    const maison = (a, R, W, D, y, o) => {
      // (o.hw, o.vg : la hauteur des murs, le débord du toit sur les pignons ; des boutiques collées, chacune la sienne)
      const HW = o.hw ?? HW0, VG = o.vg ?? VG0;
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
          ecrire({ x: q.x, y: F, z: q.z, ry: R(0, 0, 0).ry }, { texte: 'お食事', x: 0, y: 1.6, z: 0, l: l * 0.55, h: 0.3, fond: null, encre: '#f4efe2' });
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
    const COTES = [
      { x: -79.25, nord: true, enseigne: { texte: 'おみやげ 鵜戸', fond: '#dcbf92', encre: '#2a2420' }, distributeurs: true },
      { x: -69.75, nord: true, enseigne: { texte: 'おちちあめ', fond: '#f4e6c8', encre: '#b8402c' }, bonbons: true },
      { x: -60.25, nord: true, enseigne: { texte: '食事処 うど', fond: '#4a3424', encre: '#f2e2c0' }, cafe: true },
      { x: -50.75, nord: true, enseigne: { texte: '鵜戸 茶屋', fond: '#2f4a3a', encre: '#f4efe2' }, cafe: true },
      { x: -79.25, nord: false, enseigne: { texte: 'うさぎ みやげ', fond: '#f4efe2', encre: '#c8402c' } },
      { x: -69.75, nord: false, enseigne: { texte: '運玉 おまもり', fond: '#dcbf92', encre: '#2a2420' }, distributeurs: true },
      { x: -60.25, nord: false, enseigne: { texte: 'ソフトクリーム', fond: '#f4efe2', encre: '#3a6aa8' } },
      { x: -50.75, nord: false, enseigne: { texte: '日南 干物', fond: '#3a5a7a', encre: '#f4efe2' } },
    ];
    const W = 9.5, D = 7.0, y = Y_ROUTE;
    for (const B of COTES) {
      const a = morceau(B.x, B.nord ? -10 : 10, 30), zc = B.nord ? RUE.z0 - D / 2 : RUE.z1 + D / 2, R = repere(B.x, zc, B.nord ? 0 : PI);
      const k = COTES.indexOf(B) % 4, { F, xin } = maison(a, R, W, D, y, { sol: B.cafe ? '#b9a68a' : '#cfc6b4', enseigne: B.enseigne, cafe: B.cafe, hw: [2.95, 3.3, 3.05, 3.4][k], vg: 0.3 });
      // dedans : des étagères de souvenirs, ou les tables du restaurant ; les boîtes de bonbons
      if (B.cafe) {
        for (const [x, z] of [[-1.6, -0.6], [1.6, -1.0]]) {
          a.cylindre(0.42, 0.42, 0.04, 14, P.bois, R(x, F + 0.74, z, { trait: false })).cylindre(0.05, 0.06, 0.72, 6, P.boisFonce, R(x, F + 0.37, z, { trait: false }));
          for (const u of [-1, 1]) a.cylindre(0.17, 0.17, 0.04, 10, '#c8402c', R(x + u * 0.62, F + 0.45, z, { trait: false }));
        }
      } else {
        for (let r = 0; r < 4; r++) {
          const yr = F + 0.3 + r * 0.45;
          a.boite(W - 0.9, 0.03, 0.4, P.bois, R(0, yr, -D / 2 + 0.36, { trait: false }));
          for (let x = -W / 2 + 0.6, k = 0; x < W / 2 - 0.5; x += 0.3, k++) {
            const h = 0.12 + 0.14 * hasard(k + r * 7, B.x), c = SOUVENIRS[Math.floor(hasard(r, k + B.x) * SOUVENIRS.length)];
            a.boite(0.22, h, 0.26, B.bonbons ? (k % 2 ? '#f4e6c8' : '#f2c6c6') : c, R(x, yr + 0.015 + h / 2, -D / 2 + 0.36, { trait: false }));
          }
        }
      }
      if (B.distributeurs) for (const [k, c] of [[0, '#c8302c'], [1, '#2f6ab0']]) distributeur(a, R, xin - 0.52 - k * 1.0, D / 2 + 0.41, F, c);
      lumieres.push({ ...R(0, F + 2.2, D / 2 + 0.7), halo: 0, sol: y, r: 3.2, c: '#ffe2b0' });
      // (la boutique : un bloc plein, 27 cm au-delà des murs, 66 cm devant : les distributeurs, le plateau du comptoir)
      const q0 = R(-W / 2 - 0.27, 0, -D / 2 - 0.27), q1 = R(W / 2 + 0.27, 0, D / 2 + 0.42);
      monde.surface(Math.min(q0.x, q1.x), Math.max(q0.x, q1.x), Math.min(q0.z, q1.z), Math.max(q0.z, q1.z), y + 3.4, { plein: true });
      if (B.distributeurs) { const qd = R(xin - 1.02, 0, D / 2 + 0.41); murRect(repere(qd.x, qd.z, B.nord ? 0 : PI), 0.98, 0.36); }
      monde.bloc(B.x - W / 2, B.x + W / 2, zc - D / 2, zc + D / 2, y - 1, y + 4.6);
    }
  }
  {
    // le parking : ses lignes, des voitures, le car de la côte ; tout autour, une haie taillée sur un muret de pierre
    const a = atelier(), y = Y_ROUTE, Pk = PARKING;
    for (let k = 0; k < 6; k++) a.boite(0.1, 0.01, 4.6, '#f4f2ea', { x: Pk.x0 + 2.0 + k * 2.6, y: y + 0.012, z: Pk.z1 - 2.6, trait: false });
    a.boite(14, 0.01, 0.1, '#f4f2ea', { x: Pk.x0 + 8.5, y: y + 0.012, z: Pk.z1 - 4.9, trait: false });
    for (const [x, z, ry, c, sorte] of [[Pk.x0 + 3.3, Pk.z1 - 2.6, PI, '#f1f1ec', 'berline'], [Pk.x0 + 8.5, Pk.z1 - 2.6, 0.03, '#a9d3b6', 'kei']]) {
      voiture(THREE, a, repere(x, z, ry), y, c, sorte);
      murRect(repere(x, z, ry), MODELES_VOITURE[sorte].W / 2, MODELES_VOITURE[sorte].L / 2);
    }
    {
      // le car de la côte (宮崎交通 : blanc, une bande rouge et orange), l'avant vers l'est
      const R = repere(Pk.x0 + 7.2, Pk.z0 + 2.2, PI / 2), L = 10.5, Wb = 2.45, VITRE = '#2e3a46';
      a.boite(Wb, 2.35, L, '#f4f2ea', R(0, y + 1.55, 0, { nuance: 0.03 }))
        .piece(new THREE.CylinderGeometry(Wb / 2, Wb / 2, L - 0.2, 14, 1, false, -PI / 2, PI), '#f4f2ea', { ...R(0, y + 2.72, 0), rx: -PI / 2, sx: 1, sy: 1, sz: 0.35, ordre: 'YXZ', nuance: 0.03 })
        .boite(Wb + 0.01, 0.3, L + 0.01, '#d8452e', R(0, y + 0.95, 0, { trait: false })).boite(Wb + 0.012, 0.08, L + 0.012, '#f0a03a', R(0, y + 1.16, 0, { trait: false }));
      for (const u of [-1, 1]) {
        a.boite(0.012, 0.72, L - 2.4, VITRE, R(u * (Wb / 2 + 0.006), y + 2.12, -0.55, { trait: false }));
        for (let k = 0; k <= 7; k++) a.boite(0.012, 0.74, 0.1, '#f4f2ea', R(u * (Wb / 2 + 0.012), y + 2.12, -0.55 - (L - 2.4) / 2 + (k * (L - 2.4)) / 7, { trait: false }));
      }
      a.boite(1.5, 0.6, 0.012, VITRE, R(0, y + 2.15, -L / 2 - 0.006, { trait: false }));
      a.boite(Wb - 0.18, 1.25, 0.012, VITRE, R(0, y + 2.0, L / 2 + 0.006, { trait: false })).boite(1.4, 0.2, 0.014, '#2a2420', R(0, y + 2.78, L / 2 + 0.008, { trait: false }))
        .boite(Wb + 0.06, 0.28, 0.14, '#3a3a40', R(0, y + 0.55, L / 2 + 0.04)).boite(0.012, 1.85, 0.9, VITRE, R(Wb / 2 + 0.008, y + 1.45, L / 2 - 0.75, { trait: false }));
      for (const u of [-1, 1]) a.boite(0.34, 0.14, 0.02, '#f6e8b0', R(u * 0.85, y + 0.98, L / 2 + 0.01, { trait: false }));
      ecrire({ ...R(0, y, L / 2 + 0.016), ry: PI / 2 }, { texte: '鵜戸神宮', x: 0, y: 2.78, z: 0, l: 1.2, h: 0.16, fond: null, encre: '#ffb04a' });
      for (const [u, v] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        a.boite(0.04, 0.6, 1.25, '#2a2a30', R(u * (Wb / 2 + 0.002), y + 0.62, v * (L / 2 - 1.8), { trait: false }))
          .cylindre(0.48, 0.48, 0.3, 14, '#26262a', R(u * (Wb / 2 - 0.12), y + 0.48, v * (L / 2 - 1.8), { rz: PI / 2 })).cylindre(0.24, 0.24, 0.31, 10, '#9aa0a6', R(u * (Wb / 2 - 0.12), y + 0.48, v * (L / 2 - 1.8), { rz: PI / 2, trait: false }));
      }
      const C = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => R(u * (Wb / 2 + 0.3), 0, v * (L / 2 + 0.3)));
      for (let k = 0; k < 4; k++) monde.mur(C[k].x, C[k].z, C[(k + 1) % 4].x, C[(k + 1) % 4].z, 0.05);
    }
    // l'arrêt de bus : le poteau et son disque, l'horaire ; un banc
    {
      const { x, z } = ARRET;
      a.cylindre(0.04, 0.04, 2.5, 8, '#8a8f94', { x, y: y + 1.25, z }).cylindre(0.32, 0.32, 0.04, 20, '#f4f2ea', { x, y: y + 2.3, z: z - 0.06, rx: PI / 2 })
        .cylindre(0.3, 0.3, 0.05, 20, '#2f6aa8', { x, y: y + 2.3, z: z - 0.06, rx: PI / 2, trait: false }).boite(0.4, 0.55, 0.04, '#f4f2ea', { x, y: y + 1.45, z: z - 0.05 });
      a.cylindre(0.22, 0.26, 0.12, 10, BETON_FONCE, { x, y: y + 0.06, z });
      ecrire({ x, y, z: z - 0.09, ry: PI }, { texte: 'バス停', x: 0, y: 2.3, z: 0, l: 0.4, h: 0.12, fond: null, encre: '#ffffff' });
      ecrire({ x, y, z: z - 0.072, ry: PI }, { texte: '鵜戸神宮', x: 0, y: 1.6, z: 0, l: 0.34, h: 0.12, fond: null, encre: '#2a2420' });
      monde.cercle(x, z, 0.4);
      a.boite(1.5, 0.06, 0.4, P.bois, { x: x - 2.2, y: y + 0.44, z: z + 0.2 }).boite(1.5, 0.3, 0.05, P.bois, { x: x - 2.2, y: y + 0.72, z: z + 0.42 });
      for (const u of [-1, 1]) a.boite(0.05, 0.44, 0.38, '#8a8f94', { x: x - 2.2 + u * 0.65, y: y + 0.22, z: z + 0.2 });
      bancs.push({ de: [x - 2.85, z + 0.2], a: [x - 1.55, z + 0.2], y: y + 0.47, cap: PI });
      murRect(repere(x - 2.2, z + 0.26, 0), 0.75, 0.22);
    }
    // la haie du parking (un muret de pierre, la haie taillée dessus), sur ses trois côtés
    const haie = (pts) => {
      muret(pts, 0.35, { mousse: false });
      for (let i = 0; i + 1 < pts.length; i++) {
        const [xa, za] = pts[i], [xb, zb] = pts[i + 1], l = Math.hypot(xb - xa, zb - za), n = Math.max(1, Math.round(l / 0.8));
        for (let k = 0; k <= n; k++) { const f = k / n, x = xa + (xb - xa) * f, z = za + (zb - za) * f; a.houppe(0.48, '#4f7d3c', { x, y: terrain(x, z) + 0.72, z, sy: 0.75, sorte: 'buisson' }, 1); }
      }
    };
    haie([[RUE.x0 - 0.05, Pk.z0 - 0.5], [Pk.x0 - 0.5, Pk.z0 - 0.5], [Pk.x0 - 0.5, Pk.z1 + 0.5], [RUE.x0 - 0.05, Pk.z1 + 0.5]]);
    // des palmiers éventail au bord du parking
    for (const [x, z, h] of [[Pk.x0 - 1.6, Pk.z0 + 2, 9.5], [Pk.x0 - 1.8, Pk.z1 - 3, 11], [RUE.x0 - 2.2, Pk.z1 + 2.0, 10]]) palmier(a, x, terrain(x, z), z, h, true);
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Le Hatchōzaka (八丁坂) et le port de Fukei (吹毛井港)
  // Le vieil escalier des pèlerins, de la place du Shinmon jusqu'au port, entre deux murets de pierre ; en bas, le quai de béton
  // au fond de la crique : ses bittes d'amarrage et leur grosse corde au bord de l'eau, la remise des pêcheurs, les filets, les
  // bouées, les caisses ; le bateau du batelier (celui de Yakushima) amarré au quai, d'autres barques ; la digue et son phare.
  {
    const E = HATCHO, xg = E.x - E.demi - 0.3 - 0.225, xd = E.x + E.demi + 0.3 + 0.225;
    for (const xm of [xg, xd]) muret([[xm, PLACE.z0 - 0.3], [xm, E.z1 + 0.15]], 0.6, { yAt: (x, z) => yLigneEsc(E, Math.max(E.z1, Math.min(E.z0, z))) });
  }
  const BATEAU = { x: -40.6, z: QUAI.z0 - 2.1, cap: -PI / 2, L: 8.4 };
  const BATELIER = { x: -40.4, z: QUAI.z0 + 0.95, cap: PI };
  {
    const a = atelier(), Q = QUAI, y = Y_PORT;
    // le bord du quai : sa face de béton dans l'eau, la bordure, les pneus pendus (les défenses), les bittes et la corde
    a.boite(Q.x1 - Q.x0, y + 2.6, 0.7, BETON, { x: (Q.x0 + Q.x1) / 2, y: (y - 2.6) / 2, z: Q.z0 - 0.3, nuance: 0.05 });
    a.boite(Q.x1 - Q.x0, 0.22, 0.42, '#c9c4b8', { x: (Q.x0 + Q.x1) / 2, y: y + 0.08, z: Q.z0 + 0.2, nuance: 0.04 });
    const bittes = [];
    for (let x = Q.x0 + 1.2; x <= Q.x1 - 1.0; x += 3.6) {
      a.cylindre(0.16, 0.2, 0.42, 10, '#2e2e32', { x, y: y + 0.4, z: Q.z0 + 0.2 }).cylindre(0.24, 0.24, 0.08, 10, '#2e2e32', { x, y: y + 0.62, z: Q.z0 + 0.2 });
      bittes.push(x);
    }
    for (let i = 0; i + 1 < bittes.length; i++) {
      const x0 = bittes[i], x1 = bittes[i + 1], m = (x0 + x1) / 2;
      a.tube([[x0, y + 0.52, Q.z0 + 0.2], [m, y + 0.3, Q.z0 + 0.2], [x1, y + 0.52, Q.z0 + 0.2]], 0.025, '#d8c48a', { cotes: 5, pas: 8 });
    }
    monde.mur(Q.x0, Q.z0 + 0.2, Q.x1, Q.z0 + 0.2, 0.32);
    for (let x = Q.x0 + 3; x < Q.x1 - 2; x += 2.4) if (Math.abs(x - BATEAU.x) < 5) a.anneau(0.32, 0.12, '#1e1e22', { x, y: y - 0.45, z: Q.z0 - 0.7, ry: 0 });
    // le fond du quai : un muret de béton (le pied de la pente), ouvert sur le Hatchōzaka ; aux deux bouts, le muret et les rochers
    const zs = Q.z1 + 0.42, oH = HATCHO.demi + 0.3 + 0.45;
    for (const [x0, x1] of [[Q.x0 + 7.8, HATCHO.x - oH], [HATCHO.x + oH, Q.x1]]) {
      a.boite(x1 - x0, 1.0, 0.36, BETON_FONCE, { x: (x0 + x1) / 2, y: y + 0.3, z: zs, nuance: 0.05 });
      monde.mur(x0, zs, x1, zs, 0.45);
    }
    for (const xb of [Q.x0 - 0.3, Q.x1 + 0.3]) {
      a.boite(0.36, 1.0, Q.z1 - Q.z0 + 0.6, BETON_FONCE, { x: xb, y: y + 0.3, z: (Q.z0 + Q.z1) / 2, nuance: 0.05 });
      monde.mur(xb, Q.z0, xb, Q.z1 + 0.4, 0.45);
    }
    // la remise des pêcheurs (漁協の倉庫) au bout ouest : tôle ondulée, la porte roulante, l'enseigne ; dehors, la pile de filets
    {
      const R = repere(Q.x0 + 3.9, Q.z1 - 1.4, PI), Wr = 7.2, Dr = 5.0;
      a.boite(Wr, 3.2, Dr, '#9aa4a8', R(0, y + 1.6, 0, { nuance: 0.04 }));
      for (let k = 0; k < 24; k++) a.boite(0.06, 3.2, 0.02, '#8a949a', R(-Wr / 2 + 0.15 + k * (Wr - 0.3) / 23, y + 1.6, Dr / 2 + 0.012, { trait: false }));
      a.boite(3.0, 2.6, 0.03, '#b8bec2', R(-1.2, y + 1.3, Dr / 2 + 0.03, { trait: false }));
      for (let k = 0; k < 13; k++) a.boite(3.0, 0.02, 0.012, '#9aa0a4', R(-1.2, y + 0.1 + k * 0.2, Dr / 2 + 0.05, { trait: false }));
      a.pignon(Wr + 0.5, 0.8, Dr + 0.6, '#6f7a80', R(0, y + 3.2, 0));
      a.boite(2.6, 0.5, 0.04, '#f4efe2', R(2.0, y + 2.6, Dr / 2 + 0.03));
      ecrire({ ...R(2.0, y, Dr / 2 + 0.055), ry: 0 }, { texte: '吹毛井漁港', x: 0, y: 2.6, z: 0, l: 2.3, h: 0.4, fond: null, encre: '#2a4a7a' });
      monde.surface(Q.x0 + 0.3 - 0.27, Q.x0 + 7.5 + 0.27, Q.z1 - 1.4 - Dr / 2 - 0.27, Q.z1 + 2, y + 3.6, { plein: true });
      monde.bloc(Q.x0 + 0.3, Q.x0 + 7.5, Q.z1 - 1.4 - Dr / 2, Q.z1 + 1.2, y - 1, y + 4.2);
      lumieres.push({ ...R(2.0, y + 2.9, Dr / 2 + 0.5), halo: 0.3, sol: y, r: 3.2, c: '#fff2d0' });
      a.boite(0.3, 0.12, 0.2, '#fff8e0', R(2.0, y + 2.95, Dr / 2 + 0.12, { sorte: 'lumiere', trait: false }));
    }
    // les filets verts en tas, les bouées orange, les caisses de poisson bleues et jaunes (rangées contre le muret du fond)
    {
      const xf = -32.6, zf = Q.z1 - 0.95;
      a.ovale(0.9, '#3f7a5a', { x: xf, y: y + 0.3, z: zf, sx: 1.4, sy: 0.45, sz: 0.8 }, 10).ovale(0.6, '#4f8a6a', { x: xf + 0.5, y: y + 0.55, z: zf + 0.1, sx: 1.2, sy: 0.5, sz: 0.8 }, 8);
      for (let k = 0; k < 7; k++) a.boule(0.18, k % 3 ? '#f08a2a' : '#f4f0e6', { x: xf - 1.6 + (k % 4) * 0.36, y: y + 0.18 + Math.floor(k / 4) * 0.3, z: zf + 0.2 * (k % 2) }, 1);
      // (des ronds, comme le tas : un rectangle laissait ses coins loin de lui)
      for (const [x, z, r] of [[xf - 0.6, zf, 0.95], [xf + 0.6, zf, 0.95], [xf - 1.06, zf + 0.1, 0.86]]) monde.cercle(x, z, r);
      const xc = -48.4;
      for (let k = 0; k < 9; k++) a.boite(0.62, 0.28, 0.42, k % 3 ? '#2f6ab0' : '#f2c443', { x: xc + (k % 3) * 0.66, y: y + 0.14 + Math.floor(k / 3) * 0.29, z: Q.z1 - 0.55, nuance: 0.03 });
      murRect(repere(xc + 0.66, Q.z1 - 0.55, 0), 1.0, 0.22);
    }
    poser(a.fin(), 0, 0, { y: 0 });
  }
  /**
   * Un bateau de pêche (漁船) dans le repère R (la proue vers +z) : la coque blanche qui s'affine et se relève vers la proue, sa
   * bande bleue, le fond rouge sous la ligne de flottaison, le pont, la timonerie et ses vitres, le mât et son drapeau, les
   * feux ; s = la taille (1 : 8,4 m).
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
    a.boite(W - 0.2 * s, 0.06, L * 0.62, '#9a8a72', R(0, 0.72 * s, -L * 0.12, { trait: false }));
    // la timonerie, à l'arrière ; ses vitres sombres ; le toit ; le mât, ses antennes, son drapeau de pêche (大漁旗)
    a.boite(1.7 * s, 1.5 * s, 1.9 * s, '#f4f2ea', R(0, 1.45 * s, -L * 0.22)).boite(1.72 * s, 0.5 * s, 1.92 * s, '#2b3640', R(0, 1.85 * s, -L * 0.22, { trait: false }))
      .boite(1.9 * s, 0.1, 2.1 * s, c, R(0, 2.25 * s, -L * 0.22));
    a.cylindre(0.05 * s, 0.06 * s, 3.2 * s, 6, '#d8d8d4', R(0, 3.3 * s, -L * 0.22 + 0.4 * s)).cylindre(0.03, 0.03, 1.2 * s, 5, '#d8d8d4', R(0.4 * s, 2.9 * s, -L * 0.22 - 0.5 * s));
    a.boite(0.012, 0.6 * s, 0.95 * s, '#e8583e', R(0, 4.4 * s, -L * 0.22 - 0.05 * s, { trait: false })).boite(0.012, 0.25 * s, 0.6 * s, '#f2c443', R(0.02, 4.42 * s, -L * 0.22 - 0.05 * s, { trait: false }));
    a.boule(0.07 * s, '#f4f0e6', R(0, 4.95 * s, -L * 0.22 + 0.4 * s), 0);
    // le bastingage bas et la proue relevée ; une bouée orange sur la timonerie
    a.anneau(0.22 * s, 0.06 * s, '#f08a2a', R(0.86 * s, 1.5 * s, -L * 0.22, { ry: PI / 2 }));
  };
  // le bateau du batelier, amarré le long du quai (sa proue vers l'ouest) ; ses amarres
  const objetBateau = (() => {
    const objet = new THREE.Group(), a = atelier();
    bateau(a, repere(0, 0, 0), 1, '#2f6ab0');
    const m = ctx.maillage(a.fin());
    objet.add(m);
    objet.position.set(BATEAU.x, 0.02, BATEAU.z);
    objet.rotation.y = BATEAU.cap;
    return objet;
  })();
  {
    const a = atelier();
    // (par-dessus le coin du quai, puis le plat-bord : tirées droit, elles passaient dans le béton)
    for (const dx of [-3.4, 3.2]) {
      a.tube([[BATEAU.x + dx, Y_PORT + 0.55, QUAI.z0 + 0.2], [BATEAU.x + dx * 1.03, Y_PORT + 0.13, QUAI.z0 - 0.7], [BATEAU.x + dx * 1.05, 0.98, QUAI.z0 - 0.98],
        [BATEAU.x + dx * 0.9, 0.95, BATEAU.z + 0.9]], 0.022, '#d8c48a', { cotes: 5, pas: 12 });
    }
    // deux autres barques de pêche, plus loin le long du quai (30 cm de sa face : à 1,25 m du bord, leur flanc entrait dans le
    // béton), et une au milieu de la crique
    bateau(a, repere(-54.2, QUAI.z0 - 1.75, -PI / 2), 0.66, '#3a8a5a');
    bateau(a, repere(-31.0, QUAI.z0 - 1.75, PI / 2), 0.62, '#c8402c');
    bateau(a, repere(-46.0, -42.0, 0.6), 0.7, '#2f6ab0');
    poser(a.fin(), 0, 0, { y: 0.02 });
  }
  animes.push({
    objet: objetBateau,
    // (le bateau du batelier se balance un peu sur l'eau)
    maj(dt, temps) { objetBateau.position.y = 0.02 + 0.05 * Math.sin(temps * 1.1); objetBateau.rotation.z = 0.02 * Math.sin(temps * 0.8 + 1); objetBateau.rotation.x = 0.012 * Math.sin(temps * 0.7); return []; },
  });
  // la digue à l'entrée de la crique : un long môle de béton, ses blocs (テトラポッド), le petit phare rouge au bout
  {
    const a = atelier(), x0 = -25.4, z0 = -44, x1 = -44, z1 = -52.5, l = Math.hypot(x1 - x0, z1 - z0), ang = Math.atan2(x1 - x0, z1 - z0);
    a.boite(2.2, 3.6, l, BETON, { x: (x0 + x1) / 2, y: 0.4, z: (z0 + z1) / 2, ry: ang, nuance: 0.05 });
    for (let k = 0; k < 18; k++) {
      const f = (k + 0.5) / 18, x = x0 + (x1 - x0) * f, z = z0 + (z1 - z0) * f, nx = Math.cos(ang), nz = -Math.sin(ang);
      for (const sg of [-1, 1]) {
        const q = [x + nx * sg * 1.9, z + nz * sg * 1.9];
        for (let j = 0; j < 4; j++) a.cylindre(0.18, 0.32, 1.1, 6, '#c2bdb2', { x: q[0], y: 0.5, z: q[1], rx: (j - 1.5) * 0.9 + hasard(k, sg), rz: j * 1.6, trait: false });
      }
    }
    a.cylindre(0.55, 0.65, 4.2, 12, '#e8442e', { x: x1, y: 4.2, z: z1 }).cylindre(0.62, 0.62, 0.5, 12, '#f4f2ea', { x: x1, y: 2.4, z: z1 })
      .cylindre(0.4, 0.4, 0.7, 10, '#3a3a40', { x: x1, y: 6.6, z: z1 }).cone(0.5, 0.5, 10, '#e8442e', { x: x1, y: 7.2, z: z1 });
    lumieres.push({ x: x1, y: 6.6, z: z1, halo: 0.6, sol: 2.2, r: 3, c: '#ff6a4a' });
    poser(a.fin(), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Le dessus de la grotte, la forêt de la crête
  // Le sol de la grotte est creusé à plat dans le relief : vu d'en haut, la crête y avait un trou (par où l'on voyait l'envers de
  // la voûte). Un couvercle la referme : le sol de la crête (terre, sans la grotte) sur chaque case de 25 cm qui touche le sol de
  // la grotte, derrière la falaise, 5 cm au-dessus du sol dessiné autour (2 cm de plus que lui).
  const solNaturel = (x, z) => (solGrotte(x, z) ? terre(x, z) : terrain(x, z));
  {
    const pos = [], cols = [], q = 0.25, X0 = Math.floor((X_SALLE - GROTTE.prof - 2) / q) * q, X1 = X_GROTTE + 2, Z0 = GROTTE.z - GROTTE.large - 2.5, Z1 = GROTTE.z + GROTTE.large + 2.5;
    for (let x = X0; x < X1; x += q) for (let z = Z0; z < Z1; z += q) {
      const coins = [[x, z], [x + q, z], [x + q, z + q], [x, z + q]];
      if (!coins.some(([cx, cz]) => solGrotte(cx, cz)) || coins.some(([cx, cz]) => cx > xParoi(cz) - 0.6)) continue;
      const [A, B, C, D] = coins.map(([cx, cz]) => [cx, terre(cx, cz) + 0.05, cz]), c = bruitDoux(x * 0.5, z * 0.5, 1) > 0.5 ? '#4b6539' : '#557a3a';
      tri(pos, cols, A, B, C, c, [0, 1, 0]);
      tri(pos, cols, A, C, D, c, [0, 1, 0]);
    }
    const a = atelier(), g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    a.piece(g, '#557a3a', { couleurs: cols, nuance: 0.04, trait: false });
    poser(a.fin(), 0, 0, { y: 0, trait: false });
  }
  /** Loin de tout ce qui est bâti et de là où l'on marche : peut-on planter en x, z (rayon r) ? */
  const OBSTACLES = [PARKING, RUE, PLACE, ALLEE, LANTERNES, POINTE, TERRASSE, INARI, QUAI, { x0: -2.6, x1: 2.6, z0: -5, z1: 5 }, { x0: -28.6, x1: -24.2, z0: -9.8, z1: 9.8 },
    { x0: -42, x1: -33, z0: 9, z1: 15 }, { x0: -60.5, x1: -51.5, z0: -31.5, z1: -24.5 }, { x0: -84.3, x1: -45.7, z0: -12.6, z1: 12.6 }];
  const libre = (x, z, r) => {
    if (OBSTACLES.some((o) => versRect(o, x, z) < r + 1.2)) return false;
    // (le palier d'Inari et son escalier : leurs couronnes bouchaient la vue de la caméra derrière le voyageur)
    if (r > 1 && (versRect(INARI, x, z) < r + 3.8 || (Math.abs(x - INARI_ESC.x) < INARI_ESC.demi + r + 3.2 && z < INARI_ESC.z0 + 2 && z > INARI_ESC.z1 - 2))) return false;
    if (ESCALIERS.some((E) => surEsc(E, x, z, r + 1.6))) return false;
    if (Math.abs(z - PONT.z) < r + 2.2 && x > PONT.x0 - 1 && x < PONT.x1 + 1) return false;
    if (aLaPlace(RECOIN, x, z) < r + 0.6 || (x > xParoi(z) - 1.2 && z < -8 && z > -48)) return false;
    return cote(x, z) > 2.5 + r;
  };
  {
    // la forêt persistante de la crête et de ses flancs (camphriers, chênes verts, tabunoki) : des arbres touffus près des chemins,
    // des bouquets de houppiers plus loin ; sous eux, des buissons et des fougères
    const VERTS = ['#3f6a34', '#4a7a3c', '#36602e', '#557f3f', '#2f5a2a'];
    for (let i = 0; i < 1400; i++) {
      const x = -34 + 58 * hasard(i, 61), z = -56 + 54 * hasard(62, i);
      if (crete(x, z) < 0.8 && !(z < -28 && x > -26)) continue;
      if (!libre(x, z, 1.2)) continue;
      const y = solNaturel(x, z), pres = Math.min(versRect(ALLEE, x, z), versRect(INARI, x, z), versRect(TERRASSE, x, z), versRect(LANTERNES, x, z)) < 14;
      if (hasard(i, 63) > (pres ? 0.42 : 0.3)) continue;
      const a = morceau(x, z, pres ? 25 : 60), h = 6.5 + 4 * hasard(i, 64);
      if (pres) a.arbreTouffu(x, z, h, [VERTS[i % 5], VERTS[(i + 2) % 5]], { y: y - 0.1, graine: i, sorte: 'persistant' });
      else {
        const r = 2.2 + 1.2 * hasard(i, 65);
        a.fut([x, y - 0.3, z], [x, y + h * 0.45, z], 0.18, 0.12, '#5a4a3a', 5).houppe(r, VERTS[i % 5], { x, y: y + h * 0.45 + r * 0.55, z, sy: 0.85, sorte: 'persistant' }, 1);
      }
    }
    // le sous-bois et le bord des chemins : des buissons ronds (tobira, 海桐), des fougères, des cycas
    for (let i = 0; i < 900; i++) {
      const x = -96 + 148 * hasard(i, 71), z = -50 + 66 * hasard(72, i);
      if (!libre(x, z, 0.5)) continue;
      const y = solNaturel(x, z), a = morceau(x, z), k = hasard(i, 73);
      if (k < 0.18) { sotetsu(a, x, y, z, 0.8 + 0.5 * hasard(i, 74)); continue; }
      if (k > 0.55 && bruitDoux(x * 0.12, z * 0.12, 3) < 0.45) continue;
      const r = 0.5 + 0.4 * hasard(i, 75);
      a.buisson(x, y + r * 0.42, z, r, ['#4f7a3c', '#5a8642', '#46703a', '#628c48'][i % 4], { touffu: true, sorte: 'persistant' });
    }
    // des palmiers des Canaries et des palmiers éventail sur le cap, quelques pins noirs couchés par le vent au bord des falaises
    for (const [x, z, h, ev] of [[-12.0, 8.0, 7.0, false], [-2.0, 5.4, 6.0, false], [8.0, 5.0, 7.5, false], [30.0, 8.0, 6.5, false], [42.0, 6.0, 7.0, false], [38.0, -6.0, 6.0, false],
      [-58.0, 15.0, 9.5, true], [-70.0, 16.0, 11.0, true], [-64.0, -18.0, 10.0, true], [-50.0, -20.0, 8.5, false], [36.0, -16.0, 5.5, false], [42.0, -14.0, 6.5, false]]) {
      if (!libre(x, z, 0.8)) continue;
      palmier(morceau(x, z), x, solNaturel(x, z), z, h, ev);
    }
  }
  {
    // au loin : la forêt des collines du pays, sans trait, par morceaux de 120 m (des bouquets de houppiers, posés au plus bas
    // du sol sous eux) ; la côte au nord et au sud
    const VERTS = ['#3f6a34', '#4a7a3c', '#36602e', '#557f3f', '#2f5a2a'];
    for (let i = 0; i < 2200; i++) {
      const x = -700 + 820 * hasard(i, 31), z = -620 + 1240 * hasard(32, i), dc = Math.hypot(x + 20, z);
      if (dc < 75 || (dc > 420 && hasard(i, 34) < 0.5) || cote(x, z) < 8 || (x > -110 && Math.abs(z) < 60)) continue;
      const pres = dc < 200, n = pres ? 3 : dc < 420 ? 2 : 1, r = (pres ? 2.4 : 3.3) + 1.6 * hasard(i, 33), a = morceau(x, z, 120), fin = pres ? 1 : 0;
      let y = terrain(x, z);
      for (let k = 0; k < (n > 1 ? 4 : 2); k++) y = Math.min(y, terrain(x + Math.cos(k * PI / 2) * r * 0.85, z + Math.sin(k * PI / 2) * r * 0.85));
      for (let k = 0; k < n; k++) {
        const t = hasard(i, 40 + k) * 2 * PI, e = k ? r * 0.8 : 0, rk = r * (k ? 0.68 + 0.2 * hasard(k, i) : 1);
        a.houppe(rk, VERTS[(i + k) % 5], { x: x + Math.cos(t) * e, y: y + rk * (k ? 0.45 : 0.62), z: z + Math.sin(t) * e, sy: 0.86, sorte: 'persistant' }, fin);
      }
    }
  }
  // les bateaux de pêche au large, qui tournent lentement
  const mer = (() => {
    const objet = new THREE.Group(), bateaux = [];
    for (const [cx, cz, r, v, s] of [[140, -120, 70, 0.012, 1], [180, 60, 90, -0.009, 1.1], [320, -260, 100, 0.007, 1.2], [260, 220, 110, -0.006, 1.3], [420, 0, 130, 0.005, 1.4]]) {
      const a = atelier();
      bateau(a, repere(0, 0, 0), 1.1, '#2f6ab0');
      const m = ctx.maillage(a.fin(0, false));
      m.scale.setScalar(s);
      objet.add(m);
      bateaux.push({ m, cx, cz, r, v, t: hasard(cx, cz) * 6.28 });
    }
    return {
      objet,
      maj(dt, temps) {
        for (const b of bateaux) {
          b.t += dt * b.v;
          b.m.position.set(b.cx + Math.cos(b.t) * b.r, -0.1 + 0.12 * Math.sin(temps * 1.3 + b.cx), b.cz + Math.sin(b.t) * b.r);
          b.m.rotation.set(0.03 * Math.sin(temps * 0.9 + b.cz), -b.t + (b.v > 0 ? 0 : PI), 0.04 * Math.sin(temps * 1.1));
        }
        return [];
      },
    };
  })();
  animes.push(mer);

  // ---------------------------------------------------------------- Les boules de chance (運玉) : la cible, la boule qui vole
  // Au bord de la terrasse, face au rocher de la tortue : un cercle doré glisse d'un bout à l'autre du dos du rocher ; A quand il
  // est sur le creux. La boule vole jusqu'au cercle ; dans le creux, elle y reste ; sinon, elle rebondit et tombe dans la mer.
  const undama = (() => {
    const objet = new THREE.Group(), K = KAMEISHI;
    const cible = new THREE.Mesh(new THREE.RingGeometry(0.24, 0.36, 28), new THREE.MeshBasicMaterial({ color: '#ffd76a', transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide }));
    cible.rotation.x = -PI / 2;
    cible.renderOrder = 4;
    const geo = new THREE.SphereGeometry(0.11, 12, 8), mat = new THREE.MeshLambertMaterial({ color: '#d8b88a' });
    const boule = new THREE.Mesh(geo, mat);
    objet.add(cible, boule);
    cible.visible = boule.visible = false;
    let actif = false, t = 0, vol = null, restees = 0;
    const position = () => K.z + 1.75 * Math.sin(t * 1.7);
    return {
      objet,
      jouer(oui) { actif = oui; cible.visible = oui; t = 0; },
      /** Lance une boule depuis la main (x, y, z) : se résout à l'arrivée, avec 'dedans' ou 'rate'. */
      lancer(main) {
        const z = position(), ecart = z - K.z, issue = Math.abs(ecart) < 0.34 ? 'dedans' : 'rate';
        const vers = issue === 'dedans' ? [K.x - 0.05, K.y + 0.1, K.z + ecart * 0.4] : [K.x - 0.25, K.y + 0.12, z];
        return new Promise((fin) => { vol = { de: main, vers, t: 0, issue, fin, v: [0, 0, 0] }; boule.visible = true; });
      },
      maj(dt) {
        if (actif) { t += dt; cible.position.set(K.x - 0.1, K.y + 0.16, position()); cible.material.opacity = 0.6 + 0.3 * Math.sin(t * 9); }
        if (vol) {
          const { de, vers } = vol;
          if (vol.t < 1) {
            vol.t = Math.min(1, vol.t + dt / 0.95);
            const u = vol.t;
            boule.position.set(de[0] + (vers[0] - de[0]) * u, de[1] + (vers[1] - de[1]) * u + 1.6 * Math.sin(u * PI), de[2] + (vers[2] - de[2]) * u);
            if (u >= 1 && vol.issue === 'rate') vol.v = [1.4, 1.6, (hasard(t, 2) - 0.5) * 1.2];
          } else if (vol.issue === 'rate' && boule.position.y > -0.4) {
            // (ratée : elle rebondit sur la roche et tombe dans la mer)
            vol.v[1] -= 9.8 * dt;
            boule.position.x += vol.v[0] * dt; boule.position.y += vol.v[1] * dt; boule.position.z += vol.v[2] * dt;
          } else {
            const f = vol.fin, issue = vol.issue;
            if (issue === 'dedans' && restees < 6) {
              // (elle reste dans le creux, avec les autres)
              const m = new THREE.Mesh(geo, mat);
              m.position.set(K.x - 0.12 + (restees % 3) * 0.1, K.y + 0.07, K.z - 0.1 + Math.floor(restees / 3) * 0.12);
              objet.add(m);
              restees++;
            }
            vol = null;
            boule.visible = false;
            f(issue);
          }
        }
        return [];
      },
    };
  })();
  animes.push(undama);
  // la plaquette en lapin du voyageur, pendue au présentoir de la place (une fois le tampon pris, elle y reste)
  const emaVoyageur = (() => {
    const a = atelier(), Rr = repere(-31.2, PLACE.z1 - 0.15, PI), q = Rr(0.55, Y_ROUTE + 1.45, 0.07);
    a.ovale(0.085, '#fff2d6', { ...q, sx: 1.0, sy: 0.85, sz: 0.18 }, 8);
    a.ovale(0.024, '#fff2d6', { ...Rr(0.51, Y_ROUTE + 1.56, 0.07), sy: 3, sz: 0.45 }, 6).ovale(0.024, '#fff2d6', { ...Rr(0.59, Y_ROUTE + 1.56, 0.07), sy: 3, sz: 0.45 }, 6);
    a.boite(0.05, 0.015, 0.004, '#c8402c', Rr(0.55, Y_ROUTE + 1.43, 0.095, { trait: false }));
    const m = ctx.maillage(a.fin());
    m.visible = aLeTampon('udo', 'ema');
    const objet = new THREE.Group();
    objet.add(m);
    return { objet, pendre() { m.visible = true; }, maj: () => [] };
  })();
  animes.push(emaVoyageur);
  const comp = (jeu, cle) => jeu.dire(jeu.tx(cle)[jeu.compagnon], 'compagnon');
  /** Les cinq tampons sont-ils au carnet ? (le batelier de Yakushima n'emmène que ceux-là) */
  const tousLesTampons = (jeu) => infos.tampons.every((tp) => jeu.aTampon(tp.id));
  /** Un tampon gagné : le tampon, la ligne du compagnon (au cinquième, le compagnon pense au batelier du port : toutCompagnon). */
  const gagner = async (jeu, id, cle) => {
    if (jeu.aTampon(id)) return;
    // (le compagnon parle du tampon avant « tous les tampons » : sa phrase sur le bateau reste la dernière)
    await jeu.tampon(id, () => comp(jeu, cle));
  };

  // ---------------------------------------------------------------- Les gens
  const PEAU = P.peau, NOIR = '#2a2226';
  const JUYO = { x: -37.5, z: PLACE.z1 + 0.55 + 2.5 };
  const passants = [
    // la miko du bureau des porte-bonheur, derrière son comptoir (les plaquettes en lapin)
    { id: 'miko', x: JUYO.x + 0.6, z: JUYO.z - 1.75, cap: PI, tenue: { taille: 0.95, peau: '#f4d6c0', cheveux: NOIR, coiffure: 'queue', haut: '#f8f6f0', manches: 'kimono', col: '#f8f6f0', bas: { sorte: 'hakama', c: '#c8282c' }, chaussures: '#f4f0e6', semelle: '#c8a868' }, quand: 'jour' },
    // la vendeuse des bonbons « おちちあめ », dans la rue
    { id: 'vendeuse', x: -69.75, z: RUE.z0 - 0.62, cap: 0, tenue: { taille: 0.92, peau: '#f0c8a6', cheveux: '#3a2a22', coiffure: 'chignon', chapeau: { sorte: 'foulard', c: '#c8402c' }, haut: '#f4efe2', manches: 'longues', tablier: '#c8402c', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: '#3a3236', semelle: '#3a3236', yeux: 'plisses' }, quand: 'jour' },
    // la marchande des boules de chance, derrière le comptoir de son échoppe
    { id: 'echoppe', x: ECHOPPE.x - 0.4, z: ECHOPPE.z + 0.15, cap: PI, tenue: { taille: 0.9, peau: '#f0c8a6', cheveux: '#d8d4cc', coiffure: 'chignon', haut: '#5a7a9a', manches: 'longues', tablier: '#f4efe2', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: '#3a3236', semelle: '#3a3236', yeux: 'plisses' }, quand: 'jour' },
    // le prêtre (宮司), sur le parvis de la grotte : il fait venir le soir (les lanternes de la grotte), et rend le matin
    { id: 'kannushi', x: 17.4, z: GROTTE.z - 6.6, cap: -PI / 2 - 0.4, tenue: { taille: 1.0, peau: '#e8bf98', cheveux: '#3a3a3a', coiffure: 'court', chapeau: { sorte: 'eboshi', c: '#1e1e22' }, haut: '#f4f0e6', manches: 'kimono', col: '#f4f0e6', bas: { sorte: 'hakama', c: '#5a6a8a' }, chaussures: '#1e1e22', semelle: '#1e1e22', yeux: 'plisses' } },
    // la grand-mère qui prie pour sa petite-fille, qui attend un bébé (on vient à Udo pour les naissances)
    { id: 'obaa', x: 19.4, z: GROTTE.z - 1.6, cap: -PI / 2 + 0.25, tenue: { taille: 0.86, peau: '#f0c8a6', cheveux: '#d8d4cc', coiffure: 'chignon', haut: '#7a5a8a', manches: 'longues', bas: { sorte: 'pantalon', c: '#4a4a56' }, chaussures: '#3a3236', semelle: '#3a3236', yeux: 'plisses', canne: true }, quand: 'jour' },
    // deux jeunes mariés qui lancent leurs boules de chance (elle de la main droite, lui de la gauche)
    { id: 'mariee', x: 43.6, z: KAMEISHI.z - 3.4, cap: PI / 2 - 0.25, tenue: { taille: 0.95, peau: '#f2c9a8', cheveux: '#3a2a22', coiffure: 'chignon', haut: '#f59aa6', manches: 'courtes', bas: { sorte: 'jupe', c: '#f4efe2' }, chaussures: '#f4f0e6', semelle: '#3a3236' }, quand: 'jour' },
    { id: 'marie', x: 43.4, z: KAMEISHI.z + 4.6, cap: PI / 2 + 0.3, tenue: { taille: 1.06, peau: PEAU, cheveux: NOIR, coiffure: 'court', haut: '#3a5a8a', manches: 'longues', bas: { sorte: 'pantalon', c: '#d8cbb0' }, chaussures: '#5a4030', semelle: '#3a3236' }, quand: 'jour' },
    // un écolier de l'école d'Udo (ce sont eux qui façonnent les boules de chance), près de l'échoppe
    { id: 'ecolier', x: 35.6, z: ECHOPPE.z - 2.0, cap: PI / 2, tenue: { taille: 0.72, peau: PEAU, cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'ecolier', c: '#f2c443' }, haut: '#f4f0e6', manches: 'courtes', bas: { sorte: 'short', c: '#2f3a5a' }, chaussures: P.blanc, semelle: '#3a3236', sac: { sorte: 'dos', c: '#c8302c', c2: '#8a2a22' } }, quand: 'jour' },
    // @random_japan_place, qui filme la grotte depuis la terrasse (son TikTok)
    { id: 'videaste', x: 33.0, z: -39.8, cap: -PI / 2 + 0.35, tenue: { taille: 1.1, peau: PEAU, cheveux: '#3a2a20', coiffure: 'court', chapeau: { sorte: 'bob', c: '#2f3440' }, haut: '#2f3440', manches: 'courtes', bas: { sorte: 'pantalon', c: '#c9b48a' }, chaussures: P.blanc, semelle: '#3a3236', appareil: true } },
    // le photographe, en haut de l'escalier, au-dessus de la terrasse (la vue des cartes postales)
    { id: 'photographe', x: 32.0, z: POINTE.z0 + 0.8, cap: PI - 0.3, tenue: { taille: 1.04, peau: PEAU, cheveux: '#3a2a20', coiffure: 'court', chapeau: { sorte: 'bob', c: '#5a6a4a' }, haut: '#5a6a4a', manches: 'longues', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: '#3a3236', semelle: '#3a3236', appareil: true }, quand: 'jour' },
    // le gardien du sanctuaire d'Inari, qui balaie son palier
    { id: 'gardien', x: -15.6, z: INARI.z1 - 1.4, cap: 0.6, ronde: [[-15.6, INARI.z1 - 1.4], [-10.2, INARI.z1 - 1.6], [-15.6, INARI.z1 - 1.4], [-17.2, INARI.z1 - 2.6]], vitesse: 0.4, attente: [5, 11], tenue: { taille: 1.0, peau: '#e0b48c', cheveux: '#c8c4bc', coiffure: 'court', haut: '#f4f0e6', manches: 'kimono', col: '#f4f0e6', bas: { sorte: 'hakama', c: '#6a7a5a' }, chaussures: '#f4f0e6', semelle: '#c8a868', yeux: 'plisses', pose: 'balai' }, quand: 'jour' },
    // deux touristes sur le chemin des lanternes
    { id: 'touriste', x: 9.4, z: 1.4, cap: -PI / 2, tenue: { taille: 0.95, peau: '#f2c9a8', cheveux: '#3a2a22', coiffure: 'queue', chapeau: { sorte: 'soleil', c: '#f4efe2' }, haut: '#8ac4e8', manches: 'courtes', bas: { sorte: 'jupe', c: '#2f3a5a' }, chaussures: '#f4f0e6', semelle: '#3a3236', appareil: true }, quand: 'jour' },
    { id: 'touriste2', x: 10.6, z: 1.6, cap: -PI / 2 + 0.3, tenue: { taille: 1.06, peau: PEAU, cheveux: NOIR, coiffure: 'court', haut: '#3a6a5a', manches: 'courtes', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: P.blanc, semelle: '#3a3236' }, quand: 'jour' },
    // le batelier du port de Fukei, devant son bateau (celui de Yakushima) : il reste la nuit
    { id: 'batelier', x: BATELIER.x, z: BATELIER.z, cap: BATELIER.cap, tenue: { taille: 1.0, peau: '#d8a880', cheveux: '#5a5650', coiffure: 'court', chapeau: { sorte: 'bandeau', c: '#f4f0e6' }, haut: '#3a5a7a', manches: 'longues', tablier: '#e8a42a', bas: { sorte: 'pantalon', c: '#3a3f4a' }, chaussures: '#e8e4dc', semelle: '#2a2a30', yeux: 'plisses' } },
    // une pêcheuse qui trie les poissons, à côté des caisses
    { id: 'pecheuse', x: -46.6, z: QUAI.z1 - 1.5, cap: PI - 0.5, tenue: { taille: 0.88, peau: '#e8b890', cheveux: '#5a4a40', coiffure: 'chignon', chapeau: { sorte: 'foulard', c: '#3a6a5a' }, haut: '#c8783a', manches: 'longues', tablier: '#3a5a7a', bas: { sorte: 'pantalon', c: '#3a3a44' }, chaussures: '#e8e4dc', semelle: '#2a2a30', yeux: 'plisses' }, quand: 'jour' },
    // un randonneur qui monte et descend le vieil escalier des pèlerins
    { id: 'randonneur', x: HATCHO.x + 0.4, z: -12.0, cap: PI, ronde: [[HATCHO.x + 0.4, -12.0], [HATCHO.x + 0.4, -25.4], [HATCHO.x + 0.4, -12.0], [-40.0, -6.0]], vitesse: 0.55, attente: [6, 12], tenue: { taille: 1.08, peau: '#e8bf98', cheveux: '#3a2a20', coiffure: 'court', chapeau: { sorte: 'casquette', c: '#c8452e', c2: '#f4f0e6' }, haut: '#3a6a8a', manches: 'longues', bas: { sorte: 'pantalon', c: '#5a5a4a' }, chaussures: '#5a4a3a', semelle: '#3a3236', sac: { sorte: 'dos', c: '#c8783a', c2: '#8a4a2a' } }, quand: 'jour' },
    // le chauffeur du car
    { id: 'chauffeur', x: PARKING.x0 + 13.6, z: PARKING.z0 + 3.1, cap: -PI / 2, tenue: { taille: 1.02, peau: '#e8bf98', cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'casquette', c: '#2a3550', c2: '#2a3550' }, haut: '#f4f2ea', manches: 'longues', bas: { sorte: 'pantalon', c: '#2a3550' }, chaussures: '#1f1f24', semelle: '#1f1f24' }, quand: 'jour' },
  ];

  // ---------------------------------------------------------------- Ce qu'on peut faire (tout passe par `jeu`)
  const parler = (id) => ({ id, passant: id, verbe: 'parler', action: (jeu) => jeu.dire(jeu.txn(id), id) });
  const lire = (id, x, z, ry) => ({ id: `panneau-${id}`, x: x - Math.sin(ry) * 1.2, z: z - Math.cos(ry) * 1.2, rayon: 1.8, verbe: 'lire', vers: [x, z], action: (jeu) => jeu.dire(jeu.tx(`panneau-${id}`)) });
  const RI = repere((INARI.x0 + INARI.x1) / 2, INARI.z0 + 1.9, 0), TRONC_INARI = RI(0, 0, 1.6 + 0.7);
  const RH = repere(HONDEN.x, HONDEN.z, PI / 2), TRONC_HONDEN = RH(0, 0, HONDEN.lx / 2 + 2.15);
  const RU = repere(USAGI.x, USAGI.z, PI), DEVANT_USAGI = RU(0, 0, 2.0);
  const XO = OCHICHI.x - 1.15;
  const interactions = [
    {
      // la miko : une plaquette en forme de lapin (兎の絵馬), un vœu, et on la pend au présentoir (le tampon)
      id: 'miko', passant: 'miko', verbe: 'parler',
      async action(jeu) {
        if (jeu.aTampon('ema')) { await jeu.dire(jeu.txn('mikoApres'), 'miko'); return; }
        const r = await jeu.choisir(jeu.tx('miko'), [jeu.t('oui'), jeu.t('non')], 'miko');
        if (r !== 0) { await jeu.dire(jeu.tx('mikoNon'), 'miko'); return; }
        const v = await jeu.choisir(jeu.tx('emaVoeu'), jeu.tx('emaVoeux'));
        jeu.geste('offrir');
        jeu.son('pinceau');
        await jeu.attendre(1200);
        jeu.geste(null);
        await jeu.dire([jeu.tx('emaEcrit')[Math.max(0, v)]]);
        // (on la pend : le voyageur devant le présentoir, la caméra sur les lapins blancs)
        jeu.placer(-31.2 - 0.3, PLACE.z1 - 1.25, 0.25);
        jeu.cadrer({ de: [-28.9, Y_ROUTE + 1.75, PLACE.z1 - 2.6], vers: [-31.0, Y_ROUTE + 1.25, PLACE.z1 - 0.1], champ: 46 });
        jeu.geste('offrir');
        await jeu.attendre(700);
        emaVoyageur.pendre();
        jeu.son('papier');
        jeu.geste(null);
        await jeu.dire(jeu.tx('emaPendu'));
        jeu.cadrer(null);
        await gagner(jeu, 'ema', 'emaCompagnon');
      },
    },
    {
      // le sanctuaire d'Inari, en haut des torii : la cloche, deux battements de mains, la prière (le tampon)
      id: 'inari', x: TRONC_INARI.x, z: TRONC_INARI.z + 1.15, rayon: 1.7, haut: 1.4, verbe: 'prier', vers: [TRONC_INARI.x, TRONC_INARI.z - 0.6],
      async action(jeu) {
        jeu.cadrer({ de: [TRONC_INARI.x + 2.8, Y_INARI + 1.9, TRONC_INARI.z + 2.9], vers: [TRONC_INARI.x - 0.3, Y_INARI + 1.5, TRONC_INARI.z - 1.4], champ: 56 });
        jeu.son('cloche');
        jeu.geste('prier');
        await jeu.attendre(900);
        jeu.son('claque');
        await jeu.attendre(2200);
        jeu.geste(null);
        await jeu.dire(jeu.txn('inari'));
        jeu.cadrer(null);
        await gagner(jeu, 'inari', 'inariCompagnon');
      },
    },
    {
      // le lapin qu'on caresse (撫でうさぎ) : là où l'on veut guérir, ou devenir plus fort (le tampon)
      id: 'usagi', x: DEVANT_USAGI.x, z: DEVANT_USAGI.z, rayon: 1.6, haut: 1.2, verbe: 'caresser', vers: [USAGI.x, USAGI.z],
      async action(jeu) {
        const r = await jeu.choisir(jeu.tx('usagi'), jeu.tx('usagiChoix'));
        if (r < 0 || r > 3) return;
        jeu.cadrerDeCote(USAGI.x, Y_T + 1.0, USAGI.z, { distance: 3.4, haut: 1.4, champ: 50 });
        jeu.geste('offrir');
        jeu.son('magie');
        lueurLapin.briller();
        await jeu.attendre(1400);
        jeu.geste(null);
        await jeu.dire([jeu.tx('usagiCaresse')[r]]);
        jeu.cadrer(null);
        await gagner(jeu, 'usagi', 'usagiCompagnon');
      },
    },
    {
      // les rochers de la mère (お乳岩), au fond de la grotte, derrière le sanctuaire : une goutte dans le creux des mains
      id: 'ochichi', x: XO + 1.95, z: OCHICHI.z, rayon: 1.7, haut: 1.4, verbe: 'toucher', vers: [XO, OCHICHI.z],
      async action(jeu) {
        jeu.placer(XO + 1.75, OCHICHI.z + 0.1, -PI / 2);
        jeu.cadrer({ de: [XO + 3.6, Y_T + 1.9, OCHICHI.z + 2.6], vers: [XO + 0.5, Y_T + 1.3, OCHICHI.z], champ: 52 });
        await jeu.dire(jeu.tx('ochichiAvant'));
        jeu.geste('offrir');
        await jeu.attendre(1600);
        jeu.son('oiseau/goutte');
        await jeu.attendre(500);
        jeu.geste(null);
        await jeu.dire(jeu.tx('ochichi'));
        jeu.cadrer(null);
        await gagner(jeu, 'ochichi', 'ochichiCompagnon');
      },
    },
    {
      // les boules de chance (運玉) : cinq lancers vers le creux du rocher de la tortue (le tampon)
      id: 'undama', x: LANCEUR.x, z: LANCEUR.z, rayon: 1.8, haut: 1.6, verbe: 'lancer', vers: [KAMEISHI.x, KAMEISHI.z], si: (jeu) => jeu.aDansSac('undama'),
      async action(jeu) {
        const r = await jeu.choisir(jeu.tx('undamaPret'), [jeu.t('oui'), jeu.t('non')]);
        if (r !== 0) return;
        jeu.placer(LANCEUR.x, LANCEUR.z, Math.atan2(KAMEISHI.x - LANCEUR.x, KAMEISHI.z - LANCEUR.z));
        jeu.cadrer({ de: [LANCEUR.x - 2.4, Y_T + 2.5, LANCEUR.z + 1.3], vers: [KAMEISHI.x, KAMEISHI.y - 0.2, KAMEISHI.z], champ: 46 });
        undama.jouer(true);
        let reste = 5, dedans = false;
        jeu.aide(jeu.tx('undamaAide')(reste));
        await new Promise((fini) => {
          let enVol = false;
          jeu.capterAppuis(async () => {
            if (enVol || reste <= 0) return;
            enVol = true;
            reste--;
            jeu.geste('offrir');
            jeu.son('piece');
            const issue = await undama.lancer([LANCEUR.x + 0.3, Y_T + 1.35, LANCEUR.z]);
            jeu.son(issue === 'dedans' ? 'caillou' : 'tombe');
            jeu.geste(null);
            enVol = false;
            if (issue === 'dedans') { dedans = true; jeu.capterAppuis(null); fini(); return; }
            jeu.aide(reste > 0 ? jeu.tx('undamaRate')(reste) : jeu.tx('undamaAide')(0));
            if (reste <= 0) { jeu.capterAppuis(null); fini(); }
          });
        });
        undama.jouer(false);
        jeu.aide(null);
        jeu.prendre('undama');
        if (!dedans) { jeu.cadrer(null); await jeu.dire(jeu.tx('undamaPerdu')); return; }
        await jeu.dire(jeu.tx('undamaGagne'));
        jeu.cadrer(null);
        await gagner(jeu, 'undama', 'undamaCompagnon');
      },
    },
    { id: 'kameishi', x: LANCEUR.x, z: LANCEUR.z, rayon: 1.8, haut: 1.6, verbe: 'regarder', vers: [KAMEISHI.x, KAMEISHI.z], si: (jeu) => !jeu.aDansSac('undama'), action: (jeu) => jeu.dire(jeu.txn('kameishi')) },
    {
      // la marchande des boules de chance : cinq boules de terre (運玉)
      id: 'echoppe', passant: 'echoppe', verbe: 'parler',
      async action(jeu) {
        if (jeu.aDansSac('undama')) { await jeu.dire(jeu.tx('echoppeDeja'), 'echoppe'); return; }
        const r = await jeu.choisir(jeu.tx('echoppe'), [jeu.t('oui'), jeu.t('non')], 'echoppe');
        if (r !== 0) { await jeu.dire(jeu.tx('echoppeNon'), 'echoppe'); return; }
        jeu.donner('undama');
        jeu.son('papier');
        await jeu.dire(jeu.tx(jeu.estNuit ? 'echoppeNuit' : 'echoppeDonne'), 'echoppe');
      },
    },
    {
      // la vendeuse des bonbons du lait de la mère (おちちあめ)
      id: 'vendeuse', passant: 'vendeuse', verbe: 'parler',
      async action(jeu) {
        const r = await jeu.choisir(jeu.tx('vendeuse'), [jeu.t('oui'), jeu.t('non')], 'vendeuse');
        if (r !== 0) { await jeu.dire(jeu.tx('vendeuseNon'), 'vendeuse'); return; }
        jeu.son('papier');
        await jeu.dire(jeu.tx('ame'), 'vendeuse');
        await comp(jeu, 'ameCompagnon');
      },
    },
    {
      // le prêtre : il fait venir le soir (les lanternes de la grotte) ; la nuit, il rend le matin
      id: 'kannushi', passant: 'kannushi', verbe: 'parler',
      async action(jeu) {
        if (!jeu.estNuit) {
          await jeu.dire(jeu.tx('kannushi'), 'kannushi');
          // (la hutte de la naissance, tant que son toit n'est pas fini : un indice du secret)
          if (!secretTrouve('plumes')) await jeu.dire(jeu.tx('kannushiHutte'), 'kannushi');
          const r = await jeu.choisir(jeu.tx('kannushiSoir'), [jeu.t('oui'), jeu.t('non')], 'kannushi');
          if (r !== 0) { await jeu.dire(jeu.tx('kannushiNon'), 'kannushi'); return; }
          await jeu.nuit(true);
          await jeu.dire(jeu.tx('kannushiNuitTombe'), 'kannushi');
          return;
        }
        const r = await jeu.choisir(jeu.tx('kannushiNuit'), [jeu.t('oui'), jeu.t('non')], 'kannushi');
        if (r !== 0) { await jeu.dire(jeu.tx('kannushiReste'), 'kannushi'); return; }
        await jeu.nuit(false);
        await jeu.dire(jeu.tx('kannushiMatin'), 'kannushi');
      },
    },
    {
      // le batelier : il emmène à Yakushima ceux qui ont les cinq tampons d'Udo (la bénédiction du dieu de la mer)
      id: 'batelier', passant: 'batelier', verbe: 'parler',
      async action(jeu) {
        if (!tousLesTampons(jeu)) {
          const n = infos.tampons.filter((tp) => jeu.aTampon(tp.id)).length;
          await jeu.dire(jeu.txn('batelier'), 'batelier');
          await jeu.dire([jeu.tx('batelierReste')(5 - n)], 'batelier');
          return;
        }
        const r = await jeu.choisir(jeu.tx('batelierPret'), [jeu.t('oui'), jeu.t('non')], 'batelier');
        if (r !== 0) { await jeu.dire(jeu.tx('batelierAttend'), 'batelier'); return; }
        // (Yakushima n'est pas encore faite : le propriétaire, 2026-10-30, « on s'occupe de l'île Yakushima, qu'on fera ensemble après »)
        await jeu.dire(jeu.tx('batelierBientot'), 'batelier');
      },
    },
    { id: 'bateau', x: BATEAU.x + 2.6, z: QUAI.z0 + 0.6, rayon: 1.6, haut: 1.6, verbe: 'regarder', vers: [BATEAU.x, BATEAU.z], action: (jeu) => jeu.dire(jeu.txn('bateau')) },
    // le secret des plumes de cormoran : la hutte de la naissance, dans la grotte ; la regarder (son toit pas fini, combien de
    // plumes on a, où est la dernière) ; les trois en main, les y poser
    {
      id: 'hutte', x: HUTTE.x + 0.3, z: HUTTE.z + 1.75, y: Y_T, rayon: 1.9, haut: 1.4, verbe: 'regarder', vers: [HUTTE.x, HUTTE.z],
      si: () => etatPlumes().fini || etatPlumes().n < 3,
      async action(jeu) {
        if (secretTrouve('plumes')) { await jeu.dire(jeu.tx('hutteFinie')); return; }
        const n = ramassees(), premiere = !indiceVu('plumes');
        await jeu.dire(jeu.tx('hutte'));
        jeu.voirIndice('plumes');
        if (n === 0) { if (premiere) await comp(jeu, 'hutteCompagnon'); return; }
        await jeu.dire(jeu.tx('huttePlumes')(n));
        if (n === 2) await plumesSecret.montrer(jeu);
      },
    },
    {
      // les poser : chacune vole jusqu'au haut du toit et en finit un rang ; la hutte s'éclaire ; un cormoran paraît sur le
      // faîte, sèche ses ailes et s'envole par la grotte vers la mer ; le koban sort de la hutte
      id: 'hutte-plumes', x: HUTTE.x + 0.3, z: HUTTE.z + 1.75, y: Y_T, rayon: 1.9, haut: 1.4, verbe: 'poser', vers: [HUTTE.x, HUTTE.z],
      si: () => !etatPlumes().fini && etatPlumes().n >= 3,
      async action(jeu) {
        const r = await jeu.choisir(jeu.tx('hutteMettre'), [jeu.t('oui'), jeu.t('non')]);
        if (r !== 0) return;
        const xj = HUTTE.x + 0.3, zj = HUTTE.z + 1.75, vueHutte = { de: [HUTTE.x + 2.7, Y_T + 2.3, HUTTE.z + 3.3], vers: [HUTTE.x - 0.1, Y_T + 1.6, HUTTE.z + 0.1], champ: 56 };
        jeu.placer(xj, zj, PI);
        jeu.cadrer(vueHutte);
        await jeu.dire(jeu.tx('hutteMet'));
        jeu.geste('offrir');
        for (let k = 0; k < 3; k++) {
          await plumesSecret.voler(k, [xj, Y_T + 1.05, zj - 0.35], hutte.rang(3 + k));
          jeu.son('papier');
          const fait = hutte.finir(k + 1);
          if (k < 2) await jeu.attendre(450); else await fait;
        }
        jeu.geste(null);
        hutte.briller();
        jeu.son('magie');
        await jeu.attendre(1100);
        await jeu.dire(jeu.tx('hutteFin'));
        // (la caméra à l'ouest de la hutte, vers l'est : le faîte, le couloir, la bouche de la grotte et la mer au bout)
        const [fx, fy, fz] = hutte.faite;
        jeu.cadrer({ de: [HUTTE.x - 4.4, Y_T + 2.2, HUTTE.z + 2.3], vers: [HUTTE.x + 9, Y_T + 3.3, HUTTE.z + 3.2], champ: 60 });
        jeu.nuage(fx + 0.3, fy + 0.35, fz, 1);
        // (tourné vers la caméra : on voit ses ailes grandes ouvertes)
        cormoran.poser(fx + 0.3, fy, fz, -1.1);
        await jeu.attendre(900);
        cormoran.secher(true);
        await jeu.attendre(1800);
        cormoran.envol([[fx + 0.3, fy + 0.42, fz], [HUTTE.x + 2.0, fy + 1.1, HUTTE.z + 1.4], [16.5, Y_T + 4.4, HUTTE.z + 1.4], [22.4, Y_T + 4.6, HUTTE.z + 2.6], [30.0, Y_T + 5.4, -37.5], [44.0, Y_T + 6.5, -38.5], [62.0, 10.5, -43.0], [88.0, 15.0, -50.0]]);
        await jeu.attendre(4300);
        await comp(jeu, 'cormoranCompagnon');
        jeu.cadrer(vueHutte);
        await plumesSecret.koban([HUTTE.x + 0.25, Y_T + 0.55, HUTTE.z - 0.15], [xj, Y_T + 1.1, zj - 0.3]);
        // (la caméra reste sur la hutte pendant la carte du koban : derrière le voyageur, sous le toit de la grotte, elle venait
        // tout contre son chapeau)
        await jeu.trouverSecret('plumes');
        etatPlumes.oublier();
        jeu.cadrer(null);
      },
    },
    // les trois plumes : les ramasser. Devant la première, sans avoir vu la hutte, le compagnon dit ce que c'est et ce qu'on en
    // fait ; à la deuxième, on dit où est la dernière ; à la troisième, d'aller à la hutte
    ...PLUMES.map((p, k) => ({
      id: `plume-${p.id}`, x: p.x, z: p.z, y: monde.hauteur(p.x, p.z), rayon: 1.6, haut: 0.7, verbe: 'ramasser', vers: [p.x, p.z],
      si: () => !etatPlumes().pris[k] && !etatPlumes().fini,
      async action(jeu) {
        etatPlumes.oublier();
        jeu.cadrerDeCote(p.x, terrain(p.x, p.z), p.z, { distance: 3.2, haut: 1.2 });
        jeu.geste('creuser');
        await jeu.attendre(700);
        plumesSecret.ramasser(p.id);
        jeu.geste(null);
        // (à la deuxième et à la troisième, on dit ici où aller : l'anime ne doit pas le redire quand la scène finit)
        if (ramassees() >= 1) plumesSecret.vue = true;
        jeu.voirIndice(`plume-${p.id}`);
        etatPlumes.oublier();
        jeu.cadrer(null);
        const n = ramassees();
        await jeu.dire(jeu.tx('plumeRamassee')(n));
        if (n === 1) await comp(jeu, indiceVu('plumes') ? 'plumeCompagnon' : 'plumeInconnueCompagnon');
        jeu.voirIndice('plumes');
        if (n >= 2) { plumesSecret.vue = true; await plumesSecret.montrer(jeu); }
      },
    })),
    { id: 'honden', x: TRONC_HONDEN.x + 1.15, z: TRONC_HONDEN.z, rayon: 1.8, haut: 1.4, verbe: 'prier', vers: [TRONC_HONDEN.x, TRONC_HONDEN.z], async action(jeu) { jeu.son('cloche'); jeu.geste('prier'); await jeu.attendre(900); jeu.son('claque'); await jeu.attendre(2200); jeu.geste(null); await jeu.dire(jeu.txn('honden')); } },
    { id: 'oji', x: OJI.x, z: OJI.z - 2.3, rayon: 1.6, haut: 1.2, verbe: 'prier', vers: [OJI.x, OJI.z], async action(jeu) { jeu.geste('prier'); jeu.son('claque'); await jeu.attendre(2400); jeu.geste(null); await jeu.dire(jeu.tx('oji')); } },
    { id: 'voute', x: X_SALLE + 0.3, z: GROTTE.z - 3.0, rayon: 2.2, haut: 1.6, verbe: 'regarder', async action(jeu) { jeu.cadrer({ de: [X_SALLE + 0.8, Y_T + 1.5, GROTTE.z + 5.6], vers: [X_SALLE - 6, Y_T + 7.5, GROTTE.z - 1], champ: 64 }); await jeu.attendre(700); await jeu.dire(jeu.txn('voute')); jeu.cadrer(null); } },
    { id: 'torii-grotte', x: X_GROTTE + 2.2, z: GROTTE.z + 0.8, rayon: 1.8, haut: 2.6, verbe: 'regarder', vers: [TORII_GROTTE.x, GROTTE.z], action: (jeu) => jeu.dire(jeu.txn('toriiGrotte')) },
    { id: 'tamabashi', x: PONT.x0 - 1.4, z: 0.4, rayon: 1.6, haut: 1.6, verbe: 'regarder', vers: [(PONT.x0 + PONT.x1) / 2, PONT.z], action: (jeu) => jeu.dire(jeu.txn('tamabashi')) },
    { id: 'lanternes', x: 8.4, z: LANTERNES.z0 + 0.6, rayon: 1.7, haut: 1.8, verbe: 'regarder', vers: [8.4, -2.85], action: (jeu) => jeu.dire(jeu.txn('lanternes')) },
    { id: 'platier', x: 4.0, z: LANTERNES.z1 - 0.3, rayon: 1.8, haut: 1.4, verbe: 'regarder', vers: [-2, 18], action: (jeu) => jeu.dire(jeu.txn('platier')) },
    { id: 'romon', x: -9.0, z: 0.6, rayon: 1.8, haut: 2.6, verbe: 'regarder', vers: [0, 0], action: (jeu) => jeu.dire(jeu.txn('romon')) },
    { id: 'otorii', x: OTORII.x - 3.0, z: 0.6, rayon: 1.8, haut: 2.6, verbe: 'regarder', vers: [OTORII.x, 0], action: (jeu) => jeu.dire(jeu.txn('otorii')) },
    { id: 'vue-escalier', x: 29.0, z: POINTE.z0 + 0.5, rayon: 1.8, haut: 1.4, verbe: 'regarder', vers: [30, -30], async action(jeu) { jeu.cadrer({ de: [27.4, Y_POINTE + 2.6, POINTE.z0 + 1.6], vers: [30, Y_T + 1.0, -32], champ: 58 }); await jeu.attendre(700); await jeu.dire(jeu.txn('vueEscalier')); jeu.cadrer(null); } },
    { id: 'port', x: -36.0, z: PLACE.z0 + 0.6, rayon: 1.5, haut: 1.4, verbe: 'regarder', vers: [-42, -36], action: (jeu) => jeu.dire(jeu.txn('portVue')) },
    { id: 'chozuya', x: CHOZUYA.x + 1.3, z: CHOZUYA.z, rayon: 1.5, haut: 1.0, verbe: 'regarder', vers: [CHOZUYA.x, CHOZUYA.z], action: (jeu) => jeu.dire(jeu.tx('chozuya')) },
    lire('yuisho', -44.0, 4.6, PI / 2),
    lire('kameishi', 40.6, -37.6, PI / 2 + 0.3),
    // (2026-10-31 : « le panneau qui va vers le port, on ne peut pas le lire »)
    lire('hatcho', PANNEAU_HATCHO.x, PANNEAU_HATCHO.z, PI),
    { id: 'videaste', passant: 'videaste', verbe: 'parler', async action(jeu) { await jeu.dire(jeu.tx('videaste'), 'videaste'); await jeu.video(); } },
    parler('obaa'), parler('mariee'), parler('marie'), parler('ecolier'), parler('photographe'), parler('gardien'), parler('touriste'), parler('touriste2'), parler('pecheuse'), parler('randonneur'), parler('chauffeur'),
    ...interactionsBancs(bancs),
  ];
  // les deux panneaux de lecture : l'histoire du sanctuaire (由緒) sur la place, le rocher de la tortue (亀石) sur la terrasse
  for (const [id, x, z, ry, titre] of [['yuisho', -44.0, 4.6, PI / 2, '鵜戸神宮 由緒'], ['kameishi', 40.6, -37.6, PI / 2 + 0.3, '霊石 亀石 ・ 運玉']]) {
    const y = terrain(x, z), b = panneau(atelier(), P, { ecrit: true });
    poser(b.fin(), x, z, { y, ry });
    ecrire({ x, y, z, ry }, { ...PAPIER_PANNEAU, texte: titre, fond: '#fff8e8', encre: '#2a2420', lignes: 2 });
    const cx = Math.cos(ry) * 0.6, cz = -Math.sin(ry) * 0.6;
    monde.mur(x - cx, z - cz, x + cx, z + cz, 0.5);
  }
  const actionBete = async (jeu, b) => {
    if (b.sorte !== 'chat') { await jeu.dire(jeu.txn(b.sorte)); return; }
    await jeu.dire(jeu.txn(b.id));
    await jeu.dire(jeu.tx('chatCompagnon')[jeu.compagnon], 'compagnon');
  };
  const depart = { x: DEPART.x, z: DEPART.z, cap: DEPART.cap };
  // les morceaux du décor : près, avec leur trait et leur ombre ; au loin (la forêt des collines), sans
  for (const [k, a] of morceaux) poser(a.fin(), 0, 0, { y: 0, ...(Number(k.split(':')[0]) >= 100 ? { trait: false, ombre: false } : {}) });

  return {
    ...infos, textes: TEXTES,
    objets, monde, terrain, etiquettes, passants, daims: [], interactions, actionDaim: null, vapeurs, bancs, lumieres, actionBete, animes,
    // (le secret, tresors.js : les plumes de cormoran ; le marchand, sous les camphriers au sud de l'allée ; les sons à fabriquer
    // en plus (le cri du cormoran : celui du héron de Gokayama, un « gwaa » rauque) ; les feux d'artifice au-dessus de la mer, à
    // l'est, devant la grotte)
    secret: 'plumes', marchand: MARCHAND, sons: ['claque', 'cloche', 'pinceau', 'papier', 'piece', 'caillou', 'tombe', 'oiseau/goutte', 'oiseau/aosagi'],
    feux: { x: 150, y: 0, z: -30, large: 90, haut: [42, 66] },
    // les mouettes (mouettes.js) : au-dessus de la mer, de la crique du port et du platier ; posées près du rocher de la tortue,
    // sur la digue, une bitte du quai, le platier
    mouettes: {
      vols: [{ x: 62, z: -34, r: 14, h: 16, sens: 1 }, { x: -44, z: -46, r: 12, h: 14, sens: -1 }, { x: -12, z: 26, r: 16, h: 18, sens: 1 }],
      poses: [
        { x: KAMEISHI.x + 2.6, z: KAMEISHI.z + 2.2, cap: 2.4, mer: [1, 0] },
        { x: -36.0, z: -49.2, y: 2.25, cap: 0.4, mer: [0, -1] },
        { x: QUAI.x0 + 1.2 + 3.6 * 6, z: QUAI.z0 + 0.2, y: Y_PORT + 0.68, cap: PI, mer: [0, -1], fuite: 5 },
        { x: -8.0, z: 20.0, cap: 1.2, mer: [0, 1] },
        { x: 4.0, z: 24.0, cap: -0.6, mer: [0.3, 1] },
      ],
    },
    // les bêtes (betes.js) : un chat qui dort sur le quai du port, un autre dans la rue ; des papillons, des libellules, les
    // milans au-dessus du cap
    betes: {
      chats: [{ id: 'chatPort', x: -31.2, z: QUAI.z1 - 1.8, cap: 1.4, robe: 'roux', dort: true }, { id: 'chatRue', x: -56.0, z: RUE.z1 - 1.6, cap: -0.6, robe: 'pie' }],
      papillons: [[-14, 5], [6, 4], [-30, -4], [30, -14], [-90, 10]], libellules: [[-20, 4], [12, 2], [-40, -6]],
      milans: [{ x: 0, z: -20, r: 50, h: 52, sens: 1 }, { x: -60, z: -40, r: 34, h: 40, sens: -1 }],
    },
    aspectSol: (x, z, h) => aspectSol(P, x, z, h),
    // (le sol en cases de 25 cm le long des escaliers, devant la falaise de la grotte et dans la grotte)
    solDetaille,
    etendue: ETENDUE,
    eau: { x0: -1400, x1: 1400, z0: -1400, z1: 1400, niveau: 0, clair: '#58c6c2', profond: '#1b5b9e' },
    centreRive: [-20, -10],
    vent: { dir: [-0.8, 0.6], force: 1.0 }, oiseaux: ['milan', 'mouette'], ambiances: ['vagues', 'insectes'],
    brume: [190, 1700],
    // (le lointain flou plus loin que le style, comme à Motonosumi : les falaises de la côte restent nettes)
    flou: [170, 480],
    soleil: [0.55, 0.7, 0.45],
    depart,
    photos: {
      heros: { x: 30.0, z: -26.0, cap: -PI / 2, lacet: -PI / 2 + PI + 0.35, tangage: 0.16, distance: 7.5 },
      perso: { x: DEPART.x, z: DEPART.z, cap: DEPART.cap, lacet: DEPART.cap + PI + PI + 0.2, tangage: 0.1, distance: 4.4 },
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

// ---------------------------------------------------------------- Les points doux (les lueurs)
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

// ---------------------------------------------------------------- Le cormoran (le secret des plumes)
/**
 * Un cormoran (鵜, umiu : le cormoran de Temminck, l'oiseau qui a donné son nom à Udo), un peu plus grand que nature (×1,25,
 * comme les mouettes : de loin, on le voit bien) : noir aux reflets verts, les ailes bronze, la joue blanche, la peau jaune au
 * coin du bec crochu, l'œil vert. Posé, il se tient droit, appuyé sur sa queue ; il sèche ses ailes grandes ouvertes (sa pose
 * de toujours, sur les rochers) ; en vol, le cou tendu, il bat vite des ailes. ctx : celui des personnages (perso).
 * → { objet, poser(x, y, z, cap) (ses pattes en x, y, z), secher(oui), envol(points) (le milieu du corps suit la courbe par ces
 * points, le premier 0,42 m au-dessus de ses pattes ; se résout au bout, où il disparaît), maj(dt) }. Il regarde vers +z.
 */
function creerCormoran(ctx) {
  const { THREE, atelier, maillage } = ctx;
  const NOIR = '#1d2624', BRONZE = '#3e3a2b', BRONZE2 = '#4f4934', BEC = '#56544c', JAUNE = '#e2b246', BLANC = '#f0ede2', PATTE = '#1a1a1a';
  const TAILLE = 1.25, VITESSE = 5.5;
  // la tête en x, y, z : le bec long et fort, son bout crochu (un peu plus bas si penche), la peau jaune au coin du bec, la joue
  // blanche, l'œil vert. (Un bec fin et une petite boule au bout faisaient un bâton et une bille, 2026-10-31.)
  const tete = (a, x, y, z, penche = 0) => {
    a.ovale(0.066, NOIR, { x, y, z, sx: 0.85, sz: 1.35 }, 10);
    const by = y - 0.014 - penche * 0.05, bz = z + 0.13;
    a.cone(0.022, 0.15, 7, BEC, { x, y: by, z: bz, rx: PI / 2 + 0.12 + penche });
    a.cone(0.009, 0.035, 5, '#33322e', { x, y: by - 0.016, z: bz + 0.07, rx: PI - 0.5 + penche });
    for (const s of [-1, 1]) {
      a.ovale(0.02, JAUNE, { x: x + s * 0.03, y: y - 0.016, z: z + 0.055, sx: 0.5, sz: 1.4, trait: false }, 6)
        .ovale(0.038, BLANC, { x: x + s * 0.038, y: y - 0.022, z: z + 0.02, sx: 0.45, sy: 0.85, sz: 1.1, trait: false }, 8)
        .ovale(0.015, '#3fae7a', { x: x + s * 0.05, y: y + 0.014, z: z + 0.03, sx: 0.5, trait: false }, 6)
        .ovale(0.0075, '#101010', { x: x + s * 0.056, y: y + 0.015, z: z + 0.034, sx: 0.5, trait: false }, 5);
    }
  };
  // posé (repère : ses pattes à l'origine) : debout, le corps penché à 50°, appuyé sur sa queue ; le cou en S
  const pose = atelier()
    .ovale(0.15, NOIR, { y: 0.34, sx: 0.85, sy: 0.85, sz: 2.1, rx: -0.9 }, 14)
    .piece(new THREE.BoxGeometry(0.11, 0.018, 0.25), NOIR, { y: 0.065, z: -0.27, rx: -0.55 })
    .tube([[0, 0.5, 0.12], [0, 0.62, 0.19], [0, 0.71, 0.17], [0, 0.785, 0.2]], 0.044, NOIR, { cotes: 8, pas: 10 });
  tete(pose, 0, 0.81, 0.215);
  for (const s of [-1, 1]) pose.ovale(0.045, PATTE, { x: s * 0.06, y: 0.012, z: 0.06, sy: 0.2, sz: 1.4 }, 8).baton([s * 0.055, 0.02, 0.05], [s * 0.05, 0.16, 0.0], 0.014, PATTE, 5);
  // ses ailes repliées le long du corps (à part : cachées quand il les ouvre)
  const pliees = atelier();
  for (const s of [-1, 1]) pliees.ovale(0.13, BRONZE, { x: s * 0.105, y: 0.35, z: -0.03, sx: 0.28, sy: 0.75, sz: 2.05, rx: -0.85 }, 12);
  // en vol (repère : le milieu du corps) : à l'horizontale, le cou tendu, la tête un peu relevée, les pattes sous la queue
  const vol = atelier()
    .ovale(0.15, NOIR, { sx: 0.85, sy: 0.8, sz: 2.15 }, 14)
    .piece(new THREE.BoxGeometry(0.12, 0.018, 0.24), NOIR, { y: -0.01, z: -0.42 })
    .tube([[0, 0.02, 0.22], [0, 0.045, 0.36], [0, 0.07, 0.47]], 0.042, NOIR, { cotes: 8, pas: 8 });
  tete(vol, 0, 0.08, 0.53, -0.1);
  for (const s of [-1, 1]) vol.ovale(0.035, PATTE, { x: s * 0.04, y: -0.07, z: -0.3, sy: 0.25, sz: 1.5 }, 6);
  // une aile : le bras (bronze) et la frange de ses plumes au bord de fuite, la main au bout (son pivot au poignet) et ses
  // cinq rémiges noires, écartées comme des doigts
  const bras = (s) => {
    const a = atelier().ovale(0.16, BRONZE2, { x: s * 0.15, sy: 0.11, sz: 0.62 }, 10);
    for (let k = 0; k < 5; k++) a.boite(0.05, 0.012, 0.13, k % 2 ? BRONZE : NOIR, { x: s * (0.05 + k * 0.05), y: -0.004 + (k % 2) * 0.008, z: -0.12, ry: s * 0.12, trait: false });
    return a.fin(0, false);
  };
  const main = (s) => {
    const a = atelier().ovale(0.14, BRONZE, { x: s * 0.12, sy: 0.1, sz: 0.5 }, 10);
    for (let k = 0; k < 5; k++) a.boite(0.17, 0.012, 0.042, NOIR, { x: s * 0.27, z: -0.07 + k * 0.035, ry: s * (0.35 - k * 0.17), trait: false });
    return a.fin(0, false);
  };
  // (son corps n'entre dans la scène que quand il paraît : caché, ses matrices seraient recalculées à chaque image pour rien)
  const objet = new THREE.Group(), corps = new THREE.Group();
  const mPose = maillage(pose.fin(0, false)), mPliees = maillage(pliees.fin(0, false)), mVol = maillage(vol.fin(0, false));
  corps.scale.setScalar(TAILLE);
  corps.add(mPose, mPliees, mVol);
  const ailes = [1, -1].map((s) => {
    const epaule = new THREE.Group(), poignet = new THREE.Group();
    poignet.position.set(s * 0.29, 0, 0);
    poignet.add(maillage(main(s)));
    epaule.add(maillage(bras(s)), poignet);
    corps.add(epaule);
    return { s, epaule, poignet };
  });
  objet.visible = false;
  let etat = 'cache', phase = 0, tVol = 0, s = 0, long = 1, chemin = null, fin = null, cri = false;
  const p = new THREE.Vector3(), tg = new THREE.Vector3();
  let cap = 0;
  return {
    objet,
    poser(x, y, z, c = 0) { if (!corps.parent) objet.add(corps); objet.position.set(x, y, z); cap = c; etat = 'perche'; objet.visible = true; },
    secher(oui) { if (etat === 'perche' || etat === 'seche') etat = oui ? 'seche' : 'perche'; },
    envol(points) {
      chemin = new THREE.CatmullRomCurve3(points.map((q) => new THREE.Vector3(...q)));
      long = chemin.getLength();
      s = 0;
      tVol = 0;
      etat = 'vol';
      cri = true;
      return new Promise((r) => { fin = r; });
    },
    maj(dt) {
      if (etat === 'cache' || dt <= 0) return [];
      const cris = [];
      const vole = etat === 'vol', ouvert = vole || etat === 'seche';
      mPose.visible = !vole;
      mPliees.visible = etat === 'perche';
      mVol.visible = vole;
      for (const a of ailes) a.epaule.visible = ouvert;
      if (vole) {
        // (il prend son élan : de plus en plus vite ; le corps suit la courbe, penché comme elle, et se redresse peu à peu de sa
        // pose debout à l'horizontale)
        tVol += dt;
        s = Math.min(long, s + dt * Math.min(VITESSE, 1.2 + 3.5 * tVol));
        chemin.getPointAt(s / long, p);
        chemin.getTangentAt(s / long, tg);
        objet.position.copy(p);
        // (il se tourne vers où il vole en 0,5 s : posé, il pouvait regarder ailleurs)
        const k = Math.min(1, tVol / 0.4), tangage = -Math.atan2(tg.y, Math.hypot(tg.x, tg.z)) * 0.7, vers = Math.atan2(tg.x, tg.z);
        cap += (((vers - cap + PI) % (2 * PI) + 2 * PI) % (2 * PI) - PI) * Math.min(1, dt * (tVol < 0.5 ? 6 : 12));
        corps.rotation.set(-0.9 * (1 - k) + tangage * k, cap, 0, 'YXZ');
        phase += dt * 2 * PI * 3.8;
        for (const a of ailes) {
          a.epaule.position.set(a.s * 0.09, 0.045, 0.06);
          a.epaule.rotation.set(0, 0, a.s * (0.15 + 0.85 * Math.sin(phase)));
          a.poignet.rotation.set(0, 0, a.s * 0.5 * Math.sin(phase - 0.8));
        }
        if (cri) { cri = false; cris.push({ x: p.x, y: p.y, z: p.z, fort: 1, nom: 'aosagi' }); }
        if (s >= long) { etat = 'cache'; objet.visible = false; objet.remove(corps); const f = fin; fin = null; f?.(); }
      } else {
        corps.rotation.set(0, cap, 0, 'YXZ');
        // (les ailes ouvertes pour sécher, comme sur les rochers : dressées face à l'avant, le bord d'attaque en haut, les plumes
        // qui pendent ; le bras un peu levé et un peu en avant, la main qui retombe vers le bas ; elles s'éventent. À plat, de
        // face, on ne voyait que leur tranche, 2026-10-31)
        phase += dt * 2 * PI * 0.6;
        for (const a of ailes) {
          a.epaule.position.set(a.s * 0.11, 0.48, 0.06);
          a.epaule.rotation.set(-PI / 2, -a.s * 0.3, a.s * (0.28 + 0.06 * Math.sin(phase)), 'YZX');
          a.poignet.rotation.set(0, a.s * 0.75, 0);
        }
      }
      return cris;
    },
  };
}

/** Des points doux qu'on place un à un (les lueurs des plumes) : poser(k, x, y, z, taille, r, v, b, a), ranger(k), fin(). */
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
/**
 * L'étincelle des plumes de cormoran, le jour (2026-10-31) : une étoile à quatre branches aux côtés creusés, blanche (la couleur
 * de la nuée la teinte), cernée d'un trait d'encre ; en 64 × 64. (Un éclat doux, ajouté à la lumière, ne se voyait pas sur les
 * dalles claires du palier et de la pointe.)
 */
function etincelleEncre(THREE) {
  const TX = 64, px = new Uint8Array(TX * TX * 4), S = 3;
  for (let j = 0; j < TX; j++) for (let i = 0; i < TX; i++) {
    // (trois sous-points par côté, pour des bords nets sans escalier)
    let dedans = 0, encre = 0;
    for (let a = 0; a < S; a++) for (let b = 0; b < S; b++) {
      const x = Math.abs((i + (a + 0.5) / S - TX / 2) / (TX / 2)), y = Math.abs((j + (b + 0.5) / S - TX / 2) / (TX / 2));
      const f = Math.sqrt(x) + Math.sqrt(y);
      if (f < 0.97) { dedans++; if (f > 0.74) encre++; }
    }
    const a = dedans / (S * S), e = dedans ? encre / dedans : 0, v = Math.round(255 * (1 - 0.82 * e));
    px.set([v, Math.round(v * 0.86), Math.round(v * 0.62), Math.round(a * 255)], (j * TX + i) * 4);
  }
  const t = new THREE.DataTexture(px, TX, TX);
  t.magFilter = t.minFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}
/** Une étoile douce à quatre branches (l'éclat qui scintille au-dessus des plumes de cormoran, la nuit). */
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

// ---------------------------------------------------------------- Le sol
/** Le sol (sa couleur et sa matière, textures.js) en x, z, à la hauteur h. */
function aspectSol(P, x, z, h) {
  const bruit = bruitDoux(x, z, 3.5);
  // sous la mer : la roche sombre, un peu de sable
  if (h < -0.4) return [h < -4 ? '#3e4a52' : bruit > 0.5 ? '#5a6460' : '#4e5a5c', M.roche];
  // le platier, à fleur d'eau : la roche grise et mouillée, des flaques sombres
  if (z > 6 && z < 34 && x > -50 && x < 20 && dansPoly(PLATIER, x, z)) return [bruit > 0.62 ? '#7a756b' : bruit > 0.3 ? '#8e887c' : '#857f73', M.roche];
  // le quai : des dalles de béton (avant la roche du rivage : il est au bord de l'eau)
  if (dansRect(QUAI, x, z, 0.1) && h > Y_PORT - 0.3) return [bruit > 0.5 ? '#bdb8ad' : '#b3aea2', M.dalles];
  const d = cote(x, z);
  // le rivage et les falaises : la roche mouillée, puis les couches grises et beiges
  if (d < 3.2 || h < 1.0) return [h < 0.7 ? '#4d4a43' : bruit > 0.5 ? '#938a78' : '#857d6d', M.roche];
  // le parking et la rue : le goudron
  if (dansRect(PARKING, x, z, 0.05)) return [bruit > 0.5 ? '#6e6c69' : '#666461', M.route];
  if (dansRect(RUE, x, z, 0.05)) return [bruit > 0.5 ? '#77746f' : '#6f6c67', M.route];
  // la place du Shinmon, l'allée, le chemin des lanternes, le palier d'Inari : le gravier clair (玉砂利) ; le coin de Bunbuku : la
  // terre sous les camphriers
  if (aLaPlace(RECOIN, x, z) < 0.15) return [bruit > 0.5 ? '#8f7d60' : '#86755a', M.terre];
  if (dansRect(PLACE, x, z, 0.05) || dansRect(ALLEE, x, z, 0.05) || dansRect(LANTERNES, x, z, 0.05) || dansRect(INARI, x, z, 0.05)) return [bruit > 0.5 ? '#d6cfbf' : '#cdc6b5', M.terre];
  // sous le Rōmon, la pointe, la terrasse de la grotte, la grotte : les dalles de pierre
  if (dansRect(POINTE, x, z, 0.05) || (dansRect(TERRASSE, x, z, 0.05) && x > xParoi(z) + 0.4) || (x > MARCHES_ROMON.x1 - 0.1 && x < LANTERNES.x0 + 0.1 && Math.abs(z) < 3)) return [bruit > 0.5 ? '#c4bdae' : '#b9b2a2', M.dalles];
  if (solGrotte(x, z)) return [bruit > 0.5 ? '#8a8476' : '#7f796c', M.dalles];
  // les escaliers : la pierre
  if (ESCALIERS.some((E) => surEsc(E, x, z, 0.3))) return ['#a9a291', M.roche];
  // la crête et la pointe : le sous-bois sous la forêt persistante, l'herbe ailleurs, la roche qui affleure par endroits ; au loin, le
  // pays couvert de forêt
  if (crete(x, z) > 2.5 || x < -112 || Math.hypot(x + 20, z) > 150) return [bruit > 0.6 ? '#4b6539' : '#557a3a', M.sousBois];
  const sec = bruitDoux(x * 0.6 + 4, z * 0.6, 3);
  if (sec > 0.78) return ['#8c8474', M.roche];
  return [bruit > 0.6 ? '#7fae57' : bruit > 0.3 ? '#74a24e' : '#689647', M.herbe];
}

// ---------------------------------------------------------------- Les textes du lieu
const TEXTES = {
  fr: {
    noms: { miko: 'La miko', vendeuse: 'La vendeuse de bonbons', echoppe: 'La marchande de boules', kannushi: 'Le prêtre', obaa: 'La grand-mère', mariee: 'La jeune mariée', marie: 'Le jeune marié', ecolier: 'L’écolier', videaste: '@random_japan_place', photographe: 'Le photographe', gardien: 'Le gardien d’Inari', touriste: 'La touriste', touriste2: 'Le touriste', batelier: 'Le batelier', pecheuse: 'La pêcheuse', randonneur: 'Le randonneur', chauffeur: 'Le chauffeur du car' },
    tampons: {
      ema: ['Le vœu du lapin', 'au bureau des porte-bonheur, sur la place du Shinmon : écrire un vœu sur une plaquette en forme de lapin, et la pendre'],
      inari: ['Le sanctuaire d’Inari', 'en haut des marches sous les torii rouges, au nord de l’allée : prier au petit sanctuaire Udo Inari'],
      usagi: ['Le lapin qu’on caresse', 'dans la grotte, au sud du grand sanctuaire : caresser le lapin blanc de pierre'],
      ochichi: ['Les rochers de la mère', 'au fond de la grotte, derrière le grand sanctuaire : recueillir une goutte des rochers de Toyotama-hime'],
      undama: ['Les boules de chance', 'au bord de la terrasse : lancer une boule de chance (l’échoppe en vend) dans le creux du rocher de la tortue'],
    },
    miko: ['Bienvenue à Udo-jingū ! Ici, le lapin est le messager du dieu.', 'Tu veux écrire un vœu sur une plaquette en forme de lapin (兎の絵馬) ? On la pend ensuite au présentoir, juste à côté.'],
    mikoNon: ['D’accord ! Les lapins t’attendront.'],
    mikoApres: ['Ton lapin est bien pendu avec les autres. Le dieu le lira, c’est sûr.'],
    emaVoeu: ['Qu’est-ce que tu écris sur ton lapin ?'],
    emaVoeux: ['Un beau voyage', 'Une bonne santé', 'Rester amis pour toujours', 'Réussir à l’école'],
    emaEcrit: ['Tu écris : « Que mon voyage soit beau, jusqu’au bout. »', 'Tu écris : « Une bonne santé, pour moi et pour ceux que j’aime. »', 'Tu écris : « Rester amis pour toujours, avec mon compagnon. »', 'Tu écris : « Réussir à l’école… même en maths. »'],
    emaPendu: ['Tu pends ton lapin au présentoir, avec tous les autres. Ils se balancent dans le vent de la mer.'],
    emaCompagnon: { kon: ['« Ton lapin a l’air content d’être avec ses amis. »'], pon: ['« Pon ! J’aurais écrit : « des gâteaux pour toujours ». »'], chapu: ['« Chapu ! Ils dansent dans le vent, tous ces lapins ! »'], gao: ['« Gao… Je surveillerai ton vœu. »'], fuwa: ['« Fuwa… Un vœu qui part avec le vent de la mer. »'], saya: ['« Du bois, des mots, et le vent… Les vœux poussent comme des arbres. »'] },
    inari: ['Tu sonnes la cloche et tu frappes deux fois dans tes mains.', 'Le petit sanctuaire d’Inari veille sur la colline d’Udo. Ses torii rouges ont été offerts un par un, par ceux dont le vœu s’est réalisé.'],
    inariNuit: ['Dans la nuit, les torii rouges sont presque noirs. Tu sonnes la cloche du petit sanctuaire d’Inari, et tu frappes deux fois dans tes mains.'],
    inariCompagnon: { kon: ['« Un sanctuaire d’Inari ! C’est un peu chez moi… Les renards de pierre m’ont fait un clin d’œil. »'], pon: ['« Pon ! Des renards partout… Je reste poli, je suis chez eux. »'], chapu: ['« Chapu ! Tous ces torii, on dirait un tunnel magique ! »'], gao: ['« Gao ! Deux renards gardiens. On se comprend, entre gardiens. »'], fuwa: ['« Fuwa… D’ici, on voit la mer entre les arbres. »'], saya: ['« Les camphriers de la colline sont vieux et doux… ils aiment ce petit sanctuaire. »'] },
    usagi: ['Un lapin blanc de pierre, sur son rocher (撫でうさぎ, « le lapin qu’on caresse »). Le lapin est le messager du dieu d’Udo.', 'On le caresse là où l’on veut aller mieux… ou devenir meilleur. Où le caresses-tu ?'],
    usagiChoix: ['La tête', 'Les oreilles', 'Le dos', 'Les pattes'],
    usagiCaresse: ['Tu caresses sa tête. Les idées te semblent tout à coup plus claires !', 'Tu caresses ses longues oreilles. Tu entends mieux le bruit des vagues.', 'Tu caresses son dos. Plus de fatigue après tous ces escaliers !', 'Tu caresses ses pattes. Tu as envie de courir jusqu’au port !'],
    usagiCompagnon: { kon: ['« Il a brillé ! Les messagers des dieux, ça se reconnaît. »'], pon: ['« Pon ! Caresse-moi le ventre aussi, pour voir ? »'], chapu: ['« Chapu ! Il est tout doux… pour un caillou ! »'], gao: ['« Gao… un lapin gardien. Il est plus fort qu’il n’en a l’air. »'], fuwa: ['« Fuwa… Les lapins aiment la lune. Celui-là aime la mer. »'], saya: ['« Des milliers de mains l’ont caressé… La pierre en est toute polie. »'] },
    ochichiAvant: ['Derrière le sanctuaire, au fond de la grotte, deux rondeurs de roche suintent goutte à goutte : les rochers de la mère (お乳岩).', 'Tu tends les mains sous les rochers…'],
    ochichi: ['Plic ! Une goutte fraîche tombe dans le creux de tes mains.', 'On raconte qu’ici, Toyotama-hime, la fille du dieu de la mer, mit au monde son enfant. En repartant vers la mer, elle laissa ses seins sur la roche pour qu’il puisse boire. L’eau coule encore : on en fait les bonbons « おちちあめ », pour que les enfants grandissent bien.'],
    ochichiCompagnon: { kon: ['« Une maman qui laisse un peu d’elle pour veiller sur son petit… c’est beau. »'], pon: ['« Pon… J’ai un peu envie d’appeler ma maman, tout à coup. »'], chapu: ['« Chapu ! De l’eau de la princesse de la mer ! Elle est fraîche ! »'], gao: ['« Gao… Elle veille encore. Comme une gardienne. »'], fuwa: ['« Fuwaaa… Toyotama-hime vient de chez moi, du palais du dragon ! »'], saya: ['« La roche se souvient… Elle n’a jamais arrêté de donner. »'] },
    undamaPret: ['Devant toi, dans la mer : le rocher de la tortue (亀石), et son creux carré entouré d’une corde.', 'Les garçons lancent de la main gauche, les filles de la main droite. Tu lances tes cinq boules ?'],
    undamaAide: (n) => `A (ou un appui sur l’écran) quand le cercle doré est sur le creux ! Encore ${n} boule${n > 1 ? 's' : ''}`,
    undamaRate: (n) => `Raté… elle a rebondi dans la mer. Attends que le cercle soit pile sur le creux. Encore ${n} boule${n > 1 ? 's' : ''}`,
    undamaPerdu: ['Les cinq boules sont tombées dans la mer…', 'Pas grave : la marchande de l’échoppe en vend d’autres. Ici, presque tout le monde rate !'],
    undamaGagne: ['Toc ! La boule est tombée pile dans le creux du rocher de la tortue !', 'On dit que ton vœu se réalisera. Les boules sont en terre : la mer les reprend doucement.'],
    undamaCompagnon: { kon: ['« Dedans ! La tortue l’a attrapée. »'], pon: ['« Pon pon ! Du premier coup… enfin, presque ! »'], chapu: ['« Chapuuu ! Je voulais aller chercher celles qui sont tombées… mais non. »'], gao: ['« Gao ! Un lancer de champion. »'], fuwa: ['« Fuwa… La tortue de Toyotama-hime ! C’est elle qui a porté la princesse jusqu’ici. »'], saya: ['« La terre retourne à la mer… et le vœu reste. »'] },
    kameishi: ['Dans la mer, devant le sanctuaire : le rocher de la tortue (亀石). On dit que c’est la tortue qui porta Toyotama-hime jusqu’ici, changée en pierre.', 'Sur son dos, un creux carré entouré d’une corde. On y lance des boules de chance (運玉) : la marchande de l’échoppe, sur la terrasse, en vend.'],
    kameishiNuit: ['La nuit, le rocher de la tortue n’est plus qu’une ombre dans l’écume. Les vagues lui caressent le dos.'],
    echoppe: ['Des boules de chance (運玉) ! Cinq boules de terre, avec le caractère « chance » (運) dessus.', 'Ce sont les écoliers d’Udo qui les fabriquent, depuis 1954. Tu en veux ?'],
    echoppeNon: ['Reviens quand tu veux !'],
    echoppeDonne: ['Voilà tes cinq boules. Lance-les depuis le bord de la terrasse, vers le creux du rocher de la tortue !', 'Les garçons de la main gauche, les filles de la main droite !'],
    echoppeDeja: ['Tu as encore tes boules ! Va les lancer au bord de la terrasse.'],
    vendeuse: ['Des « おちちあめ », les bonbons d’Udo ! On les fait avec l’eau des rochers de la mère, au fond de la grotte.', 'Les mamans en donnaient à leurs bébés, pour qu’ils grandissent bien. Tu goûtes ?'],
    vendeuseNon: ['Une autre fois !'],
    ame: ['C’est doux, comme du lait et du sucre… un goût d’autrefois.'],
    ameCompagnon: { kon: ['« Un goût tout doux… comme un souvenir. »'], pon: ['« Pon ! Encore un ! Et un pour la route ! »'], chapu: ['« Chapu ! Ça colle aux dents ! »'], gao: ['« Gao… Un bonbon de gardien. Je surveille le paquet. »'], fuwa: ['« Fuwa… Le goût de la mer, mais en sucré. »'], saya: ['« Il sent le riz et le soleil. »'] },
    kannushi: ['Bienvenue dans la grotte d’Udo. Ici, Toyotama-hime mit au monde son enfant, sous une hutte dont le toit de plumes de cormoran (鵜) n’était pas encore fini.', 'On l’appela Ugayafukiaezu, « le toit de cormoran pas fini ». C’est le dieu de ce sanctuaire, le père du premier empereur.'],
    kannushiSoir: ['Le soir, quand les lanternes s’allument dans la grotte, c’est encore plus beau. Tu veux rester jusqu’à la nuit ?'],
    kannushiNon: ['Comme tu veux. La grotte ne s’en va pas !'],
    kannushiNuitTombe: ['Regarde… les lanternes s’allument, le sanctuaire brille dans la roche. On entend la mer respirer.'],
    kannushiNuit: ['La nuit est belle sur la mer de Hyūga. Tu veux revoir le matin ?'],
    kannushiReste: ['Profite de la nuit.'],
    kannushiMatin: ['Voilà le soleil qui se lève sur la mer. Le premier rayon entre jusque dans la grotte.'],
    batelier: ['Hé, le voyageur ! Mon bateau va jusqu’à Yakushima, l’île des cèdres millénaires, loin au sud.', 'Autrefois, les pèlerins montaient au sanctuaire par le vieil escalier, depuis ce port de Fukei. Moi, je pars dans l’autre sens : vers la mer !', 'Mais la mer, ça se respecte : je n’emmène que ceux qui ont salué les dieux d’Udo. Rapporte-moi les cinq tampons du sanctuaire.'],
    batelierNuit: ['La nuit, on ne part pas : on regarde les étoiles et on écoute la mer.', 'Rapporte-moi les cinq tampons d’Udo, et je t’emmène à Yakushima.'],
    batelierReste: (n) => `Il te manque encore ${n} tampon${n > 1 ? 's' : ''}.`,
    batelierPret: ['Oh ! Les cinq tampons d’Udo ! Toyotama-hime, la fille du dieu de la mer, veille sur toi maintenant.', 'On part pour Yakushima ?'],
    batelierAttend: ['Je t’attends. Le bateau est prêt quand tu l’es.'],
    batelierBientot: ['Hmm… le moteur tousse un peu ce matin. Il me faut encore un peu de temps pour le régler.', 'Reviens bientôt : je t’emmènerai à Yakushima, promis !'],
    toutCompagnon: { kon: ['Tous les tampons d’Udo !', 'Le batelier du port, en bas du vieil escalier, va pouvoir nous emmener à Yakushima !'], pon: ['Pon ! Le carnet est plein !', 'Vite, au port : le batelier nous attend pour Yakushima !'], chapu: ['Tous les tampons ! Chapu chapu !', 'Le bateau ! On va prendre le bateau pour Yakushima ! Au port, en bas du vieil escalier, vite !'], gao: ['Gao ! Mission accomplie : les cinq tampons.', 'Le batelier du port, en bas du vieil escalier, nous emmènera à Yakushima.'], fuwa: ['Fuwaaa ! Tous les tampons !', 'La mer nous appelle… Le batelier du port, en bas du vieil escalier, nous attend !'], saya: ['Les cinq tampons… La princesse de la mer veille sur nous.', 'Yakushima, l’île des grands cèdres… Allons voir le batelier, en bas, au port.'] },
    bateau: ['Le bateau du batelier : une coque blanche, une bande bleue, le drapeau des pêcheurs en haut du mât. Prêt à partir.'],
    bateauNuit: ['La nuit, le bateau du batelier dort contre le quai. L’eau clapote contre sa coque.'],
    honden: ['Tu sonnes la cloche et tu frappes deux fois dans tes mains, devant le grand sanctuaire vermillon, sous le toit de la grotte.', 'On vient y prier pour les naissances et pour les amoureux : ici, une princesse de la mer a donné la vie.'],
    hondenNuit: ['La nuit, les lanternes rouges éclairent le sanctuaire ; la grotte est toute dorée. Tu pries en silence.'],
    oji: ['Le petit sanctuaire du prince (皇子神社), à côté du grand. On y prie pour les enfants.'],
    voute: ['Au-dessus de toi, la voûte de la grotte : de la roche grise et ocre, creusée par la mer il y a des milliers d’années.', 'La vraie grotte fait près de 40 mètres de large. La mer y entrait, autrefois.'],
    vouteNuit: ['La nuit, la voûte de la grotte se perd dans le noir. Seul le sanctuaire brille, comme une lanterne.'],
    toriiGrotte: ['Le torii vermillon, à l’entrée de la grotte. Au-delà, on est chez les dieux.'],
    tamabashi: ['Le pont Tamabashi (玉橋), en arc au-dessus de la mer. Autrefois, on enlevait ses chaussures ici, pour marcher pieds nus jusqu’au sanctuaire.'],
    tamabashiNuit: ['La nuit, la mer gronde sous le pont Tamabashi. Ses boutons dorés brillent sous les lanternes.'],
    lanternes: ['Les lanternes de pierre des seigneurs Itō d’Obi, qui protégeaient le sanctuaire. Regarde leurs fenêtres : chacune a la forme d’une lune différente, de la nouvelle lune à la pleine lune.'],
    lanternesNuit: ['La nuit, les lanternes sont allumées : une rangée de petites lunes, de la nouvelle à la pleine.'],
    platier: ['En bas de la falaise, la roche fait des rayures, comme une planche à laver géante : la « planche à laver des oni » (鬼の洗濯板).', 'Des couches de grès dur et de pierre tendre, que la mer use depuis des milliers d’années.'],
    platierNuit: ['La nuit, la mer blanchit le long des rayures de la roche. On l’entend respirer.'],
    romon: ['Le Rōmon (楼門), la grande porte rouge à étage. En haut, au milieu, un tableau peint ; dans les côtés, deux gardiens assis veillent.'],
    romonNuit: ['La nuit, le Rōmon est une grande ombre rouge sous les étoiles.'],
    otorii: ['Le grand torii du sanctuaire, au bout de la rue des boutiques. Au-delà commence le chemin d’Udo-jingū.'],
    vueEscalier: ['La voilà, la vue des cartes postales : l’escalier qui descend le long de la falaise, la terrasse, la grotte et son sanctuaire vermillon, et la mer de Hyūga.', 'Udo est un sanctuaire où l’on « descend » pour prier (下り宮) : c’est très rare au Japon.'],
    vueEscalierNuit: ['La nuit, tout en bas, la grotte brille comme une boîte de laque rouge posée au bord de la mer.'],
    portVue: ['En bas, le petit port de Fukei (吹毛井港), au fond de la crique. Le vieil escalier des pèlerins y descend : le Hatchōzaka (八丁坂).'],
    portVueNuit: ['En bas, le petit port dort. Le phare rouge de la digue veille.'],
    chozuya: ['La fontaine des ablutions (手水舎). On se lave la main gauche, puis la droite, puis on se rince la bouche, avant d’aller prier.'],
    'panneau-yuisho': ['« Udo-jingū (鵜戸神宮). Le dieu : Ugayafukiaezu, fils de Toyotama-hime, la fille du dieu de la mer, et père de l’empereur Jinmu. »', '« Le sanctuaire est bâti dans une grotte de la falaise, au bord de la mer de Hyūga : on y descend pour prier. On y vient pour les naissances, les mariages et la chance. »'],
    'panneau-kameishi': ['« Le rocher de la tortue (霊石亀石). On dit que c’est la tortue qui porta Toyotama-hime depuis le palais du dragon. »', '« Lancez les boules de chance (運玉) dans le creux de son dos : les hommes de la main gauche, les femmes de la main droite. Si la boule y reste, votre vœu se réalisera. »'],
    'panneau-hatcho': ['« 八丁坂 ↓ 吹毛井港 » : le Hatchōzaka, vers le port de Fukei.', 'Le plus vieux chemin du sanctuaire : un escalier de pierre qui descend jusqu’au port. Les marches du milieu sont creusées par des siècles de pas.'],
    videaste: ['Salut ! Je filme la grotte pour ma chaîne. Un sanctuaire vermillon dans une falaise, au bord du Pacifique… On ne voit ça qu’ici.', 'Tu veux voir ma vidéo ?'],
    obaa: ['Je viens prier pour ma petite-fille : elle attend un bébé pour le printemps.', 'Ici, la princesse de la mer a mis son enfant au monde. Toutes les grands-mères de Miyazaki viennent prier à Udo !'],
    mariee: ['On vient de se marier ! Autrefois, les jeunes mariés venaient à Udo sur un cheval couvert de clochettes (シャンシャン馬).', 'Moi, je lance de la main droite… et lui de la gauche !'],
    marie: ['J’ai raté mes cinq boules… Elle, elle a réussi du premier coup.', 'Elle dit que ça veut dire qu’elle aura toujours raison. Ça commence bien !'],
    ecolier: ['Tu sais quoi ? Les boules de chance, c’est nous qui les fabriquons, à l’école d’Udo !', 'On les roule à la main et on tamponne le caractère « chance » dessus. J’en ai fait plein cette année !'],
    photographe: ['D’ici, on a la plus belle vue d’Udo : l’escalier, la grotte, la mer. Le matin, le soleil entre jusqu’au sanctuaire.'],
    gardien: ['Bonjour, bonjour. Je balaie le sanctuaire d’Inari tous les matins.', 'Les torii de l’escalier ont été offerts par des gens dont le vœu s’est réalisé. Chacun porte un nom.'],
    touriste: ['Tu as vu les lanternes ? Leurs fenêtres sont des lunes ! Une nouvelle lune, un croissant… jusqu’à la pleine lune.'],
    touriste2: ['Regarde en bas, la roche rayée : la planche à laver des oni ! On dirait qu’un géant a passé un peigne dans la mer.'],
    pecheuse: ['Du poisson frais du matin ! Des chinchards, des maquereaux… La mer de Hyūga est généreuse.', 'Le batelier ? Il connaît toutes les routes de la mer, jusqu’à Yakushima.', 'Les cormorans (鵜) pêchent ici tous les matins. Parfois, l’un d’eux laisse une plume sur le quai…'],
    // le secret des plumes de cormoran : la hutte de la naissance (産屋), les trois plumes, le cormoran
    hutte: ['Une petite hutte de bois brut, contre la paroi : 産屋 (うぶや), la hutte de la naissance.', 'Ici, Toyotama-hime mit son bébé au monde. On couvrait le toit de plumes de cormoran (鵜), mais le bébé est né avant la fin : en haut, on voit encore les perches.'],
    huttePlumes: (n) => [`Tu as ${n} plume${n > 1 ? 's' : ''} de cormoran. Il en faut trois pour finir le toit.`],
    hutteCompagnon: { kon: ['« Le toit n’est pas fini… Avec trois plumes de cormoran, on pourrait le terminer ! Il doit bien y en avoir quelque part. »'], pon: ['« Pon ! Un toit troué, ça ne protège de rien. Cherchons trois plumes de cormoran pour le finir ! »'], chapu: ['« Chapu ! Des plumes de cormoran… Les cormorans, ce sont des pêcheurs, comme moi ! Il doit en traîner près de la mer. »'], gao: ['« Gao… Un toit à moitié fait. Trouvons trois plumes de cormoran, et finissons-le. »'], fuwa: ['« Fuwa… La hutte de la princesse de la mer ! Trois plumes de cormoran, et son toit serait enfin fini. »'], saya: ['« Le toit attend depuis si longtemps… Trois plumes de cormoran suffiraient. Cherchons-les. »'] },
    hutteMettre: ['Tu as les trois plumes de cormoran. Tu les poses sur le toit de la hutte ?'],
    hutteMet: ['Tu lèves les trois plumes vers le haut du toit…'],
    hutteFin: ['Le toit de la hutte est fini !', 'Bien des siècles plus tard, le bébé de Toyotama-hime a enfin son toit de plumes de cormoran.'],
    cormoranCompagnon: { kon: ['« Un cormoran ! Il est venu voir le toit fini… et le voilà qui repart vers la mer. »'], pon: ['« Pon ! Il est parti si vite ! Il va le dire à la princesse, j’en suis sûr ! »'], chapu: ['« Chapu ! Un cormoran ! Il part pêcher, comme moi ! Bonne pêche ! »'], gao: ['« Gao… Il a gardé la hutte tout ce temps. Maintenant, il peut rentrer. »'], fuwa: ['« Fuwaaa ! Il rentre au palais du dragon, chez la princesse ! »'], saya: ['« Il était là depuis si longtemps… Le voilà libre. »'] },
    hutteFinie: ['La hutte de la naissance, son toit de plumes de cormoran enfin fini. Sa petite lampe veille près du berceau.'],
    plumeRamassee: (n) => [`Une grande plume bronze, bordée de noir : une plume de cormoran (鵜) ! (${n} sur 3)`],
    plumeInconnueCompagnon: { kon: ['« Une plume de cormoran ! Udo, ça veut dire « la porte du cormoran ». Dans la grotte, la hutte où la princesse a eu son bébé n’a jamais eu son toit fini… Trouvons trois plumes et allons le finir ! »'], pon: ['« Pon ! Une plume de cormoran ! Dans la grotte, il y a une petite hutte dont le toit de plumes n’a jamais été fini. Avec trois plumes, on pourrait le terminer ! »'], chapu: ['« Chapu ! Une plume de cormoran, le grand pêcheur noir ! Le toit de la hutte de la naissance, dans la grotte, n’est pas fini… Trois plumes, et hop ! »'], gao: ['« Gao. Une plume de cormoran. La hutte de la grotte attend son toit depuis toujours : trois plumes, et on la finit. »'], fuwa: ['« Fuwaaa ! Une plume de cormoran ! La hutte où la princesse de la mer a eu son bébé, dans la grotte : son toit n’est pas fini. Trouvons-en trois ! »'], saya: ['« Une plume de cormoran… La hutte de la naissance, dans la grotte, n’a jamais eu son toit fini. Trois plumes, et elle serait complète. »'] },
    plumeCompagnon: { kon: ['« Une plume pour le toit de la hutte ! Encore deux. »'], pon: ['« Pon ! Une ! Plus que deux plumes ! »'], chapu: ['« Chapu ! Elle sent la mer ! Encore deux plumes ! »'], gao: ['« Gao. Une de trouvée. Deux à trouver. »'], fuwa: ['« Fuwa ! Une plume pour la princesse ! Encore deux ! »'], saya: ['« Une plume… Le toit en attend encore deux. »'] },
    plumeDerniereCompagnon: { kon: ['« Plus qu’une plume ! »'], pon: ['« Pon ! Plus qu’une ! »'], chapu: ['« Chapu ! Plus qu’une plume ! »'], gao: ['« Gao. Plus qu’une. »'], fuwa: ['« Fuwa ! Encore une seule ! »'], saya: ['« Plus qu’une plume… »'] },
    plumeDerniere: (lieu) => [`La dernière plume de cormoran est ${lieu}.`],
    lieuxPlumes: { p1: 'sur le palier d’Udo Inari, en haut des torii rouges', p2: 'sur la pointe, juste après le pont Tamabashi', p3: 'sur le quai du port, en bas du vieil escalier' },
    plumesHutteCompagnon: { kon: ['« Les trois plumes ! Allons les poser sur le toit de la hutte, dans la grotte, au nord du sanctuaire. »'], pon: ['« Pon pon ! Les trois ! Vite, à la hutte de la grotte, au nord du sanctuaire ! »'], chapu: ['« Chapu chapu ! Trois plumes ! À la hutte, dans la grotte, au nord du sanctuaire ! »'], gao: ['« Gao. Les trois plumes. Direction la hutte, dans la grotte, au nord du sanctuaire. »'], fuwa: ['« Fuwaaa ! Les trois ! La hutte de la princesse attend, dans la grotte, au nord du sanctuaire ! »'], saya: ['« Les trois plumes… Portons-les à la hutte, dans la grotte, au nord du sanctuaire. »'] },
    kannushiHutte: ['Tu as vu la petite hutte, contre la paroi, au nord du sanctuaire ? Son toit attend toujours ses dernières plumes…'],
    randonneur: ['Je monte le Hatchōzaka, le vieil escalier des pèlerins : huit chō, environ huit cents mètres de marches, du port jusqu’au sanctuaire !', 'On raconte que des nonnes ont monté ses pierres depuis la plage, en équilibre sur la tête !'],
    chauffeur: ['Le car de la côte de Nichinan. Prochain départ dans une heure : prends ton temps, Udo se visite lentement.'],
    chatPort: ['Un chat roux dort sur le quai, à côté des filets. Il sent le poisson.', 'Tu le caresses… Rrrrrr…'],
    chatPortNuit: ['La nuit, le chat du port est réveillé : il guette les bateaux. Ses yeux brillent.'],
    chatRue: ['Un chat noir et blanc se promène devant les boutiques. Il connaît tous les coins d’ombre.', 'Tu le caresses… Rrrrrr…'],
    chatRueNuit: ['La nuit, le chat noir et blanc dort devant une boutique fermée.'],
    chatCompagnon: { kon: ['« Un chat du port… Il connaît tous les bateaux. »'], pon: ['« Pon ! Il dort comme moi après un bon repas. »'], chapu: ['« Chapu ! Il sent le poisson… On est faits pour s’entendre ! »'], gao: ['« Gao… Un gardien endormi. Je prends la relève. »'], fuwa: ['« Fuwa… Il ronronne comme les vagues. »'], saya: ['« Il est chaud comme une pierre au soleil. »'] },
    papillon: ['Un papillon se laisse porter par le vent de la mer, au-dessus des cycas.'],
    libellule: ['Une libellule rouge (akatombo) se pose sur une barrière vermillon.'],
  },
  en: {
    noms: { miko: 'The miko', vendeuse: 'The candy seller', echoppe: 'The luck-ball seller', kannushi: 'The priest', obaa: 'The grandmother', mariee: 'The bride', marie: 'The groom', ecolier: 'The schoolboy', videaste: '@random_japan_place', photographe: 'The photographer', gardien: 'The Inari keeper', touriste: 'The tourist', touriste2: 'The tourist', batelier: 'The boatman', pecheuse: 'The fisherwoman', randonneur: 'The hiker', chauffeur: 'The bus driver' },
    tampons: {
      ema: ['The rabbit wish', 'at the charm office on the Shinmon square: write a wish on a rabbit-shaped plaque, and hang it'],
      inari: ['The Inari shrine', 'up the steps under the red torii, north of the path: pray at the little Udo Inari shrine'],
      usagi: ['The rabbit you stroke', 'in the cave, south of the great shrine: stroke the white stone rabbit'],
      ochichi: ['The mother’s rocks', 'at the back of the cave, behind the great shrine: catch a drop from Toyotama-hime’s rocks'],
      undama: ['The luck balls', 'at the edge of the terrace: throw a luck ball (the stall sells them) into the hollow of the turtle rock'],
    },
    miko: ['Welcome to Udo-jingū! Here, the rabbit is the god’s messenger.', 'Would you like to write a wish on a rabbit-shaped plaque (兎の絵馬)? Then we hang it on the rack, just next to us.'],
    mikoNon: ['All right! The rabbits will wait for you.'],
    mikoApres: ['Your rabbit is hanging with the others. The god will read it, for sure.'],
    emaVoeu: ['What do you write on your rabbit?'],
    emaVoeux: ['A wonderful journey', 'Good health', 'Friends forever', 'Doing well at school'],
    emaEcrit: ['You write: “May my journey be wonderful, all the way.”', 'You write: “Good health, for me and for the ones I love.”', 'You write: “Friends forever, with my companion.”', 'You write: “Doing well at school… even in maths.”'],
    emaPendu: ['You hang your rabbit on the rack, with all the others. They sway in the sea wind.'],
    emaCompagnon: { kon: ['“Your rabbit looks happy to be with its friends.”'], pon: ['“Pon! I’d have written: ‘cakes forever’.”'], chapu: ['“Chapu! They’re dancing in the wind, all those rabbits!”'], gao: ['“Gao… I’ll keep an eye on your wish.”'], fuwa: ['“Fuwa… A wish that leaves with the sea wind.”'], saya: ['“Wood, words and wind… Wishes grow like trees.”'] },
    inari: ['You ring the bell and clap your hands twice.', 'The little Inari shrine watches over Udo’s hill. Its red torii were given one by one, by people whose wish came true.'],
    inariNuit: ['In the night, the red torii look almost black. You ring the bell of the little Inari shrine and clap your hands twice.'],
    inariCompagnon: { kon: ['“An Inari shrine! It’s a bit like home… The stone foxes winked at me.”'], pon: ['“Pon! Foxes everywhere… I’ll be polite, it’s their house.”'], chapu: ['“Chapu! All those torii, it’s like a magic tunnel!”'], gao: ['“Gao! Two fox guardians. We understand each other, between guardians.”'], fuwa: ['“Fuwa… From up here, you can see the sea between the trees.”'], saya: ['“The camphor trees on the hill are old and gentle… they love this little shrine.”'] },
    usagi: ['A white stone rabbit on its rock (撫でうさぎ, “the rabbit you stroke”). The rabbit is the messenger of Udo’s god.', 'You stroke it where you want to feel better… or become better. Where do you stroke it?'],
    usagiChoix: ['The head', 'The ears', 'The back', 'The paws'],
    usagiCaresse: ['You stroke its head. Your thoughts suddenly feel clearer!', 'You stroke its long ears. You hear the waves better.', 'You stroke its back. No more tiredness after all those stairs!', 'You stroke its paws. You feel like running all the way to the harbour!'],
    usagiCompagnon: { kon: ['“It glowed! You can always tell a messenger of the gods.”'], pon: ['“Pon! Stroke my belly too, just to see?”'], chapu: ['“Chapu! It’s so soft… for a stone!”'], gao: ['“Gao… a guardian rabbit. Stronger than it looks.”'], fuwa: ['“Fuwa… Rabbits love the moon. This one loves the sea.”'], saya: ['“Thousands of hands have stroked it… The stone is all polished.”'] },
    ochichiAvant: ['Behind the shrine, at the back of the cave, two rounded rocks ooze drop by drop: the mother’s rocks (お乳岩).', 'You hold out your hands under the rocks…'],
    ochichi: ['Plip! A cool drop falls into the hollow of your hands.', 'They say that here, Toyotama-hime, daughter of the god of the sea, gave birth to her child. When she went back to the sea, she left her breasts on the rock so he could drink. The water still flows: it’s used to make the “おちちあめ” candies, so that children grow up well.'],
    ochichiCompagnon: { kon: ['“A mother who leaves a little of herself to watch over her little one… how beautiful.”'], pon: ['“Pon… I kind of want to call my mum, all of a sudden.”'], chapu: ['“Chapu! Water from the princess of the sea! It’s cool!”'], gao: ['“Gao… She’s still watching over him. Like a guardian.”'], fuwa: ['“Fuwaaa… Toyotama-hime comes from my home, the dragon palace!”'], saya: ['“The rock remembers… It has never stopped giving.”'] },
    undamaPret: ['In front of you, in the sea: the turtle rock (亀石), and its square hollow ringed by a rope.', 'Boys throw with the left hand, girls with the right. Throw your five balls?'],
    undamaAide: (n) => `A (or tap the screen) when the golden circle is on the hollow! ${n} ball${n > 1 ? 's' : ''} left`,
    undamaRate: (n) => `Missed… it bounced into the sea. Wait until the circle is right on the hollow. ${n} ball${n > 1 ? 's' : ''} left`,
    undamaPerdu: ['All five balls fell into the sea…', 'Never mind: the stall sells more. Here, almost everyone misses!'],
    undamaGagne: ['Clack! The ball landed right in the hollow of the turtle rock!', 'They say your wish will come true. The balls are made of clay: the sea gently takes them back.'],
    undamaCompagnon: { kon: ['“In! The turtle caught it.”'], pon: ['“Pon pon! First try… well, almost!”'], chapu: ['“Chapuuu! I wanted to fetch the ones that fell… but no.”'], gao: ['“Gao! A champion’s throw.”'], fuwa: ['“Fuwa… Toyotama-hime’s turtle! She carried the princess all the way here.”'], saya: ['“The earth goes back to the sea… and the wish stays.”'] },
    kameishi: ['In the sea, in front of the shrine: the turtle rock (亀石). They say it’s the turtle that carried Toyotama-hime here, turned to stone.', 'On its back, a square hollow ringed by a rope. People throw luck balls (運玉) into it: the stall on the terrace sells them.'],
    kameishiNuit: ['At night, the turtle rock is just a shadow in the foam. The waves stroke its back.'],
    echoppe: ['Luck balls (運玉)! Five clay balls with the character “luck” (運) on them.', 'The children of Udo’s school make them, since 1954. Would you like some?'],
    echoppeNon: ['Come back whenever you like!'],
    echoppeDonne: ['Here are your five balls. Throw them from the edge of the terrace, at the hollow of the turtle rock!', 'Boys with the left hand, girls with the right!'],
    echoppeDeja: ['You still have your balls! Go and throw them at the edge of the terrace.'],
    vendeuse: ['“おちちあめ”, Udo’s candies! They’re made with water from the mother’s rocks, at the back of the cave.', 'Mothers used to give them to their babies, so they’d grow up well. Want a taste?'],
    vendeuseNon: ['Another time!'],
    ame: ['It’s sweet, like milk and sugar… a taste from long ago.'],
    ameCompagnon: { kon: ['“Such a gentle taste… like a memory.”'], pon: ['“Pon! Another one! And one for the road!”'], chapu: ['“Chapu! It sticks to my teeth!”'], gao: ['“Gao… A guardian’s candy. I’m guarding the bag.”'], fuwa: ['“Fuwa… It tastes of the sea, but sweet.”'], saya: ['“It smells of rice and sunshine.”'] },
    kannushi: ['Welcome to the cave of Udo. Here, Toyotama-hime gave birth to her child, under a hut whose roof of cormorant (鵜) feathers wasn’t finished yet.', 'He was named Ugayafukiaezu, “the cormorant roof not finished”. He is the god of this shrine, the father of the first emperor.'],
    kannushiSoir: ['In the evening, when the lanterns light up in the cave, it’s even more beautiful. Would you like to stay until night?'],
    kannushiNon: ['As you wish. The cave isn’t going anywhere!'],
    kannushiNuitTombe: ['Look… the lanterns are lighting up, the shrine glows in the rock. You can hear the sea breathing.'],
    kannushiNuit: ['The night is lovely on the Hyūga sea. Would you like to see the morning again?'],
    kannushiReste: ['Enjoy the night.'],
    kannushiMatin: ['Here comes the sun, rising over the sea. Its first ray reaches all the way into the cave.'],
    batelier: ['Hey, traveller! My boat goes to Yakushima, the island of thousand-year-old cedars, far to the south.', 'Long ago, pilgrims climbed up to the shrine by the old stairs, from this very harbour of Fukei. I go the other way: out to sea!', 'But the sea deserves respect: I only take those who have greeted the gods of Udo. Bring me the shrine’s five stamps.'],
    batelierNuit: ['We don’t set off at night: we watch the stars and listen to the sea.', 'Bring me Udo’s five stamps, and I’ll take you to Yakushima.'],
    batelierReste: (n) => `You still need ${n} stamp${n > 1 ? 's' : ''}.`,
    batelierPret: ['Oh! Udo’s five stamps! Toyotama-hime, daughter of the god of the sea, is watching over you now.', 'Shall we set off for Yakushima?'],
    batelierAttend: ['I’ll wait for you. The boat is ready when you are.'],
    batelierBientot: ['Hmm… the engine is coughing a bit this morning. I need a little more time to fix it.', 'Come back soon: I’ll take you to Yakushima, I promise!'],
    toutCompagnon: { kon: ['Every stamp of Udo!', 'The boatman at the harbour, at the bottom of the old stairs, can take us to Yakushima!'], pon: ['Pon! The book is full!', 'Quick, to the harbour: the boatman is waiting to take us to Yakushima!'], chapu: ['Every stamp! Chapu chapu!', 'The boat! We’re taking the boat to Yakushima! To the harbour, down the old stairs, quick!'], gao: ['Gao! Mission accomplished: all five stamps.', 'The boatman at the harbour, at the bottom of the old stairs, will take us to Yakushima.'], fuwa: ['Fuwaaa! Every stamp!', 'The sea is calling us… The boatman at the harbour, down the old stairs, is waiting!'], saya: ['All five stamps… The princess of the sea watches over us.', 'Yakushima, the island of the great cedars… Let’s go and see the boatman, down at the harbour.'] },
    bateau: ['The boatman’s boat: a white hull, a blue stripe, the fishermen’s flag at the top of the mast. Ready to go.'],
    bateauNuit: ['At night, the boatman’s boat sleeps against the quay. The water laps against its hull.'],
    honden: ['You ring the bell and clap your hands twice, in front of the great vermilion shrine, under the roof of the cave.', 'People come to pray for births and for lovers: here, a princess of the sea gave life.'],
    hondenNuit: ['At night, the red lanterns light up the shrine; the whole cave turns golden. You pray in silence.'],
    oji: ['The little shrine of the prince (皇子神社), beside the great one. People pray here for children.'],
    voute: ['Above you, the vault of the cave: grey and ochre rock, carved by the sea thousands of years ago.', 'The real cave is nearly 40 metres wide. The sea used to come in.'],
    vouteNuit: ['At night, the vault of the cave vanishes into the dark. Only the shrine glows, like a lantern.'],
    toriiGrotte: ['The vermilion torii at the entrance of the cave. Beyond it, you’re in the home of the gods.'],
    tamabashi: ['The Tamabashi bridge (玉橋), arching over the sea. Long ago, people took off their shoes here, to walk barefoot to the shrine.'],
    tamabashiNuit: ['At night, the sea rumbles under the Tamabashi. Its golden knobs shine under the lanterns.'],
    lanternes: ['The stone lanterns of the Itō lords of Obi, who protected the shrine. Look at their windows: each one is a different moon, from the new moon to the full moon.'],
    lanternesNuit: ['At night, the lanterns are lit: a row of little moons, from new to full.'],
    platier: ['At the foot of the cliff, the rock is striped like a giant washboard: the “oni’s washboard” (鬼の洗濯板).', 'Layers of hard sandstone and soft stone, worn by the sea for thousands of years.'],
    platierNuit: ['At night, the sea turns white along the stripes of the rock. You can hear it breathing.'],
    romon: ['The Rōmon (楼門), the great two-storey red gate. At the top, in the middle, a painted panel; in its sides, two seated guardians keep watch.'],
    romonNuit: ['At night, the Rōmon is a great red shadow under the stars.'],
    otorii: ['The shrine’s great torii, at the end of the street of shops. Beyond it begins the path of Udo-jingū.'],
    vueEscalier: ['There it is, the postcard view: the stairs going down along the cliff, the terrace, the cave and its vermilion shrine, and the Hyūga sea.', 'Udo is a shrine you go “down” to pray at (下り宮): that’s very rare in Japan.'],
    vueEscalierNuit: ['At night, far below, the cave glows like a red lacquer box set at the edge of the sea.'],
    portVue: ['Down below, the little harbour of Fukei (吹毛井港), at the end of the cove. The pilgrims’ old stairs lead down to it: the Hatchōzaka (八丁坂).'],
    portVueNuit: ['Down below, the little harbour is asleep. The red lighthouse on the breakwater keeps watch.'],
    chozuya: ['The purification fountain (手水舎). You wash your left hand, then your right, then rinse your mouth, before going to pray.'],
    'panneau-yuisho': ['“Udo-jingū (鵜戸神宮). The god: Ugayafukiaezu, son of Toyotama-hime, daughter of the god of the sea, and father of Emperor Jinmu.”', '“The shrine is built in a cave in the cliff, on the Hyūga sea: you go down to pray. People come here for births, weddings and luck.”'],
    'panneau-kameishi': ['“The turtle rock (霊石亀石). They say it’s the turtle that carried Toyotama-hime from the dragon palace.”', '“Throw luck balls (運玉) into the hollow on its back: men with the left hand, women with the right. If the ball stays in, your wish will come true.”'],
    'panneau-hatcho': ['“八丁坂 ↓ 吹毛井港”: the Hatchōzaka, down to Fukei harbour.', 'The oldest path to the shrine: a stone staircase down to the harbour. The middle of the steps is worn hollow by centuries of feet.'],
    videaste: ['Hi! I’m filming the cave for my channel. A vermilion shrine in a cliff, by the Pacific… You only see that here.', 'Want to see my video?'],
    obaa: ['I’ve come to pray for my granddaughter: she’s expecting a baby in the spring.', 'Here, the princess of the sea brought her child into the world. Every grandmother in Miyazaki comes to pray at Udo!'],
    mariee: ['We’ve just got married! Long ago, newlyweds came to Udo on a horse covered with little bells (シャンシャン馬).', 'I throw with my right hand… and him with his left!'],
    marie: ['I missed all five balls… She got it on the first try.', 'She says it means she’ll always be right. Off to a good start!'],
    ecolier: ['You know what? The luck balls, we make them, at Udo’s school!', 'We roll them by hand and stamp the character “luck” on them. I made loads this year!'],
    photographe: ['From here you get the best view of Udo: the stairs, the cave, the sea. In the morning, the sun reaches all the way to the shrine.'],
    gardien: ['Hello, hello. I sweep the Inari shrine every morning.', 'The torii on the stairs were given by people whose wish came true. Each one bears a name.'],
    touriste: ['Did you see the lanterns? Their windows are moons! A new moon, a crescent… up to the full moon.'],
    touriste2: ['Look down there, the striped rock: the oni’s washboard! It’s as if a giant had combed the sea.'],
    pecheuse: ['Fresh fish from this morning! Horse mackerel, mackerel… The Hyūga sea is generous.', 'The boatman? He knows every route on the sea, all the way to Yakushima.', 'Cormorants (鵜) fish here every morning. Now and then, one leaves a feather on the quay…'],
    // the cormorant feathers' secret: the birth hut (産屋), the three feathers, the cormorant
    hutte: ['A little hut of rough wood, against the rock wall: 産屋 (ubuya), the birth hut.', 'Here, Toyotama-hime gave birth to her baby. They were thatching the roof with cormorant (鵜) feathers, but the baby was born before it was done: at the top, you can still see the poles.'],
    huttePlumes: (n) => [`You have ${n} cormorant feather${n > 1 ? 's' : ''}. It takes three to finish the roof.`],
    hutteCompagnon: { kon: ['“The roof isn’t finished… With three cormorant feathers, we could finish it! There must be some around.”'], pon: ['“Pon! A roof with a hole keeps nothing out. Let’s find three cormorant feathers to finish it!”'], chapu: ['“Chapu! Cormorant feathers… Cormorants are fishers, like me! There must be some lying near the sea.”'], gao: ['“Gao… A half-built roof. Let’s find three cormorant feathers and finish it.”'], fuwa: ['“Fuwa… The sea princess’s hut! Three cormorant feathers, and its roof would finally be finished.”'], saya: ['“The roof has waited so long… Three cormorant feathers would do. Let’s look for them.”'] },
    hutteMettre: ['You have the three cormorant feathers. Lay them on the hut’s roof?'],
    hutteMet: ['You raise the three feathers toward the top of the roof…'],
    hutteFin: ['The hut’s roof is finished!', 'Many centuries later, Toyotama-hime’s baby finally has his roof of cormorant feathers.'],
    cormoranCompagnon: { kon: ['“A cormorant! It came to see the finished roof… and now it’s heading back to the sea.”'], pon: ['“Pon! It left so fast! It’s going to tell the princess, I’m sure!”'], chapu: ['“Chapu! A cormorant! Off fishing, like me! Good fishing!”'], gao: ['“Gao… It watched over the hut all this time. Now it can go home.”'], fuwa: ['“Fuwaaa! It’s going home to the dragon palace, to the princess!”'], saya: ['“It was here for so long… Now it’s free.”'] },
    hutteFinie: ['The birth hut, its roof of cormorant feathers finished at last. Its little lamp keeps watch by the cradle.'],
    plumeRamassee: (n) => [`A big bronze feather edged with black: a cormorant (鵜) feather! (${n} of 3)`],
    plumeInconnueCompagnon: { kon: ['“A cormorant feather! Udo means ‘the cormorant’s door’. In the cave, the hut where the princess had her baby never got its roof finished… Let’s find three feathers and go finish it!”'], pon: ['“Pon! A cormorant feather! In the cave there’s a little hut whose feather roof was never finished. With three feathers, we could finish it!”'], chapu: ['“Chapu! A feather of the cormorant, the great black fisher! The roof of the birth hut, in the cave, isn’t finished… Three feathers and there we go!”'], gao: ['“Gao. A cormorant feather. The hut in the cave has always waited for its roof: three feathers, and we finish it.”'], fuwa: ['“Fuwaaa! A cormorant feather! The hut where the sea princess had her baby, in the cave: its roof isn’t finished. Let’s find three!”'], saya: ['“A cormorant feather… The birth hut, in the cave, never got its roof finished. Three feathers, and it would be whole.”'] },
    plumeCompagnon: { kon: ['“A feather for the hut’s roof! Two more.”'], pon: ['“Pon! One! Just two feathers to go!”'], chapu: ['“Chapu! It smells of the sea! Two more feathers!”'], gao: ['“Gao. One found. Two to find.”'], fuwa: ['“Fuwa! A feather for the princess! Two more!”'], saya: ['“A feather… The roof still waits for two more.”'] },
    plumeDerniereCompagnon: { kon: ['“Just one feather left!”'], pon: ['“Pon! Just one left!”'], chapu: ['“Chapu! One last feather!”'], gao: ['“Gao. One left.”'], fuwa: ['“Fuwa! Only one more!”'], saya: ['“One feather left…”'] },
    plumeDerniere: (lieu) => [`The last cormorant feather is ${lieu}.`],
    lieuxPlumes: { p1: 'on the landing of Udo Inari, at the top of the red torii', p2: 'on the point, just past the Tamabashi bridge', p3: 'on the harbour quay, at the bottom of the old stairs' },
    plumesHutteCompagnon: { kon: ['“All three feathers! Let’s lay them on the hut’s roof, in the cave, north of the shrine.”'], pon: ['“Pon pon! All three! Quick, to the hut in the cave, north of the shrine!”'], chapu: ['“Chapu chapu! Three feathers! To the hut, in the cave, north of the shrine!”'], gao: ['“Gao. The three feathers. On to the hut, in the cave, north of the shrine.”'], fuwa: ['“Fuwaaa! All three! The princess’s hut is waiting, in the cave, north of the shrine!”'], saya: ['“The three feathers… Let’s carry them to the hut, in the cave, north of the shrine.”'] },
    kannushiHutte: ['Have you seen the little hut against the rock wall, north of the shrine? Its roof is still waiting for its last feathers…'],
    randonneur: ['I’m climbing the Hatchōzaka, the pilgrims’ old stairs: eight chō, about eight hundred metres of steps, from the harbour to the shrine!', 'They say nuns carried its stones up from the beach, balanced on their heads!'],
    chauffeur: ['The Nichinan coast bus. Next departure in an hour: take your time, Udo is best seen slowly.'],
    chatPort: ['A ginger cat is asleep on the quay, next to the nets. It smells of fish.', 'You pet it… Rrrrrr…'],
    chatPortNuit: ['At night, the harbour cat is awake: it watches the boats. Its eyes glow.'],
    chatRue: ['A black-and-white cat strolls past the shops. It knows every shady corner.', 'You pet it… Rrrrrr…'],
    chatRueNuit: ['At night, the black-and-white cat sleeps in front of a closed shop.'],
    chatCompagnon: { kon: ['“A harbour cat… It knows every boat.”'], pon: ['“Pon! He sleeps like me after a good meal.”'], chapu: ['“Chapu! He smells of fish… We’re made to get along!”'], gao: ['“Gao… A sleeping guardian. I’ll take over.”'], fuwa: ['“Fuwa… He purrs like the waves.”'], saya: ['“He’s warm like a stone in the sun.”'] },
    papillon: ['A butterfly drifts on the sea wind, above the cycads.'],
    libellule: ['A red dragonfly (akatombo) lands on a vermilion fence.'],
  },
  ja: {
    noms: { miko: 'みこさん', vendeuse: 'あめやさん', echoppe: '運玉の　おみせの　人', kannushi: 'かんぬしさん', obaa: 'おばあさん', mariee: 'はなよめさん', marie: 'はなむこさん', ecolier: 'しょうがくせい', videaste: '@random_japan_place', photographe: 'カメラマン', gardien: 'お稲荷さんの　もりびと', touriste: 'かんこうきゃく', touriste2: 'かんこうきゃく', batelier: 'せんどうさん', pecheuse: 'りょうしの　おばさん', randonneur: 'ハイカー', chauffeur: 'バスの　うんてんしゅ' },
    tampons: {
      ema: ['うさぎの　絵馬', '神門の　ひろばの　授与所。うさぎの　かたちの　絵馬に　ねがいを　かいて、かける'],
      inari: ['鵜戸稲荷', 'さんどうの　北、赤い　鳥居の　かいだんの　上。小さな　お稲荷さんに　おまいり'],
      usagi: ['撫でうさぎ', 'どうくつの　中、本殿の　南。白い　石の　うさぎを　なでる'],
      ochichi: ['お乳岩', 'どうくつの　おく、本殿の　うしろ。お乳岩の　しずくを　うける'],
      undama: ['運玉', 'テラスの　はし。運玉（おみせで　うっている）を　亀石の　くぼみに　なげいれる'],
    },
    miko: ['鵜戸神宮へ　ようこそ！　ここでは　うさぎが　かみさまの　おつかいです。', 'うさぎの　かたちの　絵馬に　ねがいを　かきますか？　かいたら、となりの　絵馬かけに　かけます。'],
    mikoNon: ['わかりました！　うさぎたちが　まっていますよ。'],
    mikoApres: ['あなたの　うさぎも　みんなと　いっしょに　かかっています。かみさまが　きっと　よんでくれますよ。'],
    emaVoeu: ['うさぎに　なにを　かく？'],
    emaVoeux: ['すてきな　たび', 'げんきで　いられますように', 'ずっと　ともだち', 'べんきょうが　できますように'],
    emaEcrit: ['「たびが　さいごまで　すてきで　ありますように」と　かいた。', '「わたしと　だいすきな　人が　げんきで　いられますように」と　かいた。', '「あいぼうと　ずっと　ともだちで　いられますように」と　かいた。', '「べんきょうが　できますように……　さんすうも」と　かいた。'],
    emaPendu: ['うさぎの　絵馬を　みんなと　いっしょに　かけた。うみの　かぜに　ゆれている。'],
    emaCompagnon: { kon: ['「あなたの　うさぎ、ともだちと　いっしょで　うれしそうです。」'], pon: ['「ポン！　ぼくなら『おかしが　ずっと　たべられますように』って　かく。」'], chapu: ['「チャプ！　うさぎたちが　かぜで　おどってる！」'], gao: ['「ガオ……　そのねがい、ぼくが　まもる。」'], fuwa: ['「フワ……　うみの　かぜに　のって　いく　ねがい。」'], saya: ['「木と　ことばと　かぜ……　ねがいは　木みたいに　そだつの。」'] },
    inari: ['すずを　ならして、手を　二回　たたいた。', '小さな　お稲荷さんは　鵜戸の　おかを　見まもっている。赤い　鳥居は、ねがいが　かなった　人が　一つずつ　おさめたもの。'],
    inariNuit: ['よるの　赤い　鳥居は　まっくろに　見える。小さな　お稲荷さんの　すずを　ならして、手を　二回　たたいた。'],
    inariCompagnon: { kon: ['「お稲荷さん！　ちょっと　わたしの　いえみたいです……　石の　キツネが　ウインクしました。」'], pon: ['「ポン！　キツネだらけ……　おじゃましてるから　おぎょうぎよく　する。」'], chapu: ['「チャプ！　鳥居が　いっぱい、まほうの　トンネルみたい！」'], gao: ['「ガオ！　まもりの　キツネが　二ひき。まもりがみ　どうし、わかりあえる。」'], fuwa: ['「フワ……　ここから　木の　あいだに　うみが　見える。」'], saya: ['「おかの　クスノキは　としよりで　やさしいの……　この　お宮が　すきなのね。」'] },
    usagi: ['いわの　上の　白い　石の　うさぎ（撫でうさぎ）。うさぎは　鵜戸の　かみさまの　おつかい。', 'よくなりたい　ところを　なでると　いいんだって。どこを　なでる？'],
    usagiChoix: ['あたま', 'みみ', 'せなか', 'あし'],
    usagiCaresse: ['あたまを　なでた。なんだか　あたまが　すっきり　した！', 'ながい　みみを　なでた。なみの　おとが　よく　きこえる。', 'せなかを　なでた。かいだんの　つかれが　とんでいった！', 'あしを　なでた。みなとまで　はしって　いきたく　なった！'],
    usagiCompagnon: { kon: ['「ひかりました！　かみさまの　おつかいは　すぐ　わかります。」'], pon: ['「ポン！　ぼくの　おなかも　なでてみる？」'], chapu: ['「チャプ！　すべすべ……　石なのに！」'], gao: ['「ガオ……　まもりの　うさぎ。見た目より　つよい。」'], fuwa: ['「フワ……　うさぎは　月が　すき。この子は　うみが　すき。」'], saya: ['「なん千もの　手が　なでたのね……　石が　つるつる。」'] },
    ochichiAvant: ['本殿の　うしろ、どうくつの　おくで、まるい　いわから　ぽたぽた　水が　しみだしている。お乳岩だ。', 'いわの　下に　手を　さしだした……'],
    ochichi: ['ぽちゃん！　つめたい　しずくが　手の　ひらに　おちた。', 'むかし、ここで　うみの　かみさまの　むすめ・豊玉姫が　あかちゃんを　うんだ。うみへ　かえる　とき、あかちゃんが　のめるように　お乳を　いわに　のこしたという。いまも　水が　しみだしていて、子どもが　すくすく　そだつ　「おちちあめ」が　つくられている。'],
    ochichiCompagnon: { kon: ['「じぶんの　かわりに　子どもを　見まもる　おかあさん……　すてきです。」'], pon: ['「ポン……　なんだか　おかあさんに　あいたく　なっちゃった。」'], chapu: ['「チャプ！　うみの　おひめさまの　水！　つめたい！」'], gao: ['「ガオ……　いまも　見まもってる。まもりがみ　みたいに。」'], fuwa: ['「フワァ……　豊玉姫は　ぼくの　ふるさと、竜宮の　人だよ！」'], saya: ['「いわは　おぼえているの……　ずっと　あたえつづけて　いるのね。」'] },
    undamaPret: ['目の　まえの　うみに、亀石。せなかに　なわで　かこまれた　しかくい　くぼみが　ある。', 'おとこの子は　左手、おんなの子は　右手で　なげる。五つの　運玉を　なげる？'],
    undamaAide: (n) => `金色の　わが　くぼみに　きたら　A（または　がめんを　タップ）！　のこり　${n}こ`,
    undamaRate: (n) => `ざんねん……　うみに　はねて　いった。わが　くぼみに　ぴったり　くるまで　まって。のこり　${n}こ`,
    undamaPerdu: ['五つとも　うみに　おちて　しまった……', 'だいじょうぶ、おみせで　また　かえるよ。ここでは　ほとんどの　人が　はずすんだ！'],
    undamaGagne: ['コトン！　運玉が　亀石の　くぼみに　ぴったり　はいった！', 'ねがいが　かなうと　いわれている。運玉は　つちで　できていて、うみに　ゆっくり　かえっていく。'],
    undamaCompagnon: { kon: ['「はいりました！　カメが　うけとめてくれました。」'], pon: ['「ポンポン！　一かいで……　まあ、だいたい　一かいで！」'], chapu: ['「チャプゥ！　おちた　玉を　ひろいに　いきたかった……　けど　やめとく。」'], gao: ['「ガオ！　チャンピオンの　なげかた。」'], fuwa: ['「フワ……　豊玉姫の　カメ！　おひめさまを　ここまで　はこんだんだ。」'], saya: ['「つちは　うみへ　かえり……　ねがいは　のこるの。」'] },
    kameishi: ['本殿の　まえの　うみに、亀石。豊玉姫を　ここまで　のせてきた　カメが　石に　なったと　いわれている。', 'せなかには　なわで　かこまれた　しかくい　くぼみ。そこへ　運玉を　なげる。運玉は　テラスの　おみせで　うっている。'],
    kameishiNuit: ['よるの　亀石は　しぶきの　中の　かげ。なみが　せなかを　なでている。'],
    echoppe: ['運玉だよ！　「運」の　字が　ついた　つちの　玉が　五つ。', '鵜戸の　しょうがっこうの　子どもたちが　1954年から　つくっているの。いるかい？'],
    echoppeNon: ['また　おいで！'],
    echoppeDonne: ['はい、運玉　五つ。テラスの　はしから、亀石の　くぼみに　なげてごらん！', 'おとこの子は　左手、おんなの子は　右手だよ！'],
    echoppeDeja: ['まだ　運玉が　のこってるよ！　テラスの　はしで　なげておいで。'],
    vendeuse: ['鵜戸の　「おちちあめ」だよ！　どうくつの　おくの　お乳岩の　水で　つくるの。', 'むかしの　おかあさんは　あかちゃんに　なめさせて、すくすく　そだつように　ねがったんだよ。たべてみる？'],
    vendeuseNon: ['また　こんどね！'],
    ame: ['ミルクと　おさとうみたいな　やさしい　あじ……　むかしの　あじだ。'],
    ameCompagnon: { kon: ['「やさしい　あじ……　おもいでみたい。」'], pon: ['「ポン！　もう　一つ！　かえり道の　ぶんも！」'], chapu: ['「チャプ！　はに　くっつく！」'], gao: ['「ガオ……　まもりびとの　あめ。ふくろは　ぼくが　まもる。」'], fuwa: ['「フワ……　うみの　あじ、でも　あまい。」'], saya: ['「おこめと　おひさまの　においが　する。」'] },
    kannushi: ['鵜戸の　どうくつへ　ようこそ。ここで　豊玉姫が　あかちゃんを　うみました。鵜（う）の　はねで　ふく　やねが　まだ　できあがって　いなかったのです。', 'それで　あかちゃんは　「ウガヤフキアエズ」、「鵜の　やねが　ふきおわらない」と　よばれました。この　神社の　かみさまで、はじめての　天皇の　おとうさんです。'],
    kannushiSoir: ['ゆうがた、どうくつに　ちょうちんが　ともると、もっと　きれいですよ。よるまで　いますか？'],
    kannushiNon: ['どうぞ　ごゆっくり。どうくつは　にげませんから！'],
    kannushiNuitTombe: ['ごらんなさい……　ちょうちんが　ともり、いわの　中で　お宮が　かがやいています。うみの　いきが　きこえますね。'],
    kannushiNuit: ['日向の　うみの　よるは　きれいですね。あさに　もどしますか？'],
    kannushiReste: ['よるを　たのしんで　ください。'],
    kannushiMatin: ['うみから　お日さまが　のぼりました。さいしょの　ひかりが　どうくつの　おくまで　とどきます。'],
    batelier: ['よう、たびの　人！　わしの　船は　ずっと　南の　屋久島、千年スギの　しままで　いくんだ。', 'むかしの　さんぱいしゃは　この　吹毛井の　みなとから、ふるい　かいだんを　のぼって　いったもんだ。わしは　ぎゃくに　うみへ　でるのさ！', 'でも　うみは　あなどれん。鵜戸の　かみさまに　あいさつした　人しか　のせない。神社の　スタンプを　五つ　あつめて　おいで。'],
    batelierNuit: ['よるは　船を　ださない。ほしを　見て、うみの　おとを　きくんだ。', '鵜戸の　スタンプを　五つ　あつめたら、屋久島へ　つれていくよ。'],
    batelierReste: (n) => `スタンプは　あと　${n}こ　たりないな。`,
    batelierPret: ['おお！　鵜戸の　スタンプが　五つ！　うみの　かみさまの　むすめ、豊玉姫が　もう　おまえを　まもってくれる。', '屋久島へ　しゅっぱつ　するか？'],
    batelierAttend: ['まってるよ。おまえの　したくが　できたら　いつでも　いける。'],
    batelierBientot: ['うーん……　けさは　エンジンが　ちょっと　せきこんでる。なおすのに　もう　すこし　じかんが　いるな。', 'また　すぐ　おいで。かならず　屋久島へ　つれていくから！'],
    toutCompagnon: { kon: ['鵜戸の　スタンプ、ぜんぶ　そろいました！', 'ふるい　かいだんの　下の　みなとの　せんどうさんが、屋久島へ　つれていってくれます！'], pon: ['ポン！　ちょうめんが　いっぱい！', 'はやく　みなとへ。せんどうさんが　屋久島へ　つれてってくれる！'], chapu: ['スタンプ　ぜんぶ！　チャプチャプ！', '船！　船で　屋久島へ　いくんだ！　ふるい　かいだんを　おりて、みなとへ　いそげ！'], gao: ['ガオ！　にんむ　かんりょう。スタンプ　五つ。', 'ふるい　かいだんの　下の　みなとの　せんどうさんが、屋久島へ　つれていってくれる。'], fuwa: ['フワァ！　スタンプ　ぜんぶ！', 'うみが　よんでる……　ふるい　かいだんの　下の　みなとの　せんどうさんが　まってるよ！'], saya: ['スタンプが　五つ……　うみの　おひめさまが　見まもってくれる。', '大きな　スギの　しま、屋久島……　下の　みなとの　せんどうさんに　あいに　いきましょう。'] },
    bateau: ['せんどうさんの　船。白い　ふなべりに　青い　せん、マストの　上には　りょうしの　はた。いつでも　しゅっぱつ　できそう。'],
    bateauNuit: ['よるの　船は　がんぺきで　ねむっている。なみが　ふなべりで　ちゃぷちゃぷ　いう。'],
    honden: ['どうくつの　やねの　下、朱色の　本殿の　まえで　すずを　ならし、手を　二回　たたいた。', 'あかちゃんの　たんじょうや、こいびとたちの　ために　おまいりに　くる　ところ。ここで　うみの　おひめさまが　いのちを　うんだから。'],
    hondenNuit: ['よるは　赤い　ちょうちんが　本殿を　てらし、どうくつが　金色に　なる。だまって　おいのりした。'],
    oji: ['本殿の　となりの　小さな　皇子神社。子どもの　ために　おまいりする　ところ。'],
    voute: ['頭の　上は　どうくつの　てんじょう。なん千年も　まえに　うみが　けずった、はいいろと　黄土色の　いわ。', 'ほんものの　どうくつは　はばが　40メートル　ちかくも　ある。むかしは　うみが　はいってきていた。'],
    vouteNuit: ['よるの　どうくつの　てんじょうは　まっくら。本殿だけが　ちょうちんみたいに　かがやいている。'],
    toriiGrotte: ['どうくつの　いりぐちの　朱色の　鳥居。この　さきは　かみさまの　すまい。'],
    tamabashi: ['うみの　上に　かかる　玉橋。むかしは　ここで　くつを　ぬいで、はだしで　本殿まで　あるいた。'],
    tamabashiNuit: ['よるの　玉橋の　下で　うみが　ごうごう　なっている。金色の　ぎぼしが　ちょうちんに　ひかる。'],
    lanternes: ['神社を　まもった　飫肥の　伊東家が　おさめた　石灯籠。まどを　見て。新月から　まん月まで、一つずつ　ちがう　月の　かたち！'],
    lanternesNuit: ['よるは　灯籠に　あかりが　ともる。新月から　まん月まで、小さな　月が　ならんでいる。'],
    platier: ['がけの　下の　いわは、大きな　せんたくいたみたいな　しまもよう。「鬼の　洗濯板」だ。', 'かたい　さがんと　やわらかい　いわの　そうを、なん千年も　なみが　けずって　できた。'],
    platierNuit: ['よる、いわの　しまに　そって　なみが　白く　なる。うみの　いきが　きこえる。'],
    romon: ['二かいだての　赤い　大きな　門、楼門。上の　まんなかに　えが　あって、りょうがわでは　すわった　まもりびとが　見はっている。'],
    romonNuit: ['よるの　楼門は、ほしぞらの　下の　大きな　赤い　かげ。'],
    otorii: ['おみやげやさんの　とおりの　さきの、神社の　大鳥居。ここから　鵜戸神宮の　さんどうが　はじまる。'],
    vueEscalier: ['これが　はがきの　けしき！　がけに　そって　おりる　かいだん、テラス、どうくつと　朱色の　本殿、そして　日向の　うみ。', '鵜戸は　「くだって」　おまいりする　お宮（下り宮）。日本でも　とても　めずらしい。'],
    vueEscalierNuit: ['よる、ずっと　下で、どうくつが　うみべに　おいた　赤い　うるしの　はこみたいに　かがやいている。'],
    portVue: ['下に　見えるのは、入り江の　おくの　小さな　吹毛井港。さんぱいしゃの　ふるい　かいだん、八丁坂が　そこへ　おりていく。'],
    portVueNuit: ['下の　小さな　みなとは　ねむっている。ていぼうの　赤い　とうだいが　見まもっている。'],
    chozuya: ['手水舎。おまいりの　まえに、左手、右手を　あらって、口を　すすぐ。'],
    'panneau-yuisho': ['「鵜戸神宮。ごさいじん：ウガヤフキアエズノミコト。うみの　かみさまの　むすめ・豊玉姫の　子で、神武天皇の　おとうさん。」', '「日向の　うみに　めんした　がけの　どうくつに　たつ　お宮で、くだって　おまいりします。あんざん、えんむすび、うんの　かみさまです。」'],
    'panneau-kameishi': ['「霊石　亀石。豊玉姫が　竜宮から　のってきた　カメと　いわれています。」', '「せなかの　くぼみに　運玉を　なげいれましょう。男性は　左手、女性は　右手で。はいれば　ねがいが　かなうと　いわれます。」'],
    'panneau-hatcho': ['「八丁坂　↓　吹毛井港」　みなとへ　おりる　みちの　あんないばん。', '八丁坂は　鵜戸神宮の　いちばん　ふるい　さんどう。まんなかの　石だんは、なん百年もの　あしあとで　すりへって　いる。'],
    videaste: ['やあ！　チャンネルの　ために　どうくつを　とってるんだ。太平洋の　がけの　中の　朱色の　お宮……　ここでしか　見られないよ。', 'ぼくの　どうが、見る？'],
    obaa: ['まごむすめの　ために　おまいりに　きたの。はるに　あかちゃんが　うまれるのよ。', 'ここで　うみの　おひめさまが　あかちゃんを　うんだの。宮崎の　おばあちゃんは　みんな　鵜戸に　おまいりに　くるのよ！'],
    mariee: ['わたしたち、けっこんした　ばかりなの！　むかしは　はなよめと　はなむこが　すずで　かざった　馬（シャンシャン馬）で　鵜戸に　きたんだって。', 'わたしは　右手で　なげて……　かれは　左手！'],
    marie: ['五つとも　はずしちゃった……　かのじょは　一かいめで　はいったのに。', 'それって　いつも　かのじょが　ただしいって　ことだって。さいさきが　いいね！'],
    ecolier: ['しってる？　運玉は　ぼくたち、鵜戸しょうがっこうの　子どもが　つくってるんだよ！', 'てで　まるめて、「運」の　字を　おすんだ。ことしは　いっぱい　つくったよ！'],
    photographe: ['ここから　鵜戸で　いちばん　きれいな　けしきが　見える。かいだん、どうくつ、うみ。あさは　お日さまが　お宮まで　とどくんだ。'],
    gardien: ['おはよう、おはよう。まいあさ　お稲荷さんを　はいてるんだ。', 'かいだんの　鳥居は、ねがいが　かなった　人たちが　おさめたもの。一つずつ　なまえが　かいてあるよ。'],
    touriste: ['灯籠、見た？　まどが　月なの！　新月、みかづき……　まん月まで。'],
    touriste2: ['下の　しまもようの　いわを　見て。鬼の　洗濯板！　きょじんが　うみを　くしで　とかしたみたい。'],
    pecheuse: ['けさの　とれたての　さかなだよ！　アジに　サバ……　日向の　うみは　ゆたかだね。', 'せんどうさん？　屋久島まで、うみの　みちは　ぜんぶ　しってるよ。', '鵜は　まいあさ　ここで　さかなを　とるんだよ。ときどき、きしに　はねを　おとして　いくの……'],
    // 鵜の　はねの　ひみつ：産屋、三まいの　はね、鵜
    hutte: ['いわの　かべに　そって　たつ、小さな　木の　こや。産屋（うぶや）、あかちゃんが　うまれる　こやです。', 'ここで　豊玉姫が　あかちゃんを　うみました。鵜（う）の　はねで　やねを　ふいて　いたけれど、できあがる　まえに　うまれて　しまったのです。上の　ほうは、まだ　ぼうが　見えて　います。'],
    huttePlumes: (n) => [`鵜の　はねは　いま　${n}まい。やねを　しあげるには　三まい　いります。`],
    hutteCompagnon: { kon: ['「やねが　できあがって　いない……　鵜の　はねが　三まい　あれば、しあげられるよ！　どこかに　あるはず。」'], pon: ['「ポン！　あなの　あいた　やねじゃ、なんにも　まもれない。鵜の　はねを　三まい　さがして、しあげよう！」'], chapu: ['「チャプ！　鵜の　はね……　鵜は　ぼくと　おなじ　りょうしなんだ！　うみの　ちかくに　おちてるかも。」'], gao: ['「ガオ……　はんぶんの　やね。鵜の　はねを　三まい　みつけて、しあげよう。」'], fuwa: ['「フワ……　うみの　おひめさまの　こや！　鵜の　はねが　三まい　あれば、やっと　やねが　できあがる。」'], saya: ['「やねは　ずっと　まって　いたのね……　鵜の　はねが　三まい　あれば　いい。さがしましょう。」'] },
    hutteMettre: ['鵜の　はねが　三まい　そろいました。こやの　やねに　のせますか？'],
    hutteMet: ['三まいの　はねを　やねの　上へ　さしあげると……'],
    hutteFin: ['こやの　やねが　できあがりました！', 'なん百年も　たって、豊玉姫の　あかちゃんに　やっと　鵜の　はねの　やねが　できました。'],
    cormoranCompagnon: { kon: ['「鵜だ！　できあがった　やねを　見に　きたんだね……　うみへ　かえって　いく。」'], pon: ['「ポン！　あっという　まに　いっちゃった！　きっと　おひめさまに　しらせに　いくんだ！」'], chapu: ['「チャプ！　鵜だ！　ぼくと　おなじで　さかなを　とりに　いくんだ！　たいりょう　でね！」'], gao: ['「ガオ……　ずっと　こやを　まもって　いたんだな。これで　かえれる。」'], fuwa: ['「フワ〜！　りゅうぐうじょうの　おひめさまの　ところへ　かえるんだ！」'], saya: ['「ずっと　ここに　いたのね……　やっと　じゆうに　なれたわ。」'] },
    hutteFinie: ['鵜の　はねの　やねが　やっと　できあがった　産屋。小さな　あんどんが　ゆりかごの　そばを　てらして　います。'],
    plumeRamassee: (n) => [`ふちの　くろい　ブロンズいろの　大きな　はね。鵜の　はねだ！（${n}／3）`],
    plumeInconnueCompagnon: { kon: ['「鵜の　はねだ！　鵜戸は　「鵜の　と」って　いみなんだよ。どうくつの　中の、おひめさまが　あかちゃんを　うんだ　こやは、やねが　できあがって　いないんだ……　はねを　三まい　あつめて、しあげに　いこう！」'], pon: ['「ポン！　鵜の　はねだ！　どうくつの　中に、はねの　やねが　できあがって　いない　小さな　こやが　あるんだ。三まい　あれば　しあげられるよ！」'], chapu: ['「チャプ！　くろくて　大きな　りょうし、鵜の　はねだ！　どうくつの　うぶやの　やねは　できあがって　いないんだ……　三まい　あつめれば　ばっちり！」'], gao: ['「ガオ。鵜の　はね。どうくつの　こやは　ずっと　やねを　まって　いる。三まい　あれば　しあげられる。」'], fuwa: ['「フワ〜！　鵜の　はねだ！　うみの　おひめさまが　あかちゃんを　うんだ　どうくつの　こや、やねが　できあがって　いないの。三まい　さがそう！」'], saya: ['「鵜の　はね……　どうくつの　うぶやは、やねが　できあがった　ことが　ないの。三まい　あれば　しあがるわ。」'] },
    plumeCompagnon: { kon: ['「こやの　やねの　はねが　一まい！　あと　二まい。」'], pon: ['「ポン！　一まい！　あと　二まいだ！」'], chapu: ['「チャプ！　うみの　においが　する！　あと　二まい！」'], gao: ['「ガオ。一まい　みつけた。あと　二まい。」'], fuwa: ['「フワ！　おひめさまの　ための　はね！　あと　二まい！」'], saya: ['「はねが　一まい……　やねは　あと　二まい　まって　いるわ。」'] },
    plumeDerniereCompagnon: { kon: ['「あと　一まいだ！」'], pon: ['「ポン！　あと　一まい！」'], chapu: ['「チャプ！　さいごの　一まい！」'], gao: ['「ガオ。あと　一まい。」'], fuwa: ['「フワ！　あと　一まい　だけ！」'], saya: ['「あと　一まい……」'] },
    plumeDerniere: (lieu) => [`さいごの　鵜の　はねは　${lieu}に　あります。`],
    lieuxPlumes: { p1: '赤い　鳥居の　上の、鵜戸稲荷の　ひろば', p2: '玉橋を　わたった　すぐ　さきの　みさき', p3: 'ふるい　かいだんの　下の、みなとの　きし' },
    plumesHutteCompagnon: { kon: ['「三まい　そろった！　どうくつの、本殿の　北に　ある　こやの　やねに　のせに　いこう。」'], pon: ['「ポンポン！　三まい！　はやく、どうくつの　本殿の　北の　こやへ！」'], chapu: ['「チャプチャプ！　はねが　三まい！　どうくつの　本殿の　北の　こやへ！」'], gao: ['「ガオ。はねが　三まい。どうくつの　本殿の　北の　こやへ　いこう。」'], fuwa: ['「フワ〜！　三まい　そろった！　おひめさまの　こやが　まってる、どうくつの　本殿の　北だよ！」'], saya: ['「三まいの　はね……　どうくつの　本殿の　北の　こやへ　はこびましょう。」'] },
    kannushiHutte: ['本殿の　北、いわの　かべの　そばの　小さな　こやを　見ましたか？　その　やねは、いまも　さいごの　はねを　まって　いるのです……'],
    randonneur: ['八丁坂を　のぼってるんだ。さんぱいしゃの　ふるい　かいだんで、みなとから　お宮まで　八町、やく　800メートルも　ある！', 'むかし、尼さんたちが　はまから　石を　あたまに　のせて　はこんで、つくったんだって！'],
    chauffeur: ['日南かいがんの　バスだよ。つぎの　しゅっぱつは　一じかんご。ゆっくり　見ておいで。'],
    chatPort: ['がんぺきの　あみの　そばで　茶トラの　ねこが　ねている。さかなの　におい。', 'なでてみた……　ゴロゴロ……'],
    chatPortNuit: ['よる、みなとの　ねこは　おきて　船を　見はっている。目が　ひかる。'],
    chatRue: ['白黒の　ねこが　おみせの　まえを　さんぽしている。日かげの　ばしょを　ぜんぶ　しってるみたい。', 'なでてみた……　ゴロゴロ……'],
    chatRueNuit: ['よる、白黒の　ねこは　しまった　おみせの　まえで　ねている。'],
    chatCompagnon: { kon: ['「みなとの　ねこ……　船を　ぜんぶ　しってるんですね。」'], pon: ['「ポン！　おなか　いっぱいの　ときの　ぼくみたいに　ねてる。」'], chapu: ['「チャプ！　さかなの　におい……　なかよく　なれそう！」'], gao: ['「ガオ……　ねむってる　まもりびと。こうたいしよう。」'], fuwa: ['「フワ……　なみみたいに　ゴロゴロ　いってる。」'], saya: ['「おひさまの　石みたいに　あったかい。」'] },
    papillon: ['ちょうちょが　うみの　かぜに　のって、ソテツの　上を　とんでいる。'],
    libellule: ['赤とんぼが　朱色の　さくに　とまった。'],
  },
};
