// ================================================================
//  Fonctionnement de la carte 3D « Random Japan Place ».
//  Les lieux viennent du tableau Google Sheets (voir config.js).
// ================================================================
import * as maplibregl from 'https://cdn.jsdelivr.net/npm/maplibre-gl@6.11.2/dist/maplibre-gl.mjs';
import { CONFIG, TEXTES } from './config.js';
import { iconeHTML } from './icons.js';
import { PREFECTURES, REGIONS, chargerPrefectures, regionDe } from './regions.js';
import { brancherModeles } from './couche3d.js';
import { animerMer, reglerMer } from './mer.js';
import { brancherOiseaux, choisirOiseaux } from './oiseaux.js';
import { brancherMusique } from './musique.js';
import { brancherNomsRegions } from './noms-regions.js';
import { brancherCompteur } from './compteur.js';
import { lireFavoris, ecrireFavoris, ordreDeVoyage, liensItineraire } from './favoris.js';
import { brancherItineraire, MODES } from './itineraire.js';
import { brancherVisite } from './visite.js';
import { brancherPrecharge } from './precharge.js';
import { brancherTuilesRelief } from './tuiles-relief.js';
import { brancherSocle } from './socle.js';
import { coucheHorizon } from './horizon.js';
import { brancherTexturesRelief } from './textures-relief.js';
import { gererReperes } from './reperes.js';
import { preparerAmbiance } from './ambiance.js';
import { niveauDeDepart, brancherQualite } from './qualite.js';
import { lireSaisons, blocFiche, contenuPanneau, lieuxDuMois, nomMois, iconeDuMois } from './saisons.js';
import { echapper, envoyer, retirerParametres, tactile, jourDuDefi, croixPanneau, typoFr } from './commun.js';

const $ = (id) => document.getElementById(id);
// Pendant l'enregistrement du plongeon (enregistrement.js), c'est le format du film qui compte : vertical comme un
// téléphone, horizontal comme un ordinateur, quel que soit l'appareil
const estTelephone = () => (document.body.classList.contains('enregistre')
  ? document.body.classList.contains('film-vertical') : matchMedia('(max-width: 720px)').matches);

const SVG = {
  balade: '<svg viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3 4 7.5v9L12 21l8-4.5v-9Z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/></g></svg>',
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
  // les façons de voyager (itinéraire des favoris)
  car: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M4 16.5v-4l2-5.5h12l2 5.5v4ZM4 12.5h16"/><circle cx="7.8" cy="16.5" r="1.9" fill="currentColor"/><circle cx="16.2" cy="16.5" r="1.9" fill="currentColor"/></svg>',
  bike: '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="16" r="3.6"/><circle cx="18" cy="16" r="3.6"/><path d="M6 16l3.6-7h6.2L18 16M9.6 9 12 16h-6M15 6.5h2.4l-1.6 2.5M8.2 6.5H11"/></g></svg>',
  foot: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="13" cy="4.6" r="2" fill="currentColor"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12.6 8.2 10.4 14l3 2.4 1.2 5M10.4 14l-2.6 7M12.6 8.2l3.4 3.8 2.6.6M12.6 8.2 9 10l-1.4 3"/></svg>',
  bateau: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M3.5 14.5h17l-2.5 4.5H6ZM7 14.5V10h9l2 4.5M10 10V7h4v3"/></svg>',
  trace: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5.5" cy="18.5" r="2.4" fill="currentColor"/><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M7.6 17.4c3.6-1.6 1.4-5.6 5-6.8 1.5-.5 2.6-.6 3.4-1.2"/><path fill="currentColor" fill-rule="evenodd" d="M18.5 2.5a3.6 3.6 0 0 0-3.6 3.6c0 2.6 3.6 6.2 3.6 6.2s3.6-3.6 3.6-6.2a3.6 3.6 0 0 0-3.6-3.6Zm0 2.2a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8Z"/></svg>',
  sens: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M8 4v15M4.5 7.5 8 4l3.5 3.5M16 20V5M12.5 16.5 16 20l3.5-3.5"/></svg>',
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
  // sinon la langue du navigateur : la première de ses langues préférées que la carte parle (fr-CA → fr, ja-JP → ja)
  for (const l of navigator.languages?.length ? navigator.languages : [navigator.language || 'en']) {
    const court = String(l).slice(0, 2).toLowerCase();
    if (LANGUES.includes(court)) return court;
  }
  return 'en';
}
function t(cle, ...args) {
  const v = TEXTES[langue][cle] ?? TEXTES.en[cle];
  const texte = typeof v === 'function' ? v(...args) : v;
  return langue === 'fr' ? typoFr(texte) : texte;
}
/** Choisit le texte dans la langue affichée ; sinon l'anglais. */
const enLangue = (textes) => {
  const texte = textes?.[langue] || textes?.en || '';
  return langue === 'fr' ? typoFr(texte) : texte;
};
/** « Étiquette : valeur » selon la langue (pour les noms lus par les lecteurs d'écran). */
const deuxPoints = (a, b) => (langue === 'fr' ? `${a}\u00a0: ${b}` : langue === 'ja' ? `${a}：${b}` : `${a}: ${b}`);

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

// Google Sheets répond d'habitude en une seconde, mais il fait parfois attendre une requête 90 s ou plus, ou
// répond 500 après plusieurs secondes (mesuré le 2026-10-09 : 2 requêtes sur 16 ; la carte restait alors sur
// l'écran de chargement). Si la réponse traîne, on redemande en parallèle (la seconde arrive en général tout de
// suite) ; passé ATTENTE_TABLEAU, on prend la copie de secours de la nuit.
const RELANCE_TABLEAU = 2500;
const ATTENTE_TABLEAU = 8000;
// La carte se montre au plus tard après ce délai, même si une tuile de relief traîne (demarrer).
const ATTENTE_CARTE = 12000;

/** Le texte CSV d'un onglet publié : la première de deux requêtes qui aboutit (la seconde part si la première traîne). */
function lireTableau(url) {
  const signal = AbortSignal.timeout?.(ATTENTE_TABLEAU); // vieux navigateurs : pas de limite, comme avant
  let recu = false;
  const demander = async () => {
    const r = await fetch(url, { cache: 'no-store', signal });
    const texte = r.ok ? await r.text() : '';
    if (!texte || texte.trimStart().startsWith('<')) throw new Error(`Tableau Google : ${r.status}`);
    recu = true;
    return texte;
  };
  const relance = new Promise((ok) => setTimeout(ok, RELANCE_TABLEAU)).then(() => {
    if (recu) throw new Error('inutile');
    return demander();
  });
  return Promise.any([demander(), relance]);
}

