// ================================================================
//  Les trésors de la balade (demandés par le propriétaire le 2026-10-23) : chaque lieu cache un secret, difficile à
//  trouver, pour les joueurs les plus attentifs (Itsukushima : les corbeaux sacrés ; Aogashima : la boîte enterrée ;
//  Gokayama : depuis le 2026-10-24, la luciole dorée qui mène à la tombe d'un guerrier Heike ; Himeji : la dixième
//  assiette d'Okiku, à rapporter la nuit à son vieux puits ; Takachiho : le miroir du soleil ; le Pavillon d'or : le phénix
//  qui manque au reflet la nuit, retrouvé à la source de la Voie lactée).
//  Un secret trouvé donne un koban, une vieille pièce d'or de l'époque d'Edo ; Bunbuku, le marchand ambulant (un
//  vieux tanuki, l'oncle de Pon), n'accepte qu'eux, et vend des objets précieux (ARTICLES). Rien d'autre à garder que
//  les secrets trouvés, les indices vus et les achats : le nombre de koban s'en déduit.
//  localStorage : baladeSecrets { trouves: [id…], indices: [id…] }, baladeAchats [id…] ; en mode développeur
//  (localStorage.modeDev = 'oui', celui de la carte), baladeKobanDev : des koban de plus pour tout essayer.
// ================================================================

/** Le secret de chaque lieu. */
export const SECRETS = { itsukushima: 'corbeaux', aogashima: 'tresor', gokayama: 'heike', himeji: 'okiku', takachiho: 'miroir', kinkakuji: 'phenix', beppu: 'ippen', motonosumi: 'torii124', sanjubutsu: 'oni' };
/** Les secrets en plus d'un lieu, un koban chacun ; le carnet ne les montre qu'une fois trouvés (2026-10-29 : la grotte de l'ermite
 * des Trente Bouddhas, derrière la cascade). */
export const SECRETS_EN_PLUS = { sanjubutsu: ['iwaya'] };
/**
 * Ce que vend Bunbuku, du moins cher au plus cher. sorte : 'objet' (on s'en sert depuis le menu), 'tenue' (dans la
 * garde-robe), 'compagnon' (un nouveau compagnon). pieces : les pièces de tenue qu'il débloque (tenues.js).
 */
export const ARTICLES = [
  { id: 'danse', prix: 1, sorte: 'objet' },
  { id: 'traces', prix: 1, sorte: 'tenue', pieces: ['trace-petales', 'trace-etoiles', 'trace-feuilles'] },
  { id: 'accessoires', prix: 1, sorte: 'tenue', pieces: ['cp-bandana', 'cp-chapeau', 'cp-grelot'] },
  { id: 'feux', prix: 2, sorte: 'objet' },
  { id: 'masque', prix: 2, sorte: 'tenue', pieces: ['masque'] },
  { id: 'happi', prix: 2, sorte: 'tenue', pieces: ['happi'] },
  { id: 'yukata', prix: 3, sorte: 'tenue', pieces: ['yukata'] },
  { id: 'photo', prix: 3, sorte: 'objet' },
  { id: 'gao', prix: 5, sorte: 'compagnon' },
  { id: 'fuwa', prix: 5, sorte: 'compagnon' },
  { id: 'saya', prix: 5, sorte: 'compagnon' },
  { id: 'calendrier', prix: 5, sorte: 'objet' },
  { id: 'kimonoOr', prix: 5, sorte: 'tenue', pieces: ['kimonoOr'] },
  { id: 'armure', prix: 5, sorte: 'tenue', pieces: ['armure', 'kabuto'] },
];
export const article = (id) => ARTICLES.find((a) => a.id === id);

const lire = (cle, defaut) => { try { return JSON.parse(localStorage.getItem(cle)) ?? defaut; } catch { return defaut; } };
const ecrire = (cle, v) => { try { localStorage.setItem(cle, JSON.stringify(v)); } catch { /* navigation privée */ } };
const etat = () => { const s = lire('baladeSecrets', {}); return { trouves: s.trouves || [], indices: s.indices || [] }; };

