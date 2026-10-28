// Vidéo 5 (2026-10-28) : le septième lieu de la balade, les Enfers de Beppu, pour l'annoncer. Le vrai lieu (la vidéo du
// propriétaire : l'eau turquoise, la boue grise, le lac de sang), puis le même enfer dans le jeu ; la rue qui fume ; un enfer tous les trois temps : les œufs cuits dans l'eau bleue, la bulle de
// boue grise, le démon qui ronfle, le grand démon rouge, l'étang blanc, le lac de sang, le geyser sous son toit de pierre ;
// le cinquième tampon et les cornes d'oni ; la nuit, le secret, montré sans être résolu : une pierre d'Ippen qui luit, une
// autre jetée dans un enfer ; la fin sur la rue, la nuit. Sur l'air de jour de Beppu (108 battements, depuis l'entrée de sa mélodie).
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { Cadre, Etiquette, Fin, Plan, Plans } from "./commun";
import { Bande, Son } from "./Son";
import { C, entre, expoSortie, FPS, s } from "./theme";

const BPM = 108;
export const b = (n: number) => Math.round((n * 60 * FPS) / BPM);
const sec = (n: number) => (n * 60) / BPM;
/** 34,4 s : la fin (« Beppu, in 3D. Link in bio. ») garde plus d'une seconde après la voix. */
export const LONGUEUR = s(34.4);

export const PLANS: Plan[] = [
  { de: 0, a: b(8), prise: "bp-umi", t: 0.3, zoom: [1.0, 1.05], reel: { lieu: "beppu", t: 0, volet: b(2.5) } },
  { de: b(8), a: b(11), prise: "bp-rue", t: 1.0, entree: "fouet" },
  // (le panier sort de l'eau à 0,3 s de la prise et monte pendant deux secondes)
  { de: b(11), a: b(14), prise: "bp-oeufs", t: 0.4, entree: "fouet" },
  // (la grosse bulle gonfle de 0,2 à 2,8 s de la prise, puis crève : un peu plus vite, elle crève au milieu du plan)
  { de: b(14), a: b(17), prise: "bp-bulle", t: 1.2, vitesse: 1.2, entree: "fouet", reel: { lieu: "bp-boue", t: 0, volet: b(1) } },
  // (le démon ronfle à 0,4 s de la prise)
  { de: b(17), a: b(20), prise: "bp-ronfle", t: 0.3, entree: "fouet" },
  { de: b(20), a: b(23), prise: "bp-oni", t: 0.5, entree: "punch" },
  { de: b(23), a: b(26), prise: "bp-shiraike", t: 0.5, entree: "fouet" },
  { de: b(26), a: b(29), prise: "bp-chinoike", t: 0.5, entree: "fouet", reel: { lieu: "bp-sang", t: 0, volet: b(1) } },
  // (le geyser part à 1,1 s de la prise, à pleine force à 1,9 s)
  { de: b(29), a: b(34), prise: "bp-geyser", t: 0.8, entree: "fouet" },
  // (le cinquième tampon se presse à 6,5 s de la prise ; la carte de la récompense, les cornes, arrive à 11,85 s)
  { de: b(34), a: b(35.5), prise: "bp-tampon", t: 6.52, entree: "punch" },
  { de: b(35.5), a: b(37), prise: "bp-tampon", t: 11.8, entree: "punch" },
  { de: b(37), a: b(41), prise: "bp-cornes", t: 0.4, entree: "punch" },
  { de: b(41), a: b(46), prise: "bp-pierre", t: 0.3, entree: "fouet" },
  // (la nuit, comme la pierre. Le voyageur lance la pierre à 2,2 s de la prise ; elle tombe dans l'eau à 3,15 s ; la prière luit
  // jusqu'à 6,6 s)
  { de: b(46), a: b(51), prise: "bp-lancer", t: 2.1, entree: "fouet" },
  { de: b(51), a: b(54), prise: "bp-lancer", t: 4.9, entree: "punch", zoom: [1.15, 1.22], centre: [0.5, 0.42] },
  { de: b(54), a: LONGUEUR, prise: "bp-nuit", t: 0.5, entree: "fouet" },
];

