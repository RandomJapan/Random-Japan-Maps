// ================================================================
//  Les bêtes d'Aogashima (demandées le 2026-10-23). Des grives des îles d'Izu (les akakokko : tête noire,
//  ventre roux, bec jaune ; elles ne vivent que dans ces îles et quelques îles du sud) qui sautillent dans
//  l'herbe, picorent, chantent de temps en temps, et s'envolent vers un autre coin quand on approche ; des
//  lézards d'Okada (okada-tokage, la queue bleue des jeunes) qui se chauffent sur le sol tiède du volcan et
//  filent si l'on court vers eux ; deux chats, l'un qui dort en boule près de la marmite du volcan, l'autre
//  assis près du distributeur (la nuit, ils veillent et leurs yeux brillent : styles.js, « lumiere ») ; des
//  asagimadara, les grands papillons voyageurs, qui volettent et se posent ; et des milans noirs qui tournent
//  haut au-dessus du cratère. La nuit, les oiseaux, les lézards et les papillons dorment (on ne les voit plus).
//  creerBetes(ctx, o) → { groupe, animer(dt, temps, joueur, kon, nuit, paisible) → les sons de cette image
//  [{ nom, x, y, z, fort }], cibles() → celles à qui l'on peut faire quelque chose [{ sorte, id, x, y, z, rayon,
//  haut, verbe, bete }] }
//  o : { monde, grives: [[[x, z], …], …] (les coins de chacune), lezards: [[x, z], …], chats: [{ id, x, z, cap,
//  robe: 'roux' | 'pie', dort }], papillons: [[x, z], …], milans: [{ x, z, r, h, sens }] } ; joueur : { x, z,
//  vitesse } ; kon : { x, z } ; paisible : pendant un dialogue (personne ne s'enfuit).
//  Repère : x vers l'est, z vers le sud, y vers le haut ; une bête regarde vers +z.
// ================================================================

const PI = Math.PI;
const lisse = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
const tourner = (a, b, f) => { const d = ((b - a + PI) % (2 * PI) + 2 * PI) % (2 * PI) - PI; return a + d * Math.min(1, f); };
// plus grandes que nature, à l'échelle des voyageurs (grosses têtes, comme dans les jeux) : sinon, on ne les voyait pas
const T = { grive: 2.2, lezard: 2.6, papillon: 2.4, milan: 1.3, chat: 1.35 };
const G = { dos: '#4b3f30', ventre: '#d4662c', tete: '#211d1f', bec: '#e8b62e', pattes: '#c9a46a' };
const L = { dos: '#3b2f26', rayure: '#e5c46a', queue: '#3f86d8', ventre: '#d9c9a6' };
const ROBES = {
  roux: { poil: '#e39a4f', fonce: '#c0723a', clair: '#f6ecdc' },
  pie: { poil: '#2e2a2c', fonce: '#1f1c1e', clair: '#f6ecdc' },
};
const OEIL_CHAT = '#c8d84a', NEZ = '#e88a8a';

function pivot(THREE, x, y, z, ...enfants) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  for (const e of enfants) g.add(e);
  return g;
}

