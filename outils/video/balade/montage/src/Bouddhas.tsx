// Vidéo 7 (2026-10-30) : le neuvième lieu de la balade, les Trente Bouddhas, pour l'annoncer. Le vrai lieu (la vidéo du
// propriétaire : la brume entre les cèdres, le torii de pierre entre les deux Nio, le chemin vers le grand escalier, le pavillon
// sous la falaise), chaque fois glissé dans la même vue du jeu ; puis la liste de ce qu'on y fait, un moment tous les trois temps :
// les sandales de paille pendues pour les Nio, la mer de nuages du belvédère, la cloche, la bougie du moine pour le bouddha du jour,
// l'écho de la falaise ; le cinquième tampon, l'étole à pompons et la conque du yamabushi ; la nuit, le secret, montré sans être
// résolu : la cloche qu'il ne faut pas sonner, une torche qui descend de la montagne (celui qui la porte reste caché) ; la fin sur
// l'escalier dans la brume. La grotte de l'ermite (le lieu secret) n'y est pas. Sur l'air de jour des Trente Bouddhas (76
// battements, depuis l'entrée de sa mélodie).
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { Cadre, Etiquette, Fin, Plan, Plans } from "./commun";
import { Bande, Son } from "./Son";
import { C, entre, expoSortie, FPS, s } from "./theme";

const BPM = 76;
export const b = (n: number) => Math.round((n * 60 * FPS) / BPM);
const sec = (n: number) => (n * 60) / BPM;
/** La fin (« The Thirty Buddhas, in 3D. Link in bio. ») garde plus d'une seconde après la voix. */
export const LONGUEUR = s(41.8);

export const PLANS: Plan[] = [
  { de: 0, a: b(6), prise: "sb-brume", t: 0.3, zoom: [1.0, 1.05], reel: { lieu: "sanjubutsu", t: 0, volet: b(2.5) } },
  { de: b(6), a: b(9), prise: "sb-torii", t: 0.3, entree: "fouet", zoom: [1.06, 1.1], centre: [0.5, 0.42], reel: { lieu: "sb-torii", t: 0, volet: b(1) } },
  { de: b(9), a: b(12), prise: "sb-escalier", t: 0.2, entree: "fouet", reel: { lieu: "sb-escalier", t: 0, volet: b(1) } },
  { de: b(12), a: b(14.5), prise: "sb-do", t: 0.3, entree: "fouet", reel: { lieu: "sb-do", t: 0, volet: b(1) } },
  // (dans l'ombre de la falaise : un peu éclaircis)
  { de: b(14.5), a: b(16), prise: "sb-bouddhas", t: 0.5, entree: "punch", luminosite: 1.2 },
  // (les sandales paraissent au râtelier à 1,1 s de la prise)
  { de: b(16), a: b(19), prise: "sb-waraji", t: 0.5, entree: "fouet", zoom: [1.22, 1.3], centre: [0.4, 0.6] },
  { de: b(19), a: b(22), prise: "sb-vue", t: 0.3, entree: "fouet" },
  // (le tronc frappe la cloche à 1,15 s de la prise)
  { de: b(22), a: b(25), prise: "sb-cloche", t: 0.2, entree: "fouet" },
  // (la bougie s'allume à 1 s de la prise)
  { de: b(25), a: b(28), prise: "sb-bougie", t: 0.4, entree: "fouet", luminosite: 1.15 },
  // (il fait signe à la falaise à 0,75 s et à 2,5 s de la prise ; le cinquième tampon paraît à 11,5 s, la carte de la
  // récompense à 15,7 s)
  { de: b(28), a: b(31), prise: "sb-echo", t: 0.45, entree: "fouet" },
  { de: b(31), a: b(32.5), prise: "sb-echo", t: 11.45, entree: "punch" },
  { de: b(32.5), a: b(34), prise: "sb-echo", t: 15.65, entree: "punch" },
  // (après la carte, le jeu lui met l'étole, dans un petit nuage, et il saute de joie : à 20 s de la prise de l'écho ; puis, au
  // belvédère, les bras ouverts à 1,4 s de sa prise)
  { de: b(34), a: b(35.5), prise: "sb-echo", t: 19.75, entree: "punch" },
  { de: b(35.5), a: b(38), prise: "sb-etole", t: 0.9, entree: "punch" },
  // (la nuit, un peu éclaircie : sur un téléphone, la nuit du jeu est sombre)
  { de: b(38), a: b(41), prise: "sb-nuit-cloche", t: 0.3, entree: "fouet", luminosite: 1.35 },
  { de: b(41), a: b(44), prise: "sb-torche", t: 0.3, entree: "fouet", luminosite: 1.3 },
  // (la flamme passe de 49 à 58 % de la largeur, à 29 % de la hauteur : le zoom la garde au milieu, sous la légende)
  { de: b(44), a: b(46.5), prise: "sb-torche", t: 0.3 + sec(3), entree: "punch", zoom: [1.3, 1.42], centre: [0.53, 0.3], luminosite: 1.3 },
  { de: b(46.5), a: LONGUEUR, prise: "sb-fin", t: 0.5, entree: "fouet" },
];

