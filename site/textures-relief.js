// ================================================================
//  Les textures du relief : moins souvent redessinées (2026-10-24)
//
//  Le relief en 3D est drapé de textures, une par tuile : le relief en couleurs, l'ombrage, les détails de saison,
//  les frontières, les rivières, les côtes… (21 couches). Sur une puce graphique intégrée (Intel Iris Xe du
//  ThinkBook du propriétaire), en redessiner une coûte de 12 à 20 ms : plus qu'une image entière. Sa vidéo montrait
//  18 à 24 images/s dans la vue de loin, au niveau « très légère ». Sur le même parcours, ici : 43 tuiles, 419
//  textures dessinées (jusqu'à 32 fois la même), et des images qui en refaisaient 9 ou 10 d'un coup. Pourquoi :
//  - MapLibre périme la texture sous chaque tuile de données qui arrive (côtes, eaux, frontières, détails de
//    saison, ombrage, relief : six sources, l'une après l'autre après chaque zoom), tout de suite, autant de fois ;
//  - il refait aussi les textures dont les tuiles de données ont changé, une par image, même en plein mouvement ;
//  - ajouter une couche, même dessinée hors des textures (les modèles 3D, au premier zoom à 7), ou passer le zoom
//    d'une couche de symboles (les feuilles au sol, à 10,5 : à l'arrivée sur un lieu), les refait toutes d'un coup ;
//  - il redessine à chaque image une « profondeur » du relief qui ne sert qu'aux symboles et aux cercles.
//  Ici :
//  - les tuiles à refaire après une arrivée de données attendent CALME_DONNEES ms sans nouvelle arrivée (au plus
//    ATTENTE_DONNEES), puis leur tour : au plus une par image en mouvement, deux au repos (l'ancienne texture reste
//    affichée en attendant) ;
//  - en mouvement, une même texture n'est refaite pour des tuiles de données changées qu'une fois par
//    ENTRE_REFONTES ms ;
//  - un changement de style ne refait les textures que si une couche dessinée dedans (ou une image) a changé ; un
//    changement de couches visibles qui ne touche que des couches hors des textures ne les refait pas, et celui d'une
//    couche qui entre ou sort de ses zooms (les détails de saison, à 6) les refait une par image à l'arrêt, comme un
//    simple changement de zoom, au lieu de toutes dans la même image ;
//  - la profondeur n'est dessinée que quand une couche de symboles ou de cercles est visible.
//  Rouages internes de MapLibre 6.11 (version figée dans les adresses) : Map._handleTerrainDataEvent,
//  TerrainTileManager (_tiles, releaseRTT), Tile.rttObjects, RenderToTexture (_rttFingerprints,
//  _textureDifference, needsFollowUpFrame), RTTFingerprint (_tileKeys, _zoom, _visibleLayerIds),
//  Painter.maybeDrawDepth / terrainFacilitator. À revérifier en cas de mise à jour ; si l'un manque, rien n'est
//  changé.
// ================================================================

const PAR_IMAGE_MOUVEMENT = 1; // tuiles refaites par image après des arrivées de données, en mouvement…
const PAR_IMAGE_REPOS = 2; // … et au repos
const CALME_DONNEES = 150; // ms sans nouvelle donnée pour une tuile avant de la refaire…
const ATTENTE_DONNEES = 600; // … mais pas plus longtemps après la première
const ENTRE_REFONTES = 400; // ms : en mouvement, une même texture n'est pas refaite plus souvent pour ses données
const DIFFERENCES = ['none', 'zoom', 'sourceTiles', 'visibleLayers', 'revision']; // de MapLibre, du moins au plus grave
const DANS_LES_TEXTURES = new Set(['background', 'fill', 'line', 'raster', 'hillshade', 'color-relief']);
const AVEC_PROFONDEUR = new Set(['symbol', 'circle']);

