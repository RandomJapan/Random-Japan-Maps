// ================================================================
//  La mer vivante (style « vieille carte »). Vue de loin, la mer bouge un peu :
//  - la houle : les lignes d'eau gravées avancent doucement vers les côtes ;
//  - de temps en temps, un bateau de commerce de l'époque Edo (un bezaisen, dit « kitamae-bune »,
//    petit modèle 3D) apparaît au large, file vers un port et s'efface avant la côte ;
//  - parfois une baleine souffle, et plus rarement un serpent de mer sort de l'eau.
//  Tout disparaît quand on zoome sur un lieu. Rien ne bouge si l'appareil demande moins d'animations.
// ================================================================
import { URL_THREE } from './couche3d.js';

// Image des distances à la côte : mêmes bornes et même codage que outils/fabriquer_houle.py
const IMAGE_DISTANCES = 'data/distance-cote.png';
const BORNES = [121.5, 23.0, 157.5, 51.5]; // ouest, sud, est, nord
const DISTANCE_MAX = 160; // pixels au zoom 5 (valeur 255 de l'image)
const Z5 = 512 * 2 ** 5; // pixels d'écran au zoom 5 pour une unité de la carte (le monde entier)

const ZOOM_CALME = 7.2; // au-delà, on regarde un lieu : la mer redevient calme
const IMAGES_PAR_SECONDE = 15; // assez pour ces mouvements lents, sans trop user la batterie
const LIGNES_FIXES = ['lignes-eau-1', 'lignes-eau-2', 'lignes-eau-3']; // remplacées par la houle quand elle marche

// Les bateaux : jamais plus de 2 à la fois, toujours au large (distances en pixels au zoom 5, ≈ 2 km chacun)
const MAX_BATEAUX = 2;
const ENTRE_BATEAUX = [7, 16]; // secondes entre deux départs
const VITESSE_BATEAU = 4; // pixels d'écran par seconde, quel que soit le zoom
const TAILLE_BATEAU = matchMedia('(max-width: 720px)').matches ? 32 : 40; // hauteur à l'écran (pixels)
const LARGE_DEPART = 46; // un bateau apparaît au moins à cette distance des côtes…
const LARGE_FIN = 30; // … et s'efface avant d'en être plus près que ça
const APPARITION = 1.6; // secondes pour grandir ou s'effacer
// Ports de l'époque Edo, avec le cap vers le large (0 = nord, 90 = est) : les bateaux arrivent ou partent par là
const PORTS = [
  { nom: 'Edo', ou: [139.75, 34.9], large: 175 },
  { nom: 'Shimoda', ou: [138.95, 34.55], large: 160 },
  { nom: 'Osaka', ou: [135.05, 33.85], large: 200 },
  { nom: 'Tosa', ou: [133.55, 33.3], large: 175 },
  { nom: 'Nagasaki', ou: [129.6, 32.7], large: 245 },
  { nom: 'Kagoshima', ou: [130.55, 30.95], large: 205 },
  { nom: 'Naha', ou: [127.5, 26.3], large: 255 },
  { nom: 'Sakata', ou: [139.6, 39.0], large: 285 },
  { nom: 'Tsuruga', ou: [135.9, 35.9], large: 345 },
  { nom: 'Matsumae', ou: [139.95, 41.3], large: 265 },
  { nom: 'Hakodate', ou: [141.5, 41.5], large: 105 },
  { nom: 'Ishinomaki', ou: [141.55, 38.2], large: 110 },
];

// Où les bêtes apparaissent : des coins connus pour les baleines, et le grand large pour le serpent de mer.
// premiere / entre : secondes avant la première scène, puis entre deux scènes (leur durée est dans style.css).
const BETES = [
  {
    nom: 'baleine', premiere: 5, entre: [30, 55],
    lieux: [[133.5, 33.05], [134.4, 33.05], [126.9, 26.5], [142.5, 27.3], [145.05, 44.5], [142.4, 39.3], [136.6, 37.9], [141.3, 35.4]],
  },
  {
    nom: 'monstre', premiere: 16, entre: [80, 130],
    lieux: [[138.6, 32.4], [133.2, 38.3], [143.0, 36.5], [128.8, 31.8], [140.0, 43.6]],
  },
];

