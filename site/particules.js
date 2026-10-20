// ================================================================
//  Ce qui tombe sur la carte selon la saison (ambiance.js) : des feuilles
//  d'érable du Japon et de ginkgo, des pétales de cerisier, des flocons,
//  des lucioles, des feux d'artifice. Refaits le 2026-10-12 (« les feuilles
//  ne sont pas très réalistes ») : de vraies formes (érable à sept lobes
//  dentelés, éventail du ginkgo, pétale échancré), un revers plus pâle, et une
//  chute en trois mouvements, tous animés en CSS par la carte graphique :
//  la descente, le balancement de feuille morte (elle glisse d'un côté en
//  penchant, ralentit, repart de l'autre) et la vrille en 3D.
//  Les mouvements sont donnés en valeurs fixes (element.animate) : avec des
//  variables CSS dans les @keyframes, le navigateur les recalculait à chaque
//  image (mesuré : 13 % d'images en moins sur un téléphone moyen simulé).
//  Les feux d'artifice sont à part, dessinés image par image (hanabi.js).
// ================================================================

import { creerHanabi } from './hanabi.js';

const hasard = (a, b) => a + Math.random() * (b - a);
const P = (x, y) => `${x.toFixed(1)} ${y.toFixed(1)}`;
let numero = 0; // les dégradés de chaque dessin ont un nom unique dans la page

// ---------------------------------------------------------------- Les dessins
/** Le contour d'une feuille d'érable du Japon (sept lobes pointus et dentelés), ses nervures et sa queue. */
function erable() {
  const L = 40, bx = 50, by = 56, creux = 0.28 * L, N = 7;
  const lobes = [[-110, 0.52], [-73, 0.74], [-36, 0.93], [0, 1], [36, 0.93], [73, 0.74], [110, 0.52]];
  const point = (a, r) => [bx + Math.sin(a) * r, by - Math.cos(a) * r];
  let d = `M${P(...point(Math.PI, 0.16 * L))}`;
  const pointes = [];
  lobes.forEach(([deg, f], k) => {
    const a = (deg * Math.PI) / 180, len = L * f;
    const dx = Math.sin(a), dy = -Math.cos(a), qx = Math.cos(a), qy = Math.sin(a);
    const bord = (s, t) => {
      const w = len * (0.075 + 0.11 * Math.sin(Math.PI * t ** 0.9)) * (1 - t) ** 0.35 * s;
      const le = creux + (len - creux) * t;
      return [bx + dx * le + qx * w, by + dy * le + qy * w];
    };
    if (k) d += `L${P(...point(((deg + lobes[k - 1][0]) / 2) * (Math.PI / 180), creux * 0.92))}`; // le creux entre deux lobes
    for (let n = 0; n <= N; n++) {
      d += `L${P(...bord(-1, n / N))}`;
      if (n > 0 && n < N) d += `L${P(...bord(-1.28, (n + 0.62) / N))}`; // une dent, tournée vers la pointe
    }
    pointes.push(bord(0, 1));
    for (let n = N - 1; n >= 0; n--) {
      if (n > 0) d += `L${P(...bord(1.28, (n + 0.62) / N))}`;
      d += `L${P(...bord(1, n / N))}`;
    }
  });
  d += 'Z';
  const nervures = pointes.map(([x, y]) => `M${P(bx, by)}L${P(x, y)}`).join('');
  return { d, nervures, queue: `M${P(bx, by)}Q${P(bx + 1, by + 14)} ${P(bx + 5, by + 24)}`, centre: [bx, by] };
}

