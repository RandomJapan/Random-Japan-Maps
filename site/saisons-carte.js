// ================================================================
//  Les détails de saison peints sur la carte (2026-10-12, demande du
//  propriétaire : « un lac gelé en hiver, au printemps plus fleuri… ») :
//  - les cerisiers en fleurs aux lieux célèbres : le front des cerisiers monte
//    de Kyūshū (fin mars) à Hokkaidō (mai) ; Okinawa en janvier, Kawazu en février ;
//  - les couleurs d'automne des vallées et montagnes célèbres (fin septembre
//    dans le Daisetsuzan, début décembre à Kyūshū) et les ginkgos dorés des villes ;
//  - les champs de fleurs : pruniers, glycines, némophiles, shibazakura,
//    tulipes, lavande, tournesols, hortensias, iris, lys araignées, kochias… ;
//  - les lieux du tableau à leur plus beau ce mois-là (colonne Saisons) ;
//  - l'hiver : la neige au sol du nord et de la côte de la mer du Japon, les
//    lacs gelés, la banquise d'Okhotsk (février – mars).
//  Tout est peint sur le relief, sous son ombrage, en touches d'aquarelle fixées au
//  sol (elles grandissent avec la carte quand on zoome), et ne change qu'une fois
//  par jour. Les couches naissent avec la carte (styleSaison, dans le style de
//  départ) : en ajouter après coup redessinait tout le relief pendant le chargement.
//  De près, un tapis de feuilles d'érable et de ginkgo, ou de pétales de cerisier, jonche le sol (symboles
//  couchés sur le relief, chacun à sa place : ils grandissent en zoomant, aucun n'apparaît en route). Il se
//  prépare pendant qu'on s'approche (et dès le départ d'un plongeon) : il est là quand on arrive.
// ================================================================

import { lisse, md, ecart, floraison, enFleurs, picAutomne, neigeAuSol } from './phenologie.js';
import { atlasSol } from './particules.js';

