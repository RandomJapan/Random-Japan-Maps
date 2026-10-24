// ================================================================
//  Les corbeaux sacrés d'Itsukushima (le secret du lieu, 2026-10-23). La légende : deux corbeaux ont guidé les dieux
//  jusqu'à l'île, et l'on offre encore des gâteaux de riz aux « corbeaux des dieux » (le rite de l'otoguishiki).
//  Qui pose un gâteau sur la pierre plate cachée derrière la pagode les voit descendre du ciel, le prendre, puis le
//  mener, de perchoir en perchoir (ils attendent qu'on les rejoigne), jusqu'au petit sanctuaire caché dans le bosquet
//  de bambous, qui s'ouvre devant eux. Deux corbeaux à gros bec (hashibuto-garasu), noirs aux reflets bleus, un peu plus
//  grands que nature comme les goélands. Ils croassent de temps en temps (bruitage.js : oiseau/corbeau).
//  creerCorbeaux(ctx, o) → { groupe, venir(), installer(), mode(), guideFini(), animer(dt, temps, joueur, nuit) → cris }
//  o : pierre { x, y, z } (le dessus de la pierre), perches [{ x, y, z }] (le chemin), nid [{ x, y, z, cap }, …] (leurs
//  deux places au sanctuaire), arrivee [x, y, z] (d'où ils descendent), pres (à quelle distance du perchoir où ils
//  attendent le joueur doit arriver pour qu'ils repartent), prendre() (le gâteau quitte la pierre).
//  Repère : x vers l'est, z vers le sud, y vers le haut ; un corbeau regarde vers +z.
// ================================================================

const PI = Math.PI;
const NOIR = '#26232c', REFLET = '#353a5a', BEC = '#1c1a20', PATTE = '#3a3a42';
const TAILLE = 1.3;
const PATTES = 0.2 * TAILLE;
const VITESSE = 5.2;

/** Les formes d'un corbeau : posé (ailes repliées, pattes), en vol, et les ailes en deux morceaux ; le gâteau dans le bec. */
function formes(ctx) {
  const { atelier } = ctx;
  const corps = (pose) => {
    // (2026-10-24) le corps en goutte : plein devant, fin vers la queue
    const goutte = (x, y, z) => { const t = Math.max(0, -z / 0.12); const k = 1 - 0.3 * t ** 1.4; return [x * k, y * k, z]; };
    const a = atelier()
      .ovale(0.12, NOIR, { sx: 0.82, sy: 0.8, sz: 1.8, deformer: goutte }, 14)
      .ovale(0.1, REFLET, { y: 0.045, z: -0.02, sx: 0.85, sy: 0.5, sz: 1.5, deformer: goutte }, 12)
      .ovale(0.078, NOIR, { y: 0.08, z: 0.2 }, 10)
      .ovale(0.05, NOIR, { y: 0.115, z: 0.225, sx: 0.9 }, 8) // le front bombé des corbeaux à gros bec
      .cone(0.032, 0.12, 6, BEC, { y: 0.07, z: 0.315, rx: PI / 2 + 0.18 })
      .boite(0.12, 0.02, 0.17, NOIR, { y: 0.0, z: -0.27, rx: -0.12 });
    for (const s of [-1, 1]) a.ovale(0.012, '#1a1a20', { x: s * 0.058, y: 0.108, z: 0.25, trait: false }, 6).ovale(0.005, '#e8ecf4', { x: s * 0.063, y: 0.113, z: 0.258, trait: false }, 4);
    if (pose) {
      for (const s of [-1, 1]) {
        a.ovale(0.12, NOIR, { x: s * 0.08, y: 0.03, z: -0.07, sx: 0.4, sy: 0.6, sz: 2.0, ry: s * 0.08 }, 10)
          .cylindre(0.011, 0.011, 0.15, 5, PATTE, { x: s * 0.04, y: -0.14, z: 0.01 })
          .boite(0.05, 0.012, 0.07, PATTE, { x: s * 0.04, y: -0.208, z: 0.03, trait: false });
      }
    }
    return a.fin(0, false);
  };
  const bras = (s) => atelier().ovale(0.15, NOIR, { x: s * 0.14, sy: 0.12, sz: 0.5 }, 10).fin(0, false);
  const main = (s) => {
    const a = atelier().ovale(0.17, NOIR, { x: s * 0.15, sy: 0.09, sz: 0.38 }, 10);
    // les rémiges écartées au bout de l'aile, comme des doigts
    for (let k = 0; k < 4; k++) a.boite(0.13, 0.012, 0.035, NOIR, { x: s * 0.33, z: -0.07 + k * 0.045, ry: s * (0.25 - k * 0.15), trait: false });
    return a.fin(0, false);
  };
  const gateau = atelier().ovale(0.045, '#c98a4a', { sy: 0.55, sz: 0.8 }, 8).fin(0, false);
  return { pose: corps(true), vol: corps(false), bras: [bras(1), bras(-1)], main: [main(1), main(-1)], gateau };
}