/** L'éventail d'une feuille de ginkgo, échancré au milieu, ses fines nervures et sa queue. */
function ginkgo() {
  const bx = 50, by = 68, R = 40;
  const point = (deg, r) => [bx + Math.sin((deg * Math.PI) / 180) * r, by - Math.cos((deg * Math.PI) / 180) * r];
  let d = `M${P(bx, by)}`;
  for (let deg = -60; deg <= 60; deg += 3) {
    const r = R * (1 + 0.035 * Math.sin(deg * 0.31)) * (1 - 0.32 * Math.exp(-((deg / 6) ** 2))) * (Math.abs(deg) > 50 ? 0.96 : 1);
    d += `L${P(...point(deg, r))}`;
  }
  d += 'Z';
  let nervures = '';
  for (let deg = -54; deg <= 54; deg += 6) nervures += `M${P(...point(deg * 0.2, 3))}L${P(...point(deg, R * 0.93))}`;
  return { d, nervures, queue: `M${P(bx, by)}Q${P(bx - 1, by + 12)} ${P(bx + 2, by + 26)}`, centre: [bx, by] };
}

const ERABLE = erable();
const GINKGO = ginkgo();
const PETALE = 'M10 23.3C3.4 18.6 1.2 10 3.8 3.6 5.6.3 8.4 1 10 4.3 11.6 1 14.4.3 16.2 3.6 18.8 10 16.6 18.6 10 23.3Z';
// Les teintes d'automne : [cœur, pointes, trait]
const ROUX = [
  ['#e9a33b', '#c4321c', '#7a1d12'], ['#d8482a', '#a3201a', '#661410'], ['#f0c24a', '#d9662a', '#8a3a16'],
  ['#bcb04a', '#c9452a', '#6b2a14'], ['#c22a1e', '#8e1c18', '#55100c'], ['#e88a34', '#cf4a22', '#7a2a12'],
];
const OR = [['#d9cc5a', '#f2d662', '#8a6a1c'], ['#e9c443', '#f6dc6e', '#8a641a'], ['#f0cf4c', '#e8b232', '#8a5e18']];

/** Une feuille (érable ou ginkgo), sa face ou son revers (plus pâle et plus terne). */
function dessinFeuille(forme, [coeur, pointes, trait], revers) {
  const id = `fe${numero++}`;
  const [cx, cy] = forme.centre;
  const pale = revers ? 'opacity=".78"' : '';
  return `<svg class="${revers ? 'dos' : 'face'}" viewBox="0 0 100 100"><defs><radialGradient id="${id}" cx="${cx}" cy="${cy}" r="48" gradientUnits="userSpaceOnUse">`
    + `<stop offset=".05" stop-color="${coeur}"/><stop offset="1" stop-color="${pointes}"/></radialGradient></defs>`
    + `<path d="${forme.queue}" fill="none" stroke="${trait}" stroke-width="1.8" stroke-linecap="round"/>`
    + `<g ${pale}><path d="${forme.d}" fill="url(#${id})" stroke="${trait}" stroke-width=".9" stroke-linejoin="round"/>`
    + `<path d="${forme.nervures}" fill="none" stroke="${revers ? '#fff6dc' : trait}" stroke-width="${revers ? 0.9 : 0.6}" stroke-opacity="${revers ? 0.55 : 0.45}"/></g>`
    + (revers ? `<path d="${forme.d}" fill="#f4e8cc" fill-opacity=".28"/>` : '')
    + '</svg>';
}

/** Un pétale de cerisier, échancré au bout, plus rose à sa base. */
function dessinPetale(revers) {
  const id = `pe${numero++}`;
  return `<svg class="${revers ? 'dos' : 'face'}" viewBox="0 0 20 24"><defs><linearGradient id="${id}" x1="0" y1="1" x2="0" y2="0">`
    + `<stop offset="0" stop-color="${revers ? '#f3c3d0' : '#ec9db3'}"/><stop offset=".55" stop-color="${revers ? '#fbe6ec' : '#f8d3de'}"/>`
    + `<stop offset="1" stop-color="#fff3f6"/></linearGradient></defs>`
    + `<path d="${PETALE}" fill="url(#${id})" stroke="#d68aa0" stroke-width=".45"/>`
    + `<path d="M10 22V8.5" stroke="#e3a1b4" stroke-width=".4" fill="none"/></svg>`;
}

