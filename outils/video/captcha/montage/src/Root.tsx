// Trois compositions, réglées par fabriquer.py (les props) : l'intro, le nom (fond transparent) et l'écran de fin. Leur cadence et
// leur durée viennent des props (la cadence du plan du propriétaire).
import React from "react";
import { CalculateMetadataFunction, Composition } from "remotion";
import { Fin, PropsFin } from "./Fin";
import { Intro } from "./Intro";
import { Nom, PropsNom } from "./Nom";
import { H, PropsIntro, W } from "./theme";
import EXEMPLE from "./exemple.json";

function duree<P extends { fps: number; duree: number }>(): CalculateMetadataFunction<P> {
  return ({ props }) => ({ fps: props.fps, durationInFrames: Math.max(1, Math.round(props.duree * props.fps)) });
}

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Intro" component={Intro} width={W} height={H} fps={30} durationInFrames={54}
      defaultProps={EXEMPLE as unknown as PropsIntro} calculateMetadata={duree<PropsIntro>()} />
    <Composition id="Nom" component={Nom} width={W} height={H} fps={30} durationInFrames={90}
      defaultProps={{ fps: 30, duree: 3, nom: "Takaya Shrine", prefecture: "Kagawa", anime: true } as PropsNom} calculateMetadata={duree<PropsNom>()} />
    <Composition id="Fin" component={Fin} width={W} height={H} fps={30} durationInFrames={60}
      defaultProps={{ fps: 30, duree: 2, video: "exemple/fin-carte.mp4", nom: "Takaya Shrine" } as PropsFin} calculateMetadata={duree<PropsFin>()} />
  </>
);
