// ================================================================
//  Le live TikTok « Devine le lieu » (2026-11-22). Le propriétaire veut des lives qui tournent tout seuls, sans
//  montrer sa tête ni parler, 1 h à 1 h 30 par jour, pour ramener des gens sur la carte. Un live en boucle serait
//  « non recommandé » par TikTok : celui-ci réagit au chat, c'est le chat qui joue.
//
//  …/?live ouvre la carte sans ses boutons, faite pour un écran vertical (1080 × 1920 : une source « Lien » de
//  TikTok LIVE Studio). En boucle :
//  - une manche : la photo d'un lieu, floue puis de plus en plus nette ; les spectateurs écrivent une préfecture
//    dans le chat, un essai chacun ; chaque essai colore sa préfecture sur la carte, de froid à brûlant, et passe
//    dans le fil ; à 15 s de la fin, la région s'affiche (un cadeau la montre tout de suite) ; puis la carte vole
//    jusqu'au lieu, avec ceux qui ont trouvé (10, 8, 6 points, puis 4) et le classement du live ;
//  - toutes les 5 manches, une pause voyage : le chat vote pour une préfecture, la carte y vole et montre un lieu.
//  Les abonnements, cadeaux et partages reçoivent un merci à l'écran. Musique libre du lecteur (instrumentale),
//  petits sons faits ici.
//
//  Les commentaires arrivent par TikFinity (gratuit, à lancer sur le même PC pendant le live) : une WebSocket
//  ws://localhost:21213, des messages { event: 'chat' | 'gift' | 'follow' | 'share' | 'like' | …, data } au format
//  de TikTok-Live-Connector. ?live&essai : de faux spectateurs, pour essayer sans être en live.
//  Langue de l'écran : ?live (anglais, la langue des vidéos), ?live=fr, ?live=ja. Le chat peut répondre en anglais,
//  en japonais ou avec les noms à accents (Hokkaidō).
//
//  Le live YouTube (2026-11-23) : ?live&youtube. Le premier live TikTok sans personne a été restreint en quelques
//  minutes (« contenu reproduit » : TikTok veut un animateur présent) ; YouTube accepte les lives qui tournent seuls.
//  Même jeu, même écran vertical (le fil des Shorts sur téléphone), filmé par OBS (source « Navigateur »). Le chat
//  YouTube arrive par Streamer.bot (gratuit, sur le même PC, compte YouTube branché) : sa WebSocket
//  ws://127.0.0.1:8080/ n'envoie rien avant une demande « Subscribe », puis des messages
//  { timeStamp, event: { source: 'YouTube', type: 'Message' | 'SuperChat' | … }, data }. Les textes propres à TikTok
//  (« lien en bio », « abonnement », TikFinity) ont leur variante …YT dans config.js.
// ================================================================
import { echapper, kmEntre } from './commun.js';
import { PREFECTURES, regionDe } from './regions.js';

const MANCHE = 30; // s pour deviner
const ENTREE = 2.4; // s : la carte revient sur le Japon, la photo arrive ; le temps part après
const INDICE = 15; // s restantes quand la région s'affiche
const REVELE = 15; // s sur le lieu trouvé
const MANCHES_PAR_VOYAGE = 5;
const VOTE = 16; // s pour voter (pause voyage)
const VISITE = 15; // s sur le lieu de la pause voyage
const POINTS = [10, 8, 6]; // le premier à trouver, le deuxième, le troisième ; ensuite POINTS_SUITE
const POINTS_SUITE = 4;
const FLOU_MAX = 18; // px (sur 1080) de flou au début d'une manche ; nette à la fin
const FIL = 5; // essais montrés à la fois
const MEMO = 'liveScores'; // localStorage : { jour, joueurs: { id: { nom, points, trouves } } }, le classement du jour
const SOURCE = 'live-prefectures';
const PENTE = 35; // inclinaison de la vue du Japon
const VERT = '#1d5652'; // encre bleu-vert : « a trouvé »
// De froid à brûlant : [plus loin que (km), clé du texte, couleur, emoji]
const TEMPERATURES = [[600, 'liveFroid', '#4f7fa6', '🧊'], [300, 'liveTiede', '#c9971c', '🌤️'], [130, 'liveChaud', '#d9622b', '🔥'], [0, 'liveBrulant', '#a8321f', '🔥']];
const JAPON = [[122.9, 24.0], [146.0, 45.6]];
// Les bouts du Japon (Hokkaidō, Honshū, Kyūshū, Tsushima, Gotō, Yakushima, Okinawa) : la vue du Japon les cadre au plus juste
const BOUTS = [[145.3, 44.35], [141.94, 45.52], [145.82, 43.38], [143.25, 41.93], [140.9, 41.5], [140.87, 35.7], [138.85, 34.6],
  [137.3, 37.5], [135.76, 33.43], [130.66, 30.99], [129.3, 34.6], [128.7, 32.6], [130.5, 30.35], [127.68, 26.1]];
