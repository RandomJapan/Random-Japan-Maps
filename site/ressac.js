// ================================================================
//  Le ressac : de près, les vagues arrivent sur la côte et s'y brisent (2026-10-09).
//  De loin, la houle (mer.js) suit un tracé des côtes trop grossier pour qu'on zoome dessus. Ici, la côte
//  vient du relief lui-même (la mer y vaut 0 m pile) : ressac-calcul.js mesure, pour chaque tuile de relief
//  près d'une côte, la distance de chaque point de la mer au rivage. La carte graphique en tire des lignes
//  d'eau qui avancent vers la côte, blanchissent en déferlant et laissent une écume qui se retire.
//  Une couche à part (« custom layer ») : changer la peinture de la carte à chaque image la referait toute.
// ================================================================
const PORTEE = 64; // pixels de tuile : la distance la plus grande que connaît le calcul (ressac-calcul.js)
const ZOOM_DEBUT = [7.6, 8.6]; // il apparaît pendant que la houle du large s'efface (mer.js)
const ZOOM_TUILES = [7, 12]; // tuiles de relief lues : comme la carte (au-delà de 12, elle agrandit celles du 12)
const MAX_CHAMPS = 48; // tuiles gardées en mémoire (une texture de 256 Ko chacune)
const MAX_CALCULS = 3; // en cours à la fois
const PRES_DU_JAPON = 7; // pixels au zoom 5 (≈ 14 km) : plus loin, c'est la côte d'un voisin, cachée par la carte
const Z5 = 512 * 2 ** 5;

const SHADER_SOMMETS = `#version 300 es
uniform mat4 u_matrice;
uniform float u_hauteur;
uniform vec4 u_sous;
uniform vec3 u_sol;
uniform vec4 u_japon;
in vec2 a_pos;
out vec2 v_uv;
out vec2 v_sol;
out vec2 v_japon;
void main() {
  v_uv = u_sous.xy + a_pos * u_sous.zw;
  v_sol = u_sol.xy + a_pos * u_sol.z;
  v_japon = u_japon.xy + a_pos * u_japon.zw;
  gl_Position = u_matrice * vec4(a_pos, u_hauteur, 1.0);
}`;

// d : distance au rivage en pixels d'écran (vue de dessus). Les crêtes avancent vers la côte ; près d'elle, elles
// passent de l'encre des lignes d'eau à l'écume, en traits rompus, et laissent derrière elles une traînée blanche
// qui continue de se retirer une fois la vague arrivée. Un liseré d'écume reste toujours au bord.
const SHADER_COULEURS = `#version 300 es
precision highp float;
uniform sampler2D u_champ;
uniform sampler2D u_japon_image;
uniform float u_echelle, u_temps, u_opacite, u_ratio, u_espacement, u_zone, u_vitesse, u_unite, u_bord, u_force;
uniform vec3 u_encre, u_ecume;
in vec2 v_uv;
in vec2 v_sol;
in vec2 v_japon;
out vec4 couleur;

float hache(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
// Bruit doux, k cases par tuile de zoom 13, répété toutes les 256 tuiles : le motif ne dépend que du lieu.
float bruit(vec2 p, float k) {
  vec2 x = p * k;
  vec2 i = floor(x), f = fract(x);
  float periode = 256.0 * k;
  vec2 u = f * f * (3.0 - 2.0 * f);
  vec2 a = mod(i, periode), b = mod(i + 1.0, periode);
  return mix(mix(hache(a), hache(vec2(b.x, a.y)), u.x), mix(hache(vec2(a.x, b.y)), hache(b), u.x), u.y);
}

void main() {
  float d = texture(u_champ, v_uv).r * ${PORTEE}.0 * u_echelle;
  float parPixel = length(vec2(dFdx(d), dFdy(d))) + 1e-4;
  float esp = u_espacement;
  float zone = min(u_zone, 0.92 * ${PORTEE}.0 * u_echelle);
  float j = texture(u_japon_image, v_japon).r;
  float japon = 1.0 - smoothstep(${PRES_DU_JAPON - 3}.0, ${PRES_DU_JAPON}.0, j * j * 160.0);
  if (d < 0.5 * u_echelle || d > zone || japon <= 0.0) discard;

  // les fronts ondulent le long des côtes (seulement les ondulations assez larges à l'écran)
  float tremble = 0.0;
  for (int o = 0; o < 4; o++) {
    float k = exp2(float(2 * o - 4)); // 1/16, 1/4, 1, 4 cases par tuile de zoom 13
    tremble += smoothstep(60.0, 240.0, u_unite / k) * (bruit(v_sol, k) - 0.5);
  }
  float phase = (d + u_temps * u_vitesse) / esp + 0.8 * tremble;
  float derriere = fract(phase) * esp; // distance à la crête la plus proche côté rivage (la vague, elle, avance)
  float crete = d - derriere; // où est cette crête (négatif : elle a déjà touché la plage)
  float ecart = min(derriere, esp - derriere) / parPixel; // jusqu'à la crête la plus proche, en pixels

  // un grain d'environ 7 pixels, quel que soit le zoom, pour rompre l'écume
  float lk = log2(u_unite / 7.0);
  float ka = exp2(floor(lk));
  float grain = mix(bruit(v_sol, ka), bruit(v_sol, ka * 2.0), fract(lk));

  float casse = 1.0 - smoothstep(0.3 * esp, 1.2 * esp, max(crete, 0.0)); // la vague déferle près du rivage
  float largeur = u_ratio * mix(0.9, 1.9, casse);
  float trait = 1.0 - smoothstep(0.5 * largeur - 0.5, 0.5 * largeur + 0.7, ecart);
  float large = smoothstep(zone, zone * 0.4, d); // les crêtes naissent au large

  float encre = trait * (1.0 - casse) * large * 0.55;
  float traine = casse * (1.0 - smoothstep(0.0, 0.7 * esp, derriere)) * smoothstep(0.25, 0.75, grain);
  float bord = 1.0 - smoothstep(0.45 * u_bord, u_bord, d);
  float ecume = max(max(trait * casse * smoothstep(0.3, 0.6, grain) * 0.95, traine * 0.5) * u_force, bord * 0.5);

  float a = ecume + encre * (1.0 - ecume);
  vec3 c = u_ecume * ecume + u_encre * encre * (1.0 - ecume);
  float f = u_opacite * japon;
  couleur = vec4(c * f, a * f);
}`;

