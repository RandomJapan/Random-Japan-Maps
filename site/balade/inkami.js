// ================================================================
//  Sumi, le peintre ambulant d'Inkami, et ses tableaux (2026-11-19, le jour de l'ouverture de la boutique inkami.art ; le
//  propriétaire : « rajouter pour chaque lieu un tableau, un ou deux tableaux en fonction de la grandeur du lieu, où on pourrait
//  interagir avec pour justement regarder le tableau directement dans le jeu […] et qu'on puisse directement depuis le jeu
//  atterrir sur la boutique […] Potentiellement un vendeur qui vendrait ses tableaux »).
//  Inkami est la marque des tableaux du propriétaire : un portrait à l'encre noire (en samouraï ou en geisha) collé sur de vrais
//  journaux japonais, le prénom calligraphié en katakana, un ornement de bambou dans le coin. Ici, Sumi peint de la même façon
//  les personnages du jeu (le cerf d'Itsukushima, le samouraï de Himeji, le chameau de Tottori, les compagnons…) : les images
//  sont dans tableaux/ (fabriquées hors du jeu à partir des vrais modèles : voir instructions/balade.md).
//  Un lieu a son peintre s'il rend `peintre` : { x, z, cap, tableau, autre? } — (x, z) : le pied du chevalet ; cap : vers où la
//  toile est tournée (d'où l'on vient la regarder) ; tableau : son image (TABLEAUX) ; autre { x, z, cap, tableau } : dans les
//  grands lieux, un second tableau, seul sur son chevalet, ailleurs. 'voyageur' : le portrait du voyageur qu'on a choisi (en
//  samouraï), ou de la voyageuse (en kimono d'or).
//  On regarde un tableau (« Regarder », ou en parlant à Sumi) dans une fenêtre du jeu : l'image en grand, ce que fait Inkami
//  (la phrase de sa fiche produit), et le bouton qui ouvre la boutique dans un autre onglet.
//  Les textes (anglais, français, japonais) sont ici, avec le reste : TEXTES.
// ================================================================

import { CONFIG } from '../config.js';

/**
 * L'adresse de la boutique (CONFIG.boutique, config.js : le réglage du lien « Mes tableaux » de la carte), dans la langue du joueur quand la
 * boutique la publie (boutique.langues), et qui dit d'où l'on vient : la boutique compte ses visites par source (utm_source=map, comme la
 * carte ; utm_medium=balade ; le lieu et le tableau). Rien si le réglage est vide (adresse: '' : le bouton disparaît, les tableaux restent).
 */
export function lienBoutique(lieu, tableau, langue) {
  const b = CONFIG.boutique;
  if (!b?.adresse) return '';
  const url = new URL(b.langues?.includes(langue) ? langue : '', b.adresse);
  url.search = new URLSearchParams({ utm_source: 'map', utm_medium: 'balade', utm_campaign: lieu, utm_content: tableau });
  return url.href;
}

/** Les tableaux : le nom écrit au pinceau sur chacun (son image : tableaux/<id>.webp, 800 × 1131). */
export const TABLEAUX = {
  shika: 'シカ', campeur: 'キャンパー', kokiriko: 'コキリコ', pon: 'ポン', samourai: 'サムライ', voyageur: 'タビビト', voyageuse: 'タビビト',
  uzume: 'ウズメ', chapu: 'チャプ', kimono: 'キモノ', tamago: 'タマゴ', bunbuku: 'ブンブク', kon: 'コン', yamabushi: 'ヤマブシ', miko: 'ミコ',
  fuwa: 'フワ', saya: 'サヤ', rakuda: 'ラクダ', junrei: 'ジュンレイ', gao: 'ガオ',
};
const image = (id) => `tableaux/${id}.webp`;

// la toile : un carton de 64 × 90,5 cm (bien plus grand que le vrai, un A3 : on le regarde de loin), penché sur son chevalet
const TOILE = { l: 0.64, h: 0.905, e: 0.02, y: 1.1994, z: -0.0007, penche: 0.213 };
const BOIS = '#9a7448', BOIS_F = '#6e5030', CARTON = '#efe6d2';

/**
 * Le chevalet (dans le repère de l'objet : z vers celui qui regarde) : deux pieds devant, penchés en arrière, un pied derrière, la
 * traverse, la tablette où repose la toile, la pince du haut ; la toile, appuyée sur les pieds.
 */
