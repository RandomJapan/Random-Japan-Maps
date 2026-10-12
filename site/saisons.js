// ================================================================
//  Les saisons des lieux (2026-10-12). La colonne « Saisons » du tableau dit
//  quand chaque lieu est à son plus beau : « cerisiers 4; automne 11-12 »,
//  « fête 7 », « toute l'année »… (le robot la remplit pour les nouveaux lieux).
//  - Le calendrier « Quand partir ? » : 12 mois ; ceux d'un mois sont listés,
//    et les autres lieux s'effacent sur la carte (app.js).
//  - La fiche d'un lieu montre sa meilleure période, mois par mois.
// ================================================================

const sansAccent = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Les sortes de saison : leur icône, leur couleur (sur la barre des mois) et les mots qui les désignent dans le tableau
export const SORTES = {
  cerisiers: { icone: '🌸', couleur: '#d27d93', mots: ['cerisier', 'sakura', 'cherry', '桜'] },
  fleurs: { icone: '🌷', couleur: '#9a6aa8', mots: ['fleur', 'flower', '花'] },
  verdure: { icone: '🌿', couleur: '#6f9a4e', mots: ['verdure', 'vert', 'green', '新緑'] },
  ete: { icone: '☀️', couleur: '#cf9c3a', mots: ['ete', 'summer', '夏'] },
  automne: { icone: '🍁', couleur: '#b8642e', mots: ['automne', 'erable', 'autumn', 'fall', 'koyo', 'momiji', '紅葉'] },
  hiver: { icone: '❄️', couleur: '#6f93b4', mots: ['hiver', 'neige', 'winter', 'snow', '冬', '雪'] },
  fete: { icone: '🏮', couleur: '#a8321f', mots: ['fete', 'festival', 'matsuri', '祭'] },
};
// La couleur de chaque mois dans le calendrier (la saison du Japon)
const COULEUR_MOIS = ['#6f93b4', '#6f93b4', '#d27d93', '#d27d93', '#6f9a4e', '#6f9a4e', '#cf9c3a', '#cf9c3a', '#b8642e', '#b8642e', '#b8642e', '#6f93b4'];

/**
 * Lit une case « Saisons » : { annee (beau toute l'année), periodes: [{ sorte, mois: [12 booléens] }] }.
 * Les mois : « 4 », « 11-12 », « 12-2 » (par-dessus le nouvel an), « 4,5 ».
 */
export function lireSaisons(texte) {
  const res = { annee: false, periodes: [] };
  for (const morceau of String(texte || '').split(/[;\n|]+/)) {
    const m = sansAccent(morceau).trim();
    if (!m) continue;
    if (/toute|annee|all ?year|通年/.test(m)) { res.annee = true; continue; }
    const mot = m.split(/[\s\d,]/)[0];
    const sorte = Object.keys(SORTES).find((k) => SORTES[k].mots.some((w) => mot.startsWith(w)));
    if (!sorte) continue;
    const mois = Array(12).fill(false);
    for (const [, a, b] of m.matchAll(/(\d{1,2})(?:\s*-\s*(\d{1,2}))?/g)) {
      const debut = Number(a), fin = Number(b || a);
      if (debut < 1 || debut > 12 || fin < 1 || fin > 12) continue;
      for (let x = debut, n = 0; n < 12; x = (x % 12) + 1, n++) {
        mois[x - 1] = true;
        if (x === fin) break;
      }
    }
    if (mois.some(Boolean)) res.periodes.push({ sorte, mois });
  }
  if (res.periodes.length) res.annee = false; // une vraie saison l'emporte
  return res;
}

