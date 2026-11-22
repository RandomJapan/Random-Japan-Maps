// L'identité et la mécanique de la vidéo « générique d'animé » de la carte (2026-11-22) : 9:16, 60 images/s, en anglais (le
// refrain), les paroles en japonais. Un opening de shōnen d'aujourd'hui sur les couleurs de la carte (le papier, l'encre, le rouge du
// sceau, le turquoise de sa mer). Les courbes de la vidéo « tunnel » : le ressort « nerveux », des S exponentiels.
import { getInfo as infoDela, loadFont as dela } from "@remotion/google-fonts/DelaGothicOne";
import { getInfo as infoMincho, loadFont as mincho } from "@remotion/google-fonts/ShipporiMinchoB1";
import { loadFont as tiktok } from "@remotion/google-fonts/TikTokSans";

// ---------------------------------------------------------------- les polices
// Les polices japonaises de Google viennent en ~120 tranches : on ne charge que celles des caractères de la vidéo (les clés « [n] »
// sont acceptées par loadFont, mais pas par ses types).
export const TEXTE_DELA = "ランダム・ジャパン青ヶ島名頃白金青い池天空の村かかしの里北海道徳島県東京都美瑛町蔵王御釜芥屋大門福岡宮城";
export const TEXTE_MINCHO = "地図を広げて走り出せ雲越えて富士の向こうへ千鳥居くぐり抜けまだ知らない日本原作監督舞台音楽ランダム・ジャパン・プレイス以上ヶ所";

type Info = { unicodeRanges: Record<string, string> };
/** Les tranches (« [12] »…) dont les plages Unicode contiennent un caractère du texte. */
function tranches(info: Info, texte: string): string[] {
  const codes = [...new Set([...texte].map((c) => c.codePointAt(0)!))];
  const retenues: string[] = [];
  for (const [cle, plages] of Object.entries(info.unicodeRanges)) {
    if (!cle.startsWith("[")) continue;
    const dedans = plages.split(",").some((p) => {
      const [a, b] = p.trim().replace("U+", "").split("-");
      const de = parseInt(a, 16), jusque = b ? parseInt(b, 16) : de;
      return codes.some((c) => c >= de && c <= jusque);
    });
    if (dedans) retenues.push(cle);
  }
  return retenues;
}

export const TIKTOK = tiktok("normal", { weights: ["700", "800", "900"], subsets: ["latin", "latin-ext"] }).fontFamily;
export const DELA = dela("normal", { weights: ["400"], subsets: [...tranches(infoDela(), TEXTE_DELA), "latin"] as "latin"[], ignoreTooManyRequestsWarning: true }).fontFamily;
export const MINCHO = mincho("normal", { weights: ["800"], subsets: [...tranches(infoMincho(), TEXTE_MINCHO), "latin"] as "latin"[], ignoreTooManyRequestsWarning: true }).fontFamily;
export const POLICE = `${TIKTOK}, sans-serif`;
export const TITRE = `${DELA}, "Yu Gothic", sans-serif`;
export const PAROLE = `${MINCHO}, "Yu Gothic", serif`;

// ---------------------------------------------------------------- le temps
export const FPS = 60;
export const W = 1080;
export const H = 1920;
/** Une seconde de la vidéo → son image. */
export const s = (secondes: number) => Math.round(secondes * FPS);
/** L'image où la chanson démarre : la lame du rush 4 passe devant l'objectif (sa seconde 6,53 ; le hook en dure 2,03). */
export const V0 = 122;
/** La chanson : 165 battements par minute (un temps = 0,3636 s = 21,8 images), son premier temps à 0,007 s (le coup du tout début ;
 *  mesuré sur ses attaques les plus fortes, analyse.py). */
export const TEMPS = 60 / 165;
export const T0 = 0.007;
/** Le temps n de la chanson → son image dans la vidéo. */
export const b = (n: number) => V0 + Math.round((T0 + n * TEMPS) * FPS);
/** Une seconde de la chanson → son image dans la vidéo. */
export const c = (secondes: number) => V0 + Math.round(secondes * FPS);
/** La fin : la chanson s'éteint vers 29,9 s ; le carton de fin tient encore un peu. */
export const DUREE = c(30.4);

export const C = {
  papier: "#efe4c8", clair: "#f6eedb", encre: "#1d1410", rouge: "#d8321e", rougeFonce: "#8e1f12", mer: "#5fd3c6", or: "#ffcc4d", nuit: "#0b0f14",
};

// ---------------------------------------------------------------- les courbes
/** Le ressort amorti, 0 → 1 : x(t) = 1 − e^(−ζωt)(cos ω_d t + ζω/ω_d sin ω_d t), ω = √k, ζ = c / (2√k). */
export function ressort(u: number, k = 380, cc = 18) {
  if (u <= 0) return 0;
  const w = Math.sqrt(k), z = cc / (2 * w);
  if (z >= 1) return 1 - Math.exp(-w * u) * (1 + w * u);
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * u) * (Math.cos(wd * u) + ((z * w) / wd) * Math.sin(wd * u));
}
/** Le ressort « nerveux » à l'image f, parti à l'image depart (0 avant). */
export const rebond = (f: number, depart: number, k = 380, cc = 18) => ressort((f - depart) / FPS, k, cc);
export const borne = (x: number) => Math.min(1, Math.max(0, x));
/** Exponentielle qui freine (part très vite) : les arrivées. */
export const expoSortie = (u: number) => (borne(u) >= 1 ? 1 : 1 - Math.pow(2, -10 * borne(u)));
/** Exponentielle qui accélère : les départs. */
export const expoEntree = (u: number) => (borne(u) <= 0 ? 0 : Math.pow(2, 10 * (borne(u) - 1)));
/** Une douce oscillation (le flottement de la caméra). */
export const houle = (f: number, periode: number, phase = 0) => Math.sin(((f / FPS) / periode) * 2 * Math.PI + phase);
/** u de 0 à 1 entre les images a et z (borné). */
export const entre = (f: number, a: number, z: number) => borne((f - a) / (z - a));
/** Un nombre pseudo-aléatoire fixe pour (i, j) : le même à chaque rendu. */
export const hasard = (i: number, j = 0) => {
  let x = Math.imul(i * 374761393 + j * 668265263, 1274126177) ^ 0x5bd1e995;
  x = Math.imul(x ^ (x >>> 15), 2246822519);
  x = Math.imul(x ^ (x >>> 13), 3266489917);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
};
