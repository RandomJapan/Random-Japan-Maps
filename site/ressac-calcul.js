// ================================================================
//  Le ressac, en coulisse (un « worker » : la carte ne s'arrête pas pendant le calcul).
//  Pour une tuile de relief Mapterhorn, il calcule la distance de chaque point de la mer au rivage :
//  la mer y vaut 0 m pile, la terre tout le reste. ressac.js en fait des vagues qui viennent mourir
//  sur la côte, exactement là où la carte la dessine.
//  Les 8 tuiles voisines comptent aussi : sans elles, une côte juste de l'autre côté du bord serait
//  ignorée et les vagues se casseraient le long des bords de tuile.
// ================================================================
const PORTEE = 64; // pixels de tuile : au-delà, la distance n'est plus utile (codée 255)
const TAILLE = 512;
const BLOC = TAILLE + 2 * PORTEE;
const INFINI = 1e20;
const MAX_MASQUES = 48;

const masques = new Map(); // adresse → Promise<Uint8Array | null> (1 = terre), les plus récents à la fin

/** Le masque terre/mer d'une tuile (null : la tuile n'existe pas, c'est le grand large). */
function masque(adresse) {
  if (!adresse) return Promise.resolve(null);
  let m = masques.get(adresse);
  if (m) {
    masques.delete(adresse);
    masques.set(adresse, m);
    return m;
  }
  m = lireMasque(adresse).catch(() => null);
  masques.set(adresse, m);
  while (masques.size > MAX_MASQUES) masques.delete(masques.keys().next().value);
  return m;
}

async function lireMasque(adresse) {
  const r = await fetch(adresse); // déjà dans le cache du navigateur : la carte vient de la demander
  if (!r.ok) return null;
  const image = await createImageBitmap(await r.blob(), { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
  const { width: l, height: h } = image;
  if (l !== TAILLE || h !== TAILLE) return null;
  const toile = new OffscreenCanvas(l, h);
  const ctx = toile.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);
  image.close();
  const px = ctx.getImageData(0, 0, l, h).data;
  const m = new Uint8Array(l * h);
  for (let i = 0, j = 0; i < m.length; i++, j += 4) {
    // altitude « terrarium » ; la mer vaut 0 m pile. Comme la palette de la carte (app.js, couleurs-relief) :
    // entre -1,2 et 0,6 m, c'est encore la couleur de la mer.
    const e = px[j] * 256 + px[j + 1] + px[j + 2] / 256 - 32768;
    m[i] = e >= 0.6 || e <= -1.2 ? 1 : 0;
  }
  return m;
}

// Distance euclidienne au carré, sur une ligne (Felzenszwalb et Huttenlocher)
const f1 = new Float64Array(BLOC), d1 = new Float64Array(BLOC), v1 = new Int32Array(BLOC), z1 = new Float64Array(BLOC + 1);
function ligne(n) {
  let k = 0;
  v1[0] = 0; z1[0] = -INFINI; z1[1] = INFINI;
  for (let q = 1; q < n; q++) {
    let s;
    for (;;) {
      const p = v1[k];
      s = ((f1[q] + q * q) - (f1[p] + p * p)) / (2 * q - 2 * p);
      if (s > z1[k]) break;
      k--;
    }
    k++;
    v1[k] = q; z1[k] = s; z1[k + 1] = INFINI;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z1[k + 1] < q) k++;
    const p = v1[k];
    d1[q] = (q - p) * (q - p) + f1[p];
  }
}

onmessage = async ({ data: { id, adresses } }) => {
  try {
    // adresses : les 9 tuiles, ligne par ligne du nord-ouest au sud-est (la nôtre au milieu)
    const centre = await masque(adresses[4]);
    if (centre && centre.every((t) => t === 1)) return postMessage({ id, vide: true }); // que de la terre
    const tous = await Promise.all(adresses.map(masque));
    if (tous.every((m) => !m || m.every((t) => t === 0))) return postMessage({ id, vide: true }); // que de la mer
    // le bloc : notre tuile et une bande de PORTEE pixels prise dans ses voisines ; terre = 0, mer = l'infini
    const g = new Float64Array(BLOC * BLOC);
    for (let by = 0; by < BLOC; by++) {
      const ty = by < PORTEE ? 0 : by < PORTEE + TAILLE ? 1 : 2;
      const sy = (by - PORTEE + TAILLE) % TAILLE;
      for (let bx = 0; bx < BLOC; bx++) {
        const tx = bx < PORTEE ? 0 : bx < PORTEE + TAILLE ? 1 : 2;
        const m = tous[ty * 3 + tx];
        const sx = (bx - PORTEE + TAILLE) % TAILLE;
        g[by * BLOC + bx] = m && m[sy * TAILLE + sx] ? 0 : INFINI;
      }
    }
    for (let x = 0; x < BLOC; x++) {
      for (let y = 0; y < BLOC; y++) f1[y] = g[y * BLOC + x];
      ligne(BLOC);
      for (let y = 0; y < BLOC; y++) g[y * BLOC + x] = d1[y];
    }
    for (let y = 0; y < BLOC; y++) {
      const o = y * BLOC;
      for (let x = 0; x < BLOC; x++) f1[x] = g[o + x];
      ligne(BLOC);
      for (let x = 0; x < BLOC; x++) g[o + x] = d1[x];
    }
    // notre tuile seule : 0 = terre, 1 à 255 = la distance (255 : PORTEE ou plus)
    const champ = new Uint8Array(TAILLE * TAILLE);
    let utile = false;
    for (let y = 0; y < TAILLE; y++) {
      const o = (y + PORTEE) * BLOC + PORTEE;
      for (let x = 0; x < TAILLE; x++) {
        const q = g[o + x];
        if (q === 0) continue;
        const d = Math.sqrt(q);
        if (d < PORTEE) utile = true;
        champ[y * TAILLE + x] = Math.max(1, Math.min(255, Math.round((d / PORTEE) * 255)));
      }
    }
    if (!utile) return postMessage({ id, vide: true }); // la côte est trop loin de cette tuile
    postMessage({ id, champ }, [champ.buffer]);
  } catch (e) {
    postMessage({ id, erreur: String(e?.message || e) });
  }
};