// ---------------------------------------------------------------- La chute
/** Une animation sans fin de durée d (s), déjà en route (délai négatif au hasard). */
const toujours = (el, images, d, o = {}) => el.animate(images, { duration: d * 1000, iterations: Infinity, delay: -hasard(0, d * 1000), ...o });
const f1 = (x) => x.toFixed(1);

/**
 * Un objet qui tombe : la descente (span), le balancement (.balance) et la vrille en 3D (.vrille), chacun
 * avec ses durées au hasard.
 */
function tombant(contenu, { gauche = hasard(-4, 100), taille, chute, balance, amplitude, angle, vrille, classe = '' }) {
  const s = document.createElement('span');
  if (classe) s.className = classe;
  s.style.left = `${f1(gauche)}%`;
  s.innerHTML = `<span class="balance" style="--taille:${taille.toFixed(0)}px">${vrille ? `<span class="vrille">${contenu}</span>` : contenu}</span>`;
  toujours(s, [{ transform: 'translateY(0)', opacity: 0 }, { opacity: 1, offset: 0.06 }, { opacity: 1, offset: 0.92 }, { transform: 'translateY(118vh)', opacity: 0 }], chute);
  // la feuille morte glisse d'un côté en penchant le nez, ralentit en remontant un peu, puis repart de l'autre
  const A = amplitude, T = angle, doux = 'ease-in-out';
  toujours(s.firstElementChild, [
    { transform: `translate(${f1(-A)}px, -7px) rotate(${f1(-T * 0.2)}deg)`, easing: doux },
    { transform: `translate(0px, 9px) rotate(${f1(T)}deg)`, easing: doux },
    { transform: `translate(${f1(A)}px, -7px) rotate(${f1(T * 0.2)}deg)`, easing: doux },
    { transform: `translate(0px, 9px) rotate(${f1(-T)}deg)`, easing: doux },
    { transform: `translate(${f1(-A)}px, -7px) rotate(${f1(-T * 0.2)}deg)` },
  ], balance);
  if (vrille) {
    const axe = [hasard(-1, 1), hasard(-1, 1), hasard(-0.4, 0.4)].map((v) => v.toFixed(2)).join(', ');
    toujours(s.querySelector('.vrille'), [{ transform: `rotate3d(${axe}, 0deg)` }, { transform: `rotate3d(${axe}, 360deg)` }], vrille);
  }
  return s;
}

const SORTES = {
  feuilles: () => Array.from({ length: 12 }, (_, i) => {
    const ginkgoOuNon = i % 3 === 2;
    const teinte = ginkgoOuNon ? OR[i % OR.length] : ROUX[i % ROUX.length];
    const forme = ginkgoOuNon ? GINKGO : ERABLE;
    const taille = hasard(18, 34);
    return tombant(dessinFeuille(forme, teinte, false) + dessinFeuille(forme, teinte, true), {
      taille, chute: hasard(10, 16) * (34 / taille) ** 0.3, balance: hasard(2.8, 4.6), amplitude: hasard(40, 95), angle: hasard(18, 38),
      vrille: hasard(2.2, 5), classe: taille > 30 ? 'pres' : '',
    });
  }),
  petales: () => Array.from({ length: 18 }, () => {
    const taille = hasard(9, 16);
    return tombant(dessinPetale(false) + dessinPetale(true), {
      taille, chute: hasard(10, 17), balance: hasard(1.8, 3.2), amplitude: hasard(30, 75), angle: hasard(20, 45), vrille: hasard(1.2, 2.8),
      classe: taille > 14.5 ? 'pres' : '',
    });
  }),
  neige: () => Array.from({ length: 28 }, (_, i) => {
    const pres = i % 7 === 0; // quelques gros flocons flous, tout près
    const taille = pres ? hasard(9, 13) : hasard(3, 7.5);
    return tombant('<b></b>', {
      taille, chute: pres ? hasard(7, 10) : hasard(12, 22), balance: hasard(3, 6), amplitude: hasard(10, 30), angle: 0, classe: pres ? 'pres' : '',
    });
  }),
  lucioles: () => Array.from({ length: 14 }, () => {
    const s = document.createElement('span');
    s.innerHTML = '<i></i>';
    s.className = 'luciole';
    s.style.left = `${hasard(-4, 100)}%`;
    s.style.top = `${hasard(20, 90)}%`;
    toujours(s, [{ transform: 'translate(0px, 0px)', opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0.3, offset: 0.6 },
      { transform: `translate(${hasard(-70, 70).toFixed(0)}px, -40px)`, opacity: 0.9 }], hasard(5, 9), { direction: 'alternate', easing: 'ease-in-out' });
    return s;
  }),
  hanabi: () => [creerHanabi()],
};

