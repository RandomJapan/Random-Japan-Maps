// ================================================================
//  La musique de la balade (demandée le 2026-10-22 : « dans le style des anciens Pokémon, de X et Y, un
//  peu nostalgique »). Deux airs originaux, composés pour la carte (aucune musique existante, rien à
//  télécharger, aucun droit) et joués note à note par le navigateur (Web Audio) :
//  - Itsukushima : un air calme du Japon ancien, koto, flûte de bambou et taiko ;
//  - Aogashima : un air d'île et d'aventure, plus vif, marimba, flûte, petite batterie ;
//  - Gokayama (2026-10-23) : un air de montagne, mélancolique et chaleureux, sur la gamme des chants populaires (la
//    mineur, la do ré mi sol), flûte de bambou, shamisen, et les claquements de la sasara et des baguettes de la kokiriko ;
//  - Himeji (2026-10-25) : un air de château, noble et un peu mélancolique, sur la gamme in (mi fa la si do), la flûte
//    traversière des fêtes (fue), le koto et le taiko ;
//  - Takachiho (2026-10-25) : un air de gorge et de mythe, qui se balance comme une barque (des rythmes pointés), sur la
//    gamme ritsu (sol la do ré mi), la flûte du kagura, le koto, le taiko et les grelots (suzu) que secouent les danseurs ;
//  - le Pavillon d'or (2026-10-26) : un air de jardin zen, doré et calme, sur la pentatonique de mi bémol majeur, la flûte des
//    moines zen (shakuhachi), le koto, le bois du temple (mokugyo) et le bol de prière (rin).
//  La nuit, le même air plus lent, en boîte à musique. Une introduction, puis la boucle (A, A', B).
//  Pour danser (la danse achetée au marchand, 2026-10-23), un troisième air, celui d'une fête d'été (bon-odori) : la
//  flûte de fête (shinobue), le shamisen, le grand tambour et la clochette de cuivre (atarigane) ; fete(oui).
//  Elle passe par la même sortie que les autres sons (son.js : couper le son la coupe aussi) ; le menu la
//  coupe seule (localStorage.baladeMusique = 'non') ; elle se tait pendant la vidéo TikTok.
// ================================================================
import { son } from './son.js';

