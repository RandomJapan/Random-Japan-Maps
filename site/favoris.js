// ================================================================
//  Favoris : les lieux mis de côté avec le cœur de la fiche, gardés dans ce navigateur.
//  Aussi l'ordre de voyage (pour l'itinéraire Google Maps et la visite guidée).
// ================================================================

const MEMOIRE = 'favoris';

/** Les identifiants des lieux favoris (un Set). Vide si le navigateur ne garde rien. */
export function lireFavoris() {
  try {
    const liste = JSON.parse(localStorage.getItem(MEMOIRE) || '[]');
    return new Set(Array.isArray(liste) ? liste.filter((x) => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

export function ecrireFavoris(favoris) {
  try { localStorage.setItem(MEMOIRE, JSON.stringify([...favoris])); } catch { /* navigation privée : tant pis */ }
}

// Distance en km (assez précise à l'échelle du Japon)
function distance(a, b) {
  const k = Math.cos(((a.lat + b.lat) / 2) * Math.PI / 180);
  return Math.hypot((a.lng - b.lng) * k, a.lat - b.lat) * 111.2;
}

/**
 * Range des lieux dans un ordre de voyage : on part du plus au sud-ouest (le Japon est un arc du
 * sud-ouest au nord-est), on va toujours au plus proche, puis on décroise le trajet (2-opt).
 */
export function ordreDeVoyage(liste) {
  if (liste.length < 3) return [...liste].sort((a, b) => a.lng + a.lat - (b.lng + b.lat));
  const reste = [...liste];
  const depart = reste.reduce((m, l, i) => (l.lng + l.lat < reste[m].lng + reste[m].lat ? i : m), 0);
  const ordre = reste.splice(depart, 1);
  while (reste.length) {
    const dernier = ordre[ordre.length - 1];
    let proche = 0;
    reste.forEach((l, i) => { if (distance(dernier, l) < distance(dernier, reste[proche])) proche = i; });
    ordre.push(...reste.splice(proche, 1));
  }
  // 2-opt : retourner un morceau du trajet quand ça le raccourcit (le départ reste le même)
  for (let passe = 0, mieux = true; mieux && passe < 30; passe++) {
    mieux = false;
    for (let i = 1; i < ordre.length - 1; i++) {
      for (let j = i + 1; j < ordre.length; j++) {
        const avant = distance(ordre[i - 1], ordre[i]) + (j + 1 < ordre.length ? distance(ordre[j], ordre[j + 1]) : 0);
        const apres = distance(ordre[i - 1], ordre[j]) + (j + 1 < ordre.length ? distance(ordre[i], ordre[j + 1]) : 0);
        if (apres < avant - 0.01) {
          ordre.splice(i, j - i + 1, ...ordre.slice(i, j + 1).reverse());
          mieux = true;
        }
      }
    }
  }
  return ordre;
}

/**
 * Liens d'itinéraire Google Maps pour une liste déjà rangée. Google n'accepte qu'un nombre limité
 * d'étapes (3 sur un navigateur de téléphone, 9 ailleurs) : au-delà, le voyage est coupé en
 * plusieurs itinéraires, chacun repartant du dernier lieu du précédent.
 * Renvoie [{ de, a, url }] (de et a : numéros des lieux, à partir de 1).
 */
export function liensItineraire(liste, parItineraire) {
  const point = (l) => `${l.lat},${l.lng}`;
  if (liste.length === 1) {
    return [{ de: 1, a: 1, url: `https://www.google.com/maps/dir/?api=1&destination=${point(liste[0])}` }];
  }
  const liens = [];
  for (let i = 0; i < liste.length - 1; i += parItineraire - 1) {
    const morceau = liste.slice(i, i + parItineraire);
    const url = new URL('https://www.google.com/maps/dir/');
    url.searchParams.set('api', '1');
    url.searchParams.set('origin', point(morceau[0]));
    url.searchParams.set('destination', point(morceau[morceau.length - 1]));
    if (morceau.length > 2) url.searchParams.set('waypoints', morceau.slice(1, -1).map(point).join('|'));
    url.searchParams.set('travelmode', 'driving');
    liens.push({ de: i + 1, a: i + morceau.length, url: url.href });
  }
  return liens;
}
