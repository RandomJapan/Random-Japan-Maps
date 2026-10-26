// ================================================================
//  La prise de la carte pour la vidéo 1 de la balade 3D (2026-10-26) : la caméra plonge sur Itsukushima, jusqu'au grand
//  torii dans la mer ; la fiche du lieu (et son bouton « Visit in 3D ») se déplie par-dessus au montage (captures.py).
//  Sur une page de téléphone 540 × 960 à ×2, à 60 images/s, avec le moteur de halloween/plans.js (window.__planMoteur :
//  caméra par clés [t, lng, lat, zoom, inclinaison, cap], hauteur du centre figée), injecté avant ce fichier par carte.py.
// ================================================================
(() => {
  const { plan } = window.__planMoteur;
  // (pas de feuilles de saison sur la mer de Seto)
  const CSS = '.saison { display: none !important; }';
  window.__plansSupp = {
    'ca-itsukushima': () => plan({
      duree: 4.6,
      css: CSS,
      cles: [
        [0, 133.1, 34.62, 7.3, 32, 10],
        [1.9, 132.36, 34.32, 11.4, 46, 4],
        [4.6, 132.3198, 34.2949, 14.1, 54, 0],
      ],
    }),
  };
})();
