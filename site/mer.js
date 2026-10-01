// ================================================================
//  La mer vivante (style « vieille carte »). Vue de loin, la mer bouge un peu :
//  - la houle : les lignes d'eau gravées avancent doucement vers les côtes ;
//  - de petites vagues au large ;
//  - des bateaux de commerce de l'époque Edo (les bezaisen, dits « kitamae-bune ») suivent
//    les vraies routes maritimes de l'époque ;
//  - de temps en temps une baleine souffle, et plus rarement un serpent de mer sort de l'eau.
//  Tout disparaît quand on zoome sur un lieu. Rien ne bouge si l'appareil demande moins d'animations.
// ================================================================

// Image des distances à la côte : mêmes bornes et même codage que outils/fabriquer_houle.py
const IMAGE_DISTANCES = 'data/distance-cote.png';
const BORNES = [121.5, 23.0, 157.5, 51.5]; // ouest, sud, est, nord
const DISTANCE_MAX = 160; // pixels au zoom 5 (valeur 255 de l'image)

const ZOOM_CALME = 7.2; // au-delà, on regarde un lieu : la mer redevient calme
const IMAGES_PAR_SECONDE = 15; // assez pour ces mouvements lents, sans trop user la batterie
const VITESSE_BATEAU = 4.5; // pixels d'écran par seconde
const LIGNES_FIXES = ['lignes-eau-1', 'lignes-eau-2', 'lignes-eau-3']; // remplacées par la houle quand elle marche

