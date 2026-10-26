// Les vidéos de la balade 3D (2026-10-26) : 30 s, 9:16 pour TikTok, 60 images/s. Avec ou sans la musique
// (props { bgm: false } : pour mettre un son TikTok ; la voix et les bruitages restent).
import React from "react";
import { Composition } from "remotion";
import { Secrets } from "./Secrets";
import { Takachiho } from "./Takachiho";
import { Tour } from "./Tour";
import { DUREE, FPS, H, W } from "./theme";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="BaladeTour" component={Tour} durationInFrames={DUREE} fps={FPS} width={W} height={H} defaultProps={{ bgm: true }} />
    <Composition id="BaladeTakachiho" component={Takachiho} durationInFrames={DUREE} fps={FPS} width={W} height={H} defaultProps={{ bgm: true }} />
    <Composition id="BaladeSecrets" component={Secrets} durationInFrames={DUREE} fps={FPS} width={W} height={H} defaultProps={{ bgm: true }} />
  </>
);