// ---------------------------------------------------------------- Les formes (une fois pour toutes)
function formes(ctx) {
  const { THREE, atelier } = ctx;
  // la grive : le corps (le dos brun, le ventre roux), la tête noire et son bec jaune, le cercle jaune de l'œil, la
  // queue, les pattes ; ses ailes à part (repliées au sol, battantes en vol)
  const grive = atelier()
    .ovale(0.06, G.dos, { y: 0.085, sx: 0.85, sy: 0.82, sz: 1.45, teinte: (x, y, z) => (y < 0.083 && z > -0.04 ? G.ventre : G.dos) }, 10)
    .boule(0.042, G.tete, { y: 0.138, z: 0.068 }, 1)
    .cone(0.012, 0.036, 6, G.bec, { y: 0.133, z: 0.115, rx: PI / 2 })
    .boite(0.045, 0.012, 0.075, G.dos, { y: 0.1, z: -0.11, rx: -0.35 });
  for (const s of [-1, 1]) {
    grive.ovale(0.013, G.bec, { x: s * 0.036, y: 0.146, z: 0.085, sx: 0.35, trait: false }, 6)
      .ovale(0.006, G.tete, { x: s * 0.041, y: 0.147, z: 0.087, sx: 0.4, trait: false }, 5)
      .baton([s * 0.012, 0.05, 0.0], [s * 0.015, 0.0, 0.012], 0.005, G.pattes, 4, { trait: false });
  }
  const aileGrive = (s) => atelier().ovale(0.06, G.dos, { x: s * 0.055, sy: 0.14, sz: 0.55 }, 8).fin(0, false);
  // le lézard : le corps (le dos brun, deux rayures dorées), la tête, les pattes écartées ; la queue bleue à part
  const lezard = atelier()
    .ovale(0.028, L.dos, { y: 0.022, sx: 0.95, sy: 0.55, sz: 2.4 }, 8)
    .ovale(0.02, L.dos, { y: 0.024, z: 0.075, sx: 0.9, sy: 0.6, sz: 1.5 }, 8);
  for (const s of [-1, 1]) {
    lezard.boite(0.005, 0.004, 0.13, L.rayure, { x: s * 0.011, y: 0.036, z: 0.01, trait: false });
    for (const z of [0.035, -0.035]) lezard.baton([s * 0.02, 0.018, z], [s * 0.045, 0.002, z + 0.012], 0.006, L.dos, 4, { trait: false });
  }
  const queueLezard = atelier().cone(0.019, 0.17, 6, L.queue, { y: 0.02, z: -0.085, rx: -PI / 2 }).fin(0, false);
  // le chat : assis (le corps en poire, le poitrail clair, la tête et ses oreilles, les yeux qui brillent la nuit,
  // les pattes de devant ; la queue à part, posée au sol) ou couché en boule (la queue enroulée devant)
  const chat = (robe) => {
    const R = ROBES[robe];
    const a = atelier()
      .ovale(0.11, R.poil, { y: 0.13, z: -0.02, sx: 0.95, sy: 1.25, sz: 1.05 }, 12)
      .ovale(0.07, R.clair, { y: 0.15, z: 0.06, sx: 0.9, sy: 1.2, sz: 0.6 }, 8);
    for (const s of [-1, 1]) {
      a.baton([s * 0.045, 0.16, 0.07], [s * 0.045, 0.012, 0.1], 0.022, R.poil, 6)
        .ovale(0.026, R.clair, { x: s * 0.045, y: 0.012, z: 0.112, sy: 0.5 }, 6);
    }
    return a.fin(0, false);
  };
  const teteChat = (robe) => {
    const R = ROBES[robe];
    const a = atelier().ovale(0.085, R.poil, { sx: 1.15, sy: 0.95 }, 12)
      .ovale(0.045, R.clair, { y: -0.025, z: 0.06, sx: 1.2, sy: 0.75, sz: 0.6 }, 8)
      .ovale(0.01, NEZ, { y: -0.005, z: 0.088, sx: 1.3, sy: 0.8, trait: false }, 5);
    for (const s of [-1, 1]) {
      a.cone(0.04, 0.07, 4, R.poil, { x: s * 0.055, y: 0.075, z: -0.005, rz: -s * 0.28, ry: PI / 4 })
        .cone(0.022, 0.04, 4, NEZ, { x: s * 0.054, y: 0.07, z: 0.012, rz: -s * 0.28, ry: PI / 4, trait: false })
        .ovale(0.017, OEIL_CHAT, { x: s * 0.038, y: 0.018, z: 0.074, sx: 1.1, sy: 1.2, sz: 0.5, trait: false, sorte: 'lumiere' }, 8)
        .ovale(0.006, '#1a1618', { x: s * 0.038, y: 0.018, z: 0.082, sx: 0.5, sy: 1.6, sz: 0.4, trait: false }, 5);
    }
    // (le chat roux est tigré : des bandes plus sombres sur le front)
    if (robe === 'roux') for (const x of [-0.02, 0, 0.02]) a.boite(0.008, 0.035, 0.01, R.fonce, { x, y: 0.05, z: 0.074, rx: -0.5, trait: false });
    return a.fin(0, false);
  };
  const queueChat = (robe) => atelier().baton([0, 0, 0], [0.02, 0.0, -0.24], 0.022, ROBES[robe].poil, 6).baton([0.02, 0.0, -0.24], [0.13, 0.01, -0.34], 0.02, ROBES[robe].fonce, 6).fin(0, false);
  const chatCouche = (robe) => {
    const R = ROBES[robe];
    const a = atelier()
      .ovale(0.16, R.poil, { y: 0.085, sx: 1.25, sy: 0.55, sz: 1.0, teinte: (x, y, z) => (Math.floor((Math.atan2(x, z) + PI) * 3.2) % 2 ? R.poil : R.fonce) }, 14)
      .ovale(0.08, R.poil, { x: 0.13, y: 0.1, z: 0.1, sx: 1.1, sy: 0.85 }, 10)
      .piece(new ctx.THREE.TorusGeometry(0.17, 0.032, 6, 14, PI * 1.1), R.poil, { y: 0.035, rx: PI / 2, rz: -0.2 });
    for (const s of [-1, 1]) a.cone(0.035, 0.06, 4, R.poil, { x: 0.13 + s * 0.05, y: 0.17, z: 0.1, rz: -s * 0.28, ry: PI / 4 });
    // les yeux fermés : deux petits traits
    for (const s of [-1, 1]) a.boite(0.025, 0.006, 0.006, R.fonce, { x: 0.13 + s * 0.035, y: 0.11, z: 0.176, trait: false });
    return a.fin(0, false);
  };
  // le papillon (asagimadara) : un corps fin ; chaque aile, une grande aile avant bleu pâle (presque transparente)
  // bordée de noir au bout, une aile arrière bleu pâle bordée de brun-roux (à plat le long de x, depuis le corps)
  const corpsPapillon = atelier().baton([0, 0, -0.02], [0, 0, 0.025], 0.004, '#2a2426', 4).fin(0, false);
  const ailePapillon = (s) => atelier()
    .ovale(0.03, '#2a2a2e', { x: s * 0.03, z: 0.013, sy: 0.05, sx: 1.05, sz: 0.72 }, 8)
    .ovale(0.027, '#d3ecf4', { x: s * 0.026, y: 0.0012, z: 0.011, sy: 0.06, sx: 1.0, sz: 0.68, trait: false }, 8)
    .ovale(0.023, '#9c4a2e', { x: s * 0.021, y: -0.0006, z: -0.016, sy: 0.05, sx: 1.0, sz: 0.85 }, 8)
    .ovale(0.018, '#d3ecf4', { x: s * 0.018, y: 0.0008, z: -0.014, sy: 0.06, sx: 1.0, sz: 0.8, trait: false }, 8)
    .fin(0, false);
  // le milan noir : le corps, la queue fourchue ; les ailes longues à part, la bande claire dessous
  const milan = atelier()
    .ovale(0.12, '#5a4433', { sx: 0.7, sy: 0.6, sz: 2.1 }, 10)
    .ovale(0.075, '#6a5240', { y: 0.03, z: 0.22 }, 8)
    .cone(0.02, 0.06, 5, '#e8b62e', { y: 0.02, z: 0.3, rx: PI / 2 });
  for (const s of [-1, 1]) milan.boite(0.09, 0.02, 0.26, '#4a3a2c', { x: s * 0.05, y: 0.0, z: -0.3, ry: s * 0.25 });
  const aileMilan = (s) => atelier()
    .boite(0.78, 0.03, 0.26, '#4a3a2c', { x: s * 0.42, ry: s * 0.06 })
    .boite(0.3, 0.032, 0.1, '#8a7258', { x: s * 0.58, y: -0.002, z: -0.02, trait: false })
    .fin(0, false);
  return {
    grive: grive.fin(0, false), aileGrive: [aileGrive(1), aileGrive(-1)], lezard: lezard.fin(0, false), queueLezard,
    chat: { roux: chat('roux'), pie: chat('pie') }, teteChat: { roux: teteChat('roux'), pie: teteChat('pie') },
    queueChat: { roux: queueChat('roux'), pie: queueChat('pie') }, chatCouche: { roux: chatCouche('roux'), pie: chatCouche('pie') },
    corpsPapillon, ailePapillon: [ailePapillon(1), ailePapillon(-1)], milan: milan.fin(0, false), aileMilan: [aileMilan(1), aileMilan(-1)],
  };
}

