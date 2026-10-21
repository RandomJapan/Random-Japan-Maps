// ================================================================
//  La zone du Japon (2026-10-21) : la carte ne garde que le relief du Japon et de ses abords.
//  data/zone-japon.png (outils/fabriquer_houle.py) couvre BORNES_ZONE en projection Mercator : 255 dans la zone (à
//  moins de 70 km des côtes du Japon, et plus près du Japon que d'un voisin ; avec les Territoires du Nord et
//  Takeshima, choix du propriétaire), 0 dehors. Hors de la zone, le relief passe à 0 m : la mer (tuiles-relief.js).
//  Ce module sert dans zone-calcul.js (un « worker ») et, faute de worker, dans la page.
// ================================================================
export const BORNES_ZONE = [121.5, 23.0, 157.5, 51.5]; // ouest, sud, est, nord : comme outils/fabriquer_houle.py
const SEUIL = 128;
const CELLULE = 4; // pixels de l'image par case de la grille des minimums et maximums
const TAILLE = 512; // les tuiles de Mapterhorn
const MER = [128, 0, 0]; // 0 m en « terrarium » : 128 × 256 + 0 + 0 / 256 - 32768

const mercX = (lng) => (lng + 180) / 360;
const mercY = (lat) => (1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) / 2;
const CADRE = [mercX(BORNES_ZONE[0]), mercY(BORNES_ZONE[3]), mercX(BORNES_ZONE[2]), mercY(BORNES_ZONE[1])];

/** Les pixels d'une image (ArrayBuffer ou Blob), sans conversion de couleur. toile(l, h) donne un canvas. */
async function pixels(donnees, toile) {
  const blob = donnees instanceof Blob ? donnees : new Blob([donnees]);
  const image = await createImageBitmap(blob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
  const { width: l, height: h } = image;
  const c = toile(l, h);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);
  image.close?.();
  return { l, h, c, ctx, rgba: ctx.getImageData(0, 0, l, h) };
}

/**
 * Lit l'image de la zone. Renvoie { zone : les valeurs (un octet par pixel) et la taille, grille : pour chaque case
 * de CELLULE × CELLULE pixels, le plus petit et le plus grand (de quoi classer une tuile sans lire ses pixels) }.
 */
export async function lireZone(adresse, toile) {
  const r = await fetch(adresse);
  if (!r.ok) throw new Error(`Zone du Japon : ${r.status}`);
  const { l, h, rgba } = await pixels(await r.blob(), toile);
  const v = new Uint8Array(l * h);
  for (let i = 0; i < v.length; i++) v[i] = rgba.data[i * 4];
  const cl = Math.ceil(l / CELLULE), ch = Math.ceil(h / CELLULE);
  const mini = new Uint8Array(cl * ch).fill(255), maxi = new Uint8Array(cl * ch);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < l; x++) {
      const k = Math.floor(y / CELLULE) * cl + Math.floor(x / CELLULE), e = v[y * l + x];
      if (e < mini[k]) mini[k] = e;
      if (e > maxi[k]) maxi[k] = e;
    }
  }
  return { zone: { l, h, v }, grille: { l, h, cl, ch, mini, maxi } };
}

/**
 * Une tuile est-elle 'dedans' (tout son relief reste), 'dehors' (rien ne reste : c'est la mer) ou 'mixte' ?
 * Prudent : une case touchée compte entière (une tuile classée mixte pour rien est seulement lue pour rien).
 */
export function classer(grille, z, x, y) {
  const n = 2 ** z;
  const [X0, Y0, X1, Y1] = CADRE;
  // la tuile en pixels de l'image, un pixel de marge (la lecture bilinéaire déborde d'un pixel)
  const px0 = ((x / n - X0) / (X1 - X0)) * grille.l - 1, px1 = (((x + 1) / n - X0) / (X1 - X0)) * grille.l + 1;
  const py0 = ((y / n - Y0) / (Y1 - Y0)) * grille.h - 1, py1 = (((y + 1) / n - Y0) / (Y1 - Y0)) * grille.h + 1;
  if (px1 <= 0 || py1 <= 0 || px0 >= grille.l || py0 >= grille.h) return 'dehors';
  let dedans = false, dehors = px0 < 0 || py0 < 0 || px1 > grille.l || py1 > grille.h;
  const cx0 = Math.max(0, Math.floor(px0 / CELLULE)), cx1 = Math.min(grille.cl - 1, Math.floor(px1 / CELLULE));
  const cy0 = Math.max(0, Math.floor(py0 / CELLULE)), cy1 = Math.min(grille.ch - 1, Math.floor(py1 / CELLULE));
  for (let cy = cy0; cy <= cy1; cy++) {
    for (let cx = cx0; cx <= cx1; cx++) {
      const k = cy * grille.cl + cx;
      if (grille.maxi[k] >= SEUIL) dedans = true;
      if (grille.mini[k] < SEUIL) dehors = true;
      if (dedans && dehors) return 'mixte';
    }
  }
  return dedans ? 'dedans' : 'dehors';
}

/**
 * Met à 0 m le relief hors de la zone, dans une tuile « terrarium » (ArrayBuffer d'une image WebP ou PNG).
 * Renvoie la tuile en PNG, ou null si rien n'a changé (la zone n'y coupe que de la mer).
 */
export async function masquer(zone, z, x, y, octets, toile) {
  const { l, h, c, ctx, rgba } = await pixels(octets, toile);
  if (l !== TAILLE || h !== TAILLE) return null;
  const n = 2 ** z;
  const [X0, Y0, X1, Y1] = CADRE;
  // chaque colonne et chaque ligne de la tuile, en pixels de l'image de la zone (Mercator des deux côtés : linéaire)
  const colonnes = new Float32Array(l), lignes = new Float32Array(h);
  for (let i = 0; i < l; i++) colonnes[i] = (((x + (i + 0.5) / l) / n - X0) / (X1 - X0)) * zone.l - 0.5;
  for (let j = 0; j < h; j++) lignes[j] = (((y + (j + 0.5) / h) / n - Y0) / (Y1 - Y0)) * zone.h - 0.5;
  const lire = (px, py) => (px < 0 || py < 0 || px >= zone.l || py >= zone.h ? 0 : zone.v[py * zone.l + px]);
  const d = rgba.data;
  let changes = 0;
  for (let j = 0; j < h; j++) {
    const fy = lignes[j], y0 = Math.floor(fy), ty = fy - y0;
    for (let i = 0; i < l; i++) {
      const o = (j * l + i) * 4;
      if (d[o] === MER[0] && d[o + 1] === MER[1] && d[o + 2] === MER[2]) continue; // déjà la mer
      const fx = colonnes[i], x0 = Math.floor(fx), tx = fx - x0;
      const haut = lire(x0, y0) * (1 - tx) + lire(x0 + 1, y0) * tx;
      const bas = lire(x0, y0 + 1) * (1 - tx) + lire(x0 + 1, y0 + 1) * tx;
      if (haut * (1 - ty) + bas * ty >= SEUIL) continue;
      d[o] = MER[0]; d[o + 1] = MER[1]; d[o + 2] = MER[2]; d[o + 3] = 255;
      changes++;
    }
  }
  if (!changes) return null;
  ctx.putImageData(rgba, 0, 0);
  const blob = c.convertToBlob ? await c.convertToBlob({ type: 'image/png' }) : await new Promise((ok) => c.toBlob(ok, 'image/png'));
  return blob.arrayBuffer();
}
