// ================================================================
//  Fonctionnement de la carte 3D « Random Japan Place ».
//  Les lieux viennent du tableau Google Sheets (voir config.js).
// ================================================================
import * as maplibregl from 'https://cdn.jsdelivr.net/npm/maplibre-gl@6.11.2/dist/maplibre-gl.mjs';
import { CONFIG, TEXTES } from './config.js';
import { iconeHTML } from './icons.js';
import { PREFECTURES, REGIONS, chargerPrefectures, regionDe } from './regions.js';
import { brancherModeles } from './couche3d.js';
import { animerMer } from './mer.js';
import { brancherNomsRegions } from './noms-regions.js';

const $ = (id) => document.getElementById(id);
const estTelephone = () => matchMedia('(max-width: 720px)').matches;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const SVG = {
  coche: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  lecture: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 5.5v13a1 1 0 0 0 1.5.9l10.5-6.5a1 1 0 0 0 0-1.8L9.5 4.6A1 1 0 0 0 8 5.5Z"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M16.6 3c.4 2.1 1.8 3.6 4 3.9v3.2c-1.5 0-2.9-.4-4-1.2v6.3a6 6 0 1 1-6-6h.6v3.3a2.8 2.8 0 1 0 2.2 2.7V3Z"/></svg>',
  route: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5" fill="currentColor"/></svg>',
  lien: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M10 14a4 4 0 0 0 5.7 0l3.5-3.5a4 4 0 0 0-5.7-5.7L12 6.3M14 10a4 4 0 0 0-5.7 0l-3.5 3.5a4 4 0 0 0 5.7 5.7l1.5-1.5"/></svg>',
  sortie: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M14 5h5v5M19 5l-8 8M17 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h4"/></svg>',
  partager: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>',
  de: '<svg class="de" viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="8.5" cy="8.5" r="1.6" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.6" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.6" fill="currentColor"/></svg>',
  chevron: '<svg class="chevron-cat" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6"/></svg>',
};
// Couleurs de secours (catégorie inconnue de l'onglet Catégories) ; la carte les vieillit vers le sépia
const PALETTE = ['#c23b27', '#3b5b92', '#5f7f3a', '#c8912a', '#7b4a8c', '#2f7d7a', '#8a5a3b', '#b3486b', '#4a5d7e', '#6f8f3e'];
// En dessous de ce zoom (tout le Japon), les lieux sont de petits points : on voit le relief
const ZOOM_POINTS = 6.2;

// ---------------------------------------------------------------- Langue
const LANGUES = ['en', 'fr', 'ja'];
let langue = choisirLangue();

function choisirLangue() {
  try {
    const memo = localStorage.getItem('langue');
    if (LANGUES.includes(memo)) return memo;
  } catch { /* navigation privée : pas grave */ }
  const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
  return LANGUES.includes(nav) ? nav : 'en';
}
function t(cle, ...args) {
  const v = TEXTES[langue][cle] ?? TEXTES.en[cle];
  return typeof v === 'function' ? v(...args) : v;
}
/** Choisit le texte dans la langue affichée ; sinon l'anglais. */
const enLangue = (textes) => textes?.[langue] || textes?.en || '';

