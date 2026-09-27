// ================================================================
//  Fonctionnement de la carte 3D « Random Japan Place ».
//  Les lieux viennent du tableau Google Sheets (voir config.js).
// ================================================================
import * as maplibregl from 'https://cdn.jsdelivr.net/npm/maplibre-gl@6.11.2/dist/maplibre-gl.mjs';
import { CONFIG, TEXTES } from './config.js';
import { iconeHTML } from './icons.js';

const $ = (id) => document.getElementById(id);
const estTelephone = () => matchMedia('(max-width: 720px)').matches;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const SVG = {
  coche: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  lecture: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 5.5v13a1 1 0 0 0 1.5.9l10.5-6.5a1 1 0 0 0 0-1.8L9.5 4.6A1 1 0 0 0 8 5.5Z"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M16.6 3c.4 2.1 1.8 3.6 4 3.9v3.2c-1.5 0-2.9-.4-4-1.2v6.3a6 6 0 1 1-6-6h.6v3.3a2.8 2.8 0 1 0 2.2 2.7V3Z"/></svg>',
  route: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5" fill="currentColor"/></svg>',
  lien: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M10 14a4 4 0 0 0 5.7 0l3.5-3.5a4 4 0 0 0-5.7-5.7L12 6.3M14 10a4 4 0 0 0-5.7 0l-3.5 3.5a4 4 0 0 0 5.7 5.7l1.5-1.5"/></svg>',
  partager: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>',
  chevron: '<svg class="chevron-cat" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6"/></svg>',
};
const PALETTE = ['#e5483b', '#8e24aa', '#1e88e5', '#43a047', '#fb8c00', '#00acc1', '#6d4c41', '#d81b60', '#5e35b1', '#7cb342'];

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

const map = new maplibregl.Map({
  container: 'carte',
  ...vueDepart(),
  minZoom: 3.6,
  maxZoom: 16,
  maxPitch: 72,
  maxBounds: [[108, 12], [170, 58]],
  renderWorldCopies: false,
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
    },
    layers: [
      { id: 'fond', type: 'background', paint: { 'background-color': MER } },
      {
        id: 'couleurs-relief',
        type: 'color-relief',
        source: 'ombrage',
        paint: {
          // La mer vaut 0 m pile. Beaucoup de téléphones lisent l'altitude avec ~0,5 m d'erreur
          // (texture filtrée en float16), alors que les paliers ci-dessous restent exacts : avec des
          // paliers serrés autour de 0 (±0,02 m), la mer y tombait dans le vert des terres sous
          // le niveau de la mer. D'où une marge d'environ 1 m autour de 0 (pas plus : les polders
          // comme Hachirōgata, à -4 m, doivent rester verts).
          'color-relief-color': [
            'interpolate', ['linear'], ['elevation'],
            -2.5, '#2f7d5c',
            -1.2, MER,
            0.6, MER,
            2, '#1d6d74',
            30, '#23806a',
            120, '#3d9255',
            300, '#76a346',
            600, '#b1ab4c',
            1000, '#c08d4a',
            1600, '#94603a',
            2300, '#6f4b37',
            2900, '#a99a8b',
            3500, '#f4f1ec',
          ],
        },
      },
      {
        id: 'ombrage',
        type: 'hillshade',
        source: 'ombrage',
        paint: {
          'hillshade-exaggeration': 0.6,
          'hillshade-illumination-anchor': 'map',
          'hillshade-illumination-direction': 315,
          'hillshade-shadow-color': 'rgba(8, 14, 20, 0.85)',
          'hillshade-highlight-color': 'rgba(255, 246, 225, 0.35)',
          'hillshade-accent-color': 'rgba(40, 28, 18, 0.5)',
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
    ],
    terrain: { source: 'relief', exaggeration: exageration(vueDepart().zoom) },
    sky: {
      'sky-color': CONFIG.couleurs.ciel,
      'horizon-color': '#24405a',
      'fog-color': MER,
      'fog-ground-blend': 0.25,
      'horizon-fog-blend': 0.8,
      'sky-horizon-blend': 0.7,
      'atmosphere-blend': 0,
    },
  },
});
map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');
map.on('error', (e) => console.warn('Carte :', e.error?.message || e));
window.carte = map; // pratique pour inspecter la carte depuis la console du navigateur

