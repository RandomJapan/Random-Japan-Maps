// ================================================================
//  Les grandes villes (demandées le 2026-10-22 ; en mode développeur pour l'instant).
//  Chaque ville a un petit pin dessiné (une ville en miniature, sans nom : il n'apparaît que de près).
//  Un clic : le contour de la ville en « plan ancien » (double trait sépia, lavis ocre, hachures) et sa fiche,
//  avec le carrousel TikTok de la ville quand le propriétaire en a fait un (onglet « Villes » du tableau) :
//  ses lieux sont numérotés sur la carte, et la carte suit les photos qu'on fait défiler dans le lecteur TikTok.
//  Contours : data/villes.geojson (outils/fabriquer_villes.py), chargés au premier clic.
// ================================================================
import { echapper, tactile } from './commun.js';

// pref : le numéro de la préfecture ; loin : visible aussi en vue lointaine (sinon le Kansai serait illisible)
export const VILLES = [
  { id: 'sapporo', nom: 'Sapporo', ja: '札幌', pref: 1, centre: [141.3543, 43.0619], loin: true },
  { id: 'hakodate', nom: 'Hakodate', ja: '函館', pref: 1, centre: [140.729, 41.7688], loin: true },
  { id: 'sendai', nom: 'Sendai', ja: '仙台', pref: 4, centre: [140.8691, 38.2678], loin: true },
  { id: 'tokyo', nom: 'Tokyo', ja: '東京', pref: 13, centre: [139.7671, 35.6812], loin: true },
  { id: 'yokohama', nom: 'Yokohama', ja: '横浜', pref: 14, centre: [139.6344, 35.4503] },
  { id: 'nagoya', nom: 'Nagoya', ja: '名古屋', pref: 23, centre: [136.8998, 35.1851], loin: true },
  { id: 'kanazawa', nom: 'Kanazawa', ja: '金沢', pref: 17, centre: [136.6569, 36.5616], loin: true },
  { id: 'kyoto', nom: 'Kyoto', ja: '京都', pref: 26, centre: [135.7681, 35.0116], loin: true },
  { id: 'osaka', nom: 'Osaka', ja: '大阪', pref: 27, centre: [135.5015, 34.6938] },
  { id: 'kobe', nom: 'Kobe', ja: '神戸', pref: 28, centre: [135.1944, 34.6932] },
  { id: 'nara', nom: 'Nara', ja: '奈良', pref: 29, centre: [135.8048, 34.6845] },
  { id: 'okayama', nom: 'Okayama', ja: '岡山', pref: 33, centre: [133.9195, 34.6554] },
  { id: 'hiroshima', nom: 'Hiroshima', ja: '広島', pref: 34, centre: [132.4518, 34.3917], loin: true },
  { id: 'takamatsu', nom: 'Takamatsu', ja: '高松', pref: 37, centre: [134.0465, 34.3426] },
  { id: 'matsuyama', nom: 'Matsuyama', ja: '松山', pref: 38, centre: [132.7654, 33.8395], loin: true },
  { id: 'fukuoka', nom: 'Fukuoka', ja: '福岡', pref: 40, centre: [130.4018, 33.5899], loin: true },
  { id: 'nagasaki', nom: 'Nagasaki', ja: '長崎', pref: 42, centre: [129.8781, 32.7502], loin: true },
  { id: 'kumamoto', nom: 'Kumamoto', ja: '熊本', pref: 43, centre: [130.7083, 32.8034] },
  { id: 'kagoshima', nom: 'Kagoshima', ja: '鹿児島', pref: 46, centre: [130.5572, 31.5968], loin: true },
  { id: 'naha', nom: 'Naha', ja: '那覇', pref: 47, centre: [127.6791, 26.2122], loin: true },
];

const ZOOM_NOM = 9.5;       // le nom de la ville apparaît sous son pin à partir de ce zoom
const ZOOM_TOUTES = 6.2;    // en dessous (vue lointaine), seulement les villes marquées « loin »
const ZOOM_LIEU = 14;       // en volant vers un lieu du carrousel
const HACHURES_M = 400;     // écart des hachures sur le sol, en mètres (fixes sur le sol : elles grandissent en zoomant)
const AVANT = 'cote-encre'; // les couches de la ville passent sous l'encre de la côte

