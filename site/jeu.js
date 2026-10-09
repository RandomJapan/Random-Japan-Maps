// ================================================================
//  Jeu « Devine le lieu » (pas encore public : le bouton n'existe qu'en mode
//  développeur, voir app.js ; un lien d'invitation …/?partie=CODE l'ouvre pour tous).
//  Une partie = 5 manches. À chaque manche, la photo d'un lieu de la carte et
//  30 secondes : le joueur pose son épingle sur la carte 3D, puis on révèle le
//  vrai lieu, la distance et les points (1000 au plus par manche). Un indice
//  montre la région, puis la préfecture, contre une partie des points.
//  Les meilleurs scores restent dans ce navigateur (localStorage).
//  Pendant la partie, les épingles et les modèles 3D des lieux sont cachés.
//
//  À plusieurs : un joueur crée un salon et reçoit un code (« FUJI-42 ») à partager (lien, QR code).
//  Le serveur (serveur/, chez Cloudflare) est l'arbitre : il donne à tous la même photo au même moment,
//  le même chrono, garde les épingles et compte les points ; à la révélation, chacun voit les épingles
//  de tous, chacune de sa couleur. L'hôte (le créateur) lance la partie et les manches suivantes.
// ================================================================
import { PREFECTURES, regionDe } from './regions.js';
import { adresseServeur, connexion } from './reseau.js';
import { identite } from './amis.js';

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
// Les codes de partie : un mot japonais facile à dire et deux chiffres (« FUJI-42 »)
const MOTS = ['FUJI', 'KOI', 'NEKO', 'SUSHI', 'RAMEN', 'TORII', 'SAKURA', 'YUKI', 'HANA', 'SORA', 'UMI', 'YAMA', 'KAZE',
  'TAKO', 'MOCHI', 'NORI', 'MISO', 'TOFU', 'NARA', 'KOBE', 'ONSEN', 'NINJA', 'TANUKI', 'TENGU', 'BONSAI', 'ZEN', 'DOJO',
  'TAIKO', 'KOTO', 'BENTO', 'UDON', 'SOBA', 'DANGO', 'MATCHA', 'YUZU', 'UME', 'MOMIJI', 'TSURU', 'KAPPA', 'DARUMA',
  'SUMO', 'HAIKU', 'TATAMI', 'KAMI', 'GOHAN', 'SENSU', 'KASA', 'TSUKI', 'HOSHI', 'KUMO'];
const CODE_PARTIE = /^[A-Z]{3,8}[0-9]{2,3}$/;
const URL_QR = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/+esm';

const ICONES = {
  fermer: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M6 6l12 12M18 6 6 18"/></svg>',
  epingle: '<svg viewBox="0 0 32 44" aria-hidden="true"><path d="M16 1.5C8.3 1.5 2.5 7.4 2.5 15c0 9.6 13.5 27 13.5 27s13.5-17.4 13.5-27c0-7.6-5.8-13.5-13.5-13.5Z" style="fill:var(--c,#a8321f)" stroke="#f6eedb" stroke-width="2.2"/><circle cx="16" cy="15" r="5.2" fill="#f6eedb"/></svg>',
  partager: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6"/></svg>',
  indice: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9.5 18h5M10.5 21h3M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3Z"/></svg>',
  chrono: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13.5" r="7.5" fill="none" stroke="currentColor" stroke-width="2"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 13.5V9.5M10 2.5h4M18.5 6.5l1.3-1.3"/></svg>',
  joueurs: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM2.5 20c.6-3.6 3.2-6 6.5-6s5.9 2.4 6.5 6M16 4.3a3.5 3.5 0 0 1 0 6.4M18.5 14.4c1.7.9 2.8 2.9 3 5.6"/></svg>',
  amis: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z"/></svg>',
  qr: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z"/><path fill="currentColor" d="M14 14h3v3h-3zM17 17h3v3h-3zM14 19h2v1h-2zM19 14h1v2h-1z"/></svg>',
  retour: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M15 5l-7 7 7 7"/></svg>',
  ajouter: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M12 6v12M6 12h12"/></svg>',
};

/**
 * outils : { t, enLangue, infos(lieu), lieux() → tous les lieux, reperes (reperes.js), modeles3d (couche3d.js),
 *            photo(lieu) → adresse de la photo du tableau ou '', video(lieu) → numéro de sa vidéo TikTok,
 *            prefecture(lieu) → Promise du numéro de sa préfecture, langue() → 'en' | 'fr' | 'ja',
 *            vueDepart(), estTelephone(), afficherMessage(texte), adresse, avant(), apres(),
 *            amis (amis.js, ou null sans serveur), partager(texte) → partage (téléphone) ou copie (ordinateur) }
 * Les photos : celle du tableau, sinon une photo libre de Wikimedia Commons copiée par outils/photos_jeu.py
 * (photos/jeu/<numéro de la vidéo>.jpg ; auteur et licence dans data/photos-jeu.json). Un lieu sans photo
 * n'est pas dans le jeu.
 */
