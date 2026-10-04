// ================================================================
//  L'affiche d'un lieu, pour le montage des TikToks : le carton du nom (le même que le bandeau
//  du plongeon sur téléphone : nom japonais de haut en bas, nom anglais, type · préfecture),
//  en PNG sur fond transparent, avec son ombre, à poser sur une vidéo.
//  Dessinée sur une toile, 4 fois plus grande que sur un téléphone : elle reste nette en 1080 × 1920.
// ================================================================
import { chargerImage, adresseGrain, lignesEquilibrees } from './bravo-image.js';

const PAPIER = '#efe4c8', PAPIER_CLAIR = '#f6eedb', TRAIT = '#8a6b45', ENCRE = '#35251a', ENCRE_2 = '#5b432d';
const TITRE = '"Zen Antique", "Noto Serif JP", Georgia, serif';
const CARTE = '"IM Fell English", "Zen Antique", Georgia, serif';
const K = 4; // pixels de l'image par pixel CSS du bandeau
// Les mesures du bandeau sur téléphone (style.css, .visite-titre), en pixels CSS
const M = {
  haut: 10, droite: 16, bas: 10, gauche: 10, ecart: 11, retrait: 4,
  nom: 22, hNom: 1.15, info: 14.5, hInfo: 1.3, entre: 5, largeurTexte: 300,
  ja: 15, jaHaut: 8, jaBas: 6, jaCote: 5,
};
const MARGE = { cote: 32, haut: 24, bas: 46 }; // la place de l'ombre portée (0 10px 30px), en pixels CSS
// Signes tournés d'un quart de tour quand le nom japonais est écrit de haut en bas (comme le fait le navigateur)
const TOURNES = new Set([...'ー－—―‐-～〜…‥（）()「」『』【】〈〉《》［］[]＝=']);

/**
 * @param nom - le nom du lieu (anglais)
 * @param nomJa - le nom japonais (facultatif : sans lui, pas de colonne)
 * @param infos - « Type · Préfecture »
 * @returns Promise d'un Blob PNG
 */
