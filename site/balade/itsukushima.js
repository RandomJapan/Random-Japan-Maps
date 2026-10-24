// ================================================================
//  Itsukushima (Miyajima) : le sanctuaire bâti sur la mer et son grand torii, à marée basse. On arrive sur
//  la plage à l'est ; à l'ouest, le sanctuaire sur pilotis : on y entre par la galerie de l'est, on passe
//  devant le pavillon de prière, on va jusqu'au bout de la plate-forme (le torii juste en face), on ressort
//  par la galerie de l'ouest, devant la scène de nō. Au sud-est, la rue des boutiques et la colline de la
//  pagode. On peut aussi marcher sur l'estran jusqu'au torii. D'après la vidéo du propriétaire.
//  Son secret (2026-10-23) : les corbeaux sacrés. Une douceur posée sur la pierre plate cachée derrière la pagode, deux
//  corbeaux qui la prennent et mènent jusqu'au bosquet de bambous du sud-ouest, qui s'ouvre sur un petit sanctuaire
//  oublié ; un koban sur son plateau d'offrandes (tresors.js). Bunbuku, le marchand, attend sous les pins du sud.
//  Repère : x vers l'est, z vers le sud, y vers le haut, en mètres ; la mer est au nord, à y = 0 ; l'estran
//  est à −0,27 (sous 27 cm d'eau). ctx : { THREE, atelier, P (palette), peinture }.
// ================================================================
import { creerMonde, interactionsBancs, lisse, hasard, bruitDoux } from './monde.js';
import { panneau, trepied, PAPIER_PANNEAU } from './decor.js';
import { MATIERES as M } from './textures.js';
import { creerCorbeaux } from './corbeaux.js';
import { secretTrouve } from './tresors.js';

const PLANCHER = 1.72; // les planchers du sanctuaire (au-dessus de la mer haute)
const BORD = 0.35; // on marche à cette distance des garde-corps
const TORII = { x: 0, z: -70, ecart: 5.6, appui: 2.7 };
const TORII_HAUT = 14.95; // le dessus du linteau du haut, à 3,6 m du milieu (un goéland s'y pose)
const COLLINE = { x: 46, z: 34, haut: 5 };
// le secret : la pierre plate des offrandes, derrière la pagode ; le bosquet de bambous fermé (sa porte, à l'est) et le
// petit sanctuaire oublié au milieu
const PIERRE = { x: 49.6, z: 44.0 };
const BOSQUET = { x: 15, z: 40.6, r: 4.5, porte: Math.PI / 2, ouverture: 0.34 };
const HOKORA = { x: 12.7, z: 40.6 };
const TORII_CACHE = { x: 14.9, z: 40.6 };
const SANBO = { x: 13.75, z: 40.6 };

/** Le sol naturel : la baie (l'estran) devant le sanctuaire, la plage à l'est, la terre au sud et la colline. */
function solNaturel(x, z) {
  // la rive : vers z = −6 pour la plage (à l'est), z = 15 au fond de la baie (à l'ouest)
  const rive = 15 + (-6 - 15) * lisse(10, 20, x);
  const d = z - rive; // > 0 : vers la terre
  let h;
  if (d < -6) h = -0.27 - Math.min(0.08, (-6 - d) * 0.0015);
  else if (d < 8) h = -0.27 + ((d + 6) / 14) * 1.27;
  else h = 1.0 + Math.min(1.2, (d - 8) * 0.03);
  if (z < -86) h -= Math.min(3, (-86 - z) * 0.25);
  // les rides du sable, la colline de la pagode, les collines du sud
  h += 0.03 * Math.sin(x * 0.7 + z * 0.3) * Math.sin(z * 0.9 + x * 0.1) * (d < 8 ? 1 : 0.3);
  const c = Math.hypot(x - COLLINE.x, z - COLLINE.z);
  h += COLLINE.haut * lisse(17, 7, c);
  h += 4 * lisse(40, 60, z) * (1 - lisse(30, 60, c));
  return h;
}

// l'escalier de pierre de la colline : droit vers la pagode, du bout de la rue (au nord) jusqu'au plateau, ses
// marches entre deux murets ; h0, h1 : le sol naturel à ses deux bouts. (Le premier, de biais sur le flanc
// rond de la colline, s'y enfonçait d'un côté et flottait de l'autre : 2026-10-22.)
const ESCALIER = { x: 46, z0: 19.5, z1: 27.6, h0: solNaturel(46, 19.5), h1: solNaturel(46, 27.6) };
const rampe = (z) => ESCALIER.h0 + (ESCALIER.h1 - ESCALIER.h0) * Math.min(1, Math.max(0, (z - ESCALIER.z0) / (ESCALIER.z1 - ESCALIER.z0)));

/**
 * Le sol : le sol naturel, creusé pour l'escalier. Sous les marches (pleines jusque-là), il s'enfonce ; sous
 * les murets, puis derrière eux, il ne dépasse pas leur haut, et rejoint la colline. Le maillage du sol a un
 * point par mètre (x et z entiers) : ceux de |x − 46| ≤ 1 sont sous les marches, ceux de 2 sous les murets.
 */
function terrain(x, z) {
  const h = solNaturel(x, z), E = ESCALIER, dx = Math.abs(x - E.x);
  if (dx > 4.6 || z < E.z0 - 1 || z > E.z1 + 1) return h;
  const dans = lisse(E.z0 - 0.2, E.z0 + 0.6, z) * lisse(E.z1 + 0.5, E.z1 + 0.1, z);
  if (dans <= 0) return h;
  const r = rampe(z), talus = Math.min(h, r + 0.3);
  const v = dx <= 1.05 ? r - 0.6 : dx <= 2.1 ? talus : h + (talus - h) * (1 - lisse(2.1, 4.6, dx));
  return h + (v - h) * dans;
}

// les galeries et les pavillons : [x0, x1, z0, z1] (le plancher, garde-corps compris)
const GALERIES = {
  est1: [8, 21, 6, 10], // de l'entrée vers l'ouest, au bord de la baie
  est2: [8, 12, -12, 10], // puis vers le nord
  est3: [6, 12, -12, -8], // jusqu'au pavillon de purification
  ouest1: [-22, -6, -12, -8], // du pavillon vers l'ouest
  ouest2: [-26, -22, -12, 12], // puis vers le sud, jusqu'à la sortie
};
const HARAIDEN = [-6, 6, -12, -4]; // le pavillon de purification (ouvert, on y passe)
const HAIDEN = [-5, 5, -4, 2]; // le pavillon de prière (fermé)
const HONDEN = [-6, 6, 2, 14]; // le pavillon principal (fermé)
const HIRABUTAI = [-9, 9, -26, -12]; // la grande plate-forme sur la mer
const TAKABUTAI = [-2.5, 2.5, -21, -16]; // la scène de danse, sur la plate-forme
const HITAKISAKI = [-2.5, 2.5, -31, -26]; // la pointe, face au torii
const NO = { x: -16, z: -23 }; // la scène de nō (tournée vers l'est, vers la plate-forme)
// les bancs de la plage face au torii : le long de chacun, libre : là où l'on peut s'asseoir (le grand-père, sur le second, en
// occupe un bout, à s = −0,45)
const BANCS_PLAGE = [{ x: 21, z: 1.6, libre: [-0.6, 0.6] }, { x: 37, z: 1.9, libre: [0.05, 0.6] }].map((b) => ({ ...b, cap: Math.atan2(TORII.x - b.x, TORII.z - b.z) }));
// la barque du batelier, dans l'eau de l'estran, la proue vers le torii ; pieu : son pieu d'amarrage, sur le sable
const BARQUE = { x: 23.9, z: -13, cap: Math.atan2(TORII.x - 23.9, TORII.z + 13), pieu: [25.7, -8.4] };
const GRAND_PERE = ((b) => ({ x: b.x - Math.cos(b.cap) * 0.45, z: b.z + Math.sin(b.cap) * 0.45, cap: b.cap, assis: terrain(b.x, b.z) + 0.44 }))(BANCS_PLAGE[1]);
const HN = PLANCHER + 0.2; // son plancher

/** Les couleurs qui s'allument la nuit (styles.js) : les lanternes de bronze, les fenêtres ; le vermillon du torii et du sanctuaire, illuminés. */
export const sortesNuit = (P) => ({ [P.fenetre]: 'lumiere', [P.vermillon]: 'illumine', [P.vermillonFonce]: 'illumine' });

/** Ce que le carnet et le menu savent du lieu, sans le construire. */
export const infos = {
  id: 'itsukushima', carte: 'itsukushima-jinja', video: '7647214222648151318',
  nom: { en: 'Itsukushima', fr: 'Itsukushima', ja: '厳島神社' }, nomJa: '厳島神社',
  tampons: [
    { id: 'torii', motif: 'torii', ja: '大鳥居', encre: '#c8372d' },
    { id: 'sanctuaire', motif: 'sanctuaire', ja: '御本社', encre: '#b8323a', forme: 'carre' },
    { id: 'pagode', motif: 'pagode', ja: '五重塔', encre: '#2f4a8a' },
    { id: 'daim', motif: 'daim', ja: '神鹿', encre: '#7a4a2a', forme: 'carre' },
    { id: 'momiji', motif: 'momiji', ja: 'もみじ饅頭', encre: '#c4561e' },
  ],
  get textes() { return TEXTES; },
};

