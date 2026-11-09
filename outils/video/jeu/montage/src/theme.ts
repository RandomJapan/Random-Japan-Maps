// L'identité et la mécanique des deux vidéos du jeu (2026-11-09) : 9:16, 60 images/s, en anglais. Les couleurs de la carte (le papier,
// l'encre, le rouge du sceau), les mots en TikTok Sans, les couleurs des températures du jeu (defi.js). La mécanique des vidéos
// « tunnel » et « éclat » : le ressort « nerveux » (raideur 380, amortissement 18), des glissements en S exponentiels, aucun
// mouvement linéaire.
import { loadFont as tiktok } from "@remotion/google-fonts/TikTokSans";
import { loadFont as emoji } from "@remotion/google-fonts/NotoColorEmoji";

export const TIKTOK = tiktok("normal", { weights: ["700", "800", "900"], subsets: ["latin", "latin-ext"] }).fontFamily;
export const EMOJI = emoji("normal", { subsets: ["emoji"] }).fontFamily;
export const POLICE = `${TIKTOK}, ${EMOJI}, sans-serif`;

export const FPS = 60;
export const W = 1080;
export const H = 1920;
/** Une seconde de la vidéo → son image. */
export const s = (secondes: number) => Math.round(secondes * FPS);

export const C = { papier: "#efe4c8", clair: "#f6eedb", encre: "#35251a", rouge: "#a8321f", rougeFonce: "#7c2214", nuit: "#0d1218" };
// les températures du défi (defi.js : TEMPERATURES)
export const CHAUD = { froid: "#4f7fa6", tiede: "#c9971c", chaud: "#d9622b", brulant: "#a8321f", trouve: "#a8321f" };

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
export const expoS = (u: number) => {
  u = borne(u);
  if (u === 0 || u === 1) return u;
  return u < 0.5 ? Math.pow(2, 20 * u - 10) / 2 : (2 - Math.pow(2, -20 * u + 10)) / 2;
};
export const expoSortie = (u: number) => (borne(u) >= 1 ? 1 : 1 - Math.pow(2, -10 * borne(u)));
export const expoEntree = (u: number) => (borne(u) <= 0 ? 0 : Math.pow(2, 10 * (borne(u) - 1)));
export const houle = (f: number, periode: number, phase = 0) => Math.sin(((f / FPS) / periode) * 2 * Math.PI + phase);
export const entre = (f: number, a: number, z: number) => borne((f - a) / (z - a));
