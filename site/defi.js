// ================================================================
//  Le défi du jour (pas encore public, comme le jeu : le bouton n'existe
//  qu'en mode développeur ; un lien …/?defi l'ouvre pour tous).
//  Un lieu mystère par jour, le même pour tout le monde, comme Wordle
//  (choix du propriétaire, 2026-10-13 : la formule « 6 essais, chaud ou
//  froid »). On voit sa photo, floue. Chaque essai est un appui sur la
//  carte : on apprend la distance, la direction du lieu et s'il fait froid
//  ou brûlant, et la photo devient plus nette. Trouvé à moins de 20 km.
//  Le résultat se partage en petits carrés, sans dévoiler le lieu.
//  La partie du jour, la série et les statistiques restent dans ce
//  navigateur. Le défi change à minuit, heure du Japon.
// ================================================================
import { echapper, kmEntre, cap, jourDuDefi, debutDuJour } from './commun.js';

const ESSAIS = 6;
const TROUVE_KM = 20; // plus près, le lieu est trouvé
// De froid à brûlant : [plus loin que (km), clé du texte, carré à partager, couleur]
const TEMPERATURES = [[400, 'froid', '🟦', '#4f7fa6'], [150, 'tiede', '🟨', '#c9971c'], [60, 'chaud', '🟧', '#d9622b'], [0, 'brulant', '🟥', '#a8321f']];
const FLOU = [11, 8, 5.5, 3.5, 2, 0.8]; // px de flou de la photo avant chaque essai : de plus en plus nette
const NOUVEAU_LIEU = 3; // jours : un lieu tout juste ajouté au tableau n'entre dans le défi qu'après (sa photo libre arrive la nuit)
const MEMO = 'defi'; // localStorage : la partie du jour { jour, essais: [{ lng, lat }], fini } (app.js le lit aussi)
const MEMO_STATS = 'defiStats'; // { joues, trouves, serie, record, dernierTrouve, repartition: [en 1 essai … en 6, perdu] }
const FLECHES = ['⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️'];
const ROUGE = '#a8321f';
const SANS_MARGE = { top: 0, bottom: 0, left: 0, right: 0 };

const ICONES = {
  fermer: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M6 6l12 12M18 6 6 18"/></svg>',
  epingle: '<svg viewBox="0 0 32 44" aria-hidden="true"><path d="M16 1.5C8.3 1.5 2.5 7.4 2.5 15c0 9.6 13.5 27 13.5 27s13.5-17.4 13.5-27c0-7.6-5.8-13.5-13.5-13.5Z" fill="#a8321f" stroke="#f6eedb" stroke-width="2.2"/><circle cx="16" cy="15" r="5.2" fill="#f6eedb"/></svg>',
  partager: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6"/></svg>',
  video: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M3 7.5h11.5v9H3zM14.5 10.5l6-3v9l-6-3"/></svg>',
  fleche: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.5 19 13h-4.6v8.5H9.6V13H5Z"/></svg>',
};

/**
 * outils : { t, enLangue, langue(), infos(lieu), lieux(), reperes, modeles3d, photo(lieu), video(lieu), vueDepart(),
 *   estTelephone(), afficherMessage, adresse, debut (« 2026-10-13 » : le jour du défi n° 1), avant(),
 *   partager(texte, copie) (menu de partage, sinon copié avec ce message), ouvrirLieu(lieu), quandJoue() (le point rouge du bouton s'éteint) }
 */
