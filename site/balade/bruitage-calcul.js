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
//  - « oiseau/milan » (le milan noir, « pîhyororo »), « oiseau/uguisu » (la bouscarle, « hôhokekyo »),
//    « oiseau/mouette » (le goéland à queue noire, qui miaule) ou « oiseau/akakokko » (la grive des îles d'Izu,
//    « kyoron kyoron tsîî ») ;
//  - « bete/miaou », « bete/ronron » : les chats d'Aogashima ;
//  - « cri/kon » (le renard : deux jappements, « kon kon »), « cri/pon » (le tanuki se tambourine le ventre :
//    « pon, poko, pon »), « cri/chapu » (la loutre : trois petits cris aigus, et un plouf), et les compagnons
//    secrets (2026-10-23) : « cri/gao » (le shisa : un petit rugissement, « gao ! »), « cri/fuwa » (le bébé dragon :
//    un trille de clochettes et un souffle), « cri/saya » (l'esprit de l'arbre : du bois qu'on frappe, « kon, koro,
//    kon », et des feuilles) ; « tambour » (un seul coup sur le ventre du tanuki, quand il s'ennuie) ; « pouf » (un
//    compagnon qui s'en va dans un nuage) ;
//  - les trésors (2026-10-23) : « oiseau/corbeau » (les corbeaux sacrés d'Itsukushima, « kaa, kaa »), « pelle » (on
//    creuse la terre à la main), « boite » (la vieille boîte en fer qu'on ouvre), « feu/depart » (une fusée qui
//    siffle en montant), « feu/boum » (l'éclat, grave, et son écho), « feu/crepite » (les mille éclats).
//  - Gokayama (2026-10-23) : « boucle/riviere » (la rivière Shō, en bas de sa gorge), « boucle/ruisseau » (le ruisseau
//    qui traverse le village), « boucle/grenouilles » (les rainettes des rizières, la nuit), « boucle/kokiriko » (la
//    musique de la danse : la flûte, la sasara qui claque, les baguettes de bambou, le tambour) ; « oiseau/aosagi » (le
//    héron cendré, un « gwaa » rauque), « bete/ouaf » (le shiba du minshuku, « wan ! ») ; « creux » (la planche qui sonne
//    creux), « jets » (les canons à eau qui s'ouvrent, l'eau qui jaillit et retombe en pluie), « papier » (l'eau de la cuve
//    du papier qu'on balance), « cloche » (la cloche du sanctuaire qu'on agite), « claque » (un battement de mains) ;
//    Himeji : « assiette » (une assiette de porcelaine posée sur une autre), « plouf » (la nourriture jetée aux carpes).
//  - Takachiho : « boucle/cascade », « boucle/kajika » (les grenouilles de la rivière), « boucle/kagura » ; « rame », « coq »,
//    « caillou », « roc » (la porte de la grotte), « slurp » (les nouilles).
//  - Kinkaku-ji (2026-10-26) : « boucle/semi » (les cigales de l'été) ; « piece » (une pièce qu'on lance), « bol » (elle
//    tombe dans la vasque), « tombe » (elle la manque), « chasen » (le fouet du matcha), « pinceau » et « tampon » (le
//    carnet de sceaux), « waniguchi » (le gong de bronze qu'on frappe avec sa corde).
//  - Motonosumi (2026-10-28) : « oiseau/shiofuki » (le souffle du dragon : la vague qui frappe la grotte, la mer qui jaillit
//    et retombe en pluie) ; « saisen » (une pièce qui tombe dans le tronc de bois, sur les autres pièces).
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
    /**
     * De toutes petites bulles (l'eau qui court : 2026-10-24) : chacune une résonance brève (q oscillations environ, sa
     * durée suit sa hauteur : quelques millisecondes), qui monte un peu (monte : de combien, à la fin) ; beaucoup de
     * douces, peu de fortes ; densite(t) (0 à 1, facultatif) : plus ou moins serrées selon l'instant.
     */
    perles(nombre, { de, a, f: [f0, f1], g: [g0, g1], q: [q0, q1], monte = 0.2, densite = null }) {
      for (let k = 0; k < nombre; k++) {
        const t0 = de + (a - de) * r();
        if (densite && r() > densite(t0)) continue;
        const fb = f0 * (f1 / f0) ** r(), qq = q0 + (q1 - q0) * r(), tau = qq / (Math.PI * fb), amp = g0 + (g1 - g0) * r() ** 3;
        const i0 = Math.round(t0 * sr), m = Math.ceil(tau * 5 * sr), fin = Math.min(n, i0 + m);
        let ph = r() * TAU;
        for (let i = i0; i < fin; i++) {
          const t = (i - i0) / sr;
          ph += (TAU * fb * (1 + (monte * t) / (tau * 5))) / sr;
          b[i] += amp * Math.exp(-t / tau) * Math.sin(ph) * Math.min(1, (t * fb) / 1.2);
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
  // la neige (l'hiver du calendrier magique) : le pied qui tasse, un crissement sec, un petit couinement
  neige(c, r, dt) {
    c.bruit(0.004, { type: 'bas', f: 200, tau: 0.035, gain: 0.5 })
      .grains(90, { zones: [[0.006, 0.09, 1], [dt, dt + 0.08, 0.8]], f: [900, 3500], d: [0.001, 0.0035], g: [0.12, 0.45], q: 2.2 })
      .bruit(0.02, { f: (t) => 1300 + 900 * t / 0.08, q: 6, attaque: 0.01, tau: 0.035, gain: 0.12 });
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
const FORCE_SOL = { herbe: 0.7, sable: 0.65, estran: 0.8, bois: 1, pierre: 0.85, route: 0.8, terre: 0.75, roche: 0.9, sousBois: 0.72, eau: 0.95, neige: 0.75 };
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

/**
 * Un tremblement d'environ f variations par seconde (de 0,2 à 30) : une courbe lisse par des points tirés au sort,
 * de moyenne 0 et d'écart 1 (les filtres ne descendent pas sous 10 Hz).
 */
function tremble(n, sr, r, f) {
  const pas = sr / f, k = Math.ceil(n / pas) + 4, v = Array.from({ length: k }, () => r() * 2 - 1), x = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const u = i / pas, j = Math.floor(u), t = u - j, p0 = v[j], p1 = v[j + 1], p2 = v[j + 2], p3 = v[j + 3];
    x[i] = 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
  }
  let s = 0, s2 = 0;
  for (let i = 0; i < n; i++) { s += x[i]; s2 += x[i] * x[i]; }
  const m = s / n, e = Math.sqrt(Math.max(1e-12, s2 / n - m * m));
  for (let i = 0; i < n; i++) x[i] = (x[i] - m) / e;
  return x;
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
  // la rivière Shō, en bas de sa gorge (refaite le 2026-10-24, comme le ruisseau) : un grondement grave qui roule (l'eau
  // large et rapide), un souffle plus clair qui enfle et retombe, des bulles brèves et quelques glouglous graves ;
  // chaque oreille la sienne
  riviere(sr, r) {
    const L = 16, F = 0.8, T = L + F, n = Math.ceil(T * sr);
    const canaux = [0, 1].map((k) => {
      const moyen = tremble(n, sr, r, 2.5), lent = tremble(n, sr, r, 0.25);
      const fond = brun(n, r), eau = blanc(n, r);
      filtrer(fond, sr, 'bas', 380, 0.6);
      filtrer(eau, sr, 'bande', 700 + k * 90, 0.6);
      filtrer(eau, sr, 'bas', 2200, 0.7);
      normaliser([fond]);
      normaliser([eau]);
      const b = composer(sr, r, T)
        .perles(5000, { de: 0, a: T, f: [380, 2400], g: [0.02, 0.4], q: [5, 11], monte: 0.2 })
        .perles(160, { de: 0, a: T, f: [160, 420], g: [0.2, 0.7], q: [8, 14], monte: 0.4 }).b;
      normaliser([b]);
      const x = new Float32Array(n);
      for (let i = 0; i < n; i++) x[i] = (fond[i] * 0.6 + eau[i] * 0.4 * (0.7 + 0.3 * Math.tanh(moyen[i])) + b[i] * 0.22) * (0.85 + 0.15 * Math.tanh(lent[i]));
      filtrer(x, sr, 'bas', 4000, 0.7);
      return boucler(x, sr, F);
    });
    return normaliser(canaux);
  },
  // le ruisseau du village (refait le 2026-10-24 : le propriétaire le trouvait horrible ; c'étaient 170 bulles par seconde,
  // longues et chantantes, « bloup » : une casserole qui bout) : l'eau qui court sur les cailloux. Un souffle d'eau dans
  // le médium dont la force tremble (l'eau qui se brise), des milliers de toutes petites bulles brèves (quelques
  // millisecondes : un pétillement, pas des notes ; beaucoup de douces, peu de fortes ; plus serrées quand l'eau se
  // brise), de temps en temps un glouglou plus grave, des éclaboussures qui crépitent ; chaque oreille les siennes
  ruisseau(sr, r) {
    const L = 14, F = 0.6, T = L + F, n = Math.ceil(T * sr);
    const canaux = [0, 1].map(() => {
      const vite = tremble(n, sr, r, 14), moyen = tremble(n, sr, r, 3), lent = tremble(n, sr, r, 0.4);
      const grave = blanc(n, r), clair = blanc(n, r);
      filtrer(grave, sr, 'bande', 520, 0.8);
      filtrer(grave, sr, 'bas', 1400, 0.7);
      filtrer(clair, sr, 'bande', 1900, 0.7);
      filtrer(clair, sr, 'haut', 900, 0.7);
      normaliser([grave]);
      normaliser([clair]);
      const serre = (t) => 0.35 + 0.65 * lisse(-1.2, 1.2, vite[Math.min(n - 1, Math.floor(t * sr))]);
      const b = composer(sr, r, T)
        .perles(9000, { de: 0, a: T, f: [650, 3800], g: [0.02, 0.5], q: [6, 14], monte: 0.25, densite: serre })
        .perles(120, { de: 0, a: T, f: [260, 650], g: [0.15, 0.6], q: [8, 14], monte: 0.5 })
        .grains(500, { zones: [[0, T, 1]], f: [1500, 5000], d: [0.002, 0.006], g: [0.03, 0.15], q: 1.6 }).b;
      normaliser([b]);
      const x = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        x[i] = grave[i] * 0.42 * (0.75 + 0.25 * Math.tanh(moyen[i])) * (0.8 + 0.2 * Math.tanh(lent[i]))
          + clair[i] * 0.26 * (0.7 + 0.3 * Math.tanh(vite[i] * 0.8)) + b[i] * 0.5;
      }
      filtrer(x, sr, 'bas', 6500, 0.7);
      filtrer(x, sr, 'haut', 110, 0.7);
      return boucler(x, sr, F);
    });
    return normaliser(canaux);
  },
  // les rainettes des rizières, la nuit : chacune son chant, des « kerokero » rauques en rafales, à gauche, à droite
  grenouilles(sr, r) {
    const L = 10, F = 0.4, T = L + F;
    const g = composer(sr, r, T), d = composer(sr, r, T);
    for (let k = 0; k < 7; k++) {
      const c = k % 2 ? g : d, f0 = 480 + r() * 420, cadence = 6 + r() * 4, force = 0.35 + r() * 0.65;
      for (let t = r() * 2; t < T - 1; t += 1.2 + r() * 2.4) {
        const n = 3 + Math.floor(r() * 6);
        for (let j = 0; j < n; j++) {
          c.cri(t + j / cadence, 0.07, (u) => f0 * (1 + (0.25 * u) / 0.07), (u) => ad(0.006, 0.03, 0.07)(u) * force, { fc: f0 * 2.2, bw: 700, rauque: 0.65 });
        }
      }
    }
    const n = g.b.length, x = new Float32Array(n), y = new Float32Array(n);
    for (let i = 0; i < n; i++) { x[i] = g.b[i] + d.b[i] * 0.35; y[i] = d.b[i] + g.b[i] * 0.35; }
    return normaliser([boucler(echo(x, sr), sr, F), boucler(echo(y, sr), sr, F)]);
  },
  // la kokiriko (Gokayama) : la flûte de fête qui chante la mélodie, la sasara (des lamelles de bois qui claquent en
  // cascade : « jararan »), les deux baguettes de bambou (« kon, kon »), le tambour ; une phrase de seize temps
  kokiriko(sr, r) {
    const temps = 60 / 100, L = 16 * temps, F = 0.5, T = L + F;
    const fl = composer(sr, r, T), pc = composer(sr, r, T);
    // la flûte : une mélodie sur la gamme des chants populaires (la do ré mi sol), une octave plus haut ; [en
    // demi-temps, durée en demi-temps, note]
    const notes = [[0, 2, 76], [2, 1, 74], [3, 1, 72], [4, 2, 69], [6, 2, 72], [8, 2, 74], [10, 1, 76], [11, 1, 74], [12, 4, 72],
      [16, 2, 69], [18, 1, 72], [19, 1, 74], [20, 2, 76], [22, 2, 79], [24, 2, 76], [26, 1, 74], [27, 1, 72], [28, 4, 69]];
    for (const [b, d, m] of notes) {
      const f = 440 * 2 ** ((m + 12 - 69) / 12), t0 = 0.05 + b * temps * 0.5, du = d * temps * 0.5 * 0.95;
      fl.ton(t0, du, (t) => f * (1 + 0.01 * Math.sin(TAU * 6.2 * t) * Math.min(1, t / 0.2)) * (t < 0.04 ? 0.985 + (0.015 * t) / 0.04 : 1), (t) => ad(0.03, 0.12, du)(t) * 0.5, 0.18)
        .bruit(t0, { type: 'bande', f: f * 2, q: 2.5, duree: Math.min(0.12, du), forme: ad(0.01, 0.08, Math.min(0.12, du)), gain: 0.12 });
    }
    // la sasara sur le deuxième et le quatrième temps, les baguettes à contretemps, le tambour sur le premier
    for (let b = 0; b < L / temps - 0.5; b++) {
      const t0 = 0.05 + b * temps;
      if (b % 2 === 1) pc.grains(16, { zones: [[t0, t0 + 0.09, 1]], f: [2000, 5200], d: [0.002, 0.006], g: [0.3, 0.8], q: 3 });
      pc.modes(t0 + temps / 2, [[1750, 0.45, 0.025], [3900, 0.18, 0.01]]);
      if (b % 4 === 0) pc.modes(t0, [[110, 0.9, 0.18], [190, 0.4, 0.1]]).bruit(t0, { type: 'bas', f: 300, tau: 0.03, gain: 0.3 });
    }
    normaliser([fl.b]);
    normaliser([pc.b], 0.85);
    const n = fl.b.length, g = new Float32Array(n), d = new Float32Array(n);
    for (let i = 0; i < n; i++) { g[i] = fl.b[i] * 0.9 + pc.b[i] * 0.6; d[i] = fl.b[i] * 0.6 + pc.b[i] * 0.9; }
    return normaliser([boucler(echo(g, sr), sr, F), boucler(echo(d, sr), sr, F)]);
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
  // la cascade de Manai (Takachiho, 2026-10-25) : dix-sept mètres de chute dans le bassin de la gorge. Un grondement grave
  // qui roule, le corps de l'eau qui s'écrase (un souffle large dans le médium, dont la force tremble), l'embrun qui
  // siffle plus haut, des milliers de gouttes qui éclatent ; chaque oreille la sienne
  cascade(sr, r) {
    const L = 12, F = 0.8, T = L + F, n = Math.ceil(T * sr);
    const canaux = [0, 1].map((k) => {
      const vite = tremble(n, sr, r, 6), lent = tremble(n, sr, r, 0.35);
      const grave = brun(n, r), corps = blanc(n, r), embrun = blanc(n, r);
      filtrer(grave, sr, 'bas', 210 + k * 25, 0.6);
      filtrer(corps, sr, 'bande', 820 + k * 70, 0.45);
      filtrer(corps, sr, 'bas', 2600, 0.7);
      filtrer(embrun, sr, 'bande', 3600 + k * 300, 0.6);
      normaliser([grave]);
      normaliser([corps]);
      normaliser([embrun]);
      const b = composer(sr, r, T)
        .perles(14000, { de: 0, a: T, f: [450, 3200], g: [0.02, 0.35], q: [4, 9], monte: 0.15 })
        .perles(400, { de: 0, a: T, f: [140, 380], g: [0.2, 0.6], q: [6, 12], monte: 0.3 }).b;
      normaliser([b]);
      const x = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        x[i] = (grave[i] * 0.62 + corps[i] * 0.5 * (0.8 + 0.2 * Math.tanh(vite[i])) + embrun[i] * 0.16 * (0.75 + 0.25 * Math.tanh(vite[i] * 0.7)) + b[i] * 0.3)
          * (0.9 + 0.1 * Math.tanh(lent[i]));
      }
      filtrer(x, sr, 'bas', 7000, 0.7);
      return boucler(x, sr, F);
    });
    return normaliser(canaux);
  },
  // les grenouilles kajika (Buergeria buergeri), la nuit, au bord de la rivière : on dirait des oiseaux. Chacune sa phrase
  // de notes sifflées qui montent (« pi, pi, pi… fiririri »), de plus en plus serrées jusqu'à un trille ; l'écho de la gorge
  kajika(sr, r) {
    const L = 12, F = 0.4, T = L + F;
    const g = composer(sr, r, T), d = composer(sr, r, T);
    for (let k = 0; k < 5; k++) {
      const c = k % 2 ? g : d, f0 = 2250 + r() * 650, force = 0.4 + r() * 0.6;
      for (let t = r() * 3; t < T - 2.2; t += 3.4 + r() * 4.2) {
        const notes = 4 + Math.floor(r() * 5);
        let tt = t;
        for (let j = 0; j < notes; j++) {
          const u = j / Math.max(1, notes - 1), duree = 0.05 + 0.05 * (1 - u), f = f0 * (1 + 0.16 * u);
          c.ton(tt, duree, (q) => f * (1 + (0.09 * q) / duree), (q) => ad(0.008, 0.02, duree)(q) * force * (0.6 + 0.4 * u), 0.05);
          tt += duree + 0.11 * (1 - u) + 0.03;
        }
        // le trille de la fin : une note tenue qui palpite
        const du = 0.35 + r() * 0.3, ft = f0 * 1.2;
        c.ton(tt, du, (q) => ft * (1 + 0.04 * Math.sin(TAU * 7 * q)), (q) => ad(0.02, 0.12, du)(q) * force * (0.55 + 0.45 * Math.sin(TAU * 32 * q)) ** 2, 0.05);
      }
    }
    const n = g.b.length, x = new Float32Array(n), y = new Float32Array(n);
    for (let i = 0; i < n; i++) { x[i] = g.b[i] + d.b[i] * 0.3; y[i] = d.b[i] + g.b[i] * 0.3; }
    return normaliser([boucler(echo(echo(x, sr), sr), sr, F), boucler(echo(echo(y, sr), sr), sr, F)]);
  },
  // le kagura de la nuit (Takachiho) : la flûte de bambou (une mélodie lente sur la gamme des chants populaires, des notes
  // qui glissent), le grand tambour (« don », et le bord frappé, « ka »), les grelots de la danseuse (suzu) qui
  // frémissent ; une phrase de seize temps, sans les voix
  kagura(sr, r) {
    const temps = 60 / 92, L = 16 * temps, F = 0.5, T = L + F;
    const fl = composer(sr, r, T), pc = composer(sr, r, T), gr = composer(sr, r, T);
    // la flûte : [début en demi-temps, durée en demi-temps, note] ; mi sol la si ré (la gamme du min'yō)
    const notes = [[0, 3, 76], [3, 1, 79], [4, 4, 81], [8, 2, 79], [10, 2, 76], [12, 4, 74],
      [16, 2, 76], [18, 2, 79], [20, 3, 83], [23, 1, 81], [24, 4, 79], [28, 2, 76], [30, 2, 74]];
    for (const [b, du, m] of notes) {
      const f = 440 * 2 ** ((m - 69) / 12), t0 = 0.05 + b * temps * 0.5, d = du * temps * 0.5 * 0.96, glisse = Math.min(0.12, d * 0.25);
      fl.ton(t0, d, (t) => f * (t < glisse ? 0.96 + (0.04 * t) / glisse : 1) * (1 + 0.012 * Math.sin(TAU * 5.5 * t) * Math.min(1, t / 0.3)), (t) => ad(0.04, 0.15, d)(t) * 0.5, 0.2)
        .bruit(t0, { type: 'bande', f: f * 2, q: 2.2, duree: d, forme: ad(0.03, 0.12, d), gain: 0.13 });
    }
    // le tambour : « don » sur le premier temps, « don-don » sur le troisième, le bord (« ka ») à contretemps
    const don = (t0, g = 1) => pc.modes(t0, [[78, 0.9 * g, 0.3], [140, 0.4 * g, 0.18], [230, 0.15 * g, 0.08]]).bruit(t0, { type: 'bas', f: 260, tau: 0.04, gain: 0.4 * g });
    const ka = (t0, g = 1) => pc.modes(t0, [[880, 0.4 * g, 0.03], [1650, 0.2 * g, 0.015]]).bruit(t0, { type: 'bande', f: 2200, q: 1.2, tau: 0.01, gain: 0.25 * g });
    for (let b = 0; b < 16; b++) {
      const t0 = 0.05 + b * temps;
      if (b % 4 === 0) don(t0, 1);
      if (b % 4 === 2) { don(t0, 0.7); don(t0 + temps / 2, 0.5); }
      if (b % 2 === 1) ka(t0 + temps / 2, 0.7);
    }
    // les grelots : une gerbe de petites cloches aiguës qui frémit, sur le deuxième et le quatrième temps
    for (let b = 1; b < 16; b += 2) {
      const t0 = 0.05 + b * temps;
      for (let k = 0; k < 9; k++) {
        const tk = t0 + r() * 0.12, f = 3800 + r() * 2400;
        gr.modes(tk, [[f, 0.25 + r() * 0.2, 0.09 + r() * 0.08], [f * 1.53, 0.1, 0.05]]);
      }
      gr.bruit(t0, { type: 'haut', f: 6000, duree: 0.2, forme: ad(0.005, 0.15, 0.2), gain: 0.05 });
    }
    normaliser([fl.b]);
    normaliser([pc.b], 0.9);
    normaliser([gr.b], 0.5);
    const n = fl.b.length, g = new Float32Array(n), d = new Float32Array(n);
    for (let i = 0; i < n; i++) { g[i] = fl.b[i] * 0.9 + pc.b[i] * 0.6 + gr.b[i] * 0.7; d[i] = fl.b[i] * 0.6 + pc.b[i] * 0.9 + gr.b[i] * 0.45; }
    return normaliser([boucler(echo(g, sr), sr, F), boucler(echo(d, sr), sr, F)]);
  },
  // les cigales de l'été à Kyoto (Kinkaku-ji, 2026-10-26) : dans les arbres, le grésillement des aburazemi (« jiii… », comme
  // l'huile qui frit), qui enfle et retombe ; et deux minminzemi, l'une à gauche, l'autre à droite, chacune sa phrase
  // (« miin… min min min… miii »), une note qui bourdonne (les cymbales de son ventre, près de cent fois par seconde)
  semi(sr, r) {
    const L = 12, F = 0.6, T = L + F, n = Math.ceil(T * sr);
    const jiii = [0, 1].map((k) => {
      const lent = tremble(n, sr, r, 0.18), vite = tremble(n, sr, r, 40), x = blanc(n, r);
      filtrer(x, sr, 'bande', 4300 + k * 250, 1.6);
      filtrer(x, sr, 'bande', 4600, 0.9);
      normaliser([x]);
      for (let i = 0; i < n; i++) x[i] *= (0.55 + 0.45 * Math.tanh(lent[i] * 0.9)) * (0.6 + 0.4 * Math.tanh(vite[i]));
      return x;
    });
    const bourdonne = (u) => (0.55 + 0.45 * Math.sin(TAU * 95 * u)) ** 2;
    const minmin = [[1.2, 3350], [6.8, 3150]].map(([t0, f0]) => {
      const c = composer(sr, r, T);
      c.ton(t0, 0.9, (u) => f0 * (0.94 + 0.06 * Math.min(1, u / 0.3)), (u) => ad(0.12, 0.2, 0.9)(u) * bourdonne(u), 0.15);
      let t = t0 + 1.0;
      for (let j = 0; j < 7; j++) {
        const d = 0.2 - j * 0.012;
        c.ton(t, d, (u) => f0 * (0.9 + 0.1 * Math.min(1, u / (d * 0.5))), (u) => ad(0.03, d * 0.4, d)(u) * bourdonne(u), 0.15);
        t += d + 0.06;
      }
      c.ton(t, 1.1, (u) => f0 * (1 - 0.08 * u), (u) => ad(0.05, 0.7, 1.1)(u) * bourdonne(u), 0.15);
      return c.b;
    });
    const canaux = [0, 1].map((k) => {
      const x = new Float32Array(n), a = minmin[k], b = minmin[1 - k];
      for (let i = 0; i < n; i++) x[i] = jiii[k][i] * 0.5 + a[i] * 0.3 + b[i] * 0.1;
      filtrer(x, sr, 'bas', 7500, 0.7);
      filtrer(x, sr, 'haut', 1000, 0.7);
      return boucler(x, sr, F);
    });
    return normaliser(canaux);
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
  // (les Trente Bouddhas, 2026-10-29) une goutte qui tombe de la voûte de la grotte de l'ermite dans son bol de pierre :
  // « plic », un son pur qui monte très vite, puis l'écho de la grotte
  goutte(sr, r) {
    const c = composer(sr, r, 1.2);
    c.ton(0.01, 0.07, (t) => 950 + 1500 * Math.min(1, t / 0.03), ad(0.002, 0.05, 0.07), 0.05)
      .ton(0.014, 0.05, (t) => 1900 + 800 * Math.min(1, t / 0.02), ad(0.002, 0.035, 0.05), 0.05);
    return cadrer([echo(echo(c.b, sr), sr)], sr, 0.14);
  },
  // (Beppu, 2026-10-27) le ronflement du démon (鬼の高いびき) : la vapeur qui sort des rochers par saccades, un souffle grave
  // qui ronfle, deux fois
  ronfle(sr, r) {
    const c = composer(sr, r, 2.6);
    for (const t0 of [0.05, 1.25]) {
      c.bruit(t0, { type: 'bas', f: (t) => 160 + 60 * Math.sin(TAU * 26 * t), duree: 0.95, forme: (t) => ad(0.15, 0.4, 0.95)(t) * (0.6 + 0.4 * Math.abs(Math.sin(TAU * 13 * t))), gain: 1, grave: true })
        .bruit(t0 + 0.05, { f: 900, q: 0.5, duree: 0.9, forme: ad(0.2, 0.35, 0.9), gain: 0.35 });
    }
    return cadrer([echo(c.b, sr)], sr, 0.25);
  },
  // le geyser de l'enfer de la tornade : un grondement, puis le jet qui rugit, tape le toit, retombe en pluie (dix secondes)
  geyser(sr, r) {
    const D = 10, c = composer(sr, r, D);
    const tenu = (t) => lisse(0.1, 0.9, t) * (1 - lisse(7.5, 9.8, t));
    c.bruit(0.0, { type: 'bas', f: 260, grave: true, duree: D, forme: tenu, gain: 1 })
      .bruit(0.0, { f: (t) => 700 + 500 * lisse(0, 1, t), q: 0.45, duree: D, forme: (t) => tenu(t) * (0.8 + 0.2 * Math.sin(TAU * 1.3 * t)), gain: 0.8 })
      .bruit(0.0, { type: 'haut', f: 2800, duree: D, forme: (t) => tenu(t) * 0.7, gain: 0.35 })
      .grains(1100, { zones: [[1.0, 9.4, 1]], f: [1000, 6500], d: [0.0008, 0.003], g: [0.05, 0.22], q: 1.3 });
    return cadrer([c.b, c.b.slice()], sr, 0.24);
  },
  // le souffle du palais du dragon (Motonosumi) : la vague frappe le fond de la grotte (un coup sourd), la mer jaillit en
  // rugissant (un souffle qui monte), l'écume siffle, puis la pluie des embruns retombe sur les rochers (quatre secondes et demie)
  shiofuki(sr, r) {
    const D = 4.6, c = composer(sr, r, D);
    c.bruit(0.0, { type: 'bas', f: 140, grave: true, duree: 0.7, forme: ad(0.01, 0.5, 0.7), gain: 1.1 })
      .bruit(0.08, { f: (t) => 500 + 1000 * lisse(0, 0.7, t), q: 0.5, duree: 2.4, forme: ad(0.06, 1.6, 2.4), gain: 0.85 })
      .bruit(0.12, { type: 'haut', f: 2600, duree: 3.2, forme: ad(0.12, 2.2, 3.2), gain: 0.42 })
      .grains(900, { zones: [[0.9, 4.3, 1]], f: [900, 6000], d: [0.0008, 0.003], g: [0.04, 0.18], q: 1.2 });
    return cadrer([c.b, c.b.slice()], sr, 0.24);
  },
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
  // la grive des îles d'Izu (akakokko) : deux phrases flûtées qui roulent, « kyoron, kyoron », puis un « tsîî » fin et aigu
  akakokko(sr, r) {
    const c = composer(sr, r, 2.1);
    for (const [t0, h] of [[0.05, 1], [0.5, 1.05]]) {
      c.ton(t0, 0.13, (t) => h * (1900 + 2600 * t), ad(0.01, 0.04, 0.13))
        .ton(t0 + 0.15, 0.2, (t) => h * (2400 - 900 * t + 120 * Math.sin(TAU * 38 * t)), ad(0.015, 0.08, 0.2));
    }
    c.ton(1.05, 0.45, (t) => 6400 - 500 * t, (t) => ad(0.05, 0.25, 0.45)(t) * 0.45, 0.04);
    return cadrer([echo(c.b, sr)], sr, 0.25);
  },
  // le corbeau à gros bec (hashibuto-garasu) : deux « kaa » rauques, nasillards, qui retombent
  corbeau(sr, r) {
    const c = composer(sr, r, 1.3);
    const kaa = (t0, d, h) => c.cri(t0, d, (t) => h * (560 + 160 * Math.min(1, t / 0.06) - 220 * Math.max(0, t - 0.06) / d), ad(0.02, 0.12, d), { fc: 1250, bw: 700, rauque: 0.55 });
    kaa(0.02, 0.36, 1);
    kaa(0.52, 0.32, 0.96);
    return cadrer([echo(c.b, sr)], sr, 0.25);
  },
  // le héron cendré (aosagi), qui s'envole d'une rizière : un « gwaa » grave et rauque, puis un plus court
  aosagi(sr, r) {
    const c = composer(sr, r, 1.0);
    c.cri(0.02, 0.36, (t) => 360 - 120 * t, ad(0.02, 0.12, 0.36), { fc: 900, bw: 600, rauque: 0.7 })
      .cri(0.48, 0.2, (t) => 330 - 80 * t, ad(0.02, 0.08, 0.2), { fc: 850, bw: 550, rauque: 0.7 });
    return cadrer([echo(c.b, sr)], sr, 0.25);
  },
  // (Yakushima, 2026-10-31) le singe de Yakushima (ヤクシマザル) : le « kuu » doux qui monte puis retombe, le cri qui garde la
  // troupe ensemble ; un second, plus court
  singe(sr, r) {
    const c = composer(sr, r, 1.1);
    c.ton(0.03, 0.34, (t) => 640 + 520 * Math.sin(Math.PI * Math.min(1, t / 0.34) * 0.85), ad(0.03, 0.12, 0.34))
      .ton(0.52, 0.24, (t) => 700 + 420 * Math.sin(Math.PI * Math.min(1, t / 0.24) * 0.85), ad(0.03, 0.09, 0.24));
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

// ---------------------------------------------------------------- Les compagnons
/** Le ventre du tanuki : une peau tendue, grave et ronde (frappée à t0, de force g). */
function ventre(c, t0, g = 1) {
  return c.modes(t0, [[96, 1 * g, 0.13], [158, 0.45 * g, 0.08], [236, 0.2 * g, 0.05]])
    .bruit(t0, { type: 'bas', f: 420, tau: 0.02, gain: 0.35 * g });
}
const CRIS = {
  kon(sr, r) {
    const c = composer(sr, r, 0.6);
    const jappe = (t0, d, h) => c.cri(t0, d, (t) => { const u = t / d; return h * (u < 0.3 ? 880 + 1300 * u : 1270 - 650 * (u - 0.3)); }, ad(0.01, 0.06, d), { fc: 1700, bw: 1100, rauque: 0.15 });
    jappe(0.02, 0.13, 1);
    jappe(0.24, 0.15, 1.05);
    return cadrer([echo(c.b, sr)], sr, 0.25);
  },
  pon(sr, r) {
    const c = composer(sr, r, 1.1);
    ventre(c, 0.01, 1); ventre(c, 0.24, 0.55); ventre(c, 0.34, 0.6); ventre(c, 0.58, 1);
    return cadrer([c.b], sr, 0.25);
  },
  // le shisa : un petit rugissement rond, « gao ! », un grondement qui monte puis tombe
  gao(sr, r) {
    const c = composer(sr, r, 0.7);
    c.cri(0.02, 0.42, (t) => 190 + 260 * Math.sin(Math.min(1, t / 0.42) * Math.PI), ad(0.03, 0.16, 0.42), { fc: 900, bw: 650, rauque: 0.45 })
      .bruit(0.02, { type: 'bas', f: 260, grave: true, duree: 0.42, forme: ad(0.03, 0.18, 0.42), gain: 0.5 });
    return cadrer([echo(c.b, sr)], sr, 0.25);
  },
  // le bébé dragon : un trille de petites cloches qui monte (« piroriin »), et un souffle d'air
  fuwa(sr, r) {
    const c = composer(sr, r, 1.0);
    [0, 4, 7, 12, 16].forEach((d, k) => {
      const f = 1046.5 * 2 ** (d / 12);
      c.modes(0.03 + k * 0.07, [[f, 0.5, 0.18], [f * 2.76, 0.18, 0.06], [f * 5.4, 0.07, 0.03]]);
    });
    c.bruit(0.0, { f: (t) => 900 + 1800 * t, q: 0.8, duree: 0.5, forme: ad(0.15, 0.3, 0.5), gain: 0.25 });
    return cadrer([echo(c.b, sr)], sr, 0.25);
  },
  // l'esprit de l'arbre : des morceaux de bois creux qu'on frappe (« kon, koro, kon »), et des feuilles qui bruissent
  saya(sr, r) {
    const c = composer(sr, r, 0.9);
    for (const [t0, f] of [[0.02, 620], [0.17, 760], [0.26, 690], [0.42, 560]]) c.modes(t0, [[f, 0.8, 0.05], [f * 2.4, 0.3, 0.025], [f * 3.9, 0.12, 0.012]]);
    c.grains(70, { zones: [[0.45, 0.85, 1]], f: [2500, 8000], d: [0.0006, 0.002], g: [0.04, 0.16], q: 1.2 });
    return cadrer([echo(c.b, sr)], sr, 0.25);
  },
  chapu(sr, r) {
    const c = composer(sr, r, 0.75);
    for (const [t0, h] of [[0.01, 1], [0.11, 1.08], [0.21, 1.16]]) c.cri(t0, 0.075, (t) => h * (2100 + 11000 * t), ad(0.006, 0.03, 0.075), { fc: 3200, bw: 1500, rauque: 0.1 });
    c.bulles(7, { de: 0.33, a: 0.55, f: [450, 1300], g: [0.12, 0.3] })
      .bruit(0.32, { f: 1800, q: 0.8, tau: 0.05, gain: 0.25 });
    return cadrer([echo(c.b, sr)], sr, 0.25);
  },
};
// ---------------------------------------------------------------- Les chats (et le chien de Gokayama)
const BETES = {
  // le shiba du minshuku : un « wan ! » bref, qui monte et retombe
  ouaf(sr, r) {
    const c = composer(sr, r, 0.45);
    c.cri(0.01, 0.17, (t) => { const u = t / 0.17; return u < 0.35 ? 480 + 380 * (u / 0.35) : 860 - 320 * ((u - 0.35) / 0.65); }, ad(0.008, 0.06, 0.17), { fc: 1250, bw: 850, rauque: 0.3 })
      .bruit(0.01, { type: 'bas', f: 500, tau: 0.03, gain: 0.25 });
    return cadrer([echo(c.b, sr)], sr, 0.25);
  },
  // « miaou » : une note qui monte puis retombe, par un formant (la bouche qui s'ouvre et se referme)
  miaou(sr, r) {
    const c = composer(sr, r, 0.8);
    c.cri(0.02, 0.62, (t) => { const u = t / 0.62; return u < 0.4 ? 560 + 300 * (u / 0.4) : 860 - 360 * ((u - 0.4) / 0.6); }, ad(0.04, 0.2, 0.62), { fc: 1500, bw: 900, rauque: 0.12 });
    return cadrer([echo(c.b, sr)], sr, 0.25);
  },
  // le ronron : un grondement grave qui bat environ 26 fois par seconde, en inspirant puis (plus fort) en expirant
  ronron(sr, r) {
    const c = composer(sr, r, 2.4);
    for (const [t0, d, g] of [[0, 1.0, 0.7], [1.15, 1.15, 1]]) {
      c.bruit(t0, { type: 'bas', f: 260, grave: true, duree: d, gain: g, forme: (t) => ad(0.12, 0.25, d)(t) * (0.55 + 0.45 * Math.sin(TAU * 26 * t)) ** 2 });
    }
    return cadrer([c.b], sr, 0.25);
  },
};

/** Un compagnon s'en va dans un petit nuage (« pouf ») : un souffle étouffé, une petite note qui tombe. */
function pouf(sr) {
  const r = alea(graine('pouf')), c = composer(sr, r, 0.5);
  c.bruit(0, { type: 'bas', f: (t) => 1600 - 2600 * t, tau: 0.07, gain: 1 })
    .bruit(0, { f: 3200, q: 0.9, tau: 0.025, gain: 0.3 })
    .ton(0.0, 0.12, (t) => 620 - 2400 * t, ad(0.005, 0.06, 0.12), 0.3);
  return cadrer([c.b], sr, 0.22);
}

/** On creuse à la main : la terre qu'on gratte et qu'on rejette (deux poignées), un caillou qui roule. */
function pelle(sr) {
  const r = alea(graine('pelle')), c = composer(sr, r, 0.9);
  for (const t0 of [0.02, 0.42]) {
    c.bruit(t0, { f: (t) => 1200 - 500 * t, q: 0.9, attaque: 0.03, tau: 0.09, gain: 0.7 })
      .grains(60, { zones: [[t0, t0 + 0.25, 1]], f: [700, 3500], d: [0.001, 0.004], g: [0.1, 0.4], q: 1.4 })
      .bruit(t0 + 0.2, { type: 'bas', f: 220, tau: 0.04, gain: 0.5 });
  }
  c.modes(0.7, [[1500, 0.3, 0.01], [2600, 0.15, 0.006]]);
  return cadrer([c.b], sr, 0.25);
}
/** La vieille boîte en fer (une boîte à gâteaux) : on la sort de la terre (toc), le couvercle grince et s'ouvre (clac). */
function boite(sr) {
  const r = alea(graine('boite')), c = composer(sr, r, 1.6);
  c.modes(0.02, [[420, 0.6, 0.08], [1130, 0.35, 0.05], [2310, 0.2, 0.03]])
    .craquer(0.45, { duree: 0.5, f0: 90, f1: 170, gain: 0.35 })
    .modes(1.0, [[610, 0.7, 0.12], [1580, 0.4, 0.07], [3020, 0.22, 0.04], [4400, 0.1, 0.02]])
    .bruit(1.0, { type: 'haut', f: 2500, attaque: 0.0005, tau: 0.01, gain: 0.3 });
  return cadrer([echo(c.b, sr)], sr, 0.25);
}
// ---------------------------------------------------------------- Gokayama
/** La planche qui sonne creux : un « toc » de bois, et la fosse dessous qui résonne, grave. */
function creux(sr) {
  const r = alea(graine('creux')), c = composer(sr, r, 0.7);
  c.modes(0.01, [[165, 0.9, 0.11], [340, 0.5, 0.07], [720, 0.28, 0.035], [1500, 0.12, 0.015]])
    .bruit(0.01, { f: 1800, q: 1.2, attaque: 0.0005, tau: 0.008, gain: 0.5 })
    .bruit(0.015, { type: 'bas', f: 140, grave: true, attaque: 0.01, tau: 0.12, gain: 0.6 });
  return cadrer([echo(c.b, sr)], sr, 0.25);
}
/**
 * Les canons à eau (environ 9 s) : les vannes qu'on ouvre (un choc de métal), le grondement de l'eau qui monte, son
 * souffle tenu, la pluie qui retombe sur les toits de chaume, puis tout s'arrête.
 */
function jets(sr) {
  const r = alea(graine('jets')), D = 9.5, c = composer(sr, r, D);
  const tenu = (t) => lisse(0.3, 1.6, t) * (1 - lisse(7.6, 9.2, t));
  c.modes(0.05, [[320, 0.5, 0.1], [870, 0.3, 0.05], [1900, 0.15, 0.02]])
    .bruit(0.2, { type: 'bas', f: 420, grave: true, duree: D - 0.3, forme: tenu, gain: 0.9 })
    .bruit(0.2, { f: (t) => 900 + 600 * lisse(0, 1.5, t), q: 0.5, duree: D - 0.3, forme: (t) => tenu(t) * 0.9, gain: 0.7 })
    .bruit(0.2, { type: 'haut', f: 3000, duree: D - 0.3, forme: (t) => tenu(t) * (0.6 + 0.4 * Math.sin(TAU * 0.7 * t)), gain: 0.25 })
    .grains(900, { zones: [[1.8, 8.6, 1]], f: [1200, 6000], d: [0.0008, 0.003], g: [0.05, 0.25], q: 1.3 });
  return cadrer([c.b, c.b.slice()], sr, 0.22);
}
/** L'eau de la cuve du papier, qu'on balance dans le cadre : deux vagues qui clapotent, des gouttes. */
function papier(sr) {
  const r = alea(graine('papier')), c = composer(sr, r, 1.4);
  c.bruit(0.02, { type: 'bas', f: 900, duree: 1.2, forme: (t) => ad(0.05, 0.3, 1.2)(t) * Math.abs(Math.sin(TAU * 0.85 * t)), gain: 0.8 })
    .bulles(30, { de: 0.1, a: 1.2, f: [500, 1800], g: [0.08, 0.3] });
  return cadrer([c.b], sr, 0.22);
}
/** La cloche du sanctuaire (suzu) qu'on agite avec sa corde : un grelot de cuivre, plusieurs coups. */
function cloche(sr) {
  const r = alea(graine('cloche')), c = composer(sr, r, 1.6);
  for (let k = 0; k < 7; k++) {
    const t0 = 0.03 + k * 0.11 + r() * 0.03, f = 1650 * (1 + (r() - 0.5) * 0.05);
    c.modes(t0, [[f, 0.6 * (1 - k * 0.08), 0.25], [f * 2.71, 0.25, 0.1], [f * 4.9, 0.12, 0.05]])
      .bruit(t0, { type: 'haut', f: 3000, attaque: 0.0005, tau: 0.006, gain: 0.25 });
  }
  return cadrer([echo(c.b, sr)], sr, 0.22);
}
/**
 * La grande cloche de bronze d'un temple (梵鐘), frappée par son tronc de bois (2026-10-29, les Trente Bouddhas) : le choc
 * sourd du bois, puis le bourdon grave qui ondule (deux notes très proches qui battent : « gōōn… wōōn… »), ses partiels
 * aigus qui s'éteignent les premiers ; près de neuf secondes.
 */
function kane(sr) {
  const r = alea(graine('kane')), c = composer(sr, r, 9), f = 98;
  c.bruit(0.005, { type: 'bas', f: 260, attaque: 0.002, tau: 0.05, gain: 0.9 })
    .bruit(0.005, { f: 900, q: 0.6, attaque: 0.001, tau: 0.02, gain: 0.25 })
    .modes(0.01, [[f, 0.7, 5.5], [f * 1.012, 0.55, 5.0], [f * 2.0, 0.45, 3.6], [f * 2.41, 0.4, 3.0], [f * 2.98, 0.3, 2.2], [f * 4.07, 0.22, 1.6], [f * 5.36, 0.15, 1.1], [f * 6.8, 0.09, 0.7], [f * 8.4, 0.05, 0.45]]);
  return cadrer([echo(c.b, sr)], sr, 0.3);
}
/** Un battement de mains (au sanctuaire). */
function claque(sr) {
  const r = alea(graine('claque')), c = composer(sr, r, 0.35);
  c.bruit(0.005, { f: 1500, q: 0.8, attaque: 0.0008, tau: 0.018, gain: 1 }).bruit(0.005, { type: 'bas', f: 300, tau: 0.02, gain: 0.4 });
  return cadrer([echo(c.b, sr)], sr, 0.25);
}

// ---------------------------------------------------------------- Himeji
/**
 * Une assiette de porcelaine qu'on pose sur une autre (les assiettes d'Okiku, qu'elle compte) : un « tinc » clair, la
 * porcelaine qui sonne un peu, et un second contact plus doux, juste après (l'assiette qui se pose à plat).
 */
function assiette(sr) {
  const r = alea(graine('assiette')), c = composer(sr, r, 1.1);
  const sonne = [[2350, 0.7, 0.2], [3980, 0.45, 0.14], [6120, 0.28, 0.09], [8800, 0.14, 0.05]];
  c.modes(0.01, sonne).bruit(0.01, { type: 'haut', f: 4000, attaque: 0.0004, tau: 0.004, gain: 0.35 })
    .modes(0.052, sonne.map(([f, a, tau]) => [f * 1.006, a * 0.35, tau * 0.8]))
    .bruit(0.052, { type: 'haut', f: 4500, attaque: 0.0004, tau: 0.003, gain: 0.12 });
  return cadrer([echo(c.b, sr)], sr, 0.22);
}
/** Une poignée de nourriture jetée aux carpes : une pluie de petits « plic » sur l'eau, et la première bouche qui happe. */
function plouf(sr) {
  const r = alea(graine('plouf')), c = composer(sr, r, 1.2);
  c.bruit(0.02, { type: 'bas', f: 1600, attaque: 0.003, tau: 0.05, gain: 0.35 })
    .bulles(16, { de: 0.03, a: 0.42, f: [700, 1700], g: [0.06, 0.22] })
    .bulles(3, { de: 0.6, a: 0.95, f: [380, 520], g: [0.25, 0.4] })
    .bruit(0.62, { type: 'bas', f: 900, attaque: 0.004, tau: 0.06, gain: 0.3 });
  return cadrer([c.b], sr, 0.22);
}

// ---------------------------------------------------------------- Beppu (2026-10-27)
/** La grosse bulle de boue grise qui crève : un « blop » grave et mou, qui descend, quelques éclaboussures de boue. */
function bulle(sr) {
  const r = alea(graine('bulle')), c = composer(sr, r, 1.0);
  c.ton(0.02, 0.22, (t) => 190 - 300 * t, ad(0.01, 0.05, 0.22))
    .bruit(0.03, { type: 'bas', f: 420, attaque: 0.004, tau: 0.06, gain: 0.7, grave: true })
    .bulles(5, { de: 0.12, a: 0.5, f: [150, 320], g: [0.2, 0.4] })
    .grains(18, { zones: [[0.05, 0.4, 1]], f: [400, 1600], d: [0.002, 0.006], g: [0.05, 0.16], q: 1.2 });
  return cadrer([c.b], sr, 0.22);
}
/** Le couvercle du four à vapeur qu'on soulève : un souffle de vapeur, « pschhh », qui s'éteint. */
function pschitt(sr) {
  const r = alea(graine('pschitt')), c = composer(sr, r, 1.6);
  c.bruit(0.01, { type: 'haut', f: 2600, duree: 1.5, forme: ad(0.03, 0.5, 1.5), gain: 0.8 })
    .bruit(0.01, { f: 1300, q: 0.6, duree: 1.5, forme: ad(0.05, 0.4, 1.5), gain: 0.35 })
    .modes(0.0, [[620, 0.3, 0.05], [1450, 0.15, 0.02]], 0.6);
  return cadrer([c.b], sr, 0.22);
}

// ---------------------------------------------------------------- Takachiho
/** Un coup de rame : la pelle qui entre dans l'eau et la tire (un souffle d'eau qui descend), des bulles, le tolet qui cogne. */
function rame(sr) {
  const r = alea(graine('rame')), c = composer(sr, r, 0.9);
  c.bruit(0.01, { f: (t) => 900 - 500 * Math.min(1, t / 0.35), q: 0.8, attaque: 0.02, tau: 0.12, gain: 0.8 })
    .bruit(0.0, { type: 'bas', f: 350, attaque: 0.004, tau: 0.05, gain: 0.5 })
    .bulles(9, { de: 0.06, a: 0.5, f: [380, 1100], g: [0.08, 0.25] })
    .modes(0.03, [[420, 0.18, 0.04], [960, 0.08, 0.02]]);
  return cadrer([c.b], sr, 0.22);
}
/** Le coq : « ko-ke-kok-kōōō », trois syllabes brèves et une longue qui monte et retombe ; l'écho de la vallée. */
function coq(sr) {
  const r = alea(graine('coq')), c = composer(sr, r, 1.9);
  const voix = { fc: 1900, bw: 1300, rauque: 0.38 };
  c.cri(0.02, 0.12, (t) => 560 + 300 * t, ad(0.01, 0.04, 0.12), voix)
    .cri(0.18, 0.1, (t) => 700 + 200 * t, ad(0.01, 0.04, 0.1), voix)
    .cri(0.33, 0.14, (t) => 760 - 100 * t, ad(0.01, 0.05, 0.14), voix)
    .cri(0.53, 0.78, (t) => (t < 0.18 ? 740 + 500 * t : 830 - 140 * Math.max(0, t - 0.4)) * (1 + 0.018 * Math.sin(TAU * 7 * t)), (t) => ad(0.03, 0.3, 0.78)(t) * 1.1, voix);
  return cadrer([echo(echo(c.b, sr), sr)], sr, 0.22);
}
/** Une pierre qu'on pose sur une autre (la grotte des dieux) : un « toc » sec qui sonne un peu, un second contact plus doux. */
function caillou(sr) {
  const r = alea(graine('caillou')), c = composer(sr, r, 0.4);
  const sonne = [[2150, 0.6, 0.016], [3720, 0.35, 0.01], [5300, 0.18, 0.006]];
  c.modes(0.01, sonne).bruit(0.01, { type: 'haut', f: 2500, attaque: 0.0004, tau: 0.005, gain: 0.4 })
    .bruit(0.01, { type: 'bas', f: 320, attaque: 0.001, tau: 0.015, gain: 0.35 })
    .modes(0.07, sonne.map(([f, a, tau]) => [f * 1.04, a * 0.3, tau]));
  return cadrer([echo(c.b, sr)], sr, 0.22);
}
/** La porte de pierre de la grotte qui s'écarte : un grondement qui roule, la pierre qui racle et crisse, un choc sourd. */
function roc(sr) {
  const r = alea(graine('roc')), D = 3.2, c = composer(sr, r, D);
  const tenu = (t) => lisse(0, 0.4, t) * (1 - lisse(2.0, 2.4, t));
  c.bruit(0.0, { type: 'bas', f: 140, grave: true, duree: 2.5, forme: (t) => tenu(t) * (0.75 + 0.25 * Math.sin(TAU * 3.1 * t)), gain: 1.2 })
    .craquer(0.15, { duree: 2.1, f0: 30, f1: 55, gain: 0.5 })
    .grains(380, { zones: [[0.1, 2.3, 1]], f: [500, 3500], d: [0.002, 0.008], g: [0.05, 0.3], q: 1.2 })
    .bruit(2.35, { type: 'bas', f: 120, grave: true, attaque: 0.005, tau: 0.25, gain: 1.5 })
    .bruit(2.35, { f: 600, q: 0.7, attaque: 0.002, tau: 0.05, gain: 0.5 });
  return cadrer([echo(echo(c.b, sr), sr)], sr, 0.25);
}
/** Des nouilles aspirées (« zuzuzu » : au Japon, on les aspire bruyamment, c'est poli) : un souffle qui monte, saccadé. */
function slurp(sr) {
  const r = alea(graine('slurp')), D = 0.7, c = composer(sr, r, D);
  c.bruit(0.0, { f: (t) => 900 + 3200 * Math.min(1, t / 0.5), q: 2, duree: 0.55, forme: (t) => ad(0.04, 0.12, 0.55)(t) * (0.45 + 0.55 * Math.abs(Math.sin(TAU * 9 * t))), gain: 0.8 })
    .bulles(5, { de: 0.05, a: 0.45, f: [600, 1400], g: [0.05, 0.15] });
  return cadrer([c.b], sr, 0.22);
}

// ---------------------------------------------------------------- Kinkaku-ji
/** Les dernières `duree` secondes de x s'éteignent en douceur (un son qui chante plus longtemps que sa place). */
function eteindre(x, sr, duree) {
  const m = Math.round(duree * sr);
  for (let i = 0; i < m; i++) x[x.length - 1 - i] *= (i / m) ** 2;
  return x;
}
/** La pièce tombe dans le tronc des offrandes (Motonosumi) : un « toc » de bois creux, puis elle tinte sur les autres pièces. */
function saisen(sr) {
  const r = alea(graine('saisen')), c = composer(sr, r, 0.9);
  c.modes(0.0, [[380, 0.6, 0.09], [760, 0.3, 0.05], [1250, 0.15, 0.03]])
    .bruit(0.0, { type: 'bas', f: 1800, attaque: 0.001, tau: 0.02, gain: 0.4 });
  for (const [t0, g] of [[0.06, 0.6], [0.14, 0.35], [0.2, 0.2]]) c.modes(t0, [[4300 + r() * 500, 0.4 * g, 0.07], [7100 + r() * 600, 0.25 * g, 0.05]]);
  return cadrer([echo(c.b, sr)], sr, 0.2);
}
/** Une pièce de 5 yens qu'on lance : le souffle du geste, le pouce qui la fait sauter (un « tic » de laiton qui tinte). */
function piece(sr) {
  const r = alea(graine('piece')), c = composer(sr, r, 0.6);
  c.bruit(0.0, { f: (t) => 700 + 2200 * Math.min(1, t / 0.18), q: 0.9, attaque: 0.05, tau: 0.06, gain: 0.35 })
    .modes(0.06, [[5230, 0.5, 0.09], [8410, 0.3, 0.06], [11900, 0.15, 0.035]])
    .bruit(0.06, { type: 'haut', f: 5000, attaque: 0.0003, tau: 0.002, gain: 0.25 });
  return cadrer([c.b], sr, 0.2);
}
/**
 * La pièce tombe dans la vasque de pierre, sur les autres pièces : un « tching » de métal (et les pièces qu'elle cogne),
 * deux rebonds, puis elle tournoie et se couche (des petits chocs de plus en plus serrés).
 */
function bol(sr) {
  const r = alea(graine('bol')), c = composer(sr, r, 1.0);
  const tinte = (t0, g) => c.modes(t0, [[3150 + r() * 400, 0.5 * g, 0.12], [5480 + r() * 500, 0.35 * g, 0.08], [8300 + r() * 700, 0.2 * g, 0.05], [11200, 0.1 * g, 0.03]])
    .bruit(t0, { type: 'haut', f: 4000, attaque: 0.0003, tau: 0.003, gain: 0.3 * g });
  tinte(0.01, 1);
  for (let k = 0; k < 4; k++) tinte(0.014 + r() * 0.035, 0.25 + r() * 0.2);
  tinte(0.16, 0.45);
  tinte(0.26, 0.25);
  for (let t = 0.34, d = 0.07; d > 0.008; t += d, d *= 0.8) c.modes(t, [[6200 + r() * 300, 0.14 * (d / 0.07) ** 0.4, 0.015], [9400, 0.06, 0.01]]);
  c.bruit(0.01, { type: 'bas', f: 600, tau: 0.01, gain: 0.15 });
  return cadrer([echo(c.b, sr)], sr, 0.22);
}
/** La pièce manque la vasque : un « tic » sur la pierre, deux petits rebonds, et elle roule dans le gravier. */
function tombe(sr) {
  const r = alea(graine('tombe')), c = composer(sr, r, 0.8);
  const tic = (t0, g) => c.modes(t0, [[4100 + r() * 300, 0.45 * g, 0.035], [7300 + r() * 500, 0.25 * g, 0.02], [10800, 0.1 * g, 0.012]])
    .bruit(t0, { type: 'haut', f: 2500, attaque: 0.0003, tau: 0.004, gain: 0.4 * g })
    .bruit(t0, { type: 'bas', f: 400, attaque: 0.001, tau: 0.008, gain: 0.2 * g });
  tic(0.01, 1);
  tic(0.13, 0.45);
  tic(0.21, 0.22);
  c.grains(40, { zones: [[0.26, 0.6, 1]], f: [1500, 5000], d: [0.0008, 0.003], g: [0.04, 0.14], q: 1.6 });
  return cadrer([echo(c.b, sr)], sr, 0.2);
}
/**
 * Le fouet de bambou (chasen) qui bat le matcha dans son bol : des allers-retours rapides (onze par seconde) qui font
 * mousser, plus lents et plus légers à la fin, puis le fouet qu'on pose contre le bol.
 */
function chasen(sr) {
  const r = alea(graine('chasen')), c = composer(sr, r, 3.3);
  const n = Math.ceil(2.95 * sr), x = blanc(n, r), h = blanc(n, r);
  filtrer(x, sr, 'bande', 2300, 0.8);
  filtrer(h, sr, 'haut', 5000, 0.7);
  normaliser([x]);
  normaliser([h]);
  let ph = r() * TAU;
  for (let i = 0; i < n; i++) {
    const t = i / sr, fin = lisse(2.2, 2.6, t);
    ph += (Math.PI * (11 - 5 * fin)) / sr;
    x[i] = (x[i] * 0.8 + h[i] * 0.25) * (0.25 + 0.75 * Math.abs(Math.sin(ph)) ** 1.5) * lisse(0, 0.15, t) * (1 - 0.5 * fin) * (1 - lisse(2.75, 2.95, t));
  }
  c.mettre(x, 0.02)
    .perles(900, { de: 0.1, a: 2.9, f: [1800, 6000], g: [0.02, 0.3], q: [4, 9], monte: 0.2 })
    .modes(3.05, [[880, 0.4, 0.05], [2150, 0.2, 0.025], [3900, 0.1, 0.012]]);
  return cadrer([c.b], sr, 0.2);
}
/**
 * Le pinceau sur le papier du carnet de sceaux : des traits doux qui frottent (chacun monte, file et se lève), et au
 * milieu, le pinceau qu'on retrempe dans l'encre (il touche la pierre).
 */
function pinceau(sr) {
  const r = alea(graine('pinceau')), c = composer(sr, r, 4.3);
  let t = 0.1;
  for (let k = 0; k < 11 && t < 3.9; k++) {
    const d = 0.12 + r() * 0.35, f0 = 2400 + r() * 1800, att = 0.015 + r() * 0.03;
    c.bruit(t, { f: (u) => f0 * (1 + (0.25 * u) / d), q: 0.9, duree: d, forme: (u) => ad(att, d * 0.4, d)(u) * (0.85 + 0.15 * Math.sin(TAU * 13 * u)), gain: 0.35 + r() * 0.35 })
      .grains(Math.round(d * 120), { zones: [[t, t + d, 1]], f: [3000, 8000], d: [0.0005, 0.0015], g: [0.03, 0.1], q: 1.4 });
    t += d + 0.08 + r() * 0.25;
    if (k === 5) {
      c.modes(t + 0.05, [[1450, 0.12, 0.02], [3100, 0.05, 0.01]]);
      t += 0.35;
    }
  }
  return cadrer([c.b], sr, 0.18);
}
/** Les deux sceaux rouges qu'on presse sur la page : un « ton » sourd sur la table de bois, le papier, le sceau qu'on décolle. */
function tampon(sr) {
  const r = alea(graine('tampon')), c = composer(sr, r, 0.85);
  for (const [t0, g] of [[0.01, 1], [0.45, 0.85]]) {
    c.modes(t0, [[175 + r() * 20, 0.8 * g, 0.035], [470 + r() * 40, 0.4 * g, 0.018], [1150, 0.15 * g, 0.008]])
      .bruit(t0, { type: 'bas', f: 380, attaque: 0.001, tau: 0.012, gain: 0.5 * g })
      .bruit(t0, { f: 2600, q: 0.8, attaque: 0.0008, tau: 0.008, gain: 0.25 * g })
      .bruit(t0 + 0.2, { f: (u) => 1200 + (2500 * u) / 0.05, q: 1.2, attaque: 0.01, tau: 0.015, gain: 0.12 * g });
  }
  return cadrer([c.b], sr, 0.22);
}
/**
 * Le gong de bronze plat (waniguchi, « la gueule de crocodile ») de la salle de Fudō, qu'on frappe en balançant sa grosse
 * corde : la corde qui part, puis « garan, garan », quatre coups de plus en plus faibles ; le bronze chante longtemps et bat
 * un peu (deux notes presque pareilles).
 */
function waniguchi(sr) {
  const r = alea(graine('waniguchi')), c = composer(sr, r, 4.4);
  const bronze = [[468, 0.9, 1.1], [473, 0.5, 1.0], [1076, 0.6, 0.7], [1790, 0.45, 0.45], [2650, 0.3, 0.28], [3720, 0.18, 0.16], [5100, 0.1, 0.08]];
  c.bruit(0.0, { f: 700, q: 0.6, duree: 0.25, forme: ad(0.06, 0.12, 0.25), gain: 0.12 });
  for (const [t0, g] of [[0.12, 1], [0.5, 0.75], [0.86, 0.5], [1.18, 0.25]]) {
    c.modes(t0, bronze.map(([f, a, tau]) => [f * (1 + (r() - 0.5) * 0.004), a * g, tau]))
      .bruit(t0, { f: 2400, q: 0.8, attaque: 0.0005, tau: 0.01, gain: 0.35 * g })
      .bruit(t0, { type: 'bas', f: 300, attaque: 0.001, tau: 0.02, gain: 0.2 * g });
  }
  return cadrer([eteindre(echo(c.b, sr), sr, 0.6)], sr, 0.22);
}

/** Les feux d'artifice : la fusée qui siffle en montant ; l'éclat grave et son écho sur les montagnes ; les mille éclats. */
const FEUX = {
  depart(sr, r) {
    const c = composer(sr, r, 1.4);
    c.bruit(0.0, { f: (t) => 700 + 2600 * t, q: 4, duree: 1.3, forme: (t) => ad(0.08, 0.4, 1.3)(t) * 0.8, gain: 0.6 })
      .ton(0.0, 1.3, (t) => 900 + 1900 * t, (t) => ad(0.1, 0.5, 1.3)(t) * 0.25, 0.05)
      .bruit(0.0, { type: 'bas', f: 300, tau: 0.04, gain: 0.4 });
    return cadrer([c.b], sr, 0.25);
  },
  boum(sr, r) {
    const c = composer(sr, r, 3.2);
    c.bruit(0.0, { type: 'bas', f: (t) => 260 - 160 * Math.min(1, t / 0.4), grave: true, attaque: 0.004, tau: 0.35, gain: 1.4 })
      .bruit(0.0, { f: 700, q: 0.7, attaque: 0.001, tau: 0.04, gain: 0.7 })
      .bruit(0.0, { type: 'haut', f: 1800, attaque: 0.0005, tau: 0.012, gain: 0.35 });
    // l'écho, loin et sourd, sur les collines
    const x = c.b, y = x.slice();
    for (const [d, g] of [[0.55, 0.32], [1.1, 0.18], [1.7, 0.09]]) {
      const k = Math.round(d * sr), z = filtrer(x.slice(), sr, 'bas', 500, 0.7);
      for (let i = k; i < y.length; i++) y[i] += z[i - k] * g;
    }
    return cadrer([y], sr, 0.25);
  },
  crepite(sr, r) {
    const c = composer(sr, r, 1.8);
    c.grains(260, { zones: [[0.05, 1.5, 1]], f: [1500, 7000], d: [0.0008, 0.003], g: [0.1, 0.6], q: 1.6 });
    return cadrer([echo(c.b, sr)], sr, 0.2);
  },
};

/** Le son demandé (voir l'en-tête), en canaux de Float32Array. */
export function fabriquer(quoi, sr) {
  const [sorte, nom, n] = quoi.split('/');
  if (sorte === 'pas') return pas(nom, Number(n) || 0, sr);
  if (sorte === 'ebrouer') return ebrouer(sr);
  if (sorte === 'boucle') return BOUCLES[nom](sr, alea(graine(quoi)));
  if (sorte === 'oiseau') return OISEAUX[nom](sr, alea(graine(quoi)));
  if (sorte === 'cri') return CRIS[nom](sr, alea(graine(quoi)));
  if (sorte === 'bete') return BETES[nom](sr, alea(graine(quoi)));
  if (sorte === 'tambour') { const c = composer(sr, alea(graine(quoi)), 0.5); ventre(c, 0.005, 1); return cadrer([c.b], sr, 0.25); }
  if (sorte === 'pouf') return pouf(sr);
  if (sorte === 'pelle') return pelle(sr);
  if (sorte === 'boite') return boite(sr);
  if (sorte === 'creux') return creux(sr);
  if (sorte === 'jets') return jets(sr);
  if (sorte === 'papier') return papier(sr);
  if (sorte === 'cloche') return cloche(sr);
  if (sorte === 'claque') return claque(sr);
  if (sorte === 'kane') return kane(sr);
  if (sorte === 'assiette') return assiette(sr);
  if (sorte === 'plouf') return plouf(sr);
  if (sorte === 'rame') return rame(sr);
  if (sorte === 'coq') return coq(sr);
  if (sorte === 'caillou') return caillou(sr);
  if (sorte === 'roc') return roc(sr);
  if (sorte === 'slurp') return slurp(sr);
  if (sorte === 'piece') return piece(sr);
  if (sorte === 'saisen') return saisen(sr);
  if (sorte === 'bol') return bol(sr);
  if (sorte === 'tombe') return tombe(sr);
  if (sorte === 'chasen') return chasen(sr);
  if (sorte === 'pinceau') return pinceau(sr);
  if (sorte === 'tampon') return tampon(sr);
  if (sorte === 'waniguchi') return waniguchi(sr);
  if (sorte === 'bulle') return bulle(sr);
  if (sorte === 'pschitt') return pschitt(sr);
  if (sorte === 'feu') return FEUX[nom](sr, alea(graine(quoi)));
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
