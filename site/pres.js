// ================================================================
//  Près de moi (choix du propriétaire, 2026-10-13 : le bouton rond près de
//  la boussole, des cercles de distance, la route sur la carte avant Google Maps).
//  Le bouton (app.js) localise le visiteur (le navigateur demande d'abord sa permission).
//  - Au Japon : le point rouge 現在地 « Tu es ici », comme sur les plans des
//    parcs et des gares ; des cercles de distance en pointillés, comme
//    l'échelle d'une vieille carte ; la distance sous les lieux les plus
//    proches ; une pastille « 3 lieux à moins de 5 km ». La fiche d'un lieu
//    propose alors « Y aller » : la route depuis le visiteur (à pied, à vélo
//    ou en voiture, par le même serveur que l'itinéraire des favoris), puis
//    un bouton pour l'ouvrir dans Google Maps.
//  - Ailleurs : sa distance au Japon, un trait vers chez lui, et le lieu de la
//    carte le plus proche de lui.
//  La position reste dans le navigateur : seule la route « Y aller » l'envoie
//  au serveur d'itinéraires.
// ================================================================
import { brancherItineraire, MODES } from './itineraire.js';
import { echapper, kmEntre } from './commun.js';

// Les cercles de distance (km) : le plus petit jeu dont le grand cercle entoure les 3 lieux les plus proches
const ANNEAUX = [[0.5, 1, 2], [1, 2, 5], [2, 5, 10], [5, 10, 20], [10, 25, 50], [25, 50, 100], [50, 100, 200], [100, 200, 400]];
const LIEUX_ENTOURES = 3;
const AU_JAPON = 25; // km des contours du Japon : au-delà, le visiteur n'y est pas (Busan est à 50 km de Tsushima)
const DISTANCES_MAX = 12; // la distance s'écrit sous les lieux les plus proches, pas sous tous
const A_PIED = 3; // km : plus près, « Y aller » propose d'abord la marche ; plus loin, la voiture
const GOOGLE = { foot: 'walking', bike: 'bicycling', car: 'driving' };
const ENCRE = '#5b432d', ROUGE = '#a8321f', PAPIER = '#f6eedb';
const SANS_MARGE = { top: 0, bottom: 0, left: 0, right: 0 };

/**
 * outils : { t, enLangue, langue(), lieux(), reperes, afficherMessage, estTelephone, vueDepart, SVG (icônes car, bike,
 *   foot, route, croix), texteDuree(s), prefectures() → Promise de trouver (regions.js), nomPrefecture(code),
 *   avant() (la rotation s'arrête, les panneaux se ferment), avantTrajet() (la fiche se ferme, l'itinéraire des
 *   favoris s'efface), allerAuLieu(lieu), ouvrirSaisons(), quandChange() (la fiche ouverte refait ses boutons) }
 */
