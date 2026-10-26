// ================================================================
//  Ce que les lieux de la balade partagent : où l'on peut marcher (le sol naturel, les planchers, les
//  escaliers), ce qui arrête (le cadre du lieu, les cercles et les murs, l'eau profonde), et quelques outils.
//  Repère des lieux : x vers l'est, z vers le sud, y vers le haut, en mètres.
// ================================================================

export const lisse = (b0, b1, v) => { const t = Math.min(1, Math.max(0, (v - b0) / (b1 - b0))); return t * t * (3 - 2 * t); };
export const hasard = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
/**
 * Un bruit doux de 0 à 1 (deux octaves de bruit lisse, une bosse toutes les « taille » mètres, contrasté pour
 * aller à peu près de 0 à 1) : des taches aux bords ronds, pas des carrés.
 */
export function bruitDoux(x, z, taille = 1) {
  const octave = (u, v) => {
    const i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j;
    const a = fu * fu * (3 - 2 * fu), b = fv * fv * (3 - 2 * fv);
    return (hasard(i, j) * (1 - a) + hasard(i + 1, j) * a) * (1 - b) + (hasard(i, j + 1) * (1 - a) + hasard(i + 1, j + 1) * a) * b;
  };
  const n = octave(x / taille, z / taille) * 0.7 + octave(x / taille * 2.3 + 17.1, z / taille * 2.3 + 5.3) * 0.3;
  return Math.min(1, Math.max(0, 0.5 + (n - 0.5) * 2.2));
}

/**
 * Le point le plus proche d'une ligne brisée [[x, z, h?], …] : sa distance d, sa hauteur h (si les points en
 * ont) et s, la longueur de ligne parcourue depuis le premier point jusqu'à lui.
 */
export function surLaLigne(points, x, z) {
  let d = Infinity, h = 0, s = 0, cumul = 0;
  for (let k = 0; k < points.length - 1; k++) {
    const [x0, z0, h0 = 0] = points[k], [x1, z1, h1 = 0] = points[k + 1];
    const dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz);
    const f = Math.min(1, Math.max(0, ((x - x0) * dx + (z - z0) * dz) / (l * l || 1)));
    const e = Math.hypot(x - x0 - f * dx, z - z0 - f * dz);
    if (e < d) { d = e; h = h0 + (h1 - h0) * f; s = cumul + f * l; }
    cumul += l;
  }
  return { d, h, s };
}

/** La plus haute marche qu'on monte (ou descend) d'un pas, en mètres. */
export const PAS = 0.6;
/** Sous un plancher plus bas que cela au-dessus de la tête, on ne passe pas. */
const TETE = 2.6;

/**
 * Le monde d'un lieu. terrain(x, z) : la hauteur du sol naturel ; cadre : [x0, x1, z0, z1], ou (x, z) → vrai
 * si l'on peut y être ; profond : sous
 * cette hauteur de sol, l'eau arrête (ou null) ; pente : sur le sol naturel, on ne monte pas une pente plus
 * raide (les parois d'un cratère ; null : pas de limite ; on peut toujours descendre). On y ajoute :
 * - des surfaces [x0, x1, z0, z1] à la hauteur h (planchers, ponts…), ou en pente (escaliers : rampe
 *   { axe: 'x' | 'z', h0, h1 }, de h0 au bord x0 / z0 à h1 au bord x1 / z1 ; ou chemin : le long d'une ligne
 *   brisée [[x, z, h], …], un escalier en biais ; ou anneau : entre les rayons r0 et r1 d'un centre, un gradin
 *   rond) ; plein : un bloc du sol à h (un pavillon fermé : ni dessus,
 *   ni dessous) ; passage : un pont assez haut pour passer dessous ; sol : ce qu'on entend en y marchant
 *   (bruitage-calcul.js : 'pierre'… ; par défaut, du bois) ;
 * - des cercles [x, z, rayon] et des murs (segments) [x0, z0, x1, z1, demi-épaisseur], qui arrêtent entre
 *   les hauteurs bas et haut (par défaut : à toute hauteur) ;
 * - pour la caméra : des blocs [x0, x1, z0, z1, bas, haut] où elle n'entre pas (un pavillon fermé, une
 *   boutique : vue de dedans, une forme fermée n'est que l'envers de son trait), et des toits (des blocs
 *   aussi) : sous un toit, elle se rapproche et passe sous le plafond (abri).
 */