/** Le mode développeur de la carte est-il ouvert dans ce navigateur ? (des koban pour tout essayer) */
export const modeDev = () => { try { return localStorage.getItem('modeDev') === 'oui'; } catch { return false; } };

export const secretTrouve = (id) => etat().trouves.includes(id);
/** Le secret id est trouvé ; vrai s'il ne l'était pas encore. */
export function trouverSecret(id) {
  const s = etat();
  if (s.trouves.includes(id)) return false;
  s.trouves.push(id);
  ecrire('baladeSecrets', s);
  return true;
}
/** Un indice vu (la carte au trésor du cahier…) : on s'en souvient d'une visite à l'autre. */
export const indiceVu = (id) => etat().indices.includes(id);
export function voirIndice(id) {
  const s = etat();
  if (!s.indices.includes(id)) { s.indices.push(id); ecrire('baladeSecrets', s); }
}

export const achats = () => lire('baladeAchats', []);
export const aAchete = (id) => achats().includes(id);
/** Les koban qu'on a : un par secret trouvé (et ceux du mode développeur), moins ce qu'on a dépensé. */
export function koban() {
  const depense = achats().reduce((s, id) => s + (article(id)?.prix || 0), 0);
  return etat().trouves.length + (modeDev() ? lire('baladeKobanDev', 0) : 0) - depense;
}
/** Tous les koban jamais trouvés (pour savoir s'il faut en parler). */
export const kobanTrouves = () => etat().trouves.length + (modeDev() ? lire('baladeKobanDev', 0) : 0);
/** Achète l'article id : vrai si c'est fait (assez de koban, pas déjà à soi). */
export function acheter(id) {
  const a = article(id);
  if (!a || aAchete(id) || koban() < a.prix) return false;
  ecrire('baladeAchats', [...achats(), id]);
  return true;
}
/** Mode développeur : un koban de plus ; ou tout remettre à zéro (les achats et ces koban-là). */
export function kobanDev(n = 1) { ecrire('baladeKobanDev', lire('baladeKobanDev', 0) + n); }
/** Mode développeur : tout recommencer (les achats, les koban en plus, les secrets et les indices, Bunbuku à rencontrer). */
export function remettreDev() {
  ecrire('baladeAchats', []);
  ecrire('baladeKobanDev', 0);
  ecrire('baladeSecrets', { trouves: [], indices: [] });
  try { localStorage.removeItem('baladeMarchandVu'); } catch {}
}

// ---------------------------------------------------------------- Les dessins (à l'encre, comme le reste)
const ENCRE = '#3a3236';
/** Un koban : la pièce d'or ovale, ses fines rayures, deux fleurs de paulownia frappées et « 壱両 » (un ryō). */
export function dessinKoban(taille = 48, id = 'k') {
  const g = `koban-or-${id}`;
  const kiri = (y) => `<g transform="translate(50 ${y})"><circle r="7.2" fill="none" stroke="#9a6a1c" stroke-width="1.4"/>`
    + '<path d="M-3.6 1.6 Q-3.6 -4.2 0 -4.6 Q3.6 -4.2 3.6 1.6 M0 -4.6 V3.6 M-4.8 3.6 H4.8" fill="none" stroke="#9a6a1c" stroke-width="1.3" stroke-linecap="round"/></g>';
  let rayures = '';
  for (let y = 18; y <= 104; y += 4.2) rayures += `<path d="M18 ${y.toFixed(1)} H82" stroke="#d9a63e" stroke-width="0.9"/>`;
  return `<svg class="koban-svg" viewBox="0 0 100 122" width="${taille}" height="${(taille * 1.22).toFixed(1)}" aria-hidden="true">
    <defs><radialGradient id="${g}" cx="38%" cy="30%" r="80%"><stop offset="0" stop-color="#fff2b5"/><stop offset="0.45" stop-color="#f2c84f"/><stop offset="1" stop-color="#c58d26"/></radialGradient>
    <clipPath id="${g}-c"><ellipse cx="50" cy="61" rx="34" ry="51"/></clipPath></defs>
    <ellipse cx="50" cy="61" rx="40" ry="57" fill="url(#${g})" stroke="${ENCRE}" stroke-width="3.4"/>
    <ellipse cx="50" cy="61" rx="34" ry="51" fill="none" stroke="#b07a22" stroke-width="2"/>
    <g clip-path="url(#${g}-c)" opacity="0.75">${rayures}</g>
    ${kiri(22)}${kiri(100)}
    <text x="50" y="58" font-size="19" font-weight="800" text-anchor="middle" fill="#8a5a16" font-family="'M PLUS Rounded 1c', sans-serif">壱</text>
    <text x="50" y="80" font-size="19" font-weight="800" text-anchor="middle" fill="#8a5a16" font-family="'M PLUS Rounded 1c', sans-serif">両</text>
    <path d="M27 34 Q33 22 44 18" fill="none" stroke="#fffbe8" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
  </svg>`;
}

