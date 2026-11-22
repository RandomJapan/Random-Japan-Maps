// La vidéo « générique d'animé » de la carte (2026-11-22) : 9:16 pour TikTok, 60 images/s. Avec ou sans la chanson (props
// { bgm: false } : pour mettre un son TikTok ; les bruitages restent). Et sa miniature. Puis la vidéo 2 (la chanson n° 2, l'héroïne).
import React from "react";
import { Composition } from "remotion";
import { Generique } from "./Generique";
import { Miniature } from "./Miniature";
import { DUREE, FPS, H, W } from "./theme";
import { Fille } from "./fille/Fille";
import { MiniatureFille } from "./fille/Miniature";
import { DUREE as DUREE_FILLE } from "./fille/temps";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Generique" component={Generique} durationInFrames={DUREE} fps={FPS} width={W} height={H} defaultProps={{ bgm: true }} />
    <Composition id="Miniature" component={Miniature} durationInFrames={1} fps={FPS} width={W} height={H} />
    {/* la vidéo 2 : la chanson n° 2 et l'héroïne (fille/) */}
    <Composition id="GeneriqueFille" component={Fille} durationInFrames={DUREE_FILLE} fps={FPS} width={W} height={H} defaultProps={{ bgm: true }} />
    <Composition id="MiniatureFille" component={MiniatureFille} durationInFrames={1} fps={FPS} width={W} height={H} />
  </>
);
