// L'écran de fin (2 s, en option) : la vraie carte qui tourne doucement autour du lieu, son épingle seule (prise filmée par
// fabriquer.py avec fin.js), et l'adresse en grand (sur YouTube, les liens des Shorts ne sont pas cliquables). Au-dessus de la
// légende de TikTok et à gauche de ses boutons.
import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { ajuster } from "./texte";
import { borne, EMOJI, ressort, TIKTOK } from "./theme";

export type PropsFin = { fps: number; duree: number; video: string; nom: string };

const POLICE = `${TIKTOK}, ${EMOJI}, sans-serif`;
const ENCRE = "#35251a", ROUGE = "#a8321f";

export const Fin: React.FC<PropsFin> = ({ fps, video, nom }) => {
  const t = useCurrentFrame() / fps;
  const a = ressort(t - 0.08), b = ressort(t - 0.28);
  const g = ajuster(`${nom} is on my map`, 900, 70, 46, 0.6);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <OffthreadVideo src={staticFile(video)} muted style={{ width: "100%", height: "100%" }} />
      {/* un voile en haut et en bas pour que le texte se lise sur la carte */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.4) 100%)" }} />
      <div style={{ position: "absolute", left: 40, right: 40, top: 250, display: "flex", flexDirection: "column", alignItems: "center",
        fontFamily: POLICE, textAlign: "center", transform: `scale(${0.8 + 0.2 * a})`, opacity: borne(a * 1.6) }}>
        {g.lignes.map((ligne, k) => (
          <div key={k} style={{ color: "#fff", WebkitTextStroke: `${g.taille * 0.14}px #000`, paintOrder: "stroke fill", fontWeight: 900,
            fontSize: g.taille, lineHeight: 1.08, whiteSpace: "nowrap" }}>{ligne}</div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1180, display: "flex", flexDirection: "column", alignItems: "center",
        fontFamily: POLICE, transform: `translateY(${(1 - b) * 40}px) scale(${0.85 + 0.15 * b})`, opacity: borne(b * 1.6) }}>
        <div style={{ color: "#fff", WebkitTextStroke: "8px #000", paintOrder: "stroke fill", fontWeight: 900, fontSize: 46, marginBottom: 18 }}>
          Free 3D map of Japan 🗾
        </div>
        <div style={{ background: "#fff", color: ENCRE, borderRadius: 999, padding: "22px 44px", fontWeight: 900, fontSize: 64,
          boxShadow: `0 10px 30px rgba(0,0,0,0.45), 0 0 0 6px ${ROUGE}` }}>
          map.randomjapanplace.com
        </div>
      </div>
    </AbsoluteFill>
  );
};