function compiler(gl, type, source) {
  const s = gl.createShader(type);
  gl.shaderSource(s, source);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}

const lisser = (x) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };

/**
 * Réglages selon le zoom (pixels d'écran) : les vagues s'écartent un peu quand on zoome. De loin (zoom 8 à 10),
 * moins de crêtes et moins d'écume : toutes les petites îles à la fois, ça faisait beaucoup.
 */
export function reglagesRessac(z) {
  const espacement = 8 * 2 ** ((z - 8) * 0.4);
  const pres = lisser((z - 8.5) / 2);
  return {
    espacement,
    zone: espacement * (2.4 + 1.2 * pres),
    vitesse: espacement / 4.5, // une vague toutes les 4,5 s
    bord: Math.min(9, Math.max(2.5, espacement * 0.25)), // le liseré d'écume, toujours là
    force: 0.55 + 0.45 * pres, // l'écume des vagues qui se brisent
    opacite: lisser((z - ZOOM_DEBUT[0]) / (ZOOM_DEBUT[1] - ZOOM_DEBUT[0])),
  };
}

/**
 * La couche du ressac. `image` : l'image des distances au Japon (mer.js), `bornes` ses bornes [ouest, sud, est, nord],
 * `distance(x, y)` sa lecture (pixels au zoom 5), `tuiles` les tuiles de relief (tuiles-relief.js), `obtenirTemps()`
 * l'horloge de la mer (secondes). Renvoie null si le navigateur ne sait pas faire le calcul.
 */
