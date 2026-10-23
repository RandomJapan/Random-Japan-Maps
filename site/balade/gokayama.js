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
// le ruisseau, de la montagne (à l'ouest) jusqu'à la berge de la rivière (à l'est), à travers le village ; le pont de
// planches du chemin principal
const RUISSEAU = [[-70, -10], [-50, -12], [-34, -13], [-22, -11], [-8, -9], [4, -10], [18, -13], [34, -16], [52, -18], [64, -19]];
// le sentier du belvédère, qui monte en lacets sur le flanc de la montagne, au nord-ouest (une pente douce : environ 30 %) ;
// [x, z, hauteur] ; le belvédère au bout, à la hauteur de sa fin (BELVEDERE_Y)
const SENTIER_XZ = [[-33, -44], [-30, -51], [-44, -61, 7.0], [-37, -68, 10.0], [-51, -70.5, 13.6]];
const BELVEDERE = { x: -58.5, z: -64.5, r: 3.4 };
const BELVEDERE_Y = 14.4;
// le parking, au nord-est, au bout de la route qui longe la rivière ; le départ
const PARKING = { x0: 30, x1: 46, z0: -70, z1: -58 };
const ROUTE = [[38, -64], [44, -84], [50, -105], [56, -130], [60, -160]];
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

// le sentier du belvédère : les deux premiers coudes, au niveau du village ; il finit au bord du belvédère
const SENTIER = SENTIER_XZ.map(([x, z, h]) => [x, z, h ?? niveau(x, z)]);
const Y_BELVEDERE = BELVEDERE_Y;
{
  const [x, z] = SENTIER[SENTIER.length - 1], l = Math.hypot(BELVEDERE.x - x, BELVEDERE.z - z), k = (l - BELVEDERE.r + 0.15) / l;
  SENTIER.push([x + (BELVEDERE.x - x) * k, z + (BELVEDERE.z - z) * k, Y_BELVEDERE]);
}
const Y_ESPLANADE = niveau(SANCTUAIRE.x1, -27) + SANCTUAIRE.haut;
/** Le fond d'une rizière (au niveau du sol en son milieu, un peu creusé). */
const fondRiziere = ([x0, x1, z0, z1]) => niveau((x0 + x1) / 2, (z0 + z1) / 2) - 0.25;

/**
 * Le sol : le relief naturel, puis ce que les gens y ont fait : les rizières en terrasses (le fond plat, une diguette
 * autour), le lit du ruisseau, les maisons posées à plat, l'esplanade du sanctuaire taillée dans la montagne (un mur
 * de pierre devant), le sentier et le belvédère, le parking.
 */
function terrain(x, z) {
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
  // le lit du ruisseau, entre ses deux murets de pierre
  if (x > -72 && x < 66 && z > -24 && z < 2) {
    const d = surLaLigne(RUISSEAU, x, z).d;
    if (d < 1.1) h -= 0.6 * (1 - lisse(0.62, 1.1, d));
  }
  // l'esplanade du sanctuaire
  {
    const S = SANCTUAIRE, e = Math.max(x - S.x1, S.x0 - x, z - S.z1, S.z0 - z);
    if (e < 3) h += (Y_ESPLANADE - h) * (e < 0 ? 1 : x > S.x1 ? (1 - lisse(0, 0.8, e)) : 1 - lisse(0, 3, e));
  }
  // le sentier du belvédère, et le belvédère
  if (x < -28 && z < -36) {
    const c = surLaLigne(SENTIER, x, z);
    if (c.d < 3.4) h += (c.h - h) * (1 - lisse(1.5, 3.4, c.d));
    const db = Math.hypot(x - BELVEDERE.x, z - BELVEDERE.z);
    if (db < BELVEDERE.r + 3) h += (Y_BELVEDERE - h) * (1 - lisse(BELVEDERE.r, BELVEDERE.r + 3, db));
  }
  // le parking
  {
    const P = PARKING, e = Math.max(x - P.x1, P.x0 - x, z - P.z1, P.z0 - z);
    if (e < 2) h += (niveau(38, -64) - h) * (1 - lisse(0, 2, e));
  }
  return h;
}

/**
 * Où l'on peut aller : la terrasse du village (pas la berge : la gorge est trop raide), jusqu'au parking au nord ;
 * l'esplanade du sanctuaire ; le sentier et le belvédère.
 */
