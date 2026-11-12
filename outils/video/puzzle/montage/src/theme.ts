// L'identité et la mécanique de la vidéo « puzzle » (2026-11-12), celles de la vidéo « sceau » (2026-11-08), reprises de la vidéo
// « jarre » : 19,2 s, 9:16, 60 images/s, en anglais. Les couleurs de la carte
// (le papier, l'encre, le rouge du sceau), les mots en TikTok Sans. La mécanique des vidéos « tunnel » et « éclat » : le ressort
// « nerveux » (raideur 380, amortissement 18 : dépasse de 20 %, posé en 0,45 s), des glissements en S exponentiels, aucun
// mouvement linéaire.
import { loadFont as tiktok } from "@remotion/google-fonts/TikTokSans";

export const TIKTOK = tiktok("normal", { weights: ["700", "800", "900"], subsets: ["latin", "latin-ext"] }).fontFamily;
export const POLICE = `${TIKTOK}, sans-serif`;

export const FPS = 60;
export const W = 1080;
export const H = 1920;
/** 144 battements par minute. Les temps sont numérotés comme dans la vidéo « sceau » (la musique éclate au temps 12), mais la vidéo
 *  commence à son temps 2 : l'accroche dure 10 temps (4,2 s) au lieu de 12, le temps n tombe à l'image 25 (n − 2). (L'image arrêtée
 *  du puzzle fini durait 2,2 s avant la plongée.) */
export const DEBUT = 2;
export const t = (n: number) => Math.round((n - DEBUT) * 25);
export const DUREE = t(48); // 19,2 s
/** Une seconde de la vidéo → son image. */
export const s = (secondes: number) => Math.round(secondes * FPS);

export const C = { papier: "#efe4c8", clair: "#f6eedb", encre: "#35251a", rouge: "#a8321f", rougeFonce: "#7c2214", nuit: "#0d1218" };

// ---------------------------------------------------------------- les courbes
/** Le ressort amorti, 0 → 1 : x(t) = 1 − e^(−ζωt)(cos ω_d t + ζω/ω_d sin ω_d t), ω = √k, ζ = c / (2√k). */
export function ressort(u: number, k = 380, c = 18) {
  if (u <= 0) return 0;
  const w = Math.sqrt(k), z = c / (2 * w);
  if (z >= 1) return 1 - Math.exp(-w * u) * (1 + w * u);
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * u) * (Math.cos(wd * u) + ((z * w) / wd) * Math.sin(wd * u));
}
/** Le ressort « nerveux » à l'image f, parti à l'image depart (0 avant). */
export const rebond = (f: number, depart: number, k = 380, c = 18) => ressort((f - depart) / FPS, k, c);

export const borne = (x: number) => Math.min(1, Math.max(0, x));
/** Exponentielle en S (accélère puis freine fort). */
export const expoS = (u: number) => {
  u = borne(u);
  if (u === 0 || u === 1) return u;
  return u < 0.5 ? Math.pow(2, 20 * u - 10) / 2 : (2 - Math.pow(2, -20 * u + 10)) / 2;
};
/** Exponentielle qui freine (part très vite) : les arrivées. */
export const expoSortie = (u: number) => (borne(u) >= 1 ? 1 : 1 - Math.pow(2, -10 * borne(u)));
/** Exponentielle qui accélère : les départs. */
export const expoEntree = (u: number) => (borne(u) <= 0 ? 0 : Math.pow(2, 10 * (borne(u) - 1)));
/** Une douce oscillation (le flottement de la caméra), sans à-coup. */
export const houle = (f: number, periode: number, phase = 0) => Math.sin(((f / FPS) / periode) * 2 * Math.PI + phase);
/** u de 0 à 1 entre les images a et z (borné). */
export const entre = (f: number, a: number, z: number) => borne((f - a) / (z - a));
/** Une secousse amortie (px), partie à l'image depart. */
export const secousse = (f: number, depart: number, force = 18, duree = 0.3) => {
  const u = (f - depart) / FPS;
  if (u < 0 || u > duree) return [0, 0];
  const a = force * Math.exp(-u / (duree / 4));
  return [a * Math.sin(u * 97), a * Math.cos(u * 83)];
};