export function brancherTexturesRelief(map) {
  const painter = map.painter;
  const rtt = painter?.renderToTexture;
  const tuiles = () => map.terrain?.tileManager; // celles du relief en cours (un nouveau relief en refait d'autres)
  if (typeof map._handleTerrainDataEvent !== 'function' || !rtt || !tuiles()?._tiles || typeof tuiles().releaseRTT !== 'function') return;
  const enMouvement = () => painter.options?.moving || map.isMoving();

  // ---- Les arrivées de données : les tuiles du relief concernées attendent leur tour
  const attente = new Map(); // clé de la tuile du relief → { premiere, derniere } (arrivées de données)
  let relance = 0;
  const mettreEnAttente = (tileID) => {
    const tm = tuiles(), t0 = performance.now();
    for (const cle in tm?._tiles) {
      const t = tm._tiles[cle];
      if (!t.rttObjects?.length || !(t.tileID.equals(tileID) || t.tileID.isChildOf(tileID) || tileID.isChildOf(t.tileID))) continue;
      const a = attente.get(cle);
      if (a) a.derniere = t0;
      else attente.set(cle, { premiere: t0, derniere: t0 });
    }
    if (attente.size && !relance) relance = setTimeout(() => { relance = 0; map.triggerRepaint(); }, CALME_DONNEES);
  };
  map.on('render', () => {
    if (!attente.size) return;
    let reste = enMouvement() ? PAR_IMAGE_MOUVEMENT : PAR_IMAGE_REPOS;
    const tm = tuiles(), t0 = performance.now();
    for (const [cle, a] of attente) {
      if (t0 - a.derniere < CALME_DONNEES && t0 - a.premiere < ATTENTE_DONNEES) continue;
      attente.delete(cle);
      const t = tm?._tiles[cle];
      if (t?.rttObjects?.length) {
        t.releaseRTT(painter);
        if (--reste <= 0) break;
      }
    }
    if (attente.size && !relance) relance = setTimeout(() => { relance = 0; map.triggerRepaint(); }, 50);
  });

  // ---- Un changement de style : les textures ne sont refaites que si ce qu'elles dessinent a changé
  const signature = () => {
    const style = map.style;
    const couches = style._order.map((id) => style._layers[id]).filter((l) => DANS_LES_TEXTURES.has(l?.type)).map((l) => l.serialize());
    return JSON.stringify([couches, map.listImages?.()]);
  };
  let derniereSignature = null;

  const surDonnees = map._handleTerrainDataEvent;
  map._handleTerrainDataEvent = function (e, ...reste) {
    if (e.dataType === 'style') {
      let s = null;
      try { s = signature(); } catch { /* MapLibre a changé : comme avant */ }
      if (s !== null && s === derniereSignature) return undefined;
      derniereSignature = s;
      return surDonnees.call(this, e, ...reste);
    }
    const tm = tuiles();
    if (!e.tile || !tm) return surDonnees.call(this, e, ...reste);
    // le reste (altitudes, profondeur, caméra) tout de suite ; la texture, à son tour
    const propre = Object.prototype.hasOwnProperty.call(tm, 'releaseRTT');
    const avant = tm.releaseRTT;
    tm.releaseRTT = mettreEnAttente;
    try {
      return surDonnees.call(this, e, ...reste);
    } finally {
      if (propre) tm.releaseRTT = avant;
      else delete tm.releaseRTT;
    }
  };

  // ---- Les différences d'empreinte : sans refonte d'un coup pour des couches hors des textures, et pas trop souvent
  const proto = Object.getPrototypeOf(rtt);
  const difference = proto._textureDifference;
  const memesCouches = new Map(); // « couches visibles avant | maintenant » → les mêmes dans les textures ?
  const dansTextures = (ids) => ids.split(',').filter((id) => {
    const l = map.style?._layers[id];
    return !l || DANS_LES_TEXTURES.has(l.type); // une couche retirée depuis : on la compte
  });
  // les couches des textures qui diffèrent sont-elles toutes entrées ou sorties de leurs zooms entre les deux ?
  const parLeZoom = (avant, ici) => {
    const a = new Set(dansTextures(avant._visibleLayerIds)), b = new Set(dansTextures(ici._visibleLayerIds));
    const bas = Math.min(avant._zoom, ici._zoom), haut = Math.max(avant._zoom, ici._zoom);
    const entre = (z) => typeof z === 'number' && z > bas && z <= haut;
    for (const id of new Set([...a, ...b])) {
      if (a.has(id) === b.has(id)) continue;
      const l = map.style?._layers[id];
      if (!l || !(entre(l.minzoom) || entre(l.maxzoom))) return false;
    }
    return true;
  };
  if (typeof difference === 'function') {
    proto._textureDifference = function (tile) {
      if (!this._rttFingerprints || !tile.rttFingerprint) return difference.call(this, tile);
      let pire = 'none';
      for (const source in this._rttFingerprints) {
        const ici = this._rttFingerprints[source][tile.tileID.key];
        if (!ici) continue;
        const avant = tile.rttFingerprint[source];
        let d = ici.difference(avant);
        if (d === 'visibleLayers') {
          const cle = `${avant._visibleLayerIds}|${ici._visibleLayerIds}`;
          if (!memesCouches.has(cle)) {
            if (memesCouches.size > 200) memesCouches.clear();
            memesCouches.set(cle, dansTextures(avant._visibleLayerIds).join() === dansTextures(ici._visibleLayerIds).join());
          }
          if (memesCouches.get(cle)) d = ici._tileKeys !== avant._tileKeys ? 'sourceTiles' : ici._zoom === avant._zoom ? 'none' : 'zoom';
          else if (parLeZoom(avant, ici)) d = ici._tileKeys !== avant._tileKeys ? 'sourceTiles' : 'zoom';
        }
        if (d === 'sourceTiles' && enMouvement() && performance.now() - (tile.refonteDonnees || 0) < ENTRE_REFONTES) {
          this.needsFollowUpFrame = true;
          d = 'none';
        }
        if (DIFFERENCES.indexOf(d) > DIFFERENCES.indexOf(pire)) pire = d;
      }
      if (pire === 'sourceTiles') tile.refonteDonnees = performance.now();
      return pire;
    };
  }

  // ---- La profondeur du relief : seulement si une couche la lit
  const profondeur = painter.maybeDrawDepth;
  if (typeof profondeur === 'function' && painter.terrainFacilitator) {
    painter.maybeDrawDepth = function (...a) {
      const style = this.style, z = this.transform?.zoom;
      const utile = !style?._order || style._order.some((id) => {
        const l = style._layers[id];
        return AVEC_PROFONDEUR.has(l?.type) && !l.isHidden(z);
      });
      if (!utile) {
        this.terrainFacilitator.depthDirty = true; // à redessiner dès qu'une couche en aura besoin
        return undefined;
      }
      return profondeur.apply(this, a);
    };
  }
}