export function construire(ctx) {
  const { THREE, atelier, P, peinture } = ctx;
  const PI = Math.PI;
  const objets = []; // { fin, x, y, z, ry, ombre }
  const bancs = []; // où l'on s'assoit (monde.js : pointDuBanc)
  const lumieres = []; // les lanternes allumées la nuit : leur halo, leur lumière au sol (lueurs.js)
  const monde = creerMonde({ terrain, cadre: [-56, 64, -80, 46] });
  const poser = (fin, x, z, o = {}) => objets.push({ fin, x, z, y: o.y ?? monde.hauteur(x, z), ry: o.ry || 0, ombre: o.ombre !== false });
  // les textes peints (etiquettes.js) : ecrire(pose de l'objet { x, y, z, ry }, étiquette dans son repère)
  const etiquettes = [];
  const ecrire = (o, e) => {
    const c = Math.cos(o.ry || 0), sn = Math.sin(o.ry || 0);
    etiquettes.push({ ...e, x: o.x + e.x * c + e.z * sn, y: o.y + e.y, z: o.z - e.x * sn + e.z * c, ry: (o.ry || 0) + (e.ry || 0) });
  };

  // ---------------------------------------------------------------- Le grand torii (Ō-torii), dans la mer
  // deux piliers de camphrier, chacun tenu par deux piliers d'appui (le style ryōbu), le linteau du bas qui
  // dépasse, la plaque, le linteau du haut aux bouts relevés
  {
    const a = atelier();
    const { ecart: ex, appui: az } = TORII;
    for (const s of [-1, 1]) {
      a.cylindre(0.6, 0.72, 13.6, 16, P.vermillon, { x: s * ex, y: 6.3, rz: s * 0.018 })
        .cylindre(0.8, 0.82, 1.0, 16, P.noir, { x: s * ex, y: -0.05 });
      for (const t of [-1, 1]) {
        a.cylindre(0.3, 0.34, 8.8, 12, P.vermillon, { x: s * ex, y: 3.9, z: t * az })
          .cylindre(0.4, 0.42, 0.8, 12, P.noir, { x: s * ex, y: -0.1, z: t * az })
          .boite(0.26, 0.4, az, P.vermillon, { x: s * ex, y: 3.0, z: (t * az) / 2 })
          .boite(0.26, 0.4, az, P.vermillon, { x: s * ex, y: 7.2, z: (t * az) / 2 })
          .boite(0.95, 0.22, 0.95, P.noir, { x: s * ex, y: 8.35, z: t * az });
      }
    }
    a.boite(15.8, 0.64, 0.5, P.vermillon, { y: 10.7 })
      .boite(0.5, 1.9, 0.42, P.vermillon, { y: 12.0 })
      .boite(1.7, 2.3, 0.2, P.or, { y: 12.0, z: 0.28 })
      .boite(1.45, 2.05, 0.22, P.noir, { y: 12.0, z: 0.3 })
      .piece(new THREE.BoxGeometry(20.5, 0.72, 0.85, 20, 1, 1), P.vermillon, { y: 13.25, deformer: (x, y, z) => [x, y + 0.45 * (x / 10.25) ** 2, z] })
      .piece(new THREE.BoxGeometry(23.8, 0.9, 1.15, 24, 1, 1), P.vermillon, { y: 14.1, deformer: (x, y, z) => [x, y + 0.85 * (x / 11.9) ** 2 + 0.45 * (x / 11.9) ** 8, z] })
      .piece(new THREE.BoxGeometry(24.4, 0.36, 1.45, 24, 1, 1), P.noir, { y: 14.7, deformer: (x, y, z) => [x, y + 0.87 * (x / 12.2) ** 2 + 0.47 * (x / 12.2) ** 8, z] });
    poser(a.fin(0, peinture), TORII.x, TORII.z, { y: 0 });
    for (const s of [-1, 1]) {
      monde.cercle(TORII.x + s * TORII.ecart, TORII.z, 1.05);
      for (const t of [-1, 1]) monde.cercle(TORII.x + s * TORII.ecart, TORII.z + t * TORII.appui, 0.6);
    }
  }

  // ---------------------------------------------------------------- Les planchers sur pilotis
  /** Un plancher [x0, x1, z0, z1] : planches, poutres, pilotis sombres jusqu'à l'estran. */
  function plancher(a, [x0, x1, z0, z1], { pas = 2.4 } = {}) {
    const lx = x1 - x0, lz = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    a.boite(lx, 0.22, lz, P.boisFonce, { x: cx, y: PLANCHER - 0.13, z: cz });
    // les planches, en travers du plus long côté, chacune d'une teinte de bois un peu différente ; entre
    // elles, le bois sombre des poutres fait les joints
    const teinte = (u) => [P.bois, P.bois2, P.bois3][Math.floor(hasard(u * 3.1, x0 + z0) * 3)];
    // (la dernière planche, plus étroite, s'arrête au bord : elle ne déborde pas sur le plancher voisin)
    if (lx >= lz) for (let x = x0; x < x1 - 0.01; x += 0.6) { const l = Math.min(0.57, x1 - x); a.boite(l, 0.04, lz - 0.1, teinte(x), { x: x + l / 2, y: PLANCHER, z: cz, trait: false, nuance: 0.03 }); }
    else for (let z = z0; z < z1 - 0.01; z += 0.6) { const l = Math.min(0.57, z1 - z); a.boite(lx - 0.1, 0.04, l, teinte(z), { x: cx, y: PLANCHER, z: z + l / 2, trait: false, nuance: 0.03 }); }
    const nx = Math.max(1, Math.round(lx / pas)), nz = Math.max(1, Math.round(lz / pas));
    for (let i = 0; i <= nx; i++) {
      for (let j = 0; j <= nz; j++) {
        const x = x0 + 0.2 + ((lx - 0.4) * i) / nx, z = z0 + 0.2 + ((lz - 0.4) * j) / nz;
        const sol = terrain(x, z);
        a.boite(0.26, PLANCHER - sol + 0.1, 0.26, P.noir, { x, y: (PLANCHER + sol) / 2 - 0.1, z });
      }
    }
  }

  /**
   * Les garde-corps vermillon le long de bords : [[x0, z0, x1, z1], …], hauteur 0,8 m. Chaque côté est un
   * peu plus haut que le précédent (quelques millimètres) : aux angles, deux lisses ne sont pas dans le même plan.
   */
  let lisses = 0;
  function gardeCorps(a, bords) {
    for (const [x0, z0, x1, z1] of bords) {
      const l = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0);
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, dy = (lisses++ % 4) * 0.006;
      a.boite(0.13, 0.1, l, P.vermillon, { x: cx, y: PLANCHER + 0.78 + dy, z: cz, ry })
        .boite(0.1, 0.08, l, P.vermillon, { x: cx, y: PLANCHER + 0.26 + dy, z: cz, ry });
      const n = Math.max(1, Math.round(l / 0.6));
      for (let i = 1; i < n; i++) {
        const f = i / n;
        a.boite(0.06, 0.52, 0.06, P.vermillon, { x: x0 + (x1 - x0) * f, y: PLANCHER + 0.52, z: z0 + (z1 - z0) * f, trait: false });
      }
    }
  }

  /** Les poteaux vermillon d'un pavillon ou d'une galerie, sur le plancher, tous les `pas` mètres le long des bords. */
  function poteaux(a, [x0, x1, z0, z1], h, { pas = 2.4 } = {}) {
    const nx = Math.max(1, Math.round((x1 - x0) / pas)), nz = Math.max(1, Math.round((z1 - z0) / pas));
    for (let i = 0; i <= nx; i++) {
      for (let j = 0; j <= nz; j++) {
        if (i > 0 && i < nx && j > 0 && j < nz) continue;
        const x = x0 + 0.2 + ((x1 - x0 - 0.4) * i) / nx, z = z0 + 0.2 + ((z1 - z0 - 0.4) * j) / nz;
        a.boite(0.26, h, 0.26, P.vermillon, { x, y: PLANCHER + h / 2, z });
      }
    }
  }

  // ---- Les galeries (kairō) : plancher, poteaux, garde-corps sur les longs côtés, plafond blanc, toit à deux
  // pentes en écorce de cyprès, lanternes de bronze pendues une travée sur deux
  // Aux angles, deux galeries se croisent : une seule y pose son plancher et ses poteaux (sol : le plancher, s'il
  // est plus court que la galerie), et le plafond et le toit de l'autre sont 2 cm plus haut (dy) ; dans le même
  // plan, les deux scintillaient à l'écran.
  function galerie([x0, x1, z0, z1], { bords = [], dy = 0, sol = [x0, x1, z0, z1] } = {}) {
    const a = atelier();
    const h = 2.6, selonX = x1 - x0 >= z1 - z0;
    plancher(a, sol);
    poteaux(a, sol, h);
    gardeCorps(a, bords);
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, L = selonX ? x1 - x0 : z1 - z0, l = selonX ? z1 - z0 : x1 - x0;
    const ry = selonX ? 0 : PI / 2;
    const r = dy ? 0.04 : 0; // (sa poutre un peu en retrait de celle de l'autre galerie)
    a.boite(x1 - x0 - r, 0.24, z1 - z0 - r, P.vermillon, { x: cx, y: PLANCHER + h + 0.05 + dy, z: cz })
      .boite(x1 - x0 - 0.3, 0.06, z1 - z0 - 0.3, P.blanc, { x: cx, y: PLANCHER + h + 0.2 + dy, z: cz, trait: false })
      .pignon(L + 1.2, 1.1, l + 1.6, P.toit, { ry, x: cx, y: PLANCHER + h + 0.22 + dy, z: cz })
      .boite(selonX ? L + 1.3 : 0.32, 0.24, selonX ? 0.32 : L + 1.3, P.toitBord, { x: cx, y: PLANCHER + h + 1.34 + dy, z: cz });
    const n = Math.round(L / 2.4);
    for (let i = 1; i < n; i += 2) {
      const u = -L / 2 + ((i + 0.5) * L) / n;
      const x = selonX ? cx + u : cx, z = selonX ? cz : cz + u;
      // (le bronze, et au milieu la bande des fenêtres de papier : elle s'allume la nuit, sortesNuit)
      const yl = PLANCHER + h - 0.8;
      a.cylindre(0.02, 0.02, 0.5, 4, P.noir, { x, y: PLANCHER + h - 0.35, z, trait: false })
        .piece(new THREE.CylinderGeometry(0.2, 0.26, 0.42, 6, 3), P.bronze, { x, y: yl, z, teinte: (x2, y2) => (Math.abs(y2 - yl) < 0.07 ? P.fenetre : P.bronze) })
        .cone(0.36, 0.22, 6, P.bronze, { x, y: PLANCHER + h - 0.48, z });
      lumieres.push({ x, y: PLANCHER + h - 0.85, z, halo: 0.45, sol: PLANCHER, r: 1.6 });
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
    // pour la caméra : le toit, des poutres du plafond au faîte, débords compris
    const [dx, dz] = selonX ? [0.6, 0.8] : [0.8, 0.6];
    monde.toit(x0 - dx, x1 + dx, z0 - dz, z1 + dz, PLANCHER + h - 0.1, PLANCHER + h + 1.5);
  }
  const G = GALERIES;
  galerie(G.est1, { bords: [[8.2, 10, 21, 10], [12, 6, 21, 6]], dy: 0.02, sol: [12, 21, 6, 10] });
  galerie(G.est2, { bords: [[8, -8, 8, 10], [12, -12, 12, 6]] });
  galerie(G.est3, { bords: [[9.4, -12, 12, -12], [6, -8, 8, -8]], dy: 0.02, sol: [6, 8, -12, -8] });
  galerie(G.ouest1, { bords: [[-22, -12, -9.4, -12], [-22, -8, -6, -8]], dy: 0.02 });
  galerie(G.ouest2, { bords: [[-26, -12, -26, 12], [-22, -8, -22, 12]] });

  // les escaliers de l'entrée (à l'est, sur la plage) et de la sortie (au sud-ouest, sur la terre)
  function escalier(x0, x1, z0, z1, axe) {
    const a = atelier();
    const n = 7, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    // le haut est du côté du sanctuaire (x0 ou z0), le bas sur la terre (x1 ou z1)
    const bas = axe === 'x' ? terrain(x1, cz) : terrain(cx, z1);
    for (let i = 0; i < n; i++) {
      const f = (i + 0.5) / n, h = PLANCHER + (bas - PLANCHER) * f;
      // (les marches se recouvrent de 5 cm : leurs flancs, une sur deux 1 cm en retrait, ne sont pas dans le même plan)
      const r = (i % 2) * 0.02;
      if (axe === 'x') a.boite((x1 - x0) / n + 0.05, 0.18, z1 - z0 - r, P.bois, { x: x0 + f * (x1 - x0), y: h - 0.09, z: cz });
      else a.boite(x1 - x0 - r, 0.18, (z1 - z0) / n + 0.05, P.bois, { x: cx, y: h - 0.09, z: z0 + f * (z1 - z0) });
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
    if (axe === 'x') monde.rampe(x0, x1, z0 + BORD, z1 - BORD, 'x', PLANCHER, bas);
    else monde.rampe(x0 + BORD, x1 - BORD, z0, z1, 'z', PLANCHER, bas);
  }
  escalier(21, 24, 6, 10, 'x');
  escalier(-26, -22, 12, 15.5, 'z');

  // ---- Le pavillon de purification (haraiden) : ouvert, un grand toit ; la boîte à offrandes et la cloche
  // devant le pavillon de prière
  {
    const a = atelier();
    plancher(a, HARAIDEN);
    poteaux(a, HARAIDEN, 3.0, { pas: 3 });
    gardeCorps(a, [[6, -8, 6, -4], [-6, -8, -6, -4]]);
    a.boite(12.2, 0.3, 8.2, P.vermillon, { y: PLANCHER + 3.05, z: -8 })
      .toitJapon(15, 11, 3.2, 0.3, { y: PLANCHER + 3.2, z: -8, releve: 0.6, rangs: 20, epaisseur: 0.2 })
      .boite(7.5, 0.4, 0.5, P.toitBord, { y: PLANCHER + 6.4, z: -8 });
    // la boîte à offrandes (saisen-bako), ses lattes, et la grosse cloche au bout de sa corde
    a.boite(2.2, 0.75, 0.9, P.boisFonce, { y: PLANCHER + 0.37, z: -4.75 });
    for (let x = -0.95; x <= 0.96; x += 0.19) a.boite(0.09, 0.05, 0.86, P.bois, { x, y: PLANCHER + 0.77, z: -4.75, rz: 0.5, trait: false });
    a.boule(0.32, P.or, { y: PLANCHER + 3.0, z: -4.4 }, 1)
      .piece(new THREE.CylinderGeometry(0.045, 0.045, 2.0, 6), '#e8452e', { y: PLANCHER + 1.85, z: -4.4, teinte: (x, y) => (Math.floor(y * 6) % 2 ? '#e8452e' : P.blanc) });
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
    monde.mur(-1.1, -4.75, 1.1, -4.75, 0.7, PLANCHER - 0.5, PLANCHER + 3);
    monde.toit(-7.5, 7.5, -13.5, -2.5, PLANCHER + 2.9, PLANCHER + 6.7);
  }

  // ---- Le pavillon de prière (haiden) et le pavillon principal (honden), fermés : murs blancs, poteaux
  // vermillon, fenêtres à barreaux verts, grands toits d'écorce
  for (const [r, h, toit] of [[HAIDEN, 3.2, [13, 8.5, 3.0]], [HONDEN, 3.8, [15.5, 14.5, 4.2]]]) {
    const a = atelier();
    const [x0, x1, z0, z1] = r, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, lx = x1 - x0, lz = z1 - z0;
    plancher(a, r, { pas: 3 });
    poteaux(a, r, h, { pas: 2.5 });
    a.boite(lx - 0.5, h - 0.3, lz - 0.5, P.blanc, { x: cx, y: PLANCHER + h / 2 - 0.1, z: cz });
    for (const s of [-1, 1]) {
      for (let k = -1; k <= 1; k += 2) {
        a.boite(1.4, 0.9, 0.08, P.herbeFonce, { x: cx + k * lx * 0.25, y: PLANCHER + h * 0.6, z: cz + s * (lz / 2 - 0.22), trait: false });
        for (let b = -0.55; b <= 0.56; b += 0.22) a.boite(0.05, 0.94, 0.1, P.vermillon, { x: cx + k * lx * 0.25 + b, y: PLANCHER + h * 0.6, z: cz + s * (lz / 2 - 0.2), trait: false });
      }
    }
    a.boite(lx + 0.3, 0.3, lz + 0.3, P.vermillon, { x: cx, y: PLANCHER + h + 0.05, z: cz })
      .toitJapon(toit[0], toit[1], toit[2], 0.25, { x: cx, y: PLANCHER + h + 0.2, z: cz, releve: 0.6, rangs: 20, epaisseur: 0.2 })
      .boite(toit[0] * 0.5, 0.42, 0.5, P.toitBord, { x: cx, y: PLANCHER + h + 0.2 + toit[2], z: cz });
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
    monde.bloc(x0, x1, z0, z1, PLANCHER - 3, PLANCHER + h + 0.2);
    monde.toit(cx - toit[0] / 2, cx + toit[0] / 2, cz - toit[1] / 2, cz + toit[1] / 2, PLANCHER + h - 0.1, PLANCHER + h + 0.7 + toit[2]);
  }

  // ---- La grande plate-forme (hirabutai), la scène de danse (takabutai), les deux pavillons des musiciens,
  // la pointe (hitakisaki) et sa lanterne de bronze, face au torii
  {
    const a = atelier();
    plancher(a, HIRABUTAI, { pas: 3 });
    plancher(a, HITAKISAKI);
    gardeCorps(a, [[-9, -12, -9, -26], [9, -12, 9, -26], [-9, -26, -2.5, -26], [2.5, -26, 9, -26], [-2.5, -26, -2.5, -31], [2.5, -26, 2.5, -31], [-2.5, -31, 2.5, -31]]);
    // la scène de danse : un plancher plus haut, ses marches, sa balustrade laquée
    const [sx0, sx1, sz0, sz1] = TAKABUTAI, hs = 0.9;
    a.boite(sx1 - sx0, hs, sz1 - sz0, P.noir, { y: PLANCHER + hs / 2, z: (sz0 + sz1) / 2 })
      .boite(sx1 - sx0 + 0.1, 0.06, sz1 - sz0 + 0.1, P.bois, { y: PLANCHER + hs + 0.03, z: (sz0 + sz1) / 2, trait: false });
    for (const [x0, z0, x1, z1] of [[sx0, sz0, sx1, sz0], [sx0, sz0, sx0, sz1], [sx1, sz0, sx1, sz1]]) {
      const l = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0);
      a.boite(0.1, 0.08, l, P.vermillon, { x: (x0 + x1) / 2, y: PLANCHER + hs + 0.55, z: (z0 + z1) / 2, ry });
      for (const f of [0, 0.5, 1]) a.boite(0.12, 0.6, 0.12, P.vermillon, { x: x0 + (x1 - x0) * f, y: PLANCHER + hs + 0.3, z: z0 + (z1 - z0) * f });
    }
    for (let i = 0; i < 3; i++) a.boite(1.6, 0.3 * (i + 1), 0.35, P.noir, { y: PLANCHER + 0.15 * (i + 1), z: sz1 + 0.9 - i * 0.35 });
    // les deux pavillons des musiciens (gakubō), sur les côtés
    for (const s of [-1, 1]) {
      const x = s * 7.4, z = -15;
      for (const [dx, dz] of [[-1.2, -1.6], [1.2, -1.6], [-1.2, 1.6], [1.2, 1.6]]) a.boite(0.22, 2.4, 0.22, P.vermillon, { x: x + dx, y: PLANCHER + 1.2, z: z + dz });
      a.boite(2.8, 0.2, 3.6, P.vermillon, { x, y: PLANCHER + 2.45, z })
        .toitJapon(4.2, 5, 1.4, 0.25, { x, y: PLANCHER + 2.5, z, releve: 0.3, rangs: 10, epaisseur: 0.12 });
      monde.toit(x - 2.1, x + 2.1, z - 2.5, z + 2.5, PLANCHER + 2.3, PLANCHER + 4.1);
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
    poser(lanterneBronze(atelier()).fin(0, peinture), 0, -30, { y: PLANCHER });
    lumieres.push({ x: 0, y: PLANCHER + 1.73, z: -30, halo: 0.65, sol: PLANCHER, r: 2.6 });
    // ce qui arrête sur la plate-forme : la scène, ses marches, les pavillons des musiciens, la lanterne
    for (const [x0, z0, x1, z1] of [[sx0, sz0, sx1, sz0], [sx0, sz0, sx0, sz1], [sx1, sz0, sx1, sz1], [sx0, sz1 + 1, sx1, sz1 + 1]]) monde.mur(x0, z0, x1, z1, 0.4, PLANCHER - 0.3, PLANCHER + 3);
    monde.mur(sx0, sz0, sx0, sz1 + 1, 0.4, PLANCHER - 0.3, PLANCHER + 3);
    monde.mur(sx1, sz0, sx1, sz1 + 1, 0.4, PLANCHER - 0.3, PLANCHER + 3);
    for (const s of [-1, 1]) for (const [dx, dz] of [[-1.2, -1.6], [1.2, -1.6], [-1.2, 1.6], [1.2, 1.6]]) monde.cercle(s * 7.4 + dx, -15 + dz, 0.4, PLANCHER - 0.3, PLANCHER + 3);
    monde.cercle(0, -30, 0.8, PLANCHER - 0.3, PLANCHER + 3);
  }

  /**
   * La lanterne de bronze (tōrō) au bout de la pointe, vert-de-gris, environ 2,8 m, à six pans : le socle à
   * deux gradins, le pilier et ses anneaux, la console, la cage à lumière (ses montants, ses fenêtres à
   * croisillons, le papier qui s'allume la nuit), le toit creusé aux coins relevés en crosse, et le joyau.
   */
  function lanterneBronze(a) {
    const B = P.bronze, S = 6, rot = PI / 6; // (un pan face au torii)
    a.cylindre(0.4, 0.46, 0.12, S, B, { y: 0.06, ry: rot })
      .cylindre(0.3, 0.35, 0.1, S, B, { y: 0.17, ry: rot })
      .cylindre(0.1, 0.13, 1.06, 12, B, { y: 0.75 });
    for (const y of [0.5, 0.95]) a.cylindre(0.128, 0.128, 0.05, 12, B, { y });
    a.cylindre(0.31, 0.13, 0.16, S, B, { y: 1.36, ry: rot })
      .cylindre(0.33, 0.33, 0.05, S, B, { y: 1.465, ry: rot });
    // la cage : le papier (il s'allume la nuit), six montants, et sur chaque pan une fenêtre à croisillons
    const hb = 1.49, hh = 1.98, rc = 0.25;
    a.cylindre(0.215, 0.215, hh - hb - 0.024, S, P.fenetre, { y: (hb + hh) / 2, ry: rot, trait: false });
    for (let k = 0; k < S; k++) {
      const t = (k / S) * 2 * PI + rot, tm = t + PI / S, ap = rc * Math.cos(PI / S); // un coin ; le milieu d'un pan, et sa distance
      a.boite(0.045, hh - hb, 0.045, B, { x: Math.sin(t) * rc, y: (hb + hh) / 2, z: Math.cos(t) * rc, ry: t });
      const x = Math.sin(tm) * (ap - 0.03), z = Math.cos(tm) * (ap - 0.03), largeur = 2 * rc * Math.sin(PI / S) - 0.05;
      for (const y of [hb + 0.03, hh - 0.03, (hb + hh) / 2]) a.boite(largeur, y === (hb + hh) / 2 ? 0.018 : 0.05, 0.03, B, { x, y, z, ry: tm, trait: y !== (hb + hh) / 2 });
      // (le montant du milieu, moins épais et moins haut : ses faces ne sont pas dans le plan des barres qu'il croise)
      a.boite(0.018, hh - hb - 0.03, 0.024, B, { x, y: (hb + hh) / 2, z, ry: tm, trait: false });
    }
    // le toit : un dessous plat, six pans creusés (pentus en haut, presque plats au bord), les coins en crosse
    const R = 0.6, H = 0.4, base = hh + 0.03;
    a.cylindre(0.56, 0.5, 0.05, S, B, { y: base, ry: rot })
      .piece(new THREE.ConeGeometry(R, H, S, 6), B, {
        y: base + 0.02 + H / 2, ry: rot,
        deformer: (x, y, z) => {
          const u = 0.5 - y / H; // 0 en haut, 1 au bord
          return [x, H * Math.max(0, 1 - u) ** 1.9 - H / 2 + 0.05 * u ** 4, z]; // (max : 1 − u à peine négatif donnait NaN)
        },
      });
    for (let k = 0; k < S; k++) {
      const t = (k / S) * 2 * PI + rot;
      a.baton([Math.sin(t) * R * 0.86, base + 0.05, Math.cos(t) * R * 0.86], [Math.sin(t) * R * 1.04, base + 0.13, Math.cos(t) * R * 1.04], 0.028, B, 6)
        .boule(0.038, B, { x: Math.sin(t) * R * 1.05, y: base + 0.16, z: Math.cos(t) * R * 1.05 }, 1);
    }
    // le joyau (hōju) sur sa fleur de lotus
    return a.cylindre(0.06, 0.1, 0.07, 8, B, { y: base + H + 0.05 })
      .boule(0.085, B, { y: base + H + 0.15, sy: 0.9 }, 1)
      .cone(0.05, 0.09, 8, B, { y: base + H + 0.26 });
  }

  // ---- La scène de nō, sur la mer à l'ouest de la plate-forme, tournée vers elle (on la regarde depuis la
  // plate-forme, comme le public) : le plancher de cyprès, quatre piliers, le toit à pignon creusé, son pignon vers le
  // public ; au fond, le grand pin peint (kagami-ita) ; sur le côté, les bambous peints et la petite porte (kirido) ;
  // le pont des acteurs (hashigakari) qui part du coin du fond vers la galerie, son rideau à cinq couleurs, et trois
  // petits pins. On y joue « Hagoromo » : l'actrice masquée danse, quatre musiciens et le chœur sont assis (les
  // passants). (L'ancienne, face au nord, avait le toit du pont planté dans le mur du fond, devant un pin d'un seul
  // aplat : 2026-10-23.)
  {
    const a = atelier(), { x, z } = NO, hn = HN, CYPRES = '#ddc293', FONCE = '#8a6440';
    // le plancher : des planches de cyprès d'avant en arrière, sur une dalle sombre ; les pilotis jusqu'à l'estran
    a.boite(6.2, 0.3, 6.2, FONCE, { x, y: hn - 0.17, z });
    for (let k = 0; k < 12; k++) a.boite(6.14, 0.04, 0.5, k % 2 ? CYPRES : '#d3b685', { x, y: hn - 0.01, z: z - 3.1 + 0.26 + k * 0.515, trait: false, nuance: 0.02 });
    for (let i = 0; i < 9; i++) {
      const px = x - 2.8 + (i % 3) * 2.8, pz = z - 2.8 + Math.floor(i / 3) * 2.8, sol = terrain(px, pz);
      a.boite(0.26, hn - sol, 0.26, P.noir, { x: px, y: (hn + sol) / 2 - 0.15, z: pz });
    }
    // les quatre piliers, les poutres (celles le long de z un peu plus bas : pas dans le plan des autres), le plafond
    for (const [dx, dz] of [[-2.9, -2.9], [2.9, -2.9], [-2.9, 2.9], [2.9, 2.9]]) a.boite(0.3, 3.46, 0.3, CYPRES, { x: x + dx, y: hn + 1.73, z: z + dz });
    for (const sz of [-1, 1]) a.boite(5.98, 0.34, 0.24, CYPRES, { x, y: hn + 3.33, z: z + sz * 2.9 });
    for (const sx of [-1, 1]) a.boite(0.24, 0.34, 5.98, CYPRES, { x: x + sx * 2.9, y: hn + 3.31, z });
    a.boite(6.0, 0.05, 6.0, '#c9ab7a', { x, y: hn + 3.48, z })
      // le mur du fond (le grand pin y est peint : une étiquette), le mur de côté (les bambous) et la petite porte
      .boite(0.16, 3.32, 6.0, CYPRES, { x: x - 3.0, y: hn + 1.66, z })
      .boite(1.6, 3.32, 0.14, CYPRES, { x: x - 2.2, y: hn + 1.66, z: z - 3.0 })
      .boite(0.8, 0.95, 0.04, '#6b4c30', { x: x - 1.95, y: hn + 0.475, z: z - 2.91 });
    ecrire({ x, z, y: hn, ry: 0 }, { fond: CYPRES, dessin: pinPeint, x: -2.915, y: 1.62, z: 0, ry: PI / 2, l: 5.5, h: 3.0 });
    ecrire({ x, z, y: hn, ry: 0 }, { fond: CYPRES, dessin: bambous, x: -2.35, y: 2.15, z: -2.925, ry: 0, l: 1.2, h: 2.05 });
    // le toit : un pignon aux pans creusés, en bardeaux d'écorce (des rangs de deux teintes), faîtage d'avant en
    // arrière ; ses planches de rive, le triangle de bois du pignon et son ornement doré
    const Lt = 3.95, Wt = 4.1, ht = 2.5, bord = hn + 3.52, ep = 0.2, N = 12;
    const pan = (zz) => bord + ht * Math.pow(Math.max(0, 1 - Math.abs(zz) / Wt), 1.45);
    const tri = [], couleurs = [];
    /** Un quadrilatère (convexe), tourné vers dir. */
    const quad = (Q, dir, c) => {
      const [A, B, Cc] = Q, u = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], v = [Cc[0] - A[0], Cc[1] - A[1], Cc[2] - A[2]];
      const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      const R = n[0] * dir[0] + n[1] * dir[1] + n[2] * dir[2] < 0 ? [Q[0], Q[3], Q[2], Q[1]] : Q;
      tri.push(R[0], R[1], R[2], R[0], R[2], R[3]);
      couleurs.push(c, c);
    };
    for (const sz of [-1, 1]) {
      for (let i = 0; i < N; i++) {
        const za = (sz * i * Wt) / N, zb = (sz * (i + 1) * Wt) / N, ya = pan(za), yb = pan(zb);
        const c = i % 2 ? P.toit : P.toitClair;
        quad([[x - Lt, ya, z + za], [x + Lt, ya, z + za], [x + Lt, yb, z + zb], [x - Lt, yb, z + zb]], [0, 1, sz * 0.4], c);
        quad([[x - Lt, ya - ep, z + za], [x + Lt, ya - ep, z + za], [x + Lt, yb - ep, z + zb], [x - Lt, yb - ep, z + zb]], [0, -1, 0], P.toitBord);
        for (const sx of [-1, 1]) quad([[x + sx * Lt, ya, z + za], [x + sx * Lt, yb, z + zb], [x + sx * Lt, yb - ep, z + zb], [x + sx * Lt, ya - ep, z + za]], [sx, 0, 0], P.toitBord);
      }
      const yb = pan(sz * Wt);
      quad([[x - Lt, yb, z + sz * Wt], [x + Lt, yb, z + sz * Wt], [x + Lt, yb - ep, z + sz * Wt], [x - Lt, yb - ep, z + sz * Wt]], [0, 0, sz], P.toitBord);
    }
    const toit = new THREE.BufferGeometry();
    toit.setAttribute('position', new THREE.Float32BufferAttribute(tri.flat(), 3));
    a.piece(toit, P.toit, { couleurs, nuance: 0.03 })
      .boite(2 * Lt + 0.3, 0.24, 0.42, P.toitBord, { x, y: pan(0) + 0.06, z });
    // les planches de rive : elles suivent la courbe du toit, aux deux pignons
    const rive = new THREE.Shape();
    for (let i = -N; i <= N; i++) { const zz = ((i / N) * (Wt + 0.12)); i === -N ? rive.moveTo(zz, pan(zz) - bord + 0.12) : rive.lineTo(zz, pan(zz) - bord + 0.12); }
    for (let i = N; i >= -N; i--) { const zz = ((i / N) * (Wt + 0.12)); rive.lineTo(zz, pan(zz) - bord - 0.3); }
    for (const sx of [-1, 1]) a.piece(new THREE.ExtrudeGeometry(rive, { depth: 0.12, bevelEnabled: false }), '#6a4a30', { x: x + sx * (Lt + 0.02) + 0.06, y: bord, z, ry: -PI / 2 });
    // le triangle du pignon côté public, au-dessus de la poutre de devant, et son ornement doré (gegyo)
    const tympan = new THREE.Shape();
    tympan.moveTo(-2.9, 0); tympan.lineTo(2.9, 0); tympan.lineTo(0, pan(0) - hn - 3.5 - 0.25); tympan.lineTo(-2.9, 0);
    a.piece(new THREE.ExtrudeGeometry(tympan, { depth: 0.06, bevelEnabled: false }), '#cfb07e', { x: x + 2.92, y: hn + 3.5, z, ry: PI / 2 })
      .piece(new THREE.CircleGeometry(0.28, 12), P.or, { x: x + 3.0, y: hn + 4.35, z, ry: PI / 2, trait: false })
      .cone(0.12, 0.42, 6, P.or, { x: x + Lt + 0.18, y: pan(0) - 0.32, z, rx: PI });
    poser(a.fin(0, peinture), 0, 0, { y: 0 });

    // le pont des acteurs (hashigakari) : du coin du fond, côté sud, jusqu'à la galerie de l'ouest ; son plancher, ses
    // balustrades, son toit, le rideau à cinq couleurs (agemaku) au bout ; trois petits pins devant lui, sur des rochers
    const A = [x - 2.2, z + 3.1], B = [x - 3.2, z + 11.0];
    const Lb = Math.hypot(B[0] - A[0], B[1] - A[1]), ryb = Math.atan2(B[0] - A[0], B[1] - A[1]);
    const cb = Math.cos(ryb), sb = Math.sin(ryb);
    const duPont = (lx, lz) => [A[0] + lx * cb + lz * sb, A[1] - lx * sb + lz * cb];
    const b = atelier();
    b.boite(1.9, 0.24, Lb, CYPRES, { y: -0.12, z: Lb / 2 });
    for (let lz = 0.6; lz < Lb; lz += 2.4) {
      for (const lx of [-0.75, 0.75]) { const [px, pz] = duPont(lx, lz), sol = terrain(px, pz); b.boite(0.2, hn - sol, 0.2, P.noir, { x: lx, y: (sol - hn) / 2 - 0.12, z: lz }); }
    }
    for (const lx of [-0.92, 0.92]) {
      b.boite(0.07, 0.07, Lb - 0.2, CYPRES, { x: lx, y: 0.62, z: Lb / 2 }).boite(0.05, 0.05, Lb - 0.2, CYPRES, { x: lx, y: 0.28, z: Lb / 2 + 0.002 });
      for (let lz = 0.3; lz < Lb; lz += 1.6) b.boite(0.09, 0.66, 0.09, CYPRES, { x: lx, y: 0.33, z: lz });
      for (let lz = 0.6; lz < Lb; lz += 3.2) b.boite(0.12, 2.4, 0.12, CYPRES, { x: lx, y: 1.2, z: lz });
    }
    b.pignon(Lb - 0.1, 0.8, 2.7, P.toit, { ry: PI / 2, y: 2.4, z: Lb / 2 + 0.1 });
    const RIDEAU = ['#3f8a5a', '#e8b941', '#c8372d', '#f3ead8', '#6a3a8a'];
    RIDEAU.forEach((c, k) => b.boite(0.36, 2.0, 0.03, c, { x: -0.72 + k * 0.36, y: 1.15, z: Lb - 0.25, trait: k === 0 || k === 4 }));
    b.boite(1.95, 0.1, 0.1, CYPRES, { y: 2.2, z: Lb - 0.25 });
    poser(b.fin(0, peinture), A[0], A[1], { ry: ryb, y: hn });
    for (const lz of [1.9, 4.2, 6.5]) {
      const [px, pz] = duPont(2.1, lz), sol = terrain(px, pz), c = atelier();
      c.rocher(0, 0.1, 0, 0.6, P.pierreFonce).rocher(0.35, 0.05, 0.25, 0.4, P.pierre).pinNuages(0, 0, 3.6, lz > 4 ? -1 : 1);
      poser(c.fin(0, peinture), px, pz, { y: sol + 0.25 });
      monde.cercle(px, pz, 0.7);
    }

    // ce qu'on ne traverse pas : sous la scène et le pont (trop bas pour passer dessous) ; les acteurs se tiennent
    // sur le plancher de la scène (une surface : on ne peut pas y monter, il est entouré d'eau)
    monde.surface(x - 3.1, x + 3.1, z - 3.1, z + 3.1, hn);
    const coins = [duPont(-1, 0), duPont(1, 0), duPont(-1, Lb), duPont(1, Lb)];
    monde.surface(Math.min(...coins.map((q) => q[0])), Math.max(...coins.map((q) => q[0])), Math.min(...coins.map((q) => q[1])), Math.max(...coins.map((q) => q[1])), hn, { plein: true });
    // pour la caméra : le toit de la scène, le mur du fond, le dessous ; le toit du pont
    monde.toit(x - Lt, x + Lt, z - Wt, z + Wt, hn + 3.1, hn + 6.2);
    monde.bloc(x - 3.1, x - 2.9, z - 3, z + 3, hn - 0.3, hn + 3.4);
    monde.bloc(x - 3.1, x + 3.1, z - 3.1, z + 3.1, -1, hn);
    monde.toit(Math.min(...coins.map((q) => q[0])) - 0.4, Math.max(...coins.map((q) => q[0])) + 0.4, Math.min(...coins.map((q) => q[1])), Math.max(...coins.map((q) => q[1])), hn + 2.3, hn + 3.3);
  }

  // ---- Le coin des omikuji, près de la miko : son comptoir couvert d'un tissu blanc, la boîte à omikuji (on la
  // secoue : une baguette numérotée sort), les porte-bonheur (omamori) sur leur pupitre, le plateau des pièces,
  // l'écriteau ; au bord est de la plate-forme, le fil où l'on noue les papiers de mauvaise fortune, et les plaques
  // de vœux (ema) sous leur petit toit
  const OMIKUJI = { x: -6.35, z: -18 };
  {
    const a = atelier(), { x: cx, z: cz } = OMIKUJI, y = PLANCHER;
    a.boite(0.6, 0.78, 1.7, P.boisFonce, { x: cx, y: y + 0.39, z: cz })
      .boite(0.66, 0.03, 1.76, P.blanc, { x: cx, y: y + 0.795, z: cz })
      .boite(0.02, 0.33, 1.76, P.blanc, { x: cx + 0.335, y: y + 0.635, z: cz, trait: false })
      .cylindre(0.11, 0.11, 0.34, 6, '#c9a26a', { x: cx, y: y + 0.98, z: cz - 0.5 })
      .cylindre(0.025, 0.025, 0.012, 8, P.noir, { x: cx, y: y + 1.152, z: cz - 0.5, trait: false })
      .baton([cx + 0.01, y + 1.12, cz - 0.5], [cx + 0.03, y + 1.24, cz - 0.49], 0.008, P.boisFonce, 4)
      .boite(0.24, 0.04, 0.18, P.noir, { x: cx + 0.1, y: y + 0.83, z: cz - 0.12 })
      .boite(0.36, 0.3, 0.7, P.bois, { x: cx - 0.05, y: y + 0.96, z: cz + 0.38, rz: 0.35 })
      .boite(0.03, 0.42, 0.34, P.bois, { x: cx + 0.18, y: y + 1.02, z: cz - 0.84 });
    ecrire({ x: cx, z: cz, y, ry: 0 }, { texte: 'おみくじ', vertical: true, fond: '#c9a26a', encre: '#2a2420', x: 0.0985, y: 0.98, z: -0.5, ry: PI / 2, l: 0.1, h: 0.3 });
    ecrire({ x: cx, z: cz, y, ry: 0 }, { texte: 'おみくじ', sous: '一回 100円', fond: '#f6efe0', encre: '#2a2420', x: 0.1965, y: 1.04, z: -0.84, ry: PI / 2, l: 0.3, h: 0.32 });
    // les omamori, en deux rangs sur le pupitre incliné (tourné vers qui arrive, à l'est)
    const OM = ['#c8372d', '#2f5a9a', '#e88aa0', '#e8b941', '#3f8a5a', '#6a3a8a'];
    const nx = Math.cos(0.35), ny = Math.sin(0.35);
    for (let rg = 0; rg < 2; rg++) {
      for (let k = 0; k < 4; k++) {
        const d = (rg - 0.5) * 0.13;
        a.boite(0.012, 0.1, 0.07, OM[(rg * 4 + k) % OM.length], { x: cx - 0.05 + nx * 0.186 - ny * d, y: y + 0.96 + ny * 0.186 + nx * d, z: cz + 0.15 + k * 0.155, rz: 0.35, trait: false });
      }
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
    monde.mur(cx, cz - 0.9, cx, cz + 0.9, 0.48, PLANCHER - 0.3, PLANCHER + 3);
  }
  {
    // le fil des omikuji (結び所) et les ema, contre le garde-corps est de la plate-forme, tournés vers l'ouest
    const a = atelier(), y = PLANCHER, xm = 8.25;
    for (const zp of [-24.3, -22.1]) a.boite(0.1, 1.6, 0.1, P.boisFonce, { x: xm, y: y + 0.8, z: zp });
    a.boite(0.14, 0.12, 2.4, P.boisFonce, { x: xm, y: y + 1.62, z: -23.2 });
    for (const [i, hy] of [[0, 0.72], [1, 1.02], [2, 1.32]]) {
      a.boite(0.012, 0.02, 2.2, '#e9dcb8', { x: xm, y: y + hy, z: -23.2, trait: false });
      for (let zz = -24.15; zz < -22.25; zz += 0.075) {
        if (hasard(zz * 13, i) < 0.22) continue;
        a.boite(0.05, 0.09, 0.045, '#fbf6ea', { x: xm + (hasard(zz, i) - 0.5) * 0.02, y: y + hy - 0.01, z: zz, rx: (hasard(i, zz) - 0.5) * 0.6, trait: false, nuance: 0.02 });
      }
    }
    ecrire({ x: xm, z: -23.2, y, ry: 0 }, { texte: 'おみくじ結び所', fond: '#f6efe0', encre: '#2a2420', x: -0.075, y: 1.62, z: 0, ry: -PI / 2, l: 1.3, h: 0.11 });
    // les ema : des plaques de bois en forme de maison, pendues à deux rangs sous un petit toit
    for (const zp of [-21.2, -19.6]) a.boite(0.1, 1.75, 0.1, P.boisFonce, { x: xm, y: y + 0.875, z: zp });
    a.boite(0.16, 0.08, 1.58, P.boisFonce, { x: xm, y: y + 1.12, z: -20.4 }).boite(0.16, 0.08, 1.58, P.boisFonce, { x: xm, y: y + 1.48, z: -20.4 })
      .pignon(2.0, 0.28, 0.6, P.toit, { x: xm, y: y + 1.75, z: -20.4, ry: PI / 2 });
    for (let rg = 0; rg < 2; rg++) {
      for (let k = 0; k < 8; k++) {
        const zz = -20.96 + k * 0.17, hy = rg ? 1.02 : 1.38, t = (hasard(k, rg) - 0.5) * 0.3;
        a.boite(0.015, 0.11, 0.16, '#e6cf9f', { x: xm - 0.04, y: y + hy, z: zz, rx: t })
          .pignon(0.16, 0.04, 0.012, '#e6cf9f', { x: xm - 0.04, y: y + hy + 0.055, z: zz, ry: PI / 2, rx: t })
          .boite(0.004, 0.035, 0.05, ['#c8372d', '#2a2420', '#3f8a5a', '#e8732e'][(k + rg) % 4], { x: xm - 0.062, y: y + hy - 0.005, z: zz, rx: t, trait: false });
      }
    }
    ecrire({ x: xm, z: -20.4, y, ry: 0 }, { texte: '絵馬', fond: '#f6efe0', encre: '#2a2420', x: -0.065, y: 1.62, z: 0, ry: -PI / 2, l: 0.5, h: 0.16 });
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
    monde.mur(xm, -24.4, xm, -19.5, 0.42, PLANCHER - 0.3, PLANCHER + 3);
  }
  {
    // les tonneaux de saké offerts au sanctuaire (kazaridaru), empilés sur une estrade, dans la galerie de l'est
    const a = atelier(), y = PLANCHER, zb = 9.25, DECORS = [['#c8372d', '#2f4a8a'], ['#2f4a8a', '#e8b941'], ['#3f6a4a', '#c8372d'], ['#e8b941', '#2a2420']];
    a.boite(3.0, 0.14, 0.72, P.boisFonce, { x: 15.25, y: y + 0.07, z: zb });
    const tonneau = (x, yb, k) => {
      const [c1, c2] = DECORS[k % DECORS.length];
      a.cylindre(0.3, 0.3, 0.58, 16, '#efe6d0', { x, y: yb + 0.29, z: zb })
        .cylindre(0.312, 0.312, 0.3, 16, c1, { x, y: yb + 0.3, z: zb, trait: false })
        .cylindre(0.324, 0.324, 0.08, 16, c2, { x, y: yb + 0.3, z: zb, trait: false })
        .cylindre(0.318, 0.318, 0.03, 16, '#c9a65a', { x, y: yb + 0.05, z: zb, trait: false })
        .cylindre(0.318, 0.318, 0.03, 16, '#c9a65a', { x, y: yb + 0.55, z: zb, trait: false });
    };
    [14.26, 14.92, 15.58, 16.24].forEach((x, k) => tonneau(x, y + 0.14, k));
    [14.59, 15.25, 15.91].forEach((x, k) => tonneau(x, y + 0.72, k + 1));
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
    monde.mur(13.8, zb, 16.7, zb, 0.42, PLANCHER - 0.3, PLANCHER + 3);
  }

  // ---------------------------------------------------------------- Ce qu'on peut piétiner : les planchers
  // (un peu en retrait des garde-corps) ; les marches sont plus haut
  {
    const s = (x0, x1, z0, z1) => monde.surface(x0, x1, z0, z1, PLANCHER);
    s(8 + BORD, 21, 6 + BORD, 10 - BORD); // est1 (ouverte à l'est sur l'escalier)
    s(8 + BORD, 12 - BORD, -12 + BORD, 10 - BORD); // est2
    s(6, 12 - BORD, -12 + BORD, -8 - BORD); // est3
    s(6, 9.4, -12, -8 - BORD); // est3, ouverte au nord sur la plate-forme
    s(-6, 6, -12, -8); // haraiden : l'avant, ouvert sur les galeries et la plate-forme
    s(-6 + BORD, 6 - BORD, -8, -4); // haraiden : le fond, entre ses garde-corps
    s(-9 + BORD, 9 - BORD, -26 + BORD, -12); // hirabutai
    s(-2.5 + BORD, 2.5 - BORD, -31 + BORD, -26 + BORD + 0.01); // hitakisaki
    s(-26 + BORD, -6, -12 + BORD, -8 - BORD); // ouest1
    s(-9.4, -6, -12, -8 - BORD); // ouest1, ouverte au nord sur la plate-forme
    s(-26 + BORD, -22 - BORD, -12 + BORD, 12); // ouest2
    // les pavillons fermés : pleins (on n'y entre pas, on ne passe pas dessous)
    for (const [x0, x1, z0, z1] of [HAIDEN, HONDEN]) monde.surface(x0, x1, z0, z1, PLANCHER + 3, { plein: true });
    // la façade nord du pavillon de prière, pour qui marche dans le pavillon de purification
    monde.mur(-5, -4, 5, -4, 0.3, PLANCHER - 0.3, PLANCHER + 3);
  }

  // ---------------------------------------------------------------- La plage, la terre, la colline
  // les lanternes de pierre de la rive, les pins
  for (const [x, z] of [[17, 2.6], [25, 3], [33, 3.2], [41, 3], [49, 2.8], [-34, 19], [-20, 19], [-6, 19], [8, 19.5], [22, 16]]) {
    poser(atelier().lanterne(0, 0, 8.2).fin(0, peinture), x, z);
    monde.cercle(x, z, 0.55);
    lumieres.push({ x, y: terrain(x, z) + 1.64, z, halo: 0.55, sol: terrain(x, z), r: 2.5 });
  }
  for (const [x, z, s, sens] of [[16, 3, 17, -1], [30, 5, 18, 1], [44, 4.5, 17, -1], [61, 2, 19, 1], [-40, 20, 19, 1], [-28, 24, 17, -1], [-14, 23, 18, 1], [4, 24, 16, -1], [24, 22, 19, 1], [-48, 14, 18, -1]]) {
    // (2026-10-24 : taillés en nuages, un tronc qui ondule, des plateaux d'aiguilles sombres dessous)
    poser(atelier().pinNuages(0, 0, s, sens).fin(0, peinture), x, z);
    monde.cercle(x + 0.05 * s * sens, z, 0.5);
  }
  // des érables (momiji) au sud, encore verts, quelques-uns qui rougissent
  for (const [x, z, h, rouge] of [[-34, 33, 6, false], [-22, 34, 5.5, true], [-8, 33, 6.2, false], [10, 32, 5.8, true], [28, 31, 6, false], [-44, 30, 5.6, true]]) {
    const a = atelier();
    // (à feuilles caduques : l'hiver, on voit leurs branches ; depuis le 2026-10-24, le feuillu touffu de l'atelier)
    if (rouge) a.arbreTouffu(0, 0, h, ['#c0522f', '#d9873a', '#b8452a'], { sorte: 'houppierErable', caduc: true });
    else a.arbreTouffu(0, 0, h, [P.feuillage, P.herbe, '#a8c45a'], { sorte: 'houppier', caduc: true });
    poser(a.fin(0, peinture), x, z);
    monde.cercle(x, z, 0.5);
  }

  // la laisse de mer (des algues), des galets sur la plage et sur l'estran
  {
    const a = atelier();
    for (let x = 16; x < 62; x += 1.6) {
      if (hasard(x, 7) < 0.35) continue;
      const z = -8.6 + Math.sin(x * 0.35) * 0.5 + (hasard(x, 3) - 0.5) * 0.6;
      a.ruban([[x, terrain(x, z) + 0.02, z], [x + 0.8, terrain(x + 0.8, z + 0.2) + 0.02, z + 0.2], [x + 1.4, terrain(x + 1.4, z - 0.1) + 0.02, z - 0.1]], 0.1, P.algue);
    }
    for (let i = 0; i < 90; i++) {
      const x = 15 + hasard(i, 1) * 46, z = -11 + hasard(i, 2) * 14;
      a.rocher(x, terrain(x, z) + 0.03, z, 0.07 + hasard(i, 3) * 0.15, P.pierreFonce);
    }
    for (let i = 0; i < 40; i++) {
      const x = -50 + hasard(i, 11) * 30, z = -40 + hasard(i, 12) * 30;
      if (Math.abs(x - NO.x) < 5 && Math.abs(z - NO.z) < 9) continue;
      a.rocher(x, terrain(x, z) + 0.02, z, 0.08 + hasard(i, 13) * 0.12, P.pierreFonce);
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0, ombre: false });
  }

  // les hautes herbes, sur la terre au sud-ouest (on dit qu'il en sort parfois un daim sauvage…)
  const HERBES = [-30, -10, 24, 29]; // [x0, x1, z0, z1]
  {
    const a = atelier();
    const [x0, x1, z0, z1] = HERBES;
    for (let x = x0; x < x1; x += 0.5) {
      for (let z = z0; z < z1; z += 0.5) {
        const px = x + (hasard(x, z) - 0.5) * 0.4, pz = z + (hasard(z, x) - 0.5) * 0.4, y = terrain(px, pz);
        for (let k = 0; k < 3; k++) {
          const h = 0.5 + hasard(px + k, pz) * 0.3;
          a.cone(0.07, h, 3, k % 2 ? P.herbeFonce : P.herbe, { x: px + (k - 1) * 0.12, y: y + h / 2 - 0.03, z: pz + (hasard(k, px) - 0.5) * 0.15, rx: (hasard(pz, k) - 0.5) * 0.4, rz: (k - 1) * 0.25 });
        }
      }
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0, ombre: false });
  }

  // la rue des boutiques (à l'est) et ses maisons de bois : murs blancs, étage sombre, avant-toit, noren
  // (rideau fendu à l'entrée), enseigne. Construites face au nord (−z), puis tournées.
  function boutique({ noren, enseigne, auvent = null, etalage = null, ecrit = false }) {
    const a = atelier();
    a.boite(6, 3, 5, P.blanc, { y: 1.5, z: 0.6 })
      .boite(6.2, 0.25, 5.2, P.boisFonce, { y: 3.05, z: 0.6 })
      .boite(6, 2.2, 4.4, P.boisFonce, { y: 4.3, z: 0.8 })
      .toitJapon(7.2, 6.4, 1.6, 0.3, { y: 5.35, z: 0.8, releve: 0.25, rangs: 12, epaisseur: 0.14, tuile: P.toitBord, tuile2: '#6a5e58' })
      .boite(0.25, 2.6, 0.25, P.boisFonce, { x: -2.9, y: 1.3, z: -1.9 })
      .boite(0.25, 2.6, 0.25, P.boisFonce, { x: 2.9, y: 1.3, z: -1.9 })
      .boite(5.4, 2.4, 0.1, P.fenetre, { y: 1.3, z: -1.88, trait: false }) // 3 cm devant le mur (dans son plan, les deux scintillaient)
      .pignon(6.6, 0.5, 1.6, P.toit, { y: 2.85, z: -2.6 });
    for (let i = 0; i < 4; i++) a.boite(1.05, 0.9, 0.04, noren, { x: -1.6 + i * 1.07, y: 2.2, z: -2.15 });
    a.boite(2.6, 0.75, 0.12, P.bois, { y: 3.6, z: -1.62 });
    // (2026-10-24) les murs blancs des côtés tenus par des poteaux et une poutre de bois sombre (à 4 cm du mur : pas
    // dans son plan) ; à l'étage, la fenêtre d'enduit blanc à barreaux (mushiko-mado) des maisons marchandes
    for (const sx of [-1, 1]) {
      for (const z of [-0.85, 0.65, 2.15]) a.boite(0.08, 2.97, 0.14, P.boisFonce, { x: sx * 3.045, y: 1.455, z });
      a.boite(0.07, 0.12, 5.0, P.boisFonce, { x: sx * 3.045, y: 1.25, z: 0.6 });
    }
    a.boite(2.9, 0.78, 0.05, P.blanc, { y: 4.45, z: -1.43 });
    for (let i = 0; i < 11; i++) a.boite(0.07, 0.7, 0.06, '#3a2c24', { x: -1.3 + i * 0.26, y: 4.45, z: -1.48, trait: i === 0 || i === 10 });
    a.boite(3.0, 0.08, 0.1, P.boisFonce, { y: 4.86, z: -1.46 }).boite(3.0, 0.08, 0.1, P.boisFonce, { y: 4.04, z: -1.46 });
    if (!ecrit) for (let i = 0; i < 3; i++) a.boite(0.4, 0.42, 0.03, enseigne, { x: -0.8 + i * 0.8, y: 3.6, z: -1.7, trait: false });
    etalage?.(a);
    auvent?.(a);
    return a;
  }
  {
    const mo = boutique({
      noren: '#2f4a7a', enseigne: P.noir, ecrit: true,
      // le comptoir et ses plateaux de gâteaux en feuille d'érable, assez en avant pour que la marchande se
      // tienne derrière, devant la façade
      etalage: (a) => {
        a.boite(4.6, 0.9, 0.9, P.bois, { y: 0.45, z: -3.05 });
        for (let i = 0; i < 12; i++) a.boite(0.22, 0.06, 0.2, '#c98a4a', { x: -1.9 + (i % 6) * 0.42, y: 0.94, z: -3.28 + Math.floor(i / 6) * 0.44, ry: i, trait: false });
      },
    });
    // tournées d'un quart de tour vers la rue (façade à l'ouest ou à l'est)
    const yRue = (x, z) => terrain(x, z) - 0.05;
    poser(mo.fin(0, peinture), 59, 4, { ry: PI / 2, y: yRue(59, 4) });
    poser(boutique({ noren: '#b8422b', enseigne: P.vermillon, ecrit: true }).fin(0, peinture), 59, 11.5, { ry: PI / 2, y: yRue(59, 11.5) });
    poser(boutique({ noren: '#3f6a4a', enseigne: P.noir, ecrit: true }).fin(0, peinture), 59, 19, { ry: PI / 2, y: yRue(59, 19) });
    poser(boutique({ noren: '#6a3a7a', enseigne: P.noir, ecrit: true }).fin(0, peinture), 43, 11.5, { ry: -PI / 2, y: yRue(43, 11.5) });
    // leurs enseignes : les gâteaux en feuille d'érable, les spatules à riz de l'île (shamoji), le riz au congre
    // (anago-meshi), les souvenirs
    for (const [x, z, ry, texte, fond, encre] of [[59, 4, PI / 2, 'もみじ饅頭', '#f1e3c4', '#2a2420'], [59, 11.5, PI / 2, 'しゃもじ', P.vermillon, '#fff8e8'], [59, 19, PI / 2, 'あなごめし', '#f1e3c4', '#2a2420'], [43, 11.5, -PI / 2, 'お土産', '#f1e3c4', '#4a2a5a']]) {
      ecrire({ x, z, y: yRue(x, z), ry }, { texte, fond, encre, x: 0, y: 3.6, z: -1.69, ry: PI, l: 2.42, h: 0.6 });
    }
    monde.mur(55.95, 1.7, 55.95, 6.3, 0.5); // le comptoir de la boutique de gâteaux
    for (const z of [11.5, 19]) monde.mur(56.65, z - 3.1, 56.65, z + 3.1, 0.5);
    monde.mur(45.4, 8.4, 45.4, 14.6, 0.45);
    for (const z of [4, 11.5, 19]) monde.bloc(56.6, 63.2, z - 3.6, z + 3.6, -2, 9);
    monde.bloc(38.8, 45.4, 7.9, 15.1, -2, 9);
    // les maisons elles-mêmes : pleines (on entrait par les côtés et l'arrière, 2026-10-22), à partir de la
    // façade ; devant, le comptoir ou l'étal arrête déjà, et la marchande se tient entre le sien et la façade
    for (const z of [4, 11.5, 19]) monde.surface(57.12, 62.4, z - 3.3, z + 3.3, terrain(59, z) + 7, { plein: true });
    monde.surface(39.6, 44.88, 8.2, 14.8, terrain(43, 11.5) + 7, { plein: true });
  }

  // le banc d'une maison de thé (shōgi), au coin de la boutique de gâteaux, face à la mer : un banc de bois
  // couvert de feutre rouge (le hi-mōsen), un plateau de thé et de gâteaux, et le grand parasol rouge (nodate-gasa)
  const BANC = { x: 55.9, z: -0.25 };
  {
    const a = atelier(), rouge = '#c8302c', ombrelle = '#d63a2a';
    // le banc : les pieds (plantés un peu dans le sol, en pente vers la plage), les traverses, l'assise
    for (const [x, z] of [[-0.82, -0.2], [0.82, -0.2], [-0.82, 0.2], [0.82, 0.2]]) a.boite(0.07, 0.56, 0.07, P.boisFonce, { x, y: 0.16, z });
    for (const z of [-0.2, 0.2]) a.boite(1.64, 0.05, 0.04, P.boisFonce, { y: 0.1, z, trait: false });
    a.boite(1.8, 0.07, 0.54, P.bois, { y: 0.44 })
      // le feutre rouge, qui retombe un peu devant et derrière
      .boite(1.86, 0.02, 0.58, rouge, { y: 0.485 })
      .boite(1.86, 0.11, 0.02, rouge, { y: 0.43, z: -0.3, trait: false })
      .boite(1.86, 0.11, 0.02, rouge, { y: 0.43, z: 0.3, trait: false })
      // le plateau laqué : une tasse de thé vert, deux gâteaux en feuille d'érable
      .boite(0.36, 0.025, 0.24, P.noir, { x: 0.45, y: 0.508 })
      .cylindre(0.045, 0.035, 0.07, 10, P.blanc, { x: 0.37, y: 0.555 })
      .cylindre(0.038, 0.038, 0.006, 10, '#8fae4a', { x: 0.37, y: 0.593, trait: false }) // (le thé, à peine au-dessus du bord : pas dans son plan)
      .boite(0.11, 0.035, 0.085, '#c98a4a', { x: 0.5, y: 0.538, z: -0.04, ry: 0.4 })
      .boite(0.11, 0.035, 0.085, '#c98a4a', { x: 0.53, y: 0.543, z: 0.06, ry: -0.3 });
    // le parasol : la hampe de bambou derrière le banc, la toile en cône aplati, ses baleines dessous
    const hp = 2.3, R = 1.35, px = -0.15, pz = 0.55;
    a.cylindre(0.03, 0.035, hp + 0.25, 8, P.bois, { x: px, y: (hp + 0.25) / 2 - 0.2, z: pz })
      .cylindre(0.12, 0.16, 0.08, 8, P.boisFonce, { x: px, y: -0.02, z: pz })
      .piece(new THREE.ConeGeometry(R, 0.42, 24, 3), ombrelle, { x: px, y: hp + 0.21, z: pz, deformer: (x, y, z) => [x, y - 0.07 * Math.sin(Math.PI * (0.21 - y) / 0.42), z] })
      .cylindre(0.05, 0.03, 0.12, 8, P.boisFonce, { x: px, y: hp + 0.45, z: pz });
    for (let i = 0; i < 12; i++) {
      const t = (i / 12) * 2 * PI;
      a.baton([px, hp - 0.12, pz], [px + Math.sin(t) * R * 0.97, hp + 0.005, pz + Math.cos(t) * R * 0.97], 0.012, P.boisFonce, 4, { trait: false });
    }
    // les fils colorés tressés sous la toile, autour de la hampe (les kagari-ito)
    a.cylindre(0.2, 0.2, 0.025, 16, P.blanc, { x: px, y: hp + 0.33, z: pz, trait: false })
      .cylindre(0.16, 0.16, 0.03, 16, '#3a6ea8', { x: px, y: hp + 0.35, z: pz, trait: false });
    poser(a.fin(0, peinture), BANC.x, BANC.z, { y: terrain(BANC.x, BANC.z) });
    monde.mur(BANC.x - 0.9, BANC.z, BANC.x + 0.9, BANC.z, 0.36);
    monde.cercle(BANC.x + px, BANC.z + pz, 0.2);
    // (on s'assoit à côté du plateau, face à la mer)
    // (la caméra de côté : derrière, la hampe du parasol cachait tout)
    bancs.push({ de: [BANC.x - 0.7, BANC.z], a: [BANC.x + 0.1, BANC.z], y: terrain(BANC.x, BANC.z) + 0.495, cap: PI, vue: -0.95 });
  }

  // deux bancs de bois sur la plage, tournés vers le grand torii (le grand-père est assis sur le second) : deux pieds
  // de pierre, l'assise de trois lattes, le dossier de deux lattes sur ses montants. Construits face à +z, tournés.
  for (const b of BANCS_PLAGE) {
    const a = atelier(), y = terrain(b.x, b.z), ax = Math.cos(b.cap), az = -Math.sin(b.cap);
    // (les lattes du dossier un peu enfoncées dans le devant des montants : à quelques millimètres de leur face, elles scintillaient)
    for (const s of [-0.7, 0.7]) {
      a.boite(0.12, 0.45, 0.52, P.pierre, { x: s, y: 0.185, z: -0.02 })
        .boite(0.08, 0.56, 0.05, P.boisFonce, { x: s, y: 0.64, z: -0.255, rx: -0.12 });
    }
    for (const z of [-0.14, 0, 0.14]) a.boite(1.8, 0.04, 0.12, P.bois, { y: 0.42, z });
    for (const yb of [0.63, 0.8]) a.boite(1.8, 0.1, 0.03, P.bois2, { y: yb, z: -0.22, rx: -0.12 });
    poser(a.fin(0, peinture), b.x, b.z, { y, ry: b.cap });
    monde.mur(b.x - ax * 0.9, b.z - az * 0.9, b.x + ax * 0.9, b.z + az * 0.9, 0.3);
    const [s0, s1] = b.libre;
    bancs.push({ de: [b.x + ax * s0, b.z + az * s0], a: [b.x + ax * s1, b.z + az * s1], y: y + 0.44, cap: b.cap });
  }

  // la colline de la pagode : l'escalier de pierre depuis la rue (des marches pleines entre deux murets, un
  // palier en haut), la pagode à cinq étages
  {
    const a = atelier(), E = ESCALIER;
    const n = Math.round((E.h1 - E.h0) / 0.2), t = (E.z1 - E.z0) / n;
    for (let i = 0; i < n; i++) {
      const z = E.z0 + (i + 0.5) * t, haut = rampe(z) + 0.01, bas = rampe(E.z0 + i * t) - 0.75;
      // (une marche sur deux 2 cm plus étroite : les flancs de deux marches qui se chevauchent ne sont pas dans le même plan)
      a.boite(i % 2 ? 2.96 : 2.98, haut - bas, t + 0.05, i % 2 ? P.pierre : P.pierreFonce, { x: E.x, y: (haut + bas) / 2, z });
    }
    a.boite(3.0, 0.8, 1.0, P.pierre, { x: E.x, y: E.h1 - 0.39, z: E.z1 + 0.5 });
    // les murets, qui suivent la pente (des boîtes cisaillées : les bouts restent d'aplomb), et leur chaperon
    const pente = (E.h1 - E.h0) / (E.z1 - E.z0), za = E.z0 - 0.3, zb = E.z1 + 0.3, zm = (za + zb) / 2;
    const cisaille = (x, y, z) => [x, y + pente * (Math.min(E.z1, Math.max(E.z0, z + zm)) - zm), z];
    for (const s of [-1, 1]) {
      a.piece(new THREE.BoxGeometry(0.6, 1.55, zb - za, 1, 1, 29), P.pierre, { x: E.x + s * 1.8, y: rampe(zm) - 0.22, z: zm, deformer: cisaille })
        .piece(new THREE.BoxGeometry(0.72, 0.12, zb - za + 0.08, 1, 1, 29), P.pierreFonce, { x: E.x + s * 1.8, y: rampe(zm) + 0.6, z: zm, deformer: cisaille });
      monde.mur(E.x + s * 1.8, za, E.x + s * 1.8, zb, 0.32);
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
    monde.rampe(E.x - 1.45, E.x + 1.45, E.z0, E.z1, 'z', E.h0 + 0.01, E.h1 + 0.01, { sol: 'pierre' });
    monde.surface(E.x - 1.5, E.x + 1.5, E.z1, E.z1 + 1, E.h1 + 0.01, { sol: 'pierre' });
  }
  // (2026-10-24, la pagode refaite : avant, cinq boîtes vermillon, un panneau par face et les toits) chaque étage : les
  // poteaux qui partagent chaque face en trois travées, la porte de planches au milieu, les murs blancs et leur fenêtre
  // à barreaux (renji-mado) de chaque côté, les poutres ; sous le toit, les consoles en gradins (kumimono) qui montent
  // du haut du mur jusqu'au toit, puis les chevrons, peints au bout en blanc, qui suivent le dessous du toit jusqu'au
  // bord ; aux étages, le balcon et son garde-corps ; une clochette de bronze à chaque coin des toits. En haut, la
  // flèche (sōrin) : le socle, la coupe renversée, le lotus, les neuf anneaux, les flammes et le joyau.
  {
    const a = atelier();
    const k = 24, CREUX = 1.7, RATIO = 0.55, BRONZE = '#5f7a66', VERM = P.vermillon, VERMF = P.vermillonFonce;
    a.ishigaki(0.48 * k, 0.48 * k, 0.12 * k, 0.01 * k, { y: -0.08 * k });
    let y = 0.04 * k;
    // (un point du toit de toitJapon : le pan c, u le long de son bord, v du bord, 0, vers le haut, 1 ; dessous : le
    // dessous du toit)
    const pointToit = (lt, hT, releve, ep, yT, c, u, v, dessous) => {
      const coins = [[-lt / 2, lt / 2], [lt / 2, lt / 2], [lt / 2, -lt / 2], [-lt / 2, -lt / 2]];
      const [x0, z0] = coins[c], [x1, z1] = coins[(c + 1) % 4];
      const ex = x0 + (x1 - x0) * u, ez = z0 + (z1 - z0) * u, e = Math.abs(2 * u - 1) ** 4;
      const f = (1 - v + v * RATIO) * (1 + 0.06 * e * (1 - v));
      return [ex * f, yT + hT * v ** CREUX + releve * e * (1 - v) ** 2 - (dessous ? ep : 0), ez * f];
    };
    for (let i = 0; i < 5; i++) {
      const l = (0.3 - i * 0.032) * k, h = (i === 0 ? 0.1 : 0.075) * k, l2 = l / 2;
      a.boite(l, h, l, VERM, { y: y + h / 2 });
      // chaque face (tournée de ry) : trois travées
      for (let c = 0; c < 4; c++) {
        const ry = (c * PI) / 2, cr = Math.cos(ry), sr = Math.sin(ry);
        const pose = (lx, ly, lz) => ({ x: lx * cr + lz * sr, y: ly, z: -lx * sr + lz * cr, ry });
        // (q : un décalage d'une face sur deux : aux coins, les pièces de deux faces voisines se croisent sans être dans le même plan)
        const t = l / 3, q = c % 2 ? 0.012 : 0;
        // les poteaux (aux coins et entre les travées), en avant du mur
        for (const lx of [-l2, -t / 2, t / 2, l2]) a.boite(0.22, h - 0.012 - 2 * q, 0.2, VERM, pose(lx, y + h / 2, l2 + 0.06));
        // les poutres : en bas, au milieu, en haut
        for (const [yy, hh] of [[y + 0.12, 0.16], [y + h * 0.62, 0.14], [y + h - 0.1, 0.18]]) a.boite(l + 0.12, hh + q, 0.14, VERMF, pose(0, yy + q, l2 + 0.1));
        // la porte de planches du milieu (sombre au rez-de-chaussée), ses traverses
        const hp = h * 0.62 - 0.2;
        a.boite(t - 0.24, hp, 0.06, i ? VERMF : '#4a3226', pose(0, y + 0.2 + hp / 2, l2 + 0.04));
        for (const yy of [y + 0.2 + hp * 0.3, y + 0.2 + hp * 0.75]) a.boite(t - 0.26, 0.07, 0.04, i ? VERM : '#5a3e2e', pose(0, yy, l2 + 0.08));
        // les murs blancs des côtés, et leur fenêtre à barreaux sous la poutre du milieu
        for (const sx of [-1, 1]) {
          a.boite(t - 0.24, hp, 0.04, P.blanc, pose(sx * t, y + 0.2 + hp / 2, l2 + 0.025));
          const hf = h - h * 0.62 - 0.26;
          if (hf > 0.25) {
            a.boite(t - 0.3, hf, 0.03, '#3a2c26', pose(sx * t, y + h * 0.62 + 0.07 + hf / 2, l2 + 0.03));
            for (let j = 0; j < 7; j++) a.boite(0.05, hf - 0.02, 0.05, VERM, { ...pose(sx * t - (t - 0.4) / 2 + j * ((t - 0.4) / 6), y + h * 0.62 + 0.07 + hf / 2, l2 + 0.06), trait: false });
          }
        }
      }
      // le toit, ses mesures
      const lt = l + 0.21 * k, hT = 0.055 * k, releve = 0.035 * k, ep = 0.018 * k, yT = y + h + 0.02 * k;
      a.toitJapon(lt, lt, hT, RATIO, { y: yT, releve, rangs: 8, epaisseur: ep });
      // (la hauteur du dessous du toit à la verticale du mur : jusque-là montent les consoles)
      const vMur = Math.min(1, (lt / 2 - l2) / (lt / 2 - (lt / 2) * RATIO));
      const yDessous = pointToit(lt, hT, releve, ep, yT, 0, 0.5, vMur, true)[1];
      // les consoles en gradins : trois rangs de blocs, chacun plus large et plus avancé
      for (let c = 0; c < 4; c++) {
        const ry = (c * PI) / 2, cr = Math.cos(ry), sr = Math.sin(ry);
        const pose = (lx, ly, lz) => ({ x: lx * cr + lz * sr, y: ly, z: -lx * sr + lz * cr, ry });
        const nb = 7, haut = Math.max(0.3, yDessous - (y + h)) / 3, q = c % 2 ? 0.012 : 0;
        for (let r = 0; r < 3; r++) {
          const yy = y + h + haut * (r + 0.5) + q, avance = 0.12 + r * 0.22;
          a.boite(l + 0.3 + r * 0.45, 0.05, 0.12, VERMF, { ...pose(0, y + h + haut * r + 0.02 + q, l2 + avance - 0.05), trait: false });
          for (let j = 0; j < nb + r; j++) {
            const lx = -(l2 + r * 0.2) + (j * (l + r * 0.4)) / (nb + r - 1);
            a.boite(0.2, haut * 0.8, 0.26 + r * 0.06, j % 2 ? VERM : '#e9e2cf', pose(lx, yy, l2 + avance));
          }
        }
        // les chevrons : sous le toit, du haut des consoles jusqu'au bord, peints en blanc au bout
        const n = 15;
        for (let j = 1; j < n; j++) {
          const u = j / n, A = pointToit(lt, hT, releve, ep, yT, c, u, vMur * 0.92, true), B = pointToit(lt, hT, releve, ep, yT, c, u, 0.015, true);
          const d = 0.075;
          a.baton([A[0], A[1] - d, A[2]], [B[0], B[1] - d, B[2]], 0.045, VERM, 4, { trait: false });
          const T = pointToit(lt, hT, releve, ep, yT, c, u, 0.005, true);
          a.boite(0.1, 0.09, 0.1, '#f1ebdc', { x: T[0], y: T[1] - d, z: T[2], ry: (c * PI) / 2, trait: false });
        }
        // la clochette du coin : sa chaîne, la cloche de bronze et son battant
        const C0 = pointToit(lt, hT, releve, ep, yT, c, 0.005, 0.005, true);
        a.baton([C0[0], C0[1] - 0.05, C0[2]], [C0[0], C0[1] - 0.45, C0[2]], 0.012, BRONZE, 4, { trait: false })
          .cylindre(0.07, 0.11, 0.24, 8, BRONZE, { x: C0[0], y: C0[1] - 0.58, z: C0[2] })
          .boite(0.02, 0.18, 0.08, BRONZE, { x: C0[0], y: C0[1] - 0.78, z: C0[2], trait: false });
      }
      // le balcon des étages (sur le toit du dessous) et son garde-corps
      if (i > 0) {
        const lb = l + 0.9, yb = y + 0.08;
        a.boite(lb - 0.05, 0.1, lb - 0.05, VERMF, { y: yb });
        for (let c = 0; c < 4; c++) {
          const ry = (c * PI) / 2, cr = Math.cos(ry), sr = Math.sin(ry);
          const pose = (lx, ly, lz) => ({ x: lx * cr + lz * sr, y: ly, z: -lx * sr + lz * cr, ry }), q = c % 2 ? 0.012 : 0;
          a.boite(lb, 0.07, 0.07, VERM, pose(0, yb + 0.62 + q, lb / 2 - 0.03)).boite(lb, 0.05, 0.05, VERM, { ...pose(0, yb + 0.3 + q, lb / 2 - 0.03), trait: false });
          for (let j = 0; j <= 6; j++) a.boite(0.08, 0.66 + q, 0.08, VERM, pose(-lb / 2 + 0.07 + (j * (lb - 0.14)) / 6, yb + 0.33 + q / 2, lb / 2 - 0.03 + (j % 2 ? 0.004 : 0)));
        }
      }
      y += h + 0.065 * k;
    }
    // la flèche : le socle carré, la coupe renversée (fukubachi), le lotus (ukebana), le mât et ses neuf anneaux, les
    // flammes (suien), le joyau (hōju)
    a.boite(0.1 * k, 0.03 * k, 0.1 * k, BRONZE, { y: y + 0.015 * k })
      .piece(new THREE.SphereGeometry(0.04 * k, 14, 6, 0, 2 * PI, 0, PI / 2), BRONZE, { y: y + 0.03 * k })
      .cylindre(0.035 * k, 0.02 * k, 0.025 * k, 12, P.or, { y: y + 0.08 * k });
    a.cylindre(0.009 * k, 0.011 * k, 0.26 * k, 6, P.or, { y: y + 0.17 * k });
    for (let i = 0; i < 9; i++) a.cylindre((0.026 - i * 0.0012) * k, (0.026 - i * 0.0012) * k, 0.007 * k, 10, P.or, { y: y + (0.1 + i * 0.019) * k });
    for (let j = 0; j < 4; j++) a.boite(0.045 * k, (0.05 - j * 0.002) * k, 0.003 * k, P.or, { y: y + 0.3 * k, ry: (j * PI) / 4, trait: false });
    a.boule(0.014 * k, P.or, { y: y + 0.335 * k }, 1).cone(0.007 * k, 0.025 * k, 8, P.or, { y: y + 0.357 * k });
    const yP = terrain(COLLINE.x, COLLINE.z), px = COLLINE.x, pz = COLLINE.z + 2;
    poser(a.fin(0, peinture), px, pz, { y: yP });
    monde.cercle(px, pz, 6.6);
    monde.surface(px - 5.8, px + 5.8, pz - 5.8, pz + 5.8, yP + 0.96, { plein: true });
    monde.bloc(px - 3.7, px + 3.7, pz - 3.7, pz + 3.7, yP - 2, yP + 19);
    monde.bloc(px - 6.3, px + 6.3, pz - 6.3, pz + 6.3, yP + 3.3, yP + 19);
  }
  // le stand du tampon, près de la pagode, et des lanternes sur la colline
  const TAMPON_PAGODE = { x: 41.6, z: 29.5 };
  {
    const a = atelier();
    a.boite(0.12, 1.1, 0.12, P.boisFonce, { y: 0.55 })
      .boite(0.9, 0.12, 0.6, P.bois, { y: 1.12 })
      .boite(0.7, 0.3, 0.45, P.boisFonce, { y: 1.33 })
      .pignon(1.2, 0.35, 0.9, P.toit, { y: 1.62 })
      .boite(0.16, 0.12, 0.16, '#d8452e', { x: 0.28, y: 1.24, z: -0.12, trait: false })
      .boite(0.5, 0.18, 0.04, P.papier, { y: 1.33, z: -0.24, trait: false });
    poser(a.fin(0, peinture), TAMPON_PAGODE.x, TAMPON_PAGODE.z, { ry: PI * 0.35 });
    monde.cercle(TAMPON_PAGODE.x, TAMPON_PAGODE.z, 0.6);
  }
  for (const [x, z] of [[43.6, 19.3], [48.4, 19.3], [43.3, 28.9], [48.7, 28.9], [38.5, 33], [40, 39]]) {
    poser(atelier().lanterne(0, 0, 6.5).fin(0, peinture), x, z);
    monde.cercle(x, z, 0.45);
    lumieres.push({ x, y: terrain(x, z) + 1.3, z, halo: 0.45, sol: terrain(x, z), r: 2.1 });
  }

  // ---------------------------------------------------------------- Le secret : les corbeaux sacrés (2026-10-23)
  const animes = []; // ce qui bouge et qu'on anime (balade.js) : { objet, maj(dt, temps, contexte) → les cris }
  const groupeSecret = new THREE.Group();
  let ouvert = secretTrouve('corbeaux'), ouverture = ouvert ? 1 : 0;
  // la pierre plate des offrandes, à demi cachée derrière la pagode, sur deux rochers, un peu de mousse
  const yPierre = terrain(PIERRE.x, PIERRE.z) + 0.3;
  {
    const a = atelier(), y0 = terrain(PIERRE.x, PIERRE.z);
    a.rocher(PIERRE.x - 0.28, y0 + 0.06, PIERRE.z + 0.12, 0.32, P.pierreFonce).rocher(PIERRE.x + 0.34, y0 + 0.04, PIERRE.z - 0.1, 0.27, P.pierre)
      .boite(0.96, 0.12, 0.72, P.pierre, { x: PIERRE.x, y: yPierre - 0.06, z: PIERRE.z, ry: 0.3, nuance: 0.06 })
      .ovale(0.12, P.herbeFonce, { x: PIERRE.x - 0.32, y: yPierre - 0.005, z: PIERRE.z + 0.2, sx: 1.4, sy: 0.12, trait: false }, 8);
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
    monde.cercle(PIERRE.x, PIERRE.z, 0.62);
  }
  // le gâteau posé (on le voit sur la pierre jusqu'à ce qu'un corbeau le prenne)
  const manjuPose = ctx.maillage(atelier().boite(0.12, 0.04, 0.09, '#c98a4a', { ry: 0.5 }).boite(0.09, 0.005, 0.06, '#e8b46a', { y: 0.022, ry: 0.5, trait: false }).fin(0, false));
  manjuPose.position.set(PIERRE.x + 0.05, yPierre + 0.02, PIERRE.z);
  manjuPose.visible = false;
  groupeSecret.add(manjuPose);

  // le bosquet de bambous : un cercle de tiges serrées autour d'une clairière, sauf une porte à l'est, fermée par
  // d'autres bambous (les deux battants : ils s'écartent comme des portes quand les corbeaux y mènent)
  const B = BOSQUET, yB = terrain(B.x, B.z), VERT = '#7fa84a', VERT2 = '#93b85a', NOEUD = '#5f8a3a', FEUILLE = '#5f9a45';
  /** Une tige de bambou en (x, z) : ses nœuds, ses feuilles en haut (raides au vent : « conifere »). */
  const bambou = (a, x, z, h, rr, y0, k) => {
    a.cylindre(rr * 0.85, rr, h, 7, k % 3 ? VERT : VERT2, { x, y: y0 + h / 2 - 0.1, z });
    for (let y = 0.6 + (k % 4) * 0.12; y < h - 0.4; y += 0.55 + (k % 3) * 0.08) a.cylindre(rr * 1.12, rr * 1.12, 0.035, 7, NOEUD, { x, y: y0 + y, z, trait: false });
    for (let f = 0; f < 6; f++) {
      const t = k * 1.7 + f * 1.05, yf = y0 + h * (0.68 + 0.05 * f);
      a.cone(0.06, 0.62, 3, FEUILLE, { x: x + Math.sin(t) * 0.28, y: yf, z: z + Math.cos(t) * 0.28, rx: Math.cos(t) * 1.25, rz: -Math.sin(t) * 1.25, sz: 0.25, sorte: 'conifere' });
    }
  };
  const dansPorte = (t) => Math.abs(((t - B.porte + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI) < B.ouverture;
  {
    const a = atelier();
    let k = 0;
    const tiges = [[B.x + 5.6, B.z + 2.1, 0.085]]; // (le grand bambou, plus bas : les autres s'en écartent aussi)
    for (let i = 0; i < 150; i++) {
      const t = hasard(i, 3.3) * 2 * Math.PI, rr = B.r - 0.4 + hasard(i, 7.1) * 1.7, ep = 0.055 + hasard(i, 5.2) * 0.035;
      if (dansPorte(t)) continue;
      const x = B.x + Math.sin(t) * rr, z = B.z + Math.cos(t) * rr;
      // (deux tiges ne se touchent pas : leurs nœuds, à la même hauteur, scintilleraient)
      if (tiges.some(([u, v, e]) => Math.hypot(x - u, z - v) < (e + ep) * 1.15 + 0.02)) continue;
      tiges.push([x, z, ep]);
      bambou(a, x, z, 6 + hasard(i, 1.9) * 2.6, ep, terrain(x, z), k++);
    }
    // le grand bambou au bord de la porte, dehors : un corbeau s'y pose en dernier, pour qu'on le voie de loin
    bambou(a, B.x + 5.6, B.z + 2.1, 8.6, 0.085, terrain(B.x + 5.6, B.z + 2.1), 7);
    poser(a.fin(0, peinture), 0, 0, { y: 0 });
    monde.cercle(B.x + 5.6, B.z + 2.1, 0.2);
    // ce qui arrête : un mur tout autour (des segments), sauf la porte ; la porte a le sien, ôté quand elle s'ouvre
    const n = 22, R = B.r + 0.35;
    for (let j = 0; j < n; j++) {
      const t0 = (j / n) * 2 * Math.PI, t1 = ((j + 1) / n) * 2 * Math.PI;
      if (dansPorte((t0 + t1) / 2)) continue;
      monde.mur(B.x + Math.sin(t0) * R, B.z + Math.cos(t0) * R, B.x + Math.sin(t1) * R, B.z + Math.cos(t1) * R, 0.55);
    }
    // la caméra n'y entre pas (dans la clairière, elle reste en deçà des tiges) : seize blocs le long du cercle
    for (let j = 0; j < 16; j++) {
      const t0 = (j / 16) * 2 * Math.PI, t1 = ((j + 1) / 16) * 2 * Math.PI;
      if (dansPorte((t0 + t1) / 2)) continue;
      const xs = [Math.sin(t0) * R, Math.sin(t1) * R].map((v) => B.x + v), zs = [Math.cos(t0) * R, Math.cos(t1) * R].map((v) => B.z + v);
      monde.bloc(Math.min(...xs) - 0.25, Math.max(...xs) + 0.25, Math.min(...zs) - 0.25, Math.max(...zs) + 0.25, yB - 1, yB + 8);
    }
  }
  // la porte : deux battants de bambous, chacun pivote autour de son bord extérieur (ses tiges, dans le repère du battant)
  const R = B.r + 0.2, ta = B.porte - B.ouverture, tb = B.porte + B.ouverture;
  const battants = [[ta, 1], [tb, -1]].map(([t, sens], j) => {
    const a = atelier(), hx = B.x + Math.sin(t) * R, hz = B.z + Math.cos(t) * R;
    for (let i = 0; i < 6; i++) {
      const u = (i + 0.5) / 6, tt = t + sens * u * B.ouverture, rr = R + (hasard(i, j) - 0.5) * 0.5;
      const x = B.x + Math.sin(tt) * rr - hx, z = B.z + Math.cos(tt) * rr - hz;
      bambou(a, x, z, 6.4 + hasard(i, j + 4) * 2, 0.06 + hasard(j, i) * 0.03, terrain(B.x + Math.sin(tt) * rr, B.z + Math.cos(tt) * rr) - yB, i + 3 * j);
    }
    const g = ctx.maillage(a.fin(0, peinture));
    const pivotB = new THREE.Group();
    pivotB.position.set(hx, yB, hz);
    pivotB.add(g);
    groupeSecret.add(pivotB);
    return { pivotB, sens };
  });
  const xPorte = B.x + Math.sin(B.porte) * R, zPorte = B.z + Math.cos(B.porte) * R;
  monde.mur(B.x + Math.sin(ta) * R, B.z + Math.cos(ta) * R, B.x + Math.sin(tb) * R, B.z + Math.cos(tb) * R, 0.55);
  const murPorte = monde.murs[monde.murs.length - 1];
  const ouvrirPorte = () => { ouvert = true; const i = monde.murs.indexOf(murPorte); if (i >= 0) monde.murs.splice(i, 1); };
  if (ouvert) ouvrirPorte();

  // le petit sanctuaire oublié (hokora) : un socle de pierre, la châsse de bois gris couverte de mousse, son toit, la
  // corde sacrée ; devant, le petit torii délavé ; deux corbeaux de pierre sur leurs socles ; le plateau d'offrandes
  // (sanbō) ; une lanterne de pierre ; un rai de lumière qui tombe des bambous
  {
    const a = atelier(), BOIS_GRIS = '#8f7d68', y0 = terrain(HOKORA.x, HOKORA.z);
    a.boite(1.2, 0.45, 1.0, P.pierreFonce, { y: 0.2 })
      .boite(0.74, 0.62, 0.58, BOIS_GRIS, { y: 0.74 })
      .boite(0.5, 0.42, 0.02, '#5a4a3a', { y: 0.74, z: 0.3, trait: false })
      .toitJapon(1.0, 0.9, 0.38, 0.2, { y: 1.05, releve: 0.05, rangs: 6, epaisseur: 0.05 })
      .ovale(0.18, P.herbeFonce, { x: 0.2, y: 1.18, z: 0.1, sx: 1.4, sy: 0.25, trait: false }, 8)
      .shimenawa([[-0.38, 1.0, 0.33], [0, 0.96, 0.36], [0.38, 1.0, 0.33]], 0.022, [[-0.15, 0.95, 0.37], [0.15, 0.95, 0.37]]);
    for (let k = 0; k < 5; k++) a.boite(0.012, 0.36, 0.012, '#3a3030', { x: -0.2 + k * 0.1, y: 0.74, z: 0.312, trait: false });
    poser(a.fin(0, peinture), HOKORA.x, HOKORA.z, { y: y0, ry: Math.PI / 2 });
    monde.cercle(HOKORA.x, HOKORA.z, 0.72);
    // le petit torii, devant, et les deux corbeaux de pierre sur leurs socles
    const t = atelier(), yt = terrain(TORII_CACHE.x, TORII_CACHE.z), DELAVE = '#c86a4e';
    for (const sz of [-0.62, 0.62]) t.cylindre(0.07, 0.08, 1.95, 10, DELAVE, { z: sz, y: 0.95 }).cylindre(0.1, 0.1, 0.12, 10, P.noir, { z: sz, y: 0.02 });
    t.boite(0.14, 0.1, 1.6, DELAVE, { y: 1.62 }).boite(0.16, 0.14, 1.95, DELAVE, { y: 1.98, deformer: (x, y, z) => [x, y + 0.05 * (z / 0.97) ** 2, z] })
      .boite(0.18, 0.06, 2.0, P.noir, { y: 2.08, deformer: (x, y, z) => [x, y + 0.06 * (z / 1.0) ** 2, z] });
    poser(t.fin(0, peinture), TORII_CACHE.x, TORII_CACHE.z, { y: yt });
    for (const sz of [-0.62, 0.62]) monde.cercle(TORII_CACHE.x, TORII_CACHE.z + sz, 0.14);
    const statue = (x, z, sens) => {
      const c = atelier(), y = terrain(x, z), G = '#8e8a82';
      c.boite(0.4, 0.42, 0.4, P.pierreFonce, { y: 0.2 }).ovale(0.14, G, { y: 0.56, sx: 0.8, sz: 1.5 }, 10).ovale(0.09, G, { y: 0.68, z: 0.14 }, 8)
        .cone(0.03, 0.12, 6, G, { y: 0.67, z: 0.27, rx: Math.PI / 2 + 0.2 }).boite(0.12, 0.02, 0.16, G, { y: 0.5, z: -0.24, rx: -0.3 })
        .ovale(0.1, '#7a8a5a', { y: 0.63, z: -0.02, sx: 0.8, sy: 0.25, trait: false }, 6);
      poser(c.fin(0, peinture), x, z, { y, ry: sens });
      monde.cercle(x, z, 0.3);
    };
    statue(13.7, 39.55, Math.PI / 2 + 0.3);
    statue(13.7, 41.65, Math.PI / 2 - 0.3);
    // le plateau d'offrandes (sanbō) : un petit support de bois clair, percé, et son plateau
    const s3 = atelier(), ys = terrain(SANBO.x, SANBO.z);
    s3.boite(0.3, 0.3, 0.3, '#d8c09a', { y: 0.15 }).boite(0.36, 0.035, 0.36, '#d8c09a', { y: 0.32 })
      .boite(0.36, 0.04, 0.01, '#d8c09a', { y: 0.355, z: 0.175 }).boite(0.36, 0.04, 0.01, '#d8c09a', { y: 0.355, z: -0.175 })
      .boite(0.01, 0.04, 0.36, '#d8c09a', { x: 0.175, y: 0.355 }).boite(0.01, 0.04, 0.36, '#d8c09a', { x: -0.175, y: 0.355 })
      .ovale(0.07, '#5a4a3a', { y: 0.15, z: 0.152, sz: 0.1, trait: false }, 8);
    poser(s3.fin(0, peinture), SANBO.x, SANBO.z, { y: ys });
    monde.cercle(SANBO.x, SANBO.z, 0.25);
    poser(atelier().lanterne(0, 0, 5.2).fin(0, peinture), 16.5, 42.4);
    monde.cercle(16.5, 42.4, 0.35);
    lumieres.push({ x: 16.5, y: terrain(16.5, 42.4) + 1.05, z: 42.4, halo: 0.35, sol: terrain(16.5, 42.4), r: 1.8 });
    // des feuilles de bambou tombées, des touffes de mousse
    const f = atelier();
    for (let i = 0; i < 70; i++) {
      const t2 = hasard(i, 9.1) * 2 * Math.PI, rr = Math.sqrt(hasard(i, 2.7)) * (B.r - 0.6), x = B.x + Math.sin(t2) * rr, z = B.z + Math.cos(t2) * rr;
      f.boite(0.04, 0.004, 0.16, hasard(i, 4.4) > 0.5 ? '#c9b26a' : '#9fb05a', { x, y: terrain(x, z) + 0.035, z, ry: hasard(i, 8.8) * 6, trait: false });
    }
    poser(f.fin(0, false), 0, 0, { y: 0, ombre: false });
  }
  // le koban sur le plateau (il brille et tourne doucement) ; le rai de lumière qui tombe sur le sanctuaire
  const koban = ctx.maillage(atelier().ovale(0.045, '#f2c84f', { sy: 1.4, sz: 0.18 }, 12).ovale(0.034, '#d9a63e', { sy: 1.4, sz: 0.2, trait: false }, 10).fin(0, false));
  koban.position.set(SANBO.x, terrain(SANBO.x, SANBO.z) + 0.43, SANBO.z);
  koban.visible = !secretTrouve('corbeaux');
  groupeSecret.add(koban);
  // (le rai : additif, plus fort au milieu de sa hauteur, effacé en haut, en bas et sur ses bords, vus de biais)
  const rai = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 1.4, 9, 20, 1, true), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { force: { value: 0.1 } },
    vertexShader: `
      varying vec2 vUv;
      varying float vFace;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vFace = abs(dot(normalize(normalMatrix * normal), normalize(-mv.xyz)));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform float force;
      varying vec2 vUv;
      varying float vFace;
      void main() {
        float a = force * smoothstep(0.0, 0.35, vUv.y) * (1.0 - smoothstep(0.75, 1.0, vUv.y)) * vFace * vFace;
        gl_FragColor = vec4(vec3(1.0, 0.94, 0.76) * a, 1.0);
      }`,
  }));
  rai.position.set(HOKORA.x + 0.6, yB + 4.5, HOKORA.z);
  rai.rotation.z = 0.12;
  groupeSecret.add(rai);
  // les corbeaux : de la pierre, ils passent par la lanterne de la colline, l'érable du sud, le grand bambou de la
  // porte, et se posent sur le petit torii
  const yTorii = terrain(TORII_CACHE.x, TORII_CACHE.z) + 2.14;
  const corbeaux = creerCorbeaux(ctx.perso || ctx, {
    pierre: { x: PIERRE.x, y: yPierre + 0.04, z: PIERRE.z },
    perches: [
      { x: 40, y: terrain(40, 39) + 1.92, z: 39 },
      { x: 28, y: terrain(28, 31) + 6.15, z: 31 },
      { x: B.x + 5.6, y: terrain(B.x + 5.6, B.z + 2.1) + 8.55, z: B.z + 2.1 },
    ],
    nid: [{ x: TORII_CACHE.x, y: yTorii, z: TORII_CACHE.z - 0.75, cap: -Math.PI / 2 }, { x: TORII_CACHE.x, y: yTorii, z: TORII_CACHE.z + 0.75, cap: -Math.PI / 2 }],
    arrivee: [44, 30, 30],
    prendre: () => { manjuPose.visible = false; },
  });
  groupeSecret.add(corbeaux.groupe);
  if (secretTrouve('corbeaux')) corbeaux.installer();
  animes.push({
    objet: groupeSecret,
    maj(dt, temps, c) {
      const cris = corbeaux.animer(dt, temps, c.joueur, c.nuit).map((q) => ({ ...q, nom: 'corbeau' }));
      // la porte s'ouvre quand les corbeaux sont au sanctuaire et qu'on arrive devant
      if (!ouvert && corbeaux.guideFini() && Math.hypot(c.joueur.x - xPorte, c.joueur.z - zPorte) < 5.5) {
        ouvrirPorte();
        c.scene(async (jeu) => {
          jeu.son('magie');
          await jeu.attendre(900);
          await jeu.dire(jeu.tx('bambousOuverts'));
          await jeu.dire(jeu.tx('bambousCompagnon')[jeu.compagnon], 'compagnon');
        });
      }
      if (ouvert && ouverture < 1) ouverture = Math.min(1, ouverture + dt / 1.8);
      const o = ouverture * ouverture * (3 - 2 * ouverture);
      for (const { pivotB, sens } of battants) { pivotB.rotation.y = sens * 1.25 * o; pivotB.rotation.z = -sens * 0.12 * o; }
      koban.rotation.y = temps * 1.4;
      rai.material.uniforms.force.value = 0.09 + 0.03 * Math.sin(temps * 0.8);
      return cris;
    },
  });

  // ---- Bunbuku, le marchand ambulant : sous les pins du sud, entre le sanctuaire et la colline
  const MARCHAND = { x: 27.2, z: 25.2, cap: Math.atan2(26 - 27.2, 19 - 25.2) };

  // ---- Les panneaux de bois (à lire)
  const PANNEAUX = {
    bienvenue: { x: 24, z: 1.8, ry: -0.3 },
    torii: { x: 14.6, z: -9.4, ry: -0.8 },
    daims: { x: 45, z: -1.2, ry: 0.2 },
    entree: { x: 25.5, z: 11.6, ry: PI / 2 - 0.2 },
    no: { x: -16, z: -11.55, ry: PI, y: PLANCHER },
    pagode: { x: 50.5, z: 29.7, ry: 1.15 },
  };
  const TITRES = { bienvenue: '厳島神社', torii: '大鳥居', daims: '鹿に注意', entree: '入口', no: '能舞台', pagode: '五重塔' };
  for (const [id, p] of Object.entries(PANNEAUX)) {
    const pose = { x: p.x, z: p.z, y: p.y ?? monde.hauteur(p.x, p.z), ry: p.ry };
    poser(panneau(atelier(), P, { ecrit: true }).fin(0, peinture), p.x, p.z, pose);
    ecrire(pose, { ...PAPIER_PANNEAU, texte: TITRES[id], lignes: 3, fond: P.papier, encre: id === 'daims' ? '#b8322a' : '#2a2420' });
    if (!p.y) monde.cercle(p.x, p.z, 0.75);
    else monde.mur(p.x - 0.8, p.z, p.x + 0.8, p.z, 0.25, PLANCHER - 0.3, PLANCHER + 3);
  }

  // ---- Le trépied du vidéaste (il filme le torii), sur la plage
  const VIDEASTE = { x: 22.5, z: -4, cap: Math.atan2(TORII.x - 22.5, TORII.z + 4) };
  {
    const a = trepied(atelier());
    const tx = VIDEASTE.x + Math.sin(VIDEASTE.cap) * 0.8 + Math.cos(VIDEASTE.cap) * 0.5, tz = VIDEASTE.z + Math.cos(VIDEASTE.cap) * 0.8 - Math.sin(VIDEASTE.cap) * 0.5;
    poser(a.fin(0, peinture), tx, tz, { y: terrain(tx, tz) + 1.3, ry: VIDEASTE.cap });
    monde.cercle(tx, tz, 0.45);
  }

  // ---- La barque du batelier : le soir, il promène les visiteurs sous le grand torii illuminé (à lui de faire tomber
  // la nuit, et revenir le jour). Une barque de bois à godille (ro), amarrée dans l'eau peu profonde de l'estran, la
  // proue vers le torii ; ses deux bancs, la rame posée sur son tolet à la poupe, la lanterne de papier au bout d'une
  // perche de bambou (allumée la nuit) ; un pieu sur le sable et la corde. Construite la proue vers +z, puis tournée.
  {
    const a = atelier(), L = 5.2, { x: bx, z: bz, cap } = BARQUE;
    // la coque : un U épais (les deux bords et le fond) tiré sur la longueur, effilé vers la proue, qui se relève
    // (sa quille aussi), un peu moins large à la poupe ; posée sur l'eau, son fond à fleur (l'eau ne passe pas dedans)
    const largeur = (t) => (t < 0.55 ? 0.86 + 0.14 * (t / 0.55) : 1 - ((t - 0.55) / 0.45) ** 1.6 * 0.93);
    const tonture = (t, y) => 0.36 * Math.max(0, (t - 0.6) / 0.4) ** 2 + 0.05 * (1 - t) ** 2 + (y < 0 ? 0.24 * Math.max(0, (t - 0.72) / 0.28) ** 2 : 0);
    const u = new THREE.Shape([[-0.62, 0.32], [-0.48, -0.16], [0.48, -0.16], [0.62, 0.32], [0.56, 0.32], [0.43, -0.1], [-0.43, -0.1], [-0.56, 0.32]].map(([x, y]) => new THREE.Vector2(x, y)));
    a.piece(new THREE.ExtrudeGeometry(u, { depth: L, steps: 14, bevelEnabled: false }), P.bois2, {
      y: 0.16, z: -L / 2,
      deformer: (x, y, z) => { const t = z / L; return [x * largeur(t), y + tonture(t, y), z]; },
      teinte: (x, y, z) => (y > 0.42 + tonture((z + L / 2) / L, 1) ? P.boisFonce : P.bois2), // (le plat-bord, plus sombre)
    });
    // la planche de poupe (le tableau arrière), les deux bancs en travers, le tolet et la godille qui plonge derrière
    a.boite(0.98, 0.42, 0.06, P.boisFonce, { y: 0.31, z: -L / 2 + 0.05 });
    for (const t of [0.3, 0.6]) a.boite(1.04 * largeur(t), 0.05, 0.26, P.bois3, { y: 0.4 + tonture(t, 1), z: -L / 2 + t * L });
    a.boite(0.1, 0.1, 0.1, P.boisFonce, { x: 0.28, y: 0.56, z: -L / 2 + 0.12 })
      .baton([0.28, 0.62, -L / 2 + 0.15], [0.62, -0.1, -L / 2 - 2.3], 0.035, P.bois3, 6)
      .boite(0.04, 0.5, 0.2, P.bois3, { x: 0.66, y: -0.18, z: -L / 2 - 2.45, rx: -0.3 });
    // la perche de bambou à la proue, et sa lanterne rouge
    const zp = L / 2 - 0.75, yp = 0.3 + tonture(1 - 0.75 / L, 1);
    a.baton([0, yp, zp], [0, yp + 1.75, zp + 0.25], 0.025, '#b9a35a', 6)
      .baton([0, yp + 1.7, zp + 0.24], [0, yp + 1.72, zp + 0.62], 0.018, '#b9a35a', 5)
      .baton([0, yp + 1.71, zp + 0.6], [0, yp + 1.65, zp + 0.6], 0.006, P.noir, 4, { trait: false })
      .chochin(0, yp + 1.42, zp + 0.6, 8);
    poser(a.fin(0, peinture), bx, bz, { y: 0, ry: cap });
    // (sa lumière tombe sur l'eau)
    lumieres.push({ x: bx + Math.sin(cap) * (zp + 0.6), y: yp + 1.42, z: bz + Math.cos(cap) * (zp + 0.6), halo: 0.5, sol: 0, r: 1.9, c: '#ffa565' });
    // le pieu sur le sable, la corde tendue jusqu'à la poupe
    const sx = bx - Math.sin(cap) * (L / 2 + 0.15), sz = bz - Math.cos(cap) * (L / 2 + 0.15), [px, pz] = BARQUE.pieu;
    const yp0 = terrain(px, pz);
    const c = atelier()
      .cylindre(0.07, 0.06, 0.95, 7, P.boisFonce, { x: px, y: yp0 + 0.3, z: pz })
      .baton([px, yp0 + 0.62, pz], [sx, 0.5, sz], 0.015, '#e8d9b5', 5);
    poser(c.fin(0, peinture), 0, 0, { y: 0 });
    monde.mur(bx - Math.sin(cap) * L / 2, bz - Math.cos(cap) * L / 2, bx + Math.sin(cap) * L / 2, bz + Math.cos(cap) * L / 2, 0.7);
    monde.cercle(px, pz, 0.25);
  }

  // ---------------------------------------------------------------- Le décor lointain
  // le mont Misen au sud, la côte d'Hiroshima au nord, des nuages
  {
    const a = atelier();
    for (const [x, y, z, r, sy] of [[-70, -70, 360, 210, 0.62], [130, -90, 460, 240, 0.6], [-260, -60, 420, 180, 0.55], [40, -40, 250, 120, 0.55], [240, -40, 300, 120, 0.5]]) {
      a.piece(new THREE.IcosahedronGeometry(r, 2), P.montagne, { x, y, z, sy, nuance: 0.07, deformer: (px, py, pz) => { const f = 1 + 0.1 * Math.sin(px * 0.05) * Math.sin(pz * 0.06); return [px * f, py * f, pz * f]; } });
    }
    poser(a.fin(0, peinture), 0, 0, { y: 0, ombre: false });
  }
  {
    const a = atelier();
    for (const [z, base, hMax, graine] of [[-760, -8, 120, 1], [-1050, -8, 190, 2]]) {
      const tri = [];
      const crete = (x) => base + hMax * (0.55 + 0.25 * Math.sin(x * 0.004 + graine) + 0.2 * Math.sin(x * 0.011 + graine * 3) * Math.sin(x * 0.0027));
      for (let x = -3000; x < 3000; x += 40) {
        const A = [x, base - 20, z], B = [x + 40, base - 20, z], Cc = [x + 40, crete(x + 40), z], D = [x, crete(x), z];
        tri.push(A, B, Cc, A, Cc, D);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(tri.flat(), 3));
      a.piece(g, P.montagneLoin, { trait: false, nuance: 0.03 });
    }
    poser(a.fin(0, false), 0, 0, { y: 0, ombre: false });
  }
  {
    const a = atelier();
    for (const [x, y, z, s] of [[-500, 230, -820, 46], [-120, 260, -900, 60], [260, 210, -760, 40], [620, 250, -880, 55], [-820, 200, -700, 42], [80, 300, 600, 50], [-420, 260, 700, 46]]) {
      for (const [dx, dy, dz, r] of [[0, 0, 0, 1], [1.2, -0.25, 0.1, 0.75], [-1.1, -0.3, 0, 0.7], [0.5, 0.45, 0, 0.6], [-0.4, 0.3, 0.2, 0.55]]) {
        a.boule(r * s, P.nuage, { x: x + dx * s, y: y + dy * s, z: z + dz * s, sy: 0.7 }, 1);
      }
    }
    poser(a.fin(0, false), 0, 0, { y: 0, ombre: false });
  }

  // ---------------------------------------------------------------- Les gens, les daims
  const PEAU = P.peau, NOIR = '#2a2420';
  const passants = [
    { id: 'pretre', x: -2.6, z: -6.4, cap: PI, tenue: { taille: 1.12, peau: PEAU, cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'eboshi', c: '#2a2630' }, haut: P.blanc, col: P.blanc, manches: 'kimono', bas: { sorte: 'hakama', c: '#8fb4d8', c2: '#7fa2c8' }, chaussures: '#2a2630', semelle: '#2a2630' } },
    { id: 'miko', x: -7.4, z: -18, cap: PI / 2, tenue: { taille: 1.05, peau: PEAU, cheveux: NOIR, coiffure: 'queue', haut: P.blanc, col: '#e8452e', manches: 'kimono', bas: { sorte: 'hakama', c: '#e0453a', c2: '#c93a30' }, chaussures: P.blanc, semelle: '#c9a65a' } },
    { id: 'videaste', x: VIDEASTE.x, z: VIDEASTE.z, cap: VIDEASTE.cap, tenue: { taille: 1.1, peau: PEAU, cheveux: '#3a2a20', coiffure: 'court', chapeau: { sorte: 'bob', c: '#2f3440' }, haut: '#2f3440', manches: 'courtes', bas: { sorte: 'pantalon', c: '#c9b48a' }, chaussures: P.blanc, semelle: '#3a3236', appareil: true } },
    { id: 'enfant', x: 34, z: -1, cap: 0, ronde: [[31, -1.5], [37, 0.5], [34, 3.2], [30, 1.5]], vitesse: 1.6, attente: [0.5, 2], tenue: { taille: 0.82, peau: PEAU, cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'ecolier', c: '#f6d13a' }, haut: P.blanc, manches: 'courtes', bas: { sorte: 'jupe', c: '#3d4a6a' }, chaussures: P.blanc, semelle: '#3a3236', sac: { sorte: 'randoseru', c: '#c8372d' } } },
    { id: 'marchande', x: 56.78, z: 4.3, cap: -PI / 2, tenue: { taille: 1.06, peau: PEAU, cheveux: NOIR, coiffure: 'chignon', chapeau: { sorte: 'foulard', c: '#f3ead8' }, haut: '#d8452e', manches: 'longues', tablier: '#f6efe0', bas: { sorte: 'pantalon', c: '#3d4a6a' }, chaussures: '#3a3236', semelle: '#3a3236', yeux: 'plisses' } },
    { id: 'touriste', x: 44, z: -1, cap: PI / 2, ronde: [[44, -1], [51, 6], [36, 0.5], [20, -0.5]], vitesse: 1.0, attente: [3, 7], tenue: { taille: 1.1, peau: PEAU, cheveux: '#c98a4a', coiffure: 'chignon', chapeau: { sorte: 'soleil', c: '#fff0cf', c2: '#4fa3c7' }, haut: '#4fa3c7', manches: 'courtes', bas: { sorte: 'short', c: '#f3ead8' }, chaussures: P.blanc, semelle: '#4fa3c7', appareil: true } },
    // le batelier, sur le sable près de sa barque : happi bleu, bandeau blanc, tabi noirs
    { id: 'batelier', x: 26.9, z: -7.8, cap: Math.atan2(28 - 26.9, -2.5 + 7.8), tenue: { taille: 1.08, peau: '#e9b893', cheveux: NOIR, coiffure: 'court', chapeau: { sorte: 'bandeau', c: '#f3ead8' }, haut: '#2f4a7a', col: '#f3ead8', manches: 'kimono', bas: { sorte: 'pantalon', c: '#2a2a34' }, chaussures: '#2a2a30', semelle: '#2a2a30' } },
    { id: 'grandpere', ...GRAND_PERE, tenue: { taille: 1.04, peau: '#f5d2b0', cheveux: '#e8e4dc', coiffure: 'chauve', haut: '#7a6652', manches: 'longues', bas: { sorte: 'pantalon', c: '#5a5650' }, chaussures: '#3a3236', semelle: '#3a3236', lunettes: true, canne: true, yeux: 'plisses' } },
    // sur la scène de nō : l'ange de « Hagoromo » (masque blanc, perruque, couronne d'or, éventail) qui danse en
    // glissant ; au fond, les quatre musiciens (flûte, petit et grand tambours d'épaule et de hanche, tambour plat) ;
    // sur le côté, le chœur ; en kimono noir et hakama gris, assis sur les talons
    { id: 'shite', x: NO.x + 0.6, z: NO.z - 0.4, cap: PI / 2, ronde: [[NO.x + 1.3, NO.z - 0.9], [NO.x + 1.5, NO.z + 1.2], [NO.x - 0.5, NO.z + 1.3], [NO.x - 0.7, NO.z - 0.5]], vitesse: 0.3, attente: [2.5, 5], tenue: { taille: 1.12, peau: '#f1d3b5', cheveux: '#1e1a1c', coiffure: 'kazura', chapeau: { sorte: 'tengan' }, masque: true, haut: '#c8372d', col: '#f3ead8', manches: 'kimono', bas: { sorte: 'hakama', c: '#efe3c2', c2: '#d9c79a' }, chaussures: '#f6f1e6', semelle: '#f6f1e6', pose: 'danse' } },
    ...['fue', 'kotsuzumi', 'otsuzumi', 'taiko'].map((instrument, k) => ({ id: instrument, x: NO.x - 2.15, z: NO.z - 1.6 + k * 1.05, cap: PI / 2, tenue: { taille: 1.04, peau: PEAU, cheveux: NOIR, coiffure: 'court', haut: '#2f2a30', col: P.blanc, manches: 'kimono', bas: { sorte: 'hakama', c: '#6b6a70', c2: '#57565c' }, chaussures: '#f6f1e6', semelle: '#f6f1e6', pose: 'jouer', instrument } })),
    ...[0, 1, 2].map((k) => ({ id: `choeur${k}`, x: NO.x - 0.9 + k * 1.0, z: NO.z - 2.35, cap: 0, tenue: { taille: 1.04, peau: PEAU, cheveux: k === 1 ? '#7a7470' : NOIR, coiffure: k === 1 ? 'chauve' : 'court', haut: '#2f2a30', col: P.blanc, manches: 'kimono', bas: { sorte: 'hakama', c: '#6b6a70', c2: '#57565c' }, chaussures: '#f6f1e6', semelle: '#f6f1e6', pose: 'seiza', instrument: 'eventail' } })),
  ];
  const daims = [
    { x: 31, z: -5.5, cap: -PI / 2 - 0.3, male: true },
    { x: 41, z: 0.6, cap: PI / 2 + 0.4, male: false },
    { x: 50, z: 1.2, cap: 0.6, male: false },
    { x: -18, z: 21.5, cap: 2.2, male: false },
    { x: 52.2, z: 31.4, cap: -1.9, male: true },
  ];

  // ---------------------------------------------------------------- Ce qu'on peut faire (tout passe par `jeu`)
  const interactions = [
    { id: 'pretre', passant: 'pretre', verbe: 'parler', action: (jeu) => jeu.dire(jeu.tx(jeu.estNuit ? 'pretreNuit' : jeu.aTampon('sanctuaire') ? 'pretre2' : 'pretre'), 'pretre') },
    {
      id: 'miko', passant: 'miko', verbe: 'parler',
      async action(jeu) {
        if (jeu.estNuit) { await jeu.dire(jeu.tx('mikoNuit'), 'miko'); return; } // (le comptoir des omikuji ferme la nuit)
        const r = await jeu.choisir(jeu.tx('miko'), [jeu.t('oui'), jeu.t('non')], 'miko');
        if (r !== 0) { await jeu.dire(jeu.tx('mikoNon'), 'miko'); return; }
        const sorts = jeu.tx('omikuji'), k = Math.floor(Math.random() * sorts.length);
        await jeu.dire(sorts[k], 'miko');
        // la malchance : on noue le papier au fil, au bord de la plate-forme
        if (k === sorts.length - 1) await jeu.dire(jeu.tx('omikujiNoue'));
      },
    },
    {
      id: 'videaste', passant: 'videaste', verbe: 'parler',
      async action(jeu) {
        const r = await jeu.choisir(jeu.tx('videaste'), [jeu.t('oui'), jeu.t('non')], 'videaste');
        if (r !== 0) { await jeu.dire(jeu.tx('videasteNon'), 'videaste'); return; }
        await jeu.video();
        await jeu.dire(jeu.tx('videasteApres'), 'videaste');
      },
    },
    { id: 'enfant', passant: 'enfant', verbe: 'parler', action: (jeu) => jeu.dire(jeu.txn('enfant'), 'enfant') },
    {
      id: 'marchande', passant: 'marchande', verbe: 'parler',
      async action(jeu) {
        if (jeu.estNuit) { await jeu.dire(jeu.tx('marchandeNuit'), 'marchande'); return; } // (la boutique ferme : elle ne vend pas la nuit)
        if (jeu.aTampon('momiji')) {
          // (une autre, pour la route : on peut en emporter une ; c'est elle qu'on offre aux corbeaux)
          if (jeu.aDansSac('manju')) { await jeu.dire(jeu.tx('marchande2'), 'marchande'); return; }
          const r = await jeu.choisir(jeu.tx('marchandeEncore'), [jeu.t('oui'), jeu.t('non')], 'marchande');
          if (r !== 0) { await jeu.dire(jeu.tx('marchande2'), 'marchande'); return; }
          jeu.donner('manju');
          await jeu.dire(jeu.tx('marchandeEmporte'));
          return;
        }
        const r = await jeu.choisir(jeu.tx('marchande'), [jeu.t('oui'), jeu.t('non')], 'marchande');
        if (r !== 0) { await jeu.dire(jeu.tx('marchandeNon'), 'marchande'); return; }
        await jeu.dire(jeu.tx('marchandeOui'));
        await jeu.tampon('momiji');
        jeu.donner('manju');
        await jeu.dire(jeu.tx('marchandeEmporte'));
      },
    },
    { id: 'touriste', passant: 'touriste', verbe: 'parler', action: (jeu) => jeu.dire(jeu.txn('touriste'), 'touriste') },
    { id: 'grandpere', passant: 'grandpere', verbe: 'parler', action: (jeu) => jeu.dire(jeu.txn('grandpere'), 'grandpere') },
    {
      // le batelier fait tomber la nuit (le grand torii et le sanctuaire s'illuminent ; elle reste), et, la nuit,
      // revenir le jour
      id: 'batelier', passant: 'batelier', verbe: 'parler',
      async action(jeu) {
        if (jeu.estNuit) {
          const r = await jeu.choisir(jeu.tx('batelierMatin'), [jeu.t('oui'), jeu.t('non')], 'batelier');
          if (r !== 0) { await jeu.dire(jeu.tx('batelierReste'), 'batelier'); return; }
          await jeu.nuit(false);
          await jeu.dire(jeu.tx('batelierJour'), 'batelier');
          return;
        }
        const r = await jeu.choisir(jeu.tx('batelier'), [jeu.t('oui'), jeu.t('non')], 'batelier');
        if (r !== 0) { await jeu.dire(jeu.tx('batelierNon'), 'batelier'); return; }
        // (la caméra regarde le torii depuis la plage pendant que la nuit tombe)
        jeu.cadrer({ de: [28.4, 2.6, -4.6], vers: [TORII.x, 7.5, TORII.z], champ: 30 });
        await jeu.nuit(true);
        await jeu.attendre(600);
        await jeu.dire(jeu.tx('batelierNuit'), 'batelier');
        jeu.cadrer(null);
        await jeu.dire(jeu.tx('batelierApres'), 'batelier');
      },
    },
    {
      id: 'offrande', x: 0, z: -5.6, y: PLANCHER, rayon: 1.6, verbe: 'prier',
      async action(jeu) {
        if (jeu.aTampon('sanctuaire')) { await jeu.dire(jeu.tx('offrande2')); return; }
        jeu.saluer();
        await jeu.dire(jeu.tx('offrande'));
        await jeu.tampon('sanctuaire');
      },
    },
    ...[-1, 1].map((s) => ({
      id: `torii${s}`, x: TORII.x + s * TORII.ecart, z: TORII.z, rayon: 2.2, verbe: 'toucher',
      async action(jeu) {
        if (jeu.aTampon('torii')) { await jeu.dire(jeu.txn('torii2')); return; }
        await jeu.dire(jeu.tx('toriiPilier'));
        await jeu.tampon('torii');
      },
    })),
    {
      id: 'tamponPagode', x: TAMPON_PAGODE.x, z: TAMPON_PAGODE.z, rayon: 1.6, verbe: 'tamponner',
      async action(jeu) {
        if (jeu.aTampon('pagode')) { await jeu.dire([jeu.t('dejaTampon')]); return; }
        await jeu.dire(jeu.tx('standTampon'));
        await jeu.tampon('pagode');
      },
    },
    ...Object.entries(PANNEAUX).map(([id, p]) => ({ id: `panneau-${id}`, x: p.x, z: p.z, y: p.y, rayon: 1.8, verbe: 'lire', action: (jeu) => jeu.dire(jeu.tx(`panneau-${id}`)) })),
    // la pièce de nō, vue depuis le bord ouest de la grande plate-forme
    { id: 'scene-no', x: -8.5, z: NO.z, y: PLANCHER, rayon: 2.4, verbe: 'regarder', action: (jeu) => jeu.dire(jeu.tx('noScene')) },
    { id: 'ema', x: 7.7, z: -20.4, y: PLANCHER, rayon: 1.6, verbe: 'regarder', action: (jeu) => jeu.dire(jeu.tx('ema')) },
    { id: 'musubi', x: 7.7, z: -23.2, y: PLANCHER, rayon: 1.6, verbe: 'regarder', action: (jeu) => jeu.dire(jeu.tx('musubi')) },
    { id: 'tonneaux', x: 15.25, z: 8.6, y: PLANCHER, rayon: 1.7, verbe: 'regarder', action: (jeu) => jeu.dire(jeu.tx('tonneaux')) },
    ...interactionsBancs(bancs),
    // le secret : la pierre plate (on y pose une douceur), le bosquet fermé, le koban, le sanctuaire caché
    {
      id: 'pierre', x: PIERRE.x, z: PIERRE.z, rayon: 1.7, haut: 1.0,
      verbe: (jeu) => (jeu.aDansSac('manju') && corbeaux.mode() === 'cache' && !jeu.secretTrouve('corbeaux') ? 'poser' : 'regarder'),
      async action(jeu) {
        if (jeu.secretTrouve('corbeaux')) { await jeu.dire(jeu.tx('pierreApres')); return; }
        if (corbeaux.mode() !== 'cache') { await jeu.dire(jeu.tx('pierreVide')); return; }
        if (!jeu.aDansSac('manju')) {
          await jeu.dire(jeu.tx('pierre'));
          await jeu.dire(jeu.tx('pierreCompagnon')[jeu.compagnon], 'compagnon');
          return;
        }
        jeu.geste('offrir');
        await jeu.attendre(800);
        manjuPose.visible = true;
        jeu.prendre('manju');
        await jeu.attendre(500);
        jeu.geste(null);
        await jeu.dire(jeu.tx('pierrePose'));
        // la caméra de côté (le voyageur ne cache pas la pierre), le ciel au-dessus : ils arrivent
        jeu.cadrerDeCote(PIERRE.x, yPierre, PIERRE.z, { distance: 4.6, haut: 1.1, champ: 62 });
        corbeaux.venir();
        await jeu.attendre(900);
        // (on les entend d'abord ; on dit qu'ils se posent quand ils se sont posés ; la caméra reste de côté le temps
        // qu'ils repartent, sinon ils passent à travers elle)
        const [cri, poses] = jeu.tx('corbeauxArrivent');
        await jeu.dire([cri]);
        for (let k = 0; k < 50 && corbeaux.mode() === 'arrivee'; k++) await jeu.attendre(200);
        await jeu.dire([poses]);
        for (let k = 0; k < 60 && corbeaux.mode() !== 'guide'; k++) await jeu.attendre(200);
        await jeu.attendre(1600);
        jeu.cadrer(null);
        await jeu.dire(jeu.tx('corbeauxCompagnon')[jeu.compagnon], 'compagnon');
      },
    },
    { id: 'bosquet', x: xPorte + 1.3, z: zPorte, rayon: 2.4, verbe: 'regarder', si: () => !ouvert, action: (jeu) => jeu.dire(jeu.tx('bosquet')) },
    {
      id: 'koban', x: SANBO.x, z: SANBO.z, rayon: 1.5, haut: 0.95, verbe: 'prendre', si: (jeu) => ouvert && !jeu.secretTrouve('corbeaux'),
      async action(jeu) {
        await jeu.dire(jeu.tx('sanctuaireCache'));
        jeu.geste('offrir');
        await jeu.attendre(700);
        koban.visible = false;
        await jeu.attendre(300);
        jeu.geste(null);
        await jeu.trouverSecret('corbeaux');
      },
    },
    { id: 'hokora', x: HOKORA.x + 0.5, z: HOKORA.z, rayon: 1.6, haut: 1.5, verbe: 'prier', si: (jeu) => ouvert && jeu.secretTrouve('corbeaux'), action: async (jeu) => { jeu.saluer(); await jeu.dire(jeu.tx('hokora')); } },
  ];
  // les daims : on peut les caresser (le premier donne le tampon)
  const actionDaim = async (jeu) => {
    if (jeu.aTampon('daim')) { await jeu.dire(jeu.txn('daim2')); return; }
    await jeu.dire(jeu.txn('daim'));
    await jeu.tampon('daim');
  };

  return {
    ...infos, textes: TEXTES,
    objets, monde, terrain, etiquettes, passants, daims, interactions, actionDaim, bancs, lumieres, animes,
    herbes: HERBES,
    // (le secret, tresors.js ; le marchand ; les sons à fabriquer en plus ; les feux d'artifice, sur la mer derrière le torii)
    secret: 'corbeaux', marchand: MARCHAND, sons: ['oiseau/corbeau'],
    feux: { x: 0, y: 0, z: -108, large: 70, haut: [30, 52] },
    aspectSol: (x, z, h) => aspectSol(P, x, z, h),
    rive: -9, // les lignes d'eau suivent la rive de la plage (z)
    etendue: { x0: -320, x1: 320, z0: -320, z1: 140, pas: 4, fin: { x0: -70, x1: 75, z0: -100, z1: 60, pas: 1 } },
    eau: { x0: -600, x1: 600, z0: -1400, z1: 30 },
    // la brise de mer, qui pousse vers la terre (le sud) ; le milan noir tourne au-dessus de la baie, la
    // bouscarle chante dans les arbres de la colline
    vent: { dir: [0.3, 0.95], force: 0.85 }, oiseaux: ['milan', 'uguisu', 'mouette'], ambiances: ['vagues', 'no', 'insectes'],
    // les musiciens de la scène de nō : on les entend de la plate-forme (pleinement à moins de 9 m, plus du tout à 32 m)
    musiciens: { x: NO.x, z: NO.z, pres: 9, loin: 32 },
    // les goélands (mouettes.js) : trois qui tournent au-dessus de la baie ; d'autres posés sur l'estran près de
    // l'arrivée, sur l'eau, et en haut du grand torii, qui s'envolent quand on approche
    mouettes: {
      vols: [{ x: 8, z: -34, r: 15, h: 13, sens: 1 }, { x: 34, z: -24, r: 10, h: 9, sens: -1 }, { x: -22, z: -52, r: 19, h: 17, sens: 1 }],
      poses: [
        { x: 34.6, z: -8.7, cap: 2.6, mer: [0, -1] },
        { x: 36.9, z: -9.5, cap: -2.9, mer: [0, -1] },
        { x: 41.2, z: -8.4, cap: 0.9, mer: [-0.3, -1] },
        { x: 14, z: -24, cap: 1.4, mer: [0.2, -1] },
        { x: -14, z: -40, cap: -0.6, mer: [0, -1] },
        { x: -3.6, z: -70, y: TORII_HAUT, cap: PI / 2, mer: [0, -1], fuite: 7 },
      ],
    },
    soleil: [-0.42, 0.72, 0.55], // d'où vient la lumière (l'après-midi, du sud-ouest)
    // (2026-10-24) les rais de soleil entre les pins, autour du marchand (balade.js, creerRais)
    rais: [[27, 23.5], [29.5, 26.8], [24.8, 26]].map(([x, z], i) => ({ x, z, haut: 9, r0: 0.3, r1: 1.0 + 0.25 * i, force: 0.08 })),
    depart: { x: 28, z: -2.5, cap: Math.atan2(TORII.x - 28, TORII.z + 2.5) },
    // les images fixes des captures : de dos vers le torii, ou de face, le torii derrière
    photos: {
      heros: { x: 27.4, z: -2.6, cap: Math.atan2(TORII.x - 27.4, TORII.z + 2.6), lacet: Math.atan2(TORII.x - 27.4, TORII.z + 2.6) + PI + 0.1, tangage: 0.13, distance: 5.6 },
      perso: { x: 26.6, z: -2.4, cap: Math.atan2(TORII.x - 26.6, TORII.z + 2.4) + PI, lacet: Math.atan2(TORII.x - 26.6, TORII.z + 2.4) + PI + 0.05, tangage: 0.1, distance: 3.9 },
    },
  };
}

