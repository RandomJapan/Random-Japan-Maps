// ================================================================
//  La balade 3D : visiter un lieu du Japon avec un personnage vu de dos, comme dans un jeu vidéo, dans le
//  style des Pokémon (le rendu lisse de X et Y, boîte de dialogue, des gens à qui parler, des tampons à
//  collectionner dans un carnet). Kon, le renard d'Inari, suit le joueur et lui souffle des indices.
//  ZQSD ou WASD (les touches de la même place sur tous les claviers) ou les flèches : marcher ; Maj : courir ;
//  E, Espace ou Entrée : parler, lire (le bouton A) ; glisser : tourner la caméra ; molette : l'approcher ;
//  C : le carnet ; Échap : fermer. Sur téléphone, un joystick en bas à gauche et un bouton A en bas à droite.
//  On entend ses pas (selon le sol), le vent dans les arbres, la mer, les fumerolles (bruitage.js) ; dans
//  l'eau, on éclabousse et l'on ressort mouillé (effets.js).
//  ?lieu=itsukushima|aogashima ; ?perso=garcon|fille ; ?langue=en|fr|ja ;
//  ?photo=heros|perso : une image fixe (captures) ; ?demo : une partie jouée image par image (vidéos) ;
//  ?ciel=parchemin : un essai du style (styles.js) ; ?flou=0 : sans le flou du lointain ; ?aa=0 : sans anticrénelage.
// ================================================================
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.min.js';
import { ateliers } from '../modeles3d.js';
import { MATIERES } from './textures.js';
import { creerStyle, matieresStyle, passeFinale, rafale, VENT_GLSL, VITESSE_RAFALE } from './styles.js';
import { creerVoyageur, creerPersonnage, creerRenard, creerDaim } from './personnages.js';
import { creerPassant, avancerPassant, tourner } from './monde.js';
import { TEXTES, LANGUES, choisirLangue } from './textes.js';
import { creerDialogue } from './dialogue.js';
import { creerCarnet, dessinTampon, aLeTampon, ajouterTampon, lireTampons } from './carnet.js';
import { son } from './son.js';
import { creerBruitage } from './bruitage.js';
import { creerEffets } from './effets.js';
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
let M = null; // { style, ctx, mats, lieu, groupe, voyageurs, joueur, autre, kon, passants, daims, eau, ciel, soleil, finale, sauvage }
const etat = { x: 0, z: 0, y: 0, cap: 0, vitesse: 0, vx: 0, vz: 0, mode: 'depart' };
const renard = { x: 0, z: 0, y: 0, cap: 0, vitesse: 0 };
// la caméra voulue (le joueur la tourne) ; vue : celle qu'on a, rapprochée sous un toit ou devant un bâtiment
const cam = { lacet: 0, tangage: 0.24, distance: 6.4 };
const vue = { tangage: 0.24, distance: 6.4 };

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
  const ctx = { THREE, atelier: ateliers(THREE, style.repeindre, style.matieres), P, peinture: style.peinture, maillage };
  const ctxPerso = { ...ctx, maillage: maillageDe(mats.corpsPerso, mats.traitPerso) };
  // le joueur et Kon se mouillent dans l'eau : chacun sa matière (les passants restent secs)
  const mouilleJoueur = mats.persoMouille(P.peau), mouilleKon = mats.persoMouille();
  const ctxJoueur = { ...ctx, maillage: maillageDe(mouilleJoueur.materiel, mats.traitPerso) };
  const ctxKon = { ...ctx, maillage: maillageDe(mouilleKon.materiel, mats.traitPerso) };
  const lieu = LIEUX[LIEU].construire(ctx);
  // le vent du lieu : d'où il pousse, sa force
  mats.vent.ventDir.value.set(...(lieu.vent?.dir || [0.6, 0.8])).normalize();
  mats.vent.ventForce.value = lieu.vent?.force ?? 1;
  for (const o of lieu.objets) {
    const m = maillage(o.fin, o.ombre);
    m.position.set(o.x, o.y, o.z);
    m.rotation.y = o.ry;
    groupe.add(m);
  }
  const carte = carteDuSol(lieu, lieu.etendue.fin);
  mats.carte.carteSol.value = carte.texture;
  mats.carte.zoneSol.value.set(carte.x0, carte.z0, carte.pas, 1);
  mats.carte.tailleSol.value.set(carte.nx, carte.nz);
  groupe.add(terrain(lieu, mats, lieu.etendue, 0, lieu.etendue.fin), terrain(lieu, mats, lieu.etendue.fin, 0.03, null, carte));
  const touffes = creerTouffes(lieu, carte, mats);
  groupe.add(touffes.groupe);
  const eau = lieu.eau ? creerEau(lieu, P) : null;
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
  const voyageurs = { garcon: creerVoyageur(ctxJoueur, 'garcon'), fille: creerVoyageur(ctxJoueur, 'fille') };
  const kon = creerRenard(ctxKon);
  for (const v of [voyageurs.garcon, voyageurs.fille, kon]) { groupe.add(v.objet); sansOmbreRecue(v.objet); }
  const passants = lieu.passants.map((p) => {
    const perso = creerPersonnage(ctxPerso, p.tenue);
    groupe.add(perso.objet);
    sansOmbreRecue(perso.objet);
    const etatP = creerPassant(p);
    etatP.y = lieu.monde.hauteur(p.x, p.z);
    return { ...p, perso, etat: etatP };
  });
  const daims = lieu.daims.map((d, i) => {
    const b = creerDaim(ctx, d.male, [0, 0.95, 0.5, 0.25, 0.7][i] ?? i * 0.37);
    b.objet.position.set(d.x, lieu.monde.hauteur(d.x, d.z), d.z);
    b.objet.rotation.y = d.cap;
    groupe.add(b.objet);
    lieu.monde.cercle(d.x, d.z, 0.7);
    return { ...d, b };
  });
  const effets = creerEffets(THREE);
  groupe.add(effets.groupe);
  scene.add(groupe);
  M = {
    carte, effets, mouilleJoueur, mouilleKon, feuillage: densiteFeuillage(lieu), bruitage: creerBruitage({ oiseaux: lieu.oiseaux || [], ambiances: lieu.ambiances || [] }), focale: 800,
    style, ctx, mats, lieu, groupe, voyageurs, kon, passants, daims, eau, ciel, soleil, hemi, etoiles, vapeurs, touffes, finale: passeFinale(THREE, style, { echantillons: params.get('aa') === '0' ? 0 : 4, flou: params.get('flou') !== '0' }), cible: null, sauvage: null, nuit: { v: 0, cible: 0, fin: null } };
  choisirVoyageur(sorte || 'garcon');
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

