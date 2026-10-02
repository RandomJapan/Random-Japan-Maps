// ================================================================
//  Jeu « Devine le lieu » (pas encore public : le bouton n'apparaît qu'avec
//  ?jeu dans l'adresse de la carte, voir app.js).
//  Une partie = 5 manches. À chaque manche, la photo d'un lieu de la carte ;
//  le joueur pose son épingle sur la carte 3D, puis on révèle le vrai lieu,
//  la distance et les points (1000 au plus par manche).
//  Pendant la partie, les épingles et les modèles 3D des lieux sont cachés.
// ================================================================

const MANCHES = 5;
const POINTS_MAX = 1000;
const ECHELLE_KM = 250; // points = 1000 × e^(−km/250) : 1000 à 0 km, 670 à 100 km, 368 à 250 km, 135 à 500 km
const ECART_MIN_KM = 80; // les lieux d'une même partie sont éloignés les uns des autres

const ICONES = {
  fermer: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M6 6l12 12M18 6 6 18"/></svg>',
  epingle: '<svg viewBox="0 0 32 44" aria-hidden="true"><path d="M16 1.5C8.3 1.5 2.5 7.4 2.5 15c0 9.6 13.5 27 13.5 27s13.5-17.4 13.5-27c0-7.6-5.8-13.5-13.5-13.5Z" fill="#a8321f" stroke="#f6eedb" stroke-width="2.2"/><circle cx="16" cy="15" r="5.2" fill="#f6eedb"/></svg>',
  partager: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6"/></svg>',
};

/**
 * outils : { t, enLangue, infos(lieu), lieux() → tous les lieux, reperes (reperes.js), modeles3d (couche3d.js),
 *            photo(lieu) → adresse d'une photo sans texte ou '', couverture(lieu) → adresse de la couverture TikTok locale,
 *            vueDepart(), estTelephone(), afficherMessage(texte), adresse, avant(), apres() }
 */
