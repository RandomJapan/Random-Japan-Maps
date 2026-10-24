// ================================================================
//  Les lieux dessinés ensemble sur une toile (2026-10-24) : de loin des points, plus près des épingles.
//  Chaque lieu était un repère HTML que MapLibre replace à chaque image (altitude, style, mise en couches du
//  navigateur, puis le compositeur et la carte graphique, pour chacun). Sur le portable du propriétaire (Intel Iris
//  Xe), une fois la carte graphique soulagée (textures-relief.js), le processeur restait le frein :
//  - de loin, 22 à 28 images/s pour 5 à 11 ms de carte graphique ; mesuré ici (processeur ralenti ×3, le parcours de
//    nuit de sa vidéo), les ~135 points coûtaient ~6 ms sur ~20 par image, une seule toile ~1 ms. Chez lui ensuite :
//    60 images/s ;
//  - à mi-distance (zoom ≈ 7,6, ses captures du soir même) 17 images/s, 55 ms de processeur par image ; mesuré ici
//    (÷4, sa vue), les épingles HTML coûtaient un quart du travail du fil principal et 40 % de celui du compositeur.
//  reperes.js choisit les lieux dessinés ici (ceux qui en ont l'option, sans état particulier : voir PARTICULIERS) ;
//  leur dessin reprend celui des repères HTML (style.css) : de loin (« Vue lointaine ») la couleur de la catégorie
//  vieillie, la bordure de papier, l'anneau d'encre et l'ombre, la lueur la nuit, l'anneau rouge des favoris ; plus
//  près, le blason (les mêmes, à la taille --t), sa pointe d'encre, l'icône de la catégorie, le cœur des favoris et
//  le chapeau de sorcière d'Halloween ; pâlis hors saison ou pendant un itinéraire, à 35 % derrière le relief.
//  Toucher un lieu l'ouvre (le clic de son repère) ; à la souris, le lieu survolé redevient un repère HTML, qui
//  montre son nom.
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

// Les épingles (style.css, « Repères ») : un blason de 32 px × --t, bordé de 2 px de papier, posé 8 px × --t au-dessus
// de son point, une pointe d'encre de 10 × 7 px dessous ; le cœur des favoris (15 px) en haut à gauche ; le chapeau
// d'Halloween (halloween.css) penché de 17°.
const ANNEAU = 'rgba(53, 37, 26, 0.75)'; // box-shadow 0 0 0 1px
const OMBRE_BLASON = 'rgba(40, 26, 12, 0.4)'; // 0 3px 7px
const LUEURS_NUIT = [['rgba(255, 150, 50, 0.2)', 7, 22], ['rgba(255, 176, 80, 0.55)', 3, 10]]; // la nuit : couleur, étalement, flou
const POINTE = '#35251a'; // --encre
const MARGE = 32; // ce qui déborde du blason dans sa vignette : la lueur de nuit, l'ombre, la pointe
const PENTE = (-17 * Math.PI) / 180; // le chapeau de sorcière
const OMBRE_CHAPEAU = 'rgba(30, 20, 10, 0.4)'; // drop-shadow(0 1px 1px)

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

