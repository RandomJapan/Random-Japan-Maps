// ================================================================
//  Les gorges de Takachiho (高千穂峡), dans les montagnes du nord de Miyazaki (Kyūshū) : la rivière Gokase a creusé un
//  canyon étroit dans la lave d'une éruption du mont Aso, refroidie en colonnes de basalte (柱状節理) ; l'eau y est d'un
//  vert émeraude. La cascade de Manai (真名井の滝), qui tombe de l'étang d'Onokoro du haut de la falaise ; des barques
//  qu'on loue en bas d'un long escalier, pour ramer jusque sous la cascade. En haut, à l'ouest : la place de l'étang, le
//  restaurant des nouilles qui glissent dans un bambou (流しそうめん), la boutique ; sur l'autre rive, la promenade (la
//  pierre du démon Kihachi, l'endroit le plus étroit, « le saut de la lance ») ; deux ponts de pierre. Au nord, le
//  sanctuaire du mythe de la grotte céleste (le kagura de la nuit, les cèdres mariés, la statue du géant Tajikarao qui
//  arrache la porte de la grotte, des coqs en liberté) ; en contrebas, la rivière Iwato, la grotte où la déesse du soleil
//  Amaterasu s'était enfermée, et celle où les huit millions de dieux tinrent conseil (天安河原), pleine de petits tas de
//  pierres. Les lieux sont rapprochés : le sanctuaire d'Amanoiwato est à huit kilomètres des gorges.
//  Son secret : le miroir du soleil. Pour faire sortir Amaterasu de sa grotte, les dieux suspendirent un miroir et des
//  joyaux à l'arbre sacré devant elle, firent chanter les coqs, et la déesse Uzume dansa. Un éclat brille sous la falaise
//  en amont de la cascade, qu'on ne voit bien que de la barque : le miroir. Rapporté à l'arbre sacré du lieu de prière,
//  face à la grotte, le ciel s'assombrit comme une éclipse, les coqs chantent, le compagnon danse, la porte de pierre
//  s'écarte et la lumière jaillit ; un koban (tresors.js). Bunbuku attend sous les érables de la promenade.
//  Repère : x vers l'est, z vers le sud, y vers le haut, en mètres ; la place à y = 0, la promenade à 1,2, la rivière à
//  −16, la rivière Iwato à −7,4. ctx : { THREE, atelier, P (palette), peinture, perso }.
// ================================================================
import { creerMonde, interactionsBancs, lisse, hasard, bruitDoux, surLaLigne } from './monde.js';
import { panneau, trepied, PAPIER_PANNEAU } from './decor.js';
import { MATIERES as M } from './textures.js';
import { secretTrouve, indiceVu } from './tresors.js';
import { creerPersonnage } from './personnages.js';

const PI = Math.PI;

// ---------------------------------------------------------------- Le plan
// la rivière au fond de la gorge, le fond de son lit
const NIV = -16, FOND = -18.6;
// l'axe de la gorge, du sud au nord : [x, z, demi-largeur de l'eau, du milieu au pied des parois]. Le bassin des barques
// (large), la cascade (z ≈ 10, sur la paroi ouest), puis la gorge se resserre jusqu'au « saut de la lance » (z ≈ −43) ;
// le pont de Shinkyō, la rivière Iwato qui arrive de l'ouest (z ≈ −121). À ses deux bouts, elle tourne (vers l'ouest au
// sud, vers l'est au nord) : des ponts, on voit les colonnes du virage, pas son bout (2026-10-25 : droite, elle finissait
// en cul-de-sac flou, le sol grossier au-delà des colonnes)
const GORGE = [
  [-100, 128, 7], [-60, 125, 7], [-40, 122, 6.9], [-26, 118, 6.9], [-15, 112, 7.0], [-7.5, 104, 7.1], [-3, 94, 7.3],
  [-1, 82, 7.5], [0, 66, 8], [-0.5, 52, 8.6], [-1, 38, 9.1], [-0.5, 24, 9.5],
  [0.5, 10, 9.5], [1.5, -4, 8.1], [1.6, -17, 6.7], [0.6, -28, 5.3], [-0.4, -36, 4.1], [-0.8, -43, 2.9],
  [0, -50, 3.4], [1.5, -60, 4.6], [2.5, -72, 5.8], [2.2, -88, 6.2], [1.0, -104, 6.2], [-0.5, -120, 6.0],
  [-1.5, -134, 6.0], [0.5, -146, 6.0], [6.5, -155, 6.1], [16, -161, 6.2], [30, -165, 6.3], [55, -168, 6.4], [100, -170, 6.4],
];
// les deux rives : la place (ouest), la promenade (est)
const RIVE_O = 0, RIVE_E = 1.2;
// le garde-corps des rives, à cette distance du pied des parois
const RAMBARDE = 2.7;
// les deux ponts de pierre : au sud (御橋, le départ), au nord (神橋, vers le sanctuaire)
const PONT_S = { z: 66, l: 3.0 };
const PONT_N = { z: -62, l: 2.7 };
// l'escalier qui descend aux barques, le long de la paroi ouest (de la place jusqu'à l'eau), et le ponton
const ESCALIER = { z0: 18.4, z1: 44, l: 1.75, n: 87 };
const PONTON = { z0: 44, z1: 57.6, l: 3.4, y: NIV + 0.35 };
// la cascade de Manai : là où l'eau de l'étang passe le bord de la paroi ouest
const CASCADE = { z: 10, haut: -0.5, large: 2.6, avance: 1.5 };
// l'étang d'Onokoro (おのころ池) et son îlot ; l'eau en sort par un canal jusqu'à la cascade
const ETANG = { x: -27, z: 6, r: 8, eau: -0.42, fond: -1.25 };
const ILOT = { x: -28.6, z: 4.4, r: 1.9 };
// le restaurant aux nouilles (千穂の家) et sa gouttière de bambou ; la boutique
const CHIHO = { x: -36.5, z: 29, ry: PI / 2 };
const SOMEN = { x: -30.6, z0: 21.2, z1: 28.6, y0: 1.02, y1: 0.86 };
const BOUTIQUE = { x: -40.5, z: -13, ry: PI / 2 };
// derrière le restaurant, le jardin (2026-10-25 : « tout un endroit où il n'y a rien ») : le champ de thé (ses rangs le long
// de z), le pavillon, le puits, le bosquet de bambous, l'abri des jizō ; les chemins de terre qui y mènent
const THE = { x0: -64, x1: -52, z0: 25, z1: 39, pas: 2 };
const AZUMAYA = { x: -47, z: 44 };
const PUITS = { x: -55, z: 62 };
const BAMBOUS = { x: -63.2, z: 55.5, r: 5.2 };
const JIZO = { x: -66.2, z: 2.5 };
const CHEMINS_JARDIN = [
  [[-40.4, 25.6], [-46, 30.4], [-50.6, 32]], [[-46, 30.4], [-47.2, 40.5], [-47, 42.6]], [[-47, 45.4], [-51, 54], [-54.2, 60.2]],
  [[-56.6, 61.2], [-59.4, 58.4]], [[-46, 30.4], [-52, 18], [-60, 7.5], [-64.6, 3.4]],
];
// la promenade : la pierre du démon Kihachi, le belvédère de la cascade, le « saut de la lance » (槍飛), le marchand
const KIHACHI = { x: 17.4, z: -14.5, r: 2.4 };
const VUE_CASCADE = { z: 10 };
const YARITOBI = { z: -43 };
const MARCHAND = { x: 21.2, z: -30.5, cap: -PI / 2 + 0.3 };
// le sanctuaire (le mythe de la grotte céleste) : son enclos, le torii, l'allée, le pavillon de prière, la scène du
// kagura, les cèdres mariés, la statue de Tajikarao, le lieu de prière face à la grotte (遥拝所) et son arbre sacré
const SANCT = { x0: -66, x1: -11, z0: -112, z1: -67 };
const TORII = { x: -26, z: -68.6 };
const HAIDEN = { x: -26, z: -88.5 };
const KAGURA = { x: -50, z: -88 };
const MEOTO = { x: -57, z: -73.5, rx: 2.7, rz: 2.3 };
const TAJIKARAO = { x: -16.2, z: -71.6, ry: -0.35 };
const CHOZU = { x: -34.2, z: -73.4 };
const SHINBOKU = { x: -15.5, z: -92 };
const JUYOSHO = { x: -17.6, z: -83.5 };
const YOHAI = { x: -40, z: -109.4 };
const SAKAKI = { x: -42.2, z: -110.4 };
const OFFRANDES = { x: -40.8, z: -110.6 };
// la rivière Iwato (岩戸川), qui vient de l'ouest et tombe dans la gorge : son axe [x, z], sa largeur d'eau, son niveau
const IWATO = [[-160, -132], [-110, -129], [-82, -126.4], [-64, -124], [-45, -123.4], [-25, -122.4], [-10, -121.5], [-3, -121]];
const NIV_I = -7.4, LARGE_I = 2.8;
// le chemin qui descend du sanctuaire à la rivière, le pont en arc, la grotte des dieux (天安河原), la grotte d'Amaterasu
const DESCENTE = [[-53, -110.6, 0], [-63.4, -118.9, NIV_I + 0.5]];
const PONT_I = { x: -66 };
const YASU = { x: -80, z: -131.2, rx: 7.2, rz: 7.0, h: 5.6 };
const GROTTE = { x: -40, z: -126.6 };
/** Le pied de la falaise au nord de la rivière Iwato (sa distance à l'axe) : derrière la corniche à l'ouest du pont. */
const PIED_NORD = (x) => (x < -63 && x > -100 ? 5.0 : 3.2);
/** Le couloir de vue du lieu de prière vers la grotte d'Amaterasu, de l'autre côté de la rivière : ni arbre ni buisson. */
const vueGrotte = (x, z) => z < YOHAI.z - 1 && z > GROTTE.z + 0.5 && Math.abs(x - GROTTE.x) < 3.6 + 0.14 * (YOHAI.z - z);
const DEPART = { x: -0.6, z: 65.1 };

// ---------------------------------------------------------------- La géométrie de la gorge
/** Les segments de l'axe de la gorge (précalculés). */
let longueur = 0;
const SEGS = GORGE.slice(0, -1).map(([x0, z0, w0], i) => {
  const [x1, z1, w1] = GORGE[i + 1], dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz), s = longueur;
  longueur += l;
  // (s : la longueur d'axe au début du segment ; sa boîte, pour écarter vite les segments trop loin)
  return { i, x0, z0, w0, w1, dx, dz, l, s, xa: Math.min(x0, x1), xb: Math.max(x0, x1), za: Math.min(z0, z1), zb: Math.max(z0, z1) };
});
let dernierSeg = 0;
/**
 * Le point de l'axe de la gorge le plus proche de x, z : la distance d, la demi-largeur de l'eau w, le côté (−1 l'ouest,
 * 1 l'est), le point de l'axe (cx, cz), s (la longueur d'axe depuis le sud) et la normale vers l'est (ex, ez).
 */
function surGorge(x, z) {
  // (le relief l'appelle des dizaines de fois par image : le segment trouvé la dernière fois d'abord, puis seulement ceux dont
  // la boîte est plus près que le meilleur point déjà trouvé ; pas d'objet créé en chemin)
  let dmin = Infinity, gm = null, fm = 0, cxm = 0, czm = 0;
  for (let k = -1; k < SEGS.length; k++) {
    if (k === dernierSeg) continue;
    const g = SEGS[k < 0 ? dernierSeg : k];
    const bx = x < g.xa ? g.xa - x : x > g.xb ? x - g.xb : 0, bz = z < g.za ? g.za - z : z > g.zb ? z - g.zb : 0;
    if (bx * bx + bz * bz >= dmin * dmin) continue;
    const f = Math.min(1, Math.max(0, ((x - g.x0) * g.dx + (z - g.z0) * g.dz) / (g.l * g.l)));
    const cx = g.x0 + f * g.dx, cz = g.z0 + f * g.dz, d = Math.hypot(x - cx, z - cz);
    if (d < dmin) { dmin = d; gm = g; fm = f; cxm = cx; czm = cz; }
  }
  dernierSeg = gm.i;
  const ex = -gm.dz / gm.l, ez = gm.dx / gm.l;
  return { d: dmin, w: gm.w0 + (gm.w1 - gm.w0) * fm, cote: (x - cxm) * ex + (z - czm) * ez >= 0 ? 1 : -1, cx: cxm, cz: czm, s: gm.s + fm * gm.l, ex, ez };
}
/**
 * L'axe de la gorge échantillonné tous les demi-mètres, avec des normales lissées (une moyenne sur quelques mètres : les
 * parois ne cassent pas aux coudes de l'axe) : [x, z, w, nx, nz] (n vers l'est).
 */
const AXE = (() => {
  const pts = [];
  for (const g of SEGS) {
    const n = Math.max(1, Math.round(g.l / 0.5));
    for (let k = 0; k < n; k++) { const f = k / n; pts.push([g.x0 + f * g.dx, g.z0 + f * g.dz, g.w0 + (g.w1 - g.w0) * f]); }
  }
  const der = GORGE[GORGE.length - 1];
  pts.push([der[0], der[1], der[2]]);
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 6)], b = pts[Math.min(pts.length - 1, i + 6)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1;
    return [p[0], p[1], p[2], -dz / l, dx / l];
  });
})();
/** Le pied de la paroi du côté cote (−1, 1) à la hauteur de z (le point de l'axe échantillonné le plus proche en z). */
function piedParoi(cote, z) {
  let m = AXE[0], e = Infinity;
  for (const p of AXE) { const d = Math.abs(p[1] - z); if (d < e) { e = d; m = p; } }
  return [m[0] + cote * m[3] * m[2], m[1] + cote * m[4] * m[2], m[3] * cote, m[4] * cote];
}

/** Le point de la rivière Iwato le plus proche : d, le côté (1 le nord, −1 le sud), s, et le point (cx, cz). */
function surIwato(x, z) {
  let dmin = Infinity, best = null, s = 0, sm = 0;
  for (let k = 0; k < IWATO.length - 1; k++) {
    const [x0, z0] = IWATO[k], [x1, z1] = IWATO[k + 1], dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz);
    const f = Math.min(1, Math.max(0, ((x - x0) * dx + (z - z0) * dz) / (l * l)));
    const cx = x0 + f * dx, cz = z0 + f * dz, d = Math.hypot(x - cx, z - cz);
    if (d < dmin) { dmin = d; best = { cx, cz, nx: dz / l, nz: -dx / l }; sm = s + f * l; }
    s += l;
  }
  return { d: dmin, cote: (x - best.cx) * best.nx + (z - best.cz) * best.nz >= 0 ? 1 : -1, s: sm, cx: best.cx, cz: best.cz };
}

/** Le dessus du tablier d'un pont (PONT_S, PONT_N) : de la place, à l'ouest, à la promenade, à l'est, un peu en pente. */
function tablier(Pt) {
  const g = surGorge(0, Pt.z), x0 = g.cx - g.w - RAMBARDE - 1.0, x1 = g.cx + g.w + RAMBARDE + 1.0, y0 = RIVE_O + 0.07, y1 = RIVE_E + 0.07;
  return { g, x0, x1, y0, y1, yA: (x) => y0 + (y1 - y0) * (x - x0) / (x1 - x0) };
}
const TABLIERS = [PONT_S, PONT_N].map((Pt) => ({ Pt, ...tablier(Pt) }));
/** La hauteur du tablier au-dessus de (x, z) si un pont y passe (marge : en plus de lui, tout autour), sinon null. */
function sousTablier(x, z, marge = 0) {
  for (const t of TABLIERS) {
    if (Math.abs(z - t.Pt.z) < t.Pt.l / 2 + marge && x > t.x0 - marge && x < t.x1 + marge) return t.yA(Math.min(t.x1, Math.max(t.x0, x)));
  }
  return null;
}

// ---------------------------------------------------------------- Le relief
/** Le contour de l'étang (le rayon selon l'angle autour de son centre, angle 0 vers +z). */
const rayonEtang = (a) => ETANG.r * (1 + 0.12 * Math.sin(3 * a + 1) + 0.07 * Math.sin(5 * a + 0.4));
// le canal de l'étang à la cascade (sur le plateau), jusqu'au pied de la paroi (son bord) ; là où il passe sous le
// garde-corps (z) ; la dalle où l'on traverse, au milieu du chemin du bord (x, z, et la direction du canal)
const CANAL = (() => { const [px, pz] = piedParoi(-1, CASCADE.z); return [[-19.4, 8.0], [-14, 9.2], [px, pz]]; })();
const CANAL_GARDE = (() => { const [px, pz, ox, oz] = piedParoi(-1, CASCADE.z), x = px + ox * RAMBARDE; return CANAL[1][1] + (CANAL[2][1] - CANAL[1][1]) * (x - CANAL[1][0]) / (CANAL[2][0] - CANAL[1][0]); })();
const DALLE = (() => {
  const [px, , ox] = piedParoi(-1, CASCADE.z), x = px + ox * (RAMBARDE + 1.3), [ax, az] = CANAL[1], [bx, bz] = CANAL[2], l = Math.hypot(bx - ax, bz - az);
  return { x, z: az + (bz - az) * (x - ax) / (bx - ax), ux: (bx - ax) / l, uz: (bz - az) / l, s: (x - ax) / (bx - ax) * l, l };
})();

/** Le plateau : la place (0) à l'ouest, la promenade (1,2) à l'est ; plus loin, les collines et les montagnes boisées. */
function plateau(x, z, cote) {
  let h = cote > 0 ? RIVE_E : RIVE_O;
  if (cote > 0) h += lisse(27, 80, x) * 9 + lisse(80, 240, x) * 26;
  else h += lisse(-74, -150, x) * 8 + lisse(-150, -320, x) * 26;
  // au nord, au-delà de la rivière Iwato, la montagne ; au sud, des collines
  h += lisse(-128, -200, z) * 14 + lisse(-200, -420, z) * 30 + lisse(80, 170, z) * 9 + lisse(170, 380, z) * 22;
  // des ondulations, hors de ce qu'on parcourt
  const loin = Math.max(-74 - x, x - 30, -128 - z, z - 82, 0);
  h += lisse(0, 40, loin) * (bruitDoux(x * 0.6, z * 0.6, 40) - 0.5) * 14;
  // au loin, les montagnes de Kyūshū (le mont Sobo au nord-ouest)
  const r = Math.hypot(x, z);
  if (r > 420) {
    const a = Math.atan2(x, -z), nordOuest = 0.5 + 0.5 * Math.cos(a + 0.8);
    h += lisse(420, 900, r) * (70 + 160 * nordOuest) * (0.7 + 0.3 * Math.sin(a * 5 + 1) + 0.15 * Math.sin(a * 13 + 2) + 0.2 * bruitDoux(x * 0.004, z * 0.004, 1));
  }
  return h;
}

/**
 * Le sol. Le plateau, entaillé par la gorge : le lit de la rivière au fond, puis une paroi presque droite qui remonte au
 * bord sur un mètre, un mètre derrière le pied des colonnes de basalte (elles la cachent : leur face reste devant elle, même
 * là où les triangles de la grille d'un mètre avancent ; à 10 cm derrière, le sol passait devant le bas des colonnes) ;
 * la vallée de la rivière Iwato (son lit, ses corniches où passe le chemin, la falaise au nord, la grotte des dieux) ;
 * l'étang et son îlot, le canal ; sous l'escalier qui descend du sanctuaire, son pied.
 */
function terrain(x, z) {
  const g = surGorge(x, z);
  let h = plateau(x, z, g.cote);
  // la vallée de la rivière Iwato (à l'ouest de la gorge, au nord du sanctuaire)
  if (x < 6 && z < -100 && z > -150) {
    const v = surIwato(x, z), d = v.d;
    let hv = Infinity;
    if (d < LARGE_I) hv = NIV_I - 0.9 + 0.6 * (d / LARGE_I) ** 2;
    else if (v.cote < 0) {
      // la rive sud : la corniche du chemin (à l'ouest du sanctuaire), puis la pente qui monte au sanctuaire
      const corniche = x > -72 && x < -28;
      hv = corniche ? (d < 5.4 ? NIV_I + 0.5 : NIV_I + 0.5 + (h - NIV_I - 0.5) * lisse(5.4, 11.8, d)) : NIV_I - 0.3 + (h - NIV_I + 0.3) * lisse(LARGE_I, 11.8, d);
      if (d < 3.0) hv = NIV_I - 0.3 + 0.8 * lisse(LARGE_I, 3.0, d);
    } else {
      // la rive nord : à l'ouest du pont, une corniche au pied de la falaise ; puis la falaise de basalte (ses colonnes
      // devant : le sol ne remonte qu'un mètre derrière leur pied, comme dans la gorge)
      const corniche = x < -63 && x > -100, pied = PIED_NORD(x);
      hv = d < pied + 1.0 ? (corniche ? NIV_I + 0.5 : NIV_I - 0.3) : NIV_I + 0.5 + (h + 4 - NIV_I - 0.5) * lisse(pied + 1.0, pied + 2.2, d);
      if (corniche && d < 3.0) hv = NIV_I - 0.3 + 0.8 * lisse(LARGE_I, 3.0, d);
    }
    // la grotte d'Amaterasu : derrière sa paroi, le sol de la falaise reste sous son creux (avec la grille d'un mètre du sol,
    // il le traversait) ; la paroi rocheuse cache cette encoche
    if (Math.abs(x - GROTTE.x) < 2.4 && z < GROTTE.z - 0.2 && z > GROTTE.z - 2.0) hv = Math.min(hv, NIV_I);
    // la grotte des dieux : son sol, sous la voûte (une demi-ellipse derrière l'ouverture, au pied de la falaise)
    const ex = (x - YASU.x) / YASU.rx, ez = (z - YASU.z) / YASU.rz;
    if (z < YASU.z + 0.3 && ex * ex + ez * ez < 1) hv = Math.min(hv, NIV_I + 0.7 + 0.2 * lisse(0.4, 1, Math.hypot(ex, ez)));
    if (hv < h) h = hv;
  }
  // la gorge : le lit, puis la paroi
  if (g.d < g.w + 2.2) {
    const lit = FOND + (NIV - 0.65 - FOND) * (Math.min(g.d, g.w) / g.w) ** 2;
    const hg = lit + (h - lit) * lisse(g.w + 1.0, g.w + 2.2, g.d);
    if (hg < h) h = hg;
  }
  // l'étang : sa cuvette, l'îlot au milieu
  const de = Math.hypot(x - ETANG.x, z - ETANG.z);
  if (de < ETANG.r * 1.3) {
    const r = rayonEtang(Math.atan2(x - ETANG.x, z - ETANG.z));
    if (de < r + 0.6) h = Math.min(h, ETANG.fond + (h - ETANG.fond) * lisse(r * 0.72, r + 0.6, de));
    const di = Math.hypot(x - ILOT.x, z - ILOT.z);
    if (di < ILOT.r + 0.8) h = Math.max(h, 0.25 - 1.5 * lisse(ILOT.r * 0.4, ILOT.r + 0.8, di));
  }
  // le canal de l'étang à la cascade : un lit de pierre de 1,2 m
  const c = surLaLigne(CANAL, x, z);
  if (c.d < 1.1 && g.d > g.w - 0.5) h = Math.min(h, -0.75 + 0.75 * lisse(0.6, 1.1, c.d));
  // sous l'escalier du sanctuaire à la rivière : entre les murets, le sol 30 cm sous la ligne du milieu des marches (leur
  // dessus est jusqu'à un demi-pas plus bas ; avec les 3 cm du sol dessiné, il passait devant chacune) ; sous les dalles du
  // haut et du bas, il redescend à 5 cm sous la ligne ; il rejoint la pente entre 1,8 et 3 m de côté (la grille d'un mètre
  // du sol ne suit pas une bande plus étroite : ses triangles passaient par-dessus le bord des marches), et au-delà des dalles
  {
    const [[ax, az, ay], [bx, bz, by]] = DESCENTE, l = Math.hypot(bx - ax, bz - az), ex = (bx - ax) / l, ez = (bz - az) / l;
    const u = (x - ax) * ex + (z - az) * ez, w = Math.abs((x - ax) * ez - (z - az) * ex);
    if (u > -2 && u < l + 2 && w < 1.8) {
      const yl = ay + (by - ay) * Math.min(1, Math.max(0, u / l)), cible = yl - 0.05 - 0.25 * lisse(-0.7, 0.1, u) * (1 - lisse(l - 0.1, l + 0.7, u));
      const f = (1 - lisse(1.8, 3.0, w)) * (1 - lisse(1.25, 1.8, -u)) * (1 - lisse(l + 1.25, l + 1.8, u));
      if (h > cible) h -= (h - cible) * f;
    }
  }
  // sous le tablier des ponts : le sol reste dessous (au bout est, la promenade est un peu plus haute que le tablier, et le
  // sol le recouvrait), puis remonte en 60 cm de chaque côté. 15 cm dessous : la grille fine du sol est dessinée 3 cm
  // au-dessus du terrain (balade.js) ; à 3 cm sous le tablier, elle le touchait, et le bout est du pont nord scintillait
  for (const t of TABLIERS) {
    const dz = Math.abs(z - t.Pt.z) - t.Pt.l / 2;
    if (dz < 0.6 && x > t.x0 && x < t.x1) {
      const sous = t.yA(x) - 0.15;
      if (h > sous) h = sous + (h - sous) * lisse(0, 0.6, dz);
    }
  }
  return h;
}

// ---------------------------------------------------------------- Où l'on peut aller
/** Le ponton et l'escalier des barques (dans la gorge, le long de la paroi ouest). */
function dansEscalier(x, z) {
  if (z < ESCALIER.z0 - 2.4 || z > PONTON.z1) return false;
  const [px] = piedParoi(-1, z);
  if (z <= ESCALIER.z1) return x > px + 0.1 && x < px + ESCALIER.l - 0.12;
  return x > px + 0.1 && x < px + PONTON.l - 0.15 && z > PONTON.z0 - 0.2 && z < PONTON.z1 - 0.3;
}
function dansLeCadre(x, z) {
  const g = surGorge(x, z);
  // les ponts
  for (const P of [PONT_S, PONT_N]) if (Math.abs(z - P.z) < P.l / 2 - 0.3 && g.d < g.w + RAMBARDE + 1.4) return true;
  if (dansEscalier(x, z)) return true;
  // le palier en haut de l'escalier, sur les colonnes
  if (g.cote < 0 && z > ESCALIER.z0 - 2.3 && z < ESCALIER.z0 + 0.1 && g.d > g.w - 1.6 && g.d < g.w + RAMBARDE + 1) return true;
  // la vallée de la rivière Iwato : l'escalier, la corniche sud, le pont, la corniche nord, la grotte des dieux
  if (z < -106 && x < -20) {
    const e = surLaLigne(DESCENTE, x, z);
    if (e.d < 0.7) return true;
    const v = surIwato(x, z);
    if (v.cote < 0 && x > -70 && x < -46 && v.d > 3.1 && v.d < 5.2) return true;
    if (Math.abs(x - PONT_I.x) < 0.75 && v.d < 5.6) return true;
    if (v.cote > 0 && x < -64 && x > -90 && v.d > 3.1 && v.d < 4.8) return true;
    const ex = (x - YASU.x) / (YASU.rx - 1.1), ez = (z - YASU.z) / (YASU.rz - 1.1);
    if (z < YASU.z + 0.4 && ex * ex + ez * ez < 1) return true;
  }
  if (g.d < g.w + RAMBARDE + 0.25) return false;
  if (g.cote > 0) return x < 27 && z > -64.5 && z < 73.5; // la promenade
  // la place et le chemin du sanctuaire ; le sanctuaire
  if (z > -66.5 && z < 73.5) return x > (z < -20 ? -30 : -70);
  return x > SANCT.x0 && x < SANCT.x1 && z > SANCT.z0 && z < -66;
}

/** Ce que le carnet et le menu savent du lieu, sans le construire. */
export const infos = {
  id: 'takachiho', carte: 'takachiho-gorge', video: '7645362939456785686',
  nom: { en: 'Takachiho', fr: 'Takachiho', ja: '高千穂峡' }, nomJa: '高千穂峡',
  tampons: [
    { id: 'barque', motif: 'barque', ja: '真名井の滝', encre: '#2a8a7a' },
    { id: 'somen', motif: 'somen', ja: '流しそうめん', encre: '#3a7a3a', forme: 'carre' },
    { id: 'kagura', motif: 'kagura', ja: '夜神楽', encre: '#b8402a' },
    { id: 'meoto', motif: 'meoto', ja: '夫婦杉', encre: '#3a5a3a', forme: 'carre' },
    { id: 'ishi', motif: 'ishi', ja: '天安河原', encre: '#4a4a5a' },
  ],
  get textes() { return TEXTES; },
};

/** La nuit : les lanternes de papier, les fenêtres, le papier des lampes s'allument. */
export const sortesNuit = (P) => ({ [P.shoji]: 'lumiere', [P.shojiCadre]: 'treillis' });

/** Un triangle A, B, C ajouté à pos, tourné vers n (retourné s'il regarde de l'autre côté). */
function triangle(pos, A, B, C, n) {
  const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  if (nx * n[0] + ny * n[1] + nz * n[2] < 0) pos.push(...A, ...C, ...B); else pos.push(...A, ...B, ...C);
}

export function construire(ctx) {
  const { THREE, atelier, P, peinture } = ctx;
  const objets = [];
  const monde = creerMonde({ terrain, cadre: dansLeCadre, profond: null, pente: null });
  const poser = (fin, x, z, o = {}) => objets.push({ fin, x, z, y: o.y ?? terrain(x, z), ry: o.ry || 0, ombre: o.ombre !== false, trait: o.trait !== false, dedans: o.dedans, avant: o.avant });
  const vers = (x, z, vx, vz) => Math.atan2(vx - x, vz - z);
  const bancs = [], lumieres = [], animes = [], vapeurs = [], courants = [];
  const etiquettes = [];
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
    monde.cercle(x, z, 0.4);
  };
  /**
   * Un banc de bois (assise à 0,45 m), long de l, en x, z, tourné vers cap ; on peut s'y asseoir. L'assise de deux
   * planches ; le dossier de deux planches, penché, tenu par des montants qui prolongent les pieds de derrière ; une
   * traverse sous l'assise. Tout est penché dans le repère du banc, puis tourné (ordre 'YXZ' : avant le 2026-10-25, le
   * dossier penchait autour de l'axe x du monde ; sur un banc tourné, il penchait de travers, et ne tenait sur rien).
   */
  const banc = (a, x, z, cap, l = 1.6) => {
    const y = terrain(x, z), R = repere(x, z, cap), INC = -0.2, T = { rx: INC, ordre: 'YXZ' };
    // (le long d'un montant penché : la hauteur et le recul à la hauteur h, avancés de av vers l'avant du dossier)
    const montant = (h, av) => { const t = (h - 0.68) / Math.cos(INC); return [y + h - Math.sin(INC) * av, -0.2 + Math.sin(INC) * t + Math.cos(INC) * av]; };
    for (const dz of [-0.1, 0.1]) a.boite(l, 0.04, 0.19, P.bois, R(0, y + 0.43, dz));
    const xs = l > 2 ? [-1, 0, 1] : [-1, 1];
    for (const s of xs) {
      const lx = s * (l / 2 - 0.14);
      for (const dz of [-0.15, 0.15]) a.boite(0.06, 0.42, 0.06, P.boisFonce, R(lx + (s ? 0 : 0.003), y + 0.21, dz));
      a.boite(0.05, 0.05, 0.33, P.boisFonce, R(lx, y + 0.34, 0));
      a.boite(0.06, 0.5, 0.05, P.boisFonce, R(lx, y + 0.68, -0.2, T));
    }
    for (const h of [0.62, 0.81]) { const [yy, zz] = montant(h, 0.043); a.boite(l - 0.08, 0.1, 0.03, P.bois2, R(0, yy, zz, T)); }
    const A = R(-l / 2 + 0.25, 0, 0.02), B = R(l / 2 - 0.25, 0, 0.02);
    bancs.push({ de: [A.x, A.z], a: [B.x, B.z], y: y + 0.48, cap, vue: 0.3 });
    monde.mur(R(-l / 2, 0, 0).x, R(-l / 2, 0, 0).z, R(l / 2, 0, 0).x, R(l / 2, 0, 0).z, 0.25);
  };
  /**
   * Un gros rocher arrondi par le temps (la pierre de Kihachi, la porte de la grotte, celle que porte Tajikarao) : un
   * icosaèdre subdivisé, déformé par des bosses douces (toujours les mêmes pour une graine), son dessous aplati (fond : sa
   * hauteur, en rayons), étiré de sx, sy, sz, penché de rz puis tourné de ry ; la mousse sur le dessus (au-dessus de
   * mousse, en rayons), le bas plus sombre ; tons : [clair, moyen, sombre, mousse, mousse sombre]. Renvoie surface(dx, dy,
   * dz, ecart) : le point de sa surface dans la direction (dx, dy, dz) de son repère, écarté de ecart vers l'extérieur.
   */
  const rocherSculpte = (a, x, y, z, r, o = {}) => {
    const { sx = 1, sy = 1, sz = 1, ry = 0, rz = 0, graine: g = 1, fond = -0.62, mousse = 0.45, finesse = 2, trait = true, sorte } = o;
    const tons = o.tons || [P.basalteClair, P.basalte, P.basalteFonce, P.mousseRoche, P.mousseRocheFonce];
    const k = (ux, uy, uz) => 1 + 0.1 * Math.sin(ux * 2.9 + g) * Math.cos(uy * 2.3 - g * 0.7) + 0.07 * Math.sin(uz * 3.7 + ux * 1.7 + g * 2.1) + 0.04 * Math.sin(uy * 5.3 + uz * 4.1 + g * 1.3);
    const local = (px, py, pz) => {
      const l = Math.hypot(px, py, pz) || 1, ux = px / l, uy = py / l, uz = pz / l, kk = k(ux, uy, uz);
      return [ux * kk * r * sx, Math.max(uy * kk, fond) * r * sy, uz * kk * r * sz];
    };
    a.piece(new THREE.IcosahedronGeometry(1, finesse), tons[1], {
      x, y, z, ry, rz, ordre: 'YXZ', trait, nuance: 0.07, deformer: local, sorte,
      teinte: (px, py, pz) => {
        const h = (py - y) / (r * sy), b = bruitDoux(px * 1.9 + g * 3, pz * 1.9 - g * 3, 1.2);
        if (h > mousse + 0.3 * (b - 0.5)) return b > 0.5 ? tons[3] : tons[4];
        if (h < fond + 0.25) return tons[2];
        return b > 0.64 ? tons[0] : b < 0.32 ? tons[2] : tons[1];
      },
    });
    const c = Math.cos(ry), sn = Math.sin(ry);
    return (dx, dy, dz, ecart = 0) => {
      const [lx, ly, lz] = local(dx, dy, dz);
      let nx = lx / (sx * sx), ny = ly / (sy * sy), nz = lz / (sz * sz);
      const nl = Math.hypot(nx, ny, nz) || 1;
      nx /= nl; ny /= nl; nz /= nl;
      const qx = lx + nx * ecart, qy = ly + ny * ecart, qz = lz + nz * ecart;
      return [x + qx * c + qz * sn, y + qy, z - qx * sn + qz * c];
    };
  };
  /** Une corde sacrée fermée qui fait le tour de points [x, y, z] (une pierre, un tronc) : la paille tressée, deux teintes. */
  const cordeFermee = (a, pts, r) => {
    const courbe = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), true);
    a.piece(new THREE.TubeGeometry(courbe, pts.length * 3, r, 7, true), '#e6c87a', { nuance: 0.03, teinte: (px, py, pz) => (Math.floor(px * 38 + py * 55 + pz * 38 + 100) % 2 ? '#e6c87a' : '#c9a65a') });
  };
  /** Des papiers en zigzag (shide) pendus en x, y, z, leur face tournée vers ry ; s : leur taille. */
  const shide = (a, x, y, z, ry, s = 1) => {
    const c = Math.cos(ry), sn = Math.sin(ry);
    for (const [dx, dy, dz] of [[0, 0, 0], [0.024, -0.06, 0.004], [0, -0.12, 0], [0.024, -0.18, 0.004]]) {
      a.boite(0.05 * s, 0.064 * s, 0.008, P.papier, { x: x + dx * s * c + dz * sn, y: y + dy * s, z: z - dx * s * sn + dz * c, ry, nuance: 0.02 });
    }
  };
  /** Une touffe de paille qui pend d'une corde sacrée (shime-no-ko), attachée en x, y, z. */
  const touffePaille = (a, x, y, z, h = 0.3) => a.cone(0.05, h, 6, '#d8b866', { x, y: y - h / 2, z, trait: false });
  // les troncs de la forêt (la lisière ne plante pas contre eux)
  const TRONCS = [];
  // les arbres qui assombrissent le sol à leur pied (aspectSol)
  const noterArbre = (x, z, r) => {
    const k = `${Math.floor(x / 8)},${Math.floor(z / 8)}`;
    if (!ARBRES_SOL.has(k)) ARBRES_SOL.set(k, []);
    ARBRES_SOL.get(k).push([x, z, Math.min(4, r)]);
  };
  ARBRES_SOL.clear();

  // ---------------------------------------------------------------- Les parois de basalte
  /**
   * La paroi de colonnes de basalte d'un côté de la gorge (cote : −1 l'ouest, 1 l'est), de z0 à z1 : des prismes à cinq,
   * six ou sept pans, serrés et debout, une face tournée vers l'eau, du fond du lit jusqu'au-dessus du bord (leurs dessus
   * en marches irrégulières, couverts de mousse) ; ceux du devant cassés en deux ou trois tambours un peu décalés (de petits
   * rebords) ; derrière, deux rangs plus courts dont on ne voit que le dessus (le bord de la falaise). Le pied des colonnes
   * du devant ne dépasse jamais le pied de la paroi (le terrain remonte juste derrière). Le bas est mouillé, sombre et
   * vert d'algues ; des traînées sombres d'eau ; la mousse sur le haut. Par morceaux de 24 m (la caméra ne dessine que
   * ceux qu'elle voit). abaisser(x, z) : la hauteur où couper le dessus (la cascade, le palier de l'escalier), ou null.
   */
  const MORCEAUX_PAROI = new Map();
  const morceauParoi = (cote, z) => {
    const k = `${cote},${Math.floor(z / 24)}`;
    if (!MORCEAUX_PAROI.has(k)) MORCEAUX_PAROI.set(k, { pos: [], couleurs: [] });
    return MORCEAUX_PAROI.get(k);
  };
  const BASALTES = [P.basalte, P.basalteFonce, P.basalteClair, P.basalte, P.paroi];
  function colonne(m, cx, cz, r, k, phi, y0, y1, base, dessus = true) {
    const { pos, couleurs } = m;
    const pts = Array.from({ length: k }, (_, i) => { const a = phi + (i / k) * 2 * PI; return [cx + Math.cos(a) * r, cz + Math.sin(a) * r]; });
    for (let i = 0; i < k; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[(i + 1) % k], am = phi + ((i + 0.5) / k) * 2 * PI, n = [Math.cos(am), 0, Math.sin(am)];
      // (la face, en deux ou trois bandes : le bas mouillé, sombre ; le milieu ; le haut, la mousse par endroits. Des bornes
      // qui montent : sur un tambour court, la bande du haut commençait sous le haut de la bande mouillée, et les deux se
      // recouvraient sur la même face : elles scintillaient au bord de l'eau)
      const mouille = Math.max(y0, Math.min(y1, NIV + 0.75)), bandes = [y0, mouille, Math.max(mouille, y1 - 1.1), y1];
      for (let b = 0; b < 3; b++) {
        const ya = bandes[b], yb = bandes[b + 1];
        if (yb - ya < 0.02) continue;
        const A = [ax, ya, az], B = [bx, ya, bz], Cc = [bx, yb, bz], D = [ax, yb, az];
        triangle(pos, A, B, Cc, n);
        triangle(pos, A, Cc, D, n);
        let c = base;
        if (b === 0) c = hasard(cx * 3.1, cz * 1.7 + b) < 0.4 ? P.mousseRocheFonce : P.basalteMouille;
        else if (b === 2 && bruitDoux(cx * 1.3 + i, cz * 1.3, 2.2) > 0.58) c = P.mousseRoche;
        else if (b === 1 && hasard(cx * 7.7, cz * 5.3) < 0.08) c = P.basalteMouille;
        couleurs.push(c, c);
      }
    }
    if (dessus) {
      const C0 = [cx, y1 + r * 0.06, cz];
      const c = hasard(cx * 2.3, cz * 4.1) < 0.7 ? P.mousseRoche : P.basalteClair;
      for (let i = 0; i < k; i++) {
        const [ax, az] = pts[i], [bx, bz] = pts[(i + 1) % k];
        triangle(pos, C0, [ax, y1, az], [bx, y1, bz], [0, 1, 0]);
        couleurs.push(c);
      }
    }
  }
  function paroi(cote, z0, z1, abaisser = () => null) {
    // le pied de la paroi : un point tous les demi-mètres de l'axe, décalé de w du côté voulu
    const face = AXE.filter((p) => p[1] <= z0 && p[1] >= z1).map((p) => [p[0] + cote * p[3] * p[2], p[1] + cote * p[4] * p[2], cote * p[3], cote * p[4]]);
    paroiLigne(face, cote, { abaisser });
  }
  /**
   * Les colonnes le long d'une ligne de pied face : [[x, z, ox, oz], …] (o : la direction hors de l'eau, dans la roche) ;
   * bas : le pied des colonnes du devant (sous le lit) ; sauter(x, z) : pas de colonne ici (une grotte).
   */
  function paroiLigne(face, cote, { abaisser = () => null, sauter = () => false, bas = FOND - 0.8 } = {}) {
    let s = 0, prochain = 0, n = 0;
    for (let i = 1; i < face.length; i++) {
      const [ax, az] = face[i - 1], [bx, bz, ox, oz] = face[i], l = Math.hypot(bx - ax, bz - az);
      s += l;
      while (prochain <= s) {
        const f = 1 - (s - prochain) / l, fx = ax + (bx - ax) * f, fz = az + (bz - az) * f;
        if (sauter(fx, fz)) { prochain += 0.7; continue; }
        const k = [5, 6, 6, 6, 7][Math.floor(hasard(fx * 1.31, fz * 0.77) * 5)];
        const r = 0.4 + 0.16 * hasard(fz * 2.1, fx * 3.3), recul = 0.03 + 0.12 * hasard(fx * 4.9, fz * 2.7);
        const cx = fx + ox * (r * Math.cos(PI / k) + recul), cz = fz + oz * (r * Math.cos(PI / k) + recul);
        // une face vers l'eau (vers −o), un peu tournée au hasard
        const phi = Math.atan2(-oz, -ox) - PI / k + (hasard(cz * 1.9, cx * 2.9) - 0.5) * 0.5;
        // le dessus : à la hauteur du sol juste derrière (le bord), en marches irrégulières
        const bord = terrain(fx + ox * 2.6, fz + oz * 2.6);
        let haut = bord + 0.12 + 0.48 * hasard(fx * 5.3, fz * 6.1) - 0.2;
        const cap = abaisser(fx, fz);
        if (cap !== null) haut = Math.min(haut, cap);
        const m = morceauParoi(cote, cote === 2 ? fx : fz), base = BASALTES[Math.floor(hasard(fz * 0.37 + n, fx) * BASALTES.length)];
        // les tambours : deux ou trois, un peu décalés et tournés (les colonnes se cassent en travers)
        const coupes = [bas];
        for (let y = bas + 3.3 + 3 * hasard(fx, fz * 1.3); y < haut - 1.2; y += 2.6 + 3.4 * hasard(y, fx + fz)) coupes.push(y);
        coupes.push(haut);
        for (let t = 0; t < coupes.length - 1; t++) {
          const dr = t ? (hasard(t * 1.7 + fx, fz) - 0.5) * 0.06 : 0;
          colonne(m, cx + ox * Math.abs(dr), cz + oz * Math.abs(dr), r - Math.abs(dr) * 0.5, k, phi + dr * 2, coupes[t], coupes[t + 1], base, true);
        }
        // derrière : deux rangs plus courts (le bord de la falaise), décalés d'une demi-colonne ; un seul aux virages des deux
        // bouts de la gorge (on ne les voit que de loin)
        for (const rang of fz > 96 || fz < -152 ? [1] : [1, 2]) {
          const rr = 0.38 + 0.18 * hasard(fz * 3.7 + rang, fx);
          const bx2 = cx + ox * (0.82 * rang + 0.1 * hasard(fx + rang, fz)) + oz * 0.35 * (rang % 2 ? 1 : -1);
          const bz2 = cz + oz * (0.82 * rang + 0.1 * hasard(fz + rang, fx)) - ox * 0.35 * (rang % 2 ? 1 : -1);
          let h2 = bord + 0.1 + 0.45 * hasard(bx2 * 3.3, bz2 * 2.9) - 0.2;
          const cap2 = abaisser(bx2, bz2);
          if (cap2 !== null) h2 = Math.min(h2, cap2);
          colonne(m, bx2, bz2, rr, k, phi + rang, h2 - 2.2, h2, base, true);
        }
        n++;
        prochain += 0.66 + 0.16 * hasard(prochain * 1.3, cote);
      }
    }
  }
  // l'eau de la cascade passe par une encoche dans le bord ; le palier de l'escalier est posé sur les colonnes ; la
  // rivière Iwato tombe dans la gorge par une autre encoche ; sous les deux ponts, les colonnes s'arrêtent sous le tablier
  // (leurs dessus le traversaient, entre les parapets)
  const sousPont = (x, z) => { const t = sousTablier(x, z, 0.75); return t === null ? null : t - 0.12; };
  paroi(-1, 122, -164, (x, z) => {
    if (Math.abs(z - CASCADE.z) < 1.55) return -0.95;
    if (z > ESCALIER.z0 - 2.4 && z < ESCALIER.z0 + 0.2) return -0.18;
    if (Math.abs(z + 121) < 2.4) return NIV_I - 0.7;
    return sousPont(x, z);
  });
  paroi(1, 122, -164, sousPont);
  // la falaise au nord de la rivière Iwato (sans colonnes là où s'ouvrent les deux grottes), jusqu'au bord de la gorge
  {
    const face = [];
    for (let x = -150; x <= -8.5; x += 0.5) {
      const v = surIwato(x, -125), k = IWATO.findIndex(([px]) => px > x), [ax, az] = IWATO[Math.max(0, k - 1)], [bx, bz] = IWATO[Math.max(1, k)], l = Math.hypot(bx - ax, bz - az);
      const nx = (bz - az) / l, nz = -(bx - ax) / l, pied = PIED_NORD(x);
      face.push([v.cx + nx * pied, v.cz + nz * pied, nx, nz]);
    }
    paroiLigne(face, 2, {
      bas: NIV_I - 1.3,
      sauter: (x) => Math.abs(x - YASU.x) < YASU.rx + 0.2 || Math.abs(x - GROTTE.x) < 3.05,
    });
  }
  for (const [k, m] of MORCEAUX_PAROI) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(m.pos, 3));
    const a = atelier().piece(g, P.basalte, { couleurs: m.couleurs, nuance: 0.07 });
    // (loin du parcours, au sud et au nord, pas de trait d'encre : un pixel à cette distance)
    const zk = Number(k.split(',')[1]) * 24;
    poser(a.fin(0, peinture), 0, 0, { y: 0, trait: zk > -150 && zk < 84 });
  }

  // ---------------------------------------------------------------- Le lit de la rivière : des rochers
  {
    const a = atelier();
    // (les rochers près des parois, et ceux du pied de la cascade ; les barques les contournent : barque.rochers)
    // (des blocs de basalte arrondis par l'eau : le dessus moussu, mouillés au ras de l'eau ; leur pied plonge jusqu'au lit,
    // qu'on devine sous l'eau ; le petit du pied de la cascade, contre la paroi : la barque passe dessous)
    const bloc = (x, y, z, r, sy) => a.piece(new THREE.IcosahedronGeometry(r, 1), P.basalte, {
      x, y, z, sy, ry: hasard(x, z) * 6, nuance: 0.08,
      deformer: (px, py, pz) => { const k = 0.8 + 0.32 * hasard(px * 7 + x + py * 3.3, pz * 7 + z - py * 2.1); return [px * k, py * k, pz * k]; },
      teinte: (px, py, pz) => (py > y + r * sy * 0.42 ? (hasard(px * 3.1, pz * 2.7) < 0.55 ? P.mousseRoche : P.mousseRocheFonce) : py > NIV + 0.1 ? P.basalte : P.basalteMouille),
    });
    for (const [x, z, r] of [[-8.0, 6.6, 0.95], [-7.6, 13.7, 1.15], [-8.5, 8.5, 0.5], [7.4, 18, 0.8], [8.1, 30, 0.6], [-6.6, -8, 0.7], [5.6, -12, 0.9], [-4.0, -25, 0.6], [3.4, -31, 0.7], [-2.2, -39.5, 0.9], [1.6, -40.5, 0.8]]) {
      bloc(x, NIV - 0.2, z, r, 0.62);
      bloc(x + 0.1, NIV - 1.4, z - 0.1, r * 1.3, 0.85);
      ROCHERS.push([x, z, r + 0.25]);
    }
    // au nord du « saut de la lance », des rapides : des blocs serrés dans l'eau blanche
    for (let k = 0; k < 14; k++) {
      const z = -44 - k * 0.9, g = surGorge(0, z), x = g.cx + (hasard(k, 3.3) - 0.5) * 2 * (g.w - 0.6);
      a.rocher(x, NIV - 0.25, z, 0.35 + 0.35 * hasard(k, 1.7), P.basalteFonce, { sy: 0.6 });
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- L'escalier des barques et le ponton
  {
    const a = atelier(), yBas = PONTON.y, n = ESCALIER.n, L = ESCALIER.z1 - ESCALIER.z0, giron = L / n, monte = (0 - yBas) / n;
    const ligne = [], rampe = [];
    for (let i = 0; i < n; i++) {
      const z = ESCALIER.z0 + (i + 0.5) * giron, [px] = piedParoi(-1, z), yT = -monte * (i + 1) + monte * 0.0;
      const yHaut = -monte * i;
      // la marche : une dalle de pierre (son dessus au niveau du chemin en son milieu) ; une sur deux un rien plus large et
      // décalée de 6 mm vers la paroi (leurs faces de côté, des deux côtés, ne se superposent pas)
      const w = ESCALIER.l + (i % 2 ? 0.012 : 0), xm = px + 0.02 - (i % 2 ? 0.006 : 0);
      a.boite(w, 0.34, giron + 0.03, i % 3 ? P.pierre : P.pierreFonce, { x: xm + w / 2, y: yHaut - monte * 0.5 - 0.17 + monte * 0.5, z });
      ligne.push([px + 0.95, z, yHaut - monte * 0.5]);
      rampe.push([px + ESCALIER.l + 0.06, z, yHaut]);
      void yT;
    }
    // le chemin (au milieu de chaque marche : monde.chemin), le palier du haut (sur les colonnes), le ponton
    monde.chemin([[piedParoi(-1, ESCALIER.z0 - 2.3)[0] + 0.95, ESCALIER.z0 - 2.3, 0.07], [ligne[0][0], ESCALIER.z0, 0.07], ...ligne, [ligne[n - 1][0], ESCALIER.z1 + 0.2, yBas]], 0.82, { sol: 'pierre' });
    // le mur extérieur de l'escalier : de la pierre du fond du lit jusqu'au-dessus des marches, en pente, et sa main courante
    {
      const pos = [], couleurs = [];
      for (let i = 0; i < n; i++) {
        const z0 = ESCALIER.z0 + i * giron, z1 = z0 + giron, [p0] = piedParoi(-1, z0), [p1] = piedParoi(-1, z1);
        const x0 = p0 + ESCALIER.l + 0.04, x1 = p1 + ESCALIER.l + 0.04, h0 = -monte * i + 0.12, h1 = -monte * (i + 1) + 0.12;
        const c = TONS_PIERRE[Math.floor(hasard(i * 1.7, 3.1) * 4)];
        triangle(pos, [x0, FOND - 0.5, z0], [x1, FOND - 0.5, z1], [x1, h1, z1], [1, 0, 0]);
        triangle(pos, [x0, FOND - 0.5, z0], [x1, h1, z1], [x0, h0, z0], [1, 0, 0]);
        couleurs.push(c, c);
        // le chaperon : une bande de dessus, 18 cm
        triangle(pos, [x0 - 0.18, h0, z0], [x0, h0, z0], [x1, h1, z1], [0, 1, 0]);
        triangle(pos, [x0 - 0.18, h0, z0], [x1, h1, z1], [x1 - 0.18, h1, z1], [0, 1, 0]);
        couleurs.push(P.pierreFonce, P.pierreFonce);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      a.piece(g, P.pierre, { couleurs, nuance: 0.05 });
    }
    // la main courante : des poteaux de bois tous les 1,5 m, une barre ; la nuit, de petites lampes
    for (let i = 0; i < rampe.length; i += 5) {
      const [x, z, y] = rampe[i];
      a.boite(0.08, 0.95, 0.08, P.boisFonce, { x: x - 0.09, y: y + 0.12 + 0.47, z });
    }
    for (let i = 0; i + 5 < rampe.length; i += 5) {
      const [x0, z0, y0] = rampe[i], [x1, z1, y1] = rampe[i + 5];
      a.fut([x0 - 0.09, y0 + 1.02, z0], [x1 - 0.09, y1 + 1.02, z1], 0.035, 0.035, P.bois, 6);
      monde.mur(x0 - 0.09, z0, x1 - 0.09, z1, 0.14);
    }
    // le palier du haut : une grande dalle posée sur les colonnes, entre la place et la première marche
    {
      const [p0] = piedParoi(-1, ESCALIER.z0 - 2.3), [p1] = piedParoi(-1, ESCALIER.z0);
      // (son dessus 7 cm au-dessus de la place : à 2 cm, sous le sol dessiné, 3 cm plus haut que le terrain, il scintillait)
      a.boite(4.6, 0.35, 2.5, P.pierre, { x: (p0 + p1) / 2 - 0.6, y: -0.105, z: ESCALIER.z0 - 1.15 });
      monde.surface((p0 + p1) / 2 - 2.9, Math.max(p0, p1) + ESCALIER.l - 0.1, ESCALIER.z0 - 2.4, ESCALIER.z0 + 0.05, 0.07, { sol: 'pierre' });
      monde.mur(p1 + ESCALIER.l + 0.02, ESCALIER.z0 - 2.4, p1 + ESCALIER.l + 0.02, ESCALIER.z0 + 0.1, 0.12);
      monde.mur(p0 - 0.4, ESCALIER.z0 - 2.4, p0 + ESCALIER.l + 0.02, ESCALIER.z0 - 2.4, 0.12);
    }
    // le ponton : un plancher de bois sur des pieux, la cabane du loueur de barques, des bouées, une corde
    {
      const [p0] = piedParoi(-1, PONTON.z0), [p1] = piedParoi(-1, PONTON.z1), px = Math.max(p0, p1);
      const x0 = Math.min(p0, p1) - 0.2, x1 = px + PONTON.l, zc = (PONTON.z0 + PONTON.z1) / 2;
      a.boite(x1 - x0, 0.14, PONTON.z1 - PONTON.z0, P.bois, { x: (x0 + x1) / 2, y: PONTON.y - 0.07, z: zc });
      for (let z = PONTON.z0 + 0.6; z < PONTON.z1; z += 2.2) a.cylindre(0.1, 0.1, 2.3, 7, P.boisFonce, { x: x1 - 0.12, y: PONTON.y - 1.1, z });
      // les planches : des lignes plus sombres
      for (let z = PONTON.z0 + 0.3; z < PONTON.z1 - 0.1; z += 0.3) a.boite(x1 - x0 - 0.04, 0.012, 0.025, P.boisFonce, { x: (x0 + x1) / 2, y: PONTON.y + 0.005, z, trait: false });
      monde.surface(x0, x1, PONTON.z0, PONTON.z1, PONTON.y, { sol: 'bois' });
      // le bord du ponton : une corde entre de petits poteaux, sauf là où l'on monte dans la barque
      for (const [za, zb] of [[PONTON.z0 + 4.4, PONTON.z1 - 0.2]]) {
        for (let z = za; z <= zb + 0.01; z += 1.6) a.boite(0.07, 0.75, 0.07, P.boisFonce, { x: x1 - 0.06, y: PONTON.y + 0.37, z });
        a.baton([x1 - 0.06, PONTON.y + 0.68, za], [x1 - 0.06, PONTON.y + 0.68, zb], 0.018, '#d8c08a', 4);
        monde.mur(x1 - 0.05, za, x1 - 0.05, zb, 0.12);
      }
      monde.mur(x1 - 0.05, PONTON.z0, x1 - 0.05, PONTON.z0 + 0.4, 0.12);
      monde.mur(x0, PONTON.z1 - 0.05, x1, PONTON.z1 - 0.05, 0.12);
      // la cabane du loueur, contre la paroi, au bout sud du ponton (refaite le 2026-10-25) : des planches sur un cadre de
      // poteaux, le guichet ouvert vers le ponton (son comptoir, sa vitre coulissante à moitié ouverte, le dedans sombre),
      // l'enseigne 貸しボート, le tableau des prix, les gilets orange pendus sur le côté, deux rames appuyées, le toit
      const cx = x0 + 1.0, cz = PONTON.z1 - 1.1, yp = PONTON.y, Rk = repere(cx, cz, PI / 2);
      a.boite(1.84, 0.12, 2.04, P.boisFonce, Rk(0, yp + 0.06, 0));
      a.boite(1.8, 2.1, 0.08, P.bois, Rk(0, yp + 1.12, -0.96)).boite(0.08, 2.1, 1.84, P.bois, Rk(-0.86, yp + 1.12, 0)).boite(0.08, 2.1, 1.84, P.bois, Rk(0.86, yp + 1.12, 0));
      a.boite(1.8, 0.9, 0.08, P.bois, Rk(0, yp + 0.57, 0.96)).boite(1.8, 0.42, 0.08, P.bois, Rk(0, yp + 1.96, 0.96));
      for (const [lx, lz] of [[-0.88, 0.98], [0.88, 0.98], [-0.88, -0.98], [0.88, -0.98]]) a.boite(0.1, 2.25, 0.1, P.boisFonce, Rk(lx, yp + 1.12, lz));
      a.boite(1.72, 0.66, 0.04, '#2e2a26', Rk(0, yp + 1.37, 0.88, { trait: false }))
        .boite(0.84, 0.62, 0.02, '#cfe6ee', Rk(-0.4, yp + 1.37, 0.95, { trait: false })).boite(0.88, 0.04, 0.04, P.boisFonce, Rk(-0.4, yp + 1.7, 0.96))
        .boite(1.9, 0.05, 0.42, P.bois2, Rk(0, yp + 1.04, 1.12));
      a.toitJapon(2.5, 2.7, 0.55, 0.12, { ...Rk(0, yp + 2.18, 0), releve: 0.06 });
      ecrire(Rk(0, yp, 1.0), { texte: '貸しボート', sous: 'BOAT', fond: '#2f6fb0', encre: '#ffffff', x: 0, y: 1.96, z: 0.01, l: 1.3, h: 0.38 });
      ecrire(Rk(0.9, yp, 0.45, { ry: PI / 2 }), { texte: '30分 2000円', sous: '30 min', fond: '#f4ecd8', encre: '#2a2420', x: 0, y: 1.35, z: 0.01, l: 0.62, h: 0.34, cadre: true });
      for (let k = 0; k < 3; k++) a.boite(0.36, 0.48, 0.1, '#e8742e', Rk(-0.95, yp + 1.35 - (k % 2) * 0.05, -0.5 + k * 0.42, { trait: false })).boite(0.3, 0.06, 0.11, '#3a3a40', Rk(-0.95, yp + 1.33, -0.5 + k * 0.42, { trait: false }));
      for (const dz of [-0.62, -0.45]) { const A = Rk(0.96, 0, dz), B2 = Rk(1.06, 0, dz + 0.1); a.baton([A.x, yp + 0.05, A.z], [B2.x, yp + 2.0, B2.z], 0.025, P.bois, 5).boite(0.12, 0.4, 0.03, P.bois2, { x: A.x, y: yp + 0.25, z: A.z, ry: PI / 2 }); }
      monde.cercle(cx, cz, 1.25);
      lumieres.push({ x: cx + 1.05, y: PONTON.y + 1.9, z: cz, halo: 0.35, sol: PONTON.y, r: 3.0, c: '#fff1d0' });
      // les bouées, accrochées à la cabane
      for (const dz of [-0.55, 0.55]) a.piece(new THREE.TorusGeometry(0.2, 0.06, 6, 14), dz < 0 ? '#e8452e' : '#f4efe6', { x: cx + 0.9, y: PONTON.y + 1.2, z: cz + dz, ry: PI / 2, teinte: (x, y, z) => (Math.floor(Math.atan2(y - PONTON.y - 1.2, z - cz - dz) * 2 / PI + 4) % 2 ? '#e8452e' : '#f4efe6') });
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Les barques amarrées (un décor ; celle du joueur, et
  // celles des promeneurs qui rament, sont à part)
  const barque = (a, R, num = 0) => {
    // une barque de location : la coque blanche, une bande turquoise, le plat-bord de bois, deux bancs ; les rames rangées
    const pos = [], couleurs = [];
    const demi = (u) => 0.62 * Math.sqrt(Math.max(0, 1 - ((u - 0.15) / 1.15) ** 2)) * (u > 0.85 ? 1 - (u - 0.85) / 0.3 * 0.6 : 1);
    const nS = 16;
    const sec = (i) => { const u = -1 + (2 * i) / nS, w = Math.max(0.04, demi(u)), fond = -0.16 + 0.1 * Math.max(0, u - 0.5) ** 2; return { u, w, fond, haut: 0.34 + 0.08 * Math.max(0, u) ** 2 }; };
    for (let i = 0; i < nS; i++) {
      const A = sec(i), B = sec(i + 1), za = A.u * 1.5, zb = B.u * 1.5;
      for (const s of [-1, 1]) {
        // le flanc, en deux bandes : le bas blanc, la bande turquoise en haut
        const q = (w, y, z) => [s * w, y, z];
        const yA1 = A.haut - 0.12, yB1 = B.haut - 0.12;
        triangle(pos, q(A.w * 0.7, A.fond, za), q(B.w * 0.7, B.fond, zb), q(B.w, yB1, zb), [s, -0.2, 0]);
        triangle(pos, q(A.w * 0.7, A.fond, za), q(B.w, yB1, zb), q(A.w, yA1, za), [s, -0.2, 0]);
        couleurs.push('#f6f4ee', '#f6f4ee');
        triangle(pos, q(A.w, yA1, za), q(B.w, yB1, zb), q(B.w, B.haut, zb), [s, 0, 0]);
        triangle(pos, q(A.w, yA1, za), q(B.w, B.haut, zb), q(A.w, A.haut, za), [s, 0, 0]);
        couleurs.push('#3aa6a0', '#3aa6a0');
        // l'intérieur (vu d'en haut), plus clair
        triangle(pos, q(A.w * 0.66, A.fond + 0.03, za), q(A.w - 0.03, A.haut, za), q(B.w - 0.03, B.haut, zb), [-s, 0.5, 0]);
        triangle(pos, q(A.w * 0.66, A.fond + 0.03, za), q(B.w - 0.03, B.haut, zb), q(B.w * 0.66, B.fond + 0.03, zb), [-s, 0.5, 0]);
        couleurs.push('#e8e6dc', '#e8e6dc');
      }
      // le fond
      triangle(pos, [-A.w * 0.7, A.fond, za], [A.w * 0.7, A.fond, za], [B.w * 0.7, B.fond, zb], [0, -1, 0]);
      triangle(pos, [-A.w * 0.7, A.fond, za], [B.w * 0.7, B.fond, zb], [-B.w * 0.7, B.fond, zb], [0, -1, 0]);
      couleurs.push('#d8d6cc', '#d8d6cc');
      triangle(pos, [-A.w * 0.66, A.fond + 0.03, za], [B.w * 0.66, B.fond + 0.03, zb], [A.w * 0.66, A.fond + 0.03, za], [0, 1, 0]);
      triangle(pos, [-A.w * 0.66, A.fond + 0.03, za], [-B.w * 0.66, B.fond + 0.03, zb], [B.w * 0.66, B.fond + 0.03, zb], [0, 1, 0]);
      couleurs.push('#e0ded4', '#e0ded4');
    }
    // le tableau arrière
    const S = sec(0);
    triangle(pos, [-S.w, S.haut, -1.5], [S.w, S.haut, -1.5], [S.w * 0.7, S.fond, -1.5], [0, 0, -1]);
    triangle(pos, [-S.w, S.haut, -1.5], [S.w * 0.7, S.fond, -1.5], [-S.w * 0.7, S.fond, -1.5], [0, 0, -1]);
    couleurs.push('#f6f4ee', '#f6f4ee');
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    a.piece(g, '#f6f4ee', { ...R(0, 0, 0), couleurs, nuance: 0.03 });
    // les bancs, le plat-bord, les tolets
    for (const z of [-0.95, 0.05, 0.85]) a.boite(1.1 * (z > 0.5 ? 0.75 : 1), 0.04, 0.24, P.bois, R(0, 0.2, z));
    for (const s of [-1, 1]) a.boite(0.035, 0.03, 0.35, '#5a5a62', R(s * 0.58, 0.38, 0.05));
    if (num) void num;
    return a;
  };
  {
    const a = atelier();
    const [p] = piedParoi(-1, 50), xB = p + PONTON.l + 0.95;
    for (const z of [50.2, 53.5, 56.6]) {
      const R = repere(xB, z, PI + (hasard(z, 1) - 0.5) * 0.12), y = NIV - 0.02;
      barque(a, (lx, ly, lz, o = {}) => ({ ...R(lx, y + ly, lz, o) }));
      // les deux rames, rangées dans la barque
      for (const s of [-1, 1]) a.baton([0, 0, 0].map((v, i) => [R(s * 0.22, 0, -0.9).x, y + 0.24, R(s * 0.22, 0, -0.9).z][i]), [R(s * 0.18, 0, 1.1).x, y + 0.26, R(s * 0.18, 0, 1.1).z], 0.03, P.bois, 5);
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Les deux ponts de pierre
  /**
   * Un pont de pierre en arc à travers la gorge, en z, d'une rive à l'autre : le tablier (un peu en pente, de la place à la
   * promenade), ses parapets, et dessous la voûte de pierre qui s'appuie sur les parois, les tympans pleins. haut : la
   * flèche de la voûte sous le tablier.
   */
  function pontPierre(Pt, { haut = 6.5 } = {}) {
    const a = atelier(), { g, x0, x1, y0, y1, yA } = tablier(Pt), l = Pt.l;
    // le tablier : une dalle épaisse en pente, couverte de dalles ; les parapets
    const n = 12, pos = [], couleurs = [];
    for (let i = 0; i < n; i++) {
      const xa = x0 + ((x1 - x0) * i) / n, xb = x0 + ((x1 - x0) * (i + 1)) / n, ya = yA(xa), yb = yA(xb);
      const c = i % 2 ? '#c9c2b2' : '#bfb8a8';
      triangle(pos, [xa, ya, Pt.z - l / 2], [xb, yb, Pt.z - l / 2], [xb, yb, Pt.z + l / 2], [0, 1, 0]);
      triangle(pos, [xa, ya, Pt.z - l / 2], [xb, yb, Pt.z + l / 2], [xa, ya, Pt.z + l / 2], [0, 1, 0]);
      couleurs.push(c, c);
    }
    // (les deux bouts du tablier : une face de pierre qui descend de 40 cm, le sol passe dessous)
    for (const [xb, sens] of [[x0, -1], [x1, 1]]) {
      const yb = yA(xb);
      triangle(pos, [xb, yb, Pt.z - l / 2], [xb, yb - 0.4, Pt.z - l / 2], [xb, yb - 0.4, Pt.z + l / 2], [sens, 0, 0]);
      triangle(pos, [xb, yb, Pt.z - l / 2], [xb, yb - 0.4, Pt.z + l / 2], [xb, yb, Pt.z + l / 2], [sens, 0, 0]);
      couleurs.push('#a9a291', '#a9a291');
    }
    // la voûte : un berceau de pierre, de paroi à paroi, et les tympans (les côtés pleins entre la voûte et le tablier)
    const xa = g.cx - g.w - 0.2, xb = g.cx + g.w + 0.2, portee = xb - xa, nv = 18;
    const arc = (u) => [xa + portee * u, yA(xa + portee * u) - 0.55 - haut * (1 - (2 * u - 1) ** 2) ** 0.5 * 0 - (haut) * (1 - Math.sin(PI * u) ** 0.8)];
    for (let i = 0; i < nv; i++) {
      const [ax, ay] = arc(i / nv), [bx, by] = arc((i + 1) / nv), c = TONS_PIERRE[i % 4];
      // le dessous de la voûte
      triangle(pos, [ax, ay, Pt.z - l / 2], [bx, by, Pt.z - l / 2], [bx, by, Pt.z + l / 2], [0, -1, 0]);
      triangle(pos, [ax, ay, Pt.z - l / 2], [bx, by, Pt.z + l / 2], [ax, ay, Pt.z + l / 2], [0, -1, 0]);
      couleurs.push(c, c);
      // les deux tympans
      for (const s of [-1, 1]) {
        const zz = Pt.z + (s * l) / 2;
        triangle(pos, [ax, ay, zz], [bx, by, zz], [bx, yA(bx), zz], [0, 0, s]);
        triangle(pos, [ax, ay, zz], [bx, yA(bx), zz], [ax, yA(ax), zz], [0, 0, s]);
        couleurs.push(TONS_PIERRE[(i + 2) % 4], TONS_PIERRE[(i + 2) % 4]);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    a.piece(geo, P.pierre, { couleurs, nuance: 0.05 });
    // les claveaux de la voûte, sur ses deux faces : une couronne de pierres un peu en saillie
    for (let i = 0; i <= nv; i++) {
      const [ax, ay] = arc(i / nv), t = Math.atan2(arc(Math.min(1, (i + 1) / nv))[1] - arc(Math.max(0, (i - 1) / nv))[1], portee / nv * 2);
      for (const s of [-1, 1]) a.boite(0.42, 0.62, 0.12, i % 2 ? P.pierreFonce : P.pierre, { x: ax, y: ay + 0.24, z: Pt.z + s * (l / 2 + 0.05), rz: t });
    }
    // les parapets : des murets de pierre, leur chaperon
    for (const s of [-1, 1]) {
      // (12 mm en retrait du plan des tympans : le muret descend sous le tablier, il les recouvrait dans le même plan)
      const zz = Pt.z + s * (l / 2 - 0.162);
      const L = Math.hypot(x1 - x0, y1 - y0), t = Math.atan2(y1 - y0, x1 - x0);
      // (le muret descend 35 cm sous le tablier : à côté, le sol plonge sous le tablier)
      a.boite(L, 1.03, 0.3, P.pierre, { x: (x0 + x1) / 2, y: (y0 + y1) / 2 + 0.165, z: zz, rz: t })
        .boite(L + 0.06, 0.08, 0.38, P.pierreFonce, { x: (x0 + x1) / 2, y: (y0 + y1) / 2 + 0.72, z: zz + s * 0.004, rz: t });
      for (const xb2 of [x0, x1]) a.boite(0.42, 1.3, 0.42, P.pierreFonce, { x: xb2, y: yA(xb2) + 0.3, z: zz });
      monde.mur(x0, zz, x1, zz, 0.2);
    }
    monde.rampe(x0, x1, Pt.z - l / 2 + 0.25, Pt.z + l / 2 - 0.25, 'x', y0 + 0.0, y1 + 0.0, { sol: 'pierre' });
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
    return { x0, x1, yA };
  }
  const pontS = pontPierre(PONT_S, { haut: 7 });
  const pontN = pontPierre(PONT_N, { haut: 5.5 });
  void pontS; void pontN;

  // ---------------------------------------------------------------- Le garde-corps des rives
  /** Le garde-corps de bois le long d'une rive (cote) de z0 à z1, sauf aux ouvertures [z0, z1] (les ponts, l'escalier). */
  function gardeCorps(cote, z0, z1, ouvertures = []) {
    const a = atelier(), pts = [];
    for (const p of AXE) {
      if (p[1] > z0 || p[1] < z1) continue;
      pts.push([p[0] + cote * p[3] * (p[2] + RAMBARDE), p[1] + cote * p[4] * (p[2] + RAMBARDE)]);
    }
    const ouvert = (z) => ouvertures.some(([u, v]) => z < u && z > v);
    let prec = null, l = 0;
    for (let i = 0; i < pts.length; i++) {
      const [x, z] = pts[i];
      if (ouvert(z)) { prec = null; continue; }
      if (prec) l += Math.hypot(x - prec[0], z - prec[1]);
      // (un poteau tous les deux mètres environ, au bout, et juste avant une ouverture : la barrière s'y arrête net)
      if (!prec || l >= 2.0 || i === pts.length - 1 || (i + 1 < pts.length && ouvert(pts[i + 1][1]))) {
        const y = terrain(x, z);
        a.boite(0.11, 1.0, 0.11, P.boisFonce, { x, y: y + 0.42, z });
        if (prec) {
          const yp = terrain(prec[0], prec[1]);
          for (const h of [0.55, 0.9]) a.fut([prec[0], yp + h, prec[1]], [x, y + h, z], 0.035, 0.035, P.bois, 5);
          monde.mur(prec[0], prec[1], x, z, 0.16);
        }
        prec = [x, z];
        l = 0;
      }
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }
  gardeCorps(-1, 73.5, -66.6, [[PONT_S.z + PONT_S.l / 2 + 0.1, PONT_S.z - PONT_S.l / 2 - 0.1], [ESCALIER.z0 + 0.05, ESCALIER.z0 - 2.45], [PONT_N.z + PONT_N.l / 2 + 0.1, PONT_N.z - PONT_N.l / 2 - 0.1], [CANAL_GARDE + 0.95, CANAL_GARDE - 0.95]]);
  gardeCorps(1, 73.5, -64.5, [[PONT_S.z + PONT_S.l / 2 + 0.1, PONT_S.z - PONT_S.l / 2 - 0.1], [PONT_N.z + PONT_N.l / 2 + 0.1, PONT_N.z - PONT_N.l / 2 - 0.1]]);


  // ---------------------------------------------------------------- La cascade de Manai, l'eau de l'étang, le canal
  const cascades = [];
  {
    const [lx, lz, ox, oz] = piedParoi(-1, CASCADE.z);
    // (sortie : vers l'est, hors de la paroi ouest)
    cascades.push({ x: lx - ox * 0.15, z: lz - oz * 0.15, y0: CASCADE.haut, y1: NIV, large: CASCADE.large, sortie: [-ox, -oz], avance: CASCADE.avance, arcEnCiel: 3.2 });
    // la brume du pied de la chute, et les embruns
    const bx = lx - ox * (CASCADE.avance + 0.4), bz = lz - oz * (CASCADE.avance + 0.4);
    vapeurs.push({ x: bx, z: bz, y: NIV + 0.1, n: 26, haut: 5.5, large: 2.6, taille: 2.8 }, { x: bx - ox * 1.6, z: bz - oz * 1.6, y: NIV + 0.1, n: 14, haut: 3.5, large: 3.4, taille: 2.2 });
    CASCADE_PIED.x = bx; CASCADE_PIED.z = bz;
  }
  // la rivière Iwato tombe dans la gorge, au nord (on la voit du pont de Shinkyō)
  {
    const [lx, lz, ox, oz] = piedParoi(-1, -121);
    cascades.push({ x: lx - ox * 0.1, z: lz - oz * 0.1, y0: NIV_I - 0.35, y1: NIV, large: 2.2, sortie: [-ox, -oz], avance: 1.2, arcEnCiel: 0 });
    vapeurs.push({ x: lx - ox * 1.6, z: lz - oz * 1.6, y: NIV + 0.1, n: 14, haut: 3.5, large: 2.0, taille: 2.2 });
  }
  // l'étang : une eau calme et verte (on voit les carpes), le reflet sombre des rochers de la rive
  const eauxCalmes = [[ETANG.x - ETANG.r * 1.25, ETANG.x + ETANG.r * 1.25, ETANG.z - ETANG.r * 1.25, ETANG.z + ETANG.r * 1.25, ETANG.eau]];
  /**
   * Un ruban d'eau qui coule le long des points [x, y, z] (sa largeur l ; ecume(k) : l'écume au point k), pour l'eau qui
   * coule du moteur (uv : les mètres vers l'aval, d'une rive à l'autre ; sens : la direction du courant).
   */
  const rubanEau = (pts, l, ecume = () => 0, couleur = null) => {
    const pos = [], uv = [], ec = [], sens = [], idx = [];
    let s = 0;
    pts.forEach((p, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dz = b[2] - a[2], d = Math.hypot(dx, dz) || 1, tx = dx / d, tz = dz / d;
      if (i) s += Math.hypot(p[0] - pts[i - 1][0], p[2] - pts[i - 1][2]);
      const w = typeof l === 'function' ? l(i) : l;
      for (const t of [0, 1]) {
        const o = (t - 0.5) * w;
        pos.push(p[0] - tz * o, p[1], p[2] + tx * o);
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
    courants.push(g);
  };
  // le canal : de l'étang au bord de la falaise, de plus en plus vite (un peu d'écume au bout)
  {
    const pts = [];
    for (let k = 0; k <= 24; k++) {
      const f = k / 24, x = CANAL[0][0] + (CANAL[2][0] - CANAL[0][0]) * f, z0 = CANAL[0][1] + (CANAL[2][1] - CANAL[0][1]) * f;
      // (le long de la ligne brisée : deux segments)
      const q = f < 0.48 ? [CANAL[0][0] + (CANAL[1][0] - CANAL[0][0]) * (f / 0.48), CANAL[0][1] + (CANAL[1][1] - CANAL[0][1]) * (f / 0.48)] : [CANAL[1][0] + (CANAL[2][0] - CANAL[1][0]) * ((f - 0.48) / 0.52), CANAL[1][1] + (CANAL[2][1] - CANAL[1][1]) * ((f - 0.48) / 0.52)];
      void x; void z0;
      pts.push([q[0], ETANG.eau - 0.02 - 0.12 * f, q[1]]);
    }
    rubanEau(pts, 1.15, (k) => Math.max(0, (k - 18) / 6) * 0.6, '#5e7d5a', { largeur: 1.15 });
    const a = atelier();
    // les bords de pierre du canal, et une dalle où le chemin le traverse
    for (let k = 0; k < pts.length - 1; k++) {
      const [x0, , z0] = pts[k], [x1, , z1] = pts[k + 1], dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz), ry = Math.atan2(dx, dz);
      for (const s of [-1, 1]) a.boite(0.28, 0.32, l + 0.02, TONS_PIERRE[(k + (s > 0 ? 1 : 0)) % 4], { x: (x0 + x1) / 2 + Math.cos(ry) * 0.72 * s, y: -0.12, z: (z0 + z1) / 2 - Math.sin(ry) * 0.72 * s, ry });
    }
    // la dalle : une pierre plate de 2,6 m en travers du canal, posée sur ses deux bords, son dessus 20 cm au-dessus du chemin ;
    // ses arêtes un peu cassées (une pierre plus étroite dessus)
    const { x: dx0, z: dz0, ux, uz } = DALLE, ryD = Math.atan2(ux, uz);
    a.boite(2.6, 0.2, 1.3, '#b2ab9b', { x: dx0, y: 0.08, z: dz0, ry: ryD })
      .boite(2.5, 0.04, 1.2, '#bdb6a5', { x: dx0, y: 0.19, z: dz0, ry: ryD })
      // (deux pierres d'appui sous ses bouts, sur les bords du canal)
      .boite(0.5, 0.3, 1.5, P.pierreFonce, { x: dx0 - uz * 1.08, y: -0.08, z: dz0 + ux * 1.08, ry: ryD })
      .boite(0.5, 0.3, 1.5, P.pierreFonce, { x: dx0 + uz * 1.08, y: -0.08, z: dz0 - ux * 1.08, ry: ryD });
    monde.chemin([[dx0 - uz * 1.3, dz0 + ux * 1.3, 0.21], [dx0 + uz * 1.3, dz0 - ux * 1.3, 0.21]], 0.6, { sol: 'pierre' });
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
    // (on ne marche pas dans le canal : un mur fin le long de chacun de ses bords, sauf à la dalle ; deux en travers, aux
    // bords de la dalle, pour qu'on n'en descende pas dans l'eau)
    {
      const fin2 = [CANAL[2][0] - 0.5, CANAL[2][1]];
      const segs = [[CANAL[0], CANAL[1]], [CANAL[1], fin2]];
      segs.forEach(([[ax, az], [bx, bz]], k) => {
        const l = Math.hypot(bx - ax, bz - az), tx = (bx - ax) / l, tz = (bz - az) / l, nx = -tz, nz = tx;
        const morceaux = k === 0 ? [[0, l]] : [[0, DALLE.s - 0.85], [DALLE.s + 0.85, l]];
        for (const [s0, s1] of morceaux) for (const c of [-0.68, 0.68]) monde.mur(ax + tx * s0 + nx * c, az + tz * s0 + nz * c, ax + tx * s1 + nx * c, az + tz * s1 + nz * c, 0.18);
      });
      for (const e of [-0.67, 0.67]) {
        const cx = dx0 + ux * e, cz = dz0 + uz * e;
        monde.mur(cx - uz * 0.7, cz + ux * 0.7, cx + uz * 0.7, cz - ux * 0.7, 0.06);
      }
    }
  }

  // ---------------------------------------------------------------- L'étang d'Onokoro
  {
    const a = atelier();
    // les pierres de la rive, tout autour (sauf là où sort le canal), et l'îlot (la terre des dieux, onogoro) et son pin
    for (let k = 0; k < 64; k++) {
      const t = (k / 64) * 2 * PI, r = rayonEtang(t) + 0.15, x = ETANG.x + Math.sin(t) * r, z = ETANG.z + Math.cos(t) * r;
      if (surLaLigne(CANAL, x, z).d < 1.3) continue;
      a.rocher(x, ETANG.eau + 0.05, z, 0.32 + 0.22 * hasard(k, 2.3), k % 3 ? P.pierreFonce : P.roche);
      monde.cercle(x, z, 0.5);
    }
    // (un mur de rochers : on ne marche pas dans l'eau)
    for (let k = 0; k < 64; k++) {
      const t0 = (k / 64) * 2 * PI, t1 = ((k + 1) / 64) * 2 * PI;
      const p0 = [ETANG.x + Math.sin(t0) * (rayonEtang(t0) + 0.15), ETANG.z + Math.cos(t0) * (rayonEtang(t0) + 0.15)], p1 = [ETANG.x + Math.sin(t1) * (rayonEtang(t1) + 0.15), ETANG.z + Math.cos(t1) * (rayonEtang(t1) + 0.15)];
      monde.mur(p0[0], p0[1], p1[0], p1[1], 0.45);
    }
    for (let k = 0; k < 9; k++) {
      const t = (k / 9) * 2 * PI, x = ILOT.x + Math.sin(t) * ILOT.r, z = ILOT.z + Math.cos(t) * ILOT.r;
      a.rocher(x, ETANG.eau, z, 0.35 + 0.2 * hasard(k, 7), P.roche);
    }
    a.pinNuages(ILOT.x, ILOT.z, 7.5, 1, { y: 0.2 });
    a.lanterne(ILOT.x + 0.8, ILOT.z - 0.5, 4.5, 0.15);
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
    lumieres.push({ x: ILOT.x + 0.8, y: 1.05, z: ILOT.z - 0.5, halo: 0.32, sol: ETANG.eau, r: 2.2 });
    ecrire({ x: ETANG.x + 9.6, y: 0, z: ETANG.z - 4.5, ry: -PI / 2 + 0.4 }, { texte: 'おのころ池', sous: 'Onokoro-ike', fond: '#f4ecd8', encre: '#2a2420', x: 0, y: 1.2, z: 0.07, l: 0.9, h: 0.5, cadre: true });
  }

  // ---------------------------------------------------------------- Le restaurant des nouilles (千穂の家) et sa gouttière
  {
    // (refait le 2026-10-25) Deux étages, comme une vieille maison de ville : le socle de pierre ; en bas, le soubassement de
    // planches sombres, l'enduit blanc, les poteaux et la poutre de bois foncé ; devant, deux grandes fenêtres à barreaux
    // serrés (kōshi) sur du papier qui s'allume le soir, l'entrée et ses portes coulissantes à barreaux, l'une entrouverte,
    // le noren bleu « そうめん », la pierre du seuil, deux lanternes rouges ; un auvent de tuiles et la grande enseigne
    // 千穂の家 ; en haut, en retrait, l'enduit et ses poteaux, trois fenêtres de papier derrière une balustrade ; le toit de
    // tuiles ; dehors, l'ardoise du menu. Tourné vers l'est (la gorge)
    const a = atelier(), R = repere(CHIHO.x, CHIHO.z, CHIHO.ry), y = 0, BS = '#5e4434', BN = P.boisFonce;
    a.boite(9.12, 0.5, 6.12, P.pierreFonce, R(0, y + 0.25, 0));
    // les murs du bas : derrière et côtés (enduit), leur soubassement de planches ; les poteaux ; la poutre
    a.boite(9.0, 2.9, 0.16, P.blanc, R(0, y + 1.95, -2.92)).boite(0.16, 2.9, 5.84, P.blanc, R(-4.42, y + 1.95, 0)).boite(0.16, 2.9, 5.84, P.blanc, R(4.42, y + 1.95, 0));
    a.boite(9.04, 0.9, 0.2, BS, R(0, y + 0.95, -2.93)).boite(0.2, 0.9, 5.88, BS, R(-4.43, y + 0.95, 0)).boite(0.2, 0.9, 5.88, BS, R(4.43, y + 0.95, 0));
    for (const lx of [-4.47, -1.27, 1.27, 4.47]) a.boite(0.22, 3.0, 0.22, BN, R(lx, y + 2.0, 2.95));
    for (const lx of [-4.47, 4.47]) a.boite(0.22, 3.0, 0.22, BN, R(lx, y + 2.0, -2.95));
    a.boite(9.3, 0.26, 0.24, BN, R(0, y + 3.38, 2.95)).boite(9.3, 0.24, 0.2, BN, R(0, y + 3.38, -2.95));
    for (const sg of [-1, 1]) a.boite(0.2, 0.24, 6.1, BN, R(sg * 4.47, y + 3.37, 0));
    // devant : de chaque côté de l'entrée, le soubassement, la grande fenêtre à barreaux sur son papier, l'enduit dessus
    for (const sg of [-1, 1]) {
      const cx = sg * 2.87;
      // (des largeurs un rien différentes : leurs bouts, dans les poteaux, ne sont pas dans le même plan)
      // (derrière les barreaux, le fond sombre d'une fenêtre, qui s'allume le soir : sur du papier clair, ces lignes fines
      // et foncées scintillaient dès que la caméra bougeait ; des barreaux plus épais, moins serrés)
      a.boite(3.0, 0.9, 0.18, BS, R(cx, y + 0.95, 2.9)).boite(3.02, 0.62, 0.16, P.blanc, R(cx, y + 2.94, 2.9))
        .boite(2.99, 1.3, 0.06, P.fenetre, R(cx, y + 1.98, 2.84, { trait: false }));
      for (let k = 0; k < 11; k++) a.boite(0.06, 1.3, 0.05, P.shojiCadre, R(cx - 1.35 + k * 0.27, y + 1.98, 2.9, { trait: false }));
      a.boite(3.01, 0.07, 0.07, BN, R(cx, y + 2.66, 2.92)).boite(3.01, 0.07, 0.07, BN, R(cx, y + 1.31, 2.92));
    }
    // l'entrée : deux portes coulissantes à barreaux sur papier (celle de droite à moitié ouverte : le dedans, sombre), le
    // linteau, l'enduit dessus, le noren, la pierre du seuil, les lanternes
    a.boite(2.32, 0.5, 0.16, P.blanc, R(0, y + 2.95, 2.9)).boite(2.4, 0.12, 0.14, BN, R(0, y + 2.66, 2.93))
      .boite(2.3, 2.1, 0.05, '#2e2620', R(0, y + 1.6, 2.7, { trait: false }));
    for (const [lx, dz] of [[-0.56, 2.86], [0.08, 2.8]]) {
      a.boite(1.12, 2.08, 0.05, P.fenetre, R(lx, y + 1.6, dz, { trait: false })).boite(1.16, 2.12, 0.04, BN, R(lx, y + 1.6, dz - 0.006));
      for (let k = 0; k < 5; k++) a.boite(0.055, 2.0, 0.035, P.shojiCadre, R(lx - 0.44 + k * 0.22, y + 1.6, dz + 0.04, { trait: false }));
    }
    for (const k of [-1, 0, 1]) a.boite(0.74, 0.86, 0.02, '#2f4a7a', R(k * 0.76, y + 2.2, 3.08));
    ecrire(R(0, y, 3.1), { texte: 'そうめん', fond: null, encre: '#f4ecd8', x: 0, y: 2.25, z: 0, l: 1.7, h: 0.42 });
    a.boite(2.6, 0.14, 0.6, P.pierre, R(0, y + 0.52, 3.32));
    for (const sg of [-1, 1]) { const q = R(sg * 1.27, 0, 3.2); a.chochin(q.x, y + 2.75, q.z, 9, '#d8402e'); lumieres.push({ x: q.x, y: y + 2.75, z: q.z, halo: 0.4, sol: y, r: 3.2 }); }
    // l'auvent de tuiles entre les deux étages, sa poutre ; l'enseigne
    a.boite(9.1, 0.12, 6.1, BN, R(0, y + 3.46, 0));
    a.boite(9.9, 0.1, 1.75, P.toit, R(0, y + 3.6, 3.25, { rx: 0.3, ordre: 'YXZ' })).boite(9.9, 0.05, 1.75, P.toitBord, R(0, y + 3.54, 3.255, { rx: 0.3, ordre: 'YXZ' }));
    for (const sg of [-1, 1]) a.boite(1.5, 0.1, 6.0, P.toit, R(sg * 4.85, y + 3.6, -0.35, { rz: -sg * 0.3, ordre: 'YXZ' }));
    a.boite(2.9, 0.78, 0.12, '#3a2a20', R(0, y + 4.18, 3.12)).boite(3.04, 0.9, 0.06, '#8a6a48', R(0, y + 4.18, 3.05));
    ecrire(R(0, y, 3.19), { texte: '千穂の家', fond: '#3a2a20', encre: '#f4ecd8', x: 0, y: 4.18, z: 0, l: 2.6, h: 0.62, cadre: true });
    // l'étage, un peu en retrait : l'enduit, ses poteaux, sa poutre, trois fenêtres de papier et leur balustrade
    a.boite(8.4, 2.3, 5.2, P.blanc, R(0, y + 4.6, -0.2));
    for (const lx of [-4.2, -1.4, 1.4, 4.2]) a.boite(0.18, 2.3, 0.18, BN, R(lx, y + 4.6, 2.43));
    for (const lx of [-4.2, 4.2]) a.boite(0.18, 2.3, 0.18, BN, R(lx, y + 4.6, -2.83));
    a.boite(8.7, 0.2, 0.2, BN, R(0, y + 5.66, 2.43));
    for (const lx of [-2.8, 0, 2.8]) {
      a.boite(2.0, 1.1, 0.05, P.shoji, R(lx, y + 4.65, 2.42, { trait: false })).boite(2.06, 1.16, 0.04, BN, R(lx, y + 4.65, 2.4));
      for (let k = 1; k < 4; k++) a.boite(0.03, 1.1, 0.03, P.shojiCadre, R(lx - 1 + k * 0.5, y + 4.65, 2.45, { trait: false }));
      a.boite(2.0, 0.03, 0.03, P.shojiCadre, R(lx, y + 4.65, 2.45, { trait: false }));
    }
    a.boite(8.5, 0.07, 0.08, BN, R(0, y + 4.2, 2.86));
    for (let k = 0; k <= 16; k++) a.boite(0.05, 0.42, 0.05, BN, R(-4.2 + k * (8.4 / 16), y + 4.0, 2.86 + (k % 2) * 0.004, { trait: false }));
    a.toitJapon(9.9, 7.0, 1.9, 0.15, { ...R(0, y + 5.76, -0.2), releve: 0.16 });
    // l'ardoise du menu, sur son pied, à côté de l'entrée
    {
      const q = R(-2.4, 0, 4.1, { ry: 0.25 });
      a.boite(0.6, 0.8, 0.04, '#2a2e2a', { ...q, y: y + 0.95 }).boite(0.66, 0.86, 0.03, BN, { ...q, y: y + 0.95, x: q.x - Math.sin(q.ry) * 0.012, z: q.z - Math.cos(q.ry) * 0.012 });
      for (const sg of [-1, 1]) a.boite(0.04, 0.95, 0.04, BN, { ...R(-2.4 + sg * 0.26, 0, 4.0, { ry: 0.25 }), y: y + 0.47 });
      ecrire({ ...q, y }, { texte: 'そうめん 600円', vertical: true, fond: null, encre: '#f4f0e6', x: 0, y: 0.95, z: 0.025, l: 0.22, h: 0.7 });
    }
    monde.bloc(CHIHO.x - 3.1, CHIHO.x + 3.1, CHIHO.z - 4.6, CHIHO.z + 4.6, -1, 5);
    // (un bâtiment plein : on n'y entre pas)
    monde.surface(CHIHO.x - 3.05, CHIHO.x + 3.05, CHIHO.z - 4.55, CHIHO.z + 4.55, 5, { plein: true });
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }
  {
    // la terrasse des nouilles : un auvent de bois sur poteaux ; la gouttière de bambou coupée en deux, sur ses tréteaux, qui
    // descend doucement du tonneau d'eau (au nord) au baquet (au sud) ; des tabourets le long, côté est
    const a = atelier(), x = SOMEN.x, z0 = SOMEN.z0 - 0.6, z1 = SOMEN.z1 + 0.6, y = 0;
    for (const [px, pz] of [[x - 1.6, z0 - 0.4], [x + 2.4, z0 - 0.4], [x - 1.6, z1 + 0.4], [x + 2.4, z1 + 0.4], [x - 1.6, (z0 + z1) / 2], [x + 2.4, (z0 + z1) / 2]]) {
      a.boite(0.16, 2.6, 0.16, P.bois, { x: px, y: y + 1.3, z: pz });
      monde.cercle(px, pz, 0.18);
    }
    a.toitJapon(5.2, z1 - z0 + 2.2, 0.9, 0.1, { x: x + 0.4, y: y + 2.6, z: (z0 + z1) / 2, releve: 0.08, tuile: '#7a6a52', tuile2: '#86765c', bord: P.boisFonce });
    // le tonneau d'eau, en haut ; le tuyau de bambou qui verse dans la gouttière
    a.cylindre(0.38, 0.4, 0.95, 14, P.bois2, { x, y: y + 0.85, z: SOMEN.z0 - 0.5 })
      .cylindre(0.405, 0.405, 0.05, 14, '#5a4a3a', { x, y: y + 0.7, z: SOMEN.z0 - 0.5 })
      .baton([x, y + 1.33, SOMEN.z0 - 0.42], [x, y + 1.18, SOMEN.z0 - 0.02], 0.035, '#8fb35a', 6);
    // la gouttière : un demi-tube de bambou vert (ouvert en haut), ses nœuds, ses tréteaux ; elle descend du tonneau (au nord)
    // vers le baquet (au sud). (Avant le 2026-10-25, couchée dans l'autre sens, elle montait : l'eau, qui descendait, flottait
    // au-dessus du bambou au nord et passait dessous au sud)
    const L = SOMEN.z1 - SOMEN.z0, pente = Math.atan2(SOMEN.y0 - SOMEN.y1, L);
    // (la moitié du cylindre tournée vers le bas une fois couché : une rigole ouverte en haut ; son axe vers +z en descendant)
    a.piece(new THREE.CylinderGeometry(0.085, 0.085, L, 14, 1, true, -PI / 2, PI), '#8fb35a', { x, y: (SOMEN.y0 + SOMEN.y1) / 2, z: (SOMEN.z0 + SOMEN.z1) / 2, rx: PI / 2 + pente, ordre: 'XYZ' })
      .piece(new THREE.CylinderGeometry(0.079, 0.079, L, 14, 1, true, -PI / 2, PI), '#c9d89a', { x, y: (SOMEN.y0 + SOMEN.y1) / 2 + 0.002, z: (SOMEN.z0 + SOMEN.z1) / 2, rx: PI / 2 + pente, sx: -1, trait: false });
    // (le bord du bambou, de chaque côté : une lisière plus foncée)
    for (const sg of [-1, 1]) a.baton([x + sg * 0.082, SOMEN.y0 + 0.004, SOMEN.z0], [x + sg * 0.082, SOMEN.y1 + 0.004, SOMEN.z1], 0.008, '#6f9442', 5, { trait: false });
    for (let k = 1; k < 5; k++) {
      const f = k / 5, zk = SOMEN.z0 + L * f, yk = SOMEN.y0 + (SOMEN.y1 - SOMEN.y0) * f;
      a.piece(new THREE.TorusGeometry(0.087, 0.012, 4, 12, PI), '#7a9a4a', { x, y: yk, z: zk, rz: PI });
      for (const s of [-1, 1]) a.baton([x + s * 0.3, y, zk], [x, yk - 0.09, zk], 0.025, P.boisFonce, 4);
    }
    a.cylindre(0.32, 0.28, 0.36, 12, P.bois2, { x, y: y + 0.62, z: SOMEN.z1 + 0.42 }).cylindre(0.29, 0.29, 0.012, 12, '#9cd0c6', { x, y: y + 0.802, z: SOMEN.z1 + 0.42, trait: false });
    // les tabourets, côté est
    for (let k = 0; k < 4; k++) {
      const zk = SOMEN.z0 + 1.0 + k * 1.9;
      a.cylindre(0.2, 0.18, 0.45, 10, P.bois, { x: x + 0.85, y: y + 0.225, z: zk });
      monde.cercle(x + 0.85, zk, 0.25);
    }
    // de l'autre côté, la table où mangent les gens
    a.boite(0.6, 0.06, L, P.bois, { x: x - 0.75, y: y + 0.72, z: (SOMEN.z0 + SOMEN.z1) / 2 });
    for (const zk of [SOMEN.z0 + 0.3, SOMEN.z1 - 0.3]) for (const s of [-1, 1]) a.boite(0.06, 0.72, 0.06, P.boisFonce, { x: x - 0.75 + s * 0.25, y: y + 0.36, z: zk });
    a.boite(0.4, 0.42, L, P.bois, { x: x - 1.35, y: y + 0.21, z: (SOMEN.z0 + SOMEN.z1) / 2 });
    // des bols, des baguettes sur la table
    for (let k = 0; k < 4; k++) {
      const zk = SOMEN.z0 + 0.8 + k * 1.8;
      a.cylindre(0.08, 0.05, 0.06, 10, '#f4efe6', { x: x - 0.7, y: y + 0.78, z: zk }).cylindre(0.066, 0.066, 0.01, 10, '#a8723e', { x: x - 0.7, y: y + 0.802, z: zk, trait: false });
      a.boite(0.012, 0.01, 0.22, '#c9a06a', { x: x - 0.55, y: y + 0.76, z: zk, trait: false });
    }
    monde.mur(x, SOMEN.z0 - 0.9, x, SOMEN.z1 + 0.7, 0.32);
    monde.mur(x - 0.75, SOMEN.z0, x - 0.75, SOMEN.z1, 0.42);
    // la pancarte « 流しそうめん »
    ecrire({ x: x + 2.4, y, z: SOMEN.z0 - 0.4, ry: PI / 2 }, { texte: '流しそうめん', vertical: true, fond: '#f4ecd8', encre: '#b8402a', x: 0.12, y: 1.5, z: 0, l: 0.36, h: 1.5, cadre: true });
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
    // l'eau de la gouttière : un filet clair et vif qui file vers le bas (3 cm sous le bord) ; celle qui tombe du tuyau du
    // tonneau, en haut ; celle qui tombe dans le baquet, en bas
    const pts = [];
    for (let k = 0; k <= 14; k++) { const f = k / 14; pts.push([x, SOMEN.y0 + (SOMEN.y1 - SOMEN.y0) * f - 0.03, SOMEN.z0 + L * f]); }
    rubanEau(pts, 0.135, (k) => (k < 2 ? 0.6 : 0.12), '#a8dcd0', { largeur: 0.135, vif: true });
    rubanEau([[x, y + 1.14, SOMEN.z0 + 0.02], [x, y + 1.07, SOMEN.z0 + 0.06], [x, SOMEN.y0 - 0.02, SOMEN.z0 + 0.1]], 0.04, () => 0.8, '#cfeee8', { largeur: 0.04, vif: true });
    rubanEau([[x, SOMEN.y1 - 0.03, SOMEN.z1], [x, SOMEN.y1 - 0.12, SOMEN.z1 + 0.12], [x, y + 0.8, SOMEN.z1 + 0.38]], 0.1, () => 0.7, '#cfeee8', { largeur: 0.1, vif: true });
  }

  // ---------------------------------------------------------------- La boutique de souvenirs
  {
    // (refaite le 2026-10-25) Une boutique de bois, ouverte sur le devant : le socle, les murs de planches et d'enduit, les
    // poteaux ; dedans, sous l'éclairage, des étagères pleines (boîtes de gâteaux, sachets de thé, bouteilles de saké,
    // masques de kagura) et une table au milieu ; dehors, sous un auvent de tuiles, l'étal ; le noren « おみやげ », deux
    // lanternes, deux bannières sur leurs mâts, l'enseigne ; un distributeur de boissons sur le côté. Tournée vers l'est
    const a = atelier(), R = repere(BOUTIQUE.x, BOUTIQUE.z, BOUTIQUE.ry), y = 0, BN = P.boisFonce;
    const COUL = ['#e8913a', '#5aa64a', '#c8452e', '#f2c443', '#2f6fb0', '#f4efe6', '#b06aa8', '#8a5a3a'];
    a.boite(6.12, 0.32, 4.52, P.pierreFonce, R(0, y + 0.16, 0));
    // les murs : derrière et côtés (planches en bas, enduit en haut), les poteaux, la poutre de devant, l'enduit dessus
    a.boite(6.0, 1.1, 0.16, P.bois, R(0, y + 0.87, -2.12)).boite(5.98, 1.75, 0.14, P.blanc, R(0, y + 2.3, -2.12));
    for (const sg of [-1, 1]) a.boite(0.16, 1.1, 4.2, P.bois, R(sg * 2.92, y + 0.87, -0.05)).boite(0.14, 1.75, 4.18, P.blanc, R(sg * 2.92, y + 2.3, -0.05));
    for (const lx of [-2.98, -1.0, 1.0, 2.98]) a.boite(0.2, 2.9, 0.2, BN, R(lx, y + 1.77, 2.12));
    for (const lx of [-2.98, 2.98]) a.boite(0.2, 2.9, 0.2, BN, R(lx, y + 1.77, -2.14));
    a.boite(6.3, 0.24, 0.22, BN, R(0, y + 3.1, 2.12)).boite(6.0, 0.4, 0.12, P.blanc, R(0, y + 3.42, 2.1));
    // dedans : le sol, les étagères du fond pleines de choses, la table du milieu, une lampe
    a.boite(5.7, 0.04, 4.1, '#b9ab8c', R(0, y + 0.34, 0, { trait: false }));
    for (const h of [0.95, 1.45, 1.95]) a.boite(5.5, 0.04, 0.42, P.bois2, R(0, y + h, -1.84));
    for (const lx of [-2.75, -0.9, 0.9, 2.75]) a.boite(0.05, 1.9, 0.42, P.bois2, R(lx, y + 1.3, -1.84));
    for (let k = 0; k < 33; k++) {
      const etage = [0.97, 1.47, 1.97][k % 3], lx = -2.55 + Math.floor(k / 3) * 0.47 + 0.08 * hasard(k, 1), c = COUL[(k * 5) % COUL.length];
      if (k % 4 === 0) a.cylindre(0.07, 0.08, 0.3, 8, k % 8 ? '#3a5a3a' : '#5a3a2a', R(lx, y + etage + 0.17, -1.84));
      else a.boite(0.28, 0.14 + 0.12 * hasard(k, 2), 0.24, c, R(lx, y + etage + 0.1 + 0.06 * hasard(k, 2), -1.82));
    }
    // (des masques de kagura accrochés au mur du fond, au-dessus des étagères : Okame, la blanche, et un masque rouge)
    for (const [lx, c] of [[-1.6, '#f4efe6'], [-0.5, '#d8553a'], [0.6, '#f4efe6'], [1.7, '#d8553a']]) a.ovale(0.15, c, { ...R(lx, y + 2.55, -1.98), sz: 0.35, sy: 1.15 }, 10).ovale(0.02, '#2a2420', { ...R(lx - 0.05, y + 2.6, -1.93), trait: false }, 5).ovale(0.02, '#2a2420', { ...R(lx + 0.05, y + 2.6, -1.93), trait: false }, 5);
    a.boite(1.8, 0.75, 0.9, P.bois2, R(0, y + 0.72, -0.2));
    for (let k = 0; k < 8; k++) a.boite(0.3, 0.1 + 0.06 * (k % 3), 0.25, COUL[(k + 2) % COUL.length], R(-0.7 + (k % 4) * 0.47, y + 1.15 + 0.03 * (k % 3), -0.42 + Math.floor(k / 4) * 0.44));
    a.chochin(R(0, 0, 0).x, y + 2.9, R(0, 0, 0).z, 7, '#f4f0e6');
    lumieres.push({ ...R(0, 0, 0), y: y + 2.9, halo: 0.3, sol: y + 0.35, r: 3.0 });
    // dehors : l'étal sous l'auvent, ses marchandises (des boîtes, des pots, une corbeille)
    a.boite(4.6, 0.82, 0.9, P.bois2, R(0, y + 0.41, 2.86)).boite(4.7, 0.05, 1.0, BN, R(0, y + 0.845, 2.86));
    for (let k = 0; k < 14; k++) {
      const lx = -2.0 + (k % 7) * 0.66, lz = 2.62 + Math.floor(k / 7) * 0.44, c = COUL[(k * 3 + 1) % COUL.length];
      if (k === 3 || k === 10) a.cylindre(0.2, 0.15, 0.16, 10, '#b8925a', R(lx, y + 0.95, lz)).ovale(0.06, '#e8452e', R(lx - 0.05, y + 1.05, lz), 6).ovale(0.06, '#f2c443', R(lx + 0.06, y + 1.06, lz + 0.03), 6);
      else if (k % 4 === 1) a.cylindre(0.09, 0.1, 0.22, 8, c, R(lx, y + 0.98, lz));
      else a.boite(0.36, 0.1 + 0.07 * (k % 3), 0.28, c, R(lx, y + 0.92 + 0.035 * (k % 3), lz));
    }
    a.boite(6.5, 0.1, 1.55, P.toit, R(0, y + 2.98, 2.9, { rx: 0.28, ordre: 'YXZ' })).boite(6.5, 0.05, 1.55, P.toitBord, R(0, y + 2.92, 2.905, { rx: 0.28, ordre: 'YXZ' }));
    // le noren, les lanternes, l'enseigne
    for (const k of [-1, 0, 1]) a.boite(1.8, 0.62, 0.02, k ? '#2f4a7a' : '#b8402a', R(k * 1.92, y + 2.66, 2.26));
    ecrire(R(0, y, 2.28), { texte: 'おみやげ', fond: null, encre: '#f4ecd8', x: 0, y: 2.66, z: 0, l: 1.3, h: 0.36 });
    for (const sg of [-1, 1]) { const q = R(sg * 2.98, 0, 2.4); a.chochin(q.x, y + 2.6, q.z, 8, '#d8402e'); lumieres.push({ x: q.x, y: y + 2.6, z: q.z, halo: 0.35, sol: y, r: 2.6 }); }
    ecrire(R(0, y, 2.17), { texte: '高千穂 みやげ処', fond: '#3a2a20', encre: '#e8c86a', x: 0, y: 3.42, z: 0, l: 2.4, h: 0.32, cadre: true });
    // les deux bannières (nobori) sur leurs mâts, devant
    for (const [sg, c, texte] of [[-1, '#c8452e', '神楽せんべい'], [1, '#2f4a7a', '高千穂の地酒']]) {
      const q = R(sg * 2.45, 0, 4.05);
      a.cylindre(0.035, 0.035, 3.3, 6, '#d8d0c0', { x: q.x, y: y + 1.65, z: q.z }).boite(0.5, 2.0, 0.015, c, { ...R(sg * 2.45 + 0.27, 0, 4.05), y: y + 2.1, trait: false });
      ecrire({ ...R(sg * 2.45 + 0.27, 0, 4.06), y }, { texte, vertical: true, fond: null, encre: '#f8f4ea', x: 0, y: 2.1, z: 0.01, l: 0.3, h: 1.7 });
      monde.cercle(q.x, q.z, 0.15);
    }
    // le distributeur de boissons, contre le mur nord ; sa vitrine éclairée
    {
      a.boite(0.95, 1.85, 0.8, '#e9edf1', R(3.5, y + 0.925, 1.6)).boite(0.7, 0.62, 0.02, '#d7ecf6', R(3.5, y + 1.35, 2.01, { sorte: 'lampe', trait: false }));
      for (let k = 0; k < 8; k++) a.boite(0.07, 0.16, 0.02, COUL[k % COUL.length], R(3.5 - 0.28 + (k % 4) * 0.19, y + 1.2 + Math.floor(k / 4) * 0.28, 2.025, { trait: false }));
      lumieres.push({ ...R(3.5, 0, 2.6), y: y + 1.3, halo: 0.2, sol: y, r: 2.0, c: '#e8f4ff' });
      monde.cercle(R(3.5, 0, 1.6).x, R(3.5, 0, 1.6).z, 0.6);
    }
    monde.surface(BOUTIQUE.x - 2.25, BOUTIQUE.x + 2.25, BOUTIQUE.z - 3.05, BOUTIQUE.z + 3.05, 5, { plein: true });
    monde.bloc(BOUTIQUE.x - 2.3, BOUTIQUE.x + 2.3, BOUTIQUE.z - 3.1, BOUTIQUE.z + 3.1, -1, 4.5);
    monde.mur(R(-2.2, 0, 2.8).x, R(-2.2, 0, 2.8).z, R(2.2, 0, 2.8).x, R(2.2, 0, 2.8).z, 0.45);
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- La place : bancs, lanternes, panneaux, arbres
  const PANNEAUX = {
    cascade: { x: -12.6, z: 13.4, ry: -PI / 2 - 0.3 },
    gorge: { x: 12.4, z: 68.6, ry: -PI / 2 + 0.3 },
    etang: { x: ETANG.x + 9.6, z: ETANG.z - 4.5, ry: -PI / 2 + 0.4, deja: true },
    barques: { x: -12.6, z: 20.2, ry: -PI / 2 },
    kihachi: { x: KIHACHI.x - 1.4, z: KIHACHI.z + 3.9, ry: PI / 2 + 0.5 },
    yaritobi: { x: 9.6, z: -46.5, ry: PI / 2 + 0.6 },
    yasu: { x: YASU.x + YASU.rx + 1.6, z: YASU.z + 1.5, ry: PI * 0.8 },
    yohai: { x: YOHAI.x + 3.9, z: YOHAI.z + 1.9, ry: PI - 0.3 },
    meoto: { x: MEOTO.x + 3.4, z: MEOTO.z + 2.4, ry: -PI / 2 - 0.6 },
    tajikarao: { x: TAJIKARAO.x - 2.2, z: TAJIKARAO.z + 1.4, ry: PI + 0.9 },
  };
  {
    const a = atelier();
    for (const [id, p] of Object.entries(PANNEAUX)) {
      if (p.deja) continue;
      const y = terrain(p.x, p.z), b = panneau(atelier(), P, { ecrit: true });
      poser(b.fin(0, peinture), p.x, p.z, { y, ry: p.ry });
      ecrire({ x: p.x, y, z: p.z, ry: p.ry }, { ...PAPIER_PANNEAU, texte: TITRES_PANNEAUX[id], fond: '#fff8e8', encre: '#2a2420', lignes: 3 });
      monde.cercle(p.x, p.z, 0.75);
    }
    // les bancs autour de l'étang, aux belvédères de la promenade, devant la scène du kagura
    banc(a, ETANG.x - 3, ETANG.z + 10.8, PI, 1.8);
    banc(a, ETANG.x - 10.6, ETANG.z + 1.5, -PI / 2 + 0.2, 1.8);
    banc(a, -13.4, 34, PI / 2 + 0.1, 1.6);
    banc(a, -13.6, -6, PI / 2, 1.6);
    // les lanternes de pierre de la place
    for (const [x, z] of [[-12.6, 4.6], [-12.4, 24.4], [-17.5, 40], [-17.6, 58], [-22, -2.4], [-33, 15], [-38.5, 3], [-21.5, 16]]) lanterne(a, x, z);
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }
  {
    // les érables de la place (rouges en automne : la carte postale de Takachiho), des cerisiers, un grand camphrier
    const a = atelier();
    // (celui du banc du grand-père, au nord de l'étang, était sur le banc : à 5,6 m de là)
    const ERABLES = [[-14.8, 1.5, 6.5], [-16.5, 30, 6.8], [-22, 23.5, 6.2], [-20, -8, 7.2], [-35.5, -2, 6.6], [-24.4, 18.6, 6.0], [-16, 48, 7.0], [-24, 55, 6.4], [-14.5, -18, 6.8], [-15, -40, 7.0]];
    for (const [x, z, h] of ERABLES) {
      a.arbreTouffu(x, z, h, [P.feuillage, P.herbeFonce, '#7aa848'], { y: terrain(x, z), sorte: 'houppierErable', caduc: true, large: 1.15 });
      monde.cercle(x, z, 0.4);
      noterArbre(x, z, h * 0.3);
    }
    for (const [x, z, h] of [[-44, 12, 7.2], [-46, 22, 6.6], [-26, 44, 6.8], [-36, 50, 7.0]]) {
      a.arbreTouffu(x, z, h, ['#6f9a4c', '#7aa654', '#668f46'], { y: terrain(x, z), sorte: 'houppierCerisier', caduc: true });
      monde.cercle(x, z, 0.4);
      noterArbre(x, z, h * 0.3);
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Le jardin, derrière le restaurant des nouilles
  // (2026-10-25, « derrière la boutique de nouilles, ça paraît un peu vide ») Le champ de thé de Takachiho (son thé grillé au
  // chaudron, le kamairi-cha) : sept rangs taillés en dos rond, la cueilleuse et ses paniers ; un petit pavillon (azumaya)
  // et ses deux bancs ; des hortensias ; un vieux puits ; un bosquet de bambous ; une rangée de jizō sous leur abri, leurs
  // bavoirs et leurs bonnets rouges. Un seul objet : la caméra ne le dessine que s'il est devant elle
  {
    const a = atelier();
    // le champ de thé : les rangs, des haies basses aux bords arrondis, un peu bosselées
    for (let x = THE.x0; x <= THE.x1 + 0.01; x += THE.pas) {
      const L = THE.z1 - THE.z0, zc = (THE.z0 + THE.z1) / 2, gr = hasard(x, 3.7);
      // (des touffes : le rang bosselé tout du long, le dessus un peu aplati par la taille ; les jeunes pousses plus claires)
      a.piece(new THREE.CapsuleGeometry(0.5, L - 1.0, 4, 14, 14), P.the, {
        x, y: 0.28, z: zc, rx: PI / 2, sx: 1.08, sz: 1.2, sorte: 'persistant', graine: gr, nuance: 0.08,
        deformer: (px, py, pz) => {
          const k = 1 + 0.11 * Math.sin(py * 5.3 + px * 11 + gr * 6) * Math.cos(pz * 9.1 + py * 2.7) + 0.06 * Math.sin(py * 13.7 - pz * 7 + gr);
          return [px * k, py, Math.min(pz * k, 0.43 + 0.03 * Math.sin(py * 3 + px * 5))];
        },
        teinte: (px, py) => (py > 0.7 ? (hasard(px * 3.1, py * 7.7) < 0.45 ? P.theClair : P.the) : py > 0.4 ? P.the : P.theFonce),
      });
      monde.mur(x, THE.z0 + 0.35, x, THE.z1 - 0.35, 0.55);
    }
    // ses paniers de cueillette, posés au bout d'un rang ; la pancarte du champ
    for (const [px, pz] of [[-55.9, 24.2], [-56.5, 24.0]]) a.cylindre(0.2, 0.16, 0.34, 10, '#b8925a', { x: px, y: 0.17, z: pz, teinte: (qx, qy) => (Math.floor(qy * 18) % 2 ? '#b8925a' : '#a07a48') });
    {
      const R = repere(THE.x1 + 1.6, THE.z0 + 3.4, PI / 2);
      a.boite(0.1, 1.5, 0.1, P.boisFonce, R(0, 0.75, 0)).boite(0.5, 1.1, 0.04, '#e8dcc0', R(0, 1.05, 0.07));
      ecrire(R(0, 0, 0.095), { texte: '高千穂 釜炒り茶', vertical: true, fond: null, encre: '#2f5a2a', x: 0, y: 1.05, z: 0, l: 0.3, h: 0.98 });
      monde.cercle(R(0, 0, 0).x, R(0, 0, 0).z, 0.25);
    }
    // le pavillon : un dallage, quatre poteaux, un toit à quatre pans ; deux bancs (on peut s'y asseoir) ; une lanterne de
    // papier qui s'allume la nuit
    {
      const { x, z } = AZUMAYA, R = repere(x, z, 0);
      a.boite(3.4, 0.14, 3.4, P.pierre, R(0, 0.07, 0));
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        a.boite(0.16, 2.4, 0.16, P.bois, R(sx * 1.35, 0.14 + 1.2, sz * 1.35));
        monde.cercle(x + sx * 1.35, z + sz * 1.35, 0.15);
      }
      for (const sz of [-1, 1]) a.boite(3.0, 0.14, 0.1, P.boisFonce, R(0, 2.4, sz * 1.35));
      for (const sx of [-1, 1]) a.boite(0.1, 0.12, 3.0, P.boisFonce, R(sx * 1.35, 2.25, 0));
      a.toitJapon(4.0, 4.0, 1.25, 0.06, { ...R(0, 2.5, 0), releve: 0.14 });
      a.chochin(x, 2.15, z, 7, '#f4f0e6');
      lumieres.push({ x, y: 2.15, z, halo: 0.35, sol: 0.14, r: 3.2 });
      banc(a, x + 0.95, z + 0.3, -PI / 2, 1.4);
      banc(a, x - 0.3, z - 0.95, 0, 1.4);
      monde.surface(x - 1.7, x + 1.7, z - 1.7, z + 1.7, 0.14, { sol: 'pierre' });
    }
    // des hortensias le long des chemins
    for (const [hx, hz, c] of [[-44.6, 27.4, '#6f7fd0'], [-48.6, 35.5, '#9a7ad6'], [-45.3, 38.7, '#6f7fd0'], [-49.6, 47.6, '#b97ac8'], [-52.6, 51.4, '#6f7fd0'], [-58.4, 16.2, '#9a7ad6']]) {
      a.buisson(hx, 0.36, hz, 0.58, P.herbeFonce, { touffu: true, sorte: 'buisson' });
      // (les boules de fleurs, posées sur le feuillage)
      for (let k = 0; k < 6; k++) { const t = k * 1.9 + hx, d = 0.18 + 0.22 * hasard(k, hz); a.ovale(0.15 + 0.04 * hasard(hx, k), c, { x: hx + Math.sin(t) * d, y: 0.62 + 0.1 * hasard(k, 2.2), z: hz + Math.cos(t) * d, trait: false }, 6); }
      monde.cercle(hx, hz, 0.75);
    }
    // le vieux puits : la margelle de pierre, l'eau sombre au fond, deux poteaux, un petit toit, la poulie, la corde, le seau
    {
      const { x, z } = PUITS;
      // (creux : le mur dehors, le mur dedans retourné, la margelle par-dessus, l'eau sombre en bas)
      a.piece(new THREE.CylinderGeometry(0.72, 0.76, 0.75, 16, 1, true), P.pierre, { x, y: 0.375, z, teinte: (px, py, pz) => TONS_PIERRE[Math.floor(Math.atan2(px - x, pz - z) * 2.5 + 8 + Math.floor(py * 4)) % 4] })
        .piece(new THREE.CylinderGeometry(0.6, 0.6, 0.74, 16, 1, true), P.pierreFonce, { x, y: 0.39, z, sx: -1, trait: false })
        .cylindre(0.6, 0.6, 0.02, 16, '#24302e', { x, y: 0.28, z, trait: false })
        .piece(new THREE.TorusGeometry(0.66, 0.08, 6, 18), P.pierreFonce, { x, y: 0.76, z, rx: PI / 2 });
      for (const sg of [-1, 1]) a.boite(0.12, 2.1, 0.12, P.bois, { x: x + sg * 0.85, y: 1.05, z });
      a.boite(1.9, 0.1, 0.1, P.boisFonce, { x, y: 1.95, z }).pignon(2.3, 0.45, 1.5, P.toit, { x, y: 2.05, z })
        .cylindre(0.1, 0.1, 0.06, 10, P.boisFonce, { x, y: 1.82, z, rz: PI / 2 })
        .baton([x, 1.78, z], [x, 1.05, z], 0.012, '#c9a65a', 4)
        .cylindre(0.13, 0.11, 0.24, 10, P.bois2, { x, y: 0.94, z });
      monde.cercle(x, z, 0.95);
    }
    // le bosquet de bambous : des tiges hautes, vert tendre, rayées de nœuds ; des touffes de feuilles en haut
    {
      const { x: bx, z: bz, r } = BAMBOUS;
      for (let k = 0; k < 64; k++) {
        const t = k * 2.39996, d = r * Math.sqrt((k + 0.5) / 64) * (0.92 + 0.16 * hasard(k, 1.1)), x = bx + Math.sin(t) * d, z = bz + Math.cos(t) * d;
        if (surLaLigne(CHEMINS_JARDIN[3], x, z).d < 1.0) continue;
        const h = 7.5 + 4 * hasard(k, 2.3), rb = 0.05 + 0.025 * hasard(k, 3.1), penche = [(hasard(k, 4.4) - 0.5) * 0.5, (hasard(k, 5.5) - 0.5) * 0.5];
        a.fut([x, -0.1, z], [x + penche[0], h, z + penche[1]], rb, rb * 0.6, '#8fb35a', 6, { teinte: (px, py) => (Math.floor(py * 2.6) % 2 ? '#8fb35a' : '#7a9f4a') });
        for (const f of [0.68, 0.8, 0.93]) {
          const sg = (k + Math.round(f * 10)) % 2 ? 1 : -1;
          a.houppe(0.7 + 0.35 * hasard(k, f), f > 0.9 ? '#9ac25e' : '#86b452', { x: x + penche[0] * f + sg * 0.45, y: h * f, z: z + penche[1] * f + sg * 0.2, sy: 0.55, sorte: 'persistant', bosses: 0.3 }, 0);
        }
        monde.cercle(x, z, 0.14);
      }
    }
    // l'abri des jizō : une banquette de pierre, cinq jizō (le crâne lisse, les mains jointes, le bavoir et le bonnet rouges),
    // un petit toit de bois sur deux poteaux, une lanterne
    {
      const { x, z } = JIZO, R = repere(x, z, PI / 2);
      a.boite(4.0, 0.3, 0.8, P.pierreFonce, R(0, 0.15, 0));
      for (let k = 0; k < 5; k++) {
        const lx = -1.6 + k * 0.8, s = 0.92 + 0.12 * hasard(k, 7.3), q = R(lx, 0, 0);
        a.cylindre(0.13 * s, 0.17 * s, 0.5 * s, 10, P.pierre, { x: q.x, y: 0.3 + 0.25 * s, z: q.z })
          .ovale(0.13 * s, P.pierre, { x: q.x, y: 0.3 + 0.61 * s, z: q.z, sy: 1.05 }, 10)
          .ovale(0.05 * s, P.pierreFonce, { ...R(lx, 0.3 + 0.42 * s, 0.14 * s), sx: 1.4, sz: 0.8 }, 6)
          .cone(0.17 * s, 0.26 * s, 10, '#d8402e', { ...R(lx, 0.3 + 0.36 * s, 0.035), sz: 0.45, rx: -0.12, ordre: 'YXZ' })
          .dome(0.135 * s, '#d8402e', { x: q.x, y: 0.3 + 0.63 * s, z: q.z, sy: 0.85 });
      }
      for (const sg of [-1, 1]) a.boite(0.1, 1.82, 0.1, P.boisFonce, R(sg * 2.15, 0.91, -0.45));
      a.boite(4.6, 0.08, 1.3, P.toit, R(0, 1.72, -0.1, { rx: 0.18, ordre: 'YXZ' }));
      lanterne(a, ...[R(2.7, 0, 0.6)].map((q) => [q.x, q.z])[0]);
      monde.mur(R(-2.0, 0, 0).x, R(-2.0, 0, 0).z, R(2.0, 0, 0).x, R(2.0, 0, 0).z, 0.45);
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- La promenade (rive est)
  {
    const a = atelier();
    // la pierre de force du démon Kihachi (鬼八の力石) : un énorme bloc de basalte arrondi par le temps, deux cents tonnes,
    // posé au bord du chemin ; la corde sacrée qui en fait le tour, ses papiers du côté du chemin et des touffes de paille ;
    // la mousse dessus, des fougères et des pierres à son pied (refaite le 2026-10-25 : c'était un rocher plat et anguleux,
    // la corde posée dessus)
    {
      const K = KIHACHI, rk = 1.6, ryK = 0.55, yc = RIVE_E - 0.1 + rk * 0.62;
      const surf = rocherSculpte(a, K.x, yc, K.z, rk, { sx: 1.42, sy: 1.0, sz: 1.18, ry: ryK, graine: 3.7 });
      const lat = (t) => 0.27 + 0.07 * Math.sin(t + 0.9);
      const tour = [];
      for (let k = 0; k < 32; k++) { const t = (k / 32) * 2 * PI; tour.push(surf(Math.sin(t), lat(t), Math.cos(t), 0.06)); }
      cordeFermee(a, tour, 0.075);
      // (les papiers et les touffes du côté du chemin, à l'ouest : t = −2,1 dans le repère de la pierre)
      for (const t of [-2.6, -2.25, -1.9, -1.55]) { const [px, py, pz] = surf(Math.sin(t), lat(t), Math.cos(t), 0.14); shide(a, px, py - 0.07, pz, t + ryK, 2); }
      for (const t of [-2.78, -2.08, -1.38]) { const [px, py, pz] = surf(Math.sin(t), lat(t), Math.cos(t), 0.13); touffePaille(a, px, py - 0.05, pz, 0.34); }
      for (let k = 0; k < 8; k++) {
        const t = 0.3 + k * 0.78 + hasard(k, 1.3) * 0.35, [px, , pz] = surf(Math.sin(t), -0.5, Math.cos(t), 0.3);
        if (k % 2) a.rocher(px, terrain(px, pz) + 0.06, pz, 0.2 + 0.12 * hasard(k, 2), P.basalte);
        else a.houppe(0.36 + 0.14 * hasard(k, 3), k % 4 ? P.fougere : P.mousseRocheFonce, { x: px, y: terrain(px, pz) + 0.16, z: pz, sy: 0.6, sorte: 'persistant' }, 1);
      }
      // (deux cercles le long de sa grande longueur)
      for (const e of [-0.95, 0.95]) monde.cercle(K.x + Math.cos(ryK) * e, K.z - Math.sin(ryK) * e, 1.75);
    }
    // les bancs des belvédères
    banc(a, 12.0 + 3.2, VUE_CASCADE.z + 2.2, -PI / 2, 1.8);
    banc(a, 14.2, -36, -PI / 2 + 0.2, 1.6);
    banc(a, 13.4, 40, -PI / 2, 1.8);
    for (const [x, z] of [[13.2, 6.4], [12.8, 52], [14.6, -24], [11.8, -52]]) lanterne(a, x, z);
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Le sanctuaire du mythe de la grotte céleste
  // (inspiré du sanctuaire d'Amanoiwato et de celui de Takachiho : du bois brut, des toits d'écorce de cyprès, les bois
  // croisés et les rondins dorés du faîte) Une allée du sud au nord : le grand torii, les cèdres, le pavillon de prière ;
  // à l'ouest, la scène du kagura et les cèdres mariés ; près de l'entrée, la statue de Tajikarao et le bassin des
  // ablutions ; au nord, au bord de la pente, le lieu de prière face à la grotte d'Amaterasu
  {
    const a = atelier(), y = 0, B = P.boisBrut, BF = P.boisBrutFonce, ECORCE = '#8a7058', ECORCE2 = '#7a6250';
    /** Un toit à deux pans d'écorce de cyprès (L le long du faîtage, en x local ; Pp de profondeur ; pente) posé à yb dans le
     * repère R, avec ses rives de bois, son faîtage, et, si chigi, les bois croisés aux deux bouts et les rondins dorés. */
    const toitEcorce = (R, L, Pp, yb, pente = 0.55, chigi = true) => {
      const demi = Pp / 2 / Math.cos(pente), haut = (Pp / 2) * Math.tan(pente);
      for (const s of [-1, 1]) {
        a.boite(L, 0.26, demi + 0.1, ECORCE, R(0, yb + haut / 2, s * Pp / 4, { rx: s * pente, ordre: 'YXZ' }))
          .boite(L + 0.04, 0.05, demi + 0.12, ECORCE2, R(0, yb + haut / 2 - 0.15, s * Pp / 4 + s * 0.004, { rx: s * pente, ordre: 'YXZ' }));
        // les rives (des planches au bout des pans)
        for (const e of [-1, 1]) a.boite(0.08, 0.34, demi + 0.14, BF, R(e * (L / 2 + 0.04), yb + haut / 2, s * Pp / 4, { rx: s * pente, ordre: 'YXZ' }));
      }
      a.boite(L + 0.3, 0.3, 0.42, BF, R(0, yb + haut + 0.1, 0));
      if (!chigi) return;
      for (const e of [-1, 1]) {
        for (const s of [-1, 1]) a.boite(0.1, 1.4, 0.14, BF, R(e * (L / 2 + 0.05), yb + haut + 0.55, s * 0.28, { rx: s * 0.55, ordre: 'YXZ' }));
        a.boite(0.12, 0.12, 0.12, P.or, R(e * (L / 2 + 0.05), yb + haut + 1.18, 0.62)).boite(0.12, 0.12, 0.12, P.or, R(e * (L / 2 + 0.05), yb + haut + 1.18, -0.62));
      }
      const n = Math.max(3, Math.round(L / 1.5));
      for (let k = 0; k < n; k++) {
        const lx = -L / 2 + 0.8 + (k * (L - 1.6)) / (n - 1);
        a.cylindre(0.15, 0.15, 0.9, 10, BF, R(lx, yb + haut + 0.36, 0, { rx: PI / 2 })).cylindre(0.155, 0.155, 0.06, 10, P.or, R(lx, yb + haut + 0.36, 0.45, { rx: PI / 2 }));
      }
    };
    // le grand torii de bois brut, à l'entrée de l'allée (tourné vers le sud, d'où l'on arrive du pont)
    {
      const R = repere(TORII.x, TORII.z, 0);
      for (const s of [-1, 1]) a.cylindre(0.26, 0.3, 5.4, 12, B, R(s * 2.3, y + 2.7, 0)).cylindre(0.36, 0.36, 0.3, 12, BF, R(s * 2.3, y + 0.15, 0));
      a.boite(6.6, 0.42, 0.5, B, R(0, y + 5.25, 0)).boite(5.4, 0.3, 0.3, B, R(0, y + 4.4, 0)).boite(0.3, 0.86, 0.26, BF, R(0, y + 4.82, 0));
      a.shimenawa([R(-2.2, 0, 0.12), R(0, 0, 0.14), R(2.2, 0, 0.12)].map((q, i) => [q.x, y + 4.05 - (i === 1 ? 0.22 : 0), q.z]), 0.07, [R(-1, 0, 0.14), R(1, 0, 0.14)].map((q) => [q.x, y + 3.85, q.z]));
      for (const s of [-1, 1]) monde.cercle(R(s * 2.3, 0, 0).x, R(s * 2.3, 0, 0).z, 0.42);
    }
    // l'allée : des dalles, les grands cèdres de part et d'autre, les lanternes
    for (let z = TORII.z - 3; z > HAIDEN.z + 5.5; z -= 4.2) {
      for (const s of [-1, 1]) {
        const x = TORII.x + s * 4.6 + (hasard(z, s) - 0.5) * 0.6, h = 16 + 6 * hasard(z * 1.3, s);
        a.sugi(x, z, h, { y: terrain(x, z), vert: P.cedre, vertFonce: P.cedreFonce, tronc: '#5e4030', rTronc: 0.55 });
        monde.cercle(x, z, 0.75);
        noterArbre(x, z, 2.2);
      }
    }
    for (let z = TORII.z - 5; z > HAIDEN.z + 6; z -= 5.6) for (const s of [-1, 1]) lanterne(a, TORII.x + s * 2.7, z);
    // le pavillon de prière (haiden), tourné vers le sud : le soubassement de pierre, l'estrade, les poteaux, les parois de
    // planches, le toit d'écorce ; devant, le rideau blanc, la cloche et sa corde, le tronc des offrandes ; à côté, les
    // tonneaux de saké offerts
    {
      const R = repere(HAIDEN.x, HAIDEN.z, 0);
      a.boite(9.6, 0.7, 7.4, P.pierre, R(0, y + 0.35, 0)).boite(9.0, 0.12, 6.8, B, R(0, y + 0.76, 0));
      for (const lx of [-4.2, -1.4, 1.4, 4.2]) for (const lz of [-3.1, 3.1]) a.cylindre(0.17, 0.17, 3.0, 10, B, R(lx, y + 2.3, lz));
      a.boite(8.8, 2.3, 0.14, BF, R(0, y + 1.95, -3.1)).boite(0.14, 2.3, 6.2, BF, R(-4.3, y + 1.95, 0)).boite(0.14, 2.3, 6.2, BF, R(4.3, y + 1.95, 0));
      a.boite(9.2, 0.3, 7.0, BF, R(0, y + 3.8, 0));
      toitEcorce(R, 10.4, 8.6, y + 3.95, 0.52, true);
      // les marches de bois devant l'estrade
      for (let k = 0; k < 2; k++) a.boite(3.2, 0.26, 0.42, B, R(0, y + 0.13 + k * 0.26, 3.9 + (1 - k) * 0.42));
      a.boite(4.0, 0.9, 0.03, '#f4f0e6', R(0, y + 3.25, 3.2));
      ecrire(R(0, y, 3.22), { texte: '天岩戸', fond: null, encre: '#7a1e1a', x: 0, y: 3.25, z: 0.01, l: 1.3, h: 0.5 });
      a.boule(0.22, P.or, R(0, y + 2.95, 3.55), 1).baton([R(0, 0, 3.55).x, y + 2.75, R(0, 0, 3.55).z], [R(0, 0, 3.66).x, y + 0.95, R(0, 0, 3.66).z], 0.05, '#f4f0e6', 6);
      a.boite(1.6, 0.6, 0.7, P.boisFonce, R(0, y + 0.3, 4.95)).boite(1.5, 0.05, 0.62, '#3a2a20', R(0, y + 0.62, 4.95, { trait: false }));
      ecrire(R(0, y, 5.31), { texte: '奉納', fond: null, encre: '#f4ecd8', x: 0, y: 0.3, z: 0, l: 0.6, h: 0.3 });
      for (let k = 0; k < 6; k++) {
        const lx = 5.4 + (k % 3) * 0.72, ly = k < 3 ? 0.36 : 1.08, lz = 1.6 - (k < 3 ? 0 : 0.36);
        a.cylindre(0.33, 0.33, 0.7, 12, '#f4efe6', R(lx, y + ly, lz, { rx: PI / 2 })).cylindre(0.335, 0.335, 0.08, 12, '#2f4a7a', R(lx, y + ly, lz + 0.28, { rx: PI / 2 }));
      }
      // (2026-10-25) la balustrade autour de l'estrade, sauf devant les marches ; les deux chiens-lions de pierre, la gueule
      // ouverte et fermée (a-un), sur leurs socles, de part et d'autre de l'escalier
      for (const sg of [-1, 1]) {
        for (const [ax, az, bx, bz] of [[sg * 4.62, -3.5, sg * 4.62, 3.62], [sg * 4.62, 3.62, sg * 1.7, 3.62]]) {
          const A = R(ax, 0, az), B2 = R(bx, 0, bz), l = Math.hypot(B2.x - A.x, B2.z - A.z), n = Math.max(2, Math.round(l / 0.9));
          a.baton([A.x, y + 1.42, A.z], [B2.x, y + 1.42, B2.z], 0.04, B, 6).baton([A.x, y + 1.1, A.z], [B2.x, y + 1.1, B2.z], 0.025, B, 5);
          for (let k = az > 0 ? 1 : 0; k <= n; k++) a.boite(0.08, 0.66, 0.08, BF, { x: A.x + (B2.x - A.x) * k / n, y: y + 1.12, z: A.z + (B2.z - A.z) * k / n });
        }
        const q = R(sg * 2.9, 0, 6.1);
        a.boite(0.9, 0.95, 0.9, P.pierreFonce, { x: q.x, y: y + 0.475, z: q.z }).boite(0.98, 0.1, 0.98, P.pierre, { x: q.x, y: y + 1.0, z: q.z });
        const Kr = repere(q.x, q.z, -sg * 0.35), K = (lx, ly, lz, o = {}) => ({ ...Kr(lx, 0, lz, o), y: y + 1.05 + ly, ordre: 'YXZ' });
        a.ovale(0.26, P.pierre, { ...K(0, 0.3, -0.05), sx: 0.8, sy: 1.15, sz: 1.0 }, 10)
          .ovale(0.22, P.pierre, { ...K(0, 0.7, 0.08), sx: 1.0, sy: 0.95, sz: 0.92 }, 10)
          .ovale(0.17, P.pierreFonce, { ...K(0, 0.64, 0.02), sx: 1.35, sy: 1.0, sz: 0.9 }, 8)
          .boite(0.16, 0.08, 0.14, sg < 0 ? '#5a5048' : P.pierre, K(0, 0.6, 0.27))
          .ovale(0.04, '#2a2420', { ...K(-0.08, 0.76, 0.27), trait: false }, 5).ovale(0.04, '#2a2420', { ...K(0.08, 0.76, 0.27), trait: false }, 5);
        for (const s3 of [-1, 1]) a.boite(0.1, 0.36, 0.12, P.pierre, K(s3 * 0.13, 0.18, 0.14)).cone(0.06, 0.16, 5, P.pierreFonce, K(s3 * 0.12, 0.92, 0.0, { rx: -0.4 }));
        a.cone(0.09, 0.32, 6, P.pierreFonce, K(0, 0.25, -0.33, { rx: -2.3 }));
        monde.cercle(q.x, q.z, 0.62);
      }
      monde.surface(HAIDEN.x - 4.5, HAIDEN.x + 4.5, HAIDEN.z - 3.4, HAIDEN.z + 3.6, 0.82, { sol: 'bois' });
      monde.rampe(HAIDEN.x - 1.6, HAIDEN.x + 1.6, HAIDEN.z + 3.6, HAIDEN.z + 4.4, 'z', 0.82, 0.02, { sol: 'bois' });
      // (le dedans est fermé : on prie devant)
      monde.surface(HAIDEN.x - 4.4, HAIDEN.x + 4.4, HAIDEN.z - 3.3, HAIDEN.z + 2.9, 9, { plein: true });
      monde.bloc(HAIDEN.x - 4.5, HAIDEN.x + 4.5, HAIDEN.z - 3.4, HAIDEN.z + 3.0, -1, 8);
      monde.surface(HAIDEN.x + 5.0, HAIDEN.x + 7.2, HAIDEN.z + 0.8, HAIDEN.z + 2.0, 3, { plein: true });
      monde.cercle(R(0, 0, 4.95).x, R(0, 0, 4.95).z, 0.6);
      for (const s of [-1, 1]) {
        a.chochin(R(s * 3, 0, 3.6).x, y + 2.6, R(s * 3, 0, 3.6).z, 9, '#f4f0e6');
        lumieres.push({ ...R(s * 3, 0, 3.6), y: y + 2.6, halo: 0.4, sol: y, r: 3.4 });
      }
    }
    // le sanctuaire principal (honden), derrière le pavillon, dans sa clôture de planches
    {
      const R = repere(HAIDEN.x, HAIDEN.z - 9, 0);
      a.boite(4.6, 0.9, 4.0, P.pierre, R(0, y + 0.45, 0)).boite(3.6, 2.2, 3.0, B, R(0, y + 2.0, 0)).boite(1.2, 1.6, 0.05, P.or, R(0, y + 1.8, 1.53));
      toitEcorce(R, 5.2, 4.6, y + 3.1, 0.62, true);
      for (let k = -9; k <= 9; k++) for (const s of [-1, 1]) a.boite(0.16, 1.4, 0.06, BF, R(k * 0.34, y + 0.7, s * 3.4));
      for (let k = -9; k <= 9; k++) for (const s of [-1, 1]) a.boite(0.06, 1.4, 0.16, BF, R(s * 3.2, y + 0.7, k * 0.36));
      monde.surface(HAIDEN.x - 3.4, HAIDEN.x + 3.4, HAIDEN.z - 12.6, HAIDEN.z - 5.4, 6, { plein: true });
    }
    // la scène du kagura (神楽殿) : un pavillon ouvert sur une estrade, tourné vers l'est (le public, sur l'allée), son fond
    // peint, les papiers découpés (hori-mono) pendus au bord du toit, la corde sacrée, des lanternes rouges
    {
      const R = repere(KAGURA.x, KAGURA.z, PI / 2);
      a.boite(8.4, 1.0, 6.4, B, R(0, y + 0.5, 0)).boite(8.0, 0.08, 6.0, '#d8b88a', R(0, y + 1.04, 0));
      for (const lx of [-3.8, 3.8]) for (const lz of [-2.8, 2.8]) a.cylindre(0.16, 0.16, 3.4, 10, B, R(lx, y + 2.7, lz));
      a.boite(8.0, 2.6, 0.12, BF, R(0, y + 2.3, -2.95));
      toitEcorce(R, 9.6, 7.6, y + 4.35, 0.48, false);
      ecrire(R(0, y, -2.88), { texte: '', fond: null, dessin: fondKagura, x: 0, y: 2.6, z: 0, l: 7.6, h: 2.4 });
      a.shimenawa([R(-3.8, 0, 2.95), R(0, 0, 3.0), R(3.8, 0, 2.95)].map((q, i) => [q.x, y + 3.95 - (i === 1 ? 0.2 : 0), q.z]), 0.07, [-2.6, -1.3, 0, 1.3, 2.6].map((dx) => { const q = R(dx, 0, 3.0); return [q.x, y + 3.7, q.z]; }));
      const COUL = ['#e8452e', '#f2c443', '#5aa64a', '#2f6fb0', '#f4f0e6'];
      for (let k = 0; k < 13; k++) a.boite(0.42, 0.55, 0.012, COUL[k % 5], R(-3.3 + k * 0.55, y + 3.35, 2.92, { trait: false }));
      for (let k = 0; k < 3; k++) a.boite(2.0, 0.3, 0.4, B, R(0, y + 0.15 + k * 0.3, 3.4 + (2 - k) * 0.4));
      for (const [ax, az, bx, bz] of [[-4.05, 3.1, -1.1, 3.1], [1.1, 3.1, 4.05, 3.1], [-4.05, 3.1, -4.05, -3.0], [4.05, 3.1, 4.05, -3.0]]) {
        const A = R(ax, 0, az), B2 = R(bx, 0, bz), l = Math.hypot(B2.x - A.x, B2.z - A.z), n = Math.max(2, Math.round(l / 0.75));
        a.baton([A.x, y + 1.62, A.z], [B2.x, y + 1.62, B2.z], 0.035, B, 6);
        // (le poteau du coin une seule fois : les côtés commencent au deuxième)
        for (let k = ax === bx ? 1 : 0; k <= n; k++) a.boite(0.07, 0.56, 0.07, BF, { x: A.x + (B2.x - A.x) * k / n, y: y + 1.34, z: A.z + (B2.z - A.z) * k / n });
      }
      monde.surface(KAGURA.x - 2.95, KAGURA.x + 2.95, KAGURA.z - 3.95, KAGURA.z + 3.95, 1.05, { sol: 'bois' });
      monde.rampe(KAGURA.x + 3.0, KAGURA.x + 4.4, KAGURA.z - 1.0, KAGURA.z + 1.0, 'x', 1.05, 0.05, { sol: 'bois' });
      monde.mur(KAGURA.x - 3.05, KAGURA.z - 4.1, KAGURA.x - 3.05, KAGURA.z + 4.1, 0.18);
      for (const s of [-1, 1]) {
        const q = R(s * 3.4, 0, 2.8);
        a.chochin(q.x, y + 3.2, q.z, 10, '#e8452e');
        lumieres.push({ x: q.x, y: y + 3.2, z: q.z, halo: 0.45, sol: y + 1, r: 4.5 });
      }
      // les bancs du public, deux rangs face à la scène
      for (const dx of [7.4, 10.0]) for (const dz of [-2.4, 2.4]) banc(a, KAGURA.x + dx, KAGURA.z + dz, -PI / 2, 2.6);
    }
    // les cèdres mariés (夫婦杉) : deux troncs nés d'une même racine, la corde sacrée qui les relie, une clôture basse
    // dont on fait le tour
    {
      const x = MEOTO.x, z = MEOTO.z;
      for (const s of [-1, 1]) a.sugi(x + s * 0.95, z, 26 + s, { y: terrain(x, z), vert: P.cedre, vertFonce: P.cedreFonce, tronc: '#5e4030', rTronc: 0.62, rot: s });
      a.fut([x - 0.9, -0.3, z], [x + 0.9, -0.3, z], 0.9, 0.9, '#5e4030', 7);
      a.shimenawa([[x - 1.3, 2.4, z + 0.55], [x, 2.15, z + 0.75], [x + 1.3, 2.4, z + 0.55]], 0.08, [[x - 0.45, 2.1, z + 0.72], [x + 0.45, 2.1, z + 0.72]]);
      for (let k = 0; k < 16; k++) { const t = (k / 16) * 2 * PI; a.boite(0.1, 0.55, 0.1, BF, { x: x + Math.sin(t) * MEOTO.rx, y: 0.27, z: z + Math.cos(t) * MEOTO.rz }); }
      for (let k = 0; k < 16; k++) {
        const t0 = (k / 16) * 2 * PI, t1 = ((k + 1) / 16) * 2 * PI;
        a.baton([x + Math.sin(t0) * MEOTO.rx, 0.45, z + Math.cos(t0) * MEOTO.rz], [x + Math.sin(t1) * MEOTO.rx, 0.45, z + Math.cos(t1) * MEOTO.rz], 0.03, B, 4);
        monde.mur(x + Math.sin(t0) * MEOTO.rx, z + Math.cos(t0) * MEOTO.rz, x + Math.sin(t1) * MEOTO.rx, z + Math.cos(t1) * MEOTO.rz, 0.15);
      }
      noterArbre(x, z, 3);
    }
    // la statue de Tajikarao (手力雄命) : le dieu à la force de mille hommes qui arracha la porte de la grotte d'Amaterasu.
    // Refaite le 2026-10-25 (« la statue du démon qui porte le caillou ») : un bronze patiné sur un socle de granit à deux
    // degrés, sa plaque ; le torse nu et musclé, une ceinture de corde et un pagne, les jambes écartées et fléchies sous le
    // poids, les bras levés ; au-dessus de sa tête, la porte de pierre, un gros bloc arrondi ; la barbe, les sourcils
    // froncés, les cheveux rejetés en arrière
    {
      const { x, z, ry } = TAJIKARAO, T = repere(x, z, ry), y0 = 1.36;
      const Q = (lx, ly, lz) => { const q = T(lx, 0, lz); return [q.x, y0 + ly, q.z]; };
      const BR = P.bronzeStatue, BO = P.bronzeOmbre, PA = P.patine;
      // (le bronze : une patine verte en fines coulures, plus présente en haut ; plus sombre en bas)
      const bz = (o = {}) => ({ ordre: 'YXZ', ...o, nuance: 0.04, teinte: (px, py, pz) => (bruitDoux(px * 9 + py * 1.5, pz * 9 - py * 2, 1) > 0.8 - 0.06 * (py - y0) ? PA : py < y0 + 0.55 ? BO : BR) });
      a.boite(2.0, 0.35, 1.7, P.pierreFonce, T(0, 0.175, 0)).boite(1.6, 0.86, 1.3, P.pierre, T(0, 0.78, 0))
        .boite(1.72, 0.1, 1.42, P.pierreFonce, T(0, 1.25, 0)).boite(1.54, 0.07, 1.24, P.pierre, T(0, 1.325, 0));
      a.boite(0.72, 0.36, 0.02, BO, T(0, 0.8, 0.66, { trait: false }));
      ecrire(T(0, 0, 0.672), { texte: '手力雄命', fond: null, encre: '#e8c86a', x: 0, y: 0.8, z: 0, l: 0.62, h: 0.26 });
      const membre = (A, B, r0, r1) => a.fut(Q(...A), Q(...B), r0, r1, BR, 8, bz());
      const masse = (A, r, o = {}) => a.ovale(r, BR, bz({ ...T(A[0], y0 + A[1], A[2]), ...o }), 10);
      for (const sg of [-1, 1]) {
        // les pieds, les jambes écartées et fléchies : le mollet, le genou, la cuisse
        masse([sg * 0.34, 0.07, 0.07], 0.13, { sx: 0.8, sy: 0.5, sz: 1.4 });
        membre([sg * 0.33, 0.1, 0.03], [sg * 0.43, 0.62, 0.14], 0.075, 0.11);
        masse([sg * 0.385, 0.33, -0.01], 0.085, { sy: 1.7, rz: -sg * 0.19 });
        masse([sg * 0.43, 0.63, 0.14], 0.115);
        membre([sg * 0.43, 0.63, 0.14], [sg * 0.18, 1.05, 0], 0.12, 0.155);
        masse([sg * 0.31, 0.85, 0.1], 0.13, { sx: 0.95, sy: 1.6, sz: 0.95, rz: sg * 0.54 });
        // les bras levés : l'épaule, le biceps, le coude, l'avant-bras, la main sous la pierre
        masse([sg * 0.37, 1.8, -0.02], 0.155);
        membre([sg * 0.38, 1.8, -0.02], [sg * 0.62, 2.18, 0.06], 0.115, 0.095);
        masse([sg * 0.49, 2.0, 0.07], 0.085, { sy: 1.6, rz: -sg * 0.56 });
        masse([sg * 0.62, 2.18, 0.06], 0.092);
        membre([sg * 0.62, 2.18, 0.06], [sg * 0.43, 2.58, 0.1], 0.092, 0.066);
        masse([sg * 0.55, 2.33, 0.08], 0.075, { sy: 1.5, rz: sg * 0.45 });
        masse([sg * 0.43, 2.66, 0.1], 0.088, { sx: 1.15, sy: 0.6, sz: 1.25 });
        // les pectoraux
        masse([sg * 0.13, 1.62, 0.18], 0.15, { sx: 1.15, sy: 0.8, sz: 0.45 });
      }
      // le bassin, le ventre et ses abdominaux, la poitrine, les trapèzes
      masse([0, 1.08, -0.02], 0.25, { sx: 1.3, sy: 0.85, sz: 0.95 });
      masse([0, 1.29, 0.02], 0.23, { sx: 1.12, sy: 1.0, sz: 0.8 });
      for (const dy of [1.2, 1.29, 1.38]) for (const sg of [-1, 1]) masse([sg * 0.058, dy, 0.19], 0.046, { sz: 0.45 });
      masse([0, 1.58, 0], 0.31, { sx: 1.22, sy: 0.92, sz: 0.74 });
      masse([0, 1.82, -0.05], 0.16, { sx: 1.7, sy: 0.55, sz: 0.85 });
      // la ceinture de corde, le pagne devant et derrière
      a.cylindre(0.29, 0.28, 0.13, 16, BO, bz({ ...T(0, y0 + 1.14, -0.01), sz: 0.82 }))
        .boite(0.27, 0.46, 0.04, BR, bz(T(0, y0 + 0.9, 0.205, { rx: -0.08 })))
        .boite(0.24, 0.3, 0.04, BR, bz(T(0, y0 + 0.98, -0.25, { rx: 0.1 })));
      // le cou, la tête un peu levée, la barbe, les sourcils, le nez, les cheveux rejetés en arrière
      membre([0, 1.8, 0], [0, 1.99, 0.03], 0.12, 0.1);
      masse([0, 2.1, 0.05], 0.165, { sx: 0.95, sy: 1.1 });
      masse([0, 1.97, 0.13], 0.1, { sx: 1.25, sy: 1.25, sz: 0.75 });
      a.boite(0.25, 0.045, 0.07, BO, bz(T(0, y0 + 2.155, 0.18, { rx: -0.25 })))
        .cone(0.032, 0.085, 6, BR, bz(T(0, y0 + 2.1, 0.21, { rx: PI / 2 })));
      for (let k = 0; k < 9; k++) {
        const t = -1.25 + (k / 8) * 2.5;
        a.cone(0.06, 0.36, 5, BO, bz(T(Math.sin(t) * 0.13, y0 + 2.2 + Math.cos(t) * 0.03, -0.1 - 0.03 * Math.abs(t), { rx: -1.95, rz: Math.sin(t) * 0.5 })));
      }
      // la porte de pierre, en bronze elle aussi, posée sur ses mains ; l'hiver, un épais coussin de neige dessus, qui
      // descend sur ses flancs (sorte manteau : vue d'en bas, la neige de son seul dessus ne se voyait pas)
      rocherSculpte(a, ...Q(0, 3.22, 0.08), 0.62, { sx: 1.75, sy: 0.82, sz: 1.08, ry: ry + 0.12, rz: 0.1, graine: 5.3, fond: -0.9, mousse: 0.7, tons: [BO, '#4f4230', '#463a2a', PA, BO], sorte: 'manteau' });
      monde.cercle(x, z, 1.15);
    }
    // l'arbre sacré (神木) et sa corde ; le bassin des ablutions (chōzuya) et son dragon de bronze ; le stand des
    // porte-bonheur (des omamori, des joyaux magatama de pierre verte)
    {
      a.arbreTouffu(SHINBOKU.x, SHINBOKU.z, 13, [P.feuillage, P.herbeFonce, '#5a9a4a'], { y: 0, sorte: 'persistant', rTronc: 0.75, large: 1.4, tronc: '#8a7a68' });
      a.piece(new THREE.TorusGeometry(0.92, 0.07, 6, 20), P.paille, { x: SHINBOKU.x, y: 1.6, z: SHINBOKU.z, rx: PI / 2 });
      monde.cercle(SHINBOKU.x, SHINBOKU.z, 1.05);
      noterArbre(SHINBOKU.x, SHINBOKU.z, 4);
      // le pavillon des ablutions (手水舎), refait le 2026-10-25 (« la fontaine du temple n'est pas bien faite ») : un dallage
      // bordé de pierre ; quatre poteaux sur leurs pierres, des traverses, les poutres, un toit d'écorce de cyprès ; dessous,
      // le bassin de pierre taillée (chōzubachi), son eau qui frémit ; le dragon de bronze sur son rocher, qui la verse ; les
      // louches posées sur leurs bambous, en travers ; la plaque 手水舎
      const c = CHOZU, Rc = repere(c.x, c.z, 0), bzc = 0.04;
      a.boite(3.42, 0.1, 2.62, P.pierreFonce, Rc(0, 0.05, 0)).boite(3.3, 0.16, 2.5, P.pierre, Rc(0, 0.08, 0));
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        a.boite(0.3, 0.14, 0.3, P.pierreFonce, Rc(sx * 1.3, 0.23, sz * 0.95)).boite(0.17, 2.38, 0.17, B, Rc(sx * 1.3, 0.3 + 1.19, sz * 0.95));
        monde.cercle(c.x + sx * 1.3, c.z + sz * 0.95, 0.16);
      }
      // les traverses (à deux hauteurs : elles ne se croisent pas), les poutres, le toit
      for (const sz of [-1, 1]) a.boite(3.0, 0.13, 0.07, BF, Rc(0, 2.02, sz * 0.95)).boite(3.36, 0.16, 0.13, B, Rc(0, 2.6, sz * 0.95));
      for (const sx of [-1, 1]) a.boite(0.07, 0.13, 2.2, BF, Rc(sx * 1.3, 1.86, 0)).boite(0.12, 0.14, 2.3, B, Rc(sx * 1.3, 2.44, 0));
      toitEcorce(Rc, 3.8, 3.0, 2.68, 0.62, false);
      // la plaque, sur la poutre de devant
      a.boite(0.74, 0.3, 0.03, BF, Rc(0, 2.33, 1.03));
      ecrire(Rc(0, 0, 1.047), { texte: '手水舎', fond: '#f4ecd8', encre: '#2a2420', x: 0, y: 2.33, z: 0, l: 0.66, h: 0.24, cadre: true });
      // le bassin : un socle un peu plus large, quatre bords taillés, l'eau dedans (elle coule doucement vers le trop-plein)
      a.boite(1.84, 0.36, 0.9, P.pierreFonce, Rc(0, 0.34, bzc))
        .boite(1.74, 0.26, 0.15, P.pierre, Rc(0, 0.65, bzc + 0.355)).boite(1.74, 0.26, 0.15, P.pierre, Rc(0, 0.65, bzc - 0.355))
        .boite(0.15, 0.26, 0.56, P.pierre, Rc(-0.795, 0.65, bzc)).boite(0.15, 0.26, 0.56, P.pierre, Rc(0.795, 0.65, bzc));
      rubanEau([[-0.7, 0.735, bzc], [0, 0.735, bzc], [0.7, 0.735, bzc]].map(([lx, ly, lz]) => { const q = Rc(lx, ly, lz); return [q.x, ly, q.z]; }), 0.56, (k) => (k === 0 ? 0.5 : 0.05), '#6fa8a0', { largeur: 0.56 });
      // le dragon de bronze sur son rocher, au coin du fond, à gauche : il crache l'eau dans le bassin
      {
        rocherSculpte(a, ...[Rc(-0.64, 0, bzc - 0.62)].map((q) => [q.x, 0.62, q.z])[0], 0.32, { sx: 1.1, sy: 1.0, sz: 0.9, graine: 2.2, fond: -0.8 });
        const D = (lx, ly, lz) => { const q = Rc(lx, 0, lz); return [q.x, ly, q.z]; }, BRZ = P.bronze, BRZF = '#4f7a66';
        a.tube([D(-0.78, 0.86, bzc - 0.72), D(-0.62, 1.02, bzc - 0.78), D(-0.5, 1.1, bzc - 0.62), D(-0.56, 1.12, bzc - 0.48)], 0.065, BRZF, { cotes: 7, pas: 12 });
        a.ovale(0.1, BRZ, { ...Rc(-0.55, 1.15, bzc - 0.42), sx: 0.85, sy: 0.9, sz: 1.35, rx: 0.35 }, 10)
          .boite(0.1, 0.06, 0.16, BRZ, Rc(-0.53, 1.11, bzc - 0.3, { rx: 0.35 }))
          .boite(0.09, 0.03, 0.14, BRZF, Rc(-0.53, 1.06, bzc - 0.31, { rx: 0.6 }));
        for (const sg of [-1, 1]) {
          a.cone(0.018, 0.16, 5, '#c9a95a', Rc(-0.55 + sg * 0.05, 1.27, bzc - 0.5, { rx: -0.7 }))
            .cone(0.03, 0.14, 5, BRZF, Rc(-0.55 + sg * 0.07, 1.2, bzc - 0.55, { rx: -1.1, rz: sg * 0.4 }))
            .ovale(0.016, '#e8c86a', { ...Rc(-0.55 + sg * 0.045, 1.19, bzc - 0.36), trait: false }, 6);
        }
        // l'eau qui tombe de sa gueule dans le bassin : un filet qui coule, de l'écume là où il tombe
        const bouche = Rc(-0.52, 1.07, bzc - 0.25), chute = Rc(-0.5, 0.74, bzc - 0.14);
        rubanEau([[bouche.x, 1.07, bouche.z], [(bouche.x + chute.x) / 2, 0.93, (bouche.z + chute.z) / 2 + 0.01], [chute.x, 0.745, chute.z]], 0.045, () => 0.9, '#cfeee8', { largeur: 0.045, vif: true });
        a.piece(new THREE.TorusGeometry(0.06, 0.012, 4, 14), '#f4fbfa', { x: chute.x, y: 0.742, z: chute.z, rx: PI / 2, trait: false });
      }
      // les louches (hishaku), retournées sur deux bambous posés en travers du bassin
      for (const dz of [0.16, 0.33]) { const A = Rc(-0.9, 0, bzc + dz), B2 = Rc(0.9, 0, bzc + dz); a.baton([A.x, 0.8, A.z], [B2.x, 0.8, B2.z], 0.018, '#9ab35a', 6); }
      for (const lx of [-0.45, -0.15, 0.15, 0.45]) {
        const q = Rc(lx, 0, bzc + 0.25), m0 = Rc(lx, 0, bzc + 0.2), m1 = Rc(lx + 0.02, 0, bzc - 0.2);
        a.cylindre(0.052, 0.048, 0.075, 10, '#d8c49a', { x: q.x, y: 0.858, z: q.z }).baton([m0.x, 0.84, m0.z], [m1.x, 0.83, m1.z], 0.009, '#c9b07a', 5);
      }
      monde.cercle(c.x, c.z + bzc, 1.0);
      // le comptoir des porte-bonheur (授与所), refait le 2026-10-25 : un petit pavillon de bois brut sur un socle de pierre,
      // son toit d'écorce de cyprès ; devant, le comptoir couvert d'un tissu blanc, les porte-bonheur (omamori) en rangs de
      // couleurs, les joyaux magatama, des tablettes de vœux (ema) sur leur présentoir ; la miko derrière ; l'enseigne
      const s2 = repere(JUYOSHO.x, JUYOSHO.z, -PI / 2);
      a.boite(3.3, 0.24, 2.3, P.pierre, s2(0, 0.12, -0.55));
      for (const [lx, lz] of [[-1.5, 0.4], [1.5, 0.4], [-1.5, -1.5], [1.5, -1.5]]) a.boite(0.14, 2.3, 0.14, B, s2(lx, 0.24 + 1.15, lz));
      a.boite(3.0, 2.06, 0.08, BF, s2(0, 1.27, -1.5)).boite(0.08, 2.06, 1.82, BF, s2(-1.5, 1.27, -0.55)).boite(0.08, 2.06, 1.82, BF, s2(1.5, 1.27, -0.55));
      a.boite(3.0, 0.4, 0.06, BF, s2(0, 2.3, 0.4)).boite(3.0, 0.82, 0.62, B, s2(0, 0.65, 0.12)).boite(3.08, 0.05, 0.7, '#f4f0e6', s2(0, 1.085, 0.12));
      toitEcorce(repere(JUYOSHO.x + 0.45, JUYOSHO.z, -PI / 2), 3.9, 3.0, 2.5, 0.58, false);
      for (let k = 0; k < 18; k++) a.boite(0.09, 0.14, 0.025, ['#c8452e', '#2f6fb0', '#f2c443', '#5aa64a', '#e88ab0', '#f4f0e6'][k % 6], s2(-1.3 + (k % 9) * 0.29, 1.19, 0.3 - Math.floor(k / 9) * 0.16, { rx: -0.35, ordre: 'YXZ', trait: false }));
      for (let k = 0; k < 6; k++) a.piece(new THREE.TorusGeometry(0.045, 0.025, 5, 8, PI * 1.3), k % 2 ? '#3a9a6a' : '#5ab08a', s2(-1.15 + k * 0.46, 1.135, -0.08, { rx: PI / 2 }));
      a.boite(0.8, 0.9, 0.05, B, s2(1.85, 0.69, 0.3, { ry: 0.3 }));
      for (let k = 0; k < 6; k++) a.boite(0.2, 0.13, 0.015, '#d8b98a', s2(1.85 - 0.25 + (k % 3) * 0.25, 0.85 - Math.floor(k / 3) * 0.3, 0.335, { ry: 0.3, trait: false }));
      ecrire(s2(0, 0, 0.44), { texte: '授与所', fond: '#f4ecd8', encre: '#2a2420', x: 0, y: 2.3, z: 0, l: 0.9, h: 0.3, cadre: true });
      monde.mur(s2(-1.55, 0, 0.42).x, s2(-1.55, 0, 0.42).z, s2(1.55, 0, 0.42).x, s2(1.55, 0, 0.42).z, 0.32);
      monde.surface(JUYOSHO.x - 0.1, JUYOSHO.x + 1.65, JUYOSHO.z - 1.6, JUYOSHO.z + 1.6, 4, { plein: true });
    }
    // le lieu de prière face à la grotte (遥拝所), refait le 2026-10-25 (« refais l'autel où il y a l'arbre et sa petite
    // guirlande ») : une terrasse de dalles bordée de pierre, au bord de la pente ; une barrière de bois aux poteaux pointus
    // (tamagaki) ; un torii de bois clair (shinmei) tourné vers la grotte d'Amaterasu, de l'autre côté de la rivière, sa
    // corde ; l'arbre sacré (sakaki) au feuillage sombre et brillant, la corde autour de son tronc, les cinq soies colorées
    // et le collier de joyaux pendus à ses branches ; la table des offrandes à huit pieds, le riz et le sel, deux fioles de
    // saké, deux vases de sakaki ; deux lanternes de pierre
    {
      const x = YOHAI.x, z = YOHAI.z, yt = 0.225;
      a.boite(6.24, 0.24, 3.64, P.pierreFonce, { x, y: 0.08, z: z - 0.4 });
      for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) a.boite(0.95, 0.04, 1.08, (i + j) % 2 ? '#c5beae' : '#b2ab9b', { x: x - 2.5 + i, y: 0.205, z: z - 1.5 + j * 1.1, trait: false, nuance: 0.03 });
      // (on marche sur la dalle, pas dedans)
      monde.surface(x - 3.0, x + 3.0, z - 2.1, z + 1.3, yt, { sol: 'pierre' });
      // le torii, tourné vers la grotte : deux piliers ronds, la poutre ronde du haut (kasagi), la traverse (nuki), la corde
      for (const sg of [-1, 1]) a.cylindre(0.125, 0.14, 2.62, 12, B, { x: x + sg * 1.2, y: yt + 1.31, z: z - 1.95 });
      a.cylindre(0.13, 0.13, 3.3, 12, B, { x, y: yt + 2.6, z: z - 1.95, rz: PI / 2 }).boite(2.92, 0.15, 0.1, B, { x, y: yt + 2.1, z: z - 1.95 });
      a.shimenawa([[x - 1.1, yt + 1.95, z - 1.84], [x, yt + 1.8, z - 1.82], [x + 1.1, yt + 1.95, z - 1.84]], 0.05, [[x - 0.55, yt + 1.78, z - 1.82], [x, yt + 1.72, z - 1.82], [x + 0.55, yt + 1.78, z - 1.82]]);
      for (const sg of [-1, 1]) monde.cercle(x + sg * 1.2, z - 1.95, 0.18);
      // la barrière, au bord de la pente : des poteaux pointus tous les 50 cm, deux barres
      for (let k = -6; k <= 6; k++) a.boite(0.08, 0.8, 0.08, B, { x: x + k * 0.5, y: yt + 0.4, z: z - 2.17 }).cone(0.058, 0.12, 4, B, { x: x + k * 0.5, y: yt + 0.86, z: z - 2.17, ry: PI / 4 });
      for (const [h, d] of [[0.3, 0.006], [0.68, 0]]) a.boite(6.1, 0.07, 0.05, BF, { x, y: yt + h, z: z - 2.17 + 0.065 + d });
      monde.mur(x - 3.05, z - 2.15, x + 3.05, z - 2.15, 0.14);
      // l'arbre sacré : un tronc, des branches, des touffes de feuilles sombres et brillantes ; la corde autour du tronc
      {
        const S = SAKAKI;
        a.fut([S.x, 0.1, S.z], [S.x + 0.05, 1.75, S.z], 0.11, 0.065, '#7a5a40', 7).fut([S.x, Math.max(0.1, terrain(S.x, S.z) - 0.2), S.z], [S.x, yt + 0.12, S.z], 0.18, 0.115, '#6a4a34', 7);
        const TOUFFES = [[0, 2.2, 0, 0.55], [-0.45, 1.88, 0.1, 0.42], [0.42, 1.95, -0.15, 0.4], [0.1, 2.62, 0.05, 0.38], [-0.25, 1.55, -0.3, 0.32], [0.36, 2.42, 0.5, 0.3], [-0.5, 2.3, -0.2, 0.3]];
        for (const [dx, dy, dz, r] of TOUFFES) {
          a.fut([S.x + dx * 0.15, Math.min(dy - 0.4, 1.55), S.z + dz * 0.15], [S.x + dx * 0.85, dy - r * 0.35, S.z + dz * 0.85], 0.034, 0.018, '#7a5a40', 5);
          a.houppe(r, dx + dz > 0.1 ? '#3f6a3a' : '#33592f', { x: S.x + dx, y: dy, z: S.z + dz, sorte: 'persistant', bosses: 0.24 }, 1);
        }
        // (la branche où pend le miroir du secret, au-dessus de lui)
        a.fut([S.x + 0.04, 1.65, S.z + 0.04], [S.x + 0.3, 2.2, S.z + 0.55], 0.03, 0.02, '#7a5a40', 5);
        const anneau = [];
        for (let k = 0; k < 14; k++) { const t = (k / 14) * 2 * PI; anneau.push([S.x + 0.02 + Math.sin(t) * 0.125, 1.02 + 0.03 * Math.sin(t * 2), S.z + Math.cos(t) * 0.125]); }
        cordeFermee(a, anneau, 0.032);
        shide(a, S.x + 0.03, 0.98, S.z + 0.16, 0, 1.4);
        // les cinq soies (bleu, rouge, jaune, blanc, violet), pendues à une branche basse, à gauche
        ['#2f6fb0', '#c8302c', '#f2c443', '#f8f6ee', '#7a4aa8'].forEach((cs, k) => a.boite(0.055, 0.72, 0.006, cs, { x: S.x - 0.62 + k * 0.064, y: 1.25, z: S.z + 0.22 + k * 0.003, trait: false, nuance: 0.02 }));
        a.baton([S.x - 0.68, 1.62, S.z + 0.21], [S.x - 0.06, 1.66, S.z + 0.12], 0.012, '#7a5a40', 4);
        // le collier de joyaux : des perles et des magatama, en arc entre deux branches
        for (let k = 0; k <= 8; k++) {
          const f = k / 8, px = S.x - 0.32 + f * 0.62, py = 1.98 - Math.sin(f * PI) * 0.26, pz = S.z + 0.36 + f * 0.04;
          if (k % 2) a.ovale(0.026, k % 4 === 1 ? '#3a9a6a' : '#d8452e', { x: px, y: py, z: pz, sx: 0.8, sy: 1.3, trait: false }, 6);
          else a.ovale(0.02, '#f4efe6', { x: px, y: py, z: pz, trait: false }, 6);
        }
      }
      // la table des offrandes (八足案) : un plateau de bois blanc sur huit pieds (quatre à chaque bout), leurs semelles ; le
      // milieu reste libre (le koban du secret y apparaîtra)
      {
        const O = OFFRANDES, BL = '#f2ead8', BL2 = '#e6dcc4';
        a.boite(0.98, 0.045, 0.54, BL, { x: O.x, y: 0.7, z: O.z });
        for (const sg of [-1, 1]) {
          for (const dz of [-0.2, -0.07, 0.07, 0.2]) a.boite(0.032, 0.47, 0.032, BL2, { x: O.x + sg * 0.42, y: yt + 0.235, z: O.z + dz, rz: -sg * 0.05 });
          a.boite(0.06, 0.04, 0.5, BL2, { x: O.x + sg * 0.44, y: yt + 0.02, z: O.z }).boite(0.05, 0.035, 0.48, BL2, { x: O.x + sg * 0.41, y: 0.66, z: O.z });
        }
        // le sanbō et son riz, à gauche ; les deux fioles de saké, à droite ; deux petits vases de sakaki, au fond
        a.boite(0.2, 0.11, 0.2, '#ecdfc2', { x: O.x - 0.3, y: 0.778, z: O.z }).boite(0.25, 0.025, 0.25, BL, { x: O.x - 0.3, y: 0.846, z: O.z })
          .cone(0.08, 0.1, 10, '#fbf8f0', { x: O.x - 0.3, y: 0.908, z: O.z, trait: false });
        for (const dz of [-0.1, 0.1]) {
          a.ovale(0.042, '#f4f1ea', { x: O.x + 0.32, y: 0.775, z: O.z + dz, sy: 1.5 }, 10).cylindre(0.016, 0.02, 0.06, 8, '#f4f1ea', { x: O.x + 0.32, y: 0.86, z: O.z + dz })
            .cone(0.024, 0.04, 8, '#e8452e', { x: O.x + 0.32, y: 0.905, z: O.z + dz });
        }
        for (const sg of [-1, 1]) {
          a.cylindre(0.03, 0.035, 0.12, 8, '#f4f1ea', { x: O.x + sg * 0.16, y: 0.783, z: O.z - 0.2 });
          a.houppe(0.08, '#3f6a3a', { x: O.x + sg * 0.16, y: 0.93, z: O.z - 0.2, sy: 1.4, sorte: 'persistant' }, 0);
        }
      }
      // deux lanternes de pierre, aux coins du sud de la terrasse
      for (const sg of [-1, 1]) lanterne(a, x + sg * 2.7, z + 0.95, yt);
      monde.cercle(SAKAKI.x, SAKAKI.z, 0.45);
      monde.cercle(OFFRANDES.x, OFFRANDES.z, 0.5);
    }
    // la clôture du sanctuaire, au bord de la pente (au nord), sauf au lieu de prière et en haut de l'escalier
    {
      // (là où l'escalier passe la ligne de la clôture, avec ses murets ; et le lieu de prière : deux ouvertures, un poteau
      // à chacun de leurs bords)
      const [[dx0, dz0], [dx1, dz1]] = DESCENTE, f = (SANCT.z0 + 0.4 - dz0) / (dz1 - dz0), xe = dx0 + (dx1 - dx0) * f;
      const ouvertures = [[YOHAI.x - 3.4, YOHAI.x + 3.4], [xe - 2.0, xe + 1.8]], dans = (x) => ouvertures.some(([u, v]) => x > u && x < v);
      const poteaux = [];
      for (let x = SANCT.x0 + 0.5; x < SANCT.x1 - 0.5; x += 2) if (!dans(x)) poteaux.push(x);
      for (const [u, v] of ouvertures) poteaux.push(u, v);
      poteaux.sort((p, q) => p - q);
      poteaux.forEach((x, i) => {
        a.boite(0.1, 0.9, 0.1, BF, { x, y: 0.45, z: SANCT.z0 + 0.4 });
        const xn = poteaux[i + 1];
        if (xn !== undefined && xn - x > 0.2 && !dans((x + xn) / 2)) a.boite(xn - x, 0.06, 0.06, B, { x: (x + xn) / 2, y: 0.8, z: SANCT.z0 + 0.4 });
      });
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }
  // ---------------------------------------------------------------- La vallée de la rivière Iwato
  {
    const a = atelier();
    // l'eau : un ruban le long de l'axe, de l'ouest jusqu'au bord de la gorge
    const pts = [];
    for (let x = -112; x <= -3.2; x += 2) { const v = surIwato(x, -124); pts.push([v.cx, NIV_I - 0.02, v.cz]); }
    rubanEau(pts, LARGE_I * 2 + 0.3, (k) => (k > pts.length - 4 ? 0.7 : 0.08 + 0.1 * hasard(k, 3)), '#4f8a76', { largeur: LARGE_I * 2 + 0.3 });
    // des rochers dans le lit et sur les bords (de l'écume autour : l'eau vive)
    for (let k = 0; k < 40; k++) {
      const x = -108 + k * 2.6 + hasard(k, 1) * 1.5, v = surIwato(x, -124), cote = hasard(k, 2) < 0.5 ? -1 : 1, d = (0.6 + 2.4 * hasard(k, 3)) * cote;
      if (Math.abs(x - PONT_I.x) < 2.2) continue;
      a.rocher(v.cx, NIV_I - 0.2, v.cz - d, 0.3 + 0.4 * hasard(k, 4), hasard(k, 5) < 0.4 ? '#6a7a5a' : P.basalte, { sy: 0.6 });
    }
    // l'escalier de pierre qui descend du sanctuaire à la corniche du sud (refait le 2026-10-25, « la rambarde dépasse et
    // il y a un arbre dessus ») : des marches pleines, posées dans la pente (la ligne de marche passe au milieu de chacune) ;
    // de chaque côté un muret de pierre en pente (sode-ishi) et son chaperon, une borne en haut et en bas ; une main
    // courante de bois sur le muret, seulement le long des marches ; pas d'arbre à moins de 4,5 m (DESCENTE, sansArbre)
    {
      const [[x0, z0, y0], [x1, z1, y1]] = DESCENTE, n = 38, L = Math.hypot(x1 - x0, z1 - z0), giron = L / n, monte = (y0 - y1) / n;
      const ux = (x1 - x0) / L, uz = (z1 - z0) / L, ry = Math.atan2(ux, uz), nx = uz, nz = -ux;
      const ici = (s, w, y) => [x0 + ux * s + nx * w, y, z0 + uz * s + nz * w];
      for (let i = 0; i < n; i++) {
        // (le dessus de la marche i, un demi-pas sous la ligne à son début ; une sur deux un rien plus large : leurs faces
        // de côté ne sont pas dans le même plan)
        // (leurs côtés dans les murets)
        const sc = (i + 0.5) * giron, yT = y0 - monte * (i + 0.5), w = 1.56 + (i % 2) * 0.012, hb = monte + 0.95;
        const [cx, , cz] = ici(sc, 0, 0);
        a.boite(w, hb, giron + 0.02, i % 3 ? P.pierre : P.pierreFonce, { x: cx, y: yT - hb / 2, z: cz, ry });
      }
      // les dalles du haut et du bas (le sol passe dessous), où l'on arrive
      for (const [s0, s1, yd] of [[-1.1, 0.02, y0 + 0.05], [L - 0.02, L + 1.0, y1 + 0.07]]) {
        const [cx, , cz] = ici((s0 + s1) / 2, 0, 0);
        a.boite(2.0, 0.3, s1 - s0, '#b2ab9b', { x: cx, y: yd - 0.15, z: cz, ry });
        monde.chemin([ici(s0 - 0.02, 0, 0), ici(s1 + 0.02, 0, 0)].map(([px, , pz]) => [px, pz, yd]), 0.98, { sol: 'pierre' });
      }
      monde.chemin([[x0, z0, y0], [x1, z1, y1]], 0.8, { sol: 'pierre' });
      // les murets : un prisme en pente de chaque côté (le dessus 35 cm au-dessus de la ligne, le bas 70 cm dessous), leurs
      // bouts d'aplomb ; le chaperon, un peu plus large ; les bornes
      const muret = (w, e, dessus, dessous, c, s0 = -0.2, s1 = L + 0.2, fond = false) => {
        const pos = [], A = (s, ww, dy) => { const yl = y0 + (y1 - y0) * Math.min(1, Math.max(0, s / L)); return ici(s, ww, yl + dy); };
        const P8 = [A(s0, w - e / 2, -dessous), A(s0, w + e / 2, -dessous), A(s0, w + e / 2, dessus), A(s0, w - e / 2, dessus),
          A(s1, w - e / 2, -dessous), A(s1, w + e / 2, -dessous), A(s1, w + e / 2, dessus), A(s1, w - e / 2, dessus)];
        const q = (i, j, k, l, nn) => { triangle(pos, P8[i], P8[j], P8[k], nn); triangle(pos, P8[i], P8[k], P8[l], nn); };
        q(3, 2, 6, 7, [0, 1, 0]); q(0, 3, 7, 4, [-nx, 0, -nz]); q(1, 5, 6, 2, [nx, 0, nz]); q(0, 1, 2, 3, [-ux, 0, -uz]); q(4, 7, 6, 5, [ux, 0, uz]);
        if (fond) q(0, 4, 5, 1, [0, -1, 0]);
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        a.piece(g, c, { nuance: 0.05 });
      };
      for (const sg of [-1, 1]) {
        const w = sg * 0.92;
        muret(w, 0.3, 0.34, 1.45, P.pierre);
        muret(w + sg * 0.003, 0.38, 0.42, -0.31, P.pierreFonce, -0.24, L + 0.24, true);
        // les bornes, en haut et en bas
        for (const [sb, yb] of [[-0.35, y0], [L + 0.35, y1]]) { const [bx, , bz] = ici(sb, w, 0); a.boite(0.36, 0.9, 0.36, P.pierreFonce, { x: bx, y: yb + 0.3, z: bz, ry }); }
        // la main courante : des petits poteaux sur le chaperon, une barre, seulement le long des marches
        const H = 0.62;
        for (let k = 0; k <= 6; k++) { const sk = 0.35 + (k / 6) * (L - 0.7), [px, py, pz] = ici(sk, w, y0 + (y1 - y0) * sk / L + 0.42); a.boite(0.06, H, 0.06, P.boisFonce, { x: px, y: py + H / 2, z: pz, ry }); }
        a.baton(ici(0.35, w, y0 + (y1 - y0) * 0.35 / L + 0.42 + H), ici(L - 0.35, w, y0 + (y1 - y0) * (L - 0.35) / L + 0.42 + H), 0.032, P.bois, 6);
        // (le muret arrête : on reste sur les marches ; et les bornes)
        const [ax, , az] = ici(-0.6, sg * 0.86, 0), [bx, , bz] = ici(L + 0.6, sg * 0.86, 0);
        monde.mur(ax, az, bx, bz, 0.12);
      }
    }
    // le pont en arc, de bois, au-dessus de la rivière (du sud au nord), ses garde-corps
    {
      const x = PONT_I.x, vs = surIwato(x, -118), zs = vs.cz + 5.0, zn = vs.cz - 4.7, ym = NIV_I + 1.45, yb = NIV_I + 0.58;
      const pts = [];
      for (let k = 0; k <= 12; k++) { const f = k / 12, z = zs + (zn - zs) * f, yk = yb + (ym - yb) * Math.sin(f * PI); pts.push([x, z, yk]); }
      for (let k = 0; k < 12; k++) {
        const [, za, ya] = pts[k], [, zb, yb2] = pts[k + 1];
        // (une sur deux un rien plus large : les bouts de deux planches qui se chevauchent ne sont pas dans le même plan)
        a.boite(1.6 + (k % 2) * 0.02, 0.12, Math.hypot(zb - za, yb2 - ya) + 0.03, k % 2 ? P.bois : P.bois2, { x, y: (ya + yb2) / 2 - 0.06, z: (za + zb) / 2, rx: Math.atan2(ya - yb2, za - zb) * -1 });
      }
      for (const s of [-1, 1]) {
        a.tube(pts.map(([px, pz, py]) => [px + s * 0.78, py - 0.2, pz]), 0.09, P.boisFonce, { cotes: 6, pas: 24 });
        a.tube(pts.map(([px, pz, py]) => [px + s * 0.78, py + 0.85, pz]), 0.045, P.bois, { cotes: 6, pas: 24 });
        for (let k = 0; k <= 12; k += 2) a.boite(0.07, 0.85, 0.07, P.boisFonce, { x: x + s * 0.78, y: pts[k][2] + 0.42, z: pts[k][1] });
        monde.mur(x + s * 0.78, vs.cz + 3.05, x + s * 0.78, vs.cz - 3.05, 0.12);
      }
      monde.chemin(pts, 0.7, { sol: 'bois' });
      PONT_I.zs = zs; PONT_I.zn = zn;
    }
    // la grotte des dieux (天安河原) : une grande voûte creusée au pied de la falaise du nord, ouverte vers la rivière. La paroi
    // de rocher autour de l'ouverture (une demi-ellipse), la voûte dedans, son sol couvert de petits tas de pierres (les
    // vœux des visiteurs), le torii de bois brut à l'entrée, la corde sacrée tendue sous la voûte, des lanternes, au fond un
    // petit sanctuaire de pierre
    {
      const { x: X, z: Z, rx, rz, h } = YASU, sol = NIV_I + 0.7, haut = terrain(X, Z - rz - 3) + 0.4;
      const pos = [], couleurs = [];
      const roche = (i, j) => (hasard(i * 1.3, j * 0.7) < 0.22 ? P.basalteFonce : hasard(j * 1.9, i) < 0.28 ? P.mousseRocheFonce : P.basalte);
      // la voûte : une demi-ellipsoïde derrière l'ouverture (t de −90° à 90° autour du fond), vue de dedans ; un peu bosselée
      const N1 = 28, N2 = 11;
      const pt = (i, j) => {
        const t = -PI / 2 + (i / N1) * PI, p = (j / N2) * (PI / 2);
        const b = j === 0 || i === 0 || i === N1 ? 1 : 1 + 0.06 * Math.sin(t * 6 + j * 1.3) + 0.04 * Math.sin(p * 11 + i * 0.9);
        return [X + Math.sin(t) * rx * Math.cos(p) * b, sol - 0.6 + (h + 0.6) * Math.sin(p) * b, Z - Math.cos(t) * rz * Math.cos(p) * b];
      };
      for (let i = 0; i < N1; i++) for (let j = 0; j < N2; j++) {
        const A = pt(i, j), Bp = pt(i + 1, j), Cp = pt(i + 1, j + 1), D = pt(i, j + 1), m = [(A[0] + Cp[0]) / 2, (A[1] + Cp[1]) / 2, (A[2] + Cp[2]) / 2];
        const n = [X - m[0], sol + 1.5 - m[1], Z - 1.5 - m[2]], c = roche(i, j);
        triangle(pos, A, Bp, Cp, n); triangle(pos, A, Cp, D, n);
        couleurs.push(c, c);
      }
      // la paroi autour de l'ouverture : de l'arc de la demi-ellipse jusqu'au bord d'un rectangle (la falaise), tournée vers
      // la rivière (le sud) ; ses deux côtés passent derrière les colonnes voisines
      const W = rx + 0.45, bas = sol - 1.6, K = 30;
      const bordRect = (f) => {
        // le tour du rectangle : en bas à droite, le côté droit, le haut, le côté gauche
        const L1 = haut - bas, L2 = 2 * W, tot = 2 * L1 + L2, s = f * tot;
        if (s < L1) return [X + W, bas + s];
        if (s < L1 + L2) return [X + W - (s - L1), haut];
        return [X - W, haut - (s - L1 - L2)];
      };
      for (let k = 0; k < K; k++) {
        const u0 = (k / K) * PI, u1 = ((k + 1) / K) * PI;
        const A = [X + Math.cos(u0) * rx, sol - 0.6 + Math.sin(u0) * (h + 0.6), Z], Bp = [X + Math.cos(u1) * rx, sol - 0.6 + Math.sin(u1) * (h + 0.6), Z];
        const [ex0, ey0] = bordRect(k / K), [ex1, ey1] = bordRect((k + 1) / K);
        const c = roche(k, 40);
        triangle(pos, A, Bp, [ex1, ey1, Z], [0, 0, 1]); triangle(pos, A, [ex1, ey1, Z], [ex0, ey0, Z], [0, 0, 1]);
        couleurs.push(c, c);
      }
      // l'épaisseur de la lèvre : une bande sous l'arc, de la paroi à la voûte
      for (let k = 0; k < K; k++) {
        const u0 = (k / K) * PI, u1 = ((k + 1) / K) * PI;
        const A = [X + Math.cos(u0) * rx, sol - 0.6 + Math.sin(u0) * (h + 0.6), Z + 0.02], Bp = [X + Math.cos(u1) * rx, sol - 0.6 + Math.sin(u1) * (h + 0.6), Z + 0.02];
        const A2 = [A[0] * 0.97 + X * 0.03, A[1] - 0.25, Z - 0.5], B2 = [Bp[0] * 0.97 + X * 0.03, Bp[1] - 0.25, Z - 0.5];
        triangle(pos, A, Bp, B2, [0, -1, 0.3]); triangle(pos, A, B2, A2, [0, -1, 0.3]);
        couleurs.push(P.basalteFonce, P.basalteFonce);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      a.piece(g, P.basalte, { couleurs, nuance: 0.08 });
      // des rochers moussus au pied de la paroi, des fougères au-dessus de l'ouverture
      for (let k = 0; k < 8; k++) {
        const s = k % 2 ? 1 : -1, x = X + s * (rx - 0.6 + 0.5 * hasard(k, 1)), z = Z - 0.5 - 1.6 * hasard(k, 2);
        a.rocher(x, sol, z, 0.45 + 0.35 * hasard(k, 3), k % 3 ? P.basalte : P.mousseRocheFonce);
      }
      for (let k = 0; k < 9; k++) a.houppe(0.5 + 0.3 * hasard(k, 5), k % 2 ? P.jungleFonce : P.fougere, { x: X - rx + 1 + k * (2 * rx - 2) / 8, y: sol + h + 0.4 + 0.6 * hasard(k, 6), z: Z + 0.15, sy: 0.6, sorte: 'persistant' }, 1);
      // le torii de bois brut, à l'entrée ; la corde sacrée tendue sous la voûte, ses papiers
      const R = repere(X, Z - 1.4, 0);
      for (const s of [-1, 1]) a.cylindre(0.11, 0.12, 2.9, 8, P.boisBrut, R(s * 1.2, sol + 1.45, 0));
      a.boite(3.1, 0.18, 0.2, P.boisBrut, R(0, sol + 2.9, 0)).boite(2.6, 0.12, 0.14, P.boisBrut, R(0, sol + 2.5, 0));
      for (const s of [-1, 1]) monde.cercle(R(s * 1.2, 0, 0).x, R(s * 1.2, 0, 0).z, 0.3);
      {
        const A = [X - rx * 0.78, sol + h * 0.62, Z - 0.6], B2 = [X + rx * 0.78, sol + h * 0.62, Z - 0.6], Mi = [X, sol + h * 0.62 - 0.55, Z - 0.6];
        a.shimenawa([A, Mi, B2], 0.07, [-0.45, -0.15, 0.15, 0.45].map((f) => [X + f * rx * 1.4, sol + h * 0.62 - 0.5 - 0.12 * Math.cos(f * PI), Z - 0.6]));
      }
      // les petits tas de pierres : partout sur le sol, sauf le chemin du milieu (de l'entrée au petit sanctuaire)
      const TONS = ['#6a6460', '#7a7470', '#5a5450', '#8a847a', '#4e4a46'];
      const SANCTUAIRE_Y = [X - 1.2, Z - rz + 1.6];
      let n = 0;
      for (let i = 0; i < 700 && n < 230; i++) {
        const u = hasard(i, 1.3) * 2 - 1, v = -hasard(i, 2.7);
        if (u * u + v * v > 0.8) continue;
        const x = X + u * rx, z = Z + v * rz;
        if (surLaLigne([[X, Z + 0.5], SANCTUAIRE_Y], x, z).d < 1.0 || Math.abs(x - X) < 1.7 && z > Z - 2.4) continue;
        const etages = 2 + Math.floor(hasard(i, 4.1) * 4);
        let yy = terrain(x, z) + 0.03 - 0.035;
        for (let k = 0; k < etages; k++) {
          const r = (0.2 - k * 0.032) * (0.8 + 0.4 * hasard(i + k, 5.3));
          // (chaque pierre tournée à sa façon : celles du bas étaient toutes tournées pareil, et deux tas voisins avaient des
          // faces dans le même plan)
          a.piece(new THREE.IcosahedronGeometry(r, 0), TONS[(i + k) % 5], { x: x + (hasard(i, k) - 0.5) * 0.05, y: yy + r * 0.45, z: z + (hasard(k, i) - 0.5) * 0.05, sy: 0.5, ry: hasard(i * 3.1 + k, 2) * 3, trait: false, nuance: 0.08 });
          yy += r * 0.82;
        }
        n++;
      }
      // le petit sanctuaire de pierre, au fond, et deux lanternes
      a.boite(1.0, 0.9, 0.8, P.pierre, { x: SANCTUAIRE_Y[0], y: sol + 0.45, z: SANCTUAIRE_Y[1] }).pignon(1.3, 0.4, 1.1, P.pierreFonce, { x: SANCTUAIRE_Y[0], y: sol + 0.9, z: SANCTUAIRE_Y[1] });
      monde.cercle(SANCTUAIRE_Y[0], SANCTUAIRE_Y[1], 0.8);
      lanterne(a, X + 2.6, Z - 2.0, sol);
      lanterne(a, X - 3.0, Z - 2.6, sol);
      // (le dedans, pour la caméra : sous la voûte, elle se rapproche)
      monde.toit(X - rx, X + rx, Z - rz, Z - 0.4, sol + h - 0.8, sol + h + 4);
      TAS.x = X + 1.6; TAS.z = Z - 3.4; TAS.sol = terrain(TAS.x, TAS.z) + 0.01;
      ENTREE_YASU.x = X; ENTREE_YASU.z = Z - 1.0;
    }
    // la grotte d'Amaterasu (天岩戸), de l'autre côté de la rivière, refaite le 2026-10-25 : dans la falaise de basalte, une
    // paroi rocheuse bosselée, moussue, aux traînées sombres, percée d'une ouverture en arc irrégulier ; son épaisseur ; dedans,
    // le noir (peu profonde : un mètre derrière le pied de la falaise, le sol remonte, il la remplissait) ; au-dessus de
    // l'ouverture, la corde sacrée, ses papiers et ses touffes de paille. La porte de pierre qui la ferme est à part (porte() :
    // elle roule de côté au secret)
    {
      const X = GROTTE.x, Z = GROTTE.z, base = NIV_I + 0.15, W = 3.4, bas = NIV_I - 1.4, haut = terrain(X, Z - 4) + 0.5;
      const pos = [], couleurs = [];
      // le contour de l'ouverture et le bord de la paroi, parcourus ensemble (s de 0 à 1) : le milieu du bas, vers la droite,
      // l'arc par le haut, vers la gauche, le milieu du bas
      const RX = 1.32, RY = 3.95, NC = 40;
      const contour = (u) => {
        if (u < 0.08) return [X + RX * (u / 0.08), base];
        if (u > 0.92) return [X - RX * ((1 - u) / 0.08), base];
        const t = ((u - 0.08) / 0.84) * PI, rx = RX * (1 + 0.06 * Math.sin(t * 5 + 1.3)), ry2 = RY * (1 + 0.04 * Math.sin(t * 7 + 0.4));
        return [X + Math.cos(t) * rx, base + Math.sin(t) ** 0.85 * ry2];
      };
      const L1 = haut - bas, L2 = 2 * W, tour = 2 * L1 + L2;
      const bord = (u) => {
        if (u < 0.08) return [X + W * (u / 0.08), bas];
        if (u > 0.92) return [X - W * ((1 - u) / 0.08), bas];
        const v = ((u - 0.08) / 0.84) * tour;
        if (v < L1) return [X + W, bas + v];
        if (v < L1 + L2) return [X + W - (v - L1), haut];
        return [X - W, haut - (v - L1 - L2)];
      };
      // (la paroi, en anneaux de l'ouverture jusqu'au bord ; bosselée et en colonnes ; son bord derrière les colonnes voisines)
      const NR = 6, anneau = (u, k) => {
        const f = (k / NR) ** 1.3, [ax, ay] = contour(u), [bx, by] = bord(u), px = ax + (bx - ax) * f, py = ay + (by - ay) * f;
        const bosse = 0.22 * (bruitDoux(px * 0.9, py * 0.9, 1) - 0.5) + 0.07 * Math.sin(px * 9.5) ** 2;
        return [px, py, Z + 0.06 + bosse * Math.sin(f * PI) * 1.2 - 0.32 * f * f];
      };
      const ton = (px, py) => {
        const b = bruitDoux(px * 1.4, py * 0.6, 1);
        if (py > base + 4.3 && b > 0.55) return b > 0.7 ? P.mousseRoche : P.mousseRocheFonce;
        if (py < base + 0.5) return P.basalteMouille;
        return Math.sin(px * 4.75) > 0.6 ? P.basalteFonce : b > 0.62 ? P.basalteClair : P.basalte;
      };
      for (let i = 0; i < NC; i++) for (let k = 0; k < NR; k++) {
        const A = anneau(i / NC, k), B2 = anneau((i + 1) / NC, k), C2 = anneau((i + 1) / NC, k + 1), D = anneau(i / NC, k + 1), c = ton((A[0] + C2[0]) / 2, (A[1] + C2[1]) / 2);
        triangle(pos, A, B2, C2, [0, 0, 1]); triangle(pos, A, C2, D, [0, 0, 1]);
        couleurs.push(c, c);
      }
      // l'épaisseur de l'ouverture : du contour jusqu'au bord de la grotte, un peu plus large, 55 cm plus loin dans la roche
      const levre = (u) => { const [cx, cy] = contour(u); return [X + (cx - X) * 1.06, base + (cy - base) * 1.03, Z - 0.5]; };
      for (let i = 0; i < NC; i++) {
        const u0 = i / NC, u1 = (i + 1) / NC;
        if (u1 <= 0.08 || u0 >= 0.92) continue;
        const A = anneau(u0, 0), B2 = anneau(u1, 0), C2 = levre(u1), D = levre(u0), m = [(A[0] + B2[0]) / 2, (A[1] + B2[1]) / 2];
        triangle(pos, A, B2, C2, [X - m[0], base + 1.6 - m[1], 0]); triangle(pos, A, C2, D, [X - m[0], base + 1.6 - m[1], 0]);
        couleurs.push('#3a3530', '#3a3530');
      }
      // la grotte : une demi-ellipsoïde qui s'enfonce dans le noir (de plus en plus sombre), et son sol
      const NG = 9, creux = (u, k) => {
        const w = (k / NG) * (PI / 2), [lx, ly] = levre(u);
        return [X + (lx - X) * Math.cos(w), base + (ly - base) * Math.cos(w) ** 0.8, Z - 0.5 - 0.32 * Math.sin(w)];
      };
      const NOIRS = ['#2e2a26', '#26221f', '#1f1c19', '#191714', '#141210', '#100e0c', '#0d0b0a', '#0b0a09', '#0a0908'];
      for (let i = 0; i < NC; i++) for (let k = 0; k < NG; k++) {
        const u0 = i / NC, u1 = (i + 1) / NC;
        if (u1 <= 0.08 || u0 >= 0.92) continue;
        const A = creux(u0, k), B2 = creux(u1, k), C2 = creux(u1, k + 1), D = creux(u0, k + 1), m = [(A[0] + C2[0]) / 2, (A[1] + C2[1]) / 2, (A[2] + C2[2]) / 2];
        const n = [X - m[0], base + 1.2 - m[1], Z + 0.4 - m[2]];
        triangle(pos, A, B2, C2, n); triangle(pos, A, C2, D, n);
        couleurs.push(NOIRS[k], NOIRS[k]);
      }
      for (let k = 0; k < 12; k++) {
        const t0 = (k / 12) * PI, t1 = ((k + 1) / 12) * PI, rx = RX * 1.06, rz = 0.32;
        triangle(pos, [X, base + 0.01, Z - 0.5], [X + Math.cos(t0) * rx, base + 0.01, Z - 0.5 - Math.sin(t0) * rz], [X + Math.cos(t1) * rx, base + 0.01, Z - 0.5 - Math.sin(t1) * rz], [0, 1, 0]);
        couleurs.push('#16130f');
      }
      const gp = new THREE.BufferGeometry();
      gp.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      a.piece(gp, P.basalte, { couleurs, nuance: 0.07 });
      // le seuil : quelques blocs moussus devant l'ouverture, au ras de l'eau
      for (const [dx, r] of [[-1.9, 0.42], [-1.35, 0.3], [1.55, 0.36], [2.1, 0.46]]) a.rocher(X + dx, base - 0.05, Z + 0.45, r, P.basalteFonce, { sy: 0.6 });
      // la corde sacrée au-dessus de l'ouverture, ses papiers, ses touffes de paille
      const yc = base + RY + 0.35;
      a.shimenawa([[X - 1.9, yc + 0.25, Z + 0.22], [X - 0.9, yc - 0.12, Z + 0.34], [X, yc - 0.2, Z + 0.38], [X + 0.9, yc - 0.12, Z + 0.34], [X + 1.9, yc + 0.25, Z + 0.22]], 0.1, []);
      for (const dx of [-0.95, 0, 0.95]) shide(a, X + dx, yc - 0.27 + Math.abs(dx) * 0.07, Z + 0.46, 0, 2.2);
      for (const dx of [-1.45, -0.45, 0.45, 1.45]) touffePaille(a, X + dx, yc - 0.18 + Math.abs(dx) * 0.1, Z + 0.4, 0.42);
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Les arbres penchés sur la gorge, les plantes des parois
  // Au bord de la gorge, entre le garde-corps et le vide : des érables (rouges à l'automne : les photos de Takachiho), des
  // pins, des feuillus qui penchent au-dessus de l'eau ; sur les parois, des fougères et des buissons accrochés aux
  // rebords, des rideaux de lierre qui pendent du bord. Par morceaux (la caméra ne dessine que ceux qu'elle voit).
  const MORCEAUX_BORD = new Map();
  const morceauBord = (z) => { const k = Math.floor(z / 30); if (!MORCEAUX_BORD.has(k)) MORCEAUX_BORD.set(k, atelier()); return MORCEAUX_BORD.get(k); };
  {
    const ERABLE = [P.feuillage, P.herbeFonce, '#7aa848'], PERSISTANT = [P.jungleFonce, P.feuillage, '#4f7f42'];
    let i = 0;
    for (const cote of [-1, 1]) {
      for (let k = 0; k < AXE.length; k += 3) {
        const p = AXE[k];
        if (p[1] > 120 || p[1] < -162) continue;
        // (pas devant la cascade, l'escalier, les ponts, ni l'arrivée de la rivière Iwato)
        if (cote < 0 && (Math.abs(p[1] - CASCADE.z) < 4.5 || (p[1] > ESCALIER.z0 - 4 && p[1] < PONTON.z1 + 1) || Math.abs(p[1] + 121) < 5)) continue;
        if (Math.abs(p[1] - PONT_S.z) < 4 || Math.abs(p[1] - PONT_N.z) < 4) continue;
        // (ni devant le belvédère de la promenade : de là, on voit la cascade en face)
        if (cote > 0 && Math.abs(p[1] - VUE_CASCADE.z) < 8) continue;
        i++;
        const t = hasard(p[1] * 0.37, cote * 1.7);
        if (t > 0.42) continue;
        const ox = cote * p[3], oz = cote * p[4], d = p[2] + 0.7 + 1.1 * hasard(p[1], cote + 3);
        const x = p[0] + ox * d, z = p[1] + oz * d, y = terrain(x + ox * 1.5, z + oz * 1.5);
        const a = morceauBord(z), h = 6 + 4 * hasard(i, 2.2), virage = p[1] > 92 || p[1] < -146;
        // le tronc penche vers la gorge (la lumière vient de là) : un arbre posé un peu en arrière, dont le houppier avance
        // (aux virages des deux bouts, qu'on ne voit que de loin : plus simples)
        if (t < 0.26) a.arbreTouffu(x - ox * 0.4, z - oz * 0.4, h, ERABLE, { y, bas: y - 0.4, sorte: 'houppierErable', caduc: !virage, large: 1.25, graine: hasard(x, z), loin: virage });
        else a.arbreTouffu(x - ox * 0.3, z - oz * 0.3, h * 1.1, PERSISTANT, { y, bas: y - 0.4, sorte: 'persistant', large: 1.2, loin: virage });
      }
    }
    // les fougères et les buissons des parois, et les rideaux de lierre qui pendent du bord
    for (const cote of [-1, 1]) {
      for (let k = 0; k < AXE.length; k += 2) {
        const p = AXE[k];
        if (p[1] > 118 || p[1] < -160) continue;
        if (cote < 0 && (Math.abs(p[1] - CASCADE.z) < 2.6 || (p[1] > ESCALIER.z0 - 3 && p[1] < PONTON.z1 + 0.5))) continue;
        const ox = cote * p[3], oz = cote * p[4], fx = p[0] + ox * p[2], fz = p[1] + oz * p[2], a = morceauBord(fz), u = hasard(fx * 2.3, fz * 1.9);
        // (rien sous les ponts : les buissons du bord poussaient sur le tablier)
        if (sousTablier(fx, fz, 1.2) !== null) continue;
        const haut = terrain(fx + ox * 2.6, fz + oz * 2.6);
        // une touffe de fougères ou un petit buisson, accroché au rebord d'une colonne, à mi-hauteur (ou en haut)
        if (u < 0.35) {
          const yy = NIV + 2 + (haut - NIV - 2) * hasard(fz, fx * 0.7);
          a.houppe(0.45 + 0.4 * hasard(fx, fz), u < 0.15 ? P.mousseRocheFonce : P.jungleFonce, { x: fx - ox * 0.15, y: yy, z: fz - oz * 0.15, sy: 0.6, sorte: 'persistant' }, 0);
        }
        // le haut de la paroi : un liseré de buissons et d'herbes
        if (u > 0.55) a.houppe(0.55 + 0.35 * hasard(fz, fx), P.jungleFonce, { x: fx + ox * 0.8, y: haut + 0.25, z: fz + oz * 0.8, sy: 0.7, sorte: 'persistant' }, 0);
        // un rideau de lierre : quelques mètres de feuilles qui pendent du bord, collées à la paroi
        if (u > 0.9) {
          const l = 3 + 6 * hasard(fx * 3, fz), w = 0.5 + 0.5 * hasard(fz * 3, fx);
          a.piece(new THREE.PlaneGeometry(w, l, 1, 3), P.mousseRocheFonce, { x: fx - ox * 0.13, y: haut - l / 2 + 0.2, z: fz - oz * 0.13, ry: Math.atan2(-ox, -oz), trait: false, sorte: 'persistant', deformer: (x2, y2, z2) => [x2 + Math.sin(y2 * 2.1 + fx) * 0.08, y2, z2 + (y2 < -l * 0.3 ? (x2 > 0 ? 0.06 : -0.06) : 0)] });
        }
      }
    }
    for (const [k, a] of MORCEAUX_BORD) poser(a.fin(0, peinture), 0, 0, { y: 0, trait: k * 30 > -150 && k * 30 < 84 });
  }

  // ---------------------------------------------------------------- La forêt
  // Tout autour, la forêt des montagnes de Kyūshū : des plantations de cèdres (sugi) serrées, des chênes persistants, des
  // feuillus et des érables (plus nombreux près de la gorge). Près de là où l'on marche (à moins de 40 m), des arbres
  // détaillés ; plus loin, simplifiés ; au-delà de 150 m, sans trait d'encre. Par morceaux de 48 m (la caméra ne dessine
  // que ceux qu'elle voit).
  const FORET = new Map();
  const foret = (x, z, loin) => {
    const k = loin ? `L${Math.floor(Math.atan2(x + 30, z + 30) * 2)}` : `${Math.floor(x / 48)},${Math.floor(z / 48)}`;
    if (!FORET.has(k)) FORET.set(k, atelier());
    return FORET.get(k);
  };
  {
    const tire = (() => { let s = 4417; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();
    const pied = (x, z, r) => Math.min(terrain(x, z), terrain(x + r, z), terrain(x - r, z), terrain(x, z + r), terrain(x, z - r));
    const BATIS = [[CHIHO.x - 5.5, CHIHO.x + 5.5, CHIHO.z - 7, CHIHO.z + 7], [BOUTIQUE.x - 4.5, BOUTIQUE.x + 4.5, BOUTIQUE.z - 5, BOUTIQUE.z + 5]];
    /** Pas d'arbre : là où l'on marche (et un mètre autour), la gorge, l'étang, la vallée de l'Iwato, les bâtiments. */
    const sansArbre = (x, z) => {
      for (const [dx, dz] of [[0, 0], [1.6, 0], [-1.6, 0], [0, 1.6], [0, -1.6]]) if (dansLeCadre(x + dx, z + dz)) return true;
      const g = surGorge(x, z);
      if (g.d < g.w + 3.3) return true;
      if (Math.hypot(x - ETANG.x, z - ETANG.z) < ETANG.r + 3) return true;
      if (z < -106 && z > -150 && x < 4) { const v = surIwato(x, z); if (v.d < (v.cote > 0 ? PIED_NORD(x) + 2.6 : 7)) return true; }
      // (au-dessus de la grotte des dieux, le sol est creusé jusqu'à son sol : pas d'arbre qui flotterait sur la voûte)
      { const ex = (x - YASU.x) / (YASU.rx + 2), ez = (z - YASU.z) / (YASU.rz + 2); if (z < YASU.z + 1 && ex * ex + ez * ez < 1) return true; }
      for (const [x0, x1, z0, z1] of BATIS) if (x > x0 && x < x1 && z > z0 && z < z1) return true;
      if (vueGrotte(x, z)) return true;
      if (x > SANCT.x0 - 1 && x < SANCT.x1 + 1 && z > SANCT.z0 - 1 && z < SANCT.z1 + 1) return true;
      // (l'escalier de la rivière Iwato, et deux mètres au-delà de ses bouts : leur houppier le couvrait)
      { const [[ax, az], [bx, bz]] = DESCENTE, l = Math.hypot(bx - ax, bz - az), ex = (bx - ax) / l, ez = (bz - az) / l, u = (x - ax) * ex + (z - az) * ez; if (u > -2 && u < l + 2 && Math.abs((x - ax) * ez - (z - az) * ex) < 4.5) return true; }
      return false;
    };
    const cedre = (x, z, h, pres, loin) => {
      const a = foret(x, z, loin), y = terrain(x, z), rb = 0.2 + h * 0.015, bas = pied(x, z, rb + 0.15) - 0.25;
      if (pres) a.sugi(x, z, h, { y, bas, rTronc: rb, vert: P.cedre, vertFonce: P.cedreFonce, tronc: '#5e4030', loin: !pres });
      else {
        a.cylindre(0.15 + h * 0.012, rb, h * 0.3 + y - bas, 5, '#5a4030', { x, y: (y + h * 0.3 + bas) / 2, z });
        for (const [rr, hh, k] of [[0.24, 0.42, 0.42], [0.18, 0.36, 0.64], [0.11, 0.3, 0.86]]) a.cone(h * rr, h * hh, loin ? 5 : 7, k > 0.5 ? P.cedre : P.cedreFonce, { x, y: y + h * k - h * hh * 0.25, z, ry: k * 3 + x, sorte: 'conifere' });
      }
      noterArbre(x, z, 1.3 + h * 0.08);
      TRONCS.push([x, z]);
    };
    const feuillu = (x, z, h, couleurs, sorte, pres, loin, caduc) => {
      const a = foret(x, z, loin), y = terrain(x, z), bas = pied(x, z, 0.035 * h + 0.1) - 0.25, g = hasard(x * 0.7, z * 0.9);
      if (pres) a.arbreTouffu(x, z, h, couleurs, { y, bas, sorte, graine: g, caduc, large: 1.1 });
      else {
        const touffes = [[0, 0.72, 0, 0.38], [-0.24, 0.6, 0.1, 0.28], [0.24, 0.62, -0.08, 0.28]].map(([dx, dy, dz, rr]) => [x + dx * h, y + dy * h, z + dz * h, rr * h]);
        a.baton([x, bas, z], [x + 0.1, y + h * 0.5, z], 0.035 * h, '#7a5a40', 5);
        touffes.forEach(([tx, ty, tz, rr], k) => a.houppe(rr, couleurs[k % couleurs.length], { x: tx, y: ty, z: tz, sy: 0.85, sorte, graine: g }, 0));
      }
      noterArbre(x, z, 0.33 * h);
      TRONCS.push([x, z]);
    };
    // près du parcours : un semis serré (4,6 m), des arbres détaillés ; jusqu'aux virages des deux bouts de la gorge, mais
    // là, des arbres simplifiés (on les voit des ponts, de loin)
    for (let gx = -110; gx <= 52; gx += 4.6) {
      for (let gz = -173; gz <= 128; gz += 4.6) {
        const x = gx + (hasard(gx * 0.71, gz * 1.31) - 0.5) * 3.8, z = gz + (hasard(gz * 0.67, gx * 1.13) - 0.5) * 3.8;
        if (sansArbre(x, z)) continue;
        const t = hasard(x * 1.7, z * 2.3), g = surGorge(x, z), presGorge = g.d < g.w + 16;
        if (t < 0.1) continue;
        const pres = z > -150 && z < 92;
        // (aux virages, loin : dans les morceaux de la forêt lointaine, sans trait d'encre)
        if (presGorge ? t < 0.4 : t < 0.68) cedre(x, z, 13 + 9 * hasard(z, x), pres, !pres);
        else if (presGorge ? t < 0.72 : t < 0.86) feuillu(x, z, 6 + 5 * hasard(z * 0.3, x), [P.feuillage, P.herbeFonce, '#7aa848'], pres ? 'houppierErable' : 'houppier', pres, !pres, pres);
        else feuillu(x, z, 7 + 5 * hasard(z, x * 0.3), [P.jungleFonce, P.feuillage, '#4f7f42'], 'persistant', pres, !pres, false);
      }
    }
    // plus loin, jusqu'à 320 m : des arbres simplifiés, plus épars, sans trait au-delà de 150 m
    for (let i = 0; i < 2600; i++) {
      const x = -330 + tire() * 600, z = -360 + tire() * 600;
      if (x > -112 && x < 54 && z > -176 && z < 130) continue;
      if (sansArbre(x, z)) continue;
      const r = Math.hypot(x + 30, z + 30), loin = r > 150;
      if (r > 330) continue;
      const t = tire();
      if (t < 0.62) cedre(x, z, 14 + 9 * tire(), false, loin);
      else feuillu(x, z, 8 + 5 * tire(), t < 0.8 ? [P.feuillage, P.herbeFonce, P.jungle] : [P.jungleFonce, P.feuillage, '#4f7f42'], t < 0.8 ? 'houppier' : 'persistant', false, loin, false);
    }
    // la pente de la rivière Iwato, sous le sanctuaire : des fougères, des buissons (pas sur l'escalier ni la corniche)
    for (let x = -100; x < -8; x += 1.6) {
      for (let k = 0; k < 3; k++) {
        const v = surIwato(x, -120), d = 6 + k * 1.9 + hasard(x, k) * 1.2, z = v.cz + d;
        if (surLaLigne(DESCENTE, x, z).d < 2.1 || hasard(x * 3, k) < 0.3 || vueGrotte(x, z)) continue;
        const a = foret(x, z, false), y = terrain(x, z);
        a.houppe(0.5 + 0.45 * hasard(z, x), k % 2 ? P.jungleFonce : P.fougere, { x, y: y + 0.2, z, sy: 0.65, sorte: 'persistant' }, 1);
      }
    }
    for (const [k, a] of FORET) poser(a.fin(0, peinture), 0, 0, { y: 0, trait: !k.startsWith('L') });
  }

  // ---------------------------------------------------------------- La lisière : là où s'arrête le parcours
  // (comme à Gokayama : le long du bord de ce qu'on parcourt, du côté de la forêt, des touffes de sasa, des fougères, de
  // jeunes cèdres ; on voit où le chemin s'arrête, plutôt qu'un mur invisible dans l'herbe)
  {
    // (par morceaux de 30 m : la caméra ne dessine que ceux qu'elle voit, et leur trait d'encre seulement de près)
    const MORCEAUX = new Map(), morceau = (x, z) => { const k = `${Math.floor(x / 30)},${Math.floor(z / 30)}`; if (!MORCEAUX.has(k)) MORCEAUX.set(k, atelier()); return MORCEAUX.get(k); };
    // (ce qui est déjà planté le long du bord, par cases de 4 m : on ne plante que là où rien n'est à moins de 1,3 m)
    const PLANTES = new Map(), cle = (x, z) => `${Math.floor(x / 4)},${Math.floor(z / 4)}`;
    const planter = (x, z) => { const k = cle(x, z); if (!PLANTES.has(k)) PLANTES.set(k, []); PLANTES.get(k).push([x, z]); };
    const proche = (x, z, r) => { for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const [px, pz] of PLANTES.get(`${Math.floor(x / 4) + i},${Math.floor(z / 4) + j}`) || []) if ((px - x) ** 2 + (pz - z) ** 2 < r * r) return true; return false; };
    for (const [tx, tz] of TRONCS) if (tx > -112 && tx < 54 && tz > -152 && tz < 94) planter(tx, tz);
    for (let x = -108; x <= 50; x += 1.0) {
      for (let z = -148; z <= 90; z += 1.0) {
        if (dansLeCadre(x, z)) continue;
        let bord = false;
        for (const [dx, dz] of [[1.4, 0], [-1.4, 0], [0, 1.4], [0, -1.4]]) if (dansLeCadre(x + dx, z + dz)) { bord = true; break; }
        if (!bord) continue;
        const g = surGorge(x, z);
        if (g.d < g.w + 3.0) continue; // (la gorge : le garde-corps)
        if (z < -106 && x < 4) { const v = surIwato(x, z); if (v.d < 8) continue; }
        if (vueGrotte(x, z)) continue;
        if (Math.hypot(x - ETANG.x, z - ETANG.z) < ETANG.r + 1.6) continue;
        if (proche(x, z, 1.3)) continue;
        const u = hasard(x * 1.9, z * 2.3);
        const y = terrain(x, z), a = morceau(x, z);
        planter(x, z);
        if (u < 0.72) a.houppe(0.6 + 0.4 * hasard(z, x), u < 0.4 ? '#4f7a3c' : P.jungleFonce, { x, y: y + 0.25, z, sy: 0.72, sorte: 'persistant' }, u < 0.55 ? 1 : 0);
        else a.sugi(x, z, 3 + 2.5 * hasard(x, z), { y, bas: y - 0.2, loin: true, vert: P.cedre, vertFonce: P.cedreFonce, tronc: '#5e4030' });
      }
    }
    for (const a of MORCEAUX.values()) poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Les barques : celle qu'on loue, celles des promeneurs
  // (la coque et les rames de la barque du joueur, que le moteur anime : balade.js, piloter)
  const ICI = (lx, ly, lz, o = {}) => ({ ...o, x: lx, y: ly, z: lz });
  const tourner = (a, b, f) => { const d = ((b - a + PI) % (2 * PI) + 2 * PI) % (2 * PI) - PI; return a + d * Math.min(1, f); };
  const rameDe = (a, s) => {
    // une rame : la poignée vers le milieu de la barque, le manche qui sort par le tolet et descend vers l'eau, la pelle
    a.baton([-s * 0.5, 0.05, 0], [s * 1.25, -0.4, 0], 0.028, P.bois, 6)
      .boite(0.42, 0.03, 0.17, P.bois2, { x: s * 1.45, y: -0.46, z: 0, rz: s * 0.34 });
    return a;
  };
  const QUAI = (() => { const [px] = piedParoi(-1, 46.6); return { x: px + PONTON.l + 0.95, z: 46.6, cap: PI, ponton: px + 2.4 }; })();
  // les barques amarrées du décor (des obstacles pour la nôtre) et celles des promeneurs (qui rament dans le bassin)
  const AMARREES = [50.2, 53.5, 56.6].map((z) => [QUAI.x, z]);
  const promeneurs = (() => {
    const objet = new THREE.Group(), liste = [];
    const TENUES = [
      [{ taille: 1.0, peau: P.peau, cheveux: '#3a2a20', coiffure: 'court', haut: '#5a7a9a', manches: 'courtes', bas: { sorte: 'pantalon', c: '#3a3a42' }, chaussures: P.blanc, semelle: '#3a3236', pose: 'ramer' },
        { taille: 0.96, peau: '#f2c9a8', cheveux: '#4a3428', coiffure: 'queue', chapeau: { sorte: 'soleil', c: '#f2e6c4' }, haut: '#e8a8b8', manches: 'courtes', bas: { sorte: 'jupe', c: '#5a6a8a' }, chaussures: '#f4f0e6', semelle: '#3a3236' }],
      [{ taille: 1.02, peau: '#f0c8a6', cheveux: '#d8b878', coiffure: 'court', haut: '#e8913a', manches: 'courtes', bas: { sorte: 'short', c: '#3d5a8f' }, chaussures: P.blanc, semelle: '#3a3236', pose: 'ramer' },
        { taille: 0.7, peau: P.peau, cheveux: '#2a2420', coiffure: 'court', chapeau: { sorte: 'casquette', c: '#e8452e', c2: '#ffffff' }, haut: '#f2c443', manches: 'courtes', bas: { sorte: 'short', c: '#3d5a8f' }, chaussures: P.blanc, semelle: '#3a3236' }],
    ];
    const BOUCLES = [{ cx: 2.4, cz: 26, rx: 3.6, rz: 8.5, sens: 1, v: 0.75 }, { cx: 2.2, cz: -2.5, rx: 2.4, rz: 6.2, sens: -1, v: 0.6 }];
    BOUCLES.forEach((bo, i) => {
      const g = new THREE.Group(), coque = new THREE.Group();
      coque.add(ctx.maillage(barque(atelier(), ICI).fin(0, true)));
      const rames = [-1, 1].map((s) => { const p = new THREE.Group(); p.position.set(s * 0.6, 0.36, 0.05); p.add(ctx.maillage(rameDe(atelier(), s).fin(0, false))); coque.add(p); return p; });
      g.add(coque);
      const gens = TENUES[i].map((T, k) => {
        const q = creerPersonnage(ctx.perso || ctx, T);
        q.asseoir(true);
        q.objet.position.set(0, 0.22 - 0.38, k ? 0.85 : 0.05);
        q.objet.rotation.y = k ? 0 : PI;
        coque.add(q.objet);
        return q;
      });
      objet.add(g);
      // (leurs traits d'encre : le second maillage de chaque morceau ; loin de la caméra, on ne les dessine plus)
      const traits = [];
      g.traverse((o) => { if (o.isMesh && o.parent?.children.length === 2 && o.parent.children[1] === o && o.parent.children[0].geometry === o.geometry) traits.push(o); });
      // (la phase du rameur : personnages.js, la pose « ramer » ; ses rames la suivent)
      const T0 = TENUES[i][0], dec = (T0.taille || 1) * 7.3 + (T0.haut?.length || 0);
      liste.push({ ...bo, g, coque, rames, gens, traits, dec, loin: false, t: i * 2.1, x: bo.cx, z: bo.cz, cap: 0, arret: 0 });
    });
    return {
      objet, liste,
      maj(dt, temps, c) {
        for (const b of liste) {
          // (loin de la caméra : plus de traits d'encre, une trentaine d'appels de dessin de moins ; très loin, plus de barque)
          const d = c.oeil ? Math.hypot(c.oeil.x - b.x, c.oeil.z - b.z) : 0, loin = d > 35;
          if (loin !== b.loin) { b.loin = loin; for (const t of b.traits) t.visible = !loin; }
          b.g.visible = d < 140;
          // il attend que la barque du joueur s'écarte ; sinon, il fait le tour de sa boucle
          const j = c.joueur, gene = Math.hypot(j.x - b.x, j.z - b.z) < 3.2 && j.y < NIV + 1;
          if (!gene) b.t += (b.sens * b.v * dt) / ((b.rx + b.rz) / 2);
          const x = b.cx + b.rx * Math.sin(b.t), z = b.cz + b.rz * Math.cos(b.t);
          const vx = b.rx * Math.cos(b.t) * b.sens, vz = -b.rz * Math.sin(b.t) * b.sens;
          b.x = x; b.z = z;
          b.cap = tourner(b.cap, Math.atan2(vx, vz), dt * 2);
          b.g.position.set(x, NIV - 0.03 + 0.025 * Math.sin(temps * 1.6 + b.cx), z);
          const p0 = (temps + b.cx) * 2.6 + b.dec, ph = p0 + 0.35 * Math.sin(p0);
          b.g.rotation.set(0.01 * Math.sin(temps * 1.2 + b.cz) - (gene ? 0 : 0.025 * Math.max(0, Math.cos(ph))), b.cap, 0.012 * Math.sin(temps * 1.0), 'YXZ');
          b.rames.forEach((r, k) => { const s = k ? 1 : -1; r.rotation.set(0, s * (0.15 + (gene ? 0.05 : 0.45) * Math.sin(ph)), s * (0.12 + (gene ? 0.1 : 0.2 * Math.max(0, -Math.cos(ph)) - 0.05 * Math.max(0, Math.cos(ph))))); });
          for (const q of b.gens) q.animer(dt, 0, temps + b.cx);
        }
        return [];
      },
    };
  })();
  animes.push({ objet: promeneurs.objet, maj: (dt, temps, c) => promeneurs.maj(dt, temps, c) });
  /** L'eau où la barque peut aller (avec une marge) : entre les parois, du ponton jusqu'aux rapides du « saut de la lance ». */
  // (la paroi ouest, derrière l'escalier et le ponton : des blocs pour la caméra, qui s'arrête devant au lieu d'y entrer)
  for (let z = ESCALIER.z0 - 3; z < PONTON.z1 + 2; z += 2) {
    const [px] = piedParoi(-1, z + 1);
    monde.bloc(px - 8, px - 0.1, z, z + 2, NIV - 3, 1.5);
  }
  const navigable = (x, z, marge = 0) => {
    if (z > 60 || z < -38.5) return false;
    const g = surGorge(x, z);
    let lim = g.w - 0.1 - marge;
    if (g.cote < 0 && z > ESCALIER.z0 - 2.6 && z < ESCALIER.z1 + 0.4) lim = Math.min(lim, g.w - ESCALIER.l - 0.2 - marge);
    if (g.cote < 0 && z > PONTON.z0 - 0.4 && z < PONTON.z1 + 0.5) lim = Math.min(lim, g.w - PONTON.l - 0.15 - marge);
    return g.d < lim;
  };
  const barqueDuLieu = {
    niveau: NIV, quai: QUAI, debarque: [QUAI.ponton, QUAI.z, PI],
    coque: (a) => barque(a, ICI), rame: rameDe, tolet: [0.6, 0.36, 0.05], siege: 0.05, assise: 0.24, proue: 0.86,
    zone: navigable, courant: [0, 0.12],
    camera: (x, z) => { const g = surGorge(x, z); return g.d < g.w - 0.35; },
    obstacles: () => {
      const l = ROCHERS.slice();
      for (const [x, z] of AMARREES) l.push([x, z - 0.8, 0.62], [x, z + 0.8, 0.62]);
      for (const b of promeneurs.liste) { const s = Math.sin(b.cap), c = Math.cos(b.cap); l.push([b.x + s * 0.9, b.z + c * 0.9, 0.62], [b.x - s * 0.9, b.z - c * 0.9, 0.62]); }
      return l;
    },
    arrose: { x: CASCADE_PIED.x, z: CASCADE_PIED.z, r: 2.6 },
    async surCascade(jeu) {
      await jeu.dire(jeu.tx('sousCascade'));
      if (!jeu.aTampon('barque')) await jeu.tampon('barque');
      await jeu.dire(jeu.tx('sousCascadeCompagnon')[jeu.compagnon], 'compagnon');
    },
  };

  // ---------------------------------------------------------------- Une tache de lumière (les lueurs), les points lumineux
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
  const points = (n, taille, couleur, attenue = true) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3).setUsage(THREE.DynamicDrawUsage));
    const m = new THREE.Points(geo, new THREE.PointsMaterial({ size: taille, sizeAttenuation: attenue, vertexColors: true, color: couleur, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, map: tache, fog: false }));
    m.frustumCulled = false;
    return m;
  };

  // ---------------------------------------------------------------- Les carpes de l'étang (et un esturgeon)
  const carpes = (() => {
    const objet = new THREE.Group();
    const ROBES = [['#f4efe6', '#d8462a', null], ['#f4efe6', '#d8462a', '#2a2624'], ['#2a2624', '#d8462a', '#f4efe6'], ['#e8b84a', '#f2cf6a', null], ['#7f96a6', '#d8642a', null], ['#f0c43a', '#f6dc6a', null]];
    const yE = ETANG.eau, liste = [];
    for (let i = 0; i < 9; i++) {
      const esturgeon = i === 8, [c1, c2, c3] = esturgeon ? ['#6a6e6a', '#8a8e86', null] : ROBES[i % ROBES.length], k = 0.95 + 0.25 * hasard(i, 3.1);
      const robe = (x, y, z) => { const t = bruitDoux(x * 9 + i * 3, z * 9 - i, 1); return c3 && t > 0.72 ? c3 : t > 0.45 ? c2 : c1; };
      const corps = atelier().ovale(0.11, c1, { sx: 0.82, sy: 0.62, sz: esturgeon ? 3.6 : 2.4, teinte: robe }, 12)
        .ovale(0.075, c1, { z: esturgeon ? 0.36 : 0.22, sx: 0.95, sy: 0.8, sz: esturgeon ? 1.6 : 1.1, teinte: robe }, 8);
      if (esturgeon) for (let s = 0; s < 6; s++) corps.cone(0.02, 0.04, 4, '#d8d4c4', { z: -0.25 + s * 0.1, y: 0.07, trait: false });
      for (const s of [-1, 1]) corps.ovale(0.012, '#1e1a18', { x: s * 0.06, y: 0.02, z: esturgeon ? 0.45 : 0.27, trait: false }, 5);
      const queue = atelier().piece(new THREE.ConeGeometry(0.1, 0.2, 4), c1, { z: -0.1, rx: -PI / 2, sx: 0.12, teinte: robe });
      const g = new THREE.Group(), pivotQ = new THREE.Group();
      g.add(ctx.maillage(corps.fin(0, false), false, false));
      pivotQ.position.z = esturgeon ? -0.38 : -0.25;
      pivotQ.add(ctx.maillage(queue.fin(0, false), false, false));
      g.add(pivotQ);
      g.scale.setScalar(1.8 * k);
      objet.add(g);
      const a = hasard(i, 2) * 2 * PI, r = 3 + 3 * hasard(i, 5);
      liste.push({ g, queue: pivotQ, x: ETANG.x + Math.sin(a) * r, z: ETANG.z + Math.cos(a) * r, cap: hasard(i, 9) * 2 * PI, v: 0.3, cible: null, prof: 0.07 + 0.1 * hasard(i, 7), ph: i * 1.3 });
    }
    const dansEtang = (x, z) => Math.hypot(x - ETANG.x, z - ETANG.z) < rayonEtang(Math.atan2(x - ETANG.x, z - ETANG.z)) * 0.78 && Math.hypot(x - ILOT.x, z - ILOT.z) > ILOT.r + 0.6;
    return {
      objet,
      maj(dt, temps, c) {
        const j = c.joueur, loin = Math.hypot(j.x - ETANG.x, j.z - ETANG.z) > 55;
        objet.visible = !loin;
        if (loin) return [];
        for (const k of liste) {
          if (!k.cible || Math.hypot(k.x - k.cible[0], k.z - k.cible[1]) < 0.5) {
            for (let e = 0; e < 8; e++) {
              const a = hasard(temps + e, k.ph) * 2 * PI, r = 1 + 6.5 * hasard(k.ph, temps + e), cx = ETANG.x + Math.sin(a) * r, cz = ETANG.z + Math.cos(a) * r;
              if (dansEtang(cx, cz)) { k.cible = [cx, cz]; break; }
            }
          }
          if (!k.cible) continue;
          const vise = Math.atan2(k.cible[0] - k.x, k.cible[1] - k.z);
          let d = vise - k.cap;
          d = Math.atan2(Math.sin(d), Math.cos(d));
          k.cap += d * Math.min(1, dt * 1.2);
          const nx = k.x + Math.sin(k.cap) * 0.35 * dt, nz = k.z + Math.cos(k.cap) * 0.35 * dt;
          if (dansEtang(nx, nz)) { k.x = nx; k.z = nz; } else k.cible = null;
          k.g.position.set(k.x, yE - k.prof + 0.01 * Math.sin(temps * 2 + k.ph), k.z);
          k.g.rotation.set(0, k.cap + 0.08 * Math.sin(temps * 3 + k.ph), 0);
          k.queue.rotation.y = Math.sin(temps * 4.5 + k.ph) * 0.35;
        }
        return [];
      },
    };
  })();
  animes.push({ objet: carpes.objet, maj: (dt, temps, c) => carpes.maj(dt, temps, c) });

  // ---------------------------------------------------------------- Les nouilles qui glissent (流しそうめん)
  // Des écheveaux de nouilles blanches lâchés en haut de la gouttière par la cuisinière : ils glissent avec l'eau jusqu'au
  // baquet du bas. Le jeu : les attraper avec ses baguettes quand ils passent devant soi (le bouton A, au bon moment).
  const SIEGE_SOMEN = { x: SOMEN.x + 0.85, z: SOMEN.z0 + 1.0 + 2 * 1.9 };
  const somen = (() => {
    const objet = new THREE.Group(), N = 4, L = SOMEN.z1 - SOMEN.z0;
    const ech = Array.from({ length: N }, () => {
      const a = atelier();
      for (let k = 0; k < 7; k++) a.baton([(hasard(k, 1) - 0.5) * 0.06, 0.012 + 0.008 * hasard(k, 2), -0.12], [(hasard(k, 3) - 0.5) * 0.06, 0.012 + 0.008 * hasard(k, 4), 0.12], 0.008, '#f8f6ee', 4, { trait: false });
      const m = ctx.maillage(a.fin(0, false), false, false);
      m.visible = false;
      objet.add(m);
      return { m, t: -1, attrape: false };
    });
    let actif = false, prochain = 0, lances = 0;
    return {
      objet,
      /** Le jeu commence (ou s'arrête) : des écheveaux lâchés toutes les deux secondes environ. */
      jouer(oui) { actif = oui; prochain = 0.6; lances = 0; for (const e of ech) { e.t = -1; e.m.visible = false; } },
      /** Combien d'écheveaux sont partis depuis le début. */
      get lances() { return lances; },
      /** Un écheveau passe-t-il devant le siège ? (vrai : il est attrapé, il disparaît dans le bol) */
      attraper() {
        for (const e of ech) {
          if (e.t < 0 || e.attrape) continue;
          const z = SOMEN.z0 + L * e.t;
          if (Math.abs(z - SIEGE_SOMEN.z) < 0.5) { e.attrape = true; e.t = -1; e.m.visible = false; return true; }
        }
        return false;
      },
      maj(dt) {
        if (!actif) return [];
        prochain -= dt;
        if (prochain <= 0) {
          const e = ech.find((q) => q.t < 0);
          if (e) { e.t = 0; e.attrape = false; e.m.visible = true; lances++; }
          prochain = 1.7 + 0.9 * Math.random();
        }
        for (const e of ech) {
          if (e.t < 0) continue;
          e.t += dt / 2.6;
          if (e.t >= 1) { e.t = -1; e.m.visible = false; continue; }
          // (juste au-dessus du filet d'eau, 3 cm sous le bord : on les voit glisser)
          const z = SOMEN.z0 + L * e.t, y = SOMEN.y0 + (SOMEN.y1 - SOMEN.y0) * e.t - 0.033;
          e.m.position.set(SOMEN.x + 0.01 * Math.sin(e.t * 30), y, z);
          e.m.rotation.set(0, 0.2 * Math.sin(e.t * 9), 0);
        }
        return [];
      },
    };
  })();
  animes.push({ objet: somen.objet, maj: (dt) => somen.maj(dt) });

  // ---------------------------------------------------------------- La grotte des dieux : les pierres qu'on pose
  const tas = (() => {
    const objet = new THREE.Group(), poses = [];
    return {
      objet,
      /** Une pierre de plus, posée par le voyageur sur un petit tas près du chemin (jusqu'à cinq). */
      ajouter() {
        const k = poses.length;
        if (k >= 5) return;
        const r = 0.17 - k * 0.022, y = TAS.sol - 0.02 + [0, 0.13, 0.24, 0.33, 0.41][k];
        const m = ctx.maillage(atelier().piece(new THREE.IcosahedronGeometry(r, 0), ['#6a6460', '#7a7470', '#5a5450', '#8a847a', '#4e4a46'][k], { sy: 0.5, ry: k * 1.3, nuance: 0.08 }).fin(0, false), false, false);
        m.position.set(TAS.x + 0.02 * k, y + r * 0.45, TAS.z);
        objet.add(m);
        poses.push(m);
      },
      maj() { return []; },
    };
  })();
  animes.push({ objet: tas.objet, maj: () => [] });
  {
    // le tas où l'on pose sa pierre : un socle de trois pierres plates, près du chemin
    const a = atelier();
    for (let k = 0; k < 2; k++) a.piece(new THREE.IcosahedronGeometry(0.24 - k * 0.04, 0), '#6a6460', { x: TAS.x, y: TAS.sol - 0.06 + k * 0.1, z: TAS.z, sy: 0.45, ry: k, nuance: 0.08 });
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Le secret : le miroir du soleil
  // Dans une fente entre deux colonnes de la paroi ouest, en amont de la cascade, juste au-dessus de l'eau, un vieux miroir
  // de bronze attrape le soleil : un éclat qui scintille (on le voit d'en haut, de la promenade, si l'on regarde bien ; de la
  // barque, on peut le prendre). Rapporté au lieu de prière, suspendu à l'arbre sacré face à la grotte d'Amaterasu : le ciel
  // s'assombrit comme une éclipse, les coqs chantent, le compagnon danse, la porte de pierre de la grotte s'écarte et la
  // lumière en jaillit ; le jour revient ; un koban sur la table des offrandes.
  const MIROIR = (() => { const [px, pz, ox, oz] = piedParoi(-1, -19.5); return { x: px - ox * 0.26, z: pz - oz * 0.26, y: NIV + 0.47, ox, oz, px, pz }; })();
  {
    // la pierre plate où il est posé, à fleur d'eau contre la paroi, de la mousse, une fougère qui le cache à moitié
    const a = atelier(), { px, pz, ox, oz } = MIROIR;
    a.rocher(px - ox * 0.5, NIV - 0.02, pz - oz * 0.5, 0.62, P.basalteFonce, { sy: 0.55 })
      .rocher(px - ox * 0.2, NIV + 0.1, pz - oz * 0.2 + 0.7, 0.4, P.basalteMouille, { sy: 0.7 })
      .houppe(0.32, P.mousseRocheFonce, { x: px - ox * 0.1, y: NIV + 0.45, z: pz - oz * 0.1 - 0.62, sy: 0.6, sorte: 'persistant' }, 0)
      .houppe(0.42, P.fougere, { x: px - ox * 0.05, y: NIV + 0.95, z: pz - oz * 0.05 + 0.55, sy: 0.75, sorte: 'persistant' }, 1);
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
    ROCHERS.push([px - ox * 0.5, pz - oz * 0.5, 0.85]);
  }
  let miroirPris = false;
  const miroir = (() => {
    const objet = new THREE.Group();
    // le miroir : un disque de bronze poli, son revers orné d'un soleil, son bouton ; posé de biais dans la fente
    const disque = (a) => a.cylindre(0.2, 0.2, 0.03, 20, '#b8a060', { rx: PI / 2 })
      .cylindre(0.17, 0.17, 0.034, 20, '#e8e4d8', { rx: PI / 2, z: 0.002, trait: false })
      .boule(0.04, '#8a7040', { z: -0.03 }, 1);
    const sol = ctx.maillage(disque(atelier()).fin(0, false), false, true);
    sol.position.set(MIROIR.x, MIROIR.y, MIROIR.z);
    // (tourné vers l'eau, penché en arrière contre la paroi : le lacet, puis l'inclinaison dans son propre repère)
    sol.rotation.set(-0.38, Math.atan2(-MIROIR.ox, -MIROIR.oz), 0, 'YXZ');
    objet.add(sol);
    // son éclat : un point de lumière de taille fixe à l'écran (visible de loin, de la promenade si l'on regarde bien),
    // qui palpite ; une lueur autour
    const eclat = points(1, 9, '#fff6d8', false), lueur = points(1, 0.7, '#ffe8a8');
    for (const p of [eclat, lueur]) { p.geometry.attributes.position.setXYZ(0, MIROIR.x - MIROIR.ox * 0.06, MIROIR.y + 0.05, MIROIR.z - MIROIR.oz * 0.06); objet.add(p); }
    // sur l'arbre sacré : le même miroir, suspendu à une branche par un cordon (caché tant qu'on ne l'a pas rapporté)
    const pendu = ctx.maillage(disque(atelier()).baton([0, 0.2, 0], [0, 0.55, 0], 0.012, '#e8452e', 4, { trait: false }).fin(0, false), false, true);
    pendu.position.set(SAKAKI.x + 0.3, 1.62, SAKAKI.z + 0.55);
    pendu.rotation.y = PI;
    pendu.visible = false;
    objet.add(pendu);
    // (sa lueur : petite, pour ne pas faire une tache blanche quand la caméra est tout près)
    const lueurPendu = points(1, 0.6, '#fff0c0');
    lueurPendu.geometry.attributes.position.setXYZ(0, pendu.position.x, pendu.position.y, pendu.position.z + 0.05);
    lueurPendu.visible = false;
    objet.add(lueurPendu);
    return {
      objet,
      prendre() { miroirPris = true; sol.visible = eclat.visible = lueur.visible = false; },
      accrocher() { pendu.visible = lueurPendu.visible = true; },
      maj(dt, temps, c) {
        const jour = c.nuit < 0.5, la = !miroirPris && !secretTrouve('miroir');
        sol.visible = la;
        eclat.visible = lueur.visible = la && jour;
        const p = 0.6 + 0.4 * Math.sin(temps * 3.1) * Math.sin(temps * 1.7 + 1);
        eclat.material.size = 6 + 5 * p;
        lueur.material.size = 0.45 + 0.3 * p;
        lueurPendu.material.size = 0.5 + 0.15 * Math.sin(temps * 2);
        pendu.visible = lueurPendu.visible = secretTrouve('miroir') || pendu.visible;
        pendu.rotation.y = PI + Math.sin(temps * 0.8) * 0.25;
        return [];
      },
    };
  })();
  animes.push({ objet: miroir.objet, maj: (dt, temps, c) => miroir.maj(dt, temps, c) });
  // la porte de pierre de la grotte d'Amaterasu, qui s'écarte ; la lumière qui jaillit ; le koban sur la table des offrandes
  const porte = (() => {
    const objet = new THREE.Group(), R = repere(GROTTE.x, GROTTE.z, PI), y0 = NIV_I + 0.3;
    // (la porte : un gros bloc de basalte arrondi, moussu en haut, qui couvre toute l'ouverture ; 45 cm devant la paroi)
    const ar = atelier();
    rocherSculpte(ar, 0, 0, 0, 1.0, { sx: 1.9, sy: 2.3, sz: 0.78, graine: 7.9, fond: -0.92, mousse: 0.62 });
    const roc = ctx.maillage(ar.fin(0, false));
    const q = R(0, y0 + 1.95, -0.45);
    roc.position.set(q.x, q.y, q.z);
    objet.add(roc);
    // la lumière qui jaillit : un éventail de rayons dorés (additifs) qui partent de la grotte, toujours tournés vers la
    // caméra autour de la verticale (ils restent droits, et devant la falaise : leur plan est à 2 m de l'entrée) ; ils
    // poussent d'un coup, chatoient, puis s'effacent. (Un cône de lumière, vu d'en face depuis le lieu de prière, ne se
    // voyait presque pas : on regardait dans son axe.)
    const CENTRE_RAIS = new THREE.Vector3(GROTTE.x, y0 + 2.5, GROTTE.z + 2.2), NB_RAIS = 15;
    const posR = [], raiR = [];
    for (let i = 0; i < NB_RAIS; i++) {
      // (de −100° à +100° autour de la verticale ; un rayon sur deux plus large, des longueurs de 6 à 12 m)
      const ang = ((i / (NB_RAIS - 1)) - 0.5) * 3.5 + (hasard(i, 7.7) - 0.5) * 0.14;
      const L = 6 + 6 * hasard(i, 3.3), demi = (i % 2 ? 0.045 : 0.075) * (0.8 + 0.4 * hasard(i, 5.1)), r0 = 0.45;
      const ax = Math.sin(ang), ay = Math.cos(ang), px = ay, py = -ax, g = hasard(i, 9.4);
      const coin = (r, w, sv, u) => { posR.push(ax * r + px * w, ay * r + py * w, 0); raiR.push(sv, u, g); };
      const w0 = 0.1, w1 = L * demi;
      // (deux triangles : la base, étroite, près de la grotte ; le bout, large)
      coin(r0, -w0, 0, -1); coin(L, -w1, 1, -1); coin(L, w1, 1, 1);
      coin(r0, -w0, 0, -1); coin(L, w1, 1, 1); coin(r0, w0, 0, 1);
    }
    const geoRais = new THREE.BufferGeometry();
    geoRais.setAttribute('position', new THREE.Float32BufferAttribute(posR, 3));
    geoRais.setAttribute('rai', new THREE.Float32BufferAttribute(raiR, 3));
    const rais = new THREE.Mesh(geoRais, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { force: { value: 0 }, pousse: { value: 0 }, temps: { value: 0 }, centre: { value: CENTRE_RAIS }, couleur: { value: new THREE.Color('#ffd27a') } },
      vertexShader: `uniform vec3 centre; uniform float pousse; uniform float temps;
        attribute vec3 rai; varying vec3 vRai;
        void main() {
          vRai = rai;
          // (le plan des rayons : face à la caméra, autour de la verticale)
          vec3 versCam = cameraPosition - centre; versCam.y = 0.0;
          vec3 droite = normalize(vec3(versCam.z, 0.0, -versCam.x) + vec3(1e-5, 0.0, 0.0));
          // (ils poussent depuis la grotte, et leur longueur respire un peu, chacun à son rythme)
          float l = mix(0.12, 1.0, pousse) * (0.93 + 0.07 * sin(temps * (1.1 + rai.z) + rai.z * 6.283));
          vec2 p = position.xy * mix(1.0, l, rai.x);
          vec3 w = centre + droite * p.x + vec3(0.0, p.y, 0.0);
          gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
        }`,
      fragmentShader: `uniform float force; uniform float temps; uniform vec3 couleur; varying vec3 vRai;
        void main() {
          float s = vRai.x, bord = 1.0 - smoothstep(0.2, 1.0, abs(vRai.y));
          float fondu = pow(1.0 - s, 1.5) * smoothstep(0.0, 0.06, s);
          float chatoie = 0.72 + 0.28 * sin(temps * (2.3 + 1.7 * vRai.z) + vRai.z * 6.283);
          // (plus blanc près de la grotte, plus doré au bout)
          vec3 c = mix(vec3(1.0, 0.97, 0.86), couleur, smoothstep(0.0, 0.5, s));
          gl_FragColor = vec4(c * force * bord * fondu * chatoie, 1.0);
        }`,
    }));
    rais.frustumCulled = false;
    rais.renderOrder = 3;
    rais.visible = false;
    // le cœur éblouissant, à l'entrée ; et le dedans de la grotte qui s'allume quand la pierre roule (une lueur chaude qui
    // reste ensuite : on voit de loin que la porte est ouverte)
    const coeur = points(1, 7, '#fff1c8');
    coeur.geometry.attributes.position.setXYZ(0, GROTTE.x, y0 + 2.4, GROTTE.z + 1.0);
    coeur.visible = false;
    const dedans = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 4.3), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { force: { value: 0 }, temps: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float force; uniform float temps; varying vec2 vUv;
        void main() {
          vec2 d = (vUv - vec2(0.5, 0.42)) * vec2(1.6, 1.15);
          float r = 1.0 - smoothstep(0.0, 0.62, length(d));
          float vacille = 0.9 + 0.1 * sin(temps * 3.1) * sin(temps * 1.7 + 1.3);
          gl_FragColor = vec4(mix(vec3(1.0, 0.62, 0.22), vec3(1.0, 0.93, 0.7), r) * r * force * vacille, 1.0);
        }`,
    }));
    // (dans la grotte, derrière l'ouverture : on ne la voit que par elle, quand la pierre a roulé)
    dedans.position.set(GROTTE.x, y0 + 1.95, GROTTE.z - 0.62);
    dedans.renderOrder = 2;
    dedans.visible = false;
    objet.add(rais, coeur, dedans);
    const koban = ctx.maillage(atelier().ovale(0.045, '#f2c84f', { sy: 0.15, sz: 1.4 }, 10).fin(0, false));
    koban.position.set(OFFRANDES.x, 0.8, OFFRANDES.z);
    koban.scale.setScalar(1.8);
    koban.visible = false;
    const brille = points(1, 0.3, '#fff2b0');
    brille.geometry.attributes.position.setXYZ(0, OFFRANDES.x, 0.9, OFFRANDES.z);
    brille.visible = false;
    objet.add(koban, brille);
    // (tOuvre : le temps depuis qu'elle s'ouvre ; Infinity : ouverte depuis toujours, le secret déjà trouvé ; −1 : fermée)
    let tOuvre = secretTrouve('miroir') ? Infinity : -1, eclat = 0, tJaillit = -1, kobanLa = false;
    return {
      objet,
      ouvrir() { tOuvre = 0; },
      /** La lumière jaillit de la grotte. */
      jaillir() { eclat = 1; tJaillit = 0; },
      montrerKoban() { kobanLa = true; },
      prendreKoban() { kobanLa = false; },
      get kobanVisible() { return kobanLa; },
      maj(dt, temps) {
        // la porte : un tremblement (l'anticipation : elle va céder), puis elle roule de côté, lentement d'abord, plus vite,
        // et ralentit (son poids) ; elle dépasse un peu sa place, revient et se pose
        let ouvre = 0, tremble = 0;
        if (tOuvre === Infinity) ouvre = 1;
        else if (tOuvre >= 0) {
          tOuvre += dt;
          tremble = tOuvre < 0.6 ? Math.sin(tOuvre * 60) * 0.03 * (tOuvre / 0.6) : 0;
          const u = Math.min(1, Math.max(0, (tOuvre - 0.5) / 1.9));
          ouvre = tOuvre < 2.4 ? u * u * (3 - 2 * u) : 1 + 0.035 * Math.exp(-(tOuvre - 2.4) * 3.5) * Math.sin((tOuvre - 2.4) * 14);
          if (tOuvre > 8) tOuvre = Infinity;
        }
        const p = R(-3.5 * ouvre + tremble, y0 + 1.95 - 0.35 * ouvre, -0.45 - 0.7 * ouvre);
        roc.position.set(p.x, p.y, p.z);
        roc.rotation.z = 1.1 * ouvre;
        // la lumière : les rayons poussent d'un coup (ease-out), éblouissent un instant (un éclat qui retombe), tiennent
        // quelques secondes et s'effacent ; le dedans s'allume avec la porte qui roule, flambe, puis garde une lueur
        eclat = Math.max(0, eclat - dt * 0.11);
        if (tJaillit >= 0) tJaillit += dt;
        const e = Math.min(1, eclat * 2.5), coup = tJaillit >= 0 ? Math.exp(-tJaillit * 2.2) : 0;
        const uR = rais.material.uniforms;
        uR.force.value = 1.7 * e * (1 + 0.8 * coup);
        uR.pousse.value = tJaillit >= 0 ? 1 - Math.exp(-tJaillit * 6) : 0;
        uR.temps.value = temps;
        rais.visible = eclat > 0.01;
        coeur.visible = eclat > 0.01;
        coeur.material.opacity = e * (0.85 + 0.15 * Math.sin(temps * 3.4));
        coeur.material.size = 5 + 4 * coup + 1.2 * e;
        const base = tOuvre === Infinity ? 0.35 : tOuvre >= 0 ? 0.7 * ouvre : 0;
        const uD = dedans.material.uniforms;
        uD.force.value = Math.max(base, 1.4 * e);
        uD.temps.value = temps;
        dedans.visible = uD.force.value > 0.005;
        koban.visible = brille.visible = kobanLa;
        koban.rotation.y = temps * 1.4;
        brille.material.size = 0.28 + 0.12 * Math.sin(temps * 5);
        return [];
      },
    };
  })();
  animes.push({ objet: porte.objet, maj: (dt, temps) => porte.maj(dt, temps) });

  // ---------------------------------------------------------------- Les gens
  const PEAU = P.peau, NOIR = '#2a2420';
  const passants = [
    { id: 'batelier', x: QUAI.ponton - 0.2, z: 54.2, cap: -PI / 2 + 0.6, tenue: { taille: 1.04, peau: '#e8bf98', cheveux: '#5a5650', coiffure: 'court', chapeau: { sorte: 'casquette', c: '#2f6fb0', c2: '#f4f0e6' }, haut: '#f4f0e6', manches: 'courtes', bas: { sorte: 'pantalon', c: '#2f3a5a' }, chaussures: '#3a3236', semelle: '#3a3236', yeux: 'plisses' } },
    { id: 'chiho', x: SOMEN.x - 0.15, z: SOMEN.z0 - 1.35, cap: 0, tenue: { taille: 0.95, peau: '#f0c8a6', cheveux: '#3a2a22', coiffure: 'chignon', chapeau: { sorte: 'foulard', c: '#2f4a7a' }, haut: '#f4f0e6', manches: 'longues', tablier: '#2f4a7a', bas: { sorte: 'pantalon', c: '#3a3a42' }, chaussures: '#3a3236', semelle: '#3a3236', yeux: 'plisses' } },
    { id: 'famille', x: SOMEN.x - 1.35, z: SOMEN.z0 + 1.6, cap: PI / 2, assis: terrain(SOMEN.x - 1.35, SOMEN.z0 + 1.6) + 0.43, tenue: { taille: 0.98, peau: '#f2c9a8', cheveux: '#4a3428', coiffure: 'queue', haut: '#e8a8b8', manches: 'courtes', bas: { sorte: 'jupe', c: '#5a6a8a' }, chaussures: '#f4f0e6', semelle: '#3a3236' } },
    { id: 'petit', x: SOMEN.x - 1.35, z: SOMEN.z0 + 2.7, cap: PI / 2, assis: terrain(SOMEN.x - 1.35, SOMEN.z0 + 2.7) + 0.43, tenue: { taille: 0.72, peau: PEAU, cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'casquette', c: '#5aa64a', c2: '#ffffff' }, haut: '#f2c443', manches: 'courtes', bas: { sorte: 'short', c: '#3d5a8f' }, chaussures: P.blanc, semelle: '#3a3236' } },
    // (dans le champ de thé, entre deux rangs : la cueilleuse. Toujours dessinée, comme les autres passants du dehors :
    // cachée hors du jardin, caméra à plus de 14 m (dedans), elle apparaissait d'un coup devant soi en arrivant ; elle
    // coûte 11 à 18 appels de dessin, 1 % de triangles, rien de mesurable au processeur ; 2026-10-25)
    { id: 'fermiere', x: -57, z: 30.5, cap: PI / 2 + 0.5, tenue: { taille: 0.94, peau: '#e8bf98', cheveux: '#5a5650', coiffure: 'chignon', chapeau: { sorte: 'sugegasa', c: '#d8c08a' }, haut: '#3f5f88', manches: 'longues', tablier: '#e8e0cc', bas: { sorte: 'pantalon', c: '#4a4a56' }, chaussures: '#3a3236', semelle: '#3a3236', yeux: 'plisses' } },
    { id: 'boutique', x: BOUTIQUE.x + 1.7, z: BOUTIQUE.z, cap: PI / 2, tenue: { taille: 0.96, peau: '#f0c8a6', cheveux: '#d8d4cc', coiffure: 'chignon', haut: '#8a5a7a', manches: 'longues', tablier: '#f2ead8', bas: { sorte: 'pantalon', c: '#4a4a56' }, chaussures: '#3a3236', semelle: '#3a3236', yeux: 'plisses' } },
    // (un pas derrière le garde-corps : il était dedans)
    { id: 'videaste', x: 13.7, z: VUE_CASCADE.z - 1.6, cap: -PI / 2 - 0.1, tenue: { taille: 1.1, peau: PEAU, cheveux: '#3a2a20', coiffure: 'court', chapeau: { sorte: 'bob', c: '#2f3440' }, haut: '#2f3440', manches: 'courtes', bas: { sorte: 'pantalon', c: '#c9b48a' }, chaussures: P.blanc, semelle: '#3a3236', appareil: true } },
    // (au sud de la pierre, tourné vers le chemin : il était dans la pierre)
    { id: 'guide', x: KIHACHI.x - 2.0, z: KIHACHI.z - 3.4, cap: -PI / 2 + 0.55, tenue: { taille: 1.0, peau: '#e8bf98', cheveux: '#d8d4cc', coiffure: 'court', chapeau: { sorte: 'casquette', c: '#3a7a6a', c2: '#f4f0e6' }, haut: '#3a7a6a', manches: 'longues', bas: { sorte: 'pantalon', c: '#4a4a52' }, chaussures: '#e8e4dc', semelle: '#e8e4dc', yeux: 'plisses' } },
    // (sa ronde sur la promenade : derrière le banc du belvédère, au nord de la pierre de Kihachi ; il passait au travers)
    { id: 'randonneur', x: 15.4, z: 30, cap: PI, ronde: [[15.4, 30], [16.8, 12.6], [16.2, -6], [16.8, 12.6]], vitesse: 1.2, attente: [3, 7], tenue: { taille: 1.06, peau: '#f0c8a6', cheveux: '#5a4030', coiffure: 'court', chapeau: { sorte: 'bob', c: '#7a8f6a' }, haut: '#c8452e', manches: 'longues', bas: { sorte: 'pantalon', c: '#4a4a40' }, chaussures: '#5a3a2a', semelle: '#3a3236', sac: { sorte: 'dos', c: '#3a5a7a', c2: '#2a3a5a' }, canne: true } },
    { id: 'photographe', x: 3.2, z: PONT_N.z + 0.5, cap: PI, tenue: { taille: 1.08, peau: '#f0c8a6', cheveux: '#d8b878', coiffure: 'queue', haut: '#5a7a9a', manches: 'courtes', bas: { sorte: 'short', c: '#c9b48a' }, chaussures: '#e8e4dc', semelle: '#e8e4dc', sac: { sorte: 'dos', c: '#2f3440', c2: '#1f2430' }, appareil: true } },
    { id: 'touriste', x: 3.0, z: PONT_S.z - 0.4, cap: PI, tenue: { taille: 1.04, peau: PEAU, cheveux: '#c8a46a', coiffure: 'queue', chapeau: { sorte: 'soleil', c: '#f2e6c4' }, haut: '#4a8aa8', manches: 'courtes', bas: { sorte: 'pantalon', c: '#e8e2d4' }, chaussures: P.blanc, semelle: '#3a3236', sac: { sorte: 'dos', c: '#e8913a', c2: '#99673f' } } },
    { id: 'eleve', x: ETANG.x + 8.6, z: ETANG.z + 4.2, cap: -PI / 2 - 0.4, tenue: { taille: 0.8, peau: PEAU, cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'ecolier', c: '#f2c443' }, haut: '#ffffff', manches: 'courtes', bas: { sorte: 'short', c: '#2f3a5a' }, chaussures: P.blanc, semelle: '#3a3236', sac: { sorte: 'randoseru', c: '#2f4a7a', c2: '#1f2a4a' } } },
    { id: 'grandpere', x: ETANG.x - 3, z: ETANG.z + 10.85, cap: PI, assis: terrain(ETANG.x - 3, ETANG.z + 10.8) + 0.48, tenue: { taille: 0.95, peau: '#e8bf98', cheveux: '#e8e4dc', coiffure: 'chauve', haut: '#7a8a6a', manches: 'longues', bas: { sorte: 'pantalon', c: '#4a4a40' }, chaussures: '#7a5a3a', semelle: '#3a3236', yeux: 'plisses', canne: true } },
    // (à côté du chien-lion de droite : il était dedans)
    { id: 'pretre', x: HAIDEN.x + 4.3, z: HAIDEN.z + 7.0, cap: -0.5, tenue: { taille: 1.04, peau: '#e8bf98', cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'eboshi', c: '#2a2a2a' }, haut: '#f4f0e6', manches: 'kimono', col: '#f4f0e6', bas: { sorte: 'hakama', c: '#5a7aa8', c2: '#4a6a98' }, chaussures: '#2a2a2a', semelle: '#f4f0e6' } },
    // (derrière son comptoir)
    { id: 'miko', x: JUYOSHO.x + 0.62, z: JUYOSHO.z + 0.2, cap: -PI / 2, tenue: { taille: 0.96, peau: '#f2c9a8', cheveux: NOIR, coiffure: 'queue', haut: '#f8f4ee', manches: 'kimono', col: '#f8f4ee', bas: { sorte: 'hakama', c: '#c8302c', c2: '#b8282a' }, chaussures: '#f4f0e6', semelle: '#f4f0e6' } },
    { id: 'kagura', x: KAGURA.x + 5.2, z: KAGURA.z - 4.6, cap: -PI / 2 + 0.7, tenue: { taille: 1.02, peau: '#e8bf98', cheveux: '#5a5650', coiffure: 'court', chapeau: { sorte: 'bandeau', c: '#f4f0e6' }, haut: '#2f4a7a', manches: 'kimono', col: '#f4f0e6', bas: { sorte: 'hakama', c: '#3a3a4a', c2: '#2a2a3a' }, chaussures: '#f4f0e6', semelle: '#c9b48a', yeux: 'plisses' } },
    // la nuit, sur la scène du kagura : Uzume (le masque d'Okame, les grelots), Tajikarao (le masque rouge, la crinière),
    // la flûte et le tambour
    { id: 'uzume', x: KAGURA.x + 0.6, z: KAGURA.z + 1.2, cap: PI / 2, quand: 'nuit', ronde: [[KAGURA.x + 0.6, KAGURA.z + 1.2], [KAGURA.x + 1.6, KAGURA.z - 0.6], [KAGURA.x + 0.2, KAGURA.z - 1.6], [KAGURA.x - 0.6, KAGURA.z + 0.2]], vitesse: 0.4, attente: [1.5, 3], etage: 1.05, tenue: { taille: 0.98, peau: '#f2c9a8', cheveux: NOIR, coiffure: 'kazura', masque: 'okame', haut: '#e8452e', manches: 'kimono', col: '#f4f0e6', bas: { sorte: 'hakama', c: '#f4f0e6', c2: '#e8e4dc' }, chaussures: '#f4f0e6', semelle: '#f4f0e6', pose: 'kagura', instrument: 'suzu' } },
    { id: 'tajikarao', x: KAGURA.x - 1.2, z: KAGURA.z - 2.2, cap: PI / 2 + 0.4, quand: 'nuit', etage: 1.05, tenue: { taille: 1.12, peau: '#d8553a', cheveux: '#f2c443', coiffure: 'criniere', masque: 'tajikarao', haut: '#f4f0e6', manches: 'kimono', col: '#c8452e', bas: { sorte: 'hakama', c: '#2f4a7a', c2: '#26406a' }, chaussures: '#f4f0e6', semelle: '#f4f0e6', pose: 'kagura' } },
    { id: 'fue', x: KAGURA.x - 2.2, z: KAGURA.z + 2.6, cap: PI / 2, quand: 'nuit', etage: 1.05, tenue: { taille: 1.0, peau: '#e8bf98', cheveux: NOIR, coiffure: 'court', haut: '#3a3a4a', manches: 'kimono', col: '#f4f0e6', bas: { sorte: 'hakama', c: '#3a3a4a' }, chaussures: '#f4f0e6', semelle: '#f4f0e6', pose: 'jouer', instrument: 'fue' } },
    { id: 'taikoK', x: KAGURA.x - 2.2, z: KAGURA.z + 1.3, cap: PI / 2, quand: 'nuit', etage: 1.05, tenue: { taille: 1.0, peau: '#e8bf98', cheveux: '#5a5650', coiffure: 'chauve', haut: '#3a3a4a', manches: 'kimono', col: '#f4f0e6', bas: { sorte: 'hakama', c: '#3a3a4a' }, chaussures: '#f4f0e6', semelle: '#f4f0e6', pose: 'jouer', instrument: 'taiko', yeux: 'plisses' } },
    // (la jeune femme regarde les cèdres, de l'autre côté de leur panneau : elle se tenait dedans ; et hors du chemin dont
    // on fait trois fois le tour)
    { id: 'couple', x: MEOTO.x + 4.7, z: MEOTO.z - 1.3, cap: -PI / 2 + 0.25, tenue: { taille: 0.98, peau: '#f2c9a8', cheveux: '#3a2a22', coiffure: 'queue', haut: '#f4c0a0', manches: 'longues', bas: { sorte: 'jupe', c: '#4a5a7a' }, chaussures: '#f4f0e6', semelle: '#3a3236' } },
    { id: 'vieille', x: TAS.x + 1.3, z: TAS.z + 0.8, cap: -PI / 2 - 0.3, tenue: { taille: 0.9, peau: '#f0c8a6', cheveux: '#d8d4cc', coiffure: 'chignon', chapeau: { sorte: 'foulard', c: '#8a5a6a' }, haut: '#6a7a8a', manches: 'longues', bas: { sorte: 'pantalon', c: '#4a4a56' }, chaussures: '#3a3236', semelle: '#3a3236', yeux: 'plisses', canne: true } },
  ];

  // ---------------------------------------------------------------- Ce qu'on peut faire (tout passe par `jeu`)
  const parler = (id) => ({ id, passant: id, verbe: 'parler', action: (jeu) => jeu.dire(jeu.txn(id), id) });
  const interactions = [
    {
      // le loueur de barques : une barque pour une demi-heure (le jour) ; on rame jusqu'à la cascade
      id: 'batelier', passant: 'batelier', verbe: 'parler',
      async action(jeu) {
        if (jeu.estNuit) { await jeu.dire(jeu.tx('batelierNuit'), 'batelier'); return; }
        const r = await jeu.choisir(jeu.tx(jeu.aTampon('barque') ? 'batelierEncore' : 'batelier'), [jeu.t('oui'), jeu.t('non')], 'batelier');
        if (r !== 0) { await jeu.dire(jeu.tx('batelierNon'), 'batelier'); return; }
        jeu.embarquer();
        await jeu.attendre(400);
        await jeu.dire(jeu.tx(jeu.tactile ? 'ramerTel' : 'ramerOrdi'));
      },
    },
    {
      // revenir au ponton : rendre la barque
      id: 'accoster', barque: true, x: QUAI.x, z: QUAI.z, rayon: 3.6, verbe: 'accoster',
      async action(jeu) {
        const r = await jeu.choisir(jeu.tx('accoster'), [jeu.t('oui'), jeu.t('non')]);
        if (r !== 0) return;
        jeu.debarquer();
        await jeu.dire(jeu.tx('accosterFin'), 'batelier');
      },
    },
    {
      // le miroir, dans la fente de la paroi : on le prend depuis la barque (le secret)
      id: 'miroir', barque: true, x: MIROIR.x - MIROIR.ox * 1.4, z: MIROIR.z - MIROIR.oz * 1.4, rayon: 2.6, haut: 2.2, verbe: 'prendre',
      si: () => !miroirPris && !secretTrouve('miroir'),
      async action(jeu) {
        jeu.cadrerDeCote(MIROIR.x, MIROIR.y, MIROIR.z, { distance: 3.2, haut: 1.1, champ: 50 });
        await jeu.attendre(500);
        jeu.geste('offrir');
        await jeu.attendre(700);
        miroir.prendre();
        jeu.donner('miroir');
        jeu.son('magie');
        jeu.geste(null);
        await jeu.dire(jeu.tx('miroirTrouve'));
        jeu.cadrer(null);
        await jeu.dire(jeu.tx('miroirCompagnon')[jeu.compagnon], 'compagnon');
      },
    },
    {
      // les nouilles qui glissent : on s'assoit au bambou, on les attrape au vol (le tampon)
      id: 'chiho', passant: 'chiho', verbe: 'parler',
      async action(jeu) {
        if (jeu.estNuit) { await jeu.dire(jeu.tx('chihoNuit'), 'chiho'); return; }
        const r = await jeu.choisir(jeu.tx(jeu.aTampon('somen') ? 'chihoEncore' : 'chiho'), [jeu.t('oui'), jeu.t('non')], 'chiho');
        if (r !== 0) { await jeu.dire(jeu.tx('chihoNon'), 'chiho'); return; }
        jeu.asseoir({ x: SIEGE_SOMEN.x, z: SIEGE_SOMEN.z, y: terrain(SIEGE_SOMEN.x, SIEGE_SOMEN.z) + 0.45, cap: -PI / 2 }, { lacet: -PI / 2 - 0.9, tangage: 0.45, distance: 3.6 });
        // (la caméra au bout de la rigole, basse : les nouilles arrivent vers elle ; le voyageur à droite, la famille à gauche)
        jeu.cadrer({ de: [SOMEN.x + 0.35, 1.4, SOMEN.z1 + 1.7], vers: [SOMEN.x + 0.3, 0.75, SIEGE_SOMEN.z - 1.2], champ: 50 });
        await jeu.attendre(500);
        await jeu.dire(jeu.tx('somenRegle'));
        // le jeu : attraper trois écheveaux (le bouton A au bon moment) ; au bout de neuf lâchés, on recommence
        let pris = 0, rates = 0;
        await new Promise((fini) => {
          somen.jouer(true);
          jeu.aide(jeu.tx('somenAide')(0));
          jeu.capterAppuis(() => {
            jeu.geste('baguettes');
            setTimeout(() => jeu.geste(null), 350);
            if (somen.attraper()) {
              pris++;
              jeu.son('slurp');
              jeu.aide(jeu.tx('somenAide')(pris));
              if (pris >= 3) { jeu.capterAppuis(null); somen.jouer(false); setTimeout(fini, 500); }
            } else { rates++; jeu.aide(jeu.tx('somenRate')(pris)); }
          });
          const veille = setInterval(() => {
            if (pris >= 3) { clearInterval(veille); return; }
            if (somen.lances >= 9) { clearInterval(veille); jeu.capterAppuis(null); somen.jouer(false); fini(); }
          }, 250);
        });
        jeu.aide(null);
        jeu.cadrer(null);
        jeu.asseoir(null);
        if (pris < 3) { await jeu.dire(jeu.tx('somenPerdu'), 'chiho'); return; }
        await jeu.dire(jeu.tx('somenGagne'), 'chiho');
        if (!jeu.aTampon('somen')) await jeu.tampon('somen');
        await jeu.dire(jeu.tx('somenCompagnon')[jeu.compagnon], 'compagnon');
      },
    },
    {
      // le maître du kagura : le jour, il fait venir le soir ; la nuit, le spectacle (le tampon), ou le retour du matin
      id: 'kagura', passant: 'kagura', verbe: 'parler',
      async action(jeu) {
        if (!jeu.estNuit) {
          const r = await jeu.choisir(jeu.tx('kaguraJour'), [jeu.t('oui'), jeu.t('non')], 'kagura');
          if (r !== 0) { await jeu.dire(jeu.tx('kaguraNon'), 'kagura'); return; }
          await jeu.nuit(true);
          await jeu.dire(jeu.tx('kaguraSoir'), 'kagura');
          return;
        }
        const r = await jeu.choisir(jeu.tx('kaguraNuit'), jeu.tx('kaguraChoix'), 'kagura');
        if (r === 1) { await jeu.nuit(false); await jeu.dire(jeu.tx('kaguraMatin'), 'kagura'); return; }
        if (r !== 0) return;
        // le spectacle : assis au premier rang, la caméra sur la scène ; Uzume danse, Tajikarao ouvre la porte de la grotte
        jeu.asseoir({ x: KAGURA.x + 7.4, z: KAGURA.z - 1.8, y: terrain(KAGURA.x + 7.4, KAGURA.z - 2.4) + 0.48, cap: -PI / 2 }, { lacet: PI / 2 + 0.3, tangage: 0.2, distance: 4.4 });
        jeu.cadrer({ de: [KAGURA.x + 8.6, 2.6, KAGURA.z + 2.6], vers: [KAGURA.x, 1.9, KAGURA.z - 0.4], champ: 50 });
        await jeu.attendre(600);
        await jeu.dire(jeu.tx('kaguraSpectacle'));
        jeu.eclat('#fff0c0');
        jeu.son('magie');
        await jeu.dire(jeu.tx('kaguraFin'));
        jeu.cadrer(null);
        jeu.asseoir(null);
        if (!jeu.aTampon('kagura')) await jeu.tampon('kagura');
        await jeu.dire(jeu.tx('kaguraCompagnon')[jeu.compagnon], 'compagnon');
      },
    },
    {
      // les cèdres mariés : en faire trois fois le tour avec son compagnon (le tampon)
      id: 'meoto', x: MEOTO.x, z: MEOTO.z + MEOTO.rz + 0.75, rayon: 1.9, haut: 1.6, verbe: 'tourner',
      async action(jeu) {
        const r = await jeu.choisir(jeu.tx('meoto'), [jeu.t('oui'), jeu.t('non')]);
        if (r !== 0) return;
        const pts = [];
        for (let k = 0; k <= 48 * 3; k++) {
          const t = (k / 48) * 2 * PI;
          pts.push([MEOTO.x - Math.sin(t) * (MEOTO.rx + 0.75), MEOTO.z + Math.cos(t) * (MEOTO.rz + 0.75)]);
        }
        jeu.cadrer({ de: [MEOTO.x + 7, 6.5, MEOTO.z + 7], vers: [MEOTO.x, 1.2, MEOTO.z], champ: 55 });
        await jeu.marcher(pts, 2.6);
        jeu.son('magie');
        jeu.cadrer(null);
        await jeu.dire(jeu.tx('meotoFin'));
        if (!jeu.aTampon('meoto')) await jeu.tampon('meoto');
        await jeu.dire(jeu.tx('meotoCompagnon')[jeu.compagnon], 'compagnon');
      },
    },
    {
      // la grotte des dieux : poser une pierre sur un petit tas, pour un vœu (le tampon)
      id: 'tas', x: TAS.x, z: TAS.z + 0.6, y: TAS.sol, rayon: 1.6, haut: 0.9, verbe: 'empiler',
      async action(jeu) {
        jeu.cadrerDeCote(TAS.x, TAS.sol + 0.2, TAS.z, { distance: 3.2, haut: 1.1 });
        await jeu.attendre(400);
        jeu.geste('offrir');
        await jeu.attendre(650);
        tas.ajouter();
        jeu.son('caillou');
        await jeu.attendre(500);
        jeu.geste(null);
        jeu.cadrer(null);
        await jeu.dire(jeu.tx(jeu.aTampon('ishi') ? 'tasEncore' : 'tas'));
        if (!jeu.aTampon('ishi')) { await jeu.tampon('ishi'); await jeu.dire(jeu.tx('tasCompagnon')[jeu.compagnon], 'compagnon'); }
      },
    },
    {
      // le lieu de prière face à la grotte : le jour, la légende ; avec le miroir, le suspendre à l'arbre sacré (le secret)
      id: 'yohai', x: YOHAI.x, z: YOHAI.z - 1.2, rayon: 2.2, haut: 1.8,
      verbe: (jeu) => (porte.kobanVisible ? 'prendre' : jeu.aDansSac('miroir') && !jeu.estNuit ? 'suspendre' : 'regarder'),
      async action(jeu) {
        if (porte.kobanVisible) {
          jeu.geste('offrir');
          await jeu.attendre(700);
          porte.prendreKoban();
          await jeu.attendre(300);
          jeu.geste(null);
          await jeu.dire(jeu.tx('legende'));
          await jeu.trouverSecret('miroir');
          return;
        }
        if (!jeu.aDansSac('miroir')) {
          jeu.cadrer({ de: [YOHAI.x + 1.2, 2.4, YOHAI.z + 1.6], vers: [GROTTE.x, NIV_I + 2.4, GROTTE.z], champ: 52 });
          await jeu.attendre(500);
          await jeu.dire(jeu.txn(secretTrouve('miroir') ? 'yohaiApres' : 'yohai'));
          jeu.cadrer(null);
          return;
        }
        if (jeu.estNuit) { await jeu.dire(jeu.tx('yohaiNuitMiroir')); return; }
        // le mythe rejoué : le miroir à l'arbre sacré, l'éclipse, les coqs, la danse, la porte qui s'écarte, la lumière
        jeu.placer(SAKAKI.x + 0.9, SAKAKI.z + 1.4, vers(SAKAKI.x + 0.9, SAKAKI.z + 1.4, SAKAKI.x, SAKAKI.z));
        jeu.cadrer({ de: [YOHAI.x + 3.4, 2.6, YOHAI.z + 2.8], vers: [SAKAKI.x, 1.4, SAKAKI.z - 1], champ: 55 });
        await jeu.attendre(500);
        jeu.geste('offrir');
        await jeu.attendre(800);
        jeu.prendre('miroir');
        miroir.accrocher();
        jeu.son('magie');
        jeu.geste(null);
        await jeu.dire(jeu.tx('accrocher'));
        await jeu.nuit(true);
        await jeu.dire(jeu.tx('eclipse'));
        for (const k of [0, 1, 2]) { jeu.son('coq'); await jeu.attendre(650 + k * 120); }
        await jeu.dire(jeu.tx('coqs'));
        jeu.danserCompagnon(true);
        await jeu.dire(jeu.tx('danse')[jeu.compagnon], 'compagnon');
        await jeu.attendre(1400);
        jeu.cadrer({ de: [YOHAI.x + 1.0, 2.8, YOHAI.z + 2.2], vers: [GROTTE.x, NIV_I + 2.6, GROTTE.z], champ: 52 });
        jeu.son('roc');
        porte.ouvrir();
        await jeu.attendre(700);
        // (des éclats de roche qui tombent devant la grotte quand la pierre se met à rouler)
        jeu.terre(GROTTE.x + 0.6, NIV_I + 2.2, GROTTE.z + 1.0, NIV_I + 0.35, 14);
        const [grondement, lumiere] = jeu.tx('lumiere');
        await Promise.all([jeu.dire([grondement]), jeu.attendre(1400)]);
        // la lumière jaillit dans le noir de l'éclipse ; un instant après, le jour revient
        porte.jaillir();
        jeu.eclat('#ffe7a0', 0.8);
        jeu.son('magie');
        await jeu.attendre(1900);
        jeu.nuit(false);
        jeu.danserCompagnon(false);
        await jeu.dire([lumiere]);
        porte.montrerKoban();
        jeu.cadrer({ de: [YOHAI.x + 2.4, 1.9, YOHAI.z + 1.6], vers: [OFFRANDES.x, 0.8, OFFRANDES.z], champ: 50 });
        await jeu.attendre(500);
        await jeu.dire(jeu.tx('kobanLueur'));
        jeu.cadrer(null);
        await jeu.dire(jeu.tx('miroirMerci')[jeu.compagnon], 'compagnon');
      },
    },
    {
      // la vidéo : le vidéaste de la promenade, qui filme la cascade
      id: 'videaste', passant: 'videaste', verbe: 'parler',
      async action(jeu) {
        const r = await jeu.choisir(jeu.tx('videaste'), [jeu.t('oui'), jeu.t('non')], 'videaste');
        if (r !== 0) { await jeu.dire(jeu.tx('videasteNon'), 'videaste'); return; }
        await jeu.video();
        await jeu.dire(jeu.tx('videasteApres'), 'videaste');
      },
    },
    {
      // le pavillon de prière : la cloche, deux saluts, deux battements de mains
      id: 'haiden', x: HAIDEN.x, z: HAIDEN.z + 5.6, rayon: 1.8, haut: 1.6, verbe: 'prier',
      async action(jeu) {
        jeu.son('cloche');
        jeu.geste('prier');
        await jeu.attendre(2150); jeu.son('claque');
        await jeu.attendre(470); jeu.son('claque');
        await jeu.attendre(1900);
        jeu.geste(null);
        await jeu.dire(jeu.txn('haiden'));
      },
    },
    { id: 'chozu', x: CHOZU.x, z: CHOZU.z + 1.4, rayon: 1.6, haut: 1.2, verbe: 'regarder', action: (jeu) => jeu.dire(jeu.tx('chozu')) },
    { id: 'shinboku', x: SHINBOKU.x - 1.4, z: SHINBOKU.z + 0.6, rayon: 1.8, verbe: 'toucher', action: (jeu) => jeu.dire(jeu.tx('shinboku')) },
    { id: 'statue', x: TAJIKARAO.x - 0.6, z: TAJIKARAO.z + 2.1, rayon: 1.9, haut: 2.6, verbe: 'regarder', action: (jeu) => jeu.dire(jeu.tx('statue')) },
    { id: 'kihachi', x: KIHACHI.x - 3.0, z: KIHACHI.z - 0.4, rayon: 2.0, haut: 2.2, verbe: 'regarder', action: (jeu) => jeu.dire(jeu.tx('kihachi')) },
    {
      // le belvédère de la cascade, sur la promenade : la plus belle vue
      id: 'vueCascade', x: 12.4, z: VUE_CASCADE.z + 0.6, rayon: 1.6, haut: 1.5, verbe: 'regarder',
      async action(jeu) {
        jeu.cadrer({ de: [12.6, RIVE_E + 1.6, VUE_CASCADE.z + 9], vers: [CASCADE_PIED.x - 1.2, -7, CASCADE.z - 0.6], champ: 50 });
        await jeu.attendre(700);
        await jeu.dire(jeu.txn('vueCascade'));
        jeu.cadrer(null);
      },
    },
    {
      // le « saut de la lance » : l'endroit où la gorge est la plus étroite
      id: 'yaritobi', x: 6.4, z: YARITOBI.z, rayon: 1.7, haut: 1.5, verbe: 'regarder',
      async action(jeu) {
        jeu.cadrer({ de: [7.4, RIVE_E + 1.8, YARITOBI.z + 3.4], vers: [-2.5, -6, YARITOBI.z - 1], champ: 55 });
        await jeu.attendre(600);
        await jeu.dire(jeu.tx('yaritobi'));
        jeu.cadrer(null);
      },
    },
    { id: 'koi', x: ETANG.x + 8.4, z: ETANG.z + 1.8, rayon: 2.0, haut: 1.0, verbe: 'regarder', action: (jeu) => jeu.dire(jeu.txn('koi')) },
    // le jardin : le champ de thé, les jizō, les bambous, le puits
    { id: 'the', x: THE.x1 + 1.3, z: THE.z0 + 5.5, rayon: 1.8, haut: 1.0, verbe: 'regarder', action: (jeu) => jeu.dire(jeu.tx('the')) },
    { id: 'jizo', x: JIZO.x + 1.3, z: JIZO.z, rayon: 2.0, haut: 1.0, verbe: 'regarder', action: (jeu) => jeu.dire(jeu.tx('jizo')) },
    { id: 'bambous', x: BAMBOUS.x + BAMBOUS.r + 0.6, z: BAMBOUS.z + 1.0, rayon: 2.0, haut: 1.5, verbe: 'regarder', action: (jeu) => jeu.dire(jeu.tx('bambous')) },
    { id: 'puits', x: PUITS.x + 1.1, z: PUITS.z - 1.2, rayon: 1.6, haut: 1.0, verbe: 'regarder', action: (jeu) => jeu.dire(jeu.tx('puits')) },
    parler('fermiere'),
    { id: 'somenTable', x: SOMEN.x + 0.85, z: SOMEN.z0 + 0.3, rayon: 1.2, haut: 1.0, verbe: 'regarder', action: (jeu) => jeu.dire(jeu.tx('somenTable')) },
    { id: 'escalierBas', x: QUAI.ponton - 0.6, z: 45.2, y: PONTON.y, rayon: 1.6, haut: 1.4, verbe: 'regarder', action: (jeu) => jeu.dire(jeu.tx('escalierBas')) },
    parler('famille'), parler('petit'), parler('boutique'), parler('guide'), parler('randonneur'), parler('photographe'), parler('touriste'),
    parler('eleve'), parler('grandpere'), parler('pretre'), parler('miko'), parler('couple'), parler('vieille'),
    parler('uzume'), parler('tajikarao'), parler('fue'), parler('taikoK'),
    ...Object.entries(PANNEAUX).map(([id, p]) => ({ id: `panneau-${id}`, x: p.x, z: p.z, rayon: 1.8, verbe: 'lire', action: (jeu) => jeu.dire(jeu.tx(`panneau-${id}`)) })),
    ...interactionsBancs(bancs),
  ];
  // les bêtes : les regarder
  const actionBete = async (jeu, b) => { await jeu.dire(jeu.tx(b.sorte)); };

  return {
    ...infos, textes: TEXTES,
    objets, monde, terrain, etiquettes, passants, daims: [], interactions, actionDaim: null, vapeurs, bancs, lumieres, actionBete, animes, courants, cascades, eauxCalmes,
    // (le secret, tresors.js ; le marchand, sous les érables de la promenade ; les sons à fabriquer en plus ; les feux
    // d'artifice, tirés au-dessus de la forêt, au nord-est de la gorge)
    secret: 'miroir', marchand: MARCHAND, sons: ['rame', 'coq', 'caillou', 'roc', 'slurp', 'cloche', 'claque'],
    feux: { x: 34, y: 0, z: -92, large: 50, haut: [45, 66] },
    // la barque qu'on loue (balade.js : embarquer, piloter)
    barque: barqueDuLieu,
    // le kagura de la nuit : on l'entend en s'approchant de la scène, la nuit seulement (et la musique de la balade baisse)
    musiciens: { x: KAGURA.x, z: KAGURA.z, pres: 8, loin: 34, son: 'kagura', nuit: true },
    // les grenouilles kajika qui chantent la nuit au bord de la rivière (dans la gorge, et la rivière Iwato)
    mares: [[0, 40], [-1, 10], [0, -20], [-2, -60], [-40, -123], [-80, -128]], sonGrenouilles: 'kajika',
    // les bêtes (betes.js) : les coqs et les poules du sanctuaire, des libellules, des papillons, deux milans au-dessus de la gorge
    betes: {
      coqs: [
        { maisons: [[-35, -82], [-40, -95], [-31, -101]] }, { maisons: [[-17, -78], [-14, -99], [-21, -104]] },
        { maisons: [[-37, -87], [-33, -96]], poule: true }, { maisons: [[-15, -81], [-19, -101]], poule: true },
      ],
      libellules: [[-24, 12], [-32, 0], [14, 24], [-48, -104]],
      papillons: [[-36, 14], [-20, 30], [16, -20], [-26, -98]],
      milans: [{ x: 0, z: 10, r: 26, h: 48, sens: 1 }, { x: -20, z: -60, r: 34, h: 58, sens: -1 }],
    },
    // les rais de soleil entre les cèdres de l'allée du sanctuaire et autour du marchand (balade.js, creerRais)
    rais: [[-23.5, -74], [-28.5, -79], [-23.5, -84], [MARCHAND.x - 1, MARCHAND.z + 1]].map(([x, z], i) => ({ x, z, haut: 10, r0: 0.35, r1: 1.1 + 0.3 * (i % 3), force: 0.075 })),
    eauCalme: { boue: '#4f6e52', bord: '#4a5444', clarte: 0.45 },
    aspectSol: (x, z, h) => aspectSol(P, x, z, h),
    // (la grille fine du sol jusqu'aux virages des deux bouts de la gorge : la grosse grille, de 4 m, passait devant les colonnes)
    etendue: { x0: -720, x1: 720, z0: -720, z1: 720, pas: 4, fin: { x0: -100, x1: 40, z0: -168, z1: 126, pas: 1 } },
    eau: { x0: -110, x1: 110, z0: -185, z1: 135, niveau: NIV, son: 'riviere', clair: P.emeraude, profond: P.emeraudeFonce, sensLignes: 1 },
    // la rivière en bas de la gorge, le grondement de la cascade, les grenouilles kajika et les insectes la nuit, le kagura
    vent: { dir: [0.3, 0.95], force: 0.7 }, oiseaux: ['milan', 'uguisu'], ambiances: ['riviere', 'cascade', 'kajika', 'insectes', 'kagura'],
    brume: [150, 1500],
    soleil: [-0.45, 0.78, 0.44],
    depart: { x: DEPART.x, z: DEPART.z, cap: PI },
    photos: {
      heros: { x: DEPART.x, z: DEPART.z, cap: PI, lacet: 0.25, tangage: 0.2, distance: 6.5 },
      perso: { x: -14.5, z: 62.5, cap: -PI / 2 + 0.35, lacet: -PI / 2 + 0.35 + 0.05, tangage: 0.1, distance: 3.9 },
    },
  };
}

// les teintes des pierres taillées (escaliers, ponts, murs)
const TONS_PIERRE = ['#bdb6a5', '#a1998a', '#b2ab9b', '#c5beae'];
// le pied de la cascade de Manai (là où la barque se fait arroser) ; le milieu de la grotte des dieux et son sol ; l'entrée
const CASCADE_PIED = { x: 0, z: 0 };
const TAS = { x: 0, z: 0, sol: 0 };
const ENTREE_YASU = { x: 0, z: 0 };
// les titres des panneaux (en japonais, peints sur le papier)
const TITRES_PANNEAUX = {
  cascade: '真名井の滝', gorge: '高千穂峡', barques: '貸しボート', kihachi: '鬼八の力石', yaritobi: '槍飛', yasu: '天安河原',
  yohai: '天岩戸 遥拝所', meoto: '夫婦杉', tajikarao: '手力雄命',
};
/** Le fond peint de la scène du kagura : une montagne bleue dans la brume, le soleil rouge qui se lève, des pins. */
function fondKagura(c, W, H) {
  const ciel = c.createLinearGradient(0, 0, 0, H);
  ciel.addColorStop(0, '#f4e2b8'); ciel.addColorStop(1, '#f8f0dc');
  c.fillStyle = ciel; c.fillRect(0, 0, W, H);
  c.fillStyle = '#d8452e'; c.beginPath(); c.arc(W * 0.62, H * 0.42, H * 0.16, 0, 2 * Math.PI); c.fill();
  c.fillStyle = '#7f96a6'; c.beginPath(); c.moveTo(0, H); c.lineTo(W * 0.18, H * 0.48); c.lineTo(W * 0.32, H * 0.62); c.lineTo(W * 0.5, H * 0.3); c.lineTo(W * 0.78, H * 0.7); c.lineTo(W, H * 0.55); c.lineTo(W, H); c.fill();
  c.fillStyle = 'rgba(248, 240, 220, 0.6)'; c.fillRect(0, H * 0.68, W, H * 0.1);
  c.fillStyle = '#3f6a3a';
  for (const [x, s] of [[0.08, 1], [0.86, 0.9], [0.94, 0.7]]) {
    c.beginPath(); c.moveTo(W * x, H * (1 - 0.55 * s)); c.lineTo(W * (x - 0.06 * s), H); c.lineTo(W * (x + 0.06 * s), H); c.fill();
  }
}
// les rochers du lit de la rivière (les barques les contournent) : [x, z, rayon]
const ROCHERS = [];
// les arbres, pour assombrir le sol à leur pied (aspectSol) : par cases de 8 m
const ARBRES_SOL = new Map();

// ---------------------------------------------------------------- Le sol
/** Le sol (sa couleur et sa matière, textures.js) en x, z, à la hauteur h. */
function aspectSol(P, x, z, h) {
  const bruit = bruitDoux(x, z, 4);
  const g = surGorge(x, z);
  // dans la gorge : le lit (des galets sombres), la paroi derrière les colonnes
  if (g.d < g.w + 2.2) return [h < NIV ? '#5a5a4c' : P.basalteFonce, M.roche];
  // la vallée de la rivière Iwato : les galets du lit, les corniches, la pente
  if (z < -112 && x < 6) {
    const v = surIwato(x, z);
    if (v.d < LARGE_I + 0.3) return ['#6a6656', M.roche];
    // le sol de la grotte des dieux : des graviers gris, sous le surplomb (pas d'herbe)
    const ex = (x - YASU.x) / YASU.rx, ez = (z - YASU.z) / YASU.rz;
    if (z < YASU.z + 0.4 && ex * ex + ez * ez < 1.05) return [bruit > 0.5 ? '#8a8478' : '#7c766a', M.terre];
    if (h < NIV_I + 0.7) return [bruit > 0.5 ? '#9a9282' : '#8e8676', M.terre];
    return [bruit > 0.55 ? '#4e6a3c' : '#587540', M.sousBois];
  }
  // l'étang et son canal : le fond
  if (Math.hypot(x - ETANG.x, z - ETANG.z) < rayonEtang(Math.atan2(x - ETANG.x, z - ETANG.z)) + 0.3 && h < -0.1) return ['#7a7a5c', M.roche];
  if (surLaLigne(CANAL, x, z).d < 0.75) return ['#8a8676', M.pierre];
  // près des arbres, le sol de la forêt
  const k = `${Math.floor(x / 8)},${Math.floor(z / 8)}`;
  for (const di of [-1, 0, 1]) for (const dj of [-1, 0, 1]) {
    const l = ARBRES_SOL.get(`${Math.floor(x / 8) + di},${Math.floor(z / 8) + dj}`);
    if (l) for (const [ax, az, r] of l) if (Math.hypot(x - ax, z - az) < r * (0.8 + 0.3 * bruit)) return [bruit > 0.6 ? '#4b6539' : '#557a3a', M.sousBois];
  }
  void k;
  // la promenade : un chemin de terre battue le long du garde-corps
  if (g.cote > 0 && g.d < g.w + RAMBARDE + 2.8 && z > -64 && z < 73) return [bruit > 0.5 ? P.chemin : P.cheminFonce, M.terre];
  // le jardin : ses chemins de terre ; sous les bambous, leurs feuilles tombées
  if (x < -38 && x > -70 && z > -6 && z < 70) {
    for (const c of CHEMINS_JARDIN) if (surLaLigne(c, x, z).d < 0.75 + 0.25 * bruit) return [bruit > 0.5 ? P.chemin : P.cheminFonce, M.terre];
    if (Math.hypot(x - BAMBOUS.x, z - BAMBOUS.z) < BAMBOUS.r * (0.95 + 0.15 * bruit)) return [bruit > 0.5 ? '#b5a77a' : '#a8996c', M.sousBois];
  }
  // la place : des allées de gravier, l'herbe
  if (g.cote < 0 && x > -70 && z > -66 && z < 74) {
    if (g.d < g.w + RAMBARDE + 2.6) return [bruit > 0.5 ? P.chemin : P.cheminFonce, M.terre];
    return [bruit > 0.62 ? P.herbeFonce : bruit > 0.3 ? P.herbe : '#92cc66', M.herbe];
  }
  if (x > SANCT.x0 && x < SANCT.x1 && z > SANCT.z0 && z < SANCT.z1) return [bruit > 0.5 ? '#ddd6c4' : '#d2cab6', M.terre];
  // ailleurs : la forêt
  return [bruit > 0.6 ? '#4b6539' : bruitDoux(x - 13, z + 29, 2.6) > 0.5 ? '#557a3a' : '#5c7642', M.sousBois];
}

// ---------------------------------------------------------------- Les textes du lieu
const TEXTES = {
  fr: {
    noms: { batelier: 'Le loueur de barques', chiho: 'La cuisinière du Chiho no Ie', famille: 'La maman', petit: 'Le petit garçon', boutique: 'La marchande de souvenirs', videaste: '@random_japan_place', guide: 'Le guide bénévole', fermiere: 'La cueilleuse de thé', randonneur: 'Le randonneur', photographe: 'La photographe', touriste: 'La touriste', eleve: 'L’écolier', grandpere: 'Le grand-père', pretre: 'Le prêtre', miko: 'La miko', kagura: 'Le maître du kagura', uzume: 'Uzume', tajikarao: 'Tajikarao', fue: 'Le flûtiste', taikoK: 'Le joueur de tambour', couple: 'La jeune femme', vieille: 'La vieille dame' },
    tampons: { barque: ['La cascade de Manai', 'Ramer jusque sous la cascade de Manai'], somen: ['Les nouilles qui glissent', 'Attraper des nouilles dans le bambou'], kagura: ['Le kagura de la nuit', 'Voir le kagura, la nuit, au sanctuaire'], meoto: ['Les cèdres mariés', 'Faire trois fois le tour des cèdres mariés'], ishi: ['La grotte des dieux', 'Poser une pierre dans la grotte des dieux'] },
    'panneau-cascade': ['« La cascade de Manai 真名井の滝 »', 'Elle tombe de dix-sept mètres dans la gorge : l’une des cent plus belles cascades du Japon.', 'Selon la légende, quand le dieu Ame-no-Murakumo descendit du ciel, il n’y avait pas d’eau ici. Il en apporta un peu du ciel… et l’étang d’Onokoro naquit.'],
    'panneau-gorge': ['« Les gorges de Takachiho 高千穂峡 »', 'Il y a 120 000 ans, la lave du mont Aso a coulé jusqu’ici. En refroidissant, elle s’est fendue en colonnes à six pans (柱状節理).', 'La rivière Gokase l’a creusée en un canyon étroit, haut de quatre-vingts à cent mètres.'],
    'panneau-etang': ['« L’étang d’Onokoro おのころ池 »', 'Il se jette du haut de la falaise : c’est lui, la cascade de Manai.', 'On y voit des carpes… et même un esturgeon !'],
    'panneau-barques': ['« Location de barques 貸しボート »', 'Trente minutes. Trois personnes par barque.', 'Ne pas passer sous la cascade… sauf si l’on aime être mouillé !'],
    'panneau-kihachi': ['« La pierre de force de Kihachi 鬼八の力石 »', 'Deux cents tonnes. Le démon Kihachi la soulevait pour montrer sa force.'],
    'panneau-yaritobi': ['« Le saut de la lance 槍飛 »', 'L’endroit le plus étroit de la gorge. Le démon Kihachi s’y serait enfui, en sautant d’un bord à l’autre avec sa lance.'],
    'panneau-yasu': ['« Amano Yasukawara 天安河原 »', 'Dans cette grande grotte, les huit millions de dieux se réunirent pour trouver comment faire sortir Amaterasu de la sienne.', 'Les visiteurs y empilent des pierres en faisant un vœu.'],
    'panneau-yohai': ['« Le lieu de prière de la grotte céleste 天岩戸遥拝所 »', 'En face, de l’autre côté de la rivière Iwato, la grotte où s’enferma Amaterasu.', 'On la salue d’ici : personne n’a le droit d’y aller.'],
    'panneau-meoto': ['« Les cèdres mariés 夫婦杉 »', 'Deux cèdres nés d’une même racine. Faites-en trois fois le tour avec la personne que vous aimez : vous resterez unis pour toujours.'],
    'panneau-tajikarao': ['« Tajikarao 手力雄命 »', 'Le dieu de la force, qui arracha la porte de pierre de la grotte d’Amaterasu.'],
    batelier: ['Bonjour ! Une barque, pour aller voir la cascade de Manai de tout près ?', 'Trente minutes sur l’eau émeraude, au pied des falaises. Tu veux essayer ?'],
    batelierEncore: ['Encore un tour en barque ? Avec plaisir !'],
    batelierNon: ['Pas de souci. La barque t’attend ici !'],
    batelierNuit: ['La location est fermée pour ce soir. Les barques dorment, comme la rivière…', 'Reviens demain matin !'],
    ramerOrdi: ['Avance (W ou ↑) pour ramer, recule pour freiner ; à gauche, à droite pour tourner.', 'Va jusque sous la cascade… Et les jours de soleil, regarde bien les parois, en amont : il paraît que quelque chose y brille.', 'Pour rendre la barque, reviens au ponton.'],
    ramerTel: ['Pousse le joystick vers l’avant pour ramer, sur les côtés pour tourner.', 'Va jusque sous la cascade… Et les jours de soleil, regarde bien les parois, en amont : il paraît que quelque chose y brille.', 'Pour rendre la barque, reviens au ponton.'],
    accoster: ['Rendre la barque ?'],
    accosterFin: ['Merci ! Alors, la cascade, c’était beau ?'],
    sousCascade: ['Splash ! La barque passe sous la cascade de Manai…', 'L’eau tombe de dix-sept mètres en mille fils d’argent. Tu es trempé, mais quel spectacle !'],
    sousCascadeCompagnon: {
      kon: ['« Brrr ! Mes poils… Mais c’est la plus belle cascade que j’aie jamais vue ! »'],
      pon: ['« Pon ! Une douche gratuite ! … Mon ventre est tout mouillé. »'],
      chapu: ['« Chapuuu ! Encore ! On repasse dessous ? »'],
      gao: ['« Gao ! Un gardien n’a pas peur de l’eau… même froide. »'],
      fuwa: ['« Fuwa… L’eau chante comme la mer de chez moi. »'],
      saya: ['« L’eau de la montagne… Elle descend d’Aso, de très loin. Elle a voyagé longtemps. »'],
    },
    miroirTrouve: ['Posé sur une pierre plate, contre la paroi, juste au-dessus de l’eau : un vieux miroir de bronze, tout rond !', 'Son dos est orné d’un soleil. Il brille encore, comme s’il gardait un peu de lumière…', 'Tu le ranges précieusement dans ton sac.'],
    miroirCompagnon: {
      kon: ['« Un miroir rond… comme celui que les dieux suspendirent devant la grotte d’Amaterasu ! Rapportons-le au lieu de prière, face à la grotte. »'],
      pon: ['« Oh, ça brille ! On peut le vendre ? … Non ? Bon. Le prêtre du sanctuaire saura quoi en faire. »'],
      chapu: ['« Je l’ai vu briller depuis l’eau ! Il a l’air très, très vieux… Montrons-le au sanctuaire ! »'],
      gao: ['« Gao… Un miroir sacré. Il veut retourner près de la grotte de la déesse, je le sens. »'],
      fuwa: ['« Fuwa ! Il brille comme ma perle… Il appelle le soleil. »'],
      saya: ['« Les mousses l’ont gardé longtemps… Il appartient à la grotte du soleil, de l’autre côté de la rivière Iwato. »'],
    },
    chiho: ['Bienvenue au Chiho no Ie ! Ici, on mange des nagashi-sōmen : des nouilles qui glissent dans un bambou, avec l’eau froide.', 'On les attrape avec ses baguettes au passage. Tu veux essayer ?'],
    chihoEncore: ['Encore des nouilles ? Installe-toi !'],
    chihoNon: ['Comme tu veux ! Elles glissent tout l’été.'],
    chihoNuit: ['Le restaurant est fermé, désolée ! Reviens demain pour les nouilles.'],
    somenRegle: ['Les nouilles arrivent d’en haut, avec l’eau…', 'Quand elles passent juste devant toi : vite, attrape-les ! Il en faut trois.'],
    somenAide: (n) => `A (ou un appui sur l’écran) quand les nouilles passent devant toi ! ${n}/3`,
    somenRate: (n) => `Raté ! Attends qu’elles soient juste devant toi… ${n}/3`,
    somenPerdu: ['Oh, elles sont toutes passées ! Pas grave : ça demande un peu d’entraînement.', 'Reparle-moi quand tu veux recommencer !'],
    somenGagne: ['Bravo ! Trois en plein vol ! Trempe-les dans la sauce, et… mmm, fraîches !', 'Au Japon, on aspire les nouilles bruyamment : ça veut dire que c’est bon.'],
    somenCompagnon: {
      kon: ['« Zuzuzu… Pardon. Mais c’est vraiment délicieux. »'],
      pon: ['« Encore ! Encore ! Je pourrais en manger cent ! »'],
      chapu: ['« Des nouilles qui nagent ! Comme des petits poissons blancs ! »'],
      gao: ['« Gao ! Attrapées comme des proies ! Je suis fier de toi. »'],
      fuwa: ['« Fuwa… Elles glissent comme les rivières du ciel. »'],
      saya: ['« Le bambou, l’eau froide de la montagne… Les plantes sont contentes d’être utiles. »'],
    },
    somenTable: ['Des bols de sauce, des baguettes, de l’oignon vert et du gingembre.', 'Sur le poteau, la pancarte : « 流しそうめん », les nouilles qui glissent.'],
    the: ['Un champ de thé, en rangs bien taillés.', 'Ici, on fait le kamairi-cha (釜炒り茶) : les feuilles sont grillées dans un grand chaudron de fer, au lieu d’être cuites à la vapeur. Il a un goût doux, un peu grillé.'],
    jizo: ['Une rangée de jizō, les gardiens des voyageurs et des enfants.', 'Les gens du pays leur tricotent des bonnets et leur cousent des bavoirs rouges, pour qu’ils n’aient pas froid.'],
    bambous: ['Un bosquet de bambous. Quand le vent passe, les tiges s’entrechoquent doucement : toc… toc…', 'Une pousse de bambou peut grandir d’un mètre en un seul jour !'],
    puits: ['Un vieux puits de pierre, son petit toit de bois, sa poulie et son seau.', 'Son eau reste fraîche même en plein été : on y mettait les pastèques à refroidir.'],
    fermiere: ['Bonjour ! Je cueille les pousses de thé, les plus tendres, au bout des rangs.', 'Chez nous, on les grille à la main, dans un chaudron de fer : c’est le kamairi-cha de Takachiho. Il sent bon la noisette !'],
    fermiereNuit: ['Il fait trop sombre pour cueillir… Les feuilles dorment.', 'Demain matin, elles seront couvertes de rosée.'],
    kaguraJour: ['Bonjour ! Ici, chaque nuit, on danse le kagura de Takachiho : l’histoire de la grotte d’Amaterasu.', 'La déesse du soleil s’était enfermée dans une grotte, et le monde était plongé dans le noir…', 'Tu veux rester jusqu’à ce soir pour voir le spectacle ?'],
    kaguraNon: ['D’accord. Le spectacle commence chaque soir, quand la nuit tombe.'],
    kaguraSoir: ['La nuit est tombée. Les danseurs se préparent… Reviens me voir quand tu veux que ça commence !'],
    kaguraNuit: ['Les danseurs sont prêts. On commence ?'],
    kaguraChoix: ['Voir le kagura', 'Faire revenir le matin', 'Rien'],
    kaguraMatin: ['Le spectacle est fini pour cette nuit. Le soleil se lève sur les gorges…'],
    kaguraSpectacle: ['La flûte s’élève, le tambour résonne. Sur la scène, Uzume danse, ses grelots à la main…', 'Elle danse si joyeusement que les huit millions de dieux éclatent de rire.', 'Intriguée, Amaterasu entrouvre la porte de sa grotte… Tajikarao, le dieu de la force, saisit la pierre et l’arrache !', 'Et la lumière revient sur le monde.'],
    kaguraFin: ['Les danseurs saluent. Pendant les fêtes de l’hiver, on danse ainsi trente-trois danses, du soir jusqu’au matin, dans les villages de Takachiho.'],
    kaguraCompagnon: {
      kon: ['« Quelle danse ! Les dieux devaient vraiment rire très fort. »'],
      pon: ['« Pon pon ! Moi aussi, je danse comme Uzume ! … Ne riez pas ! »'],
      chapu: ['« Les grelots ! Shan shan shan ! J’ai envie de danser aussi ! »'],
      gao: ['« Gao ! Tajikarao est fort comme un gardien. Je l’aime bien. »'],
      fuwa: ['« Fuwa… La lumière revient toujours, même après la nuit la plus noire. »'],
      saya: ['« Une très vieille histoire… Les arbres d’ici l’ont entendue mille fois, et ils ne s’en lassent pas. »'],
    },
    meoto: ['Les cèdres mariés (夫婦杉) : deux grands cèdres nés d’une même racine.', 'On dit que si l’on en fait trois fois le tour avec quelqu’un qu’on aime, on restera ensemble pour toujours.', 'Faire trois fois le tour avec ton compagnon ?'],
    meotoFin: ['Un, deux, trois tours ! Les deux cèdres se dressent côte à côte depuis huit cents ans.'],
    meotoCompagnon: {
      kon: ['« Toi et moi, compagnons pour toujours ! … C’était une promesse, n’est-ce pas ? »'],
      pon: ['« Pon ! Ça donne le tournis… mais c’est pour la bonne cause ! »'],
      chapu: ['« Encore un tour ! Tourner, c’est comme nager en rond ! »'],
      gao: ['« Gao ! Je veillerai sur toi pour toujours. C’est juré. »'],
      fuwa: ['« Fuwa… On vole ensemble, maintenant et toujours. »'],
      saya: ['« Deux arbres, une seule racine… Comme nous deux, maintenant. »'],
    },
    tas: ['Tu poses une pierre, tout doucement, sur un petit tas.', 'Ici, à la grotte des dieux (天安河原), les visiteurs empilent des pierres en faisant un vœu.', 'C’est ici que les huit millions de dieux se réunirent pour trouver comment faire sortir Amaterasu de sa grotte.'],
    tasEncore: ['Encore une pierre, encore un vœu. Le petit tas tient bon !'],
    tasCompagnon: {
      kon: ['« J’ai fait un vœu aussi… mais c’est un secret de renard. »'],
      pon: ['« J’ai souhaité un grand festin ! … Quoi ? C’est un vœu sérieux. »'],
      chapu: ['« J’ai souhaité nager dans toutes les rivières du Japon ! »'],
      gao: ['« Gao… J’ai souhaité que tu ne sois jamais en danger. »'],
      fuwa: ['« Fuwa… J’ai souhaité revoir la mer. »'],
      saya: ['« Les pierres de la rivière… Elles écoutent les vœux depuis des milliers d’années. »'],
    },
    yohai: ['Le lieu de prière face à la grotte (天岩戸遥拝所).', 'De l’autre côté de la rivière Iwato, dans la falaise, une fente fermée par un rocher : la grotte où s’enferma Amaterasu, la déesse du soleil.', 'Personne n’a le droit d’y aller : on la salue d’ici. Près du petit torii, l’arbre sacré, un sakaki, et la table des offrandes.'],
    yohaiNuit: ['La nuit, la falaise est toute noire. On devine à peine la grotte, de l’autre côté de la rivière…', 'Le sakaki, l’arbre sacré, frissonne dans le vent.'],
    yohaiApres: ['Le miroir brille sur le sakaki, tourné vers la grotte. La porte de pierre est entrouverte.', 'On dirait qu’un peu de lumière en sort encore…'],
    yohaiNuitMiroir: ['Il fait trop sombre : le miroir ne renverrait aucune lumière.', 'Il faudrait le suspendre au sakaki quand le soleil brille.'],
    accrocher: ['Tu suspends le miroir à une branche du sakaki, tourné vers la grotte d’Amaterasu.', 'Comme le firent les dieux, il y a très, très longtemps…'],
    eclipse: ['Soudain, le ciel s’assombrit… Le soleil disparaît, comme le jour où Amaterasu s’enferma dans sa grotte !'],
    coqs: ['Dans le sanctuaire, les coqs se mettent à chanter tous ensemble : « Kokekokkō ! »'],
    danse: {
      kon: ['« À moi de danser, comme Uzume ! Regarde bien ! »'],
      pon: ['« Pon ! Pon ! Ma danse du ventre va faire rire tous les dieux ! »'],
      chapu: ['« Chapu ! Hop, hop, je danse ! Viens, soleil, viens ! »'],
      gao: ['« Gao ! La danse du gardien ! Sors de ta grotte, déesse ! »'],
      fuwa: ['« Fuwa, fuwa ! Je danse dans les airs pour toi, soleil ! »'],
      saya: ['« Saya… Danser comme les feuilles dans le vent… Reviens, lumière… »'],
    },
    lumiere: ['Un grondement… La porte de pierre de la grotte s’écarte !', 'Une lumière dorée jaillit et inonde la vallée. Le soleil est revenu !'],
    kobanLueur: ['Sur la table des offrandes, quelque chose brille…'],
    miroirMerci: {
      kon: ['« Tu as rejoué la plus vieille histoire du Japon… Les dieux te remercient, j’en suis sûr. »'],
      pon: ['« Pon ! J’ai fait rire le soleil ! … Enfin, nous deux. »'],
      chapu: ['« Le soleil est revenu ! La rivière brille de nouveau ! »'],
      gao: ['« Gao… La lumière est revenue. Mission accomplie, voyageur. »'],
      fuwa: ['« Fuwa… Ma perle brille plus fort que jamais. »'],
      saya: ['« Toutes les feuilles se tournent vers la lumière… Merci. »'],
    },
    legende: ['Un koban, une pièce d’or d’autrefois.', 'C’est le mythe de la grotte céleste (天岩戸) : pour faire sortir Amaterasu, les dieux suspendirent un miroir et des joyaux à un arbre sacré, firent chanter les coqs, et Uzume dansa.', 'Ce miroir serait l’un des trois trésors sacrés de l’empereur du Japon.'],
    videaste: ['Salut ! Moi, c’est @random_japan_place. Je filme la cascade de Manai pour ma vidéo.', 'Tu veux la voir ?'],
    videasteNon: ['Pas de souci ! Bonne balade dans les gorges !'],
    videasteApres: ['Merci d’avoir regardé ! Abonne-toi pour voir d’autres endroits du Japon !'],
    haiden: ['Tu fais sonner la cloche, deux saluts, deux battements de mains, un dernier salut.', 'Le sanctuaire d’Amanoiwato honore Amaterasu, la déesse du soleil, ancêtre des empereurs du Japon.'],
    haidenNuit: ['Dans la nuit, les lanternes éclairent doucement le pavillon de prière. Tout est calme.'],
    chozu: ['Le bassin de purification. Un dragon de bronze crache une eau claire.', 'Avant de prier, on se lave les mains et la bouche avec la louche de bambou.'],
    shinboku: ['Un cèdre immense, entouré de sa corde sacrée : l’arbre divin du sanctuaire.', 'Il a plus de six cents ans. Son écorce est douce et tiède.'],
    statue: ['La statue de Tajikarao, le dieu de la force.', 'C’est lui qui arracha la porte de pierre de la grotte d’Amaterasu, et la jeta si loin… qu’elle serait retombée à Togakushi, à des centaines de kilomètres d’ici !'],
    kihachi: ['La pierre de force de Kihachi (鬼八の力石) : un bloc de deux cents tonnes.', 'Kihachi était un démon qui terrorisait la région. Il soulevait cette pierre comme un caillou, pour montrer sa force.', 'Le héros Mikeiri-no-mikoto finit par le vaincre. Une corde sacrée entoure la pierre.'],
    vueCascade: ['Le belvédère de la cascade.', 'La cascade de Manai tombe dans la gorge émeraude, entre les colonnes de basalte.', 'Ces colonnes sont la lave du mont Aso : en refroidissant, elle s’est fendue en prismes réguliers, comme des crayons serrés.'],
    vueCascadeNuit: ['La nuit, on entend la cascade sans la voir. Quelques lanternes se reflètent dans l’eau noire.'],
    yaritobi: ['Le « saut de la lance » (槍飛).', 'C’est l’endroit le plus étroit de la gorge : à peine quelques mètres. On dit que le démon Kihachi, poursuivi, sauta d’un bord à l’autre en prenant appui sur sa lance.'],
    koi: ['Des carpes nagent dans l’étang d’Onokoro. Il y a même un esturgeon, avec son long museau !', 'C’est cet étang qui se jette du haut de la falaise : la cascade de Manai.'],
    koiNuit: ['On devine les carpes qui dorment au fond de l’étang.'],
    escalierBas: ['Le ponton des barques, tout au fond de la gorge. Les parois de basalte montent tout droit vers le ciel.', 'Le loueur de barques attend près de sa cabane.'],
    famille: ['On mange des sōmen en famille ! Mon fils les rate toutes, ha ha !', 'Le Chiho no Ie fait glisser ses nouilles dans le bambou depuis plus de cinquante ans.'],
    familleNuit: ['On reste encore un peu. La nuit, on entend la cascade d’ici.'],
    petit: ['J’en ai attrapé une ! … Non, elle est partie.', 'C’est trop dur, elles vont trop vite !'],
    petitNuit: ['Je veux encore des nouilles…'],
    boutique: ['Bienvenue ! Nous avons de petits miroirs, des magatama porte-bonheur, et le saké de Takachiho !', 'Le kagura de la nuit, tu l’as vu ? C’est au sanctuaire, au nord, de l’autre côté de la forêt.'],
    boutiqueNuit: ['La boutique ferme ! … Mais va voir le kagura, au sanctuaire : il commence à la nuit tombée.'],
    guide: ['Bonjour ! Je suis guide bénévole des gorges.', 'Ces falaises de basalte font jusqu’à cent mètres de haut. La lave du mont Aso a coulé jusqu’ici, et la rivière Gokase l’a creusée petit à petit.', 'Tu vois la grosse pierre avec la corde ? C’est la pierre du démon Kihachi.'],
    guideNuit: ['La nuit, les gorges appartiennent aux grenouilles kajika. Écoute : on dirait des oiseaux qui chantent !'],
    randonneur: ['Je fais la promenade des gorges : un kilomètre au bord du vide, sous les arbres.', 'À l’automne, les érables deviennent tout rouges. C’est la plus belle saison !'],
    randonneurNuit: ['Il fait nuit… Je rentre à l’auberge. Attention où tu marches !'],
    photographe: ['Je viens d’Australie pour photographier la cascade de Manai. Elle est encore plus belle en vrai !', 'Le meilleur moment, c’est quand le soleil tombe dans la gorge : l’eau devient vert émeraude.'],
    photographeNuit: ['La nuit, je photographie les étoiles au-dessus de la gorge. Regarde là-haut !'],
    touriste: ['C’est la première fois que je viens à Takachiho ! On peut faire de la barque jusqu’à la cascade, il paraît.', 'Le ponton est en bas du grand escalier, de l’autre côté du pont.'],
    touristeNuit: ['On dit que le kagura de la nuit est magique. Je vais aller le voir !'],
    eleve: ['Tu sais pourquoi l’étang s’appelle « Onokoro » ? Dans les légendes, c’est le nom de la première île créée par les dieux !', 'Et les carpes sont toutes grosses parce que les gens leur donnent à manger.'],
    eleveNuit: ['Maman m’a dit de rentrer avant la nuit… Oups.'],
    grandpere: ['Je viens ici tous les jours depuis cinquante ans. Je ne me lasse pas de la cascade.', 'Quand j’étais petit, les jours de soleil, je voyais briller quelque chose en bas, sous la falaise, en amont de la cascade.', 'On n’a jamais su ce que c’était… Peut-être qu’on le verrait d’une barque.'],
    grandpereNuit: ['Écoute la cascade… Elle chante plus fort la nuit.'],
    pretre: ['Bienvenue au sanctuaire d’Amanoiwato. On y honore Amaterasu, la déesse du soleil.', 'Autrefois, fâchée contre son frère Susanoo, elle s’enferma dans une grotte, et le monde devint noir.', 'Pour la faire sortir, les dieux suspendirent un miroir et des joyaux à un arbre sacré devant la grotte. Les coqs chantèrent, Uzume dansa…', 'On raconte qu’un jour, l’un de ces miroirs fut emporté par la rivière. Personne ne l’a jamais retrouvé.'],
    pretreNuit: ['La nuit, la grotte d’Amaterasu dort. Le kagura se danse sur la scène, à l’ouest du sanctuaire.'],
    miko: ['Bonjour ! Voici des magatama, des joyaux en forme de virgule : ils portent bonheur.', 'Avec le miroir et l’épée, ce sont les trois trésors sacrés du Japon.'],
    mikoNuit: ['Le bureau des porte-bonheur est fermé. Bonne nuit !'],
    couple: ['On vient de faire trois fois le tour des cèdres mariés, avec mon fiancé !', 'Il est parti acheter des porte-bonheur. Il paraît que ça marche à tous les coups…'],
    coupleNuit: ['On reste pour voir le kagura. C’est notre premier voyage ensemble !'],
    vieille: ['J’empile une pierre ici chaque année, pour mes petits-enfants.', 'Essaie toi aussi : pose une pierre sur le petit tas, près du chemin, et fais un vœu.'],
    vieilleNuit: ['Il fait sombre dans la grotte… Mais les pierres gardent nos vœux, même la nuit.'],
    uzume: ['Je danse Uzume, la déesse qui fit rire les dieux !', 'Ce soir, je danse pour faire revenir le soleil… comme il y a très, très longtemps.'],
    tajikarao: ['Je suis Tajikarao, le dieu de la force ! Hoo !', 'Quand Amaterasu entrouvrit la porte, je l’ai arrachée de mes mains et jetée au loin !'],
    fue: ['La flûte du kagura chante comme le vent dans les cèdres.'],
    taikoK: ['Le tambour donne le rythme de la danse. Don, don, ka-ka !', 'Pendant les fêtes de l’hiver, on joue toute la nuit, jusqu’au matin.'],
    coq: ['Un coq du sanctuaire se promène, la crête bien rouge, la queue en panache.', 'Ce sont les « oiseaux au long chant » du mythe : leur chant aida à faire sortir Amaterasu de sa grotte.'],
    poule: ['Une poule picore le gravier. Au sanctuaire, les coqs et les poules vivent en liberté.'],
    libellule: ['Une libellule rouge (akatombo) se repose. Au Japon, elles annoncent l’automne.'],
  },
  en: {
    noms: { batelier: 'Boat renter', chiho: 'Chiho no Ie cook', famille: 'Mom', petit: 'Little boy', boutique: 'Souvenir seller', videaste: '@random_japan_place', guide: 'Volunteer guide', fermiere: 'Tea picker', randonneur: 'Hiker', photographe: 'Photographer', touriste: 'Tourist', eleve: 'Schoolboy', grandpere: 'Grandpa', pretre: 'Priest', miko: 'Shrine maiden', kagura: 'Kagura master', uzume: 'Uzume', tajikarao: 'Tajikarao', fue: 'Flute player', taikoK: 'Drummer', couple: 'Young woman', vieille: 'Old lady' },
    tampons: { barque: ['Manai Falls', 'Row right under Manai Falls'], somen: ['Flowing noodles', 'Catch noodles in the bamboo'], kagura: ['Night kagura', 'Watch the kagura at night, at the shrine'], meoto: ['The wedded cedars', 'Walk three times around the wedded cedars'], ishi: ['The gods’ cave', 'Place a stone in the gods’ cave'] },
    'panneau-cascade': ['“Manai Falls 真名井の滝”', 'It drops seventeen meters into the gorge: one of the hundred most beautiful waterfalls in Japan.', 'Legend says that when the god Ame-no-Murakumo came down from heaven, there was no water here. He brought a little water from the sky… and Onokoro Pond was born.'],
    'panneau-gorge': ['“Takachiho Gorge 高千穂峡”', '120,000 years ago, lava from Mount Aso flowed all the way here. As it cooled, it cracked into six-sided columns (柱状節理).', 'The Gokase River carved it into a narrow canyon, eighty to a hundred meters high.'],
    'panneau-etang': ['“Onokoro Pond おのころ池”', 'It pours over the cliff: that’s Manai Falls.', 'You can see carp in it… and even a sturgeon!'],
    'panneau-barques': ['“Boat rental 貸しボート”', 'Thirty minutes. Three people per boat.', 'Do not go under the waterfall… unless you like getting wet!'],
    'panneau-kihachi': ['“Kihachi’s strength stone 鬼八の力石”', 'Two hundred tons. The demon Kihachi lifted it to show off his strength.'],
    'panneau-yaritobi': ['“The spear jump 槍飛”', 'The narrowest point of the gorge. The demon Kihachi is said to have escaped here, leaping from one rim to the other with his spear.'],
    'panneau-yasu': ['“Amano Yasukawara 天安河原”', 'In this great cave, the eight million gods gathered to work out how to bring Amaterasu out of hers.', 'Visitors stack stones here as they make a wish.'],
    'panneau-yohai': ['“Prayer place of the heavenly cave 天岩戸遥拝所”', 'Facing you, across the Iwato River, is the cave where Amaterasu shut herself away.', 'People greet it from here: no one is allowed to go there.'],
    'panneau-meoto': ['“The wedded cedars 夫婦杉”', 'Two cedars grown from a single root. Walk around them three times with the person you love, and you will stay together forever.'],
    'panneau-tajikarao': ['“Tajikarao 手力雄命”', 'The god of strength, who tore away the stone door of Amaterasu’s cave.'],
    batelier: ['Hello! A boat, to see Manai Falls up close?', 'Thirty minutes on the emerald water, at the foot of the cliffs. Want to try?'],
    batelierEncore: ['Another boat ride? With pleasure!'],
    batelierNon: ['No problem. The boat will wait for you here!'],
    batelierNuit: ['The rental is closed for tonight. The boats are sleeping, like the river…', 'Come back tomorrow morning!'],
    ramerOrdi: ['Go forward (W or ↑) to row, back to slow down; left and right to turn.', 'Row all the way under the falls… And on sunny days, look closely at the cliffs upstream: they say something glints there.', 'To return the boat, come back to the pontoon.'],
    ramerTel: ['Push the joystick forward to row, to the sides to turn.', 'Row all the way under the falls… And on sunny days, look closely at the cliffs upstream: they say something glints there.', 'To return the boat, come back to the pontoon.'],
    accoster: ['Return the boat?'],
    accosterFin: ['Thank you! So, was the waterfall beautiful?'],
    sousCascade: ['Splash! The boat slides under Manai Falls…', 'The water falls seventeen meters in a thousand silver threads. You’re soaked, but what a sight!'],
    sousCascadeCompagnon: {
      kon: ['“Brrr! My fur… But it’s the most beautiful waterfall I’ve ever seen!”'],
      pon: ['“Pon! A free shower! … My belly is all wet.”'],
      chapu: ['“Chapuuu! Again! Shall we go under it again?”'],
      gao: ['“Gao! A guardian isn’t afraid of water… even cold water.”'],
      fuwa: ['“Fuwa… The water sings like the sea back home.”'],
      saya: ['“Mountain water… It comes down from Aso, from far away. It has traveled a long time.”'],
    },
    miroirTrouve: ['Resting on a flat stone against the cliff, just above the water: an old round bronze mirror!', 'Its back is decorated with a sun. It still shines, as if it had kept a little light…', 'You put it carefully in your bag.'],
    miroirCompagnon: {
      kon: ['“A round mirror… like the one the gods hung in front of Amaterasu’s cave! Let’s bring it to the prayer place, facing the cave.”'],
      pon: ['“Ooh, shiny! Can we sell it? … No? Fine. The shrine’s priest will know what to do with it.”'],
      chapu: ['“I saw it shine from the water! It looks very, very old… Let’s show it at the shrine!”'],
      gao: ['“Gao… A sacred mirror. It wants to go back near the goddess’s cave, I can feel it.”'],
      fuwa: ['“Fuwa! It shines like my pearl… It’s calling the sun.”'],
      saya: ['“The moss kept it for a long time… It belongs to the cave of the sun, on the other side of the Iwato River.”'],
    },
    chiho: ['Welcome to Chiho no Ie! Here we eat nagashi-sōmen: noodles that flow down a bamboo pipe with cold water.', 'You catch them with your chopsticks as they pass. Want to try?'],
    chihoEncore: ['More noodles? Have a seat!'],
    chihoNon: ['As you like! They flow all summer long.'],
    chihoNuit: ['The restaurant is closed, sorry! Come back tomorrow for the noodles.'],
    somenRegle: ['The noodles come down from the top, with the water…', 'When they pass right in front of you: quick, catch them! You need three.'],
    somenAide: (n) => `A (or tap the screen) when the noodles pass in front of you! ${n}/3`,
    somenRate: (n) => `Missed! Wait until they’re right in front of you… ${n}/3`,
    somenPerdu: ['Oh, they all went by! Never mind: it takes a little practice.', 'Talk to me again when you want another go!'],
    somenGagne: ['Well done! Three, caught on the fly! Dip them in the sauce and… mmm, so fresh!', 'In Japan, people slurp their noodles loudly: it means they’re good.'],
    somenCompagnon: {
      kon: ['“Zuzuzu… Excuse me. But it really is delicious.”'],
      pon: ['“More! More! I could eat a hundred!”'],
      chapu: ['“Swimming noodles! Like little white fish!”'],
      gao: ['“Gao! Caught like prey! I’m proud of you.”'],
      fuwa: ['“Fuwa… They slide like the rivers of the sky.”'],
      saya: ['“The bamboo, the cold mountain water… The plants are happy to be useful.”'],
    },
    somenTable: ['Bowls of sauce, chopsticks, green onion and ginger.', 'On the post, the sign: “流しそうめん”, flowing noodles.'],
    the: ['A tea field, in neatly trimmed rows.', 'Here they make kamairi-cha (釜炒り茶): the leaves are roasted in a big iron pan instead of being steamed. It tastes mellow and a little toasty.'],
    jizo: ['A row of jizō statues, guardians of travelers and children.', 'Local people knit them caps and sew them red bibs, so they won’t be cold.'],
    bambous: ['A bamboo grove. When the wind blows, the stalks knock softly together: tok… tok…', 'A bamboo shoot can grow a whole meter in a single day!'],
    puits: ['An old stone well, with its little wooden roof, its pulley and its bucket.', 'Its water stays cold even in midsummer: people used to chill watermelons in it.'],
    fermiere: ['Hello! I’m picking the tea shoots, the most tender ones, at the tips of the rows.', 'We roast them by hand in an iron pan: that’s Takachiho’s kamairi-cha. It smells of hazelnut!'],
    fermiereNuit: ['Too dark to pick now… The leaves are sleeping.', 'Tomorrow morning they’ll be covered in dew.'],
    kaguraJour: ['Hello! Here, every night, we dance the Takachiho kagura: the story of Amaterasu’s cave.', 'The sun goddess had shut herself in a cave, and the world was plunged into darkness…', 'Would you like to stay until tonight to see the show?'],
    kaguraNon: ['All right. The show begins every evening, when night falls.'],
    kaguraSoir: ['Night has fallen. The dancers are getting ready… Come and see me when you want it to start!'],
    kaguraNuit: ['The dancers are ready. Shall we begin?'],
    kaguraChoix: ['Watch the kagura', 'Bring back the morning', 'Nothing'],
    kaguraMatin: ['The show is over for tonight. The sun is rising over the gorge…'],
    kaguraSpectacle: ['The flute rises, the drum booms. On the stage, Uzume dances, her bells in hand…', 'She dances so joyfully that the eight million gods burst out laughing.', 'Curious, Amaterasu opens her cave door a crack… Tajikarao, the god of strength, grabs the stone and tears it away!', 'And light returns to the world.'],
    kaguraFin: ['The dancers bow. During the winter festivals, thirty-three dances like this are performed from evening until morning in the villages of Takachiho.'],
    kaguraCompagnon: {
      kon: ['“What a dance! The gods must have laughed really hard.”'],
      pon: ['“Pon pon! I dance like Uzume too! … Don’t laugh!”'],
      chapu: ['“The bells! Shan shan shan! I want to dance too!”'],
      gao: ['“Gao! Tajikarao is strong like a guardian. I like him.”'],
      fuwa: ['“Fuwa… The light always comes back, even after the darkest night.”'],
      saya: ['“A very old story… The trees here have heard it a thousand times, and they never tire of it.”'],
    },
    meoto: ['The wedded cedars (夫婦杉): two tall cedars grown from one root.', 'They say that if you walk around them three times with someone you love, you’ll stay together forever.', 'Walk around them three times with your companion?'],
    meotoFin: ['One, two, three times around! The two cedars have stood side by side for eight hundred years.'],
    meotoCompagnon: {
      kon: ['“You and me, companions forever! … That was a promise, wasn’t it?”'],
      pon: ['“Pon! I’m dizzy… but it’s for a good cause!”'],
      chapu: ['“One more time! Going round is like swimming in circles!”'],
      gao: ['“Gao! I will watch over you forever. I swear it.”'],
      fuwa: ['“Fuwa… We fly together, now and always.”'],
      saya: ['“Two trees, one root… Like the two of us, now.”'],
    },
    tas: ['You set a stone, very gently, on a little pile.', 'Here, in the gods’ cave (天安河原), visitors stack stones as they make a wish.', 'This is where the eight million gods met to find a way to bring Amaterasu out of her cave.'],
    tasEncore: ['One more stone, one more wish. The little pile holds!'],
    tasCompagnon: {
      kon: ['“I made a wish too… but it’s a fox secret.”'],
      pon: ['“I wished for a huge feast! … What? It’s a serious wish.”'],
      chapu: ['“I wished to swim in every river in Japan!”'],
      gao: ['“Gao… I wished that you’d never be in danger.”'],
      fuwa: ['“Fuwa… I wished to see the sea again.”'],
      saya: ['“River stones… They’ve been listening to wishes for thousands of years.”'],
    },
    yohai: ['The prayer place facing the cave (天岩戸遥拝所).', 'Across the Iwato River, in the cliff, a crack closed by a boulder: the cave where Amaterasu, the sun goddess, shut herself away.', 'No one may go there: people greet it from here. By the little torii stand the sacred tree, a sakaki, and the offering table.'],
    yohaiNuit: ['At night the cliff is pitch black. You can barely make out the cave across the river…', 'The sakaki, the sacred tree, shivers in the wind.'],
    yohaiApres: ['The mirror shines on the sakaki, facing the cave. The stone door is ajar.', 'It looks as if a little light still spills out…'],
    yohaiNuitMiroir: ['It’s too dark: the mirror wouldn’t reflect any light.', 'You should hang it on the sakaki while the sun is shining.'],
    accrocher: ['You hang the mirror on a branch of the sakaki, facing Amaterasu’s cave.', 'Just as the gods did, a very, very long time ago…'],
    eclipse: ['Suddenly the sky grows dark… The sun disappears, like the day Amaterasu shut herself in her cave!'],
    coqs: ['In the shrine, the roosters all start crowing together: “Kokekokkō!”'],
    danse: {
      kon: ['“My turn to dance, like Uzume! Watch closely!”'],
      pon: ['“Pon! Pon! My belly dance will make all the gods laugh!”'],
      chapu: ['“Chapu! Hop, hop, I’m dancing! Come, sun, come!”'],
      gao: ['“Gao! The guardian’s dance! Come out of your cave, goddess!”'],
      fuwa: ['“Fuwa, fuwa! I dance in the air for you, sun!”'],
      saya: ['“Saya… Dancing like leaves in the wind… Come back, light…”'],
    },
    lumiere: ['A rumble… The stone door of the cave slides open!', 'Golden light bursts out and floods the valley. The sun is back!'],
    kobanLueur: ['On the offering table, something is shining…'],
    miroirMerci: {
      kon: ['“You replayed the oldest story in Japan… The gods thank you, I’m sure of it.”'],
      pon: ['“Pon! I made the sun laugh! … Well, the two of us did.”'],
      chapu: ['“The sun is back! The river is shining again!”'],
      gao: ['“Gao… The light is back. Mission accomplished, traveler.”'],
      fuwa: ['“Fuwa… My pearl is shining brighter than ever.”'],
      saya: ['“Every leaf is turning toward the light… Thank you.”'],
    },
    legende: ['A koban, an old gold coin.', 'This is the myth of the heavenly cave (天岩戸): to bring Amaterasu out, the gods hung a mirror and jewels on a sacred tree, made the roosters crow, and Uzume danced.', 'That mirror is said to be one of the three sacred treasures of the emperor of Japan.'],
    videaste: ['Hi! I’m @random_japan_place. I’m filming Manai Falls for my video.', 'Want to see it?'],
    videasteNon: ['No problem! Enjoy your walk in the gorge!'],
    videasteApres: ['Thanks for watching! Follow me to see more places in Japan!'],
    haiden: ['You ring the bell, bow twice, clap twice, and bow once more.', 'Amanoiwato Shrine honors Amaterasu, the sun goddess, ancestor of the emperors of Japan.'],
    haidenNuit: ['In the night, the lanterns softly light the prayer hall. All is calm.'],
    chozu: ['The purification basin. A bronze dragon spouts clear water.', 'Before praying, you rinse your hands and mouth with the bamboo ladle.'],
    shinboku: ['A huge cedar wrapped in its sacred rope: the shrine’s divine tree.', 'It is over six hundred years old. Its bark is soft and warm.'],
    statue: ['The statue of Tajikarao, the god of strength.', 'He tore away the stone door of Amaterasu’s cave and threw it so far… that it is said to have landed in Togakushi, hundreds of kilometers away!'],
    kihachi: ['Kihachi’s strength stone (鬼八の力石): a two-hundred-ton boulder.', 'Kihachi was a demon who terrorized the area. He lifted this stone like a pebble, to show off his strength.', 'The hero Mikeiri-no-mikoto finally defeated him. A sacred rope now surrounds the stone.'],
    vueCascade: ['The waterfall lookout.', 'Manai Falls drops into the emerald gorge, between the basalt columns.', 'These columns are lava from Mount Aso: as it cooled, it split into regular prisms, like tightly packed pencils.'],
    vueCascadeNuit: ['At night you hear the waterfall without seeing it. A few lanterns are reflected in the black water.'],
    yaritobi: ['The “spear jump” (槍飛).', 'This is the narrowest point of the gorge: only a few meters. They say the demon Kihachi, on the run, vaulted from one rim to the other on his spear.'],
    koi: ['Carp swim in Onokoro Pond. There’s even a sturgeon, with its long snout!', 'This pond is what spills over the cliff: Manai Falls.'],
    koiNuit: ['You can just make out the carp sleeping at the bottom of the pond.'],
    escalierBas: ['The boat pontoon, at the very bottom of the gorge. The basalt walls rise straight up to the sky.', 'The boat renter waits by his hut.'],
    famille: ['We’re having sōmen as a family! My son misses every single one, ha ha!', 'Chiho no Ie has been sending noodles down its bamboo for more than fifty years.'],
    familleNuit: ['We’re staying a little longer. At night you can hear the waterfall from here.'],
    petit: ['I caught one! … No, it got away.', 'It’s too hard, they’re too fast!'],
    petitNuit: ['I want more noodles…'],
    boutique: ['Welcome! We have little mirrors, lucky magatama, and Takachiho sake!', 'Have you seen the night kagura? It’s at the shrine, to the north, past the forest.'],
    boutiqueNuit: ['The shop is closing! … But go and see the kagura at the shrine: it starts at nightfall.'],
    guide: ['Hello! I’m a volunteer guide for the gorge.', 'These basalt cliffs are up to a hundred meters high. Lava from Mount Aso flowed all the way here, and the Gokase River slowly carved through it.', 'See the big stone with the rope? That’s the demon Kihachi’s stone.'],
    guideNuit: ['At night the gorge belongs to the kajika frogs. Listen: they sound like birds singing!'],
    randonneur: ['I’m doing the gorge trail: a kilometer along the edge, under the trees.', 'In autumn the maples turn bright red. It’s the most beautiful season!'],
    randonneurNuit: ['It’s dark… I’m heading back to the inn. Watch your step!'],
    photographe: ['I came all the way from Australia to photograph Manai Falls. It’s even more beautiful in real life!', 'The best moment is when the sun reaches into the gorge: the water turns emerald green.'],
    photographeNuit: ['At night I photograph the stars above the gorge. Look up there!'],
    touriste: ['It’s my first time in Takachiho! Apparently you can row a boat right up to the falls.', 'The pontoon is at the bottom of the big staircase, on the other side of the bridge.'],
    touristeNuit: ['They say the night kagura is magical. I’m going to see it!'],
    eleve: ['Do you know why the pond is called “Onokoro”? In the legends, it’s the name of the first island the gods created!', 'And the carp are all fat because people feed them.'],
    eleveNuit: ['Mom told me to be home before dark… Oops.'],
    grandpere: ['I’ve come here every day for fifty years. I never get tired of the waterfall.', 'When I was little, on sunny days, I used to see something glinting down below, under the cliff, upstream of the falls.', 'Nobody ever found out what it was… Maybe you could see it from a boat.'],
    grandpereNuit: ['Listen to the waterfall… It sings louder at night.'],
    pretre: ['Welcome to Amanoiwato Shrine. We honor Amaterasu here, the sun goddess.', 'Long ago, angry with her brother Susanoo, she shut herself in a cave, and the world went dark.', 'To bring her out, the gods hung a mirror and jewels on a sacred tree in front of the cave. The roosters crowed, Uzume danced…', 'They say that one day, one of those mirrors was swept away by the river. No one has ever found it.'],
    pretreNuit: ['At night, Amaterasu’s cave sleeps. The kagura is danced on the stage, to the west of the shrine.'],
    miko: ['Hello! Here are magatama, comma-shaped jewels: they bring good luck.', 'With the mirror and the sword, they are the three sacred treasures of Japan.'],
    mikoNuit: ['The charm office is closed. Good night!'],
    couple: ['We just walked three times around the wedded cedars, my fiancé and I!', 'He went to buy good-luck charms. Apparently it works every time…'],
    coupleNuit: ['We’re staying to see the kagura. It’s our first trip together!'],
    vieille: ['I stack a stone here every year, for my grandchildren.', 'You try too: set a stone on the little pile by the path, and make a wish.'],
    vieilleNuit: ['It’s dark in the cave… But the stones keep our wishes, even at night.'],
    uzume: ['I dance Uzume, the goddess who made the gods laugh!', 'Tonight I dance to bring back the sun… just like long, long ago.'],
    tajikarao: ['I am Tajikarao, the god of strength! Hoo!', 'When Amaterasu opened the door a crack, I ripped it away with my bare hands and threw it far away!'],
    fue: ['The kagura flute sings like the wind in the cedars.'],
    taikoK: ['The drum keeps the rhythm of the dance. Don, don, ka-ka!', 'During the winter festivals, we play all night long, until morning.'],
    coq: ['A shrine rooster struts about, its comb bright red, its tail plumed.', 'These are the “long-crowing birds” of the myth: their crowing helped bring Amaterasu out of her cave.'],
    poule: ['A hen pecks at the gravel. At the shrine, the roosters and hens roam free.'],
    libellule: ['A red dragonfly (akatombo) is resting. In Japan, they herald autumn.'],
  },
  ja: {
    noms: { batelier: 'ボートやさん', chiho: '千穂の家の　おばさん', famille: 'お母さん', petit: '男の子', boutique: 'おみやげやさん', videaste: '@random_japan_place', guide: 'ボランティアガイドさん', fermiere: '茶つみの　おばさん', randonneur: 'ハイカーさん', photographe: 'カメラマンさん', touriste: '観光客', eleve: '小学生', grandpere: 'おじいさん', pretre: '神主さん', miko: '巫女さん', kagura: '神楽の　師匠', uzume: 'ウズメ', tajikarao: 'タヂカラオ', fue: '笛の　人', taikoK: '太鼓の　人', couple: 'わかい　女の人', vieille: 'おばあさん' },
    tampons: { barque: ['真名井の滝', '真名井の滝の　下まで　ボートを　こぐ'], somen: ['流しそうめん', '竹の　そうめんを　つかまえる'], kagura: ['夜神楽', '夜、神社で　神楽を　見る'], meoto: ['夫婦杉', '夫婦杉の　まわりを　三回　まわる'], ishi: ['天安河原', '天安河原に　石を　つむ'] },
    'panneau-cascade': ['「真名井の滝」', '高さ　17メートルから　峡谷に　落ちる　滝。「日本の滝百選」の　ひとつです。', '天村雲命（あめのむらくものみこと）が　天から　おりた　とき、ここには　水が　なかったので、天の　水を　すこし　うつした……それが　おのころ池の　はじまりと　いわれます。'],
    'panneau-gorge': ['「高千穂峡」', '12万年前、阿蘇山の　溶岩が　ここまで　ながれて　きました。ひえる　ときに　六角形の　柱に　われました（柱状節理）。', '五ヶ瀬川が　それを　けずって、高さ　80〜100メートルの　せまい　谷に　なりました。'],
    'panneau-etang': ['「おのころ池」', 'この　池の　水が　がけから　落ちて、真名井の滝に　なります。', '鯉や……チョウザメも　いますよ！'],
    'panneau-barques': ['「貸しボート」', '30分。一そうに　三人まで。', '滝の　下には　入らないで……ぬれるのが　すきな　人は　べつ！'],
    'panneau-kihachi': ['「鬼八の力石」', '重さ　200トン。鬼八という　鬼が、力を　見せる　ために　もちあげたと　いわれます。'],
    'panneau-yaritobi': ['「槍飛」', '峡谷で　いちばん　せまい　ところ。鬼八が　槍を　つかって、こちらの　岸から　あちらの　岸へ　とびうつって　にげたと　いわれます。'],
    'panneau-yasu': ['「天安河原」', 'この　大きな　洞窟に、八百万の　神さまが　あつまって、天照大御神を　岩戸から　出す　方法を　話しあいました。', 'おとずれた　人は、ねがいごとを　しながら　石を　つみます。'],
    'panneau-yohai': ['「天岩戸遥拝所」', '岩戸川の　むこう岸に、天照大御神が　かくれた　岩戸が　あります。', '近くへは　行けません。ここから　おまいり　します。'],
    'panneau-meoto': ['「夫婦杉」', '一つの　根から　生えた　二本の　杉。すきな　人と　三回　まわると、ずっと　いっしょに　いられると　いわれます。'],
    'panneau-tajikarao': ['「手力雄命（たぢからおのみこと）」', '天岩戸の　岩の　とびらを　ひきあけた、力の　神さま。'],
    batelier: ['こんにちは！　ボートで　真名井の滝を　近くで　見て　みる？', 'がけの　下、エメラルド色の　水の　上を　30分。どう？'],
    batelierEncore: ['もう　いちど　ボート？　よろこんで！'],
    batelierNon: ['いいよ。ボートは　ここで　まって　いるからね！'],
    batelierNuit: ['今夜は　もう　おしまい。ボートも　川も　ねむって　いるよ……', 'あしたの　朝、また　おいで！'],
    ramerOrdi: ['前（W か ↑）で　こぐ、うしろで　ゆっくり。左と　右で　まがる。', '滝の　下まで　行って　ごらん……　晴れた　日は、上流の　がけを　よく　見て。何かが　光るって　いう　うわさだよ。', 'ボートを　かえす　ときは、さん橋に　もどってね。'],
    ramerTel: ['ジョイスティックを　前に　たおすと　こぐ、よこで　まがる。', '滝の　下まで　行って　ごらん……　晴れた　日は、上流の　がけを　よく　見て。何かが　光るって　いう　うわさだよ。', 'ボートを　かえす　ときは、さん橋に　もどってね。'],
    accoster: ['ボートを　かえす？'],
    accosterFin: ['ありがとう！　滝、きれいだった？'],
    sousCascade: ['ザブーン！　ボートが　真名井の滝の　下を　とおる……', '17メートルの　高さから、千本の　銀の　糸の　ように　水が　落ちる。びしょぬれ、でも　すごい　ながめ！'],
    sousCascadeCompagnon: {
      kon: ['「ぶるる！　毛が……でも、こんなに　きれいな　滝は　はじめてです！」'],
      pon: ['「ポン！　ただの　シャワーだ！　……おなかが　びしょびしょ。」'],
      chapu: ['「チャプー！　もう　いっかい！　また　下を　とおろう？」'],
      gao: ['「ガオ！　まもりがみは　水なんか　こわくない……つめたくても。」'],
      fuwa: ['「ふわ……水が、ふるさとの　海みたいに　うたって　いる。」'],
      saya: ['「山の　水……阿蘇から、とおくから　くだって　きた。ながい　旅を　して　きたんだね。」'],
    },
    miroirTrouve: ['がけの　下、水の　すぐ　上の　平らな　石に、ふるい　まるい　青銅の　かがみが！', 'うらには　お日さまの　もよう。まだ　光って　いる……光を　すこし　しまって　いる　みたい。', 'だいじに　リュックに　しまった。'],
    miroirCompagnon: {
      kon: ['「まるい　かがみ……神さまたちが　天岩戸の　前に　かけた　かがみの　ようです！　岩戸の　前の　遥拝所へ　もって　いきましょう。」'],
      pon: ['「わあ、ぴかぴか！　売れる？　……だめ？　じゃあ、神社の　神主さんに　聞いて　みよう。」'],
      chapu: ['「水の　上から　光るのが　見えたよ！　すごく　ふるそう……神社に　もって　いこう！」'],
      gao: ['「ガオ……神聖な　かがみだ。女神の　岩戸の　そばに　かえりたがって　いる。」'],
      fuwa: ['「ふわ！　ぼくの　真珠みたいに　光ってる……お日さまを　よんで　いるよ。」'],
      saya: ['「コケが　ながい　あいだ　まもって　いた……岩戸川の　むこうの、お日さまの　洞窟の　ものだよ。」'],
    },
    chiho: ['千穂の家へ　ようこそ！　ここでは　流しそうめん。竹の　中を、つめたい　水と　いっしょに　そうめんが　ながれて　くるの。', 'とおる　ときに　おはしで　つかまえるのよ。やって　みる？'],
    chihoEncore: ['もっと　そうめん？　すわって！'],
    chihoNon: ['いいのよ！　夏の　あいだ　ずっと　ながれて　いるから。'],
    chihoNuit: ['ごめんね、もう　しまって　いるの！　そうめんは　また　あした。'],
    somenRegle: ['上から　水と　いっしょに　そうめんが　ながれて　くる……', '目の　前を　とおる　とき、すばやく　つかまえて！　三つで　せいこう。'],
    somenAide: (n) => `そうめんが　目の　前に　来たら　A（または　画面を　タッチ）！　${n}/3`,
    somenRate: (n) => `はずれ！　ちょうど　目の　前に　来るまで　まって……　${n}/3`,
    somenPerdu: ['あら、ぜんぶ　ながれて　いっちゃった！　だいじょうぶ、れんしゅうが　いるのよ。', 'また　やりたく　なったら　声を　かけてね！'],
    somenGagne: ['すごい！　三つも　つかまえた！　つゆに　つけて……ん〜、つめたくて　おいしい！', '日本では　そうめんを　ズズッと　音を　たてて　すするの。おいしいって　いう　しるし。'],
    somenCompagnon: {
      kon: ['「ズズズ……しつれい。でも、ほんとうに　おいしいです。」'],
      pon: ['「もっと！　もっと！　百ぱい　たべられる！」'],
      chapu: ['「およぐ　そうめん！　白い　小さな　魚みたい！」'],
      gao: ['「ガオ！　えものの　ように　つかまえた！　ほこらしいぞ。」'],
      fuwa: ['「ふわ……空の　川みたいに　すべって　いく。」'],
      saya: ['「竹と、山の　つめたい　水……植物たちも　やくに　たてて　うれしそう。」'],
    },
    somenTable: ['つゆの　おわんと、おはし、ねぎ、しょうが。', 'はしらに　「流しそうめん」の　かんばん。'],
    the: ['きれいに　かりこまれた　茶畑。', 'ここでは　釜炒り茶（かまいりちゃ）を　つくる。葉っぱを　むすのでは　なく、大きな　鉄の　かまで　いるんだ。やさしくて、こうばしい　味。'],
    jizo: ['ならんだ　お地蔵さま。旅人と　子どもを　まもって　くれる。', '村の　人が　毛糸の　ぼうしを　あんだり、赤い　よだれかけを　ぬったり　して　いる。さむく　ない　ように。'],
    bambous: ['竹やぶ。風が　ふくと、竹が　そっと　ぶつかる。コン……コン……', 'たけのこは　一日で　1メートルも　のびる　ことが　あるんだって！'],
    puits: ['古い　石の　井戸。木の　小さな　屋根と、かっしゃと、つるべ。', '夏でも　水が　つめたい。むかしは　スイカを　ひやして　いたよ。'],
    fermiere: ['こんにちは！　いちばん　やわらかい　茶の　新芽を　つんで　いるの。', 'ここでは　鉄の　かまで、手で　いるのよ。高千穂の　釜炒り茶。ナッツの　ような　いい　かおり！'],
    fermiereNuit: ['くらくて　もう　つめないわ……葉っぱも　ねむって　いる。', 'あしたの　朝は、つゆで　いっぱいよ。'],
    kaguraJour: ['こんにちは！　ここでは　毎晩、高千穂の　夜神楽を　まいます。天岩戸の　お話です。', 'お日さまの　女神が　岩戸に　かくれて、世界が　まっくらに　なって　しまった……', '今夜まで　のこって、神楽を　見て　いきますか？'],
    kaguraNon: ['わかりました。神楽は　毎晩、日が　くれたら　はじまりますよ。'],
    kaguraSoir: ['夜に　なりました。まい手たちが　じゅんびを　して　います……はじめたく　なったら、声を　かけて　ください！'],
    kaguraNuit: ['まい手の　じゅんびが　できました。はじめましょうか？'],
    kaguraChoix: ['神楽を　見る', '朝に　もどす', 'なにも　しない'],
    kaguraMatin: ['今夜の　神楽は　おしまい。峡谷に　朝日が　のぼります……'],
    kaguraSpectacle: ['笛が　なり、太鼓が　ひびく。舞台の　上で、すずを　もった　ウズメが　まう……', 'あまりに　たのしそうに　まうので、八百万の　神さまたちが　どっと　わらった。', 'ふしぎに　思った　天照大御神が　岩戸を　すこし　あけると……力の　神、タヂカラオが　岩を　つかんで　ひきあけた！', 'そして　世界に　光が　もどった。'],
    kaguraFin: ['まい手たちが　おじぎを　する。冬の　お祭りでは、高千穂の　村々で　夜から　朝まで、三十三番の　神楽が　まわれます。'],
    kaguraCompagnon: {
      kon: ['「すばらしい　まいでした！　神さまたちも　大わらい　したでしょうね。」'],
      pon: ['「ポンポン！　ぼくも　ウズメみたいに　おどれるよ！　……わらわないで！」'],
      chapu: ['「すず！　シャンシャンシャン！　わたしも　おどりたい！」'],
      gao: ['「ガオ！　タヂカラオは　まもりがみの　ように　強い。すきだな。」'],
      fuwa: ['「ふわ……どんなに　くらい　夜の　あとでも、光は　かならず　もどって　くるんだね。」'],
      saya: ['「とても　ふるい　お話……ここの　木は　千回も　聞いて　いるのに、まだ　あきないんだって。」'],
    },
    meoto: ['夫婦杉：一つの　根から　生えた、二本の　大きな　杉。', 'すきな　人と　三回　まわると、ずっと　いっしょに　いられると　いわれます。', 'なかまと　三回　まわって　みる？'],
    meotoFin: ['一回、二回、三回！　二本の　杉は　800年も　ならんで　立って　いる。'],
    meotoCompagnon: {
      kon: ['「あなたと　わたし、ずっと　なかまです！　……やくそくですよ？」'],
      pon: ['「ポン！　目が　まわる……でも　いいことの　ため！」'],
      chapu: ['「もう　いっかい！　まわるのって、ぐるぐる　およぐ　みたい！」'],
      gao: ['「ガオ！　ずっと　きみを　まもる。ちかうよ。」'],
      fuwa: ['「ふわ……いつまでも　いっしょに　とぼうね。」'],
      saya: ['「二本の　木、一つの　根……いまの　ぼくたちみたい。」'],
    },
    tas: ['小さな　石の　山に、そっと　石を　つんだ。', 'ここ　天安河原では、ねがいごとを　しながら　石を　つみます。', '八百万の　神さまが、天照大御神を　岩戸から　出す　方法を　話しあった　場所です。'],
    tasEncore: ['もう　ひとつ　石を、もう　ひとつ　ねがいを。小さな　山は　くずれない！'],
    tasCompagnon: {
      kon: ['「わたしも　ねがいました……キツネの　ひみつです。」'],
      pon: ['「ごちそう　いっぱいって　ねがった！　……なに？　まじめな　ねがいだよ。」'],
      chapu: ['「日本じゅうの　川で　およげますように！」'],
      gao: ['「ガオ……きみが　あぶない　目に　あいませんように。」'],
      fuwa: ['「ふわ……また　海が　見られますように。」'],
      saya: ['「川の　石……何千年も　ねがいを　聞いて　きたんだよ。」'],
    },
    yohai: ['天岩戸遥拝所（ようはいじょ）。', '岩戸川の　むこう、がけの　中に、岩で　ふさがれた　すきま。お日さまの　女神、天照大御神が　かくれた　岩戸です。', '近くへは　行けないので、ここから　おまいり　します。小さな　鳥居の　そばに、神聖な　木の　さかきと、おそなえの　台。'],
    yohaiNuit: ['夜の　がけは　まっくら。川の　むこうの　岩戸も　ほとんど　見えない……', '神聖な　さかきが　風に　ふるえて　いる。'],
    yohaiApres: ['さかきに　かけた　かがみが、岩戸の　ほうを　むいて　光って　いる。岩の　とびらは　すこし　あいた　まま。', 'まだ　すこし　光が　もれて　いる　みたい……'],
    yohaiNuitMiroir: ['くらすぎる……かがみが　光を　はねかえせない。', 'お日さまが　出て　いる　ときに、さかきに　かけないと。'],
    accrocher: ['さかきの　えだに、天岩戸の　ほうへ　むけて、かがみを　かけた。', 'むかし　むかし、神さまたちが　した　ように……'],
    eclipse: ['とつぜん　空が　くらく　なった……天照大御神が　岩戸に　かくれた　日の　ように、お日さまが　きえた！'],
    coqs: ['神社の　ニワトリたちが、いっせいに　ないた。「コケコッコー！」'],
    danse: {
      kon: ['「こんどは　わたしが　ウズメの　ように　まいます！　よく　見て！」'],
      pon: ['「ポン！　ポン！　ぼくの　はらつづみで、神さまみんな　大わらい！」'],
      chapu: ['「チャプ！　ぴょん　ぴょん　おどるよ！　来て、お日さま！」'],
      gao: ['「ガオ！　まもりがみの　まいだ！　女神よ、岩戸から　出て　こい！」'],
      fuwa: ['「ふわ　ふわ！　お日さまの　ために　空で　おどるよ！」'],
      saya: ['「サヤ……風の　中の　葉っぱの　ように　まう……光よ、もどって……」'],
    },
    lumiere: ['ゴゴゴ……岩戸の　岩の　とびらが　ひらいた！', '金色の　光が　あふれて、谷いっぱいに　ひろがる。お日さまが　もどった！'],
    kobanLueur: ['おそなえの　台の　上で、何かが　光って　いる……'],
    miroirMerci: {
      kon: ['「日本で　いちばん　ふるい　お話を、もう　いちど　おこしましたね……神さまたちも　きっと　よろこんで　います。」'],
      pon: ['「ポン！　お日さまを　わらわせた！　……ふたりでね。」'],
      chapu: ['「お日さまが　もどった！　川が　また　きらきら！」'],
      gao: ['「ガオ……光が　もどった。任務　完了だ、旅人よ。」'],
      fuwa: ['「ふわ……ぼくの　真珠が、いままでで　いちばん　光ってる。」'],
      saya: ['「ぜんぶの　葉っぱが　光の　ほうを　むいて　いる……ありがとう。」'],
    },
    legende: ['小判。むかしの　金貨だ。', '「天岩戸」の　神話。天照大御神を　出す　ため、神さまたちは　さかきに　かがみと　まがたまを　かけ、ニワトリを　なかせ、ウズメが　まった。', 'その　かがみは、天皇の　三種の神器の　ひとつと　いわれて　いる。'],
    videaste: ['やあ！　@random_japan_place です。ビデオの　ために　真名井の滝を　とって　いるんだ。', '見て　みる？'],
    videasteNon: ['だいじょうぶ！　峡谷の　さんぽを　たのしんでね！'],
    videasteApres: ['見て　くれて　ありがとう！　フォロー　して、日本の　いろんな　場所を　見てね！'],
    haiden: ['すずを　ならして、二回　おじぎ、二回　はくしゅ、もう　一回　おじぎ。', '天岩戸神社は、天皇の　祖先と　される　お日さまの　女神、天照大御神を　まつって　います。'],
    haidenNuit: ['夜、ちょうちんが　拝殿を　やさしく　てらして　いる。とても　しずか。'],
    chozu: ['手水舎（ちょうずや）。青銅の　竜が　きれいな　水を　はいて　いる。', 'おまいりの　前に、竹の　ひしゃくで　手と　口を　きよめます。'],
    shinboku: ['しめなわを　まいた、大きな　杉。神社の　ご神木だ。', '600年　いじょう　生きて　いる。木の　はだが　やわらかくて　あたたかい。'],
    statue: ['力の　神さま、タヂカラオの　像。', '天岩戸の　岩の　とびらを　ひきあけて、とおくへ　投げた……何百キロも　はなれた　戸隠（とがくし）に　落ちたと　いわれて　いるよ！'],
    kihachi: ['鬼八の力石：重さ　200トンの　岩。', '鬼八は、このあたりを　あらした　鬼。力を　見せる　ため、この　岩を　小石の　ように　もちあげた。', 'さいごは　英雄の　三毛入野命（みけいりのみこと）に　たおされた。いまは　しめなわが　まいて　ある。'],
    vueCascade: ['滝の　展望所。', '真名井の滝が、柱状節理の　あいだを　エメラルド色の　峡谷へ　落ちて　いく。', 'この　柱は　阿蘇山の　溶岩。ひえる　ときに、えんぴつを　たばねた　ような　柱に　われたんだ。'],
    vueCascadeNuit: ['夜は　滝の　音だけが　聞こえる。黒い　水に　ちょうちんが　うつって　いる。'],
    yaritobi: ['「槍飛（やりとび）」。', '峡谷で　いちばん　せまい　ところ。おわれた　鬼八が、槍を　ついて　こちらから　あちらへ　とびうつったと　いわれます。'],
    koi: ['おのころ池に　鯉が　およいで　いる。はなの　長い　チョウザメも　いる！', 'この　池の　水が　がけから　落ちて、真名井の滝に　なる。'],
    koiNuit: ['池の　そこで　鯉が　ねむって　いるのが　かすかに　見える。'],
    escalierBas: ['峡谷の　いちばん　下、ボートの　さん橋。柱状節理の　かべが　空まで　まっすぐ　のびて　いる。', 'ボートやさんが　小屋の　そばで　まって　いる。'],
    famille: ['家族で　そうめん！　むすこは　ぜんぶ　とりのがして　いるの、あはは！', '千穂の家は　50年　いじょうも　竹で　そうめんを　ながして　いるのよ。'],
    familleNuit: ['もう　すこし　いるわ。夜は　ここから　滝の　音が　聞こえるの。'],
    petit: ['つかまえた！　……あ、にげた。', 'むずかしい！　はやすぎるよ！'],
    petitNuit: ['もっと　そうめん　たべたい……'],
    boutique: ['いらっしゃい！　小さな　かがみ、おまもりの　まがたま、高千穂の　お酒も　ありますよ！', '夜神楽は　見た？　北の、森の　むこうの　神社で　やって　いるの。'],
    boutiqueNuit: ['もう　店じまい！　……でも　神社の　神楽を　見に　いって。日が　くれたら　はじまるわ。'],
    guide: ['こんにちは！　峡谷の　ボランティアガイドです。', 'この　柱状節理の　がけは、高さ　100メートルにも　なります。阿蘇山の　溶岩が　ここまで　ながれて　きて、五ヶ瀬川が　すこしずつ　けずったんです。', 'しめなわの　ついた　大きな　岩が　見える？　鬼八の　石ですよ。'],
    guideNuit: ['夜の　峡谷は　カジカガエルの　もの。聞いて：鳥が　うたって　いる　みたいでしょう！'],
    randonneur: ['峡谷の　遊歩道を　歩いて　いるんだ。木の　下、がけの　ふちを　1キロ。', '秋に　なると　モミジが　まっかに　なる。いちばん　きれいな　季節だよ！'],
    randonneurNuit: ['もう　夜だ……宿に　かえるよ。足もとに　気を　つけて！'],
    photographe: ['真名井の滝を　とりに、オーストラリアから　来たの。ほんものは　もっと　きれい！', 'いちばん　いいのは、お日さまが　峡谷に　さしこむ　とき。水が　エメラルド色に　なるの。'],
    photographeNuit: ['夜は　峡谷の　上の　星を　とるの。上を　見て！'],
    touriste: ['高千穂は　はじめて！　ボートで　滝の　近くまで　行けるんだって。', 'さん橋は、橋の　むこうの　大きな　階段の　下よ。'],
    touristeNuit: ['夜神楽は　まほうみたいだって。見に　いくわ！'],
    eleve: ['池が　どうして　「おのころ」って　いうか　知ってる？　神話で、神さまが　さいしょに　つくった　島の　名前なんだ！', 'それに、鯉が　みんな　太いのは、みんなが　えさを　あげるからだよ。'],
    eleveNuit: ['くらく　なる　前に　かえりなさいって、ママが……　あっ。'],
    grandpere: ['50年　毎日　ここに　来て　いるよ。滝は　見あきないねえ。', '小さい　ころ、晴れた　日には、滝の　上流の　がけの　下で、何かが　光るのが　見えたんだ。', 'なんだったのか、だれも　知らない……ボートからなら　見えるかもね。'],
    grandpereNuit: ['滝の　音を　聞いて　ごらん……夜の　ほうが　大きく　うたうんだ。'],
    pretre: ['天岩戸神社へ　ようこそ。お日さまの　女神、天照大御神を　おまつり　して　います。', 'むかし、弟の　スサノオに　おこって、岩戸に　かくれて　しまい、世界は　まっくらに　なりました。', '神さまたちは　岩戸の　前の　さかきに　かがみと　まがたまを　かけ、ニワトリが　なき、ウズメが　まいました……', 'ある日、その　かがみの　ひとつが　川に　ながされて、だれも　見つけて　いないと　いう　話も　あるのですよ。'],
    pretreNuit: ['夜は、天岩戸も　ねむって　います。神楽は　神社の　西の　舞台で　まわれますよ。'],
    miko: ['こんにちは！　こちらは　まがたま。まがった　形の　玉で、えんぎが　いいんですよ。', 'かがみと　つるぎと　あわせて、日本の　三種の神器です。'],
    mikoNuit: ['授与所は　しまりました。おやすみなさい！'],
    couple: ['婚約者と、夫婦杉を　三回　まわった　ところなの！', 'いま　おまもりを　買いに　いって　いるわ。ぜったい　ききめが　あるんだって……'],
    coupleNuit: ['神楽を　見て　いくの。ふたりで　はじめての　旅行なのよ！'],
    vieille: ['まいとし　ここに　石を　つむのよ。まごたちの　ために。', 'あなたも　やって　ごらん。道の　そばの　小さな　石の　山に　石を　のせて、ねがいごとを　するの。'],
    vieilleNuit: ['洞窟の　中は　くらいね……でも　石は　夜も　ねがいを　まもって　いるのよ。'],
    uzume: ['わたしは　ウズメ。神さまたちを　わらわせた　女神を　まって　います！', '今夜も、お日さまを　よびもどす　ために　まうの……むかし　むかしの　ように。'],
    tajikarao: ['われこそは　力の　神、タヂカラオ！　ホー！', '天照大御神が　とびらを　すこし　あけた　とき、この　手で　ひきあけて、とおくへ　投げたのだ！'],
    fue: ['神楽の　笛は、杉の　森を　ふく　風の　ように　うたいます。'],
    taikoK: ['太鼓が　まいの　リズムを　きざみます。ドン、ドン、カッカ！', '冬の　お祭りでは、朝まで　ひと晩じゅう　たたくんですよ。'],
    coq: ['神社の　オンドリが　歩いて　いる。まっかな　とさか、りっぱな　しっぽ。', '神話の　「常世の長鳴鳥（とこよの　ながなきどり）」。その　なき声が、天照大御神を　岩戸から　出す　手助けを　したんだ。'],
    poule: ['メンドリが　じゃりを　つついて　いる。神社では　ニワトリが　はなしがいに　されて　いる。'],
    libellule: ['赤とんぼが　ひとやすみ。日本では　秋の　しらせだよ。'],
  },
};
