// ================================================================
//  Les prises des vidéos du calendrier de l'Avent (2026-11-23) : le vrai calendrier de la carte, ouvert comme le ferait un
//  visiteur le 15 décembre, sur une page de téléphone 432 × 768 à ×2,5 (1080 × 1920), à 60 images/s, avec le moteur de
//  halloween/rushes.py et commun.js. rushes.py avance l'horloge de la page au 15 décembre 2026 et range les cases déjà ouvertes
//  (toutes jusqu'au 14, sauf la 3 et la 9, qu'on ouvre dans la prise, comme on rattrape une case oubliée).
// ================================================================
(() => {
  const milieu = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  const $ = (q) => document.querySelector(q);
  const porte = (j) => $(`#panneau-noel .porte[data-j="${j}"]`);
  const CSS = `
    .filigrane, .maplibregl-ctrl-bottom-right, .maplibregl-ctrl-bottom-left, .controles, .heure-japon, #btn-dev, .btn-qualite, .aide, .toast, .visites { display: none !important; }
    :root { --bas: 58px; }`;

  /** Le panneau défile en douceur (un doigt qui glisse) jusqu'à `haut` px, en `duree` s de la prise. */
  function glisser(film, de, duree, vers) {
    let depart = null;
    film.chaqueImage((t) => {
      const p = $('#panneau-noel');
      if (!p || t < de || t > de + duree + 0.05) return;
      if (depart === null) depart = p.scrollTop;
      const cible = typeof vers === 'function' ? vers(p) : vers;
      const u = Math.min(1, (t - de) / duree);
      p.scrollTop = depart + (cible - depart) * (u < 0.5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2);
    });
  }
  /** Le haut de la fiche d'une case, dans le panneau (pour la montrer toute). */
  const versFiche = (p) => {
    const f = p.querySelector('.noel-case');
    return f ? Math.max(0, f.offsetTop - 70) : p.scrollTop;
  };

  /** Le bouton de téléchargement de la case montrée (seulement touché : rien n'est téléchargé). */
  const bouton = () => [...document.querySelectorAll('#panneau-noel .noel-case a, #panneau-noel .noel-case button')]
    .find((e) => /download/i.test(e.textContent));

  // Le calendrier : le bouton du cadeau en haut, puis les cases 9, 3 et 15 ouvertes l'une après l'autre, et chaque fois un doigt
  // sur « Download » (T : un temps de la musique, 0,625 s ; les cases tombent sur des temps)
  const T = 0.625;
  const cases = () => {
    const film = window.__creerFilm({ duree: 20 * T, css: CSS });
    const { quand, toucher } = film;
    const appui = (a, el) => { toucher(a, () => milieu(el()), 'telephone'); quand(a, () => el().click()); };
    appui(0.5 * T, () => $('#btn-noel'));
    for (const [j, a] of [[9, 2], [3, 7.5], [15, 13]]) {
      appui(a * T, () => porte(j));
      glisser(film, (a + 1.2) * T, 1.2 * T, versFiche);
      toucher((a + 3) * T, () => milieu(bouton()), 'telephone');
      glisser(film, (a + 4.5) * T, 0.9 * T, 0);
    }
    film.exposer({ async preparer() { await film.tuilesPretes(6); } });
    return film;
  };

  // ---------------------------------------------------------------- Les vidéos de Noël (plan-noel.md)
  // cv-jours : la carte de nuit, sans son interface, un plan par décoration. Chaque plan est préparé sous une coupe (la caméra,
  // la veille, les tuiles) ; s'il fait apparaître sa décoration (« voir »), le jour change à APPARITION s du début du plan, à
  // l'écran ; sinon il est déjà le bon jour. La caméra glisse doucement de « de » à « a » (lng, lat, zoom, pitch, cap).
  // Les plans partagés avec la vidéo Traditions durent plus longtemps (on y lit une phrase).
  const APPARITION = 0.4;
  // chaque décoration au centre de l'écran (sa position dans noel-decors.js / noel-carte.js : le repère y pose son pied)
  const pres = (lng, lat, z = 11, p = 40) => ({ de: [lng, lat, z, p, 0], a: [lng, lat, z + 0.3, p + 2, 5] });
  const JOURS = [
    { nom: 'japon', j: 1, d: 3.2, de: [137.6, 37.2, 4.35, 0, 0], a: [137.6, 37.2, 4.6, 0, 0] },
    { nom: 'neige', j: 1, d: 2.4, de: [135.755, 35.01, 11.2, 50, -10], a: [135.755, 35.01, 11.5, 52, -4] },
    { nom: 'cascades', j: 4, d: 2.4, de: [139.502, 36.738, 13.2, 50, 20], a: [139.502, 36.738, 13.5, 52, 28] },
    { nom: 'lanternes', j: 5, voir: true, d: 2.4, ...pres(137.6297, 35.5596) },
    { nom: 'cygnes', j: 8, voir: true, d: 2.4, ...pres(144.3491, 43.6513) },
    { nom: 'papier', j: 9, voir: true, d: 4.4, ...pres(138.365, 36.852, 10.6) },
    // les grues en papier passent au hasard (oiseaux.js) : cv-papier les fait voler sous la coupe (faireVoler, comme les essais)
    { nom: 'papier-vol', j: 9, vol: true, d: 4.4, ...pres(138.365, 36.852, 10.6) },
    { nom: 'fermes', j: 13, voir: true, d: 2.4, ...pres(136.8936, 36.4401) },
    { nom: 'kanji', j: 14, voir: true, d: 4.4, de: [135.73, 35.03, 10, 45, 0], a: [135.73, 35.03, 10.4, 48, 8] },
    { nom: 'cartes', j: 15, voir: true, d: 4.4, cartes: true, de: [138.73, 35.36, 8.6, 40, 0], a: [138.73, 35.36, 8.9, 42, 6] },
    { nom: 'singes', j: 16, voir: true, d: 2.4, ...pres(138.4627, 36.7327) },
    { nom: 'kamakura', j: 17, voir: true, d: 2.4, ...pres(140.553, 39.311) },
    { nom: 'danse', j: 21, voir: true, d: 2.4, ...pres(140.487, 40.742) },
    { nom: 'rennes', j: 23, voir: true, d: 2.4, ...pres(141.94, 45.474) },
    { nom: 'traineau', j: 24, voir: true, d: 8, traineau: true, de: [137.6, 37.2, 4.35, 0, 0], a: [137.6, 37.2, 4.7, 0, 0] },
    { nom: 'yuzu', j: 22, voir: true, d: 4.4, ...pres(131.5097, 33.3039, 12) },
  ];
  // la carte seule : ni barres, ni boutons, ni noms des lieux ; le traîneau et les cartes de vœux volent assez bas pour ne
  // pas passer sous les onglets de TikTok (le haut de l'écran)
  const CSS_NUIT = `
    .entete, .filtres, .langues, .musique, .controles, .aide, .toast, .barre-mobile, .filigrane, .heure-japon, .boutique,
    .visites, #btn-dev, .btn-qualite, .maplibregl-ctrl-bottom-left, .maplibregl-ctrl-bottom-right, .repere-nom,
    #panneau-noel { display: none !important; }
    .noel-traineau { --haut: 250px !important; }
    .noel-cartes { --haut: 300px !important; }`;
  const camera = (c) => ({ center: [c[0], c[1]], zoom: c[2], pitch: c[3], bearing: c[4] });
  const prise = (noms) => () => {
    const plans = JOURS.filter((s) => noms.includes(s.nom));
    let t0 = 0;
    for (const s of plans) { s.t0 = t0; t0 += s.d; }
    const film = window.__creerFilm({ duree: t0, css: CSS_NUIT });
    const { quand, sansFilmer, chaqueImage, map, tuilesPretes, attendre } = film;
    const voler = (selecteur, avance) => {
      const el = document.querySelector(selecteur);
      if (!el) return;
      el.classList.remove('vole');
      void el.offsetWidth;
      el.classList.add('vole');
      // pour qu'il soit déjà à l'écran : l'animation commence à `avance` de sa durée
      setTimeout(() => el.getAnimations({ subtree: true }).forEach((a) => {
        const d = a.effect.getTiming().duration;
        a.currentTime = d * avance;
      }), 30);
    };
    for (const s of plans) {
      sansFilmer(s.t0, async () => {
        map.jumpTo(camera(s.de));
        window.__jourSuivant(s.voir ? s.j - 1 : s.j);
        await tuilesPretes(10);
        await attendre(1.5);
        if (s.vol) { (await import('/oiseaux.js')).faireVoler(); await attendre(2.4); } // le vol entre au bord : il a le temps d'arriver
      });
      if (s.voir) quand(s.t0 + APPARITION, () => window.__jourSuivant(s.j));
      if (s.traineau) quand(s.t0 + APPARITION + 0.1, () => voler('.noel-traineau', 0.12));
      if (s.cartes) quand(s.t0 + APPARITION + 0.1, () => voler('.noel-cartes', 0.3));
      chaqueImage((t) => {
        if (t < s.t0 || t >= s.t0 + s.d) return;
        const u = (t - s.t0) / s.d;
        map.jumpTo(camera(s.de.map((v, i) => v + (s.a[i] - v) * u)));
      });
    }
    film.exposer({
      async preparer() {
        map.jumpTo(camera(plans[0].de));
        await tuilesPretes(10);
      },
    });
    return film;
  };

  const TOUS = JOURS.map((s) => s.nom).filter((n) => n !== 'papier-vol');
  window.__plansSupp = { 'cv-cases': cases, 'cv-jours': prise(TOUS), 'cv-papier': prise(['papier-vol']) };
})();
