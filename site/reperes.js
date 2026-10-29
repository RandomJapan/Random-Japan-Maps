// ================================================================
//  Les repères HTML posés sur la carte (lieux, noms des mers, des régions
//  et des préfectures, légendes, bêtes de la mer) ne restent sur la carte
//  que s'ils sont près de l'écran et censés se voir.
//  Pourquoi : MapLibre replace chaque repère à chaque image. Avec le relief,
//  pour un repère hors de l'écran, il cherche l'altitude en recalculant les
//  tuiles qui couvrent tout l'écran, une fois par repère : zoomé sur une
//  région, c'était ~190 recherches par image, et les téléphones saccadaient.
//  Les lieux sans état particulier ne sont pas des repères HTML mais des
//  points (vue de loin) ou des épingles dessinés ensemble sur une toile (points.js).
// ================================================================

import { creerPoints } from './points.js';

const MARGE = 0.1; // un repère reste sur la carte jusqu'à 10 % de la taille de la vue au-delà de ses bords (penchée, la vue en couvre déjà plus que l'écran)
// un lieu ouvert (son nom), une étape d'itinéraire ou du carrousel d'une ville (son numéro), un nouveau lieu (son
// pouls, son étiquette) : ils gardent leur repère HTML
const PARTICULIERS = ['actif', 'etape', 'carrousel', 'nouveau'];

/**
 * points : false pour garder tous les lieux en repères HTML (les films promo de outils/video, ?points=non).
 * @returns suivre(repère, { voulu, placer, point }) pour confier un repère (pas encore ajouté à la carte ; point :
 *   un lieu, qui peut se dessiner sur la toile de points.js) ;
 *   montrer(repère, voulu, delai) pour le montrer ou le cacher (catégorie décochée, zoom hors de sa plage…),
 *   le retrait pouvant attendre `delai` ms (le temps d'un fondu) ;
 *   verifier(repère) après un setLngLat ; oublier(repère) pour le retirer pour de bon ;
 *   fluide(oui) pendant la rotation douce du départ ; vueLointaine(oui) quand on passe sous ou au-dessus de
 *   ZOOM_POINTS (app.js) ; taille(t) quand la taille des épingles (--t) change.
 */
