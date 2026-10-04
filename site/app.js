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
import { brancherCompteur } from './compteur.js';
import { lireFavoris, ecrireFavoris, ordreDeVoyage, liensItineraire } from './favoris.js';
import { brancherVisite } from './visite.js';
import { brancherPrecharge } from './precharge.js';
import { gererReperes } from './reperes.js';

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
  coeur: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 20.3s-7.4-4.5-9.2-9.1C1.5 7.8 3.7 4.6 7 4.6c2 0 3.6 1.1 5 2.9 1.4-1.8 3-2.9 5-2.9 3.3 0 5.5 3.2 4.2 6.6-1.8 4.6-9.2 9.1-9.2 9.1Z"/></svg>',
  croix: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M7 7l10 10M17 7 7 17"/></svg>',
  etoile: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2.8 2.6 6 6.5.6-4.9 4.3 1.5 6.4L12 16.8l-5.7 3.3 1.5-6.4-4.9-4.3 6.5-.6Z"/></svg>',
  camera: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M3 7.5h11.5v9H3zM14.5 10.5l6-3v9l-6-3"/></svg>',
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
      debutVideo: lireSecondes(champ(r, ['debutvideo', 'debutvideos', 'debutdelavideo', 'videostart'])),
    });
  });
  // Nouveau : la vidéo a moins de CONFIG.joursNouveau jours
  for (const l of lieux) {
    l.date = dateVideo(l.tiktok);
    l.nouveau = !!l.date && Date.now() - l.date < (CONFIG.joursNouveau ?? 7) * 86400000;
  }
  return lieux;
}

/** « 4 », « 4,5 », « 4 s » ou « 0:04 » → 4 (secondes) ; une case vide → null. */
function lireSecondes(texte) {
  const m = String(texte).trim().replace(',', '.').match(/^(?:(\d+):)?(\d+(?:\.\d+)?)/);
  return m ? Number(m[1] || 0) * 60 + Number(m[2]) : null;
}

/** Date de publication d'une vidéo TikTok : elle est cachée dans son numéro (les 32 premiers bits = secondes depuis 1970). */
function dateVideo(lien) {
  const id = (String(lien).match(/video\/(\d+)/) || [])[1];
  if (!id) return null;
  try {
    const d = new Date(Number(BigInt(id) >> 32n) * 1000);
    return d.getFullYear() > 2015 ? d : null;
  } catch {
    return null;
  }
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
  // toutes, même vides : le plongeon sur un nouveau lieu peut être d'un type qui n'a encore aucun lieu
  toutesCategories = [...cats.values()].sort((a, b) => a.ordre - b.ordre);
  return toutesCategories.filter((c) => c.lieux.length);
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
      // maxzoom : au-delà, MapLibre agrandit les tuiles du dernier niveau au lieu d'en découper de nouvelles.
      // À chaque image, il cherche les tuiles à afficher pour chaque source : moins de niveaux, moins de calcul
      // (les téléphones saccadaient au zoom). Les côtes et les masques (Natural Earth) sont grossiers : 7-8 suffit ;
      // les lacs, rivières et frontières (simplifiés à ~60 m) sont exacts à 10.
      voisins: { type: 'geojson', data: 'data/masque-voisins.geojson', maxzoom: 7 },
      large: { type: 'geojson', data: 'data/masque-large.geojson', maxzoom: 7 },
      cote: { type: 'geojson', data: 'data/cote-japon.geojson', maxzoom: 8 },
      eaux: {
        type: 'geojson',
        data: 'data/eaux-japon.geojson',
        maxzoom: 10,
        attribution: OSM,
      },
      frontieres: { type: 'geojson', data: 'data/frontieres-japon.geojson', maxzoom: 10, attribution: OSM },
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

// Les repères HTML ne restent sur la carte que près de l'écran (voir reperes.js : sinon le zoom saccade)
const reperes = gererReperes(map);

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
  const repere = new maplibregl.Marker({ element: m.el, pitchAlignment: 'map', rotationAlignment: 'viewport', opacityWhenCovered: '1' })
    .setLngLat(m.ou);
  // juste au-dessus du papier vieilli, sous les lieux
  reperes.suivre(repere, { placer: (el) => el.parentNode.insertBefore(el, $('papier').nextSibling) });
}

// Noms des grandes régions et des préfectures, écrits sur la terre quand on zoome
const nomsRegions = brancherNomsRegions(map, maplibregl, { enLangue, reperes });

