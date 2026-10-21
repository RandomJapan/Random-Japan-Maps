// ================================================================
//  La mer jusqu'à l'horizon, et le soleil qui s'y couche (2026-10-21)
//  MapLibre ne dessine la carte qu'à l'intérieur du monde (de -180° à 180°, jusqu'à 85° de latitude) : très
//  inclinée, la carte montrait son bord, droit ou en coin, et au-delà le fond de la page (« un carré qui forme
//  l'horizon », vu par le propriétaire). Une nappe de mer, très grande et posée sous tout le reste, prolonge la
//  mer jusqu'à l'horizon, avec la brume que MapLibre met sur le relief au loin (le même calcul que son shader du
//  relief) : à l'horizon, elle a la couleur du ciel, et la carte ne finit plus.
//  Au coucher et au lever du soleil (TEINTES.soleil, ambiance.js), le soleil est dessiné dans sa vraie direction,
//  juste avant la mer : il passe derrière l'horizon. Sa hauteur est réduite (HAUTEUR_SOLEIL) pour qu'on le voie
//  descendre dans la bande de ciel que laisse la carte très inclinée ; il touche l'horizon quand il se couche vraiment.
//  Rouages internes de MapLibre 6.11 (la matrice de brume du transform, les propriétés du ciel), à revoir en cas de
//  mise à jour. Sans eux, ou sans WebGL2, rien ne change.
// ================================================================
import { TEINTES } from './teintes.js';

const ETENDUE = 8; // en largeurs de monde de chaque côté : bien au-delà de ce que la caméra voit
const HORIZON = -0.75; // degrés : MapLibre arrête le sol à 89,25° de la verticale (maxMercatorHorizonAngle)
const HAUTEUR_SOLEIL = 0.4; // la hauteur du soleil, réduite : à 9° (le début du coucher), 3,6° au-dessus de l'horizon
const RAYON_SOLEIL = 0.03; // le disque, en part de la hauteur de l'écran ; son halo, HALO fois plus grand
const HALO = 5;

const SOMMETS = `#version 300 es
in vec2 a_pos;
uniform mat4 u_matrice;
uniform mat4 u_brume;
out vec2 v_brume;
void main() {
  gl_Position = u_matrice * vec4(a_pos, 0.0, 1.0);
  vec4 b = u_brume * vec4(a_pos, 0.0, 1.0);
  v_brume = b.zw; // (interpolés à part : la profondeur z/w n'est pas linéaire sur un si grand triangle)
}`;

// le shader du relief de MapLibre (terrain.fragment), sa partie brume, appliqué à la couleur de la mer
const COULEURS = `#version 300 es
precision highp float;
in vec2 v_brume;
uniform vec4 u_mer;
uniform vec4 u_couleur_brume;
uniform vec4 u_couleur_horizon;
uniform float u_brume_sol;
uniform float u_brume_opacite;
uniform float u_brume_horizon;
out vec4 couleur;
vec4 lineaire(vec4 c) { return pow(c, vec4(2.2)); }
vec4 gamma(vec4 c) { return pow(c, vec4(1.0 / 2.2)); }
void main() {
  float profondeur = v_brume.x / v_brume.y * 0.5 + 0.5;
  if (u_brume_opacite > 0.0 && profondeur > u_brume_sol) {
    float melange = smoothstep(0.0, 1.0, max((profondeur - u_brume_horizon) / (1.0 - u_brume_horizon), 0.0));
    vec4 brume = mix(lineaire(u_couleur_brume), lineaire(u_couleur_horizon), melange);
    float f = max(profondeur - u_brume_sol, 0.0) / (1.0 - u_brume_sol);
    couleur = gamma(mix(lineaire(u_mer), brume, pow(f, 2.0) * u_brume_opacite));
  } else {
    couleur = u_mer;
  }
}`;

// le soleil : un carré à l'écran autour de son centre, un disque doux et un halo
const SOMMETS_SOLEIL = `#version 300 es
in vec2 a_coin;
uniform vec2 u_centre;
uniform vec2 u_taille;
out vec2 v_uv;
void main() {
  v_uv = a_coin;
  gl_Position = vec4(u_centre + a_coin * u_taille, 0.0, 1.0);
}`;

