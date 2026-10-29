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
//  Son secret : l'oni à la torche, qui descend de la montagne quand on sonne la cloche la nuit. Sa récompense : la conque
//  et l'étole à pompons du yamabushi (tenues.js). Les distances sont un peu resserrées.
//  Repère : x vers l'est, z vers le sud, y vers le haut, en mètres ; la vallée monte vers le nord : la ferme et le bout de
//  la route en bas (0,4 m), les Nio à 4,9 m, l'escalier jusqu'à la terrasse du pavillon (21 m), la falaise au nord.
//  ctx : { THREE, atelier, P (palette), peinture, perso, maillage }.
// ================================================================
import { creerMonde, interactionsBancs, lisse, hasard, bruitDoux, surLaLigne } from './monde.js';
import { panneau, PAPIER_PANNEAU } from './decor.js';
import { MATIERES as M } from './textures.js';
import { secretTrouve } from './tresors.js';

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
// le grand cèdre sacré (神木), au coin sud-ouest de la terrasse
const SHINBOKU = { x: -15.6, z: -22.6, r: 1.05 };
// le belvédère : un éperon de roche au bout est de la terrasse, au-dessus de la coupe de bois
const BELVEDERE = { x0: 15.0, x1: 22.4, z0: -31.0, z1: -23.2, y: Y_T };
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
// la ferme : sa cour, la maison (sa véranda vers l'est), le kaki
const COUR = { x0: -11.8, x1: 2.6, z0: 54.6, z1: 67.6 };
const MAISON = { x: -15.4, z: 61.0, lz: 9.8, lx: 6.4 };
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
    const db = versRect(BELVEDERE, x, z);
    if (db < 1.2) h = BELVEDERE.y - 0.03;
    else if (db < 2.8 && !dansRect(TERRASSE, x, z)) h = Math.min(h, BELVEDERE.y - 0.03 - 0.9 * lisse(1.2, 2.8, db));
  }
  // le bassin de la cascade
  { const d = Math.hypot(x - TAKI.x, z - TAKI.z); if (d < TAKI.r + 0.6) h = Math.min(h, TAKI.eau - 0.7 + (Y_T - 0.03 - TAKI.eau + 0.7) * lisse(TAKI.r - 0.6, TAKI.r + 0.6, d)); }
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
const ETENDUE = { x0: -720, x1: 720, z0: -720, z1: 720, pas: 4, fin: { x0: -48, x1: 56, z0: -48, z1: 84, pas: 1 } };
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
 * clairière de Bunbuku, sur la terrasse (hors du bassin) et le belvédère. Leurs bords ont tous ce qui arrête (le sous-bois
 * de la lisière, les bordures, les murets, les rondins, la falaise, les rochers du bassin) : le voyageur s'arrête 27 cm avant.
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
  if (dansRect(TERRASSE, x, z) && z > zParoi(x) + 1.35) return Math.hypot(x - TAKI.x, z - TAKI.z) > TAKI.r + 1.1 && (x > -1.2 || z < TERRASSE.z1 - 0.32);
  return dansRect(BELVEDERE, x, z);
}

