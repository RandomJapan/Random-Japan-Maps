// ================================================================
//  Les modèles 3D sur la carte : quand on zoome, chaque lieu montre
//  le petit modèle de l'icône de sa catégorie (voir modeles3d.js),
//  posé sur le relief, sur un socle de la couleur de la catégorie.
//  three.js (le moteur 3D) n'est chargé qu'après le démarrage (pour les
//  bateaux de mer.js) ou au premier zoom rapproché : la carte démarre aussi vite.
// ================================================================
export const URL_THREE = 'https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.min.js';

const ZOOM_CHARGEMENT = 7; // on charge three.js un peu avant d'en avoir besoin
const ZOOM_DEBUT = 8.6; // en dessous : pas de modèles
const ZOOM_PLEIN = 9.6; // entre les deux, les modèles sortent de terre
const BRUN = [0x4a, 0x35, 0x21]; // les couleurs du tableau sont vieillies vers ce sépia, comme les blasons

/** Hauteur à l'écran (en pixels) d'un modèle de taille 1 : il grandit doucement quand on s'approche. */
const taillePx = (z) => Math.min(170, 62 * 2 ** ((z - 10.5) * 0.5));
const lisser = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

/**
 * Branche les modèles 3D sur la carte.
 * @param obtenirLieux - fonction qui rend la liste des lieux (elle est vide tant que le tableau n'est pas lu)
 * @returns lieuSous(point) : le lieu dont le modèle est sous ce point de l'écran, ou null
 */
export function brancherModeles(map, maplibregl, obtenirLieux) {
  let etat = 'attente'; // puis 'chargement', 'pret' ou 'echec'
  let THREE, renderer, scene, camera, soleil, socle, types = null;
  let versionRelief = 0; // change à chaque tuile de relief reçue : les altitudes se précisent
  let dessines = []; // lieux dessinés à la dernière image (pour les clics)
  let echelleDessin = 0;
  let leveeActuelle = null;
  let filtre = null; // si posé, seuls les lieux pour lesquels filtre(lieu) est vrai ont leur modèle (jeu.js)
  const m4 = {};

  map.on('sourcedata', (e) => { if (e.sourceId === 'relief' && e.tile) versionRelief++; });

  /** Altitude du sol sous un lieu (relief exagéré compris), gardée tant que le relief ne change pas. */
  function altitude(l) {
    const cle = `${map.terrain?.exaggeration}|${versionRelief}`;
    if (l.alt3d?.cle !== cle) l.alt3d = { cle, valeur: map.queryTerrainElevation([l.lng, l.lat]) || 0 };
    return l.alt3d.valeur;
  }

  /** Range les lieux par modèle ; un seul « tampon » (InstancedMesh) par modèle, donc très peu de dessins. */
  function preparerTypes(lieux, modeles, modelePour) {
    const parModele = new Map();
    const matiere = new THREE.MeshLambertMaterial({ vertexColors: true });
    for (const l of lieux) {
      const nom = modelePour(l.cat.icone, modeles);
      if (!parModele.has(nom)) parModele.set(nom, []);
      parModele.get(nom).push(l);
      l.hauteur3d = modeles[nom].hauteur;
      const hexa = l.cat.couleur.replace('#', '');
      const rvb = [0, 2, 4].map((i, j) => Math.round(parseInt(hexa.slice(i, i + 2), 16) * 0.78 + BRUN[j] * 0.22));
      l.couleur3d = new THREE.Color(`rgb(${rvb.join(',')})`);
    }
    types = [...parModele].map(([nom, liste]) => {
      const mesh = new THREE.InstancedMesh(modeles[nom].geometrie, matiere, liste.length);
      mesh.frustumCulled = false;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      scene.add(mesh);
      return { lieux: liste, mesh };
    });
    // Le socle rond commun : un disque qui s'enfonce un peu dans le sol (sur une pente, il ne flotte pas)
    const geo = new THREE.CylinderGeometry(0.5, 0.52, 0.2, 24).toNonIndexed();
    geo.translate(0, -0.04, 0);
    geo.computeVertexNormals();
    socle = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial(), lieux.length);
    socle.frustumCulled = false;
    socle.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < lieux.length; i++) socle.setColorAt(i, lieux[i].couleur3d);
    scene.add(socle);
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
      const z = map.getZoom();
      const pousse = lisser((z - ZOOM_DEBUT) / (ZOOM_PLEIN - ZOOM_DEBUT));
      dessines = [];
      if (pousse <= 0 || !types) return;
      echelleDessin = taillePx(z) * pousse;
      const k = echelleDessin / (512 * 2 ** z); // taille du modèle en unités de la carte
      // Tout est calculé autour du centre de l'écran : de petits nombres, donc pas de tremblement au zoom maximum.
      const centre = maplibregl.MercatorCoordinate.fromLngLat(map.getCenter());
      const bornes = map.getBounds();
      const marge = 0.05 * (bornes.getEast() - bornes.getWest());
      const b = (map.getBearing() * Math.PI) / 180;
      soleil.position.set(-Math.sin(b) - 0.5 * Math.cos(b), Math.cos(b) - 0.5 * Math.sin(b), 1.2);
      let nSocle = 0;
      for (const t of types) {
        let n = 0;
        for (const l of t.lieux) {
          if (!l.cat.visible || (filtre && !filtre(l))) continue;
          if (l.lng < bornes.getWest() - marge || l.lng > bornes.getEast() + marge
            || l.lat < bornes.getSouth() - marge || l.lat > bornes.getNorth() + marge) continue;
          const mc = maplibregl.MercatorCoordinate.fromLngLat([l.lng, l.lat], altitude(l));
          m4.pos.set(mc.x - centre.x, mc.y - centre.y, mc.z);
          m4.instance.makeScale(k, k, k).multiply(m4.base).setPosition(m4.pos);
          t.mesh.setMatrixAt(n++, m4.instance);
          socle.setMatrixAt(nSocle, m4.instance);
          socle.setColorAt(nSocle++, l.couleur3d);
          dessines.push(l);
        }
        t.mesh.count = n;
        t.mesh.instanceMatrix.needsUpdate = true;
      }
      socle.count = nSocle;
      socle.instanceMatrix.needsUpdate = true;
      socle.instanceColor.needsUpdate = true;
      if (!nSocle) return;
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
      for (const l of obtenirLieux()) {
        if (l.hauteur3d) l.epingle.setOffset([0, -Math.round(levee * (l.hauteur3d + 0.08))]);
      }
    }
  }

  async function charger() {
    etat = 'chargement';
    try {
      THREE = await import(URL_THREE);
      const { fabriquerModeles, modelePour } = await import('./modeles3d.js');
      const modeles = fabriquerModeles(THREE);
      map.addLayer(couche);
      const installer = () => {
        const lieux = obtenirLieux();
        if (!lieux.length) return false;
        preparerTypes(lieux, modeles, modelePour);
        etat = 'pret';
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

  return {
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
