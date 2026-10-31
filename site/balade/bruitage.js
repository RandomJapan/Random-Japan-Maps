// ================================================================
//  Le bruitage de la balade : ce qu'on entend en marchant. Les sons sont fabriqués une fois par
//  bruitage-calcul.js (dans un worker, après le premier geste : un tiers de seconde de calcul, à côté du
//  jeu) ; ici, on les joue.
//  - pas(sol, o) : un pas, selon le sol (le joueur ; ou le compagnon, plus léger et plus vif) ; ebrouer(o) : le
//    compagnon s'ébroue ; cri(espece, o) : son cri (quand on le choisit) ; tambour(o) : le tanuki se tape le
//    ventre ; pouf(o) : un compagnon s'en va dans un nuage ;
//  - ambiance(a, dt), plusieurs fois par seconde : le vent (sa force là où l'on est : la même rafale que celle
//    qui fait bouger les arbres et l'herbe, styles.js), les feuilles s'il y a des arbres autour, la mer près
//    du rivage, les fumerolles, les insectes la nuit, la musique de la scène de nō ; et de temps en temps un
//    oiseau ; oiseau(nom, o) : le cri
//    d'un oiseau qu'on voit (les mouettes, les grives d'Aogashima) ; bete(nom, o) : un chat qui miaule, qui ronronne ;
//  - couper(oui) : le silence (pendant la vidéo TikTok) ;
//  - les trésors (2026-10-23) : sons(liste) fabrique des sons de plus quand il le faut (les feux d'artifice, la
//    pelle…) ; feu(nom, o) : une fusée, un éclat (avec le retard du son : delai), les mille éclats ; jouerSon(nom, o).
//  Rien ne sonne avant le premier geste, ni le son coupé (son.js).
// ================================================================
import { son } from './son.js';
import { SOLS, fabriquer } from './bruitage-calcul.js';

const VARIANTES = 5;
// les volumes : les pas et les oiseaux sortent de bruitage-calcul.js à une force fixe, les boucles à une
// valeur efficace de 1 (un pas en marchant est un peu plus doux qu'un bip du dialogue ; le vent calme, à peine).
// Le 2026-10-22, le propriétaire trouvait l'ambiance trop présente sous la musique, le vent surtout : le vent
// −6 dB, les autres boucles −3 dB, les pas −2 dB. Mesuré : l'ambiance seule 3,5 dB (Itsukushima) à 7 dB
// (Aogashima) sous la musique, à −29 LUFS ; en marchant, à peu près au niveau de la musique. Le 2026-10-23, le
// bruissement des arbres qui bougent au vent était encore trop fort : les feuilles −12 dB
const V = {
  pas: 0.14, course: 0.2, kon: 0.045, ebrouer: 0.1, oiseau: 0.045, mouette: 0.05, akakokko: 0.04, cri: 0.07, tambour: 0.03, pouf: 0.08,
  miaou: 0.05, ronron: 0.07, corbeau: 0.06, pelle: 0.09, boite: 0.09, depart: 0.035, boum: 0.16, crepite: 0.05,
  ventDoux: [0.0035, 0.006], ventFort: 0.015, feuilles: [0.00075, 0.0043], vagues: 0.0085, vapeur: 0.02, insectes: 0.0056,
  no: 0.0085,
  // Gokayama (2026-10-23) : la rivière en bas de sa gorge, le ruisseau du village, les grenouilles des rizières, la
  // kokiriko (comme le nō) ; le héron, le chien ; la planche creuse, les canons à eau, le papier, la cloche, les mains.
  // (2026-10-24 : le ruisseau refait, un peu moins fort, et entendu moins loin : balade.js)
  riviere: 0.011, ruisseau: 0.007, grenouilles: 0.006, kokiriko: 0.0085, aosagi: 0.05, ouaf: 0.06,
  creux: 0.12, jets: 0.1, papier: 0.08, cloche: 0.07, claque: 0.1,
  // Takachiho (2026-10-25) : la cascade de Manai, les grenouilles kajika de la rivière la nuit, le kagura (comme le nō) ;
  // les coups de rame, le coq, une pierre posée sur une autre, la porte de pierre qui roule, les nouilles aspirées
  cascade: 0.013, kajika: 0.0065, kagura: 0.0085, rame: 0.06, coq: 0.07, caillou: 0.11, roc: 0.15, slurp: 0.08,
  // Kinkaku-ji (2026-10-26) : les cigales de l'été (le jour, plus fort sous les arbres) ; la pièce lancée, la vasque, le
  // gravier ; le fouet du matcha, le pinceau, les sceaux ; le gong de la salle de Fudō
  semi: 0.004, piece: 0.07, bol: 0.09, tombe: 0.08, chasen: 0.08, pinceau: 0.07, tampon: 0.1, waniguchi: 0.09,
  // (Beppu) la grosse bulle de boue, le four à vapeur ; le ronflement du démon et le geyser (oiseau())
  bulle: 0.1, pschitt: 0.07, ronfle: 0.09, geyser: 0.1,
  // (Motonosumi) le souffle du dragon (oiseau()), la pièce dans le tronc de bois
  shiofuki: 0.11, saisen: 0.1,
  // (Yakushima) le « kuu » des singes (oiseau())
  singe: 0.045,
};
const lisse = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