export function creerBetes(ctx, { monde, grives = [], lezards = [], chats = [], papillons = [], milans = [] }) {
  const { THREE, maillage } = ctx;
  const F = formes(ctx);
  const groupe = new THREE.Group();
  const hasard = Math.random;
  const sol = (x, z, y = Infinity) => monde.hauteur(x, z, y);

  // ---- les grives
  const G_ = grives.map((maisons, i) => {
    const racine = new THREE.Group(), corps = new THREE.Group();
    corps.scale.setScalar(T.grive);
    racine.add(corps);
    corps.add(maillage(F.grive, false));
    const ailes = [1, -1].map((s, k) => { const p = pivot(THREE, s * 0.035, 0.1, 0.02, maillage(F.aileGrive[k], false)); corps.add(p); return p; });
    groupe.add(racine);
    const [x, z] = maisons[0];
    return { racine, corps, ailes, maisons, ici: 0, x, z, y: sol(x, z), cap: hasard() * 2 * PI, mode: 'sol', saut: null, vol: null, picore: 0, prochain: hasard(), chant: 6 + hasard() * 20 + i * 7 };
  });
  // ---- les lézards
  const L_ = lezards.map(([x, z]) => {
    const racine = new THREE.Group(), corps = new THREE.Group();
    corps.scale.setScalar(T.lezard);
    racine.add(corps);
    corps.add(maillage(F.lezard, false));
    const queue = pivot(THREE, 0, 0, -0.07, maillage(F.queueLezard, false));
    corps.add(queue);
    groupe.add(racine);
    return { racine, corps, queue, maison: [x, z], x, z, y: sol(x, z), cap: hasard() * 2 * PI, mode: 'repos', reste: 0, t: hasard() * 10, pompes: 2 + hasard() * 4 };
  });
  // ---- les chats
  const C_ = chats.map((c) => {
    const racine = new THREE.Group();
    const assis = new THREE.Group();
    assis.add(maillage(F.chat[c.robe], false));
    const tete = pivot(THREE, 0, 0.31, 0.04, maillage(F.teteChat[c.robe], false));
    const queue = pivot(THREE, 0, 0.03, -0.1, maillage(F.queueChat[c.robe], false));
    assis.add(tete, queue);
    const couche = maillage(F.chatCouche[c.robe], false);
    racine.add(assis, couche);
    racine.position.set(c.x, sol(c.x, c.z), c.z);
    racine.rotation.y = c.cap;
    racine.scale.setScalar(T.chat);
    groupe.add(racine);
    monde.cercle(c.x, c.z, 0.4);
    return { ...c, racine, assis, tete, queue, couche, y: racine.position.y, ronron: 0, miaou: 0, pres: false };
  });
  // ---- les papillons
  const P_ = papillons.map(([x, z]) => {
    const racine = new THREE.Group(), corps = new THREE.Group();
    corps.scale.setScalar(T.papillon);
    racine.add(corps);
    corps.add(maillage(F.corpsPapillon, false));
    const ailes = [1, -1].map((s, k) => { const p = pivot(THREE, 0, 0, 0, maillage(F.ailePapillon[k], false)); corps.add(p); return p; });
    groupe.add(racine);
    const y = sol(x, z) + 1;
    return { racine, ailes, maison: [x, z], x, y, z, cap: 0, cible: null, pose: 0, t: hasard() * 10 };
  });
  // ---- les milans
  const M_ = milans.map((m) => {
    const racine = new THREE.Group(), corps = new THREE.Group();
    corps.scale.setScalar(T.milan);
    racine.add(corps);
    corps.add(maillage(F.milan, false));
    const ailes = [1, -1].map((s, k) => { const p = pivot(THREE, s * 0.06, 0.01, 0.02, maillage(F.aileMilan[k], false)); corps.add(p); return p; });
    groupe.add(racine);
    return { ...m, racine, corps, ailes, a: hasard() * 2 * PI, battre: 4 + hasard() * 8, t: 0 };
  });

  /** La grive s'envole vers celui de ses coins le plus loin du joueur. */
  function envoler(g, j) {
    let meilleur = g.ici, loin = -1;
    g.maisons.forEach(([mx, mz], k) => { const d = Math.hypot(mx - j.x, mz - j.z); if (k !== g.ici && d > loin) { loin = d; meilleur = k; } });
    const [mx, mz] = g.maisons[meilleur], ax = mx + (hasard() - 0.5) * 1.2, az = mz + (hasard() - 0.5) * 1.2, d = Math.hypot(ax - g.x, az - g.z);
    g.vol = { de: [g.x, g.y, g.z], a: [ax, sol(ax, az), az], t: 0, duree: Math.max(0.9, d / 6.5), h: 1.2 + d * 0.18 };
    g.ici = meilleur;
    g.mode = 'vol';
    g.saut = null;
  }

  return {
    groupe,
    /** Toutes, par sorte (pour les essais). */
    toutes: { grives: G_, lezards: L_, chats: C_, papillons: P_, milans: M_ },
    animer(dt, temps, joueur, kon, nuit = 0, paisible = false) {
      const sons = [], jour = nuit < 0.5;
      const loinDe = (b) => Math.hypot(b.x - joueur.x, b.z - joueur.z);
      // ---- les grives
      for (const g of G_) {
        g.racine.visible = jour && loinDe(g) < 60;
        if (!g.racine.visible) continue;
        let vol = 0;
        if (g.mode === 'sol') {
          const dj = loinDe(g), dk = Math.hypot(g.x - kon.x, g.z - kon.z);
          if (!paisible && (dj < 2.2 || dk < 1.5)) envoler(g, joueur);
          else if (g.saut) {
            const s = g.saut;
            s.t = Math.min(1, s.t + dt / 0.2);
            g.x = s.de[0] + (s.a[0] - s.de[0]) * s.t;
            g.z = s.de[1] + (s.a[1] - s.de[1]) * s.t;
            g.y = sol(g.x, g.z) + Math.sin(s.t * PI) * 0.06 * T.grive;
            if (s.t >= 1) g.saut = null;
          } else if ((g.prochain -= dt) <= 0) {
            g.prochain = 0.35 + hasard() * 1.3;
            if (hasard() < 0.35) g.picore = 0.55;
            else {
              // un petit saut, au hasard autour de son coin (revenir vers lui s'il s'en est éloigné)
              const [hx, hz] = g.maisons[g.ici];
              const a = Math.hypot(g.x - hx, g.z - hz) > 2.2 ? Math.atan2(hx - g.x, hz - g.z) + (hasard() - 0.5) * 0.6 : g.cap + (hasard() - 0.5) * 1.6;
              const d = 0.15 + hasard() * 0.25;
              g.cap = a;
              g.saut = { de: [g.x, g.z], a: [g.x + Math.sin(a) * d, g.z + Math.cos(a) * d], t: 0 };
            }
          }
          g.picore = Math.max(0, g.picore - dt);
          // elle chante de temps en temps
          if ((g.chant -= dt) <= 0) { g.chant = 18 + hasard() * 30; sons.push({ nom: 'akakokko', x: g.x, y: g.y + 0.3, z: g.z, fort: 1 }); }
        }
        if (g.mode === 'vol') {
          const v = g.vol;
          v.t = Math.min(1, v.t + dt / v.duree);
          const u = lisse(0, 1, v.t);
          g.x = v.de[0] + (v.a[0] - v.de[0]) * u;
          g.z = v.de[2] + (v.a[2] - v.de[2]) * u;
          g.y = v.de[1] + (v.a[1] - v.de[1]) * u + v.h * 4 * u * (1 - u);
          g.cap = tourner(g.cap, Math.atan2(v.a[0] - v.de[0], v.a[2] - v.de[2]), dt * 12);
          vol = Math.min(1, v.t * 8, (1 - v.t) * 8);
          if (v.t >= 1) { g.mode = 'sol'; g.vol = null; g.prochain = 0.8; }
        }
        g.racine.position.set(g.x, g.y, g.z);
        g.racine.rotation.y = g.cap;
        g.corps.rotation.x = g.picore > 0 ? Math.sin((g.picore / 0.55) * PI) * 0.55 : -0.12 * vol;
        const bat = Math.sin(temps * 2 * PI * 11) * 0.9;
        g.ailes.forEach((p, k) => {
          const s = k ? -1 : 1;
          p.rotation.y = s * 1.33 * (1 - vol);
          p.rotation.z = s * (0.05 + (0.35 + bat) * vol);
        });
      }
      // ---- les lézards : couchés au chaud, ils filent quand on court vers eux (ou qu'on arrive tout près)
      for (const l of L_) {
        l.racine.visible = jour && loinDe(l) < 40;
        if (!l.racine.visible) continue;
        l.t += dt;
        const dj = loinDe(l), dk = Math.hypot(l.x - kon.x, l.z - kon.z);
        if (l.mode !== 'fuite' && !paisible && ((dj < 3.2 && joueur.vitesse > 4.2) || dj < 1.0 || dk < 1.3)) {
          l.mode = 'fuite';
          l.cap = Math.atan2(l.x - joueur.x, l.z - joueur.z) + (hasard() - 0.5) * 1.2;
          l.reste = 2.2 + hasard() * 1.8;
        }
        let course = 0;
        if (l.mode === 'fuite' || l.mode === 'retour') {
          const v = l.mode === 'fuite' ? 3.2 : 0.7;
          if (l.mode === 'retour') l.cap = tourner(l.cap, Math.atan2(l.maison[0] - l.x, l.maison[1] - l.z), dt * 4);
          const nx = l.x + Math.sin(l.cap) * v * dt, nz = l.z + Math.cos(l.cap) * v * dt;
          if (monde.libre(nx, nz, l.y)) { l.x = nx; l.z = nz; } else l.cap += (hasard() < 0.5 ? 1 : -1) * 1.2;
          l.reste -= v * dt;
          course = l.mode === 'fuite' ? 1 : 0.4;
          if (l.mode === 'fuite' && l.reste <= 0) l.mode = 'repos';
          if (l.mode === 'retour' && Math.hypot(l.x - l.maison[0], l.z - l.maison[1]) < 0.4) l.mode = 'repos';
        } else if (Math.hypot(l.x - l.maison[0], l.z - l.maison[1]) > 3.5 && dj > 7) l.mode = 'retour';
        l.y = sol(l.x, l.z, l.y);
        // au repos, de temps en temps, quelques « pompes » (il se hausse sur ses pattes)
        if (l.mode === 'repos' && (l.pompes -= dt) <= 0) l.pompes = 3 + hasard() * 5;
        const pompe = l.mode === 'repos' && l.pompes < 0.6 ? Math.abs(Math.sin(l.pompes * PI * 3.3)) * 0.012 : 0;
        l.racine.position.set(l.x, l.y + pompe, l.z);
        l.racine.rotation.y = l.cap + Math.sin(l.t * 28) * 0.3 * course;
        l.queue.rotation.y = Math.sin(l.t * 28 + 1) * 0.6 * course + Math.sin(l.t * 0.7) * 0.15 * (1 - course);
      }
      // ---- les chats : le jour, l'un dort en boule ; la nuit, tous deux veillent (les yeux qui brillent)
      for (const c of C_) {
        const dort = !!c.dort && jour;
        c.assis.visible = !dort;
        c.couche.visible = dort;
        const dj = loinDe(c);
        // il miaule quand on arrive près de lui (s'il est réveillé, pas trop souvent)
        c.miaou = Math.max(0, c.miaou - dt);
        if (dj < 3 && !c.pres && !dort && c.miaou <= 0) { sons.push({ nom: 'miaou', x: c.x, y: c.y + 0.3, z: c.z, fort: 1 }); c.miaou = 25; }
        c.pres = dj < 3;
        c.ronron = Math.max(0, c.ronron - dt);
        const souffle = 1 + Math.sin(temps * (dort ? 1.6 : 2.2) + c.x) * (dort ? 0.03 : 0.012);
        (dort ? c.couche : c.assis).scale.set(1, souffle, 1);
        if (!dort) {
          // il regarde le voyageur s'il est près, sinon autour de lui ; caressé, il ferme les yeux de plaisir (tête levée)
          const vers = Math.atan2(joueur.x - c.x, joueur.z - c.z) - c.cap, d = ((vers + PI) % (2 * PI) + 2 * PI) % (2 * PI) - PI;
          const voulu = dj < 4.5 ? Math.max(-0.9, Math.min(0.9, d)) : Math.sin(temps * 0.3 + c.x) * 0.6;
          c.tete.rotation.y = tourner(c.tete.rotation.y, voulu, dt * 3);
          c.tete.rotation.x = c.ronron > 0 ? -0.35 : Math.sin(temps * 0.5 + c.z) * 0.06;
          c.queue.rotation.y = Math.sin(temps * (c.ronron > 0 ? 3 : 1.2) + c.x) * 0.35;
        }
      }
      // ---- les papillons : ils volettent d'un point à l'autre autour de leur coin, et se posent un moment
      for (const p of P_) {
        p.racine.visible = jour && loinDe(p) < 45;
        if (!p.racine.visible) continue;
        p.t += dt;
        let ouvert;
        if (p.pose > 0) {
          p.pose -= dt;
          ouvert = 1.15 + Math.sin(p.t * 1.6) * 0.3;
        } else {
          if (!p.cible || Math.hypot(p.cible[0] - p.x, p.cible[1] - p.y, p.cible[2] - p.z) < 0.15) {
            if (p.cible && hasard() < 0.3) { p.pose = 2 + hasard() * 4; p.cible = null; }
            const [hx, hz] = p.maison, tx = hx + (hasard() - 0.5) * 5, tz = hz + (hasard() - 0.5) * 5;
            const pose = hasard() < 0.35;
            p.cible = [tx, sol(tx, tz) + (pose ? 0.32 : 0.6 + hasard() * 1.3), tz];
          }
          const [tx, ty, tz] = p.cible, d = Math.hypot(tx - p.x, ty - p.y, tz - p.z) || 1, v = Math.min(0.9, d * 3) * dt;
          p.x += ((tx - p.x) / d) * v;
          p.y += ((ty - p.y) / d) * v + Math.sin(p.t * 7) * 0.25 * dt;
          p.z += ((tz - p.z) / d) * v;
          p.cap = tourner(p.cap, Math.atan2(tx - p.x, tz - p.z), dt * 5);
          // il bat des ailes par saccades, et plane un peu entre deux
          const plane = Math.sin(p.t * 1.7) > 0.75;
          ouvert = plane ? 0.25 : 0.2 + Math.abs(Math.sin(p.t * 2 * PI * 7)) * 1.15;
        }
        p.racine.position.set(p.x, p.y, p.z);
        p.racine.rotation.y = p.cap;
        p.ailes.forEach((a, k) => { a.rotation.z = (k ? -1 : 1) * ouvert; });
      }
      // ---- les milans : ils tournent haut au-dessus du cratère, planent, battent des ailes de temps en temps
      for (const m of M_) {
        m.racine.visible = jour;
        if (!jour) continue;
        m.t += dt;
        m.a += (dt * 7 * m.sens) / m.r;
        const x = m.x + Math.sin(m.a) * m.r, z = m.z + Math.cos(m.a) * m.r;
        m.racine.position.set(x, m.h + Math.sin(m.t * 0.3) * 1.5, z);
        m.racine.rotation.set(0, m.a + (m.sens * PI) / 2, 0);
        m.corps.rotation.z = -m.sens * 0.32;
        if ((m.battre -= dt) <= 0 && m.battre > -1.2) {
          const b = Math.sin((-m.battre / 1.2) * PI * 3) * 0.45;
          m.ailes.forEach((p, k) => { p.rotation.z = (k ? -1 : 1) * (0.1 + b); });
        } else {
          if (m.battre <= -1.2) m.battre = 6 + hasard() * 10;
          m.ailes.forEach((p, k) => { p.rotation.z = (k ? -1 : 1) * 0.1; });
        }
      }
      return sons;
    },
    /** Celles à qui l'on peut faire quelque chose ici (les regarder, les caresser). */
    cibles() {
      const c = [];
      for (const g of G_) if (g.racine.visible && g.mode === 'sol') c.push({ sorte: 'grive', x: g.x, y: g.y, z: g.z, rayon: 3.2, haut: 0.75, verbe: 'regarder' });
      for (const l of L_) if (l.racine.visible && l.mode === 'repos') c.push({ sorte: 'lezard', x: l.x, y: l.y, z: l.z, rayon: 1.8, haut: 0.6, verbe: 'regarder' });
      for (const ch of C_) {
        c.push({
          sorte: 'chat', id: ch.id, x: ch.x, y: ch.y, z: ch.z, rayon: 1.7, haut: 0.95, verbe: 'caresser',
          // caressé, il ronronne (celui qui est assis lève la tête et ferme les yeux ; celui qui dort ne se réveille même pas)
          bete: { caresser() { ch.ronron = 6; } },
        });
      }
      return c;
    },
  };
}