const NOTES = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
const hz = (m) => 440 * 2 ** ((m - 69) / 12);
/** « F#m » → { racine (0 à 11), notes de l'accord (demi-tons au-dessus de la racine) }. */
function accord(nom) {
  const [, n, q] = nom.match(/^([A-G][#b]?)(m?)$/);
  return { racine: NOTES[n], notes: q ? [0, 3, 7] : [0, 4, 7] };
}

// ---------------------------------------------------------------- Les airs
// Une mélodie : [note MIDI ou null (silence), durée en double-croches] ; 16 double-croches par mesure.
// Les accords : un par mesure, ou deux (« G A » : deux temps chacun).
const AIRS = {
  // Ré majeur, mélodie sur la gamme yo (ré mi fa# la si) : le sanctuaire sur la mer
  itsukushima: {
    gamme: [2, 4, 6, 7, 9, 11, 1], // ré majeur (pour la seconde voix)
    intro: ['D', 'D'],
    A: {
      accords: ['D', 'Bm', 'G', 'A', 'D', 'F#m', 'G A', 'D'],
      melodie: [
        [69, 4], [71, 2], [69, 2], [66, 4], [64, 4],
        [62, 4], [64, 2], [66, 2], [71, 8],
        [74, 4], [71, 2], [69, 2], [71, 4], [74, 4],
        [76, 6], [74, 2], [71, 8],
        [69, 4], [71, 2], [69, 2], [66, 2], [64, 2], [62, 4],
        [64, 4], [66, 4], [69, 4], [71, 4],
        [74, 6], [71, 2], [69, 4], [76, 4],
        [74, 12], [null, 4],
      ],
      fin2: [[74, 8], [76, 4], [78, 4]], // la dernière mesure de A', qui monte vers B
    },
    B: {
      accords: ['G', 'A', 'F#m', 'Bm', 'Em', 'A', 'G', 'A'],
      melodie: [
        [79, 4], [78, 2], [76, 2], [74, 8],
        [76, 4], [74, 2], [73, 2], [69, 8],
        [73, 4], [76, 4], [81, 6], [78, 2],
        [78, 4], [76, 2], [74, 2], [71, 8],
        [67, 4], [71, 4], [74, 6], [76, 2],
        [73, 4], [69, 4], [76, 8],
        [74, 4], [71, 4], [67, 4], [71, 4],
        [69, 8], [73, 4], [76, 4],
      ],
    },
    jour: { tempo: 104, lead: 'shakuhachi', arpege: 'koto', basse: 'pizz', nappe: true, batterie: 'taiko' },
    nuit: { tempo: 76, lead: 'boite', arpege: 'kotoDoux', basse: 'pizzDoux', nappe: true, batterie: null },
  },
  // Fa majeur, plus vif : l'île au double volcan
  aogashima: {
    gamme: [5, 7, 9, 10, 0, 2, 4], // fa majeur
    intro: ['F', 'C'],
    A: {
      accords: ['F', 'C', 'Dm', 'Bb', 'F', 'C', 'Bb C', 'F'],
      melodie: [
        [72, 4], [69, 2], [72, 2], [77, 6], [76, 2],
        [74, 4], [72, 4], [67, 8],
        [69, 2], [72, 2], [74, 4], [77, 4], [74, 4],
        [74, 6], [72, 2], [70, 8],
        [72, 4], [69, 2], [72, 2], [79, 6], [77, 2],
        [76, 4], [74, 4], [72, 4], [74, 4],
        [77, 6], [76, 2], [74, 4], [76, 4],
        [77, 12], [null, 4],
      ],
      fin2: [[77, 8], [79, 4], [81, 4]],
    },
    B: {
      accords: ['Dm', 'Am', 'Bb', 'F', 'Gm', 'C', 'Bb', 'C'],
      melodie: [
        [74, 3], [74, 1], [77, 4], [81, 8],
        [79, 4], [76, 4], [72, 8],
        [74, 3], [74, 1], [77, 4], [82, 6], [81, 2],
        [79, 4], [77, 4], [72, 8],
        [70, 4], [74, 4], [79, 6], [77, 2],
        [76, 4], [72, 4], [79, 8],
        [77, 4], [74, 4], [70, 4], [74, 4],
        [72, 8], [76, 4], [79, 4],
      ],
    },
    jour: { tempo: 126, lead: 'flute', arpege: 'marimba', basse: 'rebond', nappe: true, batterie: 'legere' },
    nuit: { tempo: 84, lead: 'boite', arpege: 'marimbaDoux', basse: 'pizzDoux', nappe: true, batterie: null },
  },
  // La mineur, la gamme des chants populaires (min'yō : la do ré mi sol) : le village au toit de chaume dans la montagne ;
  // la sasara (binzasara) et les baguettes de la kokiriko battent la mesure
  gokayama: {
    gamme: [9, 11, 0, 2, 4, 5, 7], // la mineur (pour la seconde voix)
    intro: ['Am', 'Am'],
    A: {
      accords: ['Am', 'C', 'G', 'Am', 'F', 'C', 'Dm G', 'Am'],
      melodie: [
        [76, 4], [74, 2], [72, 2], [69, 6], [72, 2],
        [74, 4], [72, 2], [69, 2], [67, 8],
        [67, 2], [69, 2], [72, 4], [74, 4], [76, 4],
        [74, 6], [72, 2], [69, 8],
        [72, 4], [74, 2], [76, 2], [79, 6], [76, 2],
        [74, 4], [76, 2], [74, 2], [72, 4], [69, 4],
        [67, 4], [69, 4], [72, 2], [69, 2], [67, 4],
        [69, 12], [null, 4],
      ],
      fin2: [[69, 8], [72, 4], [76, 4]],
    },
    B: {
      accords: ['F', 'C', 'Am', 'Em', 'F', 'G', 'Dm', 'Am'],
      melodie: [
        [81, 4], [79, 2], [76, 2], [79, 8],
        [76, 4], [74, 2], [72, 2], [74, 8],
        [72, 2], [74, 2], [76, 4], [79, 6], [76, 2],
        [74, 4], [72, 4], [76, 4], [74, 4],
        [72, 4], [69, 4], [72, 4], [74, 4],
        [76, 6], [74, 2], [72, 8],
        [69, 4], [72, 2], [74, 2], [72, 4], [69, 4],
        [67, 4], [69, 12],
      ],
    },
    jour: { tempo: 96, lead: 'shakuhachi', arpege: 'shamisen', basse: 'pizz', nappe: true, batterie: 'kokiriko' },
    nuit: { tempo: 72, lead: 'boite', arpege: 'kotoDoux', basse: 'pizzDoux', nappe: true, batterie: null },
  },
  // La mineur, une mélodie sur la gamme in (miyako-bushi : mi fa la si do, celle de « Sakura sakura ») : le château
  // blanc sous les cerisiers, noble et un peu mélancolique ; la flûte de bambou traversière (fue), le koto, le taiko
  himeji: {
    gamme: [9, 11, 0, 2, 4, 5, 7], // la mineur (pour la seconde voix)
    intro: ['Am', 'Am'],
    A: {
      accords: ['Am', 'F', 'Dm', 'E', 'Am', 'F', 'Dm E', 'Am'],
      melodie: [
        [76, 4], [77, 2], [76, 2], [72, 4], [71, 4],
        [72, 6], [69, 2], [65, 8],
        [69, 4], [72, 4], [74, 4], [77, 4],
        [76, 6], [74, 2], [71, 8],
        [76, 4], [77, 2], [76, 2], [81, 4], [83, 4],
        [84, 6], [83, 2], [81, 4], [77, 4],
        [77, 4], [74, 4], [76, 4], [71, 4],
        [69, 12], [null, 4],
      ],
      fin2: [[69, 8], [72, 4], [76, 4]],
    },
    B: {
      accords: ['F', 'G', 'Em', 'Am', 'Dm', 'E', 'F', 'E'],
      melodie: [
        [81, 4], [77, 4], [72, 8],
        [74, 4], [76, 2], [74, 2], [71, 8],
        [76, 4], [79, 4], [83, 8],
        [81, 6], [79, 2], [76, 8],
        [77, 4], [76, 2], [74, 2], [77, 4], [81, 4],
        [83, 6], [81, 2], [76, 8],
        [77, 4], [76, 2], [74, 2], [72, 4], [74, 4],
        [71, 8], [74, 4], [76, 4],
      ],
    },
    jour: { tempo: 88, lead: 'fue', arpege: 'koto', basse: 'pizz', nappe: true, batterie: 'taiko' },
    nuit: { tempo: 66, lead: 'boite', arpege: 'kotoDoux', basse: 'pizzDoux', nappe: true, batterie: null },
  },
  // Sol majeur, une mélodie sur la gamme ritsu (sol la do ré mi, sans demi-ton : celle de la musique des sanctuaires) : la
  // rivière émeraude au fond de sa gorge, le mythe de la grotte céleste ; des rythmes pointés, comme les coups de rame
  takachiho: {
    gamme: [7, 9, 11, 0, 2, 4, 6], // sol majeur (pour la seconde voix)
    intro: ['G', 'G'],
    A: {
      accords: ['G', 'Em', 'C', 'D', 'G', 'Em', 'Am D', 'G'],
      melodie: [
        [74, 6], [76, 2], [74, 4], [72, 4],
        [69, 6], [67, 2], [64, 8],
        [67, 4], [69, 4], [72, 6], [74, 2],
        [76, 6], [74, 2], [69, 8],
        [74, 6], [76, 2], [79, 4], [76, 4],
        [74, 6], [72, 2], [69, 8],
        [67, 4], [69, 4], [72, 4], [69, 4],
        [67, 12], [null, 4],
      ],
      fin2: [[67, 8], [69, 4], [72, 4]],
    },
    B: {
      accords: ['C', 'D', 'Em', 'Am', 'C', 'D', 'Em D', 'G'],
      melodie: [
        [79, 6], [81, 2], [79, 4], [76, 4],
        [74, 6], [76, 2], [74, 8],
        [76, 4], [79, 4], [81, 6], [79, 2],
        [76, 6], [74, 2], [72, 8],
        [72, 4], [74, 4], [76, 4], [79, 4],
        [81, 6], [79, 2], [76, 8],
        [74, 4], [76, 2], [74, 2], [72, 4], [69, 4],
        [67, 8], [69, 4], [74, 4],
      ],
    },
    jour: { tempo: 92, lead: 'fue', arpege: 'koto', basse: 'pizz', nappe: true, batterie: 'kagura' },
    nuit: { tempo: 68, lead: 'boite', arpege: 'kotoDoux', basse: 'pizzDoux', nappe: true, batterie: null },
  },
  // Mi bémol majeur, une mélodie sur la pentatonique majeure (mi♭ fa sol si♭ do) : le Pavillon d'or (2026-10-26), doré et
  // calme, un jardin zen ; la flûte des moines zen (shakuhachi), le koto, le bois du temple (mokugyo) et le bol de prière (rin)
  kinkakuji: {
    gamme: [3, 5, 7, 8, 10, 0, 2], // mi bémol majeur (pour la seconde voix)
    intro: ['Eb', 'Eb'],
    A: {
      accords: ['Eb', 'Cm', 'Ab', 'Bb', 'Eb', 'Gm', 'Ab Bb', 'Eb'],
      melodie: [
        [70, 4], [72, 2], [70, 2], [67, 8],
        [65, 4], [67, 4], [72, 6], [70, 2],
        [72, 4], [75, 4], [77, 4], [75, 4],
        [70, 12], [null, 4],
        [70, 4], [72, 2], [75, 2], [77, 6], [75, 2],
        [79, 4], [77, 4], [75, 4], [70, 4],
        [72, 4], [70, 2], [67, 2], [65, 4], [67, 4],
        [63, 12], [null, 4],
      ],
      fin2: [[63, 8], [67, 4], [70, 4]],
    },
    B: {
      accords: ['Ab', 'Bb', 'Gm', 'Cm', 'Ab', 'Bb', 'Gm Cm', 'Bb'],
      melodie: [
        [75, 6], [77, 2], [79, 8],
        [77, 4], [75, 4], [70, 8],
        [79, 4], [82, 4], [79, 6], [77, 2],
        [75, 12], [null, 4],
        [72, 4], [75, 4], [77, 6], [79, 2],
        [77, 6], [75, 2], [70, 8],
        [67, 4], [70, 4], [72, 4], [75, 4],
        [77, 8], [75, 4], [72, 4],
      ],
    },
    jour: { tempo: 84, lead: 'shakuhachi', arpege: 'koto', basse: 'pizzDoux', nappe: true, batterie: 'zen' },
    nuit: { tempo: 64, lead: 'boite', arpege: 'kotoDoux', basse: 'pizzDoux', nappe: true, batterie: null },
  },
  // Fa majeur, la gamme yo (fa sol la do ré) : Beppu (2026-10-27), la ville des sources chaudes, ses fumées et ses démons ;
  // un air de chanson populaire qui sautille, un peu malicieux, la flûte des fêtes, le shamisen, une basse qui rebondit
  beppu: {
    gamme: [5, 7, 9, 10, 0, 2, 4], // fa majeur (pour la seconde voix)
    intro: ['F', 'F'],
    A: {
      accords: ['F', 'Dm', 'Bb', 'C', 'F', 'Dm', 'Bb C', 'F'],
      melodie: [
        [72, 2], [74, 2], [72, 2], [69, 2], [67, 4], [65, 4],
        [67, 2], [69, 2], [72, 4], [74, 6], [72, 2],
        [77, 4], [74, 2], [72, 2], [69, 4], [72, 4],
        [74, 12], [null, 4],
        [72, 2], [74, 2], [72, 2], [69, 2], [67, 4], [69, 4],
        [72, 4], [77, 4], [74, 4], [72, 4],
        [69, 4], [67, 2], [65, 2], [67, 4], [69, 4],
        [65, 12], [null, 4],
      ],
      fin2: [[65, 8], [69, 4], [72, 4]],
    },
    B: {
      accords: ['Bb', 'C', 'Dm', 'Am', 'Bb', 'C', 'Dm C', 'C'],
      melodie: [
        [77, 6], [79, 2], [81, 8],
        [79, 4], [77, 4], [74, 8],
        [72, 4], [74, 4], [77, 6], [74, 2],
        [72, 12], [null, 4],
        [74, 4], [77, 4], [79, 6], [81, 2],
        [79, 6], [77, 2], [74, 8],
        [72, 4], [74, 2], [72, 2], [69, 4], [67, 4],
        [69, 8], [72, 4], [74, 4],
      ],
    },
    jour: { tempo: 108, lead: 'fue', arpege: 'shamisen', basse: 'rebond', nappe: true, batterie: 'taiko' },
    nuit: { tempo: 76, lead: 'boite', arpege: 'kotoDoux', basse: 'pizzDoux', nappe: true, batterie: null },
  },
  // Ré majeur, la gamme yo (ré mi sol la si) : l'air de la danse des fêtes d'été, sautillant (112 battements : la
  // danse du voyageur est réglée dessus, personnages.js)
  odori: {
    gamme: [2, 4, 7, 9, 11, 0, 6],
    intro: ['D', 'D'],
    A: {
      accords: ['D', 'G', 'D', 'G A', 'D', 'Bm', 'G A', 'A'],
      melodie: [
        [69, 2], [71, 2], [69, 2], [67, 2], [64, 4], [62, 4],
        [64, 2], [67, 2], [69, 4], [71, 4], [69, 4],
        [74, 4], [71, 2], [69, 2], [67, 4], [69, 4],
        [71, 6], [69, 2], [67, 8],
        [69, 2], [71, 2], [69, 2], [67, 2], [64, 4], [67, 4],
        [69, 4], [74, 4], [71, 4], [69, 4],
        [67, 4], [64, 2], [67, 2], [69, 4], [71, 4],
        [69, 12], [null, 4],
      ],
      fin2: [[62, 6], [64, 2], [67, 4], [69, 4]],
    },
    B: {
      accords: ['G', 'D', 'Em', 'D', 'G', 'Em', 'A', 'D'],
      melodie: [
        [74, 2], [74, 2], [76, 4], [74, 4], [71, 4],
        [69, 4], [71, 2], [74, 2], [71, 8],
        [67, 2], [69, 2], [71, 4], [74, 4], [76, 4],
        [74, 12], [null, 4],
        [71, 2], [74, 2], [71, 2], [69, 2], [67, 4], [64, 4],
        [67, 4], [69, 4], [71, 8],
        [69, 4], [67, 2], [64, 2], [62, 4], [64, 4],
        [62, 12], [null, 4],
      ],
    },
    jour: { tempo: 112, lead: 'fue', arpege: 'shamisen', basse: 'pizz', nappe: false, batterie: 'bon' },
  },
};

/**
 * Les notes d'un air pour un arrangement (jour ou nuit) : { intro, boucle } (listes d'évènements { b : temps
 * de début, d : durée en temps, i : instrument, m : note MIDI, v : force }), et leurs longueurs en temps.
 */
export function partition(lieu, moment) {
  const air = AIRS[lieu], arr = air[moment];
  const evts = (mesures, melodie, debut, seconde) => {
    const e = [];
    // la mélodie (et, dans A', une seconde voix une tierce en dessous, dans la gamme)
    let b = debut;
    for (const [m, d] of melodie || []) {
      if (m !== null) {
        e.push({ b, d: (d / 4) * 0.92, i: arr.lead, m, v: 1 });
        if (seconde) {
          const k = air.gamme.indexOf(m % 12);
          if (k >= 0) {
            const sous = air.gamme[(k + 5) % 7];
            e.push({ b, d: (d / 4) * 0.92, i: arr.lead, m: m - ((m % 12) - sous + 12) % 12, v: 0.45 });
          }
        }
      }
      b += d / 4;
    }
    // l'accompagnement, mesure par mesure
    mesures.forEach((nom, k) => {
      const t0 = debut + k * 4;
      const parties = nom.split(' ').map(accord);
      parties.forEach((a, p) => {
        const tp = t0 + (p * 4) / parties.length, long = 4 / parties.length;
        const r = a.racine;
        // la nappe de cordes : l'accord tenu, vers le do3–do4
        if (arr.nappe) for (const n of a.notes) e.push({ b: tp, d: long * 0.98, i: 'cordes', m: 55 + ((r + n - 7 + 12) % 12), v: 1 });
        // la basse
        const bas = 38 + ((r - 2 + 12) % 12);
        const motifs = {
          pizz: [[0, 1.5, 0], [1.5, 0.5, 0], [2, 1, 7], [3, 1, 12]],
          pizzDoux: [[0, 2, 0], [2, 2, 7]],
          rebond: [[0, 0.5, 0], [1, 0.5, 0], [1.5, 0.5, 12], [2, 0.5, 7], [3, 0.5, 0], [3.5, 0.5, 7]],
        };
        for (const [o, d, n] of motifs[arr.basse]) if (o < long) e.push({ b: tp + o, d, i: arr.basse.startsWith('pizz') ? 'pizz' : 'basse', m: bas + n, v: arr.basse === 'pizzDoux' ? 0.6 : 1 });
        // l'arpège (koto) ou les accords en contretemps (marimba)
        const haut = 62 + ((r - 2 + 12) % 12);
        if (arr.arpege === 'koto' || arr.arpege === 'kotoDoux') {
          const degres = [0, 7, 12, a.notes[1] + 12, 19, 12, a.notes[1] + 12, 7];
          const pas = arr.arpege === 'koto' ? 0.5 : 1;
          for (let o = 0, j = 0; o < long; o += pas, j++) e.push({ b: tp + o, d: pas, i: 'koto', m: haut - 12 + degres[(j * (pas === 1 ? 2 : 1)) % 8], v: arr.arpege === 'koto' ? (j % 2 ? 0.7 : 1) : 0.75 });
        } else if (arr.arpege === 'marimba') {
          for (let o = 0.5; o < long; o += 1) for (const n of a.notes) e.push({ b: tp + o, d: 0.4, i: 'marimba', m: haut + n - (n > 4 ? 12 : 0), v: 0.8 });
        } else if (arr.arpege === 'shamisen') {
          // le shamisen : des accords pincés à contretemps (« chan, chan »), et la fondamentale sur le temps
          for (let o = 0; o < long; o += 1) {
            e.push({ b: tp + o, d: 0.3, i: 'shamisen', m: haut - 12, v: 0.8 });
            for (const n of [a.notes[1], 7]) e.push({ b: tp + o + 0.5, d: 0.25, i: 'shamisen', m: haut + n - 12, v: 0.6 });
          }
        } else if (arr.arpege === 'marimbaDoux') {
          const degres = [0, 7, 12, a.notes[1] + 12];
          for (let o = 0, j = 0; o < long; o += 1, j++) e.push({ b: tp + o, d: 1, i: 'marimba', m: haut + degres[j % 4] - 12, v: 0.55 });
        }
      });
      // la percussion, par mesure
      if (arr.batterie === 'taiko') {
        e.push({ b: t0, i: 'taiko', v: 1 }, { b: t0 + 2, i: 'taiko', v: 0.55 }, { b: t0 + 3.5, i: 'bois', v: 0.6 });
        for (let o = 0; o < 4; o += 0.5) e.push({ b: t0 + o, i: 'shaker', v: o % 1 ? 1 : 0.6 });
      } else if (arr.batterie === 'bon') {
        // le grand tambour des fêtes : « don, don-don, ka » ; la clochette de cuivre (« chan-chiki ») sur chaque temps
        e.push({ b: t0, i: 'taiko', v: 1 }, { b: t0 + 1.5, i: 'taiko', v: 0.6 }, { b: t0 + 2, i: 'taiko', v: 0.85 }, { b: t0 + 3, i: 'bois', v: 0.9 });
        for (let o = 0; o < 4; o += 1) e.push({ b: t0 + o, i: 'kane', v: 0.9 }, { b: t0 + o + 0.5, i: 'kane', v: 0.45 });
      } else if (arr.batterie === 'kokiriko') {
        // la kokiriko : un coup de tambour sur le premier et le troisième temps, la sasara qui claque sur le deuxième et
        // le quatrième (« jararan »), les baguettes de bambou à contretemps
        e.push({ b: t0, i: 'taiko', v: 0.75 }, { b: t0 + 2, i: 'taiko', v: 0.45 });
        for (const o of [1, 3]) e.push({ b: t0 + o, i: 'sasara', v: 1 });
        for (const o of [0.5, 1.5, 2.5, 3.5]) e.push({ b: t0 + o, i: 'bois', v: 0.4 });
      } else if (arr.batterie === 'kagura') {
        // le kagura : le grand tambour sur le premier temps (et un écho sur le « et » du troisième), les grelots (suzu)
        // secoués sur le deuxième et le quatrième, le bois à contretemps
        e.push({ b: t0, i: 'taiko', v: 0.85 }, { b: t0 + 2.5, i: 'taiko', v: 0.45 });
        for (const o of [1, 3]) e.push({ b: t0 + o, i: 'suzu', v: 1 });
        for (const o of [1.5, 3.5]) e.push({ b: t0 + o, i: 'bois', v: 0.4 });
      } else if (arr.batterie === 'zen') {
        // le temple zen (le Pavillon d'or) : le bois du temple (mokugyo) sur le premier et le troisième temps, doux ; le bol de
        // prière (rin) une mesure sur deux
        e.push({ b: t0, i: 'bois', v: 0.32 }, { b: t0 + 2, i: 'bois', v: 0.2 });
        if (k % 2 === 0) e.push({ b: t0, i: 'kane', v: 0.55 });
      } else if (arr.batterie === 'legere') {
        e.push({ b: t0, i: 'grosse', v: 1 }, { b: t0 + 1.5, i: 'grosse', v: 0.5 }, { b: t0 + 2, i: 'grosse', v: 0.9 });
        e.push({ b: t0 + 1, i: 'caisse', v: 1 }, { b: t0 + 3, i: 'caisse', v: 1 });
        for (let o = 0; o < 4; o += 0.5) e.push({ b: t0 + o, i: 'shaker', v: o % 1 ? 1 : 0.55 });
      }
    });
    return e;
  };
  const nA = air.A.accords.length * 4, nB = air.B.accords.length * 4;
  const A2 = air.A.melodie.slice();
  // A' : la même, sauf sa dernière mesure (16 double-croches à la fin), qui monte vers B
  let reste = 16;
  while (reste > 0) reste -= A2.pop()[1];
  A2.push(...air.A.fin2);
  const intro = evts(air.intro, null, 0, false);
  // un petit appel de percussion à la fin de l'introduction
  if (arr.batterie) { const appel = arr.batterie === 'legere' ? 'grosse' : arr.batterie === 'zen' ? 'kane' : 'taiko'; intro.push({ b: air.intro.length * 4 - 1, i: appel, v: 0.7 }, { b: air.intro.length * 4 - 0.5, i: appel, v: 0.8 }); }
  const boucle = [...evts(air.A.accords, air.A.melodie, 0, false), ...evts(air.A.accords, A2, nA, true), ...evts(air.B.accords, air.B.melodie, 2 * nA, false)];
  const tri = (l) => l.sort((p, q) => p.b - q.b);
  return { tempo: arr.tempo, intro: tri(intro), boucle: tri(boucle), tempsIntro: air.intro.length * 4, tempsBoucle: 2 * nA + nB };
}

// ---------------------------------------------------------------- Les instruments
// la musique un peu sous le bruitage (mesuré : environ −29 LUFS le jour, −31 la nuit, quand on marche le bruitage
// est vers −26) ; l'air de nuit, plus dépouillé, est plus fort d'autant
const VOLUME = { jour: 0.125, nuit: 0.26, fete: 0.13 };
const NIVEAU = {
  shakuhachi: 0.16, flute: 0.15, boite: 0.11, koto: 0.085, marimba: 0.075, pizz: 0.2, basse: 0.13, cordes: 0.018,
  taiko: 0.42, grosse: 0.3, caisse: 0.05, shaker: 0.018, bois: 0.05, fue: 0.11, shamisen: 0.09, kane: 0.035, sasara: 0.1, suzu: 0.028,
};
const PLACE = { koto: -0.3, marimba: 0.3, shaker: 0.35, bois: -0.25, cordes: 0, pizz: -0.1, basse: 0, shamisen: -0.3, kane: 0.35, sasara: 0.3, suzu: 0.32 };

export function creerMusique(lieu) {
  let ctx = null, sortie = null, reverbe = null, bruit = null, ondes = {};
  let actif = true, coupe = false, moment = null, p = null, lecture = null, minuterie = null, attenue = 1, fete = false;
  try { actif = localStorage.getItem('baladeMusique') !== 'non'; } catch { /* navigation privée */ }

  /** Au premier moment où le son joue : la sortie, une réverbération (une salle douce), un peu de bruit blanc. */
  function preparer(a) {
    ctx = a;
    sortie = ctx.createGain();
    sortie.gain.value = 0;
    sortie.connect(son.sortie());
    const sr = ctx.sampleRate, n = Math.floor(sr * 2.2), ir = ctx.createBuffer(2, n, sr);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sr * 0.45)) * (i < sr * 0.012 ? 0 : 1);
    }
    reverbe = ctx.createConvolver();
    reverbe.buffer = ir;
    const retour = ctx.createGain();
    retour.gain.value = 0.32;
    reverbe.connect(retour).connect(sortie);
    bruit = ctx.createBuffer(1, sr, sr);
    const d = bruit.getChannelData(0);
    for (let i = 0; i < sr; i++) d[i] = Math.random() * 2 - 1;
    // des timbres faits d'harmoniques : le koto (pincé, brillant), la boîte à musique (cloche)
    const onde = (h) => ctx.createPeriodicWave(new Float32Array(h.length + 1), new Float32Array([0, ...h]));
    ondes = { koto: onde([1, 0.55, 0.38, 0.22, 0.14, 0.09, 0.05]), basse: onde([1, 0.35, 0.12, 0.05]) };
  }

  /** La sortie d'un instrument (faite une fois) : sa place (gauche-droite), et une part vers la réverbération. */
  const voies = {};
  function voie(i) {
    if (voies[i]) return voies[i];
    const g = ctx.createGain();
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (pan) pan.pan.value = PLACE[i] || 0;
    const vers = pan ? (g.connect(pan), pan) : g;
    vers.connect(sortie);
    const envoi = ctx.createGain();
    envoi.gain.value = i === 'taiko' || i === 'grosse' || i === 'basse' ? 0.12 : 0.45;
    vers.connect(envoi).connect(reverbe);
    return (voies[i] = g);
  }
  const osc = (type, f, t) => {
    const o = ctx.createOscillator();
    if (ondes[type]) o.setPeriodicWave(ondes[type]); else o.type = type;
    o.frequency.setValueAtTime(f, t);
    return o;
  };
  const souffle = (t, d, f, q, v, vers) => {
    const s = ctx.createBufferSource(), filtre = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = bruit;
    filtre.type = 'bandpass'; filtre.frequency.value = f; filtre.Q.value = q;
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(filtre).connect(g).connect(vers);
    s.start(t, Math.random() * 0.5);
    s.stop(t + d + 0.02);
  };

  /** Une note (ou un coup) à l'instant t (secondes du contexte), de durée d (secondes). */
  function jouer(i, t, d, m, v) {
    const vers = voie(i), niveau = NIVEAU[i] * v;
    const env = ctx.createGain();
    env.connect(vers);
    const fin = (o, f) => { o.connect(env); o.start(t); o.stop(t + f); };
    const f = m ? hz(m) : 0;
    switch (i) {
      case 'fue': {
        // la flûte de fête (shinobue), une octave plus haut : claire, un vibrato rapide, beaucoup de souffle
        const o1 = osc('sine', f * 2, t), o2 = osc('triangle', f * 2, t), g2 = ctx.createGain();
        g2.gain.value = 0.18;
        o1.frequency.setValueAtTime(f * 2 * 0.985, t); o1.frequency.linearRampToValueAtTime(f * 2, t + 0.04);
        const lfo = osc('sine', 6.4, t), prof = ctx.createGain();
        prof.gain.setValueAtTime(0, t);
        prof.gain.linearRampToValueAtTime(f * 2 * 0.008, t + Math.min(0.25, d * 0.6));
        lfo.connect(prof); prof.connect(o1.frequency); prof.connect(o2.frequency);
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(niveau, t + 0.03);
        env.gain.setValueAtTime(niveau * 0.9, t + Math.max(0.04, d - 0.06));
        env.gain.linearRampToValueAtTime(0, t + d + 0.08);
        o2.connect(g2).connect(env);
        o2.start(t); o2.stop(t + d + 0.12);
        lfo.start(t); lfo.stop(t + d + 0.12);
        fin(o1, d + 0.12);
        souffle(t, 0.09, f * 4, 2.5, niveau * 0.4, vers);
        break;
      }
      case 'shamisen': {
        // le shamisen : une corde pincée sèche, brillante, avec son bourdonnement (le « sawari »), vite éteinte
        const o = osc('sawtooth', f, t), filtre = ctx.createBiquadFilter();
        filtre.type = 'bandpass'; filtre.Q.value = 1.4;
        filtre.frequency.setValueAtTime(Math.min(8000, f * 6), t);
        filtre.frequency.exponentialRampToValueAtTime(f * 2, t + 0.18);
        o.connect(filtre).connect(env);
        env.gain.setValueAtTime(niveau, t);
        env.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
        o.start(t); o.stop(t + 0.5);
        souffle(t, 0.02, 3000, 1, niveau * 0.6, vers);
        break;
      }
      case 'kane': {
        // la clochette de cuivre qu'on frappe (atarigane) : des harmoniques qui ne tombent pas juste, très brèves
        for (const [k, g] of [[1, 1], [2.76, 0.6], [5.4, 0.35]]) {
          const o = osc('sine', 2200 * k, t), gk = ctx.createGain();
          gk.gain.setValueAtTime(niveau * g, t);
          gk.gain.exponentialRampToValueAtTime(0.0001, t + 0.12 / k ** 0.3);
          o.connect(gk).connect(vers);
          o.start(t); o.stop(t + 0.15);
        }
        break;
      }
      case 'shakuhachi': case 'flute': {
        // une flûte : une sinusoïde et un peu de triangle, un vibrato qui vient après l'attaque, un souffle ;
        // la flûte de bambou glisse vers sa note
        const o1 = osc('sine', f, t), o2 = osc('triangle', f, t), g2 = ctx.createGain();
        g2.gain.value = i === 'flute' ? 0.22 : 0.12;
        if (i === 'shakuhachi') { o1.frequency.setValueAtTime(f * 0.97, t); o1.frequency.linearRampToValueAtTime(f, t + 0.07); o2.frequency.setValueAtTime(f * 0.97, t); o2.frequency.linearRampToValueAtTime(f, t + 0.07); }
        const lfo = osc('sine', 5.2, t), prof = ctx.createGain();
        prof.gain.setValueAtTime(0, t);
        prof.gain.linearRampToValueAtTime(f * 0.006, t + Math.min(0.35, d * 0.6));
        lfo.connect(prof); prof.connect(o1.frequency); prof.connect(o2.frequency);
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(niveau, t + 0.045);
        env.gain.setValueAtTime(niveau * 0.9, t + Math.max(0.05, d - 0.08));
        env.gain.linearRampToValueAtTime(0, t + d + 0.1);
        o2.connect(g2).connect(env);
        o2.start(t); o2.stop(t + d + 0.15);
        lfo.start(t); lfo.stop(t + d + 0.15);
        fin(o1, d + 0.15);
        souffle(t, i === 'shakuhachi' ? 0.16 : 0.07, f * 2, 2, niveau * (i === 'shakuhachi' ? 0.5 : 0.25), vers);
        break;
      }
      case 'boite': {
        // la boîte à musique : une lame frappée, qui sonne longtemps (avec son harmonique aigu, bref)
        const o1 = osc('sine', f * 2, t), o2 = osc('sine', f * 6, t), g2 = ctx.createGain();
        g2.gain.setValueAtTime(niveau * 0.35, t);
        g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
        o2.connect(g2).connect(vers);
        o2.start(t); o2.stop(t + 0.3);
        env.gain.setValueAtTime(niveau, t);
        env.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
        fin(o1, 1.65);
        break;
      }
      case 'koto': {
        // une corde pincée : brillante à l'attaque, puis le son s'assombrit et s'éteint
        const o = osc('koto', f * 1.006, t), filtre = ctx.createBiquadFilter();
        o.frequency.exponentialRampToValueAtTime(f, t + 0.04);
        filtre.type = 'lowpass';
        filtre.frequency.setValueAtTime(Math.min(9000, f * 7), t);
        filtre.frequency.exponentialRampToValueAtTime(f * 1.6, t + 0.5);
        o.connect(filtre);
        env.gain.setValueAtTime(niveau, t);
        env.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
        filtre.connect(env);
        o.start(t); o.stop(t + 1.35);
        break;
      }
      case 'marimba': {
        // une lame de bois : la note et son harmonique (×4), qui s'éteint très vite
        const o1 = osc('sine', f, t), o2 = osc('sine', f * 4, t), g2 = ctx.createGain();
        g2.gain.setValueAtTime(niveau * 0.3, t);
        g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
        o2.connect(g2).connect(vers);
        o2.start(t); o2.stop(t + 0.1);
        env.gain.setValueAtTime(niveau, t);
        env.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
        fin(o1, 0.6);
        break;
      }
      case 'pizz': case 'basse': {
        const o = osc(i === 'pizz' ? 'triangle' : 'basse', f, t), filtre = ctx.createBiquadFilter();
        filtre.type = 'lowpass'; filtre.frequency.value = i === 'pizz' ? 900 : 700;
        o.connect(filtre).connect(env);
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(niveau, t + 0.01);
        env.gain.exponentialRampToValueAtTime(niveau * 0.25, t + Math.min(d, 0.35));
        env.gain.linearRampToValueAtTime(0, t + d + 0.05);
        o.start(t); o.stop(t + d + 0.08);
        break;
      }
      case 'cordes': {
        // deux dents de scie un peu désaccordées, adoucies : une nappe de cordes
        const filtre = ctx.createBiquadFilter();
        filtre.type = 'lowpass'; filtre.frequency.value = 1300; filtre.Q.value = 0.4;
        filtre.connect(env);
        for (const dt of [-6, 6]) {
          const o = osc('sawtooth', f, t);
          o.detune.value = dt;
          o.connect(filtre);
          o.start(t); o.stop(t + d + 0.7);
        }
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(niveau, t + 0.4);
        env.gain.setValueAtTime(niveau, t + d);
        env.gain.linearRampToValueAtTime(0, t + d + 0.6);
        break;
      }
      case 'taiko': case 'grosse': {
        const o = osc('sine', i === 'taiko' ? 105 : 120, t);
        o.frequency.exponentialRampToValueAtTime(i === 'taiko' ? 58 : 48, t + (i === 'taiko' ? 0.25 : 0.12));
        env.gain.setValueAtTime(niveau, t);
        env.gain.exponentialRampToValueAtTime(0.0001, t + (i === 'taiko' ? 0.7 : 0.3));
        fin(o, 0.75);
        souffle(t, 0.05, i === 'taiko' ? 300 : 900, 1, niveau * 0.35, vers);
        break;
      }
      case 'caisse': {
        souffle(t, 0.14, 2200, 0.8, niveau, vers);
        const o = osc('triangle', 190, t);
        env.gain.setValueAtTime(niveau * 0.8, t);
        env.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
        fin(o, 0.08);
        break;
      }
      case 'shaker': souffle(t, 0.05, 7500, 1.2, niveau, vers); break;
      case 'suzu': {
        // les grelots du kagura (suzu) : une grappe de petites cloches qu'on secoue, des notes aiguës qui ne tombent pas
        // juste et tremblent, en deux secousses
        for (const t1 of [t, t + 0.06]) {
          for (let k = 0; k < 6; k++) {
            const o = osc('sine', 3150 * (1 + k * 0.137 + Math.random() * 0.02), t1), gk = ctx.createGain();
            gk.gain.setValueAtTime(niveau * (1 - k * 0.12) * (t1 > t ? 0.6 : 1), t1);
            gk.gain.exponentialRampToValueAtTime(0.0001, t1 + 0.32);
            o.connect(gk).connect(vers);
            o.start(t1); o.stop(t1 + 0.35);
          }
        }
        souffle(t, 0.03, 6000, 1.5, niveau * 0.6, vers);
        break;
      }
      case 'sasara': {
        // la binzasara : des lamelles de bois qui claquent les unes contre les autres, en cascade (« jararan »)
        for (let k = 0; k < 9; k++) souffle(t + k * 0.0095 + Math.random() * 0.004, 0.02, 2400 + Math.random() * 2000, 3, niveau * (1 - k / 11), vers);
        break;
      }
      case 'bois': {
        const o = osc('sine', 1250, t);
        env.gain.setValueAtTime(niveau, t);
        env.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
        fin(o, 0.07);
        break;
      }
    }
  }

  // ---------------------------------------------------------------- La lecture (en avance de 0,35 s)
  const AVANCE = 0.35;
  /** Commence l'air de ce moment (jour ou nuit) : l'introduction (sauf avec intro: false), puis la boucle. */
  function commencer(m, { intro = true } = {}) {
    moment = m;
    p = m === 'fete' ? partition('odori', 'jour') : partition(lieu, m);
    lecture = { phase: intro ? 'intro' : 'boucle', i: 0, t0: ctx.currentTime + 0.15 };
    sortie.gain.cancelScheduledValues(ctx.currentTime);
    sortie.gain.setTargetAtTime(VOLUME[m] * attenue, ctx.currentTime, 0.4);
    clearInterval(minuterie);
    minuterie = setInterval(avancer, 60);
    avancer();
  }
  function avancer() {
    if (!lecture || ctx.state !== 'running') return;
    const spb = 60 / p.tempo, maintenant = ctx.currentTime;
    for (let n = 0; n < 200; n++) {
      const liste = lecture.phase === 'intro' ? p.intro : p.boucle;
      if (lecture.i >= liste.length) {
        lecture.t0 += (lecture.phase === 'intro' ? p.tempsIntro : p.tempsBoucle) * spb;
        lecture.phase = 'boucle';
        lecture.i = 0;
        continue;
      }
      const e = liste[lecture.i], t = lecture.t0 + e.b * spb;
      if (t > maintenant + AVANCE) break;
      // (en retard après une page lente : la note est sautée plutôt que jouée en paquet)
      if (t > maintenant - 0.05) jouer(e.i, t, (e.d || 0.25) * spb, e.m, e.v);
      lecture.i++;
    }
  }
  function arreter(apres) {
    clearInterval(minuterie);
    minuterie = null;
    lecture = null;
    if (sortie) {
      sortie.gain.cancelScheduledValues(ctx.currentTime);
      sortie.gain.setTargetAtTime(0, ctx.currentTime, 0.35);
    }
    if (apres) setTimeout(apres, 1400);
  }

  return {
    actif: () => actif,
    /** La musique (oui) ou pas (non), depuis le menu. */
    regler(oui) {
      actif = oui;
      try { localStorage.setItem('baladeMusique', oui ? 'oui' : 'non'); } catch { /* navigation privée */ }
      if (!oui) { arreter(); moment = null; }
    },
    /**
     * Plusieurs fois par seconde : nuit de 0 à 1 ; baisse (1 : le volume normal ; moins : près d'autres musiciens,
     * la scène de nō). Commence la musique dès que le son joue ; change d'air au crépuscule.
     */
    maj(nuit, baisse = 1) {
      const pret = son.pret();
      if (!pret || !actif || coupe || fete) return;
      if (!ctx) preparer(pret);
      if (lecture && Math.abs(baisse - attenue) > 0.02) {
        attenue = baisse;
        sortie.gain.setTargetAtTime(VOLUME[moment] * attenue, ctx.currentTime, 0.5);
      }
      const voulu = nuit > 0.5 ? 'nuit' : 'jour';
      if (!lecture && moment === null) commencer(voulu);
      else if (lecture && voulu !== moment) {
        moment = voulu;
        arreter(() => { if (!coupe && actif) commencer(voulu, { intro: false }); });
      }
    },
    /**
     * L'air de la fête (oui : on danse), ou le retour à l'air du lieu. Renvoie l'instant (secondes du contexte audio)
     * où commence le premier temps de la danse, pour danser en mesure (ou null : sans musique).
     */
    fete(oui) {
      fete = oui;
      const pret = son.pret();
      if (!pret || !actif || coupe) return null;
      if (!ctx) preparer(pret);
      if (oui) {
        clearInterval(minuterie);
        sortie.gain.cancelScheduledValues(ctx.currentTime);
        sortie.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
        attenue = 1;
        // (l'introduction : deux mesures ; la danse commence avec la boucle)
        setTimeout(() => { if (fete) commencer('fete'); }, 300);
        return 0.3 + 0.15 + (2 * 4 * 60) / 112;
      }
      arreter(() => { if (!fete && !coupe && actif) commencer(moment === 'fete' || !moment ? 'jour' : moment, { intro: false }); });
      moment = 'jour';
      return null;
    },
    /** Le silence pendant la vidéo (oui), puis la reprise au début de la boucle. */
    couper(oui) {
      if (oui === coupe) return;
      coupe = oui;
      if (!ctx) return;
      if (oui) arreter();
      else if (actif && moment) commencer(moment, { intro: false });
    },
  };
}