/**
 * Le sol : une grille de hauteurs (le terrain du lieu), aux couleurs du lieu et avec ses matières (styles.js).
 * Une grille fine autour du jeu, posée sur la grande ; la grande a un trou dessous (trou : l'étendue de la
 * fine), sinon, dans les creux (un cratère, un escalier taillé dans la pente), ses grandes facettes la percent.
 * carte : la carte du sol (carteDuSol), d'où la grille fine prend ses couleurs sans les recalculer.
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
      if (trou) {
        const x0 = e.x0 + i * e.pas, z0 = e.z0 + j * e.pas, x1 = x0 + e.pas, z1 = z0 + e.pas;
        if (x0 >= trou.x0 && x1 <= trou.x1 && z0 >= trou.z0 && z1 <= trou.z1) continue;
      }
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
function creerEau(lieu, P) {
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
      float hasard2(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      void main() {
        float t = smoothstep(0.05, 1.6, vProf);
        vec3 c = mix(clair, profond, t);
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
        gl_FragColor = vec4(c, a);
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
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
}

// ---------------------------------------------------------------- Les textes, l'interface
const textesDe = (L, cle) => L.textes[langue]?.[cle] ?? L.textes.en[cle];
const tx = (cle) => textesDe(M.lieu, cle);
const nomDe = (L) => L.nom[langue] || L.nom.en;
const nomQui = (qui) => (qui === 'kon' ? t('kon') : tx('noms')?.[qui] || '');
const texteTampon = (L, tp) => {
  const [nom, indice] = textesDe(L, 'tampons')[tp.id];
  return { nom, indice };
};

const dialogue = creerDialogue({ boite: $('.dialogue'), nom: $('.dialogue-nom'), texte: $('.dialogue-texte'), suite: $('.dialogue-suite'), choix: $('.dialogue-choix') }, son);
// le carnet montre tous les lieux, dans l'ordre de LIEUX (leurs infos suffisent : pas besoin de les construire)
const carnet = creerCarnet({ fond: $('.fond-carnet'), page: $('.carnet') }, {
  lieux: () => Object.values(LIEUX).map(({ infos: L }) => ({ id: L.id, nom: nomDe(L), nomJa: L.nomJa, tampons: L.tampons, textes: L.textes })),
  t, texteLieu: texteTampon,
});

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
  if (e.code === 'Escape') { fermerTout(); return; }
  if (etat.mode !== 'jeu') return;
  if (ACTION.includes(e.code)) { e.preventDefault(); if (!e.repeat) agir(); return; }
  if (e.key === 'c' || e.key === 'C') { ouvrirCarnet(); return; }
  touches.add(e.code);
  if (e.code.startsWith('Arrow')) e.preventDefault();
});
addEventListener('keyup', (e) => touches.delete(e.code));
addEventListener('blur', () => touches.clear());
const appuye = (...codes) => codes.some((c) => touches.has(c));

// la caméra : on la fait tourner en glissant (souris ou doigt hors du joystick) ; un appui sans glisser parle
let glisse = null;
toile.addEventListener('pointerdown', (e) => {
  son.reveiller();
  if (dialogue.ouvert()) { dialogue.appuyer(); return; }
  if (glisse) return;
  glisse = { id: e.pointerId, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY };
  try { toile.setPointerCapture(e.pointerId); } catch { /* un pointeur déjà levé */ }
});
toile.addEventListener('pointermove', (e) => {
  if (!glisse || e.pointerId !== glisse.id) return;
  cam.lacet -= (e.clientX - glisse.x) * 0.0062;
  cam.tangage = Math.min(1.25, Math.max(-0.05, cam.tangage + (e.clientY - glisse.y) * 0.0045));
  glisse.x = e.clientX;
  glisse.y = e.clientY;
});
const lacher = (e) => { if (glisse && e.pointerId === glisse.id) glisse = null; };
toile.addEventListener('pointerup', lacher);
toile.addEventListener('pointercancel', lacher);
toile.addEventListener('wheel', (e) => { cam.distance = Math.min(14, Math.max(3.2, cam.distance * (1 + Math.sign(e.deltaY) * 0.1))); e.preventDefault(); }, { passive: false });

