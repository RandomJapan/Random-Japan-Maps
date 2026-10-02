// ================================================================
//  Les noms des 8 grandes régions et des 47 préfectures, écrits sur la carte quand on zoome :
//  d'abord les régions, puis, plus près, les préfectures.
//  Les frontières elles-mêmes sont des couches de la carte (app.js, data/frontieres-japon.geojson,
//  fabriqué par outils/fabriquer_frontieres.py).
// ================================================================
import { PREFECTURES, REGIONS } from './regions.js';

// Zooms où l'on voit chaque niveau de noms [à partir de, jusqu'à]
const ZOOMS_REGIONS = [5.5, 7.4];
const ZOOMS_PREFECTURES = [7.4, 10.5];

// Où écrire le nom de chaque grande région, à l'écart des légendes cachées. Kyūshū et Okinawa ont chacun le leur.
const NOMS_REGIONS = [
  { region: 'hokkaido', ou: [142.5, 42.75] },
  { region: 'tohoku', ou: [140.75, 38.95] },
  { region: 'kanto', ou: [139.4, 36.3] },
  { region: 'chubu', ou: [137.2, 35.8] },
  { region: 'kansai', ou: [135.85, 34.3] },
  { region: 'chugoku', ou: [132.75, 34.85] },
  { region: 'shikoku', ou: [133.35, 33.65] },
  { nom: { en: 'Kyushu', fr: 'Kyūshū', ja: '九州' }, ou: [131.0, 32.35] },
  { nom: { en: 'Okinawa', fr: 'Okinawa', ja: '沖縄' }, ou: [127.85, 26.35] },
];

// Où écrire le nom de chaque préfecture : le point le plus « au cœur » de son contour (donné par
// fabriquer_frontieres.py), déplacé à la main quand une légende cachée ou un voisin s'y trouvait déjà.
const NOMS_PREFECTURES = {
  1: [142.78, 43.42], 2: [141.13, 40.64], 3: [141.25, 39.95], 4: [140.92, 38.59], 5: [140.4, 40.01],
  6: [140.11, 38.6], 7: [140.51, 37.39], 8: [140.15, 36.3], 9: [139.82, 36.73], 10: [138.99, 36.53],
  11: [139.31, 36.02], 12: [140.16, 35.32], 13: [139.45, 35.7], 14: [139.32, 35.42], 15: [139.3, 37.65],
  16: [137.02, 36.6], 17: [136.56, 36.3], 18: [136.26, 35.96], 19: [138.75, 35.9], 20: [138.05, 36.21],
  21: [137.08, 36.01], 22: [138.03, 34.93], 23: [137.27, 35.03], 24: [136.43, 34.44], 25: [136.13, 35.11],
  26: [135.25, 35.22], 27: [135.51, 34.46], 28: [134.76, 35.05], 29: [135.85, 34.2], 30: [135.36, 33.95],
  31: [134.25, 35.38], 32: [132.35, 34.9], 33: [133.3, 34.95], 34: [132.75, 34.6], 35: [131.53, 34.24],
  36: [134.15, 33.85], 37: [133.98, 34.22], 38: [132.93, 33.78], 39: [133.36, 33.62], 40: [130.75, 33.45],
  41: [130.06, 33.28], 42: [129.9, 32.95], 43: [130.85, 32.45], 44: [131.8, 33.05], 45: [131.34, 32.44],
  46: [130.48, 31.89], 47: [127.8, 26.35],
};

/**
 * Pose les noms sur la carte. Ils sont glissés sous le papier vieilli, comme imprimés sur la feuille,
 * donc sous les légendes et les épingles des lieux.
 * Renvoie majLangue(langue), à appeler quand la langue change.
 */
export function brancherNomsRegions(map, maplibregl, { enLangue, reperes }) {
  const carte = map.getContainer();
  const conteneur = map.getCanvasContainer();
  const papier = document.getElementById('papier');
  const noms = [];

  function poser(classe, ou, nom) {
    // MapLibre règle lui-même l'opacité de l'élément du repère : le texte est donc dans un <span>,
    // que le style fait apparaître ou disparaître selon le zoom.
    const el = document.createElement('div');
    el.className = 'nom-terre';
    el.setAttribute('aria-hidden', 'true');
    const texte = document.createElement('span');
    texte.className = classe;
    el.append(texte);
    const repere = new maplibregl.Marker({ element: el, pitchAlignment: 'map', rotationAlignment: 'viewport', opacityWhenCovered: '1' })
      .setLngLat(ou);
    reperes.suivre(repere, { voulu: false, placer: (moi) => { if (papier?.parentNode === conteneur) conteneur.insertBefore(moi, papier); } });
    noms.push({ texte, nom, repere, groupe: classe === 'nom-region' ? 'noms-regions' : 'noms-prefectures' });
  }

  for (const n of NOMS_REGIONS) poser('nom-region', n.ou, n.nom || REGIONS.find((r) => r.cle === n.region).nom);
  // En français, les préfectures gardent leur nom anglais (comme dans le dé)
  for (const [code, ou] of Object.entries(NOMS_PREFECTURES)) poser('nom-prefecture', ou, PREFECTURES[code]);

  // Les noms sont posés sur la carte un peu avant leur plage de zoom (invisibles, pour que le fondu
  // d'entrée se joue) et retirés après le fondu de sortie : hors de leur plage, ils ne coûtent rien.
  const etat = {};
  const garde = {};
  function majZoom() {
    const z = map.getZoom();
    for (const [classe, [de, a]] of [['noms-regions', ZOOMS_REGIONS], ['noms-prefectures', ZOOMS_PREFECTURES]]) {
      const garder = z >= de - 0.35 && z < a + 0.35;
      if (garde[classe] !== garder) {
        garde[classe] = garder;
        for (const n of noms) if (n.groupe === classe) reperes.montrer(n.repere, garder, 700);
      }
      const voir = z >= de && z < a;
      if (etat[classe] !== voir) carte.classList.toggle(classe, (etat[classe] = voir));
    }
  }
  map.on('zoom', majZoom);
  majZoom();

  return {
    majLangue(langue) {
      for (const n of noms) {
        n.texte.lang = langue;
        n.texte.textContent = enLangue(n.nom);
      }
    },
  };
}
