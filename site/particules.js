// ================================================================
//  Ce qui tombe sur la carte selon la saison (ambiance.js) : des feuilles
//  d'érable du Japon et de ginkgo, des pétales de cerisier, des flocons,
//  des lucioles, des feux d'artifice. Refaits le 2026-10-12 (« les feuilles
//  ne sont pas très réalistes ») : de vraies formes (érable à sept lobes
//  dentelés, éventail du ginkgo, pétale échancré), un revers plus pâle, et une
//  chute en trois mouvements, tous animés en CSS par la carte graphique :
//  la descente, le balancement de feuille morte (elle glisse d'un côté en
//  penchant, ralentit, repart de l'autre) et la vrille en 3D.
// ================================================================

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
    + `<path d="M10 23.3C3.4 18.6 1.2 10 3.8 3.6 5.6.3 8.4 1 10 4.3 11.6 1 14.4.3 16.2 3.6 18.8 10 16.6 18.6 10 23.3Z" fill="url(#${id})" stroke="#d68aa0" stroke-width=".45"/>`
    + `<path d="M10 22V8.5" stroke="#e3a1b4" stroke-width=".4" fill="none"/></svg>`;
}

// ---------------------------------------------------------------- La chute
/**
 * Un objet qui tombe : la descente (span), le balancement (.balance) et la vrille en 3D (.vrille), chacun
 * avec ses durées au hasard ; delai négatif : déjà en route au premier affichage.
 */
function tombant(contenu, { gauche = hasard(-4, 100), taille, chute, balance, amplitude, angle, vrille, classe = '' }) {
  const s = document.createElement('span');
  if (classe) s.className = classe;
  s.style.left = `${gauche.toFixed(1)}%`;
  s.style.animationDuration = `${chute.toFixed(1)}s`;
  s.style.animationDelay = `${-hasard(0, chute).toFixed(1)}s`;
  const axe = [hasard(-1, 1), hasard(-1, 1), hasard(-0.4, 0.4)];
  const v = vrille ? `<span class="vrille" style="--ax:${axe[0].toFixed(2)};--ay:${axe[1].toFixed(2)};--az:${axe[2].toFixed(2)};animation-duration:${vrille.toFixed(1)}s;animation-delay:${-hasard(0, vrille).toFixed(1)}s">${contenu}</span>` : contenu;
  s.innerHTML = `<span class="balance" style="--amp:${amplitude.toFixed(0)}px;--angle:${angle.toFixed(0)}deg;--taille:${taille.toFixed(0)}px;`
    + `animation-duration:${balance.toFixed(1)}s;animation-delay:${-hasard(0, balance).toFixed(1)}s">${v}</span>`;
  return s;
}

const SORTES = {
  feuilles: () => Array.from({ length: 14 }, (_, i) => {
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
    s.style.setProperty('--dx', `${hasard(-70, 70).toFixed(0)}px`);
    const duree = hasard(5, 9);
    s.style.animationDuration = `${duree.toFixed(1)}s`;
    s.style.animationDelay = `${-hasard(0, duree).toFixed(1)}s`;
    return s;
  }),
  hanabi: () => ['#e8b04a', '#c4462e', '#e8b04a'].map((couleur, i) => {
    const s = document.createElement('span');
    s.className = 'hanabi';
    s.innerHTML = feuDArtifice(couleur);
    const placer = () => { s.style.left = `${hasard(12, 80)}%`; s.style.top = `${hasard(22, 62)}%`; };
    placer();
    s.style.animationDelay = `${i * 2.3 + hasard(0, 1)}s`;
    s.addEventListener('animationiteration', placer);
    return s;
  }),
};

function feuDArtifice(couleur) {
  let traits = '';
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8, c = Math.cos(a), s = Math.sin(a);
    traits += `<line x1="${50 + c * 18}" y1="${50 + s * 18}" x2="${50 + c * 40}" y2="${50 + s * 40}"/><circle cx="${50 + c * 46}" cy="${50 + s * 46}" r="2.6"/>`;
  }
  return `<svg width="76" height="76" viewBox="0 0 100 100" stroke="${couleur}" fill="${couleur}" stroke-width="2.4" stroke-linecap="round">${traits}</svg>`;
}

/** Les éléments de cette sorte (feuilles, petales, neige, lucioles, hanabi). */
export function creerParticules(sorte) {
  return SORTES[sorte]?.() || [];
}
