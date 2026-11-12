// La miniature à mettre sur TikTok (une image fixe, à part de la vidéo, comme pour la jarre et le sceau) : la fléchette plantée
// dans l'affiche, à côté du point d'Aogashima, et les mots de l'accroche.
import React from "react";
import { AbsoluteFill, Freeze, OffthreadVideo, staticFile } from "remotion";
import { Mots } from "./Commun";
import { C, FPS } from "./theme";

export const Miniature: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.nuit }}>
    {/* (dans une composition d'une image, Freeze ne déplace pas la vidéo : on la coupe avant avec trimBefore, comme la jarre) */}
    <Freeze frame={0}>
      <OffthreadVideo src={staticFile("clips/VF2b.mp4")} muted trimBefore={Math.round(2.4 * FPS)} style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }} />
    </Freeze>
    <AbsoluteFill style={{ background: "linear-gradient(rgba(0,0,0,.4) 0px, rgba(0,0,0,0) 560px)" }} />
    <Mots texte={"I THREW A DART AT\nMY *JAPAN* MAP 🎯"} de={-200} a={1} y={170} taille={92} />
  </AbsoluteFill>
);
