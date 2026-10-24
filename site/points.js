// ================================================================
//  Les points des lieux, de loin, dessinés ensemble sur une toile (2026-10-24).
//  Dans la vue de loin (sous ZOOM_POINTS), chaque lieu est un petit point. C'étaient ~135 repères HTML que
//  MapLibre replace à chaque image (altitude, style, mise en couches du navigateur, pour chacun). Sur le portable
//  du propriétaire (Intel Iris Xe), une fois la carte graphique soulagée (textures-relief.js), le processeur
//  restait le frein : 22 à 28 images/s pour 5 à 11 ms de carte graphique. Mesuré ici (processeur ralenti ×3, le
//  parcours de nuit de sa vidéo) : ces repères coûtaient ~6 ms sur ~20 par image ; une seule toile, ~1 ms.
//  reperes.js choisit les lieux dessinés ici (ceux qui en ont l'option, dans la vue de loin, sans état
//  particulier : voir PARTICULIERS) ; leur dessin reprend celui des points HTML (style.css, « Vue lointaine ») :
//  la couleur de la catégorie vieillie, la bordure de papier, l'anneau d'encre et l'ombre, la lueur la nuit,
//  l'anneau rouge des favoris, pâlis hors saison ou pendant un itinéraire, à 35 % derrière le relief.
//  Toucher un point ouvre son lieu (le clic de son repère) ; à la souris, le point survolé redevient un repère
//  HTML, qui montre son nom.
// ================================================================

const PAPIER = '#f6eedb'; // --papier-clair
const ROUGE = '#a8321f'; // --rouge
const ENCRE = 'rgba(53, 37, 26, 0.8)';
const OMBRE = 'rgba(40, 26, 12, 0.45)';
const LUEUR = 'rgba(255, 176, 80, 0.6)';
const BRUN = [0x4a, 0x35, 0x21]; // color-mix(in oklab, couleur 78 %, #4a3521) : les couleurs vieillies vers la sépia
const R = 5.5; // rayon du point (11 px, bordure comprise)
const BORD = 1.5;
const DEMI = 18; // demi-côté d'une vignette : le point, son anneau, son ombre ou sa lueur
const TOUCHE = 15.5; // rayon de la zone à toucher, comme celle des points HTML (::after, 31 px)
const COUVERT = 0.35; // opacité d'un point caché par le relief (opacityWhenCovered des repères)
const VERIFIER_COUVERTS = 100; // ms entre deux tests « caché par le relief » d'un même point (comme MapLibre)

