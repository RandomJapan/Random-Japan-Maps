// ================================================================
//  Les grues du Japon (tanchō) : quand on regarde la carte de près, un petit vol de trois grues passe
//  de temps en temps, au hasard, au-dessus d'un vrai coin de la carte. Leur ombre est posée sur le relief
//  et elles volent au-dessus : si on déplace, tourne ou zoome la carte, elles suivent, comme tout le reste.
//  De loin, pas d'oiseaux. Rien ne vole si l'appareil demande moins d'animations.
// ================================================================

const ZOOM_OISEAUX = 8.4; // en dessous, on est trop loin pour voir des oiseaux
const PREMIER_VOL = [1.5, 5]; // secondes après être arrivé assez près (au hasard)
const ENTRE_VOLS = [25, 60]; // secondes entre deux vols (au hasard)
const VITESSE = 75; // pixels par seconde à l'écran au départ ; ensuite elles volent sur la carte, à vitesse fixe
const TAILLE = 60; // largeur d'une grue à l'écran au zoom 10 (pixels) ; ×1,4 par cran de zoom
const TAILLE_LIMITES = [38, 120];

// Une grue en vol, vers la droite : cou noir tendu, calotte rouge, pattes en arrière, ailes blanches aux
// plumes intérieures noires. Ses ailes battent (.gr-aile).
const GRUE = `<svg viewBox="0 0 80 40" aria-hidden="true">
  <g class="gr-aile gr-loin"><path class="gr-plume" d="M33 19.4C34.2 12 36.4 6 33.6 .6 38.6 3.2 44.4 9.4 46 19Z"/><path class="gr-noir" d="M33 19.4C34.2 12 36.4 6 33.6 .6 35.2 6.2 36.2 12.4 37.6 19.2Z"/></g>
  <path class="gr-trait" d="M24 21.6 6.4 23.8M24.4 22.2 7.4 25.6"/>
  <path class="gr-noir" d="M25.6 18.6C21 18.8 17.6 20.2 15.8 21.6 19 21.8 22.4 22 26 22.8Z"/>
  <path class="gr-plume" d="M24 20.6C27 17.4 37 16.8 44 18.4 47 19 49 19.8 50 20.6 47 22.4 40 23.6 33 23.4 28.6 23.3 25.6 22.4 24 20.6Z"/>
  <path class="gr-cou" d="M48.4 19.8C53 18.8 57 17.4 61 16.6"/>
  <path class="gr-noir" d="M60.2 16.8C60.8 14.8 64.2 14.2 65.6 15.8 66 16.6 65.8 17.4 65.2 17.8 63.8 19 61.2 18.8 60.2 16.8Z"/>
  <path class="gr-bec" d="M65.2 15.9 72.6 16.9 65.2 17.8Z"/>
  <path class="gr-joue" d="M61.4 17.9C62.4 18.5 63.6 18.4 64.4 17.9"/>
  <circle class="gr-calotte" cx="62.6" cy="15.2" r="1.15"/>
  <g class="gr-aile"><path class="gr-plume" d="M30 19.6C31.2 12 33.4 6 30.4 .4 35.6 3 41.4 9.2 43 19.2Z"/><path class="gr-noir" d="M30 19.6C31.2 12 33.4 6 30.4 .4 32 6 33 12.2 34.4 19.4Z"/><path class="gr-trait-fin" d="M33.6 6.4C36.4 9.4 38.4 13 39.6 17.2"/></g>
</svg>`;

// Les trois grues en file : en arrière de la première et sur le côté (en tailles de grue), et le décalage de
// leurs battements d'ailes
const FILE = [[0, 0, 0], [-1.25, 0.42, -0.45], [-2.5, 0.08, -0.9]];

let volerMaintenant = null;

/** Fait passer un vol de grues tout de suite (sert aux essais). */
export function faireVoler() {
  return volerMaintenant?.() ?? false;
}

/**
 * Branche les grues sur la carte. Le vol est un repère (reperes.js) qui avance sur la carte à chaque image,
 * seulement pendant qu'il vole : son point est l'ombre de la grue de tête, posée sur le relief.
 */
