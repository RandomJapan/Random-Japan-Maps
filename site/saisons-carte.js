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
//  Tout est peint sur le relief (des motifs de petits arbres et de fleurs, comme
//  les forêts pointillées des cartes anciennes, sous l'ombrage du relief), et ne
//  change qu'une fois par jour : chaque changement redessine le relief une fois.
// ================================================================

import { lisse, md, ecart, floraison, enFleurs, picAutomne, neigeAuSol } from './phenologie.js';

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

// ---------------------------------------------------------------- Les motifs (petits arbres et fleurs)
const ENCRE = 'rgba(53, 37, 26, ';
// n : arbres ou fleurs par tuile ; r : rayon des arbres (points) ; lavis : la couleur du voile peint sous la tache
const MOTIFS = {
  sakura: { sorte: 'touffes', couleurs: ['#f0b4c6', '#e89ab2', '#f6cdd9', '#e28aa6'], n: 32, r: [2.3, 3.4], nuage: true, lavis: '#e58ea9' },
  ume: { sorte: 'touffes', couleurs: ['#f7e7ec', '#fbf6f2', '#e39ab0', '#efc2cf'], n: 36, r: [1.8, 2.6], nuage: true, lavis: '#eec6d1' },
  momiji: { sorte: 'touffes', couleurs: ['#c9472c', '#d8692f', '#b8341f', '#e09a3a', '#c75a26', '#a8321f'], n: 34, r: [2.2, 3.4], lavis: '#c95a2e' },
  ginkgo: { sorte: 'touffes', couleurs: ['#e8c547', '#f0d35c', '#d9b23a'], n: 30, r: [2.1, 3], lavis: '#e2bf45' },
  glycines: { sorte: 'touffes', couleurs: ['#a98bc9', '#8f6fb8', '#c4abdc'], n: 38, r: [1.8, 2.6], nuage: true, lavis: '#a68ac6' },
  hortensias: { sorte: 'touffes', couleurs: ['#7f9fd6', '#a58fd0', '#6d8ccc', '#c7a6dd'], n: 38, r: [1.8, 2.5], nuage: true, lavis: '#8ea3d6' },
  kochias: { sorte: 'touffes', couleurs: ['#c8463a', '#b8382e', '#d65a44'], n: 44, r: [1.6, 2.2], lavis: '#c8463a' },
  nemophiles: { sorte: 'points', couleurs: ['#7fa7d9', '#9dbde6', '#6b93cc', '#b8cff0'], n: 120, lavis: '#8fb0dd' },
  colza: { sorte: 'points', couleurs: ['#f2d64b', '#e8c93c', '#f6e27a'], n: 120, lavis: '#ecd048' },
  tournesols: { sorte: 'points', couleurs: ['#f0c030', '#e8b020'], n: 70, coeur: '#6b4a24', lavis: '#e8b828' },
  higanbana: { sorte: 'points', couleurs: ['#c8322a', '#e04a3a', '#b02a24'], n: 90, lavis: '#cc3a2e' },
  cosmos: { sorte: 'points', couleurs: ['#e996bf', '#f5c3da', '#fbf3f6', '#d6669e'], n: 100, lavis: '#eaa2c6' },
  fleurs: { sorte: 'points', couleurs: ['#e996bf', '#a98bc9', '#f2d64b', '#fbf3f6', '#d9453a', '#7fa7d9'], n: 90, lavis: '#d99ab8' },
  shibazakura: { sorte: 'rangs', couleurs: ['#e77fb0', '#f2a6c8', '#d65d99', '#f6e6ef', '#c9a0dc'], lavis: '#e98fbb' },
  tulipes: { sorte: 'rangs', couleurs: ['#d9453a', '#f0c23c', '#f6efe3', '#d6609a', '#e8843a'], lavis: '#e0704a' },
  lavande: { sorte: 'rangs', couleurs: ['#8e72b8', '#7a5ea8', '#9b82c2'], vert: true, lavis: '#9478bd' },
  iris: { sorte: 'rangs', couleurs: ['#6f5cb0', '#8c79c4', '#f4f0e6'], vert: true, lavis: '#7b68b6' },
};