async function chargerCSV(url, secours) {
  if (url) {
    try {
      const lignes = lireCSV(await lireTableau(url));
      if (lignes.length) return lignes;
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
      // Quand y aller : « cerisiers 4; automne 11 », « toute l'année »… (saisons.js)
      saisons: lireSaisons(champ(r, ['saisons', 'saison', 'seasons', 'season', 'quandpartir', 'meilleuresaison'])),
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
  // le cadre du film (enregistrement.js) : le Japon le remplit comme un téléphone de 390 px ou un écran de 1400 px
  const film = document.body.classList.contains('enregistre') ? Math.log2(map.getContainer().clientWidth / (estTelephone() ? 390 : 1400)) : 0;
  return { center: v.centre, zoom: v.zoom + film, pitch: v.inclinaison, bearing: v.orientation };
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

// Les tuiles de Mapterhorn, sans demander celles du grand large qu'il n'a pas (tuiles-relief.js)
const tuilesRelief = brancherTuilesRelief(maplibregl);
const TUILES_RELIEF = {
  type: 'raster-dem',
  tiles: [tuilesRelief.modele],
  tileSize: 512,
  maxzoom: 12,
  encoding: 'terrarium',
};
// Les couleurs du moment au Japon (ambiance.js) : jour, coucher du soleil, nuit, et la saison. La carte part avec elles ;
// ambiance.js les change ensuite par paliers.
const ambiance = preparerAmbiance();
const P = ambiance.palette;
// La finesse du dessin retenue pour cet appareil (qualite.js) : le lissage des bords se choisit à la création
const qualiteDepart = niveauDeDepart();
let qualite = null; // branchée au chargement de la carte
const MER = P.mer;
const OSM = '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap</a>';
// Liseré d'aquarelle de chaque grande région, le long de ses frontières (comme sur les cartes coloriées à la main)
const LAVIS_REGIONS = {
  hokkaido: '#9a86a8', tohoku: '#7f9f5c', kanto: '#cf9c45', chubu: '#c47f72',
  kansai: '#5f7f9e', chugoku: '#7f9f5c', shikoku: '#cf9c45', kyushu: '#9a86a8',
};

const map = new maplibregl.Map({
  container: 'carte',
  ...vueDepart(),
  minZoom: 3.6,
  maxZoom: 16,
  maxPitch: 78, // très inclinée : la mer jusqu'à l'horizon, du ciel et le soleil couchant (horizon.js)
  // Clic droit + glisser (2026-10-09, « trop rapide, ça part dans tous les sens ») : par défaut la carte tournait
  // de 0,8° et s'inclinait de 0,5° par pixel (toute l'inclinaison en 140 px), et MapLibre inversait le sens de
  // rotation quand la souris passait dans la moitié haute de l'écran. Ici : plus lent, et toujours le même sens.
  // L'élan après le lâcher diminue d'autant (il suit le carré de la vitesse). aroundCenter est lu par le
  // gestionnaire de rotation de MapLibre 6.11 (generateMouseRotationHandler).
  rotateSpeed: 0.3,
  pitchSpeed: -0.25,
  aroundCenter: false,
  maxBounds: [[108, 12], [170, 58]],
  renderWorldCopies: false,
  // Les téléphones ont souvent 3 pixels par point : dessiner en ×2 suffit et évite ~2× plus de calcul. Bords lisses
  // pour les modèles 3D sur les écrans d'ordinateur (les téléphones, ×2, n'en ont pas besoin). Les appareils peu
  // puissants dessinent moins de pixels, sans lissage (qualite.js).
  pixelRatio: qualiteDepart.finesse,
  canvasContextAttributes: { antialias: qualiteDepart.lissage },
  attributionControl: false,
  style: {
    version: 8,
    // Pas de fondu quand une couleur change (ambiance.js) : le relief est redessiné une fois, avec la nouvelle couleur.
    transition: { duration: 0, delay: 0 },
    sources: {
      relief: TUILES_RELIEF,
      ombrage: {
        ...TUILES_RELIEF,
        attribution: '<a href="https://mapterhorn.com/attribution" target="_blank" rel="noopener">© Mapterhorn</a> · Natural Earth',
      },
      // maxzoom : au-delà, MapLibre agrandit les tuiles du dernier niveau au lieu d'en découper de nouvelles.
      // À chaque image, il cherche les tuiles à afficher pour chaque source : moins de niveaux, moins de calcul
      // (les téléphones saccadaient au zoom). Les côtes (Natural Earth) sont grossières : 8 suffit ;
      // les lacs, rivières et frontières (simplifiés à ~60 m) sont exacts à 10.
      cote: { type: 'geojson', data: 'data/cote-japon.geojson', maxzoom: 8 },
      eaux: {
        type: 'geojson',
        data: 'data/eaux-japon.geojson',
        maxzoom: 10,
        attribution: OSM,
      },
      frontieres: { type: 'geojson', data: 'data/frontieres-japon.geojson', maxzoom: 10, attribution: OSM },
      ...ambiance.saison.sources, // les détails de saison (saisons-carte.js)
    },
    layers: [
      { id: 'fond', type: 'background', paint: { 'background-color': MER } },
      // Sous le relief (qui cache la moitié côté terre) : l'ombre des îles sur la mer, puis les fines
      // lignes d'eau parallèles aux côtes des cartes gravées. Vues de loin seulement : le trait de côte
      // (Natural Earth) est trop simplifié pour coller au relief de près. La houle (mer.js) les remplace
      // dès qu'elle est prête, avec une ombre plus ronde : ce trait flou fait des pointes autour des petites îles.
      {
        id: 'cote-ombre',
        type: 'line',
        source: 'cote',
        paint: {
          'line-color': P.ombreIles,
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
          'line-color': P.eau,
          'line-width': 0.8,
          'line-gap-width': ['interpolate', ['linear'], ['zoom'], 4.5, pres * 2, 7, loin * 2],
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 6.5, opacite, 8.5, 0],
        },
      })),
      ...ambiance.saison.avant('couleurs-relief'), // la banquise d'Okhotsk, l'hiver
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
          // Couleurs d'une vieille carte en relief : sable pâle, ocre, terre d'ombre, os blanc des sommets, teintées
          // par la saison et l'heure au Japon (ambiance.js, qui garde ces paliers et cette marge autour de 0).
          'color-relief-color': P.rampe,
        },
      },
      ...ambiance.saison.avant('ombrage'), // la neige au sol du nord, les touches de fleurs et de feuillages
      {
        id: 'ombrage',
        type: 'hillshade',
        source: 'ombrage',
        paint: {
          'hillshade-exaggeration': P.exag,
          'hillshade-illumination-anchor': 'map',
          'hillshade-illumination-direction': P.direction,
          // ombres terre d'ombre, lumières couleur de papier : le relief sort de la feuille (le jour ; voir ambiance.js)
          'hillshade-shadow-color': P.ombre,
          'hillshade-highlight-color': P.lumiere,
          'hillshade-accent-color': P.accent,
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
          'line-opacity': P.lavis,
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
          'line-color': P.frontieresFond,
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
          'line-color': P.frontieres,
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
          'line-color': P.frontieres,
          'line-width': ['interpolate', ['linear'], ['zoom'], 4, 1.1, 7, 1.9, 12, 2.8],
          'line-dasharray': [4, 1.6, 0.1, 1.6],
          'line-opacity': 0.9,
        },
      },
      // Lacs et grandes rivières (OpenStreetMap, voir outils/fabriquer_eaux.py), peints de la couleur de la
      // mer par-dessus le relief et cernés d'un fin trait d'eau. De loin, seules les plus longues rivières
      // se voient ; les autres apparaissent en zoomant. km = étendue de la rivière (40 à 240 km).
      ...[['rivieres-bord', P.eau, 1.3], ['rivieres', MER, 0]].map(([id, couleur, bord]) => {
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
      ...ambiance.saison.avant('lacs-bord'), // les lacs gelés
      {
        id: 'lacs-bord',
        type: 'line',
        source: 'eaux',
        filter: ['==', ['get', 't'], 'lac'],
        paint: {
          'line-color': P.eau,
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
          'line-color': P.encreCote,
          'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.6, 7, 1.1],
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 6, 0.75, 8, 0],
        },
      },
      // (les pays voisins ne sont plus cachés par des aplats couleur de mer : leur relief est mis à 0 m, tuiles-relief.js)
      ...ambiance.saison.avant('fin'), // le tapis de feuilles ou de pétales tombés, de près
    ],
    terrain: { source: 'relief', exaggeration: exageration(vueDepart().zoom) },
    // Au-delà de l'horizon, du parchemin ; au loin, un voile clair, comme sur une vieille gravure
    sky: {
      'sky-color': P.ciel,
      'horizon-color': P.horizon,
      'fog-color': P.brume,
      'fog-ground-blend': 0.35,
      'horizon-fog-blend': 0.6,
      'sky-horizon-blend': 0.85,
      'atmosphere-blend': 0,
    },
  },
});
map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');
// Les sources de la carte (© Mapterhorn, © OpenStreetMap…) : un « i » qui les ouvre. MapLibre les montre ouvertes au
// départ et les replie quand on fait glisser la carte ; ouvertes, elles cachaient la carte sur téléphone (2026-10-21).
// Les règles d'attribution d'OpenStreetMap acceptent qu'elles se replient seules si on a pu les voir : 5 s après l'écran
// de chargement (replierSources dans demarrer), ou dès qu'on touche la carte. Pendant une visite ou un plongeon,
// souvent filmés, elles restent ouvertes.
const sources = map.getContainer().querySelector('.maplibregl-ctrl-attrib');
function montrerSources(oui) {
  if (!sources?.classList.contains('maplibregl-compact')) return; // pas encore de sources : MapLibre les ouvrira
  sources.classList.toggle('maplibregl-compact-show', oui);
  sources.toggleAttribute('open', oui);
}
const replierSources = () => { if (!document.body.classList.contains('en-visite')) montrerSources(false); };
map.getCanvasContainer().addEventListener('pointerdown', replierSources);
map.on('movestart', (e) => { if (e.originalEvent) replierSources(); });
let sourcesEnVisite = false;
new MutationObserver(() => {
  const v = document.body.classList.contains('en-visite');
  if (v !== sourcesEnVisite) montrerSources(sourcesEnVisite = v);
}).observe(document.body, { attributes: true, attributeFilter: ['class'] });
map.on('error', (e) => console.warn('Carte :', e.error?.message || e));
window.carte = map; // pratique pour inspecter la carte depuis la console du navigateur

// ---------------------------------------------------------------- Décor de vieille carte
// Papier vieilli (grain, taches, bords brunis) : glissé juste après l'image de la carte, donc
// par-dessus le relief mais sous les lieux, qui restent nets.
map.getCanvasContainer().insertBefore($('papier'), map.getCanvas().nextSibling);

// Les repères HTML ne restent sur la carte que près de l'écran (voir reperes.js : sinon le zoom saccade)
// ?points=non : tous les lieux en repères HTML, même de loin (les films de outils/video les animent un à un)
const reperes = gererReperes(map, { points: new URLSearchParams(location.search).get('points') !== 'non' });

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
animerMer(map, maplibregl, { mers: MERS.map((m) => m.ou), reperes, tuiles: tuilesRelief });

// Les grues du Japon : de près, un vol de trois grues passe de temps en temps au-dessus de la carte
brancherOiseaux(map, maplibregl, reperes);

// Petits modèles 3D des lieux (un par icône de catégorie), visibles quand on zoome
const modeles3d = brancherModeles(map, maplibregl, () => lieux);

// Rose des vents : elle tourne avec la carte (le N montre toujours le nord)
function tournerRose() {
  $('rose').style.transform = `rotate(${-map.getBearing()}deg)`;
}
map.on('rotate', tournerRose);
tournerRose();

// On peut aussi l'attraper (souris ou doigt) et la faire tourner : la carte tourne avec elle, le N suit le
// pointeur (2026-10-09). Un simple appui remet toujours le nord en haut ; ← → la tournent de 15° au clavier.
function brancherRose() {
  const bouton = $('btn-rose');
  const SEUIL = 4; // px : en dessous, c'est un appui, pas un geste
  let geste = null;
  let avalerClic = false;
  const angle = (e) => {
    const r = bouton.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    // tout près du centre, l'angle saute au moindre mouvement : on le garde tel quel
    return Math.hypot(dx, dy) < 6 ? null : (Math.atan2(dy, dx) * 180) / Math.PI;
  };
  bouton.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    avalerClic = false;
    geste = { id: e.pointerId, x: e.clientX, y: e.clientY, angle: angle(e), cap: map.getBearing(), tourne: false };
    bouton.setPointerCapture(e.pointerId);
  });
  bouton.addEventListener('pointermove', (e) => {
    if (!geste || e.pointerId !== geste.id) return;
    if (!geste.tourne) {
      if (Math.hypot(e.clientX - geste.x, e.clientY - geste.y) < SEUIL) return;
      geste.tourne = true;
      arreterRotation();
      map.stop();
      geste.cap = map.getBearing();
      bouton.classList.add('attrapee');
    }
    const a = angle(e);
    if (a === null) return;
    if (geste.angle === null) { geste.angle = a; geste.cap = map.getBearing(); return; }
    // la rose tourne de -cap : pour qu'elle suive le pointeur, la carte tourne d'autant dans l'autre sens
    // (originalEvent : un geste du visiteur, qui met la visite guidée en pause comme un glisser sur la carte)
    map.setBearing(geste.cap - (a - geste.angle), { originalEvent: e });
  });
  const lacher = (e) => {
    if (!geste || e.pointerId !== geste.id) return;
    if (geste.tourne) {
      avalerClic = true; // le clic qui suit le geste ne doit pas remettre le nord en haut
      bouton.classList.remove('attrapee');
      // comme sur la carte : tout près du nord, on s'y cale
      const cap = map.getBearing();
      if (cap !== 0 && Math.abs(cap) < 7) map.easeTo({ bearing: 0, duration: 300 });
    }
    geste = null;
  };
  bouton.addEventListener('pointerup', lacher);
  bouton.addEventListener('pointercancel', lacher);
  bouton.addEventListener('click', () => {
    if (avalerClic) { avalerClic = false; return; }
    arreterRotation();
    map.easeTo({ bearing: 0, duration: 1000 });
  });
  bouton.addEventListener('keydown', (e) => {
    const sens = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (!sens) return;
    e.preventDefault();
    arreterRotation();
    // → tourne la rose dans le sens des aiguilles d'une montre, comme le geste
    map.easeTo({ bearing: map.getBearing() - sens * 15, duration: 300 });
  });
}

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

// Au repos, vue de loin, la carte se redessinait sans arrêt (trouvé le 2026-10-19 : 160 fois par seconde sans limite
// d'écran, au lieu des 15 de la houle ; la puce graphique d'un PC portable travaillait à fond même sans geste).
// MapLibre refait le placement des symboles dès que la matrice de la caméra diffère, au bit près, de celle du dernier
// placement ; or, de loin, son plan le plus lointain ressort à chaque image avec un écart d'un dix-millionième : le
// placement n'était jamais fini et chaque image en redemandait une. Ici, les matrices sont comparées à un
// millionième près ; le reste est la règle de MapLibre 6.11 (rouage interne, version figée : à revérifier en cas de
// mise à jour).
function corrigerPlacement() {
  const style = map.style;
  if (typeof style?._placementInputsChanged !== 'function') return;
  const proches = (a, b) => {
    for (let i = 0; i < 16; i++) if (Math.abs(a[i] - b[i]) > 1e-6 * Math.max(1, Math.abs(a[i]))) return false;
    return true;
  };
  style._placementInputsChanged = function (transform, boites, croisees) {
    const dernier = this.pauseablePlacement;
    if (!dernier) return true;
    const p = dernier.placement;
    return this._symbolPlacementTriggered || this._placedProjectionTransition !== this.projection?.transitionState
      || dernier._showCollisionBoxes !== boites || p.collisionGroups.crossSourceCollisions !== croisees
      || p.transform.renderWorldCopies !== transform.renderWorldCopies
      || !proches(p.transform.modelViewProjectionMatrix, transform.modelViewProjectionMatrix);
  };
}
corrigerPlacement();

