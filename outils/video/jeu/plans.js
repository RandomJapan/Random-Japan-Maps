// ================================================================
//  Les prises des deux vidéos du jeu (2026-11-09) : « Devine le lieu » et le défi du jour, joués pour de vrai dans la carte, sur une
//  page de téléphone 432 × 768 à ×2,5 (1080 × 1920), à 60 images/s, avec le moteur de halloween/rushes.py et commun.js. rushes.py
//  pose les lieux des parties (window.__LIEUX_JEU, window.__LIEU_DEFI), remplace leurs photos et donne l'état du jeu au film
//  (window.__etatJeu). Le film rejoue ce que ferait un joueur : un appui sur la carte, « Valider », la révélation.
// ================================================================
(() => {
  const att = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const M = () => window.carte;
  const appuiCarte = ([lng, lat]) => M().fire('click', { lngLat: { lng, lat }, originalEvent: { target: M().getCanvas() } });
  const jeu = (q) => document.querySelector(`section.jeu:not(.defi) ${q}`);
  const defi = (q) => document.querySelector(`section.jeu.defi ${q}`);
  const milieu = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  const surCarte = (ll) => () => { const p = M().project(ll); return { x: p.x, y: p.y }; };
  async function attendre(test, max = 20000) {
    const fin = performance.now() + max;
    while (!test()) {
      if (performance.now() > fin) throw new Error(`attente trop longue : ${test}`);
      await att(50);
    }
  }
  async function tuiles(max = 8000) {
    await att(200);
    const fin = performance.now() + max;
    while (!M().areTilesLoaded() && performance.now() < fin) await att(80);
    await att(250);
  }
  const CSS = `
    .filigrane, .maplibregl-ctrl-bottom-right, .maplibregl-ctrl-bottom-left, .controles, .heure-japon, #btn-dev, .btn-qualite, .aide, .toast, .visites { display: none !important; }
    :root { --bas: 58px; }
    .vol-grues { display: none !important; }`;

  // ---------------------------------------------------------------- Devine le lieu
  // les lieux des cinq manches et l'épingle posée à chacune
  window.__LIEUX_JEU = ['kinkaku-ji', 'motonosumi-shrine', 'aogashima', 'himeji-castle', 'tottori-sand-dunes'];
  const PINS = [[135.77, 34.99], [132.42, 34.42], [139.9, 35.3], [134.82, 34.95], [134.4, 35.48]];
  const lancerJeu = async () => {
    try { localStorage.setItem('jeuRecords', JSON.stringify({ parties: 11, meilleurs: [{ score: 3241, date: Date.now() - 2 * 864e5 }, { score: 2987, date: Date.now() - 5 * 864e5 }, { score: 2610, date: Date.now() - 8 * 864e5 }] })); } catch { /* */ }
    document.getElementById('btn-jeu').click();
    await attendre(() => jeu('.jeu-action') && !jeu('.jeu-action').closest('section').hidden);
    await att(300);
    jeu('.jeu-action').click(); // Jouer seul
  };
  /** Joue vite les n premières manches (pour n = 5, la dernière révélation reste à l'écran). */
  async function jusqua(n) {
    await lancerJeu();
    for (let i = 0; i < n; i++) {
      await attendre(() => jeu('.jeu-photo').complete && jeu('.jeu-photo').getAttribute('src'));
      await att(150);
      appuiCarte(PINS[i]);
      await att(80);
      jeu('.jeu-action').click(); // Valider
      await att(120);
      if (i < 4) jeu('.jeu-action').click(); // Lieu suivant
      await att(120);
    }
    await attendre(() => jeu('.jeu-photo').complete && jeu('.jeu-photo').getAttribute('src'));
    await att(2300); // le vol jusqu'à tout le Japon
    await tuiles();
  }

  /** Une manche filmée : l'appui sur la carte, « Valider », le vol jusqu'aux deux épingles. reste : les secondes au chrono. */
  const manche = (n, reste) => () => {
    const film = window.__creerFilm({ duree: 4.3, css: CSS });
    const { quand, toucher } = film;
    toucher(0.4, surCarte(PINS[n]), 'telephone');
    quand(0.4, () => appuiCarte(PINS[n]));
    toucher(0.95, () => milieu(jeu('.jeu-action')), 'telephone');
    quand(0.95, () => jeu('.jeu-action').click());
    film.exposer({
      async preparer() {
        await jusqua(n);
        window.__etatJeu().finChrono = performance.now() + reste * 1000;
        await att(60);
      },
    });
    return film;
  };

  /** Le score final : « Voir mon score », tout le Japon revient. */
  const score = () => {
    const film = window.__creerFilm({ duree: 3, css: CSS });
    const { quand, toucher } = film;
    toucher(0.3, () => milieu(jeu('.jeu-action')), 'telephone');
    quand(0.3, () => jeu('.jeu-action').click());
    film.exposer({
      async preparer() {
        await jusqua(5);
        await tuiles();
      },
    });
    return film;
  };

  // ---------------------------------------------------------------- Le défi du jour
  // le lieu : l'étang bleu de Shirogane, à Hokkaidō. Les essais remontent le Japon, de plus en plus chaud : froid, tiède, chaud, brûlant, trouvé.
  window.__LIEU_DEFI = 'shirogane-blue-pond';
  const BEAT = 60 / 144, ZERO = 7; // la prise commence au temps 7 de la vidéo
  const MARGE = { top: 92, bottom: 0, left: 0, right: 0 }; // la vue est centrée sur l'essai, ainsi à 430 px du haut : juste sous la carte du jeu
  const tp = (temps) => (temps - ZERO) * BEAT;
  const ESSAIS = [
    { ll: [139.75, 35.72], appui: 8.1, valide: 9.3 },
    { ll: [140.75, 40.8], vue: [140.75, 40.8, 4.75], appui: 15.15, valide: 15.85 },
    { ll: [141.32, 43.05], vue: [141.32, 43.05, 5.55], appui: 19.15, valide: 19.85 },
    { ll: [142.35, 43.78], vue: [142.35, 43.78, 7.0], appui: 23.15, valide: 23.85 },
    { ll: [142.56, 43.52], vue: [142.56, 43.52, 7.6], appui: 27.15, valide: 27.85 },
  ];
  const essais = () => {
    const film = window.__creerFilm({ duree: tp(39), css: `${CSS}
      .jeu.defi { max-height: 84dvh !important; }
      .jeu.defi[data-phase="fin"] :is(.defi-boutons, .defi-monde, .defi-barres) { display: none !important; }` });
    const { quand, toucher } = film;
    for (const e of ESSAIS) {
      if (e.vue) quand(tp(e.appui) - 1.0, () => M().jumpTo({ center: [e.vue[0], e.vue[1]], zoom: e.vue[2], padding: MARGE }));
      toucher(tp(e.appui), surCarte(e.ll), 'telephone');
      quand(tp(e.appui), () => appuiCarte(e.ll));
      toucher(tp(e.valide), () => milieu(defi('.jeu-action')), 'telephone');
      quand(tp(e.valide), () => defi('.jeu-action').click());
    }
    film.exposer({
      async preparer() {
        const jour = Math.floor((Date.now() + 9 * 3600e3 - Date.parse('2026-10-13')) / 864e5);
        try { localStorage.setItem('defiStats', JSON.stringify({ joues: 9, trouves: 8, serie: 6, record: 6, dernierTrouve: jour - 1, repartition: [0, 1, 2, 3, 2, 0, 1] })); } catch { /* */ }
        document.getElementById('btn-defi').click();
        await attendre(() => defi('.jeu-action') && !defi('.jeu-action').closest('section').hidden);
        await att(300);
        defi('.jeu-action').click(); // Jouer
        await attendre(() => defi('.jeu-photo').complete && defi('.jeu-photo').getAttribute('src'));
        await att(2300);
        // les tuiles des vues de chaque essai, puis retour
        const c = M().getCenter(), z = M().getZoom(), b = M().getBearing(), p = M().getPitch();
        const marge0 = M().getPadding();
        for (const e of ESSAIS) if (e.vue) { M().jumpTo({ center: [e.vue[0], e.vue[1]], zoom: e.vue[2], padding: MARGE }); await tuiles(5000); }
        M().jumpTo({ center: c, zoom: z, bearing: b, pitch: p, padding: marge0 });
        await tuiles();
      },
    });
    return film;
  };

  window.__plansSupp = { 'jd-1': manche(0, 3.4), 'jd-2': manche(1, 2.4), 'jd-3': manche(2, 1.4), 'jd-score': score, 'df-essais': essais };
})();