// Routes maritimes de l'époque Edo [longitude, latitude], tenues au large (vérifiées avec l'image des distances)
const ROUTES = {
  // Kitamae-bune, la « route de l'ouest » : Osaka → mer intérieure → Shimonoseki → mer du Japon → Hokkaidō
  kitamae: [[135.3, 34.55], [134.66, 34.58], [134.56, 34.46], [134.23, 34.41], [133.81, 34.38], [133.33, 34.15], [132.48, 34.05],
    [131.84, 33.81], [131.34, 33.78], [130.98, 33.94], [130.71, 34.13], [130.72, 34.31], [130.99, 34.55], [131.27, 34.65],
    [131.87, 34.99], [132.3, 35.31], [132.76, 35.65], [133.18, 35.74], [133.68, 35.7], [134.09, 35.73], [135.45, 35.97],
    [135.77, 36.12], [136.33, 36.66], [136.52, 37.28], [136.89, 37.59], [137.68, 37.84], [137.98, 38.22], [138.47, 38.61],
    [139.02, 38.9], [139.34, 39.22], [139.51, 39.56], [139.53, 40.0], [139.69, 40.61], [139.92, 41.1], [139.82, 41.51],
    [139.89, 41.83], [139.98, 41.85]],
  // Higaki-kaisen : Osaka → Edo par le Pacifique
  higaki: [[135.25, 34.48], [134.98, 34.22], [134.9, 33.9], [135.08, 33.64], [135.35, 33.44], [135.62, 33.32], [135.83, 33.33],
    [136.03, 33.42], [136.62, 33.92], [136.94, 34.12], [137.21, 34.37], [137.67, 34.48], [138.1, 34.46], [138.51, 34.48],
    [138.86, 34.47], [139.07, 34.52], [139.2, 34.68], [139.42, 35.05], [139.67, 35.33], [139.85, 35.55]],
  // La « route de l'est » : détroit de Tsugaru → côte du Pacifique → Edo
  higashi: [[140.35, 41.47], [140.66, 41.5], [140.91, 41.58], [141.38, 41.56], [141.68, 41.34], [141.98, 40.79], [142.25, 39.95],
    [142.27, 39.59], [142.06, 38.85], [141.76, 38.3], [141.41, 37.84], [141.18, 36.9], [141.0, 36.25], [141.04, 35.76],
    [140.74, 35.28], [140.52, 35.07], [140.07, 34.81], [139.72, 34.82], [139.67, 34.93], [139.7, 35.17], [139.8, 35.41],
    [139.85, 35.55]],
  // Satsuma (Kagoshima) → royaume de Ryūkyū (Naha)
  ryukyu: [[130.62, 31.45], [130.66, 31.38], [130.45, 30.94], [130.37, 30.74], [130.13, 30.54], [129.75, 30.02], [129.85, 29.46],
    [129.41, 29.05], [129.15, 28.58], [128.61, 27.74], [128.16, 27.03], [127.57, 26.52], [127.5, 26.36], [127.62, 26.22]],
};

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
  // Vaguelettes gravées, couchées sur l'eau
  gravees: [
    '<svg viewBox="0 0 30 11" aria-hidden="true"><path d="M2 8.5Q5.5 2.5 9 8.5Q12.5 2.5 16 8.5Q19.5 2.5 23 8.5"/></svg>',
    '<svg viewBox="0 0 30 11" aria-hidden="true"><path d="M3 6Q5.8 1.5 8.6 6Q11.4 1.5 14.2 6M9.6 10Q12.4 5.5 15.2 10Q18 5.5 20.8 10"/></svg>',
    '<svg viewBox="0 0 30 11" aria-hidden="true"><path d="M4 8Q7.5 2.5 11 8Q14.5 2.5 18 8"/></svg>',
  ],
  // Bezaisen (kitamae-bune) : grande voile carrée à bandes, proue relevée, le blason de l'armateur
  bateau: `<svg viewBox="0 0 48 44" aria-hidden="true">
    <path class="sillage" d="M1 41.6q3.5-1.5 7 0M4.5 43.3q3-1.2 6 0"/>
    <path class="cordage" d="M24 5.5 43.6 27.6M24 5.5 5.6 31.4"/>
    <path class="mat" d="M24 34.5V4.5"/>
    <path class="voile" d="M13 7.6H35Q36.7 19.2 35 31H13Q14.7 19.2 13 7.6Z"/>
    <path class="bandes" d="M16.7 7.6Q18.3 19.2 16.7 31M20.3 7.6Q21.9 19.2 20.3 31M27.7 7.6Q29.3 19.2 27.7 31M31.3 7.6Q32.9 19.2 31.3 31"/>
    <path class="vergue" d="M12 7.3H36M12.4 31.2H35.6"/>
    <circle class="blason" cx="24.4" cy="15.6" r="2.8"/><path class="blason" d="M22 15.6H26.8"/>
    <path class="coque" d="M4.8 31.2H10.6L11.6 34.4H35.2L42.6 27.2 44.2 28 38.6 40H11L6.4 35.6Z"/>
    <path class="bordage" d="M8.4 37H39.6"/>
    <path class="flamme" d="M24 4.2l7.4 1.7-7.4 1.3Z"/>
  </svg>`,
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
/** Petit générateur au hasard « à graine » : les vagues sont toujours au même endroit. */
function hasardGraine(graine) {
  return () => {
    graine = (graine + 0x6d2b79f5) | 0;
    let t = Math.imul(graine ^ (graine >>> 15), 1 | graine);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const lisser = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const entre = ([a, b]) => a + Math.random() * (b - a);

function element(classe, html) {
  const el = document.createElement('div');
  el.className = `vie-marine ${classe}`;
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = html;
  return el;
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

// ---------------------------------------------------------------- Routes des bateaux
function preparerRoute(maplibregl, points) {
  const P = points.map((p) => maplibregl.MercatorCoordinate.fromLngLat(p));
  const q = [P[0], ...P, P[P.length - 1]];
  const pts = [];
  // courbe lisse (Catmull-Rom) qui passe par tous les points
  for (let k = 1; k < q.length - 2; k++) {
    const [a, b, c, d] = [q[k - 1], q[k], q[k + 1], q[k + 2]];
    for (let s = 0; s < 8; s++) {
      const t = s / 8, t2 = t * t, t3 = t2 * t;
      const f = (u0, u1, u2, u3) => 0.5 * (2 * u1 + (u2 - u0) * t + (2 * u0 - 5 * u1 + 4 * u2 - u3) * t2 + (3 * u1 - u0 - 3 * u2 + u3) * t3);
      pts.push([f(a.x, b.x, c.x, d.x), f(a.y, b.y, c.y, d.y)]);
    }
  }
  pts.push([P[P.length - 1].x, P[P.length - 1].y]);
  const cumul = [0];
  for (let i = 1; i < pts.length; i++) cumul.push(cumul[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, cumul, total: cumul[cumul.length - 1] };
}

/** Le point de la route à la distance s du départ (en unités de la carte). */
function pointSurRoute(route, s) {
  const { pts, cumul } = route;
  let bas = 0, haut = cumul.length - 1;
  while (haut - bas > 1) {
    const m = (bas + haut) >> 1;
    if (cumul[m] <= s) bas = m; else haut = m;
  }
  const t = (s - cumul[bas]) / (cumul[haut] - cumul[bas] || 1);
  return [pts[bas][0] + (pts[haut][0] - pts[bas][0]) * t, pts[bas][1] + (pts[haut][1] - pts[bas][1]) * t];
}

// ---------------------------------------------------------------- Mise en place
/**
 * Fait vivre la mer.
 * @param mers - positions [lng, lat] des noms des mers : les vagues les évitent
 */
export function animerMer(map, maplibregl, { mers = [] } = {}) {
  const sansMouvement = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const conteneur = map.getContainer();
  let temps = 0; // horloge de la mer (secondes), arrêtée quand la mer est calme ou la page cachée
  let calme = null;
  let houlePrete = false;

  function majCalme() {
    const c = map.getZoom() >= ZOOM_CALME;
    if (c !== calme) {
      calme = c;
      conteneur.classList.toggle('mer-calme', c);
    }
  }
  map.on('zoom', majCalme);
  majCalme();

  // --- Les bateaux
  const versLngLat = ([x, y]) => new maplibregl.MercatorCoordinate(x, y).toLngLat();
  const bateaux = Object.values(ROUTES).map((points, i) => {
    const route = preparerRoute(maplibregl, points);
    const el = element('bateau', `<div class="bateau-sens">${DESSINS.bateau}</div>`);
    el.style.setProperty('--delai', `${-i * 0.9}s`);
    const b = {
      route, el,
      s: route.total * (0.12 + 0.76 * ((i * 0.37 + 0.2) % 1)),
      sens: i % 2 ? -1 : 1,
      attente: 0,
      versGauche: null,
      prochainCap: 0,
    };
    b.marqueur = new maplibregl.Marker({ element: el, anchor: 'bottom', offset: [0, 4], subpixelPositioning: true, opacityWhenCovered: '0' })
      .setLngLat(versLngLat(pointSurRoute(route, b.s)))
      .addTo(map);
    return b;
  });

  /** Le bateau regarde dans le sens où il avance à l'écran (la carte tourne, donc on revérifie souvent). */
  function orienter(b) {
    const ici = map.project(versLngLat(pointSurRoute(b.route, b.s)));
    const devant = map.project(versLngLat(pointSurRoute(b.route, Math.min(b.route.total, Math.max(0, b.s + b.sens * 0.0004)))));
    const dx = devant.x - ici.x;
    if (Math.abs(dx) < 0.3) return;
    const gauche = dx < 0;
    if (gauche !== b.versGauche) {
      b.versGauche = gauche;
      b.el.classList.toggle('vers-gauche', gauche);
    }
  }

  function avancerBateaux(dt) {
    const pas = (VITESSE_BATEAU * dt) / (512 * 2 ** map.getZoom()); // vitesse constante à l'écran
    for (const b of bateaux) {
      if (b.attente > 0) {
        b.attente -= dt;
        if (b.attente <= 0) {
          b.sens = -b.sens; // demi-tour au port, puis il repart
          b.el.classList.remove('au-port');
        }
        continue;
      }
      b.s += pas * b.sens;
      if (b.s <= 0 || b.s >= b.route.total) {
        b.s = Math.min(b.route.total, Math.max(0, b.s));
        b.attente = entre([6, 16]);
        b.el.classList.add('au-port');
      }
      b.marqueur.setLngLat(versLngLat(pointSurRoute(b.route, b.s)));
      if (temps >= b.prochainCap) {
        b.prochainCap = temps + 0.3;
        orienter(b);
      }
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
    const { clientWidth: l, clientHeight: h } = conteneur;
    for (const bete of BETES) {
      if (bete.enCours || temps < bete.prochaine) continue;
      // un endroit bien visible à l'écran, et pas le même que la dernière fois si possible
      // (les noms des mers ne se montrent que de loin : on ne les recouvre pas)
      const noms = conteneur.classList.contains('loin') ? mers.map((m) => map.project(m)) : [];
      const visibles = bete.lieux.filter((p) => {
        const q = map.project(p);
        if (q.x < 70 || q.x > l - 70 || q.y < 100 || q.y > h - 80) return false;
        if (noms.some((n) => (Math.abs(n.x - q.x) < 130 && Math.abs(n.y - q.y) < 50) || (Math.abs(n.x - q.x) < 40 && Math.abs(n.y - q.y) < 120))) return false;
        // caché derrière une montagne ? Le point de l'écran montre alors le relief, loin de cet endroit
        const vu = map.unproject(q);
        return Math.hypot(vu.lng - p[0], vu.lat - p[1]) < 0.2;
      });
      if (!visibles.length) { bete.prochaine = temps + 5; continue; }
      const choix = visibles.length > 1 ? visibles.filter((p) => p !== bete.dernier) : visibles;
      const lieu = choix[Math.floor(Math.random() * choix.length)];
      bete.dernier = lieu;
      jouerScene(bete.nom, lieu);
    }
  }

  // --- Les vagues au large et la houle : elles ont besoin de l'image des distances à la côte
  const image = new Image();
  image.decoding = 'async';
  image.src = IMAGE_DISTANCES;
  image.decode().then(() => {
    poserVagues(map, maplibregl, image, mers);
    if (sansMouvement) return; // les lignes d'eau fixes restent
    const couche = coucheHoule(map, maplibregl, image, () => temps % 3600, () => {
      houlePrete = true;
      // la houle remplace les lignes d'eau fixes (au prochain dessin, pour ne pas les cacher trop tôt)
      requestAnimationFrame(() => {
        for (const id of LIGNES_FIXES) if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'none');
      });
    });
    const ajouter = () => map.addLayer(couche, map.getLayer('modeles-3d') ? 'modeles-3d' : undefined);
    if (map.loaded() || map.style?._loaded) ajouter(); else map.once('load', ajouter);
  }).catch((e) => console.warn('Mer vivante : image des distances indisponible', e));

  if (sansMouvement) return;

  // --- L'horloge de la mer (la houle et les bateaux avancent ensemble)
  let avant = 0;
  function boucle(maintenant) {
    requestAnimationFrame(boucle);
    const dt = (maintenant - avant) / 1000;
    if (dt < 1 / IMAGES_PAR_SECONDE - 0.004) return;
    avant = maintenant;
    if (calme || document.hidden) return;
    const pas = Math.min(dt, 0.25);
    temps += pas;
    avancerBateaux(pas);
    reveillerBetes();
    if (houlePrete && reglagesHoule(map.getZoom()).opacite > 0) map.triggerRepaint();
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

/** Petites vagues éparpillées au large, loin des côtes et des noms des mers (toujours aux mêmes endroits). */
function poserVagues(map, maplibregl, image, mers) {
  const toile = document.createElement('canvas');
  toile.width = image.naturalWidth;
  toile.height = image.naturalHeight;
  const ctx = toile.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, toile.width, toile.height).data;
  const no = maplibregl.MercatorCoordinate.fromLngLat([BORNES[0], BORNES[3]]);
  const se = maplibregl.MercatorCoordinate.fromLngLat([BORNES[2], BORNES[1]]);
  const Z5 = 512 * 2 ** 5; // pixels d'écran au zoom 5 par unité de la carte
  const etiquettes = mers.map((p) => maplibregl.MercatorCoordinate.fromLngLat(p));
  // seulement autour du Japon, là où la carte regarde (le grand large est rarement à l'écran)
  const coin1 = maplibregl.MercatorCoordinate.fromLngLat([124.5, 46.5]);
  const coin2 = maplibregl.MercatorCoordinate.fromLngLat([149, 26]);
  const alea = hasardGraine(20261001);
  const poses = [];
  for (let essai = 0; essai < 8000 && poses.length < 64; essai++) {
    const x = coin1.x + alea() * (coin2.x - coin1.x), y = coin1.y + alea() * (coin2.y - coin1.y);
    const u = (x - no.x) / (se.x - no.x), v = (y - no.y) / (se.y - no.y);
    const val = pixels[(Math.floor(v * toile.height) * toile.width + Math.floor(u * toile.width)) * 4] / 255;
    if (val * val * DISTANCE_MAX < 22) continue; // trop près d'une côte
    if (poses.some((p) => Math.hypot(p.x - x, p.y - y) * Z5 < 56)) continue;
    if (etiquettes.some((m) => {
      const dx = Math.abs(m.x - x) * Z5, dy = Math.abs(m.y - y) * Z5;
      return (dx < 120 && dy < 34) || (dx < 26 && dy < 100);
    })) continue;
    poses.push({ x, y });
  }
  poses.forEach((p, i) => {
    const el = element('vague-gravee', DESSINS.gravees[i % DESSINS.gravees.length]);
    el.style.setProperty('--duree', `${5.5 + alea() * 4}s`);
    el.style.setProperty('--delai', `${-alea() * 12}s`);
    // couchées sur l'eau, mais toujours face à celui qui regarde
    new maplibregl.Marker({ element: el, pitchAlignment: 'map', rotationAlignment: 'viewport', opacityWhenCovered: '0' })
      .setLngLat(new maplibregl.MercatorCoordinate(p.x, p.y).toLngLat())
      .addTo(map);
  });
}
