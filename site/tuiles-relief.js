// ================================================================
//  Les tuiles de relief (Mapterhorn) passent par le protocole relief://
//  Mapterhorn n'a pas de tuile pour certaines zones de grand large : il répond 404,
//  et le navigateur l'écrit en rouge dans sa console. On ne les lui demande plus :
//  - data/tuiles-vides.json liste celles qu'on connaît (outils/tuiles_vides.py) ;
//    leurs sous-tuiles sont vides aussi ;
//  - une tuile vide qu'on ne connaissait pas (un 404) est retenue dans ce navigateur.
//  Pour MapLibre rien ne change : il reçoit la même erreur 404 qu'avant (sans requête),
//  qu'il passe sous silence en gardant la tuile parente ; la mer est le fond de la carte.
//  Et seul le Japon garde son relief (zone-japon.js, 2026-10-21) : une tuile hors de la zone du Japon n'est pas
//  demandée (même erreur 404) ; dans une tuile à cheval, le relief hors de la zone passe à 0 m (zone-calcul.js).
//  Les pays voisins, leurs îles et leurs montagnes à l'horizon deviennent de la mer.
// ================================================================
import { classer, lireZone, masquer } from './zone-japon.js';

const ADRESSE = 'https://tiles.mapterhorn.com/{z}/{x}/{y}.webp';
const PROTOCOLE = 'relief';
const MEMO = 'tuilesVides'; // localStorage : les tuiles vides apprises dans ce navigateur
const MAX_MEMO = 2000;
const ZONE = 'data/zone-japon.png';
const MAX_MASQUEES = 64; // tuiles à cheval déjà traitées (les deux sources du relief demandent les mêmes)

/**
 * La zone du Japon : lue et appliquée par un worker, sinon dans la page. Renvoie { grille (Promise : de quoi
 * classer les tuiles, null si la zone n'a pas pu être lue), masquer(z, x, y, octets) → Promise<ArrayBuffer | null> }.
 */
function preparerZone() {
  const adresse = new URL(ZONE, document.baseURI).href;
  const dansLaPage = () => {
    const toile = (l, h) => Object.assign(document.createElement('canvas'), { width: l, height: h });
    const lu = lireZone(adresse, toile);
    return {
      grille: lu.then((z) => z.grille),
      masquer: (z, x, y, octets) => lu.then((r) => masquer(r.zone, z, x, y, octets, toile)),
    };
  };
  if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') return Promise.resolve(dansLaPage());
  return new Promise((resoudre) => {
    let ouvrier;
    try {
      ouvrier = new Worker(new URL('./zone-calcul.js', import.meta.url), { type: 'module' });
    } catch {
      resoudre(dansLaPage());
      return;
    }
    const attente = new Map();
    let suivant = 0;
    ouvrier.onerror = () => { ouvrier.terminate(); resoudre(dansLaPage()); }; // (un navigateur sans worker « module »)
    ouvrier.onmessage = (e) => {
      const m = e.data;
      if (m.type === 'zone') {
        if (m.erreur) console.warn('Relief : zone du Japon illisible', m.erreur);
        resoudre({
          grille: Promise.resolve(m.grille || null),
          masquer: (z, x, y, octets) => new Promise((ok) => {
            const id = ++suivant;
            attente.set(id, ok);
            ouvrier.postMessage({ type: 'tuile', id, z, x, y, octets }, [octets]);
          }),
        });
        return;
      }
      if (m.erreur) console.warn('Relief : tuile non masquée', m.erreur);
      attente.get(m.id)?.(m.octets);
      attente.delete(m.id);
    };
    ouvrier.postMessage({ type: 'zone', adresse });
  }).then((z) => ({ grille: z.grille.catch(() => null), masquer: z.masquer }));
}

/**
 * Renvoie { modele (l'adresse des tuiles pour la source MapLibre), adresse(z, x, y) (la vraie adresse),
 *           estVide(z, x, y), noterVide(z, x, y), pret (Promise : la liste des tuiles vides est lue) }.
 */
export function brancherTuilesRelief(maplibregl) {
  const vides = new Set(lireMemo());
  const pret = fetch('data/tuiles-vides.json')
    .then((r) => (r.ok ? r.json() : {}))
    .then((d) => { for (const cle of d.vides || []) vides.add(cle); })
    .catch(() => {});

  const adresse = (z, x, y) => ADRESSE.replace('{z}', z).replace('{x}', x).replace('{y}', y);

  const zone = preparerZone();
  let grille = null; // de quoi classer les tuiles, une fois la zone lue
  const zonePrete = zone.then((z) => z.grille).then((g) => { grille = g; }).catch(() => {});
  const masquees = new Map(); // 'z/x/y' → Promise<Uint8Array | null> (null : la tuile reste telle quelle)

  /** La tuile à cheval sur la zone, son relief hors de la zone à 0 m (une copie : MapLibre garde celle qu'on lui donne). */
  async function masquee(z, x, y, octets) {
    const cle = `${z}/${x}/${y}`;
    let m = masquees.get(cle);
    if (!m) {
      m = zone.then((zn) => zn.masquer(z, x, y, octets.slice(0))).then((b) => (b ? new Uint8Array(b) : null)).catch(() => null);
      masquees.set(cle, m);
      while (masquees.size > MAX_MASQUEES) masquees.delete(masquees.keys().next().value);
    }
    const r = await m;
    return r ? r.slice().buffer : octets;
  }

  /** La tuile, ou l'une de ses tuiles parentes, est-elle vide ? (ou hors de la zone du Japon : rien que de la mer) */
  function estVide(z, x, y) {
    for (let k = z; k >= 0; k--) if (vides.has(`${k}/${x >> (z - k)}/${y >> (z - k)}`)) return true;
    return !!grille && classer(grille, z, x, y) === 'dehors';
  }

  function noterVide(z, x, y) {
    if (estVide(z, x, y)) return;
    const cle = `${z}/${x}/${y}`;
    vides.add(cle);
    try { localStorage.setItem(MEMO, JSON.stringify([...lireMemo(), cle].slice(-MAX_MEMO))); } catch { /* pas grave */ }
  }

  maplibregl.addProtocol(PROTOCOLE, async (params, abortController) => {
    const [z, x, y] = params.url.slice(PROTOCOLE.length + 3).split('/').map(Number);
    await pret;
    await zonePrete;
    if (!estVide(z, x, y)) {
      const r = await fetch(adresse(z, x, y), { signal: abortController.signal });
      if (r.ok) {
        let data = await r.arrayBuffer();
        if (grille && classer(grille, z, x, y) === 'mixte') data = await masquee(z, x, y, data);
        return { data, cacheControl: r.headers.get('Cache-Control'), expires: r.headers.get('Expires') };
      }
      if (r.status !== 404) throw Object.assign(new Error(`Tuile de relief ${z}/${x}/${y} : ${r.status}`), { status: r.status });
      noterVide(z, x, y);
    }
    throw Object.assign(new Error(`Pas de tuile de relief ${z}/${x}/${y} (grand large)`), { status: 404 });
  });

  return { modele: `${PROTOCOLE}://{z}/{x}/{y}`, adresse, estVide, noterVide, pret: Promise.all([pret, zonePrete]) };
}

function lireMemo() {
  try {
    const liste = JSON.parse(localStorage.getItem(MEMO));
    return Array.isArray(liste) ? liste : [];
  } catch {
    return [];
  }
}