// ---------------------------------------------------------------- Lecture du tableau (CSV)
const normaliser = (s) => String(s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
  .replace(/[^a-z0-9぀-ヿ一-鿿]/g, '');

function nettoyer(v) {
  const s = String(v ?? '').trim();
  return /^(#(ERROR|VALUE|N\/A|REF|NAME)|Loading|Chargement)/i.test(s) ? '' : s;
}

function lireCSV(texte) {
  const lignes = [];
  let ligne = [], champ = '', guillemets = false;
  for (let i = 0; i < texte.length; i++) {
    const c = texte[i];
    if (guillemets) {
      if (c === '"') {
        if (texte[i + 1] === '"') { champ += '"'; i++; } else guillemets = false;
      } else champ += c;
    } else if (c === '"') guillemets = true;
    else if (c === ',') { ligne.push(champ); champ = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texte[i + 1] === '\n') i++;
      ligne.push(champ); lignes.push(ligne); ligne = []; champ = '';
    } else champ += c;
  }
  if (champ !== '' || ligne.length) { ligne.push(champ); lignes.push(ligne); }
  const [entetes, ...reste] = lignes.filter((l) => l.some((x) => x.trim() !== ''));
  if (!entetes) return [];
  const cles = entetes.map(normaliser);
  return reste.map((l) => Object.fromEntries(cles.map((k, i) => [k, nettoyer(l[i])])));
}

/** Lit une colonne en acceptant plusieurs noms possibles. */
function champ(ligne, noms) {
  for (const n of noms) if (ligne[n]) return ligne[n];
  return '';
}

async function chargerCSV(url, secours) {
  if (url) {
    try {
      const r = await fetch(url, { cache: 'no-store' });
      const texte = r.ok ? await r.text() : '';
      if (texte && !texte.trimStart().startsWith('<')) {
        const lignes = lireCSV(texte);
        if (lignes.length) return lignes;
      }
    } catch (e) {
      console.warn('Tableau Google indisponible, copie de secours utilisée.', e);
    }
  }
  const r = await fetch(secours);
  return lireCSV(await r.text());
}

// ---------------------------------------------------------------- Lieux & catégories
function lireGPS(brut) {
  let s = String(brut || '');
  if (!s.includes('.') && /\d,\d/.test(s)) s = s.replace(/(\d),(\d)/g, '$1.$2');
  const n = s.match(/-?\d+(?:\.\d+)?/g);
  if (!n || n.length < 2) return null;
  let [lat, lng] = n.slice(0, 2).map(Number);
  if (Math.abs(lat) > 90) [lat, lng] = [lng, lat]; // collé à l'envers (longitude, latitude)
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

function slug(texte) {
  return String(texte).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function construireLieux(lignes) {
  const ids = new Set();
  const lieux = [];
  lignes.forEach((r, i) => {
    const nomEn = champ(r, ['nomen', 'nom', 'name', 'nameen']);
    const gps = lireGPS(champ(r, ['coordonneesgps', 'coordonnees', 'gps', 'coordinates']));
    if (!nomEn || !gps) return;
    if (/^(non|no|false|faux|0|いいえ)$/i.test(champ(r, ['afficher', 'visible', 'show']))) return;
    let id = slug(nomEn) || `lieu-${i + 1}`;
    while (ids.has(id)) id += '-2';
    ids.add(id);
    lieux.push({
      id,
      ...gps,
      nom: { en: nomEn, fr: champ(r, ['nomfr']), ja: champ(r, ['nom日本語', 'nomja', 'nomjp', 'nomjaponais']) },
      categorie: champ(r, ['categorie', 'category']) || 'Other',
      tiktok: champ(r, ['lientiktok', 'tiktok']),
      description: {
        en: champ(r, ['descriptionen', 'description']),
        fr: champ(r, ['descriptionfr']),
        ja: champ(r, ['description日本語', 'descriptionja', 'descriptionjp']),
      },
      photo: champ(r, ['photo', 'image']),
      autreLien: champ(r, ['autrelien', 'lien', 'link']),
    });
  });
  return lieux;
}

function couleurValide(c) {
  const s = String(c || '').trim();
  if (/^#?[0-9a-f]{6}$/i.test(s)) return s.startsWith('#') ? s : `#${s}`;
  return '';
}

function construireCategories(lignes, lieux) {
  const cats = new Map();
  lignes.forEach((r, i) => {
    const cle = champ(r, ['categorie', 'category']);
    if (!cle) return;
    cats.set(cle.toLowerCase(), {
      cle,
      icone: champ(r, ['icone', 'icon']) || 'pin',
      couleur: couleurValide(champ(r, ['couleur', 'color'])) || PALETTE[i % PALETTE.length],
      nom: { en: champ(r, ['nomen', 'nameen']) || cle, fr: champ(r, ['nomfr']), ja: champ(r, ['nom日本語', 'nomja', 'nomjp']) },
      ordre: parseFloat(champ(r, ['ordre', 'order'])) || 100 + i,
      lieux: [],
      visible: true,
    });
  });
  for (const l of lieux) {
    const k = l.categorie.toLowerCase();
    if (!cats.has(k)) {
      cats.set(k, {
        cle: l.categorie, icone: 'pin', couleur: PALETTE[cats.size % PALETTE.length],
        nom: { en: l.categorie }, ordre: 999, lieux: [], visible: true,
      });
    }
    l.cat = cats.get(k);
    l.cat.lieux.push(l);
  }
  return [...cats.values()].filter((c) => c.lieux.length).sort((a, b) => a.ordre - b.ordre);
}

// ---------------------------------------------------------------- Carte 3D
const cam = CONFIG.camera;
function vueDepart() {
  const v = estTelephone() ? cam.telephone : cam.ordinateur;
  return { center: v.centre, zoom: v.zoom, pitch: v.inclinaison, bearing: v.orientation };
}

function exageration(z) {
  const R = CONFIG.relief;
  if (z <= R[0][0]) return R[0][1];
  for (let i = 1; i < R.length; i++) {
    if (z <= R[i][0]) {
      const [z0, e0] = R[i - 1], [z1, e1] = R[i];
      return e0 + (e1 - e0) * (z - z0) / (z1 - z0);
    }
  }
  return R[R.length - 1][1];
}

const TUILES_RELIEF = {
  type: 'raster-dem',
  tiles: ['https://tiles.mapterhorn.com/{z}/{x}/{y}.webp'],
  tileSize: 512,
  maxzoom: 12,
  encoding: 'terrarium',
};
const MER = CONFIG.couleurs.mer;
const OSM = '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap</a>';
// Liseré d'aquarelle de chaque grande région, le long de ses frontières (comme sur les cartes coloriées à la main)
const LAVIS_REGIONS = {
  hokkaido: '#9a86a8', tohoku: '#7f9f5c', kanto: '#cf9c45', chubu: '#c47f72',
  kansai: '#5f7f9e', chugoku: '#7f9f5c', shikoku: '#cf9c45', kyushu: '#9a86a8',
};
const SABLE = '#e3d0a7';
const SABLE_TRANSPARENT = 'rgba(227, 208, 167, 0)'; // même teinte, pour ne pas tirer vers le noir en fondu

const map = new maplibregl.Map({
  container: 'carte',
  ...vueDepart(),
  minZoom: 3.6,
  maxZoom: 16,
  maxPitch: 72,
  maxBounds: [[108, 12], [170, 58]],
  renderWorldCopies: false,
  // Les téléphones ont souvent 3 pixels par point : dessiner en ×2 suffit et évite ~2× plus de calcul.
  pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
  // Bords lisses pour les modèles 3D sur les écrans d'ordinateur ; les téléphones (×2) n'en ont pas besoin.
  canvasContextAttributes: { antialias: (window.devicePixelRatio || 1) < 2 },
  attributionControl: false,
  style: {
    version: 8,
    sources: {
      relief: TUILES_RELIEF,
      ombrage: {
        ...TUILES_RELIEF,
        attribution: '<a href="https://mapterhorn.com/attribution" target="_blank" rel="noopener">© Mapterhorn</a> · Natural Earth',
      },
      voisins: { type: 'geojson', data: 'data/masque-voisins.geojson' },
      large: { type: 'geojson', data: 'data/masque-large.geojson' },
      cote: { type: 'geojson', data: 'data/cote-japon.geojson' },
      eaux: {
        type: 'geojson',
        data: 'data/eaux-japon.geojson',
        attribution: OSM,
      },
      frontieres: { type: 'geojson', data: 'data/frontieres-japon.geojson', attribution: OSM },
    },
    layers: [
      { id: 'fond', type: 'background', paint: { 'background-color': MER } },
      // Sous le relief (qui cache la moitié côté terre) : l'ombre des îles sur la mer, puis les fines
      // lignes d'eau parallèles aux côtes des cartes gravées. Vues de loin seulement : le trait de côte
      // (Natural Earth) est trop simplifié pour coller au relief de près.
      {
        id: 'cote-ombre',
        type: 'line',
        source: 'cote',
        paint: {
          'line-color': '#2c4a43',
          'line-width': ['interpolate', ['linear'], ['zoom'], 4, 10, 7, 20],
          'line-blur': ['interpolate', ['linear'], ['zoom'], 4, 9, 7, 18],
          'line-translate': [6, 7],
          'line-translate-anchor': 'map', // la lumière vient du nord-ouest, comme l'ombrage du relief
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 6.5, 0.72, 8.5, 0],
        },
      },
      ...[[3, 7, 0.55], [7, 15, 0.32], [11, 24, 0.18]].map(([pres, loin, opacite], i) => ({
        id: `lignes-eau-${i + 1}`,
        type: 'line',
        source: 'cote',
        paint: {
          'line-color': '#3d6b64',
          'line-width': 0.8,
          'line-gap-width': ['interpolate', ['linear'], ['zoom'], 4.5, pres * 2, 7, loin * 2],
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 6.5, opacite, 8.5, 0],
        },
      })),
      {
        id: 'couleurs-relief',
        type: 'color-relief',
        source: 'ombrage',
        paint: {
          // La mer vaut 0 m pile. Beaucoup de téléphones lisent l'altitude avec ~0,5 m d'erreur
          // (texture filtrée en float16), alors que les paliers ci-dessous restent exacts : avec des
          // paliers serrés autour de 0 (±0,02 m), la mer y tombait dans la couleur des terres sous
          // le niveau de la mer. D'où une marge d'environ 1 m autour de 0 (pas plus : les polders
          // comme Hachirōgata, à -4 m, doivent rester des terres).
          // La mer est transparente : on voit dessous le fond turquoise, les lignes d'eau et l'ombre des îles.
          // Couleurs d'une vieille carte en relief : sable pâle, ocre, terre d'ombre, os blanc des sommets.
          'color-relief-color': [
            'interpolate', ['linear'], ['elevation'],
            -2.5, SABLE,
            -1.2, SABLE_TRANSPARENT,
            0.6, SABLE_TRANSPARENT,
            2, SABLE,
            60, '#dcc59a',
            200, '#d1b68a',
            500, '#c4a47a',
            900, '#bc9b72',
            1500, '#a8865f',
            2200, '#8f6f50',
            2900, '#a8977f',
            3500, '#efe7d6',
          ],
        },
      },
      {
        id: 'ombrage',
        type: 'hillshade',
        source: 'ombrage',
        paint: {
          'hillshade-exaggeration': 0.9,
          'hillshade-illumination-anchor': 'map',
          'hillshade-illumination-direction': 315,
          // ombres terre d'ombre, lumières couleur de papier : le relief sort de la feuille
          'hillshade-shadow-color': 'rgba(70, 45, 24, 0.82)',
          'hillshade-highlight-color': 'rgba(255, 249, 232, 0.55)',
          'hillshade-accent-color': 'rgba(96, 66, 38, 0.45)',
        },
      },
      // Frontières (OpenStreetMap, voir outils/fabriquer_frontieres.py), sous les rivières. Entre deux grandes
      // régions : un liseré d'aquarelle de la couleur de chacune, de son côté du trait (g = à gauche du tracé,
      // d = à droite), et un trait de tirets et de points. Entre deux préfectures : des tirets, en zoomant.
      ...[['g', -1], ['d', 1]].map(([cote, sens]) => ({
        id: `lavis-${cote}`,
        type: 'line',
        source: 'frontieres',
        filter: ['==', ['get', 'n'], 'r'],
        layout: { 'line-join': 'round' },
        paint: {
          'line-color': ['match', ['get', cote], ...Object.entries(LAVIS_REGIONS).flat(), '#a39f92'],
          'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 4, 4, 7, 9, 10, 15, 14, 24],
          'line-offset': ['interpolate', ['exponential', 1.5], ['zoom'], 4, sens * 2, 7, sens * 4.5, 10, sens * 7.5, 14, sens * 12],
          'line-blur': ['interpolate', ['exponential', 1.5], ['zoom'], 4, 2, 7, 4, 10, 6, 14, 9],
          'line-opacity': 0.6,
        },
      })),
      // Un voile clair sous les tirets, pour qu'il se lise aussi dans l'ombre des montagnes
      {
        id: 'frontieres-prefectures-fond',
        type: 'line',
        source: 'frontieres',
        filter: ['==', ['get', 'n'], 'p'],
        layout: { 'line-join': 'round' },
        paint: {
          'line-color': '#f6eedb',
          'line-width': ['interpolate', ['linear'], ['zoom'], 5.5, 3, 8, 5, 12, 7],
          'line-blur': ['interpolate', ['linear'], ['zoom'], 5.5, 1, 8, 1.5, 12, 2.5],
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 5.5, 0, 6.5, 0.5],
        },
      },
      {
        id: 'frontieres-prefectures',
        type: 'line',
        source: 'frontieres',
        filter: ['==', ['get', 'n'], 'p'],
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#35251a',
          'line-width': ['interpolate', ['linear'], ['zoom'], 5.5, 1.3, 8, 2.2, 12, 3],
          'line-dasharray': [1.4, 1.5],
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 5.5, 0, 6.5, 0.85],
        },
      },
      {
        id: 'frontieres-regions',
        type: 'line',
        source: 'frontieres',
        filter: ['==', ['get', 'n'], 'r'],
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#35251a',
          'line-width': ['interpolate', ['linear'], ['zoom'], 4, 1.1, 7, 1.9, 12, 2.8],
          'line-dasharray': [4, 1.6, 0.1, 1.6],
          'line-opacity': 0.9,
        },
      },
      // Lacs et grandes rivières (OpenStreetMap, voir outils/fabriquer_eaux.py), peints de la couleur de la
      // mer par-dessus le relief et cernés d'un fin trait d'eau. De loin, seules les plus longues rivières
      // se voient ; les autres apparaissent en zoomant. km = étendue de la rivière (40 à 240 km).
      ...[['rivieres-bord', '#3d6b64', 1.3], ['rivieres', MER, 0]].map(([id, couleur, bord]) => {
        const importance = ['min', 1, ['/', ['get', 'km'], 160]];
        return {
          id,
          type: 'line',
          source: 'eaux',
          filter: ['==', ['get', 't'], 'riviere'],
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': couleur,
            'line-width': ['interpolate', ['exponential', 1.5], ['zoom'],
              5, ['+', bord * 0.6, ['*', 0.9, importance]],
              8, ['+', bord, 0.5, ['*', 1.6, importance]],
              11, ['+', bord, 1.2, ['*', 2.6, importance]],
              14, ['+', bord * 1.4, 2.6, ['*', 4.5, importance]]],
            'line-opacity': ['interpolate', ['linear'], ['zoom'],
              4.5, ['case', ['>=', ['get', 'km'], 100], 0.9, 0],
              6.5, 0.9],
          },
        };
      }),
      { id: 'lacs', type: 'fill', source: 'eaux', filter: ['==', ['get', 't'], 'lac'], paint: { 'fill-color': MER } },
      {
        id: 'lacs-bord',
        type: 'line',
        source: 'eaux',
        filter: ['==', ['get', 't'], 'lac'],
        paint: {
          'line-color': '#3d6b64',
          'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.5, 10, 1.1, 14, 1.6],
          'line-opacity': 0.8,
        },
      },
      // Le trait d'encre des côtes, par-dessus le relief
      {
        id: 'cote-encre',
        type: 'line',
        source: 'cote',
        paint: {
          'line-color': '#4e3822',
          'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.6, 7, 1.1],
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 6, 0.75, 8, 0],
        },
      },
      { id: 'voisins', type: 'fill', source: 'voisins', paint: { 'fill-color': MER } },
      // Un trait épais de la couleur de la mer cache les petites différences de côte des pays voisins.
      {
        id: 'voisins-contour',
        type: 'line',
        source: 'voisins',
        paint: {
          'line-color': MER,
          'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 3, 4, 6, 5, 8, 7, 10, 14, 12, 40],
        },
      },
      // Le grand cache : tout ce qui est loin du Japon prend la couleur de la mer. Il cache les milliers
      // d'îlots des voisins trop petits pour le cache ci-dessus (ils scintillaient quand la carte bougeait).
      { id: 'large', type: 'fill', source: 'large', paint: { 'fill-color': MER, 'fill-antialias': false } },
    ],
    terrain: { source: 'relief', exaggeration: exageration(vueDepart().zoom) },
    // Au-delà de l'horizon, du parchemin ; au loin, un voile clair, comme sur une vieille gravure
    sky: {
      'sky-color': CONFIG.couleurs.ciel,
      'horizon-color': CONFIG.couleurs.horizon,
      'fog-color': CONFIG.couleurs.brume,
      'fog-ground-blend': 0.35,
      'horizon-fog-blend': 0.6,
      'sky-horizon-blend': 0.85,
      'atmosphere-blend': 0,
    },
  },
});
map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');
map.on('error', (e) => console.warn('Carte :', e.error?.message || e));
window.carte = map; // pratique pour inspecter la carte depuis la console du navigateur

