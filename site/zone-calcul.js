// ================================================================
//  La zone du Japon, en coulisse (un « worker » : la carte ne s'arrête pas pendant le calcul).
//  Il lit data/zone-japon.png, renvoie à la page la grille qui classe les tuiles, puis met à 0 m le relief hors de
//  la zone dans les tuiles qu'elle lui envoie (zone-japon.js).
// ================================================================
import { lireZone, masquer } from './zone-japon.js';

const toile = (l, h) => new OffscreenCanvas(l, h);
let zone = null;

self.onmessage = async (e) => {
  const m = e.data;
  if (m.type === 'zone') {
    try {
      const lu = await lireZone(m.adresse, toile);
      zone = lu.zone;
      self.postMessage({ type: 'zone', grille: lu.grille });
    } catch (err) {
      self.postMessage({ type: 'zone', erreur: String(err) });
    }
    return;
  }
  let octets = null, erreur = null;
  try {
    if (zone) octets = await masquer(zone, m.z, m.x, m.y, m.octets, toile);
  } catch (err) {
    erreur = String(err);
  }
  self.postMessage({ type: 'tuile', id: m.id, octets, erreur }, octets ? [octets] : []);
};