// La mer vivante : houle, vagues, bateaux d'époque, baleine et serpent de mer (vus de loin)
animerMer(map, maplibregl, { mers: MERS.map((m) => m.ou), reperes });

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
// La taille des repères (--t) est changée dans une règle qui ne vise qu'eux : posée sur la carte, la
// variable obligeait le navigateur à recalculer le style de tous les éléments de la carte.
const regleTaille = (() => {
  const feuille = document.head.appendChild(document.createElement('style')).sheet;
  feuille.insertRule('.repere { --t: 1; }');
  return feuille.cssRules[0];
})();
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
  // Par pas de 0,01 : avec des pas de 0,1, de près (×1,5 à ×2,5), les montagnes rétrécissaient par
  // crans de 4 à 7 % en zoomant, et leurs sommets sautaient à l'écran (on le voyait en plongeant).
  const e = Math.round(exageration(z) * 100) / 100;
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
    regleTaille.style.setProperty('--t', String(taille));
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
let toutesCategories = []; // avec les catégories encore vides (pour le plongeon sur un nouveau lieu)
let lieuActif = null;
const favoris = lireFavoris(); // identifiants des lieux mis en favoris (favoris.js)
let deplieNouveaux = true; // la ligne « Nouveaux lieux » du menu est dépliée

function creerEpingle(lieu, rang) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'repere';
  el.style.setProperty('--c', lieu.cat.couleur);
  el.innerHTML = `<span class="repere-tete">${iconeHTML(lieu.cat.icone)}<span class="repere-coeur">${SVG.coeur}</span><span class="repere-nouveau"></span></span><span class="repere-nom"></span>`;
  el.classList.toggle('nouveau', lieu.nouveau);
  el.classList.toggle('favori', favoris.has(lieu.id));
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    ouvrirLieu(lieu);
  });
  lieu.el = el;
  lieu.epingle = new maplibregl.Marker({ element: el, anchor: 'bottom', opacityWhenCovered: '0.35' })
    .setLngLat([lieu.lng, lieu.lat]);
  // Un lieu qui revient sur la carte reprend sa place : ceux du sud devant ceux du nord (voir demarrer)
  reperes.suivre(lieu.epingle, {
    voulu: false,
    placer: (moi) => {
      for (let j = rang + 1; j < lieux.length; j++) {
        if (lieux[j].el.parentNode === moi.parentNode) return moi.parentNode.insertBefore(moi, lieux[j].el);
      }
    },
  });
}

function appliquerFiltres() {
  for (const l of lieux) reperes.montrer(l.epingle, l.cat.visible);
  map.triggerRepaint(); // les modèles 3D des catégories masquées disparaissent aussi
  const visibles = lieux.filter((l) => l.cat.visible).length;
  $('compteur').textContent = visibles === lieux.length ? lieux.length : `${visibles}/${lieux.length}`;
}

