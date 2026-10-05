// ================================================================
//  L'itinéraire des favoris sur la carte : les routes à prendre en trait
//  rouge, le temps de chaque trajet posé sur la carte, et le détail
//  (temps, distance, grandes routes, bateaux) pour le panneau des favoris.
//  Calculé par le serveur OSRM de FOSSGIS (routing.openstreetmap.de) :
//  gratuit, sans clé, avec les données OpenStreetMap. Ses règles : une
//  demande par seconde au plus, pas d'usage intensif, l'attribution et un
//  lien « corriger la carte » affichés (attribution de la source).
// ================================================================

const SERVEUR = 'https://routing.openstreetmap.de/routed-'; // + car | bike | foot
export const MODES = ['car', 'bike', 'foot'];
// OSRM donne 5 km/h aux bateaux sans horaire dans OpenStreetMap (Kagoshima → Naha : 131 h au lieu de ~25 h).
// Ceux-là sont recomptés à la vitesse d'un ferry ordinaire.
const VITESSE_BATEAU = 30; // km/h
const ENTRE_DEMANDES = 1100; // ms : une demande par seconde au plus (règles du serveur)
const ROUGE = '#a8321f', PAPIER = '#f6eedb';
const ATTRIBUTION = 'Itinéraires <a href="https://routing.openstreetmap.de/about.html" target="_blank" rel="noopener">OSRM · FOSSGIS</a>'
  + ' · <a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noopener">Fix the map</a>';

/** Décode une « polyline » (précision 5) en [[lng, lat], …]. */
function decoder(texte) {
  const points = [];
  let i = 0, lat = 0, lng = 0;
  while (i < texte.length) {
    for (const k of [0, 1]) {
      let v = 0, decalage = 0, b;
      do { b = texte.charCodeAt(i++) - 63; v |= (b & 31) << decalage; decalage += 5; } while (b >= 32);
      const d = v & 1 ? ~(v >> 1) : v >> 1;
      if (k === 0) lat += d; else lng += d;
    }
    points.push([lng / 1e5, lat / 1e5]);
  }
  return points;
}

// Distance en km entre deux points [lng, lat] (assez précise à l'échelle d'un trajet)
function km(a, b) {
  const k = Math.cos(((a[1] + b[1]) / 2) * Math.PI / 180);
  return Math.hypot((a[0] - b[0]) * k, a[1] - b[1]) * 111.2;
}

/** Le point à mi-chemin le long d'une ligne. */
function milieu(points) {
  const longueurs = points.slice(1).map((p, i) => km(points[i], p));
  let reste = longueurs.reduce((s, x) => s + x, 0) / 2;
  for (let i = 0; i < longueurs.length; i++) {
    if (reste <= longueurs[i]) {
      const f = longueurs[i] ? reste / longueurs[i] : 0;
      return [points[i][0] + (points[i + 1][0] - points[i][0]) * f, points[i][1] + (points[i + 1][1] - points[i][1]) * f];
    }
    reste -= longueurs[i];
  }
  return points[points.length - 1];
}

/** Durée d'une étape OSRM, en secondes, les bateaux sans horaire recomptés à VITESSE_BATEAU. */
function duree(etape) {
  if (etape.mode !== 'ferry' || !etape.duration || etape.distance < 5000) return etape.duration;
  const vitesse = etape.distance / 1000 / (etape.duration / 3600);
  return vitesse < 6 ? (etape.distance / 1000 / VITESSE_BATEAU) * 3600 : etape.duration;
}

/**
 * Les grandes routes d'un trajet : celles qui en font au moins 15 %, 3 au plus, dans l'ordre du trajet.
 * Chacune : { ref (« E2 », « 2 »…), nom (le nom japonais le plus long sur ce morceau) }.
 */
function grandesRoutes(etapes, total) {
  const routes = new Map();
  etapes.forEach((e, i) => {
    if (e.mode === 'ferry' || !(e.ref || e.name)) return;
    const ref = (e.ref || '').split(';')[0].trim();
    const cle = ref || e.name;
    const r = routes.get(cle) || { ref, rang: i, distance: 0, noms: new Map() };
    r.distance += e.distance;
    if (e.name) r.noms.set(e.name, (r.noms.get(e.name) || 0) + e.distance);
    routes.set(cle, r);
  });
  return [...routes.values()]
    .filter((r) => r.distance >= total * 0.15)
    .sort((a, b) => b.distance - a.distance).slice(0, 3)
    .sort((a, b) => a.rang - b.rang)
    .map((r) => ({ ref: r.ref, nom: [...r.noms].sort((a, b) => b[1] - a[1])[0]?.[0] || '' }));
}

