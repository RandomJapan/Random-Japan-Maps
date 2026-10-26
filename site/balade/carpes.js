// ================================================================
//  Les carpes (錦鯉) des étangs et des douves, et l'esturgeon de Takachiho : le modèle, l'ondulation, la nage.
//  Faites pour l'étang de Takachiho le 2026-10-26 (« remodélise les poissons avec plus de détails » : c'étaient un œuf,
//  une boule pour tête et un cône pour queue), reprises le même jour dans les douves de Himeji (« rajoute les carpes que
//  tu viens de modéliser dans les douves du château »).
//  fabriquerCarpe(ctx, i, o) → { g, milieu, queue, bouche, k, nez } : le poisson dans g (à poser et tourner) ;
//  nager(k, liste, dt, v, marge, o) → son virage ; onduler(k, dt, virage, dort, effort) → le lacet du corps.
//  Repère : un poisson regarde vers +z, son milieu en 0.
// ================================================================
import { hasard, bruitDoux } from './monde.js';

const PI = Math.PI;

/** Un triangle A, B, C ajouté à pos, tourné vers n (retourné s'il regarde de l'autre côté). */
function triangle(pos, A, B, C, n) {
  const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  if (nx * n[0] + ny * n[1] + nz * n[2] < 0) pos.push(...A, ...C, ...B); else pos.push(...A, ...B, ...C);
}
// (une couleur « #rrggbb » assombrie de f, ou éclaircie si f < 0)
const nuance = (c, f) => '#' + [1, 3, 5].map((i) => Math.min(255, Math.max(0, Math.round(parseInt(c.slice(i, i + 2), 16) * (1 - f)))).toString(16).padStart(2, '0')).join('');
// le profil d'un corps : des anneaux [z, demi-largeur, demi-hauteur, hauteur du milieu] du museau à la queue (z décroissant),
// en ligne droite entre eux ; profil(z) → [demi-largeur, demi-hauteur, hauteur du milieu]
const profilDe = (P) => (z) => {
  if (z >= P[0][0]) return P[0].slice(1);
  for (let i = 1; i < P.length; i++) {
    if (z < P[i][0]) continue;
    const f = (P[i - 1][0] - z) / (P[i - 1][0] - P[i][0]);
    return [1, 2, 3].map((j) => P[i - 1][j] + (P[i][j] - P[i - 1][j]) * f);
  }
  return P[P.length - 1].slice(1);
};
const PROFIL_KOI = profilDe([[0.305, 0.006, 0.008, -0.004], [0.29, 0.03, 0.032, -0.002], [0.26, 0.052, 0.055, 0.004], [0.21, 0.072, 0.078, 0.01], [0.14, 0.085, 0.093, 0.014],
  [0.06, 0.086, 0.091, 0.012], [-0.03, 0.073, 0.077, 0.008], [-0.12, 0.051, 0.055, 0.004], [-0.2, 0.03, 0.036, 0.002], [-0.255, 0.019, 0.03, 0], [-0.285, 0.016, 0.033, 0]]);
const PROFIL_ESTURGEON = profilDe([[0.5, 0.006, 0.005, 0.01], [0.46, 0.018, 0.012, 0], [0.4, 0.04, 0.03, -0.005], [0.32, 0.065, 0.05, -0.002], [0.22, 0.08, 0.066, 0.004],
  [0.08, 0.082, 0.068, 0.006], [-0.08, 0.068, 0.058, 0.006], [-0.22, 0.045, 0.042, 0.006], [-0.34, 0.025, 0.028, 0.01], [-0.42, 0.014, 0.02, 0.018]]);