/** Les sortes de saison d'un lieu ce mois-ci (1 à 12), dans l'ordre des sortes. */
export function saisonsDuMois(l, mois) {
  return (l.saisons?.periodes || []).filter((p) => p.mois[mois - 1]).map((p) => p.sorte)
    .sort((a, b) => Object.keys(SORTES).indexOf(a) - Object.keys(SORTES).indexOf(b));
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Le nom d'un mois (1 à 12) dans la langue : « novembre », « November », « 11月 ». */
export function nomMois(mois, langue, format = 'long') {
  if (langue === 'ja') return `${mois}月`;
  return new Intl.DateTimeFormat(langue, { month: format, timeZone: 'UTC' }).format(new Date(Date.UTC(2026, mois - 1, 15)));
}

/** « novembre – décembre », « avril », « décembre – février » (les mois qui se suivent sont regroupés). */
function texteMois(mois, langue) {
  if (mois.every(Boolean)) return `${nomMois(1, langue)} – ${nomMois(12, langue)}`;
  const suites = [];
  const vide = mois.findIndex((v) => !v); // on part d'un mois vide : une suite à cheval sur le nouvel an reste entière
  for (let k = 1; k <= 12; k++) {
    const i = (vide + k) % 12;
    if (!mois[i]) continue;
    if (mois[(i + 11) % 12]) suites[suites.length - 1][1] = i;
    else suites.push([i, i]);
  }
  return suites.map(([a, b]) => (a === b ? nomMois(a + 1, langue) : `${nomMois(a + 1, langue)} – ${nomMois(b + 1, langue)}`)).join(', ');
}

/** Le bloc « Meilleure période » de la fiche : la barre des 12 mois, puis chaque saison. '' si le tableau ne dit rien. */
export function blocFiche(l, { t, langue }) {
  const s = l.saisons;
  if (!s || (!s.annee && !s.periodes.length)) return '';
  if (!s.periodes.length) return `<p class="fiche-saisons-annee"><span aria-hidden="true">✨</span> ${esc(t('saisonsAnnee'))}</p>`;
  const barre = Array.from({ length: 12 }, (_, i) => {
    const p = s.periodes.find((x) => x.mois[i]);
    const lettre = langue === 'ja' ? String(i + 1) : nomMois(i + 1, langue, 'narrow');
    return `<span${p ? ` class="oui" style="--s:${SORTES[p.sorte].couleur}"` : ''} title="${esc(nomMois(i + 1, langue))}">${esc(lettre)}</span>`;
  }).join('');
  const lignes = s.periodes.map((p) => `<li><span aria-hidden="true">${SORTES[p.sorte].icone}</span> <b>${esc(t(`saison_${p.sorte}`))}</b> · ${esc(texteMois(p.mois, langue))}</li>`).join('');
  return `<p class="fiche-saisons-titre">${esc(t('saisonsMeilleure'))}</p><div class="barre-mois" aria-hidden="true">${barre}</div><ul>${lignes}</ul>`;
}

/**
 * Le contenu du panneau « Quand partir ? » pour un mois : la grille des 12 mois, puis les lieux à leur plus beau ce
 * mois-là, groupés par saison. Les boutons : data-mois, data-lieu, data-voir-saison.
 */
export function contenuPanneau({ lieux, mois, t, langue, enLangue, pastille }) {
  const grille = Array.from({ length: 12 }, (_, i) => `<button type="button" data-mois="${i + 1}" aria-pressed="${i + 1 === mois}" style="--s:${COULEUR_MOIS[i]}">`
    + `<b>${i + 1}月</b>${langue === 'ja' ? '' : `<span>${esc(nomMois(i + 1, langue, 'short'))}</span>`}</button>`).join('');
  const groupes = new Map(Object.keys(SORTES).map((k) => [k, []]));
  for (const l of lieux) {
    const sortes = saisonsDuMois(l, mois);
    if (sortes.length) groupes.get(sortes[0]).push(l);
  }
  const n = [...groupes.values()].reduce((s, g) => s + g.length, 0);
  const nom = nomMois(mois, langue);
  const liste = [...groupes].filter(([, g]) => g.length).map(([sorte, g]) => `<li class="saison-groupe"><span aria-hidden="true">${SORTES[sorte].icone}</span> ${esc(t(`saison_${sorte}`))}</li>`
    + g.sort((a, b) => b.lat - a.lat).map((l) => `<li><button type="button" class="saison-lieu" data-lieu="${esc(l.id)}">
      ${pastille(l)}<span class="saison-textes"><b>${esc(enLangue(l.nom))}</b></span></button></li>`).join('')).join('');
  return `<p class="hasard-titre">${esc(t('saisonsTitre'))}</p>
    <div class="mois-grille" role="group" aria-label="${esc(t('saisonsTitre'))}">${grille}</div>
    <p class="panneau-info saisons-info">${esc(n ? t('saisonsInfo', nom, n) : t('saisonsAucun', nom))}</p>
    ${n ? `<ul class="liste-saison">${liste}</ul>
    <button type="button" class="btn-lancer" data-voir-saison>${esc(t('saisonsVoir', n))}</button>` : ''}`;
}

/** Les lieux d'un mois (ceux qui y sont à leur plus beau). */
export const lieuxDuMois = (lieux, mois) => lieux.filter((l) => saisonsDuMois(l, mois).length);

/** L'icône d'une saison pour un mois (celle de la première saison des lieux de ce mois, sinon la saison du Japon). */
export function iconeDuMois(mois) {
  return SORTES[{ 1: 'hiver', 2: 'hiver', 3: 'cerisiers', 4: 'cerisiers', 5: 'verdure', 6: 'verdure', 7: 'ete', 8: 'ete', 9: 'automne', 10: 'automne', 11: 'automne', 12: 'hiver' }[mois]].icone;
}
