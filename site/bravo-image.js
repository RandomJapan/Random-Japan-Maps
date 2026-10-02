// ================================================================
//  L'image « Bravo » à partager quand on a trouvé toutes les légendes cachées
//  (legendes.js) : une feuille de papier vieilli au format vertical 9:16
//  (TikTok, stories), avec le sceau 伝説, le bravo, les 22 vignettes et
//  l'adresse de la carte. Dessinée dans le navigateur, au moment du partage.
// ================================================================

const L = 1080, H = 1920;
const PAPIER = '#efe4c8', PAPIER_CLAIR = '#f6eedb', TRAIT = '#8a6b45', ENCRE = '#35251a', ENCRE_2 = '#5b432d', ROUGE = '#a8321f';
const TITRE = '"Zen Antique", "Noto Serif JP", Georgia, serif';
const CARTE = '"IM Fell English", "Zen Antique", Georgia, serif';
const TEXTE = '"Noto Sans", "Noto Sans JP", system-ui, sans-serif';
const RANGEES = [4, 5, 4, 5, 4]; // les 22 vignettes en quinconce, comme une planche de timbres

/**
 * @param legendes - la liste LEGENDES (dans l'ordre, du nord au sud)
 * @param dessins - les dessins SVG (DESSINS de legendes-dessins.js)
 * @param textes - { titre, texte, defi, adresse, nomSite }
 * @returns Promise d'un Blob JPEG
 */
export async function imageBravo({ legendes, dessins, textes }) {
  const toile = document.createElement('canvas');
  toile.width = L;
  toile.height = H;
  const c = toile.getContext('2d');
  const tout = Object.values(textes).join('') + '伝説';
  await Promise.all([
    document.fonts.load(`110px ${TITRE}`, tout),
    document.fonts.load(`italic 48px ${CARTE}`, textes.adresse),
    document.fonts.load(`40px ${TEXTE}`, tout),
  ]).catch(() => {});

  // ---- Le papier : grain, bords brunis, double filet d'encre
  c.fillStyle = PAPIER;
  c.fillRect(0, 0, L, H);
  const grain = await chargerImage(adresseGrain()).catch(() => null);
  if (grain) {
    c.save();
    c.scale(1.5, 1.5);
    c.fillStyle = c.createPattern(grain, 'repeat');
    c.fillRect(0, 0, L / 1.5, H / 1.5);
    c.restore();
  }
  const bord = c.createRadialGradient(L / 2, H / 2, H * 0.32, L / 2, H / 2, H * 0.62);
  bord.addColorStop(0, 'rgba(120, 84, 44, 0)');
  bord.addColorStop(1, 'rgba(120, 84, 44, 0.32)');
  c.fillStyle = bord;
  c.fillRect(0, 0, L, H);
  c.strokeStyle = TRAIT;
  c.lineWidth = 4;
  c.strokeRect(34, 34, L - 68, H - 68);
  c.globalAlpha = 0.6;
  c.lineWidth = 2;
  c.strokeRect(50, 50, L - 100, H - 100);
  c.globalAlpha = 1;

  // ---- En-tête : le logo et le nom du site
  const logo = await chargerImage('img/logo.jpg').catch(() => null);
  if (logo) {
    c.save();
    c.beginPath();
    c.arc(L / 2, 160, 58, 0, Math.PI * 2);
    c.clip();
    const cote = Math.min(logo.width, logo.height);
    c.drawImage(logo, (logo.width - cote) / 2, (logo.height - cote) / 2, cote, cote, L / 2 - 58, 102, 116, 116);
    c.restore();
    c.beginPath();
    c.arc(L / 2, 160, 59, 0, Math.PI * 2);
    c.strokeStyle = ENCRE;
    c.lineWidth = 4;
    c.stroke();
  }
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  c.fillStyle = ENCRE;
  c.font = `46px ${TITRE}`;
  c.fillText(textes.nomSite, L / 2, 276);

  // ---- Le sceau rouge 伝説, un peu de travers, comme tamponné
  c.save();
  c.translate(L / 2, 420);
  c.rotate((-8 * Math.PI) / 180);
  c.fillStyle = 'rgba(168, 50, 31, 0.08)';
  c.fillRect(-82, -82, 164, 164);
  c.strokeStyle = ROUGE;
  c.lineWidth = 6;
  c.strokeRect(-82, -82, 164, 164);
  c.lineWidth = 3;
  c.strokeRect(-68, -68, 136, 136);
  c.fillStyle = ROUGE;
  c.font = `60px ${TITRE}`;
  c.textBaseline = 'middle';
  c.fillText('伝', 0, -28);
  c.fillText('説', 0, 32);
  c.restore();

  // ---- Le bravo et la phrase
  c.textBaseline = 'alphabetic';
  c.fillStyle = ENCRE;
  c.font = `${ajuster(c, textes.titre, 110, TITRE, 900)}px ${TITRE}`;
  c.fillText(textes.titre, L / 2, 640);
  c.fillStyle = ENCRE_2;
  c.font = `40px ${TEXTE}`;
  lignesEquilibrees(c, textes.texte, 820).forEach((ligne, i) => c.fillText(ligne, L / 2, 720 + i * 54));

  // ---- Les 22 vignettes, en quinconce
  const css = styleDessins();
  const images = await Promise.all(legendes.map((l) => {
    const url = urlDessin(dessins[l.id], css);
    return chargerImage(url).catch(() => null).finally(() => URL.revokeObjectURL(url));
  }));
  const largeurCase = 196, hauteurRangee = 156, haut = 852;
  let k = 0;
  c.save();
  c.shadowColor = 'rgba(52, 36, 18, 0.35)';
  c.shadowBlur = 5;
  c.shadowOffsetY = 2;
  RANGEES.forEach((n, r) => {
    const x0 = (L - n * largeurCase) / 2;
    for (let j = 0; j < n && k < images.length; j++, k++) {
      const im = images[k];
      if (im) c.drawImage(im, x0 + j * largeurCase + (largeurCase - 160) / 2, haut + r * hauteurRangee, 160, 150);
    }
  });
  c.restore();

  // ---- Le défi et l'adresse
  c.fillStyle = ENCRE;
  c.font = `${ajuster(c, textes.defi, 54, TITRE, 900)}px ${TITRE}`;
  c.fillText(textes.defi, L / 2, 1712);
  c.font = `italic ${ajuster(c, textes.adresse, 50, CARTE, 860)}px ${CARTE}`;
  c.fillStyle = ROUGE;
  c.fillText(textes.adresse, L / 2, 1790);
  const largeur = c.measureText(textes.adresse).width;
  c.strokeStyle = ROUGE;
  c.globalAlpha = 0.5;
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(L / 2 - largeur / 2, 1806);
  c.lineTo(L / 2 + largeur / 2, 1806);
  c.stroke();
  c.globalAlpha = 1;

  return new Promise((ok, ko) => toile.toBlob((b) => (b ? ok(b) : ko(new Error('toBlob'))), 'image/jpeg', 0.9));
}