// Les niveaux de Motonosumi (mesurés) : les bruitages à −4 dB (DOUX), les coups plus bas encore ; les sons longs avec une durée ;
// les ambiances (les feuilles le jour, les insectes la nuit) 20 dB sous la voix.
const DOUX = 0.6;

// Chaque réplique (ou morceau de réplique, voix.py) tombe avec son texte à l'écran ; Son vérifie qu'elles ne se superposent pas.
const BANDE: Bande = {
  // (l'air des Trente Bouddhas est 0,9 dB plus doux que celui de Motonosumi, joué à 2,5 ; à 2,7, mesuré : 6 à 13 dB sous la voix,
  // un peu juste)
  musique: { fichier: "sanjubutsu.wav", debut: 0.15 + sec(8), volume: 2.4 },
  voix: [
    // (trois morceaux sortis de Flora plus bas que les autres, remontés : « something comes down the mountain », presque
    // chuchoté, 7 dB sous les autres)
    ["h1a", 0.15, 1.3], ["h1b", 2.2],
    ["h2a", sec(6) + 0.04], ["h2b", sec(9) + 0.04], ["h2c", sec(12) + 0.04],
    ["h3a", sec(16) + 0.04], ["h3b", sec(19) + 0.04, 1.3], ["h3c", sec(22) + 0.04], ["h3d", sec(25) + 0.04], ["h3e", sec(28) + 0.04],
    ["h4a", sec(31) + 0.1], ["h4b", sec(34) + 0.05],
    ["h5a", sec(38) + 0.05], ["h5b", sec(41) + 0.05, 1.9], ["h6", sec(44) + 0.05],
    ["h7a", sec(46.5) + 0.3], ["h7b", sec(46.5) + 1.62], ["h7c", sec(46.5) + 2.82],
  ],
  durees: {
    h1a: 1.90, h1b: 1.37, h2a: 1.91, h2b: 1.64, h2c: 2.85, h3a: 2.28, h3b: 1.78, h3c: 1.60, h3d: 2.06, h3e: 2.30,
    h4a: 1.62, h4b: 2.69, h5a: 2.10, h5b: 1.79, h6: 1.12, h7a: 1.22, h7b: 1.07, h7c: 1.02,
  },
  sfx: ([
    // le vent dans les cèdres, le jour ; les insectes, la nuit (des fonds)
    [0.0, "sfx-jeu/boucle-feuilles.wav", 0.04, sec(38)],
    [sec(38) - 0.2, "sfx-jeu/boucle-insectes.wav", 0.04, sec(46.5) - sec(38) + 0.2],
    [0.6, "sfx-jeu/oiseau-uguisu.wav", 0.35],
    [sec(2.5) - 0.05, "sfx/shimmer-sparkle-sweep.mp3", 0.65], [sec(2.5), "sfx-jeu/magie.wav", 0.5],
    [sec(6) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(7) - 0.05, "sfx/shimmer-sparkle-sweep.mp3", 0.6],
    [sec(9) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(10) - 0.05, "sfx/shimmer-sparkle-sweep.mp3", 0.6],
    [sec(12) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(13) - 0.05, "sfx/shimmer-sparkle-sweep.mp3", 0.6],
    [sec(14.5), "sfx/sparkle-touch.mp3", 0.5],
    [sec(16) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(16) + 0.6, "sfx-jeu/papier.wav", 0.7],
    [sec(19) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(19) + 0.3, "sfx/sparkle-touch.mp3", 0.45],
    [sec(22) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(22) + 0.95, "sfx-jeu/kane.wav", 0.35, 3.2],
    [sec(25) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(25) + 0.6, "sfx/sparkle-touch.mp3", 0.6], [sec(25) + 0.6, "sfx-jeu/magie.wav", 0.3],
    [sec(28) - 0.14, "sfx/whoosh-fast.mp3", 0.9],
    [sec(31), "sfx-jeu/pression.wav", 0.38], [sec(31) + 0.12, "sfx-jeu/tampon.wav", 0.45], [sec(32.5) + 0.05, "sfx-jeu/cadeau.wav", 0.5],
    [sec(34) + 0.25, "sfx-jeu/pouf.wav", 0.35], [sec(35.5) + 0.5, "sfx/sparkle-touch.mp3", 0.5],
    [sec(38) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(38) + 0.3, "sfx/light-spell.mp3", 0.18, 2.0],
    [sec(41) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(41) + 0.2, "sfx/light-spell.mp3", 0.2, 2.2],
    [sec(44), "sfx/bass-hit-short.mp3", 0.2], [sec(44) + 0.05, "sfx/sparkle-touch.mp3", 0.6],
    [sec(46.5) - 0.14, "sfx/whoosh-fast.mp3", 0.4], [sec(46.5) + 0.25, "sfx/bass-hit-short.mp3", 0.27], [sec(46.5) + 0.3, "sfx/pop.mp3", 0.27],
  ] as Bande["sfx"]).map(([a, nom, v, d]): Bande["sfx"][number] => (d === undefined ? [a, nom, v * DOUX] : [a, nom, v, d])),
};

