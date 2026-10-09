// Injecté avant le chargement de la page (Playwright add_init_script) : quand window.__ralentir() est appelé,
// tout le temps de la page coule FACTEUR fois moins vite : performance.now, Date.now, requestAnimationFrame,
// setTimeout/setInterval et les animations CSS. La carte bouge alors au ralenti pendant que les tuiles, elles,
// arrivent à vitesse normale : chaque capture d'écran couvre quelques millisecondes du film, sans saccade.
(() => {
  const FACTEUR = window.__FACTEUR_RALENTI || 0.1; // tourner.py le règle (0,1 pour le film, plus vite en brouillon)
  const maintenantReel = performance.now.bind(performance);
  const dateReelle = Date.now.bind(Date);
  let ralenti = false, baseReelle = 0, baseVirtuelle = 0, baseDate = 0;

  const virtuel = () => (ralenti ? baseVirtuelle + (maintenantReel() - baseReelle) * FACTEUR : maintenantReel());
  performance.now = virtuel;
  Date.now = () => (ralenti ? baseDate + (maintenantReel() - baseReelle) * FACTEUR : dateReelle());

  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (fn) => raf(() => fn(virtuel()));

  const st = window.setTimeout.bind(window), si = window.setInterval.bind(window);
  window.setTimeout = (fn, d = 0, ...a) => st(fn, ralenti ? d / FACTEUR : d, ...a);
  window.setInterval = (fn, d = 0, ...a) => si(fn, ralenti ? d / FACTEUR : d, ...a);

  // Les animations et transitions CSS au même rythme (les nouvelles sont rattrapées à chaque image)
  const caler = () => {
    for (const a of document.getAnimations()) if (a.playbackRate !== FACTEUR) a.playbackRate = FACTEUR;
  };
  const boucle = () => { if (ralenti) caler(); raf(boucle); };
  raf(boucle);

  window.__ralentir = () => {
    if (ralenti) return;
    baseReelle = maintenantReel();
    baseVirtuelle = baseReelle;
    baseDate = dateReelle();
    ralenti = true;
    caler();
  };
  window.__facteur = FACTEUR;
})();