/** Ce que le carnet et le menu savent du lieu, sans le construire. */
export const infos = {
  id: 'sanjubutsu', carte: 'thirty-buddhas-nio-statues', video: '7646873869042666774',
  nom: { en: 'Thirty Buddhas', fr: 'Trente Bouddhas', ja: '三十仏' }, nomJa: '三十仏の仁王像',
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
      const y = yMarche(k), zf = zMarche(k), prof = GIRON + 0.14, larg = 2 * ESC.demi - (k % 2 ? 0.05 : 0);
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
    // les poteaux (devant tous les 2,05 m), les longrines, la traverse haute ; devant, des panneaux bas, en haut une frise
    // à barreaux ; derrière, la falaise elle-même
    const NB = 8, pasP = DO.l / NB;
    for (let i = 0; i <= NB; i++) {
      const lx = -L2 + i * pasP;
      a.boite(0.2, 3.2, 0.2, BOIS_F, R(lx, yS + 1.6, P2 - 0.1)).boite(0.2, 3.6, 0.2, BOIS_F, R(lx, yS + 1.8, -P2 + 0.1));
      if (i < NB) {
        const cx = lx + pasP / 2;
        a.boite(pasP - 0.2, 0.86, 0.06, BOIS, R(cx, yS + 0.43, P2 - 0.08)).boite(pasP - 0.2, 0.06, 0.1, BOIS_F, R(cx, yS + 0.9, P2 - 0.08));
        for (let b = 1; b < 9; b++) a.boite(0.035, 0.5, 0.035, BOIS_F, R(lx + 0.1 + ((pasP - 0.2) * b) / 9, yS + 2.75, P2 - 0.08));
      }
    }
    // (les poutres finissent dans les poteaux d'angle, 2 cm avant leur face : bout à bout dans son plan, elles scintillaient)
    a.boite(DO.l + 0.16, 0.16, 0.18, BOIS_F, R(0, yS + 3.1, P2 - 0.1)).boite(DO.l + 0.16, 0.12, 0.14, BOIS_F, R(0, yS + 2.48, P2 - 0.1))
      .boite(DO.l + 0.16, 0.16, 0.18, BOIS_F, R(0, yS + 3.5, -P2 + 0.1));
    // les côtés : des planches
    for (const s of [-1, 1]) a.boite(0.06, 3.0, DO.p - 0.2, BOIS, R(s * (L2 - 0.03), yS + 1.5, 0));
    // le toit en appentis, en cuivre vert-de-gris, qui descend vers l'avant ; sa planche de rive
    const yArr = yS + 3.75, yAv = yS + 3.05, avance = 0.9, pente = Math.atan2(yArr - yAv, DO.p + avance);
    const Lt = Math.hypot(DO.p + avance + 0.3, yArr - yAv);
    a.boite(DO.l + 1.2, 0.08, Lt, CUIVRE, { ...R(0, (yArr + yAv) / 2 + 0.06, avance / 2 - 0.15), rx: -pente })
      .boite(DO.l + 1.24, 0.18, 0.06, CUIVRE_F, R(0, yAv - 0.06, P2 + avance + 0.02))
      .boite(DO.l + 1.18, 0.06, 0.4, '#3f6f62', { ...R(0, yAv - 0.11, P2 + avance - 0.18), rx: -pente });
    // les marches de bois de l'entrée (deux, comme dans le TikTok), le tronc des offrandes, la corde et ses papiers
    for (const e of [-L2 + pasP * 1.5, L2 - pasP * 2.5]) {
      for (let j = 0; j < 3; j++) a.boite(1.2 + (j % 2) * 0.04, 0.12, 0.34, BOIS_C, R(e, Y_T + 0.17 + j * 0.2, P2 + 0.85 - j * 0.3));
      for (const s of [-1, 1]) a.boite(0.08, 0.7, 1.0, BOIS, { ...R(e + s * 0.64, Y_T + 0.3, P2 + 0.5), rx: -0.5 });
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
    // la torche brûlée, appuyée au poteau sud-est (un indice : quelqu'un est venu, la nuit)
    a.fut(pt(R, d + 0.3, y0 - 0.05, d + 0.45), pt(R, d + 0.12, y0 + 1.45, d + 0.22), 0.06, 0.05, '#8a6a3a', 6).fut(pt(R, d + 0.12, y0 + 1.42, d + 0.22), pt(R, d + 0.08, y0 + 1.75, d + 0.18), 0.075, 0.05, '#2a2420', 6);
    monde.cercle(S.x + d + 0.3, S.z + d + 0.45, 0.36);
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
    // (deux colonnes voisines n'ont pas le même nombre de points : on les relie par leur hauteur relative)
    for (let c = 0; c < colonnes.length - 1; c++) {
      const A = colonnes[c].pts, B = colonnes[c + 1].pts;
      let i = 0, j = 0;
      while (i < A.length - 1 || j < B.length - 1) {
        const ta = i < A.length - 1 ? (i + 1) / (A.length - 1) : 2, tb = j < B.length - 1 ? (j + 1) / (B.length - 1) : 2;
        if (ta <= tb) { tri(pos, A[i], B[j], A[i + 1], [0, 0, 1]); i++; } else { tri(pos, A[i], B[j], B[j + 1], [0, 0, 1]); j++; }
        const p = pos.slice(-9), cy = (p[1] + p[4] + p[7]) / 3, cx = (p[0] + p[3] + p[6]) / 3;
        // (la mousse sur ce qui regarde vers le haut, les replats ; dessous le surplomb, sombre ; près de la cascade, mouillé ;
        // ailleurs des gris proches les uns des autres : en couleurs franches, la paroi faisait une mosaïque de triangles)
        const ux = p[3] - p[0], uy = p[4] - p[1], uz = p[5] - p[2], vx = p[6] - p[0], vy = p[7] - p[1], vz = p[8] - p[2];
        const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, ny1 = ny / (Math.hypot(nx, ny, nz) || 1);
        const n = bruitDoux(cx * 0.45, cy * 0.45, 1), dessous = ny1 < -0.35;
        const mouille = Math.abs(cx - TAKI.x) < 1.6 ? 1 : 0;
        cols.push(mouille ? (n > 0.5 ? '#3f4a40' : '#454f42') : dessous ? (n > 0.5 ? '#4b4b42' : '#514f46') : ny1 > 0.42 ? (n > 0.5 ? MOUSSE : MOUSSE_F) : n > 0.66 ? '#68725a' : n < 0.3 ? '#6c695e' : '#646157');
      }
    }
    const a = atelier(), g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    a.piece(g, '#7a766a', { couleurs: cols, nuance: 0.05 });
    // des lianes et des fougères accrochées à la paroi, de l'eau qui suinte
    for (let k = 0; k < 46; k++) {
      const x = X0 + 4 + hasard(k, 1) * (X1 - X0 - 8), lf = largeurFalaise(x);
      if (lf < 0.6) continue;
      const y = Y_T + 1.5 + hasard(k, 2) * (hautFalaise(x) - Y_T - 4), z = zFace(x, y) + 0.12;
      if (Math.abs(x - TAKI.x) < 2) continue;
      a.houppe(0.35 + 0.35 * hasard(k, 3), k % 3 ? '#4f7a3e' : '#5d8a44', { x, y, z, sy: 0.6, sz: 0.5, sorte: 'persistant' }, 1);
    }
    poser(a.fin(), 0, 0, { y: 0 });
    monde.toit(DO.x - DO.l / 2 - 1.5, DO.x + DO.l / 2 + 1.5, Z_PAROI - 0.5, DO_AVANT + 0.6, Y_T + 4.6, Y_T + 9.5);
  }
  // les bouddhas taillés dans la roche (磨崖仏), dans leurs niches
  {
    const a = atelier();
    for (const n of NICHES) {
      const z = zFace(n.x, n.y);
      a.boite(1.05, 1.5, 0.12, '#3f4038', { x: n.x, y: n.y, z: z + 0.02 }).boite(1.2, 0.1, 0.3, '#6e6a5e', { x: n.x, y: n.y - 0.78, z: z + 0.12 });
      bouddha(THREE, a, n.x, n.y - 0.72, z + 0.22, 0, 0, { PIERRE: '#7a766a', PIERRE_F: '#6a665a', LICHEN, MOUSSE, tachee }, 2.2);
    }
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
      if (zr < zl + 0.2) continue;
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

  // ---------------------------------------------------------------- Les barrières de rondins (丸太柵) : une seule sorte
  // Là où le sol tombe : le bord sud de la terrasse à l'est de l'escalier, le belvédère ; et en travers de la route, en bas.
  const rondins = (a, points) => {
    for (let i = 0; i < points.length - 1; i++) {
      const [xa, za] = points[i], [xb, zb] = points[i + 1], L = Math.hypot(xb - xa, zb - za), n = Math.max(1, Math.round(L / 1.8));
      for (let k = 0; k <= n; k++) {
        if (k === 0 && i > 0) continue;
        const x = xa + ((xb - xa) * k) / n, z = za + ((zb - za) * k) / n, y = terrain(x, z);
        a.fut([x, y - 0.3, z], [x, y + 1.0, z], 0.075, 0.07, '#7a5f45', 7).boule(0.072, '#8a6f55', { x, y: y + 1.0, z, sy: 0.4 });
      }
      for (let k = 0; k < n; k++) {
        const x0 = xa + ((xb - xa) * k) / n, z0 = za + ((zb - za) * k) / n, x1 = xa + ((xb - xa) * (k + 1)) / n, z1 = za + ((zb - za) * (k + 1)) / n;
        const y0 = terrain(x0, z0), y1 = terrain(x1, z1);
        for (const [h, e] of [[0.92, 0.012], [0.5, -0.012]]) a.fut([x0, y0 + h + e, z0], [x1, y1 + h - e, z1], 0.055, 0.055, k % 2 ? '#8a6c50' : '#7f6448', 6);
      }
      monde.mur(xa, za, xb, zb, 0.3);
    }
  };
  {
    const a = atelier(), B = BELVEDERE;
    // (le long de tout ce qui tombe : le bord sud de la terrasse à l'est de l'escalier, le tour du belvédère, le bord est de la
    // terrasse jusqu'à la falaise ; entre la terrasse et le belvédère, de plain-pied, rien)
    rondins(a, [[1.6, TERRASSE.z1 + 0.05], [B.x0 - 0.05, TERRASSE.z1 + 0.05], [B.x0 - 0.05, B.z1 + 0.05], [B.x1 + 0.05, B.z1 + 0.05], [B.x1 + 0.05, B.z0 - 0.05], [B.x0 - 0.05, B.z0 - 0.05], [B.x0 - 0.05, TERRASSE.z0 + 0.4]]);
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
    // (dans son repère, la maison est tournée vers +z : sa véranda regarde l'est)
    a.boite(MAISON.lz + 0.3, 0.6, MAISON.lx + 0.3, PIERRE_F, { ...R(0, yM + 0.18, 0), teinte: tachee(90, 0.4) })
      .boite(MAISON.lz, 2.5, MAISON.lx - 1.2, PLATRE, R(0, yP + 1.25, -0.6))
      .boite(MAISON.lz + 0.2, 0.08, 1.15, '#8a6f55', R(0, yP - 0.04, lz - 0.55));
    for (let i = 0; i <= 6; i++) {
      const u = -lx + (i * MAISON.lz) / 6;
      a.boite(0.16, 2.6, 0.16, BOIS, R(u, yP + 1.3, lz - 1.15)).boite(0.14, 2.3, 0.14, BOIS, R(u, yP + 1.15, lz - 0.05));
      if (i < 6) for (let k = 0; k < 2; k++) a.boite(MAISON.lz / 12 - 0.08, 1.75, 0.04, P.shoji, R(u + (MAISON.lz / 12) * (k + 0.5), yP + 0.95, lz - 1.17));
    }
    a.boite(MAISON.lz + 0.1, 0.14, 0.13, BOIS, R(0, yP + 2.6, lz - 1.15)).boite(MAISON.lz + 0.1, 0.12, 0.11, BOIS, R(0, yP + 2.3, lz - 0.05));
    a.toitJapon(MAISON.lz + 2.4, MAISON.lx + 2.2, 2.3, 0.3, { ...R(0, yP + 2.55, -0.3), tuile: '#5f6468', tuile2: '#6b7075', bord: '#43474a', rangs: 14 });
    murRect(R, lx + 0.15, lz + 0.15, 0.27);
    // la véranda : la grand-mère y tresse des sandales de paille ; des bottes de paille, un panier, des sandales finies
    bancs.push({ de: [Mx + lz - 0.15, Mz - 3.4], a: [Mx + lz - 0.15, Mz - 0.4], y: yP, cap: PI / 2 });
    for (let k = 0; k < 3; k++) { a.cylindre(0.28, 0.28, 0.75, 9, '#cdb47a', { x: Mx + lz + 0.9 + k * 0.05, y: yM + 0.38, z: Mz + 2.4 + k * 0.62, rx: PI / 2, ry: 0.2 * k }); monde.cercle(Mx + lz + 0.9 + k * 0.05, Mz + 2.4 + k * 0.62, 0.68); }
    a.cylindre(0.2, 0.16, 0.22, 10, '#a8864e', { x: Mx + lz - 0.35, y: yP + 0.12, z: Mz + 0.7 });
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
    // l'arrêt de bus (三十仏入口), au bout de la route
    const bx = DEPART.x + 1.6, bz = DEPART.z - 1.5, by = terrain(bx, bz);
    a.cylindre(0.035, 0.035, 2.2, 8, '#d8d8d0', { x: bx, y: by + 1.1, z: bz }).cylindre(0.2, 0.24, 0.12, 12, '#5a5a5a', { x: bx, y: by + 0.06, z: bz })
      .cylindre(0.3, 0.3, 0.04, 20, '#f4f2ea', { x: bx, y: by + 2.05, z: bz, rx: PI / 2, ry: -0.6 });
    ecrire({ x: bx, y: by, z: bz, ry: -0.6 }, { texte: '三十仏入口', x: 0, y: 2.05, z: 0.025, l: 0.5, h: 0.5, forme: 'rond', fond: '#f4f2ea', encre: '#2a4a8a', sous: 'バス停' });
    monde.cercle(bx, bz, 0.4);
    // les murets des rizières en terrasses, au sud
    for (let k = 0; k < 6; k++) {
      const z = RIZIERES_Z + k * 7;
      for (let x = -28; x < 34; x += 1.6) {
        const y = terrain(x, z + 0.2);
        if (surRoute(x, z).d < DEMI_ROUTE + 0.5) continue;
        a.boite(1.62, 0.5, 0.35, (Math.floor(x / 1.6) + k) % 2 ? PIERRE_F : PIERRE, { x: x + 0.8, y: y + 0.05, z: z + 0.05, nuance: 0.08, teinte: tachee(k * 9 + x, 0.4) });
      }
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
    // la borne de pierre « 三十仏 », au bord du chemin, à l'orée de la forêt
    const bx = 1.9, bz = 33.6, by = terrain(bx, bz);
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
    if (versRect(COUR, x, z) < m + 3 || versRect({ x0: MAISON.x - 4, x1: MAISON.x + 4, z0: MAISON.z - 6, z1: MAISON.z + 6 }, x, z) < m || surRoute(x, z).d < DEMI_ROUTE + m + 1.5) return false;
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
    // au loin : des bosquets de cèdres en cônes sombres sur les collines (sans trait), une seule pièce par morceau de 200 m
    const cones = new Map();
    for (let k = 0; k < 2600; k++) {
      const ang = hasard(k, 0.31) * 2 * PI, d = 96 + 260 * Math.sqrt(hasard(0.77, k)), x = Math.cos(ang) * d, z = 10 + Math.sin(ang) * d, y = terrain(x, z);
      if (z > RIZIERES_Z && Math.abs(x - 4) < 40 && z < 140) continue;
      const h = 14 + 10 * hasard(k, 3), r = h * 0.17, c = k % 3 ? '#3a5638' : '#33503a', cle = `${Math.floor(x / 200)},${Math.floor(z / 200)}`;
      if (!cones.has(cle)) cones.set(cle, { pos: [], cols: [], x, z });
      const q = cones.get(cle), haut = [x, y + h, z];
      for (let s = 0; s < 5; s++) {
        const a0 = (s / 5) * 2 * PI + k, a1 = ((s + 1) / 5) * 2 * PI + k;
        tri(q.pos, haut, [x + Math.cos(a0) * r, y + h * 0.22, z + Math.sin(a0) * r], [x + Math.cos(a1) * r, y + h * 0.22, z + Math.sin(a1) * r], [Math.cos(a0 + 0.6), 0.4, Math.sin(a0 + 0.6)]);
        q.cols.push(c);
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
  const ONI_CHEMIN = [[17.6, -37.5], [15.8, -32.6], [13.6, -29.8], [12.0, -27.7]];
  const VEILLE = { x: 13.3, z: -22.3 };
  const oni = creerOni(ctx, atelier, lampeOni);
  animes.push(oni);
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
  const OBAA = { x: MAISON.x + MAISON.lx / 2 - 0.2, z: MAISON.z + 1.6 };
  const passants = [
    // la grand-mère, assise au bord de sa véranda : elle tresse des sandales de paille
    { id: 'obaa', x: OBAA.x, z: OBAA.z, cap: PI / 2, assis: Y_ROUTE + 0.55, tenue: { taille: 0.84, peau: '#f0c8a6', cheveux: '#d8d4cc', coiffure: 'chignon', haut: '#5a6a7a', manches: 'longues', tablier: '#8a6a5a', bas: { sorte: 'pantalon', c: '#4a4a56' }, chaussures: '#3a3236', semelle: '#3a3236', yeux: 'plisses' } },
    // sa petite-fille, près de la dalle du ruisseau, qui a vu les grandes empreintes
    { id: 'enfant', x: 1.1, z: 33.4, cap: -2.4, tenue: { taille: 0.7, peau: PEAU, cheveux: NOIR, coiffure: 'queue', chapeau: { sorte: 'ecolier', c: '#f2c443' }, haut: '#e8583e', manches: 'courtes', bas: { sorte: 'jupe', c: '#3d5a8f' }, chaussures: P.blanc, semelle: '#3a3236' }, quand: 'jour' },
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
      id: 'ratelier', x: RATELIER.x - 1.15, z: RATELIER.z + 0.5, rayon: 1.9, haut: 1.4, verbe: 'suspendre', vers: [RATELIER.x, RATELIER.z], si: (jeu) => jeu.aDansSac('waraji'),
      async action(jeu) {
        jeu.placer(RATELIER.x - 1.05, RATELIER.z + 0.5, PI / 2);
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
          // la torche qui descend de la montagne, l'oni qui arrive
          jeu.cadrer({ de: [CLOCHE.x + 3.6, CLOCHE.y + 2.4, CLOCHE.z + 4.2], vers: [13.6, CLOCHE.y + 2.2, -30.6], champ: 60 });
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
      async action(jeu) { jeu.geste('offrir'); await jeu.attendre(600); oni.koban(false); jeu.geste(null); await jeu.trouverSecret('oni'); await oni.partir(ONI_CHEMIN, terrain, VEILLE); },
    },
    { id: 'veille', x: VEILLE.x - 1.4, z: VEILLE.z - 1.6, rayon: 2.0, haut: 1.4, verbe: 'regarder', vers: [VEILLE.x, VEILLE.z], si: (jeu) => jeu.estNuit && jeu.secretTrouve('oni') && oni.veille, action: (jeu) => jeu.dire(jeu.tx('oniApres'), 'oni') },
    { id: 'torche', x: CLOCHE.x + 2.3, z: CLOCHE.z + 2.4, rayon: 1.4, haut: 1.4, verbe: 'regarder', vers: [CLOCHE.x + 1.62, CLOCHE.z + 1.72], action: (jeu) => jeu.dire(jeu.txn('torche')) },
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
        jeu.placer(DO.x - 0.6, DO_AVANT + 1.0, PI);
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
      // l'écho de la falaise (le tampon) : appeler trois fois ; la troisième, l'écho répond autre chose
      id: 'yamabiko', x: ECHO.x, z: ECHO.z, rayon: 2.0, haut: 1.4, verbe: 'appeler', vers: [ECHO.x - 1.5, Z_PAROI],
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
    parler('enfant'), parler('randonneur'), parler('yamabushi'), parler('bucheron'), parler('photographe'),
    { id: 'torii', x: TORII.x, z: TORII.z - 1.4, rayon: 1.6, haut: 2.4, verbe: 'regarder', vers: [TORII.x, TORII.z], action: (jeu) => jeu.dire(jeu.txn('torii')) },
    { id: 'escalier', x: ESC.x, z: ESC.z0 - 0.4, rayon: 1.2, haut: 1.4, verbe: 'regarder', vers: [ESC.x, ESC.z1], action: (jeu) => jeu.dire(jeu.txn('escalier')) },
    { id: 'to', x: TO.x + 1.6, z: TO.z + 0.9, rayon: 1.8, haut: 1.6, verbe: 'regarder', vers: [TO.x, TO.z], action: (jeu) => jeu.dire(jeu.tx('to')) },
    { id: 'shinboku', x: SHINBOKU.x + 2.1, z: SHINBOKU.z - 1.3, rayon: 1.8, haut: 1.6, verbe: 'regarder', vers: [SHINBOKU.x, SHINBOKU.z], action: (jeu) => jeu.dire(jeu.txn('shinboku')) },
    { id: 'cascade', x: TAKI.x + 2.6, z: TAKI.z + 1.9, rayon: 1.8, haut: 1.6, verbe: 'regarder', vers: [TAKI.x, TAKI.z - 1.2], action: (jeu) => jeu.dire(jeu.txn('cascade')) },
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
  const depart = { x: DEPART.x, z: DEPART.z, cap: -2.6 };
  // les morceaux du décor : près, avec leur trait et leur ombre ; au loin (les forêts des collines), sans
  for (const [k, a] of morceaux) poser(a.fin(), 0, 0, { y: 0, ...(Number(k.split(':')[0]) >= 100 ? { trait: false, ombre: false } : {}) });

  return {
    ...infos, textes: TEXTES,
    objets, monde, terrain, etiquettes, passants, daims: [], interactions, actionDaim: null, vapeurs, bancs, lumieres, actionBete, animes,
    // (le secret, tresors.js ; le marchand ; les sons à fabriquer en plus ; les feux d'artifice, au-dessus de la vallée, au sud)
    secret: 'oni', marchand: MARCHAND, sons: ['claque', 'papier', 'kane', 'pouf'],
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
      perso: { x: 0, z: -23.4, cap: 0, lacet: PI + 0.1, tangage: 0.12, distance: 4.4 },
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
 * Un petit bouddha de pierre assis (environ 50 cm × k), en x, y (le dessus de son gradin), z, tourné de ry : le lotus, les
 * jambes croisées, le corps, la tête et sa bosse (肉髻), le halo derrière ; ses mains changent d'un jour à l'autre.
 */
function bouddha(THREE, a, x, y, z, ry, jour, C, k = 1) {
  const { PIERRE, PIERRE_F, tachee } = C, t = tachee(jour * 3.7, 0.1), c = Math.cos(ry), sn = Math.sin(ry);
  const o = (lx, ly, lz, e = {}) => ({ ordre: 'YXZ', ...e, x: x + (lx * c + lz * sn) * k, y: y + ly * k, z: z + (-lx * sn + lz * c) * k, ry, sx: (e.sx ?? 1) * k, sy: (e.sy ?? 1) * k, sz: (e.sz ?? 1) * k, teinte: t, nuance: 0.07 });
  a.cylindre(0.16, 0.13, 0.06, 12, PIERRE_F, o(0, 0.03, 0))
    .cylindre(0.17, 0.15, 0.05, 12, PIERRE, { ...o(0, 0.08, 0), deformer: (px, py, pz) => { const q = 1 + 0.07 * Math.max(0, Math.cos(Math.atan2(pz, px) * 8)); return [px * q, py, pz * q]; } })
    .ovale(0.16, PIERRE, { ...o(0, 0.15, 0.02), sx: 1.25, sy: 0.42, sz: 0.85 }, 10)
    .ovale(0.11, PIERRE, { ...o(0, 0.27, 0), sx: 1.05, sy: 1.25, sz: 0.85 }, 10)
    .ovale(0.075, PIERRE, o(0, 0.43, 0.01), 10)
    .ovale(0.037, PIERRE, o(0, 0.505, 0), 8);
  const geste = jour % 4;
  if (geste === 0) a.ovale(0.05, PIERRE, { ...o(0, 0.2, 0.1), sx: 1.4, sy: 0.6 }, 6);
  else if (geste === 1) a.ovale(0.035, PIERRE, { ...o(0.08, 0.31, 0.09), sy: 1.4 }, 6).ovale(0.035, PIERRE, o(-0.06, 0.19, 0.1), 6);
  else if (geste === 2) a.ovale(0.035, PIERRE, { ...o(0, 0.3, 0.1), sy: 1.5 }, 6).ovale(0.03, PIERRE, o(0, 0.23, 0.11), 6);
  else a.ovale(0.04, PIERRE, o(-0.08, 0.2, 0.1), 6).ovale(0.04, PIERRE, o(0.08, 0.2, 0.1), 6);
  // le halo : rond ou en pointe (en forme de flamme)
  a.piece(new THREE.CircleGeometry(0.16, jour % 3 ? 12 : 5), PIERRE_F, { ...o(0, 0.4, -0.07), sy: jour % 3 ? 1 : 1.35, trait: false });
}

/**
 * L'oni à la torche (le secret) : un grand démon rouge, gentil, de Kunisaki (ici, les oni sont des bouddhas déguisés) : ses
 * cornes, ses boucles noires, ses gros yeux ronds, son sourire et ses deux crocs, sa peau de tigre, sa cape de paille, sa
 * torche de bambou allumée. arriver(chemin) : il descend de la montagne ; taper() : il tape le voyageur sur la tête avec sa
 * torche (la fête du feu : une année sans maladie) ; donnerKoban(x, y, z), koban(oui) ; partir(chemin, …, veille) : il
 * remonte, puis, les nuits, se chauffe à son brasero (veille). lampe : sa lumière (lueurs.js, mobile).
 */
function creerOni(ctx, atelier, lampe) {
  const { THREE, P } = ctx;
  const RO = P.oniRouge || '#d9482f', RF = P.oniFonce || '#a83420', TIGRE = P.tigre || '#e8a43a', PAILLE = '#c8a868', NOIR = '#231c1c';
  const groupe = new THREE.Group(), corps = new THREE.Group(), brasD = new THREE.Group(), jambes = [new THREE.Group(), new THREE.Group()];
  groupe.add(corps);
  corps.add(brasD, ...jambes);
  groupe.scale.setScalar(0.84);
  // le corps : le ventre, le torse, la peau de tigre, la cape de paille ; la tête ; le bras gauche, le poing sur la hanche
  const a = atelier(), yT = 2.35;
  a.ovale(0.5, RO, { y: 1.25, sx: 1.0, sy: 1.05, sz: 0.85 }, 14).ovale(0.45, RO, { y: 1.75, sx: 1.12, sy: 0.75, sz: 0.8 }, 14)
    .cylindre(0.52, 0.6, 0.38, 16, TIGRE, { y: 0.9, teinte: (px, py) => (Math.floor(py * 18 + px * 9 + 50) % 3 === 0 ? '#2a2420' : TIGRE) })
    .piece(new THREE.CylinderGeometry(0.4, 0.78, 0.6, 20, 2, true), PAILLE, {
      y: 1.86, teinte: (px, py, pz) => (Math.floor(Math.atan2(pz, px) * 9 + 20) % 2 ? PAILLE : '#b8965a'),
      deformer: (px, py, pz) => { const k = 1 + 0.06 * Math.sin(Math.atan2(pz, px) * 13) * (0.5 - py); return [px * k, py, pz * k]; },
    })
    .ovale(0.36, RO, { y: yT, sx: 1.0, sy: 0.95, sz: 0.92 }, 16);
  for (let k = 0; k < 11; k++) {
    const t = -PI * 0.1 + (k / 10) * PI * 1.2;
    a.boule(0.1, NOIR, { x: Math.cos(t) * 0.3, y: yT + 0.2 + 0.08 * Math.sin(k * 1.9), z: -Math.sin(t) * 0.22 - 0.06 }, 1);
  }
  for (const u of [-1, 1]) {
    a.cone(0.07, 0.28, 8, '#efe4c4', { x: u * 0.17, y: yT + 0.4, z: 0.04, rz: -u * 0.35 })
      .ovale(0.075, '#fbf6ea', { x: u * 0.13, y: yT + 0.06, z: 0.3, sz: 0.5 }, 10)
      .ovale(0.036, NOIR, { x: u * 0.13, y: yT + 0.05, z: 0.34, sz: 0.5 }, 8)
      .boite(0.15, 0.045, 0.05, NOIR, { x: u * 0.13, y: yT + 0.17, z: 0.31, rz: u * 0.22 })
      .ovale(0.07, RO, { x: u * 0.35, y: yT + 0.02, z: 0, sx: 0.5, sy: 1.2, sz: 0.7 }, 8)
      .ovale(0.065, '#e8705a', { x: u * 0.2, y: yT - 0.08, z: 0.27, sz: 0.5 }, 8);
  }
  a.ovale(0.07, RF, { y: yT - 0.03, z: 0.33, sx: 1.25, sy: 0.9 }, 8)
    .ovale(0.11, '#5a1a14', { y: yT - 0.17, z: 0.27, sx: 1.45, sy: 0.5, sz: 0.5 }, 10)
    .cone(0.024, 0.065, 5, '#fbf6ea', { x: -0.07, y: yT - 0.13, z: 0.31, rx: PI })
    .cone(0.024, 0.065, 5, '#fbf6ea', { x: 0.07, y: yT - 0.13, z: 0.31, rx: PI })
    .baton([0.52, 1.85, 0], [0.66, 1.38, 0.06], 0.13, RO, 8).boule(0.12, RO, { x: 0.66, y: 1.38, z: 0.06 }, 1)
    .baton([0.66, 1.38, 0.06], [0.5, 1.08, 0.18], 0.11, RO, 8).boule(0.12, RO, { x: 0.5, y: 1.05, z: 0.2 }, 1)
    .piece(new THREE.TorusGeometry(0.12, 0.03, 6, 12), '#d9a52e', { x: 0.64, y: 1.22, z: 0.12, rx: PI / 2 });
  corps.add(ctx.maillage(a.fin(0, true)));
  // le bras droit et sa torche (il pivote à l'épaule)
  brasD.position.set(-0.52, 1.85, 0);
  const b = atelier();
  b.baton([0, 0, 0], [-0.12, -0.45, 0.12], 0.13, RO, 8).boule(0.12, RO, { x: -0.12, y: -0.45, z: 0.12 }, 1)
    .baton([-0.12, -0.45, 0.12], [-0.05, -0.5, 0.48], 0.11, RO, 8).boule(0.13, RO, { x: -0.05, y: -0.5, z: 0.5 }, 1)
    .fut([-0.05, -0.95, 0.5], [-0.05, 0.25, 0.54], 0.07, 0.09, '#8a6a3a', 7).fut([-0.05, 0.22, 0.54], [-0.05, 0.42, 0.55], 0.1, 0.08, '#2a2018', 7);
  brasD.add(ctx.maillage(b.fin(0, true)));
  const HAUT_TORCHE = new THREE.Vector3(-0.05, 0.55, 0.55);
  const feu = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.05, 0.6, 0.55, -0.02, 0.78, 0.55, -0.08, 0.7, 0.56]), 3)),
    new THREE.PointsMaterial({ color: '#ffa040', size: 40, sizeAttenuation: true, map: flammeDouce(THREE), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  feu.material.size = 0.7;
  feu.renderOrder = 3;
  brasD.add(feu);
  // les jambes (elles pivotent aux hanches) : la cuisse, le genou, le mollet, le pied
  jambes.forEach((j, i) => {
    const u = i ? 1 : -1, c = atelier();
    j.position.set(u * 0.24, 0.85, 0);
    c.baton([0, 0, 0], [0, -0.42, 0.03], 0.17, RO, 8).boule(0.14, RO, { y: -0.42, z: 0.03 }, 1).baton([0, -0.42, 0.03], [0, -0.8, 0], 0.14, RO, 8)
      .ovale(0.15, RF, { y: -0.82, z: 0.1, sx: 0.9, sy: 0.5, sz: 1.35 }, 10);
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
    async partir(pts, terrain, ou) {
      await suivre([...pts].reverse(), terrain);
      groupe.visible = false;
      scene = false;
      veille = ou;
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
        m.s = Math.min(L, m.s + dt * 1.15);
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
      for (let k = 0; k < 3; k++) P2.setXYZ(k, -0.05 + 0.04 * Math.sin(temps * (7 + k) + k), 0.62 + 0.1 * k + 0.05 * Math.sin(temps * (9 + 2 * k)), 0.55 + 0.03 * Math.cos(temps * 6 + k));
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
  // le palier et les marches des Nio : la terre tassée et les pierres
  if (dansRect(PALIER, x, z, 0.2) || dansRect(MARCHES_NIO, x, z, 0.2)) return [bruit > 0.6 ? '#6f6a5a' : '#655f50', M.dalles];
  // la terrasse : le gravier ; le belvédère : la roche
  if (dansRect(BELVEDERE, x, z, 0.1)) return [bruit > 0.5 ? '#7a7666' : '#6e6a5c', M.roche];
  if (dansRect(TERRASSE, x, z, 0.05)) return [b2 > 0.66 ? '#5f6e48' : bruit > 0.6 ? '#7e7b70' : bruit > 0.3 ? '#757267' : '#6e6b60', b2 > 0.66 ? M.mousse : M.terre];
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
      yamabiko: ['L’écho de la falaise', 'sur la terrasse, face à la falaise : appeler trois fois, et écouter qui répond'],
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
    yamabushi: ['Je suis un yamabushi : je prie en marchant dans les montagnes. Ici, depuis plus de mille ans, on mêle les dieux des montagnes et les bouddhas.', 'Tu vois la conque à ma ceinture ? On la souffle pour s’appeler d’une montagne à l’autre. Peut-être qu’un jour, tu en auras une…'],
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
    cascade: ['Un mince filet d’eau tombe du haut de la falaise dans un petit bassin. Fudō Myōō (不動明王), le gardien au sabre, le regarde tomber.', 'Les yamabushi viennent prier sous les cascades, même en hiver.'],
    cascadeNuit: ['On ne voit plus la cascade, on l’entend seulement. Elle ne s’arrête jamais.'],
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
      yamabiko: ['The cliff’s echo', 'on the terrace, facing the cliff: call out three times, and listen to who answers'],
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
    yamabushi: ['I am a yamabushi: I pray by walking in the mountains. Here, for over a thousand years, the mountain gods and the Buddhas have been worshipped together.', 'See the conch at my belt? We blow it to call to each other from one mountain to another. Maybe one day you’ll have one too…'],
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
    cascade: ['A thin thread of water falls from the top of the cliff into a small pool. Fudō Myōō (不動明王), the guardian with the sword, watches it fall.', 'The yamabushi come to pray under waterfalls, even in winter.'],
    cascadeNuit: ['You can’t see the waterfall anymore, only hear it. It never stops.'],
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
      yamabiko: ['山びこ', 'テラスで　がけに　むかって　三回　よぶ。だれが　こたえるか　きく'],
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
    yamabushi: ['わたしは　山伏。山を　あるきながら　いのる。ここでは　千年いじょう　まえから、山の　かみさまと　仏さまを　いっしょに　まつってきた。', 'こしの　ほらがいが　見えるかな？　山から　山へ　よびあうのに　ふくんだ。いつか　きみにも……'],
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
    cascade: ['がけの　上から　ほそい　水が　小さな　いけに　おちる。けんを　もった　不動明王が　見まもっている。', '山伏は　ふゆでも　たきに　うたれて　いのるんだ。'],
    cascadeNuit: ['たきは　もう　見えない。おとだけ。ずっと　とまらない。'],
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