/** Le fond de cyprès des peintures du nō : des planches verticales et leurs veines. */
function cypres(c, W, H) {
  c.fillStyle = '#e3c897'; c.fillRect(0, 0, W, H);
  const n = Math.max(2, Math.round(W / 115));
  c.lineWidth = Math.max(1, W * 0.0015);
  for (let k = 0; k < n; k++) {
    const x0 = (k / n) * W;
    c.strokeStyle = 'rgba(120, 85, 45, 0.35)'; c.beginPath(); c.moveTo(x0, 0); c.lineTo(x0, H); c.stroke();
    c.strokeStyle = 'rgba(150, 110, 60, 0.16)';
    for (let i = 0; i < 6; i++) {
      const x = x0 + (W / n) * (0.15 + i * 0.14);
      c.beginPath(); c.moveTo(x, 0); c.bezierCurveTo(x + W * 0.006, H * 0.3, x - W * 0.006, H * 0.6, x + W * 0.004, H); c.stroke();
    }
  }
}
/**
 * Le grand pin peint au fond de la scène de nō (kagami-ita) : un vieux pin noueux, son tronc tordu, ses longues
 * branches basses, ses touffes d'aiguilles en nuages plats (sombres dessous, plus claires dessus).
 */
function pinPeint(c, W, H) {
  cypres(c, W, H);
  const u = (v) => v * W, w = (v) => v * H;
  c.fillStyle = '#5e4330';
  c.beginPath();
  c.moveTo(u(0.4), w(1.0));
  c.bezierCurveTo(u(0.36), w(0.78), u(0.47), w(0.66), u(0.44), w(0.52));
  c.bezierCurveTo(u(0.42), w(0.4), u(0.5), w(0.3), u(0.52), w(0.2));
  c.lineTo(u(0.555), w(0.21));
  c.bezierCurveTo(u(0.54), w(0.33), u(0.47), w(0.42), u(0.5), w(0.54));
  c.bezierCurveTo(u(0.53), w(0.68), u(0.43), w(0.78), u(0.5), w(1.0));
  c.closePath(); c.fill();
  c.strokeStyle = '#5e4330'; c.lineCap = 'round';
  const branche = (pts, ep) => {
    c.lineWidth = ep * W;
    c.beginPath(); c.moveTo(u(pts[0]), w(pts[1]));
    for (let i = 2; i < pts.length; i += 4) c.quadraticCurveTo(u(pts[i]), w(pts[i + 1]), u(pts[i + 2]), w(pts[i + 3]));
    c.stroke();
  };
  branche([0.46, 0.55, 0.36, 0.5, 0.22, 0.52], 0.018);
  branche([0.47, 0.42, 0.62, 0.36, 0.76, 0.38], 0.016);
  branche([0.5, 0.3, 0.38, 0.27, 0.3, 0.3], 0.013);
  branche([0.48, 0.62, 0.62, 0.6, 0.84, 0.55], 0.015);
  branche([0.52, 0.22, 0.58, 0.16, 0.64, 0.15], 0.01);
  // l'écorce en écailles
  c.strokeStyle = 'rgba(40, 25, 15, 0.5)'; c.lineWidth = W * 0.003;
  for (let i = 0; i < 26; i++) { const y = 0.22 + i * 0.03, x = 0.46 + Math.sin(y * 9) * 0.025; c.beginPath(); c.arc(u(x), w(y), W * 0.011, 0.2, 2.6); c.stroke(); }
  const touffe = (cx, cy, rx, ry) => {
    for (const [dy, coul] of [[0.25, '#244a30'], [0, '#2f5e3a'], [-0.3, '#4a7f45']]) {
      c.fillStyle = coul;
      for (let k = -3; k <= 3; k++) { c.beginPath(); c.ellipse(u(cx + (k / 3) * rx * 0.8), w(cy + dy * ry * 0.6 + Math.abs(k) * ry * 0.12), u(rx * 0.32), w(ry * 0.55), 0, 0, 2 * Math.PI); c.fill(); }
    }
    c.strokeStyle = '#1d3a26'; c.lineWidth = Math.max(1, W * 0.0018);
    for (let k = 0; k < 70; k++) {
      const a = (k / 70) * Math.PI, x = cx + Math.cos(a) * rx * (0.3 + ((k * 37) % 10) / 14), y = cy - Math.sin(a) * ry * 0.7 + ry * 0.3;
      c.beginPath(); c.moveTo(u(x), w(y)); c.lineTo(u(x + Math.cos(a) * 0.012), w(y - Math.sin(a) * 0.03)); c.stroke();
    }
  };
  for (const [cx, cy, rx, ry] of [[0.56, 0.15, 0.13, 0.09], [0.32, 0.27, 0.12, 0.08], [0.72, 0.33, 0.13, 0.08], [0.2, 0.48, 0.11, 0.07], [0.86, 0.5, 0.1, 0.07], [0.4, 0.46, 0.09, 0.06], [0.64, 0.56, 0.09, 0.06]]) touffe(cx, cy, rx, ry);
}
/** Les bambous peints sur le mur de côté de la scène de nō. */
function bambous(c, W, H) {
  cypres(c, W, H);
  for (const [x, ep, ton] of [[0.25, 0.09, '#5f8f45'], [0.55, 0.11, '#4f8040'], [0.8, 0.08, '#6a9a4f']]) {
    c.fillStyle = ton; c.fillRect((x - ep / 2) * W, 0, ep * W, H);
    c.fillStyle = 'rgba(255, 255, 255, 0.18)'; c.fillRect((x - ep / 2 + ep * 0.15) * W, 0, ep * 0.18 * W, H);
    c.fillStyle = '#3d6a30';
    for (let y = 0.08 + x * 0.1; y < 1; y += 0.17) c.fillRect((x - ep / 2 - 0.01) * W, y * H, (ep + 0.02) * W, H * 0.012);
  }
  c.fillStyle = '#3f6f35';
  const feuille = (x, y, a, l) => {
    c.save(); c.translate(x * W, y * H); c.rotate(a);
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(l * W * 0.5, -l * W * 0.12, l * W, 0); c.quadraticCurveTo(l * W * 0.5, l * W * 0.12, 0, 0); c.fill();
    c.restore();
  };
  for (const [x, y, sg] of [[0.3, 0.2, 1], [0.6, 0.12, -1], [0.85, 0.35, -1], [0.2, 0.5, 1], [0.6, 0.58, 1], [0.3, 0.78, -1]]) {
    for (let k = 0; k < 4; k++) feuille(x, y + k * 0.02, sg * (0.3 + k * 0.35) + (sg < 0 ? Math.PI : 0), 0.28);
  }
}

