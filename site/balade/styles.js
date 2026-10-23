// ================================================================
//  Le style de la balade 3D. Le 2026-10-21 le propriétaire a choisi « le mélange » (les teintes et le trait
//  des modèles 3D de la carte), d'abord en gros pixels comme les anciens Pokémon de la DS. Le 2026-10-22, il
//  a trouvé les pixels trop gros et demandé un rendu plus lisse, inspiré des formes et des graphismes de
//  Pokémon X et Y (3DS), avec autant de détails que possible tant que ça reste fluide. D'où :
//  - l'image en pleine définition, lissée (anticrénelage 4×), sans trame ;
//  - un éclairage en aplats doux pour le décor, nets pour les personnages (comme un dessin animé), et des
//    ombres aux bords adoucis ;
//  - des matières peintes : herbe en brins et fleurs, sable, dalles, terre caillouteuse, roche en strates,
//    bois, tuiles, enduit, feuillage… (textures.js), plaquées dans le monde ;
//  - des bords nets et irréguliers entre l'herbe et les chemins : la carte du sol au demi-mètre (balade.js) ;
//  - un trait fin et sombre autour des objets et des personnages ;
//  - le lointain légèrement flou, comme dans ces jeux.
//  Le 2026-10-22 aussi : le vent (les feuillages et l'herbe bougent, des rafales passent ; la même rafale
//  règle le bruit du vent, bruitage.js) et les habits qui se mouillent dans l'eau.
//  Ce module donne la palette (noms de couleurs → teintes, et les couleurs de l'atelier des modèles 3D
//  repeintes), la matière de chaque couleur, les matières de three.js (objets, trait, sol) et la passe finale.
// ================================================================
import { C } from '../modeles3d.js';
import { MATIERES, ECHELLES, texturesDetail } from './textures.js';

const PALETTE = {
  vermillon: '#dd5638', vermillonFonce: '#b8422b', blanc: '#fbf6ea', bois: '#c49564', bois2: '#bb8b5a', bois3: '#cb9f6f', boisFonce: '#946541',
  toit: '#857063', toitClair: '#97826f', toitBord: '#5a4a40', pierre: '#bdb6a5', pierreFonce: '#a1998a', bronze: '#6f9580',
  sable: '#f3e2b4', sableMouille: '#dcc995', herbe: '#86c75e', herbeFonce: '#62a84c', pin: '#4f8a4a', tronc: '#9a6d47',
  feuillage: '#77ad52', montagne: '#7fae66', montagneLoin: '#a9c4c8', roche: '#a8977d',
  eauClaire: '#a6e6dc', eauProfonde: '#4fb0bf', ecume: '#ffffff', cielHaut: '#7cc0f0', horizon: '#e0f0f2', nuage: '#ffffff',
  daim: '#c48a52', daimClair: '#fff1d8', noir: '#3a3236', or: '#e8b941', fenetre: '#5a4636', papier: '#fff8e8',
  algue: '#8c8a52', chemin: '#d9cfb8', cheminFonce: '#c2b79c',
  // Aogashima : la jungle du cratère, la roche volcanique, la terre des fumerolles, le béton de l'île
  jungle: '#5a9d4c', jungleFonce: '#43823f', fougere: '#7dbb5a', paroi: '#8a7d70', rocheSombre: '#5f5651',
  terreRouge: '#b8775a', terreClaire: '#ddd5c6', route: '#c2bcb0', beton: '#dcd7cb', tole: '#5d8a86',
  peau: '#ffdcbc', joue: '#ff9e98', cheveux: '#553a2a', cheveuxFille: '#74452c', casquette: '#2f9aa0', visiere: '#24797e',
  haut: '#e8583e', hautFille: '#f59aa6', short: '#3d5a8f', chaussures: '#ffffff', semelle: '#5a4c56', sac: '#f2bd45', sangle: '#99673f',
  ruban: '#e0453a', chapeau: '#fff0cf', oeil: '#2a2230', reflet: '#ffffff',
  // les deux voyageurs, refaits le 2026-10-23 : le visage, les habits du garçon et de la fille
  iris: '#5a3a2a', irisClair: '#a8703e', irisFille: '#6b3a26', irisFilleClair: '#c08040', pupille: '#1e1418', cils: '#2a2230',
  sourcils: '#4a3020', bouche: '#a8443c', nez: '#f4c3a2',
  tshirt: '#fbf6ea', veste: '#e8583e', vesteFonce: '#c2432d', shortFonce: '#2f4a7a', ceinture: '#6a4a32', boucle: '#e8b941',
  chaussette: '#ffffff', chaussetteBord: '#e9e2d4', basket: '#d8452e', casquetteFace: '#ffffff', tapis: '#3f8a7a', sacFonce: '#d99a2a',
  chemisier: '#f59aa6', col: '#ffffff', colRayure: '#2f4a7a', noeud: '#e0453a', jupe: '#3d5a8f', jupeFonce: '#33507f',
  chaussuresFille: '#b8433a', semelleFille: '#5a3a30', sacFille: '#f6a5a0', sacFilleFonce: '#e07f7c',
  chapeauFonce: '#ead8a8', fleur: '#ffffff', fleurCoeur: '#f2c443',
  // les compagnons : Kon le renard, Pon le tanuki, Chapu la loutre
  renard: '#ffffff', renardRouge: '#e8452e', renardOmbre: '#ecdcc8', grelot: '#e8b941', oeilBete: '#221a20',
  tanuki: '#8f6f50', tanukiClair: '#a8886a', tanukiFonce: '#4a3a30', tanukiCreme: '#efe3cc', tanukiVentre: '#e6d2ae', feuilleTanuki: '#5aa64a',
  loutre: '#7a5236', loutreFonce: '#553722', loutreCreme: '#ead9bb', foulard: '#2f6fb0', foulardPois: '#f4f0e6', moustache: '#f4efe6',
  // les compagnons secrets (2026-10-23) : Gao le shisa, Fuwa le bébé dragon, Saya l'esprit d'un arbre
  shisa: '#d9853a', shisaFonce: '#a8502a', shisaCreme: '#f2dcae',
  dragon: '#f2f5fb', dragonCreme: '#f3e6c0', dragonCrin: '#5ec4cf', dragonCorne: '#f0d38a',
  kodamaBois: '#d8b07a', kodamaFonce: '#a87a4a', kodamaMousse: '#5f9e48', kodamaFeuille: '#7ac25a', kodamaOeil: '#f2ffb0',
};
const PARCHEMIN = { cielHaut: '#ead9b4', horizon: '#f0ead2', nuage: '#fbf4e2' };