/**
 * oiseaux : ceux qu'on peut entendre dans ce lieu ('milan', 'uguisu' ; 'mouette', 'akakokko' : seulement quand on
 * les voit crier, oiseau()) ; ambiances : ses boucles en plus du
 * vent et des feuilles ('vagues', 'vapeur', 'insectes') : seulement celles du lieu (elles pèsent quelques
 * mégaoctets en mémoire) ; betes : les cris de ses bêtes ('miaou', 'ronron').
 */
export function creerBruitage({ oiseaux = [], ambiances = [], betes = [], extras = [] } = {}) {
  let ctx = null, sortie = null, commence = false, coupe = false, travailleur = null, recevoir = null, surPlace = null;
  const enAttente = [];
  const tampons = new Map(); // « pas/herbe/2 » → AudioBuffer
  const boucles = {}; // nom → { g (volume), p (gauche-droite) }
  const derniers = {}; // sol → dernière variante jouée (jamais deux fois la même de suite)
  const actuel = { vent: 0.3, feuilles: 0, vagues: 0, panVagues: 0, vapeur: 0, panVapeur: 0, nuit: 0, oiseau: null, no: 0, panNo: 0, eauSon: 'vagues', scene: 'no', ruisseau: 0, panRuisseau: 0, grenouilles: 0, grenouilleSon: 'grenouilles', cascade: 0, panCascade: 0, semi: 0 };
  let prochainOiseau = 18 + Math.random() * 20;

  /** Au premier moment où le son joue : la sortie, puis la fabrication de tous les sons. */
  function commencer(a) {
    commence = true;
    ctx = a;
    sortie = ctx.createGain();
    sortie.connect(son.sortie());
    // (les cris d'abord : le choix du compagnon les fait entendre dès le départ)
    const sr = ctx.sampleRate, liste = ['cri/kon', 'cri/pon', 'cri/chapu', 'cri/gao', 'cri/fuwa', 'cri/saya', 'pouf', 'tambour'];
    for (const sol of Object.keys(SOLS)) for (let v = 0; v < VARIANTES; v++) liste.push(`pas/${sol}/${v}`);
    liste.push('boucle/ventDoux', 'boucle/ventFort', 'boucle/feuilles', 'ebrouer', ...ambiances.map((a) => `boucle/${a}`), ...oiseaux.map((o) => `oiseau/${o}`), ...betes.map((b) => `bete/${b}`), ...extras, ...enAttente.splice(0));
    recevoir = ({ quoi, canaux }) => {
      if (!canaux) return;
      const b = ctx.createBuffer(canaux.length, canaux[0].length, sr);
      canaux.forEach((c, i) => b.copyToChannel(c, i));
      tampons.set(quoi, b);
      if (quoi.startsWith('boucle/')) lancerBoucle(quoi.slice(7), b);
    };
    // sans worker (ou s'il échoue) : un son à la fois, entre deux images
    surPlace = (reste) => {
      const quoi = reste.shift();
      if (!quoi) return;
      try { recevoir({ quoi, canaux: fabriquer(quoi, sr) }); } catch { /* ce son-là manquera */ }
      setTimeout(() => surPlace(reste), 30);
    };
    try {
      const w = new Worker(new URL('./bruitage-calcul.js', import.meta.url), { type: 'module' });
      w.onmessage = (e) => recevoir(e.data);
      w.onerror = () => { w.terminate(); travailleur = null; surPlace(liste.filter((q) => !tampons.has(q))); };
      w.postMessage({ sr, liste });
      travailleur = w;
    } catch {
      surPlace(liste);
    }
  }
  /** Fabrique des sons de plus (s'ils ne le sont pas déjà) ; avant le premier son, ils attendent la liste du départ. */
  function sons(liste) {
    const manque = liste.filter((q) => !tampons.has(q));
    if (!manque.length) return;
    if (!commence) { enAttente.push(...manque); return; }
    if (travailleur) travailleur.postMessage({ sr: ctx.sampleRate, liste: manque });
    else surPlace?.(manque);
  }

  function lancerBoucle(nom, b) {
    const s = ctx.createBufferSource();
    s.buffer = b;
    s.loop = true;
    const g = ctx.createGain();
    g.gain.value = 0;
    const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    s.connect(g);
    (p ? g.connect(p) : g).connect(sortie);
    s.start(0, Math.random() * b.duration);
    boucles[nom] = { g, p };
    regler();
  }

  /** Le volume (et la place, de gauche à droite) d'une boucle, atteint en douceur. */
  function viser(nom, v, pan) {
    const b = boucles[nom];
    if (!b) return;
    const t = ctx.currentTime;
    b.g.gain.setTargetAtTime(v, t, 0.3);
    if (b.p && pan !== undefined) b.p.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), t, 0.3);
  }
  function regler() {
    const a = actuel, v = a.vent;
    viser('ventDoux', V.ventDoux[0] + V.ventDoux[1] * v);
    viser('ventFort', V.ventFort * lisse(0.35, 1, v));
    viser('feuilles', a.feuilles * (V.feuilles[0] + V.feuilles[1] * lisse(0.25, 1, v)));
    // (l'eau la plus proche : la mer, ou la rivière à Gokayama ; la musique d'une scène : le nō, la kokiriko)
    viser(a.eauSon, a.vagues * V[a.eauSon], a.panVagues);
    viser('vapeur', a.vapeur * V.vapeur, a.panVapeur);
    viser('insectes', a.nuit * V.insectes);
    viser(a.scene, a.no * V[a.scene], a.panNo);
    viser('ruisseau', a.ruisseau * V.ruisseau, a.panRuisseau);
    viser(a.grenouilleSon, a.grenouilles * V[a.grenouilleSon]);
    viser('cascade', a.cascade * V.cascade, a.panCascade);
    viser('semi', a.semi * V.semi);
  }

  /** Joue un son, en lançant la fabrication s'il le faut (au départ, avant le premier pas) : s'il n'est pas prêt, rien. */
  function jouerTot(quoi, o) {
    const pret = son.pret();
    if (!pret) return;
    if (!commence) commencer(pret);
    jouer(quoi, o);
  }

  /** Joue un son fabriqué (s'il est prêt) : gain, pan (−1 à gauche, 1 à droite), vitesse (et hauteur). */
  function jouer(quoi, { gain = 1, pan = 0, vitesse = 1 } = {}) {
    const b = tampons.get(quoi);
    if (!b || coupe) return false;
    const s = ctx.createBufferSource();
    s.buffer = b;
    s.playbackRate.value = vitesse;
    const g = ctx.createGain();
    g.gain.value = gain;
    s.connect(g);
    if (pan && ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, pan));
      g.connect(p).connect(sortie);
    } else g.connect(sortie);
    s.start();
    return true;
  }

  return {
    /**
     * Un pas sur ce sol (SOLS de bruitage-calcul.js). kon : les pattes de Kon ; course : en courant ; force :
     * multiplie le volume (l'eau plus ou moins profonde, la distance) ; pan : de gauche (−1) à droite (1).
     */
    pas(sol, { kon = false, course = false, force = 1, pan = 0 } = {}) {
      if (!commence || !son.pret()) return;
      let v;
      do v = Math.floor(Math.random() * VARIANTES); while (v === derniers[sol]);
      derniers[sol] = v;
      const vitesse = (kon ? 1.45 : course ? 1.07 : 1) * (0.95 + Math.random() * 0.1);
      const gain = (kon ? V.kon : course ? V.course : V.pas) * force * (0.85 + Math.random() * 0.3);
      jouer(`pas/${sol}/${v}`, { gain, pan, vitesse });
    },
    /** Le cri d'un oiseau qu'on voit (nom : 'mouette'…), plus ou moins fort (force : sa distance), de quel côté (pan). */
    oiseau(nom, { force = 1, pan = 0 } = {}) {
      if (commence && son.pret()) jouer(`oiseau/${nom}`, { gain: (V[nom] ?? V.oiseau) * force, pan, vitesse: 0.92 + Math.random() * 0.18 });
    },
    /** Un chat qui miaule ou qui ronronne, un chien qui aboie (nom : 'miaou', 'ronron', 'ouaf'), plus ou moins fort (force), de quel côté (pan). */
    bete(nom, { force = 1, pan = 0 } = {}) {
      if (commence && son.pret()) jouer(`bete/${nom}`, { gain: V[nom] * force, pan, vitesse: 0.95 + Math.random() * 0.1 });
    },
    /** Le compagnon s'ébroue. */
    ebrouer({ pan = 0, force = 1 } = {}) {
      if (commence && son.pret()) jouer('ebrouer', { gain: V.ebrouer * force, pan, vitesse: 0.97 + Math.random() * 0.06 });
    },
    /** Le cri d'un compagnon ('kon', 'pon', 'chapu'), d'un nuage (pouf) ou un coup sur le ventre du tanuki (tambour). */
    cri(espece, { pan = 0, force = 1 } = {}) { jouerTot(`cri/${espece}`, { gain: V.cri * force, pan, vitesse: 0.97 + Math.random() * 0.06 }); },
    pouf({ pan = 0 } = {}) { jouerTot('pouf', { gain: V.pouf, pan, vitesse: 0.9 + Math.random() * 0.2 }); },
    tambour({ pan = 0, force = 1 } = {}) { jouerTot('tambour', { gain: V.tambour * force, pan, vitesse: 0.92 + Math.random() * 0.16 }); },
    /**
     * Ce qu'on entend ici, maintenant : vent (la force de la rafale, 0,25 à environ 1,2), feuilles (0 à 1 : les
     * arbres autour), vagues et panVagues (la mer : proche de 0 à 1, et de quel côté), vapeur et panVapeur (les
     * fumerolles), nuit (0 à 1), oiseau (celui qui chanterait ici : 'milan', 'uguisu' ou null), no et panNo (la
     * musique d'une scène, scene : 'no' ou 'kokiriko' : 0 loin, 1 tout près), eauSon (la boucle de l'eau : 'vagues'
     * ou 'riviere'), ruisseau et panRuisseau, grenouilles (0 à 1) et grenouilleSon (leur boucle : 'grenouilles', 'kajika'),
     * cascade et panCascade (0 à 1), semi (les cigales : 0 à 1). dt : secondes depuis l'appel précédent.
     */
    ambiance(a, dt) {
      const pret = son.pret();
      if (!pret) return;
      if (!commence) commencer(pret);
      Object.assign(actuel, a);
      regler();
      prochainOiseau -= dt;
      if (prochainOiseau <= 0) {
        prochainOiseau = 28 + Math.random() * 45;
        if (actuel.oiseau && actuel.nuit < 0.3) jouer(`oiseau/${actuel.oiseau}`, { gain: V.oiseau * (0.6 + 0.4 * Math.random()), pan: (Math.random() - 0.5) * 1.4, vitesse: 0.97 + Math.random() * 0.06 });
      }
    },
    /** Fabrique les sons dès maintenant, si le son joue déjà (les cris du départ seront prêts à temps). */
    preparer() { const pret = son.pret(); if (pret && !commence) commencer(pret); },
    sons,
    /** Un son des trésors ('pelle', 'boite'…), plus ou moins fort, de quel côté. */
    jouerSon(nom, { force = 1, pan = 0 } = {}) { if (commence && son.pret()) jouer(nom, { gain: (V[nom] ?? 0.08) * force, pan, vitesse: 0.97 + Math.random() * 0.06 }); },
    /** Les feux d'artifice : nom 'depart', 'boum' ou 'crepite' ; delai : le temps que met le son à arriver (en s). */
    feu(nom, { force = 1, pan = 0, delai = 0 } = {}) {
      if (!commence || !son.pret()) return;
      const q = `feu/${nom}`, gain = V[nom] * force, vitesse = (nom === 'boum' ? 0.85 + Math.random() * 0.3 : 0.95 + Math.random() * 0.1);
      if (delai > 0.01) setTimeout(() => jouer(q, { gain, pan, vitesse }), delai * 1000);
      else jouer(q, { gain, pan, vitesse });
    },
    /** Le silence (oui), ou le retour du bruitage. */
    couper(oui) {
      coupe = oui;
      if (sortie) sortie.gain.setTargetAtTime(oui ? 0 : 1, ctx.currentTime, 0.15);
    },
  };
}