// ---------------------------------------------------------------- Dessins (encre et aquarelle, comme sur la carte)
const DESSINS = {
  // Baleine : le dos sort de l'eau, elle souffle, puis montre sa queue en plongeant
  baleine: `<svg viewBox="0 0 64 40" aria-hidden="true">
    <defs><clipPath id="eau-baleine"><rect x="-8" y="-12" width="80" height="46.6"/></clipPath></defs>
    <path class="remous" d="M2 35.2q5-1.8 10 0t10 0 10 0 10 0 10 0 10 0"/>
    <g clip-path="url(#eau-baleine)">
      <g class="b-dos">
        <path class="b-corps" d="M7 34.8C10.5 26 22 21.4 35 21.8 44.5 22.1 51.2 26.6 55.5 34.8Z"/>
        <path class="b-corps" d="M40.5 22.6 44 18.6 45.6 23.4Z"/>
        <path class="b-reflet" d="M15 29.6C22 26.6 33 25.6 45 27.6"/>
      </g>
      <g class="b-queue">
        <path class="b-corps" d="M51.8 34.8C52.4 30 52.6 26.6 52.6 23.6 49.6 22.6 46.6 20 45.4 16.6 49 17.6 51.6 19.4 53.1 21 54.6 19.4 57.2 17.6 60.8 16.6 59.6 20 56.6 22.6 53.6 23.6 53.6 26.6 53.8 30 54.4 34.8Z"/>
      </g>
    </g>
    <g class="b-jet">
      <path class="jet-fond" d="M17 24C16 17.5 12.4 12.6 7.6 11M17 24C18 17.5 21.6 12.6 26.4 11M17 24V8.6"/>
      <path class="jet" d="M17 24C16 17.5 12.4 12.6 7.6 11M17 24C18 17.5 21.6 12.6 26.4 11M17 24V8.6"/>
      <circle class="goutte" cx="6.4" cy="9.6" r="1.1"/><circle class="goutte" cx="27.6" cy="9.6" r="1.1"/><circle class="goutte" cx="17" cy="6.4" r="1.2"/>
      <circle class="goutte" cx="11" cy="7.4" r=".8"/><circle class="goutte" cx="23" cy="7.4" r=".8"/>
    </g>
  </svg>`,
  // Serpent de mer, comme sur les cartes anciennes : deux anneaux et une tête à crête rouge
  monstre: `<svg viewBox="0 0 84 44" aria-hidden="true">
    <defs><clipPath id="eau-monstre"><rect x="-8" y="-14" width="100" height="52.6"/></clipPath></defs>
    <path class="remous" d="M2 39.2q4-1.6 8 0t8 0 8 0 8 0 8 0 8 0 8 0 8 0 8 0"/>
    <g clip-path="url(#eau-monstre)">
      <g class="m-a1">
        <path class="m-crete" d="M9.4 32.4 10 27.8 12.4 30.6 13.8 26.4 15.6 30 17.4 27.6 17.6 32Z"/>
        <path class="m-fond" d="M6 39.4C6.6 29.4 19.4 29.4 20 39.4"/><path class="m-corps" d="M6 39.4C6.6 29.4 19.4 29.4 20 39.4"/>
        <path class="m-ecailles" d="M6 39.4C6.6 29.4 19.4 29.4 20 39.4"/>
      </g>
      <g class="m-a2">
        <path class="m-crete" d="M30.6 29.4 31.6 23.6 34.4 27 36 21.8 38.4 26.2 40.4 22.6 41.6 29Z"/>
        <path class="m-fond" d="M27 39.4C27.8 24.8 44.2 24.8 45 39.4"/><path class="m-corps" d="M27 39.4C27.8 24.8 44.2 24.8 45 39.4"/>
        <path class="m-ecailles" d="M27 39.4C27.8 24.8 44.2 24.8 45 39.4"/>
      </g>
      <g class="m-tete">
        <path class="m-crete" d="M51.6 30.6 49.4 25.4 53.6 26.8 52.8 20.8 57 23.2 57.2 16.6 61 19.4 62.6 12.2 64.6 11.4Z"/>
        <path class="m-fond" d="M51 39.4C50.6 29.4 53.4 20.2 61 15.6"/><path class="m-corps" d="M51 39.4C50.6 29.4 53.4 20.2 61 15.6"/>
        <path class="m-ecailles" d="M51 39.4C50.6 29.4 53.4 20.2 61 15.6"/>
        <path class="m-crane" d="M57.6 12.8C61.4 9.2 68 8.6 72.4 11.2L80 12.8 72.8 14.6 78.6 18.6 70.8 17C66.6 18.6 60.6 17.8 57.6 12.8Z"/>
        <circle class="m-oeil" cx="65.4" cy="12.6" r="1.5"/><circle class="m-pupille" cx="65.9" cy="12.6" r=".7"/>
      </g>
    </g>
  </svg>`,
};

