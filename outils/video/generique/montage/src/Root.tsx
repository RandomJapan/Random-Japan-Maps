// La vidéo « générique d'animé » de la carte (2026-11-22) : 9:16 pour TikTok, 60 images/s. Avec ou sans la chanson (props
// { bgm: false } : pour mettre un son TikTok ; les bruitages restent). Et sa miniature.
import React from "react";
import { Composition } from "remotion";
import { Generique } from "./Generique";
import { Miniature } from "./Miniature";
import { DUREE, FPS, H, W } from "./theme";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Generique" component={Generique} durationInFrames={DUREE} fps={FPS} width={W} height={H} defaultProps={{ bgm: true }} />
    <Composition id="Miniature" component={Miniature} durationInFrames={1} fps={FPS} width={W} height={H} />
  </>
);