// un tronçon du corps, de z0 (devant) à z1 (derrière), fermé aux deux bouts : un anneau tous les 2 cm, N côtés, le ventre un
// peu plus plat ; couleur(x, y, z, rel) : celle de chaque triangle (rel : sa hauteur dans l'anneau, de −1 à 1) ; mince : ses
// anneaux à moins de 2,5 cm de ce bout un rien plus étroits (là où il passe dans le morceau voisin : pas deux faces l'une sur
// l'autre)
const N = 14;
function troncon(THREE, a, profil, z0, z1, couleur, mince = false) {
  const n = Math.max(2, Math.round((z0 - z1) / 0.02)), anneaux = [];
  for (let i = 0; i <= n; i++) {
    const z = z0 + ((z1 - z0) * i) / n, [w, h, yc] = profil(z), k = mince && z0 - z < 0.026 ? 0.96 : 1;
    anneaux.push([z, w * k, h * k, yc]);
  }
  const pos = [], cols = [];
  const pt = ([z, w, h, yc], k) => { const t = (k / N) * 2 * PI, c = Math.cos(t); return [w * Math.sin(t), yc + h * c * (c < 0 ? 0.92 : 1), z]; };
  const tri = (A, B, C, nn, [, , h, yc]) => {
    triangle(pos, A, B, C, nn);
    const m = [0, 1, 2].map((j) => (A[j] + B[j] + C[j]) / 3);
    cols.push(couleur(m[0], m[1], m[2], h > 1e-4 ? (m[1] - yc) / h : 0));
  };
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < N; k++) {
      const t = ((k + 0.5) / N) * 2 * PI, nn = [Math.sin(t), Math.cos(t), 0];
      const A = pt(anneaux[i], k), B = pt(anneaux[i], k + 1), C = pt(anneaux[i + 1], k + 1), D = pt(anneaux[i + 1], k);
      tri(A, B, D, nn, anneaux[i]);
      tri(B, C, D, nn, anneaux[i]);
    }
  }
  for (const [i, s] of [[0, 1], [n, -1]]) {
    const r = anneaux[i], M0 = [0, r[3], r[0] + s * 0.003];
    if (r[2] > 0.002) for (let k = 0; k < N; k++) tri(pt(r, k), pt(r, k + 1), M0, [0, 0, s], r);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  a.piece(g, '#ffffff', { couleurs: cols, nuance: 0.025 });
}
// une nageoire mince (deux faces, 5 mm) : un éventail de la racine R vers son bord (des points) ; ses rayons, un triangle sur
// deux un peu plus foncé ; couleur(r) : près de la racine (r 0,25), vers le bord (0,75, un peu plus clair)
function nageoire(THREE, a, R, bord, couleur) {
  const poly = [R, ...bord], nn = [0, 0, 0];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    nn[0] += (p[1] - q[1]) * (p[2] + q[2]); nn[1] += (p[2] - q[2]) * (p[0] + q[0]); nn[2] += (p[0] - q[0]) * (p[1] + q[1]);
  }
  const l = Math.hypot(...nn) || 1, pos = [], cols = [], mi = (p) => p.map((v, j) => R[j] + (v - R[j]) * 0.45);
  for (const s of [1, -1]) {
    const n = nn.map((v) => (v / l) * s), o = (p) => p.map((v, j) => v + n[j] * 0.0025);
    for (let k = 0; k < bord.length - 1; k++) {
      const rayon = k % 2 ? 0.07 : 0, A = bord[k], B = bord[k + 1], MA = mi(A), MB = mi(B);
      triangle(pos, o(R), o(MA), o(MB), n); cols.push(nuance(couleur(0.25), rayon));
      triangle(pos, o(MA), o(A), o(B), n); cols.push(nuance(couleur(0.75), rayon - 0.06));
      triangle(pos, o(MA), o(B), o(MB), n); cols.push(nuance(couleur(0.75), rayon - 0.06));
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  a.piece(g, '#ffffff', { couleurs: cols, nuance: 0.02 });
}
const BLANC = '#f6f2ea', ROUGE = '#d63c26', NOIR = '#262220';
// les robes des carpes : corps(x, y, z, rel, t, p, e) (t : de grandes taches, p : de petites, e : le filet des écailles) ;
// nageoire(r)
const ROBES = [
  // kohaku : blanc, de grandes taches rouges sur le dos
  { corps: (x, y, z, rel, t) => (rel > -0.3 && t > 0.5 ? ROUGE : BLANC), nageoire: () => BLANC },
  // taishō sanke : blanc, des taches rouges et de petites taches noires
  { corps: (x, y, z, rel, t, p) => (rel > -0.2 && p > 0.74 ? NOIR : rel > -0.3 && t > 0.52 ? ROUGE : BLANC), nageoire: () => BLANC },
  // shōwa : noir, des taches rouges et blanches ; le pied des nageoires noir
  { corps: (x, y, z, rel, t) => (rel > -0.4 && t > 0.6 ? ROUGE : t < 0.3 || rel < -0.65 ? BLANC : NOIR), nageoire: (r) => (r < 0.5 ? NOIR : BLANC) },
  // yamabuki ogon : tout d'or, le dos plus brillant
  { corps: (x, y, z, rel) => (rel > 0.55 ? '#f6d460' : '#ecb935'), nageoire: () => '#f0c64c' },
  // asagi : le dos bleu-gris en filet d'écailles ; les flancs, les joues et le pied des nageoires orange
  { corps: (x, y, z, rel, t, p, e) => (rel < -0.25 || (z > 0.2 && rel < 0.3) ? '#de6a32' : e ? '#8098aa' : '#8ea4b4'), nageoire: (r) => (r < 0.5 ? '#de6a32' : '#d4d8d8') },
  // chagoi : bronze, en filet d'écailles
  { corps: (x, y, z, rel, t, p, e) => (e ? '#9d6b39' : '#ab7841'), nageoire: () => '#b48250' },
  // tanchō : blanc, un rond rouge sur la tête
  { corps: (x, y, z, rel) => (rel > 0.2 && Math.hypot(x, z - 0.22) < 0.034 ? ROUGE : BLANC), nageoire: () => BLANC },
  // platine : blanc d'argent, le dos plus brillant
  { corps: (x, y, z, rel) => (rel > 0.55 ? '#fbfaf5' : '#e2e1da'), nageoire: () => '#e9e8e1' },
];

/**
 * Une carpe, ou l'esturgeon : i choisit sa robe (ROBES[i % 8]), ses taches et sa taille (0,95 à 1,2 × taille) ; bouche : une
 * bouche ronde qui s'ouvre pour happer la nourriture (cachée tant qu'on ne l'ouvre pas : bouche.scale). Le poisson est en
 * trois morceaux : l'avant dans g, l'arrière (milieu) tourne autour de sa jointure avec l'avant, la queue autour de la sienne
 * avec l'arrière. nez : la distance du milieu au museau, en mètres.
 */
export function fabriquerCarpe(ctx, i, { esturgeon = false, taille = 1.8, bouche = false } = {}) {
  const { THREE, atelier } = ctx;
  const robe = ROBES[i % ROBES.length], g0 = i * 3.7 + 1.3, kk = 0.95 + 0.25 * hasard(i, 3.1);
  const profil = esturgeon ? PROFIL_ESTURGEON : PROFIL_KOI, [nez, j1, j2, fin] = esturgeon ? [0.5, -0.02, -0.3, -0.42] : [0.305, 0, -0.2, -0.285];
  const dos = (z) => { const [, h, yc] = profil(z); return yc + h; }, ventre = (z) => { const [, h, yc] = profil(z); return yc - h * 0.92; };
  const corps = esturgeon
    ? (x, y, z, rel) => (rel > 0.35 ? '#596058' : rel < -0.45 ? '#dcd7c8' : '#7a8078')
    : (x, y, z, rel) => {
      const e = (Math.floor((Math.atan2(x, y - profil(z)[2]) / (2 * PI) + 1) * N) + Math.floor(z / 0.021)) % 2 === 0;
      return robe.corps(x, y, z, rel, bruitDoux(x * 9 + g0 * 7.3, z * 7 - g0 * 3.1, 1), bruitDoux(x * 30 + g0, z * 26 + g0 * 2, 1), e);
    };
  const nag = esturgeon ? (r) => (r < 0.5 ? '#6a6f68' : '#8a8e86') : robe.nageoire;
  const avant = atelier(), arriere = atelier(), bout = atelier();
  const nageoireDe = (a, R, bord) => nageoire(THREE, a, R, bord, nag);
  troncon(THREE, avant, profil, nez, j1 - 0.025, corps);
  troncon(THREE, arriere, profil, j1 + 0.025, j2 - 0.025, corps, true);
  troncon(THREE, bout, profil, j2 + 0.025, fin, corps, true);
  if (!esturgeon) {
    for (const s of [-1, 1]) {
      // les pectorales, en éventail, un peu tombantes ; les pelviennes, sous le ventre
      nageoireDe(avant, [s * 0.055, -0.045, 0.165], [[s * 0.06, -0.048, 0.19], [s * 0.105, -0.066, 0.186], [s * 0.15, -0.08, 0.157], [s * 0.172, -0.088, 0.116], [s * 0.16, -0.086, 0.08],
        [s * 0.125, -0.075, 0.07], [s * 0.085, -0.06, 0.1], [s * 0.06, -0.05, 0.135]]);
      nageoireDe(arriere, [s * 0.03, -0.066, -0.01], [[s * 0.034, -0.07, 0.02], [s * 0.064, -0.093, 0], [s * 0.08, -0.106, -0.04], [s * 0.06, -0.098, -0.058], [s * 0.034, -0.078, -0.04]]);
      // les barbillons, aux coins de la bouche ; les yeux, cerclés de clair
      const cb = nuance(corps(s * 0.02, -0.01, 0.29, -0.2), 0.1);
      avant.baton([s * 0.02, -0.012, 0.29], [s * 0.036, -0.03, 0.318], 0.0035, cb, 4).baton([s * 0.012, -0.005, 0.298], [s * 0.02, -0.014, 0.316], 0.0025, cb, 4);
      avant.ovale(0.015, '#e6dcc0', { x: s * 0.046, y: 0.02, z: 0.252, sx: 0.5 }, 6).ovale(0.0105, '#17130f', { x: s * 0.0505, y: 0.02, z: 0.254, sx: 0.5 }, 6)
        .ovale(0.0035, '#ffffff', { x: s * 0.0545, y: 0.025, z: 0.258 }, 4);
    }
    avant.ovale(0.011, nuance(corps(0, -0.006, 0.3, 0), 0.2), { y: -0.006, z: 0.3, sx: 1.35, sy: 0.8, sz: 0.6 }, 6);
    // la dorsale, longue (en deux : elle passe la jointure) ; l'anale ; la queue fourchue
    nageoireDe(avant, [0, dos(0.05) - 0.008, 0.05], [[0, dos(0.1) - 0.004, 0.1], [0, dos(0.085) + 0.05, 0.082], [0, dos(0.04) + 0.047, 0.04], [0, dos(-0.004) + 0.042, -0.004], [0, dos(-0.004) - 0.006, -0.004]]);
    nageoireDe(arriere, [0, dos(-0.065) - 0.008, -0.065], [[0, dos(0.004) - 0.006, 0.004], [0, dos(0.004) + 0.042, 0.004], [0, dos(-0.05) + 0.036, -0.05], [0, dos(-0.1) + 0.027, -0.1],
      [0, dos(-0.128) + 0.008, -0.128], [0, dos(-0.132) - 0.004, -0.132]]);
    nageoireDe(arriere, [0, ventre(-0.155) + 0.008, -0.155], [[0, ventre(-0.125) + 0.002, -0.125], [0, ventre(-0.14) - 0.034, -0.14], [0, ventre(-0.178) - 0.03, -0.178], [0, ventre(-0.19) + 0.002, -0.19]]);
    nageoireDe(bout, [0, 0.002, -0.27], [[0, 0.03, -0.262], [0, 0.075, -0.32], [0, 0.13, -0.43], [0, 0.105, -0.447], [0, 0.06, -0.405], [0, 0.004, -0.366], [0, -0.055, -0.4], [0, -0.1, -0.442],
      [0, -0.125, -0.425], [0, -0.07, -0.315], [0, -0.026, -0.262]]);
  } else {
    for (const s of [-1, 1]) {
      // les pectorales, à plat comme des ailes ; les pelviennes ; les yeux, petits
      nageoireDe(avant, [s * 0.05, -0.035, 0.25], [[s * 0.058, -0.037, 0.28], [s * 0.13, -0.05, 0.245], [s * 0.172, -0.058, 0.175], [s * 0.15, -0.055, 0.14], [s * 0.09, -0.045, 0.18], [s * 0.058, -0.04, 0.22]]);
      nageoireDe(arriere, [s * 0.03, -0.05, -0.12], [[s * 0.034, -0.054, -0.09], [s * 0.08, -0.07, -0.115], [s * 0.088, -0.075, -0.17], [s * 0.04, -0.06, -0.16]]);
      avant.ovale(0.0085, '#141210', { x: s * 0.042, y: 0.012, z: 0.37, sx: 0.6 }, 6);
      // un rang de plaques osseuses sur chaque flanc
      for (let z = 0.27; z > -0.4; z -= 0.05) {
        const [w, , yc] = profil(z);
        (z > j1 ? avant : z > j2 ? arriere : bout).cone(0.008, 0.011, 4, '#d4cdba', { x: s * w * 0.97, y: yc + 0.004, z, rz: -s * PI / 2, sz: 1.5 });
      }
    }
    // le rang de plaques du dos ; les quatre barbillons sous le rostre ; la bouche, dessous
    for (let z = 0.3; z > -0.2; z -= 0.045) (z > j1 ? avant : arriere).cone(0.011, 0.016, 4, '#d4cdba', { y: dos(z) + 0.002, z, sz: 1.6 });
    for (const dx of [-0.016, -0.0055, 0.0055, 0.016]) avant.baton([dx, -0.022, 0.405], [dx * 1.15, -0.056, 0.398], 0.0025, '#c8c0ae', 4);
    avant.ovale(0.012, '#8a7e74', { y: -0.044, z: 0.35, sx: 1.6, sy: 0.4 }, 6);
    // la dorsale et l'anale, tout au bout ; la queue, son lobe du haut plus long
    nageoireDe(arriere, [0, dos(-0.245) - 0.006, -0.245], [[0, dos(-0.2), -0.2], [0, dos(-0.215) + 0.045, -0.215], [0, dos(-0.26) + 0.034, -0.26], [0, dos(-0.29) + 0.006, -0.29], [0, dos(-0.29) - 0.004, -0.29]]);
    nageoireDe(arriere, [0, ventre(-0.25) + 0.006, -0.25], [[0, ventre(-0.22), -0.22], [0, ventre(-0.235) - 0.035, -0.235], [0, ventre(-0.275) - 0.028, -0.275], [0, ventre(-0.29), -0.29]]);
    nageoireDe(bout, [0, 0.016, -0.41], [[0, 0.03, -0.398], [0, 0.06, -0.47], [0, 0.112, -0.6], [0, 0.096, -0.622], [0, 0.03, -0.54], [0, -0.03, -0.5], [0, -0.075, -0.49], [0, -0.062, -0.45], [0, -0.004, -0.408]]);
  }
  const g = new THREE.Group(), milieu = new THREE.Group(), queue = new THREE.Group();
  const m0 = ctx.maillage(avant.fin(0, false), false, false), m1 = ctx.maillage(arriere.fin(0, false), false, false), m2 = ctx.maillage(bout.fin(0, false), false, false);
  g.add(m0, milieu);
  milieu.position.z = j1; m1.position.z = -j1; milieu.add(m1, queue);
  queue.position.z = j2 - j1; m2.position.z = -j2; queue.add(m2);
  // la bouche qui s'ouvre : une lèvre ronde autour d'un trou sombre, au bout du museau ; à moins d'un tiers, elle est dans le
  // museau (cachée)
  let b = null;
  if (bouche && !esturgeon) {
    b = ctx.maillage(atelier().ovale(0.02, nuance(corps(0, -0.006, 0.3, 0), 0.12), { sx: 1.05, sy: 0.9, sz: 0.4 }, 8)
      .ovale(0.0135, '#2b1714', { z: 0.005, sy: 0.85, sz: 0.3 }, 8).fin(0, false), false, false);
    b.position.set(0, -0.004, 0.3);
    b.visible = false;
    g.add(b);
  }
  g.scale.setScalar(taille * kk);
  return { g, milieu, queue, bouche: b, k: kk, nez: nez * taille * kk };
}

/**
 * Nager vers k.cible ([x, z], ou null : tout droit) à la vitesse v, dans l'eau permise : marge(x, z), la distance à son bord
 * (positive dedans). On s'écarte d'un bord à moins de 1,5 m et des autres poissons de la liste à moins d'ecart ; on tourne
 * au plus de virage rad/s. Un pas n'est fait que si le milieu reste dans l'eau permise (ou s'en rapproche) et le museau à
 * moins de 45 cm de son bord (ou s'en rapproche) ; sinon on tourne sur place vers là où il y a le plus d'eau, et k.cible
 * est oublié. pousse(k) : [x, z], une poussée de plus sur la direction voulue (s'écarter du corps d'un autre). k : { x, z,
 * cap, cible, k (taille), nez }. Renvoie le virage (rad/s).
 * (2026-10-26, « les poissons se bloquent dans les cailloux » de l'îlot de Takachiho : ils visaient un point derrière, et
 * s'arrêtaient net dès que le pas suivant y entrait, en tremblant sur place.)
 */
export function nager(k, liste, dt, v, marge, { ecart = 1.3, virage = 1.4, pousse = null } = {}) {
  const pente = (x, z) => [marge(x + 0.1, z) - marge(x - 0.1, z), marge(x, z + 0.1) - marge(x, z - 0.1)];
  // la direction voulue : vers le but ; près d'un bord, on s'en écarte ; on s'écarte des autres
  let vx = Math.sin(k.cap), vz = Math.cos(k.cap);
  if (k.cible) { const d = Math.hypot(k.cible[0] - k.x, k.cible[1] - k.z); if (d > 1e-3) { vx = (k.cible[0] - k.x) / d; vz = (k.cible[1] - k.z) / d; } }
  const m = marge(k.x, k.z);
  if (m < 1.5) { const [gx, gz] = pente(k.x, k.z), gl = Math.hypot(gx, gz) || 1, f = 1.5 * (1.5 - Math.max(0, m)); vx += (gx / gl) * f; vz += (gz / gl) * f; }
  for (const o of liste) {
    const dx = k.x - o.x, dz = k.z - o.z, d = Math.hypot(dx, dz);
    if (o !== k && d < ecart && d > 1e-3) { vx += (dx / d) * (ecart - d) * 1.2; vz += (dz / d) * (ecart - d) * 1.2; }
  }
  if (pousse) { const [px, pz] = pousse(k); vx += px; vz += pz; }
  let e = Math.atan2(vx, vz) - k.cap;
  e = Math.atan2(Math.sin(e), Math.cos(e));
  let taux = Math.max(-virage, Math.min(virage, e * 1.8));
  // avancer, si le milieu et le museau restent dans l'eau permise (ou s'en rapprochent) ; sinon, tourner sur place vers là
  // où il y a le plus d'eau, et un autre but
  const cap = k.cap + taux * dt;
  const nx = k.x + Math.sin(cap) * v * dt, nz = k.z + Math.cos(cap) * v * dt;
  const museau = (x, z, a) => marge(x + Math.sin(a) * k.nez, z + Math.cos(a) * k.nez);
  const mn = marge(nx, nz), sn = museau(nx, nz, cap);
  if ((mn > 0 || mn > m) && (sn > -0.45 || sn > museau(k.x, k.z, k.cap))) { k.x = nx; k.z = nz; k.cap = cap; }
  else {
    const [gx, gz] = pente(k.x, k.z);
    let dd = Math.atan2(gx, gz) - k.cap;
    dd = Math.atan2(Math.sin(dd), Math.cos(dd));
    taux = dd >= 0 ? 1.8 : -1.8;
    k.cap += taux * dt;
    k.cible = null;
  }
  return taux;
}

/**
 * L'ondulation : l'arrière et la queue battent (plus vite et plus fort en tournant, ou dans l'effort, de 0 à 1 : quand
 * elles se ruent sur la nourriture) ; le corps se courbe dans le virage ; la nuit (dort, de 0 à 1), lentement. k : { th,
 * taux, milieu, queue }. Renvoie le lacet de l'avant, à ajouter au cap.
 */
export function onduler(k, dt, taux, dort, effort = 0) {
  k.taux += (taux - k.taux) * Math.min(1, dt * 4);
  const vif = Math.min(1, Math.abs(k.taux)), f = (0.9 + 0.8 * vif + 1.6 * effort) * (1 - 0.7 * dort), A = (0.2 + 0.12 * Math.max(vif, effort)) * (1 - 0.6 * dort);
  k.th += dt * f * 2 * PI;
  k.milieu.rotation.y = A * 0.55 * Math.sin(k.th) - k.taux * 0.12;
  k.queue.rotation.y = A * 1.1 * Math.sin(k.th - 1.2) - k.taux * 0.1;
  return -A * 0.18 * Math.sin(k.th + 0.4);
}
