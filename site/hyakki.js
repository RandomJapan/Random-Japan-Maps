// ================================================================
//  Le Hyakki Yagyō, le défilé nocturne des cent démons (halloween.js, 2026-10-20). Le propriétaire a choisi cette
//  idée parmi les exemples, en demandant « mieux que des images qui se baladent » : chaque yōkai est dessiné de
//  profil et marche vraiment (jambes, bras, queue, langue : halloween.css), sur un chemin courbe posé sur le
//  relief, qui traverse l'écran d'un bord à l'autre. Ombres au sol, lumière des lanternes la nuit, brume qui
//  traîne, feux de renard qui flottent. Un appui sur l'un d'eux ouvre une bulle qui raconte le Hyakki Yagyō.
//  Comme les grues (oiseaux.js), le chemin est sur la carte : déplacer, tourner ou zoomer emporte le cortège.
//  Il passe tout seul la nuit (au Japon, ou avec l'interrupteur), de près, toutes les deux ou trois minutes ;
//  le panneau d'Halloween le fait passer tout de suite.
// ================================================================

import { DEFILE } from './halloween-dessins.js';

const ZOOM_DEFILE = 8.4; // comme les grues : de plus loin, on ne verrait que des points
const PREMIER = [5, 12]; // secondes après être arrivé de près, la nuit
const ENTRE = [100, 200]; // secondes entre deux défilés (60 à 120 le 31 octobre)
const ENTRE_31 = [60, 120];
const VITESSE = 34; // pixels par seconde à l'écran au départ (un pas de promenade)
const TAILLE = 64; // largeur d'un yōkai au zoom 10 ; ×1,41 par cran de zoom
const TAILLE_LIMITES = [40, 112];
const hasard = (a, b) => a + Math.random() * (b - a);
// En qualité très légère, les gestes (jambes, bras, queue…) avancent par petits sauts, 15 fois par seconde, comme
// un dessin animé : chaque geste fait redessiner tout le yōkai (SVG) au navigateur, et neuf yōkai redessinés à
// chaque image lui coûtaient plus que la carte entière (2026-10-24). Le cortège, lui, glisse toujours à chaque image.
const SAUT_GESTES = 1000 / 15;

// Le cortège, de la tête à la queue : son dessin, sa taille relative, la durée d'un pas, sa lumière (la nuit,
// autour d'une lanterne), sa brume, ses feux de renard [gauche, haut, retard, bleu]
const CORTEGE = [
  { nom: 'chochin', pas: 0.6, lumiere: true, feux: [[-30, 10, 0, true], [92, 30, 1.6, false]] },
  { nom: 'renard', pas: 0.52, lumiere: true, feux: [[96, -10, 0.8, false], [-26, 34, 2.2, true]] },
  { nom: 'kasa', pas: 0.55, brume: true },
  { nom: 'tanuki', pas: 0.5 },
  { nom: 'kappa', pas: 0.46, brume: true, feux: [[80, 6, 1.2, true]] },
  { nom: 'oni', pas: 0.62, echelle: 1.14 },
  { nom: 'tengu', pas: 0.56, brume: true },
  { nom: 'rokurokubi', pas: 0.58, echelle: 1.12, feux: [[-20, 20, 0.4, false]] },
  { nom: 'zori', pas: 0.5, echelle: 0.72, brume: true },
];

/**
 * outils : { textes() → { titre, second, lieu, texte, aria }, popup(lngLat, contenu, decalage) }
 * Renvoie { lancer(), finir(), arreter(), enCours() }.
 */