export function brancherOiseaux(map, maplibregl, reperes) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const grues = (classe) => FILE.map(([dx, dy, d]) => `<div class="grue ${classe}" style="--dx:${dx};--dy:${dy};--d:${d}s">${GRUE}</div>`).join('');
  const el = document.createElement('div');
  el.className = 'vol-grues';
  el.setAttribute('aria-hidden', 'true');
  // les ombres sur le relief, puis les grues au-dessus ; chaque groupe tourne vers le cap du vol.
  // (Le fondu se fait sur un enfant : MapLibre règle lui-même l'opacité de l'élément du repère.)
  el.innerHTML = `<div class="grues-fondu"><div class="grues-ombres">${grues('ombre-grue')}</div><div class="grues-air"><div class="grues-cap">${grues('')}</div></div></div>`;
  const fonduEl = el.firstElementChild, ombres = fonduEl.firstElementChild, air = fonduEl.lastElementChild, cap = air.firstElementChild;
  const marqueur = new maplibregl.Marker({ element: el, anchor: 'center', opacityWhenCovered: '1' }).setLngLat([138, 35]);
  // juste au-dessus du papier vieilli, sous les épingles
  reperes.suivre(marqueur, { voulu: false, placer: (n) => n.parentNode.insertBefore(n, n.parentNode.querySelector('#papier')?.nextSibling ?? null) });

  let pres = null; // assez zoomé pour voir des oiseaux
  let prochain = Infinity; // heure (secondes) du prochain vol
  let vol = null; // le vol en cours : { A, B (coordonnées Mercator), debut, duree (ms) }
  let dessin = {}; // ce qui est déjà appliqué au repère (pour ne rien toucher qui n'a pas changé)
  const maintenant = () => performance.now() / 1000;
  const entre = ([a, b]) => a + Math.random() * (b - a);

  function majZoom() {
    const p = map.getZoom() >= ZOOM_OISEAUX;
    if (p === pres) return;
    pres = p;
    if (p) prochain = Math.max(prochain === Infinity ? 0 : prochain, maintenant() + entre(PREMIER_VOL));
    else finir(); // de loin, plus d'oiseaux
  }
  map.on('zoom', majZoom);
  majZoom();

  /** Un point de l'écran qui montre bien la carte (pas le ciel au-dessus de l'horizon) : ses coordonnées Mercator. */
  function surLaCarte(x, y) {
    const ll = map.unproject([x, y]);
    const q = map.project(ll);
    if (Math.hypot(q.x - x, q.y - y) > 4) return null;
    return maplibregl.MercatorCoordinate.fromLngLat(ll);
  }

  /** Un vol au hasard : il traverse l'écran d'un bord à l'autre, dans un sens et à une hauteur au hasard. */
  function voler() {
    if (vol || !pres) return false;
    const { clientWidth: l, clientHeight: h } = map.getContainer();
    const taille = tailleGrue();
    for (let essai = 0; essai < 12; essai++) {
      const versDroite = Math.random() < 0.5;
      const marge = taille * 1.5;
      // la grue de tête entre juste au bord ; à la fin, la dernière est sortie de l'autre côté
      const xa = versDroite ? -marge : l + marge, xb = versDroite ? l + marge + taille * 2.5 : -marge - taille * 2.5;
      const A = surLaCarte(xa, h * (0.3 + Math.random() * 0.6));
      const B = surLaCarte(xb, h * (0.25 + Math.random() * 0.6));
      if (!A || !B) continue;
      const pixels = Math.hypot(l + 2 * marge + taille * 2.5, h * 0.3);
      vol = { A, B, debut: performance.now(), duree: Math.max(9, pixels / VITESSE) * 1000 };
      dessin = {};
      reperes.montrer(marqueur, true);
      el.classList.add('vole');
      requestAnimationFrame(image);
      return true;
    }
    return false;
  }
  volerMaintenant = voler;

  function finir() {
    if (!vol) return;
    vol = null;
    el.classList.remove('vole');
    reperes.montrer(marqueur, false);
  }

  const tailleGrue = () => Math.round(Math.min(TAILLE_LIMITES[1], Math.max(TAILLE_LIMITES[0], TAILLE * 2 ** ((map.getZoom() - 10) * 0.5))));

  /** À chaque image du vol : la position sur la carte, le cap vu à l'écran, la taille, la hauteur au-dessus de l'ombre. */
  function image() {
    if (!vol) return;
    const p = (performance.now() - vol.debut) / vol.duree;
    if (p >= 1) return finir();
    requestAnimationFrame(image);
    const { A, B } = vol;
    const x = A.x + (B.x - A.x) * p, y = A.y + (B.y - A.y) * p;
    const ici = new maplibregl.MercatorCoordinate(x, y).toLngLat();
    marqueur.setLngLat(ici);
    reperes.verifier(marqueur);
    // le cap à l'écran : celui du vol sur la carte, moins l'orientation de la carte, aplati par l'inclinaison
    // (calculé ainsi, et non avec deux points projetés : le relief sous eux le faisait trembler)
    const azimut = Math.atan2(B.x - A.x, A.y - B.y) - (map.getBearing() * Math.PI) / 180;
    const angle = Math.round((Math.atan2(-Math.cos(azimut) * Math.cos((map.getPitch() * Math.PI) / 180), Math.sin(azimut)) * 180) / Math.PI);
    // dessinées de profil, elles regardent à droite ou à gauche (retournées) et se penchent au plus de 35° :
    // une grue qui s'éloigne vers le haut de l'écran ne se dresse pas à la verticale
    const gauche = Math.abs(angle) > 90;
    const penche = Math.max(-35, Math.min(35, gauche ? (angle > 0 ? angle - 180 : angle + 180) : angle));
    const tourne = gauche ? `rotate(${penche}deg) scale(-1,1)` : `rotate(${penche}deg)`;
    const taille = tailleGrue();
    // vues de côté (carte penchée), elles volent plus haut au-dessus de leur ombre que vues du dessus
    const hauteur = Math.round(taille * (0.45 + 0.9 * Math.sin((map.getPitch() * Math.PI) / 180)));
    const fondu = Math.min(1, p / 0.06, (1 - p) / 0.06).toFixed(2);
    if (tourne !== dessin.tourne) { ombres.style.transform = cap.style.transform = tourne; dessin.tourne = tourne; }
    if (taille !== dessin.taille) { el.style.setProperty('--taille', `${taille}px`); dessin.taille = taille; }
    if (hauteur !== dessin.hauteur) { air.style.transform = `translateY(${-hauteur}px)`; dessin.hauteur = hauteur; }
    if (fondu !== dessin.fondu) { fonduEl.style.opacity = fondu; dessin.fondu = fondu; }
  }

  // On regarde chaque seconde s'il est l'heure d'un vol (pas d'horloge à chaque image en dehors des vols)
  setInterval(() => {
    if (!pres || vol || document.hidden || maintenant() < prochain) return;
    if (document.body.classList.contains('plongeon') || document.body.classList.contains('en-jeu')) return;
    prochain = maintenant() + (voler() ? entre(ENTRE_VOLS) : 3);
  }, 1000);
}