/**
 * Branche l'itinéraire sur la carte.
 * @param reperes - gererReperes(map) : les temps de trajet sont des repères HTML comme les autres
 * @param texteTrajet(trajet) - le texte de l'étiquette d'un trajet sur la carte (« 2 h 05 »)
 */
export function brancherItineraire(map, maplibregl, { reperes, texteTrajet }) {
  const reponses = new Map(); // adresse → réponse du serveur (on ne redemande pas deux fois la même chose)
  let derniere = 0; // heure de la dernière demande
  let etiquettes = []; // repères des temps de trajet

  async function demander(adresse) {
    if (reponses.has(adresse)) return reponses.get(adresse);
    const attente = derniere + ENTRE_DEMANDES - Date.now();
    derniere = Date.now() + Math.max(0, attente);
    if (attente > 0) await new Promise((ok) => setTimeout(ok, attente));
    const r = await fetch(adresse);
    const d = await r.json().catch(() => ({ code: `HTTP ${r.status}` }));
    if (d.code === 'Ok') reponses.set(adresse, d);
    return d;
  }

  const adresse = (points, mode) => `${SERVEUR}${mode}/route/v1/driving/${points.map((l) => `${l.lng.toFixed(5)},${l.lat.toFixed(5)}`).join(';')}`
    + '?overview=false&steps=true&geometries=polyline';

  /**
   * Calcule l'itinéraire qui passe par ces lieux, dans cet ordre.
   * Si le serveur ne trouve pas de route d'un bout à l'autre (une île sans bateau connu), chaque trajet est
   * demandé à part, et ceux qui n'ont pas de route sont tracés tout droit, en pointillés.
   * @returns { mode, trajets: [{ de, a, duree, distance, bateau, routes, sansRoute, horsRoute, ligne }],
   *   duree, distance, bateau, sansRoute, donnees (GeoJSON), bornes }
   */
  async function calculer(lieux, mode) {
    let d = await demander(adresse(lieux, mode));
    let morceaux;
    if (d.code === 'Ok') morceaux = [d];
    else if (d.code === 'NoRoute' && lieux.length > 2) {
      morceaux = [];
      for (let i = 0; i < lieux.length - 1; i++) morceaux.push(await demander(adresse([lieux[i], lieux[i + 1]], mode)));
    } else if (d.code === 'NoRoute') morceaux = [d];
    else throw new Error(`Itinéraire : ${d.code} ${d.message || ''}`);

    const traits = [], trajets = [];
    const accesFaits = new Set(); // un lieu au bout de deux trajets n'a qu'un bout en pointillés
    let i = 0;
    for (const m of morceaux) {
      const legs = m.code === 'Ok' ? m.routes[0].legs : [null];
      legs.forEach((leg, j) => {
        const de = lieux[i], a = lieux[i + 1];
        const trajet = { de, a, duree: 0, distance: 0, bateau: 0, routes: [], sansRoute: !leg, horsRoute: 0, ligne: [] };
        if (!leg) {
          trajet.ligne = [[de.lng, de.lat], [a.lng, a.lat]];
          trajet.distance = km(trajet.ligne[0], trajet.ligne[1]) * 1000;
          traits.push({ type: 'sans-route', points: trajet.ligne });
        } else {
          const points = m.waypoints;
          // Un lieu loin de toute route (sommet, îlot…) : le serveur part de la route la plus proche. Le dernier
          // bout est tracé en pointillés.
          for (const [p, l] of [[points[j], de], [points[j + 1], a]]) {
            if (p.distance > 300 && !accesFaits.has(l)) traits.push({ type: 'acces', points: [p.location, [l.lng, l.lat]] });
            accesFaits.add(l);
          }
          trajet.horsRoute = points[j + 1].distance;
          let courant = null;
          for (const e of leg.steps) {
            const type = e.mode === 'ferry' ? 'bateau' : 'route';
            const pts = decoder(e.geometry);
            trajet.duree += duree(e);
            trajet.distance += e.distance;
            if (type === 'bateau') trajet.bateau += duree(e);
            trajet.ligne.push(...pts);
            if (courant?.type === type) courant.points.push(...pts.slice(1));
            else traits.push(courant = { type, points: pts });
          }
          trajet.routes = grandesRoutes(leg.steps, leg.distance);
        }
        trajets.push(trajet);
        i++;
      });
    }
    const bornes = new maplibregl.LngLatBounds();
    for (const t of traits) for (const p of t.points) bornes.extend(p);
    for (const l of lieux) bornes.extend([l.lng, l.lat]);
    return {
      mode,
      trajets,
      duree: trajets.reduce((s, t) => s + t.duree, 0),
      distance: trajets.reduce((s, t) => s + t.distance, 0),
      bateau: trajets.reduce((s, t) => s + t.bateau, 0),
      sansRoute: trajets.some((t) => t.sansRoute),
      donnees: {
        type: 'FeatureCollection',
        features: traits.filter((t) => t.points.length > 1)
          .map((t) => ({ type: 'Feature', properties: { type: t.type }, geometry: { type: 'LineString', coordinates: t.points } })),
      },
      bornes,
    };
  }

  // ---- Sur la carte
  function ajouterCouches(donnees) {
    if (map.getSource('itineraire')) return map.getSource('itineraire').setData(donnees);
    map.addSource('itineraire', { type: 'geojson', data: donnees, maxzoom: 14, attribution: ATTRIBUTION });
    const dessous = map.getLayer('modeles-3d') ? 'modeles-3d' : undefined; // les modèles 3D passent devant
    const largeur = (a, b, c) => ['interpolate', ['linear'], ['zoom'], 4, a, 10, b, 15, c];
    const est = (...types) => ['in', ['get', 'type'], ['literal', types]];
    // un liseré de papier sous le trait, pour qu'il se lise sur le relief sépia
    map.addLayer({
      id: 'itineraire-fond', type: 'line', source: 'itineraire', filter: est('route', 'bateau'),
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': PAPIER, 'line-opacity': ['match', ['get', 'type'], 'bateau', 0.55, 0.9], 'line-width': largeur(6.5, 9.5, 13) },
    }, dessous);
    map.addLayer({
      id: 'itineraire', type: 'line', source: 'itineraire', filter: est('route'),
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': ROUGE, 'line-width': largeur(3.2, 4.6, 6.5) },
    }, dessous);
    // les bateaux, les bouts sans route et les trajets sans route connue : en pointillés
    map.addLayer({
      id: 'itineraire-pointilles', type: 'line', source: 'itineraire', filter: est('bateau', 'acces', 'sans-route'),
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': ROUGE,
        'line-width': ['interpolate', ['linear'], ['zoom'], ...[[4, 3], [10, 4], [15, 5.5]].flatMap(([z, l]) => [z, ['match', ['get', 'type'], 'acces', 1.8, l]])],
        'line-dasharray': [1, 2],
      },
    }, dessous);
  }

  function enleverCouches() {
    for (const id of ['itineraire-pointilles', 'itineraire', 'itineraire-fond']) if (map.getLayer(id)) map.removeLayer(id);
    if (map.getSource('itineraire')) map.removeSource('itineraire');
  }

  function enleverEtiquettes() {
    for (const m of etiquettes) reperes.oublier(m);
    etiquettes = [];
  }

  /** Les étiquettes qui se chevauchent : on garde celles des plus longs trajets. */
  function eviterChevauchements() {
    const gardees = [];
    for (const m of [...etiquettes].sort((a, b) => b.trajet.duree - a.trajet.duree)) {
      const el = m.getElement();
      if (!el.isConnected) continue;
      const r = el.firstElementChild.getBoundingClientRect();
      const libre = gardees.every((g) => r.right + 4 < g.left || r.left - 4 > g.right || r.bottom + 2 < g.top || r.top - 2 > g.bottom);
      el.classList.toggle('temps-cache', !libre);
      if (libre) gardees.push(r);
    }
  }
  map.on('moveend', () => { if (etiquettes.length) eviterChevauchements(); });

  /** Montre un itinéraire calculé : le trait, puis le temps de chaque trajet au milieu de son chemin. */
  function afficher(it) {
    ajouterCouches(it.donnees);
    enleverEtiquettes();
    for (const trajet of it.trajets) {
      if (trajet.ligne.length < 2) continue;
      const el = document.createElement('div');
      el.className = 'temps-trajet';
      el.innerHTML = `<span>${texteTrajet(trajet, it.mode)}</span>`;
      const m = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(milieu(trajet.ligne));
      m.trajet = trajet;
      reperes.suivre(m);
      etiquettes.push(m);
    }
    map.once('idle', eviterChevauchements);
  }

  function effacer() {
    enleverEtiquettes();
    enleverCouches();
  }

  /** Les textes des étiquettes changent de langue. */
  function retraduire(mode) {
    for (const m of etiquettes) m.getElement().firstElementChild.innerHTML = texteTrajet(m.trajet, mode);
    eviterChevauchements();
  }

  return { calculer, afficher, effacer, retraduire };
}
