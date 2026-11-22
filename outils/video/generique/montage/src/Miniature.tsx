// La miniature à mettre sur TikTok : moitié vrai, moitié animé (le propriétaire qui fixe l'objectif, à gauche de la lame ; le héros
// d'animé qui sourit et sort son téléphone, à droite ; chacun décalé pour que son visage tombe de son côté), et les mots du hook.
import React from "react";
import { AbsoluteFill, Freeze, OffthreadVideo, staticFile } from "remotion";
import { C, FPS, POLICE } from "./theme";

const Image_: React.FC<{ src: string; t: number; transform?: string }> = ({ src, t, transform }) => (
  <Freeze frame={0}>
    <OffthreadVideo src={staticFile(src)} muted trimBefore={Math.round(t * FPS)} style={{ position: "absolute", inset: 0, width: 1080, height: 1920, objectFit: "cover", transform }} />
  </Freeze>
);

export const Miniature: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.nuit }}>
    <Image_ src="clips/vrai-coupe.mp4" t={0.15} transform="translateX(-170px) scale(1.18)" />
    <AbsoluteFill style={{ clipPath: "polygon(1080px 0, 1080px 1920px, 330px 1920px, 760px 0)" }}><Image_ src="clips/anime-flux.mp4" t={1.4} transform="translateX(250px) scale(1.12)" /></AbsoluteFill>
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <line x1={760} y1={0} x2={330} y2={1920} stroke="#fff" strokeWidth={14} style={{ filter: "drop-shadow(0 0 18px #fff) drop-shadow(0 0 40px #9ff)" }} />
    </svg>
    <AbsoluteFill style={{ background: "linear-gradient(rgba(0,0,0,.45) 0px, rgba(0,0,0,0) 640px)" }} />
    <div style={{ position: "absolute", left: 40, right: 40, top: 200, display: "flex", flexDirection: "column", alignItems: "center", transform: "rotate(-3deg)" }}>
      {["IF MY *JAPAN MAP*", "HAD AN *ANIME*", "OPENING ⚔️"].map((l, i) => (
        <div key={i} style={{ fontFamily: POLICE, fontWeight: 900, fontSize: 100, lineHeight: 1.06, whiteSpace: "nowrap", letterSpacing: -1 }}>
          {l.split("*").map((m, j) => j % 2
            ? <span key={j} style={{ background: C.rouge, color: "#fff", padding: "0 16px", borderRadius: 14, border: `7px solid ${C.encre}`, boxShadow: `5px 7px 0 ${C.encre}`, display: "inline-block", transform: "rotate(-2deg)", margin: "4px 4px" }}>{m}</span>
            : <span key={j} style={{ color: "#fff", WebkitTextStroke: `13px ${C.encre}`, paintOrder: "stroke fill" }}>{m}</span>)}
        </div>
      ))}
    </div>
  </AbsoluteFill>
);