// ---------------------------------------------------------------- Décor de vieille carte
// Papier vieilli (grain, taches, bords brunis) : glissé juste après l'image de la carte, donc
// par-dessus le relief mais sous les lieux, qui restent nets.
map.getCanvasContainer().insertBefore($('papier'), map.getCanvas().nextSibling);

// Noms des mers, écrits à l'ancienne et couchés sur l'eau. Ils s'effacent quand on zoome (voir .loin dans style.css).
const MERS = [
  { ou: [135.7, 39.6], nom: { en: 'Sea of Japan', fr: 'Mer du Japon', ja: '日本海' } },
  { ou: [136.4, 31.2], nom: { en: 'Pacific Ocean', fr: 'Océan Pacifique', ja: '太平洋' } },
  { ou: [126.8, 30.4], nom: { en: 'East China Sea', fr: 'Mer de Chine orientale', ja: '東シナ海' }, petit: true },
  { ou: [146.4, 45.8], nom: { en: 'Sea of Okhotsk', fr: "Mer d'Okhotsk", ja: 'オホーツク海' }, petit: true },
];
for (const m of MERS) {
  m.el = document.createElement('div');
  m.el.className = m.petit ? 'nom-mer petit' : 'nom-mer';
  m.el.setAttribute('aria-hidden', 'true');
  new maplibregl.Marker({ element: m.el, pitchAlignment: 'map', rotationAlignment: 'viewport', opacityWhenCovered: '1' })
    .setLngLat(m.ou)
    .addTo(map);
}