// Hauteur du relief et taille des épingles selon le zoom
let exagActuelle = null;
function majSelonZoom() {
  const z = map.getZoom();
  const e = Math.round(exageration(z) * 10) / 10;
  // Pas de garde isStyleLoaded() : elle reste fausse tant que des tuiles chargent (pendant un vol
  // vers un lieu), et le relief gardait alors l'exagération ×30 de la vue lointaine.
  if (e !== exagActuelle) {
    try {
      map.setTerrain({ source: 'relief', exaggeration: e });
      exagActuelle = e;
    } catch {
      // style pas encore prêt au tout début : le relief de départ est déjà dans le style
    }
  }
  const taille = Math.min(1, Math.max(0.7, 0.7 + (z - 4.5) * 0.1));
  map.getContainer().style.setProperty('--t', taille.toFixed(2));
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
  $('aide').classList.add('cachee');
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

/** Depuis le menu (recherche ou liste d'une catégorie) : vole vers le lieu et ouvre sa fiche. */
function allerAuLieu(l) {
  if (!l.cat.visible) { l.cat.visible = true; construireMenu(); appliquerFiltres(); }
  if (estTelephone()) ouvrirMenu(false);
  ouvrirLieu(l);
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
  if (ouvrir && !estTelephone()) $('recherche').focus();
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
  return { top: 0, bottom: 0, left: $('menu-categories').hidden ? 0 : 360, right: 424 };
}

function ouvrirLieu(lieu, { voler = true } = {}) {
  arreterRotation();
  lieuActif?.el.classList.remove('actif');
  lieuActif = lieu;
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
      pitch: 62,
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
  fiche.classList.remove('ouverte');
  fiche.setAttribute('aria-hidden', 'true');
  $('fiche-media').innerHTML = '';
  lieuActif?.el.classList.remove('actif');
  lieuActif = null;
  marquerDansMenu();
  history.replaceState(null, '', location.pathname + location.search);
  map.easeTo({ padding: { top: 0, bottom: 0, left: 0, right: 0 }, duration: 500 });
}

async function remplirFiche(l) {
  const c = l.cat;
  $('fiche-categorie').innerHTML = `<span class="pastille" style="--c:${c.couleur}">${iconeHTML(c.icone)}</span><span>${esc(enLangue(c.nom))}</span>`;
  const nom = enLangue(l.nom);
  $('fiche-nom').textContent = nom;
  const second = langue === 'ja' ? l.nom.en : l.nom.ja;
  $('fiche-nom-jp').textContent = second && second !== nom ? second : '';
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
  const photo = l.photo ? photoAllegee(l.photo) : await miniatureTiktok(l.tiktok);
  if (lieuActif === l && photo) vignette.style.backgroundImage = `url("${photo.replace(/"/g, '%22')}")`;

  // Boutons
  const boutons = [];
  if (l.tiktok) boutons.push(`<a class="principal" href="${esc(l.tiktok)}" target="_blank" rel="noopener">${SVG.tiktok}${esc(t('voirTiktok'))}</a>`);
  boutons.push(`<a href="https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lng}" target="_blank" rel="noopener">${SVG.route}${esc(t('itineraire'))}</a>`);
  if (/^https?:\/\//.test(l.autreLien)) boutons.push(`<a href="${esc(l.autreLien)}" target="_blank" rel="noopener">${SVG.lien}${esc(t('autreLien'))}</a>`);
  const partage = navigator.share && estTelephone();
  boutons.push(`<button type="button" id="btn-partager">${partage ? SVG.partager : SVG.lien}${esc(t(partage ? 'partager' : 'copierLien'))}</button>`);
  $('fiche-boutons').innerHTML = boutons.join('');
  $('btn-partager').addEventListener('click', () => partager(l, partage));
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
  $('btn-recentrer').title = t('recentrer');
  $('btn-recentrer').setAttribute('aria-label', t('recentrer'));
  $('fiche-fermer').setAttribute('aria-label', t('fermer'));
  $('txt-chargement').textContent = t('chargement');
  $('aide').textContent = t('aide');
  $('lien-profil').title = t('suivre');
  for (const b of document.querySelectorAll('[data-langue]')) {
    b.setAttribute('aria-pressed', String(b.dataset.langue === langue));
  }
  for (const l of lieux) l.el.querySelector('.repere-nom').textContent = enLangue(l.nom);
  construireMenu();
  if (!$('resultats').hidden) rechercher();
  if (lieuActif) remplirFiche(lieuActif);
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
  document.addEventListener('click', () => ouvrirMenu(false));
  $('recherche').addEventListener('input', rechercher);
  $('btn-tout').addEventListener('click', () => toutCocher(true));
  $('btn-rien').addEventListener('click', () => toutCocher(false));
  $('fiche-fermer').addEventListener('click', fermerFiche);
  $('btn-recentrer').addEventListener('click', () => {
    fermerFiche();
    map.flyTo({ ...vueDepart(), padding: { top: 0, bottom: 0, left: 0, right: 0 }, duration: 2200 });
  });
  $('btn-plus').addEventListener('click', () => map.zoomIn());
  $('btn-moins').addEventListener('click', () => map.zoomOut());
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!$('menu-categories').hidden) ouvrirMenu(false);
    else fermerFiche();
  });
  window.addEventListener('hashchange', ouvrirDepuisAdresse);
  setTimeout(() => $('aide').classList.add('cachee'), 9000);
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
  };
  if (map.loaded()) pret();
  else map.once('load', pret);
}

demarrer().catch((e) => {
  console.error(e);
  $('txt-chargement').textContent = 'Oops! The map could not load. Please refresh the page.';
});
