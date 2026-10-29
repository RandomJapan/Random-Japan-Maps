// Vidéo 6 (2026-10-29) : le huitième lieu de la balade, le sanctuaire Motonosumi, pour l'annoncer. Le vrai lieu (la vidéo du
// propriétaire : les torii qui serpentent jusqu'à la mer, le tunnel de torii, le grand torii, la mer qui jaillit), puis la même
// vue dans le jeu ; la liste de ce qu'on y fait, un moment par plan : la descente sous les 123 torii, la pièce lancée dans le
// tronc des offrandes tout en haut du grand torii, le souffle du dragon, le tofu offert aux renards de pierre ; le cinquième
// tampon et les oreilles et la queue de renard ; la nuit, le secret, montré sans être résolu : un 124e torii plus pâle, une
// flamme bleue au-dessus ; la fin sur les torii. Sur l'air de jour de Motonosumi (100 battements, depuis l'entrée de sa mélodie).
// (les plans de la liste durent quatre temps, pas trois : ses morceaux de phrase durent 2 à 2,3 s, plus que trois temps à 100)
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { Cadre, Etiquette, Fin, Plan, Plans } from "./commun";
import { Bande, Son } from "./Son";
import { C, entre, expoSortie, FPS, s } from "./theme";

const BPM = 100;
export const b = (n: number) => Math.round((n * 60 * FPS) / BPM);
const sec = (n: number) => (n * 60) / BPM;
/** 31,7 s : la fin (« Motonosumi, in 3D. Link in bio. ») garde plus d'une seconde après la voix. */
export const LONGUEUR = s(31.7);

export const PLANS: Plan[] = [
  { de: 0, a: b(8), prise: "mt-vue", t: 0.3, zoom: [1.0, 1.05], reel: { lieu: "motonosumi", t: 0, volet: b(2.5) } },
  { de: b(8), a: b(13), prise: "mt-tunnel", t: 0.6, entree: "fouet", reel: { lieu: "mt-tunnel", t: 0, volet: b(1.5) } },
  // (la pièce part de la main à 2,35 s de la prise et tombe dans le tronc à 3,1 s)
  { de: b(13), a: b(17), prise: "mt-piece", t: 1.3, entree: "fouet", reel: { lieu: "mt-otorii", t: 0, volet: b(1) } },
  // (la mer jaillit à 1,5 s de la prise, après sa vague)
  { de: b(17), a: b(21), prise: "mt-souffle", t: 0.6, entree: "fouet", reel: { lieu: "mt-souffle", t: 0, volet: b(1) } },
  // (le tofu posé vers 0,8 s ; le cinquième tampon paraît à 2,8 s ; la carte de la récompense, les oreilles de renard, à 8,45 s)
  { de: b(21), a: b(25), prise: "mt-kitsune", t: 0.3, entree: "fouet" },
  { de: b(25), a: b(26.5), prise: "mt-kitsune", t: 2.78, entree: "punch" },
  { de: b(26.5), a: b(28), prise: "mt-kitsune", t: 8.45, entree: "punch" },
  { de: b(28), a: b(32), prise: "mt-renard", t: 0.5, entree: "punch" },
  // (la nuit, un peu éclaircie : la flamme bleue et les torii se lisent sur un téléphone)
  { de: b(32), a: b(37), prise: "mt-nuit", t: 0.5, entree: "fouet", luminosite: 1.35 },
  { de: b(37), a: b(42), prise: "mt-124", t: 0.5, entree: "fouet", luminosite: 1.3 },
  // (la flamme est à 49 % de la largeur, 31 % de la hauteur : juste sous la légende)
  { de: b(42), a: b(45), prise: "mt-124", t: 3.5, entree: "punch", zoom: [1.3, 1.4], centre: [0.49, 0.31], luminosite: 1.3 },
  { de: b(45), a: LONGUEUR, prise: "mt-fin", t: 0.5, entree: "fouet" },
];

// Les niveaux de Beppu (mesurés) : les bruitages à −4 dB (DOUX), les coups plus bas encore, environ 10 dB sous la voix ; les sons
// longs avec une durée ; l'ambiance, les vagues, 20 dB sous la voix.
const DOUX = 0.6;