// Noms des grandes régions et des préfectures, écrits sur la terre quand on zoome
const nomsRegions = brancherNomsRegions(map, maplibregl, { enLangue });

// La mer vivante : houle, vagues, bateaux d'époque, baleine et serpent de mer (vus de loin)
animerMer(map, maplibregl, { mers: MERS.map((m) => m.ou) });

// Petits modèles 3D des lieux (un par icône de catégorie), visibles quand on zoome
const modeles3d = brancherModeles(map, maplibregl, () => lieux);

// Rose des vents : elle tourne avec la carte (le N montre toujours le nord)
function tournerRose() {
  $('rose').style.transform = `rotate(${-map.getBearing()}deg)`;
}
map.on('rotate', tournerRose);
tournerRose();

// Hauteur du relief et taille des épingles selon le zoom
let exagActuelle = null;
let tailleActuelle = null;
let vueLointaine = null; // tout le Japon à l'écran : les lieux sont de petits points

/**
 * Change la hauteur du relief. map.setTerrain() détruit et reconstruit tout le relief 3D (maillages,
 * textures) : appelé à chaque cran de zoom, il faisait saccader la carte. On change donc juste le
 * nombre dans le relief existant (internes de MapLibre 6.11, version figée dans index.html),
 * et on ne passe par setTerrain() que si ces internes n'existent pas.
 */
function changerRelief(e) {
  const relief = map.terrain;
  if (relief && typeof relief.exaggeration === 'number' && map._camera?.applyTerrainChange) {
    relief.exaggeration = e;
    relief.options = { ...relief.options, exaggeration: e };
    relief.resetElevationCache?.();
    map.painter?.markTerrainDepthDirty?.();
    map._camera.applyTerrainChange(); // recale la caméra sur le sol à sa nouvelle hauteur
    map.triggerRepaint();
    return;
  }
  map.setTerrain({ source: 'relief', exaggeration: e });
}

function majSelonZoom() {
  const z = map.getZoom();
  const e = Math.round(exageration(z) * 10) / 10;
  // Pas de garde isStyleLoaded() : elle reste fausse tant que des tuiles chargent (pendant un vol
  // vers un lieu), et le relief gardait alors l'exagération ×30 de la vue lointaine.
  if (e !== exagActuelle) {
    try {
      changerRelief(e);
      exagActuelle = e;
    } catch {
      // style pas encore prêt au tout début : le relief de départ est déjà dans le style
    }
  }
  // Taille des épingles par paliers (0,7 · 0,8 · 0,9 · 1) : la changer à chaque image de zoom
  // obligeait le navigateur à redessiner les 123 épingles en continu.
  const taille = Math.min(1, Math.max(0.7, Math.round((0.7 + (z - 4.5) * 0.1) * 10) / 10));
  if (taille !== tailleActuelle) {
    tailleActuelle = taille;
    map.getContainer().style.setProperty('--t', String(taille));
  }
  const loin = z < ZOOM_POINTS;
  if (loin !== vueLointaine) {
    vueLointaine = loin;
    map.getContainer().classList.toggle('loin', loin);
  }
}
map.on('zoom', majSelonZoom);

// Rotation douce au démarrage (comme une maquette sur un plateau tournant)
let rotation = cam.tourneToutSeul && !matchMedia('(prefers-reduced-motion: reduce)').matches;
let tempsPrecedent = 0;
function tourner(temps) {
  if (!rotation) return;
  if (tempsPrecedent) map.setBearing(map.getBearing() + ((temps - tempsPrecedent) / 1000) * cam.vitesseRotation);
  tempsPrecedent = temps;
  requestAnimationFrame(tourner);
}
function arreterRotation() {
  rotation = false;
  cacherAide();
}

/** Le petit mot d'accueil n'apparaît qu'à la première visite : on s'en souvient dès qu'il disparaît. */
function cacherAide() {
  $('aide').classList.add('cachee');
  try { localStorage.setItem('aideVue', '1'); } catch { /* pas grave */ }
}
for (const ev of ['mousedown', 'touchstart', 'wheel']) {
  map.getCanvasContainer().addEventListener(ev, arreterRotation, { passive: true });
}

// ---------------------------------------------------------------- Épingles
let lieux = [];
let categories = [];
let lieuActif = null;