const Textes: React.FC = () => (
  <>
    <Cadre texte={"I rebuilt\n*the Thirty Buddhas*…"} de={-12} a={s(2.12)} />
    <Cadre texte="…in my *video game* 🎮" de={s(2.2)} a={b(6) - 6} />
    <Etiquette n="9" nom="Thirty Buddhas" ja="三十仏 · Oita" sous="NEW" de={b(3)} a={b(6) - 6} />
    <Cadre texte={"Pass the two\n*stone guardians* ⛩️"} de={b(6) + 2} a={b(9) - 4} />
    <Cadre texte="Climb the *mossy stairs*" de={b(9) + 2} a={b(12) - 4} />
    <Cadre texte={"…and find *thirty little*\n*Buddhas* under the cliff 🙏"} de={b(12) + 2} a={b(16) - 4} />
    <Cadre texte={"Give *straw sandals*\nto the guardians 🩴"} de={b(16) + 2} a={b(19) - 4} />
    <Cadre texte="See a *sea of clouds* ☁️" de={b(19) + 2} a={b(22) - 4} />
    <Cadre texte="Ring the *great bell* 🔔" de={b(22) + 2} a={b(25) - 4} />
    <Cadre texte={"Light a *candle*\nfor today's Buddha 🕯️"} de={b(25) + 2} a={b(28) - 4} />
    <Cadre texte={"…and call to the *echo*\nof the cliff! 📣"} de={b(28) + 2} a={b(31) - 4} />
    <Cadre texte="Get all *five stamps*…" de={b(31) + 3} a={b(34) - 3} />
    <Cadre texte={"…and earn the *yamabushi's*\n*stole* and conch!"} de={b(34) + 3} a={b(38) - 4} />
    <Cadre texte={"But never ring\nthe *bell at night*… 🌙"} de={b(38) + 3} a={b(41) - 4} />
    <Cadre texte={"…something comes\n*down the mountain*. 🔥"} de={b(41) + 3} a={b(44) - 4} />
    <Cadre texte="*Dare* to find out? 👀" de={b(44) + 3} a={b(46.5) - 4} />
    <Fin de={b(46.5)} titre="The Thirty Buddhas in 3D" ligne="+ 8 more places · free" />
  </>
);

/** La lueur chaude de la bougie : de jour, la lampe du jeu se voit à peine sur la pierre ; une douce tache dorée autour de la
 *  flamme (x, y : sa place dans l'image, de 0 à 1), qui naît quand elle s'allume (image de) et s'efface avant le plan suivant. */
const Lueur: React.FC<{ de: number; a: number; x: number; y: number }> = ({ de, a, x, y }) => {
  const f = useCurrentFrame();
  if (f < de || f > a) return null;
  const o = expoSortie(entre(f, de, de + 14)) * (1 - entre(f, a - 10, a)) * (0.92 + 0.08 * Math.sin(f * 0.9) * Math.sin(f * 0.37));
  return (
    <AbsoluteFill style={{ opacity: o, mixBlendMode: "screen", pointerEvents: "none" }}>
      <div style={{
        position: "absolute", left: x * 1080 - 260, top: y * 1920 - 260, width: 520, height: 520, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,214,140,.75) 0%, rgba(255,170,80,.32) 22%, rgba(255,140,60,.10) 48%, rgba(255,120,40,0) 70%)",
      }} />
    </AbsoluteFill>
  );
};

const FLOU: [number, number][] = [6, 9, 12, 16, 19, 22, 25, 28, 38, 41, 46.5].map((n): [number, number] => [b(n) - 18, b(n) + 18]);

export const Bouddhas: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const f = useCurrentFrame();
  const flou = FLOU.some(([a, z]) => f >= a && f <= z);
  const image = (
    <AbsoluteFill style={{ backgroundColor: C.nuit }}>
      <Plans plans={PLANS} />
      <Lueur de={b(25) + s(0.6)} a={b(28)} x={0.62} y={0.515} />
      <AbsoluteFill style={{ background: "linear-gradient(rgba(0,0,0,.32) 0px, rgba(0,0,0,.12) 380px, rgba(0,0,0,0) 640px)", opacity: f < b(46.5) ? 1 : 1 - expoSortie(entre(f, b(46.5), b(46.5) + 20)) }} />
      <Textes />
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill>
      {flou ? <CameraMotionBlur shutterAngle={240} samples={8}>{image}</CameraMotionBlur> : image}
      <Son bande={BANDE} bgm={bgm} />
    </AbsoluteFill>
  );
};