function chevalet(a) {
  for (const s of [-1, 1]) a.baton([s * 0.4, -0.08, 0.2], [s * 0.1, 1.8, -0.16], 0.022, BOIS, 6);
  a.baton([0, -0.08, -0.62], [0, 1.76, -0.15], 0.02, BOIS, 6)
    .baton([-0.335, 0.38, 0.118], [0.335, 0.38, 0.118], 0.016, BOIS, 5)
    .boite(0.76, 0.03, 0.1, BOIS_F, { y: 0.74, z: 0.117 })
    .boite(0.76, 0.03, 0.012, BOIS_F, { y: 0.768, z: 0.161 })
    .boite(0.24, 0.07, 0.07, BOIS_F, { y: 1.775, z: -0.153 })
    .boite(0.1, 0.05, 0.05, BOIS_F, { y: 1.672, z: -0.105, rx: -TOILE.penche })
    .boite(TOILE.l, TOILE.h, TOILE.e, CARTON, { y: TOILE.y, z: TOILE.z, rx: -TOILE.penche, nuance: 0.01 });
  return a;
}

/** La caisse du peintre : la pierre à encre, la coupelle, le pot de pinceaux, la pile de vieux journaux, un rouleau. */
function caisse(a, x, z, ry = 0) {
  const c = Math.cos(ry), s = Math.sin(ry), R = (u, v) => ({ x: x + u * c + v * s, z: z - u * s + v * c });
  // (la caisse s'enfonce de 6 cm : posée juste sur le sol, un coin flotterait dès qu'il penche un peu)
  a.boite(0.56, 0.4, 0.38, BOIS, { x, y: 0.14, z, ry })
    .boite(0.6, 0.03, 0.42, BOIS_F, { x, y: 0.355, z, ry })
    .boite(0.17, 0.035, 0.11, '#2a2624', { ...R(-0.17, 0.08), y: 0.387, ry, nuance: 0.01 })
    .boite(0.1, 0.012, 0.07, '#15100e', { ...R(-0.17, 0.08), y: 0.407, ry, trait: false, nuance: 0 })
    .cylindre(0.062, 0.045, 0.03, 10, '#f4f0e6', { ...R(-0.17, -0.1), y: 0.385 })
    .cylindre(0.048, 0.048, 0.13, 8, '#a3a35c', { ...R(0.2, -0.1), y: 0.435 });
  // (les pinceaux dans leur pot de bambou : trois manches penchés, la touffe en haut)
  for (const [dx, dz, i] of [[0.02, 0.01, 0], [-0.02, 0.015, 1], [0, -0.02, 2]]) {
    const p = R(0.2 + dx * 0.4, -0.1 + dz * 0.4), q = R(0.2 + dx * 2.2, -0.1 + dz * 2.2);
    a.baton([p.x, 0.44, p.z], [q.x, 0.66 + i * 0.012, q.z], 0.007, '#b89a5e', 4, { trait: false })
      .cone(0.012, 0.045, 5, i === 1 ? '#f4f0e6' : '#15100e', { x: q.x, y: 0.685 + i * 0.012, z: q.z, trait: false });
  }
  // (la pile de journaux, un peu de travers ; un rouleau de papier posé dessus)
  for (const [k, t] of [[0, 0.08], [1, -0.1], [2, 0.03]]) a.boite(0.25, 0.018, 0.19, k === 1 ? '#e6dcc4' : '#efe6d2', { ...R(0.13, 0.09), y: 0.381 + k * 0.019, ry: ry + t, nuance: 0.015 });
  return a;
}

