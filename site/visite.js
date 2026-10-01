// ================================================================
//  Visite guidée : la caméra vole toute seule d'un lieu à l'autre, comme un film.
//  - D'abord un plan d'ensemble de tous les lieux de la visite, puis chaque lieu de près,
//    dans l'ordre du voyage, en tournant lentement autour pendant la pause.
//  - Un bandeau en bas donne le nom du lieu ; une petite barre permet pause, précédent, suivant, arrêt.
//  - Mode film : tous les boutons de la carte se cachent (la barre revient quand on bouge la souris
//    ou qu'on touche l'écran), pour filmer l'écran proprement.
// ================================================================
import { ordreDeVoyage } from './favoris.js';

const ZOOM_LIEU = 12;
const CACHER_BARRE = 2500; // ms sans bouger avant que la barre se cache, en mode film

const ICONES = {
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>',
  lecture: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5.5v13a1 1 0 0 0 1.5.9l10.5-6.5a1 1 0 0 0 0-1.8L9.5 4.6A1 1 0 0 0 8 5.5Z"/></svg>',
  precedent: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 5h2.5v14H6zM19 5.8v12.4a.8.8 0 0 1-1.2.7L9.6 12.7a.8.8 0 0 1 0-1.4l8.2-6.2a.8.8 0 0 1 1.2.7Z"/></svg>',
  suivant: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M15.5 5H18v14h-2.5zM5 5.8v12.4a.8.8 0 0 0 1.2.7l8.2-6.2a.8.8 0 0 0 0-1.4L6.2 5.1A.8.8 0 0 0 5 5.8Z"/></svg>',
  arreter: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M6 6l12 12M18 6 6 18"/></svg>',
};

/**
 * outils : { t, enLangue, infos(lieu) → « Catégorie · Préfecture », estTelephone, avant(), apres() }
 *   avant() : appelé au début (fermer les menus et la fiche, arrêter la rotation…)
 *   apres() : appelé à la fin
 * Renvoie { lancer(liste, { duree, film }), arreter(), enCours(), majLangue() }.
 */
export function brancherVisite(map, outils) {
  const { t, enLangue, infos, estTelephone, avant, apres } = outils;
  const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let etat = null; // { liste, i, duree, film, pause, jeton, minuterie }
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
    <button type="button" data-action="arreter" class="visite-arreter">${ICONES.arreter}</button>`;
  document.body.append(titre, barre);
  barre.addEventListener('click', (e) => {
    const action = e.target.closest('button')?.dataset.action;
    if (action === 'precedent') aller(etat.i - 1);
    else if (action === 'suivant') aller(etat.i + 1);
    else if (action === 'pause') basculerPause();
    else if (action === 'arreter') arreter();
    montrerBarre();
  });

  function majLangue() {
    for (const [action, cle] of [['precedent', 'visitePrecedent'], ['suivant', 'visiteSuivant'], ['arreter', 'visiteArreter']]) {
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
  function montrerBarre() {
    document.body.classList.remove('visite-calme');
    clearTimeout(minuterieBarre);
    if (etat?.film) minuterieBarre = setTimeout(() => document.body.classList.add('visite-calme'), CACHER_BARRE);
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
  function lancer(liste, { duree = 7000, film = true } = {}) {
    if (!liste.length) return;
    arreter(false);
    etat = { liste: ordreDeVoyage(liste), i: -1, duree, film, pause: false, jeton: 0, minuterie: 0 };
    avant();
    document.body.classList.add('en-visite');
    document.body.classList.toggle('mode-film', film);
    navigator.wakeLock?.request('screen').then((v) => { verrou = v; }).catch(() => {});
    majLangue();
    majProgres();
    montrerBarre();
    if (etat.liste.length === 1) { aller(0); return; }
    // Plan d'ensemble : tous les lieux de la visite à l'écran, puis le premier
    const jeton = ++etat.jeton;
    survoler(() => { etat.minuterie = setTimeout(() => { if (jeton === etat?.jeton) aller(0); }, 1500); });
  }

  /** Vue d'ensemble de tous les lieux de la visite ; fin() quand la caméra est arrivée. */
  function survoler(fin) {
    const lngs = etat.liste.map((l) => l.lng);
    const lats = etat.liste.map((l) => l.lat);
    const jeton = etat.jeton;
    const marge = estTelephone() ? 50 : 110;
    // stop() termine d'abord le mouvement en cours : son « moveend » part avant qu'on écoute le nôtre
    map.stop();
    map.once('moveend', () => { if (jeton === etat?.jeton) fin(); });
    map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], {
      padding: { top: marge, bottom: marge + 60, left: marge, right: marge },
      maxZoom: 9, pitch: 45, bearing: map.getBearing(), duration: calme ? 0 : 3000, essential: true,
    });
  }

  function aller(i) {
    if (!etat || i < 0) return;
    if (i >= etat.liste.length) { finir(); return; }
    clearTimeout(etat.minuterie);
    etat.i = i;
    etat.pause = false;
    majPause();
    majProgres();
    cacherTitre();
    const l = etat.liste[i];
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
      padding: { top: 0, bottom: estTelephone() ? 110 : 90, left: 0, right: 0 },
      curve: 1.5, duration: calme ? 0 : Math.min(8000, 3000 + km * 3.5), essential: true,
    });
  }

  function arrive(l, jeton) {
    montrerTitre(l);
    // On tourne lentement autour du lieu pendant la pause
    if (!calme) map.easeTo({ bearing: map.getBearing() + 18, duration: etat.duree, easing: (x) => x, essential: true });
    etat.minuterie = setTimeout(() => { if (jeton === etat?.jeton && !etat.pause) aller(etat.i + 1); }, etat.duree);
  }

  function basculerPause() {
    if (!etat) return;
    if (etat.pause) { aller(Math.max(0, etat.i)); return; } // repart du lieu en cours
    etat.pause = true;
    etat.jeton++;
    clearTimeout(etat.minuterie);
    map.stop();
    majPause();
  }

  function finir() {
    cacherTitre();
    const jeton = ++etat.jeton;
    titre.innerHTML = `<span class="visite-titre-textes"><b>${echapper(t('visiteFin'))}</b></span>`;
    survoler(() => {
      titre.classList.add('visible');
      setTimeout(() => { if (jeton === etat?.jeton) arreter(); }, 2500);
    });
  }

  function arreter(rendre = true) {
    if (!etat) return;
    clearTimeout(etat.minuterie);
    clearTimeout(minuterieBarre);
    etat = null;
    map.stop();
    cacherTitre();
    document.body.classList.remove('en-visite', 'mode-film', 'visite-calme');
    verrou?.release().catch(() => {});
    verrou = null;
    if (rendre) apres();
  }

  // ---- Clavier, souris, doigts
  document.addEventListener('keydown', (e) => {
    if (!etat) return;
    if (e.key === 'Escape') arreter();
    else if (e.key === ' ' || e.key === 'Spacebar') basculerPause();
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
    map.on(type, (e) => { if (etat && !etat.pause && e.originalEvent) basculerPause(); });
  }
  document.addEventListener('visibilitychange', () => {
    // le verrou d'écran saute quand la page est cachée : on le reprend au retour
    if (etat && !document.hidden && !verrou) navigator.wakeLock?.request('screen').then((v) => { verrou = v; }).catch(() => {});
  });

  return { lancer, arreter, enCours: () => !!etat, majLangue };
}

const echapper = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
