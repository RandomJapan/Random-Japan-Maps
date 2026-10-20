// ================================================================
//  La finesse du dessin selon la puissance de l'appareil (2026-10-19).
//  Sur un PC portable ordinaire (vers 500 €), le propriétaire a vu la carte saccader en zoomant et en se déplaçant.
//  Ces portables dessinent avec une puce graphique intégrée au processeur, 20 à 50 fois moins puissante que la
//  carte graphique de jeu de son PC, sur laquelle tous les essais d'avant étaient faits. Trois niveaux :
//  - « fine » : tout, comme avant ;
//  - « légère » : un peu moins de pixels (×0,8, jamais moins d'un par point d'écran), des textures du relief deux
//    fois plus petites, un maillage du relief un peu moins fin de loin, pas de lissage des bords (au chargement
//    suivant : il se choisit à la création de la carte) et la houle redessinée 10 fois par seconde au lieu de 15 ;
//  - « très légère » : en plus, une image plus petite agrandie (×0,6), le maillage d'origine de MapLibre, la houle
//    6 fois par seconde, et ni ressac, ni bateaux, ni grues, ni particules, ni petites animations des légendes.
//  Le niveau de départ est celui retenu à la visite précédente ; sinon il est deviné d'après le nom de la puce
//  graphique (intégrée : « légère » ; dessinée par le processeur : « très légère »). Ensuite la carte mesure son
//  rythme d'images pendant qu'elle bouge et descend d'un cran quand l'appareil peine ; tout à fait à l'aise, elle
//  remonte d'un cran (une fois par visite). Le visiteur ne voit rien ; en mode développeur, le bouton « Fluidité »
//  montre les mesures et permet d'imposer un niveau.
//  Net à l'arrêt : le propriétaire voulait la qualité de « fine » sans les saccades. Ces niveaux allègent donc
//  seulement les images du mouvement ; dès que la carte s'arrête (REPOS), toute l'image se redessine plus fine
//  d'un coup (en « légère », un peu plus de pixels que l'écran, ce qui lisse aussi les bords), puis les textures
//  du relief se refont à la taille de leur tuile à l'écran (2 048 px près de la caméra, 1 024 au loin), cachées,
//  et se montrent toutes ensemble. Une texture fine se garde en mouvement : seules les nouvelles tuiles se
//  dessinent en petit.
// ================================================================

export const NIVEAUX = ['fine', 'legere', 'tres-legere'];
const MEMO = 'qualite'; // localStorage : { niveau, impose, puce, echec: { niveau, quand } }
const FENETRE = 90; // écarts entre deux images de mouvement, par jugement (1,5 s à 60 images/s)
const LENT = 25; // ms : une médiane au-delà (moins de 40 images/s) deux fois de suite, l'appareil peine…
const TRES_LENT = 50; // … une seule fois suffit au-delà de celle-ci (moins de 20 images/s)
const AISE = 18; // ms : en dessous (60 images/s), il est à l'aise…
const GPU_AISE = 6; // … si sa carte graphique a de la marge (ms par image, quand le navigateur sait le mesurer)
const SACCADE = 50; // ms : une image qui se fait attendre
// ms après le branchement : la carte finit de charger ses premières tuiles, rien à voir avec le rythme des
// mouvements (2026-10-19 : un portable Iris Xe, jugé trop tôt, était descendu jusqu'à « très légère » ; « légère »
// lui donne 56 images/s)
const ATTENTE = 6000;
const OUBLI_ECHEC = 30 * 24 * 3600e3; // un niveau trop lourd pour cet appareil n'est pas retenté avant 30 jours
const LOGICIEL = /swiftshader|llvmpipe|softpipe|software|basic render/i;
const REPOS = 300; // ms sans mouvement : l'image redevient fine, et ses textures du relief se refont plus fines…
const ENTRE_AFFINAGES = 40; // … une toutes les 40 ms au plus (sur un portable, peut-être 70 ms chacune), cachées
const AFFINAGES = 80; // textures refaites au plus par arrêt (sécurité contre une boucle)

