// Vidéo 2 : une balade en détail, Takachiho : la vraie cascade de Manai (la vidéo du propriétaire), puis le jeu ; la
// barque sous la cascade et son tampon, les nouilles qui glissent, le kagura de la nuit ; le reflet sur la paroi, le
// miroir, l'éclipse, la porte de la grotte et sa lumière, le koban ; le collier de magatama ; la fin. 31 s sur l'air de
// Takachiho (92 battements, depuis l'entrée de sa mélodie).
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { Cadre, Etiquette, Fin, Plan, Plans } from "./commun";
import { Bande, Son } from "./Son";
import { C, entre, expoSortie, FPS, s } from "./theme";

const BPM = 92;
export const b = (n: number) => Math.round((n * 60 * FPS) / BPM);
const sec = (n: number) => (n * 60) / BPM;
/** 31 s : la fin (« Takachiho, in 3D. Link in bio. ») garde une seconde après la voix. */
export const LONGUEUR = s(31);

export const PLANS: Plan[] = [
  { de: 0, a: b(6), prise: "tk-eau", t: 0.2, zoom: [1.0, 1.06], reel: { lieu: "takachiho", t: 0, volet: b(3) } },
  { de: b(6), a: b(11), prise: "tk-rame", t: 0.05, entree: "fouet" },
  { de: b(11), a: b(13), prise: "tk-rame", t: 7.65, entree: "punch" },
  { de: b(13), a: b(17), prise: "tk-somen", t: 11.0, entree: "fouet", zoom: [1.02, 1.1], centre: [0.5, 0.55] },
  { de: b(17), a: b(21), prise: "tk-kagura", t: 5.0, entree: "fouet", zoom: [1.12, 1.19], centre: [0.44, 0.5] },
  // (cinq temps : « But look closely. Something shines on the cliff. » ; le reflet brille au même moment qu'avant)
  { de: b(21), a: b(26), prise: "tk-miroir", t: 3.9, entree: "fouet", zoom: [1.0, 1.1], centre: [0.4545, 0.5] },
  { de: b(26), a: b(28), prise: "tk-eclipse", t: 1.45, entree: "punch" },
  { de: b(28), a: b(31), prise: "tk-eclipse", t: 6.3 },
  { de: b(31), a: b(32), prise: "tk-eclipse", t: 12.8 },
  { de: b(32), a: b(36), prise: "tk-grotte", t: 19.7, entree: "punch" },
  { de: b(36), a: b(38), prise: "tk-eclipse", t: 25.0, entree: "eclair" },
  { de: b(38), a: b(41), prise: "tk-collier", t: 15.6, entree: "punch" },
  { de: b(41), a: LONGUEUR, prise: "tk-eau", t: 0.65, entree: "fouet" },
];

// Chaque réplique (ou morceau de réplique, voix.py) tombe avec son texte à l'écran ; Son vérifie qu'elles ne se
// superposent pas.
const BANDE: Bande = {
  musique: { fichier: "takachiho.wav", debut: 0.15 + sec(8), volume: 2.8 },
  voix: [
    ["b1", 0.15], ["b2", sec(6) + 0.1], ["b3", sec(13) + 0.05], ["b4", sec(17) + 0.05],
    ["b5a", sec(21)], ["b5b", 15.12], ["b6a", sec(26) + 0.2], ["b6b", 20.6],
    ["b7a", sec(41) + 0.15], ["b7b", 27.75], ["b7c", 28.9],
  ],
  durees: { b1: 3.05, b2: 1.69, b3: 1.42, b4: 2.22, b5a: 1.32, b5b: 1.79, b6a: 1.97, b6b: 1.56, b7a: 0.68, b7b: 0.94, b7c: 0.97 },
  sfx: [
    [0.0, "sfx-jeu/oiseau-mouette.wav", 0.0],
    [sec(3) - 0.05, "sfx/shimmer-sparkle-sweep.mp3", 0.9], [sec(3), "sfx-jeu/magie.wav", 0.7],
    [sec(6) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(6) + 0.3, "sfx-jeu/rame.wav", 0.8], [sec(7) + 0.2, "sfx-jeu/rame.wav", 0.7],
    [sec(11), "sfx-jeu/pression.wav", 1.0], [sec(11) + 0.1, "sfx-jeu/tampon.wav", 1.2],
    [sec(13) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(14.5), "sfx-jeu/slurp.wav", 0.9],
    [sec(17) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(17) + 0.1, "sfx/taiko.mp3", 0.7],
    [sec(21) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(23), "sfx/sparkle-touch.mp3", 0.9],
    // (le coq chante sous « …and bring back the sun! » : plus bas)
    [sec(26), "sfx-jeu/magie.wav", 0.8], [sec(28), "sfx/montee.mp3", 0.8], [sec(31), "sfx-jeu/coq.wav", 0.4],
    [sec(32), "sfx-jeu/roc.wav", 1.0], [sec(34), "sfx/impact-epic-trailer.mp3", 1.0], [sec(34) + 0.05, "sfx/light-spell.mp3", 0.8],
    [sec(36), "sfx-jeu/koban.wav", 1.2], [sec(38), "sfx-jeu/cadeau.wav", 1.2],
    [sec(41) - 0.14, "sfx/whoosh-fast.mp3", 0.8], [sec(41) + 0.25, "sfx/bass-hit-short.mp3", 0.9], [sec(41) + 0.3, "sfx/pop.mp3", 0.8],
  ],
};

const Textes: React.FC = () => (
  <>
    <Cadre texte={"This gorge in Japan\nhides a *legend*…"} de={-12} a={b(6) - 6} />
    <Etiquette nom="Takachiho Gorge" ja="高千穂峡 · Miyazaki" de={b(4)} a={b(6) - 6} />
    <Cadre texte="Row under the *waterfall* 🚣" de={b(6) + 6} a={b(13) - 6} />
    <Cadre texte="Catch flowing *noodles* 🍜" de={b(13) + 6} a={b(17) - 5} />
    <Cadre texte="Watch the *gods* dance at night ✨" de={b(17) + 6} a={b(21) - 5} />
    <Cadre texte="But look *closely*… 👀" de={b(21) + 4} a={s(14.92)} />
    <Cadre texte={"Something *shines*\non the cliff ✨"} de={s(15.12)} a={b(26) - 5} />
    <Cadre texte={"Hang the *mirror*\nfacing the cave…"} de={b(26) + 8} a={s(20.42)} />
    <Cadre texte="…and bring back the *sun* ☀️" de={s(20.6)} a={b(38) - 5} />
    <Cadre texte="5 stamps = a *reward* 🎁" de={b(38) + 6} a={b(41) - 5} />
    <Fin de={b(41)} titre="Takachiho in 3D" ligne="+ 4 more places · free" />
  </>
);

const FLOU: [number, number][] = [6, 13, 17, 21, 41].map((n): [number, number] => [b(n) - 18, b(n) + 18]);

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
