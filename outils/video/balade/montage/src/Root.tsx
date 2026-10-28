// Les vidéos de la balade 3D (2026-10-26 ; le Pavillon d'or, 2026-10-27 ; Beppu, 2026-10-28) : 30 à 34 s, 9:16 pour TikTok, 60 images/s. Avec ou sans la musique
// (props { bgm: false } : pour mettre un son TikTok ; la voix et les bruitages restent).
import React from "react";
import { Composition } from "remotion";
import { Enfers, LONGUEUR as L5 } from "./Enfers";
import { LONGUEUR as L4, Pavillon } from "./Pavillon";
import { LONGUEUR as L3, Secrets } from "./Secrets";
import { LONGUEUR as L2, Takachiho } from "./Takachiho";
import { LONGUEUR as L1, Tour } from "./Tour";
import { FPS, H, W } from "./theme";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="BaladeTour" component={Tour} durationInFrames={L1} fps={FPS} width={W} height={H} defaultProps={{ bgm: true }} />
    <Composition id="BaladeTakachiho" component={Takachiho} durationInFrames={L2} fps={FPS} width={W} height={H} defaultProps={{ bgm: true }} />
    <Composition id="BaladeSecrets" component={Secrets} durationInFrames={L3} fps={FPS} width={W} height={H} defaultProps={{ bgm: true }} />
    <Composition id="BaladeKinkakuji" component={Pavillon} durationInFrames={L4} fps={FPS} width={W} height={H} defaultProps={{ bgm: true }} />
    <Composition id="BaladeBeppu" component={Enfers} durationInFrames={L5} fps={FPS} width={W} height={H} defaultProps={{ bgm: true }} />
  </>
);
