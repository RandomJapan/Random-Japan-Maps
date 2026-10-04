// ================================================================
//  Les tuiles de relief (Mapterhorn) passent par le protocole relief://
//  Mapterhorn n'a pas de tuile pour certaines zones de grand large : il répond 404,
//  et le navigateur l'écrit en rouge dans sa console. On ne les lui demande plus :
//  - data/tuiles-vides.json liste celles qu'on connaît (outils/tuiles_vides.py) ;
//    leurs sous-tuiles sont vides aussi ;
//  - une tuile vide qu'on ne connaissait pas (un 404) est retenue dans ce navigateur.
//  Pour MapLibre rien ne change : il reçoit la même erreur 404 qu'avant (sans requête),
//  qu'il passe sous silence en gardant la tuile parente ; la mer est le fond de la carte.
// ================================================================
const ADRESSE = 'https://tiles.mapterhorn.com/{z}/{x}/{y}.webp';
const PROTOCOLE = 'relief';
const MEMO = 'tuilesVides'; // localStorage : les tuiles vides apprises dans ce navigateur
const MAX_MEMO = 2000;

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

  /** La tuile, ou l'une de ses tuiles parentes, est-elle vide ? */
  function estVide(z, x, y) {
    for (let k = z; k >= 0; k--) if (vides.has(`${k}/${x >> (z - k)}/${y >> (z - k)}`)) return true;
    return false;
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
    if (!estVide(z, x, y)) {
      const r = await fetch(adresse(z, x, y), { signal: abortController.signal });
      if (r.ok) return { data: await r.arrayBuffer(), cacheControl: r.headers.get('Cache-Control'), expires: r.headers.get('Expires') };
      if (r.status !== 404) throw Object.assign(new Error(`Tuile de relief ${z}/${x}/${y} : ${r.status}`), { status: r.status });
      noterVide(z, x, y);
    }
    throw Object.assign(new Error(`Pas de tuile de relief ${z}/${x}/${y} (grand large)`), { status: 404 });
  });

  return { modele: `${PROTOCOLE}://{z}/{x}/{y}`, adresse, estVide, noterVide, pret };
}

function lireMemo() {
  try {
    const liste = JSON.parse(localStorage.getItem(MEMO));
    return Array.isArray(liste) ? liste : [];
  } catch {
    return [];
  }
}
