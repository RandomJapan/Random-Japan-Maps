// L'identité des vidéos du calendrier de l'Avent (2026-11-23) : 9:16, 60 images/s, en anglais. Les couleurs de la carte et des
// cadeaux à imprimer (le papier clair, l'encre, le rouge du sceau, la sarcelle de la mer : outils/video/calendrier/origami/
// commun.css), les bulles natives de TikTok (TikTok Sans) pour la promo, Zen Antique et Noto Sans (les polices des cadeaux) pour
// le tutoriel. La musique : « Yuki akari », la musique de Noël de la carte (en ré, 96 à la noire, outils/composer_noel.mjs).
import { loadFont as tiktok } from "@remotion/google-fonts/TikTokSans";
import { loadFont as emoji } from "@remotion/google-fonts/NotoColorEmoji";
import { loadFont as zen } from "@remotion/google-fonts/ZenAntique";
import { loadFont as noto } from "@remotion/google-fonts/NotoSans";

export const TIKTOK = tiktok("normal", { weights: ["700", "800", "900"], subsets: ["latin", "latin-ext"] }).fontFamily;
export const EMOJI = emoji("normal", { subsets: ["emoji"] }).fontFamily;
export const POLICE = `${TIKTOK}, ${EMOJI}, sans-serif`;
export const TITRE = `${zen("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily}, ${EMOJI}, serif`;
export const TEXTE = `${noto("normal", { weights: ["500", "700", "800"], subsets: ["latin", "latin-ext"] }).fontFamily}, ${EMOJI}, sans-serif`;

export const FPS = 60;
export const W = 1080;
export const H = 1920;
/** Une seconde de la vidéo → son image. */
export const s = (secondes: number) => Math.round(secondes * FPS);

export const C = {
  papier: "#efe4c8", clair: "#f6eedb", dessin: "#fbf6ea", trait: "#8a6b45", encre: "#35251a", encreDouce: "#6a5540",
  rouge: "#a8321f", rougeFonce: "#7c2214", sarcelle: "#1d5652", mer: "#8fbab2",
};

// ---------------------------------------------------------------- le tempo de Yuki akari (comme composer_noel.mjs)
// [temps, battements par minute] : le tempo va en ligne droite d'un point au suivant ; le temps 0 tombe à 0 s.
const TEMPO: [number, number][] = [[0, 96], [172, 96], [176, 96], [178, 88], [180, 96], [252, 96], [256, 90], [264, 70], [268, 64]];
const PAS = 1 / 32;
const bpm = (b: number) => {
  for (let i = 1; i < TEMPO.length; i++) {
    const [b1, t1] = TEMPO[i], [b0, t0] = TEMPO[i - 1];
    if (b <= b1) return t0 + ((t1 - t0) * (b - b0)) / Math.max(1e-9, b1 - b0);
  }
  return TEMPO[TEMPO.length - 1][1];
};
const TABLE = [0];
for (let i = 1; i <= 300 / PAS; i++) TABLE.push(TABLE[i - 1] + (PAS * 60) / bpm((i - 0.5) * PAS));
/** La seconde du temps b du morceau. */
export const secTemps = (b: number) => {
  const i = Math.floor(b / PAS), f = b / PAS - i;
  return TABLE[i] + (TABLE[i + 1] - TABLE[i]) * f;
};

// ---------------------------------------------------------------- les courbes
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
export const entre = (f: number, a: number, z: number) => borne((f - a) / (z - a));
export const expoSortie = (u: number) => (borne(u) >= 1 ? 1 : 1 - Math.pow(2, -10 * borne(u)));
export const lisse = (u: number) => { const x = borne(u); return x * x * (3 - 2 * x); };
