// ================================================================
//  Les outils communs des films (voyage.js, zoom.js, pov.js ; le premier film, realisation.js, a les siens).
//  tourner.py injecte ce fichier, puis celui du film, une fois la carte prête (avec ralenti.js).
//  window.__creerFilm({ duree, css }) donne l'horloge du film et de quoi le réaliser ; le film appelle
//  ensuite film.exposer({ preparer }) pour que tourner.py puisse le préparer, le démarrer et le filmer.
//  L'horloge s'arrête pendant les pauses (film.pause / film.reprendre) : ces moments ne sont pas filmés.
//  Le calque #film est dessiné pour un écran de 540 px de large (les positions sont en « px 540 »),
//  puis mis à l'échelle (zoom) : le film est tourné à 432 px, la taille d'un vrai téléphone.
// ================================================================
window.__creerFilm = function creerFilm({ duree, css = '' }) {
  const map = window.carte;
  const ECHELLE = innerWidth / 540;
  const HAUT = innerHeight / ECHELLE; // la hauteur de l'écran, en px 540 (960 pour 9:16)

  // ---------------------------------------------------------------- Horloge du film (secondes)
  let debut = null, pauseDepuis = null, pauses = 0, fini = false;
  const t = () => (debut === null ? 0 : ((pauseDepuis ?? performance.now()) - debut - pauses) / 1000);
  const enPause = () => pauseDepuis !== null;
  const pause = () => { if (!enPause()) pauseDepuis = performance.now(); };
  const reprendre = () => { if (enPause()) { pauses += performance.now() - pauseDepuis; pauseDepuis = null; } };
  const attendre = (s) => new Promise((ok) => setTimeout(ok, s * 1000)); // en temps de la page (ralenti)
  async function tuilesPretes(max = 5) {
    const fin = performance.now() + max * 1000;
    await attendre(0.2);
    while (!map.areTilesLoaded() && performance.now() < fin) await attendre(0.1);
    await attendre(0.3);
  }

  // ---------------------------------------------------------------- Courbes
  const borne = (x) => Math.max(0, Math.min(1, x));
  const sortie = (x) => 1 - (1 - x) ** 3;
  const entree = (x) => x * x * x;
  const lisse = (x) => x * x * (3 - 2 * x);
  const ressort = (x) => { const c = 1.6; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2; };
  const lineaire = (x) => x;
  const f = (n, d = 3) => n.toFixed(d);

  // ---------------------------------------------------------------- Le calque
  const style = document.createElement('style');
  style.textContent = `
    #film { position: fixed; inset: 0; zoom: ${ECHELLE}; z-index: 2147483000; pointer-events: none; overflow: hidden; font-family: "Noto Sans", sans-serif; }
    #film [hidden] { display: none !important; }
    /* le doigt : une goutte d'encre (style « carte ») ou le rond gris d'un enregistrement d'écran (style « telephone ») */
    #film .fm-doigt { position: absolute; width: 0; height: 0; }
    #film .fm-doigt i { position: absolute; left: 0; top: 0; border-radius: 50%; translate: -50% -50%; }
    #film .fm-doigt.encre .fm-point { width: 30px; height: 30px; background: rgba(168, 50, 31, 0.55); box-shadow: 0 0 0 2.5px rgba(246, 238, 219, 0.9); }
    #film .fm-doigt.encre .fm-anneau { width: 64px; height: 64px; border: 3px solid #a8321f; }
    #film .fm-doigt.telephone .fm-point { width: 46px; height: 46px; background: rgba(255, 255, 255, 0.42); box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.85), 0 2px 10px rgba(0, 0, 0, 0.25); }
    #film .fm-doigt.telephone .fm-anneau { width: 70px; height: 70px; border: 2px solid rgba(255, 255, 255, 0.8); }
    #film .fm-flash { position: absolute; inset: 0; background: #fff; }
    ${css}
  `;
  document.head.append(style);
  const racine = document.createElement('div');
  racine.id = 'film';
  document.body.append(racine);
  const dessins = []; // une fonction par élément : dessiner(t)
  const chaqueImage = (fn) => dessins.push(fn);
  const element = (classe, html = '') => {
    const el = document.createElement('div');
    el.className = classe;
    el.innerHTML = html;
    racine.append(el);
    return el;
  };

  // ---------------------------------------------------------------- Ce qui se passe à l'écran (repères de temps)
  const reperes = [];
  const quand = (a, fait) => reperes.push({ a, fait, fait_: false });
  /** Sous une coupe : la carte change, l'horloge du film attend que ce soit prêt (ce n'est pas filmé). */
  const sansFilmer = (a, faire) => quand(a, async () => {
    pause();
    try { await faire(); } finally { reprendre(); }
  });
  const $ = (s) => document.querySelector(s);
  const cliquer = (s) => (typeof s === 'string' ? $(s) : s)?.click();
  const milieu = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };

  /** Un doigt qui touche l'écran à `de` ; `ou()` donne le point en px de l'écran (lu quand il apparaît). */
  function toucher(de, ou, genre = 'encre') {
    const el = element(`fm-doigt ${genre}`, '<i class="fm-anneau"></i><i class="fm-point"></i>');
    const [anneau, point] = el.children;
    let place = null;
    chaqueImage((t) => {
      el.hidden = t < de - 0.14 || t > de + 0.7;
      if (el.hidden) return;
      if (!place) {
        place = ou() || { x: -999, y: -999 };
        el.style.left = `${place.x / ECHELLE}px`;
        el.style.top = `${place.y / ECHELLE}px`;
      }
      const pa = borne((t - de + 0.14) / 0.14); // le doigt arrive
      const pr = borne((t - de) / 0.6); // l'anneau s'ouvre
      point.style.opacity = f(pa * (1 - borne((t - de - 0.2) / 0.3)) * 0.95);
      point.style.transform = `scale(${f(1.35 - 0.35 * sortie(pa) - 0.12 * Math.sin(Math.PI * borne((t - de) / 0.2)))})`;
      anneau.style.opacity = f(t < de ? 0 : 1 - pr);
      anneau.style.transform = `scale(${f(0.35 + 1.1 * sortie(pr))})`;
    });
  }

  /** Un éclair blanc qui s'efface (une coupe franche, comme dans un montage TikTok). */
  function flash(a, force = 0.75, duree = 0.18) {
    const el = element('fm-flash');
    chaqueImage((t) => {
      el.hidden = t < a || t > a + duree;
      if (!el.hidden) el.style.opacity = f(force * (1 - borne((t - a) / duree)));
    });
  }

  // ---------------------------------------------------------------- La boucle
  function image() {
    const tf = t();
    if (debut !== null && !fini) {
      for (const r of reperes) if (!r.fait_ && tf >= r.a) { r.fait_ = true; r.fait(); }
      if (tf >= duree) fini = true;
    }
    for (const d of dessins) d(tf);
    requestAnimationFrame(image);
  }
  requestAnimationFrame(image);

  /** Le film se présente à tourner.py : preparer() avant le tournage (vue de départ, réglages). */
  function exposer({ preparer }) {
    window.__film = {
      t, enPause, fini: () => fini, duree,
      preparer,
      demarrer() { debut = performance.now(); },
    };
  }

  return {
    map, ECHELLE, HAUT, t, enPause, pause, reprendre, attendre, tuilesPretes,
    borne, sortie, entree, lisse, ressort, lineaire, f,
    racine, element, chaqueImage, quand, sansFilmer, $, cliquer, milieu, toucher, flash, exposer,
    modeFilm: (oui) => document.body.classList.toggle('mode-film', oui),
    toutFermer: () => document.body.click(), // un appui à côté ferme les panneaux (app.js)
  };
};