/**
 * L'atlas des feuilles et des pétales tombés au sol, autour des modèles 3D (couche3d.js) : 4 × 2 cases de 128 px.
 * En haut, trois feuilles d'érable (rouge, orangée, jaune) et une de ginkgo ; en bas, quatre pétales de cerisier.
 */
export function atlasSol() {
  const C = 128;
  const toile = document.createElement('canvas');
  toile.width = 4 * C;
  toile.height = 2 * C;
  const c = toile.getContext('2d');
  const feuille = (k, forme, [coeur, pointes, trait]) => {
    c.save();
    c.translate(k * C, 0);
    c.scale(C / 100, C / 100);
    const [cx, cy] = forme.centre;
    const degrade = c.createRadialGradient(cx, cy, 2, cx, cy, 48);
    degrade.addColorStop(0.05, coeur);
    degrade.addColorStop(1, pointes);
    c.fillStyle = degrade;
    c.strokeStyle = trait;
    c.lineJoin = 'round';
    c.lineCap = 'round';
    c.lineWidth = 2;
    c.stroke(new Path2D(forme.queue));
    const contour = new Path2D(forme.d);
    c.fill(contour);
    c.lineWidth = 1.3;
    c.stroke(contour);
    c.globalAlpha = 0.45;
    c.lineWidth = 0.8;
    c.stroke(new Path2D(forme.nervures));
    c.restore();
  };
  feuille(0, ERABLE, ROUX[1]);
  feuille(1, ERABLE, ROUX[0]);
  feuille(2, ERABLE, ROUX[2]);
  feuille(3, GINKGO, OR[1]);
  ['#ec9db3', '#e58ba5', '#f0aabd', '#e8a0b5'].forEach((base, k) => {
    c.save();
    c.translate(k * C + C / 2, C + C / 2);
    c.rotate(k * 0.8);
    c.scale(4.4, 4.4);
    c.translate(-10, -12);
    const degrade = c.createLinearGradient(0, 24, 0, 0);
    degrade.addColorStop(0, base);
    degrade.addColorStop(0.55, '#f8d3de');
    degrade.addColorStop(1, '#fff3f6');
    c.fillStyle = degrade;
    c.strokeStyle = '#d68aa0';
    c.lineWidth = 0.4;
    const contour = new Path2D(PETALE);
    c.fill(contour);
    c.stroke(contour);
    c.restore();
  });
  return toile;
}

/** Les éléments de cette sorte (feuilles, petales, neige, lucioles, hanabi). */
export function creerParticules(sorte) {
  return SORTES[sorte]?.() || [];
}

/** Arrête (false) ou relance (true) tout ce qui bouge dans le conteneur des particules. */
export function animerParticules(conteneur, oui) {
  for (const a of conteneur.getAnimations({ subtree: true })) {
    if (oui) a.play();
    else a.pause();
  }
  for (const el of conteneur.children) el.jouer?.(oui); // les feux d'artifice, dessinés image par image
}
