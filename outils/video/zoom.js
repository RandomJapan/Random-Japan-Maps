// ================================================================
//  Film « Le zoom arrière » (9:16, 30 s) : on commence tout près d'un seul lieu en 3D (le sanctuaire
//  d'Itsukushima, ses vagues sur la côte), « 1 place, I filmed in Japan… », puis la caméra recule jusqu'à voir
//  tout le Japon. Le recul se fait par paliers, sur la musique (deux mesures chacun) : un mouvement rapide,
//  puis un temps presque arrêté où les lieux entrés dans l'image s'allument un à un, du centre vers les bords,
//  et le compteur monte. La caméra ne tourne plus pendant le recul : les lieux restent où on les a vus.
//  À la fin : « 132 places. One map. » et l'adresse. Musique : « Awayuki » de PeriTune, qui s'envole à 7 s du
//  film ; ses mesures durent 1,41 s.
//  Le propriétaire a trouvé la première version (2026-10-10) mal tournée : les lieux se voyaient mal pendant
//  le recul (ils s'allumaient au bord de l'image pendant que la carte tournait, en points de 11 px).
// ================================================================
(() => {
  const film = window.__creerFilm({ duree: 30, css: `
    /* les lieux restent cachés tant qu'ils ne sont pas apparus ; ils s'allument d'un coup, avec un anneau */
    .repere:not(.fm-vu) { visibility: hidden !important; }
    .repere { --t: 1 !important; }
    #carte.loin .repere-tete { width: 16px; height: 16px; bottom: -8px; border-width: 2px; }
    .repere.fm-vu > * { animation: fm-allume .5s cubic-bezier(.2, 1.4, .4, 1) both; }
    #carte .repere.fm-vu .repere-tete::after { content: ""; position: absolute; inset: -5px; border-radius: 50%; pointer-events: none;
      border: 3px solid color-mix(in oklab, var(--c, #a8321f) 78%, #4a3521); animation: fm-anneau .85s ease-out both; }
    @keyframes fm-allume { 0% { scale: 0; filter: brightness(2.2); } 55% { scale: 1.45; } 100% { scale: 1; filter: none; } }
    @keyframes fm-anneau { 0% { scale: .7; opacity: 1; } 100% { scale: 2.9; opacity: 0; } }
    /* le compteur, en haut à gauche (au-dessus de la mer du Japon : le cap de la caméra la met à gauche),
       sur un cartouche de parchemin à double filet */
    #film .fm-compteur { position: absolute; left: 24px; top: 96px; transform-origin: 0 50%; display: flex; align-items: baseline; gap: 11px;
      padding: 6px 24px 10px; color: #2c1e14; background: var(--grain) 0 0 / 240px 240px, #efe4c8; border: 1.5px solid #8a6b45; border-radius: 2px;
      box-shadow: inset 0 0 0 4px #efe4c8, inset 0 0 0 5.5px rgba(138, 107, 69, .55), 0 10px 26px rgba(40, 26, 12, .4); }
    #film .fm-compteur b { font: 400 64px/1 "Zen Antique", serif; color: #a8321f; font-variant-numeric: tabular-nums; min-width: 1.6ch; text-align: right; }
    #film .fm-compteur span { font: italic 400 28px/1 "IM Fell English", Georgia, serif; }
    /* les textes, sous le compteur */
    #film .fm-texte { position: absolute; left: 28px; width: 440px; text-align: left; }
    #film .fm-texte b { display: block; font: 400 38px/1.12 "Zen Antique", serif; color: #2c1e14;
      text-shadow: 0 0 3px #f6eedb, 0 0 9px #f6eedb, 0 0 18px rgba(246, 238, 219, .95), 0 0 34px rgba(246, 238, 219, .7); }
    #film .fm-texte b em { font-style: normal; color: #a8321f; }
    #film .fm-texte span { display: inline-block; will-change: transform, opacity; }
    /* la fin : l'adresse, en bas, au-dessus de la zone de la légende TikTok */
    #film .fm-fin { position: absolute; left: 252px; top: 650px; translate: -50% 0; text-align: center; white-space: nowrap; }
    #film .fm-fin .fm-adresse { display: inline-flex; align-items: center; gap: 12px; padding: 12px 22px 12px 12px; border-radius: 40px;
      background: #a8321f; color: #f6eedb; font: 700 22px/1 "Noto Sans", sans-serif; box-shadow: 0 6px 16px rgba(40, 26, 12, .4); }
    #film .fm-fin .fm-adresse img { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; border: 2px solid #f6eedb; }
    #film .fm-fin .fm-bio { margin-top: 14px; font: 700 19px/1.2 "Noto Sans", sans-serif; color: #2c1e14;
      text-shadow: 0 0 3px #f6eedb, 0 0 9px #f6eedb, 0 0 16px rgba(246, 238, 219, .9); }
    #film .fm-fin .fm-bio i { font-style: normal; color: #a8321f; }
    #film .fm-fin .fm-credit { margin-top: 10px; font: 11px/1.3 "Noto Sans", sans-serif; color: #35251a;
      text-shadow: 0 0 3px #f6eedb, 0 0 8px #f6eedb; }
  ` });
  const { map, borne, sortie, ressort, f, element, chaqueImage, attendre, tuilesPretes, quand } = film;

  // ---------------------------------------------------------------- Le rythme
  // La musique s'envole à 7 s ; ses mesures durent 1,41 s : chaque palier dure deux mesures (A à E)
  const MESURE = 1.4125, PHRASE = 2 * MESURE;
  const [A, B, C, D, E] = [0, 1, 2, 3, 4].map((k) => 7.25 + k * PHRASE); // 7,25 · 10,08 · 12,91 · 15,74 · 18,57
  const D_TEXTE_FIN = E + 1.7; // « One map. »
  const D_ADRESSE = E + 1.5 * PHRASE; // 22,8 s, sur une mesure

  // ---------------------------------------------------------------- La caméra
  // [t, lng, lat, zoom, inclinaison, cap] : chaque palier a deux clés (son début et sa fin) presque identiques,
  // si bien que la caméra y est presque arrêtée et ne tourne pas ; les mouvements sont entre deux paliers.
  // Le cap suit l'axe du Japon : vers l'est-nord-est au-dessus de l'ouest de Honshū, puis vers le nord-est (38°,
  // la vue de départ du site sur téléphone : le Japon debout dans l'écran). Le palier C reste juste au-dessus du
  // zoom 6,2 (en dessous, les repères deviennent des points) : on y voit encore leurs blasons.
  const CLES = [
    [0, 132.3196, 34.2960, 14.1, 64, 172], // le torii d'Itsukushima, en orbite lente pendant l'accroche
    [A, 132.3196, 34.2960, 12.9, 62, 112.5],
    [A + 1.2, 132.45, 34.40, 8.8, 54, 68], [B, 132.47, 34.41, 8.62, 54, 68], // A : la baie de Hiroshima
    [B + 1.15, 133.10, 34.62, 7.6, 51, 64], [C, 133.14, 34.64, 7.42, 51, 64], // B : l'ouest de Honshū, Shikoku
    [C + 1.15, 134.25, 34.95, 6.5, 48, 56], [D, 134.32, 34.98, 6.32, 48, 56], // C : de Kyūshū au Kansai
    [D + 1.15, 135.60, 35.90, 5.45, 41, 45], [E, 135.66, 35.95, 5.3, 41, 45], // D : la moitié du Japon
    [E + 1.9, 135.75, 36.15, 4.18, 34, 38], [D_ADRESSE, 135.76, 36.16, 4.15, 34, 38.6], // E : tout le Japon
    // quand l'adresse arrive en bas, le Japon recule un peu et remonte pour lui laisser la place
    [D_ADRESSE + 1.5, 134.75, 35.1, 3.86, 34, 40], [31, 134.75, 35.1, 3.8, 34, 42],
  ];
  const merc = ([lng, lat]) => [(lng + 180) / 360, (1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) / 2];
  const geo = ([x, y]) => [x * 360 - 180, (360 / Math.PI) * Math.atan(Math.exp((1 - 2 * y) * Math.PI)) - 90];

  /** Interpolation cubique monotone (Fritsch–Carlson) : passe par les clés, sans dépasser entre elles. */
  function monotone(ts, vs) {
    const n = ts.length, d = [], m = new Array(n).fill(0);
    for (let i = 0; i < n - 1; i++) d.push((vs[i + 1] - vs[i]) / (ts[i + 1] - ts[i]));
    for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]);
    return (t) => {
      if (t <= ts[0]) return vs[0];
      if (t >= ts[n - 1]) return vs[n - 1];
      let i = 0;
      while (t > ts[i + 1]) i++;
      const h = ts[i + 1] - ts[i], s = (t - ts[i]) / h;
      return (2 * s ** 3 - 3 * s ** 2 + 1) * vs[i] + (s ** 3 - 2 * s ** 2 + s) * h * m[i] + (-2 * s ** 3 + 3 * s ** 2) * vs[i + 1] + (s ** 3 - s ** 2) * h * m[i + 1];
    };
  }
  const ts = CLES.map((c) => c[0]);
  const xy = CLES.map((c) => merc([c[1], c[2]]));
  const [fx, fy] = [0, 1].map((k) => monotone(ts, xy.map((p) => p[k])));
  const [fz, fp, fc] = [3, 4, 5].map((k) => monotone(ts, CLES.map((c) => c[k])));
  const camera = (t) => ({ center: geo([fx(t), fy(t)]), zoom: fz(t), pitch: fp(t), bearing: fc(t) });

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
  texte({ de: 0.7, a: A - 0.4, y: 202, html: 'I filmed in *Japan…' });
  texte({ de: A + 0.1, a: B + 0.9, y: 202, html: '…and *every|other one' });
  texte({ de: D_TEXTE_FIN, a: 31, y: 202, html: 'One *map.' });

  // ---------------------------------------------------------------- Le compteur et les lieux qui s'allument
  /** Où est la tête du repère (l'élément du repère lui-même n'a pas de taille) ? null s'il n'est pas dessiné. */
  const position = (el) => {
    const r = (el.querySelector('.repere-tete') || el).getBoundingClientRect();
    if (!r.right && !r.bottom) return null;
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };
  const RYTHME = 42; // lieux allumés par seconde, au plus : ils s'allument en cascade, pas tous à la fois
  let total = 0; // le nombre de lieux de la carte (lu au début : le compteur du menu Catégories)
  let vus = 0, affiche = 1, compte = false, credit = 0, avant = 0;
  const compteur = element('fm-compteur', '<b>1</b><span>place</span>');
  const [nombre, mot] = compteur.children;
  compteur.hidden = true;
  chaqueImage((t) => {
    const pc = borne((t - 0.3) / 0.45);
    compteur.hidden = t < 0.3;
    if (!compte || compteur.hidden) return;
    const dt = Math.max(0, t - avant);
    avant = t;
    // les lieux bien entrés dans l'image (pas au ras du bord) s'allument, les plus proches du centre d'abord
    if (t >= A) {
      const W = innerWidth, H = innerHeight, mx = W * 0.05, my = H * 0.04;
      const prets = [];
      for (const el of document.querySelectorAll('.repere:not(.fm-vu)')) {
        const p = position(el);
        if (p && p.x > mx && p.x < W - mx && p.y > my && p.y < H - my) prets.push([Math.hypot(p.x - W / 2, p.y - H * 0.55), el]);
      }
      prets.sort((a, b) => a[0] - b[0]);
      credit = Math.min(credit + dt * RYTHME, 6);
      while (credit >= 1 && prets.length) { prets.shift()[1].classList.add('fm-vu'); vus++; credit--; }
      if (!prets.length) credit = Math.min(credit, 1);
    }
    const vise = t >= D_TEXTE_FIN - 0.5 ? total : Math.max(1, Math.min(total, vus));
    affiche += (vise - affiche) * 0.3;
    if (Math.abs(vise - affiche) < 0.5) affiche = vise;
    const n = Math.round(affiche);
    if (nombre.textContent !== String(n)) {
      nombre.textContent = n;
      mot.textContent = n > 1 ? 'places' : 'place';
    }
    // le cartouche arrive, puis bat un peu à chaque nouveau lieu
    const pulse = Math.min(1, Math.abs(vise - affiche) / 6);
    compteur.style.opacity = f(Math.min(1, pc * 3));
    compteur.style.transform = `scale(${f((pc < 1 ? 0.6 + 0.4 * ressort(pc) : 1) * (1 + 0.06 * pulse), 4)})`;
  });
  // à la fin, ceux qui restent cachés dans l'image (sous le compteur, par exemple) s'allument aussi
  quand(D_TEXTE_FIN - 0.5, () => { for (const el of document.querySelectorAll('.repere:not(.fm-vu)')) el.classList.add('fm-vu'); });

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
  }(D_ADRESSE));

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
      for (let t = 30; t >= 0; t -= 0.5) {
        map.jumpTo(camera(t));
        await tuilesPretes(3);
      }
      map.jumpTo(camera(0));
      await tuilesPretes(6);
      await attendre(1.5);
      // le premier lieu est déjà là
      const W = innerWidth, H = innerHeight;
      for (const el of document.querySelectorAll('.repere')) {
        const p = position(el);
        if (p && Math.hypot(p.x - W / 2, p.y - H / 2) < W * 0.3) { el.classList.add('fm-vu'); vus++; }
      }
      compte = true;
    },
  });
  window.__zoomCamera = camera; // pour régler les vues (essais)
})();
