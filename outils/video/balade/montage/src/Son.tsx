// Le son d'une vidéo de la balade : l'air du jeu (props bgm : avec ou sans, pour mettre un son TikTok ; la voix et les
// bruitages restent), la voix off (Flora, ElevenLabs v4, « Sarah ») et les bruitages, chacun à son temps. La musique
// baisse sous la voix. Tout part 2 images en avance : l'AAC du MP4 retarde le son d'autant.
import React from "react";
import { interpolate, Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { DUREE, s } from "./theme";

const AVANCE = 2;
const VOLUME_VOIX = 0.9;
const VOLUME_SFX = 0.5;
const BAISSE_SOUS_VOIX = 0.45;
const borne = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export type Bande = {
  musique: { fichier: string; debut: number; volume: number }; // debut : la seconde de l'air à l'image 0
  voix: [string, number][]; // [fichier de voix/court, début (s)]
  sfx: [number, string, number][]; // [début (s), fichier (sfx/… ou sfx-jeu/…, avec l'extension), volume]
  durees: Record<string, number>; // la durée de chaque réplique (s)
};

export const Son: React.FC<{ bande: Bande; bgm: boolean }> = ({ bande, bgm }) => {
  const sousVoix = (f: number) => Math.max(0, ...bande.voix.map(([nom, a]) => {
    const d = bande.durees[nom] ?? 2;
    return Math.min(interpolate(f, [s(a) - 8, s(a)], [0, 1], borne), interpolate(f, [s(a + d), s(a + d) + 10], [1, 0], borne));
  }));
  const m = bande.musique;
  return (
    <>
      {bgm ? (
        <Audio src={staticFile(`musique/${m.fichier}`)} trimBefore={Math.max(0, s(m.debut) + AVANCE)}
          volume={(f) => m.volume * (1 - BAISSE_SOUS_VOIX * sousVoix(f)) * interpolate(f, [0, 3, DUREE - s(1.4), DUREE], [0, 1, 1, 0], borne)} />
      ) : null}
      {bande.voix.map(([nom, a]) => (
        <Sequence key={nom} from={Math.max(0, s(a) - AVANCE)} layout="none"><Audio src={staticFile(`voix/court/${nom}.wav`)} volume={VOLUME_VOIX} /></Sequence>
      ))}
      {bande.sfx.map(([a, nom, v], i) => (
        <Sequence key={i} from={Math.max(0, s(a) - AVANCE)} durationInFrames={s(3.4)} layout="none">
          <Audio src={staticFile(nom)} volume={v * VOLUME_SFX} />
        </Sequence>
      ))}
    </>
  );
};
