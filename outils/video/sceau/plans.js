// ================================================================
//  Les plans de la carte pour la vidéo « sceau » (2026-11-08) : ce qu'il y a dans la lettre cachetée, et ce qu'on peut y
//  faire. En 9:16, sur une page de téléphone 540 × 960 à ×2, à 60 images/s, avec le moteur de halloween/plans.js
//  (window.__planMoteur : caméra par clés [t, lng, lat, zoom, inclinaison, cap], hauteur du centre figée, actions), injecté
//  avant ce fichier par rushes.py. Chaque prise est calée sur le montage (montage/src/temps.ts).
//  Les épingles surgissent avec le ressort « nerveux » de la vidéo « tunnel » (raideur 380, amortissement 18).
// ================================================================
(() => {
  const { plan } = window.__planMoteur;

  /** Le ressort amorti : 0 → 1 en dépassant (x(t) = 1 − e^(−ζωt)(cos ω_d t + ζω/ω_d sin ω_d t)). */
  function ressort(k, c, t) {
    const w = Math.sqrt(k), z = c / (2 * w), wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
  }
  const DUREE_RESSORT = 0.7; // s : il est posé (à 1 % près) en 0,45 s
  const COURBE = `linear(${Array.from({ length: 43 }, (_, i) => ressort(380, 18, (i / 42) * DUREE_RESSORT).toFixed(4)).join(', ')})`;

  // les épingles cachées avant leur apparition
  const CSS = `
    body.sc-cache .repere-tete { opacity: 0 !important; }
    body.sc-cache .repere { pointer-events: none; }`;

  const tetes = () => [...document.querySelectorAll('.repere-tete')].filter((e) => {
    const r = e.getBoundingClientRect();
    return r.width && r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight;
  });

  /** Les épingles à l'écran surgissent et rebondissent, du milieu de l'écran vers les bords. */
  function surgir(etalement = 0.55) {
    document.body.classList.remove('sc-cache');
    const cx = innerWidth / 2, cy = innerHeight * 0.48, liste = tetes();
    const loin = Math.max(1, ...liste.map((e) => { const r = e.getBoundingClientRect(); return Math.hypot(r.x - cx, r.y - cy); }));
    for (const e of liste) {
      const r = e.getBoundingClientRect();
      const delai = (Math.hypot(r.x - cx, r.y - cy) / loin) * etalement * 1000;
      e.style.transformOrigin = '0 calc(100% + 8px)'; // la pointe de l'épingle (transform : translateX(-50%))
      e.animate([{ scale: '0', translate: '0 -26px' }, { scale: '1', translate: '0 0' }],
        { duration: DUREE_RESSORT * 1000, delay: delai, easing: COURBE, fill: 'backwards' });
      e.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120, delay: delai, fill: 'backwards' });
    }
  }

  // les dunes de Tottori (leur épingle, sur la carte : 鳥取砂丘)
  const DUNES = [134.2277, 35.5413];
  // le château de Himeji, de jour puis de nuit (le même cadre : le montage passe de l'un à l'autre)
  const HIMEJI = [[0, 134.6918, 34.8345, 13.45, 60, 14], [2.4, 134.6915, 34.835, 13.65, 62, 22]];

  // une grande ville ouverte (Fukuoka) : son contour à l'encre, ses hachures sur le sol, les points numérotés de son
  // carrousel. La fiche est cachée (le lecteur TikTok ne joue pas ici) ; on garde la carte, les épingles et les points.
  const CSS_VILLE = `
    #fiche, .maplibregl-popup, .bulle-legende { display: none !important; }
    .entete, .filtres, .langues, .musique, .controles, .barre-mobile, .heure-japon, .toast, .bandeau, body.en-visite .bandeau, .maplibregl-ctrl-bottom-left { display: none !important; }`;

  window.__plansSupp = {
    // tout le Japon, cadré comme la carte imprimée dans la lettre : les points surgissent du milieu vers les bords dès la
    // première image montrée ; la caméra fonce vers l'ouest, puis plonge sur les dunes de Tottori, au bord de la mer du Japon
    'sc-plongee': () => plan({
      duree: 3.4, css: CSS,
      avant: async () => document.body.classList.add('sc-cache'),
      cles: [
        [0, 137.45, 37.1, 4.45, 24, 38],
        [0.62, 137.1, 36.65, 4.8, 28, 32],
        [1.25, 135.6, 35.95, 6.9, 44, 18],
        [1.75, 134.75, 35.68, 8.3, 54, 8],
        [2.55, 134.229, 35.521, 11.7, 62, -2],
        [3.4, 134.2277, 35.526, 12.25, 62, -8],
      ],
      actions: [[0.1, () => surgir(0.5)]],
    }),
    // les dunes de près, la mer derrière : leur épingle (touchée au montage, sa fiche s'y déplie)
    'sc-tottori': () => plan({
      duree: 3.2,
      cles: [[0, DUNES[0], 35.5335, 13.25, 58, -8], [3.2, DUNES[0] + 0.001, 35.5338, 13.5, 60, 4]],
    }),
    // Fukuoka : la ville s'ouvre pendant la prise (son contour, ses hachures, ses 8 lieux numérotés)
    'sc-ville': () => plan({
      duree: 2.6, interface: true, css: CSS_VILLE,
      cles: [[0, 130.385, 33.565, 10.55, 46, -10], [2.6, 130.388, 33.57, 10.8, 50, -4]],
      actions: [[0.25, () => { location.hash = '#ville-fukuoka'; }]],
    }),
    // le jour et la nuit (rushes.py : 10:30 et 21:30), le même cadre
    'sc-jour': () => plan({ duree: 2.4, cles: HIMEJI }),
    'sc-nuit': () => plan({ duree: 2.4, cles: HIMEJI }),
  };
})();
