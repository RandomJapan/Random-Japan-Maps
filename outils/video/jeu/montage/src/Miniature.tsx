// Les miniatures des deux vidéos, à choisir comme couverture sur TikTok. Le propriétaire publie la première image de son choix : une image
// qui pose la question, sans la réponse.
import React from "react";
import { AbsoluteFill, Freeze, OffthreadVideo, staticFile } from "remotion";
import { Mots } from "./Commun";
import { C, FPS } from "./theme";

const Fond: React.FC<{ src: string; t: number; flou?: number }> = ({ src, t, flou }) => (
  <AbsoluteFill style={{ filter: flou ? `blur(${flou}px)` : undefined, transform: flou ? "scale(1.08)" : undefined }}>
    <Freeze frame={0}><OffthreadVideo src={staticFile(src)} muted trimBefore={Math.round(t * FPS)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></Freeze>
  </AbsoluteFill>
);

export const MiniatureDevine: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.nuit }}>
    <Fond src="reels/moai.mp4" t={2} />
    <AbsoluteFill style={{ background: "linear-gradient(rgba(0,0,0,.4), rgba(0,0,0,0) 40%)" }} />
    <Mots texte={"WHERE IN JAPAN\nIS *THIS?*"} de={0} a={1} y={300} taille={112} pose />
  </AbsoluteFill>
);

export const MiniatureDefi: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.nuit }}>
    <Fond src="reels/etang.mp4" t={1} flou={40} />
    <Mots texte={"CAN YOU GUESS\n*THIS PLACE?*\n6 TRIES"} de={0} a={1} y={520} taille={118} pose />
  </AbsoluteFill>
);
