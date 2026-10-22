// ================================================================
//  Les grandes villes (demandées le 2026-10-22).
//  Chaque ville a un petit pin dessiné (une ville en miniature, sans nom : il n'apparaît que de près).
//  Un clic : le contour de la ville en « plan ancien » (double trait sépia, lavis ocre, hachures) et sa fiche :
//  une courte description (onglet « Villes » du tableau) et, quand le propriétaire en a fait un, le carrousel
//  TikTok de la ville. Ses lieux (onglet « Lieux des villes ») sont numérotés sur la carte ; un lieu ouvre un
//  petit encadré qui l'explique, et la carte et le carrousel se suivent dans les deux sens.
//  Contours : data/villes.geojson (outils/fabriquer_villes.py), chargés au premier clic.
// ================================================================
import { echapper, kmEntre, tactile } from './commun.js';

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
  { id: 'takayama', nom: 'Takayama', ja: '高山', pref: 21, centre: [137.251, 36.1396], loin: true },
];

const ZOOM_NOM = 9.5;       // le nom de la ville apparaît sous son pin à partir de ce zoom
const ZOOM_TOUTES = 6.2;    // en dessous (vue lointaine), seulement les villes marquées « loin »
const ZOOM_LIEU = 14;       // en volant vers un lieu du carrousel
const HACHURES_M = 400;     // écart des hachures sur le sol, en mètres (fixes sur le sol : elles grandissent en zoomant)
const AVANT = 'cote-encre'; // les couches de la ville passent sous l'encre de la côte
const MEME_LIEU_KM = 0.3;   // un lieu du carrousel à moins de 300 m d'un lieu de la carte est le même : un seul pin

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
 * @param o outils de app.js : t, enLangue, langue(), reperes, lieux(), lireVilles() (les lignes des onglets
 *   « Villes » et « Lieux des villes »), champ, lireGPS, paddingFiche, estTelephone, nomPrefecture(code),
 *   nomRegion(code), avant() (arrête la visite et la rotation, oublie le lieu ouvert), ouvrirLieu(l), fermerFiche(),
 *   envoyer(url, nom), SVG
 */