/** Un nombre de 0 à 1 qui dépend de la graine (toujours le même). */
const hasard = (g) => { const s = Math.sin(g * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

/** Dessine un motif (une tuile qui se répète sans couture), à 2 pixels par point. */
function dessinerMotif(nom) {
  const o = MOTIFS[nom];
  const T = o.sorte === 'rangs' ? 36 : o.sorte === 'touffes' ? 72 : 40; // côté de la tuile en points
  const k = 2;
  const toile = document.createElement('canvas');
  toile.width = toile.height = T * k;
  const c = toile.getContext('2d');
  c.scale(k, k);
  let g = nom.length * 7.3;
  const h = () => hasard(g += 1.618);
  // chaque forme est dessinée aussi de l'autre côté des bords touchés : la tuile se raccorde
  const partout = (x, y, r, dessin) => {
    for (const dx of [-T, 0, T]) for (const dy of [-T, 0, T]) {
      if (x + dx > -r && x + dx < T + r && y + dy > -r && y + dy < T + r) dessin(x + dx, y + dy);
    }
  };
  if (o.sorte === 'touffes') {
    // de petits arbres en boule, vus d'en haut : ombre portée, couronne, trait d'encre et reflet. Ils poussent
    // en bosquets (les trois quarts autour de quatre centres), sans se chevaucher, au hasard : pas de rangées.
    const bosquets = Array.from({ length: 4 }, () => [h() * T, h() * T]);
    const arbres = [];
    for (let essai = 0; arbres.length < o.n && essai < o.n * 60; essai++) {
      let x, y;
      if (h() < 0.75) {
        const [bx, by] = bosquets[Math.floor(h() * 4)], a = h() * 6.283, d = Math.sqrt(h()) * T * 0.24;
        x = bx + Math.cos(a) * d; y = by + Math.sin(a) * d;
      } else { x = h() * T; y = h() * T; }
      x = ((x % T) + T) % T; y = ((y % T) + T) % T;
      const r = o.r[0] + (o.r[1] - o.r[0]) * h();
      const proche = arbres.some(([ax, ay, ar]) => {
        const dx = Math.min(Math.abs(ax - x), T - Math.abs(ax - x)), dy = Math.min(Math.abs(ay - y), T - Math.abs(ay - y));
        return Math.hypot(dx, dy) < (ar + r) * 0.85;
      });
      if (!proche) arbres.push([x, y, r, o.couleurs[Math.floor(h() * o.couleurs.length)], h()]);
    }
    // un voile léger sous chaque bosquet
    for (const [bx, by] of bosquets) {
      partout(bx, by, T * 0.3, (px, py) => {
        const voile = c.createRadialGradient(px, py, 0, px, py, T * 0.3);
        voile.addColorStop(0, `${o.lavis}38`); voile.addColorStop(1, `${o.lavis}00`);
        c.fillStyle = voile;
        c.beginPath(); c.arc(px, py, T * 0.3, 0, 7); c.fill();
      });
    }
    arbres.sort((a, b) => a[1] - b[1]);
    for (const [x, y, r, couleur, v] of arbres) {
      partout(x, y, r + 2, (px, py) => {
        c.fillStyle = `${ENCRE}0.2)`;
        c.beginPath(); c.ellipse(px + r * 0.35, py + r * 0.45, r, r * 0.85, 0, 0, 7); c.fill();
        const boules = o.nuage ? [[0, 0, 1], [-0.45, 0.2, 0.68], [0.45, 0.15, 0.7], [0.05, -0.4, 0.66]] : [[0, 0, 1]];
        c.fillStyle = couleur;
        c.strokeStyle = `${ENCRE}0.5)`;
        c.lineWidth = 0.45;
        for (const [bx, by, br] of boules) { c.beginPath(); c.arc(px + bx * r, py + by * r, br * r * (o.nuage ? 0.82 : 1), 0, 7); c.fill(); c.stroke(); }
        for (const [bx, by, br] of boules) { c.beginPath(); c.arc(px + bx * r, py + by * r, br * r * (o.nuage ? 0.82 : 1) - 0.3, 0, 7); c.fill(); }
        c.fillStyle = `rgba(255, 252, 240, ${0.28 + 0.12 * v})`;
        c.beginPath(); c.arc(px - r * 0.32, py - r * 0.34, r * 0.38, 0, 7); c.fill();
      });
    }
  } else if (o.sorte === 'points') {
    // un tapis de fleurs : de petits points de couleur serrés, sur un léger lavis vert
    c.fillStyle = 'rgba(111, 154, 78, 0.22)';
    c.fillRect(0, 0, T, T);
    for (let i = 0; i < o.n; i++) {
      const x = h() * T, y = h() * T, r = 0.7 + 0.7 * h();
      const couleur = o.couleurs[Math.floor(h() * o.couleurs.length)];
      partout(x, y, r + 1, (px, py) => {
        c.fillStyle = couleur;
        c.beginPath(); c.arc(px, py, r, 0, 7); c.fill();
        if (o.coeur) { c.fillStyle = o.coeur; c.beginPath(); c.arc(px, py, r * 0.4, 0, 7); c.fill(); }
      });
    }
  } else {
    // des rangs de fleurs, comme les champs de Hokkaidō ou du pied du Fuji
    const rangs = 6, pas = T / rangs;
    for (let j = 0; j < rangs; j++) {
      const couleur = o.couleurs[j % o.couleurs.length];
      const y0 = (j + 0.5) * pas;
      if (o.vert) { c.fillStyle = 'rgba(96, 128, 70, 0.45)'; c.fillRect(0, y0 - pas * 0.5, T, pas * 0.32); }
      for (let i = 0; i < 18; i++) {
        const x = (i + 0.5) * (T / 18) + (h() - 0.5) * 0.8, y = y0 + (h() - 0.5) * pas * 0.35;
        partout(x, y, 2, (px, py) => {
          c.fillStyle = couleur;
          c.beginPath(); c.ellipse(px, py, 1.25, 1.05, 0, 0, 7); c.fill();
        });
      }
      c.strokeStyle = `${ENCRE}0.18)`;
      c.lineWidth = 0.4;
      c.beginPath(); c.moveTo(0, y0 + pas * 0.32); c.lineTo(T, y0 + pas * 0.32); c.stroke();
    }
  }
  return c.getImageData(0, 0, T * k, T * k);
}

/** Les fêlures et les traînées de neige d'un lac gelé. */
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

/** Une tache au contour irrégulier autour d'un point (un bois, un champ), toujours la même pour ce point. */
function tache(lng, lat, rayon) {
  const graine = lng * 13.7 + lat * 7.9;
  const anneau = [];
  for (let i = 0; i <= 56; i++) {
    const a = ((i % 56) / 56) * 2 * Math.PI;
    const r = rayon * (1 + 0.2 * Math.sin(3 * a + graine) + 0.12 * Math.sin(5 * a + graine * 2.3) + 0.06 * Math.sin(9 * a + graine * 1.7));
    anneau.push([lng + (r * Math.sin(a)) / kmLng(lat), lat + (r * Math.cos(a)) / KM_LAT]);
  }
  return { type: 'Polygon', coordinates: [anneau] };
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

// ---------------------------------------------------------------- Brancher sur la carte
/**
 * @param deps - { lieux() : les lieux du tableau (avec leurs saisons) }
 * @returns { maj(j, p) : la carte de ce jour (1 à 365) et de ces couleurs (ambiance.js), majLieux() }
 */
export function brancherDetailsSaison(map, deps) {
  let pret = false, jour = null, couleurs = null, cleTaches = '', cleNeige = '', cleBanquise = '', cleLacs = '';
  const ajoutes = new Set();

  function preparer() {
    pret = true;
    for (const nom of Object.keys(MOTIFS)) map.addImage(`motif-${nom}`, dessinerMotif(nom), { pixelRatio: 2 });
    map.addImage('motif-glace', dessinerGlace(), { pixelRatio: 2 });
    if (jour !== null) maj(jour, couleurs);
  }
  if (map.style?._loaded) preparer();
  else map.once('style.load', preparer);

  /** Montre ou cache des couches : une couche sans rien à montrer n'est pas dessinée du tout (mesuré : ~8 % d'images en moins au zoom sur un téléphone moyen). */
  function montrer(ids, oui) {
    for (const id of ids) if (map.getLayoutProperty(id, 'visibility') !== (oui ? 'visible' : 'none')) map.setLayoutProperty(id, 'visibility', oui ? 'visible' : 'none');
  }

  /** Ajoute une couche la première fois qu'elle sert (chaque ajout redessine le relief une fois). */
  function couche(id, source, def, avant) {
    if (ajoutes.has(id)) return;
    if (!map.getSource(source.id)) map.addSource(source.id, source.def);
    map.addLayer({ id, source: source.id, ...def }, avant);
    ajoutes.add(id);
  }

  /** Les taches de fleurs et de feuillage de ce jour. */
  function taches(j) {
    const res = [];
    const pres = (lng, lat, motif) => res.some((f) => f.properties.motif === `motif-${motif}`
      && Math.hypot((f.properties.lng - lng) * kmLng(lat), (f.properties.lat - lat) * KM_LAT) < 5);
    const ajouter = (lng, lat, rayon, motif, o) => {
      if (o < 0.08 || pres(lng, lat, motif)) return;
      const force = Math.round(o * 10) / 10;
      res.push({ type: 'Feature', geometry: tache(lng, lat, rayon), properties: { motif: `motif-${motif}`, o: force, lng, lat } });
      // le voile de couleur, en deux anneaux (plus coloré au cœur) : la tache se voit aussi de loin
      for (const f of [1.12, 0.75]) {
        res.push({ type: 'Feature', geometry: tache(lng, lat, rayon * f), properties: { lavis: MOTIFS[motif].lavis, o: force } });
      }
    };
    // les lieux du tableau à leur plus beau ce mois-ci (colonne Saisons) passent d'abord
    for (const l of deps.lieux()) {
      for (const p of l.saisons?.periodes || []) {
        const motif = { cerisiers: 'sakura', fleurs: 'fleurs', automne: 'momiji' }[p.sorte];
        if (!motif) continue;
        // du premier au dernier mois de la période, avec un fondu de quelques jours
        const o = p.mois.reduce((m, oui, i) => (oui ? Math.max(m, entre(j, (i + 1) * 100 + 1, (i + 1) * 100 + [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][i])) : m), 0);
        ajouter(l.lng, l.lat, 4.5, motif, o);
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

  function maj(j, p) {
    jour = j;
    couleurs = p;
    if (!pret) return;
    const sombre = 1 - 0.55 * p.nuit; // la nuit, les couleurs des fleurs et des feuilles s'éteignent un peu

    // 1. fleurs et feuillages, sous l'ombrage du relief (qui les modèle)
    const t = taches(j);
    const cle = t.map((f) => `${f.properties.motif}${f.properties.lng}${f.properties.o}`).join('|');
    if (t.length || ajoutes.has('saison-taches')) {
      const source = { id: 'saison-taches', def: { type: 'geojson', data: { type: 'FeatureCollection', features: [] }, maxzoom: 10 } };
      couche('saison-lavis', source, {
        type: 'fill', filter: ['has', 'lavis'], paint: { 'fill-color': ['get', 'lavis'], 'fill-opacity': 0, 'fill-antialias': false },
      }, 'ombrage');
      couche('saison-taches', source, {
        type: 'fill', filter: ['has', 'motif'], paint: { 'fill-pattern': ['get', 'motif'], 'fill-opacity': 0, 'fill-antialias': false },
      }, 'ombrage');
      if (cle !== cleTaches) map.getSource('saison-taches').setData({ type: 'FeatureCollection', features: t });
      map.setPaintProperty('saison-taches', 'fill-opacity', ['*', ['get', 'o'], sombre]);
      map.setPaintProperty('saison-lavis', 'fill-opacity', ['*', ['get', 'o'], 0.16 * sombre]);
      montrer(['saison-lavis', 'saison-taches'], t.length > 0);
    }
    cleTaches = cle;

    // 2. la neige au sol du nord et de la côte de la mer du Japon, sous l'ombrage (le relief se lit dessous)
    // (côté mer du Japon, la neige tient comme 300 m plus haut : les vents d'hiver y déchargent la neige)
    const neiges = Object.entries(NEIGE_PREFECTURES).map(([code, [force, lat, alt, merDuJapon]]) => {
      const v = force * neigeAuSol(lat + (merDuJapon ? 300 / 220 : 0), alt, j);
      return [Number(code), Math.round(v * 20) / 20];
    }).filter(([, v]) => v > 0);
    const cleN = neiges.map((x) => x.join(':')).join(',');
    if (neiges.length || ajoutes.has('saison-neige')) {
      couche('saison-neige', { id: 'prefectures-neige', def: { type: 'geojson', data: 'data/prefectures.geojson', maxzoom: 7 } }, {
        type: 'fill', paint: { 'fill-color': p.neigeSol, 'fill-opacity': 0, 'fill-antialias': false },
      }, ajoutes.has('saison-lavis') ? 'saison-lavis' : 'ombrage');
      if (cleN !== cleNeige && neiges.length) {
        map.setFilter('saison-neige', ['in', ['get', 'code'], ['literal', neiges.map(([code]) => code)]]);
        map.setPaintProperty('saison-neige', 'fill-opacity', ['match', ['get', 'code'], ...neiges.flat(), 0]);
      }
      map.setPaintProperty('saison-neige', 'fill-color', p.neigeSol);
      montrer(['saison-neige'], neiges.length > 0);
    }
    cleNeige = cleN;

    // 3. les lacs gelés : la glace, puis ses fêlures et ses traînées de neige
    const geles = Object.entries(LACS_GELES).filter(([, [du, au]]) => entre(j, du, au) > 0.5).map(([nom]) => nom);
    const cleL = geles.join(',');
    if (geles.length || ajoutes.has('lacs-glace')) {
      const filtre = ['all', ['==', ['get', 't'], 'lac'], ['in', ['get', 'nom'], ['literal', geles]]];
      couche('lacs-glace', { id: 'eaux' }, { type: 'fill', filter: filtre, paint: { 'fill-color': p.glace } }, 'lacs-bord');
      couche('lacs-glace-motif', { id: 'eaux' }, { type: 'fill', filter: filtre, paint: { 'fill-pattern': 'motif-glace', 'fill-opacity': 0.9 } }, 'lacs-bord');
      if (cleL !== cleLacs) for (const id of ['lacs-glace', 'lacs-glace-motif']) map.setFilter(id, filtre);
      map.setPaintProperty('lacs-glace', 'fill-color', p.glace);
      map.setPaintProperty('lacs-glace-motif', 'fill-opacity', 0.9 * sombre);
      montrer(['lacs-glace', 'lacs-glace-motif'], geles.length > 0);
    }
    cleLacs = cleL;

    // 4. la banquise d'Okhotsk, sous le relief (la terre la cache), au-dessus des lignes d'eau
    const force = lisse(22, 46, j) * (1 - lisse(69, 91, j));
    const cleB = String(Math.round(force * 10));
    if (force > 0.05 || ajoutes.has('banquise')) {
      if (!plaques) preparerBanquise();
      couche('banquise', { id: 'banquise', def: { type: 'geojson', data: { type: 'FeatureCollection', features: [] }, maxzoom: 9 } }, {
        type: 'fill', paint: { 'fill-color': p.glace, 'fill-opacity': 0.95 },
      }, 'couleurs-relief');
      couche('banquise-bord', { id: 'banquise' }, { type: 'line', paint: { 'line-color': p.eau, 'line-width': 0.7, 'line-opacity': 0.8 } }, 'couleurs-relief');
      if (cleB !== cleBanquise) {
        const f = Math.round(force * 10) / 10;
        const features = plaques.filter(([, d, tirage]) => tirage < f * Math.exp(-d / 24) * 1.15).map(([geometry]) => ({ type: 'Feature', geometry, properties: {} }));
        map.getSource('banquise').setData({ type: 'FeatureCollection', features });
      }
      map.setPaintProperty('banquise', 'fill-color', p.glace);
      map.setPaintProperty('banquise-bord', 'line-color', p.eau);
      montrer(['banquise', 'banquise-bord'], force > 0.05);
    }
    cleBanquise = cleB;
  }

  return {
    maj,
    /** Les lieux du tableau sont arrivés : leurs saisons s'ajoutent aux taches. */
    majLieux() { if (jour !== null) { cleTaches = ''; maj(jour, couleurs); } },
  };
}
