// ================================================================
//  Les petits esprits des arbres et le grand cerf de la forêt (Yakushima, 2026-11-01 ; le propriétaire : « je pense que ça peut être un
//  secret en rapport avec Princesse Mononoke, parce que c'est cette île qui a inspiré Princesse Mononoke », puis, de mes propositions :
//  « les petits esprits qui mènent au grand cerf »). La forêt a bien inspiré le film (l'office du tourisme du Japon, japan.travel/en/spot/517),
//  mais ces esprits et ce cerf sont nos dessins à nous : les personnages du film appartiennent au Studio Ghibli. Les esprits sont de la
//  famille de Saya, le kodama des compagnons (le bois clair, la mousse, une pousse), ronds, avec de grands yeux et un sourire ; le cerf est
//  un shinroku (神鹿, le cerf blanc messager des dieux), une vraie tête de cerf, le dos couvert de mousse et de fougères, de vieux bois
//  moussus où poussent de petites fleurs. Repère : les pieds à l'origine, on regarde vers +z.
// ================================================================
import { plumeCormoran } from './personnages.js';

const PI = Math.PI;
/** Le pelage du grand cerf : ces couleurs luisent dans la nuit (sortesNuit de yakushima.js : le cerf blanc, mais pas sa mousse). Il n'est là que la nuit : plus sombres que le blanc voulu. */
export const PELAGE_CERF = { base: '#a09e94', fonce: '#83817a', clair: '#adaba1' };

/**
 * Les petits esprits : les formes (une fois pour toutes), puis creer(sorte, s) → { objet, bondir(), animer(dt, temps, vitesse) }. Un seul
 * maillage pour chacun : ils sautillent (ils s'écrasent en touchant le sol, s'allongent en l'air, se dandinent), respirent au repos. La
 * nuit, leur corps brille doucement (sorte lumiere). Sortes (ce qu'ils ont sur la tête) : mousse, gland, pousse, champi, fougere, cedre.
 */