function creerEpingle(lieu) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'repere';
  el.style.setProperty('--c', lieu.cat.couleur);
  el.innerHTML = `<span class="repere-tete">${iconeHTML(lieu.cat.icone)}</span><span class="repere-nom"></span>`;
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    ouvrirLieu(lieu);
  });
  lieu.el = el;
  lieu.epingle = new maplibregl.Marker({ element: el, anchor: 'bottom', opacityWhenCovered: '0.35' })
    .setLngLat([lieu.lng, lieu.lat]);
}

function appliquerFiltres() {
  for (const l of lieux) {
    if (l.cat.visible) l.epingle.addTo(map);
    else l.epingle.remove();
  }
  map.triggerRepaint(); // les modèles 3D des catégories masquées disparaissent aussi
  const visibles = lieux.filter((l) => l.cat.visible).length;
  $('compteur').textContent = visibles === lieux.length ? lieux.length : `${visibles}/${lieux.length}`;
}

// ---------------------------------------------------------------- Menu des catégories
// Chaque catégorie : une case (afficher/masquer sur la carte) + une flèche qui déplie la liste de ses lieux.
function construireMenu() {
  const ul = $('liste-categories');
  ul.innerHTML = '';
  for (const c of categories) {
    const li = document.createElement('li');
    li.className = 'ligne-categorie';
    li.style.setProperty('--c', c.couleur);
    li.classList.toggle('masquee', !c.visible);
    li.innerHTML = `<div class="ligne-tete">
        <label class="case" title="${esc(t('afficherSurCarte'))}">
          <input type="checkbox" ${c.visible ? 'checked' : ''} aria-label="${esc(enLangue(c.nom))}">
          <span class="coche">${SVG.coche}</span>
        </label>
        <button type="button" class="deplier" aria-expanded="${!!c.deplie}" title="${esc(t('voirLieux'))}">
          <span class="pastille">${iconeHTML(c.icone)}</span>
          <span class="nom-cat">${esc(enLangue(c.nom))}</span>
          <span class="nb">${c.lieux.length}</span>
          ${SVG.chevron}
        </button>
      </div>
      <ul class="sous-liste" ${c.deplie ? '' : 'hidden'}></ul>`;
    const sousListe = li.querySelector('.sous-liste');
    const tries = [...c.lieux].sort((a, b) => enLangue(a.nom).localeCompare(enLangue(b.nom), langue));
    for (const l of tries) {
      const item = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.lieu = l.id;
      b.textContent = enLangue(l.nom);
      b.classList.toggle('actif', l === lieuActif);
      b.addEventListener('click', () => allerAuLieu(l));
      item.append(b);
      sousListe.append(item);
    }
    li.querySelector('input').addEventListener('change', (e) => {
      c.visible = e.target.checked;
      li.classList.toggle('masquee', !c.visible);
      appliquerFiltres();
    });
    li.querySelector('.deplier').addEventListener('click', (e) => {
      c.deplie = !c.deplie;
      e.currentTarget.setAttribute('aria-expanded', String(c.deplie));
      sousListe.hidden = !c.deplie;
    });
    ul.append(li);
  }
}

/** Depuis un menu (recherche, liste d'une catégorie, dé) : vole vers le lieu et ouvre sa fiche. */
function allerAuLieu(l, options = {}) {
  if (!l.cat.visible) { l.cat.visible = true; construireMenu(); appliquerFiltres(); }
  if (estTelephone()) { ouvrirMenu(false); ouvrirHasard(false); }
  ouvrirLieu(l, options);
}

function marquerDansMenu() {
  for (const b of document.querySelectorAll('.sous-liste button')) {
    b.classList.toggle('actif', b.dataset.lieu === lieuActif?.id);
  }
}

function toutCocher(visible) {
  for (const c of categories) c.visible = visible;
  construireMenu();
  appliquerFiltres();
}

function ouvrirMenu(ouvrir) {
  $('menu-categories').hidden = !ouvrir;
  $('btn-categories').setAttribute('aria-expanded', String(ouvrir));
  if (ouvrir) { ouvrirHasard(false); ouvrirLegendes(false); }
  if (ouvrir && !estTelephone()) $('recherche').focus();
}

// ---------------------------------------------------------------- Légendes cachées (legendes.js)
// De petits dessins de légendes à trouver en zoomant. Le module se charge juste après le démarrage.
let legendes = null;

function chargerLegendes() {
  import('./legendes.js')
    .then(({ brancherLegendes }) => {
      legendes = brancherLegendes(map, maplibregl, {
        t, enLangue, langue: () => langue, afficherMessage, fermerFiche,
        fermerPanneau: () => ouvrirLegendes(false),
      });
    })
    .catch((e) => console.warn('Légendes cachées indisponibles', e));
}

/** La liste des légendes (bouton « Légendes », visible dès qu'on en a trouvé une). */
function ouvrirLegendes(ouvrir) {
  $('panneau-legendes').hidden = !ouvrir;
  $('btn-legendes').setAttribute('aria-expanded', String(ouvrir));
  if (!ouvrir) return;
  ouvrirMenu(false);
  ouvrirHasard(false);
  legendes?.remplirPanneau();
}

// ---------------------------------------------------------------- Lieu au hasard (le dé)
let prefecturesPretes = null; // promesse : une fois tenue, chaque lieu a son numéro de préfecture
let tirageActif = false; // la fiche ouverte vient du dé → bouton « Un autre »

/** Charge les contours des préfectures (une seule fois) et trouve celle de chaque lieu. */
function preparerPrefectures() {
  prefecturesPretes ??= chargerPrefectures('data/prefectures.geojson')
    .then((trouver) => { for (const l of lieux) l.prefecture = trouver(l.lng, l.lat); })
    .catch((e) => { prefecturesPretes = null; throw e; });
  return prefecturesPretes;
}

/** region = '' (partout), 'r:kyushu' (une grande région) ou 'p:40' (une préfecture) ; type = clé de catégorie ou ''. */
function correspond(l, region, type) {
  if (type && l.cat.cle !== type) return false;
  if (!region) return true;
  const [genre, valeur] = region.split(':');
  if (genre === 'p') return l.prefecture === Number(valeur);
  return regionDe(l.prefecture)?.cle === valeur;
}

const candidats = (region, type) => lieux.filter((l) => correspond(l, region, type));

