// ================================================================
//  Le bruitage de la balade : ce qu'on entend en marchant. Les sons sont fabriqués une fois par
//  bruitage-calcul.js (dans un worker, après le premier geste : un tiers de seconde de calcul, à côté du
//  jeu) ; ici, on les joue.
//  - pas(sol, o) : un pas, selon le sol (le joueur ; ou Kon, plus léger et plus vif) ; ebrouer(o) : Kon s'ébroue ;
//  - ambiance(a, dt), plusieurs fois par seconde : le vent (sa force là où l'on est : la même rafale que celle
//    qui fait bouger les arbres et l'herbe, styles.js), les feuilles s'il y a des arbres autour, la mer près
//    du rivage, les fumerolles, les insectes la nuit, la musique de la scène de nō ; et de temps en temps un
//    oiseau ; oiseau(nom, o) : le cri
//    d'un oiseau qu'on voit (les mouettes) ;
//  - couper(oui) : le silence (pendant la vidéo TikTok).
//  Rien ne sonne avant le premier geste, ni le son coupé (son.js).
// ================================================================
import { son } from './son.js';
import { SOLS, fabriquer } from './bruitage-calcul.js';

const VARIANTES = 5;
// les volumes : les pas et les oiseaux sortent de bruitage-calcul.js à une force fixe, les boucles à une
// valeur efficace de 1 (un pas en marchant est un peu plus doux qu'un bip du dialogue ; le vent calme, à peine).
// Le 2026-10-22, le propriétaire trouvait l'ambiance trop présente sous la musique, le vent surtout : le vent
// −6 dB, les autres boucles −3 dB, les pas −2 dB. Mesuré : l'ambiance seule 3,5 dB (Itsukushima) à 7 dB
// (Aogashima) sous la musique, à −29 LUFS ; en marchant, à peu près au niveau de la musique
const V = {
  pas: 0.14, course: 0.2, kon: 0.045, ebrouer: 0.1, oiseau: 0.045, mouette: 0.05,
  ventDoux: [0.0035, 0.006], ventFort: 0.015, feuilles: [0.003, 0.017], vagues: 0.0085, vapeur: 0.02, insectes: 0.0056,
  no: 0.0085,
};
const lisse = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

/**
 * oiseaux : ceux qu'on peut entendre dans ce lieu ('milan', 'uguisu' ; 'mouette' : seulement quand on les voit
 * crier, oiseau()) ; ambiances : ses boucles en plus du
 * vent et des feuilles ('vagues', 'vapeur', 'insectes') : seulement celles du lieu (elles pèsent quelques
 * mégaoctets en mémoire).
 */
export function creerBruitage({ oiseaux = [], ambiances = [] } = {}) {
  let ctx = null, sortie = null, commence = false, coupe = false;
  const tampons = new Map(); // « pas/herbe/2 » → AudioBuffer
  const boucles = {}; // nom → { g (volume), p (gauche-droite) }
  const derniers = {}; // sol → dernière variante jouée (jamais deux fois la même de suite)
  const actuel = { vent: 0.3, feuilles: 0, vagues: 0, panVagues: 0, vapeur: 0, panVapeur: 0, nuit: 0, oiseau: null, no: 0, panNo: 0 };
  let prochainOiseau = 18 + Math.random() * 20;

  /** Au premier moment où le son joue : la sortie, puis la fabrication de tous les sons. */
  function commencer(a) {
    commence = true;
    ctx = a;
    sortie = ctx.createGain();
    sortie.connect(son.sortie());
    const sr = ctx.sampleRate, liste = [];
    for (const sol of Object.keys(SOLS)) for (let v = 0; v < VARIANTES; v++) liste.push(`pas/${sol}/${v}`);
    liste.push('boucle/ventDoux', 'boucle/ventFort', 'boucle/feuilles', 'ebrouer', ...ambiances.map((a) => `boucle/${a}`), ...oiseaux.map((o) => `oiseau/${o}`));
    const recevoir = ({ quoi, canaux }) => {
      if (!canaux) return;
      const b = ctx.createBuffer(canaux.length, canaux[0].length, sr);
      canaux.forEach((c, i) => b.copyToChannel(c, i));
      tampons.set(quoi, b);
      if (quoi.startsWith('boucle/')) lancerBoucle(quoi.slice(7), b);
    };
    // sans worker (ou s'il échoue) : un son à la fois, entre deux images
    const surPlace = (reste) => {
      const quoi = reste.shift();
      if (!quoi) return;
      try { recevoir({ quoi, canaux: fabriquer(quoi, sr) }); } catch { /* ce son-là manquera */ }
      setTimeout(() => surPlace(reste), 30);
    };
    try {
      const w = new Worker(new URL('./bruitage-calcul.js', import.meta.url), { type: 'module' });
      w.onmessage = (e) => recevoir(e.data);
      w.onerror = () => { w.terminate(); surPlace(liste.filter((q) => !tampons.has(q))); };
      w.postMessage({ sr, liste });
    } catch {
      surPlace(liste);
    }
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
    viser('vagues', a.vagues * V.vagues, a.panVagues);
    viser('vapeur', a.vapeur * V.vapeur, a.panVapeur);
    viser('insectes', a.nuit * V.insectes);
    viser('no', a.no * V.no, a.panNo);
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
    /** Kon s'ébroue. */
    ebrouer({ pan = 0, force = 1 } = {}) {
      if (commence && son.pret()) jouer('ebrouer', { gain: V.ebrouer * force, pan, vitesse: 0.97 + Math.random() * 0.06 });
    },
    /**
     * Ce qu'on entend ici, maintenant : vent (la force de la rafale, 0,25 à environ 1,2), feuilles (0 à 1 : les
     * arbres autour), vagues et panVagues (la mer : proche de 0 à 1, et de quel côté), vapeur et panVapeur (les
     * fumerolles), nuit (0 à 1), oiseau (celui qui chanterait ici : 'milan', 'uguisu' ou null), no et panNo (la
     * musique de la scène de nō : 0 loin, 1 tout près). dt : secondes depuis l'appel précédent.
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
    /** Le silence (oui), ou le retour du bruitage. */
    couper(oui) {
      coupe = oui;
      if (sortie) sortie.gain.setTargetAtTime(oui ? 0 : 1, ctx.currentTime, 0.15);
    },
  };
}