// ---------------------------------------------------------------- Outils
const lisser = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const entre = ([a, b]) => a + Math.random() * (b - a);

function element(classe, html) {
  const el = document.createElement('div');
  el.className = `vie-marine ${classe}`;
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = html;
  return el;
}

/** Lit l'image des distances : renvoie la distance à la côte (pixels au zoom 5) d'un point de la carte (x, y). */
function lireDistances(maplibregl, image) {
  const toile = document.createElement('canvas');
  toile.width = image.naturalWidth;
  toile.height = image.naturalHeight;
  const ctx = toile.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, toile.width, toile.height).data;
  const no = maplibregl.MercatorCoordinate.fromLngLat([BORNES[0], BORNES[3]]);
  const se = maplibregl.MercatorCoordinate.fromLngLat([BORNES[2], BORNES[1]]);
  return (x, y) => {
    const u = (x - no.x) / (se.x - no.x), v = (y - no.y) / (se.y - no.y);
    if (u < 0 || u >= 1 || v < 0 || v >= 1) return DISTANCE_MAX; // hors de l'image : le grand large
    const val = pixels[(Math.floor(v * toile.height) * toile.width + Math.floor(u * toile.width)) * 4] / 255;
    return val * val * DISTANCE_MAX;
  };
}

// ---------------------------------------------------------------- La houle (dessinée par la carte graphique)
const SHADER_SOMMETS = `#version 300 es
uniform mat4 u_matrice;
uniform float u_hauteur;
in vec2 a_pos;
in vec2 a_uv;
out vec2 v_uv;
out vec2 v_merc;
void main() {
  v_uv = a_uv;
  v_merc = a_pos;
  gl_Position = u_matrice * vec4(a_pos, u_hauteur, 1.0);
}`;

// Pour chaque point de la mer : sa distance à la côte (l'image), puis des lignes à intervalles réguliers
// qui avancent avec le temps vers la côte. Épaisseur constante à l'écran, comme un trait de gravure.
const SHADER_COULEURS = `#version 300 es
precision highp float;
uniform sampler2D u_distances;
uniform float u_echelle, u_temps, u_opacite, u_ratio, u_espacement, u_zone, u_vitesse;
uniform vec3 u_encre;
in vec2 v_uv;
in vec2 v_merc;
out vec4 couleur;
void main() {
  float v = texture(u_distances, v_uv).r;
  if (v <= 0.0 || v > 0.97) discard;
  float d = v * v * ${DISTANCE_MAX}.0 * u_echelle; // distance à la côte, en pixels d'écran (vue de dessus)
  // les fronts de houle ondulent un peu le long des côtes, comme tracés à la main
  float tremble = 0.18 * sin(v_merc.x * 377.0 + v_merc.y * 211.0) + 0.1 * sin(v_merc.x * 911.0 - v_merc.y * 640.0);
  float s = (d + u_temps * u_vitesse) / u_espacement + tremble;
  float f = fract(s);
  float ecart = min(f, 1.0 - f) * u_espacement; // jusqu'à la ligne la plus proche
  float parPixel = length(vec2(dFdx(d), dFdy(d))) + 1e-4;
  float trait = 1.0 - smoothstep(0.5 * u_ratio - 0.5, 0.5 * u_ratio + 0.6, ecart / parPixel);
  float enveloppe = smoothstep(u_zone, u_zone * 0.55, d) * smoothstep(1.5, 6.0, d);
  float a = trait * enveloppe * u_opacite;
  couleur = vec4(u_encre * a, a);
}`;

function compiler(gl, type, source) {
  const s = gl.createShader(type);
  gl.shaderSource(s, source);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}