// Des montagnes de la même hauteur quand on pivote (2026-10-09). Le relief 3D est fait de tuiles d'altitude
// (Mapterhorn), plus ou moins détaillées ; dans les moins détaillées, les sommets sont moyennés et plus bas
// (le Fuji fait 2 709 m au niveau 4, 3 377 au 5, 3 599 au 6). MapLibre prenait ses altitudes deux niveaux
// sous la vue, un de plus au premier plan et un ou deux de moins au loin : en tournant la carte, une chaîne
// passait du lointain au proche et grandissait de 20 à 30 %. Désormais, de loin (zoom < 9,5, où les écarts
// entre niveaux sont grands) :
// - toutes les tuiles du maillage prennent leurs altitudes au même niveau, un cran plus détaillé qu'avant
//   (zoom de la vue - 1, déjà téléchargé par la carte) : celles du premier plan, plus fines, lisent celles de
//   leur tuile parente ;
// - les tuiles du milieu de l'écran ne descendent plus d'un niveau : seulement tout au fond, vers l'horizon
//   (plus de deux fois plus loin que le centre de l'écran) ;
// - le maillage est presque deux fois plus fin (240 au lieu de 128 ; pas plus : au-delà de ~250, les sommets ne
//   tiennent plus dans les index 16 bits de MapLibre), pour que les sommets aient le même dessin partout.
// De près, les niveaux ne diffèrent que de 1 à 3 % : on garde le réglage de MapLibre (avec les altitudes un
// cran plus détaillées). Ce sont des rouages internes de MapLibre 6.11 (version figée) : à revérifier en cas
// de mise à jour.
const ZOOM_RELIEF_UNIFORME = 9.5;
let reliefStabilise = false, maillageFin = null;
let maillageLoin = qualiteDepart.maillage; // 240, moins sur les appareils peu puissants (qualite.js)
function stabiliserRelief() {
  try {
    const source = map.style?.tileManagers?.relief?.getSource?.();
    const terrain = map.terrain?.tileManager;
    const fournisseur = map._camera?.transform?.getCoveringTilesDetailsProvider?.();
    if (!source || !terrain?.getSourceTile || typeof terrain.deltaZoom !== 'number' || !fournisseur?.allowVariableZoom) return;
    map.setSourceTileLodParams(9.314, 3, 'relief'); // le réglage d'origine de MapLibre
    const deMapLibre = source.calculateTileZoom;
    if (typeof deMapLibre !== 'function') return;
    // le niveau des tuiles : celui de MapLibre, sans descendre au milieu de l'écran
    const niveau = (zCentre, d2, dz, dCentre, fov) => {
      const z = deMapLibre(zCentre, d2, dz, dCentre, fov);
      if (zCentre >= ZOOM_RELIEF_UNIFORME - 1) return z; // zCentre = zoom de la vue - 1
      const r = Math.hypot(d2, dz) / dCentre;
      return Math.max(z, zCentre - (r <= 2 ? 0 : 1.5 * Math.log2(r / 2)));
    };
    source.calculateTileZoom = niveau; // les tuiles d'altitude téléchargées…
    // … et les tuiles du maillage 3D, que MapLibre calcule sans passer par la source : on lui glisse la même règle
    const proto = Object.getPrototypeOf(fournisseur);
    const avant = proto.allowVariableZoom;
    const taille = terrain.tileSize;
    proto.allowVariableZoom = function (transform, options) {
      if (options.terrain && options.tileSize === taille && !('calculateTileZoom' in options)) options.calculateTileZoom = niveau;
      return avant.call(this, transform, options);
    };
    // les altitudes d'une tuile : celles de son niveau (deltaZoom 0), ou de sa parente au niveau commun
    terrain.deltaZoom = 0;
    terrain._sourceTileCache = {}; // MapLibre y garde, par tuile, la tuile d'altitudes choisie avec l'ancien réglage
    const altitudes = terrain.getSourceTile.bind(terrain);
    let communAvant = null;
    terrain.getSourceTile = (tileID, chercher) => {
      const z = map.getZoom();
      const commun = z < ZOOM_RELIEF_UNIFORME ? Math.floor(z - 1) : null;
      if (commun !== communAvant) {
        communAvant = commun;
        map.terrain.resetElevationCache?.(); // les altitudes mémorisées par tuile viennent peut-être d'un autre niveau
      }
      if (commun !== null && commun >= 0 && tileID.overscaledZ > commun) return altitudes(tileID.scaledTo(commun), chercher);
      return altitudes(tileID, chercher);
    };
    reliefStabilise = true;
    majMaillage();
  } catch (e) {
    console.warn('Relief : réglage des niveaux de détail impossible', e);
  }
}

// À chaque image, MapLibre cherche pour chaque tuile des couches peintes sur le relief les tuiles du relief qui la
// recouvrent, et prépare une matrice pour chaque paire avant de regarder si elles se touchent : 3,5 % du temps du
// processeur pendant un zoom (mesuré le 2026-10-19). On ne lui passe que les tuiles du relief liées à celle cherchée
// (la même, une parente ou une enfant, comme son propre test) : même résultat, 2,5 fois moins de temps. Rouage
// interne de MapLibre 6.11 (version figée) : à revérifier en cas de mise à jour.
function allegerCorrespondances() {
  const gestion = map.terrain?.tileManager;
  const proto = gestion && Object.getPrototypeOf(gestion);
  const avant = proto?._getTerrainCoordsForRegularTile;
  if (typeof avant !== 'function' || !Array.isArray(gestion._renderableTilesKeys)) return;
  proto._getTerrainCoordsForRegularTile = function (tileID) {
    const toutes = this._renderableTilesKeys;
    const c = tileID.canonical;
    const liees = toutes.filter((k) => {
      const r = this._tiles[k]?.tileID.canonical;
      return r && (r.equals(c) || r.isChildOf(c) || c.isChildOf(r));
    });
    if (liees.length === toutes.length) return avant.call(this, tileID);
    this._renderableTilesKeys = liees;
    try { return avant.call(this, tileID); } finally { this._renderableTilesKeys = toutes; }
  };
}
map.once('load', stabiliserRelief);
map.once('load', allegerCorrespondances);
// Les textures du relief redessinées moins souvent, et une par une (textures-relief.js) : les saccades des puces
// graphiques intégrées dans la vue de loin (2026-10-24)
map.once('load', () => {
  try { brancherTexturesRelief(map); } catch (e) { console.warn('Relief : textures inchangées', e); }
});
// La mer jusqu'à l'horizon, sous tout le reste (horizon.js) : ajoutée avant les premières textures du relief
const ajouterHorizon = () => { try { map.addLayer(coucheHorizon(map), 'fond'); } catch (e) { console.warn('Horizon indisponible', e); } };
if (map.style?._loaded) ajouterHorizon(); else map.once('style.load', ajouterHorizon);
// Un relief grossier toujours chargé autour de la vue : un lancer rapide ne montre plus la mer à la place de la terre
map.once('load', () => {
  try {
    brancherSocle(map, ['relief', 'ombrage'], tuilesRelief);
  } catch (e) {
    console.warn('Relief : socle impossible', e);
  }
});
// La finesse du dessin selon l'appareil : mesurée pendant que la carte bouge (qualite.js)
map.once('load', () => {
  try {
    // pendant un mouvement, MapLibre télécharge au plus MAX_PARALLEL_IMAGE_REQUESTS_PER_FRAME tuiles à la fois
    const telechargements = (n) => { if (maplibregl.config) maplibregl.config.MAX_PARALLEL_IMAGE_REQUESTS_PER_FRAME = n; };
    qualite = brancherQualite(map, { maillage: changerMaillage, mer: reglerMer, telechargements, t, afficherMessage, avant: $('btn-dev') });
  } catch (e) {
    console.warn('Qualité automatique indisponible', e);
  }
});
// « load » ne vient qu'une fois : s'il est passé avant l'arrivée du tableau, demarrer() ne l'attend pas
let carteChargee = false;
map.once('load', () => { carteChargee = true; });

/** Le maillage plus fin pour les vues de loin (voir stabiliserRelief). */
function majMaillage() {
  const relief = map.terrain;
  if (!reliefStabilise || !relief?._meshCache) return;
  const fin = map.getZoom() < ZOOM_RELIEF_UNIFORME;
  if (fin === maillageFin) return;
  maillageFin = fin;
  relief.meshSize = fin ? maillageLoin : 128;
  for (const m of Object.values(relief._meshCache)) m.destroy?.();
  relief._meshCache = {}; // refait au prochain dessin
  map.triggerRepaint();
}

/** Le maillage de loin selon l'appareil (qualite.js) : 240, 180 ou 128. */
function changerMaillage(n) {
  if (n === maillageLoin) return;
  maillageLoin = n;
  maillageFin = null; // refait au prochain appel
  majMaillage();
}

function majSelonZoom() {
  const z = map.getZoom();
  majMaillage();
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
    reperes.taille(taille); // (les épingles dessinées sur la toile, points.js)
  }
  const loin = z < ZOOM_POINTS;
  if (loin !== vueLointaine) {
    vueLointaine = loin;
    map.getContainer().classList.toggle('loin', loin);
    reperes.vueLointaine(loin);
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
  reperes.fluide(false); // les repères de nouveau arrondis au pixel : nets au repos
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
  el.innerHTML = `<span class="repere-tete">${iconeHTML(lieu.cat.icone)}<span class="repere-coeur">${SVG.coeur}</span><span class="repere-nouveau"></span><span class="repere-etape"></span><span class="repere-carrousel"></span></span><span class="repere-nom"></span>`;
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
    point: true, // de loin, un point dessiné avec les autres (points.js)
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
        <label class="case" title="${echapper(t('afficherSurCarte'))}">
          <input type="checkbox" ${c.visible ? 'checked' : ''} aria-label="${echapper(enLangue(c.nom))}">
          <span class="coche">${SVG.coche}</span>
        </label>
        <button type="button" class="deplier" aria-expanded="${!!c.deplie}" title="${echapper(t('voirLieux'))}">
          <span class="pastille">${iconeHTML(c.icone)}</span>
          <span class="nom-cat">${echapper(enLangue(c.nom))}</span>
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
      if (l.nouveau) b.insertAdjacentHTML('beforeend', ` <span class="etiquette-nouveau">${echapper(t('nouveau'))}</span>`);
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
        <span class="nom-cat">${echapper(t('nouveautes'))}</span>
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
    b.innerHTML = `${echapper(enLangue(l.nom))} <span class="date-courte">${echapper(jour.format(l.date))}</span>`;
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
  if (estTelephone()) fermerPanneaux();
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
  if (!ouvrir) return;
  fermerPanneaux('menu-categories');
  if (!estTelephone()) $('recherche').focus();
}

/**
 * Le menu du téléphone (le bouton ☰ de la barre du bas) : une feuille avec toutes les fonctions. Ses cases ouvrent les
 * vrais boutons (cachés sur téléphone) ; à l'ouverture, elles reprennent leurs compteurs et Halloween s'il a lieu.
 */
function ouvrirMenuMobile(ouvrir) {
  $('panneau-menu').hidden = !ouvrir;
  $('btn-menu-mobile').setAttribute('aria-expanded', String(ouvrir));
  if (!ouvrir) return;
  fermerPanneaux('panneau-menu');
  $('menu-compteur-categories').textContent = $('compteur').textContent;
  $('menu-compteur-legendes').textContent = $('compteur-legendes').textContent;
  $('menu-compteur-favoris').textContent = $('compteur-favoris').textContent;
  $('menu-halloween').hidden = $('btn-halloween').hidden;
  $('menu-txt-halloween').textContent = $('txt-halloween').textContent;
  $('menu-compteur-halloween').textContent = $('compteur-halloween').textContent;
  $('menu-musique').classList.toggle('joue', $('btn-musique').classList.contains('joue'));
}

