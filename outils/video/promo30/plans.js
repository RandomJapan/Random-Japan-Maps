// ================================================================
//  Les plans de la carte pour la vidéo promo de 30 s (2026-10-21), en 16:9 : le moteur de halloween/plans.js
//  (window.__planMoteur : caméra par clés [t, lng, lat, zoom, inclinaison, cap], hauteur du centre figée, actions),
//  injecté avant ce fichier par rushes.py. Les plans d'Halloween (défilé, chapeaux, toile, chasse) sont repris
//  tels quels de videos/carte/halloween/public/rushes.
// ================================================================
(() => {
  const { plan } = window.__planMoteur;
  const typhon = async () => { try { (await import('/mer.js')).jouerTyphon(); } catch { /* pas de chemin : pas de typhon */ } };
  // les feux d'artifice s'arrêtent quand la carte bouge (particules.js : jouer(false)) ; ici la caméra bouge à chaque
  // image : on les laisse jouer, et ils tirent déjà depuis quelques secondes quand on filme
  const feux = async () => {
    let toile = null;
    for (let i = 0; i < 100 && !(toile = document.querySelector('canvas.hanabi')); i++) await new Promise((ok) => setTimeout(ok, 100));
    if (!toile) return;
    toile.jouer(true);
    toile.jouer = () => {};
    await new Promise((ok) => setTimeout(ok, 3000));
  };
  // le même trajet pour les quatre saisons, au-dessus de Higashiyama (Kyoto) : les temples, les taches de saison
  const KYOTO = [[0, 135.783, 34.993, 11.85, 60, -26], [3, 135.785, 34.996, 12.15, 62, -10]];

  window.__plansSupp = {
    // la plongée : tout le Japon, puis le château de Himeji en 3D ; la caméra y arrive déjà en tournant
    'p-plongee': () => plan({
      duree: 6.5,
      cles: [
        [0, 137.6, 36.4, 4.85, 22, -6],
        [1.2, 136.2, 35.5, 6.1, 32, 0],
        [2.5, 135.0, 35.0, 8.4, 46, 10],
        [3.7, 134.73, 34.86, 10.9, 55, 22],
        [5.0, 134.697, 34.8415, 12.55, 61, 34],
        [6.5, 134.694, 34.8396, 13.05, 62, 50],
      ],
      // en vertical : le Japon debout comme sur un téléphone, qui tourne en descendant ; le château plus bas dans
      // l'image (les mots de la voix au-dessus)
      v: {
        marge: { top: 380 },
        cles: [
          [0, 137.4, 36.6, 4.5, 20, 36], [1.2, 136.2, 35.6, 5.85, 32, 26], [2.5, 135.0, 35.0, 8.3, 46, 16],
          [3.7, 134.73, 34.86, 10.8, 55, 22], [5.0, 134.697, 34.8415, 12.5, 61, 34], [6.5, 134.694, 34.8396, 13.0, 62, 50],
        ],
      },
    }),
    // la mer vivante : le typhon, la houle, les bateaux (lancé avant de filmer : il a déjà grandi)
    'p-mer': () => plan({
      duree: 3.5, avant: async () => { await typhon(); await new Promise((ok) => setTimeout(ok, 2500)); },
      cles: [[0, 136.2, 33.6, 5.55, 36, -4], [3.5, 136.0, 33.7, 5.7, 38, 2]],
      v: { cles: [[0, 135.9, 34.0, 4.9, 34, 34], [3.5, 135.8, 34.1, 5.02, 36, 38]] },
    }),
    'p-printemps': () => plan({ duree: 3, cles: KYOTO }),
    'p-ete': () => plan({ duree: 3, cles: KYOTO, avant: feux }),
    'p-automne': () => plan({ duree: 3, cles: KYOTO }),
    // l'hiver : Kyoto n'a presque pas de neige (la carte suit la réalité) ; Iiyama (Nagano), sous la neige en février
    'p-hiver': () => plan({ duree: 3, cles: [[0, 138.362, 36.842, 11.6, 60, -26], [3, 138.364, 36.846, 11.9, 62, -10]] }),
  };
})();
