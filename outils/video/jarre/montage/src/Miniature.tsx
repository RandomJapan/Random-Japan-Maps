// La miniature à mettre sur TikTok (une image fixe, à part de la vidéo : collée en première image, elle aurait gâché le mystère de
// l'accroche) : la jarre ouverte par les mains, le Japon et ses points au fond du trou, et les mots de la vidéo.
import React from "react";
import { AbsoluteFill, Freeze, Img, OffthreadVideo, staticFile } from "remotion";
import { Mots } from "./Commun";
import { C, s } from "./theme";
import { TROU } from "./temps";

export const Miniature: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.nuit }}>
    <Freeze frame={0}>
      <OffthreadVideo src={staticFile("rushes/ja-plongee.mp4")} muted trimBefore={s(0.72)} style={{
        position: "absolute", inset: 0, width: 1080, height: 1920, transform: `translate(${TROU[0] - 540}px, ${TROU[1] - 960}px) scale(0.62)`,
      }} />
    </Freeze>
    <Img src={staticFile("img/jarre-ouverte.png")} style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }} />
    <AbsoluteFill style={{ background: "linear-gradient(rgba(0,0,0,.35) 0px, rgba(0,0,0,0) 520px)" }} />
    <Mots texte={"*150+* PLACES\nONE *3D* MAP"} de={-200} a={1} y={150} taille={118} />
  </AbsoluteFill>
);
