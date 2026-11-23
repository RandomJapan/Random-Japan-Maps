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

  window.__plansSupp = { 'cv-cases': cases };
})();
