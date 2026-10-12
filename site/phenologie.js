// ================================================================
//  Le calendrier de la nature au Japon (2026-10-12) : quand fleurissent les
//  cerisiers, quand rougissent les érables, où tient la neige, selon la
//  latitude, l'altitude et le jour de l'année. Des formules simples, réglées
//  sur les dates moyennes de l'agence météo japonaise (à quelques jours près).
//  Elles servent au relief (ambiance.js), aux détails de saison peints sur la
//  carte (saisons-carte.js) et aux modèles 3D des lieux (couche3d.js).
// ================================================================

const borne = (x) => Math.max(0, Math.min(1, x));
/** 0 avant a, 1 après b, une courbe douce entre les deux (b peut être plus petit que a : la courbe descend). */
export const lisse = (a, b, x) => { const t = borne((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// La végétation et la neige de chaque mois (au 15) : [printemps, été, automne, ligne de neige en m au centre de Honshū]
export const MOIS = {
  1: [0, 0, 0, 600], 2: [0, 0, 0, 600], 3: [0.15, 0, 0, 1200], 4: [0.45, 0, 0, 1900], 5: [0.4, 0.15, 0, 2500],
  6: [0.1, 0.45, 0, 3300], 7: [0, 0.55, 0, 4500], 8: [0, 0.55, 0, 4500], 9: [0, 0.4, 0.1, 4500],
  10: [0, 0.1, 0.45, 3200], 11: [0, 0, 0.55, 2100], 12: [0, 0, 0.15, 1100],
};

const DEBUT_MOIS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
/** Le jour de l'année (1 à 365) d'une date { mois, jour } (le 29 février compte comme le 1er mars). */
export const jourDeLAn = (mois, jour) => Math.min(365, DEBUT_MOIS[mois - 1] + jour);
/** La date { mois, jour } d'un jour de l'année (1 à 365). */
export function dateDuJour(j) {
  const n = Math.max(1, Math.min(365, Math.round(j)));
  let mois = 12;
  while (DEBUT_MOIS[mois - 1] >= n) mois--;
  return { mois, jour: n - DEBUT_MOIS[mois - 1] };
}
/** Écart en jours de j à d, entre −182 et 182 (par-dessus le nouvel an). */
export const ecart = (j, d) => ((((j - d) % 365) + 365 + 182) % 365) - 182;
/** Le jour de l'année d'un « mois-jour » écrit 415 (15 avril). */
export const md = (n) => jourDeLAn(Math.floor(n / 100), n % 100);

/**
 * Le jour où les cerisiers fleurissent (開花) en ce point. Du sud de Kyūshū à Tokyo, presque le même jour
 * (fin mars) ; puis 4,6 jours par degré vers le nord, plus tard encore dans l'est de Hokkaidō, et 3 jours par
 * 100 m d'altitude. Okinawa et Amami : les cerisiers de janvier (kanhizakura).
 */
export function floraison(lat, lng, alt = 0) {
  if (lat < 29.5) return 22;
  return 84 + 4.6 * Math.max(0, lat - 35.5) + (lat > 41.4 ? 5 * Math.max(0, lng - 142) : 0) + 0.03 * Math.max(0, alt);
}

/** Le jour où les érables sont les plus rouges (紅葉の見頃) : fin septembre en haute montagne à Hokkaidō, début décembre à Kyūshū. Rien à Okinawa (null). */
export function picAutomne(lat, alt = 0) {
  if (lat < 29.5) return null;
  return Math.max(255, 330 - 4.2 * (lat - 35) - 0.028 * Math.max(0, alt));
}

/** La ligne de neige du jour (m) au centre de Honshū : entre les valeurs du 15 de chaque mois. */
export function ligneNeige(j) {
  const milieux = DEBUT_MOIS.map((d) => d + 15);
  let i = milieux.findIndex((d) => d > j); // le premier 15 après ce jour
  if (i === -1) i = 12;
  const avant = i === 0 ? 11 : i - 1, apres = i % 12;
  const da = milieux[avant] - (i === 0 ? 365 : 0), db = milieux[apres] + (i === 12 ? 365 : 0);
  const f = (j - da) / (db - da);
  return MOIS[avant + 1][3] + (MOIS[apres + 1][3] - MOIS[avant + 1][3]) * f;
}

/** La neige au sol (0 à 1) en ce point ce jour-là : la ligne de neige descend de 220 m par degré vers le nord. */
export function neigeAuSol(lat, alt, j) {
  const ligne = ligneNeige(j) - 100 - 220 * (lat - 36);
  return lisse(ligne - 250, ligne + 250, alt);
}

/** Les cerisiers en fleurs (0 à 1) : de 3 jours avant la floraison à la chute des pétales, deux semaines après. */
export const enFleurs = (j, debut) => { const d = ecart(j, debut); return lisse(-3, 2, d) * (1 - lisse(9, 16, d)); };

/**
 * L'état de la nature en un point, pour les modèles 3D : [neige 0–1 ; automne 0–1 (les feuilles colorées) ;
 * feuilles 0–2 (0 : branches nues, 1 : jeunes feuilles du printemps, 2 : feuillage de l'été) ; fleurs 0–1 (cerisiers)].
 */
export function etatNature(lat, lng, alt, j) {
  const neige = lat < 29.5 ? 0 : neigeAuSol(lat, alt, j);
  const f = floraison(lat, lng, alt);
  const fleurs = enFleurs(j, f);
  const pic = picAutomne(lat, alt);
  if (pic === null) return [neige, 0, 2, fleurs]; // Okinawa : toujours vert
  // les feuilles sortent après la floraison et mûrissent ; à l'automne elles se colorent, puis tombent
  const feuilles = (lisse(f + 3, f + 22, j) + lisse(f + 32, f + 65, j)) * (1 - lisse(pic + 6, pic + 24, j));
  const automne = lisse(pic - 28, pic - 5, j);
  return [neige, automne, feuilles, fleurs];
}