/** Les couleurs de l'atelier des modèles 3D (lanternes, pins, toits…) repeintes dans la palette P. */
function repeindre(P) {
  return {
    [C.pierre2]: P.pierre, [C.pierre3]: P.pierreFonce, [C.ardoise]: P.pierreFonce, [C.brun]: P.tronc, [C.pinVert]: P.pin,
    [C.tuile]: P.toit, [C.tuileClaire]: P.toitClair, [C.faitage]: P.toitBord, [C.roche]: P.roche, [C.noir]: P.noir,
    [C.feuillage]: P.feuillage, [C.mousse]: P.herbe, [C.mousseFonce]: P.herbeFonce, '#4a3c2c': P.fenetre, [C.or]: P.or,
    [C.paille]: '#e6c87a', [C.pailleFonce]: '#c9a65a', [C.papier]: P.papier, [C.rouge]: P.vermillon, [C.laque]: P.vermillon,
  };
}

/** La matière peinte (textures.js) de chaque couleur des objets du décor : le bois, les tuiles, la pierre… */
function matieres(P) {
  const M = MATIERES, t = {};
  const mettre = (m, ...noms) => { for (const n of noms) t[n.startsWith('#') ? n : P[n]] = m; };
  mettre(M.bois, 'bois', 'bois2', 'bois3', 'boisFonce', 'tronc');
  mettre(M.tuiles, 'toit', 'toitClair', 'toitBord', '#6a5e58');
  mettre(M.pierre, 'pierre', 'pierreFonce', 'roche', 'rocheSombre', 'paroi', 'bronze');
  mettre(M.enduit, 'blanc', 'beton', 'papier', 'terreClaire');
  mettre(M.feuillage, 'pin', 'feuillage', 'jungle', 'jungleFonce', 'fougere', 'herbe', 'herbeFonce', 'montagne');
  mettre(M.laque, 'vermillon', 'vermillonFonce');
  mettre(M.tole, 'tole');
  return t;
}

/** Le style (options de la page : ciel). */
export function creerStyle({ ciel } = {}) {
  const palette = { ...PALETTE, ...(ciel === 'parchemin' ? PARCHEMIN : {}) };
  return {
    palette, repeindre: repeindre(palette), matieres: matieres(palette),
    // la lumière : le ciel (bleuté, d'en haut) et le sol (sable chaud, d'en bas) éclairent les ombres ; le
    // soleil (chaud) éclaire les faces tournées vers lui, avec un passage doux vers l'ombre
    lumiere: { ciel: '#d4e4ff', sol: '#e6d6b0', ambiance: 1.85, soleil: '#fff3dc', force: 2.0 },
    // le trait : en px CSS pour un écran de 800 px de haut (plus épais sur un grand écran), et sa teinte
    // (une teinte plus sombre de la couleur de l'objet)
    trait: { px: 2.0, perso: 2.6, teinte: 0.3 },
    peinture: true,
    // le lointain flou (de debut à fin, en mètres), un peu plus de couleur, un soupçon de vignette
    rendu: { flou: { debut: 90, fin: 260, force: 0.85 }, saturation: 1.08, vignette: 0.1 },
  };
}

/**
 * Le vent : une brise (0,25) et des rafales qui montent jusqu'à 1, de temps en temps (trois sinus lents qui
 * s'additionnent : une rafale toutes les vingt à quarante secondes environ, de quelques secondes). u : le
 * temps, décalé selon le lieu (t − position · direction / VITESSE_RAFALE) : une rafale traverse le lieu à
 * 7 m/s, on la voit arriver dans les arbres. La même formule en GLSL (VENT_GLSL), pour que le bruit du vent
 * (bruitage.js) et les arbres soient d'accord.
 */
export function rafale(u) {
  const g = 0.5 + 0.3 * Math.sin(0.23 * u) + 0.22 * Math.sin(0.61 * u + 1.7) + 0.12 * Math.sin(1.43 * u + 0.4);
  const t = Math.min(1, Math.max(0, (g - 0.62) / 0.43));
  return 0.25 + 0.75 * t * t * (3 - 2 * t);
}
export const VITESSE_RAFALE = 7;

/**
 * Le vent dans les shaders (ventTemps : le temps du jeu ; ventDir : d'où il pousse, dans le plan ; ventForce :
 * la force du vent du lieu). souffle(p) : le déplacement d'un point du feuillage (dans le monde) : penché dans
 * le sens du vent par la rafale, balancé, et un frisson rapide (les feuilles) ; souffleObjet : celui d'un
 * sommet du décor (dans le repère de l'objet), pour les feuillages seuls (l'attribut `saison` des modèles :
 * feuillus, érables, cerisiers ; les conifères, plus raides). Un déplacement continu dans l'espace : les
 * triangles voisins bougent ensemble, sans se séparer.
 */