export function brancherDefile(map, maplibregl, outils) {
  const conteneur = map.getCanvasContainer();
  const sansMouvement = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const calque = document.createElement('div');
  calque.className = 'defile-yokai';
  calque.hidden = true;
  // sous les épingles, au-dessus du relief et du papier vieilli (comme les grues)
  const papier = document.getElementById('papier');
  conteneur.insertBefore(calque, papier?.parentNode === conteneur ? papier.nextSibling : conteneur.firstChild);

  const membres = CORTEGE.map((c) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'membre';
    el.style.setProperty('--pas', `${c.pas}s`);
    el.innerHTML = (c.brume ? '<span class="brume"></span>' : '') + (c.lumiere ? '<span class="lumiere"></span>' : '')
      + `<span class="sens lg">${DEFILE[c.nom]}</span>`
      + (c.feux || []).map(([x, y, d, bleu]) => `<span class="feu${bleu ? ' bleu' : ''}" style="left:${x}%;top:${y}%;animation-delay:-${d}s"></span>`).join('');
    el.addEventListener('click', (e) => {
      e.stopPropagation(); // sinon la carte reçoit l'appui et referme la bulle aussitôt
      bulle(el.dataset.lng, el.dataset.lat);
    });
    calque.append(el);
    return { ...c, el, dessin: {} };
  });

  let defile = null; // { A, Q, B (Mercator), debut, vitesse et ecart (en fraction du chemin) }
  let dessin = {};

  // Un point de l'écran qui montre bien la carte (pas le ciel) : ses coordonnées Mercator
  function surLaCarte(x, y) {
    const ll = map.unproject([x, y]);
    const q = map.project(ll);
    if (Math.hypot(q.x - x, q.y - y) > 4) return null;
    return maplibregl.MercatorCoordinate.fromLngLat(ll);
  }
  const point = ({ A, Q, B }, s) => {
    const u = 1 - s;
    return new maplibregl.MercatorCoordinate(u * u * A.x + 2 * u * s * Q.x + s * s * B.x, u * u * A.y + 2 * u * s * Q.y + s * s * B.y);
  };
  const taille = () => Math.round(Math.min(TAILLE_LIMITES[1], Math.max(TAILLE_LIMITES[0], TAILLE * 2 ** ((map.getZoom() - 10) * 0.5))));

  /** Un chemin courbe d'un bord de l'écran à l'autre, dans le bas de la vue (le sol, mais au-dessus du cartouche et
   *  des boutons du bas), surtout sur terre. */
  function chemin() {
    const { clientWidth: l, clientHeight: h } = map.getContainer();
    const t = taille();
    let secours = null;
    for (let essai = 0; essai < 24; essai++) {
      const versDroite = Math.random() < 0.5;
      const ya = h * hasard(0.5, 0.78), yb = h * hasard(0.5, 0.78);
      const A = surLaCarte(versDroite ? -t : l + t, ya), B = surLaCarte(versDroite ? l + t : -t, yb);
      const yc = Math.min(h * 0.8, Math.max(h * 0.36, (ya + yb) / 2 + (Math.random() < 0.5 ? -1 : 1) * h * hasard(0.06, 0.16)));
      const C = surLaCarte(l / 2 + hasard(-0.15, 0.15) * l, yc);
      if (!A || !B || !C) continue;
      // la courbe passe par C à mi-chemin
      const c = { A, B, Q: { x: 2 * C.x - (A.x + B.x) / 2, y: 2 * C.y - (A.y + B.y) / 2 } };
      let terre = 0, pixels = 0, avant = null;
      for (let i = 0; i <= 24; i++) {
        const ll = point(c, i / 24).toLngLat();
        if ((map.queryTerrainElevation(ll) || 0) > 1) terre++;
        const p = map.project(ll);
        if (avant) pixels += Math.hypot(p.x - avant.x, p.y - avant.y);
        avant = p;
      }
      c.pixels = pixels;
      if (terre >= 18) return c; // des yōkai qui marchent sur la mer, ce serait étrange
      secours ??= c;
    }
    return secours;
  }

  /** Fait passer le cortège maintenant ; false s'il n'y a pas de chemin (le ciel, rien que la mer…). */
  function lancer() {
    if (defile || sansMouvement) return false;
    const c = chemin();
    if (!c) return false;
    const t = taille();
    defile = { ...c, debut: performance.now(), vitesse: VITESSE / c.pixels, ecart: (t * 0.98) / c.pixels };
    dessin = {};
    for (const m of membres) { m.dessin = {}; m.gestes = null; m.el.hidden = true; }
    calque.hidden = false;
    requestAnimationFrame(image);
    return true;
  }

  function finir() {
    if (!defile) return;
    defile = null;
    calque.hidden = true;
  }

  function image() {
    if (!defile) return;
    const s0 = ((performance.now() - defile.debut) / 1000) * defile.vitesse;
    const fin = 1 + (membres.length - 1) * defile.ecart;
    if (s0 > fin) return finir();
    requestAnimationFrame(image);
    const maintenant = performance.now(), leger = document.body.classList.contains('qualite-tres-legere');
    const t = taille();
    if (t !== dessin.taille) { calque.style.setProperty('--taille', `${t}px`); dessin.taille = t; }
    membres.forEach((m, k) => {
      const s = s0 - k * defile.ecart;
      const visible = s > 0 && s < 1;
      if (visible === m.el.hidden) m.el.hidden = !visible;
      if (!visible) { m.gestes = null; return; } // caché, ses animations CSS s'arrêtent : elles repartiront
      gestes(m, maintenant, leger);
      const merc = point(defile, s), ll = merc.toLngLat(), p = map.project(ll);
      const q = map.project(point(defile, Math.min(1, s + 0.01)).toLngLat());
      const gauche = q.x < p.x;
      // il entre et sort en fondu, au bord de l'écran
      const fondu = Math.min(1, s / 0.04, (1 - s) / 0.04).toFixed(2);
      const echelle = m.echelle || 1;
      const forme = `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px)${echelle !== 1 ? ` scale(${echelle})` : ''}`;
      const d = m.dessin;
      if (forme !== d.forme) { m.el.style.transform = forme; d.forme = forme; }
      if (gauche !== d.gauche) { m.el.classList.toggle('gauche', gauche); d.gauche = gauche; }
      if (fondu !== d.fondu) { m.el.style.opacity = fondu; d.fondu = fondu; }
      const z = Math.round(p.y / 4);
      if (z !== d.z) { m.el.style.zIndex = z; d.z = z; }
      m.el.dataset.lng = ll.lng;
      m.el.dataset.lat = ll.lat;
    });
  }

  /** Les gestes d'un yōkai en très légère : ses animations SVG arrêtées, avancées d'un saut tous les SAUT_GESTES. */
  function gestes(m, maintenant, leger) {
    if (!leger) {
      if (m.gestes) { for (const a of m.gestes.anims) a.play(); m.gestes = null; }
      return;
    }
    if (!m.gestes) {
      const anims = m.el.getAnimations({ subtree: true }).filter((a) => a.effect?.target instanceof SVGElement);
      for (const a of anims) a.pause();
      m.gestes = { anims, depart: anims.map((a) => a.currentTime || 0), t0: maintenant, saut: 0 };
      return;
    }
    const g = m.gestes, saut = Math.floor((maintenant - g.t0) / SAUT_GESTES);
    if (saut === g.saut) return;
    g.saut = saut;
    g.anims.forEach((a, i) => { a.currentTime = g.depart[i] + saut * SAUT_GESTES; });
  }

  function bulle(lng, lat) {
    const x = outils.textes();
    const div = document.createElement('div');
    const titre = document.createElement('h3');
    titre.className = 'bulle-titre';
    titre.textContent = x.titre;
    const second = document.createElement('p');
    second.className = 'bulle-second';
    second.textContent = x.second;
    const lieu = document.createElement('p');
    lieu.className = 'bulle-lieu';
    lieu.textContent = x.lieu;
    const texte = document.createElement('p');
    texte.className = 'bulle-texte';
    texte.textContent = x.texte;
    div.append(titre, second, lieu, texte);
    outils.popup([+lng, +lat], div, Math.round(taille() * 0.95));
  }

  function majTextes() {
    for (const m of membres) m.el.setAttribute('aria-label', outils.textes().aria);
  }
  majTextes();

  // Tout seul : la nuit, de près, de temps en temps (pas pendant un plongeon, une partie ou une visite)
  let prochain = Infinity;
  const maintenant = () => performance.now() / 1000;
  const minuterie = setInterval(() => {
    const pres = map.getZoom() >= ZOOM_DEFILE;
    const nuit = document.body.classList.contains('nuit');
    if (!pres || !nuit) { prochain = Infinity; return; }
    if (prochain === Infinity) prochain = maintenant() + hasard(...PREMIER);
    if (defile || document.hidden || maintenant() < prochain) return;
    if (['plongeon', 'en-jeu', 'en-visite'].some((c) => document.body.classList.contains(c))) return;
    const le31 = new Date().getMonth() === 9 && new Date().getDate() === 31;
    prochain = maintenant() + (lancer() ? hasard(...(le31 ? ENTRE_31 : ENTRE)) : 4);
  }, 1000);
  // de loin, le cortège s'en va (comme les grues)
  const majZoom = () => { if (map.getZoom() < ZOOM_DEFILE - 0.6) finir(); };
  map.on('zoom', majZoom);

  return {
    lancer,
    finir,
    enCours: () => !!defile,
    majTextes,
    /** Pour de bon (fin de l'événement) : plus rien ne passe. */
    arreter() {
      finir();
      clearInterval(minuterie);
      map.off('zoom', majZoom);
      calque.remove();
    },
    ZOOM_DEFILE,
  };
}