/** L'enseigne posée par terre (deux planches en chevalet) et, derrière elle, la perche de bambou du lampion. */
function enseigne(a, x, z, ry) {
  const c = Math.cos(ry), s = Math.sin(ry), penche = 0.2;
  // (la planche de devant, penchée en arrière ; celle de derrière, penchée en avant : elles se rejoignent en haut, et leur pied s'enfonce de 6 cm)
  a.boite(0.42, 0.72, 0.022, BOIS_F, { x: x + s * 0.006, y: 0.2956, z: z + c * 0.006, ry, rx: -penche, ordre: 'YXZ' })
    .boite(0.42, 0.72, 0.022, BOIS_F, { x: x - s * 0.138, y: 0.2956, z: z - c * 0.138, ry, rx: penche, ordre: 'YXZ' })
    .boite(0.44, 0.03, 0.05, BOIS, { x: x - s * 0.066, y: 0.655, z: z - c * 0.066, ry });
  // (la perche : plantée derrière l'enseigne ; la potence vers l'avant ; le lampion de papier clair, allumé la nuit)
  const px = x - s * 0.3, pz = z - c * 0.3, lx = px + s * 0.3, lz = pz + c * 0.3;
  a.baton([px, -0.2, pz], [px, 2.0, pz], 0.026, '#a3a35c', 6)
    .baton([px, 1.94, pz], [lx + s * 0.04, 1.94, lz + c * 0.04], 0.013, '#a3a35c', 5)
    // (pendu à un crochet, une tige jusque dans sa coiffe : à un fil, les lampions semblaient flotter — Beppu, 2026-10-27)
    .baton([lx, 1.93, lz], [lx, 1.797, lz], 0.012, '#2a2420', 4)
    .chochin(lx, 1.7, lz, 2.8, '#f6ecd2');
  return { lampion: [lx, 1.7, lz], perche: [px, pz] };
}

// le sceau de la marque (celui du lien « Mes tableaux » de la carte : img/inkami-sceau.png, 67 × 96, la calligraphie 墨紙 du propriétaire)
const SCEAU = typeof Image === 'undefined' ? null : new Image();
if (SCEAU) SCEAU.src = new URL('../img/inkami-sceau.png', import.meta.url).href;
let sceauDessine = false;
/** Le sceau arrivé après le premier dessin de l'enseigne : f() (redessiner les étiquettes du lieu). */
export function quandSceau(f) { SCEAU?.decode().then(() => { if (!sceauDessine) f(); }, () => {}); }
/** L'enseigne : le sceau rouge 墨紙 (encre, papier), INKAMI, インカミ. Le sceau de la marque s'il est chargé ; sinon un carré rouge dessiné ici. */
function dessinEnseigne(c, W, H) {
  c.fillStyle = '#f2e8d2'; c.fillRect(0, 0, W, H);
  const t = W * 0.5, x0 = (W - t) / 2, y0 = H * 0.1;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  if (SCEAU?.complete && SCEAU.naturalWidth) {
    const h = H * 0.5, l = (h * SCEAU.naturalWidth) / SCEAU.naturalHeight;
    c.imageSmoothingQuality = 'high';
    c.drawImage(SCEAU, (W - l) / 2, H * 0.07, l, h);
    sceauDessine = true;
  } else {
    c.fillStyle = '#b03526';
    c.beginPath(); c.roundRect(x0, y0, t, t, t * 0.09); c.fill();
    c.fillStyle = '#f2e8d2';
    c.font = `800 ${Math.round(t * 0.4)}px "M PLUS Rounded 1c", sans-serif`;
    c.fillText('墨', W / 2, y0 + t * 0.29); c.fillText('紙', W / 2, y0 + t * 0.73);
  }
  c.fillStyle = '#15100e';
  c.font = `800 ${Math.round(W * 0.17)}px "M PLUS Rounded 1c", sans-serif`;
  c.fillText('INKAMI', W / 2, H * 0.72);
  c.font = `700 ${Math.round(W * 0.1)}px "M PLUS Rounded 1c", sans-serif`;
  c.fillText('インカミ', W / 2, H * 0.86);
}

/**
 * Installe le peintre du lieu, avant que le jeu ne fabrique son décor et ses passants : le chevalet, la caisse, l'enseigne et son
 * lampion (un objet de plus dans lieu.objets), Sumi (un passant de plus), ce qu'on peut y faire (lieu.interactions), ce qui arrête
 * le marcheur (lieu.monde), le lampion (lieu.lumieres), l'enseigne (lieu.etiquettes).
 * ctx : { atelier, peinture } du jeu ; actions : { parler(jeu), regarder(id) }, données par le jeu.
 * Rend { toiles: [{ id, x, y, z, cap }] } (les images à poser sur les toiles : poserToiles), ou null si le lieu n'a pas de peintre.
 */