export function brancherPres(map, maplibregl, outils) {
  const { t, enLangue, langue, lieux, reperes, afficherMessage, estTelephone, vueDepart, SVG, texteDuree } = outils;
  const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const bouton = document.getElementById('btn-pres');
  const route = brancherItineraire(map, maplibregl, {
    reperes, id: 'trajet',
    texteTrajet: (tr, mode) => (tr.sansRoute ? echapper(t('sansRouteCourt')) : `${SVG[mode]}${texteDuree(tr.duree)}`),
  });
  let pos = null; // { lng, lat } du visiteur, quand il est au Japon
  let anneaux = null; // le jeu de cercles montré (km)
  let ici = null; // le repère 現在地
  let distances = []; // repères : la distance sous les lieux proches, et sous chaque cercle
  let loin = null; // hors du Japon : { lieu (le plus proche), distance (km), p (le visiteur), marqueur }
  let trajet = null; // « Y aller » : { lieu, mode, it, erreur }
  let jeton = null; // la localisation en cours (une nouvelle fait oublier l'ancienne)

  // ---- La pastille dans la rangée des boutons : « 3 lieux à moins de 5 km » (un appui recadre), et ×
  const pastille = document.createElement('div');
  pastille.className = 'resume-itineraire resume-pres panneau';
  pastille.hidden = true;
  pastille.innerHTML = `<button type="button" class="resume-details"></button>
    <button type="button" class="resume-effacer">${SVG.croix}</button>`;
  document.getElementById('resume-saison').after(pastille);
  pastille.querySelector('.resume-details').addEventListener('click', (e) => { e.stopPropagation(); cadrerAnneaux(); });
  pastille.querySelector('.resume-effacer').addEventListener('click', (e) => { e.stopPropagation(); effacer(); });

  // ---- La carte du trajet (en bas) et celle du visiteur loin du Japon
  const carteTrajet = document.createElement('section');
  carteTrajet.className = 'pres-trajet panneau';
  carteTrajet.hidden = true;
  const carteLoin = document.createElement('section');
  carteLoin.className = 'pres-loin panneau';
  carteLoin.hidden = true;
  document.body.append(carteTrajet, carteLoin);
  for (const el of [carteTrajet, carteLoin]) el.addEventListener('click', (e) => e.stopPropagation());
  carteTrajet.addEventListener('click', (e) => {
    const mode = e.target.closest('[data-mode]')?.dataset.mode;
    if (mode && trajet && mode !== trajet.mode) allerVers(trajet.lieu, mode);
    else if (e.target.closest('[data-fermer]')) effacerTrajet();
  });
  carteLoin.addEventListener('click', (e) => {
    if (e.target.closest('[data-voir]') && loin) { const l = loin.lieu; effacer(); outils.allerAuLieu(l); }
    else if (e.target.closest('[data-preparer]')) { effacer(); outils.ouvrirSaisons(); }
    else if (e.target.closest('[data-fermer]')) effacer();
  });

  // ---- Localiser
  /** position : la promesse de navigator.geolocation, demandée par app.js au moment de l'appui sur le bouton. */
  function localiser(position) {
    outils.avant();
    const moi = (jeton = {});
    bouton.classList.add('cherche');
    afficherMessage(t('presCherche'));
    position.then(
      (p) => { if (jeton === moi) arrivee({ lng: p.coords.longitude, lat: p.coords.latitude }); },
      (err) => {
        if (jeton !== moi) return;
        bouton.classList.remove('cherche');
        afficherMessage(t(err?.code === 1 ? 'presRefus' : 'presIntrouvable')); // 1 : refusé par le visiteur
      },
    );
  }

  async function arrivee(p) {
    const trouver = await outils.prefectures().catch(() => null);
    bouton.classList.remove('cherche');
    oublierTout();
    const ecart = trouver ? trouver.ecart(p.lng, p.lat) : 0;
    const proches = visibles().map((l) => ({ l, d: kmEntre(p, l) })).sort((a, b) => a.d - b.d);
    if (!proches.length) return afficherMessage(t('presAucun'));
    // (la distance montrée est celle du lieu le plus proche, sur le globe : ecart n'est juste que près du Japon)
    if (ecart > AU_JAPON) return montrerLoin(p, proches[0].d, proches[0].l);
    pos = p;
    bouton.classList.add('actif');
    // les cercles : le plus petit jeu qui entoure les lieux les plus proches
    const reference = proches[Math.min(LIEUX_ENTOURES, proches.length) - 1].d;
    anneaux = ANNEAUX.find((a) => a[2] >= reference) || ANNEAUX[ANNEAUX.length - 1];
    dessinerAnneaux();
    ici = new maplibregl.Marker({ element: elementIci(), anchor: 'center' }).setLngLat([p.lng, p.lat]);
    reperes.suivre(ici, { placer: (el) => el.parentNode.append(el) }); // devant tout le reste
    reperes.montrer(ici, true);
    for (const { l, d } of proches.slice(0, DISTANCES_MAX)) {
      if (d > anneaux[2] * 1.5) break;
      ajouterDistance(texteKm(d), [l.lng, l.lat], 'pres-distance');
    }
    majPastille(proches);
    cadrerAnneaux();
    outils.quandChange();
  }

  function elementIci() {
    const el = document.createElement('div');
    el.className = 'pres-ici';
    el.innerHTML = `<span class="pres-ici-halo"></span><span class="pres-ici-point"></span>
      <span class="pres-ici-plaque"><b lang="ja">現在地</b><span></span></span>`;
    el.querySelector('.pres-ici-plaque span').textContent = t('presIci');
    return el;
  }

  function ajouterDistance(texte, ou, classe) {
    const el = document.createElement('div');
    el.className = classe;
    el.innerHTML = `<span>${echapper(texte)}</span>`;
    const m = new maplibregl.Marker({ element: el, anchor: 'top', offset: [0, 3] }).setLngLat(ou);
    reperes.suivre(m);
    reperes.montrer(m, true);
    distances.push(m);
  }

  /** Les cercles en pointillés d'encre, et leur rayon écrit dessous. */
  function dessinerAnneaux() {
    const donnees = {
      type: 'FeatureCollection',
      features: anneaux.map((r) => ({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: cercle(pos, r) } })),
    };
    if (map.getSource('pres-anneaux')) map.getSource('pres-anneaux').setData(donnees);
    else {
      map.addSource('pres-anneaux', { type: 'geojson', data: donnees });
      map.addLayer({
        id: 'pres-anneaux', type: 'line', source: 'pres-anneaux',
        paint: { 'line-color': ENCRE, 'line-width': 1.4, 'line-opacity': 0.85, 'line-dasharray': [3, 3] },
      }, map.getLayer('modeles-3d') ? 'modeles-3d' : undefined);
    }
    for (const r of anneaux) ajouterDistance(texteKm(r), [pos.lng, pos.lat - r / 110.57], 'pres-rayon');
  }

  function majPastille(proches = visibles().map((l) => ({ l, d: kmEntre(pos, l) }))) {
    const n = proches.filter((x) => x.d <= anneaux[2]).length;
    const plusProche = Math.min(...proches.map((x) => x.d));
    const texte = n ? t('presResume', n, texteKm(anneaux[2])) : t('presLePlusProche', texteKm(plusProche));
    pastille.querySelector('.resume-details').innerHTML = `${SVG.route}<span>${echapper(texte)}</span>`;
    pastille.querySelector('.resume-effacer').title = t('presEffacer');
    pastille.querySelector('.resume-effacer').setAttribute('aria-label', t('presEffacer'));
    pastille.hidden = false;
  }

  /** Montre les cercles en entier, nord en haut, dans la place que laissent les boutons. */
  function cadrerAnneaux() {
    if (!pos) return;
    const r = anneaux[2];
    const k = 111.32 * Math.cos((pos.lat * Math.PI) / 180);
    const bornes = [[pos.lng - r / k, pos.lat - r / 110.57], [pos.lng + r / k, pos.lat + r / 110.57]];
    voler(bornes, estTelephone() ? { top: 150, bottom: 110, left: 16, right: 16 } : { top: 130, bottom: 90, left: 90, right: 90 }, 2200);
  }

  /** Vole vers ces bornes, nord en haut, dans la place m (px) que laissent les boutons et les cartes. */
  function voler(bornes, m, duree) {
    const p = map.getPadding(); // (la caméra en tient compte : on la retire, comme jeu.js)
    const h = (p.left + p.right) / 2, v = (p.top + p.bottom) / 2;
    const vue = map.cameraForBounds(bornes, {
      padding: { top: m.top - v, bottom: m.bottom - v, left: m.left - h, right: m.right - h }, bearing: 0, maxZoom: 15.5,
    });
    // (peu incliné : cameraForBounds cadre la carte à plat, et l'inclinaison ferait déborder le bas)
    if (vue) map.flyTo({ ...vue, pitch: 20, padding: SANS_MARGE, duration: calme ? 0 : duree, essential: true });
  }

  // ---- Loin du Japon : sa distance, un trait vers chez lui, le lieu le plus proche
  function montrerLoin(p, distance, lieu) {
    loin = { lieu, distance, p };
    remplirLoin();
    carteLoin.hidden = false;
    map.once('moveend', () => { if (loin?.p === p) tracerVersChezLui(); }); // (avant le vol : sans animation, il finit tout de suite)
    map.flyTo({ ...vueDepart(), padding: SANS_MARGE, duration: calme ? 0 : 1800, essential: true });
  }

  function remplirLoin() {
    const l = loin.lieu;
    const pref = l.prefecture ? ` (${echapper(outils.nomPrefecture(l.prefecture))})` : '';
    carteLoin.innerHTML = `<button type="button" class="pres-fermer" data-fermer title="${echapper(t('fermer'))}" aria-label="${echapper(t('fermer'))}">${SVG.croix}</button>
      <div class="pres-avion" aria-hidden="true">✈</div>
      <h3>${t('presLoinTitre', `<em>${echapper(texteKm(loin.distance))}</em>`)}</h3>
      <p>${echapper(t('presLoinTexte'))}<br>${echapper(t('presLoinLieu'))} <b>${echapper(enLangue(l.nom))}</b>${pref}</p>
      <button type="button" class="btn-lancer" data-voir>${echapper(t('presVoirLieu'))}</button>
      <button type="button" class="btn-secondaire" data-preparer>${echapper(t('presPreparer'))}</button>`;
  }

  /** Le grand cercle du globe, du lieu le plus proche vers le visiteur, tant qu'il reste à l'écran. */
  function tracerVersChezLui() {
    const a = loin.lieu, b = loin.p;
    const total = kmEntre(a, b);
    const { clientWidth: w, clientHeight: h } = map.getContainer();
    const points = [];
    for (let s = 0; s <= Math.min(total, 5000); s += 25) {
      const q = surLeGlobe(a, b, s / total);
      const e = map.project(q);
      if (e.x < 20 || e.x > w - 20 || e.y < 115 || e.y > h - 30) break;
      points.push(q);
    }
    if (points.length < 3) return;
    const donnees = { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: points } };
    if (map.getSource('pres-chez-toi')) map.getSource('pres-chez-toi').setData(donnees);
    else {
      map.addSource('pres-chez-toi', { type: 'geojson', data: donnees });
      const dessous = map.getLayer('modeles-3d') ? 'modeles-3d' : undefined;
      map.addLayer({ id: 'pres-chez-toi-fond', type: 'line', source: 'pres-chez-toi', layout: { 'line-cap': 'round' },
        paint: { 'line-color': PAPIER, 'line-width': 6, 'line-opacity': 0.8 } }, dessous);
      map.addLayer({ id: 'pres-chez-toi', type: 'line', source: 'pres-chez-toi', layout: { 'line-cap': 'round' },
        paint: { 'line-color': ROUGE, 'line-width': 2.6, 'line-dasharray': [2, 2] } }, dessous);
    }
    // l'étiquette à côté du milieu du trait, du côté où il part (le bout touche souvent les boutons du haut)
    const el = document.createElement('div');
    el.className = 'pres-chez-toi';
    el.innerHTML = `<span>✈ ${echapper(t('presChezToi'))}</span>`;
    const versLaGauche = map.project(points[points.length - 1]).x < map.project(points[0]).x;
    loin.marqueur = new maplibregl.Marker({ element: el, anchor: versLaGauche ? 'right' : 'left', offset: [versLaGauche ? -10 : 10, 0] })
      .setLngLat(points[Math.floor(points.length * 0.55)]);
    reperes.suivre(loin.marqueur);
    reperes.montrer(loin.marqueur, true);
  }

  // ---- « Y aller » : la route depuis le visiteur jusqu'au lieu
  async function allerVers(lieu, mode = kmEntre(pos, lieu) < A_PIED ? 'foot' : 'car') {
    if (!pos) return;
    outils.avantTrajet();
    const moi = (trajet = { lieu, mode, it: null, erreur: '' });
    remplirTrajet();
    try {
      const it = await route.calculer([pos, lieu], mode);
      if (trajet !== moi) return;
      moi.it = it;
      route.afficher(it);
      cadrerTrajet(it.bornes);
    } catch (e) {
      if (trajet !== moi) return;
      console.warn(e);
      moi.erreur = t('itineraireErreur');
    }
    remplirTrajet();
  }

  function remplirTrajet() {
    if (!trajet) { carteTrajet.hidden = true; return; }
    const { lieu, mode, it, erreur } = trajet;
    const modes = MODES.map((m) => `<button type="button" data-mode="${m}" aria-pressed="${m === mode}" title="${echapper(t(`mode_${m}`))}">${SVG[m]}<span>${echapper(t(`mode_${m}`))}</span></button>`).join('');
    const resume = erreur ? `<p class="plongeon-erreur">${echapper(erreur)}</p>`
      : it ? `<p class="pres-temps"><b>${echapper(texteDuree(it.duree))}</b> ${echapper(t(`total_${mode}`))} · ${echapper(texteKm(it.distance / 1000))}</p>`
        : `<p class="pres-temps">${echapper(t('calculItineraire'))}</p>`;
    const google = `https://www.google.com/maps/dir/?api=1&destination=${lieu.lat},${lieu.lng}&travelmode=${GOOGLE[mode]}`;
    carteTrajet.innerHTML = `<button type="button" class="pres-fermer" data-fermer title="${echapper(t('fermer'))}" aria-label="${echapper(t('fermer'))}">${SVG.croix}</button>
      <h3>${echapper(t('trajetVers', enLangue(lieu.nom)))}</h3>
      ${resume}
      <div class="onglets modes" role="group" aria-label="${echapper(t('itineraireCarte'))}">${modes}</div>
      <a class="btn-lancer" href="${echapper(google)}" target="_blank" rel="noopener">${SVG.route}<span>${echapper(t('ouvrirGoogleMaps'))}</span></a>`;
    carteTrajet.hidden = false;
    document.body.classList.add('avec-trajet');
  }

  function cadrerTrajet(bornes) {
    bornes.extend([pos.lng, pos.lat]);
    const bas = carteTrajet.offsetHeight + 50;
    voler(bornes, estTelephone() ? { top: 150, bottom: bas, left: 30, right: 30 } : { top: 110, bottom: 90, left: carteTrajet.offsetWidth + 50, right: 90 }, 1800);
  }

  function effacerTrajet() {
    if (!trajet) return;
    trajet = null;
    route.effacer();
    carteTrajet.hidden = true;
    document.body.classList.remove('avec-trajet');
  }

  // ---- Tout effacer
  function oublierTout() {
    effacerTrajet();
    for (const m of distances) reperes.oublier(m);
    distances = [];
    if (ici) reperes.oublier(ici);
    ici = null;
    if (loin?.marqueur) reperes.oublier(loin.marqueur);
    loin = null;
    carteLoin.hidden = true;
    for (const id of ['pres-anneaux', 'pres-chez-toi', 'pres-chez-toi-fond']) if (map.getLayer(id)) map.removeLayer(id);
    for (const id of ['pres-anneaux', 'pres-chez-toi']) if (map.getSource(id)) map.removeSource(id);
    pastille.hidden = true;
    pos = null;
    anneaux = null;
    bouton.classList.remove('actif');
  }

  function effacer() {
    jeton = null;
    bouton.classList.remove('cherche');
    const avait = !!pos;
    oublierTout();
    if (avait) outils.quandChange();
  }

  /** Les textes changent de langue. */
  function majLangue() {
    if (pos) {
      majPastille();
      ici?.getElement().querySelector('.pres-ici-plaque span').replaceChildren(t('presIci'));
      for (const m of distances) {
        const el = m.getElement();
        const ou = m.getLngLat();
        const d = el.classList.contains('pres-rayon') ? (pos.lat - ou.lat) * 110.57 : kmEntre(pos, ou);
        el.firstElementChild.textContent = texteKm(d);
      }
    }
    if (loin) {
      remplirLoin();
      loin.marqueur?.getElement().firstElementChild.replaceChildren(`✈ ${t('presChezToi')}`);
    }
    if (trajet) remplirTrajet();
    route.retraduire(trajet?.mode);
  }

  /** Les lieux des catégories montrées sur la carte. */
  const visibles = () => lieux().filter((l) => l.cat.visible);

  /** « 850 m », « 1,2 km », « 34 km », « 9 032 km », dans la langue du site. */
  function texteKm(km) {
    if (km < 1) return `${(Math.max(10, Math.round(km * 100) * 10)).toLocaleString(langue())} m`;
    return `${km.toLocaleString(langue(), { maximumFractionDigits: km < 10 ? 1 : 0 })} km`;
  }

  return {
    localiser, allerVers, effacer, effacerTrajet, majLangue,
    position: () => pos,
  };
}