// ---------------------------------------------------------------- Menu des catégories
// Chaque catégorie : une case (afficher/masquer sur la carte) + une flèche qui déplie la liste de ses lieux.
function construireMenu() {
  const ul = $('liste-categories');
  ul.innerHTML = '';
  construireNouveautes(ul);
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
      if (l.nouveau) b.insertAdjacentHTML('beforeend', ` <span class="etiquette-nouveau">${esc(t('nouveau'))}</span>`);
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

/** En tête du menu : les lieux des vidéos récentes, du plus récent au plus ancien, avec leur date. */
function construireNouveautes(ul) {
  const nouveaux = lieux.filter((l) => l.nouveau).sort((a, b) => b.date - a.date);
  if (!nouveaux.length) return;
  const li = document.createElement('li');
  li.className = 'ligne-categorie ligne-nouveaux';
  li.innerHTML = `<div class="ligne-tete">
      <span class="case" aria-hidden="true"><span class="coche">${SVG.coche}</span></span>
      <button type="button" class="deplier" aria-expanded="${deplieNouveaux}">
        <span class="pastille">${SVG.etoile}</span>
        <span class="nom-cat">${esc(t('nouveautes'))}</span>
        <span class="nb">${nouveaux.length}</span>
        ${SVG.chevron}
      </button>
    </div>
    <ul class="sous-liste" ${deplieNouveaux ? '' : 'hidden'}></ul>`;
  const sousListe = li.querySelector('.sous-liste');
  const jour = new Intl.DateTimeFormat(langue, { day: 'numeric', month: 'short' });
  for (const l of nouveaux) {
    const item = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.lieu = l.id;
    b.innerHTML = `${esc(enLangue(l.nom))} <span class="date-courte">${esc(jour.format(l.date))}</span>`;
    b.classList.toggle('actif', l === lieuActif);
    b.addEventListener('click', () => allerAuLieu(l));
    item.append(b);
    sousListe.append(item);
  }
  li.querySelector('.deplier').addEventListener('click', (e) => {
    deplieNouveaux = !deplieNouveaux;
    e.currentTarget.setAttribute('aria-expanded', String(deplieNouveaux));
    sousListe.hidden = !deplieNouveaux;
  });
  ul.append(li);
}

/** Depuis un menu (recherche, liste d'une catégorie, dé) : vole vers le lieu et ouvre sa fiche. */
function allerAuLieu(l, options = {}) {
  if (!l.cat.visible) { l.cat.visible = true; construireMenu(); appliquerFiltres(); }
  if (estTelephone()) { ouvrirMenu(false); ouvrirHasard(false); ouvrirFavoris(false); ouvrirVisite(false); }
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
  if (ouvrir) { ouvrirHasard(false); ouvrirLegendes(false); ouvrirFavoris(false); ouvrirVisite(false); }
  if (ouvrir && !estTelephone()) $('recherche').focus();
}

// ---------------------------------------------------------------- Légendes cachées (legendes.js)
// De petits dessins de légendes à trouver en zoomant. Le module se charge juste après le démarrage.
let legendes = null;

function chargerLegendes() {
  import('./legendes.js')
    .then(({ brancherLegendes }) => {
      legendes = brancherLegendes(map, maplibregl, {
        t, enLangue, langue: () => langue, afficherMessage, fermerFiche, reperes, adresse: CONFIG.adresse, nomSite: CONFIG.titre,
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
  ouvrirFavoris(false);
  ouvrirVisite(false);
  legendes?.remplirPanneau();
}

// ---------------------------------------------------------------- Lieu au hasard (le dé)
let prefecturesPretes = null; // promesse : une fois tenue, chaque lieu a son numéro de préfecture
let tirageActif = false; // la fiche ouverte vient du dé → bouton « Un autre »

/** Charge les contours des préfectures (une seule fois) et trouve celle de chaque lieu. */
let trouverPrefecture = null; // (lng, lat) → numéro de préfecture, une fois les contours chargés
function preparerPrefectures() {
  prefecturesPretes ??= chargerPrefectures('data/prefectures.geojson')
    .then((trouver) => {
      trouverPrefecture = trouver;
      for (const l of lieux) l.prefecture = trouver(l.lng, l.lat);
    })
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

const candidats = (region, type, base = lieux) => base.filter((l) => correspond(l, region, type));

/** Le dé : remplit ses deux listes et dit combien de lieux sont possibles. */
function construireHasard() {
  const n = remplirChoix($('choix-region'), $('choix-type'), lieux);
  $('hasard-info').textContent = n ? t('possibles', n) : t('aucunPossible');
  $('btn-lancer').disabled = n === 0;
}

/**
 * Remplit une paire de listes déroulantes (région, type) avec le nombre de lieux possibles pour chaque
 * choix, parmi « base ». Renvoie le nombre de lieux qui correspondent aux deux choix.
 */
function remplirChoix(selRegion, selType, base) {
  const candidats = (region, type) => base.filter((l) => correspond(l, region, type));
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

  return candidats(selRegion.value, selType.value).length;
}

async function ouvrirHasard(ouvrir) {
  $('panneau-hasard').hidden = !ouvrir;
  $('btn-hasard').setAttribute('aria-expanded', String(ouvrir));
  if (!ouvrir) return;
  ouvrirMenu(false);
  ouvrirLegendes(false);
  ouvrirFavoris(false);
  ouvrirVisite(false);
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

// ---------------------------------------------------------------- Favoris (favoris.js)
const estFavori = (l) => favoris.has(l.id);

/** Met ou enlève un lieu des favoris ; renvoie vrai s'il est maintenant favori. */
function basculerFavori(l) {
  if (favoris.has(l.id)) favoris.delete(l.id);
  else favoris.add(l.id);
  ecrireFavoris(favoris);
  l.el.classList.toggle('favori', favoris.has(l.id));
  majFavoris();
  return favoris.has(l.id);
}

/** Le cœur de la fiche, le bouton « Favoris » (caché tant qu'il n'y en a pas) et les listes ouvertes. */
function majFavoris() {
  const n = lieux.filter(estFavori).length;
  $('btn-favoris').hidden = n === 0 && $('panneau-favoris').hidden;
  $('compteur-favoris').textContent = n;
  if (lieuActif) majCoeur(lieuActif);
  if (!$('panneau-favoris').hidden) remplirFavoris();
  if ($('visite-region').options.length) construireVisite();
}

function majCoeur(l) {
  const b = $('fiche-favori');
  const oui = estFavori(l);
  b.setAttribute('aria-pressed', String(oui));
  b.title = t(oui ? 'retirerFavori' : 'ajouterFavori');
  b.setAttribute('aria-label', b.title);
}

/** La liste des favoris, dans l'ordre du voyage, avec l'itinéraire Google Maps et la visite guidée. */
function remplirFavoris() {
  const panneau = $('panneau-favoris');
  const liste = ordreDeVoyage(lieux.filter(estFavori));
  const titre = `<p class="hasard-titre">${esc(t('favorisTitre'))}</p>`;
  if (!liste.length) {
    panneau.innerHTML = `${titre}<p class="panneau-info">${esc(t('favorisVide'))}</p>`;
    return;
  }
  const lignes = liste.map((l, i) => `<li>
      <button type="button" class="favori-ligne" data-lieu="${esc(l.id)}">
        <span class="favori-num">${i + 1}</span>
        <span class="pastille" style="--c:${l.cat.couleur}">${iconeHTML(l.cat.icone)}</span>
        <span class="favori-textes"><b>${esc(enLangue(l.nom))}</b><small>${esc(infosLieu(l))}</small></span>
      </button>
      <button type="button" class="favori-retirer" data-retirer="${esc(l.id)}" title="${esc(t('retirer'))}" aria-label="${esc(`${t('retirer')} : ${enLangue(l.nom)}`)}">${SVG.croix}</button>
    </li>`).join('');
  const liens = liensItineraire(liste, estTelephone() ? 5 : 10);
  const itineraires = liens.map((x) => `<a class="btn-lancer btn-itineraire" href="${esc(x.url)}" target="_blank" rel="noopener">${SVG.route}<span>${esc(liens.length > 1 ? t('itinerairePartie', x.de, x.a) : t('itineraireFavoris'))}</span></a>`).join('');
  panneau.innerHTML = `${titre}<p class="panneau-info">${esc(t('favorisInfo', liste.length))}</p>
    <ol class="liste-favoris">${lignes}</ol>
    <div class="favoris-actions">${itineraires}
      <button type="button" class="btn-secondaire" data-visite>${SVG.camera}<span>${esc(t('visiteFavoris'))}</span></button>
    </div>`;
  // La préfecture de chaque lieu arrive avec les contours (une seule fois)
  if (liste.some((l) => !l.prefecture)) {
    preparerPrefectures().then(() => { if (!panneau.hidden && liste.every((l) => l.prefecture)) remplirFavoris(); }).catch(() => {});
  }
}

function ouvrirFavoris(ouvrir) {
  $('panneau-favoris').hidden = !ouvrir;
  $('btn-favoris').setAttribute('aria-expanded', String(ouvrir));
  if (!ouvrir) {
    $('btn-favoris').hidden = !lieux.some(estFavori);
    return;
  }
  ouvrirMenu(false);
  ouvrirHasard(false);
  ouvrirLegendes(false);
  ouvrirVisite(false);
  remplirFavoris();
}

// ---------------------------------------------------------------- Visite guidée (visite.js)
const infosLieu = (l) => [enLangue(l.cat.nom), l.prefecture && enLangue(PREFECTURES[l.prefecture])].filter(Boolean).join(' · ');

const visite = brancherVisite(map, {
  t, enLangue, infos: infosLieu, estTelephone, vueDepart, adresse: CONFIG.adresse,
  exageration, preparerVol: brancherPrecharge(map, maplibregl, TUILES_RELIEF),
  video: (l) => idVideo(l.tiktok),
  debut: (l) => l.debutVideo ?? CONFIG.debutVideo ?? 4,
  affiche: (l) => (l.photo ? Promise.resolve(photoAllegee(l.photo)) : miniatureTiktok(l.tiktok)),
  avant: () => {
    arreterRotation();
    fermerFiche();
    ouvrirMenu(false);
    ouvrirHasard(false);
    ouvrirLegendes(false);
    ouvrirFavoris(false);
    ouvrirVisite(false);
  },
  apres: () => {},
});

// ---------------------------------------------------------------- Plongeon sur un nouveau lieu (onglet de la visite)
// Le début des vidéos se filme avant que le lieu soit dans le tableau : on plonge sur une position collée
// (coordonnées GPS ou lien Google Maps), avec un lieu provisoire (épingle et modèle 3D de son type),
// retiré quand le plongeon s'arrête.
const MEMO_PLONGEON = 'plongeon'; // les derniers champs remplis (localStorage), pour refaire une prise plus tard
let minuteriePosition = 0;

function choisirOnglet(plongeon) {
  $('onglet-visite').setAttribute('aria-selected', String(!plongeon));
  $('onglet-plongeon').setAttribute('aria-selected', String(plongeon));
  $('volet-visite').hidden = plongeon;
  $('volet-plongeon').hidden = !plongeon;
  if (!plongeon) return;
  let memo = {};
  try { memo = JSON.parse(localStorage.getItem(MEMO_PLONGEON)) || {}; } catch { /* pas grave */ }
  const sel = $('plongeon-type');
  const choisi = sel.value || memo.type;
  sel.replaceChildren(...toutesCategories.map((c) => new Option(enLangue(c.nom), c.cle)));
  if (toutesCategories.some((c) => c.cle === choisi)) sel.value = choisi;
  for (const [id, cle] of [['plongeon-position', 'position'], ['plongeon-nom', 'nom'], ['plongeon-nom-ja', 'nomJa']]) {
    if (!$(id).value && memo[cle]) $(id).value = memo[cle];
  }
  preparerAfficheBientot();
}

/**
 * Une position collée : « 34.1302, 133.5345 » (comme dans le tableau), ou un lien Google Maps
 * (…!3d34.13!4d133.53… : le lieu lui-même ; …/@34.13,133.53,… : le centre de la vue). Les liens courts
 * (maps.app.goo.gl) ne se lisent pas depuis la page : il faut les coordonnées.
 */
function lirePosition(texte) {
  const s = String(texte || '').trim();
  if (!s) return { erreur: 'plongeonErreurVide' };
  if (/goo\.gl|g\.co\//i.test(s)) return { erreur: 'plongeonErreurLienCourt' };
  const m = s.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/) || s.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/)
    || s.match(/[?&](?:q|query|ll|destination|center)=(-?\d+(?:\.\d+)?)(?:,|%2C)\+?(-?\d+(?:\.\d+)?)/i);
  const p = m ? { lat: Number(m[1]), lng: Number(m[2]) } : /^https?:/i.test(s) ? null : lireGPS(s);
  if (!p) return { erreur: 'plongeonErreurPosition' };
  if (p.lng < 122 || p.lng > 154 || p.lat < 20 || p.lat > 46) return { erreur: 'plongeonErreurJapon' };
  return p;
}

/** Garde les champs remplis (pour refaire une prise ou une affiche plus tard). */
function memoriserPlongeon() {
  try {
    localStorage.setItem(MEMO_PLONGEON, JSON.stringify({
      position: $('plongeon-position').value.trim(), nom: $('plongeon-nom').value.trim(),
      nomJa: $('plongeon-nom-ja').value.trim(), type: $('plongeon-type').value,
    }));
  } catch { /* pas grave */ }
}

async function lancerPlongeon() {
  const p = lirePosition($('plongeon-position').value);
  const erreur = $('plongeon-erreur');
  erreur.hidden = !p.erreur;
  if (p.erreur) {
    erreur.textContent = t(p.erreur);
    return;
  }
  const type = toutesCategories.find((c) => c.cle === $('plongeon-type').value) || categories[0];
  const cat = { ...type, visible: true }; // une copie : une catégorie vide ou masquée a quand même son modèle
  const nom = $('plongeon-nom').value.trim();
  const nomJa = $('plongeon-nom-ja').value.trim();
  memoriserPlongeon();
  await preparerPrefectures().catch(() => {}); // pour écrire la préfecture sous le nom
  const l = {
    id: 'plongeon', lng: p.lng, lat: p.lat, cat, nouveau: false, provisoire: true,
    nom: { en: nom, fr: nom, ja: nomJa || nom }, description: {},
  };
  l.prefecture = trouverPrefecture?.(p.lng, p.lat);
  creerEpingle(l, lieux.length);
  l.el.querySelector('.repere-nom').textContent = enLangue(l.nom);
  reperes.montrer(l.epingle, true);
  modeles3d.provisoires([l]);
  modeles3d.preparer();
  visite.plonger(l, {
    fin: () => {
      reperes.oublier(l.epingle);
      modeles3d.provisoires([]);
    },
  });
}

// ---------------------------------------------------------------- Mode développeur (pas pour les visiteurs)
// Ses outils : le plongeon et l'affiche (onglet Plongeon de la visite), le jeu pas encore sorti. Tout élément
// de classe .dev n'existe qu'en mode développeur (style.css) : pour en ajouter un, lui donner cette classe.
// Le lien secret (…/?dev=<code>) l'ouvre une fois dans un navigateur, qui s'en souvient. Ensuite le bouton
// </> (en bas à droite, au-dessus de la rose) passe d'un clic de la carte normale à la carte développeur.
// Ce n'est pas un verrou (le code du site est public) : c'est caché. Seul le condensé du code est dans le site.
const MEMO_DEV = 'modeDev'; // localStorage : 'oui' (carte développeur) ou 'non' (carte normale) ; absent = pas permis

function lireDev() {
  try { return localStorage.getItem(MEMO_DEV); } catch { return null; }
}

function basculerDev(actif) {
  try { localStorage.setItem(MEMO_DEV, actif ? 'oui' : 'non'); } catch { /* pas grave */ }
  document.body.classList.add('dev-permis');
  document.body.classList.toggle('mode-dev', actif);
  $('btn-dev').setAttribute('aria-pressed', String(actif));
  majBoutonDev();
  if (!actif) {
    // retour à la carte normale : rien des outils ne reste ouvert
    if (jeu?.enCours()) jeu.arreter();
    choisirOnglet(false);
  }
}

function majBoutonDev() {
  const actif = document.body.classList.contains('mode-dev');
  $('btn-dev').title = t(actif ? 'modeDevActif' : 'modeDevNormal');
  $('btn-dev').setAttribute('aria-label', t('modeDev'));
}

/** Le lien secret : on compare son condensé SHA-256 à celui de config.js, puis on l'efface de l'adresse. */
async function ouvrirLienDev() {
  const params = new URLSearchParams(location.search);
  const code = params.get('dev');
  if (code === null) return;
  params.delete('dev');
  const reste = params.toString();
  history.replaceState(null, '', location.pathname + (reste ? `?${reste}` : '') + location.hash);
  if (!crypto.subtle || !CONFIG.devCondense) return;
  const octets = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code));
  const condense = [...new Uint8Array(octets)].map((o) => o.toString(16).padStart(2, '0')).join('');
  if (condense !== CONFIG.devCondense) return;
  basculerDev(true);
  afficherMessage(t('modeDevOuvert'));
}

function brancherDev() {
  if (lireDev()) basculerDev(lireDev() === 'oui');
  ouvrirLienDev().catch(() => {});
  $('btn-dev').addEventListener('click', () => {
    const actif = !document.body.classList.contains('mode-dev');
    basculerDev(actif);
    afficherMessage(t(actif ? 'modeDevActif' : 'modeDevNormal'));
  });
}

// ---------------------------------------------------------------- L'affiche du lieu (onglet Plongeon)
// Pour le montage des TikToks : le carton du nom (comme à l'arrivée du plongeon), en PNG transparent (affiche.js).
// Toujours en anglais, la langue des vidéos. Préparée d'avance pendant qu'on remplit les champs : sur téléphone,
// le partage (« Enregistrer l'image » vers les photos) doit suivre l'appui de près.
let affichePrete = null; // { cle, fichier }
let minuterieAffiche = 0;

function texteAffiche() {
  const nom = $('plongeon-nom').value.trim();
  if (!nom) return null;
  const type = toutesCategories.find((c) => c.cle === $('plongeon-type').value) || categories[0];
  const p = lirePosition($('plongeon-position').value);
  const pref = p.erreur ? null : trouverPrefecture?.(p.lng, p.lat);
  const infos = [type && (type.nom.en || enLangue(type.nom)), pref && PREFECTURES[pref]?.en].filter(Boolean).join(' · ');
  return { nom, nomJa: $('plongeon-nom-ja').value.trim(), infos };
}

async function fabriquerAffiche() {
  await preparerPrefectures().catch(() => {}); // pour la préfecture sous le nom
  const texte = texteAffiche();
  if (!texte) return null;
  const cle = JSON.stringify(texte);
  if (affichePrete?.cle === cle) return affichePrete.fichier;
  const { imageAffiche } = await import('./affiche.js');
  const fichier = new File([await imageAffiche(texte)], `${slug(texte.nom) || 'affiche'}.png`, { type: 'image/png' });
  affichePrete = { cle, fichier };
  return fichier;
}

function preparerAfficheBientot() {
  clearTimeout(minuterieAffiche);
  minuterieAffiche = setTimeout(() => fabriquerAffiche().catch(() => {}), 500);
}

async function partagerAffiche() {
  const erreur = $('plongeon-erreur');
  if (!$('plongeon-nom').value.trim()) {
    erreur.textContent = t('plongeonErreurNom');
    erreur.hidden = false;
    $('plongeon-nom').focus();
    return;
  }
  erreur.hidden = true;
  memoriserPlongeon();
  const bouton = $('btn-affiche');
  bouton.disabled = true;
  try {
    const fichier = await fabriquerAffiche();
    // Sur téléphone : le menu de partage (« Enregistrer l'image » la range avec les photos, pour CapCut…)
    if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [fichier] })) {
      try {
        await navigator.share({ files: [fichier] });
        return;
      } catch (e) {
        if (e.name === 'AbortError') return; // menu fermé sans choisir
        // sinon (partage refusé) : on la télécharge
      }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(fichier);
    a.download = fichier.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    afficherMessage(t('plongeonAfficheEnregistree'));
  } catch (e) {
    console.warn('Affiche', e);
    afficherMessage(t('bravoImageErreur'));
  } finally {
    bouton.disabled = false;
  }
}

// ---------------------------------------------------------------- Jeu « Devine le lieu » (pas encore public)
// Le bouton n'existe qu'en mode développeur (classe .dev) : le jeu sortira plus tard, avec un TikTok.
let jeu = null;
async function lancerJeu() {
  if (!jeu) {
    const { brancherJeu } = await import('./jeu.js');
    jeu = brancherJeu(map, maplibregl, {
      t, enLangue, infos: infosLieu, lieux: () => lieux, reperes, modeles3d, vueDepart, estTelephone, afficherMessage,
      adresse: CONFIG.adresse,
      photo: (l) => (l.photo ? photoAllegee(l.photo) : ''),
      video: (l) => idVideo(l.tiktok),
      prefecture: async (l) => { await preparerPrefectures(); return l.prefecture; },
      langue: () => langue,
      avant: () => {
        if (visite.enCours()) visite.arreter();
        arreterRotation();
        fermerFiche();
        ouvrirMenu(false);
        ouvrirHasard(false);
        ouvrirLegendes(false);
        ouvrirFavoris(false);
        ouvrirVisite(false);
      },
      apres: () => {},
    });
  }
  jeu.lancer();
}

/** Lieux proposés à la visite : tous, ou seulement les favoris si la case est cochée. */
const baseVisite = () => (!$('ligne-visite-favoris').hidden && $('visite-favoris').checked ? lieux.filter(estFavori) : lieux);

function construireVisite() {
  $('ligne-visite-favoris').hidden = !lieux.some(estFavori);
  const n = remplirChoix($('visite-region'), $('visite-type'), baseVisite());
  $('txt-visite-lancer').textContent = t('visiteLancer', n);
  $('btn-visite-lancer').disabled = n === 0;
}

async function ouvrirVisite(ouvrir) {
  $('panneau-visite').hidden = !ouvrir;
  $('btn-visite').setAttribute('aria-expanded', String(ouvrir));
  if (!ouvrir) return;
  ouvrirMenu(false);
  ouvrirHasard(false);
  ouvrirLegendes(false);
  ouvrirFavoris(false);
  if (!$('visite-region').options.length) {
    $('txt-visite-lancer').textContent = '…';
    $('btn-visite-lancer').disabled = true;
  }
  try {
    await preparerPrefectures();
    construireVisite();
  } catch (e) {
    console.warn('Contours des préfectures indisponibles', e);
  }
}

async function lancerVisite(liste) {
  if (!liste.length) return;
  await preparerPrefectures().catch(() => {}); // pour écrire la préfecture sous le nom de chaque lieu
  // Les catégories cachées de la visite réapparaissent, sinon on survolerait des lieux sans repère
  if (liste.some((l) => !l.cat.visible)) {
    for (const l of liste) l.cat.visible = true;
    construireMenu();
    appliquerFiltres();
  }
  visite.lancer(liste, {
    duree: Number($('visite-duree').value) || 7000,
    film: $('visite-film').checked,
    video: $('visite-video').checked,
    son: $('visite-son').checked,
  });
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
  const menuOuvert = ['menu-categories', 'panneau-hasard', 'panneau-favoris', 'panneau-visite'].some((id) => !$(id).hidden);
  return { top: 0, bottom: 0, left: menuOuvert ? 360 : 0, right: 424 };
}

function ouvrirLieu(lieu, { voler = true, hasard = false } = {}) {
  if (visite.enCours()) visite.arreter();
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
  majCoeur(l);
  const date = l.date ? new Intl.DateTimeFormat(langue, { day: 'numeric', month: 'long', year: 'numeric' }).format(l.date) : '';
  $('fiche-date').innerHTML = date
    ? `${l.nouveau ? `<span class="etiquette-nouveau">${esc(t('nouveau'))}</span>` : ''}${esc(t('videoDu', date))}` : '';
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
  // « Plus d'infos » (le lien du tableau) et la page du lieu (outils/fabriquer_pages.py)
  $('fiche-plus').innerHTML = (/^https?:\/\//.test(l.autreLien)
    ? `<a href="${esc(l.autreLien)}" target="_blank" rel="noopener">${esc(t('autreLien'))} ${SVG.sortie}</a>` : '')
    + `<a href="${langue}/${esc(l.id)}/">${esc(t('pageLieu'))}</a>`;
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
  $('lien-liste').textContent = t('listeLieux');
  $('lien-liste').href = `${langue}/`;
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
  for (const l of lieux) {
    l.el.querySelector('.repere-nom').textContent = enLangue(l.nom);
    if (l.nouveau) l.el.querySelector('.repere-nouveau').textContent = t('nouveau');
  }
  $('txt-favoris').textContent = t('favoris');
  $('btn-favoris').title = t('favorisTitre');
  $('txt-visite').textContent = t('visite');
  $('btn-visite').title = t('visiteTitre');
  $('visite-titre-panneau').textContent = t('visiteTitre');
  $('visite-info').textContent = t('visiteInfo');
  $('txt-visite-region').textContent = t('region');
  $('txt-visite-type').textContent = t('type');
  $('txt-visite-favoris').textContent = t('visiteSeulementFavoris');
  $('txt-visite-duree').textContent = t('visiteDuree');
  $('duree-courte').textContent = t('dureeCourte');
  $('duree-normale').textContent = t('dureeNormale');
  $('duree-longue').textContent = t('dureeLongue');
  $('txt-visite-film').textContent = t('visiteFilm');
  $('txt-visite-video').textContent = t('visiteVideo');
  $('txt-visite-son').textContent = t('visiteSon');
  $('onglet-visite').textContent = t('visiteOnglet');
  $('onglet-plongeon').textContent = t('plongeonOnglet');
  $('plongeon-info').textContent = t('plongeonInfo');
  $('txt-plongeon-position').textContent = t('plongeonPosition');
  $('plongeon-aide').textContent = t('plongeonAideGps');
  $('txt-plongeon-nom').textContent = t('plongeonNom');
  $('txt-plongeon-nom-ja').textContent = t('plongeonNomJa');
  $('txt-plongeon-type').textContent = t('plongeonType');
  $('txt-plongeon-lancer').textContent = t('plongeonLancer');
  $('txt-plongeon-affiche').textContent = t('plongeonAffiche');
  majBoutonDev();
  $('plongeon-affiche-aide').textContent = t('plongeonAfficheAide');
  if (!$('volet-plongeon').hidden) choisirOnglet(true); // les types dans la nouvelle langue
  majFavoris();
  visite.majLangue();
  $('txt-jeu').textContent = t('jeu');
  jeu?.majLangue();
  construireMenu();
  if (!$('resultats').hidden) rechercher();
  if (lieuActif) remplirFiche(lieuActif);
  legendes?.majLangue();
  nomsRegions.majLangue(langue);
  compteur?.majLangue();
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
  $('btn-favoris').addEventListener('click', (e) => {
    e.stopPropagation();
    ouvrirFavoris($('panneau-favoris').hidden);
  });
  $('panneau-favoris').addEventListener('click', (e) => {
    e.stopPropagation();
    const retirer = e.target.closest('[data-retirer]');
    const ligne = e.target.closest('[data-lieu]');
    const trouver = (id) => lieux.find((l) => l.id === id);
    if (retirer) basculerFavori(trouver(retirer.dataset.retirer));
    else if (ligne) allerAuLieu(trouver(ligne.dataset.lieu));
    else if (e.target.closest('[data-visite]')) lancerVisite(lieux.filter(estFavori));
  });
  $('onglet-visite').addEventListener('click', () => choisirOnglet(false));
  $('onglet-plongeon').addEventListener('click', () => choisirOnglet(true));
  $('btn-plongeon').addEventListener('click', lancerPlongeon);
  $('btn-affiche').addEventListener('click', partagerAffiche);
  for (const id of ['plongeon-position', 'plongeon-nom', 'plongeon-nom-ja', 'plongeon-type']) {
    $(id).addEventListener(id === 'plongeon-type' ? 'change' : 'input', preparerAfficheBientot);
  }
  $('plongeon-position').addEventListener('input', () => {
    $('plongeon-erreur').hidden = true;
    // le relief du trajet se télécharge dès que la position est collée : il sera prêt pour « Plonger »
    clearTimeout(minuteriePosition);
    minuteriePosition = setTimeout(() => {
      const p = lirePosition($('plongeon-position').value);
      if (p.erreur) return;
      visite.preparerPlongeon(p);
      modeles3d.preparer();
    }, 600);
  });
  $('btn-jeu').addEventListener('click', () => lancerJeu().catch((e) => console.warn('Jeu indisponible', e)));
  $('fiche-favori').addEventListener('click', () => {
    if (!lieuActif) return;
    const premier = !lieux.some(estFavori);
    const oui = basculerFavori(lieuActif);
    afficherMessage(t(oui ? 'favoriAjoute' : 'favoriRetire'));
    const bouton = $('btn-favoris');
    if (oui && premier) {
      bouton.classList.remove('nouvelle');
      void bouton.offsetWidth; // relance la petite animation du bouton qui apparaît
      bouton.classList.add('nouvelle');
    }
  });
  $('btn-visite').addEventListener('click', (e) => {
    e.stopPropagation();
    ouvrirVisite($('panneau-visite').hidden);
  });
  $('panneau-visite').addEventListener('click', (e) => e.stopPropagation());
  $('visite-region').addEventListener('change', construireVisite);
  $('visite-type').addEventListener('change', construireVisite);
  $('visite-favoris').addEventListener('change', construireVisite);
  $('visite-video').addEventListener('change', () => { $('visite-son').disabled = !$('visite-video').checked; });
  $('btn-visite-lancer').addEventListener('click', () => {
    lancerVisite(candidats($('visite-region').value, $('visite-type').value, baseVisite()));
  });
  $('choix-region').addEventListener('change', construireHasard);
  $('choix-type').addEventListener('change', construireHasard);
  $('btn-lancer').addEventListener('click', lancerDe);
  $('fiche-autre').addEventListener('click', lancerDe);
  document.addEventListener('click', () => {
    ouvrirMenu(false);
    ouvrirHasard(false);
    ouvrirLegendes(false);
    ouvrirFavoris(false);
    ouvrirVisite(false);
  });
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
    if (visite.enCours()) return; // pendant la visite, un appui fait juste revenir la barre
    if (jeu?.enCours()) return; // pendant le jeu, un appui pose l'épingle (jeu.js)
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
    else if (!$('panneau-favoris').hidden) ouvrirFavoris(false);
    else if (!$('panneau-visite').hidden) ouvrirVisite(false);
    else fermerFiche();
  });
  window.addEventListener('hashchange', ouvrirDepuisAdresse);
  let aideVue = false;
  try { aideVue = localStorage.getItem('aideVue') === '1'; } catch { /* pas grave */ }
  if (aideVue || location.hash.length > 1) $('aide').classList.add('cachee');
  else setTimeout(cacherAide, 10000);
}

let compteur = null; // compteur de visites (compteur.js), s'il y a un code GoatCounter dans config.js

async function demarrer() {
  if (CONFIG.goatcounter) {
    compteur = brancherCompteur({ code: CONFIG.goatcounter, afficher: !estTelephone(), t, langue: () => langue });
  }
  brancherBoutons();
  brancherDev();
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
    // une fois effacé, l'écran de chargement sort de la page : son logo animé aurait tourné pour rien à chaque image
    setTimeout(() => { $('chargement').style.display = 'none'; }, 900);
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