export function creerMonde({ terrain, cadre, profond = -0.6, pente = null }) {
  const surfaces = [], cercles = [], murs = [], blocs = [], toits = [];
  const dansAnneau = ([cx, cz, r0, r1], x, z) => { const d = Math.hypot(x - cx, z - cz); return d >= r0 && d <= r1; };
  const dedans = (s, x, z) => x >= s.x0 && x <= s.x1 && z >= s.z0 && z <= s.z1 && (!s.ligne || dansLaLigne(s, x, z))
    && (!s.anneau || dansAnneau(s.anneau, x, z));
  // (un chemin aux bouts droits, s.droits : une dalle ; pas au-delà de son premier ni de son dernier point. Aux bouts ronds,
  // une dalle de pierre se prolongeait d'une demi-largeur dans le vide, et l'on y marchait en l'air : Takachiho, 2026-10-26,
  // jusqu'à 50 cm au-dessus des marches du sanctuaire, 18 cm au-dessus du chemin aux bouts de la dalle du canal)
  const dansLaLigne = (s, x, z) => {
    if (surLaLigne(s.ligne, x, z).d > s.demi) return false;
    if (!s.droits) return true;
    const L = s.ligne, [ax, az] = L[0], [bx, bz] = L[1], [cx, cz] = L[L.length - 2], [dx, dz] = L[L.length - 1];
    return (x - ax) * (bx - ax) + (z - az) * (bz - az) >= 0 && (x - dx) * (dx - cx) + (z - dz) * (dz - cz) <= 0;
  };
  const hauteurDe = (s, x, z) => {
    if (s.ligne) return surLaLigne(s.ligne, x, z).h;
    if (!s.rampe) return s.h;
    const { axe, h0, h1 } = s.rampe;
    const f = axe === 'x' ? (x - s.x0) / (s.x1 - s.x0) : (z - s.z0) / (s.z1 - s.z0);
    return h0 + (h1 - h0) * Math.min(1, Math.max(0, f));
  };

  /**
   * Où se tient quelqu'un en x, z qui arrive de la hauteur y : la plus haute surface qu'il atteint d'un pas
   * (jamais le dessus d'un bloc plein : posé dedans, un passant y montait, sur le toit d'une boutique), et
   * laquelle (null : le sol naturel ; à 2 cm près, la surface : un escalier posé à fleur du sol). Un plancher
   * d'étage (etage : un grenier, où l'on monte par une échelle) ne compte que pour qui vient de quelque part (y
   * fini) : sans y, on cherche le sol, pas l'étage (un passant, un départ).
   */
  function poserPied(x, z, y) {
    const sol = terrain(x, z);
    let choix = sol <= y + PAS ? sol : -Infinity, bas = sol, surface = null;
    for (const s of surfaces) {
      if (s.plein || (s.etage && y === Infinity) || !dedans(s, x, z)) continue;
      const h = hauteurDe(s, x, z);
      // (à 2 cm près, une surface l'emporte sur le sol naturel : là où le sol passait à peine au-dessus d'un escalier,
      // c'est lui qu'on suivait, et sa pente arrêtait le voyageur ; 2026-10-24, le haut de l'escalier du sanctuaire de
      // Gokayama)
      if (h <= y + PAS && h >= (surface ? choix : choix - 0.02)) { choix = h; surface = s; }
      if (h < bas) bas = h;
    }
    return choix > -Infinity ? { h: choix, surface } : { h: bas, surface: null };
  }
  /** La hauteur où se tient quelqu'un en x, z qui arrive de la hauteur y (poserPied). */
  const hauteur = (x, z, y = Infinity) => poserPied(x, z, y).h;

  /** Le point x, z le plus proche sur le segment, et la distance. */
  function versMur(m, x, z) {
    const [x0, z0, x1, z1] = m;
    const dx = x1 - x0, dz = z1 - z0, l = dx * dx + dz * dz || 1;
    const f = Math.min(1, Math.max(0, ((x - x0) * dx + (z - z0) * dz) / l));
    return Math.hypot(x - (x0 + f * dx), z - (z0 + f * dz));
  }

  /**
   * Peut-on être en x, z en venant de la hauteur y ? (le cadre, les cercles et les murs à cette hauteur, le
   * dessous des planchers, l'eau profonde, et pas plus d'une marche à monter ou descendre).
   * autres : des cercles de plus [x, z, rayon] (les passants).
   */
  function libre(x, z, y, autres = []) {
    if (typeof cadre === 'function' ? !cadre(x, z) : x < cadre[0] || x > cadre[1] || z < cadre[2] || z > cadre[3]) return false;
    for (const [cx, cz, r, bas = -Infinity, haut = Infinity] of cercles) {
      if (y >= bas && y <= haut && (x - cx) ** 2 + (z - cz) ** 2 < r * r) return false;
    }
    for (const [cx, cz, r] of autres) if ((x - cx) ** 2 + (z - cz) ** 2 < r * r) return false;
    for (const m of murs) {
      const [, , , , r, bas = -Infinity, haut = Infinity] = m;
      if (y >= bas && y <= haut && versMur(m, x, z) < r) return false;
    }
    const { h, surface } = poserPied(x, z, y);
    for (const s of surfaces) {
      if (s.rampe || s.ligne || s.passage || !dedans(s, x, z) || s.h <= y + PAS) continue;
      // un bloc plein (un pavillon fermé), ou un plancher trop bas pour passer dessous
      if (s.plein || s.h - y < TETE) return false;
    }
    if (profond !== null && !surface && h < profond) return false;
    if (pente !== null && h > y + 0.005 && !surface && raideur(x, z) > pente) return false;
    return Math.abs(h - y) < PAS;
  }

  /** La pente du sol naturel en x, z (la hauteur gagnée par mètre, dans le sens où il monte le plus). */
  function raideur(x, z) {
    const e = 0.3;
    return Math.hypot(terrain(x + e, z) - terrain(x - e, z), terrain(x, z + e) - terrain(x, z - e)) / (2 * e);
  }

  /** Ce qu'on entend en marchant sur la surface où l'on se tient en x, z, à la hauteur y ('bois' par défaut). */
  function solSous(x, z, y) {
    let sol = 'bois', ecart = 0.2;
    for (const s of surfaces) {
      if (s.plein || !dedans(s, x, z)) continue;
      const e = Math.abs(hauteurDe(s, x, z) - y);
      if (e < ecart) { ecart = e; sol = s.sol || 'bois'; }
    }
    return sol;
  }

  /** Le dessous du plus bas toit au-dessus de la hauteur y, en x, z (Infinity : à ciel ouvert). */
  function abri(x, z, y) {
    let bas = Infinity;
    for (const [x0, x1, z0, z1, b] of toits) if (x >= x0 && x <= x1 && z >= z0 && z <= z1 && b > y && b < bas) bas = b;
    return bas;
  }

  /** Où le rayon o + t·d entre dans le bloc grossi de m (Infinity : il ne le touche pas, ou part de dedans). */
  function entree(o, d, [x0, x1, z0, z1, bas, haut], m) {
    let t0 = 0, t1 = Infinity;
    for (const [p, v, a, b] of [[o.x, d.x, x0 - m, x1 + m], [o.y, d.y, bas - m, haut + m], [o.z, d.z, z0 - m, z1 + m]]) {
      if (p < a || p > b) {
        if (Math.abs(v) < 1e-9) return Infinity;
      } else if (Math.abs(v) < 1e-9) continue;
      let ta = (a - p) / v, tb = (b - p) / v;
      if (ta > tb) [ta, tb] = [tb, ta];
      t0 = Math.max(t0, ta);
      t1 = Math.min(t1, tb);
    }
    return t0 > 0 && t0 <= t1 ? t0 : Infinity;
  }

  /**
   * Jusqu'où la caméra peut reculer depuis o (la tête du joueur) dans la direction d (unitaire) sans entrer
   * dans un bloc (à 30 cm près ; à 2 cm près si le joueur est collé contre) ; au plus loin.
   */
  function visee(o, d, loin) {
    let t = loin;
    for (const b of blocs) {
      const e = entree(o, d, b, 0.3);
      t = Math.min(t, e < Infinity || !dedans3(o, b, 0.3) ? e : entree(o, d, b, 0.02));
    }
    return t;
  }
  const dedans3 = (o, [x0, x1, z0, z1, bas, haut], m) => o.x >= x0 - m && o.x <= x1 + m && o.y >= bas - m && o.y <= haut + m && o.z >= z0 - m && o.z <= z1 + m;

  return {
    terrain, cadre, surfaces, cercles, murs, blocs, toits, hauteur, libre, abri, visee, raideur, solSous,
    surface(x0, x1, z0, z1, h, o = {}) { surfaces.push({ x0, x1, z0, z1, h, ...o }); },
    rampe(x0, x1, z0, z1, axe, h0, h1, o = {}) { surfaces.push({ x0, x1, z0, z1, h: Math.max(h0, h1), rampe: { axe, h0, h1 }, ...o }); },
    /**
     * Un chemin en pente le long de la ligne brisée points [[x, z, h], …], de demi-largeur demi (un escalier en biais) ;
     * o.droits : ses bouts sont droits (une dalle), sinon ronds.
     */
    chemin(points, demi, o = {}) {
      const xs = points.map((p) => p[0]), zs = points.map((p) => p[1]);
      surfaces.push({ x0: Math.min(...xs) - demi, x1: Math.max(...xs) + demi, z0: Math.min(...zs) - demi, z1: Math.max(...zs) + demi, h: Math.max(...points.map((p) => p[2])), ligne: points, demi, ...o });
    },
    /** Un gradin rond : à la hauteur h, entre les rayons r0 et r1 autour de cx, cz. */
    anneau(cx, cz, r0, r1, h, o = {}) { surfaces.push({ x0: cx - r1, x1: cx + r1, z0: cz - r1, z1: cz + r1, h, anneau: [cx, cz, r0, r1], ...o }); },
    cercle(x, z, r, bas, haut) { cercles.push([x, z, r, bas, haut]); },
    mur(x0, z0, x1, z1, r = 0.15, bas, haut) { murs.push([x0, z0, x1, z1, r, bas, haut]); },
    bloc(x0, x1, z0, z1, bas, haut) { blocs.push([x0, x1, z0, z1, bas, haut]); },
    toit(x0, x1, z0, z1, bas, haut) { toits.push([x0, x1, z0, z1, bas, haut]); blocs.push([x0, x1, z0, z1, bas, haut]); },
    /** Les bords d'un plancher rectangulaire (des garde-corps), sauf les ouvertures [x ou z, largeur] de chaque côté. */
    gardeCorps(x0, x1, z0, z1, h, ouvertures = {}) {
      const cote = (a0, a1, fixe, axe, trous = []) => {
        let debut = a0;
        const coupures = [...trous].sort((p, q) => p[0] - q[0]);
        for (const [c, l] of [...coupures, [a1 + 1, 0]]) {
          const fin = Math.min(a1, c - l / 2);
          if (fin > debut) axe === 'x' ? murs.push([debut, fixe, fin, fixe, 0.12, h - 0.3, h + 2]) : murs.push([fixe, debut, fixe, fin, 0.12, h - 0.3, h + 2]);
          debut = c + l / 2;
        }
      };
      cote(x0, x1, z0, 'x', ouvertures.nord);
      cote(x0, x1, z1, 'x', ouvertures.sud);
      cote(z0, z1, x0, 'z', ouvertures.ouest);
      cote(z0, z1, x1, 'z', ouvertures.est);
    },
  };
}