export function formesEsprits(ctx) {
  const { THREE, atelier, maillage } = ctx;
  const BOIS = '#c9bfa4', BOIS_F = '#c2b290', JOUE = '#efb49c', OEIL = '#2b2018', MOUSSE = '#6a9a40', MOUSSE_C = '#86b24e', FEUILLE = '#7cb648', FEUILLE_F = '#4f8a38', BRUN = '#8a6440', BRUN_C = '#a57c52';
  const R = 0.135, Y = 0.155;
  const forme = (sorte) => {
    const a = atelier();
    // le corps, d'un seul tenant : une poire, plus large en bas
    a.piece(new THREE.SphereGeometry(R, 12, 9), BOIS, {
      y: Y, sorte: 'lumiere', nuance: 0.015,
      deformer: (x, y, z) => { const t = y / R, k = 1 + 0.2 * Math.max(0, -t) - 0.08 * Math.max(0, t); return [x * k, y * 1.12, z * k]; },
    });
    for (const s of [-1, 1]) {
      // les yeux : de grands ronds sombres, deux reflets ; les joues ; le bras, le pied
      a.piece(new THREE.CircleGeometry(0.031, 12), OEIL, { x: s * 0.05, y: Y + 0.045, z: 0.1175, ry: s * 0.41, rx: -0.12, trait: false })
        .piece(new THREE.CircleGeometry(0.0105, 8), '#ffffff', { x: s * 0.05 + 0.009, y: Y + 0.056, z: 0.1205, ry: s * 0.41, rx: -0.12, trait: false })
        .piece(new THREE.CircleGeometry(0.005, 6), '#ffffff', { x: s * 0.05 - 0.008, y: Y + 0.034, z: 0.1205, ry: s * 0.41, rx: -0.12, trait: false })
        .ovale(0.017, JOUE, { x: s * 0.087, y: Y + 0.008, z: 0.1, sz: 0.3, ry: s * 0.72, trait: false }, 6)
        .ovale(0.03, BOIS_F, { x: s * 0.138, y: Y - 0.022, z: 0.022, sx: 0.8, sy: 1.35, rz: s * 0.55 }, 6)
        .ovale(0.042, BOIS_F, { x: s * 0.062, y: 0.028, z: 0.036, sy: 0.6, sz: 1.3 }, 6);
    }
    // le sourire
    a.piece(new THREE.TorusGeometry(0.015, 0.0034, 3, 8, PI * 0.8), '#6a4630', { y: Y + 0.008, z: 0.1235, rz: PI * 1.1, trait: false });
    // ce qu'il a sur la tête
    const bosses = (x, y, z) => { const t = Math.atan2(z, x), b = 1 + 0.05 * Math.sin(t * 7 + y * 40) * (1 - y / 0.14); return [x * b, y, z * b]; };
    const crane = Y + R * 1.12;
    if (sorte === 'mousse') {
      a.piece(new THREE.SphereGeometry(0.133, 12, 4, 0, 2 * PI, 0, PI * 0.46), MOUSSE, { y: Y + 0.036, deformer: bosses, teinte: (x, y, z) => (Math.sin(x * 60) * Math.sin(z * 55) > 0.1 ? MOUSSE_C : MOUSSE) })
        .baton([0, crane + 0.01, 0], [0.01, crane + 0.07, 0], 0.006, FEUILLE, 4)
        .ovale(0.024, FEUILLE, { x: 0.012, y: crane + 0.075, sx: 1.5, sy: 0.2, sz: 0.7, rz: 0.4 }, 6);
    } else if (sorte === 'gland') {
      // le chapeau d'un gland : un dôme brun aux rangs d'écailles, sa petite queue
      a.piece(new THREE.SphereGeometry(0.128, 12, 4, 0, 2 * PI, 0, PI * 0.42), BRUN, { y: Y + 0.058, teinte: (x, y) => (Math.floor(y * 42) % 2 ? BRUN : BRUN_C) })
        .baton([0, crane + 0.03, 0], [0.006, crane + 0.082, 0], 0.012, BRUN, 5);
    } else if (sorte === 'champi') {
      // un tout petit chapeau de champignon, comme ceux de la forêt de mousse
      a.piece(new THREE.SphereGeometry(0.15, 12, 4, 0, 2 * PI, 0, PI / 2), '#efe8c8', { y: Y + 0.082, sy: 0.62, teinte: (x, y) => (y > Y + 0.082 + 0.058 ? '#c9a878' : '#efe8c8') })
        .piece(new THREE.CircleGeometry(0.148, 12), '#d8d2ac', { y: Y + 0.082, rx: PI / 2, trait: false });
    } else if (sorte === 'pousse') {
      // une pousse sur le crâne nu : une tige, deux feuilles
      a.baton([0, crane - 0.01, 0], [0.006, crane + 0.078, 0], 0.008, FEUILLE_F, 4);
      for (const s of [-1, 1]) a.ovale(0.042, FEUILLE, { x: 0.006 + s * 0.038, y: crane + 0.092, sx: 1.4, sy: 0.16, sz: 0.68, rz: s * 0.45 }, 6);
    } else if (sorte === 'fougere') {
      // des frondes de fougère en éventail
      for (let k = 0; k < 5; k++) {
        const t = (k - 2) * 0.42;
        a.ovale(0.026, k % 2 ? FEUILLE : FEUILLE_F, { x: Math.sin(t) * 0.055, y: crane + 0.03 + Math.cos(t) * 0.036, z: -0.01, sx: 0.75, sy: 2.5, sz: 0.2, rz: -t }, 6);
      }
    } else if (sorte === 'cedre') {
      // une toute petite pousse de cèdre, en trois étages (comme celle qu'il garde)
      for (const [r, h, y] of [[0.058, 0.07, 0.022], [0.044, 0.062, 0.058], [0.03, 0.054, 0.09]]) a.cone(r, h, 6, y > 0.05 ? FEUILLE : FEUILLE_F, { y: crane + y });
    }
    return a.fin(0, false);
  };
  const G = {};
  return {
    creer(sorte, s = 1) {
      if (!G[sorte]) G[sorte] = forme(sorte);
      const objet = new THREE.Group(), ressort = new THREE.Group();
      ressort.add(maillage(G[sorte]));
      objet.add(ressort);
      let phase = Math.random() * 6, allure = 0, joie = 0;
      const graine = Math.random() * 9;
      return {
        objet,
        /** Un bond de joie. */
        bondir() { joie = 1; },
        animer(dt, temps, vitesse) {
          allure += (Math.min(1, vitesse / 1.1) - allure) * Math.min(1, dt * 8);
          phase += dt * (5.5 + Math.min(vitesse, 7) * 1.5);
          const v = Math.abs(Math.sin(phase)), sol = 1 - v;
          // (il touche le sol : il s'écrase ; en l'air : il s'allonge. Au repos : il respire, et penche la tête de temps en temps)
          const ecrase = allure * (sol * sol * 0.2 - v * 0.05), souffle = (1 - allure) * 0.02 * Math.sin(temps * 2.1 + graine);
          let y = v * allure * (0.07 + 0.05 * Math.min(1, vitesse / 3)), et = 0;
          if (joie > 0) {
            joie = Math.max(0, joie - dt / 0.55);
            const u = 1 - joie;
            y += 4 * u * (1 - u) * 0.3;
            et = 0.14 * Math.sin(u * PI) - 0.1 * Math.max(0, 1 - u * 6) - 0.14 * Math.max(0, u * 6 - 5);
          }
          ressort.position.y = y;
          ressort.scale.set(s * (1 + ecrase * 0.6 - souffle * 0.5 - et * 0.5), s * (1 - ecrase + souffle + et), s * (1 + ecrase * 0.6 - souffle * 0.5 - et * 0.5));
          ressort.rotation.z = allure * 0.11 * Math.sin(phase * 0.5) + (1 - allure) * 0.09 * Math.sin(temps * 0.7 + graine) ** 3;
          ressort.rotation.x = allure * 0.12;
        },
      };
    },
  };
}