export const VENT_GLSL = `
  uniform float ventTemps, ventForce;
  uniform vec2 ventDir;
  float rafale(float u) {
    float g = 0.5 + 0.3 * sin(0.23 * u) + 0.22 * sin(0.61 * u + 1.7) + 0.12 * sin(1.43 * u + 0.4);
    return 0.25 + 0.75 * smoothstep(0.62, 1.05, g);
  }
  float forceVent(vec2 xz) { return rafale(ventTemps - dot(xz, ventDir) / ${VITESSE_RAFALE.toFixed(1)}) * ventForce; }
  vec3 souffle(vec3 p, float souplesse) {
    float f = forceVent(p.xz);
    float balance = 0.6 + 0.4 * sin(ventTemps * 1.7 + dot(p.xz, vec2(0.37, 0.29)) + p.y * 0.35);
    float frisson = sin(ventTemps * 8.0 + p.x * 3.1 + p.y * 2.3 + p.z * 2.7) * sin(ventTemps * 5.3 + p.z * 2.9 - p.y * 1.7 + p.x);
    return (vec3(ventDir.x, 0.0, ventDir.y) * 0.16 * balance + vec3(0.03, 0.02, 0.03) * frisson) * f * souplesse;
  }
  vec3 souffleObjet(vec3 objet, vec3 saison) {
    float sorte = floor(saison.x + 0.5);
    if (sorte < 0.5 || sorte > 4.5) return vec3(0.0);
    vec3 p = (modelMatrix * vec4(objet, 1.0)).xyz;
    return souffle(p, sorte > 3.5 ? 0.55 : 1.0) * mat3(modelMatrix);
  }`;

/**
 * Les lampes allumées la nuit (lueurs.js choisit, à chaque image, les NB_LAMPES qui comptent le plus pour
 * l'image : les plus proches de ce que regarde la caméra). Leur lumière tombe sur ce qui les entoure, quelle que
 * soit sa forme : le sol en pente, les marches, les murs, les personnages (d'abord, le 2026-10-23, une flaque de
 * lumière : un disque à plat, à la hauteur du sol sous la lanterne ; sur une pente ou près des murs d'un
 * escalier, il flottait au-dessus du sol en arcs de cercle). lampesPos : la flamme (xyz) et la portée (w ; 0 :
 * plus aucune lampe après celle-ci) ; lampesCouleur : sa couleur × sa force (0 le jour) ; lampesZone : une boule qui
 * les contient toutes, portées comprises (le reste de l'image, loin d'elles, ne fait pas le tour des lampes). La
 * lumière d'une lampe baisse avec la distance jusqu'à sa portée ; les faces tournées vers elle en reçoivent plus.
 */
export const NB_LAMPES = 12;
export const LAMPES_GLSL = `
  uniform vec4 lampesPos[${NB_LAMPES}];
  uniform vec3 lampesCouleur[${NB_LAMPES}];
  uniform vec4 lampesZone;
  vec3 lumiereLampes(vec3 p, vec3 n) {
    vec3 s = vec3(0.0);
    vec3 z = p - lampesZone.xyz;
    if (dot(z, z) >= lampesZone.w * lampesZone.w) return s;
    for (int i = 0; i < ${NB_LAMPES}; i++) {
      vec4 l = lampesPos[i];
      if (l.w <= 0.0) break;
      vec3 d = l.xyz - p;
      float q = dot(d, d) / (l.w * l.w);
      if (q >= 1.0) continue;
      float f = 1.0 - q;
      float face = clamp(dot(n, d) * inversesqrt(max(dot(d, d), 1e-4)) * 0.7 + 0.3, 0.0, 1.0);
      s += lampesCouleur[i] * (f * f * face);
    }
    return s;
  }`;

/**
 * Une matière (MeshToonMaterial) éclairée par les lampes : sa couleur, éclairée par elles, s'ajoute à ce qu'elle
 * émet. s : le shader (onBeforeCompile) ; lampes : les uniformes communs (matieresStyle) ; force : moins pour les
 * personnages (un chapeau clair sous une lanterne devenait blanc).
 */
