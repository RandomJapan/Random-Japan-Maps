// Les intros « captcha » des vidéos de lieux (2026-11-26) : 9:16, à la cadence du plan du propriétaire (30 ou 60 images/s).
// Toute la mise en place (les fenêtres, les morceaux, le doigt, les temps) est calculée par fabriquer.py, qui fait aussi les sons
// avec les mêmes temps : ce montage ne fait que dessiner. Deux captchas génériques, sans aucun logo : la grille (« Select all
// squares with… », en Roboto) et le puzzle sombre (« Drag the piece into place », en TikTok Sans).
import { Easing } from "remotion";
import { loadFont as roboto } from "@remotion/google-fonts/Roboto";
import { loadFont as tiktok } from "@remotion/google-fonts/TikTokSans";
import { loadFont as emoji } from "@remotion/google-fonts/NotoColorEmoji";

export const ROBOTO = roboto("normal", { weights: ["400", "500", "700"], subsets: ["latin", "latin-ext"] }).fontFamily;
export const TIKTOK = tiktok("normal", { weights: ["500", "700", "900"], subsets: ["latin", "latin-ext"] }).fontFamily;
export const EMOJI = emoji("normal", { subsets: ["emoji"] }).fontFamily;

export const W = 1080;
export const H = 1920;

export type Rect = { x: number; y: number; w: number; h: number };
/** Un rendez-vous du doigt : à l'instant t (s), au point (x, y) de l'écran. */
export type Cle = { t: number; x: number; y: number };
export type Geste = {
  cles: Cle[]; // le chemin du doigt
  appuis: [number, number][]; // les moments où il appuie (s)
  apparait: number;
  disparait: number;
};
export type Temps = { verifie: number; grandit: [number, number] };
export type Echange = { a: number; b: number; t0: number; t1: number }; // la case a (qui a le morceau de b) glisse en b
export type Piece = {
  hx: number; hy: number; // le trou (coin du carré, dans la zone de l'image)
  px: number; py: number; // où est la pièce au départ
  bords: [number, number, number, number]; // haut, droite, bas, gauche : 1 tenon, −1 mortaise, 0 droit
  t0: number; t1: number; // elle glisse de t0 à t1
  curseur: boolean; // poussée par le curseur du bas (comme le vrai captcha)
};

export type PropsIntro = {
  fps: number;
  duree: number;
  image: string; // l'image 0 du plan, 1080 × 1920 (dans le dossier public)
  style: "grille" | "puzzle";
  accroche: string;
  fenetre: Rect;
  zone: Rect; // l'image dans la fenêtre (à l'écran)
  recadrage: Rect; // la même partie de l'image 0 (en pixels de l'image 0)
  geste: Geste;
  temps: Temps;
  // la grille
  n?: number;
  echanges?: Echange[];
  // le puzzle
  cote?: number; // côté du carré d'une pièce (sans ses tenons)
  pieces?: Piece[];
  curseur?: Rect;
  code?: string;
};

export const borne = (x: number) => Math.min(1, Math.max(0, x));
/** Le mouvement du doigt et des morceaux : vif, sans rien de linéaire. */
export const glisse = Easing.bezier(0.55, 0, 0.25, 1);
/** L'image qui grandit jusqu'au plein écran : elle part doucement et se pose. */
export const grandir = Easing.bezier(0.6, 0, 0.2, 1);
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

/** Le ressort « nerveux » des vidéos de la carte (raideur 380, amortissement 18), 0 → 1, u en secondes. */
export function ressort(u: number, k = 380, c = 18) {
  if (u <= 0) return 0;
  const w = Math.sqrt(k), z = c / (2 * w);
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * u) * (Math.cos(wd * u) + ((z * w) / wd) * Math.sin(wd * u));
}

/** Où est le doigt à l'instant t : d'une clé à la suivante, en douceur. */
export function doigt(g: Geste, t: number) {
  const c = g.cles;
  if (t <= c[0].t) return { x: c[0].x, y: c[0].y };
  for (let k = 0; k < c.length - 1; k++) {
    const a = c[k], b = c[k + 1];
    if (t <= b.t) {
      const u = b.t > a.t ? glisse(borne((t - a.t) / (b.t - a.t))) : 1;
      return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) };
    }
  }
  const z = c[c.length - 1];
  return { x: z.x, y: z.y };
}

/** Le contour d'une pièce de puzzle (carré de côté s, coin en (m, m) dans sa boîte), dans le sens des aiguilles d'une montre. */
export function contourPiece(s: number, m: number, bords: [number, number, number, number]) {
  // un tenon : le long d'un bord (u de 0 à 1), hauteur v vers l'extérieur (en fraction du côté)
  const tenon: [number, number][][] = [
    [[0.4, 0], [0.42, 0.06], [0.38, 0.12]],
    [[0.33, 0.2], [0.42, 0.27], [0.5, 0.27]],
    [[0.58, 0.27], [0.67, 0.2], [0.62, 0.12]],
    [[0.58, 0.06], [0.6, 0], [0.66, 0]],
  ];
  const coins: [number, number][] = [[m, m], [m + s, m], [m + s, m + s], [m, m + s]];
  const normales: [number, number][] = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  let d = `M ${m} ${m}`;
  for (let k = 0; k < 4; k++) {
    const [ax, ay] = coins[k], [bx, by] = coins[(k + 1) % 4];
    const [nx, ny] = normales[k];
    const sens = bords[k];
    const p = (u: number, v: number) => `${(ax + (bx - ax) * u + nx * v * s * sens).toFixed(2)} ${(ay + (by - ay) * u + ny * v * s * sens).toFixed(2)}`;
    if (sens === 0) {
      d += ` L ${bx} ${by}`;
      continue;
    }
    d += ` L ${p(0.34, 0)}`;
    for (const [c1, c2, e] of tenon) d += ` C ${p(c1[0], c1[1])} ${p(c2[0], c2[1])} ${p(e[0], e[1])}`;
    d += ` L ${bx} ${by}`;
  }
  return d + " Z";
}