/** La couleur et la matière (textures.js) du sol naturel : estran, sable, herbe, la rue pavée jusqu'au pied de l'escalier. */
function aspectSol(P, x, z, h) {
  // la rue s'arrête au pied de l'escalier (avec le pas devant la première marche) ; la colline est toute en herbe
  // (2026-10-24 : la rue montait sur son flanc à côté de l'escalier, et un parvis dallé entourait la pagode)
  if (z > -1 && z < ESCALIER.z0 + 0.2 && ((x > 45.5 && x < 56.5) || (Math.abs(x - ESCALIER.x) < 2.3 && z > ESCALIER.z0 - 1.3))) return [P.chemin, M.dalles];
  // (le bosquet de bambous : de la mousse, et le petit chemin de dalles jusqu'au sanctuaire caché)
  const db = Math.hypot(x - BOSQUET.x, z - BOSQUET.z);
  if (db < BOSQUET.r + 0.8) return Math.abs(z - BOSQUET.z) < 0.45 && x > HOKORA.x + 0.6 && x < BOSQUET.x + BOSQUET.r - 0.3 ? [P.pierre, M.dalles] : [bruitDoux(x, z, 1.5) > 0.5 ? P.herbeFonce : '#5f8f45', M.herbe];
  if (h < 0.22) return [P.sableMouille, M.estran];
  if (h < 1.05) return [P.sable, M.sable];
  const n = bruitDoux(x, z, 6) * 0.5 + 0.5 * Math.sin(x * 0.11) * Math.sin(z * 0.13);
  // (sur la colline, de l'herbe seulement : des taches de sable y faisaient des chemins qui ne mènent nulle part)
  if (Math.hypot(x - COLLINE.x, z - COLLINE.z) < 18) return n > 0.18 ? [P.herbe, M.herbe] : [P.herbeFonce, M.herbe];
  return n > 0.25 ? [P.herbe, M.herbe] : n > 0.1 ? [P.herbeFonce, M.herbe] : [P.sable, M.sable];
}