export function eclairerParLampes(s, lampes, force = 1) {
  Object.assign(s.uniforms, lampes);
  s.vertexShader = s.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vLampeP;\nvarying vec3 vLampeN;')
    .replace('#include <project_vertex>', `#include <project_vertex>
      {
        vec4 lp = vec4(transformed, 1.0);
        vec3 ln = objectNormal;
        #ifdef USE_INSTANCING
          lp = instanceMatrix * lp;
          ln = mat3(instanceMatrix) * ln;
        #endif
        vLampeP = (modelMatrix * lp).xyz;
        vLampeN = mat3(modelMatrix) * ln;
      }`);
  s.fragmentShader = s.fragmentShader
    .replace('#include <common>', `#include <common>\nvarying vec3 vLampeP;\nvarying vec3 vLampeN;${LAMPES_GLSL}`)
    .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * lumiereLampes(vLampeP, normalize(vLampeN)) * ${force.toFixed(2)};`);
}

/**
 * Les saisons du calendrier magique (2026-10-23, acheté au marchand) : saisons = (printemps, automne, hiver), chacune
 * de 0 à 1 (rien : l'été de tous les jours). feuillageSaison repeint les feuillages des modèles (l'attribut `saison` :
 * 1 feuillu, 2 érable, 3 cerisier, 5 herbe) avant la peinture : au printemps, un feuillu sur deux en fleurs de
 * cerisier (les buissons aussi : les azalées), les autres d'un vert tendre ; à l'automne, chaque arbre jaune, orangé ou
 * rouge, les érables rouge vif, l'herbe dorée ; l'hiver, presque nus. neigeSaison couvre de neige, l'hiver, tout ce qui
 * regarde le ciel (après la peinture : les toits blanchissent).
 */
export const SAISONS_GLSL = `
  uniform vec3 saisons;
  float hasardSaison(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  vec3 feuillageSaison(vec3 c, float sorte, float tirage, vec3 p) {
    if (saisons.x + saisons.y + saisons.z < 0.001) return c;
    float s = floor(sorte + 0.5);
    if (s < 0.5 || s > 5.5 || abs(s - 4.0) < 0.5) return c;
    float l = dot(c, vec3(0.299, 0.587, 0.114)), arbre = hasardSaison(floor(p.xz / 3.2) + 0.37);
    vec3 rose = mix(vec3(1.0, 0.72, 0.8), vec3(1.0, 0.93, 0.95), tirage * 0.7) * (0.72 + 0.55 * l);
    vec3 tendre = c * vec3(1.0, 1.12, 0.82) + vec3(0.04, 0.06, 0.0);
    vec3 pr = s == 1.0 ? (arbre < 0.5 ? rose : tendre) : s == 3.0 ? rose : tendre;
    vec3 teinteA = arbre < 0.33 ? vec3(0.95, 0.7, 0.22) : arbre < 0.66 ? vec3(0.92, 0.45, 0.16) : vec3(0.8, 0.24, 0.14);
    vec3 au = s == 1.0 ? teinteA * (0.62 + 0.75 * l) : s == 2.0 ? vec3(0.84, 0.17, 0.12) * (0.65 + 0.7 * l) : s == 3.0 ? vec3(0.9, 0.5, 0.25) * (0.65 + 0.7 * l) : c * vec3(1.18, 0.98, 0.55);
    vec3 hi = s == 5.0 ? c * vec3(1.05, 0.95, 0.7) : mix(c, vec3(0.55, 0.48, 0.42) * (0.6 + 0.6 * l), 0.7);
    return c + (pr - c) * saisons.x + (au - c) * saisons.y + (hi - c) * saisons.z;
  }
  vec3 neigeSaison(vec3 c, vec3 n) {
    if (saisons.z < 0.001) return c;
    return mix(c, vec3(0.93, 0.95, 1.0), smoothstep(0.35, 0.8, n.y) * saisons.z * 0.92);
  }`;

/** Un bruit lisse (GLSL) : 0 à 1, une bosse par unité. */
const BRUIT_GLSL = `
  float hasard2(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float bruitLisse(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hasard2(i), hasard2(i + vec2(1.0, 0.0)), u.x), mix(hasard2(i + vec2(0.0, 1.0)), hasard2(i + vec2(1.0, 1.0)), u.x), u.y);
  }`;

/**
 * Peindre une matière (textures.js) : la texture plaquée selon la face (vue d'en haut, de face ou de côté :
 * le plan le plus en face de la normale de la face) ; les tuiles suivent la pente du toit, en rangs qui
 * descendent. La texture multiplie la couleur (0,5 : ×1), ou impose la sienne là où son alpha est à 0.
 */
const PEINDRE_GLSL = `
  uniform highp sampler2DArray details;
  uniform float echelles[16];
  vec3 peindre(vec3 base, float couche, vec3 p, vec3 n) {
    if (couche < 0.5) return base;
    vec3 a = abs(n);
    vec2 uv;
    if (couche == ${MATIERES.tuiles}.0 && a.y > 0.15 && length(n.xz) > 0.05) {
      // le long de la pente (y de la texture) et en travers (x) ; la pente vraie : la distance à plat / cos
      vec2 d = normalize(n.xz);
      uv = vec2(dot(p.xz, vec2(-d.y, d.x)), dot(p.xz, d) / max(a.y, 0.3));
    } else if (a.y > max(a.x, a.z)) uv = p.xz;
    else if (a.x > a.z) uv = vec2(p.z, p.y);
    else uv = vec2(p.x, p.y);
    vec4 t = texture(details, vec3(uv / echelles[int(couche)], couche));
    return mix(t.rgb, base * t.rgb * 2.0, t.a);
  }`;

/**
 * Ce qui cache le joueur s'efface en pointillés fins (une trame à l'écran) : tout ce qui touche presque
 * l'œil (coupeSphere), et un cône le long de la visée, de l'œil jusqu'à la poitrine du joueur (coupeOeil →
 * coupeCible), à peu près la silhouette du joueur vue de l'œil (un plafond juste au-dessus de la caméra
 * reste) ; jamais le sol sous ses pieds (les faces tournées vers le ciel, plus bas que sa poitrine). Les
 * piliers, les garde-corps, les lanternes, les arbres… vCoupe : la position du fragment dans le monde ;
 * vCoupeN : sa normale.
 */
const COUPE_GLSL = `
  uniform vec3 coupeOeil, coupeCible;
  uniform float coupeSphere, coupeMarge;
  varying vec3 vCoupe;
  varying vec3 vCoupeN;
  float bayer2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
  float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
  void coupe() {
    vec3 v = vCoupe - coupeOeil, d = coupeCible - coupeOeil;
    float L = max(length(d), 0.001);
    d /= L;
    float u = dot(v, d), r = length(v - u * d);
    float f = 1.0 - smoothstep(coupeSphere * 0.7, coupeSphere, length(v));
    float R = mix(0.3, 0.85, clamp(u / L, 0.0, 1.0)) + coupeMarge;
    f = max(f, (1.0 - smoothstep(R * 0.6, R, r)) * step(0.0, u) * (1.0 - smoothstep(L - 1.0, L - 0.5, u)));
    f *= 1.0 - step(0.6, vCoupeN.y) * step(vCoupe.y, coupeCible.y - 0.35);
    if (f > bayer4(gl_FragCoord.xy) + 0.02) discard;
  }`;

/**
 * La carte du sol (balade.js, carteDuSol) : au demi-mètre, la couleur (rgb) et la matière (alpha) du sol
 * autour du jeu. En chaque point, un peu déplacé par un bruit, les quatre texels voisins votent (chacun selon
 * sa proximité) : la matière qui pèse le plus l'emporte. Les bords entre l'herbe et un chemin sont donc des
 * courbes nettes, ondulées par le bruit, avec de petites touffes ; la couleur est la moyenne des voisins de
 * la même matière (pas de mélange vert-brun au bord).
 */
const CARTE_SOL_GLSL = `
  uniform highp sampler2D carteSol;
  uniform vec4 zoneSol; // x0, z0, pas, 1 si la carte existe
  uniform vec2 tailleSol;
  bool lireCarteSol(vec2 xz, out vec3 couleur, out float couche) {
    if (zoneSol.w < 0.5) return false;
    vec2 st = (xz - zoneSol.xy) / zoneSol.z;
    if (st.x < 0.0 || st.y < 0.0 || st.x > tailleSol.x - 1.0 || st.y > tailleSol.y - 1.0) return false;
    st += (vec2(bruitLisse(xz * 0.7), bruitLisse(xz * 0.7 + 17.3)) - 0.5) * 0.9
      + (vec2(bruitLisse(xz * 6.0 + 5.1), bruitLisse(xz * 6.0 + 9.7)) - 0.5) * 0.45;
    ivec2 i0 = clamp(ivec2(floor(st)), ivec2(0), ivec2(tailleSol) - 2);
    vec2 f = clamp(st - vec2(i0), 0.0, 1.0);
    vec4 a = texelFetch(carteSol, i0, 0), b = texelFetch(carteSol, i0 + ivec2(1, 0), 0);
    vec4 c = texelFetch(carteSol, i0 + ivec2(0, 1), 0), d = texelFetch(carteSol, i0 + ivec2(1, 1), 0);
    vec4 w = vec4((1.0 - f.x) * (1.0 - f.y), f.x * (1.0 - f.y), (1.0 - f.x) * f.y, f.x * f.y);
    vec4 m = floor(vec4(a.a, b.a, c.a, d.a) * 255.0 + 0.5);
    // le poids de la matière de chaque voisin : la somme des poids des voisins de la même matière
    vec4 poids = vec4(dot(w, step(abs(m - m.x), vec4(0.5))), dot(w, step(abs(m - m.y), vec4(0.5))),
      dot(w, step(abs(m - m.z), vec4(0.5))), dot(w, step(abs(m - m.w), vec4(0.5))));
    couche = m.x;
    float meilleur = poids.x;
    if (poids.y > meilleur) { meilleur = poids.y; couche = m.y; }
    if (poids.z > meilleur) { meilleur = poids.z; couche = m.z; }
    if (poids.w > meilleur) { meilleur = poids.w; couche = m.w; }
    w *= step(abs(m - couche), vec4(0.5));
    couleur = (a.rgb * w.x + b.rgb * w.y + c.rgb * w.z + d.rgb * w.w) / max(meilleur, 0.001);
    return true;
  }`;

/**
 * Le sol selon la saison (après la peinture ; couche : la matière, textures.js) : au printemps, l'herbe plus tendre et
 * des pétales tombés çà et là ; à l'automne, l'herbe dorée et les feuilles mortes sous les arbres ; l'hiver, la neige
 * partout où c'est assez plat, sauf le sable mouillé, moins épaisse sur les dalles et la route (on y marche).
 */
const SOL_SAISON_GLSL = `
  uniform vec3 saisons;
  vec3 solSaison(vec3 c, float couche, vec3 p, vec3 n) {
    if (saisons.x + saisons.y + saisons.z < 0.001) return c;
    vec3 pr = c, au = c;
    if (couche == ${MATIERES.herbe}.0) {
      pr = mix(c * vec3(0.98, 1.1, 0.85) + vec3(0.02, 0.04, 0.0), vec3(1.0, 0.8, 0.86), smoothstep(0.8, 0.88, bruitLisse(p.xz * 1.7)) * 0.75);
      au = c * vec3(1.2, 1.0, 0.58);
    } else if (couche == ${MATIERES.sousBois}.0) au = mix(c, vec3(0.74, 0.43, 0.2), 0.65);
    float couvre = couche == ${MATIERES.estran}.0 ? 0.0 : (couche == ${MATIERES.dalles}.0 || couche == ${MATIERES.route}.0) ? 0.5 + 0.4 * bruitLisse(p.xz * 0.9) : 1.0;
    vec3 hi = mix(c, vec3(0.92, 0.94, 0.99) * (0.94 + 0.06 * bruitLisse(p.xz * 3.0)), smoothstep(0.55, 0.85, n.y) * couvre * 0.95);
    return c + (pr - c) * saisons.x + (au - c) * saisons.y + (hi - c) * saisons.z;
  }`;

/** Une rampe d'éclairage (gradientMap de MeshToonMaterial) : de l'ombre (bas) à la lumière (haut). */
function rampe(THREE, bas, haut, debut, fin) {
  const n = 32, d = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const x = i / (n - 1), t = Math.min(1, Math.max(0, (x - debut) / (fin - debut)));
    d[i] = Math.round((bas + (haut - bas) * t * t * (3 - 2 * t)) * 255);
  }
  const g = new THREE.DataTexture(d, n, 1, THREE.RedFormat);
  g.minFilter = g.magFilter = THREE.LinearFilter;
  g.generateMipmaps = false;
  g.needsUpdate = true;
  return g;
}

/**
 * Les matières du style : le corps des objets du décor (couleurs des sommets, matières peintes), celui des
 * personnages (deux tons nets), leur trait, et le sol (la carte du sol, les matières peintes).
 */
export function matieresStyle(THREE, style, { anisotropie = 4 } = {}) {
  const details = texturesDetail(THREE, anisotropie);
  const communs = { details: { value: details }, echelles: { value: ECHELLES } };
  // l'œil et la poitrine du joueur (balade.js les met à jour à chaque image), communs à toutes les matières du décor
  const coupe = { oeil: { value: new THREE.Vector3(0, -1e4, 0) }, cible: { value: new THREE.Vector3(0, -1e4, 0) } };
  const uniformesCoupe = (sphere, marge) => ({ coupeOeil: coupe.oeil, coupeCible: coupe.cible, coupeSphere: { value: sphere }, coupeMarge: { value: marge } });
  const douce = rampe(THREE, 0.6, 1, 0.4, 0.66);
  // le vent (balade.js règle le temps, la direction et la force du lieu), commun au décor, à son trait, à ses ombres et à l'herbe
  const vent = { ventTemps: { value: 0 }, ventDir: { value: new THREE.Vector2(0, 1) }, ventForce: { value: 1 } };
  // les lumières du décor (attribut saison des modèles) : les lanternes et les fenêtres (« lumiere ») s'allument
  // la nuit, d'une lumière chaude (une couleur vive, une lanterne rouge, garde sa couleur) ; les lampes (« lampe » : un tunnel, un sauna) brillent toujours ; ce qu'on
  // illumine la nuit (« illumine » : le grand torii et le sanctuaire d'Itsukushima) s'éclaire d'orangé.
  // lueur : la nuit (balade.js)
  const lueur = { value: 0 };
  // les lampes allumées (LAMPES_GLSL : lueurs.js les remplit à chaque image)
  // les saisons (balade.js : le calendrier magique)
  const saisons = { value: new THREE.Vector3() };
  const lampes = {
    lampesPos: { value: Array.from({ length: NB_LAMPES }, () => new THREE.Vector4()) },
    lampesCouleur: { value: Array.from({ length: NB_LAMPES }, () => new THREE.Vector3()) },
    lampesZone: { value: new THREE.Vector4() },
  };

  // le décor : la position et la normale dans le monde (la coupe, les matières), et la matière de chaque sommet
  const corps = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: douce });
  corps.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, uniformesCoupe(0.6, 0), communs, vent, { lueur, saisons });
    s.vertexShader = s.vertexShader
      .replace('#include <common>', `#include <common>\nattribute float matiere;\nattribute vec3 saison;\nvarying float vMatiere;\nvarying float vLueur;\nvarying vec3 vCoupe;\nvarying vec3 vCoupeN;\nvarying vec2 vSaison;${VENT_GLSL}`)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += souffleObjet(transformed, saison);')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvSaison = saison.xz;\nvMatiere = matiere;\nvLueur = abs(saison.x - 8.0) < 0.5 ? 1.0 : abs(saison.x - 9.0) < 0.5 ? 2.0 : abs(saison.x - 10.0) < 0.5 ? 3.0 : 0.0;\nvCoupe = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvCoupeN = normalize(mat3(modelMatrix) * objectNormal);');
    eclairerParLampes(s, lampes);
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying float vMatiere;\nvarying float vLueur;\nvarying vec2 vSaison;\nuniform float lueur;${COUPE_GLSL}${PEINDRE_GLSL}${SAISONS_GLSL}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        if (vLueur > 2.5) totalEmissiveRadiance += diffuseColor.rgb * vec3(1.0, 0.86, 0.68) * 0.55 * lueur;
        else if (vLueur > 1.5) totalEmissiveRadiance += diffuseColor.rgb * (0.75 + 0.5 * lueur);
        else if (vLueur > 0.5) totalEmissiveRadiance += mix(diffuseColor.rgb, vec3(1.0, 0.78, 0.45), 0.55 * (1.0 - clamp(diffuseColor.r - diffuseColor.b, 0.0, 1.0))) * 1.1 * lueur;`)
      .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\ncoupe();')
      .replace('#include <color_fragment>', `#include <color_fragment>
        {
          vec3 nf = normalize(cross(dFdx(vCoupe), dFdy(vCoupe)));
          diffuseColor.rgb = feuillageSaison(diffuseColor.rgb, vSaison.x, vSaison.y, vCoupe);
          diffuseColor.rgb = neigeSaison(peindre(diffuseColor.rgb, floor(vMatiere + 0.5), vCoupe, nf), nf);
        }`);
  };
  corps.customProgramCacheKey = () => 'corps-decor';
  // l'ombre du décor bouge avec lui (les feuillages)
  const profondeur = new THREE.MeshDepthMaterial();
  profondeur.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, vent);
    s.vertexShader = s.vertexShader
      .replace('#include <common>', `#include <common>\nattribute vec3 saison;${VENT_GLSL}`)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += souffleObjet(transformed, saison);');
  };
  profondeur.customProgramCacheKey = () => 'profondeur-vent';
  // les personnages : deux tons nets (la rampe par défaut de three.js, adoucie sur un pixel), jamais effacés ;
  // les lampes les éclairent aussi
  const corpsPerso = new THREE.MeshToonMaterial({ vertexColors: true });
  corpsPerso.onBeforeCompile = (s) => { eclairerParLampes(s, lampes, 0.5); lumierePerso(s); };
  corpsPerso.customProgramCacheKey = () => 'perso-lampes';

  // le sol : la carte du sol autour du jeu, ailleurs la couleur de ses sommets et la matière d'un sommet par
  // triangle (« flat » : entre l'herbe, 2, et le sous-bois, 8, pas de bandes des matières 3 à 7)
  const carte = { carteSol: { value: null }, zoneSol: { value: new THREE.Vector4(0, 0, 1, 0) }, tailleSol: { value: new THREE.Vector2(1, 1) } };
  const sol = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: douce });
  sol.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, communs, carte, { saisons });
    eclairerParLampes(s, lampes);
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float motif;\nvarying float vMotif;\nvarying vec3 vMonde;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvMotif = motif;\nvMonde = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying float vMotif;\nvarying vec3 vMonde;${BRUIT_GLSL}${PEINDRE_GLSL}${CARTE_SOL_GLSL}${SOL_SAISON_GLSL}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        {
          float couche = floor(vMotif + 0.5);
          vec3 couleur;
          if (lireCarteSol(vMonde.xz, couleur, couche)) diffuseColor.rgb = couleur;
          // de grandes taches plus ou moins claires : la texture ne se voit pas se répéter
          diffuseColor.rgb *= 0.94 + 0.12 * bruitLisse(vMonde.xz * 0.13);
          vec3 nf = normalize(cross(dFdx(vMonde), dFdy(vMonde)));
          diffuseColor.rgb = solSaison(peindre(diffuseColor.rgb, couche, vMonde, nf), couche, vMonde, nf);
        }`);
  };
  sol.customProgramCacheKey = () => 'sol-carte';

  // Le trait : la « coque inversée » des modèles 3D (attribut contour), gonflée d'un nombre fixe de pixels à
  // l'écran (un peu moins au loin), d'une teinte plus sombre que la couleur de l'objet
  const brume = { couleur: { value: new THREE.Color(style.palette.horizon) }, debut: { value: 60 }, fin: { value: 900 } };
  const ecran = { value: new THREE.Vector2(1, 1) };
  const epaisseurs = { decor: { value: 1 }, perso: { value: 1 } };
  const creerTrait = (avecCoupe, epaisseur) => new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexColors: true,
    uniforms: {
      epaisseur, ecran, teinte: { value: style.trait.teinte },
      brumeCouleur: brume.couleur, brumeDebut: brume.debut, brumeFin: brume.fin,
      ...(avecCoupe ? { ...uniformesCoupe(1.2, 0.2), ...vent, saisons } : {}),
    },
    vertexShader: `
      attribute vec3 contour;
      ${avecCoupe ? `attribute vec3 saison;${VENT_GLSL}${SAISONS_GLSL}` : ''}
      uniform float epaisseur;
      uniform vec2 ecran;
      varying vec3 vCouleur;
      varying float vDistance;
      varying float vFace;
      ${avecCoupe ? 'varying vec3 vCoupe;\nvarying vec3 vCoupeN;' : ''}
      void main() {
        // la coque gonfle le long des normales lissées, d'autant plus qu'elle est loin : toujours à peu près
        // « epaisseur » pixels (un peu moins au loin, où les traits se serrent)
        vec3 pos = position${avecCoupe ? ' + souffleObjet(position, saison)' : ''};
        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        vFace = 0.0;
        if (dot(contour, contour) > 0.01) {
          vec3 n = normalize(normalMatrix * contour);
          // la coque tournée à l'opposé de l'œil (vFace proche de 1) n'est jamais un contour : c'est le dedans
          // d'un objet vu de l'intérieur (le feuillage d'un arbre), ou ce qu'on voit derrière une face effacée
          vFace = dot(n, normalize(mv.xyz));
          float px = epaisseur * mix(1.0, 0.55, smoothstep(25.0, 140.0, -mv.z));
          mv.xyz += n * (px * 2.0 / (ecran.y * projectionMatrix[1][1])) * max(-mv.z, 0.0);
        }
        gl_Position = projectionMatrix * mv;
        vCouleur = ${avecCoupe ? 'feuillageSaison(color, saison.x, saison.z, (modelMatrix * vec4(pos, 1.0)).xyz)' : 'color'};
        vDistance = -mv.z;
        ${avecCoupe ? 'vCoupe = (modelMatrix * vec4(pos, 1.0)).xyz;\nvCoupeN = dot(contour, contour) > 0.01 ? normalize(mat3(modelMatrix) * contour) : vec3(0.0);' : ''}
      }`,
    fragmentShader: `
      uniform float teinte;
      uniform vec3 brumeCouleur;
      uniform float brumeDebut, brumeFin;
      varying vec3 vCouleur;
      varying float vDistance;
      varying float vFace;
      ${avecCoupe ? COUPE_GLSL : ''}
      void main() {
        ${avecCoupe ? 'if (vFace > 0.7) discard;\ncoupe();' : ''}
        // une teinte bien plus sombre de la couleur (un peu bleuie)
        vec3 c = vCouleur * teinte * vec3(0.9, 0.94, 1.1);
        gl_FragColor = vec4(mix(c, brumeCouleur, smoothstep(brumeDebut, brumeFin, vDistance)), 1.0);
        #include <colorspace_fragment>
      }`,
  });
  /**
   * Ce qui brille sur un personnage (l'attribut saison des modèles : 8, « lumiere » : les yeux de Saya, la perle de
   * Fuwa, comme des lucioles) : un peu de jour, bien plus la nuit.
   */
  function lumierePerso(s) {
    s.uniforms.lueur = lueur;
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 saison;\nvarying float vLumP;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvLumP = abs(saison.x - 8.0) < 0.5 ? 1.0 : 0.0;');
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vLumP;\nuniform float lueur;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * vLumP * (0.35 + 0.9 * lueur);');
  }
  /**
   * Un personnage qui se mouille (le joueur, Kon) : sous la ligne d'eau (ligne : en mètres au-dessus des pieds,
   * à la hauteur pied), ses couleurs foncent (mouille : 0 à 1), la peau un peu seulement (peau : sa couleur,
   * ou null).
   */
  const persoMouille = (peau = null) => {
    const u = { mouille: { value: 0 }, ligne: { value: 0 }, pied: { value: 0 }, peau: { value: new THREE.Color(peau || '#000000') }, avecPeau: { value: peau ? 1 : 0 } };
    const m = new THREE.MeshToonMaterial({ vertexColors: true });
    m.onBeforeCompile = (s) => {
      Object.assign(s.uniforms, u);
      eclairerParLampes(s, lampes, 0.5);
      lumierePerso(s);
      s.vertexShader = s.vertexShader
        .replace('#include <common>', '#include <common>\nvarying float vHauteur;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvHauteur = (modelMatrix * vec4(transformed, 1.0)).y;');
      s.fragmentShader = s.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vHauteur;\nuniform float mouille, ligne, pied, avecPeau;\nuniform vec3 peau;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          {
            float w = mouille * (1.0 - smoothstep(ligne - 0.04, ligne + 0.04, vHauteur - pied));
            float p = avecPeau * (1.0 - smoothstep(0.03, 0.09, distance(diffuseColor.rgb, peau)));
            diffuseColor.rgb *= 1.0 - w * mix(0.52, 0.16, p);
          }`);
    };
    m.customProgramCacheKey = () => 'perso-mouille';
    return { materiel: m, ...u };
  };
  return {
    corps, corpsPerso, sol, trait: creerTrait(true, epaisseurs.decor), traitPerso: creerTrait(false, epaisseurs.perso),
    brume, coupe, ecran, epaisseurs, carte, details, vent, profondeur, persoMouille, lueur, lampes, saisons,
  };
}

