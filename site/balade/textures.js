// ================================================================
//  Les textures peintes de la balade 3D, dans l'esprit de Pokémon X et Y : des brins d'herbe et des
//  fleurs, les grains du sable, les dalles, les cailloux d'un chemin de terre, les strates de la roche, le
//  fil du bois, les rangs de tuiles… Elles sont dessinées par le code au chargement (aucun fichier), et se
//  répètent sans couture (tout ce qui dépasse d'un bord revient par l'autre).
//  Chaque texel multiplie la couleur de l'objet ou du sol (0,5 vaut ×1 : la même texture sert au vert
//  clair et au vert sombre), ou bien, là où son alpha est à 0, impose sa propre couleur (une fleur dans
//  l'herbe, un coquillage dans le sable). Une seule texture en couches, une couche par matière (MATIERES).
// ================================================================

/** Les matières (le numéro de leur couche). Le sol (aspectSol des lieux) et les objets (matiereDe). */
// (le Pavillon d'or, 2026-10-26 : la feuille d'or, or ; la mousse des jardins de Kyoto, mousse)
export const MATIERES = { sable: 1, herbe: 2, estran: 3, dalles: 4, terre: 5, roche: 6, route: 7, sousBois: 8, bois: 9, tuiles: 10, pierre: 11, enduit: 12, feuillage: 13, laque: 14, tole: 15, chaume: 16, or: 17, mousse: 18 };
/** La taille d'une répétition de chaque couche, en mètres (la couche 0 ne change rien). */
export const ECHELLES = [1, 1.3, 1.7, 2.6, 3, 2, 3.2, 2.2, 1.8, 1.3, 1, 1.6, 2.2, 1.1, 2, 1, 2.4, 1.09, 1.5];

const N = 256; // texels par côté

