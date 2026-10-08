// ================================================================
//  Les grues du Japon (tanchō) : de temps en temps, quand on regarde la carte de près, un petit vol de
//  trois grues traverse l'écran, avec son ombre sur le relief. Elles volent dans le ciel de l'écran (pas
//  attachées à un endroit de la carte) : rien à recalculer à chaque image, seulement des animations CSS.
//  De loin, pas d'oiseaux. Rien ne vole si l'appareil demande moins d'animations.
// ================================================================

const ZOOM_OISEAUX = 8.4; // en dessous, on est trop loin pour voir des oiseaux
const PREMIER_VOL = 6; // secondes après être arrivé assez près
const ENTRE_VOLS = [40, 75]; // secondes entre deux vols
const VITESSE = 80; // pixels par seconde

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

// Les trois grues en file (décalage en unités de la taille d'une grue) et le décalage de leurs battements
const FILE = [[0, 0, 0], [-1.3, 0.4, -0.45], [-2.65, 0.1, -0.9]];

let volerMaintenant = null;

/** Fait passer un vol de grues tout de suite (sert aux essais). */
export function faireVoler() {
  volerMaintenant?.();
}

/** Branche les grues sur la carte : leur ciel se glisse juste au-dessus du papier vieilli, sous les épingles. */
export function brancherOiseaux(map) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ciel = document.createElement('div');
  ciel.className = 'ciel';
  ciel.setAttribute('aria-hidden', 'true');
  const papier = document.getElementById('papier');
  if (papier?.parentNode === map.getCanvasContainer()) papier.after(ciel);
  else map.getCanvasContainer().append(ciel);

  let pres = null; // assez zoomé pour voir des oiseaux
  let prochain = Infinity; // heure (secondes) du prochain vol
  let enVol = null;
  const maintenant = () => performance.now() / 1000;
  const entre = ([a, b]) => a + Math.random() * (b - a);

  function majZoom() {
    const p = map.getZoom() >= ZOOM_OISEAUX;
    if (p === pres) return;
    pres = p;
    ciel.classList.toggle('loin', !p); // de loin, le vol en cours s'efface
    if (p) prochain = Math.max(prochain === Infinity ? 0 : prochain, maintenant() + PREMIER_VOL);
  }
  map.on('zoom', majZoom);
  majZoom();

  function voler() {
    const l = ciel.clientWidth, h = ciel.clientHeight;
    if (!l || !h) return;
    const taille = l < 600 ? 50 : 64; // largeur d'une grue à l'écran
    const versDroite = Math.random() < 0.5;
    // de bas en haut en traversant : elles s'éloignent dans la carte penchée (elles rapetissent un peu)
    const y0 = h * (0.42 + Math.random() * 0.3), y1 = y0 - h * (0.12 + Math.random() * 0.2);
    // la grue de tête entre juste au bord, les deux autres suivent ; à la fin, la dernière est sortie
    const x0 = versDroite ? -taille * 1.2 : l + taille * 1.2, x1 = versDroite ? l + taille * 3.8 : -taille * 3.8;
    const cap = (Math.atan2(y1 - y0, Math.abs(x1 - x0)) * 180) / Math.PI;
    const duree = Math.max(9, Math.hypot(x1 - x0, y1 - y0) / VITESSE);
    const vol = document.createElement('div');
    vol.className = 'vol-grues';
    vol.style.cssText = `--x0:${x0}px;--y0:${y0}px;--x1:${x1}px;--y1:${y1}px;--duree:${duree.toFixed(1)}s;--taille:${taille}px`;
    // l'ombre des grues tombe plus bas, sur le relief
    const grues = FILE.map(([dx, dy, d]) => `<div class="grue" style="left:${dx * taille}px;top:${dy * taille}px;--d:${d}s">${GRUE}</div>`).join('');
    const ombres = FILE.map(([dx, dy, d]) => `<div class="grue ombre-grue" style="left:${dx * taille}px;top:${dy * taille + taille}px;--d:${d}s">${GRUE}</div>`).join('');
    vol.innerHTML = `<div class="formation" style="transform:scale(${versDroite ? 1 : -1},1) rotate(${cap.toFixed(1)}deg)">${ombres}${grues}</div>`;
    vol.addEventListener('animationend', (e) => {
      if (e.target !== vol) return;
      vol.remove();
      if (enVol === vol) enVol = null;
    });
    ciel.append(vol);
    enVol = vol;
  }
  volerMaintenant = voler;

  // Pas besoin d'une horloge à chaque image : on regarde toutes les 2 secondes s'il est l'heure d'un vol
  setInterval(() => {
    if (!pres || enVol || document.hidden || maintenant() < prochain) return;
    if (document.body.classList.contains('plongeon') || document.body.classList.contains('en-jeu')) return;
    voler();
    prochain = maintenant() + entre(ENTRE_VOLS);
  }, 2000);
}