export function brancherJeu(map, maplibregl, outils) {
  const { t, enLangue, infos, lieux, reperes, modeles3d, photo, couverture, vueDepart, estTelephone, afficherMessage, adresse, avant, apres } = outils;
  const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // etat : { liste (les 5 lieux), i, phase ('accueil' | 'devine' | 'revele' | 'fin'), choix (LngLat posé), points [],
  //          images [Promise d'adresse], montres (lieux révélés, dont on voit l'épingle et le modèle) }
  let etat = null;

  // ---- La carte du jeu (en haut sur téléphone, à gauche sur ordinateur)
  const carte = document.createElement('section');
  carte.className = 'jeu panneau';
  carte.hidden = true;
  carte.innerHTML = `
    <div class="jeu-tete">
      <span class="jeu-manche"></span>
      <span class="jeu-score"></span>
      <button type="button" class="jeu-quitter">${ICONES.fermer}</button>
    </div>
    <h2 class="jeu-titre"></h2>
    <button type="button" class="jeu-image"><img alt=""></button>
    <p class="jeu-texte"></p>
    <div class="jeu-resultat">
      <b class="jeu-nom"></b>
      <small class="jeu-infos"></small>
      <p class="jeu-distance"></p>
    </div>
    <button type="button" class="btn-secondaire jeu-partager">${ICONES.partager}<span></span></button>
    <button type="button" class="btn-lancer jeu-action"></button>`;
  document.body.append(carte);
  const $ = (sel) => carte.querySelector(sel);
  const image = $('.jeu-image img');

  // L'épingle du joueur
  const elEpingle = document.createElement('div');
  elEpingle.className = 'jeu-epingle';
  elEpingle.innerHTML = ICONES.epingle;
  const epingle = new maplibregl.Marker({ element: elEpingle, anchor: 'bottom' });
  let epingleSuivie = false;

  $('.jeu-quitter').addEventListener('click', () => arreter());
  $('.jeu-action').addEventListener('click', () => agir());
  $('.jeu-partager').addEventListener('click', () => partager());
  $('.jeu-image').addEventListener('click', () => carte.classList.toggle('image-grande'));
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
  function lancer() {
    arreter(false);
    avant();
    etat = { liste: choisirLieux(), i: -1, phase: 'accueil', choix: null, points: [], images: [], montres: new Set() };
    etat.images = etat.liste.map(() => null);
    preparerImage(0);
    document.body.classList.add('en-jeu');
    // les lieux disparaissent de la carte : sinon il suffirait de toucher leur épingle
    for (const l of lieux()) reperes.montrer(l.epingle, false);
    modeles3d.filtrer((l) => etat?.montres.has(l));
    carte.hidden = false;
    afficher();
    allerAuJapon();
  }

  /** Cinq lieux au hasard, bien éloignés les uns des autres, qui ont une image. */
  function choisirLieux() {
    const melange = lieux().filter((l) => photo(l) || couverture(l)).sort(() => Math.random() - 0.5);
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
    etat.i = i;
    etat.phase = 'devine';
    etat.choix = null;
    oublierEpingle();
    effacerTrait();
    // le lieu révélé à la manche d'avant disparaît à nouveau
    for (const l of etat.montres) { l.el.classList.remove('actif'); reperes.montrer(l.epingle, false); }
    etat.montres.clear();
    map.triggerRepaint();
    carte.classList.remove('image-grande');
    image.removeAttribute('src');
    preparerImage(i).then((url) => { if (etat?.i === i) image.src = url; });
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

  function reveler() {
    const l = etat.liste[etat.i];
    const d = km(l, { lng: etat.choix.lng, lat: etat.choix.lat });
    const pts = Math.round(POINTS_MAX * Math.exp(-d / ECHELLE_KM));
    etat.points.push(pts);
    etat.phase = 'revele';
    etat.dernier = { d, pts };
    // le vrai lieu réapparaît (son épingle et son modèle 3D), relié à l'épingle du joueur
    etat.montres.add(l);
    l.el.classList.add('actif'); // son nom s'affiche, avec l'anneau rouge d'un lieu choisi
    reperes.montrer(l.epingle, true);
    map.triggerRepaint();
    tracerTrait(etat.choix, [l.lng, l.lat]);
    afficher();
    const bornes = new maplibregl.LngLatBounds([l.lng, l.lat], [l.lng, l.lat]).extend(etat.choix);
    map.fitBounds(bornes, { padding: marge(70), maxZoom: 10.5, pitch: 40, bearing: map.getBearing(), duration: calme ? 0 : 2000, essential: true });
  }

  function finir() {
    etat.phase = 'fin';
    oublierEpingle();
    effacerTrait();
    afficher();
    allerAuJapon();
  }

  function arreter(rendre = true) {
    if (!etat) return;
    for (const l of etat.montres) l.el.classList.remove('actif');
    etat = null;
    oublierEpingle();
    effacerTrait();
    carte.hidden = true;
    carte.classList.remove('image-grande');
    document.body.classList.remove('en-jeu');
    for (const l of lieux()) reperes.montrer(l.epingle, l.cat.visible);
    modeles3d.filtrer(null);
    if (rendre) {
      map.easeTo({ padding: { top: 0, bottom: 0, left: 0, right: 0 }, duration: calme ? 0 : 700, essential: true });
      apres();
    }
  }

  // ---- L'affichage de la carte du jeu, selon la phase
  function afficher() {
    if (!etat) return;
    const { phase } = etat;
    const total = etat.points.reduce((a, b) => a + b, 0);
    carte.dataset.phase = phase;
    $('.jeu-manche').textContent = phase === 'accueil' || phase === 'fin' ? '' : t('jeuManche', etat.i + 1, etat.liste.length);
    $('.jeu-score').textContent = phase === 'accueil' ? '' : t('jeuPoints', total);
    $('.jeu-titre').textContent = phase === 'accueil' ? t('jeu') : phase === 'fin' ? t('jeuFin') : '';
    $('.jeu-quitter').title = t('jeuQuitter');
    $('.jeu-quitter').setAttribute('aria-label', t('jeuQuitter'));
    $('.jeu-image').setAttribute('aria-label', t('jeuAgrandir'));
    $('.jeu-partager span').textContent = t('jeuPartager');
    const texte = $('.jeu-texte');
    const action = $('.jeu-action');
    action.disabled = false;
    if (phase === 'accueil') {
      texte.textContent = t('jeuRegles', MANCHES);
      action.textContent = t('jeuJouer');
    } else if (phase === 'devine') {
      texte.textContent = t('jeuConsigne');
      action.textContent = t('jeuValider');
      action.disabled = !etat.choix;
    } else if (phase === 'revele') {
      const l = etat.liste[etat.i];
      const { d, pts } = etat.dernier;
      texte.textContent = d < 10 ? t('jeuParfait') : d < 50 ? t('jeuPres') : d < 150 ? t('jeuPasMal') : t('jeuLoin');
      $('.jeu-nom').textContent = enLangue(l.nom);
      $('.jeu-infos').textContent = infos(l);
      $('.jeu-distance').textContent = t('jeuDistance', Math.round(d), pts);
      action.textContent = etat.i + 1 < etat.liste.length ? t('jeuSuivant') : t('jeuVoirScore');
    } else {
      const max = POINTS_MAX * etat.liste.length;
      const part = total / max;
      texte.innerHTML = `<span class="jeu-total">${t('jeuTotal', total, max)}</span>${echapper(
        part >= 0.9 ? t('jeuExpert') : part >= 0.7 ? t('jeuVoyageur') : part >= 0.4 ? t('jeuExplorateur') : t('jeuTouriste'))}`;
      action.textContent = t('jeuRejouer');
    }
  }

  // ---- La caméra
  /** Tous les lieux de la carte (le terrain de jeu), dans la place que laisse la carte du jeu. */
  function allerAuJapon() {
    const tous = lieux();
    const bornes = [[Math.min(...tous.map((l) => l.lng)), Math.min(...tous.map((l) => l.lat))],
      [Math.max(...tous.map((l) => l.lng)), Math.max(...tous.map((l) => l.lat))]];
    // la carte garde la marge de la manche d'avant (fitBounds) : cameraForBounds en tient compte, on lui donne
    // donc la différence (comme visite.js), et le vol ramène la marge à zéro
    const m = marge(30), p = map.getPadding();
    const h = (p.left + p.right) / 2, v = (p.top + p.bottom) / 2;
    const vue = map.cameraForBounds(bornes, {
      padding: { top: m.top - v, bottom: m.bottom - v, left: m.left - h, right: m.right - h }, bearing: vueDepart().bearing,
    });
    map.flyTo({ ...(vue || vueDepart()), pitch: 20, padding: { top: 0, bottom: 0, left: 0, right: 0 }, duration: calme ? 0 : 1800, essential: true });
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
        paint: { 'line-color': '#a8321f', 'line-width': 3, 'line-dasharray': [1.5, 1.6] },
      }, map.getLayer('modeles-3d') ? 'modeles-3d' : undefined);
    }
  }

  function effacerTrait() {
    if (map.getLayer('jeu-trait')) map.removeLayer('jeu-trait');
    if (map.getSource('jeu-trait')) map.removeSource('jeu-trait');
  }

  // ---- Les images : la photo du lieu (sans texte), sinon sa couverture TikTok, bande du nom floutée
  function preparerImage(i) {
    if (!etat || i >= etat.liste.length) return Promise.resolve('');
    const l = etat.liste[i];
    etat.images[i] ||= (photo(l) ? Promise.resolve(photo(l)) : flouterNom(couverture(l))).catch(() => '');
    return etat.images[i];
  }

  /**
   * Les couvertures écrivent le nom du lieu (anglais et japonais) vers le milieu de l'image : cette bande
   * est floutée (réduite puis agrandie, ce qui marche dans tous les navigateurs).
   */
  async function flouterNom(src) {
    const im = new Image();
    im.src = src;
    await im.decode();
    const c = document.createElement('canvas');
    c.width = im.naturalWidth;
    c.height = im.naturalHeight;
    const g = c.getContext('2d');
    g.drawImage(im, 0, 0);
    const y = Math.round(c.height * 0.3), h = Math.round(c.height * 0.52);
    const petit = document.createElement('canvas');
    petit.width = Math.max(1, Math.round(c.width / 22));
    petit.height = Math.max(1, Math.round(h / 22));
    petit.getContext('2d').drawImage(c, 0, y, c.width, h, 0, 0, petit.width, petit.height);
    g.imageSmoothingQuality = 'high';
    g.drawImage(petit, 0, 0, petit.width, petit.height, 0, y, c.width, h);
    return new Promise((ok, ko) => c.toBlob((b) => (b ? ok(URL.createObjectURL(b)) : ko(new Error('toBlob'))), 'image/jpeg', 0.85));
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

const echapper = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