export function installerInkami(lieu, ctx, actions) {
  const Q = lieu.peintre;
  if (!Q) return null;
  const { monde } = lieu, toiles = [];
  lieu.lumieres ||= [];
  lieu.etiquettes ||= [];
  /** Du repère d'un chevalet (u à droite de celui qui regarde, v vers lui) au lieu. */
  const repere = (q) => { const c = Math.cos(q.cap), s = Math.sin(q.cap); return (u, v) => ({ x: q.x + u * c + v * s, z: q.z - u * s + v * c }); };
  const poserChevalet = (q, a) => {
    const y = q.y ?? monde.hauteur(q.x, q.z), R = repere(q);
    chevalet(a);
    // (ce qui arrête le marcheur, un point : la largeur d'un corps, 25 cm, autour de ce qu'on voit, pas plus — la tablette et les deux pieds de
    // devant, puis le pied de derrière)
    const A = R(-0.38, 0.12), B = R(0.38, 0.12), C = R(0, -0.42);
    monde.mur(A.x, A.z, B.x, B.z, 0.3);
    monde.cercle(C.x, C.z, 0.44);
    // la toile : là où l'on pose l'image (2,5 mm devant le carton, penchée comme lui)
    const n = TOILE.e / 2 + 0.0025, p = R(0, TOILE.z + n * Math.cos(TOILE.penche));
    toiles.push({ id: q.tableau, x: p.x, y: y + TOILE.y + n * Math.sin(TOILE.penche), z: p.z, cap: q.cap });
    // on la regarde de devant, à un grand pas
    const d = R(q.cote ?? 0, 1.15);
    lieu.interactions.push({ id: `tableau-${q.tableau}`, x: d.x, z: d.z, y, rayon: 1.5, haut: 1.75, verbe: 'regarder', vers: [q.x, q.z], action: () => actions.regarder(q.tableau) });
    return y;
  };

  // ---- l'étal de Sumi : le chevalet, la caisse à sa droite, l'enseigne et le lampion à gauche
  {
    const a = ctx.atelier(), y = poserChevalet({ ...Q, cote: -0.3 }, a), R = repere(Q);
    const E = { u: -1.0, v: 0.42, ry: 0.3 }, e = enseigne(a, E.u, E.v, E.ry);
    caisse(a, 1.12, 0.3, -0.35);
    lieu.objets.push({ fin: a.fin(0, ctx.peinture), x: Q.x, y, z: Q.z, ry: Q.cap, ombre: true, trait: true });
    // (la caisse : le long de sa longueur ; l'enseigne et sa perche : de l'une à l'autre)
    const K = { u: 1.12, v: 0.3, ry: -0.35 }, ku = Math.cos(K.ry) * 0.13, kv = -Math.sin(K.ry) * 0.13, c0 = R(K.u - ku, K.v - kv), c1 = R(K.u + ku, K.v + kv);
    monde.mur(c0.x, c0.z, c1.x, c1.z, 0.45);
    const e0 = R(E.u - Math.sin(E.ry) * 0.03, E.v - Math.cos(E.ry) * 0.03), e1 = R(E.u - Math.sin(E.ry) * 0.24, E.v - Math.cos(E.ry) * 0.24), pl = R(e.lampion[0], e.lampion[2]);
    monde.mur(e0.x, e0.z, e1.x, e1.z, 0.42);
    lieu.lumieres.push({ x: pl.x, y: y + e.lampion[1], z: pl.z, halo: 0.5, sol: y, r: 3.4 });
    // (l'étiquette de l'enseigne : sur la planche de devant, penchée comme elle)
    const penche = 0.2, n = 0.011 + 0.002, pt = R(E.u + Math.sin(E.ry) * n * Math.cos(penche), E.v + Math.cos(E.ry) * n * Math.cos(penche));
    lieu.etiquettes.push({ texte: '', fond: null, dessin: dessinEnseigne, x: pt.x, y: y + 0.325 + n * Math.sin(penche), z: pt.z, ry: Q.cap + E.ry, incline: penche, l: 0.36, h: 0.58 });
    // Sumi : devant sa toile, un peu à droite (on la voit à côté de lui), tourné vers elle, à portée de pinceau
    const ps = R(0.47, 0.62);
    lieu.passants.push({
      id: 'sumi', x: ps.x, z: ps.z, cap: Q.cap + Math.atan2(0.2 - 0.47, 0.05 - 0.62), retour: true,
      tenue: { taille: 1.04, peau: '#e8bf98', cheveux: '#b8b4ac', coiffure: 'chignon', lunettes: true, haut: '#2f4a7a', manches: 'kimono', col: '#e8dcc0', tablier: '#e8dcc0', bas: { sorte: 'hakama', c: '#3a3f4a', c2: '#4a505c' }, chaussures: '#f4f0e6', semelle: '#c9b48a', pose: 'peindre', yeux: 'plisses' },
    });
    lieu.interactions.push({ id: 'sumi', passant: 'sumi', verbe: 'parler', action: (jeu) => actions.parler(jeu) });
  }
  // ---- le second tableau des grands lieux : seul sur son chevalet
  if (Q.autre) {
    const a = ctx.atelier(), y = poserChevalet(Q.autre, a);
    lieu.objets.push({ fin: a.fin(0, ctx.peinture), x: Q.autre.x, y, z: Q.autre.z, ry: Q.autre.cap, ombre: true, trait: true });
  }
  return { toiles };
}

