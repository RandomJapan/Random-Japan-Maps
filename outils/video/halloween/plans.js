// ================================================================
//  Les plans des vidéos d'Halloween (2026-10-21) : des « rushes » filmés dans la vraie carte, la nuit, avec tout
//  l'événement (chapeaux, chauves-souris, hitodama, défilé, chasse aux yōkai), que montage/ (Remotion) monte
//  ensuite en trois vidéos 16:9 de 20 s au plus, et en vertical 9:16 pour TikTok. rushes.py injecte commun.js
//  (l'horloge des films), puis ce fichier, et appelle window.__lancerPlan(nom).
//  En vertical (window.__VERTICAL, une page de téléphone), les réglages « v » d'un plan remplacent les siens.
//  Un plan = une durée, un trajet de caméra (clés [t, lng, lat, zoom, inclinaison, cap], interpolées en douceur,
//  hauteur du centre figée et lissée comme dans voyage.js) et des actions à des instants du plan.
// ================================================================
(() => {
  const merc = ([lng, lat]) => [(lng + 180) / 360, (1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) / 2];
  const geo = ([x, y]) => [x * 360 - 180, (360 / Math.PI) * Math.atan(Math.exp((1 - 2 * y) * Math.PI)) - 90];

  /** Interpolation cubique monotone (Fritsch–Carlson), comme voyage.js : passe par les clés sans les dépasser. */
  function monotone(ts, vs) {
    const n = ts.length;
    if (n === 1) return () => vs[0];
    const d = [], m = new Array(n).fill(0);
    for (let i = 0; i < n - 1; i++) d.push((vs[i + 1] - vs[i]) / (ts[i + 1] - ts[i]));
    m[0] = d[0]; m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) {
      if (d[i - 1] * d[i] <= 0) m[i] = 0;
      else {
        const w1 = 2 * (ts[i + 1] - ts[i]) + (ts[i] - ts[i - 1]), w2 = (ts[i + 1] - ts[i]) + 2 * (ts[i] - ts[i - 1]);
        m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
      }
    }
    return (t) => {
      if (t <= ts[0]) return vs[0];
      if (t >= ts[n - 1]) return vs[n - 1];
      let i = 0;
      while (t > ts[i + 1]) i++;
      const h = ts[i + 1] - ts[i], s = (t - ts[i]) / h;
      const h00 = 2 * s ** 3 - 3 * s ** 2 + 1, h10 = s ** 3 - 2 * s ** 2 + s, h01 = -2 * s ** 3 + 3 * s ** 2, h11 = s ** 3 - s ** 2;
      return h00 * vs[i] + h10 * h * m[i] + h01 * vs[i + 1] + h11 * h * m[i + 1];
    };
  }

  // Les rushes ne montrent que la carte : le titre, les boutons, le filigrane, le cartouche et les crédits seront
  // ceux du montage (les crédits de la carte y sont repris). Les particules restent visibles pendant que la caméra
  // bouge (la carte les cache à chaque mouvement, et ici elle bouge à chaque image).
  const CSS_PROPRE = `
    .filigrane, .bandeau, .maplibregl-ctrl-bottom-right, .maplibregl-ctrl-bottom-left, .toile-coin, .heure-japon { display: none !important; }
    .saison.repos { opacity: 1 !important; visibility: visible !important; transition: none !important; }
    .saison.repos * { animation-play-state: running !important; }
    .visite-barre { display: none !important; }`;
  // l'interface à l'écran (la chasse) : sans ce qui n'a rien à voir avec Halloween
  const CSS_INTERFACE = `
    .filigrane, .maplibregl-ctrl-bottom-right, .heure-japon, #btn-dev, .btn-qualite, .aide, .visites, .visite-barre { display: none !important; }
    body.en-visite .bandeau { display: block !important; }
    body.en-visite .repere, body.en-visite .legende { pointer-events: auto !important; }
    .saison.repos { opacity: 1 !important; visibility: visible !important; transition: none !important; }
    .saison.repos * { animation-play-state: running !important; }`;

  /** Lance le défilé depuis le panneau Halloween. large : sur une page étroite (vertical), son chemin est tracé
   *  comme sur un écran de `large` px de large, centré sur la page (hyakki.js le tire d'un bord de l'écran à
   *  l'autre) : aussi long qu'en 16:9, les yōkai restent en route le temps du plan. */
  async function lancerDefile(large) {
    document.getElementById('btn-halloween').click(); // le panneau se remplit en s'ouvrant
    await new Promise((ok) => setTimeout(ok, 120));
    const bouton = document.querySelector('#panneau-halloween .halloween-section .btn-lancer');
    const map = window.carte, { clientWidth: l, clientHeight: h } = map.getContainer();
    if (!large || large <= l) return bouton.click();
    const dx = (large - l) / 2, project = map.project, unproject = map.unproject;
    map.getContainer = () => ({ clientWidth: large, clientHeight: h });
    map.project = (ll) => { const q = project.call(map, ll); q.x += dx; return q; };
    map.unproject = (p) => unproject.call(map, [p[0] - dx, p[1]]);
    try { bouton.click(); } finally { delete map.getContainer; delete map.project; delete map.unproject; }
  }
  const membres = () => [...document.querySelectorAll('.defile-yokai .membre')].filter((m) => !m.hidden && m.dataset.lng);
  const voler = async () => (await import('/oiseaux.js')).faireVoler();

  /**
   * Un plan : { duree, cles, actions: [[t, fn]], interface, css, avant (réglage avant le repérage),
   *   suivre (la caméra suit le défilé), avance (secondes réelles de défilé avant de filmer),
   *   marge (padding de la caméra : le lieu visé n'est plus au milieu), cheminLarge (voir lancerDefile),
   *   v (ce qui change en vertical) }.
   */
  function plan(o) {
    if (window.__VERTICAL && o.v) o = { ...o, ...o.v, css: (o.css || '') + (o.v.css || '') };
    const film = window.__creerFilm({ duree: o.duree });
    const { map, attendre, tuilesPretes, chaqueImage, quand } = film;
    const style = document.createElement('style');
    style.textContent = (o.interface ? CSS_INTERFACE : CSS_PROPRE) + (o.css || '');
    document.head.append(style);
    if (!o.interface) film.modeFilm(true);
    // pas de défilé tout seul (hyakki.js ne le lance pas pendant une visite) : seulement quand un plan le demande
    document.body.classList.add('en-visite');

    const cles = o.cles;
    const ts = cles.map((c) => c[0]);
    const xy = cles.map((c) => merc([c[1], c[2]]));
    const fx = monotone(ts, xy.map((p) => p[0])), fy = monotone(ts, xy.map((p) => p[1]));
    const fz = monotone(ts, cles.map((c) => c[3])), fp = monotone(ts, cles.map((c) => c[4])), fb = monotone(ts, cles.map((c) => c[5]));
    let hauteurs = null;
    const PAS = 0.25;
    const hauteur = (t) => {
      const k = Math.max(0, Math.min(hauteurs.length - 1, t / PAS)), i = Math.floor(k), r = k - i;
      return hauteurs[i] * (1 - r) + hauteurs[Math.min(hauteurs.length - 1, i + 1)] * r;
    };
    const marge = { top: 0, right: 0, bottom: 0, left: 0, ...o.marge };
    const camera = (t) => ({
      center: geo([fx(t), fy(t)]), zoom: fz(t), pitch: fp(t), bearing: fb(t), padding: marge,
      ...(hauteurs ? { elevation: hauteur(t) } : {}),
    });

    // la caméra qui suit le défilé : son centre glisse vers le milieu des yōkai visibles (un travelling), ou vers un
    // yōkai donné quand o.suivre est une liste [[t, rang dans le cortège], …] (elle passe de l'un à l'autre)
    // (lissé dans le temps du plan : au ralenti, la page dessine bien plus d'images par seconde de film)
    let suivi = null, avant = null;
    function suivre(t, dt) {
      let vus = membres();
      if (Array.isArray(o.suivre)) {
        const rang = o.suivre.filter(([de]) => de <= t).pop()?.[1] ?? o.suivre[0][1];
        const lui = document.querySelectorAll('.defile-yokai .membre')[rang];
        if (lui && !lui.hidden && lui.dataset.lng) vus = [lui];
      }
      if (!vus.length) return;
      const m = vus.reduce((a, el) => { const p = merc([+el.dataset.lng, +el.dataset.lat]); return [a[0] + p[0], a[1] + p[1]]; }, [0, 0]);
      const cible = [m[0] / vus.length, m[1] / vus.length];
      const k = 1 - Math.exp(-dt / (Array.isArray(o.suivre) ? 0.45 : 1.1));
      suivi = suivi ? [suivi[0] + (cible[0] - suivi[0]) * k, suivi[1] + (cible[1] - suivi[1]) * k] : cible;
    }
    let tourne = false;
    chaqueImage((t) => {
      if (!tourne) return;
      if (o.suivre) {
        suivre(t, avant === null ? 0 : Math.max(0, t - avant));
        avant = t;
        if (suivi) map.jumpTo({ center: geo(suivi), zoom: fz(t), pitch: fp(t), bearing: fb(t), padding: marge });
      } else map.jumpTo(camera(t));
    });
    quand(0, () => { tourne = true; });
    for (const [t, fn] of o.actions || []) quand(t, fn);

    film.exposer({
      async preparer() {
        map.getCanvasContainer().dispatchEvent(new MouseEvent('mousedown'));
        if (o.avant) await o.avant(film);
        if (!o.suivre) {
          map.setCenterClampedToGround(false);
          const mesures = [];
          for (let t = 0; t <= o.duree + PAS; t += PAS) {
            const c = camera(t);
            map.jumpTo(c);
            await tuilesPretes(4);
            mesures.push(Math.max(0, map.queryTerrainElevation(c.center) ?? 0));
          }
          // lissées : la caméra ne suit pas chaque bosse du sol
          hauteurs = mesures.map((_, k) => {
            let s = 0, w = 0;
            for (let j = -4; j <= 4; j++) { const i = Math.min(mesures.length - 1, Math.max(0, k + j)); const p = Math.exp(-(j * j) / 8); s += mesures[i] * p; w += p; }
            return s / w;
          });
        }
        map.jumpTo(camera(0));
        await tuilesPretes(6);
        if (o.avance) {
          // le défilé part avant de filmer (en temps réel), et la caméra le suit déjà
          await lancerDefile(o.cheminLarge);
          const fin = performance.now() + o.avance * 1000;
          while (performance.now() < fin) {
            await attendre(1 / 30);
            if (o.suivre) { suivre(0, 1 / 30); if (suivi) map.jumpTo({ center: geo(suivi), zoom: fz(0), pitch: fp(0), bearing: fb(0), padding: marge }); }
          }
          await tuilesPretes(4);
        }
        await attendre(0.8);
      },
    });
    return film;
  }

  // Les animations CSS d'un nom donné, calées à un instant de leur cycle (en ms)
  const caler = (noms, ms) => {
    for (const a of document.getAnimations()) if (noms.includes(a.animationName)) a.currentTime = ms;
  };

  // en vertical, le lieu est en bas à gauche : la carte-photo de la vidéo du propriétaire prend le haut à droite
  const LIEU_V = { v: { marge: { top: 160, right: 240 } } };
  const PLANS = {
    // ---------------------------------------------------------------- Vidéo 1 : les lieux les plus hantés
    'v1-nagoro': () => plan({ duree: 6, cles: [[0, 134.004, 33.836, 10.7, 52, -20], [6, 134.0205, 33.853, 12.5, 64, 6]], ...LIEU_V }),
    'v1-osorezan': () => plan({ duree: 6, cles: [[0, 141.075, 41.287, 10.4, 50, 22], [6, 141.05, 41.312, 11.55, 62, -4]], ...LIEU_V }),
    'v1-noboribetsu': () => plan({ duree: 6, cles: [[0, 141.12, 42.47, 10.7, 50, 30], [6, 141.143, 42.494, 12.5, 63, 6]], ...LIEU_V }),
    'v1-himeji': () => plan({ duree: 6, cles: [[0, 134.695, 34.835, 10.1, 48, 12], [6, 134.652, 34.882, 11.55, 55, 36]], ...LIEU_V }),
    'v1-fin': () => plan({ duree: 6, cles: [[0, 135.76, 35.0, 10.3, 60, 0], [6, 135.45, 34.95, 8.1, 48, -12]] }),

    // ---------------------------------------------------------------- Vidéo 2 : le défilé des cent démons
    // large : le cortège traverse Kyoto, entre les temples (avec un vol de chauves-souris) ; la caméra le suit, sinon
    // il reste dans un coin (il met une demi-minute à traverser l'écran)
    // (en vertical, de plus loin : le cortège entier tient dans l'image étroite)
    'v2-large': () => plan({ duree: 14, avance: 12, suivre: true, cles: [[0, 135.776, 34.996, 11.25, 58, -10], [14, 135.772, 35.0, 11.45, 60, -4]],
      actions: [[5.5, voler]], v: { cheminLarge: 1280, cles: [[0, 135.776, 34.996, 10.55, 58, -10], [14, 135.772, 35.0, 10.7, 60, -4]] } }),
    // de près, en travelling : la caméra suit un yōkai, puis glisse vers le suivant toutes les 2,6 s (rushes.py le
    // tourne sur une page plus petite : les yōkai y sont plus grands) : la lanterne, le renard, l'ombrelle, le tanuki, le kappa, l'oni, le tengu, rokurokubi
    'v2-proche': () => plan({ duree: 21, avance: 7, cles: [[0, 135.772, 34.99, 12.15, 60, -8]],
      suivre: [[0, 0], [2.6, 1], [5.2, 2], [7.8, 3], [10.4, 4], [13, 5], [15.6, 6], [18.2, 7]], v: { cheminLarge: 960 } }),

    // ---------------------------------------------------------------- Vidéo 3 : la carte se transforme, la chasse
    // le même trajet de jour (sans Halloween : rushes.py le coupe) puis de nuit
    'v3-jour': () => plan({ duree: 7, cles: [[0, 135.769, 34.993, 11.9, 60, -32], [7, 135.771, 34.997, 12.25, 62, -12]], actions: [[0.1, voler]] }),
    'v3-nuit': () => plan({ duree: 7, cles: [[0, 135.769, 34.993, 11.9, 60, -32], [7, 135.771, 34.997, 12.25, 62, -12]], actions: [[0.1, voler]] }),
    // les épingles et leurs chapeaux, de près (Sanjūsangen-dō et ses voisins)
    'v3-chapeaux': () => plan({ duree: 6, cles: [[0, 135.772, 34.983, 12.9, 56, -18], [6, 135.7718, 34.9862, 13.3, 60, -6]] }),
    // la toile et son araignée, le chat sur le cartouche : l'interface, sans le reste
    'v3-coin': () => plan({ duree: 9, interface: true,
      css: `.entete, .filtres, .langues, .musique, .controles, .toast, .repere-nom, .resume-itineraire, .resume-saison, .maplibregl-ctrl-bottom-left { display: none !important; }`,
      cles: [[0, 135.776, 34.996, 10.6, 55, -10], [9, 135.774, 34.998, 10.75, 57, -6]],
      avant: async () => { await new Promise((ok) => setTimeout(ok, 300)); },
      actions: [[0, () => caler(['araignee', 'toile-soie'], 4900)]],
      // en vertical : la toile à sa taille d'ordinateur, et le cartouche (avec son chat) remonté au-dessus de la zone
      // que TikTok couvre de sa légende
      v: { css: `.toile-coin { width: 300px !important; height: 300px !important; top: 0 !important; }
        body.en-visite .bandeau { transform: none !important; left: 8px !important; bottom: 34% !important; }` } }),
    // la chasse : six yōkai déjà trouvés (rushes.py), on touche Enma, le septième : bulle, puis « Chasse terminée ! »
    'v3-chasse': () => plan({ duree: 7.5, interface: true, css: '.legende:not(.yokai-cache) { display: none !important; }',
      cles: [[0, 135.80, 34.99, 10.8, 50, 0], [7.5, 135.805, 34.995, 10.9, 51, 0]],
      actions: [[1.4, () => window.__toucherYokai('enma')]] }),

    // ---------------------------------------------------------------- Pour les fins : tout le Japon, la nuit
    'fin-japon': () => plan({ duree: 7, cles: [[0, 136.6, 36.2, 5.15, 38, 22], [7, 136.9, 36.6, 5.0, 34, 32]],
      v: { cles: [[0, 137.0, 36.0, 4.95, 34, 34], [7, 137.2, 36.3, 4.85, 30, 40]] } }),
  };

  // le moteur sert aussi à d'autres films (promo30/plans.js : window.__plansSupp, injecté après ce fichier)
  window.__planMoteur = { plan, voler, caler, lancerDefile, membres };
  window.__lancerPlan = (nom) => {
    const film = (PLANS[nom] || window.__plansSupp[nom])();
    // un doigt qui touche (commun.js) puis le vrai clic
    window.__toucherYokai = (id) => {
      const el = [...document.querySelectorAll('.yokai-cache')].find((e) => e.isConnected && e.getAttribute('aria-label')?.toLowerCase().includes(id === 'enma' ? 'enma' : id));
      if (!el) return;
      const r = el.querySelector('svg').getBoundingClientRect();
      film.toucher(film.t() + 0.15, () => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 }), 'telephone');
      setTimeout(() => el.click(), 150);
    };
  };
})();