// Chaque réplique (ou morceau de réplique, voix.py) tombe avec son texte à l'écran ; Son vérifie qu'elles ne se
// superposent pas.
const BANDE: Bande = {
  // (l'air de Motonosumi est plus fort que celui de Beppu : au volume de Beppu, 3,6 à 9,6 dB seulement sous la voix ; les deux
  // morceaux de la nuit, sortis de Flora 2 à 3 dB plus bas que les autres, remontés)
  musique: { fichier: "motonosumi.wav", debut: 0.15 + sec(8), volume: 2.5 },
  voix: [
    ["g1a", 0.15], ["g1b", 2.3], ["g2a", sec(8) + 0.04, 1.1], ["g2b", sec(13) + 0.04], ["g2c", sec(17) + 0.04], ["g2d", sec(21) + 0.04],
    ["g3a", sec(25) + 0.05], ["g3b", sec(28) + 0.05], ["g4a", sec(32) + 0.05, 1.25], ["g4b", sec(37) + 0.05, 1.35], ["g5", sec(42) + 0.05],
    ["g6a", sec(45) + 0.42], ["g6b", sec(45) + 1.42], ["g6c", sec(45) + 2.6],
  ],
  durees: {
    g1a: 2.05, g1b: 1.47, g2a: 2.5, g2b: 2.28, g2c: 2.03, g2d: 1.99, g3a: 1.66, g3b: 2.1, g4a: 1.38, g4b: 2.01, g5: 0.92,
    g6a: 0.9, g6b: 1.08, g6c: 1.0,
  },
  sfx: ([
    // les vagues au pied du cap, le jour (un fond)
    [0.0, "sfx-jeu/boucle-vagues.wav", 0.04, sec(32)],
    [sec(2.5) - 0.05, "sfx/shimmer-sparkle-sweep.mp3", 0.65], [sec(2.5), "sfx-jeu/magie.wav", 0.5],
    [sec(8) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(9.5) - 0.05, "sfx/shimmer-sparkle-sweep.mp3", 0.6],
    [sec(13) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(14) - 0.05, "sfx/shimmer-sparkle-sweep.mp3", 0.6],
    [sec(13) + 1.05, "sfx-jeu/piece.wav", 0.8], [sec(13) + 1.8, "sfx-jeu/saisen.wav", 0.7],
    [sec(17) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(18) - 0.05, "sfx/shimmer-sparkle-sweep.mp3", 0.6],
    [sec(17) + 0.55, "sfx-jeu/oiseau-shiofuki.wav", 0.45, 2.2],
    [sec(21) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(21) + 1.6, "sfx/sparkle-touch.mp3", 0.6],
    [sec(25), "sfx-jeu/pression.wav", 0.38], [sec(25) + 0.12, "sfx-jeu/tampon.wav", 0.45], [sec(26.5) + 0.05, "sfx-jeu/cadeau.wav", 0.5],
    [sec(28), "sfx-jeu/pouf.wav", 0.35], [sec(28) + 0.3, "sfx-jeu/cri-kon.wav", 0.4],
    [sec(32) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(32) + 0.4, "sfx/sparkle-touch.mp3", 0.5],
    [sec(37) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(37) + 0.1, "sfx/light-spell.mp3", 0.2, 2.0],
    [sec(42), "sfx/bass-hit-short.mp3", 0.2], [sec(42) + 0.05, "sfx/sparkle-touch.mp3", 0.6],
    [sec(45) - 0.14, "sfx/whoosh-fast.mp3", 0.4], [sec(45) + 0.25, "sfx/bass-hit-short.mp3", 0.27], [sec(45) + 0.3, "sfx/pop.mp3", 0.27],
  ] as Bande["sfx"]).map(([a, nom, v, d]): Bande["sfx"][number] => (d === undefined ? [a, nom, v * DOUX] : [a, nom, v, d])),
};

const Textes: React.FC = () => (
  <>
    <Cadre texte={"I rebuilt\n*Motonosumi Shrine*…"} de={-12} a={s(2.27)} />
    <Cadre texte="…in my *video game* 🎮" de={s(2.38)} a={b(8) - 6} />
    <Etiquette n="8" nom="Motonosumi" ja="元乃隅神社 · Yamaguchi" sous="NEW" de={b(3.5)} a={b(8) - 6} />
    <Cadre texte={"Walk down a hundred and\ntwenty-three *red torii* ⛩️"} de={b(8) + 2} a={b(13) - 4} />
    <Cadre texte={"Toss a *coin* into the box\non top of the gate 🪙"} de={b(13) + 2} a={b(17) - 4} />
    <Cadre texte={"Watch the *sea burst*\nfrom the rocks 🌊"} de={b(17) + 2} a={b(21) - 4} />
    <Cadre texte={"…and feed *tofu*\nto the stone foxes!"} de={b(21) + 2} a={b(25) - 4} />
    <Cadre texte="Get all *five stamps*…" de={b(25) + 3} a={b(28) - 3} />
    <Cadre texte={"…and earn *fox ears*\nand a tail! 🦊"} de={b(28) + 3} a={b(32) - 4} />
    <Cadre texte="But some *nights*… 🌙" de={b(32) + 3} a={b(37) - 4} />
    <Cadre texte={"…there's *one torii*\ntoo many. ✨"} de={b(37) + 3} a={b(42) - 4} />
    <Cadre texte="Can you *find* it? 👀" de={b(42) + 3} a={b(45) - 4} />
    <Fin de={b(45)} titre="Motonosumi in 3D" ligne="+ 7 more places · free" />
  </>
);

const FLOU: [number, number][] = [8, 13, 17, 21, 32, 37, 45].map((n): [number, number] => [b(n) - 18, b(n) + 18]);

export const Torii: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const f = useCurrentFrame();
  const flou = FLOU.some(([a, z]) => f >= a && f <= z);
  const image = (
    <AbsoluteFill style={{ backgroundColor: C.nuit }}>
      <Plans plans={PLANS} />
      <AbsoluteFill style={{ background: "linear-gradient(rgba(0,0,0,.32) 0px, rgba(0,0,0,.12) 380px, rgba(0,0,0,0) 640px)", opacity: f < b(45) ? 1 : 1 - expoSortie(entre(f, b(45), b(45) + 20)) }} />
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
