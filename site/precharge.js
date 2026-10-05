// ================================================================
//  Plongeon préparé d'avance : avant que la caméra plonge (ou vole d'un point à un autre), on
//  télécharge les tuiles de relief qu'elle verra pendant le vol, et on lit l'altitude du lieu.
//  - Sans ça, une centaine de tuiles arrivaient pendant les 2 à 3 s de la descente : le relief se
//    précisait par à-coups sous la caméra, surtout en montagne.
//  - Les tuiles sont seulement téléchargées : le cache du navigateur les garde, et MapLibre les
//    reçoit tout de suite quand il les demande pendant le vol.
//  - Le trajet est celui du flyTo de MapLibre, recalculé sur une copie de la caméra (internes de
//    MapLibre 6.11, version figée dans index.html). Si ces internes changent, on ne précharge que
//    l'altitude, et le plongeon marche quand même.
// ================================================================
const RHO = 1.42; // la courbure du flyTo de MapLibre (sa valeur par défaut)
const EN_PARALLELE = 8;

/**
 * source : la source de relief (tileSize, maxzoom, encodage terrarium) ;
 * tuiles : tuiles-relief.js (la vraie adresse d'une tuile, et les tuiles vides du grand large, à ne pas demander).
 * Renvoie preparer(depart, arrivee, hauteur) → Promise de { altitude, altitudeDepart, tuiles } (une seule
 * fois par vol) :
 *   depart : la caméra au départ { center, zoom, pitch, bearing, padding } ;
 *   arrivee : les options du flyTo { center, zoom, pitch, bearing, padding, minZoom } ;
 *   hauteur(altitude, altitudeDepart) → ((zoom, centre) → hauteur du centre de la vue pendant le vol), ou null.
 */