// Une ville en miniature, à l'encre et à l'aquarelle (le pin choisi par le propriétaire, le « C » des exemples)
const DESSIN = `<svg viewBox="0 0 48 36" aria-hidden="true">
  <path d="M3 33h42" stroke="#4a3521" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M6 33v-9l6-4 6 4v9z" fill="#e9dcc0" stroke="#4a3521" stroke-width="1.3" stroke-linejoin="round"/>
  <path d="M4.5 24.5l7.5-5.5 7.5 5.5" fill="none" stroke="#5d3f2a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M30 33v-8h12v8z" fill="#e9dcc0" stroke="#4a3521" stroke-width="1.3"/>
  <path d="M28.5 25.5l7.5-5 7.5 5z" fill="#7d4a32" stroke="#4a3521" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M19 33V19h10v14z" fill="#f2e8d2" stroke="#4a3521" stroke-width="1.3"/>
  <path d="M16.5 20l7.5-5 7.5 5z" fill="#a8321f" stroke="#4a3521" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M20.5 15.5V11h7v4.5" fill="#f2e8d2" stroke="#4a3521" stroke-width="1.2"/>
  <path d="M18.5 12l5.5-4.5 5.5 4.5z" fill="#a8321f" stroke="#4a3521" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M24 7.5V4.5" stroke="#4a3521" stroke-width="1.2"/>
  <path d="M22 33v-5h4v5" fill="#5d3f2a"/>
  <path d="M21.5 23h5M8.5 28h7M32.5 29h7" stroke="#4a3521" stroke-width="0.9" opacity="0.6"/>
</svg>`;

/** Les lieux d'un carrousel, une ligne par photo : « Nom | 日本語 | lat, lng » (le japonais peut manquer). */
function lireLieux(texte, lireGPS) {
  return String(texte || '').split(/\n|;(?=[^|]*\|)/).map((ligne) => ligne.trim()).filter(Boolean).map((ligne) => {
    const morceaux = ligne.split('|').map((m) => m.trim());
    const gps = lireGPS(morceaux.at(-1));
    if (!gps || morceaux.length < 2) return null;
    return { nom: morceaux[0].replace(/^\d+\s*[-.)]\s*/, ''), ja: morceaux.length > 2 ? morceaux[1] : '', ...gps };
  });
}

/** Les anneaux d'un (Multi)Polygon GeoJSON. */
const anneaux = (geom) => (geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates).flat();

function dedans([x, y], rings) {
  let c = false;
  for (const r of rings) {
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const [xi, yi] = r[i], [xj, yj] = r[j];
      if ((yi > y) !== (yj > y) && x < xi + ((y - yi) * (xj - xi)) / (yj - yi)) c = !c;
    }
  }
  return c;
}

/**
 * Les hachures du plan ancien, en vraies lignes posées sur le sol (un motif de remplissage garderait sa taille
 * en pixels par niveau de tuile : il s'écartait puis doublait d'un coup en zoomant, déjà vu avec les saisons).
 * Des droites à 45° tous les HACHURES_M mètres, coupées par le contour (règle pair-impair).
 */
function hachures(rings) {
  const lat0 = rings[0][0][1];
  const kx = 111320 * Math.cos((lat0 * Math.PI) / 180), ky = 110574;
  const versUV = ([lng, lat]) => { const x = lng * kx, y = lat * ky; return [(x + y) / Math.SQRT2, (y - x) / Math.SQRT2]; };
  const versLngLat = (u, v) => { const x = (u - v) / Math.SQRT2, y = (u + v) / Math.SQRT2; return [x / kx, y / ky]; };
  const uv = rings.map((r) => r.map(versUV));
  let vMin = Infinity, vMax = -Infinity;
  for (const r of uv) for (const [, v] of r) { vMin = Math.min(vMin, v); vMax = Math.max(vMax, v); }
  const traits = [];
  for (let v = Math.ceil(vMin / HACHURES_M) * HACHURES_M; v < vMax; v += HACHURES_M) {
    const us = [];
    for (const r of uv) {
      for (let i = 0; i < r.length - 1; i++) {
        const [ua, va] = r[i], [ub, vb] = r[i + 1];
        if ((va <= v && v < vb) || (vb <= v && v < va)) us.push(ua + ((v - va) / (vb - va)) * (ub - ua));
      }
    }
    us.sort((a, b) => a - b);
    for (let i = 0; i + 1 < us.length; i += 2) traits.push([versLngLat(us[i], v), versLngLat(us[i + 1], v)]);
  }
  return { type: 'Feature', properties: {}, geometry: { type: 'MultiLineString', coordinates: traits } };
}

