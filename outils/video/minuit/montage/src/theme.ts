// L'identité et la mécanique de la vidéo « minuit » (2026-10-31, la dernière nuit d'Halloween sur la carte) : 22,5 s,
// 9:16, 60 images/s, en anglais. La mécanique de la vidéo « tunnel » : le ressort « nerveux » (raideur 380,
// amortissement 18 : dépasse de 20 %, posé en 0,45 s), le plongeon (zoom multiplicatif, accéléré exponentiellement),
// des glissements en S exponentiels, aucun mouvement linéaire. Les couleurs de la carte (le papier, l'encre, le rouge
// du sceau) et celles de son Halloween (l'orange des citrouilles, le violet des lueurs la nuit).
import { loadFont as tiktok } from "@remotion/google-fonts/TikTokSans";
import { loadFont as zen } from "@remotion/google-fonts/ZenAntique";
import { loadFont as fell } from "@remotion/google-fonts/IMFellEnglish";
import { loadFont as emoji } from "@remotion/google-fonts/NotoColorEmoji";

export const TIKTOK = tiktok("normal", { weights: ["600", "700", "800", "900"], subsets: ["latin", "latin-ext"] }).fontFamily;
export const TITRE = zen("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily;
export const FELL = fell("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily;
export const EMOJI = emoji("normal", { weights: ["400"] }).fontFamily;
export const POLICE = `${TIKTOK}, ${EMOJI}, sans-serif`;
/** Les noms japonais : les polices de Windows (Zen Antique n'a pas de kanji ici). */
export const JAPONAIS = `"Yu Mincho", "MS Mincho", ${TITRE}, serif`;

export const FPS = 60;
export const W = 1080;
export const H = 1920;
export const DUREE_S = 22.5;
export const DUREE = Math.round(DUREE_S * FPS);
/** Une seconde de la vidéo → son image. */
export const s = (secondes: number) => Math.round(secondes * FPS);
/** 120 battements par minute : le temps n de la musique (musique.py) tombe à l'image 30 n. */
export const b = (n: number) => Math.round(n * 30);

export const C = {
  papier: "#efe4c8", clair: "#f6eedb", encre: "#35251a", rouge: "#a8321f",
  orange: "#e8701a", orangeFonce: "#c8641e", citrouille: "#ff9a3c", violet: "#7a4fd0", nuit: "#0d1218", noir: "#161823",
};

// ---------------------------------------------------------------- les courbes
/** Le ressort amorti, 0 → 1 : x(t) = 1 − e^(−ζωt)(cos ω_d t + ζω/ω_d sin ω_d t), ω = √k, ζ = c / (2√k). */
export function ressort(t: number, k = 380, c = 18) {
  if (t <= 0) return 0;
  const w = Math.sqrt(k), z = c / (2 * w);
  if (z >= 1) return 1 - Math.exp(-w * t) * (1 + w * t);
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
}
/** Le ressort « nerveux » à l'image f, parti à l'image depart (0 avant). */
export const rebond = (f: number, depart: number, k = 380, c = 18) => ressort((f - depart) / FPS, k, c);

export const borne = (x: number) => Math.min(1, Math.max(0, x));
/** Exponentielle en S (accélère puis freine fort) : les panoramiques éclair. */
export const expoS = (u: number) => {
  u = borne(u);
  if (u === 0 || u === 1) return u;
  return u < 0.5 ? Math.pow(2, 20 * u - 10) / 2 : (2 - Math.pow(2, -20 * u + 10)) / 2;
};
/** Exponentielle qui freine (part très vite) : les arrivées. */
export const expoSortie = (u: number) => (borne(u) >= 1 ? 1 : 1 - Math.pow(2, -10 * borne(u)));
/** Exponentielle qui accélère : les départs, les plongées. */
export const expoEntree = (u: number) => (borne(u) <= 0 ? 0 : Math.pow(2, 10 * (borne(u) - 1)));
/** Le plongeon : E(u) = (e^(4u) − 1) / (e^4 − 1), appliqué au logarithme du zoom. */
export const plongee = (u: number) => (Math.exp(4 * borne(u)) - 1) / (Math.exp(4) - 1);
/** Une douce oscillation (le flottement de la caméra), sans à-coup. */
export const houle = (f: number, periode: number, phase = 0) => Math.sin(((f / FPS) / periode) * 2 * Math.PI + phase);
/** u de 0 à 1 entre les images a et z (borné). */
export const entre = (f: number, a: number, z: number) => borne((f - a) / (z - a));

/** Pseudo-hasard fixe (le rendu est le même à chaque fois). */
export const hasard = (n: number) => {
  const x = Math.sin(n * 127.3 + 11.7) * 43758.5453;
  return x - Math.floor(x);
};
/** Une secousse amortie (px), partie à l'image depart. */
export const secousse = (f: number, depart: number, force = 18, duree = 0.35) => {
  const u = (f - depart) / FPS;
  if (u < 0 || u > duree) return [0, 0];
  const a = force * Math.exp(-u / (duree / 4));
  return [a * Math.sin(u * 97), a * Math.cos(u * 83)];
};
