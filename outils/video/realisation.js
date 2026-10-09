// ================================================================
//  Le film promo de la carte (9:16, 30 s), tourné dans la vraie carte.
//  tourner.py injecte ce fichier une fois la carte prête (avec ralenti.js), appelle window.__film.preparer()
//  puis window.__film.demarrer(), et capture une image chaque fois que l'horloge du film (__film.t())
//  passe 1/30 s. L'horloge s'arrête pendant les pauses (__film.enPause()) : sous un volet, le temps que
//  la carte charge sa nouvelle vue ; ces moments-là ne sont pas filmés.
//  Huit scènes de deux mesures (3,75 s), calées sur « Michikusa » de PeriTune (128 battements par minute).
//  Les titres reprennent le site : parchemin à double filet, Zen Antique, rouge de cartographe.
// ================================================================
(async () => {
  const map = window.carte;
  const MESURE = (4 * 60) / 128; // 1,875 s
  const SCENE = 2 * MESURE; // 3,75 s
  const DUREE = 30;
  // Le calque est dessiné pour un écran de 540 px de large, puis mis à l'échelle (zoom) : le film est tourné à
  // 432 px (un vrai téléphone), et toutes les positions ci-dessous sont en « px 540 ».
  const ECHELLE = innerWidth / 540;
  const CENTRE_X = 252; // au milieu de la zone que TikTok laisse libre (sa colonne de boutons est à droite)
  const mer = await import('/mer.js');
  const oiseaux = await import('/oiseaux.js');

  // ---------------------------------------------------------------- Horloge du film (secondes)
  let debut = null, pauseDepuis = null, pauses = 0, fini = false;
  const t = () => (debut === null ? 0 : ((pauseDepuis ?? performance.now()) - debut - pauses) / 1000);
  const enPause = () => pauseDepuis !== null;
  const pause = () => { if (!enPause()) pauseDepuis = performance.now(); };
  const reprendre = () => { if (enPause()) { pauses += performance.now() - pauseDepuis; pauseDepuis = null; } };
  const attendre = (s) => new Promise((ok) => setTimeout(ok, s * 1000)); // en temps de la page (ralenti)
  async function tuilesPretes(max = 5) {
    const fin = performance.now() + max * 1000;
    await attendre(0.2);
    while (!map.areTilesLoaded() && performance.now() < fin) await attendre(0.1);
    await attendre(0.4);
  }

  const borne = (x) => Math.max(0, Math.min(1, x));
  const sortie = (x) => 1 - (1 - x) ** 3;
  const entree = (x) => x * x * x;
  const ressort = (x) => { const c = 1.6; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2; };
  const lineaire = (x) => x;
  const f = (n, d = 3) => n.toFixed(d);

  // ---------------------------------------------------------------- Le calque des titres
  const style = document.createElement('style');
  style.textContent = `
    #film { position: fixed; inset: 0; zoom: ${ECHELLE}; z-index: 2147483000; pointer-events: none; overflow: hidden; font-family: "Noto Sans", sans-serif; }
    #film [hidden] { display: none !important; }
    #film .fm-cartouche {
      position: absolute; left: ${CENTRE_X}px; max-width: 430px; padding: 15px 24px 17px; text-align: center; color: #35251a;
      background: var(--grain) 0 0 / 240px 240px, #efe4c8; border: 1.5px solid #8a6b45; border-radius: 2px;
      box-shadow: inset 0 0 0 4px #efe4c8, inset 0 0 0 5.5px rgba(138, 107, 69, 0.55), 0 10px 26px rgba(40, 26, 12, 0.4);
      transform-origin: 50% 50%; will-change: transform, opacity, clip-path;
    }
    #film .fm-sur {
      display: flex; align-items: center; justify-content: center; gap: 9px; margin: 0 0 9px;
      font: 700 12.5px/1 "Noto Sans", sans-serif; letter-spacing: .24em; text-transform: uppercase; color: #a8321f;
    }
    #film .fm-num {
      display: inline-grid; place-items: center; min-width: 25px; height: 21px; padding: 0 5px; border-radius: 2px;
      background: #a8321f; color: #f6eedb; font: 15px/1 "Zen Antique", serif; letter-spacing: 0;
    }
    #film .fm-sur .fm-trait { width: 22px; height: 1.5px; background: #a8321f; opacity: .6; }
    #film .fm-ligne { display: block; font: 38px/1.13 "Zen Antique", serif; white-space: nowrap; }
    #film .fm-mot { display: inline-block; will-change: transform, opacity; }
    #film .fm-mot.fm-rouge { color: #a8321f; }
    /* Le doigt qui touche l'écran : une goutte d'encre et son anneau */
    #film .fm-doigt { position: absolute; width: 0; height: 0; }
    #film .fm-doigt i { position: absolute; left: 0; top: 0; border-radius: 50%; translate: -50% -50%; }
    #film .fm-doigt .fm-point { width: 30px; height: 30px; background: rgba(168, 50, 31, 0.55); box-shadow: 0 0 0 2.5px rgba(246, 238, 219, 0.9); }
    #film .fm-doigt .fm-anneau { width: 64px; height: 64px; border: 3px solid #a8321f; }
    /* Le volet de papier qui passe d'une scène à l'autre, avec son sceau */
    #film .fm-volet {
      position: absolute; top: 0; bottom: 0; left: -40px; width: calc(100% + 80px);
      background: radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(110, 72, 30, 0.22)), var(--grain) 0 0 / 240px 240px, #efe4c8;
      display: grid; place-items: center; will-change: transform;
    }
    #film .fm-volet-contenu { display: flex; flex-direction: column; align-items: center; gap: 18px; margin-left: -18px; }
    #film .fm-sceau {
      width: 132px; height: 132px; display: grid; place-items: center; border-radius: 8px; background: #a8321f; color: #f6eedb;
      font: 88px/1 "Zen Antique", serif; box-shadow: inset 0 0 0 5px #a8321f, inset 0 0 0 8px #f6eedb; transform: rotate(-4deg);
    }
    #film .fm-volet-mot { font: 700 15px/1 "Noto Sans", sans-serif; letter-spacing: .3em; text-transform: uppercase; color: #35251a; }
    #film .fm-volet-mot b { color: #a8321f; }
    /* La fin : l'appel à visiter la carte */
    #film .fm-voile { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 42%, rgba(53, 37, 26, 0.18), rgba(30, 20, 12, 0.62)); }
    #film .fm-fin { top: 150px; width: 424px; padding: 30px 26px 22px; }
    #film .fm-fin .fm-logo {
      width: 104px; height: 104px; border-radius: 50%; object-fit: cover; border: 2px solid #35251a;
      box-shadow: 0 0 0 4px #efe4c8, 0 0 0 5.5px rgba(138, 107, 69, 0.7), 0 6px 14px rgba(40, 26, 12, 0.35);
    }
    #film .fm-fin .fm-nom { margin-top: 16px; font: 36px/1.1 "Zen Antique", serif; }
    #film .fm-fin .fm-filet { display: flex; align-items: center; justify-content: center; gap: 10px; margin: 14px auto 12px; width: 230px; }
    #film .fm-fin .fm-filet i { flex: 1; height: 1.5px; background: #8a6b45; }
    #film .fm-fin .fm-filet b { width: 8px; height: 8px; background: #a8321f; transform: rotate(45deg); }
    #film .fm-fin .fm-appel { font: 27px/1.2 "Zen Antique", serif; }
    #film .fm-fin .fm-appel em { font-style: normal; color: #a8321f; }
    #film .fm-fin .fm-adresse {
      position: relative; overflow: hidden; display: inline-block; margin-top: 20px; padding: 14px 20px;
      background: #a8321f; color: #f6eedb; border-radius: 2px; box-shadow: 0 4px 12px rgba(52, 36, 18, 0.35);
      font: 700 21px/1 "Noto Sans", sans-serif; letter-spacing: .01em;
    }
    #film .fm-fin .fm-reflet { position: absolute; top: -10px; bottom: -10px; width: 60px; background: linear-gradient(100deg, transparent, rgba(255, 246, 225, 0.55), transparent); }
    #film .fm-fin .fm-bio { margin-top: 14px; font: 700 17px/1.2 "Noto Sans", sans-serif; color: #35251a; }
    #film .fm-fin .fm-bio span { color: #a8321f; }
    #film .fm-fin .fm-langues { margin-top: 10px; font: 600 12.5px/1 "Noto Sans", sans-serif; letter-spacing: .2em; color: #6e533a; }
    #film .fm-fin .fm-credit { margin-top: 18px; font: 10.5px/1.3 "Noto Sans", sans-serif; color: #6e533a; }
    #film .fm-fin .fm-sceau-fin {
      position: absolute; right: -20px; top: -24px; width: 76px; height: 76px; display: grid; place-items: center;
      border-radius: 6px; background: #a8321f; color: #f6eedb; font: 25px/1.05 "Zen Antique", serif; writing-mode: vertical-rl;
      box-shadow: inset 0 0 0 3px #a8321f, inset 0 0 0 5px #f6eedb, 0 4px 10px rgba(52, 36, 18, 0.3);
    }
  `;
  document.head.append(style);
  const racine = document.createElement('div');
  racine.id = 'film';
  document.body.append(racine);
  const dessins = []; // une fonction par élément : dessiner(t)

  /** Un titre en cartouche : il se déroule depuis le milieu, puis ses mots montent un à un. « *mot » = en rouge. */
  function titre({ de, a, y, num, sur, lignes }) {
    const el = document.createElement('div');
    el.className = 'fm-cartouche';
    el.style.top = `${y}px`;
    el.innerHTML = (sur ? `<div class="fm-sur">${num ? `<span class="fm-num">${num}</span>` : '<span class="fm-trait"></span>'}<span>${sur}</span><span class="fm-trait"></span></div>` : '')
      + lignes.map((l) => `<span class="fm-ligne">${l.split(' ').map((m) => `<span class="fm-mot${m.startsWith('*') ? ' fm-rouge' : ''}">${m.replace(/^\*/, '')}</span>`).join(' ')}</span>`).join('');
    racine.append(el);
    const mots = [...el.querySelectorAll('.fm-mot')];
    dessins.push((t) => {
      el.hidden = t < de || t > a + 0.32;
      if (el.hidden) return;
      const pin = borne((t - de) / 0.5), pout = borne((t - a) / 0.3);
      const o = sortie(pin), cote = f((1 - o) * 50, 2);
      el.style.opacity = f(Math.min(1, pin * 3) * (1 - pout));
      el.style.clipPath = `inset(-40px calc(${cote}% - 40px) -40px calc(${cote}% - 40px))`;
      el.style.transform = `translate(-50%, ${f(-pout * 16, 1)}px) scale(${f(0.94 + 0.06 * ressort(pin), 4)})`;
      mots.forEach((m, i) => {
        const p = sortie(borne((t - de - 0.14 - i * 0.055) / 0.34));
        m.style.opacity = f(p);
        m.style.transform = `translateY(${f((1 - p) * 18, 1)}px)`;
      });
    });
  }

  /** Un doigt qui touche l'écran à `de` ; `ou()` donne le point (lu au moment où il apparaît). */
  function toucher(de, ou) {
    const el = document.createElement('div');
    el.className = 'fm-doigt';
    el.innerHTML = '<i class="fm-anneau"></i><i class="fm-point"></i>';
    racine.append(el);
    const [anneau, point] = el.children;
    let place = null;
    dessins.push((t) => {
      el.hidden = t < de - 0.14 || t > de + 0.7;
      if (el.hidden) return;
      if (!place) { place = ou(); el.style.left = `${place.x / ECHELLE}px`; el.style.top = `${place.y / ECHELLE}px`; }
      const pa = borne((t - de + 0.14) / 0.14); // le doigt arrive
      const pr = borne((t - de) / 0.6); // l'anneau s'ouvre
      point.style.opacity = f(pa * (1 - borne((t - de - 0.2) / 0.3)) * 0.95);
      point.style.transform = `scale(${f(1.35 - 0.35 * sortie(pa) - 0.12 * Math.sin(Math.PI * borne((t - de) / 0.2)))})`;
      anneau.style.opacity = f(t < de ? 0 : 1 - pr);
      anneau.style.transform = `scale(${f(0.35 + 1.1 * sortie(pr))})`;
    });
  }

  /** Le volet de papier : il couvre l'écran à `coupe` (la carte change de vue dessous), puis repart à gauche. */
  function volet({ coupe, kanji, num, mot }) {
    const el = document.createElement('div');
    el.className = 'fm-volet';
    // bords déchirés (toujours les mêmes d'un tournage à l'autre)
    let graine = coupe * 1000;
    const hasard = () => { graine = (graine * 9301 + 49297) % 233280; return graine / 233280; };
    const gauche = [], droite = [];
    for (let i = 0; i <= 40; i++) gauche.push(`${f(4 + hasard() * 30, 1)}px ${f(i * 2.5, 2)}%`);
    for (let i = 40; i >= 0; i--) droite.push(`calc(100% - ${f(4 + hasard() * 30, 1)}px) ${f(i * 2.5, 2)}%`);
    el.style.clipPath = `polygon(${gauche.join(',')},${droite.join(',')})`;
    el.innerHTML = `<div class="fm-volet-contenu"><div class="fm-sceau">${kanji}</div><div class="fm-volet-mot"><b>${num}</b> · ${mot}</div></div>`;
    racine.append(el);
    dessins.push((t) => {
      el.hidden = t < coupe - 0.34 || t > coupe + 0.34;
      if (el.hidden) return;
      const x = t < coupe ? 1 - sortie(borne((t - coupe + 0.34) / 0.34)) : -entree(borne((t - coupe) / 0.34));
      el.style.transform = `translateX(${f(x * 104, 2)}%)`;
    });
  }

  // ---------------------------------------------------------------- Ce qui se passe à l'écran (repères de temps)
  const reperes = [];
  const quand = (a, fait) => reperes.push({ a, fait, fait_: false });
  const $ = (s) => document.querySelector(s);
  const cliquer = (s) => (typeof s === 'string' ? $(s) : s)?.click();
  const milieu = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  const repere = (nom) => [...document.querySelectorAll('.repere')].find((e) => e.querySelector('.repere-nom')?.textContent === nom);
  const film = (oui) => document.body.classList.toggle('mode-film', oui);
  const toutFermer = () => document.body.click(); // un appui à côté ferme les panneaux (app.js)
  /** Sous un volet : la carte change de vue, l'horloge du film attend qu'elle soit chargée. */
  const sousLeVolet = (a, faire) => quand(a, async () => {
    pause();
    await faire();
    reprendre();
  });

  // Scène 1 — 0 à 3,75 s : tout le Japon, le titre
  const DEPART = { center: [136.3, 36.0], zoom: 4.45, pitch: 38, bearing: 36 };
  quand(0, () => map.easeTo({ zoom: 4.8, bearing: 44, pitch: 44, duration: 3700, easing: lineaire, essential: true }));
  titre({ de: 0, a: 3.3, y: 150, sur: 'Random Japan Place', lignes: ['Every place', 'from my *TikToks', 'on one *3D map'] });

  // Scène 2 — 3,75 à 7,5 s : on plonge sur le château de Himeji
  const HIMEJI = [134.693905, 34.839449];
  quand(3.5, () => map.flyTo({ center: HIMEJI, zoom: 12.95, pitch: 63, bearing: 12, duration: 3400, curve: 1.5, essential: true }));
  quand(6.92, () => map.easeTo({ bearing: 30, duration: 5000, easing: lineaire, essential: true }));
  titre({ de: 4.05, a: 7.15, y: 104, num: '01', sur: 'Fly anywhere', lignes: ['*130+ places', 'in 3D'] });

  // Scène 3 — 7,5 à 11,25 s : la fiche du lieu, et un cœur
  toucher(7.62, () => milieu(repere('Himeji Castle').querySelector('.repere-tete')));
  quand(7.66, () => { location.hash = '#himeji-castle'; });
  toucher(9.45, () => milieu($('#fiche-favori')));
  quand(9.5, () => cliquer('#fiche-favori'));
  titre({ de: 8.9, a: 11.0, y: 205, num: '02', sur: 'Every place', lignes: ['Photos, videos', '& *directions'] });

  // Scène 4 — 11,25 à 15 s : le dé
  quand(11.25, () => { cliquer('#fiche-fermer'); film(false); });
  toucher(11.6, () => milieu($('#btn-hasard')));
  quand(11.64, () => cliquer('#btn-hasard'));
  toucher(12.42, () => milieu($('#btn-lancer')));
  quand(12.46, () => {
    const hasard = Math.random;
    Math.random = () => window.__choixDe ?? 0;
    cliquer('#btn-lancer');
    Math.random = hasard;
  });
  titre({ de: 11.75, a: 13.35, y: 430, num: '03', sur: "Can't decide?", lignes: ['Roll the *dice'] });

  // Scène 5 — 15 à 18,75 s : les favoris et leur itinéraire
  volet({ coupe: 15, kanji: '旅', num: '04', mot: 'Road trip' });
  sousLeVolet(15, async () => {
    cliquer('#fiche-fermer');
    toutFermer();
    map.jumpTo({ center: [134.2, 34.85], zoom: 6.4, pitch: 30, bearing: 0 });
    await tuilesPretes();
  });
  toucher(15.45, () => milieu($('#btn-favoris')));
  quand(15.5, () => cliquer('#btn-favoris'));
  toucher(16.3, () => milieu($('[data-tracer]')));
  quand(16.35, () => cliquer('[data-tracer]'));
  titre({ de: 16.7, a: 18.45, y: 620, num: '04', sur: 'Favorites', lignes: ['Plan your', '*road trip'] });

  // Scène 6 — 18,75 à 22,5 s : une légende cachée (Yamata no Orochi, à Izumo) ; des grues passent
  volet({ coupe: 18.75, kanji: '伝', num: '05', mot: 'Legends' });
  sousLeVolet(18.75, async () => {
    cliquer('#resume-effacer');
    toutFermer();
    map.jumpTo({ center: [133.0, 35.16], zoom: 9.1, pitch: 56, bearing: -8 });
    await tuilesPretes();
    oiseaux.faireVoler();
    await attendre(3.2);
  });
  quand(18.76, () => map.easeTo({ bearing: 2, zoom: 9.3, duration: 4000, easing: lineaire, essential: true }));
  toucher(19.45, () => milieu($('[data-legende="orochi"]')));
  quand(19.5, () => cliquer('[data-legende="orochi"]'));
  titre({ de: 19.05, a: 22.2, y: 620, num: '05', sur: 'Hidden legends', lignes: ['Find all *22'] });

  // Scène 7 — 22,5 à 26,25 s : la mer vivante (typhon, baleine, bateaux), puis la musique
  volet({ coupe: 22.5, kanji: '海', num: '06', mot: 'Living map' });
  sousLeVolet(22.5, async () => {
    for (const p of document.querySelectorAll('.maplibregl-popup')) p.remove();
    toutFermer();
    map.jumpTo({ center: [135.9, 33.9], zoom: 5.3, pitch: 42, bearing: 0 });
    await tuilesPretes();
    mer.jouerTyphon();
    await attendre(8.5); // il a fini de grandir
    // le typhon au milieu de l'écran, un peu bas (son chemin, lui, reste en mer)
    const ty = document.querySelector('.typhon');
    if (ty) { const c = milieu(ty); map.panBy([c.x - innerWidth / 2, c.y - innerHeight * 0.66], { duration: 0 }); }
    await attendre(0.3);
    // la baleine : en pleine mer, bien en vue, loin du typhon
    const cTy = ty ? milieu(ty) : { x: -999, y: -999 };
    const W = innerWidth, H = innerHeight;
    const coin = [[0.28, 0.5], [0.72, 0.42], [0.25, 0.62], [0.7, 0.55], [0.3, 0.4]]
      .map(([x, y]) => ({ x: x * W, y: y * H }))
      .filter((p) => Math.hypot(p.x - cTy.x, p.y - cTy.y) > 150)
      .map((p) => map.unproject([p.x, p.y]))
      .find((ll) => (map.queryTerrainElevation(ll) ?? 1) <= 0.5);
    if (coin) mer.jouerScene('baleine', [coin.lng, coin.lat]);
    await attendre(1.4);
  });
  quand(22.52, () => map.easeTo({ bearing: 8, zoom: 5.45, duration: 4200, easing: lineaire, essential: true }));
  titre({ de: 22.8, a: 24.3, y: 160, num: '06', sur: 'A living map', lignes: ['Whales, ships', '& *typhoons'] });
  toucher(24.45, () => milieu($('#btn-musique')));
  quand(24.5, () => cliquer('#btn-musique'));
  toucher(25.15, () => milieu($('[data-jouer]')));
  quand(25.2, () => cliquer('[data-jouer]'));
  titre({ de: 24.75, a: 26.1, y: 620, sur: 'And while you explore', lignes: ['Japanese *music'] });

  // Scène 8 — 26,25 à 30 s : l'appel
  quand(26.2, () => {
    toutFermer();
    map.easeTo({ bearing: 20, zoom: 5.15, duration: 4500, easing: lineaire, essential: true });
  });
  fin(26.25);

  function fin(de) {
    const voile = document.createElement('div');
    voile.className = 'fm-voile';
    const el = document.createElement('div');
    el.className = 'fm-cartouche fm-fin';
    el.innerHTML = `
      <div class="fm-sceau-fin">日本</div>
      <img class="fm-logo" src="img/logo.jpg" alt="">
      <div class="fm-nom">Random Japan Place</div>
      <div class="fm-filet"><i></i><b></b><i></i></div>
      <div class="fm-appel">Explore Japan in 3D<br><em>it's free</em></div>
      <div class="fm-adresse"><span class="fm-reflet"></span>map.randomjapanplace.com</div>
      <div class="fm-bio">Link in <span>bio</span> ↗</div>
      <div class="fm-langues">EN · FR · 日本語</div>
      <div class="fm-credit">♪ Michikusa · PeriTune (CC BY 4.0)</div>`;
    racine.append(voile, el);
    const [sceau, logo, nom, filet, appel, adresse, bio, langues, credit] = el.children;
    const reflet = adresse.querySelector('.fm-reflet');
    const parties = [[logo, 0.3], [nom, 0.45], [filet, 0.55], [appel, 0.65], [bio, 1.6], [langues, 1.75], [credit, 1.9]];
    const B = MESURE / 4; // un temps
    dessins.push((t) => {
      const v = borne((t - de) / 0.4);
      voile.hidden = el.hidden = t < de;
      if (t < de) return;
      voile.style.opacity = f(sortie(v));
      const pin = borne((t - de - 0.05) / 0.55), o = sortie(pin), cote = f((1 - o) * 50, 2);
      el.style.opacity = f(Math.min(1, pin * 3));
      el.style.clipPath = `inset(-60px calc(${cote}% - 60px) -60px calc(${cote}% - 60px))`;
      el.style.transform = `translate(-50%, 0) scale(${f(0.94 + 0.06 * ressort(pin), 4)})`;
      for (const [p, d] of parties) {
        const x = sortie(borne((t - de - d) / 0.38));
        p.style.opacity = f(x);
        p.style.transform = `translateY(${f((1 - x) * 16, 1)}px)`;
      }
      // l'adresse tombe sur un temps, le sceau sur le suivant
      const ta = de + 2 * B, pa = borne((t - ta) / 0.4);
      adresse.style.opacity = f(Math.min(1, pa * 4));
      adresse.style.transform = `scale(${f(t < ta ? 0.6 : 0.6 + 0.4 * ressort(pa), 4)})`;
      const ts = de + 3 * B, ps = borne((t - ts) / 0.32);
      sceau.style.opacity = f(t < ts ? 0 : Math.min(1, ps * 3));
      sceau.style.transform = `rotate(${f(10 - 2 * ps, 2)}deg) scale(${f(1.9 - 0.9 * sortie(ps), 4)})`;
      // un reflet passe sur l'adresse, deux fois
      const tr = (t - ta - 0.9) % 1.6;
      reflet.style.left = `${f(-70 + 420 * borne(tr / 0.7), 1)}px`;
    });
  }

  // ---------------------------------------------------------------- La boucle
  function image() {
    const tf = t();
    if (debut !== null && !fini) {
      for (const r of reperes) if (!r.fait_ && tf >= r.a) { r.fait_ = true; r.fait(); }
      if (tf >= DUREE) fini = true;
    }
    for (const d of dessins) d(tf);
    requestAnimationFrame(image);
  }

  window.__film = {
    t, enPause, fini: () => fini, duree: DUREE,
    /** Avant le tournage : vue de départ, mode film, dé réglé (préfecture de Kyoto, temples). */
    async preparer() {
      film(true);
      map.jumpTo(DEPART);
      await tuilesPretes();
    },
    demarrer() { debut = performance.now(); },
  };
  requestAnimationFrame(image);
})();