/** Réglages de la houle selon le zoom (pixels d'écran) : elle s'efface quand on zoome, comme les lignes d'eau. */
function reglagesHoule(z) {
  const f = 2 ** ((z - 5) * 0.45);
  return { espacement: 8.5 * f, zone: 32 * f, vitesse: 2.4 * f, opacite: 0.62 * (1 - lisser((z - 6.5) / 2)) };
}

function coucheHoule(map, maplibregl, image, obtenirTemps, quandPrete) {
  let gl2 = null, prog, vao, texture, u;
  const no = maplibregl.MercatorCoordinate.fromLngLat([BORNES[0], BORNES[3]]);
  const se = maplibregl.MercatorCoordinate.fromLngLat([BORNES[2], BORNES[1]]);
  const metresParUnite = 1 / maplibregl.MercatorCoordinate.fromLngLat([137, 35], 1).z;

  function preparer(gl) {
    prog = gl.createProgram();
    gl.attachShader(prog, compiler(gl, gl.VERTEX_SHADER, SHADER_SOMMETS));
    gl.attachShader(prog, compiler(gl, gl.FRAGMENT_SHADER, SHADER_COULEURS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    u = {};
    for (const nom of ['u_matrice', 'u_hauteur', 'u_distances', 'u_echelle', 'u_temps', 'u_opacite', 'u_ratio',
      'u_espacement', 'u_zone', 'u_vitesse', 'u_encre']) u[nom] = gl.getUniformLocation(prog, nom);
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const tampon = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tampon);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      no.x, no.y, 0, 0, se.x, no.y, 1, 0, no.x, se.y, 0, 1, se.x, se.y, 1, 1,
    ]), gl.STATIC_DRAW);
    for (const [nom, decalage] of [['a_pos', 0], ['a_uv', 8]]) {
      const loc = gl.getAttribLocation(prog, nom);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 16, decalage);
    }
    gl.bindVertexArray(null);
    texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, gl.RED, gl.UNSIGNED_BYTE, image);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.BROWSER_DEFAULT_WEBGL);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    quandPrete();
  }

  return {
    id: 'houle',
    type: 'custom',
    renderingMode: '3d',
    onAdd(_map, gl) {
      gl2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
    },
    render(gl, args) {
      if (!gl2) return;
      const z = map.getZoom();
      const r = reglagesHoule(z);
      if (r.opacite <= 0) return;
      // Tout se prépare ici, au premier dessin : la carte remet ensuite son propre état en place.
      if (!prog) {
        try { preparer(gl); } catch (e) { gl2 = false; console.warn('Houle indisponible', e); return; }
      }
      gl.useProgram(prog);
      gl.bindVertexArray(vao);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniformMatrix4fv(u.u_matrice, false, Float32Array.from(args.defaultProjectionData.mainMatrix));
      // un peu au-dessus de la mer (le relief y vaut 0 m) : la terre, plus haute, cache la houle
      gl.uniform1f(u.u_hauteur, (2 * (map.terrain?.exaggeration || 1)) / metresParUnite);
      gl.uniform1i(u.u_distances, 0);
      gl.uniform1f(u.u_echelle, 2 ** (z - 5));
      gl.uniform1f(u.u_temps, obtenirTemps());
      gl.uniform1f(u.u_opacite, r.opacite);
      gl.uniform1f(u.u_ratio, map.getPixelRatio());
      gl.uniform1f(u.u_espacement, r.espacement);
      gl.uniform1f(u.u_zone, r.zone);
      gl.uniform1f(u.u_vitesse, r.vitesse);
      gl.uniform3f(u.u_encre, 61 / 255, 107 / 255, 100 / 255); // #3d6b64, l'encre des lignes d'eau
      gl.depthMask(false);
      gl.enable(gl.POLYGON_OFFSET_FILL);
      gl.polygonOffset(-1, -4);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.disable(gl.POLYGON_OFFSET_FILL); // la carte ne connaît pas ce réglage : on le remet
      gl.bindVertexArray(null);
    },
  };
}

