// ================================================================
//  Les sons de la balade, fabriqués échantillon par échantillon : rien d'enregistré, rien à télécharger,
//  aucun droit. Du bruit filtré (le souffle, l'eau), des grains (le sable qui crisse, les brins d'herbe, le
//  gravier), des résonances (une planche qui sonne, une pierre) et des notes qui glissent (les oiseaux, les
//  insectes). Un « worker » les calcule à côté du jeu (bruitage.js), sans le ralentir.
//  fabriquer(quoi, sr) → les canaux (Float32Array, à sr échantillons par seconde). quoi :
//  - « pas/<sol>/<n> » : un pas (deux contacts, le talon puis la pointe), variante n ; sols : SOLS ;
//  - « ebrouer » : Kon qui s'ébroue en sortant de l'eau ;
//  - « boucle/<nom> » : une ambiance qui tourne en boucle sans couture (ventDoux, ventFort, feuilles, vagues,
//    vapeur, insectes ; no : la musique de la scène de nō d'Itsukushima, flûte et tambours) ;
//  - « oiseau/milan » (le milan noir, « pîhyororo »), « oiseau/uguisu » (la bouscarle, « hôhokekyo ») ou
//    « oiseau/mouette » (le goéland à queue noire, qui miaule).
//  Les pas et les oiseaux sortent à une force fixe (la plus forte valeur efficace sur 10 ms : 0,25 × la force
//  du sol) ; les boucles, à une valeur efficace de 1 : bruitage.js règle les volumes.
// ================================================================

const TAU = 2 * Math.PI;

