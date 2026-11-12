// « Yuki akari » (雪あかり, « la lumière de la neige ») : la musique de Noël de la carte (case du 2 décembre du calendrier
// de l'Avent, demandée le 2026-11-12 : « une musique de Noël qui s'ajoute à l'onglet musique, que tu composeras
// toi-même »). La partition est écrite ici note à note, et chaque instrument est synthétisé : boîte à musique, koto
// (corde pincée, Karplus-Strong), flûte, cordes, contrebasse en pizzicato, clochettes, grelots de traîneau, célesta,
// avec une réverbération. Rien n'est tiré au hasard à chaque fois : une graine fixe, le même fichier à chaque essai.
//
//   node outils/composer_noel.mjs [sortie.wav]   (puis outils/composer_noel.py l'égalise et l'encode en .m4a)
//
// Ré majeur, 96 à la noire, 4/4. Plan : intro (4 mesures) · A (8) · A' (8) · refrain (8) · refrain' (8) · pont en
// si mineur, solo de koto (8) · passage (1) · double refrain un ton plus haut, en mi (16) · fin (6). Environ 2 min 55.
import fs from 'node:fs';

const SR = 48000;
const sortie = process.argv[2] || 'yuki-akari.wav';

// ---------------------------------------------------------------- Hasard fixe (mulberry32)
function graine(s) {
  return () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hasard = graine(20261212);
const entre = (a, b) => a + (b - a) * hasard();

// ---------------------------------------------------------------- Notes
const NOMS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function midi(n) {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(n);
  return 12 * (Number(m[3]) + 1) + NOMS[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}
const hz = (m) => 440 * 2 ** ((m - 69) / 12);
/** Une suite [note, temps] en notes { m, d } (r = silence). */
const suite = (liste, dt = 0) => liste.map(([n, d]) => ({ m: n === 'r' ? null : midi(n) + dt, d }));

// ---------------------------------------------------------------- Le tempo (accélérations et ralentis)
// [temps, battements par minute] : le tempo va en ligne droite d'un point au suivant.
const TEMPO = [[0, 96], [172, 96], [176, 96], [178, 88], [180, 96], [252, 96], [256, 90], [264, 70], [268, 64]];
const PAS = 1 / 32;
const TABLE = [0];
function bpm(b) {
  for (let i = 1; i < TEMPO.length; i++) {
    const [b1, t1] = TEMPO[i], [b0, t0] = TEMPO[i - 1];
    if (b <= b1) return t0 + (t1 - t0) * (b - b0) / Math.max(1e-9, b1 - b0);
  }
  return TEMPO.at(-1)[1];
}
for (let i = 1; i <= 300 / PAS; i++) TABLE.push(TABLE[i - 1] + PAS * 60 / bpm((i - 0.5) * PAS));
/** Le temps (en secondes) du battement b. */
function sec(b) {
  const i = Math.floor(b / PAS), f = b / PAS - i;
  return TABLE[i] + (TABLE[i + 1] - TABLE[i]) * f;
}

// ---------------------------------------------------------------- La partition
// Les accords, mesure par mesure : [symbole, temps]. Basse différente après « / ».
const SECTIONS = {
  intro: { debut: 0, accords: [['Dmaj7', 4], ['Gmaj7/D', 4], ['Dmaj7', 4], ['A7sus4', 4]] },
  A1: { debut: 16, accords: [['D', 4], ['Bm7', 4], ['Gmaj7', 4], ['A7sus4', 2], ['A7', 2], ['D/F#', 4], ['G', 2], ['Gm6', 2], ['D/A', 2], ['Bm7', 2], ['Em7', 2], ['A7', 2]] },
  A2: { debut: 48, accords: [['D', 4], ['Bm7', 4], ['Gmaj7', 4], ['A7sus4', 2], ['A7', 2], ['F#m7', 4], ['B7', 4], ['Em7', 2], ['Gm6', 2], ['D', 4]] },
  B1: { debut: 80, accords: [['Gmaj7', 4], ['A/G', 4], ['F#m7', 4], ['Bm7', 4], ['Em7', 4], ['A7', 4], ['Dmaj7', 2], ['B7', 2], ['Em7', 2], ['A7', 2]] },
  B2: { debut: 112, accords: [['Gmaj7', 4], ['A/G', 4], ['F#m7', 4], ['Bm7', 4], ['Em7', 4], ['A7', 4], ['Em7', 2], ['Gm6', 2], ['D', 4]] },
  C: { debut: 144, accords: [['Bm', 4], ['Bm/A', 4], ['Gmaj7', 4], ['F#7sus4', 2], ['F#7', 2], ['Bm', 4], ['Bm/A', 4], ['Em7', 4], ['A7sus4', 2], ['A7', 2]] },
  T: { debut: 176, accords: [['B7sus4', 2], ['B7', 2]] },
  F1: { debut: 180, accords: [['Amaj7', 4], ['B/A', 4], ['G#m7', 4], ['C#m7', 4], ['F#m7', 4], ['B7', 4], ['Emaj7', 2], ['C#7', 2], ['F#m7', 2], ['B7', 2]] },
  F2: { debut: 212, accords: [['Amaj7', 4], ['B/A', 4], ['G#m7', 4], ['C#m7', 4], ['F#m7', 4], ['B7', 4], ['F#m7', 2], ['Am6', 2], ['E', 4]] },
  O: { debut: 244, accords: [['E', 4], ['C#m7', 4], ['Amaj7', 4], ['B7sus4', 2], ['B7', 2], ['Am6', 4], ['E', 8]] },
};
const FIN = 272; // le dernier accord tient deux mesures

// Les mélodies (en ré ; transposées pour la fin en mi)
const THEME = [ // A : la boîte à musique
  ['A5', 1], ['B5', .5], ['A5', .5], ['F#5', 1], ['E5', 1],
  ['D5', 1.5], ['E5', .5], ['F#5', 1], ['A5', 1],
  ['B5', 1], ['D6', .5], ['B5', .5], ['A5', 1], ['F#5', 1],
];
const A1_MEL = [...THEME,
  ['E5', 2.5], ['r', .5], ['D5', .5], ['E5', .5],
  ['A5', 1], ['B5', .5], ['A5', .5], ['F#5', 1], ['A5', 1],
  ['D6', 1.5], ['B5', .5], ['Bb5', 1], ['A5', 1],
  ['F#5', 1], ['E5', .5], ['D5', .5], ['B4', 1], ['D5', 1],
  ['E5', 1], ['F#5', .5], ['G5', .5], ['E5', 2],
];
const A2_MEL = [...THEME,
  ['E5', 1], ['F#5', .5], ['E5', .5], ['D5', 1], ['C#5', 1],
  ['C#6', 1.5], ['B5', .5], ['A5', 1], ['F#5', 1],
  ['B5', 1], ['A5', .5], ['F#5', .5], ['D#5', 1], ['F#5', 1],
  ['E5', 1], ['G5', .5], ['B5', .5], ['Bb5', 1.5], ['A5', .5],
  ['D6', 3], ['r', 1],
];
const REFRAIN_DEBUT = [ // le refrain : la flûte
  ['B5', 1.5], ['A5', .5], ['B5', 1], ['D6', 1],
  ['C#6', 1.5], ['B5', .5], ['A5', 2],
  ['A5', 1.5], ['F#5', .5], ['E5', 1], ['F#5', 1],
  ['D5', 1.5], ['E5', .5], ['F#5', 2],
  ['G5', 1], ['A5', .5], ['B5', .5], ['E6', 1.5], ['D6', .5],
  ['C#6', 1.5], ['B5', .5], ['A5', 1], ['G5', 1],
];
const B1_MEL = [...REFRAIN_DEBUT,
  ['F#5', 1.5], ['A5', .5], ['B5', 1], ['D#6', 1],
  ['E6', 2], ['C#6', 1], ['A5', 1],
];
const B2_MEL = [...REFRAIN_DEBUT,
  ['G5', 1], ['B5', 1], ['Bb5', 1.5], ['A5', .5],
  ['D6', 3], ['r', 1],
];
const C_MEL = [ // le pont : le koto
  ['B5', 1], ['A5', .5], ['F#5', .5], ['E5', 1], ['F#5', 1],
  ['D5', 1.5], ['E5', .5], ['F#5', 2],
  ['G5', 1], ['F#5', .5], ['E5', .5], ['D5', 1], ['B4', 1],
  ['B4', 1], ['A#4', 1], ['C#5', 1], ['E5', 1],
  ['F#5', 1], ['B5', 1], ['A5', .5], ['F#5', .5], ['E5', 1],
  ['D5', 1], ['F#5', 1], ['E5', 2],
  ['G5', 1.5], ['F#5', .5], ['E5', 1], ['D5', 1],
  ['E5', 2], ['r', 2],
];
const O_MEL = [ // la fin : la boîte à musique seule, en mi
  ['B5', 1], ['C#6', .5], ['B5', .5], ['G#5', 1], ['F#5', 1],
  ['E5', 1.5], ['F#5', .5], ['G#5', 1], ['B5', 1],
  ['C#6', 1], ['E6', .5], ['C#6', .5], ['B5', 1], ['G#5', 1],
  ['F#5', 3], ['r', 1],
  ['C6', 2], ['B5', 2],
  ['E6', 8],
];

// ---------------------------------------------------------------- Accords
const QUALITES = {
  '': [0, 4, 7], m: [0, 3, 7], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], 7: [0, 4, 7, 10], '7sus4': [0, 5, 7, 10],
  m6: [0, 3, 7, 9],
};
function accord(sym) {
  const [haut, bas] = sym.split('/');
  const m = /^([A-G][#b]?)(.*)$/.exec(haut);
  const fond = (midi(m[1] + '4') % 12);
  const pcs = QUALITES[m[2]].map((i) => (fond + i) % 12);
  const basse = bas ? midi(bas + '4') % 12 : fond;
  return { pcs, fond, basse, sym };
}
/** Les accords d'une section, avec leur temps de début absolu. */
function accordsDe(nom) {
  const s = SECTIONS[nom];
  let b = s.debut;
  return s.accords.map(([sym, d]) => { const a = { ...accord(sym), b, d }; b += d; return a; });
}
/** La note de la classe pc la plus proche de `centre`. */
const proche = (pc, centre) => { let m = centre - ((centre - pc) % 12 + 12) % 12; if (centre - m > 6) m += 12; return m; };
/** Les notes de l'accord en montant depuis la basse (au-dessus de `bas`), jusqu'à `haut`. */
function echelle(a, bas, haut, depuisBasse = true) {
  const notes = [];
  for (let m = bas; m <= haut; m++) if (a.pcs.includes(m % 12) || (depuisBasse && m % 12 === a.basse && !notes.length)) notes.push(m);
  if (depuisBasse) { const i = notes.findIndex((m) => m % 12 === a.basse); return notes.slice(Math.max(0, i)); }
  return notes;
}

// ---------------------------------------------------------------- Les pistes (événements)
// Chaque instrument reçoit des notes { b (temps), d (durée en temps), m (midi), v (force 0–1), pan }.
const pistes = { boite: [], koto: [], kotoSolo: [], basse: [], cordes: [], flute: [], cloche: [], grelots: [], celesta: [], tambour: [] };
function poser(piste, liste, debut, v, extra = {}) {
  let b = debut;
  for (const n of liste) {
    if (n.m != null) piste.push({ b, d: n.d, m: n.m, v, ...extra });
    b += n.d;
  }
  return b;
}

// La mélodie
poser(pistes.boite, suite([['A5', 1], ['B5', .5], ['A5', .5], ['F#5', 1], ['E5', 1], ['D5', 2], ['r', 2],
  ['A6', 1], ['B6', .5], ['A6', .5], ['F#6', 1], ['E6', 1], ['D6', 2]]), 0, 0.62);
poser(pistes.boite, suite(A1_MEL), 16, 0.8);
poser(pistes.boite, suite(A2_MEL), 48, 0.82);
poser(pistes.flute, suite([['F#5', .5], ['A5', .5]]), 79, 0.75, { phrase: 'pickup' });
poser(pistes.flute, suite(B1_MEL), 80, 0.85);
poser(pistes.flute, suite(B2_MEL), 112, 0.9);
poser(pistes.kotoSolo, suite(C_MEL), 144, 0.85);
poser(pistes.flute, suite([['G#5', .5], ['B5', .5]]), 179, 0.8);
poser(pistes.flute, suite(B1_MEL, 2), 180, 0.95);
poser(pistes.flute, suite(B2_MEL, 2), 212, 1.0);
poser(pistes.boite, suite(B1_MEL, 14), 180, 0.5); // la boîte double la flûte une octave plus haut
poser(pistes.boite, suite(B2_MEL, 14), 212, 0.55);
poser(pistes.boite, suite(O_MEL), 244, 0.8);

// Les phrases de la flûte (elle respire entre elles)
for (const n of pistes.flute) n.phrase = Math.floor((n.b + 0.01 - 80) / 16) + (n.b >= 180 ? 100 : 0);

// L'accompagnement, section par section
const nuances = { intro: 0.45, A1: 0.55, A2: 0.65, B1: 0.8, B2: 0.85, C: 0.55, T: 0.8, F1: 0.95, F2: 1, O: 0.55 };
for (const nom of Object.keys(SECTIONS)) {
  const nu = nuances[nom];
  for (const a of accordsDe(nom)) {
    const fin = a.b + a.d;
    // les cordes : l'accord tenu, au milieu du clavier
    if (nom !== 'intro' || a.b >= 4) {
      const voix = [...new Set(a.pcs.map((pc) => proche(pc, 64)))].sort((x, y) => x - y);
      for (const m of voix) pistes.cordes.push({ b: a.b, d: a.d, m, v: 0.5 * nu * (nom === 'intro' ? 0.7 : 1) });
    }
    // la basse en pizzicato
    const fondBas = proche(a.basse, 44);
    const quinte = proche((a.basse + 7) % 12, fondBas + 7);
    if (['A2', 'C', 'O'].includes(nom) || (nom === 'A1' && a.b >= 32)) {
      pistes.basse.push({ b: a.b, d: Math.min(2, a.d), m: fondBas, v: 0.7 * nu + 0.2 });
      if (a.d === 4) pistes.basse.push({ b: a.b + 2, d: 2, m: quinte, v: 0.55 * nu + 0.15 });
    } else if (['B1', 'B2', 'F1', 'F2', 'T'].includes(nom)) {
      pistes.basse.push({ b: a.b, d: 1.5, m: fondBas, v: 0.95 });
      pistes.basse.push({ b: a.b + 1.5, d: 0.5, m: quinte, v: 0.55 });
      if (a.d === 4) {
        pistes.basse.push({ b: a.b + 2, d: 1, m: fondBas + 12 <= 55 ? fondBas + 12 : fondBas, v: 0.7 });
        pistes.basse.push({ b: a.b + 3, d: 1, m: quinte, v: 0.6 });
      }
    }
    // le koto : des accords en arpèges
    const notesKoto = echelle(a, 50, 76);
    const huitiemes = ['A2', 'F1', 'F2'].includes(nom);
    const motif = a.d === 4 ? (huitiemes ? [0, 1, 2, 3, 4, 3, 2, 1] : [0, 1, 2, 3]) : (huitiemes ? [0, 1, 2, 3] : [0, 2]);
    if (['A1', 'A2', 'B1', 'B2', 'C', 'F1', 'F2'].includes(nom)) {
      const pas = a.d / motif.length;
      const force = nom === 'C' ? 0.42 : ['B1', 'B2'].includes(nom) ? 0.4 : 0.55;
      motif.forEach((i, k) => pistes.koto.push({ b: a.b + k * pas, d: pas * 2, m: notesKoto[Math.min(i, notesKoto.length - 1)], v: force * (k === 0 ? 1.1 : 0.85 + 0.15 * hasard()) }));
    }
    // la boîte à musique au-dessus de la flûte dans le premier refrain : une pluie d'arpèges
    if (['B1', 'B2'].includes(nom)) {
      const haut = echelle(a, 86, 99, false);
      const m8 = a.d === 4 ? [0, 1, 2, 3, 2, 1, 0, 1] : [0, 1, 2, 1];
      m8.forEach((i, k) => pistes.boite.push({ b: a.b + k * 0.5, d: 0.5, m: haut[Math.min(i, haut.length - 1)], v: 0.32 + 0.06 * (k % 2 === 0) }));
    }
    // les clochettes, au premier temps des accords du refrain
    if (['B1', 'B2', 'F1', 'F2'].includes(nom) && (a.b % 4 === 0)) pistes.cloche.push({ b: a.b, d: 4, m: proche(a.fond, 79), v: 0.55 * nu });
  }
}
// clochettes aux grands moments
for (const [b, n, v] of [[0, 'D6', 0.6], [16, 'A5', 0.4], [48, 'D6', 0.5], [144, 'B5', 0.45], [176, 'B5', 0.6], [180, 'E6', 0.75], [244, 'E6', 0.6], [264, 'E5', 0.6], [264, 'B5', 0.5], [264.04, 'E6', 0.55]]) pistes.cloche.push({ b, d: 8, m: midi(n), v });

// les grelots du traîneau
function grelots(debut, fin, motif, v) {
  for (let b = debut; b < fin - 1e-6; b += 0.5) {
    const temps = b % 4;
    const fort = motif === 'refrain' ? (temps === 1 || temps === 3 ? 1 : Number.isInteger(temps) ? 0.7 : 0.45)
      : motif === 'doux' ? (temps === 1 || temps === 3 ? 0.8 : 0) : 0.6;
    if (fort) pistes.grelots.push({ b, v: v * fort });
  }
}
grelots(64, 80, 'doux', 0.4);
grelots(80, 112, 'refrain', 0.5);
grelots(112, 144, 'refrain', 0.6);
grelots(180, 244, 'refrain', 0.75);
grelots(244, 248, 'refrain', 0.4);
for (let i = 0; i < 16; i++) pistes.grelots.push({ b: 12 + i * 0.25, v: 0.08 + 0.3 * (i / 15) ** 2 }); // le roulement de l'intro
for (let i = 0; i < 16; i++) pistes.grelots.push({ b: 176 + i * 0.25, v: 0.12 + 0.5 * (i / 15) ** 2 }); // et celui du passage
pistes.grelots.push({ b: 264, v: 0.5 });

// le tambour feutré (seulement les refrains)
for (let b = 112; b < 144; b += 2) pistes.tambour.push({ b, v: b % 4 === 0 ? 0.45 : 0.3 });
for (let b = 180; b < 244; b += 2) pistes.tambour.push({ b, v: b % 4 === 0 ? 0.65 : 0.45 });
pistes.tambour.push({ b: 179, v: 0.4 }, { b: 179.5, v: 0.5 });

// le célesta : des flocons, notes de la gamme pentatonique de l'accord, très doux
function flocons(nom, densite) {
  for (const a of accordsDe(nom)) {
    const notes = echelle(a, 86, 101, false).concat([proche((a.fond + 2) % 12, 93)]);
    for (let b = a.b; b < a.b + a.d - 1e-6; b += 0.5) {
      if (hasard() < densite) pistes.celesta.push({ b: b + (hasard() < 0.3 ? 0.25 : 0), d: 1, m: notes[Math.floor(hasard() * notes.length)], v: entre(0.12, 0.3), pan: entre(-0.7, 0.7) });
    }
  }
}
flocons('intro', 0.45); flocons('A1', 0.12); flocons('C', 0.18); flocons('O', 0.4);
// la montée du passage : la boîte à musique monte l'accord de si (sus4) en doubles croches
{
  const a = accord('B7sus4');
  const notes = echelle(a, 71, 95, false);
  notes.forEach((m, i) => pistes.boite.push({ b: 176 + i * (3.5 / notes.length), d: 1, m, v: 0.35 + 0.35 * i / notes.length }));
}
// la glissade du koto à la fin du pont (gamme de la, montante)
{
  const gamme = [57, 59, 61, 62, 64, 66, 69, 71, 73, 74, 76];
  gamme.forEach((m, i) => pistes.koto.push({ b: 174 + i * (1.6 / gamme.length), d: 1.5, m, v: 0.35 + 0.3 * i / gamme.length }));
}
// le dernier accord : le koto l'égrène en montant
echelle(accord('E'), 52, 88, false).forEach((m, i) => pistes.koto.push({ b: 264 + i * 0.12, d: 8, m, v: 0.5 }));

// ---------------------------------------------------------------- Le son
const DUREE = sec(FIN) + 6;
const N = Math.ceil(DUREE * SR);
const nouvellePiste = () => ({ L: new Float32Array(N), R: new Float32Array(N) });
const panG = (p) => Math.cos((p + 1) * Math.PI / 4), panD = (p) => Math.sin((p + 1) * Math.PI / 4);
function ajouter(dest, i0, sig, pan = 0, gain = 1) {
  const gl = panG(pan) * gain * Math.SQRT2, gr = panD(pan) * gain * Math.SQRT2;
  for (let i = 0; i < sig.length; i++) {
    const j = i0 + i;
    if (j < 0) continue;
    if (j >= N) break;
    dest.L[j] += sig[i] * gl;
    dest.R[j] += sig[i] * gr;
  }
}
const humain = (ms) => Math.round(entre(-ms, ms) / 1000 * SR);

/** Une note frappée faite de partiels qui s'éteignent : [rapport, amplitude, durée de vie (s)]. */
function partiels(f, liste, duree, attaque = 0.0015) {
  const n = Math.ceil(duree * SR);
  const s = new Float32Array(n);
  for (const [r, a, tau] of liste) {
    const fr = f * r;
    if (fr > SR * 0.45) continue;
    const w = 2 * Math.PI * fr / SR, k = Math.exp(-1 / (tau * SR));
    let env = a, ph = hasard() * 0.3;
    const fin = Math.min(n, Math.ceil(tau * 7 * SR));
    for (let i = 0; i < fin; i++) { s[i] += env * Math.sin(ph); ph += w; env *= k; }
  }
  const na = Math.ceil(attaque * SR);
  for (let i = 0; i < na && i < n; i++) s[i] *= i / na;
  const nf = Math.ceil(0.05 * SR); // pas de clic à la fin
  for (let i = 0; i < nf && i < n; i++) s[n - 1 - i] *= i / nf;
  return s;
}

function boiteAMusique(f, v) {
  const k = Math.min(1.5, Math.max(0.4, (660 / f) ** 0.6));
  const s = partiels(f, [[1, 1, 1.9 * k], [1 + 0.9 / f, 0.45, 1.6 * k], [2, 0.22, 0.6 * k], [3, 0.08, 0.3 * k], [5.93, 0.3, 0.12 * k], [9.8, 0.12, 0.05 * k], [13.7, 0.05, 0.03 * k]], 6.5 * k);
  let avant = 0;
  for (let i = 0; i < 120; i++) { const b = hasard() - 0.5; s[i] += (b - avant) * 0.1 * (1 - i / 120); avant = b; } // le petit clic de la lame
  return s.map((x) => x * v);
}
function celesta(f, v) {
  const s = partiels(f, [[1, 1, 1.1], [2, 0.12, 0.3], [4, 0.05, 0.12], [1.002, 0.4, 0.9]], 4, 0.003);
  return s.map((x) => x * v);
}
function clochette(f, v) {
  const k = Math.min(1.6, Math.max(0.5, (440 / f) ** 0.4));
  const s = partiels(f, [[1, 1, 3.2 * k], [1.0015, 0.5, 2.8 * k], [3, 0.38, 1.1 * k], [4.18, 0.08, 0.5 * k], [5.43, 0.15, 0.35 * k], [6.8, 0.05, 0.2 * k]], 10 * k, 0.002);
  return s.map((x) => x * v);
}

/** Corde pincée (Karplus-Strong) : délai fractionnaire (Lagrange), filtre d'amortissement, position du pincement. */
function cordePincee(f, v, { t60 = 3, clarte = 0.4, position = 0.13, duree = 4, corps = 0.3, etouffe = null, douceur = 0.5 } = {}) {
  const n = Math.ceil(duree * SR);
  const D = SR / f - clarte; // le filtre ajoute `clarte` échantillons
  const taille = Math.ceil(D) + 8;
  const ligne = new Float64Array(taille);
  // l'excitation : la forme de la corde tirée par le plectre (un triangle dont la pointe est au point de pincement),
  // avec un peu de bruit (le frottement de l'onglet), adoucie d'autant plus que la note est douce
  const p = Math.round(D);
  const pointe = Math.max(1, Math.round(position * p));
  const exc2 = new Float64Array(p);
  let lp = 0;
  for (let i = 0; i < p; i++) {
    lp += 0.35 * ((hasard() * 2 - 1) - lp);
    exc2[i] = (i < pointe ? i / pointe : (p - i) / (p - pointe)) + 0.12 * lp;
  }
  const a = Math.min(0.9, 0.2 + douceur * 0.6 * (1.2 - v * 0.6));
  for (let passe = 0; passe < 2; passe++) { // un passe-bas aller-retour (sans décalage)
    let y = exc2[passe ? p - 1 : 0];
    for (let k = 0; k < p; k++) { const i = passe ? p - 1 - k : k; y += (1 - a) * (exc2[i] - y); exc2[i] = y; }
  }
  let moy = 0; for (const x of exc2) moy += x; moy /= p;
  const s = new Float32Array(n);
  let w = 0, prec = 0;
  const g = 10 ** (-3 / (f * t60));
  const lire = (retard) => { // Lagrange d'ordre 3
    const pos = w - retard;
    const i = Math.floor(pos), x = pos - i;
    const y = (k) => ligne[((i + k) % taille + taille) % taille];
    const ym1 = y(-1), y0 = y(0), y1 = y(1), y2 = y(2);
    return y0 + x * (-ym1 / 3 - y0 / 2 + y1 - y2 / 6 + x * ((y1 + ym1) / 2 - y0 + x * ((y2 - ym1) / 6 + (y0 - y1) / 2)));
  };
  let gEtouffe = 1;
  for (let i = 0; i < n; i++) {
    const r = lire(D);
    const filtre = (1 - clarte) * r + clarte * prec; prec = r;
    if (etouffe != null && i > etouffe * SR) gEtouffe = Math.max(0.93, gEtouffe * 0.999);
    const y = (i < p ? exc2[i] - moy : 0) + g * gEtouffe * filtre;
    ligne[w] = y; w = (w + 1) % taille;
    s[i] = y;
  }
  // le corps de l'instrument : deux résonances (biquads passe-bande) mêlées au son
  if (corps) {
    const out = new Float32Array(n);
    for (const [fc, q, amp] of [[220, 3, 1], [560, 4, 0.6]]) {
      const w0 = 2 * Math.PI * fc / SR, al = Math.sin(w0) / (2 * q);
      const b0 = al, b2 = -al, a0 = 1 + al, a1 = -2 * Math.cos(w0), a2 = 1 - al;
      let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
      for (let i = 0; i < n; i++) {
        const x = s[i];
        const y = (b0 * x + b2 * x2 - a1 * y1 - a2 * y2) / a0;
        x2 = x1; x1 = x; y2 = y1; y1 = y;
        out[i] += y * amp;
      }
    }
    for (let i = 0; i < n; i++) s[i] = s[i] + corps * out[i];
  }
  const nf = Math.ceil(0.03 * SR);
  for (let i = 0; i < nf; i++) s[n - 1 - i] *= i / nf;
  return s.map((x) => x * v);
}
const koto = (f, v) => cordePincee(f, v, { t60: Math.min(4.5, 2.2 * (300 / f) ** 0.35 + 1), clarte: 0.42, position: 0.11, duree: 4.5, corps: 0.35, douceur: 0.35 });
function contrebasse(f, v, dSec) {
  const s = cordePincee(f, v, { t60: 1.8, clarte: 0.5, position: 0.22, duree: Math.min(3, dSec + 0.6), corps: 0.15, douceur: 0.9, etouffe: dSec });
  // un peu de fondamental pour la rondeur
  const k = Math.exp(-1 / (0.5 * SR)), w = 2 * Math.PI * f / SR;
  let env = 0.35 * v;
  for (let i = 0; i < s.length; i++) { const att = Math.min(1, i / (0.008 * SR)); s[i] += env * att * Math.sin(w * i); env *= k; if (i > dSec * SR) env *= 0.9997; }
  return s;
}

// Les cordes : dents de scie limitées en harmoniques (tables), trois voix légèrement désaccordées
const tables = new Map();
function table(m) {
  if (tables.has(m)) return tables.get(m);
  const L = 2048, t = new Float32Array(L + 1), f = hz(m);
  const H = Math.max(1, Math.floor(Math.min(9000, SR * 0.4) / f));
  for (let h = 1; h <= H; h++) {
    const a = (1 / h) * Math.exp(-(h * f) / 2200);
    for (let i = 0; i < L; i++) t[i] += a * Math.sin(2 * Math.PI * h * i / L);
  }
  t[L] = t[0];
  let max = 0; for (const x of t) max = Math.max(max, Math.abs(x));
  for (let i = 0; i <= L; i++) t[i] /= max;
  tables.set(m, t);
  return t;
}
function cordes(m, v, dSec) {
  const att = 0.9, rel = 1.4;
  const n = Math.ceil((dSec + rel) * SR);
  const s = new Float32Array(n);
  const t = table(m), L = 2048;
  for (const [cents, ampli] of [[-7, 0.5], [0, 0.6], [7, 0.5]]) {
    const f = hz(m) * 2 ** (cents / 1200);
    let ph = hasard();
    const vibf = entre(4.6, 5.6), vibp = entre(0, 6.28);
    for (let i = 0; i < n; i++) {
      const tt = i / SR;
      ph += f * (1 + 0.0022 * Math.sin(2 * Math.PI * vibf * tt + vibp)) / SR;
      ph -= Math.floor(ph);
      const x = ph * L, k = Math.floor(x), fr = x - k;
      s[i] += ampli * (t[k] + (t[k + 1] - t[k]) * fr);
    }
  }
  for (let i = 0; i < n; i++) {
    const tt = i / SR;
    let e = tt < att ? (1 - Math.cos(Math.PI * tt / att)) / 2 : 1;
    if (tt > dSec) e *= Math.max(0, 1 - (tt - dSec) / rel) ** 2;
    s[i] *= e * v * 0.4;
  }
  return s;
}

// La flûte : une phrase entière d'un seul souffle (glissés entre les notes, vibrato qui vient, bruit de souffle)
function flute(notes) {
  const t0 = sec(notes[0].b), t1 = sec(notes.at(-1).b + notes.at(-1).d) + 0.4;
  const n = Math.ceil((t1 - t0) * SR);
  const s = new Float32Array(n);
  const debuts = notes.map((x) => sec(x.b) - t0), fins = notes.map((x) => sec(x.b + x.d) - t0);
  let ph = 0, k = 0, freq = hz(notes[0].m) * 0.985, bruit = 0, bruit2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    while (k < notes.length - 1 && t >= debuts[k + 1]) k++;
    const no = notes[k];
    const dans = t - debuts[k];
    // la hauteur : glissé de 45 ms vers la note, et un petit appui par en dessous (souffle de shakuhachi) au début
    const cible = hz(no.m);
    freq += (cible - freq) * (1 - Math.exp(-1 / (0.012 * SR)));
    const vibAmp = Math.min(1, Math.max(0, (dans - 0.22) / 0.45)) * 0.0055;
    const f = freq * (1 + vibAmp * Math.sin(2 * Math.PI * 5.1 * t));
    ph += f / SR; ph -= Math.floor(ph);
    // l'enveloppe : attaque, léger creux à chaque nouvelle note (coup de langue), fin de phrase
    let e = Math.min(1, t / 0.07);
    const finPhrase = fins.at(-1);
    if (t > finPhrase - 0.05) e *= Math.max(0, 1 - (t - (finPhrase - 0.05)) / 0.3);
    if (k > 0 && dans < 0.06) e *= 0.72 + 0.28 * (dans / 0.06);
    e *= 0.85 + 0.15 * Math.min(1, dans / 0.3); // la note s'épanouit
    e *= no.v;
    const P = 2 * Math.PI * ph;
    const ton = Math.sin(P) + 0.22 * Math.sin(2 * P + 0.4) + 0.09 * Math.sin(3 * P + 1.1) + 0.03 * Math.sin(4 * P);
    // le souffle : bruit filtré, plus fort à l'attaque
    const blanc = hasard() * 2 - 1;
    bruit += 0.25 * (blanc - bruit);
    bruit2 += 0.5 * (bruit - bruit2);
    const souffle = (bruit - bruit2) * (0.07 + 0.25 * Math.max(0, 1 - dans / 0.08));
    s[i] = e * (0.62 * ton + souffle);
  }
  return { s, t0 };
}

// Les grelots : chaque secousse, une poignée de petites clochettes très aiguës
const banqueGrelots = Array.from({ length: 24 }, () => {
  const n = Math.ceil(0.35 * SR);
  const s = new Float32Array(n);
  const nb = 5 + Math.floor(hasard() * 4);
  for (let j = 0; j < nb; j++) {
    const d0 = Math.floor(entre(0, 0.022) * SR);
    const tau = entre(0.025, 0.07), amp = entre(0.3, 1);
    for (let q = 0; q < 3; q++) {
      const fr = entre(4200, 11500), w = 2 * Math.PI * fr / SR, k = Math.exp(-1 / (tau * SR));
      let e = amp * entre(0.4, 1), ph = hasard() * 6;
      for (let i = d0; i < n; i++) { s[i] += e * Math.sin(ph); ph += w; e *= k; }
    }
  }
  for (let i = 0; i < 200; i++) s[i] += (hasard() - 0.5) * 0.4 * (1 - i / 200);
  return s;
});

function tambour(v) {
  const n = Math.ceil(0.6 * SR);
  const s = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = 48 + 62 * Math.exp(-t / 0.045);
    ph += 2 * Math.PI * f / SR;
    s[i] = Math.sin(ph) * Math.exp(-t / 0.2) * Math.min(1, t / 0.002) * v;
  }
  return s;
}

// ---------------------------------------------------------------- Essai : chaque instrument joue-t-il juste ?
// node outils/composer_noel.mjs --essai : la hauteur mesurée de quelques notes (écart en cents, doit rester sous ±5).
if (process.argv.includes('--essai')) {
  const mesure = (s, f) => { // la fréquence la plus forte à ±50 cents, entre 0,15 et 0,65 s
    let meilleur = 0, cents = 0;
    for (let c = -50; c <= 50; c += 0.5) {
      const w = 2 * Math.PI * f * 2 ** (c / 1200) / SR;
      let re = 0, im = 0;
      for (let i = Math.round(0.15 * SR); i < Math.min(s.length, Math.round(0.65 * SR)); i++) { re += s[i] * Math.cos(w * i); im += s[i] * Math.sin(w * i); }
      if (re * re + im * im > meilleur) { meilleur = re * re + im * im; cents = c; }
    }
    return cents;
  };
  for (const n of ['D2', 'A2', 'D3', 'A3', 'D4', 'A4', 'D5', 'A5', 'D6']) {
    const m = midi(n), f = hz(m);
    const l = [['koto', koto(f, 0.8, 1)], ['basse', contrebasse(f, 0.8, 1)], ['boîte', boiteAMusique(f, 0.8)], ['cordes', cordes(m, 0.8, 1)]];
    console.log(n.padEnd(3), l.map(([nom, s]) => `${nom} ${mesure(s, f).toFixed(1)}`).join(' · '));
  }
  const { s } = flute([{ b: 0, d: 4, m: 81, v: 1 }]);
  console.log('flûte A5', mesure(s.subarray(Math.round(0.3 * SR)), 880).toFixed(1));
  process.exit(0);
}

// ---------------------------------------------------------------- Rendu de chaque piste
const stems = {};
const quand = (b) => Math.round(sec(b) * SR);
{
  const p = stems.boite = nouvellePiste();
  for (const n of pistes.boite) ajouter(p, quand(n.b) + humain(5), boiteAMusique(hz(n.m), n.v * entre(0.92, 1.05)), Math.max(-0.5, Math.min(0.5, (n.m - 84) / 30)));
}
{
  const p = stems.celesta = nouvellePiste();
  for (const n of pistes.celesta) ajouter(p, quand(n.b) + humain(10), celesta(hz(n.m), n.v), n.pan);
}
{
  const p = stems.cloche = nouvellePiste();
  for (const n of pistes.cloche) ajouter(p, quand(n.b), clochette(hz(n.m), n.v), entre(-0.3, 0.3));
}
{
  const p = stems.koto = nouvellePiste();
  for (const n of pistes.koto) ajouter(p, quand(n.b) + humain(6), koto(hz(n.m), n.v * entre(0.9, 1.05), n.d), -0.35 + (n.m - 50) / 80);
  const q = stems.kotoSolo = nouvellePiste();
  for (const n of pistes.kotoSolo) ajouter(q, quand(n.b) + humain(8), koto(hz(n.m), n.v * entre(0.92, 1.05), n.d), 0.1);
}
{
  const p = stems.basse = nouvellePiste();
  for (const n of pistes.basse) ajouter(p, quand(n.b) + humain(4), contrebasse(hz(n.m), n.v, sec(n.b + n.d) - sec(n.b)), 0);
}
{
  const p = stems.cordes = nouvellePiste();
  for (const n of pistes.cordes) ajouter(p, quand(n.b), cordes(n.m, n.v, sec(n.b + n.d) - sec(n.b)), (n.m - 64) / 14 * 0.5);
}
{
  const p = stems.flute = nouvellePiste();
  const phrases = new Map();
  for (const n of pistes.flute) { if (!phrases.has(n.phrase)) phrases.set(n.phrase, []); phrases.get(n.phrase).push(n); }
  // la levée rejoint la phrase qui suit
  const cles = [...phrases.keys()].sort((a, b) => phrases.get(a)[0].b - phrases.get(b)[0].b);
  const groupes = [];
  for (const c of cles) {
    const g = phrases.get(c);
    const prec = groupes.at(-1);
    if (prec && prec.length <= 2 && Math.abs(prec.at(-1).b + prec.at(-1).d - g[0].b) < 1e-6) prec.push(...g);
    else groupes.push([...g]);
  }
  for (const g of groupes) {
    // un silence dans la phrase la coupe en deux souffles
    const morceaux = [[]];
    for (let i = 0; i < g.length; i++) {
      morceaux.at(-1).push(g[i]);
      if (i < g.length - 1 && g[i + 1].b - (g[i].b + g[i].d) > 0.01) morceaux.push([]);
    }
    for (const m of morceaux) { const { s, t0 } = flute(m); ajouter(p, Math.round(t0 * SR), s, -0.12); }
  }
}
{
  const p = stems.grelots = nouvellePiste();
  for (const n of pistes.grelots) ajouter(p, quand(n.b) + humain(7), banqueGrelots[Math.floor(hasard() * banqueGrelots.length)].map((x) => x * n.v), 0.35);
}
{
  const p = stems.tambour = nouvellePiste();
  for (const n of pistes.tambour) ajouter(p, quand(n.b), tambour(n.v), 0);
}

// ---------------------------------------------------------------- Volume perçu de chaque piste (BS.1770, pondération K)
function lufs({ L, R }) {
  const etage = (x, b, a) => {
    const y = new Float64Array(x.length);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < x.length; i++) {
      const v = b[0] * x[i] + b[1] * x1 + b[2] * x2 - a[1] * y1 - a[2] * y2;
      x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v;
    }
    return y;
  };
  const K = (x) => etage(etage(x, [1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, 0.73248077421585]), [1, -2, 1], [1, -1.99004745483398, 0.99007225036621]);
  const l = K(L), r = K(R);
  const bloc = Math.round(0.4 * SR), pas = Math.round(0.1 * SR);
  const z = [];
  for (let i = 0; i + bloc <= l.length; i += pas) {
    let s = 0;
    for (let j = i; j < i + bloc; j++) s += l[j] * l[j] + r[j] * r[j];
    z.push(s / bloc);
  }
  const fort = z.filter((x) => -0.691 + 10 * Math.log10(x) > -70);
  if (!fort.length) return -Infinity;
  const moy = fort.reduce((a, b) => a + b, 0) / fort.length;
  const seuil = -0.691 + 10 * Math.log10(moy) - 10;
  const garde = fort.filter((x) => -0.691 + 10 * Math.log10(x) > seuil);
  return -0.691 + 10 * Math.log10(garde.reduce((a, b) => a + b, 0) / garde.length);
}