function chargerImage(src) {
  const im = new Image();
  im.src = src;
  return im.decode().then(() => im);
}

/** Le grain du papier : la même texture que la carte (variable --grain de style.css). */
function adresseGrain() {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--grain');
  const m = v.match(/url\(["']?(.*?)["']?\)\s*$/);
  if (!m) throw new Error('grain');
  return m[1];
}

/**
 * Les couleurs des dessins viennent de legendes.css (règles « .lg … » et règles propres à chaque dessin) :
 * on les recopie dans chaque dessin, sinon une image SVG ne les voit pas. Les petites animations (.anime)
 * sont laissées de côté.
 */
function styleDessins() {
  const regles = [];
  for (const feuille of document.styleSheets) {
    if (!feuille.href?.includes('legendes.css')) continue;
    for (const r of feuille.cssRules) {
      // toutes les règles (celles des autres éléments de la page ne trouvent rien dans un dessin), sauf les animations
      if (r.selectorText && !r.selectorText.includes('.anime')) regles.push(r.cssText.replace(/\.lg\s+/g, ''));
    }
  }
  return regles.join('\n');
}

function urlDessin(svg, css) {
  const complet = svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="300" ')
    .replace(/(<svg[^>]*>)/, `$1<style>${css}</style>`);
  return URL.createObjectURL(new Blob([complet], { type: 'image/svg+xml' }));
}

/** Taille de police (au plus `taille`) pour que le texte tienne dans `largeur`. */
function ajuster(c, texte, taille, police, largeur) {
  c.font = `${taille}px ${police}`;
  const w = c.measureText(texte).width;
  return w > largeur ? Math.floor((taille * largeur) / w) : taille;
}

/** Comme lignes(), mais des lignes de longueurs voisines (pas un mot tout seul sur la dernière). */
function lignesEquilibrees(c, texte, largeur) {
  const n = lignes(c, texte, largeur).length;
  if (n < 2) return lignes(c, texte, largeur);
  let bas = largeur / 2, haut = largeur;
  for (let i = 0; i < 12; i++) {
    const m = (bas + haut) / 2;
    if (lignes(c, texte, m).length > n) bas = m; else haut = m;
  }
  return lignes(c, texte, haut);
}

/** Coupe le texte en lignes de `largeur` px au plus (aux espaces ; caractère par caractère en japonais). */
function lignes(c, texte, largeur) {
  const morceaux = /\s/.test(texte) ? texte.split(/(?<=\s)/) : [...texte];
  const res = [];
  let ligne = '';
  for (const m of morceaux) {
    if (ligne && c.measureText(ligne + m).width > largeur) { res.push(ligne.trim()); ligne = m; } else ligne += m;
  }
  if (ligne.trim()) res.push(ligne.trim());
  return res;
}
