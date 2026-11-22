// La vidéo « générique d'animé » de la carte (2026-11-22) : 9:16 pour TikTok, 60 images/s. Avec ou sans la chanson (props
// { bgm: false } : pour mettre un son TikTok ; les bruitages restent). Et sa miniature. Puis la vidéo 2 (la chanson n° 2, l'héroïne),
// la vidéo 3 (la chanson n° 3, le héros) et la vidéo 4 (la chanson n° 4, l'héroïne).
import React from "react";
import { Composition } from "remotion";
import { Generique } from "./Generique";
import { Miniature } from "./Miniature";
import { DUREE, FPS, H, W } from "./theme";
import { Fille } from "./fille/Fille";
import { MiniatureFille } from "./fille/Miniature";
import { DUREE as DUREE_FILLE } from "./fille/temps";
import { Heros3 } from "./h3/Heros3";
import { DUREE as DUREE_3 } from "./h3/temps";
import { Fille4 } from "./f4/Fille4";
import { DUREE as DUREE_4 } from "./f4/temps";
import { MiniatureSuite } from "./suite/Miniature";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Generique" component={Generique} durationInFrames={DUREE} fps={FPS} width={W} height={H} defaultProps={{ bgm: true }} />
    <Composition id="Miniature" component={Miniature} durationInFrames={1} fps={FPS} width={W} height={H} />
    {/* la vidéo 2 : la chanson n° 2 et l'héroïne (fille/) */}
    <Composition id="GeneriqueFille" component={Fille} durationInFrames={DUREE_FILLE} fps={FPS} width={W} height={H} defaultProps={{ bgm: true }} />
    <Composition id="MiniatureFille" component={MiniatureFille} durationInFrames={1} fps={FPS} width={W} height={H} />
    {/* la vidéo 3 : la chanson n° 3 et le héros (h3/) ; la vidéo 4 : la chanson n° 4 et l'héroïne (f4/) */}
    <Composition id="GeneriqueHeros3" component={Heros3} durationInFrames={DUREE_3} fps={FPS} width={W} height={H} defaultProps={{ bgm: true }} />
    <Composition id="MiniatureHeros3" component={MiniatureSuite} durationInFrames={1} fps={FPS} width={W} height={H}
      defaultProps={{ src: "clips/heros-pop.mp4", t: 0.75, lignes: ["IF MY *JAPAN MAP*", "HAD AN *ANIME*", "OPENING 3 ⚔️"], zoom: 1.08, origine: "50% 65%" }} />
    <Composition id="GeneriqueFille4" component={Fille4} durationInFrames={DUREE_4} fps={FPS} width={W} height={H} defaultProps={{ bgm: true }} />
    <Composition id="MiniatureFille4" component={MiniatureSuite} durationInFrames={1} fps={FPS} width={W} height={H}
      defaultProps={{ src: "clips/fille-tourne.mp4", t: 1.34, lignes: ["IF MY *JAPAN MAP*", "HAD AN *ANIME*", "OPENING 4 🌸"], petales: true, zoom: 1.08, origine: "50% 65%" }} />
  </>
);
