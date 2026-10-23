// ================================================================
//  La balade 3D : visiter un lieu du Japon avec un personnage vu de dos, comme dans un jeu vidéo, dans le
//  style des Pokémon (le rendu lisse de X et Y, boîte de dialogue, des gens à qui parler, des tampons à
//  collectionner dans un carnet). Un compagnon, choisi au début de chaque visite (Kon le renard d'Inari, Pon le
//  tanuki ou Chapu la loutre), suit le joueur et lui souffle des indices.
//  ZQSD ou WASD (les touches de la même place sur tous les claviers) ou les flèches : marcher ; Maj : courir ;
//  E, Espace ou Entrée : parler, lire (le bouton A) ; glisser : tourner la caméra ; molette : l'approcher ;
//  C : le carnet ; Échap : fermer. Sur téléphone, un joystick en bas à gauche et un bouton A en bas à droite.
//  On entend ses pas (selon le sol), le vent dans les arbres, la mer, les fumerolles (bruitage.js), et l'air du
//  lieu, composé pour la balade (musique.js) ; dans l'eau, on éclabousse et l'on ressort mouillé (effets.js) ;
//  à Itsukushima, des goélands tournent sur la baie et s'envolent quand on approche (mouettes.js) ; à Aogashima,
//  des grives, des lézards, des chats, des papillons et des milans (betes.js). Des bancs où s'asseoir ; un passant
//  fait tomber la nuit et revenir le jour (les étoiles, les lanternes allumées, l'air de nuit : lueurs.js).
//  Tous les tampons d'un lieu font gagner une pièce de tenue (tenues.js) : on l'essaie dans la garde-robe, vu de face.
//  Chaque lieu cache un secret (2026-10-23 : les corbeaux sacrés d'Itsukushima, la boîte au trésor d'Aogashima) : il
//  donne un koban, la monnaie de Bunbuku, le marchand ambulant (tresors.js), qui vend des objets précieux : la danse des
//  fêtes, la traînée sous les pas, les accessoires du compagnon, les feux d'artifice (feux.js), des tenues entières,
//  l'appareil photo (photo.js), trois compagnons secrets et le calendrier magique (calendrier.js : les saisons).
//  ?lieu=itsukushima|aogashima ; ?perso=garcon|fille ; ?compagnon=kon|pon|chapu ; ?langue=en|fr|ja ;
//  ?photo=heros|perso : une image fixe (captures) ; ?demo : une partie jouée image par image (vidéos) ;
//  ?ciel=parchemin : un essai du style (styles.js) ; ?flou=0 : sans le flou du lointain ; ?aa=0 : sans anticrénelage.
// ================================================================
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.min.js';
import { ateliers } from '../modeles3d.js';
import { MATIERES } from './textures.js';
import { creerStyle, matieresStyle, eclairerParLampes, LAMPES_GLSL, passeFinale, rafale, VENT_GLSL, VITESSE_RAFALE } from './styles.js';
import { creerHeros, creerPersonnage, creerCompagnon, COMPAGNONS, COMPAGNONS_SECRETS, creerDaim, creerMarchand } from './personnages.js';
import { creerPassant, avancerPassant, tourner, lisse, pointDuBanc, ASSIS } from './monde.js';
import { creerEtiquettes } from './etiquettes.js';
import { TEXTES, LANGUES, choisirLangue } from './textes.js';
import { creerDialogue } from './dialogue.js';
import { creerCarnet, dessinTampon, aLeTampon, ajouterTampon, lireTampons } from './carnet.js';
import { son } from './son.js';
import { creerBruitage } from './bruitage.js';
import { creerMouettes } from './mouettes.js';
import { creerBetes } from './betes.js';
import { creerMusique } from './musique.js';
import { creerEffets } from './effets.js';
import { creerLueurs } from './lueurs.js';
import { PIECES, PLACES, piece, recompense as recompenseDu, gagnee, lireTenue, ecrireTenue, nouvelles, marquerVue, icone } from './tenues.js';
import { SECRETS, ARTICLES, article, secretTrouve, trouverSecret, indiceVu, voirIndice, aAchete, acheter, koban, kobanTrouves, modeDev, kobanDev, remettreDev, dessinKoban, iconeArticle } from './tresors.js';
import { creerFeux } from './feux.js';
import { creerChutes, SAISONS } from './calendrier.js';
import { creerPhoto } from './photo.js';
import * as itsukushima from './itsukushima.js';
import * as aogashima from './aogashima.js';

// chaque lieu : { infos (noms, tampons, textes : sans rien construire), construire(ctx) }
const LIEUX = { itsukushima, aogashima };
const params = new URLSearchParams(location.search);
const PHOTO = params.get('photo');
const DEMO = params.has('demo');
const LIEU = LIEUX[params.get('lieu')] ? params.get('lieu') : 'itsukushima';
const MARCHE = 3.4, COURSE = 6.6; // m/s
const $ = (s) => document.querySelector(s);

let langue = LANGUES.includes(params.get('langue')) ? params.get('langue') : choisirLangue();
const t = (cle) => TEXTES[langue][cle] ?? TEXTES.en[cle];
const memoire = {
  lire(cle) { try { return localStorage.getItem(cle); } catch { return null; } },
  ecrire(cle, v) { try { localStorage.setItem(cle, v); } catch { /* navigation privée */ } },
};
let sorte = ['garcon', 'fille'].includes(params.get('perso')) ? params.get('perso') : memoire.lire('baladePerso');
if (!['garcon', 'fille'].includes(sorte)) sorte = null;
// le compagnon : on le choisit au départ de chaque visite (le dernier choisi est proposé d'abord) ; ?compagnon= l'impose
// (sans le choix : pour les essais)
const TOUS_COMPAGNONS = [...COMPAGNONS, ...COMPAGNONS_SECRETS];
/** Les compagnons qu'on peut choisir : les trois de départ, et les secrets qu'on a achetés au marchand. */
const compagnonsDispo = () => TOUS_COMPAGNONS.filter((e) => COMPAGNONS.includes(e) || aAchete(e));
const COMPAGNON_IMPOSE = TOUS_COMPAGNONS.includes(params.get('compagnon'));
let espece = COMPAGNON_IMPOSE ? params.get('compagnon') : memoire.lire('baladeCompagnon');
if (!COMPAGNON_IMPOSE && !compagnonsDispo().includes(espece)) espece = null;

const toile = $('#jeu');
// l'anticrénelage se fait dans l'image de la scène (styles.js, passeFinale) ; sur un écran tactile, au plus
// 1,6 pixel réel par pixel CSS (un téléphone a souvent 3 : l'image serait 3,5 fois plus lourde pour presque rien)
const rendu = new THREE.WebGLRenderer({ canvas: toile, antialias: false, powerPreference: 'high-performance' });
rendu.setPixelRatio(Math.min(devicePixelRatio, matchMedia('(pointer: coarse)').matches ? 1.6 : 2));
rendu.shadowMap.enabled = true;
rendu.shadowMap.type = THREE.PCFShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 8000);

// ---------------------------------------------------------------- Le monde
let M = null; // { style, ctx, mats, lieu, groupe, voyageurs, joueur, autre, compagnons, kon (le compagnon choisi), passants, daims, eau, ciel, soleil, finale, sauvage, cadre }
const etat = { x: 0, z: 0, y: 0, cap: 0, vitesse: 0, vx: 0, vz: 0, mode: 'depart' };
// le compagnon (nage : la loutre dans l'eau ; banc : sa place sur le banc où le voyageur est assis, à côté de lui)
const renard = { x: 0, z: 0, y: 0, cap: 0, vitesse: 0, nage: false, banc: null };
// la caméra voulue (le joueur la tourne) ; vue : celle qu'on a, rapprochée sous un toit ou devant un bâtiment
const cam = { lacet: 0, tangage: 0.24, distance: 6.4 };
const vue = { tangage: 0.24, distance: 6.4, leve: 0 };

function construire() {
  const style = creerStyle({ ciel: params.get('ciel') });
  const P = style.palette;
  const mats = matieresStyle(THREE, style, { anisotropie: Math.min(8, rendu.capabilities.getMaxAnisotropy()) });
  const groupe = new THREE.Group();
  // le décor s'efface en pointillés quand il cache le joueur (styles.js) ; les personnages, jamais
  const maillageDe = (corpsM, traitM, profondeur = null) => ({ geometrie }, ombre = true) => {
    lisser(geometrie);
    const g = new THREE.Group();
    const corps = new THREE.Mesh(geometrie, corpsM);
    corps.castShadow = ombre;
    corps.receiveShadow = true;
    if (profondeur) corps.customDepthMaterial = profondeur; // (l'ombre des feuillages bouge au vent avec eux)
    g.add(corps, new THREE.Mesh(geometrie, traitM));
    return g;
  };
  const maillage = maillageDe(mats.corps, mats.trait, mats.profondeur);
  // (sortesNuit : les couleurs du lieu qui s'allument ou s'illuminent la nuit, styles.js)
  const ctx = { THREE, atelier: ateliers(THREE, style.repeindre, style.matieres, LIEUX[LIEU].sortesNuit?.(P)), P, peinture: style.peinture, maillage };
  const ctxPerso = { ...ctx, maillage: maillageDe(mats.corpsPerso, mats.traitPerso) };
  // le joueur et son compagnon se mouillent dans l'eau : chacun sa matière (les passants restent secs)
  const mouilleJoueur = mats.persoMouille(P.peau), mouilleKon = mats.persoMouille();
  const ctxJoueur = { ...ctx, maillage: maillageDe(mouilleJoueur.materiel, mats.traitPerso) };
  const ctxKon = { ...ctx, maillage: maillageDe(mouilleKon.materiel, mats.traitPerso) };
  // (perso : pour ce que le lieu anime à la manière des personnages : les corbeaux)
  const lieu = LIEUX[LIEU].construire({ ...ctx, perso: ctxPerso });
  // le vent du lieu : d'où il pousse, sa force
  mats.vent.ventDir.value.set(...(lieu.vent?.dir || [0.6, 0.8])).normalize();
  mats.vent.ventForce.value = lieu.vent?.force ?? 1;
  // (decor : leurs corps, pour savoir ce qui cacherait le voyageur à une caméra posée devant lui : cadrerDeFace)
  const decor = [];
  for (const o of lieu.objets) {
    const m = maillage(o.fin, o.ombre);
    m.position.set(o.x, o.y, o.z);
    m.rotation.y = o.ry;
    groupe.add(m);
    decor.push(m.children[0]);
  }
  // les textes des plaques et des enseignes (le nom du tunnel…)
  if (lieu.etiquettes?.length && params.get('etiquettes') !== '0') groupe.add(creerEtiquettes(THREE, lieu.etiquettes, { anisotropie: Math.min(8, rendu.capabilities.getMaxAnisotropy()) }));
  const carte = carteDuSol(lieu, lieu.etendue.fin);
  mats.carte.carteSol.value = carte.texture;
  mats.carte.zoneSol.value.set(carte.x0, carte.z0, carte.pas, 1);
  mats.carte.tailleSol.value.set(carte.nx, carte.nz);
  // sous les arbres à feuilles caduques : où tombent les feuilles et les pétales (styles.js, solSaison)
  const canopee = carteCanopee(decor, lieu.etendue.fin);
  mats.canopee.canopee.value = canopee.texture;
  mats.canopee.zoneCanopee.value.set(canopee.x0, canopee.z0, canopee.pas, 1);
  mats.canopee.tailleCanopee.value.set(canopee.nx, canopee.nz);
  groupe.add(terrain(lieu, mats, lieu.etendue, 0, lieu.etendue.fin), terrain(lieu, mats, lieu.etendue.fin, 0.03, null, carte));
  const touffes = creerTouffes(lieu, carte, mats);
  groupe.add(touffes.groupe);
  const eau = lieu.eau ? creerEau(lieu, P, mats.lampes) : null;
  const ciel = creerCiel(P, lieu.soleil);
  const etoiles = creerEtoiles();
  ciel.add(etoiles);
  groupe.add(ciel);
  if (eau) groupe.add(eau);
  const vapeurs = creerVapeurs(lieu);
  if (vapeurs) groupe.add(vapeurs);
  const brume = lieu.brume || [70, 1500];
  scene.fog = new THREE.Fog(P.horizon, ...brume);
  mats.brume.couleur.value.set(P.horizon);
  [mats.brume.debut.value, mats.brume.fin.value] = brume;

  // la lumière : le ciel (bleuté) et le sol éclairent les ombres ; le soleil porte les ombres autour du joueur
  const L = style.lumiere;
  const hemi = new THREE.HemisphereLight(L.ciel, L.sol, L.ambiance);
  groupe.add(hemi);
  const soleil = new THREE.DirectionalLight(L.soleil, L.force);
  soleil.castShadow = true;
  // (sur un téléphone, une carte d'ombres moins fine : deux fois moins de travail ; les bords adoucis le cachent)
  soleil.shadow.mapSize.setScalar(tactile ? 1024 : 2048);
  Object.assign(soleil.shadow.camera, { left: -42, right: 42, top: 42, bottom: -42, near: 1, far: 300 });
  soleil.shadow.bias = -0.0005;
  soleil.shadow.normalBias = 0.05;
  soleil.shadow.radius = 2;
  groupe.add(soleil, soleil.target);

  // les personnages portent leur ombre mais n'en reçoivent pas : pas de taches sur les visages
  const sansOmbreRecue = (o) => o.traverse((m) => { m.receiveShadow = false; });
  const voyageurs = { garcon: creerHeros(ctxJoueur, 'garcon'), fille: creerHeros(ctxJoueur, 'fille') };
  // les trois compagnons (un seul se montre, sauf au moment de choisir) ; Pon se tambourine le ventre : on l'entend
  const tambour = () => M.bruitage.tambour({ pan: panDe(renard.x, renard.z), force: 1 / (1 + Math.max(0, Math.hypot(renard.x - camera.position.x, renard.z - camera.position.z) - 4) * 0.25) });
  const compagnons = Object.fromEntries(TOUS_COMPAGNONS.map((e) => [e, creerCompagnon(ctxKon, e, { tambour })]));
  for (const v of [voyageurs.garcon, voyageurs.fille, ...Object.values(compagnons)]) { groupe.add(v.objet); sansOmbreRecue(v.objet); }
  const passants = lieu.passants.map((p) => {
    const perso = creerPersonnage(ctxPerso, p.tenue);
    groupe.add(perso.objet);
    sansOmbreRecue(perso.objet);
    const etatP = creerPassant(p);
    etatP.y = p.assis != null ? p.assis - ASSIS : lieu.monde.hauteur(p.x, p.z);
    if (p.assis != null) perso.asseoir(true);
    return { ...p, perso, etat: etatP };
  });
  const daims = lieu.daims.map((d, i) => {
    const b = creerDaim(ctx, d.male, [0, 0.95, 0.5, 0.25, 0.7][i] ?? i * 0.37);
    b.objet.position.set(d.x, lieu.monde.hauteur(d.x, d.z), d.z);
    b.objet.rotation.y = d.cap;
    groupe.add(b.objet);
    lieu.monde.cercle(d.x, d.z, 0.7);
    // couche : 0 debout, 1 couché (la nuit) ; chacun se couche à sa vitesse
    return { ...d, b, couche: 0, vitesseCouche: 0.3 + 0.35 * ((i * 0.618) % 1) };
  });
  // les mouettes (Itsukushima) : des personnages aussi (pas d'ombre reçue)
  const mouettes = lieu.mouettes ? creerMouettes(ctxPerso, { ...lieu.mouettes, terrain: lieu.terrain, niveau: lieu.eau?.niveau || 0 }) : null;
  if (mouettes) { groupe.add(mouettes.groupe); sansOmbreRecue(mouettes.groupe); }
  // les bêtes (Aogashima)
  const betes = lieu.betes ? creerBetes(ctx, { monde: lieu.monde, ...lieu.betes }) : null;
  if (betes) groupe.add(betes.groupe);
  const effets = creerEffets(THREE);
  groupe.add(effets.groupe);
  // les halos et les flaques de lumière des lanternes, la nuit
  const lueurs = creerLueurs(THREE, lieu.lumieres || [], mats.lampes);
  groupe.add(lueurs.groupe);
  // ce que le lieu anime (son secret : les corbeaux, la porte de bambous, la boîte enterrée)
  for (const a of lieu.animes || []) groupe.add(a.objet);
  // Bunbuku, le marchand ambulant, s'il passe par ce lieu ; on lui parle (la boutique)
  let marchand = null;
  if (lieu.marchand) {
    const q = lieu.marchand;
    marchand = { ...q, y: lieu.monde.hauteur(q.x, q.z), perso: creerMarchand(ctxPerso), capVoulu: q.cap };
    marchand.perso.objet.position.set(q.x, marchand.y, q.z);
    marchand.perso.objet.rotation.y = q.cap;
    groupe.add(marchand.perso.objet);
    sansOmbreRecue(marchand.perso.objet);
    lieu.monde.cercle(q.x, q.z, 0.62);
    lieu.interactions.push({ id: 'marchand', x: q.x, z: q.z, y: marchand.y, rayon: 2.2, haut: 1.75, verbe: 'parler', action: () => parlerMarchand() });
  }
  // les feux d'artifice ; ce qui tombe du ciel selon la saison (le calendrier magique)
  const feux = creerFeux(THREE);
  groupe.add(feux.groupe);
  const chutes = creerChutes(THREE);
  groupe.add(chutes.groupe);
  scene.add(groupe);
  M = {
    carte, effets, lueurs, betes, mouilleJoueur, mouilleKon, feuillage: densiteFeuillage(lieu), bruitage: creerBruitage({ oiseaux: lieu.oiseaux || [], ambiances: lieu.ambiances || [], betes: lieu.betes?.chats?.length ? ['miaou', 'ronron'] : [], extras: lieu.sons || [] }), musique: creerMusique(lieu.id), focale: 800,
    marchand, feux, chutes, sac: new Set(), trace: null, saison: 'ete', flash: { v: 0, c: new THREE.Color() }, hemiBase: { intensite: 0, couleur: new THREE.Color() },
    style, ctx, mats, lieu, groupe, decor, voyageurs, compagnons, kon: null, cadre: null, passants, daims, mouettes, eau, ciel, soleil, hemi, etoiles, vapeurs, touffes, finale: passeFinale(THREE, style, { echantillons: params.get('aa') === '0' ? 0 : 4, flou: params.get('flou') !== '0' }), cible: null, sauvage: null, nuit: { v: 0, cible: 0, fin: null } };
  choisirVoyageur(sorte || 'garcon');
  choisirCompagnon(espece || 'kon');
  for (const s of ['garcon', 'fille']) habiller(s);
  // la saison du calendrier magique (s'il est à nous), gardée d'une visite à l'autre
  if (aAchete('calendrier')) changerSaison(memoire.lire('baladeSaison') || 'ete', { tout: true });
  M.hemiBase.intensite = hemi.intensity;
  M.hemiBase.couleur.copy(hemi.color);
  dimensionner();
}

/**
 * Les normales d'un modèle de l'atelier : chaque face a la sienne (des facettes nettes), sauf là où la forme
 * est ronde (cylindres, boules, troncs, visages) : la normale lissée de la pièce (l'attribut `contour`) si
 * elle s'écarte de moins de 42° de celle de la face. Les boîtes gardent leurs arêtes vives, les rondeurs
 * s'éclairent sans facettes, comme dans Pokémon X et Y.
 */
const lissees = new WeakSet();
function lisser(geo) {
  if (lissees.has(geo)) return;
  lissees.add(geo);
  const n = geo.attributes.normal?.array, c = geo.attributes.contour?.array;
  if (!n || !c) return;
  for (let i = 0; i < n.length; i += 3) {
    const l = Math.hypot(c[i], c[i + 1], c[i + 2]);
    if (l < 0.5) continue;
    if ((n[i] * c[i] + n[i + 1] * c[i + 1] + n[i + 2] * c[i + 2]) / l > 0.74) { n[i] = c[i] / l; n[i + 1] = c[i + 1] / l; n[i + 2] = c[i + 2] / l; }
  }
  geo.attributes.normal.needsUpdate = true;
}

/**
 * La carte du sol autour du jeu (l'étendue fine du lieu), au demi-mètre : la couleur (sRGB) et la matière
 * (alpha) que donne lieu.aspectSol. Les points du mètre sont tous calculés ; ceux d'entre eux seulement là
 * où leurs voisins diffèrent (les bords des chemins), les autres en sont copiés : quatre fois moins de calculs.
 * lire(i, j) : [couleur 0xrrggbb, matière] du point (i, j).
 */