// ---------------------------------------------------------------- Les lieux célèbres
// Cerisiers : [lng, lat, altitude (m), rayon (km), jour de floraison s'il n'est pas celui de la latitude]
const CERISIERS = [
  [140.10, 41.43, 30, 4], [140.757, 41.797, 10, 3.5], [141.31, 43.05, 60, 3.5], [142.40, 42.38, 50, 4], [142.37, 43.77, 120, 3],
  [140.465, 40.607, 40, 4.5], [140.563, 39.594, 50, 4], [141.12, 39.29, 60, 4], [141.15, 39.70, 120, 3.5], [140.70, 38.02, 30, 4.5],
  [140.49, 37.40, 300, 3], [139.93, 37.49, 220, 3.5], [140.50, 37.76, 100, 3.5], [140.33, 38.25, 150, 3.5], [140.87, 38.26, 40, 3.5],
  [139.77, 35.715, 10, 3], [139.75, 35.69, 20, 3], [139.70, 35.64, 10, 3], [139.38, 36.14, 30, 3.5], [139.67, 36.13, 20, 3],
  [139.55, 35.32, 20, 3], [139.15, 35.25, 30, 3], [138.802, 35.501, 400, 3], [138.06, 35.83, 800, 3.5], [137.969, 36.239, 590, 3.5],
  [138.25, 37.10, 10, 3.5], [136.662, 36.562, 50, 3.5], [137.21, 36.70, 10, 3], [136.62, 35.60, 260, 3], [136.90, 35.18, 10, 3.5],
  [136.94, 35.39, 30, 3], [137.25, 36.14, 570, 3], [138.99, 34.76, 20, 3.5, 41], [135.86, 34.37, 400, 4.5], [135.795, 35.02, 70, 3.5],
  [135.67, 35.015, 40, 3.5], [135.82, 34.95, 60, 3], [134.694, 34.839, 40, 3.5], [135.526, 34.687, 20, 3.5], [135.84, 34.685, 100, 3.5],
  [136.25, 35.276, 90, 3], [136.07, 35.45, 90, 3.5], [135.17, 34.227, 20, 3], [133.93, 34.667, 10, 3], [132.45, 34.395, 10, 3],
  [132.178, 34.168, 20, 3], [133.05, 35.475, 20, 3], [134.0, 35.07, 140, 3], [133.67, 34.20, 300, 3], [132.766, 33.845, 100, 3.5],
  [133.53, 33.56, 20, 3], [130.383, 33.585, 20, 3.5], [130.706, 32.806, 50, 3.5], [130.55, 31.59, 30, 3], [130.69, 33.46, 100, 3],
  [131.40, 32.97, 300, 3], [130.874, 33.884, 20, 3], [127.98, 26.59, 100, 3.5], [127.93, 26.63, 300, 3], [127.93, 26.69, 50, 2.5],
];
// Couleurs d'automne : [lng, lat, altitude (m), rayon (km), 'ginkgo' pour les allées de ginkgos des villes]
const AUTOMNE = [
  [142.85, 43.66, 1300, 8], [142.95, 43.72, 700, 6], [141.16, 42.97, 300, 6], [145.0, 44.10, 250, 6], [144.1, 43.43, 420, 6],
  [140.67, 42.0, 130, 5], [140.68, 42.86, 400, 6], [140.87, 40.65, 900, 8], [140.95, 40.55, 350, 5], [140.92, 40.45, 400, 6],
  [140.85, 39.95, 1100, 7], [140.70, 38.75, 300, 5], [140.65, 39.68, 200, 4], [141.25, 38.99, 50, 4], [140.43, 38.15, 1000, 7],
  [140.20, 37.70, 1300, 7], [139.25, 36.95, 1400, 6], [140.437, 38.31, 300, 4], [141.10, 38.99, 60, 3.5], [139.52, 36.74, 1000, 7],
  [139.80, 36.97, 500, 5], [140.40, 36.77, 120, 4], [139.24, 35.625, 400, 4], [138.74, 35.52, 830, 4], [139.05, 35.24, 700, 6],
  [138.6, 36.35, 950, 6], [137.64, 36.25, 1500, 6], [137.62, 36.82, 400, 6], [137.33, 35.17, 100, 4], [136.906, 36.257, 500, 4],
  [135.774, 34.976, 60, 3], [135.794, 35.015, 80, 3], [135.67, 35.015, 50, 3.5], [135.785, 34.995, 100, 3], [135.834, 35.12, 220, 3.5],
  [135.763, 35.122, 300, 3.5], [135.47, 34.85, 200, 4], [135.59, 34.21, 850, 5], [135.86, 34.46, 450, 4], [136.35, 35.07, 200, 4],
  [132.32, 34.29, 50, 3], [132.18, 34.60, 500, 6], [133.23, 34.85, 400, 5], [133.55, 35.37, 900, 7], [134.24, 34.53, 500, 4],
  [133.83, 33.88, 500, 7], [133.12, 33.77, 1500, 6], [133.92, 35.25, 300, 5], [131.15, 33.43, 200, 6], [131.25, 33.1, 1000, 7],
  [131.30, 32.70, 300, 4], [130.92, 33.07, 600, 5], [130.87, 31.92, 900, 7], [130.95, 32.55, 600, 6], [130.27, 32.75, 900, 5],
  [139.717, 35.675, 30, 2.5, 'ginkgo'], [135.50, 34.68, 10, 3, 'ginkgo'], [141.34, 43.07, 20, 2.5, 'ginkgo'], [139.68, 35.68, 40, 2.5, 'ginkgo'],
];
// Champs de fleurs : [lng, lat, rayon (km), motif, du (mois-jour), au (mois-jour)]
const CHAMPS = [
  [142.42, 43.42, 2.2, 'lavande', 701, 731], [142.47, 43.55, 2.2, 'tulipes', 701, 915], [141.88, 43.74, 2.2, 'tournesols', 720, 820],
  [141.92, 43.58, 2.2, 'colza', 515, 605], [143.08, 44.19, 2, 'shibazakura', 510, 605], [140.595, 36.40, 2, 'nemophiles', 420, 515],
  [140.598, 36.405, 1.8, 'kochias', 1001, 1025], [138.62, 35.47, 2, 'shibazakura', 415, 531], [139.10, 35.985, 1.6, 'shibazakura', 410, 510],
  [139.52, 36.31, 1.8, 'glycines', 415, 515], [130.79, 33.83, 1.6, 'glycines', 420, 510], [136.96, 36.65, 2, 'tulipes', 415, 505],
  [140.453, 36.373, 2, 'ume', 215, 320], [135.735, 35.03, 1.6, 'ume', 210, 310], [130.535, 33.52, 1.8, 'ume', 201, 305],
  [139.06, 35.115, 1.6, 'ume', 115, 305], [139.55, 35.335, 1.6, 'hortensias', 605, 705], [139.07, 35.24, 2.2, 'hortensias', 620, 720],
  [139.32, 35.88, 1.6, 'higanbana', 915, 1005], [130.6, 31.25, 2.4, 'colza', 105, 215], [140.55, 35.95, 1.8, 'iris', 601, 625],
  [139.83, 35.75, 1.4, 'iris', 601, 625], [139.39, 35.70, 2, 'cosmos', 920, 1020],
];
// Lacs qui gèlent : nom (OpenStreetMap, data/eaux-japon.geojson) → [du, au] (mois-jour)
const HOKKAIDO = [1225, 331];
const LACS_GELES = {
  阿寒湖: HOKKAIDO, 屈斜路湖: HOKKAIDO, 網走湖: HOKKAIDO, 然別湖: HOKKAIDO, サロマ湖: [110, 331], 風蓮湖: HOKKAIDO, 糠平湖: HOKKAIDO,
  能取湖: [110, 331], 大沼: HOKKAIDO, パンケトー: HOKKAIDO, 塘路湖: HOKKAIDO, コムケ湖: HOKKAIDO, シューパロ湖: HOKKAIDO,
  温根沼: HOKKAIDO, 厚岸湖: [110, 315], 静内調整池: HOKKAIDO, 摩周湖: [201, 310], 桧原湖: [105, 320], 秋元湖: [105, 320],
  小野川湖: [105, 320], 岩洞湖: [101, 320], 諏訪湖: [115, 220], 有峰湖: [1215, 415], 山中湖: [120, 220],
};
// La neige au sol par préfecture (numéro JIS) : [force au cœur de l'hiver, latitude, altitude où vivent les gens, côté mer du Japon]
const NEIGE_PREFECTURES = {
  1: [0.85, 43.4, 100], 2: [0.8, 40.7, 100, 1], 3: [0.55, 39.6, 250], 5: [0.78, 39.7, 150, 1], 6: [0.75, 38.4, 250, 1],
  4: [0.25, 38.4, 100], 7: [0.4, 37.4, 350], 15: [0.7, 37.6, 200, 1], 16: [0.6, 36.6, 200, 1], 17: [0.45, 36.6, 150, 1],
  18: [0.45, 35.9, 200, 1], 20: [0.45, 36.2, 700], 21: [0.3, 35.9, 500], 10: [0.2, 36.5, 500], 9: [0.15, 36.7, 400],
  31: [0.25, 35.4, 300, 1], 32: [0.15, 35.1, 300, 1],
};
// La banquise d'Okhotsk arrive fin janvier, reste en février et début mars, repart fin mars. La côte qu'elle borde :
const COTE_OKHOTSK = [[141.68, 45.40], [141.95, 45.50], [142.20, 45.25], [142.55, 44.85], [142.95, 44.55], [143.35, 44.35],
  [143.75, 44.15], [144.10, 44.03], [144.40, 43.98], [144.70, 43.93], [144.95, 44.05], [145.15, 44.20], [145.33, 44.34],
  [145.20, 44.10], [145.05, 43.85], [145.10, 43.60], [145.30, 43.45]];