/** Un cercle de rayon r km autour de c { lng, lat } : [[lng, lat], …]. */
function cercle(c, r) {
  const k = 111.32 * Math.cos((c.lat * Math.PI) / 180);
  const points = [];
  for (let i = 0; i <= 128; i++) {
    const a = (i / 128) * 2 * Math.PI;
    points.push([c.lng + (r / k) * Math.sin(a), c.lat + (r / 110.57) * Math.cos(a)]);
  }
  return points;
}

/** Le point à la fraction f du grand cercle de a vers b { lng, lat } : [lng, lat]. */
function surLeGlobe(a, b, f) {
  const r = Math.PI / 180;
  const [l1, p1, l2, p2] = [a.lng * r, a.lat * r, b.lng * r, b.lat * r];
  const d = 2 * Math.asin(Math.sqrt(Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin((l2 - l1) / 2) ** 2));
  if (!d) return [a.lng, a.lat];
  const A = Math.sin((1 - f) * d) / Math.sin(d), B = Math.sin(f * d) / Math.sin(d);
  const x = A * Math.cos(p1) * Math.cos(l1) + B * Math.cos(p2) * Math.cos(l2);
  const y = A * Math.cos(p1) * Math.sin(l1) + B * Math.cos(p2) * Math.sin(l2);
  const z = A * Math.sin(p1) + B * Math.sin(p2);
  return [Math.atan2(y, x) / r, Math.atan2(z, Math.hypot(x, y)) / r];
}
