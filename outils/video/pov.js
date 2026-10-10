// ================================================================
//  Film « POV voyageur » (9:16, 30 s), dans le style d'une vidéo TikTok : sous-titres blancs sur fond noir,
//  un doigt qui se sert de la carte comme un visiteur, des coupes sur le rythme.
//  « POV: you plan your Japan trip in 30 seconds » : 1. on garde 4 lieux en favoris (Kinkaku-ji par la
//  recherche, puis Sanjūsangen-dō, Tōdai-ji et le château de Himeji) ; 2. l'itinéraire en voiture, avec les
//  temps de trajet ; 3. la visite guidée en 3D de ces lieux ; puis l'adresse.
//  Musique : « Avenue Cafe » de 魔王魂 (Maou Damashii), 118 battements par minute : TEMPS = un battement.
// ================================================================
(() => {
  const film = window.__creerFilm({ duree: 30, css: `
    /* les sous-titres, comme le texte « fond » de TikTok : blanc, gras, sur des pavés noirs arrondis */
    #film .fm-legende { position: absolute; left: 252px; translate: -50% 0; width: 460px; text-align: center; transform-origin: 50% 100%; }
    #film .fm-legende span { padding: 3px 13px 5px; font: 800 27px/1.62 "Noto Sans", sans-serif; color: #fff; background: rgba(10, 10, 10, .86);
      border-radius: 9px; -webkit-box-decoration-break: clone; box-decoration-break: clone; }
    #film .fm-legende.etape span { background: #fff; color: #111; }
    #film .fm-legende.etape em { font-style: normal; color: #a8321f; }
    /* le nombre de favoris : un cœur et un chiffre qui sautent */
    #film .fm-coeurs { position: absolute; left: 252px; top: 262px; translate: -50% 0; display: flex; align-items: center; gap: 8px;
      padding: 6px 16px 6px 12px; border-radius: 30px; background: rgba(10, 10, 10, .86); color: #fff; font: 800 26px/1 "Noto Sans", sans-serif; }
    #film .fm-coeurs i { font-style: normal; font-size: 27px; }
    /* la fin */
    #film .fm-voile { position: absolute; inset: 0; background: linear-gradient(rgba(0, 0, 0, .1), rgba(0, 0, 0, .55)); }
    #film .fm-fin { position: absolute; left: 252px; top: 300px; translate: -50% 0; width: 470px; text-align: center; }
    #film .fm-fin .fm-adresse { display: inline-flex; align-items: center; gap: 12px; margin-top: 22px; padding: 12px 22px 12px 12px; border-radius: 40px;
      background: #a8321f; color: #f6eedb; font: 800 23px/1 "Noto Sans", sans-serif; box-shadow: 0 6px 18px rgba(0, 0, 0, .45); }
    #film .fm-fin .fm-adresse img { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 2px solid #f6eedb; }
    #film .fm-fin .fm-bio { margin-top: 16px; font: 800 21px/1.2 "Noto Sans", sans-serif; color: #fff; text-shadow: 0 2px 8px rgba(0, 0, 0, .7); }
    #film .fm-fin .fm-credit { margin-top: 12px; font: 11px/1.3 "Noto Sans", sans-serif; color: rgba(255, 255, 255, .85); text-shadow: 0 1px 4px rgba(0, 0, 0, .8); }
  ` });
  const { map, borne, sortie, ressort, f, element, chaqueImage, attendre, tuilesPretes, quand, sansFilmer, $, cliquer, milieu, flash } = film;
  const TEMPS = 60 / 118; // un battement (0,508 s)
  const b = (n) => n * TEMPS; // l'instant du n-ième battement
  const doigt = (de, ou) => film.toucher(de, ou, 'telephone');

  /** Un sous-titre : il apparaît d'un coup (petit rebond), reste, puis disparaît. */
  function legende({ de, a, y, texte, etape = false }) {
    const el = element(`fm-legende${etape ? ' etape' : ''}`, texte.split('\n').map((l) => `<span>${l}</span>`).join('<br>'));
    el.style.top = `${y}px`;
    chaqueImage((t) => {
      el.hidden = t < de || t > a;
      if (el.hidden) return;
      const p = borne((t - de) / 0.22);
      el.style.opacity = f(Math.min(1, p * 2.5));
      el.style.transform = `scale(${f(0.82 + 0.18 * ressort(p), 4)})`;
    });
  }

  // ---------------------------------------------------------------- 0 à 3 s : l'accroche
  legende({ de: b(0), a: b(6) - 0.05, y: 170, texte: 'POV: you plan your\nJapan trip in 30 seconds 🗾' });

  // ---------------------------------------------------------------- 1. Les favoris
  legende({ de: b(6), a: b(26), y: 170, etape: true, texte: '1. Save the places <em>you love</em>' });
  doigt(b(6.3), () => milieu($('#btn-categories')));
  quand(b(6.3), () => cliquer('#btn-categories'));
  // on tape « kinkaku », lettre à lettre
  'kinkaku'.split('').forEach((_, i) => quand(b(7.2) + i * 0.11, () => {
    const champ = $('#recherche');
    champ.value = 'kinkaku'.slice(0, i + 1);
    champ.dispatchEvent(new Event('input', { bubbles: true }));
  }));
  const resultat = () => [...document.querySelectorAll('#resultats button')].find((x) => x.textContent.includes('Kinkaku')) || $('#resultats button');
  doigt(b(9.5), () => milieu(resultat()));
  quand(b(9.5), () => cliquer(resultat()));
  // un cœur pour chaque lieu ; les suivants arrivent par une coupe franche, sur le temps
  const coeurs = element('fm-coeurs', '<i>❤️</i><b>0</b>');
  const [, nbCoeurs] = coeurs.children;
  let n = 0, dernier = -9;
  chaqueImage((t) => {
    coeurs.hidden = t < b(12) || t > b(26);
    if (coeurs.hidden) return;
    const p = borne((t - dernier) / 0.3);
    coeurs.style.transform = `scale(${f(1 + 0.35 * Math.sin(Math.PI * p) * (1 - p), 3)})`;
  });
  function coeur(a) {
    doigt(a, () => milieu($('#fiche-favori')));
    quand(a, () => {
      cliquer('#fiche-favori');
      n++;
      nbCoeurs.textContent = n;
      dernier = film.t();
    });
  }
  coeur(b(12));
  for (const [i, id] of [[14, 'sanjusangen-do'], [18, 'todai-ji-daibutsu-den'], [22, 'himeji-castle']].map(([k, x]) => [b(k), x])) {
    flash(i, 0.7, 0.16);
    sansFilmer(i, async () => {
      location.hash = `#${id}`;
      await attendre(0.3);
      await new Promise((ok) => { if (!map.isMoving()) ok(); else map.once('moveend', ok); setTimeout(ok, 8000); });
      await tuilesPretes(5);
      await attendre(0.6); // la fiche a fini de s'ouvrir
    });
    coeur(i + b(1.5));
  }

  // ---------------------------------------------------------------- 2. L'itinéraire
  legende({ de: b(26), a: b(33), y: 170, etape: true, texte: '2. Get your <em>road trip</em>\n+ driving times' });
  doigt(b(26.2), () => milieu($('#fiche-fermer')));
  quand(b(26.2), () => cliquer('#fiche-fermer'));
  doigt(b(27.4), () => milieu($('#btn-favoris')));
  quand(b(27.4), () => cliquer('#btn-favoris'));
  doigt(b(29.3), () => milieu($('[data-tracer]')));
  quand(b(29.3), () => cliquer('[data-tracer]'));

  // ---------------------------------------------------------------- 3. La visite en 3D
  legende({ de: b(33), a: b(51), y: 170, etape: true, texte: '3. Preview every stop\n<em>in 3D</em>' });
  doigt(b(33.4), () => milieu($('#btn-favoris')));
  quand(b(33.4), () => cliquer('#btn-favoris'));
  doigt(b(35), () => milieu($('[data-visite]')));
  quand(b(35), () => cliquer('[data-visite]'));
  // pas de vue d'ensemble : « suivant », droit vers le premier lieu
  const suivant = () => $('.visite-barre [data-action="suivant"]');
  doigt(b(37.5), () => milieu(suivant()));
  quand(b(37.5), () => cliquer(suivant()));

  // ---------------------------------------------------------------- La fin (sur la visite qui continue)
  (function fin(de) {
    const voile = element('fm-voile');
    legende({ de, a: 31, y: 170, texte: 'Save this for your trip ✈️' });
    const el = element('fm-fin', `
      <div><span class="fm-adresse"><img src="img/logo.jpg" alt="">map.randomjapanplace.com</span></div>
      <div class="fm-bio">Free · 130+ places in 3D · link in bio ↗</div>
      <div class="fm-credit">♪ Avenue Cafe · 魔王魂 Maou Damashii (CC BY 4.0)</div>`);
    const [adresse, bio, credit] = el.children;
    chaqueImage((t) => {
      voile.hidden = el.hidden = t < de;
      if (t < de) return;
      voile.style.opacity = f(sortie(borne((t - de) / 0.5)));
      const pa = borne((t - de - TEMPS) / 0.45);
      adresse.style.opacity = f(Math.min(1, pa * 3));
      adresse.style.transform = `scale(${f(0.5 + 0.5 * ressort(pa), 4)})`;
      for (const [p, d] of [[bio, 2 * TEMPS], [credit, 3 * TEMPS]]) {
        const x = sortie(borne((t - de - d) / 0.35));
        p.style.opacity = f(x);
        p.style.transform = `translateY(${f((1 - x) * 12, 1)}px)`;
      }
    });
  }(b(51)));

  film.exposer({
    async preparer() {
      film.modeFilm(false);
      // la visite : sans les vidéos TikTok (le lecteur ne marche pas dans ce navigateur), 4 s par lieu, en mode film
      $('#visite-video').checked = false;
      $('#visite-video').dispatchEvent(new Event('change'));
      $('#visite-duree').value = '4000';
      $('#visite-film').checked = true;
      const s = document.createElement('style');
      s.textContent = `.legende, .maplibregl-popup { visibility: hidden !important; }`;
      document.head.append(s);
      // repérage : les vues des lieux en cache
      for (const [lng, lat] of [[135.729, 35.039], [135.772, 34.988], [135.840, 34.689], [134.694, 34.839]]) {
        map.jumpTo({ center: [lng, lat], zoom: 12, pitch: 50, bearing: 0 });
        await tuilesPretes(5);
      }
      map.jumpTo({ center: [137.6, 37.3], zoom: 4.5, pitch: 40, bearing: 38 });
      await tuilesPretes(6);
      await attendre(1);
    },
  });
})();
