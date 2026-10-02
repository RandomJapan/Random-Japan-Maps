// ================================================================
//  Les repères HTML posés sur la carte (lieux, noms des mers, des régions
//  et des préfectures, légendes, bêtes de la mer) ne restent sur la carte
//  que s'ils sont près de l'écran et censés se voir.
//  Pourquoi : MapLibre replace chaque repère à chaque image. Avec le relief,
//  pour un repère hors de l'écran, il cherche l'altitude en recalculant les
//  tuiles qui couvrent tout l'écran, une fois par repère : zoomé sur une
//  région, c'était ~190 recherches par image, et les téléphones saccadaient.
// ================================================================

const MARGE = 0.1; // un repère reste sur la carte jusqu'à 10 % de la taille de la vue au-delà de ses bords (penchée, la vue en couvre déjà plus que l'écran)

/**
 * @returns suivre(repère, { voulu, placer }) pour confier un repère (pas encore ajouté à la carte) ;
 *   montrer(repère, voulu, delai) pour le montrer ou le cacher (catégorie décochée, zoom hors de sa plage…),
 *   le retrait pouvant attendre `delai` ms (le temps d'un fondu) ;
 *   verifier(repère) après un setLngLat ; oublier(repère) pour le retirer pour de bon.
 */
export function gererReperes(map) {
  const suivis = new Map(); // repère → { voulu, placer, sur, minuterie }
  let bornes = null; // [ouest, sud, est, nord], marge comprise

  function majBornes() {
    const b = map.getBounds();
    const dx = (b.getEast() - b.getWest()) * MARGE;
    const dy = (b.getNorth() - b.getSouth()) * MARGE;
    bornes = [b.getWest() - dx, b.getSouth() - dy, b.getEast() + dx, b.getNorth() + dy];
  }

  function appliquer(repere, s) {
    const { lng, lat } = repere.getLngLat();
    const doit = s.voulu && lng >= bornes[0] && lng <= bornes[2] && lat >= bornes[1] && lat <= bornes[3];
    if (doit === s.sur) return;
    s.sur = doit;
    if (doit) {
      repere.addTo(map);
      s.placer?.(repere.getElement()); // MapLibre l'ajoute à la fin : on le remet à sa place parmi les autres
    } else {
      repere.remove();
    }
  }

  function tout() {
    majBornes();
    for (const [repere, s] of suivis) appliquer(repere, s);
  }
  map.on('move', tout);
  map.on('resize', tout);

  return {
    suivre(repere, { voulu = true, placer } = {}) {
      if (!bornes) majBornes();
      const s = { voulu, placer, sur: false, minuterie: null };
      suivis.set(repere, s);
      appliquer(repere, s);
    },
    montrer(repere, voulu, delai = 0) {
      const s = suivis.get(repere);
      if (!s) return;
      clearTimeout(s.minuterie);
      if (!voulu && delai && s.sur) {
        s.minuterie = setTimeout(() => { s.voulu = false; appliquer(repere, s); }, delai);
        return;
      }
      s.voulu = voulu;
      appliquer(repere, s);
    },
    verifier(repere) {
      const s = suivis.get(repere);
      if (s) appliquer(repere, s);
    },
    oublier(repere) {
      const s = suivis.get(repere);
      if (!s) return;
      clearTimeout(s.minuterie);
      if (s.sur) repere.remove();
      suivis.delete(repere);
    },
  };
}