// le joystick et le bouton A (écrans tactiles)
const manette = $('.joystick');
const bouton = manette.querySelector('span');
manette.addEventListener('pointerdown', (e) => {
  son.reveiller();
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
  else if (etat.mode === 'jeu') agir();
});
$('.bulle-action').addEventListener('pointerdown', (e) => { e.preventDefault(); if (etat.mode === 'jeu') agir(); });

// le carnet, le menu
$('.btn-carnet').addEventListener('click', () => ouvrirCarnet());
$('.btn-menu').addEventListener('click', () => ouvrirMenu());
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
  if (etat.mode === 'carnet' || etat.mode === 'menu') etat.mode = 'jeu';
}

function ouvrirMenu() {
  if (etat.mode !== 'jeu' && etat.mode !== 'menu') return;
  const choix = (cle, valeurs, actuel) => `<div class="menu-ligne"><span>${t(cle)}</span><div>${valeurs.map(([v, nom]) => `<button type="button" data-${cle.toLowerCase()}="${v}" class="${v === actuel ? 'actif' : ''}">${nom}</button>`).join('')}</div></div>`;
  $('.menu').innerHTML = `
    <button type="button" class="menu-carnet">${t('carnet')} <small>${$('.carnet-n').textContent}</small></button>
    ${choix('menuVoyageur', [['garcon', t('garcon')], ['fille', t('fille')]], sorte)}
    ${choix('menuLieu', Object.entries(LIEUX).map(([id, { infos }]) => [id, nomDe(infos)]), M.lieu.id)}
    ${choix('menuSon', [['oui', t('sonOui')], ['non', t('sonNon')]], son.actif() ? 'oui' : 'non')}
    ${choix('menuLangue', [['en', 'EN'], ['fr', 'FR'], ['ja', '日本語']], langue)}
    <a class="menu-carte" href="../#${M.lieu.carte}">${t('menuCarte')}</a>`;
  $('.fond-menu').hidden = false;
  etat.mode = 'menu';
}
$('.menu').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.classList.contains('menu-carnet')) { fermerTout(); ouvrirCarnet(); return; }
  const d = b.dataset;
  if (d.menuvoyageur) {
    sorte = d.menuvoyageur;
    memoire.ecrire('baladePerso', sorte);
    choisirVoyageur(sorte);
  } else if (d.menulieu) {
    if (d.menulieu !== M.lieu.id) { location.search = `?lieu=${d.menulieu}`; return; }
  } else if (d.menuson) son.regler(d.menuson === 'oui');
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
    const avant = etat.mode;
    etat.mode = 'video';
    const fermer = () => {
      clearTimeout(relance);
      removeEventListener('message', ecoute);
      $('.fond-video').hidden = true;
      lecteur.innerHTML = '';
      M.bruitage.couper(false);
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
/** Ce qui est à portée et devant le joueur (gens, panneaux, objets, daims, Kon), le mieux placé d'abord. */
function cibleProche() {
  const L = M.lieu;
  const cands = [];
  for (const i of L.interactions) {
    if (i.passant) {
      const p = M.passants.find((q) => q.id === i.passant);
      cands.push({ ...i, x: p.etat.x, z: p.etat.z, y: p.etat.y, rayon: 1.8, haut: 1.95 * (p.tenue.taille || 1), p });
    } else {
      // pres(x, z) : un endroit qui suit le joueur (le long d'une corde…), sinon le point fixe de l'interaction
      const q = i.pres ? { ...i, ...i.pres(etat.x, etat.z) } : i;
      cands.push({ ...q, y: q.y ?? L.monde.hauteur(q.x, q.z), haut: q.haut || 2.1 });
    }
  }
  for (const d of M.daims) cands.push({ x: d.x, z: d.z, y: L.monde.hauteur(d.x, d.z), rayon: 1.9, verbe: 'caresser', haut: 1.55, action: L.actionDaim });
  cands.push({ x: renard.x, z: renard.z, y: renard.y, rayon: 1.4, verbe: 'parler', haut: 0.95, action: parlerKon, kon: true });
  let meilleur = null, score = Infinity;
  const fx = Math.sin(etat.cap), fz = Math.cos(etat.cap);
  for (const c of cands) {
    const dx = c.x - etat.x, dz = c.z - etat.z, d = Math.hypot(dx, dz);
    if (d > (c.rayon || 1.6) || Math.abs(c.y - etat.y) > 1.3) continue;
    const devant = d > 0.01 ? (dx * fx + dz * fz) / d : 1;
    if (d > 0.9 && devant < 0.2) continue;
    const s = d * (1.6 - devant) + (c.kon ? 1.2 : 0); // Kon passe après le reste
    if (s < score) { score = s; meilleur = c; }
  }
  return meilleur;
}

let cible = null;
async function agir() {
  const c = cible;
  if (!c || etat.mode !== 'jeu') return;
  etat.mode = 'dialogue';
  touches.clear();
  etat.vx = etat.vz = 0;
  etat.cap = Math.atan2(c.x - etat.x, c.z - etat.z);
  if (c.p) c.p.etat.parle = true;
  try {
    await c.action(jeu);
  } finally {
    if (c.p) { c.p.etat.parle = false; c.p.perso.saluer(); }
    etat.mode = 'jeu';
  }
}

/** Kon souffle où est le prochain tampon. */
async function parlerKon() {
  const L = M.lieu;
  const manque = L.tampons.find((tp) => !aLeTampon(L.id, tp.id));
  if (!manque) { await dialogue.dire(t('konTout'), { qui: t('kon') }); return; }
  await dialogue.dire([t('konIndice'), t('konOu')(texteTampon(L, manque).indice)], { qui: t('kon') });
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
  if ((lireTampons()[L.id] || []).length === L.tampons.length) await dialogue.dire(t('konTout'), { qui: t('kon') });
}
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

/** Ce que les lieux peuvent faire (leurs actions reçoivent cet objet). */
const jeu = {
  t, tx,
  dire: (pages, qui) => dialogue.dire(pages, { qui: qui && nomQui(qui) }),
  choisir: (pages, options, qui) => dialogue.choisir(pages, options, { qui: qui && nomQui(qui) }),
  aTampon: (id) => aLeTampon(M.lieu.id, id),
  tampon, video,
  saluer: () => M.joueur.saluer(),
  /**
   * La nuit tombe (oui) ou le jour revient, en un peu plus d'une seconde ; se résout une fois fait. La nuit, la
   * caméra descend et lève les yeux vers le ciel (les étoiles), puis reprend sa place au jour.
   */
  nuit: (oui) => new Promise((fin) => {
    if (oui && !M.nuit.camera) {
      M.nuit.camera = { lacet: cam.lacet, tangage: cam.tangage, distance: cam.distance };
      Object.assign(cam, { lacet: 0, tangage: -0.3, distance: 3.6 });
    } else if (!oui && M.nuit.camera) {
      Object.assign(cam, M.nuit.camera);
      M.nuit.camera = null;
    }
    M.nuit.cible = oui ? 1 : 0;
    M.nuit.fin = fin;
  }),
};

// ---------------------------------------------------------------- Le jeu
/** Le joueur au départ du lieu (ou dans la pose d'une capture), Kon à côté. */
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
  // Kon : à droite et un peu en arrière
  const dx = Math.cos(etat.cap), dz = -Math.sin(etat.cap), fx = Math.sin(etat.cap), fz = Math.cos(etat.cap);
  Object.assign(renard, { x: etat.x - dx * 1.3 - fx * 0.5, z: etat.z - dz * 1.3 - fz * 0.5, cap: etat.cap + 0.6 });
  renard.y = L.monde.hauteur(renard.x, renard.z);
}

