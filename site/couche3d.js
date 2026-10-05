// ================================================================
//  Les modèles 3D sur la carte : quand on zoome, chaque lieu montre
//  le petit modèle de l'icône de sa catégorie (voir modeles3d.js),
//  posé à même le relief et cerné d'un trait d'encre sépia.
//  three.js (le moteur 3D) n'est chargé qu'après le démarrage (pour les
//  bateaux de mer.js) ou au premier zoom rapproché : la carte démarre aussi vite.
// ================================================================
export const URL_THREE = 'https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.min.js';

const ZOOM_CHARGEMENT = 7; // on charge three.js un peu avant d'en avoir besoin
const ZOOM_DEBUT = 8.6; // en dessous : pas de modèles
const ZOOM_PLEIN = 9.6; // entre les deux, les modèles sortent de terre
const TRAIT = 1.4; // épaisseur du trait d'encre autour des modèles, en pixels à l'écran
const RESERVE = 2; // places en plus dans chaque tampon, pour les lieux provisoires (plongeon sur un nouveau lieu)

/** Hauteur à l'écran (en pixels) d'un modèle de taille 1 : il grandit doucement quand on s'approche. */
const taillePx = (z) => Math.min(170, 62 * 2 ** ((z - 10.5) * 0.5));
const lisser = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

/**
 * Fait avancer un générateur par tranches d'environ 6 ms, entre deux images : fabriquer tous les modèles
 * d'un coup figeait la carte (un tiers de seconde sur un téléphone moyen). Promise de sa valeur finale.
 */
function sansFiger(fabrique) {
  return new Promise((ok, echec) => {
    const tranche = () => {
      try {
        const debut = performance.now();
        let etape;
        do etape = fabrique.next(); while (!etape.done && performance.now() - debut < 6);
        if (etape.done) ok(etape.value);
        else setTimeout(tranche, 0);
      } catch (e) {
        echec(e);
      }
    };
    tranche();
  });
}

/**
 * Branche les modèles 3D sur la carte.
 * @param obtenirLieux - fonction qui rend la liste des lieux (elle est vide tant que le tableau n'est pas lu)
 * @returns lieuSous(point) : le lieu dont le modèle est sous ce point de l'écran, ou null
 */
