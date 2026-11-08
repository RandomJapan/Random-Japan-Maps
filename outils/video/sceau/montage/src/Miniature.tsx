// La miniature à mettre sur TikTok (une image fixe, à part de la vidéo : collée en première image, elle aurait gâché la surprise du
// tampon, comme pour la jarre) : le gros plan du sceau de cire, le Japon en relief dedans, et les mots de la vidéo.
import React from "react";
import { AbsoluteFill, Freeze, OffthreadVideo, staticFile } from "remotion";
import { Mots } from "./Commun";
import { C, FPS } from "./theme";

export const Miniature: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.nuit }}>
    {/* (dans une composition d'une image, Freeze ne déplace pas la vidéo : on la coupe avant avec trimBefore, comme la jarre) */}
    <Freeze frame={0}>
      <OffthreadVideo src={staticFile("clips/cire-japon.mp4")} muted trimBefore={Math.round(1.0 * FPS)} style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }} />
    </Freeze>
    <AbsoluteFill style={{ background: "linear-gradient(rgba(0,0,0,.4) 0px, rgba(0,0,0,0) 560px)" }} />
    <Mots texte={"*150+* PLACES\nONE *3D* MAP"} de={-200} a={1} y={150} taille={118} />
  </AbsoluteFill>
);