export function gererReperes(map, { points: avecPoints = true } = {}) {
  const suivis = new Map(); // repère → { repere, el, voulu, placer, point, particulier, sur, dessine, minuterie }
  const parElement = new Map(); // élément d'un lieu → son suivi
  let bornes = null; // [ouest, sud, est, nord], marge comprise
  let fluides = false; // les repères placés à la fraction de pixel près (fluide)
  let loin = false; // la vue de loin (sous ZOOM_POINTS)
  let clavier = false; // on navigue au clavier : tous les lieux en repères HTML, qu'on atteint avec Tab
  let plongee = false; // un plongeon (filmé) : enregistrement.js compose l'image avec les repères HTML
  let survole = null; // le suivi du point sous la souris, redevenu repère HTML
  let dessines = []; // les suivis dessinés sur la toile, dans l'ordre des lieux (du nord au sud)
  let listeChangee = false;
  let observerClasses = null; // (el) => surveille les classes d'un lieu

  function majBornes() {
    const b = map.getBounds();
    const dx = (b.getEast() - b.getWest()) * MARGE;
    const dy = (b.getNorth() - b.getSouth()) * MARGE;
    bornes = [b.getWest() - dx, b.getSouth() - dy, b.getEast() + dx, b.getNorth() + dy];
  }

  // (plus près que la vue de loin : une fois les images de son épingle prêtes)
  const enPoint = (s) => toile && s.point && !clavier && !plongee && !s.particulier && s !== survole && (loin || toile.pret(s));

  function appliquer(repere, s) {
    const { lng, lat } = repere.getLngLat();
    const dedans = s.voulu && lng >= bornes[0] && lng <= bornes[2] && lat >= bornes[1] && lat <= bornes[3];
    const point = dedans && enPoint(s);
    if (point !== s.dessine) {
      s.dessine = point;
      listeChangee = true;
    }
    const doit = dedans && !point;
    if (doit === s.sur) return;
    s.sur = doit;
    if (doit) {
      repere.addTo(map);
      s.placer?.(repere.getElement()); // MapLibre l'ajoute à la fin : on le remet à sa place parmi les autres
    } else {
      repere.remove();
    }
  }

  function tout() {
    majBornes();
    for (const [repere, s] of suivis) appliquer(repere, s);
  }
  map.on('move', tout);
  map.on('resize', tout);

  /** Après un changement (sans mouvement de la carte) : les décisions, puis le dessin des points s'il les touche. */
  function revoir(...lesquels) {
    if (!bornes) majBornes();
    const tous = !lesquels.length;
    let points = tous;
    for (const s of tous ? suivis.values() : lesquels) {
      appliquer(s.repere, s);
      points ||= s.point;
    }
    if (points) toile?.sale();
  }

  function liste() {
    if (listeChangee) {
      listeChangee = false;
      dessines = [...suivis.values()].filter((s) => s.dessine);
    }
    return dessines;
  }

  const toile = avecPoints && typeof document.createElement('canvas').getContext === 'function'
    ? creerPoints(map, {
      liste,
      survol(s) {
        const avant = survole;
        survole = s || null;
        toile.survole(s?.el || null);
        revoir(...[avant, survole].filter(Boolean));
      },
      ouvrir: (s) => s.el.click(), // le clic de son repère (ouvrirLieu)
      charge: () => revoir(), // une icône est arrivée : son épingle peut être dessinée
    })
    : null;

  if (toile) {
    toile.regler({ loin });
    // une classe qui change sur un lieu (ouvert, favori, hors saison…) : repère HTML ou point, et son dessin
    const classes = new MutationObserver((changes) => {
      const vus = new Set();
      for (const c of changes) {
        const s = parElement.get(c.target);
        if (!s || vus.has(s)) continue;
        vus.add(s);
        s.particulier = PARTICULIERS.some((k) => c.target.classList.contains(k));
      }
      revoir(...vus);
    });
    observerClasses = (el) => classes.observe(el, { attributes: true, attributeFilter: ['class'] });
    // la nuit, un itinéraire, un plongeon : sur la page entière
    const page = () => {
      const corps = document.body.classList;
      const p = corps.contains('plongeon');
      if (p === plongee) return false;
      plongee = p;
      return true;
    };
    page();
    new MutationObserver(() => { if (page()) revoir(); else toile.sale(); })
      .observe(document.body, { attributes: true, attributeFilter: ['class'] });
    // au clavier, chaque lieu redevient un repère qu'on peut atteindre (une fois pour toute la visite)
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab' || clavier) return;
      clavier = true;
      revoir();
    });
  }

  return {
    suivre(repere, { voulu = true, placer, point = false } = {}) {
      if (!bornes) majBornes();
      const el = repere.getElement();
      const s = { repere, el, voulu, placer, point: point && !!toile, particulier: false, sur: false, dessine: false, minuterie: null };
      if (s.point) {
        s.particulier = PARTICULIERS.some((k) => el.classList.contains(k));
        parElement.set(el, s);
        observerClasses(el);
        toile.preparer(s); // (ses images, d'avance)
      }
      suivis.set(repere, s);
      if (fluides) {
        repere.setSubpixelPositioning(true);
        el.style.willChange = 'auto';
      }
      appliquer(repere, s);
      if (s.dessine) toile.sale();
    },
    /**
     * La rotation douce du départ tourne la carte d'une fraction de degré à chaque image (setBearing, donc un
     * moveend à chaque image), et MapLibre arrondit alors la place de chaque repère au pixel : les points des lieux
     * sautaient d'un pixel, chacun à son tour, et scintillaient (vu par le propriétaire, 2026-10-22). oui : placés à
     * la fraction de pixel près ; non : de nouveau arrondis, nets au repos (setLngLat les replace aussitôt).
     * Puis les pins des villes ont tremblé (le propriétaire, 2026-10-29) : un repère de MapLibre est un calque à part
     * (will-change: transform), dessiné une fois puis glissé, et glissé d'une fraction de pixel il est rééchantillonné,
     * flou à mi-pixel (−50 % de contraste) et net au pixel rond ; en tournant lentement, chaque pin pulsait. Pendant la
     * rotation, sans calque à part (will-change: auto), le navigateur le redessine à sa place exacte (−24 %, et plus
     * de double flou) ; le même nombre d'images par seconde (villes_cout.py, CPU ÷4 et ÷3).
     */
    fluide(oui) {
      if (oui === fluides) return;
      fluides = oui;
      toile?.fluide(oui);
      for (const repere of suivis.keys()) {
        repere.setSubpixelPositioning(oui);
        repere.getElement().style.willChange = oui ? 'auto' : '';
        if (!oui) repere.setLngLat(repere.getLngLat());
      }
      toile?.sale();
    },
    vueLointaine(oui) {
      if (oui === loin) return;
      loin = oui;
      toile?.regler({ loin });
      revoir();
    },
    taille(t) {
      toile?.regler({ taille: t });
      toile?.sale();
    },
    montrer(repere, voulu, delai = 0) {
      const s = suivis.get(repere);
      if (!s) return;
      clearTimeout(s.minuterie);
      if (!voulu && delai && (s.sur || s.dessine)) {
        s.minuterie = setTimeout(() => { s.voulu = false; revoir(s); }, delai);
        return;
      }
      s.voulu = voulu;
      revoir(s);
    },
    verifier(repere) {
      const s = suivis.get(repere);
      if (s) revoir(s);
    },
    oublier(repere) {
      const s = suivis.get(repere);
      if (!s) return;
      clearTimeout(s.minuterie);
      if (s.sur) repere.remove();
      if (s.dessine) listeChangee = true;
      if (survole === s) { survole = null; toile.survole(null); }
      parElement.delete(s.el);
      suivis.delete(repere);
      if (s.dessine) toile.sale();
    },
  };
}
