// Injecté avant le chargement de la page (Playwright add_init_script) : quand window.__ralentir() est appelé,
// tout le temps de la page coule FACTEUR fois moins vite : performance.now, Date.now, requestAnimationFrame,
// setTimeout/setInterval et les animations CSS. La carte bouge alors au ralenti pendant que les tuiles, elles,
// arrivent à vitesse normale : chaque capture d'écran couvre quelques millisecondes du film, sans saccade.
(() => {
  let FACTEUR = window.__FACTEUR_RALENTI || 0.1; // tourner.py le règle (0,1 pour le film, plus vite en brouillon)
  const maintenantReel = performance.now.bind(performance);
  const dateReelle = Date.now.bind(Date);
  let ralenti = false, baseReelle = 0, baseVirtuelle = 0, baseDate = 0;

  const virtuel = () => (ralenti ? baseVirtuelle + (maintenantReel() - baseReelle) * FACTEUR : maintenantReel());
  performance.now = virtuel;
  Date.now = () => (ralenti ? baseDate + (maintenantReel() - baseReelle) * FACTEUR : dateReelle());

  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (fn) => raf(() => fn(virtuel()));

  const st = window.setTimeout.bind(window), si = window.setInterval.bind(window);
  const ct = window.clearTimeout.bind(window), ci = window.clearInterval.bind(window);
  // Les minuteries « virtuelles » (window.__minuteriesVirtuelles, les vidéos de la balade) : elles tombent à l'heure du
  // temps de la page, vérifiée à chaque image réelle, même si le ralenti change en cours de route (__changerFacteur) ;
  // sans elles, une minuterie lancée à vitesse normale puis ralentie (ou l'inverse) tombait beaucoup trop tôt ou tard.
  const virtuelles = new Map();
  let prochainId = 1e9;
  const virtuelle = () => ralenti && window.__minuteriesVirtuelles;
  const minuterie = (fn, d, a, periode) => {
    const id = prochainId++;
    virtuelles.set(id, { fn, a, du: virtuel() + Math.max(0, Number(d) || 0), periode });
    return id;
  };
  window.setTimeout = (fn, d = 0, ...a) => (virtuelle() && typeof fn === 'function' ? minuterie(fn, d, a, null) : st(fn, ralenti ? d / FACTEUR : d, ...a));
  window.setInterval = (fn, d = 0, ...a) => (virtuelle() && typeof fn === 'function' ? minuterie(fn, d, a, Math.max(1, Number(d) || 0)) : si(fn, ralenti ? d / FACTEUR : d, ...a));
  window.clearTimeout = (id) => { if (!virtuelles.delete(id)) ct(id); };
  window.clearInterval = (id) => { if (!virtuelles.delete(id)) ci(id); };
  const echeances = () => {
    if (!virtuelles.size) return;
    const v = virtuel();
    for (let tour = 0; tour < 12; tour++) {
      const dues = [...virtuelles].filter(([, m]) => m.du <= v).sort((p, q) => p[1].du - q[1].du);
      if (!dues.length) break;
      for (const [id, m] of dues) {
        if (!virtuelles.has(id)) continue;
        if (m.periode === null) virtuelles.delete(id); else m.du += m.periode;
        try { m.fn(...m.a); } catch (e) { st(() => { throw e; }); }
      }
    }
  };

  // Les animations et transitions CSS au même rythme (les nouvelles sont rattrapées à chaque image)
  const caler = () => {
    for (const a of document.getAnimations()) if (a.playbackRate !== FACTEUR) a.playbackRate = FACTEUR;
  };
  const boucle = () => { if (ralenti) caler(); echeances(); raf(boucle); };
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
  // Changer de ralenti en cours de route (les vidéos de la balade : à vitesse normale entre deux passages filmés) ; le
  // temps de la page continue sans saut. Les minuteries déjà lancées gardent leur délai.
  window.__changerFacteur = (f) => {
    if (ralenti) {
      const v = virtuel(), d = Date.now();
      baseReelle = maintenantReel();
      baseVirtuelle = v;
      baseDate = d;
    }
    FACTEUR = f;
    window.__facteur = f;
    if (ralenti) caler();
  };
})();