// Les bruitages à −4 dB (DOUX, comme pour le Pavillon d'or), et les coups (le taiko, la basse) plus bas encore : mesurés sur le
// premier rendu, le taiko du démon était aussi fort que la voix ; tous environ 10 dB sous elle. Les sons longs (le ronflement, le
// geyser, la lumière de la fin) ont une durée : sinon coupés net à 3,4 s, ou débordant sur le plan suivant. L'ambiance, les
// fumerolles, 20 dB sous la voix (à 0,04 : la boucle est normalisée, aussi forte que la voix).
const DOUX = 0.6;

// Chaque réplique (ou morceau de réplique, voix.py) tombe avec son texte à l'écran ; Son vérifie qu'elles ne se
// superposent pas.
const BANDE: Bande = {
  musique: { fichier: "beppu.wav", debut: 0.15 + sec(8), volume: 3.2 },
  // (quatre morceaux sortis de Flora plus bas que les autres, de 2 à 6 dB : remontés au niveau des autres ; « Beppu, » quand le
  // titre de la fin paraît)
  voix: [
    ["e1a", 0.15, 1.3], ["e1b", 2.25], ["e2", sec(8) + 0.04, 1.6], ["f1a", sec(11) + 0.02], ["f1b", sec(14) + 0.04, 1.45], ["f1c", sec(17) + 0.04],
    ["f1d", sec(20) + 0.03], ["f2a", sec(23) + 0.03], ["f2b", sec(26) + 0.04, 2.1], ["f2c", sec(29) + 0.05], ["e10a", sec(34) + 0.05],
    ["e10b", sec(37) + 0.05], ["e11", sec(41) + 0.05], ["e12", sec(46) + 0.05], ["e13", sec(51) + 0.05],
    ["e14a", sec(54) + 0.42], ["e14b", sec(54) + 1.15], ["e14c", sec(54) + 2.35],
  ],
  durees: {
    e1a: 1.95, e1b: 1.41, e2: 1.56, f1a: 1.6, f1b: 1.36, f1c: 1.25, f1d: 1.51, f2a: 1.53, f2b: 1.2, f2c: 2.04, e10a: 1.56, e10b: 1.64,
    e11: 2.47, e12: 2.36, e13: 1.06, e14a: 0.62, e14b: 1.12, e14c: 0.98,
  },
  sfx: ([
    // les fumerolles, le jour (un fond)
    [0.0, "sfx-jeu/boucle-vapeur.wav", 0.04, sec(34)],
    [sec(2.5) - 0.05, "sfx/shimmer-sparkle-sweep.mp3", 0.65], [sec(2.5), "sfx-jeu/magie.wav", 0.5],
    [sec(8) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(8) + 0.3, "sfx-jeu/pschitt.wav", 0.3],
    [sec(11) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(11) + 0.02, "sfx-jeu/plouf.wav", 0.8],
    [sec(14) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(15) - 0.05, "sfx/shimmer-sparkle-sweep.mp3", 0.6], [sec(14) + 1.33, "sfx-jeu/bulle.wav", 1.0],
    [sec(17) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(17) + 0.1, "sfx-jeu/oiseau-ronfle.wav", 0.42, 1.8],
    [sec(20), "sfx/taiko.mp3", 0.3], [sec(20), "sfx/bass-hit-short.mp3", 0.2],
    [sec(23) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(23) + 0.2, "sfx/sparkle-touch.mp3", 0.6],
    [sec(26) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(26) + 0.05, "sfx/impact-deep-whoosh.mp3", 0.35], [sec(27) - 0.05, "sfx/shimmer-sparkle-sweep.mp3", 0.6],
    [sec(29) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(29) + 0.3, "sfx-jeu/oiseau-geyser.wav", 0.45, 2.6],
    [sec(34) + 0.36, "sfx-jeu/pression.wav", 0.38], [sec(34) + 0.5, "sfx-jeu/tampon.wav", 0.45], [sec(35.5) + 0.05, "sfx-jeu/cadeau.wav", 0.5],
    [sec(37), "sfx-jeu/pouf.wav", 0.35], [sec(37) + 0.05, "sfx/taiko.mp3", 0.22],
    [sec(41) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(41) + 0.3, "sfx/sparkle-touch.mp3", 0.8],
    [sec(46) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(46) + 0.08, "sfx/whoosh-swirl.mp3", 0.5], [sec(46) + 1.06, "sfx-jeu/plouf.wav", 0.55],
    [sec(46) + 1.15, "sfx-jeu/magie.wav", 0.6], [sec(51), "sfx/light-spell.mp3", 0.3, 2.0],
    [sec(54) - 0.14, "sfx/whoosh-fast.mp3", 0.4], [sec(54) + 0.25, "sfx/bass-hit-short.mp3", 0.27], [sec(54) + 0.3, "sfx/pop.mp3", 0.27],
  ] as Bande["sfx"]).map(([a, nom, v, d]): Bande["sfx"][number] => (d === undefined ? [a, nom, v * DOUX] : [a, nom, v, d])),
};

