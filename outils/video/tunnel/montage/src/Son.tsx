// Le son : la voix off (Flora, ElevenLabs v3, « Sarah »), calée sur les moments du brief ; un bruitage pour chaque
// animation et chaque appui (le tap, le « whoosh » du plongeon, le pop de la fiche et la cascade de pops des
// épingles faits avec Flora pour cette vidéo, le reste repris des vidéos d'avant) ; la musique (props bgm) sous la
// voix, baissée de moitié quand elle parle. Tout part 2 images en avance : l'AAC du MP4 retarde le son d'autant.
import React from "react";
import { interpolate, Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { DUREE, s } from "./theme";

const AVANCE = 2;
const VOLUME_VOIX = 0.36;
const VOLUME_SFX = 0.32;
const VOLUME_MUSIQUE = 0.9;
const BAISSE_SOUS_VOIX = 0.5;
const DEBUT_MUSIQUE = 30; // s dans « Amenoshita3 »

// [fichier, début (s), durée (s)]
const VOIX: [string, number, number][] = [
  ["v1-trouve", 0.3, 1.68], ["v2-profil", 3.4, 2.74], ["v3-plonge", 7.55, 0.7], ["v4-carte", 9.0, 4.28], ["v5-epingles", 13.35, 2.22],
  ["v6-fiche", 18.05, 3.6], ["v7-filtres", 21.95, 3.59], ["v8-nom", 25.6, 1.54], ["v9-voyage", 27.45, 2.01],
];
// [début (s), fichier, volume]
const SFX: [number, string, number][] = [
  [0, "swoosh-quick", 0.9],
  [3.0, "tap", 3.5], [3.04, "whoosh-fast", 1.0],
  [3.3, "ui-message-pop", 0.6], [3.42, "switch-click-quick", 0.5], [3.55, "switch-click-quick", 0.45], [3.72, "switch-click-quick", 0.4],
  [6.55, "sparkle-touch", 0.9],
  [7.5, "tap", 3.5], [7.62, "zoom-air-fast", 1.0], [8.2, "plongee", 1.5], [8.63, "bass-hit-short", 1.0],
  [8.85, "pop", 0.8], [8.97, "ui-message-pop", 0.5], [9.1, "ui-message-pop", 0.4],
  [12.8, "pops", 1.4],
  [16.95, "whoosh-fast", 1.0],
  [17.88, "tap", 3.0], [18.0, "pop", 1.2], [18.02, "paper-slide", 0.7],
  [21.15, "paper-move-quick", 0.8], [21.5, "swoosh-quick", 1.0],
  [21.95, "paper-slide", 0.7], [22.0, "switch-click-quick", 0.35],
  [22.58, "tap", 3.5], [22.6, "transition-snap", 0.8],
  [23.08, "tap", 3.5], [23.12, "pops", 1.0], [23.65, "swoosh-quick", 0.7],
  [24.85, "pops", 0.7],
  [25.0, "air-whoosh-powerful", 1.0], [25.45, "bass-hit-short", 1.0], [25.47, "pop", 0.9],
  [26.05, "switch-click-quick", 0.35], [26.5, "switch-click-quick", 0.35],
  [27.5, "shimmer-sparkle-sweep", 0.8], [28.25, "ui-success-soft", 0.7],
];

const borne = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
/** 1 pendant que la voix parle (en fondu sur 0,1 s), 0 sinon : pour baisser la musique dessous. */
const sousVoix = (f: number) => Math.max(0, ...VOIX.map(([, a, d]) =>
  Math.min(interpolate(f, [s(a) - 6, s(a)], [0, 1], borne), interpolate(f, [s(a + d), s(a + d) + 6], [1, 0], borne))));

export const Son: React.FC<{ bgm: boolean }> = ({ bgm }) => (
  <>
    {bgm ? (
      <Audio src={staticFile("musique/peritune-amenoshita3.m4a")} trimBefore={s(DEBUT_MUSIQUE)}
        volume={(f) => VOLUME_MUSIQUE * (1 - BAISSE_SOUS_VOIX * sousVoix(f)) * interpolate(f, [0, s(0.4), DUREE - s(1.5), DUREE], [0, 1, 1, 0], borne)} />
    ) : null}
    {VOIX.map(([nom, a]) => (
      <Sequence key={nom} from={s(a) - AVANCE} layout="none"><Audio src={staticFile(`voix/court/${nom}.wav`)} volume={VOLUME_VOIX} /></Sequence>
    ))}
    {SFX.map(([a, nom, v], i) => (
      <Sequence key={i} from={Math.max(0, s(a) - AVANCE)} durationInFrames={s(2.2)} layout="none">
        <Audio src={staticFile(`sfx/${nom}.mp3`)} volume={v * VOLUME_SFX} />
      </Sequence>
    ))}
  </>
);
