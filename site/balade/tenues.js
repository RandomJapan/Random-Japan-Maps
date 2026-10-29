// ================================================================
//  Les tenues : ce que le voyageur porte (un couvre-chef, des lunettes…). On gagne une pièce en trouvant tous les
//  tampons d'un lieu : une récompense, pour donner envie de les chercher (demandé par le propriétaire le
//  2026-10-23). Le 2026-10-23, d'autres s'achètent au marchand avec les koban des secrets (tresors.js) : des tenues
//  entières, ce qu'on laisse sous ses pas, ce que porte le compagnon. La garde-robe (balade.js) les essaie sur le
//  voyageur, vu de face. Ce module dit les pièces, celles qui sont gagnées (d'après le carnet et les achats : rien
//  d'autre à garder), ce que chaque voyageur porte
//  (localStorage.baladeTenue) et les récompenses déjà annoncées (localStorage.baladeTenuesVues), et dessine leurs
//  icônes. Leurs formes en 3D : personnages.js (creerHeros, porter).
// ================================================================
import { lireTampons } from './carnet.js';
import { aAchete } from './tresors.js';

// (le 2026-10-23, des pièces qu'on achète au marchand avec les koban des secrets, tresors.js : achat ; et trois places
// de plus : la tenue entière, ce qu'on laisse sous ses pas, ce que porte le compagnon ; puis, avec Gokayama, ce qu'on
// porte sur le dos : le sac, ou le mino, la cape de paille ; avec Takachiho, ce qu'on porte au cou : le collier de magatama ;
// avec Kinkaku-ji, sur le dos encore : les ailes du phénix, des plumes d'or qui s'ouvrent quand on court)
export const PLACES = ['tete', 'yeux', 'habit', 'dos', 'cou', 'pas', 'compagnon'];
/**
 * Les pièces, par place (une seule pièce par place à la fois) ; lieu : le lieu dont il faut tous les tampons ; achat :
 * l'article du marchand qui la débloque (tresors.js) ; sans l'un ni l'autre : dès le départ. 'defaut' : la casquette du
 * garçon, le chapeau de paille de la fille.
 */
export const PIECES = [
  { id: 'defaut', place: 'tete' },
  { id: 'nue', place: 'tete' },
  { id: 'bois', place: 'tete', lieu: 'itsukushima' },
  { id: 'heron', place: 'tete', lieu: 'himeji' },
  { id: 'cornes', place: 'tete', lieu: 'beppu' },
  { id: 'renard', place: 'tete', lieu: 'motonosumi' },
  { id: 'kabuto', place: 'tete', achat: 'armure' },
  { id: 'aucune', place: 'yeux' },
  { id: 'etoiles', place: 'yeux', lieu: 'aogashima' },
  { id: 'masque', place: 'yeux', achat: 'masque' },
  { id: 'habit-defaut', place: 'habit' },
  { id: 'happi', place: 'habit', achat: 'happi' },
  { id: 'yukata', place: 'habit', achat: 'yukata' },
  { id: 'kimonoOr', place: 'habit', achat: 'kimonoOr' },
  { id: 'armure', place: 'habit', achat: 'armure' },
  { id: 'sac', place: 'dos' },
  { id: 'mino', place: 'dos', lieu: 'gokayama' },
  { id: 'ailes', place: 'dos', lieu: 'kinkakuji' },
  { id: 'cou-rien', place: 'cou' },
  { id: 'magatama', place: 'cou', lieu: 'takachiho' },
  { id: 'yamabushi', place: 'cou', lieu: 'sanjubutsu' },
  { id: 'trace-aucune', place: 'pas' },
  { id: 'trace-petales', place: 'pas', achat: 'traces' },
  { id: 'trace-etoiles', place: 'pas', achat: 'traces' },
  { id: 'trace-feuilles', place: 'pas', achat: 'traces' },
  { id: 'cp-defaut', place: 'compagnon' },
  { id: 'cp-bandana', place: 'compagnon', achat: 'accessoires' },
  { id: 'cp-chapeau', place: 'compagnon', achat: 'accessoires' },
  { id: 'cp-grelot', place: 'compagnon', achat: 'accessoires' },
];
const PAR_DEFAUT = { tete: 'defaut', yeux: 'aucune', habit: 'habit-defaut', dos: 'sac', cou: 'cou-rien', pas: 'trace-aucune', compagnon: 'cp-defaut' };
const CLE = 'baladeTenue', CLE_VUES = 'baladeTenuesVues';

