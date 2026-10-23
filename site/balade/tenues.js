// ================================================================
//  Les tenues : ce que le voyageur porte (un couvre-chef, des lunettes…). On gagne une pièce en trouvant tous les
//  tampons d'un lieu : une récompense, pour donner envie de les chercher (demandé par le propriétaire le
//  2026-10-23). La garde-robe (balade.js) les essaie sur le voyageur, vu de face. Ce module dit les pièces, celles
//  qui sont gagnées (d'après le carnet : rien d'autre à garder), ce que chaque voyageur porte
//  (localStorage.baladeTenue) et les récompenses déjà annoncées (localStorage.baladeTenuesVues), et dessine leurs
//  icônes. Leurs formes en 3D : personnages.js (creerHeros, porter).
// ================================================================
import { lireTampons } from './carnet.js';

export const PLACES = ['tete', 'yeux'];
/**
 * Les pièces, par place (une seule pièce par place à la fois) ; lieu : le lieu dont il faut tous les tampons (sans
 * lieu : dès le départ). 'defaut' : la casquette du garçon, le chapeau de paille de la fille.
 */
export const PIECES = [
  { id: 'defaut', place: 'tete' },
  { id: 'nue', place: 'tete' },
  { id: 'bois', place: 'tete', lieu: 'itsukushima' },
  { id: 'aucune', place: 'yeux' },
  { id: 'etoiles', place: 'yeux', lieu: 'aogashima' },
];
const PAR_DEFAUT = { tete: 'defaut', yeux: 'aucune' };
const CLE = 'baladeTenue', CLE_VUES = 'baladeTenuesVues';

const lire = (cle, defaut) => { try { return JSON.parse(localStorage.getItem(cle)) ?? defaut; } catch { return defaut; } };
const ecrire = (cle, v) => { try { localStorage.setItem(cle, JSON.stringify(v)); } catch { /* navigation privée */ } };

export const piece = (id) => PIECES.find((p) => p.id === id);
/** La récompense des tampons du lieu (ou null). */
export const recompense = (lieu) => PIECES.find((p) => p.lieu === lieu) || null;
/** total(lieu) : le nombre de tampons du lieu. Une pièce est gagnée quand tous les tampons de son lieu sont dans le carnet. */
export function gagnee(p, total) {
  if (!p.lieu) return true;
  const n = (lireTampons()[p.lieu] || []).length, t = total(p.lieu);
  return t > 0 && n >= t;
}

/** Ce que porte le voyageur sorte ({ tete, yeux }) : une pièce qui n'est plus gagnée (carnet effacé) redevient celle de départ. */
export function lireTenue(sorte, total) {
  const t = { ...PAR_DEFAUT, ...(lire(CLE, {})[sorte] || {}) };
  for (const place of PLACES) {
    const p = piece(t[place]);
    if (!p || p.place !== place || !gagnee(p, total)) t[place] = PAR_DEFAUT[place];
  }
  return t;
}
export function ecrireTenue(sorte, tenue) {
  const tout = lire(CLE, {});
  tout[sorte] = tenue;
  ecrire(CLE, tout);
}

/** Les pièces gagnées dont on n'a pas encore annoncé la récompense. */
export const nouvelles = (total) => PIECES.filter((p) => p.lieu && gagnee(p, total) && !lire(CLE_VUES, []).includes(p.id));
export function marquerVue(id) {
  const v = lire(CLE_VUES, []);
  if (!v.includes(id)) { v.push(id); ecrire(CLE_VUES, v); }
}

// ---------------------------------------------------------------- Les icônes (48 × 48, à l'encre comme le reste)
const ENCRE = '#3a3236';
/** Une étoile à cinq branches (centre cx, cy ; rayons R et r), pointe en haut. */
function etoile(cx, cy, R, r) {
  const p = [];
  for (let k = 0; k < 10; k++) {
    const a = (k * Math.PI) / 5, l = k % 2 ? r : R;
    p.push(`${(cx + Math.sin(a) * l).toFixed(1)} ${(cy - Math.cos(a) * l).toFixed(1)}`);
  }
  return `M${p.join(' L')} Z`;
}
// un trait épais en deux couches : l'encre dessous, la couleur dessus
const trait = (d, c, l) => `<path d="${d}" fill="none" stroke="${ENCRE}" stroke-width="${l + 2.6}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${l}" stroke-linecap="round" stroke-linejoin="round"/>`;
const BOIS_D = 'M17 25 L13.5 14 L9 7 M13.5 14 L17 7.5 M15.2 19.5 L20 14';

