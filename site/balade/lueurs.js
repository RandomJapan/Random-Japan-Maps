// ================================================================
//  Les lumières de la nuit : autour de chaque lanterne allumée, un halo (un disque doux face à l'écran), et sa
//  lumière qui tombe sur ce qui l'entoure (le sol, les marches, les murs, les personnages : styles.js,
//  LAMPES_GLSL ; d'abord, une flaque à plat à la hauteur du sol, qui flottait en arcs de cercle sur les pentes
//  et les escaliers). Rien le jour : elles s'allument avec la nuit (balade.js : M.nuit), comme les lanternes
//  elles-mêmes (styles.js : « lumiere »). Les halos : une seule forme, quel que soit leur nombre ; la lumière :
//  les NB_LAMPES lampes les plus proches de ce que regarde la caméra, choisies à chaque image.
//  lumieres : [{ x, y, z (la flamme), halo (son rayon, en m), sol (la hauteur du sol dessous ; null : une lampe
//  sans sol proche), r (jusqu'où elle éclaire le sol, depuis son pied), c (la couleur, « #rrggbb » ; une lumière
//  chaude par défaut), mobile (2026-10-24 : la lampe bouge, ses x, y, z sont relus à chaque image : la luciole dorée
//  de Gokayama ; son halo est le sien, halo : 0) }]
// ================================================================
import { NB_LAMPES } from './styles.js';

const CHAUD = '#ffc879';
// la force des lampes sur ce qu'elles éclairent (la couleur de la surface × la leur × FORCE, tout près)
const FORCE = 1.5;

/** lampes : les uniformes des lampes (styles.js, matieresStyle : lampesPos, lampesCouleur). */
export function creerLueurs(THREE, lumieres, lampes) {
  const groupe = new THREE.Group();
  const nuit = { value: 0 }, focale = { value: 800 };
  const couleur = new THREE.Color();

  // les halos : un point par lanterne, sa taille à l'écran selon la distance (comme un disque du monde)
  {
    const n = lumieres.length, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), taille = new Float32Array(n);
    lumieres.forEach((l, i) => {
      pos.set([l.x, l.y, l.z], i * 3);
      col.set(couleur.set(l.c || CHAUD).toArray(), i * 3);
      taille[i] = l.halo ?? 0.6;
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('teinte', new THREE.BufferAttribute(col, 3));
    g.setAttribute('taille', new THREE.BufferAttribute(taille, 1));
    const halos = new THREE.Points(g, new THREE.ShaderMaterial({
      uniforms: { nuit, focale },
      vertexShader: `
        attribute vec3 teinte;
        attribute float taille;
        uniform float focale;
        varying vec3 vTeinte;
        varying float vLoin;
        void main() {
          vec4 vue = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * vue;
          gl_PointSize = 2.0 * taille * focale / max(0.5, -vue.z);
          vTeinte = teinte;
          vLoin = 1.0 - smoothstep(70.0, 180.0, -vue.z);
        }`,
      fragmentShader: `
        uniform float nuit;
        varying vec3 vTeinte;
        varying float vLoin;
        void main() {
          float r = length(gl_PointCoord - 0.5) * 2.0;
          if (r > 1.0) discard;
          float a = exp(-r * r * 4.0) * 0.8 + (1.0 - smoothstep(0.0, 0.3, r)) * 0.45;
          gl_FragColor = vec4(vTeinte * a * nuit * vLoin, 1.0);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    halos.frustumCulled = false;
    halos.renderOrder = 3;
    groupe.add(halos);
  }

  // la lumière des lampes : sa portée, depuis la flamme, va jusqu'au bord de ce qu'elle éclaire au sol (r)
  const liste = lumieres.map((l) => {
    const h = l.sol != null ? Math.max(0.3, l.y - l.sol) : 0.8, r = l.sol != null ? l.r ?? 2 : (l.halo ?? 0.6) * 3;
    return { x: l.x, y: l.y, z: l.z, portee: Math.hypot(r, h) * 1.05, c: new THREE.Color(l.c || CHAUD), d: 0, mobile: l.mobile ? l : null };
  });
  const tri = liste.slice(), dir = new THREE.Vector3(), vise = new THREE.Vector3();
  const lisse = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  /**
   * Les lampes qui comptent le plus pour l'image : les plus proches d'un point 8 m devant la caméra. Celles qui
   * entrent dans la liste ou en sortent (la caméra bouge) s'allument et s'éteignent doucement : leur force baisse
   * jusqu'à 0 à la distance de la première lampe laissée de côté.
   */
  function choisir(n, camera) {
    const P = lampes.lampesPos.value, Cl = lampes.lampesCouleur.value, Z = lampes.lampesZone.value;
    if (n <= 0.01 || !liste.length) { P[0].w = 0; Z.w = 0; return; }
    camera.getWorldDirection(dir);
    vise.copy(camera.position).addScaledVector(dir, 8);
    for (const l of liste) {
      if (l.mobile) { l.x = l.mobile.x; l.y = l.mobile.y; l.z = l.mobile.z; }
      l.d = Math.hypot(l.x - vise.x, l.y - vise.y, l.z - vise.z);
    }
    tri.sort((a, b) => a.d - b.d);
    const k = Math.min(NB_LAMPES, tri.length), coupe = tri.length > NB_LAMPES ? tri[NB_LAMPES].d : Infinity;
    const cp = camera.position;
    for (let i = 0; i < k; i++) {
      const l = tri[i];
      const f = (coupe < Infinity ? 1 - lisse(coupe * 0.75, coupe, l.d) : 1) * (1 - lisse(70, 160, Math.hypot(l.x - cp.x, l.y - cp.y, l.z - cp.z)));
      P[i].set(l.x, l.y, l.z, l.portee);
      Cl[i].set(l.c.r, l.c.g, l.c.b).multiplyScalar(FORCE * n * f);
    }
    if (k < NB_LAMPES) P[k].w = 0;
    // la boule qui les contient (son centre : la moyenne des lampes)
    Z.set(0, 0, 0, 0);
    for (let i = 0; i < k; i++) Z.x += tri[i].x / k, Z.y += tri[i].y / k, Z.z += tri[i].z / k;
    for (let i = 0; i < k; i++) Z.w = Math.max(Z.w, Math.hypot(tri[i].x - Z.x, tri[i].y - Z.y, tri[i].z - Z.z) + tri[i].portee);
  }

  return {
    groupe,
    /** nuit : 0 à 1 ; f : la focale de la caméra en pixels de l'image (la taille des halos) ; camera : pour choisir les lampes. */
    maj(n, f, camera) {
      nuit.value = n;
      focale.value = f;
      groupe.visible = n > 0.01;
      choisir(n, camera);
    },
  };
}