/**
 * Un banc : { de: [x, z], a: [x, z] (la ligne où l'on peut s'asseoir, d'un bout à l'autre), y (le dessus de l'assise),
 * cap (vers où l'on regarde, assis), vue (la caméra, assis : de combien elle tourne autour, en radians ; 0,35 par
 * défaut) }. Le point de cette ligne le plus proche de x, z, et f, où il est (0 : de, 1 : a).
 */
export function pointDuBanc(b, x, z) {
  const [x0, z0] = b.de, dx = b.a[0] - x0, dz = b.a[1] - z0, l2 = dx * dx + dz * dz;
  const f = l2 > 1e-4 ? Math.min(1, Math.max(0, ((x - x0) * dx + (z - z0) * dz) / l2)) : 0;
  return { x: x0 + f * dx, z: z0 + f * dz, f };
}

/** Les bancs d'un lieu → leurs interactions : on s'y assoit où l'on est, sur toute leur longueur (jeu.asseoirSurBanc). */
export function interactionsBancs(bancs) {
  return bancs.map((b, i) => ({
    id: `banc-${i}`, verbe: 'asseoir', rayon: 1.5, haut: 1.2,
    pres: (x, z) => pointDuBanc(b, x, z),
    action: (jeu) => jeu.asseoirSurBanc(b),
  }));
}

