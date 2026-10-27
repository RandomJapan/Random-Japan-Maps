// L'identité de la vidéo « éclat » (2026-10-27) : 9:16, 60 images/s, en anglais. Le format des deux vidéos du PSG que le
// propriétaire a montrées : un geste filmé « satisfaisant » (une vitre cassée au marteau), puis, quand elle éclate, la
// musique tombe et un montage très rapide démarre, coupé sur chaque temps. Les textes à la façon de TikTok (TikTok Sans
// 900, blanc cerné de noir, un mot sur une pastille rouge), le rouge et le papier de la carte.
import { loadFont as tiktok } from "@remotion/google-fonts/TikTokSans";
import { loadFont as emoji } from "@remotion/google-fonts/NotoColorEmoji";

const EMOJI = emoji("normal", { weights: ["400"] }).fontFamily;
export const POLICE = `${tiktok("normal", { weights: ["700", "900"], subsets: ["latin"] }).fontFamily}, ${EMOJI}, sans-serif`;

export const FPS = 60;
export const W = 1080;
export const H = 1920;
/** Une seconde de la vidéo → son image. */
export const s = (secondes: number) => Math.round(secondes * FPS);

/** La vitre éclate à T0 : la musique part de là, et chaque coupe tombe sur un de ses temps (140 battements par minute). */
export const T0 = 2.2;
export const BPM = 140;
/** L'image du temps k de la musique (k = 0 : la vitre éclate). */
export const b = (k: number) => Math.round((T0 + (k * 60) / BPM) * FPS);

export const C = { papier: "#fffaf0", encre: "#2a2326", rouge: "#dd5638", rougeFonce: "#b8422b", nuit: "#14110f" };

// ---------------------------------------------------------------- les courbes (celles des vidéos « tunnel » et de la balade)
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
/** u de 0 à 1 entre les images a et z (borné). */
export const entre = (f: number, a: number, z: number) => borne((f - a) / (z - a));

/** Le hasard fixé (le même à chaque rendu) : mulberry32. */
export function hasard(graine: number) {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