// ---- Les couleurs : le mélange dans l'espace OKLab de color-mix, et le grayscale(.7) des lieux hors saison
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
function versOklab([r, g, b]) {
  const R_ = lin(r / 255), G = lin(g / 255), B = lin(b / 255);
  const l = Math.cbrt(0.4122214708 * R_ + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R_ + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R_ + 0.2817188376 * G + 0.6299787005 * B);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
function depuisOklab([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s]
    .map((c) => Math.round(255 * Math.min(1, Math.max(0, gamma(c)))));
}
let sonde = null;
/** Une couleur CSS du tableau (#hex, nom, rgb…) en [r, g, b, a]. */
function lireCouleur(c) {
  sonde ||= document.createElement('canvas').getContext('2d');
  sonde.fillStyle = '#000';
  sonde.fillStyle = c || '#a8321f';
  const v = sonde.fillStyle;
  if (v[0] === '#') return [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16)).concat(1);
  const n = v.match(/[\d.]+/g)?.map(Number) || [168, 50, 31, 1];
  return [n[0], n[1], n[2], n[3] ?? 1];
}
function vieillie(c) {
  const [r, g, b] = lireCouleur(c);
  const x = versOklab([r, g, b]), y = versOklab(BRUN);
  return depuisOklab(x.map((v, i) => v * 0.78 + y[i] * 0.22));
}
function gris([r, g, b, a = 1], quantite) {
  const s = 1 - quantite;
  return [
    (0.2126 + 0.7874 * s) * r + (0.7152 - 0.7152 * s) * g + (0.0722 - 0.0722 * s) * b,
    (0.2126 - 0.2126 * s) * r + (0.7152 + 0.2848 * s) * g + (0.0722 - 0.0722 * s) * b,
    (0.2126 - 0.2126 * s) * r + (0.7152 - 0.7152 * s) * g + (0.0722 + 0.9278 * s) * b,
    a,
  ];
}
const css = ([r, g, b, a = 1]) => `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;

/**
 * liste() : les points à dessiner, du nord au sud (ceux du sud devant), chacun { repere, el } ;
 * survol(point | null) : la souris s'approche d'un point (ou s'en va) ; ouvrir(point) : on l'a touché.
 * Renvoie { sale(), fluide(oui), survole(el) } : sale() après un changement (liste, classe, nuit…).
 */
export function creerPoints(map, { liste, survol, ouvrir }) {
  const conteneur = map.getCanvasContainer(), cadre = map.getContainer();
  const toile = document.createElement('canvas');
  toile.className = 'points-lieux';
  toile.setAttribute('aria-hidden', 'true');
  const ctx = toile.getContext('2d');
  const vignettes = new Map();
  let dpr = 0, largeur = 0, hauteur = 0, boite = null, aMesurer = true;
  let places = []; // ce qui est dessiné : [x, y, point], du fond vers l'avant
  let vide = true, demande = 0, fluide = false, survole = null;

  /** La vignette d'un point : ses ombres, son anneau, sa bordure et sa couleur, à la finesse de l'écran. */
  function vignette(couleur, favori, nuit, pale) {
    const cle = `${couleur}|${favori}|${nuit}|${pale}|${dpr}`;
    let v = vignettes.get(cle);
    if (v) return v;
    v = document.createElement('canvas');
    v.width = v.height = Math.ceil(2 * DEMI * dpr);
    const g = v.getContext('2d');
    g.scale(dpr, dpr);
    const teinte = (c) => css(pale ? gris(c, 0.7) : c);
    const disque = (r, c) => { g.fillStyle = c; g.beginPath(); g.arc(DEMI, DEMI, r, 0, 2 * Math.PI); g.fill(); };
    // une ombre floue (box-shadow) : seule l'ombre d'un disque posé hors de la vignette y tombe
    const ombre = (r, dy, flou, c) => {
      g.save();
      g.shadowColor = c; g.shadowBlur = flou * dpr; g.shadowOffsetX = 1000 * dpr; g.shadowOffsetY = dy * dpr;
      g.fillStyle = '#000';
      g.beginPath(); g.arc(DEMI - 1000, DEMI, r, 0, 2 * Math.PI); g.fill();
      g.restore();
    };
    // box-shadow : la dernière dessous ; puis la bordure de papier et la couleur
    if (favori) {
      ombre(R, 1, 3, teinte(lireCouleur(OMBRE)));
      disque(R + 1.5, teinte(lireCouleur(ROUGE)));
    } else if (nuit) {
      ombre(R + 2, 0, 7, teinte(lireCouleur(LUEUR)));
      disque(R + 1, teinte(lireCouleur(ENCRE)));
    } else {
      ombre(R, 1, 3, teinte(lireCouleur(OMBRE)));
      disque(R + 1, teinte(lireCouleur(ENCRE)));
    }
    disque(R, teinte(lireCouleur(PAPIER)));
    disque(R - BORD, teinte(vieillie(couleur).concat(1)));
    vignettes.set(cle, v);
    return v;
  }

  /** La taille de la carte, lue seulement après un changement de taille (la lire à chaque image forçait le navigateur
   *  à recalculer la page au milieu de l'image). */
  function mesurer() {
    const d = window.devicePixelRatio || 1;
    if (!aMesurer && d === dpr) return;
    aMesurer = false;
    const l = cadre.clientWidth, h = cadre.clientHeight; // (le conteneur de la toile de MapLibre n'a pas de hauteur)
    if (d === dpr && l === largeur && h === hauteur) return;
    if (d !== dpr) vignettes.clear();
    dpr = d; largeur = l; hauteur = h;
    toile.width = Math.round(l * d);
    toile.height = Math.round(h * d);
    toile.style.width = `${l}px`;
    toile.style.height = `${h}px`;
  }

  /** Caché par le relief ? Le test des repères de MapLibre 6.11 (_isCovered), pour le centre du point. */
  function couvert(p, ll, tr, relief) {
    try {
      const h = relief.getElevationForLngLat(ll, tr);
      const leve = (Math.max(0, -p.repere.getOffset().y) / tr.pixelsPerMeter) * Math.sin((map.getPitch() * Math.PI) / 180);
      return tr.isLocationOccluded(ll, relief, h + leve);
    } catch {
      return false;
    }
  }

  function dessiner(e) {
    demande = 0;
    const points = liste();
    if (!points.length) {
      if (!vide) { ctx.clearRect(0, 0, toile.width, toile.height); vide = true; places = []; }
      return;
    }
    // sous les repères HTML (MapLibre les ajoute à la fin), au-dessus de ce qui est posé juste après le papier
    if (!toile.isConnected) conteneur.insertBefore(toile, conteneur.querySelector(':scope > .repere, :scope > .ville'));
    mesurer();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, toile.width, toile.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    vide = false;
    const corps = document.body.classList;
    const nuit = corps.contains('nuit'), itineraire = corps.contains('avec-itineraire');
    // comme MapLibre : au pixel près à l'arrêt (net), à la fraction de pixel en mouvement (sans sautiller)
    const arrondir = !fluide && e?.type !== 'move';
    const tr = map._camera?.transform, relief = map.terrain;
    const t0 = performance.now();
    let tests = e?.type === 'move' ? 30 : Infinity; // en mouvement, quelques tests « caché » par image
    places = [];
    for (const p of points) {
      const ll = p.repere.getLngLat(), o = p.repere.getOffset();
      const q = map.project(ll);
      let x = q.x + o.x, y = q.y + o.y;
      if (x < -DEMI || y < -DEMI || x > largeur + DEMI || y > hauteur + DEMI) continue;
      if (arrondir) { x = Math.round(x); y = Math.round(y); }
      if (relief && tr && x >= 0 && y >= 0 && x <= largeur && y <= hauteur && tests > 0 && t0 - (p.verifie || 0) >= VERIFIER_COUVERTS) {
        p.couvert = couvert(p, ll, tr, relief);
        p.verifie = t0;
        tests--;
      }
      const c = p.el.classList;
      const pale = c.contains('hors-saison');
      ctx.globalAlpha = (itineraire ? 0.5 : pale ? 0.2 : c.contains('toute-annee') ? 0.55 : 1) * (p.couvert ? COUVERT : 1);
      ctx.drawImage(vignette(p.el.style.getPropertyValue('--c'), c.contains('favori'), nuit, pale), x - DEMI, y - DEMI, 2 * DEMI, 2 * DEMI);
      places.push([x, y, p]);
    }
    ctx.globalAlpha = 1;
  }

  /** Le point sous (x, y) (px de la carte), celui de devant d'abord. */
  function cible(x, y) {
    for (let i = places.length - 1; i >= 0; i--) {
      const [px, py, p] = places[i];
      if ((px - x) ** 2 + (py - y) ** 2 <= TOUCHE * TOUCHE) return p;
    }
    return null;
  }
  const position = (e) => {
    boite ||= conteneur.getBoundingClientRect();
    return [e.clientX - boite.left, e.clientY - boite.top];
  };

  const remesurer = () => { aMesurer = true; boite = null; };
  map.on('resize', remesurer);
  window.addEventListener('resize', remesurer);
  for (const ev of ['move', 'moveend', 'terrain', 'idle', 'resize']) map.on(ev, dessiner);

  // Toucher un point ouvre son lieu ; pendant une visite guidée, un appui ne fait que rappeler la barre (comme
  // les repères, sans pointer-events). En capture sur le conteneur de la carte : MapLibre ne voit pas ce clic.
  map.getContainer().addEventListener('click', (e) => {
    if (!places.length || e.target !== map.getCanvas() || document.body.classList.contains('en-visite')) return;
    const p = cible(...position(e));
    if (!p) return;
    e.stopPropagation();
    ouvrir(p);
  }, true);

  // À la souris : le point survolé redevient un repère HTML (son nom, la main du pointeur, son clic)
  conteneur.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || e.buttons) return;
    if (survole?.contains(e.target)) return; // toujours sur le repère survolé
    const p = places.length ? cible(...position(e)) : null;
    if ((p?.el || null) !== survole) survol(p);
  }, { passive: true });
  conteneur.addEventListener('pointerleave', () => { if (survole) survol(null); });

  return {
    sale() { if (!demande) demande = requestAnimationFrame(() => dessiner()); },
    fluide(oui) { fluide = oui; },
    /** L'élément du repère survolé (redevenu HTML), ou null. */
    survole(el) { survole = el; },
  };
}
