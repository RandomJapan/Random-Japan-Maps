// Le son d'une vidéo de la balade : l'air du jeu (props bgm : avec ou sans, pour mettre un son TikTok ; la voix et les
// bruitages restent), la voix off (Flora, ElevenLabs v4, « Sarah ») et les bruitages, chacun à son temps. La musique
// baisse sous la voix. Tout part 2 images en avance : l'AAC du MP4 retarde le son d'autant.
import React from "react";
import { interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { s } from "./theme";

const AVANCE = 2;
const VOLUME_VOIX = 0.9;
const VOLUME_SFX = 0.5;
const BAISSE_SOUS_VOIX = 0.45;
const ECART_MINI = 0.08; // (s) entre deux répliques
const borne = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export type Bande = {
  musique: { fichier: string; debut: number; volume: number }; // debut : la seconde de l'air à l'image 0
  voix: [string, number][]; // [fichier de voix/court, début (s)]
  sfx: [number, string, number][]; // [début (s), fichier (sfx/… ou sfx-jeu/…, avec l'extension), volume]
  durees: Record<string, number>; // la durée de chaque réplique (s)
};

/** Le rendu s'arrête si deux répliques se superposent, si l'une n'a pas sa durée ou si elle finit après la vidéo. */
const verifier = (bande: Bande, fin: number) => {
  const v = [...bande.voix].sort((p, q) => p[1] - q[1]);
  v.forEach(([nom, a], i) => {
    const d = bande.durees[nom];
    if (d === undefined) throw new Error(`réplique ${nom} : durée inconnue`);
    if (a + d > fin - 0.5) throw new Error(`réplique ${nom} : finit à ${(a + d).toFixed(2)} s, la vidéo à ${fin.toFixed(2)} s`);
    const suivante = v[i + 1];
    if (suivante && a + d + ECART_MINI > suivante[1]) throw new Error(`répliques ${nom} et ${suivante[0]} : elles se superposent (${(a + d).toFixed(2)} s > ${suivante[1].toFixed(2)} s)`);
  });
};

export const Son: React.FC<{ bande: Bande; bgm: boolean }> = ({ bande, bgm }) => {
  const { durationInFrames: duree, fps } = useVideoConfig();
  verifier(bande, duree / fps);
  const sousVoix = (f: number) => Math.max(0, ...bande.voix.map(([nom, a]) => {
    const d = bande.durees[nom];
    return Math.min(interpolate(f, [s(a) - 8, s(a)], [0, 1], borne), interpolate(f, [s(a + d), s(a + d) + 10], [1, 0], borne));
  }));
  const m = bande.musique;
  return (
    <>
      {bgm ? (
        <Audio src={staticFile(`musique/${m.fichier}`)} trimBefore={Math.max(0, s(m.debut) + AVANCE)}
          volume={(f) => m.volume * (1 - BAISSE_SOUS_VOIX * sousVoix(f)) * interpolate(f, [0, 3, duree - s(1.4), duree], [0, 1, 1, 0], borne)} />
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
