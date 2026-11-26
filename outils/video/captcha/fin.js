// ================================================================
//  La prise de carte de l'écran de fin des intros « captcha » (2026-11-26), sur le moteur des vidéos d'Halloween
//  (halloween/plans.js : window.__planMoteur.plan). fabriquer.py met le lieu dans window.__CAP ({ plan, lng, lat, duree }).
//  La caméra tourne lentement autour du lieu, de près (le relief et ses modèles 3D), son épingle seule (les autres et tous les
//  noms cachés) ; le lieu un peu au-dessus du milieu, entre la phrase du haut et l'adresse du bas.
// ================================================================
(() => {
  const { plan } = window.__planMoteur;
  const c = window.__CAP;
  const map = window.carte;
  const CAP0 = 18, TOUR = 9; // degrés, degrés par seconde
  const BAS = 120; // px CSS d'une page de 432 × 768 : le centre de la caméra remonte de BAS / 2

  function lancer() {
    const cles = [];
    for (let t = 0; t <= c.duree + 0.2 + 1e-6; t += 1 / 30) {
      const u = t / (c.duree + 0.2);
      cles.push([t, c.lng, c.lat, 12.1 + 0.3 * u, 54, CAP0 + TOUR * t]);
    }
    const css = `.repere:not(.cap-vu) { visibility: hidden !important; } .repere-nom { display: none !important; }`;
    const film = plan({ duree: c.duree + 0.2, cles, css, marge: { bottom: BAS } });
    // l'épingle du lieu : le repère dont la position (le second translate que MapLibre lui donne) est celle du lieu à l'écran
    // (comme daily/plans.js) ; le relief la remonte un peu, d'où le poids plus faible de l'écart vertical
    let epingle = null;
    film.chaqueImage(() => {
      if (!epingle?.isConnected) {
        const p = map.project([c.lng, c.lat]);
        let dmin = 70;
        for (const el of document.querySelectorAll('.repere')) {
          const m = [...el.style.transform.matchAll(/translate\(([-\d.]+)px, ([-\d.]+)px\)/g)].pop();
          if (!m) continue;
          const d = Math.abs(+m[1] - p.x) + 0.3 * Math.abs(+m[2] - p.y);
          if (d < dmin) { dmin = d; epingle = el; }
        }
      }
      epingle?.classList.add('cap-vu');
    });
  }

  window.__plansSupp = { [c.plan]: () => { lancer(); } };
})();
