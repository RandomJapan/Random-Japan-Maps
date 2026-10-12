// ================================================================
//  L'ambiance de la carte selon le moment au Japon (2026-10-12, choix du
//  propriétaire sur des exemples : « complète », automatique, avec l'heure du Japon).
//  - Le jour, le lever ou le coucher du soleil et la nuit suivent l'heure réelle
//    au Japon : la hauteur du soleil au centre de Honshū. La nuit, la mer et le
//    relief bleuissent et les lieux s'allument comme des lanternes. Un
//    interrupteur jour/nuit, à côté de l'heure, montre l'autre moment.
//  - La saison suit la date au Japon : le relief verdit au printemps et en été,
//    roussit en automne, la neige descend sur les montagnes l'hiver (et reste
//    sur le Fuji jusqu'en juin). Les détails de saison sont peints sur la carte
//    (saisons-carte.js) ; de près, des pétales, des lucioles (les nuits de juin),
//    des feux d'artifice (l'été), des feuilles ou des flocons tombent (particules.js).
//  Les couleurs de la carte ne changent que par paliers, au plus quelques fois
//  par heure au crépuscule : chaque changement redessine tout le relief (une fois).
//  Pour les essais : ?heure=21:30, ?date=2026-04-05 (ou ?mois=4) fixent le moment ;
//  ?ambiance=non garde la carte de toujours (jour, sans saison : les films promo).
//  En mode développeur, un réglage sous l'heure choisit la date et l'heure.
// ================================================================

import { CONFIG } from './config.js';
import { TEINTES } from './teintes.js';
import { MOIS, jourDeLAn, dateDuJour } from './phenologie.js';
import { creerParticules, animerParticules } from './particules.js';
import { brancherDetailsSaison, styleSaison } from './saisons-carte.js';

const CENTRE = { lng: 137.5, lat: 36 }; // le soleil est calculé au centre de Honshū
const FUSEAU = 'Asia/Tokyo';
const VERIFIER = 60000; // ms : on regarde l'heure chaque minute ; la carte ne change que si le palier change
const ZOOM_PARTICULES = 7.2; // de loin, rien ne tombe (2026-10-12) : seulement quand on zoome sur une région

// La rampe du relief (la même que dans app.js avant les saisons), et des paliers plus serrés pour la neige
const RAMPE = [[2, '#e3d0a7'], [60, '#dcc59a'], [200, '#d1b68a'], [500, '#c4a47a'], [900, '#bc9b72'],
  [1500, '#a8865f'], [2200, '#8f6f50'], [2900, '#a8977f'], [3500, '#efe7d6']];
const PALIERS = [2, 60, 200, 350, 500, 700, 900, 1200, 1500, 1850, 2200, 2550, 2900, 3200, 3500];