export function creerCorbeaux(ctx, { pierre, perches, nid, arrivee, pres = 7, prendre = () => {} }) {
  const { THREE, maillage } = ctx;
  const F = formes(ctx);
  const groupe = new THREE.Group();
  groupe.visible = false;

  const nouveau = (k) => {
    const objet = new THREE.Group(), pose = maillage(F.pose), vol = maillage(F.vol), gateau = maillage(F.gateau);
    objet.scale.setScalar(TAILLE);
    gateau.position.set(0, 0.04, 0.38);
    gateau.visible = false;
    objet.add(pose, vol, gateau);
    const ailes = [0, 1].map((i) => {
      const s = i ? -1 : 1, epaule = new THREE.Group(), poignet = new THREE.Group();
      epaule.position.set(s * 0.07, 0.04, 0.04);
      poignet.position.set(s * 0.28, 0, 0);
      poignet.add(maillage(F.main[i]));
      epaule.add(maillage(F.bras[i]), poignet);
      objet.add(epaule);
      return { s, epaule, poignet };
    });
    groupe.add(objet);
    return {
      k, objet, pose, vol, gateau, ailes, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, cap: 0, roulis: 0, tangage: 0,
      phase: Math.random() * 2 * PI, bat: 1, perche: false, cible: null, cri: 2 + k * 1.7, picore: 0, t: 0,
    };
  };
  const duo = [nouveau(0), nouveau(1)];
  let mode = 'cache', etape = 0, t = 0, finVenue = null;

  /** Le but de chaque corbeau : le perchoir (le second un peu à côté, et derrière). */
  const place = (p, m) => (m.k === 0 ? { x: p.x, y: p.y, z: p.z } : { x: p.x + 0.55, y: p.y, z: p.z - 0.25 });
  function viser(p) { for (const m of duo) { m.cible = place(p, m); m.perche = false; } }

  /** Vole vers le but (la vitesse tourne peu à peu vers lui, ralentit à l'approche) ; se pose tout près. */
  function voler(m, dt) {
    const c = m.cible, dx = c.x - m.x, dy = c.y + PATTES - m.y, dz = c.z - m.z, d = Math.hypot(dx, dy, dz) || 1;
    if (d < 0.08) { Object.assign(m, { x: c.x, y: c.y + PATTES, z: c.z, vx: 0, vy: 0, vz: 0, perche: true }); return; }
    const vit = Math.min(VITESSE, Math.max(0.8, d * 1.6)), k = Math.min(1, dt * (d < 3 ? 4 : 2));
    m.vx += ((dx / d) * vit - m.vx) * k; m.vy += ((dy / d) * vit - m.vy) * k; m.vz += ((dz / d) * vit - m.vz) * k;
    m.x += m.vx * dt; m.y += m.vy * dt; m.z += m.vz * dt;
  }

  return {
    groupe,
    mode: () => mode,
    /** Fini : ils sont arrivés au sanctuaire caché. */
    guideFini: () => mode === 'nid',
    /**
     * Ils descendent du ciel jusqu'à la pierre, picorent, l'un prend le gâteau (prendre()), puis ils partent vers le
     * premier perchoir. Se résout quand ils sont arrivés au sanctuaire.
     */
    venir() {
      groupe.visible = true;
      duo.forEach((m, i) => Object.assign(m, { x: arrivee[0] + i * 1.5, y: arrivee[1] + i * 0.8, z: arrivee[2] - i, vx: 0, vy: -1, vz: 0, perche: false }));
      viser(pierre);
      mode = 'arrivee';
      etape = 0;
      return new Promise((r) => { finVenue = r; });
    },
    /** Déjà au sanctuaire (le secret a été trouvé une autre fois) : posés sur le torii. */
    installer() {
      groupe.visible = true;
      duo.forEach((m, i) => { const n = nid[i]; Object.assign(m, { x: n.x, y: n.y + PATTES, z: n.z, cap: n.cap, perche: true, cible: { ...n } }); });
      mode = 'nid';
    },
    /** joueur : { x, z } ; nuit : 0 à 1 (ils se taisent la nuit). Renvoie les croassements de cette image. */
    animer(dt, temps, joueur, nuit = 0) {
      const cris = [];
      if (mode === 'cache' || dt <= 0) return cris;
      t += dt;
      // les étapes : à la pierre, ils picorent ; ensuite, à chaque perchoir, ils attendent le joueur
      const tousPoses = duo.every((m) => m.perche);
      if (mode === 'arrivee' && tousPoses) { mode = 'mange'; t = 0; cris.push({ x: pierre.x, y: pierre.y, z: pierre.z, fort: 1 }); }
      else if (mode === 'mange') {
        duo[0].picore = duo[1].picore = 1;
        if (t > 1.6 && !duo[0].gateau.visible) { duo[0].gateau.visible = true; prendre(); }
        if (t > 2.8) { mode = 'guide'; etape = 0; viser(perches[0]); cris.push({ x: pierre.x, y: pierre.y, z: pierre.z, fort: 1 }); }
      } else if (mode === 'guide' && tousPoses) {
        const p = perches[etape];
        if (Math.hypot(joueur.x - p.x, joueur.z - p.z) < pres) {
          etape++;
          if (etape < perches.length) viser(perches[etape]);
          else { mode = 'vers-nid'; for (const m of duo) { m.cible = { ...nid[m.k] }; m.perche = false; } }
          cris.push({ x: p.x, y: p.y, z: p.z, fort: 1 });
        }
      } else if (mode === 'vers-nid' && tousPoses) {
        mode = 'nid';
        finVenue?.();
        finVenue = null;
      }
      for (const m of duo) {
        m.t += dt;
        if (!m.perche) voler(m, dt);
        const vole = !m.perche;
        if (vole) {
          const hv = Math.hypot(m.vx, m.vz);
          if (hv > 0.3) {
            const cap = Math.atan2(m.vx, m.vz), vire = (((cap - m.cap + PI) % (2 * PI) + 2 * PI) % (2 * PI) - PI) / dt;
            m.cap = cap;
            m.roulis += (Math.max(-0.7, Math.min(0.7, -vire * 0.3)) - m.roulis) * Math.min(1, dt * 3);
          }
          m.tangage += (-Math.atan2(m.vy, Math.max(0.5, hv)) * 0.6 - m.tangage) * Math.min(1, dt * 4);
          const fort = m.vy > 0.3 || Math.hypot(m.cible.x - m.x, m.cible.z - m.z) < 2.5;
          m.bat += ((fort ? 1 : 0.55 + 0.45 * Math.sin(m.t * 0.9)) - m.bat) * Math.min(1, dt * 4);
          m.phase += 2 * PI * (fort ? 4.4 : 3.2) * dt;
        } else {
          m.roulis = m.tangage = 0;
          // posé : il se tourne vers le joueur (ou vers le perchoir suivant), picore (à la pierre)
          const vise = mode === 'guide' && etape < perches.length && Math.hypot(joueur.x - m.x, joueur.z - m.z) < 2 * pres ? perches[Math.min(etape + 1, perches.length - 1)] : joueur;
          const voulu = mode === 'nid' && m.cible?.cap !== undefined && Math.hypot(joueur.x - m.x, joueur.z - m.z) > 6 ? m.cible.cap : Math.atan2(vise.x - m.x, vise.z - m.z);
          m.cap += ((((voulu - m.cap + PI) % (2 * PI)) + 2 * PI) % (2 * PI) - PI) * Math.min(1, dt * 3);
        }
        m.pose.visible = !vole;
        m.vol.visible = vole;
        for (const a of m.ailes) {
          a.epaule.visible = vole;
          if (!vole) continue;
          const A = 0.9 * m.bat, f = Math.sin(m.phase);
          a.epaule.rotation.z = a.s * (0.1 * (1 - m.bat) + A * f);
          a.poignet.rotation.z = a.s * (-0.1 * (1 - m.bat) + 0.6 * A * Math.sin(m.phase - 0.8));
        }
        // picorer : la tête (tout le corps, ici) plonge vers la pierre
        const pic = m.picore && mode === 'mange' ? Math.max(0, Math.sin(m.t * 9 + m.k * 2)) * 0.5 : 0;
        m.objet.position.set(m.x, m.y + (vole ? -0.03 * m.bat * Math.sin(m.phase) : 0), m.z);
        m.objet.rotation.set(vole ? m.tangage : pic, m.cap, vole ? m.roulis : 0, 'YXZ');
        // croasser : au perchoir, pour qu'on les retrouve (quand on est loin), et en vol de temps en temps ; pas la nuit
        m.cri -= dt;
        if (m.cri <= 0) {
          const loin = Math.hypot(joueur.x - m.x, joueur.z - m.z) > pres + 2;
          m.cri = (vole ? 5 : loin ? 3.5 : 9) + Math.random() * 4;
          if (nuit < 0.5 && (vole || loin || mode === 'nid')) cris.push({ x: m.x, y: m.y, z: m.z, fort: loin ? 1 : 0.7 });
        }
      }
      return cris;
    },
  };
}
