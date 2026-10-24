// ================================================================
//  Gokayama (五箇山) : un village de maisons au toit de chaume (gasshō-zukuri, « les mains jointes en prière »)
//  au fond des montagnes de Toyama, sur une terrasse que la rivière Shō entoure d'un méandre turquoise. Classé au
//  patrimoine mondial avec Shirakawa-gō. Les grands toits pentus (la neige y glisse : il en tombe deux mètres
//  l'hiver), les rizières en terrasses, le petit sanctuaire sous les cèdres, l'atelier de papier (le washi de
//  Gokayama), la danse de la kokiriko (le plus vieux chant populaire du Japon, dit-on), les canons à eau qui protègent
//  les toits du feu, et le belvédère sur le flanc de la montagne d'où l'on voit tout le village. D'après la vidéo du
//  propriétaire (2026-10-23 : le méandre turquoise vu du ciel, les cerisiers, les rizières inondées, le torii et la
//  fête du sanctuaire, les montagnes encore enneigées au printemps).
//  Son secret : le plancher qui sonne creux. Dans la maison-musée, près du foyer, une planche sonne creux sous les
//  pas : dessous, la fosse où l'on fabriquait en secret le salpêtre de la poudre à canon pour le seigneur de Kaga
//  (à l'époque d'Edo, c'était la richesse cachée de Gokayama) ; et, dans un coffre laqué, la bannière rouge des Heike,
//  les guerriers vaincus qui, dit la légende, se sont réfugiés dans ces montagnes en 1185 ; et un koban (tresors.js).
//  Bunbuku, le marchand, attend sous les grands cèdres du sanctuaire.
//  Repère : x vers l'est, z vers le sud, y vers le haut, en mètres ; le village vers y = 0 à 3 (il monte doucement
//  vers l'ouest, la montagne), la rivière à y = −14, au fond de sa gorge. Les distances sont resserrées.
//  ctx : { THREE, atelier, P (palette), peinture }.
// ================================================================
import { creerMonde, interactionsBancs, lisse, hasard, bruitDoux, surLaLigne } from './monde.js';
import { panneau, trepied, PAPIER_PANNEAU } from './decor.js';
import { MATIERES as M } from './textures.js';
import { secretTrouve } from './tresors.js';

const PI = Math.PI;
const TAN60 = Math.sqrt(3), SIN60 = Math.sqrt(3) / 2;
const RIVIERE_Y = -14; // la surface de la rivière Shō
// la rivière, de l'amont (au nord-nord-est) à l'aval (à l'ouest-sud-ouest), autour de la terrasse du village
const RIVIERE = [[55, -175], [72, -120], [84, -62], [88, -5], [80, 48], [55, 84], [12, 100], [-40, 104], [-95, 122], [-150, 165]];

// ---------------------------------------------------------------- Le plan du village
// les maisons au toit de chaume (gasshō) : [id, x, z, largeur (en x), longueur (en z), le côté de la porte] ; leur
// faîte va du nord au sud, comme dans les vrais villages (le vent de la vallée, le soleil sur les deux pentes)
const MAISONS = [
  ['g1', -22, -46, 8, 12, 'est'], ['g2', -46, 6, 8.5, 13, 'est'], ['minshuku', 26, -26, 9, 14, 'ouest'], ['g4', 32, 12, 8, 12.5, 'ouest'],
  ['musee', -16, 22, 9.5, 15, 'est'], ['g6', -40, 40, 8, 12, 'est'], ['g7', 22, 48, 8.5, 13, 'ouest'], ['g8', -6, 60, 7.5, 11, 'est'],
  ['g9', 50, -6, 7.5, 11, 'ouest'], ['k1', -6, -36, 4.4, 5.6, 'est'], ['k2', 44, 46, 4.4, 5.6, 'ouest'],
];
const MUSEE = MAISONS.find((m) => m[0] === 'musee');
const MINSHUKU = MAISONS.find((m) => m[0] === 'minshuku');
// les rizières en terrasses : [x0, x1, z0, z1] (chacune à son niveau, une diguette d'herbe autour)
const RIZIERES = [[-8, 6, -58, -46], [-32, -18, -24, -15], [8, 22, -6, 3], [-34, -22, 4, 13], [-30, -16, 48, 60], [-8, 0, 29, 39], [34, 48, 24, 36], [36, 50, -36, -22], [12, 24, 26, 36]];
// (deux rizières viennent d'être plantées : de l'eau, et de tout petits plants ; le riz des autres est haut et vert)
const RIZ_JEUNE = [1, 5];
// les chemins de terre : le chemin principal (du parking, au nord-est, jusqu'au bord de la berge, au sud) et ses branches
const CHEMIN = [[38, -62], [24, -48], [10, -32], [3, -14], [0, 6], [3, 24], [8, 42], [14, 58], [22, 68]];
const CHEMINS = [
  CHEMIN,
  [[3, -14], [-6, -26], [-20, -30], [-35, -26.5]], // vers le sanctuaire (le torii)
  [[10, -32], [20.6, -26]], // le minshuku
  [[0, 6], [16, 8], [27.3, 12]],
  [[3, 24], [-10.4, 22]], // la maison-musée
  [[0, 6], [-14, 0], [-30, -3], [-41, 6]],
  [[8, 42], [-8, 46], [-22, 44], [-35.3, 40]],
  [[14, 58], [-1.6, 60]],
  [[11, 50], [17, 48]],
  [[27.3, 12], [38, 4], [45.5, -6]],
  [[-20, -30], [-17.3, -46]],
  [[16, 8], [14.5, 15.5]], // la scène de la kokiriko
  [[-26, -28.6], [-33, -36.5], [-36, -46]], // le pied de l'escalier du belvédère
];
// le sanctuaire (地主神社) : son esplanade taillée dans le pied de la montagne, à l'ouest, sous les cèdres ; le torii en
// bas, le sanctuaire tourné vers l'est (vers le village) ; le marchand au nord de l'esplanade
const SANCTUAIRE = { x0: -62, x1: -46, z0: -41, z1: -17, haut: 1.5, sanctuaire: [-55, -26.5], torii: [-36, -26.5], marches: [-46, -44, -26.5] };
const MARCHAND = { x: -52, z: -37, cap: Math.atan2(-44 + 52, -30 + 37) };
const WASHI = { x: -20, z: -7 }; // l'atelier de papier, au bord du ruisseau
const KOKIRIKO = { x: 14, z: 18, l: 4.4, p: 3.2, h: 0.5 }; // la petite scène de la danse
const CASERNE = { x: 14, z: -20 }; // le local des pompiers (消防)
// les canons à eau (放水銃), dans leurs petites cabanes au toit de chaume, entre les maisons
const POMPES = [[-9, -23.5], [16, -40], [-4, 14], [29, 22], [-28, 27], [40, -12], [-30, -38], [6, 52]];
// le ruisseau, de la forêt (à l'ouest, sur le pied de la montagne) jusqu'à la berge de la rivière (à l'est), à travers
// le village : ses points de passage, lissés en courbe (RU, plus bas)
const RUISSEAU = [[-79, -7.5], [-74, -9.8], [-69.5, -8.4], [-64.5, -10.8], [-58, -11.2], [-50, -12], [-34, -13], [-22, -11], [-8, -9], [4, -10], [18, -13], [34, -16], [52, -18], [64, -19]];
// le belvédère, sur le flanc de la montagne, au nord-ouest ; son escalier (ESC, plus bas) part du bord du village
const BELVEDERE = { x: -58.5, z: -64.5, r: 3.4 };
const BELVEDERE_Y = 14.4;
// le parking, au nord-est, au bout de la route qui longe la rivière ; le départ
const PARKING = { x0: 30, x1: 46, z0: -70, z1: -58 };
// la route : du parking, elle file vers le nord et s'enfonce dans la montagne par un tunnel ; on ne la suit pas à pied
// (une barrière à la sortie du parking). Le repère du tunnel : lx le long de sa façade, d vers l'intérieur de la
// montagne (0 : le devant de la façade, d < 0 : la route devant).
const TUN = { x: 39.6, z: -85.5 };
const T_A = Math.atan2(38 - TUN.x, -64 - TUN.z); // le devant de la façade, vers le parking
const T_FX = Math.sin(T_A), T_FZ = Math.cos(T_A), T_LX = Math.cos(T_A), T_LZ = -Math.sin(T_A);
/** Un point du lieu dans le repère du tunnel : [lx, d]. */
const versTunnel = (x, z) => { const dx = x - TUN.x, dz = z - TUN.z; return [dx * T_LX + dz * T_LZ, -(dx * T_FX + dz * T_FZ)]; };
/** Un point du repère du tunnel dans le lieu : [x, z]. */
const duTunnel = (lx, d) => [TUN.x + lx * T_LX - d * T_FX, TUN.z + lx * T_LZ - d * T_FZ];
/** Le tube : sa demi-largeur, la hauteur de ses murs (la voûte en demi-cercle au-dessus), sa longueur dessinée. */
const TUBE = { l: 3.9, mur: 3.3, fond: 16 };
/** La façade : sa profondeur, et ses gradins [demi-largeur, hauteur au-dessus de la chaussée]. */
const FACADE = { prof: 5.0, gradins: [[6.1, 8.3], [7.9, 6.5], [9.6, 4.5]] };
const hautFacade = (lx) => { const a = Math.abs(lx); for (const [l, h] of FACADE.gradins) if (a <= l) return h; return 0; };
/** La chaussée devant la façade ; route(d) : à d (< 0), elle descend doucement vers le parking. */
const T_Y = 0.78;
const routeY = (d) => T_Y + (niveau(38, -64) - T_Y) * Math.min(1, Math.max(0, -d / 21.5));
const DEPART = { x: 34, z: -55 };
// la vue sur le méandre, au sud, au bout du chemin
const VUE_SUD = { x: 22, z: 68 };

// ---------------------------------------------------------------- Le relief
const angle = (x, z) => Math.atan2(x, -z); // 0 au nord, positif vers l'est
/** Le bord de la terrasse du village (le pied de la montagne, ou le haut de la berge), selon l'angle. */
const rayonTerrasse = (a) => 63 + 4 * Math.sin(2 * a + 0.7) + 2 * Math.sin(5 * a + 1);
/** Le niveau de la terrasse : elle monte doucement vers l'ouest (vers la montagne), avec de petites ondulations. */
const niveau = (x, z) => 1.4 - 0.032 * x + 0.2 * Math.sin(0.11 * x + 1) * Math.sin(0.08 * z);
/** La montagne, à u mètres du bord de la terrasse : un pied arrondi, puis une pente de plus de 40°. */
const montagne = (u, a) => (0.9 * u - 18 * (1 - Math.exp(-u / 20))) * (1 + 0.12 * Math.sin(7 * a + 0.4) + 0.06 * Math.sin(17 * a));
/** La gorge de la rivière, à d mètres de son milieu : le fond, l'eau (vers d = 11), puis la berge raide. */
const gorge = (d) => -17 + 0.45 * Math.max(0, d - 8) ** 1.45;

/**
 * La rivière vue de x, z : la distance à son milieu (d), et si l'on est du côté du village (dedans : le point de la
 * rivière le plus proche est plus loin du centre que nous).
 */
function versRiviere(x, z) {
  let d = Infinity, px = 0, pz = 0;
  for (let k = 0; k < RIVIERE.length - 1; k++) {
    const [x0, z0] = RIVIERE[k], [x1, z1] = RIVIERE[k + 1], dx = x1 - x0, dz = z1 - z0;
    const f = Math.min(1, Math.max(0, ((x - x0) * dx + (z - z0) * dz) / (dx * dx + dz * dz)));
    const e = Math.hypot(x - x0 - f * dx, z - z0 - f * dz);
    if (e < d) { d = e; px = x0 + f * dx; pz = z0 + f * dz; }
  }
  return { d, dedans: Math.hypot(px, pz) > Math.hypot(x, z) };
}

/** Le relief naturel : la terrasse, la montagne tout autour, la gorge de la rivière (la berge d'en face remonte). */
function naturel(x, z) {
  const r = Math.hypot(x, z), a = angle(x, z), rT = rayonTerrasse(a);
  const riv = versRiviere(x, z);
  let h = niveau(x, z);
  // la montagne, sauf du côté du village tout près de la rivière : là, la terrasse va jusqu'à la berge
  if (r > rT) h += montagne(r - rT, a) * (riv.dedans ? lisse(26, 50, riv.d) : 1);
  if (riv.d < 60) h = Math.min(h, gorge(riv.d));
  return h;
}

const Y_BELVEDERE = BELVEDERE_Y;
const Y_ESPLANADE = niveau(SANCTUAIRE.x1, -27) + SANCTUAIRE.haut;
/** Le fond d'une rizière (au niveau du sol en son milieu, un peu creusé). */
const fondRiziere = ([x0, x1, z0, z1]) => niveau((x0 + x1) / 2, (z0 + z1) / 2) - 0.25;

/**
 * Le sol sans l'escalier du belvédère ni le ruisseau : le relief naturel, puis ce que les gens y ont fait : les
 * rizières en terrasses (le fond plat, une diguette autour), les maisons posées à plat, l'esplanade du sanctuaire
 * taillée dans la montagne (un mur de pierre devant), la plate-forme du belvédère, le parking.
 */
function solSansEscalier(x, z) {
  let h = naturel(x, z);
  // les maisons : le sol à plat autour (au niveau de leur milieu)
  for (const [, mx, mz, W, L] of MAISONS) {
    const e = Math.max(Math.abs(x - mx) - W / 2 - 1.2, Math.abs(z - mz) - L / 2 - 1.2);
    if (e < 2.5) h += (niveau(mx, mz) - h) * (1 - lisse(0, 2.5, e));
  }
  // les rizières : le fond, la diguette (0,4 m plus haut, 0,55 de large), puis le sol qui revient
  for (const R of RIZIERES) {
    const [x0, x1, z0, z1] = R, e = Math.max(Math.abs(x - (x0 + x1) / 2) - (x1 - x0) / 2, Math.abs(z - (z0 + z1) / 2) - (z1 - z0) / 2);
    if (e > 1.6) continue;
    const f = fondRiziere(R);
    h = e < 0 ? f + 0.38 * lisse(-0.62, -0.47, e) : f + 0.38 + (h - f - 0.38) * lisse(0, 1.6, e);
  }
  // l'esplanade du sanctuaire
  {
    const S = SANCTUAIRE, e = Math.max(x - S.x1, S.x0 - x, z - S.z1, S.z0 - z);
    if (e < 3) h += (Y_ESPLANADE - h) * (e < 0 ? 1 : x > S.x1 ? (1 - lisse(0, 0.8, e)) : 1 - lisse(0, 3, e));
  }
  // le belvédère : le sol monte jusqu'à sa plate-forme
  {
    const db = Math.hypot(x - BELVEDERE.x, z - BELVEDERE.z);
    if (db < BELVEDERE.r + 3) h += (Y_BELVEDERE - h) * (1 - lisse(BELVEDERE.r, BELVEDERE.r + 3, db));
  }
  // le parking
  {
    const P = PARKING, e = Math.max(x - P.x1, P.x0 - x, z - P.z1, P.z0 - z);
    if (e < 2) h += (niveau(38, -64) - h) * (1 - lisse(0, 2, e));
  }
  // la route, taillée dans la pente (ses talus montent de 1,1 m par mètre) ; au tunnel : sous l'entrée, le sol passe
  // sous la chaussée ; derrière la façade, il monte jusqu'à son dessus (la montagne la recouvre) ; entre les deux,
  // dans le tube, la grille fine a un trou (trouSol)
  if (x > 24 && x < 56 && z > -100 && z < -60) {
    const [lx, d] = versTunnel(x, z), a = Math.abs(lx);
    if (d < 0.3 && d > -24) {
      const route = routeY(d);
      h = a < 4.8 ? route : Math.min(h, route + (a - 4.8) * 1.1);
    } else if (d >= 0.3 && d < 9 && a < 9.6) {
      const dessus = Math.max(h, T_Y + hautFacade(Math.min(a, 9.59)) - 0.25), route = T_Y - 0.45;
      const v = route + (dessus - route) * lisse(1.6, 3.2, d);
      h += (v - h) * (1 - lisse(5.0, 8.5, d)) * (1 - lisse(9.0, 9.6, a));
    }
  }
  return h;
}

/** Les cases (x0, z0, x1, z1) de la grille fine à ne pas dessiner : le talus du sol dans le tube du tunnel. */
function trouSol(x0, z0, x1, z1) {
  if (x1 < TUN.x - 12 || x0 > TUN.x + 12 || z1 < TUN.z - 12 || z0 > TUN.z + 12) return false;
  let dmin = Infinity, dmax = -Infinity, amin = Infinity;
  for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) {
    const [lx, d] = versTunnel(x, z);
    dmin = Math.min(dmin, d); dmax = Math.max(dmax, d); amin = Math.min(amin, Math.abs(lx));
  }
  return amin < TUBE.l + 0.9 && dmax > 1.6 && dmin < 3.2;
}

/**
 * L'escalier du belvédère, calculé une fois : une volée droite du bord du village (A) jusqu'au côté de la plate-forme
 * (E) ; son profil suit à peu près la pente (plus douce en bas, plus raide en haut), lissé, sans jamais redescendre ;
 * des marches de hauteurs égales (environ 19 cm), leurs giron plus longs en bas. marches : [{ s0, s1, h }] (s : les
 * mètres depuis A) ; chemin : la ligne [x, z, h] où l'on marche (le milieu de chaque marche).
 */
const ESC = (() => {
  const B = BELVEDERE, vB = Math.atan2(-B.x, -B.z), aE = vB + 1.15;
  const A = [-36, -46], E = [B.x + Math.sin(aE) * (B.r - 0.1), B.z + Math.cos(aE) * (B.r - 0.1)];
  const dx = E[0] - A[0], dz = E[1] - A[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, pas = 0.25, n = Math.ceil(L / pas);
  const sol = [];
  for (let i = 0; i <= n; i++) { const t = Math.min(L, i * pas); sol.push(solSansEscalier(A[0] + ux * t, A[1] + uz * t)); }
  const h0 = sol[0], hE = BELVEDERE_Y + 0.14;
  // (le profil : 60 % la pente lissée, 40 % la ligne droite ; puis jamais vers le bas, et la fin sur la plate-forme)
  const prof = sol.map((_, i) => {
    let t = 0;
    for (let k = -4; k <= 4; k++) t += sol[Math.min(n, Math.max(0, i + k))];
    return 0.6 * (t / 9) + 0.4 * (h0 + ((hE - h0) * i) / n);
  });
  for (let i = 0; i <= n; i++) prof[i] += (hE - prof[i]) * lisse(L - 2, L, i * pas);
  for (let i = 1; i <= n; i++) prof[i] = Math.max(prof[i], prof[i - 1]);
  const N = Math.ceil((hE - h0) / 0.19), monte = (hE - h0) / N, nez = [0];
  for (let i = 1, k = 1; i <= n && k <= N; i++) while (k <= N && prof[i] >= h0 + (k - 0.5) * monte) { nez.push(Math.min(L, i * pas)); k++; }
  while (nez.length <= N) nez.push(L);
  const marches = [];
  for (let k = 1; k <= N; k++) marches.push({ s0: nez[k], s1: k < N ? nez[k + 1] : L, h: h0 + k * monte });
  const point = (t, h) => [A[0] + ux * t, A[1] + uz * t, h];
  const chemin = [point(0, h0), ...marches.map((m) => point((m.s0 + m.s1) / 2, m.h)), point(L, hE)];
  return {
    A, E, L, ux, uz, ry: Math.atan2(ux, uz), marches, chemin, h0, hE, sol: (t) => sol[Math.min(n, Math.max(0, Math.round(t / pas)))],
    x0: Math.min(A[0], E[0]) - 3, x1: Math.max(A[0], E[0]) + 3, z0: Math.min(A[1], E[1]) - 3, z1: Math.max(A[1], E[1]) + 3,
  };
})();

/** L'escalier vu de x, z : s (le long, depuis A), d (de côté), et le dessus de la marche là (haut) ; null loin. */
function versEscalier(x, z) {
  if (x < ESC.x0 || x > ESC.x1 || z < ESC.z0 || z > ESC.z1) return null;
  const vx = x - ESC.A[0], vz = z - ESC.A[1], t = vx * ESC.ux + vz * ESC.uz, d = Math.abs(vx * ESC.uz - vz * ESC.ux);
  if (t < -0.6 || t > ESC.L + 0.4) return null;
  let haut = ESC.h0;
  for (const m of ESC.marches) if (t >= m.s0 - 0.02) haut = m.h;
  return { s: t, d, haut };
}

/** Le sol sans le ruisseau : solSansEscalier, et sous l'escalier du belvédère, le sol à 38 cm sous les marches. */
function terrainSansRuisseau(x, z) {
  const h = solSansEscalier(x, z), e = versEscalier(x, z);
  if (!e || e.d > 1.2 || e.s < ESC.marches[0].s0 - 0.05 || e.s > ESC.L + 0.05) return h;
  const sous = e.haut - 0.38;
  return sous + (h - sous) * lisse(1.05, 1.2, e.d);
}

/** Le sol : terrainSansRuisseau, et le lit du ruisseau creusé dedans (sous ses murets, de 0,70 à 0,84 m de sa ligne). */
function terrain(x, z) {
  const h = terrainSansRuisseau(x, z), r = versRuisseau(x, z, 0.9);
  return r ? Math.min(h, r.fond + Math.max(0, h - r.fond) * lisse(0.7, 0.84, r.d)) : h;
}

/**
 * Le ruisseau, calculé une fois : sa courbe (un point tous les 25 cm environ : x, z ; s, les mètres depuis la source ;
 * tx, tz, sa direction ; w, la surface de l'eau ; berge, le sol de part et d'autre ; haut, le dessus des murets ;
 * ecume, près d'une chute), et une grille pour trouver vite le point le plus proche. L'eau ne remonte jamais vers
 * l'aval : des biefs plats, et de petites chutes là où le sol descend (dans la forêt, une cascade de petites chutes).
 */
const RU = (() => {
  const Q = RUISSEAU, pts = [];
  const cr = (a, b, c, d, t) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
  for (let k = 0; k < Q.length - 1; k++) {
    const p0 = Q[Math.max(0, k - 1)], p1 = Q[k], p2 = Q[k + 1], p3 = Q[Math.min(Q.length - 1, k + 2)];
    const n = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 0.25));
    for (let i = 0; i < n; i++) pts.push({ x: cr(p0[0], p1[0], p2[0], p3[0], i / n), z: cr(p0[1], p1[1], p2[1], p3[1], i / n) });
  }
  pts.push({ x: Q[Q.length - 1][0], z: Q[Q.length - 1][1] });
  let s = 0;
  pts.forEach((p, i) => {
    if (i) s += Math.hypot(p.x - pts[i - 1].x, p.z - pts[i - 1].z);
    p.s = s;
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], l = Math.hypot(b.x - a.x, b.z - a.z) || 1;
    p.tx = (b.x - a.x) / l;
    p.tz = (b.z - a.z) / l;
  });
  let w = Infinity, chute = -Infinity;
  pts.forEach((p, i) => {
    const nx = -p.tz, nz = p.tx;
    p.berge = Math.min(terrainSansRuisseau(p.x + nx * 1.1, p.z + nz * 1.1), terrainSansRuisseau(p.x - nx * 1.1, p.z - nz * 1.1));
    const cible = p.berge - 0.3;
    if (w === Infinity) w = cible;
    if (w > cible + 0.08) {
      w = cible - 0.02;
      chute = p.s;
      if (i) pts[i - 1].ecume = Math.max(pts[i - 1].ecume, 0.7);
    }
    p.w = w;
    p.ecume = Math.max(0, 1 - (p.s - chute) / 1.3);
    p.haut = Math.max(p.berge + 0.06, w + 0.24);
  });
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 4)], b = pts[Math.min(pts.length - 1, i + 4)];
    p.pente = (a.berge - b.berge) / Math.max(0.5, b.s - a.s);
  });
  const taille = 2.5, grille = new Map();
  pts.forEach((p, i) => {
    const cle = Math.floor(p.x / taille) * 4096 + Math.floor(p.z / taille);
    if (!grille.has(cle)) grille.set(cle, []);
    grille.get(cle).push(i);
  });
  const xs = pts.map((p) => p.x), zs = pts.map((p) => p.z);
  return { pts, grille, taille, x0: Math.min(...xs) - 3, x1: Math.max(...xs) + 3, z0: Math.min(...zs) - 3, z1: Math.max(...zs) + 3 };
})();

/**
 * Le ruisseau vu de x, z : la distance à sa ligne (d), la surface de l'eau (w), le fond, le dessus des murets (haut), s
 * et le rang du point (i) ; null au-delà de dmax (2,4 m au plus).
 */
function versRuisseau(x, z, dmax = 2.4) {
  if (x < RU.x0 || x > RU.x1 || z < RU.z0 || z > RU.z1) return null;
  const T = RU.taille, ix = Math.floor(x / T), iz = Math.floor(z / T), P = RU.pts;
  let best = null;
  for (let a = -1; a <= 1; a++) {
    for (let b = -1; b <= 1; b++) {
      const liste = RU.grille.get((ix + a) * 4096 + iz + b);
      if (!liste) continue;
      for (const i of liste) {
        if (i >= P.length - 1) continue;
        const p = P[i], q = P[i + 1], dx = q.x - p.x, dz = q.z - p.z, l2 = dx * dx + dz * dz || 1;
        const f = Math.min(1, Math.max(0, ((x - p.x) * dx + (z - p.z) * dz) / l2));
        const d = Math.hypot(x - p.x - f * dx, z - p.z - f * dz);
        if (!best || d < best.d) best = { d, i, f };
      }
    }
  }
  if (!best || best.d > dmax) return null;
  const p = P[best.i], q = P[best.i + 1], w = p.w + (q.w - p.w) * best.f;
  return { d: best.d, i: best.i, w, fond: w - 0.16, haut: p.haut + (q.haut - p.haut) * best.f, s: p.s + (q.s - p.s) * best.f };
}

/**
 * Où l'on peut aller : la terrasse du village (pas la berge : la gorge est trop raide), jusqu'au parking au nord ;
 * l'esplanade du sanctuaire ; le sentier et le belvédère.
 */
function dansLeCadre(x, z) {
  if (z < PARKING.z0 + 0.1) return false;
  const S = SANCTUAIRE;
  if (x > S.x0 + 0.6 && x < S.x1 + 2 && z > S.z0 + 0.6 && z < S.z1 - 0.6) return true;
  const esc = versEscalier(x, z);
  if ((esc && esc.d < 0.95 && esc.s > -0.4 && esc.s < ESC.L + 0.3) || Math.hypot(x - BELVEDERE.x, z - BELVEDERE.z) < BELVEDERE.r - 0.35) return true;
  // l'arrivée : le parking, l'arrêt de bus, jusqu'à la barrière de la route (au nord) et jusqu'au village
  if (x > 27 && x < 50 && z < -48 && versRiviere(x, z).d > 23.2) return true;
  // la terrasse : au pied de la montagne, ou, près de la rivière, jusqu'en haut de sa berge
  const riv = versRiviere(x, z);
  if (riv.d < 22.5) return false;
  const r = Math.hypot(x, z);
  // (du côté de la rivière, jusqu'en haut de sa berge ; en s'éloignant d'elle, cette bande rejoint en douceur le bord de
  // la terrasse : un raccord brusque laissait une encoche, un mur invisible au nord du parking)
  const rT = rayonTerrasse(angle(x, z));
  return r < rT + 0.5 || (riv.dedans && r < 80 && r < rT + 0.5 + 18 * (1 - lisse(32, 42, riv.d)));
}

// les arbres de la forêt, par case de 4 m : [x, z, rayon de leur ombre au sol] (construire les note, aspectSol
// assombrit le sol sous eux : sans ombre portée, ils semblaient flotter sur un vert uniforme)
const ARBRES_SOL = new Map();
const noterArbre = (x, z, r) => {
  const k = `${Math.floor(x / 4)},${Math.floor(z / 4)}`;
  if (!ARBRES_SOL.has(k)) ARBRES_SOL.set(k, []);
  ARBRES_SOL.get(k).push([x, z, Math.min(4, r)]);
};
/** L'ombre des arbres au sol en x, z : 0 (à découvert) à 1 (au pied d'un tronc). */
function ombreArbres(x, z) {
  let o = 0;
  const i = Math.floor(x / 4), j = Math.floor(z / 4);
  for (let dj = -1; dj <= 1; dj++) {
    for (let di = -1; di <= 1; di++) {
      const l = ARBRES_SOL.get(`${i + di},${j + dj}`);
      if (l) for (const [ax, az, r] of l) { const d = Math.hypot(x - ax, z - az); if (d < r) o = Math.max(o, 1 - d / r); }
    }
  }
  return o;
}

/** Ce que le carnet et le menu savent du lieu, sans le construire. */
export const infos = {
  id: 'gokayama', carte: 'gokayama', video: '7645659293513108739',
  nom: { en: 'Gokayama', fr: 'Gokayama', ja: '五箇山' }, nomJa: '五箇山',
  tampons: [
    { id: 'tenbo', motif: 'gassho', ja: '展望台', encre: '#2f5a3a' },
    { id: 'jinja', motif: 'jinja', ja: '地主神社', encre: '#b8322a', forme: 'carre' },
    { id: 'washi', motif: 'washi', ja: '五箇山和紙', encre: '#3a4f8a' },
    { id: 'kokiriko', motif: 'sasara', ja: 'こきりこ', encre: '#8a3a2a', forme: 'carre' },
    { id: 'hosui', motif: 'hosui', ja: '放水銃', encre: '#2a6a9a' },
  ],
  get textes() { return TEXTES; },
};

/** Les couleurs qui s'allument la nuit (le papier des shōji) et le chaume des toits (la neige l'hiver, même en pente). */
export const sortesNuit = (P) => ({ [P.shoji]: 'lumiere', [P.chaume]: 'chaume', [P.chaumeFonce]: 'chaume', [P.chaumeClair]: 'chaume' });

export function construire(ctx) {
  const { THREE, atelier, P, peinture } = ctx;
  const objets = [];
  const monde = creerMonde({ terrain, cadre: dansLeCadre, profond: null, pente: 0.85 });
  const poser = (fin, x, z, o = {}) => objets.push({ fin, x, z, y: o.y ?? terrain(x, z), ry: o.ry || 0, ombre: o.ombre !== false, trait: o.trait !== false });
  /** L'angle qui tourne vers (vx, vz) le devant (+z) d'un objet posé en (x, z). */
  const vers = (x, z, vx, vz) => Math.atan2(vx - x, vz - z);
  const vapeurs = [], bancs = [], lumieres = [], animes = [];
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

  // ---------------------------------------------------------------- Les shōji, les planches
  /**
   * Un panneau de shōji (les croisillons de bois, le papier entre eux) de w × h, dans le plan z = 0, tourné vers +z,
   * centré à l'origine ; nx colonnes et ny rangées de carreaux ; o : sa place (x, y, z, ry…). La nuit, le papier
   * s'allume (sortesNuit), pas les croisillons.
   */
  function shoji(a, w, h, nx, ny, o = {}, b = 0.034) {
    const coupes = (L, n) => { const c = [-L / 2, -L / 2 + b]; for (let i = 1; i < n; i++) { const m = -L / 2 + (i * L) / n; c.push(m - b / 2, m + b / 2); } c.push(L / 2 - b, L / 2); return c; };
    const X = coupes(w, nx), Y = coupes(h, ny), pos = [], couleurs = [];
    for (let j = 0; j < Y.length - 1; j++) {
      for (let i = 0; i < X.length - 1; i++) {
        const c = i % 2 === 0 || j % 2 === 0 ? P.boisNoir : P.shoji, [x0, x1, y0, y1] = [X[i], X[i + 1], Y[j], Y[j + 1]];
        pos.push(x0, y0, 0, x1, y0, 0, x1, y1, 0, x0, y0, 0, x1, y1, 0, x0, y1, 0);
        couleurs.push(c, c);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    return a.piece(g, P.shoji, { ...o, couleurs, trait: false, nuance: 0.02 });
  }
  /** Un mur de planches de bois noirci (l × h × e), en rangs horizontaux de deux teintes. */
  const planches = (a, l, h, e, o, c1 = P.boisNoir, c2 = '#523d30') => a.piece(new THREE.BoxGeometry(l, h, e, 1, Math.max(1, Math.round(h / 0.24)), 1), c1, { ...o, teinte: (x, y) => (Math.floor(y / 0.24 + 100) % 2 ? c1 : c2) });
  /** Les pierres d'un socle : des rangs de deux teintes, décalés. */
  const pierres = (x, y, z) => (Math.floor(x / 0.55 + 50) + Math.floor(z / 0.55 + 50) + Math.floor(y / 0.32 + 50)) % 2 ? P.pierre : P.pierreFonce;

  // ---------------------------------------------------------------- La maison au toit de chaume (gasshō)
  /**
   * Une maison au toit de chaume, le faîte le long de z, posée à l'origine (y = 0 : le sol en son milieu) ; W × L ;
   * murH : le haut des murs (le bas du chaume) ; porte : 'est' | 'ouest' (le côté long de l'entrée) ; ouverte : une
   * vraie porte (la maison-musée : on y entre). Le grand toit : deux pans de chaume épais à 60°, qui débordent ; leurs
   * parties refaites à neuf, dorées, et les vieilles, grises (on refait un toit par morceaux, tous ensemble : le
   * « yui ») ; le faîtage et ses perches ; le pignon de planches et ses rangs de fenêtres en papier, sous de petits
   * auvents ; le rez-de-chaussée en planches noircies, ses poteaux, ses shōji ; le socle de pierres. Renvoie ses mesures.
   */
  function gassho(a, { W, L, murH = 3.1, porte = 'est', ouverte = false, graine = 1, petite = false }) {
    const w2 = W / 2, l2 = L / 2, socle = 0.4, ed = petite ? 0.6 : 1.0, go = petite ? 0.6 : 1.1, ep = petite ? 0.55 : 0.85;
    const yE = murH - 0.05, yR = yE + (w2 + ed) * TAN60, sP = porte === 'est' ? 1 : -1;
    const dz0 = -0.85, dz1 = 0.85; // la porte (dans le mur long)
    // le socle de pierre (il descend dans le sol : sur une pente, la maison ne flotte pas)
    a.piece(new THREE.BoxGeometry(W + 0.5, 1.4, L + 0.5, Math.round(W * 1.6), 4, Math.round(L * 1.6)), P.pierre, { y: socle - 0.7, teinte: pierres });
    // les murs du rez-de-chaussée : les longs (est, ouest), les pignons (nord, sud) ; la porte coupe le mur de l'entrée
    const hm = murH - socle, ym = socle + hm / 2;
    for (const s of [-1, 1]) {
      const x = s * (w2 - 0.08);
      if (s === sP && ouverte) {
        planches(a, 0.16, hm, l2 + dz0, { x, y: ym, z: (-l2 + dz0) / 2 });
        planches(a, 0.16, hm, l2 - dz1, { x, y: ym, z: (l2 + dz1) / 2 });
        planches(a, 0.16, murH - 2.35, dz1 - dz0, { x, y: 2.35 + (murH - 2.35) / 2, z: 0 });
      } else planches(a, 0.16, hm, L, { x, y: ym });
      planches(a, W - 0.32, hm, 0.16, { y: ym, z: s * (l2 - 0.08) });
    }
    // les poteaux (aux coins, et tous les deux mètres environ le long des murs longs), la poutre du bas des fenêtres
    const nP = Math.max(2, Math.round(L / 2.2));
    for (const s of [-1, 1]) {
      for (let k = 0; k <= nP; k++) {
        const z = -l2 + 0.05 + ((L - 0.1) * k) / nP;
        if (s === sP && z > dz0 - 0.2 && z < dz1 + 0.2) continue;
        a.boite(0.2, hm, 0.2, '#3e2f25', { x: s * (w2 - 0.01), y: ym, z });
      }
      a.boite(0.07, 0.14, L + 0.1, '#3e2f25', { x: s * (w2 + 0.03), y: 2.25, z: 0 });
      // (les coins des pignons)
      for (const sz of [-1, 1]) a.boite(0.2, hm, 0.2, '#3e2f25', { x: s * (w2 - 0.01), y: ym, z: sz * (l2 - 0.01) });
    }
    // les shōji du rez-de-chaussée : sur les murs longs (pas devant la porte), sur les pignons
    if (!petite) {
      for (const s of [-1, 1]) {
        for (let z = -l2 + 1.4; z < l2 - 1.0; z += 2.6) {
          if (s === sP && z > dz0 - 1.2 && z < dz1 + 1.2) continue;
          a.boite(0.05, 1.12, 1.62, '#3e2f25', { x: s * (w2 + 0.01), y: 1.62, z });
          shoji(a, 1.5, 1.0, 4, 3, { x: s * (w2 + 0.05), y: 1.62, z, ry: s * PI / 2 });
        }
        for (const x of [-w2 + 1.5, w2 - 1.5]) {
          a.boite(1.62, 1.12, 0.05, '#3e2f25', { x, y: 1.62, z: s * (l2 + 0.01) });
          shoji(a, 1.5, 1.0, 4, 3, { x, y: 1.62, z: s * (l2 + 0.05), ry: s > 0 ? 0 : PI });
        }
      }
    }
    // la porte : fermée (deux panneaux de bois coulissants, des carreaux de papier en haut), ou ouverte (les panneaux
    // poussés de côté, contre le mur) ; la pierre où l'on ôte ses chaussures, devant
    const xp = sP * (w2 + 0.05);
    if (!ouverte) {
      a.boite(0.05, 2.05, dz1 - dz0, '#5a4433', { x: xp, y: socle + 1.02, z: 0 });
      shoji(a, dz1 - dz0 - 0.1, 0.6, 4, 2, { x: xp + sP * 0.04, y: socle + 1.65, z: 0, ry: sP * PI / 2 });
    } else {
      a.boite(0.05, 2.0, 0.85, '#5a4433', { x: sP * (w2 + 0.06), y: socle + 1.0, z: dz1 + 0.5 });
    }
    a.boite(0.24, 0.12, dz1 - dz0 + 0.24, '#3e2f25', { x: sP * (w2 - 0.08), y: 2.4, z: 0 });
    a.rocher(sP * (w2 + 0.75), 0.12, 0, 0.42, P.pierre, { sy: 0.38, sx: 1.4 });
    // le pignon : le triangle de planches au-dessus du rez-de-chaussée (sous le chaume qui déborde), ses rangs de
    // fenêtres en papier, les petits auvents de planches sous chacun
    const largeurA = (y) => Math.max(0, (w2 - 0.1) - (y - murH) / TAN60);
    const yA = murH + (w2 - 0.1) * TAN60 * 0.985;
    for (const s of [-1, 1]) {
      const zf = s * l2, tri = new THREE.BufferGeometry();
      const pts = s > 0 ? [-w2 + 0.1, murH, zf, w2 - 0.1, murH, zf, 0, yA, zf] : [w2 - 0.1, murH, zf, -w2 + 0.1, murH, zf, 0, yA, zf];
      tri.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      a.piece(tri, P.boisGris, { nuance: 0.06 });
      const etages = petite ? [[murH + 0.9, 0.55]] : [[murH + 1.0, 1.0], [murH + 2.75, 0.85], [murH + 4.3, 0.7]];
      for (const [y, h] of etages) {
        const lw = largeurA(y + h / 2 + 0.15) * 1.55;
        if (lw < 0.6) continue;
        a.boite(lw + 0.12, h + 0.12, 0.05, '#3e2f25', { y, z: zf + s * 0.02 });
        shoji(a, lw, h, Math.max(2, Math.round(lw / 0.45)), 2, { y, z: zf + s * 0.06, ry: s > 0 ? 0 : PI });
        // l'auvent sous la fenêtre (des planches en pente) et la poutre
        const la = largeurA(y - h / 2 - 0.12) * 2;
        a.boite(la, 0.16, 0.14, '#3e2f25', { y: y - h / 2 - 0.12, z: zf + s * 0.07 })
          .boite(la * 0.96, 0.05, 0.62, P.boisGris, { y: y - h / 2 - 0.02, z: zf + s * 0.36, rx: s * 0.42 });
      }
    }
    // le grand toit : deux pans de chaume (des blocs épais posés à 60°), leurs morceaux plus ou moins neufs ; leurs
    // tranches (au bord du toit, aux pignons) plus sombres ; le dessous, la paille brune
    const Lr = L + 2 * go, S = 2 * (w2 + ed) + 0.5;
    for (const s of [-1, 1]) {
      const n = [s * SIN60, 0.5], E = [s * (w2 + ed), yE], R2 = [-s * 0.25, yR + 0.433];
      const cx = (E[0] + R2[0]) / 2 - n[0] * ep / 2, cy = (E[1] + R2[1]) / 2 - n[1] * ep / 2;
      // (les cases de la grille du pan : nS le long de la pente, nL en long ; les morceaux suivent leurs bords, sinon, en
      // diagonale d'une case à l'autre, ils faisaient des escaliers)
      const nS = petite ? 6 : 10, nL = Math.max(6, Math.round(Lr / 0.85));
      const teinte = (x, y, z) => {
        const k = n[0] * (x - E[0]) + n[1] * (y - E[1]);
        if (k > -0.03) {
          // (le long de la pente, par bandes de deux cases ; en long, par morceaux de trois cases : une couleur par morceau)
          const lx = (x - cx) * 0.5 - (y - cy) * s * SIN60;
          const u = Math.floor(Math.floor(((lx + S / 2) / S) * nS) / 2), v = Math.floor(Math.floor(((z + Lr / 2) / Lr) * nL) / 3);
          const h = hasard(u * 3.1 + s * 7 + graine, v * 1.7 + graine * 3);
          return h < 0.18 ? P.chaumeClair : h > 0.85 ? P.chaumeFonce : P.chaume;
        }
        return P.chaumeFonce;
      };
      // (2026-10-24) le chaume n'est plus une plaque : de larges bosses douces et un léger bombé sur le dessus (les
      // morceaux refaits n'y sont jamais tout à fait plats), et un avant-toit plus épais, coupé net, comme sur les photos
      // (u : 1 au bord du toit, −1 au faîte)
      const bosses = (x, y, z) => {
        const u = (s * x) / (S / 2);
        if (y > 0) y += 0.05 * Math.sin(z * 0.85 + graine * 3) * Math.cos(x * 0.6 + graine) + 0.035 * Math.sin(z * 2.1 + x * 1.3 + graine * 5) + 0.07 * (1 - u * u) + 0.22 * lisse(0.72, 1, u);
        else y -= 0.1 * lisse(0.8, 1, u);
        return [x, y, z];
      };
      a.piece(new THREE.BoxGeometry(S, ep, Lr, nS, 1, nL), P.chaume, { x: cx, y: cy, rz: -s * PI / 3, teinte, deformer: bosses });
    }
    // le faîtage : le chaume serré, deux perches de bois et, tous les 1,5 m, une paire de bâtons croisés qui les tient
    a.boite(1.5, 0.75, Lr + 0.1, P.chaumeFonce, { y: yR + 0.12 });
    for (const s of [-1, 1]) a.cylindre(0.08, 0.08, Lr + 0.2, 6, '#6a5240', { x: s * 0.42, y: yR + 0.52, rx: PI / 2 });
    for (let z = -Lr / 2 + 0.6; z < Lr / 2 - 0.3; z += 1.5) {
      for (const s of [-1, 1]) a.baton([s * 0.62, yR + 0.25, z], [-s * 0.15, yR + 0.95, z], 0.035, '#5a4436', 4);
    }
    return { w2, l2, yE, yR, socle, murH, sP, xPorte: sP * (w2 + 0.7) };
  }

  // ---------------------------------------------------------------- Les maisons
  const MAISON = {}; // id → { x, z, y, mesures }
  // (la maison-musée : la planche du secret, sa fosse, la hauteur de son plancher ; construireMusee les dit)
  let PLANCHE = null, FOSSE = null, SOL_MUSEE = 0;
  // (les maisons où l'on entre, et ce qu'il y a dedans : la maison-musée, le minshuku, la boutique de soba et de tofu)
  const DEDANS = { minshuku: construireMinshuku, g4: construireBoutique };
  for (const [id, x, z, W, L, porte] of MAISONS) {
    const y = niveau(x, z), a = atelier(), petite = id.startsWith('k'), ouverte = id === 'musee' || id in DEDANS;
    const m = gassho(a, { W, L, porte, ouverte, graine: x * 0.13 + z * 0.07, petite, murH: id === 'musee' ? 3.5 : ouverte ? 3.3 : petite ? 2.4 : 3.1 });
    MAISON[id] = { x, z, y, W, L, ...m };
    if (id === 'musee') { construireMusee(a, m); poser(a.fin(0, peinture), x, z, { y }); continue; }
    if (DEDANS[id]) {
      dedansCommun(a, m);
      DEDANS[id](a, m, x, y, z);
      mursOuverts(x, y, z, m);
      poser(a.fin(0, peinture), x, z, { y });
      continue;
    }
    poser(a.fin(0, peinture), x, z, { y });
    // fermée : on ne la traverse pas, la caméra n'y entre pas
    monde.surface(x - W / 2 - 0.25, x + W / 2 + 0.25, z - L / 2 - 0.25, z + L / 2 + 0.25, y + m.yR, { plein: true });
    monde.bloc(x - W / 2 - 0.3, x + W / 2 + 0.3, z - L / 2 - 0.3, z + L / 2 + 0.3, y - 1, y + m.yR + 1);
  }

  // ---- la boutique de tofu et de soba : le rideau indigo « そば » à la porte, l'enseigne de bois au-dessus, la bannière
  // « 手打ちそば » (des soba faites à la main) au bord du chemin, un banc dehors
  {
    const B4 = MAISON.g4, a = atelier(), s = B4.sP, xp = s * (B4.w2 + 0.09), pose = { x: B4.x, y: B4.y, z: B4.z, ry: 0 };
    for (const dz of [-0.42, 0.42]) a.boite(0.02, 0.62, 0.8, '#2f4a7a', { x: xp, y: B4.socle + 1.72, z: dz, trait: false });
    ecrire(pose, { texte: 'そ', fond: '#2f4a7a', encre: '#f4efe2', x: xp + s * 0.012, y: B4.socle + 1.76, z: -0.42, ry: s * PI / 2, l: 0.45, h: 0.45 });
    ecrire(pose, { texte: 'ば', fond: '#2f4a7a', encre: '#f4efe2', x: xp + s * 0.012, y: B4.socle + 1.76, z: 0.42, ry: s * PI / 2, l: 0.45, h: 0.45 });
    // (l'enseigne sous l'avancée du chaume, au-dessus du rideau : plus haut, le chaume la cachait)
    a.boite(0.08, 0.36, 2.4, P.bois, { x: s * (B4.w2 + 0.12), y: B4.socle + 2.25, z: 0 });
    ecrire(pose, { texte: '五箇山 とうふ・そば', fond: P.bois, encre: '#2a2018', x: s * (B4.w2 + 0.165), y: B4.socle + 2.25, z: 0, ry: s * PI / 2, l: 2.25, h: 0.31 });
    const bx = s * (B4.w2 + 2.1), bz = -1.9;
    a.cylindre(0.025, 0.025, 2.6, 6, '#c9a87a', { x: bx, y: 1.3, z: bz })
      .baton([bx, 2.5, bz], [bx, 2.5, bz + 0.5], 0.015, '#c9a87a', 4)
      .boite(0.02, 1.9, 0.48, '#c8402c', { x: bx + s * 0.02, y: 1.5, z: bz + 0.26, trait: false });
    ecrire(pose, { texte: '手打ちそば', vertical: true, fond: '#c8402c', encre: '#fbf6ea', x: bx + s * 0.032, y: 1.5, z: bz + 0.26, ry: s * PI / 2, l: 0.36, h: 1.7 });
    monde.cercle(B4.x + bx, B4.z + bz, 0.2);
    a.boite(0.4, 0.06, 1.6, P.bois2, { x: s * (B4.w2 + 0.6), y: 0.45, z: 2.6 });
    for (const dz of [-0.6, 0.6]) a.boite(0.36, 0.42, 0.08, '#5a4436', { x: s * (B4.w2 + 0.6), y: 0.21, z: 2.6 + dz });
    bancs.push({ de: [B4.x + s * (B4.w2 + 0.6), B4.z + 1.9], a: [B4.x + s * (B4.w2 + 0.6), B4.z + 3.3], y: B4.y + 0.48, cap: s > 0 ? PI / 2 : -PI / 2, vue: 0.3 });
    monde.mur(B4.x + s * (B4.w2 + 0.6), B4.z + 1.8, B4.x + s * (B4.w2 + 0.6), B4.z + 3.4, 0.25);
    poser(a.fin(0, peinture), B4.x, B4.z, { y: B4.y });
  }

  // ---- le minshuku (la maison d'hôtes) : le rideau indigo « 民宿 » à la porte, la lanterne de papier, l'enseigne de
  // bois, les sandales devant ; une véranda (engawa) de bois sur le côté sud, où l'on peut s'asseoir ; du bois coupé
  {
    const Mi = MAISON.minshuku, a = atelier(), s = Mi.sP, xp = s * (Mi.w2 + 0.09);
    for (const dz of [-0.42, 0.42]) a.boite(0.02, 0.62, 0.8, '#2f4a7a', { x: xp, y: Mi.socle + 1.76, z: dz, trait: false });
    const poseM = { x: Mi.x, y: Mi.y, z: Mi.z, ry: 0 };
    ecrire(poseM, { texte: '民', fond: '#2f4a7a', encre: '#f4efe2', x: xp + s * 0.012, y: Mi.socle + 1.8, z: -0.42, ry: s * PI / 2, l: 0.45, h: 0.45 });
    ecrire(poseM, { texte: '宿', fond: '#2f4a7a', encre: '#f4efe2', x: xp + s * 0.012, y: Mi.socle + 1.8, z: 0.42, ry: s * PI / 2, l: 0.45, h: 0.45 });
    a.chochin(s * (Mi.w2 + 0.55), Mi.socle + 2.2, -1.3, 6)
      .baton([s * (Mi.w2 + 0.05), Mi.socle + 2.45, -1.3], [s * (Mi.w2 + 0.55), Mi.socle + 2.45, -1.3], 0.015, '#3e2f25', 4);
    lumieres.push({ x: Mi.x + s * (Mi.w2 + 0.55), y: Mi.y + Mi.socle + 2.2, z: Mi.z - 1.3, halo: 0.5, sol: Mi.y, r: 3.4 });
    // l'enseigne de bois, debout à côté de la porte
    a.boite(0.5, 1.5, 0.08, P.bois, { x: s * (Mi.w2 + 1.4), y: 0.75, z: 1.6, ry: PI / 2 })
      .boite(0.13, 0.12, 0.13, '#3e2f25', { x: s * (Mi.w2 + 1.4), y: 0.05, z: 1.6 });
    ecrire(poseM, { texte: '民宿 庄川荘', vertical: true, fond: P.bois, encre: '#2a2018', x: s * (Mi.w2 + 1.4 + s * 0.045), y: 0.85, z: 1.6, ry: s * PI / 2, l: 0.36, h: 1.25 });
    monde.cercle(Mi.x + s * (Mi.w2 + 1.4), Mi.z + 1.6, 0.35);
    // les sandales (geta) sur la pierre de l'entrée
    for (const dz of [-0.2, 0.2]) a.boite(0.1, 0.04, 0.22, '#c9a06a', { x: s * (Mi.w2 + 0.7), y: 0.32, z: dz, ry: 0.2 * dz });
    // la véranda du sud : un plancher de bois et son bord, un auvent ; le bois coupé empilé au nord
    const yV = Mi.socle + 0.05;
    a.boite(Mi.W - 0.6, 0.1, 1.3, P.bois2, { y: yV, z: Mi.l2 + 0.7 })
      .boite(Mi.W - 0.66, 0.06, 0.06, '#3e2f25', { y: yV - 0.06, z: Mi.l2 + 1.33 });
    for (const x of [-Mi.w2 + 0.6, 0, Mi.w2 - 0.6]) a.boite(0.1, yV + 0.5, 0.1, '#3e2f25', { x, y: (yV - 0.5) / 2, z: Mi.l2 + 1.25 });
    bancs.push({ de: [Mi.x - Mi.w2 + 1, Mi.z + Mi.l2 + 0.9], a: [Mi.x + Mi.w2 - 1, Mi.z + Mi.l2 + 0.9], y: Mi.y + yV + 0.05, cap: 0, vue: 0.3 });
    monde.mur(Mi.x - Mi.w2 + 0.3, Mi.z + Mi.l2 + 0.5, Mi.x + Mi.w2 - 0.3, Mi.z + Mi.l2 + 0.5, 0.35);
    for (let k = 0; k < 4; k++) {
      for (let j = 0; j < 6 - k; j++) {
        a.cylindre(0.09, 0.09, 0.9, 7, j % 2 ? '#a07a52' : '#8a6644', { x: -Mi.w2 + 1.7 + ((j * 7 + k * 3) % 5 - 2) * 0.015, y: 0.09 + k * 0.16, z: -Mi.l2 - 1.1 + (j - (5 - k) / 2) * 0.19, rx: 0, rz: PI / 2 });
      }
    }
    monde.mur(Mi.x - Mi.w2 + 1.7, Mi.z - Mi.l2 - 1.6, Mi.x - Mi.w2 + 1.7, Mi.z - Mi.l2 - 0.6, 0.55);
    poser(a.fin(0, peinture), Mi.x, Mi.z, { y: Mi.y });
  }

  /**
   * L'autel bouddhique de la famille (butsudan), contre un mur, tourné vers −z, posé en x, y (le sol), z (son milieu) :
   * le meuble laqué noir, ses deux portes ouvertes (dorées dedans), l'intérieur doré en gradins, le petit bouddha et son
   * auréole, les chandeliers, la clochette (rin) sur son coussin, le brûle-parfum et l'encens, les fleurs, les offrandes.
   */
  function butsudan(a, x, y, z) {
    const N = '#1e1a18', O = '#c8a03a', O2 = '#e2bc52', zf = z - 0.28;
    // le bas : deux tiroirs et leurs poignées
    a.boite(1.3, 0.5, 0.56, N, { x, y: y + 0.25, z });
    for (const sg of [-1, 1]) a.boite(0.58, 0.18, 0.02, '#2a2420', { x: x + sg * 0.32, y: y + 0.33, z: zf - 0.011 }).boule(0.022, O, { x: x + sg * 0.32, y: y + 0.33, z: zf - 0.03 }, 0);
    // le haut : les côtés, le fond doré, le toit (une corniche), l'intérieur doré
    for (const sg of [-1, 1]) {
      a.boite(0.05, 1.25, 0.52, N, { x: x + sg * 0.625, y: y + 1.125, z })
        .boite(0.01, 1.18, 0.46, O, { x: x + sg * 0.594, y: y + 1.12, z: z + 0.01, trait: false });
    }
    a.boite(1.2, 1.25, 0.04, O, { x, y: y + 1.125, z: z + 0.24 })
      .boite(1.36, 0.07, 0.6, N, { x, y: y + 1.785, z })
      .boite(1.46, 0.05, 0.66, O2, { x, y: y + 1.845, z })
      .boite(1.3, 0.09, 0.56, N, { x, y: y + 1.915, z })
      .boite(1.19, 0.05, 0.5, O, { x, y: y + 0.525, z });
    // les gradins, le bouddha assis sur son lotus, son auréole
    a.boite(0.7, 0.16, 0.22, O2, { x, y: y + 0.63, z: z + 0.12 }).boite(0.42, 0.14, 0.16, O2, { x, y: y + 0.78, z: z + 0.15 });
    a.cylindre(0.08, 0.06, 0.05, 10, '#d88a9a', { x, y: y + 0.875, z: z + 0.15 })
      .ovale(0.075, O, { x, y: y + 0.95, z: z + 0.15, sy: 0.9 }, 10)
      .boule(0.045, O, { x, y: y + 1.06, z: z + 0.15 }, 1)
      .cylindre(0.13, 0.13, 0.01, 18, O2, { x, y: y + 1.04, z: z + 0.205, rx: PI / 2 });
    // les chandeliers et leurs bougies, le brûle-parfum, les fleurs dans leurs vases ; une petite flamme aux bougies
    for (const sg of [-1, 1]) {
      a.cylindre(0.015, 0.03, 0.22, 8, O, { x: x + sg * 0.42, y: y + 0.66, z: z - 0.05 })
        .cylindre(0.012, 0.012, 0.08, 8, '#f6f1e2', { x: x + sg * 0.42, y: y + 0.81, z: z - 0.05 })
        .boule(0.012, '#ffb84a', { x: x + sg * 0.42, y: y + 0.865, z: z - 0.05, sy: 1.6, sorte: 'lampe', trait: false }, 0);
      a.cylindre(0.03, 0.022, 0.16, 8, '#4a6a5a', { x: x + sg * 0.25, y: y + 0.63, z: z - 0.1 });
      for (let k = 0; k < 4; k++) a.boule(0.035, k % 2 ? '#d8302c' : '#f2c443', { x: x + sg * 0.25 + Math.cos(k * 1.7) * 0.05, y: y + 0.75 + k * 0.02, z: z - 0.1 + Math.sin(k * 1.7) * 0.05 }, 0);
      a.boule(0.045, '#5f9a40', { x: x + sg * 0.25, y: y + 0.72, z: z - 0.1, sy: 1.4 }, 0);
    }
    a.cylindre(0.06, 0.05, 0.07, 10, '#8a6a3a', { x, y: y + 0.585, z: z - 0.14 });
    for (let k = 0; k < 3; k++) a.baton([x - 0.02 + k * 0.02, y + 0.62, z - 0.14], [x - 0.03 + k * 0.03, y + 0.76, z - 0.15], 0.003, '#6a3a2a', 3, { trait: false });
    // la clochette (rin) sur son coussin, sur le meuble du bas, devant
    a.boite(0.14, 0.04, 0.14, '#b8322a', { x: x + 0.3, y: y + 0.52, z: zf + 0.05 }).cylindre(0.06, 0.04, 0.05, 12, '#c89a3a', { x: x + 0.3, y: y + 0.565, z: zf + 0.05 });
    // les offrandes : un plateau de bois, deux galettes de riz et une mandarine
    a.boite(0.18, 0.05, 0.18, '#d9b98a', { x: x - 0.3, y: y + 0.525, z: zf + 0.05 })
      .cylindre(0.06, 0.065, 0.03, 12, '#f6f1e2', { x: x - 0.3, y: y + 0.565, z: zf + 0.05 })
      .cylindre(0.05, 0.055, 0.03, 12, '#f6f1e2', { x: x - 0.3, y: y + 0.595, z: zf + 0.05 })
      .boule(0.035, '#f08a2a', { x: x - 0.3, y: y + 0.64, z: zf + 0.05 }, 1);
    // les deux portes, ouvertes à 160° (laquées noir dehors, dorées dedans : on voit leur côté doré)
    for (const sg of [-1, 1]) {
      // (du gond vers le bord libre : vers l'extérieur, 20° en avant du plan de la façade)
      const dx = sg * Math.cos(0.35), dz = -Math.sin(0.35), ry = Math.atan2(-dz, dx);
      const hx = x + sg * 0.65, hz = zf - 0.01, cx = hx + dx * 0.3, cz = hz + dz * 0.3;
      a.boite(0.6, 1.2, 0.025, N, { x: cx, y: y + 1.12, z: cz, ry });
      // (le côté doré : celui qui regarde la pièce, vers −z)
      const nz = Math.cos(ry), cote = nz < 0 ? 1 : -1;
      a.boite(0.54, 1.12, 0.004, O, { x: cx + Math.sin(ry) * 0.0145 * cote, y: y + 1.12, z: cz + nz * 0.0145 * cote, ry, trait: false });
    }
  }

  /**
   * Un foyer creusé dans le plancher (irori), 1,35 m de côté, son dessus à y : le cadre de bois poli en quatre poutres,
   * la cendre 5 cm plus bas, trois bûches poussées vers le milieu qui brûlent par le bout, des braises.
   */
  function foyer(a, x, y, z) {
    for (const [dx, dz, l, pr] of [[0, -0.615, 1.35, 0.12], [0, 0.615, 1.35, 0.12], [-0.615, 0, 0.12, 1.11], [0.615, 0, 0.12, 1.11]]) {
      a.boite(l, 0.12, pr, '#3e2f25', { x: x + dx, y: y - 0.03, z: z + dz });
    }
    a.boite(1.09, 0.05, 1.09, '#8f8a84', { x, y: y - 0.045, z, trait: false });
    for (const [ang, l] of [[0.4, 0.42], [2.5, 0.38], [4.4, 0.45]]) {
      const c = Math.cos(ang), sn = Math.sin(ang), bx = x + c * 0.09, bz = z + sn * 0.09;
      a.baton([bx + c * 0.03, y - 0.0, bz + sn * 0.03], [bx + c * l, y + 0.012, bz + sn * l], 0.034, '#5a4030', 6)
        .baton([bx - c * 0.01, y - 0.002, bz - sn * 0.01], [bx + c * 0.035, y - 0.001, bz + sn * 0.035], 0.036, '#ff7a2a', 6, { sorte: 'lampe', trait: false });
    }
    for (const [dx, dz, k] of [[0.02, -0.05, 1], [-0.06, 0.02, 0], [0.05, 0.06, 1], [-0.02, 0.08, 0], [0.09, -0.02, 0], [-0.08, -0.07, 1]]) {
      a.rocher(x + dx, y - 0.02, z + dz, 0.032, k ? '#e8582a' : '#2a2420', k ? { sorte: 'lampe', trait: false } : { trait: false });
    }
  }

  // ---------------------------------------------------------------- Les maisons où l'on entre
  /** Les lames d'un plancher de bois de x0 à x1, z0 à z1, leur dessus à y (des rangs de deux teintes le long de z). */
  function plancher(a, x0, x1, z0, z1, y) {
    if (x1 - x0 < 0.01 || z1 - z0 < 0.01) return;
    a.piece(new THREE.BoxGeometry(x1 - x0, 0.08, z1 - z0, 1, 1, Math.max(1, Math.round((z1 - z0) / 0.32))), P.bois, { x: (x0 + x1) / 2, y: y - 0.04, z: (z0 + z1) / 2, teinte: (x, yy, z) => (Math.floor((z + 20) / 0.32) % 2 ? P.bois : P.bois2) });
  }
  /** Des nattes de tatami bordées de noir sur x0…x1, z0…z1 (nx × nz nattes), leur dessus à y. */
  function tatamis(a, x0, x1, z0, z1, y, nx, nz) {
    const dx = (x1 - x0) / nx, dz = (z1 - z0) / nz;
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < nz; j++) {
        a.boite(dx - 0.04, 0.06, dz - 0.04, '#cfc49a', { x: x0 + (i + 0.5) * dx, y: y - 0.03, z: z0 + (j + 0.5) * dz })
          .boite(0.03, 0.055, dz - 0.02, '#2a2a28', { x: x0 + i * dx + 0.015, y: y - 0.03, z: z0 + (j + 0.5) * dz, trait: false });
      }
    }
  }
  /**
   * Le dedans commun des maisons où l'on entre : les fenêtres de papier vues de dedans (le jour les traverse : elles
   * brillent), le plafond de lattes noircies par la fumée du foyer, ses poutres.
   */
  function dedansCommun(a, m) {
    const { w2, l2, murH, sP } = m;
    for (const s of [-1, 1]) {
      for (let z = -l2 + 1.4; z < l2 - 1.0; z += 2.6) {
        if (s === sP && z > -2.05 && z < 2.05) continue;
        shoji(a, 1.5, 1.0, 4, 3, { x: s * (w2 - 0.17), y: 1.62, z, ry: -s * PI / 2, sorte: 'lampe' });
      }
      for (const x of [-w2 + 1.5, w2 - 1.5]) shoji(a, 1.5, 1.0, 4, 3, { x, y: 1.62, z: s * (l2 - 0.17), ry: s > 0 ? PI : 0, sorte: 'lampe' });
    }
    a.piece(new THREE.BoxGeometry(2 * w2 - 0.32, 0.06, 2 * l2 - 0.32, 1, 1, Math.round((2 * l2 - 0.32) / 0.31)), '#3a2c22', { y: murH - 0.03, teinte: (x, y, z) => (Math.floor((z + 20) / 0.31) % 2 ? '#3a2c22' : '#2e231b') });
    for (let z = -l2 + 1.8; z < l2 - 0.5; z += 2.6) a.boite(2 * w2 - 0.32, 0.26, 0.24, '#2a201a', { y: murH - 0.2, z });
  }
  /**
   * Ce qui arrête dans une maison où l'on entre (la porte dans le mur long du côté sP, de z = −0,85 à 0,85) : ses murs ;
   * pour la caméra, leurs blocs (la porte libre, le linteau au-dessus) et le plafond (dessous, elle se rapproche) ; la
   * pierre du seuil.
   */
  function mursOuverts(X, Y, Z, m) {
    const { w2, l2, murH, sP } = m, xs = sP * w2;
    const mur = (x0, z0, x1, z1) => monde.mur(X + x0, Z + z0, X + x1, Z + z1, 0.28);
    mur(-w2, -l2, w2, -l2); mur(-w2, l2, w2, l2); mur(-xs, -l2, -xs, l2);
    mur(xs, -l2, xs, -0.85); mur(xs, 0.85, xs, l2);
    const haut = Y + murH, bloc = (xa, xb, z0, z1, bas = Y - 1) => monde.bloc(X + Math.min(xa, xb), X + Math.max(xa, xb), Z + z0, Z + z1, bas, haut);
    bloc(-w2 - 0.1, w2 + 0.1, -l2 - 0.1, -l2 + 0.1); bloc(-w2 - 0.1, w2 + 0.1, l2 - 0.1, l2 + 0.1);
    bloc(-xs - 0.1, -xs + 0.1, -l2, l2);
    bloc(xs - 0.1, xs + 0.1, -l2, -0.85); bloc(xs - 0.1, xs + 0.1, 0.85, l2); bloc(xs - 0.1, xs + 0.1, -0.85, 0.85, Y + 2.35);
    monde.toit(X - w2 - 0.2, X + w2 + 0.2, Z - l2 - 0.2, Z + l2 + 0.2, Y + murH - 0.06, Y + m.yR + 1);
    const [x0, x1] = sP > 0 ? [w2 - 0.2, w2 + 0.95] : [-w2 - 0.95, -w2 + 0.2];
    monde.surface(X + x0, X + x1, Z - 0.85, Z + 0.85, Y + m.socle + 0.02, { sol: 'pierre' });
  }

  /**
   * Le minshuku, dedans (la porte à l'ouest) : l'entrée en terre battue (doma) le long du mur de la porte, le meuble à
   * chaussures, les chaussons sur la marche, la jarre d'eau, le bois du foyer, les parapluies ; le plancher et son
   * foyer (irori), les ombles (iwana) grillés au sel plantés dans la cendre, la bouilloire au crochet, les coussins ; les
   * fusuma peints, ouverts sur la chambre de tatamis : deux futons, l'alcôve (tokonoma) et son rouleau « 一期一会 », la
   * table à thé, la lampe de papier. Dans le repère de la maison.
   */
  function construireMinshuku(a, m, X, Y, Z) {
    const { w2, l2, socle, murH } = m, yD = socle + 0.02, yI = socle + 0.46, yT = yI + 0.05, xA = -2.3, zT = 1.2;
    const IR = { x: 1.0, z: -2.8 }, FUTONS = [2.0, 3.15], ZF = 3.9, TABLE = [-1.0, 4.3], ANDON = [-1.85, 6.3], TOKO = 0.9;
    MAISON.minshuku.dedans = { IR, yI, yT, FUTONS, ZF, TABLE, TOKO, zT };
    // l'entrée en terre battue, la marche (agari-kamachi) ; le plancher autour du foyer ; la chambre
    a.boite(xA + w2 - 0.16, 0.04, 2 * l2 - 0.32, '#8a7660', { x: (xA - w2 + 0.16) / 2, y: yD })
      .boite(0.14, 0.44, 2 * l2 - 0.32, '#3e2f25', { x: xA, y: socle + 0.24 });
    plancher(a, xA + 0.07, w2 - 0.16, -l2 + 0.16, IR.z - 0.675, yI);
    plancher(a, xA + 0.07, w2 - 0.16, IR.z + 0.675, zT, yI);
    plancher(a, xA + 0.07, IR.x - 0.675, IR.z - 0.675, IR.z + 0.675, yI);
    plancher(a, IR.x + 0.675, w2 - 0.16, IR.z - 0.675, IR.z + 0.675, yI);
    tatamis(a, xA + 0.07, w2 - 0.16, zT, l2 - 0.16, yT, 7, 3);
    // le foyer, le crochet (jizai-kagi) et son poisson de bois, la bouilloire ; les ombles grillés au sel, plantés en rond
    // dans la cendre, la tête en haut (la queue et les nageoires blanches de sel) ; les coussins
    foyer(a, IR.x, yI, IR.z);
    a.cylindre(0.03, 0.03, murH - yI - 1.2, 6, '#9a8a5a', { x: IR.x, y: (murH + yI + 1.2) / 2, z: IR.z })
      .ovale(0.16, '#5a4433', { x: IR.x, y: yI + 1.35, z: IR.z, sx: 0.35, sy: 0.6, sz: 1.2 }, 8)
      .baton([IR.x, yI + 1.2, IR.z], [IR.x, yI + 0.78, IR.z], 0.012, '#2a2420', 4)
      .ovale(0.2, '#2a2826', { x: IR.x, y: yI + 0.6, z: IR.z, sy: 0.75 }, 12)
      .cylindre(0.04, 0.05, 0.12, 8, '#2a2826', { x: IR.x + 0.2, y: yI + 0.64, z: IR.z, rz: -0.9 });
    vapeurs.push({ x: X + IR.x + 0.25, z: Z + IR.z, y: Y + yI + 0.72, n: 3, haut: 1.2, large: 0.08, taille: 0.22 });
    for (let k = 0; k < 6; k++) {
      const t = (k / 6) * 2 * PI + 0.25, c = Math.cos(t), s = Math.sin(t), fx = IR.x + c * 0.42, fz = IR.z + s * 0.42, ry = PI / 2 - t;
      a.baton([fx, yI - 0.04, fz], [fx, yI + 0.42, fz], 0.006, '#c9a87a', 4, { trait: false })
        .ovale(0.1, k % 2 ? '#8a8470' : '#7e7866', { x: fx, y: yI + 0.29, z: fz, sx: 0.3, sz: 0.42, ry }, 8)
        .ovale(0.06, '#d8d2c0', { x: fx - c * 0.028, y: yI + 0.27, z: fz - s * 0.028, sx: 0.32, sy: 1.25, sz: 0.4, ry, trait: false }, 6)
        .cone(0.04, 0.07, 4, '#f2eee4', { x: fx, y: yI + 0.165, z: fz, sx: 0.35, ry });
    }
    for (const [dx, dz] of [[-1.05, 0], [0, -1.05], [1.05, 0], [0, 1.05]]) a.boite(0.62, 0.08, 0.62, '#7a3a3a', { x: IR.x + dx, y: yI + 0.04, z: IR.z + dz });
    // l'entrée : le meuble à chaussures et ses petites portes, des chaussons rangés sur le bord du plancher, la jarre
    // d'eau et sa louche, le bois du foyer contre le mur du nord, le porte-parapluies et deux parapluies de papier
    a.boite(0.45, 1.0, 1.4, '#6a5240', { x: -w2 + 0.4, y: yD + 0.5, z: -2.3 });
    for (let j = 0; j < 4; j++) for (const dz of [-0.33, 0.33]) a.boite(0.012, 0.2, 0.6, '#4a3a2c', { x: -w2 + 0.63, y: yD + 0.17 + j * 0.24, z: -2.3 + dz, trait: false });
    for (let k = 0; k < 3; k++) {
      for (const d of [-0.07, 0.07]) a.boite(0.1, 0.03, 0.24, k === 1 ? '#c84a3a' : '#4a6a9a', { x: xA + 0.3, y: yI + 0.015, z: -1.7 + k * 0.42 + d, trait: false });
    }
    a.ovale(0.3, '#7a5236', { x: -w2 + 0.6, y: yD + 0.34, z: -l2 + 0.7, sy: 1.15 }, 12)
      .cylindre(0.27, 0.27, 0.04, 14, '#5a4436', { x: -w2 + 0.6, y: yD + 0.67, z: -l2 + 0.7 })
      .baton([-w2 + 0.6, yD + 0.7, -l2 + 0.7], [-w2 + 0.85, yD + 0.78, -l2 + 0.85], 0.012, '#c9a87a', 4)
      .cylindre(0.05, 0.04, 0.06, 8, '#c9a87a', { x: -w2 + 0.85, y: yD + 0.78, z: -l2 + 0.85 });
    for (let k = 0; k < 3; k++) {
      for (let j = 0; j < 5 - k; j++) a.cylindre(0.08, 0.08, 0.7, 7, j % 2 ? '#a07a52' : '#8a6644', { x: -2.95 + (j - (4 - k) / 2) * 0.17, y: yD + 0.1 + k * 0.15, z: -l2 + 0.45, rz: PI / 2 });
    }
    a.cylindre(0.12, 0.12, 0.45, 10, '#5a4436', { x: -w2 + 0.4, y: yD + 0.23, z: 1.45 });
    for (const [c, d] of [['#c8402c', -0.04], ['#3f5a8a', 0.05]]) a.cone(0.06, 0.95, 8, c, { x: -w2 + 0.4 + d, y: yD + 0.62, z: 1.45 + d, rx: PI, rz: d * 2 });
    // les fusuma : deux murs de portes coulissantes, le passage au milieu ; le paysage peint, côté foyer ; le linteau
    for (const [x0, x1] of [[xA + 0.07, -0.5], [1.7, w2 - 0.16]]) {
      const n = Math.max(1, Math.round((x1 - x0) / 0.9)), l = (x1 - x0) / n;
      for (let k = 0; k < n; k++) {
        const x = x0 + (k + 0.5) * l;
        a.boite(l - 0.03, 1.8, 0.04, '#ece4cc', { x, y: yT + 0.9, z: zT + (k % 2 ? 0.005 : -0.005) })
          .boite(l - 0.01, 0.05, 0.06, '#3e2f25', { x, y: yT + 1.78, z: zT })
          .boite(0.03, 1.8, 0.058, '#3e2f25', { x: x - l / 2 + 0.02, y: yT + 0.9, z: zT, trait: false });
        ecrire({ x: X, y: Y, z: Z, ry: 0 }, { texte: '', fond: null, dessin: (c, W, H) => fusumaPeint(c, W, H, k + (x0 > 0 ? 3 : 0)), x, y: yT + 0.95, z: zT - 0.027, ry: PI, l: l - 0.12, h: 1.55 });
      }
    }
    a.boite(2 * w2 - 0.32 - (xA + w2), 0.12, 0.12, '#3e2f25', { x: (xA + 0.07 + w2 - 0.16) / 2, y: yT + 1.87, z: zT });
    // l'alcôve (tokonoma), contre le pignon du sud : son estrade, son pilier, le rouleau « 一期一会 » (chaque rencontre
    // est unique), un vase et sa branche fleurie
    const zt = l2 - 0.16;
    a.boite(1.7, 0.14, 0.62, '#4a3a2c', { x: TOKO, y: yT + 0.07, z: zt - 0.31 })
      .boite(0.12, murH - yT - 0.1, 0.12, '#6a5240', { x: TOKO - 0.91, y: (murH + yT - 0.1) / 2, z: zt - 0.62 })
      .boite(0.46, 1.2, 0.012, '#f3ead6', { x: TOKO, y: yT + 1.15, z: zt - 0.012 })
      .cylindre(0.015, 0.015, 0.54, 6, '#3e2f25', { x: TOKO, y: yT + 1.76, z: zt - 0.02, rz: PI / 2 })
      .cylindre(0.018, 0.018, 0.56, 6, '#3e2f25', { x: TOKO, y: yT + 0.55, z: zt - 0.02, rz: PI / 2 });
    ecrire({ x: X, y: Y, z: Z, ry: 0 }, { texte: '一期一会', vertical: true, fond: '#f3ead6', encre: '#2a2018', x: TOKO, y: yT + 1.15, z: zt - 0.02, ry: PI, l: 0.3, h: 1.05 });
    a.cylindre(0.07, 0.09, 0.26, 10, '#3f5a6a', { x: TOKO + 0.45, y: yT + 0.27, z: zt - 0.3 })
      .baton([TOKO + 0.45, yT + 0.38, zt - 0.3], [TOKO + 0.62, yT + 0.75, zt - 0.32], 0.01, '#5a4030', 4, { trait: false })
      .baton([TOKO + 0.5, yT + 0.5, zt - 0.3], [TOKO + 0.3, yT + 0.7, zt - 0.28], 0.008, '#5a4030', 4, { trait: false });
    for (let k = 0; k < 7; k++) a.boule(0.03, k % 2 ? '#f2b8c8' : '#e890a8', { x: TOKO + 0.38 + k * 0.04, y: yT + 0.6 + Math.sin(k * 1.3) * 0.08, z: zt - 0.3 + Math.cos(k * 1.9) * 0.03 }, 0);
    // les deux futons : le matelas, la couette (indigo à motifs, ou rouge), l'oreiller de son de sarrasin
    FUTONS.forEach((fx, i) => {
      a.boite(0.98, 0.1, 2.0, '#f4f0e6', { x: fx, y: yT + 0.05, z: ZF })
        .boite(0.96, 0.12, 1.55, i ? '#b8483a' : '#3f5a8a', { x: fx, y: yT + 0.16, z: ZF - 0.2 })
        .boite(0.97, 0.14, 0.1, '#f4f0e6', { x: fx, y: yT + 0.16, z: ZF + 0.55, trait: false })
        .boite(0.42, 0.11, 0.24, '#e8dfc6', { x: fx, y: yT + 0.155, z: ZF + 0.78 });
      for (let k = 0; k < 4; k++) a.boite(0.97, 0.004, 0.06, i ? '#e8c6b8' : '#c6d2e6', { x: fx, y: yT + 0.228, z: ZF - 0.85 + k * 0.32, trait: false });
    });
    // la table à thé (chabudai) : la théière, deux tasses, une assiette de gâteaux ; les coussins ; la lampe de papier
    a.cylindre(0.5, 0.5, 0.04, 18, '#7a5236', { x: TABLE[0], y: yT + 0.32, z: TABLE[1] });
    for (let k = 0; k < 4; k++) a.boite(0.05, 0.3, 0.05, '#5a4436', { x: TABLE[0] + Math.cos(k * PI / 2 + PI / 4) * 0.35, y: yT + 0.15, z: TABLE[1] + Math.sin(k * PI / 2 + PI / 4) * 0.35 });
    a.ovale(0.08, '#4a6a5a', { x: TABLE[0], y: yT + 0.41, z: TABLE[1], sy: 0.8 }, 10)
      .cylindre(0.012, 0.018, 0.08, 6, '#4a6a5a', { x: TABLE[0] + 0.09, y: yT + 0.43, z: TABLE[1], rz: -0.9 })
      .anneau(0.06, 0.008, '#3a2c22', { x: TABLE[0], y: yT + 0.5, z: TABLE[1], rx: PI / 2 });
    for (const [dx, dz] of [[0.25, 0.15], [-0.22, 0.2]]) a.cylindre(0.035, 0.028, 0.06, 10, '#e8e2d4', { x: TABLE[0] + dx, y: yT + 0.37, z: TABLE[1] + dz }).cylindre(0.03, 0.03, 0.005, 10, '#6a8a3a', { x: TABLE[0] + dx, y: yT + 0.398, z: TABLE[1] + dz, trait: false });
    a.cylindre(0.1, 0.1, 0.015, 12, '#e8e2d4', { x: TABLE[0] - 0.1, y: yT + 0.348, z: TABLE[1] - 0.25 });
    for (let k = 0; k < 3; k++) a.boite(0.05, 0.03, 0.05, k === 1 ? '#e8b8c8' : '#a8c86a', { x: TABLE[0] - 0.14 + k * 0.05, y: yT + 0.37, z: TABLE[1] - 0.25 });
    for (const [dx, dz] of [[0, 0.75], [0.75, 0], [0, -0.75]]) a.boite(0.55, 0.07, 0.55, '#7a3a3a', { x: TABLE[0] + dx, y: yT + 0.035, z: TABLE[1] + dz });
    a.boite(0.3, 0.06, 0.3, '#3e2f25', { x: ANDON[0], y: yT + 0.03, z: ANDON[1] })
      .boite(0.26, 0.5, 0.26, P.shoji, { x: ANDON[0], y: yT + 0.33, z: ANDON[1], sorte: 'lumiere' })
      .boite(0.3, 0.04, 0.3, '#3e2f25', { x: ANDON[0], y: yT + 0.6, z: ANDON[1] });

    // ce qui arrête : le foyer, les meubles, les fusuma, l'alcôve, les futons, la table, la lampe ; les sols
    monde.cercle(X + IR.x, Z + IR.z, 0.62);
    monde.mur(X - w2 + 0.4, Z - 3.0, X - w2 + 0.4, Z - 1.6, 0.32);
    monde.cercle(X - w2 + 0.6, Z - l2 + 0.7, 0.42);
    monde.mur(X - 3.4, Z - l2 + 0.45, X - 2.5, Z - l2 + 0.45, 0.25);
    monde.cercle(X - w2 + 0.4, Z + 1.45, 0.22);
    monde.mur(X + xA, Z + zT, X - 0.5, Z + zT, 0.12);
    monde.mur(X + 1.7, Z + zT, X + w2, Z + zT, 0.12);
    monde.mur(X + TOKO - 0.9, Z + zt - 0.35, X + TOKO + 0.9, Z + zt - 0.35, 0.36);
    for (const fx of FUTONS) monde.mur(X + fx, Z + ZF - 0.7, X + fx, Z + ZF + 0.7, 0.5);
    monde.cercle(X + TABLE[0], Z + TABLE[1], 0.55);
    monde.cercle(X + ANDON[0], Z + ANDON[1], 0.25);
    monde.surface(X - w2 + 0.16, X + xA, Z - l2 + 0.16, Z + l2 - 0.16, Y + yD + 0.02, { sol: 'terre' });
    monde.surface(X + xA, X + w2 - 0.16, Z - l2 + 0.16, Z + zT, Y + yI, { sol: 'bois' });
    monde.surface(X + xA, X + w2 - 0.16, Z + zT, Z + l2 - 0.16, Y + yT, { sol: 'bois' });
    lumieres.push({ x: X + IR.x, y: Y + yI + 0.15, z: Z + IR.z, halo: 0.3, sol: Y + yI, r: 2.6, c: '#ff9a4a' });
    lumieres.push({ x: X + ANDON[0], y: Y + yT + 0.35, z: Z + ANDON[1], halo: 0.35, sol: Y + yT, r: 3.6 });
  }

  /**
   * La boutique de tofu et de soba (la maison g4, la porte à l'ouest) : la terre battue partout (on garde ses chaussures),
   * le comptoir au nord et ses souvenirs (le tofu ferme de Gokayama noué d'une corde de paille, les boîtes de gâteaux, le
   * papier, le chat qui salue), les étagères derrière (bouteilles de saké, pots, serviettes) ; au sud, la cuisine (le
   * fourneau de terre, la marmite qui fume, les boîtes à soba, la planche et le couteau), la table et ses bancs, les bols
   * de soba ; à l'est, l'estrade de tatamis (une table basse, le thé) ; le menu sur des planchettes ; deux lanternes de
   * papier. Dans le repère de la maison.
   */
  function construireBoutique(a, m, X, Y, Z) {
    const { w2, l2, socle, murH } = m, yD = socle + 0.02, yK = socle + 0.42, xK = 1.4;
    const COMPTOIR = { x0: -2.8, x1: 0.8, z0: -4.3, z1: -3.7, h: 0.95 }, TABLE = { x: -1.2, z: 3.2 }, FOURNEAU = { x: -3.35, z: 5.3 }, BASSE = { x: 2.75, z: -1.2 };
    MAISON.g4.dedans = { yD, yK, COMPTOIR, TABLE, FOURNEAU, BASSE, xK };
    // les sols : la terre battue ; l'estrade de tatamis (sa marche) ; le comptoir (son plateau, ses planches de façade)
    a.boite(xK + w2 - 0.16, 0.04, 2 * l2 - 0.32, '#8a7660', { x: (xK - w2 + 0.16) / 2, y: yD });
    a.boite(0.14, 0.4, 2 * l2 - 0.32, '#3e2f25', { x: xK, y: socle + 0.22 });
    tatamis(a, xK + 0.07, w2 - 0.16, -l2 + 0.16, l2 - 0.16, yK, 3, 6);
    const C = COMPTOIR, hC = yD + C.h;
    a.boite(C.x1 - C.x0, C.h - 0.06, C.z1 - C.z0 - 0.04, '#6a5240', { x: (C.x0 + C.x1) / 2, y: yD + (C.h - 0.06) / 2, z: (C.z0 + C.z1) / 2 })
      .boite(C.x1 - C.x0 + 0.08, 0.06, C.z1 - C.z0 + 0.06, P.bois, { x: (C.x0 + C.x1) / 2, y: hC - 0.03, z: (C.z0 + C.z1) / 2 });
    for (let x = C.x0 + 0.15; x < C.x1 - 0.05; x += 0.3) a.boite(0.02, C.h - 0.16, 0.012, '#4a3a2c', { x, y: yD + (C.h - 0.06) / 2, z: C.z1 - 0.014, trait: false });
    // les deux battants bas qui ferment le côté de la vendeuse, entre le comptoir et le mur, et l'estrade
    a.boite(C.x0 + w2 - 0.16, 0.85, 0.05, '#6a5240', { x: (C.x0 - w2 + 0.16) / 2, y: yD + 0.425, z: (C.z0 + C.z1) / 2 })
      .boite(xK - C.x1, 0.85, 0.05, '#6a5240', { x: (C.x1 + xK) / 2, y: yD + 0.425, z: (C.z0 + C.z1) / 2 });
    // sur le comptoir : le tofu ferme (五箇山とうふ), des blocs blancs noués d'une corde de paille ; les boîtes de gâteaux ;
    // des cartes de papier washi ; le chat qui salue (manekineko) ; le plateau des pièces
    for (let k = 0; k < 4; k++) {
      const x = C.x0 + 0.35 + k * 0.24, z = C.z1 - 0.22;
      a.boite(0.16, 0.1, 0.12, '#f6f2e6', { x, y: hC + 0.05, z, ry: 0.1 * k })
        .boite(0.165, 0.012, 0.125, '#c9a65a', { x, y: hC + 0.07, z, ry: 0.1 * k, trait: false })
        .boite(0.012, 0.105, 0.128, '#c9a65a', { x, y: hC + 0.05, z, ry: 0.1 * k, trait: false })
        .baton([x, hC + 0.1, z], [x + 0.02, hC + 0.2, z], 0.006, '#c9a65a', 3, { trait: false });
    }
    for (let k = 0; k < 3; k++) {
      for (let j = 0; j < 3 - k; j++) a.boite(0.22, 0.07, 0.15, ['#c8402c', '#3f6a8a', '#e8b84a'][(j + k) % 3], { x: C.x0 + 1.5 + j * 0.25 + k * 0.12, y: hC + 0.035 + k * 0.072, z: C.z1 - 0.2 });
    }
    for (let k = 0; k < 5; k++) a.boite(0.13, 0.006, 0.18, ['#f3ead6', '#e8d4c8', '#d8e2d0'][k % 3], { x: C.x0 + 2.45 + (k % 3) * 0.15, y: hC + 0.004 + k * 0.007, z: C.z1 - 0.22 + (k % 2) * 0.03, ry: 0.15 * k, trait: false });
    {
      const nx = C.x1 - 0.3, nz = C.z1 - 0.2, ny = hC;
      a.ovale(0.09, '#fbf8f0', { x: nx, y: ny + 0.09, z: nz, sy: 1.0 }, 10)
        .boule(0.075, '#fbf8f0', { x: nx, y: ny + 0.22, z: nz + 0.01 }, 1)
        .cone(0.025, 0.05, 4, '#fbf8f0', { x: nx - 0.045, y: ny + 0.3, z: nz + 0.01 })
        .cone(0.025, 0.05, 4, '#fbf8f0', { x: nx + 0.045, y: ny + 0.3, z: nz + 0.01 })
        .baton([nx - 0.07, ny + 0.17, nz + 0.04], [nx - 0.1, ny + 0.29, nz + 0.05], 0.022, '#fbf8f0', 6)
        .anneau(0.06, 0.012, '#d8302c', { x: nx, y: ny + 0.155, z: nz + 0.01, rx: PI / 2 + 0.2 })
        .boule(0.018, '#e8b941', { x: nx, y: ny + 0.14, z: nz + 0.07 }, 0)
        .boule(0.012, '#2a2420', { x: nx - 0.025, y: ny + 0.23, z: nz + 0.07, trait: false }, 0)
        .boule(0.012, '#2a2420', { x: nx + 0.025, y: ny + 0.23, z: nz + 0.07, trait: false }, 0)
        .boite(0.12, 0.03, 0.09, '#5a4436', { x: C.x0 + 3.0, y: hC + 0.015, z: C.z1 - 0.15 });
    }
    // les étagères du mur du nord, derrière la vendeuse : les bouteilles de saké, les pots, les serviettes pliées
    for (let k = 0; k < 3; k++) a.boite(3.2, 0.04, 0.32, '#6a5240', { x: -1.0, y: yD + 0.7 + k * 0.5, z: -l2 + 0.33 });
    for (const x of [-2.6, 0.6]) a.boite(0.05, 1.8, 0.32, '#5a4436', { x, y: yD + 0.9, z: -l2 + 0.33 });
    for (let k = 0; k < 7; k++) {
      const x = -2.4 + k * 0.42;
      a.cylindre(0.05, 0.055, 0.28, 8, k % 2 ? '#3f5a3a' : '#6a4a2a', { x, y: yD + 0.86, z: -l2 + 0.33 })
        .cylindre(0.02, 0.03, 0.1, 6, k % 2 ? '#3f5a3a' : '#6a4a2a', { x, y: yD + 1.04, z: -l2 + 0.33 })
        .boite(0.08, 0.1, 0.005, '#f3ead6', { x, y: yD + 0.86, z: -l2 + 0.388, trait: false });
      a.cylindre(0.08, 0.07, 0.16, 10, ['#8a5a3a', '#4a5a6a', '#a8846a'][k % 3], { x: x + 0.1, y: yD + 1.3, z: -l2 + 0.33 });
      a.boite(0.26, 0.05, 0.2, ['#f2efe6', '#3f5a8a', '#c8402c'][k % 3], { x: x + 0.05, y: yD + 1.745, z: -l2 + 0.33 });
    }
    // la cuisine : le fourneau de terre (kamado), la marmite et son couvercle, les boîtes à soba empilées ; la table où l'on
    // coupe les soba (la planche, le rouleau, le couteau, la farine)
    const F = FOURNEAU;
    a.boite(0.95, 0.75, 1.3, '#b8a890', { x: F.x, y: yD + 0.375, z: F.z })
      .boite(0.04, 0.26, 0.3, '#2a2420', { x: F.x + 0.475, y: yD + 0.25, z: F.z - 0.3, trait: false })
      .boite(0.04, 0.26, 0.3, '#2a2420', { x: F.x + 0.475, y: yD + 0.25, z: F.z + 0.3, trait: false });
    for (const dz of [-0.3, 0.3]) a.boite(0.012, 0.2, 0.24, '#ff7a2a', { x: F.x + 0.5, y: yD + 0.24, z: F.z + dz, sorte: 'lampe', trait: false });
    a.cylindre(0.3, 0.26, 0.3, 14, '#3a3a3e', { x: F.x, y: yD + 0.9, z: F.z - 0.3 })
      .cylindre(0.31, 0.31, 0.03, 14, '#8a6a4a', { x: F.x, y: yD + 1.065, z: F.z - 0.3 })
      .cylindre(0.03, 0.03, 0.06, 6, '#5a4436', { x: F.x, y: yD + 1.1, z: F.z - 0.3 });
    for (let k = 0; k < 3; k++) a.boite(0.36, 0.1, 0.36, '#c9a87a', { x: F.x, y: yD + 0.8 + k * 0.105, z: F.z + 0.32 });
    vapeurs.push({ x: X + F.x, z: Z + F.z - 0.3, y: Y + yD + 1.1, n: 4, haut: 1.4, large: 0.16, taille: 0.3 });
    a.boite(0.7, 0.8, 1.2, '#7a5a40', { x: -1.7, y: yD + 0.4, z: 5.4 })
      .boite(0.55, 0.03, 0.8, '#d9b98a', { x: -1.7, y: yD + 0.815, z: 5.4 })
      .cylindre(0.025, 0.025, 0.55, 8, '#c49564', { x: -1.7, y: yD + 0.86, z: 5.25, rz: PI / 2 })
      .boite(0.24, 0.01, 0.3, '#f4f0e8', { x: -1.75, y: yD + 0.836, z: 5.62, trait: false })
      .boite(0.04, 0.012, 0.26, '#3a3a3e', { x: -1.55, y: yD + 0.84, z: 5.65 });
    // la table et ses deux bancs, sur la terre battue ; deux bols de soba (le bouillon, les nouilles, la ciboule), les
    // baguettes, une tasse de thé
    const T = TABLE;
    a.boite(1.5, 0.05, 0.75, P.bois, { x: T.x, y: yD + 0.72, z: T.z });
    for (const [dx, dz] of [[-0.65, -0.3], [0.65, -0.3], [-0.65, 0.3], [0.65, 0.3]]) a.boite(0.06, 0.7, 0.06, '#5a4436', { x: T.x + dx, y: yD + 0.35, z: T.z + dz });
    for (const s of [-1, 1]) {
      a.boite(1.5, 0.05, 0.3, P.bois2, { x: T.x, y: yD + 0.43, z: T.z + s * 0.62 });
      for (const dx of [-0.6, 0.6]) a.boite(0.05, 0.42, 0.24, '#5a4436', { x: T.x + dx, y: yD + 0.21, z: T.z + s * 0.62 });
    }
    for (const dx of [-0.35, 0.3]) {
      a.cylindre(0.1, 0.06, 0.08, 12, '#3a2c2a', { x: T.x + dx, y: yD + 0.785, z: T.z - 0.12 })
        .cylindre(0.085, 0.085, 0.006, 12, '#8a5a2a', { x: T.x + dx, y: yD + 0.815, z: T.z - 0.12, trait: false });
      for (let k = 0; k < 6; k++) a.boite(0.1, 0.006, 0.008, '#c9b48a', { x: T.x + dx, y: yD + 0.82, z: T.z - 0.15 + k * 0.012, ry: 0.3 * Math.sin(k), trait: false });
      a.boite(0.02, 0.008, 0.02, '#6aa84a', { x: T.x + dx + 0.03, y: yD + 0.824, z: T.z - 0.1, trait: false });
      for (const d of [-0.012, 0.012]) a.boite(0.012, 0.008, 0.21, '#a8402c', { x: T.x + dx + 0.13 + d, y: yD + 0.75, z: T.z - 0.08, trait: false });
    }
    a.cylindre(0.035, 0.03, 0.08, 10, '#5a6a5a', { x: T.x + 0.6, y: yD + 0.785, z: T.z + 0.1 });
    // l'estrade : une table basse, deux coussins, le thé et des gâteaux ; une boîte d'osier
    const B = BASSE;
    a.boite(0.9, 0.04, 0.6, '#7a5236', { x: B.x, y: yK + 0.3, z: B.z });
    for (const [dx, dz] of [[-0.38, -0.22], [0.38, -0.22], [-0.38, 0.22], [0.38, 0.22]]) a.boite(0.05, 0.28, 0.05, '#5a4436', { x: B.x + dx, y: yK + 0.14, z: B.z + dz });
    for (const dz of [-0.62, 0.62]) a.boite(0.55, 0.07, 0.55, '#7a3a3a', { x: B.x, y: yK + 0.035, z: B.z + dz });
    a.ovale(0.07, '#8a6a4a', { x: B.x - 0.15, y: yK + 0.38, z: B.z, sy: 0.8 }, 10)
      .cylindre(0.033, 0.027, 0.06, 10, '#e8e2d4', { x: B.x + 0.15, y: yK + 0.35, z: B.z - 0.1 })
      .cylindre(0.033, 0.027, 0.06, 10, '#e8e2d4', { x: B.x + 0.15, y: yK + 0.35, z: B.z + 0.12 })
      .boite(0.18, 0.02, 0.12, '#e8e2d4', { x: B.x + 0.05, y: yK + 0.33, z: B.z + 0.35 });
    for (let k = 0; k < 3; k++) a.boule(0.03, k === 1 ? '#f2b8c8' : '#f6f0e2', { x: B.x + 0.0 + k * 0.05, y: yK + 0.36, z: B.z + 0.35 }, 0);
    // le menu : des planchettes de bois clair écrites à l'encre, sur le pignon du sud, au-dessus de la table
    const MENU = [['ざるそば', '八〇〇円'], ['かけそば', '七〇〇円'], ['とうふ田楽', '五〇〇円'], ['岩魚の塩焼き', '六〇〇円']];
    MENU.forEach(([plat, prix], k) => {
      const x = -1.2 + k * 0.42, z = l2 - 0.17, y = yD + 1.95;
      a.boite(0.3, 0.95, 0.02, '#e8d6b0', { x, y, z: z - 0.01 });
      ecrire({ x: X, y: Y, z: Z, ry: 0 }, { texte: plat, sous: '', vertical: true, fond: '#e8d6b0', encre: '#2a2018', x, y: y + 0.09, z: z - 0.022, ry: PI, l: 0.24, h: 0.68 });
      ecrire({ x: X, y: Y, z: Z, ry: 0 }, { texte: prix, vertical: true, fond: '#e8d6b0', encre: '#a8302c', x: x - 0.002, y: y - 0.36, z: z - 0.022, ry: PI, l: 0.16, h: 0.2 });
    });
    // deux lanternes de papier pendues aux poutres
    for (const [lx, lz] of [[-1.0, -1.0], [-1.2, 3.2]]) {
      a.baton([lx, murH - 0.05, lz], [lx, murH - 0.95, lz], 0.006, '#2a2420', 3, { trait: false })
        .chochin(lx, murH - 1.15, lz, 7, '#f2e6c8');
      lumieres.push({ x: X + lx, y: Y + murH - 1.15, z: Z + lz, halo: 0.4, sol: Y + yD, r: 4.2 });
    }

    // ce qui arrête : le comptoir, les étagères, le fourneau, la table de la cuisine, la table et ses bancs, la table
    // basse ; les sols
    monde.mur(X + C.x0, Z + (C.z0 + C.z1) / 2, X + C.x1, Z + (C.z0 + C.z1) / 2, 0.38);
    // (derrière le comptoir, c'est chez la vendeuse : fermé par deux battants bas, de part et d'autre, et le bord de
    // l'estrade)
    monde.mur(X - w2 + 0.16, Z + (C.z0 + C.z1) / 2, X + C.x0, Z + (C.z0 + C.z1) / 2, 0.2);
    monde.mur(X + C.x1, Z + (C.z0 + C.z1) / 2, X + xK, Z + (C.z0 + C.z1) / 2, 0.2);
    monde.mur(X + xK + 0.02, Z - l2 + 0.16, X + xK + 0.02, Z + C.z0, 0.12);
    monde.mur(X - 2.6, Z - l2 + 0.33, X + 0.6, Z - l2 + 0.33, 0.3);
    monde.mur(X + F.x, Z + F.z - 0.65, X + F.x, Z + F.z + 0.65, 0.55);
    monde.mur(X - 1.7, Z + 4.8, X - 1.7, Z + 6.0, 0.42);
    monde.mur(X + T.x - 0.75, Z + T.z, X + T.x + 0.75, Z + T.z, 0.82);
    monde.cercle(X + B.x, Z + B.z, 0.5);
    monde.surface(X - w2 + 0.16, X + xK, Z - l2 + 0.16, Z + l2 - 0.16, Y + yD + 0.02, { sol: 'terre' });
    monde.surface(X + xK, X + w2 - 0.16, Z - l2 + 0.16, Z + l2 - 0.16, Y + yK, { sol: 'bois' });
    lumieres.push({ x: X + F.x + 0.5, y: Y + yD + 0.25, z: Z + F.z, halo: 0.2, sol: Y + yD, r: 1.8, c: '#ff9a4a' });
  }

  // ---------------------------------------------------------------- La maison-musée (民俗館), où l'on entre
  // (construite dans la maison elle-même, dans son repère : la porte à l'est, au milieu du mur long)
  function construireMusee(a, m) {
    const { w2, l2, socle, murH } = m, yD = socle + 0.02, yI = socle + 0.46, yT = yI + 0.05;
    SOL_MUSEE = yI;
    // l'échelle (son pied x, z ; son haut x1, z1, h) et la trappe du plafond [x0, x1, z0, z1], au nord-ouest ; au grenier,
    // les claies [x, z] (le long de z), le dévidoir, la lampe
    const ECH = { x: -3.0, z: -5.75, x1: -3.1, z1: -6.3, h: murH + 0.95 }, TR = { x0: -3.6, x1: -2.4, z0: -6.8, z1: -5.4 };
    const CLAIES = [[2.75, -3.2], [2.75, 0.2], [2.75, 3.6], [-2.75, -1.6], [-2.75, 1.8], [-2.75, 5.2]], DEVIDOIR = [0.9, 6.1], ANDON = [-0.4, 2.6];
    MAISON.musee.grenier = { ECH, TR, CLAIES, DEVIDOIR };
    const xA = 2.55; // le bord du plancher, au-dessus de la terre battue de l'entrée (le doma)
    const zT = 3.2; // la chambre de tatamis, au sud
    // le sol de terre battue (doma), le plancher (itanoma) et sa marche ; la chambre de tatamis
    a.boite(w2 - 0.16 - xA, 0.04, 2 * l2 - 0.32, '#8a7660', { x: (xA + w2 - 0.16) / 2, y: yD });
    // (le plancher, en lames le long de x ; on y laisse la planche du secret, à part, et sa fosse dessous)
    // la trappe qui sonne creux : trois planches du plancher, assemblées dessous (dans le repère de la maison) ; un
    // centimètre de vide tout autour (les plus attentifs le verront)
    const PL = { x: -2.95, z: -2.15, l: 1.05, p: 0.96 };
    const lames = (x0, x1, z0, z1) => {
      if (x1 - x0 < 0.01 || z1 - z0 < 0.01) return;
      a.piece(new THREE.BoxGeometry(x1 - x0, 0.08, z1 - z0, 1, 1, Math.max(1, Math.round((z1 - z0) / 0.32))), P.bois, { x: (x0 + x1) / 2, y: yI - 0.04, z: (z0 + z1) / 2, teinte: (x, y, z) => (Math.floor((z + 20) / 0.32) % 2 ? P.bois : P.bois2) });
    };
    const [px0, px1, pz0, pz1] = [PL.x - PL.l / 2, PL.x + PL.l / 2, PL.z - PL.p / 2, PL.z + PL.p / 2];
    const IR = { x: -1.0, z: -2.15 }; // le foyer
    /** Un plancher de lames de x0 à x1, z0 à z1, percé des trous [x0, x1, z0, z1]. */
    const plancherTroue = (x0, x1, z0, z1, trous) => {
      const zs = [...new Set([z0, z1, ...trous.flatMap((t) => [t[2], t[3]])])].filter((v) => v >= z0 && v <= z1).sort((u, v) => u - v);
      for (let k = 0; k < zs.length - 1; k++) {
        const za = zs[k], zb = zs[k + 1], zm = (za + zb) / 2;
        let xa = x0;
        for (const [ta, tb] of trous.filter((t) => zm > t[2] && zm < t[3]).sort((u, v) => u[0] - v[0])) { lames(xa, Math.min(ta, x1), za, zb); xa = Math.max(xa, tb); }
        lames(xa, x1, za, zb);
      }
    };
    plancherTroue(-w2 + 0.16, xA - 0.07, -l2 + 0.16, zT, [[px0, px1, pz0, pz1], [IR.x - 0.675, IR.x + 0.675, IR.z - 0.675, IR.z + 0.675]]);
    a.boite(0.14, 0.44, 2 * l2 - 0.32, '#3e2f25', { x: xA, y: socle + 0.22 + 0.02 });
    // la chambre de tatamis : les nattes bordées de noir, le cadre ; l'autel bouddhique (butsudan) au mur du sud
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 2; j++) {
        const x0 = -w2 + 0.16 + i * ((xA + w2 - 0.16) / 4), z0 = zT + j * ((l2 - 0.16 - zT) / 2), dx = (xA + w2 - 0.16) / 4, dz = (l2 - 0.16 - zT) / 2;
        a.boite(dx - 0.04, 0.06, dz - 0.04, '#cfc49a', { x: x0 + dx / 2, y: yT - 0.03, z: z0 + dz / 2 })
          .boite(dx - 0.02, 0.055, 0.03, '#2a2a28', { x: x0 + dx / 2, y: yT - 0.03, z: z0 + 0.015, trait: false });
      }
    }
    butsudan(a, -1.2, yT, l2 - 0.5);
    // les portes coulissantes (fusuma) entre le plancher et la chambre, ouvertes, peintes de montagnes
    for (const x of [-w2 + 0.7, -w2 + 1.55]) a.boite(0.86, 1.78, 0.04, '#e8dfc6', { x, y: yT + 0.89, z: zT + 0.05 });
    // le foyer (irori) : le cadre de bois, la cendre, les braises, le crochet (jizai-kagi) et son poisson de bois, la
    // bouilloire de fonte ; les coussins autour
    foyer(a, IR.x, yI, IR.z);
    a.cylindre(0.03, 0.03, murH - yI - 1.2, 6, '#9a8a5a', { x: IR.x, y: (murH + yI + 1.2) / 2, z: IR.z })
      .ovale(0.16, '#5a4433', { x: IR.x, y: yI + 1.35, z: IR.z, sx: 0.35, sy: 0.6, sz: 1.2 }, 8)
      .baton([IR.x, yI + 1.2, IR.z], [IR.x, yI + 0.78, IR.z], 0.012, '#2a2420', 4)
      .ovale(0.2, '#2a2826', { x: IR.x, y: yI + 0.6, z: IR.z, sy: 0.75 }, 12)
      .cylindre(0.04, 0.05, 0.12, 8, '#2a2826', { x: IR.x + 0.2, y: yI + 0.64, z: IR.z, rz: -0.9 });
    vapeurs.push({ x: MUSEE[1] + IR.x + 0.25, z: MUSEE[2] + IR.z, y: niveau(MUSEE[1], MUSEE[2]) + yI + 0.72, n: 3, haut: 1.2, large: 0.08, taille: 0.22 });
    for (const [dx, dz] of [[-1.05, 0], [0, -1.05], [0, 1.05]]) a.boite(0.62, 0.08, 0.62, '#7a3a3a', { x: IR.x + dx, y: yI + 0.04, z: IR.z + dz });
    // (à l'est du foyer, une pile de trois coussins épais : on s'y assoit)
    for (let k = 0; k < 3; k++) a.boite(0.6 - k * 0.02, 0.09, 0.6 - k * 0.02, k % 2 ? '#6a3434' : '#7a3a3a', { x: IR.x + 1.05, y: yI + 0.045 + k * 0.095, z: IR.z, ry: k * 0.12 });
    // la lampe de papier (andon), allumée la nuit, près du foyer
    a.boite(0.3, 0.06, 0.3, '#3e2f25', { x: 1.5, y: yI + 0.03, z: -3.6 })
      .boite(0.26, 0.5, 0.26, P.shoji, { x: 1.5, y: yI + 0.33, z: -3.6 })
      .boite(0.3, 0.04, 0.3, '#3e2f25', { x: 1.5, y: yI + 0.6, z: -3.6 });
    // le nord : ce que montre le musée (le mino et le chapeau de paille au mur, des bottes de paille pour la neige, la
    // sasara et les baguettes de la kokiriko sur un présentoir, des feuilles de papier), le panneau du salpêtre ; l'échelle
    // qui monte au grenier
    a.boite(2.2, 0.06, 0.5, P.bois, { x: -1.2, y: yI + 0.75, z: -l2 + 0.45 })
      .boite(2.2, 0.06, 0.5, P.bois, { x: -1.2, y: yI + 0.3, z: -l2 + 0.45 });
    for (const x of [-2.25, -0.15]) a.boite(0.06, 0.8, 0.5, '#3e2f25', { x, y: yI + 0.4, z: -l2 + 0.45 });
    for (const [x, c] of [[-2.0, '#c9a65a'], [-1.65, '#b8975a']]) a.cylindre(0.07, 0.09, 0.3, 8, c, { x, y: yI + 0.95, z: -l2 + 0.45 }).ovale(0.09, c, { x, y: yI + 0.86, z: -l2 + 0.52, sy: 0.5, sz: 1.5 }, 6);
    for (let k = 0; k < 9; k++) a.boite(0.012, 0.12, 0.05, '#e8d29a', { x: -1.1 + Math.cos(PI * k / 8) * 0.17, y: yI + 0.86 + Math.sin(PI * k / 8) * 0.17, z: -l2 + 0.42, rz: PI * k / 8 - PI / 2 });
    a.baton([-0.75, yI + 0.8, -l2 + 0.45], [-0.45, yI + 0.82, -l2 + 0.5], 0.014, '#d8c27a', 5).baton([-0.72, yI + 0.82, -l2 + 0.52], [-0.42, yI + 0.8, -l2 + 0.42], 0.014, '#d8c27a', 5);
    a.boite(0.42, 0.012, 0.3, '#f6f1e2', { x: -0.4, y: yI + 0.34, z: -l2 + 0.42, trait: false });
    // le mino et le chapeau de paille, pendus au mur du nord
    a.piece(new THREE.CylinderGeometry(0.2, 0.42, 0.95, 18, 2, true, PI * 0.15, PI * 0.7), '#c9a65a', { x: 1.0, y: yI + 1.35, z: -l2 + 0.18, ry: PI, sz: 0.4 })
      .cone(0.38, 0.2, 14, '#d9bd78', { x: 2.0, y: yI + 1.6, z: -l2 + 0.22, rx: PI / 2 - 0.15 });
    // le panneau du salpêtre (塩硝), sur le mur ouest
    a.boite(0.04, 0.8, 1.1, '#5a4433', { x: -w2 + 0.2, y: yI + 1.3, z: -4.4 });
    ecrire({ x: MUSEE[1], y: MAISON.musee.y, z: MUSEE[2], ry: 0 }, { texte: '塩硝の里', sous: '五箇山', lignes: 3, fond: '#f3ead6', encre: '#2a2018', x: -w2 + 0.225, y: yI + 1.3, z: -4.4, ry: PI / 2, l: 1.0, h: 0.7 });
    // l'échelle du grenier : elle monte par une trappe du plafond et dépasse au-dessus du plancher du haut (on s'y tient
    // en arrivant)
    for (const s of [-1, 1]) a.baton([ECH.x + s * 0.22, yI - 0.02, ECH.z], [ECH.x1 + s * 0.22, ECH.h, ECH.z1], 0.03, '#6a5240', 5);
    for (let k = 1; k < 12; k++) {
      const f = k / 12;
      a.boite(0.44, 0.04, 0.05, '#6a5240', { x: ECH.x + (ECH.x1 - ECH.x) * f, y: yI + (ECH.h - yI) * f, z: ECH.z + (ECH.z1 - ECH.z) * f });
    }
    // le plafond, qui est le plancher du grenier (des lattes de bambou, noircies par la fumée du foyer), percé de la
    // trappe ; le cadre de la trappe ; les poutres dessous (celle de la trappe, coupée)
    const lattes = (x0, x1, z0, z1) => a.piece(new THREE.BoxGeometry(x1 - x0, 0.06, z1 - z0, 1, 1, Math.max(1, Math.round((z1 - z0) / 0.31))), '#3a2c22', {
      x: (x0 + x1) / 2, y: murH - 0.03, z: (z0 + z1) / 2, teinte: (x, y, z) => (Math.floor((z + 20) / 0.31) % 2 ? '#3a2c22' : '#2e231b'),
    });
    const [qx0, qx1, qz0, qz1] = [-w2 + 0.16, w2 - 0.16, -l2 + 0.16, l2 - 0.16];
    lattes(qx0, qx1, TR.z1, qz1); lattes(qx0, qx1, qz0, TR.z0); lattes(qx0, TR.x0, TR.z0, TR.z1); lattes(TR.x1, qx1, TR.z0, TR.z1);
    for (const [x, z, l, p] of [[(TR.x0 + TR.x1) / 2, TR.z0 - 0.04, TR.x1 - TR.x0 + 0.16, 0.08], [(TR.x0 + TR.x1) / 2, TR.z1 + 0.04, TR.x1 - TR.x0 + 0.16, 0.08], [TR.x0 - 0.04, (TR.z0 + TR.z1) / 2, 0.08, TR.z1 - TR.z0], [TR.x1 + 0.04, (TR.z0 + TR.z1) / 2, 0.08, TR.z1 - TR.z0]]) {
      a.boite(l, 0.09, p, '#4a3a2c', { x, y: murH + 0.045, z });
    }
    for (let z = -l2 + 1.8; z < l2 - 0.5; z += 2.6) {
      if (z > TR.z0 - 0.15 && z < TR.z1 + 0.15) {
        a.boite(TR.x0 - qx0, 0.26, 0.24, '#2a201a', { x: (TR.x0 + qx0) / 2, y: murH - 0.2, z })
          .boite(qx1 - TR.x1, 0.26, 0.24, '#2a201a', { x: (TR.x1 + qx1) / 2, y: murH - 0.2, z });
      } else a.boite(2 * w2 - 0.32, 0.26, 0.24, '#2a201a', { y: murH - 0.2, z });
    }
    a.boite(0.26, 0.26, 2 * l2 - 0.32, '#2a201a', { x: -1.0, y: murH - 0.42 });

    // ---- le grenier (二階), sous le chaume : la charpente en « mains jointes » (gasshō), ses grandes poutres en A
    // croisées en haut ; les perches de bambou en travers, sous le chaume ; les poutres qui relient les deux pans et le
    // plancher de lattes, plus haut ; les pignons vus de dedans et leurs fenêtres de papier (le jour les traverse) ; les
    // claies des vers à soie, leurs feuilles de mûrier et leurs cocons ; le dévidoir ; les bottes de paille ; le panneau
    const xToit = (y) => w2 + 1.0 - (0.85 + 0.5 * (y - m.yE)) / SIN60; // le dessous du chaume, à la hauteur y
    for (let z = -l2 + 0.75; z < l2 - 0.4; z += 1.5) {
      for (const s of [-1, 1]) {
        const x0 = xToit(murH) - 0.22;
        a.baton([s * x0, murH - 0.04, z], [-s * 0.25, murH - 0.04 + (x0 + 0.25) * TAN60, z], 0.085, '#4a3528', 6);
      }
    }
    for (let y = murH + 0.45; y < 11.2; y += 0.72) {
      for (const s of [-1, 1]) a.baton([s * (xToit(y) - 0.08), y, -l2 + 0.12], [s * (xToit(y) - 0.08), y, l2 - 0.12], 0.045, '#8a7350', 5);
    }
    for (let z = -l2 + 0.75; z < l2 - 0.4; z += 3) a.baton([-(xToit(6.45) - 0.22), 6.45, z], [xToit(6.45) - 0.22, 6.45, z], 0.075, '#3e2f25', 6);
    for (let x = -2.6; x < 2.65; x += 0.13) a.boite(0.09, 0.03, 6.2, x % 0.26 < 0.13 ? '#3a2c22' : '#33271e', { x, y: 6.54, z: 2.25 });
    {
      const largeurA = (y) => Math.max(0, (w2 - 0.1) - (y - murH) / TAN60), yA = murH + (w2 - 0.1) * TAN60 * 0.985;
      for (const s of [-1, 1]) {
        const zf = s * (l2 - 0.03), tri = new THREE.BufferGeometry();
        tri.setAttribute('position', new THREE.Float32BufferAttribute(s > 0 ? [w2 - 0.1, murH, zf, -w2 + 0.1, murH, zf, 0, yA, zf] : [-w2 + 0.1, murH, zf, w2 - 0.1, murH, zf, 0, yA, zf], 3));
        a.piece(tri, '#4a3a2e', { nuance: 0.05, trait: false });
        for (const [y, h] of [[murH + 1.0, 1.0], [murH + 2.75, 0.85], [murH + 4.3, 0.7]]) {
          const lw = largeurA(y + h / 2 + 0.15) * 1.55;
          if (lw >= 0.6) shoji(a, lw, h, Math.max(2, Math.round(lw / 0.45)), 2, { y, z: s * (l2 - 0.05), ry: s > 0 ? PI : 0, sorte: 'lampe' });
        }
      }
    }
    // les claies des vers à soie (蚕棚) : un bâti, quatre plateaux de bambou tressé ; dessus, des feuilles de mûrier,
    // des vers et des cocons blancs
    for (const [cx, cz] of CLAIES) {
      for (const [dx, dz] of [[-0.42, -0.92], [0.42, -0.92], [-0.42, 0.92], [0.42, 0.92]]) a.boite(0.06, 1.55, 0.06, '#5a4436', { x: cx + dx, y: murH + 0.775, z: cz + dz });
      for (let k = 0; k < 4; k++) {
        const y = murH + 0.3 + k * 0.38;
        for (const dx of [-0.42, 0.42]) a.boite(0.04, 0.05, 1.9, '#5a4436', { x: cx + dx, y: y - 0.04, z: cz });
        a.boite(0.8, 0.03, 1.8, k % 2 ? '#c8b07a' : '#bea46e', { x: cx, y, z: cz });
        for (let i = 0; i < 7; i++) {
          const lx = cx + (hasard(cx + i, cz + k) - 0.5) * 0.6, lz = cz + (hasard(cz + i * 1.3, k + cx) - 0.5) * 1.5;
          a.boule(0.1, i % 2 ? '#5f9a40' : '#6aa74a', { x: lx, y: y + 0.03, z: lz, sy: 0.16, ry: i, trait: false }, 0);
        }
        for (let i = 0; i < 9; i++) {
          const ox = cx + (hasard(cx * 1.7 + i, k) - 0.5) * 0.62, oz = cz + (hasard(k * 3.1 + i, cz) - 0.5) * 1.6;
          a.boule(0.032, '#f7f3ea', { x: ox, y: y + 0.05, z: oz, sx: 0.78, sy: 0.75, sz: 1.35, ry: i * 0.7 }, 0);
        }
        for (let i = 0; i < 3; i++) {
          const ox = cx + (hasard(i, k + cz) - 0.5) * 0.5, oz = cz + (hasard(k, i + cx) - 0.5) * 1.3, d = 0.03;
          a.baton([ox - d, y + 0.05, oz - d * 0.5], [ox + d, y + 0.055, oz + d * 0.5], 0.011, '#ece5d4', 4, { trait: false });
        }
      }
    }
    // le dévidoir (座繰り) : on trempait les cocons dans l'eau chaude du pot, et le fil s'enroulait sur la roue
    {
      const [dx, dz] = DEVIDOIR;
      a.boite(0.6, 0.32, 0.42, '#5a4436', { x: dx, y: murH + 0.16, z: dz })
        .cylindre(0.15, 0.12, 0.13, 10, '#9a6a3a', { x: dx - 0.12, y: murH + 0.385, z: dz })
        .cylindre(0.13, 0.13, 0.01, 10, '#a8c4c0', { x: dx - 0.12, y: murH + 0.44, z: dz, trait: false });
      for (let i = 0; i < 4; i++) a.boule(0.03, '#f7f3ea', { x: dx - 0.12 + Math.cos(i * 1.6) * 0.06, y: murH + 0.455, z: dz + Math.sin(i * 1.6) * 0.06, sz: 1.3 }, 0);
      for (const s of [-1, 1]) a.boite(0.04, 0.5, 0.04, '#5a4436', { x: dx + 0.18, y: murH + 0.56, z: dz + s * 0.17 });
      a.cylindre(0.2, 0.2, 0.3, 6, '#c8a878', { x: dx + 0.18, y: murH + 0.8, z: dz, rx: PI / 2 })
        .cylindre(0.012, 0.012, 0.45, 5, '#5a4436', { x: dx + 0.18, y: murH + 0.8, z: dz, rx: PI / 2 })
        .baton([dx + 0.18, murH + 0.8, dz + 0.24], [dx + 0.32, murH + 0.72, dz + 0.24], 0.012, '#5a4436', 4)
        .baton([dx - 0.12, murH + 0.46, dz], [dx + 0.06, murH + 0.95, dz], 0.003, '#f7f3ea', 3, { trait: false });
    }
    // les bottes de paille de riz (藁), contre le pignon du nord ; une lampe de papier (andon) ; le panneau « 養蚕 »
    for (let k = 0; k < 9; k++) {
      const etage = k < 5 ? 0 : 1, i = etage ? k - 5 : k, x = -1.05 + i * 0.36 + etage * 0.18;
      a.cylindre(0.16, 0.16, 0.9, 8, k % 3 ? '#d6bf7c' : '#c9b06a', { x, y: murH + 0.16 + etage * 0.29, z: -l2 + 0.7, rx: PI / 2, ry: 0.04 * (i - 2) })
        .cylindre(0.165, 0.165, 0.06, 8, '#9a8448', { x, y: murH + 0.16 + etage * 0.29, z: -l2 + 0.7, rx: PI / 2, trait: false });
    }
    a.boite(0.3, 0.06, 0.3, '#3e2f25', { x: ANDON[0], y: murH + 0.03, z: ANDON[1] })
      .boite(0.26, 0.5, 0.26, P.shoji, { x: ANDON[0], y: murH + 0.33, z: ANDON[1], sorte: 'lumiere' })
      .boite(0.3, 0.04, 0.3, '#3e2f25', { x: ANDON[0], y: murH + 0.6, z: ANDON[1] });
    for (const s of [-1, 1]) a.boite(0.06, 1.1, 0.06, '#5a4436', { x: -0.55 + s * 0.38, y: murH + 0.55, z: -l2 + 1.25 });
    a.boite(0.95, 0.66, 0.05, '#5a4436', { x: -0.55, y: murH + 1.05, z: -l2 + 1.25 });
    ecrire({ x: MUSEE[1], y: MAISON.musee.y, z: MUSEE[2], ry: 0 }, { texte: '養蚕', sous: 'かいこ · KAIKO', lignes: 0, fond: '#f3ead6', encre: '#2a2018', x: -0.55, y: murH + 1.05, z: -l2 + 1.28, l: 0.86, h: 0.56 });
    // la planche du secret (à part : elle se soulève) et la fosse du salpêtre, dessous (une boîte retournée : on la voit
    // de l'intérieur) ; dedans, la terre mêlée de paille et le coffre laqué
    PLANCHE = { ...PL, y: yI, x0: px0, x1: px1, z0: pz0, z1: pz1 };
    a.boite(PL.l - 0.04, 0.7, PL.p - 0.02, '#8a6e50', { x: PL.x, y: yI - 0.08 - 0.35, z: PL.z, sx: -1, trait: false });
    a.boite(PL.l - 0.1, 0.04, PL.p - 0.08, '#c4a462', { x: PL.x, y: yI - 0.76, z: PL.z, trait: false });
    FOSSE = { x: PL.x, z: PL.z, y: yI - 0.74 };

    // ce qui arrête : les murs (la porte), le foyer, le présentoir, l'autel, l'échelle ; les sols ; pour la caméra : les
    // murs, et le plafond (dessous, elle se rapproche)
    const X = MUSEE[1], Z = MUSEE[2], Y = niveau(X, Z);
    const mur = (x0, z0, x1, z1, r = 0.28) => monde.mur(X + x0, Z + z0, X + x1, Z + z1, r);
    mur(-w2, -l2, w2, -l2); mur(-w2, l2, w2, l2); mur(-w2, -l2, -w2, l2);
    mur(w2, -l2, w2, -0.85); mur(w2, 0.85, w2, l2);
    monde.cercle(X + IR.x, Z + IR.z, 0.62);
    mur(-2.3, -l2 + 0.45, -0.1, -l2 + 0.45, 0.32);
    mur(-2.0, l2 - 0.5, -0.4, l2 - 0.5, 0.36);
    monde.cercle(X + ECH.x - 0.05, Z + ECH.z - 0.1, 0.3, Y - 1, Y + 2.6);
    monde.surface(X + xA, X + w2 - 0.16, Z - l2 + 0.16, Z + l2 - 0.16, Y + yD + 0.02, { sol: 'terre' });
    monde.surface(X - w2 + 0.16, X + xA, Z - l2 + 0.16, Z + zT, Y + yI, { sol: 'bois' });
    monde.surface(X - w2 + 0.16, X + xA, Z + zT, Z + l2 - 0.16, Y + yT, { sol: 'bois' });
    monde.surface(X + w2 - 0.2, X + w2 + 0.95, Z - 0.85, Z + 0.85, Y + yD, { sol: 'pierre' });
    const bas = Y - 1, haut = Y + murH;
    for (const [x0, x1, z0, z1] of [[-w2 - 0.1, w2 + 0.1, -l2 - 0.1, -l2 + 0.1], [-w2 - 0.1, w2 + 0.1, l2 - 0.1, l2 + 0.1], [-w2 - 0.1, -w2 + 0.1, -l2, l2], [w2 - 0.1, w2 + 0.1, -l2, -0.85], [w2 - 0.1, w2 + 0.1, 0.85, l2]]) monde.bloc(X + x0, X + x1, Z + z0, Z + z1, bas, haut);
    monde.bloc(X + w2 - 0.1, X + w2 + 0.1, Z - 0.85, Z + 0.85, Y + 2.35, haut);
    monde.toit(X - w2 - 0.2, X + w2 + 0.2, Z - l2 - 0.2, Z + l2 + 0.2, Y + murH - 0.06, Y + m.yR + 1);
    lumieres.push({ x: X + 1.5, y: Y + yI + 0.35, z: Z - 3.6, halo: 0.35, sol: Y + yI, r: 3.6 });
    // le grenier : son plancher (autour de la trappe ; un étage : ce n'est pas le sol de qui arrive de nulle part, et on
    // passe dessous), ses claies, le dévidoir, les bottes de paille, la lampe, le panneau ; pour la caméra : le dessous
    // des deux pans du toit (en marches), les pignons, un plafond (elle reste dessous)
    const YG = Y + murH;
    for (const [x0, x1, z0, z1] of [[-3.3, 3.3, TR.z1, l2 - 0.5], [-3.3, 3.3, -l2 + 0.5, TR.z0], [TR.x1, 3.3, TR.z0, TR.z1]]) {
      monde.surface(X + x0, X + x1, Z + z0, Z + z1, YG, { sol: 'bois', etage: true, passage: true });
    }
    for (const [cx, cz] of CLAIES) monde.mur(X + cx, Z + cz - 0.95, X + cx, Z + cz + 0.95, 0.52, YG - 0.3, YG + 2.2);
    monde.cercle(X + DEVIDOIR[0], Z + DEVIDOIR[1], 0.5, YG - 0.3, YG + 2.2);
    monde.cercle(X + ANDON[0], Z + ANDON[1], 0.3, YG - 0.3, YG + 2.2);
    monde.mur(X - 1.25, Z - l2 + 0.7, X + 0.6, Z - l2 + 0.7, 0.32, YG - 0.3, YG + 2.2);
    monde.mur(X - 0.95, Z - l2 + 1.25, X - 0.15, Z - l2 + 1.25, 0.15, YG - 0.3, YG + 2.2);
    monde.toit(X - 3.4, X + 3.4, Z - l2, Z + l2, YG + 2.65, YG + 3.4);
    for (const s of [-1, 1]) {
      for (const [xa, ya] of [[4.2, 0.1], [3.65, 0.95], [3.1, 1.9], [2.55, 2.9]]) {
        const [x0, x1] = s > 0 ? [xa, 6.2] : [-6.2, -xa];
        monde.bloc(X + x0, X + x1, Z - l2 - 0.3, Z + l2 + 0.3, YG + ya, Y + m.yR + 1);
      }
      const [z0, z1] = s > 0 ? [l2 - 0.15, l2 + 0.5] : [-l2 - 0.5, -l2 + 0.15];
      monde.bloc(X - w2 - 0.3, X + w2 + 0.3, Z + z0, Z + z1, YG - 0.1, Y + m.yR + 1);
    }
    lumieres.push({ x: X + ANDON[0], y: YG + 0.35, z: Z + ANDON[1], halo: 0.35, sol: YG, r: 3.6 });
    lumieres.push({ x: X + IR.x, y: Y + yI + 0.15, z: Z + IR.z, halo: 0.3, sol: Y + yI, r: 2.4, c: '#ff9a4a' });
    MAISON.musee.IR = IR;
  }

  // ---------------------------------------------------------------- Les rizières, le ruisseau
  const mares = [], eauxCalmes = [];
  {
    const a = atelier(), riz = atelier();
    RIZIERES.forEach((R, i) => {
      const [x0, x1, z0, z1] = R, f = fondRiziere(R), ye = f + 0.12, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      mares.push([cx, cz]);
      // le fond de boue ; l'eau elle-même, qui reflète le ciel, est dessinée par balade.js (eauxCalmes, 2026-10-24 :
      // avant, une boîte bleu clair et deux lignes claires le long des bords)
      a.boite(x1 - x0 - 1.0, 0.02, z1 - z0 - 1.0, P.boue, { x: cx, y: ye - 0.025, z: cz, trait: false, nuance: 0.02 });
      eauxCalmes.push([x0 + 0.5, x1 - 0.5, z0 + 0.5, z1 - 0.5, ye + 0.016]);
      // le riz : des touffes en rangs (hautes et vertes, ou toutes petites dans les rizières qu'on vient de planter)
      const jeune = RIZ_JEUNE.includes(i), h = jeune ? 0.16 : 0.62, pasX = 0.42, pasZ = 0.36;
      for (let x = x0 + 0.85; x < x1 - 0.7; x += pasX) {
        for (let z = z0 + 0.8; z < z1 - 0.7; z += pasZ) {
          const t = hasard(x * 3.1, z * 2.3);
          riz.cone(0.05 + t * 0.03, h * (0.85 + 0.3 * t), 3, t < 0.5 ? P.riz : P.rizClair, { x: x + (t - 0.5) * 0.1, y: f + h * 0.48, z: z + (hasard(z, x) - 0.5) * 0.1, ry: t * 6, trait: false, sorte: 'riz', nuance: 0.08 });
        }
      }
    });
    poser(a.fin(0, peinture), 0, 0, { y: 0, ombre: false });
    poser(riz.fin(0, peinture), 0, 0, { y: 0, ombre: false });
  }
  // le ruisseau : son lit entre deux murets de pierres (une seule forme le long de sa courbe), l'eau qui coule (balade.js :
  // lieu.courants), des cailloux au fond ; le pont de planches du chemin principal, posé sur les murets ; à l'est, la
  // cascade qui tombe dans la gorge
  const courants = [];
  // (le pont : là où le chemin principal croise le ruisseau ; le pont va le long de z, comme le chemin à cet endroit)
  const PONT = (() => {
    let best = null;
    for (const q of RU.pts) { const d = surLaLigne(CHEMIN, q.x, q.z).d; if (!best || d < best.d) best = { d, q }; }
    const hautMax = Math.max(...RU.pts.filter((q) => Math.abs(q.s - best.q.s) < 1.8).map((q) => q.haut));
    return { x: best.q.x, z: best.q.z, y: hautMax };
  })();
  {
    const a = atelier(), P0 = RU.pts, N = P0.length;
    // les murets : de chaque côté, la face du lit, le dessus, la face qui descend dans le sol, et leurs deux bouts
    for (const sg of [-1, 1]) {
      const tri = [];
      const pt = (q, d, y) => [q.x - q.tz * d * sg, y, q.z + q.tx * d * sg];
      const quad = (A, B, C, D) => (sg > 0 ? tri.push(...A, ...C, ...B, ...A, ...D, ...C) : tri.push(...A, ...B, ...C, ...A, ...C, ...D));
      for (let i = 0; i < N - 1; i++) {
        const q = P0[i], u = P0[i + 1];
        quad(pt(q, 0.62, q.w - 0.4), pt(u, 0.62, u.w - 0.4), pt(u, 0.62, u.haut), pt(q, 0.62, q.haut));
        quad(pt(q, 0.62, q.haut), pt(u, 0.62, u.haut), pt(u, 0.98, u.haut), pt(q, 0.98, q.haut));
        quad(pt(q, 0.98, q.haut), pt(u, 0.98, u.haut), pt(u, 0.98, u.berge - 0.35), pt(q, 0.98, q.berge - 0.35));
      }
      for (const q of [P0[0], P0[N - 1]]) {
        const A = pt(q, 0.62, q.w - 0.4), B = pt(q, 0.62, q.haut), C = pt(q, 0.98, q.haut), D = pt(q, 0.98, q.berge - 0.35);
        tri.push(...A, ...B, ...C, ...A, ...C, ...D, ...A, ...C, ...B, ...A, ...D, ...C);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(tri, 3));
      a.piece(g, P.pierre, { teinte: pierres });
    }
    // dans la forêt, là où il dévale : des rochers moussus sur ses bords, et quelques-uns dans le courant
    for (let i = 2; i < N - 2; i += 3) {
      const q = P0[i];
      if (q.pente < 0.1) continue;
      for (const sg of [-1, 1]) {
        const t = hasard(q.x * 3.1 + sg, q.z * 1.7), d = 1.0 + t * 0.35, rr = 0.22 + t * 0.26;
        a.rocher(q.x - q.tz * d * sg, q.berge - 0.04, q.z + q.tx * d * sg, rr, t > 0.55 ? '#6f7a5a' : '#6f6a60');
      }
      if (hasard(q.z, q.x) > 0.7) a.rocher(q.x, q.w - 0.05, q.z, 0.16, '#6f6a60');
    }
    // des cailloux au fond, sous l'eau (on les voit à travers)
    for (let i = 3; i < N - 3; i += 5) {
      const q = P0[i], t = hasard(q.x * 1.7, q.z * 2.3), off = (t - 0.5) * 0.8;
      a.rocher(q.x - q.tz * off, q.w - 0.12, q.z + q.tx * off, 0.06 + t * 0.06, t > 0.5 ? '#8a8478' : '#6f6a60', { trait: false });
    }
    // (on ne marche pas dans le ruisseau, sauf sur le pont)
    for (let i = 0; i < N - 1; i += 2) {
      const q = P0[i], u = P0[Math.min(N - 1, i + 2)];
      // (près du pont, le mur s'arrête assez loin : ses bouts sont des demi-cercles de 1 m, ils débordaient sur le tablier)
      if (Math.min(Math.abs(q.x - PONT.x), Math.abs(u.x - PONT.x)) > 1.9 || Math.abs((q.z + u.z) / 2 - PONT.z) > 2.5) monde.mur(q.x, q.z, u.x, u.z, 1.0);
    }
    // le pont : deux poutres de rondins posées sur les murets, le tablier de planches en travers, deux bordures, une
    // petite rambarde de bambou de chaque côté ; une pierre plate à chaque bout, pour monter
    {
      const { x: bx, z: bz, y: yh } = PONT, yT = yh + 0.2;
      for (const sg of [-1, 1]) a.cylindre(0.08, 0.08, 3.3, 8, '#6a5240', { x: bx + sg * 0.62, y: yh + 0.08, z: bz, rx: PI / 2 });
      for (let k = 0; k < 9; k++) a.boite(1.9, 0.07, 0.33, k % 2 ? P.bois : P.bois2, { x: bx, y: yT - 0.035, z: bz - 1.44 + k * 0.36 });
      for (const sg of [-1, 1]) {
        a.cylindre(0.055, 0.055, 3.2, 6, '#5a4436', { x: bx + sg * 0.9, y: yT + 0.05, z: bz, rx: PI / 2 });
        for (const dz of [-1.5, 0, 1.5]) a.boite(0.08, 0.6, 0.08, '#5a4436', { x: bx + sg * 0.93, y: yT + 0.3, z: bz + dz });
        a.cylindre(0.03, 0.03, 3.1, 6, '#b8a070', { x: bx + sg * 0.93, y: yT + 0.58, z: bz, rx: PI / 2 });
        a.rocher(bx, terrain(bx, bz + sg * 1.95) + 0.03, bz + sg * 1.95, 0.42, P.pierre, { sy: 0.3, sx: 1.6 });
      }
      monde.surface(bx - 0.88, bx + 0.88, bz - 1.62, bz + 1.62, yT, { sol: 'bois' });
      for (const sg of [-1, 1]) monde.mur(bx + sg * 0.95, bz - 1.6, bx + sg * 0.95, bz + 1.6, 0.12);
      monde.cercle(bx - 1.3, bz, 0.3); monde.cercle(bx + 1.3, bz, 0.3);
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
    // l'eau : un ruban le long du lit, entre les murets (son uv : les mètres depuis la source, d'une rive à l'autre)
    {
      const pos = [], uv = [], ec = [], idx = [];
      P0.forEach((q, i) => {
        for (const t of [0, 1]) {
          const o = (t - 0.5) * 1.24;
          pos.push(q.x - q.tz * o, q.w, q.z + q.tx * o);
          uv.push(q.s, t);
          ec.push(q.ecume);
        }
        if (i) { const a0 = (i - 1) * 2; idx.push(a0, a0 + 1, a0 + 2, a0 + 1, a0 + 3, a0 + 2); }
      });
      // la cascade : au bout du lit, l'eau dévale la berge jusqu'à la rivière, toute blanche
      const fin = P0[N - 1];
      let s0 = fin.s, prec = [fin.x, fin.z], k0 = pos.length / 3;
      for (let k = 1; k <= 40; k++) {
        const x = fin.x + k * 0.5, z = fin.z - k * 0.012, y = Math.max(RIVIERE_Y + 0.05, terrain(x, z) + 0.06);
        s0 += Math.hypot(x - prec[0], z - prec[1]);
        prec = [x, z];
        const l = 0.62 * (1 - 0.35 * k / 40);
        pos.push(x, y, z - l, x, y, z + l);
        uv.push(s0, 0, s0, 1);
        ec.push(0.85, 0.85);
        const a0 = k === 1 ? (N - 1) * 2 : k0 + (k - 2) * 2, b0 = k0 + (k - 1) * 2;
        idx.push(a0, a0 + 1, b0, a0 + 1, b0 + 1, b0);
        if (y <= RIVIERE_Y + 0.06) break;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setAttribute('ecume', new THREE.Float32BufferAttribute(ec, 1));
      g.setIndex(idx);
      courants.push(g);
    }
  }

  // ---------------------------------------------------------------- Le sanctuaire (地主神社)
  // l'esplanade taillée au pied de la montagne, son mur de pierres et l'escalier ; le torii de bois gris (sa corde sacrée
  // et ses papiers) en bas, les lanternes, l'allée de dalles ; le sanctuaire (haiden) au toit de tuiles, sa cloche et sa
  // corde, la boîte des offrandes, les deux chiens gardiens (komainu) ; les grandes lanternes de la fête ; les cèdres
  const SA = SANCTUAIRE, [xS, zS] = SA.sanctuaire, yS = Y_ESPLANADE;
  {
    const a = atelier();
    const [mx0, mx1, mz] = SA.marches;
    // le mur de pierres (devant l'esplanade, à l'est), coupé par l'escalier
    const yBas = niveau(SA.x1 + 1, -27);
    for (const [z0, z1] of [[SA.z0, mz - 1.4], [mz + 1.4, SA.z1]]) {
      a.piece(new THREE.BoxGeometry(0.9, yS - yBas + 1.2, z1 - z0, 1, 4, Math.round((z1 - z0) / 0.5)), P.pierre, { x: SA.x1 + 0.2, y: (yS + yBas - 1.2) / 2, z: (z0 + z1) / 2, teinte: pierres });
    }
    // l'escalier : cinq marches de pierre pleines, entre deux murets
    const nM = 5, hM = (yS - yBas) / nM;
    for (let k = 0; k < nM; k++) {
      const x = mx1 - (k + 0.5) * ((mx1 - mx0) / nM), y = yBas + (k + 1) * hM;
      a.boite((mx1 - mx0) / nM + 0.02, y - yBas + 0.6, 2.6 + (k % 2) * 0.02, P.pierreFonce, { x, y: (y + yBas - 0.6) / 2, z: mz });
    }
    for (const s of [-1, 1]) a.baton([mx0 - 0.4, yS + 0.22, mz + s * 1.45], [mx1 + 0.5, yBas + 0.22, mz + s * 1.45], 0.17, P.pierre, 6);
    monde.rampe(mx0, mx1, mz - 1.3, mz + 1.3, 'x', yS, yBas, { sol: 'pierre' });
    monde.surface(SA.x0, SA.x1, SA.z0, SA.z1, yS, { sol: 'terre' });
    monde.mur(SA.x1 + 0.2, SA.z0, SA.x1 + 0.2, mz - 1.75, 0.45); monde.mur(SA.x1 + 0.2, mz + 1.75, SA.x1 + 0.2, SA.z1, 0.45);
    // l'allée de dalles, du torii à l'escalier, et sur l'esplanade jusqu'au sanctuaire
    for (let x = SA.torii[0] - 0.4; x > mx1 + 0.2; x -= 0.95) a.boite(0.85, 0.08, 1.5 + hasard(x, 3) * 0.2, P.pierre, { x, y: niveau(x, mz) + 0.02, z: mz + (hasard(x, 7) - 0.5) * 0.1, ry: (hasard(x, 5) - 0.5) * 0.08 });
    for (let x = mx0 - 0.5; x > xS + 2.6; x -= 0.95) a.boite(0.85, 0.08, 1.5, P.pierre, { x, y: yS + 0.02, z: mz, ry: (hasard(x, 5) - 0.5) * 0.08 });
    // le torii : deux piliers de bois gris, le linteau du haut (kasagi) un peu courbé, celui du milieu (nuki), la corde
    const [xT, zT] = SA.torii, yTo = niveau(xT, zT), BG = '#8a8478', H = 4.2;
    for (const s of [-1, 1]) a.cylindre(0.17, 0.2, H, 12, BG, { x: xT, y: yTo + H / 2 - 0.1, z: zT + s * 1.75 }).cylindre(0.26, 0.26, 0.25, 12, '#5a5650', { x: xT, y: yTo + 0.12, z: zT + s * 1.75 });
    a.piece(new THREE.BoxGeometry(0.42, 0.32, 5.4, 1, 1, 8), BG, { x: xT, y: yTo + H + 0.1, z: zT, deformer: (x, y, z) => [x, y + 0.012 * z * z, z] })
      .boite(0.28, 0.24, 4.4, BG, { x: xT, y: yTo + H - 0.75, z: zT })
      .boite(0.2, 0.75, 0.2, BG, { x: xT, y: yTo + H - 0.28, z: zT })
      .shimenawa([[xT, yTo + H - 1.2, zT - 1.6], [xT, yTo + H - 1.55, zT], [xT, yTo + H - 1.2, zT + 1.6]], 0.075, [[xT, yTo + H - 1.6, zT - 0.7], [xT, yTo + H - 1.6, zT + 0.7]]);
    for (const s of [-1, 1]) monde.cercle(xT, zT + s * 1.75, 0.32);
    // les lanternes de pierre, de part et d'autre de l'allée (en bas) et devant le sanctuaire
    for (const s of [-1, 1]) {
      lanterne(a, xT - 4, zT + s * 2.2);
      monde.cercle(xT - 4, zT + s * 2.2, 0.4);
      lanterne(a, xS + 4.2, zS + s * 2.4, yS);
      monde.cercle(xS + 4.2, zS + s * 2.4, 0.4);
    }
    // le sanctuaire : un socle de pierre, la salle de bois sur pilotis, la galerie, le toit de tuiles recourbé
    const HL = 4.6, HP = 4.0;
    a.boite(HL + 0.6, 0.5, HP + 0.6, P.pierreFonce, { x: xS, y: yS + 0.25, z: zS })
      .boite(HL, 2.4, HP, '#7a5a40', { x: xS, y: yS + 0.5 + 1.2, z: zS });
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) a.boite(0.22, 2.5, 0.22, '#4a3626', { x: xS + dx * HL / 2, y: yS + 0.5 + 1.25, z: zS + dz * HP / 2 });
    a.boite(0.6, 0.08, HP + 0.4, P.bois, { x: xS + HL / 2 + 0.3, y: yS + 0.95, z: zS })
      .toitJapon(HL + 1.8, HP + 1.6, 1.5, 0.35, { x: xS, y: yS + 2.9, z: zS, releve: 0.3, rangs: 18 })
      .boite(0.3, 0.25, 1.4, P.or, { x: xS, y: yS + 4.45, z: zS });
    // la façade (à l'est) : les portes à claire-voie, la cloche (suzu) et sa corde rouge et blanche, la boîte des offrandes
    shoji(a, 2.4, 1.6, 6, 4, { x: xS + HL / 2 + 0.03, y: yS + 1.75, z: zS, ry: PI / 2 });
    a.ovale(0.17, P.or, { x: xS + HL / 2 + 0.75, y: yS + 2.6, z: zS }, 10)
      .tube([[xS + HL / 2 + 0.75, yS + 2.45, zS], [xS + HL / 2 + 0.8, yS + 1.6, zS + 0.03], [xS + HL / 2 + 0.78, yS + 1.0, zS]], 0.045, '#d8302c', { teinte: (x, y) => (Math.floor(y * 9) % 2 ? '#d8302c' : '#f4efe2'), pas: 16 })
      .boite(0.7, 0.55, 1.2, '#5a4030', { x: xS + HL / 2 + 1.45, y: yS + 0.28, z: zS })
      .boite(0.72, 0.04, 1.22, '#3e2f25', { x: xS + HL / 2 + 1.45, y: yS + 0.57, z: zS, trait: false });
    ecrire({ x: xS, y: yS, z: zS, ry: 0 }, { texte: '奉納', fond: '#5a4030', encre: '#f2e6c8', x: HL / 2 + 1.81, y: 0.3, z: 0, ry: PI / 2, l: 0.6, h: 0.3 });
    // la corde sacrée au-dessus de l'entrée
    a.shimenawa([[xS + HL / 2 + 0.3, yS + 2.75, zS - 1.6], [xS + HL / 2 + 0.38, yS + 2.5, zS], [xS + HL / 2 + 0.3, yS + 2.75, zS + 1.6]], 0.08, [[xS + HL / 2 + 0.35, yS + 2.38, zS - 0.8], [xS + HL / 2 + 0.38, yS + 2.32, zS + 0.8]]);
    a.boite(0.06, 0.36, 1.2, '#2a2018', { x: xS + HL / 2 + 0.04, y: yS + 2.72, z: zS });
    ecrire({ x: xS, y: yS, z: zS, ry: 0 }, { texte: '地主神社', fond: '#2a2018', encre: '#e8c66a', x: HL / 2 + 0.075, y: 2.72, z: 0, ry: PI / 2, l: 1.1, h: 0.32 });
    // les chiens gardiens (komainu), assis sur leurs socles, de part et d'autre de l'allée
    for (const s of [-1, 1]) {
      const kx = xS + 6, kz = zS + s * 1.9, y0 = yS + 0.8, PI2 = '#b8b0a0';
      a.boite(0.8, 0.8, 0.8, P.pierreFonce, { x: kx, y: yS + 0.4, z: kz })
        .boite(0.9, 0.08, 0.9, P.pierre, { x: kx, y: y0 + 0.02, z: kz })
        // le corps assis (penché vers l'avant, vers l'allée : +x), le poitrail, les pattes de devant
        .ovale(0.24, PI2, { x: kx - 0.05, y: y0 + 0.36, z: kz, sx: 1.15, sy: 1.35, sz: 0.85, rz: 0.25 }, 10)
        .baton([kx + 0.13, y0 + 0.4, kz - 0.1], [kx + 0.17, y0 + 0.04, kz - 0.1], 0.06, PI2, 6)
        .baton([kx + 0.13, y0 + 0.4, kz + 0.1], [kx + 0.17, y0 + 0.04, kz + 0.1], 0.06, PI2, 6)
        .ovale(0.12, PI2, { x: kx - 0.2, y: y0 + 0.1, z: kz, sx: 1.6, sy: 0.6 }, 8)
        // la tête : la grosse tête ronde, le museau carré, les yeux ronds, la crinière en boucles ; la queue en flamme
        .ovale(0.2, P.pierre, { x: kx + 0.1, y: y0 + 0.82, z: kz, sx: 1.05 }, 10)
        .boite(0.16, 0.13, 0.22, P.pierre, { x: kx + 0.27, y: y0 + 0.76, z: kz })
        .boite(0.02, s > 0 ? 0.05 : 0.012, 0.16, '#5a5650', { x: kx + 0.355, y: y0 + 0.72, z: kz, trait: false });
      for (const dz of [-0.08, 0.08]) a.boule(0.035, P.pierreFonce, { x: kx + 0.27, y: y0 + 0.9, z: kz + dz }, 0);
      for (let k = 0; k < 9; k++) {
        const t = (k / 8) * PI - PI / 2;
        a.boule(0.07, P.pierreFonce, { x: kx + 0.0, y: y0 + 0.8 + Math.sin(t) * 0.17, z: kz + Math.cos(t) * 0.2 }, 0);
      }
      a.cone(0.09, 0.32, 6, PI2, { x: kx - 0.33, y: y0 + 0.4, z: kz, rz: 0.5 });
      monde.cercle(kx, kz, 0.55);
    }
    // la fête : deux grands mâts de bannières (nobori) et une grande lanterne peinte (comme dans la vidéo)
    for (const s of [-1, 1]) {
      const bx = xS + 7.5, bz = zS + s * 3.6;
      a.cylindre(0.06, 0.07, 6.2, 6, '#c9b48a', { x: bx, y: yS + 3.1, z: bz })
        .boite(0.02, 3.6, 0.85, s > 0 ? '#f4efe2' : '#d8302c', { x: bx, y: yS + 3.9, z: bz + s * 0.45 })
        .boite(0.02, 3.6, 0.04, '#2a2018', { x: bx, y: yS + 3.9, z: bz + s * 0.03, trait: false });
      monde.cercle(bx, bz, 0.25);
    }
    // (la grande lanterne de fête : bleue, rouge et jaune, sous un petit toit, sur un poteau)
    const lx = xS + 6.6, lz = zS + 6.2;
    a.cylindre(0.08, 0.1, 3.6, 6, '#4a3626', { x: lx, y: yS + 1.8, z: lz })
      .baton([lx, yS + 3.3, lz], [lx + 0.9, yS + 3.3, lz], 0.05, '#4a3626', 5)
      .piece(new THREE.SphereGeometry(0.42, 16, 10), '#3a5ab0', { x: lx + 0.85, y: yS + 2.55, z: lz, sy: 1.5, sorte: 'lumiere', teinte: (x, y) => { const v = (y - yS - 2.55) / 0.63; return v > 0.45 ? '#3a5ab0' : v > 0.0 ? '#f2e6c8' : v > -0.45 ? '#d8302c' : '#f2c443'; } })
      .cylindre(0.2, 0.2, 0.08, 10, '#2a2420', { x: lx + 0.85, y: yS + 3.2, z: lz })
      .cylindre(0.22, 0.22, 0.06, 10, '#2a2420', { x: lx + 0.85, y: yS + 1.9, z: lz });
    lumieres.push({ x: lx + 0.85, y: yS + 2.55, z: lz, halo: 0.75, sol: yS, r: 4.2 });
    monde.cercle(lx, lz, 0.25);
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
    monde.surface(xS - HL / 2 - 0.3, xS + HL / 2 + 0.3, zS - HP / 2 - 0.3, zS + HP / 2 + 0.3, yS + 0.5, { plein: true });
    monde.bloc(xS - HL / 2 - 0.3, xS + HL / 2 + 0.3, zS - HP / 2 - 0.3, zS + HP / 2 + 0.3, yS - 1, yS + 4.5);
    monde.mur(xS + HL / 2 + 1.45, zS - 0.62, xS + HL / 2 + 1.45, zS + 0.62, 0.4);
  }
  // les grands cèdres du sanctuaire (et ceux du pied de la montagne, tout autour de l'esplanade)
  {
    const a = atelier();
    // (ceux du sud, écartés de la vue du belvédère : ils cachaient la moitié du village)
    for (const [x, z, h] of [[-60, -38, 26], [-59, -20, 24], [-53, -43.5, 22], [-61, -30, 28], [-60.5, -45.5, 23], [-48, -18.5, 20], [-63, -24, 25], [-42, -17, 18]]) {
      const y = terrain(x, z);
      a.cylindre(0.38, 0.55, h * 0.45, 8, '#6a4a32', { x, y: y + h * 0.2, z });
      for (const [r, hh, k] of [[0.26, 0.4, 0.4], [0.21, 0.34, 0.6], [0.14, 0.3, 0.8]]) a.cone(h * r, h * hh, 9, k > 0.5 ? P.cedre : P.cedreFonce, { x, y: y + h * k, z, ry: hasard(x, z) * 3, sorte: 'conifere' });
      monde.cercle(x, z, 0.6);
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- Le belvédère (展望台), sur le flanc de la montagne
  // le sentier de terre et ses marches de rondins, la plate-forme de planches et sa barrière, le banc, le panneau
  {
    const a = atelier(), B = BELVEDERE, yB = Y_BELVEDERE;
    // l'escalier : chaque marche un bloc de pierre plein (jusque sous le sol), deux murets en gradins, une main courante
    // de bois de chaque côté (des poteaux tous les 2,4 m, une barre) ; deux lanternes au pied
    {
      const { ux, uz, ry, marches } = ESC, cx = Math.cos(ry), sx = -Math.sin(ry);
      const ici = (t, dec) => [ESC.A[0] + ux * t + cx * dec, ESC.A[1] + uz * t + sx * dec];
      marches.forEach((m, k) => {
        // (les marches et les murets voisins se chevauchent de 4 cm : une largeur sur deux, 1 cm de moins, sinon leurs
        // côtés y sont dans le même plan et scintillent ; la dernière marche, 1,2 cm sous la plate-forme qu'elle touche)
        const l = m.s1 - m.s0 + 0.04, [mx, mz] = ici((m.s0 + m.s1) / 2, 0), bas = Math.min(m.h - 0.7, ESC.sol(m.s0) - 0.25);
        const hm = k === marches.length - 1 ? m.h - 0.012 : m.h, e = k % 2 ? 0.01 : 0;
        a.boite(1.8 - e, hm - bas, l, k % 2 ? P.pierre : '#a9a59c', { x: mx, y: (hm + bas) / 2, z: mz, ry, nuance: 0.04 });
        for (const sg of [-1, 1]) {
          const [wx, wz] = ici((m.s0 + m.s1) / 2, sg * 1.05), basM = Math.min(m.h - 0.9, ESC.sol(m.s0) - 0.3);
          a.boite(0.3 - e, m.h + 0.35 - basM, l, P.pierreFonce, { x: wx, y: (m.h + 0.35 + basM) / 2, z: wz, ry, teinte: pierres });
        }
      });
      const haut = (t) => { const e = marches.find((m) => t >= m.s0 && t <= m.s1); return e ? e.h : t < marches[0].s0 ? ESC.h0 : ESC.hE; };
      for (const sg of [-1, 1]) {
        let prec = null;
        for (let t = 0.4; t <= ESC.L - 0.3; t += 2.4) {
          const [px, pz] = ici(t, sg * 1.05), y0 = haut(t) + 0.35;
          a.boite(0.09, 0.78, 0.09, '#5a4436', { x: px, y: y0 + 0.39, z: pz });
          if (prec) a.baton(prec, [px, y0 + 0.76, pz], 0.035, P.bois, 6);
          prec = [px, y0 + 0.76, pz];
        }
      }
      for (const sg of [-1, 1]) { const [lx, lz] = ici(-0.9, sg * 1.7); lanterne(a, lx, lz); monde.cercle(lx, lz, 0.38); }
      monde.chemin(ESC.chemin, 0.85, { sol: 'pierre' });
      for (const sg of [-1, 1]) { const [x0, z0] = ici(0.2, sg * 1.05), [x1, z1] = ici(ESC.L - 0.2, sg * 1.05); monde.mur(x0, z0, x1, z1, 0.2); }
    }
    // la plate-forme, ses poteaux qui descendent dans la pente, la barrière (côté vallée), le banc
    a.cylindre(B.r, B.r, 0.14, 18, P.bois2, { x: B.x, y: yB + 0.07, z: B.z });
    for (let k = 0; k < 8; k++) {
      const t = (k / 8) * 2 * PI, x = B.x + Math.sin(t) * (B.r - 0.15), z = B.z + Math.cos(t) * (B.r - 0.15);
      a.boite(0.14, 3.2, 0.14, '#5a4436', { x, y: yB - 1.5, z });
    }
    const vT = vers(B.x, B.z, 0, 0), aE = Math.atan2(ESC.E[0] - B.x, ESC.E[1] - B.z);
    // la barrière, côté vallée et côté de l'escalier, ouverte là où il arrive
    for (const [t0, t1] of [[vT - 1.9, aE - 0.34], [aE + 0.34, vT + 2.3]]) {
      const nb = Math.max(1, Math.round((t1 - t0) / 0.27));
      for (let k = 0; k <= nb; k++) {
        const t = t0 + ((t1 - t0) * k) / nb, x = B.x + Math.sin(t) * (B.r - 0.1), z = B.z + Math.cos(t) * (B.r - 0.1);
        a.boite(0.08, 1.0, 0.08, '#5a4436', { x, y: yB + 0.5, z });
        if (k < nb) {
          const t2 = t0 + ((t1 - t0) * (k + 1)) / nb, x2 = B.x + Math.sin(t2) * (B.r - 0.1), z2 = B.z + Math.cos(t2) * (B.r - 0.1);
          a.baton([x, yB + 1.0, z], [x2, yB + 1.0, z2], 0.04, P.bois, 5).baton([x, yB + 0.55, z], [x2, yB + 0.55, z2], 0.03, P.bois, 5);
          monde.mur(x, z, x2, z2, 0.25);
        }
      }
    }
    monde.anneau(B.x, B.z, 0, B.r, yB + 0.14, { sol: 'bois' });
    // le banc, contre le côté montagne, face à la vallée
    const bx = B.x - Math.sin(vT) * 2.2, bz = B.z - Math.cos(vT) * 2.2, cB = Math.cos(vT), sB = -Math.sin(vT);
    a.boite(2.2, 0.08, 0.45, P.bois, { x: bx, y: yB + 0.6, z: bz, ry: vT });
    for (const s of [-1, 1]) a.boite(0.1, 0.46, 0.4, '#5a4436', { x: bx + s * cB * 0.9, y: yB + 0.37, z: bz + s * sB * 0.9, ry: vT });
    bancs.push({ de: [bx - cB * 0.85, bz - sB * 0.85], a: [bx + cB * 0.85, bz + sB * 0.85], y: yB + 0.64, cap: vT, vue: 0.25 });
    monde.mur(bx - cB * 1.1, bz - sB * 1.1, bx + cB * 1.1, bz + sB * 1.1, 0.3);
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- L'atelier de papier (五箇山和紙)
  // un abri ouvert (des poteaux, un toit de planches), la longue cuve de l'eau laiteuse (les fibres de mûrier), le cadre
  // posé dessus, la pile de feuilles mouillées ; dehors, les planches où les feuilles sèchent au soleil ; les écorces
  // de mûrier (kōzo) qui sèchent, pendues
  const yW = niveau(WASHI.x, WASHI.z);
  {
    const a = atelier(), Wl = 5.2, Wp = 3.4;
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) a.boite(0.16, 2.6, 0.16, '#5a4436', { x: dx * Wl / 2, y: 1.3, z: dz * Wp / 2 });
    a.pignon(Wl + 0.8, 0.9, Wp + 0.9, P.boisGris, { y: 2.6 })
      .boite(Wl + 0.2, 0.12, 0.16, '#5a4436', { y: 2.55, z: -Wp / 2 }).boite(Wl + 0.2, 0.12, 0.16, '#5a4436', { y: 2.55, z: Wp / 2 });
    // le plancher de planches sous l'abri
    a.boite(Wl, 0.08, Wp, P.bois2, { y: 0.04 });
    // la cuve (sukibune), l'eau laiteuse, le cadre (sukigeta) posé en travers
    for (const sg of [-1, 1]) {
      a.boite(2.4, 0.56, 0.07, '#7a5a3a', { x: -0.4, y: 0.36, z: -0.6 + sg * 0.465 })
        .boite(0.07, 0.56, 0.86, '#7a5a3a', { x: -0.4 + sg * 1.165, y: 0.36, z: -0.6 });
    }
    a.boite(2.26, 0.03, 0.86, '#e8e6dc', { x: -0.4, y: 0.57, z: -0.6, trait: false })
      .boite(0.62, 0.04, 1.06, '#9a7a52', { x: -1.25, y: 0.66, z: -0.6 });
    // la pile de feuilles mouillées et la presse
    a.boite(0.7, 0.4, 0.55, '#6a4a32', { x: 1.6, y: 0.24, z: -0.8 }).boite(0.62, 0.12, 0.48, '#f2efe4', { x: 1.6, y: 0.5, z: -0.8, trait: false })
      .boite(0.72, 0.06, 0.56, '#6a4a32', { x: 1.6, y: 0.6, z: -0.8 });
    // les écorces de kōzo qui sèchent sur une perche
    a.baton([-2.4, 2.1, 1.3], [2.4, 2.1, 1.3], 0.03, '#6a5240', 5);
    for (let k = 0; k < 9; k++) a.boite(0.08, 0.9, 0.012, k % 2 ? '#d9c8a2' : '#c9b48a', { x: -2.0 + k * 0.5, y: 1.62, z: 1.3, trait: false });
    // dehors, au sud (vers le chemin) : les planches de séchage, inclinées au soleil, chacune sa feuille de papier blanc
    for (let k = 0; k < 4; k++) {
      const x = -2.4 + k * 1.6, z = 2.9;
      a.boite(1.1, 1.9, 0.06, '#b8935e', { x, y: 0.95, z, rx: -0.3 })
        .boite(0.85, 1.4, 0.012, '#f6f1e2', { x, y: 1.0 + 0.013, z: z + 0.043, rx: -0.3, trait: false })
        .boite(0.06, 1.0, 0.06, '#7a5a3a', { x, y: 0.5, z: z - 0.42, rx: 0.5 });
    }
    poser(a.fin(0, peinture), WASHI.x, WASHI.z, { y: yW });
    monde.mur(WASHI.x - 1.6, WASHI.z - 0.6, WASHI.x + 0.8, WASHI.z - 0.6, 0.8);
    monde.cercle(WASHI.x + 1.6, WASHI.z - 0.8, 0.45);
    monde.mur(WASHI.x - 2.9, WASHI.z + 2.9, WASHI.x + 2.4, WASHI.z + 2.9, 0.45);
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) monde.cercle(WASHI.x + dx * 2.6, WASHI.z + dz * 1.7, 0.2);
    monde.surface(WASHI.x - 2.6, WASHI.x + 2.6, WASHI.z - 1.7, WASHI.z + 1.7, yW + 0.08, { sol: 'bois' });
    monde.toit(WASHI.x - 3, WASHI.x + 3, WASHI.z - 2.2, WASHI.z + 2.2, yW + 2.5, yW + 3.6);
  }

  // ---------------------------------------------------------------- La scène de la kokiriko
  // une petite estrade de bois, deux lanternes de papier sur des perches, le panneau « こきりこ節 »
  const K = KOKIRIKO, yK = niveau(K.x, K.z) + K.h;
  {
    const a = atelier();
    a.boite(K.l, K.h + 0.3, K.p, P.bois2, { x: K.x, y: yK - (K.h + 0.3) / 2, z: K.z })
      .boite(K.l + 0.06, 0.06, 0.06, '#3e2f25', { x: K.x, y: yK - 0.045, z: K.z + K.p / 2 });
    for (let k = 1; k < 3; k++) a.boite(1.0, 0.1, 0.35, P.bois, { x: K.x, y: yK - K.h + (k * K.h) / 3 - 0.05, z: K.z - K.p / 2 - 0.2 * (3 - k) });
    for (const s of [-1, 1]) {
      const x = K.x + s * (K.l / 2 + 0.3), z = K.z + K.p / 2 - 0.2;
      a.cylindre(0.05, 0.05, 2.8, 6, '#5a4436', { x, y: yK - K.h + 1.4, z })
        .chochin(x, yK - K.h + 2.35, z + 0.15, 9, '#f2e6c8');
      lumieres.push({ x, y: yK - K.h + 2.35, z: z + 0.15, halo: 0.55, sol: yK - K.h, r: 3.2 });
      monde.cercle(x, z, 0.2);
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
    monde.surface(K.x - K.l / 2, K.x + K.l / 2, K.z - K.p / 2, K.z + K.p / 2, yK, { sol: 'bois' });
    // (on monte sur l'estrade par ses marches, au nord ; sinon, on s'y cogne)
    monde.mur(K.x - K.l / 2, K.z + K.p / 2, K.x + K.l / 2, K.z + K.p / 2, 0.15, -10, yK - 0.4);
    monde.mur(K.x - K.l / 2, K.z - K.p / 2, K.x - K.l / 2, K.z + K.p / 2, 0.15, -10, yK - 0.4);
    monde.mur(K.x + K.l / 2, K.z - K.p / 2, K.x + K.l / 2, K.z + K.p / 2, 0.15, -10, yK - 0.4);
    monde.rampe(K.x - 0.5, K.x + 0.5, K.z - K.p / 2 - 0.7, K.z - K.p / 2, 'z', yK - K.h, yK, { sol: 'bois' });
  }

  // ---------------------------------------------------------------- Les canons à eau (放水銃) et le local des pompiers
  // chaque canon dans sa cabane au petit toit de chaume (ses portes s'ouvrent pour l'essai) ; le local des pompiers :
  // une remise au toit de tôle, sa lampe rouge, la plaque « 消防 », les seaux rouges empilés
  const cabanes = POMPES.map(([x, z]) => { monde.cercle(x, z, 0.85); return { x, z, y: niveau(x, z), ry: vers(x, z, 0, 0) }; });
  // (les cabanes : une forme chacune, pour leurs portes et leur canon qui sort)
  const essai = creerEssai();
  animes.push(essai.anime);
  {
    // (le dépôt : ses planches de bois sombre, un socle de béton, la façade et son rideau métallique en lames, la
    // plaque « 消防団 », le gyrophare rouge ; le toit de tôle ; dans son repère, la façade vers +z, le village)
    const a = atelier(), y = niveau(CASERNE.x, CASERNE.z), ry = vers(CASERNE.x, CASERNE.z, 0, 0), W = 3.6, D = 3.0, H = 2.7;
    const pose = { x: CASERNE.x, y, z: CASERNE.z, ry };
    const bois = (x, yy) => (Math.floor(yy / 0.22 + 100) % 2 ? '#4a3a30' : '#5a463a');
    a.boite(W + 0.3, 0.3, D + 0.3, '#a8a49a', { y: 0 });
    for (const sg of [-1, 1]) a.piece(new THREE.BoxGeometry(0.14, H, D, 1, 12, 1), '#4a3a30', { x: sg * (W / 2 - 0.07), y: 0.15 + H / 2, teinte: bois });
    a.piece(new THREE.BoxGeometry(W - 0.28, H, 0.14, 1, 12, 1), '#4a3a30', { y: 0.15 + H / 2, z: -D / 2 + 0.07, teinte: bois });
    for (const sg of [-1, 1]) a.boite(0.5, H, 0.16, '#3e2f25', { x: sg * (W / 2 - 0.25), y: 0.15 + H / 2, z: D / 2 - 0.08 });
    a.boite(W - 1.0, 0.55, 0.16, '#3e2f25', { y: 0.15 + H - 0.275, z: D / 2 - 0.08 })
      .piece(new THREE.BoxGeometry(W - 1.0, H - 0.55, 0.05, 1, 16, 1), '#b8bcc0', { y: 0.15 + (H - 0.55) / 2, z: D / 2 - 0.13, teinte: (x, yy) => (Math.floor(yy / 0.13 + 100) % 2 ? '#b8bcc0' : '#9ea2a8') })
      .boite(W - 0.96, 0.08, 0.1, '#7a7e84', { y: 0.15 + H - 0.59, z: D / 2 - 0.1 })
      .pignon(W + 0.7, 0.8, D + 0.8, P.tole, { y: 0.15 + H });
    // la plaque, le gyrophare sur son bras (rouge : il s'allume la nuit)
    a.boite(1.5, 0.42, 0.04, '#f4f2ec', { y: 0.15 + H - 0.28, z: D / 2 + 0.02 });
    ecrire(pose, { texte: '消防団', fond: '#f4f2ec', encre: '#c8302c', x: 0, y: 0.15 + H - 0.28, z: D / 2 + 0.045, l: 1.4, h: 0.36 });
    a.boite(0.08, 0.08, 0.45, '#3a3a3e', { x: W / 2 - 0.25, y: 0.15 + H + 0.02, z: D / 2 + 0.1 })
      .cylindre(0.09, 0.1, 0.06, 10, '#3a3a3e', { x: W / 2 - 0.25, y: 0.15 + H + 0.09, z: D / 2 + 0.3 })
      .piece(new THREE.SphereGeometry(0.1, 12, 6, 0, 2 * PI, 0, PI / 2), '#e83a2a', { x: W / 2 - 0.25, y: 0.15 + H + 0.12, z: D / 2 + 0.3, sorte: 'lumiere' });
    // les seaux rouges d'incendie (防火), empilés sur leur étagère, contre le côté
    a.boite(0.5, 0.06, 1.3, '#6a5240', { x: -W / 2 - 0.3, y: 0.55, z: 0.2 });
    for (const [dx, dz] of [[-0.18, -0.55], [0.18, -0.55], [-0.18, 0.95], [0.18, 0.95]]) a.boite(0.06, 0.55, 0.06, '#6a5240', { x: -W / 2 - 0.3 + dx, y: 0.27, z: dz < 0 ? 0.2 + dz : 0.2 + 0.6 });
    for (let k = 0; k < 6; k++) {
      const etage = k < 4 ? 0 : 1, rang = etage ? k - 4 : k;
      a.cylindre(0.15, 0.12, 0.26, 10, '#d8302c', { x: -W / 2 - 0.3, y: 0.71 + etage * 0.27, z: 0.2 - 0.45 + rang * 0.3 + etage * 0.15 });
    }
    // le dévidoir à tuyaux (rouge, deux roues, le tambour de tuyau blanc, le timon)
    {
      const cx = -W / 2 - 0.4, cz = D / 2 + 1.4;
      for (const sg of [-1, 1]) a.cylindre(0.36, 0.36, 0.06, 14, '#2a2a2e', { x: cx + sg * 0.42, y: 0.36, z: cz, rz: PI / 2 }).cylindre(0.08, 0.08, 0.08, 8, '#c8302c', { x: cx + sg * 0.42, y: 0.36, z: cz, rz: PI / 2 });
      a.cylindre(0.27, 0.27, 0.62, 14, '#efe9dc', { x: cx, y: 0.5, z: cz, rz: PI / 2 })
        .cylindre(0.3, 0.3, 0.05, 14, '#d8302c', { x: cx - 0.33, y: 0.5, z: cz, rz: PI / 2 })
        .cylindre(0.3, 0.3, 0.05, 14, '#d8302c', { x: cx + 0.33, y: 0.5, z: cz, rz: PI / 2 })
        .baton([cx - 0.42, 0.36, cz], [cx + 0.42, 0.36, cz], 0.03, '#c8302c', 6)
        .baton([cx - 0.3, 0.5, cz + 0.25], [cx - 0.3, 0.75, cz + 1.0], 0.025, '#c8302c', 6)
        .baton([cx + 0.3, 0.5, cz + 0.25], [cx + 0.3, 0.75, cz + 1.0], 0.025, '#c8302c', 6)
        .baton([cx - 0.3, 0.75, cz + 1.0], [cx + 0.3, 0.75, cz + 1.0], 0.025, '#2a2a2e', 6);
    }
    // la borne d'incendie (消火栓), rouge, et sa pancarte
    {
      const hx = W / 2 + 0.7, hz = D / 2 + 1.0;
      a.cylindre(0.11, 0.12, 0.8, 10, '#d8302c', { x: hx, y: 0.4, z: hz })
        .cylindre(0.13, 0.11, 0.08, 10, '#d8302c', { x: hx, y: 0.84, z: hz })
        .cylindre(0.05, 0.05, 0.22, 8, '#c8a03a', { x: hx, y: 0.6, z: hz + 0.13, rx: PI / 2 })
        .cylindre(0.03, 0.03, 1.6, 6, '#8a8a90', { x: hx + 0.5, y: 0.8, z: hz - 0.1 })
        .boite(0.42, 0.28, 0.03, '#d8302c', { x: hx + 0.5, y: 1.5, z: hz - 0.08 });
      ecrire(pose, { texte: '消火栓', fond: '#d8302c', encre: '#ffffff', x: hx + 0.5, y: 1.5, z: -0.06 + hz, l: 0.38, h: 0.22 });
    }
    // la tour de guet (火の見櫓), de fer rouille : quatre pieds qui se resserrent, des traverses et des croix, une échelle,
    // la plate-forme et sa rambarde, le petit toit pointu ; dessous, la cloche d'alarme (半鐘) et son marteau
    {
      const tx = W / 2 + 1.7, tz = -0.7, FER = '#8a3a2e', HT = 8.2;
      const pied = (sx, sz, h) => { const k = 0.8 - 0.42 * (h / HT); return [tx + sx * k, h, tz + sz * k]; };
      for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) a.baton(pied(sx, sz, -0.2), pied(sx, sz, HT), 0.055, FER, 6);
      const etages = [0.2, 2.2, 4.2, 6.2, HT - 0.4];
      const cotes = [[[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]]];
      for (const h of etages) for (const [[ax, az], [bx, bz]] of cotes) a.baton(pied(ax, az, h), pied(bx, bz, h), 0.03, FER, 5);
      for (let k = 0; k < etages.length - 1; k++) {
        for (const [[ax, az], [bx, bz]] of cotes) {
          a.baton(pied(ax, az, etages[k]), pied(bx, bz, etages[k + 1]), 0.018, FER, 4, { trait: false })
            .baton(pied(bx, bz, etages[k]), pied(ax, az, etages[k + 1]), 0.018, FER, 4, { trait: false });
        }
      }
      // l'échelle, sur la face qui regarde le village (+z)
      for (const sg of [-1, 1]) a.baton([tx + sg * 0.2, 0, tz + 0.86], [tx + sg * 0.2, HT - 0.4, tz + 0.48], 0.02, '#5a5a60', 4);
      for (let k = 1; k < 26; k++) { const h = k * 0.3, f = h / HT; a.baton([tx - 0.2, h, tz + 0.86 - 0.47 * f], [tx + 0.2, h, tz + 0.86 - 0.47 * f], 0.012, '#5a5a60', 4, { trait: false }); }
      a.boite(1.35, 0.06, 1.35, '#6a6e72', { x: tx, y: HT - 0.4, z: tz });
      for (const [[ax, az], [bx, bz]] of cotes) a.baton([tx + ax * 0.66, HT + 0.5, tz + az * 0.66], [tx + bx * 0.66, HT + 0.5, tz + bz * 0.66], 0.025, FER, 5);
      for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) a.baton([tx + sx * 0.66, HT - 0.4, tz + sz * 0.66], [tx + sx * 0.6, HT + 1.25, tz + sz * 0.6], 0.03, FER, 5);
      a.piece(new THREE.ConeGeometry(1.05, 0.9, 4), P.tole, { x: tx, y: HT + 1.65, z: tz, ry: PI / 4 })
        .cylindre(0.03, 0.03, 0.5, 6, FER, { x: tx, y: HT + 2.25, z: tz })
        .cylindre(0.12, 0.2, 0.34, 12, '#7a5a34', { x: tx, y: HT + 0.95, z: tz })
        .boule(0.05, '#5a4026', { x: tx, y: HT + 0.75, z: tz }, 0)
        .baton([tx + 0.3, HT + 0.7, tz + 0.2], [tx + 0.06, HT + 0.95, tz + 0.1], 0.015, '#6a5240', 4);
    }
    poser(a.fin(0, peinture), CASERNE.x, CASERNE.z, { ry, y });
    lumieres.push({ x: CASERNE.x + Math.sin(ry) * (D / 2 + 0.3) + Math.cos(ry) * (W / 2 - 0.25), y: y + 0.15 + H + 0.15, z: CASERNE.z + Math.cos(ry) * (D / 2 + 0.3) - Math.sin(ry) * (W / 2 - 0.25), halo: 0.35, sol: y, r: 2.6, c: '#ff5a4a' });
    // ce qui arrête : le dépôt, la tour, le dévidoir, la borne ; pour la caméra, le dépôt et la tour
    const local = (lx, lz) => [CASERNE.x + lx * Math.cos(ry) + lz * Math.sin(ry), CASERNE.z - lx * Math.sin(ry) + lz * Math.cos(ry)];
    for (const [lx, lz, rr] of [[0, 0, 2.1], [W / 2 + 1.7, -0.7, 0.95], [-W / 2 - 0.4, D / 2 + 1.6, 0.75], [W / 2 + 0.7, D / 2 + 1.0, 0.22], [W / 2 + 1.2, D / 2 + 0.9, 0.15]]) {
      const [cx, cz] = local(lx, lz);
      monde.cercle(cx, cz, rr);
    }
    { const [ax, az] = local(-W / 2 - 0.3, -0.45), [bx, bz] = local(-W / 2 - 0.3, 0.85); monde.mur(ax, az, bx, bz, 0.35); }
    monde.bloc(CASERNE.x - 2.2, CASERNE.x + 2.2, CASERNE.z - 2.2, CASERNE.z + 2.2, y - 1, y + 3.8);
    { const [cx, cz] = local(W / 2 + 1.7, -0.7); monde.bloc(cx - 0.9, cx + 0.9, cz - 0.9, cz + 0.9, y - 1, y + 10.5); }
  }

  /**
   * L'essai des canons à eau : chaque cabane (sa forme à part) ouvre ses portes, son canon se lève et l'eau jaillit en
   * arc par-dessus les toits, retombe en pluie fine ; un arc-en-ciel dans la bruine. Des gouttes (des points) dont la
   * place se calcule à chaque image. jouer(oui) ; anime : { objet, maj }.
   */
  function creerEssai() {
    const groupe = new THREE.Group(), forme = atelier();
    forme.boite(1.3, 1.9, 1.3, '#6a5040', { y: 0.95 })
      .boite(1.34, 0.12, 1.34, '#4a3626', { y: 0.06 })
      .pignon(1.9, 1.1, 1.9, P.chaume, { y: 1.9, ry: PI / 2 })
      .boite(0.9, 1.4, 0.04, '#4a3626', { y: 0.82, z: 0.66, trait: false });
    const corps = forme.fin(0, peinture);
    // le canon : un tube de cuivre sur son pied, la buse ; il sort par le toit, levé vers le ciel
    const canon = atelier().cylindre(0.12, 0.14, 1.3, 8, '#8a8a90', { y: 0.65 }).cylindre(0.08, 0.05, 1.3, 8, '#c9883a', { y: 1.9 }).cylindre(0.1, 0.1, 0.08, 8, '#2a2a2e', { y: 1.28 }).fin(0, false);
    // (deux battants : l'un s'ouvre vers la gauche, l'autre vers la droite ; chacun sa forme, sans échelle négative)
    const portes = [-1, 1].map((sx) => atelier().boite(0.45, 1.36, 0.05, '#7a5a40', { x: -sx * 0.225 }).fin(0, false));
    const liste = cabanes.map((c) => {
      const g = new THREE.Group();
      g.position.set(c.x, c.y, c.z);
      g.rotation.y = c.ry;
      g.add(ctx.maillage(corps));
      const pc = new THREE.Group();
      pc.add(ctx.maillage(canon));
      pc.position.set(0, 0.0, 1.05);
      pc.scale.y = 0.01;
      pc.visible = false;
      g.add(pc);
      const battants = [-1, 1].map((s, k) => { const p = new THREE.Group(); p.position.set(s * 0.45, 0.82, 0.69); p.add(ctx.maillage(portes[k])); g.add(p); return p; });
      groupe.add(g);
      // l'arc : vers le centre du village, par-dessus le toit le plus proche
      const vx = -c.x, vz = -c.z, l = Math.hypot(vx, vz) || 1, portee = 14 + hasard(c.x, c.z) * 6;
      return { ...c, g, pc, battants, dir: [vx / l, vz / l], portee };
    });
    // les gouttes
    const N = 3600, pos = new Float32Array(N * 3), vie = new Float32Array(N), vit = new Float32Array(N * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    const tache = (() => {
      if (typeof document === 'undefined') return null;
      const cv = document.createElement('canvas');
      cv.width = cv.height = 32;
      const g2 = cv.getContext('2d'), d = g2.createRadialGradient(16, 16, 0, 16, 16, 16);
      d.addColorStop(0, 'rgba(255,255,255,1)'); d.addColorStop(0.6, 'rgba(255,255,255,0.7)'); d.addColorStop(1, 'rgba(255,255,255,0)');
      g2.fillStyle = d; g2.fillRect(0, 0, 32, 32);
      const t = new THREE.CanvasTexture(cv);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    })();
    const gouttes = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#eaf6ff', size: 0.34, sizeAttenuation: true, transparent: true, opacity: 0.8, depthWrite: false, map: tache }));
    gouttes.frustumCulled = false;
    groupe.add(gouttes);
    // l'arc-en-ciel : un anneau aux couleurs de l'arc, très transparent, dans la bruine au-dessus du village
    const arc = new THREE.Mesh(new THREE.RingGeometry(16, 18.5, 48, 1, 0, PI), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { force: { value: 0 } },
      vertexShader: 'varying vec2 vUv; varying float vR; void main() { vR = length(position.xy); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform float force; varying float vR;
        void main() { float t = (vR - 16.0) / 2.5; vec3 c = clamp(vec3(abs(t * 6.0 - 3.0) - 1.0, 2.0 - abs(t * 6.0 - 2.0), 2.0 - abs(t * 6.0 - 4.0)), 0.0, 1.0);
          gl_FragColor = vec4(c, force * 0.32 * smoothstep(0.0, 0.15, t) * smoothstep(1.0, 0.85, t)); }`,
    }));
    arc.position.set(4, niveau(4, 0) - 3, -6);
    arc.rotation.y = -0.6;
    arc.visible = false;
    groupe.add(arc);
    let t = -1, n = 0, suivante = 0;
    return {
      jouer() { t = 0; },
      get fini() { return t < 0 || t > 11; },
      anime: {
        objet: groupe,
        maj(dt) {
          if (t < 0) return [];
          t += dt;
          const ouvre = lisse(0, 1.2, t) * (1 - lisse(9.4, 10.6, t)), jet = lisse(1.4, 2.0, t) * (1 - lisse(8.4, 9.2, t));
          for (const c of liste) {
            const leve = lisse(0.5, 1.4, t) * (1 - lisse(9.6, 10.6, t));
            c.pc.visible = leve > 0.01;
            c.pc.scale.y = Math.max(0.01, leve);
            c.pc.rotation.x = 0.75 * leve;
            c.battants.forEach((p, k) => { p.rotation.y = (k ? 1 : -1) * 1.6 * ouvre; });
          }
          // de nouvelles gouttes à chaque image, de chaque canon, tant que l'eau jaillit
          if (jet > 0.01) {
            suivante += dt * 2600 * jet;
            while (suivante >= 1) {
              suivante -= 1;
              const c = liste[n % liste.length], i = n % N;
              n++;
              // (le jet s'ouvre un peu en éventail : la vitesse, la direction, varient d'une goutte à l'autre)
              const v = 10.6 + Math.random() * 1.8, hz = (c.portee / 2.6) * (0.92 + Math.random() * 0.16);
              const ang = (Math.random() - 0.5) * 0.1;
              const dx = c.dir[0] * Math.cos(ang) - c.dir[1] * Math.sin(ang), dz = c.dir[0] * Math.sin(ang) + c.dir[1] * Math.cos(ang);
              pos.set([c.x + c.dir[0] * 2.4, c.y + 2.35, c.z + c.dir[1] * 2.4], i * 3);
              vit.set([dx * hz, v, dz * hz], i * 3);
              vie[i] = 2.6 + Math.random() * 0.4;
            }
          }
          for (let i = 0; i < N; i++) {
            if (vie[i] <= 0) { pos[i * 3 + 1] = -1000; continue; }
            vie[i] -= dt;
            vit[i * 3 + 1] -= 9.8 * dt;
            vit[i * 3] *= 1 - 0.25 * dt; vit[i * 3 + 2] *= 1 - 0.25 * dt;
            pos[i * 3] += vit[i * 3] * dt; pos[i * 3 + 1] += vit[i * 3 + 1] * dt; pos[i * 3 + 2] += vit[i * 3 + 2] * dt;
          }
          geo.attributes.position.needsUpdate = true;
          arc.visible = jet > 0.05;
          arc.material.uniforms.force.value = lisse(3, 5, t) * (1 - lisse(8.6, 10, t));
          if (t > 12) { t = -1; for (let i = 0; i < N; i++) vie[i] = 0; }
          return [];
        },
      },
    };
  }

  // ---------------------------------------------------------------- L'arrivée : le parking, le car, l'arrêt, la route
  // le car du patrimoine mondial (世界遺産バス) vient d'arriver ; l'abri de l'arrêt « 相倉口 » et son banc ; le panneau de
  // direction ; la route file au nord entre ses talus de béton quadrillé et s'enfonce dans la montagne par un tunnel ; à
  // la sortie du parking, une barrière : le tunnel est interdit aux piétons
  {
    const a = atelier(), y = niveau(38, -64);
    // les places du parking : des lignes blanches (au-dessus du sol tel qu'il est dessiné, 3 cm sur le terrain)
    for (const x of [39.8, 42.3, 44.8]) a.boite(0.12, 0.012, 4.2, '#f4f4f0', { x, y: y + 0.046, z: -67.4, trait: false });
    a.boite(5.2, 0.012, 0.12, '#f4f4f0', { x: 42.3, y: y + 0.046, z: -65.3, trait: false });
    // le car : sa caisse blanche, le toit et la climatisation, ses vitres en bande (des montants blancs), le pare-brise,
    // la girouette (le bandeau lumineux de la destination), les phares, le pare-chocs, les rétroviseurs en oreilles de
    // lapin, la porte (à gauche, côté trottoir, comme au Japon), les roues et leurs passages, les bandes vertes et bleues
    {
      const bx = 33.4, bz = -64.1, by = y, BLANC = '#f3f2ee', VITRE = '#26333f';
      a.boite(2.3, 2.49, 9.0, BLANC, { x: bx, y: by + 1.665, z: bz })
        .boite(2.14, 0.14, 8.84, '#e8e6e0', { x: bx, y: by + 2.98, z: bz })
        .boite(1.5, 0.22, 2.2, '#d8d6d0', { x: bx, y: by + 3.16, z: bz - 1.2 });
      for (const sg of [-1, 1]) {
        a.boite(0.02, 0.92, 7.2, VITRE, { x: bx + sg * 1.16, y: by + 2.32, z: bz - 0.65, trait: false });
        for (let k = 0; k <= 6; k++) a.boite(0.03, 0.92, 0.1, BLANC, { x: bx + sg * 1.177, y: by + 2.32, z: bz - 4.2 + k * 1.19, trait: false });
        a.boite(0.012, 0.26, 9.0, '#2f8a5a', { x: bx + sg * 1.157, y: by + 1.32, z: bz, trait: false })
          .boite(0.012, 0.07, 9.0, '#2f6a9a', { x: bx + sg * 1.157, y: by + 1.12, z: bz, trait: false });
        for (const wz of [3.05, -2.75]) {
          a.boite(0.012, 0.55, 1.15, '#2a2a2e', { x: bx + sg * 1.157, y: by + 0.7, z: bz + wz, trait: false })
            .cylindre(0.47, 0.47, 0.3, 14, '#202024', { x: bx + sg * 0.98, y: by + 0.47, z: bz + wz, rz: PI / 2 })
            .cylindre(0.24, 0.24, 0.32, 10, '#b8bcc0', { x: bx + sg * 0.98, y: by + 0.47, z: bz + wz, rz: PI / 2 });
        }
        a.baton([bx + sg * 1.05, by + 2.85, bz + 4.46], [bx + sg * 1.32, by + 2.78, bz + 4.92], 0.025, '#2a2a2e', 5)
          .boite(0.12, 0.34, 0.06, '#2a2a2e', { x: bx + sg * 1.32, y: by + 2.58, z: bz + 4.94 })
          .boite(0.36, 0.15, 0.03, '#f6f1d0', { x: bx + sg * 0.78, y: by + 0.92, z: bz + 4.51, trait: false })
          .boite(0.3, 0.15, 0.03, '#d8302c', { x: bx + sg * 0.85, y: by + 0.92, z: bz - 4.51, trait: false });
      }
      a.boite(2.12, 1.18, 0.02, VITRE, { x: bx, y: by + 2.03, z: bz + 4.51, trait: false })
        .boite(1.5, 0.24, 0.02, '#151515', { x: bx, y: by + 2.77, z: bz + 4.51, trait: false })
        .boite(1.0, 0.3, 0.02, '#3a3a3e', { x: bx, y: by + 0.98, z: bz + 4.51, trait: false })
        .boite(2.34, 0.26, 0.16, '#3a3a3e', { x: bx, y: by + 0.55, z: bz + 4.56 })
        .boite(2.34, 0.26, 0.16, '#3a3a3e', { x: bx, y: by + 0.55, z: bz - 4.56 })
        .boite(1.9, 0.62, 0.02, VITRE, { x: bx, y: by + 2.45, z: bz - 4.51, trait: false })
        .boite(0.02, 1.95, 0.9, VITRE, { x: bx + 1.165, y: by + 1.42, z: bz + 3.5, trait: false })
        .boite(0.03, 1.95, 0.05, BLANC, { x: bx + 1.18, y: by + 1.42, z: bz + 3.02, trait: false })
        .boite(0.03, 1.95, 0.05, BLANC, { x: bx + 1.18, y: by + 1.42, z: bz + 3.98, trait: false })
        .boite(0.28, 0.08, 0.9, '#2a2a2e', { x: bx + 1.0, y: by + 0.36, z: bz + 3.5 });
      const poseCar = { x: bx, y: by, z: bz, ry: 0 };
      for (const sg of [-1, 1]) ecrire(poseCar, { texte: '世界遺産バス', fond: BLANC, encre: '#2f6a9a', x: sg * 1.168, y: 1.7, z: -0.8, ry: sg * PI / 2, l: 2.8, h: 0.36 });
      ecrire(poseCar, { texte: '相倉口 ⇄ 高岡駅', fond: '#151515', encre: '#ffb03a', x: 0, y: 2.77, z: 4.522, l: 1.42, h: 0.2, lumineux: true });
      monde.surface(bx - 1.25, bx + 1.25, bz - 4.65, bz + 4.65, by + 3.4, { plein: true });
      monde.bloc(bx - 1.25, bx + 1.25, bz - 4.65, bz + 4.65, by - 1, by + 3.4);
    }
    // l'abri de l'arrêt (待合所) : trois murs de planches, le toit de tôle, le banc, l'horaire ; son côté ouvert vers
    // le car ; le poteau de l'arrêt et son disque « 相倉口 »
    {
      const sx = 37.6, sz = -62.4, poseA = { x: sx, y, z: sz, ry: 0 };
      const bois = (x, yy) => (Math.floor(yy / 0.2 + 100) % 2 ? '#8a6a4a' : '#7a5c3e');
      a.boite(1.8, 0.12, 2.8, '#a8a49a', { x: sx, y: y + 0.03, z: sz })
        .piece(new THREE.BoxGeometry(0.08, 2.1, 2.6, 1, 10, 1), '#8a6a4a', { x: sx + 0.78, y: y + 1.12, z: sz, teinte: bois });
      for (const sg of [-1, 1]) a.piece(new THREE.BoxGeometry(1.5, 2.1, 0.08, 1, 10, 1), '#8a6a4a', { x: sx + 0.07, y: y + 1.12, z: sz + sg * 1.26, teinte: bois });
      // dans les murs de côté, une fenêtre coulissante (deux vitres, leur cadre) ; les poteaux du côté ouvert ; sous le
      // toit, la planche du nom de l'arrêt ; une affiche du village dehors, sur le mur du fond, et une dedans
      const CADRE = '#6a4e36';
      for (const sg of [-1, 1]) {
        const zf = sz + sg * 1.26;
        a.boite(0.9, 0.66, 0.1, '#3b4b57', { x: sx + 0.07, y: y + 1.42, z: zf, trait: false })
          .boite(1.02, 0.06, 0.12, CADRE, { x: sx + 0.07, y: y + 1.78, z: zf })
          .boite(1.02, 0.06, 0.12, CADRE, { x: sx + 0.07, y: y + 1.06, z: zf })
          .boite(0.04, 0.66, 0.112, CADRE, { x: sx + 0.07, y: y + 1.42, z: zf, trait: false })
          .boite(0.1, 2.28, 0.1, CADRE, { x: sx - 0.68, y: y + 1.21, z: zf });
        for (const dx of [-0.48, 0.48]) a.boite(0.06, 0.66, 0.116, CADRE, { x: sx + 0.07 + dx, y: y + 1.42, z: zf });
      }
      a.boite(0.05, 0.26, 2.5, CADRE, { x: sx - 0.7, y: y + 2.2, z: sz })
        .boite(0.02, 0.9, 0.64, '#f4f2ec', { x: sx + 0.83, y: y + 1.35, z: sz + 0.45 })
        .boite(0.02, 0.7, 0.5, '#f4f2ec', { x: sx + 0.725, y: y + 1.4, z: sz + 0.45 });
      ecrire(poseA, { texte: '相倉口', sous: 'バス待合所', fond: '#f4f2ec', encre: '#2a2420', x: -0.73, y: 2.2, z: 0, ry: -PI / 2, l: 1.3, h: 0.24 });
      ecrire(poseA, { texte: '', fond: null, dessin: affiche, x: 0.845, y: 1.35, z: 0.45, ry: PI / 2, l: 0.6, h: 0.86 });
      ecrire(poseA, { texte: '', fond: null, dessin: affiche, x: 0.71, y: 1.4, z: 0.45, ry: -PI / 2, l: 0.48, h: 0.68 });
      a.boite(2.1, 0.08, 3.1, P.tole, { x: sx + 0.05, y: y + 2.28, z: sz, rz: -0.12 })
        .boite(0.42, 0.06, 2.3, P.bois, { x: sx + 0.48, y: y + 0.48, z: sz });
      for (const dz of [-1.0, 1.0]) a.boite(0.06, 0.45, 0.3, '#5a4436', { x: sx + 0.48, y: y + 0.23, z: sz + dz });
      a.boite(0.03, 0.6, 0.5, '#f4f2ec', { x: sx + 0.725, y: y + 1.55, z: sz - 0.6 });
      ecrire(poseA, { texte: '時刻表', sous: '相倉口', lignes: 4, fond: '#f4f2ec', encre: '#2a2420', x: 0.705, y: 1.55, z: -0.6, ry: -PI / 2, l: 0.46, h: 0.56 });
      bancs.push({ de: [sx + 0.45, sz - 0.95], a: [sx + 0.45, sz + 0.95], y: y + 0.51, cap: -PI / 2, vue: 0.3 });
      monde.mur(sx + 0.78, sz - 1.3, sx + 0.78, sz + 1.3, 0.12);
      for (const sg of [-1, 1]) monde.mur(sx - 0.68, sz + sg * 1.26, sx + 0.78, sz + sg * 1.26, 0.12);
      monde.toit(sx - 0.8, sx + 0.85, sz - 1.35, sz + 1.35, y + 2.12, y + 2.5);
      const px = 36.0, pz = -59.6;
      a.cylindre(0.04, 0.04, 2.25, 6, '#8a8a90', { x: px, y: y + 1.12, z: pz })
        .cylindre(0.32, 0.32, 0.03, 18, '#2f6a9a', { x: px, y: y + 2.1, z: pz - 0.01, rx: PI / 2 })
        .boite(0.34, 0.5, 0.03, '#f4f2ec', { x: px, y: y + 1.4, z: pz + 0.03 });
      ecrire({ x: px, y, z: pz, ry: 0 }, { texte: '相倉', fond: '#ffffff', encre: '#2f6a9a', cadre: '#2f6a9a', x: 0, y: 2.1, z: 0.025, l: 0.62, h: 0.62, forme: 'rond' });
      ecrire({ x: px, y, z: pz, ry: 0 }, { texte: '時刻表', lignes: 5, fond: '#f4f2ec', encre: '#2a2420', x: 0, y: 1.4, z: 0.05, l: 0.3, h: 0.46 });
      monde.cercle(px, pz, 0.2);
    }
    // la route : ses lignes (les bords blancs, le milieu jaune : on ne double pas), ses balises blanches à catadioptre
    // orange ; la barrière rayée à la sortie du parking, le panneau rond « interdit aux piétons » et sa plaque
    {
      const ici = (lx, d) => duTunnel(lx, d), ryR = T_A;
      for (const [lx, c, l] of [[-3.45, '#f4f4f0', 0.14], [3.45, '#f4f4f0', 0.14], [0, '#e8c23a', 0.14]]) {
        const [x0, z0] = ici(lx, -15.2), [x1, z1] = ici(lx, -0.2), [mx, mz] = [(x0 + x1) / 2, (z0 + z1) / 2];
        a.boite(l, 0.012, 15.0, c, { x: mx, y: routeY(-7.7) + 0.046, z: mz, ry: ryR, trait: false });
      }
      for (let d = -14; d < -1; d += 4) {
        for (const sg of [-1, 1]) {
          const [x, z] = ici(sg * 4.45, d), h = routeY(d);
          a.cylindre(0.05, 0.05, 0.85, 6, '#f4f4f0', { x, y: h + 0.42, z })
            .boite(0.07, 0.12, 0.03, '#f08a2a', { x, y: h + 0.72, z: z + 0.05 * T_FZ, ry: ryR, trait: false });
        }
      }
      // les talus : un quadrillage de poutres de béton (法枠, 2 m), l'herbe dans ses cases. Une poutre suit le talus,
      // 32 cm de large, 10 cm au-dessus (celles qui montent la pente : 12 cm, pour qu'aux croisements deux dessus ne
      // soient pas dans le même plan)
      {
        const surTalus = (lx, d) => {
          const [x, z] = ici(lx, d), h = terrain(x, z);
          return h > routeY(d) + 0.12 && Math.abs(h - (routeY(d) + (Math.abs(lx) - 4.8) * 1.1)) < 0.02;
        };
        const pos = [];
        const quad = (A, B, C, D, n) => {
          const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2];
          const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
          if (nx * n[0] + ny * n[1] + nz * n[2] >= 0) pos.push(...A, ...B, ...C, ...A, ...C, ...D);
          else pos.push(...A, ...C, ...B, ...A, ...D, ...C);
        };
        // une poutre : ses points [lx, d] le long de sa ligne ; « large » : 'lx' (elle longe la route) ou 'd'
        const poutre = (pts, large, e) => {
          const P3 = pts.map(([lx, d]) => {
            const g = large === 'lx' ? [lx - 0.16, d] : [lx, d - 0.16], dr = large === 'lx' ? [lx + 0.16, d] : [lx, d + 0.16];
            const [cx, cz] = ici(lx, d);
            const cote = ([l, dd]) => { const [x, z] = ici(l, dd), h = terrain(x, z); return { haut: [x, h + e, z], bas: [x, h - 0.08, z], n: [x - cx, 0, z - cz] }; };
            return { c: [cx, cz], g: cote(g), d: cote(dr) };
          });
          for (let i = 0; i < P3.length - 1; i++) {
            const A = P3[i], B = P3[i + 1];
            quad(A.g.haut, A.d.haut, B.d.haut, B.g.haut, [0, 1, 0]);
            quad(A.g.bas, A.g.haut, B.g.haut, B.g.bas, A.g.n);
            quad(A.d.bas, A.d.haut, B.d.haut, B.d.bas, A.d.n);
          }
          const [D0, D1] = [P3[0], P3[P3.length - 1]], u = [D1.c[0] - D0.c[0], 0, D1.c[1] - D0.c[1]];
          quad(D0.g.bas, D0.g.haut, D0.d.haut, D0.d.bas, [-u[0], 0, -u[2]]);
          quad(D1.g.bas, D1.g.haut, D1.d.haut, D1.d.bas, u);
        };
        // les morceaux d'une ligne qui sont sur le talus
        const morceaux = (pts) => {
          const runs = [];
          let cur = [];
          for (const p of pts) {
            if (surTalus(p[0], p[1])) cur.push(p);
            else { if (cur.length > 1) runs.push(cur); cur = []; }
          }
          if (cur.length > 1) runs.push(cur);
          return runs;
        };
        for (const sg of [-1, 1]) {
          for (let A = 5.1; A < 40; A += 2) {
            const pts = [];
            for (let d = -17.4; d <= -0.6; d += 0.4) pts.push([sg * A, d]);
            const runs = morceaux(pts);
            if (!runs.length && A > 6) break;
            for (const r of runs) poutre(r, 'lx', 0.1);
          }
          for (let D = -17; D <= -1; D += 2) {
            const pts = [];
            for (let A = 4.95; A < 40; A += 0.4) pts.push([sg * A, D]);
            for (const r of morceaux(pts)) poutre(r, 'd', 0.12);
          }
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        a.piece(g, '#cdc6b6', { trait: false, nuance: 0.03 });
      }
      // la barrière
      const dB = -15.55, [bx0, bz0] = ici(-4.4, dB), [bx1, bz1] = ici(4.4, dB), hB = routeY(dB);
      for (const [x, z] of [[bx0, bz0], [bx1, bz1]]) a.cylindre(0.06, 0.07, 1.0, 8, '#e8e4dc', { x, y: hB + 0.5, z });
      for (let k = 0; k < 8; k++) {
        const f0 = k / 8, f1 = (k + 1) / 8;
        a.baton([bx0 + (bx1 - bx0) * f0, hB + 0.86, bz0 + (bz1 - bz0) * f0], [bx0 + (bx1 - bx0) * f1, hB + 0.86, bz0 + (bz1 - bz0) * f1], 0.055, k % 2 ? '#d8302c' : '#f4f2ec', 8);
      }
      const [sx, sz] = ici(1.6, dB - 0.15);
      a.cylindre(0.04, 0.04, 2.0, 6, '#8a8a90', { x: sx, y: hB + 1.0, z: sz });
      const poseB = { x: sx, y: hB, z: sz, ry: ryR };
      ecrire(poseB, { texte: '', fond: null, dessin: pietonInterdit, x: 0, y: 1.78, z: 0.05, l: 0.56, h: 0.56 });
      ecrire(poseB, { texte: '歩行者', sous: '通行止め', fond: '#ffffff', encre: '#2a2420', cadre: '#2a2420', x: 0, y: 1.25, z: 0.05, l: 0.5, h: 0.42 });
      monde.mur(bx0, bz0, bx1, bz1, 0.3);
      monde.cercle(sx, sz, 0.15);
      // le panneau de direction, bleu, sur deux poteaux, à côté de la barrière
      const [dx0, dz0] = ici(6.6, -14.2), hD = routeY(-14.2);
      for (const sg of [-1, 1]) a.cylindre(0.05, 0.05, 2.7, 6, '#8a8a90', { x: dx0 + sg * 0.65 * T_LX, y: hD + 1.35, z: dz0 + sg * 0.65 * T_LZ });
      a.boite(1.6, 0.9, 0.04, '#1f5aa8', { x: dx0, y: hD + 2.3, z: dz0, ry: ryR });
      ecrire({ x: dx0, y: hD, z: dz0, ry: ryR }, { texte: '↑ 高岡  Takaoka', sous: '← 相倉集落  Ainokura', fond: '#1f5aa8', encre: '#ffffff', x: 0, y: 2.3, z: 0.025, l: 1.5, h: 0.8 });
      monde.cercle(dx0, dz0, 0.6);
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }
  // ---- le tunnel (相倉トンネル), au bout de la route : la façade de béton en gradins (la montagne la recouvre par
  // derrière), l'arche et son bandeau, la plaque du nom ; dedans, le tube qui s'enfonce en s'assombrissant, ses
  // trottoirs, ses lampes orange, les lignes de la chaussée. Construit face à +z (le parking), y = 0 : la chaussée.
  {
    const a = atelier(), { l: W, mur: HM, fond } = TUBE, PROF = FACADE.prof;
    const BETON = '#d6d1c4', NUIT = '#1e1c1a';
    const sombre = (c, d) => melanger(c, NUIT, Math.min(1, Math.max(0, d) / fond) ** 0.55);
    const arche = (f, e = 0) => {
      f.moveTo(-W - e, 0); f.lineTo(-W - e, HM); f.absarc(0, HM, W + e, PI, 0, true); f.lineTo(W + e, 0); f.lineTo(-W - e, 0);
      return f;
    };
    const [l0, h0] = FACADE.gradins[0];
    const forme = new THREE.Shape();
    forme.moveTo(-l0, -0.6); forme.lineTo(l0, -0.6); forme.lineTo(l0, h0); forme.lineTo(-l0, h0); forme.lineTo(-l0, -0.6);
    forme.holes.push(arche(new THREE.Path()));
    const dedans = (x, yy, z) => Math.abs(x) < W + 0.01 && yy > -0.01 && yy < HM + W + 0.01 && z < -0.01 && z > -PROF + 0.01;
    a.piece(new THREE.ExtrudeGeometry(forme, { depth: PROF, bevelEnabled: false, steps: 5, curveSegments: 16 }), BETON, {
      z: -PROF, nuance: 0.03,
      teinte: (x, yy, z) => (!dedans(x, yy, z) ? BETON : sombre(yy < 0.02 ? '#5c5a56' : yy < 0.9 ? '#b9b3a6' : '#cdc7ba', -z)),
    });
    for (const sg of [-1, 1]) {
      for (let k = 1; k < FACADE.gradins.length; k++) {
        const [l, h] = FACADE.gradins[k], lp = FACADE.gradins[k - 1][0];
        a.boite(l - lp, h + 0.6, PROF, BETON, { x: (sg * (l + lp)) / 2, y: (h - 0.6) / 2, z: -PROF / 2, nuance: 0.03 })
          .boite(l - lp + 0.02, 0.2, 0.42, '#c9c3b6', { x: (sg * (l + lp)) / 2, y: h + 0.1, z: 0.08 });
      }
    }
    a.boite(2 * l0 + 0.04, 0.24, 0.5, '#c9c3b6', { y: h0 + 0.12, z: 0.06 });
    const bandeau = new THREE.Shape(), E = 0.55;
    bandeau.moveTo(-W - E, 0); bandeau.lineTo(-W - E, HM); bandeau.absarc(0, HM, W + E, PI, 0, true); bandeau.lineTo(W + E, 0);
    bandeau.lineTo(W, 0); bandeau.lineTo(W, HM); bandeau.absarc(0, HM, W, 0, PI, false); bandeau.lineTo(-W, 0); bandeau.lineTo(-W - E, 0);
    a.piece(new THREE.ExtrudeGeometry(bandeau, { depth: 0.26, bevelEnabled: false, curveSegments: 16 }), '#e4dfd3', {});
    a.boite(3.9, 0.98, 0.14, '#8d887e', { y: h0 - 0.75, z: 0.07 });
    ecrire({ x: TUN.x, z: TUN.z, y: T_Y, ry: T_A }, { texte: '相倉トンネル', sous: 'AINOKURA TUNNEL', x: 0, y: h0 - 0.75, z: 0.146, l: 3.66, h: 0.78, fond: '#f2eee3', encre: '#2a2622', cadre: '#9a948a' });
    const profil = [[-W, 0], [-W, 0.9], [-W, HM]];
    for (let i = 1; i < 16; i++) { const t = PI - (i / 16) * PI; profil.push([W * Math.cos(t), HM + W * Math.sin(t)]); }
    profil.push([W, HM], [W, 0.9], [W, 0], [-W, 0]);
    const tri = [], couleurs = [], tranches = 9;
    for (let j = 0; j < tranches; j++) {
      const za = -PROF - (j * (fond - PROF)) / tranches, zb = -PROF - ((j + 1) * (fond - PROF)) / tranches, dm = -(za + zb) / 2;
      for (let i = 0; i < profil.length - 1; i++) {
        const [x0, y0] = profil[i], [x1, y1] = profil[i + 1];
        const A = [x0, y0, za], B = [x1, y1, za], Cc = [x1, y1, zb], D = [x0, y0, zb];
        const nx = (y1 - y0) * (zb - za), ny = -(x1 - x0) * (zb - za);
        const versAxe = nx * -((x0 + x1) / 2) + ny * (HM * 0.8 - (y0 + y1) / 2) > 0;
        tri.push(...(versAxe ? [A, B, Cc, A, Cc, D] : [A, Cc, B, A, D, Cc]));
        const c = sombre(y0 + y1 < 0.05 ? '#5c5a56' : (y0 + y1) / 2 < 0.9 ? '#b9b3a6' : '#cdc7ba', dm);
        couleurs.push(c, c);
      }
    }
    const tube = new THREE.BufferGeometry();
    tube.setAttribute('position', new THREE.Float32BufferAttribute(tri.flat(), 3));
    a.piece(tube, '#cdc7ba', { couleurs, trait: false, nuance: 0.02 });
    a.piece(new THREE.ShapeGeometry(arche(new THREE.Shape()), 16), NUIT, { z: -fond, trait: false });
    const nT = 12;
    for (let j = 0; j < nT; j++) {
      const za = -(j * fond) / nT, zb = -((j + 1) * fond) / nT, dm = -(za + zb) / 2, lz = za - zb;
      for (const sg of [-1, 1]) {
        a.boite(0.6, 0.22, lz, sombre('#bdb7aa', dm), { x: sg * (W - 0.3), y: 0.11, z: (za + zb) / 2, trait: false, nuance: 0.01 })
          .boite(0.12, 0.012, lz, sombre('#f2efe6', dm), { x: sg * (W - 0.8), y: 0.006, z: (za + zb) / 2, trait: false, nuance: 0.01 });
      }
      a.boite(0.12, 0.012, lz * 0.6, sombre('#e8c23a', dm), { y: 0.006, z: (za + zb) / 2, trait: false, nuance: 0.01 });
    }
    for (let d = 1.6; d < fond - 0.5; d += 2.6) {
      for (const sg of [-1, 1]) a.boite(0.1, 0.16, 0.62, '#ffc061', { x: sg * (W - 0.05), y: HM - 0.25, z: -d, trait: false, sorte: 'lampe' });
    }
    poser(a.fin(0, peinture), TUN.x, TUN.z, { ry: T_A, y: T_Y });
    // pour la caméra : la façade, en blocs (son repère est tourné)
    for (const lx of [-7.2, -3.6, 0, 3.6, 7.2]) { const [x, z] = duTunnel(lx, 2.9); monde.bloc(x - 2.2, x + 2.2, z - 2.2, z + 2.2, T_Y - 2, T_Y + 9); }
  }
  const PANNEAUX = {
    bienvenue: { x: 27.6, z: -54.4, ry: -1.47 }, // (au bord du chemin, devant le départ, tourné vers lui : derrière, il bouchait la vue)
    gassho: { x: 8.5, z: -34, ry: PI - 0.9 },
    jinja: { x: -33.5, z: -29.5, ry: -PI / 2 + 0.3 },
    kokiriko: { x: 17.6, z: 16, ry: PI / 2 + 0.6 },
    washi: { x: -15.2, z: -3.1, ry: PI - 0.4 },
    belvedere: { x: -33.2, z: -47.6, ry: PI - 0.8 },
    hosui: { x: 11.5, z: -22.8, ry: PI - 0.3 },
    riviere: { x: 19.5, z: 66.5, ry: -0.4 },
    musee: { x: -9.6, z: 18.4, ry: -PI / 2 - 0.5 },
  };
  const TITRES = { bienvenue: '五箇山', gassho: '合掌造り', jinja: '地主神社', kokiriko: 'こきりこ節', washi: '五箇山和紙', belvedere: '展望台', hosui: '放水銃', riviere: '庄川', musee: '民俗館' };
  for (const [id, p] of Object.entries(PANNEAUX)) {
    const pose = { x: p.x, z: p.z, y: monde.hauteur(p.x, p.z), ry: p.ry };
    poser(panneau(atelier(), P, { ecrit: true }).fin(0, peinture), p.x, p.z, pose);
    ecrire(pose, { ...PAPIER_PANNEAU, texte: TITRES[id], lignes: 3, fond: P.papier, encre: '#2a2420' });
    monde.cercle(p.x, p.z, 0.75);
  }

  // ---------------------------------------------------------------- Les lanternes du chemin, les jardins, les clôtures
  {
    const a = atelier();
    for (const [x, z] of [[19, -45], [8, -29.5], [5.4, -16], [-2.2, 4], [5.4, 22], [5.4, 40], [16.6, 56.5], [-12, -27.3], [-25, -30.3]]) {
      lanterne(a, x, z);
      monde.cercle(x, z, 0.38);
    }
    // les potagers : des rangs de terre sombre, des choux, des aubergines sur leurs tuteurs, une clôture de bambou
    for (const [x0, x1, z0, z1] of [[-14, -6, -30.5, -27.8], [30, 38, 18.5, 22], [12, 18, 40, 44.5], [-27, -20, 34, 38]]) {
      for (let x = x0 + 0.4; x < x1; x += 0.8) {
        for (let z = z0 + 0.4; z < z1; z += 0.55) {
          const t = hasard(x * 7.1, z * 3.3), y = terrain(x, z);
          if (t < 0.6) a.boule(0.17 + t * 0.06, t < 0.3 ? '#7fb85a' : '#5f9e48', { x, y: y + 0.12, z, sy: 0.7 }, 1);
          else a.baton([x, y, z], [x, y + 0.6, z], 0.012, '#c9b48a', 4, { trait: false }).boule(0.14, '#4f8a3a', { x, y: y + 0.4, z, sy: 0.9 }, 0).ovale(0.05, '#5a2a6a', { x: x + 0.08, y: y + 0.3, z, sy: 1.7 }, 6);
        }
      }
      for (const [xa, za, xb, zb] of [[x0, z0, x1, z0], [x0, z1, x1, z1], [x0, z0, x0, z1], [x1, z0, x1, z1]]) {
        const l = Math.hypot(xb - xa, zb - za);
        for (let t = 0; t <= l; t += 0.9) { const x = xa + ((xb - xa) * t) / l, z = za + ((zb - za) * t) / l; a.cylindre(0.025, 0.025, 0.7, 5, '#c9b48a', { x, y: terrain(x, z) + 0.35, z }); }
        a.baton([xa, terrain(xa, za) + 0.55, za], [xb, terrain(xb, zb) + 0.55, zb], 0.018, '#b8a070', 4);
        monde.mur(xa, za, xb, zb, 0.2);
      }
    }
    // les séchoirs à riz (hasagi) : des perches de bois sur des pieux, près des rizières
    for (const [x, z, ry] of [[-1, -60, 0], [24, -2, PI / 2], [-15, 47, 0], [49, 28, PI / 2]]) {
      const c = Math.cos(ry), s = -Math.sin(ry);
      for (let k = -2; k <= 2; k++) { const px = x + c * k * 1.4, pz = z + s * k * 1.4; a.cylindre(0.05, 0.05, 2.0, 5, '#8a6a48', { x: px, y: terrain(px, pz) + 1.0, z: pz }); }
      for (const h of [0.8, 1.35, 1.85]) a.baton([x - c * 2.9, terrain(x, z) + h, z - s * 2.9], [x + c * 2.9, terrain(x, z) + h, z + s * 2.9], 0.025, '#9a7a52', 5);
      monde.mur(x - c * 2.9, z - s * 2.9, x + c * 2.9, z + s * 2.9, 0.2);
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }

  // ---------------------------------------------------------------- La végétation
  const buissons = [];
  // les cerisiers du village (les houppiers tombent l'hiver ; au printemps, en fleurs : le calendrier magique), des
  // érables, des kakis (plaqueminiers) ; les cèdres et la forêt de la montagne, tout autour ; des hortensias le long des
  // chemins
  {
    const a = atelier();
    /**
     * Un feuillu de la sorte s (houppier, houppierErable, houppierCerisier) : depuis le 2026-10-24, le feuillu touffu de
     * l'atelier (un tronc qui s'affine et s'évase, trois maîtresses branches, huit touffes bosselées, ombrées dessous ;
     * avant : un bâton, deux branches et six boules à facettes), ses branches et rameaux pour l'hiver.
     */
    const feuillu = (x, z, h, s, verts) => {
      const y = terrain(x, z), graine = hasard(x * 0.61 + 1.7, z * 0.47 - 3.3);
      a.arbreTouffu(x, z, h, verts, { y, bas: y - 0.12, sorte: s, graine, caduc: true, tronc: P.tronc });
      return y;
    };
    for (const [x, z, h, sorte] of [[-3, -42, 7, 'c'], [30, -40, 6.5, 'c'], [-36, -32, 7, 'c'], [16, -16, 6, 'e'], [-6, 26, 6.5, 'c'], [26, 62, 7, 'c'], [-20, 64, 6, 'e'], [42, 8, 6, 'k'], [-30, 30, 5.5, 'k'], [-48, 26, 6.5, 'c'], [38, -48, 5.5, 'e'], [52, 20, 6, 'c'], [-12, 6, 5, 'e']]) {
      const s = { c: 'houppierCerisier', e: 'houppierErable', k: 'houppier' }[sorte];
      const y = feuillu(x, z, h, s, sorte === 'e' ? ['#6fa84a', '#5f9a40'] : [P.feuillage, P.herbeFonce, '#6aa34a']);
      // (les kakis, déjà orange, au bout des branches du plaqueminier)
      if (sorte === 'k') for (let k = 0; k < 9; k++) a.boule(0.09, '#e8822a', { x: x + Math.sin(k * 2.4) * h * 0.27, y: y + h * (0.58 + 0.1 * Math.sin(k * 1.7)), z: z + Math.cos(k * 2.4) * h * 0.27 }, 0);
      monde.cercle(x, z, 0.42);
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }
  {
    const a = atelier();
    for (const [x0, z0, x1, z1] of [[-12, -21, 1, -15.5], [8, 36, 7, 30], [-26, 41, -12, 41.5], [20, -36, 24, -44]]) {
      const n = Math.round(Math.hypot(x1 - x0, z1 - z0) / 1.3);
      for (let k = 0; k <= n; k++) {
        const x = x0 + ((x1 - x0) * k) / n, z = z0 + ((z1 - z0) * k) / n, r = 0.5 + hasard(x, z) * 0.25;
        a.buisson(x, terrain(x, z) + 0.3, z, r, P.herbeFonce, { touffu: true });
        buissons.push([x, z, r]);
      }
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }
  // la forêt de la montagne : des cèdres serrés (sombres, toute l'année) et des feuillus (houppiers : ils jaunissent et
  // tombent), en dehors du village, plus serrés près de lui ; sur la berge, une forêt persistante ; la berge d'en
  // face, plus loin. Les troncs partent sous le sol le plus bas autour d'eux (sur la pente, ils flottaient côté
  // aval), les cèdres ont un pied évasé ; chaque arbre est noté pour assombrir le sol sous lui (ARBRES_SOL)
  // (2026-10-24) la forêt et la lisière en morceaux : huit secteurs autour du village, et l'anneau lointain (au-delà de
  // 130 m) en quatre autres (moins de morceaux : moins d'appels de dessin) ; la caméra ne dessine que les morceaux qu'elle voit (avant : trois grands blocs de 230 000,
  // 100 000 et 26 000 triangles, dessinés en entier, même derrière elle), et l'anneau lointain n'a pas de trait d'encre
  // (là-bas, il ne faisait plus qu'un pixel). C'est ce qui paie les arbres plus détaillés près du village.
  const FORET = new Map();
  const foret = (x, z) => {
    const s8 = Math.floor(((Math.atan2(x, z) + PI) / (2 * PI)) * 8) % 8, k = Math.hypot(x, z) > 130 ? 8 + (s8 >> 1) : s8;
    if (!FORET.has(k)) FORET.set(k, atelier());
    return FORET.get(k);
  };
  {
    ARBRES_SOL.clear();
    const tire = (() => { let s = 1185; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();
    /** Le sol le plus bas sous un tronc de rayon r (son centre, et quatre points autour). */
    const pied = (x, z, r) => Math.min(terrain(x, z), terrain(x + r, z), terrain(x - r, z), terrain(x, z + r), terrain(x, z - r));
    // pres : près du village (à moins de 40 m de là où l'on marche) : un sugi (haut, étroit, cinq étages dentelés) ou
    // un feuillu touffu ; plus loin, les trois cônes et les trois boules d'avant
    const cedre = (x, z, h, loin, rot, pres = false) => {
      const a = foret(x, z), y = terrain(x, z), rb = 0.22 + h * 0.016, bas = pied(x, z, rb + 0.15) - 0.25, haut = y + h * 0.27;
      if (pres) a.sugi(x, z, h, { y, bas, rot, rTronc: rb, vert: P.cedre, vertFonce: P.cedreFonce, tronc: '#5e4030' });
      else {
        a.cylindre(0.15 + h * 0.012, rb, haut - bas, 5, '#5a4030', { x, y: (haut + bas) / 2, z });
        if (!loin) a.cylindre(rb * 1.02, rb * 1.7, 0.55, 5, '#4e3828', { x, y: Math.max(bas + 0.27, y - 0.12), z, ry: 0.6 });
        for (const [rr, hh, k] of [[0.24, 0.42, 0.42], [0.18, 0.36, 0.64], [0.11, 0.3, 0.86]]) a.cone(h * rr, h * hh, loin ? 6 : 8, k > 0.5 ? P.cedre : P.cedreFonce, { x, y: y + h * k - h * hh * 0.25, z, ry: rot + k, sorte: 'conifere' });
      }
      noterArbre(x, z, 1.4 + h * 0.09);
    };
    const feuillu = (x, z, h, loin, couleurs, avecRamure, pres = false) => {
      const a = foret(x, z), y = terrain(x, z), bas = pied(x, z, 0.035 * h + 0.1) - 0.25, g = hasard(x * 0.7, z * 0.9);
      if (pres) a.arbreTouffu(x, z, h, couleurs, { y, bas, sorte: 'houppier', graine: g, caduc: avecRamure, tronc: '#7a5a40', large: 1.1 });
      else {
        const touffes = [[0, 0.72, 0, 0.38], [-0.24, 0.6, 0.1, 0.28], [0.24, 0.62, -0.08, 0.28]].map(([dx, dy, dz, rr]) => [x + dx * h, y + dy * h, z + dz * h, rr * h]);
        a.baton([x, bas, z], [x + 0.1, y + h * 0.5, z], 0.035 * h, '#7a5a40', 5);
        touffes.forEach(([tx, ty, tz, rr], k) => a.houppe(rr, couleurs[k % couleurs.length], { x: tx, y: ty, z: tz, sy: 0.85, sorte: 'houppier', graine: g }, loin ? 0 : 1));
        if (avecRamure) a.ramure([x + 0.1, y + h * 0.48, z], touffes, h * 0.75, '#7a5a40');
      }
      noterArbre(x, z, 0.33 * h);
    };
    /** Pas d'arbre : là où l'on marche, l'escalier, le belvédère et sa vue, le sanctuaire, la route, le ruisseau. */
    const sansArbre = (x, z, y) => {
      if (dansLeCadre(x, z)) return true;
      if ((versEscalier(x, z)?.d ?? 99) < 3.2 || Math.hypot(x - BELVEDERE.x, z - BELVEDERE.z) < BELVEDERE.r + 3) return true;
      if (x > SANCTUAIRE.x0 - 2 && x < SANCTUAIRE.x1 + 2 && z > SANCTUAIRE.z0 - 2 && z < SANCTUAIRE.z1 + 2) return true;
      { const [lx, d] = versTunnel(x, z); if (d > -26 && d < 11 && Math.abs(lx) < 13) return true; }
      if (versRuisseau(x, z, 2.4)) return true;
      // (le belvédère garde sa vue : pas d'arbre entre lui et le village)
      return surLaLigne([[BELVEDERE.x, BELVEDERE.z], [0, 0]], x, z).d < 12 && Math.hypot(x, z) > 40 && y < Y_BELVEDERE + 6;
    };
    for (let i = 0; i < 2600; i++) {
      const x = -260 + tire() * 520, z = -260 + tire() * 500;
      const r = Math.hypot(x, z), a = angle(x, z), rT = rayonTerrasse(a), riv = versRiviere(x, z), y = terrain(x, z);
      if (r < rT + 3 || riv.d < 13 || sansArbre(x, z, y)) continue;
      const loin = r > 150, d = Math.min(1, (r - rT) / 60);
      if (riv.dedans && riv.d < 40) {
        if (surLaLigne([[VUE_SUD.x, VUE_SUD.z], [VUE_SUD.x + 30, VUE_SUD.z + 26]], x, z).d < 14) continue;
        // la berge, du côté du village : une forêt persistante (les houppiers serrés des pentes), assez bas pour ne
        // flotter nulle part au-dessus de la pente
        const rr = 1.6 + tire() * 1.4, bas = pied(x, z, rr * 0.7);
        foret(x, z).houppe(rr, tire() < 0.5 ? P.jungleFonce : P.feuillage, { x, y: Math.min(y + rr * 0.3, bas + rr * 0.42), z, sy: 0.8, sorte: 'persistant' }, loin ? 0 : 1);
        noterArbre(x, z, rr * 1.1);
        continue;
      }
      const pres = r < rT + 40;
      if (tire() < 0.62 - 0.2 * d) cedre(x, z, 9 + tire() * 9, loin, tire() * 3, pres);
      else {
        const h = 6 + tire() * 5, c = [0, 1, 2].map(() => [P.feuillage, P.jungle, P.herbeFonce][Math.floor(tire() * 3)]);
        feuillu(x, z, h, loin, c, !loin && r < 140, pres);
      }
    }
    // près du village, sur 30 m au-delà de la lisière, la forêt est serrée : des cèdres surtout (les plantations de
    // sugi des montagnes), des feuillus
    for (let gx = -108; gx <= 108; gx += 4.3) {
      for (let gz = -108; gz <= 108; gz += 4.3) {
        const x = gx + (hasard(gx * 0.71, gz * 1.31) - 0.5) * 3.6, z = gz + (hasard(gz * 0.67, gx * 1.13) - 0.5) * 3.6;
        const r = Math.hypot(x, z), rT = rayonTerrasse(angle(x, z)), riv = versRiviere(x, z), y = terrain(x, z);
        if (r < rT + 3.4 || r > rT + 30 || riv.d < 30 || sansArbre(x, z, y)) continue;
        const t = hasard(x * 1.7, z * 2.3);
        if (t < 0.12) continue;
        if (t < 0.74) cedre(x, z, 8 + 9 * hasard(z, x), false, t * 20, true);
        else feuillu(x, z, 5 + 5 * hasard(z * 0.3, x), false, [P.feuillage, P.jungle, P.herbeFonce], r < rT + 14, true);
      }
    }
    // la berge d'en face, que tout le village voit : une forêt serrée sur 40 m au-dessus de la rivière (des cèdres, de
    // grands houppiers persistants, des feuillus), pas des arbres épars sur une pente nue
    for (let gx = -200; gx <= 200; gx += 6) {
      for (let gz = -200; gz <= 200; gz += 6) {
        const x = gx + (hasard(gx * 0.53, gz * 1.07) - 0.5) * 5, z = gz + (hasard(gz * 0.61, gx * 0.97) - 0.5) * 5;
        const r = Math.hypot(x, z), riv = versRiviere(x, z);
        if (riv.dedans || riv.d < 13 || riv.d > 55 || r > 185) continue;
        const y = terrain(x, z), t = hasard(x * 1.3, z * 0.7), loin = r > 140;
        if (y < RIVIERE_Y + 1.5) continue;
        if (t < 0.55) cedre(x, z, 9 + 8 * hasard(z, x), loin, t * 30);
        else if (t < 0.86) {
          // (un chêne persistant : son tronc, un grand houppier rond et un plus petit à côté)
          const rr = 2.0 + 1.1 * hasard(z * 0.7, x), bas = pied(x, z, 0.4) - 0.25, hc = y + rr * 1.15, c = t < 0.7 ? P.jungleFonce : P.feuillage;
          foret(x, z).baton([x, bas, z], [x, hc, z], 0.14 + rr * 0.03, '#6a4e36', 5)
            .houppe(rr, c, { x, y: hc, z, sy: 0.82, sorte: 'persistant', graine: t }, loin ? 0 : 1)
            .houppe(rr * 0.68, c, { x: x + rr * 0.55, y: hc - rr * 0.3, z: z + rr * 0.25, sy: 0.82, sorte: 'persistant', graine: t }, loin ? 0 : 1);
          noterArbre(x, z, rr * 1.1);
        } else feuillu(x, z, 6 + 4 * hasard(z, x), loin, [P.feuillage, P.jungle, P.herbeFonce], false);
      }
    }
  }

  // ---------------------------------------------------------------- Le décor lointain : les Alpes du Nord enneigées
  {
    const a = atelier();
    for (const [x, z, r, h] of [[-900, -1400, 520, 520], [-200, -1600, 480, 600], [500, -1450, 520, 560], [1300, -1100, 600, 500], [1600, -300, 520, 460], [-1500, -800, 600, 480], [-1600, 200, 520, 420], [900, 1400, 560, 420], [-500, 1500, 520, 400]]) {
      a.piece(new THREE.ConeGeometry(r, h, 24, 4), P.montagneLoin, { x, y: h / 2 - 60, z, nuance: 0.05, trait: false, deformer: (px, py, pz) => [px * (1 + 0.12 * Math.sin(Math.atan2(px, pz) * 5)), py, pz] })
        .piece(new THREE.ConeGeometry(r * 0.32, h * 0.32, 24, 2), '#f2f4f6', { x, y: h - 60 - h * 0.16 + 2, z, trait: false, nuance: 0.02, deformer: (px, py, pz) => [px * (1 + 0.15 * Math.sin(Math.atan2(px, pz) * 7)), py - (py < 0 ? 12 * (0.5 + 0.5 * Math.sin(Math.atan2(px, pz) * 9)) : 0), pz] });
    }
    poser(a.fin(0, false), 0, 0, { y: 0, ombre: false });
  }
  {
    const a = atelier();
    for (const [x, y, z, s] of [[-500, 260, -820, 46], [-120, 300, -900, 60], [260, 250, -760, 40], [620, 300, -880, 55], [-820, 240, -700, 42], [80, 320, 700, 50], [-420, 280, 760, 46], [760, 270, 300, 50]]) {
      for (const [dx, dy, dz, r] of [[0, 0, 0, 1], [1.2, -0.25, 0.1, 0.75], [-1.1, -0.3, 0, 0.7], [0.5, 0.45, 0, 0.6], [-0.4, 0.3, 0.2, 0.55]]) {
        a.boule(r * s, P.nuage, { x: x + dx * s, y: y + dy * s, z: z + dz * s, sy: 0.7 }, 1);
      }
    }
    poser(a.fin(0, false), 0, 0, { y: 0, ombre: false });
  }

  // ---------------------------------------------------------------- Le secret : la planche, la fosse, le coffre
  const secret = (() => {
    const Mu = MAISON.musee, X = Mu.x, Z = Mu.z, Y = Mu.y, PL = PLANCHE;
    const objet = new THREE.Group();
    // la planche : à part, elle pivote sur son bord ouest ; dessous, le coffre laqué noir et sa corde rouge, et le koban
    const planche = new THREE.Group();
    planche.position.set(X + PL.x0, Y + PL.y - 0.04, Z + PL.z);
    {
      const t = atelier();
      for (let k = 0; k < 3; k++) t.boite(PL.l - 0.02, 0.08, PL.p / 3 - 0.012, k % 2 ? P.bois : P.bois2, { x: PL.l / 2, z: -PL.p / 2 + (k + 0.5) * (PL.p / 3) });
      for (const x of [0.2, PL.l - 0.2]) t.boite(0.08, 0.05, PL.p - 0.06, P.boisFonce, { x, y: -0.065 });
      planche.add(ctx.maillage(t.fin(0, false)));
    }
    const coffre = new THREE.Group();
    coffre.position.set(X + FOSSE.x, Y + FOSSE.y, Z + FOSSE.z);
    const couvercle = new THREE.Group();
    couvercle.position.set(0, 0.2, -0.15);
    couvercle.add(ctx.maillage(atelier().boite(0.54, 0.06, 0.32, '#1e1a1a', { y: 0.03, z: 0.15 }).boite(0.56, 0.02, 0.04, '#c8302c', { y: 0.065, z: 0.15, trait: false }).fin(0, false)));
    const koban = ctx.maillage(atelier().ovale(0.04, '#f2c84f', { sy: 0.15, sz: 1.4 }, 10).fin(0, false));
    koban.position.set(0.14, 0.17, 0.02);
    {
      // (le coffre laqué noir, ses coins de laiton, la cordelette rouge nouée, l'étoffe rouge pliée dedans)
      const t = atelier().boite(0.52, 0.2, 0.3, '#1e1a1a', { y: 0.1 }).boite(0.54, 0.02, 0.32, '#d8302c', { y: 0.12, trait: false })
        .boite(0.42, 0.03, 0.22, '#c8302c', { x: -0.04, y: 0.19, trait: false }).boite(0.14, 0.02, 0.16, '#efe4c8', { x: 0.14, y: 0.205, trait: false });
      for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) t.boite(0.05, 0.21, 0.05, '#c8a03a', { x: dx * 0.245, y: 0.1, z: dz * 0.135, trait: false });
      coffre.add(ctx.maillage(t.fin(0, false)), couvercle, koban);
    }
    objet.add(planche, coffre);
    let ouverture = 0, enMouvement = false, couv = 0;
    if (secretTrouve('heike')) { ouverture = 1; couv = 1; koban.visible = false; }
    const yCoffre = Y + FOSSE.y;
    return {
      objet,
      soulever() { enMouvement = true; },
      ouvrirCoffre() { enMouvement = true; couv = 0.001; },
      prendreKoban() { koban.visible = false; },
      maj(dt) {
        if (enMouvement) {
          ouverture = Math.min(1, ouverture + dt / 0.9);
          if (couv > 0) couv = Math.min(1, couv + dt / 0.8);
          if (ouverture >= 1 && (couv === 0 || couv >= 1)) enMouvement = false;
        }
        planche.rotation.z = (ouverture * ouverture * (3 - 2 * ouverture)) * 1.75;
        // (le coffre remonte à moitié hors de la fosse, puis son couvercle s'ouvre)
        const monte = Math.min(1, couv * 1.6), ouvre = Math.max(0, couv * 1.6 - 0.6);
        coffre.position.y = yCoffre + 0.64 * monte * monte * (3 - 2 * monte);
        couvercle.rotation.x = -1.8 * Math.min(1, ouvre) ** 2;
        koban.rotation.y += dt * 1.2;
      },
    };
  })();
  animes.push({ objet: secret.objet, maj: (dt) => { secret.maj(dt); return []; } });
  // la planche qui sonne creux : quand on marche dessus, « toc… » ; la première fois, le compagnon le remarque
  {
    const Mu = MAISON.musee, PL = PLANCHE, dessus = { avant: false };
    animes.push({
      objet: new THREE.Group(),
      maj(dt, temps, c) {
        const j = c.joueur, lx = j.x - Mu.x, lz = j.z - Mu.z;
        const ici = lx > PL.x0 - 0.08 && lx < PL.x1 + 0.08 && lz > PL.z0 - 0.1 && lz < PL.z1 + 0.1 && Math.abs(j.y - (Mu.y + PL.y)) < 0.3;
        if (ici && !dessus.avant && !secretTrouve('heike')) {
          c.scene(async (jeu) => {
            jeu.son('creux');
            if (jeu.indiceVu('plancher-creux')) return;
            await jeu.attendre(500);
            jeu.son('creux');
            await jeu.dire(jeu.tx('creux'));
            await jeu.dire(jeu.tx('creuxCompagnon')[jeu.compagnon], 'compagnon');
            jeu.voirIndice('plancher-creux');
          });
        }
        dessus.avant = ici;
        return [];
      },
    });
  }

  // ---------------------------------------------------------------- Les gens
  const PEAU = P.peau, NOIR = '#2a2420', Mi = MAISON.minshuku, Mu = MAISON.musee;
  const MiD = Mi.dedans, B4 = MAISON.g4, BD = B4.dedans;
  // (le rectangle d'une maison : ceux qui sont dedans se cachent quand on est loin dehors)
  const dansMaison = (m) => [m.x - m.w2, m.x + m.w2, m.z - m.l2, m.z + m.l2];
  const passants = [
    { id: 'vendeuse', x: B4.x + (BD.COMPTOIR.x0 + BD.COMPTOIR.x1) / 2, z: B4.z + BD.COMPTOIR.z0 - 0.55, cap: 0, dedans: dansMaison(B4), tenue: { taille: 0.96, peau: '#f2c9a8', cheveux: '#3a2a22', coiffure: 'chignon', chapeau: { sorte: 'foulard', c: '#f3efe4' }, haut: '#8a3a3a', manches: 'longues', tablier: '#f6efe0', bas: { sorte: 'pantalon', c: '#3a3a42' }, chaussures: '#3a3236', semelle: '#3a3236' } },
    { id: 'cuisinier', x: B4.x + BD.FOURNEAU.x + 1.0, z: B4.z + BD.FOURNEAU.z - 0.1, cap: -PI / 2, dedans: dansMaison(B4), tenue: { taille: 1.04, peau: '#e8bf98', cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'bandeau', c: '#2f4a7a' }, haut: '#f4f0e6', manches: 'longues', tablier: '#2f4a7a', bas: { sorte: 'pantalon', c: '#3a3a42' }, chaussures: '#3a3236', semelle: '#3a3236' } },
    { id: 'touriste', x: B4.x + BD.TABLE.x - 0.3, z: B4.z + BD.TABLE.z - 0.62, cap: 0, assis: B4.y + BD.yD + 0.455, dedans: dansMaison(B4), tenue: { taille: 1.0, peau: PEAU, cheveux: '#c8a46a', coiffure: 'queue', haut: '#5a8a6a', manches: 'courtes', bas: { sorte: 'pantalon', c: '#3d5a8f' }, chaussures: P.blanc, semelle: '#3a3236', sac: { sorte: 'dos', c: '#f2bd45', c2: '#99673f' } } },
    { id: 'grandpere', x: B4.x + BD.BASSE.x, z: B4.z + BD.BASSE.z - 0.62, cap: 0, dedans: dansMaison(B4), tenue: { taille: 0.95, peau: '#e8bf98', cheveux: '#e8e4dc', coiffure: 'chauve', haut: '#6a5a4a', manches: 'kimono', col: '#3a2c22', bas: { sorte: 'hakama', c: '#4a4a40' }, chaussures: '#f4f0e6', semelle: '#c9b48a', pose: 'seiza', yeux: 'plisses' } },
    { id: 'aruji', x: Mi.x + MiD.IR.x + 1.05, z: Mi.z + MiD.IR.z, cap: -PI / 2, dedans: dansMaison(Mi), tenue: { taille: 1.0, peau: '#e8bf98', cheveux: '#5a5650', coiffure: 'court', chapeau: { sorte: 'bandeau', c: '#f3efe4' }, haut: '#4a5a6a', manches: 'kimono', col: '#2f3a4a', bas: { sorte: 'hakama', c: '#3a3a42' }, chaussures: '#f4f0e6', semelle: '#c9b48a', pose: 'seiza', yeux: 'plisses' } },
    { id: 'invitee', x: Mi.x + MiD.IR.x, z: Mi.z + MiD.IR.z - 1.05, cap: 0, dedans: dansMaison(Mi), tenue: { taille: 0.98, peau: '#f2c9a8', cheveux: '#6a4030', coiffure: 'queue', haut: '#e8e2d4', manches: 'kimono', col: '#3f5a8a', bas: { sorte: 'jupe', c: '#3f5a8a' }, chaussures: '#f4f0e6', semelle: '#c9b48a', pose: 'seiza' } },
    { id: 'okami', x: Mi.x + Mi.sP * (Mi.w2 + 1.3), z: Mi.z + 1.3, cap: Mi.sP > 0 ? PI / 2 : -PI / 2, tenue: { taille: 0.98, peau: '#f2c9a8', cheveux: '#3a2a22', coiffure: 'chignon', haut: '#3f5a8a', manches: 'kimono', col: '#f3efe4', tablier: '#f6efe0', bas: { sorte: 'jupe', c: '#3f5a8a' }, chaussures: '#c9a06a', semelle: '#5a3a2a', yeux: 'plisses' } },
    { id: 'grandmere', x: WASHI.x - 0.4, z: WASHI.z + 0.25, cap: PI, tenue: { taille: 0.94, peau: '#f0c8a6', cheveux: '#e2ded6', coiffure: 'chignon', chapeau: { sorte: 'foulard', c: '#f2efe6' }, haut: '#7a8f6a', manches: 'longues', tablier: '#e8e0cc', bas: { sorte: 'pantalon', c: '#4a4a56' }, chaussures: '#3a3236', semelle: '#3a3236', yeux: 'plisses' } },
    { id: 'danseur', x: K.x + 0.6, z: K.z, cap: 0, tenue: { taille: 1.04, peau: PEAU, cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'eboshi', c: '#1e1c1c' }, haut: '#e6dcc4', manches: 'kimono', col: '#c8302c', bas: { sorte: 'hakama', c: '#3a4a7a', c2: '#2f3d68' }, chaussures: '#f4f0e6', semelle: '#c9b48a', instrument: 'sasara', pose: 'kokiriko' } },
    { id: 'musicien', x: K.x - 1.4, z: K.z + 0.4, cap: 0.3, tenue: { taille: 1.0, peau: '#ecc49c', cheveux: '#5a5650', coiffure: 'court', haut: '#2f4a7a', manches: 'kimono', col: '#f3efe4', bas: { sorte: 'hakama', c: '#4a3a2a' }, chaussures: '#f4f0e6', semelle: '#c9b48a', instrument: 'kokiriko', pose: 'jouer' } },
    { id: 'pompier', x: CASERNE.x - 1.8, z: CASERNE.z + 2.0, cap: PI - 0.4, tenue: { taille: 1.08, peau: PEAU, cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'casquette', c: '#2f3a5a', c2: '#c8302c' }, haut: '#2f3a5a', manches: 'longues', bas: { sorte: 'pantalon', c: '#2f3a5a' }, chaussures: '#2a2a2e', semelle: '#2a2a2e' } },
    { id: 'paysan', x: 7.2, z: -7.4, cap: 0, ronde: [[7.2, -7.4], [22.8, -7.4], [23.4, 3.8], [7.2, 4.0]], vitesse: 0.8, attente: [3, 7], tenue: { taille: 1.0, peau: '#e8bf98', cheveux: '#d8d4cc', coiffure: 'court', chapeau: { sorte: 'sugegasa', c: '#d9bd78', c2: '#c9a65a' }, haut: '#5a6a5a', manches: 'longues', mino: true, bas: { sorte: 'pantalon', c: '#4a4a40' }, chaussures: '#c9a65a', semelle: '#8a6a3a', yeux: 'plisses' } },
    { id: 'guide', x: Mu.x - 1.0 + 1.15, z: Mu.z - 2.15 + 1.25, cap: -2.4, dedans: dansMaison(Mu), tenue: { taille: 1.02, peau: '#f2c9a8', cheveux: '#4a3428', coiffure: 'queue', haut: '#a8452e', manches: 'longues', tablier: '#3a3a42', bas: { sorte: 'pantalon', c: '#3a3a42' }, chaussures: '#3a3236', semelle: '#3a3236' } },
    { id: 'enfant', x: 9, z: 26, cap: 0, ronde: [[9, 26], [9, 40], [26, 40], [28, 24]], vitesse: 1.6, attente: [0.5, 2.5], tenue: { taille: 0.8, peau: PEAU, cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'casquette', c: '#f2c443', c2: '#3a8a5a' }, haut: '#ffffff', manches: 'courtes', bas: { sorte: 'short', c: '#3d5a8f' }, chaussures: P.blanc, semelle: '#3a3236', canne: true } },
    { id: 'photographe', x: BELVEDERE.x + Math.sin(vers(BELVEDERE.x, BELVEDERE.z, 0, 0) - 1.3) * 2.3, z: BELVEDERE.z + Math.cos(vers(BELVEDERE.x, BELVEDERE.z, 0, 0) - 1.3) * 2.3, cap: vers(BELVEDERE.x, BELVEDERE.z, 0, 0) - 0.5, tenue: { taille: 1.06, peau: PEAU, cheveux: '#6a4030', coiffure: 'queue', chapeau: { sorte: 'bob', c: '#c9b48a' }, haut: '#4a7a9a', manches: 'longues', bas: { sorte: 'pantalon', c: '#4a4a56' }, chaussures: '#7a5a3a', semelle: '#3a3236', sac: { sorte: 'dos', c: '#c84a3a', c2: '#7a2a20' }, appareil: true } },
    { id: 'gardien', x: xS + 5.5, z: zS + 4.6, cap: PI / 2, tenue: { taille: 0.98, peau: '#e8bf98', cheveux: '#e8e4dc', coiffure: 'chauve', haut: '#f3efe4', manches: 'kimono', col: '#f3efe4', bas: { sorte: 'hakama', c: '#5a8a6a' }, chaussures: '#f4f0e6', semelle: '#c9b48a', pose: 'balai', yeux: 'plisses' } },
    { id: 'videaste', x: VUE_SUD.x - 1.2, z: VUE_SUD.z - 0.8, cap: vers(VUE_SUD.x, VUE_SUD.z, 60, 95), tenue: { taille: 1.1, peau: PEAU, cheveux: '#3a2a20', coiffure: 'court', chapeau: { sorte: 'bob', c: '#2f3440' }, haut: '#2f3440', manches: 'courtes', bas: { sorte: 'pantalon', c: '#c9b48a' }, chaussures: P.blanc, semelle: '#3a3236', appareil: true } },
  ];
  // le trépied du vidéaste, qui filme le méandre de la rivière
  {
    const cap = vers(VUE_SUD.x, VUE_SUD.z, 60, 95), a = trepied(atelier());
    poser(a.fin(0, peinture), VUE_SUD.x + 0.8, VUE_SUD.z + 0.3, { y: terrain(VUE_SUD.x + 0.8, VUE_SUD.z + 0.3) + 1.3, ry: cap });
    monde.cercle(VUE_SUD.x + 0.8, VUE_SUD.z + 0.3, 0.45);
    // le banc de la vue sur le méandre
    const b = atelier(), bx = VUE_SUD.x + 2.6, bz = VUE_SUD.z - 2.2, ry = cap, c = Math.cos(ry), s = -Math.sin(ry), y = terrain(bx, bz);
    b.boite(2.0, 0.08, 0.45, P.bois, { x: bx, y: y + 0.45, z: bz, ry });
    for (const k of [-1, 1]) b.boite(0.1, 0.45, 0.4, '#5a4436', { x: bx + k * c * 0.8, y: y + 0.22, z: bz + k * s * 0.8, ry });
    bancs.push({ de: [bx - c * 0.8, bz - s * 0.8], a: [bx + c * 0.8, bz + s * 0.8], y: y + 0.49, cap: ry, vue: 0.25 });
    monde.mur(bx - c * 1.0, bz - s * 1.0, bx + c * 1.0, bz + s * 1.0, 0.3);
    poser(b.fin(0, peinture), 0, 0, { y: 0 });
  }
  // le cercle de chaque buisson (pas sur un chemin ni sur une ronde)
  const lignes = [...CHEMINS, [ESC.A, ESC.E], ...passants.filter((p) => p.ronde).map((p) => [...p.ronde, p.ronde[0]])];
  for (const [x, z, r] of buissons) if (lignes.every((l) => surLaLigne(l, x, z).d > r + 1.4)) monde.cercle(x, z, r + 0.15);

  // ---------------------------------------------------------------- La lisière
  // Là où l'on ne peut plus avancer (sauf en haut de la gorge, où le sol tombe) : un ourlet de sous-bois, le bambou nain
  // (kumazasa) des montagnes du Japon, des arbustes, des fougères, de jeunes cèdres. Le bord se voit : ce n'est plus un
  // mur invisible au milieu de l'herbe
  {
    const X0 = -110, Z0 = -110, NX = 221, NZ = 215, ok = new Uint8Array(NX * NZ);
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) ok[j * NX + i] = dansLeCadre(X0 + i, Z0 + j) ? 1 : 0;
    /** La distance (en mètres, jusqu'à 3) de la case i, j à la plus proche case où l'on peut aller. */
    const versLibre = (i, j) => {
      let d = 9;
      for (let dj = -3; dj <= 3; dj++) {
        for (let di = -3; di <= 3; di++) {
          const ii = i + di, jj = j + dj;
          if (ii >= 0 && jj >= 0 && ii < NX && jj < NZ && ok[jj * NX + ii]) d = Math.min(d, Math.hypot(di, dj));
        }
      }
      return d;
    };
    const proche = (x, z, marge) => monde.cercles.some(([cx, cz, cr]) => Math.hypot(cx - x, cz - z) < cr + marge);
    // les feuilles (deux faces, sans trait), à part : une seule pièce par morceau de la forêt, à la fin
    const lots = new Map();
    const VERTS = ['#5c9140', '#6aa14a', '#78ad54', '#55873a'];
    const feuille = (de, dir, L, W, leve, tombe, c) => {
      const [dx, dz] = dir, mid = [de[0] + dx * L * 0.45, de[1] + leve, de[2] + dz * L * 0.45], bout = [de[0] + dx * L, de[1] + tombe, de[2] + dz * L];
      const g = [mid[0] - (dz * W) / 2, mid[1], mid[2] + (dx * W) / 2], d = [mid[0] + (dz * W) / 2, mid[1], mid[2] - (dx * W) / 2];
      const a = foret(de[0], de[2]);
      if (!lots.has(a)) lots.set(a, { feuilles: [], teintes: [] });
      const l = lots.get(a);
      l.feuilles.push(de, g, bout, de, bout, d, de, bout, g, de, d, bout);
      l.teintes.push(c, c, c, c);
    };
    // une touffe de kumazasa : un dôme de feuillage sombre, et tout autour des tiges qui en sortent, chacune avec un
    // éventail de longues feuilles qui retombent
    const sasa = (x, z, R, H) => {
      const sous = foret(x, z), y = terrain(x, z), graine = hasard(x * 0.3, z * 0.9);
      sous.boule(R * 0.95, '#4f8238', { x, y: y + H * 0.22, z, sy: (H * 0.62) / R, sorte: 'conifere', graine }, 1);
      const n = 9 + Math.floor(hasard(x, z, 3) * 4);
      for (let k = 0; k < n; k++) {
        const a0 = (k / n) * 2 * PI + hasard(x + k * 1.3, z - k) * 0.6, rb = R * (0.55 + 0.35 * hasard(z + k * 1.7, x));
        const top = [x + Math.cos(a0) * rb, y + H * (0.5 + 0.42 * hasard(x, k, z)), z + Math.sin(a0) * rb];
        const nf = 3 + (k % 2);
        for (let f = 0; f < nf; f++) {
          const af = a0 + (f - (nf - 1) / 2) * 0.85 + (hasard(k, f, x) - 0.5) * 0.5;
          feuille(top, [Math.cos(af), Math.sin(af)], 0.26 + 0.12 * hasard(f, k, z), 0.075, 0.05 + 0.04 * hasard(z, f, k), -0.08 - 0.1 * hasard(f, z, k), VERTS[Math.floor(hasard(k * 3.1, f, x) * VERTS.length)]);
        }
      }
    };
    // une fougère : une rosette de frondes qui se courbent
    const fougere = (x, z, R) => {
      const y = terrain(x, z), n = 6 + Math.floor(hasard(z, x, 5) * 3);
      for (let k = 0; k < n; k++) {
        const a0 = (k / n) * 2 * PI + hasard(x, k) * 0.5, dx = Math.cos(a0), dz = Math.sin(a0);
        const de = [x + dx * 0.05, y + 0.02, z + dz * 0.05], mi = [x + dx * R * 0.5, y + R * 0.55, z + dz * R * 0.5];
        feuille(de, [dx, dz], R * 0.6, 0.16 * R, R * 0.42, R * 0.5, '#6fae4e');
        feuille(mi, [dx, dz], R * 0.6, 0.14 * R, 0.04, -R * 0.3, '#7cbb5a');
      }
    };
    const arbuste = (x, z, R) => {
      const sous = foret(x, z), y = terrain(x, z), graine = hasard(x * 1.1, z * 0.4), c = hasard(z, x) < 0.5 ? '#4f8a40' : '#5e9646';
      sous.baton([x, y - 0.2, z], [x, y + R * 0.6, z], 0.05, '#6a4e36', 4, { trait: false })
        .houppe(R, c, { x, y: y + R * 1.05, z, sy: 0.85, sorte: 'persistant', graine }, 1)
        .houppe(R * 0.7, c, { x: x + R * 0.55, y: y + R * 0.7, z: z - R * 0.3, sy: 0.85, sorte: 'persistant', graine }, 1);
    };
    // (un jeune sugi : les étages dentelés du grand, depuis le 2026-10-24)
    const jeuneCedre = (x, z, h) => {
      const y = terrain(x, z);
      foret(x, z).sugi(x, z, h, { y, bas: y - 0.15, rTronc: 0.06, rot: x + z, vert: P.cedre, vertFonce: P.cedreFonce, tronc: '#5a4030' });
    };
    let n = 0;
    for (let j = 0; j < NZ; j++) {
      for (let i = 0; i < NX; i++) {
        if (ok[j * NX + i]) continue;
        const dl = versLibre(i, j);
        if (dl > 3.2) continue;
        const gx = X0 + i, gz = Z0 + j;
        const x = gx + (hasard(gx * 1.37, gz * 0.73) - 0.5) * 0.8, z = gz + (hasard(gz * 1.19, gx * 0.91) - 0.5) * 0.8;
        if (versRiviere(x, z).d < 25 || versRuisseau(x, z, 2.8)) continue;
        { const e = versEscalier(x, z); if (e && e.d < 2.4) continue; }
        if (Math.hypot(x - BELVEDERE.x, z - BELVEDERE.z) < BELVEDERE.r + 2.5) continue;
        { const [lx, d] = versTunnel(x, z); if (d > -26 && d < 11 && Math.abs(lx) < 13) continue; }
        if (CHEMINS.some((c) => surLaLigne(c, x, z).d < 1.8) || proche(x, z, 0.45)) continue;
        const t = hasard(x * 0.37, z * 0.53), u = hasard(z * 0.41, x * 0.29);
        if (dl < 2.3) {
          if (t < 0.62) sasa(x, z, 0.55 + 0.3 * u, 0.75 + 0.3 * hasard(x, z));
          else if (t < 0.72) fougere(x, z, 0.55 + 0.25 * u);
          else continue;
        } else if (t < 0.2) arbuste(x, z, 0.55 + 0.35 * u);
        else if (t < 0.34) jeuneCedre(x, z, 1.6 + 1.6 * u);
        else if (t < 0.48) fougere(x, z, 0.55 + 0.25 * u);
        else if (t < 0.72) sasa(x, z, 0.55 + 0.3 * u, 0.75 + 0.3 * hasard(x, z));
        else continue;
        n++;
      }
    }
    for (const [a, { feuilles, teintes }] of lots) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(feuilles.flat(), 3));
      a.piece(g, '#6aa14a', { couleurs: teintes, trait: false, nuance: 0.06, sorte: 'conifere' });
    }
  }
  // les morceaux de la forêt et de la lisière ; l'anneau lointain (8 à 11) sans trait d'encre
  for (const [k, a] of FORET) poser(a.fin(0, peinture), 0, 0, { y: 0, ombre: false, trait: k < 8 });

  // ---------------------------------------------------------------- Ce qu'on peut faire (tout passe par `jeu`)
  const parler = (id) => ({ id, passant: id, verbe: 'parler', action: (jeu) => jeu.dire(jeu.txn(id), id) });
  const xIr = Mu.x + Mu.IR.x, zIr = Mu.z + Mu.IR.z;
  // l'échelle du grenier : le chemin du voyageur, du bas (debout devant) jusqu'au plancher du haut (il en sort de côté)
  const GR = Mu.grenier, enMu = (x, y, z) => [Mu.x + x, Mu.y + y, Mu.z + z];
  const ECHELLE = [
    enMu(GR.ECH.x, SOL_MUSEE, GR.ECH.z + 0.6), enMu(GR.ECH.x - 0.02, SOL_MUSEE + 0.9, GR.ECH.z + 0.4), enMu(GR.ECH.x - 0.05, Mu.murH - 0.5, GR.ECH.z + 0.15),
    enMu(GR.ECH.x - 0.08, Mu.murH + 0.3, GR.ECH.z - 0.1), enMu(-2.15, Mu.murH + 0.1, -6.05), enMu(-1.9, Mu.murH, -6.1),
  ];
  let grenierVu = false;
  const interactions = [
    {
      // l'hôtesse du minshuku : elle fait tomber la nuit (on dort au minshuku), et, la nuit, revenir le matin
      id: 'okami', passant: 'okami', verbe: 'parler',
      async action(jeu) {
        if (jeu.estNuit) {
          const r = await jeu.choisir(jeu.tx('okamiMatin'), [jeu.t('oui'), jeu.t('non')], 'okami');
          if (r !== 0) { await jeu.dire(jeu.tx('okamiReste'), 'okami'); return; }
          await jeu.nuit(false);
          await jeu.dire(jeu.tx('okamiJour'), 'okami');
          return;
        }
        const r = await jeu.choisir(jeu.tx('okami'), [jeu.t('oui'), jeu.t('non')], 'okami');
        if (r !== 0) { await jeu.dire(jeu.tx('okamiNon'), 'okami'); return; }
        await jeu.nuit(true);
        await jeu.dire(jeu.tx('okamiNuit'), 'okami');
      },
    },
    {
      // la grand-mère du papier : on fait une feuille avec elle (le tampon)
      id: 'grandmere', passant: 'grandmere', verbe: 'parler',
      async action(jeu) {
        if (jeu.estNuit) { await jeu.dire(jeu.tx('grandmereNuit'), 'grandmere'); return; }
        if (jeu.aTampon('washi')) { await jeu.dire(jeu.tx('grandmere2'), 'grandmere'); return; }
        const r = await jeu.choisir(jeu.tx('grandmere'), [jeu.t('oui'), jeu.t('non')], 'grandmere');
        if (r !== 0) { await jeu.dire(jeu.tx('grandmereNon'), 'grandmere'); return; }
        // (le voyageur devant la cuve, à côté de la grand-mère, tourné vers elle : ses mains au-dessus de l'eau)
        const xc = WASHI.x - 0.4, zc = WASHI.z - 0.6;
        jeu.placer(WASHI.x + 0.42, WASHI.z + 0.42, PI);
        jeu.cadrerDeCote(xc, yW + 0.7, zc, { distance: 3.6, haut: 1.5 });
        await jeu.dire(jeu.tx('washiDebut'));
        jeu.geste('washi');
        for (let k = 0; k < 3; k++) { jeu.son('papier'); await jeu.attendre(1000); }
        jeu.geste(null);
        await jeu.dire(jeu.tx('washiFin'));
        jeu.cadrer(null);
        await jeu.tampon('washi');
      },
    },
    {
      // le danseur de la kokiriko : il explique la danse ; on danse avec lui (le tampon)
      id: 'danseur', passant: 'danseur', verbe: 'parler',
      async action(jeu) {
        if (jeu.aTampon('kokiriko')) { await jeu.dire(jeu.txn('danseur2'), 'danseur'); return; }
        const r = await jeu.choisir(jeu.txn('danseur'), [jeu.t('oui'), jeu.t('non')], 'danseur');
        if (r !== 0) { await jeu.dire(jeu.tx('danseurNon'), 'danseur'); return; }
        // (on monte sur l'estrade, à côté du danseur ; vu depuis le public, entre les deux lanternes)
        jeu.placer(K.x + 1.65, K.z + 0.25, 0, yK);
        jeu.cadrer({ de: [K.x + 1.1, yK + 1.45, K.z + 5.8], vers: [K.x + 1.05, yK + 0.85, K.z], champ: 50 });
        jeu.geste('kokiriko');
        await jeu.attendre(600);
        await jeu.dire(jeu.tx('danseurDanse'));
        await jeu.attendre(1800);
        jeu.geste(null);
        await jeu.dire(jeu.tx('danseurFin'), 'danseur');
        jeu.cadrer(null);
        await jeu.tampon('kokiriko');
      },
    },
    parler('musicien'),
    {
      // le pompier : l'essai des canons à eau, au-dessus des toits (le tampon) ; jamais la nuit
      id: 'pompier', passant: 'pompier', verbe: 'parler',
      async action(jeu) {
        if (jeu.estNuit) { await jeu.dire(jeu.tx('pompierNuit'), 'pompier'); return; }
        const r = await jeu.choisir(jeu.tx(jeu.aTampon('hosui') ? 'pompierEncore' : 'pompier'), [jeu.t('oui'), jeu.t('non')], 'pompier');
        if (r !== 0) { await jeu.dire(jeu.tx('pompierNon'), 'pompier'); return; }
        jeu.cadrer({ de: [12, niveau(12, -60) + 21, -60], vers: [-2, 1, 4], champ: 58 });
        await jeu.attendre(600);
        essai.jouer();
        jeu.son('jets');
        await jeu.attendre(2200);
        await jeu.dire(jeu.tx('pompierJets'));
        while (!essai.fini) await jeu.attendre(300);
        jeu.cadrer(null);
        await jeu.dire(jeu.tx('pompierFin'), 'pompier');
        if (!jeu.aTampon('hosui')) await jeu.tampon('hosui');
      },
    },
    parler('paysan'),
    parler('guide'),
    parler('enfant'),
    parler('photographe'),
    parler('gardien'),
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
      // le belvédère : la vue sur tout le village, d'en haut (le tampon)
      id: 'tenbo', x: BELVEDERE.x + Math.sin(vers(BELVEDERE.x, BELVEDERE.z, 0, 0)) * 2.4, z: BELVEDERE.z + Math.cos(vers(BELVEDERE.x, BELVEDERE.z, 0, 0)) * 2.4, y: Y_BELVEDERE + 0.14, rayon: 2.0, verbe: 'regarder',
      async action(jeu) {
        const v = vers(BELVEDERE.x, BELVEDERE.z, 0, 0);
        jeu.cadrer({ de: [BELVEDERE.x - Math.sin(v) * 0.6, Y_BELVEDERE + 2.6, BELVEDERE.z - Math.cos(v) * 0.6], vers: [4, 0, 10], champ: 50 });
        await jeu.attendre(700);
        await jeu.dire(jeu.txn('tenbo'));
        jeu.cadrer(null);
        if (!jeu.aTampon('tenbo')) await jeu.tampon('tenbo');
      },
    },
    {
      // prier au sanctuaire : la cloche, deux saluts, deux battements de mains, un salut (le tampon)
      id: 'jinja', x: xS + 2.3 + 0.85, z: zS, y: yS + 0.05, rayon: 1.8, verbe: 'prier',
      async action(jeu) {
        jeu.son('cloche');
        jeu.geste('prier');
        await jeu.attendre(2150); jeu.son('claque');
        await jeu.attendre(470); jeu.son('claque');
        await jeu.attendre(1900);
        jeu.geste(null);
        if (jeu.aTampon('jinja')) { await jeu.dire(jeu.txn('jinja2')); return; }
        await jeu.dire(jeu.txn('jinja'));
        await jeu.tampon('jinja');
      },
    },
    ...Object.entries(PANNEAUX).map(([id, p]) => ({ id: `panneau-${id}`, x: p.x, z: p.z, rayon: 1.8, verbe: 'lire', action: (jeu) => jeu.dire(jeu.tx(`panneau-${id}`)) })),
    {
      // s'asseoir près du foyer, dans la maison-musée (le compagnon aussi)
      id: 'irori', x: xIr + 1.05, z: zIr + 0.0, y: Mu.y + SOL_MUSEE, rayon: 1.25, haut: 1.0, verbe: 'asseoir',
      async action(jeu) {
        jeu.asseoir({ x: xIr + 1.05, z: zIr, y: Mu.y + SOL_MUSEE + 0.29, cap: -PI / 2, libre: true }, { lacet: PI / 2 + 0.5, tangage: 0.25, distance: 2.8 });
        await jeu.attendre(500);
        await jeu.dire(jeu.txn('irori'));
        await jeu.dire(jeu.txn('iroriCompagnon')[jeu.compagnon], 'compagnon');
      },
    },
    { id: 'ensho', x: Mu.x - Mu.w2 + 0.8, z: Mu.z - 4.4, y: Mu.y + SOL_MUSEE, rayon: 1.4, haut: 1.7, verbe: 'lire', action: (jeu) => jeu.dire(jeu.tx('ensho')) },
    { id: 'vitrine', x: Mu.x - 1.2, z: Mu.z - Mu.l2 + 1.0, y: Mu.y + SOL_MUSEE, rayon: 1.4, haut: 1.4, verbe: 'regarder', action: (jeu) => jeu.dire(jeu.tx('vitrine')) },
    { id: 'butsudan', x: Mu.x - 1.2, z: Mu.z + Mu.l2 - 1.3, y: Mu.y + SOL_MUSEE + 0.05, rayon: 1.3, haut: 1.4, verbe: 'regarder', action: (jeu) => jeu.dire(jeu.txn('butsudan')) },
    {
      // l'hôte du minshuku, au foyer : il fait goûter un omble grillé
      id: 'aruji', passant: 'aruji', verbe: 'parler',
      async action(jeu) {
        const r = await jeu.choisir(jeu.txn('aruji'), [jeu.t('oui'), jeu.t('non')], 'aruji');
        if (r !== 0) { await jeu.dire(jeu.tx('arujiNon'), 'aruji'); return; }
        jeu.saluer();
        await jeu.dire(jeu.tx('iwana'));
        await jeu.dire(jeu.tx('iwanaCompagnon')[jeu.compagnon], 'compagnon');
      },
    },
    parler('invitee'),
    {
      // les futons : une sieste jusqu'au soir, ou dormir jusqu'au matin
      id: 'futon', x: Mi.x + (MiD.FUTONS[0] + MiD.FUTONS[1]) / 2, z: Mi.z + MiD.ZF - 1.35, y: Mi.y + MiD.yT, rayon: 1.4, haut: 0.9, verbe: 'dormir',
      async action(jeu) {
        const nuit = jeu.estNuit, r = await jeu.choisir(jeu.tx(nuit ? 'futonNuit' : 'futon'), [jeu.t('oui'), jeu.t('non')]);
        if (r !== 0) return;
        await jeu.nuit(!nuit);
        await jeu.dire(jeu.tx(nuit ? 'futonMatin' : 'futonSoir'));
      },
    },
    { id: 'tokonoma', x: Mi.x + MiD.TOKO, z: Mi.z + Mi.l2 - 1.4, y: Mi.y + MiD.yT, rayon: 1.3, haut: 1.6, verbe: 'regarder', action: (jeu) => jeu.dire(jeu.tx('tokonoma')) },
    {
      // la vendeuse : le tofu ferme de Gokayama, à goûter (fermé la nuit)
      id: 'vendeuse', passant: 'vendeuse', verbe: 'parler',
      async action(jeu) {
        if (jeu.estNuit) { await jeu.dire(jeu.tx('vendeuseNuit'), 'vendeuse'); return; }
        const r = await jeu.choisir(jeu.tx('vendeuse'), [jeu.t('oui'), jeu.t('non')], 'vendeuse');
        if (r !== 0) { await jeu.dire(jeu.tx('vendeuseNon'), 'vendeuse'); return; }
        jeu.saluer();
        await jeu.dire(jeu.tx('tofu'));
        await jeu.dire(jeu.tx('tofuCompagnon')[jeu.compagnon], 'compagnon');
      },
    },
    parler('cuisinier'), parler('touriste'), parler('grandpere'),
    { id: 'menu', x: B4.x - 0.6, z: B4.z + B4.l2 - 1.1, y: B4.y + BD.yD + 0.02, rayon: 1.5, haut: 2.5, verbe: 'lire', action: (jeu) => jeu.dire(jeu.tx('menu')) },
    { id: 'manekineko', x: B4.x + BD.COMPTOIR.x1 - 0.3, z: B4.z + BD.COMPTOIR.z1 + 0.55, y: B4.y + BD.yD + 0.02, rayon: 1.0, haut: 1.5, verbe: 'toucher', action: (jeu) => jeu.dire(jeu.tx('manekineko')) },
    {
      // monter au grenier par l'échelle : la caméra là-haut, on voit le voyageur sortir de la trappe
      id: 'monter', x: Mu.x + GR.ECH.x, z: Mu.z + GR.ECH.z + 0.6, y: Mu.y + SOL_MUSEE, rayon: 1.2, haut: 1.7, verbe: 'monter',
      async action(jeu) {
        jeu.cadrer({ de: enMu(-0.6, Mu.murH + 1.75, -3.9), vers: enMu(-3.0, Mu.murH + 0.35, -6.0), champ: 62 });
        await jeu.grimper(ECHELLE, 2.6, PI);
        jeu.placer(Mu.x - 1.9, Mu.z - 6.1, PI / 2, Mu.y + Mu.murH);
        jeu.cadrer(null);
        if (!grenierVu) { grenierVu = true; await jeu.dire(jeu.tx('grenier')); }
      },
    },
    {
      id: 'descendre', x: Mu.x - 1.95, z: Mu.z - 6.1, y: Mu.y + Mu.murH, rayon: 1.3, haut: 1.3, verbe: 'descendre',
      async action(jeu) {
        jeu.cadrer({ de: enMu(-0.9, SOL_MUSEE + 1.7, -3.3), vers: enMu(-3.05, SOL_MUSEE + 1.9, -5.9), champ: 62 });
        await jeu.grimper([...ECHELLE].reverse(), 2.3, PI);
        jeu.placer(Mu.x + GR.ECH.x, Mu.z + GR.ECH.z + 0.6, 0, Mu.y + SOL_MUSEE);
        jeu.cadrer(null);
      },
    },
    {
      id: 'kaiko', x: Mu.x + 1.95, z: Mu.z + 0.2, y: Mu.y + Mu.murH, rayon: 1.5, haut: 1.6, verbe: 'regarder',
      async action(jeu) {
        await jeu.dire(jeu.tx('kaiko'));
        await jeu.dire(jeu.tx('kaikoCompagnon')[jeu.compagnon], 'compagnon');
      },
    },
    { id: 'zaguri', x: Mu.x + GR.DEVIDOIR[0] - 0.2, z: Mu.z + GR.DEVIDOIR[1] - 0.9, y: Mu.y + Mu.murH, rayon: 1.3, haut: 1.2, verbe: 'regarder', action: (jeu) => jeu.dire(jeu.tx('zaguri')) },
    {
      // soulever la planche qui sonne creux (seulement si on l'a entendue) : la fosse, le coffre, la bannière des Heike
      id: 'plancher', x: Mu.x + PLANCHE.x, z: Mu.z + PLANCHE.z, y: Mu.y + SOL_MUSEE, rayon: 1.3, haut: 0.6, verbe: 'soulever',
      si: (jeu) => jeu.indiceVu('plancher-creux') && !jeu.secretTrouve('heike'),
      async action(jeu) {
        // (le voyageur au nord de la planche, tourné vers elle ; la caméra au-dessus, côté sud : on voit la planche se
        // lever, la fosse, le coffre au fond)
        const px = Mu.x + PLANCHE.x, pz = Mu.z + PLANCHE.z, py = Mu.y + SOL_MUSEE;
        jeu.placer(px - 0.1, pz - 0.95, 0);
        jeu.cadrer({ de: [px + 0.25, py + 2.15, pz + 2.0], vers: [px, py - 0.45, pz - 0.15], champ: 55 });
        await jeu.dire(jeu.tx('soulever'));
        jeu.geste('creuser');
        await jeu.attendre(500);
        secret.soulever();
        jeu.son('creux');
        await jeu.attendre(900);
        jeu.geste(null);
        await jeu.dire(jeu.tx('fosse'));
        secret.ouvrirCoffre();
        jeu.son('boite');
        await jeu.attendre(900);
        await jeu.dire(jeu.tx('coffre'));
        jeu.image(banniere(), 'banniere-heike');
        await jeu.dire(jeu.tx('banniere'));
        jeu.image(billet(), 'billet-heike');
        await jeu.dire(jeu.tx('billet'));
        jeu.image(null);
        secret.prendreKoban();
        await jeu.trouverSecret('heike');
        jeu.cadrer(null);
      },
    },
    { id: 'fosse', x: Mu.x + PLANCHE.x, z: Mu.z + PLANCHE.z, y: Mu.y + SOL_MUSEE, rayon: 1.2, haut: 0.6, verbe: 'regarder', si: (jeu) => jeu.secretTrouve('heike'), action: (jeu) => jeu.dire(jeu.tx('fosseApres')) },
    ...interactionsBancs(bancs),
  ];
  // les bêtes : les regarder, caresser le chien
  const actionBete = async (jeu, b) => {
    if (b.sorte !== 'chien') { await jeu.dire(jeu.tx(b.sorte)); return; }
    await jeu.dire(jeu.txn('chien'));
    await jeu.dire(jeu.tx('chienCompagnon')[jeu.compagnon], 'compagnon');
  };

  // ---------------------------------------------------------------- Pour la caméra et les captures
  const depart = { x: DEPART.x, z: DEPART.z, cap: vers(DEPART.x, DEPART.z, 4, -20) };
  const heros = { x: BELVEDERE.x + 1.2, z: BELVEDERE.z + 1.2 };
  const capHeros = vers(heros.x, heros.z, 0, 0);
  return {
    ...infos, textes: TEXTES,
    objets, monde, terrain, etiquettes, passants, daims: [], interactions, actionDaim: null, vapeurs, bancs, lumieres, actionBete, animes,
    // (le secret, tresors.js ; le marchand, sous les cèdres du sanctuaire ; les sons à fabriquer en plus ; les feux
    // d'artifice, tirés au-dessus de la gorge de la rivière, à l'est)
    secret: 'heike', marchand: MARCHAND, sons: ['creux', 'jets', 'papier', 'cloche', 'claque', 'boite'],
    feux: { x: 95, y: 6, z: 8, large: 44, haut: [42, 64] },
    // la danse de la kokiriko : on l'entend en s'approchant (et la musique de la balade baisse)
    musiciens: { x: K.x, z: K.z, pres: 7, loin: 28, son: 'kokiriko' },
    // le ruisseau qu'on entend, les rizières où chantent les grenouilles, la nuit
    ruisseaux: [RUISSEAU], mares,
    // l'eau qui coule (le ruisseau et sa cascade) ; le sol plus fin le long du lit et autour des rizières (leurs
    // diguettes) ; les rizières, où l'on patauge (la surface de leur eau)
    courants, trouSol,
    solDetaille: (x0, z0, x1, z1) => {
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      if (versRuisseau(cx, cz, 2.1)) return true;
      const e = versEscalier(cx, cz);
      if (e && e.d < 2.0) return true;
      for (const [rx0, rx1, rz0, rz1] of RIZIERES) {
        const e = Math.max(Math.abs(cx - (rx0 + rx1) / 2) - (rx1 - rx0) / 2, Math.abs(cz - (rz0 + rz1) / 2) - (rz1 - rz0) / 2);
        if (e > -1.4 && e < 1.0) return true;
      }
      return false;
    },
    eauxCalmes,
    flaques: (x, z) => {
      for (const R of RIZIERES) if (x > R[0] + 0.5 && x < R[1] - 0.5 && z > R[2] + 0.5 && z < R[3] - 0.5) return fondRiziere(R) + 0.13;
      return null;
    },
    // les bêtes (betes.js) : deux hérons qui pêchent (chacun ses rizières), des rainettes sur les diguettes, des
    // libellules rouges au-dessus des rizières, le shiba du minshuku, des lucioles au bord du ruisseau
    betes: {
      herons: [[mares[2], mares[8], mares[6]], [mares[1], mares[3], mares[0]]],
      grenouilles: [[8.3, -2, 12, 0], [21.6, 1.5, 17, -1], [-31.6, -16, -26, -19], [-7.6, 32, -4, 34], [33.6, 30, 39, 30], [12.3, 34, 18, 31]].map(([x, z, ex, ez]) => ({ x, z, eau: [ex, ez] })),
      libellules: [[14, -1], [-4, 34], [40, 30], [-24, 54], [16, 30], [-26, -20]],
      chiens: [{ id: 'chien', x: Mi.x + Mi.sP * (Mi.w2 + 1.1), z: Mi.z - 1.6, cap: Mi.sP > 0 ? PI / 2 + 0.4 : -PI / 2 - 0.4 }],
      lucioles: [[-40, -12], [-10, -9], [20, -13], [40, -16], [0, -50], [-24, 54]],
    },
    aspectSol: (x, z, h) => aspectSol(P, x, z, h),
    centreRive: [0, 0], // les lignes d'eau suivent le méandre
    etendue: { x0: -420, x1: 420, z0: -420, z1: 420, pas: 4, fin: { x0: -110, x1: 110, z0: -110, z1: 104, pas: 1 } },
    eau: { x0: -420, x1: 420, z0: -420, z1: 420, niveau: RIVIERE_Y, son: 'riviere' },
    // une vallée abritée : peu de vent ; la bouscarle et le milan ; le héron ; la rivière en bas, le ruisseau, les
    // grenouilles et les insectes la nuit, la kokiriko
    vent: { dir: [0.35, 0.94], force: 0.75 }, oiseaux: ['uguisu', 'milan', 'aosagi'], ambiances: ['riviere', 'ruisseau', 'grenouilles', 'insectes', 'kokiriko'],
    brume: [110, 1700],
    // (2026-10-24) la brume posée au fond de la vallée, sur la rivière et au pied des forêts d'en face, d'où sortent les
    // montagnes ; les rais de soleil entre les cèdres du sanctuaire et autour du marchand (balade.js, creerRais)
    brumeVallee: { bas: RIVIERE_Y, haut: 32, force: 0.58, debut: 50 },
    rais: [[-50, -21], [-56.5, -33], [-49, -29.5], [-59, -22.5], [-50.5, -39.5], [-55.5, -40.5]].map(([x, z], i) => ({ x, z, haut: 10, r0: 0.35, r1: 1.2 + 0.3 * (i % 3), force: 0.075 })),
    soleil: [-0.45, 0.72, 0.52],
    depart,
    photos: {
      heros: { ...heros, cap: capHeros, lacet: capHeros + PI + 0.25, tangage: 0.35, distance: 6.5 },
      perso: { x: depart.x, z: depart.z, cap: depart.cap + PI, lacet: depart.cap + PI + 0.05, tangage: 0.1, distance: 3.9 },
    },
  };
}

// ---------------------------------------------------------------- Le secret : la bannière, le billet (SVG)
/**
 * La bannière des Heike : un long drapeau de soie rouge, passé, effiloché au bas, le papillon noir des Taira (l'ageha-
 * chō) au milieu, sa hampe de bambou ; l'inscription « 平家 » à l'encre.
 */
function banniere() {
  const aile = (s) => `<path d="M0 0 C${s * 40} -60 ${s * 95} -40 ${s * 80} 6 C${s * 70} 30 ${s * 30} 22 0 8 Z" fill="#1e1a1a"/>
    <path d="M0 10 C${s * 32} 22 ${s * 60} 60 ${s * 36} 78 C${s * 18} 84 ${s * 6} 50 0 22 Z" fill="#1e1a1a"/>
    <circle cx="${s * 52}" cy="-6" r="7" fill="#c8a24a"/><circle cx="${s * 30}" cy="44" r="5" fill="#c8a24a"/>`;
  return `<svg viewBox="0 0 400 420" class="banniere" aria-hidden="true">
    <rect width="400" height="420" fill="#f4ecd8"/>
    <rect x="96" y="14" width="10" height="400" rx="4" fill="#b8a070"/>
    <path d="M106 30 H316 V352 l-12 18 l-10 -14 l-14 22 l-12 -18 l-12 16 l-12 -20 l-14 20 l-12 -18 l-14 22 l-12 -20 l-14 18 l-12 -16 l-12 22 l-12 -18 l-10 14 L106 360 Z" fill="#b8322a"/>
    <path d="M106 30 H316 V352" fill="none" stroke="#8a2220" stroke-width="3"/>
    <rect x="106" y="30" width="210" height="8" fill="#8a2220"/>
    <g transform="translate(211 150)">${aile(1)}${aile(-1)}<ellipse cx="0" cy="18" rx="7" ry="30" fill="#1e1a1a"/><circle cy="-14" r="8" fill="#1e1a1a"/>
      <path d="M-3 -20 Q-14 -50 -24 -56 M3 -20 Q14 -50 24 -56" stroke="#1e1a1a" stroke-width="3" fill="none"/></g>
    <text x="211" y="300" font-size="46" font-weight="800" fill="#1e1a1a" text-anchor="middle" font-family="'M PLUS Rounded 1c', serif">平家</text>
    ${[[150, 90], [270, 250], [180, 330], [290, 60]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="16" fill="#c8504a" opacity="0.35"/>`).join('')}
  </svg>`;
}
/** Le billet plié dans le coffre : un vieux papier de Gokayama, écrit au pinceau en colonnes, un sceau rouge. */
function billet() {
  let colonnes = '';
  for (let c = 0; c < 8; c++) {
    let y = 40;
    const x = 330 - c * 38;
    while (y < 300) { const h = 12 + ((c * 7 + y) % 19); colonnes += `<path d="M${x} ${y} q3 ${h / 2} 0 ${h}" stroke="#2a2018" stroke-width="${3 + (y % 3)}" stroke-linecap="round" fill="none"/>`; y += h + 8; }
  }
  return `<svg viewBox="0 0 400 360" class="billet" aria-hidden="true">
    <rect width="400" height="360" fill="#efe4c8"/>
    ${Array.from({ length: 30 }, (_, k) => `<path d="M${(k * 53) % 400} 0 v360" stroke="#e0d2b0" stroke-width="1" opacity="0.6"/>`).join('')}
    ${colonnes}
    <rect x="40" y="250" width="56" height="56" fill="none" stroke="#c8302c" stroke-width="5"/><text x="68" y="290" font-size="26" font-weight="800" fill="#c8302c" text-anchor="middle" font-family="'M PLUS Rounded 1c', serif">塩</text>
    <text x="70" y="64" font-size="20" fill="#5a4a38" font-family="'M PLUS Rounded 1c', serif">文化三年</text>
  </svg>`;
}

/** Le mélange de deux couleurs « #rrggbb » (t : 0 à 1). */
function melanger(c1, c2, t) {
  const v = (c, i) => parseInt(c.slice(i, i + 2), 16);
  return '#' + [1, 3, 5].map((i) => Math.round(v(c1, i) * (1 - t) + v(c2, i) * t).toString(16).padStart(2, '0')).join('');
}
/** Le panneau rond « piétons interdits » : le disque blanc cerclé de rouge, le piéton noir qui marche, la barre rouge. */
function pietonInterdit(c, W, H) {
  const R = Math.min(W, H) / 2;
  c.translate(W / 2, H / 2);
  c.fillStyle = '#ffffff'; c.beginPath(); c.arc(0, 0, R * 0.98, 0, 2 * Math.PI); c.fill();
  c.lineWidth = R * 0.18; c.strokeStyle = '#d8302c'; c.beginPath(); c.arc(0, 0, R * 0.88, 0, 2 * Math.PI); c.stroke();
  c.fillStyle = '#1f2a44'; c.strokeStyle = '#1f2a44'; c.lineCap = 'round'; c.lineWidth = R * 0.11;
  c.beginPath(); c.arc(R * 0.04, -R * 0.42, R * 0.11, 0, 2 * Math.PI); c.fill();
  c.beginPath(); c.moveTo(R * 0.02, -R * 0.28); c.lineTo(-R * 0.06, R * 0.12); c.lineTo(-R * 0.26, R * 0.48);
  c.moveTo(-R * 0.06, R * 0.12); c.lineTo(R * 0.16, R * 0.48); c.moveTo(R * 0.0, -R * 0.18); c.lineTo(-R * 0.24, R * 0.02);
  c.moveTo(R * 0.0, -R * 0.18); c.lineTo(R * 0.26, R * 0.0); c.stroke();
  c.strokeStyle = '#d8302c'; c.lineWidth = R * 0.16; c.beginPath(); c.moveTo(-R * 0.62, -R * 0.62); c.lineTo(R * 0.62, R * 0.62); c.stroke();
}

/**
 * Un paysage peint sur un fusuma (k : sa place dans la suite : la ligne des montagnes continue d'un panneau à l'autre) :
 * des montagnes à l'encre dans la brume dorée ; la lune sur l'un, un pin sur un autre.
 */
function fusumaPeint(c, W, H, k) {
  c.fillStyle = '#efe6cf'; c.fillRect(0, 0, W, H);
  c.fillStyle = 'rgba(214, 180, 96, 0.32)';
  c.fillRect(0, H * 0.2, W, H * 0.07); c.fillRect(0, H * 0.66, W, H * 0.05);
  const ligne = (x, d) => H * (0.48 + d + 0.12 * Math.sin((x / W + k) * 2.1 + d * 9) + 0.05 * Math.sin((x / W + k) * 5.3 + 1));
  for (const [d, teinte] of [[0, 'rgba(110, 118, 112, 0.45)'], [0.16, 'rgba(70, 78, 74, 0.7)']]) {
    c.fillStyle = teinte;
    c.beginPath(); c.moveTo(0, H);
    for (let i = 0; i <= 24; i++) c.lineTo((i / 24) * W, ligne((i / 24) * W, d));
    c.lineTo(W, H); c.fill();
  }
  if (k === 1) { c.fillStyle = '#e8c45a'; c.beginPath(); c.arc(W * 0.6, H * 0.16, W * 0.13, 0, 2 * Math.PI); c.fill(); }
  if (k === 4) {
    c.strokeStyle = '#3a3226'; c.lineWidth = W * 0.035; c.lineCap = 'round';
    c.beginPath(); c.moveTo(W * 0.1, H * 0.95); c.quadraticCurveTo(W * 0.35, H * 0.55, W * 0.2, H * 0.32); c.stroke();
    c.fillStyle = 'rgba(52, 84, 58, 0.85)';
    for (const [x, y, r] of [[0.22, 0.3, 0.16], [0.42, 0.4, 0.13], [0.1, 0.45, 0.12], [0.3, 0.55, 0.1]]) { c.beginPath(); c.ellipse(W * x, H * y, W * r, W * r * 0.45, 0, 0, 2 * Math.PI); c.fill(); }
  }
}

/** Une affiche du village : le ciel, les montagnes, une maison gasshō sous la neige, « 五箇山 », le bandeau rouge. */
function affiche(c, W, H) {
  const ciel = c.createLinearGradient(0, 0, 0, H * 0.7);
  ciel.addColorStop(0, '#7fb6dc'); ciel.addColorStop(1, '#f2e8d2');
  c.fillStyle = ciel; c.fillRect(0, 0, W, H);
  c.fillStyle = '#4f7a5a';
  c.beginPath(); c.moveTo(0, H * 0.62); c.lineTo(W * 0.3, H * 0.38); c.lineTo(W * 0.62, H * 0.6); c.lineTo(W * 0.82, H * 0.44); c.lineTo(W, H * 0.56); c.lineTo(W, H * 0.8); c.lineTo(0, H * 0.8); c.fill();
  // la maison : le toit de chaume en A, la neige dessus, le mur blanc et ses fenêtres
  const mx = W * 0.5, base = H * 0.78;
  c.fillStyle = '#8a6a42';
  c.beginPath(); c.moveTo(mx, H * 0.36); c.lineTo(mx + W * 0.3, base - H * 0.08); c.lineTo(mx - W * 0.3, base - H * 0.08); c.fill();
  c.fillStyle = '#ffffff';
  c.beginPath(); c.moveTo(mx, H * 0.36); c.lineTo(mx + W * 0.14, H * 0.5); c.lineTo(mx + W * 0.06, H * 0.49); c.lineTo(mx, H * 0.52); c.lineTo(mx - W * 0.07, H * 0.49); c.lineTo(mx - W * 0.14, H * 0.5); c.fill();
  c.fillStyle = '#f4efe4'; c.fillRect(mx - W * 0.24, base - H * 0.08, W * 0.48, H * 0.08);
  c.fillStyle = '#5a4030';
  for (let k = 0; k < 4; k++) c.fillRect(mx - W * 0.2 + k * W * 0.11, base - H * 0.065, W * 0.06, H * 0.05);
  c.fillStyle = '#e8ece8'; c.fillRect(0, base, W, H * 0.04);
  // le titre, le bandeau
  c.fillStyle = '#2a2420'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = `800 ${Math.round(W * 0.26)}px "M PLUS Rounded 1c", sans-serif`;
  c.fillText('五箇山', W / 2, H * 0.14);
  c.font = `700 ${Math.round(W * 0.08)}px "M PLUS Rounded 1c", sans-serif`;
  c.fillText('GOKAYAMA', W / 2, H * 0.26);
  c.fillStyle = '#c8322c'; c.fillRect(0, H * 0.84, W, H * 0.16);
  c.fillStyle = '#ffffff';
  c.font = `800 ${Math.round(W * 0.11)}px "M PLUS Rounded 1c", sans-serif`;
  c.fillText('世界遺産', W / 2, H * 0.92);
}

// ---------------------------------------------------------------- Le sol
/** La couleur et le motif (styles.js) du sol : la gorge et la rivière, la forêt, le village, les chemins, les lieux. */
function aspectSol(P, x, z, h) {
  if (h < RIVIERE_Y + 0.8) return [P.rocheSombre, M.roche];
  const r = Math.hypot(x, z), a = angle(x, z), rT = rayonTerrasse(a), riv = versRiviere(x, z);
  const bruit = bruitDoux(x, z, 4);
  // la gorge : la roche près de l'eau, puis la forêt de la berge
  if (riv.d < 13) return [bruit > 0.5 ? P.paroi : P.rocheSombre, M.roche];
  if (riv.d < 23 && h < niveau(x, z) - 0.8) return [h < RIVIERE_Y + 4 || bruit > 0.78 ? P.paroi : P.jungleFonce, h < RIVIERE_Y + 4 ? M.roche : M.sousBois];
  // le parking, la route
  if (x > PARKING.x0 && x < PARKING.x1 && z > PARKING.z0 && z < PARKING.z1) return [P.route, M.route];
  if (x > 24 && x < 56 && z > -100 && z < -66) {
    const [lx, d] = versTunnel(x, z), a = Math.abs(lx);
    if (d < 1 && d > -24) {
      if (a < 4.2) return [P.route, M.route];
      if (a < 4.9) return [P.beton, M.pierre];
      // les talus (leur quadrillage de béton est posé dessus, en relief) : l'herbe
      if (h > routeY(d) + 0.3 && d > -18) return [bruit > 0.5 ? P.herbe : P.herbeFonce, M.herbe];
    }
  }
  // l'esplanade du sanctuaire : le gravier clair ; les dalles de l'allée
  const S = SANCTUAIRE;
  if (x > S.x0 && x < S.x1 + 0.4 && z > S.z0 && z < S.z1) return [Math.abs(z - S.marches[2]) < 0.9 ? P.pierre : P.terreClaire, Math.abs(z - S.marches[2]) < 0.9 ? M.dalles : M.terre];
  if (x > S.torii[0] - 1 && x < S.x1 && Math.abs(z - S.marches[2]) < 1.0) return [P.pierre, M.dalles];
  // l'escalier et le belvédère
  {
    const e = versEscalier(x, z);
    if (e && e.d < 1.25) return [P.pierre, M.pierre];
    if (Math.hypot(x - BELVEDERE.x, z - BELVEDERE.z) < BELVEDERE.r + 0.6) return [P.chemin, M.terre];
  }
  // le lit du ruisseau : des galets, sous l'eau ; sous les murets, la pierre
  {
    const ru = versRuisseau(x, z, 1.0);
    if (ru) return [ru.d < 0.62 ? (bruit > 0.5 ? P.pierreFonce : '#7d7466') : P.pierre, M.pierre];
  }
  // la montagne : la forêt, son sol de feuilles et de mousse, plus sombre sous les arbres (ARBRES_SOL)
  if (r > rT + 0.9 + 0.8 * bruitDoux(x + 7, z, 2) && !(riv.dedans && riv.d < 30) && !dansLeCadre(x, z)) {
    const o = ombreArbres(x, z), b2 = bruitDoux(x - 13, z + 29, 2.6);
    if (o > 0.55) return ['#3f5636', M.sousBois];
    if (o > 0.2) return ['#4b6539', M.sousBois];
    return [bruit > 0.62 ? '#66703f' : b2 > 0.5 ? '#557a3a' : '#5c7642', M.sousBois];
  }
  // les rizières : le fond (sous l'eau), la diguette d'herbe
  for (const [x0, x1, z0, z1] of RIZIERES) {
    const e = Math.max(Math.abs(x - (x0 + x1) / 2) - (x1 - x0) / 2, Math.abs(z - (z0 + z1) / 2) - (z1 - z0) / 2);
    if (e < -0.5) return [P.boue, M.terre];
    if (e < 0.15) return [P.herbeFonce, M.herbe];
  }
  // les chemins de terre
  for (const c of CHEMINS) if (surLaLigne(c, x, z).d < 1.15 + 0.2 * bruitDoux(x, z, 1.5)) return [P.chemin, M.terre];
  // sous le bord du toit, la rigole de galets gris où tombe l'eau du chaume (amadare : 2026-10-24) ; autour des maisons,
  // la terre battue, les galets
  for (const [id, mx, mz, W, L] of MAISONS) {
    const k = id.startsWith('k'), d = Math.max(Math.abs(x - mx) - W / 2 - (k ? 0.6 : 1.0), Math.abs(z - mz) - L / 2 - (k ? 0.6 : 1.1));
    if (d > -0.38 && d < 0.22 + 0.1 * bruitDoux(x * 3, z * 3, 1)) return [bruitDoux(x * 4, z * 4, 1) > 0.55 ? '#8f897e' : '#aaa497', M.terre];
  }
  for (const [, mx, mz, W, L] of MAISONS) {
    const e = Math.max(Math.abs(x - mx) - W / 2, Math.abs(z - mz) - L / 2);
    if (e < 1.2 + 0.5 * bruit) return [e < 0.6 ? P.cheminFonce : P.chemin, M.terre];
  }
  // l'herbe du village (des taches plus sombres), et la terre au pied de la montagne
  if (r > rT - 2) return [bruit > 0.45 ? P.herbeFonce : P.herbe, M.herbe];
  return bruit > 0.68 ? [P.herbeFonce, M.herbe] : [bruit > 0.3 ? P.herbe : '#92cc66', M.herbe];
}

// ---------------------------------------------------------------- Les textes du lieu
const TEXTES = {
  fr: {
    noms: { vendeuse: 'La vendeuse de tofu', cuisinier: 'Le cuisinier', touriste: 'La touriste', grandpere: 'Le grand-père', aruji: 'L’hôte du minshuku', invitee: 'La voyageuse', okami: 'L’hôtesse du minshuku', grandmere: 'La grand-mère du papier', danseur: 'Le danseur', musicien: 'Le musicien', pompier: 'Le pompier', paysan: 'Le paysan', guide: 'La guide du musée', enfant: 'L’écolier', photographe: 'La photographe', gardien: 'Le gardien du sanctuaire', videaste: '@random_japan_place' },
    tampons: {
      tenbo: ['Le belvédère', 'Tout le village, d’en haut'],
      jinja: ['Le sanctuaire', 'Sous les grands cèdres'],
      washi: ['Le papier de Gokayama', 'L’atelier au bord du ruisseau'],
      kokiriko: ['La kokiriko', 'Danser sur la petite scène'],
      hosui: ['Les canons à eau', 'Le local des pompiers'],
    },
    'panneau-bienvenue': ['« Gokayama 五箇山 »', 'Au fond des montagnes de Toyama, la rivière Shō entoure le village d’un grand méandre turquoise.', 'Avec Shirakawa-gō, ces villages de maisons au toit de chaume sont classés au patrimoine mondial depuis 1995.'],
    'panneau-gassho': ['« Les maisons gasshō-zukuri 合掌造り »', '« Gasshō » : les mains jointes en prière. Les grands toits de chaume, pentus à 60°, ressemblent à deux mains jointes.', 'La pente laisse glisser la neige : l’hiver, il en tombe jusqu’à deux mètres !', 'Tous les vingt ou trente ans, tout le village refait un toit ensemble, en un ou deux jours : c’est le « yui », l’entraide.'],
    'panneau-jinja': ['« Jinushi-jinja 地主神社 »', 'Le sanctuaire du dieu qui protège le village, sous les grands cèdres.', 'À l’automne, pour la fête, on y danse la kokiriko jusque tard dans la nuit.'],
    'panneau-kokiriko': ['« Kokiriko-bushi こきりこ節 »', 'On dit que c’est le plus vieux chant populaire du Japon.', 'Les danseurs font claquer la « sasara », une centaine de lamelles de bois enfilées en arc ; le musicien frappe les « kokiriko », deux baguettes de bambou.'],
    'panneau-washi': ['« Le papier de Gokayama 五箇山和紙 »', 'On le fait à la main depuis plus de 400 ans, avec l’écorce du mûrier à papier, le kōzo.', 'Il est si solide qu’on s’en sert pour réparer de vieux livres… et les portes des châteaux !'],
    'panneau-belvedere': ['« Vers le belvédère 展望台 »', 'Par le sentier, sur le flanc de la montagne : tout le village d’en haut, comme sur les cartes postales.'],
    'panneau-hosui': ['« Canons à eau 放水銃 »', 'Un toit de chaume brûle en quelques minutes. Dans chaque petite cabane au toit de paille, un canon à eau est prêt.', 'Une fois par an, on les essaie tous ensemble : l’eau jaillit au-dessus des maisons !'],
    'panneau-riviere': ['« La rivière Shō 庄川 »', 'Ses eaux turquoise entourent le village d’un grand méandre.', 'Autrefois, avant les routes, on traversait la gorge dans un panier suspendu à une corde !'],
    'panneau-musee': ['« Maison-musée 民俗館 »', 'Une vraie maison gasshō de plus de deux cents ans. Entre donc !', 'En bas, le foyer et la vie de tous les jours ; dans les étages, sous le chaume, on élevait les vers à soie.'],
    okami: ['Bienvenue au minshuku ! Ici, on dort dans une maison au toit de chaume, sur des futons.', 'Le soir, on mange autour du foyer : du poisson grillé, et le tofu de Gokayama, si ferme qu’on peut le porter attaché à une corde !', 'Tu veux passer la nuit chez nous ?'],
    okamiNon: ['D’accord ! La porte est toujours ouverte.'],
    okamiNuit: ['La nuit tombe sur le village…', 'Regarde : les fenêtres de papier s’allument une à une. On dirait des lanternes géantes.', 'Quand tu voudras voir le matin, reviens me voir.'],
    okamiMatin: ['Tu ne dors pas ? Les grenouilles chantent fort dans les rizières, ce soir.', 'On attend le matin ?'],
    okamiReste: ['Alors profite de la nuit ! Regarde bien au bord du ruisseau : il y a des lucioles.'],
    okamiJour: ['Bonjour ! Bien dormi ? Le petit-déjeuner est prêt : du riz, de la soupe miso et du tofu de Gokayama !'],
    grandmere: ['Bonjour, petit ! Ici, on fait le papier comme autrefois.', 'L’écorce du mûrier, cuite, battue, mêlée à l’eau : on la puise avec ce cadre.', 'Tu veux essayer de faire une feuille ?'],
    grandmereNon: ['Une autre fois ! Le papier attendra.'],
    grandmere2: ['Ta feuille sèche au soleil, sur la planche. Elle sera prête demain !', 'Le papier de Gokayama dure des centaines d’années, tu sais.'],
    grandmereNuit: ['Il fait nuit, l’atelier est fermé.', 'Le papier, on le fait au soleil, le matin, quand l’eau du ruisseau est la plus claire.'],
    washiDebut: ['Tu plonges le cadre dans l’eau laiteuse, puis tu le balances doucement…', 'D’avant en arrière, de gauche à droite : les fibres s’emmêlent et forment la feuille.'],
    washiFin: ['Tu soulèves le cadre : une feuille blanche, toute fine, presque transparente !', '« Bravo ! Maintenant, elle va sécher au soleil, sur la planche. »'],
    danseur: ['Yaa ! Tu entends ? C’est la kokiriko, le plus vieux chant du Japon, dit-on !', 'Je fais claquer la sasara : « jararan, jararan » !', 'Tu veux danser avec nous ?'],
    danseurNuit: ['Le soir, sous les lanternes, la kokiriko est encore plus belle.', 'Tu veux danser avec nous ?'],
    danseurNon: ['D’accord ! Reste écouter, alors.'],
    danseurDanse: ['Tu lèves les bras, tu les baisses, un pas de côté…', '« Kokiriko no take wa, shichisun gobu ja… » chante le musicien : « La baguette de la kokiriko mesure sept pouces et demi… »'],
    danseurFin: ['Bravo ! Tu as la kokiriko dans le sang !'],
    danseur2: ['Tu reviens danser ? Ici, la kokiriko ne s’arrête jamais !'],
    danseur2Nuit: ['La nuit, sous les lanternes, on danse jusqu’à ce que les grenouilles se taisent !'],
    musicien: ['Ces deux baguettes de bambou, ce sont les « kokiriko ». Elles ont donné leur nom à la chanson.', 'On les frappe l’une contre l’autre, en mesure : « kon, kon » !'],
    musicienNuit: ['Le soir, on joue doucement : les gens dorment dans les maisons.'],
    pompier: ['Bonjour ! Je suis pompier volontaire du village.', 'Un toit de chaume, ça brûle en quelques minutes. Alors, partout dans le village, il y a des canons à eau, cachés dans ces petites cabanes.', 'On fait justement un essai. Tu veux voir ?'],
    pompierEncore: ['Tu veux revoir l’essai des canons à eau ?'],
    pompierNon: ['D’accord ! Ils sont toujours prêts, au cas où.'],
    pompierJets: ['Les portes des cabanes s’ouvrent… et l’eau jaillit en grands arcs, par-dessus les toits !', 'Dans la bruine, au soleil, un arc-en-ciel apparaît !'],
    pompierFin: ['Et voilà ! Le village est protégé.', 'Une fois par an, on les essaie tous en même temps. Les gens viennent de loin pour voir ça !'],
    pompierNuit: ['La nuit, pas d’essai : on veille. Si un toit prend feu, on est prêts !'],
    paysan: ['Tu vois ce riz ? Ici, les rizières sont petites, taillées en terrasses au pied de la montagne.', 'À l’automne, on fait sécher les gerbes sur ces perches de bois, les « hasagi ».', 'Et mon mino ? C’est une cape de paille : contre la pluie et la neige, rien de mieux !'],
    paysanNuit: ['La nuit, les grenouilles chantent dans les rizières. Ça veut dire que le riz pousse bien !'],
    guide: ['Bienvenue dans la maison-musée ! Elle a plus de deux cents ans.', 'Le foyer, l’irori, chauffait toute la maison ; sa fumée montait dans le grenier et protégeait le chaume des insectes.', 'Autrefois, sous le plancher, près du foyer, les familles fabriquaient en secret le salpêtre de la poudre à canon, pour le seigneur de Kaga…', 'Monte donc au grenier par l’échelle, au fond : c’est là-haut qu’on élevait les vers à soie !'],
    grenier: ['Le grenier, sous le grand toit de chaume. Ça sent la paille et le bois fumé…', 'Regarde la charpente : de grandes poutres en A, comme deux mains jointes en prière. C’est pour ça qu’on dit « gasshō » !', 'Pas un seul clou : tout tient avec des cordes de paille.'],
    kaiko: ['Des claies de bambou, couvertes de feuilles de mûrier… et de petits cocons tout blancs.', 'Autrefois, on élevait ici les vers à soie. Ils mangeaient jour et nuit : on les entendait croquer, comme une pluie fine.', 'La chaleur du foyer montait jusqu’ici et les gardait au chaud.'],
    kaikoCompagnon: {
      kon: ['« Des cocons… On dirait de gros grains de riz ! »'],
      pon: ['« Ils ont l’air tout moelleux. Ça se mange ? … Non ? Dommage. »'],
      chapu: ['« Chut… Ils dorment dans leur cocon. Comme moi dans mon terrier ! »'],
      gao: ['« Je monte la garde près des vers à soie. Aucune souris ne passera ! »'],
      fuwa: ['« Leur soie brille presque autant que ma perle… »'],
      saya: ['« Des feuilles de mûrier… Elles viennent des arbres d’en bas. Merci, les arbres. »'],
    },
    zaguri: ['Un dévidoir à soie : on trempait les cocons dans l’eau chaude, puis on tirait leur fil, très fin, très long…', 'Un seul cocon donne plus d’un kilomètre de fil !'],
    aruji: ['Bienvenue, entre te réchauffer au foyer !', 'Ce sont des iwana, des ombles de la rivière, grillés au sel. Ils cuisent doucement, debout autour des braises.', 'Tu veux goûter ?'],
    arujiNuit: ['Le soir, tout le monde se retrouve autour du foyer.', 'Il reste des iwana grillés, bien chauds. Tu veux goûter ?'],
    arujiNon: ['Une autre fois ! Il y en aura encore demain.'],
    iwana: ['La peau croustille, la chair est tendre, et le sel de la queue pique un peu la langue…', 'C’est délicieux !'],
    iwanaCompagnon: {
      kon: ['« Un poisson grillé… Les renards adorent ça ! Merci beaucoup ! »'],
      pon: ['« Encore un ! Et encore un ! Pon pon, j’ai le ventre plein ! »'],
      chapu: ['« Un poisson de la rivière ! D’habitude, moi, je les attrape tout crus… »'],
      gao: ['« Je garde le foyer pendant que tu manges. Bon appétit ! »'],
      fuwa: ['« Un poisson… des montagnes ? Il ne ressemble pas à ceux de la mer ! »'],
      saya: ['« Il sent le feu de bois et la rivière. Ce village sait bien nourrir ses voyageurs. »'],
    },
    invitee: ['Bonjour ! Je viens de Tokyo, je dors ici deux nuits.', 'Hier soir, j’ai entendu la rivière toute la nuit… et ce matin, la brume couvrait les toits !', 'Dormir dans une maison de deux cents ans… je ne l’oublierai jamais.'],
    inviteeNuit: ['La nuit, sans voitures ni écrans, on entend tout : la rivière, les grenouilles, le feu qui craque…', 'Demain, je monte au belvédère voir le village au lever du soleil !'],
    futon: ['Deux futons tout moelleux, une couette, un oreiller rempli de son de sarrasin…', 'Faire une petite sieste jusqu’au soir ?'],
    futonNuit: ['Les futons t’attendent. Dormir jusqu’au matin ?'],
    futonSoir: ['Une petite sieste… À ton réveil, le soir est tombé sur le village.', 'Les fenêtres de papier s’allument une à une.'],
    futonMatin: ['Le matin ! Un rayon de soleil traverse le papier des fenêtres.', 'Ça sent la soupe miso et le riz chaud…'],
    tokonoma: ['L’alcôve, le « tokonoma » : un rouleau, une branche en fleurs.', 'Il est écrit « 一期一会 », « ichi-go ichi-e » : chaque rencontre est unique, elle n’arrivera qu’une fois. Alors on la chérit.'],
    vendeuse: ['Bienvenue ! Ici, c’est le tofu de Gokayama : si ferme qu’on peut le porter avec une corde, comme un paquet !', 'Autrefois, on le portait ainsi à travers les montagnes enneigées, sans qu’il se casse.', 'Tu veux goûter un morceau ?'],
    vendeuseNon: ['D’accord ! Reviens quand tu veux.'],
    vendeuseNuit: ['La boutique est fermée pour ce soir. Le tofu se fait au petit matin, avec l’eau froide de la montagne.', 'Reviens demain !'],
    tofu: ['Il est dense, presque comme du fromage, un peu salé… avec le goût du soja et de l’eau de source.', 'Délicieux !'],
    tofuCompagnon: {
      kon: ['« Du tofu ! Les renards d’Inari adorent le tofu frit… mais celui-là aussi ! »'],
      pon: ['« Un morceau, deux morceaux… on peut prendre toute la corde ? Pon pon ! »'],
      chapu: ['« Il est tout blanc, comme l’écume de la rivière ! »'],
      gao: ['« Solide comme un rempart ! Ce tofu me plaît. »'],
      fuwa: ['« Il a le goût de l’eau des montagnes… Ma perle aime ça. »'],
      saya: ['« Le soja a poussé dans les champs, l’eau vient de la forêt… Tout se retrouve ici. »'],
    },
    cuisinier: ['Les soba, je les fais à la main : de la farine de sarrasin, l’eau de la montagne, et le rouleau…', 'Puis je les coupe au couteau, très fines. Tchac, tchac, tchac !', 'Dans la marmite, elles cuisent en une minute. Pas plus !'],
    cuisinierNuit: ['La journée est finie : je nettoie la marmite et j’aiguise le couteau pour demain.'],
    touriste: ['Mmh… Ces soba sont incroyables ! Et le bouillon sent bon le poisson séché.', 'Je suis venue en car depuis Takaoka. Une heure de route dans les montagnes, et puis ce village…'],
    touristeNuit: ['Encore un bol de soba avant de dormir. Ici, je mangerais tous les jours !'],
    grandpere: ['Je bois mon thé ici tous les jours, depuis cinquante ans.', 'Quand j’étais petit, l’hiver, la neige montait jusqu’aux fenêtres du premier étage !', 'Les touristes viennent du monde entier, maintenant… Le village est content.'],
    grandpereNuit: ['Le soir, on entend la rivière Shō jusqu’ici. Elle chante depuis toujours.'],
    menu: ['Le menu, écrit à la main sur des planchettes :', '« Zaru soba » (soba froides) 800 yens, « kake soba » (soba chaudes) 700 yens, « tofu dengaku » (tofu grillé au miso) 500 yens, « iwana » grillé au sel 600 yens.'],
    manekineko: ['Un « maneki-neko », le chat qui salue de la patte : il attire les clients et la chance.', 'Tu lui caresses la tête… Il a l’air content !'],
    guideNuit: ['Le soir, toute la famille se réunissait autour du foyer pour se réchauffer et raconter des histoires.', 'On dit que certaines maisons cachent encore des secrets sous leur plancher…'],
    enfant: ['Je chasse les libellules rouges ! Les « akatombo ».', 'Tu sais quoi ? Mon grand-père dit qu’une planche du vieux musée « chante » quand on marche dessus, près du foyer…', 'Mais personne n’ose la soulever !'],
    enfantNuit: ['Il fait nuit, je dois rentrer… Oh, regarde, une luciole !'],
    photographe: ['D’ici, on voit tout le village : les toits de chaume, les rizières, la rivière turquoise.', 'Au printemps avec les cerisiers, et l’hiver sous la neige, c’est encore plus beau !'],
    photographeNuit: ['La nuit, les fenêtres des maisons brillent comme des lanternes. Une photo magique !'],
    gardien: ['Bonjour. Je balaie la cour du sanctuaire chaque matin.', 'On raconte qu’après leur défaite, en 1185, des guerriers Heike se sont enfuis jusqu’ici, au fond des montagnes.', 'Ils auraient caché leur bannière rouge quelque part dans le village… Mais où ?'],
    gardienNuit: ['Il est tard. Que les dieux te protègent sur la route.'],
    videaste: ['Salut ! Je filme les plus beaux lieux du Japon pour TikTok.', 'Mon compte, c’est @random_japan_place.', 'J’ai fait une vidéo de Gokayama. Tu veux la voir ?'],
    videasteNon: ['D’accord ! Elle est aussi sur la carte, avec tous les autres lieux.'],
    videasteApres: ['Ça t’a plu ? Abonne-toi pour voir les prochains lieux !'],
    tenbo: ['Tout le village, d’en haut : les grands toits de chaume serrés, les rizières, le petit sanctuaire sous les cèdres.', 'Et autour, la rivière Shō, toute turquoise, et les montagnes.'],
    tenboNuit: ['La nuit, le village brille : chaque fenêtre de papier est une lanterne.', 'Au-dessus des montagnes, les étoiles.'],
    jinja: ['Tu agites la cloche, deux saluts, deux battements de mains…', 'Tu fais un vœu pour la suite de ton voyage.'],
    jinjaNuit: ['Tu agites la cloche, deux saluts, deux battements de mains…', 'La grande lanterne de la fête éclaire doucement le sanctuaire.'],
    jinja2: ['Les grands cèdres murmurent dans le vent.'],
    jinja2Nuit: ['Dans le noir, la lanterne de la fête brille entre les cèdres.'],
    irori: ['Tu t’assois près du foyer. Les braises rougeoient, la bouilloire chante doucement.', 'Ça sent le bois et la fumée.'],
    iroriNuit: ['Le soir, près du foyer… Les braises éclairent les poutres noircies.', 'Dehors, les grenouilles chantent.'],
    iroriCompagnon: {
      kon: ['« Ah… Il fait bon. On se raconte des histoires de renards, au coin du feu ? »'],
      pon: ['« On pourrait faire griller des mochi sur les braises ! Pon pon ! »'],
      chapu: ['« La bouilloire fait des bulles ! C’est presque une petite rivière… »'],
      gao: ['« Je monte la garde près du feu. Personne n’entrera ! »'],
      fuwa: ['« Un dragon des mers près du feu… Ma perle est toute chaude ! »'],
      saya: ['« Ce bois a été un arbre, il y a longtemps… Il se souvient de la forêt. »'],
    },
    iroriCompagnonNuit: {
      kon: ['« Les braises brillent comme les yeux des renards dans la nuit… »'],
      pon: ['« Une soirée au coin du feu… Il ne manque que des châtaignes grillées ! »'],
      chapu: ['« Dehors, les grenouilles chantent… Moi aussi, je sais chanter ! Chapu chapu ! »'],
      gao: ['« Dors tranquille. Je veille sur le foyer. »'],
      fuwa: ['« La fumée monte jusqu’au toit… Comme les nuages autour de ma montagne. »'],
      saya: ['« Le feu craque doucement. Les vieux arbres aiment ce bruit-là. »'],
    },
    ensho: ['« 塩硝の里 : le village du salpêtre »', 'À l’époque d’Edo, Gokayama fabriquait en secret le salpêtre, pour la poudre à canon du seigneur de Kaga.', 'On le faisait dans une fosse, sous le plancher des maisons, près du foyer : de la terre, des herbes, de la paille… et des années de patience.', 'Les montagnes gardaient bien les secrets !'],
    butsudan: ['L’autel de la famille, le « butsudan » : laqué noir dehors, tout doré dedans.', 'On y honore les ancêtres : une bougie, un bâton d’encens, un coup de clochette… « tiiin ».'],
    butsudanNuit: ['À la lueur des bougies, l’or de l’autel brille doucement dans la nuit.', 'On y honore les ancêtres : une bougie, un bâton d’encens, un coup de clochette… « tiiin ».'],
    vitrine: ['Des objets d’autrefois : un mino et un chapeau de paille, des bottes de paille pour la neige…', '…la sasara et les baguettes de la kokiriko, et quelques feuilles de papier de Gokayama.'],
    creux: ['Toc… toc… Sous tes pieds, une planche sonne creux.', 'Comme s’il y avait un trou, là-dessous…'],
    creuxCompagnon: {
      kon: ['« Ce bruit… Il y a un creux sous cette planche. Mon flair ne me trompe jamais ! »'],
      pon: ['« Pon ? Ce plancher sonne comme mon ventre ! Il y a quelque chose dessous ! »'],
      chapu: ['« Ça sonne creux ! Comme sous les pierres de la rivière, là où se cachent les poissons ! »'],
      gao: ['« Gao ! Un gardien sent ces choses-là : quelque chose est caché ici. »'],
      fuwa: ['« Fuwa… Ma perle brille plus fort, juste au-dessus de cette planche ! »'],
      saya: ['« Le bois me parle… Sous cette planche, la terre garde un secret. »'],
    },
    soulever: ['Tu glisses tes doigts sous le bord de la planche… Elle bouge !'],
    fosse: ['Dessous, une fosse sombre : de la terre mêlée de paille et d’herbes sèches.', 'C’est une fosse à salpêtre ! On y fabriquait en secret la poudre à canon du seigneur de Kaga.', 'Et tout au fond… un petit coffre laqué noir, noué d’une cordelette rouge.'],
    coffre: ['Le couvercle se soulève…', 'Dedans, une étoffe rouge pliée, un vieux papier… et une pièce d’or !'],
    banniere: ['Une bannière de soie rouge, passée par les siècles, avec un papillon noir au milieu.', 'Le papillon des Taira : c’est une bannière des Heike !', 'Vaincus à la bataille de Dan-no-ura, en 1185, les derniers guerriers Heike se seraient cachés au fond de ces montagnes…'],
    billet: ['Un billet, écrit au pinceau, daté de « 文化三年 » : l’an 1806.', '« Cachée dans la fosse du salpêtre, là où personne ne regarde. Que la bannière de nos ancêtres reste à l’abri ; que le voyageur qui la trouve garde la pièce d’or, en souvenir. »'],
    fosseApres: ['La planche soulevée, la fosse à salpêtre, le coffre laqué.', 'Tu y as laissé la bannière, à l’abri, comme les gens d’autrefois.'],
    heron: ['Un héron cendré, immobile dans la rizière… Il guette les grenouilles et les petits poissons.', 'Doucement… S’il te voit, il s’envole !'],
    grenouille: ['Une rainette toute verte, sur la diguette.', 'Au Japon, grenouille se dit « kaeru », comme « revenir » : un porte-bonheur pour les voyageurs !'],
    libellule: ['Une libellule rouge, une « akatombo ». Au Japon, elle annonce la fin de l’été.', 'Il y a même une chanson d’enfants très connue sur elle !'],
    chien: ['Le shiba du minshuku remue sa queue en tire-bouchon.', 'Tu le caresses… Il ferme les yeux de bonheur !'],
    chienNuit: ['Le shiba dort, couché devant la porte. Chut…', 'Tu le caresses doucement. Sa queue bouge un peu.'],
    chienCompagnon: {
      kon: ['« Un shiba ! On est un peu cousins, lui et moi : même museau, même queue en panache ! »'],
      pon: ['« Pon ! Il est mignon… mais il a l’air de vouloir me courir après ! »'],
      chapu: ['« Un chien ! Tu crois qu’il aime nager, lui aussi ? »'],
      gao: ['« Gao ! Un collègue gardien ! Il surveille bien sa porte. »'],
      fuwa: ['« Il me regarde flotter avec de grands yeux ! »'],
      saya: ['« Il sent la forêt et le feu de bois. Un bon chien. »'],
    },
  },
  en: {
    noms: { vendeuse: 'Tofu seller', cuisinier: 'Cook', touriste: 'Tourist', grandpere: 'Grandpa', aruji: 'Inn host', invitee: 'Traveller', okami: 'Inn hostess', grandmere: 'Paper-making grandma', danseur: 'Dancer', musicien: 'Musician', pompier: 'Firefighter', paysan: 'Farmer', guide: 'Museum guide', enfant: 'Village boy', photographe: 'Photographer', gardien: 'Shrine keeper', videaste: '@random_japan_place' },
    tampons: {
      tenbo: ['The viewpoint', 'The whole village from above'],
      jinja: ['The shrine', 'Under the great cedars'],
      washi: ['Gokayama paper', 'The workshop by the stream'],
      kokiriko: ['The kokiriko', 'Dancing on the little stage'],
      hosui: ['The water cannons', 'The fire station'],
    },
    'panneau-bienvenue': ['“Gokayama 五箇山”', 'Deep in the mountains of Toyama, the Shō river wraps the village in a big turquoise bend.', 'Together with Shirakawa-gō, these villages of thatched houses have been a World Heritage Site since 1995.'],
    'panneau-gassho': ['“Gasshō-zukuri houses 合掌造り”', '“Gasshō” means hands joined in prayer. The great thatched roofs, sloping at 60°, look like two hands pressed together.', 'The steep slope lets the snow slide off: in winter, up to two metres fall here!', 'Every twenty or thirty years, the whole village rethatches a roof together, in a day or two: it is called “yui”, helping each other.'],
    'panneau-jinja': ['“Jinushi-jinja 地主神社”', 'The shrine of the god who protects the village, under the great cedars.', 'In autumn, for the festival, people dance the kokiriko here late into the night.'],
    'panneau-kokiriko': ['“Kokiriko-bushi こきりこ節”', 'It is said to be the oldest folk song in Japan.', 'The dancers clack the “sasara”, about a hundred wooden slats strung in an arc; the musician strikes the “kokiriko”, two bamboo sticks.'],
    'panneau-washi': ['“Gokayama paper 五箇山和紙”', 'It has been made by hand for over 400 years, from the bark of the paper mulberry, kōzo.', 'It is so strong that it is used to repair old books… and the doors of castles!'],
    'panneau-belvedere': ['“To the viewpoint 展望台”', 'Up the path on the mountainside: the whole village from above, just like on the postcards.'],
    'panneau-hosui': ['“Water cannons 放水銃”', 'A thatched roof burns in minutes. In every little straw-roofed hut, a water cannon stands ready.', 'Once a year, they are all tested together: water shoots high over the houses!'],
    'panneau-riviere': ['“The Shō river 庄川”', 'Its turquoise waters wrap the village in a great bend.', 'Long ago, before the roads, people crossed the gorge in a basket hanging from a rope!'],
    'panneau-musee': ['“Folk museum house 民俗館”', 'A real gasshō house, more than two hundred years old. Come on in!', 'Downstairs, the hearth and everyday life; upstairs, under the thatch, families raised silkworms.'],
    okami: ['Welcome to the minshuku! Here you sleep in a thatched house, on futons.', 'In the evening we eat around the hearth: grilled fish, and Gokayama tofu, so firm you can carry it tied with a rope!', 'Would you like to spend the night with us?'],
    okamiNon: ['All right! The door is always open.'],
    okamiNuit: ['Night is falling over the village…', 'Look: the paper windows light up one by one. Like giant lanterns.', 'When you want to see the morning, come and talk to me.'],
    okamiMatin: ['Can’t sleep? The frogs are singing loudly in the rice fields tonight.', 'Shall we wait for the morning?'],
    okamiReste: ['Then enjoy the night! Look closely along the stream: there are fireflies.'],
    okamiJour: ['Good morning! Did you sleep well? Breakfast is ready: rice, miso soup and Gokayama tofu!'],
    grandmere: ['Hello, little one! Here we make paper the old way.', 'Mulberry bark, boiled, beaten, mixed with water: we scoop it up with this frame.', 'Would you like to try making a sheet?'],
    grandmereNon: ['Another time! The paper can wait.'],
    grandmere2: ['Your sheet is drying in the sun, on the board. It will be ready tomorrow!', 'Gokayama paper lasts for hundreds of years, you know.'],
    grandmereNuit: ['It’s night, the workshop is closed.', 'We make paper in the sun, in the morning, when the stream water is clearest.'],
    washiDebut: ['You dip the frame into the milky water, then rock it gently…', 'Back and forth, side to side: the fibres tangle together and form the sheet.'],
    washiFin: ['You lift the frame: a white sheet, very thin, almost see-through!', '“Well done! Now it will dry in the sun, on the board.”'],
    danseur: ['Yaa! Can you hear it? That’s the kokiriko, the oldest song in Japan, they say!', 'I clack the sasara: “jararan, jararan”!', 'Want to dance with us?'],
    danseurNuit: ['In the evening, under the lanterns, the kokiriko is even more beautiful.', 'Want to dance with us?'],
    danseurNon: ['Okay! Stay and listen, then.'],
    danseurDanse: ['You raise your arms, lower them, take a step to the side…', '“Kokiriko no take wa, shichisun gobu ja…” sings the musician: “The kokiriko stick is seven and a half inches long…”'],
    danseurFin: ['Bravo! You’ve got the kokiriko in your blood!'],
    danseur2: ['Back to dance? Here the kokiriko never stops!'],
    danseur2Nuit: ['At night, under the lanterns, we dance until the frogs fall silent!'],
    musicien: ['These two bamboo sticks are the “kokiriko”. They gave the song its name.', 'You strike them together, in time: “kon, kon”!'],
    musicienNuit: ['In the evening we play softly: people are sleeping in the houses.'],
    pompier: ['Hello! I’m a volunteer firefighter here.', 'A thatched roof burns in minutes. So all over the village there are water cannons, hidden in these little huts.', 'We’re about to do a test. Want to see?'],
    pompierEncore: ['Want to see the water cannon test again?'],
    pompierNon: ['All right! They’re always ready, just in case.'],
    pompierJets: ['The hut doors swing open… and water shoots out in great arcs over the roofs!', 'In the sunlit spray, a rainbow appears!'],
    pompierFin: ['There! The village is safe.', 'Once a year we test them all at the same time. People come from far away to see it!'],
    pompierNuit: ['No test at night: we keep watch. If a roof catches fire, we’re ready!'],
    paysan: ['See this rice? Here the paddies are small, cut into terraces at the foot of the mountain.', 'In autumn we dry the sheaves on these wooden poles, the “hasagi”.', 'And my mino? It’s a straw cape: nothing better against rain and snow!'],
    paysanNuit: ['At night the frogs sing in the rice fields. That means the rice is growing well!'],
    guide: ['Welcome to the museum house! It’s more than two hundred years old.', 'The hearth, the irori, heated the whole house; its smoke rose into the attic and protected the thatch from insects.', 'Long ago, under the floor near the hearth, families secretly made saltpetre for gunpowder, for the lord of Kaga…', 'Do climb up to the attic by the ladder at the back: that’s where the silkworms were raised!'],
    grenier: ['The attic, under the great thatched roof. It smells of straw and smoked wood…', 'Look at the frame: big A-shaped beams, like two hands joined in prayer. That’s why it’s called “gasshō”!', 'Not a single nail: everything is tied with straw rope.'],
    kaiko: ['Bamboo trays covered with mulberry leaves… and little white cocoons.', 'Long ago, silkworms were raised up here. They ate day and night: you could hear them munching, like a soft rain.', 'The warmth of the hearth rose all the way up here and kept them cosy.'],
    kaikoCompagnon: {
      kon: ['“Cocoons… They look like big grains of rice!”'],
      pon: ['“They look so soft. Can you eat them? … No? Too bad.”'],
      chapu: ['“Shh… They’re asleep in their cocoons. Like me in my burrow!”'],
      gao: ['“I’ll guard the silkworms. No mouse will get past!”'],
      fuwa: ['“Their silk shines almost as bright as my pearl…”'],
      saya: ['“Mulberry leaves… They come from the trees down below. Thank you, trees.”'],
    },
    zaguri: ['A silk reel: the cocoons were dipped in hot water, then their thread was pulled, very fine, very long…', 'A single cocoon gives more than a kilometre of thread!'],
    aruji: ['Welcome, come and warm up by the hearth!', 'These are iwana, char from the river, grilled with salt. They cook slowly, standing around the embers.', 'Would you like a taste?'],
    arujiNuit: ['In the evening, everyone gathers around the hearth.', 'There are still some grilled iwana, nice and hot. Would you like a taste?'],
    arujiNon: ['Another time! There’ll be more tomorrow.'],
    iwana: ['The skin is crispy, the flesh is tender, and the salt on the tail tingles on your tongue…', 'Delicious!'],
    iwanaCompagnon: {
      kon: ['“Grilled fish… Foxes love it! Thank you so much!”'],
      pon: ['“Another one! And another! Pon pon, my belly is full!”'],
      chapu: ['“A river fish! I usually catch them raw…”'],
      gao: ['“I’ll guard the hearth while you eat. Enjoy!”'],
      fuwa: ['“A fish… from the mountains? It doesn’t look like the ones in the sea!”'],
      saya: ['“It smells of wood fire and the river. This village knows how to feed its travellers.”'],
    },
    invitee: ['Hello! I’m from Tokyo, staying here for two nights.', 'Last night I heard the river all night long… and this morning, mist covered the roofs!', 'Sleeping in a house two hundred years old… I’ll never forget it.'],
    inviteeNuit: ['At night, with no cars and no screens, you hear everything: the river, the frogs, the crackling fire…', 'Tomorrow I’m climbing to the lookout to see the village at sunrise!'],
    futon: ['Two soft futons, a quilt, a pillow filled with buckwheat husks…', 'Take a little nap until evening?'],
    futonNuit: ['The futons are waiting for you. Sleep until morning?'],
    futonSoir: ['A little nap… When you wake up, evening has fallen over the village.', 'The paper windows light up one by one.'],
    futonMatin: ['Morning! A ray of sunlight shines through the paper windows.', 'It smells of miso soup and hot rice…'],
    tokonoma: ['The alcove, the “tokonoma”: a scroll, a flowering branch.', 'It says “一期一会”, “ichi-go ichi-e”: every encounter is unique, it happens only once. So we treasure it.'],
    vendeuse: ['Welcome! This is Gokayama tofu: so firm you can carry it tied with a rope, like a parcel!', 'Long ago, it was carried that way across the snowy mountains without breaking.', 'Would you like to taste a piece?'],
    vendeuseNon: ['All right! Come back whenever you like.'],
    vendeuseNuit: ['The shop is closed for tonight. Tofu is made early in the morning, with cold mountain water.', 'Come back tomorrow!'],
    tofu: ['It’s dense, almost like cheese, a little salty… with the taste of soybeans and spring water.', 'Delicious!'],
    tofuCompagnon: {
      kon: ['“Tofu! Inari’s foxes love fried tofu… but this one too!”'],
      pon: ['“One piece, two pieces… can we take the whole rope? Pon pon!”'],
      chapu: ['“It’s all white, like the foam on the river!”'],
      gao: ['“Solid as a rampart! I like this tofu.”'],
      fuwa: ['“It tastes of mountain water… My pearl likes it.”'],
      saya: ['“The soybeans grew in the fields, the water comes from the forest… Everything comes together here.”'],
    },
    cuisinier: ['I make the soba by hand: buckwheat flour, mountain water, and the rolling pin…', 'Then I cut them with the knife, very thin. Chop, chop, chop!', 'In the pot, they cook in one minute. No more!'],
    cuisinierNuit: ['The day is over: I’m cleaning the pot and sharpening the knife for tomorrow.'],
    touriste: ['Mmm… These soba are amazing! And the broth smells of dried fish.', 'I came by bus from Takaoka. An hour of mountain roads, and then this village…'],
    touristeNuit: ['One more bowl of soba before bed. I could eat here every day!'],
    grandpere: ['I’ve had my tea here every day for fifty years.', 'When I was little, in winter, the snow came up to the first-floor windows!', 'Tourists come from all over the world now… The village is happy.'],
    grandpereNuit: ['In the evening you can hear the Shō river from here. It has always sung.'],
    menu: ['The menu, handwritten on wooden boards:', '“Zaru soba” (cold soba) 800 yen, “kake soba” (hot soba) 700 yen, “tofu dengaku” (tofu grilled with miso) 500 yen, salt-grilled “iwana” 600 yen.'],
    manekineko: ['A “maneki-neko”, the beckoning cat: it waves its paw to bring in customers and good luck.', 'You pat its head… It looks happy!'],
    guideNuit: ['In the evening the whole family gathered around the hearth to keep warm and tell stories.', 'They say some houses still hide secrets under their floors…'],
    enfant: ['I’m catching red dragonflies! “Akatombo”.', 'You know what? My grandpa says a board in the old museum “sings” when you walk on it, near the hearth…', 'But nobody dares to lift it!'],
    enfantNuit: ['It’s dark, I have to go home… Oh, look, a firefly!'],
    photographe: ['From here you can see the whole village: the thatched roofs, the rice fields, the turquoise river.', 'In spring with the cherry blossoms, and in winter under the snow, it’s even more beautiful!'],
    photographeNuit: ['At night the windows of the houses glow like lanterns. A magical photo!'],
    gardien: ['Hello. I sweep the shrine courtyard every morning.', 'They say that after their defeat in 1185, Heike warriors fled all the way here, deep in the mountains.', 'They are said to have hidden their red banner somewhere in the village… But where?'],
    gardienNuit: ['It’s late. May the gods watch over you on your journey.'],
    videaste: ['Hi! I film the most beautiful places in Japan for TikTok.', 'My account is @random_japan_place.', 'I made a video of Gokayama. Want to watch it?'],
    videasteNon: ['Okay! It’s also on the map, with all the other places.'],
    videasteApres: ['Did you like it? Follow me to see the next places!'],
    tenbo: ['The whole village from above: the great thatched roofs side by side, the rice fields, the little shrine under the cedars.', 'And all around, the turquoise Shō river and the mountains.'],
    tenboNuit: ['At night the village glows: every paper window is a lantern.', 'Above the mountains, the stars.'],
    jinja: ['You shake the bell, bow twice, clap twice…', 'You make a wish for the rest of your journey.'],
    jinjaNuit: ['You shake the bell, bow twice, clap twice…', 'The big festival lantern softly lights the shrine.'],
    jinja2: ['The great cedars whisper in the wind.'],
    jinja2Nuit: ['In the dark, the festival lantern glows between the cedars.'],
    irori: ['You sit down by the hearth. The embers glow, the kettle softly sings.', 'It smells of wood and smoke.'],
    iroriNuit: ['Evening by the hearth… The embers light up the blackened beams.', 'Outside, the frogs are singing.'],
    iroriCompagnon: {
      kon: ['“Ah… How cosy. Shall we tell fox stories by the fire?”'],
      pon: ['“We could toast mochi on the embers! Pon pon!”'],
      chapu: ['“The kettle is bubbling! It’s almost a little river…”'],
      gao: ['“I’ll stand guard by the fire. Nobody gets in!”'],
      fuwa: ['“A sea dragon by the fire… My pearl is all warm!”'],
      saya: ['“This wood was a tree, long ago… It remembers the forest.”'],
    },
    iroriCompagnonNuit: {
      kon: ['“The embers shine like foxes’ eyes in the night…”'],
      pon: ['“An evening by the fire… All we need is roasted chestnuts!”'],
      chapu: ['“The frogs are singing outside… I can sing too! Chapu chapu!”'],
      gao: ['“Sleep well. I’m watching over the hearth.”'],
      fuwa: ['“The smoke rises up to the roof… Like the clouds around my mountain.”'],
      saya: ['“The fire crackles softly. Old trees love that sound.”'],
    },
    ensho: ['“塩硝の里: the village of saltpetre”', 'In the Edo period, Gokayama secretly made saltpetre for the gunpowder of the lord of Kaga.', 'It was made in a pit under the floor of the houses, near the hearth: soil, grass, straw… and years of patience.', 'The mountains kept secrets well!'],
    butsudan: ['The family altar, the “butsudan”: black lacquer outside, all gold inside.', 'Here the ancestors are honoured: a candle, a stick of incense, a tap of the little bell… “tiiing”.'],
    butsudanNuit: ['By candlelight, the gold of the altar glows softly in the night.', 'Here the ancestors are honoured: a candle, a stick of incense, a tap of the little bell… “tiiing”.'],
    vitrine: ['Objects of old: a mino and a straw hat, straw boots for the snow…', '…the sasara and the kokiriko sticks, and a few sheets of Gokayama paper.'],
    creux: ['Knock… knock… Under your feet, a board sounds hollow.', 'As if there were a hole down there…'],
    creuxCompagnon: {
      kon: ['“That sound… There’s a hollow under this board. My nose is never wrong!”'],
      pon: ['“Pon? This floor sounds like my belly! There’s something under it!”'],
      chapu: ['“It sounds hollow! Like under the river stones, where the fish hide!”'],
      gao: ['“Gao! A guardian can feel these things: something is hidden here.”'],
      fuwa: ['“Fuwa… My pearl shines brighter, right above this board!”'],
      saya: ['“The wood is talking to me… Under this board, the earth keeps a secret.”'],
    },
    soulever: ['You slide your fingers under the edge of the board… It moves!'],
    fosse: ['Underneath, a dark pit: earth mixed with straw and dry grass.', 'It’s a saltpetre pit! Gunpowder for the lord of Kaga was secretly made here.', 'And right at the bottom… a small black lacquered box, tied with a red cord.'],
    coffre: ['The lid lifts…', 'Inside: a folded red cloth, an old paper… and a gold coin!'],
    banniere: ['A red silk banner, faded by the centuries, with a black butterfly in the middle.', 'The butterfly of the Taira: it’s a Heike banner!', 'Defeated at the battle of Dan-no-ura in 1185, the last Heike warriors are said to have hidden deep in these mountains…'],
    billet: ['A note, written with a brush, dated “文化三年”: the year 1806.', '“Hidden in the saltpetre pit, where nobody looks. May the banner of our ancestors stay safe; may the traveller who finds it keep the gold coin, as a keepsake.”'],
    fosseApres: ['The lifted board, the saltpetre pit, the lacquered box.', 'You left the banner inside, safe, as the people of old did.'],
    heron: ['A grey heron, standing still in the rice field… It is watching for frogs and little fish.', 'Gently… If it sees you, it flies away!'],
    grenouille: ['A little green tree frog, on the rice field edge.', 'In Japanese, frog is “kaeru”, like “to come back”: a lucky charm for travellers!'],
    libellule: ['A red dragonfly, an “akatombo”. In Japan it means summer is ending.', 'There’s even a very famous children’s song about it!'],
    chien: ['The minshuku’s shiba wags its curly tail.', 'You pet it… It closes its eyes with happiness!'],
    chienNuit: ['The shiba is asleep, lying by the door. Shh…', 'You pet it gently. Its tail moves a little.'],
    chienCompagnon: {
      kon: ['“A shiba! We’re sort of cousins: same muzzle, same bushy tail!”'],
      pon: ['“Pon! He’s cute… but he looks like he wants to chase me!”'],
      chapu: ['“A dog! Do you think he likes swimming too?”'],
      gao: ['“Gao! A fellow guardian! He watches his door well.”'],
      fuwa: ['“He’s watching me float with big eyes!”'],
      saya: ['“He smells of forest and wood fire. A good dog.”'],
    },
  },
  ja: {
    noms: { vendeuse: 'とうふやさん', cuisinier: 'そば職人', touriste: '旅行者', grandpere: 'おじいさん', aruji: '民宿の　ごしゅじん', invitee: '旅の　おきゃくさん', okami: '民宿の　おかみさん', grandmere: '和紙の　おばあさん', danseur: 'おどり手', musicien: 'はやしの　おじさん', pompier: '消防団の　人', paysan: 'お百姓さん', guide: '民俗館の　ガイドさん', enfant: '村の　子ども', photographe: 'カメラマン', gardien: '神社の　おじいさん', videaste: '@random_japan_place' },
    tampons: {
      tenbo: ['展望台', '村ぜんぶを　上から'],
      jinja: ['地主神社', '大きな　スギの　下'],
      washi: ['五箇山和紙', '小川の　そばの　工房'],
      kokiriko: ['こきりこ', '小さな　ぶたいで　おどる'],
      hosui: ['放水銃', '消防団の　こや'],
    },
    'panneau-bienvenue': ['「五箇山」', '富山の　山おくで、庄川が　村を　ぐるりと　かこんでいる。エメラルド色の　川だ。', '白川郷と　いっしょに、1995年から　世界遺産。'],
    'panneau-gassho': ['「合掌造り」', '「合掌」は、手を　あわせて　いのる　こと。60度の　急な　かやぶき屋根が、あわせた　手みたいに　見える。', '急な　屋根は　雪が　すべりおちる。冬は　2メートルも　つもるんだ！', '20〜30年に　一度、村じゅうで　力を　あわせて　屋根を　ふきかえる。これを「結（ゆい）」と　いう。'],
    'panneau-jinja': ['「地主神社」', '村を　守る　神さまの　神社。大きな　スギに　かこまれている。', '秋の　お祭りでは、夜おそくまで　こきりこを　おどる。'],
    'panneau-kokiriko': ['「こきりこ節」', '日本で　いちばん　古い　民謡と　いわれている。', 'おどり手は　百まいほどの　木の　板を　つないだ「ささら」を　鳴らし、はやしは　竹の　ぼう「こきりこ」を　うつ。'],
    'panneau-washi': ['「五箇山和紙」', 'コウゾの　木の　皮から、400年いじょう　手で　すいてきた　紙。', 'とても　じょうぶで、古い　本や　お城の　しょうじの　修理にも　つかわれる！'],
    'panneau-belvedere': ['「展望台へ」', '山の　小道を　のぼると、絵はがきの　ような　村の　けしき！'],
    'panneau-hosui': ['「放水銃」', 'かやぶき屋根は　すぐに　もえてしまう。だから　かやぶきの　小さな　こやに、放水銃が　いつも　まっている。', '年に　一度、ぜんぶ　いっしょに　ためす。屋根の　上に　水が　ふきあがる！'],
    'panneau-riviere': ['「庄川」', 'エメラルド色の　川が、村を　大きく　まわっている。', 'むかし、道が　なかった　ころは、かごに　のって　つなで　谷を　わたったんだって！'],
    'panneau-musee': ['「民俗館」', '200年いじょう　前の　本物の　合掌造り。どうぞ　中へ！', '1かいは　いろりと　くらし。上の　かいでは、かやの　下で　カイコを　そだてていた。'],
    okami: ['民宿へ　ようこそ！ ここでは　かやぶきの　家で、ふとんで　ねるのよ。', '夜は　いろりを　かこんで、焼き魚と　五箇山とうふ。なわで　しばって　もてるくらい　かたいの！', '今夜は　うちに　とまっていく？'],
    okamiNon: ['わかったわ！ いつでも　どうぞ。'],
    okamiNuit: ['村に　夜が　きたわ……', 'ほら、しょうじの　まどが　ひとつ　ずつ　あかるく　なる。大きな　ちょうちん　みたいでしょ。', '朝が　見たく　なったら、また　声を　かけてね。'],
    okamiMatin: ['ねむれないの？ 今夜は　田んぼの　カエルが　にぎやかね。', '朝まで　まつ？'],
    okamiReste: ['じゃあ　夜を　たのしんで！ 小川の　そばを　よく　見て。ホタルが　いるわよ。'],
    okamiJour: ['おはよう！ よく　ねむれた？ 朝ごはんよ。ごはんと　みそしると　五箇山とうふ！'],
    grandmere: ['こんにちは、ぼうや。ここでは　むかしの　ままの　紙すきを　しているのよ。', 'コウゾの　皮を　にて、たたいて、水に　まぜる。それを　この　わくで　すくうの。', '一まい　すいて　みる？'],
    grandmereNon: ['また　こんどね。紙は　にげないよ。'],
    grandmere2: ['あんたの　紙は　板の　上で　ひなたぼっこ。あしたには　できあがりよ！', '五箇山の　紙は　何百年も　もつんだよ。'],
    grandmereNuit: ['もう　夜だから、工房は　おしまい。', '紙すきは　朝、お日さまの　下で。小川の　水が　いちばん　きれいな　ときにね。'],
    washiDebut: ['わくを　白い　水に　しずめて、そっと　ゆらす……', '前に　うしろに、右に　左に。せんいが　からまって、紙に　なっていく。'],
    washiFin: ['わくを　もちあげると……すけるほど　うすい、まっしろな　紙！', '「じょうず　じょうず！ あとは　板に　はって、お日さまで　かわかすよ。」'],
    danseur: ['ヤー！ きこえる？ こきりこ。日本で　いちばん　古い　うただって！', 'ささらを　鳴らすと「じゃららん、じゃららん」！', 'いっしょに　おどろう？'],
    danseurNuit: ['夜の　ちょうちんの　下の　こきりこは、もっと　きれいだよ。', 'いっしょに　おどろう？'],
    danseurNon: ['オッケー！ じゃあ　きいていって。'],
    danseurDanse: ['うでを　あげて、さげて、よこに　一歩……', '「こきりこの　竹は　七寸五分じゃ……」と　はやしの　おじさんが　うたう。'],
    danseurFin: ['うまい！ こきりこの　才能が　あるね！'],
    danseur2: ['また　おどりに　きたの？ ここの　こきりこは　おわらないよ！'],
    danseur2Nuit: ['夜は、カエルが　しずかに　なるまで　ちょうちんの　下で　おどるんだ！'],
    musicien: ['この　二本の　竹の　ぼうが「こきりこ」。うたの　名前に　なったんだよ。', 'リズムに　あわせて　うちあわせる。「コン、コン」！'],
    musicienNuit: ['夜は　そっと　ひくんだ。みんな　家で　ねているからね。'],
    pompier: ['こんにちは！ 村の　消防団です。', 'かやぶき屋根は　あっと　いう間に　もえる。だから　村じゅうに、この　小さな　こやに　かくした　放水銃が　あるんだ。', 'ちょうど　これから　放水の　ためしを　するよ。見る？'],
    pompierEncore: ['放水銃の　ためし、もう一度　見る？'],
    pompierNon: ['オッケー！ いつでも　じゅんび　できてるよ。'],
    pompierJets: ['こやの　とびらが　ひらいて……水が　大きな　にじの　形で　屋根を　こえていく！', 'お日さまに　てらされた　しぶきの　中に、にじが　出た！'],
    pompierFin: ['これで　村は　あんしん。', '年に　一度、ぜんぶ　いっしょに　ためすんだ。遠くからも　見に　くるんだよ！'],
    pompierNuit: ['夜は　ためさないよ。見はりを　してるんだ。もし　屋根が　もえても、すぐ　かけつける！'],
    paysan: ['この　いね、見てごらん。ここの　田んぼは　小さくて、山の　ふもとに　だんだんに　なってるんだ。', '秋には　いねを　この　木の　さお「はさぎ」に　かけて　ほすんだよ。', 'わしの　みの？ わらの　マントじゃ。雨にも　雪にも　これが　いちばん！'],
    paysanNuit: ['夜の　田んぼで　カエルが　ないとる。いねが　よく　そだっとる　しるしじゃ！'],
    guide: ['民俗館へ　ようこそ！ この　家は　200年いじょう　前に　たてられました。', 'いろりの　火で　家ぜんたいを　あたため、けむりが　屋根うらに　のぼって、かやを　虫から　守ったんです。', 'むかし、いろりの　そばの　床下で、加賀の　お殿さまの　ために　ひみつで　火薬の　塩硝を　つくっていたんですよ……', 'おくの　はしごで　屋根うらに　のぼって　みてね。むかしは　そこで　かいこを　そだてて　いたんですよ！'],
    grenier: ['大きな　かやぶき屋根の　下の　屋根うら。わらと　けむりの　においが　する……', 'はりを　見て！　手を　合わせて　いのる　ような　大きな　Ａの　形。だから　「合掌」って　いうんだ！', 'くぎは　一本も　つかって　いない。ぜんぶ　わらの　なわで　しばって　あるよ。'],
    kaiko: ['竹の　かごに、くわの　葉っぱ……と、まっしろな　小さな　まゆ。', 'むかし、ここで　かいこを　そだてて　いたんだ。かいこは　昼も　夜も　葉っぱを　食べて、こまかい　雨のような　音が　したよ。', 'いろりの　あたたかさが　ここまで　のぼって　きて、かいこを　あたためて　いたんだ。'],
    kaikoCompagnon: {
      kon: ['「まゆ……大きな　お米の　つぶみたい！」'],
      pon: ['「ふわふわで　おいしそう。食べられる？……だめ？　ざんねん。」'],
      chapu: ['「しーっ……まゆの　中で　ねてるよ。ぼくが　すあなで　ねるみたい！」'],
      gao: ['「かいこの　番は　まかせて。ネズミは　一ぴきも　とおさないよ！」'],
      fuwa: ['「この　いと、ぼくの　しんじゅと　おなじくらい　ひかってる……」'],
      saya: ['「くわの　葉……下の　木から　きたんだね。ありがとう、木さん。」'],
    },
    zaguri: ['きいとを　とる　どうぐ、ざぐり。まゆを　おゆに　つけて、ほそくて　ながい　いとを　ひいたんだ……', 'まゆ　ひとつから、１キロメートル　いじょうの　いとが　とれるんだよ！'],
    aruji: ['いらっしゃい、いろりで　あたたまって　いきな！', 'これは　川の　いわな。しおを　ふって、おきびの　まわりで　ゆっくり　やいて　いるんだ。', 'ひとつ　食べて　みるかい？'],
    arujiNuit: ['夜は　みんな　いろりの　まわりに　あつまるんだ。', 'やきたての　いわなが　まだ　あるよ。食べて　みるかい？'],
    arujiNon: ['また　こんど！　あしたも　やくからね。'],
    iwana: ['かわは　パリッと、身は　ふっくら。しっぽの　しおが　ちょっぴり　しょっぱい……', 'おいしい！'],
    iwanaCompagnon: {
      kon: ['「やき魚……キツネは　だいすき！　ありがとう！」'],
      pon: ['「もう　ひとつ！　もう　ひとつ！　ポンポン、おなか　いっぱい！」'],
      chapu: ['「川の　さかな！　いつもは　なまで　つかまえるんだけど……」'],
      gao: ['「食べてる　あいだ、いろりの　番を　するよ。めしあがれ！」'],
      fuwa: ['「山の……さかな？　海の　さかなと　ちがうね！」'],
      saya: ['「たき火と　川の　においが　する。この村は　旅の人を　だいじに　するんだね。」'],
    },
    invitee: ['こんにちは！　東京から　来て、ここに　ふたばん　とまるの。', 'きのうの　夜は　ずっと　川の　音が　きこえて……けさは　きりが　屋根を　つつんでいたわ！', '200年の　家で　ねむるなんて……ずっと　わすれない。'],
    inviteeNuit: ['夜は　車も　画面も　なくて、なんでも　きこえる。川、カエル、パチパチいう　火……', 'あしたは　展望台で、朝日の　村を　見るの！'],
    futon: ['ふかふかの　ふとんが　ふたつ。かけぶとんと、そばがらの　まくら……', '夕方まで　ひるねする？'],
    futonNuit: ['ふとんが　まってるよ。朝まで　ねる？'],
    futonSoir: ['うとうと……目が　さめると、村は　もう　夕方。', '障子の　まどに、ひとつ　また　ひとつ、あかりが　ともる。'],
    futonMatin: ['朝だ！　障子から　お日さまの　ひかりが　さしこむ。', 'みそしると　ごはんの　いい　におい……'],
    tokonoma: ['床の間。かけじくと、花の　さいた　えだ。', '「一期一会」。いちどきりの　であいを　たいせつに、という　ことばだよ。'],
    vendeuse: ['いらっしゃい！　これが　五箇山の　とうふ。なわで　しばって　はこべるくらい　かたいのよ！', 'むかしは　こうして　雪の　山を　こえて、くずさずに　はこんだの。', 'ひとくち　食べて　みる？'],
    vendeuseNon: ['はい！　いつでも　どうぞ。'],
    vendeuseNuit: ['今夜は　もう　おしまい。とうふは　朝はやく、つめたい　山の　水で　つくるのよ。', 'また　あした　来てね！'],
    tofu: ['ぎゅっと　つまって、チーズみたい。ちょっぴり　しおあじ……だいずと　わき水の　あじ。', 'おいしい！'],
    tofuCompagnon: {
      kon: ['「おとうふ！　おいなりさんの　キツネは　あぶらあげが　だいすき……でも　これも　すき！」'],
      pon: ['「ひとくち、ふたくち……なわごと　もらって　いい？　ポンポン！」'],
      chapu: ['「まっしろ！　川の　あわみたい！」'],
      gao: ['「とりでみたいに　がんじょう！　この　とうふ、気に入った。」'],
      fuwa: ['「山の　水の　あじが　する……しんじゅも　よろこんでる。」'],
      saya: ['「だいずは　はたけで　そだって、水は　森から……ぜんぶ　ここで　ひとつに　なるんだね。」'],
    },
    cuisinier: ['そばは　手うちさ。そばこと　山の　水、それに　めんぼう……', 'それから　ほうちょうで　ほそーく　きる。トン、トン、トン！', 'なべで　ゆでるのは　一分だけ。それ　いじょうは　だめだよ！'],
    cuisinierNuit: ['きょうは　おしまい。なべを　あらって、あしたの　ために　ほうちょうを　とぐんだ。'],
    touriste: ['うーん……この　そば、さいこう！　おだしも　いい　かおり。', '高岡から　バスで　来たの。山道を　一時間……そしたら　この村！'],
    touristeNuit: ['ねる前に　もう　一ぱい。毎日　ここで　食べたいな！'],
    grandpere: ['わしは　五十年、毎日　ここで　お茶を　のんどる。', '子どもの　ころ、冬は　雪が　二かいの　まどまで　つもったもんじゃ！', 'いまは　世界じゅうから　お客さんが　くる……村も　よろこんどるよ。'],
    grandpereNuit: ['夜は　ここまで　庄川の　音が　きこえる。むかしから　ずっと　うたっとるんじゃ。'],
    menu: ['手書きの　おしながき：', '「ざるそば」八百円、「かけそば」七百円、「とうふ田楽」五百円、「岩魚の塩焼き」六百円。'],
    manekineko: ['まねきねこ。手を　あげて、お客さんと　しあわせを　まねくんだ。', 'あたまを　なでると……うれしそう！'],
    guideNuit: ['夜は　家族みんなが　いろりを　かこんで、あたたまりながら　むかし話を　したんです。', 'いまでも　床下に　ひみつを　かくしている　家が　あるとか……'],
    enfant: ['赤とんぼを　つかまえてるんだ！', 'しってる？ おじいちゃんが　いうには、民俗館の　いろりの　そばに、ふむと「うたう」板が　あるんだって……', 'でも、こわくて　だれも　もちあげないんだ！'],
    enfantNuit: ['もう　夜だ、かえらなきゃ……あっ、見て、ホタル！'],
    photographe: ['ここから　村ぜんぶが　見えるの。かやぶき屋根、田んぼ、エメラルド色の　川。', '春の　さくらや、冬の　雪景色は　もっと　すてきよ！'],
    photographeNuit: ['夜は　家の　まどが　ちょうちんみたいに　ひかるの。まほうの　ような　写真に　なるわ！'],
    gardien: ['こんにちは。毎朝、神社の　庭を　はいておる。', '1185年に　いくさに　まけた　平家の　武士たちが、この　山おくまで　にげてきたと　いわれておる。', '赤い　はたを　村の　どこかに　かくしたそうじゃ……さて、どこかのう？'],
    gardienNuit: ['もう　おそい。道中、神さまが　守って　くださるように。'],
    videaste: ['やあ！ 日本の　すてきな　場所を　TikTokで　しょうかい　しているんだ。', 'アカウントは　@random_japan_place。', '五箇山の　動画も　あるよ。見てみる？'],
    videasteNon: ['オッケー！ 地図にも　ほかの　場所と　いっしょに　のっているよ。'],
    videasteApres: ['気に入った？ フォローして　次の　場所も　見てね！'],
    tenbo: ['上から　見た　村。ならんだ　大きな　かやぶき屋根、田んぼ、スギに　かこまれた　小さな　神社。', 'まわりには　エメラルド色の　庄川と、山々。'],
    tenboNuit: ['夜の　村は　かがやいている。しょうじの　まど　ひとつ　ひとつが　ちょうちんだ。', '山の　上には　星。'],
    jinja: ['すずを　鳴らして、二礼、二拍手……', 'これからの　旅の　ぶじを　おねがいした。'],
    jinjaNuit: ['すずを　鳴らして、二礼、二拍手……', 'お祭りの　大きな　ちょうちんが、神社を　やさしく　てらしている。'],
    jinja2: ['大きな　スギが　風に　ささやいている。'],
    jinja2Nuit: ['くらやみの　中、スギの　あいだで　お祭りの　ちょうちんが　ひかっている。'],
    irori: ['いろりの　そばに　すわった。おきびが　赤く　ひかり、てつびんが　しずかに　うたっている。', '木と　けむりの　におい。'],
    iroriNuit: ['夜の　いろり……おきびが　黒い　はりを　てらしている。', 'そとでは　カエルが　ないている。'],
    iroriCompagnon: {
      kon: ['「ああ……あったかい。火を　かこんで、キツネの　むかし話を　しようか？」'],
      pon: ['「おきびで　おもちを　やこうよ！ ポンポン！」'],
      chapu: ['「てつびんが　ぶくぶく！ 小さな　川みたい……」'],
      gao: ['「火の　番は　まかせて。だれも　入れないよ！」'],
      fuwa: ['「海の　りゅうが　いろりの　そばに……しんじゅが　ぽかぽか！」'],
      saya: ['「この　まきも、むかしは　木だった……森の　ことを　おぼえているよ。」'],
    },
    iroriCompagnonNuit: {
      kon: ['「おきびが、夜の　キツネの　目みたいに　ひかってる……」'],
      pon: ['「いろりの　夜……あとは　やきぐりが　あれば　さいこう！」'],
      chapu: ['「そとで　カエルが　うたってる……ぼくも　うたえるよ！ チャプチャプ！」'],
      gao: ['「安心して　ねて。いろりは　ぼくが　見はるから。」'],
      fuwa: ['「けむりが　屋根まで　のぼっていく……ぼくの　山の　雲みたい。」'],
      saya: ['「火が　ぱちぱち……古い　木たちは　この　音が　すきなんだ。」'],
    },
    ensho: ['「塩硝の里」', '江戸時代、五箇山は　加賀藩の　火薬に　つかう　塩硝を、ひみつで　つくっていた。', '家の　いろりの　そばの　床下の　あなで、土や　草や　わらを　つかって、何年も　かけて　つくったんだ。', '山は　ひみつを　しっかり　守ったんだね！'],
    butsudan: ['家の　ぶつだん。そとは　くろい　うるし、なかは　ぜんぶ　金色。', 'ごせんぞさまを　たいせつに　します。ろうそく、おせんこう、りんを　ひとつ……「チーン」。'],
    butsudanNuit: ['ろうそくの　あかりで、ぶつだんの　金が　やさしく　ひかって　います。', 'ごせんぞさまを　たいせつに　します。ろうそく、おせんこう、りんを　ひとつ……「チーン」。'],
    vitrine: ['むかしの　道具。みのと　すげがさ、雪の　ための　わらぐつ……', '……ささらと　こきりこの　ぼう、それに　五箇山和紙。'],
    creux: ['コン……コン……足の　下の　板が、からっぽの　音が　する。', 'まるで　下に　あなが　ある　みたい……'],
    creuxCompagnon: {
      kon: ['「この　音……板の　下に　すきまが　ある。ぼくの　はなは　ぜったい　まちがえない！」'],
      pon: ['「ポン？ ぼくの　おなかみたいな　音！ 下に　なにか　あるよ！」'],
      chapu: ['「からっぽの　音！ 魚が　かくれる　川の　石の　下みたい！」'],
      gao: ['「ガオ！ 守り神には　わかる。ここに　なにか　かくれてる。」'],
      fuwa: ['「フワ……この　板の　上で、しんじゅが　つよく　ひかるよ！」'],
      saya: ['「木が　話しかけてくる……この　板の　下で、土が　ひみつを　守ってる。」'],
    },
    soulever: ['板の　はしに　ゆびを　かけると……うごいた！'],
    fosse: ['下には　くらい　あな。わらや　かれ草の　まざった　土。', '塩硝の　あなだ！ ここで　加賀の　お殿さまの　火薬を　ひみつで　つくっていたんだ。', 'そして　いちばん　そこに……赤い　ひもで　むすんだ、黒い　うるしの　小さな　はこ。'],
    coffre: ['ふたが　あがる……', '中には　たたんだ　赤い　ぬの、古い　紙……そして　小判！'],
    banniere: ['何百年も　たって　色あせた、赤い　きぬの　はた。まんなかに　黒い　チョウ。', '平氏の　チョウ……平家の　はただ！', '1185年、壇ノ浦の　いくさに　まけた　平家の　武士たちは、この　山おくに　かくれたと　いわれている……'],
    billet: ['ふでで　書かれた　手紙。日付は「文化三年」、1806年。', '「だれも　見ない　塩硝の　あなに　かくす。ご先祖さまの　はたが　守られますように。見つけた　旅人は、記念に　小判を　もっていってください。」'],
    fosseApres: ['あげた　板、塩硝の　あな、うるしの　はこ。', 'はたは　むかしの　人と　おなじように、そっと　しまっておいた。'],
    heron: ['田んぼに　じっと　立つ　アオサギ……カエルや　小魚を　ねらっている。', 'そーっと……見つかったら　とんでいっちゃう！'],
    grenouille: ['あぜに　みどりの　アマガエル。', 'カエルは「かえる」：旅人が　ぶじに　かえれる　おまもりだよ！'],
    libellule: ['赤とんぼ。日本では　夏の　おわりを　しらせる　虫。', 'とても　有名な　どうようも　あるね！'],
    chien: ['民宿の　しばいぬが、くるんと　まいた　しっぽを　ふっている。', 'なでると……しあわせそうに　目を　とじた！'],
    chienNuit: ['しばいぬは　げんかんの　前で　ねむっている。しーっ……', 'そっと　なでると、しっぽが　すこし　うごいた。'],
    chienCompagnon: {
      kon: ['「しばいぬだ！ ぼくたち　ちょっと　いとこ　なんだ。おなじ　はな、おなじ　ふさふさの　しっぽ！」'],
      pon: ['「ポン！ かわいい……でも　ぼくを　おいかけたそうな　顔してる！」'],
      chapu: ['「いぬだ！ この子も　およぐの　すきかな？」'],
      gao: ['「ガオ！ 見はりの　なかまだ！ ちゃんと　入口を　守ってる。」'],
      fuwa: ['「ぼくが　ういてるのを　まんまるの　目で　見てる！」'],
      saya: ['「森と　まきの　においが　する。いい　いぬだね。」'],
    },
  },
};