function carteDuSol(lieu, f, pas = 0.5) {
  const nx = Math.round((f.x1 - f.x0) / pas) + 1, nz = Math.round((f.z1 - f.z0) / pas) + 1;
  const d = new Uint8Array(nx * nz * 4);
  const calculer = (i, j) => {
    const x = f.x0 + i * pas, z = f.z0 + j * pas;
    const [teinte, m] = lieu.aspectSol(x, z, lieu.terrain(x, z));
    const v = parseInt(teinte.slice(1), 16), k = (j * nx + i) * 4;
    d[k] = v >> 16; d[k + 1] = (v >> 8) & 255; d[k + 2] = v & 255; d[k + 3] = m;
  };
  for (let j = 0; j < nz; j += 2) for (let i = 0; i < nx; i += 2) calculer(i, j);
  const pareils = (a, b) => d[a] === d[b] && d[a + 1] === d[b + 1] && d[a + 2] === d[b + 2] && d[a + 3] === d[b + 3];
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      if (i % 2 === 0 && j % 2 === 0) continue;
      const i0 = i - (i % 2), j0 = j - (j % 2), i1 = i % 2 ? i0 + 2 : i0, j1 = j % 2 ? j0 + 2 : j0;
      if (i1 >= nx || j1 >= nz) { calculer(i, j); continue; }
      const a = (j0 * nx + i0) * 4;
      if (pareils(a, (j0 * nx + i1) * 4) && pareils(a, (j1 * nx + i0) * 4) && pareils(a, (j1 * nx + i1) * 4)) d.copyWithin((j * nx + i) * 4, a, a + 4);
      else calculer(i, j);
    }
  }
  const texture = new THREE.DataTexture(d, nx, nz, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  const lire = (i, j) => { const k = (j * nx + i) * 4; return [(d[k] << 16) | (d[k + 1] << 8) | d[k + 2], d[k + 3]]; };
  return { texture, nx, nz, x0: f.x0, z0: f.z0, pas, lire };
}

/**
 * La canopée des arbres à feuilles caduques (sortes 1 à 3 et 21 à 23 des modèles), vue d'en haut, au mètre, sur
 * l'étendue fine du lieu : leur densité (r), la part d'arbres qui fleurissent en cerisiers au printemps (g : comme
 * feuillageSaison, styles.js, selon la graine de l'arbre) et la teinte de leur automne (b : 0 jaune, 0,5 orangé,
 * 1 rouge, les érables). Floutée sur deux mètres : les feuilles tombent un peu autour de l'arbre.
 */
function carteCanopee(decor, f, pas = 1) {
  const nx = Math.round((f.x1 - f.x0) / pas) + 1, nz = Math.round((f.z1 - f.z0) / pas) + 1, n = nx * nz;
  let dens = new Float32Array(n), rose = new Float32Array(n), teinte = new Float32Array(n);
  const v = new THREE.Vector3(), w = new THREE.Vector3();
  for (const m of decor) {
    const pos = m.geometry.attributes.position, sa = m.geometry.attributes.saison;
    if (!sa) continue;
    m.updateWorldMatrix(true, false);
    for (let i = 0; i + 2 < pos.count; i += 3) {
      let k = Math.round(sa.getX(i));
      if (k > 20) k -= 20;
      if (k < 1 || k > 3) continue;
      v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).add(w.set(pos.getX(i + 1), pos.getY(i + 1), pos.getZ(i + 1)))
        .add(w.set(pos.getX(i + 2), pos.getY(i + 2), pos.getZ(i + 2))).multiplyScalar(1 / 3).applyMatrix4(m.matrixWorld);
      const ci = Math.round((v.x - f.x0) / pas), cj = Math.round((v.z - f.z0) / pas);
      if (ci < 0 || cj < 0 || ci >= nx || cj >= nz) continue;
      const g = sa.getY(i), c = cj * nx + ci;
      dens[c] += 1;
      rose[c] += k === 3 || (k === 1 && g < 0.5) ? 1 : 0;
      teinte[c] += k === 2 ? 1 : k === 3 ? 0.5 : g < 0.33 ? 0 : g < 0.66 ? 0.5 : 1;
    }
  }
  // (deux flous en croix de rayon 2 : les feuilles se répandent autour du houppier)
  const flou = (a) => {
    const b = new Float32Array(n), c = new Float32Array(n);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { let t = 0; for (let d = -2; d <= 2; d++) { const ii = i + d; if (ii >= 0 && ii < nx) t += a[j * nx + ii]; } b[j * nx + i] = t / 5; }
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { let t = 0; for (let d = -2; d <= 2; d++) { const jj = j + d; if (jj >= 0 && jj < nz) t += b[jj * nx + i]; } c[j * nx + i] = t / 5; }
    return c;
  };
  for (let fois = 0; fois < 2; fois++) { dens = flou(dens); rose = flou(rose); teinte = flou(teinte); }
  const d = new Uint8Array(n * 4);
  for (let c = 0; c < n; c++) {
    const q = dens[c];
    d[c * 4] = Math.round(Math.min(1, Math.max(0, (q - 0.4) / 6)) * 255);
    d[c * 4 + 1] = q > 1e-3 ? Math.round((rose[c] / q) * 255) : 0;
    d[c * 4 + 2] = q > 1e-3 ? Math.round((teinte[c] / q) * 255) : 0;
    d[c * 4 + 3] = 255;
  }
  const texture = new THREE.DataTexture(d, nx, nz, THREE.RGBAFormat);
  texture.minFilter = texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return { texture, nx, nz, x0: f.x0, z0: f.z0, pas };
}

/**
 * Des touffes d'herbe en 3D, comme dans Pokémon X et Y : sept brins, sombres au pied, clairs au bout, de la
 * couleur du sol où elles poussent (l'herbe et le sous-bois de la carte du sol), jamais sous un bâtiment, un
 * plancher, un mur ou un rocher. Elles ondulent au vent, et rapetissent jusqu'à disparaître au-delà de 30 m.
 * Par carrés de 24 m (chacun une forme instanciée) : ceux qui sont hors de l'écran ne se dessinent pas.
 */
function creerTouffes(lieu, carte, mats) {
  const monde = lieu.monde;
  // une touffe : sept brins (un triangle chacun) en éventail, penchés vers l'extérieur
  const pos = [], col = [];
  for (let b = 0; b < 7; b++) {
    const a = (b / 7) * Math.PI * 2 + 0.4 * Math.sin(b * 7.1), r = 0.04 + 0.04 * (b % 2), h = 0.2 + 0.14 * ((b * 3) % 7) / 6;
    const cx = Math.cos(a), cz = Math.sin(a), px = -cz * 0.05, pz = cx * 0.05;
    pos.push(cx * r * 0.4 - px, 0, cz * r * 0.4 - pz, cx * r * 0.4 + px, 0, cz * r * 0.4 + pz, cx * (r + 0.09), h, cz * (r + 0.09));
    col.push(0.62, 0.62, 0.62, 0.62, 0.62, 0.62, 1.2, 1.22, 1.08);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  const temps = { value: 0 }, oeil = { value: new THREE.Vector3() };
  const mat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: mats.sol.gradientMap, side: THREE.DoubleSide });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { temps, oeil }, mats.vent);
    eclairerParLampes(sh, mats.lampes);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>\nuniform float temps;\nuniform vec3 oeil;${VENT_GLSL}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec3 pied = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        transformed *= 1.0 - smoothstep(22.0, 32.0, distance(pied, oeil));
        // le vent : la rafale (la même que dans les arbres) couche les brins dans son sens, ils ondulent ;
        // sens : la direction du vent dans le repère de la touffe (tournée et agrandie)
        float f = forceVent(pied.xz), b = 0.6 + 0.4 * sin(ventTemps * 2.3 + pied.x * 0.55 + pied.z * 0.35);
        vec3 sens = vec3(ventDir.x, 0.0, ventDir.y) * mat3(instanceMatrix);
        sens /= max(dot(sens, sens), 1e-4);
        transformed += (sens * 0.6 * b + vec3(0.1, 0.0, 0.07) * sin(ventTemps * 7.0 + pied.x * 3.0 + pied.z * 2.0)) * f * position.y;`);
  };
  mat.customProgramCacheKey = () => 'touffes';
  // où elles poussent : un texel de la carte sur cinq environ, d'herbe ou de sous-bois, loin des obstacles
  const libre = (x, z) => {
    const y = lieu.terrain(x, z);
    for (const [cx, cz, r] of monde.cercles) if ((x - cx) ** 2 + (z - cz) ** 2 < (r + 0.2) ** 2) return false;
    for (const [x0, z0, x1, z1, r] of monde.murs) {
      const dx = x1 - x0, dz = z1 - z0, l = dx * dx + dz * dz || 1, f = Math.min(1, Math.max(0, ((x - x0) * dx + (z - z0) * dz) / l));
      if (Math.hypot(x - x0 - f * dx, z - z0 - f * dz) < r + 0.2) return false;
    }
    for (const s of monde.surfaces) if (x >= s.x0 - 0.2 && x <= s.x1 + 0.2 && z >= s.z0 - 0.2 && z <= s.z1 + 0.2 && s.h > y - 0.5) return false;
    for (const [x0, x1, z0, z1, bas] of monde.blocs) if (x >= x0 && x <= x1 && z >= z0 && z <= z1 && bas < y + 0.5) return false;
    return true;
  };
  const hasard = (i, j, k) => { const v = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453; return v - Math.floor(v); };
  const CARRE = 24, cases = new Map(), c = new THREE.Color();
  for (let j = 0; j < carte.nz; j++) {
    for (let i = 0; i < carte.nx; i++) {
      const [teinte, m] = carte.lire(i, j);
      if ((m !== MATIERES.herbe && m !== MATIERES.sousBois) || hasard(i, j, 1) > (m === MATIERES.herbe ? 0.2 : 0.14)) continue;
      const x = carte.x0 + (i + hasard(i, j, 2) - 0.5) * carte.pas, z = carte.z0 + (j + hasard(i, j, 3) - 0.5) * carte.pas;
      // pas tout près de la bordure d'une autre matière (un chemin) : les touffes restent dans l'herbe
      const voisin = (di, dj) => carte.lire(Math.min(carte.nx - 1, Math.max(0, i + di)), Math.min(carte.nz - 1, Math.max(0, j + dj)))[1] === m;
      if (!voisin(1, 0) || !voisin(-1, 0) || !voisin(0, 1) || !voisin(0, -1) || !libre(x, z)) continue;
      const cle = `${Math.floor(x / CARRE)},${Math.floor(z / CARRE)}`;
      if (!cases.has(cle)) cases.set(cle, []);
      c.setHex(teinte);
      const k = 0.9 + hasard(i, j, 4) * 0.2;
      cases.get(cle).push([x, lieu.terrain(x, z) - 0.02, z, hasard(i, j, 5) * 6.3, 0.75 + hasard(i, j, 6) * 0.6, c.r * k, c.g * k, c.b * k]);
    }
  }
  const groupe = new THREE.Group();
  const o = new THREE.Object3D();
  let n = 0;
  for (const liste of cases.values()) {
    const im = new THREE.InstancedMesh(geo, mat, liste.length);
    liste.forEach(([x, y, z, ry, e, r, g, b], k) => {
      o.position.set(x, y, z);
      o.rotation.set(0, ry, 0);
      o.scale.setScalar(e);
      o.updateMatrix();
      im.setMatrixAt(k, o.matrix);
      im.setColorAt(k, c.setRGB(r, g, b));
    });
    im.receiveShadow = true;
    im.computeBoundingSphere();
    groupe.add(im);
    n += liste.length;
  }
  return {
    groupe, n,
    /** Chaque image : le vent, et les carrés loin de l'œil cachés. */
    majTouffes(t, cam) {
      temps.value = t;
      oeil.value.copy(cam.position);
      for (const im of groupe.children) im.visible = im.boundingSphere.center.distanceTo(cam.position) < 32 + im.boundingSphere.radius;
    },
  };
}

/**
 * Les feuillages autour d'un point (0 à 1), pour le bruit des feuilles : les triangles des feuillages des
 * modèles (l'attribut `saison` : feuillus, érables, cerisiers, conifères) comptés par carrés de 4 m sur
 * l'étendue fine, pesés jusqu'à une quinzaine de mètres ; calculé une fois. Un arbre tout près : environ 0,35 ;
 * la forêt : 1.
 */
function densiteFeuillage(lieu) {
  const e = lieu.etendue.fin, pas = 4, nx = Math.ceil((e.x1 - e.x0) / pas) + 1, nz = Math.ceil((e.z1 - e.z0) / pas) + 1;
  const n = new Float32Array(nx * nz), d = new Float32Array(nx * nz);
  for (const o of lieu.objets) {
    const p = o.fin.geometrie.attributes.position.array, sa = o.fin.geometrie.attributes.saison?.array;
    if (!sa) continue;
    const c = Math.cos(o.ry), si = Math.sin(o.ry);
    for (let k = 0; k < p.length; k += 9) {
      const sorte = Math.round(sa[k]);
      if (sorte < 1 || sorte > 4) continue;
      const i = Math.floor((o.x + p[k] * c + p[k + 2] * si - e.x0) / pas), j = Math.floor((o.z - p[k] * si + p[k + 2] * c - e.z0) / pas);
      if (i >= 0 && j >= 0 && i < nx && j < nz) n[j * nx + i]++;
    }
  }
  const R = 4;
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      let s = 0;
      for (let dj = -R; dj <= R; dj++) {
        for (let di = -R; di <= R; di++) {
          const a = i + di, b = j + dj;
          if (a >= 0 && b >= 0 && a < nx && b < nz) s += n[b * nx + a] / (1 + ((di * di + dj * dj) * pas * pas) / 36);
        }
      }
      d[j * nx + i] = 1 - Math.exp(-s / 900);
    }
  }
  return (x, z) => {
    const u = (x - e.x0) / pas - 0.5, v = (z - e.z0) / pas - 0.5, i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j;
    const lire = (a, b) => (a >= 0 && b >= 0 && a < nx && b < nz ? d[b * nx + a] : 0);
    return (lire(i, j) * (1 - fu) + lire(i + 1, j) * fu) * (1 - fv) + (lire(i, j + 1) * (1 - fu) + lire(i + 1, j + 1) * fu) * fv;
  };
}

/** Le voyageur qu'on joue ; l'autre attend caché (il ne sert qu'au choix du départ et aux captures). */
function choisirVoyageur(s) {
  M.joueur = M.voyageurs[s];
  M.autre = M.voyageurs[s === 'garcon' ? 'fille' : 'garcon'];
  M.joueur.objet.visible = true;
  M.autre.objet.visible = false;
}
/** Le nombre de tampons d'un lieu (pour savoir si sa récompense est gagnée). */
const totalTampons = (id) => LIEUX[id]?.infos.tampons.length || 0;
/**
 * Le voyageur s porte sa tenue (tenues.js : celle qu'on lui a choisie, parmi les pièces gagnées) ; pour celui qu'on
 * joue, ce qu'il laisse sous ses pas et ce que porte son compagnon.
 */
function habiller(s) {
  const tenue = lireTenue(s, totalTampons);
  for (const place of PLACES) M.voyageurs[s].porter(place, tenue[place]);
  if (s === (sorte || 'garcon')) {
    M.trace = tenue.pas !== 'trace-aucune' ? tenue.pas.slice(6) : null;
    for (const c of Object.values(M.compagnons)) c.porter(tenue.compagnon);
  }
}
/** Le compagnon qui suit le joueur (les autres cachés). */
function choisirCompagnon(e) {
  espece = e;
  for (const [nom, c] of Object.entries(M.compagnons)) c.objet.visible = nom === e;
  M.kon = M.compagnons[e];
}

/**
 * Le sol : une grille de hauteurs (le terrain du lieu), aux couleurs du lieu et avec ses matières (styles.js).
 * Une grille fine autour du jeu, posée sur la grande ; la grande a un trou dessous (trou : l'étendue de la
 * fine), sinon, dans les creux (un cratère, un escalier taillé dans la pente), ses grandes facettes la percent.
 * carte : la carte du sol (carteDuSol), d'où la grille fine prend ses couleurs sans les recalculer ; la grille
 * fine laisse aussi les trous que le lieu demande (lieu.trouSol(x0, z0, x1, z1) : vrai pour sauter cette case).
 */
function terrain(lieu, mats, e, leve = 0, trou = null, carte = null) {
  const nx = Math.round((e.x1 - e.x0) / e.pas), nz = Math.round((e.z1 - e.z0) / e.pas);
  const pos = new Float32Array((nx + 1) * (nz + 1) * 3), col = new Float32Array(pos.length), motif = new Float32Array(pos.length / 3);
  const c = new THREE.Color();
  for (let j = 0, k = 0; j <= nz; j++) {
    for (let i = 0; i <= nx; i++, k += 3) {
      const x = e.x0 + i * e.pas, z = e.z0 + j * e.pas, h = lieu.terrain(x, z);
      pos[k] = x; pos[k + 1] = h + leve; pos[k + 2] = z;
      const sur = carte && Math.round((x - carte.x0) / carte.pas);
      const [teinte, m] = carte ? carte.lire(sur, Math.round((z - carte.z0) / carte.pas)) : lieu.aspectSol(x, z, h);
      c.set(teinte);
      const n = 1 + 0.04 * (Math.sin(x * 1.3 + z * 0.7) * Math.sin(z * 1.1 - x * 0.4));
      col[k] = c.r * n; col[k + 1] = c.g * n; col[k + 2] = c.b * n;
      motif[k / 3] = m;
    }
  }
  const index = [];
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i, b = a + 1, d = a + nx + 1, f = d + 1;
      const x0 = e.x0 + i * e.pas, z0 = e.z0 + j * e.pas, x1 = x0 + e.pas, z1 = z0 + e.pas;
      if (trou && x0 >= trou.x0 && x1 <= trou.x1 && z0 >= trou.z0 && z1 <= trou.z1) continue;
      // les trous de la grille fine que le lieu demande (l'entrée d'un tunnel : le sol y monterait devant)
      if (carte && lieu.trouSol?.(x0, z0, x1, z1)) continue;
      index.push(a, d, b, b, d, f);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('motif', new THREE.BufferAttribute(motif, 1));
  g.setIndex(index);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mats.sol);
  m.receiveShadow = true;
  return m;
}

/**
 * L'eau : claire sur l'estran (on voit le fond), plus bleue au large ; écume au bord ; des lignes d'eau
 * parallèles à la rive (comme la houle de la carte) et des éclats de soleil, en gros pixels.
 * lieu.eau : { x0, x1, z0, z1, niveau }.
 */
function creerEau(lieu, P, lampes) {
  const e = lieu.eau, pas = 3, niveau = e.niveau || 0;
  const nx = Math.round((e.x1 - e.x0) / pas), nz = Math.round((e.z1 - e.z0) / pas);
  const g = new THREE.PlaneGeometry(e.x1 - e.x0, e.z1 - e.z0, Math.min(nx, 220), Math.min(nz, 260));
  g.rotateX(-Math.PI / 2);
  g.translate((e.x0 + e.x1) / 2, niveau, (e.z0 + e.z1) / 2);
  const p = g.attributes.position;
  const prof = new Float32Array(p.count);
  for (let i = 0; i < p.count; i++) prof[i] = Math.max(0, niveau - lieu.terrain(p.getX(i), p.getZ(i)));
  g.setAttribute('profondeur', new THREE.BufferAttribute(prof, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      clair: { value: new THREE.Color(P.eauClaire) }, profond: { value: new THREE.Color(P.eauProfonde) },
      ecume: { value: new THREE.Color(P.ecume) }, temps: { value: 0 }, rive: { value: lieu.rive ?? 0 },
      centre: { value: new THREE.Vector3(...(lieu.centreRive || [0, 0]), lieu.centreRive ? 1 : 0) }, nuit: { value: 0 },
    }]),
    vertexShader: `
      attribute float profondeur;
      varying float vProf;
      varying vec3 vMonde;
      varying float vLoin;
      #include <fog_pars_vertex>
      void main() {
        vProf = profondeur;
        vec4 monde = modelMatrix * vec4(position, 1.0);
        vMonde = monde.xyz;
        vec4 mvPosition = viewMatrix * monde;
        vLoin = -mvPosition.z;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      uniform vec3 clair, profond, ecume, centre;
      uniform float temps, rive, nuit;
      varying float vProf;
      varying vec3 vMonde;
      varying float vLoin;
      #include <fog_pars_fragment>
      ${LAMPES_GLSL}
      float hasard2(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      void main() {
        float t = smoothstep(0.05, 1.6, vProf);
        vec3 c = mix(clair, profond, t);
        vec3 lampe = c * lumiereLampes(vMonde, vec3(0.0, 1.0, 0.0));
        float a = mix(0.45, 0.9, smoothstep(0.0, 0.45, vProf));
        // des lignes d'eau parallèles à la rive (ou en anneaux autour d'une île), qui avancent doucement
        float d = centre.z > 0.5
          ? length(vMonde.xz - centre.xy) * 0.42 + temps * 0.12 + 0.35 * sin(atan(vMonde.x - centre.x, vMonde.z - centre.y) * 9.0)
          : (rive - vMonde.z) * 0.42 - temps * 0.12 + 0.35 * sin(vMonde.x * 0.06);
        float l = abs(fract(d) - 0.5);
        c = mix(c, profond * 0.85, (1.0 - smoothstep(0.035, 0.07, l)) * 0.4 * smoothstep(0.06, 0.25, vProf));
        // des éclats de soleil : quelques cases de 25 cm qui s'allument et s'éteignent, de près
        vec2 k = floor(vMonde.xz * 4.0);
        float e = hasard2(k + floor(temps * 1.5 + hasard2(k) * 7.0));
        c = mix(c, ecume, step(0.992, e) * (1.0 - smoothstep(10.0, 40.0, vLoin)) * smoothstep(0.03, 0.12, vProf));
        float bord = 1.0 - smoothstep(0.0, 0.07 + 0.03 * sin(temps * 1.6 + vMonde.x * 0.4), vProf);
        c = mix(c, ecume, bord * 0.85);
        a = max(a, bord * 0.9);
        c *= mix(vec3(1.0), vec3(0.22, 0.27, 0.45), nuit);
        // (les lampes de la rive, la lanterne de la barque : leur lumière sur l'eau)
        c += lampe * 0.8;
        gl_FragColor = vec4(c, a);
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
  // (les mêmes uniformes que le décor : UniformsUtils.merge les aurait copiés)
  Object.assign(mat.uniforms, lampes);
  const m = new THREE.Mesh(g, mat);
  m.renderOrder = 1;
  return m;
}

/**
 * La Voie lactée : le grand cercle perpendiculaire à cet axe. Il touche l'horizon au nord-nord-est (et au
 * sud-sud-ouest) et passe près du zénith : vue vers le nord, elle se lève de l'horizon comme sur les photos.
 */
const VOIE_LACTEE = new THREE.Vector3(0.95, 0.15, 0.27).normalize();

/** Le ciel : un dégradé de l'horizon au zénith, et la lueur du soleil ; la nuit, la lueur de la Voie lactée. */
function creerCiel(P, soleil) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      haut: { value: new THREE.Color(P.cielHaut) }, horizon: { value: new THREE.Color(P.horizon) },
      dirSoleil: { value: new THREE.Vector3(...soleil).normalize() }, nuit: { value: 0 }, voie: { value: VOIE_LACTEE },
    },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = normalize((modelMatrix * vec4(position, 1.0)).xyz - cameraPosition);
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 haut, horizon, dirSoleil, voie;
      uniform float nuit;
      varying vec3 vDir;
      float hasard3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      float bruit3(vec3 p) {
        vec3 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hasard3(i), hasard3(i + vec3(1, 0, 0)), f.x), mix(hasard3(i + vec3(0, 1, 0)), hasard3(i + vec3(1, 1, 0)), f.x), f.y),
          mix(mix(hasard3(i + vec3(0, 0, 1)), hasard3(i + vec3(1, 0, 1)), f.x), mix(hasard3(i + vec3(0, 1, 1)), hasard3(i + vec3(1, 1, 1)), f.x), f.y), f.z);
      }
      void main() {
        vec3 d = normalize(vDir);
        vec3 c = mix(horizon, haut, pow(clamp(d.y, 0.0, 1.0), 0.5));
        float s = max(dot(d, dirSoleil), 0.0);
        c += vec3(1.0, 0.95, 0.85) * (pow(s, 900.0) * 1.5 + pow(s, 14.0) * 0.12) * (1.0 - nuit);
        // la Voie lactée : une bande laiteuse en nuages d'étoiles (du bruit à trois échelles), plus claire en
        // son milieu, coupée d'une traînée sombre (les poussières), au-dessus de l'horizon
        if (nuit > 0.01) {
          float v = dot(d, voie);
          if (abs(v) < 0.6) {
            float nuage = 0.35 + 0.65 * (bruit3(d * 7.0) * 0.55 + bruit3(d * 19.0) * 0.3 + bruit3(d * 47.0) * 0.15);
            float poussiere = 1.0 - 0.6 * exp(-pow(v - 0.03 - 0.05 * (bruit3(d * 5.0) - 0.5), 2.0) * 1400.0) * smoothstep(0.35, 0.6, bruit3(d * 11.0 + 3.0));
            float bande = (exp(-v * v * 45.0) * 0.3 + exp(-v * v * 320.0) * 0.26) * nuage * nuage * poussiere;
            c += mix(vec3(0.6, 0.64, 0.86), vec3(0.95, 0.88, 0.8), smoothstep(0.5, 0.9, nuage)) * nuit * smoothstep(0.0, 0.12, d.y) * bande;
          }
        }
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(5000, 32, 16), mat);
  m.renderOrder = -10;
  m.frustumCulled = false;
  return m;
}