/**
 * Les images sur les toiles : un rectangle par toile, sa texture chargée après coup (en attendant : le carton nu). Rend
 * { groupe, changer(id, par), nuit(v) } — changer : une toile montre une autre image (le portrait du voyageur, quand on change de voyageur) ;
 * nuit(v) : v de 0 (le jour) à 1 (la nuit) — la nuit, la toile garde une lueur chaude, celle du lampion (sans elle, elle était noire).
 */
export function poserToiles(THREE, toiles, { anisotropie = 4, nom = (id) => id, pret = null } = {}) {
  const groupe = new THREE.Group(), chargeur = new THREE.TextureLoader(), mailles = new Map();
  // (en attendant l'image : le carton nu, une texture d'un seul point. La matière a ainsi ses deux textures dès le départ : son programme ne
  // change pas quand l'image arrive — sinon il était refait à ce moment-là, en plein jeu)
  const vide = new THREE.DataTexture(new Uint8Array([0xef, 0xe6, 0xd2, 0xff]), 1, 1);
  vide.colorSpace = THREE.SRGBColorSpace;
  vide.needsUpdate = true;
  const charger = (m, id) => {
    if (m.userData.image === id) return;
    m.userData.image = id;
    chargeur.load(image(id), (t) => {
      // (on a changé de voyageur entre-temps : cette image n'est plus la bonne)
      if (m.userData.image !== id) { t.dispose(); return; }
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = anisotropie;
      // (pret : le jeu l'envoie tout de suite à la carte graphique, plutôt qu'à la première image où on la voit)
      pret?.(t);
      const avant = m.material.map;
      m.material.map = m.material.emissiveMap = t;
      if (avant !== vide) avant.dispose();
    }, undefined, () => {});
  };
  for (const q of toiles) {
    const l = TOILE.l - 0.04, h = l * (1131 / 800);
    // (posée 2,5 mm devant son carton : de loin, la profondeur ne les sépare plus ; le décalage la garde devant, comme les étiquettes)
    const m = new THREE.Mesh(new THREE.PlaneGeometry(l, h), new THREE.MeshLambertMaterial({ map: vide, emissiveMap: vide, emissive: '#ffd9a8', emissiveIntensity: 0, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 }));
    m.rotation.order = 'YXZ';
    m.rotation.set(-TOILE.penche, q.cap, 0);
    m.position.set(q.x, q.y, q.z);
    m.receiveShadow = true;
    // (dessinée même hors de vue pendant les premières images : son programme se fabrique pendant l'écran de chargement, pas quand on arrive devant)
    m.frustumCulled = false;
    m.updateMatrix();
    m.matrixAutoUpdate = false;
    groupe.add(m);
    mailles.set(q.id, m);
    charger(m, nom(q.id));
  }
  let nuitVue = 0, images = 0;
  return {
    groupe,
    changer(id, par) { const m = mailles.get(id); if (m) charger(m, par); },
    /** À chaque image : v de 0 (le jour) à 1 (la nuit). */
    nuit(v) {
      if (images < 8 && ++images === 8) for (const m of mailles.values()) m.frustumCulled = true;
      if (v === nuitVue) return;
      nuitVue = v;
      for (const m of mailles.values()) m.material.emissiveIntensity = 0.42 * v;
    },
  };
}