/** Un tirage reproductible (mulberry32) : les mêmes sons à chaque visite. */
function alea(graine) {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** La graine d'un nom (FNV-1a). */
function graine(texte) {
  let h = 2166136261;
  for (let i = 0; i < texte.length; i++) h = Math.imul(h ^ texte.charCodeAt(i), 16777619);
  return h >>> 0;
}
const lisse = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

/** Un bruit blanc (toutes les fréquences), entre −1 et 1. */
function blanc(n, r) {
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = r() * 2 - 1;
  return x;
}
/** Un bruit brun (grave, un grondement) : le blanc intégré, avec une fuite. */
function brun(n, r) {
  const x = new Float32Array(n);
  let v = 0;
  for (let i = 0; i < n; i++) { v = v * 0.985 + (r() * 2 - 1) * 0.15; x[i] = v; }
  return x;
}

/**
 * Un filtre (biquadratique, les formules de R. Bristow-Johnson), appliqué à x en place : 'bas' (passe-bas),
 * 'haut' (passe-haut) ou 'bande' (passe-bande, gain 1 au centre). f : en Hz, ou fonction du temps (s).
 */
function filtrer(x, sr, type, f, q = 0.707) {
  let b0 = 0, b1 = 0, b2 = 0, a1 = 0, a2 = 0, x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  const regler = (fc) => {
    const w = (TAU * Math.min(Math.max(fc, 10), sr * 0.45)) / sr, cw = Math.cos(w), al = Math.sin(w) / (2 * q), a0 = 1 + al;
    if (type === 'bas') { b0 = (1 - cw) / 2 / a0; b1 = (1 - cw) / a0; b2 = b0; }
    else if (type === 'haut') { b0 = (1 + cw) / 2 / a0; b1 = -(1 + cw) / a0; b2 = b0; }
    else { b0 = al / a0; b1 = 0; b2 = -al / a0; }
    a1 = (-2 * cw) / a0;
    a2 = (1 - al) / a0;
  };
  const varie = typeof f === 'function';
  if (!varie) regler(f);
  for (let i = 0; i < x.length; i++) {
    if (varie && (i & 31) === 0) regler(f(i / sr));
    const v = x[i], y = b0 * v + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = v; y2 = y1; y1 = y;
    x[i] = y;
  }
  return x;
}

/** Ramène la valeur efficace de x (de tous les canaux) à `cible`. */
function normaliser(canaux, cible = 1) {
  let s = 0, n = 0;
  for (const x of canaux) { for (let i = 0; i < x.length; i++) s += x[i] * x[i]; n += x.length; }
  const k = cible / Math.sqrt(s / n || 1e-20);
  for (const x of canaux) for (let i = 0; i < x.length; i++) x[i] *= k;
  return canaux;
}

/** La plus forte valeur efficace sur 10 ms ramenée à `cible` (la force d'un pas), sans dépasser ±0,98. */
function cadrer(canaux, sr, cible) {
  const w = Math.round(sr * 0.01);
  let max = 0;
  for (const x of canaux) {
    let s = 0;
    for (let i = 0; i < x.length; i++) {
      s += x[i] * x[i];
      if (i >= w) s -= x[i - w] * x[i - w];
      if (i >= w - 1) max = Math.max(max, s / w);
    }
  }
  let k = cible / Math.sqrt(max || 1e-20), crete = 0;
  for (const x of canaux) for (let i = 0; i < x.length; i++) crete = Math.max(crete, Math.abs(x[i]) * k);
  if (crete > 0.98) k *= 0.98 / crete;
  for (const x of canaux) for (let i = 0; i < x.length; i++) x[i] *= k;
  return canaux;
}

/** Une boucle sans couture : les `fondu` dernières secondes se fondent dans le début (à puissance égale). */
function boucler(x, sr, fondu) {
  const f = Math.round(fondu * sr), n = x.length - f, y = x.slice(0, n);
  for (let i = 0; i < f; i++) {
    const w = (i / f) * (Math.PI / 2);
    y[i] = x[i] * Math.sin(w) + x[n + i] * Math.cos(w);
  }
  return y;
}

/** Un son de `duree` secondes qu'on compose morceau par morceau (chaque méthode renvoie le compositeur). */
function composer(sr, r, duree) {
  const n = Math.ceil(duree * sr);
  const b = new Float32Array(n);
  const c = {
    b,
    /** Ajoute x à partir de t0 (s), multiplié par gain. */
    mettre(x, t0, gain = 1) {
      const i0 = Math.round(t0 * sr);
      for (let i = Math.max(0, -i0); i < x.length && i0 + i < n; i++) b[i0 + i] += x[i] * gain;
      return c;
    },
    /**
     * Un bruit filtré (type, f, q : filtrer) qui monte en `attaque` s puis s'éteint (constante de temps tau),
     * ou qui suit forme(t) ; grave : un bruit brun. Il est d'abord ramené à une valeur efficace de 1.
     */
    bruit(t0, { type = 'bande', f, q = 0.7, attaque = 0.002, tau = 0.03, gain = 1, duree, forme, grave = false }) {
      const m = Math.ceil((duree ?? attaque + tau * 7) * sr);
      const x = grave ? brun(m, r) : blanc(m, r);
      filtrer(x, sr, type, f, q);
      normaliser([x]);
      for (let i = 0; i < m; i++) {
        const t = i / sr;
        x[i] *= forme ? forme(t) : t < attaque ? t / attaque : Math.exp(-(t - attaque) / tau);
      }
      return c.mettre(x, t0, gain);
    },
    /**
     * Des grains : de tout petits éclats de bruit (le sable qui crisse, les brins, le gravier), dans des zones
     * [début, fin, poids], plus serrés au début de chaque zone ; f, d (durée), g (gain) : [min, max].
     */
    grains(nombre, { zones, f: [f0, f1], d: [d0, d1], g: [g0, g1], q = 1.5 }) {
      const total = zones.reduce((s, z) => s + z[2] * (z[1] - z[0]), 0);
      for (let k = 0; k < nombre; k++) {
        let u = r() * total, z = zones[zones.length - 1];
        for (const zz of zones) {
          const w = zz[2] * (zz[1] - zz[0]);
          if (u < w) { z = zz; break; }
          u -= w;
        }
        const t = z[0] + (z[1] - z[0]) * r() ** 1.6;
        const m = Math.max(8, Math.ceil((d0 + (d1 - d0) * r()) * sr));
        const x = blanc(m, r);
        filtrer(x, sr, 'bande', f0 * (f1 / f0) ** r(), q);
        normaliser([x]);
        const att = Math.max(1, Math.min(m / 4, sr * 0.0003));
        for (let i = 0; i < m; i++) x[i] *= Math.min(1, i / att) * Math.exp(-i / (m / 3.5));
        c.mettre(x, t, g0 + (g1 - g0) * r());
      }
      return c;
    },
    /** Des résonances (une planche, une pierre) frappées à t0 : [fréquence, amplitude, tau]. */
    modes(t0, liste, gain = 1) {
      const i0 = Math.round(t0 * sr);
      for (const [f, a, tau] of liste) {
        const fin = Math.min(n, i0 + Math.ceil(tau * 7 * sr)), phi = r() * 0.3;
        for (let i = Math.max(0, i0); i < fin; i++) {
          const t = (i - i0) / sr;
          b[i] += gain * a * Math.exp(-t / tau) * Math.sin(TAU * f * t + phi) * Math.min(1, t / 0.0006);
        }
      }
      return c;
    },
    /** Des bulles : une petite note qui monte et s'éteint vite, entre les instants de et a. */
    bulles(nombre, { de, a, f: [f0, f1], g: [g0, g1] }) {
      for (let k = 0; k < nombre; k++) {
        const t0 = de + (a - de) * r() ** 1.5, fb = f0 * (f1 / f0) ** r(), tau = 0.01 + r() * 0.022, amp = g0 + (g1 - g0) * r();
        const i0 = Math.round(t0 * sr), fin = Math.min(n, i0 + Math.ceil(tau * 6 * sr));
        let ph = 0;
        for (let i = i0; i < fin; i++) {
          const t = (i - i0) / sr;
          ph += (TAU * fb * (1 + 0.7 * Math.min(1, t / 0.035))) / sr;
          b[i] += amp * Math.exp(-t / tau) * Math.sin(ph) * Math.min(1, t / 0.001);
        }
      }
      return c;
    },
    /** Une planche qui grince : des à-coups (frottement collé-glissé) qui accélèrent, passés dans deux résonances. */
    craquer(t0, { duree, f0, f1, gain }) {
      const m = Math.ceil(duree * sr), x = new Float32Array(m);
      for (let t = 0; t < duree;) {
        const i = Math.floor(t * sr);
        if (i < m) x[i] += (r() < 0.5 ? -1 : 1) * (0.6 + 0.4 * r());
        t += (1 / (f0 + ((f1 - f0) * t) / duree)) * (0.85 + 0.3 * r());
      }
      const a = filtrer(x.slice(), sr, 'bande', 720, 5), h = filtrer(x, sr, 'bande', 1650, 6);
      filtrer(a, sr, 'bas', 3000);
      filtrer(h, sr, 'bas', 3000);
      for (let i = 0; i < m; i++) {
        const t = i / sr;
        a[i] = (a[i] + h[i] * 0.6) * Math.min(1, t / 0.03) * Math.min(1, (duree - t) / 0.05);
      }
      normaliser([a]);
      return c.mettre(a, t0, gain);
    },
    /**
     * Un cri nasillard (un goéland) : une note f(t) riche en harmoniques, passée par un formant (centre fc et
     * largeur bw, en Hz, et un second plus grave), un peu rauque (un battement rapide), d'amplitude a(t).
     */
    cri(t0, duree, f, a, { fc = 2200, bw = 1300, rauque = 0.25 } = {}) {
      const i0 = Math.round(t0 * sr), m = Math.ceil(duree * sr);
      let ph = 0, pr = 0;
      for (let i = 0; i < m && i0 + i < n; i++) {
        const t = i / sr, f0 = f(t);
        ph += (TAU * f0) / sr;
        pr += (TAU * 64) / sr;
        let v = 0;
        for (let k = 1; k * f0 < sr * 0.45 && k <= 14; k++) {
          const fk = k * f0, g = Math.exp(-(((fk - fc) / bw) ** 2)) + 0.3 * Math.exp(-(((fk - fc * 0.45) / (bw * 0.5)) ** 2));
          v += (g * Math.sin(k * ph)) / Math.sqrt(k);
        }
        if (i0 + i >= 0) b[i0 + i] += a(t) * v * (1 - rauque + rauque * Math.sin(pr));
      }
      return c;
    },
    /** Une note sifflée (un oiseau, un insecte) : fréquence f(t), amplitude a(t), un peu de seconde harmonique. */
    ton(t0, duree, f, a, h2 = 0.12) {
      const i0 = Math.round(t0 * sr), m = Math.ceil(duree * sr);
      let ph = 0;
      for (let i = 0; i < m && i0 + i < n; i++) {
        const t = i / sr;
        ph += (TAU * f(t)) / sr;
        if (i0 + i >= 0) b[i0 + i] += a(t) * (Math.sin(ph) + h2 * Math.sin(2 * ph));
      }
      return c;
    },
  };
  return c;
}

/** Une enveloppe : monte en `att` s, tient, descend dans les `rel` dernières secondes d'une note de `d` s. */
const ad = (att, rel, d) => (t) => Math.max(0, Math.min(1, t / att, (d - t) / rel));

// ---------------------------------------------------------------- Les pas
// dt : le temps entre le talon et la pointe du pied
export const SOLS = {
  // l'herbe : un pied qui s'enfonce un peu (sourd), et les brins qui froissent et crépitent
  herbe(c, r, dt) {
    c.bruit(0.004, { type: 'bas', f: 170, tau: 0.028, gain: 0.5 })
      .bruit(0.004 + dt, { type: 'bas', f: 150, tau: 0.02, gain: 0.22 })
      .bruit(0.006, { f: 2800 + r() * 1500, q: 0.6, attaque: 0.008, tau: 0.045, gain: 0.3 })
      .bruit(0.006 + dt, { f: 3300 + r() * 1500, q: 0.6, attaque: 0.01, tau: 0.04, gain: 0.2 })
      .grains(32 + Math.floor(r() * 18), { zones: [[0.004, 0.05, 1], [dt, dt + 0.07, 0.8]], f: [1800, 7500], d: [0.001, 0.0045], g: [0.15, 0.55], q: 1.4 });
  },
  // le sable sec : un souffle étouffé et des centaines de grains qui crissent
  sable(c, r, dt) {
    c.bruit(0.004, { type: 'bas', f: 140, tau: 0.03, gain: 0.4 })
      .bruit(0.008, { f: 1400 + r() * 500, q: 0.7, attaque: 0.012, tau: 0.07, gain: 0.25 })
      .grains(100 + Math.floor(r() * 40), { zones: [[0.004, 0.09, 1], [dt, dt + 0.1, 0.7]], f: [700, 3200], d: [0.0006, 0.002], g: [0.12, 0.5], q: 1.8 });
  },
  // le sable mouillé de l'estran : plus sourd, tassé, un petit bruit de succion quand le pied se lève
  estran(c, r, dt) {
    c.bruit(0.004, { type: 'bas', f: 230, tau: 0.04, gain: 0.75 })
      .bruit(0.004 + dt, { type: 'bas', f: 200, tau: 0.03, gain: 0.3 })
      .bruit(0.02, { f: (t) => 450 + 1100 * Math.exp(-t / 0.05), q: 3, attaque: 0.008, tau: 0.045, gain: 0.3 })
      .bruit(dt + 0.05, { f: (t) => 500 + 1500 * Math.min(1, t / 0.06), q: 2.5, attaque: 0.01, tau: 0.03, gain: 0.16 })
      .grains(20, { zones: [[0.004, 0.06, 1]], f: [600, 1800], d: [0.0008, 0.0025], g: [0.08, 0.22], q: 1.6 });
  },
  // le plancher : un « toc » sourd, la planche qui résonne, et parfois qui grince
  bois(c, r, dt) {
    const f0 = 118 + r() * 34;
    const planche = [[f0, 1, 0.05], [f0 * 2.27, 0.55, 0.045], [f0 * 3.9, 0.4, 0.035], [f0 * 6.8, 0.22, 0.025], [f0 * 11.3, 0.1, 0.015]];
    c.bruit(0.004, { type: 'bas', f: 420, tau: 0.018, gain: 0.45 })
      .bruit(0.004, { type: 'haut', f: 2200, attaque: 0.0003, tau: 0.003, gain: 0.22 })
      .modes(0.004, planche, 0.5)
      .bruit(0.004 + dt, { type: 'bas', f: 380, tau: 0.014, gain: 0.2 })
      .bruit(0.004 + dt, { type: 'haut', f: 2500, attaque: 0.0003, tau: 0.003, gain: 0.1 })
      .modes(0.004 + dt, planche.map(([f, a, t]) => [f * 1.04, a, t * 0.8]), 0.2);
    if (r() < 0.4) c.craquer(0.05 + r() * 0.05, { duree: 0.14 + r() * 0.12, f0: 150 + r() * 80, f1: 210 + r() * 120, gain: 0.12 });
  },
  // la pierre (dalles, marches) : un claquement net, une résonance courte, la semelle qui frotte
  pierre(c, r, dt) {
    c.modes(0.004, [[100 + r() * 25, 0.6, 0.022], [380 + r() * 60, 0.35, 0.01], [1250 + r() * 200, 0.2, 0.006]], 0.5)
      .bruit(0.004, { type: 'haut', f: 1800, attaque: 0.0004, tau: 0.007, gain: 0.55 })
      .bruit(0.004 + dt, { f: 3200, q: 0.8, attaque: 0.006, tau: 0.03, gain: 0.28 })
      .grains(10, { zones: [[0.004, 0.03, 1], [dt, dt + 0.04, 1]], f: [3000, 8000], d: [0.0005, 0.0015], g: [0.05, 0.15], q: 2 });
  },
  // l'asphalte : plus mat que la pierre, granuleux
  route(c, r, dt) {
    c.modes(0.004, [[90 + r() * 20, 0.5, 0.02]], 0.5)
      .bruit(0.004, { f: 2600, q: 0.6, attaque: 0.0005, tau: 0.008, gain: 0.5 })
      .bruit(0.004 + dt, { f: 2400, q: 0.7, attaque: 0.006, tau: 0.035, gain: 0.3 })
      .grains(35, { zones: [[0.004, 0.04, 1], [dt, dt + 0.05, 1]], f: [1500, 5500], d: [0.0006, 0.002], g: [0.06, 0.2], q: 1.8 });
  },
  // la terre des chemins : sourde, quelques graviers
  terre(c, r, dt) {
    c.bruit(0.004, { type: 'bas', f: 260, tau: 0.035, gain: 0.7 })
      .bruit(0.004 + dt, { type: 'bas', f: 230, tau: 0.025, gain: 0.3 })
      .bruit(0.01, { f: 1300, q: 0.7, attaque: 0.01, tau: 0.05, gain: 0.15 })
      .grains(45, { zones: [[0.004, 0.06, 1], [dt, dt + 0.06, 0.8]], f: [800, 3800], d: [0.001, 0.004], g: [0.08, 0.3], q: 1.5 });
  },
  // la roche volcanique : des scories qui crissent et quelques cailloux qui s'entrechoquent
  roche(c, r, dt) {
    c.bruit(0.004, { type: 'bas', f: 200, tau: 0.03, gain: 0.55 })
      .grains(100, { zones: [[0.004, 0.08, 1], [dt, dt + 0.09, 0.8]], f: [1000, 5500], d: [0.0008, 0.003], g: [0.1, 0.4], q: 1.6 });
    for (let k = 0; k < 4; k++) c.modes(0.01 + r() * (dt + 0.06), [[700 + r() * 1300, 1, 0.006]], 0.1 + r() * 0.08);
  },
  // le sous-bois : feuilles mortes et brindilles
  sousBois(c, r, dt) {
    c.bruit(0.004, { type: 'bas', f: 190, tau: 0.03, gain: 0.45 })
      .bruit(0.01, { f: 4500, q: 0.5, attaque: 0.012, tau: 0.07, gain: 0.18 })
      .grains(70, { zones: [[0.004, 0.11, 1], [dt, dt + 0.1, 0.8]], f: [2200, 8500], d: [0.0005, 0.002], g: [0.06, 0.32], q: 1.2 });
    if (r() < 0.25) c.modes(0.02 + r() * 0.05, [[1800 + r() * 900, 1, 0.004]], 0.2);
  },
  // l'eau où l'on patauge : le « plouf » qui descend, des bulles, des gouttes qui retombent, le pied qui ressort
  eau(c, r, dt) {
    c.bruit(0.006, { f: (t) => 330 + 1500 * Math.exp(-t / 0.045), q: 1.1, attaque: 0.006, tau: 0.075, gain: 0.8 })
      .bruit(0.006, { type: 'bas', f: 520, attaque: 0.008, tau: 0.11, gain: 0.45 })
      .bulles(8 + Math.floor(r() * 7), { de: 0.02, a: 0.3, f: [380, 1300], g: [0.12, 0.35] })
      .grains(7, { zones: [[0.12, 0.42, 1]], f: [2500, 6000], d: [0.0008, 0.002], g: [0.04, 0.12], q: 2 })
      .bruit(dt + 0.07, { f: (t) => 380 + 1200 * Math.min(1, t / 0.07), q: 1.8, attaque: 0.015, tau: 0.04, gain: 0.3 });
  },
};
// la force de chaque sol, l'un par rapport à l'autre (l'herbe est plus douce que le plancher)
const FORCE_SOL = { herbe: 0.7, sable: 0.65, estran: 0.8, bois: 1, pierre: 0.85, route: 0.8, terre: 0.75, roche: 0.9, sousBois: 0.72, eau: 0.95 };
const DUREE_SOL = { eau: 0.55, bois: 0.42 };

function pas(sol, variante, sr) {
  const r = alea(graine(`pas/${sol}/${variante}`));
  const c = composer(sr, r, DUREE_SOL[sol] || 0.34);
  SOLS[sol](c, r, 0.05 + r() * 0.035);
  return cadrer([c.b], sr, 0.25 * FORCE_SOL[sol]);
}

/** Kon qui s'ébroue : le pelage qui claque par à-coups (un peu plus de huit fois par seconde) et les gouttes. */
function ebrouer(sr) {
  const r = alea(graine('ebrouer'));
  const c = composer(sr, r, 1.0);
  const forme = (t) => lisse(0, 0.06, t) * (1 - lisse(0.6, 0.85, t)) * (0.3 + 0.7 * Math.abs(Math.sin(TAU * 4.3 * t)));
  c.bruit(0.02, { f: 1600, q: 0.6, gain: 0.6, duree: 0.85, forme })
    .bruit(0.02, { type: 'bas', f: 300, gain: 0.25, duree: 0.85, forme })
    .grains(40, { zones: [[0.05, 0.95, 1]], f: [2500, 7000], d: [0.0006, 0.002], g: [0.05, 0.2], q: 2 });
  return cadrer([c.b], sr, 0.25);
}

// ---------------------------------------------------------------- Les ambiances (des boucles)
/** Un bruit qui varie lentement (0 à 1) : des sinus lents aux phases tirées au sort. */
function houle(r, ...periodes) {
  const p = periodes.map((s) => [TAU / s, r() * TAU]);
  return (t) => 0.5 + 0.5 * p.reduce((s, [w, ph]) => s + Math.sin(w * t + ph), 0) / p.length;
}

const BOUCLES = {
  // le vent doux : un souffle grave qui enfle et retombe lentement
  ventDoux(sr, r) {
    const L = 10, F = 0.6, n = Math.ceil((L + F) * sr), lent = houle(r, 7.7, 3.2, 1.9);
    const x = brun(n, r);
    filtrer(x, sr, 'bas', 260, 0.6);
    for (let i = 0; i < n; i++) x[i] *= 0.55 + 0.45 * lent(i / sr);
    return normaliser([boucler(x, sr, F)]);
  },
  // la rafale : un souffle plus clair dont la couleur bouge, et un sifflement qui monte et descend
  ventFort(sr, r) {
    const L = 11, F = 0.6, n = Math.ceil((L + F) * sr), lent = houle(r, 5.3, 2.3, 1.1);
    const x = brun(n, r), b = blanc(n, r);
    for (let i = 0; i < n; i++) x[i] = x[i] * 3 + b[i] * 0.25;
    filtrer(x, sr, 'bande', (t) => 600 + 350 * Math.sin(TAU * 0.09 * t) + 150 * Math.sin(TAU * 0.23 * t + 1), 0.5);
    normaliser([x]);
    const s = blanc(n, r);
    filtrer(s, sr, 'bande', (t) => 850 + 250 * Math.sin(TAU * 0.07 * t + 1) + 80 * Math.sin(TAU * 0.41 * t), 9);
    normaliser([s]);
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      x[i] = (x[i] + s[i] * 0.2 * (0.5 + 0.5 * Math.sin(TAU * 0.11 * t))) * (0.5 + 0.5 * lent(t));
    }
    return normaliser([boucler(x, sr, F)]);
  },
  // les feuilles : un froissement aigu, fait de bouffées, et des crépitements
  feuilles(sr, r) {
    const L = 7, F = 0.4, T = L + F, n = Math.ceil(T * sr);
    const c = composer(sr, r, T);
    const x = blanc(n, r);
    filtrer(x, sr, 'haut', 1400, 0.7);
    filtrer(x, sr, 'bande', 4200, 0.45);
    normaliser([x]);
    const env = new Float32Array(n).fill(0.18);
    for (let k = 0; k < 75; k++) {
      const t = r() * T, w = 0.03 + r() * 0.16, a = 0.25 + r() * 0.8;
      for (let i = Math.max(0, Math.floor((t - w) * sr)); i < Math.min(n, Math.ceil((t + w) * sr)); i++) {
        env[i] += a * 0.5 * (1 + Math.cos((Math.PI * (i / sr - t)) / w));
      }
    }
    for (let i = 0; i < n; i++) c.b[i] = x[i] * Math.min(1.4, env[i]);
    c.grains(260, { zones: [[0, T, 1]], f: [2500, 9000], d: [0.0005, 0.002], g: [0.1, 0.5], q: 1.2 });
    return normaliser([boucler(c.b, sr, F)]);
  },
  // le clapotis : trois vagues douces qui viennent mourir (le corps grave, puis l'écume qui pétille en se
  // retirant), sur un murmure grave ; un peu à gauche, un peu à droite
  vagues(sr, r) {
    const L = 16, F = 1, T = L + F, n = Math.ceil(T * sr);
    const fond = brun(n, r);
    filtrer(fond, sr, 'bas', 220, 0.7);
    normaliser([fond], 0.22);
    const g = fond.slice(), d = fond;
    const env = (t) => (t < 1 ? lisse(0, 1, t) : Math.exp(-(t - 1) / 1.3));
    for (const debut of [0.3, 5.6, 10.9]) {
      const t0 = debut + (r() - 0.5) * 0.8, duree = 4.6, m = Math.ceil(duree * sr), pan = (r() - 0.5) * 0.8;
      const corps = brun(m, r);
      filtrer(corps, sr, 'bas', (t) => 260 + 950 * env(t), 0.6);
      normaliser([corps]);
      const ecume = blanc(m, r);
      filtrer(ecume, sr, 'haut', 1500);
      filtrer(ecume, sr, 'bande', 3200, 0.45);
      filtrer(ecume, sr, 'bas', 6000, 0.7);
      normaliser([ecume]);
      const bulles = composer(sr, r, duree).grains(220, { zones: [[1, 3.6, 1]], f: [1800, 7000], d: [0.0008, 0.003], g: [0.05, 0.25], q: 1.4 }).b;
      const j0 = Math.round(t0 * sr);
      for (let i = 0; i < m && j0 + i < n; i++) {
        const t = i / sr, e = env(t), ef = env(Math.max(0, t - 0.45)), fin = Math.min(1, (duree - t) / 0.8);
        const v = (corps[i] * e * 0.9 + ecume[i] * ef * 0.2 + bulles[i] * Math.min(1, ef * 1.5) * 0.7) * fin;
        g[j0 + i] += v * (1 - pan);
        d[j0 + i] += v * (1 + pan);
      }
    }
    return normaliser([boucler(g, sr, F), boucler(d, sr, F)]);
  },
  // les fumerolles : un souffle aigu qui sort par bouffées
  vapeur(sr, r) {
    const L = 6, F = 0.4, n = Math.ceil((L + F) * sr), lent = houle(r, 1.7, 0.83, 0.41);
    const x = blanc(n, r);
    filtrer(x, sr, 'haut', 1600, 0.7);
    filtrer(x, sr, 'bande', 3600, 0.5);
    for (let i = 0; i < n; i++) x[i] *= 0.45 + 0.55 * lent(i / sr) ** 2;
    return normaliser([boucler(x, sr, F)]);
  },
  // la nuit : un grillon à gauche (des stridulations de trois coups), un « grillon-clochette » (suzumushi) à
  // droite (« riiin »), et un troisième, loin, qui trille sans cesse
  insectes(sr, r) {
    const L = 9, F = 0.3, T = L + F;
    const a = composer(sr, r, T), b = composer(sr, r, T), c = composer(sr, r, T);
    for (let t = r() * 0.3; t < T - 0.2; t += 0.45 + r() * 0.2) {
      const f = 4650 + (r() - 0.5) * 80;
      for (let k = 0; k < 3; k++) a.ton(t + k * 0.032, 0.015, () => f, ad(0.003, 0.004, 0.015), 0.05);
    }
    for (let t = 0.4 + r() * 0.5; t < T - 0.5; t += 1.3 + r() * 0.6) {
      b.ton(t, 0.36, (u) => 4150 + 30 * Math.sin(TAU * 3 * u), (u) => ad(0.02, 0.08, 0.36)(u) * (0.5 + 0.5 * Math.sin(TAU * 48 * u)) ** 2, 0.04);
    }
    const lent = houle(r, 4.1, 1.7);
    c.ton(0, T, () => 3550, (u) => 0.08 * (0.5 + 0.5 * Math.sin(TAU * 24 * u)) * (0.7 + 0.3 * lent(u)), 0.03);
    const n = a.b.length, g = new Float32Array(n), d = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      g[i] = a.b[i] * 0.8 + b.b[i] * 0.3 + c.b[i] * 0.5;
      d[i] = a.b[i] * 0.25 + b.b[i] * 0.85 + c.b[i] * 0.5;
    }
    return normaliser([boucler(g, sr, F), boucler(d, sr, F)]);
  },
  // la scène de nō (Itsukushima) : la flûte nōkan (un souffle perçant qui glisse d'une note à l'autre, avec son cri
  // aigu, le « hishigi »), le petit tambour d'épaule (« pon », qui chante en descendant), le grand tambour de la
  // hanche (« kan », sec et claquant), le tambour plat (« ten ») ; une phrase de seize secondes, sans les voix
  no(sr, r) {
    const L = 16, F = 0.5, T = L + F;
    const fl = composer(sr, r, T), tb = composer(sr, r, T);
    // la flûte : des notes glissées [début, durée, de, à], un vibrato lent, beaucoup de souffle autour de la note
    for (const [t0, d, fa, fb] of [[0.1, 1.5, 990, 1180], [1.75, 1.2, 1180, 1050], [3.2, 2.3, 880, 900], [5.9, 0.9, 1320, 2650], [7.2, 2.1, 1050, 980], [9.8, 1.4, 1180, 1190], [11.5, 2.7, 990, 870], [14.6, 1.2, 880, 990]]) {
      const glisse = Math.min(0.35, d * 0.4);
      const f = (t) => { const u = Math.min(1, t / glisse); return (fa + (fb - fa) * u * u * (3 - 2 * u)) * (1 + 0.012 * Math.sin(TAU * 5.2 * t) * Math.min(1, t / 0.4)); };
      fl.ton(t0, d, f, (t) => ad(0.05, 0.25, d)(t) * 0.5, 0.25)
        .bruit(t0, { type: 'bande', f: (fa + fb) / 2, q: 2.5, duree: d, forme: ad(0.04, 0.2, d), gain: 0.2 });
    }
    // les tambours
    const pon = (t0, g = 1) => tb.ton(t0, 0.5, (t) => 300 + 140 * Math.exp(-t / 0.03), (t) => Math.exp(-t / 0.13) * Math.min(1, t / 0.002) * g, 0.2)
      .bruit(t0, { type: 'bande', f: 900, q: 1.2, tau: 0.012, gain: 0.25 * g });
    const kan = (t0, g = 1) => tb.bruit(t0, { type: 'bande', f: 2800, q: 1.6, tau: 0.018, gain: 0.9 * g }).modes(t0, [[1150, 0.35 * g, 0.035], [2300, 0.15 * g, 0.02]]);
    const ten = (t0, g = 1) => tb.modes(t0, [[190, 0.6 * g, 0.12], [345, 0.35 * g, 0.08]]).bruit(t0, { type: 'bande', f: 1800, q: 1, tau: 0.01, gain: 0.3 * g });
    for (const t of [1.2, 3.0, 5.6, 7.1, 9.5, 11.2, 13.8]) pon(t, 0.8 + 0.2 * r());
    for (const t of [2.1, 6.2, 10.4, 14.6]) kan(t);
    for (const [t, g] of [[4.0, 0.6], [4.25, 0.6], [4.5, 1], [12.0, 0.6], [12.25, 0.6], [12.5, 1]]) ten(t, g);
    normaliser([fl.b]);
    normaliser([tb.b], 0.9);
    // la flûte un peu à gauche, les tambours un peu à droite ; l'écho de la baie
    const n = fl.b.length, g = new Float32Array(n), d = new Float32Array(n);
    for (let i = 0; i < n; i++) { g[i] = fl.b[i] * 0.9 + tb.b[i] * 0.6; d[i] = fl.b[i] * 0.6 + tb.b[i] * 0.9; }
    return normaliser([boucler(echo(g, sr), sr, F), boucler(echo(d, sr), sr, F)]);
  },
};

