// La vidéo promo de 30 s de la carte (2026-10-21), en 16:9 et en vertical 9:16 pour TikTok, 30 images/s. Avec ou sans la musique (props { bgm: false } :
// pour mettre un son TikTok ; la voix et les bruitages restent).
import React from "react";
import { Composition } from "remotion";
import { Promo } from "./Promo";
import { DUREE, FPS } from "./theme";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Promo30" component={Promo} durationInFrames={DUREE} fps={FPS} width={1920} height={1080} defaultProps={{ bgm: true }} />
    {/* la version TikTok, verticale 9:16 */}
    <Composition id="Promo30V" component={Promo} durationInFrames={DUREE} fps={FPS} width={1080} height={1920} defaultProps={{ bgm: true }} />
  </>
);
