// La vidéo « minuit » (2026-10-31) : la dernière nuit d'Halloween sur la carte, 22,5 s, 9:16, 60 images/s, en anglais.
// L'accroche (« This map is haunted… until midnight », l'horloge, le plongeon dans son centre), ce que l'événement
// montre (les chapeaux, le panneau et le défilé des cent démons, trois yōkai de près, la chasse), minuit (la cloche :
// tout disparaît), la fin (« Tonight is the last night », l'adresse, « Link in bio »). Le flou de mouvement (8 sous-images
// par image, 14 pendant le plongeon) seulement pendant les mouvements rapides.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { Accroche } from "./Accroche";
import { Carte } from "./Carte";
import { Fin } from "./Fin";
import { Bande, Son } from "./Son";
import { b } from "./theme";
import { T } from "./temps";

const FLOU: [number, number][] = [
  [T.plonge[0] - 2, b(6) + 2],
  [T.fouet1[0] - 2, T.fouet1[1] + 4], [T.fouet2[0] - 2, T.fouet2[1] + 4], [T.fouet3[0] - 2, T.fouet3[1] + 4],
];

// le tic-tac de l'horloge, un par temps : dans l'accroche (temps 0 → 5), puis les trois dernières secondes avant minuit
const TICS: [number, string, number][] = [0, 1, 2, 3, 4, 5, 30, 31, 32].map((n) => [n * 0.5, n % 2 ? "sfx/tac.wav" : "sfx/tic.wav", n >= 30 ? 0.6 : 0.4]);

const BANDE: Bande = {
  musique: { fichier: "minuit.wav", debut: 0, volume: 0.13 },
  voix: [
    // (deux morceaux sortis de Flora plus bas que les autres, de 4 à 5 dB : « …until midnight », « …it all disappears »)
    ["m1a", 0.1], ["m1b", 1.84, 1.4], // « This map is haunted… » « …until midnight. »
    ["m2", 3.08], // « Every pin wears a witch hat, »
    ["m3a", 5.1], ["m3b", 7.0], // « summon the Night Parade… » « …of a hundred demons, »
    ["m4", 12.12], // « and hunt seven hidden yokai! »
    ["m5a", 15.1], ["m5b", 16.58, 1.5], // « But at midnight… » « …it all disappears. »
    ["m6a", 18.32], ["m6b", 20.55], // « Tonight is the last night. » « Link in bio! »
  ],
  durees: { m1a: 1.66, m1b: 1.08, m2: 1.88, m3a: 1.62, m3b: 1.56, m4: 2.04, m5a: 0.95, m5b: 1.46, m6a: 1.8, m6b: 0.98 },
  sfx: [
    // (mesurés sur les rendus : chaque bruitage au moins 9 dB sous la voix ; au premier, le coup sourd, le plongeon et les
    // coups de basse étaient plus forts qu'elle)
    // l'accroche : un éclair, le tic-tac, l'horloge, le plongeon
    [0, "sfx/tonnerre.mp3", 0.06, 2.2], [0.06, "sfx/bass-hit-short.mp3", 0.08], ...TICS,
    [1.62, "sfx/pop.mp3", 0.4], [2.42, "sfx/swoosh-quick.mp3", 0.22], [2.5, "sfx/zoom-air-fast.mp3", 0.18], [2.6, "sfx/plongee.mp3", 0.07],
    [3.0, "sfx/bass-hit-short.mp3", 0.08],
    // les chapeaux
    [3.05, "sfx/pops.mp3", 0.9], [3.1, "sfx/sparkle-touch.mp3", 0.4],
    // le panneau, le défilé
    [4.82, "sfx/whoosh-fast.mp3", 0.7], [5.02, "sfx/pop.mp3", 0.45], [5.34, "sfx/tap.mp3", 1.8], [5.44, "sfx/paper-slide.mp3", 0.6],
    [6.3, "sfx/tap.mp3", 1.8], [6.5, "sfx/paper-move-quick.mp3", 0.5], [6.55, "sfx/swoosh-quick.mp3", 0.2],
    [7.05, "sfx/tampon.mp3", 0.8], [7.05, "sfx/bass-hit-short.mp3", 0.12], [7.2, "sfx/wing-flutter.mp3", 0.4],
    // les gros plans
    [9.0, "sfx/impact-zoom-quick.mp3", 0.2], [9.05, "sfx/tampon.mp3", 0.35], [10.0, "sfx/impact-zoom-quick.mp3", 0.2], [10.05, "sfx/tampon.mp3", 0.35],
    [11.0, "sfx/impact-zoom-quick.mp3", 0.2], [11.05, "sfx/tampon.mp3", 0.35],
    // la chasse
    [11.82, "sfx/whoosh-fast.mp3", 0.7], [12.5, "sfx/tap.mp3", 1.8], [12.55, "sfx/ui-message-pop.mp3", 0.5],
    [13.78, "sfx/ui-success-soft.mp3", 0.15], [13.78, "sfx/shimmer-sparkle-sweep.mp3", 0.3],
    // minuit
    [14.82, "sfx/whoosh-fast.mp3", 0.7], [15.02, "sfx/pop.mp3", 0.35],
    [16.5, "sfx/kane.wav", 0.18, 4.0], [16.5, "sfx/boum.wav", 0.05, 2.4], [16.52, "sfx/pouf.wav", 0.45], [16.62, "sfx/pouf.wav", 0.35], [16.72, "sfx/pouf.wav", 0.3],
    // la fin
    [17.95, "sfx/air-whoosh-powerful.mp3", 0.1], [18.0, "sfx/bass-hit-short.mp3", 0.06], [18.06, "sfx/pop.mp3", 0.3], [18.5, "sfx/wing-flutter.mp3", 0.3],
    [19.08, "sfx/tampon.mp3", 0.55], [20.0, "sfx/ui-success-soft.mp3", 0.18], [20.62, "sfx/sparkle-touch.mp3", 0.5],
  ],
};

const Plans: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <Carte />
    <Accroche />
    <Fin />
  </AbsoluteFill>
);

export const Minuit: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const f = useCurrentFrame();
  const flou = FLOU.some(([a, z]) => f >= a && f <= z);
  const plongeon = f >= FLOU[0][0] && f <= FLOU[0][1];
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {flou ? <CameraMotionBlur shutterAngle={plongeon ? 200 : 250} samples={plongeon ? 14 : 8}><Plans /></CameraMotionBlur> : <Plans />}
      <Son bande={BANDE} bgm={bgm} />
    </AbsoluteFill>
  );
};