/**
 * Un passant qui va d'un point à l'autre de sa ronde (et s'y arrête un moment), ou reste sur place ; il
 * s'arrête et se tourne vers le joueur quand on lui parle. assis : le dessus du banc où il est assis (il n'en
 * bouge pas, sa racine ASSIS plus bas). Renvoie l'état à faire avancer chaque image.
 */
export function creerPassant({ x, z, cap = 0, ronde = null, vitesse = 1.1, attente = [2, 6], assis = null }) {
  return { x, z, y: assis ?? 0, cap, ronde, vitesse, attente, etape: 0, pause: 1 + Math.random() * 2, v: 0, parle: false, assis };
}
/** Assis, la racine d'un personnage est à cette hauteur sous le dessus du siège (personnages.js : asseoir). */
export const ASSIS = 0.38;

/** Fait avancer un passant de dt secondes dans le monde ; joueur : { x, z } (pour lui faire face). */
export function avancerPassant(p, dt, monde, joueur, autres) {
  if (p.assis != null) { p.y = p.assis - ASSIS; return; }
  let voulu = 0;
  if (p.parle) {
    p.cap = tourner(p.cap, Math.atan2(joueur.x - p.x, joueur.z - p.z), dt * 6);
  } else if (p.ronde && p.ronde.length) {
    if (p.pause > 0) p.pause -= dt;
    else {
      const [tx, tz] = p.ronde[p.etape];
      const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
      if (d < 0.25) {
        p.etape = (p.etape + 1) % p.ronde.length;
        p.pause = p.attente[0] + Math.random() * (p.attente[1] - p.attente[0]);
      } else {
        voulu = p.vitesse;
        p.cap = tourner(p.cap, Math.atan2(dx, dz), dt * 5);
        const nx = p.x + Math.sin(p.cap) * p.v * dt, nz = p.z + Math.cos(p.cap) * p.v * dt;
        // il attend que le joueur (ou un autre) s'écarte
        if (monde.libre(nx, nz, p.y, autres)) { p.x = nx; p.z = nz; } else voulu = 0;
      }
    }
  }
  p.v += (voulu - p.v) * Math.min(1, dt * 6);
  // (la hauteur du sol, seulement quand il a bougé : la plupart restent à leur place ; une vingtaine de calculs du relief par
  // image de moins, 2026-10-25)
  if (p.x !== p.hx || p.z !== p.hz || p.hy === undefined) { p.hy = monde.hauteur(p.x, p.z, p.y); p.hx = p.x; p.hz = p.z; }
  p.y += (p.hy - p.y) * Math.min(1, dt * 14);
}

export function tourner(a, b, f) {
  const d = ((b - a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
  return a + d * Math.min(1, f);
}
