// Vidéo 4 (2026-10-27) : le sixième lieu de la balade, le Pavillon d'or (Kinkaku-ji), pour l'annoncer. Le vrai pavillon et
// son reflet (la vidéo du propriétaire), puis le jeu ; l'étang-miroir ; la carpe de la Porte du Dragon (la vraie cascade,
// puis celle du jeu), la pièce dans le bol des statues, le matcha, le goshuin (le vrai, puis celui du jeu) ; la récompense,
// les ailes du phénix ; la nuit, le phénix qui manque au reflet et la lueur d'or qui s'envole ; la fin sur le feu d'artifice
// reflété dans l'étang. 30 s sur l'air du Pavillon d'or (84 battements, depuis l'entrée de sa mélodie).
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { Cadre, Etiquette, Fin, Plan, Plans } from "./commun";
import { Bande, Son } from "./Son";
import { C, entre, expoSortie, FPS, s } from "./theme";

const BPM = 84;
export const b = (n: number) => Math.round((n * 60 * FPS) / BPM);
const sec = (n: number) => (n * 60) / BPM;
/** 30 s : la fin (« Kinkaku-ji, in 3D. Link in bio. ») garde plus d'une seconde après la voix. */
export const LONGUEUR = s(30);

export const PLANS: Plan[] = [
  { de: 0, a: b(6), prise: "kk-reflet", t: 0.3, zoom: [1.0, 1.05], reel: { lieu: "kinkakuji", t: 0, volet: b(2) } },
  { de: b(6), a: b(9), prise: "kk-miroir", t: 0.5, entree: "fouet" },
  // (la carpe saute à 4,2 s de la prise : juste après le volet)
  { de: b(9), a: b(12), prise: "kk-ryumon", t: 3.0, vitesse: 1.15, entree: "fouet", reel: { lieu: "kk-cascade", t: 0, volet: b(1) } },
  // (la pièce part à 9,95 s de la prise et tombe dans le bol à 10,6 s, quand la caméra du jeu revient derrière le voyageur :
  // le plan s'arrête là)
  { de: b(12), a: b(15.5), prise: "kk-zeni", t: 7.9, vitesse: 1.08, entree: "fouet" },
  { de: b(15.5), a: b(18), prise: "kk-matcha", t: 4.2, entree: "fouet" },
  // (le pinceau écrit de 3,5 à 6,8 s de la prise, les sceaux tombent à 7 s : deux fois plus vite, tout tient dans le plan)
  { de: b(18), a: b(21), prise: "kk-goshuin", t: 3.5, vitesse: 2, entree: "fouet", reel: { lieu: "kk-goshuin", t: 0, volet: b(1) } },
  // (la carte de la récompense arrive à 15,6 s de la prise ; dans la course, le pavillon paraît à 4,8 s)
  { de: b(21), a: b(23), prise: "kk-ailes", t: 15.6, entree: "punch", zoom: [1.5, 1.58], centre: [0.49, 0.39] },
  { de: b(23), a: b(25), prise: "kk-course", t: 3.9, entree: "fouet" },
  // la nuit : le pavillon et son reflet ; le vrai toit, avec son phénix ; le toit du reflet, sans ; la lueur qui s'envole
  // (dans la prise : le large jusqu'à 4,2 s, le toit du reflet, le vrai toit de 6,5 à 7,6 s, le toit du reflet ; la lueur y
  // naît à 12 s et passe par-dessus le toit vers 16 s ; les premiers feux d'artifice éclatent vers 8,5 s)
  { de: b(25), a: b(27), prise: "kk-nuit", t: 1.2, entree: "punch" },
  { de: b(27), a: b(28), prise: "kk-nuit", t: 6.7, entree: "punch" },
  { de: b(28), a: b(35), prise: "kk-nuit", t: 9.6, vitesse: 1.4, entree: "punch" },
  { de: b(35), a: LONGUEUR, prise: "kk-feux", t: 6.3, entree: "fouet" },
];

