// ================================================================
//  Les plans de la carte pour la vidéo « tunnel » (2026-10-21) : un TikTok → le profil → le lien de la bio → la
//  carte. Trois prises en 9:16, sur une page de téléphone 540 × 960 à ×2 (1080 × 1920), à 60 images/s, avec le
//  moteur de halloween/plans.js (window.__planMoteur : caméra par clés [t, lng, lat, zoom, inclinaison, cap],
//  hauteur du centre figée, actions), injecté avant ce fichier par rushes.py.
//  Les épingles rebondissent dans la page même, avec le ressort « nerveux » validé par le propriétaire (raideur
//  380, amortissement 18), échantillonné dans une courbe CSS linear() ; la page est au ralenti (ralenti.js), ses
//  animations aussi.
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

  // les épingles cachées avant leur apparition ; les particules de saison (feuilles d'érable) aussi : sur la mer
  // autour d'Aogashima, elles n'avaient rien à faire
  const CSS = `
    body.tn-cache .repere-tete { opacity: 0 !important; }
    .saison { display: none !important; }`;

  const tetes = () => [...document.querySelectorAll('.repere-tete')].filter((e) => {
    const r = e.getBoundingClientRect();
    return r.width && r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight;
  });

  /** Les épingles à l'écran surgissent et rebondissent, du milieu de l'écran vers les bords. */
  function surgir(etalement = 0.55) {
    document.body.classList.remove('tn-cache');
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

  /** Les épingles à l'écran rentrent dans la carte (puis fait() les retire vraiment). Leurs animations sont
   *  annulées ensuite : les épingles retirées sont sorties de la page, et gardaient sinon leur dernière image
   *  (invisibles) quand elles revenaient. */
  function rentrer(fait) {
    const animations = tetes().map((e) => {
      e.style.transformOrigin = '0 calc(100% + 8px)';
      return e.animate([{ scale: '1', opacity: 1 }, { scale: '0', opacity: 0 }], { duration: 160, easing: 'cubic-bezier(.5, 0, .9, .4)', fill: 'forwards' });
    });
    setTimeout(() => {
      fait();
      for (const a of animations) a.cancel();
    }, 170);
  }

  /** Coche ou décoche la catégorie de ce nom dans le menu des catégories (sans l'ouvrir). */
  function categorie(nom) {
    const ligne = [...document.querySelectorAll('#liste-categories .ligne-categorie')].find((li) => li.querySelector('.nom-cat')?.textContent.trim() === nom);
    ligne?.querySelector('input').click();
  }

  window.__plansSupp = {
    // tout le Japon et ses 140 points ; les points s'effacent pendant que la caméra fonce sur le centre du Honshū,
    // puis les épingles surgissent (à 13 s dans la vidéo : t = 4,2)
    'tn-japon': () => plan({
      duree: 9.0,
      css: CSS,
      cles: [
        [0, 137.6, 37.0, 4.5, 26, 40],
        [2.9, 137.55, 36.85, 4.85, 30, 35],
        [3.3, 137.5, 36.55, 5.25, 33, 32],
        [3.95, 137.6, 35.95, 6.35, 42, 30],
        [9.0, 137.43, 35.84, 6.65, 47.5, 20],
      ],
      actions: [
        [3.15, () => {
          for (const e of tetes()) e.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: 'forwards' });
          setTimeout(() => {
            document.body.classList.add('tn-cache');
            for (const e of document.querySelectorAll('.repere-tete')) for (const a of e.getAnimations()) a.cancel();
          }, 160);
        }],
        [4.2, () => surgir()],
      ],
    }),
    // Aogashima : la caméra plonge d'au-dessus de la mer sur l'île, puis tourne autour (la fiche du lieu se déplie
    // par-dessus au montage)
    'tn-aogashima': () => plan({
      duree: 5.2,
      css: CSS,
      cles: [
        [0, 139.71, 32.6, 9.4, 34, -12],
        [0.85, 139.762, 32.458, 12.35, 56, 14],
        [5.2, 139.762, 32.457, 12.9, 62.5, 78],
      ],
    }),
    // l'ouest du Japon : toutes les épingles, puis « tout masquer » (t = 0,95) et les sanctuaires seuls (t = 1,45),
    // au rythme des appuis du montage sur le menu ; la caméra recule ensuite vers tout le Japon (la fin de la
    // vidéo), où toutes les épingles reviennent (t = 3,2)
    'tn-filtres': () => plan({
      duree: 8.4,
      css: CSS,
      cles: [
        [0, 133.45, 34.33, 6.2, 40, 26],
        [3.0, 133.7, 34.42, 6.38, 45, 18],
        [4.4, 134.7, 35.1, 5.6, 38, 26],
        [8.4, 137.3, 36.6, 4.6, 28, 38],
      ],
      actions: [
        [0.95, () => rentrer(() => document.getElementById('btn-rien').click())],
        [1.45, () => { categorie('Shrines'); setTimeout(() => surgir(0.3), 30); }],
        [3.2, () => { document.getElementById('btn-tout').click(); setTimeout(() => surgir(0.5), 30); }],
      ],
    }),
  };
})();