const MEDAILLES = ['🥇', '🥈', '🥉'];
const STREAMERBOT = 'ws://127.0.0.1:8080/'; // la WebSocket de Streamer.bot, réglages d'origine (le chat YouTube)
const EVENEMENTS_YOUTUBE = ['Message', 'SuperChat', 'SuperSticker', 'NewSponsor', 'MembershipGift', 'NewSubscriber'];
// Les textes qui ont une variante YouTube (clé + 'YT' dans config.js)
const TEXTES_YOUTUBE = new Set(['liveAdresse', 'liveVoyageFin', 'liveMerciAbonne', 'liveChatAttente']);
// Ce que le chat écrit souvent autrement (les accents et les tirets sont déjà enlevés)
const VARIANTES = { 1: ['hokaido'], 13: ['tokio'], 26: ['kioto'], 28: ['hiogo'], 39: ['kouchi'], 44: ['ooita'] };
// Les faux spectateurs du mode essai (?live&essai)
const FAUX = ['sakura.dreams', 'mike_travels', 'yuki22', 'lea.paris', 'tokyo_nights', 'ramen_lover', 'kenji.o',
  'emma_jp', 'onsen_addict', 'hana_bi', 'lucas.trip', 'mochi_cat', 'fuji.view', 'nora_wanders'];

const sansAccents = (s) => String(s).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const LATIN = new Map(); // mot → numéro de préfecture
const JAPONAIS = []; // [nom, numéro], du plus long au plus court
for (const [c, p] of Object.entries(PREFECTURES)) {
  const code = Number(c);
  for (const m of [p.en, ...(VARIANTES[code] || [])]) LATIN.set(sansAccents(m), code);
  JAPONAIS.push([p.ja, code]);
  if (/[県府都]$/.test(p.ja)) JAPONAIS.push([p.ja.slice(0, -1), code]); // 京都府 → 京都, 東京都 → 東京
}
JAPONAIS.sort((a, b) => b[0].length - a[0].length);
const RE_JAPONAIS = new RegExp(JAPONAIS.map(([n]) => n).join('|'), 'u'); // le plus long d'abord : 東京都 n'est pas 京都

/** La première préfecture nommée dans un message du chat, ou null. */
export function prefectureDans(texte) {
  const s = String(texte || '').normalize('NFKC');
  for (const mot of sansAccents(s).split(/[^a-z]+/)) if (LATIN.has(mot)) return LATIN.get(mot);
  const m = s.match(RE_JAPONAIS);
  return m ? JAPONAIS.find(([n]) => n === m[0])[1] : null;
}

const attendre = (s) => new Promise((ok) => setTimeout(ok, s * 1000));
const hasard = (liste) => liste[Math.floor(Math.random() * liste.length)];
const raccourcir = (s, n = 18) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/**
 * outils : { t, enLangue, langue(), lieux(), infos(lieu) (« Temple · Nara »), photo(lieu), video(lieu),
 *   prefectures() (Promise : chaque lieu a sa .prefecture), preparerVol(depart, arrivee) (le relief du vol, d'avance),
 *   adresse, logo, orientation (degrés : le Japon debout dans l'écran vertical), essai (faux spectateurs),
 *   chat (adresse de TikFinity), musique (false : sans musique), sources(oui) (les sources de la carte, ouvertes),
 *   montrerLieux(oui) (les points des lieux sur la carte), manchesParVoyage (pour les essais : ?voyage=1, une pause voyage après chaque manche) }
 */