// ---------------------------------------------------------------- Les panneaux
// Un seul ouvert à la fois : en ouvrir un ferme les autres ; un appui ailleurs sur la page, ou Échap, le ferme.
// Pour chacun : son bouton et la fonction qui l'ouvre ou le ferme (avec ses petits effets : le résumé de
// l'itinéraire sous les favoris, le contenu du calendrier…).
const PANNEAUX = {
  'menu-categories': ['btn-categories', ouvrirMenu],
  'panneau-hasard': ['btn-hasard', ouvrirHasard],
  'panneau-legendes': ['btn-legendes', ouvrirLegendes],
  'panneau-favoris': ['btn-favoris', ouvrirFavoris],
  'panneau-visite': ['btn-visite', ouvrirVisite],
  'panneau-saisons': ['btn-saisons', ouvrirSaisons],
  'panneau-musique': ['btn-musique', ouvrirMusique],
  'panneau-halloween': ['btn-halloween', ouvrirHalloween],
  'panneau-menu': ['btn-menu-mobile', ouvrirMenuMobile],
};

/** Ferme tous les panneaux (sauf celui qu'on ouvre). */
function fermerPanneaux(sauf) {
  for (const [id, [, ouvrir]] of Object.entries(PANNEAUX)) if (id !== sauf) ouvrir(false);
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
  fermerPanneaux('panneau-legendes');
  legendes?.remplirPanneau();
}

// ---------------------------------------------------------------- Halloween (halloween.js)
// Un événement : du CONFIG.halloween.debut à minuit la veille de .fin (heure de l'appareil), seulement en mode
// développeur tant que .public est faux. Le module se charge quand l'événement commence ; il s'éteint (tout ce qu'il
// a posé s'en va) en sortant du mode développeur ou quand l'événement finit, même la page ouverte.
let halloween = null; // la promesse du module branché

function halloweenVoulu() {
  const h = CONFIG.halloween;
  if (!h || ambiance.classique) return false; // pas dans les films promo (?ambiance=non)
  const maintenant = Date.now();
  if (maintenant < new Date(`${h.debut}T00:00`).getTime() || maintenant >= new Date(`${h.fin}T00:00`).getTime()) return false;
  return h.public || document.body.classList.contains('mode-dev');
}

function majHalloween() {
  const voulu = halloweenVoulu();
  if (!voulu && !halloween) return;
  halloween ??= import('./halloween.js')
    .then(({ brancherHalloween }) => brancherHalloween(map, maplibregl, {
      langue: () => langue, afficherMessage, fermerFiche, reperes, lieux: () => lieux, ambiance: ambianceCarte,
      choisirOiseaux, adresse: CONFIG.adresse, nomSite: CONFIG.titre, fermerPanneau: () => ouvrirHalloween(false),
    }))
    .catch((e) => { console.warn('Halloween indisponible', e); halloween = null; });
  halloween.then((h) => {
    if (!h) return;
    if (halloweenVoulu()) h.allumer();
    else h.eteindre();
  });
}

/** Le panneau « Halloween au Japon » : l'événement, le défilé des cent démons, la chasse aux yōkai. */
function ouvrirHalloween(ouvrir) {
  $('panneau-halloween').hidden = !ouvrir;
  $('btn-halloween').setAttribute('aria-expanded', String(ouvrir));
  if (!ouvrir) return;
  fermerPanneaux('panneau-halloween');
  halloween?.then((h) => h?.remplirPanneau());
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
  const nb = (region, type) => candidats(region, type, base).length;
  const region = selRegion.value;
  const type = selType.value;
  const option = (valeur, texte, n, choisi) => {
    const o = new Option(`${texte} (${n})`, valeur);
    o.disabled = n === 0 && valeur !== choisi;
    return o;
  };

  selRegion.replaceChildren(option('', t('partout'), nb('', type), region));
  for (const r of REGIONS) {
    const prefs = r.prefectures.filter((p) => lieux.some((l) => l.prefecture === p));
    if (!prefs.length) continue;
    const toute = option(`r:${r.cle}`, r.prefectures.length > 1 ? t('toutLaRegion', enLangue(r.nom)) : enLangue(r.nom),
      nb(`r:${r.cle}`, type), region);
    if (r.prefectures.length === 1) { selRegion.append(toute); continue; }
    const groupe = document.createElement('optgroup');
    groupe.label = enLangue(r.nom);
    groupe.append(toute);
    for (const p of prefs) groupe.append(option(`p:${p}`, enLangue(PREFECTURES[p]), nb(`p:${p}`, type), region));
    selRegion.append(groupe);
  }
  selRegion.value = region;
  if (selRegion.value !== region) selRegion.value = '';

  selType.replaceChildren(option('', t('tousTypes'), nb(selRegion.value, ''), type));
  for (const c of categories) selType.append(option(c.cle, enLangue(c.nom), nb(selRegion.value, c.cle), type));
  selType.value = type;
  if (selType.value !== type) selType.value = '';

  return nb(selRegion.value, selType.value);
}

