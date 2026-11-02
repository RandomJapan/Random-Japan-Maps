// ================================================================
//  Les plans de la carte pour la vidéo « jarre » (2026-11-02) : ce qu'il y a dans la jarre, et ce qu'on peut y faire. En
//  9:16, sur une page de téléphone 540 × 960 à ×2, à 60 images/s, de jour, avec le moteur de halloween/plans.js
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
    body.ja-cache .repere-tete { opacity: 0 !important; }
    body.ja-cache .repere { pointer-events: none; }`;

  const tetes = () => [...document.querySelectorAll('.repere-tete')].filter((e) => {
    const r = e.getBoundingClientRect();
    return r.width && r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight;
  });

  /** Les épingles à l'écran surgissent et rebondissent, du milieu de l'écran vers les bords. */
  function surgir(etalement = 0.55) {
    document.body.classList.remove('ja-cache');
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

  const typhon = async () => { try { (await import('/mer.js')).jouerTyphon(); } catch { /* pas de chemin : pas de typhon */ } };

  // la route des favoris : tracée par le vrai serveur d'itinéraires (le panneau, « Tracer »), elle est retirée de la carte
  // puis se dessine pendant la prise, le long de ses vraies routes (la ligne coupée à chaque image ; les temps de trajet
  // et les numéros des étapes arrivent quand elle les atteint)
  const CSS_ROUTE = `
    #panneau-favoris, .resume-itineraire, .pres-trajet { display: none !important; }
    .temps-trajet { transition: none !important; }
    body.avec-itineraire .repere:not(.etape) { opacity: 0.22 !important; }`;
  let tracer = null;
  async function preparerRoute() {
    document.getElementById('btn-favoris').click();
    await new Promise((ok) => setTimeout(ok, 500));
    document.querySelector('[data-tracer]').click();
    for (let i = 0; i < 300 && !document.querySelector('.temps-trajet'); i++) await new Promise((ok) => setTimeout(ok, 100));
    await new Promise((ok) => setTimeout(ok, 800));
    const map = window.carte, source = map.getSource('itineraire'), donnees = source.serialize().data;
    // (le trait plus épais que sur le site : il se lit sur un téléphone, dans le coin d'une vidéo)
    map.setPaintProperty('itineraire', 'line-width', 7);
    map.setPaintProperty('itineraire-fond', 'line-width', 12);
    // (les lignes bout à bout, dans l'ordre du voyage : chaque point garde sa distance depuis le départ)
    const km = (a, b) => Math.hypot((a[0] - b[0]) * Math.cos((a[1] * Math.PI) / 180), a[1] - b[1]) * 111;
    let total = 0;
    const morceaux = donnees.features.map((f) => {
      const c = f.geometry.coordinates, d = [total];
      for (let i = 1; i < c.length; i++) d.push(d[i - 1] + km(c[i - 1], c[i]));
      total = d[d.length - 1];
      return { f, c, d };
    });
    const etapes = [...document.querySelectorAll('.repere.etape .repere-tete'), ...document.querySelectorAll('.temps-trajet')];
    const coupe = (u) => {
      const limite = total * u, features = [];
      for (const { f, c, d } of morceaux) {
        if (d[0] >= limite) break;
        let n = d.findIndex((v) => v > limite);
        if (n < 0) { features.push(f); continue; }
        const r = (limite - d[n - 1]) / (d[n] - d[n - 1] || 1);
        const bout = [c[n - 1][0] + (c[n][0] - c[n - 1][0]) * r, c[n - 1][1] + (c[n][1] - c[n - 1][1]) * r];
        features.push({ ...f, geometry: { type: 'LineString', coordinates: [...c.slice(0, n), bout] } });
      }
      return { type: 'FeatureCollection', features };
    };
    for (const e of document.querySelectorAll('.temps-trajet')) e.style.opacity = 0;
    source.setData(coupe(0));
    // le dessin dure de t0 à t1 (secondes de la prise)
    tracer = (t, t0, t1) => {
      const u = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
      const e = u * u * (3 - 2 * u); // (la ligne accélère puis ralentit)
      source.setData(coupe(e));
      const temps = [...document.querySelectorAll('.temps-trajet')];
      temps.forEach((el, i) => { el.style.opacity = e > (i + 0.5) / temps.length ? 1 : 0; });
      return etapes;
    };
  }

  window.__plansSupp = {
    // tout le Japon : les points surgissent du milieu vers les bords dès la première image montrée (t = 0,1 ; les morceaux
    // de la jarre s'écartent) ; la caméra fonce sur le centre du Honshū, puis plonge sur le mont Fuji
    'ja-plongee': () => plan({
      duree: 3.4, css: CSS,
      avant: async () => document.body.classList.add('ja-cache'),
      cles: [
        [0, 137.45, 37.1, 4.45, 24, 38],
        [0.62, 137.5, 36.75, 4.8, 28, 36],
        [1.25, 137.95, 35.95, 6.9, 46, 26],
        [1.75, 138.3, 35.6, 8.3, 58, 18],
        [2.55, 138.72, 35.3, 10.75, 72, 4],
        [3.4, 138.735, 35.29, 11.1, 74, -8],
      ],
      actions: [[0.1, () => surgir(0.5)]],
    }),
    // Itsukushima, de près : son torii en 3D, son épingle (touchée au montage, sa fiche s'y déplie)
    'ja-itsuku': () => plan({
      duree: 3.2,
      cles: [[0, 132.3198, 34.2962, 12.75, 58, 18], [3.2, 132.3198, 34.2962, 13.05, 60, 34]],
    }),
    // le dé : la caméra vole au-dessus de la mer jusqu'à Aogashima, puis tourne autour
    'ja-vol': () => plan({
      duree: 2.6,
      cles: [
        [0, 136.3, 34.75, 6.3, 34, 32],
        [0.21, 136.3, 34.75, 6.3, 34, 32], // (le doigt touche le bouton à t = 0,21 : le vol part)
        [0.62, 138.6, 33.35, 7.4, 42, 34],
        [0.98, 139.768, 32.456, 13.0, 56, 40],
        [2.6, 139.7695, 32.4515, 13.75, 62, 72],
      ],
    }),
    // la mer vivante : le typhon, lancé avant de filmer (il a déjà grandi)
    'ja-mer': () => plan({
      duree: 2.0, avant: async () => { await typhon(); await new Promise((ok) => setTimeout(ok, 2500)); },
      cles: [[0, 141.1, 33.1, 5.5, 36, 34], [2.0, 141.05, 33.15, 5.62, 38, 37]],
    }),
    // la légende d'Orochi, le serpent à huit têtes (touchée au montage à t = 0,35, sa bulle s'ouvre) ; l'interface
    // de la page, mais sans ses boutons
    'ja-legende': () => plan({
      duree: 2.4, interface: true,
      css: `.entete, .filtres, .langues, .musique, .controles, .barre-mobile, body.en-visite .bandeau, .maplibregl-ctrl-bottom-left { display: none !important; }`,
      cles: [[0, 133.0, 35.27, 10.5, 50, 0], [2.4, 133.0, 35.28, 10.75, 52, 3]],
      actions: [[0.35, async () => (await import('/legendes.js')).ouvrirLegende('orochi')]],
    }),
    // les favoris (rushes.py les range dans le navigateur) : la route se dessine de Himeji au mont Fuji (t = 0,1 → 1,5),
    // la caméra vise le long de la route, comme l'axe du Japon
    'ja-route': () => {
      const film = plan({
        duree: 2.3, css: CSS_ROUTE,
        avant: preparerRoute,
        cles: [[0, 136.55, 35.0, 7.1, 48, 80], [2.3, 136.72, 35.06, 7.2, 50, 76]],
      });
      film.chaqueImage((t) => tracer?.(t, 0.1, 1.5));
      return film;
    },
  };
})();