export async function imageAffiche({ nom, nomJa = '', infos = '' }) {
  const avecJa = !!nomJa && nomJa !== nom;
  await Promise.all([
    document.fonts.load(`${M.nom}px ${TITRE}`, nom + nomJa),
    document.fonts.load(`italic ${M.info}px ${CARTE}`, infos || 'a'),
  ]).catch(() => {});
  const grain = await chargerImage(adresseGrain()).catch(() => null);

  // ---- La mise en page (en pixels CSS)
  const mesure = document.createElement('canvas').getContext('2d');
  mesure.font = `${M.nom}px ${TITRE}`;
  const lignesNom = lignesEquilibrees(mesure, nom, M.largeurTexte);
  const largeurNom = Math.max(...lignesNom.map((l) => mesure.measureText(l).width));
  mesure.font = `italic ${M.info}px ${CARTE}`;
  const lignesInfo = infos ? lignesEquilibrees(mesure, infos, M.largeurTexte) : [];
  const largeurInfo = Math.max(0, ...lignesInfo.map((l) => mesure.measureText(l).width));
  const hNom = M.nom * M.hNom, hInfo = M.info * M.hInfo;
  const hauteurTextes = lignesNom.length * hNom + (lignesInfo.length ? M.entre + lignesInfo.length * hInfo : 0);
  const signes = [...nomJa];
  // plus petit quand il est long, comme le bandeau (visite.js, montrerTitre)
  const tailleJa = signes.length > 10 ? 11 : signes.length > 8 ? 12.5 : signes.length > 6 ? 14 : M.ja;
  const pas = tailleJa * 1.12; // letter-spacing .12em
  const colonne = avecJa ? { l: tailleJa + 2 * M.jaCote, h: signes.length * pas + M.jaHaut + M.jaBas } : null;
  const hauteurContenu = Math.max(hauteurTextes, colonne?.h || 0);
  const xTextes = M.gauche + (colonne ? colonne.l + M.ecart : 0) + M.retrait;
  const L = Math.ceil(xTextes + Math.max(largeurNom, largeurInfo) + M.droite);
  const H = Math.ceil(M.haut + hauteurContenu + M.bas);

  const toile = document.createElement('canvas');
  toile.width = (L + 2 * MARGE.cote) * K;
  toile.height = (H + MARGE.haut + MARGE.bas) * K;
  const c = toile.getContext('2d');
  c.scale(K, K);
  c.translate(MARGE.cote, MARGE.haut);

  // ---- Le carton : parchemin, grain, ombre portée, filet d'encre et double filet intérieur
  c.save();
  c.shadowColor = 'rgba(52, 36, 18, 0.4)';
  c.shadowBlur = 30 * K; // les ombres ne suivent pas c.scale
  c.shadowOffsetY = 10 * K;
  arrondi(c, 0, 0, L, H, 3);
  c.fillStyle = PAPIER;
  c.fill();
  c.restore();
  if (grain) {
    // le grain redessiné à la taille finale (c'est une image vectorielle) : sinon il serait flou
    const tuile = document.createElement('canvas');
    tuile.width = tuile.height = 240 * K;
    tuile.getContext('2d').drawImage(grain, 0, 0, 240 * K, 240 * K);
    const motif = c.createPattern(tuile, 'repeat');
    motif.setTransform(new DOMMatrix().scale(1 / K));
    c.save();
    arrondi(c, 0, 0, L, H, 3);
    c.clip();
    c.fillStyle = motif;
    c.fillRect(0, 0, L, H);
    c.restore();
  }
  // box-shadow: inset 0 0 0 3px papier, inset 0 0 0 4px trait à 50 % (sous la bordure de 1 px)
  c.fillStyle = PAPIER;
  c.beginPath();
  c.rect(1, 1, L - 2, H - 2);
  c.rect(4, 4, L - 8, H - 8);
  c.fill('evenodd');
  c.strokeStyle = 'rgba(138, 107, 69, 0.5)';
  c.lineWidth = 1;
  c.strokeRect(4.5, 4.5, L - 9, H - 9);
  c.strokeStyle = TRAIT;
  arrondi(c, 0.5, 0.5, L - 1, H - 1, 2.5);
  c.stroke();

  // ---- Le nom japonais, de haut en bas, dans son cartouche de papier neuf
  if (colonne) {
    const x = M.gauche, y = M.haut;
    c.fillStyle = PAPIER_CLAIR;
    c.fillRect(x, y, colonne.l, hauteurContenu);
    c.strokeStyle = ENCRE;
    c.strokeRect(x + 3.5, y + 3.5, colonne.l - 7, hauteurContenu - 7);
    c.fillStyle = ENCRE;
    c.font = `${tailleJa}px ${TITRE}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    signes.forEach((s, i) => {
      c.save();
      c.translate(x + colonne.l / 2, y + M.jaHaut + i * pas + tailleJa / 2);
      if (TOURNES.has(s)) c.rotate(Math.PI / 2);
      c.fillText(s, 0, 0);
      c.restore();
    });
  }

  // ---- Le nom et « Type · Préfecture », centrés en hauteur
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  let y = M.haut + (hauteurContenu - hauteurTextes) / 2;
  c.fillStyle = ENCRE;
  c.font = `${M.nom}px ${TITRE}`;
  for (const l of lignesNom) {
    c.fillText(l, xTextes, y + hNom / 2);
    y += hNom;
  }
  y += M.entre;
  c.fillStyle = ENCRE_2;
  c.font = `italic ${M.info}px ${CARTE}`;
  for (const l of lignesInfo) {
    c.fillText(l, xTextes, y + hInfo / 2);
    y += hInfo;
  }

  return new Promise((ok, ko) => toile.toBlob((b) => (b ? ok(b) : ko(new Error('toBlob'))), 'image/png'));
}

function arrondi(c, x, y, l, h, r) {
  c.beginPath();
  if (c.roundRect) c.roundRect(x, y, l, h, r);
  else c.rect(x, y, l, h); // anciens navigateurs : coins droits (3 px de rayon, ça ne se voit presque pas)
}
