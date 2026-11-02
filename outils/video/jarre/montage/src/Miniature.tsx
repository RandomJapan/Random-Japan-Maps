// La miniature à mettre sur TikTok (une image fixe, à part de la vidéo : collée en première image, elle aurait gâché le mystère de
// l'accroche) : la jarre ouverte, le Japon dedans, ses points sur la carte, et les mots de la vidéo.
import React from "react";
import { AbsoluteFill, Freeze, Img, OffthreadVideo, staticFile } from "remotion";
import { Mots } from "./Commun";
import { C, s } from "./theme";

const moitie = (cote: "gauche" | "droite") => {
  const signe = cote === "gauche" ? -1 : 1;
  return (
    <Img key={cote} src={staticFile(`img/moitie-${cote}.png`)} style={{
      position: "absolute", inset: 0, width: 1080, height: 1920, transformOrigin: `${cote === "gauche" ? 0 : 100}% 80%`,
      transform: `translateX(${signe * 330}px) rotate(${signe * 2.4}deg) scale(1.04)`,
    }} />
  );
};

export const Miniature: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.nuit }}>
    <Freeze frame={0}>
      <OffthreadVideo src={staticFile("rushes/ja-plongee.mp4")} muted trimBefore={s(0.72)} style={{ position: "absolute", inset: 0, width: 1080, height: 1920, transform: "scale(1.08) translateY(60px)" }} />
    </Freeze>
    {moitie("gauche")}{moitie("droite")}
    <AbsoluteFill style={{ background: "linear-gradient(rgba(0,0,0,.35) 0px, rgba(0,0,0,0) 620px)" }} />
    <Mots texte={"*150+* PLACES\nONE *3D* MAP"} de={-200} a={1} y={250} taille={118} />
  </AbsoluteFill>
);
