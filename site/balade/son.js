// ================================================================
//  Les petits sons de la balade, joués par le navigateur (Web Audio, ondes carrées et triangles comme les
//  consoles d'autrefois) : rien à télécharger, aucun droit. Le bip d'une page de dialogue, le choix, la
//  petite fanfare d'un tampon. Coupés si localStorage.baladeSon = 'non'. Rien ne sonne avant un premier
//  geste (les navigateurs l'exigent).
//  Le bruitage (bruitage.js : les pas, le vent, la mer…) passe par la même sortie : couper le son coupe tout,
//  et la page cachée se tait (le contexte audio est suspendu).
// ================================================================

let ctx = null, sortie = null, actif = true, geste = false;
try { actif = localStorage.getItem('baladeSon') !== 'non'; } catch { /* navigation privée */ }

function audio() {
  if (!actif) return null;
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
    // (le tout un peu plus fort que les notes seules : le bruitage est réglé par rapport aux bips)
    sortie = ctx.createGain();
    sortie.gain.value = 2.4;
    sortie.connect(ctx.destination);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) ctx.suspend();
      else if (actif && geste) ctx.resume();
    });
  }
  if (ctx.state === 'suspended' && geste && !document.hidden) ctx.resume();
  return ctx;
}

/** Une note : fréquence (Hz), début (s, depuis maintenant), durée, forme, volume. */
function note(f, debut, duree, forme = 'square', volume = 0.05) {
  // (avant le premier geste, le contexte est suspendu : la note attendrait et sortirait avec les suivantes)
  const a = geste ? audio() : null;
  if (!a) return;
  const t = a.currentTime + debut;
  const o = a.createOscillator(), g = a.createGain();
  o.type = forme;
  o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(volume, t + 0.008);
  g.gain.setValueAtTime(volume, t + duree * 0.7);
  g.gain.linearRampToValueAtTime(0, t + duree);
  o.connect(g).connect(sortie);
  o.start(t);
  o.stop(t + duree + 0.02);
}

export const son = {
  actif: () => actif,
  regler(oui) {
    actif = oui;
    try { localStorage.setItem('baladeSon', oui ? 'oui' : 'non'); } catch { /* navigation privée */ }
    if (ctx) { if (oui) { if (geste) ctx.resume(); } else ctx.suspend(); }
  },
  /** Débloque le son au premier geste. */
  reveiller() { geste = true; audio(); },
  /** Le contexte audio, s'il joue (le son est mis, un geste a eu lieu, la page est visible) ; sinon null. */
  pret: () => (actif && geste && ctx && ctx.state === 'running' ? ctx : null),
  /** L'entrée commune vers le haut-parleur. */
  sortie: () => sortie,
  bip() { note(1320, 0, 0.045, 'square', 0.03); },
  choix() { note(990, 0, 0.05, 'square', 0.035); note(1480, 0.05, 0.07, 'square', 0.035); },
  /** La fanfare d'un tampon : un arpège montant, puis la note tenue. */
  tampon() {
    const do5 = 523.25;
    [[1, 0], [1.26, 0.09], [1.5, 0.18], [2, 0.27]].forEach(([k, d]) => note(do5 * k, d, 0.1, 'square', 0.045));
    note(do5 * 2, 0.4, 0.42, 'square', 0.04);
    note(do5 * 1.26, 0.4, 0.42, 'triangle', 0.06);
    note(do5 * 0.5, 0.4, 0.42, 'triangle', 0.07);
  },
  /** La petite musique d'une récompense : un arpège joyeux qui monte deux fois, puis l'accord tenu. */
  cadeau() {
    const do5 = 523.25;
    [[1, 0], [1.26, 0.08], [1.5, 0.16], [2, 0.24], [1.5, 0.34], [2, 0.42], [2.52, 0.5]].forEach(([k, d]) => note(do5 * k, d, 0.09, 'square', 0.04));
    note(do5 * 3, 0.62, 0.65, 'square', 0.035);
    note(do5 * 2.52, 0.62, 0.65, 'triangle', 0.05);
    note(do5 * 1.5, 0.62, 0.65, 'triangle', 0.06);
    note(do5 * 0.5, 0.62, 0.65, 'triangle', 0.07);
  },
  /** Le « boum » sourd du tampon pressé sur le papier. */
  pression() { note(120, 0, 0.12, 'triangle', 0.12); note(80, 0.02, 0.14, 'sine', 0.12); },
  /** Les hautes herbes qui bruissent, puis la petite alerte « un daim sauvage ». */
  sauvage() { [[880, 0], [698, 0.08], [880, 0.16], [698, 0.24], [1046, 0.34]].forEach(([f, d]) => note(f, d, 0.07, 'square', 0.035)); },
  /** Un secret trouvé, un koban : un scintillement qui monte, puis la pièce qui tinte (« tiin ! »). */
  koban() {
    [1568, 1760, 2093, 2349, 2637, 3136].forEach((f, k) => note(f, k * 0.05, 0.08, 'triangle', 0.05));
    note(2093, 0.36, 0.9, 'sine', 0.09);
    note(4186, 0.36, 0.5, 'sine', 0.04);
    note(5274, 0.38, 0.35, 'sine', 0.025);
  },
  /** Des koban qu'on donne au marchand : deux pièces qui tintent l'une contre l'autre. */
  achat() { note(2637, 0, 0.18, 'sine', 0.07); note(3520, 0.09, 0.22, 'sine', 0.06); note(2093, 0.22, 0.35, 'triangle', 0.05); },
  /** L'appareil photo : le déclic de l'obturateur. */
  declic() { note(2400, 0, 0.012, 'square', 0.06); note(900, 0.012, 0.03, 'square', 0.05); note(1800, 0.07, 0.015, 'square', 0.04); },
  /** Un peu de magie (le calendrier qui tourne ses pages, les bambous qui s'écartent) : une cascade de clochettes. */
  magie() { [1047, 1319, 1568, 2093, 1568, 2093, 2637, 3136].forEach((f, k) => note(f, k * 0.06, 0.22, 'sine', 0.05)); },
};
