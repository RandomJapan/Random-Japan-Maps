// ================================================================
//  Les mouettes d'Itsukushima : des goélands à queue noire (les umineko, « chats de mer » : leur cri est un
//  miaulement). Quelques-uns tournent au-dessus de la baie ; d'autres sont posés sur l'estran, sur l'eau ou
//  en haut du grand torii : ils s'envolent quand on approche (ou quand Kon leur court après), font quelques
//  tours au-dessus de la mer, puis reviennent se poser. Ils crient de temps en temps (bruitage.js).
//  creerMouettes(ctx, o) → { groupe, animer(dt, temps, joueur, kon, nuit) → les cris de cette image [{ x, y, z, fort }] }
//  o : vols [{ x, z, r, h, sens }] (un cercle au-dessus de la mer, à la hauteur h ; sens : 1 ou −1) ;
//  poses [{ x, z, y?, cap, mer: [dx, dz], fuite? }] (y : où il se pose, sinon le sol ou l'eau ; mer : vers où
//  il s'envole, le large ; fuite : à quelle distance on le dérange) ; terrain(x, z) ; niveau (de l'eau).
//  Repère : x vers l'est, z vers le sud, y vers le haut ; un goéland regarde vers +z.
// ================================================================

const PI = Math.PI;
const BLANC = '#f4f1ea', GRIS = '#9ba5ac', NOIR = '#2a272c', JAUNE = '#f0c23a', ROUGE = '#d8402e';
// un peu plus grands que nature (×1,4 : 2,2 m d'envergure), comme les daims à côté des voyageurs : de loin, on
// les voit bien
const TAILLE = 1.4;
/** La hauteur du centre du corps au-dessus des pattes (posé sur le sol) ; sur l'eau, le corps flotte. */
const PATTES = 0.21 * TAILLE, FLOTTE = 0.05 * TAILLE;
const VITESSE = 5.5;

/** Les formes d'un goéland (une fois pour tous) : le corps posé (ailes repliées, pattes), en vol, et les ailes. */
function formes(ctx) {
  const { atelier } = ctx;
  const corps = (pose) => {
    // (2026-10-24) le corps en goutte : plein devant, fin vers la queue
    const goutte = (x, y, z) => { const t = Math.max(0, -z / 0.13); const k = 1 - 0.32 * t ** 1.4; return [x * k, y * k, z]; };
    const a = atelier()
      .ovale(0.13, BLANC, { sx: 0.85, sy: 0.78, sz: 1.9, deformer: goutte }, 14)
      .ovale(0.115, GRIS, { y: 0.05, z: -0.01, sx: 0.88, sy: 0.55, sz: 1.6, deformer: goutte }, 12) // le dos gris ardoise
      .ovale(0.08, BLANC, { y: 0.085, z: 0.23, sy: 0.92 }, 12)
      .cone(0.02, 0.085, 6, JAUNE, { y: 0.07, z: 0.335, rx: PI / 2 })
      .ovale(0.012, ROUGE, { y: 0.062, z: 0.352, trait: false }, 6) // la tache rouge du bec
      .ovale(0.008, NOIR, { y: 0.068, z: 0.36, sx: 1.6, sy: 0.6, trait: false }, 5) // et sa bande noire
      .ovale(0.014, NOIR, { x: 0.065, y: 0.1, z: 0.265, trait: false }, 6)
      .ovale(0.014, NOIR, { x: -0.065, y: 0.1, z: 0.265, trait: false }, 6)
      .ovale(0.005, BLANC, { x: 0.071, y: 0.105, z: 0.272, trait: false }, 4)
      .ovale(0.005, BLANC, { x: -0.071, y: 0.105, z: 0.272, trait: false }, 4)
      .boite(0.13, 0.025, 0.1, BLANC, { y: 0.015, z: -0.29 })
      .boite(0.13, 0.025, 0.04, NOIR, { y: 0.015, z: -0.36 }); // la bande noire de la queue
    if (pose) {
      for (const s of [-1, 1]) {
        a.ovale(0.12, GRIS, { x: s * 0.082, y: 0.04, z: -0.07, sx: 0.4, sy: 0.55, sz: 2.0, ry: s * 0.08 }, 10)
          .ovale(0.07, NOIR, { x: s * 0.045, y: 0.05, z: -0.33, sx: 0.45, sy: 0.4, sz: 1.6, ry: -s * 0.12 }, 8)
          .ovale(0.012, BLANC, { x: s * 0.07, y: 0.065, z: -0.38, sx: 0.5, sy: 0.4, sz: 1.3, trait: false }, 5)
          .cylindre(0.012, 0.012, 0.14, 5, JAUNE, { x: s * 0.04, y: -0.14, z: 0.01 })
          .boite(0.05, 0.012, 0.065, JAUNE, { x: s * 0.04, y: -0.204, z: 0.03, trait: false });
      }
    }
    return a.fin(0, false);
  };
  // une aile, en deux morceaux, chacun depuis son articulation (l'épaule, le poignet) ; s : 1 à gauche (+x), −1 à droite
  const bras = (s) => atelier().ovale(0.16, GRIS, { x: s * 0.15, sy: 0.11, sz: 0.55 }, 10).fin(0, false);
  const main = (s) => atelier()
    .ovale(0.19, GRIS, { x: s * 0.17, sy: 0.09, sz: 0.38 }, 10)
    .ovale(0.13, NOIR, { x: s * 0.29, sy: 0.15, sz: 0.42 }, 8) // le bout des ailes, noir
    .fin(0, false);
  return { pose: corps(true), vol: corps(false), bras: [bras(1), bras(-1)], main: [main(1), main(-1)] };
}