async function ouvrirHasard(ouvrir) {
  $('panneau-hasard').hidden = !ouvrir;
  $('btn-hasard').setAttribute('aria-expanded', String(ouvrir));
  if (!ouvrir) return;
  fermerPanneaux('panneau-hasard');
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

/** Le bouton « Favoris » : caché tant qu'il n'y en a pas, sauf sur téléphone, où c'est un raccourci en haut de l'écran. */
const voirBoutonFavoris = (n) => n > 0 || !$('panneau-favoris').hidden || estTelephone();

/** Le cœur de la fiche, le bouton « Favoris » et les listes ouvertes. */
function majFavoris() {
  const n = lieux.filter(estFavori).length;
  $('btn-favoris').hidden = !voirBoutonFavoris(n);
  $('compteur-favoris').textContent = n || '';
  if (lieuActif) majCoeur(lieuActif);
  if (!$('panneau-favoris').hidden) remplirFavoris();
  if ($('visite-region').options.length) construireVisite();
  if (!voyageRecu && (itineraireActuel || calculItineraire)) retracerBientot();
}

function majCoeur(l) {
  const b = $('fiche-favori');
  const oui = estFavori(l);
  b.setAttribute('aria-pressed', String(oui));
  b.title = t(oui ? 'retirerFavori' : 'ajouterFavori');
  b.setAttribute('aria-label', b.title);
}

/** Les favoris dans l'ordre du voyage (ou à l'envers, si on a inversé le sens). */
function listeFavoris() {
  const liste = ordreDeVoyage(lieux.filter(estFavori));
  return sensInverse ? liste.reverse() : liste;
}

/** Les lieux de l'itinéraire : le voyage reçu par un lien (dans son ordre), sinon les favoris. */
const listeItineraire = () => voyageRecu?.lieux || listeFavoris();

/** La liste des favoris, dans l'ordre du voyage, avec l'itinéraire sur la carte, Google Maps et la visite guidée. */
function remplirFavoris() {
  const panneau = $('panneau-favoris');
  const liste = listeFavoris();
  const titre = `<p class="hasard-titre">${echapper(t('favorisTitre'))}</p>`;
  if (!liste.length) {
    panneau.innerHTML = `${titre}<p class="panneau-info">${echapper(t('favorisVide'))}</p>`;
    return;
  }
  const it = itineraireActuel;
  const lignes = liste.map((l, i) => `<li>
      <button type="button" class="favori-ligne" data-lieu="${echapper(l.id)}">
        <span class="favori-num">${i + 1}</span>
        <span class="pastille" style="--c:${l.cat.couleur}">${iconeHTML(l.cat.icone)}</span>
        <span class="favori-textes"><b>${echapper(enLangue(l.nom))}</b><small>${echapper(infosLieu(l))}</small></span>
      </button>
      <button type="button" class="favori-retirer" data-retirer="${echapper(l.id)}" title="${echapper(t('retirer'))}" aria-label="${echapper(deuxPoints(t('retirer'), enLangue(l.nom)))}">${SVG.croix}</button>
    </li>${it?.trajets[i]?.de === l && it.trajets[i].a === liste[i + 1] ? ligneTrajet(it.trajets[i], it.mode) : ''}`).join('');
  const liens = liensItineraire(liste, estTelephone() ? 5 : 10);
  const itineraires = liens.map((x) => `<a class="btn-secondaire btn-itineraire" href="${echapper(x.url)}" target="_blank" rel="noopener">${SVG.route}<span>${echapper(liens.length > 1 ? t('itinerairePartie', x.de, x.a) : t('itineraireFavoris'))}</span></a>`).join('');
  panneau.innerHTML = `${titre}<p class="panneau-info">${echapper(t('favorisInfo', liste.length))}</p>
    ${liste.length > 1 ? blocItineraire() : ''}
    <ol class="liste-favoris">${lignes}</ol>
    ${liste.length > 1 ? `<div class="menu-actions sens"><button type="button" data-inverser>${SVG.sens}<span>${echapper(t('inverserSens'))}</span></button></div>` : ''}
    <div class="favoris-actions">${itineraires}
      <button type="button" class="btn-secondaire" data-visite>${SVG.camera}<span>${echapper(t('visiteFavoris'))}</span></button>
    </div>
    ${it ? `<p class="itineraire-note">${echapper(t('itineraireNote'))}</p>` : ''}`;
  // La préfecture de chaque lieu arrive avec les contours (une seule fois)
  if (liste.some((l) => !l.prefecture)) {
    preparerPrefectures().then(() => { if (!panneau.hidden && liste.every((l) => l.prefecture)) remplirFavoris(); }).catch(() => {});
  }
}

function ouvrirFavoris(ouvrir) {
  if (ouvrir && voyageRecu) effacerItineraire(); // on revient à ses propres favoris
  $('panneau-favoris').hidden = !ouvrir;
  $('btn-favoris').setAttribute('aria-expanded', String(ouvrir));
  majResume();
  if (!ouvrir) {
    $('btn-favoris').hidden = !voirBoutonFavoris(lieux.filter(estFavori).length);
    return;
  }
  fermerPanneaux('panneau-favoris');
  remplirFavoris();
}

// ---------------------------------------------------------------- Itinéraire des favoris sur la carte (itineraire.js)
// Les routes à prendre en trait rouge, le temps de chaque trajet sur la carte, et dans le panneau des favoris
// le total, la distance, les grandes routes et les bateaux. En voiture, à vélo ou à pied.
let modeItineraire = (() => {
  try { const m = localStorage.getItem('modeItineraire'); return MODES.includes(m) ? m : 'car'; } catch { return 'car'; }
})();
let sensInverse = false; // le voyage part du nord-est au lieu du sud-ouest
let itineraireActuel = null; // l'itinéraire montré sur la carte
let voyageRecu = null; // { lieux, mode } : un voyage ouvert par un lien …/?voyage= (sa route remplace celle des favoris)
let calculItineraire = null; // jeton du calcul en cours (un nouveau calcul fait oublier l'ancien)
let erreurItineraire = '';
let minuterieTrace;

/** « 2 h 05 », « 45 min », « 2時間5分 ». */
function texteDuree(secondes) {
  const m = Math.max(1, Math.round(secondes / 60));
  const h = Math.floor(m / 60), mn = m % 60;
  if (langue === 'ja') return h ? `${h}時間${mn ? `${mn}分` : ''}` : `${mn}分`;
  return h ? `${h} h ${String(mn).padStart(2, '0')}` : `${mn} min`;
}
const texteDistance = (metres) => `${(metres / 1000).toLocaleString(langue, { maximumFractionDigits: metres < 10000 ? 1 : 0 })} km`;

/**
 * Le nom d'une grande route pour le panneau : en japonais son nom (山陽自動車道) ; ailleurs le numéro
 * d'autoroute (E2), celui d'une route nationale (« route 2 »), sinon rien (un nom japonais ne se lit pas).
 */
function nomRoute(r) {
  if (langue === 'ja') return r.nom || r.ref;
  if (/^E\d+[A-Z]?$/.test(r.ref)) return r.ref;
  const n = r.nom.match(/^国道(\d+)号/)?.[1];
  return n ? t('routeNationale', n) : '';
}

const itineraire = brancherItineraire(map, maplibregl, {
  reperes,
  texteTrajet: (tr, mode) => (tr.sansRoute ? echapper(t('sansRouteCourt')) : `${SVG[mode]}${texteDuree(tr.duree)}`),
});

/** Une ligne de trajet entre deux favoris : temps, distance, grandes routes, bateau. */
function ligneTrajet(tr, mode) {
  if (tr.sansRoute) return `<li class="trajet sans-route"><span class="trajet-icone">${SVG.bateau}</span><span>${echapper(t('trajetSansRoute'))}</span></li>`;
  const morceaux = [texteDuree(tr.duree), texteDistance(tr.distance)];
  const routes = [...new Set(tr.routes.map(nomRoute).filter(Boolean))];
  if (routes.length) morceaux.push(routes.join(langue === 'ja' ? '・' : ', '));
  const bateau = tr.bateau > 60 ? ` <span class="trajet-bateau">${SVG.bateau}${echapper(t('dontBateau', texteDuree(tr.bateau)))}</span>` : '';
  const pied = tr.horsRoute > 1000 ? ` <span class="trajet-bateau">${echapper(t('horsRoute', texteDistance(tr.horsRoute)))}</span>` : '';
  return `<li class="trajet"><span class="trajet-icone">${SVG[mode]}</span><span>${echapper(morceaux.join(' · '))}${bateau}${pied}</span></li>`;
}

/** Le bloc « Itinéraire sur la carte » du panneau : la façon de voyager, le total et les boutons. */
function blocItineraire() {
  const it = itineraireActuel;
  const modes = MODES.map((m) => `<button type="button" data-mode="${m}" aria-pressed="${m === modeItineraire}">${SVG[m]}<span>${echapper(t(`mode_${m}`))}</span></button>`).join('');
  const total = it ? `<div class="itineraire-total">
      <b>≈ ${echapper(texteDuree(it.duree))}</b> <span>${echapper(t(`total_${it.mode}`))} · ${echapper(texteDistance(it.distance))}</span>
      ${it.bateau > 60 ? `<small>${SVG.bateau}${echapper(t('dontBateau', texteDuree(it.bateau)))}</small>` : ''}
    </div>` : '';
  const bouton = calculItineraire
    ? `<button type="button" class="btn-lancer" disabled>${SVG.trace}<span>${echapper(t('calculItineraire'))}</span></button>`
    : it
      ? `<button type="button" class="btn-lancer btn-partager-voyage" data-partager-voyage>${SVG.partager}<span>${echapper(t('partagerVoyage'))}</span></button>
        <button type="button" class="btn-secondaire" data-effacer-itineraire>${SVG.croix}<span>${echapper(t('effacerItineraire'))}</span></button>`
      : `<button type="button" class="btn-lancer" data-tracer>${SVG.trace}<span>${echapper(t('tracerItineraire'))}</span></button>`;
  return `<div class="itineraire-bloc">
      <p class="bloc-titre">${echapper(t('itineraireCarte'))}</p>
      <div class="onglets modes" role="group" aria-label="${echapper(t('itineraireCarte'))}">${modes}</div>
      ${total}
      ${erreurItineraire ? `<p class="plongeon-erreur">${echapper(erreurItineraire)}</p>` : ''}
      ${bouton}
    </div>`;
}

/** Calcule l'itinéraire des favoris et le montre sur la carte (cadrer : la caméra le montre en entier). */
async function tracerItineraire({ cadrer = true } = {}) {
  clearTimeout(minuterieTrace);
  const liste = listeItineraire();
  if (liste.length < 2) return effacerItineraire();
  const jeton = (calculItineraire = {});
  pres?.effacerTrajet(); // (la route « Y aller » laisse la place à celle des favoris)
  erreurItineraire = '';
  if (!$('panneau-favoris').hidden) remplirFavoris();
  try {
    const it = await itineraire.calculer(liste, voyageRecu?.mode || modeItineraire);
    if (calculItineraire !== jeton) return;
    itineraireActuel = it;
    itineraire.afficher(it);
    marquerEtapes(liste);
    if (it.sansRoute) erreurItineraire = t('itineraireSansRoute');
    if (cadrer) {
      arreterRotation();
      if (estTelephone()) ouvrirFavoris(false); // la carte se voit en entier ; le résumé reste en bas
      cadrerItineraire(it.bornes);
    }
  } catch (e) {
    if (calculItineraire !== jeton) return;
    console.warn(e);
    erreurItineraire = t('itineraireErreur');
  }
  calculItineraire = null;
  if (!$('panneau-favoris').hidden) remplirFavoris();
  majResume();
  majBandeauVoyage();
}

/** Les favoris changent pendant qu'un itinéraire est montré : on le refait (après une petite pause). */
function retracerBientot() {
  clearTimeout(minuterieTrace);
  if (lieux.filter(estFavori).length < 2) return effacerItineraire();
  minuterieTrace = setTimeout(() => tracerItineraire({ cadrer: false }), 700);
}

function effacerItineraire() {
  clearTimeout(minuterieTrace);
  voyageRecu = null;
  majBandeauVoyage();
  itineraireActuel = null;
  calculItineraire = null;
  erreurItineraire = '';
  itineraire.effacer();
  marquerEtapes([]);
  if (!$('panneau-favoris').hidden) remplirFavoris();
  majResume();
}

/** Le numéro de chaque étape sur son épingle (à la place du petit cœur). */
function marquerEtapes(liste) {
  document.body.classList.toggle('avec-itineraire', liste.length > 0);
  for (const l of lieux) l.el.classList.remove('etape');
  liste.forEach((l, i) => {
    l.el.classList.add('etape');
    l.el.querySelector('.repere-etape').textContent = i + 1;
  });
}

/** Montre tout l'itinéraire, dans la place que laissent les panneaux. */
function cadrerItineraire(bornes) {
  const bandeau = $('voyage-recu').hidden ? 0 : $('voyage-recu').offsetHeight + 40;
  const m = estTelephone()
    ? { top: 120, bottom: Math.max(110, bandeau + 50), left: 36, right: 36 }
    : {
      top: 90, bottom: Math.max(80, bandeau), right: $('fiche').classList.contains('ouverte') ? 460 : 70,
      left: $('panneau-favoris').hidden ? 70 : 400,
    };
  const p = map.getPadding();
  const h = (p.left + p.right) / 2, v = (p.top + p.bottom) / 2;
  const vue = map.cameraForBounds(bornes, {
    padding: { top: m.top - v, bottom: m.bottom - v, left: m.left - h, right: m.right - h }, bearing: map.getBearing(), maxZoom: 12.5,
  });
  if (vue) map.flyTo({ ...vue, pitch: 20, padding: { top: 0, bottom: 0, left: 0, right: 0 }, duration: 1800, essential: true });
}

/** Le résumé en bas de l'écran, quand l'itinéraire est sur la carte et le panneau des favoris fermé. */
function majResume() {
  const it = itineraireActuel;
  $('resume-itineraire').hidden = !it || !!voyageRecu || !$('panneau-favoris').hidden;
  if (!it) return;
  $('resume-details').innerHTML = `${SVG[it.mode]}<b>≈ ${echapper(texteDuree(it.duree))}</b><span>· ${echapper(texteDistance(it.distance))}</span>`;
  $('resume-details').setAttribute('aria-label', deuxPoints(t('voirItineraire'), `${texteDuree(it.duree)}, ${texteDistance(it.distance)}`));
}

// ---------------------------------------------------------------- Quand partir ? (saisons.js)
// Le calendrier des 12 mois : les lieux à leur plus beau ce mois-là (la colonne « Saisons » du tableau). « Voir sur la
// carte » efface les autres : très peu les lieux hors saison, un peu ceux qui sont beaux toute l'année.
let moisSaison = null; // le mois montré sur la carte, ou null
let moisPanneau = null; // le mois choisi dans le calendrier
const moisAuJapon = () => Number(new Intl.DateTimeFormat('en', { timeZone: 'Asia/Tokyo', month: 'numeric' }).format(new Date()));
const pastilleLieu = (l) => `<span class="pastille" style="--c:${l.cat.couleur}">${iconeHTML(l.cat.icone)}</span>`;

function ouvrirSaisons(ouvrir) {
  $('panneau-saisons').hidden = !ouvrir;
  $('btn-saisons').setAttribute('aria-expanded', String(ouvrir));
  majPastilleSaison();
  if (!ouvrir) return;
  fermerPanneaux('panneau-saisons');
  moisPanneau = moisSaison || moisPanneau || moisAuJapon();
  remplirSaisons();
}

function remplirSaisons() {
  $('panneau-saisons').innerHTML = contenuPanneau({ lieux, mois: moisPanneau, t, langue, enLangue, pastille: pastilleLieu });
}

/** Montre sur la carte les lieux d'un mois (null : tous). */
function montrerSaison(mois) {
  moisSaison = mois;
  const enSaison = new Set(mois ? lieuxDuMois(lieux, mois) : lieux);
  for (const l of lieux) {
    const ailleurs = !!mois && !enSaison.has(l);
    l.el.classList.toggle('hors-saison', ailleurs && !l.saisons.annee);
    l.el.classList.toggle('toute-annee', ailleurs && l.saisons.annee);
  }
  majPastilleSaison();
  if (!mois || !enSaison.size) return;
  arreterRotation();
  const bornes = new maplibregl.LngLatBounds();
  for (const l of enSaison) bornes.extend([l.lng, l.lat]);
  const m = estTelephone() ? { top: 140, bottom: 90, left: 40, right: 40 } : { top: 110, bottom: 80, left: 80, right: 80 };
  const vue = map.cameraForBounds(bornes, { padding: m, bearing: map.getBearing(), maxZoom: 7.5 });
  if (vue) map.flyTo({ ...vue, pitch: Math.min(map.getPitch(), 40), duration: 1800, essential: true });
}

function majPastilleSaison() {
  const b = $('resume-saison');
  b.hidden = !moisSaison || !$('panneau-saisons').hidden;
  if (!moisSaison) return;
  const nom = nomMois(moisSaison, langue);
  $('saison-details').innerHTML = `<span aria-hidden="true">${iconeDuMois(moisSaison)}</span><b>${echapper(nom.charAt(0).toUpperCase() + nom.slice(1))}</b>`
    + `<span>· ${echapper(t('saisonsPastille', lieuxDuMois(lieux, moisSaison).length))}</span>`;
}

// ---------------------------------------------------------------- Partager son voyage (partage-voyage.js)
// Un lien qui montre le même voyage à qui l'ouvre, et une image à poster (la carte en 3D ou le carnet de voyage).
let partageVoyage = null;
let ambianceCarte = null; // l'horloge et les paliers de l'ambiance (ambiance.js), branchés au démarrage
async function partagerVoyage() {
  const it = itineraireActuel;
  if (!it || calculItineraire) return;
  const liste = [it.trajets[0].de, ...it.trajets.map((tr) => tr.a)]; // dans l'ordre de la route
  try {
    partageVoyage ??= import('./partage-voyage.js').then(({ brancherPartageVoyage }) => brancherPartageVoyage(map, {
      t, langue: () => langue, enLangue, adresse: CONFIG.adresse, infos: infosLieu, texteDuree, texteDistance, icones: SVG,
      afficherMessage, arreterRotation, jour: () => ambianceCarte?.jourPourImage(),
      pleineQualite: (oui) => qualite?.plein(oui), // l'image partagée garde toute la finesse
      // la couverture TikTok copiée dans le site (même origine : le dessin peut la lire), sinon la photo du tableau si elle est locale
      photo: (l) => (idVideo(l.tiktok) ? `photos/tiktok/${idVideo(l.tiktok)}.jpg` : /^https?:/.test(l.photo || '') ? '' : l.photo || ''),
    }));
    (await partageVoyage).ouvrir(liste, it);
  } catch (e) {
    console.warn('Partage du voyage', e);
    partageVoyage = null;
    afficherMessage(t('bravoImageErreur'));
  }
}

/** Le lien …/?voyage=lieu1.lieu2…&mode=bike : lu au démarrage, et effacé de l'adresse. */
function lireLienVoyage() {
  const { voyage: ids, mode } = retirerParametres('voyage', 'mode');
  if (ids === null) return null;
  return { ids: ids.split(/[.,~\s]+/).filter(Boolean), mode: MODES.includes(mode) ? mode : 'car' };
}

/** Montre un voyage reçu : sa route sur la carte et le bandeau (le garder, la visite guidée, ×). */
function recevoirVoyage({ ids, mode }) {
  const vus = new Set();
  const liste = ids.map((id) => lieux.find((l) => l.id === id)).filter((l) => l && !vus.has(l) && vus.add(l));
  if (!liste.length) return afficherMessage(t('voyageInconnu'));
  if (liste.some((l) => !l.cat.visible)) {
    for (const l of liste) l.cat.visible = true;
    construireMenu();
    appliquerFiltres();
  }
  arreterRotation();
  ouvrirFavoris(false);
  voyageRecu = { lieux: liste, mode };
  majBandeauVoyage();
  if (liste.length > 1) tracerItineraire();
  else allerAuLieu(liste[0]);
}

/** « Garder ce voyage » : ses lieux rejoignent les favoris (sa route reste, refaite pour les favoris). */
function garderVoyage() {
  if (!voyageRecu) return;
  const { lieux: liste, mode } = voyageRecu;
  voyageRecu = null;
  for (const l of liste) {
    favoris.add(l.id);
    l.el.classList.add('favori');
  }
  ecrireFavoris(favoris);
  modeItineraire = mode;
  try { localStorage.setItem('modeItineraire', mode); } catch { /* pas grave */ }
  majBandeauVoyage();
  majFavoris();
  majResume();
  afficherMessage(t('voyageGarde'));
}

function majBandeauVoyage() {
  const b = $('voyage-recu');
  b.hidden = !voyageRecu;
  if (!voyageRecu) return;
  const it = itineraireActuel;
  const liste = voyageRecu.lieux;
  $('voyage-recu-titre').textContent = t('lieux', liste.length)
    + (it && !calculItineraire ? ` · ≈ ${texteDuree(it.duree)} ${t(`total_${it.mode}`)}` : '');
  $('voyage-recu-etapes').textContent = liste.map((l) => enLangue(l.nom)).join(' → ');
}

// ---------------------------------------------------------------- Visite guidée (visite.js)
const infosLieu = (l) => [enLangue(l.cat.nom), l.prefecture && enLangue(PREFECTURES[l.prefecture])].filter(Boolean).join(' · ');

const prechargerVol = brancherPrecharge(map, maplibregl, TUILES_RELIEF, tuilesRelief);
const visite = brancherVisite(map, {
  t, enLangue, infos: infosLieu, estTelephone, vueDepart, adresse: CONFIG.adresse, exageration,
  // avant un plongeon : le relief du trajet, et le tapis de feuilles du lieu d'arrivée (là dès que la caméra arrive)
  preparerVol: (depart, arrivee, hauteur) => {
    ambianceCarte?.preparerTapis(arrivee.center);
    return prechargerVol(depart, arrivee, hauteur);
  },
  video: (l) => idVideo(l.tiktok),
  debut: (l) => l.debutVideo ?? CONFIG.debutVideo ?? 4,
  affiche: couverture,
  avant: () => {
    arreterRotation();
    fermerFiche();
    fermerPanneaux();
  },
  sonVideo: (oui) => musique.retrait('visite', oui),
});

// ---------------------------------------------------------------- Musique (musique.js)
// Coupée au départ ; le bouton sous la langue ouvre le choix du style et de l'ambiance.
const musique = brancherMusique({ t, bouton: $('btn-musique'), panneau: $('panneau-musique') });

function ouvrirMusique(ouvrir) {
  $('panneau-musique').hidden = !ouvrir;
  $('btn-musique').setAttribute('aria-expanded', String(ouvrir));
  if (!ouvrir) return;
  fermerPanneaux('panneau-musique');
  musique.remplir();
}

// La vidéo TikTok d'une fiche a le son : la musique se tait tant qu'elle est là
new MutationObserver(() => musique.retrait('fiche', !!$('fiche-media').querySelector('iframe')))
  .observe($('fiche-media'), { childList: true, subtree: true });

// ---------------------------------------------------------------- Plongeon et affiche (mode développeur)
// Les onglets « Plongeon » et « Point à point » du panneau de la visite, et l'affiche du nom pour les vidéos :
// dans onglet-plongeon.js, chargé seulement en mode développeur (les visiteurs ne le téléchargent pas).
let ongletPlongeon = null; // Promise des onglets branchés
function chargerOngletPlongeon() {
  ongletPlongeon ??= import('./onglet-plongeon.js').then(({ brancherOngletPlongeon }) => brancherOngletPlongeon({
    t, enLangue, reperes, modeles3d, visite, creerEpingle, preparerPrefectures, lireGPS, slug, afficherMessage, appliquerFiltres,
    map, adresse: CONFIG.adresse, langue: () => langue,
    changerLangue: (l) => { langue = l; appliquerLangue(); }, // (le temps d'un film en anglais : pas retenu)
    pleineQualite: (oui) => qualite?.plein(oui), // le film est fait image par image : toute la finesse
    lieux: () => lieux, categories: () => categories, toutesCategories: () => toutesCategories,
    trouverPrefecture: () => trouverPrefecture,
  }));
  ongletPlongeon.catch((e) => {
    console.warn('Plongeon indisponible', e);
    ongletPlongeon = null;
  });
  return ongletPlongeon;
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
  if (actif) chargerOngletPlongeon();
  else {
    // retour à la carte normale : rien des outils ne reste ouvert
    if (jeu?.enCours()) jeu.arreter();
    if (defi?.enCours()) defi.arreter();
    ongletPlongeon?.then((o) => o.choisirOnglet('visite'));
    ambianceCarte?.reel(); // la date et l'heure choisies dans le réglage reviennent au vrai moment
  }
  if (ambianceCarte) majHalloween(); // l'événement d'Halloween, tant qu'il n'est que pour le mode développeur
}

function majBoutonDev() {
  const actif = document.body.classList.contains('mode-dev');
  $('btn-dev').title = t(actif ? 'modeDevActif' : 'modeDevNormal');
  $('btn-dev').setAttribute('aria-label', t('modeDev'));
}

/** Le lien secret : on compare son condensé SHA-256 à celui de config.js, puis on l'efface de l'adresse. */
async function ouvrirLienDev() {
  const { dev: code } = retirerParametres('dev');
  if (code === null) return;
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

// ---------------------------------------------------------------- Jeu « Devine le lieu » (pas encore public)
// Le bouton n'existe qu'en mode développeur (classe .dev) : le jeu sortira plus tard, avec un TikTok.
// À plusieurs (jeu.js, amis.js, serveur/) : un lien d'invitation …/?partie=FUJI42 ouvre le jeu dans cette partie,
// et …/?ami=K7M2QX8P la liste d'amis avec ce code, pour tous les visiteurs (choix du propriétaire, 2026-10-09 :
// il peut tester avec ses amis ; le bouton, lui, reste caché).
let jeu = null;
/** quoi : { partie: code } (rejoindre une partie), { ami: code } (ajouter un ami), ou rien (l'accueil du jeu) */
async function lancerJeu(quoi = {}) {
  if (!jeu) {
    const [{ brancherJeu }, lesAmis] = await Promise.all([import('./jeu.js'), chargerAmis().catch(() => null)]);
    jeu ??= brancherJeu(map, maplibregl, {
      amis: lesAmis, partager: partagerTexte,
      t, enLangue, infos: infosLieu, lieux: () => lieux, reperes, modeles3d, vueDepart, estTelephone, afficherMessage,
      adresse: CONFIG.adresse,
      photo: (l) => (l.photo ? photoAllegee(l.photo) : ''),
      video: (l) => idVideo(l.tiktok),
      prefecture: async (l) => { await preparerPrefectures(); return l.prefecture; },
      langue: () => langue,
      avant: () => {
        if (defi?.enCours()) defi.arreter(false);
        if (visite.enCours()) visite.arreter();
        effacerItineraire();
        pres?.effacer();
        arreterRotation();
        fermerFiche();
        fermerPanneaux();
      },
    });
  }
  if (quoi.partie) jeu.ouvrirPartie(quoi.partie);
  else if (quoi.ami) jeu.ouvrirAmis(quoi.ami);
  else jeu.lancer();
}

/**
 * Les amis (amis.js) : chargés avec le jeu, ou au démarrage si ce navigateur a déjà joué à plusieurs (pour
 * recevoir demandes d'ami et invitations). null s'il n'y a pas de serveur (CONFIG.serveurJeu vide).
 */
let promesseAmis = null;
function chargerAmis() {
  promesseAmis ??= Promise.all([import('./amis.js'), import('./reseau.js')]).then(([{ brancherAmis }, { adresseServeur }]) => {
    if (!adresseServeur()) return null;
    const amis = brancherAmis({
      t, afficherMessage, adresse: CONFIG.adresse, partager: partagerTexte,
      rejoindre: (code) => lancerJeu({ partie: code }).catch((e) => console.warn('Jeu indisponible', e)),
    });
    amis.demarrer();
    return amis;
  });
  promesseAmis.catch(() => { promesseAmis = null; });
  return promesseAmis;
}

function aDejaJoueAPlusieurs() {
  try { return !!JSON.parse(localStorage.getItem('joueur'))?.pseudo; } catch { return false; }
}

// ---------------------------------------------------------------- Défi du jour (defi.js, pas encore public)
// Un lieu mystère par jour, le même pour tous, en 6 essais. Comme le jeu, le bouton n'existe qu'en mode
// développeur ; un lien …/?defi (celui du partage) l'ouvre pour tous.
let defi = null;
async function lancerDefi() {
  if (!defi) {
    const { brancherDefi } = await import('./defi.js');
    defi ??= brancherDefi(map, maplibregl, {
      t, enLangue, langue: () => langue, infos: infosLieu, lieux: () => lieux, reperes, modeles3d, vueDepart, estTelephone,
      afficherMessage, adresse: CONFIG.adresse, debut: CONFIG.debutDefi, partager: partagerTexte,
      photo: (l) => (l.photo ? photoAllegee(l.photo) : ''),
      video: (l) => idVideo(l.tiktok),
      ouvrirLieu: (l) => allerAuLieu(l),
      quandJoue: majPointDefi,
      avant: () => {
        if (jeu?.enCours()) jeu.arreter(false);
        if (visite.enCours()) visite.arreter();
        effacerItineraire();
        pres?.effacer();
        arreterRotation();
        fermerFiche();
        fermerPanneaux();
      },
    });
  }
  await preparerPrefectures().catch(() => {}); // la préfecture du lieu, écrite à la fin
  defi.lancer();
}

/** Le point rouge du bouton Défi : le défi du jour n'est pas encore fini dans ce navigateur (localStorage « defi »). */
function majPointDefi() {
  let memo = null;
  try { memo = JSON.parse(localStorage.getItem('defi')); } catch { /* pas grave */ }
  $('defi-point').hidden = memo?.jour === jourDuDefi(CONFIG.debutDefi) && !!memo.fini;
}

// ---------------------------------------------------------------- Près de moi (pres.js)
// Le bouton rond au-dessus des zooms. La position est demandée tout de suite, dans l'appui (Safari tient à ce
// qu'elle suive le geste), pendant que le module se charge.
let pres = null; // une fois chargé : { localiser, allerVers, effacer, effacerTrajet, majLangue, position }
let presCharge = null;
function chargerPres() {
  presCharge ??= import('./pres.js').then(({ brancherPres }) => (pres = brancherPres(map, maplibregl, {
    t, enLangue, langue: () => langue, lieux: () => lieux, reperes, afficherMessage, estTelephone, vueDepart, SVG, texteDuree,
    prefectures: () => preparerPrefectures().then(() => trouverPrefecture),
    nomPrefecture: (code) => enLangue(PREFECTURES[code]),
    avant: () => {
      if (visite.enCours()) visite.arreter();
      arreterRotation();
      fermerPanneaux();
    },
    avantTrajet: () => {
      fermerFiche();
      effacerItineraire();
    },
    allerAuLieu: (l) => allerAuLieu(l),
    ouvrirSaisons: () => ouvrirSaisons(true),
    quandChange: () => { if (lieuActif) remplirBoutons(lieuActif); },
  })));
  presCharge.catch((e) => { console.warn('Près de moi indisponible', e); presCharge = null; });
  return presCharge;
}

// ---------------------------------------------------------------- Grandes villes
// Leurs pins, leur contour et leur fiche avec le carrousel TikTok de la ville (villes.js), chargé une fois les lieux
// là (il en a besoin : les lieux de la carte dans la ville, ceux qui sont aussi dans le carrousel).
let villes = null; // une fois chargé : { ouvrir, quitter, ouverte, langue }
let villesCharge = null;
function chargerVilles() {
  villesCharge ??= import('./villes.js').then(({ brancherVilles }) => (villes = brancherVilles(map, maplibregl, {
    t, enLangue, langue: () => langue, reperes, lieux: () => lieux, champ, lireGPS, paddingFiche, estTelephone, SVG,
    lireVilles: async () => {
      const [villes, lieux] = await Promise.all([
        chargerCSV(CONFIG.tableau.villes, CONFIG.secours.villes),
        chargerCSV(CONFIG.tableau.lieuxVilles, CONFIG.secours.lieuxVilles),
      ]);
      return { villes, lieux };
    },
    nomPrefecture: (code) => enLangue(PREFECTURES[code]),
    nomRegion: (code) => enLangue(regionDe(code)?.nom),
    prefectures: () => preparerPrefectures().then(() => trouverPrefecture),
    avant: () => {
      if (visite.enCours()) visite.arreter();
      arreterRotation();
      lieuActif?.el.classList.remove('actif');
      lieuActif = null;
      tirageActif = false;
      marquerDansMenu();
    },
    ouvrirLieu: (l) => ouvrirLieu(l),
    fermerFiche: () => fermerFiche(),
    envoyer: (url, titre) => envoyer({ titre, url }, { message: afficherMessage, copie: t('lienCopie') }),
  })));
  villesCharge.catch((e) => { console.warn('Grandes villes indisponibles', e); villesCharge = null; });
  return villesCharge;
}

function demanderPosition() {
  return new Promise((ok, non) => {
    if (!navigator.geolocation) return non(new Error('Pas de géolocalisation'));
    navigator.geolocation.getCurrentPosition(ok, non, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
  });
}

/** Les liens …/?partie=CODE et …/?ami=CODE : lus au démarrage, et effacés de l'adresse. */
function lireLiensJeu() {
  const quoi = retirerParametres('partie', 'ami');
  return quoi.partie || quoi.ami ? quoi : null;
}

/** Un texte à envoyer (jeu, amis) : la feuille de partage du téléphone, sinon copié (avec le message copie). */
const partagerTexte = (texte, copie = t('lienCopie')) => envoyer({ texte }, { message: afficherMessage, copie });

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
  fermerPanneaux('panneau-visite');
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
  pres?.effacer();
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
  res.innerHTML = trouves.length ? '' : `<li class="vide">${echapper(t('aucunResultat'))}</li>`;
  for (const l of trouves) {
    const li = document.createElement('li');
    li.innerHTML = `<button type="button">
        <span class="pastille" style="--c:${l.cat.couleur}">${iconeHTML(l.cat.icone)}</span>
        <span class="nom-res">${echapper(enLangue(l.nom))}</span>
        <span class="cat-res">${echapper(enLangue(l.cat.nom))}</span>
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

/**
 * L'image d'un lieu (fiche, visite) : la photo du tableau, sinon la couverture de sa vidéo copiée dans le site
 * chaque nuit (outils/telecharger_couvertures.py : rien à demander à TikTok), sinon celle que donne TikTok
 * (un lieu ajouté depuis la dernière nuit).
 */
const couvertures = new Map();
function couverture(l) {
  if (l.photo) return Promise.resolve(photoAllegee(l.photo));
  const id = idVideo(l.tiktok);
  if (!id) return Promise.resolve('');
  if (!couvertures.has(id)) {
    const locale = `photos/tiktok/${id}.jpg`;
    couvertures.set(id, new Promise((ok) => {
      const im = new Image();
      im.onload = () => ok(locale);
      im.onerror = () => ok(miniatureTiktok(l.tiktok));
      im.src = locale;
    }));
  }
  return couvertures.get(id);
}

function paddingFiche() {
  if (estTelephone()) return { top: 90, bottom: Math.round(innerHeight * 0.62), left: 0, right: 0 };
  // Sur ordinateur, le menu des catégories peut rester ouvert à gauche : on centre le lieu dans l'espace libre.
  const menuOuvert = ['menu-categories', 'panneau-hasard', 'panneau-favoris', 'panneau-visite'].some((id) => !$(id).hidden);
  return { top: 0, bottom: 0, left: menuOuvert ? 360 : 0, right: 424 };
}

function ouvrirLieu(lieu, { voler = true, hasard = false } = {}) {
  if (visite.enCours()) visite.arreter();
  arreterRotation();
  villes?.quitter(); // la fiche passe de la ville au lieu
  lieuActif?.el.classList.remove('actif');
  lieuActif = lieu;
  tirageActif = hasard;
  lieu.el.classList.add('actif');
  marquerDansMenu();
  remplirFiche(lieu);
  const fiche = $('fiche');
  fiche.classList.add('ouverte');
  fiche.inert = false;
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
  fiche.inert = true; // fermée, ses boutons hors de l'écran ne se prennent plus au clavier (Tab)
  villes?.quitter();
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
  const pref = l.prefecture ? ` · ${echapper(enLangue(PREFECTURES[l.prefecture]))}` : '';
  $('fiche-categorie').innerHTML = `<span class="pastille" style="--c:${c.couleur}">${iconeHTML(c.icone)}</span><span>${echapper(enLangue(c.nom))}${pref}</span>`;
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
    ? `${l.nouveau ? `<span class="etiquette-nouveau">${echapper(t('nouveau'))}</span>` : ''}${echapper(t('videoDu', date))}` : '';
  $('fiche-description').textContent = enLangue(l.description);
  $('fiche-saisons').innerHTML = blocFiche(l, { t, langue });

  // Photo + bouton pour lire la vidéo TikTok directement dans la fiche
  const media = $('fiche-media');
  const video = idVideo(l.tiktok);
  media.innerHTML = '';
  const vignette = document.createElement('button');
  vignette.type = 'button';
  vignette.className = 'vignette';
  vignette.setAttribute('aria-label', t('lireVideo'));
  if (video) vignette.innerHTML = `<span class="lecture">${SVG.lecture}${echapper(t('lireVideo'))}</span>`;
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
  remplirBoutons(l);
  // « Plus d'infos » (le lien du tableau) et la page du lieu (outils/fabriquer_pages.py)
  $('fiche-plus').innerHTML = (/^https?:\/\//.test(l.autreLien)
    ? `<a href="${echapper(l.autreLien)}" target="_blank" rel="noopener">${echapper(t('autreLien'))} ${SVG.sortie}</a>` : '')
    + `<a href="${langue}/${echapper(l.id)}/">${echapper(t('pageLieu'))}</a>`;
  // partager le lien du lieu : le menu de partage du téléphone, sinon le lien est copié
  const partage = tactile() && !!navigator.share;
  const btnPartager = $('fiche-partager');
  btnPartager.innerHTML = partage ? SVG.partager : SVG.lien;
  btnPartager.title = t(partage ? 'partager' : 'copierLien');
  btnPartager.setAttribute('aria-label', btnPartager.title);
  btnPartager.onclick = () => envoyer({ titre: enLangue(l.nom), url: `${location.origin}${location.pathname}#${l.id}` },
    { message: afficherMessage, copie: t('lienCopie') });
  // Fiche ouverte par le dé : bouton « Un autre » en haut de la photo, pour relancer d'un doigt
  $('fiche-autre').hidden = !tirageActif;

  const photo = await couverture(l);
  if (lieuActif === l && photo) vignette.style.backgroundImage = `url("${photo.replace(/"/g, '%22')}")`;
}

/**
 * Les lieux qu'on peut visiter dans la balade 3D (site/balade/) : id du lieu sur la carte → id du lieu de la
 * balade (?lieu=). À compléter quand la balade gagne un lieu.
 */
const BALADES = { 'itsukushima-jinja': 'itsukushima', aogashima: 'aogashima', gokayama: 'gokayama', 'himeji-castle': 'himeji', 'takachiho-gorge': 'takachiho', 'amanoiwato-jinja': 'takachiho' };

/**
 * Les boutons de la fiche (deux, pour tenir sur une ligne, plus « Visiter en 3D » ; partager est une icône sur la photo,
 * « Plus d'infos » un lien après le texte) : la vidéo TikTok, et l'itinéraire Google Maps, ou « Y aller » quand
 * « Près de moi » connaît la position du visiteur (la route se trace sur la carte, pres.js) ; et « Visiter en 3D »
 * pour les lieux de la balade.
 */

function remplirBoutons(l) {
  const boutons = [];
  if (l.tiktok) boutons.push(`<a class="principal" href="${echapper(l.tiktok)}" target="_blank" rel="noopener">${SVG.tiktok}${echapper(t('voirTiktok'))}</a>`);
  if (pres?.position()) boutons.push(`<button type="button" data-aller>${SVG.route}${echapper(t('yAller'))}</button>`);
  else boutons.push(`<a href="https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lng}" target="_blank" rel="noopener">${SVG.route}${echapper(t('itineraire'))}</a>`);
  // la balade 3D (pour tous depuis le 2026-10-26)
  if (BALADES[l.id]) boutons.push(`<a href="balade/?lieu=${BALADES[l.id]}&langue=${langue}">${SVG.balade}${echapper(t('visiter3d'))}</a>`);
  $('fiche-boutons').innerHTML = boutons.join('');
}

function lancerVideo(id) {
  if (!id) return;
  const src = `https://www.tiktok.com/player/v1/${id}?autoplay=1&music_info=1&description=0&rel=0`;
  const media = $('fiche-media');
  media.innerHTML = `<div class="video-cadre"><iframe class="video" src="${src}" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" title="TikTok"></iframe></div>`;
  // Sur iPhone (WebKit), la fiche gardait la longueur à faire défiler d'avant la vidéo (la photo, bien plus basse) :
  // la description revenait en arrière comme au bout de la fiche (vu dans le navigateur de Snapchat, 2026-10-22).
  // Lui couper le défilement le temps d'une image, puis le lui rendre, la lui fait recompter ; encore une fois quand
  // le lecteur a chargé.
  recompterDefilement();
  media.querySelector('iframe').addEventListener('load', recompterDefilement, { once: true });
}

/** Fait recompter à la fiche ce qu'on peut y faire défiler (iPhone : voir lancerVideo). */
function recompterDefilement() {
  const defil = $('fiche-defil');
  const haut = defil.scrollTop;
  defil.style.overflowY = 'hidden';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    defil.style.overflowY = '';
    defil.scrollTop = haut;
  }));
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
  if (id.startsWith('ville-')) {
    chargerVilles().then((v) => v.ouvrir(id.slice(6))).catch(() => {});
    return;
  }
  const lieu = id && lieux.find((l) => l.id === id);
  if (lieu) {
    if (!lieu.cat.visible) { lieu.cat.visible = true; construireMenu(); appliquerFiltres(); }
    ouvrirLieu(lieu);
  }
}