const ratioEcran = () => Math.min(window.devicePixelRatio || 1, 2);

/**
 * Ce que change chaque niveau. finesse : pixels par point d'écran pendant les mouvements, finesseRepos à l'arrêt ;
 * texture : côté des textures du relief des tuiles dessinées pendant un mouvement, textureRepos à l'arrêt.
 */
export function reglagesDe(niveau) {
  const pr = ratioEcran();
  if (niveau === 'tres-legere') {
    return { finesse: Math.min(pr, Math.max(0.75, pr * 0.6)), finesseRepos: pr, texture: 1024, textureRepos: 1024, maillage: 128, lissage: false, houle: 6, ressac: false, decor: false };
  }
  if (niveau === 'legere') {
    const finesse = Math.min(pr, Math.max(1, pr * 0.8));
    // à l'arrêt, ×1,5 (au plus 2) : l'image réduite à l'écran a les bords lisses, sans le lissage de « fine »
    return { finesse, finesseRepos: Math.max(pr, Math.min(2, pr * 1.5)), texture: finesse >= 1.4 ? 1536 : 1024, textureRepos: 2048, maillage: 180, lissage: false, houle: 10, ressac: true, decor: true };
  }
  // comme avant : le lissage des bords pour les écrans d'ordinateur, les téléphones (×2) n'en ont pas besoin
  return { finesse: pr, finesseRepos: pr, texture: 2048, textureRepos: 2048, maillage: 240, lissage: pr < 2, houle: 15, ressac: true, decor: true };
}

function lire() {
  try { return JSON.parse(localStorage.getItem(MEMO)) || {}; } catch { return {}; }
}
function ecrire(m) {
  try { localStorage.setItem(MEMO, JSON.stringify(m)); } catch { /* pas grave */ }
}
const valable = (n) => NIVEAUX.includes(n);

/**
 * Avant de créer la carte : le niveau retenu, et ses réglages (le lissage des bords ne se choisit qu'à la création).
 * À la première visite, le niveau est deviné d'après la puce graphique, lue sur une petite toile jetable : sans
 * cela, un portable gardait le lissage des bords (coûteux pour lui) jusqu'à sa deuxième visite.
 */
export function niveauDeDepart() {
  const m = lire();
  let niveau = valable(m.impose) ? m.impose : valable(m.niveau) ? m.niveau : null;
  if (!niveau) {
    try {
      const gl = document.createElement('canvas').getContext('webgl2');
      niveau = gl ? deviner(nomPuce(gl)) : 'fine';
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch { niveau = 'fine'; }
  }
  return { niveau, ...reglagesDe(niveau) };
}

/** Le nom de la puce graphique (« ANGLE (Intel, Intel(R) UHD Graphics 620 …) »), ou ''. */
function nomPuce(gl) {
  try {
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    return String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || '');
  } catch { return ''; }
}

/** Première visite : une puce intégrée au processeur (Intel, AMD sans « RX ») part en « légère ». */
function deviner(puce) {
  if (LOGICIEL.test(puce)) return 'tres-legere';
  if (/intel/i.test(puce) && !/\barc\b/i.test(puce)) return 'legere';
  if (/radeon/i.test(puce) && !/\brx\s?\d|radeon pro|firepro/i.test(puce)) return 'legere';
  return 'fine';
}

const mediane = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};
const garder = (liste, x, n = 120) => { liste.push(x); if (liste.length > n) liste.shift(); };

/**
 * outils : { maillage(n), mer({ imagesParSeconde, ressac, bateaux }), t, afficherMessage, avant (élément devant
 * lequel mettre le bouton du mode développeur) }.
 * Renvoie { niveau(), plein(oui) } : plein(true) remet tout en « fine » le temps d'un film ou d'une image à partager.
 */
