// ================================================================
//  Film « Le zoom arrière » (9:16, 30 s) : on commence tout près d'un seul lieu en 3D (le sanctuaire
//  d'Itsukushima, ses vagues sur la côte), « 1 place I filmed in Japan… », puis la caméra recule sans coupure
//  jusqu'à voir tout le Japon. Chaque lieu s'allume quand il entre dans l'image, et un compteur monte.
//  À la fin : « 132 places. One map. » et l'adresse. Musique : « Awayuki » de PeriTune, qui s'envole à 7 s
//  du film, quand le recul accélère.
// ================================================================
(() => {
  const film = window.__creerFilm({ duree: 30, css: `
    /* les lieux restent cachés tant qu'ils ne sont pas entrés dans l'image ; ils s'allument d'un coup */
    .repere:not(.fm-vu) { visibility: hidden !important; }
    .repere.fm-vu > * { animation: fm-allume .5s cubic-bezier(.2, 1.4, .4, 1) both; }
    @keyframes fm-allume { 0% { scale: 0; filter: brightness(2.2); } 55% { scale: 1.45; } 100% { scale: 1; filter: none; } }
    #film .fm-texte { position: absolute; left: 252px; translate: -50% 0; width: 470px; text-align: center; }
    #film .fm-texte b { display: block; font: 400 40px/1.12 "Zen Antique", serif; color: #2c1e14;
      text-shadow: 0 0 3px #f6eedb, 0 0 9px #f6eedb, 0 0 18px rgba(246, 238, 219, .95), 0 0 34px rgba(246, 238, 219, .7); }
    #film .fm-texte b em { font-style: normal; color: #a8321f; }
    #film .fm-texte span { display: inline-block; will-change: transform, opacity; }
    /* le compteur, sur un cartouche de parchemin à double filet */
    #film .fm-compteur { position: absolute; left: 252px; top: 632px; translate: -50% 0; display: flex; align-items: baseline; gap: 12px;
      padding: 8px 26px 12px; color: #2c1e14; background: var(--grain) 0 0 / 240px 240px, #efe4c8; border: 1.5px solid #8a6b45; border-radius: 2px;
      box-shadow: inset 0 0 0 4px #efe4c8, inset 0 0 0 5.5px rgba(138, 107, 69, .55), 0 10px 26px rgba(40, 26, 12, .4); }
    #film .fm-compteur b { font: 400 76px/1 "Zen Antique", serif; color: #a8321f; font-variant-numeric: tabular-nums; min-width: 1.6ch; text-align: right; }
    #film .fm-compteur span { font: italic 400 30px/1 "IM Fell English", Georgia, serif; }
    /* la fin : l'adresse, en bas, au-dessus de la zone de la légende TikTok */
    #film .fm-fin { position: absolute; left: 252px; top: 630px; translate: -50% 0; text-align: center; white-space: nowrap; }
    #film .fm-fin .fm-adresse { display: inline-flex; align-items: center; gap: 12px; padding: 12px 22px 12px 12px; border-radius: 40px;
      background: #a8321f; color: #f6eedb; font: 700 22px/1 "Noto Sans", sans-serif; box-shadow: 0 6px 16px rgba(40, 26, 12, .4); }
    #film .fm-fin .fm-adresse img { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; border: 2px solid #f6eedb; }
    #film .fm-fin .fm-bio { margin-top: 14px; font: 700 19px/1.2 "Noto Sans", sans-serif; color: #2c1e14;
      text-shadow: 0 0 3px #f6eedb, 0 0 9px #f6eedb, 0 0 16px rgba(246, 238, 219, .9); }
    #film .fm-fin .fm-bio i { font-style: normal; color: #a8321f; }
    #film .fm-fin .fm-credit { margin-top: 10px; font: 11px/1.3 "Noto Sans", sans-serif; color: #35251a;
      text-shadow: 0 0 3px #f6eedb, 0 0 8px #f6eedb; }
  ` });
  const { map, borne, sortie, lisse, ressort, f, element, chaqueImage, attendre, tuilesPretes, quand } = film;

  // ---------------------------------------------------------------- La caméra
  const LIEU = [132.3196, 34.2960]; // Itsukushima-jinja
  const FIN = { center: [137.6, 37.3], zoom: 4.5, pitch: 40, bearing: 38 }; // la vue de départ du site sur téléphone
  const Z0 = 14.1, D_RECUL = 1.0, F_RECUL = 19.4, CAP0 = 172;
  const merc = ([lng, lat]) => [(lng + 180) / 360, (1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) / 2];
  const geo = ([x, y]) => [x * 360 - 180, (360 / Math.PI) * Math.atan(Math.exp((1 - 2 * y) * Math.PI)) - 90];
  const A = merc(LIEU), B = merc(FIN.center);
  // le recul (le zoom au fil du film) : lent pendant l'accroche, il s'emballe quand la musique s'envole (7 s) pour
  // que les lieux s'allument tout de suite, puis il ralentit et se pose sur tout le Japon
  const ZOOMS = [[0, Z0], [D_RECUL, Z0 - 0.05], [6.6, 12.7], [8.4, 10.4], [10.6, 8.1], [13.6, 6.5], [16.8, 5.15], [F_RECUL, FIN.zoom], [31, FIN.zoom]];
  const zoomA = (() => {
    const ts = ZOOMS.map((z) => z[0]), vs = ZOOMS.map((z) => z[1]), n = ts.length, d = [], m = new Array(n).fill(0);
    for (let i = 0; i < n - 1; i++) d.push((vs[i + 1] - vs[i]) / (ts[i + 1] - ts[i]));
    for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]);
    return (t) => {
      if (t >= ts[n - 1]) return vs[n - 1];
      let i = 0;
      while (t > ts[i + 1]) i++;
      const h = ts[i + 1] - ts[i], s = (t - ts[i]) / h;
      return (2 * s ** 3 - 3 * s ** 2 + 1) * vs[i] + (s ** 3 - 2 * s ** 2 + s) * h * m[i] + (-2 * s ** 3 + 3 * s ** 2) * vs[i + 1] + (s ** 3 - s ** 2) * h * m[i + 1];
    };
  })();
  function camera(t) {
    const z = zoomA(Math.max(0, t));
    const u = borne((Z0 - z) / (Z0 - FIN.zoom)); // l'avancée du recul, de 0 à 1
    // le centre quitte le lieu seulement quand on voit loin (sinon le lieu sortirait de l'image)
    const w = lisse(borne((10.6 - z) / (10.6 - FIN.zoom)));
    const apres = Math.max(0, t - F_RECUL);
    return {
      center: geo([A[0] + (B[0] - A[0]) * w, A[1] + (B[1] - A[1]) * w]),
      zoom: z,
      pitch: 64 + (FIN.pitch - 64) * lisse(u),
      bearing: CAP0 + (FIN.bearing - CAP0) * lisse(u) - 1.6 * t * (1 - lisse(u)) + apres * 0.9,
    };
  }

  // ---------------------------------------------------------------- Les textes
  function texte({ de, a, y, html }) {
    // chaque mot dans un span, pour qu'ils montent un à un (les mots rouges : *mot ; | : à la ligne)
    const lignes = html.split('|').map((l) => l.split(' ').map((m) => `<span>${m.startsWith('*') ? `<em>${m.slice(1)}</em>` : m}</span>`).join(' '));
    const el = element('fm-texte', `<b>${lignes.join('<br>')}</b>`);
    el.style.top = `${y}px`;
    const mots = [...el.querySelectorAll('b > span')];
    chaqueImage((t) => {
      el.hidden = t < de || t > a + 0.35;
      if (el.hidden) return;
      const pout = borne((t - a) / 0.35);
      el.style.opacity = f(1 - pout);
      el.style.transform = `translateY(${f(-pout * 14, 1)}px)`;
      mots.forEach((m, i) => {
        const p = sortie(borne((t - de - i * 0.07) / 0.38));
        m.style.opacity = f(p);
        m.style.transform = `translateY(${f((1 - p) * 20, 1)}px)`;
      });
    });
  }
  texte({ de: 0.3, a: 6.55, y: 150, html: '1 place|I filmed in *Japan…' });
  texte({ de: 7.0, a: 18.9, y: 150, html: '…and *every|other one' });

  // ---------------------------------------------------------------- Le compteur et les lieux qui s'allument
  /** Le repère est-il dans l'image ? (sa tête : l'élément du repère lui-même n'a pas de taille) */
  const dansImage = (el, W, H) => {
    const r = (el.querySelector('.repere-tete') || el).getBoundingClientRect();
    if (!r.right && !r.bottom) return false;
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    return x > 4 && x < W - 4 && y > 4 && y < H - 4;
  };
  let total = 0; // le nombre de lieux de la carte (lu au début : le compteur du menu Catégories)
  let vus = 0, affiche = 1, compte = false; // compte : les lieux s'allument (après la préparation)
  const compteur = element('fm-compteur', '<b>1</b><span>place</span>');
  const [nombre, mot] = compteur.children;
  const D_FIN = F_RECUL + 0.2; // tous les lieux sont comptés : « 132 places. One map. »
  let texteFin = null;
  chaqueImage((t) => {
    if (!compte) return;
    // les lieux entrés dans l'image s'allument (ceux de la carte que reperes.js a mis dans la page)
    const W = innerWidth, H = innerHeight;
    for (const el of document.querySelectorAll('.repere:not(.fm-vu)')) {
      if (dansImage(el, W, H)) { el.classList.add('fm-vu'); vus++; }
    }
    const vise = t >= D_FIN ? total : Math.max(1, Math.min(total, vus));
    affiche += (vise - affiche) * 0.35;
    if (Math.abs(vise - affiche) < 0.5) affiche = vise;
    const n = Math.round(affiche);
    if (nombre.textContent !== String(n)) {
      nombre.textContent = n;
      mot.textContent = n > 1 ? 'places' : 'place';
    }
    // le compteur bat un peu à chaque nouveau lieu
    const pulse = Math.min(1, Math.abs(vise - affiche) / 6);
    compteur.style.transform = `scale(${f(1 + 0.06 * pulse, 3)})`;
    compteur.hidden = t > 22.6 + 0.35;
    if (!compteur.hidden) compteur.style.opacity = f(1 - borne((t - 22.6) / 0.35));
    if (!texteFin && total) { texteFin = true; texte({ de: D_FIN, a: 31, y: 150, html: `${total} places.|One *map.` }); }
  });

  // ---------------------------------------------------------------- La fin
  (function fin(de) {
    const el = element('fm-fin', `
      <div><span class="fm-adresse"><img src="img/logo.jpg" alt="">map.randomjapanplace.com</span></div>
      <div class="fm-bio">Free · in 3D · link in <i>bio</i> ↗</div>
      <div class="fm-credit">♪ Awayuki · PeriTune (CC BY 4.0)</div>`);
    const [adresse, bio, credit] = el.children;
    chaqueImage((t) => {
      el.hidden = t < de;
      if (el.hidden) return;
      const pa = borne((t - de) / 0.5);
      adresse.style.opacity = f(Math.min(1, pa * 3));
      adresse.style.transform = `scale(${f(0.5 + 0.5 * ressort(pa), 4)})`;
      for (const [p, d] of [[bio, 0.45], [credit, 0.8]]) {
        const x = sortie(borne((t - de - d) / 0.4));
        p.style.opacity = f(x);
        p.style.transform = `translateY(${f((1 - x) * 14, 1)}px)`;
      }
    });
  }(22.9));

  // ---------------------------------------------------------------- La caméra, à chaque image
  let tourne = false;
  chaqueImage((t) => { if (tourne) map.jumpTo(camera(t)); });
  quand(0, () => { tourne = true; });

  film.exposer({
    async preparer() {
      film.modeFilm(true);
      const s = document.createElement('style');
      s.textContent = `.nom-terre, .legende, .filigrane, .bandeau, .maplibregl-popup { display: none !important; }`;
      document.head.append(s);
      total = parseInt(document.getElementById('compteur')?.textContent, 10) || 0;
      // repérage : les tuiles du recul en cache
      for (let t = F_RECUL; t >= 0; t -= 0.5) {
        map.jumpTo(camera(t));
        await tuilesPretes(3);
      }
      map.jumpTo(camera(0));
      await tuilesPretes(6);
      await attendre(1.5);
      // le premier lieu est déjà là
      for (const el of document.querySelectorAll('.repere')) if (dansImage(el, innerWidth, innerHeight)) { el.classList.add('fm-vu'); vus++; }
      compte = true;
    },
  });
})();
