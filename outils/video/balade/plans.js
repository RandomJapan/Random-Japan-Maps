// Les prises des vidéos de la balade 3D (rushes.py les filme) : chaque prise joue un moment de la balade tout seule,
// dans la vraie page (site/balade/), le temps ralenti (outils/video/ralenti.js), pendant que rushes.py capture une
// image chaque fois que l'horloge de la prise passe 1/60 s. Injecté après le chargement (window.balade, le voyageur
// déjà accueilli) ; window.__PRISE dit laquelle jouer.
// Une prise : { duree (s), preparer(o) (avant le ralenti, en temps réel : se placer, faire tomber la nuit…),
// debut(o), chaque(t, dt, o) (à chaque image, t : le temps de la prise), quand: [[t, fn], …] }.
(() => {
  // les minuteries de la page suivent son temps, même quand le ralenti change entre deux passages filmés (ralenti.js)
  window.__minuteriesVirtuelles = true;
  const B = window.balade;
  const PI = Math.PI;
  const M = () => B.monde();
  const e = B.etat;
  const V3 = B.camera.position.constructor;

  // ---------------------------------------------------------------- les outils des prises
  const touche = (code, bas) => dispatchEvent(new KeyboardEvent(bas ? 'keydown' : 'keyup', { code, key: code === 'KeyC' ? 'c' : code, bubbles: true }));
  const tenues = new Set();
  const O = {
    B, M, e, PI, jeu: B.jeu,
    touche,
    /** A (parler, lire, valider). */
    appuyer() { touche('KeyE', true); touche('KeyE', false); },
    /** Tenir des touches (marcher : KeyW ; courir : ShiftLeft) jusqu'à lacher(). */
    tenir(...codes) { for (const c of codes) { tenues.add(c); touche(c, true); } },
    lacher(...codes) { for (const c of codes.length ? codes : [...tenues]) { tenues.delete(c); touche(c, false); } },
    /** Le sol (le dessus de ce qui porte) en x, z, en partant de haut. */
    sol: (x, z, y = 60) => M().lieu.monde.hauteur(x, z, y),
    /** Le voyageur en (x, z), tourné vers (vx, vz), la caméra derrière lui (ecart : tournée autour), le compagnon à côté. */
    placer(x, z, vx, vz, { ecart = 0, tangage = 0.24, distance = 6.4, y = 60, compagnon = true } = {}) {
      const cap = Math.atan2(vx - x, vz - z);
      Object.assign(e, { x, z, cap, vx: 0, vz: 0 });
      e.y = M().lieu.monde.hauteur(x, z, y);
      Object.assign(B.cam, { lacet: cap + PI + ecart, tangage, distance });
      if (compagnon) O.compagnon(x - Math.sin(cap) * 1.3 + Math.cos(cap) * 0.8, z - Math.cos(cap) * 1.3 - Math.sin(cap) * 0.8, cap);
      B.camera.userData.place = false;
    },
    /** Le compagnon en (x, z), tourné vers cap. */
    compagnon(x, z, cap) {
      Object.assign(B.renard, { x, z, cap: cap ?? B.renard.cap, vitesse: 0 });
      B.renard.y = M().lieu.monde.hauteur(x, z, e.y + 1);
    },
    /** La caméra posée : de [x, y, z], vers [x, y, z], champ vertical en degrés ; null : derrière le voyageur. */
    cadre(de, vers, champ = 50) {
      if (!de) { M().cadre = null; B.camera.userData.place = false; return; }
      const c = M().cadre;
      if (c && c.de && c.prise) { c.de.set(...de); c.vers.set(...vers); c.champ = champ; return; }
      M().cadre = { de: new V3(...de), vers: new V3(...vers), champ, prise: true };
    },
    /** En marchant : la caméra derrière, tournée vers (x, z) (k : 1 d'un coup, moins : doucement). */
    viser(x, z, k = 1) {
      const voulu = Math.atan2(-(x - e.x), -(z - e.z));
      const d = ((voulu - B.cam.lacet + PI) % (2 * PI) + 2 * PI) % (2 * PI) - PI;
      B.cam.lacet += d * k;
    },
    passant: (id) => M().passants.find((q) => q.id === id),
    inter: (id) => M().lieu.interactions.find((q) => q.id === id),
    /** Le texte de la boîte de dialogue (vide si fermée). */
    texte: () => (document.querySelector('.dialogue').hidden ? '' : document.querySelector('.dialogue-texte').textContent),
    dialogue: () => !document.querySelector('.dialogue').hidden,
    choix: () => !document.querySelector('.dialogue-choix').hidden,
    /** La nuit (ou le jour) tout de suite. */
    nuitTout(oui) { const N = M().nuit; N.cible = oui ? 1 : 0; return B.jeu.nuit(oui); },
    /**
     * Un chemin de caméra : cles [[t, [x, y, z] (d'où), [x, y, z] (vers), champ], …], lissé (Hermite, tangentes de
     * Catmull-Rom, nulles aux deux bouts : départ et arrivée en douceur). Renvoie [de, vers, champ] au temps t.
     */
    chemin(cles, t) {
      if (t <= cles[0][0]) return [cles[0][1], cles[0][2], cles[0][3]];
      const n = cles.length;
      if (t >= cles[n - 1][0]) return [cles[n - 1][1], cles[n - 1][2], cles[n - 1][3]];
      let i = 0;
      while (t > cles[i + 1][0]) i++;
      const [t0] = cles[i], [t1] = cles[i + 1], h = t1 - t0, s = (t - t0) / h;
      const h00 = 2 * s ** 3 - 3 * s ** 2 + 1, h10 = s ** 3 - 2 * s ** 2 + s, h01 = -2 * s ** 3 + 3 * s ** 2, h11 = s ** 3 - s ** 2;
      const tan = (k, j, c) => {
        if (k === 0 || k === n - 1) return 0;
        const a = cles[k - 1], b = cles[k + 1];
        const va = j === 3 ? a[3] : a[j][c], vb = j === 3 ? b[3] : b[j][c];
        return ((vb - va) / (b[0] - a[0])) * h;
      };
      const val = (j, c) => {
        const p0 = j === 3 ? cles[i][3] : cles[i][j][c], p1 = j === 3 ? cles[i + 1][3] : cles[i + 1][j][c];
        return h00 * p0 + h10 * tan(i, j, c) + h01 * p1 + h11 * tan(i + 1, j, c);
      };
      return [[0, 1, 2].map((c) => val(1, c)), [0, 1, 2].map((c) => val(2, c)), val(3)];
    },
    /** S lisse de 0 à 1 entre a et b. */
    lisse: (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); },
    attendre: (ms) => new Promise((r) => setTimeout(r, ms)),
    /**
     * Lire tout seul (à appeler à chaque image) : une page de dialogue écrite en entier reste delai secondes, puis A ;
     * dans un choix, l'option choix (comptée depuis celle qui est marquée d'abord).
     */
    lire(t, { delai = 0.7, choix = 0 } = {}) {
      const $ = (s) => document.querySelector(s);
      if ($('.dialogue').hidden) { lu.depuis = null; return; }
      const fini = !$('.dialogue-suite').hidden || !$('.dialogue-choix').hidden, texte = $('.dialogue-texte').textContent;
      if (!fini) { lu.depuis = null; return; }
      if (lu.depuis === null || texte !== lu.texte) { lu.depuis = t; lu.texte = texte; return; }
      if (t - lu.depuis < delai) return;
      if (!$('.dialogue-choix').hidden) for (let i = 0; i < choix; i++) { touche('ArrowDown', true); touche('ArrowDown', false); }
      lu.depuis = null;
      O.appuyer();
    },
  };
  const lu = { depuis: null, texte: '' };
  // (pour les repérages : les outils des prises, depuis la console ou un script)
  window.__O = O;
  /** Ce que fait une interaction du lieu (comme si l'on avait appuyé sur A devant elle). */
  O.agir = async (id) => {
    const i = O.inter(id), p = i.passant ? O.passant(i.passant) : null;
    e.mode = 'dialogue';
    e.vx = e.vz = 0;
    e.cap = Math.atan2((p ? p.etat.x : i.x) - e.x, (p ? p.etat.z : i.z) - e.z);
    if (p) p.etat.parle = true;
    try { await i.action(B.jeu); } finally { if (p) p.etat.parle = false; if (e.mode === 'dialogue') e.mode = 'jeu'; }
  };
  /** Un petit jeu en cours (les nouilles) : A toutes les periode secondes. */
  let dernierA = -1;
  O.taper = (t, periode = 0.3) => { if (t - dernierA >= periode) { dernierA = t; O.appuyer(); } };

  const PRISES = {
    // ================================================================ Vidéo 1 : la balade, les cinq lieux
    // Itsukushima : le voyageur marche sur la plage vers le grand torii (le plan qui répond à la vidéo du propriétaire)
    'it-plage': {
      duree: 4.5,
      preparer(o) { o.placer(31.5, -9.5, 0, -70, { tangage: 0.04, distance: 6.2, ecart: 0.06 }); },
      debut(o) { o.tenir('KeyW'); },
      chaque(t, dt, o) { o.viser(0, -70, 0.05); },
    },
    // Aogashima : le belvédère rond, et Maruyama, le petit volcan dans le cratère (comme le drone du propriétaire)
    'ao-belv': {
      duree: 4.5,
      preparer(o) { o.y = o.sol(1, -82.1, 200); o.placer(1.2, -80.6, 5, 7, { compagnon: false }); o.compagnon(2.3, -81.2, 0.2); },
      chaque(t, dt, o) {
        const y = o.y;
        o.cadre(...o.chemin([[0, [1, y + 15, -101], [4, y - 25, -20], 48], [4.5, [1.6, y + 9.5, -93.5], [4.6, y - 21, -20], 46]], t));
      },
    },
    // Gokayama : le village du haut du belvédère, la caméra glisse ; le voyageur à la balustrade
    'gk-village': {
      duree: 4.5,
      preparer(o) { o.placer(-57.6, -61.6, 0, -6, { compagnon: false }); o.compagnon(-56.4, -62.4, 0.6); },
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [-63, 18.8, -69.5], [-2, 0, -8], 50], [4.5, [-61.4, 18.5, -68.2], [1, 0, -4], 48]], t));
      },
    },
    // Himeji : sur le pont, vers la grande porte ; la caméra monte et découvre le donjon au-dessus
    'hm-pont': {
      duree: 4.5,
      preparer(o) { o.placer(0, 40.5, 0, -56, { compagnon: true }); },
      debut(o) { o.tenir('KeyW'); },
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [0.9, 1.7, 47.5], [0, 3.2, 30], 56], [4.5, [0.5, 4.2, 42.5], [0, 15.5, -40], 56]], t));
      },
    },
    // Takachiho : en barque vers la cascade de Manai
    'tk-barque': {
      duree: 4.5,
      preparer(o) {
        o.jeu.embarquer();
        const b = o.M().barque;
        Object.assign(b, { x: 2.5, z: 27, cap: Math.atan2(-6 - 2.5, 11 - 27), v: 0, w: 0 });
        o.B.cam.lacet = b.cap + PI;
        o.B.camera.userData.place = false;
      },
      debut(o) { o.tenir('KeyW'); },
      chaque(t, dt, o) {
        const b = o.M().barque;
        // la caméra sur l'eau, derrière la barque, basse : la cascade à gauche
        o.cadre([b.x + 3.2, -14.2, b.z + 7.5], [b.x - 6, -11, b.z - 14], 58);
      },
    },
    // le choix du compagnon, au départ : les trois en rang, chacun bondit quand on le marque ; Kon, puis les nuages
    'trio': {
      duree: 9.5,
      // (la caméra du jeu, un peu plus près : en hauteur, les trois tenaient dans un coin de l'image)
      chaque(t, dt, o) {
        const c = o.M().cadre;
        if (c && !c.prise) { if (!c.orig) c.orig = { de: c.de.clone(), vers: c.vers.clone() }; c.de.copy(c.orig.de).lerp(c.orig.vers, 0.3); }
      },
      quand: [
        [0.2, (o) => o.appuyer()], // « Te revoilà à … » : la suite
        [1.5, (o) => o.appuyer()], // « Trois compagnons… » : « Lequel choisis-tu ? »
        [2.9, (o) => { o.touche('ArrowDown', true); o.touche('ArrowDown', false); }], // Pon
        [4.0, (o) => { o.touche('ArrowDown', true); o.touche('ArrowDown', false); }], // Chapu
        [5.1, (o) => { o.touche('ArrowDown', true); o.touche('ArrowDown', false); }], // Kon
        [6.0, (o) => o.appuyer()], // Kon ! les deux autres s'en vont dans un nuage
      ],
    },
    // les hautes herbes d'Itsukushima : à force d'y marcher… « Un daim sauvage apparaît ! »
    'it-herbes': {
      duree: 7,
      preparer(o) { o.placer(-29, 26.5, -8, 26.5, { tangage: 0.3, distance: 5.6 }); },
      debut(o) { o.tenir('KeyW'); },
      chaque(t, dt, o) { o.lire(t, { delai: 1.2 }); },
    },
    // le grand torii : la main sur le pilier, le tampon
    'it-torii': {
      duree: 7,
      preparer(o) { o.placer(6.7, -68.4, 5.6, -70, { tangage: 0.18, distance: 5, ecart: 0.5 }); },
      quand: [[0.3, (o) => o.appuyer()]],
      chaque(t, dt, o) { o.lire(t, { delai: 0.6 }); },
    },
    // Himeji : nourrir les carpes du pont (le sachet de la vieille dame déjà dans le sac)
    'hm-koi': {
      duree: 7,
      preparer(o) { o.jeu.donner('fu'); o.placer(1.7, 35.6, 1.7, 34, { tangage: 0.3 }); },
      quand: [[0.3, (o) => o.appuyer()]],
      chaque(t, dt, o) { o.lire(t, { delai: 0.8 }); },
    },
    // Gokayama la nuit : les fenêtres de papier allumées, les lucioles du ruisseau
    'gk-nuit': {
      duree: 5,
      async preparer(o) { o.placer(-57.6, -61.6, 0, -6, { compagnon: false }); o.compagnon(-56.4, -62.4, 0.6); await o.nuitTout(true); },
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [-63.5, 18.9, -70], [-3, 0, -9], 50], [5, [-61.6, 18.4, -68.4], [1, 0, -4], 48]], t));
      },
    },
    // Itsukushima la nuit : le feu d'artifice derrière le torii (acheté au marchand)
    'it-feux': {
      duree: 12,
      async preparer(o) { o.placer(28, -5, 0, -70); await o.nuitTout(true); },
      quand: [[0.2, (o) => o.B.lancerFeux()]],
      chaque(t, dt, o) { o.lire(t, { delai: 0.5 }); },
    },

    // ================================================================ Vidéo 2 : Takachiho en détail
    // la cascade de Manai vue de l'eau (le plan qui répond à la vidéo du propriétaire)
    'tk-eau': {
      duree: 5,
      preparer(o) { o.placer(-0.6, 65.1, 0, 0, { compagnon: false }); },
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [4.5, -13.6, 35], [-7, -9.8, 8], 58], [5, [2.2, -14.1, 26.5], [-7.5, -9.2, 8], 58]], t));
      },
    },
    // ramer jusque sous la cascade : on est trempé, le tampon
    'tk-rame': {
      duree: 13,
      preparer(o) {
        o.jeu.embarquer();
        const b = o.M().barque, ar = o.M().lieu.barque.arrose;
        // (de l'est : du sud, une barque de promeneurs ou un rocher l'arrête à 6 m)
        Object.assign(b, { x: ar.x + 6.5, z: ar.z + 1.5, v: 0, w: 0 });
        b.cap = Math.atan2(ar.x - b.x, ar.z - b.z);
        o.B.cam.lacet = b.cap + PI + 0.35;
        o.B.camera.userData.place = false;
      },
      debut(o) { o.tenir('KeyW'); },
      chaque(t, dt, o) {
        // (on rame jusqu'à être sous la cascade)
        if (o.M().barque.arrose > 0.5 || t > 9) o.lacher('KeyW');
        o.lire(t, { delai: 0.9 });
      },
    },
    // les nouilles qui glissent dans le bambou : trois écheveaux attrapés au vol
    'tk-somen': {
      duree: 18,
      preparer(o) { const c = o.passant('chiho').etat; o.placer(c.x + 1.1, c.z - 0.3, c.x, c.z); document.body.classList.add('aide-film'); },
      quand: [[0.3, (o) => o.agir('chiho')]],
      chaque(t, dt, o) {
        const enJeu = o.e.mode === 'dialogue' && !o.dialogue() && !document.querySelector('.aide').classList.contains('vue');
        if (!enJeu) { o.lire(t, { delai: 0.7, choix: 0 }); return; }
        // les écheveaux (le groupe de quatre de takachiho.js) : A quand l'un d'eux passe devant le siège (z 26,0)
        const ech = o.M().lieu.animes.find((a) => a.objet.children.length === 4 && Math.abs(a.objet.children[0].position.x + 30.6) < 1)?.objet.children || [];
        for (const m of ech) if (m.visible && Math.abs(m.position.z - 26.0) < 0.22 && !m.userData.vise) { m.userData.vise = true; o.appuyer(); }
        for (const m of ech) if (!m.visible) m.userData.vise = false;
      },
    },
    // le kagura de la nuit : Uzume danse, Tajikarao ouvre la porte de la grotte
    'tk-kagura': {
      duree: 15,
      async preparer(o) { const c = o.passant('kagura').etat; o.placer(c.x + 1.2, c.z - 0.6, c.x, c.z); await o.nuitTout(true); },
      quand: [[0.3, (o) => o.agir('kagura')]],
      chaque(t, dt, o) { o.lire(t, { delai: 0.9, choix: 0 }); },
    },
    // le reflet sur la paroi, en amont de la cascade : on rame jusqu'au miroir, on le prend
    'tk-miroir': {
      duree: 12,
      preparer(o) {
        o.jeu.embarquer();
        const b = o.M().barque, i = o.inter('miroir');
        Object.assign(b, { x: i.x + 1.2, z: i.z + 8.5, v: 0, w: 0 });
        b.cap = Math.atan2(i.x - b.x, i.z - b.z);
        o.B.cam.lacet = b.cap + PI;
        o.B.camera.userData.place = false;
      },
      debut(o) { o.tenir('KeyW'); },
      chaque(t, dt, o) {
        const bulle = !document.querySelector('.bulle-action').hidden && document.querySelector('.bulle-action span').textContent === 'Take';
        if (o.tenues === undefined) o.tenues = true;
        if (bulle && o.tenues) { o.lacher('KeyW'); o.tenues = false; o.pris = t + 0.5; }
        if (o.pris && t >= o.pris) { o.pris = 0; o.appuyer(); }
        o.lire(t, { delai: 0.9 });
      },
    },
    // le secret : le miroir au sakaki face à la grotte, l'éclipse, les coqs, la danse, la porte, la lumière, le koban
    'tk-eclipse': {
      duree: 32,
      preparer(o) { o.jeu.donner('miroir'); o.placer(-40, -108.6, -40, -110.6); },
      quand: [[0.3, (o) => o.agir('yohai')]],
      chaque(t, dt, o) { o.lire(t, { delai: 0.9 }); },
    },
    // la même scène, la caméra près de la grotte d'Amaterasu quand la porte s'écarte et que la lumière jaillit
    'tk-grotte': {
      duree: 26,
      preparer(o) { o.jeu.donner('miroir'); o.placer(-40, -108.6, -40, -110.6); },
      quand: [[0.3, (o) => o.agir('yohai')]],
      chaque(t, dt, o) {
        o.lire(t, { delai: 0.9 });
        if (t > 17.5) o.cadre(...o.chemin([[17.5, [-36.2, -3.2, -114.5], [-40, -4.6, -126.6], 50], [26, [-37.4, -3.9, -117.5], [-40, -4.4, -126.6], 50]], t));
      },
    },
    // le cinquième tampon (une pierre sur un tas de la grotte des dieux) : la récompense, le collier de magatama
    'tk-collier': {
      duree: 24,
      preparer(o) { const i = o.inter('tas'); o.placer(i.x + 0.6, i.z + 0.9, i.x, i.z, { y: i.y + 1 }); },
      quand: [[0.3, (o) => o.agir('tas')]],
      chaque(t, dt, o) { o.lire(t, { delai: 0.9, choix: 0 }); },
    },

    // ================================================================ Vidéo 3 : les secrets, les koban, Bunbuku
    // Itsukushima : la douceur sur la pierre, les corbeaux descendent, la prennent, mènent de perchoir en perchoir jusqu'au
    // bosquet de bambous, qui s'ouvre ; le koban du sanctuaire caché
    'it-corbeaux': {
      duree: 56,
      preparer(o) { o.jeu.donner('manju'); o.placer(49.6 - 1.3, 44 - 0.4, 49.6, 44, { tangage: 0.22 }); o.etape = 0; },
      quand: [[0.3, (o) => o.agir('pierre')]],
      chaque(t, dt, o) {
        o.lire(t, { delai: 0.9 });
        const libre = o.e.mode === 'jeu' && !o.dialogue();
        if (o.etape === 0 && t > 4 && libre) {
          o.etape = 1;
          o.jeu.marcher([[o.e.x, o.e.z], [44, 41.5], [39, 37.5], [32, 33], [26, 34], [23, 38.6], [22.4, 40.6]], 3.2).then(() => { o.etape = 2; });
        }
        // (la porte de bambous ouverte : on entre, on prend le koban sur le sanbō)
        if (o.etape === 2 && libre && o.inter('koban').si(o.jeu)) {
          o.etape = 3;
          o.jeu.marcher([[o.e.x, o.e.z], [17.2, 40.6], [14.9, 40.6]], 2.2).then(() => { o.etape = 4; o.agir('koban'); });
        }
      },
    },
    // Aogashima : la dernière page du carnet des voyageurs, la carte au trésor
    'ao-carte': {
      duree: 16,
      preparer(o) { const i = o.inter('cahier'); o.placer(i.x + 0.7, i.z + 0.7, i.x, i.z, { y: i.y + 1 }); },
      quand: [[0.3, (o) => o.agir('cahier')]],
      chaque(t, dt, o) { o.lire(t, { delai: 0.6 }); },
    },
    // Aogashima : creuser au pied du camélia rouge : la boîte en fer, la photo de classe de 1985, la lettre, le koban
    'ao-tresor': {
      duree: 26,
      preparer(o) { o.jeu.voirIndice('carte-tresor'); const i = o.inter('creuser'); o.placer(i.x + 1.1, i.z + 0.4, i.x, i.z); },
      quand: [[0.3, (o) => o.agir('creuser')]],
      chaque(t, dt, o) { o.lire(t, { delai: 1.0 }); },
    },
    // Gokayama, la nuit : la luciole dorée des Heike, du ruisseau jusqu'à la tombe sous les cèdres ; l'essaim, le koban
    'gk-luciole': {
      duree: 60,
      async preparer(o) { o.placer(27, -17.5, 21.4, -15.5); await o.nuitTout(true); o.etape = 0; },
      chaque(t, dt, o) {
        o.lire(t, { delai: 0.9 });
        const libre = o.e.mode === 'jeu' && !o.dialogue();
        if (o.etape === 0 && t > 0.5 && libre) {
          o.etape = 1;
          const L = [[21.4, -15.5], [12.3, -13.6], [5.3, -12.0], [-6.9, -10.7], [-18.6, -12.2], [-28.6, -14.1], [-38.5, -16.3], [-37.8, -21.6], [-39.0, -26.5], [-45.0, -26.5], [-52.8, -21.3], [-58.6, -21.8]];
          // (un peu à côté du chemin de la luciole, au bord du ruisseau, côté nord)
          o.jeu.marcher([[o.e.x, o.e.z], ...L.map(([x, z]) => [x + 0.4, z + 1.2])], 2.5).then(() => { o.etape = 2; o.prendreA = o.temps + 1.5; });
        }
        o.temps = t;
        if (o.etape === 2 && libre && t > o.prendreA && o.inter('tombe').verbe(o.jeu) === 'prendre') { o.etape = 3; o.agir('tombe'); }
      },
    },
    // Himeji, la nuit : rendre la dixième assiette au fantôme d'Okiku ; elle compte jusqu'à dix, devient dorée, monte au ciel
    'hm-okiku': {
      duree: 30,
      async preparer(o) { o.jeu.donner('assiette'); const i = o.inter('puits'); o.placer(i.x + 1.0, i.z + 0.6, i.x, i.z - 1.3); o.y = i.y; await o.nuitTout(true); },
      quand: [[0.3, (o) => o.agir('puits')]],
      chaque(t, dt, o) {
        o.lire(t, { delai: 0.6 });
        // (près du puits, la flamme bleue à hauteur des yeux ; quand elle devient dorée, la caméra la suit vers le ciel)
        const y = o.y;
        o.cadre(...o.chemin([[0, [15.6, y + 1.5, -27.0], [12, y + 1.6, -30.5], 50], [9.5, [15.0, y + 1.3, -27.6], [12, y + 1.9, -30.5], 50],
          [13.5, [15.4, y + 1.0, -27.2], [12, y + 6.5, -31], 58], [18, [15.4, y + 1.2, -27.2], [12, y + 1.5, -30.5], 52]], t));
      },
    },
    // Bunbuku, le marchand ambulant (Itsukushima) : il se présente, ouvre sa boutique ; le kimono d'or, acheté
    'bunbuku': {
      duree: 20,
      preparer(o) { const i = o.inter('marchand'); o.placer(i.x + 1.6, i.z - 1.0, i.x, i.z); },
      quand: [
        [0.3, (o) => o.agir('marchand')],
        [10.5, () => document.querySelector('.boutique [data-article="feux"]')?.click()],
        [12.5, () => document.querySelector('.boutique [data-article="armure"]')?.click()],
        [14.5, () => document.querySelector('.boutique [data-article="kimonoOr"]')?.click()],
        [16.5, () => document.querySelector('.boutique .acheter')?.click()],
      ],
      chaque(t, dt, o) {
        if (t < 10) o.lire(t, { delai: 0.9 });
        // pendant qu'il se présente : la caméra par-dessus l'épaule du voyageur, sur Bunbuku (la caméra du jeu, derrière le
        // voyageur, le cachait) ; ensuite, celle de la boutique
        if (t < 9.6) {
          const i = o.inter('marchand'), dx = o.e.x - i.x, dz = o.e.z - i.z, l = Math.hypot(dx, dz) || 1, ux = dx / l, uz = dz / l;
          o.cadre([o.e.x + ux * 2.2 - uz * 1.1, i.y + 1.55, o.e.z + uz * 2.2 + ux * 1.1], [i.x - uz * 0.25, i.y + 0.95, i.z + ux * 0.25], 46);
        }
      },
    },
    // la garde-robe : le voyageur essaie le kimono d'or, l'armure de samouraï, le happi et le masque de renard
    'garde-robe': {
      duree: 11,
      preparer(o) { o.placer(30, 24, 20, 10, { compagnon: true }); },
      // (le panneau de la garde-robe est caché : on ne voit que le voyageur, de face, changer de tenue)
      chaque(t, dt, o) {
        if (t < 0.3) return;
        const e = o.e, c = e.cap0 ?? (e.cap0 = e.cap);
        o.cadre([e.x + Math.sin(c) * 3.3, e.y + 1.2, e.z + Math.cos(c) * 3.3], [e.x, e.y + 0.82, e.z], 50);
      },
      quand: [
        [0.2, () => document.querySelector('.btn-tenue').click()],
        [1.6, () => document.querySelector('.garde-robe [data-piece="kimonoOr"]')?.click()],
        [3.6, () => document.querySelector('.garde-robe [data-piece="armure"]')?.click()],
        [4.4, () => document.querySelector('.garde-robe [data-piece="kabuto"]')?.click()],
        [6.6, () => document.querySelector('.garde-robe [data-piece="happi"]')?.click()],
        [7.4, () => document.querySelector('.garde-robe [data-piece="masque"]')?.click()],
        [9.2, () => document.querySelector('.garde-robe [data-piece="bois"]')?.click()],
      ],
    },
    // les compagnons secrets (Gao le shisa, Fuwa le petit dragon, Saya le kodama), au départ, avec les trois autres
    'trio6': {
      duree: 10,
      chaque(t, dt, o) {
        const c = o.M().cadre;
        if (c && !c.prise) { if (!c.orig) c.orig = { de: c.de.clone(), vers: c.vers.clone() }; c.de.copy(c.orig.de).lerp(c.orig.vers, 0.18); }
      },
      quand: [
        [0.2, (o) => o.appuyer()],
        [1.5, (o) => o.appuyer()],
        ...[2.7, 3.6, 4.5, 5.4, 6.3].map((tq) => [tq, (o) => { o.touche('ArrowDown', true); o.touche('ArrowDown', false); }]),
        [7.4, (o) => o.appuyer()],
      ],
    },
    // le calendrier magique : le printemps (les cerisiers), l'automne (les érables), l'hiver (la neige), à Himeji
    'saisons': {
      duree: 12,
      preparer(o) { o.placer(2, 16, 0, -56, { compagnon: true }); o.B.changerSaison('ete', { tout: true }); },
      quand: [[0.4, (o) => o.B.changerSaison('printemps')], [4.4, (o) => o.B.changerSaison('automne')], [8.4, (o) => o.B.changerSaison('hiver')]],
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [6.5, 2.2, 21], [-3, 9, -40], 58], [12, [3, 3.0, 19], [-2, 11, -40], 56]], t));
      },
    },
    // la danse des fêtes (bon-odori), sur la plage d'Itsukushima, le torii derrière
    'danse': {
      duree: 8,
      preparer(o) { o.placer(30, -8, 40, 2, { compagnon: true }); },
      quand: [[0.2, (o) => o.B.commencerDanse()]],
    },

    // ================================================================ Vidéo 4 : le Pavillon d'or (Kinkaku-ji)
    // le pavillon et son reflet, du belvédère de la carte postale (le plan qui répond à la vidéo du propriétaire)
    'kk-reflet': {
      duree: 6,
      preparer(o) { o.placer(29.7, 53.4, 0, 0, { compagnon: false }); o.compagnon(30.6, 53.9, 0.6); },
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [28.0, 2.2, 50.4], [0, 0.2, 0], 44], [6, [26.9, 1.9, 49.0], [0, 0.4, 0], 39]], t));
      },
    },
    // l'étang-miroir de tout près : la caméra glisse au ras de l'eau, le pavillon et son reflet entiers
    'kk-miroir': {
      duree: 5,
      preparer(o) { o.placer(29.7, 53.4, 0, 0, { compagnon: false }); o.compagnon(30.6, 53.9, 0.6); },
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [30.5, -0.2, 21.5], [0, 2.2, 0], 50], [5, [26.4, -0.28, 17.0], [0, 2.8, 0], 47]], t));
      },
    },
    // la cascade de la Porte du Dragon : la carpe de la mare saute vers la chute, deux fois
    'kk-ryumon': {
      duree: 6.5,
      preparer(o) { o.placer(21.2, -45.2, 25.6, -46.2); },
      quand: [[0.9, (o) => o.M().lieu.animes.find((a) => a.sauter).sauter()], [4.2, (o) => o.M().lieu.animes.find((a) => a.sauter).sauter()]],
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [17.4, 1.7, -42.6], [15.6, 1.1, -47.6], 46], [6.5, [17.0, 1.5, -43.4], [15.6, 1.2, -47.6], 44]], t));
      },
    },
    // la pièce dans le bol des statues : le cercle doré va et vient ; on lance quand il est sur le bol (une fois qu'on l'a vu
    // passer un peu), la pièce tinte dedans, le tampon
    'kk-zeni': {
      duree: 16,
      preparer(o) { const i = o.inter('zeni'); o.placer(i.x, i.z, 25.0, -42.05); },
      quand: [[0.3, (o) => o.agir('zeni')]],
      chaque(t, dt, o) {
        o.lire(t, { delai: 0.8, choix: 0 });
        const lancer = o.M().lieu.animes.find((a) => typeof a.lancer === 'function'), anneau = lancer.objet.children[0];
        if (!anneau.visible) { o.vu = null; return; }
        if (o.vu === null || o.vu === undefined) o.vu = t;
        // (la caméra du jeu, haut derrière l'épaule : en hauteur d'écran, une caméra de profil ne tenait pas le voyageur et le
        // bol ensemble ; le bol : BOL de kinkakuji.js)
        if (!o.lance && t - o.vu > 1.6 && Math.hypot(anneau.position.x - 25.0, anneau.position.z + 42.05) < 0.1) { o.lance = true; o.appuyer(); }
      },
    },
    // le salon de thé : assis sur le banc rouge sous l'ombrelle, le matcha et le gâteau à la feuille d'or ; la caméra en face
    'kk-matcha': {
      duree: 14,
      // (sur la place du salon de thé, face à la dame)
      preparer(o) { const c = o.passant('chaya').etat; o.placer(51.6, -66.2, c.x, c.z); },
      quand: [[0.3, (o) => o.agir('chaya')]],
      chaque(t, dt, o) {
        o.lire(t, { delai: 1.0, choix: 0 });
        const pl = o.M().lieu.animes.find((a) => typeof a.poser === 'function' && typeof a.ranger === 'function');
        if (pl && pl.objet.visible) {
          const e = o.e, c = e.cap, p = pl.objet.position;
          o.cadre([e.x + Math.sin(c) * 2.7 - Math.cos(c) * 1.0, e.y + 0.95, e.z + Math.cos(c) * 2.7 + Math.sin(c) * 1.0], [e.x * 0.4 + p.x * 0.6, e.y + 0.75, e.z * 0.4 + p.z * 0.6], 54);
        } else if (o.M().cadre?.prise) o.cadre(null);
      },
    },
    // le bureau des goshuin : le moine écrit au pinceau le nom du pavillon, puis les sceaux rouges
    'kk-goshuin': {
      duree: 14,
      // (devant sa fenêtre : la petite place de kinkakuji.js)
      preparer(o) { const i = o.passant('shuin').etat; o.placer(63.85, -62.8, i.x, i.z); },
      quand: [[0.3, (o) => o.agir('shuin')]],
      chaque(t, dt, o) {
        o.lire(t, { delai: 1.0, choix: 0 });
        // (l'écriture au pinceau est une animation SVG, que ralenti.js ne ralentit pas : au tournage, elle était finie en
        // 0,3 s ; on la mène nous-mêmes, au temps de la prise)
        const svg = document.querySelector('.feuille svg');
        if (svg && svg !== o.svg) { o.svg = svg; o.svgT0 = t; svg.pauseAnimations(); }
        if (svg) svg.setCurrentTime(Math.max(0, t - o.svgT0));
      },
    },
    // le cinquième tampon (le pavillon et son reflet, du belvédère) : la récompense, les ailes du phénix, essayées de face
    'kk-ailes': {
      duree: 30,
      preparer(o) { const i = o.inter('kinkaku'); o.placer(i.x, i.z, 0, 0); },
      quand: [[0.3, (o) => o.agir('kinkaku')]],
      chaque(t, dt, o) { o.lire(t, { delai: 0.7 }); },
    },
    // en courant le long de la rive est, vers le pavillon : les ailes grandes ouvertes, vues de dos (de côté, ouvertes en
    // travers, on ne les voyait que par la tranche) ; la promeneuse en kimono et le touriste, sur cette allée, sont écartés
    'kk-course': {
      duree: 6,
      preparer(o) { o.placer(44.8, 24, 44.6, 20, { compagnon: false }); o.compagnon(45.4, 25.6, PI); o.etape = 0; o.capCam = o.e.cap; },
      debut(o) { o.tenir('KeyW', 'ShiftLeft'); },
      chaque(t, dt, o) {
        for (const [id, x] of [['kimono', 60], ['touriste', 62]]) { const k = o.passant(id); if (k) { k.etat.x = x; k.etat.z = 30; } }
        const L = [[44.6, 20], [41.4, 12.2], [34.4, 5.6], [25.6, 0.6], [16.4, -1.8], [10.6, -4.2]];
        if (o.etape < L.length - 1 && Math.hypot(o.e.x - L[o.etape][0], o.e.z - L[o.etape][1]) < 2.4) o.etape++;
        o.viser(...L[o.etape], 0.12);
        // (derrière, un peu à gauche, côté étang, et au-dessus ; le cap de la caméra suit celui du coureur en douceur)
        const e = o.e;
        o.capCam += (((e.cap - o.capCam + PI) % (2 * PI) + 2 * PI) % (2 * PI) - PI) * Math.min(1, dt * 3);
        const c = o.capCam, fx = Math.sin(c), fz = Math.cos(c), rx = -Math.cos(c), rz = Math.sin(c);
        o.cadre([e.x - fx * 3.3 - rx * 0.6, e.y + 1.75, e.z - fz * 3.3 - rz * 0.6], [e.x + fx * 6, e.y + 1.0, e.z + fz * 6], 52);
      },
    },
    // la nuit, au belvédère : le pavillon et son reflet, le toit du reflet sans le phénix, le vrai toit avec ; une lueur d'or
    // quitte le reflet, file sur l'étang et passe par-dessus le toit
    'kk-nuit': {
      duree: 26,
      async preparer(o) {
        const i = o.inter('kinkaku');
        o.placer(i.x, i.z, 0, 0);
        await o.nuitTout(true);
        // (à la tombée de la nuit, le compagnon propose d'aller voir le reflet : on le laisse dire, avant de tourner)
        for (let k = 0; k < 40; k++) { await o.attendre(150); if (o.dialogue()) o.appuyer(); }
        // Les cadrages du jeu (jeu.cadrer) : sur un écran en hauteur, le jeu ouvre leur champ pour voir autant de large qu'en
        // largeur (×3 sur sa tangente), et le pavillon y était tout petit. Pour la vidéo, deux fois moins ouverts ; le
        // premier, le pavillon et tout son reflet, resserré sur eux
        const jeu = o.jeu, cadrer = jeu.cadrer.bind(jeu), rad = PI / 180;
        jeu.cadrer = (c) => {
          if (!c || !c.champ) return cadrer(c);
          const k = Math.max(1, 1.68 / (innerWidth / innerHeight)), vers = [...c.vers];
          let voulu = 2 * Math.atan(Math.tan((c.champ * rad) / 2) * 1.5) / rad;
          if (c.champ === 42 && vers[1] === -4) { voulu = 31; vers[1] = -0.6; }
          return cadrer({ ...c, vers, champ: 2 * Math.atan(Math.tan((voulu * rad) / 2) / k) / rad });
        };
      },
      quand: [[0.3, (o) => o.agir('kinkaku')]],
      chaque(t, dt, o) { o.lire(t, { delai: 1.1 }); },
    },
    // le feu d'artifice derrière le pavillon, qui se reflète dans l'étang (le secret déjà trouvé : le phénix est dans le reflet)
    'kk-feux': {
      duree: 12,
      async preparer(o) { o.placer(29.7, 53.4, 0, 0, { compagnon: false }); o.compagnon(30.6, 53.9, 0.6); await o.nuitTout(true); },
      quand: [[0.2, (o) => o.B.lancerFeux()]],
      chaque(t, dt, o) {
        o.lire(t, { delai: 0.5 });
        o.cadre(...o.chemin([[0, [27.6, 2.1, 50.0], [4, 4.6, -5.6], 52], [12, [27.0, 1.9, 49.2], [4, 5.4, -5.6], 50]], t));
      },
    },

    // ================================================================ Vidéo 5 : les Enfers de Beppu (2026-10-28)
    // (les objets de beppu.js, trouvés par leurs méthodes : le panier d'œufs (lever), la boue (grosse), le ronflement du
    // démon (ronfler), le geyser (jaillir))
    // l'enfer de la mer : le grand bassin bleu de cobalt et ses fumées, du belvédère (le plan qui répond à la vidéo du propriétaire)
    'bp-umi': {
      duree: 7,
      preparer(o) {
        o.placer(-29.4, -20.6, -34, -29.5, { compagnon: false }); o.compagnon(-28.4, -20.2, PI + 0.4);
        // (pour ce plan, les fumées du bassin à 30 % : de haut, elles faisaient un grand voile blanc en haut de l'image, le
        // propriétaire le 2026-10-28 : « il y a un halo blanc en haut qui ne rend pas bien »)
        const a = o.M().vapeurs.geometry.attributes, p = a.position.array;
        for (let i = 0; i < a.opa.count; i++) if (((p[3 * i] + 34) / 11) ** 2 + ((p[3 * i + 2] + 29.5) / 8) ** 2 < 1) a.opa.array[i] *= 0.3;
        a.opa.needsUpdate = true;
      },
      chaque(t, dt, o) {
        // (de haut, du nord-est : l'eau en bas, et au-dessus, les torii rouges du sanctuaire Inari qui montent dans les arbres,
        // juste sous la légende ; plus bas, ses fumées cachaient la moitié de l'image)
        o.cadre(...o.chemin([[0, [-16, 17, -16], [-39, 3, -36], 46], [7, [-17.4, 16.2, -17.4], [-39, 3, -36], 44]], t));
      },
    },
    // la rue de Kannawa qui fume : le voyageur la remonte, la vapeur sort des grilles des caniveaux et des toits
    'bp-rue': {
      duree: 6,
      preparer(o) { o.placer(50, 2.0, 10, 0, { tangage: 0.1, distance: 6.0 }); },
      debut(o) { o.tenir('KeyW'); },
      chaque(t, dt, o) { o.viser(10, 0, 0.05); },
    },
    // les œufs cuits dans l'eau bleue : la dame remonte le panier au bout de sa corde (le voyageur, plus loin sur le belvédère, ne
    // le cache plus : derrière lui, au premier brouillon, on ne voyait que son chapeau)
    'bp-oeufs': {
      duree: 5,
      preparer(o) { o.placer(-21.4, -19.6, -28.27, -24.98); },
      quand: [[0.3, (o) => o.M().lieu.animes.find((a) => typeof a.lever === 'function').lever(true)]],
      chaque(t, dt, o) {
        // (d'au-dessus de la rambarde : on voit les œufs dans le panier, et derrière, les torii du petit sanctuaire Inari)
        o.cadre(...o.chemin([[0, [-25.0, 4.5, -21.5], [-28.3, 2.3, -25.0], 42], [5, [-25.4, 4.4, -21.9], [-28.3, 2.6, -25.0], 38]], t));
      },
    },
    // l'enfer des crânes de moines : une grosse bulle de boue grise gonfle comme un crâne rasé, et crève (au ras de la boue)
    'bp-bulle': {
      duree: 5,
      preparer(o) { o.placer(14.8, -24.0, 9.4, -25.6); },
      quand: [[0.2, (o) => o.M().lieu.animes.find((a) => typeof a.grosse === 'function').grosse({ eau: 0.35 }, 9.4, -25.6)]],
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [11.9, 1.05, -24.5], [9.4, 0.6, -25.6], 40], [5, [11.5, 0.95, -24.7], [9.4, 0.6, -25.6], 38]], t));
      },
    },
    // le ronflement du démon (鬼の高いびき) : la vapeur sort des rochers par saccades
    'bp-ronfle': {
      duree: 4,
      preparer(o) { o.placer(24.0, -41.6, 26.8, -45.4, { compagnon: false }); o.compagnon(23.2, -42.4, -2.5); },
      quand: [[0.4, (o) => o.M().lieu.animes.find((a) => a.ronfler).ronfler()]],
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [24.4, 1.7, -41.0], [26.8, 1.8, -45.4], 48], [4, [24.8, 1.6, -41.6], [26.8, 2.0, -45.4], 46]], t));
      },
    },
    // le grand démon rouge sur son chaudron, vu d'en bas ; le voyageur devant lui
    'bp-oni': {
      duree: 5,
      // (à droite du démon, à mi-chemin : au milieu, de dos, il cachait son chaudron)
      preparer(o) { o.placer(6.4, 11.6, 6.6, 14.0); },
      chaque(t, dt, o) {
        // (les deux amis qui le regardent, juste devant la caméra au premier brouillon, écartés)
        for (const [id, x] of [['amie', -8], ['ami', -10]]) { const k = o.passant(id); if (k) { k.etat.x = x; k.etat.z = 1; } }
        o.cadre(...o.chemin([[0, [8.8, 1.2, 6.6], [6.6, 3.6, 14], 52], [5, [8.2, 1.15, 7.6], [6.6, 3.8, 14], 50]], t));
      },
    },
    // l'enfer de l'étang blanc : l'eau blanche comme du lait, ses fumées
    'bp-shiraike': {
      duree: 5,
      preparer(o) { o.placer(-30.6, 15.4, -33, 23.5, { compagnon: false }); o.compagnon(-31.8, 15.2, 0.3); },
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [-21.6, 11.2, 11.6], [-34, 1.5, 25], 46], [5, [-23.0, 10.6, 11.4], [-34, 1.5, 25], 44]], t));
      },
    },
    // l'enfer du lac de sang, au-dessus de son belvédère
    'bp-chinoike': {
      duree: 5,
      preparer(o) { o.placer(-58.0, -70.0, -70, -82.5); },
      chaque(t, dt, o) {
        // (à mi-hauteur : assez haut pour voir le lac entier par-dessus ses fumées, assez bas pour répondre au plan du propriétaire)
        o.cadre(...o.chemin([[0, [-61.4, 12.6, -68.4], [-71, 6.1, -84], 46], [5, [-62.8, 12.2, -68.2], [-71, 6.1, -84], 44]], t));
      },
    },
    // l'enfer de la tornade : le geyser jaillit jusqu'à son toit de pierre ; le voyageur et son compagnon devant la corde
    'bp-geyser': {
      duree: 7,
      preparer(o) { o.placer(-35.4, -82.6, -36, -91.5); },
      quand: [[0.3, (o) => o.M().lieu.animes.find((a) => a.jaillir).jaillir()]],
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [-33.4, 9.4, -77.0], [-36, 10.0, -91.5], 52], [7, [-33.8, 9.0, -78.2], [-36, 10.4, -91.5], 50]], t));
      },
    },
    // le cinquième tampon (l'étang blanc), et la récompense : les cornes d'oni
    'bp-tampon': {
      duree: 30,
      preparer(o) { o.placer(-27.6, 16.4, -33, 23.5); },
      quand: [[0.3, (o) => o.agir('shiraike')]],
      chaque(t, dt, o) { o.lire(t, { delai: 0.7 }); },
    },
    // les cornes d'oni sur la tête du voyageur, devant le grand démon rouge : deux oni
    'bp-cornes': {
      duree: 5,
      preparer(o) { o.placer(6.6, 11.2, 6.6, 6.0); },
      quand: [[0.6, (o) => o.jeu.saluer()]],
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [6.9, 1.55, 7.0], [6.6, 2.9, 13.0], 48], [5, [6.8, 1.5, 7.6], [6.6, 2.8, 13.0], 46]], t));
      },
    },
    // une pierre d'Ippen, sa lueur et son étoile : sur la place du petit sanctuaire Inari, devant le renard (le voyageur reste en
    // bas des marches : la lueur s'efface quand on est tout près). La nuit : de jour, la lueur se voyait à peine
    'bp-pierre': {
      duree: 5,
      async preparer(o) { o.placer(-44.0, -35.6, -51.6, -45.2); await o.nuitTout(true); },
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [-52.2, 5.8, -41.6], [-54.0, 5.0, -44.85], 44], [5, [-52.7, 5.5, -42.4], [-54.0, 5.0, -44.85], 40]], t));
      },
    },
    // une pierre en main, jetée dans l'enfer de la mer : elle vole, l'eau se calme, la prière s'allume en rond sur l'eau (la nuit,
    // comme la pierre : la prière d'or sur l'eau sombre)
    'bp-lancer': {
      duree: 12,
      async preparer(o) { o.placer(-37.6, -20.2, -36.4, -26.6); await o.nuitTout(true); },
      quand: [[0.3, (o) => o.agir('lancer-umi')]],
      chaque(t, dt, o) {
        o.lire(t, { delai: 0.6, choix: 0 });
        // (de haut et un peu à gauche : la prière s'allume sur l'eau à côté du voyageur, pas derrière son chapeau)
        o.cadre(...o.chemin([[0, [-39.6, 7.4, -14.8], [-36.6, 1.6, -26.0], 48], [12, [-39.4, 7.0, -15.6], [-36.5, 1.6, -26.2], 44]], t));
      },
    },
    // la nuit dans la rue : les lanternes, les fenêtres allumées, la vapeur (la fin)
    'bp-nuit': {
      duree: 7,
      async preparer(o) { o.placer(30, 0.6, 10, 0, { compagnon: true }); await o.nuitTout(true); },
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [44, 4.2, 5.0], [16, 1.4, -1.0], 50], [7, [40, 4.0, 4.4], [14, 1.6, -1.0], 48]], t));
      },
    },

    // ================================================================ Vidéo 6 : le sanctuaire Motonosumi (2026-10-29)
    // (les objets de motonosumi.js, trouvés par leurs méthodes : le souffle du dragon (jaillir), le tronc des offrandes (lancer :
    // son cercle doré est le premier enfant de son objet), le tofu des renards (poser, briller))
    // les 123 torii rouges qui serpentent sur la pente jusqu'à la mer, du balcon des photos (le plan qui répond à la vidéo du
    // propriétaire) ; le voyageur et son compagnon au bord du balcon
    'mt-vue': {
      duree: 7,
      preparer(o) { o.placer(-8.2, 11.4, 6, -20, { compagnon: false }); o.compagnon(-9.4, 11.6, 2.6); },
      chaque(t, dt, o) {
        // (au premier brouillon, plus à droite : la deuxième branche du chemin en bande au milieu, de l'herbe partout)
        o.cadre(...o.chemin([[0, [-7.5, 31, 13.5], [28, 17, -9], 44], [7, [-6.8, 30.6, 12.6], [28, 17, -9], 42]], t));
      },
    },
    // la descente dans le tunnel de torii : le voyageur descend les marches vers le plateau et la mer, la caméra derrière lui,
    // sous les linteaux (le bas du chemin, après la place du 124e torii, vide le jour)
    'mt-tunnel': {
      duree: 6,
      preparer(o) { o.placer(8.66, -16.95, 6.88, -17.87, { compagnon: false }); o.compagnon(9.6, -16.5, -2.0); o.cap = e.cap; },
      debut(o) {
        o.jeu.marcher([[o.e.x, o.e.z], [6.88, -17.87], [5.13, -18.84], [3.42, -19.87], [1.74, -20.96], [0.1, -22.09], [-1.51, -23.28], [-3.07, -24.53],
          [-4.58, -25.84], [-6.03, -27.22], [-7.38, -28.7], [-8.68, -30.22]], 2.6);
      },
      chaque(t, dt, o) {
        // (le cap lissé : la caméra ne tremble pas à chaque pas)
        o.cap += (((e.cap - o.cap + PI) % (2 * PI) + 2 * PI) % (2 * PI) - PI) * Math.min(1, dt * 4);
        const sx = Math.sin(o.cap), sz = Math.cos(o.cap);
        o.cadre([e.x - sx * 2.6, e.y + 1.75, e.z - sz * 2.6], [e.x + sx * 5, e.y + 0.1, e.z + sz * 5], 62);
      },
    },
    // la pièce lancée dans le tronc des offrandes, tout en haut du grand torii : A quand le cercle doré est sur le tronc (le
    // tampon déjà eu : pas de tampon ici)
    'mt-piece': {
      duree: 7,
      preparer(o) { o.placer(0, 12.15, 0, 14.6, { compagnon: false }); o.compagnon(-2.2, 10.6, 0.4); o.lance = false; o.vu = null; },
      quand: [[0.2, (o) => o.agir('saisen')]],
      chaque(t, dt, o) {
        o.lire(t, { delai: 0.3, choix: 0 });
        const anneau = o.M().lieu.animes.find((a) => a.lancer && a.jouer).objet.children[0];
        if (anneau.visible && !o.lance) {
          if (o.vu === null) o.vu = t;
          // (le tronc est à 30,72 m ; la pièce y entre si le cercle est à moins de 20 cm de 30,84 m)
          if (t - o.vu > 1.0 && Math.abs(anneau.position.y - 30.84) < 0.05) { o.lance = true; o.appuyer(); }
        }
        // (de derrière, à quatre mètres du chemin des torii : le voyageur en bas, le tronc au tiers de l'image, sous la légende, la
        // pièce qui monte ; aux premiers brouillons, un touriste au milieu, le voyageur coupé au bord, le tronc tout en haut sous
        // la légende ; dans le chemin, ses linteaux cachaient tout)
        for (const id of ['touriste', 'touriste2']) { const k = o.passant(id); if (k) { k.etat.x = 12; k.etat.z = 28; } }
        o.cadre(...o.chemin([[0, [4.0, 27.0, 9.0], [-0.2, 29.0, 13.3], 63], [7, [3.9, 27.0, 9.3], [-0.2, 29.1, 13.3], 61]], t));
      },
    },
    // le souffle du dragon (龍宮の潮吹) : la mer jaillit de la crique, au pied de la falaise ; vu de la mer (de près, l'écume
    // couvrait le haut de l'image)
    'mt-souffle': {
      duree: 6,
      preparer(o) { o.placer(16.2, -39.6, 23.3, -40.2); },
      quand: [[0.2, (o) => o.M().lieu.animes.find((a) => a.jaillir && a.actif).jaillir(true)]],
      chaque(t, dt, o) {
        // (visé plus haut qu'au premier brouillon : au plus fort, l'écume montait jusqu'au bord de l'image, sous la légende)
        o.cadre(...o.chemin([[0, [36, 12, -60], [22, 11, -39], 48], [6, [34.6, 11.6, -58.4], [22, 11, -39], 46]], t));
      },
    },
    // le tofu frit offert aux renards de pierre du sanctuaire : leurs yeux brillent ; puis le cinquième tampon et la carte de la
    // récompense (les quatre autres déjà eus)
    'mt-kitsune': {
      duree: 30,
      preparer(o) { o.jeu.donner('aburaage'); o.placer(-6.2, 23.0, -10.2, 23.0); o.compagnon(-6.2, 22.1, -PI / 2); o.libre = false; },
      quand: [[0.3, (o) => o.agir('offrande')]],
      chaque(t, dt, o) {
        // (les deux pages de l'offrande passées vite : les yeux des renards brillent dans le plan ; ensuite, au rythme du jeu)
        if (t < 2.6) { if (o.dialogue()) o.taper(t, 0.25); } else o.lire(t, { delai: 0.7 });
        // (pendant l'offrande : de derrière et d'en haut, le voyageur entre les deux renards de pierre, qui regardent la caméra, le
        // plat au-dessus de son chapeau ; la caméra du jeu, de biais, montrait surtout un palmier ; de côté, un renard cachait tout.
        // Le compagnon assis à côté du voyageur : devant la caméra, il cachait tout. Ensuite, la caméra du jeu)
        if (t < 3) o.cadre(...o.chemin([[0, [-0.6, 30.6, 23.0], [-8.0, 26.6, 23.0], 58], [3, [-1.2, 30.3, 23.0], [-8.0, 26.6, 23.0], 56]], t));
        else if (!o.libre) { o.libre = true; o.cadre(null); }
      },
    },
    // les oreilles et la queue de renard : le voyageur traverse le parvis vers le grand torii, vu de trois quarts dos (la queue se
    // balance quand il marche)
    'mt-renard': {
      duree: 5,
      preparer(o) { o.placer(3.2, 22.4, 0, 15.2, { compagnon: false }); o.compagnon(9.5, 27.5, -0.6); },
      debut(o) { o.tenir('KeyW'); },
      chaque(t, dt, o) {
        o.viser(0, 15.2, 0.2);
        o.cadre([e.x + 1.9, e.y + 1.45, e.z + 2.9], [e.x - 0.4, e.y + 0.75, e.z - 1.6], 46);
      },
    },
    // la nuit : les torii vus du balcon, sous la lune ; au loin, une petite flamme bleue (le secret, montré sans être résolu)
    'mt-nuit': {
      duree: 7,
      async preparer(o) { o.placer(-8.2, 11.4, 6, -20, { compagnon: false }); o.compagnon(-9.4, 11.6, 2.6); await o.nuitTout(true); },
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [-2, 19, -36], [12, 15, -14], 44], [7, [-1.4, 18.6, -34.8], [12, 15, -14], 42]], t));
      },
    },
    // le 124e torii : plus pâle que les autres, une flamme bleue qui danse au-dessus de lui ; vu du bas de la pente
    'mt-124': {
      duree: 7,
      async preparer(o) { o.placer(-3.07, -24.53, -1.51, -23.28, { compagnon: false }); o.compagnon(-3.8, -25.4, 0.8); await o.nuitTout(true); },
      chaque(t, dt, o) {
        // (d'en bas de la pente, sa flamme sur le ciel étoilé ; d'en haut, au premier brouillon, elle se perdait dans l'herbe)
        o.cadre(...o.chemin([[0, [13.35, 13.8, -20.2], [9.35, 15.6, -16.6], 50], [7, [13.0, 13.9, -19.9], [9.35, 15.6, -16.6], 46]], t));
      },
    },
    // la fin : du plateau de roche, le chemin des torii rouges qui monte vers le ciel, le jour
    'mt-fin': {
      duree: 7,
      preparer(o) { o.placer(-8.2, 11.4, 6, -20, { compagnon: false }); o.compagnon(-9.4, 11.6, 2.6); },
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [-13, 10.5, -37], [8, 18, -14], 50], [7, [-12.4, 10.6, -36.0], [8, 18.4, -14], 48]], t));
      },
    },

    // ================================================================ Vidéo 7 : les Trente Bouddhas (2026-10-30)
    // (les objets de sanjubutsu.js, trouvés par leurs méthodes : le tronc qui frappe la cloche (frapper), la bougie du bouddha du
    // jour (allumer), l'oni (arriver) ; le bouddha du jour est celui du vrai calendrier : le 30, Shaka, au bout est du dernier gradin)
    // la brume entre les cèdres géants, le chemin qui monte vers les deux gardiens Nio (le plan qui répond à la vidéo du
    // propriétaire) : la caméra regarde les rais de lumière dans les cimes, puis descend vers le torii (personne : le voyageur est
    // resté à la ferme, le vidéaste qui filme les Nio est écarté)
    'sb-brume': {
      duree: 6,
      preparer(o) { o.placer(-6, 52, 0, 60, { compagnon: false }); o.compagnon(-6.8, 52.6, 0); },
      chaque(t, dt, o) {
        const k = o.passant('videaste');
        if (k) { k.etat.x = -30; k.etat.z = 60; }
        o.cadre(...o.chemin([[0, [1.2, 4.4, 30.8], [-2.0, 12.5, 20], 62], [6, [0.9, 4.7, 29.4], [-1.0, 8.6, 18.5], 58]], t));
      },
    },
    // le torii de pierre gardé par les deux Nio, en haut de leurs cinq marches (comme la vidéo du propriétaire : les marches devant)
    'sb-torii': {
      duree: 4.5,
      preparer(o) { o.placer(-6.0, 9.6, 0, 9.6, { compagnon: false }); o.compagnon(-6.4, 10.4, 0); },
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [0, 5.5, 27.8], [0, 6.8, 15.5], 54], [4.5, [0, 5.6, 26.6], [0, 6.9, 15.5], 52]], t));
      },
    },
    // le grand escalier moussu : le voyageur le monte, la caméra en bas, sur le palier ; les lanternes de pierre, les rais de lumière
    'sb-escalier': {
      duree: 4.5,
      preparer(o) { o.placer(0, 11.4, 0, -20, { compagnon: false }); o.compagnon(0.5, 12.2, PI); },
      debut(o) { o.jeu.marcher([[0, 11.4], [0, -6]], 1.5); },
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [0, 6.6, 15.4], [0, 13, -8], 50], [4.5, [0, 7.0, 14.6], [0, 13.6, -8], 48]], t));
      },
    },
    // le pavillon sous la falaise, de côté (comme la vidéo du propriétaire) : la longue façade, le toit de cuivre, la falaise en
    // surplomb ; le moine devant
    'sb-do': {
      duree: 4.5,
      preparer(o) { o.placer(-14.0, -24.0, -12, -24, { compagnon: false }); o.compagnon(-14.6, -23.2, 0); },
      chaque(t, dt, o) {
        // (à l'ouest du clocher : plus à l'est, au premier brouillon, la caméra était dedans, un de ses poteaux passait devant)
        o.cadre(...o.chemin([[0, [7.0, 22.4, -26.4], [-5, 23.6, -32.8], 54], [4.5, [6.4, 22.5, -27.0], [-5.2, 23.6, -32.8], 52]], t));
      },
    },
    // les trente petits bouddhas sur leurs trois gradins de pierre, dans le pavillon, les bougies devant : la caméra glisse le long de
    // la rangée (de trois quarts ; au premier brouillon, l'autel brun prenait la moitié de l'image)
    'sb-bouddhas': {
      duree: 4,
      preparer(o) { o.placer(-14.0, -24.0, -12, -24, { compagnon: false }); o.compagnon(-14.6, -23.2, 0); },
      chaque(t, dt, o) {
        // (tout près de l'autel, à la hauteur des bouddhas : de plus loin, au deuxième brouillon, le sol prenait la moitié de l'image)
        o.cadre(...o.chemin([[0, [0.4, 22.95, -32.85], [-4.5, 22.55, -34.6], 44], [4, [-0.2, 22.95, -32.9], [-5.2, 22.55, -34.6], 44]], t));
      },
    },
    // les sandales de paille pendues au râtelier des Nio, à côté du gardien Agyō (le tampon déjà eu : pas de tampon ici)
    'sb-waraji': {
      duree: 5,
      preparer(o) { o.jeu.donner('waraji'); o.placer(2.6, 15.25, 3.6, 15.25, { compagnon: false }); o.compagnon(1.4, 18.6, PI); },
      quand: [[0.3, (o) => o.agir('ratelier')]],
      chaque(t, dt, o) {
        o.lire(t, { delai: 0.6 });
        // (du nord-est : les grandes sandales pendues devant le gardien, le voyageur de face ; du sud-est, au premier brouillon, le
        // râtelier restait derrière lui)
        o.cadre(...o.chemin([[0, [6.0, 6.8, 13.8], [2.6, 6.3, 15.6], 56], [5, [5.7, 6.75, 14.1], [2.6, 6.3, 15.6], 54]], t));
      },
    },
    // la mer de nuages, du belvédère : le voyageur à la balustrade, de dos ; la caméra s'élève sur la vallée sous la brume, d'où
    // ne dépassent que les cimes des cèdres
    'sb-vue': {
      duree: 4.5,
      preparer(o) { o.placer(20.2, -24.6, 40, 6, { compagnon: false }); o.compagnon(19.0, -25.4, 0.9); },
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [17.0, 24.0, -28.8], [34, 9, -6], 56], [4.5, [17.5, 25.1, -28.3], [40, 9.5, 4], 58]], t));
      },
    },
    // la cloche : le voyageur tire la corde, le tronc recule et frappe la cloche (à 0,95 s du départ du tronc)
    'sb-cloche': {
      duree: 4,
      preparer(o) { o.placer(11.9, -25.6, 9.6, -25.6, { compagnon: false }); o.compagnon(13.4, -23.2, -0.8); },
      quand: [[0.3, (o) => { o.jeu.geste('offrir'); o.M().lieu.animes.find((a) => a.frapper).frapper(); }], [1.6, (o) => o.jeu.geste(null)]],
      chaque(t, dt, o) {
        // (la torche brûlée contre le poteau, au premier plan : un indice du secret, de jour)
        o.cadre(...o.chemin([[0, [15.6, 22.9, -22.6], [10.8, 23.3, -25.5], 50], [4, [15.1, 22.95, -23.1], [10.8, 23.35, -25.5], 47]], t));
      },
    },
    // la bougie du moine allumée devant le bouddha du jour (le 30 : Shaka, au bout est du dernier gradin)
    'sb-bougie': {
      duree: 3.5,
      preparer(o) { o.placer(-14.0, -24.0, -12, -24, { compagnon: false }); o.compagnon(-14.6, -23.2, 0); },
      quand: [[1.0, (o) => o.M().lieu.animes.find((a) => a.allumer).allumer()]],
      chaque(t, dt, o) {
        // (de trois quarts et d'un peu plus haut que lui : d'en bas, au premier brouillon, le bouddha du gradin du milieu cachait la
        // bougie ; de face et tout près, au premier tournage, on ne voyait plus que les facettes de sa pierre)
        o.cadre(...o.chemin([[0, [2.6, 23.8, -32.0], [4.7, 23.0, -34.85], 36], [3.5, [2.9, 23.7, -32.4], [4.7, 23.0, -34.85], 33]], t));
      },
    },
    // l'écho de la falaise : le voyageur appelle trois fois, les mains en porte-voix ; puis le cinquième tampon et la carte de la
    // récompense (les quatre autres déjà eus)
    'sb-echo': {
      duree: 30,
      preparer(o) { o.placer(-7.6, -28.6, -8.6, -32.6, { compagnon: false }); o.compagnon(-6.4, -27.4, -2.4); },
      quand: [[0.2, (o) => o.agir('yamabiko')]],
      chaque(t, dt, o) {
        o.lire(t, { delai: 0.35 });
        // (de face, devant lui, un peu de côté : là où le jeu le pose et vers où il appelle, la falaise ; au premier brouillon, la
        // caméra fixe le voyait de profil, de trop près)
        const sx = Math.sin(e.cap), sz = Math.cos(e.cap), k = 2.5 - 0.25 * o.lisse(0, 8, t);
        o.cadre([e.x + sx * k + sz * 0.9, e.y + 0.95, e.z + sz * k - sx * 0.9], [e.x + sz * 0.15, e.y + 0.72, e.z - sx * 0.15], 50);
      },
    },
    // l'étole du yamabushi, ses pompons et sa conque : le voyageur au belvédère, de face, la mer de nuages derrière lui ; il lève
    // les bras
    'sb-etole': {
      duree: 5,
      preparer(o) { o.placer(20.2, -24.6, 10, -24.6, { compagnon: false }); o.compagnon(20.6, -23.2, -1.4); },
      quand: [[1.4, (o) => o.jeu.geste('victoire')]],
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [17.3, 22.6, -25.35], [20.2, 22.15, -24.6], 44], [5, [17.85, 22.45, -25.05], [20.2, 22.1, -24.6], 40]], t));
      },
    },
    // la nuit : la cloche qu'il ne faut pas sonner, seule, la forêt noire derrière ; la caméra s'en approche lentement (avec le
    // voyageur devant elle, aux deux premiers brouillons, on ne voyait que son chapeau)
    'sb-nuit-cloche': {
      duree: 4.5,
      async preparer(o) { o.placer(6.0, -23.0, 9.6, -25.6, { compagnon: false }); o.compagnon(5.2, -22.4, 1.0); await o.nuitTout(true); },
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [14.6, 22.5, -28.4], [9.8, 23.4, -25.0], 50], [4.5, [13.6, 22.6, -27.8], [9.8, 23.45, -25.0], 46]], t));
      },
    },
    // la nuit : une torche descend le sentier de la montagne, entre les cèdres. Celui qui la porte reste caché (le secret, montré sans
    // être résolu) : on ne voit que sa flamme et sa lueur
    'sb-torche': {
      duree: 7,
      async preparer(o) {
        o.placer(12.6, -24.4, 18, -40, { compagnon: false }); o.compagnon(11.6, -23.6, 2.6);
        await o.nuitTout(true);
        o.M().lieu.animes.find((a) => a.arriver).objet.traverse((m) => { if (m.isMesh) m.visible = false; });
      },
      quand: [[0.0, (o) => o.M().lieu.animes.find((a) => a.arriver).arriver([[20.9, -47.0], [20.5, -44.0], [20.0, -40.0], [19.6, -36.0], [18.4, -33.5], [16.6, -33.2], [14.95, -33.1]], o.M().lieu.terrain)]],
      chaque(t, dt, o) {
        // (sur le sentier, juste après son portail : le chemin mène l'œil à la flamme ; de la terrasse, au premier brouillon, un gros
        // cèdre prenait un tiers de l'image et la flamme était minuscule)
        o.cadre(...o.chemin([[0, [17.2, 23.0, -33.4], [20.4, 24.0, -45], 46], [7, [17.3, 23.0, -33.9], [20.3, 23.8, -44], 44]], t));
      },
    },
    // la fin : du haut du grand escalier, les marches qui descendent dans la brume, les rais de lumière, le torii tout en bas ; le
    // voyageur descend
    'sb-fin': {
      duree: 7,
      preparer(o) { o.placer(0, -19.6, 0, 20, { compagnon: false }); o.compagnon(0.5, -18.6, 0); },
      debut(o) { o.jeu.marcher([[0, -19.6], [0, 4]], 1.3); },
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [0, 23.3, -21.6], [0, 9, 10], 54], [7, [0.3, 23.1, -20.8], [0, 8.8, 10], 52]], t));
      },
    },
    // ================================================================ Vidéo 8 : Udo et Yakushima (2026-11-02)
    // (les objets d'udo.js et de yakushima.js, trouvés par leurs méthodes : les boules de chance (lancer), la lueur du lapin (briller) ;
    // les esprits et le cerf : M().lieu.esprits, l'objet secret du lieu)
    // la grotte : le sanctuaire vermillon sous sa voûte, comme la vidéo du propriétaire (de trois quarts, la voûte sombre au-dessus)
    'ud-grotte': {
      duree: 5,
      preparer(o) { o.placer(21.2, -30.6, 13, -32.6, { compagnon: false }); o.compagnon(22.2, -29.6, -1.8); },
      debut(o) { o.jeu.marcher([[21.2, -30.6], [18.6, -32.2]], 1.2); },
      chaque(t, dt, o) {
        for (const [id, x, z] of [['obaa', 20.5, -39.5]]) { const k = o.passant(id); if (k) { k.etat.x = x; k.etat.z = z; } }
        o.cadre(...o.chemin([[0, [27.2, 6.05, -24.6], [12.5, 9.0, -33.8], 66], [5, [26.2, 6.0, -25.4], [12.5, 8.9, -33.8], 62]], t));
      },
    },
    // les boules de chance : le rocher de la tortue et son carré de corde ; l'anneau d'or glisse sur son dos, la boule part quand il
    // passe au creux (à 1,85 s) et y tombe (à 2,8 s)
    'ud-boule': {
      duree: 5,
      preparer(o) { o.placer(43.9, -33.8, 50.8, -34, { compagnon: false }); o.compagnon(42.4, -35.2, 1.4); o.u = o.M().lieu.animes.find((a) => a.lancer && a.jouer); },
      debut(o) { o.u.jouer(true); },
      quand: [[1.85, (o) => { o.jeu.geste('offrir'); o.u.lancer([44.2, 5.85, -33.8]); }], [2.9, (o) => o.jeu.geste(null)]],
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [45.2, 6.2, -36.4], [50.8, 1.8, -34], 42], [5, [45.7, 5.95, -36.2], [50.8, 1.8, -34], 39]], t));
      },
    },
    // le lapin qu'on caresse : le voyageur devant lui, de côté ; il luit
    'ud-lapin': {
      duree: 4,
      preparer(o) { o.placer(17.0, -25.7, 17.6, -24.3, { compagnon: false }); o.compagnon(15.4, -26.6, 1.2); o.l = o.M().lieu.animes.find((a) => a.briller); },
      quand: [[0.9, (o) => { o.jeu.geste('offrir'); o.l.briller(); }], [3.1, (o) => o.jeu.geste(null)]],
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [20.6, 5.9, -27.4], [17.3, 5.5, -25.1], 58], [4, [20.4, 5.88, -27.25], [17.3, 5.5, -25.1], 55]], t));
      },
    },
    // les torii rouges jusqu'à Inari : le voyageur les monte, la caméra en bas des marches, comme la vidéo du propriétaire
    'ud-torii': {
      duree: 5,
      preparer(o) { o.placer(-13, -2.4, -13, -10, { compagnon: false }); o.compagnon(-12.3, -1.2, PI); },
      debut(o) { o.jeu.marcher([[-13, -2.4], [-13, -10]], 1.5); },
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [-13, 11.2, -1.6], [-13, 13.2, -10.2], 70], [5, [-13, 11.5, -2.6], [-13, 13.7, -10.2], 66]], t));
      },
    },
    // le dernier tampon, à Inari (les quatre autres déjà eus) : il prie, le tampon, la carte de la récompense, le jeu lui met la cape
    'ud-cape': {
      duree: 34,
      preparer(o) { const I = o.inter('inari'); o.placer(I.x, I.z, I.vers[0], I.vers[1], { compagnon: false }); o.compagnon(I.x + 1.5, I.z + 0.7, -0.8); },
      quand: [[0.2, (o) => o.agir('inari')]],
      chaque(t, dt, o) {
        o.lire(t, { delai: 0.35 });
        const sx = Math.sin(e.cap), sz = Math.cos(e.cap), k = t < 14.6 ? 1 : -1;
        o.cadre([e.x + sx * 2.5 * k + sz * 0.9, e.y + 1.0 + (k < 0 ? 0.25 : 0), e.z + sz * 2.5 * k - sx * 0.9], [e.x + sz * 0.1, e.y + 0.74, e.z - sx * 0.1], 50);
      },
    },
    // la cape de plumes, de dos : il court sur le chemin des lanternes, vers le pont ; les plumes du bas s'écartent
    'ud-plumes': {
      duree: 4.5,
      preparer(o) { o.placer(3.5, 0.1, 18, 0.1, { compagnon: false }); o.compagnon(2.3, 1, 1.57); },
      debut(o) { o.tenir('KeyW', 'ShiftLeft'); },
      chaque(t, dt, o) {
        for (const [id, x, z] of [['touriste', 9, 10], ['touriste2', 10, 10]]) { const k = o.passant(id); if (k) { k.etat.x = x; k.etat.z = z; } }
        o.viser(18.4, 0.1, 0.2);
        o.cadre([e.x - 3.1, e.y + 1.75, e.z + 0.55], [e.x + 6, e.y + 1.0, e.z], 52);
      },
    },
    // le batelier sur le quai de Fukei, devant son bateau et le phare rouge ; le voyageur vient à lui
    'ud-batelier': {
      duree: 5,
      preparer(o) { o.placer(-36.2, -31.6, -40.4, -32.45, { y: 4, compagnon: false }); o.compagnon(-35.2, -31, -1.6); },
      debut(o) { o.jeu.marcher([[-36.2, -31.6], [-38.75, -32.7]], 1.3); },
      quand: [[1.0, (o) => { const k = o.passant('batelier'); if (k) k.etat.parle = true; }]],
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [-33.9, 3.5, -29.4], [-41.6, 2.9, -33.9], 51], [5, [-34.5, 3.45, -29.8], [-41.6, 2.85, -33.9], 48]], t));
      },
    },
    // la traversée : la carte du jeu, le petit bateau qui avance (6,5 s après 0,8 s) ; le jeu change de lieu à 8,7 s : la prise finit avant
    'ud-traversee': {
      duree: 8.5,
      preparer(o) { o.placer(-38.9, -31.6, -40.4, -32.45, { y: 4, compagnon: false }); o.compagnon(-37.6, -31, -1.6); },
      quand: [[0.2, (o) => o.jeu.partir('yakushima')]],
    },
    // l'accroche : le sentier de la forêt, sous l'arche de racines du Kuguri-sugi, personne ; la caméra avance
    'yk-foret': {
      duree: 5,
      preparer(o) { o.placer(-30, 62.5, -36, 62.5, { y: 21, compagnon: false }); o.compagnon(-31, 63, 0, 21); },
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [-18.6, 21.1, 67.0], [-9, 23.7, 75], 56], [5, [-16.7, 21.4, 68.6], [-8, 23.8, 76], 54]], t));
      },
    },
    // la nuit, le même sentier que l'accroche : « But this forest has a secret » (une étincelle au loin, sous l'arche)
    'yk-nuit': {
      duree: 4,
      async preparer(o) { o.placer(-30, 62.5, -36, 62.5, { y: 21, compagnon: false }); o.compagnon(-31, 63, 0, 21); await o.nuitTout(true); },
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [-18.6, 21.1, 67.0], [-9, 23.7, 75], 56], [4, [-17.0, 21.35, 68.3], [-8, 23.8, 76], 54]], t));
      },
    },
    // l'arrivée au port de Miyanoura : le bateau au premier plan, le quai, la rue, la forêt et les montagnes derrière
    'yk-port': {
      duree: 5,
      preparer(o) { o.placer(-30.2, -54.2, -27, -47, { y: 4, compagnon: false }); o.compagnon(-31.4, -54.6, 0.4); },
      debut(o) { o.jeu.marcher([[-30.2, -54.2], [-27.4, -49.4]], 1.4); },
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [-30.4, 4.7, -68.6], [-28.2, 4.3, -44], 52], [5, [-30.2, 4.5, -67.2], [-28.2, 4.1, -44], 50]], t));
      },
    },
    // le pont suspendu : la caméra sur son tablier, derrière le voyageur qui le traverse (de haut, de biais, au premier brouillon, il
    // sortait du cadre et le pont n'était qu'un grillage vert)
    'yk-pont': {
      duree: 5,
      preparer(o) { o.placer(-33.4, 62.5, -20, 62.5, { y: 21, compagnon: false }); o.compagnon(-34.6, 62.5, 1.57, 21); },
      debut(o) { o.jeu.marcher([[-33.4, 62.5], [-26.2, 62.5]], 1.5); },
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [-36.1, 21.3, 62.6], [-26, 20.2, 62.5], 60], [5, [-35.3, 21.25, 62.55], [-26, 20.2, 62.5], 58]], t));
      },
    },
    // la forêt de mousse : le singe sur sa branche, qui laisse tomber des feuilles, le cerf qui broute dessous
    'yk-singe': {
      duree: 5,
      preparer(o) { o.placer(4, 86, 0, 86, { y: 25, compagnon: false }); o.compagnon(4.8, 85.2, 0, 25); },
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [13.6, 25.4, 89.2], [19.0, 25.0, 87.4], 60], [5, [14.1, 25.35, 89.0], [19.0, 25.0, 87.4], 56]], t));
      },
    },
    // le cœur de ciel, dans la souche de Wilson : on lève les yeux (le voyageur ne se dessine pas : la caméra serait dans sa tête)
    'yk-coeur': {
      duree: 5,
      preparer(o) { o.placer(80.25, 66.55, 78, 66.55, { y: 29, compagnon: false }); o.jeu.cacherVoyageur(true); },
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [80.25, 28.9, 66.55], [78.2, 29.6, 66.5], 62], [1.5, [80.25, 28.9, 66.55], [80.25, 40, 65.8], 60], [5, [80.25, 28.9, 66.55], [80.25, 40, 65.8], 48]], t));
      },
    },
    // le Jōmon Sugi, de sa plateforme : le voyageur tout petit devant lui
    'yk-jomon': {
      duree: 5,
      preparer(o) { o.placer(89.9, 86.3, 91.5, 95, { y: 35, compagnon: false }); o.compagnon(88.6, 86, 0.2, 35); },
      chaque(t, dt, o) {
        for (const id of ['onigiri', 'guideJomon', 'ancien']) { const k = o.passant(id); if (k) { k.etat.x = 100; k.etat.z = 82; } }
        o.cadre(...o.chemin([[0, [88.0, 34.9, 82.0], [90.9, 37.6, 95], 66], [5, [88.0, 34.9, 82.0], [91.2, 43.2, 95], 68]], t));
      },
    },
    // la cape du loup : au sommet du Taiko-iwa, de dos, les montagnes devant ; il lève les bras
    'yk-loup': {
      duree: 4.5,
      preparer(o) { o.placer(28.3, 118, 28.5, 125, { y: 35, compagnon: false }); o.compagnon(27, 117.5, 0.1, 35); },
      quand: [[1.2, (o) => o.jeu.geste('victoire')]],
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [28.9, 34.9, 115.2], [28.2, 34.3, 119.5], 54], [4.5, [28.7, 34.85, 115.6], [28.2, 34.3, 119.5], 50]], t));
      },
    },
    // le secret, montré sans être résolu. La nuit, un petit esprit luit sur sa pierre, juste après le pont ; il saute quand on le salue
    'yk-esprit': {
      duree: 4,
      async preparer(o) { o.placer(-20.9, 65.1, -18.5, 65.2, { y: 21, compagnon: false }); o.compagnon(-22, 65.8, 1.57, 21); o.s = o.M().lieu.esprits.liste[0]; await o.nuitTout(true); },
      quand: [[0.8, (o) => o.s.m.bondir()], [1.6, (o) => o.s.m.bondir()]],
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [-20.5, 20.7, 66.5], [-18.6, 20.45, 65.25], 42], [4, [-20.3, 20.68, 66.35], [-18.6, 20.45, 65.25], 38]], t));
      },
    },
    // le vieux cèdre creux, la nuit, face à sa bouche : les cinq esprits, lumineux, y entrent l'un après l'autre, son fond s'ouvre (le
    // film s'arrête là : le reste est le secret)
    'yk-creux': {
      duree: 20,
      async preparer(o) { o.placer(-12.8, 95.4, -15.7, 96.4, { y: 25, compagnon: false }); o.compagnon(-11.6, 94.8, -1.2, 25); await o.nuitTout(true); },
      quand: [[0.3, (o) => o.agir('creux')]],
      chaque(t, dt, o) {
        o.lire(t, { delai: 0.2 });
        o.cadre(...o.chemin([[0, [-10.4, 24.3, 93.4], [-15.2, 24.0, 96.2], 58], [20, [-10.9, 24.25, 93.7], [-15.2, 24.0, 96.2], 54]], t));
      },
    },
    // le grand cerf, juste un aperçu : la nuit, sa tête et ses bois qui passent derrière la bosse du terrain, la forêt noire derrière
    'yk-cerf': {
      duree: 5,
      async preparer(o) { o.placer(-22.5, 106, -25, 113.3, { y: 28, compagnon: false }); o.compagnon(-21.4, 105.2, 0, 28); await o.nuitTout(true); o.M().lieu.esprits.essaiCerf(-39.84, 120.91, 0.977, 0.5); },
      chaque(t, dt, o) {
        // (essaiCerf le fait marcher sur place : on le pose chaque image un peu plus loin. Il entre par la droite, tête d'abord, et le
        // plan reste serré sur sa tête et ses bois : au premier brouillon, plus large, on le voyait en entier)
        o.M().lieu.esprits.essaiCerf(-39.84 + 0.415 * t, 120.91 + 0.28 * t, 0.977, 0.5);
        o.cadre(...o.chemin([[0, [-30.5, 28.6, 114], [-37.5, 36, 122.5], 32], [5, [-30.8, 28.55, 114.3], [-37.5, 35.8, 122.5], 30]], t));
      },
    },
    // le petit esprit qui nous suit : dans la clairière de mousse, de loin devant, un peu de côté, tout bas, au long foyer : le voyageur et
    // lui sont grands tous les deux (de face et de près, au premier brouillon, il restait caché derrière ses jambes ; de dos, au
    // deuxième, il n'était plus qu'un caillou ; de côté et de près, au troisième, il était minuscule)
    'yk-ami': {
      duree: 6,
      preparer(o) { o.placer(1.5, 85.4, 14, 88.5, { y: 25, compagnon: false }); o.compagnon(0.6, 86.4, 1.3, 25); },
      debut(o) { o.jeu.marcher([[1.5, 85.4], [14, 88.5]], 1.45); },
      chaque(t, dt, o) {
        const sx = Math.sin(e.cap), sz = Math.cos(e.cap), rx = -sz, rz = sx;
        o.cadre([e.x + sx * 3.2 + rx * 1.2, e.y + 0.5, e.z + sz * 3.2 + rz * 1.2], [e.x - sx * 0.4 + rx * 0.15, e.y + 0.62, e.z - sz * 0.4 + rz * 0.15], 46);
      },
    },
    // il saute sur le dos du compagnon, tout près ; puis ils repartent
    'yk-dos': {
      duree: 7,
      preparer(o) { o.placer(-12.6, 72.6, -3, 80.2, { y: 21, compagnon: false }); o.compagnon(-11.6, 73.6, 0.8, 21); },
      quand: [[1.1, (o) => { o.M().lieu.esprits.A.monter = true; }], [3.0, (o) => { o.jeu.marcher([[-12.6, 72.6], [-7.6, 76.6], [-3, 80.2]], 1.3); }]],
      chaque(t, dt, o) {
        const k = o.B.renard, c = 0.82;
        const sx = Math.sin(c), sz = Math.cos(c);
        o.cadre([k.x + sx * 2.1 + sz * 0.8, k.y + 0.62, k.z + sz * 2.1 - sx * 0.8], [k.x, k.y + 0.36, k.z], 46);
      },
    },
    // la fin : ils s'en vont sous l'arche de racines, le petit esprit sur le dos du compagnon, vus de dos
    'yk-fin': {
      duree: 7,
      preparer(o) { o.placer(-19.2, 66.1, -9, 75, { y: 21, compagnon: false }); o.compagnon(-20, 66.4, 0.8, 21); o.M().lieu.esprits.A.monter = true; },
      quand: [[0.8, (o) => { o.jeu.marcher([[-19.2, 66.1], [-17.4, 68.6], [-12.6, 72.6], [-7.6, 76.6]], 1.3); }]],
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [-21.0, 21.05, 64.6], [-9, 23.3, 75], 58], [7, [-19.8, 21.2, 65.8], [-8, 23.4, 76], 56]], t));
      },
    },

    // ================================================================ Vidéo 9 : les dunes de Tottori (2026-11-04)
    // le mur de sable au-dessus de la mer, vu de la mer (comme le vrai plan) : à l'est des portes de la descente
    'tt-mur': {
      duree: 3.2,
      preparer(o) { o.placer(150, 20, 150, 0, { y: 50, compagnon: false }); o.compagnon(151, 21, 0, 50); },
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [150, 12, -218], [150, 18, -90], 60], [3.2, [147, 12.6, -213], [150, 18.6, -90], 58]], t));
      },
    },
    // l'escalier, puis tout s'ouvre, en une seule prise : on ne voit que les marches et le ciel ; la caméra passe le haut des marches à 2,73 s
    // (la mélodie entre là) ; un vol : le sable, l'oasis, la crête, et la mer derrière elle
    'tt-escalier': {
      duree: 9.6,
      preparer(o) { o.placer(208.5, 38, 190, 38, { y: 50, compagnon: false }); o.compagnon(209.5, 37, -PI / 2, 50); },
      debut(o) { o.jeu.marcher([[208.5, 38], [197, 38], [191, 38.4]], 4.0); },
      chaque(t, dt, o) {
        const v = o.passant('videaste'); if (v) { v.etat.x = 52; v.etat.z = -49; }
        o.cadre(...o.chemin([
          [0.3, [213.5, 46.6, 38.6], [199, 53.6, 38], 50],
          [1.7, [207.5, 50.2, 38.6], [194, 57.4, 38], 50],
          [2.6, [203, 53.6, 38.6], [191, 55.8, 38], 52],
          [3.2, [199.8, 58.8, 38.8], [150, 46, 30], 60],
          [4.5, [192, 63, 38], [70, 28, -4], 60],
          [5.3, [150, 62, 36], [30, 20, 6], 58],
          [6.05, [84, 43, 31], [28, 20, 11], 58],
          [7.0, [38, 27, 18], [34, 48, -50], 58],
          [7.85, [34, 58, -40], [34, 16, -160], 60],
          [9.6, [34, 62, -76], [34, 8, -300], 60],
        ], t));
      },
    },
    // le haut du Dos de cheval : le voyageur et le compagnon près du poteau, la mer tout en bas
    'tt-crete': {
      duree: 4,
      preparer(o) { o.placer(41.0, -47.6, 41.6, -70, { y: 50, compagnon: false }); o.compagnon(42.4, -47.2, PI, 50); },
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [39.5, 52.4, -36], [41.5, 39, -92], 44], [4, [39.7, 52.2, -37.2], [41.5, 38.5, -92], 42]], t));
      },
    },
    // le tour à dos de chameau : vu de côté, en marche vers l'ouest, le guide devant, la crête et le ciel derrière
    'tt-chameau': {
      duree: 16.5,
      preparer(o) { const c = o.passant('chamelier'); o.placer(c.etat.x + 1.2, c.etat.z + 1.2, c.etat.x, c.etat.z, { y: 50, compagnon: false }); o.compagnon(c.etat.x + 2, c.etat.z + 2, 0, 50); },
      quand: [[0.2, (o) => o.agir('chamelier')]],
      chaque(t, dt, o) {
        o.lire(t, { delai: 0.25, choix: 0 });
        o.cadre([e.x - 1.6, e.y + 0.4, e.z + 5.8], [e.x, e.y + 0.65, e.z], 54);
      },
    },
    // la descente en planche : le jeu la conduit tout seul, d'une porte à l'autre ; la caméra du jeu, le chrono
    'tt-planche': {
      duree: 30,
      preparer(o) {
        const m = o.passant('moniteur');
        o.placer(m.etat.x + 0.2, m.etat.z - 1.4, m.etat.x, m.etat.z, { y: 50, compagnon: false }); o.compagnon(m.etat.x + 1.4, m.etat.z - 1.4, 0, 50);
        // (les portes de PISTE, tottori.js : un zigzag de 2,6 m autour de l'axe les passe toutes ; on vise un point un peu devant, sur une sinusoïde
        // qui passe dans chacune : viser le milieu des portes l'une après l'autre en ratait deux ou trois)
        const c = o.M().lieu.conduite, maj = c.maj;
        const zRiv = (x) => -165 + 2.5 * Math.sin(x * 0.011 + 0.7) + 1.2 * Math.sin(x * 0.029 + 2.0);
        c.maj = function (dt, pousse, vire, etat, cam, renard) {
          if (c.autre) return maj.call(this, dt, pousse, vire, etat, cam, renard);
          if (!o.piste) o.piste = { xd: etat.x, zd: etat.z, zf: zRiv(etat.x) + 15 };
          const P = o.piste, f = Math.min(1.05, (etat.z - P.zd) / (P.zf - P.zd) + 0.055);
          const cible = [P.xd - 2.6 * Math.cos((PI * (f - 0.17)) / 0.14) * (f < 0.95 ? 1 : 0), P.zd + (P.zf - P.zd) * f];
          const voulu = Math.atan2(cible[0] - etat.x, cible[1] - etat.z), d = Math.atan2(Math.sin(voulu - c.cap), Math.cos(voulu - c.cap));
          return maj.call(this, dt, pousse, Math.max(-1, Math.min(1, -d * 3)), etat, cam, renard);
        };
      },
      quand: [[0.2, (o) => o.agir('moniteur')]],
      chaque(t, dt, o) { o.lire(t, { delai: 0.2, choix: 0 }); },
    },
    // le télésiège : la caméra du jeu, le voyageur de face, le sable et la mer derrière lui
    'tt-lift': {
      duree: 48,
      preparer(o) { const c = o.passant('liftBas'); o.placer(c.etat.x + 1, c.etat.z + 1, c.etat.x, c.etat.z, { y: 52, compagnon: false }); o.compagnon(c.etat.x + 1.8, c.etat.z + 1.6, 0, 52); },
      quand: [[0.2, (o) => o.agir('liftBas')]],
      chaque(t, dt, o) { o.lire(t, { delai: 0.2, choix: 0 }); },
    },
    // le repas au restaurant, de face : le burger au crabe et son jus de poire, les baguettes
    'tt-repas': {
      duree: 12,
      preparer(o) { const c = o.passant('centreServeuse'); o.placer(c.etat.x + 1, c.etat.z + 1, c.etat.x, c.etat.z, { y: 63, compagnon: false }); o.compagnon(c.etat.x + 1.8, c.etat.z + 1.6, 0, 63); },
      quand: [[0.2, (o) => o.agir('centreServeuse')]],
      chaque(t, dt, o) { o.lire(t, { delai: 0.2, choix: 2 }); if (e.z > 56 && e.z < 57.5 && e.x > 365 && e.x < 366.5) o.cadre([367.5, 64.3, 59.7], [365.95, 62.92, 56.9], 37); },
    },
    // les jumelles du toit : le jeu les vise tout seul
    'tt-jumelles': {
      duree: 9,
      preparer(o) {
        o.placer(358.3, 32.8, 358.2, 31.9, { y: 70, compagnon: false }); o.compagnon(359.6, 33.2, 0, 70);
        const CIBLES = [[41.2, 48.4, -46.6], [181.8, 54.3, 64], null, [690, 16, -640], [254, 55, 96], [-3200, 200, -40]], OBS = [358.2, 70.87, 31.58];
        const c = o.M().lieu.conduite, maj = c.maj, V3 = o.B.camera.position.constructor, d = new V3();
        c.maj = function (dt, pousse, vire, etat, cam, renard) {
          if (!c.autre) return maj.call(this, dt, pousse, vire, etat, cam, renard);
          const txt = document.querySelector('.chrono small')?.textContent || '1/6', k = parseInt(txt, 10) - 1, q = CIBLES[k] || CIBLES[0];
          o.B.camera.getWorldDirection(d);
          const az = Math.atan2(q[0] - OBS[0], q[2] - OBS[2]), da = Math.atan2(Math.sin(az - Math.atan2(d.x, d.z)), Math.cos(az - Math.atan2(d.x, d.z)));
          const el = Math.atan2(q[1] - OBS[1], Math.hypot(q[0] - OBS[0], q[2] - OBS[2])) - Math.asin(d.y);
          return maj.call(this, dt, Math.max(-1, Math.min(1, el * 5)), Math.max(-1, Math.min(1, -da * 5)), etat, cam, renard);
        };
      },
      quand: [[0.2, (o) => o.agir('jumellesToit')]],
      chaque(t, dt, o) {
        o.lire(t, { delai: 0.2, choix: 0 });
        // (les deux ronds, plus grands que sur un téléphone : sur toute la largeur de la vidéo)
        for (const [c, sg] of [['.j1', -1], ['.j2', 1]]) { const q = document.querySelector('.jumelles-ecran ' + c); q.setAttribute('cx', 270 + sg * 118); q.setAttribute('cy', 500); q.setAttribute('r', 228); }
      },
    },
    // le musée : le voyageur devant la Sagrada Família de sable
    'tt-musee': {
      duree: 3.6,
      preparer(o) { o.placer(250.5, 103, 262, 104, { y: 45, tangage: 0.1, distance: 4, compagnon: false }); o.compagnon(249.4, 104.2, 1.5, 45); },
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [243.2, 46.2, 103.4], [262, 48.4, 104], 66], [3.6, [245, 46.1, 103.5], [262, 48.6, 104], 64]], t));
      },
    },
    // l'oasis : on marche dans l'eau ; la caméra basse, sur la rive, la grande crête derrière
    'tt-oasis': {
      duree: 6.2,
      preparer(o) { o.placer(25, 25.8, 30, 12, { y: 24, compagnon: false }); o.compagnon(26.5, 26.6, 2.8, 24); },
      debut(o) { o.jeu.marcher([[25, 25.8], [30, 12]], 2.4); },
      chaque(t, dt, o) {
        o.cadre([e.x - 2.2, e.y + 1.0, e.z + 5.2], [e.x + 0.6, e.y + 1.1, e.z - 2], 54);
      },
    },
    // le cinquième tampon (l'écriteau de l'oasis), la carte de la récompense, le nuage et l'ombrelle
    'tt-tampon': {
      duree: 18,
      preparer(o) { const I = o.inter('oasis'); o.placer(I.x, I.z, I.vers[0], I.vers[1], { y: 24, compagnon: false }); o.compagnon(I.x + 1.5, I.z + 0.7, -0.8, 24); },
      quand: [[0.2, (o) => o.agir('oasis')]],
      chaque(t, dt, o) {
        o.lire(t, { delai: 0.35 });
        const sx = Math.sin(e.cap), sz = Math.cos(e.cap);
        o.cadre([e.x + sx * 3.6 + sz * 1.0, e.y + 1.0, e.z + sz * 3.6 - sx * 1.0], [e.x + sz * 0.1, e.y + 1.22, e.z - sx * 0.1], 52);
      },
    },
    // l'ombrelle de Shan-shan et ses grelots : elle marche sur la crête, vue de face, la mer derrière
    'tt-ombrelle': {
      duree: 4.5,
      preparer(o) { o.placer(62, -53, 46, -49.6, { y: 50, compagnon: false }); o.compagnon(63, -52.4, -1.5, 50); },
      debut(o) { o.jeu.marcher([[62, -53], [46, -49.6]], 1.9); },
      chaque(t, dt, o) {
        const sx = Math.sin(e.cap), sz = Math.cos(e.cap);
        o.cadre([e.x + sx * 3.6, e.y + 0.9, e.z + sz * 3.6 + 2.6], [e.x - sx * 0.5, e.y + 1.34, e.z - sz * 0.5], 54);
      },
    },
    // le secret, montré sans être résolu : les grandes traces sur la crête, de jour
    'tt-traces': {
      duree: 3.4,
      preparer(o) { o.placer(130, 30, 120, 30, { y: 50, compagnon: false }); o.compagnon(131, 31, 0, 50); },
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [64, 51, -54.4], [50, 46.2, -50], 38], [3.4, [61.5, 50.2, -53.6], [48, 46.2, -49.6], 36]], t));
      },
    },
    // le grelot à moitié enterré, au fond de la cuvette
    'tt-grelot': {
      duree: 2.8,
      preparer(o) { o.placer(-110, 62, -120, 62, { y: 20, compagnon: false }); o.compagnon(-109, 63, 0, 20); },
      chaque(t, dt, o) {
        // (de face, sa fente de grelot en travers : de côté, elle sortait comme la visière d'une casquette)
        o.cadre(...o.chemin([[0, [-119.2, 10.75, 64.2], [-120.2, 9.98, 62.2], 40], [2.8, [-119.4, 10.6, 63.8], [-120.2, 9.98, 62.2], 35]], t));
      },
    },
    // la caravane devant la lune immense, juste un aperçu : elle marche, loin, à l'ouest des portes (le secret noté trouvé : c'est ainsi qu'elle marche sans nous)
    'tt-lune': {
      duree: 5,
      async preparer(o) {
        o.placer(150, 60, 120, 60, { y: 50, compagnon: false }); o.compagnon(151, 61, 0, 50);
        await o.nuitTout(true);
        o.car = o.M().lieu.animes.find((a) => a.premiereTrace);
        o.car.s = 134;
      },
      chaque(t, dt, o) {
        // (au long foyer, de très loin, sur la ligne de la lune : les cinq chameaux passent devant son disque)
        o.cadre(...o.chemin([[0, [33.3, 27.4, -0.7], [-32, 47.5, -26], 20], [5, [33.3, 27.4, -0.7], [-32, 47.5, -26], 18.5]], t));
      },
    },
    // la fin : sur la crête, avec l'ombrelle, vus de dos, la mer devant
    'tt-fin': {
      duree: 7,
      preparer(o) { o.placer(47, -52, 44, -68, { y: 50, compagnon: false }); o.compagnon(48.1, -51.7, PI, 50); },
      quand: [[0.5, (o) => { o.jeu.marcher([[47, -52], [44, -68]], 1.3); }]],
      chaque(t, dt, o) {
        o.cadre([e.x + 1.2, e.y + 2.6, e.z + 6.2], [e.x - 0.6, e.y - 1, e.z - 8], 52);
      },
    },
    // la place du grand Bouddha, de face (comme le vrai plan d'été) : le Bouddha, ses statues devant, le brûle-parfum
    'ts-place': {
      duree: 4,
      preparer(o) { o.placer(-38.5, 4.6, -26, 12, { y: 30, compagnon: false }); o.compagnon(-37.6, 3.7, PI / 2, 30); },
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [-47.6, 14.6, 9.9], [-26, 20.2, 11.8], 60], [4, [-46.6, 14.6, 10.0], [-26, 20.3, 11.8], 58]], t));
      },
    },
    // l'arrivée en bus : le voyageur descend de l'arrêt, vers nous ; le bus derrière lui
    'ts-bus': {
      duree: 3.4,
      preparer(o) { o.placer(-154, -32.2, -140, -30.4, { y: 10, compagnon: false }); o.compagnon(-154.8, -30.9, PI / 2, 10); },
      debut(o) { o.jeu.marcher([[-154, -32.2], [-145, -30.6]], 2.2); },
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [-140.6, 4.75, -29.0], [-156, 4.3, -35.4], 54], [3.4, [-141.6, 4.7, -29.3], [-156, 4.3, -35.4], 52]], t));
      },
    },
    // l'escalier et la porte des Niō : le voyageur monte, la caméra le suit dans l'axe, passe la porte derrière lui et se tourne vers le grand Bouddha
    // (la mélodie entre là)
    'ts-nio': {
      duree: 5.4,
      preparer(o) { o.placer(-50.5, -32, -44.6, -32, { y: 20, compagnon: false }); o.compagnon(-51.5, -31.2, PI / 2, 20); },
      debut(o) { o.jeu.marcher([[-50.5, -32], [-44.6, -32], [-40.5, -30.5], [-37, -26], [-35, -20]], 2.8); },
      chaque(t, dt, o) {
        o.cadre(...o.chemin([
          [0, [-66, 8.6, -32], [-46, 15.6, -32], 50],
          [1.6, [-59, 12.4, -32], [-44.6, 16.2, -32], 50],
          [2.8, [-50.5, 14.6, -32], [-38, 15.2, -32], 56],
          [3.6, [-45.8, 14.5, -32], [-30, 15.6, -32], 60],
          [4.3, [-42.0, 14.6, -32], [-30, 16.5, -24], 60],
          [5.4, [-40.5, 15.0, -31.0], [-27, 19.5, 8], 58],
        ], t));
      },
    },
    // le bâton d'encens au grand brûle-parfum : le voyageur l'offre, la fumée monte, le grand Bouddha au-dessus (la caméra de l'action, qui
    // montait vers le Bouddha à 3,2 s, coupée : elle passait une image avant la nôtre ; le voyageur 60 cm avant le point de l'action : posé
    // dessus, il se tournait vers nous, agir() le tournant vers ce point)
    'ts-encens': {
      duree: 4.6,
      preparer(o) {
        const I = o.inter('daibutsu'); o.placer(I.x - 0.6, I.z, I.vers[0], I.vers[1], { y: 30, compagnon: false }); o.compagnon(I.x - 1.2, I.z + 1.4, PI / 2, 30);
        o.jeu.cadrer = () => {};
      },
      quand: [[0.2, (o) => o.agir('daibutsu')]],
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [-47.2, 14.1, 10.0], [-30, 19.6, 11.6], 60], [4.6, [-46.8, 14.1, 10.1], [-30, 19.7, 11.6], 58]], t));
      },
    },
    // la prière pour les yeux : devant le 礼堂, le gong, les mains jointes (le voyageur 60 cm devant le point de l'action, tourné vers le gong)
    'ts-gong': {
      duree: 4.4,
      preparer(o) { const I = o.inter('yeux'); o.placer(I.x, I.z + 0.6, I.vers[0], I.vers[1], { y: 40, compagnon: false }); o.compagnon(I.x + 1.4, I.z + 1.5, PI, 40); },
      quand: [[0.2, (o) => o.agir('yeux')]],
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [12.6, 27.0, -22.6], [14.0, 26.9, -30], 50], [4.4, [12.7, 27.0, -23.1], [14.0, 26.95, -30], 48]], t));
      },
    },
    // le test des yeux : les anneaux de Landolt, de plus en plus petits ; la prise répond juste (elle lit le trou de l'anneau dans la feuille)
    'ts-test': {
      duree: 10,
      preparer(o) { const I = o.inter('epreuve'); o.placer(I.x, I.z, I.vers[0], I.vers[1], { y: 40, compagnon: false }); o.compagnon(I.x - 1.3, I.z + 0.6, 0, 40); },
      quand: [[0.2, (o) => o.agir('epreuve')]],
      chaque(t, dt, o) {
        // (le trou : le second rectangle de la feuille ; plus large que haut, il est à droite ou à gauche ; 0 en haut, 1 à droite, 2 en bas, 3 à gauche)
        const r = document.querySelectorAll('.feuille svg rect')[1];
        let dir = 0;
        if (r) {
          const x = +r.getAttribute('x'), y = +r.getAttribute('y'), w = +r.getAttribute('width'), h = +r.getAttribute('height');
          dir = w > h ? (x + w / 2 > 100 ? 1 : 3) : (y + h / 2 > 100 ? 2 : 0);
        }
        o.lire(t, { delai: 0.45, choix: dir });
        o.cadre([34.0, 26.7, -22.8], [35.4, 26.4, -27.6], 50);
      },
    },
    // les lunettes perdues : le petit jizō des hortensias les porte
    'ts-lunettes': {
      duree: 3.6,
      preparer(o) { o.placer(32.0, -41.3, 33.1, -43, { y: 40, compagnon: false }); o.compagnon(31.1, -42.6, PI / 2, 40); },
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [33.7, 25.78, -40.4], [33.05, 25.25, -43], 38], [3.6, [33.6, 25.72, -40.85], [33.05, 25.25, -43], 33]], t));
      },
    },
    // le grand pavillon : ses gradins rouges et leurs centaines de poupées
    'ts-poupees': {
      duree: 3.8,
      preparer(o) { o.placer(-114.0, -8.0, -120, -8, { y: 6, compagnon: false }); o.compagnon(-112.6, -7.0, -PI / 2, 6); },
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [-110.6, 5.3, -6.2], [-119.5, 5.1, -8.6], 60], [3.8, [-111.4, 5.3, -6.6], [-119.5, 5.1, -8.6], 58]], t));
      },
    },
    // le thé de l'arbre à collyre, à la maison de thé : assis, la tasse, on boit ; la caméra près d'elle, de trois quarts, une fois assise
    'ts-the': {
      duree: 12,
      preparer(o) { const p = o.passant('chaya'); o.placer(p.etat.x - 1.4, p.etat.z - 0.4, p.etat.x, p.etat.z, { y: 30, compagnon: false }); o.compagnon(p.etat.x - 2.4, p.etat.z - 1.2, PI / 2, 30); },
      quand: [[0.2, (o) => o.agir('chaya')]],
      chaque(t, dt, o) {
        o.lire(t, { delai: 0.25, choix: 0 });
        // (assise : le jeu a posé sa caméra ; la nôtre, plus près)
        if (o.M().cadre && !o.M().cadre.prise && !o.assise) o.assise = [e.x, e.y, e.z];
        if (o.assise) { const [x, y, z] = o.assise; o.cadre([x + 1.3, y + 1.3, z + 1.95], [x, y + 0.8, z + 0.1], 44); }
      },
    },
    // la grotte de pierre : on y entre, les colonnes, le stupa au fond
    'ts-grotte': {
      duree: 5,
      preparer(o) { o.placer(41.7, 21.5, 41.7, 30, { y: 40, compagnon: false }); o.compagnon(42.6, 20.6, 0, 40); },
      debut(o) { o.jeu.marcher([[41.7, 21.5], [41.7, 33.5]], 2.2); },
      chaque(t, dt, o) {
        o.cadre([41.4, e.y + 2.05, e.z - 4.6], [41.7, e.y + 1.75, e.z + 7], 60);
      },
    },
    // le tour du stupa : le voyageur en fait le tour par devant, de l'ouest à l'est, le stupa à sa droite ; la caméra haute, dans la nef (derrière le
    // stupa, le jeu rend le dôme transparent autour de lui : on voyait la grille de la salle des cendres au travers ; la caméra du jeu, elle, collait
    // à son dos dans le déambulatoire)
    'ts-stupa': {
      duree: 6.2,
      preparer(o) {
        const I = o.inter('stupa'); o.sx = I.x; o.sz = I.z + 3.1; o.y0 = I.y;
        const a0 = -0.6 * PI, a1 = a0 + 0.08;
        o.placer(o.sx + 2.95 * Math.sin(a0), o.sz - 2.95 * Math.cos(a0), o.sx + 2.95 * Math.sin(a1), o.sz - 2.95 * Math.cos(a1), { y: 40, compagnon: false });
        o.compagnon(o.sx + 2.95 * Math.sin(a0 - 0.4), o.sz - 2.95 * Math.cos(a0 - 0.4), 0, 40);
      },
      debut(o) {
        const pts = []; for (let k = 0; k <= 16; k++) { const a = -0.6 * PI + (k / 16) * PI * 1.2; pts.push([o.sx + 2.95 * Math.sin(a), o.sz - 2.95 * Math.cos(a)]); }
        o.jeu.marcher(pts, 1.8);
      },
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [o.sx - 0.3, o.y0 + 2.6, o.sz - 7.8], [o.sx, o.y0 + 1.3, o.sz + 0.2], 62], [6.2, [o.sx + 0.3, o.y0 + 2.6, o.sz - 7.4], [o.sx, o.y0 + 1.3, o.sz + 0.2], 60]], t));
      },
    },
    // le Bouddha couché, vu de l'ouest, du côté de sa tête ; le voyageur devant lui
    'ts-nehan': {
      duree: 3.8,
      preparer(o) { o.placer(-39.6, 51.8, -35, 51.8, { y: 40, compagnon: false }); o.compagnon(-40.6, 50.6, PI / 2, 40); },
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [-43.0, 26.1, 56.4], [-35.5, 25.5, 48.5], 56], [3.8, [-42.4, 26.0, 55.6], [-35.5, 25.5, 48.5], 54]], t));
      },
    },
    // le grand Kannon de 20 m : du haut de son escalier, on lève les yeux (comme le vrai plan)
    'ts-kannon': {
      duree: 4.4,
      preparer(o) { o.placer(-35.4, 77.5, -35, 86.5, { y: 40, compagnon: false }); o.compagnon(-34.4, 76.9, 0, 40); },
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [-35.6, 32.0, 68.0], [-35, 44, 86.5], 62], [4.4, [-35.6, 32.6, 69.4], [-35, 47, 86.5], 60]], t));
      },
    },
    // la marche de Sawaichi : les yeux fermés (le masque du jeu, le ♪ qui guide) ; la caméra du jeu, derrière le voyageur
    'ts-sawaichi': {
      duree: 16,
      preparer(o) { const p = o.passant('marcheuse'); o.placer(p.etat.x - 1.4, p.etat.z + 0.8, p.etat.x, p.etat.z, { y: 40, compagnon: false }); o.compagnon(p.etat.x - 2.2, p.etat.z + 1.8, 0, 40); },
      quand: [[0.2, (o) => o.agir('marcheuse')]],
      chaque(t, dt, o) {
        o.lire(t, { delai: 0.25, choix: 0 });
        if (!o.parti && document.querySelector('#jeu + div canvas') && e.mode === 'jeu') { o.parti = true; o.jeu.marcher([[e.x, e.z], [31.2, -57.4], [31.2, -52], [47, -52], [47, -46], [31.2, -46]], 1.7); }
        if (o.parti) o.viser(e.x + Math.sin(e.cap) * 5, e.z + Math.cos(e.cap) * 5, 0.06);
      },
    },
    // le cinquième tampon (Osato et Sawaichi), la carte de la récompense : le shamisen
    'ts-tampon': {
      duree: 26,
      preparer(o) { const I = o.inter('osato'); o.placer(I.x, I.z, I.vers[0], I.vers[1], { y: 40, compagnon: false }); o.compagnon(I.x - 1.2, I.z + 0.6, 0, 40); },
      quand: [[0.2, (o) => o.agir('osato')]],
      chaque(t, dt, o) { o.lire(t, { delai: 0.4 }); },
    },
    // le shamisen de Sawaichi : immobile, le voyageur en joue ; de face, le grand Bouddha derrière
    'ts-shamisen': {
      duree: 7,
      preparer(o) { o.placer(-40.5, 9.6, -46, 9.6, { y: 30, compagnon: false }); o.compagnon(-40.2, 11.2, -PI / 2, 30); },
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [-44.4, 13.8, 9.2], [-38, 15.6, 10.4], 56], [7, [-44.0, 13.75, 9.25], [-38, 15.6, 10.4], 53]], t));
      },
    },
    // la nuit : les ombrelles allumées dans le couloir des hortensias, la cloche, les étoiles
    'ts-nuit': {
      duree: 4,
      async preparer(o) { o.placer(39, -41.5, 39, -50, { y: 40, compagnon: false }); o.compagnon(38, -40.6, PI, 40); await o.nuitTout(true); },
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [39.1, 27.5, -36.2], [39, 25.6, -50], 56], [4, [39.05, 27.4, -37.2], [39, 25.6, -50], 54]], t));
      },
    },
    // le secret, montré sans être résolu : le sentier de la forêt et ses rochers de rakan
    'ts-sentier': {
      duree: 4.6,
      preparer(o) { o.placer(50.5, 28.5, 55, 36, { y: 40, compagnon: false }); o.compagnon(49.6, 27.4, 0.5, 40); },
      debut(o) { o.jeu.marcher([[50.5, 28.5], [55, 36], [58.5, 41]], 1.5); },
      chaque(t, dt, o) {
        o.cadre([e.x - 2.6, e.y + 2.2, e.z - 3.9], [e.x + 2.8, e.y + 0.8, e.z + 5.4], 56);
      },
    },
    // un rocher de rakan, de près (pas un des trois qui cachent le secret)
    'ts-rocher': {
      duree: 4.6,
      preparer(o) {
        const R = o.M().lieu.rakans.filter((r) => r.rocher === 'moussu');
        o.c = [R.reduce((s, r) => s + r.x, 0) / R.length, R.reduce((s, r) => s + r.y, 0) / R.length, R.reduce((s, r) => s + r.z, 0) / R.length];
        o.placer(53.6, 33.7, o.c[0], o.c[2], { y: 40, compagnon: false }); o.compagnon(52.6, 33.0, 0, 40); o.jeu.cacherVoyageur(true);
      },
      chaque(t, dt, o) {
        const [cx, cy, cz] = o.c, dx = cx - 53.6, dz = cz - 33.7;
        o.cadre(...o.chemin([[0, [53.6 - dx * 0.7, cy + 1.9, 33.7 - dz * 0.7], [cx, cy + 0.7, cz], 54], [4.6, [53.6 - dx * 0.3, cy + 1.5, 33.7 - dz * 0.3], [cx, cy + 0.65, cz], 50]], t));
      },
    },
    // le couloir des hortensias, de jour : le voyageur y marche, vers la cloche (avant la marche de Sawaichi)
    'ts-couloir': {
      duree: 4,
      preparer(o) { o.placer(31.4, -42.5, 31.2, -55, { y: 40, compagnon: false }); o.compagnon(32.4, -41.6, PI, 40); },
      debut(o) { o.jeu.marcher([[31.4, -42.5], [31.2, -52]], 1.6); },
      chaque(t, dt, o) {
        o.cadre([e.x + 0.4, e.y + 2.5, e.z + 5.0], [e.x + 0.1, e.y + 0.9, e.z - 9], 56);
      },
    },
    // la fin : tout le temple, de haut, la caméra recule lentement
    'ts-fin': {
      duree: 7,
      preparer(o) { o.placer(14, -20, 14, -30, { y: 40 }); },
      chaque(t, dt, o) {
        o.cadre(...o.chemin([[0, [-56, 74, 64], [5, 14, -15], 52], [7, [-62, 79, 71], [5, 14, -15], 52]], t));
      },
    },

    // ================================================================ Vidéo 11 : Sumi, le peintre Inkami (2026-11-20)
    // Toutes dans le jeu en ligne, en simple visiteur (rushes.py, 'site'). Les caméras sont écrites dans le repère de l'étal (o.etal) :
    // u à droite de celui qui regarde la toile, v vers lui, h au-dessus du sol du chevalet ; Sumi se tient en (0,47 ; 0,62), tourné vers
    // sa toile. Le voyageur et son compagnon sont mis hors du champ (loin), sauf quand il parle à Sumi.
    // l'accroche : Sumi en gros plan qui peint, vu de derrière sa toile (son visage, sa barbe, le chapeau, le pinceau), la caméra approche
    'sm-visage': {
      duree: 3.4,
      preparer(o) { o.etal().loin(-1); },
      chaque(t, dt, o) {
        const E = o.E;
        o.cadre(...o.chemin([[0, ...E.vue(1.6, -1.5, 1.53, 0.47, 0.62, 1.22), 46], [3.4, ...E.vue(1.38, -1.28, 1.48, 0.47, 0.62, 1.2), 41]], t));
      },
    },
    // Itsukushima en grand : le chevalet, Sumi qui peint, le sanctuaire rouge et le grand torii dans la mer (le voyageur qui arrivait passait
    // devant la caméra)
    'sm-large': {
      duree: 3.4,
      preparer(o) { o.etal().loin(1); },
      chaque(t, dt, o) {
        const E = o.E;
        o.cadre(...o.chemin([[0, ...E.vue(-2.3, 4.1, 1.85, 0.25, 0.25, 1.0), 46], [3.4, ...E.vue(-1.6, 4.3, 1.8, 0.25, 0.25, 1.0), 44]], t));
      },
    },
    // on lui parle : il se retourne vers le voyageur (sa boîte de dialogue cachée) ; la caméra de côté, à 40° du voyageur (derrière lui, son
    // chapeau de paille remplissait l'image)
    'sm-salut': {
      duree: 3.8,
      preparer(o) {
        const E = o.etal(), [x, z] = E.R(-0.15, 1.95);
        o.placer(x, z, ...E.sumi, { compagnon: false });
        o.compagnon(...E.R(-1.3, 2.6), E.Q.cap + PI);
        o.jeu.cadrer = () => {};
      },
      quand: [[0.15, (o) => o.agir('sumi')]],
      chaque(t, dt, o) {
        const E = o.E;
        o.cadre(...o.chemin([[0, ...E.vue(1.1, 2.9, 1.38, 0.45, 0.62, 1.1), 40], [3.8, ...E.vue(1.0, 2.7, 1.35, 0.45, 0.62, 1.1), 35]], t));
      },
    },
    // Himeji : Sumi et son étal au premier plan, le donjon au-dessus (le monde, pas le repère de l'étal)
    'sm-himeji': {
      duree: 3.2,
      preparer(o) { o.etal().loin(1); },
      chaque(t, dt, o) {
        const y = o.E.y;
        o.cadre(...o.chemin([[0, [3.8, y + 1.45, 22.6], [2.6, y + 8, -40], 46], [3.2, [3.6, y + 1.85, 22.0], [2.6, y + 9.2, -40], 44]], t));
      },
    },
    // les dunes de Tottori : l'étal sur le palier du haut, la mer et le sable derrière
    'sm-tottori': {
      duree: 3.2,
      preparer(o) { o.etal().loin(1); },
      chaque(t, dt, o) {
        const E = o.E;
        o.cadre(...o.chemin([[0, ...E.vue(-2.0, 3.7, 1.8, 0.25, 0.25, 1.05), 46], [3.2, ...E.vue(-1.4, 3.9, 1.75, 0.25, 0.25, 1.05), 44]], t));
      },
    },
    // Tsubosaka-dera : l'étal sur le côté de la grande allée, la toile tournée vers le départ (déplacé le 2026-11-20 par la session de la
    // balade, à la demande du propriétaire : la caméra suit l'étal, dans son repère, et regarde vers l'allée derrière lui)
    'sm-tsubosaka': {
      duree: 3.2,
      preparer(o) { o.etal().loin(1); },
      chaque(t, dt, o) {
        const E = o.E;
        o.cadre(...o.chemin([[0, ...E.vue(-2.2, 4.2, 1.85, 0.25, 0.25, 1.1), 48], [3.2, ...E.vue(-1.6, 4.4, 1.8, 0.25, 0.25, 1.1), 46]], t));
      },
    },
    // la toile et le pinceau de près, vus de devant à gauche : la peinture du lieu, le pinceau qui la touche, le lieu derrière (les neuf
    // autres lieux défilent ainsi, un demi-temps chacun ; Itsukushima, plus long, pour « He paints the people he meets »)
    ...Object.fromEntries(['aogashima', 'gokayama', 'takachiho', 'kinkakuji', 'beppu', 'motonosumi', 'sanjubutsu', 'udo', 'yakushima', 'itsukushima'].map((lieu) => [
      lieu === 'itsukushima' ? 'sm-pinceau' : `sm-p-${lieu}`, {
        duree: lieu === 'itsukushima' ? 4.2 : 1.6,
        preparer(o) { o.etal().loin(lieu === 'yakushima' ? -1 : 1); },
        chaque(t, dt, o) {
          const E = o.E, d = this.duree;
          // (Yakushima : depuis que son étal est à l'entrée de la forêt, derrière la toile vue de devant, il y a les toilettes et leur
          // écriteau ; Sumi y est filmé de derrière sa toile, la forêt derrière lui)
          if (lieu === 'yakushima') o.cadre(...o.chemin([[0, ...E.vue(2.0, -2.6, 1.65, 0.3, 0.6, 1.05), 44], [d, ...E.vue(1.8, -2.3, 1.6, 0.3, 0.6, 1.05), 41]], t));
          else o.cadre(...o.chemin([[0, ...E.vue(-1.05, 1.85, 1.5, 0.15, 0.1, 1.15), 40], [d, ...E.vue(-0.85, 1.6, 1.45, 0.15, 0.1, 1.15), 37]], t));
        },
      }])),
    // le journal de près : la caméra glisse sur la toile du samouraï de Himeji, du nom en katakana au visage
    'sm-journal': {
      duree: 4.6,
      preparer(o) { o.etal().loin(1); },
      chaque(t, dt, o) {
        const E = o.E;
        o.cadre(...o.chemin([[0, ...E.vue(0.42, 1.2, 1.5, 0.08, 0, 1.42), 30], [4.6, ...E.vue(0.3, 1.1, 1.2, -0.02, 0, 1.08), 30]], t));
      },
    },
    // on lui parle (ses boîtes de dialogue lues toutes seules ; déjà rencontré : « Oh, you again! ») ; « Want a closer look at my painting? »,
    // « Yes », la fenêtre du tableau (le prêtre d'Itsukushima)
    'sm-parler': {
      duree: 11,
      preparer(o) {
        const E = o.etal(), [x, z] = E.R(-0.15, 1.95);
        o.placer(x, z, ...E.sumi, { compagnon: false });
        o.compagnon(...E.R(-1.3, 2.6), E.Q.cap + PI);
        o.jeu.cadrer = () => {};
      },
      quand: [[0.15, (o) => o.agir('sumi')]],
      chaque(t, dt, o) {
        o.lire(t, { delai: 0.9, choix: 0 });
        const E = o.E;
        o.cadre(...E.vue(1.0, 4.5, 1.9, 0.1, 1.0, 1.0), 44);
      },
    },
    // « Regarder » un tableau : la fenêtre s'ouvre aussitôt ; derrière le voile, le lieu
    ...Object.fromEntries([['samourai', 'himeji'], ['chamelier', 'tottori'], ['voyageur', 'himeji']].map(([id, lieu]) => [`sm-${id}`, {
      duree: id === 'voyageur' ? 8 : 3.4,
      preparer(o) {
        const E = o.etal(id === 'voyageur'), [x, z] = E.R(0, 1.15);
        o.placer(x, z, E.Q.x, E.Q.z, { compagnon: false });
        o.compagnon(...E.R(-1.1, 1.6), E.Q.cap + PI);
        o.jeu.cadrer = () => {};
      },
      quand: [[0.3, (o) => o.agir(`tableau-${id}`)]],
      chaque(t, dt, o) { o.cadre(...o.E.vue(-2.6, 4.6, 1.9, 0.2, 0.2, 1.0), 48); },
    }])),
    // la fin : Sumi la nuit, à la lumière de son lampion, à Itsukushima
    'sm-nuit': {
      duree: 5,
      preparer(o) { o.etal().loin(1); return o.nuitTout(true); },
      chaque(t, dt, o) {
        const E = o.E;
        o.cadre(...o.chemin([[0, ...E.vue(-2.3, 4.4, 1.8, 0.2, 0.3, 1.05), 46], [5, ...E.vue(-2.9, 5.0, 2.0, 0.2, 0.3, 1.05), 48]], t));
      },
    },

    // ================================================================ Vidéo 12 : la fête de la neige d'Iiyama (2026-11-21)
    // Toutes dans le jeu en ligne, en simple visiteur (rushes.py, 'site'). Repères (iiyama.js) : x à l'est, z au sud ; la rue et la place y 0,
    // la terrasse des sculptures y 4, le coin des enfants y 2, le haut du château y 9, le village des kamakura y 14 (250 m au nord, derrière
    // la crête boisée ; la navette y mène).
    // le vieil homme au chapeau de paille (笠地蔵), de face comme le vrai plan ; puis la caméra recule et monte : la terrasse, le voyageur
    'iy-vieux': {
      duree: 4.6,
      preparer(o) { o.placer(-21.2, -45.0, -24.5, -50.4, { compagnon: false }); o.compagnon(-19.6, -44.4, PI); },
      chaque(t, dt, o) {
        // (le vieux promeneur au chapeau de paille se tenait juste devant la sculpture)
        const p = o.passant('papi'); if (p) Object.assign(p.etat, { x: -12.5, z: -44.2 });
        // (deux clés égales avant le départ : avec une seule, la tangente de Catmull-Rom faisait déjà glisser la caméra avant 2 s)
        o.cadre(...o.chemin([[0, [-22.3, 5.5, -41.4], [-24.4, 5.9, -50.4], 40], [2.3, [-22.3, 5.5, -41.4], [-24.4, 5.9, -50.4], 40], [2.4, [-22.3, 5.5, -41.4], [-24.4, 5.9, -50.4], 40], [4.4, [-12, 11, -28], [2, 4.5, -48], 56]], t));
      },
    },
    // l'arrivée sous la neige : le voyageur entre sur la place, vu de dos, la grande banderole いいやま雪まつり devant lui ; les flocons
    'iy-arrivee': {
      duree: 3.2,
      preparer(o) { o.placer(0.3, 51.5, 0.3, 30); o.compagnon(-1.1, 51.0, PI); },
      debut(o) { o.jeu.marcher([[0.3, 51.5], [0.3, 38]], 1.4); },
      chaque(t, dt, o) { o.cadre([e.x + 0.6, e.y + 1.55, e.z + 4.6 - 0.25 * t], [e.x - 0.2, e.y + 2.6, e.z - 17], 50); },
    },
    // la rue aux arcades (雁木) : le voyageur la longe ; vu de la place, les maisons et leur arcade derrière lui (la caméra le suit)
    'iy-rue': {
      duree: 3.4,
      preparer(o) { o.placer(-4, 50.4, 6, 50.4); o.compagnon(-5.2, 49.4, PI / 2); },
      debut(o) { o.jeu.marcher([[-4, 50.4], [6, 50.4]], 1.4); },
      chaque(t, dt, o) { o.cadre([e.x - 0.8, 1.75, e.z - 5.2], [e.x - 0.3, 2.3, e.z + 8], 50); },
    },
    // les étals de la place (きのこ汁, 笹寿司, バナナボート…) : le voyageur longe leur rang, la caméra le suit depuis la place (de dos, à un étal, on
    // ne voyait que son chapeau)
    'iy-etal': {
      duree: 4,
      preparer(o) { o.placer(-18.2, 24, -18.2, 40); o.compagnon(-17, 23, PI); },
      debut(o) { o.jeu.marcher([[-18.2, 24], [-18.2, 40]], 1.4); },
      chaque(t, dt, o) { o.cadre([e.x + 6.5, 2.4, e.z - 3.2], [e.x - 4, 1.6, e.z + 2.0], 50); },
    },
    // le dragon de neige de vingt mètres (昇り龍), en travelling le long de lui ; le voyageur le regarde
    'iy-dragon': {
      duree: 3.4,
      preparer(o) { o.placer(-2.5, -42.6, -1, -50, { compagnon: false }); o.compagnon(-3.8, -42.0, PI); },
      chaque(t, dt, o) { o.cadre(...o.chemin([[0, [-13, 8.4, -38.5], [-7, 6.2, -51], 46], [3.4, [-5, 8.6, -37.5], [5, 6.2, -51], 46]], t)); },
    },
    // les six Jizō de neige (六地蔵), comme le vrai plan
    'iy-jizo': {
      duree: 3.4,
      preparer(o) { o.placer(10, -30, 10, -20, { compagnon: false }); o.compagnon(11, -30, 0); },
      chaque(t, dt, o) {
        const p = o.passant('mere'); if (p) Object.assign(p.etat, { x: 27.5, z: -44.0 });
        o.cadre(...o.chemin([[0, [20.6, 7.0, -40.0], [21.2, 5.8, -50.6], 45], [3.4, [20.7, 6.9, -41.0], [21.2, 5.8, -50.6], 44]], t));
      },
    },
    // le daruma qu'une équipe finit encore : on aide, trois coups de pelle (le tampon 雪像)
    'iy-daruma': {
      duree: 10,
      preparer(o) { const p = o.passant('chef'); o.placer(p.etat.x + 0.6, p.etat.z - 1.6, p.etat.x, p.etat.z, { compagnon: false }); o.compagnon(-25.6, -36.4, PI); },
      quand: [[0.2, (o) => o.agir('chef')]],
      chaque(t, dt, o) { o.lire(t, { delai: 0.3, choix: 0 }); o.cadre([-25.2, 5.9, -34.6], [-32, 6.6, -33.8], 58); },
    },
    // l'atelier des lanternes de neige (雪灯ろう) : on fait la sienne, deux coups de pelle, un nuage, la voilà allumée (le tampon 雪灯ろう)
    'iy-lanterne': {
      duree: 13,
      preparer(o) { const p = o.passant('animatrice'); o.placer(p.etat.x, p.etat.z - 1.6, p.etat.x, p.etat.z, { compagnon: false }); o.compagnon(-56, -18, 0); },
      quand: [[0.2, (o) => o.agir('animatrice')]],
      chaque(t, dt, o) { o.lire(t, { delai: 0.3, choix: 0 }); o.cadre([-52.6, 2.9, -11.4], [-54.6, 2.3, -13.9], 50); },
    },
    // le toboggan de la butte des enfants : assis en haut, on file dans la glissière, de côté
    'iy-toboggan': {
      duree: 5,
      preparer(o) { o.placer(-60.2, -33.4, -68.4, -33.4, { compagnon: false }); o.compagnon(-60, -30.6, PI); },
      quand: [[0.2, (o) => o.agir('toboggan')]],
      chaque(t, dt, o) { o.lire(t, { delai: 0.3 }); o.cadre([-64.2, 4.9, -25.0], [-65.4, 3.0, -33.4], 50); },
    },
    // la descente en bouée (スノースライダー), chronométrée : la prise la pilote (elle tient le milieu en se penchant : l'or), la caméra du jeu
    // derrière elle, puis devant, à l'arrivée ; on ne recommence pas
    'iy-bouee': {
      duree: 38,
      preparer(o) {
        const p = o.passant('liftier'); o.placer(p.etat.x + 1.2, p.etat.z + 1.0, p.etat.x, p.etat.z, { compagnon: false }); o.compagnon(p.etat.x + 2.2, p.etat.z + 1.8, 0);
        const c = o.M().lieu.conduite, maj = c.maj;
        c.maj = function (dt, pousse, vire, etat, cam, renard) {
          if (c.autre) return maj.call(this, dt, pousse, vire, etat, cam, renard);
          return maj.call(this, dt, 1, Math.max(-1, Math.min(1, -3.2 * c.u)), etat, cam, renard);
        };
      },
      quand: [[0.2, (o) => o.agir('liftier')]],
      chaque(t, dt, o) { o.lire(t, { delai: 0.45, choix: o.M().lieu.conduite.fini ? 1 : 0 }); },
    },
    // la navette, au village des kamakura : le bus à l'arrêt, le voyageur va vers l'arche かまくらの里
    'iy-navette': {
      duree: 3.8,
      preparer(o) { o.placer(-3.4, -292.2, -1, -310); o.compagnon(-4.6, -291.2, PI); },
      debut(o) { o.jeu.marcher([[-3.4, -292.2], [-1, -304]], 1.5); },
      chaque(t, dt, o) { o.cadre(...o.chemin([[0, [17, 19, -276], [2, 15.5, -305], 48], [3.8, [13.5, 18.2, -280.5], [1, 15.6, -307], 48]], t)); },
    },
    // la marmite (のろし鍋), dans le kamakura au lampion rouge : assis au fond, on mange (le tampon のろし鍋) ; la caméra près de la table
    // (entier : la table et la marmite, entre l'œil et le voyageur, ne s'effacent pas en pointillés)
    'iy-nabe': {
      duree: 9,
      preparer(o) {
        const I = o.inter('monKamakura'); o.placer(I.x, I.z + 0.6, I.x, I.z - 2, { compagnon: false }); o.compagnon(I.x + 1.4, I.z + 1.2, PI);
        o.jeu.donner('nabe'); o.jeu.cadrer = () => {};
      },
      quand: [[0.2, (o) => o.agir('monKamakura')]],
      chaque(t, dt, o) {
        o.lire(t, { delai: 0.4 });
        const I = o.inter('monKamakura');
        if (!o.assis && e.z < I.z - 2.4) o.assis = [e.x, e.z];
        if (o.assis) { const [x, z] = o.assis; o.cadre([x + 0.45, 15.2, z + 2.15], [x, 14.62, z + 0.2], 60); o.M().cadre.entier = true; }
        else o.cadre([I.x - 2.2, 15.4, I.z + 3.2], [I.x + 0.3, 15.6, I.z - 1.2], 45);
      },
    },
    // le sanctuaire de neige (かまくら神社) : sous le torii rouge, le voyageur va vers sa porte
    'iy-torii': {
      duree: 3.4,
      preparer(o) { o.placer(0, -371.5, 0, -381, { compagnon: false }); o.compagnon(1.4, -372, PI); },
      debut(o) { o.jeu.marcher([[0, -371.5], [0, -378.6]], 1.3); },
      chaque(t, dt, o) { o.cadre(...o.chemin([[0, [0.4, 15.5, -368.6], [0, 15.4, -381], 50], [3.4, [0.3, 15.45, -369.6], [0, 15.4, -381], 48]], t)); },
    },
    // la prière, dedans : la pièce dans le tronc, les mains jointes (le tampon かまくら神社) ; le voyageur 60 cm avant le point de l'action
    'iy-priere': {
      duree: 7,
      preparer(o) { const I = o.inter('offrande'); o.placer(I.x, I.z + 0.6, I.vers[0], I.vers[1], { compagnon: false }); o.compagnon(0.8, -376.2, PI); },
      quand: [[0.2, (o) => o.agir('offrande')]],
      chaque(t, dt, o) { o.lire(t, { delai: 0.3 }); o.cadre([-1.5, 15.7, -378.9], [0.9, 14.95, -382.7], 60); },
    },
    // la nuit au village : les kamakura allumés ; la porte de l'un d'eux, sa table et sa marmite (comme le vrai plan)
    'iy-nuit': {
      duree: 4.4,
      async preparer(o) { o.placer(4, -322, 4, -340, { compagnon: false }); o.compagnon(5, -321, PI); await o.nuitTout(true); },
      chaque(t, dt, o) { o.cadre(...o.chemin([[0, [-9.5, 15.6, -324.6], [-9.5, 14.9, -331], 50], [4.4, [-7.5, 15.7, -325.0], [-12.5, 14.9, -331], 50]], t)); },
    },
    // le grand tengu (奈良澤大天狗) qui danse dans son cercle, la nuit, sa torche de plus de deux mètres ; la caméra devant lui, hors du cercle
    'iy-tengu': {
      duree: 5.4,
      async preparer(o) { o.placer(-2, -22, -2, -30, { compagnon: false }); o.compagnon(-3, -22, PI); await o.nuitTout(true); },
      chaque(t, dt, o) {
        const T = o.M().lieu.animes.find((a) => a.tenue && a.tenue.pose === 'torche'), S = T.S;
        const a = S.t * 0.34 + 1.65;
        if (!o.v) o.v = { a, x: S.x, z: S.z };
        const k = Math.min(1, dt * 2.5);
        o.v.a += (a - o.v.a) * k; o.v.x += (S.x - o.v.x) * k; o.v.z += (S.z - o.v.z) * k;
        o.cadre([13.6 + Math.cos(o.v.a) * 7.8, 5.5, -31.5 + Math.sin(o.v.a) * 7.8], [o.v.x, 6.6, o.v.z], 64);
      },
    },
    // le masque du grand tengu (les cinq tampons) : le voyageur devant son cercle, la nuit ; un nuage, et le voilà masqué
    'iy-masque': {
      duree: 5.2,
      async preparer(o) { o.placer(13.6, -24.5, 13.6, -20, { compagnon: false }); o.compagnon(15.0, -24.2, 0); await o.nuitTout(true); },
      quand: [[2.0, (o) => o.jeu.nuage(e.x, e.y + 1.05, e.z, 1.3)], [2.12, (o) => { o.M().joueur.porter('yeux', 'tengu'); o.M().joueur.saluer(); }]],
      chaque(t, dt, o) { o.cadre([14.4, 5.3, -21.3], [13.9, 5.15, -24.5], 44); },
    },
    // le secret, montré sans être résolu : le grand tengu donne une flamme ; on la porte vers le haut du château (rien ne s'y allume)
    'iy-flamme': {
      duree: 21,
      async preparer(o) { o.placer(13.6, -24.6, 13.6, -31.5, { compagnon: false }); o.compagnon(15, -24.2, PI); await o.nuitTout(true); },
      quand: [[0.3, (o) => o.agir('tengu')]],
      chaque(t, dt, o) {
        o.lire(t, { delai: 0.25 });
        if (!o.monte && t >= 16 && o.jeu.aDansSac('torche') && e.mode === 'jeu') {
          o.monte = true; o.placer(39.0, -69.6, 31.5, -81.5, { compagnon: false }); o.compagnon(41, -68, PI);
          o.jeu.marcher([[39.0, -69.6], [31.5, -81.5], [28, -84], [25.6, -88.6]], 1.25);
        }
        if (o.monte) {
          if (!o.d) o.d = [Math.sin(e.cap), Math.cos(e.cap)];
          const k = Math.min(1, dt * 2); o.d[0] += (Math.sin(e.cap) - o.d[0]) * k; o.d[1] += (Math.cos(e.cap) - o.d[1]) * k;
          const [dx, dz] = o.d;
          // (de trois quarts et d'un peu plus bas : la flamme sur le ciel, et le visage à côté de la torche, pas derrière)
          o.cadre([e.x + dx * 2.6 - dz * 2.0, e.y + 0.95, e.z + dz * 2.6 + dx * 2.0], [e.x, e.y + 1.55, e.z], 48);
        } else o.cadre([13.6, 5.6, -21.0], [13.6, 5.4, -30], 50);
      },
    },
    // la fin : le village des kamakura la nuit, de haut, ses lanternes de neige
    'iy-fin': {
      duree: 7,
      async preparer(o) { o.placer(0, -318, 0, -340, { compagnon: false }); o.compagnon(1, -318, PI); await o.nuitTout(true); },
      chaque(t, dt, o) { o.cadre(...o.chemin([[0, [0, 24, -303], [0, 14, -338], 55], [7, [0, 27, -299], [0, 14, -338], 55]], t)); },
    },
  };

  /**
   * L'étal de Sumi (le premier chevalet du lieu, ou le second : autre) : o.E = { Q, y, R(u, v) → [x, z], sumi : [x, z], vue(u, v, h, cu, cv, ch)
   * → [[x, y, z], [x, y, z]] }, et loin(cote) : le voyageur et son compagnon à 10 m de l'étal, derrière la caméra (cote +1 : devant la
   * toile, pour une caméra devant elle ; −1 : derrière, pour une caméra derrière la toile).
   */
  O.etal = (autre = false) => {
    const L = M().lieu, Q = autre ? L.peintre.autre : L.peintre, c = Math.cos(Q.cap), s = Math.sin(Q.cap);
    const R = (u, v) => [Q.x + u * c + v * s, Q.z - u * s + v * c];
    const y = Q.y ?? L.monde.hauteur(Q.x, Q.z);
    const E = {
      Q, y, R, sumi: R(0.47, 0.62),
      vue: (u, v, h, cu, cv, ch) => { const [x0, z0] = R(u, v), [x1, z1] = R(cu, cv); return [[x0, y + h, z0], [x1, y + ch, z1]]; },
      loin(cote) {
        const [x, z] = R(3, 10 * cote), [x1, z1] = R(3, 12 * cote);
        O.placer(x, z, x1, z1, { compagnon: false });
        O.compagnon(...R(4.5, 10 * cote), Q.cap);
        return E;
      },
    };
    O.E = E;
    return E;
  };

  // ---------------------------------------------------------------- le déroulé
  const prise = PRISES[window.__PRISE];
  if (!prise) throw new Error('prise inconnue : ' + window.__PRISE);
  let debutFilm = null, avant = 0;
  const faits = new Set();
  const t = () => (debutFilm === null ? 0 : (performance.now() - debutFilm) / 1000);
  function boucle() {
    const tf = t(), dt = Math.max(0, tf - avant);
    avant = tf;
    for (const [tq, fn] of prise.quand || []) if (tf >= tq && !faits.has(tq)) { faits.add(tq); fn(O); }
    prise.chaque?.(tf, dt, O);
    if (tf < prise.duree + 0.5) requestAnimationFrame(boucle);
    else O.lacher();
  }
  window.__film = {
    duree: prise.duree,
    preparer: async () => { await prise.preparer?.(O); },
    demarrer() {
      debutFilm = performance.now();
      avant = 0;
      prise.debut?.(O);
      prise.chaque?.(0, 0, O);
      requestAnimationFrame(boucle);
    },
    t,
  };
})();