// ---------------------------------------------------------------- Textes & langue
function appliquerLangue() {
  document.documentElement.lang = langue;
  // Les textes fixes de la page (index.html) : data-t = le texte, data-t-titre = l'infobulle, data-t-aria = le nom
  // lu par les lecteurs d'écran.
  for (const el of document.querySelectorAll('[data-t]')) el.textContent = t(el.dataset.t);
  for (const el of document.querySelectorAll('[data-t-titre]')) el.title = t(el.dataset.tTitre);
  for (const el of document.querySelectorAll('[data-t-aria]')) el.setAttribute('aria-label', t(el.dataset.tAria));
  $('recherche').placeholder = t('chercher');
  $('lien-liste').href = `${langue}/`;
  for (const m of MERS) {
    m.el.lang = langue;
    m.el.textContent = enLangue(m.nom);
  }
  $('aide').textContent = t(estTelephone() ? 'aideTel' : 'aide');
  if ($('choix-region').options.length) construireHasard();
  for (const b of document.querySelectorAll('[data-langue]')) {
    b.setAttribute('aria-pressed', String(b.dataset.langue === langue));
  }
  for (const l of lieux) {
    l.el.querySelector('.repere-nom').textContent = enLangue(l.nom);
    if (l.nouveau) l.el.querySelector('.repere-nouveau').textContent = t('nouveau');
  }
  if (!$('panneau-saisons').hidden) remplirSaisons();
  majPastilleSaison();
  majBoutonDev();
  ongletPlongeon?.then((o) => o.majLangue());
  majFavoris();
  if (itineraireActuel) itineraire.retraduire(itineraireActuel.mode);
  majResume();
  majBandeauVoyage();
  visite.majLangue();
  jeu?.majLangue();
  defi?.majLangue();
  pres?.majLangue();
  musique.majLangue();
  construireMenu();
  if (!$('resultats').hidden) rechercher();
  if (lieuActif) remplirFiche(lieuActif);
  legendes?.majLangue();
  villes?.langue();
  halloween?.then((h) => h?.majLangue());
  nomsRegions.majLangue(langue);
  compteur?.majLangue();
  ambianceCarte?.majLangue();
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
  // chaque bouton ouvre ou ferme son panneau ; un appui dans un panneau ne le ferme pas
  for (const [panneau, [bouton, ouvrir]] of Object.entries(PANNEAUX)) {
    $(bouton).addEventListener('click', (e) => {
      e.stopPropagation();
      ouvrir($(panneau).hidden);
    });
    $(panneau).addEventListener('click', (e) => {
      e.stopPropagation();
      if (e.target.closest('.panneau-fermer')) ouvrir(false);
    });
    // Sa croix en haut à droite (2026-10-21 : sans elle, on ne savait pas toujours comment le fermer). Le menu du
    // téléphone a la sienne dans son en-tête. Plusieurs panneaux sont remplis d'un coup (innerHTML) : elle y revient.
    if (panneau === 'panneau-menu') continue;
    const el = $(panneau);
    const remettre = () => { if (!el.querySelector(':scope > .panneau-fermer')) el.insertAdjacentHTML('afterbegin', croixPanneau(t('fermer'))); };
    remettre();
    new MutationObserver(remettre).observe(el, { childList: true });
  }
  document.addEventListener('click', () => fermerPanneaux());
  // Téléphone : la barre du bas (un lieu au hasard d'un seul appui, la recherche) et son menu
  $('menu-mobile-titre').textContent = CONFIG.titre;
  $('btn-hasard-mobile').addEventListener('click', (e) => {
    e.stopPropagation();
    fermerPanneaux();
    lancerDe();
  });
  $('btn-chercher-mobile').addEventListener('click', (e) => {
    e.stopPropagation();
    ouvrirMenu(true);
    $('recherche').focus();
  });
  $('menu-mobile-fermer').addEventListener('click', () => ouvrirMenuMobile(false));
  $('panneau-menu').addEventListener('click', (e) => {
    const b = e.target.closest('[data-ouvre]');
    if (!b) return;
    ouvrirMenuMobile(false);
    $(b.dataset.ouvre).click();
  });
  // le bouton des favoris reste en haut sur téléphone, même sans favori (une fenêtre qui change de taille)
  matchMedia('(max-width: 720px)').addEventListener('change', majFavoris);
  $('panneau-favoris').addEventListener('click', (e) => {
    const retirer = e.target.closest('[data-retirer]');
    const ligne = e.target.closest('[data-lieu]');
    const trouver = (id) => lieux.find((l) => l.id === id);
    const mode = e.target.closest('[data-mode]')?.dataset.mode;
    if (retirer) basculerFavori(trouver(retirer.dataset.retirer));
    else if (ligne) allerAuLieu(trouver(ligne.dataset.lieu));
    else if (e.target.closest('[data-visite]')) lancerVisite(lieux.filter(estFavori));
    else if (e.target.closest('[data-tracer]')) tracerItineraire();
    else if (e.target.closest('[data-partager-voyage]')) partagerVoyage();
    else if (e.target.closest('[data-effacer-itineraire]')) effacerItineraire();
    else if (mode && mode !== modeItineraire) {
      modeItineraire = mode;
      try { localStorage.setItem('modeItineraire', mode); } catch { /* pas grave */ }
      if (itineraireActuel || calculItineraire) tracerItineraire({ cadrer: false });
      else remplirFavoris();
    } else if (e.target.closest('[data-inverser]')) {
      sensInverse = !sensInverse;
      if (itineraireActuel || calculItineraire) tracerItineraire({ cadrer: false });
      else remplirFavoris();
    }
  });
  $('resume-details').addEventListener('click', (e) => {
    e.stopPropagation();
    ouvrirFavoris(true);
  });
  $('resume-effacer').addEventListener('click', (e) => {
    e.stopPropagation();
    effacerItineraire();
  });
  $('resume-partager').addEventListener('click', (e) => {
    e.stopPropagation();
    partagerVoyage();
  });
  $('voyage-garder').addEventListener('click', garderVoyage);
  $('panneau-saisons').addEventListener('click', (e) => {
    const mois = e.target.closest('[data-mois]')?.dataset.mois;
    const lieu = e.target.closest('[data-lieu]')?.dataset.lieu;
    if (mois) {
      moisPanneau = Number(mois);
      remplirSaisons();
      if (moisSaison) montrerSaison(moisPanneau); // la carte suit le mois choisi
    } else if (lieu) allerAuLieu(lieux.find((l) => l.id === lieu));
    else if (e.target.closest('[data-voir-saison]')) {
      ouvrirSaisons(false);
      montrerSaison(moisPanneau);
    }
  });
  $('saison-details').addEventListener('click', (e) => {
    e.stopPropagation();
    ouvrirSaisons(true);
  });
  $('saison-effacer').addEventListener('click', (e) => {
    e.stopPropagation();
    montrerSaison(null);
  });
  $('voyage-visite').addEventListener('click', () => { if (voyageRecu) lancerVisite(voyageRecu.lieux); });
  $('voyage-recu-fermer').addEventListener('click', effacerItineraire);
  $('btn-jeu').addEventListener('click', () => lancerJeu().catch((e) => console.warn('Jeu indisponible', e)));
  $('btn-defi').addEventListener('click', () => lancerDefi().catch((e) => console.warn('Défi indisponible', e)));
  $('btn-pres').addEventListener('click', (e) => {
    e.stopPropagation();
    const position = demanderPosition();
    position.catch(() => {}); // (lue par pres.js)
    chargerPres().then((p) => p.localiser(position)).catch(() => afficherMessage(t('presIntrouvable')));
  });
  $('fiche-boutons').addEventListener('click', (e) => {
    if (e.target.closest('[data-aller]') && lieuActif) pres?.allerVers(lieuActif);
  });
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
  $('recherche').addEventListener('input', rechercher);
  $('btn-tout').addEventListener('click', () => toutCocher(true));
  $('btn-rien').addEventListener('click', () => toutCocher(false));
  $('fiche-fermer').addEventListener('click', fermerFiche);
  brancherPoignee();
  $('btn-recentrer').addEventListener('click', () => {
    fermerFiche();
    map.flyTo({ ...vueDepart(), padding: { top: 0, bottom: 0, left: 0, right: 0 }, duration: 2200 });
  });
  brancherRose();
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
    if (Object.keys(PANNEAUX).some((id) => !$(id).hidden)) fermerPanneaux();
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
  const liensJeu = lireLiensJeu();
  const lienDefi = retirerParametres('defi').defi !== null;
  majPointDefi();
  const lienVoyage = lireLienVoyage();
  appliquerLangue();
  ambianceCarte = ambiance.brancher(map, { t, langue: () => langue, lieux: () => lieux });
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
  ambianceCarte.majLieux(); // les lieux à leur plus beau ce mois-ci se peignent sur la carte (saisons-carte.js)

  let montree = false;
  const pret = () => {
    if (montree) return;
    montree = true;
    appliquerFiltres();
    $('chargement').classList.add('fini');
    // une fois effacé, l'écran de chargement sort de la page : son logo animé aurait tourné pour rien à chaque image
    setTimeout(() => { $('chargement').style.display = 'none'; }, 900);
    setTimeout(replierSources, 5000);
    if (location.hash.length > 1) ouvrirDepuisAdresse();
    else if (rotation) {
      setTimeout(() => {
        if (!rotation) return;
        reperes.fluide(true); // sans quoi les points des lieux scintillent en tournant (reperes.js)
        requestAnimationFrame(tourner);
      }, 600);
    }
    // Contours des préfectures (116 Ko) chargés en avance, sans gêner le démarrage : le dé s'ouvre tout de suite.
    setTimeout(() => preparerPrefectures().catch(() => {}), 3000);
    setTimeout(chargerLegendes, 1500);
    if (!location.hash.startsWith('#ville-')) setTimeout(() => chargerVilles().catch(() => {}), 1200);
    setTimeout(majHalloween, 1700);
    setInterval(majHalloween, 60000); // l'événement s'arrête à minuit, même la page ouverte
    if (lienVoyage) setTimeout(() => recevoirVoyage(lienVoyage), 300);
    if (liensJeu) setTimeout(() => lancerJeu(liensJeu).catch((e) => console.warn('Jeu indisponible', e)), 400);
    else if (lienDefi) setTimeout(() => lancerDefi().catch((e) => console.warn('Défi indisponible', e)), 400);
    else if (aDejaJoueAPlusieurs()) setTimeout(() => chargerAmis().catch(() => {}), 2500);
  };
  // (pas map.loaded() : les détails de saison peints juste avant la rendent « occupée » un instant, et l'écran
  // de chargement attendait alors un « load » déjà passé, jusqu'au délai de secours : 15 s au lieu de 2,5)
  if (carteChargee) pret();
  else {
    map.once('load', pret);
    // « load » attend toutes les tuiles de la première vue : si l'une traîne, on montre quand même la carte
    // (les tuiles finissent d'arriver) plutôt que de laisser l'écran de chargement.
    setTimeout(pret, ATTENTE_CARTE);
  }
}

demarrer().catch((e) => {
  console.error(e);
  $('txt-chargement').textContent = 'Oops! The map could not load. Please refresh the page.';
});
