// La vidéo « jarre » de la carte (2026-11-02) : 20 s, 9:16 pour TikTok, 60 images/s.
// Avec ou sans la musique (props { bgm: false } : pour mettre un son TikTok ; les bruitages restent). Et sa miniature.
import React from "react";
import { Composition } from "remotion";
import { Jarre } from "./Jarre";
import { Miniature } from "./Miniature";
import { DUREE, FPS, H, W } from "./theme";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Jarre" component={Jarre} durationInFrames={DUREE} fps={FPS} width={W} height={H} defaultProps={{ bgm: true }} />
    <Composition id="Miniature" component={Miniature} durationInFrames={1} fps={FPS} width={W} height={H} />
  </>
);