const DESSINS = {
  defautGarcon: `<path d="M9 31 Q9 14 24 13 Q38 14 39 29 Z" fill="#2f9aa0" stroke="${ENCRE}" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M33 28 Q42 28 45.5 32 Q38 34.5 30 32 Z" fill="#24797e" stroke="${ENCRE}" stroke-width="2.4" stroke-linejoin="round"/>
    <circle cx="23" cy="22" r="5" fill="#fff" stroke="${ENCRE}" stroke-width="1.6"/><path d="M20.4 24 L23 19.2 L25.6 24 Z" fill="#d8452e"/>
    <circle cx="23" cy="12.4" r="2.2" fill="#2f9aa0" stroke="${ENCRE}" stroke-width="1.6"/>`,
  defautFille: `<ellipse cx="24" cy="31" rx="20.5" ry="7" fill="#fff0cf" stroke="${ENCRE}" stroke-width="2.4"/>
    <path d="M13 30 Q13 14 24 14 Q35 14 35 30 Z" fill="#fff0cf" stroke="${ENCRE}" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M13.4 24.5 Q24 27.5 34.6 24.5 L34.8 29 Q24 32 13.2 29 Z" fill="#e0453a" stroke="${ENCRE}" stroke-width="1.6" stroke-linejoin="round"/>
    <circle cx="30.5" cy="26.6" r="3.2" fill="#fff" stroke="${ENCRE}" stroke-width="1.3"/><circle cx="30.5" cy="26.6" r="1.3" fill="#f2c443"/>`,
  nue: `<circle cx="24" cy="27" r="13" fill="#ffdcbc" stroke="${ENCRE}" stroke-width="2.4"/>
    <path d="M11.2 26 Q10.5 13 24 13 Q37.5 13 36.8 26 Q31 19 24 20 Q17 19 11.2 26 Z" fill="#553a2a" stroke="${ENCRE}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M18.5 14.5 L20 6.5 L24 13 L28.5 7 L29.5 15" fill="#553a2a" stroke="${ENCRE}" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="19.5" cy="29" r="1.9" fill="${ENCRE}"/><circle cx="28.5" cy="29" r="1.9" fill="${ENCRE}"/>`,
  bois: `${trait('M9 37 Q24 13 39 37', '#8a5a3a', 3.4)}
    <ellipse cx="10.5" cy="27" rx="6" ry="3" transform="rotate(-28 10.5 27)" fill="#b98250" stroke="${ENCRE}" stroke-width="1.8"/>
    <ellipse cx="37.5" cy="27" rx="6" ry="3" transform="rotate(28 37.5 27)" fill="#b98250" stroke="${ENCRE}" stroke-width="1.8"/>
    ${trait(BOIS_D, '#e2c596', 3)}<g transform="translate(48 0) scale(-1 1)">${trait(BOIS_D, '#e2c596', 3)}</g>`,
  aucune: `<circle cx="24" cy="24" r="16" fill="#ffdcbc" stroke="${ENCRE}" stroke-width="2.4"/>
    <ellipse cx="18" cy="23" rx="3" ry="4" fill="${ENCRE}"/><ellipse cx="30" cy="23" rx="3" ry="4" fill="${ENCRE}"/>
    <circle cx="19" cy="21.6" r="1.1" fill="#fff"/><circle cx="31" cy="21.6" r="1.1" fill="#fff"/>
    <path d="M20 31 Q24 34 28 31" fill="none" stroke="${ENCRE}" stroke-width="2" stroke-linecap="round"/>`,
  etoiles: `${trait('M19.5 24 Q24 21.5 28.5 24', '#f4c12e', 2.2)}
    <path d="${etoile(12.5, 25, 10.5, 5.2)}" fill="#f4c12e" stroke="${ENCRE}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="${etoile(35.5, 25, 10.5, 5.2)}" fill="#f4c12e" stroke="${ENCRE}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="${etoile(12.5, 25.6, 6.4, 3.2)}" fill="#4b3f8f"/><path d="${etoile(35.5, 25.6, 6.4, 3.2)}" fill="#4b3f8f"/>
    <path d="M9.5 23.5 L12 21" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><path d="M32.5 23.5 L35 21" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`,
};
/** L'icône d'une pièce (pour le voyageur sorte : son couvre-chef de départ). */
export function icone(id, sorte, taille = 48) {
  const d = DESSINS[id === 'defaut' ? (sorte === 'fille' ? 'defautFille' : 'defautGarcon') : id] || '';
  return `<svg class="piece-svg" viewBox="0 0 48 48" width="${taille}" height="${taille}" aria-hidden="true">${d}</svg>`;
}