/**
 * Le grand cerf : le corps, le cou et la tête sur leurs pivots, quatre pattes en deux morceaux. Il marche d'un pas lent à quatre temps
 * (animer(dt, temps, vitesse) : les pattes, le corps qui se balance, le cou qui répond avec un peu de retard ; renvoie les pieds qui viennent
 * de se poser, [[x, z]…], dans le monde), tourne la tête (regard(lacet, tangage)), s'incline (incliner(0 à 1)). Une dizaine de milliers de
 * triangles : il n'existe qu'une fois qu'on est de l'autre côté du cèdre.
 */
export function creerGrandCerf(ctx, S = 0.92) {
  const { THREE, atelier, maillage } = ctx;
  const PELAGE = PELAGE_CERF.base, PELAGE_F = PELAGE_CERF.fonce, PELAGE_C = PELAGE_CERF.clair, MOUSSE = '#5f8f42', MOUSSE_C = '#7fae4e', MOUSSE_F = '#47703a', LICHEN = '#a9c884', BOIS = '#9a896e', SABOT = '#3a332c', FLEUR = '#fbf8ec', COEUR_F = '#efc84a', ECORCE = '#7a6a54';
  const pivot = (x, y, z, ...m) => { const g = new THREE.Group(); g.position.set(x, y, z); if (m.length) g.add(...m); return g; };
  const hasardP = (a, b = 0) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  const bruit = (x, y, z) => Math.sin(x * 4.1 + z * 2.3) * Math.cos(y * 3.7 + x * 1.3);
  const verts = (x, y, z) => { const n = bruit(x, y, z); return n > 0.3 ? MOUSSE_C : n < -0.25 ? MOUSSE_F : MOUSSE; };
  /** Une petite fleur blanche (toute simple : on la voit de loin) ; elle brille la nuit. */
  const fleur = (a, x, y, z, s = 1) => {
    a.ovale(0.05 * s, FLEUR, { x, y, z, sy: 0.42, sorte: 'lumiere', trait: false }, 6);
    a.ovale(0.018 * s, COEUR_F, { x, y: y + 0.02 * s, z, trait: false, sorte: 'lumiere' }, 4);
  };
  /** Une fronde de fougère : deux triangles dos à dos, du pied de à la pointe, repliée au milieu. */
  const fronde = (a, de, dir, L, W, c) => {
    const n = Math.hypot(dir[0], dir[2]) || 1, ox = -dir[2] / n, oz = dir[0] / n, mi = [de[0] + dir[0] * L * 0.5, de[1] + dir[1] * L * 0.62, de[2] + dir[2] * L * 0.5], bout = [de[0] + dir[0] * L, de[1] + dir[1] * L * 0.5, de[2] + dir[2] * L];
    const g1 = [mi[0] + ox * W, mi[1], mi[2] + oz * W], g2 = [mi[0] - ox * W, mi[1], mi[2] - oz * W], pos = [...de, ...g1, ...bout, ...de, ...bout, ...g2, ...de, ...bout, ...g1, ...de, ...g2, ...bout];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    a.piece(geo, c, { trait: false, nuance: 0.05 });
  };
  /** Une barbe de lichen : une longue pointe qui pend (trois faces, sans trait). */
  const barbe = (a, x, y, z, L, r = 0.03) => a.fut([x, y, z], [x + 0.02, y - L, z + 0.02], r, 0.004, LICHEN, 3, { trait: false });
  /** Une mèche de poil : une lame pointue, de base à pointe, tournée vers normale. */
  const meche = (a, base, pointe, normale, large, c, bout = null) => plumeCormoran(THREE, a, { base, pointe, normale, large, epais: 0.035, c, bout, finBout: 0.72, roulis: (hasardP(base[0] * 7, base[1] * 5) - 0.5) * 0.5, bombe: 0.03, profil: [0.55, 1, 0.82, 0.45, 0.05] });

  const racine = new THREE.Group(), corps = new THREE.Group();
  racine.scale.setScalar(S);
  racine.add(corps);

  // ---- le corps, massif : le poitrail profond, le ventre rentré, la croupe ronde. Le pelage clair en bas ; au-dessus d'une ligne qui ondule, la mousse,
  // puis un manteau de mousse bosselé par-dessus, des mottes, des fougères, de petites fleurs, des barbes de lichen qui pendent des flancs
  const YC = 2.28;
  const sculpte = (x, y, z) => {
    const l = Math.hypot(x, y, z) || 1, fz = z / l, fy = y / l, k = 1 + 0.12 * Math.max(0, fz) * (1 - Math.abs(fy)) - (fy < 0 ? 0.16 * (1 - Math.abs(fz)) * -fy : 0);
    return [x * k, y * (k + 0.06 * Math.max(0, fz)), z];
  };
  const c = atelier();
  c.ovale(1, PELAGE, {
    y: YC, sx: 0.76, sy: 0.84, sz: 1.72, deformer: sculpte, nuance: 0.03,
    teinte: (x, y, z) => { if (y > YC + 0.14 + 0.12 * bruit(x, 0, z)) return verts(x, y, z); return y < YC - 0.42 ? PELAGE_F : y < YC - 0.1 && hasardP(Math.floor(x * 3), Math.floor(z * 3)) > 0.7 ? PELAGE_C : PELAGE; },
  }, 20);
  c.piece(new THREE.SphereGeometry(1, 22, 7, 0, 2 * PI, 0, PI * 0.42), MOUSSE, {
    y: YC, sx: 0.8, sy: 0.875, sz: 1.77, teinte: verts,
    deformer: (x, y, z) => {
      const [a, b, d] = sculpte(x, y, z), t = Math.atan2(z, x), bord = Math.max(0, 1 - y / 0.42), n = 1 + 0.035 * Math.sin(t * 9 + y * 5) + 0.03 * Math.sin(t * 17 - y * 7);
      return [a * n, b * n - bord * 0.13 * (0.5 + 0.5 * Math.sin(t * 13)), d * n];
    },
  });
  for (let k = 0; k < 15; k++) {
    const z = -1.42 + (k / 14) * 2.84, sg = k % 2 ? 1 : -1, x = sg * (0.08 + 0.26 * hasardP(k)), yd = YC + 0.88 * Math.sqrt(Math.max(0, 1 - (z / 1.85) ** 2 - (x / 0.82) ** 2));
    c.houppe(0.22 + 0.14 * hasardP(k, 2), k % 3 ? MOUSSE : MOUSSE_C, { x, y: yd - 0.03, z, sy: 0.55, bosses: 0.25 }, 1);
    const t = hasardP(k, 3) * 6.28;
    for (let j = 0; j < 3; j++) {
      const a0 = t + j * 2.1;
      fronde(c, [x, yd + 0.08, z], [Math.cos(a0), 0.8, Math.sin(a0)], 0.68 + 0.3 * hasardP(k, j), 0.12, j % 2 ? '#6aa04a' : '#559038');
    }
    fleur(c, x + 0.22 * sg, yd + 0.19, z + 0.14, 1.3);
    fleur(c, x - 0.18 * sg, yd + 0.15, z - 0.18, 1.05);
    // (les barbes : le long du flanc, de chaque côté)
    for (const sf of [-1, 1]) {
      if ((k + (sf > 0 ? 1 : 0)) % 2) continue;
      const zb = z + (hasardP(k, sf + 4) - 0.5) * 0.3, fx = Math.sqrt(Math.max(0, 1 - (zb / 1.77) ** 2 - 0.05)) * 0.8;
      barbe(c, sf * fx * 0.99, YC + 0.06 + 0.12 * hasardP(k, sf + 7), zb, 0.28 + 0.6 * hasardP(k, sf + 8) ** 2);
    }
  }
  // le miroir clair de la croupe, la petite queue
  c.ovale(0.36, PELAGE_C, { y: YC + 0.02, z: -1.68, sx: 1.0, sy: 1.0, sz: 0.28, trait: false }, 10)
    .ovale(0.16, PELAGE_C, { y: YC + 0.1, z: -1.84, sy: 1.6, sz: 0.6 }, 8);
  corps.add(maillage(c.fin(0, false)));

  // ---- les pattes : d'un seul galbe, du haut charnu (dans le corps) au genou ; le canon fin, le boulet et ses poils, le sabot ; de la mousse aux genoux
  const Y_HANCHE = 1.95;
  const pattes = [[-1, true, 0.25], [1, true, 0.75], [-1, false, 0], [1, false, 0.5]].map(([sx, avant, decal]) => {
    const z0 = avant ? 1.08 : -1.12, genou = avant ? [0, -0.92, 0.07] : [0, -0.82, -0.36], LB = Y_HANCHE + genou[1];
    // (le haut, un seul galbe de six anneaux ; à son sommet, une grosse cuisse ronde, sans trait : elle se fond dans le corps. En quatre anneaux, il faisait des angles)
    const H = atelier().tronc(avant ? [[0, 0.5, -0.07], [0, 0.2, -0.02], [0, -0.1, 0.02], [0, -0.38, 0.05], [0, -0.68, 0.07], genou] : [[0, 0.5, 0.14], [0, 0.2, 0.1], [0, -0.1, 0.03], [0, -0.36, -0.09], [0, -0.6, -0.24], genou], avant ? [0.42, 0.42, 0.35, 0.25, 0.165, 0.122] : [0.5, 0.5, 0.42, 0.29, 0.175, 0.118], PELAGE, 11, { sx: 0.8 });
    H.ovale(avant ? 0.4 : 0.48, PELAGE, { y: 0.12, z: avant ? -0.02 : 0.07, sx: 0.8, sy: 1.25, trait: false }, 12);
    // (la mousse des genoux : une manchette bosselée, pas une boule)
    H.tronc([[genou[0], genou[1] + 0.2, genou[2] * 0.72], [genou[0], genou[1], genou[2]], [genou[0], genou[1] - 0.12, genou[2]]], [0.15, 0.165, 0.13], MOUSSE, 8, { teinte: verts });
    const zp = avant ? 0.03 : 0.12;
    const B = atelier().tronc([[0, 0.06, 0], [0, -LB * 0.42, avant ? 0.005 : 0.07], [0, -LB + 0.26, zp], [0, -LB + 0.15, zp + 0.01]], [0.118, 0.082, 0.078, 0.1], PELAGE, 8);
    B.ovale(0.112, PELAGE_C, { y: -LB + 0.27, z: zp, sy: 0.78 }, 8);
    B.cylindre(0.102, 0.145, 0.2, 8, SABOT, { y: -LB + 0.1, z: zp + 0.018 });
    const bas = pivot(genou[0], genou[1], genou[2], maillage(B.fin(0, false)));
    const haut = pivot(sx * 0.42, Y_HANCHE, z0, maillage(H.fin(0, false)), bas);
    corps.add(haut);
    return { sx, avant, decal, z0, haut, bas, u: decal };
  });

  // ---- le cou : large à sa base ; la crinière de mousse sur la nuque, le jabot de longs poils clairs sous la gorge
  const k0 = atelier(), LC = [[0, -0.6, -0.6], [0, -0.02, -0.02], [0, 0.56, 0.42], [0, 1.02, 0.7]];
  k0.tronc(LC, [0.74, 0.6, 0.45, 0.33], PELAGE, 14, { nuance: 0.03 });
  // (la nuque : de la mousse d'un seul tenant, du garrot aux oreilles. Peinte triangle par triangle sur le cou, elle faisait des dents)
  for (let k = 0; k < 11; k++) {
    const f = k / 10, y = -0.42 + f * 1.48, z = -0.34 + f * 0.82 - 0.34 * (1 - f) - 0.26;
    k0.houppe(0.42 - 0.2 * f, k % 3 === 1 ? MOUSSE_C : MOUSSE, { x: k % 2 ? 0.06 : -0.06, y, z, sy: 0.8, sx: 0.92, bosses: 0.3 }, 1);
    for (const s of [-1, 1]) if (k % 2 === 0) barbe(k0, s * (0.44 - 0.24 * f), y - 0.06, z + 0.3, 0.36 + 0.3 * hasardP(k, s));
    if (k % 2) fleur(k0, k % 4 === 1 ? 0.15 : -0.15, y + 0.3 - 0.1 * f, z + 0.02, 1.25);
  }
  // (le poitrail : trois boudins de poils doux, festonnés, de plus en plus gros vers le bas. Des lames faisaient une armure, des touffes des cailloux)
  const boudin = (a0, pts, R, c, n) => {
    const C = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), PAS = 60, COTES = 8, g = new THREE.TubeGeometry(C, PAS, R, COTES, false), p = g.attributes.position, cc = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      const f = Math.floor(i / (COTES + 1)) / PAS;
      C.getPoint(f, cc);
      const b = (0.78 + 0.36 * Math.abs(Math.sin(f * n * PI)) ** 0.7) * Math.min(1, Math.min(f, 1 - f) * 14);
      p.setXYZ(i, cc.x + (p.getX(i) - cc.x) * b, cc.y + (p.getY(i) - cc.y) * b, cc.z + (p.getZ(i) - cc.z) * b);
    }
    a0.piece(g, c, { nuance: 0.015 });
  };
  for (const [y0, R, rb, n, c] of [[0.44, 0.44, 0.115, 8, PELAGE], [0.12, 0.53, 0.15, 9, PELAGE_C], [-0.24, 0.63, 0.185, 10, PELAGE_C]]) {
    const axe = 0.02 + 0.62 * y0, pts = [];
    for (let j = 0; j <= 12; j++) { const u = -1.95 + (j / 12) * 3.9; pts.push([Math.sin(u) * R, y0 - 0.12 * Math.abs(Math.sin(u)) + 0.1 * Math.abs(u) / 1.95, axe + Math.cos(u) * R]); }
    boudin(k0, pts, rb, c, n);
  }

  // ---- la tête : une vraie tête de cerf (comme nos cerfs sika, en grand) ; les bois, en vieux bois, de la mousse sur leur bas, des fleurs, des barbes
  const T = atelier();
  T.ovale(0.39, PELAGE, { y: 0.12, z: 0.1, sx: 0.84, sy: 0.92, sz: 1.08 }, 14)
    .ovale(0.25, PELAGE, { y: -0.03, z: 0.58, sx: 0.72, sy: 0.74, sz: 1.72, rx: 0.2 }, 12)
    .ovale(0.105, '#2f2826', { y: -0.13, z: 1.0, sx: 1.0, sy: 0.74, sz: 0.62, rx: 0.2 }, 8)
    .boite(0.11, 0.01, 0.12, '#6a5a48', { y: -0.26, z: 0.86, rx: 0.2, trait: false })
    .ovale(0.17, PELAGE_C, { y: -0.2, z: 0.46, sx: 0.66, sy: 0.42, sz: 1.3, trait: false }, 8)
    .ovale(0.15, PELAGE_F, { y: 0.28, z: 0.36, sx: 0.62, sy: 0.26, sz: 1.5, rx: 0.3, trait: false }, 8);
  for (const s of [-1, 1]) {
    T.ovale(0.092, '#1c1410', { x: s * 0.285, y: 0.17, z: 0.34, sx: 0.46, sy: 0.92, sz: 1.0 }, 10)
      .ovale(0.05, '#3a2414', { x: s * 0.318, y: 0.165, z: 0.362, sx: 0.28, sy: 0.82, sz: 0.82, trait: false }, 8)
      .ovale(0.015, '#ffffff', { x: s * 0.334, y: 0.2, z: 0.378, sx: 0.5, trait: false }, 5)
      .ovale(0.078, PELAGE_C, { x: s * 0.27, y: 0.272, z: 0.34, sx: 0.5, sy: 0.3, sz: 1.25, trait: false }, 6)
      .ovale(0.34, PELAGE_F, { x: s * 0.52, y: 0.36, z: -0.08, sx: 0.5, sz: 0.22, rz: s * 1.02 }, 10)
      .ovale(0.25, '#ead2b8', { x: s * 0.53, y: 0.365, z: -0.05, sx: 0.4, sz: 0.12, rz: s * 1.02, trait: false }, 8);
    const sur = (p) => [s * p[0], p[1], p[2]];
    const P0 = [[0.17, 0.44, -0.04], [0.44, 0.98, -0.22], [0.76, 1.62, -0.3], [0.92, 2.26, -0.14], [0.86, 2.84, 0.14]];
    T.tronc(P0.map(sur), [0.115, 0.095, 0.072, 0.052, 0.015], BOIS, 6, { nuance: 0.07, teinte: (x, y, z) => (Math.sin(y * 14 + x * 5) > 0.55 ? ECORCE : BOIS) });
    T.tronc([P0[0], P0[1], [0.6, 1.3, -0.26]].map(sur), [0.15, 0.13, 0.1], MOUSSE, 6, { teinte: verts });
    const entre = (i, f) => P0[i].map((v, j) => v + (P0[i + 1][j] - v) * f);
    for (const [i, f, d, r] of [[0, 0.45, [0.12, 0.42, 0.8], 0.064], [1, 0.3, [0.38, 0.46, 0.5], 0.058], [2, 0.05, [0.56, 0.4, 0.12], 0.054], [2, 0.55, [-0.38, 0.62, 0.18], 0.046], [3, 0.2, [0.44, 0.46, -0.26], 0.04], [3, 0.7, [-0.24, 0.46, 0.22], 0.03]]) {
      const a = entre(i, f), m = [a[0] + d[0] * 0.55, a[1] + d[1] * 0.45, a[2] + d[2] * 0.55], b = [a[0] + d[0], a[1] + d[1], a[2] + d[2]];
      T.tronc([a, m, b].map(sur), [r, r * 0.7, r * 0.2], BOIS, 5, { nuance: 0.07 });
      fleur(T, s * (b[0] - d[0] * 0.2), b[1] - d[1] * 0.14, b[2] - d[2] * 0.2, 1.7);
      fleur(T, s * m[0], m[1] + 0.05, m[2], 1.3);
      if (i < 3) T.fut(sur(m), [s * m[0] + 0.03, m[1] - 0.5 - 0.24 * hasardP(i, f), m[2] + 0.02], 0.03, 0.004, LICHEN, 3, { trait: false });
    }
    fleur(T, s * 0.86, 2.8, 0.12, 1.6);
  }
  const tete = pivot(0, 1.06, 0.74, maillage(T.fin(0, false)));
  const cou = pivot(0, 2.72, 1.28, maillage(k0.fin(0, false)), tete);
  corps.add(cou);

  // ---- la marche
  const FOULEE = 2.5 * S, A = 0.36;
  let phase = 0, allure = 0, baisse = 0, voulueBaisse = 0;
  const regard = { l: 0, t: 0, vl: 0, vt: 0 }, TEMPS_APPUI = 0.66;
  return {
    objet: racine,
    /** La tête se tourne (lacet : positif, vers +x du monde quand il regarde +z) et se lève ou se baisse (tangage, positif vers le bas). */
    regard(lacet, tangage = 0) { regard.vl = lacet; regard.vt = tangage; },
    /** Il s'incline : 0 debout, 1 la tête basse, vers nous. */
    incliner(b) { voulueBaisse = b; },
    animer(dt, temps, vitesse) {
      allure += ((vitesse > 0.02 ? 1 : 0) - allure) * Math.min(1, dt * 2.6);
      phase += (dt * vitesse) / FOULEE;
      const appuis = [], cy = Math.cos(racine.rotation.y), sy = Math.sin(racine.rotation.y);
      for (const p of pattes) {
        const u = ((phase + p.decal) % 1 + 1) % 1;
        // (la patte vient de se poser : au début de l'appui, devant)
        if (u < p.u && vitesse > 0.02) {
          const lz = p.z0 + Math.sin(A) * Y_HANCHE, lx = p.sx * 0.42;
          appuis.push([racine.position.x + (lx * cy + lz * sy) * S, racine.position.z + (-lx * sy + lz * cy) * S]);
        }
        p.u = u;
        let ang, flex;
        if (u < TEMPS_APPUI) { ang = A * (1 - (2 * u) / TEMPS_APPUI); flex = 0.04; }
        else { const s = (u - TEMPS_APPUI) / (1 - TEMPS_APPUI), e = s * s * (3 - 2 * s); ang = A * (2 * e - 1); flex = Math.sin(PI * s) * (p.avant ? 1.15 : 0.9); }
        p.haut.rotation.x = -ang * allure;
        p.bas.rotation.x = flex * allure;
      }
      // le corps se balance, le cou répond avec un peu de retard, la tête reste presque droite ; il respire ; incliné, tout l'avant descend un peu
      const b = phase * 2 * PI, souffle = Math.sin(temps * 1.15);
      baisse += (voulueBaisse - baisse) * Math.min(1, dt * 1.5);
      corps.position.y = allure * 0.05 * Math.sin(b * 2) + 0.012 * souffle - 0.1 * baisse;
      corps.rotation.z = allure * 0.018 * Math.sin(b);
      corps.rotation.x = allure * 0.012 * Math.sin(b * 2 + 1) + 0.07 * baisse;
      regard.l += (regard.vl - regard.l) * Math.min(1, dt * 1.8);
      regard.t += (regard.vt - regard.t) * Math.min(1, dt * 1.8);
      cou.rotation.set(0.04 + baisse * 0.82 + allure * 0.035 * Math.sin(b * 2 - 0.7) + 0.008 * souffle + regard.t * 0.5, regard.l * 0.55, 0, 'YXZ');
      tete.rotation.set(baisse * 0.26 - allure * 0.03 * Math.sin(b * 2 - 0.7) + regard.t * 0.5, regard.l * 0.5, Math.sin(temps * 0.4) * 0.012, 'YXZ');
      return appuis;
    },
  };
}