// Chaque réplique (ou morceau de réplique, voix.py) tombe avec son texte à l'écran ; Son vérifie qu'elles ne se
// superposent pas.
const BANDE: Bande = {
  musique: { fichier: "kinkakuji.wav", debut: 0.15 + sec(8), volume: 2.6 },
  voix: [
    ["d1a", 0.15], ["d1b", 2.25], ["d2", sec(6) + 0.05], ["d3", sec(9) + 0.1], ["d4", sec(12) + 0.05], ["d5", sec(15.5) + 0.1],
    ["d6", sec(18) + 0.1], ["d7", sec(21) + 0.05], ["d8a", sec(25) + 0.1], ["d8b", sec(27) + 0.02], ["d9", 22.3],
    ["d10a", sec(35) + 0.3], ["d10b", 26.35], ["d10c", 27.65],
  ],
  durees: { d1a: 1.95, d1b: 1.32, d2: 2.05, d3: 1.65, d4: 1.44, d5: 0.99, d6: 1.4, d7: 2.0, d8a: 1.05, d8b: 2.46, d9: 1.46, d10a: 0.8, d10b: 1.05, d10c: 0.98 },
  sfx: [
    // les cigales de l'été (le jour), puis la nuit ; un fond, loin sous la voix (le propriétaire : « les sons d'ambiance
    // sont trop fort » ; à 0,5, elles couvraient presque la voix : la boucle est normalisée, 4 dB RMS sous le maximum)
    [0.0, "sfx-jeu/boucle-semi.wav", 0.04, 12.6], [12.5, "sfx-jeu/boucle-semi.wav", 0.04, sec(25) - 12.5],
    [sec(2) - 0.05, "sfx/shimmer-sparkle-sweep.mp3", 0.9], [sec(2), "sfx-jeu/magie.wav", 0.7],
    [sec(6) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(6) + 0.35, "sfx/sparkle-touch.mp3", 0.7],
    [sec(9) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(10), "sfx/shimmer-sparkle-sweep.mp3", 0.6], [sec(9) + 1.04, "sfx-jeu/plouf.wav", 1.0],
    [sec(12) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(12) + 1.9, "sfx-jeu/piece.wav", 1.2], [sec(12) + 2.42, "sfx-jeu/bol.wav", 1.2],
    [sec(15.5) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(15.5) + 0.2, "sfx-jeu/chasen.wav", 0.9],
    [sec(18) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(19), "sfx/shimmer-sparkle-sweep.mp3", 0.6], [sec(19) + 0.2, "sfx-jeu/pinceau.wav", 1.0], [sec(18) + 1.75, "sfx-jeu/sceaux.wav", 1.2],
    [sec(21), "sfx-jeu/cadeau.wav", 1.2], [sec(23) - 0.14, "sfx/whoosh-fast.mp3", 0.9], [sec(23) + 0.1, "sfx/stardust-swish.mp3", 0.7],
    [sec(25), "sfx/bass-hit-short.mp3", 0.8], [sec(27), "sfx/sparkle-touch.mp3", 0.8],
    [sec(28) + 0.3, "sfx/montee.mp3", 0.6], [sec(28) + 1.2, "sfx-jeu/magie.wav", 0.8], [sec(28) + 1.7, "sfx/light-spell.mp3", 0.6],
    [sec(35) - 0.14, "sfx/whoosh-fast.mp3", 0.8], [sec(35) + 0.25, "sfx/bass-hit-short.mp3", 0.9], [sec(35) + 0.3, "sfx/pop.mp3", 0.8],
    // (les feux d'artifice de la prise, à 8,6, 9,0, 9,6 et 10,0 s)
    ...[8.6, 9.0, 9.6, 10.0].map((t, i): [number, string, number] => [sec(35) + t - 6.3, "sfx-jeu/feu-boum.wav", 0.35 - 0.04 * i]),
  ],
};

const Textes: React.FC = () => (
  <>
    <Cadre texte={"I rebuilt the\n*Golden Pavilion*…"} de={-12} a={s(2.12)} />
    <Cadre texte="…in my *video game* 🎮" de={s(2.25)} a={b(6) - 6} />
    <Etiquette n="6" nom="Kinkaku-ji" ja="金閣寺 · Kyoto" sous="NEW" de={b(3)} a={b(6) - 6} />
    <Cadre texte="Its pond is a real *mirror* 🪞" de={b(6) + 4} a={b(9) - 4} />
    <Cadre texte="Watch the *carp* leap 🐟" de={b(9) + 6} a={b(12) - 5} />
    <Cadre texte="Toss a *coin* for luck 🪙" de={b(12) + 5} a={b(15.5) - 5} />
    <Cadre texte="Sip *matcha* 🍵" de={b(15.5) + 6} a={b(18) - 5} />
    <Cadre texte="Get your temple *seal* ✍️" de={b(18) + 6} a={b(21) - 5} />
    <Cadre texte={"…and earn the\n*phoenix wings* 🔥"} de={b(21) + 3} a={b(25) - 5} />
    <Cadre texte="But at *night*… 🌙" de={b(25) + 6} a={b(27) - 3} />
    <Cadre texte={"the *phoenix* vanishes\nfrom the reflection! 👀"} de={b(27)} a={s(21.9)} />
    <Cadre texte={"Can you find\nwhere it *went*? ✨"} de={s(22.25)} a={b(35) - 5} />
    <Fin de={b(35)} titre="Kinkaku-ji in 3D" ligne="+ 5 more places · free" />
  </>
);

const FLOU: [number, number][] = [6, 9, 12, 15.5, 18, 23, 35].map((n): [number, number] => [b(n) - 18, b(n) + 18]);

export const Pavillon: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const f = useCurrentFrame();
  const flou = FLOU.some(([a, z]) => f >= a && f <= z);
  const image = (
    <AbsoluteFill style={{ backgroundColor: C.nuit }}>
      <Plans plans={PLANS} />
      <AbsoluteFill style={{ background: "linear-gradient(rgba(0,0,0,.32) 0px, rgba(0,0,0,.12) 380px, rgba(0,0,0,0) 640px)", opacity: f < b(35) ? 1 : 1 - expoSortie(entre(f, b(35), b(35) + 20)) }} />
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