// Les couleurs de la carte : [jour, coucher, lever, nuit]
const COULEURS = {
  mer: [CONFIG.couleurs.mer, '#7f9ea3', '#8aa6ab', '#203b45'],
  eau: ['#3d6b64', '#3b5f63', '#3e6266', '#7aa3a6'],
  ombreIles: ['#2c4a43', '#3a2c3a', '#3a3340', '#060d12'],
  encreCote: ['#4e3822', '#4a2e22', '#4a3428', '#0e171e'],
  frontieres: ['#35251a', '#35251a', '#35251a', '#b9c4d6'],
  frontieresFond: ['#f6eedb', '#f3dcc0', '#f3e0d6', '#0d1522'],
  ciel: [CONFIG.couleurs.ciel, '#eeb08c', '#e7b7ad', '#121a2e'],
  horizon: [CONFIG.couleurs.horizon, '#f5d2a2', '#f1d5c4', '#2b3b58'],
  brume: [CONFIG.couleurs.brume, '#e7bea4', '#d9c3c2', '#1d2c40'],
};
const OMBRAGE = { // ombres, lumières, accents du relief : [r, g, b, a]
  ombre: [[70, 45, 24, 0.82], [70, 30, 45, 0.86], [62, 36, 58, 0.84], [6, 10, 24, 0.88]],
  lumiere: [[255, 249, 232, 0.55], [255, 196, 140, 0.62], [255, 206, 196, 0.58], [190, 210, 255, 0.3]],
  accent: [[96, 66, 38, 0.45], [90, 40, 50, 0.45], [80, 50, 70, 0.45], [10, 18, 40, 0.5]],
};

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgb = (c) => `rgb(${c.map((v) => Math.round(Math.max(0, Math.min(255, v)))).join(',')})`;
const rgba = (c) => `rgba(${c.slice(0, 3).map((v) => Math.round(Math.max(0, Math.min(255, v)))).join(',')},${c[3].toFixed(3)})`;
const mel = (a, b, f) => a.map((v, i) => v + (b[i] - v) * f);
const borne = (x) => Math.max(0, Math.min(1, x));
const lisse = (a, b, x) => { const t = borne((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------- Le moment au Japon
/** La hauteur du soleil (degrés) et s'il est avant midi, à cette date, en ce point (formules approchées, ~0,5°). */
function soleil(date, { lng, lat }) {
  const r = Math.PI / 180;
  const j = date.getTime() / 86400000 - 10957.5; // jours depuis le 1er janvier 2000 à midi (UTC)
  const g = (357.529 + 0.98560028 * j) * r;
  const q = 280.459 + 0.98564736 * j;
  const l = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * r;
  const e = (23.439 - 0.00000036 * j) * r;
  const ad = Math.atan2(Math.cos(e) * Math.sin(l), Math.cos(l));
  const dec = Math.asin(Math.sin(e) * Math.sin(l));
  const temps = ((18.697374558 + 24.06570982441908 * j) % 24) * 15 * r;
  const angle = temps + lng * r - ad; // angle horaire
  const hauteur = Math.asin(Math.sin(lat * r) * Math.sin(dec) + Math.cos(lat * r) * Math.cos(dec) * Math.cos(angle)) / r;
  return { hauteur, matin: Math.sin(angle) < 0 }; // avant midi, le soleil est à l'est (angle horaire négatif)
}

/** Une date (heure du Japon = UTC + 9). */
const dateJapon = (annee, mois, jour, heure, minute) => new Date(Date.UTC(annee, mois - 1, jour, heure - 9, minute));

/** Le moment fixé par l'adresse pour les essais (?heure=21:30, ?date=2026-04-05, ?mois=4), sinon maintenant. */
function lireMoment() {
  const p = new URLSearchParams(location.search);
  const heure = p.get('heure')?.match(/^(\d{1,2})[:h.]?(\d{2})?$/);
  const date = p.get('date')?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const mois = Number(p.get('mois'));
  return {
    classique: p.get('ambiance') === 'non',
    fixe: heure || date || (mois >= 1 && mois <= 12) ? () => {
      const maintenant = partiesJapon(new Date());
      const [a, m, jr] = date ? [+date[1], +date[2], +date[3]] : [maintenant.annee, mois || maintenant.mois, mois ? 15 : maintenant.jour];
      const [h, mn] = heure ? [+heure[1], +(heure[2] || 0)] : [maintenant.heure, maintenant.minute];
      return dateJapon(a, m, jr, h, mn);
    } : null,
  };
}

const formatParties = new Intl.DateTimeFormat('en-GB', {
  timeZone: FUSEAU, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
});
function partiesJapon(date) {
  const p = Object.fromEntries(formatParties.formatToParts(date).map((x) => [x.type, Number(x.value)]));
  return { annee: p.year, mois: p.month, jour: p.day, heure: p.hour, minute: p.minute };
}

/** Le moment : les poids du coucher (ou lever) et de la nuit, la saison du jour, la sorte de particules. */
export function moment(date) {
  const { hauteur, matin } = soleil(date, CENTRE);
  const nuit = lisse(-1, -9, hauteur);
  const soir = lisse(9, 0, hauteur) * (1 - nuit);
  const j = partiesJapon(date);
  // la saison : entre les valeurs du 15 de ce mois et du mois voisin
  const avant = j.jour < 15;
  const voisin = ((j.mois + (avant ? -2 : 0) + 12) % 12) + 1;
  const f = avant ? (15 - j.jour) / 30 : (j.jour - 15) / 30;
  const saison = mel(MOIS[j.mois], MOIS[voisin], f);
  const md = j.mois * 100 + j.jour;
  const particules = md >= 322 && md <= 506 ? 'petales'
    : md >= 601 && md <= 710 ? 'lucioles'
      : md >= 711 && md <= 831 ? 'hanabi'
        : md >= 1010 && md <= 1205 ? 'feuilles'
          : md >= 1206 || md <= 315 ? 'neige' : null;
  return { date, hauteur, matin, soir, nuit, saison, particules, jour: j };
}

// ---------------------------------------------------------------- La palette
/** La saison sur le relief : verdure, couleurs d'automne et neige selon l'altitude. */
function saisonRelief(c, h, m) {
  const [printemps, ete, automne, neige] = m.saison;
  if (printemps && h > 40 && h < 1300) c = mel(c, [178, 186, 120], printemps * Math.min(1, (1300 - h) / 600));
  if (ete && h > 20 && h < 1800) c = mel(c, [126, 150, 86], ete * Math.min(1, (1800 - h) / 700));
  if (automne && h > 120 && h < 2000) c = mel(c, [190, 100, 52], automne * Math.min(1, (h - 120) / 300, (2000 - h) / 600));
  const blanc = lisse(neige - 200, neige + 900, h) * 0.95;
  if (blanc > 0) c = mel(c, [246, 244, 240], blanc);
  return c;
}

/** La lumière du moment sur une couleur du relief : dorée au coucher, rosée au lever, bleue la nuit. */
function lumiereRelief(c, h, m) {
  const crep = m.matin
    ? mel([c[0] * 1.0, c[1] * 0.86, c[2] * 0.8], [255, 200, 190], 0.06 + 0.14 * borne((h - 400) / 1200))
    : mel([c[0] * 1.04, c[1] * 0.84, c[2] * 0.7], [255, 190, 140], 0.08 + 0.17 * borne((h - 400) / 1200));
  const sombre = mel([c[0] * 0.36, c[1] * 0.42, c[2] * 0.58], [70, 80, 110], 0.15);
  return c.map((v, i) => v * (1 - m.soir - m.nuit) + crep[i] * m.soir + sombre[i] * m.nuit);
}

/** Le relief d'une couleur à une altitude : la saison, puis la lumière du moment. */
const teinteRelief = (c, h, m) => lumiereRelief(saisonRelief(c, h, m), h, m);

function couleurRampe(h) {
  for (let i = 1; i < RAMPE.length; i++) {
    if (h <= RAMPE[i][0]) return mel(hex(RAMPE[i - 1][1]), hex(RAMPE[i][1]), (h - RAMPE[i - 1][0]) / (RAMPE[i][0] - RAMPE[i - 1][0]));
  }
  return hex(RAMPE[RAMPE.length - 1][1]);
}

/** Une couleur du moment entre ses valeurs de jour, de coucher (ou de lever) et de nuit. */
function melange(valeurs, m) {
  const [jour, coucher, lever, nuit] = valeurs.map((v) => (typeof v === 'string' ? hex(v) : v));
  const crep = m.matin ? lever : coucher;
  return jour.map((v, i) => v * (1 - m.soir - m.nuit) + crep[i] * m.soir + nuit[i] * m.nuit);
}

/** Toutes les couleurs de la carte pour ce moment. */
export function palette(m) {
  const sable = teinteRelief(hex('#e3d0a7'), 2, m);
  const transparent = `rgba(${sable.map(Math.round).join(',')},0)`;
  // La mer vaut 0 m pile : pas de palier à moins d'un mètre de 0 (voir app.js et CLAUDE.md, float16 des téléphones).
  const rampe = ['interpolate', ['linear'], ['elevation'], -2.5, rgb(sable), -1.2, transparent, 0.6, transparent,
    ...PALIERS.flatMap((h) => [h, rgb(teinteRelief(couleurRampe(h), h, m))])];
  const neigeForte = borne((1600 - m.saison[3]) / 1000) * (1 - m.nuit);
  const ombrage = Object.fromEntries(Object.entries(OMBRAGE).map(([k, v]) => [k, melange(v, m)]));
  ombrage.lumiere = mel(ombrage.lumiere, [255, 255, 255, 0.7], neigeForte * 0.8);
  ombrage.ombre = mel(ombrage.ombre, [60, 50, 52, 0.8], neigeForte * 0.6);
  // la lumière vient d'en haut à gauche le jour (nord-ouest), de l'ouest au coucher, du nord-est au lever
  const angles = [[315, 1 - m.soir - m.nuit], [m.matin ? 60 : 285, m.soir], [315, m.nuit]];
  const x = angles.reduce((s, [a, w]) => s + Math.cos((a * Math.PI) / 180) * w, 0);
  const y = angles.reduce((s, [a, w]) => s + Math.sin((a * Math.PI) / 180) * w, 0);
  const c = Object.fromEntries(Object.entries(COULEURS).map(([k, v]) => [k, rgb(melange(v, m))]));
  return {
    ...c,
    rampe,
    ombre: rgba(ombrage.ombre), lumiere: rgba(ombrage.lumiere), accent: rgba(ombrage.accent),
    direction: Math.round((((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360),
    exag: 0.9 + 0.1 * m.soir - 0.05 * m.nuit,
    papier: 1 - 0.2 * m.soir - 0.72 * m.nuit,
    eauGL: melange(COULEURS.eau, m),
    ecumeGL: mel([246, 238, 219], [200, 214, 222], m.nuit),
    lumiere3d: 1 - 0.1 * m.soir - 0.5 * m.nuit,
    lavis: 0.6 * (1 - 0.55 * m.nuit), // les liserés d'aquarelle des régions, moins vifs la nuit
    nuit: m.nuit,
    neigeSol: rgb(lumiereRelief([246, 244, 240], 300, m)), // la neige au sol du nord (saisons-carte.js)
    glace: rgb(lumiereRelief([221, 233, 235], 0, m)), // les lacs gelés et la banquise
  };
}

// ---------------------------------------------------------------- Brancher sur la carte
const ICONES = {
  jour: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.6" fill="currentColor"/><path stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>',
  crepuscule: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.8 16a5.2 5.2 0 0 1 10.4 0Z"/><path stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M2.5 16h19M12 5.5v2.2M4.6 9.2l1.6 1.4M19.4 9.2l-1.6 1.4M6 19.5h12"/></svg>',
  nuit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.5 14.6A8 8 0 0 1 9.4 4.5a8 8 0 1 0 10.1 10.1Z"/></svg>',
  reglage: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2.2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="8" cy="17" r="2.2" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
};
// Les raccourcis du réglage (mode développeur) : un jour typique de chaque saison
const RACCOURCIS = [['🌸', 95], ['🌿', 135], ['🌻', 206], ['🍁', 324], ['❄️', 36], ['🧊', 52]];

/**
 * Prépare l'ambiance avant la carte (sa palette sert au style de départ : pas de relief redessiné au chargement),
 * puis la branche quand la carte existe.
 */
export function preparerAmbiance() {
  const reglage = lireMoment();
  const fixeAdresse = reglage.fixe;
  const maintenant = () => (reglage.fixe ? reglage.fixe() : new Date());
  const jourClassique = { soir: 0, nuit: 0, matin: false, saison: [0, 0, 0, 99999], particules: null };
  const m0 = reglage.classique ? jourClassique : moment(maintenant());
  const arrondi = (m) => ({ ...m, soir: Math.round(m.soir * 10) / 10, nuit: Math.round(m.nuit * 10) / 10 });
  const P0 = palette(arrondi(m0));
  const jDepart = reglage.classique ? null : jourDeLAn(m0.jour.mois, m0.jour.jour);

  /**
   * @param deps - { t(cle, …), langue(), lieux() }
   * @returns { majLangue(), majLieux(), jourPourImage(), reel() }
   */
  function brancher(map, deps) {
    const rien = () => {};
    if (reglage.classique) return { majLangue: rien, majLieux: rien, jourPourImage: () => rien, reel: rien };
    const sansMouvement = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let reel = m0; // le moment au Japon (ou celui fixé par l'adresse ou le réglage)
    let m = m0; // le moment montré : le réel, ou le jour ou la nuit choisis avec l'interrupteur
    let force = null; // 'jour' | 'nuit' : choisi avec l'interrupteur ; null : l'heure du Japon
    let cle = '', particules;
    const details = brancherDetailsSaison(map, { lieux: deps.lieux }, jDepart);

    // L'horloge : l'interrupteur jour/nuit, l'heure au Japon, et (mode développeur) le réglage de la date
    const horloge = document.createElement('div');
    horloge.className = 'heure-japon panneau';
    horloge.innerHTML = `<button type="button" class="jour-nuit" role="switch"><span class="jn-piste" aria-hidden="true">${ICONES.jour}${ICONES.nuit}<span class="jn-curseur"></span></span></button>`
      + '<span class="heure-textes" role="status"></span>'
      + `<button type="button" class="heure-reglage dev" aria-expanded="false">${ICONES.reglage}</button>`
      + '<div class="reglage-ambiance panneau dev" hidden></div>';
    document.querySelector('.controles').prepend(horloge);
    const [interrupteur, textes, boutonReglage, reglageDev] = horloge.children;

    // Les particules de la saison : sous les repères, au-dessus du relief et du papier
    const saison = document.createElement('div');
    saison.className = 'saison';
    saison.setAttribute('aria-hidden', 'true');
    const papier = document.getElementById('papier');
    papier.after(saison);
    // Dès que la carte bouge, elles s'effacent (mesuré le 2026-10-12 sur un téléphone moyen simulé : un quart
    // d'images par seconde en moins quand elles tombent sur une carte qui se déplace). De loin (la lente rotation
    // du départ), elles sont déjà cachées.
    // Cachées, elles sont aussi arrêtées (animerParticules).
    const cachees = () => saison.classList.contains('repos') || saison.classList.contains('loin');
    let arretees = false;
    const majAnimation = () => {
      if (cachees() === arretees) return;
      arretees = cachees();
      animerParticules(saison, !arretees);
    };
    map.on('movestart', () => { saison.classList.add('repos'); majAnimation(); });
    map.on('moveend', () => { saison.classList.remove('repos'); majAnimation(); });
    // De loin, rien ne tombe : seulement quand on zoome sur une région
    const majLoin = () => {
      const z = map.getZoom();
      if (z < ZOOM_PARTICULES - 0.2) saison.classList.add('loin');
      else if (z >= ZOOM_PARTICULES) saison.classList.remove('loin');
      majAnimation();
    };
    map.on('zoom', majLoin);
    majLoin();

    function appliquer(p) {
      for (const id of ['voisins', 'large', 'lacs']) map.setPaintProperty(id, 'fill-color', p.mer);
      map.setPaintProperty('fond', 'background-color', p.mer);
      for (const id of ['voisins-contour', 'rivieres']) map.setPaintProperty(id, 'line-color', p.mer);
      for (const id of ['lignes-eau-1', 'lignes-eau-2', 'lignes-eau-3', 'rivieres-bord', 'lacs-bord']) map.setPaintProperty(id, 'line-color', p.eau);
      map.setPaintProperty('cote-ombre', 'line-color', p.ombreIles);
      map.setPaintProperty('cote-encre', 'line-color', p.encreCote);
      map.setPaintProperty('couleurs-relief', 'color-relief-color', p.rampe);
      map.setPaintProperty('ombrage', 'hillshade-shadow-color', p.ombre);
      map.setPaintProperty('ombrage', 'hillshade-highlight-color', p.lumiere);
      map.setPaintProperty('ombrage', 'hillshade-accent-color', p.accent);
      map.setPaintProperty('ombrage', 'hillshade-illumination-direction', p.direction);
      map.setPaintProperty('ombrage', 'hillshade-exaggeration', p.exag);
      for (const id of ['frontieres-prefectures', 'frontieres-regions']) map.setPaintProperty(id, 'line-color', p.frontieres);
      map.setPaintProperty('frontieres-prefectures-fond', 'line-color', p.frontieresFond);
      for (const id of ['lavis-g', 'lavis-d']) map.setPaintProperty(id, 'line-opacity', p.lavis);
      map.setSky({ ...map.getSky(), 'sky-color': p.ciel, 'horizon-color': p.horizon, 'fog-color': p.brume });
    }

    /** Ce que lisent les couches en WebGL, le papier, les lanternes : à chaque palier, sans redessiner le relief. */
    function teintesHorsCarte(p) {
      TEINTES.eau = p.eauGL;
      TEINTES.ecume = p.ecumeGL;
      TEINTES.lumiere = p.lumiere3d;
      TEINTES.nuit = p.nuit;
      TEINTES.jour = jourDeLAn(m.jour.mois, m.jour.jour);
      papier.style.opacity = p.papier.toFixed(2);
      document.body.classList.toggle('nuit', m.nuit >= 0.5);
      map.triggerRepaint();
    }

    function phaseDe(x) {
      return x.nuit >= 0.5 ? 'nuit' : x.soir >= 0.35 ? (x.matin ? 'lever' : 'coucher') : 'jour';
    }

    function majHorloge() {
      const date = maintenant();
      const lang = deps.langue();
      const heure = new Intl.DateTimeFormat(lang, { timeZone: FUSEAU, hour: lang === 'en' ? 'numeric' : '2-digit', minute: '2-digit' }).format(date);
      const phase = phaseDe(reel); // l'heure et le moment réels au Japon…
      const vue = phaseDe(m); // … et ce que montre la carte
      const [avant, apres] = deps.t('heureJapon');
      horloge.dataset.phase = phase;
      horloge.dataset.vue = vue === 'nuit' ? 'nuit' : vue === 'jour' ? 'jour' : 'crepuscule';
      horloge.classList.toggle('force', !!force);
      textes.innerHTML = `<span>${avant}<b>${heure}</b>${apres}</span><small>${deps.t(`moment_${phase}`)}</small>`;
      textes.setAttribute('aria-label', `${avant}${heure}${apres} · ${deps.t(`moment_${phase}`)}`);
      interrupteur.querySelector('.jn-curseur').innerHTML = ICONES[horloge.dataset.vue];
      interrupteur.setAttribute('aria-checked', String(vue === 'nuit'));
      interrupteur.setAttribute('aria-label', deps.t('jourNuit'));
      interrupteur.title = deps.t(vue === 'nuit' ? 'voirJour' : 'voirNuit');
      boutonReglage.setAttribute('aria-label', deps.t('reglageTitre'));
      boutonReglage.title = deps.t('reglageTitre');
      if (!reglageDev.hidden) remplirReglage();
    }

    /** Les particules de la saison (rien sous « réduire les animations »). Lucioles et feux d'artifice : la nuit seulement. */
    function majParticules() {
      const deNuit = m.particules === 'lucioles' || m.particules === 'hanabi';
      const sorte = sansMouvement || (deNuit && m.nuit < 0.5) ? null : m.particules;
      if (sorte === particules) return;
      particules = sorte;
      saison.replaceChildren(...(sorte ? creerParticules(sorte) : []));
      saison.dataset.sorte = sorte || '';
      if (arretees) animerParticules(saison, false); // les nouvelles aussi, si elles sont cachées
    }

    function verifier() {
      if (document.hidden) return;
      reel = moment(maintenant());
      // le choix de l'interrupteur s'efface quand l'heure du Japon le rejoint (la nuit tombe, le jour se lève)
      if (force && (force === 'nuit') === (reel.nuit >= 0.5)) force = null;
      m = force ? { ...reel, soir: 0, nuit: force === 'nuit' ? 1 : 0 } : reel;
      // des paliers : un dixième de coucher ou de nuit, un jour de saison
      const nouvelle = [Math.round(m.soir * 10), Math.round(m.nuit * 10), m.matin, m.jour.mois, m.jour.jour].join('|');
      if (nouvelle !== cle) {
        const premier = !cle;
        cle = nouvelle;
        const p = palette(arrondi(m));
        if (!premier) appliquer(p); // au départ, le style de la carte a déjà ces couleurs
        teintesHorsCarte(p);
        details.maj(jourDeLAn(m.jour.mois, m.jour.jour), p);
      }
      majHorloge();
      majParticules();
    }

    // L'interrupteur : montre l'autre moment (le jour quand il fait nuit au Japon, la nuit sinon) ; un second
    // appui revient à l'heure du Japon (qui garde son coucher de soleil, s'il y en a un).
    interrupteur.addEventListener('click', () => {
      const voulu = m.nuit >= 0.5 ? 'jour' : 'nuit';
      force = (voulu === 'nuit') === (reel.nuit >= 0.5) ? null : voulu;
      verifier();
    });

    // ---- Le réglage du mode développeur : la date et l'heure, pour voir chaque saison
    let attente = 0;
    function fixer(jourAn, heureDecimale) {
      const { mois, jour } = dateDuJour(jourAn);
      const annee = partiesJapon(new Date()).annee;
      const h = Math.floor(heureDecimale), mn = Math.round((heureDecimale - h) * 60);
      reglage.fixe = () => dateJapon(annee, mois, jour, h, mn);
      force = null;
    }
    function remplirReglage() {
      const lang = deps.langue();
      const j = jourDeLAn(reel.jour.mois, reel.jour.jour);
      const heure = reel.jour.heure + reel.jour.minute / 60;
      const nomJour = (n) => { const d = dateDuJour(n); return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(Date.UTC(2026, d.mois - 1, d.jour)); };
      const champ = reglageDev.querySelector('[data-date]');
      if (champ && document.activeElement?.closest('.reglage-ambiance')) return; // on ne bouge pas un curseur qu'on tient
      reglageDev.innerHTML = `<p class="reglage-titre">${deps.t('reglageTitre')}</p>`
        + `<div class="reglage-raccourcis">${RACCOURCIS.map(([icone, n]) => `<button type="button" data-jour="${n}" title="${nomJour(n)}">${icone}</button>`).join('')}</div>`
        + `<label>${deps.t('reglageDate')} <output>${nomJour(j)}</output><input type="range" min="1" max="365" step="1" value="${j}" data-date></label>`
        + `<label>${deps.t('reglageHeure')} <output>${String(Math.floor(heure)).padStart(2, '0')}:${String(Math.round((heure % 1) * 60)).padStart(2, '0')}</output>`
        + `<input type="range" min="0" max="23.75" step="0.25" value="${(Math.round(heure * 4) / 4).toFixed(2)}" data-heure></label>`
        + `<button type="button" class="reglage-reel" data-reel>${deps.t('reglageReel')}</button>`;
    }
    boutonReglage.addEventListener('click', () => {
      reglageDev.hidden = !reglageDev.hidden;
      boutonReglage.setAttribute('aria-expanded', String(!reglageDev.hidden));
      if (!reglageDev.hidden) remplirReglage();
    });
    reglageDev.addEventListener('input', (e) => {
      const date = reglageDev.querySelector('[data-date]'), heure = reglageDev.querySelector('[data-heure]');
      if (!date || !heure) return;
      const lang = deps.langue();
      const d = dateDuJour(+date.value);
      date.previousElementSibling.value = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(Date.UTC(2026, d.mois - 1, d.jour));
      const h = +heure.value;
      heure.previousElementSibling.value = `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;
      clearTimeout(attente);
      attente = setTimeout(() => { fixer(+date.value, h); verifier(); }, e.target === heure ? 60 : 160);
    });
    reglageDev.addEventListener('click', (e) => {
      const bouton = e.target.closest('button');
      if (!bouton) return;
      if (bouton.dataset.jour) fixer(+bouton.dataset.jour, reel.jour.heure + reel.jour.minute / 60);
      else if (bouton.hasAttribute('data-reel')) { reglage.fixe = fixeAdresse; force = null; }
      verifier();
      bouton.blur();
      remplirReglage();
    });

    verifier();
    setInterval(verifier, VERIFIER);
    document.addEventListener('visibilitychange', verifier);
    // pour les essais : (await import('/ambiance.js')).essayerMoment('2026-10-12T22:00') (heure du Japon)
    essai = (texte) => {
      const [, a, mo, j, h, mn] = texte.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/).map(Number);
      reglage.fixe = () => dateJapon(a, mo, j, h, mn);
      force = null;
      verifier();
    };
    /**
     * Pour la capture de l'image d'un voyage (partage-voyage.js) : la carte de jour, avec la saison du moment.
     * Renvoie la fonction qui remet les couleurs du moment.
     */
    function jourPourImage() {
      const p = palette({ ...m, soir: 0, nuit: 0 });
      appliquer(p);
      Object.assign(TEINTES, { eau: p.eauGL, ecume: p.ecumeGL, lumiere: p.lumiere3d, nuit: 0 });
      return () => {
        const q = palette(arrondi(m));
        appliquer(q);
        teintesHorsCarte(q);
      };
    }

    return {
      majLangue: majHorloge,
      majLieux: details.majLieux,
      jourPourImage,
      /** Revient au vrai moment (en quittant le mode développeur). */
      reel() {
        if (reglage.fixe === fixeAdresse && !force) return;
        reglage.fixe = fixeAdresse;
        force = null;
        reglageDev.hidden = true;
        verifier();
      },
    };
  }

  return {
    palette: P0,
    brancher,
    classique: reglage.classique,
    // les détails de saison du jour, à mettre dans le style de départ (app.js) : rien pour la carte classique
    saison: reglage.classique ? { sources: {}, avant: () => [] } : styleSaison(jDepart, P0),
  };
}

let essai = null;
/** Pour les essais : passe la carte à ce moment (« 2026-10-12T22:00 », heure du Japon), comme si l'heure avançait. */
export function essayerMoment(texte) {
  essai?.(texte);
}