export function brancherModeles(map, maplibregl, obtenirLieux) {
  let etat = 'attente'; // puis 'chargement', 'pret' ou 'echec'
  let THREE, renderer, scene, camera, soleil, contour, types = null;
  let versionRelief = 0; // change à chaque tuile de relief reçue : les altitudes se précisent
  let dessines = []; // lieux dessinés à la dernière image (pour les clics)
  let echelleDessin = 0;
  let leveeActuelle = null;
  let filtre = null; // si posé, seuls les lieux pour lesquels filtre(lieu) est vrai ont leur modèle (jeu.js)
  let provisoires = []; // lieux qui ne sont pas (encore) dans le tableau : le plongeon sur un nouveau lieu
  let outils3d = null; // { modeles, modelePour, matiere } une fois three.js chargé
  let chauffer = false; // compiler les shaders des modèles à la prochaine image (avant un plongeon)
  const m4 = {};

  map.on('sourcedata', (e) => { if (e.sourceId === 'relief' && e.tile) versionRelief++; });

  /** Altitude du sol sous un lieu (relief exagéré compris), gardée tant que le relief ne change pas. */
  function altitude(l) {
    const cle = `${map.terrain?.exaggeration}|${versionRelief}`;
    if (l.alt3d?.cle !== cle) l.alt3d = { cle, valeur: map.queryTerrainElevation([l.lng, l.lat]) || 0 };
    return l.alt3d.valeur;
  }

  /** Le modèle d'un lieu et sa hauteur (pour poser son épingle juste au-dessus). */
  function preparerLieu(l) {
    const { modeles, modelePour } = outils3d;
    l.modele3d = modelePour(l.cat.icone, modeles);
    l.hauteur3d = modeles[l.modele3d].hauteur;
  }

  function nouveauType(nom, liste) {
    const geo = outils3d.modeles[nom].geometrie;
    const mesh = new THREE.InstancedMesh(geo, outils3d.matiere, liste.length + RESERVE);
    mesh.frustumCulled = false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    // le trait d'encre : la même forme, gonflée, vue de dos, aux mêmes places (elle partage leurs matrices)
    const trait = new THREE.InstancedMesh(geo, contour.matiere, liste.length + RESERVE);
    trait.frustumCulled = false;
    trait.instanceMatrix = mesh.instanceMatrix;
    scene.add(mesh, trait);
    const t = { nom, lieux: liste, mesh, trait };
    types.push(t);
    return t;
  }

  /** Range les lieux par modèle ; un seul « tampon » (InstancedMesh) par modèle, donc très peu de dessins. */
  function preparerTypes(lieux, modeles, modelePour, matiereContour) {
    outils3d = { modeles, modelePour, matiere: new THREE.MeshLambertMaterial({ vertexColors: true }) };
    contour = matiereContour(THREE);
    const parModele = new Map();
    for (const l of lieux) {
      preparerLieu(l);
      if (!parModele.has(l.modele3d)) parModele.set(l.modele3d, []);
      parModele.get(l.modele3d).push(l);
    }
    types = [];
    for (const [nom, liste] of parModele) nouveauType(nom, liste);
  }

  const couche = {
    id: 'modeles-3d',
    type: 'custom',
    renderingMode: '3d',
    onAdd(_map, gl) {
      renderer = new THREE.WebGLRenderer({ canvas: map.getCanvas(), context: gl });
      renderer.autoClear = false;
      scene = new THREE.Scene();
      camera = new THREE.Camera();
      // Repère de la carte : x = est, y = sud, z = haut. Le « soleil » des modèles suit la caméra
      // (il vient d'en haut à gauche de celui qui regarde) : sinon, vus du sud, ils seraient à contre-jour.
      const ciel = new THREE.HemisphereLight(0xfff3dc, 0x6b5a44, 2.5);
      ciel.position.set(0, 0, 1);
      soleil = new THREE.DirectionalLight(0xfff0d8, 2.2);
      scene.add(ciel, soleil);
      m4.instance = new THREE.Matrix4();
      m4.centre = new THREE.Matrix4();
      m4.pos = new THREE.Vector3();
      // modèle (x, y = haut, z = devant) → carte (x = est, y = sud, z = haut) : le devant regarde le sud.
      // C'est un miroir, voulu : la carte en est un aussi (y vers le sud), sinon on verrait l'intérieur des formes.
      m4.base = new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1);
    },
    render(gl, args) {
      if (chauffer && types) {
        // Compilés d'avance, pendant l'image fixe du plongeon : à leur premier dessin, ils figeaient
        // une image en pleine descente.
        chauffer = false;
        renderer.resetState();
        renderer.compile(scene, camera);
      }
      const z = map.getZoom();
      const pousse = lisser((z - ZOOM_DEBUT) / (ZOOM_PLEIN - ZOOM_DEBUT));
      dessines = [];
      if (pousse <= 0 || !types) return;
      echelleDessin = taillePx(z) * pousse;
      const k = echelleDessin / (512 * 2 ** z); // taille du modèle en unités de la carte
      contour.epaisseur.value = Math.min(0.03, TRAIT / echelleDessin); // un trait de même épaisseur à toutes les tailles
      // Tout est calculé autour du centre de l'écran : de petits nombres, donc pas de tremblement au zoom maximum.
      const centre = maplibregl.MercatorCoordinate.fromLngLat(map.getCenter());
      const bornes = map.getBounds();
      const marge = 0.05 * (bornes.getEast() - bornes.getWest());
      const b = (map.getBearing() * Math.PI) / 180;
      soleil.position.set(-Math.sin(b) - 0.5 * Math.cos(b), Math.cos(b) - 0.5 * Math.sin(b), 1.2);
      let nb = 0;
      for (const t of types) {
        let n = 0;
        const liste = provisoires.length ? t.lieux.concat(provisoires.filter((l) => l.modele3d === t.nom)) : t.lieux;
        for (const l of liste) {
          if (!l.cat.visible || (filtre && !filtre(l))) continue;
          if (l.lng < bornes.getWest() - marge || l.lng > bornes.getEast() + marge
            || l.lat < bornes.getSouth() - marge || l.lat > bornes.getNorth() + marge) continue;
          const mc = maplibregl.MercatorCoordinate.fromLngLat([l.lng, l.lat], altitude(l));
          m4.pos.set(mc.x - centre.x, mc.y - centre.y, mc.z);
          m4.instance.makeScale(k, k, k).multiply(m4.base).setPosition(m4.pos);
          t.mesh.setMatrixAt(n++, m4.instance);
          dessines.push(l);
        }
        t.mesh.count = t.trait.count = n;
        t.mesh.instanceMatrix.needsUpdate = true;
        nb += n;
      }
      if (!nb) return;
      camera.projectionMatrix.fromArray(args.defaultProjectionData.mainMatrix)
        .multiply(m4.centre.makeTranslation(centre.x, centre.y, 0));
      camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
      renderer.resetState();
      renderer.setViewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      renderer.render(scene, camera);
    },
    onRemove() { renderer?.dispose(); },
  };

  /**
   * Monte chaque repère juste au-dessus de son modèle : la hauteur à l'écran d'un modèle de taille 1
   * (par pas de 4 px), fois la hauteur de son modèle. On décale le repère lui-même (MapLibre le replace
   * de toute façon à chaque image) : une variable CSS posée sur la carte obligeait le navigateur à
   * recalculer le style des quelque 2 000 éléments de la carte, et les téléphones saccadaient au zoom.
   */
  function majLevee() {
    if (etat !== 'pret') return;
    const pousse = lisser((map.getZoom() - ZOOM_DEBUT) / (ZOOM_PLEIN - ZOOM_DEBUT));
    const px = taillePx(map.getZoom()) * pousse * Math.sin((map.getPitch() * Math.PI) / 180);
    const levee = Math.round(px / 4) * 4;
    if (levee !== leveeActuelle) {
      leveeActuelle = levee;
      for (const l of [...obtenirLieux(), ...provisoires]) {
        if (l.hauteur3d) l.epingle.setOffset([0, -Math.round(levee * (l.hauteur3d + 0.08))]);
      }
    }
  }

  async function charger() {
    etat = 'chargement';
    try {
      THREE = await import(URL_THREE);
      const { fabriquerPeuAPeu, modelePour, matiereContour } = await import('./modeles3d.js');
      const modeles = await sansFiger(fabriquerPeuAPeu(THREE));
      map.addLayer(couche);
      const installer = () => {
        const lieux = obtenirLieux();
        if (!lieux.length) return false;
        preparerTypes(lieux, modeles, modelePour, matiereContour);
        etat = 'pret';
        if (provisoires.length) installerProvisoires();
        majLevee();
        map.triggerRepaint();
        return true;
      };
      // le tableau des lieux peut arriver après three.js
      if (!installer()) {
        const attendre = setInterval(() => { if (installer()) clearInterval(attendre); }, 300);
      }
    } catch (e) {
      etat = 'echec';
      console.warn('Modèles 3D indisponibles', e);
    }
  }

  const verifier = () => {
    if (etat === 'attente' && map.getZoom() >= ZOOM_CHARGEMENT) charger();
    majLevee();
  };
  map.on('move', verifier);
  verifier();

  /** Les lieux provisoires reçoivent leur modèle (un tampon de plus si aucun lieu du tableau n'a ce modèle). */
  function installerProvisoires() {
    for (const l of provisoires) {
      preparerLieu(l);
      if (!types.some((t) => t.nom === l.modele3d)) nouveauType(l.modele3d, []);
      if (leveeActuelle) l.epingle.setOffset([0, -Math.round(leveeActuelle * (l.hauteur3d + 0.08))]);
    }
  }

  return {
    /**
     * Prépare tout d'avance (avant un plongeon) : three.js chargé, modèles fabriqués (peu à peu, ~0,3 s sur
     * un téléphone moyen) et shaders compilés. Sinon, ça se faisait en pleine descente, au zoom 7 et 8,6.
     */
    preparer() {
      if (etat === 'attente') charger();
      if (etat === 'echec') return;
      chauffer = true;
      map.triggerRepaint();
    },
    /** Lieux qui ne sont pas dans le tableau, dessinés comme les autres (au plus RESERVE) ; [] pour les retirer. */
    provisoires(liste) {
      provisoires = liste.slice(0, RESERVE);
      if (etat === 'pret') installerProvisoires();
      map.triggerRepaint();
    },
    /** Ne dessine que les modèles des lieux pour lesquels f(lieu) est vrai ; null : tous. */
    filtrer(f) {
      filtre = f;
      map.triggerRepaint();
    },
    /** Le lieu dont le modèle est sous ce point de l'écran (pour ouvrir sa fiche d'un appui sur le modèle). */
    lieuSous(point) {
      if (!dessines.length) return null;
      const sinus = Math.sin((map.getPitch() * Math.PI) / 180);
      let meilleur = null, distance = Infinity;
      for (const l of dessines) {
        const p = map.project([l.lng, l.lat]);
        const demiLargeur = echelleDessin * 0.5;
        const haut = p.y - echelleDessin * l.hauteur3d * sinus - 4;
        if (point.x < p.x - demiLargeur || point.x > p.x + demiLargeur || point.y < haut || point.y > p.y + demiLargeur * 0.6) continue;
        const d = Math.hypot(point.x - p.x, point.y - p.y);
        if (d < distance) { distance = d; meilleur = l; }
      }
      return meilleur;
    },
  };
}
