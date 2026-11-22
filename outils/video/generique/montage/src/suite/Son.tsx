// Le son des vidéos 3 et 4 : la chanson, prise à son image AVANCE − V0 (la vidéo commence au milieu de la chanson), et les bruitages
// (secondes de la vidéo, fichier, volume, durée avant de s'éteindre).
import React from "react";
import { Audio, interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import { s } from "../theme";

const AVANCE = 2; // l'AAC du MP4 retarde le son d'autant
export type Bruit = [number, string, number, number?];

export const Son: React.FC<{ bgm: boolean; chanson: string; v0: number; volume?: number; bruits: Bruit[] }> = ({ bgm, chanson, v0, volume = 0.8, bruits }) => {
  const { durationInFrames: duree } = useVideoConfig();
  return (
    <>
      {bgm && <Audio src={staticFile(chanson)} trimBefore={AVANCE - v0} volume={volume} />}
      {bruits.map(([a, nom, v, d], i) => (
        <Sequence key={i} from={Math.max(0, s(a) - AVANCE)} durationInFrames={Math.min(s(d ?? 3), duree)} layout="none">
          <Audio src={staticFile(nom)} volume={d === undefined ? v : (g) => v * interpolate(g, [s(d) - 12, s(d)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
        </Sequence>
      ))}
    </>
  );
};
