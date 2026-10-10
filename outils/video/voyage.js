// ================================================================
//  Film « Le grand voyage » (9:16, 30 s) : une seule prise, sans bouton à l'écran. On survole le Japon du nord
//  au sud, haut entre deux étapes, en rase-mottes au-dessus de chacune (son nom s'écrit sur la carte, en
//  anglais et en japonais), jusqu'à Okinawa ; puis la caméra remonte et tourne pour montrer tout le Japon,
//  avec l'adresse de la carte. Musique : « Ametsuchi » de PeriTune.
//  La caméra suit un trajet calculé d'avance (cles ci-dessous) : chaque image, jumpTo() à l'instant du film.
//  Sa hauteur est figée (setCenterClampedToGround(false)) et lissée, relevée pendant le repérage : sinon le
//  centre suivrait le relief et la caméra sauterait au-dessus de chaque montagne.
// ================================================================
(() => {
  const film = window.__creerFilm({ duree: 30, css: `
    /* les lieux : un point d'encre, un filet, le nom gravé (IM Fell, comme les noms de la carte) */
    #film .fm-lieu { position: absolute; width: 0; height: 0; }
    #film .fm-lieu-point { position: absolute; left: -7px; top: -7px; width: 14px; height: 14px; border-radius: 50%;
      background: #a8321f; box-shadow: 0 0 0 2.5px #f6eedb, 0 0 0 4px rgba(53, 37, 26, .55), 0 3px 8px rgba(30, 20, 10, .45); }
    #film .fm-lieu-filet { position: absolute; left: -1px; bottom: 9px; width: 2px; height: 46px; background: #35251a;
      box-shadow: 0 0 0 1.5px rgba(246, 238, 219, .75); transform-origin: 50% 100%; }
    #film .fm-lieu-texte { position: absolute; left: 0; bottom: 60px; translate: -50% 0; text-align: center; white-space: nowrap; }
    #film .fm-lieu-texte b { display: block; font: italic 400 34px/1.05 "IM Fell English", Georgia, serif; color: #2c1e14;
      text-shadow: 0 0 2px #f6eedb, 0 0 6px #f6eedb, 0 0 12px rgba(246, 238, 219, .9), 0 0 22px rgba(246, 238, 219, .6); }
    #film .fm-lieu-texte small { display: block; margin-top: 3px; font: 400 21px/1 "Zen Antique", serif; color: #a8321f; letter-spacing: .12em;
      text-shadow: 0 0 2px #f6eedb, 0 0 6px #f6eedb, 0 0 12px rgba(246, 238, 219, .85); }
    /* les grands titres du voyage : de Hokkaidō… à Okinawa */
    #film .fm-grand { position: absolute; left: 252px; translate: -50% 0; text-align: center; white-space: nowrap; }
    #film .fm-grand b { display: block; font: italic 400 50px/1.05 "IM Fell English", Georgia, serif; color: #2c1e14;
      text-shadow: 0 0 3px #f6eedb, 0 0 9px #f6eedb, 0 0 18px rgba(246, 238, 219, .95), 0 0 34px rgba(246, 238, 219, .7); }
    #film .fm-grand small { display: block; margin-top: 6px; font: 400 26px/1 "Zen Antique", serif; color: #a8321f; letter-spacing: .2em;
      text-shadow: 0 0 3px #f6eedb, 0 0 9px #f6eedb, 0 0 18px rgba(246, 238, 219, .9); }
    #film .fm-grand i { display: block; width: 0; height: 2px; margin: 10px auto 0; background: #a8321f; box-shadow: 0 0 0 1px rgba(246, 238, 219, .8); }
    /* la fin : le titre de la carte, comme le cartouche d'une carte ancienne, et l'adresse sur un ruban */
    #film .fm-voile { position: absolute; inset: 0; background: radial-gradient(ellipse 70% 46% at 47% 40%, rgba(246, 238, 219, .78), rgba(246, 238, 219, .25) 62%, rgba(40, 26, 12, .35)); }
    #film .fm-fin { position: absolute; left: 252px; top: 205px; translate: -50% 0; width: 470px; text-align: center; }
    #film .fm-fin > * { will-change: transform, opacity; }
    #film .fm-fin .fm-logo { width: 92px; height: 92px; border-radius: 50%; object-fit: cover; border: 2px solid #35251a;
      box-shadow: 0 0 0 4px #efe4c8, 0 0 0 5.5px rgba(138, 107, 69, .8), 0 6px 14px rgba(40, 26, 12, .35); }
    #film .fm-fin .fm-sur { margin-top: 14px; font: italic 400 25px/1.1 "IM Fell English", Georgia, serif; color: #35251a; }
    #film .fm-fin .fm-titre { margin-top: 4px; font: 400 47px/1.05 "Zen Antique", serif; color: #2c1e14; }
    #film .fm-fin .fm-orne { display: flex; align-items: center; justify-content: center; gap: 10px; margin: 12px auto 18px; width: 250px; }
    #film .fm-fin .fm-orne i { flex: 1; height: 1.5px; background: #8a6b45; }
    #film .fm-fin .fm-orne b { width: 9px; height: 9px; background: #a8321f; transform: rotate(45deg); }
    #film .fm-fin .fm-ruban { position: relative; display: inline-block; padding: 15px 44px 16px; color: #f6eedb; font: 700 22px/1 "Noto Sans", sans-serif;
      background: #a8321f; clip-path: polygon(0 0, 100% 0, calc(100% - 16px) 50%, 100% 100%, 0 100%, 16px 50%);
      filter: drop-shadow(0 4px 8px rgba(40, 26, 12, .35)); }
    #film .fm-fin .fm-bio { margin-top: 16px; font: 700 19px/1.2 "Noto Sans", sans-serif; color: #35251a; }
    #film .fm-fin .fm-bio span { color: #a8321f; }
    #film .fm-fin .fm-credit { margin-top: 14px; font: 11px/1.3 "Noto Sans", sans-serif; color: #5b432d; }
    #film .fm-fin .fm-sceau { position: absolute; right: 4px; top: 6px; width: 70px; height: 70px; display: grid; place-items: center; border-radius: 6px;
      background: #a8321f; color: #f6eedb; font: 40px/1 "Zen Antique", serif; box-shadow: inset 0 0 0 3px #a8321f, inset 0 0 0 5px #f6eedb, 0 4px 10px rgba(52, 36, 18, .3); }
  ` });
  const { map, borne, sortie, lisse, ressort, f, element, chaqueImage, attendre, tuilesPretes, quand } = film;

  // ---------------------------------------------------------------- Le trajet
  // [t (s), lng, lat, zoom, inclinaison] : haut entre les étapes, bas et lent au-dessus de chacune
  const CLES = [
    [0.0, 142.75, 43.95, 7.2, 56], [1.0, 142.45, 43.55, 7.3, 57],
    [3.0, 140.53, 40.70, 9.4, 64], [4.3, 140.42, 40.53, 9.5, 65], // château de Hirosaki
    [6.0, 139.6, 37.9, 7.1, 57],
    [7.6, 138.80, 35.47, 9.5, 65], [9.0, 138.66, 35.26, 9.6, 66], // mont Fuji
    [10.0, 137.2, 35.15, 8.0, 60],
    [11.0, 135.80, 35.07, 10.4, 66], [12.4, 135.66, 35.01, 10.5, 66], // Kinkaku-ji, Kyoto
    [13.45, 134.0, 34.55, 8.1, 60],
    [14.5, 132.40, 34.33, 10.8, 67], [15.9, 132.25, 34.27, 10.9, 67], // Itsukushima
    [16.95, 131.3, 33.0, 8.0, 60],
    [18.0, 130.70, 31.68, 9.3, 64], [19.3, 130.62, 31.49, 9.4, 64], // Sakurajima
    [21.0, 129.0, 28.9, 6.5, 55],
    [22.6, 127.76, 26.30, 9.1, 62], [24.2, 127.69, 26.15, 9.3, 62], // château de Shuri, Okinawa
    [25.8, 129.6, 29.2, 6.3, 52], [28.6, 137.6, 37.3, 4.5, 40], [31, 137.6, 37.3, 4.5, 40], // tout le Japon
  ];
  const CAP_FIN = 38; // le cap de la vue de départ du site sur téléphone : le Japon debout dans l'écran
  const LIEUX = [
    { t: 3.65, ou: [140.464, 40.608], nom: 'Hirosaki Castle', ja: '弘前城' },
    { t: 8.3, ou: [138.727, 35.361], nom: 'Mount Fuji', ja: '富士山' },
    { t: 11.7, ou: [135.729, 35.039], nom: 'Kinkaku-ji', ja: '金閣寺' },
    { t: 15.2, ou: [132.320, 34.296], nom: 'Itsukushima Shrine', ja: '厳島神社' },
    { t: 18.65, ou: [130.657, 31.583], nom: 'Sakurajima', ja: '桜島' },
    { t: 23.4, ou: [127.719, 26.217], nom: 'Shuri Castle', ja: '首里城' },
  ];

  const merc = ([lng, lat]) => [(lng + 180) / 360, (1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) / 2];
  const geo = ([x, y]) => [x * 360 - 180, (360 / Math.PI) * Math.atan(Math.exp((1 - 2 * y) * Math.PI)) - 90];

  /** Interpolation cubique monotone (Fritsch–Carlson) : passe par les clés, sans dépasser entre elles. */
  function monotone(ts, vs) {
    const n = ts.length, d = [], m = new Array(n).fill(0);
    for (let i = 0; i < n - 1; i++) d.push((vs[i + 1] - vs[i]) / (ts[i + 1] - ts[i]));
    m[0] = d[0]; m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) {
      if (d[i - 1] * d[i] <= 0) m[i] = 0;
      else {
        const w1 = 2 * (ts[i + 1] - ts[i]) + (ts[i] - ts[i - 1]), w2 = (ts[i + 1] - ts[i]) + 2 * (ts[i] - ts[i - 1]);
        m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
      }
    }
    return (t) => {
      if (t <= ts[0]) return vs[0];
      if (t >= ts[n - 1]) return vs[n - 1];
      let i = 0;
      while (t > ts[i + 1]) i++;
      const h = ts[i + 1] - ts[i], s = (t - ts[i]) / h;
      const h00 = 2 * s ** 3 - 3 * s ** 2 + 1, h10 = s ** 3 - 2 * s ** 2 + s, h01 = -2 * s ** 3 + 3 * s ** 2, h11 = s ** 3 - s ** 2;
      return h00 * vs[i] + h10 * h * m[i] + h01 * vs[i + 1] + h11 * h * m[i + 1];
    };
  }

  const ts = CLES.map((c) => c[0]);
  const xy = CLES.map((c) => merc([c[1], c[2]]));
  const fx = monotone(ts, xy.map((p) => p[0])), fy = monotone(ts, xy.map((p) => p[1]));
  const fz = monotone(ts, CLES.map((c) => c[3])), fp = monotone(ts, CLES.map((c) => c[4]));

  // Le cap : la direction du vol, lissée ; à la fin, il tourne jusqu'au cap de la vue de tout le Japon
  const PAS = 1 / 60;
  const N = Math.ceil(31 / PAS);
  const brut = [];
  for (let k = 0; k <= N; k++) {
    const t = k * PAS, e = 0.25;
    const dx = fx(t + e) - fx(t - e), dy = fy(t + e) - fy(t - e);
    brut.push((Math.atan2(dx, -dy) * 180) / Math.PI);
  }
  for (let k = 1; k <= N; k++) { while (brut[k] - brut[k - 1] > 180) brut[k] -= 360; while (brut[k] - brut[k - 1] < -180) brut[k] += 360; }
  const lisser = (v, sigma) => {
    const r = Math.ceil(3 * sigma), poids = [];
    for (let j = -r; j <= r; j++) poids.push(Math.exp(-(j * j) / (2 * sigma * sigma)));
    return v.map((_, k) => {
      let s = 0, w = 0;
      for (let j = -r; j <= r; j++) { const i = Math.min(v.length - 1, Math.max(0, k + j)); s += v[i] * poids[j + r]; w += poids[j + r]; }
      return s / w;
    });
  };
  const caps = lisser(brut, 0.5 / PAS);
  // à Okinawa, avant que le lissage ne voie la remontée vers le nord-est : de là, le cap tourne seul
  const D_TOUR = 23.4, F_TOUR = 28.6;
  const echantillon = (v, t) => {
    const k = Math.max(0, Math.min(N - 1, t / PAS)), i = Math.floor(k), r = k - i;
    return v[i] * (1 - r) + v[i + 1] * r;
  };
  const capA = echantillon(caps, D_TOUR);
  let capB = CAP_FIN;
  while (capB - capA > 180) capB -= 360;
  while (capB - capA < -180) capB += 360;
  const cap = (t) => {
    if (t < D_TOUR) return echantillon(caps, t);
    const u = lisse(borne((t - D_TOUR) / (F_TOUR - D_TOUR)));
    return capA * (1 - u) + capB * u;
  };

  let hauteurs = null; // la hauteur du centre, lissée, relevée pendant le repérage (m, relief exagéré compris)
  const camera = (t) => ({
    center: geo([fx(t), fy(t)]), zoom: fz(t), pitch: fp(t), bearing: cap(t),
    ...(hauteurs ? { elevation: echantillon(hauteurs, t) } : {}),
  });

  // ---------------------------------------------------------------- Les noms des lieux, gravés sur la carte
  for (const l of LIEUX) {
    const el = element('fm-lieu', `<i class="fm-lieu-filet"></i><i class="fm-lieu-point"></i>
      <div class="fm-lieu-texte"><b>${l.nom}</b><small>${l.ja}</small></div>`);
    const [filet, point, texte] = el.children;
    const [nom, ja] = texte.children;
    const de = l.t - 1.05, a = l.t + 1.05;
    chaqueImage((t) => {
      el.hidden = t < de || t > a + 0.3;
      if (el.hidden) return;
      const p = map.project(l.ou);
      el.style.left = `${f(p.x / film.ECHELLE, 1)}px`;
      el.style.top = `${f(p.y / film.ECHELLE, 1)}px`;
      const pin = borne((t - de) / 0.3), pout = borne((t - a) / 0.3);
      el.style.opacity = f(1 - pout);
      point.style.transform = `scale(${f(pin ? ressort(pin) : 0, 3)})`;
      filet.style.transform = `scaleY(${f(sortie(borne((t - de - 0.08) / 0.3)), 3)})`;
      // le nom s'écrit de gauche à droite, puis le japonais apparaît
      const pe = sortie(borne((t - de - 0.22) / 0.55));
      nom.style.clipPath = `inset(-20px ${f((1 - pe) * 100, 1)}% -20px -20px)`;
      const pj = sortie(borne((t - de - 0.6) / 0.35));
      ja.style.opacity = f(pj);
      ja.style.transform = `translateY(${f((1 - pj) * 8, 1)}px)`;
    });
  }

  // ---------------------------------------------------------------- Les grands titres
  function grand({ de, a, y, texte, ja }) {
    const el = element('fm-grand', `<b>${texte}</b><small>${ja}</small><i></i>`);
    el.style.top = `${y}px`;
    const [b, small, trait] = el.children;
    chaqueImage((t) => {
      el.hidden = t < de || t > a + 0.4;
      if (el.hidden) return;
      const pe = sortie(borne((t - de) / 0.7)), pout = borne((t - a) / 0.4);
      el.style.opacity = f(1 - pout);
      el.style.transform = `translateY(${f(-pout * 14, 1)}px)`;
      b.style.clipPath = `inset(-30px ${f((1 - pe) * 100, 1)}% -30px -30px)`;
      const pj = sortie(borne((t - de - 0.45) / 0.4));
      small.style.opacity = f(pj);
      trait.style.width = `${f(sortie(borne((t - de - 0.6) / 0.5)) * 120, 1)}px`;
    });
  }
  grand({ de: 0.25, a: 2.6, y: 150, texte: 'From Hokkaidō…', ja: '北海道から' });
  grand({ de: 22.2, a: 24.4, y: 150, texte: '…to Okinawa', ja: '沖縄まで' });

  // ---------------------------------------------------------------- La fin
  (function fin(de) {
    const voile = element('fm-voile');
    const el = element('fm-fin', `
      <div class="fm-sceau">旅</div>
      <img class="fm-logo" src="img/logo.jpg" alt="">
      <div class="fm-sur">Every place from my TikToks</div>
      <div class="fm-titre">Random Japan Place</div>
      <div class="fm-orne"><i></i><b></b><i></i></div>
      <div><span class="fm-ruban">map.randomjapanplace.com</span></div>
      <div class="fm-bio">Explore it in 3D · link in <span>bio</span> ↗</div>
      <div class="fm-credit">♪ Ametsuchi · PeriTune (CC BY 4.0)</div>`);
    const [sceau, logo, sur, titre, orne, ruban, bio, credit] = el.children;
    const parties = [[logo, 0.15], [sur, 0.35], [titre, 0.5], [orne, 0.7], [bio, 1.5], [credit, 1.8]];
    chaqueImage((t) => {
      voile.hidden = el.hidden = t < de;
      if (t < de) return;
      voile.style.opacity = f(sortie(borne((t - de) / 0.8)));
      for (const [p, d] of parties) {
        const x = sortie(borne((t - de - d) / 0.45));
        p.style.opacity = f(x);
        p.style.transform = `translateY(${f((1 - x) * 18, 1)}px)`;
      }
      const pr = borne((t - de - 1.0) / 0.5);
      ruban.style.opacity = f(Math.min(1, pr * 4));
      ruban.style.transform = `scaleX(${f(t < de + 1.0 ? 0.3 : 0.3 + 0.7 * ressort(pr), 4)})`;
      const ps = borne((t - de - 1.25) / 0.32);
      sceau.style.opacity = f(t < de + 1.25 ? 0 : Math.min(1, ps * 3));
      sceau.style.transform = `rotate(${f(12 - 4 * ps, 2)}deg) scale(${f(1.9 - 0.9 * sortie(ps), 4)})`;
    });
  }(26.9));

  // ---------------------------------------------------------------- La caméra, à chaque image
  let tourne = false;
  chaqueImage((t) => { if (tourne) map.jumpTo(camera(t)); });
  quand(0, () => { tourne = true; });

  film.exposer({
    /** Avant le tournage : rien que la carte, puis un repérage du trajet (tuiles en cache, hauteurs du sol). */
    async preparer() {
      film.modeFilm(true);
      const s = document.createElement('style');
      s.textContent = `.repere, .nom-terre, .legende, .filigrane, .bandeau, .maplibregl-popup { display: none !important; }`;
      document.head.append(s);
      map.setCenterClampedToGround(false);
      const pas = 0.2, mesures = [];
      for (let t = 0; t <= 30.01; t += pas) {
        const c = camera(t);
        map.jumpTo(c);
        await tuilesPretes(4);
        mesures.push(Math.max(0, map.queryTerrainElevation(c.center) ?? 0));
      }
      // les hauteurs du sol, lissées (la caméra ne doit pas suivre chaque bosse), à 1/60 s
      const fines = [];
      for (let k = 0; k <= N; k++) {
        const i = Math.min(mesures.length - 1, (k * PAS) / pas), a = Math.floor(i), r = i - a;
        fines.push(mesures[a] * (1 - r) + (mesures[Math.min(mesures.length - 1, a + 1)] ?? mesures[a]) * r);
      }
      hauteurs = lisser(fines, 0.6 / PAS);
      map.jumpTo(camera(0));
      await tuilesPretes(6);
      await attendre(1);
    },
  });
})();
