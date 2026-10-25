// ================================================================
//  Le château de Himeji (姫路城) : le « Héron blanc » (白鷺城, Shirasagi-jō), le plus célèbre des châteaux du Japon, l'un
//  des douze dont le donjon d'origine tient encore debout (1609), parmi les premiers sites du Japon classés au
//  patrimoine mondial (1993). Les douves et le pont de bois, la grande porte (大手門), l'esplanade du Sannomaru et ses
//  cerisiers ; puis le labyrinthe : trois terrasses aux murs de pierre (ishigaki), la porte en losange (菱の門), des
//  escaliers et des portes en chicane, des murs de terre blancs percés de meurtrières (rondes, triangulaires,
//  carrées), une impasse ; la cour du puits d'Okiku ; tout en haut, le grand donjon blanc aux cinq toits, et un petit
//  donjon. On entre dans la salle basse du donjon (ses deux grands piliers) et l'on monte tout en haut, dans la pièce
//  du dernier étage : le petit sanctuaire d'Osakabe, la vue sur la ville. Les distances sont resserrées.
//  Son secret : l'assiette d'Okiku (播州皿屋敷). La nuit, au vieux puits, le fantôme d'Okiku compte les assiettes qu'on
//  l'accusait d'avoir perdues : « une, deux… neuf », puis pleure. La dixième est cachée dans le château (l'impasse du
//  labyrinthe) : la retrouver, la lui rapporter ; elle compte jusqu'à dix et s'en va en paix ; un koban (tresors.js).
//  Bunbuku, le marchand, attend sous les cerisiers, à l'ouest de l'esplanade.
//  Repère : x vers l'est, z vers le sud, y vers le haut, en mètres ; l'esplanade à y = 0, les terrasses à 3, 6 et 9,5 m,
//  le dernier étage du donjon vers 33 m. ctx : { THREE, atelier, P (palette), peinture }.
// ================================================================
import { creerMonde, interactionsBancs, lisse, hasard, bruitDoux, surLaLigne } from './monde.js';
import { panneau, trepied, PAPIER_PANNEAU } from './decor.js';
import { MATIERES as M } from './textures.js';
import { secretTrouve, indiceVu } from './tresors.js';

const PI = Math.PI;

// ---------------------------------------------------------------- Le plan
// les douves (内堀), au sud : une longue bande d'eau entre deux murs de pierre ; le pont de bois au milieu
const DOUVES = { x0: -130, x1: 130, z0: 27, z1: 41, eau: -2.0, fond: -3.2 };
const PONT = { x0: -2.6, x1: 2.6, z0: 25.2, z1: 42.8, y: 0.38 };
// le mur d'enceinte, sur la berge nord des douves, et la grande porte (大手門) au bout du pont, dans son alignement
const ENCEINTE_Z = 24.4;
const OTEMON = { x: 0, z: ENCEINTE_Z, l: 8.4 };
// l'esplanade du Sannomaru (三の丸) : les pelouses, les cerisiers ; le départ, juste derrière la grande porte
const ESPLANADE = { x0: -46, x1: 46, z0: -6, z1: 24 };
// les terrasses du château, de plus en plus hautes vers le nord : leur dessus (h) et la hauteur de leur mur de pierre ;
// la Nishi-no-maru (西の丸), à l'ouest de l'esplanade, et son long couloir : on n'y va pas
const T1 = { x0: -40, x1: 34, z0: -21, z1: -7, h: 3.0, mur: 3.0 };
const T2 = { x0: -36, x1: 30, z0: -35, z1: -22, h: 6.0, mur: 3.0 };
const T3 = { x0: -30, x1: 26, z0: -72, z1: -36, h: 9.5, mur: 3.5 };
const NISHI = { x0: -64, x1: -47, z0: -46, z1: 14, h: 5.0, mur: 5.0 };
const TERRASSES = [T1, T2, T3, NISHI];
// les escaliers entre les terrasses (vers le nord en montant) : leur largeur (x0 à x1), le bord du haut (sur une ligne
// de la grille du sol : la grille d'un mètre suit alors l'entaille), le nombre de marches et leur giron. Sous eux, le
// sol reste au niveau du pied (ils sont pleins) ; on y marche par le milieu de chaque marche (monde.chemin)
const ESCALIERS = [
  { id: 'hishi', x0: -12, x1: -8, zHaut: -9, n: 10, giron: 0.44, bas: 0, haut: T1.h },
  { id: 'i', x0: -35, x1: -31, zHaut: -25, n: 10, giron: 0.44, bas: T1.h, haut: T2.h },
  { id: 'ni', x0: 20, x1: 24, zHaut: -40, n: 12, giron: 0.42, bas: T2.h, haut: T3.h },
].map((E) => ({ ...E, zPied: E.zHaut + E.n * E.giron, monte: (E.haut - E.bas) / E.n, x: (E.x0 + E.x1) / 2 }));
const ESC = Object.fromEntries(ESCALIERS.map((E) => [E.id, E]));
// les portes : la porte en losange (菱の門, en haut du premier escalier), et trois portes plus petites (kōraimon), dans
// des murs qui barrent les terrasses
const HISHI = { x: -10, z: -10.6 };
const PORTES = [
  { id: 'i', x: -27.5, z: -14, ry: PI / 2, y: T1.h, mur: [-21, -7] },
  { id: 'ro', x: -24, z: -27, ry: -PI / 2, y: T2.h, mur: [-35, -22] },
  { id: 'ha', x: 18, z: -25, ry: -PI / 2, y: T2.h, mur: [-35, -22] },
  { id: 'ni', x: 22, z: -41.6, ry: 0, y: T3.h, mur: null },
];
// l'impasse du labyrinthe (on croit que le chemin continue tout droit en haut de l'escalier ; il tourne à l'est), et
// l'assiette d'Okiku qui y est cachée
const IMPASSE = { x0: -35, x1: -31, z0: -35, z1: -30.5 };
const ASSIETTE = { x: -34.2, z: -34.0 };
// la cour du puits d'Okiku (お菊井戸), sur la deuxième terrasse
const PUITS = { x: 12, z: -30.5 };
const COUR = { x0: 6, x1: 18, z0: -35, z1: -27.5 };
// le grand donjon : le socle de pierre (22 × 18 en bas, 1,5 m plus étroit en haut, 5 m de haut), puis cinq étages blancs
// de plus en plus petits, chacun sous son toit. La salle basse est dans le socle ; on entre par le sud
const DONJON = { x: 0, z: -56, W: 22, D: 18, retrait: 1.5, h: 5 };
const Y_SOCLE = T3.h + DONJON.h;
const ETAGES = [
  { W: 18, D: 14, h: 3.6, toit: 1.7 }, { W: 15.4, D: 12, h: 3.3, toit: 1.6 }, { W: 12.8, D: 10, h: 3.1, toit: 1.5 },
  { W: 10.4, D: 8.1, h: 2.9, toit: 1.4 }, { W: 8.4, D: 6.6, h: 3.1, toit: 2.1 },
];
(() => { let y = Y_SOCLE; for (const E of ETAGES) { E.y0 = y; E.y1 = y + E.h; y = E.y1 + E.toit - 0.1; } })();
// la salle basse (dans le socle), le dernier étage (où l'on marche), leur escalier
const SALLE = { x0: -8, x1: 8, z0: -62.5, z1: -49.5, y: T3.h + 0.06, plafond: Y_SOCLE - 0.2 };
const Y_HAUT = ETAGES[4].y0 + 0.15;
const HAUT = { x0: -ETAGES[4].W / 2 + 0.2, x1: ETAGES[4].W / 2 - 0.2, z0: DONJON.z - ETAGES[4].D / 2 + 0.2, z1: DONJON.z + ETAGES[4].D / 2 - 0.2 };
const MONTEE = { x: 4.0, z: -58.6 }; // le pied de l'escalier de la salle basse (à côté du poteau de x = 5,5, pas dessus)
const DESCENTE = { x: 2.6, z: -57.2 }; // la trappe de l'escalier, au dernier étage
// le deuxième étage (2026-10-25), dans le deuxième étage blanc : son plancher, l'intérieur de ses murs ; la grande pièce du
// milieu (moya), et tout autour le couloir des guerriers (武者走り) ; ses fenêtres, plus hautes que celles des autres étages
// (on y voit dehors) ; le pied de l'escalier qui monte, la trappe de celui qui arrive d'en bas (là où l'on descend)
const ETAGE2 = ETAGES[1];
const Y_MILIEU = ETAGE2.y0 + 0.15;
const MILIEU = { x0: -ETAGE2.W / 2 + 0.2, x1: ETAGE2.W / 2 - 0.2, z0: DONJON.z - ETAGE2.D / 2 + 0.2, z1: DONJON.z + ETAGE2.D / 2 - 0.2 };
const MOYA = { x0: -5.6, x1: 5.6, z0: DONJON.z - 3.9, z1: DONJON.z + 3.9 };
const Y_FEN2 = ETAGE2.y0 + 1.66, H_FEN2 = 0.9;
const MONTEE2 = { x: 4.4, z: -55.0 };
const TRAPPE2 = { x: -4.0, z: -54.3 };
/** Les fenêtres d'un mur long de L (fenetres(), un tous les 2,2 m) : leurs milieux, du centre du mur. */
const centresFenetres = (L) => { const k = Math.max(1, Math.floor(L * (1 / 2.2))); return Array.from({ length: k }, (_, i) => -L / 2 + ((i + 0.5) * L) / k); };
/** L'enduit des murs, dedans (pas le plâtre du dehors, qui s'illumine la nuit). */
const ENDUIT = '#ebe3d4';
// le petit donjon (乾小天守), au nord-ouest du grand, et le couloir qui les relie
const PETIT = { x: -21, z: -62, W: 10, D: 8.4, h: 4.5 };
// le marchand, sous les cerisiers à l'ouest de l'esplanade
const MARCHAND = { x: -39.5, z: 1.5, cap: PI / 2 };
const DEPART = { x: 0, z: 38.5 };
// le trottoir de l'arrivée, au bout du pont
const ARRIVEE = { x0: -9, x1: 9, z1: 45.6 }; // (sur le pont : la grande porte devant, et le donjon au-dessus)

// ---------------------------------------------------------------- Le relief
/** La distance d'un point au rectangle R (négative dedans). */
const ecart = (R, x, z) => Math.max(R.x0 - x, x - R.x1, R.z0 - z, z - R.z1);

/**
 * Le sol : l'esplanade et la ville à 0 ; les terrasses (leur mur de pierre, sur un mètre, puis la colline boisée qui
 * descend tout autour) ; le fond des douves ; sous les escaliers, le niveau de leur pied. Au loin, les montagnes.
 */
function terrain(x, z) {
  let h = 0;
  for (const T of TERRASSES) {
    const e = ecart(T, x, z);
    const v = e <= 0 ? T.h : e < 1 ? T.h - T.mur * e : T.h - T.mur - 0.45 * (e - 1);
    if (v > h) h = v;
  }
  if (z > DOUVES.z0 && z < DOUVES.z1 && x > DOUVES.x0 && x < DOUVES.x1) h = DOUVES.fond;
  for (const E of ESCALIERS) if (x > E.x0 - 0.2 && x < E.x1 + 0.2 && z > E.zHaut + 0.01 && z < E.zPied + 0.05) h = Math.min(h, E.bas - 0.05);
  // au loin : la plaine de la ville, puis les montagnes (plus hautes au nord, le mont Shosha ; au sud, la mer n'est pas
  // loin : des collines basses)
  const r = Math.hypot(x, z);
  if (r > 330) {
    const a = Math.atan2(x, -z), nord = 0.5 + 0.5 * Math.cos(a);
    h += lisse(330, 760, r) * (30 + 95 * nord) * (0.7 + 0.3 * Math.sin(a * 5 + 1) + 0.15 * Math.sin(a * 13 + 2) + 0.2 * bruitDoux(x * 0.004, z * 0.004, 1));
  }
  return h;
}

/** Où l'on peut aller : l'esplanade, la porte et le pont ; le dessus des terrasses, leurs escaliers (les murs, les
 * portes, le donjon arrêtent ensuite). */
const ZONES = [
  [ESPLANADE.x0 + 0.6, ESPLANADE.x1 - 0.6, ESPLANADE.z0 + 0.4, ENCEINTE_Z - 0.35],
  [-3.9, 3.9, ENCEINTE_Z - 1, PONT.z0 + 0.2],
  [PONT.x0 + 0.35, PONT.x1 - 0.35, PONT.z0, PONT.z1 + 0.5],
  [ARRIVEE.x0 + 0.3, ARRIVEE.x1 - 0.3, DOUVES.z1 + 0.55, ARRIVEE.z1 - 0.3],
  ...[T1, T2, T3].map((T) => [T.x0 + 0.4, T.x1 - 0.4, T.z0 + 0.4, T.z1 - 0.4]),
];
function dansLeCadre(x, z) {
  for (const [x0, x1, z0, z1] of ZONES) if (x > x0 && x < x1 && z > z0 && z < z1) return true;
  for (const E of ESCALIERS) if (x > E.x0 + 0.15 && x < E.x1 - 0.15 && z > E.zHaut - 0.6 && z < E.zPied + 0.7) return true;
  return false;
}

/** Ce que le carnet et le menu savent du lieu, sans le construire. */
export const infos = {
  id: 'himeji', carte: 'himeji-castle', video: '7649489240199531778',
  nom: { en: 'Himeji Castle', fr: 'Château de Himeji', ja: '姫路城' }, nomJa: '姫路城',
  tampons: [
    { id: 'sakura', motif: 'sakura', ja: '三の丸', encre: '#c8506a' },
    { id: 'hishi', motif: 'hishi', ja: '菱の門', encre: '#2f4a6a', forme: 'carre' },
    { id: 'okiku', motif: 'ido', ja: 'お菊井戸', encre: '#3a5a8a' },
    { id: 'tenshu', motif: 'tenshu', ja: '大天守', encre: '#2a2a2a', forme: 'carre' },
    { id: 'koi', motif: 'koi', ja: '内堀', encre: '#c8582a' },
  ],
  get textes() { return TEXTES; },
};

/** La nuit, le château illuminé (le plâtre blanc des murs), le papier des fenêtres et les fenêtres de la ville. */
export const sortesNuit = (P) => ({ [P.platre]: 'illumine', [P.shoji]: 'lumiere', [P.shojiCadre]: 'treillis', [P.vitreVille]: 'lumiere' });

// les allées de gravier de l'esplanade (aspectSol), et ce qui ne doit pas y pousser
const ALLEES = [
  [[0, 24], [0, 12], [-6, 2], [-10, -4.6]], // de la grande porte à l'escalier de la porte en losange
  [[-41, -2.5], [-10, -3.2], [41, -2.5]],
  [[0, 12], [22, 10], [41, 9]],
  [[0, 12], [-22, 10], [-41, 9]],
  [[-6, 2], [-34, 2.5], [-39.5, 1.5]], // le marchand
  [[0, 21], [8.5, 20.2]], // l'étal de la vieille dame
];
// les cerisiers de l'esplanade (et quelques-uns sur les terrasses) : x, z, hauteur
// (aucun à moins de la largeur de sa couronne d'un mur : leur feuillage entrait dans le toit des murs ; 2026-10-25)
const CERISIERS = [
  [-30, 15, 7.2], [-24, 18.5, 6.6], [-16, 16, 7.4], [-33, 6, 7.8], [-22.4, 4.4, 8.2], [-14, 7.5, 6.8], [-28, -1, 6.4],
  [-38, 13, 6.9], [-42, 4, 7.0], [-35.5, -0.2, 6.2], [-41.4, 18.4, 6.0], [-18, 19.2, 5.8], [-8, 15, 6.2],
  [14, 15.5, 7.0], [22, 18.5, 6.8], [30, 15.5, 7.5], [38, 18.5, 6.4], [16, 4.5, 7.6], [26, 5.5, 7.0], [36, 3, 7.2],
  [42, 13, 6.6], [9, -1, 6.0], [21, 0.6, 6.6], [32, -0.4, 6.2], [41.0, 1.6, 5.8], [41.4, 19.6, 5.6],
  [-20, -16, 6.4], [6, -17, 6.8], [16, -13, 6.0], [-12, -30, 6.2], [-1.0, -26.8, 5.6],
];
// les pins taillés au pied des murs, sur les terrasses : x, z, taille, sens (celui de la tour d'angle de la troisième
// terrasse, écarté d'elle : il entrait dans son toit)
const PINS = [[-16, -18.5, 9, 1], [12, -9.6, 8, -1], [-6, -33, 8.5, 1], [26, -27, 7.5, -1], [-21.2, -41.4, 9, 1], [18, -46, 8, -1], [-14, -69, 9.5, 1], [19, -68, 8.5, -1]];
// les arbres plantés dans le gravier des terrasses : un rond d'herbe à leur pied (aspectSol, herbesAuPied)
const ARBRES_TERRASSES = [...PINS, ...CERISIERS.filter(([x, z]) => terrain(x, z) > 2)];

export function construire(ctx) {
  const { THREE, atelier, P, peinture } = ctx;
  const objets = [];
  const monde = creerMonde({ terrain, cadre: dansLeCadre, profond: null, pente: 0.85 });
  const poser = (fin, x, z, o = {}) => objets.push({ fin, x, z, y: o.y ?? terrain(x, z), ry: o.ry || 0, ombre: o.ombre !== false, trait: o.trait !== false, dedans: o.dedans, avant: o.avant });
  /** L'angle qui tourne vers (vx, vz) le devant (+z) d'un objet posé en (x, z). */
  const vers = (x, z, vx, vz) => Math.atan2(vx - x, vz - z);
  const bancs = [], lumieres = [], animes = [];
  // les murs blancs et les bâtiments (des segments épais : [x0, z0, x1, z1, demi-largeur, bas, haut]) : la colline n'y fait
  // pas entrer la couronne de ses arbres
  const BATIS = [];
  // les textes peints (etiquettes.js) : ecrire(pose de l'objet { x, y, z, ry }, étiquette dans son repère)
  const etiquettes = [];
  const ecrire = (o, e) => {
    const c = Math.cos(o.ry || 0), sn = Math.sin(o.ry || 0);
    etiquettes.push({ ...e, x: o.x + e.x * c + e.z * sn, y: o.y + e.y, z: o.z - e.x * sn + e.z * c, ry: (o.ry || 0) + (e.ry || 0) });
  };
  /** Une lanterne de pierre (tōrō) d'environ 1,7 m en x, z, allumée la nuit. */
  const lanterne = (a, x, z, y = terrain(x, z)) => {
    a.lanterne(x, z, 6, y);
    lumieres.push({ x, y: y + 1.2, z, halo: 0.42, sol: y, r: 2.6 });
  };
  /**
   * Des touffes d'herbe au pied d'un arbre (son tronc en x, z ; le sol à y) : neuf touffes de sept brins en couronne, de r0
   * à r1 du tronc (chaque brin des deux côtés : vu de dos, il ne disparaît pas). Sur le rond d'herbe d'aspectSol.
   */
  const herbesAuPied = (a, x, z, y, r0 = 0.55, r1 = 1.05) => {
    const pos = [];
    for (let i = 0; i < 9; i++) {
      const t = i * 2.4 + hasard(x + i, z) * 0.8, d = r0 + (r1 - r0) * hasard(z + i, x), k = 0.75 + 0.5 * hasard(i, x + z);
      const cx = x + Math.sin(t) * d, cz = z + Math.cos(t) * d;
      for (let b = 0; b < 7; b++) {
        const ang = (b / 7) * 2 * PI + 0.4 * Math.sin(b * 7.1 + i), rr = (0.03 + 0.03 * (b % 2)) * k, hh = (0.16 + (0.12 * ((b * 3) % 7)) / 6) * k;
        const ux = Math.cos(ang), uz = Math.sin(ang), px = -uz * 0.035 * k, pz = ux * 0.035 * k;
        const A = [cx + ux * rr * 0.4 - px, y - 0.02, cz + uz * rr * 0.4 - pz], B = [cx + ux * rr * 0.4 + px, y - 0.02, cz + uz * rr * 0.4 + pz];
        const C = [cx + ux * (rr + 0.07 * k), y + hh, cz + uz * (rr + 0.07 * k)];
        pos.push(...A, ...B, ...C, ...A, ...C, ...B);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    a.piece(g, '#5f9e46', { trait: false, nuance: 0.1, sorte: 'herbe' });
  };
  /** Les pierres des murs : des rangs de trois teintes, décalés. */
  const pierres = (x, y, z) => TONS[Math.floor(hasard(Math.floor(x / 0.62) * 1.7 + Math.floor(z / 0.62) * 0.9, Math.floor(y / 0.38) * 1.3) * 4) % 4];
  /** Les tuiles du château : gris-bleu, le dessous des toits et les arêtes blanchis au plâtre (le « héron blanc ») ; le
   * bord des toits, le bout des tuiles, gris (2026-10-25 : tout blanc, vu d'en dessous, le bord ne se voyait pas). */
  const TUILES = { tuile: P.tuileShiro, tuile2: P.tuileShiroClaire, bord: P.mortier, avant: P.tuileShiro };
  /** Un repère tourné : la pose (x, y, z, ry) d'une pièce donnée dans le repère d'un objet posé en x, z, tourné de ry. */
  const repere = (x0, z0, ry0) => {
    const c = Math.cos(ry0), s = Math.sin(ry0);
    return (lx, y, lz, o = {}) => ({ ...o, x: x0 + lx * c + lz * s, y, z: z0 - lx * s + lz * c, ry: ry0 + (o.ry || 0) });
  };
  /**
   * Un toit japonais (atelier.toitJapon : L × Pp, haut de h, ratio du haut ; o : la pose, releve, creux…) et ses quatre
   * arêtes de coin (sumi-mune, 2026-10-25, « plus de détails ») : un faîtage blanchi au plâtre qui suit le coin du toit,
   * du haut jusqu'au coin relevé, et au bout une tuile d'about grise (onigawara), tournée vers dehors.
   */
  const toitH = (a, L, Pp, h, ratio, o = {}) => {
    a.toitJapon(L, Pp, h, ratio, { ...o, ...TUILES });
    const { creux = 1.7, releve = 0.05 } = o, R = repere(o.x || 0, o.z || 0, o.ry || 0), y = o.y || 0;
    const r = Math.min(0.13, Math.max(0.055, L * 0.0065));
    for (const [cx, cz] of [[-L / 2, Pp / 2], [L / 2, Pp / 2], [L / 2, -Pp / 2], [-L / 2, -Pp / 2]]) {
      const pts = [];
      for (let i = 0; i <= 8; i++) {
        const v = 0.02 + (i / 8) * 0.95, k = (1 - v + v * ratio) * (1 + 0.06 * (1 - v));
        const q = R(cx * k, y + h * v ** creux + releve * (1 - v) ** 2 + r * 0.55, cz * k);
        pts.push([q.x, q.y, q.z]);
      }
      a.tube(pts, r, P.mortier, { cotes: 4, pas: 8, trait: false });
      const [x0, y0, z0] = pts[0], [x1, , z1] = pts[1];
      a.boite(r * 3.4, r * 4.2, r * 1.4, '#5c6066', { x: x0, y: y0 + r * 1.2, z: z0, ry: Math.atan2(x0 - x1, z0 - z1) });
    }
    return a;
  };

  // ---------------------------------------------------------------- Les murs de pierre (ishigaki)
  /** Les teintes des pierres des murs, tirées pierre par pierre. */
  const TONS = [P.pierre, P.pierreFonce, '#b2ab9b', '#c5beae'];
  /**
   * Une bande de mur de pierre, du bord haut (A → B, [x, z], à la hauteur yHaut) jusqu'au pied (A2 → B2, à yPied), de la
   * fraction v0 à v1 de la hauteur ; tournée vers dehors (n : [nx, nz]), ou vers le haut (dessus : une rangée de pierres
   * plates). Des rangs de pierres de largeurs inégales (45 à 85 cm), joints décalés d'un rang à l'autre, chacune sa teinte ;
   * profil(v) : de combien la bande s'avance, de 0 (en haut) à 1 (au pied) : l'éventail des murs de Himeji.
   */
  function bande(a, A, B, A2, B2, yHaut, yPied, n, { v0 = 0, v1 = 1, profil = null, dessus = false } = {}) {
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]), H = Math.abs(yHaut - yPied) * (v1 - v0);
    const nv = dessus ? 1 : Math.max(1, Math.round(H / 0.42)), f = profil || ((v) => v);
    const pt = (u, v) => {
      const hx = A[0] + (B[0] - A[0]) * u, hz = A[1] + (B[1] - A[1]) * u, px = A2[0] + (B2[0] - A2[0]) * u, pz = A2[1] + (B2[1] - A2[1]) * u, k = f(v);
      return [hx + (px - hx) * k, yHaut + (yPied - yHaut) * v, hz + (pz - hz) * k];
    };
    const pos = [], couleurs = [];
    for (let j = 0; j < nv; j++) {
      const va = v0 + ((v1 - v0) * j) / nv, vb = v0 + ((v1 - v0) * (j + 1)) / nv;
      let u = 0, k = 0, l = 0.12 + 0.4 * hasard(j * 1.7 + A[0] * 0.31, A[1] * 0.27 + j);
      while (u < 1 - 1e-6) {
        let ub = Math.min(1, u + l / L);
        if ((1 - ub) * L < 0.3) ub = 1;
        const p00 = pt(u, va), p10 = pt(ub, va), p11 = pt(ub, vb), p01 = pt(u, vb);
        pos.push(...p00, ...p10, ...p11, ...p00, ...p11, ...p01);
        const c = TONS[Math.floor(hasard(A[0] * 0.13 + j * 3.7 + k * 1.31, A[1] * 0.17 + k * 0.7 + yHaut) * 4) % 4];
        couleurs.push(c, c);
        u = ub;
        k++;
        l = 0.45 + 0.4 * hasard(k * 2.3 + j, A[0] + A[1] + k);
      }
    }
    // (vers dehors, ou vers le haut : si le premier triangle regarde de l'autre côté, on les retourne tous)
    const ux = pos[3] - pos[0], uy = pos[4] - pos[1], uz = pos[5] - pos[2], wx = pos[6] - pos[0], wy = pos[7] - pos[1], wz = pos[8] - pos[2];
    const nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
    if (dessus ? ny < 0 : nx * n[0] + nz * n[1] < 0) for (let k = 0; k < pos.length; k += 9) for (let q = 0; q < 3; q++) [pos[k + 3 + q], pos[k + 6 + q]] = [pos[k + 6 + q], pos[k + 3 + q]];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    a.piece(g, P.pierre, { couleurs, nuance: 0.06 });
  }
  /** Le profil en éventail (ōgi-no-kōbai) : presque droit en haut, il s'évase vers le pied. */
  const EVENTAIL = (v) => v ** 1.6;
  /** Un muret de pierre plein, d'axe (x0, z0) → (x1, z1), large de l, de yBas à yHaut : ses faces en rangs de pierres. */
  function muret(a, x0, z0, x1, z1, l, yBas, yHaut) {
    const L = Math.hypot(x1 - x0, z1 - z0), t = [(x1 - x0) / L, (z1 - z0) / L], n = [-t[1], t[0]], h = l / 2;
    const Q = (bout, e) => [(bout ? x1 : x0) + n[0] * e, (bout ? z1 : z0) + n[1] * e];
    bande(a, Q(0, h), Q(1, h), Q(0, h), Q(1, h), yHaut, yBas, n);
    bande(a, Q(1, -h), Q(0, -h), Q(1, -h), Q(0, -h), yHaut, yBas, [-n[0], -n[1]]);
    bande(a, Q(0, -h), Q(0, h), Q(0, -h), Q(0, h), yHaut, yBas, [-t[0], -t[1]]);
    bande(a, Q(1, h), Q(1, -h), Q(1, h), Q(1, -h), yHaut, yBas, t);
    bande(a, Q(0, -h), Q(1, -h), Q(0, h), Q(1, h), yHaut, yHaut, n, { dessus: true });
  }
  /**
   * Le mur de pierre d'une terrasse R (son dessus à R.h, son mur haut de R.mur) : ses flancs, du haut (e0 en avant du
   * bord : une rangée de pierres plates couvre l'entre-deux) jusqu'à un pied d plus loin (un peu enterré), en éventail,
   * les coins en onglet ; trous : { sud: [[de, à]], … } (le long du flanc, en x ou en z) laissés ouverts pour les
   * escaliers ; cotes : les flancs à faire. (Le sol de la terrasse descend en ligne droite du bord jusqu'à un mètre plus
   * loin : le mur en éventail reste devant lui avec e0 = 0,35.)
   */
  function rempart(a, R, { trous = {}, cotes = ['sud', 'nord', 'est', 'ouest'], yHaut = R.h + 0.02, yPied = R.h - R.mur - 0.5, d = 1.25, e0 = 0.35, profil = EVENTAIL } = {}) {
    const C = {
      sud: { A: [R.x0, R.z1], B: [R.x1, R.z1], n: [0, 1] },
      nord: { A: [R.x1, R.z0], B: [R.x0, R.z0], n: [0, -1] },
      est: { A: [R.x1, R.z1], B: [R.x1, R.z0], n: [1, 0] },
      ouest: { A: [R.x0, R.z0], B: [R.x0, R.z1], n: [-1, 0] },
    };
    for (const c of cotes) {
      const { A, B, n } = C[c], L = Math.hypot(B[0] - A[0], B[1] - A[1]), t = [(B[0] - A[0]) / L, (B[1] - A[1]) / L];
      const axe = n[0] === 0 ? 0 : 1, a0 = A[axe], a1 = B[axe];
      const coupes = (trous[c] || []).map(([p, q]) => [(p - a0) / (a1 - a0), (q - a0) / (a1 - a0)].sort((m, k) => m - k)).sort((m, k) => m[0] - k[0]);
      let u = 0;
      for (const [ua, ub] of [...coupes, [1, 1]]) {
        if (ua > u) {
          // (le point du bord à la fraction w, avancé de e, et prolongé de m le long du flanc)
          const o = 0.03, bord = (w, e, m) => [A[0] + (B[0] - A[0]) * w + n[0] * (o + e) + t[0] * m, A[1] + (B[1] - A[1]) * w + n[1] * (o + e) + t[1] * m];
          // (aux coins, chaque flanc va jusqu'au plan du flanc voisin, décalé lui aussi de o : prolongé seulement de e, il
          // s'arrêtait 3 cm avant, et l'on voyait le jour par cette fente, du haut en bas des coins du socle du donjon)
          const s0 = u === 0 ? -1 : 0, s1 = ua === 1 ? 1 : 0;
          bande(a, bord(u, e0, s0 * (e0 + o)), bord(ua, e0, s1 * (e0 + o)), bord(u, d, s0 * (d + o)), bord(ua, d, s1 * (d + o)), yHaut, yPied, n, { profil });
          if (e0 > 0) bande(a, bord(u, 0, s0 * o), bord(ua, 0, s1 * o), bord(u, e0, s0 * (e0 + o)), bord(ua, e0, s1 * (e0 + o)), yHaut, yHaut, n, { dessus: true });
        }
        u = Math.max(u, ub);
      }
    }
  }

  // ---------------------------------------------------------------- Les toits, les murs de terre
  /**
   * Un mur de terre blanc (dobei), de (x0, z0) à (x1, z1), au pied à la hauteur y : le soubassement de pierre, le mur
   * de plâtre, le chaperon de tuiles à deux pans et son arête blanche ; des meurtrières (sama : rondes, triangulaires,
   * carrées, l'une après l'autre) tous les 1,8 m, sur la face qui regarde dehors (dehors : [x, z], la direction de
   * l'ennemi ; null : pas de meurtrières). Il arrête (sauf arrete: false).
   */
  function dobei(a, x0, z0, x1, z1, y, { h = 2.3, dehors = null, arrete = true, debut = true, fin = true } = {}) {
    const L = Math.hypot(x1 - x0, z1 - z0);
    if (L < 0.2) return;
    const ry = Math.atan2(-(z1 - z0), x1 - x0), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, R = repere(cx, cz, ry);
    const sama = dehors ? Math.sign(Math.sin(ry) * dehors[0] + Math.cos(ry) * dehors[1]) : 0;
    // (de combien une pièce dépasse aux bouts libres : d ; le décalage de son milieu, pour qu'elle ne dépasse que là)
    const long = (d) => L + d * ((debut ? 1 : 0) + (fin ? 1 : 0)), mil = (d) => (d * ((fin ? 1 : 0) - (debut ? 1 : 0))) / 2;
    // (un mur en z un rien plus haut qu'un mur en x : là où deux murs se croisent, leurs soubassements, le dessous de leurs
    // toits et leurs faîtes ne sont pas dans le même plan)
    const k = Math.abs(x1 - x0) >= Math.abs(z1 - z0) ? 0 : 0.012;
    a.boite(long(0.03), 0.42, 0.62, P.pierreFonce, R(mil(0.03), y + 0.13 + k, 0, { teinte: pierres }))
      .boite(L, h - 0.34, 0.4, P.platre, R(0, y + 0.34 + (h - 0.34) / 2, 0))
      .pignon(long(0.12), 0.34, 0.86, P.tuileShiro, R(mil(0.12), y + h - 0.02 + k, 0))
      .boite(long(0.13), 0.09, 0.14, P.mortier, R(mil(0.13), y + h + 0.33 + k, 0, { trait: false }));
    if (sama) {
      const n = Math.floor((L - 0.8) / 1.8);
      for (let k = 0; k < n; k++) {
        const lx = -((n - 1) * 1.8) / 2 + k * 1.8, f = k % 3, z = sama * 0.222;
        // (couchées, puis tournées avec le mur : dans l'ordre XYZ, sur les murs nord-sud, elles se mettaient de champ)
        if (f === 0) a.cylindre(0.1, 0.1, 0.03, 10, P.noir, R(lx, y + 1.25, z, { rx: PI / 2, ordre: 'YXZ', trait: false }));
        else if (f === 1) a.cylindre(0.13, 0.13, 0.03, 3, P.noir, R(lx, y + 1.25, z, { rx: PI / 2, rz: 0, ordre: 'YXZ', trait: false }));
        else a.boite(0.2, 0.2, 0.03, P.noir, R(lx, y + 1.25, z, { trait: false }));
      }
    }
    if (arrete) monde.mur(x0, z0, x1, z1, 0.36);
    monde.bloc(Math.min(x0, x1) - 0.25, Math.max(x0, x1) + 0.25, Math.min(z0, z1) - 0.25, Math.max(z0, z1) + 0.25, y - 1, y + h + 0.4);
    BATIS.push([x0, z0, x1, z1, 0.45, y - 0.3, y + h + 0.45]);
  }
  /**
   * Une porte kōraimon : deux grands poteaux, la poutre, le toit au-dessus ; derrière, deux poteaux et leurs petits
   * toits ; les deux battants grands ouverts. En x, z (le milieu du passage), au sol y, tournée de ry : on arrive par
   * +z local (le dehors), les poteaux de derrière et les battants ouverts sont du côté −z (le dedans) ; l : la largeur
   * du passage.
   */
  function koraimon(a, x, z, y, ry, l = 4.0) {
    const R = repere(x, z, ry), H = 4.2, w2 = l / 2;
    for (const s of [-1, 1]) {
      a.boite(0.42, H, 0.5, '#4a3a2e', R(s * (w2 + 0.21), y + H / 2, 0))
        .boite(0.26, H - 1.2, 0.26, '#4a3a2e', R(s * (w2 + 0.2), y + (H - 1.2) / 2, -1.7))
        .boite(0.16, 0.16, 1.7, '#4a3a2e', R(s * (w2 + 0.2), y + H - 1.6, -0.85))
        .pignon(0.9, 0.3, 1.9, P.tuileShiro, R(s * (w2 + 0.2), y + H - 1.2, -1.0, { ry: PI / 2 }))
        // le battant ouvert, contre le côté, ses bandes de fer
        .boite(0.12, H - 1.0, w2 - 0.05, '#5a4636', R(s * (w2 - 0.12), y + (H - 1.0) / 2 + 0.05, -w2 / 2 - 0.3));
      for (const yy of [0.8, 1.8, 2.8]) a.boite(0.135, 0.12, w2 - 0.08, P.noir, R(s * (w2 - 0.12), y + yy, -w2 / 2 - 0.3, { trait: false }));
      const p1 = R(s * (w2 + 0.21), 0, 0), p2 = R(s * (w2 + 0.2), 0, -1.7);
      monde.cercle(p1.x, p1.z, 0.38);
      monde.cercle(p2.x, p2.z, 0.25);
    }
    a.boite(l + 1.4, 0.4, 0.46, '#4a3a2e', R(0, y + H - 0.55, 0))
      .boite(l + 1.0, 0.24, 0.3, '#4a3a2e', R(0, y + H - 0.1, 0));
    toitH(a, l + 2.6, 2.6, 1.0, 0.18, { ...R(0, y + H + 0.05, 0), releve: 0.18, rangs: 14, epaisseur: 0.1, ...TUILES });
    return a;
  }

  // ---------------------------------------------------------------- Les douves, le pont, la grande porte
  const eauxCalmes = [[DOUVES.x0, DOUVES.x1, DOUVES.z0 + 0.5, DOUVES.z1 - 0.5, DOUVES.eau]];
  {
    const a = atelier(), D = DOUVES;
    // les deux murs de pierre des douves : du haut de la berge jusque sous l'eau
    bande(a, [D.x0, D.z0 + 0.03], [D.x1, D.z0 + 0.03], [D.x0, D.z0 + 1.28], [D.x1, D.z0 + 1.28], 0.02, D.fond - 0.5, [0, 1]);
    bande(a, [D.x1, D.z1 - 0.03], [D.x0, D.z1 - 0.03], [D.x1, D.z1 - 1.28], [D.x0, D.z1 - 1.28], 0.02, D.fond - 0.5, [0, -1]);
    // le fond, sombre (on le devine sous l'eau), et quelques pierres qui affleurent près des murs (les aigrettes s'y posent)
    a.boite(D.x1 - D.x0, 0.1, D.z1 - D.z0 - 2, '#3e4a36', { x: (D.x0 + D.x1) / 2, y: D.fond + 0.02, z: (D.z0 + D.z1) / 2, trait: false });
    for (const [x, z] of [[-16, 28.2], [19, 39.8], [-44, 39.7], [36, 28.3]]) a.rocher(x, D.eau + 0.05, z, 0.55, P.pierreFonce, { sy: 0.45 });
    poser(a.fin(0, peinture), 0, 0, { y: 0, ombre: false });
  }
  {
    // le pont de bois (桜門橋) : les piles dans l'eau, les poutres, le tablier de planches en travers, les garde-corps et
    // leurs pommeaux de bronze (giboshi) aux bouts
    const a = atelier(), B = PONT, l = B.x1 - B.x0, y = B.y;
    for (const z of [29, 32.5, 36, 39.5]) {
      for (const x of [-1.9, 0, 1.9]) a.cylindre(0.17, 0.19, y - DOUVES.fond + 0.2, 8, '#5a4636', { x, y: (y + DOUVES.fond) / 2 - 0.12, z });
      a.boite(l - 0.2, 0.26, 0.3, '#5a4636', { y: y - 0.32, z });
    }
    for (const x of [-1.5, 0, 1.5]) a.boite(0.26, 0.3, B.z1 - B.z0, '#6a5240', { x, y: y - 0.2, z: (B.z0 + B.z1) / 2 });
    const n = Math.round((B.z1 - B.z0) / 0.36);
    for (let k = 0; k < n; k++) a.boite(l, 0.08, (B.z1 - B.z0) / n - 0.02, k % 2 ? P.bois : P.bois2, { y: y - 0.04, z: B.z0 + ((k + 0.5) * (B.z1 - B.z0)) / n });
    for (const s of [-1, 1]) {
      const x = s * (l / 2 - 0.12), np = 8;
      for (let k = 0; k <= np; k++) {
        const z = B.z0 + 0.15 + (k * (B.z1 - B.z0 - 0.3)) / np, bout = k === 0 || k === np;
        a.boite(0.16, 1.05, 0.16, '#6a5240', { x, y: y + 0.52, z });
        if (bout) a.piece(new THREE.SphereGeometry(0.13, 10, 6), P.bronze, { x, y: y + 1.13, z, sy: 1.25 }).cone(0.05, 0.12, 8, P.bronze, { x, y: y + 1.3, z });
      }
      a.boite(0.12, 0.1, B.z1 - B.z0 - 0.2, '#6a5240', { x, y: y + 1.0, z: (B.z0 + B.z1) / 2 })
        .boite(0.08, 0.08, B.z1 - B.z0 - 0.2, '#6a5240', { x, y: y + 0.55, z: (B.z0 + B.z1) / 2, trait: false });
      monde.mur(x, B.z0, x, B.z1, 0.16);
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
    monde.surface(B.x0 + 0.1, B.x1 - 0.1, B.z0, B.z1, y, { sol: 'bois' });
    // l'arrivée, de l'autre côté des douves : le trottoir où s'arrête le bus, fermé par les barrières blanches du bord
    // de la rue (ガードパイプ : des poteaux, deux tubes) ; l'arrêt « 大手門前 » ; la stèle du château
    const b = atelier(), ARR = ARRIVEE;
    // (une ligne brisée de points [x, z] : un poteau à chaque point et tous les deux mètres, sauf au premier si sansPremier)
    const barriere = (pts, sansPremier = false) => {
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, z0] = pts[i], [x1, z1] = pts[i + 1], L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 2));
        for (let k = i === 0 && sansPremier ? 1 : i === 0 ? 0 : 1; k <= n; k++) { const x = x0 + ((x1 - x0) * k) / n, z = z0 + ((z1 - z0) * k) / n; b.cylindre(0.035, 0.035, 0.95, 8, '#f2f2ee', { x, y: 0.47, z }); }
        for (const y of [0.48, 0.88]) b.baton([x0, y, z0], [x1, y, z1], 0.028, '#f2f2ee', 8);
        monde.mur(x0, z0, x1, z1, 0.12);
      }
    };
    const zB = DOUVES.z1 + 0.3;
    barriere([[B.x0 - 0.15, zB], [ARR.x0, zB], [ARR.x0, ARR.z1], [ARR.x1, ARR.z1], [ARR.x1, zB], [B.x1 + 0.15, zB]]);
    {
      // l'arrêt de bus : le poteau, le panneau rond bleu, l'horaire
      const x = 6.4, z = ARR.z1 - 0.5;
      b.cylindre(0.045, 0.05, 2.5, 8, '#c8c8c4', { x, y: 1.25, z })
        .cylindre(0.33, 0.33, 0.04, 20, '#2f6fb0', { x, y: 2.28, z, rx: PI / 2 })
        .boite(0.42, 0.56, 0.04, '#f4f2ea', { x, y: 1.35, z: z - 0.05 })
        .cylindre(0.16, 0.2, 0.08, 10, '#8a8a86', { x, y: 0.04, z });
      ecrire({ x, y: 0, z, ry: PI }, { texte: '大手門前', sous: 'Ōtemon-mae', forme: 'rond', fond: '#2f6fb0', encre: '#ffffff', x: 0, y: 2.28, z: 0.025, l: 0.6, h: 0.6 });
      ecrire({ x, y: 0, z, ry: 0 }, { texte: '大手門前', sous: 'Ōtemon-mae', forme: 'rond', fond: '#2f6fb0', encre: '#ffffff', x: 0, y: 2.28, z: 0.025, l: 0.6, h: 0.6 });
      ecrire({ x, y: 0, z, ry: PI }, { texte: '時刻表', lignes: 4, fond: '#f4f2ea', encre: '#2a2420', x: 0, y: 1.35, z: 0.075, l: 0.38, h: 0.5 });
      monde.cercle(x, z, 0.2);
    }
    {
      // la stèle « 特別史跡 姫路城 », tournée vers le pont
      const x = -5.6, z = ARR.z1 - 1.0, y = 0;
      b.boite(1.1, 0.25, 0.7, P.pierreFonce, { x, y: 0.12, z })
        .piece(new THREE.BoxGeometry(0.62, 1.7, 0.32, 1, 3, 1), '#8f887c', { x, y: 1.1, z, deformer: (px, py, pz) => [px * (1 - 0.06 * (py + 0.85)), py, pz] });
      ecrire({ x, y, z, ry: PI }, { texte: '特別史跡 姫路城', vertical: true, fond: '#8f887c', encre: '#2a2420', x: 0, y: 1.12, z: 0.17, l: 0.36, h: 1.5 });
      monde.cercle(x, z, 0.6);
    }
    poser(b.fin(0, peinture), 0, 0, { y: 0 });
  }
  {
    // la grande porte (大手門) et le mur d'enceinte, de part et d'autre, sur la berge des douves ; ses meurtrières regardent
    // les douves (vers +z)
    const a = atelier();
    koraimon(a, OTEMON.x, OTEMON.z, 0, 0, OTEMON.l - 2.4);
    // (les murs vont jusqu'aux poteaux de la porte, sans déborder : la porte était un mètre en retrait, et entre le bout du
    // mur et le poteau, on voyait au travers ; 2026-10-25)
    const bout = (OTEMON.l - 2.4) / 2 + 0.4;
    for (const [x0, x1, s] of [[DOUVES.x0, -bout, -1], [bout, DOUVES.x1, 1]]) {
      for (let x = x0; x < x1 - 0.01; x += 12) { const xb = Math.min(x1, x + 12); dobei(a, x, ENCEINTE_Z, xb, ENCEINTE_Z, 0, { h: 2.6, dehors: [0, 1], arrete: Math.abs(x) < 70, debut: x === x0 && s < 0, fin: xb >= x1 - 0.01 && s > 0 }); }
    }
    // l'esplanade, fermée : à l'est, au coin nord-est (jusqu'à la première terrasse), à l'ouest (au sud de la
    // Nishi-no-maru) et au coin nord-ouest
    // (au nord, le mur serré contre le pied de la première terrasse, qui s'évase : un vide restait entre eux en haut)
    enceinte(a, [[T1.x1 + 0.35, ESPLANADE.z0 - 0.3], [ESPLANADE.x1 - 0.2, ESPLANADE.z0 - 0.3], [ESPLANADE.x1 - 0.2, ENCEINTE_Z]], 0, { dehors: [1, 0] });
    // (2026-10-25 : à l'ouest, le mur finissait au coin de la Nishi-no-maru, à côté de sa pierre, qui se penche en
    // arrière : en haut, un vide entre eux ; il tourne maintenant dans son flanc est, au nord du coin. Au nord-ouest, le
    // mur s'arrêtait au pied de ce même flanc : il entre dans la pierre)
    enceinte(a, [[ESPLANADE.x0 - 0.9, NISHI.z1 - 0.4], [ESPLANADE.x0 + 0.2, NISHI.z1 - 0.4], [ESPLANADE.x0 + 0.2, ENCEINTE_Z]], 0, { dehors: [-1, 0], libre0: false });
    enceinte(a, [[ESPLANADE.x0 - 0.6, ESPLANADE.z0 - 0.3], [T1.x0 - 0.35, ESPLANADE.z0 - 0.3]], 0, { dehors: [0, -1], libre0: false });
    // les lanternes de papier de la porte, la nuit
    for (const s of [-1, 1]) {
      a.chochin(s * 2.2, 3.2, OTEMON.z + 0.45, 7);
      lumieres.push({ x: s * 2.2, y: 3.2, z: OTEMON.z + 0.45, halo: 0.5, sol: 0, r: 3.2 });
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
    for (const s of [-1, 1]) monde.mur(s * (OTEMON.l / 2 - 0.4), ENCEINTE_Z - 1.2, s * (OTEMON.l / 2 - 0.4), PONT.z0, 0.3);
  }

  // ---------------------------------------------------------------- L'esplanade (三の丸)
  {
    const a = atelier();
    // les cerisiers : des troncs sombres, des houppiers verts l'été, en fleurs au printemps (le calendrier magique)
    for (const [x, z, h] of CERISIERS) {
      const y = terrain(x, z), g = hasard(x * 0.7, z * 1.3);
      a.arbreTouffu(x, z, h, ['#6f9a4c', '#7aa654', '#668f46'], { y, sorte: 'houppierCerisier', caduc: true, graine: g, tronc: '#5a4334', large: 1.25 });
      monde.cercle(x, z, 0.38);
    }
    // les bancs le long des allées
    for (const [x, z, ry] of [[-20, -1.2, 0.05], [10, -1.2, 0], [-26, 8.2, PI - 0.08], [26, 7.8, PI + 0.06], [6, 13.4, -0.4]]) {
      const R = repere(x, z, ry), y = terrain(x, z);
      a.boite(2.0, 0.08, 0.5, P.bois, R(0, y + 0.45, 0));
      for (const k of [-0.8, 0.8]) a.boite(0.1, 0.45, 0.42, '#5a4436', R(k, y + 0.22, 0));
      const A = R(-0.8, 0, 0), B2 = R(0.8, 0, 0);
      bancs.push({ de: [A.x, A.z], a: [B2.x, B2.z], y: y + 0.49, cap: ry, vue: 0.3 });
      const A1 = R(-1.0, 0, 0), B1 = R(1.0, 0, 0);
      monde.mur(A1.x, A1.z, B1.x, B1.z, 0.28);
    }
    // les lanternes de pierre, au bord des allées (trois étaient au milieu du chemin, au pied de l'escalier ; 2026-10-25)
    for (const [x, z] of [[-2.2, 15], [2.2, 9.5], [-1.9, 4.0], [-14.2, -0.3], [-4.8, -0.6], [40.2, 6.4], [-40.4, 6.4]]) { lanterne(a, x, z); monde.cercle(x, z, 0.38); }
    // la pierre du patrimoine mondial, près du départ
    {
      const x = -5.2, z = 19.6, ry = vers(-5.2, 19.6, 0, 16), y = terrain(x, z), R = repere(x, z, ry);
      a.boite(1.5, 0.3, 0.9, P.pierreFonce, R(0, y + 0.15, 0)).piece(new THREE.BoxGeometry(1.1, 1.6, 0.36, 2, 3, 1), '#9a9286', R(0, y + 1.05, 0, { deformer: (px, py, pz) => [px * (1 - 0.05 * (py + 0.8)), py, pz] }));
      ecrire({ x, y, z, ry }, { texte: '世界遺産 姫路城', vertical: true, fond: '#9a9286', encre: '#2a2420', x: 0, y: 1.08, z: 0.19, l: 0.42, h: 1.36 });
      monde.cercle(x, z, 0.8);
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }
  // ---------------------------------------------------------------- Les bords de l'esplanade
  // (2026-10-25, « que ça fasse moins vide ») au pied des murs, des azalées taillées en boule ; au bout des allées de l'est
  // et de l'ouest, qui finissaient contre un mur nu, une tonnelle de glycines et ses bancs, une grande pierre gravée entre
  // deux petits pins, une vasque de pierre où coule l'eau d'un bambou
  {
    const a = atelier();
    /** Des azalées taillées en boule (ō-karikomi), le long de x tourné de ry, longues de l : elles fleurissent au printemps
     * et rougissent à l'automne (sorte buisson). */
    const azalee = (x, z, l, ry = 0, r = 0.72) => {
      const R = repere(x, z, ry), y = terrain(x, z), n = Math.max(1, Math.round(l / 1.15)), g = hasard(x * 1.3, z * 0.7);
      for (let k = 0; k < n; k++) {
        const q = R(-l / 2 + ((k + 0.5) * l) / n, y + r * 0.4, 0);
        a.houppe(r * (0.92 + 0.16 * hasard(x + k, z - k)), k % 2 ? '#4f7a3c' : '#5a8642', { x: q.x, y: q.y, z: q.z, sy: 0.64, bosses: 0.08, sorte: 'buisson', graine: g }, 1);
      }
      const A = R(-l / 2 + r * 0.5, 0, 0), B = R(l / 2 - r * 0.5, 0, 0);
      monde.mur(A.x, A.z, B.x, B.z, r * 0.85);
    };
    for (const z of [1.6, 4.4, 13.6, 16.4, 19.2, 22.0]) azalee(44.55, z, 2.2, PI / 2);
    for (const x of [36.4, 38.9, -44.2, -41.7]) azalee(x, -5.25, 2.2);
    azalee(-44.6, 4.6, 2.0, PI / 2);
    for (const sg of [-1, 1]) for (const x of [13.6, 19.0, 24.4, 29.8, 35.2]) azalee(sg * x, 22.95, 2.0);
    {
      // au bout de l'allée de l'est : une tonnelle de glycines (藤棚) ; son treillis de bambou, le feuillage dessus et les
      // grappes mauves qui pendent (ils tombent l'hiver) ; dessous, deux bancs tournés vers l'allée
      const x0 = 42.1, x1 = 44.95, hT = 2.45, yT0 = terrain(43.5, 9.0);
      for (const x of [x0, x1]) for (const z of [6.9, 9.0, 11.1]) { a.boite(0.13, hT, 0.13, '#5a4436', { x, y: yT0 + hT / 2, z }); monde.cercle(x, z, 0.16); }
      for (const x of [x0, x1]) a.boite(0.14, 0.14, 4.6, '#5a4436', { x, y: yT0 + hT + 0.07, z: 9.0 });
      for (let k = 0; k < 6; k++) a.boite(3.3, 0.08, 0.08, '#6a5240', { x: (x0 + x1) / 2, y: yT0 + hT + 0.18, z: 6.8 + k * 0.88 });
      for (let k = 0; k < 7; k++) { const xb = x0 + 0.1 + (k * (x1 - x0 - 0.2)) / 6; a.baton([xb, yT0 + hT + 0.25, 6.7], [xb, yT0 + hT + 0.25, 11.3], 0.025, '#b8a060', 5, { trait: false }); }
      for (let k = 0; k < 8; k++) {
        const fx = x0 + 0.45 + (k % 2) * 1.95 + (hasard(k, 3) - 0.5) * 0.5, fz = 7.25 + Math.floor(k / 2) * 1.2 + (hasard(3, k) - 0.5) * 0.4;
        a.houppe(0.85, k % 2 ? '#5f8f45' : '#6b9a4c', { x: fx, y: yT0 + hT + 0.42, z: fz, sy: 0.32, sorte: 'houppier', graine: 0.37 }, 1);
      }
      for (let k = 0; k < 26; k++) {
        const gx = x0 + 0.2 + hasard(k, 7.7) * (x1 - x0 - 0.4), gz = 7.0 + hasard(7.7, k) * 4.0, l = 0.28 + 0.2 * hasard(k, 1.1);
        a.cone(0.07, l, 5, ['#b9a2d8', '#a58bc9', '#cbb8e6'][k % 3], { x: gx, y: yT0 + hT + 0.12 - l / 2, z: gz, rx: PI, sorte: 'houppier', graine: 0.37, trait: false });
      }
      for (const zb of [7.95, 10.05]) {
        const R = repere(44.35, zb, -PI / 2);
        a.boite(1.5, 0.07, 0.42, P.bois, R(0, yT0 + 0.45, 0));
        for (const k of [-0.6, 0.6]) a.boite(0.08, 0.45, 0.36, '#5a4436', R(k, yT0 + 0.22, 0));
        const A = R(-0.55, 0, 0), B = R(0.55, 0, 0), A1 = R(-0.75, 0, 0), B1 = R(0.75, 0, 0);
        bancs.push({ de: [A.x, A.z], a: [B.x, B.z], y: yT0 + 0.485, cap: -PI / 2, vue: 0.3 });
        monde.mur(A1.x, A1.z, B1.x, B1.z, 0.26);
      }
    }
    {
      // au bout de l'allée du nord-est : une grande pierre gravée « 白鷺 » (le héron blanc) sur son socle, tournée vers
      // l'allée, entre deux petits pins taillés
      const x = 43.7, z = -2.5, y = terrain(x, z), ry = -PI / 2, R = repere(x, z, ry);
      a.boite(1.7, 0.18, 1.1, P.pierreFonce, R(0, y + 0.09, 0, { teinte: pierres }))
        .piece(new THREE.BoxGeometry(1.15, 1.75, 0.5, 3, 4, 2), '#9a9284', R(0, y + 1.05, 0, {
          nuance: 0.07,
          // (le devant reste plat : on y grave ; le dos et le haut, irréguliers)
          deformer: (px, py, pz) => { const k = 1 - 0.08 * (py + 0.87) + 0.05 * Math.sin(px * 5 + py * 3); return [px * k, py + (py > 0.5 ? 0.08 * Math.sin(px * 3.1 + 1) : 0), pz > 0 ? pz : pz * (0.85 + 0.15 * Math.cos(py * 2))]; },
        }));
      ecrire({ x, y, z, ry }, { texte: '白鷺', vertical: true, fond: '#9a9284', encre: '#3a3430', x: 0, y: 1.1, z: 0.26, l: 0.42, h: 1.0 });
      monde.cercle(x, z, 0.85);
      for (const sg of [-1, 1]) { a.pinNuages(x - 0.1, z + sg * 2.0, 4.6, sg, { y }); monde.cercle(x - 0.1, z + sg * 2.0, 0.25); }
    }
    {
      // au bout de l'allée de l'ouest : une vasque de pierre (tsukubai), l'eau qui coule d'un bambou, la louche posée en
      // travers, ses pierres autour
      const x = -43.5, z = 8.0, y = terrain(x, z);
      a.piece(new THREE.CylinderGeometry(0.42, 0.48, 0.5, 10, 1, true), P.pierre, { x, y: y + 0.25, z, nuance: 0.08 })
        .piece(new THREE.RingGeometry(0.26, 0.42, 10), P.pierre, { x, y: y + 0.5, z, rx: -PI / 2 })
        .piece(new THREE.CylinderGeometry(0.26, 0.26, 0.12, 10, 1, true), P.pierreFonce, { x, y: y + 0.44, z, sx: -1 })
        .piece(new THREE.CircleGeometry(0.26, 10), '#5f8f96', { x, y: y + 0.43, z, rx: -PI / 2, sorte: 'eau', trait: false })
        .baton([x - 0.75, y - 0.05, z - 0.35], [x - 0.75, y + 0.78, z - 0.35], 0.045, '#7a9a4a', 7)
        .baton([x - 0.75, y + 0.72, z - 0.35], [x - 0.18, y + 0.64, z - 0.12], 0.03, '#86a652', 7)
        .cylindre(0.012, 0.012, 0.2, 5, '#cfe8f0', { x: x - 0.15, y: y + 0.53, z: z - 0.11, trait: false })
        .baton([x + 0.05, y + 0.52, z - 0.3], [x + 0.18, y + 0.53, z + 0.32], 0.01, '#b8a070', 4, { trait: false })
        .cylindre(0.045, 0.04, 0.06, 8, '#b8a070', { x: x + 0.19, y: y + 0.55, z: z + 0.36 });
      for (const [dx, dz, r, sy] of [[0.78, 0.05, 0.32, 0.35], [0.05, 0.72, 0.24, 0.6], [0.0, -0.75, 0.26, 0.55]]) a.rocher(x + dx, y + 0.04, z + dz, r, P.pierreFonce, { sy });
      monde.cercle(x, z, 0.62);
      monde.cercle(x - 0.75, z - 0.35, 0.15);
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Les terrasses, les escaliers, les portes, les murs
  /** Les fenêtres d'un bâtiment de plâtre (W × D, centré en x, z) : sur ses quatre faces, à la hauteur y, des panneaux
   * sombres et leurs barreaux blancs (renji-mado) ; n : combien par mètre de face ; cadre : un cadre de plâtre en relief
   * autour, son appui, et six barreaux (le donjon, 2026-10-25). */
  function fenetres(a, x, z, y, W, D, { par = 1 / 2.6, l = 0.9, h = 0.62, cadre = false, ouvert = false } = {}) {
    const nb = cadre ? 6 : 4;
    for (let c = 0; c < 4; c++) {
      const ry = (c * PI) / 2, long = c % 2 ? D : W, prof = c % 2 ? W : D, R = repere(x, z, ry), k = Math.max(1, Math.floor(long * par));
      for (let i = 0; i < k; i++) {
        const lx = -long / 2 + ((i + 0.5) * long) / k;
        // (avec un cadre, la fenêtre est posée sur l'entourage en relief)
        const e = cadre ? 0.07 : 0;
        if (cadre) {
          // (ouvert, le deuxième étage où l'on entre : l'entourage est un cadre, et le milieu un vrai trou dans le mur)
          if (ouvert) {
            for (const sy of [-1, 1]) a.boite(l + 0.16, 0.08, 0.07, P.platre, R(lx, y + sy * (h / 2 + 0.04), prof / 2 + 0.035, { trait: false }));
            for (const sx of [-1, 1]) a.boite(0.08, h, 0.07, P.platre, R(lx + sx * (l / 2 + 0.04), y, prof / 2 + 0.035, { trait: false }));
          } else a.boite(l + 0.16, h + 0.16, 0.07, P.platre, R(lx, y, prof / 2 + 0.035, { trait: false }));
          a.boite(l + 0.3, 0.05, 0.13, P.platre, R(lx, y - h / 2 - 0.105, prof / 2 + 0.065, { trait: false }));
        }
        if (!ouvert) a.boite(l, h, cadre ? 0.012 : 0.04, P.noir, R(lx, y, prof / 2 + (cadre ? e + 0.006 : 0.02), { trait: false }));
        for (let b = 0; b < nb; b++) a.boite(0.05, h - 0.04, 0.03, P.platre, R(lx - l / 2 + (b + 0.5) * (l / nb), y, prof / 2 + e + 0.027, { trait: false }));
      }
    }
  }
  /**
   * Sous un toit japonais (toitJapon : largeur L, profondeur Pp, haut de h, ratioHaut, creux, épaisseur ep), la hauteur de
   * son dessous au-dessus de son bord, à l'aplomb des murs d'un étage W × D (du côté où il est le plus bas), plus 8 cm :
   * on y monte les murs, qui finissent dans l'épaisseur du toit.
   */
  const sousToit = (L, Pp, h, ratio, creux, ep, W, D) => {
    const v = (demi, mur) => Math.min(1, Math.max(0, (1 - mur / demi) / (1 - ratio)));
    return Math.min(h * v(L / 2, W / 2) ** creux, h * v(Pp / 2, D / 2) ** creux) - ep + 0.08;
  };
  /** Une tour d'angle (yagura), en x, z, au sol y : un ou deux étages de plâtre blanc, leurs fenêtres, leurs toits. */
  function yagura(a, x, z, y, W, D, deux = true) {
    const h1 = 2.9 + sousToit(W + 2.0, D + 2.0, 1.1, deux ? 0.62 : 0.26, 1.7, 0.12, W - 0.1, D - 0.1);
    a.boite(W, 0.5, D, P.pierreFonce, { x, y: y + 0.2, z, teinte: pierres })
      .boite(W - 0.1, h1, D - 0.1, P.platre, { x, y: y + 0.4 + h1 / 2, z });
    fenetres(a, x, z, y + 2.1, W - 0.1, D - 0.1);
    toitH(a, W + 2.0, D + 2.0, 1.1, deux ? 0.62 : 0.26, { x, y: y + 3.3, z, releve: 0.24, rangs: 14, epaisseur: 0.12, ...TUILES });
    if (deux) {
      const w = (W + 2.0) * 0.62 - 0.3, d = (D + 2.0) * 0.62 - 0.3, y2 = y + 4.3;
      const h2 = 2.3 + sousToit(w + 1.9, d + 1.9, 1.3, 0.22, 1.7, 0.12, w, d);
      a.boite(w, h2, d, P.platre, { x, y: y2 + h2 / 2, z });
      fenetres(a, x, z, y2 + 1.3, w, d);
      toitH(a, w + 1.9, d + 1.9, 1.3, 0.22, { x, y: y2 + 2.3, z, releve: 0.24, rangs: 12, epaisseur: 0.12, ...TUILES });
    }
    // (un bloc à leur forme : le segment épais d'avant, arrondi, dépassait de leurs bouts de sa demi-largeur, un mur
    // invisible de deux mètres devant elles)
    monde.surface(x - W / 2 - 0.25, x + W / 2 + 0.25, z - D / 2 - 0.25, z + D / 2 + 0.25, y + 8, { plein: true });
    monde.bloc(x - W / 2, x + W / 2, z - D / 2, z + D / 2, y - 1, y + 8);
    BATIS.push([x - W / 2, z, x + W / 2, z, D / 2 + 1.0, y, y + 8]);
  }
  /** Des murs de terre le long d'une ligne brisée (des morceaux d'au plus 10 m : on les voit ou non séparément) ; libre0,
   * libre1 : false si le premier ou le dernier bout touche quelque chose (une porte : il ne déborde pas). */
  function enceinte(a, points, y, { libre0 = true, libre1 = true, ...o } = {}) {
    for (let k = 0; k < points.length - 1; k++) {
      const [x0, z0] = points[k], [x1, z1] = points[k + 1], L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.ceil(L / 10));
      const d0 = k === 0 ? libre0 : true, d1 = k === points.length - 2 ? libre1 : true;
      for (let i = 0; i < n; i++) dobei(a, x0 + ((x1 - x0) * i) / n, z0 + ((z1 - z0) * i) / n, x0 + ((x1 - x0) * (i + 1)) / n, z0 + ((z1 - z0) * (i + 1)) / n, y, { ...o, debut: i === 0 && d0, fin: i === n - 1 && d1 });
    }
  }
  {
    const a = atelier();
    // les murs de pierre des terrasses, ouverts là où entrent les escaliers (entre leurs murets) ; la Nishi-no-maru
    rempart(a, T1, { cotes: ['sud', 'est', 'ouest'], trous: { sud: [[ESC.hishi.x0 - 1, ESC.hishi.x1 + 1]] } });
    rempart(a, T2, { cotes: ['sud', 'est', 'ouest'], trous: { sud: [[ESC.i.x0 - 1, ESC.i.x1 + 1]] } });
    rempart(a, T3, { trous: { sud: [[ESC.ni.x0 - 1, ESC.ni.x1 + 1]] } });
    rempart(a, NISHI, { cotes: ['est', 'sud', 'nord'] });
    // les escaliers : des marches de pierre pleines (une largeur sur deux, 1 cm de moins ; la plus haute 1,2 cm sous la
    // terrasse), entre deux murets qui dépassent de 50 cm, coiffés d'une pierre plus large ; on y marche par le milieu
    // de chaque marche
    for (const E of ESCALIERS) {
      const bas = E.bas - 0.6;
      for (let j = 0; j < E.n; j++) {
        const z0 = E.zHaut + j * E.giron, h = j === 0 ? E.haut - 0.012 : E.haut - j * E.monte, e = j % 2 ? 0.01 : 0;
        a.boite(E.x1 - E.x0 + 0.06 - e, h - bas + e, E.giron + 0.02, j % 2 ? P.pierre : '#aaa396', { x: E.x, y: (h + bas - e) / 2, z: z0 + E.giron / 2, nuance: 0.04 });
      }
      const zA = E.zHaut - 0.35, zB = E.zPied + 0.15;
      for (const s of [-1, 1]) {
        const xc = s < 0 ? E.x0 - 0.5 : E.x1 + 0.5, hm = E.haut + 0.5 - bas;
        muret(a, xc, zA, xc, zB, 1.0, bas, bas + hm);
        a.boite(1.14, 0.12, zB - zA + 0.1, P.pierreFonce, { x: xc, y: E.haut + 0.56, z: (zA + zB) / 2 });
        monde.mur(xc, zA, xc, zB, 0.52);
      }
      const pts = [[E.x, E.zPied + 0.3, E.bas]];
      for (let j = E.n - 1; j >= 0; j--) pts.push([E.x, E.zHaut + (j + 0.5) * E.giron, E.haut - j * E.monte]);
      pts.push([E.x, E.zHaut - 0.35, E.haut]);
      monde.chemin(pts, (E.x1 - E.x0) / 2 - 0.1, { sol: 'pierre' });
    }
    // les murs de terre blancs : au bord des terrasses (leurs meurtrières regardent dehors)
    const H = ESC.hishi, I = ESC.i, N = ESC.ni;
    enceinte(a, [[T1.x0 + 0.35, T1.z1 - 0.35], [H.x0 - 1, T1.z1 - 0.35]], T1.h, { dehors: [0, 1] });
    enceinte(a, [[H.x1 + 1, T1.z1 - 0.35], [T1.x1 - 0.35, T1.z1 - 0.35]], T1.h, { dehors: [0, 1] });
    // (de part et d'autre de la porte en losange, en retrait de 1,6 m sur le bord, un mur rejoint ses ailes : entre le mur
    // du bord et la porte, on voyait au travers ; 2026-10-25)
    for (const xj of [HISHI.x - 5.85, HISHI.x + 5.85]) dobei(a, xj, T1.z1 - 0.35, xj, HISHI.z + 1.4, T1.h, { debut: false, fin: false });
    enceinte(a, [[T1.x0 + 0.35, T1.z0 + 0.2], [T1.x0 + 0.35, T1.z1 - 0.35]], T1.h, { dehors: [-1, 0] });
    enceinte(a, [[T1.x1 - 0.35, T1.z1 - 0.35], [T1.x1 - 0.35, T1.z0 + 0.2]], T1.h, { dehors: [1, 0] });
    enceinte(a, [[I.x1 + 1, T2.z1 - 0.35], [T2.x1 - 0.35, T2.z1 - 0.35]], T2.h, { dehors: [0, 1] });
    enceinte(a, [[T2.x0 + 0.35, T2.z0 + 0.2], [T2.x0 + 0.35, T2.z1 - 0.35]], T2.h, { dehors: [-1, 0] });
    enceinte(a, [[T2.x1 - 0.35, T2.z1 - 0.35], [T2.x1 - 0.35, T2.z0 + 0.2]], T2.h, { dehors: [1, 0] });
    enceinte(a, [[T3.x0 + 0.35, T3.z1 - 0.35], [N.x0 - 1, T3.z1 - 0.35]], T3.h, { dehors: [0, 1] });
    enceinte(a, [[T3.x0 + 0.35, T3.z0 + 0.35], [T3.x0 + 0.35, T3.z1 - 0.35]], T3.h, { dehors: [-1, 0] });
    enceinte(a, [[T3.x1 - 0.35, T3.z1 - 0.35], [T3.x1 - 0.35, T3.z0 + 0.35]], T3.h, { dehors: [1, 0] });
    enceinte(a, [[T3.x1 - 0.35, T3.z0 + 0.35], [T3.x0 + 0.35, T3.z0 + 0.35]], T3.h, { dehors: [0, -1] });
    // la porte en losange (菱の門), en haut du premier escalier : une porte à tour (yagura-mon), refaite le 2026-10-25
    // (« refais la porte au losange en mieux »). En bas, les deux grands poteaux de devant (kagami-bashira) et deux plus
    // minces derrière, sur leurs pierres, leurs pieds bardés de fer ; la grande poutre (kabuki) et ses deux losanges fleuris
    // dorés (hanabishi), qui donnent son nom à la porte ; les deux battants ouverts, de planches, leurs bandes de fer et
    // leurs clous dorés, la petite porte (kuguri) dans l'un d'eux ; de part et d'autre du passage, les ailes de plâtre sur
    // leur pierre, leurs poteaux et leur traverse de bois. Au-dessus, la tour blanche : les bouts des solives sous son
    // plancher, une bande de bois sombre, le bandeau de plâtre ; devant, deux fenêtres en cloche (katōmado) cerclées
    // d'or, au cadre laqué noir, et des fenêtres à barreaux laqués noirs devant le papier ; derrière et aux bouts, des
    // fenêtres à barreaux. Le toit à croupes et pignons (irimoya), ses arêtes, ses pignons blancs et leurs ornements
    // dorés ; les lanternes de papier sous la poutre
    {
      // (son propre objet, 2026-10-25 : la caméra ne la dessine que si elle la voit)
      const a = atelier(), x = HISHI.x, z = HISHI.z, y = T1.h, H1 = 3.6, W = 12.4, D = 3.2;
      const BOIS = '#3e3028', PLANCHE = '#5a4636', PLANCHE2 = '#4e3c2e', LAQUE = '#262022', FER = '#2c2a2a';
      // les poteaux, leurs pierres, leurs pieds de fer et leur bague dorée
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        const px = x + sx * 2.25, pz = z + sz * 1.35, l = sz > 0 ? 0.52 : 0.42, pp = sz > 0 ? 0.62 : 0.42;
        a.boite(l, H1, pp, BOIS, { x: px, y: y + H1 / 2, z: pz })
          .boite(l + 0.3, 0.14, pp + 0.3, P.pierreFonce, { x: px, y: y + 0.05, z: pz })
          .boite(l + 0.03, 0.42, pp + 0.03, FER, { x: px, y: y + 0.33, z: pz, trait: false })
          .boite(l + 0.036, 0.04, pp + 0.036, P.or, { x: px, y: y + 0.555, z: pz, trait: false });
      }
      for (const s2 of [-1, 1]) {
        const xc = x + s2 * 4.35;
        // l'aile : sa pierre, son plâtre, le poteau du bout et la traverse, devant et derrière
        a.boite(3.7, 0.7, D, P.pierreFonce, { x: xc, y: y + 0.35, z, teinte: pierres })
          .boite(3.66, H1 - 0.7, D - 0.24, P.platre, { x: xc, y: y + 0.7 + (H1 - 0.7) / 2, z })
          .boite(0.32, H1 - 0.7, D - 0.2, BOIS, { x: x + s2 * 6.05, y: y + 0.7 + (H1 - 0.7) / 2, z });
        for (const sz of [-1, 1]) a.boite(3.3, 0.18, 0.04, BOIS, { x: xc - s2 * 0.15, y: y + 2.35, z: z + sz * ((D - 0.24) / 2 + 0.02), trait: false });
        // le battant ouvert, contre le mur du passage : des planches, trois bandes de fer et leurs clous dorés (sur la
        // face qui regarde le passage)
        const xd = x + s2 * 1.93, zd = z - 0.3, hd = H1 - 0.5, ld = 2.0;
        a.piece(new THREE.BoxGeometry(0.14, hd, ld, 1, 1, 8), PLANCHE, { x: xd, y: y + hd / 2 + 0.05, z: zd, teinte: (px, py, pz) => (Math.floor((pz - zd) / 0.25 + 100) % 2 ? PLANCHE : PLANCHE2) });
        for (const yy of [0.55, 1.6, 2.65]) {
          a.boite(0.155, 0.13, ld - 0.06, FER, { x: xd, y: y + yy, z: zd, trait: false });
          for (let k = 0; k < 6; k++) a.cylindre(0.032, 0.032, 0.03, 6, P.or, { x: xd - s2 * 0.09, y: y + yy, z: zd - ld / 2 + 0.2 + k * 0.32, rz: PI / 2, trait: false });
        }
        if (s2 < 0) {
          // la petite porte (kuguri) découpée dans le battant de l'ouest
          const zk = zd + 0.35, xk = xd + 0.075;
          for (const dz of [-0.4, 0.4]) a.boite(0.012, 1.3, 0.04, LAQUE, { x: xk, y: y + 0.12 + 0.65, z: zk + dz, trait: false });
          a.boite(0.012, 0.04, 0.84, LAQUE, { x: xk, y: y + 1.44, z: zk, trait: false })
            .cylindre(0.03, 0.03, 0.03, 8, FER, { x: xk + 0.012, y: y + 0.85, z: zk + 0.28, rz: PI / 2, trait: false });
        }
        // (un bloc à la forme de l'aile : le segment épais d'avant, arrondi, rétrécissait le passage à 1,8 m)
        monde.surface(s2 < 0 ? x - 6.45 : x + 2.38, s2 < 0 ? x - 2.38 : x + 6.45, z - D / 2 - 0.25, z + D / 2 + 0.25, y + H1 + 5, { plein: true });
        monde.cercle(x + s2 * 2.25, z + 1.35, 0.36);
        monde.cercle(x + s2 * 2.25, z - 1.35, 0.36);
      }
      // la grande poutre de devant et ses losanges fleuris dorés (sur une plaque laquée), ses ferrures dorées près des
      // poteaux ; la poutre de derrière
      const yP = y + H1 - 0.42, zF = z + 1.38 + 0.25;
      a.boite(5.1, 0.5, 0.5, BOIS, { x, y: yP, z: z + 1.38 })
        .boite(5.0, 0.36, 0.4, BOIS, { x, y: y + H1 - 0.32, z: z - 1.35 });
      for (const sx of [-1, 1]) {
        const cx = x + sx * 1.15;
        a.boite(0.66, 0.44, 0.02, LAQUE, { x: cx, y: yP, z: zF + 0.005, trait: false })
          .boite(0.7, 0.025, 0.025, P.or, { x: cx, y: yP + 0.23, z: zF + 0.01, trait: false })
          .boite(0.7, 0.025, 0.025, P.or, { x: cx, y: yP - 0.23, z: zF + 0.01, trait: false });
        for (const [dx, dy] of [[0, 0.11], [0, -0.11], [0.11, 0], [-0.11, 0]]) a.boite(0.115, 0.115, 0.02, P.or, { x: cx + dx, y: yP + dy, z: zF + 0.025, rz: PI / 4, trait: false });
        a.cylindre(0.035, 0.035, 0.02, 8, '#c84a2c', { x: cx, y: yP, z: zF + 0.04, rx: PI / 2, trait: false });
        a.boite(0.26, 0.46, 0.02, P.or, { x: x + sx * 1.85, y: yP, z: zF + 0.01, trait: false })
          .boite(0.18, 0.38, 0.02, LAQUE, { x: x + sx * 1.85, y: yP, z: zF + 0.025, trait: false });
        for (const dy of [-0.12, 0.12]) a.cylindre(0.025, 0.025, 0.02, 6, P.or, { x: x + sx * 1.85, y: yP + dy, z: zF + 0.04, rx: PI / 2, trait: false });
      }
      // la tour : sa poutre de plancher, les bouts des solives dessous (devant, derrière), le plâtre, une bande de bois
      // sombre en bas, le bandeau de plâtre au-dessus des fenêtres
      const hT = 2.65 + sousToit(W + 2.6, D + 3.4, 1.5, 0.3, 1.7, 0.14, W, D + 0.3), yT0 = y + H1 + 0.2, wy = y + H1 + 1.45;
      a.boite(W + 0.3, 0.32, D + 0.5, BOIS, { x, y: y + H1 + 0.05, z })
        .boite(W, hT, D + 0.3, P.platre, { x, y: yT0 + hT / 2, z })
        .boite(W + 0.04, 0.2, D + 0.34, '#3e3830', { x, y: yT0 + 0.12, z, trait: false })
        .boite(W + 0.1, 0.1, D + 0.4, P.platre, { x, y: wy + 1.05, z, trait: false });
      for (const sz of [-1, 1]) for (let k = 0; k < 22; k++) a.boite(0.14, 0.14, 0.75, BOIS, { x: x - W / 2 + 0.3 + (k * (W - 0.6)) / 21, y: y + H1 - 0.18, z: z + sz * 1.58, trait: false });
      // une fenêtre en cloche (katōmado), en x, sa base à yb, sur la face z (sens sz : +1 devant) : l'anneau doré, le cadre
      // laqué noir, le papier, cinq barreaux et une traverse laqués
      // (le contour d'une fenêtre en cloche, large de k mètre, sa base à y0 : les côtés droits, les épaules qui s'évasent,
      // l'arc en accolade qui monte en pointe)
      const cloche = (k, y0 = 0) => {
        const f = new THREE.Shape(), w = 0.5 * k;
        f.moveTo(-w, y0); f.lineTo(w, y0); f.lineTo(w, y0 + 0.7 * k);
        f.quadraticCurveTo(w + 0.09 * k, y0 + 0.8 * k, w * 0.9, y0 + 0.9 * k);
        f.bezierCurveTo(w * 0.9, y0 + 1.1 * k, w * 0.25, y0 + 1.12 * k, 0, y0 + 1.42 * k);
        f.bezierCurveTo(-w * 0.25, y0 + 1.12 * k, -w * 0.9, y0 + 1.1 * k, -w * 0.9, y0 + 0.9 * k);
        f.quadraticCurveTo(-w - 0.09 * k, y0 + 0.8 * k, -w, y0 + 0.7 * k);
        f.lineTo(-w, y0);
        return f;
      };
      const anneau = (k1, y1, k0, y0) => { const f = cloche(k1, y1); f.holes.push(cloche(k0, y0)); return f; };
      const katomado = (wx, yb, zf) => {
        a.piece(new THREE.ExtrudeGeometry(anneau(1.14, -0.06, 1.0, 0), { depth: 0.045, bevelEnabled: false, curveSegments: 6 }), P.or, { x: wx, y: yb, z: zf, trait: false })
          .piece(new THREE.ExtrudeGeometry(anneau(1.0, 0, 0.82, 0.07), { depth: 0.03, bevelEnabled: false, curveSegments: 6 }), LAQUE, { x: wx, y: yb, z: zf, trait: false })
          .piece(new THREE.ShapeGeometry(cloche(0.82, 0.07), 6), P.shoji, { x: wx, y: yb, z: zf + 0.005, trait: false });
        for (let b = 0; b < 5; b++) a.boite(0.04, 0.58, 0.035, LAQUE, { x: wx - 0.3 + b * 0.15, y: yb + 0.36, z: zf + 0.02, trait: false });
        a.boite(0.74, 0.04, 0.035, LAQUE, { x: wx, y: yb + 0.45, z: zf + 0.02, trait: false });
      };
      // une fenêtre à barreaux laqués noirs devant le papier, centrée en (lx, ly) dans le repère R (face vers +z local)
      const renji = (R, lx, ly) => {
        a.boite(1.0, 0.6, 0.03, P.shoji, R(lx, ly, 0.015, { trait: false }));
        for (const sy of [-1, 1]) a.boite(1.14, 0.07, 0.06, LAQUE, R(lx, ly + sy * 0.335, 0.03, { trait: false }));
        for (const sx of [-1, 1]) a.boite(0.07, 0.6, 0.06, LAQUE, R(lx + sx * 0.535, ly, 0.03, { trait: false }));
        for (let b = 0; b < 6; b++) a.boite(0.04, 0.6, 0.04, LAQUE, R(lx - 0.42 + b * 0.168, ly, 0.035, { trait: false }));
      };
      const zDevant = z + (D + 0.3) / 2, Rav = repere(x, zDevant, 0), Rar = repere(x, z - (D + 0.3) / 2, PI);
      for (const sx of [-1, 1]) {
        katomado(x + sx * 1.1, wy - 0.62, zDevant);
        for (const k of [3.4, 5.0]) renji(Rav, sx * k, wy);
        for (const k of [1.6, 4.2]) renji(Rar, sx * k, wy);
        renji(repere(x + sx * W / 2, z, sx * PI / 2), 0, wy);
      }
      // le toit : quatre pans, ses arêtes (toitH) ; en haut, le pignon (irimoya), son triangle blanc et ses ornements
      // dorés, l'arête du faîte et ses tuiles d'about
      const lt = W + 2.6, dt = D + 3.4, yR = y + H1 + 2.85 + 1.5, lg = lt * 0.3 * 1.21;
      toitH(a, lt, dt, 1.5, 0.3, { x, y: y + H1 + 2.85, z, releve: 0.28, rangs: 18, epaisseur: 0.14 });
      a.pignon(lg, 1.0, dt * 0.32, P.platre, { x, y: yR - 0.06, z });
      deuxPans(a, lg + 0.4, dt * 0.34 + 0.4, 1.08, yR - 0.12, { x, z });
      for (const sx of [-1, 1]) {
        gegyo(a, { x: x + sx * (lg / 2 + 0.02), y: yR + 0.62, z, ry: sx * PI / 2 }, 1.0);
        a.boite(0.2, 0.46, 0.36, '#5c6066', { x: x + sx * (lg / 2 + 0.32), y: yR + 1.02, z });
      }
      a.chochin(x - 1.6, y + 2.9, z + 1.55, 6).chochin(x + 1.6, y + 2.9, z + 1.55, 6);
      lumieres.push({ x, y: y + 2.9, z: z + 1.9, halo: 0.5, sol: y, r: 3.6 });
      monde.toit(x - 2.3, x + 2.3, z - D / 2, z + D / 2, y + H1 - 0.15, y + H1 + 4.6);
      monde.bloc(x - W / 2, x - 2.5, z - D / 2, z + D / 2, y - 1, y + H1 + 4.3);
      monde.bloc(x + 2.5, x + W / 2, z - D / 2, z + D / 2, y - 1, y + H1 + 4.3);
      poser(a.fin(0, peinture), 0, 0, { y: 0 });
    }
    // les autres portes, dans des murs qui barrent les terrasses
    for (const G of PORTES) {
      koraimon(a, G.x, G.z, G.y, G.ry, 4.0);
      if (G.mur) {
        // (contre la porte, jusqu'à son poteau, sans déborder ; au nord, jusque dans le mur de pierre de la terrasse du
        // dessus : il s'évase vers le bas, et arrêté à son pied, le mur blanc laissait un vide contre la pierre en haut)
        const [z0, z1] = G.mur;
        enceinte(a, [[G.x, z0 - 0.58], [G.x, G.z - 2.4]], G.y, { libre1: false });
        enceinte(a, [[G.x, G.z + 2.4], [G.x, z1 - 0.2]], G.y, { libre0: false });
      }
    }
    // l'impasse : un mur la sépare du reste de la terrasse ; au fond, une lanterne, de vieilles feuilles
    enceinte(a, [[IMPASSE.x1, IMPASSE.z1], [IMPASSE.x1, IMPASSE.z0 + 0.2]], T2.h, {});
    lanterne(a, IMPASSE.x0 + 0.9, IMPASSE.z0 + 1.0, T2.h);
    monde.cercle(IMPASSE.x0 + 0.9, IMPASSE.z0 + 1.0, 0.38);
    // la cour du puits d'Okiku : ses murs de part et d'autre, ouverte au sud, sur le chemin
    enceinte(a, [[COUR.x0, COUR.z1], [COUR.x0, COUR.z0 - 0.58]], T2.h, {});
    // (à l'est, le mur de la porte « ha » ferme la cour ; un bout de mur, serré contre la pierre de la terrasse du dessus,
    // le relie au muret de l'escalier)
    enceinte(a, [[COUR.x1, COUR.z0 + 0.05], [ESC.ni.x0 - 1, COUR.z0 + 0.05]], T2.h, { libre0: false, libre1: false });
    // le haut de l'escalier de la troisième terrasse : une petite cour carrée (masugata), la porte « ni » au nord
    enceinte(a, [[ESC.ni.x0 - 0.6, T3.z1 - 0.35], [ESC.ni.x0 - 0.6, -41.6]], T3.h, {});
    enceinte(a, [[24.4, -41.6], [T3.x1 - 0.35, -41.6]], T3.h, { libre0: false });
    enceinte(a, [[ESC.ni.x1 + 0.5, T3.z1 - 0.35], [T3.x1 - 0.35, T3.z1 - 0.35]], T3.h, { dehors: [0, 1] });
    // les bouts des terrasses qui ne donnent que sur la colline (au fond de l'impasse, aux coins) : des murs aussi
    enceinte(a, [[T1.x0 + 0.35, T1.z0 + 0.35], [ESC.i.x0 - 1, T1.z0 + 0.35]], T1.h, { dehors: [0, -1] });
    // (2026-10-25 : ces trois murs finissaient devant le coin d'un mur de pierre penché, celui de la terrasse du dessus,
    // et l'on voyait la colline par le vide entre eux ; leur bout tourne maintenant dans la pierre)
    enceinte(a, [[T2.x1 - 0.2, T2.z1 - 0.3], [T2.x1 - 0.2, T1.z0 + 0.35], [T1.x1 - 0.35, T1.z0 + 0.35]], T1.h, { dehors: [0, -1], libre0: false });
    enceinte(a, [[T2.x0 + 0.35, T2.z0 + 0.35], [T3.x0 + 0.1, T2.z0 + 0.35], [T3.x0 + 0.1, T3.z1 - 0.3]], T2.h, { dehors: [0, -1], libre1: false });
    enceinte(a, [[T3.x1 - 0.1, T3.z1 - 0.3], [T3.x1 - 0.1, T2.z0 + 0.35], [T2.x1 - 0.35, T2.z0 + 0.35]], T2.h, { dehors: [0, -1], libre0: false });
    // les tours d'angle
    yagura(a, T1.x1 - 3.4, T1.z1 - 3.0, T1.h, 5.0, 4.4);
    yagura(a, T1.x0 + 3.4, T1.z1 - 3.0, T1.h, 4.6, 4.2);
    yagura(a, T3.x0 + 3.2, T3.z1 - 3.0, T3.h, 4.6, 4.0, false);
    // des pins taillés au pied des murs, sur les terrasses ; au pied de chaque arbre des terrasses, des touffes d'herbe
    for (const [x, z, s, sens] of PINS) {
      a.pinNuages(x, z, s, sens, { y: terrain(x, z) });
      monde.cercle(x, z, 0.4);
    }
    for (const [x, z] of ARBRES_TERRASSES) herbesAuPied(a, x, z, terrain(x, z));
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Le donjon
  /** Un toit à deux pans le long de x local : long de L, large de p (de bord à bord), haut de h, son bas à la hauteur y ;
   * o : la pose (x, z, ry). Deux plaques de tuiles inclinées, l'arête blanche au faîte. */
  function deuxPans(a, L, p, h, y, o = {}) {
    const R = repere(o.x || 0, o.z || 0, o.ry || 0), ang = Math.atan2(h, p / 2), l = Math.hypot(p / 2, h) + 0.08;
    const rangs = (x) => (Math.floor(x / 0.3 + 500) % 2 ? P.tuileShiro : P.tuileShiroClaire);
    // (les deux pans de longueurs un rien différentes : leurs bouts, qui se croisent au faîte, ne sont pas dans le même plan ;
    // chaque pan penché d'abord, puis tourné avec le toit, ordre YXZ : dans l'ordre XYZ, un toit tourné d'un quart de tour
    // penchait le long de son faîte, et ses deux pans faisaient un X — le long couloir de la Nishi-no-maru, les pignons du
    // donjon ; 2026-10-25)
    for (const s of [-1, 1]) a.piece(new THREE.BoxGeometry(L - (s > 0 ? 0 : 0.012), 0.12, l, Math.max(1, Math.round(L / 0.3)), 1, 1), P.tuileShiro, R(0, y + h / 2, (s * p) / 4, { rx: s * ang, ordre: 'YXZ', teinte: rangs }));
    return a.boite(L + 0.12, 0.13, 0.22, P.mortier, R(0, y + h + 0.03, 0));
  }
  /** Un gegyo (懸魚) : l'ornement doré pendu sous la pointe d'un pignon (un cœur renversé entre deux ailes enroulées),
   * face vers +z de sa pose o (son dos à o.z) ; k : sa taille (environ 0,45 × 0,36 m à 1). */
  function gegyo(a, o, k = 1) {
    const f = new THREE.Shape(), pt = (x, y) => [x * k, y * k];
    f.moveTo(...pt(0, 0.06));
    f.bezierCurveTo(...pt(0.1, 0.1), ...pt(0.24, 0.04), ...pt(0.2, -0.06));
    f.bezierCurveTo(...pt(0.17, -0.13), ...pt(0.08, -0.12), ...pt(0.06, -0.1));
    f.bezierCurveTo(...pt(0.08, -0.18), ...pt(0.04, -0.24), ...pt(0, -0.3));
    f.bezierCurveTo(...pt(-0.04, -0.24), ...pt(-0.08, -0.18), ...pt(-0.06, -0.1));
    f.bezierCurveTo(...pt(-0.08, -0.12), ...pt(-0.17, -0.13), ...pt(-0.2, -0.06));
    f.bezierCurveTo(...pt(-0.24, 0.04), ...pt(-0.1, 0.1), ...pt(0, 0.06));
    return a.piece(new THREE.ExtrudeGeometry(f, { depth: 0.04, bevelEnabled: false, curveSegments: 5 }), P.or, { ...o, trait: false });
  }
  /** Un pignon triangulaire (chidori-hafu) sur la pente d'un toit : son triangle blanc tourné vers dehors (+z local), ses
   * deux petits pans, l'arête, l'ornement doré sous la pointe ; en x, z, au bas y, tourné de ry ; large de w, haut de h,
   * profond de d. */
  function hafu(a, x, z, y, ry, w, h, d) {
    const R = repere(x, z, ry);
    a.pignon(d, h * 0.96, w * 0.92, P.platre, R(0, y, -d / 2 + 0.06, { ry: PI / 2 }));
    deuxPans(a, d + 0.3, w + 0.5, h + 0.1, y - 0.06, { ...R(0, 0, -d / 2 + 0.2), ry: ry + PI / 2 });
    gegyo(a, R(0, y + h * 0.74, 0.09), 0.8 + w * 0.12);
    return a;
  }
  /**
   * Un pignon courbe (kara-hafu, 唐破風) tourné vers le sud (+z) : un toit dont le bord avant fait un arc ondulé (bombé au
   * milieu, les bouts qui se relèvent), large de w, haut de h, profond de d, son avant en zAvant, sa base à y ; dessous,
   * le pignon blanc, son ornement doré au sommet.
   */
  function karahafu(a, x, y, zAvant, w, h, d) {
    const n = 18, arc = (t, k = 1, dy = 0) => { const u = -1 + 2 * t; return [x + (u * w * k) / 2, y + dy + h * Math.max(0, 1 - u * u) ** 0.75 + 0.12 * Math.abs(u) ** 6]; };
    const forme = new THREE.Shape();
    for (let i = 0; i <= n; i++) { const [px, py] = arc(i / n); forme[i ? 'lineTo' : 'moveTo'](px - x, py - y); }
    for (let i = n; i >= 0; i--) { const [px, py] = arc(i / n, 0.94, -0.13); forme.lineTo(px - x, py - y); }
    const toit = new THREE.ExtrudeGeometry(forme, { depth: d, bevelEnabled: false, curveSegments: 1 });
    a.piece(toit, P.tuileShiro, { x, y, z: zAvant - d, teinte: (px, py, pz) => (pz > zAvant - 0.02 || pz < zAvant - d + 0.02 ? P.mortier : Math.floor(px / 0.3 + 500) % 2 ? P.tuileShiro : P.tuileShiroClaire) });
    // le pignon blanc sous l'arc, en retrait
    const pignon = new THREE.Shape();
    pignon.moveTo(-w * 0.47, -0.05);
    for (let i = 0; i <= n; i++) { const [px, py] = arc(i / n, 0.94, -0.13); pignon.lineTo(px - x, py - y); }
    pignon.lineTo(w * 0.47, -0.05);
    a.piece(new THREE.ShapeGeometry(pignon), P.platre, { x, y, z: zAvant - 0.35 });
    // l'ornement doré (gegyo) au sommet, et deux petits clous dorés
    gegyo(a, { x, y: y + h - 0.16, z: zAvant - 0.33 }, 1.35);
    for (const sx of [-1, 1]) a.cylindre(0.05, 0.05, 0.04, 8, P.or, { x: x + sx * 0.8, y: y + h * 0.62, z: zAvant - 0.33, rx: PI / 2, trait: false });
    return a;
  }
  /** Un shachihoko (鯱) : le poisson à tête de tigre qui garde le toit du feu ; en x, y, z, la queue dressée, tourné vers
   * le dehors (s : 1 ou −1, en x). */
  function shachi(a, x, y, z, s, k = 1) {
    const G = '#5c6066';
    a.ovale(0.32 * k, G, { x, y: y + 0.42 * k, z, sx: 0.55, sy: 1.25, sz: 0.62, rz: s * 0.25 }, 8)
      .ovale(0.22 * k, G, { x: x + s * 0.18 * k, y: y + 0.08 * k, z, sx: 1.1, sy: 0.75, sz: 0.85 }, 8)
      .cone(0.16 * k, 0.5 * k, 5, G, { x: x - s * 0.1 * k, y: y + 0.92 * k, z, rz: -s * 0.5 })
      .boite(0.36 * k, 0.05, 0.12 * k, G, { x: x - s * 0.22 * k, y: y + 1.12 * k, z, rz: -s * 0.9, trait: false });
    for (const sz of [-1, 1]) a.ovale(0.04 * k, P.or, { x: x + s * 0.3 * k, y: y + 0.14 * k, z: z + sz * 0.13 * k, trait: false }, 5);
    return a;
  }
  {
    // (ad : le décor du dedans, ajouté le 2026-10-25 : dessiné seulement la caméra dans le donjon ou à moins de 9 m de lui,
    // et à la hauteur de son étage : ad la salle basse, adM le deuxième étage, adH le dernier ; am : la coque du deuxième
    // étage, ses murs, son plancher, son plafond, toujours dessinée, mais en premier quand la caméra y est)
    const a = atelier(), ad = atelier(), adM = atelier(), adH = atelier(), am = atelier(), X = DONJON.x, Z = DONJON.z, yT = T3.h;
    // le socle de pierre : ses quatre flancs (ouverts au sud pour la porte : au-dessus d'elle, le linteau de pierre), son
    // dessus ; le couloir d'entrée, ses murs et son plafond, la porte de bois bardée de fer, grande ouverte
    const S = { x0: X - DONJON.W / 2 + DONJON.retrait, x1: X + DONJON.W / 2 - DONJON.retrait, z0: Z - DONJON.D / 2 + DONJON.retrait, z1: Z + DONJON.D / 2 - DONJON.retrait, h: Y_SOCLE, mur: DONJON.h };
    rempart(a, S, { trous: { sud: [[X - 1.6, X + 1.6]] }, d: DONJON.retrait, yPied: yT - 0.5 });
    const v1 = (Y_SOCLE + 0.02 - (yT + 2.85)) / (Y_SOCLE + 0.02 - (yT - 0.5)), e0 = 0.35, zS1 = S.z1 + 0.03;
    bande(a, [X - 1.6, zS1 + e0], [X + 1.6, zS1 + e0], [X - 1.6, zS1 + DONJON.retrait], [X + 1.6, zS1 + DONJON.retrait], Y_SOCLE + 0.02, yT - 0.5, [0, 1], { v1, profil: EVENTAIL });
    bande(a, [X - 1.6, zS1], [X + 1.6, zS1], [X - 1.6, zS1 + e0], [X + 1.6, zS1 + e0], Y_SOCLE + 0.02, Y_SOCLE + 0.02, [0, 1], { dessus: true });
    a.boite(S.x1 - S.x0, 0.14, S.z1 - S.z0, P.pierreFonce, { x: X, y: Y_SOCLE - 0.07, z: Z, teinte: pierres });
    const zP = Z + DONJON.D / 2 + 0.1, zS = SALLE.z1;
    for (const s of [-1, 1]) muret(a, X + s * 1.6, zS + 0.02, X + s * 1.6, zP, 0.4, yT - 0.1, yT + 2.9);
    // (le linteau 2 cm plus large et plus long que les murets, le plancher entre eux : leurs faces se superposaient)
    a.boite(3.64, 0.35, zP - zS - 0.02, P.pierreFonce, { x: X, y: yT + 2.85 + 0.17, z: (zP + zS + 0.06) / 2 })
      .boite(2.78, 0.06, zP - zS, P.bois2, { x: X, y: SALLE.y - 0.035, z: (zP + zS) / 2 })
      // le cadre de la porte, sa poutre, le battant ouvert contre le mur et ses bandes de fer
      .boite(0.3, 2.9, 0.3, '#3e3028', { x: X - 1.38, y: yT + 1.45, z: zP - 0.2 })
      .boite(0.3, 2.9, 0.3, '#3e3028', { x: X + 1.38, y: yT + 1.45, z: zP - 0.2 })
      .boite(3.06, 0.32, 0.34, '#3e3028', { x: X, y: yT + 2.85, z: zP - 0.2 })
      .boite(0.12, 2.6, 1.3, '#4a3a2e', { x: X - 1.3, y: yT + 1.35, z: zP - 1.0 });
    for (const yy of [0.5, 1.3, 2.1]) a.boite(0.135, 0.1, 1.24, P.noir, { x: X - 1.3, y: yT + yy, z: zP - 1.0, trait: false });
    // (ce qui arrête autour du socle, à hauteur de la terrasse ; ce qui arrête la caméra)
    const mB = [yT - 1, Y_SOCLE + 0.1], B0 = { x0: X - DONJON.W / 2 - 0.3, x1: X + DONJON.W / 2 + 0.3, z0: Z - DONJON.D / 2 - 0.3, z1: Z + DONJON.D / 2 + 0.3 };
    monde.mur(B0.x0, B0.z0, B0.x1, B0.z0, 0.3, ...mB); monde.mur(B0.x0, B0.z0, B0.x0, B0.z1, 0.3, ...mB); monde.mur(B0.x1, B0.z0, B0.x1, B0.z1, 0.3, ...mB);
    monde.mur(B0.x0, B0.z1, X - 1.75, B0.z1, 0.3, ...mB); monde.mur(X + 1.75, B0.z1, B0.x1, B0.z1, 0.3, ...mB);
    for (const s of [-1, 1]) monde.mur(X + s * 1.55, zS, X + s * 1.55, B0.z1, 0.25, ...mB);
    monde.bloc(B0.x0, X - 1.4, Z + DONJON.D / 2 - 2.6, B0.z1, yT - 1, Y_SOCLE);
    monde.bloc(X + 1.4, B0.x1, Z + DONJON.D / 2 - 2.6, B0.z1, yT - 1, Y_SOCLE);
    monde.bloc(X - 1.4, X + 1.4, Z + DONJON.D / 2 - 2.6, B0.z1, yT + 2.8, Y_SOCLE);
    monde.bloc(B0.x0, B0.x1, B0.z0, SALLE.z0, yT - 1, Y_SOCLE);
    monde.bloc(B0.x0, SALLE.x0, SALLE.z0, SALLE.z1, yT - 1, Y_SOCLE);
    monde.bloc(SALLE.x1, B0.x1, SALLE.z0, SALLE.z1, yT - 1, Y_SOCLE);
    monde.toit(X - 1.6, X + 1.6, zS, zP, yT + 2.8, Y_SOCLE);

    // la salle basse (dans le socle) : ses murs de planches sombres, son plafond et ses poutres, son plancher ; les deux
    // grands piliers (大柱, d'un seul tronc chacun) et des poteaux ; les râteliers à fusils et à lances ; l'escalier raide
    // qui monte par une trappe ; deux lampes de papier
    {
      const { x0, x1, z0, z1, y } = SALLE, hp = SALLE.plafond - yT, BOIS = '#5a4a3c';
      const planchesSalle = (x, yy, z) => (Math.floor(yy / 0.3 + 100) % 2 ? BOIS : '#514234');
      a.piece(new THREE.BoxGeometry(x1 - x0 + 1.0, hp, 0.5, 1, Math.round(hp / 0.3), 1), BOIS, { x: X, y: yT + hp / 2, z: z0 - 0.25, teinte: planchesSalle });
      for (const s of [-1, 1]) {
        a.piece(new THREE.BoxGeometry(0.5, hp, z1 - z0, 1, Math.round(hp / 0.3), 1), BOIS, { x: X + s * (x1 + 0.25), y: yT + hp / 2, z: (z0 + z1) / 2, teinte: planchesSalle });
        // (de part et d'autre du couloir d'entrée, le mur commence 3 cm derrière la face des murets : leurs faces étaient dans
        // le même plan, et au bout du couloir, juste après la porte, elles scintillaient ; 2026-10-25)
        a.piece(new THREE.BoxGeometry(x1 - 1.43, hp, 0.5, 1, Math.round(hp / 0.3), 1), BOIS, { x: X + s * (1.43 + (x1 - 1.43) / 2), y: yT + hp / 2, z: z1 + 0.25, teinte: planchesSalle });
      }
      a.boite(2.86, hp - 2.9, 0.5, BOIS, { x: X, y: yT + 2.9 + (hp - 2.9) / 2, z: z1 + 0.25 })
        .boite(x1 - x0 + 0.9, 0.18, z1 - z0 + 0.9, '#3e3028', { x: X, y: SALLE.plafond + 0.09, z: (z0 + z1) / 2 });
      for (let zz = z0 + 1.6; zz < z1 - 0.5; zz += 2.6) a.boite(x1 - x0, 0.3, 0.26, '#3a2c22', { x: X, y: SALLE.plafond - 0.15, z: zz });
      const nP = Math.round((z1 - z0) / 0.4);
      a.piece(new THREE.BoxGeometry(x1 - x0, 0.06, z1 - z0, 1, 1, nP), P.bois2, { x: X, y: y - 0.03, z: (z0 + z1) / 2, teinte: (x, yy, z) => (Math.floor(z / 0.4 + 400) % 2 ? P.bois2 : P.bois) });
      for (const s of [-1, 1]) {
        a.cylindre(0.46, 0.5, hp - 0.06, 14, '#6a5240', { x: X + s * 2.6, y: y + (hp - 0.06) / 2, z: Z })
          .cylindre(0.53, 0.53, 0.1, 14, P.noir, { x: X + s * 2.6, y: y + 0.6, z: Z, trait: false })
          .cylindre(0.53, 0.53, 0.1, 14, P.noir, { x: X + s * 2.6, y: y + 2.6, z: Z, trait: false });
        monde.cercle(X + s * 2.6, Z, 0.7, yT - 1, Y_SOCLE);
        for (const zz of [Z - 4.2, Z + 4.2]) { a.boite(0.3, hp, 0.3, '#5a4636', { x: X + s * 5.5, y: yT + hp / 2, z: zz }); monde.cercle(X + s * 5.5, zz, 0.32, yT - 1, Y_SOCLE); }
      }
      // (2026-10-25, « ajoute un peu plus de détails ») des poteaux le long des murs, sous chaque poutre du plafond, et la
      // poutre qui les relie au-dessus des armes (nageshi)
      const PO = '#4a3a2e', zPo = [];
      for (let zz = z0 + 1.6; zz < z1 - 0.5; zz += 2.6) zPo.push(zz);
      for (const s of [-1, 1]) for (const zz of zPo) ad.boite(0.14, hp, 0.24, PO, { x: X + s * (x1 - 0.07), y: yT + hp / 2, z: zz });
      for (const xx of [-6.4, -3.2, 0, 6.4]) ad.boite(0.24, hp, 0.14, PO, { x: X + xx, y: yT + hp / 2, z: z0 + 0.07 });
      for (const xx of [-6.2, -3.6, 3.6, 6.2]) ad.boite(0.24, hp, 0.14, PO, { x: X + xx, y: yT + hp / 2, z: z1 - 0.07 });
      const yNg = y + 2.45;
      ad.boite(x1 - x0, 0.14, 0.08, PO, { x: X, y: yNg, z: z0 + 0.04, trait: false });
      for (const s of [-1, 1]) {
        ad.boite(0.08, 0.14, z1 - z0, PO, { x: X + s * (x1 - 0.04), y: yNg, z: (z0 + z1) / 2, trait: false });
        ad.boite(x1 - 1.45, 0.14, 0.08, PO, { x: X + s * (1.45 + (x1 - 1.45) / 2), y: yNg, z: z1 - 0.04, trait: false });
      }
      // au mur ouest, les fusils (teppō) couchés sur leurs chevilles, trois par travée : le canon de fer, le fût et la crosse
      // de bois, la platine et les bagues de laiton
      const LAITON = '#c9a24a', fusil = (zc, yy) => {
        const xg = X - x1 + 0.2;
        ad.boite(0.04, 0.04, 1.15, '#3b3b40', { x: xg, y: yy, z: zc + 0.22 })
          .piece(new THREE.BoxGeometry(0.05, 0.08, 0.55, 1, 1, 2), '#7a4a2a', { x: xg, y: yy - 0.015, z: zc - 0.6, deformer: (px, py, pz) => [px, py + (pz < 0 ? (py < 0 ? -0.055 : -0.03) : 0), pz] })
          .boite(0.055, 0.035, 0.09, LAITON, { x: xg + 0.004, y: yy + 0.005, z: zc - 0.3, trait: false });
        for (const zb of [zc + 0.1, zc + 0.55]) ad.boite(0.05, 0.05, 0.02, LAITON, { x: xg, y: yy, z: zb, trait: false });
        for (const zb of [zc - 0.45, zc + 0.45]) ad.cylindre(0.015, 0.015, 0.16, 5, '#2e2420', { x: X - x1 + 0.08, y: yy - 0.045, z: zb, rz: PI / 2, trait: false });
      };
      for (let t = 0; t < 3; t++) for (let r = 0; r < 3; r++) fusil((zPo[t] + zPo[t + 1]) / 2, y + 1.0 + r * 0.36);
      // au mur est, les longues lances (yari) : la hampe laquée, la lame, posées sur des chevilles plantées dans les poteaux
      for (let k = 0; k < 4; k++) {
        const ys = y + 1.3 + k * 0.25, xs = X + x1 - 0.2, za = zPo[0] + 1.1 + (k % 2) * 0.4, zb = za + 6.0;
        ad.baton([xs, ys, za], [xs, ys, zb], 0.022, '#3a2a22', 5)
          .cone(0.035, 0.3, 4, '#c9c6bc', { x: xs, y: ys, z: zb + 0.15, rx: PI / 2 })
          .boite(0.05, 0.05, 0.06, LAITON, { x: xs, y: ys, z: zb - 0.02, trait: false });
        for (const zz of [zPo[1], zPo[2]]) ad.cylindre(0.014, 0.014, 0.14, 5, '#2e2420', { x: X + x1 - 0.17, y: ys - 0.035, z: zz, rz: PI / 2, trait: false });
      }
      for (const s of [-1, 1]) monde.mur(X + s * (x1 - 0.35), zPo[0], X + s * (x1 - 0.35), zPo[3], 0.3, yT - 1, Y_SOCLE);
      // deux armures de samouraï (鎧) sur leurs coffres, au mur nord : la cuirasse de plaques laquées lacées de soie (bleue,
      // rouge), les tassettes, les épaulières, le masque, le casque (兜), son couvre-nuque, ses retours, ses cornes dorées
      const armure = (xa, lacet) => {
        const za = z0 + 0.42, yA = y + 0.5, NOIR_L = '#26262c', bandes = (px, py) => (Math.floor(py / 0.055 + 200) % 2 ? NOIR_L : lacet);
        ad.boite(0.62, 0.5, 0.46, '#2a2220', { x: X + xa, y: y + 0.25, z: za });
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) ad.boite(0.05, 0.51, 0.05, P.or, { x: X + xa + sx * 0.3, y: y + 0.255, z: za + sz * 0.22, trait: false });
        ad.piece(new THREE.BoxGeometry(0.44, 0.4, 0.3, 1, 7, 1), NOIR_L, { x: X + xa, y: yA + 0.38, z: za, teinte: bandes, deformer: (px, py, pz) => [px * (0.88 + 0.24 * (py + 0.2)), py, pz * (0.9 + 0.2 * (py + 0.2))] });
        for (const [dx, dz, ry] of [[0, 0.16, 0], [0, -0.16, 0], [0.23, 0, PI / 2], [-0.23, 0, PI / 2]]) ad.piece(new THREE.BoxGeometry(0.2, 0.22, 0.025, 1, 4, 1), NOIR_L, { x: X + xa + dx, y: yA + 0.08, z: za + dz, ry, teinte: bandes });
        for (const sx of [-1, 1]) ad.piece(new THREE.BoxGeometry(0.03, 0.26, 0.2, 1, 5, 1), NOIR_L, { x: X + xa + sx * 0.29, y: yA + 0.46, z: za, rz: sx * 0.22, teinte: bandes });
        ad.boite(0.12, 0.08, 0.06, '#6a2a22', { x: X + xa, y: yA + 0.63, z: za + 0.1 })
          .piece(new THREE.SphereGeometry(0.13, 12, 6, 0, 2 * PI, 0, PI / 2), NOIR_L, { x: X + xa, y: yA + 0.7, z: za })
          .piece(new THREE.CylinderGeometry(0.135, 0.2, 0.12, 12, 3, true, PI / 3, (4 * PI) / 3), NOIR_L, { x: X + xa, y: yA + 0.66, z: za, teinte: bandes });
        for (const sx of [-1, 1]) {
          ad.boite(0.06, 0.07, 0.02, lacet, { x: X + xa + sx * 0.13, y: yA + 0.72, z: za + 0.11, ry: sx * 0.5 })
            .boite(0.016, 0.2, 0.012, P.or, { x: X + xa + sx * 0.05, y: yA + 0.86, z: za + 0.12, rz: -sx * 0.32, trait: false });
        }
        ad.cylindre(0.03, 0.03, 0.01, 10, P.or, { x: X + xa, y: yA + 0.77, z: za + 0.125, rx: PI / 2, trait: false });
        monde.cercle(X + xa, za, 0.45, yT - 1, Y_SOCLE);
      };
      armure(-5.0, '#2f4f8f');
      armure(-1.6, '#a8322a');
      // deux grands coffres (nagamochi) au mur sud : le bois, les ferrures noires, les poignées
      for (const xc of [-4.8, 4.8]) {
        const zc = z1 - 0.4;
        ad.boite(1.5, 0.52, 0.56, '#7a5638', { x: X + xc, y: y + 0.26, z: zc })
          .boite(1.54, 0.07, 0.6, '#6a4a30', { x: X + xc, y: y + 0.555, z: zc });
        for (const dx of [-0.66, 0.66]) ad.boite(0.06, 0.6, 0.62, '#2a2624', { x: X + xc + dx, y: y + 0.3, z: zc, trait: false });
        for (const sx of [-1, 1]) ad.boite(0.04, 0.05, 0.16, '#2a2624', { x: X + xc + sx * 0.78, y: y + 0.4, z: zc, trait: false });
        monde.mur(X + xc - 0.75, zc, X + xc + 0.75, zc, 0.36, yT - 1, Y_SOCLE);
      }
      // des bottes de riz (tawara) dans le coin sud-ouest ; dans le coin sud-est, deux tonneaux d'eau et des seaux pour le feu
      for (const [bx, by, bz] of [[-7.15, 0.22, -50.75], [-7.15, 0.22, -51.2], [-7.15, 0.6, -50.975]]) {
        ad.cylindre(0.22, 0.22, 0.62, 10, '#d8c07a', { x: X + bx, y: y + by, z: bz, rz: PI / 2 });
        for (const dx of [-0.24, 0, 0.24]) ad.piece(new THREE.CylinderGeometry(0.226, 0.226, 0.035, 10, 1, true), '#a88a4a', { x: X + bx + dx, y: y + by, z: bz, rz: PI / 2, trait: false });
      }
      monde.cercle(X - 7.15, -51.0, 0.6, yT - 1, Y_SOCLE);
      for (const [bx, bz] of [[7.15, -50.35], [6.5, -50.3]]) {
        ad.piece(new THREE.CylinderGeometry(0.27, 0.24, 0.62, 12, 1, true), '#8a6440', { x: X + bx, y: y + 0.31, z: bz })
          .piece(new THREE.CylinderGeometry(0.255, 0.23, 0.6, 12, 1, true), '#5a4030', { x: X + bx, y: y + 0.31, z: bz, sx: -1 })
          .piece(new THREE.CircleGeometry(0.258, 12), '#4a6a6e', { x: X + bx, y: y + 0.5, z: bz, rx: -PI / 2, sorte: 'eau', trait: false });
        for (const yy of [0.1, 0.5]) ad.piece(new THREE.CylinderGeometry(0.276, 0.27, 0.04, 12, 1, true), '#2a2624', { x: X + bx, y: y + yy, z: bz, trait: false });
        monde.cercle(X + bx, bz, 0.33, yT - 1, Y_SOCLE);
      }
      for (const [bx, bz, by] of [[5.95, -50.25, 0.11], [5.95, -50.25, 0.31]]) ad.piece(new THREE.CylinderGeometry(0.15, 0.12, 0.2, 10, 1, true), '#8a6440', { x: X + bx, y: y + by, z: bz });
      // l'évier de pierre (流し) du coin nord-est : on pouvait tenir un siège dans le donjon
      ad.boite(1.4, 0.16, 0.5, P.pierreFonce, { x: X + 6.6, y: y + 0.66, z: z0 + 0.37 })
        .boite(1.2, 0.01, 0.34, '#5a564e', { x: X + 6.6, y: y + 0.745, z: z0 + 0.37, trait: false })
        .boite(1.3, 0.58, 0.08, PO, { x: X + 6.6, y: y + 0.29, z: z0 + 0.56 });
      monde.mur(X + 5.95, z0 + 0.37, X + 7.25, z0 + 0.37, 0.4, yT - 1, Y_SOCLE);
      // l'escalier raide du coin nord-est, qui monte par la trappe du plafond
      const ex = MONTEE.x, eh = SALLE.plafond - y, ez0 = MONTEE.z - 0.6, ez1 = z0 + 0.6;
      for (const s of [-1, 1]) a.baton([ex + s * 0.55, y, ez0], [ex + s * 0.55, SALLE.plafond + 0.2, ez1], 0.07, '#4a3a2e', 4);
      for (let k = 1; k <= 11; k++) { const f = k / 12; a.boite(1.04, 0.05, 0.26, '#6a5240', { x: ex, y: y + eh * f, z: ez0 + (ez1 - ez0) * f }); }
      a.boite(1.4, 0.02, 1.2, P.noir, { x: ex, y: SALLE.plafond - 0.005, z: ez1 + 0.3, trait: false });
      monde.mur(ex, ez0, ex, ez1, 0.7, yT - 1, Y_SOCLE);
      // les lampes de papier, allumées (on est dans le noir du socle)
      for (const [lx, lz] of [[X - 7.1, Z - 5.5], [X - 2.4, Z + 5.9], [X + 2.4, Z + 5.9], [X + 6.5, Z]]) {
        a.boite(0.32, 0.06, 0.32, '#3e2f25', { x: lx, y: y + 0.03, z: lz })
          .boite(0.28, 0.55, 0.28, P.shoji, { x: lx, y: y + 0.36, z: lz, sorte: 'lampe' })
          .boite(0.32, 0.04, 0.32, '#3e2f25', { x: lx, y: y + 0.66, z: lz });
        lumieres.push({ x: lx, y: y + 0.4, z: lz, halo: 0.3, sol: y, r: 3.8, c: '#ffb860' });
        monde.cercle(lx, lz, 0.3, yT - 1, Y_SOCLE);
      }
      // (les murs de la salle arrêtent, à hauteur de la salle ; le plancher ; le plafond, pour la caméra)
      const mS = [yT - 1, Y_SOCLE];
      monde.mur(x0, z0, x1, z0, 0.2, ...mS); monde.mur(x0, z0, x0, z1, 0.2, ...mS); monde.mur(x1, z0, x1, z1, 0.2, ...mS);
      monde.mur(x0, z1, X - 1.4, z1, 0.2, ...mS); monde.mur(X + 1.4, z1, x1, z1, 0.2, ...mS);
      monde.surface(x0, x1, z0, z1, y, { sol: 'bois' });
      monde.surface(X - 1.4, X + 1.4, z1, zP, y, { sol: 'bois' });
      monde.toit(x0 - 0.5, x1 + 0.5, z0 - 0.5, z1 + 0.5, SALLE.plafond, Y_SOCLE + 0.1);
    }

    // (un étage où l'on entre, le deuxième : ses quatre murs en deux couches, le plâtre blanc dehors, l'enduit dedans,
    // chacune d'une pièce percée de vraies fenêtres, là où fenetres() les encadre ; son plancher de planches, son plafond.
    // Un bloc plein, avant : on ne voyait ni dehors ni dedans)
    const etageOuvert = (E, yMur) => {
      const w2 = E.W / 2, d2 = E.D / 2, f0 = Y_FEN2 - H_FEN2 / 2, f1 = Y_FEN2 + H_FEN2 / 2;
      const couche = (long, ep, c, L, pose, y0, y1, o = {}) => {
        const V = (u, v) => new THREE.Vector2(u, v), f = new THREE.Shape([V(-long / 2, y0), V(long / 2, y0), V(long / 2, y1), V(-long / 2, y1)]);
        for (const cf of centresFenetres(L)) f.holes.push(new THREE.Path([V(cf - 0.45, f0), V(cf - 0.45, f1), V(cf + 0.45, f1), V(cf + 0.45, f0)]));
        // (sans écart de peinture d'un triangle à l'autre : les longs triangles des trous faisaient des taches)
        am.piece(new THREE.ExtrudeGeometry(f, { depth: ep, bevelEnabled: false }), c, { nuance: 0, ...pose, ...o });
      };
      for (const s of [-1, 1]) {
        couche(E.W, 0.12, P.platre, E.W, { x: X, z: Z + s * d2 - (s > 0 ? 0.12 : 0) }, E.y0 - 0.1, yMur);
        couche(E.W - 0.24, 0.08, ENDUIT, E.W, { x: X, z: Z + s * (d2 - 0.12) - (s > 0 ? 0.08 : 0) }, Y_MILIEU - 0.1, E.y1, { trait: false });
        couche(E.D - 0.24, 0.12, P.platre, E.D, { x: X + s * w2 - (s > 0 ? 0.12 : 0), z: Z, ry: PI / 2 }, E.y0 - 0.1, yMur);
        couche(E.D - 0.4, 0.08, ENDUIT, E.D, { x: X + s * (w2 - 0.12) - (s > 0 ? 0.08 : 0), z: Z, ry: PI / 2 }, Y_MILIEU - 0.1, E.y1, { trait: false });
      }
      const nP = Math.round((E.D - 0.4) / 0.3), lP = (E.D - 0.4) / nP;
      am.piece(new THREE.BoxGeometry(E.W - 0.4, 0.1, E.D - 0.4, 1, 1, nP), P.bois2, { x: X, y: Y_MILIEU - 0.05, z: Z, teinte: (x, yy, z) => (Math.floor((z - Z + (E.D - 0.4) / 2) / lP) % 2 ? P.bois2 : P.bois) })
        .boite(E.W - 0.4, 0.12, E.D - 0.4, '#5a4a3c', { x: X, y: E.y1 - 0.06, z: Z });
    };
    /** Un bandeau tout autour d'un étage (W × D, dépassant de dep, haut de h) : une boîte pleine, ou quatre bandes (enBandes :
     * l'étage où l'on entre, la boîte traversait la pièce). */
    const ceinture = (W, D, dep, h, c, y, enBandes, o = {}) => {
      if (!enBandes) { a.boite(W + 2 * dep, h, D + 2 * dep, c, { x: X, y, z: Z, ...o }); return; }
      for (const s of [-1, 1]) {
        a.boite(W + 2 * dep, h, dep + 0.03, c, { x: X, y, z: Z + s * (D / 2 + dep / 2 - 0.015), ...o })
          .boite(dep + 0.03, h, D - 0.06, c, { x: X + s * (W / 2 + dep / 2 - 0.015), y, z: Z, ...o });
      }
    };

    // les cinq étages blancs, de plus en plus petits ; leurs fenêtres ; leurs toits gris aux bords blancs, les pignons
    // triangulaires (chidori-hafu), au premier étage un pignon courbe (kara-hafu) au-dessus de l'entrée ; le dernier étage,
    // ouvert (on y monte), son grand toit à pignons et ses deux shachihoko
    ETAGES.forEach((E, i) => {
      const suivant = ETAGES[i + 1];
      if (i < 4) {
        const lt = E.W + 3.0, ratio = (suivant.W + 0.3) / lt, dt = (suivant.D + 0.3) / ratio;
        const yMur = E.y1 + sousToit(lt, dt, E.toit, ratio, 1.5, 0.16, E.W, E.D);
        // (le deuxième étage, où l'on entre : des murs percés de vraies fenêtres, un peu plus grandes ; les bandeaux en
        // quatre bandes)
        const ouvert = i === 1;
        if (ouvert) etageOuvert(E, yMur);
        else a.boite(E.W, yMur - E.y0 + 0.1, E.D, P.platre, { x: X, y: (E.y0 - 0.1 + yMur) / 2, z: Z });
        fenetres(a, X, Z, ouvert ? Y_FEN2 : E.y0 + E.h * 0.56, E.W, E.D, { par: 1 / 2.2, cadre: true, ...(ouvert ? { h: H_FEN2, ouvert } : {}) });
        // (2026-10-25) un bandeau de plâtre en relief tout autour, au-dessus des fenêtres (nageshi)
        ceinture(E.W, E.D, 0.05, 0.1, P.platre, E.y0 + E.h * 0.56 + 0.47, ouvert, { trait: false });
        // le bas de chaque étage : une bande de bois sombre
        ceinture(E.W, E.D, 0.02, 0.22, '#3e3830', E.y0 + 0.11, ouvert);
        toitH(a, lt, dt, E.toit, ratio, { x: X, y: E.y1, z: Z, releve: 0.3, rangs: Math.round(lt * 1.4), epaisseur: 0.16, creux: 1.5, ...TUILES });
        // les pignons : au sud et au nord aux étages pairs, à l'est et à l'ouest aux autres
        // (sous le dernier étage, où l'on entre, les pignons s'arrêtent à son mur : profonds de 2,4 m, ils entraient dans la
        // pièce ; sous les autres, leur bout est caché dans l'étage du dessus)
        // (sous le deuxième étage aussi, depuis qu'on y entre ; 2026-10-25)
        const w = 3.8 - i * 0.45, hh = E.toit * 1.3, prof = i === 3 ? E.W / 2 + 0.55 - suivant.W / 2 : i === 0 ? E.D / 2 + 0.55 - suivant.D / 2 + 0.08 : 2.4;
        for (const s of [-1, 1]) {
          // (au premier toit, au sud, au-dessus de l'entrée : un pignon courbe, kara-hafu)
          if (i === 0 && s > 0) karahafu(a, X, E.y1 + 0.16, Z + E.D / 2 + 1.25, 4.6, 1.05, 2.6);
          else if (i % 2 === 0) hafu(a, X, Z + s * (E.D / 2 + 0.55), E.y1 + 0.18, s > 0 ? 0 : PI, w, hh, prof);
          else hafu(a, X + s * (E.W / 2 + 0.55), Z, E.y1 + 0.18, s > 0 ? PI / 2 : -PI / 2, w, hh, prof);
        }
        // (2026-10-25, « rajoute plus de détails au grand donjon ») d'autres pignons, comme les toits superposés du vrai
        // donjon : deux petits côte à côte à l'est et à l'ouest du premier et du troisième toit, un grand au sud et au nord
        // du deuxième, un petit au sud et au nord du quatrième (arrêté au mur du dernier étage) ; leur bout est caché
        // dans l'étage du dessus, et leur pointe reste sous ses fenêtres
        const autres = [{ ew: 3.0, w: 2.8, h: 1.15 }, { ns: true, w: 4.4, h: 1.3 }, { ew: 2.0, w: 2.2, h: 1.15 }, { ns: true, w: 2.4, h: 1.15 }][i];
        for (const s of [-1, 1]) {
          if (autres.ns) hafu(a, X, Z + s * (E.D / 2 + 0.55), E.y1 + 0.18, s > 0 ? 0 : PI, autres.w, E.toit * autres.h, i === 3 ? E.D / 2 + 0.55 - suivant.D / 2 : 2.4);
          else for (const dz of [-autres.ew, autres.ew]) hafu(a, X + s * (E.W / 2 + 0.55), Z + dz, E.y1 + 0.18, s > 0 ? PI / 2 : -PI / 2, autres.w, E.toit * autres.h, i === 0 ? E.W / 2 + 0.55 - suivant.W / 2 + 0.08 : 2.4);
        }
      } else {
        // le dernier étage : ses murs ouverts de fenêtres (on voit dedans, on voit dehors), leurs barreaux de bois ; le
        // plancher, le plafond ; le petit sanctuaire d'Osakabe (長壁神社) au mur nord ; la trappe de l'escalier
        const w2 = E.W / 2, d2 = E.D / 2, e = 0.2, y0 = E.y0, y1 = E.y1, f0 = y0 + 0.85, f1 = y0 + 1.85;
        const yMur = y1 + sousToit(E.W + 3.0, E.D + 3.0, E.toit, 0.38, 1.5, 0.18, E.W, E.D);
        const DEDANS = '#efe7d8';
        const face = (long, poseFn, ouvertures) => {
          // (une face : le bas plein, le haut plein, et entre les deux, des trumeaux entre les fenêtres)
          const bas = poseFn(0, y0 + (f0 - y0) / 2), haut = poseFn(0, f1 + (yMur - f1) / 2);
          a.boite(long, f0 - y0, e, P.platre, bas).boite(long, yMur - f1, e, P.platre, haut);
          let x = -long / 2;
          for (const [o0, o1] of [...ouvertures, [long / 2, long / 2]]) {
            if (o0 > x) a.boite(o0 - x, f1 - f0, e, P.platre, poseFn((x + o0) / 2, (f0 + f1) / 2));
            if (o1 > o0) for (let b = 1; b < 4; b++) a.boite(0.06, f1 - f0, 0.07, '#4a3a2e', { ...poseFn(o0 + ((o1 - o0) * b) / 4, (f0 + f1) / 2), trait: false });
            x = o1;
          }
        };
        const trous = (long, n) => Array.from({ length: n }, (_, k) => { const c = -long / 2 + ((k + 0.5) * long) / n; return [c - 0.55, c + 0.55]; });
        for (const s of [-1, 1]) {
          face(E.W, (lx, ly) => ({ x: X + lx, y: ly, z: Z + s * (d2 - e / 2) }), trous(E.W, 4));
          face(E.D - 2 * e, (lx, ly) => ({ x: X + s * (w2 - e / 2), y: ly, z: Z + lx, ry: PI / 2 }), trous(E.D - 2 * e, 3));
        }
        // le dedans : le plafond et ses poutres, le plancher, une plinthe
        a.boite(E.W - 2 * e, 0.12, E.D - 2 * e, '#5a4a3c', { x: X, y: y1 - 0.06, z: Z })
          .boite(E.W - 2 * e, 0.22, 0.24, '#3a2c22', { x: X, y: y1 - 0.23, z: Z })
          .piece(new THREE.BoxGeometry(E.W - 2 * e, 0.1, E.D - 2 * e, 1, 1, Math.round((E.D - 2 * e) / 0.38)), P.bois2, { x: X, y: Y_HAUT - 0.05, z: Z, teinte: (x, yy, z) => (Math.floor(z / 0.38 + 400) % 2 ? P.bois2 : P.bois) });
        // (2026-10-25) des poteaux de bois sombre aux coins et entre les fenêtres de l'est et de l'ouest, la poutre qui court
        // au-dessus des fenêtres, deux poutres de plus au plafond
        const PO = '#4a3a2e', xi = w2 - e - 0.09, zi = d2 - e - 0.09;
        for (const px of [-1, 1]) for (const pz of [-1, 1]) adH.boite(0.18, E.h - 0.12, 0.18, PO, { x: X + px * xi, y: y0 + (E.h - 0.12) / 2, z: Z + pz * zi });
        for (const px of [-1, 1]) for (const pz of [-1.03, 1.03]) adH.boite(0.16, E.h - 0.12, 0.14, PO, { x: X + px * (w2 - e - 0.07), y: y0 + (E.h - 0.12) / 2, z: Z + pz });
        for (const s of [-1, 1]) {
          adH.boite(E.W - 2 * e, 0.1, 0.06, PO, { x: X, y: f1 + 0.12, z: Z + s * (d2 - e - 0.03), trait: false })
            .boite(0.06, 0.1, E.D - 2 * e, PO, { x: X + s * (w2 - e - 0.03), y: f1 + 0.12, z: Z, trait: false })
            .boite(E.W - 2 * e, 0.2, 0.2, '#3a2c22', { x: X, y: y1 - 0.22, z: Z + s * 1.7 });
        }
        // le petit sanctuaire d'Osakabe (長壁神社), au mur nord (2026-10-25, « fais un peu mieux l'autel ») : l'estrade laquée ;
        // le sanctuaire de cyprès (hinoki) sur son socle, sa petite galerie, ses quatre piliers, ses portes laquées aux
        // ferrures dorées ; son toit de cuivre vert-de-gris qui descend loin devant (nagare-zukuri), un pignon de bois
        // dessous, le faîte, les chigi croisés et les katsuogi ; la corde sacrée et ses papiers, le miroir ; sur l'estrade,
        // les offrandes (les vases de sakaki, les flacons de saké, le riz et le sel, deux bougies) ; par terre, le tronc à
        // offrandes (賽銭箱) ; au-dessus, la cloche et sa corde tressée
        const zA = Z - d2 + e + 0.55, yF = Y_HAUT;
        {
          const HINOKI = '#d8b583', FONCE = '#a8804f', LAQUE = '#2e2420', CUIVRE = '#6f9e8a', CUIVRE2 = '#62917d';
          const yB = yF + 0.34, zC = zA - 0.12, yR = yB + 1.02, rangs = (px) => (Math.floor(px / 0.08 + 100) % 2 ? CUIVRE : CUIVRE2);
          adH.boite(2.3, 0.34, 1.16, LAQUE, { x: X, y: yF + 0.17, z: zA + 0.05 })
            .boite(2.3, 0.04, 0.02, P.or, { x: X, y: yB - 0.03, z: zA + 0.64, trait: false })
            .boite(1.14, 0.1, 0.91, FONCE, { x: X, y: yB + 0.05, z: zA + 0.015 })
            .boite(1.14, 0.03, 0.2, HINOKI, { x: X, y: yB + 0.115, z: zA + 0.37 })
            .boite(0.86, 0.6, 0.52, HINOKI, { x: X, y: yB + 0.4, z: zC });
          for (const sx of [-1, 1]) for (const sz of [-1, 1]) adH.boite(0.07, 0.66, 0.07, FONCE, { x: X + sx * 0.43, y: yB + 0.43, z: zC + sz * 0.26 });
          for (const sx of [-1, 1]) {
            adH.boite(0.36, 0.48, 0.02, LAQUE, { x: X + sx * 0.19, y: yB + 0.38, z: zC + 0.27 });
            for (const sy of [-1, 1]) adH.boite(0.3, 0.025, 0.012, P.or, { x: X + sx * 0.19, y: yB + 0.38 + sy * 0.2, z: zC + 0.285, trait: false });
            adH.cylindre(0.025, 0.025, 0.012, 8, P.or, { x: X + sx * 0.05, y: yB + 0.38, z: zC + 0.285, rx: PI / 2, trait: false });
          }
          adH.piece(new THREE.BoxGeometry(1.3, 0.05, 0.75, 8, 1, 1), CUIVRE, { x: X, y: yR - 0.2, z: zC + 0.3, rx: 0.588, teinte: rangs })
            .piece(new THREE.BoxGeometry(1.28, 0.05, 0.55, 8, 1, 1), CUIVRE, { x: X, y: yR - 0.17, z: zC - 0.21, rx: -0.68, teinte: rangs })
            .pignon(0.88, 0.3, 0.52, HINOKI, { x: X, y: yB + 0.7, z: zC })
            .boite(1.36, 0.07, 0.12, CUIVRE2, { x: X, y: yR + 0.01, z: zC });
          for (const sx of [-1, 1]) for (const sr of [-1, 1]) adH.boite(0.022, 0.34, 0.035, FONCE, { x: X + sx * 0.63, y: yR + 0.06, z: zC, rx: sr * 0.62 });
          for (const kx of [-0.3, 0, 0.3]) adH.cylindre(0.028, 0.028, 0.17, 7, FONCE, { x: X + kx, y: yR + 0.075, z: zC, rx: PI / 2 });
          adH.shimenawa([[X - 0.55, yB + 0.66, zC + 0.46], [X, yB + 0.59, zC + 0.5], [X + 0.55, yB + 0.66, zC + 0.46]], 0.02, [[X - 0.27, yB + 0.6, zC + 0.5], [X + 0.27, yB + 0.6, zC + 0.5]]);
          adH.boite(0.08, 0.1, 0.05, LAQUE, { x: X, y: yB + 0.18, z: zA + 0.38 })
            .cylindre(0.08, 0.08, 0.012, 16, P.or, { x: X, y: yB + 0.3, z: zA + 0.38, rx: PI / 2, trait: false });
          for (const sx of [-1, 1]) {
            adH.cylindre(0.045, 0.04, 0.16, 8, '#f4f2ea', { x: X + sx * 0.9, y: yB + 0.08, z: zA - 0.15 })
              .houppe(0.1, '#3f6a3a', { x: X + sx * 0.9, y: yB + 0.27, z: zA - 0.15, sy: 1.3, sorte: 'persistant' }, 0)
              .ovale(0.045, '#f4f2ea', { x: X + sx * 0.88, y: yB + 0.07, z: zA + 0.25, sy: 1.5 }, 8)
              .cylindre(0.016, 0.02, 0.07, 6, '#f4f2ea', { x: X + sx * 0.88, y: yB + 0.17, z: zA + 0.25 })
              .boite(0.04, 0.22, 0.04, '#f4efe2', { x: X + sx * 1.0, y: yB + 0.11, z: zA + 0.5, trait: false })
              .ovale(0.025, '#ffcf6a', { x: X + sx * 1.0, y: yB + 0.25, z: zA + 0.5, sy: 1.6, sorte: 'lampe', trait: false }, 5);
          }
          adH.boite(0.16, 0.08, 0.13, HINOKI, { x: X + 0.62, y: yB + 0.04, z: zA + 0.52 })
            .dome(0.035, '#f6f4ee', { x: X + 0.6, y: yB + 0.08, z: zA + 0.52 })
            .cone(0.022, 0.05, 6, '#ffffff', { x: X + 0.66, y: yB + 0.105, z: zA + 0.52 });
          // le tronc à offrandes, ses barreaux et ses coins dorés, « 賽銭 » sur le devant
          const zO = zA + 1.02, BOITE = '#5a3e2a';
          adH.boite(0.74, 0.42, 0.4, BOITE, { x: X, y: yF + 0.21, z: zO });
          for (let k = 0; k < 5; k++) adH.boite(0.7, 0.025, 0.04, FONCE, { x: X, y: yF + 0.432, z: zO - 0.14 + k * 0.07, trait: false });
          for (const sx of [-1, 1]) for (const sz of [-1, 1]) adH.boite(0.05, 0.05, 0.05, P.or, { x: X + sx * 0.35, y: yF + 0.405, z: zO + sz * 0.18, trait: false });
          ecrire({ x: X, y: yF, z: zO }, { texte: '賽銭', fond: BOITE, encre: '#e8d39a', x: 0, y: 0.22, z: 0.205, l: 0.32, h: 0.16 });
          // la cloche (鈴), pendue au plafond, et sa corde tressée de rouge, de blanc et de violet
          const zS = zA + 0.92;
          adH.baton([X, y1 - 0.12, zS], [X, yF + 2.28, zS], 0.012, '#3a3030', 4, { trait: false })
            .boule(0.075, P.or, { x: X, y: yF + 2.22, z: zS }, 1)
            .tube([[X, yF + 2.15, zS], [X + 0.01, yF + 1.7, zS + 0.02], [X - 0.01, yF + 1.25, zS + 0.03], [X, yF + 1.0, zS + 0.03]], 0.028, '#c8402c', { cotes: 6, pas: 16, teinte: (px, py) => ['#c8402c', '#f4efe6', '#6a3a8a'][Math.floor(py * 9 + 300) % 3] })
            .cone(0.045, 0.12, 6, '#c8402c', { x: X, y: yF + 0.95, z: zS + 0.03, rx: PI });
        }
        // (son nom sur une plaque de bois, au mur au-dessus)
        a.boite(0.4, 0.95, 0.04, '#3a2c22', { x: X, y: y0 + 2.25, z: zA - 0.525 });
        ecrire({ x: X, y: y0, z: zA }, { texte: '長壁神社', vertical: true, fond: '#3a2c22', encre: '#e8d39a', x: 0, y: 2.25, z: -0.5, l: 0.3, h: 0.84 });
        // la trappe de l'escalier, sa rambarde sur trois côtés
        const tx = DESCENTE.x + 0.4, tz = DESCENTE.z - 1.1;
        a.boite(1.2, 0.02, 1.5, P.noir, { x: tx, y: Y_HAUT + 0.006, z: tz, trait: false });
        for (const [x0b, z0b, x1b, z1b] of [[tx - 0.6, tz - 0.75, tx + 0.6, tz - 0.75], [tx + 0.6, tz - 0.75, tx + 0.6, tz + 0.75], [tx - 0.6, tz - 0.75, tx - 0.6, tz + 0.75]]) {
          a.baton([x0b, y0 + 0.9, z0b], [x1b, y0 + 0.9, z1b], 0.04, '#4a3a2e', 4);
          monde.mur(x0b, z0b, x1b, z1b, 0.12, Y_HAUT - 0.5, Y_HAUT + 2.6);
        }
        for (const [px, pz] of [[tx - 0.6, tz - 0.75], [tx + 0.6, tz - 0.75], [tx + 0.6, tz + 0.75], [tx - 0.6, tz + 0.75]]) a.boite(0.08, 0.9, 0.08, '#4a3a2e', { x: px, y: y0 + 0.45, z: pz });
        // (ce qui arrête au dernier étage ; le plancher, un étage ; pour la caméra : les murs, le plafond)
        const mH = [Y_HAUT - 0.5, Y_HAUT + 2.6];
        monde.mur(HAUT.x0, HAUT.z0, HAUT.x1, HAUT.z0, 0.15, ...mH); monde.mur(HAUT.x0, HAUT.z1, HAUT.x1, HAUT.z1, 0.15, ...mH);
        monde.mur(HAUT.x0, HAUT.z0, HAUT.x0, HAUT.z1, 0.15, ...mH); monde.mur(HAUT.x1, HAUT.z0, HAUT.x1, HAUT.z1, 0.15, ...mH);
        monde.mur(X - 1.0, zA + 0.37, X + 1.0, zA + 0.37, 1.08, ...mH);
        monde.surface(HAUT.x0, HAUT.x1, HAUT.z0, HAUT.z1, Y_HAUT, { sol: 'bois', etage: true });
        for (const s of [-1, 1]) {
          monde.bloc(X - w2 - 0.2, X + w2 + 0.2, Z + s * d2 - 0.2, Z + s * d2 + 0.2, y0 - 0.2, y1 + 0.2);
          monde.bloc(X + s * w2 - 0.2, X + s * w2 + 0.2, Z - d2, Z + d2, y0 - 0.2, y1 + 0.2);
        }
        monde.toit(X - w2, X + w2, Z - d2, Z + d2, y1 - 0.3, y1 + 4);
        // le grand toit : quatre pans, puis le pignon du haut (irimoya), son triangle blanc, l'arête, les shachihoko
        const lt = E.W + 3.0, dt = E.D + 3.0, yR = y1 + E.toit;
        toitH(a, lt, dt, E.toit, 0.38, { x: X, y: y1, z: Z, releve: 0.36, rangs: Math.round(lt * 1.4), epaisseur: 0.18, creux: 1.5, ...TUILES });
        const lg = lt * 0.46;
        a.pignon(lg, 1.3, dt * 0.36, P.platre, { x: X, y: yR - 0.08, z: Z });
        deuxPans(a, lg + 0.5, dt * 0.38 + 0.4, 1.38, yR - 0.14, { x: X, z: Z });
        for (const s of [-1, 1]) shachi(a, X + s * (lg / 2 + 0.05), yR + 1.2, Z, s, 1.0);
      }
    });

    // le deuxième étage (2026-10-25 : « rajoute la possibilité de monter un étage de plus… tu peux te baser sur cette
    // vidéo », What's Inside Himeji Castle, de la chaîne Anywhere But Home : son image du couloir des guerriers) : au
    // milieu, la grande pièce (moya), ses poteaux, ses linteaux et leurs clous de fer, ses cloisons de planches ; tout
    // autour, le couloir des guerriers (武者走り, musha-bashiri) : le plancher ciré, les râteliers d'armes (武具掛け) entre
    // les fenêtres et sur les cloisons, les volets des meurtrières (狭間) sous les fenêtres et leurs barreaux de bois, les
    // poutres courbes (ebi-kōryō) qui descendent vers le mur, le plafond en pente et ses chevrons ; les deux grands piliers ;
    // l'escalier qui monte, la trappe de celui qui arrive d'en bas ; de vieilles tuiles sur une estrade ; deux lampes
    {
      const E = ETAGE2, YM = Y_MILIEU, yP = E.y1 - 0.12, hM = yP - YM, w2 = E.W / 2 - 0.2, d2 = E.D / 2 - 0.2;
      const PO = '#4a3a2e', FONCE = '#3a2c22', NOIR_F = '#2a2624', BOIS_R = '#5a4636', CLAIR = '#6a5240';
      const f0 = Y_FEN2 - H_FEN2 / 2, f1 = Y_FEN2 + H_FEN2 / 2, yLin = YM + 1.85, yHautPente = yP - 0.02, yBasPente = YM + 2.41;
      const yPoutreIn = YM + 2.75, ySabliere = YM + 2.29;
      const mM = [YM - 0.5, YM + 2.6];
      // les quatre murs, vus du dedans (leur enduit) : un repère par mur, u le long du mur, d vers la pièce
      const MURS = [
        { R: repere(X, Z - d2, 0), long: 2 * w2, L: E.W },
        { R: repere(X, Z + d2, PI), long: 2 * w2, L: E.W },
        { R: repere(X + w2, Z, -PI / 2), long: 2 * d2, L: E.D },
        { R: repere(X - w2, Z, PI / 2), long: 2 * d2, L: E.D },
      ];
      // un râtelier d'armes (武具掛け) : une planche debout et ses chevilles de bois de chaque côté ; sur les murs du dehors,
      // un clou de fer (釘隠し) sur le linteau au-dessus
      const ratelier = (R, u, clou) => {
        adM.boite(0.1, 1.5, 0.04, BOIS_R, R(u, YM + 1.07, 0.021));
        for (let k = 0; k < 6; k++) for (const s of [-1, 1]) adM.boite(0.08, 0.045, 0.05, CLAIR, R(u + s * 0.09, YM + 0.45 + k * 0.24, 0.026, { trait: false }));
        if (clou) adM.cylindre(0.05, 0.05, 0.025, 6, NOIR_F, R(u, f1 + 0.12, 0.074, { rx: PI / 2, ordre: 'YXZ', trait: false }));
      };
      for (const { R, long, L } of MURS) {
        const cs = centresFenetres(L), ps = cs.slice(1).map((c, k) => (c + cs[k]) / 2);
        // la plinthe ; le linteau au-dessus des fenêtres ; la sablière, où viennent les poutres courbes
        // (le linteau, les cadres et les barreaux des fenêtres, et plus bas les pentes du plafond, se voient de dehors, par
        // les fenêtres : ils sont dans am, toujours dessinée ; sans eux, les fenêtres de cet étage paraissaient éclairées)
        adM.boite(long, 0.12, 0.03, FONCE, R(0, YM + 0.06, 0.016))
          .boite(long, 0.14, 0.1, FONCE, R(0, ySabliere, 0.051));
        am.boite(long, 0.12, 0.06, PO, R(0, f1 + 0.12, 0.031));
        for (const u of cs) {
          // la fenêtre, vue du dedans : son cadre de bois, l'appui, les barreaux dans l'épaisseur du mur
          for (const s of [-1, 1]) am.boite(0.06, H_FEN2, 0.03, PO, R(u + s * 0.48, Y_FEN2, 0.016));
          am.boite(1.02, 0.06, 0.03, PO, R(u, f1 + 0.03, 0.016))
            .boite(1.14, 0.04, 0.12, CLAIR, R(u, f0 - 0.02, 0.061));
          for (let b = 1; b < 5; b++) am.boite(0.035, H_FEN2, 0.035, BOIS_R, R(u - 0.45 + b * 0.18, Y_FEN2, -0.05, { trait: false }));
          for (const t of [1 / 3, 2 / 3]) am.boite(0.9, 0.03, 0.03, BOIS_R, R(u, f0 + t * H_FEN2, -0.05, { trait: false }));
          // sous la fenêtre, le volet de bois d'une meurtrière (狭間) : carré, rond ou triangulaire, et son bouton
          const yV = YM + 0.55, k = ((Math.round(u * 10 + L * 3) % 3) + 3) % 3;
          if (k === 0) adM.boite(0.22, 0.22, 0.03, BOIS_R, R(u, yV, 0.016));
          else if (k === 1) adM.cylindre(0.12, 0.12, 0.03, 14, BOIS_R, R(u, yV, 0.016, { rx: PI / 2, ordre: 'YXZ' }));
          else adM.cylindre(0.15, 0.15, 0.03, 3, BOIS_R, R(u, yV - 0.02, 0.016, { rx: -PI / 2, ordre: 'YXZ' }));
          adM.boite(0.04, 0.04, 0.03, NOIR_F, R(u, yV, 0.046, { trait: false }));
        }
        // entre les fenêtres, les râteliers
        for (const u of ps) ratelier(R, u, true);
      }
      // les poteaux des quatre coins
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) adM.boite(0.18, yBasPente - YM, 0.18, PO, { x: X + sx * (w2 - 0.09), y: (YM + yBasPente) / 2, z: Z + sz * (d2 - 0.09) });

      // la grande pièce : ses poteaux, leur linteau (et ses clous de fer), le petit mur de plâtre au-dessus, la poutre du
      // haut ; dans certaines travées, des cloisons de planches (et des râteliers côté couloir), dans les autres, le seuil
      const xs = [-5.6, -5.6 + 11.2 / 6, -5.6 + 22.4 / 6, 0, 5.6 - 22.4 / 6, 5.6 - 11.2 / 6, 5.6].map((v) => X + v);
      const zs = [-3.9, -1.95, 0, 1.95, 3.9].map((v) => Z + v);
      const poteaux = [...xs.flatMap((x) => [[x, MOYA.z0], [x, MOYA.z1]]), ...zs.slice(1, -1).flatMap((z) => [[X + MOYA.x0, z], [X + MOYA.x1, z]])];
      for (const [x, z] of poteaux) {
        adM.boite(0.2, hM, 0.2, PO, { x, y: YM + hM / 2, z });
        monde.cercle(x, z, 0.2, ...mM);
      }
      const yK = yHautPente - 0.2 - (yLin + 0.12);
      for (const s of [-1, 1]) {
        const zc = s < 0 ? MOYA.z0 : MOYA.z1, xc = X + (s < 0 ? MOYA.x0 : MOYA.x1);
        adM.boite(11.2, 0.12, 0.12, PO, { x: X, y: yLin + 0.06, z: zc })
          .boite(11.2, yK, 0.08, ENDUIT, { x: X, y: yLin + 0.12 + yK / 2, z: zc, trait: false })
          .boite(11.36, 0.2, 0.22, FONCE, { x: X, y: yP - 0.1, z: zc })
          .boite(0.12, 0.12, 7.8, PO, { x: xc, y: yLin + 0.06, z: Z })
          .boite(0.08, yK, 7.8, ENDUIT, { x: xc, y: yLin + 0.12 + yK / 2, z: Z, trait: false })
          .boite(0.22, 0.2, 7.6, FONCE, { x: xc, y: yP - 0.1, z: Z });
      }
      for (const [x, z] of poteaux) {
        const surX = Math.abs(z - MOYA.z0) < 0.01 || Math.abs(z - MOYA.z1) < 0.01;
        for (const s of [-1, 1]) {
          if (surX) adM.cylindre(0.045, 0.045, 0.02, 6, NOIR_F, { x, y: yLin + 0.06, z: z + s * 0.07, rx: PI / 2, trait: false });
          if (Math.abs(x - X - MOYA.x0) < 0.01 || Math.abs(x - X - MOYA.x1) < 0.01) adM.cylindre(0.045, 0.045, 0.02, 6, NOIR_F, { x: x + s * 0.07, y: yLin + 0.06, z, rz: PI / 2, trait: false });
        }
      }
      // les travées : [début, fin, le long de x ?, la ligne, le côté du couloir (+1/−1)] ; cloison (planches) ou seuil
      const travees = [];
      for (let k = 0; k < 6; k++) for (const s of [-1, 1]) travees.push({ a: xs[k], b: xs[k + 1], enX: true, ligne: s < 0 ? MOYA.z0 : MOYA.z1, s, cloison: k !== 2 && k !== 3 });
      for (let k = 0; k < 4; k++) for (const s of [-1, 1]) travees.push({ a: zs[k], b: zs[k + 1], enX: false, ligne: X + (s < 0 ? MOYA.x0 : MOYA.x1), s, cloison: k === 0 || k === 3 });
      for (const t of travees) {
        const long = t.b - t.a - 0.2, mil = (t.a + t.b) / 2;
        if (!t.cloison) {
          adM.boite(t.enX ? long : 0.1, 0.03, t.enX ? 0.1 : long, CLAIR, { x: t.enX ? mil : t.ligne, y: YM + 0.015, z: t.enX ? t.ligne : mil, trait: false });
          continue;
        }
        const n = Math.round(long / 0.22), l = long / n, planches = (x, yy, z) => (Math.floor(((t.enX ? x : z) - (mil - long / 2)) / l) % 2 ? '#5a4a3c' : '#514234');
        adM.piece(new THREE.BoxGeometry(t.enX ? long : 0.06, 1.85, t.enX ? 0.06 : long, t.enX ? n : 1, 1, t.enX ? 1 : n), '#5a4a3c', { x: t.enX ? mil : t.ligne, y: YM + 0.925, z: t.enX ? t.ligne : mil, teinte: planches });
        // (côté couloir : deux râteliers)
        const ry = t.enX ? (t.s < 0 ? PI : 0) : (t.s < 0 ? -PI / 2 : PI / 2);
        for (const du of [-0.42, 0.42]) {
          const c = mil + du;
          ratelier(repere(t.enX ? c : t.ligne + t.s * 0.03, t.enX ? t.ligne + t.s * 0.03 : c, ry), 0, false);
        }
        monde.mur(t.enX ? t.a : t.ligne, t.enX ? t.ligne : t.a, t.enX ? t.b : t.ligne, t.enX ? t.ligne : t.b, 0.2, ...mM);
        monde.bloc(t.enX ? t.a : t.ligne - 0.1, t.enX ? t.b : t.ligne + 0.1, t.enX ? t.ligne - 0.1 : t.a, t.enX ? t.ligne + 0.1 : t.b, YM - 0.2, yLin);
      }
      // des armes sur les râteliers des cloisons : trois lances côté nord, à l'ouest ; trois fusils côté sud, à l'est
      const LAITON = '#c9a24a', zLn = MOYA.z0 - 0.03 - 0.09;
      for (let k = 0; k < 3; k++) {
        const ys = YM + 1.17 + k * 0.24 + 0.045, xa = X - 5.45 + (k % 2) * 0.15, xb = xa + 3.4;
        adM.baton([xa, ys, zLn], [xb, ys, zLn], 0.022, '#3a2a22', 5)
          .cone(0.035, 0.3, 4, '#c9c6bc', { x: xb + 0.15, y: ys, z: zLn, rz: -PI / 2 })
          .boite(0.06, 0.05, 0.05, LAITON, { x: xb - 0.02, y: ys, z: zLn, trait: false });
      }
      const zFs = MOYA.z1 + 0.03 + 0.09, xF = (xs[5] + xs[6]) / 2 + 0.05;
      for (let k = 0; k < 3; k++) {
        const yy = YM + 0.93 + k * 0.24 + 0.05;
        adM.boite(1.15, 0.04, 0.04, '#3b3b40', { x: xF + 0.22, y: yy, z: zFs })
          .piece(new THREE.BoxGeometry(0.55, 0.08, 0.05, 2, 1, 1), '#7a4a2a', { x: xF - 0.6, y: yy - 0.015, z: zFs, deformer: (px, py, pz) => [px, py + (px < 0 ? (py < 0 ? -0.055 : -0.03) : 0), pz] })
          .boite(0.09, 0.035, 0.055, LAITON, { x: xF - 0.3, y: yy + 0.005, z: zFs + 0.004, trait: false });
        for (const xb of [xF + 0.1, xF + 0.55]) adM.boite(0.02, 0.05, 0.05, LAITON, { x: xb, y: yy, z: zFs, trait: false });
      }
      // la plaque « 武具掛け », sur la cloison du sud, entre ses deux râteliers (comme dans la vidéo)
      {
        const xP = (xs[4] + xs[5]) / 2, zP = MOYA.z1 + 0.03 + 0.012;
        adM.boite(0.11, 0.36, 0.02, NOIR_F, { x: xP, y: YM + 1.15, z: zP });
        ecrire({ x: xP, y: YM, z: zP }, { texte: '武具掛け', vertical: true, fond: NOIR_F, encre: '#f2eee4', x: 0, y: 1.15, z: 0.012, l: 0.09, h: 0.33 });
      }
      // le plafond du couloir : en pente, du haut des poteaux de la pièce jusqu'au mur ; ses chevrons ; les poutres courbes
      // (ebi-kōryō) qui vont de chaque poteau au mur ; aux coins, une arêtière
      const course = 1.9, montee = yHautPente - yBasPente, aP = Math.atan2(montee, course), lP = Math.hypot(course, montee) + 0.04;
      const yMilPente = (yHautPente + yBasPente) / 2 + 0.02;
      for (const s of [-1, 1]) {
        const zc = Z + s * (3.9 + course / 2), xc = X + s * (5.6 + course / 2);
        am.boite(2 * w2, 0.04, lP, '#6a5444', { x: X, y: yMilPente, z: zc, rx: s * aP })
          .boite(lP, 0.04, 2 * d2, '#6a5444', { x: xc, y: yMilPente, z: Z, rz: -s * aP });
        for (let x = -5.4; x <= 5.41; x += 0.45) adM.boite(0.07, 0.08, lP - 0.04, BOIS_R, { x: X + x, y: yMilPente - 0.065, z: zc, rx: s * aP });
        for (let z = -3.6; z <= 3.61; z += 0.45) adM.boite(lP - 0.04, 0.08, 0.07, BOIS_R, { x: xc, y: yMilPente - 0.065, z: Z + z, rz: -s * aP });
        for (const sz of [-1, 1]) adM.baton([X + s * 5.6, yHautPente - 0.12, Z + sz * 3.9], [X + s * (w2 - 0.06), yBasPente - 0.1, Z + sz * (d2 - 0.06)], 0.07, FONCE, 4);
      }
      const drop = yPoutreIn - ySabliere, courbe = (px, py, pz) => [px, py - drop * (px / course + 0.5) ** 2, pz];
      for (const [x, z] of poteaux) {
        const vers = [];
        if (Math.abs(z - MOYA.z0) < 0.01) vers.push(PI / 2);
        if (Math.abs(z - MOYA.z1) < 0.01) vers.push(-PI / 2);
        if (Math.abs(x - X - MOYA.x1) < 0.01) vers.push(0);
        if (Math.abs(x - X - MOYA.x0) < 0.01) vers.push(PI);
        for (const ry of vers) {
          const dx = Math.cos(ry), dz = -Math.sin(ry);
          adM.piece(new THREE.BoxGeometry(course, 0.2, 0.14, 8, 1, 1), FONCE, { x: x + dx * course / 2, y: yPoutreIn, z: z + dz * course / 2, ry, deformer: courbe });
        }
      }
      // le plafond de la grande pièce : deux grosses poutres, une poutre en travers
      for (const sz of [-1.3, 1.3]) adM.boite(11.2, 0.3, 0.26, FONCE, { x: X, y: yP - 0.15, z: Z + sz });
      adM.boite(0.22, 0.24, 7.8, FONCE, { x: X, y: yP - 0.12, z: Z });
      // les deux grands piliers, qui traversent l'étage (ils montent du sous-sol), leurs bagues de fer
      for (const s of [-1, 1]) {
        adM.cylindre(0.46, 0.48, hM + 0.05, 14, '#6a5240', { x: X + s * 2.6, y: YM + (hM + 0.05) / 2, z: Z });
        for (const yy of [0.5, 2.5]) adM.cylindre(0.5, 0.5, 0.1, 14, NOIR_F, { x: X + s * 2.6, y: YM + yy, z: Z, trait: false });
        monde.cercle(X + s * 2.6, Z, 0.7, ...mM);
      }
      // l'escalier qui monte (raide, vers le nord, jusqu'à la trappe du plafond) : ses limons, ses marches, ses rampes
      {
        const ex = MONTEE2.x, ez0 = MONTEE2.z - 1.0, ez1 = ez0 - 1.9;
        for (const s of [-1, 1]) {
          adM.baton([ex + s * 0.55, YM, ez0], [ex + s * 0.55, yP + 0.2, ez1 - 0.1], 0.07, '#4a3a2e', 4)
            .baton([ex + s * 0.64, YM + 0.85, ez0 + 0.05], [ex + s * 0.64, yP - 0.03, ez0 - 1.9 * (1 - 0.85 / hM) + 0.05], 0.035, '#4a3a2e', 4)
            .boite(0.07, 0.9, 0.07, '#4a3a2e', { x: ex + s * 0.64, y: YM + 0.45, z: ez0 + 0.05 });
        }
        for (let k = 1; k <= 11; k++) { const f = k / 12; adM.boite(1.04, 0.05, 0.26, '#6a5240', { x: ex, y: YM + hM * f, z: ez0 + (ez1 - ez0) * f }); }
        adM.boite(1.2, 0.02, 1.0, P.noir, { x: ex, y: yP - 0.011, z: ez1 - 0.25, trait: false });
        monde.mur(ex, ez0, ex, ez1, 0.75, ...mM);
        // la plaque « 二階 » et le panneau « 順路 » (le sens de la visite), sur le poteau à côté
        const xq = X + MOYA.x1 - 0.1 - 0.011;
        adM.boite(0.02, 0.42, 0.14, '#3a2c22', { x: xq, y: YM + 1.55, z: Z });
        ecrire({ x: xq, y: YM, z: Z, ry: -PI / 2 }, { texte: '二階', vertical: true, fond: '#3a2c22', encre: '#e8d39a', x: 0, y: 1.55, z: 0.012, l: 0.11, h: 0.36 });
        adM.boite(0.02, 0.18, 0.4, '#f4f0e6', { x: xq, y: YM + 1.95, z: Z - 1.95 });
        ecrire({ x: xq, y: YM, z: Z - 1.95, ry: -PI / 2 }, { texte: '順路 →', fond: '#f4f0e6', encre: '#2a2624', x: 0, y: 1.95, z: 0.012, l: 0.36, h: 0.15 });
      }
      // la trappe de l'escalier qui arrive d'en bas, sa rambarde sur trois côtés (on descend par le nord)
      {
        const tx = TRAPPE2.x, tz0 = TRAPPE2.z + 0.4, tz1 = tz0 + 1.4;
        adM.boite(1.0, 0.02, 1.4, P.noir, { x: tx, y: YM + 0.006, z: (tz0 + tz1) / 2, trait: false });
        for (const [x0b, z0b, x1b, z1b] of [[tx - 0.5, tz0, tx - 0.5, tz1], [tx + 0.5, tz0, tx + 0.5, tz1], [tx - 0.5, tz1, tx + 0.5, tz1]]) adM.baton([x0b, YM + 0.9, z0b], [x1b, YM + 0.9, z1b], 0.04, '#4a3a2e', 4);
        for (const [px, pz] of [[tx - 0.5, tz0], [tx + 0.5, tz0], [tx + 0.5, tz1], [tx - 0.5, tz1]]) adM.boite(0.08, 0.9, 0.08, '#4a3a2e', { x: px, y: YM + 0.45, z: pz });
        monde.mur(tx, tz0 + 0.3, tx, tz1 - 0.3, 0.55, ...mM);
      }
      // l'estrade aux vieilles tuiles : un oni-gawara (la tuile à tête de démon), deux tuiles rondes à blason, une étiquette
      {
        const zE = Z - 1.0, TUILE = '#6a6e72', TUILE2 = '#7a7e82';
        adM.boite(1.6, 0.42, 0.6, '#5a4030', { x: X, y: YM + 0.21, z: zE })
          .boite(1.56, 0.02, 0.56, '#a8322a', { x: X, y: YM + 0.43, z: zE, trait: false });
        // (l'oni-gawara : un bloc, son visage rond, ses cornes)
        adM.boite(0.4, 0.34, 0.12, TUILE, { x: X - 0.45, y: YM + 0.61, z: zE })
          .cylindre(0.11, 0.11, 0.04, 12, TUILE2, { x: X - 0.45, y: YM + 0.62, z: zE + 0.07, rx: PI / 2 });
        for (const s of [-1, 1]) adM.cone(0.05, 0.14, 5, TUILE, { x: X - 0.45 + s * 0.15, y: YM + 0.84, z: zE, rz: -s * 0.4 });
        for (const xt of [0.15, 0.55]) {
          adM.boite(0.06, 0.1, 0.18, '#3a2c22', { x: X + xt, y: YM + 0.49, z: zE })
            .cylindre(0.13, 0.13, 0.04, 16, TUILE, { x: X + xt, y: YM + 0.67, z: zE + 0.02, rx: PI / 2 })
            .cylindre(0.08, 0.08, 0.02, 12, TUILE2, { x: X + xt, y: YM + 0.67, z: zE + 0.05, rx: PI / 2, trait: false });
          for (let k = 0; k < 3; k++) { const t = (k * 2 * PI) / 3; adM.cylindre(0.025, 0.025, 0.012, 8, TUILE, { x: X + xt + 0.045 * Math.sin(t), y: YM + 0.67 + 0.045 * Math.cos(t), z: zE + 0.065, rx: PI / 2, trait: false }); }
        }
        adM.boite(0.42, 0.13, 0.02, '#f4efe2', { x: X, y: YM + 0.24, z: zE + 0.311 });
        ecrire({ x: X, y: YM, z: zE + 0.311 }, { texte: '姫路城の瓦', fond: '#f4efe2', encre: '#2a2624', x: 0, y: 0.24, z: 0.012, l: 0.38, h: 0.1 });
        monde.mur(X - 0.8, zE, X + 0.8, zE, 0.45, ...mM);
      }
      // des lampes de papier : deux dans les coins du couloir, deux dans la grande pièce (la nuit, elle était toute noire)
      for (const [lx, lz] of [[X - w2 + 0.6, Z - d2 + 0.55], [X + w2 - 0.6, Z + d2 - 0.55], [X - 4.6, Z - 3.2], [X + 4.8, Z + 3.2]]) {
        adM.boite(0.32, 0.06, 0.32, '#3e2f25', { x: lx, y: YM + 0.03, z: lz })
          .boite(0.28, 0.55, 0.28, P.shoji, { x: lx, y: YM + 0.36, z: lz, sorte: 'lampe' })
          .boite(0.32, 0.04, 0.32, '#3e2f25', { x: lx, y: YM + 0.66, z: lz });
        lumieres.push({ x: lx, y: YM + 0.4, z: lz, halo: 0.3, sol: YM, r: 3.8, c: '#ffb860' });
        monde.cercle(lx, lz, 0.3, ...mM);
      }
      // (ce qui arrête : les murs, le plancher, un étage ; pour la caméra : les murs, le plafond)
      monde.mur(MILIEU.x0, MILIEU.z0, MILIEU.x1, MILIEU.z0, 0.3, ...mM); monde.mur(MILIEU.x0, MILIEU.z1, MILIEU.x1, MILIEU.z1, 0.3, ...mM);
      monde.mur(MILIEU.x0, MILIEU.z0, MILIEU.x0, MILIEU.z1, 0.3, ...mM); monde.mur(MILIEU.x1, MILIEU.z0, MILIEU.x1, MILIEU.z1, 0.3, ...mM);
      monde.surface(MILIEU.x0, MILIEU.x1, MILIEU.z0, MILIEU.z1, YM, { sol: 'bois', etage: true });
      const W2 = E.W / 2, D2 = E.D / 2;
      for (const s of [-1, 1]) {
        monde.bloc(X - W2 - 0.2, X + W2 + 0.2, Z + s * D2 - 0.2, Z + s * D2 + 0.2, E.y0 - 0.2, E.y1 + 0.2);
        monde.bloc(X + s * W2 - 0.2, X + s * W2 + 0.2, Z - D2, Z + D2, E.y0 - 0.2, E.y1 + 0.2);
      }
      monde.toit(X - W2, X + W2, Z - D2, Z + D2, yBasPente - 0.15, E.y1 + 1.2);
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
    poser(am.fin(0, peinture), 0, 0, { y: 0, avant: true });
    // (chaque étage son décor du dedans : la caméra dans le donjon, ou à moins de 9 m de lui, et à sa hauteur)
    const R9 = [X - DONJON.W / 2 - 9, X + DONJON.W / 2 + 9, Z - DONJON.D / 2 - 9, Z + DONJON.D / 2 + 9];
    poser(ad.fin(0, peinture), 0, 0, { y: 0, dedans: [...R9, yT - 3, Y_SOCLE + 1] });
    poser(adM.fin(0, peinture), 0, 0, { y: 0, dedans: [MILIEU.x0 - 0.5, MILIEU.x1 + 0.5, MILIEU.z0 - 0.5, MILIEU.z1 + 0.5, ETAGE2.y0 - 0.6, ETAGE2.y1 + 1.5] });
    poser(adH.fin(0, peinture), 0, 0, { y: 0, dedans: [...R9, ETAGES[4].y0 - 1, ETAGES[4].y1 + 8] });
    // (le donjon, au-dessus du socle et jusqu'au dernier étage : la caméra n'y entre pas, sauf au deuxième étage ; le
    // deuxième et le dernier ont leurs murs)
    monde.bloc(X - ETAGES[0].W / 2, X + ETAGES[0].W / 2, Z - ETAGES[0].D / 2, Z + ETAGES[0].D / 2, Y_SOCLE, ETAGE2.y0 - 0.05);
    monde.bloc(X - ETAGES[0].W / 2, X + ETAGES[0].W / 2, Z - ETAGES[0].D / 2, Z + ETAGES[0].D / 2, ETAGE2.y1 + 0.1, ETAGES[4].y0 - 0.15);
  }

  // ---------------------------------------------------------------- Le petit donjon, son couloir ; la Nishi-no-maru
  {
    const a = atelier(), X = PETIT.x, Z = PETIT.z, yT = T3.h, yS = yT + PETIT.h;
    const S = { x0: X - PETIT.W / 2 + 1.2, x1: X + PETIT.W / 2 - 1.2, z0: Z - PETIT.D / 2 + 1.2, z1: Z + PETIT.D / 2 - 1.2, h: yS, mur: PETIT.h };
    rempart(a, S, { d: 1.2, yPied: yT - 0.5 });
    a.boite(S.x1 - S.x0, 0.2, S.z1 - S.z0, P.pierreFonce, { x: X, y: yS - 0.1, z: Z });
    const E0 = { W: S.x1 - S.x0 - 0.6, D: S.z1 - S.z0 - 0.6, h: 3.0 }, E1 = { W: E0.W * 0.72, D: E0.D * 0.72, h: 2.6 };
    let lt = E0.W + 2.4, ratio = (E1.W + 0.3) / lt;
    const h0 = E0.h + sousToit(lt, (E1.D + 0.3) / ratio, 1.3, ratio, 1.7, 0.13, E0.W, E0.D);
    a.boite(E0.W, h0, E0.D, P.platre, { x: X, y: yS + h0 / 2, z: Z });
    fenetres(a, X, Z, yS + E0.h * 0.56, E0.W, E0.D, { par: 1 / 2.2 });
    toitH(a, lt, (E1.D + 0.3) / ratio, 1.3, ratio, { x: X, y: yS + E0.h, z: Z, releve: 0.32, rangs: 16, epaisseur: 0.13, ...TUILES });
    hafu(a, X, Z + E0.D / 2 + 0.5, yS + E0.h + 0.15, 0, 2.6, 1.6, 2.0);
    const y1 = yS + E0.h + 1.2;
    const h1 = E1.h + sousToit(E1.W + 2.4, E1.D + 2.4, 1.5, 0.36, 1.7, 0.13, E1.W, E1.D);
    a.boite(E1.W, h1, E1.D, P.platre, { x: X, y: y1 + h1 / 2, z: Z });
    fenetres(a, X, Z, y1 + E1.h * 0.56, E1.W, E1.D, { par: 1 / 2.2 });
    lt = E1.W + 2.4;
    toitH(a, lt, E1.D + 2.4, 1.5, 0.36, { x: X, y: y1 + E1.h, z: Z, releve: 0.36, rangs: 12, epaisseur: 0.13, ...TUILES });
    const yR = y1 + E1.h + 1.5, lg = lt * 0.44;
    a.pignon(lg, 0.95, (E1.D + 2.4) * 0.34, P.platre, { x: X, y: yR - 0.06, z: Z });
    deuxPans(a, lg + 0.4, (E1.D + 2.4) * 0.36 + 0.3, 1.0, yR - 0.1, { x: X, z: Z });
    for (const s of [-1, 1]) shachi(a, X + s * (lg / 2 + 0.05), yR + 0.86, Z, s, 0.7);
    // le couloir (渡櫓) qui relie le petit donjon au grand : son mur de pierre, l'étage blanc, ses fenêtres, son toit
    const C = { x0: S.x1, x1: DONJON.x - DONJON.W / 2 + DONJON.retrait, z0: Z - 1.6, z1: Z + 1.6, h: yS, mur: PETIT.h };
    rempart(a, C, { cotes: ['sud', 'nord'], d: 1.2, yPied: yT - 0.5, yHaut: yS + 0.025 });
    a.boite(C.x1 - C.x0, 0.2, C.z1 - C.z0, P.pierreFonce, { x: (C.x0 + C.x1) / 2, y: yS - 0.1, z: Z })
      .boite(C.x1 - C.x0, 2.8, C.z1 - C.z0 - 0.4, P.platre, { x: (C.x0 + C.x1) / 2, y: yS + 1.4, z: Z });
    for (let k = 0; k < 3; k++) for (const s of [-1, 1]) {
      const wx = C.x0 + 1.4 + k * ((C.x1 - C.x0 - 2.8) / 2);
      a.boite(0.8, 0.6, 0.04, P.noir, { x: wx, y: yS + 1.6, z: Z + s * ((C.z1 - C.z0 - 0.4) / 2 + 0.02), trait: false });
    }
    deuxPans(a, C.x1 - C.x0 + 0.6, C.z1 - C.z0 + 1.6, 1.2, yS + 2.8, { x: (C.x0 + C.x1) / 2, z: Z });
    a.pignon(C.x1 - C.x0, (1.2 * (C.z1 - C.z0 - 0.4)) / (C.z1 - C.z0 + 1.6) - 0.07, C.z1 - C.z0 - 0.4, P.platre, { x: (C.x0 + C.x1) / 2, y: yS + 2.8, z: Z });
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
    // (des blocs à leur forme, au pied de leurs murs de pierre : le segment épais d'avant, arrondi de 4,4 m, dépassait de
    // l'ouest du petit donjon jusqu'au mur de la terrasse, et l'on ne pouvait pas faire le tour du donjon ; 2026-10-25)
    monde.surface(S.x0 - 1.5, S.x1 + 1.5, S.z0 - 1.5, S.z1 + 1.5, yS + 10, { plein: true });
    monde.surface(C.x0, C.x1 + 0.5, C.z0 - 1.5, C.z1 + 1.5, yS + 5, { plein: true });
    monde.bloc(X - PETIT.W / 2, X + PETIT.W / 2, Z - PETIT.D / 2, Z + PETIT.D / 2, yT - 1, yS + 10);
    monde.bloc(C.x0, C.x1, C.z0 - 1.2, C.z1 + 1.2, yT - 1, yS + 4.2);
  }
  {
    // la Nishi-no-maru : le long couloir (百間廊下) sur son mur, au bord de l'esplanade ; au sud, la tour de la princesse
    // Sen (化粧櫓)
    const a = atelier(), N = NISHI, x = N.x1 - 1.9, l = 3.0;
    for (let z = N.z0 + 2; z < N.z1 - 7.9; z += 13.2) {
      const zc = z + 6.5;
      a.boite(l, 2.7, 13.2, P.platre, { x, y: N.h + 1.35, z: zc });
      for (let k = 0; k < 5; k++) a.boite(0.04, 0.6, 1.2, P.noir, { x: x + l / 2 + 0.02, y: N.h + 1.55, z: zc - 5.2 + k * 2.6, trait: false });
      deuxPans(a, 13.08, l + 1.4, 1.1, N.h + 2.7, { x, z: zc, ry: PI / 2 });
      BATIS.push([x, zc - 6.6, x, zc + 6.6, l / 2 + 0.8, N.h, N.h + 4]);
      a.pignon(13.2, (1.1 * l) / (l + 1.4) - 0.07, l, P.platre, { x, y: N.h + 2.7, z: zc, ry: PI / 2 });
    }
    yagura(a, N.x1 - 4.2, N.z1 - 3.5, N.h, 6.4, 5.4);
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- La colline, les parcs, la ville
  // (en morceaux : huit secteurs autour du château, et l'anneau lointain, sans trait d'encre ; la caméra ne dessine que
  // ceux qu'elle voit)
  const SECTEURS = new Map();
  const secteur = (x, z) => {
    const s8 = Math.floor(((Math.atan2(x, z + 25) + PI) / (2 * PI)) * 8) % 8, k = Math.hypot(x, z + 25) > 140 ? 8 + (s8 >> 1) : s8;
    if (!SECTEURS.has(k)) SECTEURS.set(k, atelier());
    return SECTEURS.get(k);
  };
  {
    const tire = (() => { let s = 1609; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();
    /** Hors du château : ni sur une terrasse ni contre ses murs, ni sur l'esplanade, ni dans les douves, ni sur l'avenue. */
    const libre = (x, z, m = 2) => {
      for (const T of TERRASSES) if (ecart(T, x, z) < 1.4 + m) return false;
      if (x > ESPLANADE.x0 - m && x < ESPLANADE.x1 + m && z > ESPLANADE.z0 - m && z < DOUVES.z1 + 3 + m) return false;
      if (z > DOUVES.z0 - m - 3 && z < DOUVES.z1 + 4 + m) return false;
      if (Math.abs(x) < 14 && z > 30) return false;
      return true;
    };
    /** Le sol le plus bas sous un tronc. */
    const pied = (x, z, r) => Math.min(terrain(x, z), terrain(x + r, z), terrain(x - r, z), terrain(x, z + r), terrain(x, z - r));
    // les arbres : sur la colline (des camphriers ronds, des pins, quelques cèdres) et dans les parcs autour du château
    /** La distance d'un point au segment (ax, az) → (bx, bz). */
    const auSegment = (x, z, ax, az, bx, bz) => {
      const dx = bx - ax, dz = bz - az, f = Math.min(1, Math.max(0, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
      return Math.hypot(x - ax - f * dx, z - az - f * dz);
    };
    /** La couronne d'un arbre (son rayon, ses hauteurs, selon sa sorte) entre-t-elle dans un mur ou un bâtiment ? */
    const gene = (x, z, y, h, sorte) => {
      const [k, b0, b1] = sorte === 'cedre' ? [0.26, 0.3, 1.25] : sorte === 'pin' ? [0.46, 0.25, 1.0] : [0.66, 0.38, 1.05];
      return BATIS.some(([ax, az, bx, bz, l, bas, haut]) => y + b1 * h > bas && y + b0 * h < haut && auSegment(x, z, ax, az, bx, bz) < k * h + l);
    };
    const arbre = (x, z, h, sorte) => {
      // (près d'un mur blanc, un arbre plus petit, ou pas d'arbre : leur couronne passait au travers des murs ; 2026-10-25)
      const y = terrain(x, z);
      while (h > 4.6 && gene(x, z, y, h, sorte)) h *= 0.88;
      if (gene(x, z, y, h, sorte)) return;
      // (loin de là où l'on marche, plus simple : trois touffes, trois cônes)
      const dW = Math.min(ecart(ESPLANADE, x, z), ecart(T1, x, z), ecart(T2, x, z), ecart(T3, x, z));
      const a = secteur(x, z), loin = dW > 22, g = hasard(x * 0.7, z * 0.9);
      if (sorte === 'cedre') {
        if (!loin) a.sugi(x, z, h, { y, bas: pied(x, z, 0.4) - 0.25, rot: x + z, vert: P.cedre, vertFonce: P.cedreFonce, tronc: '#5e4030' });
        else for (const [rr, hh, k] of [[0.24, 0.42, 0.42], [0.18, 0.36, 0.64], [0.11, 0.3, 0.86]]) a.cone(h * rr, h * hh, 6, k > 0.5 ? P.cedre : P.cedreFonce, { x, y: y + h * k - h * hh * 0.25, z, sorte: 'conifere' });
      } else if (sorte === 'pin') {
        a.pinNuages(x, z, h * 2.1, g < 0.5 ? 1 : -1, { y });
      } else {
        const couleurs = g < 0.4 ? ['#5f8f45', '#6b9a4c'] : g < 0.8 ? ['#557f3f', '#62904a'] : ['#6f9a4c', '#7aa654'];
        if (!loin) a.arbreTouffu(x, z, h, couleurs, { y, bas: pied(x, z, 0.3) - 0.2, sorte: 'persistant', graine: g, tronc: '#6a5040', large: 1.25 });
        else {
          a.baton([x, y - 0.2, z], [x, y + h * 0.5, z], 0.035 * h, '#6a5040', 5);
          for (const [dx, dy, dz, rr] of [[0, 0.72, 0, 0.36], [-0.24, 0.58, 0.1, 0.28], [0.24, 0.6, -0.08, 0.28]]) a.houppe(rr * h, couleurs[0], { x: x + dx * h, y: y + dy * h, z: z + dz * h, sy: 0.85, sorte: 'persistant', graine: g }, 0);
        }
      }
    };
    for (let x = -150; x <= 150; x += 5.5) {
      for (let z = -150; z <= 22; z += 5.5) {
        const px = x + (tire() - 0.5) * 4, pz = z + (tire() - 0.5) * 4, t = tire(), y = terrain(px, pz);
        if (!libre(px, pz) || y > 40) continue;
        const colline = y > 0.6, r = Math.hypot(px, pz + 25);
        if (!colline && (r > 120 || t > 0.4)) continue;
        if (colline && t > 0.85) continue;
        const s = tire();
        arbre(px, pz, 6 + tire() * 6, colline ? (s < 0.18 ? 'cedre' : s < 0.3 ? 'pin' : 'feuillu') : s < 0.12 ? 'pin' : 'feuillu');
      }
    }
    // la ville : des immeubles dans des îlots entre des rues ; l'avenue (大手前通り), large, qui file vers la gare, au sud.
    // (2026-10-25, « fais un peu mieux les bâtiments ») Trois sortes : des bureaux (leurs rangées de fenêtres entre des
    // piliers ; au rez-de-chaussée une vitrine et son enseigne ; parfois une enseigne verticale à l'angle), des immeubles
    // d'habitation (un balcon par étage, son garde-corps clair) et, parmi les plus hauts, des tours de verre (un mur-rideau,
    // ses lignes d'étages et ses meneaux) ; sur le toit, l'acrotère, la cage d'ascenseur, parfois un réservoir d'eau et des
    // climatiseurs. Seules les faces tournées vers le château (on ne voit qu'elles) ont leurs fenêtres et leurs détails. Les
    // fenêtres qui s'allument la nuit (P.vitreVille) et les autres ont presque la même teinte : le jour, elles faisaient
    // des rayures claires et sombres
    const BETON = ['#d8cbb4', '#bdb8ae', '#e6e2d8', '#c9b49a', '#a9b4b8', '#d2c6b0', '#b8b0a2', '#c8ad92', '#e0dacb'];
    const ENSEIGNES = ['#c8402c', '#2f6fb0', '#e8b941', '#3d8a5a', '#f4f0e6', '#d86a2a', '#7a3a8a'];
    const VITRES = ['#a9b7bf', '#adb9b9', '#a6b2bd'], MENEAU = '#6c7780';
    const nuancer = (h, k) => '#' + [1, 3, 5].map((i) => Math.round(Math.min(255, parseInt(h.slice(i, i + 2), 16) * k)).toString(16).padStart(2, '0')).join('');
    const immeuble = (x, z, w, d, H, ry) => {
      const a = secteur(x, z), pos = [], couleurs = [], g = hasard(x * 0.37 + 3, z * 0.53 - 1);
      const c = BETON[Math.floor(hasard(x, z) * BETON.length)], cf = nuancer(c, 0.86), ct = hasard(x + 11, z) < 0.25 ? '#7d8a74' : '#8e8a82';
      const sorte = H > 24 && g < 0.42 ? 'verre' : g > 0.62 ? 'habitation' : 'bureau';
      const vitre = VITRES[Math.floor(hasard(z, x) * VITRES.length)], enseigne = ENSEIGNES[Math.floor(hasard(x + 7, z) * ENSEIGNES.length)];
      const cr = Math.cos(ry), sr = Math.sin(ry);
      const R = (lx, ly, lz) => [x + lx * cr + lz * sr, ly, z - lx * sr + lz * cr];
      const y0 = Math.min(terrain(x - w / 2, z - d / 2), terrain(x + w / 2, z + d / 2), terrain(x, z)) - 0.4, yS = y0 + 0.4;
      const quad = (A, B, C, D, col, n) => {
        const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2];
        const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        if (nx * n[0] + ny * n[1] + nz * n[2] < 0) pos.push(...A, ...C, ...B, ...A, ...D, ...C); else pos.push(...A, ...B, ...C, ...A, ...C, ...D);
        couleurs.push(col, col);
      };
      // une boîte posée dans le repère de l'immeuble (sans dessous) : son centre cx, cz, son bas cy ; l (x) × h × p (z)
      const boite = (cx, cy, cz, l, h, p, col) => {
        const Q = (qx, qy, qz) => R(cx + (qx * l) / 2, cy + qy * h, cz + (qz * p) / 2), N = (nx, nz) => [nx * cr + nz * sr, 0, -nx * sr + nz * cr];
        quad(Q(-1, 0, 1), Q(1, 0, 1), Q(1, 1, 1), Q(-1, 1, 1), col, N(0, 1));
        quad(Q(1, 0, -1), Q(-1, 0, -1), Q(-1, 1, -1), Q(1, 1, -1), col, N(0, -1));
        quad(Q(1, 0, 1), Q(1, 0, -1), Q(1, 1, -1), Q(1, 1, 1), col, N(1, 0));
        quad(Q(-1, 0, -1), Q(-1, 0, 1), Q(-1, 1, 1), Q(-1, 1, -1), col, N(-1, 0));
        quad(Q(-1, 1, 1), Q(1, 1, 1), Q(1, 1, -1), Q(-1, 1, -1), col, [0, 1, 0]);
      };
      // vers le château : quelles faces on voit, et la plus tournée vers lui (les balcons)
      const vx = -x, vz = DONJON.z - z, vl = Math.hypot(vx, vz) || 1;
      const faces = [[w, d, 0], [d, w, PI / 2], [w, d, PI], [d, w, -PI / 2]];
      const vue = faces.map(([, , rf]) => (Math.sin(ry + rf) * vx + Math.cos(ry + rf) * vz) / vl), avant = vue.indexOf(Math.max(...vue));
      const etages = [];
      for (let f = yS + 2.4; f < H - 1.2; f += 3.2) etages.push(f);
      faces.forEach(([long, prof, rf], i) => {
        const cf2 = Math.cos(rf), sf = Math.sin(rf), Z0 = prof / 2;
        const pf = (lx, ly, lz) => R(lx * cf2 + lz * sf, ly, -lx * sf + lz * cf2);
        const n = [Math.sin(ry + rf), 0, Math.cos(ry + rf)], t = [Math.cos(ry + rf), 0, -Math.sin(ry + rf)];
        const rect = (lx0, lx1, ly0, ly1, e, col) => quad(pf(lx0, ly0, Z0 + e), pf(lx1, ly0, Z0 + e), pf(lx1, ly1, Z0 + e), pf(lx0, ly1, Z0 + e), col, n);
        // le mur, monté en acrotère au-dessus du toit ; l'acrotère vu du toit, son dessus
        rect(-long / 2, long / 2, y0, H + 0.55, 0, c);
        const ia = i % 2 ? 0.22 : 0;
        quad(pf(-long / 2 + ia, H, Z0 - 0.22), pf(long / 2 - ia, H, Z0 - 0.22), pf(long / 2 - ia, H + 0.55, Z0 - 0.22), pf(-long / 2 + ia, H + 0.55, Z0 - 0.22), cf, [-n[0], 0, -n[2]]);
        quad(pf(-long / 2 + ia, H + 0.55, Z0 - 0.22), pf(long / 2 - ia, H + 0.55, Z0 - 0.22), pf(long / 2 - ia, H + 0.55, Z0), pf(-long / 2 + ia, H + 0.55, Z0), cf, [0, 1, 0]);
        if (vue[i] < -0.25) return;
        const allume = (f) => (hasard(x + f * 0.7, z + rf * 3.1) < 0.6 ? P.vitreVille : vitre);
        if (sorte === 'verre') {
          for (let f = yS + 0.3; f < H - 0.4; f += 3.2) rect(-long / 2 + 0.15, long / 2 - 0.15, f, Math.min(H - 0.1, f + 3.2), 0.05, allume(f));
          for (let f = yS + 0.3; f < H - 0.4; f += 3.2) rect(-long / 2 + 0.15, long / 2 - 0.15, f - 0.1, f + 0.1, 0.08, MENEAU);
          const nm = Math.max(2, Math.round(long / 1.8));
          for (let k = 1; k < nm; k++) { const lx = -long / 2 + 0.15 + (k * (long - 0.3)) / nm; rect(lx - 0.05, lx + 0.05, yS + 0.3, H - 0.1, 0.09, MENEAU); }
          return;
        }
        if (sorte === 'habitation' && i === avant) {
          // les balcons : la baie, la dalle, le garde-corps clair et ses côtés
          const l0 = -long / 2 + 0.45, l1 = long / 2 - 0.45;
          for (const f of etages) {
            const yb = f - 0.4;
            rect(l0 + 0.15, l1 - 0.15, yb + 0.05, yb + 2.3, 0.04, allume(f));
            quad(pf(l0, yb, Z0), pf(l1, yb, Z0), pf(l1, yb, Z0 + 1.0), pf(l0, yb, Z0 + 1.0), cf, [0, 1, 0]);
            rect(l0, l1, yb - 0.16, yb + 0.95, 1.0, '#e6e4dc');
            for (const [lx, sg] of [[l0, -1], [l1, 1]]) quad(pf(lx, yb - 0.16, Z0), pf(lx, yb - 0.16, Z0 + 1.0), pf(lx, yb + 0.95, Z0 + 1.0), pf(lx, yb + 0.95, Z0), '#d8d6ce', [t[0] * sg, 0, t[2] * sg]);
          }
          return;
        }
        // les fenêtres en rangées, entre des piliers
        for (const f of etages) rect(-long / 2 + 0.6, long / 2 - 0.6, f, f + 1.15, 0.04, allume(f));
        const np = Math.max(2, Math.round((long - 1.2) / 2.6));
        if (etages.length) for (let k = 1; k < np; k++) { const lx = -long / 2 + 0.6 + (k * (long - 1.2)) / np; rect(lx - 0.17, lx + 0.17, etages[0] - 0.2, etages[etages.length - 1] + 1.35, 0.07, c); }
        if (sorte !== 'bureau') return;
        // au rez-de-chaussée, la vitrine, allumée le soir, et son enseigne ; à l'angle, parfois, une enseigne verticale
        rect(-long / 2 + 0.7, long / 2 - 0.7, yS + 0.15, yS + 2.45, 0.05, P.vitreVille);
        rect(-long / 2 + 0.5, long / 2 - 0.5, yS + 2.6, yS + 3.2, 0.12, enseigne);
        if (i === avant && H > 14 && hasard(x - 3, z + 5) < 0.4) {
          const lx = long / 2 - 0.9, yh = Math.min(H - 1.5, yS + 4 + (H - yS) * 0.45), c2 = ENSEIGNES[Math.floor(hasard(z + 2, x) * ENSEIGNES.length)];
          rect(lx - 0.3, lx + 0.3, yS + 3.6, yh, 1.1, c2);
          for (const [bx, sg] of [[lx - 0.3, -1], [lx + 0.3, 1]]) quad(pf(bx, yS + 3.6, Z0), pf(bx, yS + 3.6, Z0 + 1.1), pf(bx, yh, Z0 + 1.1), pf(bx, yh, Z0), nuancer(c2, 0.82), [t[0] * sg, 0, t[2] * sg]);
          quad(pf(lx - 0.3, yh, Z0), pf(lx + 0.3, yh, Z0), pf(lx + 0.3, yh, Z0 + 1.1), pf(lx - 0.3, yh, Z0 + 1.1), nuancer(c2, 0.9), [0, 1, 0]);
        }
      });
      // le toit ; la cage d'ascenseur, parfois un réservoir d'eau sur son socle et des climatiseurs
      quad(R(-w / 2, H, d / 2), R(w / 2, H, d / 2), R(w / 2, H, -d / 2), R(-w / 2, H, -d / 2), ct, [0, 1, 0]);
      if (w > 7 && d > 7) {
        const mx = (hasard(x, z + 2) - 0.5) * (w - 6), mz = (hasard(z, x + 2) - 0.5) * (d - 6);
        boite(mx, H, mz, 2.6, 2.4, 2.4, cf);
        if (hasard(x + 4, z) < 0.45) { const tx = -mx * 0.6, tz = mz * 0.5 + (mz > 0 ? -2.2 : 2.2); boite(tx, H, tz, 1.9, 0.5, 1.9, '#6a6862'); boite(tx, H + 0.5, tz, 1.7, 1.4, 1.7, '#d4d0c4'); }
        for (let k = 0; k < 2; k++) if (hasard(x + k * 3, z - k) < 0.6) boite(mx + (k ? 1.9 : -1.9), H, mz + 1.6 - k * 0.4, 1.0, 0.75, 0.7, '#e2e0d8');
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      a.piece(geo, c, { couleurs, nuance: 0.02, trait: false });
    };
    // (l'avenue, et des îlots de 60 m entre des rues de 10 m ; pas sur le château, ni dans les parcs proches)
    for (let z = 66; z < 330; z += 16 + tire() * 6) for (const s of [-1, 1]) {
      const w = 12 + tire() * 10, d = 12 + tire() * 6, H = 9 + tire() * 26;
      immeuble(s * (16 + w / 2 + tire() * 2), z, w, d, H, 0);
    }
    for (let ix = -6; ix <= 5; ix++) {
      for (let iz = -6; iz <= 5; iz++) {
        const cx = ix * 60 + 30, cz = iz * 60 + 30 - 25;
        if (Math.abs(cx) < 50 && cz < 40) continue;
        for (let k = 0; k < 4; k++) {
          const x = cx - 18 + (k % 2) * 30 + (tire() - 0.5) * 8, z = cz - 14 + (k >> 1) * 26 + (tire() - 0.5) * 6, r = Math.hypot(x, z + 25);
          if (r < 120 || r > 330 || Math.abs(x) < 50 || !libre(x, z, 8)) continue;
          if (tire() < 0.25) continue;
          immeuble(x, z, 12 + tire() * 14, 10 + tire() * 12, 7 + tire() * (r < 200 ? 30 : 16), (tire() - 0.5) * 0.1);
        }
      }
    }
    // la gare de Himeji, au bout de l'avenue : un long bâtiment de verre, son quai couvert
    immeuble(0, 335, 90, 22, 18, 0);
    for (const [k, a] of SECTEURS) poser(a.fin(0, peinture), 0, 0, { y: 0, ombre: false, trait: k < 8 });
  }

  // ---------------------------------------------------------------- Les nuages
  // (2026-10-25, « rajoute les nuages dans le ciel ») des cumulus blancs, loin au-dessus des montagnes, tout autour : des
  // boules serrées autour d'une plus grosse, le dessous aplati
  {
    const a = atelier();
    for (const [x, y, z, s] of [[-380, 230, -760, 52], [60, 270, -880, 66], [420, 240, -720, 48], [760, 260, -420, 54], [-760, 220, -380, 50], [-860, 250, 160, 46], [880, 230, 260, 50], [-300, 260, 820, 56], [360, 220, 780, 44], [130, 300, -620, 38], [-620, 280, -820, 44]]) {
      const n = 7 + Math.floor(hasard(x, z) * 3), lobe = (r, px, py, pz) => a.piece(new THREE.IcosahedronGeometry(r, 1), P.nuage, { x: px, y: py, z: pz, sy: 0.8, deformer: (u, v, w) => [u, Math.max(v, -0.3 * r), w] });
      lobe(s, x, y, z);
      for (let i = 0; i < n; i++) {
        const t = (i / n) * 2 * PI + hasard(i, x) * 0.6, r = s * (0.5 + 0.3 * hasard(z, i)), d = s * (0.95 + 0.35 * hasard(i + 3, z));
        lobe(r, x + Math.cos(t) * d * 1.35, y - s * 0.12 + r * 0.25, z + Math.sin(t) * d * 0.55);
      }
      lobe(s * 0.62, x + s * 0.3, y + s * 0.55, z);
      lobe(s * 0.5, x - s * 0.55, y + s * 0.4, z + s * 0.1);
    }
    // (sans trait d'encre : à 800 m, il ferait un pixel, flouté par la distance ; deux fois moins de triangles)
    poser(a.fin(0, false), 0, 0, { y: 0, ombre: false, trait: false });
  }

  // ---------------------------------------------------------------- Le salon de thé, à droite du grand donjon
  // (2026-10-25, « rajoute des éléments du décor, un stand de nourriture, sur le côté droit du grand donjon ») À l'est du
  // donjon, contre le mur : un petit salon de thé (茶屋) de bois sous son toit de tuiles ; son comptoir, la marmite d'oden
  // de Himeji (姫路おでん : on le mange avec une sauce soja au gingembre) qui fume, les brochettes de dango, le thé ;
  // trois norens bleus ; l'enseigne d'une glace au matcha ; devant, deux bancs couverts de feutre rouge sous une grande
  // ombrelle rouge, la carte, les poubelles ; le marchand derrière son comptoir, une cliente sur un banc (ce repère :
  // son devant vers +z, l'ouest du monde)
  const CHAYA = { x: 23.3, z: -55, ry: -PI / 2 };
  const RC = repere(CHAYA.x, CHAYA.z, CHAYA.ry), mC = (lx, lz) => { const q = RC(lx, 0, lz); return [q.x, q.z]; };
  const vapeurs = [];
  {
    const a = atelier(), R = RC, y = T3.h, BOIS = '#6a4e38', BOIS2 = '#5e4430', FONCE = '#4a3628', ROUGE = '#c8402c';
    // les poteaux, le mur du fond (des planches), les côtés à mi-hauteur, les poutres de devant et du fond
    for (const lx of [-1.7, 1.7]) for (const lz of [-1.0, 1.0]) a.boite(0.14, 2.6, 0.14, FONCE, R(lx, y + 1.3, lz));
    a.piece(new THREE.BoxGeometry(3.3, 2.55, 0.06, 13, 1, 1), BOIS, { ...R(0, y + 1.275, -1.0), teinte: (px, py, pz) => (Math.floor(pz / 0.25 + 400) % 2 ? BOIS : BOIS2) });
    for (const lx of [-1.7, 1.7]) a.boite(0.05, 1.0, 1.9, BOIS, R(lx, y + 0.5, 0));
    for (const lz of [-1.0, 1.0]) a.boite(3.6, 0.14, 0.12, FONCE, R(0, y + 2.38, lz));
    // le comptoir et son plateau
    a.boite(3.1, 0.88, 0.5, BOIS, R(0, y + 0.44, 0.78))
      .boite(3.3, 0.06, 0.66, '#8a6848', R(0, y + 0.91, 0.8));
    // le toit de tuiles, ses arêtes
    toitH(a, 4.4, 3.0, 0.85, 0.3, { ...R(0, y + 2.48, 0), releve: 0.12, rangs: 10, epaisseur: 0.08 });
    // les trois norens bleus, sous la poutre de devant
    for (const [lx, texte] of [[-1.12, 'おでん'], [0, '茶屋'], [1.12, 'だんご']]) {
      a.boite(1.08, 0.55, 0.02, '#2f4a6a', R(lx, y + 2.03, 1.08, { trait: false }));
      ecrire({ ...R(0, y, 0) }, { texte, fond: '#2f4a6a', encre: '#f4efe6', x: lx, y: 2.03, z: 1.095, l: 1.0, h: 0.5 });
    }
    // la marmite d'oden : ses parois d'inox, le bouillon, deux séparations, le radis, les œufs, le konjac, les chikuwa,
    // leurs piques ; elle fume
    const xo = -0.85, zo = 0.8, yo = y + 0.94;
    for (const sz of [-1, 1]) a.boite(0.8, 0.2, 0.03, '#a8acb0', R(xo, yo + 0.1, zo + sz * 0.205));
    for (const sx of [-1, 1]) a.boite(0.03, 0.2, 0.38, '#a8acb0', R(xo + sx * 0.385, yo + 0.1, zo));
    a.boite(0.73, 0.02, 0.37, '#b07a3c', R(xo, yo + 0.14, zo, { trait: false }));
    for (const sx of [-1, 1]) a.boite(0.012, 0.055, 0.37, '#a8acb0', R(xo + sx * 0.13, yo + 0.1725, zo, { trait: false }));
    for (const [dx, dz] of [[-0.26, -0.08], [-0.24, 0.09], [0.02, 0.06]]) a.cylindre(0.055, 0.055, 0.04, 10, '#ead9b0', R(xo + dx, yo + 0.16, zo + dz));
    for (const [dx, dz] of [[0.0, -0.09], [0.26, 0.08], [-0.02, 0.12]]) a.ovale(0.04, '#d9b98a', R(xo + dx, yo + 0.17, zo + dz, { sy: 1.25 }), 8);
    for (const [dx, dz] of [[0.25, -0.07], [0.28, 0.0]]) a.boite(0.09, 0.03, 0.07, '#7a7470', R(xo + dx, yo + 0.165, zo + dz, { ry: 0.5, rx: 0.3 }));
    a.cylindre(0.025, 0.025, 0.16, 8, '#c89a5a', R(xo - 0.05, yo + 0.165, zo - 0.02, { rz: PI / 2, ry: 0.3 }));
    for (const [dx, dz] of [[-0.26, -0.08], [0.26, 0.08], [0.25, -0.07]]) { const b = R(xo + dx, 0, zo + dz), c = R(xo + dx + 0.03, 0, zo + dz + 0.05); a.baton([b.x, yo + 0.15, b.z], [c.x, yo + 0.32, c.z], 0.006, '#e8d8b0', 4, { trait: false }); }
    { const q = R(xo, 0, zo); vapeurs.push({ x: q.x, z: q.z, y: yo + 0.2, n: 4, haut: 1.3, large: 0.14, taille: 0.3 }); }
    // les dango sur leur assiette (rose, blanc, vert), deux tasses de thé, la théière
    a.cylindre(0.17, 0.15, 0.02, 14, '#f4f2ea', R(0.55, yo + 0.01, 0.8));
    for (const dz of [-0.06, 0, 0.06]) {
      const b = R(0.4, 0, 0.8 + dz), c = R(0.72, 0, 0.8 + dz);
      a.baton([b.x, yo + 0.04, b.z], [c.x, yo + 0.04, c.z], 0.005, '#e8d8b0', 4, { trait: false });
      ['#f2a8b8', '#f4f0e6', '#8fbf6a'].forEach((cb, k) => a.boule(0.026, cb, R(0.48 + k * 0.06, yo + 0.05, 0.8 + dz), 1));
    }
    for (const lx of [1.08, 1.22]) a.cylindre(0.035, 0.03, 0.07, 10, '#4e6a4a', R(lx, yo + 0.035, 0.72));
    a.ovale(0.075, '#3a3a36', R(1.3, yo + 0.07, 0.88, { sy: 0.8 }), 10).cone(0.018, 0.09, 6, '#3a3a36', R(1.36, yo + 0.09, 0.82, { rz: -0.9, ry: 0.8 }));
    // l'enseigne de la glace au matcha : un grand cornet sur son pied, la petite pancarte
    const [xg, zg] = [2.35, 1.6];
    a.boite(0.4, 0.06, 0.4, '#8a8a86', R(xg, y + 0.03, zg))
      .cylindre(0.03, 0.03, 1.25, 8, '#c8c8c4', R(xg, y + 0.62, zg))
      .boite(0.52, 0.34, 0.03, '#f4f2ea', R(xg, y + 0.9, zg + 0.04))
      .cone(0.16, 0.44, 12, '#d9a860', R(xg, y + 1.46, zg, { rx: PI }))
      .cylindre(0.17, 0.19, 0.12, 14, '#9dc46c', R(xg, y + 1.74, zg))
      .cylindre(0.12, 0.165, 0.12, 14, '#a8cc78', R(xg, y + 1.86, zg))
      .cylindre(0.05, 0.115, 0.12, 14, '#9dc46c', R(xg, y + 1.98, zg))
      .cone(0.05, 0.1, 10, '#a8cc78', R(xg, y + 2.09, zg));
    ecrire({ ...R(0, y, 0) }, { texte: '抹茶ソフト', fond: '#f4f2ea', encre: '#3a7a3a', x: xg, y: 0.9, z: zg + 0.06, l: 0.48, h: 0.3 });
    // la carte, sur un petit chevalet : « お品書き »
    const [xm, zm] = [-2.35, 1.5];
    a.boite(0.58, 0.8, 0.04, '#33332f', R(xm, y + 0.78, zm))
      .boite(0.64, 0.05, 0.06, '#7a5a40', R(xm, y + 1.2, zm))
      .boite(0.64, 0.05, 0.06, '#7a5a40', R(xm, y + 0.36, zm));
    for (const sx of [-1, 1]) a.boite(0.05, 0.4, 0.05, '#7a5a40', R(xm + sx * 0.25, y + 0.18, zm));
    ecrire({ ...R(0, y, 0) }, { texte: 'お品書き', lignes: 3, fond: '#33332f', encre: '#f4f2ea', x: xm, y: 0.78, z: zm + 0.025, l: 0.52, h: 0.74 });
    // les poubelles
    for (const [lx, c] of [[2.4, '#3a6a8a'], [2.85, '#6a8a3a']]) a.cylindre(0.18, 0.17, 0.75, 12, c, R(lx, y + 0.375, -0.5)).cylindre(0.19, 0.19, 0.04, 12, '#2a2a2e', R(lx, y + 0.77, -0.5));
    // devant : deux bancs couverts de feutre rouge (on s'y assoit, sauf là où la cliente est assise), la grande ombrelle
    for (const [cx, de, aa] of [[-1.1, -0.7, 0.7], [1.3, -0.7, -0.2]]) {
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.boite(0.07, 0.42, 0.07, '#5a4436', R(cx + sx * 0.7, y + 0.21, 3.4 + sz * 0.17));
      a.boite(1.6, 0.06, 0.45, '#8a6a4a', R(cx, y + 0.45, 3.4))
        .boite(1.64, 0.015, 0.49, ROUGE, R(cx, y + 0.4875, 3.4, { trait: false }));
      for (const sz of [-1, 1]) a.boite(1.64, 0.12, 0.012, ROUGE, R(cx, y + 0.435, 3.4 + sz * 0.251, { trait: false }));
      const A = RC(cx + de, 0, 3.4), B = RC(cx + aa, 0, 3.4);
      bancs.push({ de: [A.x, A.z], a: [B.x, B.z], y: y + 0.495, cap: CHAYA.ry, vue: 0.3 });
      const A1 = RC(cx - 0.85, 0, 3.4), B1 = RC(cx + 0.85, 0, 3.4);
      monde.mur(A1.x, A1.z, B1.x, B1.z, 0.28);
    }
    const [xp, zp] = [0.1, 3.4];
    a.cylindre(0.03, 0.03, 2.3, 8, '#8a6a4a', R(xp, y + 1.15, zp))
      .piece(new THREE.ConeGeometry(1.7, 0.45, 24), ROUGE, R(xp, y + 2.15, zp))
      .cylindre(0.04, 0.03, 0.12, 8, '#8a6a4a', R(xp, y + 2.42, zp));
    for (let k = 0; k < 12; k++) { const t = (k / 12) * 2 * PI, b = R(xp, 0, zp), c = R(xp + Math.cos(t) * 1.62, 0, zp + Math.sin(t) * 1.62); a.baton([b.x, y + 1.91, b.z], [c.x, y + 1.91, c.z], 0.008, '#e8d8b0', 4, { trait: false }); }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
    // ce qui arrête : le salon, l'ombrelle, l'enseigne, la carte, les poubelles ; la caméra n'entre pas dans le salon
    // (jusqu'au mur de la terrasse : derrière le salon, il restait un recoin d'où l'on parlait au marchand à travers le
    // mur du fond)
    monde.surface(CHAYA.x - 1.1, T3.x1 - 0.3, CHAYA.z - 1.85, CHAYA.z + 1.85, y + 3, { plein: true });
    monde.bloc(CHAYA.x - 1.1, CHAYA.x + 1.15, CHAYA.z - 1.85, CHAYA.z + 1.85, y - 1, y + 3.4);
    for (const [lx, lz, r] of [[xp, zp, 0.12], [xg, zg, 0.28], [xm, zm, 0.36], [2.4, -0.5, 0.22], [2.85, -0.5, 0.22]]) monde.cercle(...mC(lx, lz), r);
  }

  // ---------------------------------------------------------------- L'étal de la vieille dame, le pique-nique, les panneaux
  const ETAL = { x: 9.6, z: 20.2 };
  const NAPPE = { x: -19.6, z: 6.2 };
  {
    const a = atelier(), R = repere(ETAL.x, ETAL.z, -PI / 2), y = terrain(ETAL.x, ETAL.z);
    // l'étal de bois (yatai) : le comptoir, le petit toit, la bannière rouge « こいのえさ » (de quoi nourrir les carpes),
    // les sachets, les gâteaux de riz grillés, la lanterne
    a.boite(1.8, 0.95, 0.75, P.bois, R(0, y + 0.47, 0))
      .boite(1.9, 0.06, 0.85, P.bois2, R(0, y + 0.98, 0));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.boite(0.08, 2.1, 0.08, '#5a4436', R(sx * 0.88, y + 1.05, sz * 0.35));
    a.pignon(2.2, 0.32, 1.25, P.tuileShiro, R(0, y + 2.1, 0));
    for (let k = 0; k < 5; k++) a.boite(0.16, 0.1, 0.12, '#e9dcc0', R(-0.6 + k * 0.18, y + 1.06, 0.15, { trait: false }));
    for (let k = 0; k < 4; k++) a.cylindre(0.06, 0.06, 0.03, 8, '#c98a4a', R(0.35 + (k % 2) * 0.16, y + 1.03 + Math.floor(k / 2) * 0.035, -0.12 + (k % 2) * 0.08, { trait: false }));
    // (la bannière tournée vers ceux qui arrivent par l'allée, pendue à sa perche)
    a.cylindre(0.02, 0.02, 2.4, 5, '#c9a87a', R(1.25, y + 1.2, 0.3)).boite(0.42, 1.5, 0.02, '#c8402c', R(1.48, y + 1.45, 0.3, { trait: false }));
    ecrire({ x: ETAL.x, y, z: ETAL.z, ry: -PI / 2 }, { texte: 'こいのえさ', vertical: true, fond: '#c8402c', encre: '#fbf6ea', x: 1.48, y: 1.45, z: 0.315, l: 0.34, h: 1.3 });
    // (dans le repère de l'étal : posée à (0,7 ; 0,48) du monde, elle flottait au milieu de l'esplanade ; 2026-10-25)
    const pL = R(0.7, y + 1.85, 0.48);
    a.chochin(pL.x, pL.y, pL.z, 6);
    lumieres.push({ x: pL.x, y: pL.y, z: pL.z, halo: 0.45, sol: y, r: 2.4 });
    monde.mur(...[R(-0.95, 0, 0), R(0.95, 0, 0)].flatMap((p) => [p.x, p.z]), 0.42);
    // le pique-nique sous le grand cerisier : la bâche bleue, les boîtes à repas, la théière, les gobelets, les dango
    const yN = terrain(NAPPE.x, NAPPE.z);
    a.boite(3.2, 0.02, 2.6, '#3f6fb0', { x: NAPPE.x, y: yN + 0.012, z: NAPPE.z, ry: 0.12, trait: false });
    for (const [dx, dz, c] of [[0.2, -0.1, '#a82a2a'], [0.55, 0.15, '#2a2420'], [-0.2, 0.25, '#a82a2a']]) a.boite(0.36, 0.1, 0.26, c, { x: NAPPE.x + dx, y: yN + 0.07, z: NAPPE.z + dz, ry: 0.12 });
    a.cylindre(0.09, 0.1, 0.16, 10, '#5a6a50', { x: NAPPE.x - 0.5, y: yN + 0.1, z: NAPPE.z - 0.25 });
    for (let k = 0; k < 3; k++) a.cylindre(0.035, 0.03, 0.07, 8, '#f2ece0', { x: NAPPE.x - 0.25 + k * 0.14, y: yN + 0.05, z: NAPPE.z - 0.45 });
    for (let k = 0; k < 3; k++) {
      a.baton([NAPPE.x + 0.15 + k * 0.08, yN + 0.04, NAPPE.z + 0.55], [NAPPE.x + 0.15 + k * 0.08, yN + 0.04, NAPPE.z + 0.78], 0.006, '#c9a87a', 3, { trait: false });
      for (const [i, c] of [[0, '#f2a8b8'], [1, '#f4efe2'], [2, '#8fc070']]) a.boule(0.03, c, { x: NAPPE.x + 0.15 + k * 0.08, y: yN + 0.045, z: NAPPE.z + 0.6 + i * 0.06 }, 1);
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }
  // (le papier d'un panneau regarde son −z : tourné de vers(…) + π, il regarde ce point)
  const PANNEAUX = {
    shiro: { x: 4.6, z: 19.4, ry: vers(4.6, 19.4, 0, 16.5) + PI },
    hishi: { x: -14.6, z: -5.1, ry: PI }, // (contre le pied du mur, tourné vers l'allée : il était au milieu du chemin)
    sama: { x: -20, z: -8.1, ry: 0 }, // (contre le mur et ses meurtrières, le papier vers la terrasse)
    nishinomaru: { x: -43.2, z: 12.5, ry: -PI / 2 - 0.3 },
    bizen: { x: 5.5, z: -40.2, ry: vers(5.5, -40.2, 12, -37.5) + PI },
  };
  const TITRES = { shiro: '姫路城', hishi: '菱の門', sama: '狭間', nishinomaru: '西の丸', bizen: '備前丸' };
  for (const [id, p] of Object.entries(PANNEAUX)) {
    const pose = { x: p.x, z: p.z, y: monde.hauteur(p.x, p.z), ry: p.ry };
    poser(panneau(atelier(), P, { ecrit: true }).fin(0, peinture), p.x, p.z, pose);
    ecrire(pose, { ...PAPIER_PANNEAU, texte: TITRES[id], lignes: 3, fond: P.papier, encre: '#2a2420' });
    monde.cercle(p.x, p.z, 0.75);
  }

  // ---------------------------------------------------------------- Les carpes des douves
  /** Une tache ronde de lumière (les lueurs, les étincelles), dessinée une fois ; rien dans Node (les essais). */
  const tache = typeof document === 'undefined' ? null : (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d'), d = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    d.addColorStop(0, 'rgba(255,255,255,1)'); d.addColorStop(0.22, 'rgba(255,255,255,0.85)'); d.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = d; g.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  /** Des points de lumière qui s'ajoutent (attenue : leur taille en mètres ; sinon en pixels). */
  const points = (n, taille, couleur, attenue = true) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3).setUsage(THREE.DynamicDrawUsage));
    const m = new THREE.Points(geo, new THREE.PointsMaterial({ size: taille, sizeAttenuation: attenue, vertexColors: true, color: couleur, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, map: tache, fog: false }));
    m.frustumCulled = false;
    return m;
  };
  const carpes = (() => {
    const objet = new THREE.Group();
    objet.name = 'carpes';
    // les robes : kōhaku (blanc et rouge), sanke (blanc, rouge, noir), shōwa (noir, rouge, blanc), ōgon (or), asagi (bleu
    // gris, le ventre rouge), chagoi (brun), yamabuki (jaune)
    const ROBES = [['#f4efe6', '#d8462a', null], ['#f4efe6', '#d8462a', '#2a2624'], ['#2a2624', '#d8462a', '#f4efe6'], ['#e8b84a', '#f2cf6a', null], ['#7f96a6', '#d8642a', null], ['#8a6a4a', '#a8865e', null], ['#f0c43a', '#f6dc6a', null]];
    const yE = DOUVES.eau, ZONE = { x0: -24, x1: 24, z0: DOUVES.z0 + 1.1, z1: DOUVES.z1 - 1.1 }, liste = [];
    for (let i = 0; i < 11; i++) {
      const [c1, c2, c3] = ROBES[i % ROBES.length], k = 0.95 + 0.25 * hasard(i, 3.1);
      const robe = (x, y, z) => {
        const t = bruitDoux(x * 9 + i * 3, z * 9 - i, 1);
        return y < -0.035 && c1 === '#7f96a6' ? c2 : c3 && t > 0.72 ? c3 : t > 0.45 ? c2 : c1;
      };
      const corps = atelier()
        .ovale(0.11, c1, { sx: 0.82, sy: 0.62, sz: 2.4, teinte: robe }, 12)
        .ovale(0.075, c1, { z: 0.22, sx: 0.95, sy: 0.8, sz: 1.1, teinte: robe }, 8)
        .boite(0.12, 0.004, 0.08, c1 === '#2a2624' ? '#d8462a' : c1, { x: 0.1, y: -0.04, z: 0.1, rz: -0.5, trait: false })
        .boite(0.12, 0.004, 0.08, c1 === '#2a2624' ? '#d8462a' : c1, { x: -0.1, y: -0.04, z: 0.1, rz: 0.5, trait: false })
        .boite(0.004, 0.07, 0.16, c1, { y: 0.07, z: -0.02, trait: false });
      for (const s of [-1, 1]) corps.ovale(0.012, '#1e1a18', { x: s * 0.06, y: 0.02, z: 0.27, trait: false }, 5);
      const queue = atelier().piece(new THREE.ConeGeometry(0.1, 0.2, 4), c1 === '#2a2624' ? '#2a2624' : c1, { z: -0.1, rx: -PI / 2, sx: 0.12, teinte: robe });
      const g = new THREE.Group(), pivotQ = new THREE.Group();
      g.add(ctx.maillage(corps.fin(0, false), false, false));
      pivotQ.position.z = -0.25;
      pivotQ.add(ctx.maillage(queue.fin(0, false), false, false));
      g.add(pivotQ);
      g.scale.setScalar(1.9 * k); // (plus grandes que nature, comme les autres bêtes : on les voit du pont)
      objet.add(g);
      const x = ZONE.x0 + (ZONE.x1 - ZONE.x0) * hasard(i * 1.7, 2), z = ZONE.z0 + (ZONE.z1 - ZONE.z0) * hasard(i * 2.3, 5);
      liste.push({ g, queue: pivotQ, x, z, cap: hasard(i, 9) * 2 * PI, v: 0.3, cible: null, prof: 0.07 + 0.08 * hasard(i, 7), ph: i * 1.3, surface: 0 });
    }
    // les ronds dans l'eau, quand elles happent la nourriture
    const ronds = Array.from({ length: 8 }, () => {
      const m = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 24), new THREE.MeshBasicMaterial({ color: '#f4f8f0', transparent: true, opacity: 0, depthWrite: false }));
      m.rotation.x = -PI / 2;
      m.renderOrder = 2;
      objet.add(m);
      return { m, t: 9 };
    });
    let iRond = 0, appat = null;
    return {
      objet,
      /** Jeter de la nourriture en x, z : elles accourent, montent et happent pendant quelques secondes. */
      nourrir(x, z) { appat = { x, z, t: 0, duree: 6.5 }; },
      maj(dt, temps, c) {
        const j = c.joueur, loin = Math.hypot(j.x, j.z - (DOUVES.z0 + DOUVES.z1) / 2) > 60;
        objet.visible = !loin;
        if (loin) return [];
        if (appat) { appat.t += dt; if (appat.t > appat.duree) appat = null; }
        for (const k of liste) {
          // elles nagent sans but, chacune vers un point qu'elle change de temps en temps ; à l'appât, elles accourent
          const presDe = appat && Math.hypot(k.x - appat.x, k.z - appat.z) < 16;
          if (presDe) k.cible = [appat.x + Math.sin(k.ph * 3) * 0.7, appat.z + Math.cos(k.ph * 2.3) * 0.6];
          else if (!k.cible || Math.hypot(k.x - k.cible[0], k.z - k.cible[1]) < 0.6 || hasard(temps, k.ph) < dt * 0.05) {
            k.cible = [ZONE.x0 + (ZONE.x1 - ZONE.x0) * hasard(temps * 0.37, k.ph), ZONE.z0 + (ZONE.z1 - ZONE.z0) * hasard(k.ph, temps * 0.41)];
          }
          const vise = Math.atan2(k.cible[0] - k.x, k.cible[1] - k.z), dv = presDe ? 1.4 : 0.35 + 0.1 * Math.sin(temps * 0.7 + k.ph);
          let d = vise - k.cap;
          d = Math.atan2(Math.sin(d), Math.cos(d));
          k.cap += d * Math.min(1, dt * (presDe ? 3.0 : 1.2));
          k.v += (dv - k.v) * Math.min(1, dt * 2);
          const prox = Math.hypot(k.x - k.cible[0], k.z - k.cible[1]);
          const avance = presDe && prox < 0.5 ? 0.15 : k.v;
          k.x = Math.min(ZONE.x1, Math.max(ZONE.x0, k.x + Math.sin(k.cap) * avance * dt));
          k.z = Math.min(ZONE.z1, Math.max(ZONE.z0, k.z + Math.cos(k.cap) * avance * dt));
          // près de l'appât, elles montent et ouvrent la bouche hors de l'eau, une à une ; des ronds dans l'eau
          k.surface += ((presDe && prox < 1.6 ? 1 : 0) - k.surface) * Math.min(1, dt * 2.5);
          const happe = k.surface > 0.5 && Math.sin(temps * 5 + k.ph * 4) > 0.82;
          if (happe && (!k.happe || temps - k.happe > 0.6)) {
            k.happe = temps;
            const r = ronds[iRond++ % ronds.length];
            r.t = 0; r.m.position.set(k.x + Math.sin(k.cap) * 0.3, yE + 0.012, k.z + Math.cos(k.cap) * 0.3);
          }
          const y = yE - k.prof * (1 - k.surface) + (happe ? 0.04 : 0) + 0.01 * Math.sin(temps * 2 + k.ph);
          k.g.position.set(k.x, y, k.z);
          k.g.rotation.set(-0.35 * k.surface - (happe ? 0.25 : 0), k.cap + 0.08 * Math.sin(temps * 3 + k.ph), 0, 'YXZ');
          k.queue.rotation.y = Math.sin(temps * (presDe ? 11 : 4.5) + k.ph) * (presDe ? 0.55 : 0.35);
        }
        for (const r of ronds) {
          r.t += dt;
          const u = Math.min(1, r.t / 1.4);
          r.m.visible = u < 1;
          if (u < 1) { r.m.scale.setScalar(0.15 + u * 0.75); r.m.material.opacity = 0.7 * (1 - u); }
        }
        return [];
      },
    };
  })();
  animes.push({ objet: carpes.objet, maj: (dt, temps, c) => carpes.maj(dt, temps, c) });

  // ---------------------------------------------------------------- Le puits d'Okiku, son fantôme, la dixième assiette
  const yP = T2.h;
  {
    const a = atelier(), x = PUITS.x, z = PUITS.z;
    // le dallage, la margelle de pierre (dehors, dedans, le dessus), le noir du fond ; le portique de bois, sa poulie et
    // son seau ; la grille de bambou posée dessus ; le petit panneau « お菊井戸 »
    a.cylindre(1.6, 1.7, 0.14, 12, P.pierreFonce, { x, y: yP + 0.04, z, teinte: pierres })
      .piece(new THREE.CylinderGeometry(0.88, 0.92, 0.8, 18, 2, true), P.pierre, { x, y: yP + 0.4, z, teinte: pierres })
      .piece(new THREE.CylinderGeometry(0.64, 0.64, 0.8, 18, 1, true), '#5a564e', { x, y: yP + 0.4, z, sx: -1 })
      .piece(new THREE.RingGeometry(0.64, 0.88, 18), P.pierreFonce, { x, y: yP + 0.8, z, rx: -PI / 2 })
      .piece(new THREE.CircleGeometry(0.64, 18), '#121212', { x, y: yP + 0.25, z, rx: -PI / 2, trait: false });
    for (let k = -2; k <= 2; k++) {
      a.boite(1.5, 0.04, 0.05, '#b8a070', { x, y: yP + 0.84, z: z + k * 0.24, trait: false })
        .boite(0.05, 0.04, 1.5, '#b8a070', { x: x + k * 0.24, y: yP + 0.86, z, trait: false });
    }
    for (const s of [-1, 1]) a.boite(0.14, 2.3, 0.14, '#5a4436', { x: x + s * 1.05, y: yP + 1.15, z });
    a.boite(2.4, 0.14, 0.16, '#5a4436', { x, y: yP + 2.3, z })
      .cylindre(0.1, 0.1, 0.06, 10, '#3e2f25', { x, y: yP + 2.12, z, rz: PI / 2 })
      .baton([x, yP + 2.05, z], [x - 0.3, yP + 1.2, z], 0.008, '#c9b080', 3, { trait: false })
      .cylindre(0.13, 0.11, 0.2, 8, '#6a5240', { x: x - 0.3, y: yP + 1.1, z });
    const R = repere(x + 1.8, z + 1.2, 0.4);
    a.boite(0.06, 1.0, 0.06, '#5a4436', R(0, yP + 0.5, 0)).boite(0.42, 0.66, 0.04, P.bois, R(0, yP + 1.1, 0.04));
    ecrire({ x: x + 1.8, y: yP, z: z + 1.2, ry: 0.4 }, { texte: 'お菊井戸', vertical: true, fond: P.bois, encre: '#2a2420', x: 0, y: 1.1, z: 0.065, l: 0.3, h: 0.6 });
    // les neuf assiettes, empilées sur une pierre à côté (on ne les voit que la nuit : c'est le fantôme qui les compte)
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
    monde.cercle(x, z, 1.05);
    for (const s of [-1, 1]) monde.cercle(x + s * 1.05, z, 0.2);
    monde.cercle(x + 1.8, z + 1.2, 0.3);
  }
  // l'assiette : la porcelaine blanche et son décor bleu ; on la voit une fois le fantôme entendu, jusqu'à ce qu'on la
  // ramasse (une petite lueur bleue la nuit) ; elle réapparaît sur la margelle quand on la rend
  let assietteRamassee = false;
  const assiette = (() => {
    const objet = new THREE.Group();
    objet.name = 'assiette';
    const forme = () => {
      const a = atelier().cylindre(0.13, 0.09, 0.03, 18, '#f6f4ee', {});
      a.piece(new THREE.RingGeometry(0.1, 0.125, 18), '#3b5ea8', { y: 0.016, rx: -PI / 2, trait: false })
        .piece(new THREE.CircleGeometry(0.05, 12), '#5d7fc0', { y: 0.0165, rx: -PI / 2, trait: false });
      return ctx.maillage(a.fin(0, false), true, true);
    };
    const parTerre = forme(), lueur = points(1, 0.55, '#8fc8ff');
    parTerre.position.set(ASSIETTE.x, T2.h + 0.02, ASSIETTE.z);
    parTerre.rotation.set(0.12, 0.6, -0.08);
    lueur.position.set(ASSIETTE.x, T2.h + 0.2, ASSIETTE.z);
    // la pile de la margelle : neuf assiettes, puis dix
    const pile = new THREE.Group();
    for (let k = 0; k < 10; k++) { const p = forme(); p.position.set(0, k * 0.032, 0); p.rotation.y = k * 0.7; pile.add(p); }
    pile.position.set(PUITS.x + 0.76, yP + 0.82, PUITS.z + 0.0);
    pile.scale.setScalar(0.9);
    objet.add(parTerre, lueur, pile);
    let rendue = secretTrouve('okiku');
    return {
      objet, pile,
      /** Rendue : la dixième assiette sur la pile. */
      rendre() { rendue = true; },
      maj(dt, temps, c) {
        const voit = indiceVu('okiku-nuit') && !assietteRamassee && !secretTrouve('okiku');
        pile.visible = c.nuit > 0.4 || rendue;
        pile.children[9].visible = rendue;
        parTerre.visible = voit;
        lueur.visible = voit && c.nuit > 0.3;
        const k = 1 / Math.tan(((c.champ ?? 50) * PI) / 360);
        lueur.material.size = (0.5 + 0.12 * Math.sin(temps * 2.2)) * k;
        return [];
      },
    };
  })();
  animes.push({ objet: assiette.objet, maj: (dt, temps, c) => assiette.maj(dt, temps, c) });
  // le fantôme d'Okiku : une flamme bleue pâle au-dessus du puits, la nuit (hitodama) ; elle palpite à chaque assiette
  // comptée ; apaisée, elle devient dorée et monte vers le ciel parmi des étincelles ; un koban sur le couvercle
  const okiku = (() => {
    const objet = new THREE.Group(), feu = new THREE.Group();
    objet.name = 'okiku';
    const halo = points(1, 1.0, '#7fb8ff'), coeur = points(1, 0.22, '#e8f6ff'), phare = points(1, 8, '#a8d6ff', false), etincelles = points(30, 0.12, '#ffffff');
    // la traîne de la flamme (hitodama : une boule de feu bleu qui flotte, sa queue qui ondule derrière elle)
    const QUEUE = 14, traine = points(QUEUE, 0.5, '#6aa8ff'), passe = [];
    feu.add(halo, coeur, phare);
    objet.add(feu, etincelles, traine);
    const koban = ctx.maillage(atelier().ovale(0.045, '#f2c84f', { sy: 0.15, sz: 1.4 }, 10).fin(0, false));
    koban.position.set(PUITS.x - 0.2, yP + 0.95, PUITS.z + 0.2);
    koban.visible = false;
    objet.add(koban);
    const lampe = { x: PUITS.x, y: yP + 1.5, z: PUITS.z, halo: 0, sol: yP, r: 3.2, c: '#7fb4e8', mobile: true };
    lumieres.push(lampe);
    const e = { pouls: 0, monte: -1, trouve: secretTrouve('okiku'), dore: 0 };
    const pos = etincelles.geometry.attributes.position, col = etincelles.geometry.attributes.color;
    const vol = Array.from({ length: 30 }, (_, i) => ({ a: i * 2.4, r: 0.2 + (i % 5) * 0.12, v: 0.5 + (i % 7) * 0.12, ph: i * 1.3 }));
    return {
      objet,
      /** Une assiette comptée : la flamme palpite. */
      compter() { e.pouls = 1; },
      /** Apaisée : la flamme devient dorée, puis monte et s'éteint. */
      apaiser() { e.dore = 0.001; },
      monter() { e.demande = true; },
      montrerKoban() { koban.visible = true; },
      kobanVisible: () => koban.visible,
      prendreKoban() { koban.visible = false; e.trouve = true; },
      maj(dt, temps, c) {
        if (e.demande) { e.monte = temps; e.demande = false; }
        const nuit = c.nuit, parti = e.trouve || (e.monte >= 0 && temps - e.monte > 4.5);
        feu.visible = nuit > 0.4 && !parti;
        e.pouls = Math.max(0, e.pouls - dt * 1.6);
        if (e.dore > 0) e.dore = Math.min(1, e.dore + dt * 0.8);
        const monte = e.monte >= 0 ? Math.max(0, temps - e.monte) : 0;
        const y = yP + 1.45 + 0.12 * Math.sin(temps * 1.7) + monte * monte * 0.9;
        feu.position.set(PUITS.x + 0.06 * Math.sin(temps * 2.3), y, PUITS.z + 0.06 * Math.cos(temps * 1.9));
        const k = 1 / Math.tan(((c.champ ?? 50) * PI) / 360), fade = e.monte >= 0 ? Math.max(0, 1 - monte / 4.5) : 1;
        const tremble = 0.85 + 0.15 * Math.sin(temps * 9) * Math.sin(temps * 5.3);
        // la traîne : les positions passées de la flamme, qui retombent un peu et ondulent, de plus en plus petites
        passe.unshift([feu.position.x, feu.position.y, feu.position.z]);
        if (passe.length > QUEUE * 3) passe.length = QUEUE * 3;
        traine.visible = feu.visible;
        if (traine.visible) {
          const tp = traine.geometry.attributes.position, tc = traine.geometry.attributes.color;
          for (let i = 0; i < QUEUE; i++) {
            const q = passe[Math.min(passe.length - 1, i * 3)], u = (i + 1) / QUEUE;
            tp.setXYZ(i, q[0] + 0.05 * Math.sin(temps * 5 - i * 0.7), q[1] - 0.06 - i * 0.035, q[2] + 0.05 * Math.cos(temps * 4.3 - i * 0.6));
            const b = (1 - u) * fade;
            tc.setXYZ(i, b * (0.55 + 0.45 * (1 - e.dore)) + b * 0.45 * e.dore, b * (0.75 + 0.05 * e.dore), b * (1 - 0.6 * e.dore));
          }
          tp.needsUpdate = true;
          tc.needsUpdate = true;
          traine.material.size = 0.42 * k * tremble;
        }
        halo.material.size = (0.62 + 0.4 * e.pouls) * k * tremble * fade;
        coeur.material.size = 0.13 * k * fade;
        phare.material.size = (7 + 3 * e.pouls) * fade;
        const cBleu = [0.45, 0.72, 1.0], cOr = [1.0, 0.8, 0.4], d = e.dore;
        halo.material.color.setRGB(cBleu[0] + (cOr[0] - cBleu[0]) * d, cBleu[1] + (cOr[1] - cBleu[1]) * d, cBleu[2] + (cOr[2] - cBleu[2]) * d);
        Object.assign(lampe, { x: feu.position.x, y: feu.position.y, z: feu.position.z, c: d > 0.5 ? '#e8c070' : '#7fb4e8', r: feu.visible ? 3.2 : 0.001 });
        // les étincelles qui montent avec elle, une fois apaisée
        etincelles.visible = e.monte >= 0 && monte < 6;
        if (etincelles.visible) {
          vol.forEach((f, i) => {
            const u = monte * f.v;
            pos.setXYZ(i, PUITS.x + Math.cos(f.a + u * 2) * (f.r + u * 0.15), yP + 1.0 + u * 1.6 + f.r, PUITS.z + Math.sin(f.a + u * 2) * (f.r + u * 0.15));
            const b = Math.max(0, 1 - monte / 6) * (0.5 + 0.5 * Math.sin(temps * 7 + f.ph));
            col.setXYZ(i, b, 0.85 * b, 0.5 * b);
          });
          pos.needsUpdate = true; col.needsUpdate = true;
          etincelles.material.size = 0.1 * k;
        }
        koban.rotation.y = temps * 1.4;
        return [];
      },
    };
  })();
  animes.push({ objet: okiku.objet, maj: (dt, temps, c) => okiku.maj(dt, temps, c) });

  // ---------------------------------------------------------------- Les gens
  // (la guide de la salle basse, et les gens du deuxième étage : cachés la caméra à un autre étage ; etage : le plancher
  // où ils se tiennent)
  const PEAU = P.peau, NOIR = '#2a2420', SAL = [SALLE.x0, SALLE.x1, SALLE.z0, SALLE.z1, T3.h - 2, Y_SOCLE + 1];
  const MIL = [MILIEU.x0 - 0.5, MILIEU.x1 + 0.5, MILIEU.z0 - 0.5, MILIEU.z1 + 0.5, ETAGE2.y0 - 0.6, ETAGE2.y1 + 1.5];
  const PHOTO = { x: -1.4, z: -54.6 };
  const MERE = { x: NAPPE.x + 0.95, z: NAPPE.z - 0.45 }, JIJI = { x: NAPPE.x - 0.95, z: NAPPE.z + 0.35 }, SIEGE = { x: NAPPE.x + 0.15, z: NAPPE.z + 0.95 };
  const PEINTRE = { x: -7.6, z: -40.8 }, VIDEASTE = { x: 13.6, z: -41.6 };
  // (2026-10-25 : les gens des terrasses, cachés quand la caméra est hors de leur terrasse et à plus de 14 m d'eux ;
  // derrière les murs, on ne les voyait pas, et chacun coûtait douze appels de dessin vu de l'esplanade ou du pont)
  const SUR = (T) => [T.x0, T.x1, T.z0, T.z1], X0 = DONJON.x;
  const passants = [
    { id: 'gardien', x: -4.6, z: -3.6, cap: -2.2, tenue: { taille: 1.04, peau: PEAU, cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'casquette', c: '#2f3a5a', c2: '#c8a040' }, haut: '#2f3a5a', manches: 'longues', bas: { sorte: 'pantalon', c: '#2f3a5a' }, chaussures: '#2a2a2e', semelle: '#2a2a2e' } },
    { id: 'vieille', x: ETAL.x + 0.85, z: ETAL.z, cap: -PI / 2, tenue: { taille: 0.92, peau: '#f0c8a6', cheveux: '#d8d4cc', coiffure: 'chignon', chapeau: { sorte: 'foulard', c: '#e8e0d0' }, haut: '#6a7a8a', manches: 'longues', tablier: '#f2ead8', bas: { sorte: 'pantalon', c: '#4a4a56' }, chaussures: '#3a3236', semelle: '#3a3236', yeux: 'plisses' } },
    { id: 'mere', x: MERE.x, z: MERE.z, cap: vers(MERE.x, MERE.z, SIEGE.x, SIEGE.z), tenue: { taille: 0.98, peau: '#f2c9a8', cheveux: '#3a2a22', coiffure: 'queue', haut: '#e8a8b8', manches: 'longues', bas: { sorte: 'jupe', c: '#5a6a8a' }, chaussures: '#f4f0e6', semelle: '#3a3236', pose: 'seiza' } },
    { id: 'jiji', x: JIJI.x, z: JIJI.z, cap: vers(JIJI.x, JIJI.z, SIEGE.x, SIEGE.z), tenue: { taille: 0.95, peau: '#e8bf98', cheveux: '#e8e4dc', coiffure: 'chauve', haut: '#7a8a6a', manches: 'longues', bas: { sorte: 'pantalon', c: '#4a4a40' }, chaussures: '#7a5a3a', semelle: '#3a3236', pose: 'seiza', yeux: 'plisses' } },
    { id: 'petit', x: NAPPE.x + 2.4, z: NAPPE.z + 0.8, cap: 0, ronde: [[NAPPE.x + 2.4, NAPPE.z + 0.8], [NAPPE.x + 2.6, NAPPE.z + 3.6], [NAPPE.x - 1.6, NAPPE.z + 3.4], [NAPPE.x - 2.4, NAPPE.z - 1.6]], vitesse: 1.5, attente: [0.5, 2], tenue: { taille: 0.72, peau: PEAU, cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'casquette', c: '#e8452e', c2: '#ffffff' }, haut: '#f2c443', manches: 'courtes', bas: { sorte: 'short', c: '#3d5a8f' }, chaussures: P.blanc, semelle: '#3a3236' } },
    { id: 'samourai', x: 7.5, z: 3.0, cap: PI - 0.3, tenue: { taille: 1.1, peau: '#e8bf98', cheveux: NOIR, coiffure: 'chignon', chapeau: { sorte: 'bandeau', c: '#f4efe6' }, haut: '#3a2a2a', manches: 'kimono', col: '#c8a040', bas: { sorte: 'hakama', c: '#2a2a3a', c2: '#3a3a4a' }, chaussures: '#f4f0e6', semelle: '#c9b48a' } },
    { id: 'guide', x: DONJON.x + 3.8, z: DONJON.z + 3.2, cap: -2.4, dedans: SAL, tenue: { taille: 1.0, peau: '#f2c9a8', cheveux: '#4a3428', coiffure: 'queue', haut: '#a8452e', manches: 'longues', tablier: '#3a3a42', bas: { sorte: 'pantalon', c: '#3a3a42' }, chaussures: '#3a3236', semelle: '#3a3236' } },
    { id: 'peintre', x: PEINTRE.x, z: PEINTRE.z, dedans: SUR(T3), cap: vers(PEINTRE.x, PEINTRE.z, DONJON.x, DONJON.z) + 0.5, tenue: { taille: 1.0, peau: PEAU, cheveux: '#8a8478', coiffure: 'court', chapeau: { sorte: 'bob', c: '#c9b48a' }, haut: '#7a8f6a', manches: 'longues', tablier: '#c8b8a0', bas: { sorte: 'pantalon', c: '#5a4a3a' }, chaussures: '#5a3a2a', semelle: '#3a3236', yeux: 'plisses' } },
    { id: 'eleve', x: 2, z: -24.6, dedans: SUR(T2), cap: 0, ronde: [[2, -24.6], [-15, -24.8], [-15, -28.5], [2, -28.5]], vitesse: 1.3, attente: [1, 3], tenue: { taille: 0.8, peau: PEAU, cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'ecolier', c: '#f2c443' }, haut: '#ffffff', manches: 'courtes', bas: { sorte: 'short', c: '#2f3a5a' }, chaussures: P.blanc, semelle: '#3a3236', sac: { sorte: 'randoseru', c: '#c8302c', c2: '#7a1a18' } } },
    { id: 'jardinier', x: 12, z: -13.6, dedans: SUR(T1), cap: 0.4, tenue: { taille: 1.02, peau: '#e8bf98', cheveux: '#5a5650', coiffure: 'court', chapeau: { sorte: 'bandeau', c: '#2f4a7a' }, haut: '#5a6a5a', manches: 'longues', bas: { sorte: 'pantalon', c: '#4a4a40' }, chaussures: '#3a3236', semelle: '#3a3236', pose: 'balai', yeux: 'plisses' } },
    { id: 'touriste', x: -1.3, z: 31.6, cap: PI, tenue: { taille: 1.04, peau: PEAU, cheveux: '#c8a46a', coiffure: 'queue', chapeau: { sorte: 'soleil', c: '#f2e6c4' }, haut: '#4a8aa8', manches: 'courtes', bas: { sorte: 'pantalon', c: '#e8e2d4' }, chaussures: P.blanc, semelle: '#3a3236', sac: { sorte: 'dos', c: '#e8913a', c2: '#99673f' }, appareil: true } },
    { id: 'videaste', x: VIDEASTE.x, z: VIDEASTE.z, dedans: SUR(T3), cap: vers(VIDEASTE.x, VIDEASTE.z, DONJON.x, DONJON.z), tenue: { taille: 1.1, peau: PEAU, cheveux: '#3a2a20', coiffure: 'court', chapeau: { sorte: 'bob', c: '#2f3440' }, haut: '#2f3440', manches: 'courtes', bas: { sorte: 'pantalon', c: '#c9b48a' }, chaussures: P.blanc, semelle: '#3a3236', appareil: true } },
    { id: 'chaya', x: mC(0.1, 0.15)[0], z: mC(0.1, 0.15)[1], dedans: SUR(T3), cap: CHAYA.ry, tenue: { taille: 1.02, peau: '#e8bf98', cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'bandeau', c: '#f3efe4' }, haut: '#3f5a8a', manches: 'longues', tablier: '#f6efe0', bas: { sorte: 'pantalon', c: '#3a3a42' }, chaussures: '#3a3236', semelle: '#3a3236', yeux: 'plisses' } },
    { id: 'gourmande', x: mC(1.78, 3.4)[0], z: mC(1.78, 3.4)[1], dedans: SUR(T3), cap: CHAYA.ry, assis: T3.h + 0.495, tenue: { taille: 0.98, peau: '#f2c9a8', cheveux: '#5a3a2a', coiffure: 'queue', chapeau: { sorte: 'soleil', c: '#f2e6c4' }, haut: '#e89a6a', manches: 'courtes', bas: { sorte: 'jupe', c: '#4a5a7a' }, chaussures: P.blanc, semelle: '#3a3236', sac: { sorte: 'dos', c: '#7a9a5a', c2: '#4a6a3a' } } },
    // au deuxième étage : le guide bénévole, la petite fille à la fenêtre (trop haute pour elle), le photographe
    { id: 'benevole', x: X0 - 6.55, z: DONJON.z - 1.4, cap: PI / 2, etage: Y_MILIEU, dedans: MIL, tenue: { taille: 1.0, peau: '#e8bf98', cheveux: '#d8d4cc', coiffure: 'court', chapeau: { sorte: 'casquette', c: '#3a7a6a', c2: '#f4f0e6' }, haut: '#3a7a6a', manches: 'longues', bas: { sorte: 'pantalon', c: '#4a4a52' }, chaussures: '#e8e4dc', semelle: '#e8e4dc', yeux: 'plisses' } },
    { id: 'enfant', x: X0 - 2.2, z: MILIEU.z1 - 0.55, cap: 0, etage: Y_MILIEU, dedans: MIL, tenue: { taille: 0.7, peau: '#f2c9a8', cheveux: NOIR, coiffure: 'queue', haut: '#f29ab0', manches: 'courtes', bas: { sorte: 'jupe', c: '#f2e6c4' }, chaussures: '#f4f0e6', semelle: '#f4f0e6' } },
    { id: 'photographe', x: PHOTO.x, z: PHOTO.z, cap: vers(PHOTO.x, PHOTO.z, DONJON.x - 2.6, DONJON.z), etage: Y_MILIEU, dedans: MIL, tenue: { taille: 1.12, peau: '#f0c8a6', cheveux: '#d8b878', coiffure: 'court', haut: '#5a7a9a', manches: 'courtes', bas: { sorte: 'short', c: '#c9b48a' }, chaussures: '#e8e4dc', semelle: '#e8e4dc', sac: { sorte: 'dos', c: '#2f3440', c2: '#1f2430' }, appareil: true } },
  ];
  {
    // le chevalet du peintre et sa toile (le donjon peint) ; le trépied du vidéaste, qui filme le donjon
    const a = atelier(), cap = vers(PEINTRE.x, PEINTRE.z, DONJON.x, DONJON.z), R = repere(PEINTRE.x + Math.sin(cap) * 0.9, PEINTRE.z + Math.cos(cap) * 0.9, cap + PI), y = T3.h;
    for (const [lx, lz] of [[-0.3, 0.15], [0.3, 0.15], [0, -0.35]]) { const p = R(lx, y, lz), q = R(0, y, 0); a.baton([p.x, y, p.z], [q.x, y + 1.7, q.z], 0.02, '#8a6a4a', 4); }
    a.boite(0.7, 0.55, 0.03, '#f4efe2', R(0, y + 1.2, 0.08));
    ecrire({ ...R(0, y, 0), y }, { texte: '', fond: null, dessin: toileDonjon, x: 0, y: 1.2, z: 0.1, ry: 0, l: 0.66, h: 0.51 });
    const t = trepied(atelier()), capV = vers(VIDEASTE.x, VIDEASTE.z, DONJON.x, DONJON.z), xV = VIDEASTE.x + Math.sin(capV) * 0.75 + 0.45, zV = VIDEASTE.z + Math.cos(capV) * 0.75;
    poser(t.fin(0, peinture), xV, zV, { y: T3.h + 1.3, ry: capV });
    monde.cercle(xV, zV, 0.45);
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
    monde.cercle(R(0, 0, 0).x, R(0, 0, 0).z, 0.5);
  }

  // ---------------------------------------------------------------- Ce qu'on peut faire (tout passe par `jeu`)
  const parler = (id) => ({ id, passant: id, verbe: 'parler', action: (jeu) => jeu.dire(jeu.txn(id), id) });
  // (les arrivées des escaliers du donjon, après le texte de la montée : en bas, au pied de l'escalier ; au deuxième
  // étage, venant d'en bas, à côté de la trappe, ou venant d'en haut, au pied de l'escalier qui monte ; tout en haut, près
  // de la trappe)
  const ARRIVEES = {
    bas: [MONTEE.x - 0.4, MONTEE.z + 1.0, 0, SALLE.y],
    milieu: [TRAPPE2.x, TRAPPE2.z - 0.3, PI / 2, Y_MILIEU],
    milieuHaut: [MONTEE2.x, MONTEE2.z + 0.05, 0, Y_MILIEU],
    haut: [DESCENTE.x - 0.4, DESCENTE.z + 0.6, PI, Y_HAUT],
  };
  const arriver = async (jeu, ou, texte) => {
    await jeu.dire(jeu.tx(texte));
    jeu.placer(...ARRIVEES[ou]);
    jeu.cadrer(null);
  };
  const yN = terrain(NAPPE.x, NAPPE.z), zAutel = DONJON.z - ETAGES[4].D / 2 + 0.2 + 0.55;
  const interactions = [
    {
      // le gardien du château : il fait tomber la nuit (l'illumination du soir), et, la nuit, revenir le matin
      id: 'gardien', passant: 'gardien', verbe: 'parler',
      async action(jeu) {
        if (jeu.estNuit) {
          const r = await jeu.choisir(jeu.tx('gardienMatin'), [jeu.t('oui'), jeu.t('non')], 'gardien');
          if (r !== 0) { await jeu.dire(jeu.tx('gardienReste'), 'gardien'); return; }
          await jeu.nuit(false);
          await jeu.dire(jeu.tx('gardienJour'), 'gardien');
          return;
        }
        const r = await jeu.choisir(jeu.tx('gardien'), [jeu.t('oui'), jeu.t('non')], 'gardien');
        if (r !== 0) { await jeu.dire(jeu.tx('gardienNon'), 'gardien'); return; }
        await jeu.nuit(true);
        await jeu.dire(jeu.tx('gardienNuit'), 'gardien');
      },
    },
    {
      // la vieille dame de l'étal : un sachet de nourriture pour les carpes ; elle sait ce qu'on raconte sur le vieux puits
      id: 'vieille', passant: 'vieille', verbe: 'parler',
      async action(jeu) {
        if (jeu.estNuit) { await jeu.dire(jeu.tx('vieilleNuit'), 'vieille'); return; }
        if (jeu.aDansSac('fu')) { await jeu.dire(jeu.tx('vieilleFu'), 'vieille'); return; }
        const r = await jeu.choisir(jeu.tx(jeu.aTampon('koi') ? 'vieilleEncore' : 'vieille'), [jeu.t('oui'), jeu.t('non')], 'vieille');
        if (r === 0) {
          jeu.donner('fu');
          jeu.son('papier');
          await jeu.dire(jeu.tx('vieilleDonne'), 'vieille');
        } else await jeu.dire(jeu.tx('vieilleNon'), 'vieille');
        if (jeu.aTampon('koi')) await jeu.dire(jeu.tx('vieilleOkiku'), 'vieille');
      },
    },
    {
      // la maman du pique-nique : on s'assoit sur la bâche avec eux, un dango (le tampon)
      id: 'mere', passant: 'mere', verbe: 'parler',
      async action(jeu) {
        if (jeu.estNuit) { await jeu.dire(jeu.tx('mereNuit'), 'mere'); return; }
        if (jeu.aTampon('sakura')) { await jeu.dire(jeu.tx('mere2'), 'mere'); return; }
        const r = await jeu.choisir(jeu.tx('mere'), [jeu.t('oui'), jeu.t('non')], 'mere');
        if (r !== 0) { await jeu.dire(jeu.tx('mereNon'), 'mere'); return; }
        jeu.asseoir({ x: SIEGE.x, z: SIEGE.z, y: yN + 0.3, cap: PI + 0.2, libre: true }, { lacet: 0.6, tangage: 0.25, distance: 3.4 });
        await jeu.attendre(500);
        await jeu.dire(jeu.tx('pique'));
        await jeu.dire(jeu.tx('piqueFin'), 'mere');
        jeu.asseoir(null);
        await jeu.tampon('sakura');
      },
    },
    parler('jiji'), parler('petit'), parler('samourai'), parler('guide'), parler('peintre'), parler('eleve'), parler('jardinier'), parler('touriste'),
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
      // la porte en losange : on lève les yeux sur sa poutre aux losanges dorés et ses fenêtres en cloche (le tampon)
      id: 'hishi', x: HISHI.x, z: HISHI.z + 2.2, y: T1.h, rayon: 2.0, verbe: 'regarder',
      async action(jeu) {
        jeu.cadrer({ de: [HISHI.x + 2.2, T1.h + 1.3, HISHI.z + 6.6], vers: [HISHI.x, T1.h + 4.4, HISHI.z + 1.3], champ: 55 });
        await jeu.attendre(600);
        await jeu.dire(jeu.txn('hishi'));
        jeu.cadrer(null);
        if (!jeu.aTampon('hishi')) await jeu.tampon('hishi');
      },
    },
    {
      // les carpes, du pont : les regarder ; avec un sachet de nourriture, les nourrir (le tampon)
      id: 'koi', x: 1.7, z: 34.0, y: PONT.y, rayon: 2.4, haut: 1.4, verbe: (jeu) => (jeu.aDansSac('fu') ? 'nourrir' : 'regarder'),
      async action(jeu) {
        if (!jeu.aDansSac('fu')) { await jeu.dire(jeu.txn('koiRegarder')); return; }
        jeu.placer(1.9, 34.0, PI / 2, PONT.y);
        jeu.cadrer({ de: [5.2, PONT.y + 3.2, 37.4], vers: [4.4, DOUVES.eau, 33.4], champ: 52 });
        await jeu.attendre(400);
        jeu.geste('offrir');
        await jeu.attendre(300);
        jeu.son('plouf');
        carpes.nourrir(4.4, 34.0);
        await jeu.attendre(1100);
        jeu.geste(null);
        await jeu.dire(jeu.tx('koiNourrir'));
        await jeu.attendre(1400);
        jeu.prendre('fu');
        jeu.cadrer(null);
        if (!jeu.aTampon('koi')) { await jeu.dire(jeu.tx('koiFin')); await jeu.tampon('koi'); } else await jeu.dire(jeu.tx('koiEncore'));
      },
    },
    {
      // le puits d'Okiku : le jour, sa légende (le tampon) ; la nuit, le fantôme qui compte les assiettes ; avec la dixième,
      // la lui rendre (le secret)
      id: 'puits', x: PUITS.x, z: PUITS.z + 1.3, y: yP, rayon: 1.9, haut: 1.4,
      verbe: (jeu) => (okiku.kobanVisible() ? 'prendre' : secretTrouve('okiku') ? 'prier' : jeu.estNuit ? (jeu.aDansSac('assiette') ? 'rendre' : 'ecouter') : 'regarder'),
      async action(jeu) {
        if (okiku.kobanVisible()) {
          jeu.geste('offrir');
          await jeu.attendre(700);
          okiku.prendreKoban();
          await jeu.attendre(300);
          jeu.geste(null);
          await jeu.dire(jeu.tx('legende'));
          await jeu.trouverSecret('okiku');
          return;
        }
        if (secretTrouve('okiku')) { jeu.saluer(); await jeu.dire(jeu.txn('puitsApres')); return; }
        if (!jeu.estNuit) {
          if (jeu.aDansSac('assiette')) { await jeu.dire(jeu.tx('puitsJourAssiette')); return; }
          await jeu.dire(jeu.tx(jeu.aTampon('okiku') ? 'puits2' : 'puits'));
          if (!jeu.aTampon('okiku')) await jeu.tampon('okiku');
          return;
        }
        jeu.cadrerDeCote(PUITS.x, yP + 1.1, PUITS.z, { distance: 4.4, haut: 1.3 });
        await jeu.attendre(500);
        if (!jeu.aDansSac('assiette')) {
          // on entend compter, une à une, jusqu'à neuf ; un sanglot
          for (const page of jeu.tx('compte')) { okiku.compter(); jeu.son('assiette'); await jeu.dire([page]); }
          await jeu.dire(jeu.tx('sanglot'));
          jeu.voirIndice('okiku-nuit');
          jeu.cadrer(null);
          await jeu.dire(jeu.tx('okikuCompagnon')[jeu.compagnon], 'compagnon');
          return;
        }
        // on lui rend la dixième : elle compte jusqu'à dix, devient dorée, monte vers le ciel ; un koban sur le puits
        jeu.geste('offrir');
        await jeu.attendre(700);
        jeu.prendre('assiette');
        assiette.rendre();
        jeu.son('assiette');
        jeu.geste(null);
        await jeu.dire(jeu.tx('rendre'));
        for (const page of jeu.tx('compteDix')) { okiku.compter(); jeu.son('assiette'); await jeu.dire([page]); }
        okiku.apaiser();
        await jeu.dire(jeu.tx('okikuPaix'));
        okiku.monter();
        jeu.son('magie');
        await jeu.attendre(2600);
        okiku.montrerKoban();
        await jeu.dire(jeu.tx('kobanLueur'));
        jeu.cadrer(null);
        await jeu.dire(jeu.tx('okikuMerci')[jeu.compagnon], 'compagnon');
      },
    },
    {
      // la dixième assiette, dans l'impasse (on la voit une fois le fantôme entendu)
      id: 'assiette', x: ASSIETTE.x, z: ASSIETTE.z, y: T2.h, rayon: 1.6, haut: 0.8, verbe: 'ramasser',
      si: () => indiceVu('okiku-nuit') && !assietteRamassee && !secretTrouve('okiku'),
      async action(jeu) {
        jeu.geste('offrir');
        await jeu.attendre(600);
        assietteRamassee = true;
        jeu.donner('assiette');
        jeu.son('assiette');
        jeu.geste(null);
        await jeu.dire(jeu.tx('assietteTrouvee'));
        await jeu.dire(jeu.tx('assietteCompagnon')[jeu.compagnon], 'compagnon');
      },
    },
    {
      // monter (des coupures : des étages d'escaliers raides) : au deuxième étage, ou tout en haut (2026-10-25 : « devant
      // l'échelle, tu choisis deuxième étage ou le dernier ») ; redescendre, de même
      id: 'monter', x: MONTEE.x, z: MONTEE.z, y: SALLE.y, rayon: 1.5, haut: 1.6, verbe: 'monter',
      async action(jeu) {
        const r = await jeu.choisir(jeu.tx('monterOu'), jeu.tx('etagesHaut'));
        if (r !== 0 && r !== 1) return;
        jeu.cadrer({ de: [DONJON.x + 15, T3.h + 2.2, DONJON.z + 21], vers: [DONJON.x, ETAGES[r ? 3 : 1].y0, DONJON.z], champ: 50 });
        await jeu.attendre(500);
        await arriver(jeu, r ? 'haut' : 'milieu', r ? 'monterTexte' : 'monter2Texte');
        await jeu.attendre(200);
        await jeu.dire(jeu.tx(r ? 'enHaut' : 'auMilieu'));
      },
    },
    {
      id: 'descendre', x: DESCENTE.x, z: DESCENTE.z, y: Y_HAUT, rayon: 1.3, haut: 1.6, verbe: 'descendre',
      async action(jeu) {
        const r = await jeu.choisir(jeu.tx('descendreOu'), jeu.tx('etagesBas'));
        if (r !== 0 && r !== 1) return;
        jeu.cadrer({ de: [DONJON.x - 16, T3.h + 2.5, DONJON.z + 20], vers: [DONJON.x, ETAGES[r ? 2 : 1].y0, DONJON.z], champ: 50 });
        await jeu.attendre(500);
        await arriver(jeu, r ? 'bas' : 'milieuHaut', r ? 'descendreTexte' : 'descendreMilieuTexte');
      },
    },
    {
      // au deuxième étage : monter tout en haut, redescendre au sous-sol
      id: 'monter2', x: MONTEE2.x, z: MONTEE2.z, y: Y_MILIEU, rayon: 1.4, haut: 1.6, verbe: 'monter',
      async action(jeu) {
        jeu.cadrer({ de: [DONJON.x + 15, T3.h + 2.2, DONJON.z + 21], vers: [DONJON.x, ETAGES[3].y0, DONJON.z], champ: 50 });
        await jeu.attendre(500);
        await arriver(jeu, 'haut', 'monterHautTexte');
        await jeu.attendre(200);
        await jeu.dire(jeu.tx('enHaut'));
      },
    },
    {
      id: 'descendre2', x: TRAPPE2.x, z: TRAPPE2.z, y: Y_MILIEU, rayon: 1.3, haut: 1.6, verbe: 'descendre',
      async action(jeu) {
        jeu.cadrer({ de: [DONJON.x - 16, T3.h + 2.5, DONJON.z + 20], vers: [DONJON.x, ETAGES[0].y0, DONJON.z], champ: 50 });
        await jeu.attendre(500);
        await arriver(jeu, 'bas', 'descendreBasTexte');
      },
    },
    {
      // la vue par une fenêtre du sud du deuxième étage, entre ses barreaux de bois
      id: 'fenetre2', x: DONJON.x, z: MILIEU.z1 - 0.55, y: Y_MILIEU, rayon: 1.2, haut: 1.7, verbe: 'regarder',
      async action(jeu) {
        jeu.placer(DONJON.x, MILIEU.z1 - 0.75, 0, Y_MILIEU);
        jeu.cadrer({ de: [DONJON.x, Y_FEN2 + 0.05, MILIEU.z1 - 0.25], vers: [DONJON.x + 1, 4, -20], champ: 55 });
        await jeu.attendre(700);
        await jeu.dire(jeu.txn('fenetre2'));
        jeu.cadrer(null);
      },
    },
    { id: 'bukikake', x: DONJON.x + 2.8, z: MOYA.z1 + 0.7, y: Y_MILIEU, rayon: 1.6, verbe: 'regarder', action: (jeu) => jeu.dire(jeu.tx('bukikake')) },
    { id: 'pilierEst', x: DONJON.x + 2.6, z: DONJON.z + 0.9, y: Y_MILIEU, rayon: 1.5, verbe: 'regarder', action: (jeu) => jeu.dire(jeu.tx('pilierEst')) },
    { id: 'vitrine', x: DONJON.x, z: DONJON.z - 0.3, y: Y_MILIEU, rayon: 1.3, haut: 1.0, verbe: 'regarder', action: (jeu) => jeu.dire(jeu.tx('vitrine')) },
    { id: 'meurtriere', x: MILIEU.x1 - 0.55, z: DONJON.z + 2.4, y: Y_MILIEU, rayon: 1.2, haut: 0.7, verbe: 'regarder', action: (jeu) => jeu.dire(jeu.tx('meurtriere')) },
    parler('benevole'), parler('enfant'), parler('photographe'),
    {
      // la vue du dernier étage, par la fenêtre du sud : le château, la ville, les montagnes (le tampon)
      id: 'tenshu', x: DONJON.x, z: HAUT.z1 - 0.6, y: Y_HAUT, rayon: 1.5, haut: 1.6, verbe: 'regarder',
      async action(jeu) {
        jeu.placer(DONJON.x - 0.9, HAUT.z1 - 1.5, 0, Y_HAUT);
        jeu.cadrer({ de: [DONJON.x, Y_HAUT + 1.45, HAUT.z1 - 0.2], vers: [DONJON.x + 2, 3, 30], champ: 60 });
        await jeu.attendre(700);
        await jeu.dire(jeu.txn('tenshu'));
        jeu.cadrer(null);
        if (!jeu.aTampon('tenshu')) await jeu.tampon('tenshu');
      },
    },
    {
      // le petit sanctuaire d'Osakabe, la princesse qui protège le château
      id: 'osakabe', x: DONJON.x, z: zAutel + 1.6, y: Y_HAUT, rayon: 1.3, haut: 1.6, verbe: 'prier',
      async action(jeu) {
        jeu.son('cloche');
        jeu.geste('prier');
        await jeu.attendre(2150); jeu.son('claque');
        await jeu.attendre(470); jeu.son('claque');
        await jeu.attendre(1900);
        jeu.geste(null);
        await jeu.dire(jeu.txn('osakabe'));
      },
    },
    { id: 'piliers', x: DONJON.x - 2.6, z: DONJON.z + 1.4, y: SALLE.y, rayon: 1.6, verbe: 'regarder', action: (jeu) => jeu.dire(jeu.tx('piliers')) },
    { id: 'fusils', x: SALLE.x0 + 1.1, z: DONJON.z, y: SALLE.y, rayon: 1.7, verbe: 'regarder', action: (jeu) => jeu.dire(jeu.tx('fusils')) },
    { id: 'armure', x: DONJON.x - 3.3, z: SALLE.z0 + 1.6, y: SALLE.y, rayon: 1.8, verbe: 'regarder', action: (jeu) => jeu.dire(jeu.tx('armure')) },
    ...Object.entries(PANNEAUX).map(([id, p]) => ({ id: `panneau-${id}`, x: p.x, z: p.z, rayon: 1.8, verbe: 'lire', action: (jeu) => jeu.dire(jeu.tx(`panneau-${id}`)) })),
    {
      // le marchand du salon de thé : une brochette d'oden de Himeji ; fermé la nuit
      id: 'chaya', passant: 'chaya', verbe: 'parler',
      async action(jeu) {
        if (jeu.estNuit) { await jeu.dire(jeu.tx('chayaNuit'), 'chaya'); return; }
        const r = await jeu.choisir(jeu.tx('chaya'), [jeu.t('oui'), jeu.t('non')], 'chaya');
        if (r !== 0) { await jeu.dire(jeu.tx('chayaNon'), 'chaya'); return; }
        jeu.saluer();
        await jeu.dire(jeu.tx('oden'));
        await jeu.dire(jeu.tx('odenCompagnon')[jeu.compagnon], 'compagnon');
      },
    },
    parler('gourmande'),
    { id: 'carteChaya', x: mC(-2.35, 2.1)[0], z: mC(-2.35, 2.1)[1], y: T3.h, rayon: 1.3, haut: 1.0, verbe: 'lire', action: (jeu) => jeu.dire(jeu.txn('carteChaya')) },
    { id: 'glace', x: mC(2.35, 2.2)[0], z: mC(2.35, 2.2)[1], y: T3.h, rayon: 1.3, haut: 1.9, verbe: 'regarder', action: (jeu) => jeu.dire(jeu.tx('glace')) },
    ...interactionsBancs(bancs),
  ];
  // les bêtes : les regarder
  const actionBete = async (jeu, b) => { await jeu.dire(jeu.tx(b.sorte)); };

  // ---------------------------------------------------------------- Pour la caméra et les captures
  const depart = { x: DEPART.x, z: DEPART.z, cap: PI };
  const heros = { x: -2.2, z: 13.6 };
  return {
    ...infos, textes: TEXTES,
    objets, monde, terrain, etiquettes, passants, daims: [], interactions, actionDaim: null, vapeurs, bancs, lumieres, actionBete, animes,
    // (le secret, tresors.js ; le marchand, sous les cerisiers de l'esplanade ; les sons à fabriquer en plus ; les feux
    // d'artifice, tirés derrière le donjon)
    secret: 'okiku', marchand: MARCHAND, sons: ['assiette', 'plouf', 'cloche', 'claque', 'papier'],
    feux: { x: 0, y: 0, z: -125, large: 60, haut: [50, 74] },
    // les douves : une eau calme, verte, où l'on voit passer les carpes ; le long des bords, le reflet gris des murs
    eauxCalmes, eauCalme: { boue: '#4d6a54', bord: '#5b5d55', clarte: 0.48 },
    // les bêtes (betes.js) : des aigrettes blanches (les « hérons blancs » qui ont donné son nom au château) sur les
    // pelouses, des libellules le long des douves
    betes: {
      aigrettes: [[[24, 5], [32, 12], [16, 9]], [[-30, 11], [-12, 12], [-34, -2]]],
      libellules: [[9, 21.5], [-14, 20.5], [23, 21.8], [-30, 21]],
    },
    aspectSol: (x, z, h) => aspectSol(P, x, z, h),
    etendue: { x0: -720, x1: 720, z0: -720, z1: 720, pas: 4, fin: { x0: -82, x1: 82, z0: -96, z1: 62, pas: 1 } },
    // le vent de la plaine ; le milan noir tourne au-dessus du château, la bouscarle chante sur la colline ; les insectes
    // la nuit
    vent: { dir: [0.4, 0.9], force: 0.8 }, oiseaux: ['milan', 'uguisu'], ambiances: ['insectes'],
    brume: [140, 1800],
    rais: [[-39.5, 1.5], [-36.5, 4.5], [-42, -1.5]].map(([x, z], i) => ({ x, z, haut: 9, r0: 0.3, r1: 1.0 + 0.25 * i, force: 0.08 })),
    soleil: [-0.42, 0.72, 0.55],
    depart,
    photos: {
      heros: { ...heros, cap: PI, lacet: 0.15, tangage: 0.05, distance: 6.0 },
      perso: { x: depart.x, z: depart.z, cap: 0, lacet: 0.05, tangage: 0.1, distance: 3.9 },
    },
  };
}

// ---------------------------------------------------------------- Le sol, les dessins
/** La ville : des rues tous les 60 m (l'asphalte), leurs trottoirs, les îlots. */
function ville(P, x, z) {
  const mx = ((x % 60) + 60) % 60, mz = (((z - 35) % 60) + 60) % 60;
  if (mx < 5 || mx > 55 || mz < 5 || mz > 55) return [P.route, M.route];
  if (mx < 7 || mx > 53 || mz < 7 || mz > 53) return ['#cfc8ba', M.dalles];
  return ['#bdb7aa', M.dalles];
}
/** Le sol (sa couleur et sa matière, textures.js) en x, z, à la hauteur h. */
function aspectSol(P, x, z, h) {
  const bruit = bruitDoux(x, z, 4);
  // les douves : le fond, sous l'eau
  if (z > DOUVES.z0 - 0.3 && z < DOUVES.z1 + 0.3 && x > DOUVES.x0 && x < DOUVES.x1) return [P.rocheSombre, M.roche];
  // de l'autre côté des douves : le trottoir, la rue le long de l'eau, l'avenue, la ville
  if (z > DOUVES.z1) {
    if (z < ARRIVEE.z1 + 0.4) return [bruit > 0.5 ? '#d3ccbd' : '#cbc4b4', M.dalles];
    if (z < 56) return [P.route, M.route];
    if (z < 58.5 || (Math.abs(x) > 11 && Math.abs(x) < 14)) return ['#cfc8ba', M.dalles];
    if (Math.abs(x) < 11) return [P.route, M.route];
    return ville(P, x, z);
  }
  // l'esplanade : les allées de gravier, la pelouse (plus sombre sous les cerisiers)
  if (x > ESPLANADE.x0 && x < ESPLANADE.x1 && z > ESPLANADE.z0 && h < 0.4) {
    if (z > ENCEINTE_Z - 0.6 || (z > 18.5 && Math.abs(x) < 8)) return [P.chemin, M.terre];
    // (au pied des murs de pierre de la première terrasse et de la Nishi-no-maru, une bande de gravier : l'herbe y passait
    // au travers de la pierre)
    if (z < ESPLANADE.z0 + 0.55 || x < ESPLANADE.x0 + 0.65) return [P.gravierFonce, M.terre];
    for (const c of ALLEES) if (surLaLigne(c, x, z).d < 1.5 + 0.25 * bruitDoux(x, z, 1.5)) return [P.chemin, M.terre];
    for (const [cx, cz, ch] of CERISIERS) if (Math.hypot(x - cx, z - cz) < ch * 0.3 + 0.4 * bruit) return [P.herbeFonce, M.herbe];
    return [bruit > 0.62 ? P.herbeFonce : bruit > 0.3 ? P.herbe : '#92cc66', M.herbe];
  }
  // les terrasses : le gravier clair du château, une bande de galets au pied des murs
  for (const T of [T1, T2, T3, NISHI]) {
    const e = ecart(T, x, z);
    if (e <= 0.02 && h > T.h - 0.3) {
      // (au pied des arbres, un rond d'herbe : plantés à même le gravier, on aurait dit des piquets ; 2026-10-25)
      for (const [ax, az] of ARBRES_TERRASSES) {
        const d = Math.hypot(x - ax, z - az);
        if (d < 1.1 + 0.45 * bruitDoux(x * 1.7, z * 1.7, 0.9)) return [d < 0.65 ? P.herbeFonce : P.herbe, M.herbe];
      }
      return e > -0.9 ? [P.gravierFonce, M.terre] : [bruit > 0.55 ? P.gravier : '#dcd6c6', M.terre];
    }
  }
  // (juste derrière le haut des murs de pierre, le sol qui tombe du bord : de la terre, où ne poussent pas les touffes
  // d'herbe — elles passaient au travers des pierres et du chaperon)
  for (const T of [T1, T2, T3, NISHI]) { const e = ecart(T, x, z); if (e > 0 && e < 1.6) return ['#7a6e5a', M.terre]; }
  // la colline : le sol de la forêt
  if (h > 0.4) return [bruit > 0.6 ? '#4b6539' : bruitDoux(x - 13, z + 29, 2.6) > 0.5 ? '#557a3a' : '#5c7642', M.sousBois];
  // les parcs autour du château, puis la ville
  if (Math.hypot(x, z + 25) < 125) return [bruit > 0.55 ? P.herbeFonce : P.herbe, M.herbe];
  return ville(P, x, z);
}

/** La toile du peintre : le donjon blanc, ses cinq toits gris, sur un ciel bleu, des cerisiers roses au pied. */
function toileDonjon(c, W, H) {
  const ciel = c.createLinearGradient(0, 0, 0, H);
  ciel.addColorStop(0, '#8cc2e8'); ciel.addColorStop(1, '#eaf2f0');
  c.fillStyle = ciel; c.fillRect(0, 0, W, H);
  c.fillStyle = '#7d9a5c'; c.fillRect(0, H * 0.78, W, H * 0.22);
  c.fillStyle = '#a99f8e'; c.beginPath(); c.moveTo(W * 0.22, H * 0.8); c.lineTo(W * 0.3, H * 0.62); c.lineTo(W * 0.7, H * 0.62); c.lineTo(W * 0.78, H * 0.8); c.fill();
  const etages = [[0.36, 0.5, 0.62], [0.32, 0.4, 0.5], [0.27, 0.31, 0.4], [0.22, 0.23, 0.31], [0.17, 0.14, 0.23]];
  etages.forEach(([l, y0, y1]) => {
    c.fillStyle = '#f6f3ec'; c.fillRect(W * (0.5 - l / 2), H * y0, W * l, H * (y1 - y0));
    c.fillStyle = '#5e666e'; c.beginPath(); c.moveTo(W * (0.5 - l / 2 - 0.06), H * y0 + H * 0.02); c.lineTo(W * (0.5 - l / 2 + 0.03), H * (y0 - 0.035)); c.lineTo(W * (0.5 + l / 2 - 0.03), H * (y0 - 0.035)); c.lineTo(W * (0.5 + l / 2 + 0.06), H * y0 + H * 0.02); c.fill();
  });
  for (const [x, r] of [[0.12, 0.1], [0.88, 0.11], [0.05, 0.07]]) { c.fillStyle = 'rgba(242, 176, 196, 0.9)'; c.beginPath(); c.arc(W * x, H * 0.8, W * r, 0, 2 * Math.PI); c.fill(); }
}

// ---------------------------------------------------------------- Les textes du lieu
const TEXTES = {
  fr: {
    noms: { gardien: 'Le gardien du château', vieille: 'La vieille dame', mere: 'La maman', jiji: 'Le grand-père', petit: 'Le petit garçon', samourai: 'Le samouraï', guide: 'La guide du donjon', peintre: 'Le peintre', eleve: 'L’écolier', jardinier: 'Le jardinier', touriste: 'La touriste', videaste: '@random_japan_place', chaya: 'Le marchand du salon de thé', gourmande: 'La gourmande', benevole: 'Le guide bénévole', enfant: 'La petite fille', photographe: 'Le photographe' },
    tampons: {
      sakura: ['Les cerisiers', 'Un pique-nique sur l’esplanade'],
      hishi: ['La porte en losange', 'L’entrée du labyrinthe'],
      okiku: ['Le puits d’Okiku', 'Une très vieille histoire'],
      tenshu: ['Le donjon', 'Tout en haut du Héron blanc'],
      koi: ['Les carpes', 'Nourrir les carpes des douves'],
    },
    'panneau-shiro': ['« Le château de Himeji 姫路城 »', 'On l’appelle le « Héron blanc » (白鷺城, Shirasagi-jō) : ses murs blancs ressemblent à un héron qui déploie ses ailes.', 'Son grand donjon date de 1609. Il n’a jamais été détruit : ni par la guerre, ni par le feu, ni par les tremblements de terre.', 'En 1993, il a été l’un des tout premiers sites du Japon classés au patrimoine mondial.'],
    'panneau-hishi': ['« Le chemin du donjon »', 'Pour arriver au donjon, il faut passer des portes, monter des escaliers… et ne pas se perdre !', 'Le chemin tourne, s’éloigne du donjon, revient : c’était fait exprès, pour perdre les ennemis.'],
    'panneau-sama': ['« Les meurtrières 狭間 (sama) »', 'Les trous ronds, triangulaires et carrés des murs blancs servaient à tirer sur l’ennemi : à l’arc, ou au fusil.', 'Le château de Himeji en a encore près de mille !'],
    'panneau-nishinomaru': ['« La Nishi-no-maru 西の丸 »', 'Le long de ce mur court un couloir de près de 300 mètres : le « couloir des cent travées » (百間廊下).', 'La princesse Sen y vivait, il y a 400 ans. Au bout, sa tour : la « tour du maquillage » (化粧櫓).'],
    'panneau-bizen': ['« La Bizen-maru 備前丸 »', 'D’ici, on voit tout le grand donjon, ses cinq toits les uns au-dessus des autres.', 'Dedans, six étages et un sous-sol : on peut monter tout en haut !'],
    gardien: ['Bienvenue au château de Himeji !', 'Le château ferme à cinq heures… mais ce soir, il y a l’illumination : les murs blancs brillent dans la nuit.', 'Tu veux rester pour la voir ?'],
    gardienNon: ['D’accord ! Bonne visite. Le chemin du donjon commence par cet escalier, là.'],
    gardienNuit: ['Regarde… Le Héron blanc s’allume dans la nuit.', 'Quand tu voudras revoir le matin, reviens me voir.'],
    gardienMatin: ['Le soleil ne va pas tarder à se lever. On attend le matin ?'],
    gardienReste: ['Alors profite de la nuit. Le château est si calme… On dit même qu’on y entend une voix, près du vieux puits.'],
    gardienJour: ['Bonjour ! Le château ouvre ses portes. Bonne journée !'],
    vieille: ['Bonjour, mon petit ! Tu veux nourrir les carpes des douves ?', 'Tiens, un sachet de nourriture. Pour toi, c’est gratuit !'],
    vieilleEncore: ['Encore un sachet pour les carpes ? Elles ont toujours faim !'],
    vieilleNon: ['Comme tu veux. Elles seront là si tu changes d’avis !'],
    vieilleDonne: ['Va sur le pont de bois et jette-leur la nourriture : tu vas voir, elles accourent !'],
    vieilleFu: ['Tu as déjà ton sachet ! Va vite sur le pont de bois.'],
    vieilleOkiku: ['Tu connais l’histoire du vieux puits, là-haut ? Celle d’Okiku…', 'Ma grand-mère disait que la nuit, près du puits, on entend une voix qui compte des assiettes : « une, deux… neuf ».', 'Et puis elle pleure, parce qu’il en manque une. La dixième n’a jamais été retrouvée…'],
    vieilleNuit: ['Mon étal est fermé pour ce soir.', 'Fais attention, la nuit, près du vieux puits… Okiku y compte ses assiettes.'],
    mere: ['Bonjour ! On pique-nique sous les cerisiers. Au printemps, quand ils sont en fleurs, toute la ville vient ici !', 'Tu veux t’asseoir avec nous ? On a des dango !'],
    mereNon: ['Pas de souci ! Bonne visite !'],
    pique: ['Tu t’assois sur la bâche bleue. Le grand-père te tend une brochette de dango : rose, blanc et vert.', 'Mmm… Moelleux et sucré. Au-dessus de vous, le donjon blanc brille entre les branches.'],
    piqueFin: ['Au Japon, on appelle ça le « hanami » : pique-niquer sous les cerisiers en fleurs.', 'Reviens au printemps, tout est rose !'],
    mere2: ['Encore un dango ? Ha ha ! Bonne visite !'],
    mereNuit: ['On reste regarder le château illuminé. C’est magnifique, non ?'],
    jiji: ['Je viens ici depuis que je suis tout petit.', 'Pendant la guerre, on a couvert le donjon d’un grand filet noir, pour que les avions ne le voient pas. Une bombe est tombée tout près… et n’a pas explosé !', 'Le Héron blanc a toujours eu de la chance.'],
    jijiNuit: ['La nuit, le château ressemble vraiment à un héron blanc qui va s’envoler…'],
    petit: ['Tu as vu les carpes dans les douves ? Il y en a une toute dorée !', 'Et des grands oiseaux blancs sur la pelouse : des aigrettes !'],
    petitNuit: ['Maman dit qu’il ne faut pas aller près du vieux puits la nuit…', 'Il paraît qu’on y entend une dame compter des assiettes. Brrr !'],
    samourai: ['Halte, voyageur ! Je garde le château du seigneur Ikeda Terumasa.', 'C’est lui qui a fait construire ce grand donjon, en 1609 : neuf ans de travaux !', '… Bon, en vrai, je suis un guide en costume. Bonne visite !'],
    samouraiNuit: ['Même la nuit, je monte la garde ! Ce château a bien des secrets…'],
    guide: ['Bienvenue dans le sous-sol du donjon ! Regarde ces deux grands piliers.', 'Chacun est fait d’un seul tronc d’arbre, haut comme tout le donjon : ils le tiennent debout depuis 400 ans.', 'Pour monter tout en haut, c’est l’escalier, là-bas. Attention, il est très raide !'],
    guideNuit: ['Le donjon est fermé la nuit… mais je fais une exception pour toi !', 'Tu connais la légende d’Okiku ? Une servante, accusée d’avoir perdu l’une des dix précieuses assiettes de son maître…', 'On dit que son fantôme hante le vieux puits, sur la deuxième terrasse.'],
    peintre: ['Je peins le donjon. Regarde : les cinq toits, les murs blancs…', 'Le plus dur, c’est le blanc : il change de couleur à chaque heure du jour !'],
    peintreNuit: ['La nuit, le blanc devient doré sous les projecteurs. Je vais devoir tout recommencer !'],
    eleve: ['On est en voyage scolaire ! On a monté tous les escaliers, ouf !', 'La maîtresse dit que le chemin tourne exprès, pour que les ennemis se perdent. Moi aussi, je me suis perdu…'],
    eleveNuit: ['Chut ! On s’est cachés pour voir le fantôme d’Okiku… Il paraît qu’elle apparaît près du puits, là-bas, à l’est.'],
    jardinier: ['Je ratisse le gravier tous les matins.', 'Les murs de pierre sont penchés et courbés comme un éventail : c’est pour ça qu’ils ne s’écroulent jamais.'],
    jardinierNuit: ['Le gravier est tout blanc sous la lune. On y voit même les traces de pas…'],
    touriste: ['Je photographie le château depuis le pont. C’est la plus belle vue !', 'Tu as vu les carpes, en bas ? Elles viennent quand on leur donne à manger.'],
    touristeNuit: ['Le château illuminé se reflète dans les douves… Magnifique !'],
    videaste: ['Salut ! Moi, c’est @random_japan_place. Je filme le donjon pour ma vidéo.', 'Tu veux la voir ?'],
    videasteNon: ['Pas de souci ! Bonne visite du Héron blanc !'],
    videasteApres: ['Merci d’avoir regardé ! Abonne-toi pour voir d’autres endroits du Japon !'],
    hishi: ['La porte en losange (菱の門, Hishi-no-mon).', 'Sur sa grande poutre, des losanges dorés ; au-dessus, deux fenêtres en forme de cloche, cerclées d’or.', 'C’est la plus grande porte du château, l’entrée du labyrinthe.'],
    hishiNuit: ['La nuit, les losanges dorés brillent à la lumière des lanternes.'],
    koiRegarder: ['Des carpes nagent dans l’eau verte des douves : rouges et blanches, noires, dorées…', 'Avec de quoi les nourrir, elles viendraient sûrement !'],
    koiRegarderNuit: ['On devine les carpes qui dorment dans l’eau noire.'],
    koiNourrir: ['Tu jettes une poignée de nourriture…', 'Les carpes accourent de partout et ouvrent grand la bouche hors de l’eau : « pop, pop, pop » !'],
    koiFin: ['Elles se bousculent, toutes contentes. Les carpes vivent très, très longtemps : certaines ont plus de cent ans !'],
    koiEncore: ['Les carpes se régalent encore !'],
    puits: ['Un vieux puits de pierre, sous un portique de bois. Un panneau : « お菊井戸 », le puits d’Okiku.', 'Il y a très longtemps, Okiku, une servante, gardait les dix précieuses assiettes de son maître.', 'Un jour, l’une d’elles a disparu. On l’a accusée, et on l’a jetée dans ce puits…', 'Depuis, dit-on, son fantôme y revient la nuit et compte les assiettes : « une, deux… neuf ». Toujours neuf.'],
    puits2: ['Le puits d’Okiku. On dit que la nuit, on y entend compter les assiettes…'],
    puitsJourAssiette: ['Tu as la dixième assiette… Mais Okiku ne vient que la nuit. Il faudra revenir quand il fera noir.'],
    compte: ['« Ichi-mai… ni-mai… san-mai… »', '« … yon-mai… go-mai… roku-mai… »', '« … nana-mai… hachi-mai… kyū-mai… »'],
    sanglot: ['« Une, deux, trois… neuf. »', 'Un sanglot monte du puits. « … Il en manque une. Où est la dixième ? »', 'La petite flamme bleue tremble au-dessus du puits.'],
    okikuCompagnon: {
      kon: ['« Elle cherche la dixième assiette… Elle doit être quelque part dans le château. Cherchons partout, même là où le chemin ne mène nulle part. »'],
      pon: ['« Brr ! Un fantôme ! … Mais elle a l’air si triste. On cherche l’assiette ? Les coins perdus, c’est mon rayon ! »'],
      chapu: ['« Une assiette perdue ? Moi, je trouve tout ! Regardons dans les recoins du labyrinthe ! »'],
      gao: ['« Gao… Je n’ai pas peur. Cherchons l’assiette, pour qu’elle puisse se reposer. »'],
      fuwa: ['« Fuwa… Sa voix est triste comme la pluie. Trouvons la dixième ! »'],
      saya: ['« Une âme qui ne peut pas partir… Elle attend la dixième assiette. Elle doit être cachée là où l’on se perd. »'],
    },
    assietteTrouvee: ['Dans le coin de l’impasse, sous de vieilles feuilles, quelque chose brille faiblement…', 'Une assiette de porcelaine blanche au décor bleu. La dixième !'],
    assietteCompagnon: {
      kon: ['« Rapportons-la au puits, la nuit ! »'],
      pon: ['« Une assiette ! Il ne manque que le repas dessus… Allez, au puits ! »'],
      chapu: ['« Je savais qu’on la trouverait ! Vite, au puits ! »'],
      gao: ['« Bien. Rapportons-la à Okiku. »'],
      fuwa: ['« Fuwa ! Elle va être si contente ! »'],
      saya: ['« Elle l’attend depuis si longtemps… »'],
    },
    rendre: ['Tu poses doucement la dixième assiette sur la pile, au bord du puits.'],
    compteDix: ['« … hachi-mai… kyū-mai… »', '« … jū-mai ! »'],
    okikuPaix: ['« Dix. Elles y sont toutes… »', '« Merci. Je peux enfin me reposer. »', 'La petite flamme devient dorée.'],
    kobanLueur: ['La flamme monte vers le ciel parmi des étincelles, et s’éteint doucement.', 'Sur le couvercle du puits, quelque chose brille : une pièce d’or.'],
    okikuMerci: {
      kon: ['« Elle est partie en paix. Inari soit loué… »'],
      pon: ['« Snif… Je ne pleure pas, c’est le vent ! »'],
      chapu: ['« On a réussi ! Elle avait l’air si heureuse ! »'],
      gao: ['« Gao. Elle n’a plus besoin qu’on veille sur elle. »'],
      fuwa: ['« Fuwaaa… Elle est montée comme une étoile ! »'],
      saya: ['« Elle est libre, maintenant. Comme une feuille dans le vent. »'],
    },
    legende: ['Un koban, une pièce d’or d’autrefois.', 'C’est l’histoire du « Banshū Sarayashiki » (播州皿屋敷), la maison aux assiettes : l’une des plus célèbres histoires de fantômes du Japon.', 'Au château de Himeji, le puits d’Okiku est toujours là.'],
    puitsApres: ['Le puits d’Okiku. Tout est calme. Tu joins les mains un instant.'],
    puitsApresNuit: ['Le puits est silencieux. Les dix assiettes sont empilées sur la margelle. Okiku repose en paix.'],
    monterTexte: ['Tu montes des escaliers de bois très raides… un étage, deux, trois…', '… quatre, cinq, six. Te voilà tout en haut du donjon !'],
    enHaut: ['Le dernier étage du donjon. Par les fenêtres, tout le château, et la ville jusqu’aux montagnes.'],
    descendreTexte: ['Tu redescends les six étages en tenant bien la rampe…'],
    monterOu: ['Un escalier de bois très raide. Jusqu’où montes-tu ?'],
    etagesHaut: ['Au deuxième étage', 'Tout en haut'],
    descendreOu: ['Jusqu’où descends-tu ?'],
    etagesBas: ['Au deuxième étage', 'Au sous-sol'],
    monter2Texte: ['Tu montes des escaliers de bois très raides… un étage, deux.', 'Te voici au deuxième étage !'],
    auMilieu: ['Au milieu, une grande pièce. Tout autour, un long couloir de bois : le couloir des guerriers (武者走り, musha-bashiri).', 'En cas d’attaque, les soldats y couraient d’une fenêtre à l’autre.'],
    monterHautTexte: ['Encore des escaliers raides… trois, quatre, cinq, six.', 'Te voilà tout en haut du donjon !'],
    descendreBasTexte: ['Tu redescends deux étages en tenant bien la rampe, jusqu’au sous-sol…'],
    descendreMilieuTexte: ['Tu redescends quatre étages en tenant bien la rampe… Te revoilà au deuxième étage.'],
    bukikake: ['« 武具掛け » (bugukake) : des râteliers d’armes, tout le long des murs.', 'Sur ces chevilles de bois, on posait des fusils et des lances. Il y avait de la place pour des centaines d’armes !', 'Le donjon était le dernier refuge du château : il fallait pouvoir s’y défendre longtemps.'],
    pilierEst: ['Le grand pilier de l’est (東大柱). Avec celui de l’ouest, il traverse tous les planchers, du sous-sol jusqu’au sixième étage.', 'Les deux piliers portent le donjon comme une colonne vertébrale.'],
    vitrine: ['De vieilles tuiles des toits du château, gardées après les grands travaux.', 'Au bout de chaque tuile ronde, un blason (家紋, kamon) : les seigneurs qui ont réparé le château y mettaient celui de leur famille.'],
    fenetre2: ['Entre les barreaux de bois : les toits gris du château, la terrasse, et la ville au loin.', 'Les fenêtres sont petites, avec des barreaux : on voyait l’ennemi sans être vu.'],
    fenetre2Nuit: ['Dehors, la ville brille dans la nuit. Juste en dessous, les toits du château luisent sous les projecteurs.'],
    meurtriere: ['Sous la fenêtre, un petit volet de bois. Derrière, un trou dans le mur : rond, carré ou en triangle (狭間, sama).', 'On y passait le canon d’un fusil, ou on tirait des flèches. Le château en compte des centaines !'],
    benevole: ['Bonjour ! Je suis guide bénévole : je fais visiter le château le week-end.', 'Tu vois ce couloir qui fait le tour de l’étage ? C’est le musha-bashiri, le couloir des guerriers.', 'Et ce plancher qui brille… Tout le monde visite en chaussettes : on enlève ses chaussures à l’entrée du donjon !'],
    benevoleNuit: ['Le soir, le donjon est tout calme. Écoute… le vieux bois craque sous nos pas.', 'Quatre cents ans de chaussettes, ça polit un plancher !'],
    enfant: ['Je veux voir dehors… mais la fenêtre est trop haute !', 'Hop, sur la pointe des pieds… Je vois les toits ! On dirait des vagues grises !'],
    enfantNuit: ['Maman a dit qu’on rentrait après les illuminations. Encore cinq minutes !'],
    photographe: ['Wow… Regarde ce pilier ! Pardon, je viens d’Australie.', 'Chez moi, rien n’est aussi vieux. Ce bois a quatre cents ans… Je prends tout en photo !'],
    tenshu: ['Tout en bas, les toits gris et les murs blancs du château, ses terrasses, l’esplanade et ses cerisiers.', 'Plus loin, la grande avenue file tout droit jusqu’à la gare de Himeji. Et au fond, les montagnes.', 'D’ici, le seigneur du château voyait tout son domaine.'],
    tenshuNuit: ['La ville brille de mille fenêtres allumées. Tout en bas, les murs blancs du château luisent dans la nuit.'],
    osakabe: ['Tu fais tinter la cloche, tu salues deux fois, deux battements de mains…', 'Le petit sanctuaire d’Osakabe (長壁神社), qui protège le château depuis toujours.', 'On raconte qu’Osakabe, une princesse-esprit, vivait cachée tout en haut du donjon, et qu’elle a donné une épée au célèbre samouraï Miyamoto Musashi.'],
    osakabeNuit: ['La nuit, tout en haut du donjon, on se sent observé… La princesse Osakabe veille.'],
    piliers: ['Le grand pilier de l’ouest (西大柱) : un seul tronc de sapin, haut de 25 mètres, du sous-sol jusqu’au toit.', 'Il y a soixante ans, pour réparer le château, il a fallu le remplacer : on a cherché dans tout le Japon un arbre assez grand !'],
    fusils: ['Des râteliers d’armes : des fusils (鉄砲) et des lances, prêts pour une bataille.', 'Pourtant, le château de Himeji n’a jamais été attaqué.'],
    armure: ['Deux armures de samouraï (鎧, yoroi), posées sur leurs coffres.', 'Des plaques laquées, cousues de cordons de soie bleue ou rouge ; le casque (兜, kabuto) et ses cornes dorées.', 'En temps de paix, on rangeait l’armure dans son coffre. À la guerre, le coffre partait avec elle.'],
    aigrette: ['Une aigrette blanche, toute fine, qui marche lentement dans l’herbe.', 'C’est elle, le « héron blanc » (白鷺, shirasagi) qui a donné son surnom au château !'],
    libellule: ['Une libellule rouge (akatombo) passe au-dessus de l’herbe.'],
    chaya: ['Bienvenue au salon de thé ! Après tous ces escaliers, une petite pause ?', 'Ici, la spécialité, c’est l’oden de Himeji : des légumes et des œufs mijotés dans un bouillon… qu’on mange avec une sauce soja au gingembre !', 'Tu veux goûter ?'],
    chayaNon: ['Pas de souci ! Il y a aussi des dango, et une glace au thé vert. Reviens quand tu veux !'],
    chayaNuit: ['Le salon de thé est fermé pour ce soir. La marmite d’oden refroidit…', 'Reviens demain matin !'],
    oden: ['Le marchand te tend une brochette fumante : un œuf, un morceau de radis daikon, du konjac.', 'Tu la trempes dans la sauce soja au gingembre… C’est chaud, doux et piquant à la fois. Délicieux !'],
    odenCompagnon: {
      kon: ['« Un œuf qui a mijoté toute la matinée… Il a le goût du bouillon ! »'],
      pon: ['« Encore une brochette ? Et une autre ? Pon pon, j’ai un ventre de tanuki ! »'],
      chapu: ['« Ça fume comme une source chaude ! Attention, ça brûle la langue ! »'],
      gao: ['« Le gingembre, ça réveille ! Gao ! »'],
      fuwa: ['« Fuwa… Le bouillon est doux comme la mer. »'],
      saya: ['« Le radis a poussé tout l’hiver dans la terre froide… Il est si tendre. »'],
    },
    gourmande: ['Je fais une pause : un dango et un thé vert, avec le donjon juste là… Le bonheur !', 'Tu as goûté l’oden ? Ici, on le mange avec du gingembre. C’est une spécialité de Himeji !'],
    gourmandeNuit: ['Je voulais voir le château illuminé… mais le salon de thé est fermé. Tant pis pour mon dango !'],
    carteChaya: ['« お品書き » : la carte.', 'Oden de Himeji (姫路おでん) : 400 yens. Dango (団子) : 200 yens. Glace au matcha (抹茶ソフト) : 350 yens. Le thé vert est offert !'],
    carteChayaNuit: ['En bas de la carte, écrit à la craie : « Fermé. À demain ! »'],
    glace: ['Un grand cornet en plastique : une glace au thé vert (抹茶ソフト, matcha sofuto).', 'Au Japon, on en trouve dans presque tous les lieux touristiques, chacun avec son parfum. Ici, le matcha !'],
  },
  en: {
    noms: { gardien: 'Castle keeper', vieille: 'Old lady', mere: 'Mom', jiji: 'Grandpa', petit: 'Little boy', samourai: 'Samurai', guide: 'Keep guide', peintre: 'Painter', eleve: 'Schoolboy', jardinier: 'Gardener', touriste: 'Tourist', videaste: '@random_japan_place', chaya: 'Tea stall keeper', gourmande: 'Snacking visitor', benevole: 'Volunteer guide', enfant: 'Little girl', photographe: 'Photographer' },
    tampons: {
      sakura: ['The cherry trees', 'A picnic on the lawn'],
      hishi: ['The Diamond Gate', 'Into the maze'],
      okiku: ['Okiku’s well', 'A very old story'],
      tenshu: ['The keep', 'At the top of the White Heron'],
      koi: ['The koi', 'Feeding the koi in the moat'],
    },
    'panneau-shiro': ['“Himeji Castle 姫路城”', 'It is called the “White Heron Castle” (白鷺城, Shirasagi-jō): its white walls look like a heron spreading its wings.', 'Its great keep dates from 1609. It was never destroyed: not by war, not by fire, not by earthquakes.', 'In 1993 it became one of Japan’s very first World Heritage Sites.'],
    'panneau-hishi': ['“The path to the keep”', 'To reach the keep you must go through gates, climb stairs… and not get lost!', 'The path turns, moves away from the keep, comes back: on purpose, to confuse enemies.'],
    'panneau-sama': ['“The loopholes 狭間 (sama)”', 'The round, triangular and square holes in the white walls were for shooting at enemies: with bows, or with guns.', 'Himeji Castle still has almost a thousand of them!'],
    'panneau-nishinomaru': ['“The Nishi-no-maru 西の丸”', 'Along this wall runs a corridor almost 300 meters long: the “Hundred-Bay Corridor” (百間廊下).', 'Princess Sen lived here 400 years ago. At its end stands her tower: the “Make-up Tower” (化粧櫓).'],
    'panneau-bizen': ['“The Bizen-maru 備前丸”', 'From here you see the whole great keep, its five roofs one above the other.', 'Inside: six floors and a basement. You can climb all the way up!'],
    gardien: ['Welcome to Himeji Castle!', 'The castle closes at five… but tonight there’s the illumination: the white walls glow in the dark.', 'Do you want to stay and see it?'],
    gardienNon: ['All right! Enjoy your visit. The path to the keep starts with those stairs, there.'],
    gardienNuit: ['Look… The White Heron lights up in the night.', 'When you want the morning back, come and talk to me.'],
    gardienMatin: ['The sun will be up soon. Shall we wait for the morning?'],
    gardienReste: ['Then enjoy the night. The castle is so quiet… They even say you can hear a voice near the old well.'],
    gardienJour: ['Good morning! The castle is opening its gates. Have a nice day!'],
    vieille: ['Hello, dear! Would you like to feed the koi in the moat?', 'Here, a bag of food. For you, it’s free!'],
    vieilleEncore: ['Another bag for the koi? They’re always hungry!'],
    vieilleNon: ['As you like. They’ll be there if you change your mind!'],
    vieilleDonne: ['Go onto the wooden bridge and throw them the food: you’ll see, they’ll come rushing!'],
    vieilleFu: ['You already have your bag! Hurry to the wooden bridge.'],
    vieilleOkiku: ['Do you know the story of the old well up there? Okiku’s story…', 'My grandmother used to say that at night, near the well, you hear a voice counting plates: “one, two… nine”.', 'And then she cries, because one is missing. The tenth was never found…'],
    vieilleNuit: ['My stall is closed for tonight.', 'Be careful near the old well at night… Okiku counts her plates there.'],
    mere: ['Hello! We’re having a picnic under the cherry trees. In spring, when they bloom, the whole town comes here!', 'Would you like to sit with us? We have dango!'],
    mereNon: ['No problem! Enjoy your visit!'],
    pique: ['You sit on the blue tarp. Grandpa hands you a skewer of dango: pink, white and green.', 'Mmm… Soft and sweet. Above you, the white keep shines between the branches.'],
    piqueFin: ['In Japan this is called “hanami”: picnicking under the cherry blossoms.', 'Come back in spring, everything is pink!'],
    mere2: ['Another dango? Ha ha! Enjoy your visit!'],
    mereNuit: ['We’re staying to watch the illuminated castle. Isn’t it beautiful?'],
    jiji: ['I’ve been coming here since I was very little.', 'During the war, they covered the keep with a huge black net so the planes couldn’t see it. A bomb fell right next to it… and didn’t explode!', 'The White Heron has always been lucky.'],
    jijiNuit: ['At night, the castle really looks like a white heron about to fly away…'],
    petit: ['Did you see the koi in the moat? There’s a golden one!', 'And big white birds on the lawn: egrets!'],
    petitNuit: ['Mom says we shouldn’t go near the old well at night…', 'They say you can hear a lady counting plates there. Brrr!'],
    samourai: ['Halt, traveler! I guard the castle of Lord Ikeda Terumasa.', 'He had this great keep built, in 1609: nine years of work!', '… Well, actually, I’m a guide in costume. Enjoy your visit!'],
    samouraiNuit: ['Even at night I stand guard! This castle has many secrets…'],
    guide: ['Welcome to the basement of the keep! Look at these two great pillars.', 'Each is made from a single tree trunk, as tall as the whole keep: they’ve held it up for 400 years.', 'To climb to the top, take the stairs over there. Careful, they’re very steep!'],
    guideNuit: ['The keep is closed at night… but I’ll make an exception for you!', 'Do you know the legend of Okiku? A servant accused of losing one of her master’s ten precious plates…', 'They say her ghost haunts the old well, on the second terrace.'],
    peintre: ['I’m painting the keep. Look: the five roofs, the white walls…', 'The hardest part is the white: it changes color every hour of the day!'],
    peintreNuit: ['At night, the white turns golden under the floodlights. I’ll have to start all over!'],
    eleve: ['We’re on a school trip! We climbed all the stairs, phew!', 'The teacher says the path turns on purpose, so enemies get lost. I got lost too…'],
    eleveNuit: ['Shh! We’re hiding to see Okiku’s ghost… They say she appears near the well, over there, to the east.'],
    jardinier: ['I rake the gravel every morning.', 'The stone walls lean and curve like a fan: that’s why they never collapse.'],
    jardinierNuit: ['The gravel is all white under the moon. You can even see the footprints…'],
    touriste: ['I’m photographing the castle from the bridge. It’s the best view!', 'Did you see the koi down there? They come when you feed them.'],
    touristeNuit: ['The illuminated castle is reflected in the moat… Beautiful!'],
    videaste: ['Hi! I’m @random_japan_place. I’m filming the keep for my video.', 'Want to see it?'],
    videasteNon: ['No problem! Enjoy the White Heron!'],
    videasteApres: ['Thanks for watching! Follow me to see more places in Japan!'],
    hishi: ['The Diamond Gate (菱の門, Hishi-no-mon).', 'On its great beam, golden diamonds; above it, two bell-shaped windows rimmed with gold.', 'It’s the largest gate in the castle, the entrance to the maze.'],
    hishiNuit: ['At night, the golden diamonds shine in the lantern light.'],
    koiRegarder: ['Koi swim in the green water of the moat: red and white, black, golden…', 'With something to feed them, they’d surely come!'],
    koiRegarderNuit: ['You can just make out the koi sleeping in the dark water.'],
    koiNourrir: ['You throw a handful of food…', 'The koi rush from everywhere and open their mouths wide above the water: “pop, pop, pop”!'],
    koiFin: ['They jostle each other, very happy. Koi live a very, very long time: some are over a hundred years old!'],
    koiEncore: ['The koi are feasting again!'],
    puits: ['An old stone well under a wooden frame. A sign: “お菊井戸”, Okiku’s well.', 'Long ago, Okiku, a servant, looked after her master’s ten precious plates.', 'One day, one of them disappeared. She was blamed, and thrown into this well…', 'Since then, they say, her ghost comes back at night and counts the plates: “one, two… nine”. Always nine.'],
    puits2: ['Okiku’s well. They say that at night you can hear someone counting plates…'],
    puitsJourAssiette: ['You have the tenth plate… But Okiku only comes at night. You’ll have to come back when it’s dark.'],
    compte: ['“Ichi-mai… ni-mai… san-mai…”', '“… yon-mai… go-mai… roku-mai…”', '“… nana-mai… hachi-mai… kyū-mai…”'],
    sanglot: ['“One, two, three… nine.”', 'A sob rises from the well. “… One is missing. Where is the tenth?”', 'The little blue flame trembles above the well.'],
    okikuCompagnon: {
      kon: ['“She’s looking for the tenth plate… It must be somewhere in the castle. Let’s look everywhere, even where the path leads nowhere.”'],
      pon: ['“Brr! A ghost! … But she looks so sad. Shall we look for the plate? Lost corners are my specialty!”'],
      chapu: ['“A lost plate? I find everything! Let’s check the nooks of the maze!”'],
      gao: ['“Gao… I’m not afraid. Let’s find the plate, so she can rest.”'],
      fuwa: ['“Fuwa… Her voice is sad like the rain. Let’s find the tenth!”'],
      saya: ['“A soul that cannot leave… She’s waiting for the tenth plate. It must be hidden where people get lost.”'],
    },
    assietteTrouvee: ['In the corner of the dead end, under old leaves, something glows faintly…', 'A white porcelain plate with a blue pattern. The tenth!'],
    assietteCompagnon: {
      kon: ['“Let’s bring it back to the well, at night!”'],
      pon: ['“A plate! It just needs a meal on it… Come on, to the well!”'],
      chapu: ['“I knew we’d find it! Quick, to the well!”'],
      gao: ['“Good. Let’s bring it back to Okiku.”'],
      fuwa: ['“Fuwa! She’ll be so happy!”'],
      saya: ['“She’s been waiting for it for so long…”'],
    },
    rendre: ['You gently place the tenth plate on the pile, at the edge of the well.'],
    compteDix: ['“… hachi-mai… kyū-mai…”', '“… jū-mai!”'],
    okikuPaix: ['“Ten. They’re all here…”', '“Thank you. At last I can rest.”', 'The little flame turns golden.'],
    kobanLueur: ['The flame rises toward the sky among sparks, and slowly fades away.', 'On the well’s cover, something shines: a gold coin.'],
    okikuMerci: {
      kon: ['“She left in peace. Praise Inari…”'],
      pon: ['“Sniff… I’m not crying, it’s the wind!”'],
      chapu: ['“We did it! She looked so happy!”'],
      gao: ['“Gao. She doesn’t need anyone watching over her anymore.”'],
      fuwa: ['“Fuwaaa… She rose like a star!”'],
      saya: ['“She’s free now. Like a leaf in the wind.”'],
    },
    legende: ['A koban, an old gold coin.', 'This is the story of “Banshū Sarayashiki” (播州皿屋敷), the House of Plates: one of the most famous ghost stories in Japan.', 'At Himeji Castle, Okiku’s well is still there.'],
    puitsApres: ['Okiku’s well. All is calm. You join your hands for a moment.'],
    puitsApresNuit: ['The well is silent. The ten plates are stacked on its rim. Okiku rests in peace.'],
    monterTexte: ['You climb very steep wooden stairs… one floor, two, three…', '… four, five, six. You’re at the very top of the keep!'],
    enHaut: ['The top floor of the keep. Through the windows: the whole castle, and the town all the way to the mountains.'],
    descendreTexte: ['You go back down the six floors, holding the handrail tight…'],
    monterOu: ['Very steep wooden stairs. How far up do you go?'],
    etagesHaut: ['To the second floor', 'All the way up'],
    descendreOu: ['How far down do you go?'],
    etagesBas: ['To the second floor', 'To the basement'],
    monter2Texte: ['You climb very steep wooden stairs… one floor, two.', 'Here you are on the second floor!'],
    auMilieu: ['In the middle, a big room. All around it, a long wooden corridor: the warriors’ corridor (武者走り, musha-bashiri).', 'During an attack, soldiers ran along it from one window to the next.'],
    monterHautTexte: ['More steep stairs… three, four, five, six.', 'You’re at the very top of the keep!'],
    descendreBasTexte: ['You go back down two floors to the basement, holding the handrail tight…'],
    descendreMilieuTexte: ['You go back down four floors, holding the handrail tight… Back on the second floor.'],
    bukikake: ['“武具掛け” (bugukake): weapon racks, all along the walls.', 'Guns and spears rested on these wooden pegs. There was room for hundreds of weapons!', 'The keep was the castle’s last refuge: it had to hold out for a long time.'],
    pilierEst: ['The great east pillar (東大柱). Together with the west one, it goes through every floor, from the basement up to the sixth.', 'The two pillars hold up the keep like a backbone.'],
    vitrine: ['Old tiles from the castle’s roofs, kept after the big restoration.', 'At the end of each round tile there’s a crest (家紋, kamon): the lords who repaired the castle put their family’s crest there.'],
    fenetre2: ['Between the wooden bars: the castle’s gray roofs, the terrace, and the town far away.', 'The windows are small and barred: you could watch the enemy without being seen.'],
    fenetre2Nuit: ['Outside, the town sparkles in the night. Just below, the castle’s roofs glow in the floodlights.'],
    meurtriere: ['Under the window, a little wooden shutter. Behind it, a hole in the wall: round, square or triangular (狭間, sama).', 'Soldiers pushed a gun barrel through it, or shot arrows. The castle has hundreds of them!'],
    benevole: ['Hello! I’m a volunteer guide: I show visitors around the castle on weekends.', 'See this corridor that goes all the way around the floor? It’s the musha-bashiri, the warriors’ corridor.', 'And this shiny floor… Everyone visits in socks: you take your shoes off at the entrance of the keep!'],
    benevoleNuit: ['In the evening, the keep is so quiet. Listen… the old wood creaks under our feet.', 'Four hundred years of socks really polish a floor!'],
    enfant: ['I want to see outside… but the window’s too high!', 'Up on tiptoe… I can see the roofs! They look like gray waves!'],
    enfantNuit: ['Mom said we’d go home after the illumination. Five more minutes!'],
    photographe: ['Wow… Look at this pillar! I’m from Australia, by the way.', 'Back home, nothing is this old. This wood is four hundred years old… I’m taking pictures of everything!'],
    tenshu: ['Far below: the gray roofs and white walls of the castle, its terraces, the lawn and its cherry trees.', 'Further away, the great avenue runs straight to Himeji Station. And in the distance, the mountains.', 'From here, the lord of the castle could see his whole domain.'],
    tenshuNuit: ['The town sparkles with a thousand lit windows. Far below, the castle’s white walls glow in the night.'],
    osakabe: ['You ring the bell, bow twice, clap twice…', 'The little shrine of Osakabe (長壁神社), who has always protected the castle.', 'They say Osakabe, a spirit princess, lived hidden at the top of the keep, and gave a sword to the famous samurai Miyamoto Musashi.'],
    osakabeNuit: ['At night, at the top of the keep, you feel watched… Princess Osakabe is keeping guard.'],
    piliers: ['The great west pillar (西大柱): a single fir trunk, 25 meters tall, from the basement to the roof.', 'Sixty years ago, to repair the castle, it had to be replaced: they searched all of Japan for a tree big enough!'],
    fusils: ['Weapon racks: guns (鉄砲) and spears, ready for battle.', 'And yet Himeji Castle was never attacked.'],
    armure: ['Two samurai armors (鎧, yoroi), set on their chests.', 'Lacquered plates laced with blue or red silk cords; the helmet (兜, kabuto) and its golden horns.', 'In times of peace, the armor was kept in its chest. In war, the chest went along with it.'],
    aigrette: ['A slender white egret, walking slowly through the grass.', 'It’s the “white heron” (白鷺, shirasagi) that gave the castle its nickname!'],
    libellule: ['A red dragonfly (akatombo) flies over the grass.'],
    chaya: ['Welcome to the tea stall! After all those stairs, how about a little break?', 'Our specialty is Himeji oden: vegetables and eggs simmered in broth… eaten with a ginger soy sauce!', 'Want to try some?'],
    chayaNon: ['No problem! We also have dango and green tea ice cream. Come back anytime!'],
    chayaNuit: ['The tea stall is closed for tonight. The oden pot is cooling down…', 'Come back tomorrow morning!'],
    oden: ['The keeper hands you a steaming skewer: an egg, a piece of daikon radish, some konjac.', 'You dip it in the ginger soy sauce… Hot, mild and zesty all at once. Delicious!'],
    odenCompagnon: {
      kon: ['“An egg that simmered all morning… It tastes of the broth!”'],
      pon: ['“Another skewer? And another? Pon pon, I’ve got a tanuki belly!”'],
      chapu: ['“It steams like a hot spring! Careful, it’s hot!”'],
      gao: ['“Ginger wakes you up! Gao!”'],
      fuwa: ['“Fuwa… The broth is gentle like the sea.”'],
      saya: ['“The radish grew all winter in the cold earth… It’s so tender.”'],
    },
    gourmande: ['Taking a break: dango and green tea, with the keep right there… Pure happiness!', 'Have you tried the oden? Here they eat it with ginger. It’s a Himeji specialty!'],
    gourmandeNuit: ['I wanted to see the castle lit up… but the tea stall is closed. No dango for me!'],
    carteChaya: ['“お品書き”: the menu.', 'Himeji oden (姫路おでん): 400 yen. Dango (団子): 200 yen. Matcha soft serve (抹茶ソフト): 350 yen. Green tea is free!'],
    carteChayaNuit: ['Chalked at the bottom of the menu: “Closed. See you tomorrow!”'],
    glace: ['A big plastic cone: green tea soft serve (抹茶ソフト, matcha sofuto).', 'In Japan you find them at almost every sightseeing spot, each with its own flavor. Here, matcha!'],
  },
  ja: {
    noms: { gardien: 'お城の　係員さん', vieille: 'おばあさん', mere: 'お母さん', jiji: 'おじいさん', petit: '男の子', samourai: 'おさむらいさん', guide: '天守の　ガイドさん', peintre: '絵かきさん', eleve: '小学生', jardinier: '庭師さん', touriste: '観光客', videaste: '@random_japan_place', chaya: '茶屋の　おじさん', gourmande: 'おやつ中の　お姉さん', benevole: 'ボランティアガイドさん', enfant: '女の子', photographe: 'カメラマンさん' },
    tampons: {
      sakura: ['桜', '三の丸で　お花見'],
      hishi: ['菱の門', '迷路の　入口'],
      okiku: ['お菊井戸', 'むかしの　お話'],
      tenshu: ['大天守', '白鷺の　てっぺん'],
      koi: ['鯉', 'お堀の　鯉に　えさを　あげる'],
    },
    'panneau-shiro': ['「姫路城」', '白い　かべが、つばさを　広げた　白鷺（しらさぎ）のように　見えるので、「白鷺城」とも　よばれます。', '大天守は　1609年に　できました。戦争にも　火事にも　地震にも　こわれませんでした。', '1993年、日本で　はじめての　世界遺産の　ひとつに　なりました。'],
    'panneau-hishi': ['「天守への　道」', '天守に　行くには、門を　くぐって、階段を　のぼって……　まよわないように！', '道は　まがったり、天守から　はなれたり　します。敵を　まよわせる　ための　工夫です。'],
    'panneau-sama': ['「狭間（さま）」', '白い　かべの　まる・さんかく・しかくの　あなは、弓や　鉄砲で　敵を　うつ　ための　ものです。', '姫路城には、いまも　千　近くの　狭間が　あります！'],
    'panneau-nishinomaru': ['「西の丸」', 'この　石垣の　上に、300メートル　近い　ろうかが　あります。「百間廊下」です。', '400年前、千姫が　ここに　住んでいました。はしっこの　やぐらは　「化粧櫓」です。'],
    'panneau-bizen': ['「備前丸」', 'ここから、五つの　屋根が　かさなった　大天守が　ぜんぶ　見えます。', '中は　六階と　地下が　あって、てっぺんまで　のぼれます！'],
    gardien: ['姫路城へ　ようこそ！', 'お城は　五時に　しまります……でも　今夜は　ライトアップ！　白い　かべが　夜に　光るんです。', '見て　いきますか？'],
    gardienNon: ['わかりました！　天守への　道は、あの　階段から　はじまりますよ。'],
    gardienNuit: ['ほら……白鷺が　夜に　かがやいて　います。', '朝に　もどりたく　なったら、また　声を　かけてね。'],
    gardienMatin: ['もうすぐ　日の出ですよ。朝を　まちますか？'],
    gardienReste: ['では、夜を　たのしんで。お城は　とても　しずか……古い　井戸の　近くで　声が　聞こえる、という　話も　あるんですよ。'],
    gardienJour: ['おはよう！　お城の　門が　ひらきます。いい　一日を！'],
    vieille: ['こんにちは！　お堀の　鯉に　えさを　あげて　みる？', 'はい、えさの　ふくろ。あなたには　ただで　あげるよ！'],
    vieilleEncore: ['鯉の　えさ、もう　ひとつ　いる？　いつも　おなかが　すいて　いるのよ！'],
    vieilleNon: ['いいのよ。気が　かわったら、鯉は　まって　いるからね！'],
    vieilleDonne: ['木の　橋に　行って、えさを　投げて　ごらん。わっと　あつまって　くるよ！'],
    vieilleFu: ['もう　ふくろを　持って　いるね！　はやく　木の　橋へ。'],
    vieilleOkiku: ['上の　古い　井戸の　お話、知って　いる？　お菊さんの　お話……', 'わたしの　おばあちゃんが　言うには、夜、井戸の　そばで　お皿を　数える　声が　するんだって。「いちまい、にまい……くまい」', 'それから　泣くの。一まい　たりないから。十まいめは、いまも　見つかって　いないのよ……'],
    vieilleNuit: ['今夜は　もう　店じまい。', '夜は　古い　井戸に　気を　つけてね……お菊さんが　お皿を　数えて　いるから。'],
    mere: ['こんにちは！　桜の　下で　ピクニック　して　いるの。春、花が　さくと、町じゅうの　人が　来るのよ！', 'いっしょに　すわる？　だんごが　あるよ！'],
    mereNon: ['だいじょうぶ！　いい　見学を！'],
    pique: ['青い　シートに　すわる。おじいさんが　だんごを　くれた。ピンク、白、みどり。', 'もちもちで　あまい……上を　見ると、枝の　あいだに　白い　天守が　かがやいて　いる。'],
    piqueFin: ['桜の　下で　ピクニック　するのを　「お花見」って　いうのよ。', '春に　また　来てね。ぜんぶ　ピンクよ！'],
    mere2: ['もう　ひとつ　だんご？　あはは！　いい　見学を！'],
    mereNuit: ['ライトアップの　お城を　見て　いくの。きれいでしょう？'],
    jiji: ['小さい　ころから　ここに　来て　いるんだ。', '戦争の　とき、飛行機から　見えないように、天守に　大きな　黒い　あみを　かけたんだよ。すぐ　近くに　爆弾が　落ちたけど……爆発しなかった！', '白鷺は、いつも　運が　いいんだ。'],
    jijiNuit: ['夜の　お城は、ほんとうに　とびたつ　白鷺みたいだねえ……'],
    petit: ['お堀の　鯉、見た？　金色の　鯉も　いるよ！', 'それに、しばふに　大きな　白い　鳥が　いるの。白鷺だよ！'],
    petitNuit: ['夜は　古い　井戸に　近づいちゃ　だめって、ママが　言うの……', 'お皿を　数える　女の人の　声が　聞こえるんだって。ぶるる！'],
    samourai: ['まてい、旅の　者！　わしは　池田輝政さまの　城を　まもって　おる。', 'この　大天守を　建てたのは、輝政さまじゃ。1609年、九年も　かかったのじゃぞ！', '……じつは、わたしは　衣装を　着た　ガイドです。いい　見学を！'],
    samouraiNuit: ['夜も　見はりを　して　おるぞ！　この　城には　ひみつが　たくさん　あるのじゃ……'],
    guide: ['天守の　地下へ　ようこそ！　この　二本の　大きな　柱を　見て。', 'それぞれ　一本の　木で　できて　いて、天守と　おなじくらい　高いの。400年も　天守を　ささえて　いるのよ。', 'てっぺんへは、あちらの　階段から。とても　急だから　気を　つけてね！'],
    guideNuit: ['夜の　天守は　しまって　いるけど……あなたは　特別よ！', 'お菊さんの　伝説、知って　いる？　主人の　十まいの　だいじな　お皿の　一まいを　なくしたと　うたがわれた　女中さん……', 'その　幽霊が、二つめの　くるわの　古い　井戸に　出るんですって。'],
    peintre: ['天守を　かいて　いるんだ。ほら、五つの　屋根、白い　かべ……', 'いちばん　むずかしいのは　白。時間ごとに　色が　かわるんだよ！'],
    peintreNuit: ['夜は、ライトで　白が　金色に　なる。ぜんぶ　かきなおさなきゃ！'],
    eleve: ['修学旅行なんだ！　階段を　ぜんぶ　のぼったよ、ふう！', '先生が　言うには、敵が　まようように　道が　わざと　まがって　いるんだって。ぼくも　まよっちゃった……'],
    eleveNuit: ['しーっ！　お菊さんの　幽霊を　見に、かくれて　いるんだ……あっちの　井戸の　そばに　出るんだって。'],
    jardinier: ['毎朝、じゃりを　ならして　いるんだ。', '石垣は　おうぎのように　かたむいて　カーブ　して　いる。だから　くずれないんだよ。'],
    jardinierNuit: ['月の　光で　じゃりが　まっ白だ。足あとまで　見えるよ……'],
    touriste: ['橋から　お城の　写真を　とって　いるの。ここが　いちばんの　ながめ！', '下の　鯉、見た？　えさを　あげると　あつまって　くるのよ。'],
    touristeNuit: ['ライトアップの　お城が　お堀に　うつって……すてき！'],
    videaste: ['やあ！　@random_japan_place です。動画のために　天守を　とって　いるんだ。', '見て　みる？'],
    videasteNon: ['だいじょうぶ！　白鷺城を　たのしんでね！'],
    videasteApres: ['見て　くれて　ありがとう！　フォロー　して、ほかの　日本の　場所も　見てね！'],
    hishi: ['菱の門。', '大きな　はりに、金色の　ひしがた。その　上に、金で　ふちどった　つりがねの　形の　まどが　二つ。', 'お城で　いちばん　大きな　門。迷路の　入口です。'],
    hishiNuit: ['夜は、ちょうちんの　明かりで　金色の　ひしがたが　光る。'],
    koiRegarder: ['お堀の　みどりの　水に、鯉が　およいで　いる。赤と　白、黒、金色……', 'えさが　あれば、きっと　あつまって　くるのに！'],
    koiRegarderNuit: ['くらい　水の　中で、鯉が　ねむって　いるのが　見える。'],
    koiNourrir: ['えさを　ひとつかみ　投げると……', '鯉が　いっせいに　あつまって、水から　大きな　口を　あける。ぱく、ぱく、ぱく！'],
    koiFin: ['おしあい　へしあい、うれしそう。鯉は　とても　長生きで、百才を　こえる　ものも　いるんだって！'],
    koiEncore: ['鯉が　また　ごちそうを　食べて　いる！'],
    puits: ['木の　わくの　下に、古い　石の　井戸。立て札：「お菊井戸」。', 'むかし、お菊という　女中さんが、主人の　十まいの　だいじな　お皿を　あずかって　いました。', 'ある日、お皿が　一まい　なくなりました。お菊は　うたがわれ、この　井戸に　なげこまれて　しまいました……', 'それから　夜に　なると、幽霊が　あらわれて　お皿を　数えるそうです。「いちまい、にまい……くまい」。いつも　九まい。'],
    puits2: ['お菊井戸。夜に　なると、お皿を　数える　声が　聞こえるという……'],
    puitsJourAssiette: ['十まいめの　お皿を　持って　いる……でも　お菊さんは　夜しか　来ない。くらく　なったら　また　来よう。'],
    compte: ['「いちまい……にまい……さんまい……」', '「……よんまい……ごまい……ろくまい……」', '「……ななまい……はちまい……くまい……」'],
    sanglot: ['「いち、に、さん……く。」', '井戸から　すすり泣きが　聞こえる。「……一まい　たりない。十まいめは　どこ？」', '青い　小さな　ほのおが、井戸の　上で　ふるえて　いる。'],
    okikuCompagnon: {
      kon: ['「十まいめの　お皿を　さがして　いるんだ……お城の　どこかに　あるはず。道が　どこにも　つづかない　ところも　さがそう。」'],
      pon: ['「ぶるる！　幽霊！……でも、とても　かなしそう。お皿を　さがそうか？　すみっこさがしは　とくい　だよ！」'],
      chapu: ['「なくした　お皿？　ぼく、なんでも　見つけるよ！　迷路の　すみっこを　見て　みよう！」'],
      gao: ['「ガオ……こわくない。やすめるように、お皿を　さがそう。」'],
      fuwa: ['「フワ……雨みたいに　かなしい　声。十まいめを　見つけよう！」'],
      saya: ['「いけない　たましい……十まいめを　まって　いる。まよう　場所に　かくれて　いるはず。」'],
    },
    assietteTrouvee: ['行きどまりの　すみ、古い　はっぱの　下で、なにかが　かすかに　光って　いる……', '青い　もようの　白い　せとものの　お皿。十まいめだ！'],
    assietteCompagnon: {
      kon: ['「夜に、井戸へ　もって　いこう！」'],
      pon: ['「お皿だ！　あとは　ごはんを　のせるだけ……さあ、井戸へ！」'],
      chapu: ['「見つかると　思った！　はやく　井戸へ！」'],
      gao: ['「よし。お菊さんに　かえそう。」'],
      fuwa: ['「フワ！　きっと　すごく　よろこぶよ！」'],
      saya: ['「ずっと　まって　いたんだね……」'],
    },
    rendre: ['十まいめの　お皿を、井戸の　ふちの　お皿の　上に、そっと　かさねる。'],
    compteDix: ['「……はちまい……くまい……」', '「……じゅうまい！」'],
    okikuPaix: ['「十まい。ぜんぶ　そろった……」', '「ありがとう。やっと　やすめる。」', '小さな　ほのおが　金色に　なる。'],
    kobanLueur: ['ほのおは　火の粉と　いっしょに　空へ　のぼり、そっと　きえて　いった。', '井戸の　ふたの　上で、なにかが　光る。金貨だ。'],
    okikuMerci: {
      kon: ['「やすらかに　いったね。お稲荷さまに　かんしゃ……」'],
      pon: ['「ぐすん……泣いて　ないよ、風の　せいだよ！」'],
      chapu: ['「やったね！　とても　うれしそう　だったよ！」'],
      gao: ['「ガオ。もう　見まもらなくて　いいんだ。」'],
      fuwa: ['「フワァ……星みたいに　のぼって　いったよ！」'],
      saya: ['「もう　自由　なんだね。風に　のる　木の葉　みたいに。」'],
    },
    legende: ['小判。むかしの　金貨だ。', '「播州皿屋敷（ばんしゅう　さらやしき）」の　お話。日本で　いちばん　有名な　怪談の　ひとつだよ。', '姫路城には、いまも　お菊井戸が　ある。'],
    puitsApres: ['お菊井戸。とても　しずか。手を　あわせる。'],
    puitsApresNuit: ['井戸は　しずか。十まいの　お皿が　ふちに　かさなって　いる。お菊さんは　やすらかに　ねむって　いる。'],
    monterTexte: ['とても　急な　木の　階段を　のぼる……一階、二階、三階……', '……四階、五階、六階。天守の　てっぺんに　ついた！'],
    enHaut: ['天守の　さいじょうかい。まどから、お城　ぜんぶと、山まで　つづく　町が　見える。'],
    descendreTexte: ['手すりに　しっかり　つかまって、六階　ぶん　おりる……'],
    monterOu: ['とても　急な　木の　階段。どこまで　のぼる？'],
    etagesHaut: ['二階まで', 'てっぺんまで'],
    descendreOu: ['どこまで　おりる？'],
    etagesBas: ['二階まで', '地下まで'],
    monter2Texte: ['とても　急な　木の　階段を　のぼる……一階、二階。', '二階に　ついた！'],
    auMilieu: ['まん中に　大きな　へや。その　まわりを、長い　木の　ろうかが　ぐるりと　かこむ。武者走りだ。', 'せめられた　とき、さむらいたちは　ここを　走って、まどから　まどへ　いそいだ。'],
    monterHautTexte: ['まだまだ　急な　階段……三階、四階、五階、六階。', '天守の　てっぺんに　ついた！'],
    descendreBasTexte: ['手すりに　しっかり　つかまって、地下まで　二階　ぶん　おりる……'],
    descendreMilieuTexte: ['手すりに　しっかり　つかまって、四階　ぶん　おりる……二階に　もどって　きた。'],
    bukikake: ['「武具掛け」。かべに　ずらりと　ならぶ、武器を　かける　たな。', 'この　木の　くぎに、鉄砲や　やりを　のせた。何百もの　武器が　おけたんだ！', '天守は　お城の　さいごの　とりで。長く　たたかえるように　して　あった。'],
    pilierEst: ['東の　大柱。西の　大柱と　いっしょに、地下から　六階まで、すべての　ゆかを　つらぬいて　いる。', '二本の　柱が、せぼねの　ように　天守を　ささえて　いるんだ。'],
    vitrine: ['お城の　屋根の　古い　かわら。大きな　修理の　あとに　のこされた　もの。', 'まるい　かわらの　先には、家紋が　ついて　いる。お城を　なおした　殿さまたちが、じぶんの　家の　家紋を　入れたんだ。'],
    fenetre2: ['木の　こうしの　あいだから、お城の　灰色の　屋根、くるわ、そして　とおくの　町が　見える。', 'まどは　小さくて、こうしが　ある。こちらは　見えずに、てきを　見はれたんだ。'],
    fenetre2Nuit: ['外では、夜の　町が　きらきら　かがやく。すぐ　下では、お城の　屋根が　ライトに　てらされて　いる。'],
    meurtriere: ['まどの　下に、小さな　木の　ふた。その　うしろには、かべの　あな。まる、しかく、さんかく……「狭間」だ。', 'ここから　鉄砲を　出したり、矢を　いたり　した。お城には　何百も　あるんだって！'],
    benevole: ['こんにちは！　ボランティアガイドです。週末に　お城を　あんない　して　います。', 'この　階を　ぐるりと　まわる　ろうかが　あるでしょう？　武者走りと　いって、さむらいの　ための　ろうかです。', 'それに、ぴかぴかの　ゆか……みなさん　くつしたで　見学します。天守の　入り口で　くつを　ぬぐんですよ！'],
    benevoleNuit: ['夜の　天守は　しずかですね。聞いて……古い　木が　足の　下で　きしむ　音。', '四百年ぶんの　くつしたが、この　ゆかを　みがいたんです！'],
    enfant: ['外が　見たいのに……まどが　高すぎる！', 'せのびして……屋根が　見えた！　灰色の　なみ　みたい！'],
    enfantNuit: ['ライトアップを　見たら　帰るって、ママが　言ってた。あと　五分だけ！'],
    photographe: ['ワオ……この　柱、見て！　あ、ぼく、オーストラリアから　来たんだ。', 'ぼくの　国には、こんなに　古い　ものは　ない。この　木は　四百年も　前の　もの……ぜんぶ　写真に　とるよ！'],
    tenshu: ['下には、お城の　はい色の　屋根と　白い　かべ、くるわ、桜の　三の丸。', 'その　さきに、姫路駅まで　まっすぐ　のびる　大通り。そして　とおくに　山。', 'お殿さまは、ここから　自分の　領地を　ぜんぶ　見わたして　いたんだ。'],
    tenshuNuit: ['町には　たくさんの　まどの　明かり。下では、お城の　白い　かべが　夜に　光って　いる。'],
    osakabe: ['すずを　ならして、二回　おじぎ、二回　はくしゅ……', '長壁神社。ずっと　お城を　まもって　いる　神さま。', 'むかし、長壁という　ひめが　天守の　てっぺんに　かくれ住み、有名な　剣豪　宮本武蔵に　刀を　さずけた、という　話が　あるんだよ。'],
    osakabeNuit: ['夜の　天守の　てっぺん……だれかに　見られて　いる　気が　する。長壁ひめが　見まもって　いるんだ。'],
    piliers: ['西の　大柱。一本の　もみの木で、地下から　屋根まで　高さ　25メートル。', '六十年前、お城を　なおす　とき、とりかえる　ことに　なって、日本じゅうで　大きな　木を　さがしたんだって！'],
    fusils: ['武器の　たな。鉄砲や　やりが、たたかいに　そなえて　いる。', 'でも　姫路城は、いちども　せめられた　ことが　ないんだ。'],
    armure: ['よろいが　二つ、はこの　上に　かざって　ある。', 'うるしを　ぬった　いたを、青や　赤の　ひもで　つないで　ある。金の　くわがたの　ついた　かぶと。', 'へいわな　ときは　よろいを　はこに　しまい、いくさの　ときは　はこごと　もって　いったんだ。'],
    aigrette: ['ほっそりした　白い　白鷺が、草の　中を　ゆっくり　歩いて　いる。', 'この　「白鷺」が、お城の　名前の　もとに　なったんだ！'],
    libellule: ['赤とんぼが　草の　上を　とんで　いく。'],
    chaya: ['いらっしゃい！　階段を　たくさん　のぼって　つかれたでしょう。　ひと休み　して　いきなよ。', 'うちの　名物は　姫路おでん。　しょうが　じょうゆで　食べるんだ！', '食べて　みる？'],
    chayaNon: ['いいよ！　だんごも　抹茶ソフトも　あるからね。　また　おいで！'],
    chayaNuit: ['今日は　もう　店じまい。　おでんの　なべも　冷めて　きたよ。', 'また　明日の　朝　おいで！'],
    oden: ['ほかほかの　くしを　もらった。　たまごと　だいこんと　こんにゃく。', 'しょうが　じょうゆを　つけて……　あつくて、やさしくて、ぴりっと　する。　おいしい！'],
    odenCompagnon: {
      kon: ['「朝から　にこんだ　たまご……　おだしの　味が　します！」'],
      pon: ['「もう　一本？　もう　一本！　ポンポン、たぬきの　おなかは　まだ　入るよ！」'],
      chapu: ['「おんせんみたいに　ゆげが　出てる！　あついから　気をつけて！」'],
      gao: ['「しょうがで　目が　さめる！　ガオ！」'],
      fuwa: ['「ふわ……　おだしが　海みたいに　やさしい。」'],
      saya: ['「だいこんは　冬の　つめたい　土で　そだったの……　とても　やわらかい。」'],
    },
    gourmande: ['ひと休み　中。　天守を　見ながら　だんごと　お茶……　しあわせ！', 'おでん　食べた？　ここでは　しょうがで　食べるの。　姫路の　名物なんだよ！'],
    gourmandeNuit: ['ライトアップを　見に　来たけど……　茶屋は　しまってた。　だんご、残念！'],
    carteChaya: ['「お品書き」。', '姫路おでん　400円、だんご　200円、抹茶ソフト　350円。　お茶は　サービス！'],
    carteChayaNuit: ['メニューの　下に　チョークで　「本日　閉店。　また　明日！」'],
    glace: ['大きな　プラスチックの　ソフトクリーム。　抹茶ソフトの　かんばんだ。', '日本の　観光地には　たいてい　ご当地ソフトが　ある。　ここは　抹茶味！'],
  },
};