export function coucheRessac(map, maplibregl, { image, bornes, distance, tuiles, obtenirTemps }) {
  if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined' || typeof createImageBitmap === 'undefined') return null;
  let ouvrier;
  try {
    ouvrier = new Worker(new URL('./ressac-calcul.js', import.meta.url));
  } catch {
    return null;
  }
  let gl2 = null, prog, vao, texJapon, u;
  const no = maplibregl.MercatorCoordinate.fromLngLat([bornes[0], bornes[3]]);
  const se = maplibregl.MercatorCoordinate.fromLngLat([bornes[2], bornes[1]]);
  const metresParUnite = 1 / maplibregl.MercatorCoordinate.fromLngLat([137, 35], 1).z;

  const champs = new Map(); // 'z/x/y' → { z, x, y, etat ('neuf' | 'calcul' | 'pret' | 'vide'), donnees, texture, vu }
  const file = [];
  let enCours = 0;
  let image_ = 0; // numéro de l'image dessinée
  let vues = []; // les tuiles à l'écran (recalculées quand la carte bouge)
  let aJour = false;
  let dessine = false; // la dernière image a-t-elle montré du ressac ?
  map.on('move', () => { aJour = false; });
  map.on('resize', () => { aJour = false; });

  const cle = (z, x, y) => `${z}/${x}/${y}`;

  /** La tuile est-elle près d'une côte du Japon ? (les voisins sont cachés par la carte : pas de ressac chez eux) */
  const pres = new Map();
  function presDuJapon(z, x, y) {
    const k = cle(z, x, y);
    let p = pres.get(k);
    if (p === undefined) {
      const n = 2 ** z;
      let min = Infinity;
      for (let i = 0; i <= 4; i++) for (let j = 0; j <= 4; j++) min = Math.min(min, distance((x + i / 4) / n, (y + j / 4) / n));
      p = min - (Z5 / n / 4) * 0.71 < PRES_DU_JAPON;
      pres.set(k, p);
    }
    return p;
  }

  function adresse(z, x, y) {
    const n = 2 ** z;
    if (x < 0 || y < 0 || x >= n || y >= n || tuiles.estVide(z, x, y)) return null;
    return tuiles.adresse(z, x, y);
  }

  function lancer() {
    while (enCours < MAX_CALCULS && file.length) {
      const c = champs.get(file.shift());
      if (!c || c.etat !== 'neuf') continue;
      if (c.vu < image_ - 20) continue; // plus à l'écran : on verra s'il revient
      c.etat = 'calcul';
      enCours++;
      const adresses = [];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) adresses.push(adresse(c.z, c.x + dx, c.y + dy));
      ouvrier.postMessage({ id: cle(c.z, c.x, c.y), adresses });
    }
  }

  ouvrier.onmessage = ({ data }) => {
    enCours--;
    const c = champs.get(data.id);
    if (c) {
      if (data.champ) { c.donnees = data.champ; c.etat = 'pret'; } else c.etat = 'vide';
      if (data.erreur) console.warn('Ressac :', data.erreur);
    }
    lancer();
    map.triggerRepaint();
  };

  function champ(z, x, y) {
    const k = cle(z, x, y);
    let c = champs.get(k);
    if (!c) {
      c = { z, x, y, etat: 'neuf', vu: image_ };
      champs.set(k, c);
    }
    c.vu = image_;
    if (c.etat === 'neuf' && !file.includes(k)) file.push(k);
    return c;
  }

  /** On oublie les tuiles vues il y a le plus longtemps (leur texture avec). */
  function ranger(gl) {
    const pleins = [...champs.values()].filter((c) => c.donnees || c.texture);
    if (pleins.length <= MAX_CHAMPS) return;
    pleins.sort((a, b) => a.vu - b.vu);
    for (const c of pleins.slice(0, pleins.length - MAX_CHAMPS)) {
      if (c.texture) gl.deleteTexture(c.texture);
      champs.delete(cle(c.z, c.x, c.y));
    }
  }

  function envoyer(gl, c) {
    c.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, c.texture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, 512, 512, 0, gl.RED, gl.UNSIGNED_BYTE, c.donnees);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    c.donnees = null; // la carte graphique en a sa copie
  }

  function preparer(gl) {
    prog = gl.createProgram();
    gl.attachShader(prog, compiler(gl, gl.VERTEX_SHADER, SHADER_SOMMETS));
    gl.attachShader(prog, compiler(gl, gl.FRAGMENT_SHADER, SHADER_COULEURS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    u = {};
    for (const nom of ['u_matrice', 'u_hauteur', 'u_sous', 'u_sol', 'u_japon', 'u_champ', 'u_japon_image', 'u_echelle',
      'u_temps', 'u_opacite', 'u_ratio', 'u_espacement', 'u_zone', 'u_vitesse', 'u_unite', 'u_bord', 'u_force', 'u_encre', 'u_ecume']) {
      u[nom] = gl.getUniformLocation(prog, nom);
    }
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 8, 0);
    gl.bindVertexArray(null);
    texJapon = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texJapon);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, gl.RED, gl.UNSIGNED_BYTE, image);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.BROWSER_DEFAULT_WEBGL);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  return {
    id: 'ressac',
    type: 'custom',
    renderingMode: '3d',
    /** La dernière image a-t-elle montré du ressac ? (mer.js garde alors son horloge en marche) */
    visible: () => dessine,
    /** Pour les essais : les tuiles à l'écran et l'état de leur calcul. */
    etat: () => ({ vues: vues.map((t) => cle(t.z, t.x, t.y)), champs: [...champs.values()].map((c) => `${cle(c.z, c.x, c.y)} ${c.etat}${c.texture ? ' (texture)' : ''}`) }),
    onAdd(_map, gl) {
      gl2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
    },
    render(gl, args) {
      dessine = false;
      if (!gl2) return;
      const z = map.getZoom();
      const r = reglagesRessac(z);
      if (r.opacite <= 0) return;
      if (!prog) {
        try { preparer(gl); } catch (e) { gl2 = false; console.warn('Ressac indisponible', e); return; }
      }
      image_++;
      if (!aJour) {
        vues = map.coveringTiles({ tileSize: 1024, minzoom: ZOOM_TUILES[0], maxzoom: ZOOM_TUILES[1] })
          .map((t) => t.canonical)
          .filter((t) => presDuJapon(t.z, t.x, t.y));
        aJour = true;
      }
      // les tuiles à dessiner : la sienne si elle est prête, sinon une parente déjà prête, sur sa part
      const aDessiner = [];
      let envois = 0;
      for (const t of vues) {
        const c = champ(t.z, t.x, t.y);
        let source = null, sous = [0, 0, 1, 1];
        if (c.donnees || c.texture) source = c;
        else if (c.etat !== 'vide') {
          for (let k = 1; k <= 3 && t.z - k >= ZOOM_TUILES[0]; k++) {
            const p = champs.get(cle(t.z - k, t.x >> k, t.y >> k));
            if (p?.etat === 'vide') break;
            if (p?.texture) {
              p.vu = image_;
              const n = 2 ** k;
              source = p;
              sous = [(t.x % n) / n, (t.y % n) / n, 1 / n, 1 / n];
              break;
            }
          }
        }
        if (!source) continue;
        if (!source.texture) {
          if (envois >= 2) continue; // pas plus de 2 envois à la carte graphique par image
          envoyer(gl, source);
          envois++;
        }
        aDessiner.push([t, source, sous]);
      }
      lancer();
      ranger(gl);
      if (!aDessiner.length) return;

      gl.useProgram(prog);
      gl.bindVertexArray(vao);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, texJapon);
      gl.uniform1i(u.u_japon_image, 1);
      gl.activeTexture(gl.TEXTURE0);
      gl.uniform1i(u.u_champ, 0);
      // un peu au-dessus de la mer (le relief y vaut 0 m) : la terre, plus haute, cache le ressac
      gl.uniform1f(u.u_hauteur, (2 * (map.terrain?.exaggeration || 1)) / metresParUnite);
      gl.uniform1f(u.u_temps, obtenirTemps());
      gl.uniform1f(u.u_opacite, r.opacite);
      gl.uniform1f(u.u_ratio, map.getPixelRatio());
      gl.uniform1f(u.u_espacement, r.espacement);
      gl.uniform1f(u.u_zone, r.zone);
      gl.uniform1f(u.u_vitesse, r.vitesse);
      gl.uniform1f(u.u_unite, 512 * 2 ** (z - 13));
      gl.uniform1f(u.u_bord, r.bord);
      gl.uniform1f(u.u_force, r.force);
      gl.uniform3f(u.u_encre, 61 / 255, 107 / 255, 100 / 255); // #3d6b64, l'encre des lignes d'eau
      gl.uniform3f(u.u_ecume, 246 / 255, 238 / 255, 219 / 255); // #f6eedb, le papier neuf
      gl.depthMask(false);
      gl.enable(gl.POLYGON_OFFSET_FILL);
      gl.polygonOffset(-1, -4);

      // le bruit se lit en tuiles de zoom 13, autour d'une origine proche (multiple de 256 : le motif n'en dépend pas)
      const centre = maplibregl.MercatorCoordinate.fromLngLat(map.getCenter());
      const ox = Math.floor((centre.x * 8192) / 256) * 256, oy = Math.floor((centre.y * 8192) / 256) * 256;
      const M = args.defaultProjectionData.mainMatrix;
      const m = new Float32Array(16);
      for (const [t, source, sous] of aDessiner) {
        const n = 2 ** t.z, s = 1 / n, x0 = t.x / n, y0 = t.y / n;
        // la matrice de la tuile (0..1) calculée en double précision : pas de tremblement aux grands zooms
        for (let i = 0; i < 4; i++) {
          m[i] = M[i] * s;
          m[4 + i] = M[4 + i] * s;
          m[8 + i] = M[8 + i];
          m[12 + i] = M[i] * x0 + M[4 + i] * y0 + M[12 + i];
        }
        gl.uniformMatrix4fv(u.u_matrice, false, m);
        gl.uniform4fv(u.u_sous, sous);
        const k13 = 2 ** (13 - t.z);
        gl.uniform3f(u.u_sol, t.x * k13 - ox, t.y * k13 - oy, k13);
        gl.uniform4f(u.u_japon, (x0 - no.x) / (se.x - no.x), (y0 - no.y) / (se.y - no.y), s / (se.x - no.x), s / (se.y - no.y));
        gl.uniform1f(u.u_echelle, 2 ** (z - source.z));
        gl.bindTexture(gl.TEXTURE_2D, source.texture);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      gl.disable(gl.POLYGON_OFFSET_FILL); // la carte ne connaît pas ce réglage : on le remet
      gl.bindVertexArray(null);
      dessine = true;
    },
  };
}