/** Remplit les deux listes déroulantes, avec le nombre de lieux possibles pour chaque choix. */
function construireHasard() {
  const selRegion = $('choix-region');
  const selType = $('choix-type');
  const region = selRegion.value;
  const type = selType.value;
  const option = (valeur, texte, n, choisi) => {
    const o = new Option(`${texte} (${n})`, valeur);
    o.disabled = n === 0 && valeur !== choisi;
    return o;
  };

  selRegion.replaceChildren(option('', t('partout'), candidats('', type).length, region));
  for (const r of REGIONS) {
    const prefs = r.prefectures.filter((p) => lieux.some((l) => l.prefecture === p));
    if (!prefs.length) continue;
    const toute = option(`r:${r.cle}`, r.prefectures.length > 1 ? t('toutLaRegion', enLangue(r.nom)) : enLangue(r.nom),
      candidats(`r:${r.cle}`, type).length, region);
    if (r.prefectures.length === 1) { selRegion.append(toute); continue; }
    const groupe = document.createElement('optgroup');
    groupe.label = enLangue(r.nom);
    groupe.append(toute);
    for (const p of prefs) groupe.append(option(`p:${p}`, enLangue(PREFECTURES[p]), candidats(`p:${p}`, type).length, region));
    selRegion.append(groupe);
  }
  selRegion.value = region;
  if (selRegion.value !== region) selRegion.value = '';

  selType.replaceChildren(option('', t('tousTypes'), candidats(selRegion.value, '').length, type));
  for (const c of categories) selType.append(option(c.cle, enLangue(c.nom), candidats(selRegion.value, c.cle).length, type));
  selType.value = type;
  if (selType.value !== type) selType.value = '';

  const n = candidats(selRegion.value, selType.value).length;
  $('hasard-info').textContent = n ? t('possibles', n) : t('aucunPossible');
  $('btn-lancer').disabled = n === 0;
}

async function ouvrirHasard(ouvrir) {
  $('panneau-hasard').hidden = !ouvrir;
  $('btn-hasard').setAttribute('aria-expanded', String(ouvrir));
  if (!ouvrir) return;
  ouvrirMenu(false);
  ouvrirLegendes(false);
  if (!$('choix-region').options.length) {
    $('hasard-info').textContent = '…';
    $('btn-lancer').disabled = true;
  }
  try {
    await preparerPrefectures();
    construireHasard();
  } catch (e) {
    console.warn('Contours des préfectures indisponibles', e);
    $('hasard-info').textContent = 'Oops! Please try again.';
  }
}

function lancerDe() {
  const liste = candidats($('choix-region').value, $('choix-type').value);
  if (!liste.length) return;
  let choix;
  do choix = liste[Math.floor(Math.random() * liste.length)];
  while (liste.length > 1 && choix === lieuActif); // jamais deux fois de suite le même lieu
  for (const de of document.querySelectorAll('.de')) {
    de.classList.remove('roule');
    void de.getBoundingClientRect(); // relance l'animation
    de.classList.add('roule');
  }
  allerAuLieu(choix, { hasard: true });
}

function rechercher() {
  const q = normaliser($('recherche').value);
  const res = $('resultats');
  const enRecherche = q.length > 0;
  res.hidden = !enRecherche;
  $('liste-categories').hidden = enRecherche;
  $('menu-actions').hidden = enRecherche;
  if (!enRecherche) return;
  const trouves = lieux.filter((l) =>
    [l.nom.en, l.nom.fr, l.nom.ja, l.cat.nom.en, l.cat.nom.fr, l.cat.nom.ja].some((n) => n && normaliser(n).includes(q)),
  ).slice(0, 40);
  res.innerHTML = trouves.length ? '' : `<li class="vide">${esc(t('aucunResultat'))}</li>`;
  for (const l of trouves) {
    const li = document.createElement('li');
    li.innerHTML = `<button type="button">
        <span class="pastille" style="--c:${l.cat.couleur}">${iconeHTML(l.cat.icone)}</span>
        <span class="nom-res">${esc(enLangue(l.nom))}</span>
        <span class="cat-res">${esc(enLangue(l.cat.nom))}</span>
      </button>`;
    li.querySelector('button').addEventListener('click', () => allerAuLieu(l));
    res.append(li);
  }
}

// ---------------------------------------------------------------- Fiche d'un lieu
const miniatures = new Map();
async function miniatureTiktok(url) {
  if (!url) return '';
  if (!miniatures.has(url)) {
    miniatures.set(url, fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((j) => j.thumbnail_url || '')
      .catch(() => ''));
  }
  return miniatures.get(url);
}

/** Les photos Google My Maps existent en très grand : on demande un JPEG de 800 px (~200 Ko). */
const photoAllegee = (url) => url.replace(/([?&]fife=)s\d+[^&]*/, '$1s800-rj');

const idVideo = (url) => (String(url).match(/video\/(\d+)/) || [])[1] || '';

function paddingFiche() {
  if (estTelephone()) return { top: 90, bottom: Math.round(innerHeight * 0.62), left: 0, right: 0 };
  // Sur ordinateur, le menu des catégories peut rester ouvert à gauche : on centre le lieu dans l'espace libre.
  const menuOuvert = !$('menu-categories').hidden || !$('panneau-hasard').hidden;
  return { top: 0, bottom: 0, left: menuOuvert ? 360 : 0, right: 424 };
}

function ouvrirLieu(lieu, { voler = true, hasard = false } = {}) {
  arreterRotation();
  lieuActif?.el.classList.remove('actif');
  lieuActif = lieu;
  tirageActif = hasard;
  lieu.el.classList.add('actif');
  marquerDansMenu();
  remplirFiche(lieu);
  const fiche = $('fiche');
  fiche.classList.add('ouverte');
  fiche.setAttribute('aria-hidden', 'false');
  $('fiche-defil').scrollTop = 0;
  if (location.hash !== `#${lieu.id}`) history.replaceState(null, '', `#${lieu.id}`);
  if (voler) {
    map.flyTo({
      center: [lieu.lng, lieu.lat],
      zoom: Math.max(map.getZoom(), 10.5),
      pitch: estTelephone() ? 56 : 62, // moins incliné sur téléphone : moins de relief lointain à charger
      bearing: map.getBearing(),
      padding: paddingFiche(),
      duration: 2600,
      essential: true,
    });
  }
}

function fermerFiche() {
  const fiche = $('fiche');
  if (!fiche.classList.contains('ouverte')) return;
  fiche.classList.remove('ouverte', 'agrandie');
  fiche.setAttribute('aria-hidden', 'true');
  $('fiche-media').innerHTML = '';
  lieuActif?.el.classList.remove('actif');
  lieuActif = null;
  marquerDansMenu();
  history.replaceState(null, '', location.pathname + location.search);
  map.easeTo({ padding: { top: 0, bottom: 0, left: 0, right: 0 }, duration: 500 });
}

/** Catégorie et préfecture sous le nom : « Châteaux · Hyōgo ». La préfecture arrive dès que les contours sont chargés. */
function remplirInfos(l) {
  const c = l.cat;
  const pref = l.prefecture ? ` · ${esc(enLangue(PREFECTURES[l.prefecture]))}` : '';
  $('fiche-categorie').innerHTML = `<span class="pastille" style="--c:${c.couleur}">${iconeHTML(c.icone)}</span><span>${esc(enLangue(c.nom))}${pref}</span>`;
  if (!l.prefecture) {
    preparerPrefectures().then(() => { if (lieuActif === l && l.prefecture) remplirInfos(l); }).catch(() => {});
  }
}