export function brancherQualite(map, outils) {
  const memo = lire();
  const gl = map.painter?.context?.gl;
  const puce = gl ? nomPuce(gl) : '';
  let impose = valable(memo.impose) ? memo.impose : null;
  let niveau = impose || (memo.puce === puce && valable(memo.niveau) ? memo.niveau : deviner(puce));
  let plein = false;
  let descendu = false, monte = false, aiseDeSuite = 0, lentDeSuite = 0;
  const debut = performance.now();
  const fenetre = { ecarts: [], gpu: [] }; // la fenêtre en cours de jugement
  const recents = { ecarts: [], gpu: [] }; // les dernières images en mouvement, pour le panneau
  let dernier = 0; // le dernier « move » (ms)

  function retenir() {
    const m = lire();
    m.niveau = niveau;
    m.puce = puce;
    if (impose) m.impose = impose; else delete m.impose;
    ecrire(m);
  }

  // ---- Net à l'arrêt. Rouages internes de MapLibre 6.11 (à revoir en cas de mise à jour) : changer la finesse
  // sans map.setPixelRatio, qui annonce un mouvement (movestart, moveend) et arrête un geste en cours ; la taille
  // des textures du relief (renderToTexture.rttSize, 1 024 × 2 = 2 048 px), que MapLibre sait mélanger : chaque
  // tuile garde la sienne (Tile.acquireRTT, la réserve de textures du peintre les remet à la taille) ; et la
  // texture montrée pour chaque tuile (RenderToTexture.getTexture, lu seulement par drawTerrain).
  const dynamique = typeof map._resizeCanvas === 'function' && typeof map._containerDimensions === 'function'
    && typeof map.painter?.resize === 'function';
  let etat = null; // l'image en cours : { r (les réglages), calme (la carte ne bouge pas), arret (calme depuis REPOS) }
  let texturesBranchees = false;
  let affinages = 0, dernierAffinage = 0, faites = 0, relance = null, attendDepuis = 0, pret = false;
  // À l'arrêt, les textures refaites (par nous, plus fines, ou par MapLibre : tuile du relief arrivée, zoom
  // changé…) ne se montrent pas une à une : chaque tuile garde l'ancienne à l'écran, et toutes passent aux
  // nouvelles dans la même image (montrerTout). Une par une, on les voyait s'affiner carré par carré, comme un
  // chargement (2026-10-20).
  const anciennes = new Map(); // tuile → ses textures d'avant, montrées jusqu'à ce que tout soit refait

  function finesse(pr) {
    if (Math.abs(map.getPixelRatio() - pr) < 0.01) return;
    map._overridePixelRatio = pr;
    const [l, h] = map._containerDimensions();
    const p = map._getClampedPixelRatio?.(l, h) ?? pr; // (au plus la taille de toile permise)
    map._resizeCanvas(l, h, p);
    map.painter.resize(l, h, p);
  }

  /**
   * Le côté de texture qu'il faut à une tuile du relief : son plus grand bord à l'écran, en pixels de l'image fine
   * de l'arrêt (un peu agrandie, cela ne se voit pas), entre min et max. De loin, les tuiles sont petites à
   * l'écran : une texture de 2 048 px ne s'y verrait pas, et coûterait quatre fois celle de 1 024.
   */
  function taillePour(tuile, min, max, finesseFine) {
    const tr = map._camera?.transform;
    const c = tuile.tileID?.canonical;
    if (!tr?._coordinateClipPoint || !tr._pixelMatrix || !c) return max;
    const n = 2 ** c.z, decalage = tuile.tileID.wrap || 0;
    const coins = [];
    for (const [dx, dy] of [[0, 0], [1, 0], [1, 1], [0, 1]]) {
      const p = tr._coordinateClipPoint({ x: (c.x + dx) / n + decalage, y: (c.y + dy) / n }, 0, tr._pixelMatrix);
      if (!(p[3] > 0)) return max; // le bord passe derrière la caméra : la tuile est tout près
      coins.push([p[0] / p[3], p[1] / p[3]]);
    }
    let bord = 0;
    for (let i = 0; i < 4; i++) bord = Math.max(bord, Math.hypot(coins[i][0] - coins[(i + 1) % 4][0], coins[i][1] - coins[(i + 1) % 4][1]));
    const besoin = (bord * finesseFine) / 1.25;
    return Math.max(min, [1024, 1536, 2048].find((t) => t >= besoin && t <= max) ?? max);
  }

  /** La taille des textures d'une tuile : celle du mouvement (légère), ou, carte immobile, celle de sa taille à l'écran. */
  function texturePour(tuile, proposee) {
    const r = etat?.r;
    if (!r || r.texture === r.textureRepos) return proposee;
    return etat.calme ? taillePour(tuile, r.texture, r.textureRepos, r.finesseRepos) : r.texture;
  }

  /** Toutes les tuiles passent à leurs nouvelles textures dans la même image ; les anciennes retournent à la réserve. */
  function montrerTout() {
    for (const textures of anciennes.values()) for (const o of textures) if (o) map.painter.releaseRTT(o);
    anciennes.clear();
    pret = false;
  }

  /** Une fois : la taille de chaque texture, et les anciennes gardées à l'écran pendant qu'on refait les autres. */
  function brancherTextures() {
    if (texturesBranchees) return;
    const tuile = map.terrain?.tileManager?.getRenderableTiles?.()[0];
    const proto = tuile && Object.getPrototypeOf(tuile);
    const rtt = map.painter?.renderToTexture;
    if (!proto || !rtt) return;
    texturesBranchees = true;
    const prendre = proto.acquireRTT, rendre = proto.releaseRTT, montrer = rtt.getTexture;
    if (typeof prendre !== 'function' || typeof rendre !== 'function' || typeof montrer !== 'function') return;
    proto.acquireRTT = function (painter, pile, taille) {
      faites++;
      return prendre.call(this, painter, pile, texturePour(this, taille));
    };
    proto.releaseRTT = function (painter) {
      // carte immobile : la tuile sera redessinée, mais on garde ses textures pour les montrer en attendant
      if (etat?.calme && !plein && this.rttObjects?.length && !anciennes.has(this)) {
        if (!anciennes.size) attendDepuis = performance.now();
        anciennes.set(this, this.rttObjects.slice());
        pret = false;
        this.rttObjects.length = 0;
        return;
      }
      return rendre.call(this, painter);
    };
    rtt.getTexture = function (t) {
      const garde = anciennes.get(t)?.[this._stacks.length - 1];
      return garde ? garde.texture : montrer.call(this, t);
    };
    // la réserve rend sa dernière texture libre, remise à la taille demandée (une nouvelle allocation) : on lui
    // fait rendre plutôt une texture qui a déjà la bonne taille
    const peintre = map.painter, puiser = peintre.acquireRTT;
    if (typeof puiser !== 'function' || !Array.isArray(peintre._rttObjectRecyclePool)) return;
    peintre.acquireRTT = function (taille) {
      const reserve = this._rttObjectRecyclePool;
      const i = reserve.findLastIndex((o) => o.size === taille);
      if (i >= 0 && i < reserve.length - 1) reserve.push(reserve.splice(i, 1)[0]);
      return puiser.call(this, taille);
    };
  }

  /** À l'arrêt : une tuile (la plus proche de la caméra) dont les textures sont plus petites que voulu, à refaire. */
  function affinerUneTuile() {
    if (affinages >= AFFINAGES) return false;
    if (performance.now() - dernierAffinage < ENTRE_AFFINAGES) return true; // (à l'image suivante)
    for (const tuile of map.terrain?.tileManager?.getRenderableTiles?.() || []) {
      const voulue = texturePour(tuile, 0);
      if (!tuile?.rttObjects?.some((o) => o && o.size < voulue)) continue;
      tuile.releaseRTT(map.painter); // MapLibre la redessine dans cette image (montrée avec les autres, à la fin)
      affinages++;
      dernierAffinage = performance.now();
      return true;
    }
    return false;
  }

  /**
   * Avant chaque image : léger pendant un mouvement, fin à l'arrêt. Dès que la carte ne bouge plus, les textures se
   * refont, cachées ; à l'arrêt (REPOS), l'image devient fine et les montre dans la même image, d'un seul coup.
   * Vrai s'il reste des textures à refaire.
   */
  function regler(bouge) {
    const r = reglagesDe(plein ? 'fine' : niveau);
    const calme = !bouge && !plein;
    const arret = plein || (calme && performance.now() - dernier >= REPOS);
    etat = { r, calme, arret };
    if (!calme) { affinages = 0; montrerTout(); } // en mouvement : les dernières textures, tout de suite
    else if (arret && pret) montrerTout();
    // pendant un film, enregistrement.js règle lui-même la finesse
    if (dynamique && !plein) finesse(arret ? r.finesseRepos : r.finesse);
    const rtt = map.painter?.renderToTexture;
    if (!rtt) return false;
    rtt.rttSize = r.texture; // (en « légère », chaque tuile a la sienne : texturePour)
    brancherTextures();
    return calme && affinerUneTuile();
  }
  /** Une image de plus, un peu plus tard (la texture suivante, ou montrer celles qui sont prêtes). */
  function relancer(ms = ENTRE_AFFINAGES) {
    clearTimeout(relance);
    relance = setTimeout(() => { relance = null; map.triggerRepaint(); }, ms);
  }
  /** Après chaque image : quand plus rien n'est à refaire, les nouvelles textures sont prêtes à se montrer. */
  function apres(encore) {
    if (!anciennes.size && !encore) return;
    const enCours = encore || faites > 0 || map.painter?.renderToTexture?.needsFollowUpFrame;
    // (au plus 4 s d'attente : si MapLibre redessinait sans cesse, les nouvelles textures finiraient par se montrer)
    const tropLong = anciennes.size && performance.now() - attendDepuis > 4000;
    if (tropLong) { montrerTout(); relancer(0); return; }
    pret = !enCours;
    if (!pret) relancer();
    else if (etat?.arret) relancer(0); // l'image suivante les montre
    else relancer(Math.max(0, REPOS - (performance.now() - dernier)) + 10); // avec la finesse de l'arrêt
  }
  // l'arrêt confirmé, une image pour affiner (au loin, la houle redessine de toute façon)
  let calmeMinuterie = null;
  map.on('moveend', () => {
    clearTimeout(calmeMinuterie);
    calmeMinuterie = setTimeout(() => map.triggerRepaint(), REPOS + 30);
  });

  function appliquer() {
    const r = reglagesDe(plein ? 'fine' : niveau);
    // pendant un film, enregistrement.js règle lui-même la finesse ; sinon regler() s'en charge à chaque image
    if (!plein && !dynamique && Math.abs(map.getPixelRatio() - r.finesse) > 0.01) map.setPixelRatio(r.finesse);
    map.triggerRepaint();
    outils.maillage?.(r.maillage);
    outils.mer?.({ imagesParSeconde: r.houle, ressac: r.ressac, bateaux: r.decor });
    // grues, particules et animations des légendes (oiseaux.js, style.css) ; changé rarement : tout se restyle
    const leger = !r.decor;
    if (document.body.classList.contains('qualite-tres-legere') !== leger) document.body.classList.toggle('qualite-tres-legere', leger);
  }

  function changer(n, pourquoi) {
    if (n === niveau) return;
    niveau = n;
    retenir();
    appliquer();
    // seulement en mode développeur : le visiteur, lui, ne voit rien
    if (document.body.classList.contains('mode-dev')) outils.afficherMessage?.(outils.t('qualiteChange', outils.t(`qualite_${n}`), pourquoi));
    majPanneau();
  }

  function juger() {
    const ecarts = fenetre.ecarts.splice(0);
    const gpus = fenetre.gpu.splice(0);
    if (plein || impose) return;
    const med = mediane(ecarts);
    const saccades = ecarts.filter((e) => e > SACCADE).length / ecarts.length;
    const gpu = gpus.length >= 20 ? mediane(gpus) : null;
    // En économie d'énergie, les navigateurs limitent à 30 images/s : des écarts réguliers de 33 ms ne disent rien
    // de la carte (sauf si la carte graphique, elle, est vraiment chargée).
    const plafond = ecarts.filter((e) => e > 30 && e < 37).length / ecarts.length > 0.7 && (gpu === null || gpu < 12);
    // deux fenêtres lentes de suite (une rafale de tuiles qui arrivent ne suffit pas), ou une seule très lente
    const lente = (med > LENT && !plafond) || saccades > 0.12;
    lentDeSuite = lente ? lentDeSuite + 1 : 0;
    const peine = lente && (lentDeSuite >= 2 || (med > TRES_LENT && !plafond));
    const aise = med < AISE && saccades < 0.02 && (gpu === null || gpu < GPU_AISE);
    const i = NIVEAUX.indexOf(niveau);
    const fps = Math.round(1000 / med);
    if (peine) {
      aiseDeSuite = 0;
      lentDeSuite = 0;
      if (i >= NIVEAUX.length - 1) return;
      if (monte) { // le niveau d'où l'on vient de remonter était bien trop lourd : on s'en souvient
        const m = lire();
        m.echec = { niveau, quand: Date.now() };
        ecrire(m);
      }
      descendu = true;
      changer(NIVEAUX[i + 1], fps);
    } else if (aise && !descendu && !monte && i > 0) {
      if (++aiseDeSuite < 3) return;
      const vise = NIVEAUX[i - 1];
      const echec = lire().echec;
      if (echec?.niveau === vise && Date.now() - echec.quand < OUBLI_ECHEC) return;
      monte = true;
      changer(vise, fps);
    } else {
      aiseDeSuite = 0;
    }
  }

  // Le rythme d'images : l'écart entre deux « move » de suite (un par image pendant un mouvement, qu'il vienne
  // d'un geste, d'un vol ou de la rotation du départ). Plus de 250 ms : c'est un nouveau mouvement, sauf au milieu
  // d'un vol ou d'un glissé (un appareil vraiment lent).
  let enVol = false;
  map.on('move', () => {
    const t = performance.now();
    const e = t - dernier;
    const suite = e <= 250 || (enVol && e < 1500);
    dernier = t;
    enVol = map.isMoving();
    if (e < 4 || !suite || document.hidden || t - debut < ATTENTE) return;
    if (document.body.classList.contains('enregistre')) return; // le film avance avec sa propre horloge
    fenetre.ecarts.push(e);
    garder(recents.ecarts, e);
    if (fenetre.ecarts.length >= FENETRE) juger();
  });

  // Le temps passé par la carte graphique sur chaque image, si le navigateur sait le chronométrer (Chrome, Edge).
  // Les résultats arrivent quelques images plus tard.
  let chrono = gl?.getExtension?.('EXT_disjoint_timer_query_webgl2');
  if (typeof gl?.createQuery !== 'function') chrono = null;
  const libres = [], attente = [];
  function chronometrer(rendu, painter, args) {
    while (attente.length && gl.getQueryParameter(attente[0].q, gl.QUERY_RESULT_AVAILABLE)) {
      const x = attente.shift();
      const ms = gl.getQueryParameter(x.q, gl.QUERY_RESULT) / 1e6;
      libres.push(x.q);
      // (pas de lecture de GPU_DISJOINT_EXT : elle peut faire attendre la carte graphique ; la médiane suffit)
      if (x.bouge) {
        fenetre.gpu.push(ms);
        garder(recents.gpu, ms);
      }
    }
    if (attente.length > 6) return rendu.apply(painter, args); // la carte graphique est très en retard : on n'empile pas
    const q = libres.pop() || gl.createQuery();
    gl.beginQuery(chrono.TIME_ELAPSED_EXT, q);
    try {
      return rendu.apply(painter, args);
    } finally {
      gl.endQuery(chrono.TIME_ELAPSED_EXT);
      attente.push({ q, bouge: performance.now() - dernier < 100 });
    }
  }

  if (typeof map.painter?.render === 'function') {
    const rendu = map.painter.render;
    map.painter.render = function (style, options) {
      const encore = regler(!!options?.moving);
      faites = 0;
      try {
        return chrono ? chronometrer(rendu, this, arguments) : rendu.apply(this, arguments);
      } finally {
        apres(encore);
      }
    };
  }

  // ---- Le bouton « Fluidité » (mode développeur) : les mesures, et imposer un niveau
  const bouton = document.createElement('button');
  bouton.type = 'button';
  bouton.className = 'panneau btn-qualite dev';
  bouton.setAttribute('aria-expanded', 'false');
  bouton.title = outils.t('qualiteBouton');
  bouton.setAttribute('aria-label', outils.t('qualiteBouton'));
  bouton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M4.5 17a8 8 0 1 1 15 0"/><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="m12 14.5 4-5"/><circle cx="12" cy="14.5" r="1.6" fill="currentColor"/></svg>';
  const panneau = document.createElement('div');
  panneau.className = 'panneau panneau-qualite dev';
  panneau.hidden = true;
  outils.avant?.before(bouton, panneau);
  let minuterie = null;

  function majPanneau() {
    bouton.classList.toggle('impose', !!impose);
    if (panneau.hidden) return;
    const t = outils.t;
    const ecarts = recents.ecarts, gpus = recents.gpu;
    const mesures = ecarts.length >= 20
      ? `${t('qualiteImages', Math.round(1000 / mediane(ecarts)))}${gpus.length >= 10 ? ` · ${t('qualiteGpu', mediane(gpus).toFixed(1))}` : ''}`
      : t('qualiteAttente');
    const choix = ['auto', ...NIVEAUX].map((n) => {
      const actif = n === 'auto' ? !impose : impose === n;
      return `<button type="button" data-niveau="${n}" aria-pressed="${actif}">${t(n === 'auto' ? 'qualiteAuto' : `qualite_${n}`)}</button>`;
    }).join('');
    const r = reglagesDe(niveau);
    const x = (v) => String(Math.round(v * 100) / 100);
    const repos = dynamique && r.finesseRepos !== r.finesse ? `<p class="qualite-note">${t('qualiteRepos', x(r.finesse), x(r.finesseRepos))}</p>` : '';
    panneau.innerHTML = `<p class="reglage-titre">${t('qualiteTitre')}</p>
      <p class="qualite-puce">${puce.replace(/[<>&]/g, '') || '?'}</p>
      <p class="qualite-mesures">${mesures}</p>
      <div class="qualite-choix">${choix}</div>
      <p class="qualite-etat">${t('qualiteEtat', t(`qualite_${niveau}`), !impose)}</p>
      ${repos}
      <p class="qualite-note">${t('qualiteLissage')}</p>`;
  }

  bouton.addEventListener('click', () => {
    panneau.hidden = !panneau.hidden;
    bouton.setAttribute('aria-expanded', String(!panneau.hidden));
    clearInterval(minuterie);
    if (!panneau.hidden) minuterie = setInterval(majPanneau, 1000);
    majPanneau();
  });
  panneau.addEventListener('click', (e) => {
    const n = e.target.closest('[data-niveau]')?.dataset.niveau;
    if (!n) return;
    impose = n === 'auto' ? null : n;
    descendu = monte = false;
    aiseDeSuite = lentDeSuite = 0;
    fenetre.ecarts.length = fenetre.gpu.length = 0;
    if (impose && impose !== niveau) changer(impose);
    else { retenir(); majPanneau(); }
  });

  retenir();
  appliquer();
  majPanneau();

  return {
    niveau: () => niveau,
    /** Tout en « fine » le temps d'un film ou d'une capture (la mesure s'arrête), puis le niveau d'avant. */
    plein(oui) {
      plein = !!oui;
      fenetre.ecarts.length = fenetre.gpu.length = 0;
      appliquer();
    },
  };
}