const lire = (cle, defaut) => { try { return JSON.parse(localStorage.getItem(cle)) ?? defaut; } catch { return defaut; } };
const ecrire = (cle, v) => { try { localStorage.setItem(cle, JSON.stringify(v)); } catch { /* navigation privée */ } };

export const piece = (id) => PIECES.find((p) => p.id === id);
/** La récompense des tampons du lieu (ou null). */
export const recompense = (lieu) => PIECES.find((p) => p.lieu === lieu) || null;
/** total(lieu) : le nombre de tampons du lieu. Une pièce est gagnée quand tous les tampons de son lieu sont dans le carnet. */
export function gagnee(p, total) {
  if (p.achat) return aAchete(p.achat);
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
  // la coiffe du héron blanc (Himeji) : un bandeau blanc, une tête de héron au bec jaune posée devant, et derrière, les
  // longues plumes blanches de la parade (les aigrettes) qui retombent
  heron: `<path d="M27 21 Q36 10 46 13 Q38 14 31 22 M25 20 Q30 6 41 4 Q33 8 28 20 M23 20 Q24 9 31 2 Q27 10 26 20" fill="#ffffff" stroke="${ENCRE}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M6 30 Q24 21 42 30 L41 35 Q24 27 7 35 Z" fill="#ffffff" stroke="${ENCRE}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M17 26 Q16 17 21 15 Q25 14 26 18 Q26 22 22 25 Z" fill="#ffffff" stroke="${ENCRE}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M21 16.6 L7 14 L20.6 19.4 Z" fill="#f2c443" stroke="${ENCRE}" stroke-width="1.6" stroke-linejoin="round"/>
    <circle cx="22.6" cy="17.6" r="1.4" fill="${ENCRE}"/><path d="M23.6 15.6 Q28 14.6 30 17" fill="none" stroke="${ENCRE}" stroke-width="1.4" stroke-linecap="round"/>`,
  // les cornes d'oni (Beppu) : un serre-tête en peau de tigre (jaune rayé de noir), deux cornes rouges, courbes, pointe claire
  cornes: `<path d="M8 36 Q24 14 40 36" fill="none" stroke="${ENCRE}" stroke-width="7" stroke-linecap="round"/>
    <path d="M8 36 Q24 14 40 36" fill="none" stroke="#e8a42a" stroke-width="4.4" stroke-linecap="round"/>
    <path d="M13.5 28.5 l2.6 2 M19 24.2 l1.6 2.6 M27.4 24.2 l-1.6 2.6 M33 28.4 l-2.6 2" stroke="#2a2420" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M14.6 25.6 Q10 16 14.4 7 Q16.4 15 20.6 22.4 Z" fill="#d9482f" stroke="${ENCRE}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M33.4 25.6 Q38 16 33.6 7 Q31.6 15 27.4 22.4 Z" fill="#d9482f" stroke="${ENCRE}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M14.4 7 Q15 10.6 16 12.6 M33.6 7 Q33 10.6 32 12.6" stroke="#f2e6c8" stroke-width="2.2" stroke-linecap="round"/>`,
  // les oreilles et la queue de renard (Motonosumi) : un serre-tête blanc, deux oreilles pointues blanches, rouges dedans ;
  // derrière, la queue blanche touffue au bout doré, relevée
  renard: `<path d="M30 40 Q44 38 45 27 Q46 16 39 11 Q42 20 37 27 Q33 33 25 34 Z" fill="#fbf8f0" stroke="${ENCRE}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M39 11 Q43 14 44.4 19.5 Q41 19 39.6 16 Z" fill="#e8b941" stroke="${ENCRE}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M6 36 Q22 16 38 34" fill="none" stroke="${ENCRE}" stroke-width="6.4" stroke-linecap="round"/>
    <path d="M6 36 Q22 16 38 34" fill="none" stroke="#fbf8f0" stroke-width="3.8" stroke-linecap="round"/>
    <path d="M10.4 27.6 L8.6 9.4 L20 22.6 Z" fill="#fbf8f0" stroke="${ENCRE}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M25.2 21.8 L32.4 6.8 L33.6 25.4 Z" fill="#fbf8f0" stroke="${ENCRE}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M11.6 24.4 L10.6 14 L17.2 21.6 Z M27.6 21.6 L31.6 12.4 L31.8 23 Z" fill="#e0533e"/>`,
  aucune: `<circle cx="24" cy="24" r="16" fill="#ffdcbc" stroke="${ENCRE}" stroke-width="2.4"/>
    <ellipse cx="18" cy="23" rx="3" ry="4" fill="${ENCRE}"/><ellipse cx="30" cy="23" rx="3" ry="4" fill="${ENCRE}"/>
    <circle cx="19" cy="21.6" r="1.1" fill="#fff"/><circle cx="31" cy="21.6" r="1.1" fill="#fff"/>
    <path d="M20 31 Q24 34 28 31" fill="none" stroke="${ENCRE}" stroke-width="2" stroke-linecap="round"/>`,
  etoiles: `${trait('M19.5 24 Q24 21.5 28.5 24', '#f4c12e', 2.2)}
    <path d="${etoile(12.5, 25, 10.5, 5.2)}" fill="#f4c12e" stroke="${ENCRE}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="${etoile(35.5, 25, 10.5, 5.2)}" fill="#f4c12e" stroke="${ENCRE}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="${etoile(12.5, 25.6, 6.4, 3.2)}" fill="#4b3f8f"/><path d="${etoile(35.5, 25.6, 6.4, 3.2)}" fill="#4b3f8f"/>
    <path d="M9.5 23.5 L12 21" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><path d="M32.5 23.5 L35 21" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`,
  // le casque de samouraï : le bol à côtes, les ailerons, le couvre-nuque, les cornes dorées
  kabuto: `<path d="M8 34 Q8 15 24 14 Q40 15 40 34 Z" fill="#3f3d4a" stroke="${ENCRE}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M16 15.5 Q14 25 15 33 M24 14 V33 M32 15.5 Q34 25 33 33" stroke="#6a6878" stroke-width="1.4" fill="none"/>
    <path d="M5 33 L43 33 L46 40 Q24 44 2 40 Z" fill="#b8322a" stroke="${ENCRE}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M5 37 H43" stroke="#e8b941" stroke-width="1.3"/>
    <path d="M24 18 Q15 13 10 3 Q16 8 22 11 Z M24 18 Q33 13 38 3 Q32 8 26 11 Z" fill="#f4c12e" stroke="${ENCRE}" stroke-width="1.6" stroke-linejoin="round"/>
    <circle cx="24" cy="18" r="3.2" fill="#f4c12e" stroke="${ENCRE}" stroke-width="1.5"/>`,
  // le masque de renard des fêtes : blanc, les oreilles et les marques rouges
  masque: `<path d="M24 8 L30 14 L38 6 L37 20 Q42 30 24 43 Q6 30 11 20 L10 6 L18 14 Z" fill="#fbf8f2" stroke="${ENCRE}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M12 9 L15 15 M36 9 L33 15" stroke="#d8302c" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M14 24 Q18 21 21 25 M34 24 Q30 21 27 25" fill="none" stroke="${ENCRE}" stroke-width="2" stroke-linecap="round"/>
    <path d="M13 21 Q17 17 20 21 M35 21 Q31 17 28 21" fill="none" stroke="#d8302c" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M21 33 Q24 36 27 33" fill="none" stroke="${ENCRE}" stroke-width="1.8" stroke-linecap="round"/><circle cx="24" cy="31" r="1.8" fill="${ENCRE}"/>
    <path d="M24 9 V15" stroke="#d8302c" stroke-width="2" stroke-linecap="round"/>`,
  // les habits de chaque jour : la veste rouge ouverte du garçon ; le chemisier au col marin de la fille
  habitGarcon: `<path d="M10 14 L18 9 Q24 13 30 9 L38 14 L44 26 L37 29 L35 24 V42 H13 V24 L11 29 L4 26 Z" fill="#e8583e" stroke="${ENCRE}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M19 11 L24 22 L29 11 V42 H19 Z" fill="#fbf6ea" stroke="${ENCRE}" stroke-width="1.8" stroke-linejoin="round"/>`,
  habitFille: `<path d="M10 14 L18 9 Q24 13 30 9 L38 14 L44 26 L37 29 L35 24 V42 H13 V24 L11 29 L4 26 Z" fill="#f59aa6" stroke="${ENCRE}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M17 10 L24 22 L31 10" fill="none" stroke="#ffffff" stroke-width="3.4"/><path d="M17 10 L24 22 L31 10" fill="none" stroke="#2f4a7a" stroke-width="1.2"/>
    <path d="M20 24 L24 22 L28 24 L24 27 Z" fill="#e0453a" stroke="${ENCRE}" stroke-width="1.4"/>`,
  // la veste de fête (happi) : indigo, le col blanc, le cercle « 祭 » dans le dos
  happi: `<path d="M9 13 L18 8 L24 12 L30 8 L39 13 L46 24 L38 28 L36 23 V43 H12 V23 L10 28 L2 24 Z" fill="#2f4a8a" stroke="${ENCRE}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M18 8 L22 43 M30 8 L26 43" stroke="#fbf6ea" stroke-width="3.6"/>
    <path d="M12 38 H36" stroke="#fbf6ea" stroke-width="2.4"/><path d="M14 33 H34" stroke="#d8302c" stroke-width="2.2"/>`,
  // le yukata : bleu nuit aux fleurs, la ceinture et son nœud
  yukata: `<path d="M8 12 L18 7 L24 12 L30 7 L40 12 L46 30 L38 32 L34 22 L35 45 H13 L14 22 L10 32 L2 30 Z" fill="#2f3f75" stroke="${ENCRE}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M18 7 L28 30 M30 7 L22 22" stroke="#fbf6ea" stroke-width="1.6"/>
    <rect x="13" y="24" width="22" height="6" fill="#f2c443" stroke="${ENCRE}" stroke-width="1.6"/>
    <circle cx="17" cy="37" r="2.6" fill="#f7b4c6"/><circle cx="30" cy="40" r="2.2" fill="#ffffff"/><circle cx="27" cy="16" r="1.8" fill="#f7b4c6"/>`,
  // le kimono d'or : or, une grue blanche, la ceinture rouge
  kimonoOr: `<path d="M8 12 L18 7 L24 12 L30 7 L40 12 L46 30 L38 32 L34 22 L35 45 H13 L14 22 L10 32 L2 30 Z" fill="#f0c447" stroke="${ENCRE}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M18 7 L28 30 M30 7 L22 22" stroke="#fbf6ea" stroke-width="2"/>
    <rect x="13" y="24" width="22" height="6" fill="#c8302c" stroke="${ENCRE}" stroke-width="1.6"/><path d="M13 27 H35" stroke="#f4c12e" stroke-width="1"/>
    <path d="M18 38 Q22 33 27 36 Q30 32 33 34 L28 38 Q24 41 18 38 Z" fill="#ffffff" stroke="${ENCRE}" stroke-width="1.2"/><circle cx="31" cy="34" r="1" fill="#d8302c"/>`,
  // l'armure de samouraï : la cuirasse rouge laquée, ses lacets, les grandes épaulières
  armure: `<path d="M13 12 Q24 8 35 12 L37 33 H11 Z" fill="#b8322a" stroke="${ENCRE}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M12 18 H36 M12 23 H36 M11.5 28 H36.5" stroke="#e8b941" stroke-width="1.2" stroke-dasharray="2 2"/>
    <path d="M3 13 L13 11 L14 27 L4 28 Z M45 13 L35 11 L34 27 L44 28 Z" fill="#3f3d4a" stroke="${ENCRE}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M4 18 L13.5 17 M4 23 L14 22 M44 18 L34.5 17 M44 23 L34 22" stroke="#5a7ac0" stroke-width="1.3"/>
    <path d="M11 33 L9 44 H19 L20 33 M28 33 L29 44 H39 L37 33" fill="#b8322a" stroke="${ENCRE}" stroke-width="1.8" stroke-linejoin="round"/>`,
  // sur le dos : le sac de tous les jours (jaune et son tapis roulé ; rose et son porte-bonheur) ; le mino, la cape de
  // paille de Gokayama, en trois rangs qui s'effilochent, son col de corde
  sacGarcon: `<path d="M12 16 Q12 9 24 9 Q36 9 36 16 V40 Q36 43 33 43 H15 Q12 43 12 40 Z" fill="#f2bd45" stroke="${ENCRE}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M12 17 Q24 23 36 17 V25 Q24 30 12 25 Z" fill="#d99a2a" stroke="${ENCRE}" stroke-width="1.8" stroke-linejoin="round"/>
    <rect x="17" y="31" width="14" height="9" rx="2" fill="#d99a2a" stroke="${ENCRE}" stroke-width="1.6"/>
    <rect x="9" y="5" width="30" height="7" rx="3.5" fill="#3f8a7a" stroke="${ENCRE}" stroke-width="1.8"/>`,
  sacFille: `<path d="M12 16 Q12 9 24 9 Q36 9 36 16 V40 Q36 43 33 43 H15 Q12 43 12 40 Z" fill="#f6a5a0" stroke="${ENCRE}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M12 17 Q24 23 36 17 V25 Q24 30 12 25 Z" fill="#e07f7c" stroke="${ENCRE}" stroke-width="1.8" stroke-linejoin="round"/>
    <rect x="17" y="31" width="14" height="9" rx="2" fill="#e07f7c" stroke="${ENCRE}" stroke-width="1.6"/>
    <path d="M37 22 V30" stroke="${ENCRE}" stroke-width="1.2"/><rect x="35" y="30" width="5" height="7" fill="#e0453a" stroke="${ENCRE}" stroke-width="1.2"/>`,
  mino: `<path d="M17 8 Q24 5 31 8 L37 22 L40 38 Q24 44 8 38 L11 22 Z" fill="#c9a65a" stroke="${ENCRE}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M10 22 Q24 27 38 22 M9 31 Q24 36 39 31" fill="none" stroke="#a8874a" stroke-width="2"/>
    ${[11, 15, 19, 23, 27, 31, 35, 38].map((x) => `<path d="M${x} 38 l1 5" stroke="#a8874a" stroke-width="1.6" stroke-linecap="round"/>`).join('')}
    ${[14, 18, 22, 26, 30, 34].map((x) => `<path d="M${x} 12 L${x - 2 + (x - 24) * 0.2} 36" stroke="#b8975a" stroke-width="1"/>`).join('')}
    <ellipse cx="24" cy="8.5" rx="8" ry="3" fill="#d9bd78" stroke="${ENCRE}" stroke-width="1.6"/>`,
  // les ailes du phénix (le Pavillon d'or) : deux ailes d'or en éventail de longues plumes, dressées vers le haut
  ailes: `${[-1, 1].map((s) => [0, 1, 2, 3, 4].map((k) => { const a = (s < 0 ? Math.PI : 0) + s * (0.35 + k * 0.28), l = 13 + k * 2.4; return `<path d="M${24 + s * 3} 30 L${(24 + s * 3 + Math.cos(a) * l * 0.55 - Math.sin(a) * 2.6).toFixed(1)} ${(30 - Math.sin(a) * l * 0.55 - Math.cos(a) * 2.6 * s).toFixed(1)} L${(24 + s * 3 + Math.cos(a) * l).toFixed(1)} ${(30 - Math.sin(a) * l).toFixed(1)} Z" fill="${k % 2 ? '#f4c845' : '#e2a92e'}" stroke="${ENCRE}" stroke-width="1.6" stroke-linejoin="round"/>`; }).join('')).join('')}
    <ellipse cx="24" cy="32" rx="5" ry="7" fill="#f4c845" stroke="${ENCRE}" stroke-width="1.8"/>`,
  // au cou : rien (le haut d'un tee-shirt) ; le collier de magatama de Takachiho (le cordon, ses perles, le joyau de jade)
  'cou-rien': `<path d="M4 44 Q5 31 16 28 Q19 34 24 34 Q29 34 32 28 Q43 31 44 44 Z" fill="#f4f0e6" stroke="${ENCRE}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M18 16 V28 Q24 33 30 28 V16" fill="#ffdcbc" stroke="${ENCRE}" stroke-width="2.2" stroke-linejoin="round"/>`,
  magatama: `${trait('M9 9 Q11 29 24 31 Q37 29 39 9', '#7a2a24', 2)}
    ${[[11.2, 19], [15.4, 25.6], [32.6, 25.6], [36.8, 19]].map(([x, y], k) => `<circle cx="${x}" cy="${y}" r="2.7" fill="${k % 3 ? '#e8f2ee' : '#d8642a'}" stroke="${ENCRE}" stroke-width="1.3"/>`).join('')}
    <path d="M26 29 A6.5 6.5 0 1 1 26 42 Q21.5 42 20 46.5 Q14 40 19.6 33.6 A6.5 6.5 0 0 1 26 29 Z" fill="#3f9a64" stroke="${ENCRE}" stroke-width="2.1" stroke-linejoin="round"/>
    <path d="M23 32.5 Q26 31 29 33" fill="none" stroke="#9fe0b4" stroke-width="1.6" stroke-linecap="round"/><circle cx="26.5" cy="35" r="1.6" fill="${ENCRE}"/>`,
  // l'étole du yamabushi (les Trente Bouddhas) : la bande sur les épaules, ses six pompons, la conque pendue à son cordon
  yamabushi: `${trait('M10 8 Q12 26 24 30 Q36 26 38 8', '#e8e4d8', 3)}
    ${[[12.2, 16], [15.6, 23.4], [20.6, 28.4], [27.4, 28.4], [32.4, 23.4], [35.8, 16]].map(([x, y], k) => `<circle cx="${x}" cy="${y}" r="3.4" fill="${k % 2 ? '#f6f2e8' : '#e8e2d2'}" stroke="${ENCRE}" stroke-width="1.4"/>`).join('')}
    <path d="M30 31 Q41 30 42 38 Q42 45 34 45 Q27 44 28 37 Q28 33 30 31 Z" fill="#f2e6cf" stroke="${ENCRE}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M31 35 Q35 33 38 36 M30 39 Q34 37 39 40" fill="none" stroke="#c98a52" stroke-width="1.6" stroke-linecap="round"/>`,
  // sous tes pas : rien ; des pétales ; des étoiles ; des feuilles d'érable
  'trace-aucune': `<path d="M8 32 Q10 24 18 24 L28 26 Q36 27 36 32 Q36 37 28 37 H12 Q8 37 8 32 Z" fill="#ffffff" stroke="${ENCRE}" stroke-width="2"/>
    <path d="M8 34.5 H36" stroke="#d8452e" stroke-width="2.4"/>`,
  'trace-petales': `${[[14, 30, -30], [24, 18, 20], [34, 30, 60], [22, 36, -70], [33, 14, -10]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="3.6" ry="6" transform="rotate(${r} ${x} ${y})" fill="#f7b4c6" stroke="${ENCRE}" stroke-width="1.5"/><path d="M${x} ${y - 6} l-1 2.2 l2 0 z" fill="${ENCRE}" transform="rotate(${r} ${x} ${y})"/>`).join('')}`,
  'trace-etoiles': `<path d="${etoile(24, 22, 13, 5.5)}" fill="#f4c12e" stroke="${ENCRE}" stroke-width="2" stroke-linejoin="round"/>
    <path d="${etoile(9, 37, 5.5, 2.4)}" fill="#fff3a8" stroke="${ENCRE}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="${etoile(39, 38, 4.5, 2)}" fill="#fff3a8" stroke="${ENCRE}" stroke-width="1.4" stroke-linejoin="round"/>`,
  'trace-feuilles': `<path d="M24 6 L27 15 L34 10 L32 19 L41 19 L33 25 L38 32 L29 30 L28 37 L25 32 L24 44 L23 32 L20 37 L19 30 L10 32 L15 25 L7 19 L16 19 L14 10 L21 15 Z" fill="#e0602a" stroke="${ENCRE}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M24 13 V40 M24 26 L32 20 M24 26 L16 20" stroke="#a83a1c" stroke-width="1.3" fill="none"/>`,
  // ce que porte le compagnon : rien de plus ; un foulard à pois ; un petit chapeau de paille ; un grelot
  'cp-defaut': `<circle cx="24" cy="26" r="14" fill="#ffffff" stroke="${ENCRE}" stroke-width="2.2"/>
    <path d="M12 18 L9 4 L20 13 Z M36 18 L39 4 L28 13 Z" fill="#ffffff" stroke="${ENCRE}" stroke-width="2.2" stroke-linejoin="round"/>
    <circle cx="19" cy="25" r="2" fill="${ENCRE}"/><circle cx="29" cy="25" r="2" fill="${ENCRE}"/><ellipse cx="24" cy="31" rx="2.6" ry="1.8" fill="${ENCRE}"/>`,
  'cp-bandana': `<path d="M5 18 Q24 26 43 18 L41 25 Q24 33 7 25 Z" fill="#2f6fb0" stroke="${ENCRE}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M18 27 L24 44 L30 27" fill="#2f6fb0" stroke="${ENCRE}" stroke-width="2" stroke-linejoin="round"/>
    ${[[11, 22], [18, 25], [30, 25], [37, 22], [24, 33], [22, 29], [26, 38]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="#fff"/>`).join('')}`,
  'cp-chapeau': `<path d="M4 32 L24 10 L44 32 Q24 38 4 32 Z" fill="#e6c87a" stroke="${ENCRE}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M12 27 Q24 31 36 27 M17 21 Q24 24 31 21" fill="none" stroke="#c9a65a" stroke-width="1.6"/>
    <circle cx="24" cy="10" r="2.4" fill="#c9a65a" stroke="${ENCRE}" stroke-width="1.4"/>`,
  'cp-grelot': `<path d="M8 14 Q24 24 40 14" fill="none" stroke="${ENCRE}" stroke-width="5.4" stroke-linecap="round"/><path d="M8 14 Q24 24 40 14" fill="none" stroke="#e0453a" stroke-width="3" stroke-linecap="round"/>
    <circle cx="24" cy="31" r="11" fill="#e8b941" stroke="${ENCRE}" stroke-width="2.2"/>
    <path d="M14 31 H34 M24 31 V41" stroke="${ENCRE}" stroke-width="2"/><circle cx="24" cy="36" r="2" fill="${ENCRE}"/>
    <path d="M18 25 Q20 22 24 21" fill="none" stroke="#fff6c8" stroke-width="2" stroke-linecap="round"/>`,
};
/** L'icône d'une pièce (pour le voyageur sorte : son couvre-chef de départ, ses habits de chaque jour). */
export function icone(id, sorte, taille = 48) {
  const cle = id === 'defaut' ? (sorte === 'fille' ? 'defautFille' : 'defautGarcon') : id === 'habit-defaut' ? (sorte === 'fille' ? 'habitFille' : 'habitGarcon')
    : id === 'sac' ? (sorte === 'fille' ? 'sacFille' : 'sacGarcon') : id;
  const d = DESSINS[cle] || '';
  return `<svg class="piece-svg" viewBox="0 0 48 48" width="${taille}" height="${taille}" aria-hidden="true">${d}</svg>`;
}
