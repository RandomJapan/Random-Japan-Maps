// ================================================================
//  L'image « Bravo » à partager quand on a trouvé toutes les légendes cachées
//  (legendes.js) : une feuille de papier vieilli au format vertical 9:16
//  (TikTok, stories), avec le sceau 伝説, le bravo, les 22 vignettes et
//  l'adresse de la carte. Dessinée dans le navigateur, au moment du partage.
//  Le format paysage (1200 × 630) sert d'aperçu aux liens partagés sur X et
//  Facebook (legendes/<langue>.html) : il est fabriqué une fois et rangé dans img/.
// ================================================================

const PAPIER = '#efe4c8', TRAIT = '#8a6b45', ENCRE = '#35251a', ENCRE_2 = '#5b432d', ROUGE = '#a8321f';
const TITRE = '"Zen Antique", "Noto Serif JP", Georgia, serif';
const CARTE = '"IM Fell English", "Zen Antique", Georgia, serif';
const TEXTE = '"Noto Sans", "Noto Sans JP", system-ui, sans-serif';
// les 22 vignettes en quinconce, comme une planche de timbres
const RANGEES = { vertical: [4, 5, 4, 5, 4], paysage: [6, 5, 6, 5] };

/**
 * @param legendes - la liste LEGENDES (dans l'ordre, du nord au sud)
 * @param dessins - les dessins SVG (DESSINS de legendes-dessins.js)
 * @param textes - { titre, texte, defi, adresse, nomSite }
 * @param format - 'vertical' (1080 × 1920 : TikTok, Instagram, stories) ou 'paysage' (1200 × 630 : l'aperçu
 *   d'un lien sur X et Facebook ; ces images-là sont fabriquées une fois et rangées dans img/, voir CLAUDE.md)
 * @returns Promise d'un Blob JPEG
 */
export async function imageBravo({ legendes, dessins, textes, format = 'vertical' }) {
  const paysage = format === 'paysage';
  const [L, H] = paysage ? [1200, 630] : [1080, 1920];
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
  const [grain, logo, vignettes] = await Promise.all([
    chargerImage(adresseGrain()).catch(() => null),
    chargerImage('img/logo.jpg').catch(() => null),
    chargerVignettes(legendes, dessins),
  ]);

  // ---- Le papier : grain, bords brunis, double filet d'encre
  c.fillStyle = PAPIER;
  c.fillRect(0, 0, L, H);
  if (grain) {
    c.save();
    c.scale(1.5, 1.5);
    c.fillStyle = c.createPattern(grain, 'repeat');
    c.fillRect(0, 0, L / 1.5, H / 1.5);
    c.restore();
  }
  const bord = c.createRadialGradient(L / 2, H / 2, Math.max(L, H) * 0.32, L / 2, H / 2, Math.max(L, H) * 0.62);
  bord.addColorStop(0, 'rgba(120, 84, 44, 0)');
  bord.addColorStop(1, 'rgba(120, 84, 44, 0.32)');
  c.fillStyle = bord;
  c.fillRect(0, 0, L, H);
  const [m1, m2] = paysage ? [20, 32] : [34, 50];
  c.strokeStyle = TRAIT;
  c.lineWidth = 4;
  c.strokeRect(m1, m1, L - 2 * m1, H - 2 * m1);
  c.globalAlpha = 0.6;
  c.lineWidth = 2;
  c.strokeRect(m2, m2, L - 2 * m2, H - 2 * m2);
  c.globalAlpha = 1;
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';

  if (paysage) {
    // À gauche : le logo et le nom du site, le sceau, le bravo, la phrase, le défi et l'adresse ; à droite, les vignettes
    const x = 300;
    if (logo) dessinerLogo(c, logo, 142, 82, 30);
    c.fillStyle = ENCRE;
    c.font = `30px ${TITRE}`;
    c.textAlign = 'left';
    c.fillText(textes.nomSite, 184, 93);
    c.textAlign = 'center';
    dessinerSceau(c, x, 190, 0.62);
    c.fillStyle = ENCRE;
    c.font = `${ajuster(c, textes.titre, 76, TITRE, 460)}px ${TITRE}`;
    c.fillText(textes.titre, x, 322);
    c.fillStyle = ENCRE_2;
    c.font = `28px ${TEXTE}`;
    lignesEquilibrees(c, textes.texte, 450).forEach((ligne, i) => c.fillText(ligne, x, 372 + i * 38));
    c.fillStyle = ENCRE;
    c.font = `${ajuster(c, textes.defi, 34, TITRE, 460)}px ${TITRE}`;
    c.fillText(textes.defi, x, 505);
    dessinerAdresse(c, textes.adresse, x, 562, 32, 460);
    dessinerVignettes(c, vignettes, RANGEES.paysage, { gauche: 560, largeur: 612, haut: 70, largeurCase: 100, hauteurRangee: 124, l: 96, h: 90 });
  } else {
    if (logo) dessinerLogo(c, logo, L / 2, 160, 58);
    c.fillStyle = ENCRE;
    c.font = `46px ${TITRE}`;
    c.fillText(textes.nomSite, L / 2, 276);
    dessinerSceau(c, L / 2, 420, 1);
    c.fillStyle = ENCRE;
    c.font = `${ajuster(c, textes.titre, 110, TITRE, 900)}px ${TITRE}`;
    c.fillText(textes.titre, L / 2, 640);
    c.fillStyle = ENCRE_2;
    c.font = `40px ${TEXTE}`;
    lignesEquilibrees(c, textes.texte, 820).forEach((ligne, i) => c.fillText(ligne, L / 2, 720 + i * 54));
    dessinerVignettes(c, vignettes, RANGEES.vertical, { gauche: 0, largeur: L, haut: 852, largeurCase: 196, hauteurRangee: 156, l: 160, h: 150 });
    c.fillStyle = ENCRE;
    c.font = `${ajuster(c, textes.defi, 54, TITRE, 900)}px ${TITRE}`;
    c.fillText(textes.defi, L / 2, 1712);
    dessinerAdresse(c, textes.adresse, L / 2, 1790, 50, 860);
  }

  return new Promise((ok, ko) => toile.toBlob((b) => (b ? ok(b) : ko(new Error('toBlob'))), 'image/jpeg', 0.9));
}

