// La fin (temps 42 → 48) : tout le Japon, flou et assombri, le logo dans ses rayons de lumière, « EXPLORE JAPAN IN 3D » au premier
// coup de la musique, « FREE · LINK IN BIO » et l'adresse au second. Plus d'une seconde de tenue.
import React from "react";
import { AbsoluteFill, Freeze, Img, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { C, entre, expoSortie, POLICE, rebond, s, t } from "./theme";
import { T } from "./temps";

export const Fin: React.FC = () => {
  const f = useCurrentFrame();
  const de = T.fin, de2 = t(44);
  if (f < de) return null;
  const g = f - de;
  const vLogo = rebond(f, de, 300, 16), vTitre = rebond(f, de + 6), vBouton = rebond(f, de2, 420, 20), vAdr = rebond(f, de2 + 8);
  const rayons = expoSortie(entre(g, 0, 18));
  return (
    <AbsoluteFill style={{ zIndex: 100 }}>
      <AbsoluteFill style={{ filter: "blur(12px) brightness(.5)", transform: "scale(1.1)" }}>
        <Freeze frame={0}><OffthreadVideo src={staticFile("rushes/ja-plongee.mp4")} muted trimBefore={s(0.72)} style={{ width: "100%", height: "100%" }} /></Freeze>
      </AbsoluteFill>
      <AbsoluteFill style={{
        background: "repeating-conic-gradient(from 0deg at 50% 640px, rgba(255,246,220,.55) 0deg 7deg, rgba(255,246,220,0) 7deg 18deg)",
        WebkitMaskImage: "radial-gradient(circle at 50% 640px, #000 0, rgba(0,0,0,.6) 380px, transparent 900px)",
        opacity: rayons, transform: `rotate(${(g * 0.25).toFixed(2)}deg) scale(${(0.6 + 0.4 * rayons).toFixed(3)})`, transformOrigin: "50% 640px",
      }} />
      <AbsoluteFill style={{ background: "#fff", opacity: 0.85 * (1 - entre(g, 0, 8)) }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 440, display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
        <div style={{
          width: 340, height: 340, borderRadius: "50%", background: "#fff", display: "grid", placeItems: "center",
          boxShadow: "0 30px 90px rgba(0,0,0,.6), 0 0 0 12px rgba(255,255,255,.18)",
          transform: `scale(${Math.max(0, 0.2 + 0.8 * vLogo).toFixed(4)}) rotate(${(-18 * (1 - vLogo)).toFixed(2)}deg)`,
        }}>
          <Img src={staticFile("ui/logo.jpg")} style={{ width: 306, height: 306, borderRadius: "50%" }} />
        </div>
        <div style={{
          fontFamily: POLICE, fontWeight: 900, fontSize: 96, lineHeight: 1.02, textAlign: "center", color: "#fff", padding: "0 60px",
          WebkitTextStroke: `14px ${C.encre}`, paintOrder: "stroke fill", textShadow: "0 8px 30px rgba(0,0,0,.5)",
          opacity: f >= de + 6 ? 1 : 0, transform: `translateY(${(60 * (1 - vTitre)).toFixed(1)}px) scale(${(0.7 + 0.3 * vTitre).toFixed(4)})`,
        }}>EXPLORE JAPAN<br />IN 3D</div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22, opacity: f >= de2 ? 1 : 0 }}>
          <div style={{
            fontFamily: POLICE, fontWeight: 900, fontSize: 64, color: "#fff", background: C.rouge, border: `7px solid ${C.encre}`, borderRadius: 999,
            padding: "14px 56px", boxShadow: `0 9px 0 ${C.rougeFonce}, 0 9px 0 7px ${C.encre}, 0 30px 60px rgba(0,0,0,.45)`,
            transform: `scale(${(1.6 - 0.6 * vBouton).toFixed(4)}) rotate(${(-3 * (1 - vBouton) - 1.5).toFixed(2)}deg)`,
          }}>FREE · LINK IN BIO</div>
          <div style={{
            fontFamily: POLICE, fontWeight: 800, fontSize: 44, color: C.encre, background: C.papier, border: `6px solid ${C.encre}`, borderRadius: 999,
            padding: "10px 36px", opacity: f >= de2 + 8 ? 1 : 0, transform: `translateY(${(40 * (1 - vAdr)).toFixed(1)}px)`,
          }}>map.randomjapanplace.com</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