// un trait épais en deux couches : l'encre dessous, la couleur dessus
const trait = (d, c, l) => `<path d="${d}" fill="none" stroke="${ENCRE}" stroke-width="${l + 2.6}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${l}" stroke-linecap="round" stroke-linejoin="round"/>`;
const ICONES = {
  // deux voyageurs qui dansent, les bras levés, sous une lanterne de fête
  danse: `<path d="M10 9 Q24 3 38 9" fill="none" stroke="${ENCRE}" stroke-width="1.6"/>
    <ellipse cx="24" cy="10.5" rx="4.2" ry="5" fill="#e0453a" stroke="${ENCRE}" stroke-width="1.6"/>
    <circle cx="16" cy="22" r="4.6" fill="#ffdcbc" stroke="${ENCRE}" stroke-width="1.8"/><circle cx="32" cy="22" r="4.6" fill="#ffdcbc" stroke="${ENCRE}" stroke-width="1.8"/>
    <path d="M12 41 L14 28 H18 L20 41 Z" fill="#2f4a8a" stroke="${ENCRE}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M28 41 L30 28 H34 L36 41 Z" fill="#e8583e" stroke="${ENCRE}" stroke-width="1.8" stroke-linejoin="round"/>
    ${trait('M14 30 L8 21', '#ffdcbc', 2.4)}${trait('M18 30 L23 24', '#ffdcbc', 2.4)}${trait('M30 30 L25 24', '#ffdcbc', 2.4)}${trait('M34 30 L40 21', '#ffdcbc', 2.4)}
    <path d="M5 44 Q12 40 18 44 M30 44 Q37 40 44 44" fill="none" stroke="${ENCRE}" stroke-width="1.4" stroke-linecap="round"/>`,
  // des pétales, une étoile et une feuille d'érable qui volent derrière une chaussure
  traces: `<path d="M6 36 Q8 28 16 28 L24 30 Q30 31 30 36 Q30 40 24 40 H10 Q6 40 6 36 Z" fill="#ffffff" stroke="${ENCRE}" stroke-width="1.8"/>
    <path d="M6 38 H30" stroke="#d8452e" stroke-width="2.4"/>
    <path d="M36 12 L38 17 L43 17 L39 20.5 L40.5 25.5 L36 22.5 L31.5 25.5 L33 20.5 L29 17 L34 17 Z" fill="#f4c12e" stroke="${ENCRE}" stroke-width="1.5" stroke-linejoin="round"/>
    <ellipse cx="22" cy="14" rx="3" ry="5.2" transform="rotate(-35 22 14)" fill="#f7b4c6" stroke="${ENCRE}" stroke-width="1.4"/>
    <path d="M40 34 L42 30 L44 34 L47 33 L45 37 L43 38 L42 42 L41 38 L39 37 L37 33 Z" fill="#e0602a" stroke="${ENCRE}" stroke-width="1.3" stroke-linejoin="round"/>`,
  // un foulard noué, un petit chapeau de paille, un grelot
  accessoires: `<path d="M6 26 Q17 31 28 26 L22 40 Z" fill="#2f6fb0" stroke="${ENCRE}" stroke-width="1.8" stroke-linejoin="round"/>
    <circle cx="13" cy="29" r="1.3" fill="#fff"/><circle cx="20" cy="30.5" r="1.3" fill="#fff"/><circle cx="21" cy="35" r="1.2" fill="#fff"/>
    <path d="M24 16 L36 6 L46 16 Z" fill="#e6c87a" stroke="${ENCRE}" stroke-width="1.8" stroke-linejoin="round"/><path d="M29 12 H43" stroke="#c9a65a" stroke-width="1.4"/>
    <circle cx="38" cy="33" r="7" fill="#e8b941" stroke="${ENCRE}" stroke-width="1.8"/><path d="M33 33 H43 M38 33 V39" stroke="${ENCRE}" stroke-width="1.6"/><circle cx="38" cy="28" r="1.6" fill="#fff6c8"/>`,
  // une fusée qui éclate au-dessus d'un torii
  feux: `${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => { const r = (a * Math.PI) / 180; return trait(`M24 16 L${(24 + Math.sin(r) * 12).toFixed(1)} ${(16 - Math.cos(r) * 12).toFixed(1)}`, a % 90 ? '#7ad0e8' : '#f4c12e', 1.8); }).join('')}
    <circle cx="24" cy="16" r="2.4" fill="#fff6c8" stroke="${ENCRE}" stroke-width="1.2"/>
    <path d="M8 34 Q24 30 40 34 L39 37 Q24 33.5 9 37 Z" fill="#e0453a" stroke="${ENCRE}" stroke-width="1.5"/>
    <path d="M14 36 V46 M34 36 V46" stroke="${ENCRE}" stroke-width="4.2"/><path d="M14 36 V46 M34 36 V46" stroke="#e0453a" stroke-width="2"/>`,
  // un appareil photo
  photo: `<rect x="5" y="15" width="38" height="26" rx="5" fill="#3f6aa0" stroke="${ENCRE}" stroke-width="2"/>
    <path d="M16 15 L19 10 H29 L32 15" fill="#3f6aa0" stroke="${ENCRE}" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="24" cy="28" r="9" fill="#e9eef2" stroke="${ENCRE}" stroke-width="2"/><circle cx="24" cy="28" r="5" fill="#2a3a52"/><circle cx="22" cy="26" r="1.6" fill="#fff"/>
    <rect x="35" y="18" width="5" height="3" rx="1" fill="#f4c12e" stroke="${ENCRE}" stroke-width="1.2"/>`,
  // le calendrier : une page déchirée, quatre saisons
  calendrier: `<rect x="8" y="9" width="32" height="34" rx="3" fill="#fffaf0" stroke="${ENCRE}" stroke-width="2"/>
    <rect x="8" y="9" width="32" height="8" rx="2" fill="#e0453a" stroke="${ENCRE}" stroke-width="2"/>
    <path d="M15 6 V12 M33 6 V12" stroke="${ENCRE}" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="17" cy="25" r="3.4" fill="#f7b4c6" stroke="${ENCRE}" stroke-width="1.2"/><circle cx="31" cy="25" r="3.4" fill="#86c75e" stroke="${ENCRE}" stroke-width="1.2"/>
    <path d="M14.5 36.5 L17 32 L19.5 36.5 L17 38 Z" fill="#e0602a" stroke="${ENCRE}" stroke-width="1.2"/>
    <path d="M28 35 H34 M31 32 V38 M29 33 L33 37 M33 33 L29 37" stroke="#7ab8e0" stroke-width="1.6" stroke-linecap="round"/>`,
  // les compagnons secrets : Gao le shisa (sa crinière bouclée, sa gueule ouverte), Fuwa le bébé dragon (ses cornes,
  // ses moustaches, sa perle), Saya l'esprit de l'arbre (sa calotte de mousse, sa pousse, ses yeux qui brillent)
  gao: `${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => { const a = (k / 10) * 2 * Math.PI; return `<circle cx="${(24 + Math.sin(a) * 15).toFixed(1)}" cy="${(25 + Math.cos(a) * 14).toFixed(1)}" r="5.5" fill="#a8502a" stroke="${ENCRE}" stroke-width="1.6"/>`; }).join('')}
    <circle cx="24" cy="25" r="13" fill="#d9853a" stroke="${ENCRE}" stroke-width="2"/>
    <ellipse cx="24" cy="30" rx="8" ry="5.5" fill="#f2dcae" stroke="${ENCRE}" stroke-width="1.5"/>
    <path d="M18.5 31 Q24 37 29.5 31 Z" fill="#7a1c1c" stroke="${ENCRE}" stroke-width="1.3"/><path d="M20 31 l1.5 2.5 l1.5 -2.5 M25 31 l1.5 2.5 l1.5 -2.5" fill="#fff"/>
    <circle cx="19" cy="22" r="3.4" fill="#fff" stroke="${ENCRE}" stroke-width="1.3"/><circle cx="29" cy="22" r="3.4" fill="#fff" stroke="${ENCRE}" stroke-width="1.3"/>
    <circle cx="19.5" cy="22.5" r="1.8" fill="${ENCRE}"/><circle cx="28.5" cy="22.5" r="1.8" fill="${ENCRE}"/><ellipse cx="24" cy="27" rx="2.6" ry="1.7" fill="${ENCRE}"/>`,
  fuwa: `<path d="M8 38 Q14 30 22 34 Q30 38 36 32 Q42 26 44 32" fill="none" stroke="${ENCRE}" stroke-width="7.5" stroke-linecap="round"/>
    <path d="M8 38 Q14 30 22 34 Q30 38 36 32 Q42 26 44 32" fill="none" stroke="#f2f5fb" stroke-width="5" stroke-linecap="round"/>
    <path d="M12 34 l2 -4 l2 4 M20 32 l2 -4 l2 4 M28 34 l2 -4 l2 4 M36 30 l2 -4 l2 4" fill="#5ec4cf" stroke="${ENCRE}" stroke-width="1"/>
    <ellipse cx="17" cy="20" rx="9.5" ry="8" fill="#f2f5fb" stroke="${ENCRE}" stroke-width="2"/>
    <path d="M13 13 L10 5 M21 13 L24 5 M11 8 L8 8 M23 8 L26 8" stroke="#f0d38a" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M9 22 Q3 22 1 27 M25 22 Q31 22 33 27" fill="none" stroke="#5ec4cf" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="14" cy="19" r="2.2" fill="${ENCRE}"/><circle cx="21" cy="19" r="2.2" fill="${ENCRE}"/><circle cx="14.6" cy="18.3" r="0.8" fill="#fff"/><circle cx="21.6" cy="18.3" r="0.8" fill="#fff"/>
    <circle cx="33" cy="16" r="4" fill="#d8f0ff" stroke="${ENCRE}" stroke-width="1.5"/><circle cx="32" cy="15" r="1.2" fill="#fff"/>`,
  saya: `<ellipse cx="24" cy="36" rx="9" ry="9" fill="#d8b07a" stroke="${ENCRE}" stroke-width="2"/>
    <path d="M17 33 V40 M24 30 V43 M31 33 V40" stroke="#a87a4a" stroke-width="1.3"/>
    <circle cx="24" cy="21" r="11" fill="#d8b07a" stroke="${ENCRE}" stroke-width="2"/>
    <path d="M13 19 Q14 9 24 9 Q34 9 35 19 Q30 15 24 16 Q18 15 13 19 Z" fill="#5f9e48" stroke="${ENCRE}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M24 9 V3" stroke="#3f7a35" stroke-width="2"/><ellipse cx="20" cy="3.5" rx="4.5" ry="1.8" fill="#7ac25a" stroke="${ENCRE}" stroke-width="1.2"/><ellipse cx="28" cy="3.5" rx="4.5" ry="1.8" fill="#7ac25a" stroke="${ENCRE}" stroke-width="1.2"/>
    <circle cx="19.5" cy="22" r="3.4" fill="#f2ffb0" stroke="#3a4a2a" stroke-width="1.6"/><circle cx="28.5" cy="22" r="3.4" fill="#f2ffb0" stroke="#3a4a2a" stroke-width="1.6"/>
    <ellipse cx="24" cy="27.5" rx="1.8" ry="1" fill="#5a3a2a"/>`,
};
/** L'icône d'un article de la boutique (les tenues et les compagnons ont la leur ailleurs : tenues.js, balade.js). */
export const iconeArticle = (id, taille = 48) => (ICONES[id] ? `<svg class="article-svg" viewBox="0 0 48 48" width="${taille}" height="${taille}" aria-hidden="true">${ICONES[id]}</svg>` : '');