async function remplirFiche(l) {
  const nom = enLangue(l.nom);
  $('fiche-nom').textContent = nom;
  // Le nom japonais est dans le cartouche de la photo ; en japonais, on rappelle le nom anglais sous le titre.
  $('fiche-nom-jp').textContent = langue === 'ja' && l.nom.en !== nom ? l.nom.en : '';
  remplirInfos(l);
  $('fiche-description').textContent = enLangue(l.description);

  // Photo + bouton pour lire la vidéo TikTok directement dans la fiche
  const media = $('fiche-media');
  const video = idVideo(l.tiktok);
  media.innerHTML = '';
  const vignette = document.createElement('button');
  vignette.type = 'button';
  vignette.className = 'vignette';
  vignette.setAttribute('aria-label', t('lireVideo'));
  if (video) vignette.innerHTML = `<span class="lecture">${SVG.lecture}${esc(t('lireVideo'))}</span>`;
  else vignette.disabled = true;
  vignette.addEventListener('click', () => lancerVideo(video));
  media.append(vignette);

  // Cartouche de titre, comme sur une estampe : le nom japonais écrit de haut en bas
  if (l.nom.ja) {
    const cartouche = document.createElement('span');
    cartouche.className = 'cartouche';
    cartouche.lang = 'ja';
    cartouche.textContent = l.nom.ja;
    const n = [...l.nom.ja].length;
    if (n > 6) cartouche.style.fontSize = `${n <= 8 ? 16 : n <= 10 ? 14 : 12}px`;
    if (langue === 'ja') cartouche.setAttribute('aria-hidden', 'true'); // déjà le titre de la fiche
    media.append(cartouche);
  }

  // Boutons (avant d'attendre la photo : sinon un lieu ouvert juste avant pourrait écrire ses boutons après).
  // Deux boutons seulement, pour tenir sur une ligne ; partager est une icône sur la photo, « Plus d'infos » un lien après le texte.
  const boutons = [];
  if (l.tiktok) boutons.push(`<a class="principal" href="${esc(l.tiktok)}" target="_blank" rel="noopener">${SVG.tiktok}${esc(t('voirTiktok'))}</a>`);
  boutons.push(`<a href="https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lng}" target="_blank" rel="noopener">${SVG.route}${esc(t('itineraire'))}</a>`);
  $('fiche-boutons').innerHTML = boutons.join('');
  $('fiche-plus').innerHTML = /^https?:\/\//.test(l.autreLien)
    ? `<a href="${esc(l.autreLien)}" target="_blank" rel="noopener">${esc(t('autreLien'))} ${SVG.sortie}</a>` : '';
  const partage = navigator.share && estTelephone();
  const btnPartager = $('fiche-partager');
  btnPartager.innerHTML = partage ? SVG.partager : SVG.lien;
  btnPartager.title = t(partage ? 'partager' : 'copierLien');
  btnPartager.setAttribute('aria-label', btnPartager.title);
  btnPartager.onclick = () => partager(l, partage);
  // Fiche ouverte par le dé : bouton « Un autre » en haut de la photo, pour relancer d'un doigt
  $('fiche-autre').hidden = !tirageActif;
  $('txt-autre').textContent = t('unAutre');

  const photo = l.photo ? photoAllegee(l.photo) : await miniatureTiktok(l.tiktok);
  if (lieuActif === l && photo) vignette.style.backgroundImage = `url("${photo.replace(/"/g, '%22')}")`;
}

function lancerVideo(id) {
  if (!id) return;
  const src = `https://www.tiktok.com/player/v1/${id}?autoplay=1&music_info=1&description=0&rel=0`;
  $('fiche-media').innerHTML = `<div class="video-cadre"><iframe class="video" src="${src}" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowfullscreen title="TikTok"></iframe></div>`;
}

async function partager(l, viaTelephone) {
  const url = `${location.origin}${location.pathname}#${l.id}`;
  if (viaTelephone) {
    try { await navigator.share({ title: enLangue(l.nom), url }); return; } catch { /* annulé */ }
  }
  try {
    await navigator.clipboard.writeText(url);
    afficherMessage(t('lienCopie'));
  } catch {
    prompt('', url);
  }
}

let minuterieMessage;
function afficherMessage(texte) {
  const el = $('toast');
  el.textContent = texte;
  el.classList.add('visible');
  clearTimeout(minuterieMessage);
  minuterieMessage = setTimeout(() => el.classList.remove('visible'), 2000);
}

/**
 * Téléphone : la barre en haut de la fiche se tire comme un tiroir.
 * Vers le haut = fiche en grand ; vers le bas = taille normale, puis fermeture. Un simple appui bascule.
 */
function brancherPoignee() {
  const fiche = $('fiche');
  const poignee = $('fiche-poignee');
  let geste = null;

  poignee.addEventListener('pointerdown', (e) => {
    if (!estTelephone()) return;
    geste = { y: e.clientY, h: fiche.getBoundingClientRect().height, t: performance.now(), bouge: false };
    poignee.setPointerCapture(e.pointerId);
    fiche.classList.add('glisse');
  });

  poignee.addEventListener('pointermove', (e) => {
    if (!geste) return;
    const dy = e.clientY - geste.y;
    if (Math.abs(dy) > 6) geste.bouge = true;
    if (!geste.bouge) return;
    const max = innerHeight - 70;
    fiche.style.height = `${Math.round(Math.min(max, Math.max(60, geste.h - dy)))}px`;
  });

  const lacher = (e) => {
    if (!geste) return;
    const { bouge } = geste;
    const dy = e.clientY - geste.y;
    const h = geste.h - dy;
    const vitesse = dy / Math.max(1, performance.now() - geste.t); // px/ms, > 0 = vers le bas
    const etaitGrande = fiche.classList.contains('agrandie');
    geste = null;
    fiche.classList.remove('glisse');
    const normale = innerHeight * 0.64;
    if (bouge && (h < normale * 0.6 || (vitesse > 0.6 && !etaitGrande))) {
      // on garde la hauteur tirée pendant que la fiche descend, sinon elle regrandit en partant
      fermerFiche();
      setTimeout(() => { fiche.style.height = ''; }, 400);
      return;
    }
    fiche.style.height = '';
    if (!bouge) {
      fiche.classList.toggle('agrandie');
    } else if (vitesse > 0.6) {
      fiche.classList.remove('agrandie');
    } else {
      fiche.classList.toggle('agrandie', vitesse < -0.6 || h > (normale + innerHeight - 70) / 2);
    }
  };
  poignee.addEventListener('pointerup', lacher);
  poignee.addEventListener('pointercancel', lacher);
}

