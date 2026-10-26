// L'identité des trois vidéos de la balade 3D (2026-10-26) : 9:16, 60 images/s, 30 s chacune, en anglais.
// Elle vient de la balade elle-même : la boîte de dialogue « cadre » (papier crème, trait d'encre de 3 px, filet rouge à
// l'intérieur, coins de 10 px), sa police M PLUS Rounded 1c, son rouge #dd5638 ; et de la carte pour la fin (Zen Antique,
// le sceau rouge). Les mouvements reprennent les courbes de la vidéo « tunnel », validées par le propriétaire : le
// ressort « nerveux » (raideur 380, amortissement 18 : dépasse de 20 %, posé en 0,45 s), les glissements en S
// exponentiels ; aucun mouvement linéaire. La musique est un air du jeu (musique.py) : chaque coupe tombe sur un temps.
import { loadFont as rond } from "@remotion/google-fonts/MPLUSRounded1c";
import { loadFont as zen } from "@remotion/google-fonts/ZenAntique";
import { loadFont as emoji } from "@remotion/google-fonts/NotoColorEmoji";

const ROND = rond("normal", { weights: ["500", "700", "800"], subsets: ["latin"] }).fontFamily;
const EMOJI = emoji("normal", { weights: ["400"] }).fontFamily;
export const POLICE = `${ROND}, ${EMOJI}, sans-serif`;
export const TITRE = `${zen("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily}, ${EMOJI}, serif`;
/** Les noms japonais : les polices de Windows (le rendu se fait sur ce PC). M PLUS Rounded et Zen Antique ont leurs
 *  glyphes japonais en 118 tranches, qu'il faudrait toutes charger dans chaque onglet du rendu. */
export const JAPONAIS = `"Yu Gothic UI", "Yu Gothic", Meiryo, sans-serif`;

export const FPS = 60;
export const W = 1080;
export const H = 1920;
export const DUREE = 30 * FPS;
/** Une seconde de la vidéo → son image. */
export const s = (secondes: number) => Math.round(secondes * FPS);

export const C = {
  papier: "#fffaf0", papier2: "#f6ecd6", encre: "#3a3236", encre2: "#6a5e58", rouge: "#dd5638", rougeFonce: "#b8422b",
  carte: "#efe4c8", or: "#e8b941", orFonce: "#a8741c", nuit: "#14110f",
};

// ---------------------------------------------------------------- les courbes (celles de la vidéo « tunnel »)
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
/** Exponentielle en S (accélère puis freine fort) : les glissements, les panoramiques éclair. */
export const expoS = (u: number) => {
  u = borne(u);
  if (u === 0 || u === 1) return u;
  return u < 0.5 ? Math.pow(2, 20 * u - 10) / 2 : (2 - Math.pow(2, -20 * u + 10)) / 2;
};
/** Exponentielle qui freine (part très vite) : les arrivées. */
export const expoSortie = (u: number) => (borne(u) >= 1 ? 1 : 1 - Math.pow(2, -10 * borne(u)));
/** Exponentielle qui accélère : les départs. */
export const expoEntree = (u: number) => (borne(u) <= 0 ? 0 : Math.pow(2, 10 * (borne(u) - 1)));
/** Une douce oscillation (le flottement du plan), sans à-coup. */
export const houle = (f: number, periode: number, phase = 0) => Math.sin(((f / FPS) / periode) * 2 * Math.PI + phase);
/** u de 0 à 1 entre les images a et z (borné). */
export const entre = (f: number, a: number, z: number) => borne((f - a) / (z - a));