// ---------------------------------------------------------------- Les bateaux (petits modèles 3D)
/** Couche 3D des bateaux : le même moteur (three.js) et la même lumière que les modèles des lieux (couche3d.js). */
function coucheBateaux(map, maplibregl, THREE, modele, flotte) {
  let renderer, scene, camera, soleil, bateaux;
  const m4 = {
    // modèle (x, y = haut, z = proue) → carte (x = est, y = sud, z = haut) : un miroir, comme dans couche3d.js
    base: new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1),
    instance: new THREE.Matrix4(), rotation: new THREE.Matrix4(), centre: new THREE.Matrix4(),
    euler: new THREE.Euler(0, 0, 0, 'YXZ'), pos: new THREE.Vector3(),
  };
  return {
    id: 'bateaux-3d',
    type: 'custom',
    renderingMode: '3d',
    onAdd(_map, gl) {
      renderer = new THREE.WebGLRenderer({ canvas: map.getCanvas(), context: gl });
      renderer.autoClear = false;
      scene = new THREE.Scene();
      camera = new THREE.Camera();
      const ciel = new THREE.HemisphereLight(0xfff3dc, 0x6b5a44, 2.5);
      ciel.position.set(0, 0, 1);
      soleil = new THREE.DirectionalLight(0xfff0d8, 2.2);
      bateaux = new THREE.InstancedMesh(modele.geometrie, new THREE.MeshLambertMaterial({ vertexColors: true }), MAX_BATEAUX);
      bateaux.frustumCulled = false;
      bateaux.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      bateaux.count = 0;
      scene.add(ciel, soleil, bateaux);
    },
    render(gl, args) {
      if (!flotte.length || map.getZoom() >= ZOOM_CALME) return;
      const k = TAILLE_BATEAU / (512 * 2 ** map.getZoom()); // taille du modèle en unités de la carte
      // tout autour du centre de l'écran : de petits nombres, donc pas de tremblement
      const centre = maplibregl.MercatorCoordinate.fromLngLat(map.getCenter());
      const b = (map.getBearing() * Math.PI) / 180;
      soleil.position.set(-Math.sin(b) - 0.5 * Math.cos(b), Math.cos(b) - 0.5 * Math.sin(b), 1.2);
      let n = 0;
      for (const bateau of flotte) {
        const e = k * lisser(bateau.echelle);
        m4.euler.set(bateau.tangage, bateau.cap, bateau.roulis);
        m4.rotation.makeRotationFromEuler(m4.euler);
        m4.pos.set(bateau.x - centre.x, bateau.y - centre.y, 0);
        m4.instance.makeScale(e, e, e).multiply(m4.base).multiply(m4.rotation).setPosition(m4.pos);
        bateaux.setMatrixAt(n++, m4.instance);
      }
      bateaux.count = n;
      bateaux.instanceMatrix.needsUpdate = true;
      camera.projectionMatrix.fromArray(args.defaultProjectionData.mainMatrix)
        .multiply(m4.centre.makeTranslation(centre.x, centre.y, 0));
      camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
      renderer.resetState();
      renderer.setViewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      renderer.render(scene, camera);
    },
    onRemove() { renderer?.dispose(); },
  };
}

// ---------------------------------------------------------------- Mise en place
/**
 * Fait vivre la mer.
 * @param mers - positions [lng, lat] des noms des mers : ni bateau ni bête n'apparaît dessus
 */
