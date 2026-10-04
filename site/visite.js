// ================================================================
//  Visite guidée : la caméra vole toute seule d'un lieu à l'autre, comme un film.
//  - D'abord un plan d'ensemble de tous les lieux de la visite, puis chaque lieu de près,
//    dans l'ordre du voyage, en tournant lentement autour pendant la pause.
//  - Un bandeau en bas donne le nom du lieu ; une petite barre permet pause, précédent, suivant, arrêt.
//  - Option vidéo : sur chaque lieu, la vidéo TikTok du lieu passe dans un cadre (à droite sur ordinateur,
//    en haut sur téléphone) pendant le temps choisi, puis on coupe et on vole au lieu suivant.
//  - Mode film : tous les boutons de la carte se cachent (la barre revient quand on bouge la souris
//    ou qu'on touche l'écran), pour filmer l'écran proprement. L'adresse de la carte reste écrite
//    à l'écran (le « filigrane »), pour que chaque extrait filmé la porte.
//  - Plongeon : depuis tout le Japon, la caméra plonge sur un seul lieu, comme le début des vidéos
//    TikTok (il remplace le plongeon Google Earth). Lancé depuis l'onglet « Plongeon » du panneau de la
//    visite, sur une position collée : le lieu n'est souvent pas encore dans le tableau (app.js).
// ================================================================
import { ordreDeVoyage } from './favoris.js';

const ZOOM_LIEU = 12;
const CACHER_BARRE = 2500; // ms sans bouger avant que la barre se cache, en mode film
const ATTENTE_VIDEO = 6000; // ms : si la vidéo n'a pas démarré, on continue avec la photo du lieu
const PAUSE_PLONGEON = 1200; // ms d'image fixe sur tout le Japon avant de plonger (pour couper au montage)
const DUREE_PLONGEON = 2500; // ms : le plongeon lui-même (la propriétaire l'a voulu entre 2 et 3 s)
const ATTENTE_PRECHARGE = 10000; // ms au plus d'image fixe à attendre les tuiles du trajet (precharge.js)
const SANS_MARGE = { top: 0, bottom: 0, left: 0, right: 0 };
// Lecteur TikTok sans boutons ni textes ; il démarre tout seul (muet, sinon le navigateur peut refuser)
const LECTEUR = 'https://www.tiktok.com/player/v1/';
const REGLAGES_LECTEUR = 'autoplay=1&loop=1&controls=0&progress_bar=0&play_button=0&volume_control=0&fullscreen_button=0'
  + '&timestamp=0&music_info=0&description=0&rel=0&native_context_menu=0&closed_caption=0';

const ICONES = {
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>',
  lecture: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5.5v13a1 1 0 0 0 1.5.9l10.5-6.5a1 1 0 0 0 0-1.8L9.5 4.6A1 1 0 0 0 8 5.5Z"/></svg>',
  precedent: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 5h2.5v14H6zM19 5.8v12.4a.8.8 0 0 1-1.2.7L9.6 12.7a.8.8 0 0 1 0-1.4l8.2-6.2a.8.8 0 0 1 1.2.7Z"/></svg>',
  suivant: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M15.5 5H18v14h-2.5zM5 5.8v12.4a.8.8 0 0 0 1.2.7l8.2-6.2a.8.8 0 0 0 0-1.4L6.2 5.1A.8.8 0 0 0 5 5.8Z"/></svg>',
  arreter: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M6 6l12 12M18 6 6 18"/></svg>',
  rejouer: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M4.6 13A7.5 7.5 0 1 0 6.8 6.7M4.4 4.2v4.3h4.3"/></svg>',
};

/**
 * outils : { t, enLangue, infos(lieu) → « Catégorie · Préfecture », video(lieu) → numéro de la vidéo TikTok,
 *            debut(lieu) → seconde où commence l'extrait (après le plongeon du début de la vidéo),
 *            affiche(lieu) → Promise de l'adresse de sa photo, estTelephone, vueDepart() → la vue de tout le Japon,
 *            adresse → l'adresse de la carte, écrite à l'écran en mode film,
 *            exageration(zoom) → la hauteur du relief à ce zoom (sans paliers),
 *            preparerVol(depart, arrivee, hauteur) → Promise de { altitude } (precharge.js), avant(), apres() }
 *   avant() : appelé au début (fermer les menus et la fiche, arrêter la rotation…)
 *   apres() : appelé à la fin
 * Renvoie { lancer(liste, { duree, film, video, son }), plonger(lieu, { fin }), preparerPlongeon(lieu), arreter(),
 *   enCours(), majLangue() }.
 *   plonger : fin() est appelé quand le plongeon s'arrête (app.js y retire le lieu provisoire).
 *   preparerPlongeon : télécharge d'avance le relief du trajet (dès que la position est collée).
 */