/** Un tirage au hasard toujours le même (mulberry32) : le ciel étoilé ne change pas d'une visite à l'autre. */
function tirage(graine) {
  return () => {
    graine = (graine + 0x6d2b79f5) | 0;
    let t = Math.imul(graine ^ (graine >>> 15), 1 | graine);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Les étoiles (la nuit seulement : jeu.nuit) : des points d'un ou deux pixels sur la voûte, et la Voie
 * lactée, un ruban plus dense qui traverse le ciel. Enfant du ciel : elles suivent la caméra.
 */
function creerEtoiles() {
  const hasard = tirage(1785);
  const pos = [], prm = [];
  const n = VOIE_LACTEE;
  const d = new THREE.Vector3();
  let champ = 0, lacte = 0;
  while (champ < 1800 || lacte < 2600) {
    d.set(hasard() * 2 - 1, hasard() * 2 - 1, hasard() * 2 - 1);
    if (d.lengthSq() > 1 || d.lengthSq() < 0.01) continue;
    d.normalize();
    const dansLaVoie = lacte < 2600 && (champ >= 1800 || hasard() < 0.6);
    if (dansLaVoie) d.addScaledVector(n, -d.dot(n) * (1 - 0.22 * hasard())).normalize();
    if (d.y < -0.02) continue;
    if (dansLaVoie) lacte++; else champ++;
    pos.push(d.x * 4000, d.y * 4000, d.z * 4000);
    prm.push(hasard(), dansLaVoie ? (hasard() < 0.85 ? 1.5 : 2.3) : (hasard() < 0.7 ? 1.7 : 2.9));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('prm', new THREE.Float32BufferAttribute(prm, 2));
  const mat = new THREE.ShaderMaterial({
    depthWrite: false, fog: false, transparent: true, blending: THREE.AdditiveBlending,
    uniforms: { nuit: { value: 0 }, temps: { value: 0 }, echelle: { value: 1 } },
    vertexShader: `
      attribute vec2 prm;
      uniform float temps, echelle;
      varying float vEclat;
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = prm.y * echelle;
        vEclat = (prm.y > 1.5 ? 1.0 : 0.62) * (0.75 + 0.25 * sin(temps * (2.0 + prm.x * 3.0) + prm.x * 60.0));
      }`,
    fragmentShader: `
      uniform float nuit;
      varying float vEclat;
      void main() {
        if (nuit < 0.05) discard;
        // un point rond, plus vif au centre (ajouté à la lumière du ciel)
        float r = length(gl_PointCoord - 0.5);
        if (r > 0.5) discard;
        gl_FragColor = vec4(vec3(1.0, 0.97, 0.88) * vEclat * smoothstep(0.35, 1.0, nuit) * (1.0 - smoothstep(0.15, 0.5, r)), 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const points = new THREE.Points(g, mat);
  points.frustumCulled = false;
  points.renderOrder = -9;
  return points;
}

/**
 * La vapeur (les fumerolles, les marmites, le sauna) : des bouffées blanches aux bords doux qui montent,
 * grossissent et s'effacent. lieu.vapeurs : [{ x, z, y (sinon
 * le sol), n (bouffées), haut (m), large (m), taille (m) }].
 */
function creerVapeurs(lieu) {
  const pos = [], prm = [];
  for (const s of lieu.vapeurs || []) {
    const y = s.y ?? lieu.monde.hauteur(s.x, s.z);
    const n = s.n || 12;
    for (let i = 0; i < n; i++) {
      pos.push(s.x, y, s.z);
      prm.push(i / n + 0.37 * Math.sin(i * 12.9898 + s.x * 3.1), s.haut || 3, s.large || 0.6, s.taille || 1);
    }
  }
  if (!pos.length) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('prm', new THREE.Float32BufferAttribute(prm, 4));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { temps: { value: 0 }, hauteurEcran: { value: 300 }, couleur: { value: new THREE.Color('#ffffff') }, ombre: { value: new THREE.Color('#cbd5dc') }, nuit: { value: 0 } },
    vertexShader: `
      attribute vec4 prm;
      uniform float temps, hauteurEcran;
      varying float vAlpha;
      void main() {
        float age = fract(temps * 0.2 + prm.x);
        float g = prm.x * 43.7;
        vec3 p = position + vec3(sin(g + temps * 0.9) * prm.z * age + age * age * 0.7, age * prm.y, cos(g * 1.3 + temps * 0.7) * prm.z * age);
        vec4 mv = viewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = min(prm.w * mix(0.3, 1.4, sqrt(age)) * projectionMatrix[1][1] * hauteurEcran * 0.5 / max(-mv.z, 0.1), hauteurEcran * 0.3);
        vAlpha = smoothstep(0.0, 0.12, age) * (1.0 - smoothstep(0.45, 1.0, age)) * 0.85 * smoothstep(2.0, 4.5, -mv.z);
      }`,
    fragmentShader: `
      uniform vec3 couleur, ombre;
      uniform float nuit;
      varying float vAlpha;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float r = length(c);
        if (r > 0.5) discard;
        vec3 v = mix(couleur, ombre, smoothstep(-0.1, 0.4, c.y));
        gl_FragColor = vec4(v * mix(1.0, 0.35, nuit), vAlpha * 0.75 * (1.0 - smoothstep(0.15, 0.5, r)));
        #include <colorspace_fragment>
      }`,
  });
  const points = new THREE.Points(g, mat);
  points.frustumCulled = false;
  return points;
}

/**
 * La nuit (0 : le jour, 1 : la nuit) : la lumière du ciel et du soleil passent au bleu de la lune, le ciel
 * au bleu nuit, la brume et l'eau s'assombrissent, les étoiles s'allument.
 */
const NUIT = { ciel: '#3c4c8c', sol: '#2a2838', ambiance: 0.75, lune: '#9fb2ff', force: 0.45, haut: '#0b1130', horizon: '#223061' };
const couleursNuit = { a: new THREE.Color(), b: new THREE.Color() };
function appliquerNuit(v) {
  const L = M.style.lumiere, P = M.style.palette, { a, b } = couleursNuit;
  const melange = (cible, jour, nuit) => cible.copy(a.set(jour)).lerp(b.set(nuit), v);
  M.hemi.intensity = L.ambiance + (NUIT.ambiance - L.ambiance) * v;
  melange(M.hemi.color, L.ciel, NUIT.ciel);
  M.hemiBase.intensite = M.hemi.intensity;
  M.hemiBase.couleur.copy(M.hemi.color);
  melange(M.hemi.groundColor, L.sol, NUIT.sol);
  M.soleil.intensity = L.force + (NUIT.force - L.force) * v;
  melange(M.soleil.color, L.soleil, NUIT.lune);
  const u = M.ciel.material.uniforms;
  melange(u.haut.value, P.cielHaut, NUIT.haut);
  melange(u.horizon.value, P.horizon, NUIT.horizon);
  u.nuit.value = v;
  scene.fog.color.copy(u.horizon.value);
  M.mats.brume.couleur.value.copy(u.horizon.value);
  if (M.eau) M.eau.material.uniforms.nuit.value = v;
  if (M.vapeurs) M.vapeurs.material.uniforms.nuit.value = v;
  M.etoiles.material.uniforms.nuit.value = v;
  M.mats.lueur.value = v; // les lanternes s'allument
}

// ---------------------------------------------------------------- Les textes, l'interface
const textesDe = (L, cle) => L.textes[langue]?.[cle] ?? L.textes.en[cle];
const tx = (cle) => textesDe(M.lieu, cle);
const nomDe = (L) => L.nom[langue] || L.nom.en;
/** Un texte du compagnon e (textes.js : compagnons) ; tc : celui du compagnon choisi. */
const tcDe = (e, cle) => (TEXTES[langue].compagnons?.[e] ?? TEXTES.en.compagnons[e])[cle];
const tc = (cle) => tcDe(espece || 'kon', cle);
const nomQui = (qui) => (qui === 'kon' || qui === 'compagnon' ? tc('nom') : tx('noms')?.[qui] || '');
const texteTampon = (L, tp) => {
  const [nom, indice] = textesDe(L, 'tampons')[tp.id];
  return { nom, indice };
};

const dialogue = creerDialogue({ boite: $('.dialogue'), nom: $('.dialogue-nom'), texte: $('.dialogue-texte'), suite: $('.dialogue-suite'), choix: $('.dialogue-choix') }, son);
// le carnet montre tous les lieux, dans l'ordre de LIEUX (leurs infos suffisent : pas besoin de les construire)
const carnet = creerCarnet({ fond: $('.fond-carnet'), page: $('.carnet') }, {
  lieux: () => Object.values(LIEUX).map(({ infos: L }) => ({ id: L.id, nom: nomDe(L), nomJa: L.nomJa, tampons: L.tampons, textes: L.textes })),
  t, texteLieu: texteTampon,
  // la récompense de tous les tampons du lieu (tenues.js), gagnée ou à gagner
  recompense: (L, complet) => {
    const p = recompenseDu(L.id);
    if (!p) return '';
    const T = t('tenue');
    return `<p class="carnet-recompense${complet ? ' gagnee' : ''}">${icone(p.id, sorte, 44)}<span>${(complet ? T.recompenseGagnee : T.recompense)(nomPiece(p.id))}</span></p>`;
  },
  // son secret : trouvé (un koban doré), ou, une fois tous les tampons trouvés, qu'il en reste un ; et les koban qu'on a
  secret: (L, complet) => {
    const id = SECRETS[L.id], T = t('tresors');
    let h = '';
    if (id && secretTrouve(id)) h = `<p class="carnet-secret trouve">${dessinKoban(30, `c-${id}`)}<span>${T.carnetSecretTrouve(T.secrets[id])}</span></p>`;
    else if (id && complet) h = `<p class="carnet-secret"><span class="point">？</span><span>${T.carnetSecret}</span></p>`;
    if (kobanTrouves() > 0) h += `<p class="carnet-koban">${dessinKoban(22, 'c-total')}<span>${T.carnetKoban(koban())}</span></p>`;
    return h;
  },
});
/** Le nom (dans la langue du moment) et la description d'une pièce de tenue, pour le voyageur s. */
// (la casquette ou le chapeau de paille, la veste rouge ou le chemisier rose : selon le voyageur)
const clePiece = (id, s = sorte) => (id === 'defaut' ? (s === 'fille' ? 'defautFille' : 'defautGarcon')
  : id === 'habit-defaut' ? (s === 'fille' ? 'habitFille' : 'habitGarcon') : id);
const nomPiece = (id, s) => t('tenue').noms[clePiece(id, s)];
const descriptionPiece = (id, s) => t('tenue').descriptions[clePiece(id, s)];

function majInterface() {
  const L = M.lieu;
  document.documentElement.lang = langue;
  document.title = `${nomDe(L)} · ${t('titrePage')} · Random Japan Place`;
  $('.titre-nom').textContent = nomDe(L);
  $('.titre-ja').textContent = langue === 'ja' ? L.nom.en : L.nomJa;
  for (const [s, cle] of [['.retour', 'retour'], ['.btn-carnet', 'carnet'], ['.btn-menu', 'menu']]) {
    $(s).title = t(cle);
    $(s).setAttribute('aria-label', t(cle));
  }
  $('.btn-tenue').title = t('tenue').titre;
  $('.btn-tenue').setAttribute('aria-label', t('tenue').titre);
  if (etat.mode === 'tenue') majGarderobe();
  $('.retour').href = `../#${L.carte}`;
  $('.aide').textContent = tactile ? t('aideTel') : t('aideOrdi');
  majCompteur();
}
function majCompteur() {
  const n = (lireTampons()[M.lieu.id] || []).length;
  $('.carnet-n').textContent = `${n}/${M.lieu.tampons.length}`;
}

// ---------------------------------------------------------------- Les commandes
const tactile = matchMedia('(pointer: coarse)').matches;
const touches = new Set();
const joy = { x: 0, y: 0, id: null };
const ACTION = ['KeyE', 'Space', 'Enter', 'NumpadEnter'];
addEventListener('keydown', (e) => {
  son.reveiller();
  if (etat.mode === 'video') return;
  if (dialogue.ouvert()) {
    if (!e.repeat && ACTION.includes(e.code)) dialogue.appuyer();
    else if (['ArrowUp', 'KeyW'].includes(e.code)) dialogue.deplacer(-1);
    else if (['ArrowDown', 'KeyS'].includes(e.code)) dialogue.deplacer(1);
    else if (e.code === 'Escape') dialogue.annuler();
    e.preventDefault();
    return;
  }
  if (etat.mode === 'danse') { e.preventDefault(); arreterDanse(); return; }
  if (e.code === 'Escape') { fermerTout(); return; }
  if (etat.mode !== 'jeu') return;
  if (ACTION.includes(e.code)) { e.preventDefault(); if (!e.repeat) agir(); return; }
  if (e.key === 'c' || e.key === 'C') { ouvrirCarnet(); return; }
  touches.add(e.code);
  if (e.code.startsWith('Arrow')) e.preventDefault();
});
addEventListener('keyup', (e) => touches.delete(e.code));
// une touche lâchée hors de la page (fenêtre quittée, menu du clic droit ouvert) n'arrive jamais : le joueur
// avançait tout seul. Pas de menu sur le jeu (le clic droit y tourne la caméra), et l'on oublie les touches
// tenues dès que la page perd la main
addEventListener('blur', () => touches.clear());
addEventListener('contextmenu', (e) => { if (e.target === toile) e.preventDefault(); else touches.clear(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) touches.clear(); });
const appuye = (...codes) => codes.some((c) => touches.has(c));

// la caméra : on la fait tourner en glissant (souris ou doigt hors du joystick) ; un appui sans glisser parle
let glisse = null;
toile.addEventListener('pointerdown', (e) => {
  son.reveiller();
  if (dialogue.ouvert()) { dialogue.appuyer(); return; }
  if (etat.mode === 'danse') { arreterDanse(); return; }
  if (glisse) return;
  glisse = { id: e.pointerId, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY };
  try { toile.setPointerCapture(e.pointerId); } catch { /* un pointeur déjà levé */ }
});
toile.addEventListener('pointermove', (e) => {
  if (!glisse || e.pointerId !== glisse.id) return;
  if (etat.mode === 'tenue') {
    etat.cap += (e.clientX - glisse.x) * 0.012;
    glisse.x = e.clientX;
    return;
  }
  cam.lacet -= (e.clientX - glisse.x) * 0.0062;
  cam.tangage = Math.min(1.25, Math.max(-0.05, cam.tangage + (e.clientY - glisse.y) * 0.0045));
  glisse.x = e.clientX;
  glisse.y = e.clientY;
});
const lacher = (e) => { if (glisse && e.pointerId === glisse.id) glisse = null; };
toile.addEventListener('pointerup', lacher);
toile.addEventListener('pointercancel', lacher);
// (avec l'appareil photo, on peut s'approcher plus près)
toile.addEventListener('wheel', (e) => { cam.distance = Math.min(14, Math.max(etat.mode === 'photo' ? 1.6 : 3.2, cam.distance * (1 + Math.sign(e.deltaY) * 0.1))); e.preventDefault(); }, { passive: false });

// le joystick et le bouton A (écrans tactiles)
const manette = $('.joystick');
const bouton = manette.querySelector('span');
manette.addEventListener('pointerdown', (e) => {
  son.reveiller();
  if (etat.mode === 'danse') arreterDanse();
  joy.id = e.pointerId;
  try { manette.setPointerCapture(e.pointerId); } catch { /* un pointeur déjà levé */ }
  bougerJoy(e);
});
manette.addEventListener('pointermove', (e) => { if (e.pointerId === joy.id) bougerJoy(e); });
const lacherJoy = (e) => { if (e.pointerId !== joy.id) return; joy.id = null; joy.x = joy.y = 0; bouton.style.transform = ''; };
manette.addEventListener('pointerup', lacherJoy);
manette.addEventListener('pointercancel', lacherJoy);
function bougerJoy(e) {
  const r = manette.getBoundingClientRect();
  let dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2), dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
  const l = Math.hypot(dx, dy);
  if (l > 1) { dx /= l; dy /= l; }
  joy.x = dx; joy.y = -dy;
  bouton.style.transform = `translate(${dx * 34}px, ${dy * 34}px)`;
}
$('.bouton-a').addEventListener('pointerdown', (e) => {
  e.preventDefault();
  son.reveiller();
  if (dialogue.ouvert()) dialogue.appuyer();
  else if (etat.mode === 'danse') arreterDanse();
  else if (etat.mode === 'jeu') agir();
});
$('.bulle-action').addEventListener('pointerdown', (e) => { e.preventDefault(); if (etat.mode === 'jeu') agir(); });

// le carnet, le menu
$('.btn-carnet').addEventListener('click', () => ouvrirCarnet());
$('.btn-menu').addEventListener('click', () => ouvrirMenu());
$('.btn-tenue').addEventListener('click', () => ouvrirGarderobe());
$('.fond-carnet').addEventListener('click', (e) => { if (e.target === e.currentTarget || e.target.closest('.fermer')) fermerTout(); });
$('.fond-menu').addEventListener('click', (e) => { if (e.target === e.currentTarget) fermerTout(); });
function ouvrirCarnet() {
  if (etat.mode !== 'jeu') return;
  carnet.ouvrir(M.lieu.id);
  etat.mode = 'carnet';
}
function fermerTout() {
  if (carnet.ouvert()) carnet.fermer();
  $('.fond-menu').hidden = true;
  if (etat.mode === 'tenue') fermerGarderobe();
  if (etat.mode === 'boutique') fermerBoutique();
  if (etat.mode === 'photo') { if (photo.resultat()) photo.fermerResultat(); else fermerPhoto(); }
  if (etat.mode === 'danse') arreterDanse();
  if (etat.mode === 'carnet' || etat.mode === 'menu') etat.mode = 'jeu';
}

// ---------------------------------------------------------------- La garde-robe
/**
 * La caméra face au voyageur (la garde-robe, une récompense qu'on essaie), plus près ; le voyageur se tourne vers
 * elle. Elle vient du côté où elle est déjà, ou du côté le plus proche d'où rien ne cache le voyageur (un poteau,
 * un mur, une lanterne, une butte, un passant : gene). panneau : la garde-robe est ouverte ; sur un écran large,
 * le voyageur se tient alors à gauche (le panneau est à droite) ; en hauteur, en haut (le panneau est en bas). Sans
 * panneau, il est au milieu, un peu haut (la boîte de dialogue est en bas).
 */
function cadrerDeFace(panneau = true) {
  const portrait = innerWidth < innerHeight;
  // (en hauteur, le panneau prend la moitié du bas : la caméra recule, que les bois de daim tiennent dans le haut)
  const champ = portrait ? 54 : 36, D = portrait ? (panneau ? 4.3 : 3.5) : 2.9;
  const demiH = D * Math.tan(THREE.MathUtils.degToRad(champ / 2)), demiL = demiH * (innerWidth / innerHeight);
  const decale = panneau && !portrait ? 0.36 * demiL : 0, baisse = (portrait ? (panneau ? 0.43 : 0.25) : panneau ? 0 : 0.12) * demiH;
  // la caméra et le point visé pour la direction a (la droite de la caméra, qui regarde le voyageur : cos a, −sin a)
  const place = (a) => {
    const sx = Math.sin(a), cz = Math.cos(a), vx = etat.x + cz * decale, vz = etat.z - sx * decale;
    return { de: new THREE.Vector3(vx + sx * D, etat.y + 1.05, vz + cz * D), vers: new THREE.Vector3(vx, etat.y + 0.82 - baisse, vz) };
  };
  let meilleur = null;
  for (const k of [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6, 7, -7, 8]) {
    const a = cam.lacet + k * 0.4, p = place(a), g = gene(p.de);
    if (!meilleur || g < meilleur.g) meilleur = { a, p, g };
    if (g === 0) break;
  }
  etat.cap = meilleur.a;
  M.cadre = { ...meilleur.p, champ };
  camera.userData.place = false;
}
/**
 * Ce qui cache le voyageur à une caméra posée en de (0 : rien) : des rayons vers ses pieds, sa taille et sa tête,
 * au milieu et de chaque côté, contre le décor (ses formes vraies : un muret, une lanterne, un poteau), le sol (une
 * butte) et les passants.
 */
const rayon = new THREE.Raycaster();
function gene(de, cible = etat) {
  const L = M.lieu, ex = de.x - cible.x, ez = de.z - cible.z, le = Math.hypot(ex, ez) || 1;
  let n = 0;
  for (const [h, c] of [[0.2, 0], [0.75, 0], [1.3, 0], [0.3, -0.28], [0.3, 0.28], [0.85, -0.3], [0.85, 0.3], [1.35, -0.32], [1.35, 0.32]]) {
    // (c : de côté, vu de la caméra)
    const vers = new THREE.Vector3(cible.x - (ez / le) * c, cible.y + h, cible.z + (ex / le) * c), d = vers.clone().sub(de), l = d.length();
    d.divideScalar(l);
    rayon.set(de, d);
    rayon.far = Math.max(0.1, l - 0.3);
    if (rayon.intersectObjects(M.decor, false).length) { n++; continue; }
    // (et à l'envers : une caméra dans un objet, le socle d'une pagode, n'en voit pas les faces, tournées vers dehors)
    if (c === 0) {
      rayon.set(vers, d.clone().negate());
      rayon.far = l;
      if (rayon.intersectObjects(M.decor, false).length) { n += 2; continue; }
    }
    for (let t = 0.1; t < 0.92; t += 0.08) {
      const x = de.x + d.x * l * t, y = de.y + d.y * l * t, z = de.z + d.z * l * t;
      if (L.terrain(x, z) > y || M.passants.some((p) => (x - p.etat.x) ** 2 + (z - p.etat.z) ** 2 < 0.2 && y < p.etat.y + 1.5)) { n++; break; }
    }
  }
  // (la caméra dans un bâtiment)
  const o = new THREE.Vector3(cible.x, cible.y + 1, cible.z), d = de.clone().sub(o), l = d.length();
  if (L.monde.visee(o, d.divideScalar(l), l) < l) n += 3;
  return n;
}
let avantTenue = null;
function ouvrirGarderobe() {
  if (etat.mode !== 'jeu' && etat.mode !== 'menu') return;
  fermerTout();
  if (siege) seLever();
  touches.clear();
  etat.vx = etat.vz = 0;
  avantTenue = { cap: etat.cap };
  cadrerDeFace();
  etat.mode = 'tenue';
  document.body.classList.add('en-tenue');
  majGarderobe();
  $('.garde-robe').hidden = false;
}
function fermerGarderobe() {
  $('.garde-robe').hidden = true;
  document.body.classList.remove('en-tenue');
  M.cadre = null;
  if (avantTenue) etat.cap = avantTenue.cap;
  camera.userData.place = false;
  etat.mode = 'jeu';
}
/** Le panneau : pour chaque place, ses pièces (celles qu'on n'a pas encore : grisées, avec ce qu'il faut faire). */
function majGarderobe(info = null) {
  const T = t('tenue'), tenue = lireTenue(sorte, totalTampons);
  const sections = PLACES.map((place) => {
    const boutons = PIECES.filter((p) => p.place === place).map((p) => {
      const ok = gagnee(p, totalTampons), porte = tenue[place] === p.id;
      return `<button type="button" class="piece${porte ? ' actif' : ''}${ok ? '' : ' verrou'}" data-piece="${p.id}" aria-pressed="${porte}">`
        + `${icone(p.id, sorte, 46)}<small>${nomPiece(p.id)}</small>${ok ? '' : CADENAS}</button>`;
    }).join('');
    return `<section><h3>${T[place]}</h3><div class="pieces">${boutons}</div></section>`;
  }).join('');
  const p = piece(info) || piece(tenue.yeux !== 'aucune' && !info ? tenue.yeux : tenue.tete);
  const texte = gagnee(p, totalTampons) ? descriptionPiece(p.id) : p.achat ? T.verrouAchat(article(p.achat).prix) : T.verrou(nomDe(LIEUX[p.lieu].infos), (lireTampons()[p.lieu] || []).length, totalTampons(p.lieu));
  $('.garde-robe').innerHTML = `<button class="fermer" type="button" aria-label="${t('fermer')}">×</button>`
    + `<h2>${T.titre}${T.titreJa ? ` <span>${T.titreJa}</span>` : ''}</h2>${sections}`
    + `<p class="piece-info"><b>${nomPiece(p.id)}</b> ${texte}</p><p class="tenue-aide">${T.aide}<br><small>${T.tourner}</small></p>`;
}
const CADENAS = '<svg class="cadenas" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 11V8a5 5 0 0 1 10 0v3" fill="none" stroke="#3a3236" stroke-width="2.6"/><rect x="4.5" y="10.5" width="15" height="11" rx="2.5" fill="#e8b941" stroke="#3a3236" stroke-width="2.2"/><circle cx="12" cy="15.5" r="1.8" fill="#3a3236"/></svg>';
$('.garde-robe').addEventListener('click', (e) => {
  if (e.target.closest('.fermer')) { fermerGarderobe(); return; }
  const b = e.target.closest('[data-piece]');
  if (!b) return;
  const p = piece(b.dataset.piece);
  if (!gagnee(p, totalTampons)) { son.bip(); majGarderobe(p.id); return; }
  porterPiece(p);
  son.choix();
  majGarderobe(p.id);
});
/**
 * Le voyageur met la pièce p (et la garde : chaque voyageur a sa tenue) ; ce qu'on laisse sous ses pas : un aperçu
 * à ses pieds ; ce que porte le compagnon : il saute de joie.
 */
function porterPiece(p) {
  const tenue = lireTenue(sorte, totalTampons);
  if (tenue[p.place] === p.id) return;
  tenue[p.place] = p.id;
  ecrireTenue(sorte, tenue);
  if (p.place === 'pas') {
    M.trace = p.id !== 'trace-aucune' ? p.id.slice(6) : null;
    if (M.trace) for (let k = 0; k < 3; k++) M.effets.trace(M.trace, etat.x + (k - 1) * 0.2, etat.y, etat.z, true);
  } else if (p.place === 'compagnon') {
    for (const c of Object.values(M.compagnons)) c.porter(p.id);
    M.kon.sauter();
  } else {
    M.joueur.porter(p.place, p.id);
    M.joueur.saluer();
  }
}

/**
 * Les récompenses gagnées et pas encore annoncées (au dernier tampon d'un lieu, ou à l'arrivée pour celles gagnées
 * avant cette version) : la pièce sur une fiche, sa petite musique, puis on peut l'essayer tout de suite : la caméra
 * face au voyageur, un petit nuage, et la voilà sur lui.
 */
async function offrirRecompenses() {
  for (const p of nouvelles(totalTampons)) {
    marquerVue(p.id);
    const T = t('tenue'), nom = nomPiece(p.id);
    const el = $('.tampon-obtenu');
    el.innerHTML = `<div class="tampon-papier piece-gagnee"><span class="ruban">${T.titre}</span><div class="tampon-presse">${icone(p.id, sorte, 150)}</div></div>`;
    el.hidden = false;
    son.cadeau();
    await attendre(900);
    await dialogue.dire(T.gain(nomDe(LIEUX[p.lieu].infos), nom));
    el.hidden = true;
    if ((await dialogue.choisir([T.porter], [T.porterOui, T.porterNon])) !== 0) await dialogue.dire(T.plusTard);
    else {
      // (assis, ou la caméra déjà ailleurs : on ne la bouge pas)
      const deFace = !siege && !M.cadre, cap = etat.cap;
      if (deFace) { cadrerDeFace(false); await attendre(450); }
      M.effets.nuage(etat.x, etat.y + 1.05, etat.z, 1.3);
      M.bruitage.pouf();
      await attendre(120);
      porterPiece(p);
      await attendre(700);
      await dialogue.dire(T.porte);
      if (deFace) { M.cadre = null; etat.cap = cap; camera.userData.place = false; }
    }
    // (le lieu cache encore un secret : le carnet le dit)
    if (SECRETS[p.lieu] && !secretTrouve(SECRETS[p.lieu])) await dialogue.dire(t('tresors').secretReste);
  }
}

function ouvrirMenu() {
  if (etat.mode !== 'jeu' && etat.mode !== 'menu') return;
  const T = t('tresors');
  const choix = (cle, valeurs, actuel) => `<div class="menu-ligne"><span>${t(cle)}</span><div>${valeurs.map(([v, nom]) => `<button type="button" data-${cle.toLowerCase()}="${v}" class="${v === actuel ? 'actif' : ''}">${nom}</button>`).join('')}</div></div>`;
  $('.menu').innerHTML = `
    <button type="button" class="menu-carnet">${t('carnet')} <small>${$('.carnet-n').textContent}</small></button>
    <button type="button" class="menu-tenue">${t('tenue').titre} <small>${PIECES.filter((p) => p.lieu && gagnee(p, totalTampons)).length}/${PIECES.filter((p) => p.lieu).length}</small></button>
    ${kobanTrouves() > 0 ? `<p class="menu-koban">${dessinKoban(22, 'menu')}<span>${T.menuKoban}</span><b>${koban()}</b></p>` : ''}
    ${['danse', 'feux', 'photo'].filter(aAchete).map((id) => `<button type="button" class="menu-action" data-action="${id}">${iconeArticle(id, 28)}<span>${T[{ danse: 'menuDanser', feux: 'menuFeux', photo: 'menuPhoto' }[id]]}</span></button>`).join('')}
    ${aAchete('calendrier') ? `<div class="menu-ligne"><span>${T.menuSaison}</span><div>${SAISONS.map((k) => `<button type="button" data-menusaison="${k}" class="${k === M.saison ? 'actif' : ''}">${T.saisons[k]}</button>`).join('')}</div></div>` : ''}
    ${choix('menuVoyageur', [['garcon', t('garcon')], ['fille', t('fille')]], sorte)}
    ${choix('menuCompagnon', compagnonsDispo().map((e) => [e, tcDe(e, 'nom')]), espece)}
    ${choix('menuLieu', Object.entries(LIEUX).map(([id, { infos }]) => [id, nomDe(infos)]), M.lieu.id)}
    ${choix('menuSon', [['oui', t('sonOui')], ['non', t('sonNon')]], son.actif() ? 'oui' : 'non')}
    ${choix('menuMusique', [['oui', t('sonOui')], ['non', t('sonNon')]], M.musique.actif() ? 'oui' : 'non')}
    ${choix('menuLangue', [['en', 'EN'], ['fr', 'FR'], ['ja', '日本語']], langue)}
    <a class="menu-carte" href="../#${M.lieu.carte}">${t('menuCarte')}</a>`;
  $('.fond-menu').hidden = false;
  etat.mode = 'menu';
}
$('.menu').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.classList.contains('menu-carnet')) { fermerTout(); ouvrirCarnet(); return; }
  if (b.classList.contains('menu-tenue')) { fermerTout(); ouvrirGarderobe(); return; }
  const d = b.dataset;
  if (d.action) {
    fermerTout();
    if (d.action === 'danse') commencerDanse();
    else if (d.action === 'feux') lancerFeux();
    else if (d.action === 'photo') ouvrirPhoto();
    return;
  }
  if (d.menusaison) {
    fermerTout();
    if (d.menusaison !== M.saison) {
      changerSaison(d.menusaison);
      son.magie();
      jouerScene((jeu) => jeu.dire(t('tresors').saisonChange(t('tresors').saisons[d.menusaison])));
    }
    return;
  }
  if (d.menuvoyageur) {
    sorte = d.menuvoyageur;
    memoire.ecrire('baladePerso', sorte);
    choisirVoyageur(sorte);
    habiller(sorte);
  } else if (d.menucompagnon) {
    if (d.menucompagnon !== espece) {
      M.effets.nuage(renard.x, renard.y, renard.z);
      M.bruitage.pouf({ pan: panDe(renard.x, renard.z) });
      choisirCompagnon(d.menucompagnon);
      memoire.ecrire('baladeCompagnon', espece);
      M.kon.sauter();
      setTimeout(() => M.bruitage.cri(espece, { pan: panDe(renard.x, renard.z) }), 250);
    }
  } else if (d.menulieu) {
    if (d.menulieu !== M.lieu.id) { location.search = `?lieu=${d.menulieu}`; return; }
  } else if (d.menuson) son.regler(d.menuson === 'oui');
  else if (d.menumusique) M.musique.regler(d.menumusique === 'oui');
  else if (d.menulangue) {
    langue = d.menulangue;
    memoire.ecrire('langue', langue);
    majInterface();
  }
  ouvrirMenu();
});

