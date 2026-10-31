// ================================================================
//  Les plans de la carte pour la vidéo « minuit » (2026-10-31, la dernière nuit d'Halloween) : sept prises en 9:16,
//  la nuit, tout l'événement allumé (chapeaux de sorcière, chauves-souris, hitodama, défilé des cent démons, chasse
//  aux yōkai), à 60 images/s, avec le moteur de halloween/plans.js (window.__planMoteur : caméra par clés
//  [t, lng, lat, zoom, inclinaison, cap], hauteur du centre figée, actions), injecté avant ce fichier par rushes.py.
//  Chaque prise est calée sur le montage (montage/src/temps.ts) : ses actions tombent aux bonnes images.
//  Les chapeaux tombent sur les épingles avec le ressort « nerveux » de la vidéo « tunnel » (raideur 380,
//  amortissement 18), échantillonné dans une courbe CSS linear() ; la page est au ralenti (ralenti.js), ses
//  animations aussi.
// ================================================================
(() => {
  const { plan, voler } = window.__planMoteur;

  /** Le ressort amorti : 0 → 1 en dépassant (x(t) = 1 − e^(−ζωt)(cos ω_d t + ζω/ω_d sin ω_d t)). */
  function ressort(k, c, t) {
    const w = Math.sqrt(k), z = c / (2 * w), wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
  }
  const DUREE_RESSORT = 0.7; // s : il est posé (à 1 % près) en 0,45 s
  const COURBE = `linear(${Array.from({ length: 43 }, (_, i) => ressort(380, 18, (i / 42) * DUREE_RESSORT).toFixed(4)).join(', ')})`;

  // les chapeaux cachés avant qu'ils tombent ; les épingles et leurs chapeaux un peu plus grands (on les voit de loin)
  const CSS = `
    body.mn-sans-chapeau .repere-tete::after { opacity: 0 !important; }`;

  const tetes = () => [...document.querySelectorAll('.repere-tete')].filter((e) => {
    const r = e.getBoundingClientRect();
    return r.width && r.right > -40 && r.left < innerWidth + 40 && r.bottom > -40 && r.top < innerHeight + 40;
  });

  /** Les chapeaux de sorcière tombent sur les épingles à l'écran, du milieu vers les bords, et rebondissent. */
  function chapeaux(etalement = 0.6) {
    const cx = innerWidth / 2, cy = innerHeight * 0.5, liste = tetes();
    const d = (e) => { const r = e.getBoundingClientRect(); return Math.hypot(r.x + r.width / 2 - cx, r.y - cy); };
    const loin = Math.max(1, ...liste.map(d));
    for (const e of liste) {
      const delai = (d(e) / loin) * etalement * 1000;
      e.animate([{ translate: '0 -38px', scale: '1.8', opacity: 0 }, { opacity: 1, offset: 0.12 }, { translate: '0 0', scale: '1', opacity: 1 }],
        { duration: DUREE_RESSORT * 1000, delay: delai, easing: COURBE, fill: 'backwards', pseudoElement: '::after' });
    }
    document.body.classList.remove('mn-sans-chapeau');
  }

  /** Minuit : tout ce qu'Halloween a posé s'en va d'un coup (ce que fait halloween.js eteindre(), dont l'instance
   *  n'est pas accessible d'ici) : les chapeaux, le défilé, les yōkai cachés, les hitodama, les chauves-souris. */
  function minuit() {
    document.body.classList.remove('halloween');
    for (const s of ['.defile-yokai', 'canvas.hitodama', '.yokai-cache', '.chauve-souris', '.toile-coin', '.chat-noir']) {
      for (const e of document.querySelectorAll(s)) e.style.setProperty('display', 'none', 'important');
    }
  }

  window.__plansSupp = {
    // l'accroche (0 → 2,95 s du montage) : le défilé dans Kyoto, d'assez près, en bas de l'image (le titre et
    // l'horloge prennent le haut et le milieu) ; la caméra le suit
    'mn-accroche': () => plan({
      duree: 3.4, avance: 9, suivre: true, cheminLarge: 960, marge: { top: 260 },
      cles: [[0, 135.772, 34.99, 11.9, 57, -10], [3.4, 135.772, 34.99, 12.15, 60, -4]],
    }),
    // les chapeaux (2,55 → 5,15 s) : le Kansai et ses épingles ; les chapeaux tombent à t = 0,5 (3,05 s)
    'mn-chapeaux': () => plan({
      duree: 3.2, css: CSS,
      avant: async () => document.body.classList.add('mn-sans-chapeau'),
      cles: [[0, 135.46, 34.85, 7.6, 44, 22], [3.2, 135.52, 34.86, 8.0, 50, 12]],
      actions: [[0.5, () => chapeaux()]],
    }),
    // le défilé en entier (4,85 → 9,2 s), derrière le panneau d'Halloween puis net quand il part ; un vol de
    // chauves-souris
    'mn-defile': () => plan({
      duree: 4.4, avance: 12, suivre: true, cheminLarge: 960,
      cles: [[0, 135.776, 34.996, 10.75, 58, -10], [4.4, 135.772, 35.0, 10.9, 60, -4]],
      actions: [[2.3, voler]],
    }),
    // trois gros plans (9 → 12 s, une seconde chacun) : la caméra suit la lanterne, puis l'ombrelle, puis le kappa
    // (le montage prend t = 1 → 2, 3,6 → 4,6 et 6,2 → 7,2 ; les yōkai entrent un par un dans l'image : après 7 s de
    // défilé, les cinq premiers seulement) ; la boîte de chaque yōkai est notée (positions)
    'mn-proche': () => plan({
      duree: 7.4, avance: 7, cheminLarge: 960,
      cles: [[0, 135.772, 34.99, 12.15, 60, -8]],
      suivre: [[0, 0], [2.4, 2], [5.0, 4]],
    }),
    // la chasse (11,85 → 15,2 s) : six yōkai déjà trouvés (rushes.py), on touche Enma, le septième, à t = 0,65 (12,5 s) :
    // sa bulle, puis « Hunt complete! » 1,6 s plus tard ; l'interface du téléphone à l'écran
    'mn-chasse': () => plan({
      duree: 3.6, interface: true, css: '.legende:not(.yokai-cache) { display: none !important; }',
      cles: [[0, 135.80, 34.99, 10.8, 50, 0], [3.6, 135.803, 34.993, 10.86, 51, 0]],
      actions: [[0.65, () => window.__toucherYokai('enma')]],
    }),
    // minuit (15 → 18,3 s) : le même défilé que dans l'accroche, un peu plus loin, sous les temples et leurs épingles à
    // chapeau ; à t = 1,5 (16,5 s, la cloche) tout disparaît
    'mn-minuit': () => plan({
      duree: 3.4, avance: 9.5, suivre: true, cheminLarge: 960, marge: { top: 200 },
      cles: [[0, 135.772, 34.99, 11.55, 57, -12], [3.4, 135.772, 34.99, 11.7, 59, -6]],
      actions: [[1.5, minuit]],
    }),
    // la fin (17,9 → 22,5 s) : tout le Japon la nuit, Halloween allumé (flou et assombri au montage)
    'mn-fin': () => plan({
      duree: 4.8,
      cles: [[0, 137.0, 36.0, 4.95, 34, 34], [4.8, 137.15, 36.25, 4.88, 31, 38]],
    }),
  };
})();