/** Un tirage au hasard toujours le même (mulberry32). */
function tirage(graine) {
  return () => {
    graine = (graine + 0x6d2b79f5) | 0;
    let t = Math.imul(graine ^ (graine >>> 15), 1 | graine);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Une teinte « #rrggbb » en couleur linéaire [r, g, b]. */
function lineaire(hex) {
  const v = parseInt(hex.slice(1), 16);
  return [v >> 16, (v >> 8) & 255, v & 255].map((c) => ((c / 255) <= 0.04045 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4));
}

/** Une feuille de dessin qui se replie sur ses bords : des multiplicateurs (m) et des couleurs posées (c, a). */
function feuille(graine) {
  const m = new Float32Array(N * N * 3).fill(1);
  const c = new Float32Array(N * N * 3);
  const a = new Float32Array(N * N);
  const hasard = tirage(graine);
  const ix = (x, y) => ((((y | 0) % N) + N) % N) * N + ((((x | 0) % N) + N) % N);
  /** Un bruit lisse qui se répète tous les N texels : p cases par côté (p divise N). */
  function grille(p) {
    const v = new Float32Array(p * p);
    for (let i = 0; i < v.length; i++) v[i] = hasard();
    const lisse = (t) => t * t * (3 - 2 * t);
    return (x, y) => {
      const fx = (((x / N) * p) % p + p) % p, fy = (((y / N) * p) % p + p) % p;
      const i = Math.floor(fx), j = Math.floor(fy), u = lisse(fx - i), w = lisse(fy - j);
      const i1 = (i + 1) % p, j1 = (j + 1) % p;
      const h = (ii, jj) => v[jj * p + ii];
      return (h(i, j) * (1 - u) + h(i1, j) * u) * (1 - w) + (h(i, j1) * (1 - u) + h(i1, j1) * u) * w;
    };
  }
  const f = {
    hasard,
    grille,
    /** Multiplie le texel (x, y) : par k, ou par [kr, kg, kb], avec une couverture de 0 à 1. */
    mul(x, y, k, couv = 1) {
      const i = ix(x, y) * 3;
      if (typeof k === 'number') k = [k, k, k];
      for (let n = 0; n < 3; n++) m[i + n] *= 1 + (k[n] - 1) * couv;
    },
    /** Pose une couleur (linéaire) sur le texel, avec une couverture de 0 à 1. */
    poser(x, y, col, couv = 1) {
      const j = ix(x, y), i = j * 3;
      for (let n = 0; n < 3; n++) c[i + n] = a[j] > 0 ? c[i + n] + (col[n] - c[i + n]) * couv : col[n];
      a[j] = Math.max(a[j], couv);
    },
    /** Chaque texel : fn(x, y) → multiplicateur. */
    partout(fn) {
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) f.mul(x, y, fn(x, y));
    },
    /** Un disque (bords adoucis) : fn(x, y, couverture, dx, dy). */
    disque(cx, cy, r, fn) {
      for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) {
        for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
          const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.hypot(dx, dy);
          const couv = Math.min(1, Math.max(0, r + 0.5 - d));
          if (couv > 0) fn(x, y, couv, dx / r, dy / r);
        }
      }
    },
    /** Une ellipse tournée (une feuille, un caillou) : demi-axes rx, ry, angle t. */
    ellipse(cx, cy, rx, ry, t, fn) {
      const r = Math.max(rx, ry), co = Math.cos(t), si = Math.sin(t);
      for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) {
        for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
          const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
          const u = (dx * co + dy * si) / rx, v = (-dx * si + dy * co) / ry, d = Math.hypot(u, v);
          const couv = Math.min(1, Math.max(0, (1 - d) * Math.min(rx, ry) + 0.5));
          if (couv > 0) fn(x, y, couv, u, v);
        }
      }
    },
    /** Un trait de (x0, y0) à (x1, y1), de largeur l : fn(x, y, couverture, t le long du trait). */
    trait(x0, y0, x1, y1, l, fn) {
      const vx = x1 - x0, vy = y1 - y0, L2 = vx * vx + vy * vy || 1;
      for (let y = Math.floor(Math.min(y0, y1) - l - 1); y <= Math.max(y0, y1) + l + 1; y++) {
        for (let x = Math.floor(Math.min(x0, x1) - l - 1); x <= Math.max(x0, x1) + l + 1; x++) {
          const px = x + 0.5 - x0, py = y + 0.5 - y0;
          const t = Math.min(1, Math.max(0, (px * vx + py * vy) / L2));
          const d = Math.hypot(px - t * vx, py - t * vy);
          const couv = Math.min(1, Math.max(0, l / 2 + 0.5 - d));
          if (couv > 0) fn(x, y, couv, t);
        }
      }
    },
    /** Les octets RGBA de la couche : rgb = multiplicateur / 2 (ou la couleur posée), alpha = 1 − couleur posée. */
    octets(sortie, debut) {
      for (let j = 0; j < N * N; j++) {
        const k = a[j];
        for (let n = 0; n < 3; n++) {
          const v = (m[j * 3 + n] / 2) * (1 - k) + c[j * 3 + n] * k;
          sortie[debut + j * 4 + n] = Math.round(Math.min(1, Math.max(0, v)) * 255);
        }
        sortie[debut + j * 4 + 3] = Math.round((1 - k) * 255);
      }
    },
  };
  return f;
}

/** Des bosses lisses et un grain fin, sur toute la feuille : écarts de ± fort (bosses) et ± fin (grain). */
function marbrer(f, fort, fin, p = 4) {
  const g = f.grille(p), g2 = f.grille(p * 4);
  f.partout((x, y) => 1 + (g(x, y) - 0.5) * 2 * fort + (g2(x, y) - 0.5) * fort + (f.hasard() - 0.5) * 2 * fin);
}

/** Des points épars (1 texel) plus sombres ou plus clairs. */
function semer(f, n, k) {
  for (let i = 0; i < n; i++) f.mul(f.hasard() * N, f.hasard() * N, k);
}

/** Un caillou vu d'en haut : éclairé en haut à gauche, son ombre en bas à droite. */
function caillou(f, x, y, r, teinte = 1) {
  f.disque(x + r * 0.35, y + r * 0.35, r * 1.05, (px, py, couv) => f.mul(px, py, 0.72, couv * 0.8));
  f.disque(x, y, r, (px, py, couv, dx, dy) => f.mul(px, py, teinte * (1.1 - 0.3 * (dx + dy) * 0.5), couv));
}