// ---------------------------------------------------------------- Les oiseaux
/** De l'écho (la forêt, la falaise) : quelques reflets de plus en plus faibles et sourds. */
function echo(x, sr) {
  const y = x.slice();
  for (const [d, g] of [[0.07, 0.28], [0.13, 0.18], [0.21, 0.12], [0.34, 0.07]]) {
    const k = Math.round(d * sr), z = filtrer(x.slice(), sr, 'bas', 2500, 0.7);
    for (let i = k; i < y.length; i++) y[i] += z[i - k] * g;
  }
  return y;
}

const OISEAUX = {
  // le milan noir (tobi) : un long « piii » aigu, puis « hyorororo », qui ondule en descendant
  milan(sr, r) {
    const c = composer(sr, r, 2.6);
    c.ton(0.05, 0.75, (t) => 2650 - 250 * t + 30 * Math.sin(TAU * 7 * t), ad(0.06, 0.1, 0.75))
      .ton(0.95, 1.1, (t) => 2500 - 600 * t + 320 * Math.sin(TAU * 8.5 * t) * Math.min(1, t / 0.15), (t) => ad(0.03, 0.3, 1.1)(t) * (1 - 0.4 * t));
    return cadrer([echo(c.b, sr)], sr, 0.25);
  },
  // le goéland à queue noire (umineko, « le chat de la mer ») : trois miaulements nasillards, « myaa… myaa… kyao »
  mouette(sr, r) {
    const c = composer(sr, r, 1.75);
    const miaou = (t0, d, fa, fb, fz) => c.cri(t0, d, (t) => {
      const u = t / d;
      return u < 0.35 ? fa + (fb - fa) * (u / 0.35) : fb + (fz - fb) * ((u - 0.35) / 0.65);
    }, (t) => ad(0.03, 0.14, d)(t) * (0.8 + 0.2 * Math.sin((Math.PI * t) / d)), { fc: 2300, bw: 1300, rauque: 0.3 });
    miaou(0.02, 0.46, 600, 960, 540);
    miaou(0.6, 0.4, 660, 1040, 590);
    miaou(1.16, 0.26, 760, 1150, 700);
    return cadrer([echo(c.b, sr)], sr, 0.25);
  },
  // la bouscarle du Japon (uguisu), l'oiseau du printemps : « hôôô… ho-ke-kyo ! »
  uguisu(sr, r) {
    const c = composer(sr, r, 2.4);
    c.ton(0.05, 1.05, (t) => 980 + 90 * t + 10 * Math.sin(TAU * 5 * t), (t) => ad(0.18, 0.06, 1.05)(t) * (0.5 + 0.5 * t))
      .ton(1.25, 0.11, (t) => 1500 - 600 * t, ad(0.01, 0.03, 0.11))
      .ton(1.39, 0.07, (t) => 2900 - 5000 * t, ad(0.005, 0.02, 0.07))
      .ton(1.5, 0.32, (t) => (t < 0.05 ? 2100 + 18000 * t : 3000 - 1500 * (t - 0.05) + 60 * Math.sin(TAU * 28 * t)), ad(0.01, 0.12, 0.32));
    return cadrer([echo(c.b, sr)], sr, 0.25);
  },
};

/** Le son demandé (voir l'en-tête), en canaux de Float32Array. */
export function fabriquer(quoi, sr) {
  const [sorte, nom, n] = quoi.split('/');
  if (sorte === 'pas') return pas(nom, Number(n) || 0, sr);
  if (sorte === 'ebrouer') return ebrouer(sr);
  if (sorte === 'boucle') return BOUCLES[nom](sr, alea(graine(quoi)));
  if (sorte === 'oiseau') return OISEAUX[nom](sr, alea(graine(quoi)));
  throw new Error(`son inconnu : ${quoi}`);
}

// Dans un worker : on reçoit { sr, liste } et l'on renvoie chaque son dès qu'il est prêt (sans copie).
if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
  self.onmessage = (e) => {
    const { sr, liste } = e.data;
    for (const quoi of liste) {
      try {
        const canaux = fabriquer(quoi, sr);
        self.postMessage({ quoi, canaux }, canaux.map((c) => c.buffer));
      } catch (err) {
        self.postMessage({ quoi, erreur: String(err) });
      }
    }
  };
}
