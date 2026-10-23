// ================================================================
//  Les lumières de la nuit : autour de chaque lanterne allumée, un halo (un disque doux face à l'écran) et, au
//  sol, une flaque de lumière chaude. Rien le jour : elles s'allument avec la nuit (balade.js : M.nuit), comme les
//  lanternes elles-mêmes (styles.js : « lumiere »). Deux formes en tout (les halos, les flaques), quel que soit leur nombre.
//  lumieres : [{ x, y, z (la flamme), halo (son rayon, en m), sol (la hauteur du sol dessous ; null : pas de
//  flaque), r (le rayon de la flaque), c (la couleur, « #rrggbb » ; une lumière chaude par défaut) }]
// ================================================================

const CHAUD = '#ffc879';

export function creerLueurs(THREE, lumieres) {
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

  // les flaques : un disque à plat juste au-dessus du sol, plus clair au milieu
  const auSol = lumieres.filter((l) => l.sol != null);
  if (auSol.length) {
    const S = 20, pos = [], col = [], u = [];
    for (const l of auSol) {
      couleur.set(l.c || CHAUD);
      const r = l.r ?? 2, y = l.sol + 0.04;
      for (let k = 0; k < S; k++) {
        const a0 = (k / S) * 2 * Math.PI, a1 = ((k + 1) / S) * 2 * Math.PI;
        // (vu d'en haut, dans le sens qui regarde le ciel)
        pos.push(l.x, y, l.z, l.x + Math.sin(a0) * r, y, l.z + Math.cos(a0) * r, l.x + Math.sin(a1) * r, y, l.z + Math.cos(a1) * r);
        u.push(0, 1, 1);
        for (let j = 0; j < 3; j++) col.push(couleur.r, couleur.g, couleur.b);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('teinte', new THREE.Float32BufferAttribute(col, 3));
    g.setAttribute('u', new THREE.Float32BufferAttribute(u, 1));
    const flaques = new THREE.Mesh(g, new THREE.ShaderMaterial({
      uniforms: { nuit },
      vertexShader: `
        attribute vec3 teinte;
        attribute float u;
        varying vec3 vTeinte;
        varying float vU;
        varying float vLoin;
        void main() {
          vec4 vue = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * vue;
          vTeinte = teinte;
          vU = u;
          vLoin = 1.0 - smoothstep(60.0, 150.0, -vue.z);
        }`,
      fragmentShader: `
        uniform float nuit;
        varying vec3 vTeinte;
        varying float vU;
        varying float vLoin;
        void main() {
          float a = (1.0 - vU) * (1.0 - vU);
          gl_FragColor = vec4(vTeinte * a * 0.42 * nuit * vLoin, 1.0);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    }));
    flaques.frustumCulled = false;
    flaques.renderOrder = 2;
    groupe.add(flaques);
  }

  return {
    groupe,
    /** nuit : 0 à 1 ; f : la focale de la caméra en pixels de l'image (la taille des halos). */
    maj(n, f) {
      nuit.value = n;
      focale.value = f;
      groupe.visible = n > 0.01;
    },
  };
}