// ---------------------------------------------------------------- Les textes
// tableaux : id → [son titre, ce qu'en dit Sumi (le tableau de son étal ; rien pour un tableau seul)]
export const TEXTES = {
  fr: {
    nom: 'Sumi, le peintre',
    intro: ['Bonjour ! Je suis Sumi, peintre ambulant. Je voyage avec mon chevalet, mon encre noire… et de vieux journaux japonais.', 'Je peins les gens et les bêtes que je croise, directement sur le journal. Regarde !'],
    revoir: ['Tiens, te revoilà ! On se croise partout, toi et moi.'],
    nuit: ['La nuit, je peins à la lueur de mon lampion. L’encre noire aime bien le noir !'],
    atelier: ['Dans mon atelier, Inkami, c’est le visage des voyageurs qu’on met sur le journal : en samouraï ou en geisha, avec leur prénom calligraphié en japonais.'],
    question: 'Tu veux regarder mon tableau de plus près ?', oui: 'Oui', non: 'Non',
    refus: ['Reviens quand tu veux. L’encre, elle, ne s’en va pas !'],
    sous: 'Encre noire sur journaux japonais · peint par Sumi', titreOffre: 'Et si c’était toi ?',
    offre: 'Chez Inkami, ce tableau existe pour de vrai : ton visage en samouraï ou en geisha, à l’encre noire, collé à la main sur de vrais journaux japonais, avec ton prénom calligraphié au pinceau.',
    bouton: 'Voir la boutique Inkami', fermer: 'Fermer',
    tableaux: {
      shika: ['Le cerf de Miyajima', 'Ce cerf est venu poser tout seul. Il n’a pas bougé d’un poil… puis il a voulu manger mon journal !'],
      campeur: ['Le campeur d’Aogashima', 'Le campeur m’a montré les étoiles toute la nuit. Je l’ai peint au matin, les yeux encore pleins de ciel.'],
      kokiriko: ['Le danseur de kokiriko', 'Le danseur de kokiriko ne tient pas en place : j’ai dû peindre aussi vite qu’il fait claquer son sasara !'],
      pon: ['Pon, le tanuki'],
      samourai: ['Le samouraï de Himeji', 'Le samouraï du château a posé sans cligner des yeux. Un vrai guerrier… jusqu’à ce qu’une mouche se pose sur son nez.'],
      voyageur: ['Toi, en samouraï'], voyageuse: ['Toi, en kimono d’or'],
      uzume: ['Uzume, la danseuse du kagura', 'Uzume a dansé pour faire sortir le soleil de sa grotte. Moi, je l’ai fait entrer dans mon journal !'],
      chapu: ['Chapu, la loutre'],
      kimono: ['La promeneuse en kimono', 'Une promeneuse en kimono passait devant le Pavillon d’or. De l’or, je n’en ai pas : alors j’ai tout dit avec du noir.'],
      tamago: ['La dame des œufs', 'La dame des œufs m’a offert un œuf cuit dans l’eau bleue de l’enfer. En échange : son portrait !'],
      bunbuku: ['Bunbuku, le marchand'],
      kon: ['Kon, le renard d’Inari', 'Ici, les renards sont les messagers du dieu Inari. J’ai peint Kon : il paraît qu’il porte bonheur.'],
      yamabushi: ['Le yamabushi', 'Le yamabushi a marché toute sa vie dans ces montagnes. J’ai essayé de mettre tous ces chemins dans son regard.'],
      miko: ['La miko d’Udo', 'La miko du sanctuaire m’a donné un ema en forme de lapin pour y écrire un vœu. Pour la remercier, son portrait !'],
      fuwa: ['Fuwa, le petit dragon'],
      saya: ['Saya, l’esprit de l’arbre', 'Dans cette forêt, on dit que chaque vieux cèdre a son esprit. J’en ai aperçu un… et je l’ai peint avant qu’il ne file.'],
      rakuda: ['Le chameau des dunes', 'Le chameau a posé une heure sans bouger. Sauf la mâchoire : il mâchait, il mâchait…'],
      junrei: ['Le pèlerin', 'Le pèlerin fait le tour des trente-trois temples de Kannon. Celui-ci est le sixième : je l’ai peint pendant sa pause.'],
      gao: ['Gao, le shisa'],
    },
  },
  en: {
    nom: 'Sumi the painter',
    intro: ['Hello! I’m Sumi, a travelling painter. I journey with my easel, my black ink… and old Japanese newspapers.', 'I paint the people and animals I meet, right on the newspaper. Look!'],
    revoir: ['Oh, you again! We keep running into each other.'],
    nuit: ['At night, I paint by the light of my lantern. Black ink rather likes the dark!'],
    atelier: ['At my workshop, Inkami, it’s travellers’ faces we put on the newspaper: as a samurai or a geisha, with their name brushed in Japanese.'],
    question: 'Want a closer look at my painting?', oui: 'Yes', non: 'No',
    refus: ['Come back anytime. The ink isn’t going anywhere!'],
    sous: 'Black ink on Japanese newspapers · painted by Sumi', titreOffre: 'What if it were you?',
    offre: 'At Inkami, this painting is real: your face as a samurai or a geisha, in black ink, hand-collaged on real Japanese newspapers, with your name brushed in Japanese calligraphy.',
    bouton: 'Visit the Inkami shop', fermer: 'Close',
    tableaux: {
      shika: ['The Miyajima deer', 'This deer came to pose all by himself. He didn’t move a hair… then he tried to eat my newspaper!'],
      campeur: ['The Aogashima camper', 'The camper showed me the stars all night. I painted him in the morning, his eyes still full of sky.'],
      kokiriko: ['The kokiriko dancer', 'The kokiriko dancer never stands still: I had to paint as fast as he clacks his sasara!'],
      pon: ['Pon the tanuki'],
      samourai: ['The samurai of Himeji', 'The castle’s samurai posed without blinking. A true warrior… until a fly landed on his nose.'],
      voyageur: ['You, as a samurai'], voyageuse: ['You, in a golden kimono'],
      uzume: ['Uzume, the kagura dancer', 'Uzume danced to bring the sun out of its cave. I just brought her into my newspaper!'],
      chapu: ['Chapu the otter'],
      kimono: ['The stroller in a kimono', 'A stroller in a kimono was passing by the Golden Pavilion. I have no gold: so I said it all in black.'],
      tamago: ['The egg lady', 'The egg lady gave me an egg cooked in the hell’s blue water. In return: her portrait!'],
      bunbuku: ['Bunbuku the merchant'],
      kon: ['Kon, Inari’s fox', 'Here, foxes are the messengers of the god Inari. I painted Kon: they say he brings good luck.'],
      yamabushi: ['The yamabushi', 'The yamabushi has walked these mountains all his life. I tried to put all those trails into his eyes.'],
      miko: ['The miko of Udo', 'The shrine’s miko gave me a rabbit-shaped ema to write a wish on. To thank her: her portrait!'],
      fuwa: ['Fuwa the little dragon'],
      saya: ['Saya, the tree spirit', 'In this forest, they say every old cedar has its spirit. I glimpsed one… and painted it before it slipped away.'],
      rakuda: ['The camel of the dunes', 'The camel posed for an hour without moving. Except his jaw: he chewed, and chewed…'],
      junrei: ['The pilgrim', 'The pilgrim is walking the thirty-three temples of Kannon. This one is the sixth: I painted him during his break.'],
      gao: ['Gao the shisa'],
    },
  },
  ja: {
    nom: '絵かきの　スミ',
    intro: ['こんにちは！　わたしは　スミ、たびの　絵かきだよ。イーゼルと　墨と……　古い　日本の　新聞を　もって、たびを　して　いるんだ。', '出会った　人や　どうぶつを、新聞の　上に　そのまま　かくんだ。ほら、見て！'],
    revoir: ['おや、また　会ったね！　どこでも　会うなあ。'],
    nuit: ['夜は　ちょうちんの　あかりで　かくんだ。墨の　黒は、くらやみと　なかよしさ！'],
    atelier: ['わたしの　アトリエ「インカミ」では、たびびとの　顔を　新聞に　のせるんだ。サムライか　芸者の　すがたで、名前も　筆で　書くよ。'],
    question: 'わたしの　絵を　近くで　見るかい？', oui: 'はい', non: 'いいえ',
    refus: ['いつでも　おいで。墨は　にげないからね！'],
    sous: '墨と　日本の　新聞　·　スミ　作', titreOffre: 'つぎは　きみの　ばん？',
    offre: 'インカミでは、この　絵が　ほんものに　なります。あなたの　写真から、侍か　芸者の　すがたを　墨で　えがき、本物の　日本の　新聞に　手作業で　はりあわせます。お名前は　筆で　書き入れます。',
    bouton: 'インカミの　お店を　見る', fermer: 'とじる',
    tableaux: {
      shika: ['宮島の　シカ', 'この　シカは、じぶんから　モデルに　なって　くれた。じっと　して　いたのに……　さいごは　新聞を　たべようと　したんだ！'],
      campeur: ['青ヶ島の　キャンパー', 'キャンパーさんは　ひとばんじゅう　星を　見せて　くれた。朝に　なって　かいたんだ。目には　まだ　星空が　のこって　いたよ。'],
      kokiriko: ['こきりこの　おどり手', 'こきりこの　おどり手は　じっと　して　くれない。ささらの　音と　同じ　はやさで　筆を　うごかしたよ！'],
      pon: ['たぬきの　ポン'],
      samourai: ['姫路の　おさむらいさん', 'お城の　おさむらいさんは、まばたきも　しないで　モデルに　なって　くれた。さすが　武士……　はなに　ハエが　とまるまではね。'],
      voyageur: ['サムライの　きみ'], voyageuse: ['金の　着物の　きみ'],
      uzume: ['神楽の　ウズメ', 'ウズメは　おどって、お日さまを　岩戸から　出した。わたしは　ウズメを　新聞の　中に　入れたんだ！'],
      chapu: ['かわうその　チャプ'],
      kimono: ['着物の　おさんぽさん', '着物の　人が　金閣の　前を　あるいて　いた。金の　えのぐは　ないから、ぜんぶ　墨の　黒で　かいたよ。'],
      tamago: ['たまごの　おばさん', 'たまごの　おばさんが、じごくの　青い　お湯で　ゆでた　たまごを　くれた。おれいに　にがお絵を　かいたんだ！'],
      bunbuku: ['あきんどの　ブンブク'],
      kon: ['おいなりさんの　きつね　コン', 'ここでは、きつねは　おいなりさんの　おつかい。コンを　かいたよ。しあわせを　はこんで　くれるんだって。'],
      yamabushi: ['山伏さん', '山伏さんは　ずっと　この　山を　あるいて　きた。その　道を　ぜんぶ、目の　中に　かこうと　したんだ。'],
      miko: ['鵜戸の　みこさん', 'みこさんが、ねがいごとを　書く　うさぎの　絵馬を　くれた。おれいに　にがお絵を　かいたよ！'],
      fuwa: ['ちび竜の　フワ'],
      saya: ['木の　せい　サヤ', 'この　森では、古い　杉には　せいれいが　いるって　いうんだ。ちらっと　見えたから……　にげる　前に　かいたよ。'],
      rakuda: ['砂丘の　ラクダ', 'ラクダは　一時間、じっと　モデルに　なって　くれた。口だけは　もぐもぐ、もぐもぐ……'],
      junrei: ['じゅんれいさん', 'じゅんれいさんは　観音さまの　三十三の　お寺を　めぐって　いる。ここは　六ばんめ。ひとやすみの　あいだに　かいたんだ。'],
      gao: ['シーサーの　ガオ'],
    },
  },
};

