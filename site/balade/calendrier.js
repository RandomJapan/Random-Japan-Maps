// ================================================================
//  Le calendrier magique (acheté au marchand avec les koban, 2026-10-23) : on choisit la saison de la balade. Les
//  couleurs du décor et du sol changent dans les shaders (styles.js : SAISONS_GLSL, SOL_SAISON_GLSL ; les cerisiers en
//  fleurs, les érables rouges, la neige sur les toits) ; ce module fait tomber, autour de la caméra, ce qui va avec :
//  des pétales de cerisier au printemps, des feuilles d'érable et de ginkgo à l'automne, des flocons l'hiver.
//  Tout est calculé sur la carte graphique : chaque flocon a sa place de départ dans une boîte qui suit la caméra (il
//  y revient par le haut quand il sort par le bas) ; rien à faire à chaque image que l'heure et la place de l'œil.
//  Rien ne tombe sous un toit (la carte des abris, styles.js ABRI_GLSL ; 2026-10-25, il neigeait dans le donjon) : par
//  une fenêtre, on voit tomber la neige dehors.
//  SAISONS : 'ete' (celle de tous les jours, rien ne tombe), 'printemps', 'automne', 'hiver'.
//  creerChutes(THREE, abri) → { groupe, regler(saison), maj(dt, temps, oeil, focale, nuit) } ; abri : les uniformes de
//  la carte des abris (matieresStyle, styles.js).
// ================================================================

import { ABRI_GLSL } from './styles.js';

export const SAISONS = ['ete', 'printemps', 'automne', 'hiver'];
const N = 520;
const BOITE = [34, 16, 34];

export function creerChutes(THREE, abri) {
  const base = new Float32Array(N * 3), prm = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) {
    base[i * 3] = Math.random() * BOITE[0]; base[i * 3 + 1] = Math.random() * BOITE[1]; base[i * 3 + 2] = Math.random() * BOITE[2];
    prm.set([0.6 + Math.random() * 0.6, Math.random() * 6.3, 0.8 + Math.random() * 0.5, Math.random()], i * 4);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(base, 3));
  geo.setAttribute('prm', new THREE.BufferAttribute(prm, 4));
  const u = { temps: { value: 0 }, oeil: { value: new THREE.Vector3() }, sorte: { value: 0 }, force: { value: 0 }, focale: { value: 800 }, nuit: { value: 0 }, boite: { value: new THREE.Vector3(...BOITE) }, ...abri };
  const points = new THREE.Points(geo, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: u,
    vertexShader: `
      attribute vec4 prm;
      uniform float temps, sorte, focale, force;
      uniform vec3 oeil, boite;
      varying vec4 vPrm;
      varying float vAlpha;
      ${ABRI_GLSL}
      void main() {
        vPrm = prm;
        // la chute (les flocons plus lents), le balancement ; puis ramené dans la boîte autour de l'œil
        float lent = sorte > 2.5 ? 0.55 : sorte > 1.5 ? 0.9 : 0.7;
        vec3 d = vec3(sin(temps * 0.7 * prm.x + prm.y) * 1.4 + temps * 0.5, -temps * prm.x * lent, cos(temps * 0.6 * prm.x + prm.y * 1.3) * 1.2 + temps * 0.3);
        vec3 p = mod(position + d - oeil + boite * 0.5, boite) - boite * 0.5 + oeil;
        vec4 mv = viewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float t = sorte > 2.5 ? 0.07 : 0.11;
        gl_PointSize = force > 0.001 ? clamp(t * prm.z * focale / max(-mv.z, 0.5), 1.0, 40.0) : 0.0;
        // ils s'effacent au bord de la boîte (on ne les voit pas apparaître) et tout près de l'œil
        vec3 q = abs(p - oeil) / (boite * 0.5);
        vAlpha = force * (1.0 - smoothstep(0.75, 1.0, max(q.x, max(q.y, q.z)))) * smoothstep(0.6, 1.6, -mv.z) * (1.0 - abrite(p));
      }`,
    fragmentShader: `
      uniform float sorte, temps, nuit;
      varying vec4 vPrm;
      varying float vAlpha;
      void main() {
        vec2 p = gl_PointCoord * 2.0 - 1.0;
        float a0 = vPrm.y + temps * (vPrm.w - 0.5) * 3.0, c0 = cos(a0), s0 = sin(a0);
        vec2 q = vec2(c0 * p.x - s0 * p.y, s0 * p.x + c0 * p.y);
        vec3 c;
        float a = vAlpha;
        if (sorte > 2.5) {
          // un flocon : un disque doux, blanc bleuté
          float r = length(p);
          if (r > 1.0) discard;
          c = vec3(0.96, 0.98, 1.0);
          a *= 1.0 - smoothstep(0.35, 1.0, r);
        } else if (sorte > 1.5) {
          // une feuille d'érable (rouge, orangée) ou de ginkgo (jaune, en éventail)
          float r = length(q), an = atan(q.y, q.x);
          bool ginkgo = vPrm.w > 0.7;
          float l = ginkgo ? (q.y > -0.1 ? 0.9 * smoothstep(-0.1, 0.2, q.y) * (1.0 - 0.25 * step(abs(q.x), 0.06) * step(0.6, q.y)) : 0.0)
            : 0.5 + 0.45 * pow(abs(cos(3.5 * (an - 1.5708))), 1.6) * smoothstep(-0.95, 0.2, sin(an));
          bool queue = abs(q.x) < 0.05 && q.y < 0.0 && q.y > -0.9;
          if ((ginkgo ? (r > 0.9 || q.y < -0.1 || abs(q.x) > (q.y + 0.1) * 0.95) : r > l) && !queue) discard;
          c = ginkgo ? vec3(0.98, 0.82, 0.25) : vPrm.w < 0.35 ? vec3(0.85, 0.2, 0.12) : vec3(0.94, 0.5, 0.16);
        } else {
          // un pétale de cerisier, échancré au bout
          float d = length(q / vec2(0.55, 0.95));
          if (d > 1.0 || (q.y > 0.62 && abs(q.x) < 0.16 + (q.y - 0.62) * 0.4)) discard;
          c = mix(vec3(1.0, 0.68, 0.79), vec3(1.0, 0.92, 0.95), smoothstep(-0.9, 0.6, q.y));
        }
        if (a < 0.01) discard;
        gl_FragColor = vec4(c * mix(1.0, 0.45, nuit), a);
        #include <colorspace_fragment>
      }`,
  }));
  points.frustumCulled = false;
  points.renderOrder = 6;
  const groupe = new THREE.Group();
  groupe.add(points);
  let voulue = 0, sorteVoulue = 0;
  return {
    groupe,
    /** La saison (SAISONS) : ce qui tombe change en fondu. */
    regler(saison) { sorteVoulue = Math.max(0, SAISONS.indexOf(saison)); voulue = sorteVoulue ? 1 : 0; },
    maj(dt, temps, oeil, focale, nuit) {
      // (d'une saison à l'autre : on éteint, on change, on rallume)
      if (u.sorte.value !== sorteVoulue) {
        u.force.value = Math.max(0, u.force.value - dt * 1.5);
        if (u.force.value === 0) u.sorte.value = sorteVoulue;
      } else u.force.value += (voulue - u.force.value) * Math.min(1, dt * 1.2);
      points.visible = u.force.value > 0.002;
      u.temps.value = temps;
      u.oeil.value.copy(oeil);
      u.focale.value = focale;
      u.nuit.value = nuit;
    },
  };
}