export function creerMouettes(ctx, { vols = [], poses = [], terrain, niveau = 0 }) {
  const { THREE, maillage } = ctx;
  const F = formes(ctx);
  const groupe = new THREE.Group();
  const toutes = [];

  function nouvelle() {
    const objet = new THREE.Group(), pose = maillage(F.pose), vol = maillage(F.vol);
    objet.scale.setScalar(TAILLE);
    objet.add(pose, vol);
    const ailes = [0, 1].map((i) => {
      const s = i ? -1 : 1, epaule = new THREE.Group(), poignet = new THREE.Group();
      epaule.position.set(s * 0.07, 0.04, 0.04);
      poignet.position.set(s * 0.29, 0, 0);
      poignet.add(maillage(F.main[i]));
      epaule.add(maillage(F.bras[i]), poignet);
      objet.add(epaule);
      return { s, epaule, poignet };
    });
    groupe.add(objet);
    return {
      objet, pose, vol, ailes, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, cap: 0, roulis: 0, tangage: 0,
      phase: Math.random() * 2 * PI, bat: 0, rythme: Math.random() * 3, battre: false, cri: 4 + Math.random() * 14, t: 0,
    };
  }
  /** Où se tient un goéland posé là : sur le sol (le corps au-dessus des pattes), ou sur l'eau. */
  const hauteurPose = (p) => (p.y !== undefined ? p.y + PATTES : terrain(p.x, p.z) > niveau - 0.12 ? Math.max(terrain(p.x, p.z), niveau - 0.06) + PATTES : niveau + FLOTTE);
  const surLEau = (p) => p.y === undefined && terrain(p.x, p.z) <= niveau - 0.12;

  for (const c of vols) {
    const m = nouvelle(), a = Math.random() * 2 * PI;
    Object.assign(m, { mode: 'tourne', cercle: { sens: 1, ...c }, x: c.x + Math.sin(a) * c.r, y: c.h, z: c.z + Math.cos(a) * c.r });
    const sens = m.cercle.sens;
    m.vx = Math.cos(a) * VITESSE * sens; m.vz = -Math.sin(a) * VITESSE * sens;
    toutes.push(m);
  }
  for (const p of poses) {
    const m = nouvelle(), mer = Math.hypot(...p.mer) ? p.mer.map((v) => v / Math.hypot(...p.mer)) : [0, -1];
    Object.assign(m, { mode: 'pose', spot: { ...p, mer, y: hauteurPose(p), eau: surLEau(p), fuite: p.fuite || 4.2 }, cap: p.cap || 0, capVoulu: p.cap || 0 });
    Object.assign(m, { x: p.x, y: m.spot.y, z: p.z });
    toutes.push(m);
  }

  /** Vole vers (cx, cy, cz) à la vitesse vit : la vitesse tourne peu à peu vers le but (des courbes douces). Renvoie la distance. */
  function voler(m, cx, cy, cz, vit, dt, agilite = 1.5) {
    const dx = cx - m.x, dy = cy - m.y, dz = cz - m.z, d = Math.hypot(dx, dy, dz) || 1, k = Math.min(1, dt * agilite);
    m.vx += ((dx / d) * vit - m.vx) * k;
    m.vy += ((dy / d) * vit - m.vy) * k;
    m.vz += ((dz / d) * vit - m.vz) * k;
    m.x += m.vx * dt; m.y += m.vy * dt; m.z += m.vz * dt;
    return d;
  }
  /** Tourne sur le cercle c : le but est un peu plus loin sur le cercle, à sa hauteur (qui ondule un peu). */
  function tourner(m, c, temps, dt) {
    const a = Math.atan2(m.x - c.x, m.z - c.z) + c.sens * 0.55;
    voler(m, c.x + Math.sin(a) * c.r, c.h + 1.2 * Math.sin(temps * 0.23 + c.x), c.z + Math.cos(a) * c.r, VITESSE, dt);
  }
  /** Il s'envole : loin du joueur, vers le large ; il crie. */
  function envol(m, joueur, cris) {
    const S = m.spot;
    let ax = m.x - joueur.x, az = m.z - joueur.z;
    const l = Math.hypot(ax, az) || 1;
    ax = ax / l + S.mer[0] * 1.2; az = az / l + S.mer[1] * 1.2;
    const k = Math.hypot(ax, az) || 1;
    m.fuite = [ax / k, az / k];
    Object.assign(m, { mode: 'envol', t: 0, vx: m.fuite[0] * 2.2, vy: 3.2, vz: m.fuite[1] * 2.2 });
    cris.push({ x: m.x, y: m.y, z: m.z, fort: 1 });
    // ses voisins posés s'envolent avec lui, un instant après
    for (const v of toutes) if (v.mode === 'pose' && v.alerte === undefined && Math.hypot(v.x - m.x, v.z - m.z) < 6) v.alerte = 0.15 + Math.random() * 0.45;
  }

  return {
    groupe, liste: toutes, // (liste : pour les essais)
    /** joueur, kon : { x, z } ; nuit : 0 à 1 (ils ne crient pas la nuit). Renvoie les cris de cette image. */
    animer(dt, temps, joueur, kon, nuit = 0) {
      const cris = [];
      if (dt <= 0) dt = 0;
      for (const m of toutes) {
        const S = m.spot;
        m.t += dt;
        if (m.mode === 'pose') {
          // posé : il se retourne de temps en temps ; sur l'eau, il se balance ; on approche : il s'envole
          m.rythme -= dt;
          if (m.rythme <= 0) { m.rythme = 3 + Math.random() * 7; m.capVoulu = m.cap + (Math.random() - 0.5) * 2.4; }
          m.cap += (m.capVoulu - m.cap) * Math.min(1, dt * 3);
          m.y = S.y + (S.eau ? 0.025 * Math.sin(temps * 1.4 + S.x) : 0);
          const pres = (q, r) => Math.hypot(q.x - S.x, q.z - S.z) < r;
          if (m.alerte !== undefined) m.alerte -= dt;
          if (dt > 0 && (pres(joueur, S.fuite) || pres(kon, S.fuite * 0.75) || m.alerte <= 0)) { m.alerte = undefined; envol(m, joueur, cris); }
        } else if (m.mode === 'tourne') {
          tourner(m, m.cercle, temps, dt);
        } else if (m.mode === 'envol') {
          voler(m, S.x + m.fuite[0] * 14, Math.max(S.y + 3, 8) + 2, S.z + m.fuite[1] * 14, 6.5, dt, 2);
          if (m.t > 2.6) {
            const r = 7 + Math.random() * 4;
            m.cercle = { x: S.x + m.fuite[0] * 10 + S.mer[0] * 6, z: S.z + m.fuite[1] * 10 + S.mer[1] * 6, r, h: Math.max(S.y + 3, 7) + Math.random() * 4, sens: Math.random() < 0.5 ? 1 : -1 };
            Object.assign(m, { mode: 'erre', t: 0, duree: 16 + Math.random() * 22 });
          }
        } else if (m.mode === 'erre') {
          tourner(m, m.cercle, temps, dt);
          if (m.t > m.duree) {
            // on est encore là : un tour de plus
            if (Math.hypot(joueur.x - S.x, joueur.z - S.z) < S.fuite + 3) m.duree += 8;
            else Object.assign(m, { mode: 'retour', t: 0 });
          }
        } else if (m.mode === 'retour') {
          // il revient par le large, un peu au-dessus de sa place, puis descend s'y poser
          const d = voler(m, S.x + S.mer[0] * 9, S.y + 2.5, S.z + S.mer[1] * 9, VITESSE, dt, 1.8);
          if (d < 2.2 || m.t > 12) Object.assign(m, { mode: 'final', t: 0 }); // (s'il tourne autour sans l'atteindre)
        } else if (m.mode === 'final') {
          const d = Math.hypot(S.x - m.x, S.y - m.y, S.z - m.z);
          voler(m, S.x, S.y, S.z, Math.min(4.5, Math.max(0.7, d * 1.8)), dt, 3);
          if (Math.hypot(joueur.x - S.x, joueur.z - S.z) < S.fuite + 1) Object.assign(m, { mode: 'erre', t: 0, duree: 8 });
          else if (d < 0.22) {
            Object.assign(m, { mode: 'pose', x: S.x, y: S.y, z: S.z, vx: 0, vy: 0, vz: 0, capVoulu: m.cap, rythme: 2, roulis: 0, tangage: 0 });
          }
        }

        const vole = m.mode !== 'pose';
        // le cap suit la vitesse ; le roulis, le virage ; le tangage, la montée
        if (vole) {
          const hv = Math.hypot(m.vx, m.vz);
          if (hv > 0.3) {
            const cap = Math.atan2(m.vx, m.vz);
            const vire = dt > 0 ? (((cap - m.cap + PI) % (2 * PI) + 2 * PI) % (2 * PI) - PI) / dt : 0;
            m.cap = cap;
            m.roulis += (Math.max(-0.75, Math.min(0.75, -vire * 0.35)) - m.roulis) * Math.min(1, dt * 3);
          }
          m.tangage += (-Math.atan2(m.vy, Math.max(0.5, hv)) * 0.7 - m.tangage) * Math.min(1, dt * 4);
          // battre des ailes : à l'envol, à l'atterrissage, en montant ; sinon par moments, entre deux planés
          m.rythme -= dt;
          if (m.rythme <= 0) { m.battre = !m.battre; m.rythme = m.battre ? 0.8 + Math.random() : 2 + Math.random() * 3; }
          const fort = m.mode === 'envol' || (m.mode === 'final' && Math.hypot(S.x - m.x, S.z - m.z) < 3) || m.vy > 0.9;
          m.bat += ((fort || m.battre ? 1 : 0) - m.bat) * Math.min(1, dt * 5);
          m.phase += 2 * PI * (fort ? 4.2 : 2.8) * dt;
        }
        m.pose.visible = !vole;
        m.vol.visible = vole;
        for (const a of m.ailes) {
          a.epaule.visible = vole;
          if (!vole) continue;
          const A = 0.85 * m.bat, f = Math.sin(m.phase);
          // plané : les bras un peu relevés, les mains un peu tombantes (le « M » des goélands)
          a.epaule.rotation.z = a.s * (0.12 * (1 - m.bat) + A * f);
          a.poignet.rotation.z = a.s * (-0.14 * (1 - m.bat) + 0.65 * A * Math.sin(m.phase - 0.8));
        }
        m.objet.position.set(m.x, m.y - (vole ? 0.03 * m.bat * Math.sin(m.phase) : 0), m.z);
        m.objet.rotation.set(vole ? m.tangage : 0, m.cap, vole ? m.roulis : (S?.eau ? 0.04 * Math.sin(temps * 1.1 + S.z) : 0), 'YXZ');

        // les cris : de temps en temps (plus souvent en vol), jamais la nuit
        m.cri -= dt;
        if (m.cri <= 0) {
          m.cri = vole ? 8 + Math.random() * 14 : 22 + Math.random() * 40;
          if (nuit < 0.3) cris.push({ x: m.x, y: m.y, z: m.z, fort: vole ? 0.8 : 0.55 });
        }
      }
      return cris;
    },
  };
}