/**
 * La fenêtre où l'on regarde un tableau : el (l'élément .fond-tableau de la page), T (les textes de la langue), id (l'image),
 * lieu et langue (pour le lien). Se résout quand on la ferme (le bouton, le voile, Échap, ou la touche d'action).
 */
export function montrerTableau(el, T, id, lieu, langue) {
  return new Promise((fin) => {
    const [titre] = T.tableaux[id] || [''];
    el.querySelector('.tableau-kana').textContent = TABLEAUX[id] || '';
    el.querySelector('.tableau-titre').textContent = titre;
    const img = el.querySelector('.tableau-image');
    img.src = image(id);
    img.alt = titre;
    el.querySelector('.tableau-sous').textContent = T.sous;
    el.querySelector('.tableau-offre b').textContent = T.titreOffre;
    el.querySelector('.tableau-offre span').textContent = T.offre;
    const lien = el.querySelector('.tableau-boutique');
    const adresse = lienBoutique(lieu, id, langue);
    lien.hidden = !adresse;
    lien.href = adresse || '#';
    lien.querySelector('span').textContent = T.bouton;
    const bouton = el.querySelector('.tableau-fermer');
    bouton.textContent = T.fermer;
    el.hidden = false;
    el.querySelector('.cadre-tableau').scrollTop = 0;
    const fermer = () => {
      el.hidden = true;
      removeEventListener('keydown', touche, true);
      bouton.onclick = el.onclick = null;
      fin();
    };
    // (Échap, ou la touche d'action : fermer ; Entrée sur le lien : la boutique, comme un clic)
    const touche = (e) => {
      if (e.code === 'Escape' || e.code === 'KeyE' || e.code === 'Space' || (e.code === 'Enter' && document.activeElement !== lien)) { e.preventDefault(); e.stopPropagation(); fermer(); }
    };
    addEventListener('keydown', touche, true);
    bouton.onclick = fermer;
    el.onclick = (e) => { if (e.target === e.currentTarget) fermer(); };
  });
}