function dessinerLogo(c, logo, x, y, r) {
  c.save();
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.clip();
  const cote = Math.min(logo.width, logo.height);
  c.drawImage(logo, (logo.width - cote) / 2, (logo.height - cote) / 2, cote, cote, x - r, y - r, 2 * r, 2 * r);
  c.restore();
  c.beginPath();
  c.arc(x, y, r + 1, 0, Math.PI * 2);
  c.strokeStyle = ENCRE;
  c.lineWidth = Math.max(2.5, r / 15);
  c.stroke();
}

/** Le sceau rouge 伝説, un peu de travers, comme tamponné. */
function dessinerSceau(c, x, y, k) {
  c.save();
  c.translate(x, y);
  c.rotate((-8 * Math.PI) / 180);
  c.scale(k, k);
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
}

/** L'adresse de la carte, en italique rouge soulignée. */
function dessinerAdresse(c, adresse, x, y, taille, largeurMax) {
  c.font = `italic ${ajuster(c, adresse, taille, CARTE, largeurMax)}px ${CARTE}`;
  c.fillStyle = ROUGE;
  c.fillText(adresse, x, y);
  const largeur = c.measureText(adresse).width;
  c.strokeStyle = ROUGE;
  c.globalAlpha = 0.5;
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(x - largeur / 2, y + taille * 0.32);
  c.lineTo(x + largeur / 2, y + taille * 0.32);
  c.stroke();
  c.globalAlpha = 1;
}

function chargerVignettes(legendes, dessins) {
  const css = styleDessins();
  return Promise.all(legendes.map((l) => {
    const url = urlDessin(dessins[l.id], css);
    return chargerImage(url).catch(() => null).finally(() => URL.revokeObjectURL(url));
  }));
}

/** Les vignettes en rangées centrées (rangees : le nombre par rangée), avec leur ombre d'encre. */
function dessinerVignettes(c, images, rangees, { gauche, largeur, haut, largeurCase, hauteurRangee, l, h }) {
  let k = 0;
  c.save();
  c.shadowColor = 'rgba(52, 36, 18, 0.35)';
  c.shadowBlur = 5;
  c.shadowOffsetY = 2;
  rangees.forEach((n, r) => {
    const x0 = gauche + (largeur - n * largeurCase) / 2;
    for (let j = 0; j < n && k < images.length; j++, k++) {
      if (images[k]) c.drawImage(images[k], x0 + j * largeurCase + (largeurCase - l) / 2, haut + r * hauteurRangee, l, h);
    }
  });
  c.restore();
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

/** Le japonais n'a pas d'espaces : on coupe entre les mots (伝説 reste entier), la ponctuation suit le mot d'avant. */
function motsJaponais(texte) {
  if (!globalThis.Intl?.Segmenter) return [...texte];
  const mots = [];
  for (const { segment } of new Intl.Segmenter('ja', { granularity: 'word' }).segment(texte)) {
    if (mots.length && /^[\p{P}\s！？、。]+$/u.test(segment)) mots[mots.length - 1] += segment;
    else mots.push(segment);
  }
  return mots;
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
  const morceaux = /\s/.test(texte) ? texte.split(/(?<=\s)/) : motsJaponais(texte);
  const res = [];
  let ligne = '';
  for (const m of morceaux) {
    if (ligne && c.measureText(ligne + m).width > largeur) { res.push(ligne.trim()); ligne = m; } else ligne += m;
  }
  if (ligne.trim()) res.push(ligne.trim());
  return res;
}
