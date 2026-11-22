// La miniature des vidéos 3 et 4 : le personnage qui sourit en tendant son téléphone, la vraie carte dans l'écran (une image du plan
// du hook, après ecran.py), et les mots du hook ; des pétales pour l'héroïne.
import React from "react";
import { AbsoluteFill, Freeze, OffthreadVideo, staticFile } from "remotion";
import { C, FPS, POLICE } from "../theme";
import { Petales } from "../fille/Accroche";

export type ProprietesMiniature = { src: string; t: number; lignes: string[]; petales?: boolean; zoom?: number; origine?: string };

export const MiniatureSuite: React.FC<ProprietesMiniature> = ({ src, t, lignes, petales = false, zoom = 1.08, origine = "50% 60%" }) => (
  <AbsoluteFill style={{ backgroundColor: C.nuit }}>
    <Freeze frame={0}>
      <OffthreadVideo src={staticFile(src)} muted trimBefore={Math.round(t * FPS)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})`, transformOrigin: origine }} />
    </Freeze>
    <AbsoluteFill style={{ background: "linear-gradient(rgba(0,0,0,.45) 0px, rgba(0,0,0,0) 640px)" }} />
    {petales && <Petales de={-10} a={100} n={22} z={5} />}
    <div style={{ position: "absolute", left: 40, right: 40, top: 200, display: "flex", flexDirection: "column", alignItems: "center", transform: "rotate(-3deg)", zIndex: 10 }}>
      {lignes.map((l, i) => (
        <div key={i} style={{ fontFamily: POLICE, fontWeight: 900, fontSize: 100, lineHeight: 1.06, whiteSpace: "nowrap", letterSpacing: -1 }}>
          {l.split("*").map((m, j) => j % 2
            ? <span key={j} style={{ background: C.rouge, color: "#fff", padding: "0 16px", borderRadius: 14, border: `7px solid ${C.encre}`, boxShadow: `5px 7px 0 ${C.encre}`, display: "inline-block", transform: "rotate(-2deg)", margin: "4px 4px" }}>{m}</span>
            : <span key={j} style={{ color: "#fff", WebkitTextStroke: `13px ${C.encre}`, paintOrder: "stroke fill" }}>{m}</span>)}
        </div>
      ))}
    </div>
  </AbsoluteFill>
);