const Textes: React.FC = () => (
  <>
    <Cadre texte={"I rebuilt the\n*Hells of Beppu*…"} de={-12} a={s(2.12)} />
    <Cadre texte="…in my *video game* 🎮" de={s(2.25)} a={b(8) - 6} />
    <Etiquette n="7" nom="Beppu" ja="別府地獄 · Ōita" sous="NEW" de={b(3.5)} a={b(8) - 6} />
    <Cadre texte="Even the streets *steam*! 💨" de={b(8) + 2} a={b(11) - 4} />
    <Cadre texte="Boil *eggs* in a blue hell 🥚" de={b(11) + 1} a={b(14) - 4} />
    <Cadre texte="Watch the *mud* bubble 🫧" de={b(14) + 2} a={b(17) - 4} />
    <Cadre texte="Hear an *oni* snore 😴" de={b(17) + 2} a={b(20) - 4} />
    <Cadre texte="Meet the big *red demon* 👹" de={b(20) + 2} a={b(23) - 4} />
    <Cadre texte="See a milky *white* pond ♨️" de={b(23) + 2} a={b(26) - 4} />
    <Cadre texte="A pond of *blood*… 🩸" de={b(26) + 2} a={b(29) - 4} />
    <Cadre texte={"…and a *geyser* under\na stone roof! 💦"} de={b(29) + 3} a={b(34) - 4} />
    <Cadre texte="Get all *five stamps*…" de={b(34) + 3} a={b(37) - 3} />
    <Cadre texte={"…and earn the\n*oni horns*! 😈"} de={b(37) + 3} a={b(41) - 4} />
    <Cadre texte={"But the monk *Ippen*\nhid three stones… 🪨"} de={b(41) + 3} a={b(46) - 4} />
    <Cadre texte={"Throw each one into\na *different hell*! 🔥"} de={b(46) + 3} a={b(51) - 4} />
    <Cadre texte="Can you *find* them? 👀" de={b(51) + 3} a={b(54) - 4} />
    <Fin de={b(54)} titre="Beppu in 3D" ligne="+ 6 more places · free" />
  </>
);

const FLOU: [number, number][] = [8, 11, 14, 17, 23, 26, 29, 41, 46, 54].map((n): [number, number] => [b(n) - 18, b(n) + 18]);

export const Enfers: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const f = useCurrentFrame();
  const flou = FLOU.some(([a, z]) => f >= a && f <= z);
  const image = (
    <AbsoluteFill style={{ backgroundColor: C.nuit }}>
      <Plans plans={PLANS} />
      <AbsoluteFill style={{ background: "linear-gradient(rgba(0,0,0,.32) 0px, rgba(0,0,0,.12) 380px, rgba(0,0,0,0) 640px)", opacity: f < b(54) ? 1 : 1 - expoSortie(entre(f, b(54), b(54) + 20)) }} />
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