// le volume voulu de chaque piste, par rapport à la mélodie (en LU), et sa part de réverbération
const MIX = {
  boite: [0, 0.32], flute: [0, 0.28], kotoSolo: [-0.5, 0.26], koto: [-7, 0.22], cordes: [-11, 0.35], basse: [-6, 0.06],
  cloche: [-9, 0.45], celesta: [-13, 0.5], grelots: [-12, 0.18], tambour: [-11, 0.08],
};
const melange = nouvellePiste(), envoi = nouvellePiste();
const rapport = {};
for (const [nom, [cible, rev]] of Object.entries(MIX)) {
  const l = lufs(stems[nom]);
  const g = 10 ** ((cible - 20 - l) / 20); // la mélodie vers −20 LUFS avant le volume final
  rapport[nom] = `${l.toFixed(1)} LUFS → ×${g.toFixed(2)}`;
  const { L, R } = stems[nom];
  for (let i = 0; i < N; i++) {
    melange.L[i] += L[i] * g; melange.R[i] += R[i] * g;
    envoi.L[i] += L[i] * g * rev; envoi.R[i] += R[i] * g * rev;
  }
}
console.log(rapport);

// ---------------------------------------------------------------- Réverbération (réseau de 8 lignes à retard, matrice de Householder)
{
  const longueurs = [2203, 2459, 2837, 3109, 3391, 3727, 4019, 4423];
  const T60 = 2.6, preDelai = Math.round(0.022 * SR);
  const lignes = longueurs.map((n) => new Float32Array(n));
  const idx = longueurs.map(() => 0);
  const gains = longueurs.map((n) => 10 ** (-3 * n / (SR * T60)));
  const amort = longueurs.map(() => 0);
  // diffuseurs à l'entrée (passe-tout)
  const diff = [142, 107, 379, 277].map((n) => ({ b: new Float32Array(n), i: 0 }));
  const passeTout = (d, x, g = 0.62) => { const y = d.b[d.i]; const v = x + g * y; d.b[d.i] = v; d.i = (d.i + 1) % d.b.length; return y - g * v; };
  const pre = { L: new Float32Array(preDelai), R: new Float32Array(preDelai) }; let ip = 0;
  const sorties = new Float32Array(8);
  for (let i = 0; i < N; i++) {
    const xl = pre.L[ip], xr = pre.R[ip];
    pre.L[ip] = envoi.L[i]; pre.R[ip] = envoi.R[i]; ip = (ip + 1) % preDelai;
    let m = (xl + xr) * 0.5;
    for (const d of diff) m = passeTout(d, m);
    let somme = 0;
    for (let k = 0; k < 8; k++) {
      const y = lignes[k][idx[k]];
      amort[k] += 0.62 * (y - amort[k]); // les aigus s'éteignent plus vite
      sorties[k] = amort[k] * gains[k];
      somme += sorties[k];
    }
    const h = somme * 2 / 8;
    for (let k = 0; k < 8; k++) {
      const entree = (k % 2 ? xr : xl) * 0.35 + m * 0.35;
      lignes[k][idx[k]] = sorties[k] - h + entree;
      idx[k] = (idx[k] + 1) % longueurs[k];
    }
    melange.L[i] += 0.55 * (sorties[0] - sorties[2] + sorties[4] - sorties[6]);
    melange.R[i] += 0.55 * (sorties[1] - sorties[3] + sorties[5] - sorties[7]);
  }
}

