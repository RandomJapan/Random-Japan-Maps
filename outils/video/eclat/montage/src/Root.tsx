// La vidéo « éclat » (2026-10-27) : 14,6 s, 9:16 pour TikTok, 60 images/s. Avec ou sans la musique (props { bgm: false } :
// pour mettre un son TikTok ; les bruitages restent).
import React from "react";
import { Composition } from "remotion";
import { Eclat, LONGUEUR } from "./Eclat";
import { FPS, H, W } from "./theme";

export const RemotionRoot: React.FC = () => (
  <Composition id="Eclat" component={Eclat} durationInFrames={LONGUEUR} fps={FPS} width={W} height={H} defaultProps={{ bgm: true }} />
);