export function brancherLive(map, maplibregl, outils) {
  const { enLangue, lieux, infos, photo, video, prefectures, preparerVol, adresse, logo, orientation, essai } = outils;
  const parametres = new URLSearchParams(location.search);
  const youtube = parametres.has('youtube');
  // en live YouTube, les textes propres à TikTok prennent leur variante YouTube
  const t = (cle, ...args) => outils.t(youtube && TEXTES_YOUTUBE.has(cle) ? `${cle}YT` : cle, ...args);
  const adresseChat = youtube && !parametres.get('chat') ? STREAMERBOT : outils.chat;
  const lien = document.createElement('link');
  lien.rel = 'stylesheet';
  lien.href = 'live.css';
  document.head.append(lien);

  const racine = document.createElement('div');
  racine.className = 'live';
  racine.setAttribute('aria-hidden', 'true');
  const chrono = '<div class="live-chrono"><svg viewBox="0 0 100 100"><circle class="live-chrono-fond" cx="50" cy="50" r="44"/><circle class="live-chrono-arc" cx="50" cy="50" r="44" pathLength="100"/></svg><b></b></div>';
  racine.innerHTML = `
    <div class="live-boite">
      <header class="live-tete">
        ${logo ? `<img class="live-logo" alt="" src="${echapper(logo)}">` : ''}
        <div class="live-tete-textes"><b class="live-titre"></b><span class="live-adresse"></span><small class="live-musique"></small></div>
      </header>
      <section class="live-devine">
        <div class="live-cadre">
          <img class="live-fond" alt=""><img class="live-photo" alt="">
          <span class="live-manche"></span>
          ${chrono}
          <small class="live-credit"></small>
        </div>
        <p class="live-consigne"></p>
        <p class="live-indice"></p>
      </section>
      <section class="live-vote">
        <h2 class="live-vote-titre"></h2>
        <p class="live-vote-consigne"></p>
        ${chrono}
        <ol class="live-votes"></ol>
      </section>
      <section class="live-lieu">
        <p class="live-lieu-avant"></p>
        <div class="live-lieu-haut">
          <img class="live-lieu-photo" alt="">
          <span class="live-lieu-ja"></span>
          <div class="live-lieu-textes"><b class="live-lieu-nom"></b><small class="live-lieu-infos"></small></div>
        </div>
        <p class="live-trouveurs"></p>
        <p class="live-top"></p>
        <p class="live-suite"></p>
        <small class="live-lieu-credit"></small>
      </section>
      <ol class="live-fil"></ol>
      <p class="live-merci"></p>
      <p class="live-etat"></p>
    </div>`;
  document.body.append(racine);
  const $ = (s) => racine.querySelector(s);
  const el = {
    devine: $('.live-devine'), photo: $('.live-photo'), fond: $('.live-fond'), cadre: $('.live-cadre'),
    manche: $('.live-manche'), credit: $('.live-credit'), consigne: $('.live-consigne'), indice: $('.live-indice'),
    vote: $('.live-vote'), votes: $('.live-votes'), fil: $('.live-fil'), merci: $('.live-merci'), etat: $('.live-etat'),
    musique: $('.live-musique'), lieuPhoto: $('.live-lieu-photo'), lieuJa: $('.live-lieu-ja'), lieuNom: $('.live-lieu-nom'),
    lieuInfos: $('.live-lieu-infos'), lieuAvant: $('.live-lieu-avant'), trouveurs: $('.live-trouveurs'), top: $('.live-top'),
    suite: $('.live-suite'), lieuCredit: $('.live-lieu-credit'),
  };

  // ---- La place de l'écran : une colonne 9:16 au milieu (tout l'écran dans LIVE Studio), en unités de 1/1080
  let b = { x: 0, y: 0, u: 1 };
  function mesurer() {
    const u = Math.min(innerWidth / 1080, innerHeight / 1920);
    b = { u, x: (innerWidth - 1080 * u) / 2, y: (innerHeight - 1920 * u) / 2 };
    racine.style.setProperty('--u', `${u}px`);
    racine.style.setProperty('--x', `${b.x}px`);
    racine.style.setProperty('--y', `${b.y}px`);
  }
  mesurer();
  /** Une marge de la caméra, en pixels de l'écran, pour une bande de la colonne (de y1 à y2, sur 1920). */
  const bande = (y1, y2, gauche = 60, droite = gauche) => ({
    top: b.y + y1 * b.u, bottom: innerHeight - (b.y + y2 * b.u), left: b.x + gauche * b.u, right: b.x + droite * b.u,
  });

  // ---- La vue du Japon (calculée à cette inclinaison : cameraForBounds compte avec celle de la carte)
  let vue = null;
  function calculerVue() {
    const padding = bande(1010, 1860, 40, 300); // à droite, le fil des essais
    map.jumpTo({ pitch: PENTE, bearing: orientation, padding: { top: 0, bottom: 0, left: 0, right: 0 } });
    const c = map.cameraForBounds(JAPON, { padding, bearing: orientation, maxZoom: 7 });
    map.jumpTo({ center: c.center, zoom: c.zoom, padding });
    // le rectangle de JAPON, tourné, laisse beaucoup de mer : on resserre sur les bouts du Japon (trois fois, à cause
    // de la perspective)
    const largeur = innerWidth - padding.left - padding.right, hauteur = innerHeight - padding.top - padding.bottom;
    for (let k = 0; k < 3; k++) {
      const pts = BOUTS.map((p) => map.project(p));
      const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
      const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
      const echelle = Math.min(largeur / (x1 - x0), hauteur / (y1 - y0));
      map.jumpTo({ center: map.unproject([(x0 + x1) / 2, (y0 + y1) / 2]), zoom: Math.min(7, map.getZoom() + Math.log2(echelle) * 0.97) });
    }
    vue = { center: map.getCenter().toArray(), zoom: map.getZoom(), pitch: PENTE, bearing: orientation, padding };
  }
  let vueVieille = false;
  addEventListener('resize', () => {
    mesurer();
    if (etat && (etat.phase === 'devine' || etat.phase === 'vote')) { calculerVue(); map.jumpTo(vue); } else vueVieille = true;
  });

  let jetonVol = 0;
  function allerAuJapon(duree) {
    jetonVol++;
    map.stop();
    if (vueVieille) { calculerVue(); vueVieille = false; }
    map.flyTo({ ...vue, duration: duree, essential: true });
  }
  /** Le lieu dans la bande sous la carte du lieu, puis un lent tour autour. */
  function arrivee(l) {
    return { center: [l.lng, l.lat], zoom: 11.3, pitch: 58, bearing: vue.bearing + 30, padding: bande(860, 1380, 40) };
  }
  function volerVers(l, duree) {
    const jeton = ++jetonVol;
    const a = arrivee(l);
    map.stop();
    map.flyTo({ ...a, duration: 4600, essential: true });
    map.once('moveend', () => {
      if (jeton !== jetonVol) return;
      map.easeTo({ bearing: a.bearing + 40, duration: Math.max(2000, (duree - 4.6) * 1000 + 3000), easing: (x) => x, essential: true });
    });
  }

  // ---- La carte : les préfectures essayées (de froid à brûlant), les votes, la région de l'indice
  const centres = {}; // numéro → { lng, lat } : le centre du plus grand morceau de la préfecture
  const contours = fetch('data/prefectures.geojson').then((r) => r.json()).then((geo) => {
    for (const f of geo.features) {
      let meilleur = null, aire = 0;
      for (const poly of f.geometry.coordinates) {
        const anneau = poly[0];
        let a = 0, cx = 0, cy = 0;
        for (let i = 0, j = anneau.length - 1; i < anneau.length; j = i++) {
          const k = anneau[j][0] * anneau[i][1] - anneau[i][0] * anneau[j][1];
          a += k; cx += (anneau[j][0] + anneau[i][0]) * k; cy += (anneau[j][1] + anneau[i][1]) * k;
        }
        if (Math.abs(a) > aire) { aire = Math.abs(a); meilleur = { lng: cx / (3 * a), lat: cy / (3 * a) }; }
      }
      centres[f.properties.code] = meilleur;
    }
    const dessous = map.getLayer('modeles-3d') ? 'modeles-3d' : undefined;
    map.addSource(SOURCE, { type: 'geojson', data: geo, promoteId: 'code', maxzoom: 8 });
    map.addLayer({
      id: 'live-essais', type: 'fill', source: SOURCE,
      paint: {
        'fill-color': ['match', ['coalesce', ['feature-state', 'temp'], -1], 0, TEMPERATURES[0][2], 1, TEMPERATURES[1][2], 2, TEMPERATURES[2][2], 3, TEMPERATURES[3][2], 'rgba(0,0,0,0)'],
        'fill-opacity': ['case', ['>=', ['coalesce', ['feature-state', 'temp'], -1], 0], 0.62, 0],
      },
    }, dessous);
    map.addLayer({
      id: 'live-votes', type: 'fill', source: SOURCE,
      paint: { 'fill-color': '#a8321f', 'fill-opacity': ['interpolate', ['linear'], ['coalesce', ['feature-state', 'votes'], 0], 0, 0, 1, 0.22, 8, 0.62] },
    }, dessous);
    map.addLayer({
      id: 'live-indice', type: 'line', source: SOURCE, filter: ['in', ['get', 'code'], ['literal', []]],
      layout: { 'line-join': 'round' }, paint: { 'line-color': '#a8321f', 'line-width': 3, 'line-opacity': 0.9 },
    }, dessous);
  });
  function effacerCarte() {
    if (!map.getSource(SOURCE)) return;
    map.removeFeatureState({ source: SOURCE });
    map.setFilter('live-indice', ['in', ['get', 'code'], ['literal', []]]);
  }

  // ---- Les photos du jeu (comme jeu.js : celle du tableau, sinon une image de ses vidéos ou de Commons)
  const credits = fetch('data/photos-jeu.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  let lesCredits = {};
  function imageDe(l) {
    const c = lesCredits[video(l)];
    if (photo(l) && !c?.avantTableau) return { src: photo(l), credit: null };
    return c ? { src: `photos/jeu/${video(l)}.jpg`, credit: c.maVideo ? null : c } : null;
  }
  function chargerImage(src) {
    return new Promise((ok, non) => {
      const i = new Image();
      i.onload = () => (i.decode ? i.decode().catch(() => {}) : Promise.resolve()).then(() => ok(i));
      i.onerror = non;
      i.src = src;
      setTimeout(() => non(new Error('Image trop lente')), 8000);
    });
  }
  let sac = [], dernierePref = null;
  /** Un lieu au hasard, jamais deux fois avant d'avoir vu tous les autres, ni deux fois de suite la même préfecture. */
  function tirer() {
    if (!sac.length) sac = lieux().filter((l) => l.prefecture && imageDe(l)).sort(() => Math.random() - 0.5);
    let i = sac.findIndex((l) => l.prefecture !== dernierePref);
    if (i < 0) i = 0;
    const l = sac.splice(i, 1)[0];
    dernierePref = l?.prefecture;
    return l;
  }

  // ---- Le classement du live (le jour même : un rechargement de la page le garde)
  const jour = new Date().toLocaleDateString('sv');
  let joueurs = {};
  try {
    const m = JSON.parse(localStorage.getItem(MEMO));
    if (m?.jour === jour) joueurs = m.joueurs || {};
  } catch { /* pas grave */ }
  function ajouterPoints(id, nom, points) {
    const j = (joueurs[id] ??= { nom, points: 0, trouves: 0 });
    j.nom = nom;
    j.points += points;
    j.trouves++;
    try { localStorage.setItem(MEMO, JSON.stringify({ jour, joueurs })); } catch { /* pas grave */ }
  }
  const classement = () => Object.values(joueurs).sort((a, c) => c.points - a.points).slice(0, 5);

  // ---- Les textes fixes
  function textes() {
    $('.live-titre').textContent = t('liveTitre');
    $('.live-adresse').textContent = t('liveAdresse', adresse);
    el.consigne.innerHTML = t('liveConsigne', `<b>${echapper(t('livePrefecture'))}</b>`);
    $('.live-vote-titre').textContent = t('liveVoyageTitre');
    $('.live-vote-consigne').innerHTML = t('liveVoyageConsigne', `<b>${echapper(t('livePrefecture'))}</b>`);
  }
  textes();
  const nomPref = (code) => enLangue(PREFECTURES[code]);

  // ---- Le fil des essais et les mercis
  function ajouterAuFil(html, couleur) {
    const li = document.createElement('li');
    li.innerHTML = html;
    li.style.setProperty('--c', couleur);
    el.fil.prepend(li);
    while (el.fil.children.length > FIL) el.fil.lastElementChild.remove();
  }
  const mercis = [];
  let merciEnCours = false;
  function remercier(texte) {
    if (mercis.length < 6) mercis.push(texte);
    if (!merciEnCours) merciSuivant();
  }
  function merciSuivant() {
    const texte = mercis.shift();
    merciEnCours = !!texte;
    el.merci.classList.toggle('visible', !!texte);
    if (!texte) return;
    el.merci.textContent = texte;
    son('merci');
    setTimeout(() => { el.merci.classList.remove('visible'); setTimeout(merciSuivant, 450); }, 3800);
  }

  // ---- Les phases
  let etat = null; // { phase: 'devine' | 'revele' | 'vote' | 'voyage', … }
  const montrer = (phase) => { racine.dataset.phase = phase; };

  async function manche(n) {
    const l = tirer();
    if (!l) { await attendre(5); return; }
    const image = imageDe(l);
    const img = await chargerImage(image.src).catch(() => null);
    if (!img) return; // une autre
    const maintenant = performance.now();
    etat = {
      phase: 'devine', lieu: l, essais: new Map(), trouveurs: [], indice: false, tics: new Set(),
      debut: maintenant + ENTREE * 1000, fin: maintenant + (ENTREE + MANCHE) * 1000,
    };
    effacerCarte();
    el.fil.replaceChildren();
    el.photo.src = el.fond.src = image.src;
    const rp = img.naturalWidth / img.naturalHeight, rc = 600 / 480;
    el.cadre.classList.toggle('photo-pleine', Math.min(rp, rc) / Math.max(rp, rc) >= 0.78);
    el.manche.textContent = t('liveManche', n);
    el.credit.textContent = image.credit ? t('jeuPhotoLibre', image.credit.licence) : '';
    el.credit.hidden = !image.credit;
    el.indice.classList.remove('visible');
    el.indice.textContent = '';
    tic();
    montrer('devine');
    outils.montrerLieux?.(false); // les couleurs des essais se voient mieux sans les points des lieux
    allerAuJapon(2600);
    preparerVol?.({ ...vue }, arrivee(l)).catch(() => {});
    await attendre(ENTREE + MANCHE);

    etat.phase = 'revele';
    effacerCarte();
    outils.montrerLieux?.(true);
    const trouveurs = etat.trouveurs;
    el.lieuAvant.textContent = '';
    remplirLieu(l, image);
    el.trouveurs.innerHTML = trouveurs.length
      ? `${echapper(t('liveTrouvePar'))} ${trouveurs.slice(0, 3).map((x, i) => `<span>${MEDAILLES[i]} ${echapper(raccourcir(x.nom))} <i>+${x.points}</i></span>`).join(' ')}${trouveurs.length > 3 ? ` <span>${echapper(t('liveAutres', trouveurs.length - 3))}</span>` : ''}`
      : echapper(t('livePersonne'));
    const top = classement();
    el.top.innerHTML = top.length
      ? `<b>🏆 ${echapper(t('liveClassement'))}</b> ${top.map((j, i) => `<span>${i + 1}. ${echapper(raccourcir(j.nom, 14))} <i>${echapper(t('livePoints', j.points))}</i></span>`).join(' ')}`
      : '';
    el.top.hidden = !top.length;
    etat.suite = performance.now() + REVELE * 1000;
    tic();
    montrer('revele');
    son('revele');
    l.el?.classList.add('actif');
    volerVers(l, REVELE);
    await attendre(REVELE);
    l.el?.classList.remove('actif');
  }

  async function voyage() {
    const maintenant = performance.now();
    etat = { phase: 'vote', votes: new Map(), compte: new Map(), debut: maintenant, fin: maintenant + VOTE * 1000, tics: new Set() };
    effacerCarte();
    el.fil.replaceChildren();
    el.votes.replaceChildren();
    tic();
    montrer('vote');
    outils.montrerLieux?.(false);
    allerAuJapon(2600);
    await attendre(VOTE);

    let code = null, max = 0;
    for (const [c, n] of etat.compte) if (n > max) { max = n; code = c; } // à égalité, la première arrivée
    const avecPhoto = lieux().filter((l) => l.prefecture && imageDe(l));
    if (!code) code = hasard(avecPhoto).prefecture;
    const ici = avecPhoto.filter((l) => l.prefecture === code);
    let l, avant;
    if (ici.length) {
      l = hasard(ici);
      avant = t('liveDestination', nomPref(code));
    } else {
      const c = centres[code];
      l = avecPhoto.reduce((p, x) => (kmEntre(c, x) < kmEntre(c, p) ? x : p));
      avant = t('liveAucunLieu', nomPref(code));
    }
    etat.phase = 'voyage';
    effacerCarte();
    outils.montrerLieux?.(true);
    el.lieuAvant.textContent = avant;
    remplirLieu(l, imageDe(l));
    el.trouveurs.innerHTML = '';
    el.top.hidden = true;
    el.suite.textContent = t('liveVoyageFin');
    montrer('voyage');
    son('revele');
    l.el?.classList.add('actif');
    volerVers(l, VISITE);
    await attendre(VISITE);
    l.el?.classList.remove('actif');
  }

  /** La carte du lieu révélé : sa photo, son nom japonais en colonne, son nom, sa catégorie et sa préfecture. */
  function remplirLieu(l, image) {
    el.lieuPhoto.src = image?.src || '';
    el.lieuPhoto.hidden = !image;
    const autre = outils.langue() === 'ja' ? l.nom.en : l.nom.ja;
    el.lieuJa.textContent = autre || '';
    el.lieuJa.hidden = !autre;
    el.lieuJa.classList.toggle('latin', outils.langue() === 'ja');
    el.lieuNom.textContent = enLangue(l.nom);
    el.lieuInfos.textContent = infos(l);
    const c = image?.credit;
    el.lieuCredit.textContent = c ? t('jeuPhoto', c.auteur, c.licence) : '';
  }

  // ---- Le temps : le cercle, le flou de la photo, l'indice, les derniers tics
  function tic() {
    if (!etat) return;
    const maintenant = performance.now();
    if (etat.phase === 'devine' || etat.phase === 'vote') {
      const duree = etat.phase === 'devine' ? MANCHE : VOTE;
      const reste = Math.max(0, Math.min(duree, (etat.fin - maintenant) / 1000));
      const s = Math.ceil(reste);
      const boite = etat.phase === 'devine' ? el.devine : el.vote;
      boite.querySelector('.live-chrono b').textContent = s;
      boite.querySelector('.live-chrono-arc').style.strokeDashoffset = 100 - (reste / duree) * 100;
      boite.classList.toggle('presse', reste <= 10);
      boite.classList.toggle('urgent', reste <= 5 && reste > 0);
      if (reste <= 5 && reste > 0 && !etat.tics.has(s)) { etat.tics.add(s); son('tic'); }
      if (etat.phase === 'devine') {
        const f = reste / MANCHE;
        el.photo.style.filter = `blur(${((0.4 + FLOU_MAX * f ** 1.5) * b.u).toFixed(2)}px)`;
        if (reste <= INDICE && !etat.indice) montrerIndice();
      }
    } else if (etat.phase === 'revele' && etat.suite) {
      el.suite.textContent = t('liveSuivante', Math.max(1, Math.ceil((etat.suite - maintenant) / 1000)));
    }
  }
  setInterval(tic, 200);

  function montrerIndice(par) {
    if (!etat || etat.phase !== 'devine' || etat.indice) return;
    etat.indice = true;
    const r = regionDe(etat.lieu.prefecture);
    if (!r) return;
    // Hokkaidō est une région à lui seul : le dire donnerait la réponse
    const seule = r.prefectures.length === 1;
    const texte = t('liveIndice', seule ? t('liveIndiceNord') : enLangue(r.nom));
    el.indice.textContent = par ? `${texte} · ${t('liveIndiceOffert', par)}` : texte;
    el.indice.classList.add('visible');
    if (!seule && map.getLayer('live-indice')) map.setFilter('live-indice', ['in', ['get', 'code'], ['literal', r.prefectures]]);
    son('indice');
  }

  // ---- Le chat
  function surChat(id, nom, texte) {
    if (!etat) return;
    if (etat.phase === 'devine' && performance.now() > etat.debut - 800) deviner(id, nom, texte);
    else if (etat.phase === 'vote') voter(id, nom, texte);
  }

  /** Un essai : le premier message de chacun qui nomme une préfecture (un seul par manche). */
  function deviner(id, nom, texte) {
    if (etat.essais.has(id)) return;
    const code = prefectureDans(texte);
    if (!code) return;
    const l = etat.lieu;
    if (code === l.prefecture) {
      const points = POINTS[etat.trouveurs.length] ?? POINTS_SUITE;
      etat.trouveurs.push({ id, nom, points });
      etat.essais.set(id, { code });
      ajouterPoints(id, nom, points);
      ajouterAuFil(`<b>${echapper(raccourcir(nom))}</b> ${echapper(t('liveTrouve'))} <i>+${points}</i>`, VERT);
      son('trouve');
      return;
    }
    const km = centres[code] ? kmEntre(centres[code], l) : 9999;
    const i = TEMPERATURES.findIndex(([d]) => km > d);
    const [, cle, couleur, emoji] = TEMPERATURES[i];
    etat.essais.set(id, { code, temp: i });
    if (map.getSource(SOURCE)) map.setFeatureState({ source: SOURCE, id: code }, { temp: i });
    ajouterAuFil(`<b>${echapper(raccourcir(nom))}</b> ${echapper(nomPref(code))} <span>${emoji} ${echapper(t(cle))}</span>`, couleur);
    son('essai', i);
  }

  /** Un vote de la pause voyage : une préfecture par personne (son premier message qui en nomme une). */
  function voter(id, nom, texte) {
    if (etat.votes.has(id)) return;
    const code = prefectureDans(texte);
    if (!code) return;
    etat.votes.set(id, code);
    const n = (etat.compte.get(code) || 0) + 1;
    etat.compte.set(code, n);
    if (map.getSource(SOURCE)) map.setFeatureState({ source: SOURCE, id: code }, { votes: n });
    const tri = [...etat.compte].sort((a, c) => c[1] - a[1]).slice(0, 3);
    el.votes.innerHTML = tri.map(([c, k]) => `<li style="--part:${k / tri[0][1]}"><span>${echapper(nomPref(c))}</span><b>${echapper(t('liveVoix', k))}</b></li>`).join('');
    ajouterAuFil(`<b>${echapper(raccourcir(nom))}</b> ✈️ ${echapper(nomPref(code))}`, '#a8321f');
    son('essai', 2);
  }

  // ---- Les événements de TikFinity (au format de TikTok-Live-Connector, ancien ou nouveau)
  const qui = (d) => {
    const u = d.user || {};
    const id = String(d.uniqueId || u.uniqueId || d.userId || u.userId || '');
    return { id, nom: String(d.nickname || u.nickname || d.uniqueId || u.uniqueId || '?') };
  };
  function evenement(sorte, d = {}) {
    const { id, nom } = qui(d);
    if (sorte === 'chat') {
      if (id) surChat(id, nom, d.comment);
    } else if (sorte === 'follow') {
      remercier(t('liveMerciAbonne', raccourcir(nom)));
    } else if (sorte === 'share') {
      remercier(t('liveMerciPartage', raccourcir(nom)));
    } else if (sorte === 'gift') {
      const g = d.giftDetails || {};
      // un cadeau « en série » (des roses à la suite) envoie un événement à chaque fois : on attend la fin de la série
      if ((d.giftType ?? g.giftType) === 1 && d.repeatEnd === false) return;
      const n = Number(d.repeatCount) || 1;
      const nomCadeau = d.giftName || g.giftName || d.extendedGiftInfo?.name || '🎁';
      remercier(t('liveMerciCadeau', raccourcir(nom), n > 1 ? `${nomCadeau} ×${n}` : nomCadeau));
      if (etat?.phase === 'devine') montrerIndice(raccourcir(nom));
    } else if (sorte === 'membre') { // YouTube : un nouveau membre de la chaîne (ou des adhésions offertes)
      remercier(t('liveMerciMembreYT', raccourcir(nom)));
      if (etat?.phase === 'devine') montrerIndice(raccourcir(nom));
    }
  }

  /** Un événement YouTube de Streamer.bot, traduit dans les mots de TikFinity (Message → chat, Super Chat → cadeau…). */
  function evenementYouTube(type, d) {
    const u = d.user || {};
    const nom = String(u.name || d.userName || d.displayName || '?');
    const p = { uniqueId: String(u.id || d.userId || nom), nickname: nom };
    if (type === 'Message') evenement('chat', { ...p, comment: d.message ?? d.text ?? '' });
    else if (type === 'NewSubscriber') evenement('follow', p);
    else if (type === 'SuperChat' || type === 'SuperSticker') evenement('gift', { ...p, giftName: String(d.amount || d.amountDisplayString || 'Super Chat') });
    else if (type === 'NewSponsor' || type === 'MembershipGift') evenement('membre', p);
  }

  function brancherChat() {
    let essais = 0;
    function ouvrir() {
      let ws;
      try { ws = new WebSocket(adresseChat); } catch { etatChat(false); setTimeout(ouvrir, 5000); return; }
      ws.onopen = () => {
        essais = 0;
        // Streamer.bot n'envoie que les événements demandés
        if (youtube) ws.send(JSON.stringify({ request: 'Subscribe', id: 'live', events: { YouTube: EVENEMENTS_YOUTUBE } }));
        etatChat(true);
      };
      ws.onmessage = (m) => {
        let o;
        try { o = JSON.parse(m.data); } catch { return; }
        try {
          if (!youtube) evenement(o.event, o.data || {});
          else if (o.event?.source === 'YouTube' && o.data) evenementYouTube(o.event.type, o.data);
        } catch (e) { console.warn('Live :', e); }
      };
      ws.onclose = () => { etatChat(false); setTimeout(ouvrir, Math.min(10000, 1500 * ++essais)); };
    }
    ouvrir();
  }
  function etatChat(ok) {
    el.etat.textContent = essai ? t('liveEssai') : t(ok ? 'liveChatOk' : 'liveChatAttente');
    el.etat.classList.toggle('ok', ok || essai);
  }

  /** Le mode essai : de faux spectateurs qui devinent (de mieux en mieux), votent, s'abonnent, offrent des roses. */
  function fauxSpectateurs() {
    const codes = Object.keys(PREFECTURES).map(Number);
    const proches = (c) => codes.filter((x) => centres[x] && centres[c] && kmEntre(centres[x], centres[c]) < 250);
    (function suivant() {
      const nom = hasard(FAUX);
      if (etat?.phase === 'devine') {
        const p = etat.lieu.prefecture;
        const avance = 1 - Math.max(0, etat.fin - performance.now()) / (MANCHE * 1000);
        const r = Math.random();
        const code = r < 0.12 + avance * 0.3 ? p : r < 0.5 ? hasard(proches(p).length ? proches(p) : codes) : hasard(codes);
        const n = PREFECTURES[code];
        evenement('chat', { uniqueId: nom, nickname: nom, comment: Math.random() < 0.25 ? `is it ${n.en}?` : Math.random() < 0.15 ? n.ja : n.en });
      } else if (etat?.phase === 'vote') {
        evenement('chat', { uniqueId: nom, nickname: nom, comment: hasard(['Kyoto', 'Nara', 'Hokkaido', 'Okinawa', 'Nagano', 'Tottori', 'Kagoshima']) });
      } else evenement('chat', { uniqueId: nom, nickname: nom, comment: hasard(['wow', 'so beautiful 😍', 'hello from France', '🔥🔥']) });
      if (Math.random() < 0.025) evenement('follow', { uniqueId: nom, nickname: nom });
      if (Math.random() < 0.02) evenement('gift', { uniqueId: nom, nickname: nom, giftName: 'Rose', repeatCount: 1 + Math.floor(Math.random() * 5), repeatEnd: true, giftType: 1 });
      setTimeout(suivant, 350 + Math.random() * 1600);
    })();
  }

  // ---- Le son : la musique libre du lecteur (instrumentale), et de petits sons faits ici (Web Audio)
  const Contexte = window.AudioContext || window.webkitAudioContext;
  const ctx = Contexte ? new Contexte() : null;
  let dernierEssai = 0;
  function note(freq, debut, duree, volume, forme = 'sine') {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = forme;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, debut);
    g.gain.linearRampToValueAtTime(volume, debut + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, debut + duree);
    o.connect(g).connect(ctx.destination);
    o.start(debut);
    o.stop(debut + duree + 0.05);
  }
  function son(sorte, i = 0) {
    if (!ctx || ctx.state !== 'running') return;
    const m = ctx.currentTime;
    if (sorte === 'tic') note(1046, m, 0.09, 0.06, 'triangle');
    else if (sorte === 'essai') {
      if (m - dernierEssai < 0.12) return; // pas une rafale de bips quand le chat s'emballe
      dernierEssai = m;
      note([392, 494, 587, 698][i] || 494, m, 0.14, 0.035, 'triangle');
    } else if (sorte === 'trouve') { note(1318.5, m, 0.5, 0.09); note(1975.5, m + 0.07, 0.6, 0.06); }
    else if (sorte === 'indice') { note(659, m, 0.3, 0.06, 'triangle'); note(880, m + 0.12, 0.4, 0.05, 'triangle'); }
    else if (sorte === 'merci') { note(784, m, 0.35, 0.05); note(1046, m + 0.1, 0.5, 0.05); }
    else if (sorte === 'revele') { note(196, m, 2.4, 0.12); note(293.7, m + 0.02, 2.2, 0.07); note(392, m + 0.04, 2, 0.05); note(1568, m + 0.05, 0.9, 0.025); }
  }
  const audio = new Audio();
  audio.volume = 0.3;
  let morceaux = [], auteurs = {}, rang = 0;
  function morceauSuivant() {
    if (!morceaux.length) return;
    const m = morceaux[rang++ % morceaux.length];
    audio.src = m.fichier;
    const a = auteurs[m.auteur];
    el.musique.textContent = `♪ ${m.titre} · ${a?.nom || ''}${a?.licence ? ` (${a.licence})` : ''}`;
    audio.play().catch(() => {});
  }
  audio.addEventListener('ended', morceauSuivant);
  audio.addEventListener('error', () => setTimeout(morceauSuivant, 1000));
  if (outils.musique !== false) {
    fetch('data/musique.json').then((r) => r.json()).then((d) => {
      auteurs = d.auteurs || {};
      morceaux = (d.morceaux || []).filter((m) => !m.voix).sort(() => Math.random() - 0.5);
      morceauSuivant();
    }).catch(() => {});
  }
  // Un navigateur peut refuser le son tant qu'on n'a pas cliqué sur la page : un clic le débloque.
  function debloquer() {
    ctx?.resume().catch(() => {});
    if (outils.musique !== false && audio.paused && audio.src) audio.play().catch(() => {});
  }
  addEventListener('pointerdown', debloquer);
  addEventListener('keydown', debloquer);
  debloquer();

  // ---- C'est parti
  outils.sources?.(true);
  etatChat(false);
  const pret = Promise.all([contours, credits.then((c) => { lesCredits = c; }), prefectures()]);
  (async () => {
    await pret;
    calculerVue();
    map.jumpTo(vue);
    if (essai) fauxSpectateurs();
    else brancherChat();
    for (let n = 1; ; n++) {
      try { await manche(n); } catch (e) { console.warn('Live, manche :', e); await attendre(3); }
      if (n % (outils.manchesParVoyage || MANCHES_PAR_VOYAGE) === 0) {
        try { await voyage(); } catch (e) { console.warn('Live, voyage :', e); await attendre(3); }
      }
    }
  })().catch((e) => console.error('Live :', e));

  // pour la console et les essais : window.live.chat('pseudo', 'Kyoto'), window.live.evenement('follow', {…})
  return { chat: (nom, texte) => evenement('chat', { uniqueId: nom, nickname: nom, comment: texte }), evenement, etat: () => etat };
}