/**
 * Le rendu : la scène dans une image lissée (anticrénelage multi-échantillons), avec sa profondeur ; une
 * copie réduite au quart, faite du seul lointain (pour le flou, sans que le premier plan y bave) ; puis à
 * l'écran : le lointain flou, un peu plus de couleur, un soupçon de vignette.
 * echantillons : l'anticrénelage (0 : aucun) ; flou : false pour s'en passer.
 */
export function passeFinale(THREE, style, { echantillons = 4, flou = true } = {}) {
  const R = style.rendu;
  const profondeur = new THREE.DepthTexture(1, 1);
  const image = new THREE.WebGLRenderTarget(1, 1, { samples: echantillons, depthTexture: profondeur });
  image.texture.colorSpace = THREE.SRGBColorSpace;
  const reduite = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false });
  const camera = new THREE.Camera();
  const pres = { value: 0.1 }, loin = { value: 8000 }, debut = { value: R.flou.debut }, fin = { value: R.flou.fin };
  const texel = { value: new THREE.Vector2(1, 1) }, texelReduit = { value: new THREE.Vector2(1, 1) };
  const LINEAIRE = `
    uniform float pres, loin, debut, fin;
    float lointain(float d) {
      // le ciel (rien n'y est dessiné : la profondeur est restée à 1) reste net : les étoiles, les nuages
      if (d > 0.999999) return 0.0;
      float z = d * 2.0 - 1.0;
      return smoothstep(debut, fin, 2.0 * pres * loin / (loin + pres - z * (loin - pres)));
    }`;
  const SOMMET = `
    in vec3 position;
    out vec2 vUv;
    void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
  const passe = (fragmentShader, uniforms) => {
    const m = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3, uniforms, vertexShader: SOMMET, fragmentShader, depthTest: false, depthWrite: false,
    }));
    m.geometry.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    m.frustumCulled = false;
    const s = new THREE.Scene();
    s.add(m);
    return { scene: s, materiel: m.material };
  };
  // la copie réduite : quatre points (chacun la moyenne de quatre pixels), pesés par leur éloignement
  const reduction = passe(`
    precision highp float;
    uniform sampler2D image, profondeur;
    uniform vec2 texel;
    ${LINEAIRE}
    in vec2 vUv;
    out vec4 sortie;
    void main() {
      vec4 s = vec4(0.0);
      for (int i = 0; i < 4; i++) {
        vec2 uv = vUv + vec2(i % 2 == 0 ? -1.0 : 1.0, i < 2 ? -1.0 : 1.0) * texel;
        float w = lointain(texture(profondeur, uv).r);
        s += vec4(texture(image, uv).rgb * w, w);
      }
      sortie = s * 0.25;
    }`, { image: { value: image.texture }, profondeur: { value: profondeur }, texel, pres, loin, debut, fin });
  const finale = passe(`
    precision highp float;
    uniform sampler2D image, profondeur, reduite;
    uniform vec2 texelReduit, ecran;
    uniform float force, saturation, vignette;
    ${LINEAIRE}
    in vec2 vUv;
    out vec4 sortie;
    void main() {
      vec3 c = texture(image, vUv).rgb;
      float f = force > 0.0 ? lointain(texture(profondeur, vUv).r) * force : 0.0;
      if (f > 0.002) {
        vec4 b = texture(reduite, vUv + vec2(-0.7, -0.7) * texelReduit) + texture(reduite, vUv + vec2(0.7, -0.7) * texelReduit)
          + texture(reduite, vUv + vec2(-0.7, 0.7) * texelReduit) + texture(reduite, vUv + vec2(0.7, 0.7) * texelReduit);
        c = mix(c, b.rgb / max(b.a, 1e-4), f * smoothstep(0.0, 0.4, b.a));
      }
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = max(mix(vec3(l), c, saturation), 0.0);
      vec2 v = vUv - 0.5;
      c *= 1.0 - vignette * smoothstep(0.45, 0.95, length(v * vec2(ecran.x / ecran.y, 1.0)) / 1.1);
      // en sRGB pour l'écran
      c = mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
      sortie = vec4(clamp(c, 0.0, 1.0), 1.0);
    }`, {
    image: { value: image.texture }, profondeur: { value: profondeur }, reduite: { value: reduite.texture },
    texelReduit, ecran: { value: new THREE.Vector2(1, 1) }, force: { value: flou ? R.flou.force : 0 },
    saturation: { value: R.saturation }, vignette: { value: R.vignette }, pres, loin, debut, fin,
  });
  return {
    /** La taille de l'écran, en pixels réels. */
    dimensionner(l, h) {
      image.setSize(l, h);
      reduite.setSize(Math.max(1, Math.round(l / 4)), Math.max(1, Math.round(h / 4)));
      texel.value.set(1 / l, 1 / h);
      texelReduit.value.set(1 / reduite.width, 1 / reduite.height);
      finale.materiel.uniforms.ecran.value.set(l, h);
    },
    rendre(rendu, scene, cam) {
      pres.value = cam.near;
      loin.value = cam.far;
      rendu.setRenderTarget(image);
      rendu.render(scene, cam);
      if (flou) {
        rendu.setRenderTarget(reduite);
        rendu.render(reduction.scene, camera);
      }
      rendu.setRenderTarget(null);
      rendu.render(finale.scene, camera);
    },
  };
}