export function animerMer(map, maplibregl, { mers = [] } = {}) {
  const sansMouvement = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const conteneur = map.getContainer();
  let temps = 0; // horloge de la mer (secondes), arrêtée quand la mer est calme ou la page cachée
  let calme = null;
  let houlePrete = false;
  let distance = null; // distance à la côte d'un point (x, y), dès que l'image est lue
  const flotte = []; // les bateaux en mer
  let bateauxPrets = false;
  let prochainBateau = 3;

  function majCalme() {
    const c = map.getZoom() >= ZOOM_CALME;
    if (c !== calme) {
      calme = c;
      conteneur.classList.toggle('mer-calme', c);
    }
  }
  map.on('zoom', majCalme);
  majCalme();

  /** Un endroit [lng, lat] bien visible : à l'écran, loin des noms des mers, pas caché derrière une montagne. */
  function bienVisible(lieu) {
    const { clientWidth: l, clientHeight: h } = conteneur;
    const q = map.project(lieu);
    if (q.x < 70 || q.x > l - 70 || q.y < 100 || q.y > h - 80) return false;
    // (les noms des mers ne se montrent que de loin)
    if (conteneur.classList.contains('loin') && mers.some((m) => {
      const n = map.project(m);
      return (Math.abs(n.x - q.x) < 130 && Math.abs(n.y - q.y) < 50) || (Math.abs(n.x - q.x) < 40 && Math.abs(n.y - q.y) < 120);
    })) return false;
    // derrière une montagne, le point de l'écran montre le relief, loin de cet endroit
    const vu = map.unproject(q);
    return Math.hypot(vu.lng - lieu[0], vu.lat - lieu[1]) < 0.2;
  }

  // --- Les bateaux : chacun apparaît au large, file droit vers un port (ou en part) et s'efface avant la côte
  const versLngLat = (x, y) => new maplibregl.MercatorCoordinate(x, y).toLngLat().toArray();

  function lancerBateau() {
    for (let essai = 0; essai < 24; essai++) {
      const port = PORTS[Math.floor(Math.random() * PORTS.length)];
      const A = maplibregl.MercatorCoordinate.fromLngLat(port.ou);
      const cap = ((port.large + (Math.random() * 2 - 1) * 35) * Math.PI) / 180;
      const longueur = (120 + Math.random() * 90) / Z5;
      const S = { x: A.x + Math.sin(cap) * longueur, y: A.y - Math.cos(cap) * longueur };
      if (distance(S.x, S.y) < LARGE_DEPART) continue;
      // du large vers le port, jusqu'à la limite des côtes
      const ux = (A.x - S.x) / longueur, uy = (A.y - S.y) / longueur;
      const pas = 2 / Z5;
      let parcours = 0;
      while (parcours + pas < longueur && distance(S.x + ux * (parcours + pas), S.y + uy * (parcours + pas)) >= LARGE_FIN) parcours += pas;
      if (parcours * Z5 < 60) continue;
      const E = { x: S.x + ux * parcours, y: S.y + uy * parcours };
      // pas de terre cachée (îles des voisins, sous le grand cache) sur le chemin
      let terre = false;
      for (let t = 0; t <= 1 && !terre; t += 0.1) terre = (map.queryTerrainElevation(versLngLat(S.x + (E.x - S.x) * t, S.y + (E.y - S.y) * t)) || 0) > 5;
      if (terre) continue;
      const arrive = Math.random() < 0.6; // il arrive au port, ou il en part vers le large
      const [D, F] = arrive ? [S, E] : [E, S];
      const depart = versLngLat(D.x, D.y);
      if (!bienVisible(depart)) continue;
      const q = map.project(depart);
      if (flotte.some((b) => { const r = map.project(versLngLat(b.x, b.y)); return Math.hypot(r.x - q.x, r.y - q.y) < 140; })) continue;
      const dx = (F.x - D.x) / parcours, dy = (F.y - D.y) / parcours;
      flotte.push({
        x: D.x, y: D.y, dx, dy, reste: parcours,
        cap: Math.atan2(dx, dy), // dans le repère du modèle : la proue (+z) vers ce cap (est = x, sud = y)
        echelle: 0, etat: 'apparait', phase: Math.random() * 6, roulis: 0, tangage: 0,
      });
      return true;
    }
    return false;
  }

  function avancerBateaux(dt) {
    const pas = (VITESSE_BATEAU * dt) / (512 * 2 ** map.getZoom()); // vitesse constante à l'écran
    for (const b of flotte) {
      const avance = b.etat === 'disparait' ? pas * 0.6 : pas;
      b.x += b.dx * avance;
      b.y += b.dy * avance;
      b.reste -= avance;
      if (b.etat === 'apparait' && (b.echelle += dt / APPARITION) >= 1) { b.echelle = 1; b.etat = 'navigue'; }
      if (b.etat !== 'disparait' && b.reste <= 0) b.etat = 'disparait';
      if (b.etat === 'disparait') b.echelle -= dt / APPARITION;
      b.roulis = 0.07 * Math.sin(temps * 1.5 + b.phase);
      b.tangage = 0.035 * Math.sin(temps * 1.1 + b.phase * 2);
    }
    for (let i = flotte.length - 1; i >= 0; i--) if (flotte[i].echelle <= 0 && flotte[i].etat === 'disparait') flotte.splice(i, 1);
    if (temps >= prochainBateau && flotte.length < MAX_BATEAUX) {
      prochainBateau = temps + (lancerBateau() ? entre(ENTRE_BATEAUX) : 2);
    }
  }

  async function chargerBateaux() {
    try {
      const THREE = await import(URL_THREE);
      const { fabriquerBateau } = await import('./modeles3d.js');
      map.addLayer(coucheBateaux(map, maplibregl, THREE, fabriquerBateau(THREE), flotte), map.getLayer('modeles-3d') ? 'modeles-3d' : undefined);
      bateauxPrets = true;
    } catch (e) {
      console.warn('Bateaux 3D indisponibles', e);
    }
  }

  // --- La baleine et le serpent de mer
  for (const bete of BETES) {
    bete.el = element(bete.nom, DESSINS[bete.nom]);
    bete.prochaine = bete.premiere;
    bete.marqueur = new maplibregl.Marker({ element: bete.el, anchor: 'bottom', offset: [0, 4], opacityWhenCovered: '0' })
      .setLngLat(bete.lieux[0])
      .addTo(map);
    const fin = (e) => {
      if (e.target !== bete.el) return;
      bete.el.classList.remove('joue');
      bete.enCours = false;
      bete.prochaine = temps + entre(bete.entre);
    };
    bete.el.addEventListener('animationend', fin);
    bete.el.addEventListener('animationcancel', fin);
  }

  function reveillerBetes() {
    for (const bete of BETES) {
      if (bete.enCours || temps < bete.prochaine) continue;
      // un endroit bien visible, et pas le même que la dernière fois si possible
      const visibles = bete.lieux.filter(bienVisible);
      if (!visibles.length) { bete.prochaine = temps + 5; continue; }
      const choix = visibles.length > 1 ? visibles.filter((p) => p !== bete.dernier) : visibles;
      const lieu = choix[Math.floor(Math.random() * choix.length)];
      bete.dernier = lieu;
      jouerScene(bete.nom, lieu);
    }
  }

  // --- La houle et les bateaux ont besoin de l'image des distances à la côte
  if (sansMouvement) return; // les lignes d'eau fixes restent, rien ne bouge
  const image = new Image();
  image.decoding = 'async';
  image.src = IMAGE_DISTANCES;
  image.decode().then(() => {
    distance = lireDistances(maplibregl, image);
    const couche = coucheHoule(map, maplibregl, image, () => temps % 3600, () => {
      houlePrete = true;
      // la houle remplace les lignes d'eau fixes (au prochain dessin, pour ne pas les cacher trop tôt)
      requestAnimationFrame(() => {
        for (const id of LIGNES_FIXES) if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'none');
      });
    });
    const ajouter = () => {
      map.addLayer(couche, map.getLayer('modeles-3d') ? 'modeles-3d' : undefined);
      // three.js (pour les bateaux) se charge une fois la carte affichée, sans retarder le démarrage
      setTimeout(chargerBateaux, 1500);
    };
    if (map.loaded() || map.style?._loaded) ajouter(); else map.once('load', ajouter);
  }).catch((e) => console.warn('Mer vivante : image des distances indisponible', e));

  // --- L'horloge de la mer (la houle, les bateaux et les bêtes avancent ensemble)
  let avant = 0;
  function boucle(maintenant) {
    requestAnimationFrame(boucle);
    const dt = (maintenant - avant) / 1000;
    if (dt < 1 / IMAGES_PAR_SECONDE - 0.004) return;
    avant = maintenant;
    if (calme || document.hidden) return;
    const pas = Math.min(dt, 0.25);
    temps += pas;
    if (bateauxPrets) avancerBateaux(pas);
    reveillerBetes();
    if ((houlePrete && reglagesHoule(map.getZoom()).opacite > 0) || flotte.length) map.triggerRepaint();
  }
  requestAnimationFrame(boucle);
}

/** Fait jouer tout de suite la scène d'une bête (« baleine » ou « monstre ») à cet endroit [lng, lat]. Sert aussi aux essais. */
export function jouerScene(nom, lieu) {
  const bete = BETES.find((b) => b.nom === nom);
  if (!bete?.marqueur) return;
  bete.marqueur.setLngLat(lieu);
  bete.el.classList.remove('joue');
  void bete.el.offsetWidth; // relance la scène si elle jouait déjà
  bete.el.classList.toggle('miroir', Math.random() < 0.5);
  bete.el.classList.add('joue');
  bete.enCours = true;
}