const COULEURS_SOLEIL = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform float u_disque;
uniform float u_force;
uniform vec3 u_coeur;
uniform vec3 u_lueur;
out vec4 couleur;
void main() {
  float d = length(v_uv);
  float disque = 1.0 - smoothstep(u_disque * 0.94, u_disque * 1.04, d);
  float halo = 0.5 * exp(-d * d * 9.0) + 0.18 * exp(-d * 4.0);
  vec3 c = mix(u_lueur, u_coeur, disque);
  float a = clamp(max(disque, halo) * u_force, 0.0, 1.0);
  couleur = vec4(c * a, a);
}`;

function compiler(gl, type, source) {
  const s = gl.createShader(type);
  gl.shaderSource(s, source);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}

function programme(gl, sommets, couleurs, noms) {
  const prog = gl.createProgram();
  gl.attachShader(prog, compiler(gl, gl.VERTEX_SHADER, sommets));
  gl.attachShader(prog, compiler(gl, gl.FRAGMENT_SHADER, couleurs));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  const u = {};
  for (const nom of noms) u[nom] = gl.getUniformLocation(prog, nom);
  return { prog, u };
}

/** Un rectangle de deux triangles (TRIANGLE_STRIP), dans un VAO. */
function rectangle(gl, prog, attribut, coins) {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coins), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, attribut);
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 8, 0);
  gl.bindVertexArray(null);
  return vao;
}

const rvba = (c) => (c ? [c.r, c.g, c.b, c.a] : null);

/** Le centre du soleil à l'écran (coordonnées de -1 à 1), ou null s'il est derrière la caméra. */
function centreSoleil(soleil, matrice) {
  const r = Math.PI / 180;
  const a = soleil.azimut * r, h = (HORIZON + soleil.hauteur * HAUTEUR_SOLEIL) * r;
  // une direction (w = 0) : vers l'est x, vers le nord -y, vers le haut z, en unités Mercator
  const d = [Math.sin(a), -Math.cos(a), Math.tan(h), 0];
  const clip = [0, 1, 2, 3].map((i) => matrice[i] * d[0] + matrice[4 + i] * d[1] + matrice[8 + i] * d[2] + matrice[12 + i] * d[3]);
  if (clip[3] <= 0) return null;
  return [clip[0] / clip[3], clip[1] / clip[3]];
}

/** La couche « mer-infinie », à placer sous toutes les autres. */
export function coucheHorizon(map) {
  let gl2 = false, mer = null, soleil = null;

  function preparer(gl) {
    mer = programme(gl, SOMMETS, COULEURS, ['u_matrice', 'u_brume', 'u_mer', 'u_couleur_brume', 'u_couleur_horizon', 'u_brume_sol', 'u_brume_opacite', 'u_brume_horizon']);
    const a = -ETENDUE, b = 1 + ETENDUE;
    mer.vao = rectangle(gl, mer.prog, 'a_pos', [a, a, b, a, a, b, b, b]);
    soleil = programme(gl, SOMMETS_SOLEIL, COULEURS_SOLEIL, ['u_centre', 'u_taille', 'u_disque', 'u_force', 'u_coeur', 'u_lueur']);
    soleil.vao = rectangle(gl, soleil.prog, 'a_coin', [-1, -1, 1, -1, -1, 1, 1, 1]);
  }

  /** La matrice de brume de MapLibre (en pixels du monde), ramenée aux coordonnées Mercator (0 à 1). */
  function matriceBrume() {
    const t = map._camera?.transform;
    const m = t?.currentTransform ?? t;
    const f = m?._fogMatrix, monde = m?.worldSize;
    if (!f || !monde) return null;
    const r = Float32Array.from(f);
    for (let i = 0; i < 8; i++) r[i] *= monde;
    return r;
  }

  /** Le soleil, avant la mer : la mer et le relief cachent ce qui passe sous l'horizon. */
  function dessinerSoleil(gl, matrice) {
    const s = TEINTES.soleil;
    if (!s || s.hauteur < -8) return;
    const c = centreSoleil(s, matrice);
    if (!c) return;
    const { width: l, height: h } = gl.canvas;
    const halo = RAYON_SOLEIL * HALO * h; // en pixels de la toile
    if (Math.abs(c[0]) > 1 + (2 * halo) / l || Math.abs(c[1]) > 1 + (2 * halo) / h) return;
    gl.useProgram(soleil.prog);
    gl.bindVertexArray(soleil.vao);
    gl.uniform2f(soleil.u.u_centre, c[0], c[1]);
    gl.uniform2f(soleil.u.u_taille, (2 * halo) / l, (2 * halo) / h);
    gl.uniform1f(soleil.u.u_disque, 1 / HALO);
    gl.uniform1f(soleil.u.u_force, Math.min(1, s.force * 2));
    // le matin un peu plus rose, le soir plus doré
    gl.uniform3f(soleil.u.u_coeur, 1.0, s.matin ? 0.86 : 0.84, s.matin ? 0.66 : 0.55);
    gl.uniform3f(soleil.u.u_lueur, 1.0, s.matin ? 0.62 : 0.6, s.matin ? 0.5 : 0.32);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  return {
    id: 'mer-infinie',
    type: 'custom',
    renderingMode: '3d',
    onAdd(_map, gl) {
      gl2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
    },
    render(gl, args) {
      if (!gl2) return;
      const ciel = map.style?.sky;
      const couleurMer = rvba(map.style?.getLayer('fond')?.paint?.get('background-color'));
      const brume = matriceBrume();
      if (!ciel || !couleurMer || !brume) return;
      if (!mer) {
        try { preparer(gl); } catch (e) { gl2 = false; console.warn('Horizon indisponible', e); return; }
      }
      const matrice = args.defaultProjectionData.mainMatrix;
      gl.disable(gl.DEPTH_TEST);
      gl.depthMask(false);
      dessinerSoleil(gl, matrice);
      gl.useProgram(mer.prog);
      gl.bindVertexArray(mer.vao);
      gl.uniformMatrix4fv(mer.u.u_matrice, false, Float32Array.from(matrice));
      gl.uniformMatrix4fv(mer.u.u_brume, false, brume);
      gl.uniform4f(mer.u.u_mer, ...couleurMer);
      gl.uniform4f(mer.u.u_couleur_brume, ...rvba(ciel.properties.get('fog-color')));
      gl.uniform4f(mer.u.u_couleur_horizon, ...rvba(ciel.properties.get('horizon-color')));
      gl.uniform1f(mer.u.u_brume_sol, ciel.properties.get('fog-ground-blend'));
      gl.uniform1f(mer.u.u_brume_horizon, ciel.properties.get('horizon-fog-blend'));
      gl.uniform1f(mer.u.u_brume_opacite, ciel.calculateFogBlendOpacity(map.getPitch()));
      // sous tout le reste : le relief, dessiné ensuite, la recouvre partout où il y a une carte
      gl.disable(gl.BLEND);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.bindVertexArray(null);
    },
  };
}