/**
 * La vidéo TikTok du lieu (celle du propriétaire), dans un cadre du jeu ; se résout quand on la ferme. Le
 * lecteur de TikTok échoue parfois (« Player error » : ses serveurs refusent un moment) : il le dit
 * (onPlayerError), on le recharge une fois, puis on montre la couverture et un lien vers la vidéo sur TikTok.
 * Un lien discret sous le cadre mène aussi à TikTok. Le bruitage se tait pendant la vidéo.
 */
function video() {
  return new Promise((fin) => {
    const id = M.lieu.video, lecteur = $('.video-lecteur'), surTikTok = `https://www.tiktok.com/@random_japan_place/video/${id}`;
    let essais = 0, relance = null;
    const charger = () => {
      lecteur.innerHTML = `<iframe src="https://www.tiktok.com/player/v1/${id}?autoplay=1&music_info=1&description=0&rel=0" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" title="TikTok"></iframe>`;
    };
    const repli = () => {
      lecteur.innerHTML = `<div class="video-repli"><img src="../photos/tiktok/${id}.jpg" alt=""><p>${t('videoErreur')}</p>`
        + `<a class="video-tiktok" href="${surTikTok}" target="_blank" rel="noopener">${t('videoSurTikTok')}</a>`
        + `<button class="video-reessayer" type="button">${t('videoReessayer')}</button></div>`;
      lecteur.querySelector('.video-reessayer').onclick = () => { essais = 0; charger(); };
    };
    const ecoute = (e) => {
      const f = lecteur.querySelector('iframe');
      if (!f || e.source !== f.contentWindow) return;
      let d = e.data;
      if (typeof d === 'string') { try { d = JSON.parse(d); } catch { return; } }
      // (3002 : la lecture automatique refusée ; le lecteur montre son bouton, rien n'est cassé)
      if (!d?.['x-tiktok-player'] || d.type !== 'onPlayerError' || d.value?.errorCode === 3002 || relance) return;
      if (++essais <= 1) relance = setTimeout(() => { relance = null; charger(); }, 900);
      else repli();
    };
    addEventListener('message', ecoute);
    charger();
    $('.video-titre').textContent = t('videoTitre')(nomDe(M.lieu));
    $('.video-lien').href = surTikTok;
    $('.video-lien').textContent = t('videoLien');
    $('.video-fermer').textContent = t('videoFermer');
    $('.fond-video').hidden = false;
    M.bruitage.couper(true);
    M.musique.couper(true);
    const avant = etat.mode;
    etat.mode = 'video';
    const fermer = () => {
      clearTimeout(relance);
      removeEventListener('message', ecoute);
      $('.fond-video').hidden = true;
      lecteur.innerHTML = '';
      M.bruitage.couper(false);
      M.musique.couper(false);
      etat.mode = avant;
      removeEventListener('keydown', echap);
      fin();
    };
    const echap = (e) => { if (e.code === 'Escape') fermer(); };
    addEventListener('keydown', echap);
    // (une fois la vidéo touchée, le clavier va au lecteur de TikTok : le bouton et le voile ferment aussi)
    $('.video-fermer').onclick = fermer;
    $('.fond-video').onclick = (e) => { if (e.target === e.currentTarget) fermer(); };
  });
}

