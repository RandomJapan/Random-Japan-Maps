// La fin (temps 74 → la fin) : tout le Japon et ses points, flou et assombri, des rayons de lumière ; le titre ランダム・ジャパン
// revient, le logo, « EXPLORE JAPAN IN 3D » ; sur « Let's go! » de la chanson, « FREE · LINK IN BIO » et l'adresse claquent.
import React from "react";
import { AbsoluteFill, Freeze, Img, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { Vitesse } from "./Commun";
import { C, entre, expoSortie, POLICE, rebond, s, TITRE } from "./theme";
import { T } from "./temps";

/** de : le carton arrive ; de2 : « FREE · LINK IN BIO » (sur « Let's go! ») ; la vidéo 2 donne les siens, et sa couleur d'ombre. */
export const Fin: React.FC<{ de?: number; de2?: number; ombre?: string }> = ({ de = T.fin, de2 = T.allons, ombre = C.rouge }) => {
  const f = useCurrentFrame();
  if (f < de) return null;
  const g = f - de;
  const vTitre = rebond(f, de, 320, 17), vLogo = rebond(f, de + 8, 300, 16), vTexte = rebond(f, de + 14), vBouton = rebond(f, de2, 420, 20), vAdr = rebond(f, de2 + 8);
  const rayons = expoSortie(entre(g, 0, 18));
  const ligne = (texte: string, k: number) => (
    <div style={{
      fontFamily: TITRE, fontSize: 132, lineHeight: 1, color: "#fff", WebkitTextStroke: `12px ${C.encre}`, paintOrder: "stroke fill", whiteSpace: "nowrap",
      textShadow: `9px 11px 0 ${ombre}, 14px 17px 0 ${C.encre}`, transform: `translateX(${((k ? 1 : -1) * 400 * (1 - vTitre)).toFixed(1)}px)`,
    }}>{texte}</div>
  );
  return (
    <AbsoluteFill style={{ zIndex: 98 }}>
      <AbsoluteFill style={{ filter: "blur(10px) brightness(.45) saturate(1.2)", transform: "scale(1.1)" }}>
        <Freeze frame={0}><OffthreadVideo src={staticFile("rushes/tn-japon.mp4")} muted trimBefore={s(1.0)} style={{ width: "100%", height: "100%" }} /></Freeze>
      </AbsoluteFill>
      <AbsoluteFill style={{
        background: "repeating-conic-gradient(from 0deg at 50% 820px, rgba(255,246,220,.5) 0deg 6deg, rgba(255,246,220,0) 6deg 16deg)",
        WebkitMaskImage: "radial-gradient(circle at 50% 820px, #000 0, rgba(0,0,0,.6) 420px, transparent 980px)",
        opacity: rayons, transform: `rotate(${(g * 0.3).toFixed(2)}deg) scale(${(0.6 + 0.4 * rayons).toFixed(3)})`, transformOrigin: "50% 820px",
      }} />
      <Vitesse de={de} a={de + 24} cx={540} cy={820} rx={360} ry={560} force={0.7} z={1} />
      <AbsoluteFill style={{ background: "#fff", opacity: 0.85 * (1 - entre(g, 0, 8)) }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 290, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ transform: `rotate(-4deg) scale(${(1.6 - 0.6 * vTitre).toFixed(4)})`, display: "flex", flexDirection: "column", alignItems: "center" }}>
          {ligne("ランダム", 0)}
          {ligne("ジャパン", 1)}
        </div>
        <div style={{
          marginTop: 46, width: 250, height: 250, borderRadius: "50%", background: "#fff", display: "grid", placeItems: "center",
          boxShadow: `0 30px 90px rgba(0,0,0,.6), 0 0 0 10px ${C.encre}`, transform: `scale(${Math.max(0, vLogo).toFixed(4)}) rotate(${(-18 * (1 - vLogo)).toFixed(2)}deg)`,
        }}>
          <Img src={staticFile("ui/logo.jpg")} style={{ width: 226, height: 226, borderRadius: "50%" }} />
        </div>
        <div style={{
          marginTop: 40, fontFamily: POLICE, fontWeight: 900, fontSize: 88, lineHeight: 1.02, textAlign: "center", color: "#fff", padding: "0 60px",
          WebkitTextStroke: `13px ${C.encre}`, paintOrder: "stroke fill", textShadow: `6px 8px 0 ${ombre}`,
          opacity: f >= de + 14 ? 1 : 0, transform: `translateY(${(60 * (1 - vTexte)).toFixed(1)}px) scale(${(0.7 + 0.3 * vTexte).toFixed(4)}) skewX(-6deg)`,
        }}>EXPLORE JAPAN<br />IN 3D</div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, marginTop: 34, opacity: f >= de2 ? 1 : 0 }}>
          <div style={{
            fontFamily: POLICE, fontWeight: 900, fontSize: 64, color: "#fff", background: C.rouge, border: `7px solid ${C.encre}`, borderRadius: 999,
            padding: "12px 54px", boxShadow: `0 9px 0 ${C.rougeFonce}, 0 9px 0 7px ${C.encre}, 0 30px 60px rgba(0,0,0,.45)`,
            transform: `scale(${(1.6 - 0.6 * vBouton).toFixed(4)}) rotate(${(-3 * (1 - vBouton) - 1.5).toFixed(2)}deg)`,
          }}>FREE · LINK IN BIO</div>
          <div style={{
            fontFamily: POLICE, fontWeight: 800, fontSize: 42, color: C.encre, background: C.papier, border: `6px solid ${C.encre}`, borderRadius: 999,
            padding: "8px 34px", opacity: f >= de2 + 8 ? 1 : 0, transform: `translateY(${(40 * (1 - vAdr)).toFixed(1)}px)`,
          }}>map.randomjapanplace.com</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
