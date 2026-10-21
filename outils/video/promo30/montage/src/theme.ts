// L'identité de la vidéo promo, tirée du site (DESIGN.md, style.css) et du logo : parchemin, encre sépia, rouge de
// cartographe, sarcelle, mer turquoise ; Zen Antique pour les titres, IM Fell English (italique) pour les mots de
// carte, Noto Sans pour le reste ; l'orange et le violet d'Halloween (halloween.css). La grille des temps de la
// musique (« Amenoshita2 », PeriTune, CC BY 4.0) : 142,4 battements par minute, prise à 81,6 s, son retour à 3,44 s.
import { Easing, interpolate } from "remotion";
import { loadFont as zen } from "@remotion/google-fonts/ZenAntique";
import { loadFont as fell } from "@remotion/google-fonts/IMFellEnglish";
import { loadFont as noto } from "@remotion/google-fonts/NotoSans";

export const TITRE = zen("normal", { weights: ["400"], subsets: ["latin", "japanese"] }).fontFamily;
export const FELL = fell("italic", { weights: ["400"], subsets: ["latin"] }).fontFamily;
export const SANS = noto("normal", { weights: ["400", "700", "900"], subsets: ["latin"] }).fontFamily;

export const C = {
  papier: "#efe4c8", clair: "#f6eedb", fonce: "#e4d5b1", trait: "#8a6b45",
  encre: "#35251a", encre2: "#5b432d", encre3: "#6e533a",
  rouge: "#a8321f", rougeFonce: "#8f2716", sarcelle: "#1d5652", mer: "#8fbab2", ligneEau: "#3d6b64",
  orange: "#ff9b3d", citrouille: "#e8792a", violet: "#8a4fc0", nuit: "#0d0e16", indigo: "#272a55",
};

export const FPS = 30;
export const DUREE = 900;
export const BPM = 142.4;
export const TEMPS = (60 / BPM) * FPS; // un temps : 12,64 images
export const DEBUT_MUSIQUE = 81.6; // s dans le morceau
export const TEMPS0 = (85.044 - DEBUT_MUSIQUE) * FPS; // le retour de la musique (fin du pont) : 103,3 images
/** L'image du n-ième temps après le retour de la musique. */
export const b = (n: number) => Math.round(TEMPS0 + n * TEMPS);

// l'élan du site (--ease) ; « pose » : un atterrissage qui dépasse un peu (y1 > 1) ; « frappe » : on accélère pour
// frapper (un tampon, un titre qui tombe)
export const ELAN = Easing.bezier(0.16, 1, 0.3, 1);
export const POSE = Easing.bezier(0.34, 1.4, 0.44, 1);
export const FRAPPE = Easing.in(Easing.quad);
const borne = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
/** f entre a et z → sortie (0 → 1 par défaut), bornée, avec l'élan du site. */
export const de = (f: number, a: number, z: number, sortie: [number, number] = [0, 1], easing: (t: number) => number = ELAN) =>
  interpolate(f, [a, z], sortie, { ...borne, easing });
export const lin = (f: number, a: number, z: number, sortie: [number, number] = [0, 1]) => interpolate(f, [a, z], sortie, borne);

/** Le grain de papier du site (--grain), une tuile de 240 px. */
export const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .33 0 0 0 0 .22 0 0 0 0 .11 .6 0 0 0 -.26'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E\")";
/** Le double filet des cartouches du site (--filet), plus une ombre portée. */
export const FILET = `inset 0 0 0 3px ${C.clair}, inset 0 0 0 4px rgba(138,107,69,.55), 0 10px 30px rgba(40,26,14,.35)`;
/** Un halo de papier autour d'un texte sépia posé sur la carte. */
export const HALO = "0 0 2px rgba(246,238,219,.95), 0 0 10px rgba(246,238,219,.9), 0 0 26px rgba(246,238,219,.75)";
/** Une ombre lisible pour un texte clair sur la nuit. */
export const OMBRE = "0 2px 0 rgba(0,0,0,.55), 0 0 18px rgba(0,0,0,.75), 0 0 42px rgba(0,0,0,.55)";

/** Pseudo-hasard fixe (le rendu est le même à chaque fois). */
export const hasard = (n: number) => {
  const s = Math.sin(n * 127.3 + 11.7) * 43758.5453;
  return s - Math.floor(s);
};