function ouvrirDepuisAdresse() {
  const id = decodeURIComponent(location.hash.slice(1));
  const lieu = id && lieux.find((l) => l.id === id);
  if (lieu) {
    if (!lieu.cat.visible) { lieu.cat.visible = true; construireMenu(); appliquerFiltres(); }
    ouvrirLieu(lieu);
  }
}

// ---------------------------------------------------------------- Textes & langue
function appliquerLangue() {
  document.documentElement.lang = langue;
  $('sous-titre').textContent = t('sousTitre');
  $('txt-categories').textContent = t('categories');
  $('recherche').placeholder = t('chercher');
  $('btn-tout').textContent = t('tout');
  $('btn-rien').textContent = t('rien');
  $('btn-rose').title = t('nord');
  $('btn-rose').setAttribute('aria-label', t('nord'));
  for (const m of MERS) {
    m.el.lang = langue;
    m.el.textContent = enLangue(m.nom);
  }
  $('btn-recentrer').title = t('recentrer');
  $('btn-recentrer').setAttribute('aria-label', t('recentrer'));
  $('fiche-fermer').setAttribute('aria-label', t('fermer'));
  $('txt-chargement').textContent = t('chargement');
  $('aide').textContent = t(estTelephone() ? 'aideTel' : 'aide');
  $('lien-profil').title = t('suivre');
  $('txt-hasard').textContent = t('hasard');
  $('hasard-titre').textContent = t('hasardTitre');
  $('txt-region').textContent = t('region');
  $('txt-type').textContent = t('type');
  $('txt-lancer').textContent = t('lancer');
  if ($('choix-region').options.length) construireHasard();
  for (const b of document.querySelectorAll('[data-langue]')) {
    b.setAttribute('aria-pressed', String(b.dataset.langue === langue));
  }
  for (const l of lieux) l.el.querySelector('.repere-nom').textContent = enLangue(l.nom);
  construireMenu();
  if (!$('resultats').hidden) rechercher();
  if (lieuActif) remplirFiche(lieuActif);
  legendes?.majLangue();
  nomsRegions.majLangue(langue);
}

// ---------------------------------------------------------------- Démarrage
function brancherBoutons() {
  $('titre').textContent = CONFIG.titre;
  $('lien-profil').href = CONFIG.tiktokProfil;
  const logo = $('logo');
  if (CONFIG.logo) logo.src = CONFIG.logo;
  logo.addEventListener('error', () => logo.removeAttribute('src'));

  for (const b of document.querySelectorAll('[data-langue]')) {
    b.addEventListener('click', () => {
      langue = b.dataset.langue;
      try { localStorage.setItem('langue', langue); } catch { /* pas grave */ }
      appliquerLangue();
    });
  }
  $('btn-categories').addEventListener('click', (e) => {
    e.stopPropagation();
    ouvrirMenu($('menu-categories').hidden);
  });
  $('menu-categories').addEventListener('click', (e) => e.stopPropagation());
  $('btn-hasard').addEventListener('click', (e) => {
    e.stopPropagation();
    ouvrirHasard($('panneau-hasard').hidden);
  });
  $('panneau-hasard').addEventListener('click', (e) => e.stopPropagation());
  $('btn-legendes').addEventListener('click', (e) => {
    e.stopPropagation();
    ouvrirLegendes($('panneau-legendes').hidden);
  });
  $('panneau-legendes').addEventListener('click', (e) => e.stopPropagation());
  $('choix-region').addEventListener('change', construireHasard);
  $('choix-type').addEventListener('change', construireHasard);
  $('btn-lancer').addEventListener('click', lancerDe);
  $('fiche-autre').addEventListener('click', lancerDe);
  document.addEventListener('click', () => { ouvrirMenu(false); ouvrirHasard(false); ouvrirLegendes(false); });
  $('recherche').addEventListener('input', rechercher);
  $('btn-tout').addEventListener('click', () => toutCocher(true));
  $('btn-rien').addEventListener('click', () => toutCocher(false));
  $('fiche-fermer').addEventListener('click', fermerFiche);
  brancherPoignee();
  $('btn-recentrer').addEventListener('click', () => {
    fermerFiche();
    map.flyTo({ ...vueDepart(), padding: { top: 0, bottom: 0, left: 0, right: 0 }, duration: 2200 });
  });
  $('btn-rose').addEventListener('click', () => {
    arreterRotation();
    map.easeTo({ bearing: 0, duration: 1000 });
  });
  // Un appui sur un modèle 3D ouvre son lieu, comme un appui sur son repère
  map.on('click', (e) => {
    const l = modeles3d.lieuSous(e.point);
    if (l) ouvrirLieu(l);
  });
  $('btn-plus').addEventListener('click', () => map.zoomIn());
  $('btn-moins').addEventListener('click', () => map.zoomOut());
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!$('menu-categories').hidden) ouvrirMenu(false);
    else if (!$('panneau-hasard').hidden) ouvrirHasard(false);
    else if (!$('panneau-legendes').hidden) ouvrirLegendes(false);
    else fermerFiche();
  });
  window.addEventListener('hashchange', ouvrirDepuisAdresse);
  let aideVue = false;
  try { aideVue = localStorage.getItem('aideVue') === '1'; } catch { /* pas grave */ }
  if (aideVue || location.hash.length > 1) $('aide').classList.add('cachee');
  else setTimeout(cacherAide, 10000);
}

async function demarrer() {
  brancherBoutons();
  appliquerLangue();
  majSelonZoom();

  const [lignesLieux, lignesCategories] = await Promise.all([
    chargerCSV(CONFIG.tableau.lieux, CONFIG.secours.lieux),
    chargerCSV(CONFIG.tableau.categories, CONFIG.secours.categories),
  ]);
  lieux = construireLieux(lignesLieux);
  categories = construireCategories(lignesCategories, lieux);
  // Les lieux du sud d'abord : ceux du nord (plus loin à l'écran) passent derrière.
  lieux.sort((a, b) => b.lat - a.lat).forEach(creerEpingle);
  appliquerLangue();

  const pret = () => {
    appliquerFiltres();
    $('chargement').classList.add('fini');
    if (location.hash.length > 1) ouvrirDepuisAdresse();
    else if (rotation) setTimeout(() => requestAnimationFrame(tourner), 600);
    // Contours des préfectures (116 Ko) chargés en avance, sans gêner le démarrage : le dé s'ouvre tout de suite.
    setTimeout(() => preparerPrefectures().catch(() => {}), 3000);
    setTimeout(chargerLegendes, 1500);
  };
  if (map.loaded()) pret();
  else map.once('load', pret);
}

demarrer().catch((e) => {
  console.error(e);
  $('txt-chargement').textContent = 'Oops! The map could not load. Please refresh the page.';
});
