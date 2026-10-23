// ================================================================
//  Les feux d'artifice de la balade (achetés au marchand avec les koban, 2026-10-23), comme le grand feu d'artifice
//  sur la mer de Miyajima : une trentaine de bombes en une demi-minute, puis un bouquet final. Chacune monte en
//  traînant des étincelles, éclate (une lueur brève, la couleur sur le décor : balade.js) et lance ses étoiles, que
//  l'air freine et que la pesanteur fait retomber. Plusieurs sortes, comme au Japon (la carte a les mêmes en 2D,
//  hanabi.js) : la pivoine (botan, une sphère d'étoiles), le chrysanthème (kiku, des étoiles qui laissent une traînée),
//  le saule (shidare-yanagi, de l'or qui retombe longtemps), l'anneau (wa), la double pivoine aux deux couleurs, et
//  les mille éclats (senrin, des étoiles qui crépitent en petites étincelles blanches).
//  Un seul nuage de points (au plus NB) : additif, sans brouillard, la taille selon la distance.
//  creerFeux(THREE) → { groupe, spectacle(scene, rappels), arreter(), actif(), maj(dt, focale) }.
// ================================================================

const NB = 5200;
const COULEURS = [[1, 0.28, 0.18], [0.35, 1, 0.42], [0.42, 0.58, 1], [1, 0.78, 0.32], [0.96, 0.96, 1], [1, 0.48, 0.78], [0.74, 0.45, 1], [0.3, 0.95, 1]];
const OR = [1, 0.72, 0.3];