export function brancherJeu(map, maplibregl, outils) {
  const { t, enLangue, infos, lieux, reperes, modeles3d, photo, video, prefecture, langue, vueDepart, estTelephone,
    afficherMessage, adresse, avant, apres, amis, partager: partagerTexte } = outils;
  const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const aPlusieurs = !!adresseServeur();
  const photosLibres = fetch('data/photos-jeu.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  let contours = null; // promesse : les morceaux de chaque préfecture (boîte, aire), pour cadrer un indice
  // etat : { liste (les 5 lieux), i, phase ('accueil' | 'amis' | 'salon' | 'devine' | 'revele' | 'fin'), choix (LngLat posé),
  //          points [], images [Promise de { src, credit }], montres (lieux révélés, dont on voit l'épingle et le modèle),
  //          credit (de la photo affichée), finChrono (instant de la fin de la manche), minuterie,
  //          indices (0, 1 ou 2), prefecture (du lieu, connue au premier indice), resultat (à la fin),
  //          multi (à plusieurs : { code, cx (connexion), s (le dernier état du salon), decalage (heure du serveur −
  //          Date.now()), creer, epingles [marqueurs des autres] }), debutChrono (à plusieurs : la photo s'affiche),
  //          erreur (sous les boutons de l'accueil), codeTape, amiAjoute (code ami à préremplir) }
  let etat = null;

  // ---- La carte du jeu (en haut sur téléphone, à gauche sur ordinateur)
  const carte = document.createElement('section');
  carte.className = 'jeu panneau';
  carte.hidden = true;
  carte.innerHTML = `
    <div class="jeu-tete">
      <button type="button" class="jeu-retour">${ICONES.retour}</button>
      <span class="jeu-manche"></span>
      <span class="jeu-chrono" role="timer">${ICONES.chrono}<span></span></span>
      <span class="jeu-score"></span>
      <button type="button" class="jeu-quitter">${ICONES.fermer}</button>
    </div>
    <h2 class="jeu-titre"></h2>
    <p class="jeu-reseau" hidden></p>
    <div class="jeu-salon">
      <span class="jeu-code-titre"></span>
      <b class="jeu-code"></b>
      <div class="jeu-salon-boutons">
        <button type="button" class="btn-secondaire jeu-inviter-lien">${ICONES.partager}<span></span></button>
        <button type="button" class="btn-secondaire jeu-qr-bouton">${ICONES.qr}</button>
      </div>
      <div class="jeu-qr" hidden></div>
    </div>
    <div class="jeu-cadre">
      <button type="button" class="jeu-image"><img class="jeu-fond" alt=""><img class="jeu-photo" alt=""></button>
      <span class="jeu-decompte" aria-live="polite"></span>
      <span class="jeu-temps"><span></span></span>
      <small class="jeu-credit" hidden></small>
    </div>
    <p class="jeu-texte"></p>
    <ol class="jeu-joueurs" hidden></ol>
    <p class="jeu-indice-texte" hidden></p>
    <button type="button" class="btn-secondaire jeu-indice">${ICONES.indice}<span></span></button>
    <div class="jeu-resultat">
      <b class="jeu-nom"></b>
      <small class="jeu-infos"></small>
      <p class="jeu-distance"></p>
    </div>
    <div class="jeu-inviter" hidden></div>
    <div class="jeu-records" hidden></div>
    <div class="jeu-amis"></div>
    <button type="button" class="btn-secondaire jeu-partager">${ICONES.partager}<span></span></button>
    <button type="button" class="btn-lancer jeu-action"></button>
    <form class="jeu-multi" hidden>
      <h3 class="jeu-multi-titre"></h3>
      <label class="champ-hasard jeu-pseudo"><span></span>
        <input name="pseudo" maxlength="16" autocomplete="nickname" spellcheck="false" enterkeyhint="done"></label>
      <button type="button" class="btn-secondaire jeu-creer">${ICONES.joueurs}<span></span></button>
      <div class="jeu-rejoindre">
        <label class="champ-hasard"><span></span>
          <input name="code" maxlength="12" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="FUJI-42" enterkeyhint="go"></label>
        <button type="submit" class="btn-secondaire"></button>
      </div>
      <p class="jeu-erreur" hidden></p>
      <button type="button" class="btn-secondaire jeu-mes-amis">${ICONES.amis}<span></span></button>
    </form>`;
  document.body.append(carte);
  const $ = (sel) => carte.querySelector(sel);
  const elPhoto = $('.jeu-photo');
  const elFond = $('.jeu-fond');
  const barre = $('.jeu-temps span');
  const formulaire = $('.jeu-multi');

  // L'épingle du joueur (de sa couleur, à plusieurs)
  const elEpingle = document.createElement('div');
  elEpingle.className = 'jeu-epingle';
  elEpingle.innerHTML = ICONES.epingle;
  const epingle = new maplibregl.Marker({ element: elEpingle, anchor: 'bottom' });
  let epingleSuivie = false;

  $('.jeu-quitter').addEventListener('click', () => arreter());
  // ← : de la liste d'amis, du salon ou du classement, retour à l'accueil du jeu
  $('.jeu-retour').addEventListener('click', () => {
    if (!etat) return;
    quitterSalon();
    nettoyerCarte();
    arreterChrono();
    etat.phase = 'accueil';
    afficher();
    allerAuJapon();
  });
  $('.jeu-action').addEventListener('click', () => agir());
  $('.jeu-indice').addEventListener('click', () => indice());
  $('.jeu-partager').addEventListener('click', () => partager());
  $('.jeu-image').addEventListener('click', () => carte.classList.toggle('image-grande'));
  $('.jeu-inviter-lien').addEventListener('click', () => inviterParLien());
  $('.jeu-qr-bouton').addEventListener('click', () => basculerQR());
  $('.jeu-creer').addEventListener('click', () => { if (pseudoChoisi()) creerPartie(); });
  $('.jeu-mes-amis').addEventListener('click', () => { if (pseudoChoisi()) voirAmis(); });
  formulaire.addEventListener('submit', (e) => {
    e.preventDefault();
    if (document.activeElement === formulaire.elements.pseudo && !formulaire.elements.code.value) { formulaire.elements.pseudo.blur(); return; }
    const code = lireCode(formulaire.elements.code.value);
    if (!code) { montrerErreur(t('jeuCodeInvalide')); formulaire.elements.code.focus(); return; }
    if (pseudoChoisi()) rejoindre(code);
  });
  formulaire.elements.pseudo.addEventListener('change', () => pseudoChoisi(false));
  formulaire.addEventListener('input', () => montrerErreur(''));
  elPhoto.addEventListener('load', () => ajusterPhoto());
  map.on('click', (e) => {
    if (etat?.phase !== 'devine') return;
    poser(e.lngLat);
  });
  document.addEventListener('keydown', (e) => {
    if (!etat || carte.hidden) return;
    if (e.key === 'Escape') arreter();
    else if (e.key === 'Enter' && !$('.jeu-action').disabled && !['BUTTON', 'INPUT'].includes(document.activeElement?.tagName)
      && !$('.jeu-action').hidden && getComputedStyle($('.jeu-action')).display !== 'none') agir();
    else return;
    e.preventDefault();
    e.stopImmediatePropagation();
  }, true);
  amis?.surChange(() => { if (etat) { afficherBoutonAmis(); afficherJoueurs(); } });

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
    formulaire.elements.pseudo.value = identite().pseudo || '';
    formulaire.elements.code.value = '';
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
    const m = etat.multi;
    if (m) {
      const s = m.s;
      if (!s) return;
      const hote = s.hote === s.moi;
      if ((etat.phase === 'salon' || etat.phase === 'fin') && hote) lancerPartieMulti();
      else if (etat.phase === 'devine' && etat.choix && !moiDans(s)?.valide) {
        m.cx.envoyer({ type: 'valider' });
        m.valideLocal = true;
        afficher();
      } else if (etat.phase === 'revele' && hote) m.cx.envoyer({ type: 'suivant' });
      return;
    }
    if (etat.phase === 'accueil') {
      if (etat.listeMulti || !etat.liste.length) {
        // après une partie à plusieurs : de nouveaux lieux pour jouer seul
        const liste = choisirLieux(etat.credits);
        Object.assign(etat, { liste, images: liste.map(() => null), points: [], listeMulti: false });
      }
      manche(0);
    } else if (etat.phase === 'devine' && etat.choix) reveler();
    else if (etat.phase === 'revele') { if (etat.i + 1 < etat.liste.length) manche(etat.i + 1); else finir(); }
    else if (etat.phase === 'fin') lancer();
  }

  /** Remet la carte et le cadre à zéro pour la manche i. */
  function preparerManche(i) {
    arreterChrono();
    Object.assign(etat, { i, phase: 'devine', choix: null, indices: 0, prefecture: null, chercheIndice: false, finChrono: 0,
      debutChrono: 0, credit: null, tempsFini: false });
    if (etat.multi) etat.multi.valideLocal = false;
    oublierEpingle();
    oublierEpinglesAutres();
    effacerTrait();
    effacerZone();
    cacherMontres(); // le lieu révélé à la manche d'avant disparaît à nouveau
    carte.classList.remove('image-grande');
    montrerImage(null);
  }

  function manche(i) {
    preparerManche(i);
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
    const m = etat.multi;
    if (m && (performance.now() < etat.debutChrono || moiDans(m.s)?.valide || m.valideLocal)) return;
    etat.choix = lngLat;
    epingle.setLngLat(lngLat);
    if (!epingleSuivie) {
      reperes.suivre(epingle, { placer: (el) => el.parentNode.append(el) }); // devant tout le reste
      epingleSuivie = true;
    } else reperes.verifier(epingle);
    if (m) m.cx.envoyer({ type: 'epingle', lng: lngLat.lng, lat: lngLat.lat });
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
    montrerLieu(l);
    afficher();
    const vol = { pitch: 40, bearing: map.getBearing(), padding: marge(70), duration: calme ? 0 : 2000, essential: true };
    if (choix) {
      tracerTraits([{ de: choix, vers: [l.lng, l.lat], couleur: ROUGE }]);
      map.fitBounds(new maplibregl.LngLatBounds([l.lng, l.lat], [l.lng, l.lat]).extend(choix), { ...vol, maxZoom: 10.5 });
    } else map.flyTo({ ...vol, center: [l.lng, l.lat], zoom: 8.5 }); // sans épingle (temps écoulé) : le lieu seul
  }

  /** Le vrai lieu réapparaît (son épingle et son modèle 3D), avec son nom. */
  function montrerLieu(l) {
    etat.montres.add(l);
    l.el.classList.add('actif'); // son nom s'affiche, avec l'anneau rouge d'un lieu choisi
    reperes.montrer(l.epingle, true);
    map.triggerRepaint();
  }

  function finir() {
    etat.phase = 'fin';
    etat.resultat = noterPartie(etat.points.reduce((a, b) => a + b, 0));
    nettoyerCarte();
    afficher();
    allerAuJapon();
  }

  function nettoyerCarte() {
    cacherMontres();
    oublierEpingle();
    oublierEpinglesAutres();
    effacerTrait();
    effacerZone();
  }

  function cacherMontres() {
    for (const l of etat.montres) { l.el.classList.remove('actif'); reperes.montrer(l.epingle, false); }
    etat.montres.clear();
    map.triggerRepaint();
  }

  function arreter(rendre = true) {
    if (!etat) return;
    arreterChrono();
    quitterSalon();
    for (const l of etat.montres) l.el.classList.remove('actif');
    oublierEpinglesAutres();
    etat = null;
    oublierEpingle();
    effacerTrait();
    effacerZone();
    carte.hidden = true;
    carte.classList.remove('image-grande', 'presse', 'urgent', 'decompte');
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

  /** À chaque tic du chrono : l'affichage, et à zéro, le lieu révélé (à plusieurs, c'est le serveur qui révèle). */
  function tic() {
    if (etat?.phase !== 'devine') return;
    if (etat.multi) {
      const avantDebut = etat.debutChrono - performance.now();
      carte.classList.toggle('decompte', avantDebut > 0);
      if (avantDebut > 0) {
        $('.jeu-decompte').textContent = Math.min(3, Math.ceil(avantDebut / 1000)); // « 3, 2, 1 »
        majChrono();
        return;
      }
      if (!etat.photoMontree) {
        etat.photoMontree = true;
        const i = etat.i;
        preparerImage(i).then((im) => { if (etat?.i === i && etat.phase === 'devine') montrerImage(im); });
        afficher();
      }
    }
    const reste = majChrono();
    if (!etat.finChrono || reste > 0) return;
    if (!etat.multi) reveler();
    else if (!etat.tempsFini) { etat.tempsFini = true; afficher(); } // « Temps écoulé », en attendant la révélation du serveur
  }

  /** Le nombre de secondes et la barre sur la photo (rouges dans les 10 dernières secondes) ; renvoie le reste. */
  function majChrono() {
    const reste = etat.finChrono ? Math.min(DUREE_MANCHE, Math.max(0, etat.finChrono - performance.now()) / 1000) : DUREE_MANCHE;
    const s = Math.ceil(reste);
    const nombre = $('.jeu-chrono span');
    if (nombre.dataset.s !== String(s)) {
      nombre.dataset.s = s;
      nombre.textContent = t('jeuSecondes', s);
      carte.classList.toggle('presse', s <= 10);
      carte.classList.toggle('urgent', s <= 5 && s > 0);
    }
    barre.style.transform = `scaleX(${reste / DUREE_MANCHE})`;
    return reste;
  }

  // ---- Les indices : la région, puis la préfecture (colorées sur la carte)
  async function indice() {
    if (etat?.phase !== 'devine' || etat.chercheIndice || etat.indices >= indicesMax()) return;
    if (etat.multi && (performance.now() < etat.debutChrono || moiDans(etat.multi.s)?.valide)) return;
    const { i } = etat;
    const l = etat.liste[i];
    etat.chercheIndice = true;
    afficher();
    try {
      const [code, morceaux] = await Promise.all([prefecture(l), chargerContours()]);
      if (etat?.i !== i || etat.phase !== 'devine' || !code) return;
      etat.prefecture = code;
      etat.indices++;
      etat.multi?.cx.envoyer({ type: 'indices', n: etat.indices });
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

  // ================================================================
  //  À plusieurs
  // ================================================================
  /** Le pseudo du champ : gardé (et dit aux amis). Sans pseudo, un message et le curseur dans le champ. */
  function pseudoChoisi(exiger = true) {
    const champ = formulaire.elements.pseudo;
    const p = champ.value.replace(/\s+/g, ' ').trim().slice(0, 16);
    if (!p) {
      if (exiger) { montrerErreur(t('jeuPseudoManquant')); champ.focus(); }
      return false;
    }
    champ.value = p;
    if (amis) amis.changerPseudo(p);
    else {
      const j = identite();
      try { localStorage.setItem('joueur', JSON.stringify({ ...j, pseudo: p })); } catch { /* */ }
    }
    return true;
  }

  function montrerErreur(texte) {
    const el = $('.jeu-erreur');
    el.hidden = !texte;
    el.textContent = texte || '';
  }

  /** « fuji-42 », « FUJI 42 », un lien …?partie=FUJI42 → « FUJI42 », ou '' si ce n'en est pas un. */
  function lireCode(texte) {
    const s = String(texte || '');
    const lien = s.match(/[?&]partie=([A-Za-z0-9-]+)/);
    const code = (lien ? lien[1] : s).toUpperCase().replace(/[^A-Z0-9]/g, '');
    return CODE_PARTIE.test(code) ? code : '';
  }

  const formaterCode = (code) => code.replace(/^([A-Z]+)(\d+)$/, '$1-$2');
  const lienPartie = (code) => `https://${adresse}/?partie=${code}`;
  const nouveauCode = () => MOTS[Math.floor(Math.random() * MOTS.length)] + String(10 + Math.floor(Math.random() * 90));
  const moiDans = (s) => s?.joueurs.find((j) => j.id === s.moi);
  const lieuParId = (id) => lieux().find((l) => l.id === id);

  function creerPartie(essai = 0) {
    entrerSalon(nouveauCode(), true, essai);
  }

  function rejoindre(code) {
    entrerSalon(code, false);
  }

  /** Ouvre la connexion au salon code (créer = le créer : son code doit être libre). */
  function entrerSalon(code, creer, essai = 0) {
    if (!etat) return;
    quitterSalon();
    montrerErreur('');
    nettoyerCarte();
    arreterChrono();
    const j = identite();
    const m = { code, creer, essai, s: null, decalage: null, epingles: [], coupe: false };
    etat.multi = m;
    etat.phase = 'salon';
    etat.i = -1;
    m.cx = connexion(`/salon/${code}`, j.id, {
      ouverte: () => {
        m.coupe = false;
        m.cx.envoyer({ type: 'entrer', creer: m.creer, pseudo: identite().pseudo });
        afficher();
      },
      message: (msg) => { if (etat?.multi === m) recevoir(msg); },
      coupee: () => {
        if (etat?.multi !== m) return;
        m.coupe = true;
        m.decalage = null; // l'heure du serveur se remesure à la reconnexion
        afficher();
      },
    });
    afficher();
  }

  function quitterSalon() {
    const m = etat?.multi;
    if (!m) return;
    oublierEpinglesAutres();
    m.cx.envoyer({ type: 'quitter' });
    m.cx.fermer();
    etat.multi = null;
    carte.classList.remove('decompte');
    elEpingle.style.removeProperty('--c');
  }

  /** Un message du serveur du salon. */
  function recevoir(msg) {
    const m = etat.multi;
    if (msg.type === 'refus') {
      if (msg.raison === 'occupe' && m.creer && m.essai < 5) { creerPartie(m.essai + 1); return; }
      quitterSalon();
      etat.phase = 'accueil';
      formulaire.elements.code.value = msg.raison === 'inconnu' ? formaterCode(m.code) : '';
      montrerErreur(msg.raison === 'inconnu' ? t('jeuCodeInconnu', formaterCode(m.code)) : msg.raison === 'plein' ? t('jeuSalonPlein') : t('jeuSalonErreur'));
      afficher();
      return;
    }
    if (msg.type === 'remplace') {
      quitterSalon();
      etat.phase = 'accueil';
      montrerErreur(t('jeuAilleurs'));
      afficher();
      return;
    }
    if (msg.type !== 'etat') return;
    m.creer = false; // dedans : les reconnexions rejoignent ce salon
    const ecart = msg.maintenant - Date.now();
    m.decalage = m.decalage == null ? ecart : Math.max(m.decalage, ecart); // le message le moins retardé
    const avant = m.s;
    m.s = msg;
    const moi = moiDans(msg);
    if (moi && /^#[0-9a-f]{6}$/i.test(moi.couleur)) elEpingle.style.setProperty('--c', moi.couleur);
    // une nouvelle partie : ses lieux (le serveur n'envoie que leurs numéros)
    if (!avant || avant.partie !== msg.partie || avant.liste.join() !== msg.liste.join()) {
      const liste = msg.liste.map(lieuParId);
      if (liste.some((l) => !l)) {
        quitterSalon();
        etat.phase = 'accueil';
        montrerErreur(t('jeuLieuManquant'));
        afficher();
        return;
      }
      Object.assign(etat, { liste, images: liste.map(() => null), points: [], listeMulti: true });
      preparerImage(0);
      preparerImage(1);
    }
    const change = !avant || avant.phase !== msg.phase || avant.i !== msg.i || avant.partie !== msg.partie;
    if (!change) { afficher(); return; }
    if (msg.phase === 'salon') { etat.phase = 'salon'; afficher(); }
    else if (msg.phase === 'devine') mancheMulti(msg);
    else if (msg.phase === 'revele') revelerMulti(msg);
    else if (msg.phase === 'fin') finirMulti(msg);
  }

  /** L'hôte lance la partie (ou la revanche) : 5 lieux au hasard, envoyés au serveur. */
  function lancerPartieMulti() {
    const liste = choisirLieux(etat.credits);
    if (!liste.length) return;
    etat.multi.cx.envoyer({ type: 'lancer', liste: liste.map((l) => ({ id: l.id, lng: l.lng, lat: l.lat })) });
  }

  /** Une manche à plusieurs : la photo s'affiche à l'heure dite par le serveur, pour tous en même temps. */
  function mancheMulti(s) {
    const i = s.i;
    preparerManche(i);
    etat.photoMontree = false;
    const local = (tServeur) => performance.now() + (tServeur - (Date.now() + etat.multi.decalage));
    etat.debutChrono = local(s.debut);
    etat.finChrono = local(s.fin);
    // revenu après une coupure : l'épingle qu'on avait posée
    if (s.mienne?.lng != null) {
      etat.choix = new maplibregl.LngLat(s.mienne.lng, s.mienne.lat);
      etat.indices = s.mienne.indices || 0;
      epingle.setLngLat(etat.choix);
      reperes.suivre(epingle, { placer: (el) => el.parentNode.append(el) });
      epingleSuivie = true;
    }
    preparerImage(i);
    preparerImage(i + 1);
    etat.minuterie = setInterval(tic, 100);
    tic();
    afficher();
    allerAuJapon();
  }

  /** La révélation à plusieurs : les épingles de tous, chacune de sa couleur, reliées au vrai lieu. */
  function revelerMulti(s) {
    if (etat.phase !== 'devine' || etat.i !== s.i) {
      // arrivé pendant la révélation (ou revenu après une coupure)
      preparerManche(s.i);
    }
    arreterChrono();
    carte.classList.remove('decompte', 'presse', 'urgent');
    etat.phase = 'revele';
    const l = etat.liste[s.i];
    const res = s.resultats || {};
    const mien = res[s.moi];
    etat.dernier = { d: mien?.km ?? null, pts: mien?.pts || 0 };
    etat.indices = mien?.indices || 0;
    if (!elPhoto.getAttribute('src')) preparerImage(s.i).then((im) => { if (etat?.phase === 'revele' && etat.i === s.i) montrerImage(im); });
    oublierEpingle();
    montrerLieu(l);
    const traits = [];
    const bornes = new maplibregl.LngLatBounds([l.lng, l.lat], [l.lng, l.lat]);
    for (const j of s.joueurs) {
      const r = res[j.id];
      if (r?.lng == null) continue;
      const el = document.createElement('div');
      el.className = `jeu-epingle jeu-epingle-joueur${j.id === s.moi ? ' moi' : ''}`;
      el.style.setProperty('--c', /^#[0-9a-f]{6}$/i.test(j.couleur) ? j.couleur : ROUGE);
      el.innerHTML = `${ICONES.epingle}<span>${echapper(j.pseudo)}</span>`;
      const marqueur = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([r.lng, r.lat]);
      reperes.suivre(marqueur, { placer: (e) => e.parentNode.append(e) });
      etat.multi.epingles.push(marqueur);
      traits.push({ de: { lng: r.lng, lat: r.lat }, vers: [l.lng, l.lat], couleur: el.style.getPropertyValue('--c') });
      bornes.extend([r.lng, r.lat]);
    }
    tracerTraits(traits);
    afficher();
    // cadré à l'inclinaison du moment (celle de allerAuJapon) : cameraForBounds calcule avec elle, et un
    // fitBounds qui inclinait davantage en volant laissait des épingles hors de l'écran
    cadrer(bornes, marge(60), { maxZoom: traits.length ? 10.5 : 8.5, duree: 2000 });
  }

  function finirMulti(s) {
    arreterChrono();
    carte.classList.remove('decompte', 'presse', 'urgent');
    etat.phase = 'fin';
    const moi = moiDans(s);
    etat.points = [moi?.total || 0];
    // noté une fois par partie (pas à chaque reconnexion pendant le classement)
    if (etat.multi.notee !== s.partie) { etat.multi.notee = s.partie; etat.resultat = noterPartie(moi?.total || 0); }
    nettoyerCarte();
    afficher();
    allerAuJapon();
  }

  function oublierEpinglesAutres() {
    for (const marqueur of etat?.multi?.epingles || []) reperes.oublier(marqueur);
    if (etat?.multi) etat.multi.epingles = [];
  }

  // ---- Inviter : le lien (partagé ou copié), le QR code, les amis en ligne
  function inviterParLien() {
    const code = etat?.multi?.code;
    if (code) partagerTexte(t('jeuInvitationTexte', formaterCode(code), lienPartie(code)), t('jeuInvitationCopiee'));
  }

  async function basculerQR() {
    const bloc = $('.jeu-qr');
    const code = etat?.multi?.code;
    if (!bloc.hidden || !code) { bloc.hidden = true; return; }
    try {
      const { default: qrcode } = await import(URL_QR);
      const qr = qrcode(0, 'M');
      qr.addData(lienPartie(code));
      qr.make();
      const n = qr.getModuleCount();
      let d = '';
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
      bloc.innerHTML = `<svg viewBox="-3 -3 ${n + 6} ${n + 6}" role="img" aria-label="${echapper(t('jeuQR'))}" shape-rendering="crispEdges">
        <rect x="-3" y="-3" width="${n + 6}" height="${n + 6}" fill="#f6eedb"/><path d="${d}" fill="#35251a"/></svg><small>${echapper(t('jeuQRAide'))}</small>`;
      bloc.hidden = false;
    } catch (e) {
      console.warn('QR code indisponible', e);
      afficherMessage(t('jeuQRErreur'));
    }
  }

  function voirAmis(code) {
    if (!etat || !amis) return;
    if (code) etat.amiAjoute = code;
    etat.phase = 'amis';
    afficher();
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
    const m = etat.multi;
    const s = m?.s;
    const moi = moiDans(s);
    const hote = s && s.hote === s.moi;
    const nomHote = s?.joueurs.find((j) => j.id === s.hote)?.pseudo || '';
    const total = m ? moi?.total || 0 : etat.points.reduce((a, b) => a + b, 0);
    carte.dataset.phase = phase;
    carte.dataset.multi = m ? 'oui' : 'non';
    if (phase !== 'devine') carte.classList.remove('presse', 'urgent', 'decompte');
    $('.jeu-manche').textContent = phase === 'devine' || phase === 'revele' ? t('jeuManche', etat.i + 1, etat.liste.length) : '';
    $('.jeu-score').textContent = phase === 'devine' || phase === 'revele' ? t('jeuPoints', nombre(total)) : '';
    $('.jeu-titre').textContent = phase === 'accueil' ? t('jeu') : phase === 'amis' ? t('amisTitre') : phase === 'salon' ? t('jeuSalonTitre')
      : phase === 'fin' ? (m ? t('jeuClassement') : t('jeuFin')) : '';
    $('.jeu-quitter').title = t('jeuQuitter');
    $('.jeu-quitter').setAttribute('aria-label', t('jeuQuitter'));
    $('.jeu-retour').title = t('jeuRetour');
    $('.jeu-retour').setAttribute('aria-label', t('jeuRetour'));
    $('.jeu-image').setAttribute('aria-label', t('jeuAgrandir'));
    $('.jeu-chrono').setAttribute('aria-label', t('jeuChrono'));
    $('.jeu-partager span').textContent = t('jeuPartager');
    delete $('.jeu-chrono span').dataset.s; // réécrit dans la langue choisie
    if (phase === 'devine') majChrono();
    // la connexion au salon
    const reseau = $('.jeu-reseau');
    reseau.hidden = !m || (!m.coupe && !!s);
    reseau.textContent = m?.coupe ? t('jeuReconnexion') : t('jeuConnexion');
    afficherFormulaire();
    afficherSalon();
    afficherAmis();
    afficherCredit();
    afficherIndice();
    afficherRecords();
    afficherJoueurs();
    const texte = $('.jeu-texte');
    const action = $('.jeu-action');
    action.disabled = false;
    action.hidden = false;
    if (phase === 'accueil') {
      texte.textContent = t('jeuRegles', MANCHES, DUREE_MANCHE);
      action.textContent = aPlusieurs ? t('jeuJouerSeul') : t('jeuJouer');
    } else if (phase === 'amis') {
      texte.textContent = '';
      action.hidden = true;
    } else if (phase === 'salon') {
      texte.textContent = !s ? '' : hote ? t('jeuSalonHote') : t('jeuSalonInvite', nomHote);
      action.textContent = hote ? t('jeuLancerPartie', s.joueurs.length) : t('jeuAttenteHote', nomHote);
      action.disabled = !hote || !!m.coupe;
    } else if (phase === 'devine') {
      const avantDebut = m && performance.now() < etat.debutChrono;
      const valide = m && (moi?.valide || m.valideLocal);
      const fini = m && etat.finChrono && performance.now() >= etat.finChrono;
      texte.textContent = avantDebut ? t('jeuPrets') : fini ? t('jeuTempsFini')
        : valide ? t('jeuAttenteAutres', s.joueurs.filter((j) => j.valide).length, s.joueurs.filter((j) => j.connecte).length) : t('jeuConsigne');
      action.textContent = valide ? t('jeuValide') : t('jeuValider');
      action.disabled = !etat.choix || !!valide || !!fini || !!avantDebut;
    } else if (phase === 'revele') {
      const l = etat.liste[etat.i];
      const { d, pts } = etat.dernier;
      texte.textContent = d == null ? t('jeuTempsFini') : d < 10 ? t('jeuParfait') : d < 50 ? t('jeuPres') : d < 150 ? t('jeuPasMal') : t('jeuLoin');
      $('.jeu-nom').textContent = enLangue(l.nom);
      $('.jeu-infos').textContent = infos(l);
      $('.jeu-distance').textContent = (d == null ? t('jeuSansEpingle') : t('jeuDistance', nombre(Math.round(d)), pts))
        + (etat.indices ? ` · ${t('jeuAvecIndices', etat.indices)}` : '');
      const dernier = etat.i + 1 >= etat.liste.length;
      if (m && !hote) {
        action.textContent = t('jeuAttenteHote', nomHote);
        action.disabled = true;
      } else action.textContent = dernier ? (m ? t('jeuVoirClassement') : t('jeuVoirScore')) : t('jeuSuivant');
    } else if (m) {
      // la fin à plusieurs : la place, puis le classement (afficherJoueurs)
      const rang = 1 + s.joueurs.filter((j) => j.total > (moi?.total || 0)).length;
      texte.innerHTML = `<span class="jeu-total">${echapper(t('jeuPoints', nombre(total)))}</span>${echapper(t('jeuPlace', rang, s.joueurs.length))}`;
      action.textContent = hote ? t('jeuRevanche') : t('jeuAttenteHote', nomHote);
      action.disabled = !hote;
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

  /** L'accueil : jouer à plusieurs (pseudo, créer, rejoindre avec un code) et les amis. */
  function afficherFormulaire() {
    formulaire.hidden = etat.phase !== 'accueil' || !aPlusieurs;
    if (formulaire.hidden) return;
    $('.jeu-multi-titre').textContent = t('jeuAPlusieurs');
    $('.jeu-pseudo span').textContent = t('jeuPseudo');
    formulaire.elements.pseudo.placeholder = t('jeuPseudoExemple');
    $('.jeu-creer span').textContent = t('jeuCreer');
    $('.jeu-rejoindre span').textContent = t('jeuCodeRecu');
    $('.jeu-rejoindre button').textContent = t('jeuRejoindre');
    $('.jeu-mes-amis').hidden = !amis;
    afficherBoutonAmis();
  }

  function afficherBoutonAmis() {
    if (!amis || !etat) return;
    $('.jeu-mes-amis span').textContent = t('jeuMesAmis', amis.nbEnLigne(), amis.nbRecues());
  }

  /** Le salon : le code en grand, de quoi le partager, et les amis en ligne à inviter. */
  function afficherSalon() {
    const m = etat.multi;
    const bloc = $('.jeu-salon');
    bloc.hidden = etat.phase !== 'salon' || !m;
    const inviter = $('.jeu-inviter');
    if (bloc.hidden) { $('.jeu-qr').hidden = true; inviter.hidden = true; return; }
    $('.jeu-code-titre').textContent = t('jeuCodePartie');
    $('.jeu-code').textContent = formaterCode(m.code);
    $('.jeu-inviter-lien span').textContent = t('jeuInviterLien');
    $('.jeu-qr-bouton').title = t('jeuQR');
    $('.jeu-qr-bouton').setAttribute('aria-label', t('jeuQR'));
    if (amis && m.s) amis.dessiner(inviter, { invitations: true, code: m.code, exclure: m.s.joueurs.map((j) => j.id) });
    else inviter.hidden = true;
  }

  function afficherAmis() {
    const bloc = $('.jeu-amis');
    bloc.hidden = etat.phase !== 'amis';
    if (bloc.hidden) { bloc.replaceChildren(); return; }
    const ajouter = etat.amiAjoute;
    etat.amiAjoute = '';
    amis.dessiner(bloc, { ajouter, code: '' });
  }

  /** Les joueurs du salon : en attente (salon), qui a validé (manche), la manche (révélation), le classement (fin). */
  function afficherJoueurs() {
    const ol = $('.jeu-joueurs');
    const s = etat.multi?.s;
    const { phase } = etat;
    ol.hidden = !s || !['salon', 'devine', 'revele', 'fin'].includes(phase);
    if (ol.hidden) return;
    const res = phase === 'revele' ? s.resultats || {} : null;
    const lignes = [...s.joueurs];
    if (res) lignes.sort((a, b) => (res[b.id]?.pts ?? -1) - (res[a.id]?.pts ?? -1));
    if (phase === 'fin') lignes.sort((a, b) => b.total - a.total);
    ol.dataset.vue = phase;
    ol.innerHTML = lignes.map((j) => {
      const moi = j.id === s.moi;
      const couleur = /^#[0-9a-f]{6}$/i.test(j.couleur) ? j.couleur : ROUGE;
      let droite = '';
      if (phase === 'salon') droite = j.id === s.hote ? `<small>${echapper(t('jeuHote'))}</small>` : '';
      else if (phase === 'devine') droite = j.valide ? `<span class="jeu-statut ok" title="${echapper(t('jeuAValide'))}">✓</span>`
        : j.pose ? `<span class="jeu-statut" title="${echapper(t('jeuAPose'))}">•••</span>` : '';
      else if (phase === 'revele') {
        const r = res[j.id];
        droite = `<small>${echapper(r?.km == null ? t('jeuSansEpingleCourt') : t('jeuKm', nombre(Math.round(r.km))))}</small><b>+${nombre(r?.pts || 0)}</b>`;
      } else droite = `<b>${echapper(t('jeuPoints', nombre(j.total)))}</b>`;
      const rang = phase === 'fin' ? `<span class="jeu-rang">${1 + s.joueurs.filter((k) => k.total > j.total).length}</span>` : '';
      let ami = '';
      if (amis && !moi && (phase === 'salon' || phase === 'fin')) {
        if (amis.estAmi(j.id)) ami = `<span class="jeu-ami-deja" title="${echapper(t('jeuDejaAmi'))}">${ICONES.amis}</span>`;
        else if (amis.demandeEnvoyee(j.id)) ami = `<small class="jeu-ami-attente">${echapper(t('jeuDemandeAmi'))}</small>`;
        else ami = `<button type="button" class="jeu-ami" data-ami="${j.id}" title="${echapper(t('jeuAjouterAmi', j.pseudo))}">${ICONES.ajouter}<span>${echapper(t('jeuAmi'))}</span></button>`;
      }
      return `<li class="${moi ? 'moi' : ''}${j.connecte ? '' : ' absent'}" style="--c:${couleur}">${rang}<span class="jeu-pion"></span>
        <span class="jeu-pseudo">${echapper(j.pseudo)}${moi ? ` <small>(${echapper(t('jeuToi'))})</small>` : ''}${j.connecte ? '' : ` <small>· ${echapper(t('jeuParti'))}</small>`}</span>${droite}${ami}</li>`;
    }).join('');
    ol.querySelectorAll('[data-ami]').forEach((b) => b.addEventListener('click', () => {
      if (amis.demander(b.dataset.ami)) { b.disabled = true; b.querySelector('span').textContent = t('jeuDemandeAmi'); }
    }));
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
    const m = etat.multi;
    bouton.hidden = phase !== 'devine' || etat.indices >= indicesMax()
      || (m && (performance.now() < etat.debutChrono || moiDans(m.s)?.valide || m.valideLocal));
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
    bloc.hidden = !(etat.phase === 'accueil' || (etat.phase === 'fin' && !etat.multi)) || !records.meilleurs.length;
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
    if (!im) return Promise.resolve(null);
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
    if (estTelephone()) return { top: Math.round(r.bottom + m), bottom: Math.round(innerHeight - (bouton.top || innerHeight) + m), left: m, right: m };
    return { top: m, bottom: m, left: Math.round(r.right + m), right: m };
  }

  // ---- L'épingle du joueur et les traits jusqu'au vrai lieu
  function oublierEpingle() {
    if (!epingleSuivie) return;
    reperes.oublier(epingle);
    epingleSuivie = false;
  }

  /** traits : [{ de: { lng, lat }, vers: [lng, lat], couleur }] (un par joueur à plusieurs) */
  function tracerTraits(traits) {
    const donnees = {
      type: 'FeatureCollection',
      features: traits.map((tr) => ({ type: 'Feature', properties: { c: tr.couleur }, geometry: { type: 'LineString', coordinates: [[tr.de.lng, tr.de.lat], tr.vers] } })),
    };
    const source = map.getSource('jeu-trait');
    if (source) source.setData(donnees);
    else {
      map.addSource('jeu-trait', { type: 'geojson', data: donnees });
      map.addLayer({
        id: 'jeu-trait', type: 'line', source: 'jeu-trait',
        layout: { 'line-cap': 'round' },
        paint: { 'line-color': ['coalesce', ['get', 'c'], ROUGE], 'line-width': 3, 'line-dasharray': [1.5, 1.6] },
      }, map.getLayer('modeles-3d') ? 'modeles-3d' : undefined);
    }
  }

  function effacerTrait() {
    if (map.getLayer('jeu-trait')) map.removeLayer('jeu-trait');
    if (map.getSource('jeu-trait')) map.removeSource('jeu-trait');
  }

  // ---- Partager son score
  function partager() {
    if (!etat) return;
    const s = etat.multi?.s;
    const moi = moiDans(s);
    const texte = s
      ? t('jeuPartageMulti', 1 + s.joueurs.filter((j) => j.total > (moi?.total || 0)).length, s.joueurs.length, moi?.total || 0, `https://${adresse}/?jeu`)
      : t('jeuPartageMessage', etat.points.reduce((a, b) => a + b, 0), POINTS_MAX * etat.liste.length, `https://${adresse}/?jeu`);
    partagerTexte(texte, t('jeuCopie'));
  }

  // ---- Ouvert par un lien : …/?partie=CODE (rejoindre) ou …/?ami=CODE (ajouter un ami)
  async function ouvrirPartie(texte) {
    const code = lireCode(texte);
    if (!code || !aPlusieurs) return;
    if (!etat) await lancer();
    if (etat.multi?.code === code) return;
    formulaire.elements.code.value = formaterCode(code);
    if (identite().pseudo) { formulaire.elements.pseudo.value = identite().pseudo; rejoindre(code); return; }
    quitterSalon();
    etat.phase = 'accueil';
    afficher();
    montrerErreur(t('jeuPseudoPourRejoindre', formaterCode(code)));
    formulaire.elements.pseudo.focus();
  }

  async function ouvrirAmis(code) {
    if (!amis) return;
    if (!etat) await lancer();
    if (identite().pseudo) { voirAmis(code); return; }
    etat.amiAjoute = code;
    montrerErreur(t('jeuPseudoPourAmis'));
    formulaire.elements.pseudo.focus();
    // une fois le pseudo choisi, « Mes amis » ouvre la liste avec ce code prérempli
  }

  return { lancer, arreter, enCours: () => !!etat, majLangue: afficher, ouvrirPartie, ouvrirAmis };
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