/**
 * @param o outils de app.js : t, enLangue, langue(), reperes, lieux(), lireVilles() (lignes du tableau),
 *   champ, lireGPS, paddingFiche, estTelephone, nomPrefecture(code), nomRegion(code), avant() (arrête la visite et
 *   la rotation, oublie le lieu ouvert), ouvrirLieu(l), fermerFiche(), envoyer(url, nom), SVG
 */
export function brancherVilles(map, maplibregl, o) {
  const $ = (id) => document.getElementById(id);
  let contours = null; // promesse : id → feature
  const carrousels = new Map(); // id de la ville → { lien, video, lieux: [{ nom, ja, lng, lat }] }
  let ouverte = null; // { v, points: [marker], feature, rings, choisi: le lieu du carrousel montré (0 : toute la ville) }
  let montrees = true;
  let loin = map.getZoom() < ZOOM_TOUTES;
  let noms = null;

  // ---- Les pins
  for (const v of VILLES) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'ville';
    el.innerHTML = `<span class="ville-dessin">${DESSIN}</span><span class="ville-nom"></span>`;
    el.addEventListener('click', (e) => { e.stopPropagation(); ouvrir(v); });
    v.el = el;
    v.repere = new maplibregl.Marker({ element: el, anchor: 'bottom', opacityWhenCovered: '0.35' }).setLngLat(v.centre);
    // devant les épingles des lieux (MapLibre ajoute à la fin) : sinon une épingle près de l'hôtel de ville
    // couvrait la ville et prenait le clic ; une épingle survolée repasse devant (.repere:hover, z-index 3)
    o.reperes.suivre(v.repere, { voulu: voulue(v) });
  }
  function voulue(v) {
    return montrees && (!loin || v.loin || ouverte?.v === v);
  }
  function majPins() {
    for (const v of VILLES) o.reperes.montrer(v.repere, voulue(v));
  }
  function majZoom() {
    const z = map.getZoom();
    if ((z < ZOOM_TOUTES) !== loin) { loin = !loin; majPins(); }
    // une classe sur la carte seulement au passage du seuil (jamais à chaque image : tout se recalculerait)
    if ((z >= ZOOM_NOM) !== noms) { noms = z >= ZOOM_NOM; map.getContainer().classList.toggle('noms-villes', noms); }
  }
  map.on('zoom', majZoom);
  majZoom();
  setTimeout(() => chargerContours().catch(() => {}), 4000); // en avance, pour que le premier clic vole tout de suite

  function nommer() {
    for (const v of VILLES) {
      v.el.querySelector('.ville-nom').textContent = o.langue() === 'ja' ? v.ja : v.nom;
      v.el.setAttribute('aria-label', o.t('villeAria', o.langue() === 'ja' ? v.ja : v.nom));
    }
  }
  nommer();

  // ---- Les carrousels (onglet « Villes » du tableau)
  const pretes = o.lireVilles().then((lignes) => {
    for (const l of lignes) {
      if (/^non$/i.test(o.champ(l, ['afficher', 'visible']))) continue;
      const nom = o.champ(l, ['ville', 'villeen', 'nom', 'nomen']).toLowerCase();
      const v = VILLES.find((x) => x.id === nom.replace(/[^a-z]/g, '') || x.ja === nom.replace(/市$/, ''));
      const lien = o.champ(l, ['lientiktok', 'tiktok', 'lien', 'carrousel']);
      if (!v || !lien) continue;
      carrousels.set(v.id, { lien, video: (lien.match(/\/(?:photo|video)\/(\d+)/) || [])[1] || '', lieux: lireLieux(o.champ(l, ['lieux', 'lieuxducarrousel']), o.lireGPS).filter(Boolean) });
    }
  }).catch((e) => console.warn('Onglet « Villes » illisible', e));

  // ---- Le contour (plan ancien) et les hachures
  function chargerContours() {
    contours ??= fetch('data/villes.geojson').then((r) => r.json())
      .then((g) => new Map(g.features.map((f) => [f.properties.id, f])));
    contours.catch(() => { contours = null; });
    return contours;
  }
  function couches() {
    if (map.getSource('ville')) return;
    const vide = { type: 'FeatureCollection', features: [] };
    map.addSource('ville', { type: 'geojson', data: vide, maxzoom: 12 });
    map.addSource('ville-hachures', { type: 'geojson', data: vide, maxzoom: 12 });
    map.addLayer({ id: 'ville-lavis', type: 'fill', source: 'ville', paint: { 'fill-color': '#c99a52', 'fill-opacity': 0.22 } }, AVANT);
    map.addLayer({
      id: 'ville-hachures', type: 'line', source: 'ville-hachures',
      // de très près, des hachures fixes sur le sol deviendraient de grandes rayures : elles s'effacent
      paint: { 'line-color': '#5d3f2a', 'line-opacity': ['interpolate', ['linear'], ['zoom'], 11.5, 0.42, 13.5, 0], 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.4, 13, 1.3] },
    }, AVANT);
    map.addLayer({
      id: 'ville-trait', type: 'line', source: 'ville',
      paint: { 'line-color': '#4a3521', 'line-opacity': 0.85, 'line-width': ['interpolate', ['linear'], ['zoom'], 7, 1.6, 11, 3.2, 14, 4] },
      layout: { 'line-join': 'round' },
    }, AVANT);
    map.addLayer({
      id: 'ville-filet', type: 'line', source: 'ville',
      paint: { 'line-color': '#4a3521', 'line-opacity': 0.8, 'line-width': 1, 'line-offset': ['interpolate', ['linear'], ['zoom'], 7, 3, 11, 5] },
      layout: { 'line-join': 'round' },
    }, AVANT);
  }
  function dessiner(f) {
    // ville ouverte par un lien (#ville-fukuoka) avant que le style de la carte soit chargé : on attend
    if (!map.style?._loaded) {
      map.once('style.load', () => { if (ouverte?.feature === f) dessiner(f); });
      return;
    }
    couches();
    const vide = { type: 'FeatureCollection', features: [] };
    map.getSource('ville').setData(f || vide);
    map.getSource('ville-hachures').setData(f ? hachures(anneaux(f.geometry)) : vide);
  }

  // ---- Les lieux numérotés du carrousel
  function creerPoints(liste) {
    return liste.map((l, i) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'point-ville';
      el.innerHTML = `<span class="point-ville-n">${i + 1}</span><span class="point-ville-nom"></span>`;
      el.querySelector('.point-ville-nom').textContent = o.langue() === 'ja' && l.ja ? l.ja : l.nom;
      el.setAttribute('aria-label', `${i + 1}. ${l.nom}`);
      el.addEventListener('click', (e) => { e.stopPropagation(); choisir(i + 1, { voler: true }); });
      const m = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([l.lng, l.lat]);
      o.reperes.suivre(m);
      return m;
    });
  }

  // ---- La caméra
  /** Le rectangle des grands morceaux de la ville (≥ 10 % du plus grand) : Fukuoka va jusqu'à l'îlot d'Oronoshima, à 40 km en mer. */
  function bornesDe(f) {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    const aire = (r) => Math.abs(r.reduce((s, [x0, y0], i) => { const [x1, y1] = r[(i + 1) % r.length]; return s + x0 * y1 - x1 * y0; }, 0)) / 2;
    const aires = polys.map((p) => aire(p[0]));
    const max = Math.max(...aires);
    let o_ = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
    polys.forEach((p, i) => {
      if (aires[i] < max * 0.1) return;
      for (const [x, y] of p[0]) { o_ = Math.min(o_, x); e = Math.max(e, x); s = Math.min(s, y); n = Math.max(n, y); }
    });
    return [[o_, s], [e, n]];
  }
  /**
   * La ville entière dans la place que la fiche laisse. Calculé ici plutôt qu'avec cameraForBounds, qui tient
   * compte de la marge et de l'inclinaison du moment : le même clic donnait le zoom 9,6 ou 8,9 (7,1 sur téléphone).
   */
  function cadrerVille(f, duree = 2200) {
    const p = o.paddingFiche();
    const marge = o.estTelephone() ? 14 : 36; // sur téléphone, la fiche laisse peu de carte
    const [x, y] = ouverte.v.centre;
    const b = f ? bornesDe(f) : [[x - 0.12, y - 0.1], [x + 0.12, y + 0.1]];
    const merc = ([lng, lat]) => [(lng + 180) / 360, (1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) / 2];
    // le rectangle de la ville, tourné comme la carte
    const a = (map.getBearing() * Math.PI) / 180;
    const coins = [b[0], [b[1][0], b[0][1]], b[1], [b[0][0], b[1][1]]].map(merc);
    const rx = coins.map(([u, v]) => u * Math.cos(a) + v * Math.sin(a)), ry = coins.map(([u, v]) => v * Math.cos(a) - u * Math.sin(a));
    const { clientWidth: w, clientHeight: h } = map.getContainer();
    const largeur = Math.max(80, w - p.left - p.right - 2 * marge), hauteur = Math.max(80, h - p.top - p.bottom - 2 * marge);
    const echelle = Math.min(largeur / (Math.max(...rx) - Math.min(...rx)), hauteur / (Math.max(...ry) - Math.min(...ry)));
    const [, v0] = merc(b[0]), [, v1] = merc(b[1]);
    const latMilieu = (Math.atan(Math.sinh(Math.PI * (1 - (v0 + v1)))) * 180) / Math.PI;
    map.flyTo({
      center: [(b[0][0] + b[1][0]) / 2, latMilieu],
      zoom: Math.min(12.5, Math.log2(echelle / 512) - 0.25), // un peu moins : la vue est penchée
      pitch: 40, bearing: map.getBearing(), padding: p, duration: duree, essential: true,
    });
  }

  // ---- La fiche (la même que pour un lieu, en mode « ville »)
  function remplir() {
    if (!ouverte) return;
    const { v } = ouverte;
    const c = carrousels.get(v.id);
    const ja = o.langue() === 'ja';
    const nom = ja ? v.ja : v.nom;
    // le sceau rouge porte les kanji de la ville ; en japonais, le titre l'est déjà
    $('fiche-nom').innerHTML = `${ja ? '' : `<span class="sceau-ville" lang="ja">${echapper(v.ja)}</span>`}<span>${echapper(nom)}</span>`;
    $('fiche-nom-jp').textContent = ja ? v.nom : '';
    $('fiche-categorie').textContent = [o.t('ville'), o.t('prefectureDe', o.nomPrefecture(v.pref), v.pref), o.nomRegion(v.pref)].filter(Boolean).join(' · ');

    let html = '';
    if (c?.lieux.length) {
      html += `<h3 class="ville-titre">${echapper(o.t('villeLieux', c.lieux.length, nom))}</h3><ol class="ville-liste">`;
      c.lieux.forEach((l, i) => {
        html += `<li><button type="button" data-n="${i + 1}"${ouverte.choisi === i + 1 ? ' aria-current="true"' : ''}><span class="ville-n">${i + 1}</span><span>${echapper(ja && l.ja ? l.ja : l.nom)}</span></button></li>`;
      });
      html += '</ol>';
    }
    const dansLaVille = ouverte.rings ? o.lieux().filter((l) => l.cat.visible && dedans([l.lng, l.lat], ouverte.rings)) : [];
    if (dansLaVille.length) {
      html += `<p class="ville-aussi">${echapper(o.t('villeAussi'))}</p><div class="ville-puces">`;
      for (const l of dansLaVille) html += `<button type="button" data-lieu="${echapper(l.id)}"><span class="pastille" style="--c:${l.cat.couleur}"></span>${echapper(o.enLangue(l.nom))}</button>`;
      html += '</div>';
    }
    const partage = !!navigator.share && tactile();
    html += `<div class="ville-boutons">${c ? `<a class="principal" href="${echapper(c.lien)}" target="_blank" rel="noopener">${o.SVG.tiktok}${echapper(o.t('voirCarrousel'))}</a>` : ''}`
      + `<button type="button" class="ville-partager" data-partager title="${echapper(o.t(partage ? 'partager' : 'copierLien'))}" aria-label="${echapper(o.t(partage ? 'partager' : 'copierLien'))}">${partage ? o.SVG.partager : o.SVG.lien}</button></div>`;
    $('fiche-ville').innerHTML = html;
  }

  $('fiche-ville').addEventListener('click', (e) => {
    const n = e.target.closest('[data-n]');
    if (n) return choisir(Number(n.dataset.n), { voler: true });
    const lieu = e.target.closest('[data-lieu]');
    if (lieu) { const l = o.lieux().find((x) => x.id === lieu.dataset.lieu); if (l) o.ouvrirLieu(l); return; }
    if (e.target.closest('[data-partager]') && ouverte) o.envoyer(`${location.origin}${location.pathname}#ville-${ouverte.v.id}`, ouverte.v.nom);
  });

  function lecteur(c) {
    const media = $('fiche-media');
    media.innerHTML = '';
    if (!c?.video) return;
    // autoplay=0 : rien ne joue (ni la musique du carrousel) avant que le visiteur le touche ;
    // le lecteur prévient quand même à chaque photo (onImageChange), et la carte suit
    const src = `https://www.tiktok.com/player/v1/${c.video}?autoplay=0&music_info=1&description=0&rel=0`;
    media.innerHTML = `<div class="video-cadre"><iframe class="video carrousel" src="${src}" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" title="TikTok"></iframe></div>`
      // le lecteur n'a pas de flèches qui marchent dans ce format : on fait glisser les photos
      + `<p class="ville-astuce">${echapper(o.t('villeGlisser'))}</p>`;
  }

  // Le lecteur TikTok annonce chaque photo : { type: 'onImageChange', value: n } (0 = la couverture)
  addEventListener('message', (e) => {
    if (!ouverte) return;
    const cadre = $('fiche-media').querySelector('iframe.carrousel');
    if (!cadre || e.source !== cadre.contentWindow) return;
    let d = e.data;
    try { if (typeof d === 'string') d = JSON.parse(d); } catch { return; }
    if (d?.type === 'onImageChange' && Number.isInteger(d.value)) choisir(d.value, { voler: true });
  });

  /** n : le numéro du lieu du carrousel (1…), 0 = toute la ville. */
  function choisir(n, { voler = false } = {}) {
    if (!ouverte) return;
    const c = carrousels.get(ouverte.v.id);
    if (n && !c?.lieux[n - 1]) return;
    ouverte.choisi = n;
    ouverte.points.forEach((m, i) => m.getElement().classList.toggle('actif', i + 1 === n));
    for (const b of $('fiche-ville').querySelectorAll('[data-n]')) {
      if (Number(b.dataset.n) === n) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
    }
    if (!voler) return;
    if (!n) return cadrerVille(ouverte.feature, 1600);
    const l = c.lieux[n - 1];
    map.flyTo({
      center: [l.lng, l.lat], zoom: Math.max(map.getZoom(), ZOOM_LIEU), pitch: o.estTelephone() ? 50 : 56,
      bearing: map.getBearing(), padding: o.paddingFiche(), duration: 1800, essential: true,
    });
  }

  async function ouvrir(v) {
    if (ouverte?.v === v) return cadrerVille(ouverte.feature, 1200);
    o.avant();
    quitter();
    const fiche = $('fiche');
    ouverte = { v, points: [], rings: null, feature: null, choisi: 0 };
    v.el.classList.add('actif');
    majPins();
    fiche.classList.add('ouverte', 'mode-ville');
    fiche.setAttribute('aria-hidden', 'false');
    $('fiche-defil').scrollTop = 0;
    if (location.hash !== `#ville-${v.id}`) history.replaceState(null, '', `#ville-${v.id}`);
    $('fiche-media').innerHTML = '';
    remplir(); // tout de suite le nom de la ville (pas celui du lieu ouvert avant)
    await pretes;
    if (ouverte?.v !== v) return;
    const c = carrousels.get(v.id);
    lecteur(c);
    remplir();
    ouverte.points = creerPoints(c?.lieux || []);
    const f = (await chargerContours().catch(() => null))?.get(v.id);
    if (ouverte?.v !== v) return;
    if (f) {
      ouverte.feature = f;
      ouverte.rings = anneaux(f.geometry);
      dessiner(f);
    }
    remplir(); // avec les lieux de la carte qui sont dans la ville
    cadrerVille(f);
  }

  /** La fiche passe à un lieu, ou se ferme : la ville s'efface (contour, points, mode de la fiche). */
  function quitter() {
    if (!ouverte) return;
    ouverte.v.el.classList.remove('actif');
    for (const m of ouverte.points) o.reperes.oublier(m);
    ouverte = null;
    majPins();
    dessiner(null);
    $('fiche').classList.remove('mode-ville');
    $('fiche-ville').innerHTML = '';
    $('fiche-media').innerHTML = '';
  }

  return {
    ouvrir: (id) => { const v = VILLES.find((x) => x.id === id); if (v) ouvrir(v); },
    quitter,
    ouverte: () => !!ouverte,
    /** Changement de langue : les noms des pins, des points et la fiche. */
    langue() {
      nommer();
      if (!ouverte) return;
      const c = carrousels.get(ouverte.v.id);
      ouverte.points.forEach((m, i) => { m.getElement().querySelector('.point-ville-nom').textContent = o.langue() === 'ja' && c.lieux[i].ja ? c.lieux[i].ja : c.lieux[i].nom; });
      const astuce = $('fiche-media').querySelector('.ville-astuce');
      if (astuce) astuce.textContent = o.t('villeGlisser');
      remplir();
    },
    /** false : les pins disparaissent (sortie du mode développeur) et la ville ouverte se ferme. */
    montrer(oui) {
      montrees = oui;
      if (!oui && ouverte) o.fermerFiche();
      majPins();
    },
  };
}
