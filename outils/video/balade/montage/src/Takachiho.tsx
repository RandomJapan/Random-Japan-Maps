// Vidéo 2 : une balade en détail, Takachiho : la vraie cascade de Manai (la vidéo du propriétaire), puis le jeu ; la
// barque sous la cascade et son tampon, les nouilles qui glissent, le kagura de la nuit ; le reflet sur la paroi, le
// miroir, l'éclipse, la porte de la grotte et sa lumière, le koban ; le collier de magatama ; la fin. 30 s sur l'air de
// Takachiho (92 battements, depuis l'entrée de sa mélodie).
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { Cadre, Etiquette, Fin, Plan, Plans } from "./commun";
import { Bande, Son } from "./Son";
import { C, entre, expoSortie, FPS } from "./theme";

const BPM = 92;
export const b = (n: number) => Math.round((n * 60 * FPS) / BPM);
const sec = (n: number) => (n * 60) / BPM;

export const PLANS: Plan[] = [
  { de: 0, a: b(6), prise: "tk-eau", t: 0.2, zoom: [1.0, 1.06], reel: { lieu: "takachiho", t: 0, volet: b(3) } },
  { de: b(6), a: b(12), prise: "tk-rame", t: 0.05, entree: "fouet" },
  { de: b(12), a: b(14), prise: "tk-rame", t: 7.65, entree: "punch" },
  { de: b(14), a: b(18), prise: "tk-somen", t: 11.0, entree: "fouet", zoom: [1.02, 1.1], centre: [0.5, 0.55] },
  { de: b(18), a: b(22), prise: "tk-kagura", t: 5.0, entree: "fouet", zoom: [1.12, 1.19], centre: [0.44, 0.5] },
  { de: b(22), a: b(26), prise: "tk-miroir", t: 4.55, entree: "fouet", zoom: [1.0, 1.1], centre: [0.4545, 0.5] },
  { de: b(26), a: b(28), prise: "tk-eclipse", t: 1.45, entree: "punch" },
  { de: b(28), a: b(31), prise: "tk-eclipse", t: 6.3 },
  { de: b(31), a: b(32), prise: "tk-eclipse", t: 12.8 },
  { de: b(32), a: b(36), prise: "tk-grotte", t: 19.7, entree: "punch" },
  { de: b(36), a: b(38), prise: "tk-eclipse", t: 25.0, entree: "eclair" },
  { de: b(38), a: b(41), prise: "tk-collier", t: 15.6, entree: "punch" },
  { de: b(41), a: b(46), prise: "tk-eau", t: 2.0, entree: "fouet" },
];

const BANDE: Bande = {
  musique: { fichier: "takachiho.wav", debut: 0.15 + sec(8), volume: 2.8 },
  voix: [["b1", 0.15], ["b2", sec(6) + 0.1], ["b3", sec(14) + 0.05], ["b4", sec(18) + 0.05], ["b5", sec(22) + 0.05], ["b6", sec(26) + 0.1], ["b7", sec(41) + 0.2]],
  durees: { b1: 3.05, b2: 1.69, b3: 1.42, b4: 2.22, b5: 3.41, b6: 3.88, b7: 3.21 },
  sfx: [
    [0.0, "sfx-jeu/oiseau-mouette.wav", 0.0],
    [sec(3) - 0.05, "sfx/shimmer-sparkle-sweep.mp3", 0.9], [sec(3), "sfx-jeu/magie.wav", 0.7],
    [sec(6) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(6) + 0.3, "sfx-jeu/rame.wav", 0.8], [sec(7) + 0.2, "sfx-jeu/rame.wav", 0.7],
    [sec(12), "sfx-jeu/pression.wav", 1.0], [sec(12) + 0.1, "sfx-jeu/tampon.wav", 1.2],
    [sec(14) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(15.5), "sfx-jeu/slurp.wav", 0.9],
    [sec(18) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(18) + 0.1, "sfx/taiko.mp3", 0.7],
    [sec(22) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(23), "sfx/sparkle-touch.mp3", 0.9],
    [sec(26), "sfx-jeu/magie.wav", 0.8], [sec(28), "sfx/montee.mp3", 0.8], [sec(31), "sfx-jeu/coq.wav", 0.7],
    [sec(32), "sfx-jeu/roc.wav", 1.0], [sec(34), "sfx/impact-epic-trailer.mp3", 1.0], [sec(34) + 0.05, "sfx/light-spell.mp3", 0.8],
    [sec(36), "sfx-jeu/koban.wav", 1.2], [sec(38), "sfx-jeu/cadeau.wav", 1.2],
    [sec(41) - 0.14, "sfx/whoosh-fast.mp3", 0.8], [sec(41) + 0.25, "sfx/bass-hit-short.mp3", 0.9], [sec(41) + 0.3, "sfx/pop.mp3", 0.8],
  ],
};

const Textes: React.FC = () => (
  <>
    <Cadre texte={"This gorge in Japan\nhides a *legend*…"} de={-12} a={b(6) - 6} />
    <Etiquette nom="Takachiho Gorge" ja="高千穂峡 · Miyazaki" de={b(4)} a={b(6) - 6} />
    <Cadre texte="Row under the *falls* 🚣" de={b(6) + 6} a={b(14) - 6} />
    <Cadre texte="Catch flowing *noodles* 🍜" de={b(14) + 6} a={b(18) - 5} />
    <Cadre texte="At night, the *gods* dance ✨" de={b(18) + 6} a={b(22) - 5} />
    <Cadre texte={"Something shines\non the cliff… 👀"} de={b(22) + 6} a={b(26) - 5} />
    <Cadre texte={"Hang the *mirror*\nfacing the cave…"} de={b(26) + 6} a={b(32) - 5} />
    <Cadre texte="…and bring back the *sun* ☀️" de={b(33) + 6} a={b(38) - 5} />
    <Cadre texte="5 stamps = a *reward* 🎁" de={b(38) + 6} a={b(41) - 5} />
    <Fin de={b(41)} titre="Takachiho in 3D" ligne="+ 4 more places · free" />
  </>
);

const FLOU: [number, number][] = [6, 14, 18, 22, 41].map((n): [number, number] => [b(n) - 18, b(n) + 18]);

export const Takachiho: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const f = useCurrentFrame();
  const flou = FLOU.some(([a, z]) => f >= a && f <= z);
  const image = (
    <AbsoluteFill style={{ backgroundColor: C.nuit }}>
      <Plans plans={PLANS} />
      <AbsoluteFill style={{ background: "linear-gradient(rgba(0,0,0,.32) 0px, rgba(0,0,0,.12) 380px, rgba(0,0,0,0) 640px)", opacity: f < b(41) ? 1 : 1 - expoSortie(entre(f, b(41), b(41) + 20)) }} />
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
