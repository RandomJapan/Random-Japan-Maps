// Les vidéos de la balade 3D (2026-10-26 ; le Pavillon d'or, 2026-10-27 ; Beppu, 2026-10-28 ; Motonosumi, 2026-10-29 ; les Trente Bouddhas, 2026-10-30 ; Udo et Yakushima, 2026-11-02 ; les dunes de Tottori, 2026-11-04 ; « What if my game was real? », 2026-11-12) : 19 à 55 s, 9:16 pour TikTok, 60 images/s. Avec ou sans la musique
// (props { bgm: false } : pour mettre un son TikTok ; la voix et les bruitages restent).
import React from "react";
import { Composition } from "remotion";
import { Bouddhas, LONGUEUR as L7 } from "./Bouddhas";
import { LONGUEUR as L8, Traversee } from "./Traversee";
import { Dunes, LONGUEUR as L9 } from "./Dunes";
import { Enfers, LONGUEUR as L5 } from "./Enfers";
import { EnVrai, LONGUEUR_EN_VRAI as L10 } from "./EnVrai";
import { LONGUEUR as L6, Torii } from "./Torii";
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
    <Composition id="BaladeMotonosumi" component={Torii} durationInFrames={L6} fps={FPS} width={W} height={H} defaultProps={{ bgm: true }} />
    <Composition id="BaladeSanjubutsu" component={Bouddhas} durationInFrames={L7} fps={FPS} width={W} height={H} defaultProps={{ bgm: true }} />
    <Composition id="BaladeUdoYakushima" component={Traversee} durationInFrames={L8} fps={FPS} width={W} height={H} defaultProps={{ bgm: true }} />
    <Composition id="BaladeTottori" component={Dunes} durationInFrames={L9} fps={FPS} width={W} height={H} defaultProps={{ bgm: true }} />
    <Composition id="BaladeEnVrai" component={EnVrai} durationInFrames={L10} fps={FPS} width={W} height={H} defaultProps={{ bgm: true }} />
  </>
);
