// ================================================================
//  Le socle du relief (2026-10-20). En lançant vite la carte, le propriétaire voyait des morceaux de terre rester
//  couleur mer un moment, puis le relief arriver (« la carte a du mal à charger »). MapLibre ne demande une tuile
//  de relief qu'au moment où elle entre à l'écran ; en attendant, il dessine une tuile parente déjà chargée, mais
//  pour un endroit neuf il n'en a aucune : il n'y a rien sous le relief, on voit le fond (la mer).
//  Le socle : pour les deux sources de relief (le maillage 3D, et les couleurs + l'ombrage), les tuiles du
//  zoom 5 (1 000 km de côté) sous la vue et autour restent chargées. Un endroit neuf montre tout de suite un
//  relief flou, puis il se précise. Ce sont presque toutes celles de la vue de départ : presque rien de plus à
//  télécharger. Elles passent en tête de la liste, pour qu'une tuile du socle qui manque arrive avant les autres.
//  - Mesuré (lancers rapides sur un écran de 2048 × 1024 à 1,25, cache vide) : pendant les lancers les plus
//    rapides, 44 % des tuiles manquaient en moyenne ; plus aucune avec le socle.
//  - Essayés et écartés : un socle 4 niveaux sous la vue (entre 5 et 7) rechargeait tout à chaque palier de
//    zoom (15 % de données en plus) ; au zoom 6, ses tuiles arrivaient parfois trop tard ; télécharger d'avance
//    les tuiles fines là où la caméra va, d'après sa vitesse : 2,3 fois plus de données pour presque rien.
//  Rouage interne de MapLibre 6.11 (version figée) : TileManager._updateRetainedTiles, qui reçoit les tuiles
//  voulues et garde chargées celles qu'il retourne. À revérifier en cas de mise à jour ; sans lui, la carte
//  marche comme avant.
// ================================================================
const ZOOM_SOCLE = 7; // en dessous, la vue est déjà faite de grandes tuiles, chargées dès le départ
const NIVEAU = 5; // le zoom des tuiles du socle
const ENTRE_CALCULS = 100; // ms : MapLibre redemande les tuiles voulues à chaque image d'un mouvement

/**
 * sources : les noms des sources de relief ;
 * tuiles : tuiles-relief.js (pour ne pas demander les tuiles vides du grand large).
 */
export function brancherSocle(map, sources, tuiles) {
  const gestions = sources.map((id) => map.style?.tileManagers?.[id]).filter(Boolean);
  if (!gestions.length || gestions.some((g) => typeof g._updateRetainedTiles !== 'function')) return;

  let socle = [], cle = '', calcul = 0;
  function tuilesDuSocle() {
    if (map.getZoom() < ZOOM_SOCLE) return [];
    const maintenant = performance.now();
    if (maintenant - calcul < ENTRE_CALCULS) return socle;
    calcul = maintenant;
    // les tuiles du socle sous la vue, et leurs 8 voisines : de quoi couvrir un lancer
    const vues = map.coveringTiles({ tileSize: 512, minzoom: NIVEAU, maxzoom: NIVEAU, terrain: map.terrain });
    const n = 2 ** NIVEAU, cles = new Set(), liste = [];
    for (const t of vues) {
      const { x, y } = t.canonical;
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const tx = x + dx, ty = y + dy;
          const k = `${tx}/${ty}`;
          if (tx < 0 || ty < 0 || tx >= n || ty >= n || cles.has(k) || tuiles.estVide(NIVEAU, tx, ty)) continue;
          cles.add(k);
          liste.push(new t.constructor(NIVEAU, 0, NIVEAU, tx, ty));
        }
      }
    }
    const nouvelle = [...cles].sort().join();
    if (nouvelle !== cle) { cle = nouvelle; socle = liste; }
    return socle;
  }

  for (const gestion of gestions) {
    const garder = gestion._updateRetainedTiles;
    gestion._updateRetainedTiles = function (voulues, zoom) {
      let plus = [];
      try { plus = tuilesDuSocle(); } catch { /* sans socle cette fois */ }
      return garder.call(this, plus.length ? plus.concat(voulues) : voulues, zoom); // le socle d'abord
    };
  }
}