// ---------------------------------------------------------------- Les textes du lieu
const TEXTES = {
  fr: {
    noms: { pretre: 'Le prêtre', miko: 'La miko', videaste: '@random_japan_place', enfant: 'L’écolière', marchande: 'La marchande', touriste: 'La touriste', grandpere: 'Le grand-père', batelier: 'Le batelier' },
    tampons: {
      torii: ['Le grand torii', 'Au bout de l’estran, dans la mer'],
      sanctuaire: ['Le sanctuaire', 'Prie devant le pavillon'],
      pagode: ['La pagode', 'Sur la colline'],
      daim: ['Les daims', 'Fais-toi un ami à quatre pattes'],
      momiji: ['Momiji manjū', 'Une spécialité, en ville'],
    },
    'panneau-bienvenue': ['« Itsukushima-jinja 厳島神社 »', 'Un sanctuaire shintō bâti sur la mer au XIIᵉ siècle par Taira no Kiyomori.', 'Patrimoine mondial de l’UNESCO depuis 1996. À marée haute, il semble flotter !'],
    'panneau-torii': ['« Le grand torii 大鳥居 »', '16,6 m de haut. Ses piliers sont des troncs entiers de camphrier.', 'Il n’est pas planté dans le sol : il tient debout grâce à son propre poids !', 'À marée basse, on peut marcher jusqu’à lui.'],
    'panneau-daims': ['ATTENTION AUX DAIMS !', 'Ils mangent le papier : plans, billets… et carnets de tampons !', 'Il est interdit de les nourrir.'],
    'panneau-entree': ['« Entrée du sanctuaire »', 'Les galeries vermillon relient les pavillons au-dessus de la mer : 275 m en tout.', 'Va jusqu’au bout de la grande plate-forme : le torii est juste en face.'],
    'panneau-no': ['« La scène de nō 能舞台 »', 'La seule scène de nō du Japon bâtie sur la mer.', 'Chaque printemps, on y joue encore du nō pour les dieux.', 'Aujourd’hui, on y joue « Hagoromo » : regarde depuis la grande plate-forme !'],
    'panneau-pagode': ['« La pagode à cinq étages 五重塔 »', 'Bâtie en 1407, haute de 27,6 m.', 'Elle mêle l’architecture japonaise et celle de la Chine.'],
    pretre: ['Bienvenue au sanctuaire d’Itsukushima.', 'Ici, on prie ainsi : deux saluts, deux claps, puis encore un salut.', 'La boîte à offrandes est juste là, devant le pavillon.'],
    pretre2: ['Les divinités d’ici sont trois princesses de la mer.', 'Elles protègent les marins… et les voyageurs comme toi !', 'On raconte aussi que deux corbeaux ont guidé les dieux jusqu’à l’île. Ce sont les « corbeaux des dieux ».', 'Autrefois, on leur laissait une douceur sur une pierre plate, derrière la pagode… Mais plus personne ne sait où elle est.'],
    offrande: ['Tu lances une pièce de 5 yens dans la boîte.', '(5 yens se dit « go-en », comme « un lien heureux ».)', 'Deux saluts… deux claps… un salut.'],
    offrande2: ['Tu pries encore un peu. Tu te sens en paix.'],
    miko: ['Bonjour ! Tu veux tirer un omikuji ?', 'Ce petit papier te dit ta chance !'],
    mikoNon: ['Pas de souci, reviens quand tu veux !'],
    omikuji: [
      ['大吉 Grande chance !', 'Tout ce que tu entreprends réussira. Même trouver tous les tampons !'],
      ['吉 Chance !', 'Une belle rencontre t’attend au bout de la galerie.'],
      ['中吉 Chance moyenne.', 'Un daim te suivra partout aujourd’hui. Surveille ton carnet !'],
      ['小吉 Petite chance.', 'Ce que tu cherches est plus haut que tu ne crois. Regarde la colline !'],
      ['末吉 Chance à venir.', 'Patience : la marée finit toujours par remonter.'],
      ['凶 Malchance…', 'Pas de panique ! Noue ce papier au fil, et ta malchance restera ici.'],
    ],
    videaste: ['Salut ! Je filme les plus beaux lieux du Japon pour TikTok.', 'Mon compte, c’est @random_japan_place.', 'J’ai fait une vidéo d’Itsukushima. Tu veux la voir ?'],
    videasteNon: ['D’accord ! Elle est aussi sur la carte, avec tous les autres lieux.'],
    videasteApres: ['Ça t’a plu ? Abonne-toi pour voir les prochains lieux !'],
    enfant: ['Un daim a mangé mon plan de l’île !', 'Maintenant, je ne sais plus où est la pagode…', 'Elle est sur la colline, derrière les boutiques, je crois ?'],
    marchande: ['Momiji manjū toutes chaudes ! En forme de feuille d’érable !', 'C’est la spécialité de Miyajima. Tu en veux une ?'],
    marchandeOui: ['Tu croques dedans… C’est fourré à la pâte de haricot rouge. Délicieux !'],
    marchandeNon: ['Dommage ! Elles sont meilleures toutes chaudes.'],
    marchande2: ['Reviens quand tu veux, il y en a aussi à la crème !'],
    marchandeEncore: ['Encore une, pour la route ? Je te l’emballe dans un petit papier !'],
    marchandeEmporte: ['Elle te glisse une momiji manjū dans un petit papier, pour plus tard.', '(Tu la ranges dans ton sac.)'],
    touriste: ['À marée haute, le torii a les pieds dans l’eau.', 'Mais aujourd’hui, c’est marée basse : on peut aller le toucher !'],
    grandpere: ['Je viens ici depuis soixante-dix ans.', 'Autrefois, toute l’île était sacrée : on n’y posait pas le pied.', 'Les gens venaient prier en barque, en passant sous le grand torii !', 'Et les corbeaux… ne les chasse jamais. Ici, ce sont les messagers des dieux. Ils adorent les douceurs.'],
    toriiPilier: ['Tu poses la main sur le pilier de camphrier.', 'Il est énorme : presque 10 m de tour !'],
    torii2: ['Le bois est tiède, chauffé par le soleil.'],
    standTampon: ['Un tampon pour les visiteurs, et son encre rouge.', 'Tu le presses dans ton carnet…'],
    daim: ['Le daim te regarde avec ses grands yeux noirs.', 'Il renifle ton carnet… et le lèche un peu.', 'Tu t’es fait un ami : un daim de Miyajima !'],
    daim2: ['Le daim mâchouille tranquillement.'],
    noScene: ['Sur la scène, on joue « Hagoromo », la robe de plumes : un ange danse pour retrouver le ciel.', 'L’actrice porte un masque blanc de jeune femme ; elle avance en glissant, très lentement.', 'Au fond, une flûte et trois tambours ; sur le côté, le chœur chante l’histoire.'],
    ema: ['Des plaques de bois en forme de petite maison : des ema.', 'On y écrit son vœu, et on l’accroche ici pour les dieux.', '« Réussir mes examens », « Revenir à Miyajima »… Il y en a dans toutes les langues !'],
    musubi: ['Des centaines de papiers blancs noués sur des fils.', 'Quand l’omikuji annonce une malchance, on le noue ici : elle reste au sanctuaire.'],
    tonneaux: ['Des tonneaux de saké, offerts aux dieux par les brasseries de la région.', 'Ils sont vides : ce sont des décorations, les « kazaridaru ».'],
    omikujiNoue: ['Tu plies le papier et tu vas le nouer au fil, au bord de la plate-forme.', 'Voilà : ta malchance restera au sanctuaire !'],
    batelier: ['Bonjour ! Je suis batelier : je promène les visiteurs en barque, comme les pèlerins d’autrefois.', 'Le soir, le grand torii et le sanctuaire s’illuminent. On attend la nuit ?'],
    batelierNon: ['D’accord ! Je serai là ce soir, avec ma lanterne.'],
    batelierNuit: ['Regarde : le grand torii s’illumine, et le sanctuaire aussi…', 'Les lanternes de la plage et des galeries s’allument une à une.'],
    batelierApres: ['Profite de la balade de nuit !', 'Quand tu voudras revoir le jour, reviens me voir.'],
    batelierMatin: ['Belle nuit, hein ? Les daims dorment déjà.', 'On attend le lever du soleil ?'],
    batelierJour: ['Et voilà le soleil sur la baie ! Bonne balade !'],
    batelierReste: ['D’accord ! Les lumières du torii restent allumées jusqu’à tard.'],
    // la nuit (le batelier l'a fait tomber) : ce qui change
    pretreNuit: ['Le soir, les portes du sanctuaire se ferment.', 'Mais regarde le grand torii illuminé : c’est le plus beau moment de la journée.'],
    mikoNuit: ['Le comptoir des omikuji est fermé la nuit.', 'Reviens demain : je te tirerai ta chance !'],
    enfantNuit: ['Il fait nuit ! Maman m’attend pour le dîner.', 'Tu as vu ? Les daims dorment déjà sur la plage.'],
    marchandeNuit: ['Désolée, la boutique est fermée pour aujourd’hui !', 'Reviens demain matin : les momiji manjū seront toutes chaudes.'],
    touristeNuit: ['Le torii illuminé… C’est magique !', 'J’ai déjà pris cent photos, et je n’arrive pas à m’arrêter.'],
    grandpereNuit: ['Le soir, je viens toujours m’asseoir ici, face au torii illuminé.', 'Soixante-dix ans… et je ne m’en lasse pas.'],
    daimNuit: ['Le daim somnole, couché sur le sable.', 'Tu le caresses tout doucement… Il pose sa tête contre ta main.', 'Tu t’es fait un ami : un daim de Miyajima !'],
    daim2Nuit: ['Chut… Le daim dort.'],
    torii2Nuit: ['Le bois a gardé un peu de la chaleur du soleil.'],
    // le secret : les corbeaux sacrés
    pierre: ['Une pierre plate, bien lisse, cachée derrière la pagode.', 'Il y a des miettes dessus… On dirait qu’on y laisse des offrandes.'],
    pierreCompagnon: {
      kon: ['« Une pierre aux offrandes… Les messagers des dieux aiment qu’on pense à eux. Une douceur, peut-être ? »'],
      pon: ['« Des miettes de gâteau ! Pon… On devrait y poser une momiji manjū. (Mais pas la mienne.) »'],
      chapu: ['« Ça sent le gâteau ! Quelqu’un mange ici… mais qui ? »'],
      gao: ['« Gao ! Une pierre pour les offrandes, comme celles des gardiens de mon île. Il faudrait y poser quelque chose de bon ! »'],
      fuwa: ['« Fuwa… Je sens la magie ici. Les gardiens du ciel viennent peut-être chercher une douceur ? »'],
      saya: ['« Les arbres d’ici se souviennent… On posait des gâteaux sur cette pierre, pour les oiseaux noirs. »'],
    },
    pierrePose: ['Tu poses la momiji manjū sur la pierre plate…'],
    corbeauxArrivent: ['Croâ ! Croâ !', 'Deux grands corbeaux descendent du ciel et se posent sur la pierre !'],
    corbeauxCompagnon: {
      kon: ['« Les corbeaux des dieux ! Ils emportent l’offrande… Suivons-les ! »'],
      pon: ['« Hé ! Ma… euh, ta manjū ! Ils l’emportent ! Vite, suivons-les ! »'],
      chapu: ['« Ils s’envolent ! Hop hop, on les suit ! »'],
      gao: ['« Gao ! Ils veulent nous montrer quelque chose. Suivons-les ! »'],
      fuwa: ['« Ils volent presque aussi bien que moi ! On les suit ? »'],
      saya: ['« Ils nous appellent… Suivons-les, de branche en branche. »'],
    },
    pierreVide: ['La pierre est vide : les corbeaux ont emporté la douceur.', 'Où sont-ils allés ?'],
    pierreApres: ['La pierre aux offrandes des corbeaux des dieux.', 'Tu te souviens du chemin qu’ils t’ont montré.'],
    bosquet: ['Un bosquet de bambous si serré qu’on ne peut pas passer.', 'De l’autre côté… on dirait qu’un rayon de lumière tombe entre les tiges.'],
    bambousOuverts: ['Les bambous s’écartent doucement, comme deux portes…', 'Derrière, une clairière : un petit sanctuaire oublié, couvert de mousse !'],
    bambousCompagnon: {
      kon: ['« Un sanctuaire caché… Les corbeaux nous l’ont confié. Allons-y avec respect. »'],
      pon: ['« Pon ! Un trésor caché, j’en suis sûr ! »'],
      chapu: ['« Waouh ! Un passage secret ! Chapu chapu ! »'],
      gao: ['« Gao… Un lieu gardé. Je vais veiller sur toi. »'],
      fuwa: ['« Fuwaaa… On dirait un rêve ! »'],
      saya: ['« Les bambous nous laissent passer… Ils te font confiance. »'],
    },
    sanctuaireCache: ['Sur le plateau d’offrandes, quelque chose brille…', 'Une vieille pièce d’or, ovale : un koban !', 'Les corbeaux se posent sur le petit torii et te regardent. On dirait qu’ils te l’offrent.'],
    hokora: ['Un petit sanctuaire oublié, gardé par deux corbeaux de pierre.', 'Tu joins les mains. Les vrais corbeaux, sur le torii, inclinent la tête.'],
  },
  en: {
    noms: { pretre: 'Priest', miko: 'Shrine maiden', videaste: '@random_japan_place', enfant: 'Schoolgirl', marchande: 'Shopkeeper', touriste: 'Tourist', grandpere: 'Old man', batelier: 'Boatman' },
    tampons: {
      torii: ['The Great Torii', 'Out on the tidal flat, in the sea'],
      sanctuaire: ['The shrine', 'Pray in front of the hall'],
      pagode: ['The pagoda', 'On the hill'],
      daim: ['The deer', 'Make a four-legged friend'],
      momiji: ['Momiji manjū', 'A local treat, in town'],
    },
    'panneau-bienvenue': ['“Itsukushima-jinja 厳島神社”', 'A Shinto shrine built over the sea in the 12th century by Taira no Kiyomori.', 'UNESCO World Heritage since 1996. At high tide, it seems to float!'],
    'panneau-torii': ['“The Great Torii 大鳥居”', '16.6 m tall. Its pillars are whole camphor trunks.', 'It is not buried in the ground: it stands up by its own weight!', 'At low tide, you can walk all the way to it.'],
    'panneau-daims': ['BEWARE OF THE DEER!', 'They eat paper: maps, tickets… and stamp books!', 'Feeding them is not allowed.'],
    'panneau-entree': ['“Shrine entrance”', 'The vermilion corridors link the halls above the sea: 275 m in all.', 'Walk to the end of the big platform: the torii stands right in front.'],
    'panneau-no': ['“The Noh stage 能舞台”', 'The only Noh stage in Japan built over the sea.', 'Every spring, Noh is still performed here for the gods.', 'Today they are playing “Hagoromo”: watch from the big platform!'],
    'panneau-pagode': ['“The five-storey pagoda 五重塔”', 'Built in 1407, it is 27.6 m tall.', 'It blends Japanese and Chinese architecture.'],
    pretre: ['Welcome to Itsukushima Shrine.', 'Here we pray like this: bow twice, clap twice, then bow once more.', 'The offering box is right there, in front of the hall.'],
    pretre2: ['The deities here are three princesses of the sea.', 'They protect sailors… and travellers like you!', 'They also say two crows guided the gods to the island. They are the “crows of the gods”.', 'Long ago, people left them a treat on a flat stone, behind the pagoda… But nobody remembers where it is anymore.'],
    offrande: ['You toss a 5-yen coin into the box.', '(5 yen is “go-en”, which also sounds like “a happy bond”.)', 'Two bows… two claps… one bow.'],
    offrande2: ['You pray a little more. You feel at peace.'],
    miko: ['Hello! Would you like to draw an omikuji?', 'This little paper tells your fortune!'],
    mikoNon: ['No problem, come back anytime!'],
    omikuji: [
      ['大吉 Great blessing!', 'Everything you try will succeed. Even finding every stamp!'],
      ['吉 Blessing!', 'A nice encounter awaits you at the end of the corridor.'],
      ['中吉 Middle blessing.', 'A deer will follow you all day. Watch your stamp book!'],
      ['小吉 Small blessing.', 'What you seek is higher than you think. Look at the hill!'],
      ['末吉 Future blessing.', 'Be patient: the tide always comes back.'],
      ['凶 Bad luck…', 'Don’t worry! Tie this paper to the rack and your bad luck stays here.'],
    ],
    videaste: ['Hi! I film the most beautiful places in Japan for TikTok.', 'My account is @random_japan_place.', 'I made a video of Itsukushima. Want to watch it?'],
    videasteNon: ['Okay! It’s also on the map, with all the other places.'],
    videasteApres: ['Did you like it? Follow me to see the next places!'],
    enfant: ['A deer ate my map of the island!', 'Now I don’t know where the pagoda is…', 'It’s on the hill behind the shops, I think?'],
    marchande: ['Hot momiji manjū! Shaped like maple leaves!', 'It’s the speciality of Miyajima. Would you like one?'],
    marchandeOui: ['You take a bite… It’s filled with sweet red bean paste. Delicious!'],
    marchandeNon: ['Too bad! They’re best when they’re hot.'],
    marchande2: ['Come back anytime, we also have custard ones!'],
    marchandeEncore: ['Another one for the road? I’ll wrap it in a little paper!'],
    marchandeEmporte: ['She slips a momiji manjū into a little paper for you, for later.', '(You put it in your bag.)'],
    touriste: ['At high tide, the torii has its feet in the water.', 'But today it’s low tide: we can walk out and touch it!'],
    grandpere: ['I’ve been coming here for seventy years.', 'Long ago, the whole island was sacred: no one set foot on it.', 'People came to pray by boat, sailing under the Great Torii!', 'And the crows… never chase them away. Here, they are messengers of the gods. They love sweets.'],
    toriiPilier: ['You put your hand on the camphor pillar.', 'It’s huge: almost 10 m around!'],
    torii2: ['The wood is warm from the sun.'],
    standTampon: ['A stamp for visitors, with its red ink pad.', 'You press it into your book…'],
    daim: ['The deer looks at you with its big dark eyes.', 'It sniffs your stamp book… and gives it a little lick.', 'You made a friend: a Miyajima deer!'],
    daim2: ['The deer chews peacefully.'],
    noScene: ['On stage they are performing “Hagoromo”, the feather robe: an angel dances to return to the sky.', 'The actor wears the white mask of a young woman and glides forward, very slowly.', 'At the back, a flute and three drums; at the side, the chorus sings the story.'],
    ema: ['Little house-shaped wooden plaques: ema.', 'You write your wish on one and hang it here for the gods.', '“Pass my exams”, “Come back to Miyajima”… They are written in every language!'],
    musubi: ['Hundreds of white papers tied to strings.', 'When an omikuji brings bad luck, you tie it here: the bad luck stays at the shrine.'],
    tonneaux: ['Barrels of sake, offered to the gods by the local breweries.', 'They are empty: they are decorations, called “kazaridaru”.'],
    omikujiNoue: ['You fold the paper and tie it to the string at the edge of the platform.', 'There: your bad luck will stay at the shrine!'],
    batelier: ['Hello! I’m a boatman: I take visitors out by boat, like the pilgrims of old.', 'In the evening, the great torii and the shrine light up. Shall we wait for nightfall?'],
    batelierNon: ['All right! I’ll be here tonight, with my lantern.'],
    batelierNuit: ['Look: the great torii lights up, and the shrine too…', 'The lanterns on the beach and in the corridors come on one by one.'],
    batelierApres: ['Enjoy your night walk!', 'When you want to see the day again, come back and see me.'],
    batelierMatin: ['Lovely night, isn’t it? The deer are already asleep.', 'Shall we wait for sunrise?'],
    batelierJour: ['And here’s the sun over the bay! Enjoy your walk!'],
    batelierReste: ['All right! The torii stays lit until late.'],
    pretreNuit: ['In the evening, the shrine’s gates are closed.', 'But look at the great torii all lit up: it’s the most beautiful moment of the day.'],
    mikoNuit: ['The omikuji counter is closed at night.', 'Come back tomorrow: I’ll draw your fortune!'],
    enfantNuit: ['It’s dark! Mum is waiting for me for dinner.', 'Did you see? The deer are already asleep on the beach.'],
    marchandeNuit: ['Sorry, the shop is closed for today!', 'Come back tomorrow morning: the momiji manjū will be piping hot.'],
    touristeNuit: ['The torii all lit up… It’s magical!', 'I’ve already taken a hundred photos, and I can’t stop.'],
    grandpereNuit: ['In the evening, I always come and sit here, facing the lit-up torii.', 'Seventy years… and I never get tired of it.'],
    daimNuit: ['The deer is dozing, lying on the sand.', 'You stroke it very gently… It rests its head against your hand.', 'You made a friend: a Miyajima deer!'],
    daim2Nuit: ['Shh… The deer is asleep.'],
    torii2Nuit: ['The wood still holds a little of the sun’s warmth.'],
    pierre: ['A flat, smooth stone, hidden behind the pagoda.', 'There are crumbs on it… It looks like people leave offerings here.'],
    pierreCompagnon: {
      kon: ['“An offering stone… The messengers of the gods like to be remembered. A sweet, perhaps?”'],
      pon: ['“Cake crumbs! Pon… We should put a momiji manjū here. (But not mine.)”'],
      chapu: ['“It smells like cake! Somebody eats here… but who?”'],
      gao: ['“Gao! An offering stone, like the guardians’ stones on my island. We should leave something tasty!”'],
      fuwa: ['“Fuwa… I can feel magic here. Maybe the guardians of the sky come for a treat?”'],
      saya: ['“The trees here remember… People put cakes on this stone, for the black birds.”'],
    },
    pierrePose: ['You place the momiji manjū on the flat stone…'],
    corbeauxArrivent: ['Caw! Caw!', 'Two big crows swoop down from the sky and land on the stone!'],
    corbeauxCompagnon: {
      kon: ['“The crows of the gods! They are taking the offering… Let’s follow them!”'],
      pon: ['“Hey! My… er, your manjū! They’re taking it! Quick, follow them!”'],
      chapu: ['“They’re flying away! Hop hop, let’s follow!”'],
      gao: ['“Gao! They want to show us something. Let’s follow them!”'],
      fuwa: ['“They fly almost as well as I do! Shall we follow them?”'],
      saya: ['“They are calling us… Let’s follow them, from branch to branch.”'],
    },
    pierreVide: ['The stone is empty: the crows took the treat.', 'Where did they go?'],
    pierreApres: ['The offering stone of the crows of the gods.', 'You remember the path they showed you.'],
    bosquet: ['A bamboo grove so dense that you can’t get through.', 'On the other side… it looks like a ray of light is falling between the stalks.'],
    bambousOuverts: ['The bamboos slowly part, like two doors…', 'Behind them, a clearing: a small forgotten shrine, covered in moss!'],
    bambousCompagnon: {
      kon: ['“A hidden shrine… The crows have trusted us with it. Let’s go in respectfully.”'],
      pon: ['“Pon! A hidden treasure, I’m sure of it!”'],
      chapu: ['“Wow! A secret passage! Chapu chapu!”'],
      gao: ['“Gao… A guarded place. I’ll watch over you.”'],
      fuwa: ['“Fuwaaa… It’s like a dream!”'],
      saya: ['“The bamboos let us through… They trust you.”'],
    },
    sanctuaireCache: ['Something is shining on the offering tray…', 'An old oval gold coin: a koban!', 'The crows land on the little torii and watch you. It looks like they are giving it to you.'],
    hokora: ['A small forgotten shrine, guarded by two stone crows.', 'You put your hands together. The real crows, on the torii, bow their heads.'],
  },
  ja: {
    noms: { pretre: '神主さん', miko: '巫女さん', videaste: '@random_japan_place', enfant: '小学生', marchande: 'お店の人', touriste: '観光客', grandpere: 'おじいさん', batelier: '船頭さん' },
    tampons: {
      torii: ['大鳥居', '海の中に 立っている'],
      sanctuaire: ['御本社', '社殿の 前で おまいり'],
      pagode: ['五重塔', '丘の 上'],
      daim: ['神鹿', '四本足の ともだち'],
      momiji: ['もみじ饅頭', '町の 名物'],
    },
    'panneau-bienvenue': ['「厳島神社」', '平安時代の 終わりに 平清盛が 海の上に 建てた 神社。', '1996年に 世界遺産に なった。しおが みちると 海に うかんで 見えるよ！'],
    'panneau-torii': ['「大鳥居」', '高さ 16.6メートル。柱は クスノキの 大木で できている。', '地面に うめられていない。自分の 重さだけで 立っているんだ！', 'しおが ひいたら 歩いて 近くまで 行けるよ。'],
    'panneau-daims': ['シカに ちゅうい！', '紙を 食べちゃうよ。地図、きっぷ……スタンプ帳も！', 'えさを あげては いけません。'],
    'panneau-entree': ['「厳島神社 入口」', '朱色の 回廊が 海の上の 社殿を つないでいる。長さは 275メートル！', '平舞台の 先まで 行ってごらん。大鳥居が まっすぐ 見えるよ。'],
    'panneau-no': ['「能舞台」', '海の上に ある 能舞台は 日本で ここだけ。', '春には 今も 神さまに 能を ほうのう している。', '今日は「羽衣」。平舞台から 見てごらん！'],
    'panneau-pagode': ['「五重塔」', '1407年に 建てられた。高さは 27.6メートル。', '和様と 唐様が まざった つくりなんだ。'],
    pretre: ['厳島神社へ ようこそ。', 'おまいりは 二礼 二拍手 一礼です。', 'さいせん箱は すぐ そこ、社殿の 前ですよ。'],
    pretre2: ['ここの 神さまは 海の 三姉妹の 女神さま。', '船乗りや あなたのような 旅人を まもって くださるのです。', '神さまを この島へ みちびいたのは 二羽の カラスだと いわれています。「神鴉（ごがらす）」です。', 'むかしは 五重塔の うしろの 平たい 石に おそなえを したそうですが……いまでは その 場所を しる人は いません。'],
    offrande: ['5円玉を さいせん箱に 入れた。', '「ご縁が ありますように」。', '二礼……二拍手……一礼。'],
    offrande2: ['もう一度 手を あわせた。こころが おだやかに なった。'],
    miko: ['こんにちは！ おみくじを ひいて いきますか？', 'あなたの 運勢が わかりますよ！'],
    mikoNon: ['また いつでも どうぞ！'],
    omikuji: [
      ['大吉！', 'なにを やっても うまくいく。スタンプも ぜんぶ あつまるかも！'],
      ['吉！', '回廊の 先で すてきな 出会いが あるでしょう。'],
      ['中吉。', '今日は シカが ずっと ついてくる。スタンプ帳に 気をつけて！'],
      ['小吉。', 'さがしものは 思ったより 高い ところに。丘を 見てごらん！'],
      ['末吉。', 'あせらないで。しおは かならず みちてくる。'],
      ['凶……', 'だいじょうぶ！ おみくじを むすべば わるい 運は ここに おいていけるよ。'],
    ],
    videaste: ['やあ！ 日本の すてきな 場所を TikTokで しょうかい しているんだ。', 'アカウントは @random_japan_place。', '厳島神社の 動画も あるよ。見てみる？'],
    videasteNon: ['オッケー！ 地図にも ほかの 場所と いっしょに のっているよ。'],
    videasteApres: ['気に入った？ フォローして 次の 場所も 見てね！'],
    enfant: ['シカに 島の 地図を 食べられちゃった！', '五重塔って どこだっけ……', 'おみせの うしろの 丘の 上だったかな？'],
    marchande: ['やきたての もみじまんじゅう！ もみじの 形だよ！', '宮島の 名物。ひとつ どう？'],
    marchandeOui: ['ぱくっ。中は あんこ。おいしい！'],
    marchandeNon: ['ざんねん！ やきたてが いちばん なのに。'],
    marchande2: ['また きてね。カスタードも あるよ！'],
    marchandeEncore: ['もう ひとつ、おみやげに どう？ 紙に つつんで あげる！'],
    marchandeEmporte: ['もみじまんじゅうを 紙に つつんで くれた。あとで 食べよう。', '（カバンに しまった。）'],
    touriste: ['しおが みちると 鳥居の 足は 海の 中。', 'でも 今日は しおが ひいているから、さわりに 行けるよ！'],
    grandpere: ['わしは 70年 ここに かよっておる。', 'むかしは 島 ぜんたいが 神さま そのもので、人は 足を ふみいれなかった。', 'だから 舟で 大鳥居を くぐって おまいりに きたんじゃよ。', 'それに カラスは おいはらっては いかんぞ。ここでは 神さまの おつかいじゃ。あまい ものが 大すきでな。'],
    toriiPilier: ['クスノキの 柱に 手を ふれた。', 'とても 太い。まわりは 10メートル 近くも ある！'],
    torii2: ['柱は お日さまで あたたかい。'],
    standTampon: ['きねんスタンプと 朱肉が おいてある。', 'スタンプ帳に ぎゅっと おした……'],
    daim: ['シカが 大きな 黒い 目で こっちを 見ている。', 'スタンプ帳を くんくん……ぺろり。', '宮島の シカと なかよしに なった！'],
    daim2: ['シカは のんびり もぐもぐ している。'],
    noScene: ['舞台では 能「羽衣」。天女が 天に かえるために まう おはなし。', 'わかい 女の 白い 面を つけて、すり足で ゆっくり すすむ。', 'おくには 笛と 三つの つづみ・たいこ、よこでは 地謡が うたっている。'],
    ema: ['小さな 家の 形の 木の 板、絵馬。', 'ねがいごとを 書いて、神さまの ために ここに かける。', '「しけんに ごうかく」「また 宮島に きたい」……いろんな ことばで 書いて あるよ！'],
    musubi: ['白い 紙が たくさん むすばれている。', '凶の おみくじは ここに むすぶと、わるい 運は 神社に おいていける。'],
    tonneaux: ['地元の 酒蔵が 神さまに ほうのうした 酒だる。', '中は からっぽ。かざりの「かざりだる」だよ。'],
    omikujiNoue: ['おみくじを おって、平舞台の はしの ひもに むすびに いった。', 'これで わるい 運は 神社に おいていける！'],
    batelier: ['こんにちは！ 船頭です。むかしの 参拝客の ように、舟で 案内して いるよ。', '夕方に なると、大鳥居と 社殿が ライトアップ されるんだ。夜まで まってみる？'],
    batelierNon: ['わかった！ 今夜も ちょうちんを ともして まっているよ。'],
    batelierNuit: ['ほら、大鳥居が ライトアップ された。社殿も……', '浜と 回廊の 灯籠も、ひとつ ひとつ ともっていく。'],
    batelierApres: ['夜の さんぽを たのしんでね！', '朝に もどりたく なったら、また はなしかけて。'],
    batelierMatin: ['いい 夜だね。シカたちは もう ねているよ。', '日の出まで まとうか？'],
    batelierJour: ['ほら、湾に お日さまが のぼった！ いい さんぽを！'],
    batelierReste: ['わかった！ 大鳥居の あかりは おそくまで ついているよ。'],
    pretreNuit: ['夜は 社殿の 門を しめています。', 'でも ライトアップ された 大鳥居を ごらんなさい。一日で いちばん うつくしい ときです。'],
    mikoNuit: ['夜は おみくじの うけつけは おしまいです。', 'また あした きてくださいね！'],
    enfantNuit: ['もう 夜だ！ お母さんが ばんごはんで まってる。', '見た？ シカたちは もう 浜で ねてるよ。'],
    marchandeNuit: ['ごめんね、今日は もう 店じまい！', 'あしたの 朝 きて。やきたての もみじまんじゅうが あるよ。'],
    touristeNuit: ['ライトアップの 大鳥居……すてき！', 'もう 百まいも 写真を とったのに、とまらない！'],
    grandpereNuit: ['夜は いつも ここに すわって、ライトアップの 大鳥居を ながめるんじゃ。', '70年……それでも あきることは ない。'],
    daimNuit: ['シカが 砂の 上で うとうと している。', 'そっと なでると……手に 頭を あずけてきた。', '宮島の シカと なかよしに なった！'],
    daim2Nuit: ['しーっ……シカは ねむっている。'],
    torii2Nuit: ['柱には まだ 少し お日さまの ぬくもりが のこっている。'],
    pierre: ['五重塔の うしろに かくれた、つるつるの 平たい 石。', 'おかしの くずが のっている……だれかが おそなえを しているみたい。'],
    pierreCompagnon: {
      kon: ['「おそなえの 石……神さまの おつかいは わすれられたくないんだ。あまい ものかな？」'],
      pon: ['「おかしの くず！ ポン……もみじまんじゅうを おいて みようよ。（おいらのは ダメだよ。）」'],
      chapu: ['「おかしの においが する！ ここで だれかが 食べてる……でも だれ？」'],
      gao: ['「ガオ！ ぼくの 島の 守り神の 石みたいな おそなえの 石だ。おいしい ものを おこう！」'],
      fuwa: ['「フワ……ここ、まほうの においが する。空の 守り神が おやつを とりに くるのかな？」'],
      saya: ['「ここの 木は おぼえてる……この 石に、黒い 鳥の ために おかしを おいてたって。」'],
    },
    pierrePose: ['もみじまんじゅうを 平たい 石の 上に おいた……'],
    corbeauxArrivent: ['カァー！ カァー！', '大きな カラスが 二羽、空から おりてきて 石の 上に とまった！'],
    corbeauxCompagnon: {
      kon: ['「神鴉だ！ おそなえを はこんで いく……ついて いこう！」'],
      pon: ['「あっ！ お、おいらの……じゃなくて、きみの まんじゅうが！ はやく おいかけよう！」'],
      chapu: ['「とんで いった！ ぴょん ぴょん、ついて いこう！」'],
      gao: ['「ガオ！ なにかを 見せたいんだ。ついて いこう！」'],
      fuwa: ['「ぼくと おなじくらい じょうずに とぶね！ おいかける？」'],
      saya: ['「よんでる……枝から 枝へ、ついて いこう。」'],
    },
    pierreVide: ['石の 上は からっぽ。カラスが おかしを もって いった。', 'どこへ いったんだろう？'],
    pierreApres: ['神鴉の おそなえの 石。', 'カラスが 見せて くれた 道を おぼえている。'],
    bosquet: ['竹が ぎっしり はえていて、とおれない。', 'むこうがわに……竹の あいだから 光が さしこんで いるみたい。'],
    bambousOuverts: ['竹が 戸のように、そっと ひらいて いく……', 'その おくに 広場が！ こけむした 小さな ほこらが ある！'],
    bambousCompagnon: {
      kon: ['「かくれた ほこら……カラスが ぼくたちに おしえて くれたんだ。しずかに はいろう。」'],
      pon: ['「ポン！ ぜったい おたからだよ！」'],
      chapu: ['「すごーい！ ひみつの 通り道！ チャプ チャプ！」'],
      gao: ['「ガオ……守られた 場所だ。ぼくが きみを 守るよ。」'],
      fuwa: ['「フワァ……ゆめみたい！」'],
      saya: ['「竹が とおして くれる……きみを しんじて いるんだ。」'],
    },
    sanctuaireCache: ['おそなえの 台の 上で、なにかが 光っている……', 'だ円形の 古い 金貨……小判だ！', 'カラスたちが 小さな 鳥居に とまって こっちを 見ている。くれる って いってる みたい。'],
    hokora: ['二羽の 石の カラスが 守る、わすれられた 小さな ほこら。', '手を あわせた。鳥居の 上の カラスたちが 頭を さげた。'],
  },
};