export function brancherDefi(map, maplibregl, outils) {
  const { t, enLangue, langue, infos, lieux, reperes, modeles3d, photo, video, vueDepart, estTelephone,
    afficherMessage, adresse, debut, avant, partager } = outils;
  const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const photosLibres = fetch('data/photos-jeu.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  // etat : { jour, lieu, image { src, credit }, essais [{ lng, lat, d, cap, marqueur }], choix (LngLat posé), phase
  //          ('accueil' | 'devine' | 'fin'), trouve, montre (le lieu révélé), compte (minuterie du compte à rebours) }
  let etat = null;

  // ---- La carte du défi (en haut sur téléphone, à gauche sur ordinateur), avec les styles du jeu
  const carte = document.createElement('section');
  carte.className = 'jeu defi panneau';
  carte.hidden = true;
  carte.innerHTML = `
    <div class="jeu-tete">
      <span class="jeu-manche"></span>
      <span class="defi-essai"></span>
      <span class="defi-serie"></span>
      <button type="button" class="jeu-quitter">${ICONES.fermer}</button>
    </div>
    <h2 class="jeu-titre"></h2>
    <p class="defi-date"></p>
    <div class="jeu-cadre">
      <button type="button" class="jeu-image"><img class="jeu-fond" alt=""><img class="jeu-photo" alt=""></button>
      <small class="jeu-credit" hidden></small>
    </div>
    <div class="defi-lieu"><img alt=""><div><b></b><small></small><small class="defi-credit"></small></div></div>
    <p class="defi-grille" aria-hidden="true"></p>
    <p class="defi-verdict"></p>
    <ol class="defi-essais"></ol>
    <p class="jeu-texte"></p>
    <div class="defi-stats"></div>
    <div class="defi-barres"></div>
    <p class="defi-compte"></p>
    <div class="defi-boutons">
      <button type="button" class="btn-lancer defi-partager">${ICONES.partager}<span></span></button>
      <button type="button" class="btn-secondaire defi-video">${ICONES.video}<span></span></button>
    </div>
    <button type="button" class="btn-lancer jeu-action"></button>
    <p class="defi-note"></p>`;
  document.body.append(carte);
  const $ = (sel) => carte.querySelector(sel);
  const elPhoto = $('.jeu-photo');
  const elFond = $('.jeu-fond');

  // L'épingle posée avant de valider un essai
  const elEpingle = document.createElement('div');
  elEpingle.className = 'jeu-epingle';
  elEpingle.innerHTML = ICONES.epingle;
  const epingle = new maplibregl.Marker({ element: elEpingle, anchor: 'bottom' });
  let epingleSuivie = false;

  $('.jeu-quitter').addEventListener('click', () => arreter());
  $('.jeu-action').addEventListener('click', () => agir());
  $('.jeu-image').addEventListener('click', () => carte.classList.toggle('image-grande'));
  $('.defi-partager').addEventListener('click', () => partager(texteAPartager(), t('defiCopie')));
  $('.defi-video').addEventListener('click', () => { const l = etat?.lieu; arreter(); if (l) outils.ouvrirLieu(l); });
  elPhoto.addEventListener('load', () => {
    const r = $('.jeu-image').getBoundingClientRect();
    const rp = elPhoto.naturalWidth / elPhoto.naturalHeight, rc = r.width / r.height;
    carte.classList.toggle('photo-pleine', rp > 0 && rc > 0 && Math.min(rp, rc) / Math.max(rp, rc) >= 0.78);
  });
  map.on('click', (e) => { if (etat?.phase === 'devine') poser(e.lngLat); });
  map.on('rotate', () => { if (etat && !carte.hidden) majFleches(); });
  document.addEventListener('keydown', (e) => {
    if (!etat || carte.hidden) return;
    if (e.key === 'Escape') arreter();
    else if (e.key === 'Enter' && etat.phase !== 'fin' && !$('.jeu-action').disabled && !['BUTTON', 'INPUT', 'A'].includes(document.activeElement?.tagName)) agir();
    else return;
    e.preventDefault();
    e.stopImmediatePropagation();
  }, true);

  // ---- Le lieu du jour
  /** La photo d'un lieu : { src, credit } (credit = null pour une photo du tableau), ou null (pas dans le défi). */
  function imageDe(l, credits) {
    if (photo(l)) return { src: photo(l), credit: null };
    const c = credits[video(l)];
    return c ? { src: `photos/jeu/${video(l)}.jpg`, credit: c } : null;
  }

  /**
   * Le même lieu pour tous ce jour-là : les lieux qui ont une photo sont rangés dans un ordre tiré au sort (le même
   * partout, d'après leur nom), et on en prend un par jour ; quand tous sont passés, un nouvel ordre commence.
   * Un lieu ajouté depuis moins de NOUVEAU_LIEU jours attend : sinon le lieu du jour changerait dans la journée.
   */
  function lieuDuJour(jour, credits) {
    const limite = debutDuJour(debut, jour) - NOUVEAU_LIEU * 864e5;
    const liste = lieux().filter((l) => imageDe(l, credits) && (!l.date || l.date.getTime() < limite));
    const n = liste.length;
    if (!n) return null;
    const ordre = (tour) => liste.map((l) => ({ l, h: hachage(`${tour}:${l.id}`) }))
      .sort((a, b) => a.h - b.h || (a.l.id < b.l.id ? -1 : 1)).map((x) => x.l);
    const tour = Math.floor(jour / n);
    const celuiCi = ordre(tour);
    // le dernier lieu d'un tour et le premier du suivant ne tombent pas deux jours de suite
    if (tour > 0 && n > 1 && celuiCi[0] === ordre(tour - 1)[n - 1]) [celuiCi[0], celuiCi[1]] = [celuiCi[1], celuiCi[0]];
    return celuiCi[jour % n];
  }

  // ---- La partie
  async function lancer() {
    arreter(false);
    avant();
    const credits = await photosLibres;
    const jour = jourDuDefi(debut);
    const lieu = lieuDuJour(jour, credits);
    if (!lieu) return afficherMessage(t('defiIndisponible'));
    etat = { jour, lieu, image: imageDe(lieu, credits), essais: [], choix: null, phase: 'accueil', trouve: false, montre: null };
    // la partie du jour déjà commencée (ou finie) dans ce navigateur reprend où elle en était
    const memo = lire(MEMO);
    if (memo?.jour === jour) {
      for (const e of memo.essais || []) ajouterEssai(e);
      etat.trouve = etat.essais.some((e) => e.d <= TROUVE_KM);
      if (memo.fini) etat.phase = 'fin';
      else if (etat.essais.length) etat.phase = 'devine';
    }
    new Image().src = etat.image.src; // téléchargée pendant qu'on lit l'accueil
    document.body.classList.add('en-jeu', 'en-defi');
    for (const l of lieux()) reperes.montrer(l.epingle, false); // sinon il suffirait de toucher son épingle
    modeles3d.filtrer((l) => l === etat?.montre);
    carte.hidden = false;
    if (etat.phase === 'fin') finir(false);
    else {
      afficher();
      allerAuJapon();
    }
  }

  function agir() {
    if (!etat) return;
    if (etat.phase === 'accueil') {
      etat.phase = 'devine';
      afficher();
      allerAuJapon();
    } else if (etat.phase === 'devine' && etat.choix) valider();
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

  function valider() {
    const { lng, lat } = etat.choix;
    etat.choix = null;
    oublierEpingle();
    const e = ajouterEssai({ lng, lat });
    ecrire(MEMO, { jour: etat.jour, essais: etat.essais.map(({ lng: x, lat: y }) => ({ lng: x, lat: y })), fini: false });
    if (e.d <= TROUVE_KM || etat.essais.length >= ESSAIS) {
      etat.trouve = e.d <= TROUVE_KM;
      noter();
      finir(true);
    } else {
      afficher();
      // la ligne de cet essai s'allume
      $('.defi-essais li:last-child')?.classList.add('nouveau');
    }
  }

  /** Un essai : sa distance, la direction du lieu, et son rond numéroté sur la carte. */
  function ajouterEssai({ lng, lat }) {
    const d = kmEntre({ lng, lat }, etat.lieu);
    const e = { lng, lat, d, cap: cap({ lng, lat }, etat.lieu) };
    const el = document.createElement('div');
    el.className = 'defi-pion';
    el.style.setProperty('--k', d <= TROUVE_KM ? ROUGE : temperature(d)[3]);
    el.textContent = etat.essais.length + 1;
    e.marqueur = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([lng, lat]);
    reperes.suivre(e.marqueur);
    reperes.montrer(e.marqueur, true);
    etat.essais.push(e);
    return e;
  }

  /** Les statistiques de ce navigateur, une fois la partie du jour finie. */
  function noter() {
    const s = statistiques();
    s.joues++;
    if (etat.trouve) {
      s.trouves++;
      s.serie = s.dernierTrouve === etat.jour - 1 ? s.serie + 1 : 1;
      s.dernierTrouve = etat.jour;
      s.record = Math.max(s.record, s.serie);
      s.repartition[etat.essais.length - 1]++;
    } else {
      s.serie = 0;
      s.repartition[ESSAIS]++;
    }
    ecrire(MEMO_STATS, s);
    ecrire(MEMO, { jour: etat.jour, essais: etat.essais.map(({ lng, lat }) => ({ lng, lat })), fini: true });
    outils.quandJoue();
  }

  /** La fin : le lieu se montre, avec les traits de chaque essai jusqu'à lui. */
  function finir(anime) {
    etat.phase = 'fin';
    const l = etat.lieu;
    etat.montre = l;
    l.el.classList.add('actif'); // son nom s'affiche
    reperes.montrer(l.epingle, true);
    map.triggerRepaint();
    tracerTraits();
    afficher();
    clearInterval(etat.compte);
    etat.compte = setInterval(majCompte, 20000);
    const bornes = new maplibregl.LngLatBounds([l.lng, l.lat], [l.lng, l.lat]);
    for (const e of etat.essais) bornes.extend([e.lng, e.lat]);
    cadrer(bornes, marge(50), { maxZoom: 9, duree: anime && !calme ? 2000 : 0 });
  }

  function arreter(rendre = true) {
    if (!etat) return;
    clearInterval(etat.compte);
    oublierEpingle();
    for (const e of etat.essais) reperes.oublier(e.marqueur);
    etat.lieu.el.classList.remove('actif');
    etat = null;
    effacerTraits();
    carte.hidden = true;
    carte.classList.remove('image-grande');
    document.body.classList.remove('en-jeu', 'en-defi');
    for (const l of lieux()) reperes.montrer(l.epingle, l.cat.visible);
    modeles3d.filtrer(null);
    if (rendre) map.easeTo({ padding: SANS_MARGE, duration: calme ? 0 : 700, essential: true });
  }

  // ---- L'affichage
  function afficher() {
    const { phase, essais, lieu } = etat;
    const numero = etat.jour + 1;
    carte.dataset.phase = phase;
    const serie = serieEnCours();
    $('.jeu-manche').textContent = phase === 'accueil' ? t('defiTitre') : t('defiNumero', numero);
    $('.defi-essai').textContent = phase === 'devine' ? t('defiEssai', essais.length + 1, ESSAIS) : '';
    $('.defi-serie').textContent = phase !== 'devine' && serie > 0 ? `🔥 ${t('defiSerie', serie)}` : '';
    $('.jeu-titre').textContent = phase === 'accueil' ? t('defiNumero', numero) : '';
    $('.defi-date').textContent = phase === 'accueil' ? `${dateDuJour()} · ${t('defiPourTous')}` : '';
    $('.defi-note').textContent = phase === 'accueil' ? t('defiMinuit') : '';

    // la photo, de plus en plus nette
    if (phase === 'devine') {
      if (elPhoto.getAttribute('src') !== etat.image.src) for (const el of [elPhoto, elFond]) el.src = etat.image.src;
      carte.style.setProperty('--flou', `${FLOU[Math.min(essais.length, ESSAIS - 1)]}px`);
      const c = etat.image.credit;
      $('.jeu-credit').hidden = !c;
      if (c) $('.jeu-credit').textContent = t('jeuPhotoLibre', c.licence);
    }

    // les essais
    $('.defi-essais').innerHTML = phase === 'devine' ? essais.map((e, i) => {
      const [, cle, , couleur] = temperature(e.d);
      return `<li style="--k:${couleur}"><span class="defi-carre">${i + 1}</span><b>${echapper(texteKm(e.d))}</b>
        <span class="defi-fleche" data-cap="${e.cap}" role="img" aria-label="${echapper(t('defiDirection', t(`direction_${secteur(e.cap)}`)))}">${ICONES.fleche}</span>
        <small>${echapper(t(`defi_${cle}`))}</small></li>`;
    }).join('') : '';
    majFleches();
    $('.jeu-texte').textContent = phase === 'accueil' ? t('defiRegle')
      : phase === 'devine' ? (etat.choix ? t('defiPose') : essais.length ? t('defiEncore') : t('defiConsigne')) : '';

    const action = $('.jeu-action');
    action.hidden = phase === 'fin';
    action.disabled = phase === 'devine' && !etat.choix;
    action.textContent = phase === 'accueil' ? t('defiJouer') : t('defiValider', essais.length + 1);

    // la fin : le lieu, les petits carrés, les statistiques, le prochain défi
    if (phase === 'fin') {
      $('.defi-lieu img').src = etat.image.src;
      $('.defi-lieu b').textContent = enLangue(lieu.nom);
      $('.defi-lieu small').textContent = infos(lieu);
      const c = etat.image.credit;
      $('.defi-credit').innerHTML = c ? `<a href="${echapper(c.lien)}" target="_blank" rel="noopener">${echapper(t('jeuPhoto', c.auteur, c.licence))}</a>` : '';
      $('.defi-grille').textContent = grille().join('');
      $('.defi-verdict').textContent = etat.trouve ? t(essais.length === 1 ? 'defiTrouveDuPremier' : 'defiTrouve', essais.length) : t('defiPerdu');
      afficherStatistiques();
      majCompte();
      $('.defi-partager span').textContent = t('defiPartager');
      $('.defi-video span').textContent = t('defiVideo');
    }
  }

  function afficherStatistiques() {
    const s = statistiques();
    const pourcent = s.joues ? Math.round((s.trouves / s.joues) * 100) : 0;
    $('.defi-stats').innerHTML = [[s.joues, t('defiJoues')], [`${pourcent} %`, t('defiTrouves')], [serieEnCours(), t('defiSerieCourt')], [s.record, t('defiRecord')]]
      .map(([n, mot]) => `<div><b>${echapper(n)}</b><small>${echapper(mot)}</small></div>`).join('');
    const max = Math.max(1, ...s.repartition);
    const moi = etat.trouve ? etat.essais.length - 1 : ESSAIS;
    $('.defi-barres').innerHTML = s.repartition.map((n, i) => `<div><span>${i < ESSAIS ? i + 1 : '✗'}</span>
      <i class="${i === moi ? 'moi' : ''}" style="width:calc(18px + ${(n / max) * 100}% - ${(n / max) * 18}px)">${n}</i></div>`).join('');
  }

  /** « Prochain défi dans 8 h 12 min » ; une fois minuit passé au Japon, le nouveau défi est là. */
  function majCompte() {
    if (etat?.phase !== 'fin') return;
    const reste = debutDuJour(debut, etat.jour + 1) - Date.now();
    const el = $('.defi-compte');
    if (reste <= 0) {
      el.innerHTML = `<button type="button" class="btn-secondaire">${echapper(t('defiNouveau'))}</button>`;
      el.querySelector('button').onclick = () => lancer();
      return;
    }
    const m = Math.ceil(reste / 60000), h = Math.floor(m / 60);
    const texte = langue() === 'ja' ? `${h ? `${h}時間` : ''}${m % 60}分` : `${h ? `${h} h ` : ''}${String(m % 60).padStart(h ? 2 : 1, '0')} min`;
    el.innerHTML = `${echapper(t('defiProchain'))} <b>${echapper(texte)}</b>`;
  }

  /** Les flèches pointent vers le lieu sur l'écran : elles tournent avec la carte. */
  function majFleches() {
    const b = map.getBearing();
    for (const f of carte.querySelectorAll('.defi-fleche')) f.style.transform = `rotate(${Number(f.dataset.cap) - b}deg)`;
  }

  // ---- Le partage : des petits carrés, sans le nom du lieu
  function grille() {
    return etat.essais.map((e) => (e.d <= TROUVE_KM ? '🎯' : temperature(e.d)[2]));
  }

  function texteAPartager() {
    const n = etat.essais.length;
    const lignes = etat.essais.map((e) => (e.d <= TROUVE_KM ? '🎯' : `${temperature(e.d)[2]} ${texteKm(e.d)} ${FLECHES[Math.round(e.cap / 45) % 8]}`));
    const serie = serieEnCours();
    return [`${t('defiPartageTitre', etat.jour + 1)} 🗾 ${etat.trouve ? n : 'X'}/${ESSAIS}`, ...lignes,
      ...(serie >= 2 ? [`🔥 ${t('defiSerie', serie)}`] : []), `https://${adresse}/?defi`].join('\n');
  }

  // ---- La carte
  function allerAuJapon() {
    const tous = lieux();
    const bornes = [[Math.min(...tous.map((l) => l.lng)), Math.min(...tous.map((l) => l.lat))],
      [Math.max(...tous.map((l) => l.lng)), Math.max(...tous.map((l) => l.lat))]];
    cadrer(bornes, marge(30), { bearing: vueDepart().bearing });
  }

  function cadrer(bornes, m, { bearing = map.getBearing(), maxZoom = map.getMaxZoom(), duree = 1800 } = {}) {
    const p = map.getPadding();
    const h = (p.left + p.right) / 2, v = (p.top + p.bottom) / 2;
    const vue = map.cameraForBounds(bornes, {
      padding: { top: m.top - v, bottom: m.bottom - v, left: m.left - h, right: m.right - h }, bearing, maxZoom,
    });
    map.flyTo({ ...(vue || vueDepart()), pitch: 20, padding: SANS_MARGE, duration: calme ? 0 : duree, essential: true });
  }

  /** La place que laisse la carte du défi (en haut sur téléphone, avec le bouton en bas ; à gauche sur ordinateur). */
  function marge(m) {
    const r = carte.getBoundingClientRect();
    const bouton = $('.jeu-action');
    const bas = !bouton.hidden && bouton.getBoundingClientRect().top ? innerHeight - bouton.getBoundingClientRect().top : 90;
    if (estTelephone()) return { top: Math.round(r.bottom + m), bottom: Math.round(bas + m), left: m, right: m };
    return { top: m, bottom: m, left: Math.round(r.right + m), right: m };
  }

  function tracerTraits() {
    const donnees = {
      type: 'FeatureCollection',
      features: etat.essais.filter((e) => e.d > 1).map((e) => ({
        type: 'Feature', properties: { c: e.d <= TROUVE_KM ? ROUGE : temperature(e.d)[3] },
        geometry: { type: 'LineString', coordinates: [[e.lng, e.lat], [etat.lieu.lng, etat.lieu.lat]] },
      })),
    };
    if (map.getSource('defi-traits')) return map.getSource('defi-traits').setData(donnees);
    map.addSource('defi-traits', { type: 'geojson', data: donnees });
    map.addLayer({
      id: 'defi-traits', type: 'line', source: 'defi-traits', layout: { 'line-cap': 'round' },
      paint: { 'line-color': ['get', 'c'], 'line-width': 2.5, 'line-dasharray': [1.5, 1.6] },
    }, map.getLayer('modeles-3d') ? 'modeles-3d' : undefined);
  }

  function effacerTraits() {
    if (map.getLayer('defi-traits')) map.removeLayer('defi-traits');
    if (map.getSource('defi-traits')) map.removeSource('defi-traits');
  }

  function oublierEpingle() {
    if (!epingleSuivie) return;
    reperes.oublier(epingle);
    epingleSuivie = false;
  }

  // ---- Petits outils
  const temperature = (d) => TEMPERATURES.find(([km]) => d > km) || TEMPERATURES[TEMPERATURES.length - 1];
  const secteur = (c) => ['n', 'ne', 'e', 'se', 's', 'so', 'o', 'no'][Math.round(c / 45) % 8];

  function texteKm(km) {
    return `${km.toLocaleString(langue(), { maximumFractionDigits: km < 10 ? 1 : 0 })} km`;
  }

  function dateDuJour() {
    return new Intl.DateTimeFormat(langue(), { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Tokyo' })
      .format(new Date(debutDuJour(debut, etat.jour) + 12 * 3600e3));
  }

  function statistiques() {
    const s = lire(MEMO_STATS) || {};
    return {
      joues: s.joues || 0, trouves: s.trouves || 0, serie: s.serie || 0, record: s.record || 0, dernierTrouve: s.dernierTrouve ?? null,
      repartition: Array.from({ length: ESSAIS + 1 }, (_, i) => s.repartition?.[i] || 0),
    };
  }

  /** La série en cours : elle tient tant qu'on a trouvé hier (ou aujourd'hui). */
  function serieEnCours() {
    const s = statistiques();
    return s.dernierTrouve != null && s.dernierTrouve >= jourDuDefi(debut) - 1 ? s.serie : 0;
  }

  return { lancer, arreter, enCours: () => !!etat, majLangue: () => { if (etat) afficher(); } };
}

function lire(cle) {
  try { return JSON.parse(localStorage.getItem(cle)); } catch { return null; }
}

function ecrire(cle, valeur) {
  try { localStorage.setItem(cle, JSON.stringify(valeur)); } catch { /* pas grave */ }
}

/** Un nombre tiré du texte, toujours le même pour le même texte (FNV-1a, puis bien mélangé). */
function hachage(texte) {
  let h = 2166136261;
  for (const c of texte) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return h >>> 0;
}
