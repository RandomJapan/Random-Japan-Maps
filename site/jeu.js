// ================================================================
//  Jeu « Devine le lieu » (pas encore public : le bouton n'existe qu'en mode
//  développeur, voir app.js).
//  Une partie = 5 manches. À chaque manche, la photo d'un lieu de la carte et
//  30 secondes : le joueur pose son épingle sur la carte 3D, puis on révèle le
//  vrai lieu, la distance et les points (1000 au plus par manche). Un indice
//  montre la région, puis la préfecture, contre une partie des points.
//  Les meilleurs scores restent dans ce navigateur (localStorage).
//  Pendant la partie, les épingles et les modèles 3D des lieux sont cachés.
// ================================================================
import { PREFECTURES, regionDe } from './regions.js';

const MANCHES = 5;
const POINTS_MAX = 1000;
const ECHELLE_KM = 250; // points = 1000 × e^(−km/250) : 1000 à 0 km, 670 à 100 km, 368 à 250 km, 135 à 500 km
const ECART_MIN_KM = 80; // les lieux d'une même partie sont éloignés les uns des autres
const DUREE_MANCHE = 30; // secondes pour poser son épingle ; ensuite, l'épingle posée compte (sans épingle : 0 point)
const ATTENTE_IMAGE = 5000; // ms : le chrono part quand la photo s'affiche, au plus tard au bout de ce temps
const PART_INDICES = [1, 0.75, 0.5]; // part des points gardée : sans indice, après la région, après la préfecture
const MEMO_RECORDS = 'jeuRecords'; // localStorage : { parties, meilleurs: [{ score, date }] } (les 10 meilleurs)
const NB_RECORDS = 10;
const RECORDS_MONTRES = 5;
const ROUGE = '#a8321f';
const SANS_MARGE = { top: 0, bottom: 0, left: 0, right: 0 };

const ICONES = {
  fermer: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M6 6l12 12M18 6 6 18"/></svg>',
  epingle: '<svg viewBox="0 0 32 44" aria-hidden="true"><path d="M16 1.5C8.3 1.5 2.5 7.4 2.5 15c0 9.6 13.5 27 13.5 27s13.5-17.4 13.5-27c0-7.6-5.8-13.5-13.5-13.5Z" fill="#a8321f" stroke="#f6eedb" stroke-width="2.2"/><circle cx="16" cy="15" r="5.2" fill="#f6eedb"/></svg>',
  partager: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6"/></svg>',
  indice: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9.5 18h5M10.5 21h3M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3Z"/></svg>',
  chrono: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13.5" r="7.5" fill="none" stroke="currentColor" stroke-width="2"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 13.5V9.5M10 2.5h4M18.5 6.5l1.3-1.3"/></svg>',
};

/**
 * outils : { t, enLangue, infos(lieu), lieux() → tous les lieux, reperes (reperes.js), modeles3d (couche3d.js),
 *            photo(lieu) → adresse de la photo du tableau ou '', video(lieu) → numéro de sa vidéo TikTok,
 *            prefecture(lieu) → Promise du numéro de sa préfecture, langue() → 'en' | 'fr' | 'ja',
 *            vueDepart(), estTelephone(), afficherMessage(texte), adresse, avant(), apres() }
 * Les photos : celle du tableau, sinon une photo libre de Wikimedia Commons copiée par outils/photos_jeu.py
 * (photos/jeu/<numéro de la vidéo>.jpg ; auteur et licence dans data/photos-jeu.json). Un lieu sans photo
 * n'est pas dans le jeu.
 */