export function brancherVilles(map, maplibregl, o) {
  const $ = (id) => document.getElementById(id);
  let contours = null; // promesse : id → feature
  const textes = new Map(); // id de la ville → { en, fr, ja } : sa courte description
  const carrousels = new Map(); // id de la ville → { lien, video, lieux: [{ n, nom, ja, lng, lat, texte, lieu }] }
  // la ville ouverte : { v, points: [marker], feature, rings, choisi: le lieu montré (0 : toute la ville), bulle }
  let ouverte = null;
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
    return !loin || v.loin || ouverte?.v === v;
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

  const nomVille = (v) => (o.langue() === 'ja' ? v.ja : v.nom);
  function nommer() {
    for (const v of VILLES) {
      v.el.querySelector('.ville-nom').textContent = nomVille(v);
      v.el.setAttribute('aria-label', o.t('villeAria', nomVille(v)));
    }
  }
  nommer();

  // ---- Les textes et les carrousels (onglets « Villes » et « Lieux des villes » du tableau)
  const idDe = (nom) => {
    const n = String(nom || '').trim();
    return VILLES.find((v) => v.id === n.toLowerCase().replace(/[^a-z]/g, '') || v.ja === n.replace(/市$/, ''))?.id;
  };
  const pretes = o.lireVilles().then(({ villes, lieux }) => {
    for (const l of villes) {
      const id = idDe(o.champ(l, ['ville', 'villeen', 'nom', 'nomen']));
      if (!id || /^(non|no)$/i.test(o.champ(l, ['afficher', 'visible']))) continue;
      textes.set(id, {
        en: o.champ(l, ['descriptionen', 'description']),
        fr: o.champ(l, ['descriptionfr']),
        ja: o.champ(l, ['description日本語', 'descriptionja', 'descriptionjp']),
      });
      const lien = o.champ(l, ['lientiktok', 'tiktok', 'lien', 'carrousel']);
      if (lien) carrousels.set(id, { lien, video: (lien.match(/\/(?:photo|video)\/(\d+)/) || [])[1] || '', lieux: [] });
    }
    for (const l of lieux) {
      const c = carrousels.get(idDe(o.champ(l, ['ville'])));
      const gps = o.lireGPS(o.champ(l, ['coordonneesgps', 'coordonnees', 'gps']));
      const n = parseInt(o.champ(l, ['n', 'no', 'numero', 'photo']), 10);
      if (!c || !gps || !(n > 0)) continue;
      c.lieux.push({
        n, ...gps, nom: o.champ(l, ['nom', 'nomen']), ja: o.champ(l, ['nom日本語', 'nomja']),
        texte: { en: o.champ(l, ['texteen', 'texte']), fr: o.champ(l, ['textefr']), ja: o.champ(l, ['texte日本語', 'texteja']) },
        lieu: null,
      });
    }
    for (const c of carrousels.values()) c.lieux.sort((a, b) => a.n - b.n);
  }).catch((e) => console.warn('Onglets « Villes » illisibles', e));

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
  const nomLieu = (l) => (o.langue() === 'ja' && l.ja ? l.ja : l.nom);
  /**
   * Un point numéroté par lieu ; un lieu qui a déjà sa propre vidéo sur la carte (à moins de MEME_LIEU_KM) n'en a
   * pas : son épingle prend le numéro (choix du propriétaire, 2026-10-22), et son encadré mène à sa vidéo.
   */
  function creerPoints(c) {
    const points = [];
    for (const l of c?.lieux || []) {
      l.lieu = o.lieux().find((x) => kmEntre(x, l) < MEME_LIEU_KM) || null;
      if (l.lieu) {
        l.lieu.el.classList.add('carrousel');
        l.lieu.el.querySelector('.repere-carrousel').textContent = l.n;
        continue;
      }
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'point-ville';
      el.innerHTML = `<span class="point-ville-n">${l.n}</span><span class="point-ville-nom"></span>`;
      el.querySelector('.point-ville-nom').textContent = nomLieu(l);
      el.setAttribute('aria-label', `${l.n}. ${nomLieu(l)}`);
      el.addEventListener('click', (e) => { e.stopPropagation(); choisir(l.n, { voler: true, lecteur: true }); });
      const m = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([l.lng, l.lat]);
      m.lieuVille = l;
      o.reperes.suivre(m);
      points.push(m);
    }
    return points;
  }

  /**
   * L'encadré d'un lieu du carrousel : son nom et ce qu'en dit la légende du TikTok. Sur ordinateur, une bulle sur
   * la carte ; sur téléphone, la fiche ne laisse qu'un tiers de carte : l'encadré va dans la fiche, sous la photo.
   */
  function bulle(l) {
    ouverte.bulle?.remove();
    ouverte.bulle = null;
    $('fiche-media').querySelector('.ville-encadre')?.remove();
    if (!l) return;
    const ja = o.langue() === 'ja';
    const second = ja ? l.nom : l.ja;
    const div = document.createElement('div');
    div.innerHTML = `<h3 class="bulle-titre"><span class="ville-n">${l.n}</span> ${echapper(nomLieu(l))}</h3>`
      + (second && second !== nomLieu(l) ? `<p class="bulle-second" lang="${ja ? 'en' : 'ja'}">${echapper(second)}</p>` : '')
      + `<p class="bulle-texte">${echapper(l.texte[o.langue()] || l.texte.en)}</p>`
      + (l.lieu ? `<button type="button" class="bulle-video">${o.SVG.lecture}${echapper(o.t('voirSaVideo'))}</button>` : '');
    div.querySelector('.bulle-video')?.addEventListener('click', () => o.ouvrirLieu(l.lieu));
    if (o.estTelephone()) {
      div.className = 'ville-encadre';
      $('fiche-media').append(div);
      return;
    }
    // à droite du lieu (au-dessus, elle passait sous les boutons du haut) ; pour un lieu de la carte, à hauteur de la
    // tête de son épingle, qui monte au-dessus de son modèle 3D en zoomant
    const decalage = () => (l.lieu ? [26, (l.lieu.epingle.getOffset().y || 0) - 28] : [18, 0]);
    const popup = new maplibregl.Popup({ className: 'bulle-legende bulle-ville', anchor: 'left', offset: decalage(), maxWidth: '290px', focusAfterOpen: false })
      .setLngLat([l.lng, l.lat]).setDOMContent(div).addTo(map);
    if (l.lieu) map.once('moveend', () => { if (ouverte?.bulle === popup) popup.setOffset(decalage()); });
    ouverte.bulle = popup;
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
    const lang = o.langue();
    const ja = lang === 'ja';
    // le sceau rouge porte les kanji de la ville ; en japonais, le titre l'est déjà
    $('fiche-nom').innerHTML = `${ja ? '' : `<span class="sceau-ville" lang="ja">${echapper(v.ja)}</span>`}<span>${echapper(nomVille(v))}</span>`;
    $('fiche-nom-jp').textContent = ja ? v.nom : '';
    $('fiche-categorie').textContent = [o.t('ville'), o.t('prefectureDe', o.nomPrefecture(v.pref), v.pref), o.nomRegion(v.pref)].filter(Boolean).join(' · ');

    const desc = textes.get(v.id);
    let html = desc && (desc[lang] || desc.en) ? `<p class="ville-texte">${echapper(desc[lang] || desc.en)}</p>` : '';
    if (c?.lieux.length) {
      html += `<h3 class="ville-titre">${echapper(o.t('villeLieux', c.lieux.length, nomVille(v)))}</h3><ol class="ville-liste">`;
      for (const l of c.lieux) {
        html += `<li><button type="button" data-n="${l.n}"${ouverte.choisi === l.n ? ' aria-current="true"' : ''}><span class="ville-n">${l.n}</span><span>${echapper(nomLieu(l))}</span></button></li>`;
      }
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
    if (n) return choisir(Number(n.dataset.n), { voler: true, lecteur: true });
    const lieu = e.target.closest('[data-lieu]');
    if (lieu) { const l = o.lieux().find((x) => x.id === lieu.dataset.lieu); if (l) o.ouvrirLieu(l); return; }
    if (e.target.closest('[data-partager]') && ouverte) o.envoyer(`${location.origin}${location.pathname}#ville-${ouverte.v.id}`, ouverte.v.nom);
  });

  // ---- Le carrousel : le lecteur TikTok
  function lecteur(c) {
    const media = $('fiche-media');
    media.innerHTML = '';
    if (!c?.video) return;
    // autoplay=0 : rien ne joue avant que le visiteur le touche ; muted=1 (et « mute » dès qu'il joue) : la musique
    // du carrousel commence coupée, le bouton du lecteur la remet (demandé par le propriétaire)
    const src = `https://www.tiktok.com/player/v1/${c.video}?autoplay=0&muted=1&music_info=1&description=0&rel=0`;
    media.innerHTML = `<div class="video-cadre"><iframe class="video carrousel" src="${src}" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" title="TikTok"></iframe></div>`
      // les flèches du lecteur ne marchent pas dans ce format : on fait glisser les photos
      + `<p class="ville-astuce">${echapper(o.t('villeGlisser'))}</p>`;
  }
  /** Un ordre au lecteur TikTok (son API postMessage) : mute, navigateTo (aller à la photo n)… */
  function commander(type, value) {
    $('fiche-media').querySelector('iframe.carrousel')?.contentWindow?.postMessage({ type, value, 'x-tiktok-player': true }, '*');
  }
  // Le lecteur annonce chaque photo : { type: 'onImageChange', value: n } (0 = la couverture). Il obéit à
  // { type: 'navigateTo', value: n } (trouvé dans son code : c'est ce qui fait tourner le carrousel).
  addEventListener('message', (e) => {
    if (!ouverte) return;
    const cadre = $('fiche-media').querySelector('iframe.carrousel');
    if (!cadre || e.source !== cadre.contentWindow) return;
    let d = e.data;
    try { if (typeof d === 'string') d = JSON.parse(d); } catch { return; }
    if (d?.type === 'onPlayerReady') commander('mute');
    else if (d?.type === 'onStateChange' && d.value === 1 && !ouverte.sonCoupe) { ouverte.sonCoupe = true; commander('mute'); }
    else if (d?.type === 'onImageChange' && Number.isInteger(d.value)) choisir(d.value, { voler: true });
  });

  /**
   * n : le numéro du lieu du carrousel (1…), 0 = toute la ville. lecteur : le choix vient de la fiche ou de la carte,
   * le carrousel va à cette photo (il le confirme ensuite par onImageChange, qui ne refait rien).
   */
  function choisir(n, { voler = false, lecteur: suivre = false } = {}) {
    if (!ouverte) return;
    const c = carrousels.get(ouverte.v.id);
    const l = n ? c?.lieux.find((x) => x.n === n) : null;
    if (n && !l) return;
    const deja = ouverte.choisi === n;
    ouverte.choisi = n;
    for (const m of ouverte.points) m.getElement().classList.toggle('actif', m.lieuVille.n === n);
    for (const x of c?.lieux || []) x.lieu?.el.classList.toggle('actif', x.n === n);
    for (const b of $('fiche-ville').querySelectorAll('[data-n]')) {
      if (Number(b.dataset.n) === n) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
    }
    if (suivre) commander('navigateTo', n);
    else if (deja) return;
    bulle(l);
    // sur téléphone, la fiche remonte en haut : la photo du carrousel et l'encadré du lieu
    if (l && o.estTelephone()) $('fiche-defil').scrollTo({ top: 0, behavior: 'smooth' });
    if (!voler) return;
    if (!n) return cadrerVille(ouverte.feature, 1600);
    // sur ordinateur, le lieu un peu à gauche : sa bulle est à sa droite ; un lieu de la carte un peu plus bas, la
    // tête de son épingle (et la bulle) montant bien au-dessus de son modèle 3D
    const p = o.paddingFiche();
    map.flyTo({
      center: [l.lng, l.lat], zoom: Math.max(map.getZoom(), ZOOM_LIEU), pitch: o.estTelephone() ? 50 : 56, bearing: map.getBearing(),
      padding: o.estTelephone() ? p : { ...p, right: p.right + 300, top: p.top + (l.lieu ? 180 : 0) }, duration: 1800, essential: true,
    });
  }

  async function ouvrir(v) {
    if (ouverte?.v === v) return cadrerVille(ouverte.feature, 1200);
    o.avant();
    quitter();
    const fiche = $('fiche');
    ouverte = { v, points: [], rings: null, feature: null, choisi: 0, bulle: null, sonCoupe: false };
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
    ouverte.points = creerPoints(c);
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

  /** La fiche passe à un lieu, ou se ferme : la ville s'efface (contour, points, encadré, mode de la fiche). */
  function quitter() {
    if (!ouverte) return;
    ouverte.v.el.classList.remove('actif');
    ouverte.bulle?.remove();
    for (const m of ouverte.points) o.reperes.oublier(m);
    for (const l of carrousels.get(ouverte.v.id)?.lieux || []) {
      l.lieu?.el.classList.remove('carrousel', 'actif');
      l.lieu = null;
    }
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
    /** Changement de langue : les noms des pins, des points, l'encadré et la fiche. */
    langue() {
      nommer();
      if (!ouverte) return;
      for (const m of ouverte.points) m.getElement().querySelector('.point-ville-nom').textContent = nomLieu(m.lieuVille);
      const astuce = $('fiche-media').querySelector('.ville-astuce');
      if (astuce) astuce.textContent = o.t('villeGlisser');
      remplir();
      if (ouverte.bulle) bulle(carrousels.get(ouverte.v.id)?.lieux.find((x) => x.n === ouverte.choisi));
    },
  };
}