// ---------------------------------------------------------------- Les couleurs des touches d'aquarelle
const COULEURS = {
  sakura: ['#f0a9bf', '#e78fab', '#f6c4d3', '#ea9ab3'],
  ume: ['#f3cfd9', '#e39ab0', '#f7e1e6'],
  momiji: ['#c9472c', '#d8692f', '#b8341f', '#e09a3a', '#a8321f', '#cf5a2a'],
  ginkgo: ['#e8c547', '#f0d35c', '#d9b23a'],
  glycines: ['#a98bc9', '#8f6fb8', '#c4abdc'],
  hortensias: ['#7f9fd6', '#a58fd0', '#6d8ccc'],
  kochias: ['#c8463a', '#b8382e', '#d65a44'],
  nemophiles: ['#7fa7d9', '#9dbde6', '#6b93cc'],
  colza: ['#f2d64b', '#e8c93c'],
  tournesols: ['#f0c030', '#e8b020'],
  higanbana: ['#c8322a', '#e04a3a'],
  cosmos: ['#e996bf', '#f5c3da', '#d6669e'],
  fleurs: ['#e996bf', '#a98bc9', '#f2d64b', '#d9453a', '#7fa7d9'],
  shibazakura: ['#e77fb0', '#d65d99', '#f2a6c8'],
  tulipes: ['#d9453a', '#f0c23c', '#d6609a', '#e8843a'],
  lavande: ['#8e72b8', '#7a5ea8', '#9b82c2'],
  iris: ['#6f5cb0', '#8c79c4'],
};