// ---------------------------------------------------------------- Fin : un peu d'air dans les aigus (+3 dB au-dessus de 5 kHz),
// fondu des dernières secondes, crête à −1 dB, WAV 24 bits
for (const c of [melange.L, melange.R]) {
  const a = Math.exp(-2 * Math.PI * 5000 / SR);
  let bas = 0;
  for (let i = 0; i < N; i++) { bas = (1 - a) * c[i] + a * bas; c[i] += 0.41 * (c[i] - bas); }
}
{
  const fin = N, fondu = Math.round(2.5 * SR);
  for (let i = fin - fondu; i < fin; i++) { const x = (fin - i) / fondu; melange.L[i] *= x; melange.R[i] *= x; }
  let crete = 0;
  for (let i = 0; i < N; i++) crete = Math.max(crete, Math.abs(melange.L[i]), Math.abs(melange.R[i]));
  const g = 10 ** (-1 / 20) / crete;
  const buf = Buffer.alloc(44 + N * 6);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 6, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 6, 28); buf.writeUInt16LE(6, 32); buf.writeUInt16LE(24, 34); buf.write('data', 36); buf.writeUInt32LE(N * 6, 40);
  let o = 44;
  for (let i = 0; i < N; i++) {
    for (const c of [melange.L, melange.R]) {
      const v = Math.max(-8388608, Math.min(8388607, Math.round(c[i] * g * 8388607)));
      buf.writeIntLE(v, o, 3); o += 3;
    }
  }
  fs.writeFileSync(sortie, buf);
  console.log(`${sortie} : ${(N / SR).toFixed(1)} s, crête avant réglage ${(20 * Math.log10(crete)).toFixed(1)} dB`);
}
