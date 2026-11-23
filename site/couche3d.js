// ================================================================
//  Les modèles 3D sur la carte : quand on zoome, chaque lieu montre
//  le petit modèle de l'icône de sa catégorie (voir modeles3d.js),
//  posé à même le relief et cerné d'un trait d'encre sépia.
//  Il suit la saison du lieu (neige sur les toits, érables rouges en
//  automne, cerisiers en fleurs… voir phenologie.js) et, la nuit, ses
//  lanternes s'allument et une lueur chaude l'entoure.
//  three.js (le moteur 3D) n'est chargé qu'après le démarrage (pour les
//  bateaux de mer.js) ou au premier zoom rapproché : la carte démarre aussi vite.
// ================================================================
import { TEINTES } from './teintes.js';
import { etatNature, HIVER_NOEL } from './phenologie.js';
import { tailleCarte } from './commun.js';

export const URL_THREE = 'https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.min.js';

const ZOOM_CHARGEMENT = 7; // on charge three.js un peu avant d'en avoir besoin
const ZOOM_DEBUT = 8.6; // en dessous : pas de modèles
const ZOOM_PLEIN = 9.6; // entre les deux, les modèles sortent de terre
const TRAIT = 1.4; // épaisseur du trait d'encre autour des modèles, en pixels à l'écran
const RESERVE = 2; // places en plus dans chaque tampon, pour les lieux provisoires (plongeon sur un nouveau lieu)
const DECORS_DEBUT = 10.2; // les objets posés près d'un lieu (decors) sortent de terre entre ce zoom et 0,6 plus près

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
  let THREE, renderer, scene, camera, ciel, soleil, contour, types = null;
  let saisons = null; // les réglages de la matière des modèles (saison, nuit) : modeles3d.js, matiereSaisons
  let lueurs = null; // la nuit : le halo et la lueur au sol de chaque lieu
  let versionRelief = 0; // change à chaque tuile de relief reçue : les altitudes se précisent
  let dessines = []; // lieux dessinés à la dernière image (pour les clics)
  let echelleDessin = 0;
  let leveeActuelle = null;
  let filtre = null; // si posé, seuls les lieux pour lesquels filtre(lieu) est vrai ont leur modèle (jeu.js)
  let provisoires = []; // lieux qui ne sont pas (encore) dans le tableau : le plongeon sur un nouveau lieu
  let outils3d = null; // { modeles, modelePour, matiere, ateliers } une fois three.js chargé
  // des objets posés près du modèle d'un lieu, à son échelle et chacun sur son sol (noel-carte.js : les six Jizō du
  // Murō-ji) : { liste, fabriquer, auClic, formes, vus } ; voir decors() plus bas
  let decors = null;
  // Noël (noel-decors.js) : forceSaison(lieu) → { neige (au moins), glaceNuit } ou null ; versionForce la fait relire
  let forceSaison = null, versionForce = 0;
  let chauffer = false; // compiler les shaders des modèles à la prochaine image (avant un plongeon)
  const m4 = {};

  map.on('sourcedata', (e) => { if (e.sourceId === 'relief' && e.tile) versionRelief++; });

  /** Altitude du sol sous un lieu (relief exagéré compris), gardée tant que le relief ne change pas. */
  function altitude(l) {
    const cle = `${map.terrain?.exaggeration}|${versionRelief}`;
    if (l.alt3d?.cle !== cle) l.alt3d = { cle, valeur: map.queryTerrainElevation([l.lng, l.lat]) || 0 };
    return l.alt3d.valeur;
  }

  /**
   * L'état de la nature au lieu ce jour-là (neige, automne, feuilles, fleurs : phenologie.js), selon sa latitude
   * et son altitude réelle (le relief exagéré divisé par l'exagération).
   */
  function etatLieu(l) {
    const alt = Math.max(0, altitude(l) / (map.terrain?.exaggeration || 1));
    const cle = `${TEINTES.jour}|${Math.round(alt / 40)}|${HIVER_NOEL.jourNeige}|${versionForce}`;
    if (l.etat3d?.cle !== cle) {
      const v = etatNature(l.lat, l.lng, alt, TEINTES.jour);
      const f = forceSaison?.(l);
      // au-dessus de 1,5, la neige dit aussi « la glace luit la nuit » (matiereSaisons, modeles3d.js)
      if (f) v[0] = Math.max(v[0], f.neige || 0) + (f.glaceNuit ? 2 : 0);
      l.etat3d = { cle, valeur: v };
    }
    return l.etat3d.valeur;
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
    // l'état de la nature de chaque lieu dessiné (matiereSaisons)
    const etat = new THREE.InstancedBufferAttribute(new Float32Array((liste.length + RESERVE) * 4).fill(1), 4);
    etat.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('etatSaison', etat);
    // le trait d'encre : la même forme, gonflée, vue de dos, aux mêmes places (elle partage leurs matrices)
    const trait = new THREE.InstancedMesh(geo, contour.matiere, liste.length + RESERVE);
    trait.frustumCulled = false;
    trait.instanceMatrix = mesh.instanceMatrix;
    scene.add(mesh, trait);
    const t = { nom, lieux: liste, mesh, trait, etat };
    types.push(t);
    return t;
  }

  /** Range les lieux par modèle ; un seul « tampon » (InstancedMesh) par modèle, donc très peu de dessins. */
  function preparerTypes(lieux, modeles, modelePour, matiereContour, matiereSaisons, matieresLueur, ateliers) {
    saisons = matiereSaisons(THREE);
    outils3d = { modeles, modelePour, matiere: saisons.matiere, ateliers };
    contour = matiereContour(THREE);
    lueurs = creerLueurs(lieux.length + RESERVE * 2, matieresLueur);
    const parModele = new Map();
    for (const l of lieux) {
      preparerLieu(l);
      if (!parModele.has(l.modele3d)) parModele.set(l.modele3d, []);
      parModele.get(l.modele3d).push(l);
    }
    types = [];
    for (const [nom, liste] of parModele) nouveauType(nom, liste);
  }

  /**
   * La lueur des lieux la nuit (2026-10-12, demande du propriétaire : « une sorte de lumière qui émane du lieu ») :
   * un halo chaud tourné vers l'écran au milieu du modèle, et une flaque de lumière au sol autour de lui.
   * Ajoutées à l'image (mélange additif), sans écrire la profondeur : le relief devant les cache.
   */
  function creerLueurs(n, matieresLueur) {
    const { halo: matiereHalo, flaque: matiereFlaque, uniformes } = matieresLueur(THREE, 1.6);
    const disque = new THREE.CircleGeometry(1.6, 40);
    disque.rotateX(-Math.PI / 2);
    disque.translate(0, 0.015, 0);
    const halo = new THREE.InstancedMesh(new THREE.PlaneGeometry(2, 2), matiereHalo, n);
    const flaque = new THREE.InstancedMesh(disque, matiereFlaque, n);
    for (const m of [flaque, halo]) {
      m.frustumCulled = false;
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      m.count = 0;
      scene.add(m);
    }
    flaque.renderOrder = 1;
    halo.renderOrder = 2;
    return { halo, flaque, uniformes, n };
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
      ciel = new THREE.HemisphereLight(0xfff3dc, 0x6b5a44, 2.5);
      ciel.position.set(0, 0, 1);
      soleil = new THREE.DirectionalLight(0xfff0d8, 2.2);
      scene.add(ciel, soleil);
      m4.instance = new THREE.Matrix4();
      m4.rot = new THREE.Matrix4();
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
      ciel.intensity = 2.5 * TEINTES.lumiere; // moins de lumière la nuit (ambiance.js)
      soleil.intensity = 2.2 * TEINTES.lumiere;
      const saison = TEINTES.jour !== null;
      saisons.uniformes.actif.value = saison ? 1 : 0;
      saisons.uniformes.nuit.value = TEINTES.nuit;
      const lueur = TEINTES.nuit * pousse;
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
          if (saison) t.etat.array.set(etatLieu(l), n * 4);
          if (lueur > 0.01 && nb + n < lueurs.n) {
            lueurs.halo.setMatrixAt(nb + n, m4.instance);
            lueurs.flaque.setMatrixAt(nb + n, m4.instance);
          }
          t.mesh.setMatrixAt(n++, m4.instance);
          dessines.push(l);
        }
        t.mesh.count = t.trait.count = n;
        t.mesh.instanceMatrix.needsUpdate = true;
        if (saison) t.etat.needsUpdate = true;
        nb += n;
      }
      if (decors?.formes) dessinerDecors(z, k, centre, saison);
      // la nuit, la lueur des lieux
      lueurs.halo.count = lueurs.flaque.count = lueur > 0.01 ? Math.min(nb, lueurs.n) : 0;
      if (lueurs.halo.count) {
        lueurs.uniformes.force.value = lueur;
        lueurs.uniformes.rayon.value = echelleDessin * 1.15;
        const { l, h } = tailleCarte(map);
        lueurs.uniformes.ecran.value.set(l, h);
        lueurs.halo.instanceMatrix.needsUpdate = lueurs.flaque.instanceMatrix.needsUpdate = true;
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
   * Les objets posés près d'un lieu : seulement quand le modèle du lieu est dessiné (dessines), à la même échelle que
   * lui (k), décalés de (x, z) unités du modèle (x vers l'est, z vers le sud : le devant des modèles), chacun posé sur
   * le relief à sa propre place (son altitude, gardée par cran de zoom), tourné de ry. Ils sortent de terre entre
   * DECORS_DEBUT et 0,6 plus près. La neige : celle du lieu, au moins `neige`.
   */
  function dessinerDecors(z, k, centre, saison) {
    const d = decors, apparait = lisser((z - DECORS_DEBUT) / 0.6);
    for (const f of Object.values(d.formes)) f.n = 0;
    d.vus = [];
    if (apparait > 0) {
      const cle = `${Math.round(z * 8)}|${versionRelief}|${map.terrain?.exaggeration}`;
      for (const [i, o] of d.liste.entries()) {
        const f = d.formes[o.forme];
        const l = f && dessines.find((x) => x.id === o.lieu);
        if (!l) continue;
        const mc = maplibregl.MercatorCoordinate.fromLngLat([l.lng, l.lat]);
        const mx = mc.x + o.x * k, my = mc.y + o.z * k;
        if (o.alt?.cle !== cle) {
          const lngLat = new maplibregl.MercatorCoordinate(mx, my, 0).toLngLat();
          o.alt = { cle, lngLat, v: map.queryTerrainElevation(lngLat) || 0 };
        }
        const ks = k * (o.s ?? 1) * apparait;
        m4.pos.set(mx - centre.x, my - centre.y, maplibregl.MercatorCoordinate.fromLngLat(o.alt.lngLat, o.alt.v).z);
        m4.instance.makeScale(ks, ks, ks).multiply(m4.base).multiply(m4.rot.makeRotationY(o.ry || 0)).setPosition(m4.pos);
        if (saison) {
          const e = etatLieu(l);
          f.etat.array.set([Math.max(e[0] > 1.5 ? e[0] - 2 : e[0], o.neige || 0), e[1], e[2], e[3]], f.n * 4);
        }
        f.mesh.setMatrixAt(f.n++, m4.instance);
        d.vus.push({ i, lngLat: o.alt.lngLat, hPx: f.hauteur * (o.s ?? 1) * apparait * echelleDessin });
      }
    }
    for (const f of Object.values(d.formes)) {
      f.mesh.count = f.trait.count = f.n;
      f.mesh.instanceMatrix.needsUpdate = true;
      if (saison) f.etat.needsUpdate = true;
    }
  }

  /** Fabrique les formes des objets (une fois three.js prêt) : un tampon et son trait d'encre par forme. */
  function installerDecors() {
    if (!decors || decors.formes || etat !== 'pret') return;
    const faites = decors.fabriquer(THREE, outils3d.ateliers(THREE)); // { forme: { geometrie, hauteur } }
    decors.formes = {};
    for (const [nom, m] of Object.entries(faites)) {
      const n = Math.max(1, decors.liste.filter((o) => o.forme === nom).length);
      const geo = m.geometrie;
      const etatSaison = new THREE.InstancedBufferAttribute(new Float32Array(n * 4).fill(1), 4);
      etatSaison.setUsage(THREE.DynamicDrawUsage);
      geo.setAttribute('etatSaison', etatSaison);
      const mesh = new THREE.InstancedMesh(geo, outils3d.matiere, n);
      const trait = new THREE.InstancedMesh(geo, contour.matiere, n);
      for (const x of [mesh, trait]) { x.frustumCulled = false; x.count = 0; }
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      trait.instanceMatrix = mesh.instanceMatrix;
      scene.add(mesh, trait);
      decors.formes[nom] = { mesh, trait, etat: etatSaison, hauteur: m.hauteur, n: 0 };
    }
    map.triggerRepaint();
  }
  function retirerDecors() {
    for (const f of Object.values(decors?.formes || {})) {
      scene.remove(f.mesh, f.trait);
      f.mesh.geometry.dispose();
      f.mesh.dispose();
    }
    decors = null;
  }

  /** L'objet posé sous ce point de l'écran (son rang dans la liste), ou −1 : une boîte autour de sa place, assez grande
   *  pour le doigt même quand il est petit. */
  function decorSous(point) {
    if (!decors?.vus?.length) return -1;
    const sinus = Math.max(0.35, Math.sin((map.getPitch() * Math.PI) / 180));
    let meilleur = -1, distance = Infinity;
    for (const v of decors.vus) {
      const p = map.project(v.lngLat);
      const h = Math.max(16, v.hPx * sinus), w = Math.max(11, v.hPx * 0.42);
      if (point.x < p.x - w || point.x > p.x + w || point.y < p.y - h - 4 || point.y > p.y + 7) continue;
      const d = Math.hypot(point.x - p.x, point.y - (p.y - h / 2));
      if (d < distance) { distance = d; meilleur = v.i; }
    }
    return meilleur;
  }

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
      const { fabriquerPeuAPeu, modelePour, matiereContour, matiereSaisons, matieresLueur, ateliers } = await import('./modeles3d.js');
      const modeles = await sansFiger(fabriquerPeuAPeu(THREE));
      map.addLayer(couche);
      const installer = () => {
        const lieux = obtenirLieux();
        if (!lieux.length) return false;
        preparerTypes(lieux, modeles, modelePour, matiereContour, matiereSaisons, matieresLueur, ateliers);
        etat = 'pret';
        if (provisoires.length) installerProvisoires();
        installerDecors();
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
    /**
     * Des objets 3D posés près du modèle d'un lieu (noel-carte.js : les six Jizō du Murō-ji), [] pour les retirer.
     * liste : [{ forme, lieu (id du lieu), x, z (unités du modèle : est, sud), ry, s (taille), neige (0–1, au moins) }] ;
     * fabriquer(THREE, atelier) → { forme: { geometrie, hauteur } } (atelier de modeles3d.js) ; auClic(rang) : un appui
     * sur l'un d'eux (passe avant l'appui sur le modèle du lieu, voir lieuSous).
     */
    decors(liste, fabriquer, auClic) {
      retirerDecors();
      if (liste?.length) decors = { liste: liste.map((o) => ({ ...o })), fabriquer, auClic, formes: null, vus: [] };
      installerDecors();
      map.triggerRepaint();
    },
    /**
     * Une saison forcée pour certains lieux (noel-decors.js : les cascades gelées du calendrier de l'Avent) :
     * f(lieu) → { neige (au moins, 0–1), glaceNuit (l'eau gelée luit la nuit) } ou null ; f = null : la vraie saison.
     */
    forcerSaison(f) {
      forceSaison = f;
      versionForce++;
      map.triggerRepaint();
    },
    /** Le lieu dont le modèle est sous ce point de l'écran (pour ouvrir sa fiche d'un appui sur le modèle). Un objet
     *  posé près d'un lieu (decors) passe avant : son auClic est appelé, et aucun lieu ne s'ouvre. */
    lieuSous(point) {
      const d = decorSous(point);
      if (d >= 0) { decors.auClic?.(d); return null; }
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