// ---------------------------------------------------------------- Les couches
const COUCHES = {
  sable(f) {
    marbrer(f, 0.06, 0.035);
    semer(f, 1400, 0.88);
    semer(f, 700, 1.1);
    for (let i = 0; i < 8; i++) caillou(f, f.hasard() * N, f.hasard() * N, 1 + f.hasard() * 1.4, 0.9);
    const coquillage = lineaire('#fff3ea'), rose = lineaire('#f5c9bd');
    for (let i = 0; i < 3; i++) {
      const x = f.hasard() * N, y = f.hasard() * N;
      f.ellipse(x, y, 2.2, 1.5, f.hasard() * 6, (px, py, couv, u) => f.poser(px, py, u > 0.3 ? rose : coquillage, couv));
    }
  },
  herbe(f) {
    // des bosses de vert, puis des brins : des traits fins un peu penchés, sombres, et des reflets plus courts
    marbrer(f, 0.07, 0.03);
    const h = f.hasard;
    for (let i = 0; i < 2200; i++) {
      const x = h() * N, y = h() * N, t = -Math.PI / 2 + (h() - 0.5) * 1.1, l = 5 + h() * 8;
      const k = 0.68 + h() * 0.12;
      f.trait(x, y, x + Math.cos(t) * l, y + Math.sin(t) * l, 1.1 + h() * 0.9, (px, py, couv, s) => f.mul(px, py, k, couv * (0.55 + 0.45 * (1 - s))));
    }
    for (let i = 0; i < 1100; i++) {
      const x = h() * N, y = h() * N, t = -Math.PI / 2 + (h() - 0.5) * 1.2, l = 3 + h() * 5;
      f.trait(x, y, x + Math.cos(t) * l, y + Math.sin(t) * l, 1.2, (px, py, couv, s) => f.mul(px, py, [1.2, 1.22, 1.08], couv * s));
    }
    // quelques petites fleurs : blanches au cœur jaune, jaunes, orange (comme les points orange de l'herbe des jeux)
    const sortes = [['#ffffff', '#ffd23f'], ['#ffe45c', '#f0a020'], ['#ff9a3c', '#e8602c'], ['#ffd0e0', '#ffffff']].map((c) => c.map(lineaire));
    for (let i = 0; i < 6; i++) {
      const [petale, coeur] = sortes[Math.floor(h() * sortes.length)];
      const x = h() * N, y = h() * N;
      for (let k = 0; k < 1 + Math.floor(h() * 3); k++) {
        const fx = x + (h() - 0.5) * 14, fy = y + (h() - 0.5) * 14, r = 1.5 + h() * 0.6;
        f.disque(fx + 0.8, fy + 1.4, r + 1, (px, py, couv) => f.mul(px, py, 0.75, couv * 0.6));
        for (let p = 0; p < 5; p++) {
          const t = (p / 5) * Math.PI * 2 + h();
          f.disque(fx + Math.cos(t) * r, fy + Math.sin(t) * r, r * 0.75, (px, py, couv) => f.poser(px, py, petale, couv));
        }
        f.disque(fx, fy, r * 0.6, (px, py, couv) => f.poser(px, py, coeur, couv));
      }
    }
  },
  estran(f) {
    // les rides du sable mouillé, ondulées, et des flaques un peu plus sombres
    const g = f.grille(4), g2 = f.grille(2);
    f.partout((x, y) => {
      const r = Math.sin(((y / N) * 22 + 0.6 * Math.sin((x / N) * Math.PI * 4) + g2(x, y) * 1.5) * Math.PI * 2);
      return (1 + 0.05 * r + (g(x, y) - 0.5) * 0.12) * (1 + (f.hasard() - 0.5) * 0.05);
    });
    semer(f, 900, 0.88);
    for (let i = 0; i < 6; i++) caillou(f, f.hasard() * N, f.hasard() * N, 1.2 + f.hasard() * 1.5, 0.82);
  },
  dalles(f) {
    // des dalles en quinconce (6 rangs de 4), chacune sa teinte, leurs joints, un biseau clair en haut
    const h = f.hasard, rangs = 6, cols = 4, H = N / rangs, L = N / cols;
    const teintes = Array.from({ length: rangs * cols }, () => 0.9 + h() * 0.17);
    const g = f.grille(8);
    f.partout((x, y) => {
      const r = Math.floor(y / H), dx = (r % 2) * L * 0.5, xx = (x + dx) % N, c = Math.floor(xx / L);
      const u = xx - c * L, v = y - r * H;
      let k = teintes[r * cols + c] * (1 + (g(x, y) - 0.5) * 0.12) * (1 + (h() - 0.5) * 0.06);
      if (u < 2 || v < 2) k *= 0.62;
      else if (u < 3.5 || v < 3.5) k *= 1.1;
      else if (u > L - 2.5 || v > H - 2.5) k *= 0.86;
      return k;
    });
    for (let i = 0; i < 5; i++) {
      let x = h() * N, y = h() * N;
      for (let s = 0; s < 4; s++) {
        const x1 = x + (h() - 0.5) * 16, y1 = y + (h() - 0.5) * 16;
        f.trait(x, y, x1, y1, 1, (px, py, couv) => f.mul(px, py, 0.82, couv));
        x = x1; y = y1;
      }
    }
  },
  terre(f) {
    marbrer(f, 0.1, 0.05, 8);
    semer(f, 900, 0.85);
    const h = f.hasard;
    for (let i = 0; i < 70; i++) caillou(f, h() * N, h() * N, 1.4 + h() * 2.6, 0.92 + h() * 0.2);
    for (let i = 0; i < 25; i++) caillou(f, h() * N, h() * N, 0.8 + h() * 0.8, 1.15);
  },
  roche(f) {
    // des strates (le long de x), ondulées, aux joints sombres ; des fissures ; des bosses
    const g = f.grille(4), g2 = f.grille(8), h = f.hasard;
    f.partout((x, y) => {
      const s = (y / N) * 9 + g(x, y) * 1.4 + 0.15 * Math.sin((x / N) * Math.PI * 6);
      const fr = s - Math.floor(s), bande = Math.floor(s);
      let k = (0.92 + ((bande * 0.37) % 1) * 0.16) * (1 + (g2(x, y) - 0.5) * 0.18) * (1 + (h() - 0.5) * 0.06);
      if (fr < 0.07) k *= 0.6; else if (fr < 0.14) k *= 1.12; else if (fr > 0.9) k *= 0.88;
      return k;
    });
    for (let i = 0; i < 9; i++) {
      let x = h() * N, y = h() * N;
      for (let s = 0; s < 3; s++) {
        const x1 = x + (h() - 0.5) * 8, y1 = y + 6 + h() * 10;
        f.trait(x, y, x1, y1, 1.2, (px, py, couv) => f.mul(px, py, 0.7, couv));
        x = x1; y = y1;
      }
    }
  },
  route(f) {
    marbrer(f, 0.05, 0.12, 8);
    semer(f, 1500, 1.15);
    const h = f.hasard;
    for (let i = 0; i < 3; i++) {
      let x = h() * N, y = h() * N;
      for (let s = 0; s < 6; s++) {
        const x1 = x + (h() - 0.5) * 22, y1 = y + (h() - 0.5) * 22;
        f.trait(x, y, x1, y1, 1, (px, py, couv) => f.mul(px, py, 0.78, couv));
        x = x1; y = y1;
      }
    }
  },
  sousBois(f) {
    // un sol de jungle : des feuilles mêlées, sombres et claires, et des brins
    marbrer(f, 0.1, 0.04);
    const h = f.hasard;
    for (let i = 0; i < 520; i++) {
      const k = h() < 0.55 ? 0.72 + h() * 0.1 : 1.1 + h() * 0.12;
      f.ellipse(h() * N, h() * N, 3 + h() * 3.5, 1.4 + h() * 1.2, h() * 6.3, (px, py, couv, u, v) => f.mul(px, py, k * (1 - 0.08 * v), couv));
    }
    for (let i = 0; i < 500; i++) {
      const x = h() * N, y = h() * N, t = -Math.PI / 2 + (h() - 0.5) * 1.2, l = 4 + h() * 7;
      f.trait(x, y, x + Math.cos(t) * l, y + Math.sin(t) * l, 1.2, (px, py, couv, s) => f.mul(px, py, 0.78, couv * (1 - s * 0.5)));
    }
  },
  bois(f) {
    // le fil du bois, en long (le long de y), et quelques nœuds
    const g = f.grille(4), h = f.hasard;
    const fil = Array.from({ length: 32 }, () => h());
    f.partout((x, y) => {
      const u = (x / N) * 32 + g(x, y) * 3;
      const i = ((Math.floor(u) % 32) + 32) % 32, fr = u - Math.floor(u);
      return (0.94 + fil[i] * 0.12) * (fr < 0.12 ? 0.86 : 1) * (1 + (h() - 0.5) * 0.04);
    });
    for (let i = 0; i < 3; i++) {
      const x = h() * N, y = h() * N;
      for (let r = 6; r > 0; r -= 2) f.ellipse(x, y, r * 0.7, r * 1.6, 0, (px, py, couv) => f.mul(px, py, r > 2 ? 0.93 : 0.75, couv));
    }
  },
  tuiles(f) {
    // les rangs de tuiles rondes (en long, le long de y), 4 par répétition ; les rangs de pose (en travers, 4 aussi) sont
    // peints par le shader, nets de près et fondus de loin (styles.js, PEINDRE_GLSL, 2026-10-31)
    const L = N / 4, g = f.grille(4);
    f.partout((x, y) => {
      const u = (x % L) / L;
      const k = u < 0.55 ? 0.92 + 0.22 * Math.sin((u / 0.55) * Math.PI) : 0.74 + 0.1 * Math.sin(((u - 0.55) / 0.45) * Math.PI);
      return k * (1 + (g(x, y) - 0.5) * 0.08) * (1 + (f.hasard() - 0.5) * 0.04);
    });
  },
  pierre(f) {
    marbrer(f, 0.09, 0.05, 8);
    semer(f, 1200, 0.86);
    semer(f, 600, 1.12);
    const h = f.hasard;
    for (let i = 0; i < 4; i++) {
      let x = h() * N, y = h() * N;
      for (let s = 0; s < 4; s++) {
        const x1 = x + (h() - 0.5) * 18, y1 = y + (h() - 0.5) * 18;
        f.trait(x, y, x1, y1, 1, (px, py, couv) => f.mul(px, py, 0.8, couv));
        x = x1; y = y1;
      }
    }
  },
  enduit(f) {
    marbrer(f, 0.025, 0.015);
    semer(f, 160, 0.93);
  },
  feuillage(f) {
    // des touffes de feuilles : claires en haut à gauche, sombres en bas à droite
    marbrer(f, 0.08, 0.03);
    const h = f.hasard;
    for (let i = 0; i < 700; i++) {
      const x = h() * N, y = h() * N, r = 2.5 + h() * 3;
      const k = h() < 0.5 ? 0.78 : 1.12;
      f.ellipse(x, y, r, r * 0.6, h() * 6.3, (px, py, couv, u, v) => f.mul(px, py, k * (1 + 0.1 * (-u - v) * 0.5), couv));
    }
  },
  laque(f) {
    const g = f.grille(16), g2 = f.grille(4);
    f.partout((x, y) => 1 + (g(x, y * 0.05) - 0.5) * 0.07 + (g2(x, y) - 0.5) * 0.05);
    semer(f, 120, 0.85);
  },
  tole(f) {
    const g = f.grille(4);
    f.partout((x) => 0.86 + 0.2 * (0.5 + 0.5 * Math.sin((x / N) * Math.PI * 2 * 16)));
    const h = f.hasard;
    for (let i = 0; i < 10; i++) f.disque(h() * N, h() * N, 2 + h() * 5, (px, py, couv) => f.mul(px, py, [1.08, 0.9, 0.76], couv * (0.4 + g(px, py) * 0.5)));
  },
  // le chaume des grands toits (Gokayama, 2026-10-23) : des brins de paille serrés le long de la pente (y : vers le
  // bas), plus ou moins dorés ou gris ; tous les quarts de feuille, un rang (une couche posée sur la précédente)
  // marqué d'une ombre ; çà et là, la paille vieillie, plus sombre, et un peu de mousse
  chaume(f) {
    const g = f.grille(8), g2 = f.grille(4), h = f.hasard;
    f.partout((x, y) => {
      const r = ((y / N) * 4 + g(x, y) * 0.35) % 1;
      return (0.92 + (g2(x, y) - 0.5) * 0.22) * (r > 0.93 ? 0.7 : r > 0.86 ? 0.84 : r < 0.05 ? 1.1 : 1);
    });
    for (let i = 0; i < 3200; i++) {
      const x = h() * N, y = h() * N, l = 8 + h() * 26, k = 0.72 + h() * 0.5, penche = (h() - 0.5) * 3;
      f.trait(x, y, x + penche, y + l, 1 + h() * 0.6, (px, py, couv, t) => f.mul(px, py, k * (0.94 + 0.12 * t), couv * 0.85));
    }
    for (let i = 0; i < 14; i++) f.disque(h() * N, h() * N, 6 + h() * 14, (px, py, couv) => f.mul(px, py, [0.82, 0.8, 0.72], couv * (0.3 + g(px, py) * 0.4)));
    for (let i = 0; i < 8; i++) f.disque(h() * N, h() * N, 3 + h() * 7, (px, py, couv) => f.mul(px, py, [0.8, 1.02, 0.7], couv * 0.45));
  },
  // la feuille d'or (le Pavillon d'or, 2026-10-26) : les feuilles carrées de 10,9 cm posées sur la laque, chacune un rien plus
  // claire ou plus foncée que sa voisine, leurs bords qui se chevauchent (un trait plus sombre, un liseré plus clair), le
  // poli en longues traînées. La couche se répète tous les 1,09 m : dix feuilles par côté
  or(f) {
    const n = 10, L = N / n, h = f.hasard, g = f.grille(4);
    const teintes = Array.from({ length: n * n }, () => 0.94 + h() * 0.11);
    f.partout((x, y) => {
      const i = Math.floor(x / L), j = Math.floor(y / L), u = x - i * L, v = y - j * L;
      let k = teintes[j * n + i] * (1 + (g(x, y) - 0.5) * 0.05);
      if (u < 1 || v < 1) k *= 0.86; else if (u < 2.2 || v < 2.2) k *= 1.06;
      return k * (1 + 0.03 * Math.sin((x + y * 0.35) * 0.21));
    });
    semer(f, 90, 1.1);
  },
  // la mousse des jardins de Kyoto (le Pavillon d'or, 2026-10-26) : un velours de petites touffes en étoile, claires dessus,
  // sombres entre elles, des plaques plus jaunes ou plus sombres ; quelques aiguilles de pin tombées, brunes, en V
  mousse(f) {
    marbrer(f, 0.09, 0.02, 4);
    const h = f.hasard;
    for (let i = 0; i < 1500; i++) {
      const x = h() * N, y = h() * N, r = 1.1 + h() * 1.6, k = h() < 0.5 ? 0.82 : 1.12;
      f.disque(x, y, r, (px, py, couv, dx, dy) => f.mul(px, py, k * (1.06 - 0.12 * (dx + dy) * 0.5), couv));
    }
    for (let i = 0; i < 9; i++) f.disque(h() * N, h() * N, 8 + h() * 16, (px, py, couv) => f.mul(px, py, h() < 0.5 ? [1.1, 1.08, 0.82] : [0.86, 0.9, 0.88], couv * 0.35));
    const aiguille = lineaire('#9a6a3e');
    for (let i = 0; i < 26; i++) {
      const x = h() * N, y = h() * N, t = h() * 6.28, l = 5 + h() * 4;
      for (const e of [-0.22, 0.22]) f.trait(x, y, x + Math.cos(t + e) * l, y + Math.sin(t + e) * l, 0.9, (px, py, couv) => f.poser(px, py, aiguille, couv * 0.8));
    }
  },
};

/** La texture en couches (THREE.DataArrayTexture) : la couche 0 est neutre. */
export function texturesDetail(THREE, anisotropie = 1) {
  const noms = Object.keys(MATIERES);
  const couches = noms.length + 1;
  const data = new Uint8Array(N * N * 4 * couches);
  for (let j = 0; j < N * N; j++) data.set([128, 128, 128, 255], j * 4);
  noms.forEach((nom, i) => {
    const f = feuille(1000 + i * 77);
    COUCHES[nom](f);
    f.octets(data, N * N * 4 * MATIERES[nom]);
  });
  const t = new THREE.DataArrayTexture(data, N, N, couches);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = anisotropie;
  t.needsUpdate = true;
  return t;
}
