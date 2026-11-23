// Les vidéos du calendrier de l'Avent (2026-11-23) : la promo « les cadeaux sont vrais » et le tutoriel de la grue, 9:16 pour
// TikTok (et les Shorts), 60 images/s. Avec ou sans la musique (props { bgm: false } : pour mettre un son TikTok ; les bruitages
// restent). Et leurs miniatures.
import React from "react";
import { Composition } from "remotion";
import { Cadeaux, DUREE_CADEAUX, MiniatureCadeaux } from "./Cadeaux";
import { DUREE_GRUE, Grue, MiniatureGrue } from "./Grue";
import { FPS, H, W } from "./theme";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Cadeaux" component={Cadeaux} durationInFrames={DUREE_CADEAUX} fps={FPS} width={W} height={H} defaultProps={{ bgm: true }} />
    <Composition id="Grue" component={Grue} durationInFrames={DUREE_GRUE} fps={FPS} width={W} height={H} defaultProps={{ bgm: true }} />
    <Composition id="MiniatureCadeaux" component={MiniatureCadeaux} durationInFrames={1} fps={FPS} width={W} height={H} />
    <Composition id="MiniatureGrue" component={MiniatureGrue} durationInFrames={1} fps={FPS} width={W} height={H} />
  </>
);
