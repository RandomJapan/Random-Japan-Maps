// La fin (25 → 30 s) : la carte recule et s'assombrit (Carte.tsx) ; le logo apparaît au centre dans une pastille
// blanche, puis la phrase de conclusion, et à 27,5 s le texte en italique sort du flou, mot par mot. L'adresse de la
// carte suit, avec « link in bio ». Les titres reprennent l'identité du site (Zen Antique, IM Fell English en
// italique, le papier clair).
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { C, entre, expoSortie, FELL, POLICE_TIKTOK, rebond, s, TITRE } from "./theme";
import { T } from "./temps";

const Mot: React.FC<{ texte: string; depart: number; style: React.CSSProperties; flou?: boolean }> = ({ texte, depart, style, flou }) => {
  const f = useCurrentFrame();
  const v = rebond(f, depart), u = expoSortie(entre(f, depart, depart + s(0.45)));
  return (
    <span style={{
      display: "inline-block", opacity: flou ? u : Math.min(1, Math.max(0, (f - depart) / 5)),
      transform: flou ? `translateY(${(22 * (1 - u)).toFixed(1)}px)` : `translateY(${(46 * (1 - v)).toFixed(1)}px) scale(${(0.7 + 0.3 * v).toFixed(4)})`,
      filter: flou ? `blur(${(18 * (1 - u)).toFixed(2)}px)` : undefined, ...style,
    }}>{texte}</span>
  );
};

export const Fin: React.FC<{ bgm: boolean }> = ({ bgm }) => {
  const f = useCurrentFrame();
  if (f < T.fin) return null;
  const sombre = expoSortie(entre(f, T.fin, T.fin + s(0.9)));
  const vLogo = rebond(f, T.logo);
  const vAdresse = rebond(f, T.adresse);
  const phrase1 = ["Every", "place", "from", "my", "TikToks."], phrase2 = ["One", "map."];
  const italique = ["Your", "next", "trip", "starts", "here."];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 46%, rgba(6,14,16,.35), rgba(6,14,16,.85))", opacity: sombre }} />
      {/* le logo, dans sa pastille blanche */}
      <div style={{
        position: "absolute", left: 540 - 175, top: 520 - 175, width: 350, height: 350, borderRadius: "50%", background: "#fff",
        boxShadow: "0 30px 80px rgba(0,0,0,.55), 0 0 0 10px rgba(255,255,255,.12)", display: "grid", placeItems: "center",
        transform: `scale(${Math.max(0, vLogo).toFixed(4)}) rotate(${(-14 * (1 - vLogo)).toFixed(2)}deg)`, opacity: f >= T.logo ? 1 : 0,
      }}>
        <Img src={staticFile("tiktok/avatar.jpg")} style={{ width: 312, height: 312, borderRadius: "50%" }} />
      </div>
      {/* la phrase de conclusion */}
      <div style={{ position: "absolute", left: 60, right: 60, top: 790, textAlign: "center", color: C.clair, fontFamily: TITRE, textShadow: "0 4px 24px rgba(0,0,0,.6)" }}>
        <div style={{ fontSize: 74, lineHeight: 1.15, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 20px" }}>
          {phrase1.map((m, i) => <Mot key={m} texte={m} depart={T.phrase + i * 4} style={{}} />)}
        </div>
        <div style={{ fontSize: 118, lineHeight: 1.25, marginTop: 6, display: "flex", justifyContent: "center", gap: "0 30px" }}>
          {phrase2.map((m, i) => <Mot key={m} texte={m} depart={T.phrase + 26 + i * 6} style={{ color: "#fff" }} />)}
        </div>
      </div>
      {/* le texte en italique, mot par mot, sorti du flou */}
      <div style={{ position: "absolute", left: 40, right: 40, top: 1135, textAlign: "center", fontFamily: FELL, fontStyle: "italic", fontSize: 74,
        color: C.papier, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 22px", textShadow: "0 3px 18px rgba(0,0,0,.6)" }}>
        {italique.map((m, i) => <Mot key={m} texte={m} depart={T.italique + i * 8} style={{}} flou />)}
      </div>
      {/* l'adresse de la carte */}
      <div style={{
        position: "absolute", left: 0, right: 0, top: 1290, display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
        transform: `translateY(${(40 * (1 - vAdresse)).toFixed(1)}px) scale(${(0.7 + 0.3 * vAdresse).toFixed(4)})`, opacity: Math.min(1, Math.max(0, (f - T.adresse) / 5)),
      }}>
        <div style={{ fontFamily: POLICE_TIKTOK, fontWeight: 800, fontSize: 44, color: C.noir, background: "#fff", borderRadius: 999, padding: "16px 38px", boxShadow: "0 12px 30px rgba(0,0,0,.35)" }}>
          map.randomjapanplace.com
        </div>
        <div style={{ fontFamily: POLICE_TIKTOK, fontWeight: 700, fontSize: 36, color: "#fff", textShadow: "0 2px 10px rgba(0,0,0,.6)" }}>Link in bio ↑</div>
      </div>
      {bgm && (
        <div style={{ position: "absolute", left: 30, bottom: 40, fontFamily: POLICE_TIKTOK, fontSize: 23, fontWeight: 600, color: "rgba(255,255,255,.85)", textShadow: "0 1px 4px rgba(0,0,0,.6)" }}>
          Music: Amenoshita3 · PeriTune (CC BY 4.0)
        </div>
      )}
    </AbsoluteFill>
  );
};