/** Un nombre de 0 à 1 qui dépend de la graine (toujours le même). */
const hasard = (g) => { const s = Math.sin(g * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

/** Les fêlures et les traînées de neige d'un lac gelé (un motif, dessiné la première fois qu'un lac gèle). */
function dessinerGlace() {
  const T = 64, k = 2;
  const toile = document.createElement('canvas');
  toile.width = toile.height = T * k;
  const c = toile.getContext('2d');
  c.scale(k, k);
  let g = 3.1;
  const h = () => hasard(g += 1.618);
  // la neige poussée par le vent, en traînées
  for (let i = 0; i < 7; i++) {
    const x = h() * T, y = h() * T, l = 8 + 14 * h();
    for (const dx of [-T, 0, T]) for (const dy of [-T, 0, T]) {
      const grad = c.createLinearGradient(x + dx - l / 2, 0, x + dx + l / 2, 0);
      grad.addColorStop(0, 'rgba(255,255,255,0)'); grad.addColorStop(0.5, 'rgba(255,255,255,0.55)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = grad;
      c.beginPath(); c.ellipse(x + dx, y + dy, l / 2, 1.4 + h(), -0.35, 0, 7); c.fill();
    }
  }
  // les fêlures : de fines lignes brisées
  c.strokeStyle = 'rgba(70, 110, 120, 0.42)';
  c.lineWidth = 0.5;
  for (let i = 0; i < 6; i++) {
    let x = h() * T, y = h() * T, a = h() * 6.28;
    const pts = [[x, y]];
    for (let s = 0; s < 5; s++) { a += (h() - 0.5) * 1.4; x += Math.cos(a) * 5; y += Math.sin(a) * 5; pts.push([x, y]); }
    for (const dx of [-T, 0, T]) for (const dy of [-T, 0, T]) {
      c.beginPath();
      pts.forEach(([px, py], n) => (n ? c.lineTo(px + dx, py + dy) : c.moveTo(px + dx, py + dy)));
      c.stroke();
    }
  }
  return c.getImageData(0, 0, T * k, T * k);
}

// ---------------------------------------------------------------- Les formes
const KM_LAT = 110.57;
const kmLng = (lat) => 111.32 * Math.cos((lat * Math.PI) / 180);

/**
 * Les touches d'aquarelle d'un lieu en fleurs ou en couleurs (refaites le 2026-10-20 : de grands polygones de
 * couleur unie, transparents et à bord net, se superposaient en auréoles ; le propriétaire voulait plus réaliste).
 * Ce sont maintenant des coups de pinceau aux bords fondus : des traits courts, épais et flous (couches « line »,
 * une par taille, voir TAILLES). Quelques grands lavis très doux teintent le lieu, puis des touches plus petites et
 * plus vives, serrées en bosquets, le moirent ; elles s'éclaircissent vers le bord, sans contour. Elles grandissent
 * avec la carte quand on zoome : aucune n'apparaît en route. (Un motif répété, le 2026-10-12, s'écartait puis se
 * redoublait à chaque niveau de zoom : le propriétaire a trouvé ça bizarre.)
 * Propriétés : c (couleur), o (opacité), t (la taille : un rang de TAILLES).
 */
function touches(lng, lat, rayon, motif, force) {
  const couleurs = COULEURS[motif];
  let g = lng * 31.7 + lat * 17.3;
  const h = () => hasard(g += 1.618);
  const kx = kmLng(lat);
  const deux = (x) => Math.round(x * 100) / 100;
  const res = [];
  // un coup de pinceau : un trait un peu allongé, dans un sens au hasard (x, y : km depuis le lieu)
  const touche = (x, y, diametre, couleur, opacite) => {
    const a = h() * Math.PI, l = diametre * (0.25 + 0.35 * h());
    const dx = (l / 2) * Math.cos(a), dy = (l / 2) * Math.sin(a);
    const pente = 1 - 0.55 * Math.min(1, Math.hypot(x, y) / rayon) ** 2; // plus clair vers le bord
    res.push({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [[lng + (x - dx) / kx, lat + (y - dy) / KM_LAT], [lng + (x + dx) / kx, lat + (y + dy) / KM_LAT]] },
      properties: { c: couleur, o: deux(force * opacite * pente), t: rangTaille(diametre) },
    });
  };
  const auHasard = (portee) => {
    const d = Math.sqrt(h()) * portee, a = h() * 2 * Math.PI;
    return [d * Math.sin(a), d * Math.cos(a)];
  };
  // les lavis : grands, très doux
  const lavis = 4 + Math.round(rayon / 3);
  for (let i = 0; i < lavis; i++) {
    const [x, y] = auHasard(rayon * 0.45);
    touche(x, y, rayon * (0.55 + 0.25 * h()), couleurs[i % 2 ? 0 : Math.floor(h() * couleurs.length)], 0.13 + 0.06 * h());
  }
  // les bosquets : des touches serrées, plus vives, plus grandes au cœur
  const taille = 0.7 + rayon / 20;
  for (let b = 0; b < 6; b++) {
    const [bx, by] = auHasard(rayon * 0.7);
    const n = Math.round(6 + rayon * 0.8);
    for (let i = 0; i < n; i++) {
      const e = rayon * 0.14 * Math.sqrt(-2 * Math.log(1 - 0.999 * h())), a = h() * 2 * Math.PI;
      const x = bx + e * Math.sin(a), y = by + e * Math.cos(a);
      const coeur = 1.25 - 0.5 * Math.min(1, Math.hypot(x, y) / rayon);
      touche(x, y, taille * (0.35 + 0.9 * h()) * coeur, couleurs[Math.floor(h() * couleurs.length)], 0.28 + 0.2 * h());
    }
  }
  // quelques touches éparses entre les bosquets
  const epars = Math.round(8 + rayon);
  for (let i = 0; i < epars; i++) {
    const [x, y] = auHasard(rayon * 0.9);
    touche(x, y, taille * (0.3 + 0.6 * h()), couleurs[Math.floor(h() * couleurs.length)], 0.22 + 0.15 * h());
  }
  return res;
}

// Le tapis de feuilles : préparé à partir de ce zoom (la couche se montre à 10,5), refait au plus toutes les 250 ms
// pendant un mouvement, pour les 10 lieux en saison les plus proches du centre ; avant un plongeon, ceux à moins de
// 25 km (plus leur rayon) du lieu d'arrivée
const ZOOM_TAPIS = 9.5, ENTRE_TAPIS = 250, MAX_TAPIS = 10, RAYON_ARRIVEE = 25;
// Les images du tapis (particules.js, atlasSol : 4 × 2 cases de 128 px) : trois érables, un ginkgo, quatre pétales
const IMAGES_TAPIS = ['feuille-0', 'feuille-1', 'feuille-2', 'feuille-3', 'petale-0', 'petale-1', 'petale-2', 'petale-3'];
const TAPIS = {
  momiji: ['feuille-0', 'feuille-1', 'feuille-2', 'feuille-0', 'feuille-1', 'feuille-2', 'feuille-3'],
  ginkgo: ['feuille-3'],
  sakura: ['petale-0', 'petale-1', 'petale-2', 'petale-3'],
  ume: ['petale-2', 'petale-3'],
};

/**
 * Le tapis de feuilles ou de pétales tombés d'un lieu (2026-10-12, « fais de vraies feuilles sur le sol ») : des
 * points fixes sur la carte, en tas autour de sept bosquets (et quelques-uns épars), chacun avec son image, son
 * orientation et sa taille.
 */
function tapis(lng, lat, rayon, motif, force) {
  const images = TAPIS[motif];
  if (!images) return [];
  let g = lng * 53.1 + lat * 29.7;
  const h = () => hasard(g += 1.618);
  const bosquets = Array.from({ length: 7 }, () => {
    const d = Math.sqrt(h()) * rayon * 0.7, a = h() * 2 * Math.PI;
    return [d * Math.sin(a), d * Math.cos(a)];
  });
  const res = [];
  const n = Math.round((100 + rayon * 40) * force);
  for (let i = 0; i < n; i++) {
    let x, y;
    if (h() < 0.75) {
      const [bx, by] = bosquets[Math.floor(h() * bosquets.length)];
      const d = rayon * 0.12 * Math.sqrt(-2 * Math.log(1 - 0.999 * h())), a = h() * 2 * Math.PI;
      x = bx + d * Math.sin(a); y = by + d * Math.cos(a);
    } else {
      const d = Math.sqrt(h()) * rayon * 0.85, a = h() * 2 * Math.PI;
      x = d * Math.sin(a); y = d * Math.cos(a);
    }
    res.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lng + x / kmLng(lat), lat + y / KM_LAT] },
      properties: { i: images[Math.floor(h() * images.length)], r: Math.round(h() * 360), s: Math.round((0.75 + 0.5 * h()) * 100) / 100, o: Math.round(force * 10) / 10 },
    });
  }
  return res;
}

