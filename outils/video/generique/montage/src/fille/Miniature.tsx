// La miniature de la vidéo 2 : l'héroïne qui fixe l'objectif (l'image 0 de la vidéo), les mots du hook, des pétales, et en bas à
// droite son téléphone penché vers nous avec la vraie carte dessus (le Japon de tn-japon et ses épingles).
import React from "react";
import { AbsoluteFill, Freeze, OffthreadVideo, staticFile } from "remotion";
import { C, FPS, POLICE } from "../theme";
import { Petales } from "./Accroche";

const Image_: React.FC<{ src: string; t: number; style?: React.CSSProperties }> = ({ src, t, style }) => (
  <Freeze frame={0}>
    <OffthreadVideo src={staticFile(src)} muted trimBefore={Math.round(t * FPS)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", ...style }} />
  </Freeze>
);

export const MiniatureFille: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.nuit }}>
    <Image_ src="clips/fille-coupe.mp4" t={0.6} style={{ transform: "scale(1.12)", transformOrigin: "40% 34%" }} />
    <AbsoluteFill style={{ background: "linear-gradient(rgba(0,0,0,.45) 0px, rgba(0,0,0,0) 640px)" }} />
    {/* le téléphone et la vraie carte */}
    <div style={{
      position: "absolute", left: 560, top: 1080, width: 430, height: 860, borderRadius: 64, background: "#111", padding: 18,
      transform: "rotate(9deg)", boxShadow: `0 0 0 6px ${C.encre}, 0 30px 80px rgba(0,0,0,.6), 0 0 60px rgba(255,255,255,.35)`,
    }}>
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 48, overflow: "hidden" }}>
        <Image_ src="rushes/tn-japon.mp4" t={1.2} style={{ transform: "scale(1.05)" }} />
        <div style={{ position: "absolute", left: "50%", top: 0, width: 150, height: 34, marginLeft: -75, background: "#111", borderRadius: "0 0 20px 20px" }} />
      </div>
    </div>
    <Petales de={-10} a={100} n={22} z={5} />
    <div style={{ position: "absolute", left: 40, right: 40, top: 200, display: "flex", flexDirection: "column", alignItems: "center", transform: "rotate(-3deg)", zIndex: 10 }}>
      {["IF MY *JAPAN MAP*", "HAD AN *ANIME*", "OPENING 2 🌸"].map((l, i) => (
        <div key={i} style={{ fontFamily: POLICE, fontWeight: 900, fontSize: 100, lineHeight: 1.06, whiteSpace: "nowrap", letterSpacing: -1 }}>
          {l.split("*").map((m, j) => j % 2
            ? <span key={j} style={{ background: C.rouge, color: "#fff", padding: "0 16px", borderRadius: 14, border: `7px solid ${C.encre}`, boxShadow: `5px 7px 0 ${C.encre}`, display: "inline-block", transform: "rotate(-2deg)", margin: "4px 4px" }}>{m}</span>
            : <span key={j} style={{ color: "#fff", WebkitTextStroke: `13px ${C.encre}`, paintOrder: "stroke fill" }}>{m}</span>)}
        </div>
      ))}
    </div>
  </AbsoluteFill>
);