// ---------------------------------------------------------------- Parler, lire, tamponner
/** Ce qui est à portée et devant le joueur (gens, panneaux, objets, daims, le compagnon), le mieux placé d'abord. */
function cibleProche() {
  const L = M.lieu;
  if (siege?.libre) return { x: etat.x, z: etat.z, y: etat.y, haut: 1.55, verbe: 'lever', lever: true };
  const cands = [];
  for (const i of L.interactions) {
    if (i.passant) {
      const p = M.passants.find((q) => q.id === i.passant);
      cands.push({ ...i, x: p.etat.x, z: p.etat.z, y: p.etat.y, rayon: 1.8, haut: 1.95 * (p.tenue.taille || 1), p });
    } else {
      // pres(x, z) : un endroit qui suit le joueur (le long d'une corde…), sinon le point fixe de l'interaction ;
      // si(jeu) : seulement à certains moments (la carte au trésor vue…) ; verbe(jeu) : un verbe qui change
      if (i.si && !i.si(jeu)) continue;
      const q = i.pres ? { ...i, ...i.pres(etat.x, etat.z) } : i;
      cands.push({ ...q, verbe: typeof q.verbe === 'function' ? q.verbe(jeu) : q.verbe, y: q.y ?? L.monde.hauteur(q.x, q.z), haut: q.haut || 2.1 });
    }
  }
  for (const d of M.daims) cands.push({ x: d.x, z: d.z, y: L.monde.hauteur(d.x, d.z), rayon: 1.9, verbe: 'caresser', haut: 1.55 - 0.5 * lisse(0, 1, d.couche), action: L.actionDaim });
  // les bêtes : les regarder, caresser un chat (il ronronne)
  for (const b of M.betes?.cibles() || []) {
    cands.push({ ...b, action: async (jeu) => {
      if (b.bete) { b.bete.caresser(); M.bruitage.bete('ronron', { pan: panDe(b.x, b.z) }); }
      await L.actionBete(jeu, b);
    } });
  }
  if (!renard.nage) cands.push({ x: renard.x, z: renard.z, y: renard.y, rayon: 1.4, verbe: 'parler', haut: 0.95, action: parlerCompagnon, kon: true });
  let meilleur = null, score = Infinity;
  const fx = Math.sin(etat.cap), fz = Math.cos(etat.cap);
  for (const c of cands) {
    const dx = c.x - etat.x, dz = c.z - etat.z, d = Math.hypot(dx, dz);
    if (d > (c.rayon || 1.6) || Math.abs(c.y - etat.y) > 1.3) continue;
    const devant = d > 0.01 ? (dx * fx + dz * fz) / d : 1;
    if (d > 0.9 && devant < 0.2) continue;
    const s = d * (1.6 - devant) + (c.kon ? 1.2 : 0); // le compagnon passe après le reste
    if (s < score) { score = s; meilleur = c; }
  }
  return meilleur;
}

let cible = null;
async function agir() {
  const c = cible;
  if (!c || etat.mode !== 'jeu') return;
  if (c.lever) { seLever(); return; }
  etat.mode = 'dialogue';
  touches.clear();
  etat.vx = etat.vz = 0;
  etat.cap = Math.atan2(c.x - etat.x, c.z - etat.z);
  if (c.p) c.p.etat.parle = true;
  try {
    await c.action(jeu);
  } finally {
    if (c.p) { c.p.etat.parle = false; c.p.perso.saluer(); }
    // (sauf si l'action a ouvert autre chose : la boutique du marchand)
    if (etat.mode === 'dialogue') etat.mode = 'jeu';
  }
}

/** Le compagnon souffle où est le prochain tampon (chacun à sa façon), après un petit bond et son cri. */
async function parlerCompagnon() {
  const L = M.lieu;
  M.kon.sauter();
  M.bruitage.cri(espece, { pan: panDe(renard.x, renard.z) });
  const manque = L.tampons.find((tp) => !aLeTampon(L.id, tp.id));
  if (!manque) { await dialogue.dire(tc('tout'), { qui: tc('nom') }); return; }
  await dialogue.dire([tc('indice'), t('ouTampon')(texteTampon(L, manque).indice)], { qui: tc('nom') });
}

/** Le tampon pressé dans le carnet : le dessin qui s'imprime, la fanfare, puis la phrase. */
async function tampon(id) {
  const L = M.lieu;
  const tp = L.tampons.find((x) => x.id === id);
  if (!ajouterTampon(L.id, id)) { await dialogue.dire([t('dejaTampon')]); return; }
  const el = $('.tampon-obtenu');
  el.innerHTML = `<div class="tampon-papier"><div class="tampon-presse">${dessinTampon(tp, L.nomJa, 200)}</div></div>`;
  el.hidden = false;
  setTimeout(() => son.pression(), 380);
  setTimeout(() => son.tampon(), 520);
  await attendre(950);
  majCompteur();
  await dialogue.dire([t('tamponObtenu')(texteTampon(L, tp).nom)]);
  el.hidden = true;
  if ((lireTampons()[L.id] || []).length === L.tampons.length) {
    await dialogue.dire(tc('tout'), { qui: tc('nom') });
    await offrirRecompenses();
  }
}
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
// assis : le siège { x, z, y (le dessus), cap, libre, cote } ; le joueur n'en bouge plus (sa racine, ASSIS plus bas que
// le dessus) ; il se relève là où il était debout (le siège, lui, est dans ce qui arrête : on y restait coincé).
// libre : il y reste jusqu'à ce qu'il veuille marcher (ou A : se lever) ; cote : la place du compagnon sur le banc
let siege = null, vueAvantSiege = null, debout = null;
/** Se lever d'un banc où l'on restait assis : la caméra reste où elle est (on repart de là). */
function seLever() {
  vueAvantSiege = null;
  jeu.asseoir(null);
}

/** Ce que les lieux peuvent faire (leurs actions reçoivent cet objet). */
const jeu = {
  t, tx,
  dire: (pages, qui) => dialogue.dire(pages, { qui: qui && nomQui(qui) }),
  choisir: (pages, options, qui) => dialogue.choisir(pages, options, { qui: qui && nomQui(qui) }),
  aTampon: (id) => aLeTampon(M.lieu.id, id),
  tampon, video, attendre,
  saluer: () => M.joueur.saluer(),
  /** Le compagnon choisi : 'kon', 'pon' ou 'chapu' (ce qu'il dit dans les lieux en dépend ; dire(…, 'compagnon')). */
  get compagnon() { return espece || 'kon'; },
  /**
   * La caméra posée ailleurs, le temps d'un regard : { de: [x, y, z], vers: [x, y, z], champ (en degrés) }, ou null :
   * elle revient derrière le joueur.
   */
  cadrer(c) {
    // (champ : pour un écran large ; plus étroit, le champ s'ouvre en hauteur pour voir autant de large)
    const k = Math.max(1, 1.68 / (innerWidth / innerHeight));
    const champ = c?.champ && THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(c.champ) / 2) * k));
    M.cadre = c && { de: new THREE.Vector3(...c.de), vers: new THREE.Vector3(...c.vers), champ };
    camera.userData.place = false;
  },
  /**
   * La caméra de côté, sur le voyageur et ce qu'il regarde en (x, y, z) (le sol, pour une fouille, une pierre…) :
   * d'un côté ou de l'autre, un peu tournée au besoin, là où rien ne les cache ; haut : sa hauteur au-dessus d'eux.
   */
  cadrerDeCote(x, y, z, { distance = 4.2, haut = 1.5, champ = 55 } = {}) {
    const L = M.lieu, cx = (x + etat.x) / 2, cz = (z + etat.z) / 2, dx = x - etat.x, dz = z - etat.z, l = Math.hypot(dx, dz) || 1;
    const bas = Math.min(y, etat.y), vers = new THREE.Vector3((x * 2 + etat.x) / 3, bas + 0.7, (z * 2 + etat.z) / 3);
    let de = null, mieux = Infinity;
    for (const a of [0, 0.35, -0.35, 0.7, -0.7]) {
      for (const sg of [1, -1]) {
        const ux = -(dz / l) * sg, uz = (dx / l) * sg, ca = Math.cos(a), sa = Math.sin(a);
        const px = cx + (ux * ca - uz * sa) * distance, pz = cz + (ux * sa + uz * ca) * distance;
        const c = new THREE.Vector3(px, Math.max(L.terrain(px, pz) + 1.2, bas + haut), pz);
        const g = gene(c) + gene(c, { x, y: y - 0.4, z }) + Math.abs(a) * 0.5 + (c.y - bas - haut) * 0.8;
        if (g < mieux) { mieux = g; de = c; }
      }
      if (mieux < 0.6) break;
    }
    jeu.cadrer({ de: de.toArray(), vers: vers.toArray(), champ });
  },
  /** Les deux ronds des jumelles sur l'écran (oui), ou plus. */
  jumelles(oui) {
    const el = $('.jumelles-ecran'), l = innerWidth, h = innerHeight, rr = Math.min(l * 0.27, h * 0.42);
    for (const [c, sg] of [['.j1', -1], ['.j2', 1]]) {
      const o = el.querySelector(c);
      o.setAttribute('cx', l / 2 + sg * rr * 0.72);
      o.setAttribute('cy', h / 2);
      o.setAttribute('r', rr);
    }
    el.classList.toggle('visible', oui);
  },
  /**
   * S'asseoir sur un siège { x, z, y (son dessus), cap } (la caméra : vue { lacet, tangage, distance }), ou se
   * lever (null) : la caméra reprend sa place.
   */
  asseoir(s, vue = null) {
    if (s && !siege) debout = { x: etat.x, z: etat.z, y: etat.y, t: 0 };
    else if (!s && siege && debout) Object.assign(etat, debout);
    siege = s;
    M.joueur.asseoir(!!s);
    if (s) {
      vueAvantSiege = { lacet: cam.lacet, tangage: cam.tangage, distance: cam.distance };
      if (vue) Object.assign(cam, vue);
    } else if (vueAvantSiege) {
      Object.assign(cam, vueAvantSiege);
      vueAvantSiege = null;
    }
  },
  /**
   * S'asseoir sur le banc b (monde.js : pointDuBanc) là où l'on est, et y rester (jusqu'à ce qu'on marche) ; le
   * compagnon saute à côté, du côté où il reste le plus de banc, s'il y a la place. La caméra passe derrière, de trois quarts.
   */
  asseoirSurBanc(b) {
    const p = pointDuBanc(b, etat.x, etat.z), l = Math.hypot(b.a[0] - b.de[0], b.a[1] - b.de[1]);
    const fc = l > 0.01 ? p.f + (p.f > 0.5 ? -0.62 : 0.62) / l : -1, marge = l > 0.01 ? 0.15 / l : 0;
    const cote = fc >= -marge && fc <= 1 + marge ? { x: b.de[0] + fc * (b.a[0] - b.de[0]), z: b.de[1] + fc * (b.a[1] - b.de[1]), y: b.y, cap: b.cap } : null;
    this.asseoir({ x: p.x, z: p.z, y: b.y, cap: b.cap, libre: true, cote }, { lacet: b.cap + Math.PI + (b.vue ?? 0.35), tangage: 0.2, distance: 4.6 });
  },
  /** La vapeur (d'un sauna) qui envahit l'écran (oui), ou se dissipe. */
  vapeur: (oui) => $('.vapeur-ecran').classList.toggle('visible', oui),
  /** On ressort en sueur : les habits trempés sèchent dans une dizaine de secondes ; le compagnon s'ébrouera. */
  transpirer() {
    Object.assign(mouille.joueur, { v: 1, ligne: 1.45, hors: -8 });
    Object.assign(mouille.kon, { v: 0.9, ligne: 0.5, hors: -8, ebroue: false });
  },
  /**
   * La nuit tombe (oui) ou le jour revient, en un peu plus d'une seconde ; se résout une fois fait. Elle reste
   * jusqu'à ce qu'on rappelle le jour (le campeur d'Aogashima, le batelier d'Itsukushima) : les étoiles, les
   * lanternes allumées, l'air de nuit ; et des gens disent autre chose (txn).
   */
  nuit: (oui) => new Promise((fin) => {
    M.nuit.cible = oui ? 1 : 0;
    M.nuit.fin = fin;
  }),
  /** Fait-il nuit (ou la nuit tombe-t-elle) ? */
  get estNuit() { return M.nuit.cible === 1; },
  /** Le texte cle du lieu, ou, la nuit, sa variante « cleNuit » s'il y en a une. */
  txn: (cle) => (M.nuit.cible === 1 && tx(`${cle}Nuit`)) || tx(cle),
  // les trésors (tresors.js) : le secret du lieu, les indices vus, ce qu'on porte dans son sac (une momiji manjū…)
  secretTrouve, indiceVu, voirIndice,
  trouverSecret: (id) => decouvrirSecret(id),
  aDansSac: (o) => M.sac.has(o),
  donner: (o) => { M.sac.add(o); },
  prendre: (o) => { M.sac.delete(o); },
  /** Un geste du voyageur ('creuser', 'offrir'… : personnages.js), ou null. */
  geste: (g) => M.joueur.geste(g),
  /** Un son : 'magie' (son.js), ou un son du bruitage ('pelle', 'boite'). */
  son: (nom) => { if (nom === 'magie') son.magie(); else M.bruitage.jouerSon(nom); },
  /** Des mottes de terre jetées en (x, y, z), qui retombent à la hauteur sol. */
  terre: (x, y, z, sol, n) => M.effets.terre(x, y, z, sol, n),
  /** Une feuille de papier sur l'écran (une carte, une photo : du SVG), ou null : on la range. */
  image: (html, classe) => montrerFeuille(html, classe),
  /** La caméra descend et lève les yeux vers le ciel (oui : les étoiles), ou reprend sa place. */
  leverLesYeux(oui) {
    if (oui && !M.nuit.camera) {
      M.nuit.camera = { lacet: cam.lacet, tangage: cam.tangage, distance: cam.distance };
      Object.assign(cam, { lacet: 0, tangage: -0.3, distance: 3.6 });
    } else if (!oui && M.nuit.camera) {
      Object.assign(cam, M.nuit.camera);
      M.nuit.camera = null;
    }
  },
};


// ---------------------------------------------------------------- Les trésors (2026-10-23) : les secrets, le marchand
/** Les scènes que le lieu demande (la porte de bambous qui s'ouvre…) : jouées dès qu'on est libre. */
const scenes = [];
/** Ce que reçoit, à chaque image, ce que le lieu anime : le joueur, la nuit, une scène à jouer. */
const contexteAnime = { joueur: etat, get nuit() { return M.nuit.v; }, scene: (fn) => scenes.push(fn) };
/** Une scène : le joueur s'arrête le temps d'un dialogue (fn(jeu)), puis repart. */
async function jouerScene(fn) {
  etat.mode = 'dialogue';
  touches.clear();
  etat.vx = etat.vz = 0;
  try { await fn(jeu); } finally { if (etat.mode === 'dialogue') etat.mode = 'jeu'; }
}

/** Une feuille de papier sur l'écran (la carte au trésor, la photo de classe, la lettre), ou null : on la range. */
function montrerFeuille(html, classe = '') {
  const el = $('.feuille');
  if (!html) { el.hidden = true; el.innerHTML = ''; return; }
  el.innerHTML = `<div class="feuille-papier ${classe}">${html}</div>`;
  el.hidden = false;
}

/**
 * Un secret trouvé (tresors.js) : le koban tourne sur ses rayons dorés, sa petite musique ; on dit lequel ; le
 * compagnon s'en réjouit ; et l'on apprend où trouver le marchand qui les accepte.
 */
async function decouvrirSecret(id) {
  if (!trouverSecret(id)) return;
  const T = t('tresors'), el = $('.tampon-obtenu');
  el.innerHTML = `<div class="tampon-papier piece-gagnee koban-gagne"><span class="ruban">${T.secrets[id]}</span><div class="tampon-presse koban-tourne">${dessinKoban(120, 'obtenu')}</div></div>`;
  el.hidden = false;
  son.koban();
  await attendre(1100);
  await dialogue.dire(T.trouve(nomDe(M.lieu)));
  el.hidden = true;
  M.kon.sauter();
  M.bruitage.cri(espece, { pan: panDe(renard.x, renard.z) });
  await dialogue.dire(tc('koban'), { qui: tc('nom') });
  if (memoire.lire('baladeMarchandVu') !== 'oui' && T.marchandOu[M.lieu.id]) await dialogue.dire([T.marchandOu[M.lieu.id]]);
}

/**
 * On parle à Bunbuku. La première fois, il se présente (le compagnon réagit ; Pon reconnaît son oncle). Sans koban ni
 * achat, il dit que chaque lieu cache un secret ; sinon, sa boutique s'ouvre.
 */
async function parlerMarchand() {
  const T = t('tresors').marchand, mq = M.marchand, qui = { qui: T.nom };
  mq.capVoulu = Math.atan2(etat.x - mq.x, etat.z - mq.z);
  mq.perso.saluer();
  const vu = memoire.lire('baladeMarchandVu') === 'oui';
  if (!vu) {
    await dialogue.dire(T.intro, qui);
    M.kon.sauter();
    M.bruitage.cri(espece, { pan: panDe(renard.x, renard.z) });
    await dialogue.dire(tc('marchand'), { qui: tc('nom') });
    if (espece === 'pon') await dialogue.dire(T.introPon, qui);
    memoire.ecrire('baladeMarchandVu', 'oui');
  }
  if (koban() <= 0 && !ARTICLES.some((a) => aAchete(a.id)) && !modeDev()) { await dialogue.dire(T.pasDeKoban, qui); return; }
  if (vu) await dialogue.dire(T.revoir, qui);
  ouvrirBoutique();
}

let choixArticle = null, messageBoutique = '';
function ouvrirBoutique() {
  touches.clear();
  etat.vx = etat.vz = 0;
  etat.mode = 'boutique';
  document.body.classList.add('en-boutique');
  cadrerMarchand();
  choixArticle = null;
  messageBoutique = '';
  majBoutique();
  $('.boutique').hidden = false;
}
function fermerBoutique() {
  $('.boutique').hidden = true;
  document.body.classList.remove('en-boutique');
  M.cadre = null;
  camera.userData.place = false;
  if (M.marchand) M.marchand.capVoulu = M.marchand.cap;
  etat.mode = 'jeu';
}
/**
 * La caméra de côté, entre le voyageur et le marchand (du côté où rien ne la gêne) ; sur un écran large, les deux un peu à
 * gauche (le panneau est à droite) ; en hauteur, en haut (le panneau est en bas). Le voyageur se tourne vers le marchand.
 */
function cadrerMarchand() {
  const mq = M.marchand, L = M.lieu, portrait = innerWidth < innerHeight;
  const cx = (mq.x + etat.x) / 2, cz = (mq.z + etat.z) / 2, dx = etat.x - mq.x, dz = etat.z - mq.z, l = Math.hypot(dx, dz) || 1;
  const D = portrait ? 5.4 : 4.4, y0 = mq.y, vers = new THREE.Vector3(cx, y0 + 0.85, cz);
  // de côté (d'un côté ou de l'autre, un peu tournée au besoin), là où rien ne cache ni le voyageur ni le marchand
  let de = null, mieux = Infinity;
  for (const a of [0, 0.35, -0.35, 0.7, -0.7]) {
    for (const sg of [1, -1]) {
      const ux = -(dz / l) * sg, uz = (dx / l) * sg, ca = Math.cos(a), sa = Math.sin(a);
      const c = new THREE.Vector3(cx + (ux * ca - uz * sa) * D, y0 + 1.5, cz + (ux * sa + uz * ca) * D);
      const dir = c.clone().sub(vers), ld = dir.length();
      let g = gene(c) + gene(c, mq) + Math.abs(a) * 0.5;
      if (L.terrain(c.x, c.z) > c.y - 0.4 || L.monde.visee(vers, dir.divideScalar(ld), ld) < ld - 0.05) g += 10;
      if (g < mieux) { mieux = g; de = c; }
    }
    if (mieux < 0.6) break;
  }
  const avant = vers.clone().sub(de).normalize(), droite = new THREE.Vector3().crossVectors(avant, new THREE.Vector3(0, 1, 0)).normalize();
  if (portrait) vers.y -= 1.1; else vers.addScaledVector(droite, 1.0);
  M.cadre = { de, vers, champ: portrait ? 60 : 42 };
  camera.userData.place = false;
  etat.cap = Math.atan2(mq.x - etat.x, mq.z - etat.z);
  mq.capVoulu = Math.atan2(etat.x - mq.x, etat.z - mq.z);
}
/** L'icône d'un article : la sienne, celle de sa première pièce de tenue, ou celle d'un compagnon. */
function iconeDe(a, taille) {
  if (a.sorte === 'tenue') return icone(a.pieces[0], sorte, taille);
  return iconeArticle(a.id, taille);
}
/**
 * Le panneau de la boutique : les articles par prix ; celui qu'on regarde, ce qu'il fait, et le bouton pour l'acheter.
 * montrer : un sélecteur (ce qu'il fait, ce que dit le marchand) que le panneau fait défiler à la vue, s'il dépasse.
 */