/** Les deux voyageurs côte à côte, face à l'objectif, Kon devant eux (le choix du départ, la capture « perso »). */
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
  const dansLEau = L.eau && L.terrain(etat.x, etat.z) < (L.eau.niveau || 0) - 0.05 && etat.y < (L.eau.niveau || 0) + 0.5;
  const course = appuye('ShiftLeft', 'ShiftRight') || Math.hypot(joy.x, joy.y) > 0.92;
  const vmax = (course ? COURSE : MARCHE) * (dansLEau ? 0.62 : 1);
  const k = Math.min(1, dt * 10);
  etat.vx += (dx * vmax - etat.vx) * k;
  etat.vz += (dz * vmax - etat.vz) * k;
  // on glisse le long des obstacles : d'abord le mouvement entier, sinon chaque axe à part
  const nx = etat.x + etat.vx * dt, nz = etat.z + etat.vz * dt;
  if (monde.libre(nx, nz, etat.y, autres)) { etat.x = nx; etat.z = nz; } else if (monde.libre(nx, etat.z, etat.y, autres)) { etat.x = nx; etat.vz *= 0.5; } else if (monde.libre(etat.x, nz, etat.y, autres)) { etat.z = nz; etat.vx *= 0.5; } else { etat.vx = etat.vz = 0; }
  etat.vitesse = Math.hypot(etat.vx, etat.vz);
  etat.y += (monde.hauteur(etat.x, etat.z, etat.y) - etat.y) * Math.min(1, dt * 18);
  if (m > 0.05) etat.cap = tourner(etat.cap, Math.atan2(dx, dz), dt * 10);
  if (m > 0.05 && libre) $('.aide').classList.add('vue');

  // Kon suit, un peu en arrière et sur le côté ; il s'assoit quand il est arrivé
  if (etat.mode !== 'depart') {
    const cx = etat.x - Math.sin(etat.cap) * 1.3 + Math.cos(etat.cap) * 0.75, cz = etat.z - Math.cos(etat.cap) * 1.3 - Math.sin(etat.cap) * 0.75;
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
// le son d'un pas selon la matière du sol (textures.js) ; les planchers sont tous en bois
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
  if (y > h + 0.12) return { sol: 'bois', eau: 0, h };
  const e = L.eau, eau = e && x > e.x0 && x < e.x1 && z > e.z0 && z < e.z1 ? Math.max(0, (e.niveau || 0) - h) : 0;
  return { sol: eau > 0.03 ? 'eau' : SON_DU_SOL[matiereDuSol(x, z, h)] || 'terre', eau, h };
}
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