export function brancherPrecharge(map, maplibregl, source, tuiles) {
  const vols = new Map(); // clé → Promise

  function preparer(depart, arrivee, hauteur) {
    const cle = JSON.stringify([depart, arrivee, map.getCanvas().clientWidth, map.getCanvas().clientHeight]);
    if (!vols.has(cle)) {
      if (vols.size > 8) vols.clear();
      vols.set(cle, lancer(depart, arrivee, hauteur));
    }
    return vols.get(cle);
  }

  async function lancer(depart, arrivee, hauteur) {
    await tuiles.pret;
    const [alt, altDepart] = await Promise.all([altitude(...arrivee.center), altitude(...depart.center)]);
    let adresses = [];
    try {
      adresses = tuilesDuVol(depart, arrivee, alt == null || !hauteur ? null : hauteur(alt, altDepart));
    } catch (e) {
      console.warn('Préchargement du plongeon impossible', e);
    }
    await telecharger(adresses);
    return { altitude: alt, altitudeDepart: altDepart, tuiles: adresses.length };
  }

  /**
   * L'altitude réelle du sol (m), lue dans la tuile de relief la plus précise (encodage terrarium,
   * entre les 4 pixels voisins). 0 sans tuile (le large) ; null si on n'a pas pu la lire.
   */
  async function altitude(lng, lat) {
    try {
      const z = source.maxzoom, n = 2 ** z;
      const x = ((lng + 180) / 360) * n;
      const y = ((1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) / 2) * n;
      const tx = Math.floor(x), ty = Math.floor(y);
      if (tuiles.estVide(z, tx, ty)) return 0; // Mapterhorn n'a pas de tuile au grand large
      const r = await fetch(tuiles.adresse(z, tx, ty));
      if (r.status === 404) {
        tuiles.noterVide(z, tx, ty);
        return 0;
      }
      if (!r.ok) return null;
      const image = await createImageBitmap(await r.blob(), { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
      const toile = document.createElement('canvas');
      toile.width = image.width;
      toile.height = image.height;
      const c = toile.getContext('2d', { willReadFrequently: true });
      c.drawImage(image, 0, 0);
      const px = (x - tx) * image.width - 0.5, py = (y - ty) * image.height - 0.5;
      const x0 = Math.min(Math.max(Math.floor(px), 0), image.width - 2);
      const y0 = Math.min(Math.max(Math.floor(py), 0), image.height - 2);
      const d = c.getImageData(x0, y0, 2, 2).data;
      const h = (i) => d[i] * 256 + d[i + 1] + d[i + 2] / 256 - 32768;
      const fx = Math.min(Math.max(px - x0, 0), 1), fy = Math.min(Math.max(py - y0, 0), 1);
      return (h(0) * (1 - fx) + h(4) * fx) * (1 - fy) + (h(8) * (1 - fx) + h(12) * fx) * fy;
    } catch {
      return null;
    }
  }

  /**
   * Les tuiles de relief que MapLibre demandera pendant le flyTo : on rejoue son trajet (même calcul
   * que Camera.flyTo) sur une copie de la caméra, et on demande à chaque pas les tuiles qui couvrent
   * la vue, pour le relief dessiné (tuiles de 512) et pour le maillage 3D (MapLibre les prend un
   * niveau plus bas : tuiles de 1024).
   */
  function tuilesDuVol(depart, arrivee, hauteur, pas = 48) {
    const { LngLat, Point } = maplibregl;
    const tr = map._camera.transform.clone();
    tr.setPadding(depart.padding);
    tr.setBearing(depart.bearing);
    tr.setPitch(depart.pitch);
    tr.setZoom(depart.zoom);
    tr.setCenter(LngLat.convert(depart.center));
    tr.setElevation(0);
    const zoom0 = tr.zoom, cap0 = tr.bearing, incl0 = tr.pitch, marge0 = { ...tr.padding };
    const vol = map._camera.cameraHelper.handleFlyTo(tr, {
      bearing: arrivee.bearing, pitch: arrivee.pitch, roll: tr.roll, padding: arrivee.padding,
      locationAtOffset: tr.screenPointToLocation(tr.centerPoint), offsetAsPoint: new Point(0, 0),
      center: LngLat.convert(arrivee.center), minZoom: arrivee.minZoom, zoom: arrivee.zoom,
    });
    // la courbe de van Wijk et Nuij, comme dans Camera.flyTo
    const w0 = Math.max(tr.width, tr.height), w1 = w0 / vol.scaleOfZoom, u1 = vol.pixelPathLength;
    const rho = Math.min(RHO, Math.sqrt(((w0 / vol.scaleOfMinZoom) / u1) * 2)), rho2 = rho * rho;
    const facteur = (descente) => {
      const b = (w1 * w1 - w0 * w0 + (descente ? -1 : 1) * rho2 * rho2 * u1 * u1) / (2 * (descente ? w1 : w0) * rho2 * u1);
      return Math.log(Math.sqrt(b * b + 1) - b);
    };
    const r0 = facteur(false);
    let w = (s) => Math.cosh(r0) / Math.cosh(r0 + rho * s);
    let u = (s) => (w0 * ((Math.cosh(r0) * Math.tanh(r0 + rho * s) - Math.sinh(r0)) / rho2)) / u1;
    let S = (facteur(true) - r0) / rho;
    if (Math.abs(u1) < 2e-6 || !Number.isFinite(S)) {
      const sens = w1 < w0 ? -1 : 1;
      S = Math.abs(Math.log(w1 / w0)) / rho;
      u = () => 0;
      w = (s) => Math.exp(sens * rho * s);
    }
    const options = [source.tileSize, source.tileSize * 2].map((tileSize) => ({
      tileSize, minzoom: 0, maxzoom: source.maxzoom, terrain: map.terrain,
    }));
    const camera = { _camera: { transform: tr } }; // map.coveringTiles ne lit que this._camera.transform
    const adresses = new Set();
    const ajouter = (z, x, y) => { if (!tuiles.estVide(z, x, y)) adresses.add(tuiles.adresse(z, x, y)); };
    const couvrir = () => {
      for (const o of options) {
        for (const { canonical: c } of map.coveringTiles.call(camera, o)) {
          ajouter(c.z, c.x, c.y);
          // le maillage 3D demande aussi le parent et l'ancêtre au zoom 5 (TileManager._addTerrainIdealTiles)
          if (o.tileSize > source.tileSize && c.z > 0) {
            ajouter(c.z - 1, c.x >> 1, c.y >> 1);
            const d = c.z - Math.min(c.z, 5);
            ajouter(c.z - d, c.x >> d, c.y >> d);
          }
        }
      }
    };
    for (let i = 0; i <= pas; i++) {
      const k = i / pas, s = k * S;
      tr.setBearing(cap0 + (arrivee.bearing - cap0) * k);
      tr.setPitch(incl0 + (arrivee.pitch - incl0) * k);
      tr.interpolatePadding(marge0, arrivee.padding, k);
      vol.easeFunc(k, 1 / w(s), u(s), tr.centerPoint);
      if (hauteur) tr.setElevation(hauteur(tr.zoom, tr.center));
      couvrir();
    }
    // le début de l'orbite autour du lieu, après l'arrivée (ce qu'on garde d'une prise)
    for (const plus of [15, 30, 45, 60, 90]) {
      tr.setBearing(arrivee.bearing + plus);
      couvrir();
    }
    return [...adresses]; // dans l'ordre du vol : les premières servent en premier
  }

  /** Télécharge les tuiles (8 à la fois), sans les garder : le cache du navigateur s'en charge. */
  async function telecharger(adresses) {
    let i = 0;
    const suivante = async () => {
      while (i < adresses.length) {
        const a = adresses[i++];
        try {
          const r = await fetch(a);
          if (r.status === 404) tuiles.noterVide(...a.match(/(\d+)\/(\d+)\/(\d+)\.webp$/).slice(1).map(Number));
          else await r.arrayBuffer();
        } catch {
          // tant pis : MapLibre la redemandera pendant le vol
        }
      }
    };
    await Promise.all(Array.from({ length: EN_PARALLELE }, suivante));
  }

  return preparer;
}