function majBoutique(montrer = null) {
  const T = t('tresors'), TM = T.marchand, n = koban();
  const piecette = (k) => `<span class="piecettes">${Array.from({ length: k }, (_, i) => dessinKoban(13, `p${i}`)).join('')}</span>`;
  const groupes = [...new Set(ARTICLES.map((a) => a.prix))].map((prix) => `<div class="articles">${ARTICLES.filter((a) => a.prix === prix).map((a) => {
    const fait = aAchete(a.id);
    return `<button type="button" class="article${fait ? ' achete' : ''}${choixArticle === a.id ? ' actif' : ''}${!fait && n < a.prix ? ' cher' : ''}" data-article="${a.id}">`
      + `${iconeDe(a, 44)}<small>${T.articles[a.id][0]}</small>${fait ? `<em>${TM.aToi}</em>` : piecette(a.prix)}</button>`;
  }).join('')}</div>`).join('');
  const a = article(choixArticle);
  let info = `<p class="article-info">${TM.aide}</p>`;
  if (a) {
    const fait = aAchete(a.id), manque = a.prix - n;
    info = `<div class="article-info"><b>${T.articles[a.id][0]}</b><span>${T.articles[a.id][1]}</span>`
      + (fait ? `<em>${TM.aToi}</em>` : `<button type="button" class="acheter"${manque > 0 ? ' disabled' : ''}>${manque > 0 ? TM.manque(manque) : TM.acheter(a.prix)}</button>`) + '</div>';
  }
  $('.boutique').innerHTML = `<button class="fermer" type="button" aria-label="${t('fermer')}">×</button>`
    + `<h2>${TM.titre} <span>${TM.titreJa}</span></h2><p class="bourse">${dessinKoban(26, 'bourse')}<b>${n}</b></p>${groupes}${info}`
    + (messageBoutique ? `<p class="boutique-message"><b>${TM.nom}</b> « ${messageBoutique} »</p>` : '')
    + (modeDev() ? `<p class="boutique-dev"><button type="button" data-dev="plus">${TM.dev}</button><button type="button" data-dev="zero">${TM.devZero}</button></p>` : '');
  if (montrer) $(`.boutique ${montrer}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
$('.boutique').addEventListener('click', (e) => {
  if (e.target.closest('.fermer')) { fermerBoutique(); return; }
  const dev = e.target.closest('[data-dev]');
  if (dev) {
    if (dev.dataset.dev === 'plus') kobanDev(1);
    else {
      // (tout recommencer : on recharge la balade, pour rejouer les secrets depuis le début ; ce qu'on portait
      // d'acheté revient à ce qu'on avait, les compagnons achetés partent, la saison redevient l'été)
      remettreDev();
      location.reload();
      return;
    }
    son.choix();
    majBoutique();
    return;
  }
  if (e.target.closest('.acheter')) { acheterArticle(choixArticle); return; }
  const b = e.target.closest('[data-article]');
  if (!b) return;
  choixArticle = b.dataset.article;
  messageBoutique = '';
  son.choix();
  majBoutique('.article-info');
});
function acheterArticle(id) {
  const a = article(id), TM = t('tresors').marchand;
  if (!a) return;
  if (aAchete(id)) { messageBoutique = TM.deja; son.bip(); majBoutique('.boutique-message'); return; }
  if (!acheter(id)) { messageBoutique = TM.manque(a.prix - koban()); son.bip(); majBoutique('.boutique-message'); return; }
  son.achat();
  M.marchand.perso.saluer();
  M.kon.sauter();
  messageBoutique = `${TM.merci} ${a.sorte === 'compagnon' ? TM.apres.compagnon(tcDe(id, 'nom')) : TM.apres[a.sorte]}`;
  majBoutique('.boutique-message');
}

// ---- la danse des fêtes (bon-odori) : la caméra de face, l'air de la fête ; une touche, un appui, et l'on s'arrête
function commencerDanse() {
  if (etat.mode !== 'jeu') return;
  if (siege) seLever();
  touches.clear();
  etat.vx = etat.vz = 0;
  etat.mode = 'danse';
  cadrerDeFace(false);
  // (le premier temps de la danse tombe avec celui de la musique, après son introduction)
  const avance = M.musique.fete(true), b0 = avance ? -avance * (112 / 60) : 0;
  M.joueur.danser(true, b0);
  M.kon.danser(true, b0);
  const aide = $('.aide');
  aide.textContent = t('tresors').danseAide;
  aide.classList.remove('vue');
  document.body.classList.add('en-danse');
}
function arreterDanse() {
  if (etat.mode !== 'danse') return;
  M.joueur.danser(false);
  M.kon.danser(false);
  M.musique.fete(false);
  M.cadre = null;
  camera.userData.place = false;
  const aide = $('.aide');
  aide.classList.add('vue');
  aide.textContent = tactile ? t('aideTel') : t('aideOrdi');
  document.body.classList.remove('en-danse');
  etat.mode = 'jeu';
}

// ---- les feux d'artifice : la nuit (on peut l'attendre), sur la mer derrière le torii ou dans le cratère du petit volcan
async function lancerFeux() {
  const L = M.lieu, T = t('tresors');
  if (!L.feux || etat.mode !== 'jeu') return;
  await jouerScene(async () => {
    if (M.feux.actif()) { await dialogue.dire([T.feuxDeja]); return; }
    if (!jeu.estNuit) {
      if ((await dialogue.choisir(T.feuxNuit, [t('oui'), t('non')])) !== 0) return;
      await jeu.nuit(true);
    }
    M.bruitage.sons(['feu/depart', 'feu/boum', 'feu/crepite']);
    await dialogue.dire(T.feuxDebut);
    // le spectacle, assez loin pour le voir en entier (trop près, on l'éloigne dans la même direction : les bombes
    // éclatent haut, il faudrait se tordre le cou)
    const S0 = L.feux, hm = (S0.haut[0] + S0.haut[1]) / 2;
    const dx = S0.x - etat.x, dz = S0.z - etat.z;
    const d = Math.hypot(dx, dz) || 1, k = Math.max(d, hm * 1.6) / d;
    const S = { ...S0, x: etat.x + dx * k, z: etat.z + dz * k };
    S.y = Math.max(S0.y, L.terrain(S.x, S.z) + 0.5);
    // la caméra derrière le voyageur, tournée vers le spectacle, un peu plus bas ; elle lève les yeux vers les bombes
    Object.assign(cam, { lacet: Math.atan2(etat.x - S.x, etat.z - S.z), tangage: -0.05, distance: 5 });
    M.regardHaut = M.dernierRegard = { x: S.x, y: S.y + hm * 0.85, z: S.z };
    etat.cap = Math.atan2(S.x - etat.x, S.z - etat.z);
    camera.userData.place = false;
    M.feux.spectacle(S, {
      depart(x, y, z) {
        const d = Math.hypot(x - camera.position.x, y - camera.position.y, z - camera.position.z);
        M.bruitage.feu('depart', { force: Math.min(1, 40 / (d + 10)), pan: panDe(x, z), delai: d / 343 });
      },
      eclat(x, y, z, c, force, crepite) {
        const d = Math.hypot(x - camera.position.x, y - camera.position.y, z - camera.position.z), pan = panDe(x, z);
        M.flash.c.setRGB(c[0], c[1], c[2]);
        M.flash.v = Math.min(1.1, M.flash.v + 0.5 * force * Math.min(1, 110 / d));
        M.bruitage.feu('boum', { force: Math.min(1.2, 100 / (d + 20)) * force, pan, delai: d / 343 });
        if (crepite) M.bruitage.feu('crepite', { force: Math.min(1, 80 / (d + 20)), pan, delai: d / 343 + 1.1 });
      },
    }).then(() => {
      M.regardHaut = null;
      scenes.push(async () => {
        M.kon.sauter();
        await dialogue.dire(tc('feux'), { qui: tc('nom') });
      });
    });
  });
}

// ---- l'appareil photo : la caméra de face, plus près ; on tourne autour du voyageur, qui prend la pose
let avantPhoto = null;
const photo = creerPhoto($('.photo'), {
  t: () => t('tresors').photo, son,
  // l'image du jeu, à l'instant (dessinée maintenant : on la copie avant que le navigateur ne l'efface)
  capturer() {
    dessiner(0, temps);
    const c = document.createElement('canvas');
    c.width = toile.width;
    c.height = toile.height;
    c.getContext('2d').drawImage(toile, 0, 0);
    return c;
  },
  infos() {
    const L = M.lieu, pris = lireTampons()[L.id] || [];
    return {
      id: L.id, lieu: nomDe(L), lieuJa: L.nomJa, salut: t('tresors').photo.salut(nomDe(L)), compagnon: tc('nom'),
      date: new Date().toLocaleDateString(langue === 'en' ? 'en-GB' : langue, { year: 'numeric', month: 'long', day: 'numeric' }),
      tampons: L.tampons.filter((tp) => pris.includes(tp.id)).map((tp) => dessinTampon(tp, L.nomJa, 200)),
    };
  },
  pose(g) { M.joueur.geste(g); if (g) { M.kon.sauter(); M.bruitage.cri(espece, { force: 0.6 }); } },
  fermer: () => fermerPhoto(),
});
function ouvrirPhoto() {
  if (etat.mode !== 'jeu') return;
  if (siege) seLever();
  touches.clear();
  etat.vx = etat.vz = 0;
  etat.mode = 'photo';
  avantPhoto = { lacet: cam.lacet, tangage: cam.tangage, distance: cam.distance };
  Object.assign(cam, { lacet: etat.cap, tangage: 0.12, distance: 3.6 });
  camera.userData.place = false;
  document.body.classList.add('en-photo');
  photo.ouvrir();
}
function fermerPhoto() {
  photo.fermer();
  M.joueur.geste(null);
  if (avantPhoto) Object.assign(cam, avantPhoto);
  camera.userData.place = false;
  document.body.classList.remove('en-photo');
  etat.mode = 'jeu';
}

// ---- le calendrier magique : la saison de la balade (les couleurs, ce qui tombe du ciel, la neige sous les pas)
const POIDS_SAISON = { ete: [0, 0, 0], printemps: [1, 0, 0], automne: [0, 1, 0], hiver: [0, 0, 1] };
function changerSaison(s, { tout = false } = {}) {
  if (!SAISONS.includes(s)) s = 'ete';
  M.saison = s;
  memoire.ecrire('baladeSaison', s);
  M.saisonCible = POIDS_SAISON[s];
  if (tout) M.mats.saisons.value.set(...M.saisonCible);
  M.effets.effacerEmpreintes();
  M.chutes.regler(s);
}

// ---------------------------------------------------------------- Le jeu
/** Le joueur au départ du lieu (ou dans la pose d'une capture), son compagnon à côté. */
function placer() {
  const L = M.lieu;
  Object.assign(etat, { x: L.depart.x, z: L.depart.z, cap: L.depart.cap, vitesse: 0, vx: 0, vz: 0 });
  cam.lacet = L.depart.cap + Math.PI;
  const photo = PHOTO && L.photos[PHOTO];
  if (photo) {
    Object.assign(etat, { x: photo.x, z: photo.z, cap: photo.cap });
    Object.assign(cam, { lacet: photo.lacet, tangage: photo.tangage, distance: photo.distance });
  }
  etat.y = L.monde.hauteur(etat.x, etat.z);
  // le compagnon : à droite et un peu en arrière
  const dx = Math.cos(etat.cap), dz = -Math.sin(etat.cap), fx = Math.sin(etat.cap), fz = Math.cos(etat.cap);
  Object.assign(renard, { x: etat.x - dx * 1.3 - fx * 0.5, z: etat.z - dz * 1.3 - fz * 0.5, cap: etat.cap + 0.6 });
  renard.y = L.monde.hauteur(renard.x, renard.z);
}

/**
 * Les deux voyageurs côte à côte, face à l'objectif (le choix du départ, la première fois ; pour la capture « perso »,
 * le compagnon devant eux).
 */
function cadrerLesDeux() {
  const L = M.lieu, p = L.photos.perso;
  Object.assign(etat, { x: p.x, z: p.z, cap: p.cap });
  Object.assign(cam, { lacet: p.lacet, tangage: p.tangage, distance: p.distance });
  etat.y = L.monde.hauteur(etat.x, etat.z);
  M.joueur = M.voyageurs.garcon;
  M.autre = M.voyageurs.fille;
  M.joueur.objet.visible = M.autre.objet.visible = true;
  const dx = Math.cos(etat.cap), dz = -Math.sin(etat.cap), fx = Math.sin(etat.cap), fz = Math.cos(etat.cap);
  Object.assign(renard, { x: etat.x + dx * 0.55 + fx * 0.85, z: etat.z + dz * 0.55 + fz * 0.85, cap: etat.cap - 0.3 });
  renard.y = L.monde.hauteur(renard.x, renard.z);
  if (!PHOTO) for (const c of Object.values(M.compagnons)) c.objet.visible = false;
  camera.userData.place = false;
}

/**
 * Le choix du compagnon, au départ de chaque visite : les trois assis en rang devant le voyageur, face à une
 * caméra basse (M.cadre), comme les trois créatures qu'on présente au début des jeux.
 */
const trio = { actif: false, places: [], liste: COMPAGNONS };
function cadrerTrio() {
  const L = M.lieu, p = L.photos.perso;
  Object.assign(etat, { x: p.x, z: p.z, cap: p.cap, vitesse: 0, vx: 0, vz: 0 });
  etat.y = L.monde.hauteur(etat.x, etat.z);
  M.autre.objet.visible = false;
  const fx = Math.sin(etat.cap), fz = Math.cos(etat.cap), dx = Math.cos(etat.cap), dz = -Math.sin(etat.cap);
  // (les trois de départ, et les compagnons secrets qu'on a achetés au marchand : jusqu'à six en rang)
  trio.liste = compagnonsDispo();
  // (en rang ; plus de trois — les compagnons secrets achetés au marchand — : sur deux rangs, comme pour une photo de
  // classe, les trois de départ devant, les autres derrière, entre eux, la caméra un peu plus haut)
  const n = trio.liste.length, deux = n > 3, m = n - 3, ecart = deux ? 0.62 : 0.8, s = deux && m % 2 ? 0.155 : 0;
  trio.places = trio.liste.map((e, i) => {
    const derriere = deux && i >= 3, j = derriere ? i - 3 : i;
    const k = derriere ? j - (m - 1) / 2 + s / ecart : j - (deux ? 1 : (n - 1) / 2) - s / ecart;
    const avant = derriere ? 0.85 : deux ? 1.55 : 1.15;
    const x = etat.x + fx * avant + dx * k * ecart, z = etat.z + fz * avant + dz * k * ecart;
    return { x, z, y: L.monde.hauteur(x, z, etat.y), cap: etat.cap - k * 0.2 };
  });
  for (const [e, c] of Object.entries(M.compagnons)) c.objet.visible = trio.liste.includes(e);
  trio.actif = true;
  // (plus loin sur un écran en hauteur : ils doivent tenir dans sa largeur ; sur un écran large, un peu à gauche : le
  // menu du choix est à droite)
  const portrait = innerWidth < innerHeight, loin = portrait ? (deux ? 4.6 : 4.3) : deux ? 3.3 : 2.9;
  const cx = etat.x + fx * 1.15, cz = etat.z + fz * 1.15, y0 = trio.places[deux ? 1 : Math.floor((n - 1) / 2)].y;
  const decale = portrait ? 0 : deux ? 0.55 : 0.42, haut = deux ? 1.85 : 1.25 + loin * 0.04;
  M.cadre = {
    de: new THREE.Vector3(cx + fx * loin + dx * decale, y0 + haut, cz + fz * loin + dz * decale),
    vers: new THREE.Vector3(cx - fx * 0.35 + dx * decale, y0 + (portrait ? (deux ? -0.1 : 0.35) : 0.2), cz - fz * 0.35 + dz * decale),
  };
  camera.userData.place = false;
}

function avancer(dt) {
  const L = M.lieu, monde = L.monde;
  const autres = M.passants.map((p) => [p.etat.x, p.etat.z, 0.45]);
  // la direction voulue, par rapport à la caméra
  const libre = etat.mode === 'jeu';
  const avant = libre ? (appuye('KeyW', 'ArrowUp') ? 1 : 0) - (appuye('KeyS', 'ArrowDown') ? 1 : 0) + joy.y : 0;
  const cote = libre ? (appuye('KeyD', 'ArrowRight') ? 1 : 0) - (appuye('KeyA', 'ArrowLeft') ? 1 : 0) + joy.x : 0;
  let m = Math.hypot(avant, cote);
  const fx = -Math.sin(cam.lacet), fz = -Math.cos(cam.lacet), rx = Math.cos(cam.lacet), rz = -Math.sin(cam.lacet);
  let dx = fx * avant + rx * cote, dz = fz * avant + rz * cote;
  if (m > 1) { dx /= m; dz /= m; m = 1; }
  if (siege?.libre && m > 0.3) seLever(); // assis sur un banc : on se lève dès qu'on veut marcher
  const dansLEau = L.eau && L.terrain(etat.x, etat.z) < (L.eau.niveau || 0) - 0.05 && etat.y < (L.eau.niveau || 0) + 0.5;
  const course = appuye('ShiftLeft', 'ShiftRight') || Math.hypot(joy.x, joy.y) > 0.92;
  const vmax = (course ? COURSE : MARCHE) * (dansLEau ? 0.62 : 1);
  const k = Math.min(1, dt * 10);
  etat.vx += (dx * vmax - etat.vx) * k;
  etat.vz += (dz * vmax - etat.vz) * k;
  // on glisse le long des obstacles : d'abord le mouvement entier, sinon le même tourné de plus en plus (moins vite :
  // la part qui longe l'obstacle), d'un côté puis de l'autre ; enfin chaque axe à part. (Le long d'une main
  // courante en biais, ni l'axe x ni l'axe z ne passaient : on restait coincé, 2026-10-23.)
  const nx = etat.x + etat.vx * dt, nz = etat.z + etat.vz * dt;
  let bouge = monde.libre(nx, nz, etat.y, autres);
  if (bouge) { etat.x = nx; etat.z = nz; }
  for (let i = 1; !bouge && i <= 8; i++) {
    const a = Math.ceil(i / 2) * 0.32 * (i % 2 ? 1 : -1), c = Math.cos(a), s = Math.sin(a);
    const vx = (etat.vx * c + etat.vz * s) * c, vz = (etat.vz * c - etat.vx * s) * c;
    if (monde.libre(etat.x + vx * dt, etat.z + vz * dt, etat.y, autres)) { etat.x += vx * dt; etat.z += vz * dt; etat.vx = vx; etat.vz = vz; bouge = true; }
  }
  if (!bouge) {
    if (monde.libre(nx, etat.z, etat.y, autres)) { etat.x = nx; etat.vz *= 0.5; } else if (monde.libre(etat.x, nz, etat.y, autres)) { etat.z = nz; etat.vx *= 0.5; } else { etat.vx = etat.vz = 0; }
  }
  etat.vitesse = Math.hypot(etat.vx, etat.vz);
  etat.y += (monde.hauteur(etat.x, etat.z, etat.y) - etat.y) * Math.min(1, dt * 18);
  if (m > 0.05) etat.cap = tourner(etat.cap, Math.atan2(dx, dz), dt * 10);
  if (siege) Object.assign(etat, { x: siege.x, z: siege.z, y: siege.y - ASSIS, cap: siege.cap, vx: 0, vz: 0, vitesse: 0 });
  if (debout && siege) debout.t += dt;
  if (m > 0.05 && libre) $('.aide').classList.add('vue');

  // le compagnon suit, un peu en arrière et sur le côté ; il s'assoit quand il est arrivé
  const banc = siege?.cote;
  if (renard.banc && renard.banc !== banc) {
    // le voyageur s'est levé : le compagnon saute du banc, devant lui
    const b = renard.banc;
    Object.assign(renard, { x: b.x + Math.sin(b.cap) * 0.75, z: b.z + Math.cos(b.cap) * 0.75, banc: null, vitesse: 0 });
    renard.y = monde.hauteur(renard.x, renard.z, b.y);
    M.kon.sauter();
  }
  // s'il y a la place, il saute sur le banc à côté du voyageur assis : arrivé tout près, ou au bout de 2,5 s
  if (banc && !renard.banc && !renard.nage && etat.mode !== 'depart' && (Math.hypot(banc.x - renard.x, banc.z - renard.z) < 1.1 || debout?.t > 2.5)) {
    renard.banc = banc;
    M.kon.sauter();
  }
  if (renard.banc) {
    // assis sur le banc à côté du voyageur
    Object.assign(renard, { x: banc.x, z: banc.z, y: banc.y, vitesse: 0 });
    renard.cap = tourner(renard.cap, banc.cap, dt * 6);
  } else if (etat.mode !== 'depart') {
    // (le joueur assis : le compagnon vient devant lui, un peu de côté ; derrière, c'est le banc ; ou vers sa place sur le banc)
    // (pendant l'essayage, à côté du voyageur, un peu devant, à droite sur l'écran : il ne le cache pas)
    const essai = etat.mode === 'tenue' || etat.mode === 'danse' || etat.mode === 'photo', recul = siege ? -0.9 : essai ? -0.3 : 1.3, cote = essai ? 0.8 : 0.75;
    const cx = banc ? banc.x : etat.x - Math.sin(etat.cap) * recul + Math.cos(etat.cap) * cote, cz = banc ? banc.z : etat.z - Math.cos(etat.cap) * recul - Math.sin(etat.cap) * cote;
    const ex = cx - renard.x, ez = cz - renard.z, d = Math.hypot(ex, ez);
    const vr = d > 0.35 ? Math.min(COURSE * 1.15, d * 2.8) : 0;
    renard.vitesse += (vr - renard.vitesse) * Math.min(1, dt * 6);
    if (d > 0.01 && renard.vitesse > 0.05) {
      const rxn = renard.x + (ex / d) * renard.vitesse * dt, rzn = renard.z + (ez / d) * renard.vitesse * dt;
      if (monde.libre(rxn, rzn, renard.y)) { renard.x = rxn; renard.z = rzn; }
      renard.cap = tourner(renard.cap, Math.atan2(ex, ez), dt * 8);
    } else renard.cap = tourner(renard.cap, Math.atan2(etat.x - renard.x, etat.z - renard.z), dt * 3);
    if (d > 8) { renard.x = cx; renard.z = cz; renard.y = etat.y; } // resté coincé (un escalier, un coin) : il rejoint
    renard.y += (monde.hauteur(renard.x, renard.z, renard.y) - renard.y) * Math.min(1, dt * 14);
    // la loutre nage là où l'eau lui monte au-dessus des pattes : elle flotte, la tête hors de l'eau
    renard.nage = false;
    if (espece === 'chapu' && L.eau) {
      const niveau = L.eau.niveau || 0, fond = L.terrain(renard.x, renard.z);
      if (niveau - fond > 0.2 && renard.y < niveau) { renard.nage = true; renard.y = niveau - 0.13; }
    }
    // (Fuwa vole : au-dessus de l'eau, il reste au-dessus de la surface)
    if (espece === 'fuwa' && L.eau) renard.y = Math.max(renard.y, (L.eau.niveau || 0) - 0.1);
  }

  // les passants font leur ronde
  const joueur = { x: etat.x, z: etat.z };
  for (const p of M.passants) {
    const autresP = [[etat.x, etat.z, 0.6], ...M.passants.filter((q) => q !== p).map((q) => [q.etat.x, q.etat.z, 0.6])];
    avancerPassant(p.etat, dt, monde, joueur, autresP);
  }
  herbesHautes(dt);
}

// ---- les hautes herbes : à force d'y marcher, un daim sauvage en jaillit (une fois par visite)
const herbes = { metres: 0, seuil: 6 + Math.random() * 8, fait: false };
function herbesHautes(dt) {
  const h = M.lieu.herbes;
  if (!h || herbes.fait || etat.mode !== 'jeu') return;
  if (etat.x < h[0] || etat.x > h[1] || etat.z < h[2] || etat.z > h[3]) return;
  herbes.metres += etat.vitesse * dt;
  if (herbes.metres < herbes.seuil) return;
  herbes.fait = true;
  daimSauvage();
}
async function daimSauvage() {
  etat.mode = 'dialogue';
  touches.clear();
  etat.vx = etat.vz = 0;
  const d = creerDaim(M.ctx, Math.random() < 0.5, 0.3);
  const x = etat.x + Math.sin(etat.cap) * 2.4, z = etat.z + Math.cos(etat.cap) * 2.4;
  d.objet.position.set(x, M.lieu.monde.hauteur(x, z), z);
  d.objet.rotation.y = etat.cap + Math.PI;
  M.groupe.add(d.objet);
  M.sauvage = { d, x, z, t: 0, fuite: false };
  son.sauvage();
  await dialogue.dire([t('herbes')]);
  M.sauvage.fuite = true;
  await attendre(900);
  await dialogue.dire([t('herbesFuit')]);
  M.groupe.remove(d.objet);
  M.sauvage = null;
  etat.mode = 'jeu';
}

// ---------------------------------------------------------------- Sous les pieds : les pas, l'eau, les sons
// le son d'un pas selon la matière du sol (textures.js) ; sur un plancher ou des marches, celui de la surface (du bois, sauf mention)
const SON_DU_SOL = {
  [MATIERES.sable]: 'sable', [MATIERES.herbe]: 'herbe', [MATIERES.estran]: 'estran', [MATIERES.dalles]: 'pierre',
  [MATIERES.terre]: 'terre', [MATIERES.roche]: 'roche', [MATIERES.route]: 'route', [MATIERES.sousBois]: 'sousBois',
  [MATIERES.bois]: 'bois', [MATIERES.pierre]: 'pierre',
};
// mouillé : v (0 à 1 : sèche en quelques secondes après la sortie de l'eau), ligne (jusqu'où, en m au-dessus
// des pieds), hors (secondes hors de l'eau) ; goutte et rond : les comptes à rebours des gouttes et des ronds
const mouille = { joueur: { v: 0, ligne: 0, hors: 99, goutte: 0, rond: 0 }, kon: { v: 0, ligne: 0, hors: 99, goutte: 0, rond: 0, ebroue: true } };
const oreille = { dt: 0, mer: { vagues: 0, pan: 0 }, merDt: 9 };

/** La matière du sol en x, z (la carte du sol autour du jeu, sinon le lieu). */
function matiereDuSol(x, z, h) {
  const c = M.carte, i = Math.round((x - c.x0) / c.pas), j = Math.round((z - c.z0) / c.pas);
  if (i >= 0 && j >= 0 && i < c.nx && j < c.nz) return c.lire(i, j)[1];
  return M.lieu.aspectSol(x, z, h)[1];
}
/** Sous les pieds en x, z, à la hauteur y : le sol (bruitage-calcul.js, SOLS), la profondeur d'eau, la hauteur du sol naturel. */
function sousLesPieds(x, z, y) {
  const L = M.lieu, h = L.terrain(x, z);
  if (y > h + 0.12) return { sol: L.monde.solSous(x, z, y), eau: 0, h };
  const e = L.eau, eau = e && x > e.x0 && x < e.x1 && z > e.z0 && z < e.z1 ? Math.max(0, (e.niveau || 0) - h) : 0;
  const sol = eau > 0.03 ? 'eau' : SON_DU_SOL[matiereDuSol(x, z, h)] || 'terre';
  // (l'hiver du calendrier magique : la neige crisse sous les pas)
  return { sol: M.mats.saisons.value.z > 0.5 && NEIGEUX.has(sol) ? 'neige' : sol, eau, h };
}
const NEIGEUX = new Set(['herbe', 'terre', 'sousBois', 'sable', 'roche']);
/** De quel côté de l'écran est x, z (−1 à gauche, 1 à droite), pour le son. */
function panDe(x, z) {
  const dx = x - camera.position.x, dz = z - camera.position.z;
  return (0.8 * (dx * Math.cos(cam.lacet) - dz * Math.sin(cam.lacet))) / (Math.hypot(dx, dz) || 1);
}
/** La normale du sol naturel en x, z. */
function normaleDuSol(x, z) {
  const T = M.lieu.terrain, e = 0.25;
  const nx = -(T(x + e, z) - T(x - e, z)) / (2 * e), nz = -(T(x, z + e) - T(x, z - e)) / (2 * e), l = Math.hypot(nx, 1, nz);
  return [nx / l, 1 / l, nz / l];
}
const dansLaCarte = (x, z) => { const f = M.lieu.etendue.fin; return x > f.x0 + 1 && x < f.x1 - 1 && z > f.z0 + 1 && z < f.z1 - 1; };
/**
 * La hauteur du sol tel qu'il est dessiné (le maillage fin : des triangles au mètre, 3 cm au-dessus du terrain ; dans
 * un creux ou sur une bosse, il passe au-dessus ou au-dessous de la courbe du terrain : une empreinte posée sur le
 * terrain s'y enfonçait).
 */
function solDessine(x, z) {
  const f = M.lieu.etendue.fin, T = M.lieu.terrain, p = f.pas;
  const x0 = f.x0 + Math.floor((x - f.x0) / p) * p, z0 = f.z0 + Math.floor((z - f.z0) / p) * p, u = (x - x0) / p, v = (z - z0) / p;
  const ha = T(x0, z0), hb = T(x0 + p, z0), hd = T(x0, z0 + p), hf = T(x0 + p, z0 + p);
  // (les deux triangles de la case : a, d, b puis b, d, f ; leur diagonale va de b à d)
  return (u + v <= 1 ? ha + (hb - ha) * u + (hd - ha) * v : hf + (hd - hf) * (1 - u) + (hb - hf) * (1 - v)) + 0.03;
}

/** Un pied (ou une paire de pattes du compagnon) qui se pose : son bruit, ses éclaboussures ou son empreinte. */
function unPas(qui, cote) {
  const kon = qui === 'kon', p = kon ? renard : etat, o = mouille[qui], E = M.effets;
  const { sol, eau, h } = sousLesPieds(p.x, p.z, p.y);
  const course = !kon && etat.vitesse > MARCHE * 1.2;
  // le pied : sur le côté (x > 0 du personnage : sa gauche), un peu devant
  const lx = Math.cos(p.cap), lz = -Math.sin(p.cap), fx = Math.sin(p.cap), fz = Math.cos(p.cap);
  const ecart = kon ? 0.06 : 0.085, x = p.x + (lx * cote * ecart) + fx * 0.12, z = p.z + (lz * cote * ecart) + fz * 0.12;
  const loin = kon ? Math.hypot(renard.x - camera.position.x, renard.z - camera.position.z) : 0;
  // (le compagnon trotte vite : on n'entend qu'une paire de pattes sur deux, sinon il couvrirait nos pas)
  if (!kon || cote > 0) {
    M.bruitage.pas(sol, {
      kon, course, pan: kon ? panDe(p.x, p.z) : -0.12 * cote,
      force: (sol === 'eau' ? 0.6 + 0.6 * Math.min(1, eau / 0.3) : 1) / (1 + Math.max(0, loin - 5) * 0.12),
    });
  }
  const sorte = kon ? 2 : cote > 0 ? 0 : 1;
  // la traînée achetée au marchand : des pétales, des étoiles ou des feuilles à chaque pas
  if (!kon && M.trace) E.trace(M.trace, x, p.y, z, course);
  if (sol === 'eau') {
    // des gouttes jetées autour du pied, et un rond
    const niveau = M.lieu.eau.niveau || 0, k = Math.min(1, eau / 0.3);
    E.eclabousser(x, niveau, z, Math.round((kon ? 4 : 8) + k * (kon ? 5 : 10) * (course ? 1.5 : 1)), { sol: niveau, force: (kon ? 0.55 : 0.8) * (course ? 1.3 : 1) });
    if (!kon || cote > 0) E.rond(x, niveau, z, kon ? 0.45 : course ? 1 : 0.7, 1.3);
  } else if (sol === 'bois') {
    if (o.v > 0.12) E.empreinte(x, p.y + 0.02, z, p.cap, [0, 1, 0], sorte, { teinte: 0.45, force: o.v, duree: 7 });
  } else if (dansLaCarte(x, z)) {
    // dans le sable et dans la neige, on laisse ses pas (dans la neige, ils restent sept minutes) ; ailleurs,
    // seulement des traces mouillées en sortant de l'eau
    const n = normaleDuSol(x, z), y = solDessine(x, z);
    if (sol === 'neige') E.empreinte(x, y, z, p.cap, n, sorte, { teinte: -1, force: 1, duree: 420 });
    else if (sol === 'sable') E.empreinte(x, y, z, p.cap, n, sorte, { teinte: 0.58, force: 0.9, duree: 30 });
    else if (sol === 'estran') E.empreinte(x, y, z, p.cap, n, sorte, { teinte: 0.5, force: 1, duree: 26 });
    else if (o.v > 0.12) E.empreinte(x, y, z, p.cap, n, sorte, { teinte: 0.45, force: o.v * (sol === 'herbe' || sol === 'sousBois' ? 0.5 : 1), duree: 7 });
  }
}

/** Un passant pose un pied (cote : 1 gauche, −1 droit) : dans la neige, son empreinte reste. */
function pasDansLaNeige(q, cote) {
  const lx = Math.cos(q.cap), lz = -Math.sin(q.cap), fx = Math.sin(q.cap), fz = Math.cos(q.cap);
  const x = q.x + lx * cote * 0.085 + fx * 0.12, z = q.z + lz * cote * 0.085 + fz * 0.12;
  if (!dansLaCarte(x, z) || sousLesPieds(x, z, q.y).sol !== 'neige') return;
  M.effets.empreinte(x, solDessine(x, z), z, q.cap, normaleDuSol(x, z), cote > 0 ? 0 : 1, { teinte: -1, force: 1, duree: 420 });
}

/**
 * Mouillé : dans l'eau, tout ce qui est sous la ligne (la profondeur, plus les éclaboussures ; plus haut en
 * courant) ; dehors, ça sèche en quelques secondes (2 s, puis 8 s pour sécher), et ça dégoutte.
 */
function mouiller(o, eau, dt, haut, course) {
  if (eau > 0.03) {
    o.v = 1;
    o.hors = 0;
    o.ligne = Math.min(haut, Math.max(o.ligne, eau + 0.1 + (course ? 0.25 : 0)));
  } else {
    o.hors += dt;
    if (o.hors > 2) o.v = Math.max(0, o.v - dt / 8);
    if (o.v === 0) o.ligne = 0;
  }
}

/** Chaque image, en jeu : les pas, l'eau (mouillé, gouttes, ronds), le compagnon qui s'ébroue, et ce qu'on entend. */
function vivre(dt, temps, pasJoueur, pasKon) {
  if (dt <= 0) return;
  const L = M.lieu, E = M.effets, niveau = L.eau?.niveau || 0;
  if (pasJoueur) unPas('joueur', pasJoueur);
  if (pasKon) unPas('kon', pasKon);
  for (const [qui, p, haut, rayon] of [['joueur', etat, 1.45, 0.17], ['kon', renard, 0.55, 0.1]]) {
    // (la loutre qui nage flotte : sous elle, l'eau, jusqu'au fond)
    const o = mouille[qui], s = sousLesPieds(p.x, p.z, qui === 'kon' && renard.nage ? L.terrain(p.x, p.z) : p.y);
    mouiller(o, s.eau, dt, haut, qui === 'joueur' && etat.vitesse > MARCHE * 1.2);
    if (s.eau > 0.03) {
      // dans l'eau : des ronds autour des jambes (souvent en marchant, de temps en temps à l'arrêt)
      o.rond -= dt;
      if (o.rond <= 0) {
        const bouge = p.vitesse > 0.5;
        o.rond = bouge ? 0.32 : 1.5;
        E.rond(p.x, niveau, p.z, (bouge ? 0.85 : 0.6) * (qui === 'kon' ? 0.6 : 1), 1.7);
      }
    } else if (o.v > 0.2 && o.ligne > 0.08) {
      // l'eau dégoutte des habits (du pelage), d'autant moins qu'ils sèchent
      o.goutte -= dt * (qui === 'kon' ? 8 : 16) * o.v;
      while (o.goutte < 0) {
        o.goutte += 1;
        const a = Math.random() * Math.PI * 2;
        E.tomber(p.x + Math.cos(a) * rayon, p.y + 0.08 + Math.random() * (o.ligne - 0.08), p.z + Math.sin(a) * rayon, s.h + 0.03);
      }
    }
    // le compagnon sorti de l'eau s'ébroue (une fois), et le voilà presque sec
    if (qui === 'kon') {
      if (s.eau > 0.03) o.ebroue = false;
      else if (!o.ebroue && o.v > 0.6 && o.hors > 0.45 && (renard.vitesse < 1.5 || o.hors > 3)) {
        o.ebroue = true;
        M.kon.secouer();
        M.bruitage.ebrouer({ pan: panDe(renard.x, renard.z) });
        E.ebrouer(renard.x, renard.y, renard.z, s.h + 0.03);
        o.v = 0.3;
      }
    }
  }
  const mj = M.mouilleJoueur, mk = M.mouilleKon;
  mj.mouille.value = mouille.joueur.v; mj.ligne.value = mouille.joueur.ligne; mj.pied.value = etat.y;
  mk.mouille.value = mouille.kon.v; mk.ligne.value = mouille.kon.ligne; mk.pied.value = renard.y;

  // ce qu'on entend, dix fois par seconde : le vent ici (la rafale des arbres), les feuilles autour, la mer
  // (tous les tiers de seconde : où est l'eau la plus proche ?), les fumerolles, la nuit, quel oiseau
  oreille.dt += dt;
  if (oreille.dt < 0.1) return;
  const d = oreille.dt;
  oreille.dt = 0;
  const x = etat.x, z = etat.z, V = M.mats.vent;
  const vent = rafale(temps - (x * V.ventDir.value.x + z * V.ventDir.value.y) / VITESSE_RAFALE) * V.ventForce.value;
  const feuilles = M.feuillage(x, z);
  oreille.merDt += d;
  if (L.eau && oreille.merDt > 0.3) {
    oreille.merDt = 0;
    oreille.mer = { vagues: 0, pan: 0 };
    if (L.terrain(x, z) < niveau - 0.02) oreille.mer = { vagues: 1, pan: 0 };
    else {
      for (const r of [2, 4, 7, 11, 16, 23, 32, 44]) {
        let sx = 0, sz = 0, k = 0;
        for (let i = 0; i < 12; i++) {
          const a = (i * Math.PI) / 6, px = x + Math.sin(a) * r, pz = z + Math.cos(a) * r;
          if (L.terrain(px, pz) < niveau - 0.02) { sx += Math.sin(a); sz += Math.cos(a); k++; }
        }
        if (k) { oreille.mer = { vagues: 1 - Math.min(1, Math.max(0, (r - 2) / 46)) ** 0.8, pan: panDe(x + sx / k, z + sz / k) * 0.7 }; break; }
      }
    }
  }
  let vapeur = 0, panVapeur = 0, fort = 0;
  for (const v of L.vapeurs || []) {
    const k = ((v.n || 6) / 10) / (1 + ((v.x - x) ** 2 + (v.z - z) ** 2) / 25);
    vapeur += k;
    if (k > fort) { fort = k; panVapeur = panDe(v.x, v.z); }
  }
  const oiseaux = L.oiseaux || [];
  const oiseau = oiseaux.includes('uguisu') && feuilles > 0.3 && Math.random() < 0.7 ? 'uguisu' : oiseaux.includes('milan') ? 'milan' : null;
  // les musiciens d'une scène (le nō d'Itsukushima) : on les entend en s'approchant, et la musique de la balade baisse
  const sc = L.musiciens, no = sc ? 1 - lisse(sc.pres, sc.loin, Math.hypot(sc.x - x, sc.z - z)) : 0;
  M.bruitage.ambiance({ vent, feuilles, vagues: oreille.mer.vagues, panVagues: oreille.mer.pan, vapeur: Math.min(1, vapeur), panVapeur, nuit: M.nuit.v, oiseau, no, panNo: sc ? panDe(sc.x, sc.z) : 0 }, d);
  M.musique.maj(M.nuit.v, 1 - 0.8 * no);
}

function dessiner(dt, temps) {
  const { joueur, autre, kon, lieu } = M;
  joueur.objet.position.set(etat.x, etat.y, etat.z);
  joueur.objet.rotation.y = etat.cap;
  const pasJoueur = joueur.animer(dt, etat.vitesse, temps);
  if (autre.objet.visible) {
    // l'autre voyageur, à droite du premier (pour l'objectif)
    const ax = etat.x + Math.cos(etat.cap) * 1.15, az = etat.z - Math.sin(etat.cap) * 1.15;
    autre.objet.position.set(ax, lieu.monde.hauteur(ax, az), az);
    autre.objet.rotation.y = etat.cap - 0.15;
    autre.animer(dt, 0, temps + 0.7);
  }
  let pasKon = 0;
  if (trio.actif) {
    // le choix du compagnon : les trois en rang (ceux qui sont partis dans leur nuage, cachés)
    trio.liste.forEach((e, i) => {
      const c = M.compagnons[e], q = trio.places[i];
      if (!c.objet.visible) return;
      c.objet.position.set(q.x, q.y, q.z);
      c.objet.rotation.y = q.cap;
      c.animer(dt, 0, temps + i * 0.9);
    });
  } else {
    kon.objet.position.set(renard.x, renard.y, renard.z);
    kon.objet.rotation.y = renard.cap;
    pasKon = kon.animer(dt, renard.vitesse, temps, renard.nage);
  }
  for (const p of M.passants) {
    p.perso.objet.position.set(p.etat.x, p.etat.y, p.etat.z);
    p.perso.objet.rotation.y = p.etat.cap;
    const pied = p.perso.animer(dt, p.etat.v, temps + p.x);
    // (l'hiver du calendrier : les passants aussi laissent leurs pas dans la neige)
    if (pied && p.etat.v > 0.2 && M.mats.saisons.value.z > 0.5) pasDansLaNeige(p.etat, pied);
  }
  // la nuit, les daims se couchent (chacun à son tour)
  for (const d of M.daims) {
    const voulu = M.nuit.v > 0.5 ? 1 : 0;
    d.couche += Math.sign(voulu - d.couche) * Math.min(Math.abs(voulu - d.couche), dt * d.vitesseCouche);
    d.b.animer(dt, temps, lisse(0, 1, d.couche));
  }
  // les mouettes : leurs cris, plus doux de loin (ni pendant le départ, ni sur une image fixe)
  if (M.mouettes) {
    for (const c of M.mouettes.animer(dt, temps, etat, renard, M.nuit.v)) {
      const d = Math.hypot(c.x - camera.position.x, c.y - camera.position.y, c.z - camera.position.z), force = c.fort / (1 + Math.max(0, d - 10) * 0.07);
      if (!PHOTO && etat.mode !== 'depart' && force > 0.1) M.bruitage.oiseau('mouette', { force, pan: panDe(c.x, c.z) });
    }
  }
  // les bêtes : leurs cris, plus doux de loin
  if (M.betes) {
    for (const c of M.betes.animer(dt, temps, etat, renard, M.nuit.v, etat.mode !== 'jeu')) {
      const d = Math.hypot(c.x - camera.position.x, c.y - camera.position.y, c.z - camera.position.z), force = c.fort / (1 + Math.max(0, d - 6) * 0.12);
      if (PHOTO || etat.mode === 'depart' || force < 0.08) continue;
      if (c.nom === 'miaou') M.bruitage.bete('miaou', { force, pan: panDe(c.x, c.z) });
      else M.bruitage.oiseau(c.nom, { force, pan: panDe(c.x, c.z) });
    }
  }
  if (M.sauvage) {
    const s = M.sauvage;
    s.d.animer(dt, temps);
    if (s.fuite) {
      s.t += dt;
      const ang = etat.cap + 0.9;
      s.x += Math.sin(ang) * dt * 7;
      s.z += Math.cos(ang) * dt * 7;
      s.d.objet.rotation.y = ang;
      s.d.objet.position.set(s.x, lieu.monde.hauteur(s.x, s.z) + Math.abs(Math.sin(s.t * 12)) * 0.35, s.z);
    }
  }
  // ce que le lieu anime (son secret) : les cris qui vont avec ; une scène à jouer quand on est libre
  for (const a of lieu.animes || []) {
    for (const c of a.maj(dt, temps, contexteAnime) || []) {
      const d = Math.hypot(c.x - camera.position.x, c.y - camera.position.y, c.z - camera.position.z), force = (c.fort ?? 1) / (1 + Math.max(0, d - 8) * 0.1);
      if (!PHOTO && etat.mode !== 'depart' && force > 0.08 && c.nom) M.bruitage.oiseau(c.nom, { force, pan: panDe(c.x, c.z) });
    }
  }
  if (scenes.length && etat.mode === 'jeu' && !dialogue.ouvert()) jouerScene(scenes.shift());
  // le marchand : il se tourne vers le voyageur qui lui parle, le regarde quand il approche
  if (M.marchand) {
    const mq = M.marchand, o = mq.perso.objet;
    o.rotation.y = tourner(o.rotation.y, mq.capVoulu, dt * 3);
    const d = Math.hypot(etat.x - mq.x, etat.z - mq.z), a = Math.atan2(etat.x - mq.x, etat.z - mq.z) - o.rotation.y;
    mq.perso.animer(dt, temps, d < 7 ? Math.atan2(Math.sin(a), Math.cos(a)) : null);
    if (d > 4 && etat.mode === 'jeu') mq.capVoulu = mq.cap;
  }
  M.feux.maj(dt, M.focale);
  M.chutes.maj(dt, temps, camera.position, M.focale, M.nuit.v);
  // la saison du calendrier : les couleurs changent en fondu
  const sv = M.mats.saisons.value, sc = M.saisonCible || [0, 0, 0], ks = Math.min(1, dt * 1.1);
  sv.set(sv.x + (sc[0] - sv.x) * ks, sv.y + (sc[1] - sv.y) * ks, sv.z + (sc[2] - sv.z) * ks);
  M.touffes.groupe.visible = sv.z < 0.5;
  // l'éclat d'un feu d'artifice : la lumière du ciel prend sa couleur un instant
  if (M.flash.v > 0) {
    M.flash.v = Math.max(0, M.flash.v - dt * 3.2);
    M.hemi.intensity = M.hemiBase.intensite + 1.4 * M.flash.v;
    M.hemi.color.copy(M.hemiBase.couleur).lerp(M.flash.c, Math.min(0.7, M.flash.v));
  }
  if (M.eau) M.eau.material.uniforms.temps.value = temps;
  if (M.vapeurs) M.vapeurs.material.uniforms.temps.value = temps;
  M.etoiles.material.uniforms.temps.value = temps;
  M.touffes.majTouffes(temps, camera);
  M.mats.vent.ventTemps.value = temps;
  if (!PHOTO && etat.mode !== 'depart') vivre(dt, temps, pasJoueur, pasKon);
  M.effets.maj(dt, temps, M.focale, M.nuit.v);
  const N = M.nuit;
  if (N.v !== N.cible) {
    N.v += Math.sign(N.cible - N.v) * Math.min(Math.abs(N.cible - N.v), dt * 0.75);
    appliquerNuit(N.v);
  }
  M.lueurs.maj(N.v, toile.height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)), camera);
  if (N.fin && N.v === N.cible) { const fin = N.fin; N.fin = null; fin(); }

  // la caméra derrière le joueur. Sous un toit (une galerie), elle se rapproche et passe sous le plafond ;
  // elle s'arrête devant un bâtiment ou un toit (monde.visee) ; jamais sous le sol ni sous l'eau
  // (les deux voyageurs du choix du départ : entre eux, et de plus loin sur un écran en hauteur)
  const monde = lieu.monde;
  const champ = M.cadre?.champ ?? champBase;
  if (camera.fov !== champ) { camera.fov = champ; camera.updateProjectionMatrix(); }
  if (M.cadre) {
    // la caméra posée ailleurs (les jumelles, le choix du compagnon)
    camera.position.copy(M.cadre.de);
    camera.lookAt(M.cadre.vers);
    camera.userData.place = false;
  } else {
  const deux = autre.objet.visible, ap = autre.objet.position;
  const vise = deux ? new THREE.Vector3((etat.x + ap.x) / 2, etat.y + 1.05, (etat.z + ap.z) / 2) : new THREE.Vector3(etat.x, etat.y + 1.15, etat.z);
  const abri = monde.abri(etat.x, etat.z, vise.y);
  let distance = cam.distance * (deux && innerWidth < innerHeight ? 1.55 : 1), tangage = cam.tangage;
  if (abri < Infinity) {
    distance = Math.min(distance, 4.8);
    tangage = Math.min(tangage, Math.asin(Math.min(1, Math.max(-0.25, (abri - 0.4 - vise.y) / distance))));
  }
  const saut = PHOTO || !camera.userData.place;
  vue.tangage = saut ? tangage : vue.tangage + (tangage - vue.tangage) * (1 - Math.exp(-dt * 4));
  const cp = Math.cos(vue.tangage);
  const dir = new THREE.Vector3(Math.sin(cam.lacet) * cp, Math.sin(vue.tangage), Math.cos(cam.lacet) * cp);
  const libre = Math.max(1.2, monde.visee(vise, dir, distance));
  // elle se rapproche d'un coup (sans traverser le mur), et recule doucement
  vue.distance = saut || libre < vue.distance ? libre : vue.distance + (libre - vue.distance) * (1 - Math.exp(-dt * 2.5));
  const voulu = vise.clone().addScaledVector(dir, vue.distance);
  const plancher = Math.max(monde.hauteur(voulu.x, voulu.z, etat.y + 1), lieu.eau ? lieu.eau.niveau || 0 : -Infinity);
  voulu.y = Math.max(voulu.y, plancher + 0.45);
  if (saut) { camera.position.copy(voulu); camera.userData.place = true; } else camera.position.lerp(voulu, 1 - Math.exp(-dt * 12));
  camera.lookAt(vise);
  // (les feux d'artifice : elle lève les yeux vers le spectacle, le voyageur en bas de l'image ; s'il est devant)
  vue.leve += ((M.regardHaut ? 1 : 0) - vue.leve) * (1 - Math.exp(-dt * 2.2));
  if (vue.leve > 0.002 && M.dernierRegard) {
    const R = M.dernierRegard, q = camera.position, hv = Math.hypot(vise.x - q.x, vise.z - q.z) || 1, h = Math.hypot(R.x - q.x, R.z - q.z) || 1;
    const fx = (vise.x - q.x) / hv, fz = (vise.z - q.z) / hv;
    if (((R.x - q.x) * fx + (R.z - q.z) * fz) / h > 0.4) {
      const aTete = Math.atan2(vise.y - q.y, hv), aVers = Math.min(Math.atan2(R.y - q.y, h), aTete + THREE.MathUtils.degToRad(camera.fov / 2) * 0.72);
      const phi = aTete + Math.max(0, aVers - aTete) * vue.leve;
      camera.lookAt(q.x + fx * Math.cos(phi), q.y + Math.sin(phi), q.z + fz * Math.cos(phi));
    }
  }
  }
  M.ciel.position.copy(camera.position);
  // ce qui cache le joueur s'efface en pointillés (styles.js) ; un passant collé à la caméra s'efface tout entier
  M.mats.coupe.oeil.value.copy(camera.position);
  M.mats.coupe.cible.value.set(etat.x, etat.y + 0.95, etat.z);
  for (const p of M.passants) p.perso.objet.visible = Math.hypot(camera.position.x - p.etat.x, camera.position.z - p.etat.z) > 1.1;

  // le soleil suit le joueur (les ombres se calculent autour de lui), par pas d'un texel de la carte d'ombres :
  // sinon, à chaque pas du joueur, les bords des ombres glissent d'une fraction de texel et scintillent
  const s = new THREE.Vector3(...lieu.soleil).normalize();
  const ax = new THREE.Vector3(0, 1, 0).cross(s).normalize(), ay = new THREE.Vector3().crossVectors(s, ax);
  const texel = (M.soleil.shadow.camera.right - M.soleil.shadow.camera.left) / M.soleil.shadow.mapSize.x;
  const ici = new THREE.Vector3(etat.x, etat.y, etat.z), cale = (v) => Math.round(v / texel) * texel;
  const pose = s.clone().multiplyScalar(ici.dot(s)).addScaledVector(ax, cale(ici.dot(ax))).addScaledVector(ay, cale(ici.dot(ay)));
  M.soleil.target.position.copy(pose);
  M.soleil.position.copy(pose).addScaledVector(s, 140);

  // la bulle « A · Parler » au-dessus de ce qu'on peut faire
  cible = etat.mode === 'jeu' && !PHOTO ? cibleProche() : null;
  const bulle = $('.bulle-action');
  if (cible) {
    const v = new THREE.Vector3(cible.x, cible.y + cible.haut, cible.z).project(camera);
    bulle.hidden = v.z > 1;
    bulle.style.transform = `translate(${((v.x + 1) / 2) * innerWidth}px, ${((1 - v.y) / 2) * innerHeight}px) translate(-50%, -100%)`;
    const verbe = t(cible.verbe);
    if (bulle.dataset.verbe !== verbe) { bulle.querySelector('span').textContent = verbe; bulle.dataset.verbe = verbe; }
  } else bulle.hidden = true;
  $('.bouton-a').classList.toggle('pret', !!cible);
  document.body.classList.toggle('occupe', etat.mode !== 'jeu');

  // l'image : la scène lissée, puis la passe finale à l'écran (le lointain flou)
  M.finale.rendre(rendu, scene, camera);
}

let champBase = 48;
function dimensionner() {
  const l = innerWidth, h = innerHeight;
  rendu.setSize(l, h, false);
  // en portrait, un champ plus large : on voit à peu près autant de décor qu'en paysage
  champBase = l < h ? 62 : 48;
  camera.fov = M?.cadre?.champ ?? champBase;
  camera.aspect = l / h;
  camera.updateProjectionMatrix();
  if (!M) return;
  const tw = toile.width, th = toile.height, pr = rendu.getPixelRatio();
  M.finale.dimensionner(tw, th);
  M.mats.ecran.value.set(tw, th);
  // le trait : quelques pixels CSS, un peu plus épais sur un grand écran (un trait de 1 px sur 4K ne se voit plus)
  const echelle = Math.min(1.6, Math.max(0.85, Math.min(l, h * 1.6) / 1100));
  M.mats.epaisseurs.decor.value = M.style.trait.px * echelle * pr;
  M.mats.epaisseurs.perso.value = M.style.trait.perso * echelle * pr;
  M.etoiles.material.uniforms.echelle.value = pr;
  M.focale = th / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
  if (M.vapeurs) M.vapeurs.material.uniforms.hauteurEcran.value = th;
}
addEventListener('resize', () => {
  dimensionner();
  if (etat.mode === 'tenue') { const cap = etat.cap; cadrerDeFace(); etat.cap = cap; }
});

// ---------------------------------------------------------------- C'est parti
async function depart() {
  const lieu = nomDe(M.lieu);
  if (!sorte) {
    // la première fois, comme dans les jeux : es-tu un garçon ou une fille ? (les deux voyageurs face à l'objectif)
    const r = await dialogue.choisir(t('bienvenue')(lieu), [t('garcon'), t('fille')], { obligatoire: true });
    sorte = r === 1 ? 'fille' : 'garcon';
    memoire.ecrire('baladePerso', sorte);
    choisirVoyageur(sorte);
    M.joueur.saluer();
    await attendre(600);
  } else await dialogue.dire(t('revoila')(lieu));
  if (COMPAGNON_IMPOSE) {
    await dialogue.dire(tc('salut')(M.lieu.tampons.length), { qui: tc('nom') });
    await offrirRecompenses();
    etat.mode = 'jeu';
    return;
  }
  // puis, à chaque visite, le compagnon : les trois en rang ; celui qu'on marque bondit, crie, et se présente
  cadrerTrio();
  M.bruitage.preparer();
  const L3 = trio.liste, crier = (i) => { const q = trio.places[i]; M.compagnons[L3[i]].sauter(); M.bruitage.cri(L3[i], { force: 0.8, pan: (i - (L3.length - 1) / 2) * 0.35 }); return q; };
  const r = await dialogue.choisir(t('compagnonQuestion'), L3.map((e) => tcDe(e, 'nom')), {
    depart: Math.max(0, L3.indexOf(espece)), obligatoire: true, grille: true,
    survol: (i) => { crier(i); return tcDe(L3[i], 'choix'); },
  });
  const choisi = L3[r], q = trio.places[r];
  memoire.ecrire('baladeCompagnon', choisi);
  // les autres s'en vont dans un petit nuage (comme les renards et les tanuki des contes)
  trio.places.forEach((p, i) => { if (i !== r) { M.effets.nuage(p.x, p.y, p.z); M.compagnons[L3[i]].objet.visible = false; } });
  M.bruitage.pouf();
  trio.actif = false;
  choisirCompagnon(choisi);
  Object.assign(renard, { x: q.x, z: q.z, y: q.y, cap: q.cap, vitesse: 0, nage: false });
  await attendre(500);
  crier(r);
  await attendre(300);
  await dialogue.dire(tc('salut')(M.lieu.tampons.length), { qui: tc('nom') });
  // la caméra passe derrière le voyageur, tourné vers le lieu
  M.cadre = null;
  etat.cap = M.lieu.depart.cap;
  Object.assign(cam, { lacet: etat.cap + Math.PI, tangage: 0.24, distance: 6.4 });
  camera.userData.place = false;
  await offrirRecompenses();
  etat.mode = 'jeu';
  setTimeout(() => $('.aide').classList.add('vue'), 9000);
}

document.body.classList.toggle('photo', !!PHOTO);
document.body.classList.toggle('tactile', tactile);
// le chargement s'affiche avant de construire (quelques centaines de millisecondes, plus sur téléphone)
$('.chargement p').textContent = t('chargement');
await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
construire();
majInterface();
if (PHOTO === 'perso' || (!sorte && !PHOTO && !DEMO)) cadrerLesDeux(); else placer();
$('.chargement').hidden = true;
window.balade = { scene, rendu, camera, monde: () => M, etat, cam, renard, jeu, ouvrirBoutique, commencerDanse, lancerFeux, ouvrirPhoto, changerSaison, photo }; // (pour les essais)

/**
 * La qualité qui s'adapte : si l'image peine (la moitié des images de 2 s en plus de 22 ms, moins de 45 par
 * seconde), moins de pixels (×0,8 à chaque fois, jusqu'à la moitié) ; jamais pendant les 4 premières
 * secondes (le chargement), ni la page cachée. Un ordinateur à puce graphique modeste reste fluide, l'image un
 * peu moins fine.
 */
const qualite = { base: rendu.getPixelRatio(), niveau: 0, ecarts: [], debut: performance.now() };
function adapter(ecart) {
  if (PHOTO || document.hidden || performance.now() - qualite.debut < 4000 || qualite.niveau >= 3) return;
  qualite.ecarts.push(ecart);
  if (qualite.ecarts.length < 120) return;
  const tri = qualite.ecarts.sort((a, b) => a - b), mediane = tri[tri.length >> 1];
  qualite.ecarts = [];
  if (mediane < 22) return;
  qualite.niveau++;
  rendu.setPixelRatio(Math.max(0.5 * qualite.base, qualite.base * 0.8 ** qualite.niveau));
  dimensionner();
}
let avant = performance.now(), temps = 0, images = 0;
// ?demo : une partie jouée toute seule, image par image (window.__pas(dt, touches)), pour la filmer
if (DEMO) {
  etat.mode = 'jeu';
  window.__pas = (dt, codes = []) => {
    temps += dt;
    touches.clear();
    for (const c of codes) touches.add(c);
    avancer(dt);
    dessiner(dt, temps);
  };
  window.__agir = () => agir();
  window.__appuyer = () => dialogue.appuyer();
  for (let i = 0; i < 3; i++) dessiner(0, 0);
  window.__pret = true;
} else {
  rendu.setAnimationLoop((now) => {
    const dt = Math.min(0.05, (now - avant) / 1000);
    adapter(now - avant);
    avant = now;
    if (PHOTO) temps = 1.2; else { temps += dt; avancer(dt); }
    dessiner(PHOTO ? 0 : dt, temps);
    if (++images === 4) window.__pret = true;
  });
  if (!PHOTO) depart();
}
