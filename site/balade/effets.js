// ================================================================
//  Les petits effets de la balade, autour des pieds :
//  - les gouttes : les éclaboussures quand on patauge, l'eau qui dégoutte des habits mouillés, le compagnon qui
//    s'ébroue (des points ronds, calculés à chaque image : quelques centaines au plus) ;
//  - les ronds dans l'eau, à chaque pas et autour des jambes ;
//  - les empreintes : des semelles dans le sable (et le sable mouillé), les pattes du compagnon, et les traces
//    mouillées qu'on laisse en sortant de l'eau, même sur le bois ;
//  - les petits nuages (« pouf ») d'un compagnon qui s'en va, comme les renards et les tanuki des contes.
//  Les ronds et les empreintes vivent dans leur shader (leur heure de naissance et leur durée) : les poser ne
//  coûte que quelques nombres, et rien n'est recalculé ensuite. Les empreintes assombrissent le sol (elles le
//  multiplient), à 1,5 cm au-dessus, avec un décalage de profondeur : jamais dans le même plan que lui.
// ================================================================

export function creerEffets(THREE) {
  const groupe = new THREE.Group();
  const temps = { value: 0 }, focale = { value: 800 }, nuit = { value: 0 };

  // ---------------------------------------------------------------- Les gouttes
  const NG = 384;
  const gPos = new Float32Array(NG * 3), gVie = new Float32Array(NG), gTaille = new Float32Array(NG);
  const gVit = new Float32Array(NG * 3), gAge = new Float32Array(NG), gDuree = new Float32Array(NG), gSol = new Float32Array(NG);
  let gSuivante = 0, gVivantes = 0;
  const geoG = new THREE.BufferGeometry();
  const attPos = new THREE.BufferAttribute(gPos, 3).setUsage(THREE.DynamicDrawUsage);
  const attVie = new THREE.BufferAttribute(gVie, 1).setUsage(THREE.DynamicDrawUsage);
  const attTaille = new THREE.BufferAttribute(gTaille, 1).setUsage(THREE.DynamicDrawUsage);
  geoG.setAttribute('position', attPos);
  geoG.setAttribute('vie', attVie);
  geoG.setAttribute('taille', attTaille);
  const gouttes = new THREE.Points(geoG, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { focale, nuit },
    vertexShader: `
      attribute float vie, taille;
      uniform float focale;
      varying float vVie;
      void main() {
        vVie = vie;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = vie > 0.0 ? clamp(taille * focale / max(-mv.z, 0.3), 1.5, 28.0) : 0.0;
      }`,
    fragmentShader: `
      uniform float nuit;
      varying float vVie;
      void main() {
        vec2 p = gl_PointCoord * 2.0 - 1.0;
        float d = dot(p, p);
        if (d > 1.0) discard;
        // une goutte claire, un reflet blanc en haut à gauche
        vec3 c = mix(vec3(0.62, 0.84, 0.98), vec3(1.0), 1.0 - smoothstep(0.0, 0.55, length(p + vec2(0.3, -0.35))));
        c *= mix(1.0, 0.4, nuit);
        gl_FragColor = vec4(c, (1.0 - smoothstep(0.5, 1.0, d)) * min(1.0, vVie * 4.0) * 0.9);
        #include <colorspace_fragment>
      }`,
  }));
  gouttes.frustumCulled = false;
  gouttes.renderOrder = 3;
  groupe.add(gouttes);

  // ---------------------------------------------------------------- Les petits nuages
  // des boules de fumée blanche, bordées d'un peu de gris (dessinées comme les nuages du ciel), qui gonflent,
  // montent et s'effacent ; quelques dizaines au plus, recalculées seulement tant qu'il en reste
  const NN = 64;
  const nPos = new Float32Array(NN * 3), nVie = new Float32Array(NN), nTaille = new Float32Array(NN), nVit = new Float32Array(NN * 3), nAge = new Float32Array(NN), nDuree = new Float32Array(NN), nT0 = new Float32Array(NN);
  let nSuivant = 0, nVivants = 0;
  const geoN = new THREE.BufferGeometry();
  const aPosN = new THREE.BufferAttribute(nPos, 3).setUsage(THREE.DynamicDrawUsage);
  const aVieN = new THREE.BufferAttribute(nVie, 1).setUsage(THREE.DynamicDrawUsage);
  const aTailleN = new THREE.BufferAttribute(nTaille, 1).setUsage(THREE.DynamicDrawUsage);
  geoN.setAttribute('position', aPosN);
  geoN.setAttribute('vie', aVieN);
  geoN.setAttribute('taille', aTailleN);
  const nuages = new THREE.Points(geoN, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { focale, nuit },
    vertexShader: `
      attribute float vie, taille;
      uniform float focale;
      varying float vVie;
      void main() {
        vVie = vie;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = vie > 0.0 ? clamp(taille * focale / max(-mv.z, 0.3), 2.0, 260.0) : 0.0;
      }`,
    fragmentShader: `
      uniform float nuit;
      varying float vVie;
      void main() {
        vec2 p = gl_PointCoord * 2.0 - 1.0;
        float d = length(p);
        if (d > 1.0) discard;
        // blanc au milieu, un liseré gris-bleu au bord, éclairé d'en haut
        vec3 c = mix(vec3(1.0), vec3(0.72, 0.76, 0.84), smoothstep(0.62, 0.95, d) * 0.85);
        c *= 0.93 + 0.07 * (-p.y);
        c *= mix(1.0, 0.45, nuit);
        gl_FragColor = vec4(c, min(1.0, vVie * 2.5) * (1.0 - smoothstep(0.93, 1.0, d)));
        #include <colorspace_fragment>
      }`,
  }));
  nuages.frustumCulled = false;
  nuages.renderOrder = 4;
  groupe.add(nuages);

  /** Une goutte en (x, y, z), lancée à (vx, vy, vz) m/s ; elle disparaît sous la hauteur sol. */
  function goutte(x, y, z, vx, vy, vz, sol, taille = 0.022, duree = 1.6) {
    const i = gSuivante;
    gSuivante = (gSuivante + 1) % NG;
    gPos.set([x, y, z], i * 3);
    gVit.set([vx, vy, vz], i * 3);
    gAge[i] = 0;
    gDuree[i] = duree;
    gSol[i] = sol;
    gTaille[i] = taille;
    gVie[i] = 1;
    gVivantes = Math.min(NG, gVivantes + 1);
  }

  // ---------------------------------------------------------------- Les ronds dans l'eau
  const NR = 48;
  const plan = new THREE.PlaneGeometry(2, 2);
  plan.rotateX(-Math.PI / 2);
  const geoR = new THREE.InstancedBufferGeometry();
  geoR.index = plan.index;
  geoR.setAttribute('position', plan.attributes.position);
  const rPos = new THREE.InstancedBufferAttribute(new Float32Array(NR * 4), 4); // x, y, z, rayon
  const rT = new THREE.InstancedBufferAttribute(new Float32Array(NR * 2).fill(-1e4), 2); // naissance, durée
  geoR.setAttribute('iPos', rPos);
  geoR.setAttribute('iT', rT);
  geoR.instanceCount = NR;
  let rSuivant = 0;
  const ronds = new THREE.Mesh(geoR, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { temps, nuit },
    vertexShader: `
      attribute vec4 iPos;
      attribute vec2 iT;
      uniform float temps;
      varying vec2 vQ;
      varying float vAge;
      void main() {
        vQ = position.xz;
        vAge = (temps - iT.x) / iT.y;
        vec3 p = iPos.xyz + position * (vAge >= 0.0 && vAge <= 1.0 ? iPos.w : 0.0);
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `
      uniform float nuit;
      varying vec2 vQ;
      varying float vAge;
      void main() {
        if (vAge < 0.0 || vAge > 1.0) discard;
        // un anneau qui s'élargit (vite, puis lentement), s'épaissit et s'efface
        float r = length(vQ), rayon = mix(0.12, 1.0, 1.0 - (1.0 - vAge) * (1.0 - vAge));
        float l = 0.05 + 0.1 * vAge;
        float a = (1.0 - smoothstep(0.0, l, abs(r - rayon))) * (1.0 - vAge) * 0.65;
        if (a < 0.01) discard;
        gl_FragColor = vec4(vec3(1.0) * mix(1.0, 0.45, nuit), a);
        #include <colorspace_fragment>
      }`,
  }));
  ronds.frustumCulled = false;
  ronds.renderOrder = 2; // après l'eau (1)
  groupe.add(ronds);

  // ---------------------------------------------------------------- Les empreintes
  const NE = 128;
  const geoE = new THREE.InstancedBufferGeometry();
  geoE.index = plan.index;
  geoE.setAttribute('position', plan.attributes.position);
  const ePos = new THREE.InstancedBufferAttribute(new Float32Array(NE * 4), 4); // x, y, z, cap
  const eN = new THREE.InstancedBufferAttribute(new Float32Array(NE * 4), 4); // normale du sol, sorte (0 : pied gauche, 1 : droit, 2 : patte)
  const eT = new THREE.InstancedBufferAttribute(new Float32Array(NE * 4).fill(-1e4), 4); // naissance, durée, force, teinte
  geoE.setAttribute('iPos', ePos);
  geoE.setAttribute('iN', eN);
  geoE.setAttribute('iT', eT);
  geoE.instanceCount = NE;
  let eSuivante = 0;
  const empreintes = new THREE.Mesh(geoE, new THREE.ShaderMaterial({
    // (des deux côtés : le repère de l'empreinte, posé selon la pente, retourne ses triangles)
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
    // le sol est multiplié par la couleur de l'empreinte : il s'assombrit, de jour comme de nuit
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor,
    uniforms: { temps },
    vertexShader: `
      attribute vec4 iPos, iN, iT;
      uniform float temps;
      varying vec2 vQ;
      varying vec3 vT;
      varying float vSorte;
      void main() {
        float age = (temps - iT.x) / iT.y;
        vec3 n = normalize(iN.xyz);
        vec3 f = vec3(sin(iPos.w), 0.0, cos(iPos.w));
        vec3 d = normalize(f - n * dot(f, n)), c = cross(n, d);
        // une semelle d'enfant : 9 × 21 cm ; une patte de renard : 6 × 6 cm
        vec2 t = iN.w < 1.5 ? vec2(0.045, 0.105) : vec2(0.03, 0.03);
        vQ = position.xz;
        vSorte = iN.w;
        vT = vec3(age, iT.z, iT.w);
        vec3 p = iPos.xyz + (c * position.x * t.x + d * -position.z * t.y) * (age >= 0.0 && age <= 1.0 ? 1.0 : 0.0) + n * 0.015;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `
      varying vec2 vQ;
      varying vec3 vT;
      varying float vSorte;
      float ovale(vec2 q, vec2 c, vec2 r) { return length((q - c) / r); }
      void main() {
        if (vT.x < 0.0 || vT.x > 1.0) discard;
        // q.x en travers (vers l'intérieur du pied pour les deux pieds), q.y du talon (−1) à la pointe (1)
        vec2 q = vec2(vQ.x * (vSorte > 0.5 && vSorte < 1.5 ? -1.0 : 1.0), -vQ.y);
        float forme;
        if (vSorte < 1.5) {
          float m = min(min(ovale(q, vec2(0.06, 0.36), vec2(0.92, 0.6)), ovale(q, vec2(-0.02, -0.56), vec2(0.72, 0.42))), ovale(q, vec2(-0.2, -0.08), vec2(0.55, 0.5)));
          forme = 1.0 - smoothstep(0.78, 1.0, m);
          // les crans de la semelle
          forme *= 0.82 + 0.18 * step(0.5, fract(q.y * 4.5));
        } else {
          float m = ovale(q, vec2(0.0, -0.3), vec2(0.42, 0.36));
          for (int i = 0; i < 4; i++) {
            float x = i < 2 ? (i == 0 ? -0.45 : 0.45) : (i == 2 ? -0.16 : 0.16);
            m = min(m, ovale(q, vec2(x, i < 2 ? 0.28 : 0.55), vec2(0.2)));
          }
          forme = 1.0 - smoothstep(0.75, 1.0, m);
        }
        float a = forme * vT.y * (1.0 - smoothstep(0.55, 1.0, vT.x));
        if (a < 0.01) discard;
        gl_FragColor = vec4(mix(vec3(1.0), vec3(vT.z), a), 1.0);
      }`,
  }));
  empreintes.frustumCulled = false;
  empreintes.renderOrder = 1;
  groupe.add(empreintes);

  return {
    groupe,
    /**
     * Des éclaboussures en (x, y, z) : n gouttes lancées autour, vers le haut ; sol : la hauteur où elles
     * disparaissent ; force : la vitesse.
     */
    eclabousser(x, y, z, n, { sol = y, force = 1, rayon = 0.08 } = {}) {
      for (let k = 0; k < n; k++) {
        const a = Math.random() * Math.PI * 2, v = (0.6 + Math.random() * 1.2) * force;
        goutte(x + Math.cos(a) * rayon, y, z + Math.sin(a) * rayon, Math.cos(a) * v, (1.6 + Math.random() * 1.8) * force, Math.sin(a) * v, sol - 0.02, 0.024 + Math.random() * 0.02);
      }
    },
    /** Une goutte qui tombe (l'eau qui dégoutte) ; elle disparaît en touchant le sol. */
    tomber(x, y, z, sol) { goutte(x, y, z, (Math.random() - 0.5) * 0.15, -0.2, (Math.random() - 0.5) * 0.15, sol, 0.02 + Math.random() * 0.008); },
    /** Le compagnon s’ébroue : des gouttes jetées tout autour, à hauteur du dos. */
    ebrouer(x, y, z, sol) {
      for (let k = 0; k < 46; k++) {
        const a = Math.random() * Math.PI * 2, v = 1.4 + Math.random() * 1.8;
        goutte(x + Math.cos(a) * 0.15, y + 0.2 + Math.random() * 0.25, z + Math.sin(a) * 0.15, Math.cos(a) * v, 0.4 + Math.random() * 1.6, Math.sin(a) * v, sol, 0.022 + Math.random() * 0.016, 1.2);
      }
    },
    /** Un petit nuage autour de (x, y, z) : une dizaine de boules qui gonflent, s'écartent, montent et s'effacent. */
    nuage(x, y, z, taille = 1) {
      for (let k = 0; k < 11; k++) {
        const i = nSuivant;
        nSuivant = (nSuivant + 1) % NN;
        const a = (k / 11) * Math.PI * 2 + Math.random() * 0.5, h = k < 3 ? 0.3 : 0.05 + Math.random() * 0.25;
        nPos.set([x + Math.cos(a) * 0.08, y + h, z + Math.sin(a) * 0.08], i * 3);
        nVit.set([Math.cos(a) * (0.45 + Math.random() * 0.35) * taille, 0.3 + Math.random() * 0.4, Math.sin(a) * (0.45 + Math.random() * 0.35) * taille], i * 3);
        nAge[i] = 0;
        nDuree[i] = 0.6 + Math.random() * 0.3;
        nT0[i] = (0.1 + Math.random() * 0.06) * taille;
        nVie[i] = 1;
        nTaille[i] = nT0[i];
      }
      nVivants = NN;
    },
    /** Un rond dans l'eau en (x, niveau, z) : il s'élargit jusqu'à `rayon` m en `duree` s. */
    rond(x, y, z, rayon = 0.8, duree = 1.5) {
      const i = rSuivant;
      rSuivant = (rSuivant + 1) % NR;
      rPos.setXYZW(i, x, y + 0.012, z, rayon);
      rT.setXY(i, temps.value, duree);
      rPos.needsUpdate = rT.needsUpdate = true;
    },
    /**
     * Une empreinte en (x, y, z) (y : la surface du sol), tournée vers cap, sur un sol de normale n ;
     * sorte : 0 pied gauche, 1 pied droit, 2 patte ; teinte : la couleur qui multiplie le sol (0,8 : un peu
     * plus sombre) ; force : 0 à 1 ; duree : en secondes (elle s'efface sur sa dernière moitié).
     */
    empreinte(x, y, z, cap, n, sorte, { teinte = 0.8, force = 1, duree = 20 } = {}) {
      const i = eSuivante;
      eSuivante = (eSuivante + 1) % NE;
      ePos.setXYZW(i, x, y, z, cap);
      eN.setXYZW(i, n[0], n[1], n[2], sorte);
      eT.setXYZW(i, temps.value, duree, force, teinte);
      ePos.needsUpdate = eN.needsUpdate = eT.needsUpdate = true;
    },
    /** Chaque image : l'heure (le jeu), la focale (pixels, pour la taille des gouttes), la nuit (0 à 1). */
    maj(dt, t, f, n) {
      temps.value = t;
      focale.value = f;
      nuit.value = n;
      if (nVivants) {
        let vivants = 0;
        for (let i = 0; i < NN; i++) {
          if (nVie[i] <= 0) continue;
          nAge[i] += dt;
          const k = i * 3, ralenti = Math.exp(-dt * 3.2);
          nVit[k] *= ralenti; nVit[k + 2] *= ralenti; nVit[k + 1] *= Math.exp(-dt * 1.5);
          nPos[k] += nVit[k] * dt; nPos[k + 1] += nVit[k + 1] * dt; nPos[k + 2] += nVit[k + 2] * dt;
          const u = nAge[i] / nDuree[i];
          nVie[i] = u >= 1 ? 0 : 1 - u;
          nTaille[i] = nT0[i] * (1 + 1.3 * Math.sqrt(Math.min(1, u)));
          if (nVie[i] > 0) vivants++;
        }
        nVivants = vivants;
        aPosN.needsUpdate = aVieN.needsUpdate = aTailleN.needsUpdate = true;
      }
      if (!gVivantes) return;
      let vivantes = 0;
      for (let i = 0; i < NG; i++) {
        if (gVie[i] <= 0) continue;
        gAge[i] += dt;
        const k = i * 3;
        gVit[k + 1] -= 9.8 * dt;
        gPos[k] += gVit[k] * dt;
        gPos[k + 1] += gVit[k + 1] * dt;
        gPos[k + 2] += gVit[k + 2] * dt;
        gVie[i] = gPos[k + 1] < gSol[i] || gAge[i] > gDuree[i] ? 0 : 1 - gAge[i] / gDuree[i];
        if (gVie[i] > 0) vivantes++;
      }
      gVivantes = vivantes;
      attPos.needsUpdate = attVie.needsUpdate = attTaille.needsUpdate = true;
    },
  };
}