export function brancherVisite(map, outils) {
  const { t, enLangue, infos, video, debut, affiche, estTelephone, vueDepart, adresse, exageration, preparerVol, avant, apres } = outils;
  const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // etat : { liste, i, duree, film, avecVideo, son, pause, jeton, minuterie, attente, finSejour, reste,
  //          plongeon (un seul lieu, en plongeant depuis tout le Japon),
  //          surPlace (arrivé sur le lieu), deplace (on a bougé la carte pendant la pause),
  //          lecteur (la vidéo affichée), reserve (la vidéo du lieu suivant, qui se charge en cachette) }
  let etat = null;
  let verrou = null; // garde l'écran allumé pendant la visite (téléphone)
  let minuterieBarre = 0;

  // ---- Le bandeau du nom (en bas) et la barre de commandes
  const titre = document.createElement('div');
  titre.className = 'visite-titre';
  titre.setAttribute('aria-live', 'polite');
  const barre = document.createElement('div');
  barre.className = 'visite-barre panneau';
  barre.innerHTML = `
    <button type="button" data-action="precedent">${ICONES.precedent}</button>
    <button type="button" data-action="pause" class="visite-pause">${ICONES.pause}</button>
    <button type="button" data-action="suivant">${ICONES.suivant}</button>
    <span class="visite-progres"></span>
    <button type="button" data-action="rejouer" class="visite-rejouer">${ICONES.rejouer}</button>
    <button type="button" data-action="arreter" class="visite-arreter">${ICONES.arreter}</button>`;
  // Le cadre de la vidéo : la photo du lieu en attendant, puis le lecteur TikTok par-dessus
  const cadreVideo = document.createElement('div');
  cadreVideo.className = 'visite-video';
  cadreVideo.innerHTML = '<div class="visite-video-ecran"></div>';
  const ecran = cadreVideo.firstChild;
  // L'adresse de la carte, en mode film (en haut, sous les onglets de TikTok ; sous la vidéo sur téléphone)
  const filigrane = document.createElement('div');
  filigrane.className = 'filigrane';
  filigrane.setAttribute('aria-hidden', 'true');
  filigrane.innerHTML = `<img src="img/logo.jpg" alt=""><span>${echapper(adresse)}</span>`;
  document.body.append(cadreVideo, titre, barre, filigrane);
  barre.addEventListener('click', (e) => {
    const action = e.target.closest('button')?.dataset.action;
    if (action === 'precedent') aller(etat.i - 1);
    else if (action === 'suivant') aller(etat.i + 1);
    else if (action === 'pause') basculerPause();
    else if (action === 'rejouer') plonger(etat.liste[0], { fin: etat.fin });
    else if (action === 'arreter') arreter();
    montrerBarre();
  });

  function majLangue() {
    const arret = etat?.plongeon ? 'plongeonArreter' : 'visiteArreter';
    for (const [action, cle] of [['precedent', 'visitePrecedent'], ['suivant', 'visiteSuivant'], ['rejouer', 'plongeonRejouer'], ['arreter', arret]]) {
      const b = barre.querySelector(`[data-action="${action}"]`);
      b.title = t(cle);
      b.setAttribute('aria-label', t(cle));
    }
    majPause();
    barre.title = estTelephone() ? '' : t('visiteAide');
  }

  function majPause() {
    const b = barre.querySelector('.visite-pause');
    const enPause = !!etat?.pause;
    b.innerHTML = enPause ? ICONES.lecture : ICONES.pause;
    b.title = t(enPause ? 'visiteReprendre' : 'visitePause');
    b.setAttribute('aria-label', b.title);
  }

  function majProgres() {
    if (!etat) return;
    barre.querySelector('.visite-progres').textContent = etat.i < 0 ? `0 / ${etat.liste.length}` : `${etat.i + 1} / ${etat.liste.length}`;
    barre.querySelector('[data-action="precedent"]').disabled = etat.i <= 0;
  }

  // Mode film : la barre et le curseur disparaissent quand on ne bouge plus
  function montrerBarre(ms = CACHER_BARRE) {
    document.body.classList.remove('visite-calme');
    clearTimeout(minuterieBarre);
    if (etat?.film) minuterieBarre = setTimeout(() => document.body.classList.add('visite-calme'), ms);
  }

  function montrerTitre(l) {
    // Le nom japonais, écrit de haut en bas comme sur la fiche ; plus petit quand il est long
    const n = [...(l.nom.ja || '')].length;
    const taille = n > 10 ? 11 : n > 8 ? 12.5 : n > 6 ? 14 : 0;
    const ja = l.nom.ja && l.nom.ja !== enLangue(l.nom)
      ? `<span class="visite-titre-ja" lang="ja"${taille ? ` style="font-size:${taille}px"` : ''}>${echapper(l.nom.ja)}</span>` : '';
    titre.innerHTML = `${ja}<span class="visite-titre-textes"><b>${echapper(enLangue(l.nom))}</b><small>${echapper(infos(l))}</small></span>`;
    titre.classList.add('visible');
  }
  const cacherTitre = () => titre.classList.remove('visible');

  // ---- La visite
  function lancer(liste, { duree = 7000, film = true, video: avecVideo = true, son = false } = {}) {
    if (!liste.length) return;
    arreter(false);
    etat = { liste: ordreDeVoyage(liste), i: -1, duree, film, avecVideo, son, pause: false, jeton: 0, minuterie: 0, attente: 0 };
    if (avecVideo && !document.querySelector('link[href="https://www.tiktok.com"]')) {
      document.head.insertAdjacentHTML('beforeend', '<link rel="preconnect" href="https://www.tiktok.com">');
    }
    avant();
    document.body.classList.add('en-visite');
    document.body.classList.toggle('mode-film', film);
    document.body.classList.toggle('visite-avec-video', avecVideo); // sur téléphone, l'adresse passe sous la vidéo
    navigator.wakeLock?.request('screen').then((v) => { verrou = v; }).catch(() => {});
    majLangue();
    majProgres();
    montrerBarre();
    if (etat.liste.length === 1) { aller(0); return; }
    // Plan d'ensemble : tous les lieux de la visite à l'écran, puis le premier
    const jeton = ++etat.jeton;
    survoler(() => {
      prechargerVideo(etat.liste[0]);
      etat.minuterie = setTimeout(() => { if (jeton === etat?.jeton) aller(0); }, 1500);
    });
  }

  /** Vue d'ensemble de tous les lieux de la visite ; fin() quand la caméra est arrivée. */
  function survoler(fin) {
    const lngs = etat.liste.map((l) => l.lng);
    const lats = etat.liste.map((l) => l.lat);
    const jeton = etat.jeton;
    const marge = estTelephone() ? 50 : 110;
    const bornes = [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]];
    // La carte garde la marge du dernier lieu (la place de la vidéo) : cameraForBounds en tient compte,
    // alors on lui donne la différence, et le vol ramène la marge à zéro.
    const p = map.getPadding();
    const h = (p.left + p.right) / 2, v = (p.top + p.bottom) / 2;
    const vue = map.cameraForBounds(bornes, {
      padding: { top: marge - v, bottom: marge + 60 - v, left: marge - h, right: marge - h },
      maxZoom: 9, bearing: map.getBearing(),
    });
    // stop() termine d'abord le mouvement en cours : son « moveend » part avant qu'on écoute le nôtre
    map.stop();
    map.once('moveend', () => { if (jeton === etat?.jeton) fin(); });
    if (vue) map.flyTo({ ...vue, pitch: 45, padding: SANS_MARGE, duration: calme ? 0 : 3000, essential: true });
    else map.fitBounds(bornes, { padding: marge, maxZoom: 9, pitch: 45, duration: calme ? 0 : 3000, essential: true });
  }

  function aller(i) {
    if (!etat || i < 0) return;
    if (i >= etat.liste.length) { finir(); return; }
    clearTimeout(etat.minuterie);
    etat.i = i;
    etat.pause = false;
    etat.surPlace = false;
    etat.deplace = false;
    etat.finSejour = 0;
    majPause();
    majProgres();
    cacherTitre();
    cacherVideo();
    const l = etat.liste[i];
    if (etat.reserve && etat.reserve.lieu !== l) jeterReserve(); // on a sauté un lieu
    const avecVideo = etat.avecVideo && !!video(l);
    if (avecVideo) affiche(l).then((url) => { if (url) new Image().src = url; }); // la photo arrive pendant le vol
    const jeton = ++etat.jeton;
    map.stop();
    map.once('moveend', () => { if (jeton === etat?.jeton) arrive(l, jeton); });
    // Durée du vol selon la distance : 3 s pour un voisin, 8 s au plus d'un bout à l'autre du Japon
    // (avec maxDuration, MapLibre sauterait d'un coup au lieu de voler).
    const centre = map.getCenter();
    const km = Math.hypot((l.lng - centre.lng) * Math.cos((l.lat * Math.PI) / 180), l.lat - centre.lat) * 111;
    map.flyTo({
      center: [l.lng, l.lat], zoom: ZOOM_LIEU, pitch: estTelephone() ? 56 : 60,
      bearing: map.getBearing() + (calme ? 0 : 25),
      padding: margeLieu(avecVideo),
      curve: 1.5, duration: calme ? 0 : Math.min(8000, 3000 + km * 3.5), essential: true,
    });
  }

  /** La place du lieu à l'écran : au-dessus du bandeau du nom, et à côté de la vidéo (ou dessous sur téléphone). */
  function margeLieu(avecVideo) {
    const bas = estTelephone() ? 110 : 90;
    if (!avecVideo) return { ...SANS_MARGE, bottom: bas };
    // Le cadre est toujours posé (invisible) : on lit sa place sans les petits décalages de son animation
    // (sur téléphone, assez bas pour que le repère flottant au-dessus du modèle 3D ne touche pas le cadre)
    if (estTelephone()) {
      const sous = cadreVideo.offsetTop + cadreVideo.offsetHeight + 40;
      return { ...SANS_MARGE, top: sous + (etat.film ? filigrane.offsetHeight + 10 : 0), bottom: bas };
    }
    const droite = innerWidth - cadreVideo.offsetLeft;
    document.body.style.setProperty('--video-place', `${droite}px`);
    return { ...SANS_MARGE, bottom: bas, right: droite };
  }

  function arrive(l, jeton) {
    etat.surPlace = true;
    montrerTitre(l);
    if (etat.avecVideo && video(l)) {
      montrerVideo(l);
      orbiter(etat.duree + ATTENTE_VIDEO);
      attendreVideo(jeton); // le séjour commence quand la vidéo démarre
    } else {
      orbiter(etat.duree);
      sejour(jeton, etat.duree);
    }
  }

  /** On tourne lentement autour du lieu : 18° pendant le temps choisi. */
  function orbiter(ms) {
    if (!calme) map.easeTo({ bearing: map.getBearing() + (18 * ms) / etat.duree, duration: ms, easing: (x) => x, essential: true });
  }

  /** Reste sur le lieu ms millisecondes, puis passe au suivant. Pendant ce temps, la vidéo suivante se charge. */
  function sejour(jeton, ms) {
    clearTimeout(etat.attente);
    if (etat.lecteur) etat.lecteur.commence = true;
    etat.finSejour = performance.now() + ms;
    etat.minuterie = setTimeout(() => { if (jeton === etat?.jeton && !etat.pause) aller(etat.i + 1); }, ms);
    prechargerVideo(etat.liste[etat.i + 1]);
  }

  // ---- Le plongeon
  /**
   * Plongeon : une image fixe de tout le Japon, puis la caméra plonge sur le lieu en 2,5 s, et tourne
   * lentement autour jusqu'à ce qu'on arrête. Toujours en mode film. « Rejouer » (barre, Espace)
   * recommence, pour refaire une prise. fin() : appelé quand on arrête (pas quand on rejoue).
   * Pendant l'image fixe, les tuiles de relief du trajet se téléchargent (precharge.js) : la descente
   * ne les attend plus.
   */
  function plonger(l, { fin } = {}) {
    if (!l) return;
    arreter(false, etat?.fin === fin);
    etat = { liste: [l], i: 0, plongeon: true, fin, film: true, duree: 7000, avecVideo: false, pause: false, jeton: 0, minuterie: 0, attente: 0 };
    avant();
    document.body.classList.add('en-visite', 'mode-film', 'plongeon');
    navigator.wakeLock?.request('screen').then((v) => { verrou = v; }).catch(() => {});
    majLangue();
    montrerBarre(900); // partie avant que la caméra plonge : la prise reste propre (un appui la fait revenir)
    const jeton = ++etat.jeton;
    const vol = volPlongeon(l);
    const pret = preparerPlongeon(l);
    map.stop();
    map.jumpTo(vol.depart);
    Promise.all([dessinee(), Promise.race([pret, attendre(ATTENTE_PRECHARGE)])]).then(([, prep]) => {
      if (jeton !== etat?.jeton) return;
      etat.minuterie = setTimeout(() => { if (jeton === etat?.jeton) descendre(l, jeton, vol, prep?.altitude); }, calme ? 0 : PAUSE_PLONGEON);
    });
  }

  /** Le vol du plongeon : la caméra de départ (tout le Japon) et les options du flyTo jusqu'au lieu. */
  function volPlongeon(l) {
    const depart = { ...vueDepart(), padding: SANS_MARGE };
    return {
      depart,
      arrivee: {
        center: [l.lng, l.lat], zoom: ZOOM_LIEU, pitch: estTelephone() ? 56 : 60,
        bearing: depart.bearing + (calme ? 0 : 30),
        padding: margePlongeon(),
        minZoom: depart.zoom, // on plonge tout droit, sans reprendre de hauteur au début
      },
    };
  }

  /** Télécharge d'avance le relief du trajet et lit l'altitude du lieu (une seule fois par position). */
  function preparerPlongeon(l) {
    if (!preparerVol) return Promise.resolve(null);
    const { depart, arrivee } = volPlongeon(l);
    return preparerVol(depart, arrivee, (alt) => hauteurPendantVol(alt, depart.zoom, 0)).catch(() => null);
  }

  /**
   * Hauteur du centre de la vue pendant la descente (m) : de celle du départ (h0) à celle du sol du
   * lieu au zoom d'arrivée, en suivant le zoom. Sans ça, MapLibre la recalculait à chaque image : le
   * relief rétrécit pendant la descente (exagération ×30 → ×1,5) et ses tuiles se précisent, alors la
   * caméra montait et descendait par à-coups au-dessus des montagnes.
   */
  function hauteurPendantVol(altitude, z0, h0) {
    return (z) => {
      const p = Math.min(1, Math.max(0, (z - z0) / (ZOOM_LIEU - z0)));
      return h0 + (Math.max(0, altitude) * exageration(Math.min(z, ZOOM_LIEU)) - h0) * p;
    };
  }

  const attendre = (ms) => new Promise((ok) => setTimeout(ok, ms));

  /** Attend que le relief de la vue soit chargé (3 s au plus), pour que l'image de départ soit nette. */
  function dessinee() {
    const debutAttente = performance.now();
    return new Promise((ok) => {
      const verifier = () => {
        if (!etat || map.areTilesLoaded() || performance.now() - debutAttente > 3000) ok();
        else setTimeout(verifier, 150);
      };
      setTimeout(verifier, 200);
    });
  }

  function descendre(l, jeton, { arrivee }, altitude) {
    map.once('moveend', () => {
      if (jeton !== etat?.jeton) return;
      etat.surPlace = true;
      if (enLangue(l.nom)) montrerTitre(l); // un lieu sans nom : pas de bandeau
      // puis un lent tour du lieu (2,6° par seconde, comme la visite), jusqu'à ce qu'on arrête
      if (!calme) map.easeTo({ bearing: map.getBearing() + 360, duration: 140000, easing: (x) => x, essential: true });
    });
    // la hauteur du centre suit le zoom, jusqu'au sol du lieu (gardée pendant le tour, retirée à l'arrêt)
    if (altitude != null && exageration) {
      const hauteur = hauteurPendantVol(altitude, map.getZoom(), map.getCenterElevation());
      map.setTransformCameraUpdate(({ zoom }) => ({ elevation: hauteur(zoom) }));
    }
    map.flyTo({ ...arrivee, duration: calme ? 0 : DUREE_PLONGEON, essential: true });
  }

  /** Sur téléphone, le nom du lieu est plus haut (hors de la zone des textes de TikTok) : le lieu se pose au-dessus. */
  function margePlongeon() {
    if (!estTelephone()) return { ...SANS_MARGE, bottom: 90 };
    return { ...SANS_MARGE, bottom: Math.round(innerHeight * 0.22) + 40 };
  }

  // ---- La vidéo TikTok du lieu
  // Un lecteur : { lieu, iframe, pret (il a déjà joué), joue (l'extrait se voit), temps et longueur (en s),
  //   saut (on a demandé d'aller au début de l'extrait), commence (le séjour a commencé),
  //   secours (commencé sans la vidéo), sonEssaye, repli (son refusé), pauseVoulue }.
  // L'extrait commence après le plongeon depuis le ciel du début des vidéos (debut(lieu), 4 s) : le lecteur
  // reste invisible (on voit la photo) jusqu'à ce qu'il y soit.
  // Le lecteur TikTok met 2 à 3 s à démarrer : la vidéo du lieu suivant se charge donc en réserve pendant
  // le séjour (invisible, calée au début de l'extrait et mise en pause dès qu'elle joue) et part dès l'arrivée.
  function creerLecteur(l) {
    const iframe = document.createElement('iframe');
    // toujours muet au départ : c'est la seule lecture automatique que tous les navigateurs acceptent
    iframe.src = `${LECTEUR}${video(l)}?${REGLAGES_LECTEUR}&muted=1`;
    iframe.allow = 'autoplay; encrypted-media';
    iframe.title = 'TikTok';
    iframe.tabIndex = -1;
    iframe.className = 'reserve';
    ecran.append(iframe);
    return {
      lieu: l, iframe, pret: false, joue: false, temps: 0, longueur: 0, saut: false,
      commence: false, secours: false, sonEssaye: false, repli: false, pauseVoulue: false,
    };
  }

  /** La seconde où commence l'extrait (0 si la vidéo est trop courte pour sauter le plongeon). */
  function departDe(lecteur) {
    const d = Math.max(0, Number(debut(lecteur.lieu)) || 0);
    return lecteur.longueur && lecteur.longueur < d + 3 ? 0 : d;
  }

  function prechargerVideo(l) {
    if (!etat?.avecVideo || !l || !video(l) || etat.reserve?.lieu === l || etat.lecteur?.lieu === l) return;
    jeterReserve();
    etat.reserve = creerLecteur(l);
    affiche(l).then((url) => { if (url) new Image().src = url; });
  }

  function jeterReserve() {
    if (!etat?.reserve) return;
    etat.reserve.iframe.remove();
    etat.reserve = null;
  }

  function montrerVideo(l) {
    let lecteur = etat.reserve;
    if (lecteur?.lieu === l) {
      etat.reserve = null;
      if (lecteur.pret && Math.abs(lecteur.temps - departDe(lecteur)) > 0.6) commander('seekTo', lecteur, departDe(lecteur));
    } else {
      jeterReserve();
      lecteur = creerLecteur(l);
    }
    lecteur.iframe.classList.remove('reserve');
    etat.lecteur = lecteur;
    commander('play', lecteur);
    ecran.style.backgroundImage = '';
    affiche(l).then((url) => {
      if (url && etat?.lecteur === lecteur) ecran.style.backgroundImage = `url("${url.replace(/"/g, '%22')}")`;
    });
    cadreVideo.classList.remove('joue');
    cadreVideo.classList.add('visible');
    document.body.classList.add('video-visible');
  }

  /** Si la vidéo ne démarre pas (réseau lent, vidéo supprimée…), on reste quand même sur la photo du lieu. */
  function attendreVideo(jeton) {
    clearTimeout(etat.attente);
    etat.attente = setTimeout(() => {
      if (jeton !== etat?.jeton || etat.pause) return;
      if (etat.lecteur) etat.lecteur.secours = true;
      sejour(jeton, etat.duree);
    }, ATTENTE_VIDEO);
  }

  function commander(type, lecteur = etat?.lecteur, valeur) {
    if (!lecteur) return;
    if (type === 'pause') lecteur.pauseVoulue = true;
    else if (type === 'play') lecteur.pauseVoulue = false;
    lecteur.iframe.contentWindow?.postMessage({ type, value: valeur, 'x-tiktok-player': true }, 'https://www.tiktok.com');
  }

  function cacherVideo() {
    cadreVideo.classList.remove('visible');
    document.body.classList.remove('video-visible');
    const lecteur = etat?.lecteur;
    if (!lecteur) return;
    etat.lecteur = null;
    clearTimeout(etat.attente);
    commander('mute', lecteur);
    commander('pause', lecteur);
    setTimeout(() => lecteur.iframe.remove(), 600); // après le fondu du cadre
  }

  /** L'extrait commence : le lecteur apparaît par-dessus la photo et le séjour démarre. */
  function montrerExtrait(lecteur) {
    lecteur.joue = true;
    cadreVideo.classList.add('joue');
    // la vidéo a tout son temps, même si elle a démarré après l'attente maximale
    if (lecteur.secours) orbiter(etat.duree);
    if (!lecteur.commence || lecteur.secours) { lecteur.secours = false; sejour(etat.jeton, etat.duree); }
  }

  /** Le son a été refusé par le navigateur : on relance la vidéo sans le son. */
  function sansSon(lecteur) {
    lecteur.repli = true;
    commander('mute', lecteur);
    commander('play', lecteur);
  }

  // Le lecteur TikTok raconte ce qu'il fait : on attend qu'il joue pour lancer le séjour
  addEventListener('message', (e) => {
    if (!etat) return;
    const { lecteur: actif, reserve } = etat;
    const lecteur = actif && e.source === actif.iframe.contentWindow ? actif
      : reserve && e.source === reserve.iframe.contentWindow ? reserve : null;
    if (!lecteur) return;
    let d = e.data;
    if (typeof d === 'string') { try { d = JSON.parse(d); } catch { return; } }
    if (!d?.['x-tiktok-player']) return;
    const etatLecteur = d.type === 'onStateChange' ? d.value : null;
    if (d.type === 'onCurrentTime') {
      lecteur.temps = Number(d.value?.currentTime) || 0;
      lecteur.longueur = Number(d.value?.duration) || lecteur.longueur;
    }

    if (lecteur === reserve) {
      // En réserve : dès qu'elle joue, on la cale au début de l'extrait et on l'arrête en attendant l'arrivée
      if (etatLecteur === 1 && !lecteur.pret) {
        lecteur.pret = true;
        commander('seekTo', lecteur, departDe(lecteur));
        commander('pause', lecteur);
      } else if (d.type === 'onPlayerError') jeterReserve();
      return;
    }
    const depart = departDe(lecteur);
    if (d.type === 'onPlayerReady' && !lecteur.joue && !etat.pause) commander('play', lecteur);
    else if (etatLecteur === 1) {
      lecteur.pret = true;
      if (etat.pause) { commander('pause', lecteur); return; }
      if (etat.son && !lecteur.sonEssaye) { lecteur.sonEssaye = true; commander('unMute', lecteur); }
      if (lecteur.joue) return;
      if (lecteur.temps >= depart - 0.3) montrerExtrait(lecteur);
      else if (!lecteur.saut) { lecteur.saut = true; commander('seekTo', lecteur, depart); } // on saute le plongeon
    } else if (d.type === 'onCurrentTime' && !etat.pause) {
      if (!lecteur.joue && lecteur.temps >= depart - 0.3) montrerExtrait(lecteur);
      // la vidéo a fait le tour (boucle) : on saute encore le plongeon
      else if (lecteur.joue && lecteur.temps < depart - 0.5) commander('seekTo', lecteur, depart);
    } else if (etatLecteur === 2 && !lecteur.pauseVoulue && !etat.pause && lecteur.sonEssaye && !lecteur.repli) {
      sansSon(lecteur); // certains navigateurs arrêtent la vidéo quand on remet le son
    } else if (d.type === 'onPlayerError') {
      if (d.value?.errorCode === 3002 && !lecteur.repli) sansSon(lecteur);
      else if (!lecteur.commence && !etat.pause) sejour(etat.jeton, etat.duree); // la photo reste
    }
  });

  function basculerPause() {
    if (!etat) return;
    if (etat.pause) { reprendre(); return; }
    etat.pause = true;
    etat.jeton++;
    clearTimeout(etat.minuterie);
    clearTimeout(etat.attente);
    etat.reste = etat.finSejour ? Math.max(1000, etat.finSejour - performance.now()) : 0;
    map.stop();
    commander('pause');
    majPause();
  }

  /** Reprise : sur place, la vidéo et la rotation continuent ; si on a bougé la carte, on y revole. */
  function reprendre() {
    if (!etat.surPlace || etat.deplace) { aller(Math.max(0, etat.i)); return; }
    etat.pause = false;
    majPause();
    const jeton = ++etat.jeton;
    commander('play');
    if (etat.lecteur && !etat.lecteur.commence) {
      orbiter(etat.duree + ATTENTE_VIDEO);
      attendreVideo(jeton);
    } else {
      orbiter(etat.reste || etat.duree);
      sejour(jeton, etat.reste || etat.duree);
    }
  }

  function finir() {
    cacherTitre();
    cacherVideo();
    jeterReserve();
    const jeton = ++etat.jeton;
    titre.innerHTML = `<span class="visite-titre-textes"><b>${echapper(t('visiteFin'))}</b></span>`;
    survoler(() => {
      titre.classList.add('visible');
      setTimeout(() => { if (jeton === etat?.jeton) arreter(); }, 2500);
    });
  }

  function arreter(rendre = true, garderFin = false) {
    if (!etat) return;
    if (!garderFin) etat.fin?.();
    clearTimeout(etat.minuterie);
    clearTimeout(minuterieBarre);
    clearTimeout(etat.attente);
    cacherVideo();
    jeterReserve();
    etat = null;
    map.stop();
    map.setTransformCameraUpdate(null); // la hauteur du plongeon
    cacherTitre();
    document.body.classList.remove('en-visite', 'mode-film', 'visite-calme', 'plongeon', 'visite-avec-video');
    verrou?.release().catch(() => {});
    verrou = null;
    if (rendre) {
      // la marge laissée pour la vidéo et le bandeau disparaît en douceur
      map.easeTo({ padding: SANS_MARGE, duration: calme ? 0 : 700, essential: true });
      apres();
    }
  }

  // ---- Clavier, souris, doigts
  document.addEventListener('keydown', (e) => {
    if (!etat) return;
    if (e.key === 'Escape') arreter();
    else if (etat.plongeon) {
      if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter') plonger(etat.liste[0], { fin: etat.fin });
      else return;
    } else if (e.key === ' ' || e.key === 'Spacebar') basculerPause();
    else if (e.key === 'ArrowRight') aller(etat.i + 1);
    else if (e.key === 'ArrowLeft') aller(Math.max(0, etat.i - 1));
    else return;
    e.preventDefault();
    e.stopImmediatePropagation();
    montrerBarre();
  }, true);
  for (const type of ['mousemove', 'pointerdown']) document.addEventListener(type, () => { if (etat) montrerBarre(); }, { passive: true });
  // Si on attrape la carte pendant la visite (glisser, zoomer, tourner), on la met en pause (on reprend
  // avec le bouton). Un simple appui, lui, fait juste revenir la barre.
  for (const type of ['dragstart', 'zoomstart', 'rotatestart', 'pitchstart']) {
    map.on(type, (e) => {
      if (!etat || !e.originalEvent || etat.plongeon) return; // plongeon : on regarde librement, « Rejouer » recommence
      etat.deplace = true;
      if (!etat.pause) basculerPause();
    });
  }
  document.addEventListener('visibilitychange', () => {
    // le verrou d'écran saute quand la page est cachée : on le reprend au retour
    if (etat && !document.hidden && !verrou) navigator.wakeLock?.request('screen').then((v) => { verrou = v; }).catch(() => {});
  });

  return { lancer, plonger, preparerPlongeon, arreter, enCours: () => !!etat, majLangue };
}

const echapper = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