/** Un dessin SVG de la page (une icône, le cœur) en image, à la couleur donnée (son currentColor). */
function imageSvg(code, couleur) {
  const im = new Image();
  const tete = code.match(/^<svg[^>]*>/)[0];
  // une taille fixe et l'espace de noms du SVG, qu'une image exige (Chrome redessine le SVG à la taille où on le pose)
  const nouvelle = tete.replace(/\s(width|height|xmlns)="[^"]*"/g, '').replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"');
  im.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(code.replace(tete, nouvelle).replace(/currentColor/g, couleur))}`;
  return im;
}
const prete = (im) => im.complete && im.naturalWidth > 0;

/**
 * liste() : les lieux à dessiner, du nord au sud (ceux du sud devant), chacun { repere, el } ;
 * survol(lieu | null) : la souris s'approche d'un lieu (ou s'en va) ; ouvrir(lieu) : on l'a touché ;
 * charge() : une image attendue (icône, chapeau) est arrivée : des lieux peuvent maintenant être dessinés.
 * Renvoie { sale(), fluide(oui), survole(el), regler({ loin, taille }), preparer(lieu), pret(lieu) } : sale() après un
 * changement (liste, classe, nuit…) ; pret(lieu) : son épingle peut être dessinée (ses images sont là).
 */
export function creerPoints(map, { liste, survol, ouvrir, charge }) {
  const conteneur = map.getCanvasContainer(), cadre = map.getContainer();
  const toile = document.createElement('canvas');
  toile.className = 'points-lieux';
  toile.setAttribute('aria-hidden', 'true');
  const ctx = toile.getContext('2d');
  const vignettes = new Map(); // les points, et les épingles de la taille en cours
  const images = new Map(); // code SVG → image
  let dpr = 0, largeur = 0, hauteur = 0, boite = null, aMesurer = true;
  let loin = true, taille = 1;
  let decalage = null; // [x, y] : où le navigateur pose un repère HTML par rapport à son point (voir sonder)
  let chapeau = null; // l'image du chapeau d'Halloween (false : pas trouvé)
  let places = []; // ce qui est dessiné : [x, y, lieu], du fond vers l'avant
  let vide = true, demande = 0, fluide = false, survole = null, attendues = 0;

  /** L'image d'un code SVG (ou d'une adresse) ; à son arrivée, on prévient (des lieux attendaient peut-être). */
  function image(code, couleur) {
    const cle = `${couleur}|${code}`;
    let im = images.get(cle);
    if (!im) {
      if (couleur) im = imageSvg(code, couleur);
      else { im = new Image(); im.src = code; }
      images.set(cle, im);
      attendues++;
      const fin = () => { if (--attendues === 0) requestAnimationFrame(() => charge?.()); };
      im.decode().then(fin, fin);
    }
    return im;
  }

  /** L'icône d'un lieu ({ cle, image } ou { cle, texte } pour un emoji) et son cœur, lus une fois dans son repère. */
  function dessins(p) {
    if (!p.dessins) {
      const svg = p.el.querySelector('.repere-tete > svg'), emoji = p.el.querySelector('.repere-tete > .emoji');
      const coeur = p.el.querySelector('.repere-coeur > svg');
      p.dessins = {
        icone: svg ? { cle: svg.outerHTML, image: image(svg.outerHTML, PAPIER) } : { cle: emoji?.textContent || '', texte: emoji?.textContent || '' },
        coeur: coeur && image(coeur.outerHTML, ROUGE),
      };
    }
    return p.dessins;
  }

  /**
   * Où le navigateur pose une épingle HTML, et le chapeau d'Halloween. Une épingle (.repere, style.css) est en
   * position relative : MapLibre la place à son point, mais elle reste posée sur la ligne de texte du conteneur de la
   * carte, ~14 px plus bas (ses blasons ont été réglés ainsi, avec les modèles 3D) : on mesure ce décalage sur une
   * épingle témoin, une fois (et après un changement de taille), pour dessiner les nôtres au même endroit. Hors de la
   * vue de loin seulement (de loin, les repères sont centrés, et sans chapeau).
   */
  function sonder() {
    const b = document.createElement('button');
    b.className = 'repere';
    b.style.visibility = 'hidden';
    b.innerHTML = '<span class="repere-tete"></span>';
    conteneur.append(b);
    const r = b.getBoundingClientRect(), c = conteneur.getBoundingClientRect();
    decalage = [r.left - c.left, r.top - c.top];
    if (!chapeau && document.body.classList.contains('halloween')) {
      const url = getComputedStyle(b.firstChild, '::after').backgroundImage.match(/^url\("?(.*?)"?\)$/)?.[1];
      chapeau = url ? image(url) : false;
    }
    b.remove();
  }

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

  // Une vignette d'épingle : son point (là où MapLibre pose le repère) est à (MARGE + 16t, MARGE + 63t) px CSS
  const origine = (t) => [MARGE + 16 * t, MARGE + 63 * t];

  /** La vignette d'une épingle, comme le navigateur dessine le repère HTML (style.css, halloween.css). */
  function epingle(couleur, d, favori, nuit, avecChapeau, pale) {
    const t = taille;
    const cle = `e|${couleur}|${d.icone.cle}|${favori}|${nuit}|${avecChapeau}|${pale}|${t}|${dpr}`;
    let v = vignettes.get(cle);
    if (v) return v;
    const [ox, oy] = origine(t);
    v = document.createElement('canvas');
    v.width = Math.ceil((32 * t + 2 * MARGE) * dpr);
    v.height = Math.ceil((63 * t + 2 * MARGE) * dpr);
    const g = v.getContext('2d');
    g.scale(dpr, dpr);
    g.translate(ox, oy);
    const r = 16 * t, cy = -24 * t; // le blason : 8 px × t au-dessus du point
    const disque = (x, y, rr, c) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, rr, 0, 2 * Math.PI); g.fill(); };
    const ombre = (rr, dy, flou, c) => {
      g.save();
      g.shadowColor = c; g.shadowBlur = flou * dpr; g.shadowOffsetX = 1000 * dpr; g.shadowOffsetY = dy * dpr;
      g.fillStyle = '#000';
      g.beginPath(); g.arc(-1000, cy, rr, 0, 2 * Math.PI); g.fill();
      g.restore();
    };
    // box-shadow : la dernière dessous, l'anneau d'encre dessus
    if (nuit) for (const [c, etale, flou] of LUEURS_NUIT) ombre(r + etale, 0, flou, c);
    else ombre(r, 3, 7, OMBRE_BLASON);
    disque(0, cy, r + 1, ANNEAU);
    disque(0, cy, r, PAPIER);
    disque(0, cy, r - 2, css(vieillie(couleur)));
    // la pointe (::before) : sous le blason, sa base 1 px dans la bordure
    const yp = -8 * t - 1;
    g.fillStyle = POINTE;
    g.beginPath(); g.moveTo(-5, yp); g.lineTo(5, yp); g.lineTo(0, yp + 7); g.closePath(); g.fill();
    // l'icône : 58 % de l'intérieur du blason
    const cote = 0.58 * (32 * t - 4);
    if (d.icone.image) g.drawImage(d.icone.image, -cote / 2, cy - cote / 2, cote, cote);
    else if (d.icone.texte) {
      g.font = `${16 * t}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = PAPIER;
      g.fillText(d.icone.texte, 0, cy);
    }
    // le chapeau (::after) : 30 × 26 px × t, penché autour de son centre, avec sa petite ombre (penchée avec lui)
    if (avecChapeau) {
      g.save();
      g.translate(-6 * t + 2, -46 * t + 2);
      g.rotate(PENTE);
      g.shadowColor = OMBRE_CHAPEAU; g.shadowBlur = dpr;
      g.shadowOffsetX = -Math.sin(PENTE) * dpr; g.shadowOffsetY = Math.cos(PENTE) * dpr;
      g.drawImage(chapeau, -15 * t, -12.75 * t, 30 * t, 25.5 * t); // (contain : l'image fait 40 × 34)
      g.restore();
    }
    // le cœur des favoris : 15 px, en haut à gauche du blason, au-dessus du chapeau
    if (favori && d.coeur) {
      const cx = -r + 3.5, cyc = cy - r + 4.5;
      disque(cx, cyc, 8.5, POINTE);
      disque(cx, cyc, 7.5, PAPIER);
      g.drawImage(d.coeur, cx - 5, cyc - 5, 10, 10);
    }
    // hors saison : grayscale(.7) sur tout le blason
    if (pale) {
      const px = g.getImageData(0, 0, v.width, v.height), a = px.data;
      for (let i = 0; i < a.length; i += 4) {
        const [rr, gg, bb] = gris([a[i], a[i + 1], a[i + 2]], 0.7);
        a[i] = rr; a[i + 1] = gg; a[i + 2] = bb;
      }
      g.putImageData(px, 0, 0);
    }
    vignettes.set(cle, v);
    return v;
  }

  /** La taille de la carte, lue seulement après un changement de taille (la lire à chaque image forçait le navigateur
   *  à recalculer la page au milieu de l'image). */
  function mesurer() {
    const d = window.devicePixelRatio || 1;
    if (!aMesurer && d === dpr) return;
    aMesurer = false;
    decalage = null;
    const l = cadre.clientWidth, h = cadre.clientHeight; // (le conteneur de la toile de MapLibre n'a pas de hauteur)
    if (d === dpr && l === largeur && h === hauteur) return;
    if (d !== dpr) vignettes.clear();
    dpr = d; largeur = l; hauteur = h;
    toile.width = Math.round(l * d);
    toile.height = Math.round(h * d);
    toile.style.width = `${l}px`;
    toile.style.height = `${h}px`;
  }

  /** Caché par le relief ? Le test des repères de MapLibre 6.11 (_isCovered), pour le point du lieu. */
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
    vide = false;
    const corps = document.body.classList;
    const nuit = corps.contains('nuit'), itineraire = corps.contains('avec-itineraire');
    const avecChapeau = !loin && corps.contains('halloween') && !!chapeau && prete(chapeau);
    // comme MapLibre : au pixel près à l'arrêt (net), à la fraction de pixel en mouvement (sans sautiller)
    const arrondir = !fluide && e?.type !== 'move';
    const tr = map._camera?.transform, relief = map.terrain;
    const t0 = performance.now();
    let tests = e?.type === 'move' ? 30 : Infinity; // en mouvement, quelques tests « caché » par image
    if (!loin && !decalage) sonder();
    const t = taille, [ox, oy] = origine(t), [dx, dy] = loin ? [0, 0] : decalage;
    // ce qui dépasse de son point : de loin le point et son ombre ; plus près l'épingle, au-dessus
    const g = loin ? DEMI : ox, haut = loin ? DEMI : oy, bas = loin ? DEMI : MARGE;
    places = [];
    for (const p of points) {
      const ll = p.repere.getLngLat(), o = p.repere.getOffset();
      const q = map.project(ll);
      let x = q.x + o.x, y = q.y + o.y;
      x += dx; y += dy;
      if (x < -g || y < -bas || x > largeur + g || y > hauteur + haut) continue;
      if (arrondir) { x = Math.round(x); y = Math.round(y); }
      if (relief && tr && x >= 0 && y >= 0 && x <= largeur && y <= hauteur + haut && tests > 0 && t0 - (p.verifie || 0) >= VERIFIER_COUVERTS) {
        p.couvert = couvert(p, ll, tr, relief);
        p.verifie = t0;
        tests--;
      }
      const c = p.el.classList;
      const pale = c.contains('hors-saison');
      ctx.globalAlpha = (itineraire ? 0.5 : pale ? 0.2 : c.contains('toute-annee') ? 0.55 : 1) * (p.couvert ? COUVERT : 1);
      const couleur = p.el.style.getPropertyValue('--c');
      if (loin) {
        ctx.drawImage(vignette(couleur, c.contains('favori'), nuit, pale), (x - DEMI) * dpr, (y - DEMI) * dpr, 2 * DEMI * dpr, 2 * DEMI * dpr);
      } else {
        const v = epingle(couleur, dessins(p), c.contains('favori'), nuit, avecChapeau, pale);
        let vx = (x - ox) * dpr, vy = (y - oy) * dpr;
        if (arrondir) { vx = Math.round(vx); vy = Math.round(vy); } // la vignette sur les pixels de l'écran : nette
        ctx.drawImage(v, vx, vy);
      }
      places.push([x, y, p]);
    }
    ctx.globalAlpha = 1;
  }

  /** Le lieu sous (x, y) (px de la carte), celui de devant d'abord. */
  function cible(x, y) {
    const r = 16 * taille + 1;
    for (let i = places.length - 1; i >= 0; i--) {
      const [px, py, p] = places[i];
      if (loin) {
        if ((px - x) ** 2 + (py - y) ** 2 <= TOUCHE * TOUCHE) return p;
        continue;
      }
      // l'épingle : son blason, sa pointe, le cœur d'un favori
      const cy = py - 24 * taille;
      if ((px - x) ** 2 + (cy - y) ** 2 <= r * r) return p;
      if (Math.abs(x - px) <= 5 && y >= py - 8 * taille - 1 && y <= py - 8 * taille + 6) return p;
      if (p.el.classList.contains('favori') && (px - 16 * taille + 3.5 - x) ** 2 + (cy - 16 * taille + 4.5 - y) ** 2 <= 7.5 * 7.5) return p;
    }
    return null;
  }
  const position = (e) => {
    boite ||= conteneur.getBoundingClientRect();
    return [e.clientX - boite.left, e.clientY - boite.top];
  };
  /** Ce qui reçoit le pointeur est-il sous les lieux dessinés (la carte, une légende, un nom…) ? */
  const dessous = (el) => {
    if (el === map.getCanvas()) return true;
    const m = el.closest?.('.maplibregl-marker');
    return !!m && m.parentNode === conteneur && toile.parentNode === conteneur && !!(m.compareDocumentPosition(toile) & Node.DOCUMENT_POSITION_FOLLOWING);
  };

  const remesurer = () => { aMesurer = true; boite = null; };
  map.on('resize', remesurer);
  window.addEventListener('resize', remesurer);
  document.fonts?.ready.then(remesurer); // (la ligne de texte où se posent les épingles HTML)
  for (const ev of ['move', 'moveend', 'terrain', 'idle', 'resize']) map.on(ev, dessiner);

  // Toucher un lieu l'ouvre ; pendant une visite guidée, un appui ne fait que rappeler la barre (comme les repères,
  // sans pointer-events). En capture sur le conteneur de la carte : MapLibre ne voit pas ce clic.
  map.getContainer().addEventListener('click', (e) => {
    if (!places.length || !dessous(e.target) || document.body.classList.contains('en-visite')) return;
    const p = cible(...position(e));
    if (!p) return;
    e.stopPropagation();
    ouvrir(p);
  }, true);

  // À la souris : le lieu survolé redevient un repère HTML (son nom, la main du pointeur, son clic)
  conteneur.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || e.buttons) return;
    if (survole?.contains(e.target)) return; // toujours sur le repère survolé
    const p = places.length && dessous(e.target) ? cible(...position(e)) : null;
    if ((p?.el || null) !== survole) survol(p);
  }, { passive: true });
  conteneur.addEventListener('pointerleave', () => { if (survole) survol(null); });

  return {
    sale() { if (!demande) demande = requestAnimationFrame(() => dessiner()); },
    fluide(oui) { fluide = oui; },
    /** L'élément du repère survolé (redevenu HTML), ou null. */
    survole(el) { survole = el; },
    /** La vue de loin (des points) ou non (des épingles), et la taille des épingles (--t). */
    regler(r) {
      if (r.taille !== undefined) taille = r.taille;
      if (r.loin !== undefined) loin = r.loin;
      if (vignettes.size > 400) vignettes.clear(); // (de quoi tenir toutes celles d'une visite, sans grossir sans fin)
    },
    /** Commence à préparer les images de l'épingle d'un lieu. */
    preparer(p) { dessins(p); },
    /** Son épingle peut-elle être dessinée (icône et chapeau prêts) ? */
    pret(p) {
      const d = dessins(p);
      if (d.icone.image && !prete(d.icone.image)) return false;
      if (d.coeur && !prete(d.coeur)) return false;
      if (document.body.classList.contains('halloween')) {
        if (chapeau === null) sonder();
        if (chapeau && !prete(chapeau)) return false; // (pas de chapeau trouvé : les épingles sans)
      }
      return true;
    },
  };
}
