// Les trois vidéos du jeu (2026-11-09, et « le créateur » le 2026-11-10) : 9:16 pour TikTok, 60 images/s. Avec ou sans la musique (props { bgm: false } : pour mettre un son
// TikTok ; la voix et les bruitages restent). Et leurs miniatures.
import React from "react";
import { Composition } from "remotion";
import { Createur, DUREE_CREATEUR, MiniatureCreateur } from "./Createur";
import { Defi, DUREE_DEFI } from "./Defi";
import { Devine, DUREE_DEVINE } from "./Devine";
import { MiniatureDefi, MiniatureDevine } from "./Miniature";
import { FPS, H, W } from "./theme";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Devine" component={Devine} durationInFrames={DUREE_DEVINE} fps={FPS} width={W} height={H} defaultProps={{ bgm: true }} />
    <Composition id="Defi" component={Defi} durationInFrames={DUREE_DEFI} fps={FPS} width={W} height={H} defaultProps={{ bgm: true }} />
    <Composition id="Createur" component={Createur} durationInFrames={DUREE_CREATEUR} fps={FPS} width={W} height={H} defaultProps={{ bgm: true }} />
    <Composition id="MiniatureDevine" component={MiniatureDevine} durationInFrames={1} fps={FPS} width={W} height={H} />
    <Composition id="MiniatureDefi" component={MiniatureDefi} durationInFrames={1} fps={FPS} width={W} height={H} />
    <Composition id="MiniatureCreateur" component={MiniatureCreateur} durationInFrames={1} fps={FPS} width={W} height={H} />
  </>
);