export function brancherJeu(map, maplibregl, outils) {
  const { t, enLangue, infos, lieux, reperes, modeles3d, photo, video, prefecture, langue, vueDepart, estTelephone,
    afficherMessage, adresse, avant, apres } = outils;
  const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const photosLibres = fetch('data/photos-jeu.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  let contours = null; // promesse : les morceaux de chaque préfecture (boîte, aire), pour cadrer un indice
  // etat : { liste (les 5 lieux), i, phase ('accueil' | 'devine' | 'revele' | 'fin'), choix (LngLat posé), points [],
  //          images [Promise de { src, credit }], montres (lieux révélés, dont on voit l'épingle et le modèle),
  //          credit (de la photo affichée), finChrono (instant de la fin de la manche), minuterie,
  //          indices (0, 1 ou 2), prefecture (du lieu, connue au premier indice), resultat (à la fin) }
  let etat = null;

  // ---- La carte du jeu (en haut sur téléphone, à gauche sur ordinateur)
  const carte = document.createElement('section');
  carte.className = 'jeu panneau';
  carte.hidden = true;
  carte.innerHTML = `
    <div class="jeu-tete">
      <span class="jeu-manche"></span>
      <span class="jeu-chrono" role="timer">${ICONES.chrono}<span></span></span>
      <span class="jeu-score"></span>
      <button type="button" class="jeu-quitter">${ICONES.fermer}</button>
    </div>
    <h2 class="jeu-titre"></h2>
    <div class="jeu-cadre">
      <button type="button" class="jeu-image"><img class="jeu-fond" alt=""><img class="jeu-photo" alt=""></button>
      <span class="jeu-temps"><span></span></span>
      <small class="jeu-credit" hidden></small>
    </div>
    <p class="jeu-texte"></p>
    <p class="jeu-indice-texte" hidden></p>
    <button type="button" class="btn-secondaire jeu-indice">${ICONES.indice}<span></span></button>
    <div class="jeu-resultat">
      <b class="jeu-nom"></b>
      <small class="jeu-infos"></small>
      <p class="jeu-distance"></p>
    </div>
    <div class="jeu-records" hidden></div>
    <button type="button" class="btn-secondaire jeu-partager">${ICONES.partager}<span></span></button>
    <button type="button" class="btn-lancer jeu-action"></button>`;
  document.body.append(carte);
  const $ = (sel) => carte.querySelector(sel);
  const elPhoto = $('.jeu-photo');
  const elFond = $('.jeu-fond');
  const barre = $('.jeu-temps span');

  // L'épingle du joueur
  const elEpingle = document.createElement('div');
  elEpingle.className = 'jeu-epingle';
  elEpingle.innerHTML = ICONES.epingle;
  const epingle = new maplibregl.Marker({ element: elEpingle, anchor: 'bottom' });
  let epingleSuivie = false;

  $('.jeu-quitter').addEventListener('click', () => arreter());
  $('.jeu-action').addEventListener('click', () => agir());
  $('.jeu-indice').addEventListener('click', () => indice());
  $('.jeu-partager').addEventListener('click', () => partager());
  $('.jeu-image').addEventListener('click', () => carte.classList.toggle('image-grande'));
  elPhoto.addEventListener('load', () => ajusterPhoto());
  map.on('click', (e) => {
    if (etat?.phase !== 'devine') return;
    poser(e.lngLat);
  });
  document.addEventListener('keydown', (e) => {
    if (!etat) return;
    if (e.key === 'Escape') arreter();
    else if (e.key === 'Enter' && !$('.jeu-action').disabled && document.activeElement?.tagName !== 'BUTTON') agir();
    else return;
    e.preventDefault();
    e.stopImmediatePropagation();
  }, true);

  // ---- La partie
  async function lancer() {
    arreter(false);
    avant();
    const credits = await photosLibres;
    const liste = choisirLieux(credits);
    etat = { liste, credits, i: -1, phase: 'accueil', choix: null, points: [], images: liste.map(() => null), montres: new Set(), indices: 0 };
    preparerImage(0);
    if (liste.length) prefecture(liste[0]).catch(() => {}); // les contours des préfectures, pour les indices
    document.body.classList.add('en-jeu');
    // les lieux disparaissent de la carte : sinon il suffirait de toucher leur épingle
    for (const l of lieux()) reperes.montrer(l.epingle, false);
    modeles3d.filtrer((l) => etat?.montres.has(l));
    carte.hidden = false;
    afficher();
    allerAuJapon();
  }

  /** La photo d'un lieu : { src, credit } (credit = null pour une photo du tableau), ou null s'il n'en a pas. */
  function imageDe(l, credits) {
    if (photo(l)) return { src: photo(l), credit: null };
    const c = credits[video(l)];
    return c ? { src: `photos/jeu/${video(l)}.jpg`, credit: c } : null;
  }

  /** Cinq lieux au hasard, bien éloignés les uns des autres, qui ont une photo. */
  function choisirLieux(credits) {
    const melange = lieux().filter((l) => imageDe(l, credits)).sort(() => Math.random() - 0.5);
    const choix = [];
    for (const l of melange) {
      if (choix.every((c) => km(c, l) >= ECART_MIN_KM)) choix.push(l);
      if (choix.length === MANCHES) break;
    }
    for (const l of melange) if (choix.length < MANCHES && !choix.includes(l)) choix.push(l);
    return choix;
  }

  function agir() {
    if (!etat) return;
    if (etat.phase === 'accueil') manche(0);
    else if (etat.phase === 'devine' && etat.choix) reveler();
    else if (etat.phase === 'revele') { if (etat.i + 1 < etat.liste.length) manche(etat.i + 1); else finir(); }
    else if (etat.phase === 'fin') lancer();
  }

  function manche(i) {
    arreterChrono();
    Object.assign(etat, { i, phase: 'devine', choix: null, indices: 0, prefecture: null, chercheIndice: false, finChrono: 0, credit: null });
    oublierEpingle();
    effacerTrait();
    effacerZone();
    cacherMontres(); // le lieu révélé à la manche d'avant disparaît à nouveau
    carte.classList.remove('image-grande');
    montrerImage(null);
    // le chrono part quand la photo est là (au plus tard après ATTENTE_IMAGE)
    preparerImage(i)
      .then((im) => { if (etat?.i === i) montrerImage(im); })
      .then(() => lancerChrono(i));
    setTimeout(() => lancerChrono(i), ATTENTE_IMAGE);
    preparerImage(i + 1);
    afficher();
    allerAuJapon();
  }

  function poser(lngLat) {
    etat.choix = lngLat;
    epingle.setLngLat(lngLat);
    if (!epingleSuivie) {
      reperes.suivre(epingle, { placer: (el) => el.parentNode.append(el) }); // devant tout le reste
      epingleSuivie = true;
    } else reperes.verifier(epingle);
    afficher();
  }

  /** Révèle le vrai lieu : après « Valider », ou à la fin du chrono (avec l'épingle posée, ou sans : 0 point). */
  function reveler() {
    if (etat?.phase !== 'devine') return;
    arreterChrono();
    const l = etat.liste[etat.i];
    const { choix } = etat;
    const d = choix ? km(l, { lng: choix.lng, lat: choix.lat }) : null;
    const pts = choix ? Math.round(POINTS_MAX * Math.exp(-d / ECHELLE_KM) * PART_INDICES[etat.indices]) : 0;
    etat.points.push(pts);
    etat.phase = 'revele';
    etat.dernier = { d, pts };
    // le vrai lieu réapparaît (son épingle et son modèle 3D), relié à l'épingle du joueur
    etat.montres.add(l);
    l.el.classList.add('actif'); // son nom s'affiche, avec l'anneau rouge d'un lieu choisi
    reperes.montrer(l.epingle, true);
    map.triggerRepaint();
    afficher();
    const vol = { pitch: 40, bearing: map.getBearing(), padding: marge(70), duration: calme ? 0 : 2000, essential: true };
    if (choix) {
      tracerTrait(choix, [l.lng, l.lat]);
      map.fitBounds(new maplibregl.LngLatBounds([l.lng, l.lat], [l.lng, l.lat]).extend(choix), { ...vol, maxZoom: 10.5 });
    } else map.flyTo({ ...vol, center: [l.lng, l.lat], zoom: 8.5 }); // sans épingle (temps écoulé) : le lieu seul
  }

  function finir() {
    etat.phase = 'fin';
    etat.resultat = noterPartie(etat.points.reduce((a, b) => a + b, 0));
    cacherMontres();
    oublierEpingle();
    effacerTrait();
    effacerZone();
    afficher();
    allerAuJapon();
  }

  function cacherMontres() {
    for (const l of etat.montres) { l.el.classList.remove('actif'); reperes.montrer(l.epingle, false); }
    etat.montres.clear();
    map.triggerRepaint();
  }

  function arreter(rendre = true) {
    if (!etat) return;
    arreterChrono();
    for (const l of etat.montres) l.el.classList.remove('actif');
    etat = null;
    oublierEpingle();
    effacerTrait();
    effacerZone();
    carte.hidden = true;
    carte.classList.remove('image-grande', 'presse', 'urgent');
    document.body.classList.remove('en-jeu');
    for (const l of lieux()) reperes.montrer(l.epingle, l.cat.visible);
    modeles3d.filtrer(null);
    if (rendre) {
      map.easeTo({ padding: SANS_MARGE, duration: calme ? 0 : 700, essential: true });
      apres();
    }
  }

  // ---- Le chrono (30 s par manche)
  function lancerChrono(i) {
    if (etat?.i !== i || etat.phase !== 'devine' || etat.finChrono) return;
    etat.finChrono = performance.now() + DUREE_MANCHE * 1000;
    etat.minuterie = setInterval(tic, 200);
    tic();
  }

  function arreterChrono() {
    if (etat?.minuterie) clearInterval(etat.minuterie);
    if (etat) etat.minuterie = null;
  }

  /** À chaque tic du chrono : l'affichage, et à zéro, le lieu révélé. */
  function tic() {
    if (etat?.phase !== 'devine') return;
    const reste = majChrono();
    if (etat.finChrono && reste <= 0) reveler();
  }

  /** Le nombre de secondes et la barre sur la photo (rouges dans les 10 dernières secondes) ; renvoie le reste. */
  function majChrono() {
    const reste = etat.finChrono ? Math.max(0, etat.finChrono - performance.now()) / 1000 : DUREE_MANCHE;
    const s = Math.ceil(reste);
    const nombre = $('.jeu-chrono span');
    if (nombre.dataset.s !== String(s)) {
      nombre.dataset.s = s;
      nombre.textContent = t('jeuSecondes', s);
      carte.classList.toggle('presse', s <= 10);
      carte.classList.toggle('urgent', s <= 5);
    }
    barre.style.transform = `scaleX(${reste / DUREE_MANCHE})`;
    return reste;
  }

  // ---- Les indices : la région, puis la préfecture (colorées sur la carte)
  async function indice() {
    if (etat?.phase !== 'devine' || etat.chercheIndice || etat.indices >= indicesMax()) return;
    const { i } = etat;
    const l = etat.liste[i];
    etat.chercheIndice = true;
    afficher();
    try {
      const [code, morceaux] = await Promise.all([prefecture(l), chargerContours()]);
      if (etat?.i !== i || etat.phase !== 'devine' || !code) return;
      etat.prefecture = code;
      etat.indices++;
      const codes = etat.indices === 1 ? regionDe(code).prefectures : [code];
      montrerZone(codes);
      // on cadre les grands morceaux de la zone et celui du lieu (pas les petites îles lointaines)
      const zone = codes.flatMap((c) => morceaux[c] || []);
      const grand = Math.max(...zone.map((m) => m.aire));
      const garde = zone.filter((m) => m.aire >= grand * 0.1 || dansBoite(l, m.boite));
      if (!garde.some((m) => dansBoite(l, m.boite))) garde.push(zone.reduce((a, m) => (distBoite(l, m.boite) < distBoite(l, a.boite) ? m : a)));
      const b = garde.reduce((a, m) => [Math.min(a[0], m.boite[0]), Math.min(a[1], m.boite[1]), Math.max(a[2], m.boite[2]), Math.max(a[3], m.boite[3])],
        [Infinity, Infinity, -Infinity, -Infinity]);
      cadrer([[b[0], b[1]], [b[2], b[3]]], marge(30), { maxZoom: 9, duree: 1200 });
    } catch (e) {
      console.warn('Indice indisponible', e);
    } finally {
      if (etat) etat.chercheIndice = false;
      afficher();
    }
  }

  /** Hokkaidō est à la fois une région et une préfecture : un seul indice. */
  function indicesMax() {
    const r = etat.prefecture && regionDe(etat.prefecture);
    return r && r.prefectures.length === 1 ? 1 : PART_INDICES.length - 1;
  }

  /** Les morceaux (îles) de chaque préfecture, avec leur boîte et leur aire. */
  function chargerContours() {
    contours ??= fetch('data/prefectures.geojson').then((r) => r.json()).then((geo) => {
      const parCode = {};
      for (const f of geo.features) {
        for (const poly of f.geometry.coordinates) {
          const anneau = poly[0];
          const boite = [Infinity, Infinity, -Infinity, -Infinity];
          let aire = 0;
          for (let k = 0; k < anneau.length; k++) {
            const [x, y] = anneau[k], [x2, y2] = anneau[(k + 1) % anneau.length];
            boite[0] = Math.min(boite[0], x); boite[1] = Math.min(boite[1], y);
            boite[2] = Math.max(boite[2], x); boite[3] = Math.max(boite[3], y);
            aire += x * y2 - x2 * y;
          }
          (parCode[f.properties.code] ||= []).push({ boite, aire: Math.abs(aire) / 2 });
        }
      }
      return parCode;
    });
    contours.catch(() => { contours = null; });
    return contours;
  }

  function montrerZone(codes) {
    const filtre = ['in', ['get', 'code'], ['literal', codes]];
    if (map.getSource('jeu-zone')) {
      map.setFilter('jeu-zone', filtre);
      map.setFilter('jeu-zone-bord', filtre);
      return;
    }
    // sous l'épingle, le trait et les modèles 3D ; au-dessus du relief
    const dessous = ['jeu-trait', 'modeles-3d'].find((id) => map.getLayer(id));
    map.addSource('jeu-zone', { type: 'geojson', data: 'data/prefectures.geojson', maxzoom: 8 });
    map.addLayer({ id: 'jeu-zone', type: 'fill', source: 'jeu-zone', filter: filtre, paint: { 'fill-color': ROUGE, 'fill-opacity': 0.16 } }, dessous);
    map.addLayer({
      id: 'jeu-zone-bord', type: 'line', source: 'jeu-zone', filter: filtre,
      layout: { 'line-join': 'round' }, paint: { 'line-color': ROUGE, 'line-width': 2.2, 'line-opacity': 0.85 },
    }, dessous);
  }

  function effacerZone() {
    for (const id of ['jeu-zone-bord', 'jeu-zone']) if (map.getLayer(id)) map.removeLayer(id);
    if (map.getSource('jeu-zone')) map.removeSource('jeu-zone');
  }

  // ---- Les meilleurs scores (dans ce navigateur)
  function lireRecords() {
    try {
      const r = JSON.parse(localStorage.getItem(MEMO_RECORDS));
      if (r && Array.isArray(r.meilleurs)) return { parties: r.parties || r.meilleurs.length, meilleurs: r.meilleurs };
    } catch { /* rien de lisible : on repart de zéro */ }
    return { parties: 0, meilleurs: [] };
  }

  /** Range la partie parmi les meilleures ; rang = 0 pour le meilleur score, −1 hors des 10 meilleurs. */
  function noterPartie(score) {
    const records = lireRecords();
    const partie = { score, date: Date.now() };
    records.parties++;
    records.meilleurs.push(partie);
    records.meilleurs.sort((a, b) => b.score - a.score || a.date - b.date);
    records.meilleurs = records.meilleurs.slice(0, NB_RECORDS);
    try { localStorage.setItem(MEMO_RECORDS, JSON.stringify(records)); } catch { /* navigation privée : tant pis */ }
    return { partie, rang: records.meilleurs.indexOf(partie), records };
  }

  // ---- L'affichage de la carte du jeu, selon la phase
  function afficher() {
    if (!etat) return;
    const { phase } = etat;
    const total = etat.points.reduce((a, b) => a + b, 0);
    carte.dataset.phase = phase;
    if (phase !== 'devine') carte.classList.remove('presse', 'urgent');
    $('.jeu-manche').textContent = phase === 'accueil' || phase === 'fin' ? '' : t('jeuManche', etat.i + 1, etat.liste.length);
    $('.jeu-score').textContent = phase === 'accueil' ? '' : t('jeuPoints', nombre(total));
    $('.jeu-titre').textContent = phase === 'accueil' ? t('jeu') : phase === 'fin' ? t('jeuFin') : '';
    $('.jeu-quitter').title = t('jeuQuitter');
    $('.jeu-quitter').setAttribute('aria-label', t('jeuQuitter'));
    $('.jeu-image').setAttribute('aria-label', t('jeuAgrandir'));
    $('.jeu-chrono').setAttribute('aria-label', t('jeuChrono'));
    $('.jeu-partager span').textContent = t('jeuPartager');
    delete $('.jeu-chrono span').dataset.s; // réécrit dans la langue choisie
    if (phase === 'devine') majChrono();
    afficherCredit();
    afficherIndice();
    afficherRecords();
    const texte = $('.jeu-texte');
    const action = $('.jeu-action');
    action.disabled = false;
    if (phase === 'accueil') {
      texte.textContent = t('jeuRegles', MANCHES, DUREE_MANCHE);
      action.textContent = t('jeuJouer');
    } else if (phase === 'devine') {
      texte.textContent = t('jeuConsigne');
      action.textContent = t('jeuValider');
      action.disabled = !etat.choix;
    } else if (phase === 'revele') {
      const l = etat.liste[etat.i];
      const { d, pts } = etat.dernier;
      texte.textContent = d == null ? t('jeuTempsFini') : d < 10 ? t('jeuParfait') : d < 50 ? t('jeuPres') : d < 150 ? t('jeuPasMal') : t('jeuLoin');
      $('.jeu-nom').textContent = enLangue(l.nom);
      $('.jeu-infos').textContent = infos(l);
      $('.jeu-distance').textContent = (d == null ? t('jeuSansEpingle') : t('jeuDistance', nombre(Math.round(d)), pts))
        + (etat.indices ? ` · ${t('jeuAvecIndices', etat.indices)}` : '');
      action.textContent = etat.i + 1 < etat.liste.length ? t('jeuSuivant') : t('jeuVoirScore');
    } else {
      const max = POINTS_MAX * etat.liste.length;
      const part = total / max;
      const { rang, records } = etat.resultat;
      const badge = rang === 0 && records.parties > 1 ? `<span class="jeu-record">${echapper(t('jeuNouveauRecord'))}</span>`
        : rang > 0 ? `<span class="jeu-rang-texte">${echapper(t('jeuRang', rang + 1))}</span>` : '';
      texte.innerHTML = `<span class="jeu-total">${echapper(t('jeuTotal', nombre(total), nombre(max)))}</span>${badge}${echapper(
        part >= 0.9 ? t('jeuExpert') : part >= 0.7 ? t('jeuVoyageur') : part >= 0.4 ? t('jeuExplorateur') : t('jeuTouriste'))}`;
      action.textContent = t('jeuRejouer');
    }
  }

  /** Sous une photo de Wikimedia Commons : sa licence ; l'auteur et le lien une fois le lieu révélé
   *  (le nom de l'auteur ou de la page dit parfois où c'est). */
  function afficherCredit() {
    const el = $('.jeu-credit');
    const c = etat.credit;
    el.hidden = !c || (etat.phase !== 'devine' && etat.phase !== 'revele');
    if (el.hidden) return;
    if (etat.phase === 'revele') {
      el.innerHTML = `<a href="${echapper(c.lien)}" target="_blank" rel="noopener">${echapper(t('jeuPhoto', c.auteur, c.licence))}</a>`;
    } else el.textContent = t('jeuPhotoLibre', c.licence);
  }

  function afficherIndice() {
    const { phase } = etat;
    const bouton = $('.jeu-indice');
    bouton.hidden = phase !== 'devine' || etat.indices >= indicesMax();
    bouton.disabled = !!etat.chercheIndice;
    const perte = Math.round((1 - PART_INDICES[Math.min(etat.indices + 1, PART_INDICES.length - 1)]) * 100);
    $('.jeu-indice span').textContent = t(etat.indices ? 'jeuIndice2' : 'jeuIndice', perte);
    const code = etat.prefecture;
    const lignes = [];
    if (code && etat.indices >= 1) lignes.push(t('jeuIndiceRegion', enLangue(regionDe(code).nom)));
    if (code && etat.indices >= 2) lignes.push(t('jeuIndicePrefecture', enLangue(PREFECTURES[code])));
    const ligne = $('.jeu-indice-texte');
    ligne.hidden = !lignes.length || (phase !== 'devine' && phase !== 'revele');
    ligne.textContent = lignes.join(' · ');
  }

  function afficherRecords() {
    const bloc = $('.jeu-records');
    const records = etat.resultat?.records || lireRecords();
    bloc.hidden = !(etat.phase === 'accueil' || etat.phase === 'fin') || !records.meilleurs.length;
    if (bloc.hidden) return;
    const actuelle = etat.phase === 'fin' ? etat.resultat.partie : null;
    const date = new Intl.DateTimeFormat(langue(), { day: 'numeric', month: 'short', year: 'numeric' });
    bloc.innerHTML = `<h3>${echapper(t('jeuRecords'))}</h3><ol>${records.meilleurs.slice(0, RECORDS_MONTRES).map((p, k) => `
      <li${p === actuelle ? ' class="actuelle"' : ''}><span class="jeu-rang">${k + 1}</span>
        <b>${echapper(t('jeuPoints', nombre(p.score)))}</b><time datetime="${new Date(p.date).toISOString()}">${echapper(date.format(p.date))}</time></li>`).join('')}
      </ol><small>${echapper(t('jeuParties', records.parties))}</small>`;
  }

  const nombre = (n) => new Intl.NumberFormat(langue()).format(n);

  // ---- Les images
  function preparerImage(i) {
    if (!etat || i >= etat.liste.length) return Promise.resolve(null);
    const im = imageDe(etat.liste[i], etat.credits);
    // téléchargée et décodée d'avance : elle s'affiche d'un coup quand la manche commence
    etat.images[i] ||= new Promise((ok) => {
      const pre = new Image();
      pre.src = im.src;
      pre.decode().then(() => ok(im), () => ok(im));
    });
    return etat.images[i];
  }

  function montrerImage(im) {
    for (const el of [elPhoto, elFond]) {
      if (im) el.src = im.src;
      else el.removeAttribute('src');
    }
    carte.classList.remove('photo-pleine'); // ajusterPhoto, au chargement
    etat.credit = im?.credit || null;
    afficherCredit();
  }

  /** Une photo presque de la forme du cadre le remplit (un peu rognée) ; sinon elle est entière, sur son fond flouté. */
  function ajusterPhoto() {
    const r = $('.jeu-image').getBoundingClientRect();
    const rp = elPhoto.naturalWidth / elPhoto.naturalHeight, rc = r.width / r.height;
    carte.classList.toggle('photo-pleine', rp > 0 && rc > 0 && Math.min(rp, rc) / Math.max(rp, rc) >= 0.78);
  }

  // ---- La caméra
  /** Tous les lieux de la carte (le terrain de jeu), dans la place que laisse la carte du jeu. */
  function allerAuJapon() {
    const tous = lieux();
    const bornes = [[Math.min(...tous.map((l) => l.lng)), Math.min(...tous.map((l) => l.lat))],
      [Math.max(...tous.map((l) => l.lng)), Math.max(...tous.map((l) => l.lat))]];
    cadrer(bornes, marge(30), { bearing: vueDepart().bearing });
  }

  /**
   * Cadre des bornes dans la place m (marges en px) et ramène la marge de la carte à zéro.
   * La carte garde la marge du dernier fitBounds : cameraForBounds en tient compte, on lui donne donc la
   * différence (comme visite.js).
   */
  function cadrer(bornes, m, { bearing = map.getBearing(), maxZoom = map.getMaxZoom(), duree = 1800 } = {}) {
    const p = map.getPadding();
    const h = (p.left + p.right) / 2, v = (p.top + p.bottom) / 2;
    const vue = map.cameraForBounds(bornes, {
      padding: { top: m.top - v, bottom: m.bottom - v, left: m.left - h, right: m.right - h }, bearing, maxZoom,
    });
    map.flyTo({ ...(vue || vueDepart()), pitch: 20, padding: SANS_MARGE, duration: calme ? 0 : duree, essential: true });
  }

  /** La carte du jeu cache le haut de l'écran (téléphone) ou la gauche (ordinateur) : on décale la vue d'autant. */
  function marge(m) {
    const r = carte.getBoundingClientRect();
    const bouton = $('.jeu-action').getBoundingClientRect();
    if (estTelephone()) return { top: Math.round(r.bottom + m), bottom: Math.round(innerHeight - bouton.top + m), left: m, right: m };
    return { top: m, bottom: m, left: Math.round(r.right + m), right: m };
  }

  // ---- L'épingle du joueur et le trait jusqu'au vrai lieu
  function oublierEpingle() {
    if (!epingleSuivie) return;
    reperes.oublier(epingle);
    epingleSuivie = false;
  }

  function tracerTrait(a, b) {
    const donnees = { type: 'Feature', geometry: { type: 'LineString', coordinates: [[a.lng, a.lat], b] } };
    const source = map.getSource('jeu-trait');
    if (source) source.setData(donnees);
    else {
      map.addSource('jeu-trait', { type: 'geojson', data: donnees });
      map.addLayer({
        id: 'jeu-trait', type: 'line', source: 'jeu-trait',
        layout: { 'line-cap': 'round' },
        paint: { 'line-color': ROUGE, 'line-width': 3, 'line-dasharray': [1.5, 1.6] },
      }, map.getLayer('modeles-3d') ? 'modeles-3d' : undefined);
    }
  }

  function effacerTrait() {
    if (map.getLayer('jeu-trait')) map.removeLayer('jeu-trait');
    if (map.getSource('jeu-trait')) map.removeSource('jeu-trait');
  }

  // ---- Partager son score
  async function partager() {
    if (!etat) return;
    const total = etat.points.reduce((a, b) => a + b, 0);
    const texte = t('jeuPartageMessage', total, POINTS_MAX * etat.liste.length, `https://${adresse}/?jeu`);
    if (matchMedia('(pointer: coarse)').matches && navigator.share) {
      navigator.share({ text: texte }).catch(() => {});
      return;
    }
    try {
      await navigator.clipboard.writeText(texte);
      afficherMessage(t('jeuCopie'));
    } catch { afficherMessage(texte); }
  }

  return { lancer, arreter, enCours: () => !!etat, majLangue: afficher };
}

/** Distance en km entre deux points { lng, lat } (à vol d'oiseau). */
function km(a, b) {
  const r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(s));
}

const dansBoite = (l, b) => l.lng >= b[0] && l.lng <= b[2] && l.lat >= b[1] && l.lat <= b[3];
const distBoite = (l, b) => Math.hypot(l.lng - (b[0] + b[2]) / 2, l.lat - (b[1] + b[3]) / 2);

const echapper = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
