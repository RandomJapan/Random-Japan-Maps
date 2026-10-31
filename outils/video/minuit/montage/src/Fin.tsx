// La fin (18 → 22,5 s) : la musique repart d'un coup ; tout le Japon la nuit, Halloween allumé (la carte recule, floue
// et assombrie), des chauves-souris qui passent ; le logo surgit dans sa pastille blanche, « TONIGHT IS THE » puis
// « LAST NIGHT » (les mots de la voix, quand elle les dit), l'adresse de la carte au deuxième coup de la musique,
// « Link in bio » avec la voix, et « FREE ». Plus d'une seconde de tenue à la fin.
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { Credits, Flash, MotTitre, plan, Prise } from "./Commun";
import { C, entre, expoSortie, hasard, POLICE, rebond, s } from "./theme";
import { T } from "./temps";

/** Une chauve-souris en ombre chinoise : ses ailes battent (échelle verticale). */
const ChauveSouris: React.FC<{ x: number; y: number; taille: number; battement: number }> = ({ x, y, taille, battement }) => (
  <svg width={taille} height={taille * 0.5} viewBox="0 0 100 50" style={{ position: "absolute", left: x - taille / 2, top: y - taille / 4, transform: `scaleY(${battement.toFixed(3)})`, filter: "drop-shadow(0 0 10px rgba(255,140,50,.35))" }}>
    <path fill="#0b0710" d="M50 18 C47 12 45 10 44 14 C40 10 30 6 18 8 C24 12 26 16 22 22 C16 20 8 22 2 28 C14 28 22 32 26 40 C30 34 38 32 44 36 C46 32 48 30 50 34 C52 30 54 32 56 36 C62 32 70 34 74 40 C78 32 86 28 98 28 C92 22 84 20 78 22 C74 16 76 12 82 8 C70 6 60 10 56 14 C55 10 53 12 50 18 Z" />
  </svg>
);

export const Fin: React.FC = () => {
  const f = useCurrentFrame();
  if (f < T.fin - 6) return null;
  const v = rebond(f, T.fin, 260, 24);
  const vLogo = rebond(f, T.logo);
  const vAdresse = rebond(f, T.adresse);
  const vBio = rebond(f, T.bio);
  const recul = 1.32 - 0.32 * v;
  return (
    <AbsoluteFill style={{ opacity: f < T.fin ? 0 : 1 }}>
      <AbsoluteFill style={{ perspective: 2200, perspectiveOrigin: "540px 960px", background: C.nuit }}>
        <Prise nom="mn-fin" debut={T.finPrise} transform={plan(f, 0, 0, 0, recul, 6 * (1 - v), 0, 0.7)} filtre="brightness(0.62) blur(3px)" />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(232,112,26,.16), rgba(6,4,12,.55) 75%)" }} />
      {/* les chauves-souris */}
      {[0, 1, 2, 3].map((i) => {
        const u = (f - T.fin - i * s(0.7)) / s(3.2);
        if (u < 0 || u > 1) return null;
        const x = -120 + 1320 * u, y = 260 + 900 * hasard(i + 3) - 140 * Math.sin(u * Math.PI);
        return <ChauveSouris key={i} x={x} y={y} taille={90 + 50 * hasard(i)} battement={0.35 + 0.65 * Math.abs(Math.sin((f + i * 7) / 3.2))} />;
      })}
      <Flash de={T.fin} force={0.6} duree={10} />
      {/* le logo, dans sa pastille blanche */}
      <div style={{
        position: "absolute", left: 540 - 160, top: 470 - 160, width: 320, height: 320, borderRadius: "50%", background: "#fff",
        boxShadow: "0 30px 80px rgba(0,0,0,.6), 0 0 0 10px rgba(255,255,255,.12), 0 0 90px rgba(255,140,50,.45)", display: "grid", placeItems: "center",
        transform: `scale(${Math.max(0, vLogo).toFixed(4)}) rotate(${(-14 * (1 - vLogo)).toFixed(2)}deg)`, opacity: f >= T.logo ? 1 : 0,
      }}>
        <Img src={staticFile("ui/logo.jpg")} style={{ width: 284, height: 284, borderRadius: "50%" }} />
      </div>
      {/* « Tonight is the last night. » */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 690, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <div style={{ display: "flex", gap: 24 }}>
          <MotTitre texte="TONIGHT" de={T.derniere} taille={88} />
          <MotTitre texte="IS" de={T.derniere + 4} taille={88} />
          <MotTitre texte="THE" de={T.derniere + 8} taille={88} />
        </div>
        <MotTitre texte="LAST NIGHT" emoji="🎃" de={T.lastNight} taille={112} pastille rotation={-3} />
      </div>
      {/* l'adresse de la carte, « Link in bio », gratuit */}
      <div style={{
        position: "absolute", left: 0, right: 0, top: 1085, display: "flex", justifyContent: "center",
        transform: `translateY(${(40 * (1 - vAdresse)).toFixed(1)}px) scale(${(0.7 + 0.3 * vAdresse).toFixed(4)})`, opacity: Math.min(1, Math.max(0, (f - T.adresse) / 5)),
      }}>
        <div style={{ fontFamily: POLICE, fontWeight: 800, fontSize: 46, color: C.noir, background: "#fff", borderRadius: 999, padding: "18px 40px", boxShadow: "0 12px 30px rgba(0,0,0,.4)" }}>
          map.randomjapanplace.com
        </div>
      </div>
      <div style={{
        position: "absolute", left: 0, right: 0, top: 1215, display: "flex", justifyContent: "center", alignItems: "center", gap: 22,
        transform: `translateY(${(36 * (1 - vBio)).toFixed(1)}px) scale(${(0.7 + 0.3 * vBio).toFixed(4)})`, opacity: Math.min(1, Math.max(0, (f - T.bio) / 5)),
      }}>
        <span style={{ fontFamily: POLICE, fontWeight: 900, fontSize: 54, color: "#fff", WebkitTextStroke: "6px #000", paintOrder: "stroke fill" }}>Link in bio ↑</span>
        <span style={{ fontFamily: POLICE, fontWeight: 900, fontSize: 40, color: "#fff", background: C.rouge, borderRadius: 12, padding: "8px 18px", transform: `rotate(-4deg) scale(${expoSortie(entre(f, T.bio + 6, T.bio + 18)).toFixed(3)})` }}>FREE</span>
      </div>
      <Credits opacite={0.85} />
    </AbsoluteFill>
  );
};