/** Distance (km) d'un point à une ligne brisée. */
function distanceLigne(lng, lat, ligne) {
  const kx = kmLng(lat);
  let d = Infinity;
  for (let i = 1; i < ligne.length; i++) {
    const ax = (ligne[i - 1][0] - lng) * kx, ay = (ligne[i - 1][1] - lat) * KM_LAT;
    const bx = (ligne[i][0] - lng) * kx, by = (ligne[i][1] - lat) * KM_LAT;
    const vx = bx - ax, vy = by - ay;
    const t = Math.max(0, Math.min(1, -(ax * vx + ay * vy) / (vx * vx + vy * vy)));
    d = Math.min(d, Math.hypot(ax + vx * t, ay + vy * t));
  }
  return d;
}

/** Les plaques de la banquise, tirées une fois pour toutes : [polygone, distance à la côte, tirage]. */
let plaques = null;
function preparerBanquise() {
  plaques = [];
  let g = 9.7;
  const h = () => hasard(g += 1.618);
  for (let i = 0; i < 1400; i++) {
    const lng = 141.6 + 4.3 * h(), lat = 43.35 + 2.3 * h();
    const d = distanceLigne(lng, lat, COTE_OKHOTSK);
    if (d > 75) continue;
    const r = 0.9 + 2.6 * h() * Math.exp(-d / 60), cotes = 5 + Math.floor(3 * h()), a0 = h() * 6.28;
    const anneau = [];
    for (let k = 0; k <= cotes; k++) {
      const a = a0 + ((k % cotes) / cotes) * 6.28, rr = r * (0.65 + 0.5 * hasard(i * 9.1 + k));
      anneau.push([lng + (rr * Math.cos(a)) / kmLng(lat), lat + (rr * Math.sin(a)) / KM_LAT]);
    }
    plaques.push([{ type: 'Polygon', coordinates: [anneau] }, d, h()]);
  }
}

/** Entre deux mois-jours (le premier peut être après le second : par-dessus le nouvel an), avec 5 jours de fondu. */
function entre(j, du, au) {
  const a = md(du), b = md(au);
  const depuis = ecart(j, a), jusque = ecart(b, j);
  const duree = ((b - a + 365) % 365);
  if (depuis < -6 || jusque < -6 || depuis > duree + 6) return 0;
  return lisse(-5, 1, depuis) * lisse(-5, 1, jusque);
}

