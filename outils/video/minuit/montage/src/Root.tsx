// La vidéo « minuit » de la carte (2026-10-31, la dernière nuit d'Halloween) : 22,5 s, 9:16 pour TikTok, 60 images/s.
// Avec ou sans la musique (props { bgm: false } : pour mettre un son TikTok ; la voix et les bruitages restent).
import React from "react";
import { Composition } from "remotion";
import { Minuit } from "./Minuit";
import { DUREE, FPS } from "./theme";

export const RemotionRoot: React.FC = () => (
  <Composition id="Minuit" component={Minuit} durationInFrames={DUREE} fps={FPS} width={1080} height={1920} defaultProps={{ bgm: true }} />
);