export function creerFeux(THREE) {
  const pos = new Float32Array(NB * 3), vit = new Float32Array(NB * 3), coul = new Float32Array(NB * 3);
  const vie = new Float32Array(NB), age = new Float32Array(NB), duree = new Float32Array(NB), taille = new Float32Array(NB);
  const frein = new Float32Array(NB), poids = new Float32Array(NB), sorte = new Uint8Array(NB), prochaine = new Float32Array(NB);
  const eclat = new Float32Array(NB); // ce qu'on dessine : la vie × le scintillement
  let suivante = 0, vivantes = 0, nouvelles = false;
  const geo = new THREE.BufferGeometry();
  const aPos = new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage);
  const aCoul = new THREE.BufferAttribute(coul, 3).setUsage(THREE.DynamicDrawUsage);
  const aEclat = new THREE.BufferAttribute(eclat, 1).setUsage(THREE.DynamicDrawUsage);
  const aTaille = new THREE.BufferAttribute(taille, 1).setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('position', aPos);
  geo.setAttribute('couleur', aCoul);
  geo.setAttribute('eclat', aEclat);
  geo.setAttribute('taille', aTaille);
  const focale = { value: 800 };
  const points = new THREE.Points(geo, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { focale },
    vertexShader: `
      attribute vec3 couleur;
      attribute float eclat, taille;
      uniform float focale;
      varying vec3 vCouleur;
      void main() {
        vCouleur = couleur * eclat;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = eclat > 0.003 ? clamp(taille * focale / max(-mv.z, 1.0), 1.5, 90.0) : 0.0;
      }`,
    fragmentShader: `
      varying vec3 vCouleur;
      void main() {
        vec2 p = gl_PointCoord * 2.0 - 1.0;
        float r = dot(p, p);
        if (r > 1.0) discard;
        // un cœur presque blanc, et le halo de sa couleur
        float coeur = exp(-r * 14.0), halo = exp(-r * 3.2) * 0.55;
        gl_FragColor = vec4(mix(vCouleur, vec3(1.0), coeur * 0.6) * (coeur * 1.6 + halo), 1.0);
        #include <colorspace_fragment>
      }`,
  }));
  points.frustumCulled = false;
  points.renderOrder = 5;
  const groupe = new THREE.Group();
  groupe.add(points);

  /** Une particule : sorte 0 une étoile, 1 une étincelle (sans traînée), 2 une étoile qui crépite à la fin, 3 la fusée qui monte. */
  function lancer(x, y, z, vx, vy, vz, c, { s = 0, d = 2, t = 0.55, f = 1.2, g = 3, trainee = 0 } = {}) {
    const i = suivante;
    suivante = (suivante + 1) % NB;
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    vit[i * 3] = vx; vit[i * 3 + 1] = vy; vit[i * 3 + 2] = vz;
    coul[i * 3] = c[0]; coul[i * 3 + 1] = c[1]; coul[i * 3 + 2] = c[2];
    age[i] = 0; duree[i] = d; taille[i] = t; frein[i] = f; poids[i] = g; sorte[i] = s; vie[i] = 1; prochaine[i] = trainee;
    vivantes = NB;
    nouvelles = true;
  }
  /** Une direction au hasard, régulièrement répartie sur la sphère (la k-ième de n, suite de Fibonacci). */
  const sphere = (k, n, rot) => {
    const y = 1 - (2 * (k + 0.5)) / n, r = Math.sqrt(1 - y * y), a = k * 2.399963 + rot;
    return [Math.cos(a) * r, y, Math.sin(a) * r];
  };
  const hasard = (l) => l[Math.floor(Math.random() * l.length)];

  /** Une bombe éclate en (x, y, z) : ses étoiles selon sa sorte. Renvoie sa couleur (pour la lueur) et sa force. */
  function eclater(x, y, z, nom) {
    const c = hasard(COULEURS), c2 = hasard(COULEURS.filter((q) => q !== c)), rot = Math.random() * 6.3;
    const vite = 13 + Math.random() * 5;
    if (nom === 'botan' || nom === 'double') {
      const n = 110;
      for (let k = 0; k < n; k++) {
        const [dx, dy, dz] = sphere(k, n, rot), v = vite * (0.92 + Math.random() * 0.12);
        lancer(x, y, z, dx * v, dy * v, dz * v, c, { d: 1.7 + Math.random() * 0.5, t: 0.6 });
      }
      if (nom === 'double') for (let k = 0; k < 60; k++) { const [dx, dy, dz] = sphere(k, 60, rot + 1), v = vite * 0.5; lancer(x, y, z, dx * v, dy * v, dz * v, c2, { d: 1.6, t: 0.55 }); }
      return { c, force: 1 };
    }
    if (nom === 'kiku') {
      const n = 90;
      for (let k = 0; k < n; k++) { const [dx, dy, dz] = sphere(k, n, rot), v = vite; lancer(x, y, z, dx * v, dy * v, dz * v, c, { d: 1.9 + Math.random() * 0.4, t: 0.5, trainee: 0.035 }); }
      return { c, force: 1 };
    }
    if (nom === 'yanagi') {
      const n = 75;
      for (let k = 0; k < n; k++) { const [dx, dy, dz] = sphere(k, n, rot), v = vite * 0.75; lancer(x, y, z, dx * v, dy * v + 2, dz * v, OR, { d: 3.2 + Math.random() * 0.8, t: 0.45, f: 0.9, g: 5.5, trainee: 0.05 }); }
      return { c: OR, force: 0.8 };
    }
    if (nom === 'wa') {
      // un anneau, penché au hasard
      const n = 70, a = Math.random() * 0.9, b = Math.random() * 6.3;
      for (let k = 0; k < n; k++) {
        const t = (k / n) * 2 * Math.PI, cx = Math.cos(t), cy = Math.sin(t) * Math.cos(a), cz = Math.sin(t) * Math.sin(a);
        const dx = cx * Math.cos(b) - cz * Math.sin(b), dz = cx * Math.sin(b) + cz * Math.cos(b);
        lancer(x, y, z, dx * vite, cy * vite, dz * vite, c, { d: 1.8, t: 0.6 });
      }
      for (let k = 0; k < 12; k++) { const [dx, dy, dz] = sphere(k, 12, rot); lancer(x, y, z, dx * 3, dy * 3, dz * 3, c2, { d: 1.2, t: 0.5 }); }
      return { c, force: 0.9 };
    }
    // senrin : des étoiles qui, à la fin, crépitent en petites étincelles blanches
    const n = 60;
    for (let k = 0; k < n; k++) { const [dx, dy, dz] = sphere(k, n, rot), v = vite * 0.85; lancer(x, y, z, dx * v, dy * v, dz * v, c, { s: 2, d: 1.3 + Math.random() * 0.4, t: 0.5 }); }
    return { c, force: 0.9, crepite: true };
  }

  let bombes = [], programme = [], horloge = 0, rappels = {}, fin = null;
  const SORTES = ['botan', 'botan', 'kiku', 'kiku', 'yanagi', 'wa', 'double', 'senrin'];

  return {
    groupe,
    actif: () => programme.length > 0 || bombes.length > 0 || vivantes > 0,
    /**
     * Un spectacle d'une trentaine de secondes. scene : { x, y, z } (où l'on tire : le sol ou l'eau), large (l'écart des
     * tirs, en m), haut [min, max] (la hauteur des éclats au-dessus de y). rappels : depart(x, y, z), eclat(x, y, z,
     * couleur, force, crepite). Se résout à la fin (les dernières étoiles éteintes).
     */
    spectacle(scene, r = {}) {
      rappels = r;
      horloge = 0;
      programme = [];
      let t = 0.6;
      while (t < 25) { programme.push({ t, nom: hasard(SORTES) }); t += 0.7 + Math.random() * 1.1; if (Math.random() < 0.18) programme.push({ t: t - 0.25, nom: hasard(SORTES) }); }
      // le bouquet final : une salve, puis trois grandes pivoines ensemble
      for (let k = 0; k < 14; k++) programme.push({ t: 26 + k * 0.28, nom: hasard(['botan', 'kiku', 'double', 'senrin']) });
      for (let k = 0; k < 3; k++) programme.push({ t: 30.6, nom: 'double', large: 1 });
      programme.sort((a, b) => a.t - b.t);
      this.scene = scene;
      return new Promise((res) => { fin = res; });
    },
    arreter() { programme = []; bombes = []; for (let i = 0; i < NB; i++) vie[i] = 0; vivantes = 0; fin?.(); fin = null; },
    maj(dt, f) {
      focale.value = f;
      if (dt <= 0) return;
      horloge += dt;
      const S = this.scene;
      // les tirs du programme : une fusée part du sol (ou de l'eau), monte en ralentissant
      while (programme.length && programme[0].t <= horloge) {
        const p = programme.shift();
        const x = S.x + (Math.random() - 0.5) * S.large, z = S.z + (Math.random() - 0.5) * S.large * 0.5;
        const h = S.haut[0] + Math.random() * (S.haut[1] - S.haut[0]);
        bombes.push({ x, y: S.y, z, vy: Math.sqrt(2 * 9 * h) * 1.08, nom: p.nom, h: S.y + h, etincelle: 0 });
        rappels.depart?.(x, S.y, z);
      }
      for (const b of bombes) {
        b.vy -= 9 * dt;
        b.y += b.vy * dt;
        b.etincelle -= dt;
        if (b.etincelle <= 0) { b.etincelle = 0.025; lancer(b.x + (Math.random() - 0.5) * 0.2, b.y, b.z, 0, -1, 0, OR, { s: 1, d: 0.45, t: 0.3, f: 2, g: 2 }); }
        if (b.y >= b.h || b.vy <= 1) {
          b.fini = true;
          const e = eclater(b.x, b.y, b.z, b.nom);
          rappels.eclat?.(b.x, b.y, b.z, e.c, e.force, !!e.crepite);
        }
      }
      bombes = bombes.filter((b) => !b.fini);
      if (vivantes) {
        let n = 0;
        nouvelles = false;
        for (let i = 0; i < NB; i++) {
          if (vie[i] <= 0) { eclat[i] = 0; continue; }
          age[i] += dt;
          const k = i * 3, fr = Math.exp(-frein[i] * dt);
          vit[k] *= fr; vit[k + 1] = vit[k + 1] * fr - poids[i] * dt; vit[k + 2] *= fr;
          pos[k] += vit[k] * dt; pos[k + 1] += vit[k + 1] * dt; pos[k + 2] += vit[k + 2] * dt;
          const u = age[i] / duree[i];
          if (u >= 1) {
            vie[i] = 0; eclat[i] = 0;
            // les mille éclats : en s'éteignant, l'étoile crépite en quatre petites étincelles blanches
            if (sorte[i] === 2) for (let j = 0; j < 4; j++) lancer(pos[k], pos[k + 1], pos[k + 2], (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, [1, 1, 0.92], { s: 1, d: 0.35, t: 0.35, f: 3, g: 1 });
            continue;
          }
          // la traînée : une étincelle laissée derrière, de temps en temps
          if (prochaine[i] > 0) {
            if ((age[i] % prochaine[i]) < dt) lancer(pos[k], pos[k + 1], pos[k + 2], vit[k] * 0.05, vit[k + 1] * 0.05 - 0.5, vit[k + 2] * 0.05, [coul[k] * 0.9 + 0.1, coul[k + 1] * 0.8, coul[k + 2] * 0.6], { s: 1, d: 0.7, t: 0.32, f: 2.5, g: 1.5 });
          }
          vie[i] = 1 - u;
          // elles brillent fort, puis faiblissent ; les étincelles scintillent
          eclat[i] = (u < 0.08 ? 1.6 : 1.3 * (1 - u) ** 1.5) * (sorte[i] === 1 ? 0.6 + 0.4 * Math.random() : 1);
          n++;
        }
        // (des étincelles nées pendant ce tour, avant l'indice où l'on était : on les verra au prochain)
        vivantes = nouvelles ? NB : n;
        aPos.needsUpdate = aCoul.needsUpdate = aEclat.needsUpdate = aTaille.needsUpdate = true;
      }
      if (fin && !programme.length && !bombes.length && !vivantes && horloge > 2) { const r = fin; fin = null; r(); }
    },
  };
}
