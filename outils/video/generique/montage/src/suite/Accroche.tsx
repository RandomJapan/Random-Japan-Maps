// Le hook des vidéos 3 et 4 (image 0 → T.carte) : le plan animé du téléphone dès l'image 0 (le héros qui surgit dans le cadre,
// l'héroïne qui se retourne : les rushes du propriétaire redessinés par FLUX, la vraie carte posée dans l'écran par ecran.py, qui
// fait aussi la plongée jusqu'au cadrage exact du plan de la carte), sous « IF MY JAPAN MAP HAD AN ANIME OPENING 3 / 4 » ; le plan
// s'efface sur ses 3 dernières images, sur une image identique : la carte arrive sans raccord à la reprise du refrain.
import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { C, entre, expoEntree, POLICE, rebond } from "../theme";
import { Vitesse } from "../Commun";
import { Petales } from "../fille/Accroche";

/** Le texte du hook, dès l'image 0 (c'est aussi la couverture) ; il part juste avant la carte (les mots du refrain arrivent). */
export const Texte: React.FC<{ lignes: string[]; fin: number; pouls?: number[] }> = ({ lignes, fin, pouls = [] }) => {
  const f = useCurrentFrame();
  if (f >= fin) return null;
  const sortie = expoEntree(entre(f, fin - 8, fin));
  // un petit coup sur certains temps de la chanson
  const coup = pouls.reduce((m, p) => (f >= p ? Math.max(m, 1 - rebond(f, p, 500, 20)) : m), 0);
  return (
    <div style={{
      position: "absolute", left: 40, right: 40, top: 236, zIndex: 120, display: "flex", flexDirection: "column", alignItems: "center",
      transform: `translateY(${(-60 * sortie).toFixed(1)}px) rotate(${(-3 + 2 * coup).toFixed(2)}deg) scale(${(1 + 0.05 * coup + 0.2 * sortie).toFixed(3)})`, opacity: 1 - sortie,
    }}>
      {lignes.map((l, i) => (
        <div key={i} style={{ fontFamily: POLICE, fontWeight: 900, fontSize: 92, lineHeight: 1.06, whiteSpace: "nowrap", letterSpacing: -1 }}>
          {l.split("*").map((m, j) => j % 2
            ? <span key={j} style={{ background: C.rouge, color: "#fff", padding: "0 16px", borderRadius: 14, border: `7px solid ${C.encre}`, boxShadow: `5px 7px 0 ${C.encre}`, display: "inline-block", transform: "rotate(-2deg)", margin: "4px 4px" }}>{m}</span>
            : <span key={j} style={{ color: "#fff", WebkitTextStroke: `13px ${C.encre}`, paintOrder: "stroke fill", textShadow: "0 8px 24px rgba(0,0,0,.5)" }}>{m}</span>)}
        </div>
      ))}
    </div>
  );
};

export const AccrocheTel: React.FC<{
  src: string; carte: number; lignes: string[]; pouls?: number[]; petales?: boolean;
  vitesses?: { de: number; a: number; cx: number; cy: number; rx?: number; ry?: number; force?: number }[];
}> = ({ src, carte, lignes, pouls, petales = false, vitesses = [] }) => {
  const f = useCurrentFrame();
  if (f >= carte + 2) return null;
  return (
    <AbsoluteFill style={{ zIndex: 100 }}>
      <AbsoluteFill style={{ opacity: 1 - entre(f, carte - 3, carte) }}>
        <OffthreadVideo src={staticFile(src)} muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      {petales && <Petales de={-6} a={carte - 20} />}
      {vitesses.map((v, i) => <Vitesse key={i} {...v} z={105} />)}
      <Texte lignes={lignes} fin={carte} pouls={pouls} />
    </AbsoluteFill>
  );
};
