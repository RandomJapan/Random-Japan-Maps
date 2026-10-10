// ================================================================
//  Film « POV voyageur » (9:16, 30 s), dans le style d'une vidéo TikTok : sous-titres blancs sur fond noir,
//  un doigt qui se sert de la carte comme un visiteur, des coupes sur le rythme.
//  « POV: you plan your Japan trip in 30 seconds » : 1. on garde 3 lieux en favoris (Kinkaku-ji par la
//  recherche, puis le château de Himeji et Kumano Nachi-taisha) ; 2. l'itinéraire en voiture, avec les temps de
//  trajet ; 3. la visite guidée de ces lieux, en 3D et avec la vidéo TikTok de chacun (le propriétaire l'a
//  demandé le 2026-10-10 : tourner.py remplace le lecteur TikTok par un faux qui joue ses fichiers) ; puis l'adresse.
//  Pendant la visite, des coupes franches : on voit le premier vol partir, puis on passe d'une vidéo à la
//  suivante (sous chaque vidéo, le lieu en 3D et la route en rouge).
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
    return el;
  }

  // ---------------------------------------------------------------- 0 à 2,8 s : l'accroche
  legende({ de: b(0), a: b(5.5) - 0.05, y: 170, texte: 'POV: you plan your\nJapan trip in 30 seconds 🗾' });

  // ---------------------------------------------------------------- 1. Les favoris
  legende({ de: b(5.5), a: b(19.5), y: 170, etape: true, texte: '1. Save the places <em>you love</em>' });
  doigt(b(5.8), () => milieu($('#btn-categories')));
  quand(b(5.8), () => cliquer('#btn-categories'));
  // on tape « kinkaku », lettre à lettre
  'kinkaku'.split('').forEach((_, i) => quand(b(6.6) + i * 0.11, () => {
    const champ = $('#recherche');
    champ.value = 'kinkaku'.slice(0, i + 1);
    champ.dispatchEvent(new Event('input', { bubbles: true }));
  }));
  const resultat = () => [...document.querySelectorAll('#resultats button')].find((x) => x.textContent.includes('Kinkaku')) || $('#resultats button');
  doigt(b(8.8), () => milieu(resultat()));
  quand(b(8.8), () => cliquer(resultat()));
  // un cœur pour chaque lieu ; les suivants arrivent par une coupe franche, sur le temps
  const coeurs = element('fm-coeurs', '<i>❤️</i><b>0</b>');
  const [, nbCoeurs] = coeurs.children;
  let n = 0, dernier = -9;
  chaqueImage((t) => {
    coeurs.hidden = t < b(11) || t > b(19.5);
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
  coeur(b(11));
  for (const [i, id] of [[12.5, 'himeji-castle'], [15.5, 'kumano-nachi-taisha']].map(([k, x]) => [b(k), x])) {
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
  legende({ de: b(19.5), a: b(25.5), y: 170, etape: true, texte: '2. Get your <em>road trip</em>\n+ driving times' });
  doigt(b(19.7), () => milieu($('#fiche-fermer')));
  quand(b(19.7), () => cliquer('#fiche-fermer'));
  doigt(b(20.7), () => milieu($('#btn-favoris')));
  quand(b(20.7), () => cliquer('#btn-favoris'));
  doigt(b(22.2), () => milieu($('[data-tracer]')));
  quand(b(22.2), () => cliquer('[data-tracer]'));

  // ---------------------------------------------------------------- 3. La visite, en 3D et en vidéo
  // pendant la visite, le sous-titre passe sous le cadre de la vidéo (en haut de l'écran ; il reste en place, invisible,
  // entre deux lieux)
  const etape3 = legende({ de: b(25.5), a: b(50), y: 170, etape: true, texte: '3. Preview every stop\nin 3D + <em>its video</em>' });
  chaqueImage(() => {
    const cadre = document.body.classList.contains('en-visite') && $('.visite-video');
    const bas = cadre ? cadre.getBoundingClientRect().bottom / film.ECHELLE + 14 : 170;
    etape3.style.top = `${f(Math.max(170, bas), 1)}px`;
  });
  doigt(b(25.8), () => milieu($('#btn-favoris')));
  quand(b(25.8), () => cliquer('#btn-favoris'));
  doigt(b(27.2), () => milieu($('[data-visite]')));
  quand(b(27.2), () => cliquer('[data-visite]'));
  // pas de vue d'ensemble : « suivant », droit vers le premier lieu
  const suivant = () => $('.visite-barre [data-action="suivant"]');
  doigt(b(28.6), () => milieu(suivant()));
  quand(b(28.6), () => cliquer(suivant()));
  // le vol vers le premier lieu : on le voit partir, puis coupe jusqu'à ce que sa vidéo joue
  const videoJoue = () => new Promise((ok) => {
    const fin = performance.now() + 15000;
    const voir = () => ($('.visite-video.visible.joue') || performance.now() > fin ? ok() : setTimeout(voir, 20));
    voir();
  });
  flash(b(29.3), 0.6, 0.16);
  sansFilmer(b(29.3), videoJoue);
  // d'un lieu au suivant : quand le cadre de la vidéo se ferme, coupe jusqu'à ce que la vidéo du lieu suivant joue
  // (le cadre garde la classe joue en se fermant : seul visible compte ; à l'arrivée, joue part puis revient)
  let surPlace = false, coupes = 0;
  chaqueImage((t) => {
    if (t < b(28.6) || coupes >= 2 || film.enPause()) return;
    const cadre = $('.visite-video');
    if (!cadre) return;
    const visible = cadre.classList.contains('visible');
    if (visible && cadre.classList.contains('joue')) surPlace = true;
    else if (surPlace && !visible) {
      surPlace = false;
      coupes++;
      film.pause();
      videoJoue().then(() => {
        film.reprendre();
        flash(film.t(), 0.6, 0.16);
      });
    }
  });

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
  }(b(50)));

  film.exposer({
    async preparer() {
      film.modeFilm(false);
      // la visite : avec la vidéo de chaque lieu, 3 s par lieu (un choix ajouté pour le film), en mode film
      $('#visite-video').checked = true;
      $('#visite-video').dispatchEvent(new Event('change'));
      $('#visite-duree').append(new Option('3 s', '3000'));
      $('#visite-duree').value = '3000';
      $('#visite-film').checked = true;
      const s = document.createElement('style');
      s.textContent = `.legende, .maplibregl-popup { visibility: hidden !important; }`;
      document.head.append(s);
      // repérage : les vues des lieux en cache
      for (const [lng, lat] of [[135.729, 35.039], [134.694, 34.839], [135.890, 33.669]]) {
        for (const pitch of [50, 60]) {
          map.jumpTo({ center: [lng, lat], zoom: 12, pitch, bearing: 0 });
          await tuilesPretes(5);
        }
      }
      map.jumpTo({ center: [137.6, 37.3], zoom: 4.5, pitch: 40, bearing: 38 });
      await tuilesPretes(6);
      await attendre(1);
    },
  });
})();
