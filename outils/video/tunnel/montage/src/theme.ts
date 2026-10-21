// L'identité et la mécanique de la vidéo « tunnel » (2026-10-21) : 30 s, 9:16, 60 images/s.
// Un TikTok d'Aogashima → le profil @random_japan_place → le lien de la bio → la carte.
// Les mouvements suivent deux courbes validées par le propriétaire : le ressort « nerveux » (raideur 380,
// amortissement 18 : dépasse de 20 %, posé en 0,45 s) et le plongeon (zoom multiplicatif, accéléré
// exponentiellement), plus des glissements en S exponentiels ; aucun mouvement linéaire.
import { loadFont as tiktok } from "@remotion/google-fonts/TikTokSans";
import { loadFont as zen } from "@remotion/google-fonts/ZenAntique";
import { loadFont as fell } from "@remotion/google-fonts/IMFellEnglish";
import { loadFont as emoji } from "@remotion/google-fonts/NotoColorEmoji";

export const TIKTOK = tiktok("normal", { weights: ["400", "500", "600", "700", "800"], subsets: ["latin"] }).fontFamily;
export const TITRE = zen("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily;
export const FELL = fell("italic", { weights: ["400"], subsets: ["latin"] }).fontFamily;
export const EMOJI = emoji("normal", { weights: ["400"] }).fontFamily;
export const POLICE_TIKTOK = `${TIKTOK}, ${EMOJI}, sans-serif`;

export const FPS = 60;
export const DUREE = 30 * FPS;
/** Une seconde de la vidéo → son image. */
export const s = (secondes: number) => Math.round(secondes * FPS);

export const C = {
  rougeTiktok: "#fe2c55", cyanTiktok: "#20d5ec", gris: "#8a8b91", grisClair: "#f1f1f2", noir: "#161823",
  papier: "#efe4c8", clair: "#f6eedb", encre: "#35251a", rouge: "#a8321f", sarcelle: "#1d5652", mer: "#8fbab2",
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
/** Exponentielle en S (accélère puis freine fort) : le glissement des pages, les panoramiques. */
export const expoS = (u: number) => {
  u = borne(u);
  if (u === 0 || u === 1) return u;
  return u < 0.5 ? Math.pow(2, 20 * u - 10) / 2 : (2 - Math.pow(2, -20 * u + 10)) / 2;
};
/** Exponentielle qui freine (part très vite) : les masques, les arrivées. */
export const expoSortie = (u: number) => (borne(u) >= 1 ? 1 : 1 - Math.pow(2, -10 * borne(u)));
/** Exponentielle qui accélère : les départs, les plongées. */
export const expoEntree = (u: number) => (borne(u) <= 0 ? 0 : Math.pow(2, 10 * (borne(u) - 1)));
/** Le plongeon : E(u) = (e^(4u) − 1) / (e^4 − 1), appliqué au logarithme du zoom. */
export const plongee = (u: number) => (Math.exp(4 * borne(u)) - 1) / (Math.exp(4) - 1);
/** Une douce oscillation (le flottement de la caméra), sans à-coup. */
export const houle = (f: number, periode: number, phase = 0) => Math.sin(((f / FPS) / periode) * 2 * Math.PI + phase);

/** u de 0 à 1 entre les images a et z (borné). */
export const entre = (f: number, a: number, z: number) => borne((f - a) / (z - a));
/** Interpolation par clés [image, valeur], chaque segment avec sa courbe (expoS par défaut). */
export function cles(f: number, liste: [number, number, ((u: number) => number)?][]) {
  if (f <= liste[0][0]) return liste[0][1];
  for (let i = 1; i < liste.length; i++) {
    const [f1, v1, courbe = expoS] = liste[i];
    const [f0, v0] = liste[i - 1];
    if (f <= f1) return v0 + (v1 - v0) * courbe((f - f0) / (f1 - f0));
  }
  return liste[liste.length - 1][1];
}

/** Pseudo-hasard fixe (le rendu est le même à chaque fois). */
export const hasard = (n: number) => {
  const x = Math.sin(n * 127.3 + 11.7) * 43758.5453;
  return x - Math.floor(x);
};