// ---------------------------------------------------------------- Ce jour-là
const vide = () => ({ type: 'FeatureCollection', features: [] });
const JOURS_MOIS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Les lieux en fleurs ou en couleurs ce jour-là : [lng, lat, rayon, motif, force] (les lieux du tableau d'abord). */
function lieuxEnSaison(j, lieux) {
  const res = [];
  const ajouter = (lng, lat, rayon, motif, force) => {
    if (force < 0.08) return;
    // un lieu célèbre tout près d'un lieu du tableau de la même sorte n'est pas peint deux fois
    if (res.some((t) => t[3] === motif && Math.hypot((t[0] - lng) * kmLng(lat), (t[1] - lat) * KM_LAT) < 5)) return;
    res.push([lng, lat, rayon, motif, Math.round(force * 10) / 10]);
  };
  for (const l of lieux) {
    for (const p of l.saisons?.periodes || []) {
      const motif = { cerisiers: 'sakura', fleurs: 'fleurs', automne: 'momiji' }[p.sorte];
      if (!motif) continue;
      // du premier au dernier mois de la période, avec un fondu de quelques jours
      const force = p.mois.reduce((m, oui, i) => (oui ? Math.max(m, entre(j, (i + 1) * 100 + 1, (i + 1) * 100 + JOURS_MOIS[i])) : m), 0);
      ajouter(l.lng, l.lat, 4.5, motif, force);
    }
  }
  // (les rayons des listes ×1,5 : toute la ville ou la vallée est en fleurs ou en couleurs ; les champs ×1,3)
  for (const [lng, lat, alt, rayon, debut] of CERISIERS) ajouter(lng, lat, rayon * 1.5, 'sakura', enFleurs(j, debut ?? floraison(lat, lng, alt)));
  for (const [lng, lat, alt, rayon, sorte] of AUTOMNE) {
    const pic = picAutomne(lat, alt) + (sorte ? 4 : 0);
    ajouter(lng, lat, rayon * 1.5, sorte || 'momiji', lisse(pic - 20, pic - 6, j) * (1 - lisse(pic + 8, pic + 20, j)));
  }
  for (const [lng, lat, rayon, motif, du, au] of CHAMPS) ajouter(lng, lat, rayon * 1.3, motif, entre(j, du, au));
  return res;
}

/** La neige au sol par préfecture ce jour-là : [[code, force]] (côté mer du Japon, elle tient comme 300 m plus haut). */
function neigesDuJour(j) {
  return Object.entries(NEIGE_PREFECTURES).map(([code, [force, lat, alt, merDuJapon]]) => {
    const v = force * neigeAuSol(lat + (merDuJapon ? 300 / 220 : 0), alt, j);
    return [Number(code), Math.round(v * 20) / 20];
  }).filter(([, v]) => v >= 0.1); // en dessous, elle ne se voit pas : la couche (et ses 120 Ko de contours) attend
}
const lacsGeles = (j) => Object.entries(LACS_GELES).filter(([, [du, au]]) => entre(j, du, au) > 0.5).map(([nom]) => nom);
const forceBanquise = (j) => Math.round(lisse(22, 46, j) * (1 - lisse(69, 91, j)) * 10) / 10;
function banquise(force) {
  if (!plaques) preparerBanquise();
  return { type: 'FeatureCollection', features: plaques.filter(([, d, tirage]) => tirage < force * Math.exp(-d / 24) * 1.15).map(([geometry]) => ({ type: 'Feature', geometry, properties: {} })) };
}

// ---------------------------------------------------------------- Les couches
const filtreNeige = (neiges) => ['in', ['get', 'code'], ['literal', neiges.map(([code]) => code)]];
const opaciteNeige = (neiges) => ['match', ['get', 'code'], ...neiges.flat(), 0];
const filtreLacs = (geles) => ['all', ['==', ['get', 't'], 'lac'], ['in', ['get', 'nom'], ['literal', geles]]];
const sombreDe = (p) => 1 - 0.55 * p.nuit; // la nuit, les couleurs des fleurs et des feuilles s'éteignent un peu

// Les touches d'aquarelle, par taille (km) : une couche par taille, dont la largeur ne dépend que du zoom (fixée au
// sol, elle double à chaque niveau, comme la carte). Une largeur lue sur chaque touche (zoom et donnée) est calculée
// tuile par tuile, au zoom de chaque tuile : de biais, deux tuiles voisines de niveaux différents dessinaient la même
// touche à deux tailles, coupée net à leur frontière (vu le 2026-10-20).
const TAILLES = [12, 7.5, 4.7, 2.95, 1.85, 1.15, 0.72, 0.45]; // les plus grandes dessous
const rangTaille = (km) => TAILLES.reduce((r, t, k) => (Math.abs(Math.log(km / t)) < Math.abs(Math.log(km / TAILLES[r])) ? k : r), 0);
const PX_KM = 13.083 / Math.cos((35 * Math.PI) / 180); // px par km au zoom 10 (au milieu du Japon)
const auSol = (px10) => ['interpolate', ['exponential', 2], ['zoom'], 6, px10 / 16, 16, px10 * 64];
const TACHES = TAILLES.map((km, k) => ({
  id: `saison-taches-${k}`,
  largeur: auSol(km * PX_KM),
  flou: auSol(km * PX_KM * (km > 2 ? 0.5 : 0.4)), // bords fondus : la moitié de la largeur pour les lavis
}));

/** Les couches de saison, et la couche avant laquelle chacune se place. */
const COUCHES = {
  // les touches d'aquarelle (des traits flous à bouts ronds, une couche par taille), sous l'ombrage du relief (qui
  // les modèle) ; de loin elles ne se voient pas : pas dessinées
  ...Object.fromEntries(TACHES.map(({ id }, k) => [id, [{
    type: 'line', source: 'saison-taches', minzoom: 6, filter: ['==', ['get', 't'], k], layout: { 'line-cap': 'round' },
  }, 'ombrage']])),
  // le tapis de feuilles, couché sur le relief : seulement de près
  'saison-feuilles': [{
    type: 'symbol',
    source: 'saison-feuilles',
    minzoom: 10.5,
    layout: {
      'icon-image': ['get', 'i'],
      'icon-rotate': ['get', 'r'],
      // il grandit en zoomant, un peu moins vite que la carte (×1,4 par niveau, elle ×2)
      'icon-size': ['interpolate', ['exponential', 1.4], ['zoom'], 10.5, ['*', 0.32, ['get', 's']], 16, ['*', 2.07, ['get', 's']]],
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-pitch-alignment': 'map',
      'icon-rotation-alignment': 'map',
    },
  }, 'fin'],
  'saison-neige': [{ type: 'fill', source: 'prefectures-neige', paint: { 'fill-antialias': false } }, 'ombrage'],
  'lacs-glace': [{ type: 'fill', source: 'eaux' }, 'lacs-bord'],
  'lacs-glace-motif': [{ type: 'fill', source: 'eaux', paint: { 'fill-pattern': 'motif-glace' } }, 'lacs-bord'],
  // la banquise d'Okhotsk, sous le relief (la terre la cache), au-dessus des lignes d'eau
  banquise: [{ type: 'fill', source: 'banquise' }, 'couleurs-relief'],
  'banquise-bord': [{ type: 'line', source: 'banquise', paint: { 'line-width': 0.7, 'line-opacity': 0.8 } }, 'couleurs-relief'],
};
const SOURCES = {
  // une touche déborde de sa tuile : la marge (256 px, 16 km au zoom 10) est plus large que la plus grande (12 km
  // de large) ; tolerance 0 : les traits très courts (de loin) ne sont pas effacés en simplifiant
  'saison-taches': () => ({ type: 'geojson', data: vide(), maxzoom: 10, buffer: 256, tolerance: 0 }),
  'saison-feuilles': () => ({ type: 'geojson', data: vide(), maxzoom: 12 }),
  'prefectures-neige': () => ({ type: 'geojson', data: 'data/prefectures.geojson', maxzoom: 7 }),
  banquise: () => ({ type: 'geojson', data: vide(), maxzoom: 9 }),
};

/** L'état de chaque couche ce jour-là : { id: { filtre?, paint } } (celles qui n'ont rien à montrer n'y sont pas). */
function etatCouches(j, p) {
  const res = {
    ...Object.fromEntries(TACHES.map(({ id, largeur, flou }) => [id, {
      paint: { 'line-color': ['get', 'c'], 'line-opacity': ['*', ['get', 'o'], sombreDe(p)], 'line-width': largeur, 'line-blur': flou },
    }])),
    'saison-feuilles': { paint: { 'icon-opacity': ['interpolate', ['linear'], ['zoom'], 10.5, 0, 11.4, ['*', ['get', 'o'], sombreDe(p)]] } },
  };
  const neiges = neigesDuJour(j);
  if (neiges.length) res['saison-neige'] = { filtre: filtreNeige(neiges), paint: { 'fill-color': p.neigeSol, 'fill-opacity': opaciteNeige(neiges) } };
  const geles = lacsGeles(j);
  if (geles.length) {
    res['lacs-glace'] = { filtre: filtreLacs(geles), paint: { 'fill-color': p.glace } };
    res['lacs-glace-motif'] = { filtre: filtreLacs(geles), paint: { 'fill-opacity': 0.9 * sombreDe(p) } };
  }
  if (forceBanquise(j) > 0.05) {
    res.banquise = { paint: { 'fill-color': p.glace, 'fill-opacity': 0.95 } };
    res['banquise-bord'] = { paint: { 'line-color': p.eau } };
  }
  return res;
}

/**
 * Les sources et les couches de saison à mettre dans le style de départ de la carte (app.js) : elles naissent avec
 * elle, sans redessiner le relief après coup. Le motif des lacs gelés vient plus tard (il faut le dessiner d'abord).
 * @returns { sources, avant(id) : les couches à placer juste avant la couche id }
 */
export function styleSaison(j, p) {
  const etat = etatCouches(j, p);
  delete etat['lacs-glace-motif'];
  const sources = {};
  const couches = {};
  for (const [id, { filtre, paint }] of Object.entries(etat)) {
    const [def, avant] = COUCHES[id];
    if (SOURCES[def.source] && !sources[def.source]) sources[def.source] = SOURCES[def.source]();
    (couches[avant] ||= []).push({ id, ...def, ...(filtre ? { filter: filtre } : {}), paint: { ...def.paint, ...paint } });
  }
  if (sources.banquise) sources.banquise.data = banquise(forceBanquise(j));
  return { sources, avant: (id) => couches[id] || [] };
}

// ---------------------------------------------------------------- Brancher sur la carte
/**
 * Tient les détails de saison à jour (ambiance.js appelle maj à chaque palier de couleurs et chaque jour).
 * Les touches d'aquarelle ne sont calculées que deux secondes après le chargement de la carte (elles ne se voient
 * qu'à partir du zoom 6 : le démarrage n'en est pas ralenti).
 * @param deps - { lieux() : les lieux du tableau (avec leurs saisons) } ; jDepart : le jour du style de départ
 * @returns { maj(j, p), majLieux() }
 */
export function brancherDetailsSaison(map, deps, jDepart) {
  let jour = null, couleurs = null, cleTaches = '', cleTapis = '', motifGlace = false, tachesPretes = false;
  let enSaison = []; // les lieux en fleurs ou en couleurs ce jour-là
  const tapisFaits = new Map(); // les tapis déjà tirés, par lieu
  let cleBanquise = jDepart ? String(forceBanquise(jDepart)) : ''; // la banquise du départ est déjà dans le style
  const etatPrecedent = {};

  // les touches attendent que la carte soit chargée
  const lancer = () => setTimeout(() => {
    // les images du tapis de feuilles, découpées dans l'atlas
    const atlas = atlasSol();
    const pixels = atlas.getContext('2d').getImageData(0, 0, atlas.width, atlas.height).data; // lu une seule fois
    IMAGES_TAPIS.forEach((nom, k) => {
      if (map.hasImage(nom)) return;
      const image = new ImageData(128, 128);
      for (let y = 0; y < 128; y++) {
        const debut = ((Math.floor(k / 4) * 128 + y) * atlas.width + (k % 4) * 128) * 4;
        image.data.set(pixels.subarray(debut, debut + 128 * 4), y * 128 * 4);
      }
      map.addImage(nom, image, { pixelRatio: 4 });
    });
    tachesPretes = true;
    if (jour !== null) maj(jour, couleurs);
  }, 2000);
  // (calculées quand le navigateur n'a rien d'autre à faire : sinon, une image figée au moment où l'on bouge la carte)
  const auCalme = (f) => (window.requestIdleCallback ? requestIdleCallback(f, { timeout: 3000 }) : setTimeout(f, 50));

  /**
   * Le tapis de feuilles : seulement pour les lieux en saison près de l'écran, de près : quelques centaines de points
   * au lieu de dizaines de milliers. La couche se montre au zoom 10,5 ; il se prépare dès 9,5, pendant qu'on
   * s'approche (2026-10-20 : refait seulement à l'arrêt, il apparaissait une seconde après l'arrivée d'un plongeon).
   */
  let vus = [], arrivee = []; // les lieux de la vue ; ceux du lieu d'arrivée d'un plongeon (gardés en plus)
  function poserTapis() {
    const proches = [...new Set([...vus, ...arrivee])];
    const cle = proches.map((t) => t.join(',')).join('|');
    if (cle === cleTapis) return;
    cleTapis = cle;
    const features = proches.flatMap((t) => {
      const k = t.join(',');
      if (!tapisFaits.has(k)) tapisFaits.set(k, tapis(...t));
      return tapisFaits.get(k);
    });
    map.getSource('saison-feuilles')?.setData({ type: 'FeatureCollection', features });
  }
  const loinDe = ([lng, lat], [x, y]) => Math.hypot((x - lng) * kmLng(lat), (y - lat) * KM_LAT);
  function majTapis() {
    if (!tachesPretes || map.getZoom() < ZOOM_TAPIS) return;
    const b = map.getBounds();
    const marge = 0.3 * (b.getEast() - b.getWest());
    const c = map.getCenter().toArray();
    const proches = enSaison.filter(([lng, lat, rayon]) => {
      const dx = rayon / kmLng(lat), dy = rayon / KM_LAT;
      return lng + dx > b.getWest() - marge && lng - dx < b.getEast() + marge && lat + dy > b.getSouth() - marge && lat - dy < b.getNorth() + marge;
    });
    // incliné, la vue va jusqu'à l'horizon : les plus proches du centre d'abord
    proches.sort((p1, p2) => loinDe(c, p1) - loinDe(c, p2));
    vus = proches.slice(0, MAX_TAPIS);
    poserTapis();
  }
  // Le tapis n'est fait que de symboles, dessinés par-dessus le relief : MapLibre redessinait pourtant les textures du
  // relief sous chaque tuile du tapis rechargée (toute donnée arrivée dans une tuile les périme), et le tapis change
  // maintenant pendant les mouvements. Rouage interne de MapLibre 6.11 (Map._handleTerrainDataEvent), à revérifier en
  // cas de mise à jour.
  const surRelief = map._handleTerrainDataEvent;
  if (typeof surRelief === 'function') {
    map._handleTerrainDataEvent = function (e, ...reste) {
      if (e.dataType === 'source' && e.sourceId === 'saison-feuilles') return undefined;
      return surRelief.call(this, e, ...reste);
    };
  }
  let dernierTapis = 0;
  map.on('move', () => {
    const t = performance.now();
    if (t - dernierTapis < ENTRE_TAPIS) return;
    dernierTapis = t;
    majTapis();
  });
  map.on('moveend', majTapis);
  if (map.loaded()) lancer();
  else {
    let lance = false;
    const une = () => { if (!lance) { lance = true; lancer(); } };
    map.once('load', une);
    setTimeout(une, 12000);
  }

  /** La couche avant laquelle placer une couche de saison ; 'fin' : juste après les couches du style de départ. */
  function ancre(avant) {
    if (avant !== 'fin') return map.getLayer(avant) ? avant : undefined;
    const ordre = map.getLayersOrder();
    return ordre[ordre.indexOf('cote-encre') + 1];
  }
  /** Ajoute une couche (et sa source) la première fois qu'elle sert : seulement si la saison change en cours de visite. */
  function ajouter(id) {
    if (map.getLayer(id)) return;
    const [def, avant] = COUCHES[id];
    if (!map.getSource(def.source)) map.addSource(def.source, SOURCES[def.source]());
    if (id === 'lacs-glace-motif' && !motifGlace) { map.addImage('motif-glace', dessinerGlace(), { pixelRatio: 2 }); motifGlace = true; }
    map.addLayer({ id, ...def }, ancre(avant));
  }
  /** Montre ou cache une couche : une couche sans rien à montrer n'est pas dessinée du tout. */
  function montrer(id, oui) {
    if (map.getLayer(id) && map.getLayoutProperty(id, 'visibility') !== (oui ? 'visible' : 'none')) map.setLayoutProperty(id, 'visibility', oui ? 'visible' : 'none');
  }

  function maj(j, p) {
    jour = j;
    couleurs = p;
    if (!map.style?._loaded) return;
    const etat = etatCouches(j, p);
    for (const id of Object.keys(COUCHES)) {
      const e = etat[id];
      if (!e) { montrer(id, false); continue; }
      ajouter(id);
      montrer(id, true);
      if (e.filtre && JSON.stringify(e.filtre) !== etatPrecedent[id]) {
        map.setFilter(id, e.filtre);
        etatPrecedent[id] = JSON.stringify(e.filtre);
      }
      for (const [k, v] of Object.entries(e.paint)) map.setPaintProperty(id, k, v); // sans effet si rien ne change
    }
    // les touches d'aquarelle (une fois par jour, après le chargement), puis le tapis de feuilles près de l'écran
    if (tachesPretes) {
      const lieux = lieuxEnSaison(j, deps.lieux());
      const cle = lieux.map((t) => t.join(',')).join('|');
      if (cle !== cleTaches) {
        cleTaches = cle;
        enSaison = lieux;
        tapisFaits.clear();
        arrivee = [];
        cleTapis = '';
        auCalme(() => {
          map.getSource('saison-taches').setData({ type: 'FeatureCollection', features: lieux.flatMap((t) => touches(...t)) });
          majTapis();
        });
      }
    }
    // la banquise
    const force = forceBanquise(j);
    if (force > 0.05 && String(force) !== cleBanquise) {
      cleBanquise = String(force);
      map.getSource('banquise').setData(banquise(force));
    }
  }

  return {
    maj,
    /** Les lieux du tableau sont arrivés : leurs saisons s'ajoutent aux taches. */
    majLieux() { if (jour !== null) { cleTaches = ''; maj(jour, couleurs); } },
    /** Avant un plongeon : le tapis autour du lieu d'arrivée ([lng, lat]), prêt avant que la caméra n'y soit. */
    preparerTapis(centre) {
      if (!tachesPretes) return;
      const proches = enSaison.filter((t) => loinDe(centre, t) < t[2] + RAYON_ARRIVEE);
      proches.sort((p1, p2) => loinDe(centre, p1) - loinDe(centre, p2));
      arrivee = proches.slice(0, MAX_TAPIS);
      poserTapis();
    },
  };
}