/** Un pied (ou une paire de pattes de Kon) qui se pose : son bruit, ses éclaboussures ou son empreinte. */
function unPas(qui, cote) {
  const kon = qui === 'kon', p = kon ? renard : etat, o = mouille[qui], E = M.effets;
  const { sol, eau, h } = sousLesPieds(p.x, p.z, p.y);
  const course = !kon && etat.vitesse > MARCHE * 1.2;
  // le pied : sur le côté (x > 0 du personnage : sa gauche), un peu devant
  const lx = Math.cos(p.cap), lz = -Math.sin(p.cap), fx = Math.sin(p.cap), fz = Math.cos(p.cap);
  const ecart = kon ? 0.06 : 0.085, x = p.x + (lx * cote * ecart) + fx * 0.12, z = p.z + (lz * cote * ecart) + fz * 0.12;
  const loin = kon ? Math.hypot(renard.x - camera.position.x, renard.z - camera.position.z) : 0;
  // (Kon trotte vite : on n'entend qu'une paire de pattes sur deux, sinon il couvrirait nos pas)
  if (!kon || cote > 0) {
    M.bruitage.pas(sol, {
      kon, course, pan: kon ? panDe(p.x, p.z) : -0.12 * cote,
      force: (sol === 'eau' ? 0.6 + 0.6 * Math.min(1, eau / 0.3) : 1) / (1 + Math.max(0, loin - 5) * 0.12),
    });
  }
  const sorte = kon ? 2 : cote > 0 ? 0 : 1;
  if (sol === 'eau') {
    // des gouttes jetées autour du pied, et un rond
    const niveau = M.lieu.eau.niveau || 0, k = Math.min(1, eau / 0.3);
    E.eclabousser(x, niveau, z, Math.round((kon ? 4 : 8) + k * (kon ? 5 : 10) * (course ? 1.5 : 1)), { sol: niveau, force: (kon ? 0.55 : 0.8) * (course ? 1.3 : 1) });
    if (!kon || cote > 0) E.rond(x, niveau, z, kon ? 0.45 : course ? 1 : 0.7, 1.3);
  } else if (sol === 'bois') {
    if (o.v > 0.12) E.empreinte(x, p.y + 0.02, z, p.cap, [0, 1, 0], sorte, { teinte: 0.45, force: o.v, duree: 7 });
  } else if (dansLaCarte(x, z)) {
    // dans le sable, on laisse ses pas ; ailleurs, seulement des traces mouillées en sortant de l'eau
    const n = normaleDuSol(x, z), y = h + 0.03;
    if (sol === 'sable') E.empreinte(x, y, z, p.cap, n, sorte, { teinte: 0.58, force: 0.9, duree: 30 });
    else if (sol === 'estran') E.empreinte(x, y, z, p.cap, n, sorte, { teinte: 0.5, force: 1, duree: 26 });
    else if (o.v > 0.12) E.empreinte(x, y, z, p.cap, n, sorte, { teinte: 0.45, force: o.v * (sol === 'herbe' || sol === 'sousBois' ? 0.5 : 1), duree: 7 });
  }
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

/** Chaque image, en jeu : les pas, l'eau (mouillé, gouttes, ronds), Kon qui s'ébroue, et ce qu'on entend. */
function vivre(dt, temps, pasJoueur, pasKon) {
  if (dt <= 0) return;
  const L = M.lieu, E = M.effets, niveau = L.eau?.niveau || 0;
  if (pasJoueur) unPas('joueur', pasJoueur);
  if (pasKon) unPas('kon', pasKon);
  for (const [qui, p, haut, rayon] of [['joueur', etat, 1.45, 0.17], ['kon', renard, 0.55, 0.1]]) {
    const o = mouille[qui], s = sousLesPieds(p.x, p.z, p.y);
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
    // Kon sorti de l'eau s'ébroue (une fois), et le voilà presque sec
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
  M.bruitage.ambiance({ vent, feuilles, vagues: oreille.mer.vagues, panVagues: oreille.mer.pan, vapeur: Math.min(1, vapeur), panVapeur, nuit: M.nuit.v, oiseau }, d);
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
  kon.objet.position.set(renard.x, renard.y, renard.z);
  kon.objet.rotation.y = renard.cap;
  const pasKon = kon.animer(dt, renard.vitesse, temps);
  for (const p of M.passants) {
    p.perso.objet.position.set(p.etat.x, p.etat.y, p.etat.z);
    p.perso.objet.rotation.y = p.etat.cap;
    p.perso.animer(dt, p.etat.v, temps + p.x);
  }
  for (const d of M.daims) d.b.animer(dt, temps);
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
  if (N.fin && N.v === N.cible) { const fin = N.fin; N.fin = null; fin(); }

  // la caméra derrière le joueur. Sous un toit (une galerie), elle se rapproche et passe sous le plafond ;
  // elle s'arrête devant un bâtiment ou un toit (monde.visee) ; jamais sous le sol ni sous l'eau
  // (les deux voyageurs du choix du départ : entre eux, et de plus loin sur un écran en hauteur)
  const monde = lieu.monde;
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

function dimensionner() {
  const l = innerWidth, h = innerHeight;
  rendu.setSize(l, h, false);
  // en portrait, un champ plus large : on voit à peu près autant de décor qu'en paysage
  camera.fov = l < h ? 62 : 48;
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
addEventListener('resize', dimensionner);

// ---------------------------------------------------------------- C'est parti
async function depart() {
  if (sorte) {
    await dialogue.dire(t('konRetour')(nomDe(M.lieu)), { qui: t('kon') });
  } else {
    // la première fois : Kon demande, comme dans les jeux, si l'on est un garçon ou une fille
    const r = await dialogue.choisir(t('konBonjour')(nomDe(M.lieu)), [t('garcon'), t('fille')], { qui: t('kon') });
    sorte = r === 1 ? 'fille' : 'garcon';
    memoire.ecrire('baladePerso', sorte);
    // le voyageur choisi reste à sa place (l'autre s'efface), puis la caméra passe derrière lui
    const choisi = M.voyageurs[sorte];
    const { x, z } = choisi.objet.position;
    choisirVoyageur(sorte);
    Object.assign(etat, { x, z, y: M.lieu.monde.hauteur(x, z) });
    choisi.saluer();
    await dialogue.dire(t('konParti')(M.lieu.tampons.length), { qui: t('kon') });
    etat.cap = M.lieu.depart.cap;
    Object.assign(cam, { lacet: etat.cap + Math.PI, tangage: 0.24, distance: 6.4 });
  }
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
window.balade = { scene, rendu, camera, monde: () => M, etat, cam, renard }; // (pour les essais)

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