function dansLeCadre(x, z) {
  if (z < PARKING.z0 + 0.5) return false;
  const S = SANCTUAIRE, Pk = PARKING;
  if (x > S.x0 + 0.6 && x < S.x1 + 2 && z > S.z0 + 0.6 && z < S.z1 - 0.6) return true;
  if (surLaLigne(SENTIER, x, z).d < 1.3 || Math.hypot(x - BELVEDERE.x, z - BELVEDERE.z) < BELVEDERE.r - 0.35) return true;
  if ((x > Pk.x0 + 0.5 && x < Pk.x1 - 0.5 && z < Pk.z1 + 2) || surLaLigne(CHEMIN.slice(0, 3), x, z).d < 3.5) return true;
  // la terrasse : au pied de la montagne, ou, près de la rivière, jusqu'en haut de sa berge
  const riv = versRiviere(x, z);
  if (riv.d < 22.5) return false;
  const r = Math.hypot(x, z);
  return r < rayonTerrasse(angle(x, z)) - 2 || (riv.dedans && riv.d < 40 && r < 80);
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
  const poser = (fin, x, z, o = {}) => objets.push({ fin, x, z, y: o.y ?? terrain(x, z), ry: o.ry || 0, ombre: o.ombre !== false });
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
    a.lanterne(x, z, 6);
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
    a.boite(0.24, 0.12, dz1 - dz0 + 0.24, '#3e2f25', { x: sP * (w2 - 0.08), y: 2.41, z: 0 });
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
      const teinte = (x, y, z) => {
        const k = n[0] * (x - E[0]) + n[1] * (y - E[1]);
        if (k > -0.03) {
          // (le long de la pente, par bandes de 2,6 m ; en long, par morceaux de 2,2 m : une couleur par morceau)
          const u = Math.floor((yR - y) / 2.6), v = Math.floor((z + 50) / 2.2), h = hasard(u * 3.1 + s * 7 + graine, v * 1.7 + graine * 3);
          return h < 0.18 ? P.chaumeClair : h > 0.85 ? P.chaumeFonce : P.chaume;
        }
        return P.chaumeFonce;
      };
      a.piece(new THREE.BoxGeometry(S, ep, Lr, 4, 1, Math.max(4, Math.round(Lr / 1.4))), P.chaume, { x: cx, y: cy, rz: -s * PI / 3, teinte });
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
  for (const [id, x, z, W, L, porte] of MAISONS) {
    const y = niveau(x, z), a = atelier(), petite = id.startsWith('k');
    const m = gassho(a, { W, L, porte, ouverte: id === 'musee', graine: x * 0.13 + z * 0.07, petite, murH: id === 'musee' ? 3.5 : petite ? 2.4 : 3.1 });
    MAISON[id] = { x, z, y, W, L, ...m };
    if (id === 'musee') { construireMusee(a, m); poser(a.fin(0, peinture), x, z, { y }); continue; }
    poser(a.fin(0, peinture), x, z, { y });
    // fermée : on ne la traverse pas, la caméra n'y entre pas
    monde.surface(x - W / 2 - 0.25, x + W / 2 + 0.25, z - L / 2 - 0.25, z + L / 2 + 0.25, y + m.socle, { plein: true });
    monde.bloc(x - W / 2 - 0.3, x + W / 2 + 0.3, z - L / 2 - 0.3, z + L / 2 + 0.3, y - 1, y + m.yR + 1);
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

  // ---------------------------------------------------------------- La maison-musée (民俗館), où l'on entre
  // (construite dans la maison elle-même, dans son repère : la porte à l'est, au milieu du mur long)
  function construireMusee(a, m) {
    const { w2, l2, socle, murH } = m, yD = socle + 0.02, yI = socle + 0.46, yT = yI + 0.05;
    SOL_MUSEE = yI;
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
    lames(-w2 + 0.16, xA, -l2 + 0.16, pz0);
    lames(-w2 + 0.16, xA, pz1, zT);
    lames(-w2 + 0.16, px0, pz0, pz1);
    lames(px1, xA, pz0, pz1);
    a.boite(0.14, 0.44, 2 * l2 - 0.32, '#3e2f25', { x: xA, y: socle + 0.22 + 0.02 });
    // la chambre de tatamis : les nattes bordées de noir, le cadre ; l'autel bouddhique (butsudan) au mur du sud
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 2; j++) {
        const x0 = -w2 + 0.16 + i * ((xA + w2 - 0.16) / 4), z0 = zT + j * ((l2 - 0.16 - zT) / 2), dx = (xA + w2 - 0.16) / 4, dz = (l2 - 0.16 - zT) / 2;
        a.boite(dx - 0.04, 0.06, dz - 0.04, '#cfc49a', { x: x0 + dx / 2, y: yT - 0.03, z: z0 + dz / 2 })
          .boite(dx - 0.02, 0.055, 0.03, '#2a2a28', { x: x0 + dx / 2, y: yT - 0.03, z: z0 + 0.015, trait: false });
      }
    }
    a.boite(1.6, 1.9, 0.6, '#1e1a18', { x: -1.2, y: yT + 0.95, z: l2 - 0.5 })
      .boite(1.3, 1.1, 0.04, '#c8a03a', { x: -1.2, y: yT + 1.2, z: l2 - 0.81, trait: false })
      .boite(0.5, 0.5, 0.04, '#2a2018', { x: -1.2, y: yT + 1.15, z: l2 - 0.83, trait: false });
    // les portes coulissantes (fusuma) entre le plancher et la chambre, ouvertes, peintes de montagnes
    for (const x of [-w2 + 0.7, -w2 + 1.55]) a.boite(0.86, 1.78, 0.04, '#e8dfc6', { x, y: yT + 0.89, z: zT + 0.05 });
    // le foyer (irori) : le cadre de bois, la cendre, les braises, le crochet (jizai-kagi) et son poisson de bois, la
    // bouilloire de fonte ; les coussins autour
    const IR = { x: -1.0, z: -2.15 };
    a.boite(1.35, 0.1, 1.35, '#3e2f25', { x: IR.x, y: yI - 0.02, z: IR.z })
      .boite(1.15, 0.06, 1.15, '#8f8a84', { x: IR.x, y: yI + 0.0, z: IR.z, trait: false });
    for (const [dx, dz] of [[-0.15, 0.1], [0.12, -0.05], [0.02, 0.18], [-0.08, -0.16]]) a.boite(0.22, 0.06, 0.08, '#e86a2a', { x: IR.x + dx, y: yI + 0.05, z: IR.z + dz, ry: dx * 9, sorte: 'lampe', trait: false });
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
    // l'échelle du grenier
    for (const s of [-1, 1]) a.baton([-w2 + 0.6 + s * 0.22, yI, -l2 + 1.6], [-w2 + 0.45 + s * 0.22, murH, -l2 + 1.3], 0.03, '#6a5240', 5);
    for (let k = 1; k < 8; k++) { const f = k / 8; a.boite(0.44, 0.04, 0.05, '#6a5240', { x: -w2 + 0.6 - 0.15 * f, y: yI + (murH - yI) * f, z: -l2 + 1.6 - 0.3 * f }); }
    // le plafond (des lattes de bambou, noircies par la fumée du foyer) et ses poutres
    a.piece(new THREE.BoxGeometry(2 * w2 - 0.32, 0.06, 2 * l2 - 0.32, 1, 1, 24), '#3a2c22', { y: murH - 0.03, teinte: (x, y, z) => (Math.floor((z + 20) / 0.31) % 2 ? '#3a2c22' : '#2e231b') });
    for (let z = -l2 + 1.8; z < l2 - 0.5; z += 2.6) a.boite(2 * w2 - 0.32, 0.26, 0.24, '#2a201a', { y: murH - 0.2, z });
    a.boite(0.26, 0.26, 2 * l2 - 0.32, '#2a201a', { x: -1.0, y: murH - 0.42 });
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
    monde.cercle(X - w2 + 0.55, Z - l2 + 1.45, 0.35);
    monde.surface(X + xA, X + w2 - 0.16, Z - l2 + 0.16, Z + l2 - 0.16, Y + yD + 0.02, { sol: 'terre' });
    monde.surface(X - w2 + 0.16, X + xA, Z - l2 + 0.16, Z + zT, Y + yI, { sol: 'bois' });
    monde.surface(X - w2 + 0.16, X + xA, Z + zT, Z + l2 - 0.16, Y + yT, { sol: 'bois' });
    monde.surface(X + w2 - 0.2, X + w2 + 0.95, Z - 0.85, Z + 0.85, Y + yD, { sol: 'pierre' });
    const bas = Y - 1, haut = Y + murH;
    for (const [x0, x1, z0, z1] of [[-w2 - 0.1, w2 + 0.1, -l2 - 0.1, -l2 + 0.1], [-w2 - 0.1, w2 + 0.1, l2 - 0.1, l2 + 0.1], [-w2 - 0.1, -w2 + 0.1, -l2, l2], [w2 - 0.1, w2 + 0.1, -l2, -0.85], [w2 - 0.1, w2 + 0.1, 0.85, l2]]) monde.bloc(X + x0, X + x1, Z + z0, Z + z1, bas, haut);
    monde.bloc(X + w2 - 0.1, X + w2 + 0.1, Z - 0.85, Z + 0.85, Y + 2.35, haut);
    monde.toit(X - w2 - 0.2, X + w2 + 0.2, Z - l2 - 0.2, Z + l2 + 0.2, Y + murH - 0.06, Y + m.yR + 1);
    lumieres.push({ x: X + 1.5, y: Y + yI + 0.35, z: Z - 3.6, halo: 0.35, sol: Y + yI, r: 3.6 });
    lumieres.push({ x: X + IR.x, y: Y + yI + 0.15, z: Z + IR.z, halo: 0.3, sol: Y + yI, r: 2.4, c: '#ff9a4a' });
    MAISON.musee.IR = IR;
  }

  // ---------------------------------------------------------------- Les rizières, le ruisseau
  const mares = [];
  {
    const a = atelier(), riz = atelier();
    RIZIERES.forEach((R, i) => {
      const [x0, x1, z0, z1] = R, f = fondRiziere(R), ye = f + 0.12, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      mares.push([cx, cz]);
      // l'eau (un peu de vert boueux), et ses lignes claires le long des bords
      a.boite(x1 - x0 - 1.0, 0.02, z1 - z0 - 1.0, P.eauRiziere, { x: cx, y: ye, z: cz, trait: false, nuance: 0.02 });
      for (const k of [0.82, 0.55]) {
        const hx = (x1 - x0 - 1.0) / 2 * k, hz = (z1 - z0 - 1.0) / 2 * k;
        const yl = ye + 0.03;
        a.ruban([[cx - hx, yl, cz - hz], [cx + hx, yl, cz - hz], [cx + hx, yl, cz + hz], [cx - hx, yl, cz + hz], [cx - hx, yl, cz - hz]], 0.05, '#c8e4dc');
      }
      // le riz : des touffes en rangs (hautes et vertes, ou toutes petites dans les rizières qu'on vient de planter)
      const jeune = RIZ_JEUNE.includes(i), h = jeune ? 0.16 : 0.62, pasX = 0.42, pasZ = 0.36;
      for (let x = x0 + 0.85; x < x1 - 0.7; x += pasX) {
        for (let z = z0 + 0.8; z < z1 - 0.7; z += pasZ) {
          const t = hasard(x * 3.1, z * 2.3);
          riz.cone(0.05 + t * 0.03, h * (0.85 + 0.3 * t), 3, t < 0.5 ? P.riz : P.rizClair, { x: x + (t - 0.5) * 0.1, y: f + h * 0.48, z: z + (hasard(z, x) - 0.5) * 0.1, ry: t * 6, trait: false, sorte: 'riz', nuance: 0.08 });
        }
      }
      // on ne marche pas dans la rizière (sur la diguette, si)
      const e = 0.6;
      monde.mur(x0 + e, z0 + e, x1 - e, z0 + e, 0.15); monde.mur(x0 + e, z1 - e, x1 - e, z1 - e, 0.15);
      monde.mur(x0 + e, z0 + e, x0 + e, z1 - e, 0.15); monde.mur(x1 - e, z0 + e, x1 - e, z1 - e, 0.15);
    });
    poser(a.fin(0, peinture), 0, 0, { y: 0, ombre: false });
    poser(riz.fin(0, peinture), 0, 0, { y: 0, ombre: false });
  }
  // le ruisseau : son lit entre deux murets de pierres, l'eau claire, les petites chutes ; le pont de planches du chemin
  // principal et celui de l'atelier de papier ; à l'est, la cascade qui tombe dans la gorge
  const PONTS = [[2.35, -9.8]];
  {
    const a = atelier();
    for (let k = 0; k < RUISSEAU.length - 1; k++) {
      const [x0, z0] = RUISSEAU[k], [x1, z1] = RUISSEAU[k + 1], l = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0);
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, y0 = terrain(x0, z0), y1 = terrain(x1, z1), nx = Math.cos(ry), nz = -Math.sin(ry);
      const yc = (niveau(x0, z0) + niveau(x1, z1)) / 2;
      for (const s of [-1, 1]) {
        a.piece(new THREE.BoxGeometry(0.28, 0.75, l + 0.28, 1, 2, Math.max(2, Math.round(l / 0.5))), P.pierre, { x: cx + s * nx * 0.78, y: yc - 0.28, z: cz + s * nz * 0.78, ry, teinte: pierres });
      }
      a.piece(new THREE.BoxGeometry(1.3, 0.04, l + 0.05), P.eauClaire, { x: cx, y: yc - 0.36, z: cz, ry, trait: false, nuance: 0.03 })
        .ruban([[x0 + nx * 0.25, yc - 0.315, z0 + nz * 0.25], [x1 + nx * 0.25, yc - 0.315, z1 + nz * 0.25]], 0.05, '#e6f6f2')
        .ruban([[x0 - nx * 0.3, yc - 0.315, z0 - nz * 0.3], [x1 - nx * 0.3, yc - 0.315, z1 - nz * 0.3]], 0.04, '#e6f6f2');
      void y0; void y1;
      // (on ne marche pas dans le ruisseau, sauf sur le pont : des murs, mètre par mètre, loin du pont)
      const n = Math.ceil(l);
      for (let j = 0; j < n; j++) {
        const fa = j / n, fb = (j + 1) / n, mx = x0 + (x1 - x0) * (fa + fb) / 2, mz = z0 + (z1 - z0) * (fa + fb) / 2;
        if (PONTS.every(([bx, bz]) => Math.hypot(mx - bx, mz - bz) > 1.3)) monde.mur(x0 + (x1 - x0) * fa, z0 + (z1 - z0) * fa, x0 + (x1 - x0) * fb, z0 + (z1 - z0) * fb, 0.95);
      }
    }
    // le pont de planches, en travers du ruisseau, et ses deux poutres
    for (const [bx, bz] of PONTS) {
      const k = RUISSEAU.findIndex((q, i) => i < RUISSEAU.length - 1 && surLaLigne([q, RUISSEAU[i + 1]], bx, bz).d < 0.8);
      const [x0, z0] = RUISSEAU[k], [x1, z1] = RUISSEAU[k + 1], ry = Math.atan2(x1 - x0, z1 - z0), y = niveau(bx, bz) + 0.06;
      a.boite(2.4, 0.1, 1.8, P.bois, { x: bx, y, z: bz, ry });
      for (const sz of [-1, 1]) a.boite(2.5, 0.14, 0.12, P.boisFonce, { x: bx + Math.sin(ry) * sz * 0.92, y: y - 0.1, z: bz + Math.cos(ry) * sz * 0.92, ry });
      monde.surface(bx - 1.25, bx + 1.25, bz - 1.25, bz + 1.25, y + 0.05, { sol: 'bois' });
    }
    // la cascade : le ruisseau tombe dans la gorge de la rivière, en filets d'écume
    {
      const pts = [];
      for (let x = 63; x < 86; x += 1) pts.push([x, terrain(x, -19.2) + 0.12, -19.2 - (x - 63) * 0.02]);
      a.ruban(pts, 1.1, '#e8f6f2').ruban(pts.map(([x, y, z]) => [x, y + 0.07, z + 0.25]), 0.35, '#ffffff');
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
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
    monde.mur(SA.x1 + 0.2, SA.z0, SA.x1 + 0.2, mz - 1.3, 0.5); monde.mur(SA.x1 + 0.2, mz + 1.3, SA.x1 + 0.2, SA.z1, 0.5);
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
    // des marches de rondins tous les 1,2 m sur le sentier
    let s0 = 0;
    for (let k = 0; k < SENTIER.length - 1; k++) {
      const [x0, z0, h0] = SENTIER[k], [x1, z1, h1] = SENTIER[k + 1], l = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0);
      for (let t = (1.2 - (s0 % 1.2)); t < l; t += 1.2) {
        const f = t / l;
        a.cylindre(0.07, 0.07, 1.7, 6, '#7a5a3a', { x: x0 + (x1 - x0) * f, y: h0 + (h1 - h0) * f + 0.04, z: z0 + (z1 - z0) * f, rz: PI / 2, ry });
      }
      s0 += l;
    }
    monde.chemin(SENTIER, 1.0, { sol: 'terre' });
    // la plate-forme, ses poteaux qui descendent dans la pente, la barrière (côté vallée), le banc
    a.cylindre(B.r, B.r, 0.14, 18, P.bois2, { x: B.x, y: yB + 0.07, z: B.z });
    for (let k = 0; k < 8; k++) {
      const t = (k / 8) * 2 * PI, x = B.x + Math.sin(t) * (B.r - 0.15), z = B.z + Math.cos(t) * (B.r - 0.15);
      a.boite(0.14, 3.2, 0.14, '#5a4436', { x, y: yB - 1.5, z });
    }
    const vT = vers(B.x, B.z, 0, 0);
    for (let k = -6; k <= 6; k++) {
      const t = vT + (k / 6) * 1.6, x = B.x + Math.sin(t) * (B.r - 0.1), z = B.z + Math.cos(t) * (B.r - 0.1);
      a.boite(0.08, 1.0, 0.08, '#5a4436', { x, y: yB + 0.5, z });
      if (k < 6) {
        const t2 = vT + ((k + 1) / 6) * 1.6, x2 = B.x + Math.sin(t2) * (B.r - 0.1), z2 = B.z + Math.cos(t2) * (B.r - 0.1);
        a.baton([x, yB + 1.0, z], [x2, yB + 1.0, z2], 0.04, P.bois, 5).baton([x, yB + 0.55, z], [x2, yB + 0.55, z2], 0.03, P.bois, 5);
        monde.mur(x, z, x2, z2, 0.25);
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
    a.boite(2.4, 0.75, 1.0, '#7a5a3a', { x: -0.4, y: 0.42, z: -0.6 })
      .boite(2.25, 0.03, 0.86, '#e8e6dc', { x: -0.4, y: 0.79, z: -0.6, trait: false })
      .boite(0.9, 0.05, 0.62, '#9a7a52', { x: -0.4, y: 0.84, z: -0.6 });
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
    monde.mur(WASHI.x - 1.6, WASHI.z - 0.6, WASHI.x + 0.8, WASHI.z - 0.6, 0.55);
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
      .boite(K.l + 0.06, 0.06, 0.06, '#3e2f25', { x: K.x, y: yK - 0.03, z: K.z + K.p / 2 });
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
    const a = atelier(), y = niveau(CASERNE.x, CASERNE.z);
    a.boite(3.2, 2.6, 2.6, '#c9c2b2', { y: 1.3 })
      .pignon(3.8, 0.7, 3.1, P.tole, { y: 2.6, ry: PI / 2 })
      .boite(2.2, 2.0, 0.05, '#8a8a90', { y: 1.05, z: 1.31 })
      .boite(0.3, 0.3, 0.2, '#d8302c', { y: 2.4, z: 1.42, sorte: 'lumiere' });
    for (let k = 0; k < 5; k++) a.cylindre(0.16, 0.13, 0.28, 10, '#d8302c', { x: 1.9, y: 0.15 + k * 0.17, z: 0.6 + (k % 2) * 0.04 });
    ecrire({ x: CASERNE.x, y, z: CASERNE.z, ry: vers(CASERNE.x, CASERNE.z, 0, 0) }, { texte: '消防', fond: '#ffffff', encre: '#c8302c', x: 0, y: 1.95, z: 1.34, l: 0.7, h: 0.35 });
    poser(a.fin(0, peinture), CASERNE.x, CASERNE.z, { ry: vers(CASERNE.x, CASERNE.z, 0, 0) });
    lumieres.push({ x: CASERNE.x + Math.sin(vers(CASERNE.x, CASERNE.z, 0, 0)) * 1.45, y: y + 2.4, z: CASERNE.z + Math.cos(vers(CASERNE.x, CASERNE.z, 0, 0)) * 1.45, halo: 0.35, sol: y, r: 2.2, c: '#ff6a5a' });
    monde.surface(CASERNE.x - 1.9, CASERNE.x + 1.9, CASERNE.z - 1.9, CASERNE.z + 1.9, y + 0.05, { plein: true });
    monde.cercle(CASERNE.x, CASERNE.z, 2.2);
    monde.bloc(CASERNE.x - 2, CASERNE.x + 2, CASERNE.z - 2, CASERNE.z + 2, y - 1, y + 3.4);
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

  // ---------------------------------------------------------------- Le parking, la route, les panneaux
  {
    const a = atelier(), y = niveau(38, -64);
    // les lignes blanches du parking, le car du patrimoine mondial (世界遺産バス), l'arrêt de bus
    for (let k = 0; k < 6; k++) a.boite(0.1, 0.01, 4.0, '#f4f4f0', { x: PARKING.x0 + 2 + k * 2.6, y: y + 0.015, z: PARKING.z1 - 2.6, trait: false });
    const bx = 33.5, bz = -66.5;
    a.boite(2.4, 2.7, 9.5, '#f1f0ec', { x: bx, y: y + 1.65, z: bz })
      .boite(2.42, 0.5, 9.52, '#2f6a9a', { x: bx, y: y + 1.0, z: bz })
      .boite(2.43, 0.9, 7.8, '#3a4a5a', { x: bx, y: y + 2.2, z: bz + 0.3 })
      .boite(2.2, 1.1, 0.04, '#3a4a5a', { x: bx, y: y + 2.1, z: bz + 4.76 });
    for (const [dx, dz] of [[-1.15, -3.2], [1.15, -3.2], [-1.15, 3.0], [1.15, 3.0]]) a.cylindre(0.45, 0.45, 0.3, 12, '#2a2a2e', { x: bx + dx, y: y + 0.45, z: bz + dz, rz: PI / 2 });
    ecrire({ x: bx, y, z: bz, ry: 0 }, { texte: '世界遺産バス', fond: '#f1f0ec', encre: '#2f6a9a', x: 1.215, y: 1.55, z: 0.5, ry: PI / 2, l: 3.2, h: 0.42 });
    monde.surface(bx - 1.3, bx + 1.3, bz - 4.9, bz + 4.9, y + 0.6, { plein: true });
    monde.bloc(bx - 1.3, bx + 1.3, bz - 4.9, bz + 4.9, y - 1, y + 3.1);
    a.cylindre(0.04, 0.04, 2.2, 6, '#8a8a90', { x: 41.5, y: y + 1.1, z: -59.5 })
      .cylindre(0.32, 0.32, 0.04, 16, '#2f6a9a', { x: 41.5, y: y + 2.1, z: -59.5, rx: PI / 2 });
    ecrire({ x: 41.5, y, z: -59.5, ry: 0 }, { texte: '相倉口', fond: '#ffffff', encre: '#2f6a9a', x: 0, y: 2.1, z: 0.025, l: 0.48, h: 0.22 });
    monde.cercle(41.5, -59.5, 0.2);
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }
  const PANNEAUX = {
    bienvenue: { x: 27.6, z: -54.4, ry: -1.47 }, // (au bord du chemin, devant le départ, tourné vers lui : derrière, il bouchait la vue)
    gassho: { x: 8.5, z: -34, ry: PI - 0.9 },
    jinja: { x: -33.5, z: -29.5, ry: -PI / 2 + 0.3 },
    kokiriko: { x: 17.6, z: 16, ry: PI / 2 + 0.6 },
    washi: { x: -16.5, z: -3.8, ry: PI - 0.4 },
    belvedere: { x: -32, z: -40, ry: PI - 0.8 },
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
    /** Un feuillu : le tronc, deux branches, six touffes vertes de la sorte s (houppier, houppierErable, houppierCerisier). */
    const feuillu = (x, z, h, s, verts) => {
      const y = terrain(x, z), fourche = [x + 0.02 * h, y + h * 0.45, z], graine = hasard(x * 0.61 + 1.7, z * 0.47 - 3.3);
      a.baton([x, y - 0.06, z], [x + 0.02 * h, y + h * 0.5, z], 0.035 * h, P.tronc, 6)
        .baton(fourche, [x - 0.18 * h, y + h * 0.68, z + 0.05 * h], 0.022 * h, P.tronc, 5)
        .baton(fourche, [x + 0.2 * h, y + h * 0.7, z - 0.04 * h], 0.022 * h, P.tronc, 5);
      const touffes = [[0, 0.78, 0, 0.3], [-0.2, 0.68, 0.06, 0.22], [0.21, 0.7, -0.05, 0.22], [0.04, 0.66, 0.2, 0.2], [-0.03, 0.7, -0.2, 0.2], [0.08, 0.92, 0.04, 0.18]].map(([dx, dy, dz, rr]) => [x + dx * h, y + dy * h, z + dz * h, rr * h]);
      touffes.forEach(([tx, ty, tz, rr], k) => a.boule(rr, verts[k % verts.length], { x: tx, y: ty, z: tz, sy: 0.8, sorte: s, graine }, 1));
      a.ramure(fourche, touffes, h, P.tronc);
      return y;
    };
    for (const [x, z, h, sorte] of [[-3, -42, 7, 'c'], [30, -40, 6.5, 'c'], [-36, -32, 7, 'c'], [16, -16, 6, 'e'], [-6, 26, 6.5, 'c'], [26, 62, 7, 'c'], [-20, 64, 6, 'e'], [42, 8, 6, 'k'], [-30, 30, 5.5, 'k'], [-48, 26, 6.5, 'c'], [38, -48, 5.5, 'e'], [52, 20, 6, 'c'], [-12, 6, 5, 'e']]) {
      const s = { c: 'houppierCerisier', e: 'houppierErable', k: 'houppier' }[sorte];
      const y = feuillu(x, z, h, s, sorte === 'e' ? ['#6fa84a', '#5f9a40'] : [P.feuillage, P.herbeFonce, '#6aa34a']);
      // (les kakis, déjà orange, au bout des branches du plaqueminier)
      if (sorte === 'k') for (let k = 0; k < 9; k++) a.boule(0.09, '#e8822a', { x: x + Math.sin(k * 2.4) * h * 0.25, y: y + h * (0.6 + 0.12 * Math.sin(k * 1.7)), z: z + Math.cos(k * 2.4) * h * 0.25 }, 0);
      monde.cercle(x, z, 0.35);
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }
  {
    const a = atelier();
    for (const [x0, z0, x1, z1] of [[-12, -21, 1, -15.5], [8, 36, 7, 30], [-26, 41, -12, 41.5], [20, -36, 24, -44]]) {
      const n = Math.round(Math.hypot(x1 - x0, z1 - z0) / 1.3);
      for (let k = 0; k <= n; k++) {
        const x = x0 + ((x1 - x0) * k) / n, z = z0 + ((z1 - z0) * k) / n, r = 0.5 + hasard(x, z) * 0.25;
        a.buisson(x, terrain(x, z) + 0.3, z, r, P.herbeFonce);
        buissons.push([x, z, r]);
      }
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
  }
  // la forêt de la montagne : des cèdres serrés (sombres, toute l'année) et des feuillus (houppiers : ils jaunissent et
  // tombent), en dehors du village ; sur la berge, une forêt persistante ; la berge d'en face, plus loin
  {
    const cedres = atelier(), feuillus = atelier(), berge = atelier();
    const tire = (() => { let s = 1185; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();
    for (let i = 0; i < 2600; i++) {
      const x = -260 + tire() * 520, z = -260 + tire() * 500;
      const r = Math.hypot(x, z), a = angle(x, z), rT = rayonTerrasse(a), riv = versRiviere(x, z), y = terrain(x, z);
      if (r < rT + 3 || riv.d < 13) continue;
      if (surLaLigne(SENTIER, x, z).d < 3.5 || Math.hypot(x - BELVEDERE.x, z - BELVEDERE.z) < BELVEDERE.r + 3) continue;
      if (x > SANCTUAIRE.x0 - 2 && x < SANCTUAIRE.x1 + 2 && z > SANCTUAIRE.z0 - 2 && z < SANCTUAIRE.z1 + 2) continue;
      if (x > 30 && x < 70 && z < -55 && surLaLigne(ROUTE, x, z).d < 6) continue;
      // (le belvédère garde sa vue : pas d'arbre entre lui et le village)
      if (surLaLigne([[BELVEDERE.x, BELVEDERE.z], [0, 0]], x, z).d < 12 && Math.hypot(x, z) > 40 && y < Y_BELVEDERE + 6) continue;
      const loin = r > 150, d = Math.min(1, (r - rT) / 60);
      if (riv.dedans && riv.d < 40) {
        if (surLaLigne([[VUE_SUD.x, VUE_SUD.z], [VUE_SUD.x + 30, VUE_SUD.z + 26]], x, z).d < 14) continue;
        // la berge, du côté du village : une forêt persistante (les houppiers serrés des pentes)
        const rr = 1.6 + tire() * 1.4;
        berge.boule(rr, tire() < 0.5 ? P.jungleFonce : P.feuillage, { x, y: y + rr * 0.3, z, sy: 0.8, sorte: 'persistant' }, loin ? 0 : 1);
        continue;
      }
      if (tire() < 0.62 - 0.2 * d) {
        const h = 9 + tire() * 9;
        cedres.cylindre(0.15 + h * 0.012, 0.22 + h * 0.016, h * 0.3, 5, '#5a4030', { x, y: y + h * 0.12, z });
        for (const [rr, hh, k] of [[0.24, 0.42, 0.42], [0.18, 0.36, 0.64], [0.11, 0.3, 0.86]]) cedres.cone(h * rr, h * hh, loin ? 6 : 8, k > 0.5 ? P.cedre : P.cedreFonce, { x, y: y + h * k - h * hh * 0.25, z, ry: tire() * 3, sorte: 'conifere' });
      } else {
        const h = 6 + tire() * 5, g = hasard(x * 0.7, z * 0.9);
        const touffes = [[0, 0.72, 0, 0.38], [-0.24, 0.6, 0.1, 0.28], [0.24, 0.62, -0.08, 0.28]].map(([dx, dy, dz, rr]) => [x + dx * h, y + dy * h, z + dz * h, rr * h]);
        feuillus.baton([x, y - 0.1, z], [x + 0.1, y + h * 0.5, z], 0.035 * h, '#7a5a40', 5);
        for (const [tx, ty, tz, rr] of touffes) feuillus.boule(rr, [P.feuillage, P.jungle, P.herbeFonce][Math.floor(tire() * 3)], { x: tx, y: ty, z: tz, sy: 0.85, sorte: 'houppier', graine: g }, loin ? 0 : 1);
        if (!loin && r < 140) feuillus.ramure([x + 0.1, y + h * 0.48, z], touffes, h * 0.75, '#7a5a40');
      }
    }
    poser(cedres.fin(0, peinture), 0, 0, { y: 0, ombre: false });
    poser(feuillus.fin(0, peinture), 0, 0, { y: 0, ombre: false });
    poser(berge.fin(0, peinture), 0, 0, { y: 0, ombre: false });
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
  const passants = [
    { id: 'okami', x: Mi.x + Mi.sP * (Mi.w2 + 1.3), z: Mi.z + 1.3, cap: Mi.sP > 0 ? PI / 2 : -PI / 2, tenue: { taille: 0.98, peau: '#f2c9a8', cheveux: '#3a2a22', coiffure: 'chignon', haut: '#3f5a8a', manches: 'kimono', col: '#f3efe4', tablier: '#f6efe0', bas: { sorte: 'jupe', c: '#3f5a8a' }, chaussures: '#c9a06a', semelle: '#5a3a2a', yeux: 'plisses' } },
    { id: 'grandmere', x: WASHI.x - 0.4, z: WASHI.z + 0.25, cap: PI, tenue: { taille: 0.94, peau: '#f0c8a6', cheveux: '#e2ded6', coiffure: 'chignon', chapeau: { sorte: 'foulard', c: '#f2efe6' }, haut: '#7a8f6a', manches: 'longues', tablier: '#e8e0cc', bas: { sorte: 'pantalon', c: '#4a4a56' }, chaussures: '#3a3236', semelle: '#3a3236', yeux: 'plisses' } },
    { id: 'danseur', x: K.x + 0.6, z: K.z, cap: 0, tenue: { taille: 1.04, peau: PEAU, cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'eboshi', c: '#1e1c1c' }, haut: '#e6dcc4', manches: 'kimono', col: '#c8302c', bas: { sorte: 'hakama', c: '#3a4a7a', c2: '#2f3d68' }, chaussures: '#f4f0e6', semelle: '#c9b48a', instrument: 'sasara', pose: 'kokiriko' } },
    { id: 'musicien', x: K.x - 1.4, z: K.z + 0.4, cap: 0.3, tenue: { taille: 1.0, peau: '#ecc49c', cheveux: '#5a5650', coiffure: 'court', haut: '#2f4a7a', manches: 'kimono', col: '#f3efe4', bas: { sorte: 'hakama', c: '#4a3a2a' }, chaussures: '#f4f0e6', semelle: '#c9b48a', instrument: 'kokiriko', pose: 'jouer' } },
    { id: 'pompier', x: CASERNE.x - 1.8, z: CASERNE.z + 2.0, cap: PI - 0.4, tenue: { taille: 1.08, peau: PEAU, cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'casquette', c: '#2f3a5a', c2: '#c8302c' }, haut: '#2f3a5a', manches: 'longues', bas: { sorte: 'pantalon', c: '#2f3a5a' }, chaussures: '#2a2a2e', semelle: '#2a2a2e' } },
    { id: 'paysan', x: 7.2, z: -7.4, cap: 0, ronde: [[7.2, -7.4], [22.8, -7.4], [23.4, 3.8], [7.2, 4.0]], vitesse: 0.8, attente: [3, 7], tenue: { taille: 1.0, peau: '#e8bf98', cheveux: '#d8d4cc', coiffure: 'court', chapeau: { sorte: 'sugegasa', c: '#d9bd78', c2: '#c9a65a' }, haut: '#5a6a5a', manches: 'longues', mino: true, bas: { sorte: 'pantalon', c: '#4a4a40' }, chaussures: '#c9a65a', semelle: '#8a6a3a', yeux: 'plisses' } },
    { id: 'guide', x: Mu.x - 1.0 + 1.15, z: Mu.z - 2.15 + 1.25, cap: -2.4, tenue: { taille: 1.02, peau: '#f2c9a8', cheveux: '#4a3428', coiffure: 'queue', haut: '#a8452e', manches: 'longues', tablier: '#3a3a42', bas: { sorte: 'pantalon', c: '#3a3a42' }, chaussures: '#3a3236', semelle: '#3a3236' } },
    { id: 'enfant', x: 9, z: 26, cap: 0, ronde: [[9, 26], [9, 40], [26, 40], [28, 24]], vitesse: 1.6, attente: [0.5, 2.5], tenue: { taille: 0.8, peau: PEAU, cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'casquette', c: '#f2c443', c2: '#3a8a5a' }, haut: '#ffffff', manches: 'courtes', bas: { sorte: 'short', c: '#3d5a8f' }, chaussures: P.blanc, semelle: '#3a3236', canne: true } },
    { id: 'photographe', x: BELVEDERE.x + 2.4, z: BELVEDERE.z - 0.6, cap: vers(BELVEDERE.x, BELVEDERE.z, 0, 0) - 0.2, tenue: { taille: 1.06, peau: PEAU, cheveux: '#6a4030', coiffure: 'queue', chapeau: { sorte: 'bob', c: '#c9b48a' }, haut: '#4a7a9a', manches: 'longues', bas: { sorte: 'pantalon', c: '#4a4a56' }, chaussures: '#7a5a3a', semelle: '#3a3236', sac: { sorte: 'dos', c: '#c84a3a', c2: '#7a2a20' }, appareil: true } },
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
  const lignes = [...CHEMINS, SENTIER, ...passants.filter((p) => p.ronde).map((p) => [...p.ronde, p.ronde[0]])];
  for (const [x, z, r] of buissons) if (lignes.every((l) => surLaLigne(l, x, z).d > r + 1.4)) monde.cercle(x, z, r + 0.15);

  // ---------------------------------------------------------------- Ce qu'on peut faire (tout passe par `jeu`)
  const parler = (id) => ({ id, passant: id, verbe: 'parler', action: (jeu) => jeu.dire(jeu.txn(id), id) });
  const xIr = Mu.x + Mu.IR.x, zIr = Mu.z + Mu.IR.z;
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
        const xc = WASHI.x - 0.4, zc = WASHI.z - 0.6;
        jeu.cadrerDeCote(xc, yW + 0.85, zc, { distance: 3.6, haut: 1.5 });
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
  if (z < -60 && surLaLigne(ROUTE, x, z).d < 2.2) return [P.route, M.route];
  // l'esplanade du sanctuaire : le gravier clair ; les dalles de l'allée
  const S = SANCTUAIRE;
  if (x > S.x0 && x < S.x1 + 0.4 && z > S.z0 && z < S.z1) return [Math.abs(z - S.marches[2]) < 0.9 ? P.pierre : P.terreClaire, Math.abs(z - S.marches[2]) < 0.9 ? M.dalles : M.terre];
  if (x > S.torii[0] - 1 && x < S.x1 && Math.abs(z - S.marches[2]) < 1.0) return [P.pierre, M.dalles];
  // le sentier et le belvédère
  if (x < -28 && z < -36) {
    if (surLaLigne(SENTIER, x, z).d < 1.15 + 0.25 * bruit || Math.hypot(x - BELVEDERE.x, z - BELVEDERE.z) < BELVEDERE.r + 0.6) return [P.chemin, M.terre];
  }
  // la montagne : la forêt (le sous-bois)
  if (r > rT + 1.5 && !(riv.dedans && riv.d < 30)) return [bruit > 0.55 ? P.jungleFonce : P.herbeFonce, M.sousBois];
  // les rizières : le fond (sous l'eau), la diguette d'herbe
  for (const [x0, x1, z0, z1] of RIZIERES) {
    const e = Math.max(Math.abs(x - (x0 + x1) / 2) - (x1 - x0) / 2, Math.abs(z - (z0 + z1) / 2) - (z1 - z0) / 2);
    if (e < -0.5) return [P.boue, M.terre];
    if (e < 0.15) return [P.herbeFonce, M.herbe];
  }
  // le lit du ruisseau
  if (z > -24 && z < 2 && surLaLigne(RUISSEAU, x, z).d < 0.95) return [P.pierreFonce, M.pierre];
  // les chemins de terre
  for (const c of CHEMINS) if (surLaLigne(c, x, z).d < 1.15 + 0.2 * bruitDoux(x, z, 1.5)) return [P.chemin, M.terre];
  // autour des maisons : la terre battue, les galets
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
    noms: { okami: 'L’hôtesse du minshuku', grandmere: 'La grand-mère du papier', danseur: 'Le danseur', musicien: 'Le musicien', pompier: 'Le pompier', paysan: 'Le paysan', guide: 'La guide du musée', enfant: 'L’écolier', photographe: 'La photographe', gardien: 'Le gardien du sanctuaire', videaste: '@random_japan_place' },
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
    guide: ['Bienvenue dans la maison-musée ! Elle a plus de deux cents ans.', 'Le foyer, l’irori, chauffait toute la maison ; sa fumée montait dans le grenier et protégeait le chaume des insectes.', 'Autrefois, sous le plancher, près du foyer, les familles fabriquaient en secret le salpêtre de la poudre à canon, pour le seigneur de Kaga…'],
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
    noms: { okami: 'Inn hostess', grandmere: 'Paper-making grandma', danseur: 'Dancer', musicien: 'Musician', pompier: 'Firefighter', paysan: 'Farmer', guide: 'Museum guide', enfant: 'Village boy', photographe: 'Photographer', gardien: 'Shrine keeper', videaste: '@random_japan_place' },
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
    guide: ['Welcome to the museum house! It’s more than two hundred years old.', 'The hearth, the irori, heated the whole house; its smoke rose into the attic and protected the thatch from insects.', 'Long ago, under the floor near the hearth, families secretly made saltpetre for gunpowder, for the lord of Kaga…'],
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
    noms: { okami: '民宿の　おかみさん', grandmere: '和紙の　おばあさん', danseur: 'おどり手', musicien: 'はやしの　おじさん', pompier: '消防団の　人', paysan: 'お百姓さん', guide: '民俗館の　ガイドさん', enfant: '村の　子ども', photographe: 'カメラマン', gardien: '神社の　おじいさん', videaste: '@random_japan_place' },
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
    guide: ['民俗館へ　ようこそ！ この　家は　200年いじょう　前に　たてられました。', 'いろりの　火で　家ぜんたいを　あたため、けむりが　屋根うらに　のぼって、かやを　虫から　守ったんです。', 'むかし、いろりの　そばの　床下で、加賀の　お殿さまの　ために　ひみつで　火薬の　塩硝を　つくっていたんですよ……'],
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
